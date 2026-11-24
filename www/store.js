/* Lớp dữ liệu: 2 chế độ dùng chung một giao diện.
   - LocalStore: chạy ngay trên máy, không cần mạng (dữ liệu mẫu + localStorage).
   - CloudStore: Firebase Auth + Firestore, nhắn tin thời gian thực giữa nhiều máy. */
(function () {
  'use strict';

  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* đầy bộ nhớ */ } }
  function directId(a, b) { return [a, b].sort().join('_'); }
  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/).filter(function (w) { return /[\p{L}\d]/u.test(w); });
    if (!p.length) return '?';
    var acr = p.find(function (w) { return w.length >= 2 && w.length <= 4 && w === w.toUpperCase() && /^\p{Lu}/u.test(w); });
    if (acr) return acr.length > 3 ? acr.slice(0, 2) : acr;
    var s = p.length > 1 ? p[0][0] + p[p.length - 1][0] : p[0][0];
    return s.toUpperCase();
  }

  /* ---------------- LocalStore ---------------- */
  function LocalStore() {
    this.mode = 'local';
    this.key = 'dao_local_db_v1';
    this.subs = { chats: [], msgs: {}, contacts: [], user: [] };
  }
  LocalStore.prototype._load = function () {
    var db = lsGet(this.key, null);
    if (!db) db = this._seed();
    this.db = db;
  };
  LocalStore.prototype._save = function () { lsSet(this.key, this.db); };
  LocalStore.prototype._seed = function () {
    var now = Date.now(), m = 60000;
    var people = [
      { uid: 'u_pm', name: 'Anh PM dự án', email: 'pm@vidu.vn' },
      { uid: 'u_mep', name: 'Kỹ sư MEP', email: 'mep@vidu.vn' },
      { uid: 'u_tc', name: 'Chỉ huy trưởng', email: 'cht@vidu.vn' }
    ];
    var chats = [
      { id: 'c_pm', name: 'Anh PM dự án', isGroup: false, project: true, members: ['me', 'u_pm'], lastText: 'Anh xem giúp em mục bê tông sàn.', lastAt: now - 20 * m, lastFrom: 'u_pm', unread: 2 },
      { id: 'c_ql', name: 'Ban QLDA – Dự án A', isGroup: true, project: true, members: ['me', 'u_pm', 'u_tc'], lastText: 'Đã nhận, em sẽ có mặt.', lastAt: now - 45 * m, lastFrom: 'me', unread: 0 },
      { id: 'c_tc', name: 'Đội thi công tầng G', isGroup: true, project: true, members: ['me', 'u_tc'], lastText: 'Ảnh nghiệm thu cốt thép sàn tầng G.', lastAt: now - 80 * m, lastFrom: 'u_tc', unread: 1 },
      { id: 'c_me', name: 'Kỹ sư MEP', isGroup: false, project: true, members: ['me', 'u_mep'], lastText: 'Ok, anh kiểm tra rồi phản hồi.', lastAt: now - 140 * m, lastFrom: 'me', unread: 0 }
    ];
    var msgs = {
      c_pm: [
        { id: uid(), from: 'u_pm', fromName: 'Anh PM dự án', text: 'Em gửi anh bảng tổng hợp khối lượng đợt 3 nhé.', at: now - 23 * m },
        { id: uid(), from: 'u_pm', fromName: 'Anh PM dự án', text: 'Anh xem giúp em mục bê tông sàn.', at: now - 20 * m }
      ],
      c_ql: [
        { id: uid(), from: 'u_pm', fromName: 'Anh PM dự án', text: 'Giao ban 14h chiều nay tại công trường.', at: now - 50 * m },
        { id: uid(), from: 'me', fromName: 'Tôi', text: 'Đã nhận, em sẽ có mặt.', at: now - 45 * m }
      ],
      c_tc: [{ id: uid(), from: 'u_tc', fromName: 'Chỉ huy trưởng', text: 'Ảnh nghiệm thu cốt thép sàn tầng G.', at: now - 80 * m }],
      c_me: [
        { id: uid(), from: 'u_mep', fromName: 'Kỹ sư MEP', text: 'Bản vẽ phối hợp điện nước đã cập nhật.', at: now - 150 * m },
        { id: uid(), from: 'me', fromName: 'Tôi', text: 'Ok, anh kiểm tra rồi phản hồi.', at: now - 140 * m }
      ]
    };
    var names = { me: 'Tôi' };
    people.forEach(function (p) { names[p.uid] = p.name; });
    chats.forEach(function (c) { c.memberNames = {}; c.members.forEach(function (u) { c.memberNames[u] = names[u]; }); c.createdBy = 'me'; });
    return { user: null, contacts: people, chats: chats, msgs: msgs };
  };
  LocalStore.prototype.init = function () { this._load(); return Promise.resolve(); };
  LocalStore.prototype._emit = function (kind, id) {
    var self = this;
    if (kind === 'user') this.subs.user.forEach(function (cb) { cb(self.me()); });
    if (kind === 'chats') this.subs.chats.forEach(function (cb) { cb(self._chats()); });
    if (kind === 'contacts') this.subs.contacts.forEach(function (cb) { cb(self.db.contacts.slice()); });
    if (kind === 'msgs') (this.subs.msgs[id] || []).forEach(function (cb) { cb((self.db.msgs[id] || []).slice()); });
  };
  LocalStore.prototype._chats = function () {
    return this.db.chats.map(function (c) { return Object.assign({}, c); });
  };
  LocalStore.prototype.me = function () {
    var u = this.db.user;
    return u ? { uid: 'me', name: u.name, email: u.email || '' } : null;
  };
  LocalStore.prototype.onUser = function (cb) {
    this.subs.user.push(cb); cb(this.me());
    var arr = this.subs.user;
    return function () { arr.splice(arr.indexOf(cb), 1); };
  };
  LocalStore.prototype.signUp = function (name) {
    this.db.user = { name: name, email: '' };
    var n = name;
    this.db.chats.forEach(function (c) { if (c.memberNames.me) c.memberNames.me = n; });
    this._save(); this._emit('user');
    return Promise.resolve();
  };
  LocalStore.prototype.signIn = LocalStore.prototype.signUp;
  LocalStore.prototype.resetPassword = function () { return Promise.reject(new Error('local')); };
  LocalStore.prototype.signOut = function () { this.db.user = null; this._save(); this._emit('user'); return Promise.resolve(); };
  LocalStore.prototype.updateProfile = function (name) { return this.signUp(name); };
  LocalStore.prototype.onChats = function (cb) {
    this.subs.chats.push(cb); cb(this._chats());
    var arr = this.subs.chats;
    return function () { arr.splice(arr.indexOf(cb), 1); };
  };
  LocalStore.prototype.onMessages = function (chatId, cb) {
    var arr = this.subs.msgs[chatId] = this.subs.msgs[chatId] || [];
    arr.push(cb); cb((this.db.msgs[chatId] || []).slice());
    return function () { arr.splice(arr.indexOf(cb), 1); };
  };
  LocalStore.prototype._chat = function (id) { return this.db.chats.find(function (c) { return c.id === id; }); };
  LocalStore.prototype.send = function (chatId, msg) {
    var me = this.me();
    var m = Object.assign({ id: uid(), from: 'me', fromName: me.name, at: Date.now() }, msg);
    (this.db.msgs[chatId] = this.db.msgs[chatId] || []).push(m);
    var c = this._chat(chatId);
    if (c) { c.lastText = msg.file ? (/^image\//.test(msg.file.type) ? '[Ảnh]' : '[Tệp] ' + msg.file.name) : msg.text; c.lastAt = m.at; c.lastFrom = 'me'; }
    this._save(); this._emit('msgs', chatId); this._emit('chats');
    return Promise.resolve();
  };
  LocalStore.prototype.deleteMessage = function (chatId, msgId) {
    this.db.msgs[chatId] = (this.db.msgs[chatId] || []).filter(function (m) { return m.id !== msgId; });
    this._save(); this._emit('msgs', chatId);
    return Promise.resolve();
  };
  LocalStore.prototype.markRead = function (chatId) {
    var c = this._chat(chatId);
    if (c && c.unread) { c.unread = 0; this._save(); this._emit('chats'); }
    return Promise.resolve();
  };
  LocalStore.prototype.createGroup = function (name, users, project) {
    var me = this.me();
    var c = { id: 'c_' + uid(), name: name, isGroup: true, project: !!project, members: ['me'], memberNames: { me: me.name }, createdBy: 'me', lastText: 'Nhóm vừa được tạo', lastAt: Date.now(), lastFrom: 'me', unread: 0 };
    users.forEach(function (u) { c.members.push(u.uid); c.memberNames[u.uid] = u.name; });
    this.db.chats.push(c); this.db.msgs[c.id] = [];
    this._save(); this._emit('chats');
    return Promise.resolve(c.id);
  };
  LocalStore.prototype.openDirect = function (user) {
    var id = 'c_' + directId('me', user.uid);
    var exist = this._chat(id) || this.db.chats.find(function (c) { return !c.isGroup && c.members.indexOf(user.uid) >= 0; });
    if (exist) return Promise.resolve(exist.id);
    var me = this.me();
    var c = { id: id, name: user.name, isGroup: false, project: false, members: ['me', user.uid], memberNames: { me: me.name }, createdBy: 'me', lastText: '', lastAt: Date.now(), lastFrom: 'me', unread: 0 };
    c.memberNames[user.uid] = user.name;
    this.db.chats.push(c); this.db.msgs[id] = [];
    this._save(); this._emit('chats');
    return Promise.resolve(id);
  };
  LocalStore.prototype.updateChat = function (chatId, patch) {
    var c = this._chat(chatId); if (!c) return Promise.resolve();
    Object.assign(c, patch); this._save(); this._emit('chats');
    return Promise.resolve();
  };
  LocalStore.prototype.addMembers = function (chatId, users) {
    var c = this._chat(chatId); if (!c) return Promise.resolve();
    users.forEach(function (u) { if (c.members.indexOf(u.uid) < 0) { c.members.push(u.uid); c.memberNames[u.uid] = u.name; } });
    this._save(); this._emit('chats');
    return Promise.resolve();
  };
  LocalStore.prototype.removeMember = function (chatId, memberUid) {
    var c = this._chat(chatId); if (!c) return Promise.resolve();
    c.members = c.members.filter(function (u) { return u !== memberUid; });
    delete c.memberNames[memberUid];
    if (memberUid === 'me') { this.db.chats = this.db.chats.filter(function (x) { return x.id !== chatId; }); delete this.db.msgs[chatId]; }
    this._save(); this._emit('chats');
    return Promise.resolve();
  };
  LocalStore.prototype.onContacts = function (cb) {
    this.subs.contacts.push(cb); cb(this.db.contacts.slice());
    var arr = this.subs.contacts;
    return function () { arr.splice(arr.indexOf(cb), 1); };
  };
  LocalStore.prototype.addContactByEmail = function (email, name) {
    var e = email.toLowerCase();
    if (this.db.contacts.some(function (c) { return (c.email || '').toLowerCase() === e; })) return Promise.reject(new Error('exists'));
    var c = { uid: 'u_' + uid(), name: name || email.split('@')[0], email: email };
    this.db.contacts.push(c); this._save(); this._emit('contacts');
    return Promise.resolve(c);
  };
  LocalStore.prototype.addContactByUid = function () { return Promise.reject(new Error('local')); };
  LocalStore.prototype.removeContact = function (cuid) {
    this.db.contacts = this.db.contacts.filter(function (c) { return c.uid !== cuid; });
    this._save(); this._emit('contacts');
    return Promise.resolve();
  };
  LocalStore.prototype.wipe = function () { try { localStorage.removeItem(this.key); } catch (e) { /* bỏ qua */ } return Promise.resolve(); };

  /* ---------------- CloudStore (Firebase) ---------------- */
  function CloudStore(config) {
    this.mode = 'cloud';
    this.config = config;
    this.user = null;
    this.profile = null;
  }
  CloudStore.prototype.init = function () {
    var self = this;
    if (!window.firebase) return Promise.reject(new Error('Thiếu thư viện Firebase'));
    firebase.initializeApp(this.config);
    this.auth = firebase.auth();
    this.fs = firebase.firestore();
    this.FV = firebase.firestore.FieldValue;
    if (this.config.emulatorHost) { /* chỉ dùng khi chạy thử với Firebase Emulator */
      this.auth.useEmulator('http://' + this.config.emulatorHost + ':9099', { disableWarnings: true });
      this.fs.useEmulator(this.config.emulatorHost, 8080);
    }
    return this.fs.enablePersistence({ synchronizeTabs: true }).catch(function () { /* trình duyệt không hỗ trợ: vẫn chạy online */ }).then(function () {
      return new Promise(function (resolve) {
        var first = true;
        self.auth.onAuthStateChanged(function (u) {
          self.user = u;
          var done = function () { if (first) { first = false; resolve(); } (self._userSubs || []).forEach(function (cb) { cb(self.me()); }); };
          if (!u) { self.profile = null; done(); return; }
          self.fs.collection('users').doc(u.uid).get().then(function (d) {
            self.profile = d.exists ? d.data() : null;
            if (!self.profile) return self._writeProfile(self._pendingName || u.displayName || (u.email || '').split('@')[0]);
          }).catch(function () { /* offline */ }).then(done);
        });
      });
    });
  };
  CloudStore.prototype._writeProfile = function (name) {
    var u = this.user;
    var p = { name: name, email: u.email || '', emailLower: (u.email || '').toLowerCase(), updatedAt: this.FV.serverTimestamp() };
    this.profile = p;
    return this.fs.collection('users').doc(u.uid).set(p, { merge: true });
  };
  CloudStore.prototype.me = function () {
    if (!this.user) return null;
    return { uid: this.user.uid, name: (this.profile && this.profile.name) || this.user.displayName || 'Tôi', email: this.user.email || '' };
  };
  CloudStore.prototype.onUser = function (cb) {
    (this._userSubs = this._userSubs || []).push(cb); cb(this.me());
    var arr = this._userSubs;
    return function () { arr.splice(arr.indexOf(cb), 1); };
  };
  CloudStore.prototype.signUp = function (name, email, pw) {
    var self = this;
    this._pendingName = name;
    return this.auth.createUserWithEmailAndPassword(email, pw).then(function (r) {
      self.user = r.user;
      return r.user.updateProfile({ displayName: name }).then(function () { return self._writeProfile(name); });
    }).then(function () { (self._userSubs || []).forEach(function (cb) { cb(self.me()); }); });
  };
  CloudStore.prototype.signIn = function (name, email, pw) { return this.auth.signInWithEmailAndPassword(email, pw); };
  CloudStore.prototype.resetPassword = function (email) { return this.auth.sendPasswordResetEmail(email); };
  CloudStore.prototype.signOut = function () { return this.auth.signOut(); };
  CloudStore.prototype.updateProfile = function (name) {
    var self = this;
    return this.user.updateProfile({ displayName: name }).then(function () { return self._writeProfile(name); })
      .then(function () { (self._userSubs || []).forEach(function (cb) { cb(self.me()); }); });
  };
  CloudStore.prototype._toMs = function (t) { return t && t.toMillis ? t.toMillis() : (typeof t === 'number' ? t : Date.now()); };
  CloudStore.prototype.onChats = function (cb, onErr) {
    var self = this, me = this.user.uid;
    return this.fs.collection('chats').where('members', 'array-contains', me).onSnapshot(function (snap) {
      cb(snap.docs.map(function (d) {
        var c = d.data({ serverTimestamps: 'estimate' });
        return Object.assign({}, c, { id: d.id, lastAt: self._toMs(c.lastAt), unread: (c.unread && c.unread[me]) || 0 });
      }));
    }, onErr);
  };
  CloudStore.prototype.onMessages = function (chatId, cb, onErr) {
    var self = this;
    return this.fs.collection('chats').doc(chatId).collection('messages').orderBy('at', 'desc').limit(150).onSnapshot(function (snap) {
      var arr = snap.docs.map(function (d) {
        var m = d.data({ serverTimestamps: 'estimate' });
        return Object.assign({}, m, { id: d.id, at: self._toMs(m.at), pending: d.metadata.hasPendingWrites });
      });
      cb(arr.reverse());
    }, onErr);
  };
  CloudStore.prototype.send = function (chatId, msg, chat) {
    var me = this.me(), FV = this.FV;
    var ref = this.fs.collection('chats').doc(chatId);
    var batch = this.fs.batch();
    batch.set(ref.collection('messages').doc(), Object.assign({ from: me.uid, fromName: me.name, at: FV.serverTimestamp() }, msg));
    var patch = { lastText: msg.file ? (/^image\//.test(msg.file.type) ? '[Ảnh]' : '[Tệp] ' + msg.file.name) : msg.text, lastAt: FV.serverTimestamp(), lastFrom: me.uid };
    (chat && chat.members || []).forEach(function (u) { if (u !== me.uid) patch['unread.' + u] = FV.increment(1); });
    batch.update(ref, patch);
    return batch.commit();
  };
  CloudStore.prototype.deleteMessage = function (chatId, msgId) {
    return this.fs.collection('chats').doc(chatId).collection('messages').doc(msgId).delete();
  };
  CloudStore.prototype.markRead = function (chatId) {
    var p = {}; p['unread.' + this.user.uid] = 0;
    return this.fs.collection('chats').doc(chatId).update(p).catch(function () { /* bỏ qua */ });
  };
  CloudStore.prototype._newChat = function (id, data) {
    var ref = id ? this.fs.collection('chats').doc(id) : this.fs.collection('chats').doc();
    data.createdBy = this.user.uid; data.createdAt = this.FV.serverTimestamp(); data.lastAt = this.FV.serverTimestamp();
    data.lastFrom = this.user.uid; data.unread = {};
    return ref.set(data).then(function () { return ref.id; });
  };
  CloudStore.prototype.createGroup = function (name, users, project) {
    var me = this.me();
    var data = { name: name, isGroup: true, project: !!project, members: [me.uid], memberNames: {}, lastText: 'Nhóm vừa được tạo' };
    data.memberNames[me.uid] = me.name;
    users.forEach(function (u) { data.members.push(u.uid); data.memberNames[u.uid] = u.name; });
    return this._newChat(null, data);
  };
  CloudStore.prototype.openDirect = function (user) {
    var self = this, me = this.me();
    var id = directId(me.uid, user.uid);
    var ref = this.fs.collection('chats').doc(id);
    return ref.get().then(function (d) {
      if (d.exists) return id;
      var data = { name: '', isGroup: false, project: false, members: [me.uid, user.uid], memberNames: {}, lastText: '' };
      data.memberNames[me.uid] = me.name; data.memberNames[user.uid] = user.name;
      return self._newChat(id, data);
    });
  };
  CloudStore.prototype.updateChat = function (chatId, patch) { return this.fs.collection('chats').doc(chatId).update(patch); };
  CloudStore.prototype.addMembers = function (chatId, users) {
    var FV = this.FV, p = { members: FV.arrayUnion.apply(null, users.map(function (u) { return u.uid; })) };
    users.forEach(function (u) { p['memberNames.' + u.uid] = u.name; });
    return this.fs.collection('chats').doc(chatId).update(p);
  };
  CloudStore.prototype.removeMember = function (chatId, memberUid) {
    var p = { members: this.FV.arrayRemove(memberUid) };
    p['memberNames.' + memberUid] = this.FV.delete();
    return this.fs.collection('chats').doc(chatId).update(p);
  };
  CloudStore.prototype.onContacts = function (cb, onErr) {
    return this.fs.collection('users').doc(this.user.uid).collection('contacts').onSnapshot(function (snap) {
      cb(snap.docs.map(function (d) { return Object.assign({ uid: d.id }, d.data()); }));
    }, onErr);
  };
  CloudStore.prototype._saveContact = function (uidC, data) {
    if (uidC === this.user.uid) return Promise.reject(new Error('self'));
    var c = { name: data.name || '', email: data.email || '' };
    return this.fs.collection('users').doc(this.user.uid).collection('contacts').doc(uidC).set(c).then(function () { return Object.assign({ uid: uidC }, c); });
  };
  CloudStore.prototype.addContactByEmail = function (email) {
    var self = this;
    return this.fs.collection('users').where('emailLower', '==', email.toLowerCase()).limit(1).get().then(function (s) {
      if (s.empty) throw new Error('notfound');
      return self._saveContact(s.docs[0].id, s.docs[0].data());
    });
  };
  CloudStore.prototype.addContactByUid = function (uidC) {
    var self = this;
    return this.fs.collection('users').doc(uidC).get().then(function (d) {
      if (!d.exists) throw new Error('notfound');
      return self._saveContact(d.id, d.data());
    });
  };
  CloudStore.prototype.removeContact = function (uidC) {
    return this.fs.collection('users').doc(this.user.uid).collection('contacts').doc(uidC).delete();
  };
  CloudStore.prototype.wipe = function () {
    var fs = this.fs;
    return this.auth.signOut().then(function () { return fs.clearPersistence ? fs.terminate().then(function () { return fs.clearPersistence(); }) : null; }).catch(function () { /* bỏ qua */ });
  };

  window.DaoStore = {
    create: function () {
      var cfg = lsGet('dao_firebase_config', null) || (window.DAO_CONFIG && window.DAO_CONFIG.FIREBASE);
      if (cfg && cfg.apiKey && cfg.projectId) return new CloudStore(cfg);
      return new LocalStore();
    },
    initials: initials,
    lsGet: lsGet,
    lsSet: lsSet
  };
})();
