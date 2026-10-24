from pathlib import Path
from urllib.parse import quote
import html, json, re, unicodedata, hashlib
from pricing import apply as apply_pricing, markup as price_markup
from catalog_rules import CATEGORIES, publication_issues, all_gallery
from taxonomy import product_categories

SITE=Path(__file__).resolve().parents[1]
DOMAIN='https://www.formarevestimientos.com.ar'
WHATSAPP='5492804874717'
VERSION='20261024-navegacion-consulta'
CATALOG_VERSION=VERSION
def esc(v): return html.escape(str(v if v is not None else ''),quote=True)
def slug(v): return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',str(v)).encode('ascii','ignore').decode().lower()).strip('-')
def wa(message): return 'https://wa.me/'+WHATSAPP+'?text='+quote(message)
def local_src(src,prefix='../'): return prefix+str(src).lstrip('/')
def logo(): return '<span class="brand-mark" aria-hidden="true"><i class="panel panel-a"></i><i class="panel panel-b"></i><i class="panel panel-c"></i></span><span class="brand-type"><strong>FORMA</strong><small>REVESTIMIENTOS</small></span>'
def header(prefix='../'):
    return f'''<div class="announcement"><span>Puerto Madryn · Muestras a coordinar</span><span class="announcement-dot"></span><span>Consultas por WhatsApp</span></div><header class="site-header"><a class="brand" href="{prefix}index.html" aria-label="FORMA Revestimientos, inicio">{logo()}</a><button class="menu-button" type="button" aria-label="Abrir menú" aria-expanded="false"><span></span><span></span></button><nav class="main-nav" aria-label="Navegación principal"><a class="store-nav-main" href="{prefix}tienda.html">Productos</a><a href="{prefix}index.html#aplicaciones">Categorías</a><a href="{prefix}index.html#muestras">Muestras</a><a class="nav-cta" href="{wa('Hola FORMA, quiero asesoramiento para mi proyecto.')}" target="_blank" rel="noopener">Hablemos ↗</a></nav></header>'''
def footer(prefix='../'):
    return f'''<footer><div class="footer-brand"><strong>FORMA</strong><span>REVESTIMIENTOS</span><p>Materiales y asesoramiento en Puerto Madryn, Chubut.</p></div><div><b>Explorar</b><a href="{prefix}tienda.html">Catálogo de productos</a><a href="{prefix}tienda.html?category=Terminaciones%20y%20accesorios">Terminaciones y accesorios</a></div><div><b>Tu proyecto</b><a href="{prefix}index.html#aplicaciones">Categorías</a><a href="{prefix}index.html#muestras">Coordinar muestras</a></div><div class="footer-note"><a href="{wa('Hola FORMA, quiero hacer una consulta.')}">WhatsApp · +54 9 280 487-4717</a><span>Puerto Madryn · Chubut</span><a href="{prefix}admin/">Administrar la web</a><span>© 2026 FORMA</span></div></footer>'''
def paragraphs(text): return ''.join('<p>'+esc(p)+'</p>' for p in str(text or '').split('\n') if p.strip())
def head(title,description,canonical,extra='',prefix='../'):
    return f'''<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} | FORMA</title><meta name="description" content="{esc(description[:300])}"><link rel="canonical" href="{esc(canonical)}"><link rel="icon" href="{prefix}assets/icon.svg"><link rel="stylesheet" href="{prefix}styles.css"><link rel="stylesheet" href="{prefix}detail.css"><link rel="stylesheet" href="{prefix}brand.css?v={VERSION}">{extra}</head><body>'''
def supplier_markup(p):
    return ''
def calculator(p):
    v=p['pricing']
    if not v.get('coverage_m2'): return ''
    return f'''<section class="coverage-calculator" data-coverage="{v['coverage_m2']}" data-unit="{esc(v['unit'])}" data-price="{v['final_amount'] if v['final_amount'] is not None else ''}"><h2>Calculá tu superficie</h2><div class="calculator-fields"><label>Superficie a cubrir (m²)<input class="surface-input" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="Ej. 12"></label><label>Margen para cortes (%)<input class="waste-input" type="number" min="0" max="100" step="1" value="10"></label></div><output class="calculator-output" aria-live="polite">Rendimiento: {v['coverage_m2']} m² por {esc(v['unit'])}.</output><p>Estimación de material. Ajustamos cortes, accesorios y cantidades antes de confirmar. No incluye colocación ni envío.</p></section>'''
def page_scripts(prefix='../',detail=False):
    scripts=f'<script src="{prefix}data/catalog-data.js?v={CATALOG_VERSION}"></script><script src="{prefix}catalog-taxonomy.js?v={VERSION}"></script><script src="{prefix}script.js?v={VERSION}"></script><script src="{prefix}consultation.js?v={VERSION}"></script>'
    if detail:scripts+=f'<script src="{prefix}product-page.js?v={VERSION}"></script>'
    return scripts

def product_page(p,products):
    gallery=p['gallery'];main=gallery[0]
    thumbs=''.join(f'''<button class="gallery-thumb{' active' if i==0 else ''}" type="button" data-gallery-src="{esc(local_src(g['src']))}" data-gallery-alt="{esc(g.get('alt') or p['name'])}" data-gallery-kind="{esc(g.get('kind','Producto'))}"><img src="{esc(local_src(g['src']))}" alt="{esc(g.get('alt') or p['name'])}" loading="lazy"></button>''' for i,g in enumerate(gallery))
    specs=''.join('<div><dt>'+esc(r['label'])+'</dt><dd>'+esc(r['value'])+'</dd></div>' for r in p.get('specs_list',[]) if r.get('label') and r.get('value') and r['label'].strip().lower() not in {'marca','proveedor'})
    options=p.get('options') or []
    option_html=''
    if options:
        choices=''.join(f'''<option value="{esc(o.get('sku') or o['label'])}">{esc(o['label'])}</option>''' for o in options)
        option_html=f'''<div class="product-options"><label for="productOption">Elegí la terminación</label><select id="productOption" required><option value="">Seleccionar color o terminación</option>{choices}</select><p>Una ficha por tipo y formato. El color se elige dentro del producto.</p></div>'''
    by_id={v['id']:v for v in products}
    variants=[v for v in p.get('variants',[]) if v.get('id') in by_id and v['id']!=p['id']]
    variant_html=''
    if variants:
        links=''.join(f'''<a class="variant-chip" href="{esc(v['id'])}.html">{esc(v.get('label') or by_id[v['id']]['name'])}</a>''' for v in variants)
        variant_html=f'<section class="variant-section"><p class="detail-label">OTROS DISEÑOS DE ESTA LÍNEA</p><div class="variant-list">{links}</div></section>'
    documents=''.join(f'''<a href="{esc(d['url'])}" target="_blank" rel="noopener">{esc(d.get('label') or 'Ficha técnica')} ↗</a>''' for d in p.get('technical_documents',[]) if str(d.get('url','')).startswith('https://'))
    extra_sections=''
    for key,label in [('installation','Instalación y preparación'),('care','Cuidado y mantenimiento'),('technical_notes','Antes de elegir')]:
        if p.get(key): extra_sections+=f'<section class="technical-copy"><h2>{label}</h2>{paragraphs(p[key])}</section>'
    if documents: extra_sections+='<section class="technical-copy"><h2>Documentación técnica</h2><div class="technical-links">'+documents+'</div></section>'
    related=[v for v in products if v['category']==p['category'] and v['id']!=p['id']][:4]
    related_html=''.join(f'''<a class="related-card" href="{esc(v['id'])}.html"><img src="{esc(local_src(v['image']))}" alt="{esc(v['name'])}" loading="lazy"><h3>{esc(v['name'])}</h3></a>''' for v in related)
    schema={'@context':'https://schema.org','@type':'Product','name':p['name'],'description':p.get('description',''),'category':p['category'],'sku':p.get('supplier_sku') or p['id'],'image':[DOMAIN+g['src'] for g in gallery]}
    schema_script='<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False).replace('<','\\u003c')+'</script>'
    result=head(p['name']+' en Puerto Madryn',p.get('description',''),DOMAIN+'/productos/'+p['id']+'.html',schema_script)+header()
    result+=f'''<main><nav class="breadcrumbs"><a href="../index.html">Inicio</a><span>/</span><a href="../tienda.html">Productos</a><span>/</span><a href="../categorias/{slug(p['category'])}.html">{esc(p['category'])}</a></nav><section class="product-detail product-detail-gallery"><div class="product-gallery"><div class="gallery-main"><img id="galleryMain" src="{esc(local_src(main['src']))}" alt="{esc(main.get('alt') or p['name'])}"></div><a id="galleryZoom" class="gallery-zoom" href="{esc(local_src(main['src']))}" target="_blank" rel="noopener">Ampliar imagen ↗</a><div class="gallery-thumbs">{thumbs}</div></div><div class="detail-copy"><p class="eyebrow">{esc(p.get('product_type') or p['category'])}</p><h1>{esc(p['name'])}</h1>{supplier_markup(p)}<p class="detail-meta">{esc(p.get('meta',''))}</p><div class="detail-description">{paragraphs(p.get('description',''))}</div>{option_html}<dl>{specs}</dl><p class="stock-line">Disponibilidad FORMA: <strong>{esc(p.get('stock_status') or 'Consultar')}</strong></p><div class="detail-price">{price_markup(p)}</div>{calculator(p)}<div class="order-row"><label>Cantidad <input class="detail-qty" type="number" min="1" value="1"></label><button class="button primary js-add-product" data-id="{esc(p['id'])}" data-name="{esc(p['name'])}" type="button">Agregar a mi consulta</button></div><a class="button whatsapp-detail" data-product-whatsapp data-name="{esc(p['name'])}" href="{wa('Hola FORMA, quiero consultar por '+p['name']+'.')}" target="_blank" rel="noopener">Consultar por WhatsApp</a><p class="detail-note">Confirmamos precio, disponibilidad y entrega antes de cerrar el pedido.</p></div></section><section class="technical-content">{extra_sections}{variant_html}</section>'''
    if related: result+='<section class="related"><p class="eyebrow">MÁS OPCIONES</p><h2>También puede interesarte</h2><div class="related-grid">'+related_html+'</div></section>'
    return result+f'''</main>{footer()}<a class="whatsapp-float" href="{wa('Hola FORMA, quiero hacer una consulta.')}" aria-label="Consultar por WhatsApp">Consultanos ↗</a>{page_scripts(detail=True)}</body></html>'''
def category_page(category,products):
    cards=''.join(f'''<a class="category-card" href="../productos/{esc(p['id'])}.html"><div><img src="{esc(local_src(p['image']))}" alt="{esc(p['name'])}" loading="lazy"></div><h3>{esc(p['name'])}</h3><p>{esc(p.get('meta',''))}</p></a>''' for p in products)
    return head(category+' en Puerto Madryn',category+' en FORMA: materiales y asesoramiento.',DOMAIN+'/categorias/'+slug(category)+'.html')+header()+f'''<main><nav class="breadcrumbs"><a href="../index.html">Inicio</a><span>/</span><a href="../tienda.html">Productos</a><span>/</span>{esc(category)}</nav><section class="category-hero"><p class="eyebrow">DÓNDE APLICARLO</p><h1>{esc(category)}</h1><a class="text-link" href="../tienda.html?category={quote(category)}">Ver y filtrar productos →</a></section><section class="category-products"><div class="category-grid">{cards}</div></section></main>'''+footer()+page_scripts()+'</body></html>'

def public_name(value):
    value=re.sub(r'Vita[ -]?(?:Deko|Deco)|Difan(?:[ -]?Deco)?|Vita Glue','',str(value),flags=re.I)
    value=re.sub(r'\s+',' ',value).strip(' ·-®')
    return value or 'Material de revestimiento'

def public_id(p):
    return slug(public_name(p['name']))+'-'+hashlib.sha256(p['id'].encode()).hexdigest()[:6]

def is_self_adhesive(p):
    if p.get('adhesive_system')=='Autoadhesivo':return True
    if p.get('adhesive_system')=='Otro sistema':return False
    if isinstance(p.get('self_adhesive'),bool):return p['self_adhesive']
    name=unicodedata.normalize('NFKD',p.get('name','')+' '+p.get('product_type','')).encode('ascii','ignore').decode().lower()
    if 'electrostatic' in name or re.search(r'\b(?:no|sin)\s+(?:es\s+)?autoadhesiv',name):return False
    return 'autoadhesiv' in name or p.get('product_type')=='Vinilo decorativo'

def public_product(p, photos, id_map):
    allowed={'name','category','product_type','finish','uses','meta','description','featured','published','sort_order','stock_quantity','offer','pricing','price','price_old','price_per_m2_text','installation','care','technical_notes'}
    q={k:json.loads(json.dumps(v)) for k,v in p.items() if k in allowed}
    q['id']=id_map[p['id']];q['name']=public_name(p['name']);q['self_adhesive']=is_self_adhesive(p)
    for key in ['description','meta','installation','care','technical_notes','product_type']:
        if key in q:
            q[key]=re.sub(r'https?://\S+','',public_name(q[key])) if q[key] else ''
    if re.search(r'formato indicado en el nombre',q.get('meta',''),re.I):q['meta']=''
    q['specs_list']=[{'label':r['label'],'value':public_name(r['value'])} for r in p.get('specs_list',[]) if r.get('label') and r.get('value') and not any(t in r['label'].lower() for t in ['marca','proveedor','codigo','código','sku'])]
    q['specs']={r['label']:r['value'] for r in q['specs_list']}
    q['options']=[{'label':public_name(o['label']),'sku':'terminacion-'+str(i+1)} for i,o in enumerate(p.get('options') or [])]
    q['variants']=[{'id':id_map[v['id']],'label':public_name(v.get('label',''))} for v in p.get('variants',[]) if v.get('id') in id_map]
    q['stock_state']='out_of_stock' if p.get('supplier_availability')=='out_of_stock' or p.get('stock_quantity')==0 or re.search('sin stock|agotado',str(p.get('stock_status','')),re.I) else 'on_request'
    q['stock_status']='Sin stock temporal' if q['stock_state']=='out_of_stock' else 'Consultar disponibilidad'
    q.pop('stock_quantity',None)
    if re.search(r'wpc|wall panel',p['name']+' '+p.get('product_type',''),re.I):q['finish']='Maderas'
    ambient=[g for g in photos if re.search('ambient|aplicad|colocado',g.get('kind',''),re.I)]
    detail=[g for g in photos if re.search('detalle|trama|producto',g.get('kind',''),re.I) and g not in ambient]
    chosen=ambient[:1]
    candidates=detail or [g for g in photos if g not in chosen]
    if candidates:chosen+=candidates[:1]
    if not ambient:chosen=(detail or photos)[:2]
    if not chosen:chosen=photos[:1]
    q['gallery']=[]
    destdir=SITE/'assets/products/public';destdir.mkdir(parents=True,exist_ok=True)
    for g in chosen[:2]:
        src=SITE/g['src'].lstrip('/');data=src.read_bytes();filename=hashlib.sha256(data).hexdigest()[:24]+src.suffix.lower()
        target=destdir/filename
        if not target.exists():target.write_bytes(data)
        label='Detalle ilustrativo' if re.search('ilustr|simul',g.get('kind',''),re.I) else 'Ambientación' if g in ambient else 'Detalle de producto'
        q['gallery'].append({'src':'/assets/products/public/'+filename,'alt':q['name']+' · '+label,'kind':label,'association':'exact','counts_as_photo':True})
    q['image']=q['gallery'][0]['src'].lstrip('/');q['image_status']='verified'
    return q

def build(site=SITE):
    global SITE,CATALOG_VERSION
    SITE=Path(site)
    rows=[json.loads(f.read_text(encoding='utf-8')) for f in sorted((SITE/'content/products').glob('*.json'))]
    if len({p.get('id') for p in rows})!=len(rows): raise ValueError('Identificadores duplicados')
    products=[];report=[]
    id_map={p['id']:public_id(p) for p in rows}
    for p in rows:
        if not re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*',p.get('id','')): raise ValueError('Identificador inválido: '+str(p.get('id')))
        if not p.get('name'): raise ValueError('Falta nombre: '+p['id'])
        issues,photos=publication_issues(p,SITE)
        report.append({'id':p['id'],'name':p['name'],'supplier':p.get('supplier',''),'brand':p.get('brand',''),'photos':len(photos),'visible':not issues,'issues':issues})
        if issues: continue
        p=public_product(p,photos,id_map)
        p['catalog_categories']=product_categories(p)
        apply_pricing(p);products.append(p)
    products.sort(key=lambda p:(not p.get('featured',False),p.get('sort_order') if p.get('sort_order') is not None else 9999,p['name']))
    (SITE/'data').mkdir(exist_ok=True)
    public_products=products
    (SITE/'data/catalog.json').write_text(json.dumps(public_products,ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
    (SITE/'data/catalog-data.js').write_text('window.FORMA_PRODUCTS = '+json.dumps(public_products,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8',newline='\n')
    catalog_version=hashlib.sha256(json.dumps(public_products,ensure_ascii=False).encode()).hexdigest()[:12]
    CATALOG_VERSION=catalog_version
    for page_name in ['index.html','tienda.html']:
        page_path=SITE/page_name
        if page_path.exists():
            page_html=page_path.read_text(encoding='utf-8')
            page_html=re.sub(r'data/catalog-data\.js(?:\?v=[^"\s>]*)?', 'data/catalog-data.js?v='+catalog_version,page_html)
            page_path.write_text(page_html,encoding='utf-8',newline='\n')
    for directory in ['productos','categorias']:
        target=SITE/directory;target.mkdir(exist_ok=True)
        for old in target.glob('*.html'): old.unlink()
    for p in products: (SITE/'productos'/ (p['id']+'.html')).write_text(product_page(p,products),encoding='utf-8',newline='\n')
    categories=[c for c in CATEGORIES if any(p['category']==c for p in products)]
    for c in categories: (SITE/'categorias'/(slug(c)+'.html')).write_text(category_page(c,[p for p in products if p['category']==c]),encoding='utf-8',newline='\n')
    urls=[DOMAIN+'/',DOMAIN+'/tienda.html']+[DOMAIN+'/categorias/'+slug(c)+'.html' for c in categories]+[DOMAIN+'/productos/'+p['id']+'.html' for p in products]
    (SITE/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+'\n'.join('<url><loc>'+esc(u)+'</loc></url>' for u in urls)+'\n</urlset>\n',encoding='utf-8',newline='\n')
    (SITE/'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: '+DOMAIN+'/sitemap.xml\n',encoding='utf-8',newline='\n')
    admin=SITE/'admin';admin.mkdir(exist_ok=True)
    (admin/'publication-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
    body=''.join('<tr><td>'+esc(r['name'])+'</td><td>'+esc(r['supplier'])+'</td><td>'+esc(r['brand'])+'</td><td>'+str(r['photos'])+'</td><td>'+('Visible' if r['visible'] else esc('; '.join(r['issues'])))+'</td></tr>' for r in report)
    (admin/'control.html').write_text(head('Control de publicación','Estado de las fichas del catálogo',DOMAIN+'/admin/control.html','<meta name="robots" content="noindex,nofollow">')+f'<main class="publication-control"><a href="./">← Administración</a><h1>Control del catálogo</h1><p>{len(products)} fichas visibles de {len(rows)} editables. Se muestra la ambientación y el detalle disponibles. El stock no condiciona la publicación. Las fichas técnicas externas y marcas no se publican.</p><div class="control-table"><table><thead><tr><th>Producto</th><th>Proveedor</th><th>Marca</th><th>Fotos válidas</th><th>Estado</th></tr></thead><tbody>{body}</tbody></table></div></main></body></html>',encoding='utf-8',newline='\n')
    return {'products':len(products),'editable':len(rows),'hidden':len(rows)-len(products),'categories':len(categories)}
if __name__=='__main__': print(json.dumps(build(),ensure_ascii=False))
