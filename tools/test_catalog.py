import json, shutil, subprocess, sys, tempfile, unittest
from pathlib import Path
import struct,zlib
from catalog_rules import publication_issues

class CatalogBuildTests(unittest.TestCase):
    def setup_site(self,folder):
        site=Path(folder).resolve();assert site.is_relative_to(Path(__file__).resolve().parents[1])
        for part in ['tools','content/products','data','assets/products']: (site/part).mkdir(parents=True,exist_ok=True)
        for name in ['build_catalog.py','pricing.py','catalog_rules.py','prepare_public_site.py','taxonomy.py']:shutil.copyfile(Path(__file__).parent/name,site/'tools'/name)
        gallery=[]
        for i in range(3):
            def chunk(name,content):return struct.pack('>I',len(content))+name+content+struct.pack('>I',zlib.crc32(name+content)&0xffffffff)
            color=[(220,20,20),(20,20,220),(20,220,20)][i]
            row=b'\0'+bytes(color)*250
            image=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',250,250,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(row*250))+chunk(b'IEND',b'')
            (site/f'assets/products/{i}.png').write_bytes(image)
            gallery.append({'src':f'/assets/products/{i}.png','kind':'Producto real','association':'exact','counts_as_photo':True})
        product={'id':'producto-de-prueba','name':'Caja de prueba','category':'Pisos','supplier':'DIFAN','supplier_availability':'in_stock','brand':'Marca de prueba','published':True,'sort_order':None,'gallery':gallery,'pricing':{'amount':50000,'unit':'caja','show_price':True,'coverage_m2':2,'discount_percent':10},'offer':{'enabled':True}}
        return site,product
    def test_editor_fields_reach_public_catalog_and_product_page(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]) as folder:
            site,p=self.setup_site(folder)
            (site/'content/products/prueba.json').write_text(json.dumps(p),encoding='utf-8')
            hidden=dict(p,id='producto-oculto',published=False)
            (site/'content/products/oculto.json').write_text(json.dumps(hidden),encoding='utf-8')
            result=subprocess.run([sys.executable,str(site/'tools/build_catalog.py')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            products=json.loads((site/'data/catalog.json').read_text(encoding='utf-8'));self.assertEqual(len(products),1)
            self.assertEqual(products[0]['pricing']['price_per_m2'],22500)
            page=(site/'productos'/(products[0]['id']+'.html')).read_text(encoding='utf-8')
            for value in ['$ 45.000,00','$ 22.500,00 / m²','data-coverage="2.0"','data-price="45000.0"','../brand.css']:self.assertIn(value,page)
            self.assertNotIn('<b>Proveedor</b>',page)
            self.assertNotIn('Marca de prueba',page)
            self.assertNotIn('brand',products[0])
            self.assertLessEqual(len(products[0]['gallery']),2)
            self.assertNotIn('supplier',products[0])
            self.assertFalse((site/'productos/producto-oculto.html').exists())
    def test_stock_order_and_confirmed_quantity(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]) as folder:
            site,p=self.setup_site(folder)
            rows=[dict(p,id='agotado',supplier_availability='out_of_stock',featured=True),dict(p,id='pendiente',supplier_availability='unverified'),dict(p,id='disponible',supplier_availability='in_stock'),dict(p,id='stock-propio',supplier_availability='out_of_stock',stock_quantity=2),dict(p,id='cantidad-cero',supplier_availability='in_stock',stock_quantity=0)]
            for r in rows:(site/'content/products'/(r['id']+'.json')).write_text(json.dumps(r),encoding='utf-8')
            result=subprocess.run([sys.executable,str(site/'tools/build_catalog.py')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            products=json.loads((site/'data/catalog.json').read_text(encoding='utf-8'))
            self.assertEqual([r['stock_state'] for r in products],['in_stock','in_stock','on_request','out_of_stock','out_of_stock'])
    def test_alternative_wall_application_keeps_ceiling_and_product_views(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]) as folder:
            site,p=self.setup_site(folder)
            p['gallery'][0]['kind']='Ambientación'
            p['gallery'][1]['kind']='Detalle de producto'
            p['gallery'][2].update(kind='Ambientación en pared',additional_view=True)
            (site/'content/products/prueba.json').write_text(json.dumps(p),encoding='utf-8')
            result=subprocess.run([sys.executable,str(site/'tools/build_catalog.py')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            product=json.loads((site/'data/catalog.json').read_text(encoding='utf-8'))[0]
            self.assertEqual([g['kind'] for g in product['gallery']],['Ambientación','Detalle de producto','Ambientación'])
            page=(site/'productos'/(product['id']+'.html')).read_text(encoding='utf-8')
            self.assertEqual(page.count('data-gallery-src='),3)
    def test_one_real_photo_is_enough_but_technical_only_stays_hidden(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]) as folder:
            site,p=self.setup_site(folder)
            p['gallery']=p['gallery'][:1]
            self.assertEqual(publication_issues(p,site)[0],[])
            p['gallery'][0]['kind']='Información técnica'
            self.assertTrue(publication_issues(p,site)[0])
            p['gallery'][0]['kind']='Producto real';p['gallery'][0]['association']='family_shared'
            self.assertTrue(publication_issues(p,site)[0])
    def test_duplicate_file_contents_do_not_count_as_three_photos(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]) as folder:
            site,p=self.setup_site(folder);shutil.copyfile(site/'assets/products/0.png',site/'assets/products/2.png')
            self.assertEqual(len(publication_issues(p,site)[1]),2)
    def test_stock_does_not_hide_products_but_removed_lines_stay_hidden(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]) as folder:
            site,p=self.setup_site(folder)
            for status in ['out_of_stock','unverified','not_found']:
                p['supplier_availability']=status;self.assertEqual(publication_issues(p,site)[0],[])
            p['supplier_availability']='in_stock'
            for name in ['Jardín vertical','Cerradura Wifi','Ladrillo Blanco Pack x4','Placa 3D blanca','Alfombra antideslizante','Césped artificial']:
                p['name']=name;self.assertTrue(any('Línea retirada' in issue for issue in publication_issues(p,site)[0]))
    def test_unsafe_media_paths_do_not_count(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]) as folder:
            site,p=self.setup_site(folder);p['gallery'][2]['src']='../../outside.png'
            self.assertEqual(len(publication_issues(p,site)[1]),2)

    def test_customer_export_hides_origin_documents_and_marks_out_of_stock(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]) as folder:
            site,p=self.setup_site(folder)
            p.update(supplier_availability='out_of_stock',source_url='https://private-supplier.example/item',supplier_sku='SECRET-SKU',technical_documents=[{'url':'https://private-supplier.example/spec.pdf'}])
            p['gallery'][0]['kind']='Ambientación'
            p['gallery'][1]['kind']='Detalle de trama'
            p['gallery'][2]['kind']='Información técnica'
            (site/'content/products/prueba.json').write_text(json.dumps(p),encoding='utf-8')
            result=subprocess.run([sys.executable,str(site/'tools/build_catalog.py')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            data=(site/'data/catalog.json').read_text(encoding='utf-8')
            products=json.loads(data)
            self.assertEqual(products[0]['stock_status'],'Sin stock temporal')
            self.assertEqual([g['kind'] for g in products[0]['gallery']],['Ambientación','Detalle de producto'])
            page=(site/'productos'/(products[0]['id']+'.html')).read_text(encoding='utf-8')
            (site/'admin/index.html').write_text('Acceso al editor',encoding='utf-8')
            export=subprocess.run([sys.executable,str(site/'tools/prepare_public_site.py')],capture_output=True,text=True)
            self.assertEqual(export.returncode,0,export.stderr)
            self.assertTrue((site/'_site/data/catalog-data.js').exists())
            self.assertFalse((site/'_site/content').exists())
            self.assertFalse((site/'_site/admin/publication-report.json').exists())
            self.assertFalse((site/'_site/assets/products/0.png').exists())
            for value in ['SECRET-SKU','private-supplier.example','Marca de prueba','Información técnica']:
                self.assertNotIn(value,data+page)

    def test_self_adhesive_classification_excludes_click_and_electrostatic(self):
        from build_catalog import is_self_adhesive
        self.assertTrue(is_self_adhesive({'name':'WPC autoadhesivo beige'}))
        self.assertTrue(is_self_adhesive({'name':'Vinilo decorativo','product_type':'Vinilo decorativo'}))
        self.assertFalse(is_self_adhesive({'name':'Esmerilado electrostático para vidrio'}))
        self.assertFalse(is_self_adhesive({'name':'Cielorraso PVC','description':'No es autoadhesivo'}))
        self.assertFalse(is_self_adhesive({'name':'Piso SPC click'}))
        self.assertFalse(is_self_adhesive({'name':'Panel no autoadhesivo'}))

    def test_categories_overlap_and_keep_floor_wall_and_glass_distinct(self):
        from taxonomy import product_categories
        tags=product_categories({'name':'WPC autoadhesivo nogal','product_type':'Wall panel autoadhesivo','category':'Muros y paredes','uses':['interior'],'self_adhesive':True})
        self.assertTrue({'pared-interior','simil-madera','wpc-envarillados','autoadhesivos','rollos-3d'}<=set(tags))
        floor=product_categories({'name':'Piso SPC Click Roble','category':'Pisos','self_adhesive':False})
        self.assertIn('pisos-spc-click',floor);self.assertNotIn('pared-interior',floor)
        glass=product_categories({'name':'Esmerilado electrostático','category':'Vidrios','self_adhesive':False})
        self.assertIn('vidrios-esmerilados',glass);self.assertNotIn('autoadhesivos',glass)

if __name__=='__main__':unittest.main()
