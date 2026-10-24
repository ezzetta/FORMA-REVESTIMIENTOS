"""Export only customer-facing files to the Pages artifact."""
from pathlib import Path
import shutil
SITE=Path(__file__).resolve().parents[1]
OUT=(SITE/'_site').resolve()
if OUT.parent!=SITE.resolve():raise ValueError('Invalid export destination')
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir()
for name in ['index.html','tienda.html','404.html','styles.css','brand.css','store.css','detail.css','script.js','store.js','product-page.js','robots.txt','sitemap.xml','site.webmanifest','.nojekyll']:
    if (SITE/name).is_file():shutil.copy2(SITE/name,OUT/name)
for name in ['productos','categorias','data']:
    shutil.copytree(SITE/name,OUT/name)
(OUT/'assets').mkdir()
for item in (SITE/'assets').iterdir():
    if item.is_file():shutil.copy2(item,OUT/'assets'/item.name)
for name in ['fonts','products/public']:
    if (SITE/'assets'/name).exists():shutil.copytree(SITE/'assets'/name,OUT/'assets'/name)
(OUT/'admin').mkdir()
shutil.copy2(SITE/'admin/index.html',OUT/'admin/index.html')
print('Customer-facing export ready; source products and internal reports excluded.')
