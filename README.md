# El laboratorio del Dr. Mariano Mendez

Un blog en español que se recorre como una aventura gráfica de estética retro. El Dr. Mendez camina por un laboratorio de ciencias de la computación con un clúster, terminales y objetos para explorar.

El [estado del proyecto](docs/project-status.md), actualizado el 7 de noviembre de 2026, reúne las funciones implementadas, la verificación y los pendientes.

## Ejecutar

Requiere Node.js 20 o posterior. Instalá las herramientas para generar los artículos con `npm ci`. El navegador no necesita estas dependencias.

```sh
npm ci
npm run dev
```

Abrí `http://127.0.0.1:4173`. Para cambiar el puerto, usá `PORT=8080 npm run dev`. El servidor escucha únicamente en la máquina local.

El repositorio de publicación es [mendezmariano/marianomendez.ar](https://github.com/mendezmariano/marianomendez.ar). La [guía de GitHub Pages](docs/github-pages.md) explica la publicación automática, la delegación del dominio `www.marianomendez.ar` y su verificación.

El sitio está completo en `dist/` y se puede servir desde cualquier alojamiento estático. `npm run build` prepara los artículos antes de copiar o publicar esa carpeta. `npm start` sirve la versión ya generada sin observar cambios. `.openai/hosting.json` conserva la identidad y la configuración de Sites.

## Explorar

- Hacé clic en el suelo o enfocá la escena y usá las flechas para caminar. Izquierda y derecha muestran el perfil; arriba muestra la espalda; abajo, el frente.
- Recorré el laboratorio con los botones laterales, la barra de posición, el arrastre horizontal sobre el fondo, el trackpad o Shift + rueda.
- Seleccioná Mirar y después un objeto para leer su descripción.
- Pulsá Saludar para que Mariano se vuelva hacia vos y te salude con la mano.
- Hacé clic en la terminal central para leer la bitácora.
- Usá la computadora de la derecha para abrir el currículum en formato terminal.
- Hacé clic en el clúster, la pizarra o la planta para conocer sus detalles.
- Los accesos directos permiten leer sin esperar la caminata.
- Usá Tab y Enter para navegar con teclado. Escape cierra las ventanas.

El audio comienza desactivado y se genera en el navegador. La preferencia de movimiento reducido abre los destinos sin caminata, detiene las animaciones ambientales y muestra una pose de saludo fija.

El clic directo sobre las terminales abre sus contenidos. Mirar se aplica una sola vez al objeto elegido. Saludar se ejecuta inmediatamente y cancela la caminata pendiente.

## Contenidos y personaje

Cada artículo es un archivo Markdown en `content/posts/`. Para agregar uno:

1. Copiá `content/post-template.md` a `content/posts/mi-articulo.md`.
2. Editá el título y el cuerpo del archivo. Usá minúsculas, números y guiones en el nombre, con extensión `.md`.
3. Con `npm run dev` activo, guardá el archivo y recargá el navegador. La terminal informa cuando la bitácora se actualiza.

````md
---
title: "Pensar en paralelo"
category: "Sistemas distribuidos"
date: 2026-11-07
---

Una introducción con **negritas** y *cursivas*.

## Una tarea, muchas máquinas

- Primera idea.
- Segunda idea.

> Una observación.

[Un enlace](https://example.com)

```js
console.log('Hola, mundo');
```
````

`title` es obligatorio. `category` es opcional y vale `Notas` por defecto. `date` es opcional, con formato `AAAA-MM-DD`. Los artículos fechados aparecen del más reciente al más antiguo; los demás se ordenan por nombre. Los empates de fecha también se ordenan por nombre. `example: true` identifica una entrada de muestra; si lo omitís, el artículo se presenta como contenido propio. Esos son los únicos campos admitidos.

El nombre del archivo identifica al artículo. El tiempo de lectura se calcula a 200 palabras por minuto, con un mínimo de un minuto. El cuerpo admite títulos, listas, citas, enlaces, imágenes y bloques de código. El título del artículo ya aparece en el lector, por lo que podés comenzar el cuerpo con una introducción.

Para incorporar una imagen, guardala en `dist/assets/posts/` y referenciala así:

```md
![Descripción de la imagen](assets/posts/mi-imagen.png)
```

Las rutas son relativas a la página del sitio, no al archivo Markdown. Se admiten enlaces relativos, HTTP, HTTPS y correo. El HTML incrustado se muestra como texto y los enlaces con protocolos ejecutables no se activan. Los bloques de código conservan el formato, sin resaltado de sintaxis.

Agregar, editar o eliminar un `.md` actualiza la bitácora durante `npm run dev`. Ante un error se informa el archivo y se conserva la última generación válida. Corregí el archivo y guardalo otra vez. Si hay un error al iniciar, corregilo y volvé a ejecutar `npm run dev`.

Fuera del servidor de desarrollo, ejecutá `npm run build` para regenerar `dist/posts.js`. Ese módulo es generado: editá siempre los Markdown. La carpeta `dist/` sigue siendo suficiente para alojar el sitio; no necesita Node.js en el servidor web.

Editá `dist/content.js` para completar el currículum.

Los tres posts incluidos están marcados como ejemplos. El currículum tiene campos pendientes; no contiene credenciales ni experiencia inventadas. El encabezado muestra únicamente "El Laboratorio". Los mensajes aparecen sobre la escena y el control de sonido queda debajo.

La habitación y el personaje usan 40 colores base derivados de las referencias, con tonos adicionales para piel y bata. El suavizado añade colores intermedios en los bordes. Mariano tiene una silueta alta y delgada, bata blanca, pelo castaño y una máscara con marcos negros cuadrados, cejas postizas, nariz larga y bigote ancho. El [modelo del personaje](docs/character-preview.png) muestra frente, espalda y ambos perfiles. La caminata avanza según la distancia recorrida, con apoyo fijo del pie, flexión de rodillas y brazos en oposición. El movimiento hacia el fondo es más lento en pantalla. Su dibujo está en `drawCharacter`, dentro de `dist/scene.js`.

## Organización y decisiones

- `dist/index.html` y `style.css`: interfaz adaptable, botones accesibles y ventanas de lectura.
- `dist/scene.js`: arte original de la habitación, personaje y animaciones. La vista lógica mide 768 × 352; el canvas mide 1536 × 704 para suavizar el dibujo. El mundo tiene 1536 unidades de ancho.
- `dist/world.js`: posición del personaje, saludo, límites del suelo, destinos y cámara horizontal.
- `dist/gait.js`: ciclo de apoyo y avance, articulaciones y proporción de movimiento en profundidad.
- `dist/app.js`: clics, teclado, audio y presentación de contenidos.
- `content/posts/`: artículos Markdown. `content/post-template.md`: plantilla para nuevos artículos.
- `dist/posts.js`: artículos generados, sin dependencias para el navegador.
- `dist/content.js`: datos del perfil.
- `scripts/posts.mjs`: validación, conversión Markdown y observación de archivos.
- `scripts/`: servidor, verificación y generador de la tipografía pixelada original.
- `tests/`: pruebas de movimiento y estructura de contenido con `node:test`.

Al seleccionar una terminal, `app.js` solicita un destino mediante `walkTo`. `stepCharacter` actualiza la posición y comunica la llegada una sola vez. Entonces se abre el contenido. Una nueva orden reemplaza el destino pendiente. Las acciones distinguen Mirar de usar una terminal. La cámara sigue al personaje cuando camina; el desplazamiento manual detiene la caminata y permite mirar otras zonas sin moverlo.

Se eligió canvas para el dibujo y HTML para controles y lectura. Una interfaz totalmente dibujada en canvas dificultaría la navegación con teclado y la selección de texto. Una habitación formada por elementos HTML complicaría el dibujo de píxeles y las animaciones del personaje.

## Verificar

```sh
npm run check
```

Primero genera los artículos. Después verifica referencias locales, sintaxis JavaScript, conversión Markdown, metadatos, actualización al guardar, movimiento, saludo, cámara, clics con desplazamiento y respuestas del servidor estático. Las pruebas de `interactions.test.js` ejecutan los eventos de `app.js` con dobles de DOM y canvas; no sustituyen una revisión en navegador. `npm test` también regenera los artículos antes de ejecutar las pruebas.

Para una revisión visual, abrí la página en escritorio y móvil. Probá ambas terminales, el regreso al listado, los comandos del CV, Escape, el foco del teclado y el sonido opcional.

La fuente ya está incluida. Para regenerarla, instalá `fonttools[woff]` en un entorno Python y ejecutá `python3 scripts/generate-font.py`.

`node scripts/render-scene.mjs` exporta las vistas oeste, central y este, el saludo, las cuatro orientaciones y la caminata a `/tmp/mendez-lab-art/`. Comprueba coordenadas finitas, tamaños válidos y colores declarados. Los renders se obtienen de las mismas operaciones de dibujo que usa el sitio. La [vista central](docs/scene-preview.png), la [caminata y el saludo](docs/walk-preview.png) y la [vista del saludo](docs/greeting-preview.png) son renders del arte, no capturas del navegador.

Para analizar otra vez las referencias, instalá las herramientas opcionales de autoría. El sitio no las necesita para funcionar. Requieren Python 3, FFmpeg y FFprobe disponibles en el sistema.

```sh
python3 -m venv /tmp/mendez-lab-art-venv
/tmp/mendez-lab-art-venv/bin/pip install -r scripts/requirements-artwork.lock
/tmp/mendez-lab-art-venv/bin/python scripts/analyze-references.py
```

El analizador conserva los originales de `../resourses/imagenes/` y escribe paletas, dimensiones, muestras del video y una secuencia de caminata en `/tmp/mendez-lab-references/`. `--source`, `--output` y `--motion-start` permiten cambiar las rutas y el inicio de la secuencia. El [estudio de referencias](docs/reference-study.md) registra los colores seleccionados y las proporciones observadas.

Para repetir el análisis detallado del video, ejecutá `python3 scripts/analyze-motion.py` con las mismas herramientas opcionales. Exporta 156 fotogramas, hojas de comparación y mediciones de cámara en `/tmp/mendez-motion-analysis/`. El [informe de movimiento](docs/movement-study.md) distingue lo observado de los valores elegidos para el blog.

Para exportar una animación del código actual, ejecutá `python3 scripts/render-motion.py`. Requiere Pillow e ImageMagick con el comando `convert`. Para comparar con un checkout anterior, agregá `--before /ruta/al/checkout`. El resultado queda en `/tmp/mendez-motion-render/`. La [comparación guardada](docs/movement-comparison.gif) usa el commit `6b9fbdb` como versión anterior y es un render del personaje, no una grabación del navegador.

Antes de publicar cualquier versión web, incluso privada, pedí autorización explícita al usuario. La vista local no autoriza una publicación.

## Alcance actual

El movimiento se limita al pasillo frente al mobiliario. El clúster es parte de la escena, no una conexión a equipos reales. La bitácora se edita en archivos; no incluye un panel de publicación ni un servidor de contenidos.
