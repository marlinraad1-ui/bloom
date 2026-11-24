// Service worker: offline cache + notification clicks
const CACHE = 'bloom-v40';
const FILES = ['./', './index.html', './styles.css', './data.js', './chat.js', './app.js', './program.js', './vision.js', './config.js', './community.js', './friends.js', './auth.js', './vip.js', './food.js', './exercises.js', './videos.js', './gear.js', './intervals.js', './coach.js', './ytworkouts.js', './water.js', './undo.js', './fastview.js', './together.js', './safety.js', './native.js', './icons.js', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // only Bloom's own files go through the offline cache (videos, fonts and the server go straight to the network)
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    // always ask the server if a file changed (fresh updates), fall back to the offline copy
    (e.request.mode === 'navigate' ? fetch(e.request) : fetch(e.request, { cache: 'no-cache' })).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./index.html');
  }));
});
