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

## Delegar el dominio

1. Creá una zona para `marianomendez.ar` en tu proveedor de DNS.
2. Cargá los registros de la tabla siguiente en esa zona.
3. Copiá los servidores de nombres que te asigne el proveedor.
4. Antes de activar la delegación, guardá `www.marianomendez.ar` como dominio personalizado en **Settings > Pages** de GitHub.
5. En NIC Argentina, delegá `marianomendez.ar` a esos servidores.

| Tipo | Nombre | Valor |
| --- | --- | --- |
| CNAME | `www` | `mendezmariano.github.io` |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

Si el proveedor ofrece proxy HTTP, usá el modo de DNS sin proxy durante la configuración. El CNAME apunta al usuario de GitHub y no incluye el nombre del repositorio. Con ambos nombres configurados, GitHub redirige `marianomendez.ar` al dominio principal `www.marianomendez.ar`.

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
