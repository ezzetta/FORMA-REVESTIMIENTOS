const cacheName = 'forma-cotizador-offline-v1';
const base = self.registration.scope;
const url = path => new URL(path,base).href;
const page = url('index.html');
const core = ['index.html','cotizador.css','engine.js','xlsx.js','quote-archive.js','cotizador.js','offline.js','roble-ceniza-compas.webp','../../data/catalog-data.js','../../assets/forma-logo.svg','../../assets/icon.svg'].map(url);
const imagePath = /^\/assets\/products\/public\/[\w.-]+\.(webp|png|jpe?g)$/i;
const siteRoot = new URL('../../',base);

function imageUrl(src) {
  if (typeof src !== 'string' || !imagePath.test('/'+src.replace(/^\//,''))) return null;
  return new URL(src.replace(/^\//,''),siteRoot).href;
}

self.addEventListener('install',event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event => event.waitUntil(self.clients.claim()));

self.addEventListener('message',event => {
  const port = event.ports[0];
  if (!port || !event.source?.url?.startsWith(base)) return;
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(cacheName);
      if (event.data?.type === 'download') {
        const photos = Array.isArray(event.data.photos) ? event.data.photos.map(imageUrl).filter(Boolean) : [];
        if (photos.length > 2_000) throw new Error('El catálogo supera el tamaño de descarga admitido.');
        const urls = [...new Set([...core,...photos])];
        await cache.addAll(urls.map(address => new Request(address,{cache:'reload'})));
      }
      const available = await Promise.all(core.map(address => cache.match(address)));
      port.postMessage({ready:available.every(Boolean)});
    } catch {
      port.postMessage({error:'No se pudo guardar el cotizador completo. Revisá la conexión y el espacio disponible, y volvé a intentar.'});
    }
  })());
});

self.addEventListener('fetch',event => {
  const {request} = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const address = new URL(request.url);
  address.search = '';
  const isPage = request.mode === 'navigate' && (address.href === base || address.href === page);
  const isPhoto = address.href.startsWith(new URL('assets/products/public/',siteRoot).href);
  if (!isPage && !core.includes(address.href) && !isPhoto) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) return response;
      return await caches.match(isPage ? page : address.href,{cacheName}) || response;
    } catch {
      return await caches.match(isPage ? page : address.href,{cacheName}) || Response.error();
    }
  })());
});
