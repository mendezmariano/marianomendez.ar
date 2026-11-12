# Movimiento del video y del blog

La caminata anterior tenía piernas casi rectas y pies que se deslizaban hacia delante durante el apoyo. La nueva animación separa apoyo y avance, flexiona las rodillas y mantiene el pie apoyado en un punto del suelo. La [comparación animada](movement-comparison.gif) muestra el código del commit `6b9fbdb` arriba y el ajustado abajo. Es un render de los módulos del sitio, no una captura del navegador.

## Tramos examinados

El archivo de referencia es `ZAK MCKRACKEN Adventure Game Gameplay Walkthrough - No Commentary Playthrough(1).mp4`. El análisis detallado añade 156 fotogramas a la revisión anterior, muestreados a los 30 fotogramas por segundo del archivo.

| Intervalo en segundos | Fotogramas | Observación |
| --- | --- | --- |
| 598,8 a 600,1 | 39 | Perfil hacia la derecha, con seguimiento de cámara. Se distinguen apertura, apoyo, paso bajo el cuerpo y avance de la pierna libre. |
| 1199,8 a 1200,9 | 33 | Perfil hacia la izquierda y parada. El personaje termina de caminar antes de girar hacia la terminal. |
| 118,8 a 120,3 | 45 | Reposo de espaldas, paso de perfil y reposo frontal. El giro cambia la orientación sin hacer girar toda la habitación. |
| 1801,0 a 1802,3 | 39 | Otro personaje, más pequeño, que camina lateralmente mientras la cámara sigue su posición. |

La [hoja de fotogramas laterales](movement-reference.png) conserva las marcas de tiempo. Los intervalos se revisaron como secuencias consecutivas y como hojas de contacto. No se analizó el video completo.

## Diferencias que explicaban el movimiento

| Aspecto | Video observado | Blog anterior | Corrección |
| --- | --- | --- | --- |
| Rodilla | Se adelanta mientras el pie libre se recoge. | Su posición era una interpolación casi recta entre cadera y pie. | Articulación de dos segmentos que conserva la longitud del muslo y la pierna. |
| Pie apoyado | El cuerpo pasa por encima del pie. | El pie avanzaba con el cuerpo y añadía una oscilación horizontal. | Durante la mitad de apoyo, el pie retrocede respecto del cuerpo exactamente lo que este avanza. |
| Apertura | Las piernas abarcan cerca de la mitad de la altura del personaje en las poses abiertas. | La amplitud horizontal era de 12 unidades por pierna, con una separación mucho menor. | Recorrido de 48 unidades entre los extremos del pie, más la longitud del zapato. |
| Pie libre | Se recoge primero y luego se adelanta. | Subía poco y seguía una oscilación simétrica. | Trayectoria elevada de hasta 10 unidades, con el avance concentrado hacia el final. |
| Brazos | El brazo acompaña en oposición a la pierna del mismo lado. | Oscilación pequeña y codos casi fijos. | Movimiento de hombro, codo y mano, con hasta 13 unidades de recorrido respecto de la posición de reposo. |
| Cuerpo | La cabeza permanece relativamente estable. | El desplazamiento vertical se aplicaba también a ambos pies. | Oscila el torso y cambia la posición de la cadera; el pie de apoyo conserva la altura del suelo. |
| Parada | Se vuelve a una pose de reposo. | La fase anterior podía reaparecer a mitad de un paso al reiniciar. | Reposo con ambos pies apoyados y reinicio desde el contacto. |

## Ritmo y desplazamiento

En las imágenes laterales se repiten poses similares aproximadamente cada 0,6 a 0,7 segundos. La grabación tiene 30 fotogramas por segundo, pero contiene varios fotogramas consecutivos con una misma pose. No corresponde interpretar cada fotograma del archivo como una pose distinta.

El análisis de franjas estáticas del fondo encontró 12 cambios horizontales de 24 píxeles entre 39 fotogramas. Suman 288 píxeles en los 38 intervalos, una velocidad media de cámara de 227,37 píxeles por segundo. Es una medición del fondo. La posición casi estable del personaje durante ese seguimiento permite usarla como aproximación de su avance, no como una medición directa de sus coordenadas dentro del juego.

El personaje de ese recorte tiene aproximadamente 190 a 195 píxeles de altura. La relación entre desplazamiento y tamaño resulta cercana a 1,2 alturas por segundo. El blog se ajustó a 150 unidades por segundo y unas 126 unidades de altura. Un ciclo de 96 unidades dura 0,64 segundos a esa velocidad.

El 45 % de velocidad visible en profundidad es una adaptación al pasillo del laboratorio. No se obtuvo del juego. La fase compensa esa proporción para conservar el ritmo de los pasos. La interpolación sigue siendo continua para mantener los contornos suaves solicitados.

## Verificación

En una simulación de 15 pasos de 0,02 segundos, el pie que debía estar apoyado recorrió 31,28 píxeles horizontales en la versión anterior. Con la nueva trayectoria, su posición mundial permaneció constante. Esta comparación usa las fórmulas y los estados reales de ambas versiones.

Las pruebas verifican el apoyo hacia izquierda, derecha, frente y fondo, incluso al cambiar la escala por profundidad. También comprueban que siempre exista un pie de apoyo, que los segmentos de las piernas no se estiren, que el brazo acompañe a la pierna contraria y que el ciclo conserve su duración a 30, 60 y 120 actualizaciones por segundo. Saludar y movimiento reducido suspenden la caminata.

Pasaron 36 pruebas con `npm run check`. Los renders usan las mismas funciones de dibujo y movimiento que el sitio. Falta la revisión interactiva en un navegador conectado. Los cambios se mantienen en local.
