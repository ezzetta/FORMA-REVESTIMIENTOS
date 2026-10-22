# Administrar FORMA sin programar

Acceso: abrir admin/ desde el enlace Administrar la web, o entrar en https://app.pagescms.org/.

## Primera activación (dueño de la cuenta)
1. Iniciar sesión con GitHub.
2. Autorizar la aplicación Pages CMS para ezzetta/FORMA-REVESTIMIENTOS.
3. Elegir el repositorio y la rama main. Abrir Productos.
4. En GitHub → Settings → Pages, comprobar que Source sea GitHub Actions.

La configuración está preparada en .pages.yml. El acceso autenticado y un guardado real requieren la cuenta del propietario; no se sustituyen con una contraseña pública.

## Editar un producto
Buscar el nombre, modificar el formulario y guardar. El proceso Construir y publicar FORMA valida la carga y actualiza catálogo, fichas, categorías y mapa del sitio. Esperar a que finalice antes de comprobar la web.

- Mostrar producto: ocultar o publicar sin borrar.
- Destacado y orden: prioridad del catálogo.
- Nombre, descripción, aplicación, tipo de material y uso: información pública y filtros.
- Galería: cargar, reemplazar, quitar y reordenar fotos. La primera es la portada. Completar descripción y tipo; no usar imágenes de otro modelo.
- Especificaciones: lista de datos y valores, como material, medidas e instalación.
- Colores y variantes: enlazar identificadores de productos existentes.
- Stock: actualización manual; los pedidos por WhatsApp no descuentan unidades.

## Precio, descuento y rendimiento
- Mostrar precio: desactivado publica Consultar precio.
- Precio de venta: número en ARS, sin símbolo ni separador de miles; precio de una unidad de venta.
- Unidad de venta: caja, placa, rollo, pack, unidad, cartucho, m² o metro lineal.
- Rendimiento: m² cubiertos por esa misma unidad. Para una caja de 2,2 m², cargar 2.2. Dejar vacío si no aplica. Nunca cargar cero. Si se vende por m², se considera rendimiento 1.
- Descuento: porcentaje de 0 a 100. Solo se aplica con Oferta activada.
- Texto de precio: respaldo cuando no hay un importe numérico. No se convierte automáticamente a un número.

La web calcula precio final = precio × (1 − descuento / 100) y precio por m² = precio final ÷ rendimiento. Redondea a dos decimales. Si faltan datos no inventa valores. La calculadora de superficie agrega el margen que el visitante elige y redondea a unidades completas (m² y metros lineales a dos decimales). Envío, adhesivos, perfiles y colocación no están incluidos en ese importe.

Ejemplo explicativo: caja $50.000, rendimiento 2 m², descuento 10%, oferta activada → $45.000/caja y $22.500/m².

## Crear un producto
Elegir Nuevo y completar un identificador único en minúsculas con guiones (ejemplo panel-roble-claro), nombre y categoría. No cambiar el identificador de una ficha existente: se usa en su dirección web y en las variantes. Cargar fotos y especificaciones, completar unidad y precio si corresponde. Preparar la ficha con Mostrar producto desactivado y activarlo al terminar.

## Publicación y alcance
Guardar en main inicia la publicación. También está disponible Publicar cambios. Una validación fallida no reemplaza la web publicada: revisar Actions y corregir el dato indicado. El editor guarda en el repositorio de FORMA; el sitio no guarda cambios de productos en el navegador.

La web es un catálogo con consulta por WhatsApp; no cobra en línea ni confirma stock o entregas automáticamente. La operación y el mantenimiento de la página no requieren intervención de Wanacom.

## Imágenes e identidad
DM Sans para lectura, navegación y títulos. Instrument Serif Italic para acentos cortos. Se conserva el logo actual y la paleta grafito, marfil, arena y verde piedra. La portada se identifica como ambiente conceptual. Las fotos añadidas a fichas se asociaron por código exacto del proveedor; tools/image-provenance.json registra su origen. La autorización comercial de las fotos de proveedores no está documentada en el banco original.

## Revisión del catálogo del 22 de octubre de 2026

- Todos los precios apagados por defecto. Se pueden conservar valores guardados en el administrador sin mostrarlos.
- Clasificación por aplicación: Muros y paredes, Pisos, Cielorrasos, Vidrios, Terminaciones y accesorios. El tipo de material es un filtro diferente; se retiró la clasificación por ambientes.
- Proveedor y marca se editan por separado y se ven en tarjetas y fichas. No se presupone que un distribuidor es fabricante.
- Perfiles y zócalos se publican por forma/uso/formato; las opciones de color se editan dentro de esa ficha.
- Vita Deko tiene fichas individuales por diseño/color. Las fichas generales se retiraron.
- Cada ficha publicada requiere tres fotos válidas distintas. La web excluye copias del mismo archivo, fichas técnicas y referencias de familia del conteo. El material técnico se conserva como complemento.
- DIFAN: solo se publican productos con stock de proveedor verificado. La verificación es una fotografía del estado en la fecha de revisión; no es inventario en tiempo real ni stock propio de FORMA.
- Control de pendientes: admin/control.html. Guía de fotos: admin/fotos.html y FOTOS_PRODUCTOS.md.
- Las fichas que ocultaste en el administrador antes de esta revisión continúan ocultas.
