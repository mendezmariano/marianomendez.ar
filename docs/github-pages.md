# Publicar el laboratorio en GitHub Pages

El repositorio de publicación es [mendezmariano/marianomendez.ar](https://github.com/mendezmariano/marianomendez.ar). GitHub Pages tiene asociado `www.marianomendez.ar` como dominio principal. La delegación en NIC Argentina y los registros de Cloudflare están configurados: el diagnóstico de Pages del 17 de noviembre de 2026 confirma que ambos dominios son válidos para HTTPS y no tienen errores de CAA.

El sitio está disponible en <https://www.marianomendez.ar/>. El certificado incluye el dominio con y sin `www`; se activó **Enforce HTTPS**. La comprobación del 17 de noviembre confirmó por HTTPS que los 10 archivos publicados coinciden con `dist/`. Los pasos de DNS siguientes se conservan como referencia de la configuración existente.

## Actualizar el sitio

1. Editá los artículos en `content/posts/` y reemplazá el CV de CVar en `cv/` cuando corresponda.
2. Ejecutá `npm ci` si todavía no instalaste las herramientas.
3. Ejecutá `npm run check`.
4. Guardá los cambios, incluido el perfil generado `dist/content.js`, en un commit y subilos a `main` del repositorio de publicación con autorización del usuario.
5. Revisá el resultado de [Publish laboratory](https://github.com/mendezmariano/marianomendez.ar/actions/workflows/pages.yml).

El flujo genera los artículos con `npm run build:posts`, comprueba la versión generada con `npm run check:dist` y valida el dibujo. Usa el perfil importado localmente y guardado en Git; el Word original está excluido del repositorio. Si todas las comprobaciones pasan, publica únicamente `dist/`. Las propuestas de cambio ejecutan las comprobaciones sin publicar. También podés ejecutar el flujo desde **Actions**, con **Run workflow**.

En **Settings > Pages**, la fuente de publicación debe ser **GitHub Actions**. El dominio personalizado se configura allí. `dist/CNAME` conserva el nombre del dominio como referencia; GitHub ignora ese archivo cuando publica mediante un flujo de Actions.

## Configurar Cloudflare

El proveedor elegido es Cloudflare con el plan Free. El dominio sigue registrado en NIC Argentina y el sitio se aloja en GitHub Pages. La zona de Cloudflare ya existe y usa `sandy.ns.cloudflare.com` y `titan.ns.cloudflare.com`, confirmados mediante consultas directas a ambos servidores.

1. Ingresá a [Cloudflare](https://dash.cloudflare.com/) o creá tu cuenta.
2. Usá **Onboard a domain** para agregar `marianomendez.ar`.
3. Elegí el plan **Free**.
4. En **DNS > Records**, abrí **Import and Export**.
5. Importá [cloudflare-dns.txt](cloudflare-dns.txt).
6. Comprobá que aparezcan los cinco registros de la tabla y que todos indiquen **DNS only**, con la nube gris.
7. Copiá los dos servidores de nombres que Cloudflare asigne al dominio. Aparecen durante el alta y en **Overview**.

El archivo usa el formato de importación de Cloudflare y fija `cf-proxied:false` para cada registro. La [documentación de importación](https://developers.cloudflare.com/dns/manage-dns-records/how-to/import-and-export/) describe ese atributo.

Si el enlace muestra el contenido del archivo, guardalo como `cloudflare-dns.txt` y seleccioná ese archivo en el importador. También podés cargar las cinco filas de la tabla mediante **Add record**.

El CNAME apunta al usuario de GitHub y no incluye el nombre del repositorio.

| Tipo | Nombre | Valor |
| --- | --- | --- |
| CNAME | `www` | `mendezmariano.github.io` |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

Los servidores asignados a este dominio son:

```text
sandy.ns.cloudflare.com
titan.ns.cloudflare.com
```

La [guía de alta de Cloudflare](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/) explica dónde encontrar los servidores asignados.

## Delegar el dominio en NIC Argentina

1. Comprobá que los cinco registros estén cargados en Cloudflare. GitHub Pages ya tiene guardado `www.marianomendez.ar` como dominio personalizado.
2. Ingresá a NIC Argentina con la cuenta titular de `marianomendez.ar`.
3. En la lista de dominios, abrí **Delegar** para `marianomendez.ar`.
4. Usá **Agregar una nueva delegación** para cargar `sandy.ns.cloudflare.com` y `titan.ns.cloudflare.com`.
5. Guardá los servidores y pulsá **Ejecutar Cambios**.

La [guía de delegación de NIC Argentina](https://nic.ar/es/ayuda/instructivos/delegacion-de-dominios) describe esos pasos.

Con ambos nombres configurados, GitHub redirige `marianomendez.ar` al dominio principal `www.marianomendez.ar`.

Si Pages no emite el certificado pese a indicar que el DNS es válido, la [guía oficial de certificados](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https#troubleshooting-certificate-provisioning-certificate-not-yet-created-error) indica quitar y volver a guardar el mismo dominio para reiniciar la solicitud. Este procedimiento resolvió la emisión el 17 de noviembre de 2026. Después de comprobar HTTPS, se activó **Enforce HTTPS**.

La [guía oficial de dominios personalizados](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) documenta los registros y la configuración de HTTPS.

## Verificar la publicación

```sh
dig marianomendez.ar NS +short
dig www.marianomendez.ar CNAME +short
npm run verify:deployment -- https://www.marianomendez.ar/
```

El último comando compara por SHA-256 la portada, los módulos, la hoja de estilos y los recursos publicados con sus versiones locales. Un error HTTP, de DNS o una diferencia de contenido hace fallar la comprobación. No sustituye la revisión interactiva en navegador.

Después de activar **Enforce HTTPS**, una respuesta HTTP anterior puede permanecer en la caché de GitHub hasta vencer su `max-age`. En la activación del 17 de noviembre, Pages ya informaba HTTPS obligatorio y los recursos redirigían con 301 mientras la portada HTTP conservaba una respuesta de caché de 600 segundos. No es necesario reiniciar la emisión del certificado por esa respuesta temporal.

La dirección inicial de GitHub Pages redirige al dominio personalizado una vez asociado. La siguiente comprobación también depende entonces de que el DNS del dominio funcione:

```sh
npm run verify:deployment -- https://mendezmariano.github.io/marianomendez.ar/
```
