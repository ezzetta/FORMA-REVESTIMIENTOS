"""Export only customer-facing files to the Pages artifact."""
from pathlib import Path
import shutil,json
SITE=Path(__file__).resolve().parents[1]
OUT=(SITE/'_site').resolve()
if OUT.parent!=SITE.resolve():raise ValueError('Invalid export destination')
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir()
for name in ['index.html','tienda.html','404.html','styles.css','brand.css','store.css','detail.css','script.js','catalog-taxonomy.js','consultation.js','store.js','product-page.js','robots.txt','sitemap.xml','site.webmanifest','.nojekyll']:
    if (SITE/name).is_file():shutil.copy2(SITE/name,OUT/name)
for name in ['productos','categorias','data']:
    shutil.copytree(SITE/name,OUT/name)
(OUT/'assets').mkdir()
for item in (SITE/'assets').iterdir():
    if item.is_file():shutil.copy2(item,OUT/'assets'/item.name)
for name in ['fonts']:
    if (SITE/'assets'/name).exists():shutil.copytree(SITE/'assets'/name,OUT/'assets'/name)
for product in json.loads((SITE/'data/catalog.json').read_text(encoding='utf-8')):
    for image in product['gallery']:
        rel=Path(image['src'].lstrip('/'))
        target=OUT/rel;target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(SITE/rel,target)
(OUT/'admin').mkdir()
shutil.copy2(SITE/'admin/index.html',OUT/'admin/index.html')
quote_files = ('index.html', 'cotizador.css', 'cotizador.js', 'engine.js', 'xlsx.js', 'quote-archive.js', 'offline.js', 'service-worker.js', 'roble-ceniza-compas.webp')
quote_source = SITE/'admin/cotizador'
if quote_source.is_dir():
    quote_target = OUT/'admin/cotizador'
    quote_target.mkdir()
    for name in quote_files:
        shutil.copy2(quote_source/name, quote_target/name)
print('Customer-facing export ready; source products and internal reports excluded.')
