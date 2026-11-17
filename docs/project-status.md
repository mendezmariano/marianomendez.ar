# Estado del proyecto

Actualizado el 17 de noviembre de 2026. La tabla de verificación del 6 de noviembre se conserva como registro de la revisión de movimiento.

El Laboratorio funciona como un blog interactivo en español. Se publicó en GitHub Pages desde el repositorio [mendezmariano/marianomendez.ar](https://github.com/mendezmariano/marianomendez.ar). GitHub tiene asociado `www.marianomendez.ar` como dominio principal, con acceso HTTP verificado y certificado HTTPS pendiente en la consulta del 13 de noviembre. La vista local se inicia con `npm run dev` en <http://127.0.0.1:4173/>. La última revisión local incorpora la importación automática del currículum desde Word.

El 12 de noviembre se publicó el commit `686b6f7` mediante [GitHub Actions](https://github.com/mendezmariano/marianomendez.ar/actions/runs/43283819704). Las 44 pruebas pasan y los siete renders se generan correctamente. La verificación por HTTPS confirmó que los 10 archivos del sitio coinciden con `dist/`. El navegador de verificación no estaba disponible.

El dominio está registrado, según confirmó el usuario. La zona de Cloudflare usa `sandy.ns.cloudflare.com` y `titan.ns.cloudflare.com`, verificados anteriormente en ambos servidores. El 13 de noviembre `www.marianomendez.ar` resolvió hacia `mendezmariano.github.io` y las direcciones de GitHub Pages. GitHub informa el dominio como verificado, sin certificado HTTPS asignado. La comprobación HTTPS falla porque el certificado servido no incluye `www.marianomendez.ar`; el contenido se verificó por HTTP. La [guía de publicación](github-pages.md) conserva los pasos de configuración, el [archivo de importación DNS](cloudflare-dns.txt) y la comprobación de archivos publicados.

La revisión interactiva en navegador y los artículos definitivos siguen pendientes. Cada publicación web, incluso privada, requiere autorización explícita del usuario.

## Importación automática del CV

Cambio incorporado el 15 de noviembre y autorizado para publicación por el usuario el 17 de noviembre: `npm run dev` importa el Word de `cv/` al iniciar y después de cada guardado o reemplazo. `npm run build`, `npm test` y `npm run check` también generan `dist/content.js` desde el documento. El original actual, `cv_bolg.doc`, contiene Word moderno con extensión `.doc`.

La terminal permite leer siete secciones mediante botones y comandos. Los 223 párrafos importados conservan el texto profesional del Word; se comprobó cada sección contra su XML original. La fecha del CV es 13/11/2026. Se omiten encabezados repetidos, campos `null` aislados y, con la política predeterminada, los datos personales. Se conserva el correo marcado como laboral. La política se configura en `cv/import.json`.

El documento original queda fuera de Git y de `dist/`. GitHub Actions usa el perfil generado, ejecuta `npm run build:posts` y `npm run check:dist`. Una actualización local del Word no dispara una publicación.

Verificación: 56 pruebas aprobadas, incluidas la lectura de Word, las sustituciones al guardar, los errores que conservan la versión anterior y los comandos del CV. También pasan las 56 pruebas en una copia que reproduce el flujo de GitHub Actions sin el Word original. La página, el módulo generado y la aplicación coinciden por HTTP local con `dist/`; la URL del Word original devuelve 404. La revisión interactiva sigue pendiente porque no hay navegador conectado.

## Libro de memoria virtual

El 13 de noviembre se incorporó un libro dorado "Memoria virtual" en la segunda repisa de la biblioteca. Abre <https://mendezmariano.github.io/memoria-virtual/> en otra pestaña. El enlace es HTML y se puede activar con teclado. Mirar describe el libro sin abrir el enlace. El usuario autorizó su publicación en GitHub Pages.

El commit `d3a5306` se publicó mediante [GitHub Actions](https://github.com/mendezmariano/marianomendez.ar/actions/runs/43535252417), con las etapas de comprobación y despliegue aprobadas. `npm run verify:deployment -- http://www.marianomendez.ar/` confirmó que los 10 archivos publicados coincidían con `dist/` por SHA-256.

Ajuste posterior autorizado por el usuario: el libro muestra únicamente un lomo dorado entre los demás libros. El título "Memoria virtual" aparece al pasar el cursor o al enfocar el enlace con el teclado.

El ajuste se publicó en el commit `f656bdc` mediante [GitHub Actions](https://github.com/mendezmariano/marianomendez.ar/actions/runs/43537931372). El despliegue finalizó correctamente y la comparación por HTTP confirmó que los 10 archivos publicados coinciden con `dist/`.

Verificación: `npm run check` aprueba las 47 pruebas y `node scripts/render-scene.mjs` genera las siete vistas con coordenadas y colores válidos. Las tres pruebas nuevas cubren el enlace, la cancelación de una visita pendiente a una terminal, Mirar y la separación de los controles de cámara y teclado. No hay navegador conectado para comprobar la interacción real.

## Funciones implementadas

| Área | Estado actual |
| --- | --- |
| Encabezado | Muestra únicamente "El Laboratorio", con espacio compacto. Los mensajes aparecen dentro de la escena. |
| Laboratorio | Biblioteca, clúster, terminales, pizarra, planta y mesa de experimentos. La cámara recorre la habitación hacia ambos lados. |
| Personaje | Bata blanca, pelo castaño y máscara con anteojos negros cuadrados, cejas postizas, nariz larga y bigote ancho. Tiene frente, espalda y ambos perfiles. |
| Caminata | Clic en el suelo o flechas con la escena enfocada. La orientación sigue el desplazamiento. Las rodillas flexionan y los brazos acompañan a la pierna contraria. El pie de apoyo permanece fijo durante el paso lateral. |
| Mirar y Saludar | Mirar describe el siguiente objeto elegido. Saludar cancela el destino pendiente, vuelve al personaje hacia el visitante y mueve la mano. |
| Cámara | Botones laterales, barra de posición, arrastre horizontal, trackpad y Shift + rueda. El desplazamiento manual permite explorar sin mover al personaje. |
| Lectura | Terminal de bitácora, lector de artículos y currículum en formato terminal. Los accesos directos abren los contenidos sin esperar la caminata. |
| Accesibilidad y sonido | Controles HTML, navegación con teclado, cierre con Escape y respeto de movimiento reducido. El sonido es opcional y comienza desactivado. |

## Base técnica

El sitio usa HTML, CSS y módulos JavaScript nativos. `dist/` contiene todo lo necesario para servirlo. Requiere Node.js 20 o posterior para las herramientas locales, con herramientas de generación instaladas mediante `npm ci`. `npm run build` prepara los artículos e importa el CV con Mammoth. El sitio generado no tiene dependencias de ejecución ni necesita Node.js en el alojamiento.

La vista lógica mide 768 × 352 unidades y el laboratorio tiene 1536 unidades de ancho. El canvas visible mide 1536 × 704 píxeles. El dibujo usa 40 colores base y contornos suavizados.

| Archivo | Responsabilidad |
| --- | --- |
| `content/posts/*.md` | Fuentes de los artículos, un archivo por entrada. |
| `dist/posts.js` | Artículos generados para el navegador. |
| `dist/content.js` | Perfil generado desde el CV. No se edita a mano. |
| `cv/` | Última versión del CV proporcionada por Mariano y política de importación. El Word original es local. |
| `scripts/cv.mjs` | Importación del Word de CVar y observación de cambios. |
| `dist/world.js` | Posición, destinos, orientación, saludo, límites y cámara. |
| `dist/gait.js` | Ciclo de pasos, apoyo de pies y articulaciones. |
| `dist/scene.js` | Dibujo del laboratorio y del personaje. |
| `dist/app.js` | Eventos, acciones, ventanas de lectura y sonido. |
| `dist/index.html` y `dist/style.css` | Controles, estructura y presentación de la página. |
| `scripts/` y `tests/` | Servidor local, análisis de referencias, renders y pruebas. |

El movimiento está limitado al pasillo frente al mobiliario. La bitácora se edita en archivos. No hay panel de administración, servidor de contenidos ni conexión real al clúster ilustrado.

## Artículos Markdown

Cada artículo se incorpora copiando la plantilla `content/post-template.md` a `content/posts/`. El generador valida el título, la categoría, la fecha opcional y la marca de ejemplo. Calcula el tiempo de lectura y prepara el contenido para la terminal. Los tres ejemplos conservan sus textos originales.

`npm run dev` observa altas, cambios y eliminaciones de Markdown. Después de guardar, se recarga el navegador para ver el resultado. Un archivo inválido informa un error y conserva la última versión válida. `npm run build` genera `dist/posts.js` para alojamiento estático.

Verificación del 7 de noviembre: 44 pruebas aprobadas con `npm run check`, incluidas conversión Markdown, metadatos, enlaces, actualización automática, recuperación tras errores y navegación del lector con dobles de DOM. También se comprobó por HTTP local que la página y el módulo con los tres artículos responden correctamente. No había navegador conectado; la revisión visual y de teclado en navegador sigue pendiente.

## Revisión de movimiento y estado de Git

El checkout local de origen conserva el commit `6b9fbdb`, `Improve laboratory artwork and exploration`. El repositorio de publicación recibe una copia del sitio actual, con estos cambios posteriores:

- Nuevo módulo `dist/gait.js` y ajustes de movimiento y dibujo en `world.js` y `scene.js`.
- Análisis de 156 fotogramas de cuatro tramos del video, con hojas de referencia y comparación animada.
- Scripts para repetir el análisis y renderizar la caminata, contexto SVG compartido y vistas del personaje actualizadas.
- Siete pruebas nuevas de caminata, además de las 29 existentes, y documentación de esta revisión.

La velocidad lateral es de 150 unidades por segundo. Un ciclo completo de pasos recorre 96 unidades y dura 0,64 segundos. El movimiento visible en profundidad usa el 45 % de la velocidad lateral. Son ajustes para el laboratorio, no parámetros extraídos del motor del juego.

El [informe de movimiento](movement-study.md) registra los tramos examinados, las mediciones y la diferencia entre observaciones del video y decisiones de implementación.

## Verificación registrada

Los comandos se ejecutan desde `mendez-lab/`.

| Comprobación | Resultado del 6 de noviembre de 2026 |
| --- | --- |
| `npm run check` | 36 pruebas aprobadas, sin fallos. Cuatro referencias locales presentes y sintaxis JavaScript válida. |
| `node scripts/render-scene.mjs` | Exportación correcta a `/tmp/mendez-lab-art/`. Coordenadas y colores declarados válidos para las siete vistas. |
| Petición HTTP a `http://127.0.0.1:4173/` | Respuesta `200 OK`. El servidor escucha únicamente en la máquina local. |
| Revisión interactiva en navegador | Pendiente. Las pruebas de interacción usan dobles de DOM y canvas. Los renders no sustituyen esta comprobación. |

`npm run dev` inicia el servidor local. La [guía de ejecución y uso](../README.md) contiene los controles y los comandos de análisis. El servidor necesita permanecer en ejecución para que la dirección local responda.

## Pendientes

1. Revisar en navegador de escritorio y móvil la caminata, los giros, el saludo y el desplazamiento de cámara. Comprobar las terminales, el foco de teclado y el sonido.
2. Validar visualmente el personaje y la máscara con el usuario. La revisión automática no confirma la semejanza con las referencias.
3. Reemplazar los tres posts de ejemplo en `content/posts/` y publicar la importación automática del CV cuando el usuario la autorice.
4. Completar el certificado HTTPS del dominio personalizado en GitHub Pages. El DNS y el acceso HTTP se comprobaron el 13 de noviembre de 2026.

## Referencias visuales

- [Biblioteca con el libro de memoria virtual](west-preview.png).
- [Vista central del laboratorio](scene-preview.png).
- [Frente, espalda y perfiles del personaje](character-preview.png).
- [Poses de caminata y saludo](walk-preview.png).
- [Comparación animada con el commit anterior](movement-comparison.gif).
- [Fotogramas laterales del video](movement-reference.png).
- [Estudio de paleta, proporciones y referencias](reference-study.md).

Las imágenes del sitio y la comparación animada son renders del código. La hoja de fotogramas procede del video de `resourses/imagenes/`.
