
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
const formaFinishes=['Mármoles','Maderas','Vidrios','Piedras','Cementos','Otros acabados'];

const formaFamilies=['Placas para paredes','Paneles WPC','Pisos','Rollos','Vinilos','Piedra y texturas','Vidrios y esmerilados','Cielorrasos PVC','Terminaciones y adhesivos','Alfombras antigolpes'];
if(Array.isArray(window.FORMA_PRODUCTS))window.FORMA_PRODUCTS.forEach(p=>{p.family=formaFamily(p);p.finish=formaFinish(p)});
const formaHeader=document.querySelector('.site-header');
if(formaHeader){const prefix=location.pathname.includes('/productos/')||location.pathname.includes('/categorias/')?'../':'';const families=Array.isArray(window.FORMA_PRODUCTS)?formaFamilies.filter(f=>window.FORMA_PRODUCTS.some(p=>p.family===f)):formaFamilies.filter(f=>f!=='Cielorrasos PVC');const bar=document.createElement('nav');bar.className='catalog-family-nav';bar.setAttribute('aria-label','Categorías de productos');bar.innerHTML='<a href="'+prefix+'tienda.html">Todos los productos</a><a href="'+prefix+'tienda.html?acabado=M%C3%A1rmoles">Símil mármol</a><a href="'+prefix+'tienda.html?acabado=Maderas">Símil madera</a>'+families.map(f=>'<a href="'+prefix+'tienda.html?category='+encodeURIComponent(f)+'">'+f+'</a>').join('');formaHeader.after(bar);}
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
  if(finishGrid){finishGrid.innerHTML=['Mármoles','Maderas','Vidrios'].map(finish=>{const items=products.filter(p=>p.finish===finish);if(!items.length)return '';return '<a class="finish-card" href="tienda.html?acabado='+encodeURIComponent(finish)+'"><span>'+htmlEscape(finish)+'</span><small>'+items.length+' productos · Explorar ↗</small></a>'}).join('');}
  if(applicationGrid){
    const applications=formaFamilies;
    applicationGrid.innerHTML=applications.map(category=>{const items=products.filter(p=>p.family===category);if(!items.length)return '';return '<a class="application-card" href="tienda.html?category='+encodeURIComponent(category)+'"><img src="'+htmlEscape(items[0].image)+'" alt="'+htmlEscape(category)+'" loading="lazy"><div><strong>'+htmlEscape(category)+'</strong><span>'+items.length+' productos · Explorar ↗</span></div></a>'}).join('');
  }
}
