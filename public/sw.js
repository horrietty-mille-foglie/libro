// Libro の Service Worker
// キャッシュは一切行わない。PWA として成立させるための最小構成。
// fetch ハンドラを置かないことで、通信はすべてブラウザ任せになる。

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
