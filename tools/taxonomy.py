"""Customer-facing, overlapping catalogue characteristics."""
import re, unicodedata

def clean(value):
    return unicodedata.normalize('NFKD', str(value or '')).encode('ascii','ignore').decode().lower()

def product_categories(p):
    name=clean(p.get('name')); kind=clean(p.get('product_type'))
    text=name+' '+kind; category=p.get('category'); finish=p.get('finish','')
    complements=set(p.get('complements_for') or [])
    tags=[]
    adhesive=kind.startswith('adhesivo')
    anti='antigolpe' in text
    wpc=bool(re.search(r'wpc|wall panel',text))
    uses=p.get('uses') or ['interior']
    for use in ('interior','exterior'):
        if use in uses:tags.append(use)
    if category=='Pisos' and not anti:
        tags.append('pisos')
        if 'spc' in text:tags.append('pisos-spc-click')
        if p.get('self_adhesive'):tags.append('pisos-autoadhesivos')
    if category=='Muros y paredes':
        if 'interior' in uses:tags.append('pared-interior')
        if 'exterior' in uses or 'wpc exterior' in text:tags.append('pared-exterior')
    marble=finish=='Mármoles' or bool(re.search('marmol|calacatta|marquina|portoro|palissandro|placas pvc uv',text))
    if marble:tags.append('simil-marmol')
    if wpc or finish=='Maderas' or re.search('madera|nogal|roble|cedro|fresno|teka|pino',text) or ('listones' in text and category=='Pisos'):
        tags.append('simil-madera')
    if not marble and (finish=='Piedras' or 'piedra flexible' in kind or 'simil piedra' in kind):tags.append('simil-piedra')
    if finish=='Cementos' or 'cemento' in text:tags.append('simil-cemento')
    if wpc:tags.append('wpc-envarillados')
    if p.get('self_adhesive'):tags.append('autoadhesivos')
    rigid=bool(re.search(r'placa|panel|spc|pvc|zocalo|perfil|moldura|mosaico|baldosa|liston|machimbre',text))
    if rigid and not anti:tags.append('rigidos')
    if 'rollo' in name or 'papel espumado' in text or (wpc and p.get('self_adhesive')):tags.append('rollos')
    if (wpc and p.get('self_adhesive')) or 'papel espumado' in text or ('piedra flexible' in kind and 'rollo' in name):tags.append('rollos-3d')
    if 'vinilo decorativo' in kind:tags.append('vinilos')
    if category=='Vidrios':tags.append('vidrios-esmerilados')
    if category=='Cielorrasos':
        tags.extend(['cielorrasos','pared-interior'])
    if 'Pisos' in complements:tags.append('pisos')
    if 'Muros y paredes' in complements:tags.append('pared-interior')
    if 'Cielorrasos' in complements:tags.append('cielorrasos')
    if category=='Terminaciones y accesorios' and not adhesive:tags.append('terminaciones')
    if adhesive:tags.append('adhesivos')
    if anti:tags.extend(['antigolpes','otros-productos'])
    return list(dict.fromkeys(tags))
