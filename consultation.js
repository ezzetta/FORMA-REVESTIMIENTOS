(()=>{
 const products=window.FORMA_PRODUCTS||[];
 const byId=new Map(products.map(p=>[p.id,p]));
 const base=new URL('.',document.currentScript.src);
 const shop=new URL('tienda.html#productos',base).href;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const key=v=>v.id+'::'+(v.option||'');
 let items=[];try{const saved=JSON.parse(localStorage.getItem('forma-selection')||'[]');if(Array.isArray(saved))items=saved.map(v=>typeof v==='string'?{id:v,qty:1}:v).filter(v=>byId.has(v.id)).map(v=>({...v,qty:Math.max(1,Number(v.qty)||1),option:v.option||''}));}catch{}
 document.querySelector('#orderDrawer')?.remove();document.querySelector('#drawerOverlay')?.remove();
 document.body.insertAdjacentHTML('beforeend',`<button class="consultation-overlay" id="drawerOverlay" hidden aria-label="Cerrar consulta" type="button"></button><aside class="consultation-drawer" id="orderDrawer" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="consultationTitle"><div class="consultation-head"><div><p>MI CONSULTA</p><h2 id="consultationTitle">Productos elegidos</h2></div><button type="button" id="closeDrawer" aria-label="Cerrar consulta">×</button></div><div id="drawerItems" class="consultation-items"></div><p class="consultation-empty" id="drawerEmpty">Todavía no agregaste productos. Podés sumar varios y consultar por todos juntos.</p><div class="consultation-foot"><p>Revisamos precio, disponibilidad y entrega antes de confirmar.</p><a id="drawerWhatsapp" class="button" target="_blank" rel="noopener" href="https://wa.me/5492804874717">Enviar consulta por WhatsApp</a><a class="consultation-continue" id="continueShopping" href="${shop}">Seguir eligiendo productos</a></div></aside><button type="button" class="consultation-float" data-open-consultation hidden>Mi consulta <b data-consultation-count>0</b></button><div class="consultation-toast" role="status" hidden></div>`);
 const drawer=document.querySelector('#orderDrawer'),overlay=document.querySelector('#drawerOverlay');
 const nav=document.querySelector('.main-nav');
 if(!document.querySelector('.store-order-button')&&nav){const button=document.createElement('button');button.className='nav-cta store-order-button';button.type='button';button.innerHTML='Mi consulta <b data-consultation-count>0</b>';nav.querySelector('.nav-cta')?.remove();nav.append(button);}
 for(const button of document.querySelectorAll('.store-order-button')){button.setAttribute('data-open-consultation','');button.setAttribute('aria-label','Abrir mi consulta');button.innerHTML='Mi consulta <b data-consultation-count>0</b>';}
 let returnFocus=null,toastTimer;
 function save(){localStorage.setItem('forma-selection',JSON.stringify(items));render();}
 function render(){
  document.querySelectorAll('[data-consultation-count]').forEach(el=>el.textContent=items.length);
  document.querySelector('.consultation-float').hidden=!items.length;
  document.body.classList.toggle('has-consultation',!!items.length);
  document.querySelector('#drawerEmpty').hidden=!!items.length;
  document.querySelector('#drawerItems').innerHTML=items.map(v=>{const p=byId.get(v.id);return `<article class="consultation-item"><img src="${new URL(p.image,base).href}" alt=""><div><h3>${esc(p.name)}</h3>${v.optionLabel?'<p>'+esc(v.optionLabel)+'</p>':''}<p>${esc(p.stock_status||'Consultar disponibilidad')}</p><div class="consultation-qty"><button type="button" data-consultation-qty="-1" data-key="${esc(key(v))}" aria-label="Restar cantidad de ${esc(p.name)}">−</button><span>${v.qty}</span><button type="button" data-consultation-qty="1" data-key="${esc(key(v))}" aria-label="Sumar cantidad de ${esc(p.name)}">+</button></div></div><button class="consultation-remove" type="button" data-consultation-remove="${esc(key(v))}" aria-label="Quitar ${esc(p.name)}">×</button></article>`}).join('');
  const lines=items.map((v,i)=>{const p=byId.get(v.id);return `${i+1}. ${p.name}${v.optionLabel?' — '+v.optionLabel:''} — ${v.qty} ${p.pricing?.unit||'unidad'}`;});
  const message='Hola FORMA, quiero consultar por estos productos:\n\n'+lines.join('\n')+'\n\n¿Me confirman precio, disponibilidad y entrega?';
  const link=document.querySelector('#drawerWhatsapp');link.href='https://wa.me/5492804874717?text='+encodeURIComponent(message);link.classList.toggle('disabled',!items.length);link.setAttribute('aria-disabled',String(!items.length));
 }
 function close(){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');overlay.hidden=true;document.body.classList.remove('consultation-open');returnFocus?.focus({preventScroll:true});}
 function open(){window.closeCatalogFilters?.();returnFocus=document.activeElement;drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');overlay.hidden=false;document.body.classList.add('consultation-open');document.querySelector('#closeDrawer').focus({preventScroll:true});}
 function add(id,qty=1,option='',optionLabel=''){
  if(!byId.has(id))return;
  const found=items.find(v=>key(v)===key({id,option}));if(found)found.qty+=qty;else items.push({id,qty,option,optionLabel});save();
  const toast=document.querySelector('.consultation-toast');toast.textContent='Agregado a tu consulta. Podés seguir eligiendo.';toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,2300);
 }
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-open-consultation]')){open();return;}
  const addButton=e.target.closest('[data-add],.js-add-product');
  if(addButton){const select=document.querySelector('#productOption');if(select&&!select.value){select.reportValidity();select.focus();return;}add(addButton.dataset.add||addButton.dataset.id,Math.max(1,Number(document.querySelector('.detail-qty')?.value)||1),select?.value||'',select?.value?select.selectedOptions[0].textContent:'');return;}
  const remove=e.target.closest('[data-consultation-remove]');if(remove){items=items.filter(v=>key(v)!==remove.dataset.consultationRemove);save();}
  const qty=e.target.closest('[data-consultation-qty]');if(qty){const v=items.find(v=>key(v)===qty.dataset.key);if(v){v.qty=Math.max(1,v.qty+Number(qty.dataset.consultationQty));save();}}
 });
 document.querySelector('#closeDrawer').addEventListener('click',close);overlay.addEventListener('click',close);
 document.querySelector('#continueShopping').addEventListener('click',e=>{if(location.pathname.endsWith('/tienda.html')){e.preventDefault();close();document.querySelector('#productos')?.scrollIntoView({block:'start'});}});
 document.querySelector('#drawerWhatsapp').addEventListener('click',e=>{if(!items.length)e.preventDefault();});
 document.addEventListener('keydown',e=>{if(!drawer.classList.contains('open'))return;if(e.key==='Escape'){close();return;}if(e.key==='Tab'){const focus=[...drawer.querySelectorAll('button,a[href]')].filter(el=>!el.disabled);const first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 window.addEventListener('storage',e=>{if(e.key==='forma-selection'){try{items=JSON.parse(e.newValue||'[]').filter(v=>byId.has(v.id));render();}catch{}}});
 window.addEventListener('pageshow',()=>{drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');overlay.hidden=true;document.body.classList.remove('consultation-open','catalog-filters-open');document.body.style.overflow='';});
 window.FormaConsultation={add,open,close};render();
})();
