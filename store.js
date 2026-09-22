const products = (window.FORMA_PRODUCTS || []).filter(product => product.published !== false);
const WHATSAPP = '5492804874717';
const PAGE_SIZE = 24;
const urlFilters = new URLSearchParams(window.location.search);
const storedSelection = JSON.parse(localStorage.getItem('forma-selection') || '[]');
const selection = storedSelection.map(item => typeof item === 'string' ? {id:item, qty:1} : {id:item.id, qty:Math.max(1, Number(item.qty) || 1)}).filter(item => item.id);
const state = {category:urlFilters.get('category') || 'Todos',use:urlFilters.get('use') || '',space:urlFilters.get('space') || '',query:'',sort:'featured',limit:PAGE_SIZE,selection};

const $ = selector => document.querySelector(selector);
const grid = $('#productGrid');
const categoryFilters = $('#categoryFilters');
const modal = $('#productModal');
const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const productHref = product => `productos/${encodeURIComponent(product.id)}.html`;
const interiorCategories = new Set(['Cielorrasos','Vinilos','Alfombras','Rollos gran formato','Paneles WPC','Papeles autoadhesivos','Pisos','Jardines verticales','Placas símil piedra','Placas decorativas','Accesorios']);

function productUses(product) {
  if (Array.isArray(product.uses) && product.uses.length) return {interior:product.uses.includes('interior'),exterior:product.uses.includes('exterior')};
  const name = normalize(product.name);
  return {
    exterior:product.category === 'Jardines verticales' || product.category === 'Placas símil piedra' || (product.category === 'Paneles WPC' && !name.includes('interior')) || name.includes('exterior') || name.includes('int y ext') || name.includes('proteccion uv'),
    interior:interiorCategories.has(product.category) && !name.includes('solo exterior')
  };
}

function productSpaces(product) {
  if (Array.isArray(product.spaces) && product.spaces.length) return new Set(product.spaces);
  const spaces = new Set(['local']);
  if (['Pisos','Paneles WPC','Placas decorativas','Papeles autoadhesivos','Vinilos'].includes(product.category)) spaces.add('living');
  if (['Pisos','Placas decorativas','Vinilos','Rollos gran formato','Paneles WPC'].includes(product.category)) spaces.add('cocina');
  if (['Cielorrasos','Pisos','Placas decorativas','Rollos gran formato'].includes(product.category)) spaces.add('baño');
  if (productUses(product).exterior) spaces.add('exterior');
  if (['Paneles WPC','Placas símil piedra','Jardines verticales'].includes(product.category)) spaces.add('fachada');
  return spaces;
}

const categoryCounts = products.reduce((result, product) => { result[product.category] = (result[product.category] || 0) + 1; return result; }, {});
const categories = ['Todos', ...Object.keys(categoryCounts).sort((a,b) => a.localeCompare(b,'es'))];
if (!categories.includes(state.category)) state.category = 'Todos';

function syncUrl() {
  const params = new URLSearchParams();
  if (state.category !== 'Todos') params.set('category', state.category);
  if (state.use) params.set('use', state.use);
  if (state.space) params.set('space', state.space);
  history.replaceState(null,'',`${location.pathname}${params.size ? `?${params}` : ''}`);
}

function renderContext() {
  const labels = {interior:'Interior',exterior:'Exterior',living:'Living y dormitorio',cocina:'Cocina y comedor','baño':'Baño',fachada:'Fachada',local:'Locales y oficinas'};
  const context = state.space ? labels[state.space] : state.use ? labels[state.use] : state.category !== 'Todos' ? state.category : '';
  $('#shopTitle').textContent = context ? `Opciones para ${context.toLowerCase()}.` : 'Elegí por material.';
  document.querySelectorAll('.visual-filters button').forEach(button => {
    const active = (button.dataset.quick === 'all' && !state.use && !state.space && state.category === 'Todos') || button.dataset.use === state.use || button.dataset.space === state.space;
    button.classList.toggle('active', active);
  });
}

function renderCategories() {
  categoryFilters.innerHTML = categories.map(category => `<button type="button" class="${state.category === category ? 'active' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(category)}<span>${category === 'Todos' ? products.length : categoryCounts[category]}</span></button>`).join('');
  $('#mobileCategory').innerHTML = categories.map(category => `<option value="${escapeHtml(category)}" ${state.category === category ? 'selected' : ''}>${escapeHtml(category)} (${category === 'Todos' ? products.length : categoryCounts[category]})</option>`).join('');
}

function filteredProducts() {
  const items = products.filter(product => {
    const searchable = normalize(`${product.name} ${product.category} ${product.meta} ${product.description}`);
    return (state.category === 'Todos' || product.category === state.category) && (!state.use || productUses(product)[state.use]) && (!state.space || productSpaces(product).has(state.space)) && searchable.includes(state.query);
  });
  if (state.sort === 'featured') items.sort((a,b) => Number(b.featured) - Number(a.featured) || (a.sort_order || 999) - (b.sort_order || 999) || a.name.localeCompare(b.name,'es'));
  if (state.sort === 'az') items.sort((a,b) => a.name.localeCompare(b.name,'es'));
  return items;
}

function priceMarkup(product) {
  if (product.offer?.enabled) return `<small>${escapeHtml(product.offer.label || 'OFERTA')}</small><del>${escapeHtml(product.offer.old_price || product.price)}</del> ${escapeHtml(product.offer.new_price || product.price)}`;
  return `<small>Precio y disponibilidad</small>${escapeHtml(product.price)}`;
}

function renderProducts() {
  const items = filteredProducts();
  const visible = items.slice(0,state.limit);
  $('#resultCount').textContent = items.length;
  $('#emptyState').hidden = items.length > 0;
  grid.innerHTML = visible.map(product => {
    const selected = state.selection.some(item => item.id === product.id);
    const badge = product.image_status !== 'verified' ? '<span class="product-badge">FOTO A CONFIRMAR</span>' : product.offer?.enabled ? `<span class="product-badge offer-badge">${escapeHtml(product.offer.label || 'OFERTA')}</span>` : '';
    return `<article class="product-card" data-id="${escapeHtml(product.id)}"><a class="product-image" href="${productHref(product)}" aria-label="Ver ${escapeHtml(product.name)}"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">${badge}</a><div class="product-info"><p class="product-category">${escapeHtml(product.category)}</p><h3><a href="${productHref(product)}">${escapeHtml(product.name)}</a></h3><p class="product-meta">${escapeHtml(product.meta)}</p><div class="product-bottom"><div class="product-price">${priceMarkup(product)}</div><div class="product-card-actions"><button class="product-add" type="button" data-add="${escapeHtml(product.id)}" ${selected ? 'disabled' : ''}>${selected ? 'Agregado ✓' : 'Agregar al pedido'}</button><button class="product-open" type="button" data-open="${escapeHtml(product.id)}">Vista rápida</button></div></div></div></article>`;
  }).join('');
  const more = $('#loadMore'); more.hidden = visible.length >= items.length; more.textContent = `Mostrar más (${items.length - visible.length})`;
}

function resetAndRender() { state.limit = PAGE_SIZE; renderContext(); syncUrl(); renderProducts(); }

function openProduct(id) {
  const product = products.find(item => item.id === id); if (!product) return;
  modal.dataset.id = product.id; $('#modalImage').src = product.image; $('#modalImage').alt = product.name; $('#modalCategory').textContent = product.category; $('#modalTitle').textContent = product.name; $('#modalDescription').textContent = product.description; $('#modalImage').classList.toggle('is-placeholder', product.image_status !== 'verified');
  $('#modalSpecs').innerHTML = Object.entries(product.specs || {}).map(([key,value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
  $('#modalPrice').innerHTML = priceMarkup(product); $('#modalAction').textContent = 'Agregar a mi pedido'; $('#modalProductPage').href = productHref(product); modal.hidden = false; document.body.style.overflow = 'hidden';
}

function closeProduct() { modal.hidden = true; if (!$('#orderDrawer').classList.contains('open')) document.body.style.overflow = ''; }
function saveSelection() { localStorage.setItem('forma-selection',JSON.stringify(state.selection)); }
function addSelection(id,qty=1,open=true) { const entry = state.selection.find(item => item.id === id); if (entry) entry.qty += qty; else state.selection.push({id,qty}); saveSelection(); renderSelection(); renderProducts(); closeProduct(); if (open) openDrawer(); }

function selectionMessage(items) {
  const list = items.map((item,index) => `${index + 1}. ${item.product.name} — Cantidad: ${item.qty}`).join('\n');
  return `Hola FORMA, quiero consultar por este pedido en Puerto Madryn:\n\n${list}\n\n¿Me confirman precio, disponibilidad y entrega?`;
}

function renderSelection() {
  const items = state.selection.map(entry => ({...entry,product:products.find(product => product.id === entry.id)})).filter(item => item.product);
  $('#orderCount').textContent = items.reduce((sum,item) => sum + item.qty,0); $('#drawerEmpty').hidden = items.length > 0;
  $('#drawerItems').innerHTML = items.map(item => `<div class="drawer-item"><img src="${escapeHtml(item.product.image)}" alt=""><div><h3>${escapeHtml(item.product.name)}</h3><p>${escapeHtml(item.product.price)}</p><div class="qty-control"><button type="button" data-qty="minus" data-id="${escapeHtml(item.id)}" aria-label="Restar">−</button><span>${item.qty}</span><button type="button" data-qty="plus" data-id="${escapeHtml(item.id)}" aria-label="Sumar">+</button></div></div><button type="button" data-remove="${escapeHtml(item.id)}" aria-label="Quitar ${escapeHtml(item.product.name)}">×</button></div>`).join('');
  const message = items.length ? selectionMessage(items) : 'Hola FORMA, quiero consultar por revestimientos en Puerto Madryn.'; $('#drawerWhatsapp').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`; $('#drawerWhatsapp').classList.toggle('disabled',!items.length);
}

function openDrawer() { $('#orderDrawer').classList.add('open'); $('#orderDrawer').setAttribute('aria-hidden','false'); $('#drawerOverlay').hidden = false; document.body.style.overflow = 'hidden'; }
function closeDrawer() { $('#orderDrawer').classList.remove('open'); $('#orderDrawer').setAttribute('aria-hidden','true'); $('#drawerOverlay').hidden = true; if (modal.hidden) document.body.style.overflow = ''; }

categoryFilters.addEventListener('click',event => { const button = event.target.closest('[data-category]'); if (!button) return; state.category = button.dataset.category; renderCategories(); resetAndRender(); });
document.querySelector('.visual-filters')?.addEventListener('click',event => { const button = event.target.closest('button'); if (!button) return; state.category = 'Todos'; state.use = button.dataset.use || ''; state.space = button.dataset.space || ''; renderCategories(); resetAndRender(); document.querySelector('#catalogo')?.scrollIntoView({behavior:'smooth',block:'start'}); });
function applySearch(value) { state.query = normalize(value.trim()); $('#productSearch').value = value; if ($('#productSearchTop')) $('#productSearchTop').value = value; resetAndRender(); }
$('#productSearch').addEventListener('input',event => applySearch(event.target.value)); $('#productSearchTop')?.addEventListener('input',event => applySearch(event.target.value));
$('#sortProducts').addEventListener('change',event => { state.sort = event.target.value; resetAndRender(); }); $('#mobileCategory').addEventListener('change',event => { state.category = event.target.value; renderCategories(); resetAndRender(); });
$('#clearFilters').addEventListener('click',() => { state.category = 'Todos'; state.query = ''; state.use = ''; state.space = ''; $('#productSearch').value = ''; if ($('#productSearchTop')) $('#productSearchTop').value = ''; renderCategories(); resetAndRender(); });
$('#loadMore').addEventListener('click',() => { state.limit += PAGE_SIZE; renderProducts(); });
grid.addEventListener('click',event => { const add = event.target.closest('[data-add]'); if (add) { addSelection(add.dataset.add,1,false); return; } const open = event.target.closest('[data-open]'); if (open) openProduct(open.dataset.open); });
modal.addEventListener('click',event => { if (event.target.closest('[data-close]')) closeProduct(); }); $('#modalAction').addEventListener('click',() => addSelection(modal.dataset.id));
$('.store-order-button').addEventListener('click',openDrawer); $('#closeDrawer').addEventListener('click',closeDrawer); $('#drawerOverlay').addEventListener('click',closeDrawer);
$('#drawerItems').addEventListener('click',event => { const remove = event.target.closest('[data-remove]'); if (remove) state.selection = state.selection.filter(item => item.id !== remove.dataset.remove); const qty = event.target.closest('[data-qty]'); if (qty) { const entry = state.selection.find(item => item.id === qty.dataset.id); if (entry) entry.qty = Math.max(1,entry.qty + (qty.dataset.qty === 'plus' ? 1 : -1)); } saveSelection(); renderSelection(); renderProducts(); });
document.addEventListener('keydown',event => { if (event.key === 'Escape') { closeProduct(); closeDrawer(); } });
renderCategories(); renderContext(); renderProducts(); renderSelection();
