const CACHE_NAME = '1a2b-game-v1';

// 要快取的資源（讓 App 在網路不佳時也能開啟）
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// 安裝 Service Worker：快取靜態資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 啟動：清除舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 攔截網路請求：優先網路，失敗時用快取
self.addEventListener('fetch', (event) => {
  // Supabase API 請求永遠走網路，不快取
  if (event.request.url.includes('supabase.co') ||
      event.request.url.includes('jsdelivr.net')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功時更新快取
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // 網路失敗時用快取
        return caches.match(event.request);
      })
  );
});
