/* Service worker: lưu sẵn app để mở nhanh và chạy khi mất mạng. Đổi VERSION mỗi lần phát hành. */
var VERSION = 'chatkhoa-1.1.0';
var CORE = [
  './app.js',
  './config.js',
  './fonts/be-vietnam-pro-latin-400-normal.woff2',
  './fonts/be-vietnam-pro-latin-500-normal.woff2',
  './fonts/be-vietnam-pro-latin-600-normal.woff2',
  './fonts/be-vietnam-pro-latin-700-normal.woff2',
  './fonts/be-vietnam-pro-vietnamese-400-normal.woff2',
  './fonts/be-vietnam-pro-vietnamese-500-normal.woff2',
  './fonts/be-vietnam-pro-vietnamese-600-normal.woff2',
  './fonts/be-vietnam-pro-vietnamese-700-normal.woff2',
  './fonts/fonts.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './index.html',
  './manifest.webmanifest',
  './security.js',
  './store.js',
  './styles.css',
  './vendor/firebase-app-compat.js',
  './vendor/firebase-auth-compat.js',
  './vendor/firebase-firestore-compat.js',
  './vendor/qrcode.js'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE.map(function (u) { return u === './index.html' ? './' : u; }).concat(['./index.html'])); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; /* Firebase và dịch vụ ngoài: đi thẳng mạng */
  if (url.pathname.endsWith('/version.json')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put('./', cp); }); return r; }).catch(function () { return caches.match('./'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (r) { if (r.ok) { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, cp); }); } return r; });
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(function (cs) { if (cs[0]) return cs[0].focus(); return self.clients.openWindow('./'); }));
});
