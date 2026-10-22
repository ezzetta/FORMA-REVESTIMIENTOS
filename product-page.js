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

const coverageCalculator = document.querySelector('.coverage-calculator');
if (coverageCalculator) {
  const surface = coverageCalculator.querySelector('.surface-input');
  const waste = coverageCalculator.querySelector('.waste-input');
  const output = coverageCalculator.querySelector('output');
  const coverage = Number(coverageCalculator.dataset.coverage);
  const unit = coverageCalculator.dataset.unit;
  const money = new Intl.NumberFormat('es-AR', {style:'currency',currency:'ARS'});
  const update = () => {
    const area = Number(surface.value);
    const margin = Number(waste.value);
    if (!surface.checkValidity() || !waste.checkValidity() || !surface.value || !waste.value || !Number.isFinite(area) || area <= 0) { output.textContent = 'Ingresá la superficie y un margen válido para calcular.'; return; }
    const required = area * (1 + margin / 100) / coverage;
    const count = unit === 'm²' || unit === 'metro lineal' ? Math.ceil(required * 100) / 100 : Math.ceil(Number(required.toFixed(8)));
    const price = coverageCalculator.dataset.price;
    output.textContent = 'Cantidad estimada: ' + count.toLocaleString('es-AR') + ' × ' + unit + ' (' + (count * coverage).toLocaleString('es-AR',{maximumFractionDigits:2}) + ' m²). ' + (price !== '' ? 'Material: ' + money.format(count * Number(price)) + '. No incluye colocación ni envío.' : 'Consultanos el precio para tu proyecto.');
  };
  surface.addEventListener('input', update); waste.addEventListener('input', update);
}
