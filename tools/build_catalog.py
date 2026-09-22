from pathlib import Path
from urllib.parse import quote
import html, json, re, unicodedata

SITE = Path(__file__).resolve().parents[1]
CONTENT = SITE / "content" / "products"
DOMAIN = "https://ezzetta.github.io/FORMA-REVESTIMIENTOS"
WHATSAPP = "5492804874717"

def esc(value): return html.escape(str(value if value is not None else ""), quote=True)
def slug(value):
    value = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")
def local_src(value, prefix="../"):
    return prefix + str(value).lstrip("/")
def wa(message): return f"https://wa.me/{WHATSAPP}?text={quote(message)}"
def logo(): return '<span class="brand-mark" aria-hidden="true"><i class="panel panel-a"></i><i class="panel panel-b"></i><i class="panel panel-c"></i></span><span class="brand-type"><strong>FORMA</strong><small>REVESTIMIENTOS</small></span>'
def header(prefix="../"):
    return f'''<div class="announcement"><span>Showroom en Puerto Madryn</span><span class="announcement-dot"></span><span>Consultas por WhatsApp</span></div><header class="site-header"><a class="brand" href="{prefix}index.html">{logo()}</a><button class="menu-button" type="button" aria-label="Abrir menú" aria-expanded="false"><span></span><span></span></button><nav class="main-nav"><a class="store-nav-main" href="{prefix}tienda.html">Ver productos</a><a href="{prefix}tienda.html?use=interior">Interior</a><a href="{prefix}tienda.html?use=exterior">Exterior</a><a href="{prefix}index.html#ambientes">Ambientes</a><a href="{prefix}index.html#showroom">Showroom</a><a class="nav-cta" href="{wa('Hola FORMA, quiero consultar por revestimientos en Puerto Madryn.')}" target="_blank" rel="noopener">WhatsApp</a></nav></header>'''
def footer(prefix="../"):
    return f'''<footer><div class="footer-brand"><strong>FORMA</strong><span>REVESTIMIENTOS</span><p>Tienda y showroom de revestimientos en Puerto Madryn, Chubut.</p></div><div><b>Comprar</b><a href="{prefix}tienda.html">Todos los productos</a><a href="{prefix}tienda.html?use=interior">Interior</a><a href="{prefix}tienda.html?use=exterior">Exterior</a></div><div><b>Elegir</b><a href="{prefix}index.html#materiales">Por material</a><a href="{prefix}index.html#ambientes">Por ambiente</a><a href="{prefix}index.html#showroom">Showroom</a></div><div class="footer-note"><a href="{wa('Hola FORMA, quiero hacer una consulta en Puerto Madryn.')}" target="_blank" rel="noopener">WhatsApp · +54 9 280 487-4717</a><span>Puerto Madryn · Chubut</span><span>© 2026 FORMA</span></div></footer>'''

products = [json.loads(path.read_text(encoding="utf-8")) for path in sorted(CONTENT.glob("*.json"))]
products = [p for p in products if p.get("published", True)]
products.sort(key=lambda p: (not p.get("featured", False), p.get("sort_order", 9999), p.get("name", "")))

for p in products:
    p["image"] = str((p.get("gallery") or [{"src":p.get("image","")}])[0].get("src") or p.get("image","")).lstrip("/")
    p.pop("mode", None)
    p["specs_list"] = [row for row in p.get("specs_list",[]) if row.get("label") and row.get("label", "").strip().lower() != "modalidad"]
    p["specs"] = {row.get("label",""):row.get("value","") for row in p["specs_list"]}

(SITE / "data" / "catalog.json").write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")
(SITE / "data" / "catalog-data.js").write_text("window.FORMA_PRODUCTS = " + json.dumps(products, ensure_ascii=False, separators=(",",":")) + ";\n", encoding="utf-8")

product_dir = SITE / "productos"; product_dir.mkdir(exist_ok=True)
for stale in product_dir.glob("*.html"): stale.unlink()
category_dir = SITE / "categorias"; category_dir.mkdir(exist_ok=True)
for stale in category_dir.glob("*.html"): stale.unlink()

by_id = {p["id"]:p for p in products}
for p in products:
    gallery = p.get("gallery") or [{"src":"/"+p["image"],"alt":p["name"],"kind":"Producto"}]
    main = gallery[0]
    thumbs = "".join(f'''<button class="gallery-thumb{' active' if i == 0 else ''}" type="button" data-gallery-src="{esc(local_src(g.get('src','')))}" data-gallery-alt="{esc(g.get('alt') or p['name'])}" data-gallery-kind="{esc(g.get('kind','Imagen'))}"><img src="{esc(local_src(g.get('src','')))}" alt=""><span>{esc(g.get('kind','Imagen'))}</span></button>''' for i,g in enumerate(gallery))
    specs = "".join(f"<div><dt>{esc(row.get('label'))}</dt><dd>{esc(row.get('value'))}</dd></div>" for row in p.get("specs_list",[]) if row.get("label") and row.get("label", "").strip().lower() != "modalidad")
    variants = [v for v in p.get("variants",[]) if v.get("id") in by_id]
    variant_html = ""
    if variants:
        links = "".join(f'''<a class="variant-chip{' active' if v['id'] == p['id'] else ''}" href="{esc(v['id'])}.html">{f'<img src="{esc(local_src(v.get("image"))) }" alt="">' if v.get('image') else ''}<span>{esc(v.get('label'))}</span></a>''' for v in variants)
        variant_html = f'<section class="variant-section"><p class="detail-label">COLORES Y VARIANTES</p><div class="variant-list">{links}</div></section>'
    offer = p.get("offer") or {}
    price = f'''<small>{esc(offer.get('label') or 'OFERTA')}</small><del>{esc(offer.get('old_price') or p.get('price'))}</del> {esc(offer.get('new_price') or p.get('price'))}''' if offer.get("enabled") else f'''<small>Precio y disponibilidad</small>{esc(p.get('price','Consultar precio'))}'''
    related = [item for item in products if item["category"] == p["category"] and item["id"] != p["id"]][:4]
    related_html = "".join(f'''<a class="related-card" href="{esc(item['id'])}.html"><img src="{esc(local_src('/'+item['image']))}" alt="{esc(item['name'])}"><span>{esc(item['category'])}</span><h3>{esc(item['name'])}</h3></a>''' for item in related)
    images_schema = [DOMAIN + "/" + str(g.get("src","")).lstrip("/") for g in gallery if g.get("kind") != "Pendiente"]
    schema = {"@context":"https://schema.org","@type":"Product","name":p["name"],"description":p.get("description",""),"category":p["category"],"sku":p["id"]}
    if images_schema: schema["image"] = images_schema
    page = f'''<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(p['name'])} en Puerto Madryn | FORMA</title><meta name="description" content="{esc(p.get('description',''))}"><link rel="canonical" href="{DOMAIN}/productos/{esc(p['id'])}.html"><link rel="icon" href="../assets/icon.svg" type="image/svg+xml"><link rel="stylesheet" href="../styles.css"><link rel="stylesheet" href="../detail.css"><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script></head><body>{header()}<main><nav class="breadcrumbs"><a href="../index.html">Inicio</a><span>/</span><a href="../tienda.html">Productos</a><span>/</span><a href="../categorias/{slug(p['category'])}.html">{esc(p['category'])}</a></nav><section class="product-detail product-detail-gallery"><div class="product-gallery"><div class="gallery-main"><img id="galleryMain" src="{esc(local_src(main.get('src','')))}" alt="{esc(main.get('alt') or p['name'])}"><span id="galleryKind">{esc(main.get('kind','Imagen'))}</span></div><div class="gallery-thumbs">{thumbs}</div></div><div class="detail-copy"><p class="eyebrow">{esc(p['category'])} · PUERTO MADRYN</p><h1>{esc(p['name'])}</h1><p class="detail-meta">{esc(p.get('meta',''))}</p><p class="detail-description">{esc(p.get('description',''))}</p>{variant_html}<dl>{specs}</dl><p class="stock-line">Disponibilidad: <strong>{esc(p.get('stock_status','Consultar'))}</strong></p><div class="detail-price">{price}</div><div class="order-row"><label>Cantidad <input class="detail-qty" type="number" min="1" value="1"></label><button class="button primary js-add-product" data-id="{esc(p['id'])}" data-name="{esc(p['name'])}" type="button">Agregar a mi pedido</button></div><a class="button whatsapp-detail" href="{wa('Hola FORMA, quiero consultar por '+p['name']+' en Puerto Madryn.')}" target="_blank" rel="noopener">Consultar por WhatsApp</a><p class="detail-note">Confirmamos precio, disponibilidad y entrega antes de cerrar el pedido.</p></div></section><section class="related"><p class="eyebrow">MÁS OPCIONES</p><h2>También puede interesarte</h2><div class="related-grid">{related_html}</div></section></main>{footer()}<a class="whatsapp-float" href="{wa('Hola FORMA, quiero hacer una consulta.')}"></a><script src="../script.js"></script><script src="../product-page.js"></script></body></html>'''
    (product_dir / f"{p['id']}.html").write_text(page, encoding="utf-8")

categories = sorted({p["category"] for p in products})
for category in categories:
    items = [p for p in products if p["category"] == category]
    cards = "".join(f'''<a class="category-card" href="../productos/{esc(p['id'])}.html"><div><img src="{esc(local_src('/'+p['image']))}" alt="{esc(p['name'])}"></div><h3>{esc(p['name'])}</h3><p>{esc(p.get('meta',''))}</p></a>''' for p in items)
    page = f'''<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(category)} en Puerto Madryn | FORMA</title><meta name="description" content="{esc(category)} disponibles en FORMA Revestimientos, tienda y showroom en Puerto Madryn."><link rel="canonical" href="{DOMAIN}/categorias/{slug(category)}.html"><link rel="stylesheet" href="../styles.css"><link rel="stylesheet" href="../detail.css"></head><body>{header()}<main><nav class="breadcrumbs"><a href="../index.html">Inicio</a><span>/</span><a href="../tienda.html">Productos</a><span>/</span>{esc(category)}</nav><section class="category-hero"><p class="eyebrow">CATÁLOGO · PUERTO MADRYN</p><h1>{esc(category)}</h1><a class="text-link" href="{wa('Hola FORMA, quiero consultar por '+category+'.')}" target="_blank" rel="noopener">Consultar por WhatsApp →</a></section><section class="category-products"><div class="category-grid">{cards}</div></section></main>{footer()}<script src="../script.js"></script></body></html>'''
    (category_dir / f"{slug(category)}.html").write_text(page, encoding="utf-8")

urls = [DOMAIN+"/",DOMAIN+"/tienda.html"] + [f"{DOMAIN}/categorias/{slug(c)}.html" for c in categories] + [f"{DOMAIN}/productos/{p['id']}.html" for p in products]
(SITE / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(f"  <url><loc>{html.escape(url)}</loc></url>" for url in urls) + "\n</urlset>\n", encoding="utf-8")
(SITE / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n", encoding="utf-8")
print(json.dumps({"products":len(products),"categories":len(categories),"pages":len(list(product_dir.glob('*.html')))},ensure_ascii=False))
