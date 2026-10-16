/* 電波がなくてもアプリを開けるようにするためのファイル。
   一度書いたら、ふだんは触らない。
   index.html を直したときは、下の VERSION の数字を1つ増やす。 */

var VERSION = 'nokichi-v2';
var FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) {
      return c.addAll(FILES).catch(function () { return c.add('./index.html'); });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === VERSION ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* まずキャッシュから返す（電波がなくても確実に開く）。
   そのうしろで新しいものを取りに行って、次回に備える。 */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var u = new URL(req.url);
  /* 自分のファイルと、文字の形（フォント）だけを持っておく */
  var isFont = (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com');
  if (u.origin !== self.location.origin && !isFont) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) {
          caches.open(VERSION).then(function (c) { c.put(req, res.clone()); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});

self.addEventListener('message', function (e) {
  if (e.data === 'skip-waiting') self.skipWaiting();
});
