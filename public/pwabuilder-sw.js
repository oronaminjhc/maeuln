// 캐시 이름 정의
const CACHE_NAME = 'maeuln-cache-v1';
// 캐싱할 파일 목록 (기본 오프라인 페이지 등)
const FILES_TO_CACHE = [
  '/', // 루트 URL
  '/offline.html' // 오프라인일 때 보여줄 페이지
];

// 1. 서비스 워커 설치
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(FILES_TO_CACHE);
      })
  );
});

// 2. 서비스 워커 활성화 (오래된 캐시 정리)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// 3. 요청 가로채기 (네트워크 우선 전략)
self.addEventListener('fetch', (event) => {
  // GET 요청이 아니면 캐시하지 않음
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 네트워크 요청이 성공하면, 응답을 캐시에 저장하고 반환
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request.url, response.clone());
          return response;
        });
      })
      .catch(() => {
        // 네트워크 요청이 실패하면, 캐시에서 응답을 찾아 반환
        return caches.match(event.request)
          .then((response) => {
            // 캐시에도 없으면 기본 오프라인 페이지를 보여줌
            return response || caches.match('/offline.html');
          });
      })
  );
});