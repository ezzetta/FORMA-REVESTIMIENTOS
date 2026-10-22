# FORMA Revestimientos

Catálogo con atención virtual y muestras a coordinar en Puerto Madryn.

## Administración

[Pages CMS](https://app.pagescms.org/ezzetta/forma-revestimientos/main/collection/products) permite editar productos, fotos, especificaciones y opciones sin programar. Ver [guía](ADMINISTRAR_PRODUCTOS.md).

Actualización del 22/10/2026: 130 fichas editables; 46 visibles y 84 ocultas. Cada ficha visible requiere tres fotos distintas y reales. Las imágenes técnicas y referencias compartidas no cuentan para ese mínimo. Las publicaciones incompletas se conservan para completar desde el administrador.

Todos los precios y ofertas están apagados. Los nuevos productos también comienzan con precio apagado y publicación oculta.

La clasificación principal es por aplicación: Muros y paredes, Pisos, Cielorrasos, Vidrios, Terminaciones y accesorios. Solo aparecen categorías con productos publicados. Material, interior/exterior y proveedor son filtros adicionales. Perfiles y zócalos agrupan colores como opciones; los diseños de Vita Deko tienen fichas individuales.

## Fotos y control

Ver [formato de fotos](FOTOS_PRODUCTOS.md), [control del catálogo](admin/control.html) y [revisión realizada](REVISION_CATALOGO.md).

## Publicación

Los cambios guardados en main reconstruyen la web con GitHub Actions y se publican en https://ezzetta.github.io/FORMA-REVESTIMIENTOS/. El catálogo se genera desde content/products.

Comprobaciones: python -m unittest discover -s tools -p "test_*.py"; construcción: python tools/build_catalog.py. Requiere Python 3, sin dependencias adicionales.

## Pedidos

La selección conserva cantidad y terminación elegida. El cliente decide enviar la consulta por WhatsApp al +54 9 280 487-4717. FORMA confirma precio, stock y entrega antes de cerrar el pedido.
