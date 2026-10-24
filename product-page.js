document.querySelectorAll('[data-gallery-src]').forEach(button => {
  button.addEventListener('click', () => {
    const main = document.querySelector('#galleryMain');
    main.src = button.dataset.gallerySrc;
    const zoom=document.querySelector('#galleryZoom'); if(zoom)zoom.href=button.dataset.gallerySrc;
    main.alt = button.dataset.galleryAlt || '';
    document.querySelectorAll('.gallery-thumb').forEach(item => item.classList.toggle('active', item === button));
  });
});

const optionSelect=document.querySelector('#productOption');
const contact=document.querySelector('[data-product-whatsapp]');
optionSelect?.addEventListener('change',()=>{const selected=optionSelect.selectedOptions[0];const label=optionSelect.value?selected.textContent:'';if(contact)contact.href='https://wa.me/5492804874717?text='+encodeURIComponent('Hola FORMA, quiero consultar por '+contact.dataset.name+(label?' — '+label+' ['+optionSelect.value+']':'')+'.')});
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
