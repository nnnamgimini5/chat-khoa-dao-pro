/* Khóa trên máy: PIN chung, mật khẩu riêng từng chat, khóa tạm khi nhập sai, vân tay.
   Mã không lưu dạng chữ thường: chỉ lưu muối + băm PBKDF2-SHA256. */
(function () {
  'use strict';
  var KEY = 'dao_locks_v1';
  var FAIL_KEY = 'dao_fail_v1';
  var MAX_FAIL = 5, LOCK_MS = 30000, ITER = 120000;

  function load() { return window.DaoStore.lsGet(KEY, { pin: null, chats: {}, bioId: null }); }
  function save(d) { window.DaoStore.lsSet(KEY, d); }
  function b64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
  function unb64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function rand(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return a; }

  function hash(code, saltB64) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unb64(saltB64), iterations: ITER, hash: 'SHA-256' }, k, 256);
    }).then(b64);
  }
  function makeSecret(code) {
    var salt = b64(rand(16));
    return hash(code, salt).then(function (h) { return { salt: salt, hash: h }; });
  }
  function check(code, secret) {
    if (!secret) return Promise.resolve(false);
    return hash(code, secret.salt).then(function (h) { return h === secret.hash; });
  }

  var unlocked = {}; // chatId -> true trong phiên hiện tại

  var Sec = {
    hasPin: function () { return !!load().pin; },
    setPin: function (code) { return makeSecret(code).then(function (s) { var d = load(); d.pin = s; save(d); }); },
    checkPin: function (code) { return check(code, load().pin); },
    lockOf: function (chatId) { var c = load().chats[chatId]; return c ? c.mode : 'none'; },
    setLock: function (chatId, mode, privateCode) {
      var d = load();
      if (mode === 'none') { delete d.chats[chatId]; save(d); return Promise.resolve(); }
      if (mode === 'pin') { d.chats[chatId] = { mode: 'pin' }; save(d); return Promise.resolve(); }
      return makeSecret(privateCode).then(function (s) { var d2 = load(); d2.chats[chatId] = { mode: 'private', secret: s }; save(d2); });
    },
    checkPrivate: function (chatId, code) { var c = load().chats[chatId]; return check(code, c && c.secret); },
    lockedCount: function () { return Object.keys(load().chats).length; },
    isUnlocked: function (chatId) { return !!unlocked[chatId]; },
    markUnlocked: function (chatId) { unlocked[chatId] = true; },
    lockAll: function () { unlocked = {}; },
    lockOne: function (chatId) { delete unlocked[chatId]; },

    /* Nhập sai nhiều lần */
    lockoutLeft: function () {
      var f = window.DaoStore.lsGet(FAIL_KEY, { n: 0, until: 0 });
      return Math.max(0, f.until - Date.now());
    },
    fail: function () {
      var f = window.DaoStore.lsGet(FAIL_KEY, { n: 0, until: 0 });
      f.n += 1;
      if (f.n >= MAX_FAIL) { f.until = Date.now() + LOCK_MS; f.n = 0; }
      window.DaoStore.lsSet(FAIL_KEY, f);
      return { left: MAX_FAIL - f.n, locked: f.until > Date.now() };
    },
    success: function () { window.DaoStore.lsSet(FAIL_KEY, { n: 0, until: 0 }); },

    /* Vân tay: ưu tiên cầu nối Android (BiometricPrompt), sau đó WebAuthn trên Chrome */
    bioKind: function () {
      if (window.DaoNative && window.DaoNative.hasBiometric && window.DaoNative.hasBiometric()) return Promise.resolve('native');
      if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(function (ok) { return ok ? 'webauthn' : null; }).catch(function () { return null; });
      }
      return Promise.resolve(null);
    },
    bioEnroll: function () {
      return Sec.bioKind().then(function (k) {
        if (k === 'native') return true;
        if (k !== 'webauthn') throw new Error('nobio');
        return navigator.credentials.create({ publicKey: {
          challenge: rand(32), rp: { name: 'Chat Khóa Đạo Pro' },
          user: { id: rand(16), name: 'dao-local', displayName: 'Chat Khóa' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
          timeout: 60000
        } }).then(function (cred) { var d = load(); d.bioId = b64(cred.rawId); save(d); return true; });
      });
    },
    bioAuth: function () {
      return Sec.bioKind().then(function (k) {
        if (k === 'native') {
          return new Promise(function (resolve, reject) {
            var id = 'b' + Date.now();
            Sec._pending[id] = function (ok, msg) { ok ? resolve(true) : reject(new Error(msg || 'cancel')); };
            window.DaoNative.authenticate(id);
          });
        }
        var d = load();
        if (k !== 'webauthn' || !d.bioId) throw new Error('nobio');
        return navigator.credentials.get({ publicKey: {
          challenge: rand(32), allowCredentials: [{ type: 'public-key', id: unb64(d.bioId) }],
          userVerification: 'required', timeout: 60000
        } }).then(function () { return true; });
      });
    },
    _pending: {},
    wipe: function () { try { localStorage.removeItem(KEY); localStorage.removeItem(FAIL_KEY); } catch (e) { /* bỏ qua */ } unlocked = {}; }
  };
  /* Android gọi lại hàm này sau khi quét vân tay */
  window.DaoBio = { resolve: function (id, ok, msg) { var f = Sec._pending[id]; delete Sec._pending[id]; if (f) f(!!ok, msg); } };
  window.DaoSec = Sec;
})();
