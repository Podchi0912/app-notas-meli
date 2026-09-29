const STORAGE_KEY = "mi-cuadernito-notes";
const SETTINGS_KEY = "mi-cuadernito-settings";
const REMINDERS_KEY = "mi-cuadernito-reminders";
const CATEGORIES_KEY = "mi-cuadernito-categories";
const TYPE_LABELS = { nota: "NOTA", lista: "LISTA", receta: "RECETA", idea: "IDEA", plan: "PLAN" };
// Nombre en bonito del TIPO de nota. Ojo: no son las categorías del usuario,
// que son otra cosa y viven en `categories`.
const CATEGORY_LABELS = { nota: "Notas", lista: "Listas", receta: "Recetas", idea: "Ideas", plan: "Planes" };

// Los seis puntos de color que ya usaba el sidebar. Se reaprovechan las clases
// del CSS en vez de inventar otra paleta: así siguen al tema claro/oscuro.
// Va aquí arriba porque `categoryDot` lo lee al declararse, mucho antes.
// Salvia y lila llegaron con Cocina y Postres: con seis colores para nueve
// categorías había que repetir, y así cada una tiene el suyo.
const CATEGORY_DOTS = ["blue", "cream", "yellow", "pink", "white", "grey", "sage", "lilac"];
// Antes el pie del editor mostraba "♨" para todo: una lista ponía "♨ Listas".
const TYPE_ICONS = { nota: "▧", lista: "☷", receta: "♨", idea: "♧", plan: "▣" };
// "plan" es masculino: antes el diálogo decía "Nueva plan".
const TYPE_ARTICLE = { nota: "Nueva", lista: "Nueva", receta: "Nueva", idea: "Nueva", plan: "Nuevo" };

// Los cinco tipos con el icono y el tono de color que ya usaban las tarjetas de
// "¿Qué quieres crear hoy?". `tono` es la clase de .create-icon del CSS, que se
// reaprovecha para que los botones del diálogo y las tarjetas no se separen.
const NOTE_TYPES = [
    { key: "nota", icon: "✎", tono: "note" },
    { key: "lista", icon: "☑", tono: "list" },
    { key: "receta", icon: "♨", tono: "recipe" },
    { key: "idea", icon: "♧", tono: "idea" },
    { key: "plan", icon: "▦", tono: "plan" }
];

// Versión del formato de exportación. Súbela si cambia la forma de las notas,
// así un importador futuro (o la base de datos) sabrá qué migración aplicar.
// v2 añadió la colección `reminders`.
// v3 añadió `categories` y sustituyó el `category` de la nota (que solo repetía
// el nombre del tipo) por `categoryId`, que apunta a una categoría de verdad.
const EXPORT_VERSION = 3;

// Valores por defecto que usa el renderizador cuando falta la personalización.
// Debe declararse antes de loadNotes(): seedNotes() lo usa en el primer arranque.
const DEFAULT_CUSTOMIZATION = {
    color: "pink",
    background: "plain",
    style: "paper",
    font: "Handlee",
    fontSize: 16,
    decoration: "❤️"
};

// Decoraciones dibujadas a mano, para lo que Unicode no cubre: solo tiene la
// calabaza de Halloween (🎃) y no tiene capibara. Se escalan con font-size
// gracias al 1em del .deco-svg.
const DECORATION_SVG = {
    pumpkin: `<svg class="deco-svg" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="14.7" y="4.5" width="2.6" height="5" rx="1.3" fill="#7A9A45"/>
        <path d="M17 6.5c2.4-1.6 4.6-1.2 5.4.6" stroke="#7A9A45" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <ellipse cx="8.6" cy="19.5" rx="4.4" ry="8.4" fill="#D9742F"/>
        <ellipse cx="23.4" cy="19.5" rx="4.4" ry="8.4" fill="#D9742F"/>
        <ellipse cx="16" cy="19.5" rx="8.6" ry="9.2" fill="#E8853A"/>
        <ellipse cx="16" cy="19.5" rx="3.4" ry="9.2" fill="#F3A163"/>
    </svg>`,
    // Empezó como capibara y no coló: sin orejas grandes y redondas leía como
    // un oso de todas formas, así que es un oso y se le dan las orejas.
    bear: `<svg class="deco-svg" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="7.6" cy="8.6" r="3.6" fill="#A9784E"/>
        <circle cx="24.4" cy="8.6" r="3.6" fill="#A9784E"/>
        <circle cx="7.6" cy="8.6" r="1.7" fill="#D08E86"/>
        <circle cx="24.4" cy="8.6" r="1.7" fill="#D08E86"/>
        <circle cx="16" cy="17.4" r="10.2" fill="#BF8A5B"/>
        <ellipse cx="16" cy="20.6" rx="5.6" ry="4.4" fill="#E2B487"/>
        <ellipse cx="16" cy="18.4" rx="2.2" ry="1.6" fill="#5F3E2A"/>
        <path d="M13.6 21.4q2.4 1.9 4.8 0" stroke="#5F3E2A" stroke-width="0.95" fill="none" stroke-linecap="round"/>
        <circle cx="11.6" cy="14.6" r="1.3" fill="#4A3122"/>
        <circle cx="20.4" cy="14.6" r="1.3" fill="#4A3122"/>
        <circle cx="12" cy="14.2" r="0.42" fill="#FFFFFF"/>
        <circle cx="20.8" cy="14.2" r="0.42" fill="#FFFFFF"/>
    </svg>`,
    // La clave está en el hocico: grande y MÁS OSCURO que la cabeza. Al pintarlo
    // más claro (como en un oso) el dibujo dejaba de leerse como capibara.
    // Orejas pequeñas y oscuras, mofletes rosas y la flor encima.
    capybara: `<svg class="deco-svg" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="7.6" cy="9.6" r="3.3" fill="#9A6842"/>
        <circle cx="24.4" cy="9.6" r="3.3" fill="#9A6842"/>
        <circle cx="7.6" cy="9.8" r="1.7" fill="#7C5233"/>
        <circle cx="24.4" cy="9.8" r="1.7" fill="#7C5233"/>
        <rect x="3.4" y="8.2" width="25.2" height="20.6" rx="9.5" fill="#C99260"/>
        <ellipse cx="6.4" cy="19.8" rx="2.2" ry="1.45" fill="#F2909E" opacity="0.75"/>
        <ellipse cx="25.6" cy="19.8" rx="2.2" ry="1.45" fill="#F2909E" opacity="0.75"/>
        <ellipse cx="16" cy="21.3" rx="5.7" ry="4.7" fill="#A9784E"/>
        <ellipse cx="14.3" cy="20" rx="0.7" ry="0.9" fill="#5B3A26"/>
        <ellipse cx="17.7" cy="20" rx="0.7" ry="0.9" fill="#5B3A26"/>
        <path d="M13 22.9q3 2.5 6 0" stroke="#5B3A26" stroke-width="0.85" fill="none" stroke-linecap="round"/>
        <ellipse cx="10.1" cy="14.8" rx="1.85" ry="2.25" fill="#3D2418"/>
        <ellipse cx="21.9" cy="14.8" rx="1.85" ry="2.25" fill="#3D2418"/>
        <circle cx="10.75" cy="13.9" r="0.7" fill="#FFFFFF"/>
        <circle cx="22.55" cy="13.9" r="0.7" fill="#FFFFFF"/>
        <g fill="#F7C948">
            <circle cx="21.9" cy="4.1" r="1.55"/>
            <circle cx="24.09" cy="5.69" r="1.55"/>
            <circle cx="23.25" cy="8.26" r="1.55"/>
            <circle cx="20.55" cy="8.26" r="1.55"/>
            <circle cx="19.71" cy="5.69" r="1.55"/>
        </g>
        <circle cx="21.9" cy="6.4" r="1.3" fill="#EE9B2E"/>
    </svg>`,
    // El de cuerpo entero de la referencia: cuerpo de pera, cabeza encima y las
    // cuatro patitas asomando abajo, del mismo tono que el hocico.
    "capybara-sit": `<svg class="deco-svg" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="9.6" cy="6.9" r="2.6" fill="#9A6842"/>
        <circle cx="22.4" cy="6.9" r="2.6" fill="#9A6842"/>
        <circle cx="9.6" cy="7.1" r="1.3" fill="#7C5233"/>
        <circle cx="22.4" cy="7.1" r="1.3" fill="#7C5233"/>
        <ellipse cx="16" cy="22.4" rx="10.4" ry="8" fill="#C99260"/>
        <ellipse cx="16" cy="11.6" rx="8" ry="6.6" fill="#C99260"/>
        <ellipse cx="8.6" cy="13.6" rx="1.7" ry="1.1" fill="#F2909E" opacity="0.75"/>
        <ellipse cx="23.4" cy="13.6" rx="1.7" ry="1.1" fill="#F2909E" opacity="0.75"/>
        <ellipse cx="16" cy="14.7" rx="4.2" ry="3.3" fill="#A9784E"/>
        <ellipse cx="14.9" cy="13.8" rx="0.5" ry="0.65" fill="#5B3A26"/>
        <ellipse cx="17.1" cy="13.8" rx="0.5" ry="0.65" fill="#5B3A26"/>
        <path d="M13.8 15.8q2.2 1.8 4.4 0" stroke="#5B3A26" stroke-width="0.7" fill="none" stroke-linecap="round"/>
        <ellipse cx="11.5" cy="10.6" rx="1.4" ry="1.75" fill="#3D2418"/>
        <ellipse cx="20.5" cy="10.6" rx="1.4" ry="1.75" fill="#3D2418"/>
        <circle cx="11.98" cy="9.9" r="0.55" fill="#FFFFFF"/>
        <circle cx="20.98" cy="9.9" r="0.55" fill="#FFFFFF"/>
        <ellipse cx="7.4" cy="28.8" rx="3" ry="1.7" fill="#A9784E"/>
        <ellipse cx="24.6" cy="28.8" rx="3" ry="1.7" fill="#A9784E"/>
        <ellipse cx="13.1" cy="28.9" rx="2.3" ry="1.9" fill="#A9784E"/>
        <ellipse cx="18.9" cy="28.9" rx="2.3" ry="1.9" fill="#A9784E"/>
        <g fill="#F7C948">
            <circle cx="20.4" cy="2.9" r="1.35"/>
            <circle cx="22.31" cy="4.28" r="1.35"/>
            <circle cx="21.58" cy="6.53" r="1.35"/>
            <circle cx="19.22" cy="6.53" r="1.35"/>
            <circle cx="18.49" cy="4.28" r="1.35"/>
        </g>
        <circle cx="20.4" cy="4.9" r="1.15" fill="#EE9B2E"/>
    </svg>`,
    // El tumbado de la referencia: cuerpo alargado hacia la derecha, cabeza a
    // la izquierda, ojitos cerrados en arco y la mandarina encima.
    "capybara-loaf": `<svg class="deco-svg" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="17.6" cy="11.2" r="2.7" fill="#8E5F3C"/>
        <circle cx="17.6" cy="11.4" r="1.35" fill="#734A2E"/>
        <ellipse cx="19.2" cy="21.2" rx="12.3" ry="8.4" fill="#C08A5B"/>
        <circle cx="11.5" cy="17.6" r="8.5" fill="#CE9765"/>
        <ellipse cx="15.9" cy="18.8" rx="1.9" ry="1.3" fill="#F2909E" opacity="0.8"/>
        <ellipse cx="8.5" cy="19.7" rx="5.2" ry="4.4" fill="#9E7550"/>
        <ellipse cx="6.4" cy="18" rx="0.85" ry="0.65" fill="#4B3222"/>
        <path d="M6.4 20.6q1.6 1.5 3.2 0" stroke="#4B3222" stroke-width="0.85" fill="none" stroke-linecap="round"/>
        <path d="M4.6 14.9q1.35-1.7 2.7 0" stroke="#4B3222" stroke-width="1" fill="none" stroke-linecap="round"/>
        <path d="M13.9 15.3q1.35-1.7 2.7 0" stroke="#4B3222" stroke-width="1" fill="none" stroke-linecap="round"/>
        <ellipse cx="10.2" cy="27.4" rx="2.7" ry="2.2" fill="#9E7550"/>
        <ellipse cx="15" cy="27.7" rx="2.7" ry="2.2" fill="#9E7550"/>
        <circle cx="13.4" cy="5.6" r="3.4" fill="#F0921F"/>
        <circle cx="12.2" cy="4.4" r="0.9" fill="#F8C070"/>
        <rect x="13.1" y="1.8" width="0.8" height="1.8" rx="0.4" fill="#6B4A2A"/>
        <ellipse cx="16" cy="2.6" rx="2.1" ry="1.1" fill="#4E8B3A" transform="rotate(-20 16 2.6)"/>
    </svg>`
};

// Nombre de los dibujados, para el aria-label de sus botones: la clave no vale
// como texto para un lector de pantalla.
const DRAWN_NAMES = {
    pumpkin: "una calabaza",
    bear: "un osito",
    capybara: "un capibara",
    "capybara-sit": "un capibara sentado",
    "capybara-loaf": "un capibara con mandarina"
};

function svgNode(markup) {
    const plantilla = document.createElement("template");
    plantilla.innerHTML = markup;
    return plantilla.content.firstElementChild;
}

// Dentro del texto de la nota los dibujos van como <img> con el SVG en un data
// URI, NO como <svg> en línea. Un contenteditable trata la imagen como un
// carácter más: el cursor se pone a su lado y el retroceso la borra. Con el
// <svg> en línea el cursor se metía dentro del dibujo, lo que se escribiera
// después caía ahí sin verse, y no había manera de borrarlo.
function drawnImage(key) {
    // El xmlns es imprescindible: en línea sobra, pero como imagen suelta el
    // navegador no dibuja nada sin él.
    const markup = DECORATION_SVG[key].replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
    const img = document.createElement("img");
    img.className = "note-sticker";
    img.alt = DRAWN_NAMES[key] || "";
    img.src = `data:image/svg+xml,${encodeURIComponent(markup)}`;
    return img;
}

// Reconoce un dibujo ya guardado dentro de una nota comparándolo con el mismo
// marcado pasado por el navegador, que al serializar cambia las etiquetas.
let DIBUJOS_SERIALIZADOS = null;

function drawingKeyOf(svg) {
    if (!DIBUJOS_SERIALIZADOS) {
        DIBUJOS_SERIALIZADOS = new Map();
        Object.keys(DECORATION_SVG).forEach((key) =>
            DIBUJOS_SERIALIZADOS.set(svgNode(DECORATION_SVG[key]).outerHTML, key));
    }
    return DIBUJOS_SERIALIZADOS.get(svg.outerHTML) || null;
}

// Cambia por imágenes los dibujos que se insertaron en línea antes de saberlo.
function migrateDrawings(html) {
    if (!html || !html.includes("deco-svg")) return html;
    const plantilla = document.createElement("template");
    plantilla.innerHTML = html;
    plantilla.content.querySelectorAll("svg.deco-svg").forEach((svg) => {
        const key = drawingKeyOf(svg);
        if (key) svg.replaceWith(drawnImage(key));
        else svg.remove();
    });
    return plantilla.innerHTML;
}

// Devuelve el marcado de una decoración: SVG si es dibujada, texto si es emoji.
function decorationMarkup(mark) {
    return DECORATION_SVG[mark] || escapeHtml(mark);
}

// Luminancia relativa (WCAG) de un color #RRGGBB, de 0 (negro) a 1 (blanco).
function luminance(hex) {
    const canal = (i) => {
        const v = parseInt(hex.substr(1 + i * 2, 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}

// Cuanto más claro es el fondo, menos destacan las decoraciones claras (nube,
// corazón blanco, estrella). Se compensa subiendo la opacidad de forma
// proporcional a la luminancia del fondo.
function patternOpacity(backgroundHex) {
    const nivel = 0.22 + (luminance(backgroundHex) - 0.58) * 0.5;
    return Math.min(0.36, Math.max(0.22, nivel)).toFixed(3);
}

// Las decoraciones antiguas eran símbolos; se traducen a su emoji equivalente
// para que las notas ya guardadas sigan mostrando algo de la lista actual.
const DECORATION_ALIASES = {
    "♡": "❤️",
    "☆": "⭐",
    "✿": "🌸",
    "♧": "🌸",
    "☁": "☁️",
    "▱": "⭐",
    "🎃": "pumpkin"
};

// Posiciones fijas (top%, left%, tamaño px, giro) para repartir la decoración.
// Es una rejilla de 4 columnas por 5 filas con las posiciones desplazadas a mano
// dentro de cada celda: así el reparto es parejo pero no parece cuadriculado.
// Van fijas y no al azar para que no salten de sitio en cada render.
const PATTERN_SPOTS = [
    [5, 7, 34, -12],  [12, 33, 24, 9],   [4, 59, 42, -6],  [14, 84, 28, 14],
    [27, 13, 26, 7],  [33, 39, 40, -14], [25, 65, 22, 11], [35, 85, 32, -8],
    [46, 5, 30, 13],  [52, 29, 22, -9],  [44, 56, 36, 6],  [54, 82, 26, -13],
    [67, 10, 44, -7], [72, 37, 28, 12],  [64, 62, 24, -11], [73, 84, 34, 8],
    [85, 7, 26, 10],  [90, 33, 32, -6],  [84, 60, 22, 15], [92, 83, 38, -10]
];

const notesGrid = document.querySelector("#notesGrid");
const editorTitle = document.querySelector("#editorTitle");
const editorContent = document.querySelector("#editorContent");
const saveStatus = document.querySelector("#saveStatus");
const searchInput = document.querySelector("#searchInput");
const mobileFilter = document.querySelector("#mobileFilter");
const newNoteDialog = document.querySelector("#newNoteDialog");
const newNoteTitle = document.querySelector("#newNoteTitle");
const newNoteHeading = document.querySelector("#newNoteHeading");
let pendingNoteCategory = "";
const newNoteForm = document.querySelector(".new-note-form");
let notes = loadNotes();
let settings = loadSettings();
let activeNoteId = notes.find((note) => !note.deleted)?.id || null;
let activeFilter = "all";
let activeDate = null;               // "AAAA-MM-DD" del día filtrado, o null
let calendarCursor = new Date();     // cualquier fecha dentro del mes mostrado
let reminders = loadReminders();
let categories = loadCategories();
let editingCategoryId = null;        // si no es null, el formulario está editando
let categoryDot = CATEGORY_DOTS[0];
let editingReminderId = null;        // si no es null, el formulario está editando
let reminderColor = "coral";
let lastEditableTarget = null;       // título o papel: dónde insertar el emoji
let saveTimer;
let pendingNoteType;
let customizationDraft = {};
// A qué nota pertenece el borrador y si tiene cambios sin guardar.
// Sin esto, "Aplicar cambios" copiaba los ajustes de la nota anterior.
let customizationDraftNoteId = null;
let customizationDirty = false;
/* Paleta de notas: diez tonos repartidos por la rueda de color, con al menos
   24° de separación entre vecinos. Antes había pares casi idénticos (pink/sage
   eran dos rosas, coral/pistachio dos salmones) y varios nombres no
   correspondían con su color (sage era rosa, lavender turquesa). */

// Acento: líneas, puntos, borde del estilo Diario, decoraciones y muestras.
// El orden es el de las muestras del panel: primero la vuelta a la rueda de
// color y después la familia terrosa, que enlaza con la paleta de la app.
const COLOR_VALUES = {
    coral: "#CF644A",
    pink: "#CD5176",
    blush: "#B4747C",
    burgundy: "#692140",
    mauve: "#C157A5",
    purple: "#9C5CBC",
    lavender: "#6067C7",
    sky: "#3992C6",
    teal: "#36A19A",
    sage: "#479069",
    pistachio: "#77983E",
    beige: "#BE9137",
    terracotta: "#A75735",
    brown: "#624C32",
    taupe: "#776E55",
    grey: "#666875"
};

// Clave retirada al rehacer la paleta. Se traduce a la más parecida para que
// las notas y recordatorios ya guardados no pierdan su color.
const COLOR_ALIASES = {
    ivory: "teal"
};

function colorKey(name) {
    const key = COLOR_ALIASES[name] || name;
    return COLOR_VALUES[key] ? key : DEFAULT_CUSTOMIZATION.color;
}
// Fondo de la nota: mismo tono que el acento. Los diez primeros a ~88% de
// luminosidad; la familia terrosa baja al 79-87% para que se lea más profunda.
// Contraste con --text entre 7.25 y 10.65 (el mínimo accesible es 4.5).
const COLOR_BACKGROUNDS = {
    coral: "#F6D5CD",
    pink: "#F6CDD9",
    blush: "#E5CFD2",
    burgundy: "#DFBBCB",
    mauve: "#F5D6ED",
    purple: "#E7D2F1",
    lavender: "#CED1F5",
    sky: "#CEE7F6",
    teal: "#CEF3F0",
    sage: "#CEECDC",
    pistachio: "#E4F1CE",
    beige: "#F6E8CA",
    terracotta: "#E7C1B1",
    brown: "#D7CABC",
    taupe: "#E4E0D5",
    grey: "#D6D7DC"
};
const COLOR_NAMES = {
    coral: "Coral",
    pink: "Rosa",
    blush: "Rosa palo",
    burgundy: "Burdeos",
    mauve: "Malva",
    purple: "Morado",
    lavender: "Lavanda",
    sky: "Azul cielo",
    teal: "Turquesa",
    sage: "Verde salvia",
    pistachio: "Pistacho",
    beige: "Beige",
    terracotta: "Terracota",
    brown: "Marrón",
    taupe: "Topo",
    grey: "Gris"
};
// Emojis que se insertan en el texto de la nota. Nada de caritas amarillas:
// flores, plantas, repostería, papelería y cielo, que es el registro de la app.
// Agrupados por familias (una fila de ocho cada dos líneas) para que sea fácil
// encontrar lo que se busca.
const EMOJIS = [
    "🌸", "🌷", "🌼", "🌻", "🌹", "🌿", "🍃", "🪴",
    "🍓", "🍒", "🍑", "🍎", "🍏", "🍐", "🍊", "🍋",
    "🍌", "🍉", "🍇", "🫐", "🥝", "🥭", "🍍", "🥥",
    "🍅", "🥑", "🥕", "🌽", "🥦", "🥬", "🥒", "🍄",
    "🥐", "🥖", "🥨", "🍞", "🧀", "🥞", "🧇", "🍯",
    "🧁", "🍰", "🎂", "🍮", "🍪", "🍩", "🍫", "🍬",
    "🍭", "🍦", "🍧", "☕", "🫖", "🍵", "🧋", "🥤",
    "🎀", "💌", "📖", "✏️", "📌", "🕯️", "🧸", "🌾",
    "🌙", "⭐", "✨", "☁️", "🤍", "💗", "🦋", "🐚",
    // Estos dos no son caracteres: son claves de DECORATION_SVG y se insertan
    // como dibujo. Unicode no tiene capibara.
    "capybara", "capybara-sit", "capybara-loaf"
];

const FONT_OPTIONS = ["Handlee", "Georgia", "Arial", "Verdana"];

/* Paletas de la app. Cada una fija los tokens de tema; todas están comprobadas
   para que el texto del sidebar, los títulos y el cuerpo mantengan al menos
   5.6 de contraste (el mínimo exigible es 4.5). Por eso son combinaciones
   cerradas y no un selector de color libre. */
const PALETTES = {
    burdeos:   { name: "Burdeos",    sidebar: "#79403F", plum: "#713E5A", coral: "#D57A66", background: "#F5E6D7", paper: "#FCF3E4" },
    cacao:     { name: "Cacao",      sidebar: "#5F4433", plum: "#6B4B39", coral: "#C77F52", background: "#F3E7D6", paper: "#FBF2E2" },
    ciruela:   { name: "Ciruela",    sidebar: "#5E3557", plum: "#6B3F63", coral: "#C4728F", background: "#F3E6E6", paper: "#FBF1EF" },
    salvia:    { name: "Salvia",     sidebar: "#4C5A44", plum: "#4F6046", coral: "#BF8450", background: "#EFE9DA", paper: "#F9F3E6" },
    noche:     { name: "Azul noche", sidebar: "#3B4A63", plum: "#44526B", coral: "#CE8A6E", background: "#EEE8DE", paper: "#F9F3E9" },
    terracota: { name: "Terracota",  sidebar: "#8A4B36", plum: "#7A4436", coral: "#CC7F55", background: "#F5E6D5", paper: "#FCF3E4" }
};

// Formas de los paneles. El radio es un valor CSS completo, no un número, para
// poder incluir formas asimétricas como "Hoja".
const PANEL_SHAPES = [
    // La galleta no se hace con radios: lleva una máscara festoneada aparte,
    // que se activa con la clase shape-cookie en el body.
    { key: "cookie",  name: "Galleta",    radius: "0" },
    { key: "sharp",   name: "Recta",      radius: "8px" },
    { key: "arch",    name: "Arco",       radius: "30px 30px 6px 6px" },
    { key: "round",   name: "Redondeada", radius: "22px" },
    { key: "capsule", name: "Cápsula",    radius: "34px" },
    { key: "leaf",    name: "Hoja",       radius: "30px 8px 30px 8px" }
];

// Las primeras formas se guardaban como el número de píxeles, y "Suave" se
// retiró por parecerse demasiado a Recta y Redondeada.
const SHAPE_ALIASES = { "8": "sharp", "16": "round", "22": "round", soft: "round", square: "cookie" };

// Escala tipográfica global de la app (multiplica el tamaño raíz).
const FONT_SCALE_MIN = 0.85;
const FONT_SCALE_MAX = 1.4;
const FONT_SCALE_STEP = 0.05;

// Las categorías de fábrica llevan id fijo (no UUID) para que las notas semilla
// puedan apuntar a ellas y para que sigan reconocibles al migrarlas a una BBDD.
function seedCategories() {
    return [
        { id: "viajes", name: "Viajes", icon: "✈️", dot: "blue" },
        { id: "peliculas", name: "Películas", icon: "🎬", dot: "cream" },
        { id: "libros", name: "Libros", icon: "📚", dot: "yellow" },
        { id: "casa", name: "Casa", icon: "🏠", dot: "pink" },
        { id: "trabajo", name: "Trabajo", icon: "💼", dot: "white" },
        { id: "salud", name: "Salud", icon: "🌿", dot: "grey" },
        { id: "compras", name: "Compras", icon: "🧺", dot: "yellow" },
        { id: "cocina", name: "Cocina", icon: "🍗", dot: "sage" },
        { id: "postres", name: "Postres", icon: "🧁", dot: "lilac" }
    ];
}

// Categorías incorporadas después de la primera versión. Quien ya tuviera la
// lista guardada no las vería nunca, porque loadCategories() solo siembra
// cuando no hay nada. Se dan de alta una única vez: si luego borras una, la
// marca ya está puesta y no reaparece.
// `desde` es la versión en que llegó cada una. Solo se dan de alta las que son
// más nuevas que la última alta hecha: si se añadieran todas las que faltan,
// subir la versión resucitaría las que el usuario borró a propósito.
const CATEGORY_ADDITIONS = [
    { desde: 1, id: "compras", name: "Compras", icon: "🧺", dot: "yellow" },
    { desde: 2, id: "cocina", name: "Cocina", icon: "🍗", dot: "sage" },
    { desde: 2, id: "postres", name: "Postres", icon: "🧁", dot: "lilac" }
];
const CATEGORY_SEED_VERSION = Math.max(...CATEGORY_ADDITIONS.map((nueva) => nueva.desde));

function applyCategoryAdditions() {
    const hecha = settings.categorySeed || 0;
    if (hecha >= CATEGORY_SEED_VERSION) return;
    // Tampoco se añade si ya hay una con ese nombre: el usuario pudo crearse
    // su propia "Postres" a mano, con otro id.
    const nombres = new Set(categories.map((categoria) => categoria.name.trim().toLowerCase()));
    CATEGORY_ADDITIONS
        .filter((nueva) => nueva.desde > hecha)
        .forEach(({ desde, ...nueva }) => {
            if (findCategory(nueva.id) || nombres.has(nueva.name.toLowerCase())) return;
            categories.push(nueva);
        });
    settings.categorySeed = CATEGORY_SEED_VERSION;
    persistSettings();
}

// Iconos de fábrica que se cambiaron después de darlos de alta: la sartén 🍳
// se veía como una mancha oscura a tamaño de lista. Solo se tocan si siguen
// como vinieron; si el usuario le puso otro icono, se respeta el suyo.
const CATEGORY_ICON_UPDATES = [
    { id: "cocina", de: "🍳", a: "🍗" }
];

function applyCategoryIconUpdates() {
    CATEGORY_ICON_UPDATES.forEach(({ id, de, a }) => {
        const categoria = findCategory(id);
        if (categoria && categoria.icon === de) categoria.icon = a;
    });
}

function loadCategories() {
    try {
        const stored = JSON.parse(localStorage.getItem(CATEGORIES_KEY));
        return Array.isArray(stored) ? stored : seedCategories();
    } catch {
        return seedCategories();
    }
}

function persistCategories() {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    avisarNube();
}

function findCategory(id) {
    return categories.find((item) => item.id === id) || null;
}

// Etiqueta de una categoría lista para pintar: "✈️ Viajes" o solo el nombre.
function categoryLabel(category) {
    return category.icon ? `${category.icon} ${category.name}` : category.name;
}

function seedNotes() {
    // Cada nota estrena una combinación distinta para que la app se vea como el
    // diseño original y se entienda de un vistazo que todo es personalizable.
    const seeds = [
        {
            type: "receta",
            title: "Pasta con tomate cherry 🍅",
            content: "<h2>Ingredientes</h2><ul><li>250g de pasta</li><li>1 taza de tomates cherry</li><li>2 dientes de ajo</li><li>Aceite de oliva</li><li>Sal y pimienta al gusto</li></ul><h2>Preparación</h2><ol><li>Cocina la pasta según el paquete.</li><li>Sofríe el ajo en aceite de oliva.</li><li>Agrega los tomates y cocina 5 minutos.</li><li>Mezcla con la pasta y salpimienta.</li></ol>",
            daysAgo: 0,
            customization: { color: "coral", background: "lines", style: "paper", decoration: "🍓" }
        },
        {
            type: "lista",
            title: "Compra semanal",
            content: "<h2>Lista</h2><ul><li>Leche</li><li>Huevos</li><li>Pan integral</li><li>Tomates</li><li>Queso</li><li>Café</li></ul>",
            daysAgo: 1,
            categoryId: "casa",
            customization: { color: "pink", background: "dots", style: "post-it", decoration: "⭐" }
        },
        {
            type: "nota",
            title: "Ideas para el blog",
            content: "<p>Escribir sobre mis recetas favoritas, organización del hogar y hábitos saludables.</p>",
            daysAgo: 3,
            categoryId: "trabajo",
            customization: { color: "beige", background: "plain", style: "card", decoration: "🌸" }
        },
        {
            type: "idea",
            title: "Viaje a Italia 🇮🇹",
            content: "<h2>Lugares</h2><ul><li>Roma</li><li>Florencia</li><li>Venecia</li><li>Costa Amalfitana</li></ul>",
            daysAgo: 6,
            categoryId: "viajes",
            customization: { color: "mauve", background: "grid", style: "journal", decoration: "☁️" }
        }
    ];

    // Fechas escalonadas para que el calendario nazca con varios días marcados.
    const dateFrom = (daysAgo) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString();
    };

    return seeds.map((seed) => ({
        id: crypto.randomUUID(),
        type: seed.type,
        title: seed.title,
        content: seed.content,
        categoryId: seed.categoryId || null,
        favorite: false,
        archived: false,
        deleted: false,
        customization: { ...DEFAULT_CUSTOMIZATION, ...seed.customization },
        updatedAt: dateFrom(seed.daysAgo),
        // Marca de "esto lo puso la página, no ella". Sirve al entrar en la
        // cuenta desde un aparato nuevo: estas notas de muestra se descartan
        // para no mezclarlas con el cuaderno de verdad. tocarNota() borra la
        // marca en cuanto se edita la nota, y entonces ya no se descarta.
        semilla: true
    }));
}

// Hasta la v2, `category` guardaba el nombre del tipo ("Recetas") y no lo
// elegía nadie: era una copia de `type`. La categoría de verdad es ahora
// `categoryId`, así que al cargar se descarta el campo viejo.
function migrateNote(note) {
    const { category, ...resto } = note;
    return extraerPegatinasDelTexto({
        ...resto,
        categoryId: note.categoryId || null,
        stickers: Array.isArray(note.stickers) ? note.stickers : [],
        content: migrateDrawings(note.content)
    });
}

// Las pegatinas se metían dentro del texto. Ahora se colocan sueltas sobre la
// hoja, así que las que quedaran incrustadas se sacan a su capa en vez de
// dejarlas como imágenes en medio de un párrafo.
function extraerPegatinasDelTexto(note) {
    if (!note.content || !note.content.includes("note-sticker-big")) return note;

    const plantilla = document.createElement("template");
    plantilla.innerHTML = note.content;
    [...plantilla.content.querySelectorAll("img.note-sticker-big")].forEach((img, i) => {
        const partes = (img.getAttribute("src") || "").split("/");
        note.stickers.push({
            id: crypto.randomUUID(),
            file: partes[partes.length - 1],
            x: 16 + (i % 4) * 15,
            y: 14 + (i % 5) * 13,
            w: 26,
            r: 0
        });
        img.remove();
    });
    note.content = plantilla.innerHTML;
    return note;
}

function loadNotes() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(stored) ? stored.map(migrateNote) : seedNotes();
    } catch {
        return seedNotes();
    }
}

function loadSettings() {
    try {
        return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    } catch {
        return {};
    }
}

function loadReminders() {
    try {
        const stored = JSON.parse(localStorage.getItem(REMINDERS_KEY));
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

// Sella la nota como recién tocada por ella. De paso deja de ser una nota de
// ejemplo: las de ejemplo se descartan al entrar en la cuenta desde un aparato
// nuevo, y lo que ella haya escrito no debe irse con ellas.
function tocarNota(note) {
    note.updatedAt = new Date().toISOString();
    delete note.semilla;
}

// Le dice a la nube (nube.js) que algo cambió aquí. Si no hay nube cargada, no
// pasa nada: la página funciona igual guardando solo en este aparato.
function avisarNube() {
    if (window.Cuadernito && window.Cuadernito.alCambiar) window.Cuadernito.alCambiar();
}

function persistReminders() {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    avisarNube();
}

function persistNotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    saveStatus.textContent = "✓ Guardado";
    avisarNube();
}

function persistSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    avisarNube();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function getActiveNote() {
    return notes.find((note) => note.id === activeNoteId);
}

function openEditor() {
    document.querySelector(".editor").classList.remove("is-hidden");
    document.querySelector(".app").classList.add("editor-open");
    // En móvil el editor es una hoja fija; la clase bloquea el scroll del fondo.
    document.body.classList.add("editor-open");
}

function closeEditor() {
    document.querySelector(".editor").classList.add("is-hidden");
    document.querySelector(".app").classList.remove("editor-open");
    document.body.classList.remove("editor-open");
    // El panel personaliza la nota abierta: si no, se quedaría flotando sobre
    // la pantalla de inicio sin nada a lo que aplicarse.
    setCustomizePanel(false);
}

// Única fuente de verdad de qué nota entra en qué filtro:
// la usan tanto la rejilla como los contadores, así no pueden desviarse.
function matchesFilter(note, filter) {
    // Las categorías entran por aquí ("cat:<id>") para heredar de golpe la
    // rejilla, los contadores y los puntos del calendario.
    if (filter.startsWith("cat:")) {
        return note.categoryId === filter.slice(4) && !note.archived && !note.deleted;
    }
    if (filter === "all") return !note.archived && !note.deleted;
    if (filter === "favorites") return Boolean(note.favorite) && !note.archived && !note.deleted;
    if (filter === "archived") return Boolean(note.archived) && !note.deleted;
    if (filter === "trash") return Boolean(note.deleted);
    return note.type === filter && !note.archived && !note.deleted;
}

// Busca sobre el texto visible, no sobre el HTML: si no, buscar "p" o "div"
// coincidía con todas las notas.
function noteSearchText(note) {
    const template = document.createElement("template");
    template.innerHTML = note.content || "";
    const category = findCategory(note.categoryId);
    return `${note.title || ""} ${template.content.textContent} ${category ? category.name : ""}`.toLowerCase();
}

function renderCounts() {
    document.querySelectorAll("[data-count]").forEach((element) => {
        element.textContent = notes.filter((note) => matchesFilter(note, element.dataset.count)).length;
    });
}


/* =====================================================
   CATEGORÍAS
===================================================== */

function renderCategories() {
    const list = document.querySelector("#categoriesList");

    if (!categories.length) {
        list.innerHTML = '<p class="category-empty">Sin categorías todavía. Crea una con ＋.</p>';
    } else {
        list.innerHTML = categories.map((category) => {
            const filter = `cat:${category.id}`;
            const count = notes.filter((note) => matchesFilter(note, filter)).length;
            const label = escapeHtml(categoryLabel(category));
            const name = escapeHtml(category.name);
            return `<div class="category${activeFilter === filter ? " active" : ""}">
                <button type="button" class="category-pick" data-pick-category="${category.id}" title="Ver las notas de ${name}">
                    <span class="category-dot ${category.dot}"></span>
                    <span class="category-name">${label}</span>
                    <span class="category-count">${count}</span>
                </button>
                <span class="category-tools">
                    <button type="button" data-edit-category="${category.id}" aria-label="Editar la categoría ${name}" title="Editar">✎</button>
                    <button type="button" data-remove-category="${category.id}" aria-label="Borrar la categoría ${name}" title="Borrar">×</button>
                </span>
            </div>`;
        }).join("");
    }

    renderFilterPicker();
}

// Filtro de móvil. Las vistas se leen de la navegación del sidebar, que sigue
// en el documento aunque allí esté oculta: así el icono, el nombre y el orden
// no se escriben dos veces.
function renderFilterPicker() {
    const chip = (filter, marca, texto) => {
        const elegido = filter === activeFilter;
        const cuenta = notes.filter((note) => matchesFilter(note, filter)).length;
        return `<button type="button" class="chip-option${elegido ? " selected" : ""}"
                data-pick-filter="${filter}" role="radio" aria-checked="${elegido}">
            ${marca}${escapeHtml(texto)}
            <span class="chip-count">${cuenta}</span>
        </button>`;
    };

    const vistas = [...document.querySelectorAll(".main-nav .nav-item")];
    document.querySelector("#filterViews").innerHTML = vistas.map((item) => chip(
        item.dataset.filter,
        `<span class="chip-icon">${escapeHtml(item.querySelector(".nav-icon").textContent)}</span>`,
        item.querySelector(".nav-label").textContent
    )).join("");

    document.querySelector("#filterCategories").innerHTML = categories.length
        ? categories.map((categoria) => chip(
            `cat:${categoria.id}`,
            `<span class="category-dot ${categoria.dot}"></span>`,
            categoryLabel(categoria)
        )).join("")
        : '<p class="picker-empty">Aún no tienes categorías. Se crean desde el ordenador.</p>';

    const vista = vistas.find((item) => item.dataset.filter === activeFilter);
    const categoria = findCategory(activeFilter.startsWith("cat:") ? activeFilter.slice(4) : "");
    document.querySelector("#filterLabel").textContent = vista
        ? vista.querySelector(".nav-label").textContent
        : categoria ? categoryLabel(categoria) : "Todas las notas";
}

function setFilterPicker(open) {
    document.querySelector("#filterPicker").hidden = !open;
    document.querySelector("#mobileFilter").setAttribute("aria-expanded", String(open));
}

function openCategoryForm(categoryId) {
    const category = categoryId ? findCategory(categoryId) : null;
    editingCategoryId = category ? category.id : null;
    categoryDot = category ? category.dot : CATEGORY_DOTS[0];

    document.querySelector("#categoryName").value = category ? category.name : "";
    document.querySelector("#categoryIcon").value = category ? category.icon || "" : "";
    document.querySelector("#categoryForm").hidden = false;
    document.querySelector("#saveCategory").textContent = category ? "Guardar" : "Crear";
    renderCategoryDots();
    document.querySelector("#categoryName").focus();
}

function closeCategoryForm() {
    editingCategoryId = null;
    document.querySelector("#categoryForm").hidden = true;
}

function renderCategoryDots() {
    document.querySelector("#categoryDots").innerHTML = CATEGORY_DOTS.map((dot) =>
        `<button type="button" class="category-dot ${dot}${dot === categoryDot ? " selected" : ""}" data-category-dot="${dot}" aria-label="Color ${dot}"></button>`
    ).join("");
}

function submitCategoryForm() {
    const name = document.querySelector("#categoryName").value.trim();
    if (!name) return;
    const icon = document.querySelector("#categoryIcon").value.trim();

    if (editingCategoryId) {
        const category = findCategory(editingCategoryId);
        if (category) Object.assign(category, { name, icon, dot: categoryDot });
    } else {
        categories.push({ id: crypto.randomUUID(), name, icon, dot: categoryDot });
    }

    persistCategories();
    closeCategoryForm();
    renderCards();
    renderEditor();
}

function removeCategory(categoryId) {
    const category = findCategory(categoryId);
    if (!category) return;

    const used = notes.filter((note) => note.categoryId === categoryId).length;
    const aviso = used
        ? `¿Borrar "${category.name}"? Sus ${used} ${used === 1 ? "nota se quedará" : "notas se quedarán"} sin categoría.`
        : `¿Borrar la categoría "${category.name}"?`;
    if (!window.confirm(aviso)) return;

    categories = categories.filter((item) => item.id !== categoryId);
    // Las notas no se borran: solo pierden la etiqueta. Si se quedaran apuntando
    // a una categoría inexistente serían invisibles para todos los filtros.
    notes.forEach((note) => {
        if (note.categoryId === categoryId) note.categoryId = null;
    });

    persistCategories();
    persistNotes();
    if (editingCategoryId === categoryId) closeCategoryForm();
    // Si estabas viendo esa categoría, el filtro se quedaría vacío para siempre.
    if (activeFilter === `cat:${categoryId}`) setFilter("all");
    else {
        renderCards();
        renderEditor();
    }
}

function setNoteCategory(categoryId) {
    const note = getActiveNote();
    if (!note) return;
    note.categoryId = categoryId || null;
    tocarNota(note);
    persistNotes();
    renderCards();
    renderEditor();
}


/* =====================================================
   CALENDARIO
===================================================== */

// Clave local "AAAA-MM-DD". No vale cortar el ISO: updatedAt está en UTC y
// una nota de las 23:30 aparecería al día siguiente.
function dateKey(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatLongDate(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function renderCalendar() {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();

    const monthName = new Date(year, month, 1).toLocaleDateString("es-ES", { month: "long" });
    document.querySelector("#calendarLabel").textContent = `${capitalize(monthName)} ${year}`;

    // Los puntos respetan el filtro activo: si estás en "Recetas", el calendario
    // muestra dónde caen las recetas, no todas las notas.
    const notesPerDay = new Map();
    notes.filter((note) => matchesFilter(note, activeFilter)).forEach((note) => {
        const key = dateKey(note.updatedAt);
        notesPerDay.set(key, (notesPerDay.get(key) || 0) + 1);
    });

    const remindersPerDay = new Map();
    reminders.forEach((item) => {
        remindersPerDay.set(item.date, (remindersPerDay.get(item.date) || 0) + 1);
    });

    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = dateKey(new Date());

    const cells = [];
    for (let i = 0; i < firstWeekday; i += 1) {
        cells.push('<span class="calendar-day is-blank"></span>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const count = notesPerDay.get(key) || 0;
        const reminderCount = remindersPerDay.get(key) || 0;
        const classes = ["calendar-day"];
        if (key === todayKey) classes.push("is-today");
        if (key === activeDate) classes.push("is-selected");
        classes.push(count || reminderCount ? "has-notes" : "is-quiet");

        // Todos los días son pulsables, tengan contenido o no: los vacíos llevan
        // a un estado vacío que confirma que ese día no hay nada.
        const parts = [];
        if (count) parts.push(`${count} ${count === 1 ? "nota" : "notas"}`);
        if (reminderCount) parts.push(`${reminderCount} ${reminderCount === 1 ? "recordatorio" : "recordatorios"}`);

        const marks = `<span class="calendar-marks" aria-hidden="true">${count ? '<span class="calendar-dot is-note"></span>' : ""}${reminderCount ? '<span class="calendar-dot is-reminder"></span>' : ""}</span>`;
        cells.push(`<button type="button" class="${classes.join(" ")}" data-day="${key}" aria-pressed="${key === activeDate}" aria-label="${day} de ${monthName}, ${parts.join(" y ") || "sin nada"}">${day}${marks}</button>`);
    }

    document.querySelector("#calendarGrid").innerHTML = cells.join("");
    document.querySelector("#calendarHint").innerHTML = activeDate
        ? `Mostrando el ${formatLongDate(activeDate)}`
        : '<span class="calendar-dot is-note"></span> notas &nbsp; <span class="calendar-dot is-reminder"></span> recordatorios';
    document.querySelector("#calendarClear").hidden = !activeDate;
    document.querySelector("#recentHeading").textContent = activeDate ? capitalize(formatLongDate(activeDate)) : "Recientes";
}

/* =====================================================
   RECORDATORIOS
===================================================== */

// El panel siempre muestra un día: el seleccionado en el calendario, o hoy.
function reminderDate() {
    return activeDate || dateKey(new Date());
}

// Primero los que tienen hora, en orden; los sueltos al final.
function remindersFor(key) {
    return reminders
        .filter((item) => item.date === key)
        .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
}

function renderNoteColors() {
    document.querySelector("#noteColors").innerHTML = Object.keys(COLOR_VALUES).map((name) => `
        <button type="button" class="color" data-color="${name}" aria-label="${COLOR_NAMES[name]}"
            title="${COLOR_NAMES[name]}" style="background: ${COLOR_VALUES[name]}"></button>`).join("");
}

// Los botones de las decoraciones dibujadas se rellenan desde DECORATION_SVG,
// que es lo que también se pinta en la hoja y en la tarjeta. Antes el SVG
// estaba escrito dos veces (en el HTML y aquí) y podían acabar distintos.
// `data-drawn` es para botones que solo quieren el dibujo de icono, sin ser una
// decoración: con data-decoration el botón de pegatinas habría cambiado además
// la decoración de la nota al pulsarlo.
function renderDecorationSvgs() {
    document.querySelectorAll("[data-decoration], [data-drawn]").forEach((boton) => {
        const dibujo = DECORATION_SVG[boton.dataset.drawn || boton.dataset.decoration];
        if (dibujo) boton.innerHTML = dibujo;
    });
}

// Pegatinas: imágenes sueltas recortadas de la lámina. Mientras la lista esté
// vacía el botón de la barra no aparece, para no ofrecer un panel sin nada.
const STICKER_PATH = "img/stickers/";
const STICKERS = [
    { file: "capibara-01.png", name: "capibara con mandarina" },
    { file: "capibara-02.png", name: "capibara leyendo" },
    { file: "capibara-03.png", name: "capibara dormido" },
    { file: "capibara-04.png", name: "capibara con bubble tea" },
    { file: "capibara-05.png", name: "capibara con lacito" },
    { file: "capibara-06.png", name: "capibara con flor" },
    { file: "capibara-07.png", name: "capibara llorando" },
    { file: "capibara-08.png", name: "capibara de fiesta" },
    { file: "capibara-09.png", name: "capibara con fresa" },
    { file: "capibara-10.png", name: "capibara abrazando a su bebé" },
    { file: "capibara-11.png", name: "capibara con gafas de sol" },
    { file: "capibara-12.png", name: "capibara con corona de flores" },
    { file: "capibara-13.png", name: "capibara con gorro de rana" },
    { file: "capibara-14.png", name: "capibara con libros" },
    { file: "capibara-15.png", name: "capibara tumbado con naranja" },
    { file: "capibara-16.png", name: "capibara con mochila" },
    { file: "capibara-17.png", name: "capibara con lápiz" },
    { file: "capibara-18.png", name: "capibara con manta y taza" },
    { file: "capibara-19.png", name: "capibara con brote" },
    { file: "capibara-20.png", name: "capibara sentado con naranja" },
    { file: "capibara-21.png", name: "capibara en una taza" }
];

function renderStickers() {
    document.querySelector("#toggleStickers").hidden = !STICKERS.length;
    document.querySelector("#stickerGrid").innerHTML = STICKERS.map((pegatina) =>
        `<button type="button" data-sticker="${pegatina.file}" title="${escapeHtml(pegatina.name)}"
            aria-label="Insertar ${escapeHtml(pegatina.name)}">
            <img src="${STICKER_PATH}${pegatina.file}" alt="" loading="lazy">
        </button>`).join("");
}

function setStickerPopover(open) {
    document.querySelector("#stickerGrid").hidden = !open;
    document.querySelector("#toggleStickers").setAttribute("aria-expanded", String(open));
}

function renderEmojis() {
    document.querySelector("#emojiGrid").innerHTML = EMOJIS.map((emoji) => {
        const dibujo = DECORATION_SVG[emoji];
        const nombre = dibujo ? DRAWN_NAMES[emoji] : emoji;
        return `<button type="button" data-emoji="${emoji}" aria-label="Insertar ${nombre}">${dibujo || emoji}</button>`;
    }).join("");
}

// Mete un nodo donde esté el cursor dentro del editor. Si la selección se ha
// perdido, lo añade al final del contenido.
function insertIntoNote(nodo) {
    if (!getActiveNote()) return;

    const target = lastEditableTarget || editorContent;
    target.focus();

    const selection = window.getSelection();
    const range = selection.rangeCount ? selection.getRangeAt(0) : null;

    if (range && target.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(nodo);
        range.setStartAfter(nodo);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        target.append(nodo);
    }

    saveActiveNote();
}

function insertEmoji(emoji) {
    // Los dibujados no son un carácter: va la imagen, que escala con el texto
    // que la rodea. Sobrevive a sanitizeNoteHtml, que solo quita `style` y los
    // atributos `on*`.
    insertIntoNote(DECORATION_SVG[emoji] ? drawnImage(emoji) : document.createTextNode(emoji));
}

/* =====================================================
   PEGATINAS COLOCADAS EN LA NOTA
   No van dentro del texto: son objetos sueltos con su sitio, tamaño y giro,
   guardados en note.stickers. Las medidas van en % de la capa para que sigan
   en su sitio cuando la hoja cambia de ancho (móvil, escala de letra...).
===================================================== */

let selectedStickerId = null;
let stickerDrag = null;

function noteStickers() {
    const note = getActiveNote();
    if (!note) return [];
    if (!Array.isArray(note.stickers)) note.stickers = [];
    return note.stickers;
}

function stickerStyle(pegatina) {
    return `left:${pegatina.x}%; top:${pegatina.y}%; width:${pegatina.w}%; transform: rotate(${pegatina.r}deg)`;
}

function renderStickerLayer() {
    const capa = document.querySelector("#stickerLayer");
    if (!getActiveNote()) {
        capa.innerHTML = "";
        return;
    }

    capa.innerHTML = noteStickers().map((pegatina) => {
        const info = STICKERS.find((item) => item.file === pegatina.file);
        const elegida = pegatina.id === selectedStickerId;
        return `<div class="note-sticker-item${elegida ? " is-selected" : ""}" data-sticker-id="${pegatina.id}"
                style="${stickerStyle(pegatina)}">
            <img src="${STICKER_PATH}${pegatina.file}" alt="${escapeHtml(info ? info.name : "pegatina")}" draggable="false">
            <button type="button" class="sticker-handle sticker-remove" data-sticker-remove="${pegatina.id}"
                    aria-label="Quitar esta pegatina">×</button>
            <span class="sticker-handle sticker-rotate" data-sticker-rotate="${pegatina.id}" aria-hidden="true">⟳</span>
            <span class="sticker-handle sticker-resize" data-sticker-resize="${pegatina.id}" aria-hidden="true"></span>
        </div>`;
    }).join("");

    ajustarCapaPegatinas();
}

// La hoja se desplaza cuando la nota es larga. Con `inset: 0` la capa solo
// cubriría lo que se ve, así que se estira hasta el alto real del texto: si no,
// no se podría pegar nada en la mitad de abajo de una nota larga.
function ajustarCapaPegatinas() {
    const capa = document.querySelector("#stickerLayer");
    const alto = Math.max(capa.parentElement.clientHeight, editorContent.scrollHeight);
    capa.style.height = `${alto}px`;
}

function addSticker(pegatina) {
    if (!getActiveNote()) return;
    const lista = noteStickers();
    // En diagonal según cuántas haya, para que no caigan unas sobre otras.
    const n = lista.length;
    const nueva = {
        id: crypto.randomUUID(),
        file: pegatina.file,
        x: 16 + (n % 4) * 15,
        y: 14 + (n % 5) * 13,
        w: 26,
        r: 0
    };
    lista.push(nueva);
    selectedStickerId = nueva.id;
    persistNotes();
    renderStickerLayer();
    renderCards();
}

function removeSticker(id) {
    const note = getActiveNote();
    if (!note) return;
    note.stickers = noteStickers().filter((item) => item.id !== id);
    if (selectedStickerId === id) selectedStickerId = null;
    persistNotes();
    renderStickerLayer();
    renderCards();
}

function selectSticker(id) {
    selectedStickerId = id;
    document.querySelectorAll("#stickerLayer .note-sticker-item").forEach((el) =>
        el.classList.toggle("is-selected", el.dataset.stickerId === id));
}

function renderReminderColors() {
    document.querySelector("#reminderColors").innerHTML = Object.keys(COLOR_VALUES).map((name) => `
        <button type="button" class="reminder-color${name === reminderColor ? " is-chosen" : ""}" data-reminder-color="${name}"
            role="radio" aria-checked="${name === reminderColor}" aria-label="${COLOR_NAMES[name] || name}"
            style="background: ${COLOR_VALUES[name]}"></button>`).join("");
}

function renderReminders() {
    const key = reminderDate();
    const list = remindersFor(key);
    const isToday = key === dateKey(new Date());

    document.querySelector("#remindersDate").textContent = isToday ? "de hoy" : `del ${formatLongDate(key)}`;

    document.querySelector("#remindersList").innerHTML = list.length
        ? list.map((item) => {
            const color = COLOR_VALUES[colorKey(item.color)];
            return `<article class="reminder${item.done ? " is-done" : ""}" data-reminder-id="${item.id}" style="--reminder-color: ${color}">
                <button type="button" class="reminder-check" data-toggle-id="${item.id}" role="checkbox" aria-checked="${Boolean(item.done)}" aria-label="${item.done ? "Marcar como pendiente" : "Marcar como hecho"}">${item.done ? "✓" : ""}</button>
                <span class="reminder-body">
                    ${item.time ? `<span class="reminder-time">${escapeHtml(item.time)}</span>` : ""}
                    <span class="reminder-text">${escapeHtml(item.title)}</span>
                </span>
                <span class="reminder-actions">
                    <button type="button" data-edit-id="${item.id}" aria-label="Editar recordatorio" title="Editar">✎</button>
                    <button type="button" class="reminder-remove" data-remove-id="${item.id}" aria-label="Eliminar recordatorio" title="Eliminar">🗑</button>
                </span>
            </article>`;
        }).join("")
        // Sin "abajo": en móvil el formulario está plegado tras un botón, no debajo.
        : `<p class="reminders-empty">No hay recordatorios ${isToday ? "para hoy" : "este día"}.</p>`;
}

function resetReminderForm() {
    editingReminderId = null;
    reminderColor = "coral";
    document.querySelector("#reminderForm").reset();
    document.querySelector("#reminderSubmit").textContent = "Añadir";
    document.querySelector("#reminderCancel").hidden = true;
    renderReminderColors();
}

// En móvil el formulario vive plegado; en escritorio la clase no pinta nada
// porque allí siempre está a la vista.
function setReminderForm(abierto) {
    document.querySelector(".reminders-panel").classList.toggle("form-abierto", abierto);
}

// El mismo formulario sirve para crear y para editar.
function startEditReminder(id) {
    const item = reminders.find((reminder) => reminder.id === id);
    if (!item) return;
    // Sin esto, en móvil editar un recordatorio no mostraba nada.
    setReminderForm(true);
    editingReminderId = id;
    reminderColor = item.color || "coral";
    document.querySelector("#reminderTime").value = item.time || "";
    document.querySelector("#reminderText").value = item.title;
    document.querySelector("#reminderSubmit").textContent = "Guardar";
    document.querySelector("#reminderCancel").hidden = false;
    renderReminderColors();
    document.querySelector("#reminderText").focus();
}

function submitReminder() {
    const title = document.querySelector("#reminderText").value.trim();
    if (!title) return;
    const time = document.querySelector("#reminderTime").value;
    const now = new Date().toISOString();

    if (editingReminderId) {
        const item = reminders.find((reminder) => reminder.id === editingReminderId);
        if (item) Object.assign(item, { title, time, color: reminderColor, updatedAt: now });
    } else {
        reminders.push({
            id: crypto.randomUUID(),
            date: reminderDate(),
            time,
            title,
            color: reminderColor,
            done: false,
            createdAt: now,
            updatedAt: now
        });
    }

    persistReminders();
    resetReminderForm();
    renderReminders();
    renderCalendar();
}

function toggleReminder(id) {
    const item = reminders.find((reminder) => reminder.id === id);
    if (!item) return;
    item.done = !item.done;
    item.updatedAt = new Date().toISOString();
    persistReminders();
    renderReminders();
}

function removeReminder(id) {
    reminders = reminders.filter((reminder) => reminder.id !== id);
    if (editingReminderId === id) resetReminderForm();
    persistReminders();
    renderReminders();
    renderCalendar();
}

function selectDate(key) {
    // Volver a pulsar el día seleccionado quita el filtro.
    activeDate = activeDate === key ? null : key;
    renderCards();
}

function clearDate() {
    activeDate = null;
    renderCards();
}

function moveCalendar(offset) {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + offset, 1);
    renderCalendar();
}

// Con qué va sujeta cada tarjeta de Recientes al tablero. Van en currentColor:
// el color lo pone --pin-color, que por defecto es el de la nota y se puede
// cambiar desde el panel que se abre al pulsar la propia sujeción.
const FASTENER_SVG = {
    tape: `<svg class="note-fastener" viewBox="0 0 60 22" aria-hidden="true">
        <path d="M3 3L57 1L55 5L58 9L55 13L58 17L56 21L2 21L5 17L1 13L4 9L1 5Z" fill="currentColor" opacity="0.78"/>
        <path d="M9 19L17 3M21 19L29 3M33 19L41 3M45 19L53 3" stroke="#FFFFFF" stroke-width="3" opacity="0.3"/>
    </svg>`,
    pin: `<svg class="note-fastener" viewBox="0 0 28 28" aria-hidden="true">
        <ellipse cx="16" cy="18.5" rx="7.5" ry="3" fill="rgba(60, 40, 30, 0.22)"/>
        <circle cx="14" cy="12.5" r="8" fill="currentColor"/>
        <circle cx="14" cy="12.5" r="8" fill="none" stroke="rgba(0, 0, 0, 0.2)" stroke-width="1"/>
        <circle cx="11" cy="9.5" r="2.7" fill="#FFFFFF" opacity="0.55"/>
    </svg>`,
    clip: `<svg class="note-fastener" viewBox="0 0 20 46" aria-hidden="true">
        <path d="M7 15v19a3.5 3.5 0 0 0 7 0V9.5a5.5 5.5 0 0 0-11 0V35.5a7.5 7.5 0 0 0 15 0V17"
              fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>
    </svg>`
};

// Sale del id de la nota y no de su posición: así cada nota conserva su
// tachuela o su clip aunque se filtre, se reordene o se vuelva a pintar. Una
// de cada tres lleva clip, para que el tablero varíe sin parecer un caos.
function fastenerFor(id) {
    let suma = 0;
    for (const letra of String(id)) suma += letra.charCodeAt(0);
    return suma % 3 === 0 ? "clip" : "pin";
}

// `label` lleva el artículo para las etiquetas de accesibilidad: "clip" es
// masculino y con un "la" fijo salía "Cambiar la clip".
const FASTENER_TYPES = [
    { key: "pin", name: "Tachuela", label: "la tachuela" },
    { key: "clip", name: "Clip", label: "el clip" },
    { key: "tape", name: "Cinta", label: "la cinta" }
];

// Además de los colores de nota, los dos que tiene una sujeción de verdad.
const FASTENER_METALS = {
    silver: { name: "Plateado", hex: "#A7ADB4" },
    gold: { name: "Dorado", hex: "#CFA046" }
};

// Lo que eligió el usuario manda; si no eligió nada, la de por defecto. El
// color se guarda como clave y no como hex, para que siga a la paleta si algún
// día cambian los tonos. null = el color de la nota.
function noteFastener(note) {
    const elegida = note.fastener || {};
    const colorValido = Boolean(FASTENER_METALS[elegida.color] || COLOR_VALUES[elegida.color]);
    // x/y: dónde la colocó el usuario, en % del envoltorio de la tarjeta. Sin
    // ellos va en su sitio de siempre (el que da el CSS para cada tipo).
    const x = Number(elegida.x);
    const y = Number(elegida.y);
    const libre = elegida.x !== undefined && elegida.x !== null && Number.isFinite(x) && Number.isFinite(y);
    return {
        type: FASTENER_SVG[elegida.type] ? elegida.type : fastenerFor(note.id),
        color: colorValido ? elegida.color : null,
        ...(libre ? { x, y } : {})
    };
}

// Coloca la sujeción en su sitio elegido y hace que la tarjeta cuelgue de ahí:
// el balanceo (al pasar el ratón o al deslizar) gira desde ese punto.
// `translate` y no transform: el clip y la cinta ya van girados con transform.
function aplicarPosicionSujecion(boton, envoltorio, x, y) {
    boton.style.left = `${x}%`;
    boton.style.top = `${y}%`;
    boton.style.right = "auto";
    boton.style.margin = "0";
    boton.style.translate = "-50% -50%";
    envoltorio.style.transformOrigin = `${x}% ${y}%`;
}

function noteAccent(note) {
    return COLOR_VALUES[colorKey((note.customization || {}).color || DEFAULT_CUSTOMIZATION.color)];
}

function fastenerHex(note) {
    const { color } = noteFastener(note);
    if (FASTENER_METALS[color]) return FASTENER_METALS[color].hex;
    if (COLOR_VALUES[color]) return COLOR_VALUES[color];
    return noteAccent(note);
}

/* Panel para cambiar la sujeción de una nota. Va con position:fixed y fuera de
   la rejilla: dentro, renderCards() lo borraría en cada repintado y el balanceo
   de la tarjeta (un transform) lo dejaría tapado bajo las tarjetas vecinas. */

let fastenerNoteId = null;

function renderFastenerPicker() {
    const note = notes.find((item) => item.id === fastenerNoteId);
    if (!note) return;
    const actual = noteFastener(note);
    const hex = fastenerHex(note);

    document.querySelector("#fastenerTypes").innerHTML = FASTENER_TYPES.map((tipo) => {
        const elegido = tipo.key === actual.type;
        return `<button type="button" class="fastener-type${elegido ? " selected" : ""}"
                data-set-fastener-type="${tipo.key}" aria-pressed="${elegido}" style="color: ${hex}">
            ${FASTENER_SVG[tipo.key]}
            <span>${tipo.name}</span>
        </button>`;
    }).join("");

    const muestra = (clave, nombre, fondo) => {
        const elegido = (actual.color || "auto") === clave;
        return `<button type="button" class="fastener-swatch${elegido ? " selected" : ""}"
                data-set-fastener-color="${clave}" aria-pressed="${elegido}"
                aria-label="${nombre}" title="${nombre}" style="background: ${fondo}"></button>`;
    };

    document.querySelector("#fastenerColors").innerHTML =
        muestra("auto", "Como la nota", noteAccent(note))
        + Object.entries(FASTENER_METALS).map(([clave, metal]) => muestra(clave, metal.name, metal.hex)).join("")
        + Object.keys(COLOR_VALUES).map((clave) => muestra(clave, COLOR_NAMES[clave], COLOR_VALUES[clave])).join("");

    // Solo tiene sentido si la sujeción se ha movido de su sitio
    document.querySelector("#fastenerReset").hidden = !Number.isFinite(actual.x);
}

function resetFastenerPosition() {
    const note = notes.find((item) => item.id === fastenerNoteId);
    if (!note) return;
    const { x, y, ...resto } = noteFastener(note);
    note.fastener = resto;
    persistNotes();
    renderCards();
    renderFastenerPicker();
}

function setFastenerPicker(open) {
    document.querySelector("#fastenerPicker").hidden = !open;
    if (!open) fastenerNoteId = null;
}

function openFastenerPicker(noteId) {
    fastenerNoteId = noteId;
    renderFastenerPicker();
    document.querySelector("#fastenerPicker").hidden = false;
    placeFastenerPicker();
}

// Debajo de la sujeción y, si no cabe, encima. Nunca fuera de la pantalla.
function placeFastenerPicker() {
    const panel = document.querySelector("#fastenerPicker");
    const ancla = document.querySelector(`[data-fastener-id="${fastenerNoteId}"]`);
    const r = ancla ? ancla.getBoundingClientRect() : null;
    // Sin tachuela a la vista (se borró la nota, o se ha desplazado fuera de la
    // pantalla) el panel ya no tiene junto a qué quedarse.
    if (!r || r.bottom < 0 || r.top > window.innerHeight) {
        setFastenerPicker(false);
        return;
    }
    const ancho = panel.offsetWidth;
    const alto = panel.offsetHeight;
    const izquierda = Math.max(12, Math.min(window.innerWidth - ancho - 12, r.left + r.width / 2 - ancho / 2));
    let arriba = r.bottom + 8;
    if (arriba + alto > window.innerHeight - 12) arriba = Math.max(12, r.top - alto - 8);
    panel.style.left = `${Math.round(izquierda)}px`;
    panel.style.top = `${Math.round(arriba)}px`;
}

function setNoteFastener(cambio) {
    const note = notes.find((item) => item.id === fastenerNoteId);
    if (!note) return;
    // Con `...actual` se conserva también la posición elegida al cambiar el
    // tipo o el color: si no, cambiar a cinta la devolvería a su sitio.
    const actual = noteFastener(note);
    note.fastener = { ...actual, ...cambio };
    // Sin tocar updatedAt: es un adorno, no un cambio en la nota, y no debe
    // moverla de sitio en el calendario.
    persistNotes();
    renderCards();
    renderFastenerPicker();
}

function renderCards() {
    const query = searchInput.value.trim().toLowerCase();
    const visibleNotes = notes.filter((note) => matchesFilter(note, activeFilter)
        && (!activeDate || dateKey(note.updatedAt) === activeDate)
        && noteSearchText(note).includes(query));

    renderCounts();
    renderCategories();
    renderCalendar();
    renderReminders();

    if (!visibleNotes.length) {
        let message = "Aquí no hay nada todavía. ¡Crea tu primera nota!";
        if (query) message = "No hay notas que coincidan con tu búsqueda.";
        else if (activeDate) message = `No hay notas del ${formatLongDate(activeDate)}.`;
        notesGrid.innerHTML = `<p class="empty-state">${message}</p>`;
        return;
    }

    notesGrid.innerHTML = visibleNotes.map((note) => {
        const preview = sanitizeNoteHtml(note.content);
        // fontSize no se usa aquí a propósito: el tamaño por nota vive solo en el
        // editor. Las tarjetas siguen la escala general para que Recientes se vea
        // homogéneo aunque cada nota tenga su tamaño. `decoration` tampoco: ni la
        // decoración ni las pegatinas se previsualizan, Recientes muestra el
        // texto y el color de la nota y nada más.
        const { color, background, style, font } = { ...DEFAULT_CUSTOMIZATION, ...note.customization };
        const fontFamily = font === "Handlee" ? "'Handlee', cursive" : font;
        const key = colorKey(color);
        const accent = COLOR_VALUES[key];
        const category = findCategory(note.categoryId);
        const chip = category
            ? `<span class="note-category"><span class="category-dot ${category.dot}"></span>${escapeHtml(categoryLabel(category))}</span>`
            : "";
        // El envoltorio lleva la sujeción y es lo que se balancea. Si la
        // sujeción fuera dentro de la tarjeta, su overflow:hidden (y la máscara
        // de la forma Galleta) la recortarían por arriba.
        const datosSujecion = noteFastener(note);
        const sujecion = datosSujecion.type;
        const etiquetaSujecion = FASTENER_TYPES.find((tipo) => tipo.key === sujecion).label;
        const libre = Number.isFinite(datosSujecion.x);
        const estiloSujecion = libre
            ? `left:${datosSujecion.x}%; top:${datosSujecion.y}%; right:auto; margin:0; translate:-50% -50%;`
            : "";
        const pivote = libre ? ` transform-origin: ${datosSujecion.x}% ${datosSujecion.y}%;` : "";
        return `<div class="note-pinned note-pinned--${sujecion}" style="--pin-color: ${fastenerHex(note)};${pivote}">
            <button type="button" class="note-fastener-btn" data-fastener-id="${note.id}" style="${estiloSujecion}"
                    aria-label="Cambiar ${etiquetaSujecion} de «${escapeHtml(note.title)}»"
                    title="Pulsa para cambiarla · arrástrala para moverla">${FASTENER_SVG[sujecion]}</button>
            <article class="note-card ${note.type}-card note-style-${style} note-background-${background}" data-note-id="${note.id}" tabindex="0" style="--note-card-background: ${COLOR_BACKGROUNDS[key]}; --note-card-pattern: ${accent}; --note-card-pattern-soft: ${accent}40; --note-card-font: ${fontFamily};">
            <span class="note-type">${TYPE_LABELS[note.type] || "NOTA"}</span>
            <h3>${escapeHtml(note.title)}</h3>
            <div class="note-preview">${preview}</div>
            <div class="note-footer"><span class="note-meta"><span>${formatDate(note.updatedAt)}</span>${chip}</span>
                <span class="card-actions">
                    <button class="card-favorite" data-favorite-id="${note.id}" aria-label="${note.favorite ? "Quitar de favoritas" : "Añadir a favoritas"}">${note.favorite ? "♥" : "♡"}</button>
                    <button data-archive-id="${note.id}" aria-label="${note.deleted ? "Restaurar nota" : note.archived ? "Desarchivar nota" : "Archivar nota"}" title="${note.deleted ? "Restaurar nota" : note.archived ? "Desarchivar nota" : "Archivar nota"}">${note.deleted || note.archived ? "↩" : "📦"}</button>
                    <button class="card-delete" data-delete-id="${note.id}" aria-label="${note.deleted ? "Eliminar definitivamente" : "Enviar a papelera"}" title="${note.deleted ? "Eliminar definitivamente" : "Enviar a papelera"}">${note.deleted ? "×" : "🗑"}</button>
                </span>
            </div>
        </article>
        </div>`;
    }).join("");

    // Si el panel de sujeción está abierto, el repintado acaba de sustituir la
    // tachuela junto a la que estaba: se vuelve a colocar al lado de la nueva.
    if (fastenerNoteId && !document.querySelector("#fastenerPicker").hidden) placeFastenerPicker();
}

function renderEditor() {
    const note = getActiveNote();
    if (!note) {
        customizationDraft = {};
        customizationDraftNoteId = null;
        customizationDirty = false;
        editorTitle.textContent = "Selecciona o crea una nota";
        editorContent.innerHTML = "";
        return;
    }

    // Solo se resincroniza al cambiar de nota; así un re-render (marcar favorita,
    // teclear en una tarjeta...) no descarta los cambios en curso del panel.
    if (customizationDraftNoteId !== note.id) {
        customizationDraft = { ...(note.customization || {}) };
        customizationDraftNoteId = note.id;
        customizationDirty = false;
        // Cambiar de nota sí reinicia los resaltes: son de la nota que estabas
        // escribiendo, no del editor en general.
        clearCommandStates();
    }

    editorTitle.textContent = note.title;
    editorContent.innerHTML = note.content;
    document.querySelector(".editor-type").textContent = `${TYPE_ICONS[note.type] || "▧"} ${CATEGORY_LABELS[note.type] || "Notas"}`;
    renderEditorCategory();
    renderStickerLayer();
    document.querySelector(".favorite-star").textContent = note.favorite ? "★" : "☆";
    // Por id y no por posición: al añadir el selector de categoría, el
    // "span:nth-child(2)" de antes dejó de apuntar a la fecha.
    document.querySelector("#editorDate").textContent = formatDate(note.updatedAt);
    applyNoteCustomization(customizationDirty ? customizationDraft : (note.customization || {}));
}

function getCustomizationNote() {
    return getActiveNote() || { customization: {} };
}

function applyNoteCustomization(customization) {
    const { color, background, style, font, fontSize, decoration } = { ...DEFAULT_CUSTOMIZATION, ...customization };
    const key = colorKey(color);
    const accent = COLOR_VALUES[key];

    // Las variables van en .paper, no en #editorContent: las decoraciones viven
    // fuera del contenedor editable y también necesitan heredarlas.
    const paper = document.querySelector(".paper");
    paper.style.setProperty("--note-background-color", COLOR_BACKGROUNDS[key]);
    paper.style.setProperty("--note-line-color", `${accent}40`);
    paper.style.setProperty("--note-accent", accent);
    paper.style.setProperty("--pattern-opacity", patternOpacity(COLOR_BACKGROUNDS[key]));

    editorContent.className = `paper-content note-style-${style} note-background-${background}`;
    editorContent.style.setProperty("font-family", font === "Handlee" ? '"Handlee", cursive' : font, "important");
    // En rem para que el tamaño por nota se multiplique por la escala global.
    editorContent.style.fontSize = `${fontSize / 16}rem`;
    document.querySelector("#fontSizeValue").textContent = fontSize;
    document.querySelector("#fontName").textContent = font;

    // Sin acotar a .customize-panel: así el panel lateral y el de abajo
    // muestran siempre la misma selección.
    document.querySelectorAll("[data-color]").forEach((button) => {
        button.classList.toggle("selected-color", button.dataset.color === key);
        button.title = "Cambiar color del fondo conservando el patrón";
    });
    document.querySelectorAll("[data-background]").forEach((button) => button.classList.toggle("selected", button.dataset.background === background));
    document.querySelectorAll("[data-style]").forEach((button) => button.classList.toggle("selected", button.dataset.style === style));
    const mark = DECORATION_ALIASES[decoration] || decoration;
    document.querySelectorAll("[data-decoration]").forEach((button) => button.classList.toggle("selected-decoration", button.dataset.decoration === mark));

    renderPaperPattern(mark);
}

// Reparte la decoración por toda la hoja, detrás del texto, en vez de ponerla
// en un par de sitios sueltos.
function renderPaperPattern(mark) {
    const markup = decorationMarkup(mark);
    document.querySelector("#paperPattern").innerHTML = PATTERN_SPOTS.map(([top, left, size, rotate]) =>
        `<span style="top: ${top}%; left: ${left}%; font-size: ${size}px; transform: rotate(${rotate}deg)">${markup}</span>`).join("");
}

function startCustomization() {
    customizationDraft = { ...(getCustomizationNote().customization || {}) };
    customizationDraftNoteId = activeNoteId;
    customizationDirty = false;
    applyNoteCustomization(customizationDraft);
}

// commit: el panel de abajo no tiene botón "Aplicar", así que guarda al momento.
// El panel lateral acumula en el borrador hasta que se pulsa "Aplicar cambios".
function updateCustomization(key, value, { commit = false } = {}) {
    customizationDraft[key] = value;
    customizationDirty = true;
    applyNoteCustomization(customizationDraft);
    if (commit) saveCustomization({ closePanel: false });
}

function saveCustomization({ closePanel = true } = {}) {
    const note = getActiveNote();
    if (!note) return;
    note.customization = { ...customizationDraft };
    tocarNota(note);
    customizationDirty = false;
    persistNotes();
    renderCards();
    if (closePanel) setCustomizePanel(false);
}

function saveAllChanges() {
    saveNoteNow();
    // Solo se guarda la personalización si de verdad se tocó algo: antes esto
    // escribía un borrador vacío encima de la nota y borraba sus ajustes.
    if (customizationDirty) saveCustomization();
}

// Único punto que abre y cierra el panel: antes se tocaba la clase desde cuatro
// sitios y el fondo atenuado se habría quedado descolgado en alguno de ellos.
function setCustomizePanel(open) {
    document.querySelector("#notePanel").classList.toggle("is-open", open);
    document.querySelector("#sheetBackdrop").classList.toggle("is-open", open);
    // El ••• se queda resaltado mientras su panel está abierto, como el de
    // emojis con su aria-expanded.
    document.querySelector("#openCustomizeMenu").classList.toggle("is-active", open);
}

function openCustomizePanel() {
    setAppPanel(false);
    setProfilePanel(false);
    startCustomization();
    setCustomizePanel(true);
}

// Los dos paneles comparten el mismo fondo atenuado de móvil, así que nunca
// pueden estar abiertos a la vez.
function setAppPanel(open) {
    document.querySelector("#appPanel").classList.toggle("is-open", open);
    document.querySelector("#sheetBackdrop").classList.toggle("is-open", open);
}

function openAppPanel() {
    setCustomizePanel(false);
    setProfilePanel(false);
    setAppPanel(true);
}

function setProfilePanel(open) {
    document.querySelector("#profilePanel").classList.toggle("is-open", open);
    document.querySelector("#sheetBackdrop").classList.toggle("is-open", open);
    // La inicial se queda resaltada mientras su panel está abierto
    const inicial = document.querySelector("#avatarInitial");
    inicial.classList.toggle("is-active", open);
    inicial.setAttribute("aria-expanded", String(open));
}

function openProfilePanel() {
    setCustomizePanel(false);
    setAppPanel(false);
    // El campo se rellena al abrir y no al escribir: así no pelea con lo que
    // ella esté tecleando ni con lo que llegue de la nube.
    document.querySelector("#userName").value = settings.userName || "";
    setProfilePanel(true);
}

function toggleProfilePanel() {
    if (document.querySelector("#profilePanel").classList.contains("is-open")) setProfilePanel(false);
    else openProfilePanel();
}

function createNote(type, title, categoryId) {
    if (!title || !title.trim()) return;

    const note = {
        id: crypto.randomUUID(),
        type,
        title: title.trim(),
        content: `<p>Escribe aquí tu ${type}...</p>`,
        categoryId: categoryId || null,
        favorite: false,
        archived: false,
        deleted: false,
        customization: { ...DEFAULT_CUSTOMIZATION, background: "lines" },
        updatedAt: new Date().toISOString()
    };
    notes.unshift(note);
    activeNoteId = note.id;
    openEditor();
    persistNotes();
    renderCards();
    renderEditor();
}

function saveActiveNote() {
    const note = getActiveNote();
    if (!note) return;
    note.title = editorTitle.textContent.trim() || "Sin título";
    note.content = editorContent.innerHTML;
    tocarNota(note);
    saveStatus.textContent = "Guardando...";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        persistNotes();
        renderCards();
    }, 250);
}

function saveNoteNow() {
    const note = getActiveNote();
    if (!note) return;
    clearTimeout(saveTimer);
    note.title = editorTitle.textContent.trim() || "Sin título";
    note.content = sanitizeNoteHtml(editorContent.innerHTML);
    tocarNota(note);
    saveStatus.textContent = "Guardando...";
    persistNotes();
    renderCards();
    saveStatus.textContent = "✓ Guardado";
}

function sanitizeNoteHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html || "";
    template.content.querySelectorAll("script, style, iframe, object, embed, form").forEach((element) => element.remove());
    template.content.querySelectorAll("*").forEach((element) => {
        [...element.attributes].forEach((attribute) => {
            if (attribute.name.startsWith("on") || attribute.name === "style") element.removeAttribute(attribute.name);
        });
    });
    return template.innerHTML;
}

// Devuelve la nota con todos los campos presentes y del tipo esperado.
// Las notas semilla no traen archived/deleted/customization, así que el
// export saldría con dos formas distintas si no se normaliza aquí.
function normalizeNoteForExport(note) {
    return {
        id: note.id,
        type: note.type,
        title: note.title || "",
        content: note.content || "",
        categoryId: note.categoryId || null,
        stickers: Array.isArray(note.stickers) ? note.stickers : [],
        fastener: note.fastener || null,
        favorite: Boolean(note.favorite),
        archived: Boolean(note.archived),
        deleted: Boolean(note.deleted),
        customization: { ...DEFAULT_CUSTOMIZATION, ...(note.customization || {}) },
        updatedAt: note.updatedAt || new Date().toISOString()
    };
}

function normalizeReminderForExport(reminder) {
    return {
        id: reminder.id,
        date: reminder.date,
        time: reminder.time || "",
        title: reminder.title || "",
        color: reminder.color || "coral",
        done: Boolean(reminder.done),
        createdAt: reminder.createdAt || reminder.updatedAt || new Date().toISOString(),
        updatedAt: reminder.updatedAt || new Date().toISOString()
    };
}

function buildExportPayload() {
    return {
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        notes: notes.map(normalizeNoteForExport),
        categories: categories.map((category) => ({
            id: category.id,
            name: category.name,
            icon: category.icon || "",
            dot: category.dot
        })),
        reminders: reminders.map(normalizeReminderForExport),
        settings: { ...settings }
    };
}

function exportNotes() {
    const blob = new Blob([JSON.stringify(buildExportPayload(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mi-cuadernito-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toggleFavorite(noteId) {
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;
    note.favorite = !note.favorite;
    tocarNota(note);
    persistNotes();
    renderCards();
    renderEditor();
}

function archiveNote(noteId) {
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;
    if (note.deleted) note.deleted = false;
    else note.archived = !note.archived;
    persistNotes();
    renderCards();
    renderEditor();
}

function deleteNote(noteId) {
    const noteIndex = notes.findIndex((item) => item.id === noteId);
    if (noteIndex < 0) return;
    const note = notes[noteIndex];
    const action = note.deleted ? "eliminarla definitivamente" : "enviarla a la papelera";
    if (!window.confirm(`¿Quieres ${action}?`)) return;
    if (note.deleted) {
        notes.splice(noteIndex, 1);
        activeNoteId = notes.find((item) => !item.deleted)?.id || null;
    } else {
        note.deleted = true;
        note.archived = false;
        if (activeNoteId === noteId) activeNoteId = notes.find((item) => !item.deleted)?.id || null;
    }
    persistNotes();
    renderCards();
    renderEditor();
}

// Antes leía settings.color, settings.noteBackground y settings.fontSize, que
// nada escribía nunca, y pisaba #fontSizeValue (el tamaño por nota) con un valor
// global que no existía.
function applySettings() {
    const dark = Boolean(settings.darkMode);
    document.documentElement.style.setProperty("--font-scale", getFontScale());
    document.body.classList.toggle("dark-mode", dark);

    // La etiqueta anuncia el destino, igual que el icono
    const toggle = document.querySelector("#themeToggle");
    toggle.setAttribute("aria-label", dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    toggle.title = dark ? "Modo claro" : "Modo oscuro";

    applyAppTheme();
    renderFontScale();
}

/* =====================================================
   PERSONALIZAR LA APP
===================================================== */

function getPalette() {
    return PALETTES[settings.palette] ? settings.palette : "burdeos";
}

function getShape() {
    const key = SHAPE_ALIASES[settings.shape] || settings.shape;
    return PANEL_SHAPES.some((s) => s.key === key) ? key : "round";
}

function getUserName() {
    return (settings.userName || "Melissa").trim() || "Melissa";
}

function hexToHsl(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16) / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (!d) return [0, 0, l];
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h * 60, s, l];
}

function hslToHex(h, s, l) {
    h = (((h % 360) + 360) % 360) / 360;
    const mezcla = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    let r, g, b;
    if (!s) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = mezcla(p, q, h + 1 / 3);
        g = mezcla(p, q, h);
        b = mezcla(p, q, h - 1 / 3);
    }
    return "#" + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0").toUpperCase()).join("");
}

// Variante oscura de una paleta: conserva sus tonos y solo mueve luminosidad y
// saturación. Los fondos bajan al 8-19% y los títulos y el acento suben, para
// que se lean sobre oscuro. Verificado: texto 13.9, títulos 6.2, acento 6.8 de
// contraste en el peor caso.
function darkVariant(palette) {
    const [hs, ss] = hexToHsl(palette.sidebar);
    const [hp, sp] = hexToHsl(palette.plum);
    const [hc, sc] = hexToHsl(palette.coral);
    return {
        background: hslToHex(hs, 0.14, 0.085),
        surface: hslToHex(hs, 0.14, 0.125),
        paper: hslToHex(hs, 0.12, 0.185),
        "dark-surface": hslToHex(hs, 0.14, 0.155),
        "dark-surface-raised": hslToHex(hs, 0.14, 0.205),
        sidebar: hslToHex(hs, Math.min(0.42, ss + 0.04), 0.245),
        plum: hslToHex(hp, Math.max(0.28, sp), 0.66),
        coral: hslToHex(hc, Math.max(0.62, sc), 0.72)
    };
}

const LIGHT_ONLY = ["surface", "dark-surface", "dark-surface-raised"];

// El botón "Crear nuevo" va encima de la barra lateral, que cambia con cada
// paleta y con el modo. Se saca del acento de la paleta pero con la claridad
// fijada: clara para separarse del lateral (siempre oscuro) y con la letra en
// el mismo tono pero muy oscura. Así los 6 x 2 casos quedan en 5.4:1 o más de
// letra sobre botón y 3.3:1 o más de botón sobre lateral.
function ctaTokens(coral) {
    const [hue, saturation] = hexToHsl(coral);
    const viveza = Math.max(0.55, saturation);
    return {
        cta: hslToHex(hue, viveza, 0.72),
        "cta-hover": hslToHex(hue, viveza, 0.79),
        "cta-text": hslToHex(hue, Math.min(0.5, saturation), 0.22)
    };
}

function applyAppTheme() {
    const palette = PALETTES[getPalette()];
    const base = settings.darkMode ? darkVariant(palette) : palette;
    const tokens = { ...base, ...ctaTokens(base.coral) };

    // Se escriben en body, no en :root: .dark-mode define estos mismos tokens
    // sobre body, y un ancestro más cercano gana. Puestos en html no tendrían
    // ningún efecto con el modo oscuro activo.
    Object.entries(tokens).forEach(([token, value]) => {
        if (token !== "name") document.body.style.setProperty(`--${token}`, value);
    });

    // En claro estos los pone el CSS; hay que soltarlos al salir de oscuro
    if (!settings.darkMode) LIGHT_ONLY.forEach((t) => document.body.style.removeProperty(`--${t}`));

    const shape = getShape();
    document.body.style.setProperty("--panel-radius", PANEL_SHAPES.find((s) => s.key === shape).radius);
    document.body.classList.toggle("shape-cookie", shape === "cookie");

    const name = getUserName();
    document.querySelector("#greetingName").textContent = name;
    renderAvatar();
    renderAvatarOptions();

    document.querySelectorAll("[data-palette]").forEach((button) =>
        button.classList.toggle("selected-palette", button.dataset.palette === getPalette()));
    document.querySelectorAll("[data-shape]").forEach((button) =>
        button.classList.toggle("selected", button.dataset.shape === getShape()));
}

/* =====================================================
   AVATAR

   Caras pensadas para un círculo de 34px: pocas formas, muy contrastadas y
   ocupando casi todo el lienzo. Los dibujos de las notas son siluetas sobre
   papel y pueden permitirse detalle; estos tienen que leerse a un tercio de
   ese tamaño. El capibara se reaprovecha tal cual, que ya es una cabeza.

   Van sobre fondo crema fijo, también en modo oscuro: con el fondo del tema,
   el pelo oscuro del chico desaparecía y quedaba una cara flotando.
===================================================== */

const AVATAR_SVG = {
    capibara: DECORATION_SVG.capybara,

    fresa: `<svg viewBox="0 0 32 32">
        <rect x="15.1" y="2.6" width="1.8" height="6" rx="0.9" fill="#4E8A4B"/>
        <g fill="#5FA05B">
            <ellipse cx="16" cy="8.4" rx="4.8" ry="2.4"/>
            <ellipse cx="9.4" cy="10.1" rx="4.4" ry="2.2" transform="rotate(-20 9.4 10.1)"/>
            <ellipse cx="22.6" cy="10.1" rx="4.4" ry="2.2" transform="rotate(20 22.6 10.1)"/>
        </g>
        <path d="M16 9.8c6.2 0 10.4 3.2 10.4 7.7 0 6-6 11.4-9.5 13.7a1.7 1.7 0 0 1-1.8 0C11.6 28.9 5.6 23.5 5.6 17.5c0-4.5 4.2-7.7 10.4-7.7z" fill="#E4564F"/>
        <g fill="#FBD46A">
            <ellipse cx="8.6" cy="16.2" rx="0.72" ry="1"/>
            <ellipse cx="23.4" cy="16.2" rx="0.72" ry="1"/>
            <ellipse cx="10.2" cy="24.4" rx="0.72" ry="1"/>
            <ellipse cx="21.8" cy="24.4" rx="0.72" ry="1"/>
            <ellipse cx="16" cy="27.8" rx="0.72" ry="1"/>
            <ellipse cx="16" cy="13.6" rx="0.72" ry="1"/>
        </g>
        <ellipse cx="9.9" cy="20.6" rx="2" ry="1.35" fill="#F7A6AE" opacity="0.75"/>
        <ellipse cx="22.1" cy="20.6" rx="2" ry="1.35" fill="#F7A6AE" opacity="0.75"/>
        <ellipse cx="12.7" cy="19" rx="1.5" ry="1.9" fill="#4A1F1C"/>
        <ellipse cx="19.3" cy="19" rx="1.5" ry="1.9" fill="#4A1F1C"/>
        <circle cx="13.25" cy="18.2" r="0.58" fill="#FFFFFF"/>
        <circle cx="19.85" cy="18.2" r="0.58" fill="#FFFFFF"/>
        <path d="M13.5 22.6q2.5 2.3 5 0" stroke="#4A1F1C" stroke-width="0.95" fill="none" stroke-linecap="round"/>
    </svg>`,

    brocoli: `<svg viewBox="0 0 32 32">
        <path d="M12.9 20h6.2v7.3c0 1.8-1.4 3.1-3.1 3.1s-3.1-1.3-3.1-3.1z" fill="#CFE3A0"/>
        <g fill="#4E8F4A">
            <circle cx="11.2" cy="6.6" r="4.4"/>
            <circle cx="20.8" cy="6.6" r="4.4"/>
            <circle cx="16" cy="5.2" r="4.2"/>
            <circle cx="7.2" cy="11" r="4.3"/>
            <circle cx="24.8" cy="11" r="4.3"/>
            <circle cx="16" cy="15" r="10.4"/>
        </g>
        <g fill="#63AF59">
            <circle cx="11.4" cy="8.4" r="2.3"/>
            <circle cx="20.8" cy="8.2" r="2.1"/>
            <circle cx="16" cy="6.2" r="1.9"/>
            <circle cx="7.6" cy="12" r="1.8"/>
            <circle cx="24.6" cy="11.8" r="1.8"/>
        </g>
        <ellipse cx="8.9" cy="19" rx="1.9" ry="1.3" fill="#F2909E" opacity="0.6"/>
        <ellipse cx="23.1" cy="19" rx="1.9" ry="1.3" fill="#F2909E" opacity="0.6"/>
        <ellipse cx="12.5" cy="16.4" rx="1.5" ry="1.9" fill="#1F3A1E"/>
        <ellipse cx="19.5" cy="16.4" rx="1.5" ry="1.9" fill="#1F3A1E"/>
        <circle cx="13.05" cy="15.6" r="0.58" fill="#FFFFFF"/>
        <circle cx="20.05" cy="15.6" r="0.58" fill="#FFFFFF"/>
        <path d="M13.3 20.1q2.7 2.3 5.4 0" stroke="#1F3A1E" stroke-width="0.95" fill="none" stroke-linecap="round"/>
    </svg>`,

    chica: `<svg viewBox="0 0 32 32">
        <ellipse cx="16" cy="17" rx="11.2" ry="11.6" fill="#6B4430"/>
        <ellipse cx="6.7" cy="22.6" rx="2.9" ry="6.4" fill="#6B4430"/>
        <ellipse cx="25.3" cy="22.6" rx="2.9" ry="6.4" fill="#6B4430"/>
        <circle cx="8.3" cy="18.6" r="1.9" fill="#E3A87A"/>
        <circle cx="23.7" cy="18.6" r="1.9" fill="#E3A87A"/>
        <ellipse cx="16" cy="18.4" rx="7.8" ry="8.6" fill="#F0C29C"/>
        <path d="M8.3 14.6C9.2 9.5 12.3 6.7 16 6.7s6.8 2.8 7.7 7.9c-2.1-2.7-4.6-4-7.7-4s-5.6 1.3-7.7 4z" fill="#6B4430"/>
        <ellipse cx="12.7" cy="18.6" rx="1.45" ry="1.85" fill="#3B2A22"/>
        <ellipse cx="19.3" cy="18.6" rx="1.45" ry="1.85" fill="#3B2A22"/>
        <circle cx="13.25" cy="17.8" r="0.55" fill="#FFFFFF"/>
        <circle cx="19.85" cy="17.8" r="0.55" fill="#FFFFFF"/>
        <ellipse cx="10.3" cy="21.6" rx="1.8" ry="1.2" fill="#F2909E" opacity="0.7"/>
        <ellipse cx="21.7" cy="21.6" rx="1.8" ry="1.2" fill="#F2909E" opacity="0.7"/>
        <path d="M13.9 22.6q2.1 1.9 4.2 0" stroke="#3B2A22" stroke-width="0.9" fill="none" stroke-linecap="round"/>
        <g transform="translate(2.6 5.4)">
            <g fill="#F2909E">
                <circle cx="21.9" cy="4.1" r="1.5"/>
                <circle cx="24.09" cy="5.69" r="1.5"/>
                <circle cx="23.25" cy="8.26" r="1.5"/>
                <circle cx="20.55" cy="8.26" r="1.5"/>
                <circle cx="19.71" cy="5.69" r="1.5"/>
            </g>
            <circle cx="21.9" cy="6.4" r="1.25" fill="#F7C948"/>
        </g>
    </svg>`,

    chico: `<svg viewBox="0 0 32 32">
        <ellipse cx="16" cy="15.2" rx="10.5" ry="9.8" fill="#3F2C22"/>
        <circle cx="7.8" cy="18.7" r="2" fill="#E3A87A"/>
        <circle cx="24.2" cy="18.7" r="2" fill="#E3A87A"/>
        <ellipse cx="16" cy="18.7" rx="8.2" ry="8.9" fill="#F0C29C"/>
        <path d="M7.9 14.6C8.6 8.9 11.8 5.9 16 5.9s7.4 3 8.1 8.3c-1.7-2.3-3.5-3.4-5.1-3.1-1.4.3-1.8 1.4-3 1.4s-1.6-1.1-3-1.4c-1.6-.3-3.4.8-5.1 3.1z" fill="#3F2C22"/>
        <ellipse cx="12.6" cy="18.9" rx="1.45" ry="1.85" fill="#33241C"/>
        <ellipse cx="19.4" cy="18.9" rx="1.45" ry="1.85" fill="#33241C"/>
        <circle cx="13.15" cy="18.1" r="0.55" fill="#FFFFFF"/>
        <circle cx="19.95" cy="18.1" r="0.55" fill="#FFFFFF"/>
        <ellipse cx="10.1" cy="21.9" rx="1.8" ry="1.2" fill="#F2909E" opacity="0.6"/>
        <ellipse cx="21.9" cy="21.9" rx="1.8" ry="1.2" fill="#F2909E" opacity="0.6"/>
        <path d="M13.8 22.9q2.2 1.9 4.4 0" stroke="#33241C" stroke-width="0.9" fill="none" stroke-linecap="round"/>
    </svg>`
};

const AVATAR_NOMBRES = {
    letra: "Mi inicial",
    capibara: "Capibara",
    fresa: "Fresa",
    brocoli: "Brócoli",
    chica: "Chica",
    chico: "Chico",
    foto: "Mi foto"
};

const AVATAR_ORDEN = ["letra", "capibara", "fresa", "brocoli", "chica", "chico"];

// Lado de la foto guardada. Una del móvil trae varios megas y esto vive dentro
// de los ajustes, que viajan enteros a la nube cada vez que cambia algo: a
// 160px son unos 12 KB y se ve de sobra en un círculo de 34.
const AVATAR_FOTO_LADO = 160;

function avatarSrc(id) {
    // El xmlns solo hace falta cuando el svg va como imagen suelta
    const markup = AVATAR_SVG[id].replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
    return "data:image/svg+xml," + encodeURIComponent(markup);
}

function getAvatar() {
    const elegido = settings.avatar;
    if (elegido === "foto") return settings.avatarFoto ? "foto" : "letra";
    return AVATAR_SVG[elegido] ? elegido : "letra";
}

function renderAvatar() {
    const boton = document.querySelector("#avatarInitial");
    const elegido = getAvatar();
    const dibujo = elegido !== "letra";

    boton.classList.toggle("con-dibujo", dibujo);

    if (!dibujo) {
        boton.textContent = getUserName().charAt(0).toUpperCase();
        boton.title = "Mi perfil";
        return;
    }

    const img = document.createElement("img");
    img.alt = "";
    img.src = elegido === "foto" ? settings.avatarFoto : avatarSrc(elegido);
    boton.replaceChildren(img);
    boton.title = "Mi perfil";
}

function renderAvatarOptions() {
    const caja = document.querySelector("#avatarOptions");
    if (!caja) return;

    const elegido = getAvatar();
    const lista = settings.avatarFoto ? AVATAR_ORDEN.concat("foto") : AVATAR_ORDEN;

    caja.innerHTML = lista.map((id) => {
        const dentro = id === "letra"
            ? `<span>${escapeHtml(getUserName().charAt(0).toUpperCase())}</span>`
            : `<img src="${id === "foto" ? settings.avatarFoto : avatarSrc(id)}" alt="">`;
        return `<button type="button" class="avatar-option${id === elegido ? " selected" : ""}${id === "letra" ? " de-letra" : ""}"
                        data-avatar="${id}" role="radio" aria-checked="${id === elegido}"
                        title="${AVATAR_NOMBRES[id]}" aria-label="${AVATAR_NOMBRES[id]}">${dentro}</button>`;
    }).join("");

    document.querySelector("#avatarQuitarFoto").hidden = !settings.avatarFoto;
    document.querySelector("#avatarSubir").textContent = settings.avatarFoto ? "Cambiar la foto" : "Subir una foto";
}

function setAvatar(id) {
    settings.avatar = id;
    persistSettings();
    renderAvatar();
    renderAvatarOptions();
}

function avisoAvatar(texto) {
    const pista = document.querySelector("#avatarPista");
    pista.textContent = texto;
    pista.classList.add("cuenta-mal");
}

function pedirFotoAvatar(archivo) {
    if (!archivo) return;
    if (!/^image\//.test(archivo.type)) {
        avisoAvatar("Eso no parece una imagen.");
        return;
    }

    const lector = new FileReader();

    lector.onerror = () => avisoAvatar("No pude leer el archivo.");
    lector.onload = () => {
        const img = new Image();
        // Los iPhone guardan en HEIC y el navegador no sabe abrirlo. Al subir
        // desde la galería suele convertirlo solo, pero si llega crudo hay que
        // decirlo en vez de dejar el botón colgado.
        img.onerror = () => avisoAvatar("Ese formato no lo puede abrir el navegador. Prueba con una foto JPG o PNG.");
        img.onload = () => abrirRecorte(img);
        img.src = lector.result;
    };

    lector.readAsDataURL(archivo);
}


/* ---------------------------------------------- colocar la foto a mano

   Antes la página recortaba el cuadrado del centro por su cuenta, y en una
   foto vertical eso deja fuera media cara. Ahora se ve dentro del mismo
   círculo en el que va a quedar, se arrastra y se acerca, y solo entonces se
   recorta: lo que se ve es exactamente lo que se guarda.                  */

// { img, lado (el del marco), base (la escala que hace que cubra), zoom, x, y }
let recorte = null;
let arrastreRecorte = null;

function escalaRecorte() {
    return recorte.base * recorte.zoom;
}

// La foto no puede despegarse de ningún borde: si se pudiera, quedaría un
// trozo de marco vacío y el recorte saldría con una banda de fondo.
function limitarRecorte() {
    const escala = escalaRecorte();
    const ancho = recorte.img.naturalWidth * escala;
    const alto = recorte.img.naturalHeight * escala;
    recorte.x = Math.min(0, Math.max(recorte.lado - ancho, recorte.x));
    recorte.y = Math.min(0, Math.max(recorte.lado - alto, recorte.y));
}

function pintarRecorte() {
    limitarRecorte();
    const escala = escalaRecorte();
    const lienzo = document.querySelector("#recorteImg");
    lienzo.style.width = (recorte.img.naturalWidth * escala) + "px";
    lienzo.style.height = (recorte.img.naturalHeight * escala) + "px";
    lienzo.style.left = recorte.x + "px";
    lienzo.style.top = recorte.y + "px";
}

function abrirRecorte(img) {
    const panel = document.querySelector("#recorteFoto");
    // Hay que enseñarlo antes de medir el marco: mientras está oculto no tiene
    // tamaño y todas las cuentas saldrían a cero.
    panel.hidden = false;

    const lado = document.querySelector("#recorteVista").getBoundingClientRect().width;
    const base = lado / Math.min(img.naturalWidth, img.naturalHeight);

    recorte = { img, lado, base, zoom: 1, x: 0, y: 0 };
    recorte.x = (lado - img.naturalWidth * base) / 2;
    recorte.y = (lado - img.naturalHeight * base) / 2;

    document.querySelector("#recorteImg").src = img.src;
    document.querySelector("#recorteZoom").value = "1";
    pintarRecorte();
}

function cerrarRecorte() {
    document.querySelector("#recorteFoto").hidden = true;
    const lienzo = document.querySelector("#recorteImg");
    lienzo.removeAttribute("src");
    // Y el tamaño y la posición de la foto anterior, que si no se quedan
    // puestos y la siguiente asoma un instante con las medidas de la otra.
    lienzo.removeAttribute("style");
    recorte = null;
    arrastreRecorte = null;
}

// Al acercar, el punto del centro se queda donde está. Si no, la foto parece
// escaparse hacia una esquina cada vez que se mueve la barra.
function acercarRecorte(zoom) {
    if (!recorte) return;
    const antes = escalaRecorte();
    recorte.zoom = zoom;
    const ahora = escalaRecorte();
    const centro = recorte.lado / 2;
    recorte.x = centro - (centro - recorte.x) * (ahora / antes);
    recorte.y = centro - (centro - recorte.y) * (ahora / antes);
    pintarRecorte();
}

function guardarRecorte() {
    if (!recorte) return;
    const escala = escalaRecorte();
    const lienzo = document.createElement("canvas");
    lienzo.width = AVATAR_FOTO_LADO;
    lienzo.height = AVATAR_FOTO_LADO;

    // El trozo de la foto original que se ve por el marco, en píxeles suyos
    lienzo.getContext("2d").drawImage(
        recorte.img,
        -recorte.x / escala, -recorte.y / escala,
        recorte.lado / escala, recorte.lado / escala,
        0, 0, AVATAR_FOTO_LADO, AVATAR_FOTO_LADO
    );

    settings.avatarFoto = lienzo.toDataURL("image/jpeg", 0.82);
    settings.avatar = "foto";
    persistSettings();
    renderAvatar();
    renderAvatarOptions();
    cerrarRecorte();

    const pista = document.querySelector("#avatarPista");
    pista.textContent = "Listo. La foto se guarda pequeña y viaja contigo a los demás aparatos.";
    pista.classList.remove("cuenta-mal");
}

function quitarFotoAvatar() {
    delete settings.avatarFoto;
    if (settings.avatar === "foto") settings.avatar = "letra";
    persistSettings();
    renderAvatar();
    renderAvatarOptions();
}


function renderShapes() {
    document.querySelector("#shapeOptions").innerHTML = PANEL_SHAPES.map((s) =>
        `<button type="button" data-shape="${s.key}">${s.name}</button>`).join("");
}

function renderPalettes() {
    document.querySelector("#paletteOptions").innerHTML = Object.entries(PALETTES).map(([key, p]) => `
        <button type="button" class="palette" data-palette="${key}" title="${p.name}" aria-label="Paleta ${p.name}">
            <span class="palette-chips">
                <span style="background: ${p.sidebar}"></span>
                <span style="background: ${p.coral}"></span>
                <span style="background: ${p.background}"></span>
            </span>
            <span class="palette-name">${p.name}</span>
        </button>`).join("");
}

function updateAppSetting(key, value) {
    settings[key] = value;
    persistSettings();
    applyAppTheme();
}

function getFontScale() {
    const scale = Number(settings.fontScale);
    return Number.isFinite(scale) && scale >= FONT_SCALE_MIN && scale <= FONT_SCALE_MAX ? scale : 1;
}

function setFontScale(value) {
    // Se redondea a 2 decimales: 0.85 + 0.05 da 0.9000000000000001 en coma flotante.
    const clamped = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Math.round(value * 100) / 100));
    settings.fontScale = clamped;
    persistSettings();
    applySettings();
}

function renderFontScale() {
    const scale = getFontScale();
    document.querySelector("#fontScaleValue").textContent = `${Math.round(scale * 100)}%`;
    document.querySelector("#scaleDown").disabled = scale <= FONT_SCALE_MIN;
    document.querySelector("#scaleUp").disabled = scale >= FONT_SCALE_MAX;
}

// El graduador de letra se usa de uvas a peras, y en la barra superior del
// móvil ocupaba sitio junto a acciones más frecuentes. Se mueve el elemento
// (no se duplica) para que renderFontScale() lo siga encontrando por id.
const anchoMovil = window.matchMedia("(max-width: 950px)");

function colocarGraduador() {
    const control = document.querySelector(".font-scale");
    const destino = anchoMovil.matches
        ? document.querySelector("#panelFontSlot")
        : document.querySelector(".top-actions");
    if (control.parentElement !== destino) destino.prepend(control);
}

function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.filter === filter));
    // El resaltado de las categorías y el valor del selector móvil los pone
    // renderCategories(), que ya sabe cuál es el filtro activo.
    renderCards();
}

// Las únicas que tienen estado. undo, redo y removeFormat son acciones sueltas:
// no se quedan "puestas" y por tanto nunca se resaltan.
const COMANDOS_CON_ESTADO = ["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"];

// El resalte refleja el estado real del formato bajo el cursor. Es obligatorio
// que sea así: execCommand no pone ni quita, ALTERNA respecto a ese estado, y
// el navegador lo reinicia por su cuenta al llevar el cursor a un trozo sin
// formato. Un botón que llevase su propia cuenta acabaría invertido, diciendo
// "apagado" mientras el texto sale tachado.
function renderToolbarState() {
    document.querySelectorAll("[data-command]").forEach((boton) => {
        if (!COMANDOS_CON_ESTADO.includes(boton.dataset.command)) return;
        let activo = false;
        try {
            activo = document.queryCommandState(boton.dataset.command);
        } catch {
            // Algún navegador lanza si el comando no le aplica; apagado es
            // mejor que romper la barra entera.
            activo = false;
        }
        boton.classList.toggle("is-active", activo);
        boton.setAttribute("aria-pressed", String(activo));
    });
}

function clearCommandStates() {
    document.querySelectorAll("[data-command]").forEach((boton) => {
        if (!COMANDOS_CON_ESTADO.includes(boton.dataset.command)) return;
        boton.classList.remove("is-active");
        boton.setAttribute("aria-pressed", "false");
    });
}

function runEditorCommand(command) {
    editorContent.focus();
    document.execCommand(command, false);
    renderToolbarState();
    saveActiveNote();
}

function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        "\"": "&quot;"
    }[character]));
}

// "Nueva nota", "Nuevo plan"... Sirve de encabezado y de título por defecto.
function noteTypeLabel(type) {
    return `${TYPE_ARTICLE[type] || "Nueva"} ${type}`;
}

function renderNoteTypes() {
    document.querySelector("#newNoteTypes").innerHTML = NOTE_TYPES.map((tipo) => {
        const elegido = tipo.key === pendingNoteType;
        return `<button type="button" class="type-option${elegido ? " selected" : ""}"
                data-new-type="${tipo.key}" role="radio" aria-checked="${elegido}">
            <span class="create-icon ${tipo.tono}" aria-hidden="true">${tipo.icon}</span>
            <span>${capitalize(tipo.key)}</span>
        </button>`;
    }).join("");
}

// Pastillas de categoría. Las comparten el diálogo de crear y el pie del
// editor, que solo se diferencian en el data-* con el que escuchan el clic.
// "Sin categoría" va primero y sin punto: es la ausencia de etiqueta.
function categoryChips(seleccionada, atributo) {
    const opciones = [{ id: "", name: "Sin categoría" }, ...categories];
    return opciones.map((opcion) => {
        const elegido = opcion.id === (seleccionada || "");
        const punto = opcion.dot ? `<span class="category-dot ${opcion.dot}"></span>` : "";
        const texto = opcion.icon ? categoryLabel(opcion) : opcion.name;
        return `<button type="button" class="chip-option${elegido ? " selected" : ""}"
                ${atributo}="${opcion.id}" role="radio" aria-checked="${elegido}">
            ${punto}${escapeHtml(texto)}
        </button>`;
    }).join("");
}

function renderNoteCategories() {
    document.querySelector("#newNoteCategories").innerHTML =
        categoryChips(pendingNoteCategory, "data-new-category");
}

// Pie del editor: el botón muestra la categoría de la nota y el panel deja
// cambiarla.
function renderEditorCategory() {
    const note = getActiveNote();
    const actual = note ? note.categoryId : "";
    const categoria = findCategory(actual);
    document.querySelector("#editorCategory").innerHTML = categoria
        ? `<span class="category-dot ${categoria.dot}"></span>${escapeHtml(categoryLabel(categoria))}`
        : "Sin categoría";
    document.querySelector("#categoryPicker").innerHTML =
        categoryChips(actual, "data-pick-note-category");
}

function setCategoryPicker(open) {
    document.querySelector("#categoryPicker").hidden = !open;
    document.querySelector("#editorCategory").setAttribute("aria-expanded", String(open));
}

// Al cambiar el tipo se actualiza el encabezado, y el título solo si sigue
// siendo el que puso la app: lo que haya escrito el usuario no se pisa.
function setNewNoteType(type) {
    const anterior = noteTypeLabel(pendingNoteType);
    pendingNoteType = type;
    const label = noteTypeLabel(type);
    if (newNoteTitle.value.trim() === anterior) newNoteTitle.value = label;
    newNoteHeading.textContent = label;
    renderNoteTypes();
}

function openNewNoteDialog(type) {
    pendingNoteType = type;
    const label = noteTypeLabel(type);
    // El tipo llega elegido (desde el sidebar, "nota"), pero se puede cambiar
    // aquí sin cerrar el diálogo.
    newNoteHeading.textContent = label;
    newNoteTitle.value = label;
    renderNoteTypes();
    // Si estás viendo una categoría, la nueva nota nace ya dentro de ella.
    pendingNoteCategory = activeFilter.startsWith("cat:") ? activeFilter.slice(4) : "";
    renderNoteCategories();
    newNoteDialog.showModal();
    newNoteTitle.select();
}

document.querySelectorAll("[data-create-type]").forEach((card) => {
    card.addEventListener("click", () => openNewNoteDialog(card.dataset.createType));
});

newNoteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (event.submitter && event.submitter.value !== "create") {
        newNoteDialog.close();
        return;
    }
    createNote(pendingNoteType, newNoteTitle.value, pendingNoteCategory);
    newNoteDialog.close();
});

document.querySelector("#newNoteTypes").addEventListener("click", (event) => {
    const boton = event.target.closest("[data-new-type]");
    if (boton) setNewNoteType(boton.dataset.newType);
});
document.querySelector("#newNoteCategories").addEventListener("click", (event) => {
    const boton = event.target.closest("[data-new-category]");
    if (!boton) return;
    pendingNoteCategory = boton.dataset.newCategory;
    renderNoteCategories();
});

document.querySelector("#cancelNoteButton").addEventListener("click", () => newNoteDialog.close());

notesGrid.addEventListener("click", (event) => {
    // La sujeción está fuera del <article>, así que nunca abre la nota: abre su
    // panel, y un segundo toque sobre la misma lo cierra.
    const sujecion = event.target.closest("[data-fastener-id]");
    if (sujecion) {
        // Al soltar un arrastre el navegador lanza además un clic: ese no debe
        // abrir el panel, porque lo que querías era moverla.
        if (clicTrasArrastre) {
            clicTrasArrastre = false;
            return;
        }
        const abierta = !document.querySelector("#fastenerPicker").hidden;
        if (abierta && fastenerNoteId === sujecion.dataset.fastenerId) setFastenerPicker(false);
        else openFastenerPicker(sujecion.dataset.fastenerId);
        return;
    }
    const favoriteButton = event.target.closest("[data-favorite-id]");
    if (favoriteButton) {
        event.stopPropagation();
        toggleFavorite(favoriteButton.dataset.favoriteId);
        return;
    }
    const archiveButton = event.target.closest("[data-archive-id]");
    if (archiveButton) {
        event.stopPropagation();
        archiveNote(archiveButton.dataset.archiveId);
        return;
    }
    const deleteButton = event.target.closest("[data-delete-id]");
    if (deleteButton) {
        event.stopPropagation();
        deleteNote(deleteButton.dataset.deleteId);
        return;
    }
    const card = event.target.closest("[data-note-id]");
    if (card) {
        activeNoteId = card.dataset.noteId;
        openEditor();
        renderEditor();
    }
});

// Las tarjetas de Recientes son solo de lectura: abrir la nota es la única
// forma de modificarla. Con Enter o Espacio también, ya que son enfocables.
notesGrid.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest("[data-note-id]");
    if (!card || event.target.closest("button")) return;
    event.preventDefault();
    activeNoteId = card.dataset.noteId;
    openEditor();
    renderEditor();
});

editorTitle.addEventListener("input", saveActiveNote);
editorContent.addEventListener("input", saveActiveNote);
saveStatus.addEventListener("click", saveAllChanges);
saveStatus.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        saveAllChanges();
    }
});
searchInput.addEventListener("input", renderCards);
mobileFilter.addEventListener("click", () => {
    setFilterPicker(document.querySelector("#filterPicker").hidden);
});
document.querySelector("#filterPicker").addEventListener("click", (event) => {
    const boton = event.target.closest("[data-pick-filter]");
    if (!boton) return;
    // Antes de setFilter, que vuelve a pintar este mismo panel.
    setFilterPicker(false);
    setFilter(boton.dataset.pickFilter);
});

// Se queda abierto al elegir, para poder cambiar el tipo y el color seguidos.
document.querySelector("#fastenerPicker").addEventListener("click", (event) => {
    if (event.target.closest("#fastenerReset")) {
        resetFastenerPosition();
        return;
    }
    const tipo = event.target.closest("[data-set-fastener-type]");
    if (tipo) {
        setNoteFastener({ type: tipo.dataset.setFastenerType });
        return;
    }
    const color = event.target.closest("[data-set-fastener-color]");
    if (color) {
        const clave = color.dataset.setFastenerColor;
        setNoteFastener({ color: clave === "auto" ? null : clave });
    }
});

// Va con position:fixed, así que al desplazarse la página o cambiar el tamaño
// de la ventana se recoloca junto a su tachuela. Cerrarlo sin más fallaba en el
// móvil, donde esconder la barra del navegador ya dispara un "resize".
function seguirTachuela() {
    if (fastenerNoteId && !document.querySelector("#fastenerPicker").hidden) placeFastenerPicker();
}
window.addEventListener("scroll", seguirTachuela, { passive: true });
window.addEventListener("resize", seguirTachuela);

/* BALANCEO AL DESLIZAR (pantallas táctiles)
   En el móvil no existe "pasar el ratón por encima", así que las notas de
   Recientes reaccionan al deslizar: mientras la página corre se inclinan un
   poco, como papeles colgados que se quedan atrás, y al parar vuelven
   balanceándose hasta quedarse quietas. Cada tarjeta es un muelle amortiguado
   que gira desde su tachuela o su clip (el transform-origin del CSS).
   El bucle solo corre mientras algo se mueve, para no gastar batería. */

const balanceoMedia = window.matchMedia("(hover: none) and (prefers-reduced-motion: no-preference)");
const BALANCEO_MAX = 2.6;       // grados: con más, la esquina de abajo se sale del margen
const BALANCEO_RIGIDEZ = 60;
const BALANCEO_FRENO = 5;
const balanceo = {
    estados: new Map(),         // id de la nota -> { a: ángulo, v: velocidad angular, ... }
    velocidad: 0,               // velocidad de desplazamiento suavizada, en px/s
    ultimaY: window.scrollY,
    ultimaMarca: 0,
    ultimoT: 0,
    animando: false
};

// Unas se inclinan hacia un lado y otras hacia el otro, cada una con su ritmo,
// para que no se muevan todas a la vez como una sola pieza. Sale del id, así
// que cada nota se mueve siempre igual.
function caracterBalanceo(id) {
    let suma = 0;
    for (const letra of String(id)) suma = (suma * 31 + letra.charCodeAt(0)) % 1000;
    return {
        lado: suma % 2 ? 1 : -1,
        rigidez: BALANCEO_RIGIDEZ * (0.85 + (suma % 30) / 100)
    };
}

function pasoBalanceo(t) {
    const dt = balanceo.ultimoT ? Math.min(0.05, (t - balanceo.ultimoT) / 1000) : 1 / 60;
    balanceo.ultimoT = t;
    // Sin deslizar, la velocidad se apaga en unas décimas de segundo
    balanceo.velocidad *= Math.pow(0.02, dt);
    let quieto = Math.abs(balanceo.velocidad) < 5;

    document.querySelectorAll("#notesGrid .note-pinned").forEach((tarjeta) => {
        const id = tarjeta.querySelector("[data-fastener-id]").dataset.fastenerId;
        let e = balanceo.estados.get(id);
        if (!e) {
            e = { a: 0, v: 0, ...caracterBalanceo(id) };
            balanceo.estados.set(id, e);
        }
        const objetivo = Math.max(-BALANCEO_MAX, Math.min(BALANCEO_MAX, balanceo.velocidad * 0.0026 * e.lado));
        e.v += (e.rigidez * (objetivo - e.a) - BALANCEO_FRENO * e.v) * dt;
        e.a = Math.max(-BALANCEO_MAX, Math.min(BALANCEO_MAX, e.a + e.v * dt));
        if (Math.abs(e.a) > 0.02 || Math.abs(e.v) > 0.05) quieto = false;
        tarjeta.style.transform = Math.abs(e.a) < 0.01 ? "" : `rotate(${e.a.toFixed(2)}deg)`;
    });

    if (quieto) {
        balanceo.animando = false;
        balanceo.ultimoT = 0;
        return;
    }
    requestAnimationFrame(pasoBalanceo);
}

window.addEventListener("scroll", () => {
    if (!balanceoMedia.matches) return;
    const ahora = performance.now();
    const dt = balanceo.ultimaMarca ? Math.max(8, ahora - balanceo.ultimaMarca) : 16;
    const dy = window.scrollY - balanceo.ultimaY;
    balanceo.ultimaY = window.scrollY;
    balanceo.ultimaMarca = ahora;
    balanceo.velocidad = balanceo.velocidad * 0.6 + ((dy / dt) * 1000) * 0.4;
    if (!balanceo.animando) {
        balanceo.animando = true;
        requestAnimationFrame(pasoBalanceo);
    }
}, { passive: true });

// Si deja de aplicarse (se conecta un ratón, se activa "reducir movimiento"),
// las tarjetas no deben quedarse torcidas a medio balanceo.
balanceoMedia.addEventListener("change", () => {
    if (balanceoMedia.matches) return;
    balanceo.estados.clear();
    balanceo.velocidad = 0;
    document.querySelectorAll("#notesGrid .note-pinned").forEach((tarjeta) => { tarjeta.style.transform = ""; });
});

/* MOVER LA SUJECIÓN
   Pulsar la tachuela abre su panel; arrastrarla la cambia de sitio. Se decide
   por la distancia: hasta 6px se considera un toque (el dedo nunca se queda
   quieto del todo). Con eventos de puntero, que valen para ratón y dedo. */

let arrastreSujecion = null;
let clicTrasArrastre = false;

notesGrid.addEventListener("pointerdown", (event) => {
    const boton = event.target.closest("[data-fastener-id]");
    if (!boton || event.button > 0) return;
    arrastreSujecion = {
        id: boton.dataset.fastenerId,
        boton,
        envoltorio: boton.closest(".note-pinned"),
        x0: event.clientX,
        y0: event.clientY,
        puntero: event.pointerId,
        movido: false
    };
    // Así los movimientos siguen llegando aunque el dedo se salga del botón.
    try {
        boton.setPointerCapture(event.pointerId);
    } catch {
        // Solo falla con punteros sintéticos; con uno real no ocurre.
    }
});

notesGrid.addEventListener("pointermove", (event) => {
    const a = arrastreSujecion;
    if (!a || event.pointerId !== a.puntero) return;
    if (!a.movido) {
        if (Math.hypot(event.clientX - a.x0, event.clientY - a.y0) < 6) return;
        a.movido = true;
        setFastenerPicker(false);
        // Quieta mientras se coloca: si siguiera balanceándose, la posición
        // del dedo no coincidiría con la de la tarjeta girada.
        a.envoltorio.classList.add("moviendo-sujecion");
        a.caja = a.envoltorio.getBoundingClientRect();
    }
    // Siempre dentro de la tarjeta (con el borde de arriba incluido), para
    // que nunca acabe fuera de alcance.
    a.x = Math.min(97, Math.max(3, ((event.clientX - a.caja.left) / a.caja.width) * 100));
    a.y = Math.min(97, Math.max(0, ((event.clientY - a.caja.top) / a.caja.height) * 100));
    aplicarPosicionSujecion(a.boton, a.envoltorio, a.x, a.y);
});

function terminarArrastreSujecion(event) {
    const a = arrastreSujecion;
    if (!a || event.pointerId !== a.puntero) return;
    arrastreSujecion = null;
    if (!a.movido) return; // fue un toque: su clic abrirá el panel
    a.envoltorio.classList.remove("moviendo-sujecion");
    clicTrasArrastre = true;
    // Con el dedo no siempre llega ese clic final; si no llega, no debe
    // quedarse la marca puesta y tragarse el siguiente toque de verdad.
    setTimeout(() => { clicTrasArrastre = false; }, 0);
    const note = notes.find((item) => item.id === a.id);
    if (!note) return;
    note.fastener = { ...noteFastener(note), x: Math.round(a.x * 10) / 10, y: Math.round(a.y * 10) / 10 };
    persistNotes();
}

notesGrid.addEventListener("pointerup", terminarArrastreSujecion);
notesGrid.addEventListener("pointercancel", terminarArrastreSujecion);
document.querySelector(".favorite-star").addEventListener("click", () => toggleFavorite(activeNoteId));
document.querySelector("#editorFavorite").addEventListener("click", () => toggleFavorite(activeNoteId));
document.querySelector("#editorDelete").addEventListener("click", () => deleteNote(activeNoteId));
document.querySelector("#showAllButton").addEventListener("click", () => {
    activeDate = null;
    setFilter("all");
    searchInput.value = "";
});

document.querySelector("#calendarPrev").addEventListener("click", () => moveCalendar(-1));
document.querySelector("#calendarNext").addEventListener("click", () => moveCalendar(1));
document.querySelector("#calendarClear").addEventListener("click", clearDate);
document.querySelector("#calendarGrid").addEventListener("click", (event) => {
    const day = event.target.closest("[data-day]");
    // Cambiar de día descarta una edición a medias: el recordatorio pertenece
    // al día que estaba seleccionado, no al nuevo.
    if (day) {
        if (editingReminderId) resetReminderForm();
        selectDate(day.dataset.day);
    }
});

document.querySelector("#reminderForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitReminder();
});
document.querySelector("#reminderCancel").addEventListener("click", () => {
    resetReminderForm();
    setReminderForm(false);
});
document.querySelector("#toggleReminderForm").addEventListener("click", () => {
    setReminderForm(true);
    document.querySelector("#reminderText").focus();
});
document.querySelector("#reminderColors").addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-reminder-color]");
    if (!swatch) return;
    reminderColor = swatch.dataset.reminderColor;
    renderReminderColors();
});
document.querySelector("#remindersList").addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-toggle-id]");
    if (toggle) return toggleReminder(toggle.dataset.toggleId);
    const edit = event.target.closest("[data-edit-id]");
    if (edit) return startEditReminder(edit.dataset.editId);
    const remove = event.target.closest("[data-remove-id]");
    if (remove) return removeReminder(remove.dataset.removeId);
});
document.querySelectorAll("[data-filter]").forEach((item) => item.addEventListener("click", (event) => {
    event.preventDefault();
    setFilter(item.dataset.filter);
}));

// Delegado: la lista se vuelve a pintar en cada renderCards(), así que los
// botones de dentro no pueden llevar su propio listener.
document.querySelector("#categoriesList").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit-category]");
    if (edit) return openCategoryForm(edit.dataset.editCategory);
    const remove = event.target.closest("[data-remove-category]");
    if (remove) return removeCategory(remove.dataset.removeCategory);
    const pick = event.target.closest("[data-pick-category]");
    if (!pick) return;
    // Volver a pulsar la categoría activa la quita y muestra todo otra vez.
    const filter = `cat:${pick.dataset.pickCategory}`;
    setFilter(activeFilter === filter ? "all" : filter);
});

document.querySelector("#addCategory").addEventListener("click", () => {
    const form = document.querySelector("#categoryForm");
    if (!form.hidden && !editingCategoryId) closeCategoryForm();
    else openCategoryForm(null);
});
document.querySelector("#cancelCategory").addEventListener("click", closeCategoryForm);
document.querySelector("#categoryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitCategoryForm();
});
document.querySelector("#categoryDots").addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-category-dot]");
    if (!swatch) return;
    categoryDot = swatch.dataset.categoryDot;
    renderCategoryDots();
});
document.querySelector("#editorCategory").addEventListener("click", () => {
    setCategoryPicker(document.querySelector("#categoryPicker").hidden);
});
document.querySelector("#categoryPicker").addEventListener("click", (event) => {
    const boton = event.target.closest("[data-pick-note-category]");
    if (!boton) return;
    // Se cierra antes: setNoteCategory vuelve a pintar el editor y con él este
    // mismo panel.
    setCategoryPicker(false);
    setNoteCategory(boton.dataset.pickNoteCategory);
});
document.querySelectorAll("[data-command]").forEach((button) => {
    // Igual que en el selector de emojis: sin esto el botón se lleva el foco al
    // pulsarlo, el texto marcado se pierde y el comando cae sobre un cursor
    // vacío en vez de sobre lo que habías seleccionado.
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => runEditorCommand(button.dataset.command));
});

// Solo se recalcula con el cursor dentro de la nota. Si la selección se va a
// otro sitio (la barra, el buscador, otro panel) se deja el último estado: era
// lo que apagaba los resaltes sin motivo aparente.
document.addEventListener("selectionchange", () => {
    const seleccion = window.getSelection();
    if (seleccion && seleccion.rangeCount && editorContent.contains(seleccion.anchorNode)) {
        renderToolbarState();
    }
});
document.querySelector("#closeEditor").addEventListener("click", closeEditor);
document.querySelector("#exportNotes").addEventListener("click", exportNotes);
document.querySelector("#scaleUp").addEventListener("click", () => setFontScale(getFontScale() + FONT_SCALE_STEP));
document.querySelector("#scaleDown").addEventListener("click", () => setFontScale(getFontScale() - FONT_SCALE_STEP));
document.querySelector("#fontScaleValue").addEventListener("click", () => setFontScale(1));
document.querySelector("#themeToggle").addEventListener("click", () => {
    settings.darkMode = !settings.darkMode;
    persistSettings();
    applySettings();
});
document.querySelector("#increaseFont").addEventListener("click", () => {
    updateCustomization("fontSize", Math.min(28, (customizationDraft.fontSize || 16) + 1));
});
document.querySelector("#decreaseFont").addEventListener("click", () => {
    updateCustomization("fontSize", Math.max(12, (customizationDraft.fontSize || 16) - 1));
});
// El ••• del editor personaliza LA NOTA; el ♧ de la barra y el ⚙ del sidebar
// personalizan LA APP. Antes los tres abrían el mismo panel de nota.
document.querySelector("#openCustomizeMenu").addEventListener("click", openCustomizePanel);
document.querySelector("#openCustomize").addEventListener("click", openAppPanel);
document.querySelector("#avatarInitial").addEventListener("click", toggleProfilePanel);

document.querySelector("#avatarOptions").addEventListener("click", (event) => {
    const boton = event.target.closest("[data-avatar]");
    if (boton) setAvatar(boton.dataset.avatar);
});
document.querySelector("#avatarSubir").addEventListener("click", () => document.querySelector("#avatarFile").click());
document.querySelector("#avatarFile").addEventListener("change", (event) => {
    pedirFotoAvatar(event.target.files[0]);
    // Se vacía para que elegir dos veces la misma foto vuelva a disparar el evento
    event.target.value = "";
});
document.querySelector("#avatarQuitarFoto").addEventListener("click", quitarFotoAvatar);

const marcoRecorte = document.querySelector("#recorteVista");

marcoRecorte.addEventListener("pointerdown", (event) => {
    if (!recorte) return;
    arrastreRecorte = { puntero: event.pointerId, x: event.clientX, y: event.clientY };
    marcoRecorte.setPointerCapture(event.pointerId);
    event.preventDefault();
});

marcoRecorte.addEventListener("pointermove", (event) => {
    if (!arrastreRecorte || event.pointerId !== arrastreRecorte.puntero) return;
    recorte.x += event.clientX - arrastreRecorte.x;
    recorte.y += event.clientY - arrastreRecorte.y;
    arrastreRecorte.x = event.clientX;
    arrastreRecorte.y = event.clientY;
    pintarRecorte();
});

["pointerup", "pointercancel"].forEach((tipo) => marcoRecorte.addEventListener(tipo, (event) => {
    if (arrastreRecorte && event.pointerId === arrastreRecorte.puntero) arrastreRecorte = null;
}));

// La rueda acerca, que es lo que espera cualquiera con un ratón. passive en
// false porque hay que impedir que la página se desplace por debajo.
marcoRecorte.addEventListener("wheel", (event) => {
    if (!recorte) return;
    event.preventDefault();
    const barra = document.querySelector("#recorteZoom");
    const paso = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    const nuevo = Math.min(4, Math.max(1, recorte.zoom * paso));
    barra.value = String(nuevo);
    acercarRecorte(nuevo);
}, { passive: false });

document.querySelector("#recorteZoom").addEventListener("input", (event) => acercarRecorte(Number(event.target.value)));
document.querySelector("#recorteGuardar").addEventListener("click", guardarRecorte);
document.querySelector("#recorteCancelar").addEventListener("click", cerrarRecorte);
document.querySelector("#recorteFoto").addEventListener("click", (event) => {
    // Tocar el fondo oscuro cancela; dentro de la caja, no
    if (event.target.id === "recorteFoto") cerrarRecorte();
});
document.querySelector("#closeProfilePanel").addEventListener("click", () => setProfilePanel(false));
document.querySelector(".customize-sidebar").addEventListener("click", openAppPanel);
document.querySelector("#closeAppPanel").addEventListener("click", () => setAppPanel(false));

document.querySelector("#paletteOptions").addEventListener("click", (event) => {
    const button = event.target.closest("[data-palette]");
    if (button) updateAppSetting("palette", button.dataset.palette);
});

document.querySelector("#shapeOptions").addEventListener("click", (event) => {
    const button = event.target.closest("[data-shape]");
    if (button) updateAppSetting("shape", button.dataset.shape);
});

document.querySelector("#userName").addEventListener("input", (event) => {
    updateAppSetting("userName", event.target.value);
});
document.querySelector("#closeCustomize").addEventListener("click", () => setCustomizePanel(false));
// Tocar fuera de la hoja la cierra, como es habitual en móvil
document.querySelector("#sheetBackdrop").addEventListener("click", () => {
    setCustomizePanel(false);
    setAppPanel(false);
});

// El botón "Crear nuevo" del sidebar abre el mismo diálogo que las tarjetas.
document.querySelector(".new-button").addEventListener("click", () => openNewNoteDialog("nota"));

// Los dos paneles comparten los mismos data-*. Los del panel inferior guardan
// al instante porque ahí no hay botón "Aplicar cambios".
// Las muestras de color se generan después de este bloque, así que van por
// delegación; el resto son elementos estáticos del HTML.
document.querySelector("#noteColors").addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-color]");
    if (swatch) updateCustomization("color", swatch.dataset.color);
});

// Recuerda en qué campo estaba escribiendo, para insertar ahí el emoji.
[editorTitle, editorContent].forEach((field) => {
    field.addEventListener("focus", () => { lastEditableTarget = field; });
});

// Evita que el botón robe el foco: así el cursor no se pierde y el emoji cae
// exactamente donde estaba. Sin esto habría que recordar y restaurar el rango.
document.querySelector("#emojiGrid").addEventListener("mousedown", (event) => {
    if (event.target.closest("[data-emoji]")) event.preventDefault();
});

document.querySelector("#emojiGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-emoji]");
    if (button) insertEmoji(button.dataset.emoji);
});

function setEmojiPopover(open) {
    document.querySelector("#emojiGrid").hidden = !open;
    document.querySelector("#toggleEmojis").setAttribute("aria-expanded", String(open));
}

document.querySelector("#toggleEmojis").addEventListener("mousedown", (event) => event.preventDefault());
document.querySelector("#toggleEmojis").addEventListener("click", () => {
    setStickerPopover(false);
    setEmojiPopover(document.querySelector("#emojiGrid").hidden);
});

// Mismo trato que los emoji: el mousedown no debe robar el foco, o el cursor se
// pierde y la pegatina cae al final en vez de donde estabas.
document.querySelector("#stickerGrid").addEventListener("mousedown", (event) => {
    if (event.target.closest("[data-sticker]")) event.preventDefault();
});

document.querySelector("#stickerGrid").addEventListener("click", (event) => {
    const boton = event.target.closest("[data-sticker]");
    if (!boton) return;
    const pegatina = STICKERS.find((item) => item.file === boton.dataset.sticker);
    if (pegatina) addSticker(pegatina);
});

/* Mover, agrandar y girar las pegatinas ya colocadas.
   Con eventos de puntero, que valen igual para el ratón y para el dedo. */
const capaPegatinas = document.querySelector("#stickerLayer");

capaPegatinas.addEventListener("pointerdown", (event) => {
    const quitar = event.target.closest("[data-sticker-remove]");
    if (quitar) {
        removeSticker(quitar.dataset.stickerRemove);
        return;
    }

    const elemento = event.target.closest("[data-sticker-id]");
    if (!elemento) return;

    const pegatina = noteStickers().find((item) => item.id === elemento.dataset.stickerId);
    if (!pegatina) return;

    // Se marca sin volver a pintar la capa: si se repintara, el elemento que
    // acabas de agarrar sería otro y el arrastre se quedaría a medias.
    selectSticker(pegatina.id);

    const modo = event.target.closest("[data-sticker-resize]") ? "tamano"
        : event.target.closest("[data-sticker-rotate]") ? "giro"
            : "mover";

    stickerDrag = {
        modo,
        elemento,
        pegatina,
        actual: { ...pegatina },
        base: { ...pegatina },
        caja: capaPegatinas.getBoundingClientRect(),
        x0: event.clientX,
        y0: event.clientY
    };

    capaPegatinas.setPointerCapture(event.pointerId);
    event.preventDefault();
});

capaPegatinas.addEventListener("pointermove", (event) => {
    if (!stickerDrag) return;
    const { modo, elemento, actual, base, caja, x0, y0 } = stickerDrag;

    if (modo === "mover") {
        const dx = ((event.clientX - x0) / caja.width) * 100;
        const dy = ((event.clientY - y0) / caja.height) * 100;
        // Se deja asomar un poco por fuera, pero nunca del todo: si no, una
        // pegatina podría acabar fuera de la hoja y ya no se podría agarrar.
        actual.x = Math.min(95, Math.max(-10, base.x + dx));
        actual.y = Math.min(95, Math.max(-10, base.y + dy));
    } else if (modo === "tamano") {
        const dx = ((event.clientX - x0) / caja.width) * 100;
        actual.w = Math.min(85, Math.max(8, base.w + dx));
    } else {
        const r = elemento.getBoundingClientRect();
        const angulo = Math.atan2(event.clientY - (r.top + r.height / 2), event.clientX - (r.left + r.width / 2));
        actual.r = Math.round((angulo * 180) / Math.PI + 90);
    }

    elemento.setAttribute("style", stickerStyle(actual));
});

function terminarArrastre() {
    if (!stickerDrag) return;
    Object.assign(stickerDrag.pegatina, stickerDrag.actual);
    stickerDrag = null;
    persistNotes();
    renderCards();
}

capaPegatinas.addEventListener("pointerup", terminarArrastre);
capaPegatinas.addEventListener("pointercancel", terminarArrastre);

document.querySelector("#toggleStickers").addEventListener("mousedown", (event) => event.preventDefault());
document.querySelector("#toggleStickers").addEventListener("click", () => {
    // Los dos paneles salen del mismo sitio, así que nunca a la vez.
    setEmojiPopover(false);
    setStickerPopover(document.querySelector("#stickerGrid").hidden);
});

function setHeartPicker(open) {
    document.querySelector("#heartPicker").hidden = !open;
    document.querySelector("#heartDecoration").setAttribute("aria-expanded", String(open));
}

// El corazón elige rojo de un toque y además abre la paleta de colores.
document.querySelector("#heartDecoration").addEventListener("click", () => {
    setHeartPicker(document.querySelector("#heartPicker").hidden);
});

// Todo lo que flota se cierra al pulsar fuera. `dentro` enumera lo que NO
// cuenta como "fuera": el propio panel, el botón que lo abre (si no, el mismo
// clic que lo abre lo cerraría al llegar aquí) y lo que trabaja sobre él sin
// estar dentro.
const PANELES_FLOTANTES = [
    {
        abierto: () => document.querySelector("#notePanel").classList.contains("is-open"),
        cerrar: () => setCustomizePanel(false),
        dentro: "#notePanel, #openCustomizeMenu"
    },
    {
        abierto: () => document.querySelector("#appPanel").classList.contains("is-open"),
        cerrar: () => setAppPanel(false),
        dentro: "#appPanel, #openCustomize, .customize-sidebar"
    },
    {
        abierto: () => document.querySelector("#profilePanel").classList.contains("is-open"),
        cerrar: () => setProfilePanel(false),
        dentro: "#profilePanel, #avatarInitial"
    },
    {
        // El panel de personalizar nota y el diálogo de crear viven fuera del
        // editor pero trabajan sobre él: tocarlos no puede cerrarlo. Las
        // tarjetas y los botones de crear tampoco, porque son justo lo que lo
        // abre. En móvil el editor ocupa la pantalla entera y no hay "fuera".
        abierto: () => !document.querySelector(".editor").classList.contains("is-hidden"),
        cerrar: closeEditor,
        dentro: ".editor, #notesGrid, #notePanel, #openCustomizeMenu, #newNoteDialog, .new-button, [data-create-type], #sheetBackdrop, #fastenerPicker"
    }
];

// En fase de captura (el `true` final), es decir antes de que corran los
// manejadores de cada botón. Si no, un botón que vuelve a pintar su propio
// contenedor —elegir una categoría, un tipo, un color de recordatorio— queda
// desconectado del DOM antes de llegar aquí, y un elemento desconectado no
// encuentra ancestros: closest() daría null y esto lo tomaría por un clic de
// fuera, cerrando el editor desde dentro.
document.addEventListener("click", (event) => {
    if (!event.target.closest("#emojiGrid, #toggleEmojis")) setEmojiPopover(false);
    if (!event.target.closest("#stickerGrid, #toggleStickers")) setStickerPopover(false);
    // Pulsar en cualquier otro sitio quita la selección y con ella los tiradores
    if (selectedStickerId && !event.target.closest("#stickerLayer")) selectSticker(null);
    if (!event.target.closest("#heartPicker, #heartDecoration")) setHeartPicker(false);
    if (!event.target.closest("#categoryPicker, #editorCategory")) setCategoryPicker(false);
    if (!event.target.closest("#filterPicker, #mobileFilter")) setFilterPicker(false);
    if (!event.target.closest("#fastenerPicker, [data-fastener-id]")) setFastenerPicker(false);
    PANELES_FLOTANTES.forEach((panel) => {
        if (panel.abierto() && !event.target.closest(panel.dentro)) panel.cerrar();
    });
}, true);

// El diálogo de crear es un <dialog> nativo: su fondo oscurecido no es un
// elemento aparte, así que se mira si el clic cayó fuera de su recuadro. Se
// exige además que el objetivo sea el propio <dialog>: su relleno interior
// también lo devuelve como objetivo, y una pulsación con el teclado llega con
// las coordenadas en 0,0 y parecería de fuera.
newNoteDialog.addEventListener("click", (event) => {
    if (event.target !== newNoteDialog) return;
    const caja = newNoteDialog.getBoundingClientRect();
    const fuera = event.clientX < caja.left || event.clientX > caja.right
        || event.clientY < caja.top || event.clientY > caja.bottom;
    if (fuera) newNoteDialog.close();
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    setEmojiPopover(false);
    setStickerPopover(false);
    setHeartPicker(false);
    setCategoryPicker(false);
    setFilterPicker(false);
    setFastenerPicker(false);
    // El editor no se cierra con Escape a propósito: se escribe dentro y sería
    // fácil perder la nota de vista sin querer.
    setCustomizePanel(false);
    setAppPanel(false);
});

[
    ["data-background", "background"],
    ["data-style", "style"],
    ["data-decoration", "decoration"]
].forEach(([attribute, key]) => {
    document.querySelectorAll(`[${attribute}]`).forEach((button) => button.addEventListener("click", () => {
        const commit = !button.closest("#notePanel");
        updateCustomization(key, button.getAttribute(attribute), { commit });
    }));
});

document.querySelector("#fontSelector").addEventListener("click", () => {
    const currentIndex = FONT_OPTIONS.indexOf(customizationDraft.font || "Handlee");
    updateCustomization("font", FONT_OPTIONS[(currentIndex + 1) % FONT_OPTIONS.length]);
});
document.querySelector("#applyCustomize").addEventListener("click", saveAllChanges);

persistNotes();
applyCategoryAdditions();
applyCategoryIconUpdates();
persistCategories();
// renderPalettes va antes: applySettings marca la paleta activa y necesita que
// los botones ya existan.
renderPalettes();
renderShapes();
applySettings();
renderNoteColors();
renderEmojis();
renderStickers();
renderReminderColors();
renderCategoryDots();
renderDecorationSvgs();
colocarGraduador();
anchoMovil.addEventListener("change", colocarGraduador);
renderCards();
renderEditor();


/* =====================================================
   PUENTE CON LA NUBE

   notes, categories, reminders y settings se declaran con let: no viven en
   window, así que nube.js no puede verlas ni reemplazarlas por su cuenta.
   Este objeto es la única puerta entre las dos partes, y así el resto del
   archivo no se entera de que existe una nube.
===================================================== */

window.Cuadernito = {

    tablas: () => ({ notas: notes, categorias: categories, recordatorios: reminders }),

    ajustes: () => settings,

    // Por aquí entra lo que llega de la nube. Solo se toca lo que venga:
    // reemplazar({ notas }) no pisa las categorías ni los recordatorios.
    reemplazar(cambios) {
        if (Array.isArray(cambios.notas)) notes = cambios.notas.map(migrateNote);
        if (Array.isArray(cambios.categorias)) categories = cambios.categorias;
        if (Array.isArray(cambios.recordatorios)) reminders = cambios.recordatorios;
        if (cambios.ajustes && typeof cambios.ajustes === "object") settings = cambios.ajustes;

        // La nota que estaba abierta puede haberse borrado en el otro aparato
        if (!notes.some((note) => note.id === activeNoteId && !note.deleted)) {
            activeNoteId = notes.find((note) => !note.deleted)?.id || null;
        }

        persistNotes();
        persistCategories();
        persistReminders();
        persistSettings();

        applySettings();
        renderCategories();
        renderFilterPicker();
        renderCalendar();
        renderReminders();
        renderCounts();
        renderCards();

        // Si está escribiendo en este momento, repintar el editor le movería
        // el cursor a otro sitio a media frase. Lo que llegó ya está guardado
        // y se verá en cuanto cierre la nota.
        const escribiendo = document.activeElement && document.activeElement.closest
            && document.activeElement.closest(".editor");
        if (!escribiendo) renderEditor();
    },

    // Entra otra persona en este mismo navegador. El cuaderno que hay aquí es
    // del anterior y ya está guardado en SU nube; si se dejara, la primera
    // sincronización lo subiría a la cuenta nueva y se mezclarían los dos.
    vaciar() {
        notes = seedNotes();
        categories = seedCategories();
        reminders = [];
        settings = {};
        activeNoteId = notes.find((note) => !note.deleted)?.id || null;

        persistNotes();
        persistCategories();
        persistReminders();
        persistSettings();

        applySettings();
        renderCategories();
        renderFilterPicker();
        renderCalendar();
        renderReminders();
        renderCounts();
        renderCards();
        renderEditor();
    },

    // Vuelve del enlace del correo: que vea en qué quedó la cosa
    abrirCuenta() {
        openProfilePanel();
    }
};
