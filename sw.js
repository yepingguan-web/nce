/**
 * NCE-Flow-Plus Service Worker
 * 实现离线缓存和更新策略
 */

const CACHE_NAME = 'nce-flow-plus-v1.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/lesson.html',
  '/assets/style.css',
  '/assets/app.js',
  '/assets/recorder.js',
  '/assets/scorer.js',
  '/manifest.json',
  '/images/icon-192.png',
  '/images/icon-512.png'
];

// 安装事件：缓存静态资源
self.addEventListener('install', (event) => {
  console.log('📦 SW: 安装中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 SW: 缓存静态资源');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('✅ SW: 安装完成');
        return self.skipWaiting();
      })
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('🚀 SW: 激活中...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🧹 SW: 删除旧缓存', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ SW: 激活完成');
        return self.clients.claim();
      })
  );
});

// 拦截请求：缓存优先策略
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 如果缓存中有，直接返回
        if (cachedResponse) {
          console.log('💾 SW: 从缓存返回', event.request.url);
          return cachedResponse;
        }

        // 否则从网络请求
        return fetch(event.request)
          .then((networkResponse) => {
            // 克隆响应（因为响应只能使用一次）
            const responseToCache = networkResponse.clone();

            // 缓存新资源
            caches.open(CACHE_NAME)
              .then((cache) => {
                // 只缓存成功的响应
                if (networkResponse.status === 200) {
                  cache.put(event.request, responseToCache);
                  console.log('📥 SW: 缓存新资源', event.request.url);
                }
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('❌ SW: 网络请求失败', error);
            
            // 可以返回一个离线页面
            // return caches.match('/offline.html');
          });
      })
  );
});

// 监听消息：强制更新
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🎯 SW: Service Worker 已加载');
