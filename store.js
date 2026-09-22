const products = window.FORMA_PRODUCTS || [];
const WHATSAPP = '5492804874717';
const PAGE_SIZE = 24;
const urlFilters = new URLSearchParams(window.location.search);
const state = {
  category: urlFilters.get('category') || 'Todos', use: urlFilters.get('use') || '', space: urlFilters.get('space') || '', modes: new Set(), query: '', sort: 'featured', limit: PAGE_SIZE,
  selection: JSON.parse(localStorage.getItem('forma-selection') || '[]')
};

const $ = selector => document.querySelector(selector);
const grid = $('#productGrid');
const categoryFilters = $('#categoryFilters');
const modal = $('#productModal');
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const productHref = product => `productos/${product.id}.html`;
const interiorCategories = new Set(['Cielorrasos','Vinilos','Alfombras','Rollos gran formato','Paneles WPC','Papeles autoadhesivos','Pisos','Jardines verticales','Placas símil piedra','Placas decorativas','Accesorios']);

function productUses(product) {
  const name = normalize(product.name);
  const exterior = product.category === 'Jardines verticales' || product.category === 'Placas símil piedra' || (product.category === 'Paneles WPC' && !name.includes('interior')) || name.includes('exterior') || name.includes('int y ext') || name.includes('proteccion uv');
  const interior = interiorCategories.has(product.category) && !name.includes('solo exterior');
  return { interior, exterior };
}

function productSpaces(product) {
  const spaces = new Set(['local']);
  if (['Pisos','Paneles WPC','Placas decorativas','Papeles autoadhesivos','Vinilos'].includes(product.category)) spaces.add('living');
  if (['Pisos','Placas decorativas','Vinilos','Rollos gran formato','Paneles WPC'].includes(product.category)) spaces.add('cocina');
  if (['Cielorrasos','Pisos','Placas decorativas','Rollos gran formato'].includes(product.category)) spaces.add('baño');
  if (productUses(product).exterior) spaces.add('exterior');
  if (['Paneles WPC','Placas símil piedra','Jardines verticales'].includes(product.category)) spaces.add('fachada');
  return spaces;
}

const categoryCounts = products.reduce((result, product) => {
  result[product.category] = (result[product.category] || 0) + 1;
  return result;
}, {});
const categories = ['Todos', ...Object.keys(categoryCounts).sort((a, b) => a.localeCompare(b, 'es'))];
if (!categories.includes(state.category)) state.category = 'Todos';

function syncUrl() {
  const params = new URLSearchParams();
  if (state.category !== 'Todos') params.set('category', state.category);
  if (state.use) params.set('use', state.use);
  if (state.space) params.set('space', state.space);
  const query = params.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}`);
}

function renderContext() {
  const labels = {interior:'Interior', exterior:'Exterior', living:'Living y dormitorio', cocina:'Cocina y comedor', 'baño':'Baño', fachada:'Fachada', local:'Locales y oficinas'};
  const context = state.space ? labels[state.space] : state.use ? labels[state.use] : state.category !== 'Todos' ? state.category : '';
  $('#shopTitle').textContent = context ? `Opciones para ${context.toLowerCase()}.` : 'Elegí por material.';
  document.querySelectorAll('.visual-filters button').forEach(button => {
    const active = (button.dataset.quick === 'all' && !state.use && !state.space && state.category === 'Todos') || button.dataset.use === state.use || button.dataset.space === state.space;
    button.classList.toggle('active', active);
  });
}

function renderCategories() {
  categoryFilters.innerHTML = categories.map(category => `
    <button type="button" class="${state.category === category ? 'active' : ''}" data-category="${category}">
      ${category}<span>${category === 'Todos' ? products.length : categoryCounts[category]}</span>
    </button>`).join('');
  $('#mobileCategory').innerHTML = categories.map(category => `<option value="${category}" ${state.category === category ? 'selected' : ''}>${category} (${category === 'Todos' ? products.length : categoryCounts[category]})</option>`).join('');
}

function filteredProducts() {
  let items = products.filter(product => {
    const searchable = normalize(`${product.name} ${product.category} ${product.meta} ${product.description}`);
    return (state.category === 'Todos' || product.category === state.category)
      && (!state.use || productUses(product)[state.use])
      && (!state.space || productSpaces(product).has(state.space))
      && (!state.modes.size || state.modes.has(product.mode))
      && searchable.includes(state.query);
  });
  if (state.sort === 'featured') items.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name, 'es'));
  if (state.sort === 'az') items.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (state.sort === 'type') items.sort((a, b) => a.mode.localeCompare(b.mode) || a.name.localeCompare(b.name, 'es'));
  return items;
}

function renderProducts() {
  const items = filteredProducts();
  const visible = items.slice(0, state.limit);
  $('#resultCount').textContent = items.length;
  $('#emptyState').hidden = items.length > 0;
  grid.innerHTML = visible.map(product => `
    <article class="product-card" data-id="${product.id}">
      <a class="product-image" href="${productHref(product)}" aria-label="Ver ${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="product-badge">${product.image_status === 'verified' ? (product.mode === 'directa' ? 'COMPRA DIRECTA' : 'COTIZAR') : 'FOTO A CONFIRMAR'}</span>
      </a>
      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3><a href="${productHref(product)}">${product.name}</a></h3>
        <p class="product-meta">${product.meta}</p>
        <div class="product-bottom">
          <div class="product-price"><small>${product.mode === 'directa' ? 'Precio y stock a confirmar' : 'Según cantidad y terminación'}</small>${product.price}</div>
          <button class="product-open" type="button" data-open="${product.id}">Vista rápida</button>
        </div>
      </div>
    </article>`).join('');
  const more = $('#loadMore');
  more.hidden = visible.length >= items.length;
  more.textContent = `Mostrar más (${items.length - visible.length})`;
}

function resetAndRender() { state.limit = PAGE_SIZE; renderContext(); syncUrl(); renderProducts(); }

function openProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  modal.dataset.id = product.id;
  $('#modalImage').src = product.image;
  $('#modalImage').alt = product.name;
  $('#modalCategory').textContent = product.category;
  $('#modalTitle').textContent = product.name;
  $('#modalDescription').textContent = product.description;
  $('#modalImage').classList.toggle('is-placeholder', product.image_status !== 'verified');
  $('#modalSpecs').innerHTML = Object.entries(product.specs).map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('');
  $('#modalPrice').innerHTML = `<small>Precio y disponibilidad a confirmar</small>${product.price}`;
  $('#modalAction').textContent = product.mode === 'directa' ? 'Agregar a mi selección' : 'Agregar para cotizar';
  $('#modalProductPage').href = productHref(product);
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeProduct() {
  modal.hidden = true;
  if (!$('#orderDrawer').classList.contains('open')) document.body.style.overflow = '';
}

function saveSelection() { localStorage.setItem('forma-selection', JSON.stringify(state.selection)); }
function addSelection(id) {
  if (!state.selection.includes(id)) state.selection.push(id);
  saveSelection(); renderSelection(); closeProduct(); openDrawer();
}

function selectionMessage(items) {
  const list = items.map((product, index) => `${index + 1}. ${product.name}`).join('\n');
  return `Hola FORMA, quiero consultar por estos productos:\n\n${list}\n\n¿Me confirman precio, disponibilidad y entrega?`;
}

function renderSelection() {
  const items = state.selection.map(id => products.find(product => product.id === id)).filter(Boolean);
  $('#orderCount').textContent = items.length;
  $('#drawerEmpty').hidden = items.length > 0;
  $('#drawerItems').innerHTML = items.map(product => `
    <div class="drawer-item"><img src="${product.image}" alt=""><div><h3>${product.name}</h3><p>${product.mode === 'directa' ? 'Compra directa' : 'Cotización'} · ${product.price}</p></div><button type="button" data-remove="${product.id}" aria-label="Quitar ${product.name}">×</button></div>`).join('');
  const message = items.length ? selectionMessage(items) : 'Hola FORMA, quiero consultar por revestimientos.';
  $('#drawerWhatsapp').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  $('#drawerWhatsapp').classList.toggle('disabled', !items.length);
}

function openDrawer() {
  $('#orderDrawer').classList.add('open'); $('#orderDrawer').setAttribute('aria-hidden', 'false');
  $('#drawerOverlay').hidden = false; document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  $('#orderDrawer').classList.remove('open'); $('#orderDrawer').setAttribute('aria-hidden', 'true');
  $('#drawerOverlay').hidden = true; if (modal.hidden) document.body.style.overflow = '';
}

categoryFilters.addEventListener('click', event => {
  const button = event.target.closest('[data-category]'); if (!button) return;
  state.category = button.dataset.category; renderCategories(); resetAndRender();
});
document.querySelector('.visual-filters')?.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  state.category = 'Todos'; state.use = button.dataset.use || ''; state.space = button.dataset.space || '';
  renderCategories(); resetAndRender(); document.querySelector('#catalogo')?.scrollIntoView({behavior:'smooth', block:'start'});
});
document.querySelectorAll('[name="mode"]').forEach(input => input.addEventListener('change', () => {
  state.modes = new Set([...document.querySelectorAll('[name="mode"]:checked')].map(item => item.value)); resetAndRender();
}));
function applySearch(value) {
  state.query = normalize(value.trim());
  $('#productSearch').value = value;
  if ($('#productSearchTop')) $('#productSearchTop').value = value;
  resetAndRender();
}
$('#productSearch').addEventListener('input', event => applySearch(event.target.value));
$('#productSearchTop')?.addEventListener('input', event => applySearch(event.target.value));
$('#sortProducts').addEventListener('change', event => { state.sort = event.target.value; resetAndRender(); });
$('#mobileCategory').addEventListener('change', event => { state.category = event.target.value; renderCategories(); resetAndRender(); });
$('#clearFilters').addEventListener('click', () => {
  state.category = 'Todos'; state.modes.clear(); state.query = ''; $('#productSearch').value = '';
  state.use = ''; state.space = ''; if ($('#productSearchTop')) $('#productSearchTop').value = '';
  document.querySelectorAll('[name="mode"]').forEach(item => item.checked = false); renderCategories(); resetAndRender();
});
$('#loadMore').addEventListener('click', () => { state.limit += PAGE_SIZE; renderProducts(); });
grid.addEventListener('click', event => { const button = event.target.closest('[data-open]'); if (button) openProduct(button.dataset.open); });
modal.addEventListener('click', event => { if (event.target.closest('[data-close]')) closeProduct(); });
$('#modalAction').addEventListener('click', () => addSelection(modal.dataset.id));
$('.store-order-button').addEventListener('click', openDrawer);
$('#closeDrawer').addEventListener('click', closeDrawer);
$('#drawerOverlay').addEventListener('click', closeDrawer);
$('#drawerItems').addEventListener('click', event => {
  const button = event.target.closest('[data-remove]'); if (!button) return;
  state.selection = state.selection.filter(id => id !== button.dataset.remove); saveSelection(); renderSelection();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeProduct(); closeDrawer(); } });

renderCategories(); renderContext(); renderProducts(); renderSelection();
