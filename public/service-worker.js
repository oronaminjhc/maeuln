// public/service-worker.js

const CACHE_NAME = 'maeuln-cache-v1';
// 앱을 열었을 때 미리 저장해 둘 파일 목록입니다.
// index.html과 manifest.json, 로고 파일 등을 포함시키는 것이 좋습니다.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// 1. 서비스 워커 설치
self.addEventListener('install', (event) => {
  // 캐시를 열고 urlsToCache에 있는 모든 파일을 저장합니다.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // 먼저 캐시에서 요청과 일치하는 것이 있는지 찾습니다.
    caches.match(event.request)
      .then((response) => {
        // 캐시에 응답이 있으면 캐시된 값을 반환합니다.
        if (response) {
          return response;
        }

        // 캐시에 없으면 네트워크로 요청을 보냅니다.
        return fetch(event.request).then(
          (response) => {
            // 응답이 유효하지 않으면 그대로 반환합니다.
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 유효한 응답이면 복제해서 캐시에 저장하고, 원본은 브라우저에 보냅니다.
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// 3. 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});