/* =========================================================================
   Calidade Systems · Carballo — «Traza»

   GSAP, ScrollTrigger y Lenis llegan de un CDN. Si fallan (bloqueador, red,
   CDN caído) nada de lo de aquí puede romper la página: las pistas se ven
   dibujadas, los nodos encendidos, los textos visibles, el teléfono, el
   mapa, el formulario y las entradas de respaldo funcionan igual. Por eso
   los estados «ocultos» viven en el CSS bajo html.has-motion, que solo se
   enciende desde aquí.

   El movimiento de esta plantilla es el de una placa: la pista llega, el
   pad se enciende, la tarjeta aparece. Nada parpadea rápido, no hay canvas,
   ni blur por frame, ni partículas.
   ========================================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gsapReady = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  var motion = gsapReady && !reduce;
  var html = document.documentElement;

  if (gsapReady) gsap.registerPlugin(ScrollTrigger);
  if (motion) html.classList.add("has-motion");
  if (!gsapReady) html.classList.add("sin-gsap");

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var rem = function () { return parseFloat(getComputedStyle(html).fontSize) || 16; };
  var navH = function () { return (parseFloat(getComputedStyle(html).getPropertyValue("--nav-h")) || 4.5) * rem(); };
  /* la misma cuenta que el `top` pegajoso de .stack-item en el CSS */
  var topePegajoso = function () { return navH() + 1.5 * rem(); };
  var SVGNS = "http://www.w3.org/2000/svg";
  var LANG = document.body.getAttribute("data-lang") || "es";

  function svgEl(nombre, attrs) {
    var e = document.createElementNS(SVGNS, nombre);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function absTop(el) { return el.getBoundingClientRect().top + window.pageYOffset; }

  /* ======================================================================
     1 · división en caracteres (accesible)
     El texto real se sustituye por spans; la frase completa se conserva en
     aria-label. La palabra va en inline-block + nowrap o el navegador parte
     las palabras por la mitad.
     ====================================================================== */
  function partirCaracteres(el) {
    var texto = el.textContent.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", texto);
    el.textContent = "";
    var chars = [];
    var palabras = texto.split(" ");
    palabras.forEach(function (palabra, i) {
      var w = document.createElement("span");
      w.className = "split-word";
      w.setAttribute("aria-hidden", "true");
      Array.prototype.forEach.call(palabra, function (ch) {
        var c = document.createElement("span");
        c.className = "split-char";
        c.textContent = ch;
        w.appendChild(c);
        chars.push(c);
      });
      el.appendChild(w);
      if (i < palabras.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return chars;
  }
  var mapaChars = new Map();
  if (motion) $$("[data-split-char]").forEach(function (el) { mapaChars.set(el, partirCaracteres(el)); });

  /* ======================================================================
     2 · aviso de cookies — con rechazo real
     Esta web no instala nada de terceros por su cuenta, así que «rechazar»
     no tiene que desactivar ningún script: lo único que se guarda es la
     decisión. El botón tiene que funcionar de verdad, y en el CSS no hay
     ningún display que pueda ganarle a [hidden].
     ====================================================================== */
  (function avisoCookies() {
    var banner = $(".cookie-banner");
    if (!banner) return;
    var CLAVE = "calidade-cookies";
    var previo = null;
    try { previo = localStorage.getItem(CLAVE); } catch (e) {}
    if (!previo) banner.hidden = false;
    if (previo === "rechazo") html.classList.add("sin-terceros");
    $$("[data-cookie]", banner).forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-cookie");
        banner.hidden = true;
        if (v === "rechazo") html.classList.add("sin-terceros");
        try { localStorage.setItem(CLAVE, v); } catch (e) {}
      });
    });
  })();

  /* ====================================================================== */
  (function menuMovil() {
    var toggle = $(".nav-toggle"), menu = $(".nav-movil");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function () {
      var abierto = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", abierto ? "false" : "true");
      menu.hidden = abierto;
    });
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        menu.hidden = true;
      });
    });
  })();

  /* ======================================================================
     3 · mapa bajo demanda — sin API key y sin contactar con Google hasta
     que el visitante pulsa. Es lo que hace cierto el aviso de «sin cookies
     de terceros»: si el iframe se montara solo, sería mentira.
     ====================================================================== */
  (function mapaBajoDemanda() {
    var btn = $(".map-consent");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var q = encodeURIComponent("Calidade Systems, Rúa Verdillo 6, 15100 Carballo, A Coruña");
      var marco = document.createElement("iframe");
      marco.src = "https://www.google.com/maps?q=" + q + "&output=embed";
      marco.title = LANG === "en"
        ? "Map: Calidade Systems, Rúa Verdillo 6, Carballo"
        : "Mapa: Calidade Systems, Rúa Verdillo 6, Carballo";
      marco.loading = "lazy";
      marco.referrerPolicy = "no-referrer-when-downgrade";
      marco.setAttribute("allowfullscreen", "");
      btn.replaceWith(marco);
    });
  })();

  /* ====================================================================== */
  (function cabeceraYFab() {
    var cabecera = $(".cabecera"), fab = $(".fab"), hero = $(".hero");
    var barra = $("[data-progreso]"), cifra = $("[data-progreso-cifra]");
    var pendiente = false;
    function pintar() {
      pendiente = false;
      var y = window.pageYOffset;
      if (cabecera) cabecera.classList.toggle("pegada", y > 24);
      if (fab && hero) fab.classList.toggle("visible", y > hero.offsetHeight * 0.7);

      /* Cuanto recorrido llevas. Es informacion, no adorno: se sigue
         actualizando con movimiento reducido y sin GSAP, igual que el reloj. */
      if (barra || cifra) {
        var total = Math.max(0, html.scrollHeight - window.innerHeight);
        var p = total > 0 ? Math.min(1, Math.max(0, y / total)) : 0;
        html.style.setProperty("--progreso", p.toFixed(4));
        if (barra) barra.classList.toggle("visible", y > 24);
        if (cifra) cifra.textContent = ("00" + Math.round(p * 100)).slice(-3) + "%";
      }
      pintarMapa(y);
    }
    window.addEventListener("scroll", function () {
      if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); }
    }, { passive: true });
    pintar();
  })();

  /* ======================================================================
     4 · reloj local y estado de apertura (L–V 9:00–19:00, Europe/Madrid)
     Se sigue actualizando con movimiento reducido: es contenido, no
     decoración.
     ====================================================================== */
  (function relojYEstado() {
    var reloj = $("[data-reloj]"), estado = $("[data-estado]");
    if (!reloj && !estado) return;
    var fmtHora, fmtPartes;
    try {
      fmtHora = new Intl.DateTimeFormat(LANG === "en" ? "en-GB" : "es-ES", {
        timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
      });
      fmtPartes = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
      });
    } catch (e) { return; }

    function abierto() {
      var p = {};
      fmtPartes.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      var laborable = ["Mon", "Tue", "Wed", "Thu", "Fri"].indexOf(p.weekday) !== -1;
      var minutos = parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);
      return laborable && minutos >= 9 * 60 && minutos < 19 * 60;
    }
    function tic() {
      if (reloj) {
        var h = fmtHora.format(new Date());
        reloj.textContent = h;
        reloj.setAttribute("datetime", h);
      }
      if (estado) {
        var ab = abierto();
        estado.textContent = LANG === "en"
          ? (ab ? "open right now" : "closed right now")
          : (ab ? "abierto ahora mismo" : "cerrado ahora mismo");
        estado.classList.toggle("abierto", ab);
      }
    }
    tic();
    setInterval(tic, 1000);
  })();

  /* ======================================================================
     5 · estrellas de la valoración (5,0 sobre 5)
     ====================================================================== */
  (function estrellas() {
    var caja = $("[data-estrellas]");
    if (!caja) return;
    var nota = parseFloat(caja.getAttribute("data-estrellas")) || 0;
    var d = "M12 2.4l2.9 6.1 6.7.9-4.9 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.4 9.4l6.7-.9z";
    var out = "";
    for (var i = 0; i < 5; i++) {
      var p = Math.max(0, Math.min(1, nota - i));
      out += '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fondo" d="' + d + '"/>' +
        (p > 0 ? '<path class="relleno" d="' + d + '" style="clip-path:inset(0 ' +
          ((1 - p) * 100).toFixed(0) + '% 0 0)"/>' : "") + "</svg>";
    }
    caja.innerHTML = out;
  })();

  /* ======================================================================
     6 · botones magnéticos
     ====================================================================== */
  (function magneticos() {
    if (!motion || !window.matchMedia("(hover: hover)").matches) return;
    $$("[data-magnetico]").forEach(function (el) {
      var q = { x: gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" }),
                y: gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" }) };
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        q.x((e.clientX - (r.left + r.width / 2)) * 0.28);
        q.y((e.clientY - (r.top + r.height / 2)) * 0.34);
      });
      el.addEventListener("pointerleave", function () { q.x(0); q.y(0); });
    });
  })();

  /* ======================================================================
     7 · marquesina mono, lenta
     ====================================================================== */
  (function marquesina() {
    var pista = $("[data-marquesina]");
    if (!pista) return;
    var grupo = $(".marquesina-grupo", pista);
    if (!grupo) return;
    /* se duplica hasta cubrir dos veces el ancho de la ventana */
    var copias = Math.max(2, Math.ceil((window.innerWidth * 2) / Math.max(1, grupo.offsetWidth)) + 1);
    for (var i = 1; i < copias; i++) pista.appendChild(grupo.cloneNode(true));
    if (!motion) return;
    var ancho = grupo.offsetWidth;
    gsap.to(pista, { x: -ancho, duration: ancho / 26, ease: "none", repeat: -1 });
  })();

  /* ======================================================================
     8 · contadores
     ====================================================================== */
  function formatearNumero(v, dec) {
    return dec ? v.toFixed(dec).replace(".", LANG === "en" ? "." : ",") : String(Math.round(v));
  }
  (function contadores() {
    var nodos = $$("[data-contador]");
    if (!nodos.length) return;
    nodos.forEach(function (el) {
      var fin = parseFloat(el.getAttribute("data-contador")) || 0;
      var dec = parseInt(el.getAttribute("data-decimales") || "0", 10);
      var suf = el.getAttribute("data-sufijo") || "";
      var pintar = function (v) { el.textContent = formatearNumero(v, dec) + suf; };
      pintar(fin);                       /* el valor real está siempre puesto */
      if (!motion) return;
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: function () {
          gsap.to(obj, { v: fin, duration: 1.1, ease: "power2.out",
                         onUpdate: function () { pintar(obj.v); },
                         onComplete: function () { pintar(fin); } });
        }
      });
    });
  })();

  /* ======================================================================
     9 · las pistas que conectan las secciones
     El SVG se construye en JS con el viewBox en píxeles reales (escala 1:1).
     Nunca se estira: si el viewBox se deformara, el truco de
     stroke-dasharray + pathLength se rompería y saldrían líneas
     discontinuas repetidas.
     ====================================================================== */
  var trazas = [];
  function construirTrazas() {
    trazas.forEach(function (t) { if (t.st) t.st.kill(); });
    trazas = [];
    $$("[data-traza]").forEach(function (caja) {
      caja.innerHTML = "";
      var seccion = caja.parentElement;
      var cont = $(".contenedor", seccion) || $(".stack-zona", seccion);
      if (!cont) return;
      var W = seccion.offsetWidth, H = seccion.offsetHeight;
      if (!W || !H) return;

      var rectS = seccion.getBoundingClientRect();
      var rectC = cont.getBoundingClientRect();
      var padL = parseFloat(getComputedStyle(cont).paddingLeft) || 20;
      /* el borde donde empieza el texto; el riel se queda 96 px a su
         izquierda para que la rama tenga recorrido hasta el pad */
      var xTexto = rectC.left - rectS.left + padL;
      var rx = Math.max(14, Math.round(xTexto - 96));
      var anchoCanal = 14;

      var svg = svgEl("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" });

      /* ancla: la etiqueta mono de la sección; la rama va a morir a su lado */
      var ancla = $(".etiqueta", seccion);
      var yA = ancla ? Math.round(ancla.getBoundingClientRect().top - rectS.top + ancla.offsetHeight / 2) : Math.round(H * 0.2);
      var padX = ancla ? Math.round(ancla.getBoundingClientRect().left - rectS.left - 18) : rx + 60;
      var conRama = padX > rx + anchoCanal + 30 && W >= 992;

      /* si la sección termina en la pila de servicios, la pista no baja
         hasta el final: gira 45° y le entrega la señal al bus de nodos. */
      var zona = $(".stack-zona", seccion);
      var busEl = zona ? $(".bus", zona) : null;
      var finY = H, cola = "";
      if (zona && busEl) {
        var busX = Math.round(busEl.getBoundingClientRect().left - rectS.left + busEl.offsetWidth / 2);
        var dx = Math.max(0, busX - rx);
        var zTop = Math.round(zona.getBoundingClientRect().top - rectS.top);
        finY = Math.max(140, zTop - dx - 40);
        cola = " L" + busX + " " + (finY + dx) + " V" + (finY + dx + 22);
      }

      var y1 = Math.max(anchoCanal + 4, yA - 34);
      var techo = (finY === H ? H : finY) - anchoCanal - 30;
      var y2 = Math.min(techo, Math.max(y1 + anchoCanal * 2 + 20, yA + Math.round(H * 0.28)));
      if (y2 < y1 + anchoCanal * 2 + 20) y2 = y1 + anchoCanal * 2 + 20;
      var x2 = rx + anchoCanal;

      /* bus vertical con dos giros de 45°: baja, se desvía, vuelve y sigue */
      var d = "M" + rx + " 0 V" + y1 +
              " L" + x2 + " " + (y1 + anchoCanal) +
              " V" + y2 +
              " L" + rx + " " + (y2 + anchoCanal) +
              " V" + (finY === H ? H : finY) + cola;

      svg.appendChild(svgEl("path", { class: "traza-guia", d: d }));
      var linea = svgEl("path", { class: "traza-linea", d: d, pathLength: "1" });
      svg.appendChild(linea);

      /* vía: el agujero metalizado por el que la pista cambiaría de capa */
      var yVia = Math.round((y2 + anchoCanal + (finY === H ? H : finY)) / 2);
      var via = svgEl("circle", { class: "traza-via", cx: rx, cy: yVia, r: 4.5 });
      svg.appendChild(via);

      var rama = null, pad = null;
      if (conRama) {
        rama = svgEl("path", { class: "traza-rama", d: "M" + x2 + " " + yA + " H" + padX, pathLength: "1" });
        pad = svgEl("circle", { class: "traza-pad", cx: padX, cy: yA, r: 5 });
        svg.appendChild(rama);
        svg.appendChild(pad);
      }
      caja.appendChild(svg);

      var reg = { seccion: seccion, linea: linea, rama: rama, pad: pad, via: via, st: null };
      if (!motion) {
        /* con movimiento reducido las pistas ya están dibujadas: entonces
           los nodos también tienen que estar encendidos. */
        if (pad) { pad.classList.add("encendido"); rama.classList.add("encendido"); }
      }
      if (motion) {
        gsap.set([linea, rama].filter(Boolean), { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set([via, pad].filter(Boolean), { opacity: 0 });
        reg.st = ScrollTrigger.create({
          trigger: seccion,
          start: "top 92%",
          end: "bottom 55%",
          scrub: 0.6,
          onUpdate: function (self) {
            gsap.set(linea, { strokeDashoffset: 1 - self.progress });
            if (rama) {
              var p = Math.max(0, Math.min(1, (self.progress - 0.18) / 0.22));
              gsap.set(rama, { strokeDashoffset: 1 - p });
              rama.classList.toggle("encendido", p > 0.98);
              gsap.set(pad, { opacity: p > 0.98 ? 1 : 0 });
              pad.classList.toggle("encendido", p > 0.98);
            }
            gsap.set(via, { opacity: self.progress > 0.8 ? 1 : 0 });
          }
        });
      }
      trazas.push(reg);
    });
  }

  /* ======================================================================
     10 · la pila de los nueve servicios y su bus de pads
     El <li> es el pegajoso y su margin-bottom es el recorrido; la tarjeta
     no lleva min-height, o quedarían tarjetas fantasma.
     ====================================================================== */
  (function pilaServicios() {
    var stack = $(".stack");
    var bus = $(".bus");
    if (!stack) return;
    var items = $$(".stack-item", stack);
    if (!items.length) return;

    /* las tarjetas sin foto llevan una miniatura de la placa: los nueve
       pads en cuadrícula, la pista serpenteando de uno a otro y el de esta
       tarjeta encendido. Es decoración, no contenido: va aria-hidden. */
    (function miniaturas() {
      var COL = [40, 130, 220], FIL = [40, 130, 220];
      var puntos = [];
      for (var f = 0; f < 3; f++) {
        for (var c = 0; c < 3; c++) puntos.push([f % 2 ? COL[2 - c] : COL[c], FIL[f]]);
      }
      /* serpentina de 90° que toca los nueve pads, más dos derivaciones
         a 45° que se van al borde, como en una placa de verdad */
      var d = "M40 40 H220 V130 H40 V220 H220";
      var derivaciones = "M130 40 L156 14 H256 M130 220 L104 246 H4";
      items.forEach(function (it, i) {
        var tarjeta = $(".nodo-tarjeta", it);
        if (!tarjeta || tarjeta.classList.contains("tiene-foto")) return;
        var fig = document.createElement("figure");
        fig.className = "nodo-placa";
        fig.setAttribute("aria-hidden", "true");
        var svg = svgEl("svg", { viewBox: "0 0 260 260" });
        svg.appendChild(svgEl("path", { class: "placa-pista placa-fina", d: derivaciones }));
        svg.appendChild(svgEl("path", { class: "placa-pista", d: d }));
        puntos.forEach(function (pt, j) {
          if (j === i) svg.appendChild(svgEl("circle", { class: "placa-halo", cx: pt[0], cy: pt[1], r: 22 }));
          svg.appendChild(svgEl("circle", {
            class: "placa-pad" + (j === i ? " activo" : ""), cx: pt[0], cy: pt[1], r: 10
          }));
        });
        fig.appendChild(svg);
        tarjeta.appendChild(fig);
      });
    })();
    var svg = bus ? $(".bus-svg", bus) : null;
    var g = svg ? $("[data-bus]", svg) : null;
    var pads = [], stubs = [], avance = null, alturaBus = 0;
    var topes = [];
    var activo = -1;

    function medir() {
      var y0 = absTop(stack);
      topes = [];
      var y = y0;
      items.forEach(function (it) {
        topes.push(y);
        y += it.offsetHeight + (parseFloat(getComputedStyle(it).marginBottom) || 0);
      });
    }

    function dibujarBus() {
      if (!g || !svg) return;
      var dispo = window.innerHeight - topePegajoso() - 2.5 * rem();
      alturaBus = Math.max(180, Math.min(440, dispo));
      var w = bus.offsetWidth || 36;
      var cx = Math.round(w / 2);
      svg.setAttribute("width", w);
      svg.setAttribute("height", alturaBus);
      svg.setAttribute("viewBox", "0 0 " + w + " " + alturaBus);
      g.innerHTML = "";
      pads = []; stubs = [];
      var margen = 14;
      var paso = (alturaBus - margen * 2) / (items.length - 1);
      g.appendChild(svgEl("path", {
        class: "bus-linea", d: "M" + cx + " " + margen + " V" + (alturaBus - margen)
      }));
      avance = svgEl("path", {
        class: "bus-avance", d: "M" + cx + " " + margen + " V" + (alturaBus - margen),
        pathLength: "1", "stroke-dasharray": "1", "stroke-dashoffset": "1"
      });
      g.appendChild(avance);
      items.forEach(function (_, i) {
        var cy = Math.round(margen + paso * i);
        var s = svgEl("path", { class: "bus-stub", d: "M" + cx + " " + cy + " H" + (w + 6), fill: "none" });
        g.appendChild(s); stubs.push(s);
        var p = svgEl("circle", { class: "bus-pad", cx: cx, cy: cy, r: 4.5 });
        g.appendChild(p); pads.push(p);
      });
    }

    function marcar(idx) {
      if (idx === activo) return;
      activo = idx;
      pads.forEach(function (p, i) { p.classList.toggle("encendido", i <= idx && idx >= 0); });
      stubs.forEach(function (s, i) { s.classList.toggle("encendido", i === idx); });
      if (avance && pads.length > 1) {
        var p = idx < 0 ? 0 : (idx / (pads.length - 1));
        avance.setAttribute("stroke-dashoffset", String(1 - p));
      }
    }

    var pendiente = false;
    function alScroll() {
      pendiente = false;
      if (!topes.length) return;
      var y = window.pageYOffset + topePegajoso() + 6;
      var idx = -1;
      for (var i = 0; i < topes.length; i++) if (y >= topes[i]) idx = i;
      marcar(idx);
    }
    window.addEventListener("scroll", function () {
      if (!pendiente) { pendiente = true; requestAnimationFrame(alScroll); }
    }, { passive: true });

    /* al apilarse, la tarjeta que queda debajo se encoge un pelo: da
       profundidad sin tocar la opacidad (una opacidad con scrub puede
       dejar una tarjeta pegajosa invisible si el trigger se recalcula). */
    if (motion) {
      items.forEach(function (it, i) {
        if (i === items.length - 1) return;
        var tarjeta = $(".nodo-tarjeta", it);
        /* La tarjeta que sale se encoge y se hunde un poco. El desplazamiento
           tiene que ser HACIA ABAJO: con transform-origin en el borde superior,
           un `y` negativo deja su canto asomando por encima de la que entra y
           se ve una raya. Con +6 queda tapada por los cuatro lados. */
        gsap.to(tarjeta, {
          scale: 0.955, y: 6, ease: "none",
          scrollTrigger: {
            trigger: items[i + 1],
            start: "top 80%",
            end: function () { return "top " + Math.round(topePegajoso()); },
            scrub: 0.5, invalidateOnRefresh: true
          }
        });
      });
    }

    function refrescar() { medir(); dibujarBus(); activo = -2; alScroll(); }
    refrescar();
    window.__calidadeRefrescarPila = refrescar;
  })();

  /* ======================================================================
     10b · el mapa de la placa
     El avance del recorrido con forma de circuito: un riel con un pad por
     seccion, colocado en la proporcion exacta que ocupa esa seccion en el
     documento. Asi, cuando el nodo viajero llega a un pad, el visitante esta
     justo entrando en esa seccion: la posicion no es decorativa, es la
     misma cuenta que pinta la barra.
     ====================================================================== */
  var mapa = null;
  var lenis = null;

  function montarMapa() {
    if (mapa && mapa.caja) mapa.caja.remove();
    mapa = null;
    if (window.innerWidth < 992) return;

    /* las secciones y sus nombres salen de la propia navegacion, para que no
       haya dos listas que mantener */
    var destinos = [{ id: "inicio", texto: LANG === "en" ? "top" : "inicio" }];
    $$(".cabecera .nav a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href.charAt(0) !== "#") return;
      destinos.push({ id: href.slice(1), texto: a.textContent.trim() });
    });

    var caja = document.createElement("div");
    caja.className = "recorrido";
    caja.setAttribute("aria-hidden", "true");
    var riel = document.createElement("div");
    riel.className = "recorrido-riel";
    var cobre = document.createElement("span");
    cobre.className = "recorrido-cobre";
    riel.appendChild(cobre);

    /* Los pads NO van en la proporcion cruda del documento: la pila de los
       nueve servicios se come media pagina y dejaria cinco pads apinados
       abajo y un palmo de riel vacio. Cada seccion ocupa un tramo igual del
       riel, y el nodo se interpola DENTRO de su tramo segun lo que lleves
       recorrido de esa seccion. Asi el reparto es legible y, aun asi, el
       nodo cae exactamente sobre el pad al entrar en cada seccion.
       La cifra y la pista de movil siguen usando el porcentaje real. */
    var secciones = [];
    destinos.forEach(function (d) {
      var sec = document.getElementById(d.id);
      if (sec) secciones.push({ id: d.id, texto: d.texto, sec: sec });
    });
    if (!secciones.length) return;
    var tramo = 1 / secciones.length;

    var puntos = [];
    secciones.forEach(function (d, i) {
      var sec = d.sec;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "recorrido-punto";
      b.style.top = (i * tramo * 100).toFixed(3) + "%";
      b.tabIndex = -1;                      /* la navegacion accesible ya esta en la cabecera */
      var et = document.createElement("span");
      et.className = "recorrido-et mono";
      et.textContent = d.texto;
      var pad = document.createElement("span");
      pad.className = "recorrido-pad";
      b.appendChild(et);
      b.appendChild(pad);
      b.addEventListener("click", function () {
        var destino = document.getElementById(d.id);
        if (!destino) return;
        var y = absTop(destino) - navH();
        if (lenis && lenis.scrollTo) lenis.scrollTo(y, { duration: 1.1 });
        else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
      });
      riel.appendChild(b);
      puntos.push({ el: b, sec: sec });
    });

    var nodo = document.createElement("span");
    nodo.className = "recorrido-nodo";
    riel.appendChild(nodo);
    caja.appendChild(riel);
    document.body.appendChild(caja);
    mapa = { caja: caja, puntos: puntos, tramo: tramo, activo: -2, pos: -1 };
    /* el mapa se construye despues del primer pintado, asi que hay que
       ponerlo al dia aqui o no marca nada hasta el primer scroll */
    pintarMapa(window.pageYOffset);
  }

  var piePagina = null;
  function pintarMapa(y) {
    if (!mapa) return;
    /* el mapa se retira al llegar al pie: sus etiquetas claras sobre el
       bloque marino quedan fuera de sitio, y a esas alturas ya has llegado */
    if (piePagina === null) piePagina = $(".pie") || false;
    var enElPie = piePagina && piePagina.getBoundingClientRect().top < window.innerHeight * 0.8;
    mapa.caja.classList.toggle("visible", y > 24 && !enElPie);

    var n = mapa.puntos.length;
    var linea = y + navH() + 8;
    var idx = -1, i;
    for (i = 0; i < n; i++) {
      if (absTop(mapa.puntos[i].sec) <= linea) idx = i;
    }

    /* posicion del nodo: el tramo de la seccion actual mas lo que lleves
       avanzado dentro de ella */
    var pos;
    if (idx < 0) {
      pos = 0;
    } else {
      var desde = absTop(mapa.puntos[idx].sec) - navH();
      var hasta = (idx + 1 < n)
        ? absTop(mapa.puntos[idx + 1].sec) - navH()
        : Math.max(desde + 1, html.scrollHeight - window.innerHeight);
      var dentro = hasta > desde ? Math.min(1, Math.max(0, (y - desde) / (hasta - desde))) : 0;
      pos = Math.min(1, (idx + dentro) * mapa.tramo);
    }
    if (pos !== mapa.pos) {
      mapa.pos = pos;
      mapa.caja.style.setProperty("--recorrido", pos.toFixed(4));
    }

    if (idx === mapa.activo) return;
    mapa.activo = idx;
    mapa.puntos.forEach(function (p, j) {
      p.el.classList.toggle("pasado", j < idx);
      p.el.classList.toggle("activo", j === idx);
    });
  }

  /* ======================================================================
     11 · apariciones al entrar en pantalla
     ====================================================================== */
  function montarApariciones() {
    if (!motion) return;
    var sel = ".seccion-cab .seccion-txt, .cifras, .nota-pendiente, .expediente, .peritaje-pie," +
              " .logos, .logos-nota, .testimonio, .clientes-foto, .entrada, .blog-pie," +
              " .ficha, .mapa, .forma, .contacto-foto, .monitor-foto, .valoracion";
    $$(sel).forEach(function (el) {
      if (el.dataset.aparecido) return;
      el.dataset.aparecido = "1";
      el.classList.add("aparece");
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });
    mapaChars.forEach(function (chars, el) {
      if (el.dataset.revelado || el.closest(".hero")) return;
      el.dataset.revelado = "1";
      gsap.to(chars, {
        opacity: 1, y: 0, duration: 0.5, ease: "expo.out", stagger: 0.016,
        scrollTrigger: { trigger: el, start: "top 86%", once: true }
      });
    });
  }

  /* ======================================================================
     12 · la entrada del hero: se enrutan las pistas, se encienden los nodos
     y entonces llega el wordmark.
     ====================================================================== */
  function entradaHero() {
    if (!motion) return;
    var pistas = $$(".marca-pistas .pista");
    var nodos = $$(".marca-nodos .nodo");
    var pulsos = $$(".marca-pulsos .pulso");
    var titular = $(".hero .titular");
    var chars = mapaChars.get(titular) || [];

    var tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.to(pistas[0], { strokeDashoffset: 0, duration: 1.45, ease: "power1.inOut" }, 0);
    for (var i = 1; i < pistas.length; i++) {
      tl.to(pistas[i], { strokeDashoffset: 0, duration: 0.7, ease: "power2.out" }, 0.45 + i * 0.1);
    }
    tl.to(nodos, { opacity: 1, duration: 0.3, stagger: 0.06 }, 1.15);
    /* immediateRender:false o GSAP pinta el estado inicial del fromTo al
       crear la linea de tiempo y los nodos se encienden antes de que la
       pista haya llegado. */
    tl.fromTo(pulsos,
      { opacity: 0.85, attr: { r: 15 }, strokeWidth: 4 },
      { opacity: 0, attr: { r: 30 }, strokeWidth: 0.5, duration: 0.85, stagger: 0.06,
        ease: "power2.out", immediateRender: false }, 1.18);
    tl.to(".marca-palabra", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 1.5);
    if (chars.length) tl.to(chars, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", stagger: 0.014 }, 0.5);
    tl.to([".hero .lema", ".hero .lema-nota"], { opacity: 1, duration: 0.6 }, 1.0);
    tl.to(".hero-sub", { opacity: 1, duration: 0.6 }, 1.15);
    tl.to(".hero-ctas", { opacity: 1, duration: 0.6 }, 1.3);
    tl.to(".consola", { opacity: 1, duration: 0.6 }, 1.55);
  }

  /* ======================================================================
     13 · el nodo que late: «servidor sano». Dos segundos, opacidad y escala
     mínimas. Nada que parpadee.
     ====================================================================== */
  function latido() {
    if (!motion) return;
    var halo = $(".latido-halo"), nodo = $(".latido-nodo");
    if (!halo || !nodo) return;
    gsap.to(halo, { attr: { r: 16 }, opacity: 0.06, duration: 2, ease: "sine.inOut",
                    repeat: -1, yoyo: true, transformOrigin: "50% 50%" });
    gsap.to(nodo, { opacity: 0.72, duration: 2, ease: "sine.inOut", repeat: -1, yoyo: true });
  }

  /* ======================================================================
     14 · últimas entradas, leídas en vivo del WordPress que sigue vivo
     Las cuatro de respaldo ya están pintadas en el HTML: si la API no
     contesta, el visitante no se entera. El parámetro `lang` de esa
     instalación no filtra nada, así que se pide un lote y se filtra por el
     idioma de la URL de cada entrada.
     ====================================================================== */
  (function ultimasEntradas() {
    var lista = $("[data-entradas]");
    if (!lista || !window.fetch) return;
    var base = lista.getAttribute("data-api");
    var idioma = lista.getAttribute("data-idioma") || "es";
    if (!base) return;
    var url = base + "?per_page=30&orderby=date&order=desc&_fields=date,link,title,excerpt";

    var ctrl = window.AbortController ? new AbortController() : null;
    var reloj = setTimeout(function () { if (ctrl) ctrl.abort(); }, 7000);

    function limpiar(s) {
      var d = document.createElement("div");
      d.innerHTML = String(s || "");
      return (d.textContent || "").replace(/\s+/g, " ").replace(/\[…\]|\[…\]/g, "").trim();
    }
    function fecha(iso) {
      var p = String(iso).slice(0, 10).split("-");
      return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : "";
    }

    fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)); })
      .then(function (j) {
        if (!Array.isArray(j)) return;
        var sel = j.filter(function (p) { return String(p.link).indexOf("/" + idioma + "/") !== -1; }).slice(0, 4);
        if (sel.length < 4) return;              /* con menos de cuatro, se queda el respaldo */
        lista.innerHTML = "";
        sel.forEach(function (p) {
          var li = document.createElement("li");
          li.className = "entrada";
          var a = document.createElement("a");
          a.href = p.link;
          var f = document.createElement("p");
          f.className = "entrada-fecha mono";
          f.textContent = fecha(p.date);
          var h = document.createElement("h3");
          h.textContent = limpiar(p.title && p.title.rendered);
          var s = document.createElement("p");
          s.className = "entrada-sumario";
          s.textContent = limpiar(p.excerpt && p.excerpt.rendered);
          a.appendChild(f); a.appendChild(h); a.appendChild(s);
          li.appendChild(a);
          lista.appendChild(li);
        });
        lista.setAttribute("data-fuente", "api");
        montarApariciones();
        if (gsapReady) ScrollTrigger.refresh();
      })
      .catch(function (e) {
        /* nunca se le enseña un error al visitante: se queda con el respaldo */
        if (window.console) console.warn("[Calidade] el blog no contestó; se mantienen las entradas de respaldo.", e);
      })
      .then(function () { clearTimeout(reloj); });
  })();

  /* ======================================================================
     15 · formulario «describe tu problema»
     Valida de verdad, pero todavía no tiene a dónde enviar: falta el correo
     o el endpoint. En vez de fingir un envío, se dice.
     ====================================================================== */
  (function formulario() {
    var forma = $("[data-forma]");
    var dialogo = $("[data-dialogo]");
    if (!forma) return;
    var textos = LANG === "en"
      ? { req: "required field", corto: "a little more detail, please" }
      : { req: "campo obligatorio", corto: "cuéntanos un poco más, por favor" };

    function marcar(campo, mensaje) {
      var caja = campo.closest(".campo");
      if (!caja) return;
      caja.classList.toggle("mal", !!mensaje);
      var e = $(".error", caja);
      if (mensaje) {
        if (!e) { e = document.createElement("p"); e.className = "error"; caja.appendChild(e); }
        e.textContent = mensaje;
        campo.setAttribute("aria-invalid", "true");
      } else {
        if (e) e.remove();
        campo.removeAttribute("aria-invalid");
      }
    }
    forma.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var ok = true, primero = null;
      $$("input[required], textarea[required]", forma).forEach(function (c) {
        var v = c.value.trim();
        var msg = "";
        if (!v) msg = textos.req;
        else if (c.tagName === "TEXTAREA" && v.length < 12) msg = textos.corto;
        marcar(c, msg);
        if (msg) { ok = false; if (!primero) primero = c; }
      });
      if (!ok) { if (primero) primero.focus(); return; }
      if (dialogo && typeof dialogo.showModal === "function") dialogo.showModal();
      else window.location.href = "tel:+34622644835";
    });
    $$("input, textarea", forma).forEach(function (c) {
      c.addEventListener("input", function () { if (c.closest(".campo").classList.contains("mal")) marcar(c, ""); });
    });
    if (dialogo) {
      var cerrar = $("[data-cerrar-dialogo]", dialogo);
      if (cerrar) cerrar.addEventListener("click", function () { dialogo.close(); });
    }
  })();

  /* ======================================================================
     16 · arranque: Lenis, y todo lo que necesita medir espera a las fuentes
     (si se monta antes, las alturas cambian y los ScrollTrigger quedan
     desplazados medio viewport).
     ====================================================================== */
  if (motion && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }


  /* ======================================================================
     Cortina de entrada (preloader)
     ----------------------------------------------------------------------
     Gesto propio: barrido de senal. El simbolo se enciende, la linea cian
     se abre y el panel sale en BANDAS DIAGONALES que suben escalonadas.
     A proposito no dibuja pistas: eso ya lo hace la entrada del hero.

     Dos momentos distintos:
       - alAbrirse(fn) -> cuando las bandas EMPIEZAN a subir, para que las
         trazas del hero ya se esten enrutando cuando asoma la pagina.
       - retirar()     -> al terminar: quita el nodo, devuelve el scroll y
         refresca ScrollTrigger, que midio con overflow:hidden.
     Se retira SIEMPRE (sin GSAP, con reduced-motion o por el timeout de
     seguridad): una cortina atascada tapa el sitio entero.
     ====================================================================== */
  var cortina = (function initCortina() {
    var el = $("[data-cortina]");
    var espera = [];
    var abierta = false;
    var fuera = false;

    function abrir() {
      if (abierta) return;
      abierta = true;
      espera.splice(0).forEach(function (fn) { try { fn(); } catch (e) {} });
    }
    function retirar() {
      abrir();
      if (fuera) return;
      fuera = true;
      if (el) el.hidden = true;
      html.classList.remove("cortina-puesta");
      if (lenis) lenis.start();
      if (gsapReady) ScrollTrigger.refresh();
    }

    var api = { alAbrirse: function (fn) { return abierta ? fn() : espera.push(fn); } };
    if (!el || !motion) { retirar(); return api; }

    html.classList.add("cortina-puesta");

    var centro = $(".cortina-centro", el);
    var simbolo = $(".cortina-simbolo", el);
    var barrido = $(".cortina-barrido", el);
    var pie = $(".cortina-pie", el);
    var bandas = $$(".cortina-banda", el);
    var SUBE = 1.3;

    var tl = gsap.timeline({ onComplete: retirar });
    if (simbolo) tl.to(simbolo, { opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" }, 0);
    if (barrido) tl.to(barrido, { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, 0.45);
    if (pie) tl.to(pie, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.7);

    tl.add(abrir, SUBE);
    if (centro) tl.to(centro, { opacity: 0, duration: 0.35, ease: "power2.in" }, SUBE);
    if (bandas.length) {
      /* cada banda sube la ventana entera, no su propia altura: si subiera
         solo lo suyo no destaparia nada */
      tl.to(bandas, {
        y: function () { return -(window.innerHeight * 1.25); },
        duration: 0.95,
        ease: "expo.inOut",
        stagger: { each: 0.055, from: "start" }
      }, SUBE + 0.1);
    }

    setTimeout(retirar, 5200);
    return api;
  })();

  function arrancar() {
    construirTrazas();
    montarMapa();
    montarApariciones();
    /* la entrada del hero no arranca hasta que las bandas empiezan a subir:
       lo primero que se ve de la pagina ya esta en movimiento */
    cortina.alAbrirse(entradaHero);
    latido();
    if (gsapReady) ScrollTrigger.refresh();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(arrancar).catch(arrancar);
  } else {
    window.addEventListener("load", arrancar);
  }

  var temporizador = null;
  window.addEventListener("resize", function () {
    clearTimeout(temporizador);
    temporizador = setTimeout(function () {
      construirTrazas();
      montarMapa();
      if (window.__calidadeRefrescarPila) window.__calidadeRefrescarPila();
      if (gsapReady) ScrollTrigger.refresh();
    }, 220);
  });
})();
