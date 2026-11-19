---
title: "Una entrada extensa para comprobar el cuaderno de lectura"
category: "Prueba de presentación"
date: 2026-11-18
example: true
---

Esta entrada es una muestra de prueba. Reúne párrafos, listas, una cita, una imagen, una tabla y un bloque de código para revisar el lector con diferentes tamaños de pantalla. No forma parte de los artículos publicados.

## Seguir leyendo al cambiar la letra

Una entrada puede tener explicaciones que ocupen varias líneas. Al aumentar el tamaño de la letra, cada línea contiene menos palabras y el párrafo crece en altura. La vista debe conservar el punto de lectura y mantener disponibles los controles del cuaderno. Para comprobarlo, desplazate hasta la mitad de este párrafo, cambiá el tamaño y verificá que seguís viendo la misma parte del texto. Probá también el tema oscuro, volvé al claro y observá el título, los enlaces y las etiquetas de los controles. El color de los párrafos debe seguir siendo legible sin depender del verde de la terminal.

Una segunda explicación permite comprobar la separación entre párrafos. Los márgenes distinguen las ideas y los títulos anuncian el comienzo de una sección. Las palabras en **negrita** y en *cursiva* conservan el énfasis. Un fragmento como `const total = 42` mantiene su tipografía de código y debe poder leerse en ambos temas. Este texto no describe un resultado experimental: solamente sirve para ejercitar el formato.

## Listas y citas

- Los controles de lectura quedan fuera de la zona que se desplaza.
- El tema elegido se conserva al abrir otra entrada.
- La letra se puede reducir hasta 16 y aumentar hasta 24.

1. Recorré los controles con Tab.
2. Abrí una entrada diferente y volvé a la lista.
3. Cerrá el lector con Escape y comprobá el foco.

> Una cita puede ocupar varias líneas. El borde lateral la distingue y su fondo debe conservar un contraste suficiente con el texto. Aumentar la letra no debe ocultar palabras ni recortar el contenido.

El [criterio de contraste de W3C](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) es un enlace de prueba. También se incluye una dirección extensa para comprobar el ajuste de línea: https://example.com/materiales/una-direccion-larga-para-comprobar-que-el-texto-se-ajusta-al-ancho-disponible-sin-desplazar-todo-el-cuaderno.

![Icono del laboratorio usado como imagen local de prueba](assets/favicon.svg)

## Código y tabla anchos

El bloque siguiente tiene una línea deliberadamente larga. En una pantalla angosta, desplazá el bloque horizontalmente usando el teclado o el gesto táctil. El resto del artículo debe conservar su ancho.

```js
const observaciones = ["Una línea de prueba suficientemente larga para revisar el desplazamiento horizontal del código sin ampliar la página ni esconder los controles del lector. No es código que la página deba ejecutar."];
console.log(observaciones.length);
```

| A | B | C | D | E | F | G | H | I | J | K | L |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 101 | 102 | 103 | 104 | 105 | 106 | 107 | 108 | 109 | 110 | 111 | 112 |
| 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 209 | 210 | 211 | 212 |

## Final de la muestra

Al llegar al final, los controles para volver a la bitácora y cerrar siguen disponibles. Volver debe enfocar la misma entrada que abriste. Después, abrí el currículum: su presentación de terminal y sus comandos deben continuar funcionando sin recibir el tema del artículo.
