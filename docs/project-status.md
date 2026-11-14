# Estado del proyecto

Actualizado el 13 de noviembre de 2026. La tabla de verificación del 6 de noviembre se conserva como registro de la revisión de movimiento.

El Laboratorio funciona como un blog interactivo en español. Se publicó en GitHub Pages desde el repositorio [mendezmariano/marianomendez.ar](https://github.com/mendezmariano/marianomendez.ar). GitHub tiene asociado `www.marianomendez.ar` como dominio principal, con el acceso por ese dominio pendiente del DNS. La vista local se inicia con `npm run dev` en <http://127.0.0.1:4173/>. La última revisión incorpora artículos desde archivos Markdown.

El 12 de noviembre se publicó el commit `686b6f7` mediante [GitHub Actions](https://github.com/mendezmariano/marianomendez.ar/actions/runs/43283819704). Las 44 pruebas pasan y los siete renders se generan correctamente. La verificación por HTTPS confirmó que los 10 archivos del sitio coinciden con `dist/`. El navegador de verificación no estaba disponible.

El dominio está registrado, según confirmó el usuario. La zona de Cloudflare usa `sandy.ns.cloudflare.com` y `titan.ns.cloudflare.com`, verificados directamente en ambos servidores. La última consulta no encontró los cuatro registros A ni el CNAME de `www`, y la resolución pública todavía devuelve `NXDOMAIN`. Falta importar los registros y completar la delegación en NIC Argentina. GitHub Pages ya tiene asociado el dominio y espera poder emitir el certificado HTTPS. La [guía de publicación](github-pages.md) reúne los pasos, el [archivo de importación DNS](cloudflare-dns.txt) y la comprobación de archivos publicados.

La revisión interactiva en navegador y los contenidos definitivos siguen pendientes. Cada publicación web, incluso privada, requiere autorización explícita del usuario.

## Libro de memoria virtual

El 13 de noviembre se incorporó un libro dorado "Memoria virtual" en la segunda repisa de la biblioteca. Abre <https://mendezmariano.github.io/memoria-virtual/> en otra pestaña. El enlace es HTML y se puede activar con teclado. Mirar describe el libro sin abrir el enlace. El usuario autorizó su publicación en GitHub Pages.

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

El sitio usa HTML, CSS y módulos JavaScript nativos. `dist/` contiene todo lo necesario para servirlo. Requiere Node.js 20 o posterior para las herramientas locales, con herramientas de generación instaladas mediante `npm ci`. `npm run build` prepara los artículos. El sitio generado no tiene dependencias de ejecución ni necesita Node.js en el alojamiento.

La vista lógica mide 768 × 352 unidades y el laboratorio tiene 1536 unidades de ancho. El canvas visible mide 1536 × 704 píxeles. El dibujo usa 40 colores base y contornos suavizados.

| Archivo | Responsabilidad |
| --- | --- |
| `content/posts/*.md` | Fuentes de los artículos, un archivo por entrada. |
| `dist/posts.js` | Artículos generados para el navegador. |
| `dist/content.js` | Datos del currículum. |
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
3. Reemplazar los tres posts de ejemplo en `content/posts/` y completar formación, experiencia, publicaciones y contacto con datos reales en `dist/content.js`.
4. Completar la delegación DNS y la configuración del dominio personalizado en GitHub Pages. La publicación actual fue solicitada por el usuario el 12 de noviembre de 2026.

## Referencias visuales

- [Biblioteca con el libro de memoria virtual](west-preview.png).
- [Vista central del laboratorio](scene-preview.png).
- [Frente, espalda y perfiles del personaje](character-preview.png).
- [Poses de caminata y saludo](walk-preview.png).
- [Comparación animada con el commit anterior](movement-comparison.gif).
- [Fotogramas laterales del video](movement-reference.png).
- [Estudio de paleta, proporciones y referencias](reference-study.md).

Las imágenes del sitio y la comparación animada son renders del código. La hoja de fotogramas procede del video de `resourses/imagenes/`.
