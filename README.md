# Calidade Systems · Carballo — «Traza»

Portada y servicios nuevos para **Calidade Systems · Ingeniería Informática**
(Rúa Verdillo 6, piso 2, 15100 Carballo, A Coruña). Sitio estático, sin
dependencias de construcción: HTML, una hoja de estilos y un JavaScript.

Convive con el WordPress que el negocio ya tiene: la web nueva ocupa la
portada, los dos idiomas y las páginas legales; el cuaderno técnico (40
artículos, 2017–2026) se sigue publicando desde WordPress con sus URLs
intactas. **Todo el reparto está en [`seo/MIGRACION-SEO.md`](seo/MIGRACION-SEO.md),
y esa parte es obligatoria antes de publicar.**

---

## El concepto

La «C» del logotipo de Calidade Systems no es una letra: es una pista de
circuito con nodos. El sitio entero se comporta como esa placa.

- El hero **enruta la marca**: la pista larga se dibuja desde el primer nodo,
  rodea la «C» por fuera, entra por el chaflán de 45°, da la vuelta por dentro
  y sale por abajo. Después llegan las tres derivaciones cortas, se encienden
  los cinco nodos con un pulso cian y entra el wordmark.
- Las secciones se conectan por un **riel ortogonal** en el margen izquierdo,
  con giros de 90° y 45°, una vía y un *pad* que se enciende junto al rótulo de
  cada sección. Se dibuja ligado al scroll.
- Los **nueve servicios** son nueve nodos de un bus: el riel de la sección gira
  45° y le entrega la señal al bus de pads; cada tarjeta que sube enciende su
  pad y saca un *stub* hacia ella.
- En monitorización, un nodo **late** cada 2 s con opacidad y escala mínimas.
  Es lo más rápido que parpadea nada en todo el sitio.
- El **avance del recorrido** se lee en el mismo idioma: una pista bajo la
  cabecera que se llena de marino a cian, un nodo que la recorre y una cifra
  mono (`037%`) junto al selector de idioma.

Fondo claro siempre (`#F7F9FB`). No hay modo oscuro y no se ofrece.

## Paleta y tipografía

| Token | Valor | Uso |
|---|---|---|
| `--blanco` | `#F7F9FB` | Base |
| `--placa` | `#E3E8EE` | Rejilla, separadores, serigrafía de las pistas |
| `--marino` | `#0C2C5C` | Texto y bloques |
| `--cian` | `#22B5D8` | Señal: pistas activas, pads encendidos, CTA |
| `--cian-osc` | `#0B6E8C` | El cian cuando tiene que ser texto legible |
| `#9AAEC8` | | El «cobre» de las pistas ya enrutadas |

Space Grotesk para titulares, IBM Plex Sans para el cuerpo, IBM Plex Mono para
etiquetas de nodo, estados y cifras.

## Estructura

```
index.html                  redirección de idioma (en el servidor: 301 a /es/)
es/index.html               portada en español
es/aviso-legal.html
es/politica-de-cookies.html
en/index.html               portada en inglés
en/legal-notice.html
en/cookies-policy.html
404.html
css/style.css
js/main.js
assets/img/brand/           logotipo recreado en SVG + iconos
assets/img/clientes/        7 logotipos de cliente normalizados
assets/img/photos/          6 fotografías de archivo, con grading propio
seo/                        migración: mapa 301, nginx, apache, documentación
sitemap.xml                 índice nuevo que enlaza al post-sitemap.xml de WP
sitemap-paginas.xml
robots.txt
screenshots/
```

## Detalles de implementación que conviene no romper

- **Las pistas se construyen en JavaScript** con el `viewBox` en píxeles
  reales, escala 1:1. Si se pasara a un SVG en el HTML con un `viewBox` fijo
  estirado sobre un contenedor alto y estrecho, el truco de
  `stroke-dasharray` + `pathLength="1"` se rompe y salen líneas discontinuas
  repetidas.
- **La pila de servicios**: el pegajoso es el `<li>`, y su `margin-bottom` es
  el recorrido. La altura mínima va en la tarjeta, no en el `<li>`, o quedan
  tarjetas fantasma.
- **La última tarjeta necesita `.stack::after`.** El `margin-bottom` del último
  hijo no le da recorrido: el bloque contenedor crece con él, su borde inferior
  no se aleja y la tarjeta se despega en el mismo frame en que llega. El
  recorrido tiene que ser contenido de verdad.
- **Todas las tarjetas llevan el mismo margen, también la última.** La
  restricción del pegajoso se aplica sobre la *caja de margen*: si a la última
  se le quita el margen, su caja queda 38vh más corta y las tarjetas se sueltan
  escalonadas — las de atrás salen antes, suben por delante de la activa y se
  las ve asomar por arriba.
- Al apilarse, las tarjetas solo escalan (`scale` + `y`). **Nunca opacidad con
  `scrub`**: un recálculo del trigger puede dejar una tarjeta pegajosa
  invisible. Y el `y` tiene que ser **positivo**: con `transform-origin` en el
  borde superior, un `y` negativo deja el canto de la saliente asomando por
  encima de la entrante.
- La barra de avance se dibuja con `transform: scaleX()`, no con
  `stroke-dasharray` sobre un `viewBox` estirado: una barra recta deformada de
  forma no uniforme rompe el dasharray y sale a trozos.
- **Todo lo que se oculta para animar vive bajo `html.has-motion`**, que solo se
  enciende desde el JavaScript. Sin GSAP, sin Lenis o con movimiento reducido,
  la página se ve entera.
- `.cookie-banner[hidden] { display: none }` y en el CSS no hay ningún `display`
  suelto en esa clase que pueda ganarle. El botón cierra de verdad.
- `.btn-nav { display: none }` está **después** de `.btn`, o el
  `display:inline-flex` de `.btn` le gana por orden y el CTA se cuela en móvil.
- El `fromTo` de los pulsos lleva `immediateRender: false`, o GSAP pinta el
  estado inicial al crear la línea de tiempo y los nodos se encienden antes de
  que la pista haya llegado.
- Con Lenis, para probar con Playwright hay que recorrer con `mouse.wheel` y
  esperar: `window.scrollTo` no dispara los ScrollTrigger del final.

## Contenido: qué es real y qué no

**Real, tomado de su web, su ficha de Google o su propio archivo de marca:**
nombre, dirección, teléfono, horario, valoración 5,0 ★ con 19 reseñas, los 9
servicios con su texto literal, los 2 testimonios, los 7 logotipos de cliente,
los 40 artículos del cuaderno y el logotipo (medido sobre
`IDENTIFICADOR-2-A-POSITIVO-01.png`, 1888×708, y recreado en SVG con las pistas
como *paths* de trazo para poder animarlas).

**Marcado como pendiente, sin inventar:** lema en español, email, redes,
colegio y número de colegiado del peritaje, alcance del peritaje, herramientas
concretas de monitorización y backup, textos de las 19 reseñas de Google,
razón social, NIF/CIF y datos registrales, y el destino del formulario.

**Fotografía:** seis imágenes de banco (Pexels, licencia gratuita para uso
comercial) con tratamiento de color propio hacia el frío-limpio. Están
etiquetadas como archivo en la propia página. Los créditos y los identificadores
originales están en `assets/img/photos/_creditos.json`.

## Comprobado

64 comprobaciones automáticas con Playwright, 0 fallos: hreflang recíproco,
JSON-LD, respaldo del blog con `route.abort()`, cookies con rechazo real, mapa
bajo demanda, formulario, caída de GSAP, movimiento reducido y 400 px. El
detalle está en [`seo/MIGRACION-SEO.md`](seo/MIGRACION-SEO.md) §8.

Entre ellas, cuatro que vigilan justo lo que ya se rompió una vez: que las
nueve tarjetas llegan a pegarse, que la última **se queda** pegada en lugar de
atravesar el tope, que ninguna tarjeta de atrás asoma por fuera de la activa, y
que el avance del recorrido llega al 100 % también sin GSAP y con movimiento
reducido.

## Cómo verlo

**Vista previa publicada:**
<https://alvarotaiagu.github.io/calidade-systems-carballo-web/>

En local:

```bash
python -m http.server 8731
# http://127.0.0.1:8731/es/
```

Hace falta servirlo por HTTP: bajo `file://` las máscaras CSS y la llamada a la
API del blog no funcionan.

### Sobre la vista previa de GitHub Pages

Es una **maqueta para enseñar**, no el sitio en producción. Dos cosas a tener
presentes:

- Los `canonical` apuntan a `https://www.calidade.systems/…`, que es lo
  correcto para el entregable. El efecto secundario es que Google **no
  indexará** la copia de github.io, así que no hay contenido duplicado
  compitiendo con el WordPress del cliente.
- `robots.txt` y `sitemap.xml` están escritos para el dominio real. En una
  *project page* cuelgan de `/calidade-systems-carballo-web/`, donde ningún
  rastreador los lee. No hay que tocarlos.

`manifest.json` usa rutas relativas y `404.html` recompone las suyas cuando el
host es `github.io`, para que la vista previa funcione igual que producción.
