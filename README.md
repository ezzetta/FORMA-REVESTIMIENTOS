# FORMA Revestimientos - sitio web

Sitio estático preparado para GitHub Pages. No requiere compilación ni instalación de dependencias.

## Publicación en GitHub Pages

1. Crear un repositorio nuevo en GitHub.
2. Subir todo el contenido de esta carpeta a la raíz del repositorio.
3. Abrir **Settings → Pages**.
4. Seleccionar **Deploy from a branch**.
5. Elegir la rama `main` y la carpeta `/ (root)`.
6. Guardar y esperar que GitHub informe la dirección pública.

## Archivos principales

- `index.html`: presentación institucional y showroom.
- `tienda.html`: catálogo con filtros, búsqueda y selección.
- `data/catalog.json`: catálogo completo en formato reutilizable.
- `productos/`: páginas individuales para buscadores y consultas.
- `categorias/`: páginas de cada familia de productos.
- `sitemap.xml`: mapa del sitio.
- `robots.txt`: instrucciones para buscadores.
- `llms.txt`: resumen legible del negocio y el catálogo.

## Fotografías del catálogo

- Las fotografías se muestran únicamente cuando el nombre y la variante del producto están verificados contra la fuente pública.
- Los artículos sin una fotografía exacta usan una placa gráfica identificada como **Foto a confirmar**.
- No reemplazar esas placas con imágenes genéricas de otros productos: cada foto debe corresponder al nombre, color y formato publicados.

## WhatsApp

Los botones están conectados a **+54 9 280 487-4717** mediante enlaces `wa.me`. La selección de productos se guarda localmente en el navegador y genera un mensaje con todos los artículos elegidos.

## Antes de publicar

- Reemplazar la dirección, ciudad y horarios cuando estén definidos.
- Confirmar los precios de venta propios de FORMA.
- Completar Instagram y Google Maps.
- Cambiar el dominio de ejemplo `formarevestimientos.com.ar` en `sitemap.xml`, `robots.txt` y las etiquetas canónicas si se utiliza otro dominio.
- Confirmar autorización para publicar las fotografías provistas por los catálogos comerciales.
