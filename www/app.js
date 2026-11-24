/* Chat Khóa Đạo Pro – giao diện và luồng màn hình.
   Mọi chữ người dùng nhập đều đưa vào trang bằng textContent (không dùng innerHTML). */
(function () {
  'use strict';
  var CFG = window.DAO_CONFIG || {};
  var Sec = window.DaoSec;
  var LS = window.DaoStore;
  var NATIVE = window.DaoNative || null;
  var APP = document.getElementById('app');
  var MAX_FILE = 680 * 1024;

  /* ---------- Tiện ích DOM ---------- */
  function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') el.setAttribute('style', v);
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function circ(cx, cy, r) { return 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0'; }
  var ICONS = {
    lock: ['M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', 'M8 11V7a4 4 0 0 1 8 0v4'],
    unlock: ['M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', 'M8 11V7a4 4 0 0 1 7.8-1.3'],
    search: [circ(11, 11, 7), 'm20 20-3.5-3.5'],
    settings: [circ(12, 12, 3), 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'],
    plus: ['M12 5v14', 'M5 12h14'],
    users: [circ(9, 8, 3.5), 'M2.5 20a6.5 6.5 0 0 1 13 0', 'M16 4.5a3.5 3.5 0 0 1 0 7', 'M18 14a6 6 0 0 1 3.5 6'],
    user: [circ(12, 8, 4), 'M4 21a8 8 0 0 1 16 0'],
    userPlus: [circ(9, 8, 4), 'M2 21a7 7 0 0 1 14 0', 'M19 8v6', 'M16 11h6'],
    chat: ['M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z'],
    back: ['m15 18-6-6 6-6'],
    chev: ['m9 18 6-6-6-6'],
    send: ['M22 2 11 13', 'M22 2 15 22l-4-9-9-4z'],
    clip: ['m21 11-8.6 8.6a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4L15.6 7'],
    file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6'],
    image: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', circ(9, 9, 2), 'm21 15-5-5L5 21'],
    fp: ['M12 11v3a6 6 0 0 1-1.5 4', 'M8.5 9.5a4 4 0 0 1 7.5 2V14', 'M5.5 8a8 8 0 0 1 13.5 2', 'M16 17.5c.3-1 .5-2 .5-3.5', 'M8 13v1a9 9 0 0 1-1 4'],
    del: ['M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z', 'm15 10-4 4', 'm11 10 4 4'],
    shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
    bellOff: ['M18 8a6 6 0 0 0-9.3-5', 'M6.3 6.3A6 6 0 0 0 6 8c0 7-3 9-3 9h14', 'M13.7 21a2 2 0 0 1-3.4 0', 'M2 2l20 20'],
    bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'],
    clock: [circ(12, 12, 9), 'M12 7v5l3 2'],
    moon: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'],
    music: ['M9 18V5l12-2v13', circ(6, 18, 3), circ(18, 16, 3)],
    key: [circ(7.5, 15.5, 4.5), 'm21 2-9.6 9.6', 'm15.5 7.5 3 3L22 7l-3-3'],
    refresh: ['M21 12a9 9 0 1 1-2.6-6.4', 'M21 3v6h-6'],
    share: [circ(18, 5, 3), circ(6, 12, 3), circ(18, 19, 3), 'm8.6 13.5 6.8 4', 'm15.4 6.5-6.8 4'],
    logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
    trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6'],
    qr: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h3v3h-3z', 'M18 18h3v3h-3z'],
    scan: ['M3 7V5a2 2 0 0 1 2-2h2', 'M17 3h2a2 2 0 0 1 2 2v2', 'M21 17v2a2 2 0 0 1-2 2h-2', 'M7 21H5a2 2 0 0 1-2-2v-2', 'M7 12h10'],
    mail: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'm22 6-10 7L2 6'],
    x: ['M18 6 6 18', 'M6 6l12 12'],
    check: ['M20 6 9 17l-5-5'],
    info: [circ(12, 12, 9), 'M12 16v-4', 'M12 8h.01'],
    alert: [circ(12, 12, 9), 'M12 8v4', 'M12 16h.01'],
    server: ['M4 3h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z', 'M4 13h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z', 'M7 7h.01', 'M7 17h.01'],
    download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
    edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
    briefcase: ['M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z', 'M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2'],
    eyeOff: ['M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2', 'M6.6 6.6A17 17 0 0 0 2 12s3.5 8 10 8a10 10 0 0 0 5.4-1.6', 'M14.1 14.1a3 3 0 1 1-4.2-4.2', 'M2 2l20 20'],
    wifiOff: ['M2 2l20 20', 'M8.5 16.5a5 5 0 0 1 7 0', 'M5 12.9a10 10 0 0 1 5.2-2.8', 'M16.8 10.7A10 10 0 0 1 19 12.9', 'M12 20h.01'],
    copy: ['M9 9h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1z', 'M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1'],
    phone: ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M11 18h2'],
    book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z', 'M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5'],
    door: ['M13 4h3a2 2 0 0 1 2 2v14', 'M2 20h20', 'M13 4 6 5v15h7z', 'M10 12v.01']
  };
  function icon(name, size, sw) {
    var NS = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('width', size || 22); s.setAttribute('height', size || 22);
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', sw || 2); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    (ICONS[name] || []).forEach(function (d) { var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); s.appendChild(p); });
    return s;
  }
  function ibtn(name, label, onClick, cls) { return h('button', { class: 'ibtn ' + (cls || ''), 'aria-label': label, title: label, onClick: onClick }, icon(name)); }

  /* ---------- Trạng thái ---------- */
  var DEF_SET = { fp: false, auto: true, hide: true, dark: document.documentElement.getAttribute('data-theme') === 'dark', music: false, notify: true };
  var S = {
    store: null, me: null, chats: null, chatsErr: null, contacts: null,
    tab: 'chats', filter: 'all', q: '', cur: null, msgs: null, msgsErr: null, chatQ: '',
    set: Object.assign({}, DEF_SET, LS.lsGet('dao_settings', {})),
    subs: [], screenSubs: [], lastSeen: {}, online: navigator.onLine, installEvt: null, bio: null
  };
  function saveSet() { LS.lsSet('dao_settings', S.set); }
  var COLORS = ['#1550E8', '#047857', '#C2410C', '#7C3AED', '#0369A1', '#BE185D', '#B45309', '#0F766E'];
  function colorOf(id) { var n = 0; String(id).split('').forEach(function (c) { n = (n * 31 + c.charCodeAt(0)) >>> 0; }); return COLORS[n % COLORS.length]; }
  function avatar(id, name, size) {
    return h('div', { class: 'av', 'aria-hidden': 'true', style: 'width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.36) + 'px;background:' + colorOf(id) }, LS.initials(name));
  }
  function chatTitle(c) {
    if (c.isGroup || c.name) return c.name || 'Nhóm';
    var me = S.me && S.me.uid, n = c.memberNames || {};
    var other = (c.members || []).find(function (u) { return u !== me; });
    return (other && n[other]) || 'Cuộc trò chuyện';
  }
  function pad2(n) { return ('0' + n).slice(-2); }
  function fmtTime(ms, long) {
    if (!ms) return '';
    var d = new Date(ms), now = new Date();
    var hm = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    var days = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    if (long) return hm;
    if (days === 0) return hm;
    if (days === 1) return 'Hôm qua';
    if (days < 7) return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
    return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1);
  }
  function fmtDay(ms) {
    var d = new Date(ms), now = new Date();
    var days = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function fmtSize(b) { return b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd'); }

  /* ---------- Toast ---------- */
  var toastT;
  function toast(text, isErr) {
    var old = APP.querySelector('.toast'); if (old) old.remove();
    var t = h('div', { class: 'toast' + (isErr ? ' err' : ''), role: 'status' }, icon(isErr ? 'alert' : 'check', 18, 2.4), h('span', { text: text }));
    APP.appendChild(t);
    clearTimeout(toastT); toastT = setTimeout(function () { t.remove(); }, 2600);
  }
  function errText(e) {
    var c = (e && (e.code || e.message)) || '';
    var map = {
      'auth/invalid-email': 'Email không đúng định dạng',
      'auth/user-not-found': 'Chưa có tài khoản với email này',
      'auth/wrong-password': 'Sai mật khẩu',
      'auth/invalid-credential': 'Email hoặc mật khẩu không đúng',
      'auth/invalid-login-credentials': 'Email hoặc mật khẩu không đúng',
      'auth/email-already-in-use': 'Email này đã đăng ký, anh chọn Đăng nhập',
      'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự',
      'auth/network-request-failed': 'Không có mạng, anh kiểm tra kết nối',
      'auth/too-many-requests': 'Thử quá nhiều lần, đợi một lát rồi thử lại',
      'permission-denied': 'Máy chủ từ chối. Kiểm tra đã dán luật bảo mật Firestore chưa',
      'unavailable': 'Mất kết nối máy chủ, đang thử lại',
      notfound: 'Không tìm thấy người dùng này',
      exists: 'Người này đã có trong danh bạ',
      self: 'Đây là tài khoản của anh'
    };
    return map[c] || 'Có lỗi xảy ra, anh thử lại';
  }

  /* ---------- Điều hướng ---------- */
  var depth = 0;
  function mount(el, back) {
    S.screenSubs.forEach(function (f) { try { f(); } catch (e) { /* bỏ qua */ } }); S.screenSubs = [];
    closeSheet();
    var old = APP.querySelector('.screen');
    el.classList.add('screen'); if (back) el.classList.add('back');
    APP.insertBefore(el, APP.firstChild);
    if (old) old.remove();
  }
  function pushNav() { depth++; try { history.pushState({ d: depth }, ''); } catch (e) { /* bỏ qua */ } }
  function navBack() { if (depth > 0) history.back(); else goMain(true); }
  window.addEventListener('popstate', function () {
    depth = Math.max(0, depth - 1);
    if (sheetOpen()) { closeSheet(); return; }
    goMain(true);
  });
  /* Nút Back của Android (gọi từ app gốc). Trả về true nếu app đã xử lý. */
  window.DaoApp = {
    handleInvite: function (hash) { if (captureInvite(hash)) { if (S.screen === 'main') processInvite(); else if (S.ready) route(); } },
    onBack: function () {
      if (sheetOpen()) { closeSheet(); return true; }
      if (depth > 0) { history.back(); return true; }
      if (S.screen === 'main' && S.tab !== 'chats') { S.tab = 'chats'; renderMain(); return true; }
      return false;
    }
  };

  /* ---------- Sheet ---------- */
  var sheetEl = null;
  function sheetOpen() { return !!sheetEl; }
  function closeSheet() { if (sheetEl) { var s = sheetEl; sheetEl = null; if (s._onClose) s._onClose(); s.remove(); } }
  function openSheet(title, iconName, body, onClose) {
    closeSheet();
    var sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'grab' }),
      h('div', { style: 'display:flex;align-items:center;gap:8px' },
        h('h3', { style: 'flex:1' }, iconName ? icon(iconName, 20) : null, title),
        ibtn('x', 'Đóng', closeSheet)),
      body);
    var scrim = h('div', { class: 'scrim', onClick: function (e) { if (e.target === scrim) closeSheet(); } }, sheet);
    scrim._onClose = onClose;
    APP.appendChild(scrim);
    sheetEl = scrim;
    var f = sheet.querySelector('input,textarea'); if (f && !f.hasAttribute('data-nofocus')) setTimeout(function () { f.focus(); }, 250);
    return sheet;
  }
  function confirmSheet(title, desc, okText, danger, onOk) {
    openSheet(title, danger ? 'alert' : 'info', [
      h('p', { class: 'desc', text: desc }),
      h('div', { style: 'display:flex;gap:10px;margin-top:6px' },
        h('button', { class: 'btn sec', style: 'flex:1', onClick: closeSheet, text: 'Hủy' }),
        h('button', { class: 'btn ' + (danger ? 'danger' : 'pri'), style: 'flex:1', text: okText, onClick: function () { closeSheet(); onOk(); } }))
    ]);
  }
  function busy(btn, on, label) {
    if (on) { btn._label = btn._label || Array.prototype.slice.call(btn.childNodes); btn.disabled = true; clear(btn); btn.appendChild(h('span', { class: 'spin' })); if (label) btn.appendChild(document.createTextNode(label)); }
    else { btn.disabled = false; if (btn._label) { clear(btn); add(btn, btn._label); btn._label = null; } }
  }

  /* ---------- Khởi động ---------- */
  function boot() {
    mount(h('div', { class: 'welcome', style: 'align-items:center;justify-content:center' },
      h('div', { class: 'brand', style: 'width:72px;height:72px;border-radius:22px;background:#1550E8;color:#fff' }, icon('lock', 36, 2.2)),
      h('b', { style: 'font-size:18px', text: 'Chat Khóa Đạo Pro' }),
      h('span', { class: 'spin', style: 'border-color:var(--line);border-top-color:var(--pri);width:26px;height:26px' })));
    S.store = LS.create();
    S.store.init().then(function () {
      S.store.onUser(function (u) {
        var was = S.me; S.me = u;
        if (u && !was) startData();
        if (!u && was) stopData();
        if (S.ready) route();
      });
      S.ready = true; route();
    }).catch(function (e) {
      console.error(e);
      mount(h('div', { class: 'welcome', style: 'justify-content:center' },
        h('div', { class: 'card empty err' },
          h('div', { class: 'art' }, icon('wifiOff', 34)),
          h('b', { text: 'Không kết nối được máy chủ' }),
          h('p', { text: 'Cấu hình Firebase chưa đúng hoặc chưa có mạng.' }),
          h('button', { class: 'btn pri block', onClick: boot }, icon('refresh', 18), 'Thử lại'),
          h('button', { class: 'btn sec block', text: 'Dùng chế độ thử trên máy', onClick: function () { LS.lsSet('dao_firebase_config', null); location.reload(); } }))));
    });
  }
  function route() {
    if (!LS.lsGet('dao_onboarded', false)) return showWelcome();
    if (!S.me) return showAuth();
    if (!Sec.hasPin()) return S.screen === 'setpin' ? null : setupPin(function () { goMain(); setTimeout(processInvite, 300); });
    if (!S.screen || S.screen === 'auth' || S.screen === 'welcome' || S.screen === 'setpin') goMain();
    setTimeout(processInvite, 300);
  }

  /* ---------- Link mời ---------- */
  function readInvite(hash) {
    var m = /moi=([A-Za-z0-9]{10,40})/.exec(hash || '');
    if (m) return { type: 'user', uid: m[1] };
    m = /nhom=([A-Za-z0-9]{10,40})\.([A-Za-z0-9]{8,40})/.exec(hash || '');
    if (m) return { type: 'group', id: m[1], code: m[2] };
    return null;
  }
  function captureInvite(hash) {
    var inv = readInvite(hash);
    if (!inv) return false;
    LS.lsSet('dao_invite', inv);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* bỏ qua */ }
    return true;
  }
  function processInvite() {
    var inv = LS.lsGet('dao_invite', null);
    if (!inv || !S.me || S.screen !== 'main') return;
    LS.lsSet('dao_invite', null);
    if (S.store.mode !== 'cloud') { toast('Link mời cần app kết nối máy chủ', true); return; }
    if (inv.type === 'user') {
      if (inv.uid === S.me.uid) { toast('Đây là link mời của chính anh. Gửi link này cho người khác nhé'); return; }
      S.store.addContactByUid(inv.uid).then(function (u) {
        return S.store.openDirect(u).then(function (cid) { toast('Đã kết nối với ' + u.name); waitChat(cid, function () { openChat(cid); }); });
      }).catch(function (e) { toast(e && e.message === 'notfound' ? 'Link mời không hợp lệ' : errText(e), true); });
    } else {
      S.store.joinGroup(inv.id, inv.code).then(function (cid) { toast('Đã vào nhóm'); waitChat(cid, function () { openChat(cid); }); })
        .catch(function () { toast('Link mời nhóm không đúng hoặc đã bị đổi', true); });
    }
  }
  function myInviteUrl() { var u = appUrl(); return u && S.me ? u + '#moi=' + S.me.uid : ''; }
  function sendLink(url, text) {
    if (NATIVE && NATIVE.share) { NATIVE.share(text + ' ' + url); return; }
    if (navigator.share) navigator.share({ title: 'Chat Khóa', text: text, url: url }).catch(function () { /* hủy */ });
    else copyText(url);
  }
  function linkBox(url, text, qrLabel) {
    var qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
    var inp = h('input', { type: 'text', value: url, readonly: true, 'aria-label': 'Link mời', 'data-nofocus': true, onFocus: function () { inp.select(); } });
    return [
      h('div', { class: 'input' }, icon('share', 18), inp),
      h('div', { style: 'display:flex;gap:10px' },
        h('button', { class: 'btn sec', style: 'flex:1', onClick: function () { copyText(url); } }, icon('copy', 18), 'Sao chép'),
        h('button', { class: 'btn pri', style: 'flex:1', onClick: function () { sendLink(url, text); } }, icon('send', 18), 'Gửi link')),
      h('div', { class: 'qr' }, h('img', { src: qr.createDataURL(6, 2), alt: qrLabel })),
      h('p', { class: 'desc', style: 'text-align:center', text: 'Người nhận quét mã bằng camera điện thoại cũng mở được link.' })
    ];
  }
  function inviteSheet() {
    if (S.store.mode !== 'cloud') { needCloud('Mời người chat'); return; }
    var url = myInviteUrl();
    if (!url) { toast('Chưa có địa chỉ web của app', true); return; }
    openSheet('Mời người chat với anh', 'userPlus', [
      h('p', { class: 'desc', text: 'Gửi link này qua Zalo, Messenger hoặc tin nhắn. Người nhận bấm vào, đăng ký bằng email là vào thẳng cuộc chat với anh.' })
    ].concat(linkBox(url, S.me.name + ' mời bạn chat trên Chat Khóa:', 'Mã QR mời chat với ' + S.me.name)));
  }
  function groupInviteSheet(c) {
    if (S.store.mode !== 'cloud') { needCloud('Link mời vào nhóm'); return; }
    S.store.groupInvite(c).then(function (code) {
      var url = appUrl() + '#nhom=' + c.id + '.' + code;
      openSheet('Mời vào “' + chatTitle(c) + '”', 'users', [
        h('p', { class: 'desc', text: 'Ai có link này đều vào được nhóm sau khi đăng ký. Chỉ gửi cho người trong dự án.' })
      ].concat(linkBox(url, 'Mời bạn vào nhóm “' + chatTitle(c) + '” trên Chat Khóa:', 'Mã QR vào nhóm')));
    }).catch(function (e) { toast(errText(e), true); });
  }
  function startData() {
    S.chats = null; S.contacts = null; S.chatsErr = null;
    var first = true;
    S.subs.push(S.store.onChats(function (list) {
      list.sort(function (a, b) { return (b.lastAt || 0) - (a.lastAt || 0); });
      if (!first) notifyNew(list);
      list.forEach(function (c) { S.lastSeen[c.id] = c.lastAt; });
      first = false;
      S.chats = list; S.chatsErr = null;
      refresh();
    }, function (e) { S.chatsErr = e; refresh(); }));
    S.subs.push(S.store.onContacts(function (list) {
      list.sort(function (a, b) { return a.name.localeCompare(b.name, 'vi'); });
      S.contacts = list; refresh();
    }, function () { S.contacts = []; refresh(); }));
  }
  function stopData() { S.subs.forEach(function (f) { try { f(); } catch (e) { /* bỏ qua */ } }); S.subs = []; S.chats = null; S.contacts = null; }
  function refresh() {
    if (S.screen === 'main') renderMainBody();
    if (S.screen === 'chat' && S.ui && S.ui.updateHead) S.ui.updateHead();
  }

  /* ---------- Thông báo tin mới ---------- */
  function notifyNew(list) {
    if (!S.me) return;
    list.forEach(function (c) {
      var prev = S.lastSeen[c.id];
      if (prev == null || !(c.lastAt > prev) || c.lastFrom === S.me.uid) return;
      if (S.screen === 'chat' && S.cur === c.id && !document.hidden) return;
      var locked = Sec.lockOf(c.id) !== 'none';
      var hide = S.set.hide || locked;
      var title = hide ? 'Chat Khóa' : chatTitle(c);
      var body = hide ? 'Có tin nhắn mới' : (c.lastText || 'Tin nhắn mới');
      if (document.hidden) {
        if (!S.set.notify) return;
        if (NATIVE && NATIVE.notify) NATIVE.notify(title, body);
        else if (window.Notification && Notification.permission === 'granted') {
          try { navigator.serviceWorker && navigator.serviceWorker.ready.then(function (r) { r.showNotification(title, { body: body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: c.id }); }); } catch (e) { /* bỏ qua */ }
        }
      } else {
        toast(hide ? 'Có tin nhắn mới' : 'Tin mới: ' + chatTitle(c));
      }
    });
  }

  /* ---------- Màn chào ---------- */
  var SLIDES = [
    ['shield', 't-b', 'Khóa riêng từng cuộc trò chuyện', 'Chọn không khóa, PIN chung hoặc mật khẩu riêng cho mỗi chat. Danh sách chỉ hiện tên, nội dung được che.'],
    ['briefcase', 't-g', 'Làm việc theo dự án', 'Tạo nhóm cho ban QLDA, đội thi công, MEP. Gửi ảnh hiện trường, file Excel, PDF ngay trong chat.'],
    ['fp', 't-p', 'Mở nhanh bằng vân tay', 'Tự khóa khi rời chat hoặc tắt màn hình. Thông báo không lộ nội dung tin nhắn.']
  ];
  function showWelcome() {
    S.screen = 'welcome';
    var i = 0;
    var holder = h('div', { style: 'flex:1;display:flex' });
    var pager = h('div', { class: 'pager', 'aria-hidden': 'true' });
    var next = h('button', { class: 'btn pri block' });
    function draw() {
      var s = SLIDES[i];
      clear(holder).appendChild(h('div', { class: 'slide' },
        h('div', { class: 'art ' + s[1] }, icon(s[0], 56, 1.8)),
        h('h2', { text: s[2] }), h('p', { text: s[3] })));
      clear(pager); SLIDES.forEach(function (_, k) { pager.appendChild(h('i', { class: k === i ? 'on' : '' })); });
      clear(next); add(next, [i < SLIDES.length - 1 ? 'Tiếp tục' : 'Bắt đầu', icon('chev', 18)]);
    }
    next.addEventListener('click', function () {
      if (i < SLIDES.length - 1) { i++; draw(); return; }
      LS.lsSet('dao_onboarded', true); route();
    });
    draw();
    mount(h('div', { class: 'welcome' },
      h('div', { style: 'display:flex;justify-content:flex-end' }, h('button', { class: 'btn ghost', text: 'Bỏ qua', onClick: function () { LS.lsSet('dao_onboarded', true); route(); } })),
      holder, pager, next));
  }

  /* ---------- Đăng nhập ---------- */
  function showAuth() {
    S.screen = 'auth';
    var cloud = S.store.mode === 'cloud';
    var mode = LS.lsGet('dao_invite', null) ? 'signup' : 'login';
    var err = h('div', { class: 'err-text', role: 'alert' });
    var name = h('input', { type: 'text', autocomplete: 'name', placeholder: 'VD: Đạo – QS', maxlength: '40', id: 'f-name' });
    var email = h('input', { type: 'email', autocomplete: 'email', inputmode: 'email', placeholder: 'ten@congty.vn', id: 'f-email' });
    var pw = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Ít nhất 6 ký tự', id: 'f-pw' });
    var fName = h('div', { class: 'field' }, h('label', { for: 'f-name', text: 'Tên hiển thị' }), h('div', { class: 'input' }, icon('user', 18), name));
    var fEmail = h('div', { class: 'field' }, h('label', { for: 'f-email', text: 'Email' }), h('div', { class: 'input' }, icon('mail', 18), email));
    var fPw = h('div', { class: 'field' }, h('label', { for: 'f-pw', text: 'Mật khẩu' }), h('div', { class: 'input' }, icon('key', 18), pw));
    var go = h('button', { class: 'btn pri block', type: 'submit' });
    var forgot = h('button', { class: 'btn ghost', type: 'button', text: 'Quên mật khẩu?', onClick: function () {
      var e = email.value.trim();
      if (!/^\S+@\S+\.\S+$/.test(e)) { err.textContent = 'Nhập email để nhận link đặt lại mật khẩu'; email.focus(); return; }
      S.store.resetPassword(e).then(function () { toast('Đã gửi email đặt lại mật khẩu'); }).catch(function (x) { err.textContent = errText(x); });
    } });
    var seg = h('div', { class: 'seg', role: 'tablist' });
    function draw() {
      clear(seg);
      [['login', 'Đăng nhập'], ['signup', 'Đăng ký']].forEach(function (t) {
        seg.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': String(mode === t[0]), class: mode === t[0] ? 'on' : '', text: t[1], onClick: function () { mode = t[0]; err.textContent = ''; draw(); } }));
      });
      fName.style.display = (!cloud || mode === 'signup') ? '' : 'none';
      forgot.style.display = cloud && mode === 'login' ? '' : 'none';
      pw.setAttribute('autocomplete', mode === 'signup' ? 'new-password' : 'current-password');
      clear(go); add(go, [icon(cloud ? (mode === 'login' ? 'door' : 'userPlus') : 'chev', 18), cloud ? (mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản') : 'Bắt đầu dùng thử']);
    }
    var form = h('form', { class: 'stack', style: 'gap:14px', novalidate: true, onSubmit: function (ev) {
      ev.preventDefault(); err.textContent = '';
      var n = name.value.trim(), e = email.value.trim(), p = pw.value;
      if ((!cloud || mode === 'signup') && n.length < 2) { err.textContent = 'Tên cần ít nhất 2 ký tự'; name.focus(); return; }
      if (cloud && !/^\S+@\S+\.\S+$/.test(e)) { err.textContent = 'Email không đúng định dạng'; email.focus(); return; }
      if (cloud && p.length < 6) { err.textContent = 'Mật khẩu cần ít nhất 6 ký tự'; pw.focus(); return; }
      busy(go, true, 'Đang xử lý…');
      var job = !cloud ? S.store.signUp(n) : (mode === 'signup' ? S.store.signUp(n, e, p) : S.store.signIn(n, e, p));
      job.catch(function (x) { busy(go, false); err.textContent = errText(x); });
    } }, cloud ? seg : null, fName, cloud ? fEmail : null, cloud ? fPw : null, err, go, forgot);
    draw();
    mount(h('div', { class: 'welcome', style: 'overflow-y:auto' },
      h('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:12px;text-align:center' },
        h('div', { class: 'brand', style: 'width:64px;height:64px;border-radius:20px;background:#1550E8;color:#fff' }, icon('lock', 32, 2.2)),
        h('h2', { style: 'margin:0;font-size:22px', text: cloud ? 'Đăng nhập Chat Khóa' : 'Dùng thử Chat Khóa' }),
        h('p', { style: 'margin:0;color:var(--tx-2);font-size:14px;line-height:1.5', text: cloud ? 'Tài khoản dùng chung trên mọi máy của anh.' : 'Chế độ thử: dữ liệu mẫu, chỉ lưu trên máy này.' })),
      LS.lsGet('dao_invite', null) ? h('div', { class: 'card note ok', style: 'margin:0' }, h('div', { class: 'ic' }, icon('userPlus', 18)),
        h('span', { text: LS.lsGet('dao_invite', {}).type === 'group' ? 'Bạn được mời vào nhóm chat. Đăng ký hoặc đăng nhập để vào nhóm.' : 'Bạn được mời chat. Đăng ký hoặc đăng nhập là vào thẳng cuộc trò chuyện.' })) : null,
      cloud ? null : h('div', { class: 'card note', style: 'margin:0' }, h('div', { class: 'ic' }, icon('server', 18)),
        h('span', null, 'Muốn nhắn với người khác? ', h('button', { class: 'btn ghost', style: 'height:auto;padding:0', text: 'Kết nối máy chủ', onClick: serverSheet }))),
      form));
  }

  /* ---------- Màn PIN dùng chung ---------- */
  /* steps: [{title, sub, check(code)->Promise<bool>|null, bio:true}] ; onDone(codes) */
  function pinScreen(opt) {
    S.screen = 'pin';
    var stepI = 0, code = '', codes = [], timer = null, busyNow = false;
    var titleEl = h('h2'), subEl = h('div', { class: 'sub' }), dots = h('div', { class: 'dots', 'aria-hidden': 'true' }), msg = h('div', { class: 'msg', role: 'alert' });
    var live = h('span', { class: 'sr', 'aria-live': 'polite' });
    var grid = h('div', { class: 'pad-grid' });
    var keys = [];
    function step() { return opt.steps[stepI]; }
    function drawDots() { clear(dots); for (var i = 0; i < 4; i++) dots.appendChild(h('i', { class: i < code.length ? 'on' : '' })); live.textContent = code.length + ' trên 4 số'; }
    function drawStep() { titleEl.textContent = step().title; subEl.textContent = step().sub || ''; code = ''; drawDots(); drawKeys(); }
    function lockTick() {
      var left = Sec.lockoutLeft();
      keys.forEach(function (k) { k.disabled = left > 0; });
      if (left > 0) { msg.textContent = 'Tạm khóa, thử lại sau ' + Math.ceil(left / 1000) + ' giây'; timer = setTimeout(lockTick, 500); }
      else if (timer) { msg.textContent = ''; timer = null; }
    }
    function drawKeys() {
      clear(grid); keys = [];
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'fp', '0', 'del'].forEach(function (k) {
        var b;
        if (k === 'fp') {
          if (!(step().bio && S.set.fp && S.bio)) { grid.appendChild(h('span', { class: 'key blank' })); return; }
          b = h('button', { class: 'key', 'aria-label': 'Mở bằng vân tay', onClick: doBio }, h('span', { style: 'color:#86EFAC;display:flex' }, icon('fp', 28, 1.8)));
        } else if (k === 'del') {
          b = h('button', { class: 'key', 'aria-label': 'Xóa', onClick: function () { code = code.slice(0, -1); msg.textContent = ''; drawDots(); } }, icon('del', 26));
        } else {
          b = h('button', { class: 'key', 'aria-label': k, text: k, onClick: function () { press(k); } });
        }
        keys.push(b); grid.appendChild(b);
      });
      lockTick();
    }
    function nextStep() {
      codes.push(code);
      if (stepI < opt.steps.length - 1) { stepI++; drawStep(); }
      else {
        cleanup();
        try { opt.onDone(codes); } catch (e) { console.error(e); msg.textContent = 'Có lỗi, anh thử lại'; stepI = 0; codes = []; drawStep(); document.addEventListener('keydown', onKey); }
      }
    }
    function press(k) {
      if (busyNow || Sec.lockoutLeft() > 0 || code.length >= 4) return;
      code += k; msg.textContent = ''; drawDots();
      if (code.length < 4) return;
      var st = step();
      if (!st.check) { setTimeout(nextStep, 120); return; }
      busyNow = true;
      Promise.resolve(st.check(code, codes)).then(function (ok) {
        busyNow = false;
        if (ok) { if (st.counts !== false) Sec.success(); nextStep(); return; }
        var r = st.counts === false ? null : Sec.fail();
        code = ''; drawDots();
        dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake');
        if (navigator.vibrate) navigator.vibrate(120);
        msg.textContent = st.failText || (r && r.locked ? '' : 'Sai mã' + (r ? ', còn ' + r.left + ' lần thử' : ', anh thử lại'));
        lockTick();
      }).catch(function (e) {
        busyNow = false; code = ''; drawDots();
        msg.textContent = 'Lỗi kiểm tra mã: ' + ((e && e.message) || 'không rõ') + '. Anh thử lại';
        console.error(e);
      });
    }
    function doBio() {
      Sec.bioAuth().then(function () { Sec.success(); code = '----'; drawDots(); nextStep(); })
        .catch(function () { msg.textContent = 'Chưa xác thực được vân tay, anh nhập PIN'; });
    }
    function onKey(e) {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') { code = code.slice(0, -1); drawDots(); }
    }
    function cleanup() { clearTimeout(timer); document.removeEventListener('keydown', onKey); }
    var el = h('div', { class: 'lock' },
      h('div', { class: 'head' },
        opt.cancel ? h('button', { class: 'outline', onClick: function () { cleanup(); opt.cancel(); } }, icon('back', 18), 'Hủy') : h('span'),
        opt.extra || h('span')),
      h('div', { class: 'big' }, icon(opt.icon || 'lock', 36)),
      titleEl, subEl, dots, msg, live, grid,
      h('div', { class: 'foot', text: opt.foot || 'Nhập sai 5 lần sẽ tạm khóa 30 giây' }));
    drawStep();
    mount(el);
    document.addEventListener('keydown', onKey);
    S.screenSubs.push(cleanup);
    if (opt.autoBio && step().bio && S.set.fp && S.bio) setTimeout(doBio, 350);
  }
  function setupPin(done, cancel) {
    S.screen = 'setpin';
    pinScreen({
      icon: 'key', cancel: cancel, foot: 'PIN chung dùng để mở các chat đã khóa trên máy này',
      steps: [
        { title: 'Tạo PIN chung', sub: '4 số, dùng để mở các chat bị khóa' },
        { title: 'Nhập lại PIN', sub: 'Xác nhận PIN vừa tạo', counts: false, failText: 'Hai lần nhập không khớp', check: function (c, codes) { return c === codes[0]; } }
      ],
      onDone: function (codes) {
        Sec.setPin(codes[0]).then(function () {
          if (!Sec.hasPin()) throw new Error('Trình duyệt không cho lưu dữ liệu (đang ở chế độ ẩn danh/bí mật?)');
          toast('Đã tạo PIN chung'); done();
        }).catch(function (e) {
          console.error(e);
          toast('Không lưu được PIN: ' + ((e && e.message) || 'lỗi trình duyệt'), true);
          S.screen = null; setupPin(done, cancel);
        });
      }
    });
  }

  /* ---------- Màn chính ---------- */
  function goMain(back) {
    if (depth > 0) { depth = 0; }
    S.cur = null;
    renderMain(back);
  }
  function renderMain(back) {
    S.screen = 'main';
    S.ui = {};
    var body = h('div', { style: 'flex:1;display:flex;flex-direction:column;min-height:0' });
    var nav = h('nav', { class: 'nav', 'aria-label': 'Điều hướng chính' });
    S.ui.body = body; S.ui.nav = nav;
    var el = h('div', null, body, nav);
    mount(el, back);
    renderMainBody(true);
  }
  function unreadTotal() { return (S.chats || []).reduce(function (n, c) { return n + (c.unread || 0); }, 0); }
  function drawNav() {
    var nav = S.ui.nav; if (!nav) return; clear(nav);
    [['chats', 'chat', 'Tin nhắn'], ['contacts', 'users', 'Danh bạ'], ['settings', 'settings', 'Cài đặt']].forEach(function (t) {
      var on = S.tab === t[0];
      var b = h('button', { class: on ? 'on' : '', 'aria-current': on ? 'page' : null, onClick: function () { if (S.tab !== t[0]) { S.tab = t[0]; renderMainBody(true); } } },
        h('span', { class: 'pill' }, icon(t[1], 22)), t[2]);
      if (t[0] === 'chats' && unreadTotal() > 0) b.appendChild(h('span', { class: 'dot', text: unreadTotal() > 99 ? '99+' : unreadTotal() }));
      nav.appendChild(b);
    });
  }
  function renderMainBody(full) {
    if (!S.ui || !S.ui.body) return;
    drawNav();
    if (S.tab === 'chats') {
      if (full || !S.ui.list) buildChatsTab(); else drawChatList();
    } else if (S.tab === 'contacts') {
      if (full || !S.ui.clist) buildContactsTab(); else drawContacts();
    } else if (full) buildSettingsTab();
  }
  function offlineNote() {
    if (S.online || S.store.mode !== 'cloud') return null;
    return h('div', { class: 'card note' }, h('div', { class: 'ic' }, icon('wifiOff', 18)), h('span', { text: 'Đang ngoại tuyến. Tin nhắn sẽ tự gửi khi có mạng.' }));
  }

  /* --- Tab Tin nhắn --- */
  function buildChatsTab() {
    var body = clear(S.ui.body); S.ui.clist = null;
    var input = h('input', { type: 'search', placeholder: 'Tìm người, nhóm, dự án…', value: S.q, 'aria-label': 'Tìm kiếm cuộc trò chuyện', onInput: function () { S.q = input.value; drawChatList(); clearB.style.visibility = S.q ? 'visible' : 'hidden'; } });
    var clearB = ibtn('x', 'Xóa tìm kiếm', function () { S.q = ''; input.value = ''; drawChatList(); clearB.style.visibility = 'hidden'; input.focus(); });
    clearB.style.visibility = S.q ? 'visible' : 'hidden';
    body.appendChild(h('header', { class: 'top' },
      h('div', { class: 'top-row' },
        h('div', { class: 'brand' }, icon('lock', 22, 2.2)),
        h('div', { style: 'flex:1;min-width:0;display:flex;flex-direction:column' }, h('h1', { text: 'Chat Khóa' }), h('span', { class: 'sub', text: 'Đạo Pro · bảo mật từng cuộc trò chuyện' })),
        ibtn('shield', 'Khóa tất cả ngay', function () { Sec.lockAll(); toast('Đã khóa lại tất cả chat'); })),
      h('label', { class: 'search' }, icon('search', 18), input, clearB)));
    S.ui.chips = h('div', { class: 'chips', role: 'tablist', 'aria-label': 'Lọc' });
    body.appendChild(S.ui.chips);
    S.ui.notes = h('div');
    body.appendChild(S.ui.notes);
    S.ui.list = h('div', { class: 'stack pad' });
    body.appendChild(h('div', { class: 'scroll' }, S.ui.list));
    body.appendChild(h('button', { class: 'fab', 'aria-label': 'Tạo chat hoặc nhóm mới', onClick: newSheet }, icon('plus', 26, 2.4)));
    drawChatList();
  }
  function drawChatList() {
    if (!S.ui.list) return;
    var chats = S.chats;
    // Bộ lọc
    var counts = { all: 0, project: 0, locked: 0, unread: 0 };
    (chats || []).forEach(function (c) { counts.all++; if (c.project) counts.project++; if (Sec.lockOf(c.id) !== 'none') counts.locked++; if (c.unread) counts.unread++; });
    clear(S.ui.chips);
    [['all', 'Tất cả'], ['project', 'Dự án'], ['locked', 'Đã khóa'], ['unread', 'Chưa đọc']].forEach(function (t) {
      var on = S.filter === t[0];
      S.ui.chips.appendChild(h('button', { class: 'chip' + (on ? ' on' : ''), role: 'tab', 'aria-selected': String(on), onClick: function () { S.filter = t[0]; drawChatList(); } },
        t[0] === 'locked' ? icon('lock', 15) : (t[0] === 'project' ? icon('briefcase', 15) : null), t[1],
        t[0] === 'unread' && counts.unread ? h('span', { class: 'cnt', text: counts.unread }) : null));
    });
    clear(S.ui.notes);
    add(S.ui.notes, offlineNote());
    if (S.store.mode === 'local') {
      S.ui.notes.appendChild(h('div', { class: 'card note' }, h('div', { class: 'ic' }, icon('info', 18)),
        h('span', null, 'Chế độ thử trên máy, dữ liệu mẫu. ', h('button', { class: 'btn ghost', style: 'height:auto;padding:0;font-size:13px', text: 'Kết nối máy chủ', onClick: serverSheet }), ' để nhắn với người khác.')));
    }
    var list = clear(S.ui.list);
    if (S.chatsErr) {
      list.appendChild(h('div', { class: 'card empty err' }, h('div', { class: 'art' }, icon('alert', 34)), h('b', { text: 'Không tải được tin nhắn' }), h('p', { text: errText(S.chatsErr) }),
        h('button', { class: 'btn pri', onClick: function () { stopData(); startData(); drawChatList(); } }, icon('refresh', 18), 'Thử lại')));
      return;
    }
    if (!chats) { for (var i = 0; i < 6; i++) list.appendChild(h('div', { class: 'sk', 'aria-hidden': 'true' })); list.appendChild(h('span', { class: 'sr', text: 'Đang tải' })); return; }
    var q = norm(S.q);
    var shown = chats.filter(function (c) {
      var lock = Sec.lockOf(c.id);
      if (q) {
        var hit = norm(chatTitle(c)).indexOf(q) >= 0 || (lock === 'none' && norm(c.lastText).indexOf(q) >= 0);
        if (!hit) return false;
      }
      if (S.filter === 'project') return c.project;
      if (S.filter === 'locked') return lock !== 'none';
      if (S.filter === 'unread') return c.unread > 0;
      return true;
    });
    if (!shown.length) {
      var emp = chats.length === 0 && !q;
      list.appendChild(h('div', { class: 'card empty' },
        h('div', { class: 'art' }, icon(emp ? 'chat' : 'search', 34)),
        h('b', { text: emp ? 'Chưa có cuộc trò chuyện' : 'Không tìm thấy' }),
        h('p', { text: emp ? 'Gửi link mời qua Zalo cho đồng nghiệp. Họ bấm vào là chat được với anh.' : 'Thử từ khóa khác hoặc đổi bộ lọc.' }),
        emp ? h('button', { class: 'btn pri', onClick: inviteSheet }, icon('userPlus', 18), 'Mời người chat với anh') : null,
        emp ? h('button', { class: 'btn sec', onClick: newSheet }, icon('plus', 18), 'Tạo nhóm / chat mới') : null));
      return;
    }
    shown.forEach(function (c) { list.appendChild(chatRow(c)); });
  }
  function chatRow(c) {
    var lock = Sec.lockOf(c.id), title = chatTitle(c);
    var mid = h('div', { class: 'mid' },
      h('div', { class: 'name' }, h('span', { text: title }),
        c.isGroup ? h('span', { style: 'color:var(--tx-3);display:flex', title: 'Nhóm' }, icon('users', 15)) : null,
        c.project ? h('span', { class: 'tag', text: 'Dự án' }) : null));
    if (lock !== 'none') mid.appendChild(h('span', { class: 'lockt' }, icon('lock', 13, 2.4), lock === 'private' ? 'Mật khẩu riêng · nội dung đã khóa' : 'Khóa bằng PIN · nội dung đã khóa'));
    else mid.appendChild(h('span', { class: 'last', text: (c.lastFrom === (S.me && S.me.uid) && c.lastText ? 'Bạn: ' : '') + (c.lastText || 'Chưa có tin nhắn') }));
    return h('button', { class: 'row', onClick: function () { openChat(c.id); }, 'aria-label': title + (lock !== 'none' ? ', đã khóa' : '') + (c.unread ? ', ' + c.unread + ' tin chưa đọc' : '') },
      avatar(c.id, title, 50), mid,
      h('div', { class: 'side' }, h('span', { class: 'time', text: fmtTime(c.lastAt) }), c.unread ? h('span', { class: 'badge', text: c.unread > 99 ? '99+' : c.unread }) : null));
  }

  /* --- Mở chat (qua khóa nếu cần) --- */
  function openChat(id) {
    var c = (S.chats || []).find(function (x) { return x.id === id; });
    if (!c) return;
    var lock = Sec.lockOf(id);
    if (lock === 'none' || Sec.isUnlocked(id)) { enterChat(id); return; }
    var steps = [{ title: 'Nhập PIN chung', sub: 'Để mở “' + chatTitle(c) + '”', bio: true, check: function (code) { return Sec.checkPin(code); } }];
    if (lock === 'private') steps.push({ title: 'Nhập mật khẩu riêng', sub: '“' + chatTitle(c) + '” có thêm lớp khóa riêng', check: function (code) { return Sec.checkPrivate(id, code); } });
    pushNav();
    pinScreen({ steps: steps, cancel: navBack, autoBio: true, onDone: function () { Sec.markUnlocked(id); enterChat(id, true); } });
  }

  /* ---------- Phòng chat ---------- */
  function enterChat(id, replaced) {
    S.screen = 'chat'; S.cur = id; S.msgs = null; S.msgsErr = null; S.chatQ = '';
    if (!replaced) pushNav();
    var c = function () { return (S.chats || []).find(function (x) { return x.id === id; }) || {}; };
    var head = h('div', { class: 'title' });
    var av = h('div');
    var msgs = h('div', { class: 'msgs', role: 'log', 'aria-label': 'Tin nhắn' });
    var searchBar = h('div', { class: 'chatsearch', style: 'display:none' });
    var sInput = h('input', { type: 'search', placeholder: 'Tìm trong cuộc trò chuyện…', 'aria-label': 'Tìm tin nhắn', onInput: function () { S.chatQ = sInput.value; drawMsgs(false); } });
    searchBar.appendChild(h('label', { class: 'search' }, icon('search', 18), sInput,
      ibtn('x', 'Đóng tìm kiếm', function () { S.chatQ = ''; sInput.value = ''; searchBar.style.display = 'none'; drawMsgs(true); })));
    function updateHead() {
      var cc = c(); if (!cc.id) { navBack(); return; }
      var lock = Sec.lockOf(id);
      clear(head);
      head.appendChild(h('b', { text: chatTitle(cc) }));
      var sub = lock === 'none' ? 'Không khóa' : (lock === 'pin' ? 'Đang mở · khóa bằng PIN chung' : 'Đang mở · khóa mật khẩu riêng');
      if (cc.isGroup) sub = (cc.members || []).length + ' thành viên · ' + sub;
      head.appendChild(h('span', { text: sub, style: lock === 'none' ? '' : 'color:var(--ok);font-weight:500' }));
      clear(av).appendChild(avatar(id, chatTitle(cc), 40));
    }
    S.ui = { updateHead: updateHead };
    var ta = h('textarea', { rows: '1', placeholder: 'Nhập tin nhắn…', 'aria-label': 'Tin nhắn', maxlength: '4000' });
    var draftKey = 'dao_draft_' + id;
    ta.value = sessionStorage.getItem(draftKey) || '';
    function grow() { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; }
    ta.addEventListener('input', function () { grow(); try { sessionStorage.setItem(draftKey, ta.value); } catch (e) { /* bỏ qua */ } });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && matchMedia('(pointer:fine)').matches) { e.preventDefault(); send(); } });
    var fileIn = h('input', { type: 'file', class: 'sr', 'aria-hidden': 'true', tabindex: '-1', accept: 'image/*,.pdf,.xls,.xlsx,.doc,.docx,.dwg,.dxf,.zip,.txt,.csv' });
    fileIn.addEventListener('change', function () { var f = fileIn.files && fileIn.files[0]; fileIn.value = ''; if (f) sendFile(f); });
    var sendB = ibtn('send', 'Gửi', send, 'send');
    function send() {
      var t = ta.value.trim(); if (!t) { ta.focus(); return; }
      ta.value = ''; grow(); try { sessionStorage.removeItem(draftKey); } catch (e) { /* bỏ qua */ }
      S.store.send(id, { text: t }, c()).catch(function (e) { toast(errText(e), true); ta.value = t; });
      ta.focus();
    }
    function sendFile(f) {
      var isImg = /^image\//.test(f.type);
      (isImg ? compressImage(f) : readFile(f)).then(function (r) {
        if (r.size > MAX_FILE) { toast('File quá lớn (' + fmtSize(r.size) + '). Tối đa ' + fmtSize(MAX_FILE) + ' ở gói miễn phí', true); return; }
        toast('Đang gửi ' + f.name + '…');
        return S.store.send(id, { text: '', file: { name: f.name, size: r.size, type: r.type, data: r.data } }, c());
      }).catch(function (e) { toast(e && e.message === 'read' ? 'Không đọc được file' : errText(e), true); });
    }
    function drawMsgs(stick) {
      var atBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 80;
      clear(msgs);
      if (S.msgsErr) {
        msgs.appendChild(h('div', { class: 'card empty err', style: 'margin:auto 0' }, h('div', { class: 'art' }, icon('alert', 34)), h('b', { text: 'Không tải được tin nhắn' }), h('p', { text: errText(S.msgsErr) }),
          h('button', { class: 'btn pri', onClick: subscribe }, icon('refresh', 18), 'Thử lại')));
        return;
      }
      if (!S.msgs) { for (var i = 0; i < 4; i++) msgs.appendChild(h('div', { class: 'sk', style: 'height:52px;width:' + (50 + i * 10) + '%;align-self:' + (i % 2 ? 'flex-end' : 'flex-start') })); return; }
      var q = norm(S.chatQ);
      var list = q ? S.msgs.filter(function (m) { return norm(m.text).indexOf(q) >= 0 || (m.file && norm(m.file.name).indexOf(q) >= 0); }) : S.msgs;
      if (!list.length) {
        msgs.appendChild(h('div', { class: 'card empty', style: 'margin:auto 0' }, h('div', { class: 'art' }, icon(q ? 'search' : 'chat', 34)),
          h('b', { text: q ? 'Không có tin khớp' : 'Bắt đầu cuộc trò chuyện' }),
          h('p', { text: q ? 'Thử từ khóa khác.' : 'Gửi lời chào, ảnh hiện trường hoặc file dự án.' })));
        return;
      }
      var lastDay = '', group = c().isGroup, meId = S.me.uid;
      list.forEach(function (m) {
        var day = fmtDay(m.at);
        if (day !== lastDay) { msgs.appendChild(h('div', { class: 'day', text: day })); lastDay = day; }
        var mine = m.from === meId;
        var bub = h('button', { class: 'bub', 'aria-label': (mine ? 'Tin của bạn' : 'Tin của ' + (m.fromName || '')) + ', mở tùy chọn', onClick: function () { msgActions(m, mine); } });
        if (group && !mine) bub.appendChild(h('span', { class: 'who', text: m.fromName || '' }));
        if (m.file) {
          if (/^image\//.test(m.file.type)) bub.appendChild(h('img', { src: m.file.data, alt: m.file.name, loading: 'lazy' }));
          else bub.appendChild(h('span', { class: 'file' }, h('span', { class: 'fi' }, icon('file', 20)), h('span', null, h('b', { text: m.file.name }), h('span', { text: fmtSize(m.file.size) }))));
        }
        if (m.text) bub.appendChild(highlight(m.text, q));
        bub.appendChild(h('span', { class: 'meta' }, fmtTime(m.at, true), mine ? icon(m.pending ? 'clock' : 'check', 13, 2.4) : null));
        msgs.appendChild(h('div', { class: 'mrow' + (mine ? ' me' : '') }, bub));
      });
      if (stick || atBottom) msgs.scrollTop = msgs.scrollHeight;
    }
    function subscribe() {
      S.msgsErr = null; S.msgs = null; drawMsgs(true);
      var unsub = S.store.onMessages(id, function (list) {
        var first = !S.msgs; S.msgs = list; drawMsgs(first);
        if (c().unread) S.store.markRead(id);
      }, function (e) { S.msgsErr = e; drawMsgs(); });
      S.screenSubs.push(unsub);
    }
    var el = h('div', { class: 'chat' },
      h('header', { class: 'bar' },
        ibtn('back', 'Quay lại', navBack), av, head,
        ibtn('search', 'Tìm trong chat', function () { searchBar.style.display = ''; sInput.focus(); }),
        h('button', { class: 'ibtn', style: 'background:var(--warn-soft);color:var(--warn)', 'aria-label': 'Thiết lập khóa cho chat này', onClick: function () { lockSheet(id, updateHead); } }, icon('lock', 21)),
        ibtn('info', 'Thông tin cuộc trò chuyện', function () { infoSheet(id); })),
      searchBar, msgs,
      h('div', { class: 'composer' }, ibtn('clip', 'Gửi ảnh hoặc file', function () { fileIn.click(); }, 'att'), h('label', { class: 'box' }, ta), sendB, fileIn));
    mount(el);
    updateHead(); grow();
    subscribe();
    S.store.markRead(id);
    S.screenSubs.push(function () {
      if (S.keepOpen) { S.keepOpen = false; return; }
      if (S.set.auto && Sec.lockOf(id) !== 'none') { Sec.lockOne(id); toast('Đã tự khóa lại “' + chatTitle(c()) + '”'); }
    });
  }
  function highlight(text, q) {
    var span = h('span', { class: 'txt' });
    if (!q) { span.textContent = text; return span; }
    var n = norm(text), i = 0, at;
    while ((at = n.indexOf(q, i)) >= 0) {
      add(span, text.slice(i, at)); span.appendChild(h('mark', { text: text.slice(at, at + q.length) })); i = at + q.length;
    }
    add(span, text.slice(i));
    return span;
  }
  function msgActions(m, mine) {
    var items = [];
    if (m.text) items.push(['copy', 't-b', 'Sao chép nội dung', function () { copyText(m.text); closeSheet(); }]);
    if (m.file) {
      if (/^image\//.test(m.file.type)) items.push(['image', 't-g', 'Xem ảnh lớn', function () { viewImage(m.file); }]);
      items.push(['download', 't-g', 'Lưu về máy', function () { saveFile(m.file); closeSheet(); }]);
    }
    if (mine) items.push(['trash', 't-r', 'Xóa tin nhắn', function () {
      confirmSheet('Xóa tin nhắn?', 'Tin sẽ bị xóa với mọi người trong cuộc trò chuyện.', 'Xóa', true, function () { S.store.deleteMessage(S.cur, m.id).then(function () { toast('Đã xóa tin nhắn'); }).catch(function (e) { toast(errText(e), true); }); });
    }]);
    openSheet('Tin nhắn lúc ' + fmtTime(m.at, true), 'chat', h('div', { class: 'card group' }, items.map(function (it) {
      return h('button', { class: 'item', onClick: it[3] }, h('span', { class: 'ic ' + it[1] }, icon(it[0], 19)), h('span', { class: 'txt' }, h('b', { text: it[2] })));
    })));
  }
  function viewImage(f) {
    openSheet(f.name, 'image', [h('img', { src: f.data, alt: f.name, style: 'width:100%;border-radius:14px;background:var(--bg)' }),
      h('button', { class: 'btn pri block', onClick: function () { saveFile(f); } }, icon('download', 18), 'Lưu ảnh')]);
  }
  function copyText(t) {
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('Đã sao chép'); }).catch(function () {
      var x = h('textarea', { style: 'position:fixed;opacity:0' }); x.value = t; document.body.appendChild(x); x.select();
      try { document.execCommand('copy'); toast('Đã sao chép'); } catch (e) { toast('Không sao chép được', true); } x.remove();
    });
  }
  function saveFile(f) {
    if (NATIVE && NATIVE.saveFile) { NATIVE.saveFile(f.name, f.data.split(',')[1] || '', f.type || 'application/octet-stream'); return; }
    var a = h('a', { href: f.data, download: f.name }); document.body.appendChild(a); a.click(); a.remove();
    toast('Đã lưu ' + f.name);
  }
  function readFile(f) {
    return new Promise(function (res, rej) {
      if (f.size > MAX_FILE) { res({ size: f.size }); return; }
      var r = new FileReader();
      r.onload = function () { res({ data: r.result, size: f.size, type: f.type || 'application/octet-stream' }); };
      r.onerror = function () { rej(new Error('read')); };
      r.readAsDataURL(f);
    });
  }
  function compressImage(f) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(f), img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var max = 1280, w = img.naturalWidth, hh = img.naturalHeight, k = Math.min(1, max / Math.max(w, hh));
        var cv = document.createElement('canvas');
        var q = 0.74, data;
        for (var tries = 0; tries < 5; tries++) {
          cv.width = Math.round(w * k); cv.height = Math.round(hh * k);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          data = cv.toDataURL('image/jpeg', q);
          if (data.length * 0.75 <= MAX_FILE) break;
          k *= 0.8; q -= 0.08;
        }
        res({ data: data, size: Math.round(data.length * 0.75), type: 'image/jpeg' });
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('read')); };
      img.src = url;
    });
  }

  /* --- Bảng khóa chat --- */
  function lockSheet(id, after) {
    var cur = Sec.lockOf(id);
    var opts = [
      ['none', 'unlock', 't-b', 'Không khóa', 'Ai cầm máy cũng xem được'],
      ['pin', 'lock', 't-b', 'PIN chung', 'Mở bằng PIN chung hoặc vân tay'],
      ['private', 'key', 't-o', 'Mật khẩu riêng', 'Nhập PIN chung rồi nhập thêm mã riêng']
    ];
    openSheet('Khóa cuộc trò chuyện này', 'lock', [
      h('p', { class: 'desc', text: 'Chỉ khóa trên máy này. Người chat cùng không cần biết mã.' }),
      opts.map(function (o) {
        var on = cur === o[0];
        return h('button', { class: 'opt' + (on ? ' on' : ''), 'aria-pressed': String(on), onClick: function () {
          if (o[0] === 'private') { closeSheet(); setPrivate(id, after); return; }
          Sec.setLock(id, o[0]).then(function () { closeSheet(); toast(o[0] === 'none' ? 'Đã bỏ khóa chat này' : 'Đã khóa bằng PIN chung'); after && after(); });
        } }, h('span', { class: 'ic ' + o[2] }, icon(o[1], 20)), h('span', { class: 'txt' }, h('b', { text: o[3] }), h('span', { text: o[4] })),
          h('span', { class: 'check' }, on ? icon('check', 16, 3) : null));
      })
    ]);
  }
  function setPrivate(id, after) {
    var back = function () { Sec.markUnlocked(id); enterChat(id, true); };
    S.keepOpen = true;
    pinScreen({
      icon: 'key', cancel: back, foot: 'Mã riêng không mở được bằng vân tay',
      steps: [
        { title: 'Đặt mật khẩu riêng', sub: '4 số, khác PIN chung' },
        { title: 'Nhập lại mật khẩu riêng', counts: false, failText: 'Hai lần nhập không khớp', check: function (c, codes) { return c === codes[0]; } }
      ],
      onDone: function (codes) {
        Sec.checkPin(codes[0]).then(function (same) {
          if (same) { toast('Mã riêng phải khác PIN chung', true); back(); return; }
          Sec.setLock(id, 'private', codes[0]).then(function () { toast('Đã đặt mật khẩu riêng'); back(); });
        });
      }
    });
  }

  /* --- Thông tin chat / nhóm --- */
  function infoSheet(id) {
    var c = (S.chats || []).find(function (x) { return x.id === id; }); if (!c) return;
    var meId = S.me.uid, admin = c.createdBy === meId, names = c.memberNames || {};
    var body = [];
    if (c.isGroup) {
      var nameIn = h('input', { type: 'text', value: c.name, maxlength: '60', 'aria-label': 'Tên nhóm', 'data-nofocus': true });
      body.push(h('div', { class: 'field' }, h('label', { text: 'Tên nhóm' }), h('div', { class: 'input' }, icon('edit', 18), nameIn,
        h('button', { class: 'btn ghost', style: 'height:40px;padding:0 8px', text: 'Lưu', onClick: function () {
          var v = nameIn.value.trim(); if (v.length < 2) { toast('Tên nhóm cần ít nhất 2 ký tự', true); return; }
          S.store.updateChat(id, { name: v }).then(function () { toast('Đã đổi tên nhóm'); }).catch(function (e) { toast(errText(e), true); });
        } }))));
    }
    var sw = switchBtn(!!c.project, 'Nhóm dự án', function (v) { S.store.updateChat(id, { project: v }).then(function () { toast(v ? 'Đã đánh dấu là dự án' : 'Đã bỏ đánh dấu dự án'); }); });
    body.push(h('div', { class: 'card group' }, h('div', { class: 'item' }, h('span', { class: 'ic t-g' }, icon('briefcase', 19)), h('span', { class: 'txt' }, h('b', { text: 'Thuộc dự án' }), h('span', { text: 'Hiện trong bộ lọc Dự án' })), sw)));
    body.push(h('div', { class: 'sec-title' }, icon('users', 14), (c.members || []).length + ' THÀNH VIÊN'));
    var mlist = h('div', { class: 'card', style: 'padding:0 12px' });
    (c.members || []).forEach(function (u) {
      var nm = u === meId ? (S.me.name + ' (bạn)') : (names[u] || 'Thành viên');
      mlist.appendChild(h('div', { class: 'member' }, avatar(u, names[u] || nm, 38), h('div', { class: 'txt' }, h('b', { text: nm }), h('span', { text: u === c.createdBy ? 'Trưởng nhóm' : 'Thành viên' })),
        c.isGroup && admin && u !== meId ? ibtn('trash', 'Xóa ' + nm + ' khỏi nhóm', function () {
          confirmSheet('Xóa thành viên?', nm + ' sẽ không xem được nhóm này nữa.', 'Xóa', true, function () { S.store.removeMember(id, u).then(function () { toast('Đã xóa thành viên'); }).catch(function (e) { toast(errText(e), true); }); });
        }) : null));
    });
    body.push(mlist);
    if (c.isGroup) {
      body.push(h('button', { class: 'btn pri block', onClick: function () { groupInviteSheet(c); } }, icon('share', 18), 'Gửi link mời vào nhóm'));
      body.push(h('button', { class: 'btn sec block', onClick: function () {
        pickContacts('Thêm thành viên', (c.members || []), function (users) { S.store.addMembers(id, users).then(function () { toast('Đã thêm ' + users.length + ' thành viên'); }).catch(function (e) { toast(errText(e), true); }); });
      } }, icon('userPlus', 18), 'Thêm thành viên'));
      body.push(h('button', { class: 'btn danger block', onClick: function () {
        confirmSheet('Rời nhóm?', 'Anh sẽ không nhận tin của nhóm này nữa.', 'Rời nhóm', true, function () {
          Sec.setLock(id, 'none'); S.store.removeMember(id, meId).then(function () { toast('Đã rời nhóm'); goMain(true); }).catch(function (e) { toast(errText(e), true); });
        });
      } }, icon('logout', 18), 'Rời nhóm'));
    }
    openSheet(chatTitle(c), c.isGroup ? 'users' : 'user', body);
  }
  function switchBtn(on, label, onChange) {
    var b = h('button', { class: 'switch', role: 'switch', 'aria-checked': String(on), 'aria-label': label }, h('span'));
    b.addEventListener('click', function () { on = !on; b.setAttribute('aria-checked', String(on)); onChange(on, b); });
    return b;
  }

  /* --- Tạo mới --- */
  function newSheet() {
    openSheet('Tạo mới', 'plus', h('div', { class: 'card group' },
      h('button', { class: 'item', onClick: function () {
        pickContacts('Chat với ai?', [], function (users) { openDirect(users[0]); }, true);
      } }, h('span', { class: 'ic t-b' }, icon('chat', 19)), h('span', { class: 'txt' }, h('b', { text: 'Chat riêng' }), h('span', { text: 'Nhắn với một người trong danh bạ' })), h('span', { class: 'chev' }, icon('chev', 18))),
      h('button', { class: 'item', onClick: groupSheet }, h('span', { class: 'ic t-g' }, icon('users', 19)), h('span', { class: 'txt' }, h('b', { text: 'Tạo nhóm' }), h('span', { text: 'Nhóm dự án, ban QLDA, đội thi công…' })), h('span', { class: 'chev' }, icon('chev', 18))),
      h('button', { class: 'item', onClick: function () { closeSheet(); S.tab = 'contacts'; renderMainBody(true); setTimeout(addContactSheet, 50); } }, h('span', { class: 'ic t-p' }, icon('userPlus', 19)), h('span', { class: 'txt' }, h('b', { text: 'Thêm người vào danh bạ' }), h('span', { text: 'Bằng email hoặc mã QR' })), h('span', { class: 'chev' }, icon('chev', 18)))));
  }
  function openDirect(u) {
    S.store.openDirect(u).then(function (cid) { closeSheet(); waitChat(cid, function () { openChat(cid); }); }).catch(function (e) { toast(errText(e), true); });
  }
  function waitChat(cid, fn, n) {
    n = n || 0;
    if ((S.chats || []).some(function (c) { return c.id === cid; }) || n > 30) { fn(); return; }
    setTimeout(function () { waitChat(cid, fn, n + 1); }, 100);
  }
  function pickContacts(title, exclude, done, single) {
    var list = (S.contacts || []).filter(function (c) { return exclude.indexOf(c.uid) < 0; });
    if (!list.length) {
      openSheet(title, 'users', h('div', { class: 'card empty' }, h('div', { class: 'art' }, icon('userPlus', 34)), h('b', { text: 'Danh bạ đang trống' }), h('p', { text: 'Thêm người bằng email hoặc mã QR trước.' }),
        h('button', { class: 'btn pri', onClick: function () { closeSheet(); S.tab = 'contacts'; renderMainBody(true); setTimeout(addContactSheet, 50); } }, icon('userPlus', 18), 'Thêm người')));
      return;
    }
    var picked = {};
    var ok = h('button', { class: 'btn pri block', disabled: !single, text: 'Thêm' });
    var box = h('div', { class: 'stack' }, list.map(function (u) {
      var b = h('button', { class: 'opt', 'aria-pressed': 'false' }, avatar(u.uid, u.name, 40), h('span', { class: 'txt' }, h('b', { text: u.name }), h('span', { text: u.email || '' })),
        single ? h('span', { class: 'chev' }, icon('chev', 18)) : h('span', { class: 'check' }));
      b.addEventListener('click', function () {
        if (single) { done([u]); return; }
        picked[u.uid] = picked[u.uid] ? null : u;
        var on = !!picked[u.uid];
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
        clear(b.querySelector('.check')); if (on) b.querySelector('.check').appendChild(icon('check', 16, 3));
        var n = Object.keys(picked).filter(function (k) { return picked[k]; }).length;
        ok.disabled = n === 0; ok.textContent = n ? 'Thêm ' + n + ' người' : 'Thêm';
      });
      return b;
    }));
    ok.addEventListener('click', function () { var arr = Object.keys(picked).map(function (k) { return picked[k]; }).filter(Boolean); closeSheet(); done(arr); });
    openSheet(title, 'users', [box, single ? null : ok]);
  }
  function groupSheet() {
    var name = h('input', { type: 'text', placeholder: 'VD: Ban QLDA – Dự án B', maxlength: '60', id: 'g-name' });
    var project = true;
    var picked = {};
    var err = h('div', { class: 'err-text', role: 'alert' });
    var list = S.contacts || [];
    var box = h('div', { class: 'stack' }, list.length ? list.map(function (u) {
      var b = h('button', { class: 'opt', 'aria-pressed': 'false' }, avatar(u.uid, u.name, 36), h('span', { class: 'txt' }, h('b', { text: u.name }), h('span', { text: u.email || '' })), h('span', { class: 'check' }));
      b.addEventListener('click', function () { picked[u.uid] = picked[u.uid] ? null : u; var on = !!picked[u.uid]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); clear(b.querySelector('.check')); if (on) b.querySelector('.check').appendChild(icon('check', 16, 3)); });
      return b;
    }) : h('p', { class: 'desc', text: 'Danh bạ trống: nhóm sẽ chỉ có anh, thêm người sau.' }));
    var go = h('button', { class: 'btn pri block' }, icon('users', 18), 'Tạo nhóm');
    go.addEventListener('click', function () {
      var n = name.value.trim(); if (n.length < 2) { err.textContent = 'Tên nhóm cần ít nhất 2 ký tự'; name.focus(); return; }
      var users = Object.keys(picked).map(function (k) { return picked[k]; }).filter(Boolean);
      busy(go, true, 'Đang tạo…');
      S.store.createGroup(n, users, project).then(function (cid) { closeSheet(); toast('Đã tạo nhóm “' + n + '”'); waitChat(cid, function () { openChat(cid); }); })
        .catch(function (e) { busy(go, false); err.textContent = errText(e); });
    });
    openSheet('Tạo nhóm', 'users', [
      h('div', { class: 'field' }, h('label', { for: 'g-name', text: 'Tên nhóm' }), h('div', { class: 'input' }, icon('edit', 18), name)),
      h('div', { class: 'card group' }, h('div', { class: 'item' }, h('span', { class: 'ic t-g' }, icon('briefcase', 19)), h('span', { class: 'txt' }, h('b', { text: 'Nhóm dự án' }), h('span', { text: 'Hiện trong bộ lọc Dự án' })), switchBtn(true, 'Nhóm dự án', function (v) { project = v; }))),
      h('div', { class: 'sec-title' }, icon('users', 14), 'CHỌN THÀNH VIÊN'), box, err, go
    ]);
  }

  /* --- Tab Danh bạ --- */
  function buildContactsTab() {
    var body = clear(S.ui.body); S.ui.list = null;
    var q = '';
    var input = h('input', { type: 'search', placeholder: 'Tìm trong danh bạ…', 'aria-label': 'Tìm trong danh bạ', onInput: function () { q = input.value; S.ui.cq = q; drawContacts(); } });
    S.ui.cq = '';
    body.appendChild(h('header', { class: 'top' },
      h('div', { class: 'top-row' }, h('div', { class: 'brand' }, icon('users', 22)), h('div', { style: 'flex:1' }, h('h1', { text: 'Danh bạ' }), h('span', { class: 'sub', text: 'Người trong các dự án của anh' })),
        ibtn('userPlus', 'Thêm người', addContactSheet)),
      h('label', { class: 'search' }, icon('search', 18), input)));
    var actions = h('div', { style: 'display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:12px 12px 0' },
      [['share', 't-b', 'Gửi link mời', inviteSheet], ['mail', 't-o', 'Thêm email', addContactSheet], ['qr', 't-g', 'Mã QR của tôi', myQrSheet], ['scan', 't-p', 'Quét mã QR', scanSheet]].map(function (a) {
        return h('button', { class: 'card', style: 'display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 6px;border:1px solid var(--line);font-size:13px;font-weight:600;color:var(--tx)', onClick: a[3] },
          h('span', { class: 'ic ' + a[1], style: 'width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center' }, icon(a[0], 20)), a[2]);
      }));
    body.appendChild(actions);
    S.ui.clist = h('div', { class: 'stack pad' });
    body.appendChild(h('div', { class: 'scroll' }, S.ui.clist));
    drawContacts();
  }
  function drawContacts() {
    var box = S.ui.clist; if (!box) return; clear(box);
    if (!S.contacts) { for (var i = 0; i < 4; i++) box.appendChild(h('div', { class: 'sk', style: 'height:66px' })); return; }
    var q = norm(S.ui.cq);
    var list = S.contacts.filter(function (c) { return !q || norm(c.name).indexOf(q) >= 0 || norm(c.email).indexOf(q) >= 0; });
    if (!list.length) {
      box.appendChild(h('div', { class: 'card empty' }, h('div', { class: 'art' }, icon(q ? 'search' : 'userPlus', 34)), h('b', { text: q ? 'Không tìm thấy' : 'Danh bạ đang trống' }),
        h('p', { text: q ? 'Thử tên hoặc email khác.' : 'Thêm đồng nghiệp bằng email đã đăng ký app, hoặc quét mã QR trên máy họ.' }),
        q ? null : h('button', { class: 'btn pri', onClick: addContactSheet }, icon('userPlus', 18), 'Thêm người')));
      return;
    }
    list.forEach(function (u) {
      box.appendChild(h('button', { class: 'row', onClick: function () { contactSheet(u); } }, avatar(u.uid, u.name, 46),
        h('div', { class: 'mid' }, h('div', { class: 'name' }, h('span', { text: u.name })), h('span', { class: 'last', text: u.email || 'Liên hệ trên máy' })),
        h('span', { class: 'chev', style: 'color:var(--tx-3)' }, icon('chev', 18))));
    });
  }
  function contactSheet(u) {
    openSheet(u.name, 'user', [
      h('div', { style: 'display:flex;align-items:center;gap:12px' }, avatar(u.uid, u.name, 56), h('div', null, h('b', { style: 'font-size:17px', text: u.name }), h('div', { class: 'hint', text: u.email || '' }))),
      h('button', { class: 'btn pri block', onClick: function () { openDirect(u); } }, icon('chat', 18), 'Nhắn tin'),
      h('button', { class: 'btn danger block', onClick: function () {
        confirmSheet('Xóa khỏi danh bạ?', u.name + ' sẽ bị xóa khỏi danh bạ của anh. Các cuộc trò chuyện vẫn giữ nguyên.', 'Xóa', true, function () { S.store.removeContact(u.uid).then(function () { toast('Đã xóa khỏi danh bạ'); }); });
      } }, icon('trash', 18), 'Xóa khỏi danh bạ')
    ]);
  }
  function addContactSheet() {
    var email = h('input', { type: 'email', inputmode: 'email', placeholder: 'dongnghiep@congty.vn', id: 'c-email' });
    var name = h('input', { type: 'text', placeholder: 'Tên gợi nhớ', id: 'c-name', maxlength: '40' });
    var err = h('div', { class: 'err-text', role: 'alert' });
    var go = h('button', { class: 'btn pri block' }, icon('userPlus', 18), 'Thêm vào danh bạ');
    var local = S.store.mode === 'local';
    go.addEventListener('click', function () {
      var e = email.value.trim(); err.textContent = '';
      if (!/^\S+@\S+\.\S+$/.test(e)) { err.textContent = 'Email không đúng định dạng'; email.focus(); return; }
      busy(go, true, 'Đang tìm…');
      S.store.addContactByEmail(e, name.value.trim()).then(function (u) { closeSheet(); toast('Đã thêm ' + u.name); }).catch(function (x) { busy(go, false); err.textContent = errText(x); });
    });
    openSheet('Thêm bằng email', 'mail', [
      h('p', { class: 'desc', text: local ? 'Chế độ thử: liên hệ chỉ lưu trên máy này.' : 'Người đó cần đã đăng ký Chat Khóa bằng email này.' }),
      h('div', { class: 'field' }, h('label', { for: 'c-email', text: 'Email' }), h('div', { class: 'input' }, icon('mail', 18), email)),
      local ? h('div', { class: 'field' }, h('label', { for: 'c-name', text: 'Tên' }), h('div', { class: 'input' }, icon('user', 18), name)) : null,
      err, go]);
  }
  function needCloud(what) {
    openSheet(what, 'server', h('div', { class: 'card empty' }, h('div', { class: 'art' }, icon('server', 34)), h('b', { text: 'Cần kết nối máy chủ' }),
      h('p', { text: 'Mã QR dùng để kết bạn giữa các máy, chỉ chạy khi app đã kết nối Firebase.' }),
      h('button', { class: 'btn pri', onClick: serverSheet }, icon('server', 18), 'Kết nối máy chủ')));
  }
  function myQrSheet() {
    if (S.store.mode !== 'cloud') { needCloud('Mã QR của tôi'); return; }
    var qr = window.qrcode(0, 'M'); qr.addData(myInviteUrl() || ('daochat:' + S.me.uid)); qr.make();
    openSheet('Mã QR của tôi', 'qr', [
      h('p', { class: 'desc', text: 'Đưa mã này cho đồng nghiệp quét để thêm anh vào danh bạ.' }),
      h('div', { class: 'qr' }, h('img', { src: qr.createDataURL(8, 2), alt: 'Mã QR kết bạn của ' + S.me.name })),
      h('div', { style: 'text-align:center' }, h('b', { text: S.me.name }), h('div', { class: 'hint', text: S.me.email }))]);
  }
  function scanSheet() {
    if (S.store.mode !== 'cloud') { needCloud('Quét mã QR'); return; }
    var video = h('video', { playsinline: true, muted: true, autoplay: true });
    video.muted = true;
    var status = h('p', { class: 'desc', style: 'text-align:center', text: 'Đang mở camera…' });
    var stream = null, stop = false, detector = null, cv = document.createElement('canvas');
    function end() { stop = true; if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); }
    function found(text) {
      end(); closeSheet();
      var inv = readInvite(text);
      if (inv) { LS.lsSet('dao_invite', inv); processInvite(); return; }
      var m = /^daochat:([A-Za-z0-9]{10,40})$/.exec(text || '');
      if (!m) { toast('Mã QR không phải của Chat Khóa', true); return; }
      S.store.addContactByUid(m[1]).then(function (u) { toast('Đã thêm ' + u.name); contactSheet(u); }).catch(function (e) { toast(errText(e), true); });
    }
    function loadJsQR() {
      return window.jsQR ? Promise.resolve() : new Promise(function (res, rej) { var s = h('script', { src: 'vendor/jsQR.js' }); s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    }
    function tick() {
      if (stop) return;
      if (video.readyState < 2) { requestAnimationFrame(tick); return; }
      if (detector) {
        detector.detect(video).then(function (r) { if (r && r[0]) found(r[0].rawValue); else setTimeout(tick, 200); }).catch(function () { detector = null; tick(); });
        return;
      }
      cv.width = video.videoWidth; cv.height = video.videoHeight;
      var ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(video, 0, 0);
      var img = ctx.getImageData(0, 0, cv.width, cv.height);
      var r = window.jsQR && window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (r) found(r.data); else setTimeout(tick, 220);
    }
    openSheet('Quét mã QR', 'scan', [h('div', { class: 'cam' }, video, h('div', { class: 'frame' })), status], end);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { status.textContent = 'Máy này không mở được camera trong app.'; return; }
    var prep = ('BarcodeDetector' in window) ? window.BarcodeDetector.getSupportedFormats().then(function (f) { if (f.indexOf('qr_code') >= 0) detector = new window.BarcodeDetector({ formats: ['qr_code'] }); else return loadJsQR(); }).catch(loadJsQR) : loadJsQR();
    prep.then(function () { return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); }).then(function (s) {
      if (stop) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s; video.srcObject = s; video.play(); status.textContent = 'Đưa mã QR vào giữa khung';
      tick();
    }).catch(function () { status.textContent = 'Chưa có quyền dùng camera. Anh cho phép camera trong cài đặt máy rồi thử lại.'; });
  }

  /* --- Tab Cài đặt --- */
  function item(ic, tone, title, desc, right, onClick) {
    var inner = [h('span', { class: 'ic ' + tone }, icon(ic, 19)), h('span', { class: 'txt' }, h('b', { text: title }), desc ? h('span', { text: desc }) : null), right || (onClick ? h('span', { class: 'chev' }, icon('chev', 18)) : null)];
    return onClick ? h('button', { class: 'item', onClick: onClick }, inner) : h('div', { class: 'item' }, inner);
  }
  function buildSettingsTab() {
    var body = clear(S.ui.body); S.ui.list = null; S.ui.clist = null;
    var me = S.me, cloud = S.store.mode === 'cloud';
    body.appendChild(h('header', { class: 'top' }, h('div', { class: 'top-row' }, h('div', { class: 'brand' }, icon('settings', 22)), h('div', { style: 'flex:1' }, h('h1', { text: 'Cài đặt' }), h('span', { class: 'sub', text: 'Bảo mật, giao diện, máy chủ' })))));
    var fpSw = switchBtn(S.set.fp, 'Mở bằng vân tay', function (v, b) {
      if (!v) { S.set.fp = false; saveSet(); toast('Đã tắt vân tay'); return; }
      if (!S.bio) { b.setAttribute('aria-checked', 'false'); toast('Máy này chưa hỗ trợ vân tay trong app', true); return; }
      Sec.bioEnroll().then(function () { S.set.fp = true; saveSet(); toast('Đã bật mở bằng vân tay'); })
        .catch(function () { b.setAttribute('aria-checked', 'false'); toast('Chưa bật được vân tay', true); buildSettingsTab(); });
    });
    function tog(key, label, after) { return switchBtn(!!S.set[key], label, function (v) { S.set[key] = v; saveSet(); toast((v ? 'Đã bật: ' : 'Đã tắt: ') + label); if (after) after(v); }); }
    var sc = h('div', { class: 'stack pad', style: 'gap:6px' },
      h('div', { class: 'card', style: 'display:flex;align-items:center;gap:12px;padding:14px' }, avatar(me.uid, me.name, 52),
        h('div', { style: 'flex:1;min-width:0' }, h('b', { style: 'font-size:17px;display:block', text: me.name }), h('span', { class: 'hint', text: cloud ? me.email : 'Chế độ thử trên máy' })),
        ibtn('edit', 'Đổi tên hiển thị', profileSheet)),
      h('div', { class: 'sec-title' }, icon('lock', 14), 'KHÓA'),
      h('div', { class: 'card group' },
        item('fp', 't-g', 'Mở bằng vân tay', S.bio ? 'Dùng thay PIN chung' : 'Máy hoặc trình duyệt chưa hỗ trợ', fpSw),
        item('clock', 't-b', 'Tự khóa khi thoát', 'Rời chat, chuyển app, tắt màn hình là khóa lại', tog('auto', 'Tự khóa khi thoát')),
        item('eyeOff', 't-o', 'Che nội dung thông báo', 'Chỉ báo “Có tin nhắn mới”', tog('hide', 'Che nội dung thông báo')),
        item('key', 't-b', 'Đổi PIN chung', 'Nhập PIN cũ rồi PIN mới', null, changePin),
        item('shield', 't-o', 'Chat đang khóa', Sec.lockedCount() + ' cuộc trò chuyện trên máy này', null, function () { S.tab = 'chats'; S.filter = 'locked'; renderMainBody(true); })),
      h('div', { class: 'sec-title' }, icon('moon', 14), 'GIAO DIỆN & ÂM THANH'),
      h('div', { class: 'card group' },
        item('moon', 't-p', 'Chế độ tối', 'Dịu mắt khi dùng ban đêm', tog('dark', 'Chế độ tối', applyTheme)),
        item('music', 't-p', 'Nhạc nền nhẹ', 'Tắt mặc định để không phiền', tog('music', 'Nhạc nền', function (v) { Music.set(v); })),
        item('bell', 't-b', 'Thông báo tin mới', 'Báo khi app chạy nền', tog('notify', 'Thông báo', function (v) { if (v) askNotify(); }))),
      h('div', { class: 'sec-title' }, icon('server', 14), 'MÁY CHỦ'),
      h('div', { class: 'card group' },
        item('server', cloud ? 't-g' : 't-o', cloud ? 'Đã kết nối Firebase' : 'Chưa kết nối máy chủ', cloud ? 'Dự án: ' + (S.store.config.projectId || '') : 'Đang ở chế độ thử, chỉ dùng trên máy này', null, serverSheet)),
      h('div', { class: 'sec-title' }, icon('phone', 14), 'ỨNG DỤNG'),
      h('div', { class: 'card group' },
        S.installEvt ? item('download', 't-g', 'Cài lên màn hình chính', 'Dùng như app, mở nhanh, chạy cả khi mất mạng', null, installPwa) : null,
        item('refresh', 't-g', 'Kiểm tra cập nhật', 'Phiên bản ' + CFG.VERSION + (NATIVE ? ' · Android' : ' · Web'), null, checkUpdate),
        cloud ? item('userPlus', 't-b', 'Mời người chat với anh', 'Gửi link qua Zalo, bấm vào là chat được', null, inviteSheet) : null,
        item('share', 't-b', 'Chia sẻ app', 'Gửi link cài đặt app', null, shareApp),
        item('book', 't-b', 'Hướng dẫn sử dụng', 'Khóa chat, tạo nhóm, gửi file', null, helpSheet),
        item('info', 't-b', 'Giới thiệu & quyền riêng tư', 'Dữ liệu lưu ở đâu, giới hạn bảo mật', null, aboutSheet)),
      h('div', { class: 'sec-title' }, icon('user', 14), 'TÀI KHOẢN'),
      h('div', { class: 'card group' },
        cloud ? item('logout', 't-o', 'Đăng xuất', 'Khóa lại và thoát tài khoản trên máy này', null, function () {
          confirmSheet('Đăng xuất?', 'Anh cần email và mật khẩu để đăng nhập lại.', 'Đăng xuất', false, function () { Sec.lockAll(); S.store.signOut(); });
        }) : null,
        item('trash', 't-r', 'Xóa dữ liệu trên máy này', 'Xóa PIN, khóa, cài đặt' + (cloud ? ', đăng xuất' : ', dữ liệu thử'), null, wipeAll)),
      h('p', { class: 'hint', style: 'text-align:center;margin:14px 0 0', text: 'Chat Khóa Đạo Pro ' + CFG.VERSION }));
    body.appendChild(h('div', { class: 'scroll' }, sc));
  }
  function applyTheme() {
    if (S.set.dark) document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
    LS.lsSet('dao_theme', S.set.dark ? 'dark' : 'light');
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', S.set.dark ? '#0E1422' : '#1550E8');
    if (NATIVE && NATIVE.setTheme) NATIVE.setTheme(S.set.dark ? 'dark' : 'light');
  }
  function profileSheet() {
    var n = h('input', { type: 'text', value: S.me.name, maxlength: '40', id: 'p-name' });
    var go = h('button', { class: 'btn pri block', text: 'Lưu' });
    go.addEventListener('click', function () {
      var v = n.value.trim(); if (v.length < 2) { toast('Tên cần ít nhất 2 ký tự', true); return; }
      busy(go, true); S.store.updateProfile(v).then(function () { closeSheet(); toast('Đã đổi tên'); buildSettingsTab(); }).catch(function (e) { busy(go, false); toast(errText(e), true); });
    });
    openSheet('Tên hiển thị', 'edit', [h('div', { class: 'field' }, h('label', { for: 'p-name', text: 'Tên người khác nhìn thấy' }), h('div', { class: 'input' }, icon('user', 18), n)), go]);
  }
  function changePin() {
    var steps = [
      { title: 'Nhập PIN hiện tại', sub: 'Xác nhận trước khi đổi', check: function (c) { return Sec.checkPin(c); } },
      { title: 'Nhập PIN mới', sub: '4 số' },
      { title: 'Nhập lại PIN mới', counts: false, failText: 'Hai lần nhập không khớp', check: function (c, codes) { return c === codes[1]; } }
    ];
    pushNav();
    pinScreen({ icon: 'key', steps: steps, cancel: navBack, onDone: function (codes) {
      Sec.setPin(codes[1]).then(function () { toast('Đã đổi PIN chung'); S.tab = 'settings'; navBack(); });
    } });
  }
  function serverSheet() {
    var cloud = S.store.mode === 'cloud';
    var ta = h('textarea', { rows: '7', id: 's-cfg', placeholder: 'const firebaseConfig = {\n  apiKey: "…",\n  authDomain: "…",\n  projectId: "…",\n  appId: "…"\n};', style: 'width:100%;border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--bg);font-family:ui-monospace,monospace;font-size:13px;resize:vertical', 'data-nofocus': true });
    var err = h('div', { class: 'err-text', role: 'alert' });
    var save = h('button', { class: 'btn pri block' }, icon('server', 18), 'Lưu và khởi động lại');
    save.addEventListener('click', function () {
      var cfg = parseConfig(ta.value);
      if (!cfg) { err.textContent = 'Chưa đọc được cấu hình. Anh dán nguyên khối firebaseConfig từ Firebase.'; return; }
      LS.lsSet('dao_firebase_config', cfg); toast('Đã lưu, đang khởi động lại…');
      setTimeout(function () { location.reload(); }, 700);
    });
    openSheet(cloud ? 'Máy chủ Firebase' : 'Kết nối máy chủ', 'server', [
      h('p', { class: 'desc', text: cloud ? 'Đang dùng dự án “' + S.store.config.projectId + '”. Dán cấu hình khác để đổi.' : 'Tạo dự án miễn phí trên console.firebase.google.com, bật Authentication (Email/Password) và Firestore, rồi dán cấu hình web app vào đây. Hướng dẫn chi tiết trong file HUONG-DAN-FIREBASE.md.' }),
      h('label', { for: 's-cfg', class: 'hint', text: 'Cấu hình firebaseConfig' }), ta, err, save,
      cloud ? h('button', { class: 'btn sec block', text: 'Ngắt kết nối, về chế độ thử', onClick: function () {
        confirmSheet('Ngắt kết nối máy chủ?', 'App sẽ chạy chế độ thử trên máy. Dữ liệu trên máy chủ không bị xóa.', 'Ngắt kết nối', true, function () { LS.lsSet('dao_firebase_config', null); S.store.signOut().then(function () { location.reload(); }); });
      } }) : null]);
  }
  function parseConfig(text) {
    var m = /\{[\s\S]*\}/.exec(text || ''); if (!m) return null;
    var s = m[0].replace(/\/\/.*$/gm, '').replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":').replace(/'/g, '"').replace(/,\s*}/g, '}');
    try { var o = JSON.parse(s); return o.apiKey && o.projectId ? o : null; } catch (e) { return null; }
  }
  function installPwa() {
    var e = S.installEvt; if (!e) return;
    e.prompt(); e.userChoice.then(function (r) { if (r.outcome === 'accepted') toast('Đang cài lên màn hình chính'); S.installEvt = null; buildSettingsTab(); });
  }
  function appUrl() { return CFG.APP_URL || (location.protocol.indexOf('http') === 0 && location.hostname !== 'appassets.androidplatform.net' ? location.origin + location.pathname.replace(/[^/]*$/, '') : ''); }
  function shareApp() {
    var url = appUrl();
    if (!url) { toast('Chưa có địa chỉ chia sẻ (APP_URL trong config.js)', true); return; }
    var data = { title: 'Chat Khóa Đạo Pro', text: 'Chat cho nhóm dự án, khóa riêng từng cuộc trò chuyện. Cài tại:', url: url };
    if (NATIVE && NATIVE.share) { NATIVE.share(data.text + ' ' + url); return; }
    if (navigator.share) navigator.share(data).catch(function () { /* người dùng hủy */ });
    else copyText(url);
  }
  function cmpVer(a, b) { a = String(a).split('.').map(Number); b = String(b).split('.').map(Number); for (var i = 0; i < 3; i++) { if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0); } return 0; }
  function checkUpdate() {
    var base = appUrl();
    toast('Đang kiểm tra…');
    if (!NATIVE && navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then(function (r) { if (r) r.update(); }).catch(function () { /* bỏ qua */ });
    }
    if (!base) { setTimeout(function () { toast('Chưa cấu hình địa chỉ cập nhật', true); }, 400); return; }
    fetch(base + 'version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); }).then(function (v) {
      if (cmpVer(v.version, CFG.VERSION) <= 0) { toast('Anh đang dùng bản mới nhất (' + CFG.VERSION + ')'); return; }
      openSheet('Có bản mới ' + v.version, 'refresh', [
        h('p', { class: 'desc', text: v.notes || 'Bản cập nhật sửa lỗi và cải thiện.' }),
        NATIVE ? h('button', { class: 'btn pri block', onClick: function () { if (NATIVE.openUrl) NATIVE.openUrl(v.apkUrl || base); } }, icon('download', 18), 'Tải bản APK mới')
          : h('button', { class: 'btn pri block', onClick: function () { location.reload(); } }, icon('refresh', 18), 'Cập nhật ngay')]);
    }).catch(function () { toast('Không kiểm tra được, anh thử lại khi có mạng', true); });
  }
  function helpSheet() {
    var tips = [
      ['lock', 't-o', 'Khóa một chat', 'Mở chat, bấm biểu tượng ổ khóa vàng trên thanh tiêu đề, chọn PIN chung hoặc Mật khẩu riêng.'],
      ['shield', 't-b', 'Khóa tất cả ngay', 'Ở màn Tin nhắn, bấm biểu tượng khiên để khóa lại mọi chat đang mở.'],
      ['users', 't-g', 'Tạo nhóm dự án', 'Bấm nút + rồi chọn Tạo nhóm, đặt tên và chọn thành viên từ danh bạ.'],
      ['clip', 't-b', 'Gửi ảnh, file', 'Bấm kẹp giấy trong chat. Ảnh tự nén, file tối đa khoảng 680 KB ở gói miễn phí.'],
      ['qr', 't-p', 'Kết bạn bằng QR', 'Danh bạ > Mã QR của tôi để người khác quét, hoặc Quét mã QR để thêm họ.'],
      ['search', 't-b', 'Tìm tin nhắn cũ', 'Trong chat, bấm kính lúp để tìm và tô sáng tin nhắn.']
    ];
    openSheet('Hướng dẫn sử dụng', 'book', h('div', { class: 'card group' }, tips.map(function (t) { return item(t[0], t[1], t[2], t[3]); })));
  }
  function aboutSheet() {
    var cloud = S.store.mode === 'cloud';
    openSheet('Giới thiệu & quyền riêng tư', 'info', h('div', { class: 'card group' },
      item('phone', 't-b', 'Khóa nằm trên máy', 'PIN và mật khẩu riêng lưu dạng mã băm trên máy này, không gửi lên máy chủ.'),
      item('server', 't-g', 'Tin nhắn lưu ở đâu', cloud ? 'Trên Firestore của dự án Firebase anh tạo. Chỉ thành viên trong chat đọc được (theo luật bảo mật).' : 'Chế độ thử: chỉ lưu trong bộ nhớ của app trên máy này.'),
      item('alert', 't-o', 'Giới hạn', 'Khóa trong app chặn người cầm máy, không phải mã hóa đầu cuối. Không gửi mật khẩu ngân hàng qua chat.'),
      item('bell', 't-b', 'Thông báo', 'Báo tin mới khi app đang chạy hoặc chạy nền. Thông báo khi app đã đóng hẳn cần thêm dịch vụ đẩy (bản sau).'),
      item('trash', 't-r', 'Xóa dữ liệu', 'Cài đặt > Xóa dữ liệu trên máy này. Tin đã gửi trên máy chủ xóa từng tin trong chat.')));
  }
  function wipeAll() {
    confirmSheet('Xóa dữ liệu trên máy?', 'Xóa PIN, khóa chat, cài đặt' + (S.store.mode === 'cloud' ? ' và đăng xuất.' : ' và dữ liệu thử.') + ' Không hoàn tác được.', 'Xóa hết', true, function () {
      Sec.wipe();
      ['dao_settings', 'dao_onboarded', 'dao_theme'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* bỏ qua */ } });
      S.store.wipe().then(function () { location.reload(); });
    });
  }
  function askNotify() {
    if (NATIVE && NATIVE.requestNotify) { NATIVE.requestNotify(); return; }
    if (window.Notification && Notification.permission === 'default') Notification.requestPermission();
  }

  /* ---------- Nhạc nền nhẹ (tạo bằng WebAudio, không cần file) ---------- */
  var Music = (function () {
    var ctx = null, master = null, timer = null, on = false;
    var CHORDS = [[220, 277.18, 329.63], [196, 246.94, 293.66], [174.61, 220, 261.63], [196, 246.94, 329.63]];
    var ci = 0;
    function play() {
      var now = ctx.currentTime;
      CHORDS[ci++ % CHORDS.length].forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i === 0 ? 'triangle' : 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.05, now + 2); g.gain.linearRampToValueAtTime(0, now + 7.8);
        o.connect(g); g.connect(master); o.start(now); o.stop(now + 8);
      });
    }
    function start() {
      if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200; master.connect(lp); lp.connect(ctx.destination); }
      ctx.resume(); play(); clearInterval(timer); timer = setInterval(play, 6500);
    }
    function stopIt() { clearInterval(timer); timer = null; if (ctx) ctx.suspend(); }
    return {
      set: function (v) { on = v; if (v) start(); else stopIt(); },
      pause: function () { if (on) stopIt(); },
      resume: function () { if (on) start(); }
    };
  })();

  /* ---------- Sự kiện hệ thống ---------- */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      Music.pause();
      if (S.set.auto) {
        document.body.classList.add('hidden-app');
        Sec.lockAll();
        if (S.screen === 'chat' && S.cur && Sec.lockOf(S.cur) !== 'none') { depth = 0; try { history.replaceState(null, ''); } catch (e) { /* bỏ qua */ } goMain(true); }
      }
    } else {
      document.body.classList.remove('hidden-app');
      Music.resume();
    }
  });
  window.addEventListener('online', function () { S.online = true; refresh(); toast('Đã có mạng trở lại'); });
  window.addEventListener('offline', function () { S.online = false; refresh(); });
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); S.installEvt = e; if (S.screen === 'main' && S.tab === 'settings') buildSettingsTab(); });
  window.addEventListener('appinstalled', function () { S.installEvt = null; toast('Đã cài Chat Khóa lên màn hình chính'); });
  if (S.set.music) {
    var kick = function () { Music.set(true); document.removeEventListener('pointerdown', kick); };
    document.addEventListener('pointerdown', kick);
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !NATIVE) {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      reg.addEventListener('updatefound', function () {
        var w = reg.installing; if (!w) return;
        w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) toast('Có bản mới, mở lại app để cập nhật'); });
      });
    }).catch(function () { /* bỏ qua */ });
  }

  captureInvite(location.hash);
  applyTheme();
  Sec.bioKind().then(function (k) { S.bio = k; if (!k && S.set.fp) { S.set.fp = false; saveSet(); } });
  boot();
})();
