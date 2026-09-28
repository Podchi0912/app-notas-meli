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
- Cuenta propia y sincronización entre el ordenador y el móvil, sin depender de
  estar en la misma red.

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
| `config.js`            | Dirección y clave pública del proyecto de Supabase   |
| `nube.js`              | La cuenta y la sincronización                        |
| `img/`                 | Logo, favicon y las pegatinas recortadas             |
| `basedatos/`           | Esquema SQL para Supabase                            |
| `logo/`                | Pruebas iniciales del logo                           |
| `_backup/`             | Copias manuales y utilidades (fuera del repositorio) |

## Dónde se guardan los datos

En el almacenamiento del propio navegador, siempre. La página escribe ahí
primero y funciona igual sin internet.

Si además se entra con el correo, ese mismo cuaderno se copia a Supabase y se
sincroniza con los demás aparatos. Los detalles están comentados arriba del
todo en `nube.js`, pero en resumen:

- Se entra con correo y contraseña, y la sesión se queda guardada: solo hay
  que escribirla una vez en cada aparato. Queda también la entrada por enlace
  al correo, de repuesto. La contraseña no está en el código: si estuviera,
  cualquiera que abriese la página entraría en el cuaderno.
- Cada aparato guarda una huella corta de cada nota para saber qué cambió aquí
  desde la última subida, sin tener que duplicar el cuaderno entero.
- Lo borrado se sube marcado como borrado, no se quita la fila: si se quitara,
  el otro aparato no se enteraría y la nota reaparecería.
- Si la misma nota se editó en dos sitios, gana la más reciente.
- Un aparato que estrena la cuenta descarta sus notas de ejemplo, para no
  mezclarlas con el cuaderno de verdad.

La clave que hay en `config.js` es pública a propósito: lo que protege los
datos son las reglas de `basedatos/esquema.sql`, que sin haber entrado con el
correo no dejan leer ni escribir nada.

El botón de descarga de la barra superior sigue exportando todo en un JSON,
como copia de seguridad aparte.
