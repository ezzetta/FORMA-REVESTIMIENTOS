(() => {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;

  const panel = document.getElementById('offlinePanel');
  const status = document.getElementById('offlineStatus');
  const button = document.getElementById('prepareOffline');
  panel.hidden = false;
  let downloaded = false;
  let busy = false;

  function updateStatus() {
    if (busy) return;
    button.disabled = !navigator.onLine;
    button.textContent = downloaded ? 'Actualizar descarga' : 'Descargar para usar sin conexión';
    if (downloaded) {
      status.textContent = navigator.onLine ? 'Listo para usar sin conexión en este navegador.' : 'Sin conexión. Estás usando la descarga de este navegador.';
    } else {
      status.textContent = navigator.onLine ? 'Descargá el cotizador y sus fotos para usarlos sin conexión.' : 'Conectate para preparar el uso sin conexión.';
    }
  }

  function request(worker,message) {
    return new Promise((resolve,reject) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => {
        channel.port1.close();
        reject(new Error('La descarga no respondió a tiempo. Volvé a intentar con conexión.'));
      },120_000);
      channel.port1.onmessage = ({data}) => {
        clearTimeout(timeout);
        channel.port1.close();
        if (data.error) reject(new Error(data.error));
        else resolve(data);
      };
      worker.postMessage(message,[channel.port2]);
    });
  }

  button.addEventListener('click',async () => {
    busy = true;
    button.disabled = true;
    status.textContent = 'Descargando el cotizador, el catálogo y sus fotos…';
    try {
      const products = window.FORMA_PRODUCTS;
      if (!Array.isArray(products) || !products.length) throw new Error('El catálogo de fotos no está disponible. Recargá la página e intentá de nuevo.');
      const photos = products.flatMap(product => (product.gallery || []).map(photo => photo.src));
      await navigator.serviceWorker.register('./service-worker.js');
      const registration = await navigator.serviceWorker.ready;
      const result = await request(registration.active,{type:'download',photos});
      downloaded = result.ready;
      busy = false;
      updateStatus();
    } catch (error) {
      busy = false;
      updateStatus();
      status.textContent = error.message || 'No se pudo completar la descarga. Intentá de nuevo.';
    }
  });

  addEventListener('online',updateStatus);
  addEventListener('offline',updateStatus);
  navigator.serviceWorker.getRegistration().then(async registration => {
    if (!registration?.active) return;
    const result = await request(registration.active,{type:'status'});
    downloaded = result.ready;
    updateStatus();
  }).catch(() => {});
  updateStatus();
})();
