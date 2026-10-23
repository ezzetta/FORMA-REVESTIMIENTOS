"""Publication guardrails shared by the builder and tests."""
from pathlib import Path
import hashlib, re, struct, unicodedata

CATEGORIES = ['Muros y paredes', 'Pisos', 'Cielorrasos', 'Vidrios', 'Terminaciones y accesorios']

def clean(value):
    return ''.join(c for c in unicodedata.normalize('NFD', str(value or '')).lower() if unicodedata.category(c) != 'Mn')

def dimensions(data):
    if data.startswith(b'\x89PNG\r\n\x1a\n') and len(data)>=24: return struct.unpack('>II', data[16:24])
    if data[:4]==b'RIFF' and data[8:12]==b'WEBP':
        if data[12:16]==b'VP8X' and len(data)>=30: return (1+int.from_bytes(data[24:27],'little'),1+int.from_bytes(data[27:30],'little'))
        if data[12:16]==b'VP8 ' and len(data)>=30: return (int.from_bytes(data[26:28],'little') & 0x3fff,int.from_bytes(data[28:30],'little') & 0x3fff)
        if data[12:16]==b'VP8L' and len(data)>=25:
            bits=int.from_bytes(data[21:25],'little'); return ((bits & 0x3fff)+1,((bits >> 14) & 0x3fff)+1)
    if data[:2]==b'\xff\xd8':
        i=2
        while i+8<len(data):
            if data[i]!=255: i+=1; continue
            marker=data[i+1];i+=2
            if marker in (0xD8,0xD9) or 0xD0<=marker<=0xD7: continue
            if i+2>len(data): break
            size=int.from_bytes(data[i:i+2],'big')
            if marker in (0xC0,0xC1,0xC2,0xC3,0xC5,0xC6,0xC7,0xC9,0xCA,0xCB,0xCD,0xCE,0xCF): return (int.from_bytes(data[i+5:i+7],'big'),int.from_bytes(data[i+3:i+5],'big'))
            if size<2: break
            i+=size
    return None

def all_gallery(product, site):
    result=[];seen=set();site=Path(site).resolve()
    for image in product.get('gallery') or []:
        src=str(image.get('src') or '').lstrip('/')
        target=(site/src).resolve()
        if not target.is_relative_to(site/'assets') or target.suffix.lower() not in {'.jpg','.jpeg','.png','.webp'}: continue
        if clean(image.get('kind')) == 'pendiente': continue
        if not target.is_file(): continue
        data=target.read_bytes()
        size=dimensions(data)
        if not size or min(size)<200 or len(data)>10*1024*1024: continue
        digest=hashlib.sha256(data).hexdigest()
        if digest in seen: continue
        seen.add(digest);result.append(dict(image,src='/'+src))
    return result

def usable_gallery(product,site):
    return [g for g in all_gallery(product,site) if g.get('counts_as_photo',True) and g.get('association','exact')=='exact' and clean(g.get('kind')) not in {'informacion tecnica','ficha tecnica','muestra de color','detalle de familia'}]

def publication_issues(product, site):
    issues=[];name=clean(product.get('name'));category=product.get('category','')
    if any(term in name for term in ['jardin', 'cesped', 'cerradura', 'antideslizante', 'placa 3d', 'placas 3d', 'ladrillo', 'placa tubos', 'placa triangulos', 'placa blanco hexagonal', 'placa subway']): issues.append('Línea retirada del catálogo')
    if category not in CATEGORIES: issues.append('Falta clasificar por aplicación')
    if not product.get('supplier'): issues.append('Falta indicar proveedor')
    if clean(product.get('supplier'))=='difan' and product.get('supplier_availability')!='in_stock': issues.append('Stock de DIFAN pendiente de verificar')
    photos=usable_gallery(product,site)
    minimum=1 if product.get('photo_exception')=='vita-uv-2026-10-23' and product.get('supplier')=='Vita Deko' and product.get('product_type')=='Placa UV símil mármol' else 3
    if len(photos)<minimum: issues.append(f'Faltan fotos: {len(photos)} de {minimum} válidas y distintas')
    if not product.get('published',False): issues.append('Oculto por decisión del administrador')
    return issues,photos
