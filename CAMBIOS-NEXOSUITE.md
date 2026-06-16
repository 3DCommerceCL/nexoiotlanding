# Cambios — Rebrand a NexoSuite

Rebuild completo del sitio: de landing única de "smartrooms" (solo IoT) a 3 páginas
bajo la marca "NexoSuite" (PMS + IoT como dos módulos de una plataforma).

## Archivos creados

- `styles/nexosuite.css` — sistema de diseño compartido entre las 3 páginas (variables de color/tipografía, navbar, botones, cards, plan pricing cards, mockups de UI, FAQ, footer, WhatsApp FAB, scroll reveal).
- `assets/logo-nexosuite.svg` — wordmark "NEXO" + "Suite" en DM Sans, sin ícono.
- `pms.html` — página nueva del módulo PMS (no existía antes ninguna página de gestión hotelera).
- `CAMBIOS-NEXOSUITE.md` — este archivo.

## Archivos modificados

- `index.html` — reemplazado completo. Antes era la landing de "smartrooms" (solo IoT); ahora es la landing de NexoSuite que presenta ambos módulos (PMS + IoT) y enlaza a `pms.html`/`iot.html`.
- `iot.html` — nuevo archivo, pero es la evolución directa del `index.html` original: mismo hero (renombrado "Hotel Pacífico Sur" → "Hotel Mirador" para consistencia con el resto del sitio), mismos 3 pasos de "Cómo funciona", mismas 6 features de "Qué incluye", misma galería de 6 imágenes (mismos `src`, alt texts actualizados de "smartrooms" → "NexoSuite"), mismos 3 planes de precio (Base/Premium/Max Comfort) con las mismas features y precios en UF, mismo bloque de soporte y mantención, FAQ reducido a las 6 preguntas más relevantes (de las ~14 que tenía el sitio original).
- `sitemap.xml` — agregadas las entradas de `pms.html` e `iot.html`.

## Archivos NO modificados (fuera de alcance de este prompt)

- `politica-privacidad.html` — no se tocó. Sigue referenciando `logo-smartrooms.png` y la marca "smartrooms" en su texto legal; es un documento legal y el prompt no pidió actualizarlo.
- `robots.txt` — sin cambios (el dominio referenciado sigue siendo correcto).
- `CNAME` — **deliberadamente sin cambios**, sigue en `smartrooms.cl`. El prompt pedía `nexosuite.cl` "cuando esté registrado" — como ese dominio no está registrado todavía, cambiar el CNAME rompería el sitio en vivo (GitHub Pages perdería el dominio personalizado). Todos los `canonical`/`og:url` de las 3 páginas nuevas usan `https://smartrooms.cl/...` por la misma razón. Queda como COMPLETAR de mayor urgencia (ver abajo).

## Contenido del sitio original NO trasladado a las páginas nuevas

Estas secciones existían en el `index.html` original y no tienen un lugar designado en la
especificación de las 3 páginas nuevas. Se omitieron para no inventar contenido fuera de spec,
pero el copy original sigue disponible en el historial de git si se quieren reincorporar:

- **Sección "El equipo"** (`#equipo`) — 3 tarjetas de fundadores, todas con placeholders `COMPLETAR` sin completar en el sitio original tampoco. Candidata natural para agregar a `index.html` cuando haya fotos/bios reales.
- **Tabla comparativa "Por qué no las alternativas"** (vs. Loxone/Vimar, vs. Tuya genérico) — el nuevo `index.html` la resume en la sección "Por qué NexoSuite" (4 diferenciadores), pero la comparación detallada por competidor no se trasladó. Podría agregarse a `iot.html` si se quiere ese nivel de detalle.
- **Bloque "¿Y si un dispositivo se rompe físicamente?"** y **grid de SLA** (uptime 99,5%, <15 min respuesta, etc.) — contenido de alto valor para objeciones de venta; se omitió por no estar en la spec de `iot.html`, pero es buen candidato para una sección adicional de soporte.
- **CTA de descarga de PDF de propuesta** (`assets/smartrooms-propuesta.pdf`) — el PDF nunca existió (era un placeholder en el sitio original), no se trasladó el CTA.
- **Campo oculto `plan_interes` con badge visual** al hacer clic en un plan — funcionalidad del formulario del sitio original; el formulario nuevo es más simple (selects de rango de habitaciones e interés) y no preselecciona un plan específico desde los botones de precio.

## COMPLETAR pendientes — agrupados por urgencia

### Bloqueantes antes de cualquier campaña de marketing
- **WhatsApp**: número real en las 3 páginas (`https://wa.me/56XXXXXXXXX`) — hoy es placeholder.
- **Formulario de contacto**: conectar a un endpoint real (Formspree u otro). Hoy solo hace `preventDefault` y muestra el mensaje de éxito sin enviar nada.
- **og:image**: crear `assets/og-nexosuite.png` (1200×630px) — usado en las 3 páginas para previsualizaciones de redes sociales.

### Bloqueantes antes de cerrar el primer contrato
- **RUT de NEXOSMART SpA** — footer de las 3 páginas.
- **Dominio nexosuite.cl**: registrar y, una vez registrado, actualizar `CNAME`, y los `canonical`/`og:url` de las 3 páginas (hoy apuntan a `smartrooms.cl`).

### Mejoras no bloqueantes
- Google Analytics 4 Measurement ID (snippet ya comentado y listo en `index.html`).
- Sección "El equipo" con fotos/nombres/cargos reales (ver nota arriba — no se trasladó del sitio original).
- Considerar reincorporar el bloque de SLA/garantías de soporte en `iot.html` si se necesita para cerrar ventas.
