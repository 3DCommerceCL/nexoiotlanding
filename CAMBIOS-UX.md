# Cambios UX aplicados — smartrooms landing

## CAMBIO 1 — Primera impresión: reforzar confianza en el hero
- Subtítulo actualizado: foco en hoteles, cabañas como mención secundaria en línea aparte (`.hero-sub-alt`)
- Agregada barra de confianza (`trust-bar`) con tres ítems: "Instalado en hoteles boutique en Chile", "Soporte local en Santiago", "Demo en vivo en 30 min"
- En mobile ≤600px la barra se apila verticalmente con `flex-direction:column`
- Los dos CTAs del hero ya eran visualmente distinguibles (primario sólido / secundario outline) — se confirma y preserva

## CAMBIO 2 — Flujo de información: reorganizar secciones
- **Eliminada** la sección de video (`#video`) completamente del DOM (estaba oculta con `display:none`)
- **Orden de secciones actualizado:**
  1. Hero
  2. Cómo funciona
  3. Qué incluye
  4. Lo que gana tu hotel ← nueva
  5. Galería ← movida antes de Planes
  6. Planes
  7. Soporte y mantención
  8. El equipo ← nueva
  9. Por qué smartrooms
  10. Contacto
- **Nueva sección `#beneficios` ("Lo que gana tu hotel")** con fondo oscuro (var(--g900)) y tres tarjetas: Diferenciación competitiva, Ahorro energético real, Menos carga para tu equipo. Reutiliza el sistema de cards con estilo propio (`.bc`) para contraste visual.

## CAMBIO 3 — Credibilidad: equipo + marcas
- **Nueva sección `#equipo`** ("Las personas detrás de smartrooms") con grilla de 3 tarjetas, avatares circulares con iniciales (swap-ready para fotos reales), nombre, cargo y bio
- Todos los campos del equipo marcados con `<!-- COMPLETAR: ... -->`
- **Footer actualizado:** "smartrooms es una marca de **NEXOSMART SpA** · Santiago, Chile · [RUT placeholder] · contacto@nexosmart.cl"
- **Badge "Empresa chilena 🇨🇱"** agregado en el navbar (`.badge-chile`), se oculta en mobile ≤768px junto con los links

## CAMBIO 4 — CTAs: WhatsApp + plan oculto + PDF
- **WhatsApp FAB** con tooltip en desktop ("Escríbenos por WhatsApp"), z-index:9999, posición bottom:20px/right:16px en mobile. Número placeholder marcado con `<!-- COMPLETAR -->`
- **Campo hidden `plan_interes`** en el formulario. Los botones de cada plan tienen `class="btn-cotizacion"` y `data-plan="Base|Premium|Max Comfort"`. Al hacer clic se puebla el campo oculto y aparece un badge visible en el form ("Plan seleccionado: Premium ✓")
- **CTA PDF** bajo la grilla de planes: "↓ Descargar propuesta completa en PDF" apuntando a `assets/smartrooms-propuesta.pdf` — **PENDIENTE: colocar el PDF real en esa ruta**

## CAMBIO 5 — Mobile responsivo
- Navbar hamburguesa ya operativa; breakpoint ampliado a 768px (antes 600px) ocultando links, badge y CTA
- Plans apilados en 1 columna desde 1060px (existente, confirmado)
- Mockup de celular oculto en ≤480px (`display:none`) para que el copy tenga protagonismo
- Trust bar apilada verticalmente en ≤600px
- Disclaimer de precios en `.plan-disclaimer` con font-size:.83rem (>13px), sobre fondo blanco con borde visible

## CAMBIO 6 — Galería, disclaimer y orden final
- **Galería etiquetada honestamente:** "Imágenes referenciales del tipo de instalación. Solicita ver fotos reales en tu demo." (`.gallery-context`)
- **Disclaimer de precios** movido a bloque `.plan-disclaimer` debajo de la grilla de planes, con texto más grande y prominente (antes era un `<p>` pequeño al pie)
- **"Por qué smartrooms"** movida para quedar entre "El equipo" y "Contacto"
- Todos los anchor links del navbar actualizados para reflejar el nuevo orden

---

## Pendientes de completar (con `<!-- COMPLETAR -->` en el código)

| Elemento | Dónde |
|----------|-------|
| Número de WhatsApp | Link del botón FAB |
| Fotos del equipo | `assets/team/persona1.jpg`, `persona2.jpg`, `persona3.jpg` |
| Nombres y cargos reales del equipo | Sección `#equipo` |
| RUT de NEXOSMART SpA | Footer |
| Email de contacto (confirmar) | Footer + politica-privacidad.html |
| PDF de propuesta | `assets/smartrooms-propuesta.pdf` |
| Google Analytics Measurement ID | `<head>` (snippet comentado, listo para activar) |
