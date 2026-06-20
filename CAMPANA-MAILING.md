# Campaña mailing — Diagnóstico PMS para hoteles

Flujo: Email 1 (frío) → formulario [diagnostico.html](diagnostico.html) (resultado instantáneo) → seguimiento humano por WhatsApp dentro de 24h hábiles.

No se promete channel manager certificado como disponible hoy (está en certificación, ver roadmap). El email lidera con SII + UF + check-in QR, que sí están listos.

---

## Email 1 — frío, primer contacto

**Variantes de asunto (probar A/B):**
- A: `{{hotel}}: ¿cuánto tiempo pierden actualizando Booking a mano?`
- B: `Plan PMS para {{hotel}} en 3 minutos (sin llamada)`
- C: `{{nombre}}, una pregunta de 3 minutos sobre {{hotel}}`

**Cuerpo:**

```
Hola {{nombre}},

Te escribo porque {{hotel}} aparece en mi lista de hoteles en Chile que
probablemente todavía actualiza Booking, Airbnb y la disponibilidad a mano,
día por día.

Si es tu caso, no es el único problema típico que veo:
- Pagar el PMS en USD mientras el dólar se mueve
- Entrar manualmente al portal del SII para cada boleta
- Check-in que toma 10 minutos en recepción

Antes de ofrecerte nada, preferimos saber si realmente encajamos contigo.
Hice un formulario de 3 minutos que te dice al toque qué plan te conviene
y cuánto cuesta — sin agendar nada todavía:

{{link_diagnostico}}

Si no somos para ti, el mismo formulario te lo va a decir directo.

Saludos,
{{firma}}
{{cargo}} — NexoSuite (NEXOSMART SpA)

P.D.: Somos el único PMS en Chile con facturación electrónica SII integrada
— boleta o factura con un clic desde el checkout, sin abrir otro portal.

---
Si prefieres no recibir más correos como este, responde "no gracias" y te
sacamos de la lista.
```

**Notas de uso:**
- Variables de mail merge: `{{nombre}}`, `{{hotel}}`, `{{link_diagnostico}}` (apuntar a `diagnostico.html`, idealmente con UTM: `?utm_source=mailing&utm_campaign=cold1`), `{{firma}}`, `{{cargo}}`.
- Mantener bajo 120 palabras en el cuerpo — es el largo que mejor convierte en frío B2B.
- No mencionar precio en el Email 1: el precio se revela recién al completar el formulario (mantiene la curiosidad y filtra a quien no tiene intención real).
- Enviar martes a jueves, 9:00–11:00 hora Chile — mejor tasa de apertura para B2B local.

---

## Email 2 — confirmación automática (dispara al completar el formulario)

Se dispara según la respuesta a "¿Cuántas habitaciones tiene tu hotel?" — mismo corte que `calcularRecomendacion()` en [diagnostico.html](diagnostico.html#L260), para que el email coincida exactamente con lo que el hotelero vio en pantalla. Elegir la plantilla por perfil, no una genérica: el tono y el énfasis cambian según el tipo de operación, no solo el precio.

### Perfil A — PMS Inicio (`habitaciones = lt10`, o variable con ocupación estacional)

Hotel chico, boutique o cabañas — el dolor es la incertidumbre de ocupación, no el volumen. Tono: cercano, sin presión, "empieza sin riesgo".

**Asunto:** `{{hotel}}: tu plan no te cobra de más en temporada baja`

```
Hola {{nombre}},

Gracias por completar el diagnóstico de {{hotel}}. Por tu tamaño y forma de
operar, el plan que más te conviene es PMS Inicio: UF 0,89/mes + 3% sobre
el valor de cada reserva.

Lo pensamos para hoteles como el tuyo, donde la ocupación no es constante
todo el año — el costo se mueve con tus ventas reales, así que nunca pagas
de más en temporada baja.

{{bloque_extras}}

Te escribimos por WhatsApp dentro de las próximas 24 horas hábiles para
confirmar el número exacto con tus datos. Si quieres adelantarte, escríbenos
directo: {{link_whatsapp}}

Saludos,
{{firma}}
```

### Perfil B — PMS Hotel (`habitaciones = 10-100`, ocupación pareja)

Operación ya establecida, flujo de reservas constante — el dolor es tiempo administrativo, no incertidumbre de ingresos. Tono: eficiencia, previsibilidad de costos.

**Asunto:** `{{hotel}}: cuánto le ahorra tu equipo un precio fijo sin comisión`

```
Hola {{nombre}},

Gracias por completar el diagnóstico de {{hotel}}. Con tu número de
habitaciones y un flujo de reservas constante, el plan que más te conviene
es PMS Hotel: UF 0,12/hab/mes, sin comisión por reserva.

Con ocupación estable, un precio fijo te sale más a cuenta que pagar un
porcentaje por cada reserva — y tu equipo deja de perder tiempo
actualizando disponibilidad y tarifas a mano en cada canal.

{{bloque_extras}}

Te escribimos por WhatsApp dentro de las próximas 24 horas hábiles para
confirmar el número exacto con tus datos. Si quieres adelantarte, escríbenos
directo: {{link_whatsapp}}

Saludos,
{{firma}}
```

### Perfil C — PMS Full (`habitaciones = 100+`, ocupación pareja)

Hotel grande o cadena pequeña — el dolor es complejidad operativa y distribución multicanal. Tono: volumen, soporte dedicado, ROI a escala.

**Asunto:** `{{hotel}}: el mejor precio por habitación para tu volumen`

```
Hola {{nombre}},

Gracias por completar el diagnóstico de {{hotel}}. Para un hotel de tu
tamaño, el plan que más te conviene es PMS Full: UF 0,09/hab/mes, sin
comisión por reserva, con más de 3 canales OTA conectados — pensado para
quienes ya distribuyen en varios canales a la vez.

A tu volumen, cada punto de eficiencia operativa importa: housekeeping,
tarifas por temporada y reportes RevPAR/ADR centralizados en un solo
sistema, sin planillas paralelas entre áreas.

{{bloque_extras}}

Te escribimos por WhatsApp dentro de las próximas 24 horas hábiles para
confirmar el número exacto con tus datos y coordinar el setup. Si quieres
adelantarte, escríbenos directo: {{link_whatsapp}}

Saludos,
{{firma}}
```

### `{{bloque_extras}}` — módulos según respuestas (insertar 0 a 3, en este orden)

Misma lógica que el array `extras` de `calcularRecomendacion()` — copiar el texto, no reinventarlo, para que el email no contradiga lo que ya vio en la página:

- Si `disponibilidad = manual`:
  > Hoy actualizas disponibilidad a mano — es exactamente el problema que más rápido resolvemos. El channel manager certificado (Booking, Airbnb, Expedia) llega en agosto 2026; al ser de los primeros en escribirnos, te damos prioridad de acceso.
- Si `facturacion = manual` o `no_se`:
  > Tu boleta o factura sale con un clic desde el checkout, directo al SII, sin abrir otro portal — ningún otro PMS en Chile lo hace hoy.
- Si `domotica = si` o `tal_vez`:
  > Como te interesa la domótica: si más adelante contratas NexoSuite IoT, {{gratis o baja de precio según plan}} — sin importar qué nivel de IoT elijas.

Si el hotel cae en el caso "variable" de 10-100 o 100+ habitaciones (Inicio o Hotel/Full empatados), usar el Perfil A como base pero reemplazar el primer párrafo por una comparación breve de los dos modelos, dejando que WhatsApp resuelva el detalle con los números reales — no forzar una sola cifra cuando el formulario mismo mostró dos.

---

## Email 3 — reenganche (solo si no respondió WhatsApp/email en 5 días hábiles tras Email 2)

Mismo corte de perfil que el Email 2 — el gancho retoma el beneficio específico que ya vio, no un genérico "¿seguimos?". Cuerpo corto a propósito: a 5 días de silencio, lo que convierte es bajar la presión, no insistir con más argumentos.

### Perfil A — PMS Inicio

**Asunto:** `{{hotel}}: tu plan sigue sin costo fijo que arriesgar`

```
Hola {{nombre}},

Hace unos días viste que {{hotel}} encaja en PMS Inicio — el plan donde el
costo se mueve con tus ventas reales, sin un fijo alto que arriesgar en
temporada baja. No he sabido de ti, entiendo que la agenda de un hotel
chico no da tregua.

Si todavía te interesa, contesto cualquier duda por WhatsApp en minutos:
{{link_whatsapp}}

Si ya no es el momento, también está bien — solo dímelo y no te molesto más.

Saludos,
{{firma}}
```

### Perfil B — PMS Hotel

**Asunto:** `{{hotel}}: cuánto tiempo administrativo siguen perdiendo`

```
Hola {{nombre}},

Hace unos días viste que {{hotel}} encaja en PMS Hotel — precio fijo, sin
comisión por reserva, y tu equipo deja de actualizar disponibilidad a mano
en cada canal. No he sabido de ti — entiendo que entre el día a día de
recepción es fácil que esto quede pendiente.

Si todavía te interesa, contesto cualquier duda por WhatsApp en minutos:
{{link_whatsapp}}

Si ya no es el momento, también está bien — solo dímelo y no te molesto más.

Saludos,
{{firma}}
```

### Perfil C — PMS Full

**Asunto:** `{{hotel}}: el setup para tu volumen sigue disponible`

```
Hola {{nombre}},

Hace unos días viste que {{hotel}} encaja en PMS Full — el mejor precio por
habitación para tu volumen, con housekeeping, tarifas y reportes
centralizados en un solo sistema. No he sabido de ti — para un hotel de tu
tamaño entiendo que una decisión así pasa por más de una persona.

Si quieres que coordinemos una conversación con tu equipo, contesto
cualquier duda por WhatsApp en minutos: {{link_whatsapp}}

Si ya no es el momento, también está bien — solo dímelo y no te molesto más.

Saludos,
{{firma}}
```
