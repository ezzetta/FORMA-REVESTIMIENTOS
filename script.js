const button = document.querySelector('.menu-button');
const nav = document.querySelector('.main-nav');

button?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  button.setAttribute('aria-expanded', String(open));
});

nav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    button?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('details').forEach(item => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('details[open]').forEach(other => {
      if (other !== item) other.open = false;
    });
  });
});

const homeProductGrid = document.querySelector('#homeProducts');
if (homeProductGrid && Array.isArray(window.FORMA_PRODUCTS)) {
  const escapeHtml = value => String(value).replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const verified = window.FORMA_PRODUCTS.filter(product => product.image_status === 'verified');
  const preferredCategories = ['Paneles WPC', 'Pisos', 'Placas decorativas', 'Vinilos', 'Papeles autoadhesivos', 'Placas símil piedra', 'Rollos gran formato', 'Complementos'];
  const selected = preferredCategories.map(category => verified.find(product => product.category === category)).filter(Boolean).slice(0, 8);
  homeProductGrid.innerHTML = selected.map(product => `
    <article class="home-product-card">
      <a href="productos/${encodeURIComponent(product.id)}.html"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy"></a>
      <div class="home-product-info"><small>${escapeHtml(product.category)}</small><h3><a href="productos/${encodeURIComponent(product.id)}.html">${escapeHtml(product.name)}</a></h3><a href="productos/${encodeURIComponent(product.id)}.html"><span>Ver producto →</span></a></div>
    </article>`).join('');
}
