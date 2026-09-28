# Mi Cuadernito

Aplicación de notas personales hecha con HTML, CSS y JavaScript a pelo: sin
frameworks, sin dependencias y sin ningún paso de compilación. Se abre el
`index.html` y funciona.

## Qué hace

- Notas de cinco tipos (nota, lista, receta, idea, plan) con búsqueda, favoritas,
  archivo y papelera.
- Categorías propias, con color y emoji, que filtran las notas.
- Calendario y recordatorios por día.
- Personalización por nota: color, fondo, estilo de papel, tipografía, tamaño y
  decoraciones repartidas por la hoja.
- Personalización de la app: seis paletas, formas de panel y tamaño de letra
  general, todas comprobadas para que el texto siga siendo legible.
- Pegatinas de capibaras que se colocan y se giran a mano sobre la nota.
- Tachuelas, clips y cinta adhesiva para sujetar las notas al tablero, con
  balanceo al pasar el ratón y al deslizar en el móvil.
- Modo claro y oscuro, y diseño adaptado al móvil.

## Cómo se ejecuta

No hace falta instalar nada. Con la extensión Live Server de VS Code, en el
puerto 5504 (ya configurado en `.vscode/settings.json`), o abriendo el
`index.html` directamente en el navegador.

## Estructura

| Archivo / carpeta      | Qué es                                              |
|------------------------|-----------------------------------------------------|
| `index.html`           | Toda la estructura de la página                      |
| `style.css`            | Estilos, incluidos los temas y la vista móvil        |
| `script.js`            | Toda la lógica                                       |
| `img/`                 | Logo, favicon y las pegatinas recortadas             |
| `basedatos/`           | Esquema SQL para Supabase                            |
| `logo/`                | Pruebas iniciales del logo                           |
| `_backup/`             | Copias manuales y utilidades (fuera del repositorio) |

## Dónde se guardan los datos

Hoy, en el almacenamiento del propio navegador, así que cada aparato tiene sus
notas. En `basedatos/esquema.sql` está el esquema para Supabase con el que
pasarán a estar en la nube y sincronizadas entre el ordenador y el móvil.

El botón de descarga de la barra superior exporta todo en un JSON, que sirve
tanto de copia de seguridad como de mudanza a esa base de datos.
