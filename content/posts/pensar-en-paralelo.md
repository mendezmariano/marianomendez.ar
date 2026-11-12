---
title: "Pensar en paralelo: una tarea, muchas máquinas."
category: "SISTEMAS DISTRIBUIDOS"
example: true
---

Un clúster reúne varias computadoras para trabajar en tareas coordinadas. El desafío no termina al conectar los cables: también hay que decidir cómo repartir el trabajo y cómo reunir los resultados.

Imaginemos mil imágenes que necesitan el mismo procesamiento. Si cada imagen puede procesarse por separado, es posible repartirlas entre distintas máquinas. Al terminar, cada máquina devuelve sus resultados.

La comunicación tiene un costo. Algunas tareas dependen de resultados anteriores, y una máquina puede fallar. Un buen diseño toma esas condiciones en cuenta antes de prometer más velocidad.

Este texto es una muestra del lector de la bitácora. Reemplazalo por un artículo propio cuando quieras inaugurar el blog.
