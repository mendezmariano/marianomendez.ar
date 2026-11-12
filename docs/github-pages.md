# Publicar el laboratorio en GitHub Pages

El repositorio de publicación es [mendezmariano/marianomendez.ar](https://github.com/mendezmariano/marianomendez.ar). El dominio principal previsto es `www.marianomendez.ar`. La [dirección inicial](https://mendezmariano.github.io/marianomendez.ar/) funciona mientras se prepara la delegación DNS.

## Actualizar el sitio

1. Editá los artículos en `content/posts/` y el perfil en `dist/content.js`.
2. Ejecutá `npm ci` si todavía no instalaste las herramientas.
3. Ejecutá `npm run check`.
4. Guardá los cambios en un commit y subilos a `main` del repositorio de publicación.
5. Revisá el resultado de [Publish laboratory](https://github.com/mendezmariano/marianomendez.ar/actions/workflows/pages.yml).

El flujo genera los artículos, ejecuta las pruebas y valida el dibujo. Si todas las comprobaciones pasan, publica únicamente `dist/`. Las propuestas de cambio ejecutan las comprobaciones sin publicar. También podés ejecutar el flujo desde **Actions**, con **Run workflow**.

En **Settings > Pages**, la fuente de publicación debe ser **GitHub Actions**. El dominio personalizado se configura allí. `dist/CNAME` conserva el nombre del dominio como referencia; GitHub ignora ese archivo cuando publica mediante un flujo de Actions.

## Configurar Cloudflare

El proveedor elegido es Cloudflare con el plan Free. El dominio sigue registrado en NIC Argentina y el sitio se aloja en GitHub Pages.

1. Ingresá a [Cloudflare](https://dash.cloudflare.com/) o creá tu cuenta.
2. Usá **Onboard a domain** para agregar `marianomendez.ar`.
3. Elegí el plan **Free**.
4. En **DNS > Records**, abrí **Import and Export**.
5. Importá [cloudflare-dns.txt](cloudflare-dns.txt).
6. Comprobá que aparezcan los cinco registros de la tabla y que todos indiquen **DNS only**, con la nube gris.
7. Copiá los dos servidores de nombres que Cloudflare asigne al dominio. Aparecen durante el alta y en **Overview**.

El archivo usa el formato de importación de Cloudflare y fija `cf-proxied:false` para cada registro. La [documentación de importación](https://developers.cloudflare.com/dns/manage-dns-records/how-to/import-and-export/) describe ese atributo.

El CNAME apunta al usuario de GitHub y no incluye el nombre del repositorio.

| Tipo | Nombre | Valor |
| --- | --- | --- |
| CNAME | `www` | `mendezmariano.github.io` |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

Los servidores de nombres son específicos del dominio. Usá exactamente los que muestre Cloudflare. La [guía de alta de Cloudflare](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/) explica dónde encontrarlos.

## Delegar el dominio en NIC Argentina

1. Antes de activar la delegación, guardá `www.marianomendez.ar` como dominio personalizado en **Settings > Pages** del repositorio de GitHub.
2. Ingresá a NIC Argentina con la cuenta titular de `marianomendez.ar`.
3. Abrí la configuración de delegación del dominio.
4. Cargá los dos servidores de nombres asignados por Cloudflare.
5. Guardá la delegación.

Con ambos nombres configurados, GitHub redirige `marianomendez.ar` al dominio principal `www.marianomendez.ar`.

Cuando el DNS sea público, esperá a que GitHub emita el certificado. Activá **Enforce HTTPS** cuando esté disponible.

La [guía oficial de dominios personalizados](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) documenta los registros y la configuración de HTTPS.

## Verificar la publicación

```sh
dig marianomendez.ar NS +short
dig www.marianomendez.ar CNAME +short
npm run verify:deployment -- https://www.marianomendez.ar/
```

El último comando compara por SHA-256 la portada, los módulos, la hoja de estilos y los recursos publicados con sus versiones locales. Un error HTTP, de DNS o una diferencia de contenido hace fallar la comprobación. No sustituye la revisión interactiva en navegador.

Mientras el dominio personalizado todavía no esté asociado en Pages, podés verificar la URL inicial con:

```sh
npm run verify:deployment -- https://mendezmariano.github.io/marianomendez.ar/
```
