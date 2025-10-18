const CACHE_NAME = 'yadooni-pwa-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './pages.json',
  './icon-192.png',
  './icon-512.png',
  './yadooni.pdf'
];

// Include all page images in the cache at install
let PAGES = [];
self.addEventListener('install', (e)=>{
  e.waitUntil((async ()=>{
    try{
      const res = await fetch('./pages.json');
      PAGES = await res.json();
    }catch(_){ PAGES = []; }
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE.concat(PAGES.map(n => './' + n)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e)=>{
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  // only handle same-origin
  if (url.origin === location.origin) {
    e.respondWith((async ()=>{
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(e.request);
      if (cached) return cached;
      try{
        const res = await fetch(e.request);
        // cache GET responses
        if (e.request.method === 'GET' && res.ok) {
          cache.put(e.request, res.clone());
        }
        return res;
      }catch(err){
        // fallback: if request is an image page, maybe show nearest cached page
        return cached || Response.error();
      }
    })());
  }
});
