(() => {
  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'});
  const number = new Intl.NumberFormat('es-AR',{maximumFractionDigits:4});
  const date = new Intl.DateTimeFormat('es-AR',{dateStyle:'medium',timeZone:'America/Argentina/Buenos_Aires'});
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  const displayMoney = value => value === null ? 'Sin precio' : money.format(value);
  const decimal = id => $(id).value === '' ? NaN : Number($(id).value);
  const key = 'forma.cotizador.v1';
  const fields = ['client','company','clientPhone','clientEmail','quoteNumber','validity','conditions','itemOrder'];
  const options = ['showUnit','showArea','showPack','showCompute','showPhotos'];
  const photos = (window.FORMA_PRODUCTS || []).flatMap(product => (product.gallery || []).map(photo => ({...photo,name:product.name,catalogId:product.id})))
    .filter(photo => /^\/?assets\/products\/public\/[\w.-]+\.(webp|png|jpe?g)$/i.test(photo.src))
    .map(photo => ({...photo,url:'../../'+photo.src.replace(/^\//,'')}));
  let state = {catalog:[], source:'', items:[], fields:{}, options:{}};
  try { state = {...state,...JSON.parse(localStorage.getItem(key) || '{}')}; } catch { /* Local storage can be unavailable. */ }
  for (const id of fields) $(id).value = state.fields[id] || '';
  $('itemOrder').value = state.fields.itemOrder === 'surface' ? 'surface' : 'entry';
  for (const id of options) $(id).checked = state.options[id] ?? true;
  let pending = null;

  function save() {
    state.fields = Object.fromEntries(fields.map(id => [id,$(id).value]));
    state.options = Object.fromEntries(options.map(id => [id,$(id).checked]));
    try { localStorage.setItem(key,JSON.stringify(state)); $('storageStatus').textContent = 'Borrador guardado en este navegador.'; }
    catch { $('storageStatus').textContent = 'El navegador no pudo conservar el borrador al cerrar.'; }
  }

  function populateCatalog() {
    $('catalogStatus').textContent = state.catalog.length ? `${state.catalog.length} productos · ${state.source}` : 'Cargá el Excel que contiene la hoja «Lista rápida».';
    $('surface').innerHTML = '<option value="">Todas</option>'+[...new Set(state.catalog.map(p => p.surface))].sort().map(s => `<option>${escape(s)}</option>`).join('');
    $('productFields').disabled = !state.catalog.length;
    filterProducts();
  }

  $('upload').addEventListener('change',async event => {
    const file = event.target.files[0];
    if (!file) return;
    const input = event.target;
    input.disabled = true;
    pending = null;
    $('review').hidden = false;
    $('applyList').hidden = true;
    $('reviewDetails').hidden = true;
    $('reviewStatus').textContent = 'Leyendo y revisando el Excel…';
    try {
      const incoming = await VitaWorkbook.readCatalog(file);
      if (!incoming.length) throw new Error('La hoja Lista rápida no contiene productos.');
      const ids = new Set(incoming.map(p => p.id));
      if (ids.size !== incoming.length) throw new Error('Hay productos duplicados con el mismo nombre, colores y proveedor. Revisá la lista.');
      const previous = new Map(state.catalog.map(p => [p.id,p]));
      const updated = incoming.filter(p => {
        const old = previous.get(p.id);
        return old && ['pieceNet','pieceGross','saleNet','saleGross','areaNet','areaGross','count','sale','coverageUnit','yieldPerPiece'].some(field => old[field] !== p[field]);
      });
      const added = incoming.filter(p => !previous.has(p.id));
      const removed = state.catalog.filter(p => !ids.has(p.id));
      const flagged = incoming.filter(p => p.issues.length);
      const notices = [
        ...flagged.map(p => `${p.name} · ${p.issues.join(' ')}`),
        ...updated.map(p => `Cambio de precio o presentación · ${p.name} · ${displayMoney(previous.get(p.id).saleGross)} → ${displayMoney(p.saleGross)} por presentación`),
        ...removed.map(p => `Ya no está en la lista · ${p.name}`),
        ...(state.catalog.length ? added.map(p => `Nuevo · ${p.name}`) : []),
      ];
      $('reviewStatus').textContent = `${incoming.length} productos. ${flagged.length} con observaciones.` + (state.catalog.length ? ` ${updated.length} modificados, ${added.length} nuevos y ${removed.length} retirados.` : '');
      $('reviewList').innerHTML = notices.map(n => `<li>${escape(n)}</li>`).join('');
      $('reviewDetails').hidden = !notices.length;
      $('applyList').hidden = false;
      pending = {catalog:incoming,source:file.name};
    } catch (error) { $('reviewStatus').textContent = error.message || 'No se pudo abrir el Excel.'; }
    finally { input.value = ''; input.disabled = false; }
  });

  $('applyList').addEventListener('click',() => {
    if (!pending) return;
    Object.assign(state,pending);
    pending = null;
    $('review').hidden = true;
    $('search').value = '';
    populateCatalog();
    save();
  });

  function selected() { return state.catalog.find(p => p.id === $('product').value); }

  function filterProducts() {
    const current = $('product').value;
    const term = normalize($('search').value.trim());
    const surface = $('surface').value;
    const found = state.catalog.filter(p => (!surface || p.surface === surface) && normalize(`${p.name} ${p.colors}`).includes(term));
    $('product').innerHTML = `<option value="">${found.length ? 'Elegí un producto' : 'Sin productos para mostrar'}</option>` + found.map(p => `<option value="${escape(p.id)}">${escape(p.name)}${p.colors ? ' — '+escape(p.colors) : ''}</option>`).join('');
    if (found.some(p => p.id === current)) $('product').value = current;
    showProduct();
  }

  function showProduct() {
    const product = selected();
    $('photo').value = '';
    $('productNote').hidden = !product?.issues.length;
    $('productNote').textContent = product?.issues.join(' ') || '';
    $('color').innerHTML = '<option value="">A definir</option>' + (product ? String(product.colors).split(/\s*·\s*/).filter(Boolean).map(c => `<option>${escape(c)}</option>`).join('') : '');
    $('prices').innerHTML = product ? [
      [product.sale === 'Rollo' ? 'Por rollo' : 'Por pieza',product.pieceNet,product.sale === 'Caja' || product.sale === 'Pack' ? 'Referencia por pieza' : 'Precio de venta'],
      [`Por ${product.coverageUnit || 'm² / ml'}`,product.areaNet,'Referencia de la lista'],
      [`Por ${product.sale.toLowerCase()}`,product.saleNet,product.yieldPerPiece ? `${number.format(product.count * product.yieldPerPiece)} ${product.coverageUnit} por ${product.sale.toLowerCase()}` : `${product.count} elemento${product.count === 1 ? '' : 's'}`],
    ].map(([label,net,detail]) => `<div class="price"><small>${escape(label)}</small><strong>${displayMoney(net)}${net !== null ? ' + IVA' : ''}</strong><small>${escape(detail)}</small></div>`).join('') : '';
    $('mode').options[1].textContent = product ? `Por ${product.sale.toLowerCase()}` : 'Presentación de venta';
    previewPhoto();
    updateCalculation();
  }

  function formatCount(product, result) {
    const suffix = {Caja:'cajas',Pack:'packs',Rollo:'rollos',Unidad:'unidades'};
    return `${number.format(result.count)} ${result.count === 1 ? product.sale.toLowerCase() : suffix[product.sale]}`;
  }

  function scopeText(product,result) {
    const bill = formatCount(product,result);
    if (!result.targetUnit) return `${bill}${product.count > 1 ? ` (${number.format(product.count * result.count)} piezas)` : ''}`;
    return `${number.format(result.requested)} ${result.targetUnit} solicitados${result.waste ? ` · ${number.format(result.needed)} ${result.targetUnit} con merma` : ''} · ${bill} · ${number.format(result.coverage)} ${result.targetUnit} entregados`;
  }

  function requestedText(product,result) {
    if (result.targetUnit) return `${number.format(result.requested)} ${result.targetUnit}`;
    if (result.mode === 'piece') return `${number.format(result.requested)} ${result.requested === 1 ? 'pieza' : 'piezas'}`;
    return formatCount(product,{count:result.requested});
  }

  function updateCalculation() {
    const mode = $('mode').value, product = selected();
    $('dimensions').hidden = !['room','linear'].includes(mode);
    $('widthLabel').hidden = mode === 'linear';
    $('quantityLabel').hidden = !$('dimensions').hidden;
    $('wasteLabel').hidden = !['area','room','linear'].includes(mode);
    $('addItem').disabled = true;
    $('calculation').hidden = !product;
    $('calculation').classList.remove('error');
    if (!product) return null;
    try {
      const result = VitaEngine.calculate(product,{mode,quantity:decimal('quantity'),length:decimal('length'),width:decimal('width'),waste:$('wasteLabel').hidden ? 0 : decimal('waste'),discount:decimal('discount')});
      $('calculation').innerHTML = `<strong>${money.format(result.net)} sin IVA</strong><p>${escape(scopeText(product,result))}</p>${result.discount ? `<small>${number.format(result.discount)}% de descuento</small>` : ''}`;
      $('addItem').disabled = false;
      return result;
    } catch (error) {
      $('calculation').classList.add('error');
      $('calculation').textContent = error.message;
      return null;
    }
  }

  function filterPhotos() {
    const term = normalize($('photoSearch').value.trim());
    const current = $('photo').value;
    const matches = photos.map((photo,index) => ({photo,index})).filter(({photo}) => !term || normalize(`${photo.name} ${photo.alt}`).includes(term));
    $('photo').innerHTML = '<option value="">Sugerir desde el catálogo</option>' + matches.map(({photo,index}) => `<option value="${index}">${escape(photo.name)} · ${escape(photo.kind || 'Foto')}</option>`).join('');
    if (matches.some(p => String(p.index) === current)) $('photo').value = current;
    previewPhoto();
  }

  function family(name) {
    const title = normalize(name);
    if (/perfil|terminacion|escalera|reductor/.test(title)) return;
    if (/esmerilado/.test(title)) return 'esmerilado';
    if (/machimbre pvc/.test(title)) return 'machimbre pvc';
    if (/placa.*piedra pu/.test(title)) return 'piedra pu';
    if (/placas? autoadhesivas?/.test(title)) return title.match(/\b(?:30|60)\s*x\s*60/)?.[0].replace(/\s/g,'');
    if (/piso.*listones|piso autoadhesivo simil madera/.test(title)) return 'piso autoadhesivo simil madera';
    if (/piso (?:sistema clic spc|spc (?:gris claro|beige) \/ caja)/.test(title)) return 'piso spc base';
    if (/piso spc/.test(title)) return 'piso spc premium';
    if (/rollo decorativo|rollo autoadhesivo simil marmol/.test(title)) return 'rollo simil marmol';
    return title.match(/\b(?:wpc interior|wpc exterior|cielorraso|placa uv|vinilo|alfombra|zocalo ps|papel espumado)\b/)?.[0];
  }

  function suggestPhoto(product,color) {
    if (!product || !color) return null;
    // The price list groups these variants under one row. The storefront has
    // a separate, verified ficha for each supplier SKU (HY-C001-1, HY-C002-2).
    if (normalize(product.name).startsWith('revestimiento flexible autoadhesivo')) {
      const id = {
        'blanco rugoso':'rollo-piedra-flexible-autoadhesiva-blanco-rugoso-0-60-x3-mts-9b5112',
        'gris tavertino':'rollo-piedra-flexible-autoadhesiva-tiza-simil-cemento-0-60-x3-mts-54be40',
        'gris travertino':'rollo-piedra-flexible-autoadhesiva-tiza-simil-cemento-0-60-x3-mts-54be40',
      }[normalize(color).trim()];
      if (id) {
        const gallery = photos.filter(photo => photo.catalogId === id && photo.association === 'exact');
        const photo = gallery.find(photo => /detalle/i.test(photo.kind)) || gallery[0];
        if (photo) return {...photo,suggested:true};
      }
    }
    const type = family(product.name);
    if (!type) return null;
    const colorWords = value => normalize(value).replace(/\bsimil\b/g,'').replace(/\bnegra\b/g,'negro').replace(/\bblanca\b/g,'blanco').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
    const shade = colorWords(color);
    if (!shade) return null;
    const measurement = value => value.match(/\b(\d[.,]\d{2})\s*m\s*$/i)?.[1].replace(',','.');
    const length = type === 'cielorraso' ? measurement(product.name) : null;
    const candidates = photos.filter(p => family(p.name) === type && (!length || measurement(p.name) === length) && ` ${colorWords(p.name)} `.includes(` ${shade} `));
    const exact = candidates.find(p => colorWords(p.name).endsWith(` ${shade}`) && /detalle/i.test(p.kind));
    const photo = exact || candidates.find(p => /detalle/i.test(p.kind)) || candidates[0];
    return photo ? {...photo, suggested:true} : null;
  }

  function previewPhoto() {
    const photo = $('photo').value === '' ? suggestPhoto(selected(),$('color').value) : photos[Number($('photo').value)];
    $('photoPreview').innerHTML = photo ? `<img class="photo-thumb" src="${escape(photo.url)}" alt="${escape(photo.alt || photo.name)}"><p class="subtle">${photo.suggested ? 'Referencia sugerida · ' : ''}${escape(photo.name)}</p>` : '<p class="subtle">Sin foto asignada. Podés elegir una del catálogo.</p>';
    return photo;
  }

  $('compute').addEventListener('submit',event => {
    event.preventDefault();
    const result = updateCalculation(), product = selected();
    if (!result || !product) return;
    state.items.push({product:{...product},result,room:$('room').value.trim(),color:$('color').value,photo:previewPhoto(),photoChosen:true});
    save();
    showQuote();
  });

  function totalsMarkup() {
    const totals = ['net','gross','tax','discountValue'].reduce((out,field) => ({...out,[field]:VitaEngine.round(state.items.reduce((sum,item) => sum+item.result[field],0))}),{});
    return `${totals.discountValue ? `<span>Descuentos sin IVA</span><span>${money.format(totals.discountValue)}</span>` : ''}<span>Subtotal sin IVA</span><span>${money.format(totals.net)}</span><span>IVA</span><span>${money.format(totals.tax)}</span><strong>Total final</strong><strong>${money.format(totals.gross)}</strong>`;
  }

  function orderedItems() {
    const items = state.items.map((item,originalIndex) => ({item,originalIndex}));
    if ($('itemOrder').value !== 'surface') return items;

    const ranks = new Map([['piso',0],['pared',1],['cielorraso',2]]);
    const rank = ({item}) => ranks.get(normalize(String(item.product.surface ?? '')).trim()) ?? ranks.size;
    return items.sort((a,b) => rank(a) - rank(b) || a.originalIndex - b.originalIndex);
  }

  function showQuote() {
    $('items').innerHTML = state.items.length ? orderedItems().map(({item,originalIndex},position) => {
      const {product,result,room,color,photo} = item;
      return `<article class="item"><h3>${escape(product.name)}</h3><button type="button" data-remove="${originalIndex}" aria-label="Quitar ítem ${position+1}">Quitar</button><p><small>${escape([room,color].filter(Boolean).join(' · '))}</small><br>${escape(scopeText(product,result))}</p><strong>${money.format(result.net)} sin IVA</strong><details class="item-photo"><summary>${photo ? 'Cambiar foto del anexo' : 'Asignar foto al anexo'}</summary><div data-photo-editor="${originalIndex}"></div></details></article>`;
    }).join('') : '<p class="subtle">Agregá un producto para empezar el presupuesto.</p>';
    $('totals').innerHTML = state.items.length ? totalsMarkup() : '';
    $('printTop').disabled = $('printButton').disabled = !state.items.length;
    $('clearQuote').hidden = !state.items.length;
  }

  function photoMarkup(item,index) {
    const {photo,product,color} = item;
    const valid = photo && (/^\.\.\/\.\.\/assets\/products\/public\/[\w.-]+\.(webp|png|jpe?g)$/i.test(photo.url) || /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo.url));
    return `<figure>${valid ? `<img src="${escape(photo.url)}" alt="${escape(photo.alt || photo.name)}">` : '<div class="photo-empty">Foto pendiente</div>'}<figcaption><strong>${index+1}. ${escape(product.name)}</strong>${color ? ' · '+escape(color) : ''}${valid ? `<br>${photo.suggested ? 'Referencia del catálogo · ' : ''}${escape(photo.alt || photo.name)}` : ''}</figcaption></figure>`;
  }

  async function localPhoto(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 8_000_000) {
      throw new Error('Elegí una imagen JPG, PNG o WebP de hasta 8 MB.');
    }
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1,Math.round(bitmap.width*scale));
      canvas.height = Math.max(1,Math.round(bitmap.height*scale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0,0,canvas.width,canvas.height);
      context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      return {url:canvas.toDataURL('image/jpeg',.8),alt:'Imagen adjunta de referencia',name:'Imagen adjunta'};
    } finally { bitmap.close(); }
  }

  function showPreview() {
    if (!state.items.length) return;
    const items = orderedItems().map(({item}) => item);
    const details = (item,index) => {
      const {product:p,result:r,room,color} = item;
      const references = [];
      const ref = (label,net) => [label,`${money.format(net)} + IVA`];
      if (room) references.push(['Ambiente',room]);
      if (color) references.push(['Color/trama',color]);
      if ($('showUnit').checked && p.pieceNet !== null) references.push(ref(p.sale === 'Rollo' ? 'Precio por rollo' : 'Precio por pieza',p.pieceNet));
      if ($('showPack').checked && ['Caja','Pack'].includes(p.sale)) references.push(ref(`Precio por presentación (${p.count} unidades${p.yieldPerPiece ? `, ${number.format(p.count*p.yieldPerPiece)} ${p.coverageUnit}` : ''})`,p.saleNet));
      if ($('showArea').checked && p.areaNet !== null) references.push(ref(`Precio de referencia por ${p.coverageUnit || 'm² / ml'}`,p.areaNet));
      if ($('showCompute').checked) {
        references.push(['Solicitado por el cliente',requestedText(p,r)]);
        if (r.waste) references.push(['Con merma',`${number.format(r.needed)} ${r.targetUnit} (${number.format(r.waste)}%)`]);
        if (r.targetUnit) references.push(['Cobertura entregada',`${number.format(r.coverage)} ${r.targetUnit}`]);
      }
      if (r.discount) references.push(['Descuento aplicado',`${number.format(r.discount)}%`]);
      return `<tr><td><strong>${index+1}. ${escape(p.name)}</strong><div class="quote-references">${references.map(([label,value])=>`<small><b>${escape(label)}:</b> ${escape(value)}</small>`).join('')}</div></td><td>${escape(formatCount(p,r))}</td><td>${money.format(r.net)}</td></tr>`;
    };
    const gallery = $('showPhotos').checked ? items.map(photoMarkup).join('') : '';
    const contact = [$('clientPhone').value,$('clientEmail').value].filter(Boolean).map(escape).join(' · ');
    const client = $('client').value || $('company').value || 'Cliente';
    const missing = state.items.filter(item => !item.photo).length;
    $('previewStatus').textContent = gallery ? (missing ? `${missing} ${missing === 1 ? 'ítem sin foto. Asignala' : 'ítems sin foto. Asignalas'} desde el presupuesto.` : 'El anexo incluye las fotos de todos los ítems.') : '';
    const quoteId = `Presupuesto${$('quoteNumber').value ? ' n.º '+escape($('quoteNumber').value) : ''}`;
    const rows = items.map(details);
    const terms = $('conditions').value ? `<p class="terms">${escape($('conditions').value)}</p>` : '';
    const annex = gallery ? `<section class="photo-page">
      <div class="annex-heading"><h2>Anexo de imágenes</h2><p>${quoteId} · ${escape(client)}</p></div>
      <div class="photo-grid">${gallery}</div>
    </section>` : '';
    $('document').innerHTML = `<article class="print-doc">
      <header><div class="letterhead"><img src="../../assets/forma-logo.svg" alt="FORMA Revestimientos"><p>Puerto Madryn · Chubut<br>+54 9 280 487-4717<br>www.formarevestimientos.com.ar</p></div>
      <div class="client-heading"><h1>${escape(client)}</h1>${$('client').value && $('company').value ? `<p class="client-company">${escape($('company').value)}</p>` : ''}${contact ? `<p>${contact}</p>` : ''}<p class="quote-meta">${quoteId} · ${escape(date.format(new Date()))}${$('validity').value ? ' · Vigencia: '+escape($('validity').value) : ''}</p></div></header>
      <table><thead><tr><th>Producto</th><th>Se factura</th><th>Importe sin IVA</th></tr></thead>
        <tbody>${rows.slice(0,-1).join('')}</tbody>
        <tbody class="quote-tail">${rows.at(-1)}
          <tr class="quote-summary"><td colspan="3"><div class="totals">${totalsMarkup()}</div>${terms}</td></tr>
        </tbody>
      </table>${annex}
    </article>`;
    $('preview').showModal();
  }

  $('surface').addEventListener('change',filterProducts);
  $('search').addEventListener('input',filterProducts);
  $('product').addEventListener('change',showProduct);
  $('compute').addEventListener('input',updateCalculation);
  $('color').addEventListener('change',previewPhoto);
  $('photoSearch').addEventListener('input',filterPhotos);
  $('photo').addEventListener('change',previewPhoto);
  $('items').addEventListener('click',event => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    state.items.splice(Number(button.dataset.remove),1);
    save(); showQuote();
  });
  $('items').addEventListener('toggle',event => {
    if (!event.target.matches('.item-photo[open]')) return;
    const editor = event.target.querySelector('[data-photo-editor]');
    if (editor.childElementCount) return;
    const item = state.items[Number(editor.dataset.photoEditor)];
    const current = photos.findIndex(photo => photo.url === item.photo?.url);
    const order = photos.map((photo,index) => ({photo,index}));
    const type = family(item.product.name);
    if (type) order.sort((a,b) => Number(family(b.photo.name) === type) - Number(family(a.photo.name) === type));
    editor.innerHTML = `<label>Foto del catálogo<select><option value="">Sin foto del catálogo</option>${order.map(({photo,index}) => `<option value="${index}"${index === current ? ' selected' : ''}>${escape(photo.name)} · ${escape(photo.kind || 'Foto')}</option>`).join('')}</select></label><label>Adjuntar imagen desde la computadora<input type="file" accept="image/jpeg,image/png,image/webp"></label><button type="button" class="plain remove-photo">Quitar foto</button><p class="subtle photo-status" role="status"></p><div class="item-photo-preview"></div>`;
    const select = editor.querySelector('select');
    const input = editor.querySelector('input');
    const status = editor.querySelector('.photo-status');
    const remove = editor.querySelector('.remove-photo');
    const paint = () => {
      editor.querySelector('.item-photo-preview').innerHTML = item.photo ? `<img class="photo-thumb" src="${escape(item.photo.url)}" alt="${escape(item.photo.alt || item.photo.name)}">` : '';
      remove.hidden = !item.photo;
    };
    const assign = photo => {
      item.photo = photo;
      item.photoChosen = true;
      item.photoSuppressed = !photo;
      event.target.querySelector('summary').textContent = item.photo ? 'Cambiar foto del anexo' : 'Asignar foto al anexo';
      paint(); save();
    };
    select.addEventListener('change',e => {
      status.textContent = '';
      assign(e.target.value === '' ? null : photos[Number(e.target.value)]);
    });
    remove.addEventListener('click',() => { select.value = ''; status.textContent = ''; assign(null); });
    input.addEventListener('change',async () => {
      const file = input.files[0];
      if (!file) return;
      input.disabled = select.disabled = remove.disabled = true;
      status.textContent = '';
      try {
        const photo = await localPhoto(file);
        if (!editor.isConnected) return;
        select.value = '';
        assign(photo);
        status.textContent = 'Imagen agregada al anexo.';
      } catch (error) { status.textContent = error.message || 'No se pudo leer la imagen.'; }
      finally { input.value = ''; input.disabled = select.disabled = remove.disabled = false; }
    });
    paint();
  },true);
  $('clearQuote').addEventListener('click',() => { if (window.confirm('¿Vaciar los productos del presupuesto?')) { state.items = []; save(); showQuote(); } });
  $('printTop').addEventListener('click',showPreview);
  $('printButton').addEventListener('click',showPreview);
  $('closePreview').addEventListener('click',() => $('preview').close());
  $('savePdf').addEventListener('click',async () => {
    await Promise.allSettled([...$('document').querySelectorAll('img')].map(img => img.decode()));
    window.print();
  });
  for (const id of [...fields,...options]) {
    if (id !== 'itemOrder') $(id).addEventListener('input',save);
  }
  $('itemOrder').addEventListener('change',() => { save(); showQuote(); });
  for (const item of state.items) {
    if ((!item.photo || item.photo.suggested) && !item.photoSuppressed) item.photo = suggestPhoto(item.product,item.color);
  }
  populateCatalog(); filterPhotos(); showQuote();
})();
