/* Service worker: membuat Invoice Generator tetap bisa dibuka saat sinyal lemah atau offline.
   Ubah CACHE_VERSION setiap kali index.html diperbarui agar pengguna mendapat versi terbaru. */
const CACHE_VERSION = 'fluir-invoice-v5';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// Permintaan ke Google Apps Script (nomor invoice & data perusahaan) TIDAK boleh dicache.
// Nomor invoice harus selalu dari server agar tidak pernah kembar.
const NO_CACHE_HOSTS = ['script.google.com', 'script.googleusercontent.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Hanya tangani http/https. Permintaan dari ekstensi browser (chrome-extension://, dll.) dilewati.
  if (!url.protocol.startsWith('http')) return;

  if (NO_CACHE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith('.' + host))) {
    return; // biarkan browser mengambil langsung dari jaringan
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Simpan salinan, termasuk respons cross-origin seperti Tailwind CDN dan Google Fonts
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy).catch(() => {}));
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
