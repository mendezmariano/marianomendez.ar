# Revisar el cuaderno de lectura

Cada artículo se presenta dentro del marco de terminal, en una hoja clara por defecto. Los botones Claro y Oscuro cambian el tema. A− y A+ ajustan la letra entre 16 y 24 px de tamaño base, en pasos de 2. El valor inicial es 18, con interlineado de 1,7 y columna de hasta 65 caracteres.

El navegador conserva las preferencias en `mendez-lab.reader`. Si el almacenamiento no está disponible, los controles funcionan durante la sesión. El listado y el currículum conservan su presentación. Volver a la bitácora enfoca la entrada que se estaba leyendo; cerrar devuelve el foco al acceso que abrió la ventana.

## Abrir la muestra completa

Desde `mendez-lab/`, ejecutá:

```sh
node scripts/preview-reader.mjs
```

El comando copia el sitio a un directorio temporal e incorpora una entrada de prueba con párrafos largos, listas, citas, una imagen local, código y una tabla ancha. No modifica `dist/`, los artículos ni los borradores. Ejecutá el comando de servidor que imprime y abrí `http://127.0.0.1:4174`. Detené el servidor con Ctrl+C al terminar.

Para revisar los artículos actuales, usá `npm start` y abrí `http://127.0.0.1:4173`.

## Comprobaciones visuales y de teclado

1. Abrí la entrada de prueba en escritorio y en una pantalla de 320 a 640 px de ancho. En móvil, el lector debe ocupar la pantalla y conservar márgenes interiores de 20 px.
2. Recorré el texto en ambos temas y con tamaños 16, 18 y 24. Ampliá además el navegador al 200 %. La página no debe desplazarse horizontalmente; el código y la tabla pueden hacerlo dentro de sus propios límites.
3. Desplazate hasta la mitad de un párrafo y aumentá la letra. Comprobá que conserva la posición relativa dentro del párrafo y que los controles permanecen visibles.
4. Usá Tab y Enter para recorrer los controles, los enlaces, el bloque de código y la tabla. Los elementos enfocados deben tener un contorno visible. Probá las flechas dentro del código y de la tabla cuando desborden.
5. Elegí Oscuro y 20 px, cerrá y volvé a abrir el artículo. Recargá la página y comprobá que conserva ambas preferencias.
6. Volvé al listado y verificá el foco sobre la misma entrada. Cerrá con Escape y verificá el foco sobre el acceso inicial. Abrí el CV y comprobá su presentación y sus comandos.

## Verificación automatizada

`npm run check` comprueba la generación y el sitio completo. `npm run check:dist` permite comprobar un checkout que no contiene el Word original. Las pruebas de interacción cubren preferencias, límites, navegación, foco, almacenamiento no disponible y conservación del contenido. Las pruebas de color calculan el contraste de las paletas reales del CSS: al menos 4,5:1 para texto y 3:1 para los bordes de los controles.

La revisión automatizada en navegador y las capturas de pantalla siguen pendientes: el navegador conectado no estuvo disponible durante la implementación. Las pruebas con dobles de DOM no verifican la distribución visual.
