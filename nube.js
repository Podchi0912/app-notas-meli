/* =====================================================
   NUBE — la cuenta y la sincronización

   Cómo funciona, en corto:

   1. El cuaderno sigue viviendo en este aparato (localStorage). Todo lo
      que se escribe se guarda aquí primero, con o sin internet. La nube
      es una copia que se pone al día cuando puede, no el sitio del que
      depende la página para arrancar.

   2. Para entrar no hay contraseña: se pide un enlace al correo. El
      enlace vuelve a la página con dos llaves en la dirección, se
      guardan, y a partir de ahí la base de datos ya sabe quién eres.

   3. Al sincronizar se hacen dos pasos: bajar lo que cambió en la nube
      desde la última vez, y subir lo que cambió aquí. Para saber "qué
      cambió aquí" se guarda una huella corta de cada nota; si la huella
      de ahora no coincide con la de la última subida, es que se tocó.
      Lo que desapareció de la lista pero tenía huella es que se borró, y
      se sube como borrado (una fila marcada, no un hueco: si se quitara
      la fila, el otro aparato nunca se enteraría y la nota reaparecería).

   4. Si la misma nota se editó en los dos sitios, gana la más reciente.
      Es una comparación entre el reloj de este aparato y el del
      servidor, así que un reloj muy desajustado puede equivocarse. Pasa
      poco: hay que editar la misma nota en dos sitios antes de que a
      ninguno de los dos le dé tiempo a sincronizar.

   No usa ninguna librería de fuera: solo fetch contra Supabase. Así la
   página no depende de que un servidor ajeno esté vivo para abrirse.
===================================================== */

(function () {
    "use strict";

    const CFG = window.CONFIG_NUBE || {};
    const API = String(CFG.url || "").replace(/\/+$/, "");
    const CLAVE = String(CFG.clave || "");
    const HAY_NUBE = Boolean(API && CLAVE);

    const SESION_KEY = "mi-cuadernito-sesion";
    const SINCRO_KEY = "mi-cuadernito-sincro";

    // Las tres listas. Los ajustes van aparte: son una sola fila por persona.
    const TABLAS = ["notas", "categorias", "recordatorios"];

    const LOTE = 25;      // filas por envío, para no mandar peticiones enormes
    const PAGINA = 200;   // filas por lectura
    const EPOCA = "1970-01-01T00:00:00+00:00";

    const app = window.Cuadernito;

    const cajaEstado = document.querySelector("#cuentaEstado");
    const formulario = document.querySelector("#cuentaForm");
    const campoCorreo = document.querySelector("#cuentaCorreo");
    const campoClave = document.querySelector("#cuentaClave");
    const botonEnlace = document.querySelector("#cuentaEnlace");
    const botonEntrar = document.querySelector("#cuentaEntrar");
    const acciones = document.querySelector("#cuentaAcciones");
    const botonSalir = document.querySelector("#cuentaSalir");
    const botonAhora = document.querySelector("#cuentaSincronizar");
    const pista = document.querySelector("#cuentaPista");
    const titulo = document.querySelector("#entradaTitulo");
    const subtitulo = document.querySelector("#entradaSub");
    const pregunta = document.querySelector("#entradaPregunta");
    const botonModo = document.querySelector("#cambiarModo");
    const detalle = document.querySelector("#cuentaDetalle");

    let sesion = leerJson(SESION_KEY, null);
    let meta = leerJson(SINCRO_KEY, null) || metaVacia();
    let sincronizando = false;
    let repetir = false;
    let temporizador = null;
    // Si hay una completa pendiente, una de solo subir no puede comérsela
    let completaPendiente = false;
    let aviso = "";
    let avisoMalo = false;
    let creandoCuenta = false;

    // El mínimo que pide Supabase por defecto. Se comprueba aquí para no
    // gastar un viaje al servidor y para poder decirlo en español.
    const CLAVE_MINIMA = 6;


    /* ============================= utilidades ============================= */

    function leerJson(clave, porDefecto) {
        try {
            const crudo = localStorage.getItem(clave);
            return crudo ? JSON.parse(crudo) : porDefecto;
        } catch {
            return porDefecto;
        }
    }

    function guardarJson(clave, valor) {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
        } catch {
            /* sin espacio: la sincronización se rehará desde cero, no es grave */
        }
    }

    function metaVacia() {
        return { usuario: null, desde: {}, huellas: { ajustes: null }, editado: {}, ultima: 0 };
    }

    function guardarMeta() {
        guardarJson(SINCRO_KEY, meta);
    }

    // Huella corta de un objeto (FNV-1a + longitud). No es criptografía: solo
    // sirve para responder "¿esto es lo mismo que subí la última vez?" sin
    // tener que guardar una segunda copia entera del cuaderno.
    function huella(valor) {
        const texto = JSON.stringify(valor);
        let h = 0x811c9dc5;
        for (let i = 0; i < texto.length; i++) {
            h ^= texto.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return (h >>> 0).toString(36) + "." + texto.length.toString(36);
    }

    // El identificador y el correo viajan dentro de la propia llave de acceso
    function leerLlave(token) {
        try {
            let cuerpo = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
            while (cuerpo.length % 4) cuerpo += "=";
            const binario = atob(cuerpo);
            const bytes = Uint8Array.from(binario, (letra) => letra.charCodeAt(0));
            return JSON.parse(new TextDecoder().decode(bytes));
        } catch {
            return {};
        }
    }

    async function textoDelError(respuesta) {
        let detalle = "";
        try {
            const cuerpo = await respuesta.json();
            detalle = cuerpo.msg || cuerpo.message || cuerpo.error_description || cuerpo.error || "";
        } catch {
            /* sin cuerpo legible */
        }
        return detalle || ("error " + respuesta.status);
    }


    /* ================================ cuenta ============================== */

    function guardarSesion(datos) {
        const dentro = leerLlave(datos.acceso);
        sesion = {
            acceso: datos.acceso,
            refresco: datos.refresco,
            expira: datos.expira,
            usuario: dentro.sub || null,
            correo: dentro.email || ""
        };
        guardarJson(SESION_KEY, sesion);
    }

    function olvidarSesion() {
        sesion = null;
        try {
            localStorage.removeItem(SESION_KEY);
        } catch {
            /* nada que hacer */
        }
    }

    // Entrada normal, con contraseña. Es la de siempre porque no depende del
    // correo: ni esperas, ni límite de envíos, ni enlaces caducados. La
    // contraseña la escribe ella y no está en ninguna parte de la página; si
    // estuviera, cualquiera que abriese la web entraría en el cuaderno.
    async function entrarConClave(correo, secreto) {
        const respuesta = await fetch(API + "/auth/v1/token?grant_type=password", {
            method: "POST",
            headers: { apikey: CLAVE, "Content-Type": "application/json" },
            body: JSON.stringify({ email: correo, password: secreto })
        });
        if (!respuesta.ok) {
            const detalle = await textoDelError(respuesta);
            if (/invalid login/i.test(detalle)) throw new Error("Correo o contraseña incorrectos.");
            if (/not confirmed/i.test(detalle)) throw new Error("Ese correo está sin confirmar en Supabase.");
            throw new Error(detalle);
        }
        const datos = await respuesta.json();
        guardarSesion({
            acceso: datos.access_token,
            refresco: datos.refresh_token || "",
            expira: Date.now() + (Number(datos.expires_in) || 3600) * 1000
        });
    }

    // Crea la cuenta. Si el proyecto tiene la confirmación por correo apagada,
    // Supabase devuelve ya la sesión y se entra del tirón; si la tiene puesta,
    // devuelve solo el usuario y hay que pasar por la bandeja de entrada.
    async function crearCuenta(correo, secreto) {
        const destino = location.origin + location.pathname;
        const respuesta = await fetch(API + "/auth/v1/signup?redirect_to=" + encodeURIComponent(destino), {
            method: "POST",
            headers: { apikey: CLAVE, "Content-Type": "application/json" },
            body: JSON.stringify({ email: correo, password: secreto })
        });

        if (!respuesta.ok) {
            const detalle = await textoDelError(respuesta);
            if (/already registered|already exists/i.test(detalle)) {
                throw new Error("Ya hay un cuaderno con ese correo. Entra en vez de crearlo.");
            }
            if (/signups? not allowed|signup is disabled/i.test(detalle)) {
                throw new Error("Ahora mismo no se pueden crear cuadernos nuevos.");
            }
            if (/password/i.test(detalle)) {
                throw new Error("Esa contraseña no vale: tiene que tener al menos " + CLAVE_MINIMA + " caracteres.");
            }
            if (/rate limit|too many/i.test(detalle)) {
                throw new Error("Demasiados intentos seguidos. Espera un minuto.");
            }
            throw new Error(detalle);
        }

        const datos = await respuesta.json();
        if (!datos.access_token) return false;      // hay que confirmar por correo

        guardarSesion({
            acceso: datos.access_token,
            refresco: datos.refresh_token || "",
            expira: Date.now() + (Number(datos.expires_in) || 3600) * 1000
        });
        return true;
    }

    // Manda el correo con el enlace de entrada (por si olvida la contraseña)
    async function pedirEnlace(correo) {
        const destino = location.origin + location.pathname;
        const respuesta = await fetch(API + "/auth/v1/otp?redirect_to=" + encodeURIComponent(destino), {
            method: "POST",
            headers: { apikey: CLAVE, "Content-Type": "application/json" },
            // create_user en false: este botón es para volver a entrar, nunca para
            // darse de alta. Con true, cualquiera que abriese la página podría
            // crearse una cuenta dentro del proyecto solo con poner su correo.
            body: JSON.stringify({ email: correo, create_user: false })
        });
        if (!respuesta.ok) {
            const detalle = await textoDelError(respuesta);
            if (/signup|not found|disabled/i.test(detalle)) {
                throw new Error("Ese correo no tiene cuenta en este cuaderno.");
            }
            throw new Error(detalle);
        }
    }

    // El enlace del correo devuelve a la página con las llaves detrás de #.
    // Se recogen y se borran de la barra de direcciones, para que no se
    // queden en el historial ni se compartan al copiar la dirección.
    function recogerLlavesDeLaDireccion() {
        const trozo = location.hash.startsWith("#") ? location.hash.slice(1) : "";
        if (!trozo || trozo.indexOf("=") === -1) return false;

        const partes = new URLSearchParams(trozo);
        const acceso = partes.get("access_token");
        const fallo = partes.get("error_description") || partes.get("error");
        if (!acceso && !fallo) return false;

        history.replaceState(null, "", location.pathname + location.search);

        if (fallo) {
            aviso = /expired/i.test(fallo)
                ? "Ese enlace ya caducó. Pide otro."
                : decodeURIComponent(String(fallo).replace(/\+/g, " "));
            avisoMalo = true;
            return false;
        }

        guardarSesion({
            acceso,
            refresco: partes.get("refresh_token") || "",
            expira: Date.now() + (Number(partes.get("expires_in")) || 3600) * 1000
        });
        aviso = "";
        avisoMalo = false;
        return true;
    }

    async function renovarLlave() {
        if (!sesion || !sesion.refresco) throw new Error("sin sesión");
        const respuesta = await fetch(API + "/auth/v1/token?grant_type=refresh_token", {
            method: "POST",
            headers: { apikey: CLAVE, "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: sesion.refresco })
        });
        if (!respuesta.ok) {
            // Un refresco caducado no se arregla reintentando: hay que entrar de nuevo
            if (respuesta.status === 400 || respuesta.status === 401) {
                olvidarSesion();
                throw new Error("La sesión caducó, vuelve a entrar con tu correo.");
            }
            throw new Error(await textoDelError(respuesta));
        }
        const datos = await respuesta.json();
        guardarSesion({
            acceso: datos.access_token,
            refresco: datos.refresh_token || sesion.refresco,
            expira: Date.now() + (Number(datos.expires_in) || 3600) * 1000
        });
    }

    async function llaveAlDia() {
        if (!sesion) throw new Error("sin sesión");
        // Un minuto de margen: si caduca a mitad de la subida, se pierde el envío
        if (Date.now() > (sesion.expira || 0) - 60000) await renovarLlave();
        return sesion.acceso;
    }

    async function salir() {
        const guardada = sesion;
        olvidarSesion();
        // La memoria de sincronización se queda, y con ella de quién era este
        // cuaderno. Hace dos cosas: si vuelve la misma persona, sigue por donde
        // iba en vez de bajárselo todo otra vez; y si entra otra, se sabe que
        // el cuaderno que hay aquí no es suyo y hay que vaciarlo antes de
        // abrirle la puerta. Borrándola, lo segundo era imposible de detectar
        // y las notas de la primera acababan subidas a la cuenta de la segunda.
        guardarMeta();
        pintar();
        if (!guardada) return;
        try {
            await fetch(API + "/auth/v1/logout", {
                method: "POST",
                headers: { apikey: CLAVE, Authorization: "Bearer " + guardada.acceso }
            });
        } catch {
            /* da igual: la llave ya no está en este aparato */
        }
    }


    /* ============================ base de datos =========================== */

    async function rest(ruta, opciones, reintento) {
        const acceso = await llaveAlDia();
        const respuesta = await fetch(API + "/rest/v1/" + ruta, Object.assign({}, opciones, {
            headers: Object.assign({
                apikey: CLAVE,
                Authorization: "Bearer " + acceso,
                "Content-Type": "application/json"
            }, (opciones && opciones.headers) || {})
        }));

        // Un 401 con la llave recién comprobada suele ser desfase de relojes:
        // se renueva una vez y se reintenta antes de dar el error por bueno.
        if (respuesta.status === 401 && !reintento) {
            await renovarLlave();
            return rest(ruta, opciones, true);
        }
        if (!respuesta.ok) throw new Error(await textoDelError(respuesta));

        const texto = await respuesta.text();
        return texto ? JSON.parse(texto) : null;
    }


    /* ============================ sincronización ========================== */

    // Repasa qué cambió en este aparato desde la última subida y apunta cuándo
    // se detectó, que es lo que decide quién gana si hay choque.
    function marcarSucios() {
        const ahora = Date.now();
        const listas = app.tablas();

        TABLAS.forEach((tabla) => {
            const huellas = meta.huellas[tabla] || (meta.huellas[tabla] = {});
            const editado = meta.editado[tabla] || (meta.editado[tabla] = {});
            const vivos = new Set();

            (listas[tabla] || []).forEach((item) => {
                if (!item || !item.id) return;
                vivos.add(item.id);
                if (huellas[item.id] !== huella(item)) editado[item.id] = ahora;
            });

            Object.keys(huellas).forEach((id) => {
                if (!vivos.has(id)) editado[id] = ahora;
            });
        });

        if (meta.huellas.ajustes !== huella(app.ajustes())) meta.editado.ajustes = ahora;
        guardarMeta();
    }

    async function traerCambios(tabla) {
        const todas = [];
        let desde = meta.desde[tabla] || EPOCA;

        for (let vuelta = 0; vuelta < 40; vuelta++) {
            const filas = await rest(tabla
                + "?select=id,datos,actualizado,borrado"
                + "&actualizado=gt." + encodeURIComponent(desde)
                + "&order=actualizado.asc&limit=" + PAGINA);
            if (!filas || !filas.length) break;
            todas.push.apply(todas, filas);
            desde = filas[filas.length - 1].actualizado;
            if (filas.length < PAGINA) break;
        }

        meta.desde[tabla] = desde;
        return todas;
    }

    async function bajar() {
        const listas = app.tablas();
        const nuevas = {};
        const aplicadas = {};
        let ajustesAplicados = false;
        let cambio = false;

        for (const tabla of TABLAS) {
            const estrena = !meta.desde[tabla];
            const filas = await traerCambios(tabla);
            aplicadas[tabla] = new Set();
            if (!filas.length) continue;

            let lista = (listas[tabla] || []).slice();

            // Aparato nuevo que entra en un cuaderno que ya existe: las notas
            // de ejemplo que la página se inventa al abrirse por primera vez
            // sobran, o se verían mezcladas con las de verdad. Lo que ella
            // haya escrito aquí antes de entrar no lleva esa marca y se queda.
            if (estrena) {
                const limpia = lista.filter((item) => !item || !item.semilla);
                if (limpia.length !== lista.length) {
                    lista = limpia;
                    cambio = true;
                }
            }

            const porId = new Map(lista.filter((item) => item && item.id).map((item) => [item.id, item]));
            const editado = meta.editado[tabla] || (meta.editado[tabla] = {});

            filas.forEach((fila) => {
                const marcaLocal = editado[fila.id];
                const marcaRemota = Date.parse(fila.actualizado);
                // Se tocó aquí después de lo que llega: gana este aparato y se
                // subirá en el paso siguiente.
                if (!estrena && marcaLocal && marcaLocal > marcaRemota) return;

                if (fila.borrado) {
                    if (porId.delete(fila.id)) cambio = true;
                } else {
                    const antes = porId.get(fila.id);
                    if (!antes || huella(antes) !== huella(fila.datos)) cambio = true;
                    porId.set(fila.id, fila.datos);
                }
                delete editado[fila.id];
                aplicadas[tabla].add(fila.id);
            });

            nuevas[tabla] = Array.from(porId.values());
        }

        // Los ajustes son una fila sola: no hay nada que fusionar, o gana el de
        // la nube o gana el de aquí.
        const estrenaAjustes = !meta.desde.ajustes;
        const filasAjustes = await rest("ajustes?select=datos,actualizado"
            + "&actualizado=gt." + encodeURIComponent(meta.desde.ajustes || EPOCA)
            + "&limit=1");
        if (filasAjustes && filasAjustes.length) {
            const fila = filasAjustes[0];
            meta.desde.ajustes = fila.actualizado;
            const marcaLocal = meta.editado.ajustes;
            if (estrenaAjustes || !marcaLocal || marcaLocal <= Date.parse(fila.actualizado)) {
                if (huella(app.ajustes()) !== huella(fila.datos)) cambio = true;
                nuevas.ajustes = fila.datos;
                delete meta.editado.ajustes;
                ajustesAplicados = true;
            }
        } else if (estrenaAjustes) {
            meta.desde.ajustes = EPOCA;
        }

        if (!cambio) {
            guardarMeta();
            return false;
        }

        app.reemplazar(nuevas);

        // Las huellas se recalculan sobre lo que quedó de verdad en la página,
        // no sobre lo que vino: al llegar, una nota vieja puede estrenar
        // campos nuevos, y si guardáramos la huella de la versión de la nube
        // la daríamos por cambiada y la subiríamos otra vez, en bucle.
        const finales = app.tablas();
        TABLAS.forEach((tabla) => {
            const porId = new Map((finales[tabla] || []).filter((item) => item && item.id).map((item) => [item.id, item]));
            (aplicadas[tabla] || new Set()).forEach((id) => {
                const item = porId.get(id);
                if (item) meta.huellas[tabla][id] = huella(item);
                else delete meta.huellas[tabla][id];
            });
        });
        if (ajustesAplicados) meta.huellas.ajustes = huella(app.ajustes());

        guardarMeta();
        return true;
    }

    async function subir() {
        const listas = app.tablas();

        for (const tabla of TABLAS) {
            const huellas = meta.huellas[tabla] || (meta.huellas[tabla] = {});
            const editado = meta.editado[tabla] || (meta.editado[tabla] = {});
            const lista = (listas[tabla] || []).filter((item) => item && item.id);
            const vivos = new Set(lista.map((item) => item.id));
            const filas = [];

            lista.forEach((item) => {
                if (huellas[item.id] !== huella(item)) {
                    filas.push({ usuario: sesion.usuario, id: item.id, datos: item, borrado: null });
                }
            });

            // Lo que tenía huella y ya no está en la lista: se borró aquí
            Object.keys(huellas).forEach((id) => {
                if (!vivos.has(id)) {
                    filas.push({ usuario: sesion.usuario, id, datos: {}, borrado: new Date().toISOString() });
                }
            });

            for (let i = 0; i < filas.length; i += LOTE) {
                const lote = filas.slice(i, i + LOTE);
                await rest(tabla + "?on_conflict=usuario,id", {
                    method: "POST",
                    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
                    body: JSON.stringify(lote)
                });
                lote.forEach((fila) => {
                    if (fila.borrado) delete huellas[fila.id];
                    else huellas[fila.id] = huella(fila.datos);
                    delete editado[fila.id];
                });
                guardarMeta();
            }
        }

        const ajustes = app.ajustes();
        if (meta.huellas.ajustes !== huella(ajustes)) {
            await rest("ajustes?on_conflict=usuario", {
                method: "POST",
                headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
                body: JSON.stringify([{ usuario: sesion.usuario, datos: ajustes }])
            });
            meta.huellas.ajustes = huella(ajustes);
            delete meta.editado.ajustes;
            guardarMeta();
        }
    }

    /* Escribir una nota no es motivo para preguntarle al servidor si hay algo
       nuevo: lo único que hace falta es mandar lo que acaba de cambiar. Antes
       cada pausa al teclear disparaba la vuelta entera —cuatro consultas más
       el envío—, y escribiendo un rato eso son quince viajes en siete
       segundos. Bajar se deja para el repaso de cada minuto, para cuando se
       vuelve a la pestaña y para el botón de sincronizar a mano. */
    async function sincronizar(opciones) {
        const soloSubir = Boolean(opciones && opciones.soloSubir);
        if (!HAY_NUBE || !sesion) return;
        if (sincronizando) {
            repetir = true;
            if (!soloSubir) completaPendiente = true;
            return;
        }
        if (!navigator.onLine) { pintar(); return; }

        sincronizando = true;
        pintar();

        try {
            // Otra cuenta en el mismo navegador: las huellas de la anterior no
            // valen nada y harían que se subieran notas ajenas.
            if (meta.usuario && meta.usuario !== sesion.usuario) meta = metaVacia();

            marcarSucios();
            if (!soloSubir) await bajar();
            await subir();

            meta.usuario = sesion.usuario;
            meta.ultima = Date.now();
            guardarMeta();
            if (avisoMalo) { aviso = ""; avisoMalo = false; }
        } catch (error) {
            aviso = error && error.message ? error.message : "No se pudo sincronizar.";
            avisoMalo = true;
        } finally {
            sincronizando = false;
            pintar();
            if (repetir) { repetir = false; programar(800); }
        }
    }

    function programar(espera, soloSubir) {
        if (!soloSubir) completaPendiente = true;
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
            const completa = completaPendiente;
            completaPendiente = false;
            sincronizar({ soloSubir: !completa });
        }, espera);
    }


    /* ================================ pantalla ============================ */

    function ocupado(boton, texto) {
        boton.disabled = true;
        boton.dataset.textoOriginal = boton.dataset.textoOriginal || boton.textContent;
        boton.textContent = texto;
    }

    function libre(boton, texto) {
        boton.disabled = false;
        boton.textContent = texto || boton.dataset.textoOriginal || boton.textContent;
    }

    function hace(marca) {
        const segundos = Math.round((Date.now() - marca) / 1000);
        if (segundos < 60) return "hace un momento";
        const minutos = Math.round(segundos / 60);
        if (minutos < 60) return "hace " + minutos + " min";
        const horas = Math.round(minutos / 60);
        if (horas < 24) return "hace " + horas + " h";
        return "hace " + Math.round(horas / 24) + " días";
    }

    // Entrar y crear cuenta piden lo mismo, así que es el mismo formulario con
    // otras palabras. Cambia también el autocomplete: en un alta el navegador
    // debe ofrecer una contraseña nueva, no rellenar la guardada.
    function ponerModo(registro) {
        creandoCuenta = registro;
        aviso = "";
        avisoMalo = false;

        titulo.textContent = registro ? "Crea tu cuaderno" : "Bienvenido";
        subtitulo.textContent = registro
            ? "Tus notas serán solo tuyas."
            : "Entra para ver tus notas.";
        botonEntrar.textContent = registro ? "Crear cuaderno" : "Entrar";
        botonEntrar.dataset.textoOriginal = botonEntrar.textContent;
        campoClave.autocomplete = registro ? "new-password" : "current-password";
        campoClave.placeholder = registro
            ? "Contraseña (mínimo " + CLAVE_MINIMA + ")"
            : "Contraseña";
        // El enlace al correo solo sirve para volver a entrar en algo que ya existe
        if (botonEnlace) botonEnlace.hidden = registro;
        pregunta.textContent = registro ? "¿Ya tienes cuaderno?" : "¿Todavía no tienes cuaderno?";
        botonModo.textContent = registro ? "Entrar" : "Crear uno";

        pintar();
    }

    function pintar() {
        // Sin nube configurada no hay puerta que valga: el cuaderno funciona
        // igual guardando solo aquí, y dejarlo cerrado sería dejarlo inservible.
        if (HAY_NUBE) document.documentElement.classList.toggle("sin-entrar", !sesion);

        if (!cajaEstado) return;

        if (!HAY_NUBE) {
            cajaEstado.textContent = "Guardando solo en este aparato";
            cajaEstado.className = "cuenta-estado";
            if (acciones) acciones.hidden = true;
            if (detalle) detalle.textContent = "Falta rellenar config.js para usar la nube.";
            return;
        }

        if (acciones) acciones.hidden = !sesion;

        if (!sesion) {
            // El panel está detrás de la puerta y no se ve; lo que se lee es la
            // pista de la pantalla de entrada.
            cajaEstado.textContent = "Sin entrar";
            cajaEstado.className = "cuenta-estado";
            if (pista) {
                pista.textContent = aviso || (creandoCuenta
                    ? "Se crea con tu correo y una contraseña. Nadie más verá tus notas, ni siquiera quien tenga otro cuaderno aquí."
                    : "Entra con tu correo y tu contraseña. Solo hace falta una vez en cada aparato: después se queda entrada.");
                pista.classList.toggle("cuenta-mal", avisoMalo);
            }
            return;
        }

        let texto;
        let clase = "cuenta-estado cuenta-bien";
        if (sincronizando) {
            texto = "Sincronizando…";
            clase = "cuenta-estado";
        } else if (!navigator.onLine) {
            texto = "Sin conexión · se guardará al volver";
            clase = "cuenta-estado";
        } else if (avisoMalo) {
            texto = "No se pudo sincronizar";
            clase = "cuenta-estado cuenta-mal";
        } else if (meta.ultima) {
            texto = "Al día · " + hace(meta.ultima);
        } else {
            texto = "Conectada";
        }

        cajaEstado.textContent = texto;
        cajaEstado.className = clase;
        if (detalle) {
            detalle.textContent = avisoMalo && aviso
                ? aviso
                : (sesion.correo || "") + " · tus notas también se guardan en la nube.";
            detalle.classList.toggle("cuenta-mal", avisoMalo);
        }
    }


    /* ================================ arranque ============================ */

    if (!app) return;                 // script.js no llegó a cargar

    app.alCambiar = function () {
        // 2,5s en vez de 1,2: escribiendo, cada pausa corta disparaba un envío
        if (sesion) programar(2500, true);
    };

    if (!HAY_NUBE) {
        pintar();
        return;
    }

    const recienEntrada = recogerLlavesDeLaDireccion();

    if (formulario) {
        formulario.addEventListener("submit", async (evento) => {
            evento.preventDefault();
            const correo = (campoCorreo.value || "").trim();
            const secreto = campoClave ? campoClave.value : "";
            if (!correo) return;
            if (!secreto) {
                aviso = creandoCuenta
                    ? "Elige una contraseña para tu cuaderno."
                    : "Escribe también la contraseña, o pide un enlace al correo.";
                avisoMalo = true;
                pintar();
                return;
            }
            if (creandoCuenta && secreto.length < CLAVE_MINIMA) {
                aviso = "La contraseña necesita al menos " + CLAVE_MINIMA + " caracteres.";
                avisoMalo = true;
                pintar();
                return;
            }

            ocupado(botonEntrar, creandoCuenta ? "Creando…" : "Entrando…");
            try {
                const dentro = creandoCuenta
                    ? await crearCuenta(correo, secreto)
                    : (await entrarConClave(correo, secreto), true);

                if (!dentro) {
                    // El proyecto pide confirmar por correo
                    aviso = "Te mandé un correo a " + correo + " para confirmar el cuaderno. Ábrelo y luego entra.";
                    avisoMalo = false;
                } else {
                    // Otra persona entrando donde ya hubo otra cuenta: el cuaderno
                    // que hay aquí es del anterior y ya está en SU nube, así que
                    // se va antes de abrir la puerta.
                    if (meta.usuario && meta.usuario !== sesion.usuario && app.vaciar) {
                        app.vaciar();
                        meta = metaVacia();
                        guardarMeta();
                    }
                    if (campoClave) campoClave.value = "";
                    aviso = "";
                    avisoMalo = false;
                    pintar();
                    sincronizar();
                }
            } catch (error) {
                aviso = error && error.message
                    ? error.message
                    : (creandoCuenta ? "No se pudo crear el cuaderno." : "No se pudo entrar.");
                avisoMalo = true;
            }
            libre(botonEntrar, creandoCuenta ? "Crear cuaderno" : "Entrar");
            pintar();
        });
    }

    if (botonEnlace) {
        botonEnlace.addEventListener("click", async () => {
            const correo = (campoCorreo.value || "").trim();
            if (!correo) {
                aviso = "Escribe primero tu correo.";
                avisoMalo = true;
                pintar();
                return;
            }
            ocupado(botonEnlace, "Enviando…");
            try {
                await pedirEnlace(correo);
                aviso = "Te mandé un enlace a " + correo + ". Ábrelo desde este mismo aparato.";
                avisoMalo = false;
            } catch (error) {
                aviso = error && error.message ? error.message : "No se pudo enviar el correo.";
                avisoMalo = true;
            }
            libre(botonEnlace, "Prefiero un enlace al correo");
            pintar();
        });
    }

    if (botonModo) botonModo.addEventListener("click", () => ponerModo(!creandoCuenta));

    if (botonSalir) {
        botonSalir.addEventListener("click", () => {
            if (!confirm("¿Cerrar sesión? Volverás a la pantalla de entrada. Tus notas siguen en la nube y en este aparato.")) return;
            aviso = "";
            avisoMalo = false;
            creandoCuenta = false;
            ponerModo(false);
            salir();
        });
    }

    if (botonAhora) botonAhora.addEventListener("click", () => sincronizar());

    window.addEventListener("online", () => { pintar(); programar(500); });
    window.addEventListener("offline", pintar);
    document.addEventListener("visibilitychange", () => {
        // Al volver a la página se recoge lo del otro aparato; al salir se
        // intenta dejar subido lo último, que en el móvil es cuando de verdad
        // se cierra la pestaña.
        if (!document.hidden) programar(500);
        else sincronizar();
    });

    // Repaso de fondo, por si el cambio se hizo en el otro aparato
    setInterval(() => { if (!document.hidden) sincronizar(); }, 60000);

    pintar();
    if (sesion) programar(recienEntrada ? 100 : 1500);
    if (recienEntrada && app.abrirCuenta) app.abrirCuenta();
})();
