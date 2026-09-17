# Migración SEO · Calidade Systems

**Para: quien administra el servidor y el WordPress de calidade.systems.**

La web nueva **no sustituye al WordPress**. Se instala al lado y ocupa solo la
portada, las dos versiones de idioma y las páginas legales. Los 40 artículos
del cuaderno técnico se siguen publicando desde WordPress, con sus direcciones
intactas y respondiendo 200. Este documento dice exactamente qué sirve cada uno
y qué hay que tocar.

Fecha: 17 de septiembre de 2026.

---

## 1. Reparto de URLs

| Ruta | Quién la sirve | Nota |
|---|---|---|
| `/` | web nueva | 301 a `/es/`. Hoy hace **302 a `/en/`**: eso cambia. |
| `/es/`, `/en/` | web nueva | Portadas. Coincidencia **exacta**, no por prefijo. |
| `/es/aviso-legal.html`, `/es/politica-de-cookies.html` | web nueva | |
| `/en/legal-notice.html`, `/en/cookies-policy.html` | web nueva | |
| `/assets/`, `/css/`, `/js/`, `/manifest.json`, `/404.html` | web nueva | Ninguna colisiona con WordPress. |
| `/robots.txt`, `/sitemap.xml`, `/sitemap-paginas.xml` | web nueva | Ver §5. |
| `/es/AAAA/MM/DD/slug/` y `/en/AAAA/MM/DD/slug/` | **WordPress, sin tocar** | Los 40 artículos. |
| `/wp-json/`, `/wp-admin/`, `/wp-content/`, `/feed/`, `post-sitemap.xml`, `category-sitemap.xml`, `post_tag-sitemap.xml` | **WordPress, sin tocar** | La portada nueva consume `/wp-json/`. |
| Cualquier otra cosa | WordPress | Regla comodín: nada que funcionara antes se queda sin servidor. |

La clave de todo el enrutado es que **las URLs de artículo nunca terminan en
`.html` y nunca son exactamente `/es/` o `/en/`**. Con eso basta para separar
los dos sitios sin enumerar 40 rutas.

---

## 2. Qué hay que instalar

### Con nginx delante (recomendado)

1. Copiar esta carpeta a `/var/www/calidade-nueva`.
2. Copiar `seo/redirecciones-301.map` a `/etc/nginx/calidade/redirecciones-301.map`.
3. Usar `seo/nginx-calidade.conf` como bloque `server`, ajustando la ruta de la
   carpeta y el `proxy_pass` al backend actual de WordPress.
4. `nginx -t && systemctl reload nginx`.

### Con Apache solo

1. Copiar el contenido de esta carpeta **a la misma raíz** donde está
   WordPress, de modo que `/es/index.html` y `/en/index.html` existan de verdad
   en disco.
2. Pegar el contenido de `seo/apache-htaccess.txt` **antes** del bloque
   `# BEGIN WordPress` del `.htaccess`.

Con Apache, el reparto sale casi solo: `/es/` es un directorio real con
`index.html`, así que `mod_dir` lo sirve y la petición no llega al `RewriteRule`
de WordPress; `/es/2019/01/10/slug/` no existe en disco, así que cae en
WordPress y se sirve igual que hoy.

---

## 3. Redirecciones 301

Archivos entregados:

- `seo/redirecciones-301.map` — formato `map` de nginx, listo para `include`.
- `seo/redirecciones-301.csv` — el mismo mapa en tabla, para revisarlo o
  cargarlo en un plugin de redirecciones.
- `seo/apache-htaccess.txt` — las mismas reglas como `RedirectPermanent`.

Son **30 reglas**:

| Grupo | Nº | Destino |
|---|---|---|
| `/es/services/<slug>/` | 9 | `/es/#<mismo-slug>` |
| `/en/services/<slug>/` | 9 | `/en/#<mismo-slug>` |
| `/es/contacto/`, `/en/contact-us/` | 2 | `/es/#contacto`, `/en/#contact` |
| Páginas legales ES y EN | 4 | Las cuatro páginas nuevas |
| `/es/frontpage-spanish/`, `/gl/` | 2 | `/es/` |
| URLs mal formadas del sitemap actual | 4 | Su destino real, en un solo salto |

Y aparte, `/` → `/es/` en la propia configuración del servidor.

### Por qué los servicios van a un ancla y no a una página propia

Los 18 slugs de servicio se conservan **letra por letra** como `id` de cada
nodo en la portada. Hoy cada página de servicio de WordPress contiene una sola
frase, exactamente la que ya está en la tarjeta correspondiente de la web
nueva: redirigir al ancla consolida esa señal en la portada en vez de
repartirla entre nueve páginas casi vacías.

Si más adelante el cliente escribe contenido de verdad para cada servicio, el
cambio es mecánico: se crean `/es/servicios/<slug>/` con el mismo slug y se
sustituye el destino en el mapa. No hay que renombrar nada.

### Lo que NO se redirige

Los 40 artículos. Ninguno. Siguen respondiendo 200 en su URL de siempre. Es la
parte del posicionamiento que hay que conservar y la forma de conservarla es no
tocarla.

---

## 4. Canonical y hreflang

Cada página declara tres `alternate`: `es`, `en` y `x-default`, y el
`x-default` apunta siempre a la versión **en español**. Son recíprocos: la
página en inglés declara el mismo par que la española.

Ejemplo, `/es/`:

```html
<link rel="canonical"  href="https://www.calidade.systems/es/">
<link rel="alternate" hreflang="es"        href="https://www.calidade.systems/es/">
<link rel="alternate" hreflang="en"        href="https://www.calidade.systems/en/">
<link rel="alternate" hreflang="x-default" href="https://www.calidade.systems/es/">
```

### Tres cosas que había que corregir y están corregidas

1. **La raíz servía inglés.** `/` hacía 302 a `/en/`. Ahora hace 301 a `/es/`,
   que es el `x-default`.
2. **Se declaraba `hreflang="gl"`.** `/gl/` existe y está vacía. Un hreflang a
   una página sin contenido es una señal rota: se ha quitado de las tres
   declaraciones y `/gl/` pasa a redirigir a `/es/`. En cuanto el cliente
   aporte los textos en gallego se vuelve a añadir, no antes.
3. **La portada no tenía `meta description`.** Ahora las seis páginas tienen
   `title` y `description` propios y distintos por idioma.

Además, el `hreflang` antiguo estaba duplicado: el tema emitía un bloque
`<link rel="alternate" href=... hreflang=...>` y otro bloque distinto con el
orden de atributos cambiado. En la web nueva hay un solo bloque.

---

## 5. Sitemaps y robots

`sitemap.xml` pasa a ser un **índice nuevo** servido por la web estática que
apunta a:

- `sitemap-paginas.xml` — las 6 páginas nuevas, con sus `xhtml:link` de idioma.
- `post-sitemap.xml` — **el de WordPress, sin tocar**, con los 40 artículos.
- `category-sitemap.xml` y `post_tag-sitemap.xml` — también de WordPress.

**No** se incluyen `services-sitemap.xml` ni `page-sitemap.xml`: sus URLs ahora
devuelven 301 y un sitemap no debe listar redirecciones.

> El plugin *Google Sitemap Generator* seguirá generando su propio
> `/sitemap.xml`. La configuración de nginx sirve antes el archivo estático, así
> que el índice nuevo gana. Con Apache pasa lo mismo porque el archivo existe en
> disco. Aun así, conviene **desactivar la generación del índice** en el plugin
> y dejarle solo los sub-sitemaps, para que no haya dos fuentes de verdad.

`robots.txt` se reescribe: permite todo el sitio, bloquea la trastienda de
WordPress y `/wp-json/` (que se usa desde la portada pero no aporta nada
indexado), y apunta al sitemap nuevo.

---

## 6. Cookies

El aviso actual es del tipo «si continúas navegando aceptas el uso de
cookies». No es válido: navegar no es consentir, ni según el RGPD ni según la
Guía sobre el uso de cookies de la AEPD.

El aviso nuevo tiene **aceptar y rechazar con el mismo peso visual**, y
rechazar funciona de verdad. Puede permitírselo porque el sitio nuevo no
instala nada: no hay analítica, ni píxeles, ni cookies de terceros. Lo único
que se guarda es una clave en `localStorage` (`calidade-cookies`) con la propia
decisión, que está exenta de consentimiento previo.

El mapa de Google **no se carga solo**: hay un botón (`.map-consent`) y hasta
que no se pulsa el navegador no contacta con Google. Comprobado: cargando
`/es/` no se emite ninguna petición a `maps`.

Las páginas de artículo siguen siendo de WordPress y pueden seguir poniendo sus
cookies técnicas de sesión. La política de cookies nueva lo dice explícitamente.

---

## 7. Rendimiento

La portada nueva **no carga ni un recurso del tema Sydney ni de ningún plugin
de WordPress**. Su única relación con WordPress es una llamada `fetch` a
`/wp-json/wp/v2/posts` para pintar las últimas entradas; si no responde en 7
segundos se aborta y se quedan cuatro entradas reales ya escritas en el HTML,
sin enseñar ningún error.

Lo que sí carga de fuera: Google Fonts (tres familias) y GSAP + Lenis desde
cdnjs y jsDelivr. Si algún día se quiere cortar también eso, hay que
autoalojar los `woff2` y los dos `.js`; está anotado como pendiente en la
política de cookies.

> **Ojo con `?lang=es`.** El parámetro que traía el encargo no filtra nada en
> esta instalación: `/wp-json/wp/v2/posts?per_page=4&lang=es` devuelve las
> cuatro entradas más recientes **en inglés**. El JavaScript pide un lote de 30
> y filtra por el idioma que lleva la URL de cada entrada (`/es/` o `/en/`).

---

## 8. Comprobaciones hechas

Sobre el sitio real, hoy:

- Las **258 URLs** del sitemap actual están clasificadas. **Ninguna queda
  huérfana.**
- Las **40 URLs de artículo** se han pedido una a una: las 40 responden **200**.
  Ninguna está en el mapa de redirecciones, así que seguirán respondiendo 200.
- Las **30 URLs migradas** existen hoy (200 o 301), es decir, las redirecciones
  hacen falta y apuntan a algo que estaba vivo.
- La API REST contesta y admite CORS (refleja el `Origin`), aunque en
  producción la llamada será del mismo dominio y no hará falta.

Sobre la web nueva, con Playwright (71 comprobaciones, 0 fallos):

- `hreflang` recíproco y `x-default` al español en las 6 páginas; ninguna
  declara `gl`; todas tienen `title`, `description` y un solo `<h1>`.
- JSON-LD válido: `LocalBusiness` con dirección, teléfono, horario y geo, más
  los 9 `Service`.
- Entradas del blog: con la API viva se pintan desde WordPress y todas son
  `/es/`; con `route.abort()` sobre `**/wp-json/**` quedan las 4 de respaldo,
  visibles y sin un solo error en pantalla.
- El botón de rechazar cierra el aviso de verdad (`[hidden]` + `display:none`
  computado) y la decisión persiste tras recargar.
- Sin pulsar nada, cero peticiones a Google Maps; al pulsar, el iframe se monta
  con `output=embed` y sin API key.
- Sin GSAP ni Lenis (abortados en red): la portada se ve entera y no hay
  errores de JS.
- Con `prefers-reduced-motion`: pistas dibujadas, nodos encendidos, el nodo del
  servidor no late — y el reloj y los contadores siguen actualizándose, porque
  son contenido, no decoración.
- A 400 px: sin scroll horizontal, nada se sale del ancho y las pistas siguen
  siendo verticales en el margen izquierdo.
- La pila de los nueve servicios: las nueve tarjetas llegan a pegarse, se
  sueltan todas en el mismo píxel de scroll, la última aguanta 330 px pegada en
  lugar de atravesar el tope, y ninguna tarjeta de atrás asoma por fuera de la
  activa.
- El avance del recorrido llega al 100 % con GSAP, sin GSAP y con movimiento
  reducido; su mapa monta un pad por sección, los reparte por igual y el nodo
  cae sobre el pad de la sección en la que estás.

---

## 9. Antes de publicar

- [ ] Rellenar el **aviso legal**: razón social, NIF/CIF, correo y datos
      registrales. Hasta entonces no cumple el artículo 10 de la LSSI.
- [ ] Dar un **destino al formulario** (buzón o endpoint) y revisar el apartado
      de protección de datos.
- [ ] Confirmar el **permiso de uso de los logotipos** de los siete clientes.
- [ ] Desactivar la generación del índice de sitemap en el plugin (§5).
- [ ] Reenviar `sitemap.xml` en Search Console y vigilar durante dos semanas el
      informe de cobertura: lo esperado es ver 30 redirecciones nuevas y **cero
      404**.
- [ ] Comprobar que `/` deja de responder 302 y responde 301 a `/es/`.
