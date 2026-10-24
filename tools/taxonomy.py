"""Customer-facing, overlapping catalogue characteristics."""
import re, unicodedata

def clean(value):
    return unicodedata.normalize('NFKD', str(value or '')).encode('ascii','ignore').decode().lower()

def product_categories(p):
    name=clean(p.get('name')); kind=clean(p.get('product_type'))
    text=name+' '+kind; category=p.get('category'); finish=p.get('finish','')
    tags=[]
    adhesive=kind.startswith('adhesivo')
    anti='antigolpe' in text
    wpc=bool(re.search(r'wpc|wall panel',text))
    if category=='Pisos' and not anti:
        tags.append('pisos')
        if 'spc' in text:tags.append('pisos-spc-click')
        if p.get('self_adhesive'):tags.append('pisos-autoadhesivos')
    if category=='Muros y paredes' and not adhesive:
        uses=p.get('uses') or ['interior']
        if 'interior' in uses:tags.append('pared-interior')
        if 'exterior' in uses or 'wpc exterior' in text:tags.append('pared-exterior')
    marble=finish=='Mármoles' or bool(re.search('marmol|calacatta|marquina|portoro|palissandro|placas pvc uv',text))
    if marble:tags.append('simil-marmol')
    if wpc or finish=='Maderas' or re.search('madera|nogal|roble|cedro|fresno|teka|pino',text) or ('listones' in text and category=='Pisos'):
        tags.append('simil-madera')
    if not marble and (finish=='Piedras' or 'piedra flexible' in kind or 'simil piedra' in kind):tags.append('simil-piedra')
    if wpc:tags.append('wpc-envarillados')
    if p.get('self_adhesive'):tags.append('autoadhesivos')
    if 'rollo' in name or 'papel espumado' in text or (wpc and p.get('self_adhesive')):tags.append('rollos')
    if (wpc and p.get('self_adhesive')) or 'papel espumado' in text or ('piedra flexible' in kind and 'rollo' in name):tags.append('rollos-3d')
    if 'vinilo decorativo' in kind:tags.append('vinilos')
    if category=='Vidrios':tags.append('vidrios-esmerilados')
    if category=='Cielorrasos':tags.append('cielorrasos')
    if category=='Terminaciones y accesorios' and not adhesive:tags.append('terminaciones')
    if adhesive:tags.append('adhesivos')
    if anti:tags.append('antigolpes')
    return list(dict.fromkeys(tags))
