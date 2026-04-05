const CACHE_NAME = 'moch-sheli-v1';
const ASSETS = ['/', '/moch-sheli/', '/moch-sheli/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  // Handle share target POST
  if (e.request.method === 'POST' && e.request.url.includes('/share')) {
    e.respondWith((async () => {
      const formData = await e.request.formData();
      const file = formData.get('file');
      const text = formData.get('text') || '';
      const title = formData.get('title') || '';

      // Store shared data for the app to pick up
      const client = await self.clients.get(e.resultingClientId || e.clientId);
      const sharedData = { text, title, hasFile: !!file };

      if (file) {
        const buffer = await file.arrayBuffer();
        sharedData.fileName = file.name;
        sharedData.fileType = file.type;
        sharedData.fileData = Array.from(new Uint8Array(buffer));
      }

      // Store in cache for app to retrieve
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/moch-sheli/shared-data', new Response(JSON.stringify(sharedData)));

      return Response.redirect('/moch-sheli/?shared=1', 303);
    })());
    return;
  }

  // Normal fetch with cache fallback
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
