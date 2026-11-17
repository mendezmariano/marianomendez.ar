# Actualizar el currículum

Esta carpeta contiene la última versión del CV de Mariano. El documento actual es `cv_bolg.doc`, un Word moderno exportado desde CVar.

1. Guardá o reemplazá el Word en esta carpeta. Dejá un único archivo `.docx` o `.doc` de formato moderno.
2. Con `npm run dev` activo, esperá el mensaje "CV actualizado" y recargá el navegador. Fuera del servidor de desarrollo, ejecutá `npm run build`.
3. Antes de publicar, ejecutá `npm run check` e incluí el módulo generado `dist/content.js` en los cambios autorizados.

El importador ignora los archivos temporales de Word que empiezan con `~$`. Un archivo inválido no reemplaza el perfil generado anterior. Un `.doc` binario antiguo debe guardarse como `.docx`.

`import.json` define el contenido que se importa. Con `includePersonalData: false`, se incluyen las secciones profesionales y el correo identificado como laboral. Con `true`, se incluye también la sección de datos personales.

El Word original está excluido de Git y no se sirve en el sitio. GitHub Pages comprueba y publica el contenido generado. Cambiar el Word local no inicia una publicación.
