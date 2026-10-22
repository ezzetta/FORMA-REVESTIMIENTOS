# Dominio de FORMA

Dirección principal: https://www.formarevestimientos.com.ar/

Registrador: NIC Argentina. DNS: Cloudflare, plan gratuito. Alojamiento y publicación: GitHub Pages, repositorio ezzetta/FORMA-REVESTIMIENTOS. Administración de productos: Pages CMS.

## Delegación en NIC

- lennox.ns.cloudflare.com
- vera.ns.cloudflare.com

Estado actualizado el 22/10/2026: registros creados en Cloudflare, dominio guardado en GitHub Pages y delegación ejecutada en NIC, con confirmación «Delegado: SÍ». Cloudflare espera la propagación del registrador. Quedan pendientes la resolución pública y la emisión del certificado HTTPS de GitHub; Enforce HTTPS todavía no está disponible.

## Registros DNS

Todos en modo DNS only, sin proxy:

| Tipo | Nombre | Destino |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | ezzetta.github.io |

GitHub redirige el dominio sin www hacia la dirección principal cuando la delegación está activa. GitHub Actions publica el sitio; un archivo CNAME dentro del proyecto no configura ese ajuste. El dominio se guarda en Settings → Pages → Custom domain. Activar Enforce HTTPS cuando el certificado esté disponible.

Los registros de correo no están configurados por esta tarea.
