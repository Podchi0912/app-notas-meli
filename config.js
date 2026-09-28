/* =====================================================
   CONFIGURACIÓN DE LA NUBE

   Estos dos datos son públicos a propósito: viajan dentro de la página, y
   cualquiera que la abra puede verlos. No son una contraseña.

   Lo que protege el cuaderno son las reglas de basedatos/esquema.sql: con
   esta clave y sin haber entrado con el correo, la base de datos no
   devuelve ni deja escribir una sola fila (comprobado: responde 401).

   La clave que NUNCA debe estar aquí es la "service_role" de Supabase:
   esa sí se salta todas las reglas.

   Si se dejan vacíos, la aplicación funciona igual pero solo guarda en
   este aparato.
===================================================== */

window.CONFIG_NUBE = {
    url: "https://yqmieiiwbagwlurcajby.supabase.co",
    clave: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbWllaWl3YmFnd2x1cmNhamJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MTYzMjUsImV4cCI6MjEwNjE5MjMyNX0.Zuedj3abdgLrjiU_PiRl2nA0KI641xSZmlzLvoUaBPs"
};
