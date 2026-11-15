// puente-simulacion.js — corre ANTES de shared.js/app.js en app-huesped/.
// La app del huésped es la real (copiada tal cual). Este archivo cumple el papel del
// servidor y de la caja de la pieza: le da a la app los datos de la habitación 204,
// contesta lo que pide a /api y le pasa cada comando a la simulación 3D (la página
// que la contiene), y al revés: lo que pasa en la escena se refleja en la app.
'use strict';
(() => {
  const q = new URLSearchParams(location.search);
  const PLAN = q.get('plan') || 'premium';               // base | premium (Full) | max_comfort (Max)
  const NIVEL = { base: 0, premium: 1, max_comfort: 2 };
  const nivel = NIVEL[PLAN] ?? 1;
  const IDIOMA = ['en', 'pt'].includes(q.get('lang')) ? q.get('lang') : 'es';
  const madre = window.parent !== window ? window.parent : null;
  const avisar = (m) => { if (madre) madre.postMessage({ nexo: true, ...m }, '*'); };

  // ── Textos propios de la simulación (la oferta de eco y los pasos del aire en el tutorial) ──
  const TX = {
    'Modo eco': ['Eco mode', 'Modo eco'],
    'Cuando no estés, tu habitación ahorra energía y queda lista para tu vuelta.': ['While you are out, your room saves energy and is ready when you return.', 'Quando você não estiver, seu quarto economiza energia e fica pronto para a sua volta.'],
    'Siguiente': ['Next', 'Próximo'],
    '¿Qué hace?': ['What does it do?', 'O que ele faz?'],
    'Apaga luces y TV si no hay nadie.': ['Turns off lights and TV when nobody is in.', 'Desliga luzes e TV se não houver ninguém.'],
    'Deja el aire en espera, a 25 °C.': ['Puts the AC on standby at 25 °C.', 'Deixa o ar em espera, a 25 °C.'],
    'Al volver, todo sigue como lo dejaste.': ['When you return, everything is as you left it.', 'Na volta, tudo fica como você deixou.'],
    'Lo apagas cuando quieras en Ajustes.': ['Turn it off any time in Settings.', 'Desligue quando quiser em Ajustes.'],
    '¿Activar el modo eco?': ['Turn on eco mode?', 'Ativar o modo eco?'],
    'Sí, activar': ['Yes, turn it on', 'Sim, ativar'], 'No, gracias': ['No, thanks', 'Não, obrigado'],
    '¿Te avisamos?': ['Shall we notify you?', 'Podemos te avisar?'],
    'Te avisamos cuando se active y cuánto vas a ahorrar.': ['We let you know when it turns on and how much you will save.', 'Avisamos quando ativar e quanto você vai economizar.'],
    'Permitir avisos': ['Allow notifications', 'Permitir avisos'], 'Ahora no': ['Not now', 'Agora não'],
    '¿Cuándo se activa?': ['When should it turn on?', 'Quando deve ativar?'],
    'Automático al salir': ['Automatically when I leave', 'Automático ao sair'],
    'Puerta cerrada y nadie en la pieza.': ['Door closed and nobody in the room.', 'Porta fechada e ninguém no quarto.'],
    'Necesita sensores de presencia (plan Full).': ['Needs presence sensors (Full plan).', 'Precisa de sensores de presença (plano Full).'],
    'Por horario': ['On a schedule', 'Por horário'], 'Cuando sé que no voy a estar.': ['When I know I will be out.', 'Quando sei que não vou estar.'],
    'No estaré de': ['Out from', 'Fora das'], 'a': ['to', 'às'],
    'Guardar': ['Save', 'Salvar'],
    '¿Salir sin activar el modo eco?': ['Leave without turning on eco mode?', 'Sair sem ativar o modo eco?'],
    'Puedes activarlo después en Ajustes.': ['You can turn it on later in Settings.', 'Você pode ativar depois em Ajustes.'],
    'Activar modo eco': ['Turn on eco mode', 'Ativar modo eco'], 'Salir': ['Leave', 'Sair'], 'Volver': ['Go back', 'Voltar'],
    'Cerrar': ['Close', 'Fechar'],
    'Puedes activarlo cuando quieras en Ajustes.': ['You can turn it on any time in Settings.', 'Você pode ativar quando quiser em Ajustes.'],
    'Modo eco activado': ['Eco mode on', 'Modo eco ativado'],
  };
  const tx = (t) => (IDIOMA === 'es' || !TX[t] ? t : TX[t][IDIOMA === 'en' ? 0 : 1]);
  const TUT_AIRE = {
    es: { tutAcOnTitle: 'Encender el aire', tutAcOnDesc: 'El aire se maneja desde aquí por infrarrojo. Toca «Encender».', tutAcModoTitle: 'Elegir el modo', tutAcModoDesc: 'Frío para enfriar, Calor para calefaccionar: así la habitación sabe hacia dónde ir.', tutAcTempTitle: 'Fijar la temperatura', tutAcTempDesc: 'Con − y + eliges a cuántos grados quieres la habitación. El sistema la mantiene solo.' },
    en: { tutAcOnTitle: 'Turn on the AC', tutAcOnDesc: 'The AC is controlled from here by infrared. Tap “On”.', tutAcModoTitle: 'Choose the mode', tutAcModoDesc: 'Cool or Heat, so the room knows which way to go.', tutAcTempTitle: 'Set the temperature', tutAcTempDesc: 'Use − and + to choose how warm you want the room. The system keeps it there.' },
    pt: { tutAcOnTitle: 'Ligar o ar', tutAcOnDesc: 'O ar é controlado daqui por infravermelho. Toque em «Ligar».', tutAcModoTitle: 'Escolher o modo', tutAcModoDesc: 'Frio para resfriar, Calor para aquecer: assim o quarto sabe para onde ir.', tutAcTempTitle: 'Definir a temperatura', tutAcTempDesc: 'Com − e + você escolhe a temperatura do quarto. O sistema a mantém sozinho.' },
  };

  // Cada carga de la simulación es una estadía nueva: sin onboarding visto ni preferencias guardadas
  try { if (q.has('nueva')) Object.keys(localStorage).filter((k) => k.startsWith('nexo_')).forEach((k) => localStorage.removeItem(k)); } catch { /* sin almacenamiento */ }

  // ── Modo Eco: mismo catálogo y misma resolución que backend/eco.js ────────────
  const FUNCIONES = {
    setback_rapido: { etiqueta: 'Ahorro más rápido al salir', detalle: 'Cuando salgo, que la climatización se relaje antes y un poco más.', plan: 'premium', porDefecto: true },
    standby_off: { etiqueta: 'Cortar el consumo fantasma', detalle: 'Apagar del todo lo que queda en espera mientras no estoy.', plan: 'base', porDefecto: true },
    luces_70: { etiqueta: 'Luces al 70%', detalle: 'Un poco menos de brillo, casi imperceptible.', plan: 'base', porDefecto: false },
    toallas: { etiqueta: 'No cambiar las toallas a diario', detalle: 'Las reutilizo mientras dure mi estadía.', plan: 'base', porDefecto: false },
    preguntar_salida: { etiqueta: 'Preguntarme si salí', detalle: 'Si parece que salí, avisarme para apagar antes y tenerlo listo a mi vuelta.', plan: 'premium', porDefecto: false },
    resumen_ahorro: { etiqueta: 'Mostrarme cuánto llevo ahorrado', detalle: 'Ver mi consumo evitado durante la estadía.', plan: 'base', porDefecto: true },
  };
  let pref = {};            // { activo, funciones, cuando, desde, hasta, avisos }
  let pesosEvitados = 0;
  function estadoEco() {
    const activo = !!pref.activo;
    const funciones = Object.entries(FUNCIONES).filter(([, f]) => nivel >= NIVEL[f.plan]).map(([k, f]) => {
      const tildada = pref.funciones && k in pref.funciones ? !!pref.funciones[k] : f.porDefecto;
      return { clave: k, etiqueta: f.etiqueta, detalle: f.detalle, tildada: activo && tildada };
    });
    return { activo, porDefectoDelHotel: false, funciones };
  }

  // ── Lo que la app le pediría al servidor ──────────────────────────────────────
  const fetchReal = window.fetch.bind(window);
  const responder = (cuerpo, status = 200) => Promise.resolve(new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } }));
  let objetivo = null, modoClima = null;
  window.fetch = (url, opt = {}) => {
    const u = String(url);
    if (!u.includes('/api/')) return fetchReal(url, opt);
    const metodo = (opt.method || 'GET').toUpperCase();
    let cuerpo = {}; try { cuerpo = opt.body ? JSON.parse(opt.body) : {}; } catch { /* no es JSON */ }
    if (/\/eco\/ahorro/.test(u)) return responder({ habilitado: true, sinDatos: !(pesosEvitados > 0), pesosEvitado: pesosEvitados });
    if (/\/eco\/control/.test(u)) { avisar({ tipo: 'ecoControl', accion: cuerpo.accion }); return responder({ ok: true }); }
    if (/\/eco(\?|$)/.test(u)) {
      if (metodo === 'POST') { pref = { ...pref, activo: !!cuerpo.activo, funciones: cuerpo.funciones || pref.funciones }; avisar({ tipo: 'eco', pref }); }
      return responder(estadoEco());
    }
    // con termómetro, el aire se maneja con una temperatura objetivo que guarda el servidor: la caja la cumple
    if (/\/clima-objetivo/.test(u)) {
      if (metodo === 'POST') { objetivo = cuerpo.objetivo ?? objetivo; modoClima = cuerpo.modo || modoClima; avisar({ tipo: 'comando', device: 'ir_pieza', command: { objetivo, modo: modoClima } }); }
      return responder({ objetivo, modo: modoClima, llegadaMin: null });
    }
    if (/\/(chat|actividad|agenda|servicios|accesos|schedule|scenes)/.test(u)) return responder(metodo === 'GET' ? [] : { ok: true });
    return responder({ ok: true });
  };

  // ── Datos de la habitación 204 según el plan ──────────────────────────────────
  const hoy = new Date(); const manana = new Date(Date.now() + 86400000); manana.setHours(12, 0, 0, 0);
  window.NEXO_SIM = {
    plan: PLAN,
    datos(base) {
      // luces regulables con blanco cálido, neutro o frío y color RGB, como en la demo de la app
      const luz = (label, intensity, colorTemp) => ({ label, type: 'light_rgb', available: true, state: { on: false, intensity, mode: 'white', colorTemp, hue: 30, saturation: 1000 } });
      const devices = {
        luz_techo: luz('Luz techo', 80, 50),
        luz_velador1: luz('Velador izquierdo', 70, 20),
        luz_velador2: luz('Velador derecho', 70, 20),
        cortina: { label: 'Cortina', type: 'curtain', available: true, travelMs: 6000, state: { control: 'stop', position: 0 } },
        // emisor IR de la pieza (cuadradito en la pared): TV, aire y estufa
        ir_pieza: {
          label: 'Emisor IR', type: 'ir_remote', available: true, state: {},
          irButtons: ['tv_power', 'tv_vol_up', 'tv_vol_down', 'tv_mute', 'ac_on', 'ac_off', 'ac_mode_cool', 'ac_mode_heat',
            ...[18, 19, 20, 21, 22, 23, 24, 25, 26].flatMap((n) => [`ac_cool_t${n}`, `ac_heat_t${n}`]), 'estufa_on', 'estufa_off'],
          irMeta: { estufa_on: { appliance: 'Estufa', label: 'Encender' }, estufa_off: { appliance: 'Estufa', label: 'Apagar' } },
        },
      };
      if (nivel >= 1) {
        devices.led_cama = { label: 'LED bajo cama', type: 'light_rgb', available: true, state: { on: false, intensity: 60, mode: 'colour', colorTemp: 50, hue: 200, saturation: 1000 } };
        devices.termometro = { label: 'Termómetro', type: 'temp_sensor', available: true, state: { tempAmbiente: 22.6, humedad: 48 } };
      }
      if (nivel >= 2) devices.ir_bano = {   // segundo emisor IR, en el baño: el inodoro japonés
        label: 'Emisor IR baño', type: 'ir_remote', available: true, state: {},
        irButtons: ['wc_lavado', 'wc_secado', 'wc_asiento', 'wc_parar'],
        irMeta: { wc_lavado: { appliance: 'Baño japonés', label: 'Lavado' }, wc_secado: { appliance: 'Baño japonés', label: 'Secado' }, wc_asiento: { appliance: 'Baño japonés', label: 'Asiento tibio' }, wc_parar: { appliance: 'Baño japonés', label: 'Detener' } },
      };
      return { ...base, roomId: '204', roomName: ({ en: 'Room 204', pt: 'Quarto 204' })[IDIOMA] || 'Habitación 204', hotelName: 'Hotel Bahía', guestName: q.get('nombre') || 'Camila', lang: IDIOMA,
        checkin: hoy.toISOString(), checkout: manana.toISOString(), demoMode: false, plan: PLAN, devices };
    },
    listo() {
      app.token = 'sim-204';   // eco, ahorro y demás piden un token; la simulación contesta por fetch
      // el tutorial guiado suma el aire: encender, modo y temperatura (se saltan si la pieza no los tiene)
      try {
        for (const l of ['es', 'en', 'pt']) if (I18N[l]) Object.assign(I18N[l], TUT_AIRE[l]);
        const q1 = (s) => () => document.querySelector(s);
        TUTORIAL_STEPS.push(
          { view: 'room', selector: q1('#feature-climateIr [data-ir="ac_on"]'), titleKey: 'tutAcOnTitle', descKey: 'tutAcOnDesc' },
          { view: 'room', selector: () => document.querySelector('#feature-climateIr [data-action="clima-modo"][data-modo="cool"]') || document.querySelector('#feature-climateIr [data-ir="ac_mode_cool"]'), titleKey: 'tutAcModoTitle', descKey: 'tutAcModoDesc' },
          { view: 'room', selector: () => document.querySelector('#feature-climateIr [data-action="ir-obj-paso"][data-dir="-1"]') || document.querySelector('#feature-climateIr [data-ir^="ac_cool_t"]'), titleKey: 'tutAcTempTitle', descKey: 'tutAcTempDesc' });
      } catch { /* la app cambió: el tutorial sigue con sus pasos */ }
      try { loadEcoHuesped(); } catch { /* sin tarjeta eco */ }
      avisar({ tipo: 'listo' });
    },
    comando(device, command) { avisar({ tipo: 'comando', device, command }); return Promise.resolve({ success: true }); },
  };

  // ── Lo que pasa en la escena, reflejado en la app ─────────────────────────────
  window.addEventListener('message', (e) => {
    const m = e.data || {};
    if (!m.nexo || typeof app === 'undefined') return;
    if (m.tipo === 'estado') {
      if (typeof _wheelDragging !== 'undefined' && _wheelDragging) return;   // no redibujar mientras se arrastra la rueda de color
      for (const [k, st] of Object.entries(m.devices || {})) {
        if (!app.devices[k]) continue;
        const antes = JSON.stringify(app.devices[k]);
        Object.assign(app.devices[k], st);
        if (JSON.stringify(app.devices[k]) !== antes) {
          if (k === 'cortina' && app._curtainAnim && app._curtainAnim[k]) continue;   // no pisar la animación de la barra
          // el termómetro solo cambia la línea de ambiente del aire: redibujar todo deshacía la rueda de color y el control agrandado
          if (k === 'termometro') { try { const el = document.getElementById('feature-climateIr'); if (el && !el.contains(document.activeElement)) el.outerHTML = buildClimateIRCard(); } catch { /* */ } continue; }
          try { updateCard(k); } catch { /* tarjeta no visible */ }
        }
      }
    }
    if (m.tipo === 'ahorro') { pesosEvitados = m.pesos || 0; try { loadEcoHuesped(); } catch { /* */ } }
    if (m.tipo === 'tutorial') { document.querySelectorAll('.onboarding-overlay').forEach((o) => o.classList.add('hidden')); document.getElementById('tutorial-choice-overlay')?.classList.remove('hidden'); }
    if (m.tipo === 'cerrarTodo') { document.querySelectorAll('.onboarding-overlay').forEach((o) => o.classList.add('hidden')); try { endTutorial(); } catch { /* */ } }
    if (m.tipo === 'ofertaEco') abrirOfertaEco('intro');
    if (m.tipo === 'ecoSalida') { try { abrirPreguntaSalida(); } catch { /* */ } }
    if (m.tipo === 'toast') { try { showToast(m.texto); } catch { /* */ } }
    if (m.tipo === 'bloquear') { try { document.getElementById('app').classList.add('hidden'); showError('vencido', new Date().toISOString()); } catch { /* */ } }
    if (m.tipo === 'pref') { pref = { ...pref, ...m.pref }; try { loadEcoHuesped(); } catch { /* */ } }
  });

  // ── PROPUESTA (todavía no está en la app real): ofrecer Eco al final del tutorial ──
  // Pantallas cortas con «Siguiente» y una X siempre visible; salir pregunta antes.
  // Mismas clases visuales de la app (onboarding-card, support-btn, section-label).
  const ESTILO = `#sim-oferta-card{position:relative;padding:22px 18px 18px;max-width:330px}
    #sim-oferta-card h2{font-size:17px;line-height:1.3;margin:4px 0 6px}
    #sim-oferta-card p,#sim-oferta-card li{font-size:13px;line-height:1.5;color:var(--text2)}
    #sim-oferta-card ul{padding-left:18px;margin:6px 0 4px;display:grid;gap:4px;text-align:left}
    #sim-oferta-card .support-btn{width:100%;justify-content:center;font-size:13.5px;padding:10px}
    #sim-oferta-card .sec{background:transparent!important;color:var(--text2)!important;box-shadow:none!important}
    .sim-x{position:absolute;right:10px;top:10px;width:30px;height:30px;border-radius:50%;border:0;background:rgba(0,0,0,.06);color:var(--text2);font-size:16px;cursor:pointer;line-height:30px}
    .sim-puntos{display:flex;gap:5px;justify-content:center;margin-bottom:6px}.sim-puntos i{width:6px;height:6px;border-radius:50%;background:#d0d4da}.sim-puntos i.on{background:#009D71}
    .sim-ico svg{width:30px;height:30px}.sim-ico{display:flex;justify-content:center;color:#009D71}
    .sim-opc{display:flex;gap:10px;align-items:flex-start;text-align:left;width:100%;padding:9px 10px;border-radius:12px;border:1px solid var(--border);background:var(--card);margin-bottom:6px;cursor:pointer;font:inherit;color:inherit}
    .sim-opc[aria-pressed="true"]{border-color:#009D71;box-shadow:inset 0 0 0 1px #009D71}.sim-opc b{display:block;font-size:13px}.sim-opc small{font-size:12px;color:var(--text2)}
    .sim-hora{display:flex;gap:6px;align-items:center;font-size:12.5px;margin:2px 0 8px;flex-wrap:wrap}.sim-hora input{font:inherit;padding:4px 6px;border-radius:8px;border:1px solid var(--border)}`;
  const ICONO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>';
  const ORDEN = ['intro', 'que', 'decide', 'avisos', 'cuando'];
  let etapaOferta = 'intro', etapaAntes = 'intro';
  function abrirOfertaEco(etapa) {
    let ov = document.getElementById('sim-oferta-eco');
    if (!ov) {
      const st = document.createElement('style'); st.textContent = ESTILO; document.head.appendChild(st);
      ov = document.createElement('div'); ov.id = 'sim-oferta-eco'; ov.className = 'onboarding-overlay';
      ov.innerHTML = '<div class="onboarding-card" id="sim-oferta-card"></div>'; document.body.appendChild(ov);
      ov.addEventListener('click', (e) => { const b = e.target.closest('[data-sim]'); if (b) accionOferta(b.dataset.sim); });
      ov.addEventListener('change', (e) => { if (e.target.dataset.h) pref[e.target.dataset.h] = e.target.value; });
    }
    ov.classList.remove('hidden'); pintarOferta(etapa);
  }
  function pintarOferta(etapa) {
    etapaOferta = etapa;
    const card = document.getElementById('sim-oferta-card');
    const b = (id, txt, sec) => `<button class="support-btn${sec ? ' sec' : ''}" data-sim="${id}">${tx(txt)}</button>`;
    const n = ORDEN.indexOf(etapa);
    const cab = `<button class="sim-x" data-sim="x" aria-label="${tx('Cerrar')}">✕</button>` + (n >= 0 ? `<div class="sim-puntos">${ORDEN.map((_, k) => `<i class="${k === n ? 'on' : ''}"></i>`).join('')}</div>` : '');
    const pie = (...bs) => `<div style="display:grid;gap:6px;margin-top:12px">${bs.join('')}</div>`;
    let html = '';
    if (etapa === 'intro') html = `<div class="sim-ico">${ICONO}</div><h2>${tx('Modo eco')}</h2><p>${tx('Cuando no estés, tu habitación ahorra energía y queda lista para tu vuelta.')}</p>${pie(b('sig', 'Siguiente'))}`;
    if (etapa === 'que') html = `<h2>${tx('¿Qué hace?')}</h2><ul><li>${tx('Apaga luces y TV si no hay nadie.')}</li><li>${tx('Deja el aire en espera, a 25 °C.')}</li><li>${tx('Al volver, todo sigue como lo dejaste.')}</li><li>${tx('Lo apagas cuando quieras en Ajustes.')}</li></ul>${pie(b('sig', 'Siguiente'))}`;
    if (etapa === 'decide') html = `<div class="sim-ico">${ICONO}</div><h2>${tx('¿Activar el modo eco?')}</h2>${pie(b('si', 'Sí, activar'), b('no', 'No, gracias', true))}`;
    if (etapa === 'avisos') html = `<h2>${tx('¿Te avisamos?')}</h2><p>${tx('Te avisamos cuando se active y cuánto vas a ahorrar.')}</p>${pie(b('avisos-si', 'Permitir avisos'), b('avisos-no', 'Ahora no', true))}`;
    if (etapa === 'cuando') {
      const c = pref.cuando || (nivel >= 1 ? 'auto' : 'horario');
      const opc = (id, t, d, ok) => `<button class="sim-opc" data-sim="cuando-${id}" aria-pressed="${c === id}" ${ok ? '' : 'disabled style="opacity:.5"'}><span><b>${tx(t)}</b><small>${tx(d)}</small></span></button>`;
      html = `<h2>${tx('¿Cuándo se activa?')}</h2>${opc('auto', 'Automático al salir', nivel >= 1 ? 'Puerta cerrada y nadie en la pieza.' : 'Necesita sensores de presencia (plan Full).', nivel >= 1)}${opc('horario', 'Por horario', 'Cuando sé que no voy a estar.', true)}`
        + (c === 'horario' ? `<div class="sim-hora">${tx('No estaré de')} <input type="time" data-h="desde" value="${pref.desde || '17:00'}"> ${tx('a')} <input type="time" data-h="hasta" value="${pref.hasta || '21:30'}"></div>` : '')
        + pie(b('guardar', 'Guardar'));
    }
    if (etapa === 'salir') html = `<h2>${tx('¿Salir sin activar el modo eco?')}</h2><p>${tx('Puedes activarlo después en Ajustes.')}</p>${pie(b('si', 'Activar modo eco'), b('no', 'Salir', true), b('volver', 'Volver', true))}`;
    card.innerHTML = cab + html;
  }
  function accionOferta(a) {
    const ov = document.getElementById('sim-oferta-eco');
    if (a === 'x') { etapaAntes = etapaOferta; return pintarOferta('salir'); }
    if (a === 'volver') return pintarOferta(etapaAntes);
    if (a === 'sig') return pintarOferta(ORDEN[ORDEN.indexOf(etapaOferta) + 1] || 'decide');
    if (a === 'no') { ov.classList.add('hidden'); pref = { ...pref, activo: false, respondio: true }; avisar({ tipo: 'eco', pref }); try { showToast(tx('Puedes activarlo cuando quieras en Ajustes.')); } catch { /* */ } return; }
    if (a === 'si') return pintarOferta('avisos');
    if (a === 'avisos-si' || a === 'avisos-no') { pref.avisos = a === 'avisos-si'; return pintarOferta('cuando'); }
    if (a === 'cuando-auto' || a === 'cuando-horario') { pref.cuando = a.slice(7); return pintarOferta('cuando'); }
    if (a === 'guardar') {
      pref = { desde: '17:00', hasta: '21:30', cuando: nivel >= 1 ? 'auto' : 'horario', ...pref, activo: true, respondio: true };
      ov.classList.add('hidden'); avisar({ tipo: 'eco', pref });
      try { loadEcoHuesped(); showToast(tx('Modo eco activado')); } catch { /* */ }
    }
  }
  window.NEXO_SIM.oferta = { abrir: abrirOfertaEco, accion: accionOferta, etapa: () => etapaOferta };
})();
