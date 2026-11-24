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

  /* SHA-256 viết bằng JS: dự phòng khi trình duyệt không cho dùng crypto.subtle */
  function sha256(bytes) {
    var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var l = bytes.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n);
    m.set(bytes); m[l] = 0x80;
    var bits = l * 8; m[n - 4] = bits >>> 24; m[n - 3] = (bits >>> 16) & 255; m[n - 2] = (bits >>> 8) & 255; m[n - 1] = bits & 255;
    var w = new Array(64);
    function r(x, k) { return (x >>> k) | (x << (32 - k)); }
    for (var o = 0; o < n; o += 64) {
      for (var i = 0; i < 16; i++) w[i] = (m[o + i * 4] << 24) | (m[o + i * 4 + 1] << 16) | (m[o + i * 4 + 2] << 8) | m[o + i * 4 + 3];
      for (i = 16; i < 64; i++) {
        var s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        var t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = new Uint8Array(32);
    for (i = 0; i < 8; i++) { out[i * 4] = H[i] >>> 24; out[i * 4 + 1] = (H[i] >>> 16) & 255; out[i * 4 + 2] = (H[i] >>> 8) & 255; out[i * 4 + 3] = H[i] & 255; }
    return out;
  }
  function utf8(str) { return unescape(encodeURIComponent(str)).split('').map(function (c) { return c.charCodeAt(0); }); }
  function hashJs(code, saltB64) {
    var salt = Array.prototype.slice.call(unb64(saltB64)), codeB = utf8(code);
    var h = sha256(new Uint8Array(salt.concat(codeB)));
    for (var i = 0; i < 20000; i++) h = sha256(new Uint8Array(Array.prototype.slice.call(h).concat(salt)));
    return Promise.resolve(b64(h));
  }
  function hashSubtle(code, saltB64) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unb64(saltB64), iterations: ITER, hash: 'SHA-256' }, k, 256);
    }).then(b64);
  }
  function hasSubtle() { return !!(window.crypto && crypto.subtle && window.TextEncoder); }
  function hash(code, saltB64, alg) {
    if (alg === 'js') return hashJs(code, saltB64);
    return hashSubtle(code, saltB64);
  }
  function makeSecret(code) {
    var salt = b64(rand(16));
    if (!hasSubtle()) return hashJs(code, salt).then(function (h) { return { salt: salt, hash: h, alg: 'js' }; });
    return hashSubtle(code, salt).then(function (h) { return { salt: salt, hash: h }; })
      .catch(function () { return hashJs(code, salt).then(function (h) { return { salt: salt, hash: h, alg: 'js' }; }); });
  }
  function check(code, secret) {
    if (!secret) return Promise.resolve(false);
    return hash(code, secret.salt, secret.alg).then(function (h) { return h === secret.hash; });
  }
  function rand(n) {
    var a = new Uint8Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (var i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
    return a;
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
