/* 인터넷이 연결되어 있으면 항상 최신 파일을 받고, 끊겼을 때만 저장해 둔 파일을 씁니다. */
const CACHE = 'blockland-v19';
const FILES = ['./', './index.html', './style.css', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png',
  './js/data.js', './js/engine.js', './js/content.js', './js/hangul.js', './js/numbers.js', './js/english.js', './js/science.js', './js/curriculum.js', './js/stories3.js', './js/baked.js', './js/kid.js', './js/three3d.js', './js/three3d_chars.js', './js/three3d_bg.js', './js/three3d_map.js', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', './js/story1.js', './js/stories2.js', './js/games.js', './js/games2.js', './js/app.js', './js/toys.js', './js/toy.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // 구워 둔 3D 그림은 이름(?v=)이 바뀌지 않는 한 그대로라서, 저장해 둔 것을 먼저 쓴다.
  if (e.request.url.includes('/img3d/')) { e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }))); return; }
  e.respondWith(fetch(e.request, { cache: 'no-store' }).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
