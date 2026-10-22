import json, shutil, subprocess, sys, tempfile, unittest
from pathlib import Path

class CatalogBuildTests(unittest.TestCase):
    def test_editor_fields_reach_public_catalog_and_product_page(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]) as folder:
            site = Path(folder).resolve()
            assert site.is_relative_to(Path(__file__).resolve().parents[1])
            for part in ['tools', 'content/products', 'data']: (site / part).mkdir(parents=True, exist_ok=True)
            for name in ['build_catalog.py', 'pricing.py']: shutil.copyfile(Path(__file__).parent / name, site / 'tools' / name)
            product={'id':'producto-de-prueba','name':'Caja de prueba','category':'Pisos','published':True,'sort_order':None,'gallery':[{'src':'/assets/prueba.webp','kind':'Producto real','alt':'Prueba'}], 'pricing':{'amount':50000,'unit':'caja','show_price':True,'coverage_m2':2,'discount_percent':10},'offer':{'enabled':True}}
            (site/'content/products/prueba.json').write_text(json.dumps(product), encoding='utf-8')
            hidden=dict(product,id='producto-oculto',published=False)
            (site/'content/products/oculto.json').write_text(json.dumps(hidden), encoding='utf-8')
            result=subprocess.run([sys.executable,str(site/'tools/build_catalog.py')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            products=json.loads((site/'data/catalog.json').read_text(encoding='utf-8'))
            self.assertEqual(len(products),1)
            self.assertEqual(products[0]['pricing']['price_per_m2'],22500)
            page=(site/'productos/producto-de-prueba.html').read_text(encoding='utf-8')
            self.assertIn('$ 45.000,00',page)
            self.assertIn('$ 22.500,00 / m²',page)
            self.assertIn('data-coverage="2.0"',page)
            self.assertIn('data-price="45000.0"',page)
            self.assertIn('../brand.css',page)
            self.assertFalse((site/'productos/producto-oculto.html').exists())

if __name__=='__main__': unittest.main()
