
// Familias comerciales: la aplicación se conserva como dato técnico.
function formaFamily(p){
 const n=String(p.name+' '+p.product_type).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/antigolpe/.test(n))return 'Alfombras antigolpes';
 if(p.category==='Terminaciones y accesorios')return 'Terminaciones y adhesivos';
 if(p.category==='Vidrios')return 'Vidrios y esmerilados';
 if(p.category==='Pisos')return 'Pisos';
 if(p.category==='Cielorrasos')return 'Cielorrasos PVC';
 if(/placa.*uv|placa.*marmol/.test(n))return 'Placas para paredes';
 if(/piedra|soft stone/.test(n))return 'Piedra y texturas';
 if(/wpc|wall panel/.test(n))return 'Paneles WPC';
 if(/papel espumado|rollo/.test(n))return 'Rollos';
 if(/vinilo/.test(n))return 'Vinilos';
 return 'Placas para paredes';
}

function formaFinish(p){
 if(/wpc|wall panel/i.test(p.name+' '+p.product_type))return 'Maderas';
 if(p.finish)return p.finish;
 const n=String(p.name+' '+p.product_type).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(p.category==='Vidrios')return 'Vidrios';
 if(/marmol|calacatta|marquina|portoro|palissandro|placas pvc uv/.test(n))return 'Mármoles';
 if(/madera|nogal|cedro|fresno|roble|teka|pino/.test(n)||(/listones/.test(n)&&p.category==='Pisos'))return 'Maderas';
 if(/piedra|travertino|tavertino/.test(n))return 'Piedras';
 if(/cemento/.test(n))return 'Cementos';
 return 'Otros acabados';
}
function formaFinishLabel(f){return ({'Mármoles':'Símil mármol','Maderas':'Símil madera','Piedras':'Símil piedra'})[f]||f}
const formaFinishes=['Mármoles','Maderas','Vidrios','Piedras','Cementos','Otros acabados'];

const formaFamilies=['Placas para paredes','Paneles WPC','Pisos','Rollos','Vinilos','Piedra y texturas','Vidrios y esmerilados','Cielorrasos PVC','Terminaciones y adhesivos','Alfombras antigolpes'];
if(Array.isArray(window.FORMA_PRODUCTS))window.FORMA_PRODUCTS.forEach(p=>{p.family=formaFamily(p);p.finish=formaFinish(p)});
const formaHeader=document.querySelector('.site-header');
if(formaHeader){
 formaHeader.id=formaHeader.id||'inicio';
 const prefix=location.pathname.includes('/productos/')||location.pathname.includes('/categorias/')?'../':'';
 const bar=document.createElement('nav');bar.id='catalogMenu';bar.className='catalog-family-nav catalog-menu';bar.setAttribute('aria-label','Categorías de productos');
 bar.innerHTML=FORMA_CATEGORY_GROUPS.map(group=>group.items.length?'<details data-category-group="'+group.id+'"><summary>'+group.label+'<span aria-hidden="true">⌄</span></summary><div class="catalog-dropdown"><a data-catalog-category="'+group.id+'" href="'+formaCatalogHref(group.id,prefix)+'">'+group.all+'</a>'+group.items.map(([id,label])=>'<a data-catalog-category="'+id+'" href="'+formaCatalogHref(id,prefix)+'">'+label+'</a>').join('')+'</div></details>':'<a class="catalog-direct" data-category-group="'+group.id+'" data-catalog-category="'+group.id+'" href="'+formaCatalogHref(group.id,prefix)+'">'+group.label+'</a>').join('');
 const toggle=document.createElement('button');toggle.type='button';toggle.className='catalog-menu-toggle';toggle.setAttribute('aria-controls','catalogMenu');toggle.setAttribute('aria-expanded','false');toggle.innerHTML='Categorías de productos <span aria-hidden="true">⌄</span>';
 const close=()=>{bar.querySelectorAll('details').forEach(d=>d.open=false);bar.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');};
 toggle.addEventListener('click',()=>{const open=bar.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));});
 formaHeader.after(toggle,bar);
 bar.addEventListener('click',e=>{const a=e.target.closest('[data-catalog-category]');if(!a)return;if(window.setCatalogCategory){e.preventDefault();window.setCatalogCategory(a.dataset.catalogCategory);}close();});
 document.addEventListener('click',e=>{if(!bar.contains(e.target)&&!toggle.contains(e.target))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
}
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

document.querySelectorAll('.catalog-menu details').forEach(item => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.catalog-menu details[open]').forEach(other => {
      if (other !== item) other.open = false;
    });
  });
});


const homeProductGrid=document.querySelector('#homeProducts');
const applicationGrid=document.querySelector('#applicationCards');
const finishGrid=document.querySelector('#finishCards');
const htmlEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(Array.isArray(window.FORMA_PRODUCTS)){
  const products=window.FORMA_PRODUCTS;
  if(homeProductGrid){
    const chosen=[];const types=new Set();
    for(const p of products){const key=p.product_type;if(!types.has(key)){chosen.push(p);types.add(key)}if(chosen.length===6)break}
    for(const p of products){if(chosen.length===6)break;if(!chosen.some(v=>v.id===p.id))chosen.push(p)}
    homeProductGrid.innerHTML=chosen.map(p=>'<article class="home-product-card"><a href="productos/'+encodeURIComponent(p.id)+'.html"><img src="'+htmlEscape(p.image)+'" alt="'+htmlEscape(p.name)+'" loading="lazy"></a><div class="home-product-info"><small>'+htmlEscape(p.product_type||p.category)+'</small><h3><a href="productos/'+encodeURIComponent(p.id)+'.html">'+htmlEscape(p.name)+'</a></h3><p class="product-stock">'+htmlEscape(p.stock_status||'Consultar disponibilidad')+'</p><a href="productos/'+encodeURIComponent(p.id)+'.html"><span>Ver producto →</span></a></div></article>').join('');
    if(!products.length)homeProductGrid.innerHTML='<p>Estamos completando las fichas. Consultanos por los materiales para tu proyecto.</p>';
  }
  if(finishGrid){finishGrid.innerHTML=['Mármoles','Maderas','Piedras'].map(finish=>{const items=products.filter(p=>p.finish===finish);if(!items.length)return '';return '<a class="finish-card" href="tienda.html?acabado='+encodeURIComponent(finish)+'#productos"><span>'+htmlEscape(formaFinishLabel(finish))+'</span><small>'+items.length+' productos · Explorar ↗</small></a>'}).join('');}
  if(applicationGrid){
    const applications=FORMA_CATEGORY_GROUPS.filter(group=>group.id!=='acabados');
    applicationGrid.innerHTML=applications.map(group=>{const items=products.filter(p=>formaCategoryMatches(p,group.id));if(!items.length)return '';return '<a class="application-card" href="'+formaCatalogHref(group.id)+'"><img src="'+htmlEscape(items[0].image)+'" alt="'+htmlEscape(group.label)+'" loading="lazy"><div><strong>'+htmlEscape(group.label)+'</strong><span>'+items.length+' productos · Explorar ↗</span></div></a>'}).join('');
  }
}

document.querySelectorAll('a[href$="tienda.html"]').forEach(a=>a.setAttribute('href',a.getAttribute('href')+'#productos'));
