# FORMA Revestimientos

Sitio catálogo de FORMA Revestimientos, con atención virtual y encuentros con muestras a coordinar en Puerto Madryn.

## Publicación en GitHub Pages

1. Subir **todo** el contenido de esta carpeta a la raíz del repositorio `FORMA-REVESTIMIENTOS`, incluidos `.github`, `.pages.yml` y `.nojekyll`.
2. Abrir **Settings → Pages**.
3. En **Source**, abrir el selector que dice **Deploy from a branch** y elegir **GitHub Actions**.
4. Abrir la pestaña **Actions** y esperar que finalice `Construir y publicar FORMA`.
5. La dirección pública es `https://ezzetta.github.io/FORMA-REVESTIMIENTOS/`.

## Administrar productos

Las fichas editables están en `content/products`. Pages CMS permite modificarlas desde una pantalla sencilla sin editar código. Las instrucciones están en `ADMINISTRAR_PRODUCTOS.md`.

Cada cambio publicado reconstruye automáticamente:

- el catálogo y sus filtros;
- las páginas individuales;
- las categorías;
- el mapa del sitio para buscadores.

## Pedido por WhatsApp

El visitante puede agregar productos desde las tarjetas, cambiar cantidades y enviar el pedido completo a **+54 9 280 487-4717**. La página no cobra ni confirma stock automáticamente.

## Fotografías

Las fotografías se muestran únicamente cuando corresponden al producto. Los artículos sin una imagen exacta conservan la placa **Foto a confirmar**. Desde el administrador se pueden cargar imágenes de ambientación, producto real, presentación, instalación e información técnica.

## Identidad y administración · octubre 2026

Se aplica el libro de marca del 21 de octubre: logo conservado, DM Sans, Instrument Serif Italic y paleta neutra. El ambiente de portada se identifica como conceptual.

El editor Pages CMS permite modificar las 177 fichas y cargar fotos. Los campos numéricos de precio, unidad, descuento y rendimiento calculan automáticamente precio final y valor por m² al publicar. Ver ADMINISTRAR_PRODUCTOS.md. El dueño debe completar la activación de Pages CMS con su cuenta. Wanacom no interviene en el desarrollo o la administración de esta web.

Verificaciones: python -m unittest discover -s tools -p "test_*.py" y python tools/build_catalog.py.
