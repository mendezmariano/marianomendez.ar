# Referencias visuales del laboratorio

La revisión usa las 20 imágenes y el video de `resourses/imagenes/`. El video mide 960 × 720, dura 4384,83 segundos y tiene 30 fotogramas por segundo. Se revisaron 12 momentos distribuidos entre los segundos 5 y 1800, más secuencias cortas alrededor de 119,5 y 598,8 segundos. Es un muestreo, no una revisión completa del video.

## Colores observados

Las referencias contienen interiores con muchos tonos y sombras, además del personaje de baja resolución. La paleta anterior de 16 colores EGA limitaba los materiales y la piel. El nuevo dibujo toma como base los interiores cálidos y las máquinas grises de estas capturas.

El analizador reduce cada imagen a 16 colores representativos mediante median cut. Recorta el 70 % superior de las capturas apaisadas para reducir la influencia de los verbos. El negro aún ocupa una parte importante por los márgenes y las sombras; su frecuencia no representa la proporción de paredes negras.

| Referencia | Colores representativos | Aplicación |
| --- | --- | --- |
| `full20040411111248.gif` | `#b99454`, `#744912`, `#8e7142`, `#e7e0c0`, `#cbb374`, `#638972` | Paneles, madera, molduras y verde apagado |
| `zak_fmtowns_en_1_4_full.png` | `#a9a8a7`, `#2d2f2f`, `#757472`, `#60635e`, `#e1ddd0` | Carcasas y sombras de los equipos |
| `full20120904080317.png` | `#975129`, `#812b17`, `#bf7d5c`, `#eecaaa`, `#7e716a` | Terracota, piel y piso |
| `Pasted image.png` | `#4b6c89`, `#b1daee`, `#79b4c8` | Ventana, vidrio y detalles fríos |

La [paleta seleccionada](palette-preview.png) corresponde a `PALETTE` en `dist/scene.js` y contiene 40 colores base. Incluye colores muestreados y otros añadidos para la bata, la piel y el contraste. Los bordes suavizados producen tonos intermedios. Las capturas originales no forman parte de los archivos publicados en `dist/`.

## Tipos de personajes y proporciones

Las imágenes muestran protagonistas delgados con camisa azul y pantalón oscuro, personajes con sombrero y ropa verde, figuras con trajes azules o violetas, adultos de torso más ancho y humanoides de silueta alargada. Los colores de la ropa y la silueta permiten distinguirlos sin depender de detalles pequeños.

En `Pasted image.png`, la figura ocupa aproximadamente desde la fila 28 hasta la 178. La cabeza con sombrero ocupa cerca de un tercio de esa altura. En otras capturas, la cabeza parece más cercana a un cuarto del cuerpo. Son estimaciones visuales sobre imágenes escaladas, no medidas de los sprites originales.

Mariano conserva una silueta delgada, piernas largas y una cabeza de aproximadamente un tercio de la altura. El dibujo mide unas 126 unidades antes de aplicar la pequeña variación de escala por profundidad. La bata blanca tiene solapas, bolsillo, botones y sombras frías. El archivo `e56c1aa6-3e9f-4d03-8399-2e8f889819e7_1280x720.webp` aporta la referencia explícita de anteojos negros, nariz prominente y bigote.

La corrección posterior usa también las cuatro imágenes adjuntas de cara, perfil, espalda y frente con máscara. La [hoja de personaje](character-preview.png) muestra cabello castaño y una mandíbula angular, con la máscara dibujada como accesorio independiente. Los marcos cuadrados, las cejas postizas, la nariz larga y el bigote ancho tienen contornos propios. La vista de espalda conserva las patillas y una banda de sujeción, sin dibujar el rostro a través de la cabeza.

## Movimiento observado y adaptación

Entre 119,5 y 120,6 segundos se observa el cambio de espalda a perfil y luego a frente. Entre 598,8 y 600,2 segundos se ve una caminata hacia la derecha mientras el fondo se desplaza. Las piernas alternan apoyo y flexión, los brazos compensan el paso y la cabeza tiene poco desplazamiento vertical.

El [estudio detallado del movimiento](movement-study.md) compara otros 156 fotogramas con el código del blog. La caminata usa ahora un ciclo de 96 unidades a 150 unidades por segundo, unos 0,64 segundos por ciclo. El pie apoyado retrocede respecto del cuerpo a la misma velocidad que este avanza. La pierna libre se recoge, flexiona la rodilla y vuelve hacia delante. Los brazos acompañan en oposición y el torso oscila sin mover el pie apoyado. La velocidad visible en profundidad se reduce al 45 % de la lateral.

Estas constantes adaptan el video a las dimensiones del laboratorio; no son parámetros extraídos del motor del juego. La animación se detiene al dejar de caminar. La dirección principal del desplazamiento elige entre frente, espalda y ambos perfiles. La vista inicial es frontal y el saludo mantiene esa orientación al terminar.

El saludo es una acción nueva. Dura 2,6 segundos: Mariano mira al visitante, eleva el brazo, mueve la mano y vuelve al reposo. El texto se dirige a quien está frente a la pantalla. Con movimiento reducido se conserva una pose fija y el mensaje.

## Cámara y verbos

Se compararon dos formas de recorrer el laboratorio:

| Esquema | Consecuencia |
| --- | --- |
| Canvas ancho dentro de un contenedor con `scrollLeft` | El navegador controla el desplazamiento; el seguimiento y la escala deben coordinarse con el desplazamiento del elemento. |
| Vista fija y cámara con posición propia | Los dibujos y los botones comparten coordenadas del mundo. Los clics suman la posición de la cámara y el seguimiento se prueba sin navegador. |

Se eligió la cámara independiente. La vista lógica mide 768 × 352; el mundo mide 1536 × 352. El dibujo se rasteriza al doble de resolución. Los botones laterales, el rango, el arrastre sobre el fondo y la rueda horizontal mueven la cámara. Las flechas sobre la escena mueven al personaje, y la cámara lo sigue cuando llega al margen.

Para los verbos se comparó una selección persistente de ambos con una descripción de un solo uso y un saludo inmediato. La segunda opción permite saludar al visitante sin obligarlo a elegir un objeto. Mirar consume la selección después del clic; el clic directo siguiente vuelve a usar las terminales.

`world.js` posee el movimiento, el saludo, los límites y la cámara. `gait.js` define el ciclo, el apoyo de los pies y las articulaciones. `app.js` convierte los eventos del usuario en acciones y mantiene los botones HTML sobre el dibujo. `scene.js` representa ese estado. El saludo cancela destinos pendientes para evitar que se abra una terminal al terminar de saludar.

## Verificación

Las pruebas cubren la cancelación de acciones, el saludo, los límites de ambas alas, el seguimiento y la conversión de clics a distintos tamaños. Las pruebas de interacción cargan `app.js` con dobles de DOM y canvas. Los renders SVG proceden de las operaciones de dibujo reales y se revisan como imágenes.

No hubo navegador conectado durante esta revisión. Los renders no verifican el diseño HTML completo ni sustituyen una prueba manual de ratón, teclado y táctil. Los cambios quedan en local y requieren autorización explícita antes de publicarse.
