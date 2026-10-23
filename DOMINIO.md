# Dominio de FORMA

Dirección principal: https://www.formarevestimientos.com.ar/

Registrador: NIC Argentina. DNS: Cloudflare, plan gratuito. Alojamiento y publicación: GitHub Pages, repositorio ezzetta/FORMA-REVESTIMIENTOS. Administración de productos: Pages CMS.

## Delegación en NIC

- lennox.ns.cloudflare.com
- vera.ns.cloudflare.com

Estado actualizado el 23/10/2026: delegación activa en NIC/Cloudflare; GitHub valida el DNS, el certificado HTTPS es válido para el dominio con y sin www, y Enforce HTTPS quedó activado. Verificada respuesta HTTPS 200 para www y redirección HTTPS desde el dominio sin www y desde HTTP en la tienda. La portada HTTP puede conservar durante unos minutos una respuesta anterior de la caché de GitHub; usar directamente la dirección HTTPS.

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
