document.querySelectorAll('[data-gallery-src]').forEach(button => {
  button.addEventListener('click', () => {
    const main = document.querySelector('#galleryMain');
    main.src = button.dataset.gallerySrc;
    main.alt = button.dataset.galleryAlt || '';
    document.querySelector('#galleryKind').textContent = button.dataset.galleryKind || 'Imagen';
    document.querySelectorAll('.gallery-thumb').forEach(item => item.classList.toggle('active', item === button));
  });
});

document.querySelectorAll('.js-add-product').forEach(button => {
  button.addEventListener('click', () => {
    const stored = JSON.parse(localStorage.getItem('forma-selection') || '[]').map(item => typeof item === 'string' ? {id:item,qty:1} : item);
    const qty = Math.max(1, Number(document.querySelector('.detail-qty')?.value) || 1);
    const existing = stored.find(item => item.id === button.dataset.id);
    if (existing) existing.qty = (Number(existing.qty) || 1) + qty;
    else stored.push({id:button.dataset.id,qty});
    localStorage.setItem('forma-selection',JSON.stringify(stored));
    button.textContent = 'Agregado al pedido ✓';
    const toast = document.createElement('div');
    toast.className = 'selection-toast';
    toast.textContent = `${button.dataset.name} se agregó a tu pedido.`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(),2800);
  });
});
