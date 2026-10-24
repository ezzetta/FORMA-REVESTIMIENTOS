const products=(window.FORMA_PRODUCTS||[]).filter(p=>p.published!==false);
const PAGE_SIZE=12;
const $=s=>document.querySelector(s);
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const productHref=p=>'productos/'+encodeURIComponent(p.id)+'.html';
const url=new URLSearchParams(location.search);
const state={category:formaResolveCategory(url.get('category')),use:url.get('use')||'',type:url.get('type')||'',finish:url.get('acabado')||'',adhesive:url.get('autoadhesivo')||'',query:normalize(url.get('q')||''),sort:'featured',page:Math.max(1,Number(url.get('pagina'))||1)};
const grid=$('#productGrid'),modal=$('#productModal');let returnFocus=null;
if(!products.some(p=>p.pricing?.final_amount!=null))document.querySelectorAll('#sortProducts option[value^="price-"],#sortProducts option[value="m2-asc"]').forEach(o=>o.remove());
function priceMarkup(p){const v=p.pricing||{};if(!v.show_price||v.final_amount==null)return '';return escapeHtml(p.price)+(p.price_per_m2_text?'<span class="price-m2">'+escapeHtml(p.price_per_m2_text)+'</span>':'');}
function syncUrl(){const q=new URLSearchParams();if(state.category!=='todos')q.set('category',state.category);if(state.query)q.set('q',state.query);if(state.finish)q.set('acabado',state.finish);if(state.adhesive)q.set('autoadhesivo',state.adhesive);for(const k of ['use','type'])if(state[k])q.set(k,state[k]);if(state.page>1)q.set('pagina',state.page);history.replaceState(null,'',location.pathname+(q.size?'?'+q:'')+'#productos');}
function jumpToProducts(){window.closeCatalogFilters?.();$('#shopTitle').focus({preventScroll:true});const y=$('#productos').getBoundingClientRect().top+window.scrollY-16;window.scrollTo({top:Math.max(0,y),behavior:'instant'});}
function renderFilters(){
 const button=(id,label)=>'<button type="button" data-category="'+id+'" class="'+(state.category===id?'active':'')+'" '+(state.category===id?'aria-current="true"':'')+'>'+label+'<span>'+products.filter(p=>formaCategoryMatches(p,id)).length+'</span></button>';
 $('#categoryFilters').innerHTML=button('todos','Todos los productos')+FORMA_CATEGORY_GROUPS.map(group=>!group.items.length?button(group.id,group.categoryLabel||group.label):'<details class="filter-category-group" '+(group.id===state.category||group.items.some(([id])=>id===state.category)?'open':'')+'><summary>'+group.label+'</summary><div>'+button(group.id,group.all)+group.items.map(([id,label])=>button(id,label)).join('')+'</div></details>').join('');
 $('#mobileCategory').innerHTML='<option value="todos">Todos los productos</option>'+FORMA_CATEGORY_GROUPS.map(group=>'<optgroup label="'+group.label+'"><option value="'+group.id+'">'+group.all+'</option>'+group.items.map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('')+'</optgroup>').join('');$('#mobileCategory').value=state.category;
 const context=products.filter(p=>formaCategoryMatches(p,state.category));
 $('#typeFilter').innerHTML='<option value="">Todos los tipos</option>'+[...new Set(context.map(p=>p.product_type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es')).map(t=>'<option value="'+escapeHtml(t)+'">'+escapeHtml(t)+'</option>').join('');$('#typeFilter').value=state.type;
 $('#finishFilter').innerHTML='<option value="">Todos los acabados</option>'+formaFinishes.filter(f=>context.some(p=>p.finish===f)).map(f=>'<option value="'+escapeHtml(f)+'">'+escapeHtml(formaFinishLabel(f))+'</option>').join('');$('#finishFilter').value=state.finish;
 $('#useFilter').value=state.use;$('#adhesiveFilter').value=state.adhesive;
 document.querySelectorAll('[data-category-group]').forEach(el=>{const group=FORMA_CATEGORY_GROUPS.find(g=>g.id===el.dataset.categoryGroup);el.classList.toggle('active',group.id===state.category||group.items.some(([id])=>id===state.category));});
}
function filteredProducts(){
 const result=products.filter(p=>{const text=normalize([p.name,p.product_type,p.meta,p.description,p.finish,...(p.options||[]).map(o=>o.label)].join(' '));return formaCategoryMatches(p,state.category)&&(!state.finish||p.finish===state.finish)&&(!state.adhesive||p.self_adhesive===(state.adhesive==='si'))&&(!state.use||(p.uses||[]).includes(state.use))&&(!state.type||p.product_type===state.type)&&state.query.split(/\s+/).every(word=>text.includes(word));});
 if(state.sort==='az')result.sort((a,b)=>a.name.localeCompare(b.name,'es'));
 if(state.sort==='featured')result.sort((a,b)=>Number(b.featured)-Number(a.featured)||(a.sort_order??9999)-(b.sort_order??9999)||a.name.localeCompare(b.name,'es'));
 if(state.sort==='price-asc')result.sort((a,b)=>(a.pricing?.final_amount??Infinity)-(b.pricing?.final_amount??Infinity));
 if(state.sort==='price-desc')result.sort((a,b)=>(b.pricing?.final_amount??-Infinity)-(a.pricing?.final_amount??-Infinity));
 // Keep availability groups first while retaining the selected order inside each group.
 const stockRank=p=>p.stock_state==='out_of_stock'?2:p.stock_state==='in_stock'?0:1;
 result.sort((a,b)=>stockRank(a)-stockRank(b));return result;
}
function renderProducts(){
 const result=filteredProducts(),pages=Math.max(1,Math.ceil(result.length/PAGE_SIZE));state.page=Math.min(state.page,pages);
 const visible=result.slice((state.page-1)*PAGE_SIZE,state.page*PAGE_SIZE);
 $('#resultCount').textContent=result.length;$('#filterResultCount').textContent=result.length;$('#emptyState').hidden=!!result.length;
 $('#shopTitle').textContent=state.category==='todos'?(formaFinishLabel(state.finish)||'Todos los productos'):formaCategoryLabel(state.category);
 grid.innerHTML=visible.map(p=>{const grouped=!!p.options?.length;const badge=p.stock_state==='out_of_stock'?'<span class="product-badge stock-badge">Sin stock temporal</span>':'';return '<article class="product-card"><a class="product-image" href="'+productHref(p)+'" aria-label="Ver '+escapeHtml(p.name)+'"><img src="'+escapeHtml(p.image)+'" alt="'+escapeHtml(p.name)+'" loading="lazy">'+badge+'</a><div class="product-info"><p class="product-category">'+escapeHtml(p.product_type||p.category)+'</p><h3><a href="'+productHref(p)+'">'+escapeHtml(p.name)+'</a></h3><p class="product-meta">'+escapeHtml(p.meta)+'</p><div class="product-bottom"><div class="product-price">'+priceMarkup(p)+'</div><div class="product-card-actions">'+(grouped?'<a class="product-add option-link" href="'+productHref(p)+'">Elegir terminación</a>':'<button class="product-add" type="button" data-add="'+escapeHtml(p.id)+'">Agregar a consulta</button>')+'<button class="product-open" type="button" data-open="'+escapeHtml(p.id)+'">Vista rápida</button></div></div></div></article>';}).join('');
 $('#catalogPagination').hidden=pages<=1;$('#pageInfo').textContent='Página '+state.page+' de '+pages;$('#previousPage').disabled=state.page===1;$('#nextPage').disabled=state.page===pages;
}
function refresh(jump=false){state.page=1;renderFilters();renderProducts();syncUrl();if(jump)jumpToProducts();}
window.setCatalogCategory=id=>{Object.assign(state,{category:formaResolveCategory(id),type:'',finish:'',use:'',adhesive:'',query:''});$('#productSearch').value='';$('#productSearchTop').value='';refresh(true);};
window.closeCatalogFilters=()=>{document.body.classList.remove('catalog-filters-open');$('#filterOverlay').hidden=true;$('#toggleFilters').setAttribute('aria-expanded','false');};
$('#toggleFilters').addEventListener('click',()=>{document.body.classList.add('catalog-filters-open');$('#filterOverlay').hidden=false;$('#toggleFilters').setAttribute('aria-expanded','true');$('#closeFilters').focus();});
$('#closeFilters').addEventListener('click',()=>{window.closeCatalogFilters();$('#toggleFilters').focus();});$('#filterOverlay').addEventListener('click',window.closeCatalogFilters);$('#applyFilters').addEventListener('click',jumpToProducts);
function openProduct(id){const p=products.find(v=>v.id===id);if(!p)return;window.closeCatalogFilters();returnFocus=document.activeElement;modal.dataset.id=id;$('#modalImage').src=p.image;$('#modalImage').alt=p.name;$('#modalCategory').textContent=p.product_type||p.category;$('#modalTitle').textContent=p.name;$('#modalDescription').textContent=p.description;$('#modalSpecs').innerHTML=Object.entries(p.specs||{}).map(([k,v])=>'<div><dt>'+escapeHtml(k)+'</dt><dd>'+escapeHtml(v)+'</dd></div>').join('');$('#modalPrice').innerHTML=priceMarkup(p);$('#modalAction').textContent=p.options?.length?'Elegir terminación':'Agregar a mi consulta';$('#modalProductPage').href=productHref(p);modal.hidden=false;document.body.classList.add('product-modal-open');$('.modal-close').focus();}
function closeProduct(){if(modal.hidden)return;modal.hidden=true;document.body.classList.remove('product-modal-open');returnFocus?.focus({preventScroll:true});}
$('#categoryFilters').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b)window.setCatalogCategory(b.dataset.category);});
$('#mobileCategory').addEventListener('change',e=>window.setCatalogCategory(e.target.value));
for(const [selector,key] of [['#typeFilter','type'],['#finishFilter','finish'],['#useFilter','use'],['#adhesiveFilter','adhesive']])$(selector).addEventListener('change',e=>{state[key]=e.target.value;refresh();});
for(const selector of ['#productSearch','#productSearchTop']){$(selector).value=state.query;$(selector).addEventListener('input',e=>{state.query=normalize(e.target.value.trim());$('#productSearch').value=e.target.value;$('#productSearchTop').value=e.target.value;state.page=1;renderProducts();syncUrl();});$(selector).addEventListener('keydown',e=>{if(e.key==='Enter'){e.target.blur();jumpToProducts();}});}
$('#sortProducts').addEventListener('change',e=>{state.sort=e.target.value;state.page=1;renderProducts();syncUrl();});
$('#clearFilters').addEventListener('click',()=>window.setCatalogCategory('todos'));
for(const [selector,delta] of [['#previousPage',-1],['#nextPage',1]])$(selector).addEventListener('click',()=>{state.page+=delta;renderProducts();syncUrl();jumpToProducts();});
grid.addEventListener('click',e=>{const open=e.target.closest('[data-open]');if(open)openProduct(open.dataset.open);});
modal.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeProduct();});$('#modalAction').addEventListener('click',()=>{const p=products.find(p=>p.id===modal.dataset.id);if(p?.options?.length){location.href=productHref(p);return;}window.FormaConsultation.add(p.id);closeProduct();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeProduct();window.closeCatalogFilters();}});
window.addEventListener('pageshow',()=>{modal.hidden=true;document.body.classList.remove('product-modal-open');window.closeCatalogFilters();});
renderFilters();renderProducts();
if(location.hash==='#productos'||location.hash==='#catalogo'||url.size){jumpToProducts();}
