// Copia de nexo-room-app/frontend/app.js armada por herramientas/armar-app-huesped.js. No editar a mano.
'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// NexoSuite — Copyright (c) 2026. Todos los derechos reservados.
// Software propietario protegido por la Ley N° 17.336 (Chile). Ver ./LICENSE.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Nexo IoT — Guest Room App · Frontend
// Flujo: URL /room/:token → GET /api/room/:token → render controls → POST /api/room/:token/command
// ─────────────────────────────────────────────────────────────────────────────

// URL base del backend.
// En local (file:// o localhost:3000): usa '/api' (mismo origen).
// En GitHub Pages: pon la URL completa del backend en window.NEXO_API_URL dentro de index.html.
const API = ((window.NEXO_API_URL || '').replace(/\/$/, '') || '') + '/api';

// ── BLOQUEO DE ZOOM ───────────────────────────────────────────────────────────
// Safari iOS ignora user-scalable=no desde iOS 10, así que el pellizco hay que
// cancelarlo a mano con los eventos gesture* (propietarios de WebKit).
// Android/Chrome ya queda cubierto por touch-action en style.css.
// No se toca touchend: bloquear el doble-tap ahí también mataría los taps
// rápidos seguidos (ej. +/- de temperatura).
['gesturestart', 'gesturechange', 'gestureend'].forEach(evt => {
  document.addEventListener(evt, e => e.preventDefault(), { passive: false });
});
// Ctrl/⌘ + rueda: zoom del navegador en escritorio y trackpad.
document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });

// ── ICONOS SVG ───────────────────────────────────────────────────────────────
// Sustituyen a los emoji: se ven igual en todos los sistemas, heredan el color
// del texto (currentColor) y escalan sin verse borrosos.
const ICON_BULB       = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.05V17h6v-2.25c0-.85.4-1.55 1-2.05A7 7 0 0 0 12 2z"/></svg>';
const ICON_WINDOW     = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="12" y1="4" x2="12" y2="20"/></svg>';
const ICON_PLUG       = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8z"/></svg>';
// Ícono de encendido en SVG: el carácter ⏻ (U+23FB) no está en la fuente de
// varios Android y se dibuja como un cuadrito — visto en terreno en la tarjeta
// del aire. Regla 5: íconos SVG inline, nunca caracteres que dependan del OS.
const ICON_POWER = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>';

const ICON_SNOWFLAKE  = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/><line x1="19.1" y1="4.9" x2="4.9" y2="19.1"/><line x1="2" y1="12" x2="22" y2="12"/></svg>';
const ICON_ALERT      = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
const ICON_TV         = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 3l4 4 4-4"/></svg>';
const ICON_DROPLET    = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69s-6 7.2-6 11.31a6 6 0 0 0 12 0c0-4.11-6-11.31-6-11.31z"/></svg>';
const ICON_TOILET     = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 12h13a1 1 0 0 1 1 1 7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7v-5a2 2 0 0 1 2-2"/><path d="M7 12V4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3"/></svg>';
const ICON_FLAME      = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
const ICON_SETTINGS   = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
const ICON_POT        = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M8 12V8a4 4 0 0 1 8 0v4"/></svg>';
const ICON_SPARKLES   = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>';
const ICON_BELL       = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
const ICON_STAR       = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
const ICON_MOON       = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const ICON_FILM       = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>';
const ICON_SUN        = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
const ICON_BASKET     = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16l-1.5 9a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7z"/><path d="M4 10 8 4h8l4 6"/><path d="M9 14v3"/><path d="M15 14v3"/></svg>';
const ICON_UTENSILS   = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2s2-.9 2-2V2"/><path d="M5 11v11"/><path d="M19 2c-1.5 0-3 1.5-3 4v6c0 1.1.9 2 2 2h1"/><path d="M19 2v20"/></svg>';
const ICON_WRENCH     = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
const ICON_MESSAGE    = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
const ICON_CLOCK      = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
const ICON_SHIELD     = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
const ICON_DOOR       = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"/><path d="M4 21h15"/><path d="M15 12v.01"/></svg>';
const ICON_ALERT_SM   = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
const ICON_HELP       = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
const ICON_SEARCH     = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
const ICON_EDIT       = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>';
const ICON_TRASH      = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const ICON_UNDO       = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>';
const ICON_LOCK       = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const ICON_WIFI_OFF   = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>';
const ICON_PHONE      = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
const ICON_MAPPIN     = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const ICON_INFO       = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
const ICON_GLOBE      = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
const ICON_ZAP        = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
const ICON_STAR_OUTLINE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
const ICON_X          = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
const ICON_CALENDAR   = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
const ICON_MIC        = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
// Botones de los controles IR (silencio y cambio de modo del aire)
const ICON_MUTE       = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
const ICON_REPEAT     = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';

// ── SEGURIDAD DE ACCESO POR QR ────────────────────────────────────────────────
// Identidad ESTABLE de este dispositivo (persiste en el navegador). El backend
// la usa para registrar quién abre el link, avisar al titular y poder revocar.
const NEXO_DID = (() => {
  try {
    let d = localStorage.getItem('nexo_did');
    if (!d) { d = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)); localStorage.setItem('nexo_did', d); }
    return d;
  } catch { return 'nodid'; }
})();
// Inyecta el device-id en TODAS las llamadas a nuestra API, sin tocar cada fetch.
(() => {
  const orig = window.fetch.bind(window);
  window.fetch = (url, opts = {}) => {
    try {
      const u = typeof url === 'string' ? url : (url && url.url);
      if (u && u.includes('/api/')) opts = { ...opts, headers: { ...(opts.headers || {}), 'X-Device-Id': NEXO_DID } };
    } catch { /* noop */ }
    return orig(url, opts);
  };
})();

// ── DATOS MOCK para modo estático (sin servidor) ──────────────────────────────
// Se usa cuando el archivo se abre directo desde el disco (file://)
const STATIC_DEMO = {
  roomId:    '101',
  roomName:  'Habitación 101',
  hotelName: 'Hotel Demo Plaza',
  guestName: 'Demo Huésped',
  checkin:   new Date(Date.now() - 1 * 86400000).toISOString(), // ayer
  checkout:  new Date(Date.now() + 2 * 86400000).toISOString(), // en 2 días
  lang:          'es',
  accessibility: 'none',
  demoMode:  true,
  plan:      'max_comfort',
  devices: {
    led_cama: {
      label: 'LED Bajo Cama', type: 'light_rgb', available: false,
      state: null
    },
    luz_techo: {
      label: 'Luz Techo', type: 'light_rgb', available: true,
      state: { on: true, intensity: 80, mode: 'white', colorTemp: 70, hue: 0, saturation: 1000 }
    },
    luz_velador1: {
      label: 'Luz Velador 1', type: 'light_rgb', available: true,
      state: { on: false, intensity: 70, mode: 'white', colorTemp: 30, hue: 0, saturation: 1000 }
    },
    luz_velador2: {
      label: 'Luz Velador 2', type: 'light_rgb', available: true,
      state: { on: false, intensity: 50, mode: 'white', colorTemp: 50, hue: 270, saturation: 1000 }
    },
    cortina: {
      label: 'Cortina', type: 'curtain', available: true,
      state: { control: 'stop', position: 45 }
    },
    enchufe: {
      label: 'Enchufe inteligente', type: 'switch_3ch', available: true,
      channels: ['🔥 Estufa', '🌸 Aromatizador'],
      state: { ch1: false, ch2: false }
    },
  },
};

// ── ESTADO GLOBAL ─────────────────────────────────────────────────────────────
const app = {
  token:   null,
  config:  {},   // { key: { type, label, channels, available } }
  devices: {},   // { key: estado normalizado del dispositivo }
  plan:    'base', // 'base' | 'premium' | 'max_comfort'
  lang:    'es',   // idioma del huésped: 'es' | 'en' | 'pt'
  a11y:    'none', // accesibilidad: 'none' | 'vision' | 'hearing'
  theme:   'auto', // tema: 'auto' | 'light' | 'dark'
  dnd:     false,  // No molestar
  alarmSensors: {}, // { deviceKey: bool } — alarma armada por sensor (puerta/ventana)
  favorites: [],  // claves de dispositivos marcados como favoritos (accesos directos)
  scenes:  {},    // escenas personalizadas/sobrescritas por el huésped (desde la API)
  data:    null,   // respuesta completa de la API (para re-render al cambiar idioma)
  _timers: {},   // debounce timers para sliders
  _wheelOpen: {}, // { key: bool } — selector de color RGB abierto/cerrado
  _placeholder: {}, // estado local de funciones del plan (no conectadas a dispositivos reales)
  _manual: {},   // { key: bool } — modo manual (control físico) para luces/enchufes
  _unlocked: {}, // { key: bool } — motor de cortina desbloqueado para mover a mano
  _curtainAnim: {}, // { key: intervalId } — animación en curso de la barra de posición
};

// ── IDIOMAS (i18n) ────────────────────────────────────────────────────────────
// LOCALES, PLAN_TIERS y planLevel vienen de shared.js
const LANG_NAMES = { es: 'Español', en: 'English', pt: 'Português' };

const I18N = {
  es: {
    loading: 'Cargando tu habitación…',
    errVencidoTitle: 'Este enlace ya venció',
    errVencidoSubFecha: 'Venció el {fecha}. Si sigues alojado, pide uno nuevo en recepción.',
    errNoEmpezoTitle: 'Este enlace todavía no está activo',
    errNoEmpezoSubFecha: 'Se activa el {fecha}, el día de tu llegada.',
    errInvalidTitle: 'Enlace inválido o expirado',
    errInvalidSub: 'Este QR ya no es válido. Solicita un nuevo acceso en recepción.',
    errServerTitle: 'Sin conexión con el servidor',
    errServerSub: 'No se pudo conectar con el sistema. Verifica tu conexión WiFi o comunícate con recepción.',
    navRoom: 'Habitación',
    navSecurity: 'Seguridad',
    navScenes: 'Escenas',
    navClimate: 'Clima',
    navSettings: 'Ajustes',
    navSupport: 'Soporte',
    demoBanner: 'Modo demostración — los cambios no se aplican a dispositivos reales',
    checkoutBtn: 'Check-out',
    hello: 'Hola, {name}',
    welcome: 'Bienvenido',
    checkoutLine: 'Check-out: {date} a las {time}',
    sectionControls: 'Controles inteligentes',
    sectionSecurity: 'Seguridad',
    accesosTitle: 'Accesos con tu link',
    accesosDesc: 'Dispositivos que abrieron este link. Si no reconoces uno, revócalo — perderá el acceso al instante.',
    accesosOwner: 'este equipo (titular)',
    accesosThis: 'este equipo',
    accesosSince: 'desde',
    accesosRevoke: 'Revocar',
    accesosRestore: 'Restaurar',
    accesosRevokeConfirm: '¿Revocar el acceso de este dispositivo? Podrás restaurarlo después si te equivocaste.',
    accesosRevokedOk: 'Acceso revocado',
    accesosRestoredOk: 'Acceso restaurado',
    accesosApprovalMode: 'Requerir mi aprobación para dispositivos nuevos',
    accesosPending: 'esperando aprobación',
    accesosApprove: 'Aprobar',
    accesosReject: 'Rechazar',
    accesosApprovedOk: 'Dispositivo aprobado',
    accesosRejectedOk: 'Dispositivo rechazado',
    accesosModeOn: 'Aprobación activada',
    accesosModeOff: 'Aprobación desactivada',
    errRevokedTitle: 'Acceso revocado',
    errRevokedSub: 'El titular de la habitación revocó el acceso de este dispositivo.',
    errPendingTitle: 'Esperando aprobación',
    errPendingSub: 'El titular de la habitación debe aprobar este dispositivo. Se abrirá solo cuando lo apruebe.',
    sensorOpen: 'Abierta',
    sensorClosed: 'Cerrada',
    alarmSensorTitle: 'Avisarme si se abre',
    alarmSensorNote: 'Si tienes la app abierta, sonará una alerta apenas se abra este sensor',
    noSecuritySensorsMsg: 'Esta habitación no tiene sensores de puerta o ventana configurados.',
    sectionScenes: 'Escenas',
    sectionSettings: 'Ajustes',
    sectionSupport: 'Soporte',
    sectionServices: 'Servicios',
    dndTitle: 'No molestar',
    dndDesc: 'El personal de limpieza no ingresará a tu habitación mientras esté activo',
    doorAlarmTriggeredTitle: '¡Se abrió: {device}!',
    doorAlarmTriggeredDesc: 'Activaste el aviso para este sensor durante tu estadía.',
    doorAlarmDismissBtn: 'Entendido',
    requestTowels: 'Pedir toallas / amenities',
    requestRoomService: 'Pedir room service',
    requestCleaning: 'Pedir limpieza',
    requestLateCheckout: 'Solicitar late checkout',
    requestMaintenance: 'Reportar un problema',
    requestOther: 'Otra solicitud',
    requestNotePrompt: 'Describe brevemente tu solicitud:',
    reportAppProblemBtn: 'Reportar un problema',
    reportAppProblemTitle: 'Reportar un problema',
    reportAppProblemDesc: 'Cuéntanos qué está fallando — le llega tanto al hotel como al equipo que mantiene esta app.',
    reportAppProblemPlaceholder: 'Describe el problema…',
    reportAppProblemSend: 'Enviar',
    reportAppProblemCancel: 'Cancelar',
    sectionDirectorio: 'Qué ofrece el hotel',
    directorioEmpty: 'Sin servicios publicados todavía.',
    sectionAgenda: 'Reservar con hora',
    navHistorial: 'Historial',
    sectionHistorial: 'Historial de tu habitación',
    actEmpty: 'Todavía no hay actividad para mostrar.',
    ecoTitulo: 'Modo ahorro de energía',
    acModoLbl: 'Modo',
    acFrio: '🧊 Frío',
    acCalor: '🔥 Calor',
    acAuto: '🔄 Auto',
    acPrimeroModo: 'Primero elegí Frío, Calor o Auto',
    acVentLbl: 'Ventilador',
    acVentBajo: 'Bajo',
    acVentMedio: 'Medio',
    acVentAlto: 'Alto',
    acPantalla: '🌙 Apagar pantalla',
    acPantallaOn: '💡 Encender pantalla',
    acElegiModo: 'Elegí frío o calor para ver las temperaturas.',
    acElegiModoArriba: 'Tocá Frío o Calor (arriba, en Modo) para ver las temperaturas.',
    acAmbiente: 'Ambiente',
    acQuiero: 'Quiero la pieza a',
    actTitulo: 'Actividad de tu habitación',
    actIntro: 'Todo lo que pasó desde tu llegada.',
    actPorHotel: 'lo hizo el hotel',
    acTempEquipo: 'Temperatura del aire',
    acLlegando: 'Ajustando el aire para llegar…',
    acLlego: '✓ Llegó a {n}° en {min} min',
    acObjetivoOk: '✓ Buscando {n}° en la habitación',
    acEncender: 'Encender',
    acApagar: 'Apagar',
    irOnOff: 'On/Off',
    acSinCodigo: 'Falta programar ese botón. Avisá a recepción.',
    ecoIntro: 'Activá el ahorro de energía de tu habitación. Podés apagarlo cuando quieras, y elegir abajo qué funciones.',
    ecoSalidaTitulo: 'Modo eco activado',
    ecoSalidaIntro: 'Activamos el ahorro porque no detectamos a nadie en la habitación. Se prepara sola para tu vuelta.',
    ecoSali: 'Entendido, estoy afuera',
    ecoVuelvo: 'Vuelvo pronto',
    ecoSigoAca: 'No, seguí en confort',
    ecoMantener: 'Mantener ahorro',
    ecoPausar: 'Pausar (vuelve solo)',
    ecoQuitar: 'Quitar modo eco',
    ecoBienvTitulo: 'Modo eco activado',
    ecoBienvIntro: 'Ahorramos energía cuando no hay nadie en la habitación, y la dejamos lista para tu vuelta.',
    ecoBienvOk: 'Entendido',
    ecoBienvMas: 'Más info y opciones',
    ecoAhorroTitulo: 'Tu ahorro hasta ahora',
    ecoAhorroVacio: 'Todavía sin ahorro registrado. Aparece cuando salís y el sistema apaga lo que no estás usando.',
    ecoAhorroEstimadoNota: 'Estimación de la energía no gastada mientras tu habitación estuvo vacía. No es una medición.',
    ecoVuelvoEn: '¿En cuántos minutos volvés?',
    ecoOk: '✓ Listo, gracias.',
    ecoError: 'No se pudo guardar. Probá de nuevo.',
    cerrar: 'Cerrar',
    agendaCancelar: 'Cancelar',
    agendaCancelarConf: '¿Cancelar esta reserva?',
    agendaFecha: '¿Para qué día? (AAAA-MM-DD)',
    agendaPersonas: '¿Cuántas personas?',
    agendaOk: '✓ Reservado. Lo ves en tu lista.',
    agendaError: 'No se pudo reservar. Probá de nuevo o escribinos.',
    noDevicesMsg: 'Esta habitación no tiene dispositivos inteligentes. Usa Servicios para pedir lo que necesites a recepción.',
    noDevicesBtn: 'Ir a Servicios',
    toastRequestSent: 'Solicitud enviada a recepción',
    toastDndOn: 'No molestar activado',
    toastDndOff: 'No molestar desactivado',
    toastSensorAlarmOn: 'Aviso de sensor activado',
    toastSensorAlarmOff: 'Aviso de sensor desactivado',
    toastAcAutoOff: 'Ventana abierta detectada: el aire acondicionado se apagó automáticamente',
    onbTitle: 'Bienvenido a {hotel}',
    onbGreet: 'Estimado/a {name}, es un placer recibirle. Esperamos que su estadía sea cómoda y memorable. Desde esta app puede controlar su habitación con total comodidad.',
    onbScenes: 'Activa tus aparatos inteligentes desde aquí',
    onbSettings: 'Cambia idioma y accesibilidad desde Ajustes',
    onbSupport: 'Pide servicios o ayuda desde Soporte',
    // Variantes para habitaciones SIN domótica (plan PMS): mencionar aparatos
    // inteligentes que no existen confunde al huésped desde el primer segundo.
    onbGreetPms: 'Estimado/a {name}, es un placer recibirle. Esperamos que su estadía sea cómoda y memorable. Desde esta app puede pedir servicios y hablar con recepción cuando lo necesite.',
    onbServiciosPms: 'Pide lo que necesites a recepción desde Servicios',
    onbChatPms: 'Escríbenos por Chat: te respondemos desde recepción',
    navChat: 'Chat', sectionChat: 'Chat con recepción', navServicios: 'Servicios',
    chatPlaceholder: 'Escribe tu mensaje…',
    chatVacio: 'Escríbenos lo que necesites. Recepción te responde por aquí.',
    chatEnviar: 'Enviar', chatTu: 'Tú', chatHotel: 'Recepción', chatAsistente: 'Asistente',
    chatHablar: 'O dímelo por voz',
    instalarApp: 'Instalar la app en mi teléfono',
    instalarIOS: 'Para instalarla: toca el botón Compartir (⬆️) abajo en Safari y elige "Agregar a pantalla de inicio".',
    activarAvisos: 'Avisarme cuando recepción responda',
    avisosActivos: 'Avisos activados',
    avisosListos: 'Listo: te avisaremos aunque cierres la app',
    avisosIOS: 'En iPhone los avisos requieren instalar la app primero: toca Compartir (⬆️) → "Agregar a pantalla de inicio", ábrela desde el ícono y vuelve a activar los avisos.',
    onbGotIt: 'Comenzar',
    tutChoiceTitle: '¿Sabes usar los controles smart?',
    tutChoiceDesc: 'Podemos guiarte paso a paso para encender una luz y mover la cortina.',
    tutStartBtn: 'Iniciar tutorial',
    tutSkipBtn: 'Sé usar aparatos smart',
    tutExit: 'Salir',
    tutPrev: 'Anterior',
    tutNext: 'Siguiente',
    tutFinish: 'Finalizar',
    tutStepCount: 'Paso {n} de {total}',
    tutLightTitle: 'Encender una luz',
    tutLightDesc: 'Toca este interruptor para encender o apagar la luz. Cuando está encendida, puedes ajustar su intensidad y color.',
    tutCurtainOpenTitle: 'Abrir la cortina',
    tutCurtainOpenDesc: 'Toca este botón para abrir la cortina automáticamente.',
    tutCurtainStopTitle: 'Detener la cortina',
    tutCurtainStopDesc: 'Toca este botón para detener la cortina donde esté, sin que termine de abrirse o cerrarse.',
    tutCurtainCloseTitle: 'Cerrar la cortina',
    tutCurtainCloseDesc: 'Toca este botón para cerrar la cortina. También puedes usar el control deslizante para dejarla a media altura.',
    toastCurtainMaxOpen: 'Abierta al máximo',
    toastCurtainMaxClosed: 'Cerrada al mínimo',
    connOnline: 'En línea',
    connOffline: 'Sin conexión',
    toastOnline: 'Conexión restablecida',
    toastOffline: 'Sin conexión a internet',
    sectionFavorites: 'Accesos rápidos',
    favToggle: 'Marcar como favorito',
    toastFavMax: 'Máximo 3 accesos rápidos. Quita uno para agregar otro.',
    cdLeft: 'Faltan {t}',
    cdOverdue: 'Vencido hace {t}',
    cdNow: 'Venció ahora',
    sceneNightTitle: 'Noche',
    sceneNightDesc: 'Apaga las luces principales y enciende el LED bajo cama',
    sceneMorningTitle: 'Mañana',
    sceneMorningDesc: 'Abre la cortina y enciende las luces en tono cálido',
    sceneRelaxTitle: 'Relax',
    sceneRelaxDesc: 'Ambiente con luces de color suave y cortina a media altura',
    sceneOffTitle: 'Apagar todo',
    sceneOffDesc: 'Apaga todas las luces y enchufes de la habitación',
    sceneCustomDesc: 'Escena personalizada',
    sceneNewBtn: 'Crear nueva escena',
    sceneNewTitle: 'Nueva escena',
    sceneNewDesc: 'Se guardará la configuración actual de tu habitación con el nombre e ícono que elijas.',
    sceneNamePlaceholder: 'Nombre de la escena',
    sceneSaveBtn: 'Guardar',
    sceneCancelBtn: 'Cancelar',
    sceneEditTitle: 'Guardar estado actual',
    sceneDeleteTitle: 'Eliminar escena',
    sceneDeleteConfirm: '¿Eliminar la escena "{name}"?',
    sceneResetTitle: 'Restaurar escena original',
    sceneResetConfirm: '¿Restaurar la escena "{name}" a su configuración original?',
    scenesHint: 'Toca una escena para activarla. Puedes editarla para guardar la configuración actual de tu habitación, o crear una nueva.',
    scenesConfigLabel: 'Ajusta los controles',
    scenesConfigHintCreate: 'Enciende, apaga o ajusta lo que quieras guardar en la escena nueva. Cuando esté como quieres, toca "Guardar".',
    scenesConfigHintEdit: 'Ajusta los controles como quieras que queden en "{name}" y luego guarda los cambios.',
    scenesConfigSaveCreate: 'Guardar esta configuración',
    scenesConfigSaveEdit: 'Guardar cambios en "{name}"',
    scenesConfigCancel: 'Cancelar',
    sceneHelpTitle: '¿Cómo funcionan las escenas?',
    sceneHelpText: 'Una escena aplica varios ajustes a la vez con un solo toque (por ejemplo, apagar todas las luces y cerrar la cortina para dormir). Tócala para activarla. Puedes editarla para ajustar lo que guarda, programarla a una hora o crear una nueva.',
    reportSceneProblemPrompt: 'Describe el problema con la escena "{name}":',
    reportSceneProblemNote: 'Problema con la escena "{name}": {note}',
    toastSceneSaved: 'Escena guardada',
    toastSceneSaveFail: 'No se pudo guardar la escena',
    toastSceneDeleted: 'Escena eliminada',
    toastSceneDeleteFail: 'No se pudo eliminar la escena',
    toastSceneNameRequired: 'Escribe un nombre para la escena',
    toastSceneMax: 'Has alcanzado el máximo de escenas personalizadas',
    setHotel: 'Hotel',
    setRoom: 'Habitación',
    setGuest: 'Huésped',
    setCheckin: 'Check-in',
    setCheckout: 'Check-out',
    setMode: 'Modo',
    modeDemo: 'Demostración',
    modeLive: 'En vivo',
    language: 'Idioma',
    accessibility: 'Accesibilidad',
    a11yHearing: 'Auditiva',
    theme: 'Tema',
    themeAuto: 'Automático',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    a11yVisionNote: 'Texto y controles más grandes, con mayor contraste, para personas con baja visión. El botón de micrófono (esquina inferior derecha) crece y se vuelve la forma principal de controlar la habitación por voz.',
    a11yHearingNote: 'Avisos visuales destacados y de mayor duración en lugar de señales sonoras.',
    supportQuestion: '¿Necesitas ayuda con tu habitación o tienes alguna duda?',
    callReception: 'Escribir a recepción (WhatsApp)',
    callReceptionTel: 'Prefiero llamar por teléfono',
    callReceptionWaMsg: 'Hola, soy huésped de la habitación {room} en {hotel} y necesito ayuda.',
    callReceptionMsg: 'Para contactar a recepción, marca el interno 0 desde el teléfono de tu habitación o acércate a recepción.',
    callReceptionCitofono: 'Usar el citófono',
    callReceptionCitofonoMsg: 'Usa el citófono de tu habitación para comunicarte con recepción.',
    callReceptionBajar: 'Bajar a recepción',
    callReceptionBajarMsg: 'Acércate a recepción, están atentos para ayudarte.',
    callReceptionOtra: 'Contactar a recepción',
    checkoutMsg: 'Para el check-out, por favor dirígete a recepción o llama al interno del hotel.',
    manualNote: 'Control manual activado — usa el interruptor físico de la habitación. Desactívalo para volver a controlarlo desde la app.',
    unlockNoteOn: 'Motor desbloqueado — mueve la cortina con la mano. Bloquéalo para volver a controlarla desde la app.',
    toastManualOn: 'Modo manual activado — luz fija en cálido, ahora se enciende/apaga con el interruptor físico',
    toastManualOff: 'Modo manual desactivado — control desde la app restaurado',
    toastUnlockOn: 'Motor desbloqueado — mueve la cortina con la mano',
    toastUnlockOff: 'Motor bloqueado — control desde la app restaurado',
    position: 'Posición',
    color: 'Color', colorIntensity: 'Intensidad del color', scenes: 'Escenas', audioTitle: 'Equipo de sonido',
    vozBtn: 'Control por voz (mantén presionado)', vozEscuchando: 'Escuchando…',
    vozSinMicrofono: 'No se pudo usar el micrófono. Revisa el permiso en el navegador.',
    vozNoEntendi: 'No te entendí. Prueba: "abre la cortina" o "sube el volumen"',
    vozActivando: 'Activando',
    curtainOpenBtn: '▲ Abrir',
    curtainStopBtn: '⏹ Parar',
    curtainCloseBtn: '▼ Cerrar',
    offlineDevice: 'Dispositivo no disponible',
    toastCmdFail: 'No se pudo ejecutar. Verifica la conexión.',
    toastScene: 'Escena aplicada',
    toastSceneFail: 'Algunos comandos fallaron',
    toastPreview: 'Vista previa — función no conectada a un dispositivo real',
    reportProblemBtn: 'Reportar un problema con este dispositivo',
    reportTitle: 'Reportar un problema',
    reportIntroDesc: 'Vas a reportar un problema con: {device}. Recepción recibirá tu reporte de inmediato.',
    reportBackBtn: 'Atrás',
    reportContinueBtn: 'Continuar',
    reportSendBtn: 'Enviar',
    reportOptionsTitle: '¿Cuál es el problema?',
    reportNoOptionToast: 'Elige una opción antes de enviar',
    reportOtherTitle: 'Cuéntanos qué pasa',
    reportPickDevice: '¿Qué dispositivo tiene el problema?',
    cleaningModalTitle: 'Solicitar limpieza',
    cleaningModalDesc: '¿Por cuánto tiempo estarás fuera de la habitación? Así el personal sabe cuándo puede entrar.',
    cleaningTimeNow: 'Estoy saliendo ahora',
    cleaningTime30m: 'Unos 30 minutos',
    cleaningTime1h: 'Alrededor de 1 hora',
    cleaningTime2h: 'Alrededor de 2 horas',
    cleaningTime3h: 'Más de 3 horas',
    cleaningTimeSkip: 'Enviar sin indicar',
    reportOtherPlaceholder: 'Describe el problema (opcional)',
    reportOptOtra: 'Otra',
    reportOptNoEnciende: 'No enciende',
    reportOptNoApaga: 'No se apaga',
    reportOptNoIntensidad: 'No cambia la intensidad',
    reportOptNoTemperatura: 'No cambia la temperatura de color',
    reportOptNoColores: 'No cambia de colores',
    reportOptNoAbre: 'No abre',
    reportOptNoCierra: 'No cierra',
    reportOptNoPara: 'No se detiene (Parar no funciona)',
    reportOptSeMueveSola: 'Se mueve sola',
    reportOptCanalNoResponde: 'Un canal no responde',
    reportOptNingunCanalResponde: 'Ningún canal responde',
    reportOptNoTemperaturaAC: 'No cambia la temperatura',
    reportOptNoEnfriaCalienta: 'No enfría ni calienta aunque esté encendido',
    themeActivateDark: 'Activar modo oscuro',
    themeDeactivateDark: 'Desactivar modo oscuro',
    scheduleBtn: 'Programar',
    helpBtn: 'Cómo se usa',
    enlargeBtn: 'Agrandar',
    helpCloseBtn: 'Volver',
    helpTextLight: 'Toca el interruptor para encender o apagar la luz. Cuando está encendida, desliza la barra para ajustar la intensidad y elige cálido, neutro o frío para el tono.',
    helpTextLED: 'Toca el interruptor para encender o apagar. Ajusta la intensidad con la barra, o toca "Color" para elegir un color desde la rueda.',
    helpTextCurtain: 'Usa ▲ para abrir, ⏹ para detener en cualquier punto, y ▼ para cerrar. La barra vertical muestra qué tan abierta está.',
    helpTextSwitch: 'Toca el interruptor para encender o apagar.',
    helpTextAC: 'Toca el interruptor para encender o apagar el aire acondicionado. Usa + y − para ajustar la temperatura.',
    helpTextGeneric: 'Toca el interruptor para encender o apagar este control.',
    helpTextTV: 'Toca el interruptor para encender o apagar la TV. Ajusta el volumen con la barra y elige la fuente (cable, streaming o HDMI).',
    helpTextBathroom: 'Toca el interruptor para encender o apagar la luz del baño. Con "Encendido automático" activado, se enciende sola al detectar presencia.',
    helpTextBidet: 'Toca el interruptor para precalentar el asiento del baño japonés antes de levantarte. El resto de las funciones se controla desde el panel del baño.',
    helpTextRug: 'Toca el interruptor para encender la alfombra calefaccionable y elige el nivel de calor.',
    helpTextClimateAuto: 'Si está activado, el aire acondicionado se apaga automáticamente al detectar que la ventana se abrió, para ahorrar energía.',
    heatedSeatOn: 'Asiento calefaccionado — encendido',
    heatedSeatOff: 'Asiento calefaccionado — apagado',
    bidetPanelNote: 'El resto de las funciones (lavado, secado, etc.) se controla desde el panel del baño.',
    scheduleTitle: 'Programar',
    scheduleDesc: 'Elige cuándo se debe encender o apagar: {device}.',
    scheduleDescScene: 'Elige cuándo activar esta escena: {device}.',
    scheduleTurnOn: 'Encender',
    scheduleTurnOff: 'Apagar',
    scheduleSendBtn: 'Programar',
    scheduleFrom: 'Desde',
    scheduleUntil: 'Hasta',
    scheduleAutoOff: 'Apagar/cerrar automáticamente',
    scheduleOnce: 'Solo una vez',
    scheduleWeekly: 'Días de la semana',
    scheduleNoTimeError: 'Elige una hora de inicio.',
    scheduleNoEndTimeError: 'Elige la hora hasta la que debe estar así.',
    scheduleSameTimeError: 'La hora de fin debe ser distinta a la de inicio.',
    scheduleNoDateError: 'Elige una fecha.',
    scheduleNoDaysError: 'Elige al menos un día de la semana.',
    scheduleDay_L: 'L', scheduleDay_M: 'M', scheduleDay_M2: 'M', scheduleDay_J: 'J',
    scheduleDay_V: 'V', scheduleDay_S: 'S', scheduleDay_D: 'D',
    scheduleDayShortL: 'Lun', scheduleDayShortM: 'Mar', scheduleDayShortM2: 'Mié', scheduleDayShortJ: 'Jue',
    scheduleDayShortV: 'Vie', scheduleDayShortS: 'Sáb', scheduleDayShortD: 'Dom',
    scheduleNonePending: 'Sin programaciones pendientes.',
    scheduleCancelBtn: 'Cancelar programación',
    toastScheduleSaved: 'Programado correctamente',
    toastScheduleCancelled: 'Programación cancelada',
    bathAutoNote: ' · Programada para encenderse automáticamente si hay alguien dentro',
    bathManualNote: 'Control manual activado — luz fija en cálido, ahora se enciende/apaga con el interruptor físico del baño.',
    acSection: 'Aire Acondicionado',
    autoSection: 'Automatizaciones',
    doorOpen: 'Puerta abierta',
  },
  en: {
    loading: 'Loading your room…',
    errVencidoTitle: 'This link has expired',
    errVencidoSubFecha: 'It expired on {fecha}. If you are still staying with us, please request a new one at the front desk.',
    errNoEmpezoTitle: 'This link is not active yet',
    errNoEmpezoSubFecha: 'It becomes active on {fecha}, your arrival day.',
    errInvalidTitle: 'Invalid or expired link',
    errInvalidSub: 'This QR code is no longer valid. Please request a new access at the front desk.',
    errServerTitle: 'No connection to the server',
    errServerSub: 'We could not reach the system. Check your WiFi connection or contact the front desk.',
    navRoom: 'Room',
    navSecurity: 'Security',
    navScenes: 'Scenes',
    navClimate: 'Climate',
    navSettings: 'Settings',
    navSupport: 'Support',
    demoBanner: 'Demo mode — changes are not applied to real devices',
    checkoutBtn: 'Check-out',
    hello: 'Hello, {name}',
    welcome: 'Welcome',
    checkoutLine: 'Check-out: {date} at {time}',
    sectionControls: 'Smart controls',
    sectionSecurity: 'Security',
    accesosTitle: 'Access with your link',
    accesosDesc: "Devices that opened this link. If you don't recognize one, revoke it — it loses access instantly.",
    accesosOwner: 'this device (owner)',
    accesosThis: 'this device',
    accesosSince: 'since',
    accesosRevoke: 'Revoke',
    accesosRestore: 'Restore',
    accesosRevokeConfirm: 'Revoke this device’s access? You can restore it later if it was a mistake.',
    accesosRevokedOk: 'Access revoked',
    accesosRestoredOk: 'Access restored',
    accesosApprovalMode: 'Require my approval for new devices',
    accesosPending: 'awaiting approval',
    accesosApprove: 'Approve',
    accesosReject: 'Reject',
    accesosApprovedOk: 'Device approved',
    accesosRejectedOk: 'Device rejected',
    accesosModeOn: 'Approval enabled',
    accesosModeOff: 'Approval disabled',
    errRevokedTitle: 'Access revoked',
    errRevokedSub: 'The room owner revoked this device’s access.',
    errPendingTitle: 'Waiting for approval',
    errPendingSub: 'The room owner must approve this device. It will open automatically once approved.',
    sensorOpen: 'Open',
    sensorClosed: 'Closed',
    alarmSensorTitle: 'Alert me if this opens',
    alarmSensorNote: 'If you have the app open, an alert will sound as soon as this sensor opens',
    noSecuritySensorsMsg: 'This room has no door or window sensors configured.',
    sectionScenes: 'Scenes',
    sectionSettings: 'Settings',
    sectionSupport: 'Support',
    sectionServices: 'Services',
    dndTitle: 'Do Not Disturb',
    dndDesc: 'Housekeeping will not enter your room while this is active',
    doorAlarmTriggeredTitle: '{device} opened!',
    doorAlarmTriggeredDesc: 'You turned on the alert for this sensor during this stay.',
    doorAlarmDismissBtn: 'Got it',
    requestTowels: 'Request towels / amenities',
    requestRoomService: 'Request room service',
    requestCleaning: 'Request housekeeping',
    requestLateCheckout: 'Request late checkout',
    requestMaintenance: 'Report an issue',
    requestOther: 'Other request',
    requestNotePrompt: 'Briefly describe your request:',
    reportAppProblemBtn: 'Report a problem',
    reportAppProblemTitle: 'Report a problem',
    reportAppProblemDesc: "Tell us what's wrong — it reaches both the hotel and the team that maintains this app.",
    reportAppProblemPlaceholder: 'Describe the problem…',
    reportAppProblemSend: 'Send',
    reportAppProblemCancel: 'Cancel',
    sectionDirectorio: 'What the hotel offers',
    directorioEmpty: 'No services published yet.',
    sectionAgenda: 'Book a time',
    navHistorial: 'History',
    sectionHistorial: 'Your room history',
    actEmpty: 'No activity to show yet.',
    ecoTitulo: 'Energy saver mode',
    acModoLbl: 'Mode',
    acFrio: '🧊 Cool',
    acCalor: '🔥 Heat',
    acAuto: '🔄 Auto',
    acPrimeroModo: 'First choose Cool, Heat or Auto',
    acVentLbl: 'Fan',
    acVentBajo: 'Low',
    acVentMedio: 'Medium',
    acVentAlto: 'High',
    acPantalla: '🌙 Turn display off',
    acPantallaOn: '💡 Turn display on',
    acElegiModo: 'Choose cool or heat to see temperatures.',
    acElegiModoArriba: 'Tap Cool or Heat (above, under Mode) to see temperatures.',
    acAmbiente: 'Room temp',
    acQuiero: 'I want the room at',
    actTitulo: 'Your room activity',
    actIntro: 'Everything since you arrived.',
    actPorHotel: 'done by the hotel',
    acTempEquipo: 'AC temperature',
    acLlegando: 'Adjusting the AC to get there…',
    acLlego: '✓ Reached {n}° in {min} min',
    acObjetivoOk: '✓ Aiming for {n}° in the room',
    acEncender: 'Turn on',
    acApagar: 'Turn off',
    irOnOff: 'On/Off',
    acSinCodigo: 'That button is not programmed yet. Let reception know.',
    ecoIntro: "Turn on energy saving for your room. You can turn it off any time, and pick which features below.",
    ecoSalidaTitulo: 'Eco mode on',
    ecoSalidaIntro: 'We started saving energy because the room seems empty. It will be ready for your return.',
    ecoSali: 'Got it, I am out',
    ecoVuelvo: 'Back soon',
    ecoSigoAca: 'No, keep it comfortable',
    ecoMantener: 'Keep saving',
    ecoPausar: 'Pause (auto-resumes)',
    ecoQuitar: 'Turn eco off',
    ecoBienvTitulo: 'Eco mode on',
    ecoBienvIntro: 'We save energy when nobody is in the room, and have it ready for your return.',
    ecoBienvOk: 'Got it',
    ecoBienvMas: 'More info and options',
    ecoAhorroTitulo: 'Your savings so far',
    ecoAhorroVacio: 'No savings yet. They show up when you go out and the system turns off what you are not using.',
    ecoAhorroEstimadoNota: 'Estimate of the energy not spent while your room was empty. Not a measurement.',
    ecoVuelvoEn: 'In how many minutes are you back?',
    ecoOk: '✓ Done, thanks.',
    ecoError: 'Could not save. Try again.',
    cerrar: 'Close',
    agendaCancelar: 'Cancel',
    agendaCancelarConf: 'Cancel this booking?',
    agendaFecha: 'Which day? (YYYY-MM-DD)',
    agendaPersonas: 'How many people?',
    agendaOk: '✓ Booked. It is in your list.',
    agendaError: 'Could not book. Try again or message us.',
    noDevicesMsg: 'This room has no smart devices. Use Services to ask the front desk for anything you need.',
    noDevicesBtn: 'Go to Services',
    toastRequestSent: 'Request sent to the front desk',
    toastDndOn: 'Do Not Disturb on',
    toastDndOff: 'Do Not Disturb off',
    toastSensorAlarmOn: 'Sensor alert turned on',
    toastSensorAlarmOff: 'Sensor alert turned off',
    toastAcAutoOff: 'Open window detected: the AC turned off automatically',
    onbTitle: 'Welcome to {hotel}',
    onbGreet: 'Dear {name}, it\'s a pleasure to have you with us. We hope your stay is comfortable and memorable. From this app you can control your room at your convenience.',
    onbScenes: 'Control your smart devices from here',
    onbSettings: 'Change language and accessibility from Settings',
    onbSupport: 'Request services or help from Support',
    onbGreetPms: "Dear {name}, it's a pleasure to have you with us. We hope your stay is comfortable and memorable. From this app you can request services and message reception whenever you need.",
    onbServiciosPms: 'Request anything from reception in Services',
    onbChatPms: 'Message us in Chat — reception replies here',
    navChat: 'Chat', sectionChat: 'Chat with reception', navServicios: 'Services',
    chatPlaceholder: 'Type your message…',
    chatVacio: 'Tell us what you need. Reception replies here.',
    chatEnviar: 'Send', chatTu: 'You', chatHotel: 'Reception', chatAsistente: 'Assistant',
    chatHablar: 'Or tell me by voice',
    instalarApp: 'Install the app on my phone',
    instalarIOS: 'To install: tap the Share button (⬆️) at the bottom in Safari and choose "Add to Home Screen".',
    activarAvisos: 'Notify me when reception replies',
    avisosActivos: 'Notifications on',
    avisosListos: "Done — we'll notify you even if you close the app",
    avisosIOS: 'On iPhone, notifications require installing the app first: tap Share (⬆️) → "Add to Home Screen", open it from the icon and enable notifications again.',
    onbGotIt: 'Get started',
    tutChoiceTitle: 'Do you know how to use smart controls?',
    tutChoiceDesc: 'We can walk you through turning on a light and moving the curtain.',
    tutStartBtn: 'Start tutorial',
    tutSkipBtn: 'I know how to use smart devices',
    tutExit: 'Exit',
    tutPrev: 'Back',
    tutNext: 'Next',
    tutFinish: 'Finish',
    tutStepCount: 'Step {n} of {total}',
    tutLightTitle: 'Turn on a light',
    tutLightDesc: 'Tap this switch to turn the light on or off. When it’s on, you can adjust its brightness and color.',
    tutCurtainOpenTitle: 'Open the curtain',
    tutCurtainOpenDesc: 'Tap this button to open the curtain automatically.',
    tutCurtainStopTitle: 'Stop the curtain',
    tutCurtainStopDesc: 'Tap this button to stop the curtain wherever it is, without finishing the open/close move.',
    tutCurtainCloseTitle: 'Close the curtain',
    tutCurtainCloseDesc: 'Tap this button to close the curtain. You can also use the slider to leave it halfway.',
    toastCurtainMaxOpen: 'Already fully open',
    toastCurtainMaxClosed: 'Already fully closed',
    connOnline: 'Online',
    connOffline: 'Offline',
    toastOnline: 'Connection restored',
    toastOffline: 'No internet connection',
    sectionFavorites: 'Quick access',
    favToggle: 'Mark as favorite',
    toastFavMax: 'Maximum of 3 quick shortcuts. Remove one to add another.',
    cdLeft: '{t} left',
    cdOverdue: 'Overdue by {t}',
    cdNow: 'Just expired',
    sceneNightTitle: 'Night',
    sceneNightDesc: 'Turns off the main lights and turns on the under-bed LED',
    sceneMorningTitle: 'Morning',
    sceneMorningDesc: 'Opens the curtain and turns on warm lights',
    sceneRelaxTitle: 'Relax',
    sceneRelaxDesc: 'Soft colored lights with the curtain at half height',
    sceneOffTitle: 'All off',
    sceneOffDesc: 'Turns off every light and outlet in the room',
    sceneCustomDesc: 'Custom scene',
    sceneNewBtn: 'Create new scene',
    sceneNewTitle: 'New scene',
    sceneNewDesc: 'The current configuration of your room will be saved with the name and icon you choose.',
    sceneNamePlaceholder: 'Scene name',
    sceneSaveBtn: 'Save',
    sceneCancelBtn: 'Cancel',
    sceneEditTitle: 'Save current state',
    sceneDeleteTitle: 'Delete scene',
    sceneDeleteConfirm: 'Delete the scene "{name}"?',
    sceneResetTitle: 'Reset scene to default',
    sceneResetConfirm: 'Reset the scene "{name}" to its original configuration?',
    scenesHint: 'Tap a scene to activate it. Edit a scene to save your room\'s current configuration to it, or create a new one.',
    scenesConfigLabel: 'Adjust the controls',
    scenesConfigHintCreate: 'Turn on, off, or adjust whatever you want saved in the new scene. When it looks right, tap "Save".',
    scenesConfigHintEdit: 'Adjust the controls the way you want them in "{name}", then save the changes.',
    scenesConfigSaveCreate: 'Save this configuration',
    scenesConfigSaveEdit: 'Save changes to "{name}"',
    scenesConfigCancel: 'Cancel',
    sceneHelpTitle: 'How do scenes work?',
    sceneHelpText: 'A scene applies several settings at once with a single tap (for example, turning off all lights and closing the curtain to sleep). Tap it to activate it. You can edit it to adjust what it saves, schedule it, or create a new one.',
    reportSceneProblemPrompt: 'Describe the problem with the "{name}" scene:',
    reportSceneProblemNote: 'Problem with scene "{name}": {note}',
    toastSceneSaved: 'Scene saved',
    toastSceneSaveFail: 'Could not save the scene',
    toastSceneDeleted: 'Scene deleted',
    toastSceneDeleteFail: 'Could not delete the scene',
    toastSceneNameRequired: 'Enter a name for the scene',
    toastSceneMax: 'You have reached the maximum number of custom scenes',
    setHotel: 'Hotel',
    setRoom: 'Room',
    setGuest: 'Guest',
    setCheckin: 'Check-in',
    setCheckout: 'Check-out',
    setMode: 'Mode',
    modeDemo: 'Demo',
    modeLive: 'Live',
    language: 'Language',
    accessibility: 'Accessibility',
    a11yHearing: 'Hearing',
    theme: 'Theme',
    themeAuto: 'Automatic',
    themeLight: 'Light',
    themeDark: 'Dark',
    a11yVisionNote: 'Larger text and controls with higher contrast for low-vision guests. The microphone button (bottom-right corner) grows and becomes the main way to control the room by voice.',
    a11yHearingNote: 'Prominent, longer-lasting visual alerts instead of sound cues.',
    supportQuestion: 'Need help with your room or have any questions?',
    callReception: 'Message the front desk (WhatsApp)',
    callReceptionTel: 'I\'d rather call by phone',
    callReceptionWaMsg: 'Hi, I\'m a guest in room {room} at {hotel} and I need help.',
    callReceptionMsg: 'To contact the front desk, dial extension 0 from your room phone or stop by the reception.',
    callReceptionCitofono: 'Use the room intercom',
    callReceptionCitofonoMsg: 'Use your room intercom to reach the front desk.',
    callReceptionBajar: 'Stop by the front desk',
    callReceptionBajarMsg: 'Come down to the front desk, we\'re ready to help.',
    callReceptionOtra: 'Contact the front desk',
    checkoutMsg: 'For check-out, please go to the front desk or call the hotel extension.',
    manualNote: 'Manual control enabled — use the physical switch in the room. Turn it off to control from the app again.',
    unlockNoteOn: 'Motor unlocked — move the curtain by hand. Lock it to control it from the app again.',
    toastManualOn: 'Manual mode enabled — light set to warm, now controlled by the physical switch',
    toastManualOff: 'Manual mode disabled — app control restored',
    toastUnlockOn: 'Motor unlocked — move the curtain by hand',
    toastUnlockOff: 'Motor locked — app control restored',
    position: 'Position',
    color: 'Color', colorIntensity: 'Color intensity', scenes: 'Scenes', audioTitle: 'Home theater',
    vozBtn: 'Voice control (press and hold)', vozEscuchando: 'Listening…',
    vozSinMicrofono: 'Could not use the microphone. Check the browser permission.',
    vozNoEntendi: 'I didn\'t catch that. Try: "abre la cortina" or "sube el volumen" (Spanish for now)',
    vozActivando: 'Activating',
    curtainOpenBtn: '▲ Open',
    curtainStopBtn: '⏹ Stop',
    curtainCloseBtn: '▼ Close',
    offlineDevice: 'Device unavailable',
    toastCmdFail: 'Command failed. Check your connection.',
    toastScene: 'Scene applied',
    toastSceneFail: 'Some commands failed',
    toastPreview: 'Preview — feature not connected to a real device',
    voiceListening: 'Listening… tap the microphone again to send',
    voiceProcessing: 'Processing your command…',
    voiceNotUnderstood: 'I didn\'t recognize a command. Try again, for example: open the curtain.',
    toastVoiceUnsupported: 'Voice control isn\'t supported on this browser',
    toastVoiceMicDenied: 'Couldn\'t access the microphone. Check your permissions.',
    reportProblemBtn: 'Report a problem with this device',
    reportTitle: 'Report a problem',
    reportIntroDesc: 'You\'re about to report a problem with: {device}. The front desk will receive your report right away.',
    reportBackBtn: 'Back',
    reportContinueBtn: 'Continue',
    reportSendBtn: 'Send',
    reportOptionsTitle: 'What\'s the problem?',
    reportNoOptionToast: 'Choose an option before sending',
    reportOtherTitle: 'Tell us what\'s happening',
    reportPickDevice: 'Which device has the problem?',
    cleaningModalTitle: 'Request cleaning',
    cleaningModalDesc: 'How long will you be out of the room? This lets housekeeping know when they can come in.',
    cleaningTimeNow: 'I\'m leaving now',
    cleaningTime30m: 'About 30 minutes',
    cleaningTime1h: 'Around 1 hour',
    cleaningTime2h: 'Around 2 hours',
    cleaningTime3h: 'More than 3 hours',
    cleaningTimeSkip: 'Send without saying',
    reportOtherPlaceholder: 'Describe the problem (optional)',
    reportOptOtra: 'Other',
    reportOptNoEnciende: 'Doesn\'t turn on',
    reportOptNoApaga: 'Doesn\'t turn off',
    reportOptNoIntensidad: 'Brightness won\'t change',
    reportOptNoTemperatura: 'Color temperature won\'t change',
    reportOptNoColores: 'Colors won\'t change',
    reportOptNoAbre: 'Won\'t open',
    reportOptNoCierra: 'Won\'t close',
    reportOptNoPara: 'Won\'t stop (Stop doesn\'t work)',
    reportOptSeMueveSola: 'Moves by itself',
    reportOptCanalNoResponde: 'One channel doesn\'t respond',
    reportOptNingunCanalResponde: 'No channel responds',
    reportOptNoTemperaturaAC: 'Temperature won\'t change',
    reportOptNoEnfriaCalienta: 'Doesn\'t cool or heat even though it\'s on',
    themeActivateDark: 'Turn on dark mode',
    themeDeactivateDark: 'Turn off dark mode',
    scheduleBtn: 'Schedule',
    helpBtn: 'How to use',
    enlargeBtn: 'Enlarge',
    helpCloseBtn: 'Back',
    helpTextLight: 'Tap the switch to turn the light on or off. While on, drag the bar to adjust brightness, and pick warm, neutral or cool for the tone.',
    helpTextLED: 'Tap the switch to turn it on or off. Adjust brightness with the bar, or tap "Color" to pick a color from the wheel.',
    helpTextCurtain: 'Use ▲ to open, ⏹ to stop at any point, and ▼ to close. The vertical bar shows how open it is.',
    helpTextSwitch: 'Tap the switch to turn it on or off.',
    helpTextAC: 'Tap the switch to turn the AC on or off. Use + and − to adjust the temperature.',
    helpTextGeneric: 'Tap the switch to turn this control on or off.',
    helpTextTV: 'Tap the switch to turn the TV on or off. Adjust the volume with the bar and pick a source (cable, streaming, or HDMI).',
    helpTextBathroom: 'Tap the switch to turn the bathroom light on or off. With "Auto on" enabled, it turns on by itself when it detects someone.',
    helpTextBidet: 'Tap the switch to pre-heat the bidet seat before getting up. Everything else is controlled from the bathroom panel.',
    helpTextRug: 'Tap the switch to turn on the heated rug and pick the heat level.',
    helpTextClimateAuto: 'When enabled, the AC turns off automatically as soon as the window is detected open, to save energy.',
    heatedSeatOn: 'Heated seat — on',
    heatedSeatOff: 'Heated seat — off',
    bidetPanelNote: 'Everything else (wash, dry, etc.) is controlled from the bathroom panel.',
    scheduleTitle: 'Schedule',
    scheduleDesc: 'Choose when it should turn on or off: {device}.',
    scheduleDescScene: 'Choose when to activate this scene: {device}.',
    scheduleTurnOn: 'Turn on',
    scheduleTurnOff: 'Turn off',
    scheduleSendBtn: 'Schedule',
    scheduleFrom: 'From',
    scheduleUntil: 'Until',
    scheduleAutoOff: 'Turn off/close automatically',
    scheduleOnce: 'Just once',
    scheduleWeekly: 'Days of the week',
    scheduleNoTimeError: 'Pick a start time.',
    scheduleNoEndTimeError: 'Pick the time it should end.',
    scheduleSameTimeError: 'End time must be different from start time.',
    scheduleNoDateError: 'Pick a date.',
    scheduleNoDaysError: 'Pick at least one day of the week.',
    scheduleDay_L: 'M', scheduleDay_M: 'T', scheduleDay_M2: 'W', scheduleDay_J: 'T',
    scheduleDay_V: 'F', scheduleDay_S: 'S', scheduleDay_D: 'S',
    scheduleDayShortL: 'Mon', scheduleDayShortM: 'Tue', scheduleDayShortM2: 'Wed', scheduleDayShortJ: 'Thu',
    scheduleDayShortV: 'Fri', scheduleDayShortS: 'Sat', scheduleDayShortD: 'Sun',
    scheduleNonePending: 'No scheduled commands pending.',
    scheduleCancelBtn: 'Cancel scheduled command',
    toastScheduleSaved: 'Scheduled successfully',
    toastScheduleCancelled: 'Scheduled command cancelled',
    bathAutoNote: ' · Set to turn on automatically when someone is inside',
    bathManualNote: 'Manual control enabled — light set to warm, now controlled by the physical bathroom switch.',
    acSection: 'Air Conditioning',
    autoSection: 'Automations',
    doorOpen: 'Door open',
  },
  pt: {
    loading: 'Carregando seu quarto…',
    errVencidoTitle: 'Este link expirou',
    errVencidoSubFecha: 'Expirou em {fecha}. Se você ainda está hospedado, peça um novo na recepção.',
    errNoEmpezoTitle: 'Este link ainda não está ativo',
    errNoEmpezoSubFecha: 'Fica ativo em {fecha}, o dia da sua chegada.',
    errInvalidTitle: 'Link inválido ou expirado',
    errInvalidSub: 'Este QR não é mais válido. Solicite um novo acesso na recepção.',
    errServerTitle: 'Sem conexão com o servidor',
    errServerSub: 'Não foi possível conectar ao sistema. Verifique sua conexão WiFi ou fale com a recepção.',
    navRoom: 'Quarto',
    navSecurity: 'Segurança',
    navScenes: 'Cenas',
    navClimate: 'Clima',
    navSettings: 'Ajustes',
    navSupport: 'Suporte',
    demoBanner: 'Modo demonstração — as mudanças não são aplicadas a dispositivos reais',
    checkoutBtn: 'Check-out',
    hello: 'Olá, {name}',
    welcome: 'Bem-vindo',
    checkoutLine: 'Check-out: {date} às {time}',
    sectionControls: 'Controles inteligentes',
    sectionSecurity: 'Segurança',
    accesosTitle: 'Acessos com seu link',
    accesosDesc: 'Dispositivos que abriram este link. Se não reconhecer algum, revogue — perde o acesso na hora.',
    accesosOwner: 'este aparelho (titular)',
    accesosThis: 'este aparelho',
    accesosSince: 'desde',
    accesosRevoke: 'Revogar',
    accesosRestore: 'Restaurar',
    accesosRevokeConfirm: 'Revogar o acesso deste aparelho? Você pode restaurar depois se foi engano.',
    accesosRevokedOk: 'Acesso revogado',
    accesosRestoredOk: 'Acesso restaurado',
    accesosApprovalMode: 'Exigir minha aprovação para novos aparelhos',
    accesosPending: 'aguardando aprovação',
    accesosApprove: 'Aprovar',
    accesosReject: 'Rejeitar',
    accesosApprovedOk: 'Aparelho aprovado',
    accesosRejectedOk: 'Aparelho rejeitado',
    accesosModeOn: 'Aprovação ativada',
    accesosModeOff: 'Aprovação desativada',
    errRevokedTitle: 'Acesso revogado',
    errRevokedSub: 'O titular do quarto revogou o acesso deste aparelho.',
    errPendingTitle: 'Aguardando aprovação',
    errPendingSub: 'O titular do quarto precisa aprovar este aparelho. Abrirá sozinho quando aprovar.',
    sensorOpen: 'Aberta',
    sensorClosed: 'Fechada',
    alarmSensorTitle: 'Avisar se isto abrir',
    alarmSensorNote: 'Se você tiver o app aberto, soará um alerta assim que este sensor abrir',
    noSecuritySensorsMsg: 'Este quarto não tem sensores de porta ou janela configurados.',
    sectionScenes: 'Cenas',
    sectionSettings: 'Ajustes',
    sectionSupport: 'Suporte',
    sectionServices: 'Serviços',
    dndTitle: 'Não perturbe',
    dndDesc: 'A equipe de limpeza não entrará no seu quarto enquanto estiver ativo',
    doorAlarmTriggeredTitle: '{device} abriu!',
    doorAlarmTriggeredDesc: 'Você ativou o aviso para este sensor durante esta estadia.',
    doorAlarmDismissBtn: 'Entendi',
    requestTowels: 'Pedir toalhas / amenities',
    requestRoomService: 'Pedir room service',
    requestCleaning: 'Pedir limpeza',
    requestLateCheckout: 'Solicitar late checkout',
    requestMaintenance: 'Relatar um problema',
    requestOther: 'Outra solicitação',
    requestNotePrompt: 'Descreva brevemente sua solicitação:',
    reportAppProblemBtn: 'Reportar um problema',
    reportAppProblemTitle: 'Reportar um problema',
    reportAppProblemDesc: 'Conte-nos o que está errado — chega tanto ao hotel quanto à equipe que mantém este app.',
    reportAppProblemPlaceholder: 'Descreva o problema…',
    reportAppProblemSend: 'Enviar',
    reportAppProblemCancel: 'Cancelar',
    sectionDirectorio: 'O que o hotel oferece',
    directorioEmpty: 'Nenhum serviço publicado ainda.',
    sectionAgenda: 'Reservar com hora',
    navHistorial: 'Histórico',
    sectionHistorial: 'Histórico do seu quarto',
    actEmpty: 'Ainda não há atividade para mostrar.',
    ecoTitulo: 'Modo economia de energia',
    acModoLbl: 'Modo',
    acFrio: '🧊 Frio',
    acCalor: '🔥 Calor',
    acAuto: '🔄 Auto',
    acPrimeroModo: 'Primeiro escolha Frio, Calor ou Auto',
    acVentLbl: 'Ventilador',
    acVentBajo: 'Baixo',
    acVentMedio: 'Médio',
    acVentAlto: 'Alto',
    acPantalla: '🌙 Desligar o visor',
    acPantallaOn: '💡 Ligar o visor',
    acQuiero: 'Quero o quarto a',
    actTitulo: 'Atividade do seu quarto',
    actIntro: 'Tudo desde a sua chegada.',
    actPorHotel: 'feito pelo hotel',
    acTempEquipo: 'Temperatura do ar',
    acLlegando: 'Ajustando o ar para chegar…',
    acLlego: '✓ Chegou a {n}° em {min} min',
    acObjetivoOk: '✓ Buscando {n}° no quarto',
    acElegiModo: 'Escolha frio ou calor para ver as temperaturas.',
    acElegiModoArriba: 'Toque em Frio ou Calor (acima, em Modo) para ver as temperaturas.',
    acAmbiente: 'Ambiente',
    acEncender: 'Ligar',
    acApagar: 'Desligar',
    irOnOff: 'On/Off',
    acSinCodigo: 'Esse botão ainda não está programado. Avise a recepção.',
    ecoIntro: 'Ative a economia de energia do seu quarto. Pode desligar quando quiser, e escolher abaixo quais funções.',
    ecoSalidaTitulo: 'Modo eco ativado',
    ecoSalidaIntro: 'Ativamos a economia porque não detectamos ninguém no quarto. Fica pronto para a sua volta.',
    ecoSali: 'Entendi, estou fora',
    ecoVuelvo: 'Volto logo',
    ecoSigoAca: 'Não, manter confortável',
    ecoMantener: 'Manter economia',
    ecoPausar: 'Pausar (volta sozinho)',
    ecoQuitar: 'Desligar modo eco',
    ecoBienvTitulo: 'Modo eco ativado',
    ecoBienvIntro: 'Economizamos energia quando não há ninguém no quarto, e deixamos pronto para a sua volta.',
    ecoBienvOk: 'Entendi',
    ecoBienvMas: 'Mais informações e opções',
    ecoAhorroTitulo: 'Sua economia até agora',
    ecoAhorroVacio: 'Ainda sem economia registrada. Aparece quando você sai e o sistema desliga o que não está usando.',
    ecoAhorroEstimadoNota: 'Estimativa da energia não gasta enquanto seu quarto ficou vazio. Não é uma medição.',
    ecoVuelvoEn: 'Em quantos minutos você volta?',
    ecoOk: '✓ Pronto, obrigado.',
    ecoError: 'Não foi possível salvar. Tente de novo.',
    cerrar: 'Fechar',
    agendaCancelar: 'Cancelar',
    agendaCancelarConf: 'Cancelar esta reserva?',
    agendaFecha: 'Para que dia? (AAAA-MM-DD)',
    agendaPersonas: 'Quantas pessoas?',
    agendaOk: '✓ Reservado. Está na sua lista.',
    agendaError: 'Não foi possível reservar. Tente de novo ou fale conosco.',
    noDevicesMsg: 'Este quarto não possui dispositivos inteligentes. Use Serviços para pedir o que precisar à recepção.',
    noDevicesBtn: 'Ir para Serviços',
    toastRequestSent: 'Solicitação enviada à recepção',
    toastDndOn: 'Não perturbe ativado',
    toastDndOff: 'Não perturbe desativado',
    toastSensorAlarmOn: 'Aviso de sensor ativado',
    toastSensorAlarmOff: 'Aviso de sensor desativado',
    toastAcAutoOff: 'Janela aberta detectada: o ar-condicionado desligou automaticamente',
    onbTitle: 'Bem-vindo ao {hotel}',
    onbGreet: 'Caro/a {name}, é um prazer recebê-lo/a. Esperamos que sua estadia seja confortável e inesquecível. Por este app você pode controlar seu quarto com toda comodidade.',
    onbScenes: 'Controle seus dispositivos inteligentes a partir daqui',
    onbSettings: 'Altere idioma e acessibilidade em Configurações',
    onbSupport: 'Solicite serviços ou ajuda em Suporte',
    onbGreetPms: 'Prezado(a) {name}, é um prazer recebê-lo. Esperamos que sua estadia seja confortável e memorável. Neste app você pode pedir serviços e falar com a recepção quando precisar.',
    onbServiciosPms: 'Peça o que precisar à recepção em Serviços',
    onbChatPms: 'Fale conosco pelo Chat: a recepção responde por aqui',
    navChat: 'Chat', sectionChat: 'Chat com a recepção', navServicios: 'Serviços',
    chatPlaceholder: 'Escreva sua mensagem…',
    chatVacio: 'Conte o que precisa. A recepção responde por aqui.',
    chatEnviar: 'Enviar', chatTu: 'Você', chatHotel: 'Recepção', chatAsistente: 'Assistente',
    chatHablar: 'Ou fale comigo',
    instalarApp: 'Instalar o app no meu telefone',
    instalarIOS: 'Para instalar: toque no botão Compartilhar (⬆️) embaixo no Safari e escolha "Adicionar à Tela de Início".',
    activarAvisos: 'Avisar quando a recepção responder',
    avisosActivos: 'Avisos ativados',
    avisosListos: 'Pronto: avisaremos mesmo com o app fechado',
    avisosIOS: 'No iPhone os avisos exigem instalar o app primeiro: toque em Compartilhar (⬆️) → "Adicionar à Tela de Início", abra pelo ícone e ative os avisos novamente.',
    onbGotIt: 'Começar',
    tutChoiceTitle: 'Você sabe usar os controles smart?',
    tutChoiceDesc: 'Podemos te guiar passo a passo para ligar uma luz e mover a cortina.',
    tutStartBtn: 'Iniciar tutorial',
    tutSkipBtn: 'Já sei usar dispositivos smart',
    tutExit: 'Sair',
    tutPrev: 'Anterior',
    tutNext: 'Próximo',
    tutFinish: 'Finalizar',
    tutStepCount: 'Passo {n} de {total}',
    tutLightTitle: 'Ligar uma luz',
    tutLightDesc: 'Toque neste interruptor para ligar ou desligar a luz. Quando estiver ligada, você pode ajustar o brilho e a cor.',
    tutCurtainOpenTitle: 'Abrir a cortina',
    tutCurtainOpenDesc: 'Toque neste botão para abrir a cortina automaticamente.',
    tutCurtainStopTitle: 'Parar a cortina',
    tutCurtainStopDesc: 'Toque neste botão para parar a cortina onde estiver, sem terminar de abrir ou fechar.',
    tutCurtainCloseTitle: 'Fechar a cortina',
    tutCurtainCloseDesc: 'Toque neste botão para fechar a cortina. Você também pode usar o controle deslizante para deixá-la na metade.',
    toastCurtainMaxOpen: 'Já está totalmente aberta',
    toastCurtainMaxClosed: 'Já está totalmente fechada',
    connOnline: 'Online',
    connOffline: 'Sem conexão',
    toastOnline: 'Conexão restabelecida',
    toastOffline: 'Sem conexão com a internet',
    sectionFavorites: 'Acessos rápidos',
    favToggle: 'Marcar como favorito',
    toastFavMax: 'Máximo de 3 acessos rápidos. Remova um para adicionar outro.',
    cdLeft: 'Faltam {t}',
    cdOverdue: 'Vencido há {t}',
    cdNow: 'Venceu agora',
    sceneNightTitle: 'Noite',
    sceneNightDesc: 'Apaga as luzes principais e acende o LED sob a cama',
    sceneMorningTitle: 'Manhã',
    sceneMorningDesc: 'Abre a cortina e acende as luzes em tom quente',
    sceneRelaxTitle: 'Relax',
    sceneRelaxDesc: 'Ambiente com luzes coloridas suaves e cortina a meia altura',
    sceneOffTitle: 'Desligar tudo',
    sceneOffDesc: 'Apaga todas as luzes e tomadas do quarto',
    sceneCustomDesc: 'Cena personalizada',
    sceneNewBtn: 'Criar nova cena',
    sceneNewTitle: 'Nova cena',
    sceneNewDesc: 'A configuração atual do seu quarto será salva com o nome e ícone que você escolher.',
    sceneNamePlaceholder: 'Nome da cena',
    sceneSaveBtn: 'Salvar',
    sceneCancelBtn: 'Cancelar',
    sceneEditTitle: 'Salvar estado atual',
    sceneDeleteTitle: 'Excluir cena',
    sceneDeleteConfirm: 'Excluir a cena "{name}"?',
    sceneResetTitle: 'Restaurar cena original',
    sceneResetConfirm: 'Restaurar a cena "{name}" para sua configuração original?',
    scenesHint: 'Toque em uma cena para ativá-la. Edite uma cena para salvar a configuração atual do seu quarto nela, ou crie uma nova.',
    scenesConfigLabel: 'Ajuste os controles',
    scenesConfigHintCreate: 'Ligue, desligue ou ajuste o que quiser salvar na cena nova. Quando estiver como quiser, toque em "Salvar".',
    scenesConfigHintEdit: 'Ajuste os controles como quiser que fiquem em "{name}" e depois salve as alterações.',
    scenesConfigSaveCreate: 'Salvar esta configuração',
    scenesConfigSaveEdit: 'Salvar alterações em "{name}"',
    scenesConfigCancel: 'Cancelar',
    sceneHelpTitle: 'Como funcionam as cenas?',
    sceneHelpText: 'Uma cena aplica vários ajustes de uma vez com um único toque (por exemplo, desligar todas as luzes e fechar a cortina para dormir). Toque para ativá-la. Você pode editá-la para ajustar o que ela salva, agendá-la, ou criar uma nova.',
    reportSceneProblemPrompt: 'Descreva o problema com a cena "{name}":',
    reportSceneProblemNote: 'Problema com a cena "{name}": {note}',
    toastSceneSaved: 'Cena salva',
    toastSceneSaveFail: 'Não foi possível salvar a cena',
    toastSceneDeleted: 'Cena excluída',
    toastSceneDeleteFail: 'Não foi possível excluir a cena',
    toastSceneNameRequired: 'Digite um nome para a cena',
    toastSceneMax: 'Você atingiu o máximo de cenas personalizadas',
    setHotel: 'Hotel',
    setRoom: 'Quarto',
    setGuest: 'Hóspede',
    setCheckin: 'Check-in',
    setCheckout: 'Check-out',
    setMode: 'Modo',
    modeDemo: 'Demonstração',
    modeLive: 'Ao vivo',
    language: 'Idioma',
    accessibility: 'Acessibilidade',
    a11yHearing: 'Auditiva',
    theme: 'Tema',
    themeAuto: 'Automático',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    a11yVisionNote: 'Texto e controles maiores, com mais contraste, para pessoas com baixa visão. O botão de microfone (canto inferior direito) cresce e passa a ser a forma principal de controlar o quarto por voz.',
    a11yHearingNote: 'Avisos visuais destacados e mais duradouros em vez de sinais sonoros.',
    supportQuestion: 'Precisa de ajuda com seu quarto ou tem alguma dúvida?',
    callReception: 'Mensagem para a recepção (WhatsApp)',
    callReceptionTel: 'Prefiro ligar por telefone',
    callReceptionWaMsg: 'Olá, sou hóspede do quarto {room} no {hotel} e preciso de ajuda.',
    callReceptionMsg: 'Para falar com a recepção, disque o ramal 0 do telefone do quarto ou vá até a recepção.',
    callReceptionCitofono: 'Usar o interfone',
    callReceptionCitofonoMsg: 'Use o interfone do seu quarto para falar com a recepção.',
    callReceptionBajar: 'Ir até a recepção',
    callReceptionBajarMsg: 'Vá até a recepção, estamos prontos para ajudar.',
    callReceptionOtra: 'Contatar a recepção',
    checkoutMsg: 'Para o check-out, dirija-se à recepção ou ligue para o ramal do hotel.',
    manualNote: 'Controle manual ativado — use o interruptor físico do quarto. Desative para voltar a controlar pelo app.',
    unlockNoteOn: 'Motor destravado — mova a cortina com a mão. Trave para voltar a controlá-la pelo app.',
    toastManualOn: 'Modo manual ativado — luz fixa em tom quente, agora liga/desliga pelo interruptor físico',
    toastManualOff: 'Modo manual desativado — controle pelo app restaurado',
    toastUnlockOn: 'Motor destravado — mova a cortina com a mão',
    toastUnlockOff: 'Motor travado — controle pelo app restaurado',
    position: 'Posição',
    color: 'Cor', colorIntensity: 'Intensidade da cor', scenes: 'Cenas', audioTitle: 'Som',
    vozBtn: 'Controle por voz (mantenha pressionado)', vozEscuchando: 'Ouvindo…',
    vozSinMicrofono: 'Não foi possível usar o microfone. Verifique a permissão do navegador.',
    vozNoEntendi: 'Não entendi. Tente: "abre la cortina" ou "sube el volumen" (espanhol por enquanto)',
    vozActivando: 'Ativando',
    curtainOpenBtn: '▲ Abrir',
    curtainStopBtn: '⏹ Parar',
    curtainCloseBtn: '▼ Fechar',
    offlineDevice: 'Dispositivo indisponível',
    toastCmdFail: 'Não foi possível executar. Verifique a conexão.',
    toastScene: 'Cena aplicada',
    toastSceneFail: 'Alguns comandos falharam',
    toastPreview: 'Pré-visualização — função não conectada a um dispositivo real',
    voiceListening: 'Ouvindo… toque no microfone novamente para enviar',
    voiceProcessing: 'Processando seu comando…',
    voiceNotUnderstood: 'Não identifiquei um comando. Tente de novo, por exemplo: abra a cortina.',
    toastVoiceUnsupported: 'O controle por voz não é compatível com este navegador',
    toastVoiceMicDenied: 'Não foi possível acessar o microfone. Verifique as permissões.',
    reportProblemBtn: 'Reportar um problema com este dispositivo',
    reportTitle: 'Reportar um problema',
    reportIntroDesc: 'Você vai reportar um problema com: {device}. A recepção receberá seu reporte imediatamente.',
    reportBackBtn: 'Voltar',
    reportContinueBtn: 'Continuar',
    reportSendBtn: 'Enviar',
    reportOptionsTitle: 'Qual é o problema?',
    reportNoOptionToast: 'Escolha uma opção antes de enviar',
    reportOtherTitle: 'Conte o que está acontecendo',
    reportPickDevice: 'Qual dispositivo tem o problema?',
    cleaningModalTitle: 'Solicitar limpeza',
    cleaningModalDesc: 'Por quanto tempo você estará fora do quarto? Assim a equipe sabe quando pode entrar.',
    cleaningTimeNow: 'Estou saindo agora',
    cleaningTime30m: 'Uns 30 minutos',
    cleaningTime1h: 'Cerca de 1 hora',
    cleaningTime2h: 'Cerca de 2 horas',
    cleaningTime3h: 'Mais de 3 horas',
    cleaningTimeSkip: 'Enviar sem indicar',
    reportOtherPlaceholder: 'Descreva o problema (opcional)',
    reportOptOtra: 'Outro',
    reportOptNoEnciende: 'Não liga',
    reportOptNoApaga: 'Não desliga',
    reportOptNoIntensidad: 'A intensidade não muda',
    reportOptNoTemperatura: 'A temperatura de cor não muda',
    reportOptNoColores: 'As cores não mudam',
    reportOptNoAbre: 'Não abre',
    reportOptNoCierra: 'Não fecha',
    reportOptNoPara: 'Não para (Parar não funciona)',
    reportOptSeMueveSola: 'Se move sozinha',
    reportOptCanalNoResponde: 'Um canal não responde',
    reportOptNingunCanalResponde: 'Nenhum canal responde',
    reportOptNoTemperaturaAC: 'A temperatura não muda',
    reportOptNoEnfriaCalienta: 'Não esfria nem esquenta mesmo ligado',
    themeActivateDark: 'Ativar modo escuro',
    themeDeactivateDark: 'Desativar modo escuro',
    scheduleBtn: 'Programar',
    helpBtn: 'Como usar',
    enlargeBtn: 'Ampliar',
    helpCloseBtn: 'Voltar',
    helpTextLight: 'Toque no interruptor para ligar ou desligar a luz. Quando ligada, arraste a barra para ajustar a intensidade e escolha quente, neutro ou frio para o tom.',
    helpTextLED: 'Toque no interruptor para ligar ou desligar. Ajuste a intensidade com a barra, ou toque em "Cor" para escolher uma cor na roda.',
    helpTextCurtain: 'Use ▲ para abrir, ⏹ para parar em qualquer ponto, e ▼ para fechar. A barra vertical mostra o quanto está aberta.',
    helpTextSwitch: 'Toque no interruptor para ligar ou desligar.',
    helpTextAC: 'Toque no interruptor para ligar ou desligar o ar-condicionado. Use + e − para ajustar a temperatura.',
    helpTextGeneric: 'Toque no interruptor para ligar ou desligar este controle.',
    helpTextTV: 'Toque no interruptor para ligar ou desligar a TV. Ajuste o volume na barra e escolha a fonte (cabo, streaming ou HDMI).',
    helpTextBathroom: 'Toque no interruptor para ligar ou desligar a luz do banheiro. Com "Ligar automático" ativado, ela liga sozinha ao detectar presença.',
    helpTextBidet: 'Toque no interruptor para pré-aquecer o assento antes de levantar. O resto das funções é controlado pelo painel do banheiro.',
    helpTextRug: 'Toque no interruptor para ligar o tapete aquecido e escolha o nível de calor.',
    helpTextClimateAuto: 'Se ativado, o ar-condicionado desliga automaticamente ao detectar que a janela foi aberta, para economizar energia.',
    heatedSeatOn: 'Assento aquecido — ligado',
    heatedSeatOff: 'Assento aquecido — desligado',
    bidetPanelNote: 'O resto das funções (lavar, secar, etc.) é controlado pelo painel do banheiro.',
    scheduleTitle: 'Programar',
    scheduleDesc: 'Escolha quando deve ligar ou desligar: {device}.',
    scheduleDescScene: 'Escolha quando ativar esta cena: {device}.',
    scheduleTurnOn: 'Ligar',
    scheduleTurnOff: 'Desligar',
    scheduleSendBtn: 'Programar',
    scheduleFrom: 'Das',
    scheduleUntil: 'Até',
    scheduleAutoOff: 'Desligar/fechar automaticamente',
    scheduleOnce: 'Só uma vez',
    scheduleWeekly: 'Dias da semana',
    scheduleNoTimeError: 'Escolha um horário de início.',
    scheduleNoEndTimeError: 'Escolha o horário em que deve terminar.',
    scheduleSameTimeError: 'O horário de término deve ser diferente do de início.',
    scheduleNoDateError: 'Escolha uma data.',
    scheduleNoDaysError: 'Escolha pelo menos um dia da semana.',
    scheduleDay_L: 'S', scheduleDay_M: 'T', scheduleDay_M2: 'Q', scheduleDay_J: 'Q',
    scheduleDay_V: 'S', scheduleDay_S: 'S', scheduleDay_D: 'D',
    scheduleDayShortL: 'Seg', scheduleDayShortM: 'Ter', scheduleDayShortM2: 'Qua', scheduleDayShortJ: 'Qui',
    scheduleDayShortV: 'Sex', scheduleDayShortS: 'Sáb', scheduleDayShortD: 'Dom',
    scheduleNonePending: 'Sem agendamentos pendentes.',
    scheduleCancelBtn: 'Cancelar agendamento',
    toastScheduleSaved: 'Agendado com sucesso',
    toastScheduleCancelled: 'Agendamento cancelado',
    bathAutoNote: ' · Programada para acender automaticamente se houver alguém dentro',
    bathManualNote: 'Controle manual ativado — luz fixa em tom quente, agora liga/desliga pelo interruptor físico do banheiro.',
    acSection: 'Ar-Condicionado',
    autoSection: 'Automações',
    doorOpen: 'Porta aberta',
  },
};

const t        = makeTranslator(I18N, () => app.lang);
const devLabel = makeDevLabel(I18N, () => app.lang);

// ── ESCENAS RÁPIDAS ───────────────────────────────────────────────────────────
const SCENES = {
  night: [
    { dev: 'luz_velador1', cmd: { on: false } },
    { dev: 'luz_velador2', cmd: { on: false } },
    { dev: 'luz_techo',    cmd: { on: false } },
    { dev: 'led_cama',     cmd: { on: true  } },
    { dev: 'cortina',      cmd: { control: 'close' }, optimistic: { position: 0 } },
  ],
  morning: [
    { dev: 'cortina',      cmd: { control: 'open' }, optimistic: { position: 100 } },
    { dev: 'luz_velador1', cmd: { on: true, intensity: 60, colorTemp: 70 } },
    { dev: 'luz_velador2', cmd: { on: true, intensity: 60, colorTemp: 70 } },
    { dev: 'luz_techo',    cmd: { on: true, intensity: 70, colorTemp: 80 } },
  ],
  relax: [
    { dev: 'luz_velador2', cmd: { on: true, hue: 270, saturation: 800 }, optimistic: { on: true, hue: 270, mode: 'colour' } },
    { dev: 'led_cama',     cmd: { on: true } },
    { dev: 'luz_velador1', cmd: { on: true, intensity: 15, colorTemp: 5 } },
    { dev: 'luz_techo',    cmd: { on: false } },
    { dev: 'cortina',      cmd: { position: 50 } },
  ],
  off: [
    { dev: 'luz_velador1', cmd: { on: false } },
    { dev: 'luz_velador2', cmd: { on: false } },
    { dev: 'luz_techo',    cmd: { on: false } },
    { dev: 'led_cama',     cmd: { on: false } },
    { dev: 'enchufe',      cmd: { ch1: false, ch2: false } },
  ],
};

// Metadatos de las escenas por defecto: ícono y textos (vía i18n)
const DEFAULT_SCENES_META = {
  night:   { ico: 'moon', titleKey: 'sceneNightTitle',   descKey: 'sceneNightDesc' },
  morning: { ico: 'sun',  titleKey: 'sceneMorningTitle', descKey: 'sceneMorningDesc' },
  relax:   { ico: 'film', titleKey: 'sceneRelaxTitle',   descKey: 'sceneRelaxDesc' },
  off:     { ico: 'zap',  titleKey: 'sceneOffTitle',     descKey: 'sceneOffDesc' },
};
const DEFAULT_SCENE_IDS = Object.keys(DEFAULT_SCENES_META);

// Íconos disponibles para escenas personalizadas
const SCENE_ICON_CHOICES = ['🎬','🌙','☀️','🛋️','🧘','🎉','📖','☕','🍿','💡','🎵','🛏️'];

// Campos relevantes a capturar por tipo de dispositivo al guardar una escena
const SCENE_CAPTURE_FIELDS = {
  light:      ['on', 'intensity', 'colorTemp'],
  light_rgb:  ['on', 'intensity', 'colorTemp', 'hue', 'saturation', 'value', 'mode', 'scene'],
  curtain:    ['position'],
  switch:     ['on'],
  switch_3ch: ['ch1', 'ch2', 'ch3'],
};

// Devuelve los pasos a aplicar para una escena (override del huésped si existe, sino el default)
function getSceneSteps(id) {
  const override = app.scenes[id];
  if (override) return override.steps;
  return SCENES[id] || null;
}

// Lista de escenas a mostrar en la vista, en orden: defaults primero, luego personalizadas
function getSceneList() {
  const defaultIconSvgs = { moon: ICON_MOON, sun: ICON_SUN, film: ICON_FILM, zap: ICON_ZAP };
  const list = DEFAULT_SCENE_IDS.map(id => ({
    id,
    icon:  defaultIconSvgs[DEFAULT_SCENES_META[id].ico],
    title: t(DEFAULT_SCENES_META[id].titleKey),
    desc:  t(DEFAULT_SCENES_META[id].descKey),
    isCustom: false,
    hasOverride: !!app.scenes[id],
  }));
  Object.entries(app.scenes).forEach(([id, scene]) => {
    if (DEFAULT_SCENE_IDS.includes(id)) return;
    list.push({
      id,
      icon:  scene.icon || '🎬',
      title: scene.name || t('sceneCustomDesc'),
      desc:  t('sceneCustomDesc'),
      isCustom: true,
      hasOverride: true,
    });
  });
  return list;
}

// Captura el estado actual de los dispositivos controlables como pasos de escena
function captureSceneSteps() {
  const steps = [];
  Object.entries(app.config).forEach(([dev, cfg]) => {
    if (!cfg.available) return;
    const fields = SCENE_CAPTURE_FIELDS[cfg.type];
    if (!fields) return;
    const s = app.devices[dev] || {};
    const cmd = {};
    fields.forEach(f => { if (s[f] !== undefined) cmd[f] = s[f]; });
    if (Object.keys(cmd).length) steps.push({ dev, cmd });
  });
  return steps;
}

// ── EXTRAER TOKEN DE LA URL ────────────────────────────────────────────────────
function getToken() {
  const m = window.location.pathname.match(/\/room\/([A-Za-z0-9_-]+)/i);
  if (m) return m[1];
  const p = new URLSearchParams(window.location.search);
  if (p.get('token')) return p.get('token');
  const h = window.location.hash.replace('#', '');
  return h.length >= 6 ? h : null;
}

// ── API CALLS ─────────────────────────────────────────────────────────────────
// Sufijo ?room= para links multi-habitación: dice al backend cuál pieza del
// conjunto operar. Vacío en links de una sola habitación (comportamiento igual).
function roomParam(sep = '?') {
  return app.roomId ? `${sep}room=${encodeURIComponent(app.roomId)}` : '';
}

async function apiGet(token) {
  const res = await fetch(`${API}/room/${token}${roomParam()}`);
  if (res.status === 401) {
    // El código viaja en el cuerpo: sirve para decir "venció el 2 de agosto" en
    // vez de "inválido o expirado", que no le dice nada a nadie (I11).
    let code = 'TOKEN_INVALID', desde = null;
    try { const b = await res.clone().json(); code = b.code || code; desde = b.desde || null; } catch { /* sin cuerpo */ }
    const err = new Error(code);
    err.desde = desde;
    throw err;
  }
  if (res.status === 403) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.code === 'ACCESS_REVOKED' ? 'ACCESS_REVOKED' : b.code === 'ACCESS_PENDING' ? 'ACCESS_PENDING' : 'HTTP_403');
  }
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return res.json();
}

// ── DIRECTORIO DE SERVICIOS DEL HOTEL ────────────────────────────────────────
// ── INSTALAR LA APP (PWA) ────────────────────────────────────────────────────
// Deja un ícono en la pantalla de inicio que abre ESTA habitación directo, sin
// barra del navegador y sin volver a escanear el QR. El manifest se enlaza en
// caliente porque su URL lleva el token de la estadía.
let promptInstalar = null;

function prepararInstalacion() {
  if (!app.token) return;
  // El manifest debe estar en el DOM antes de que el navegador evalúe si la app
  // es instalable, por eso se inyecta apenas se conoce el token.
  let link = document.getElementById('manifest-link');
  if (!link) {
    link = document.createElement('link');
    link.id = 'manifest-link';
    link.rel = 'manifest';
    document.head.appendChild(link);
  }
  link.href = `/room/${app.token}/manifest.webmanifest`;

  if ('serviceWorker' in navigator) {
    (window.NEXO_SIM ? Promise.reject(new Error('simulación')) : navigator.serviceWorker.register('/sw-huesped.js')).catch(() => { /* sin SW la app sigue funcionando */ });
  }
  actualizarBotonAvisos();

  // Chrome/Android: el navegador avisa cuando se puede instalar. Se guarda el
  // evento para disparar el diálogo desde nuestro botón, en el momento en que
  // el huésped lo pida — no apenas entra, que es intrusivo.
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    promptInstalar = e;
    mostrarBotonInstalar();
  });
  window.addEventListener('appinstalled', () => {
    promptInstalar = null;
    document.getElementById('btn-instalar')?.classList.add('hidden');
  });
  mostrarBotonInstalar();
}

// Ya instalada (se abrió desde el ícono): no tiene sentido ofrecerlo de nuevo.
const yaInstalada = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

// Navegador embebido de otra app (WhatsApp, Instagram, Facebook…). Importa
// mucho: el huésped suele recibir el link por WhatsApp, y ahí el menú Compartir
// NO trae "Agregar a pantalla de inicio". Sin detectarlo, seguiría las
// instrucciones al pie de la letra y no encontraría la opción.
const esNavegadorEmbebido = () => {
  const ua = navigator.userAgent;
  if (/FBAN|FBAV|Instagram|Line|MicroMessenger/i.test(ua)) return true;
  // Safari real incluye "Safari"; los WebView de iOS (incluido WhatsApp) no.
  return esIOS() && /AppleWebKit/.test(ua) && !/Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
};

// Guía de instalación en pantalla, en vez de un alert() que se lee mal y se
// cierra al primer toque — hay que seguir los pasos con el teléfono en la mano.
function mostrarGuiaInstalacion() {
  const enSafari = !esNavegadorEmbebido();
  const pasos = enSafari
    ? `<ol class="inst-pasos">
         <li>Toca <b>Compartir</b> <span class="inst-ico">⬆️</span> en la barra de abajo</li>
         <li>Desliza y elige <b>“Agregar a pantalla de inicio”</b></li>
         <li>Confirma con <b>Agregar</b></li>
       </ol>
       <p class="inst-nota">Luego ábrela desde el ícono: así podrás recibir avisos aunque la cierres.</p>`
    : `<p class="inst-alerta">Estás viendo esto dentro de otra app (WhatsApp, Instagram…), y desde acá iOS no deja instalarla.</p>
       <ol class="inst-pasos">
         <li>Toca los <b>tres puntos</b> o <b>Compartir</b> y elige <b>“Abrir en Safari”</b></li>
         <li>Ya en Safari, toca <b>Compartir</b> <span class="inst-ico">⬆️</span> → <b>“Agregar a pantalla de inicio”</b></li>
       </ol>
       <button type="button" class="support-btn" id="inst-copiar" style="width:100%;justify-content:center;margin-top:10px">📋 Copiar el enlace</button>`;

  const ov = document.createElement('div');
  ov.className = 'inst-overlay';
  ov.innerHTML = `<div class="inst-caja">
      <div class="inst-titulo">${t('instalarApp')}</div>
      ${pasos}
      <button type="button" class="inst-cerrar">Entendido</button>
    </div>`;
  document.body.appendChild(ov);
  const cerrar = () => ov.remove();
  ov.querySelector('.inst-cerrar').onclick = cerrar;
  ov.onclick = e => { if (e.target === ov) cerrar(); };
  const copiar = ov.querySelector('#inst-copiar');
  if (copiar) {
    copiar.onclick = async () => {
      try { await navigator.clipboard.writeText(location.href); copiar.textContent = '✓ Enlace copiado — pégalo en Safari'; }
      catch { copiar.textContent = location.href; }   // sin permiso: se muestra para copiar a mano
    };
  }
}

function mostrarBotonInstalar() {
  const b = document.getElementById('btn-instalar');
  if (!b) return;
  // En iOS no existe beforeinstallprompt: se instala a mano desde Compartir, así
  // que el botón se muestra igual pero explica el paso.
  // En iOS no existe beforeinstallprompt: se instala a mano, así que el botón
  // se muestra igual y abre la guía paso a paso.
  b.classList.toggle('hidden', yaInstalada() || (!promptInstalar && !esIOS()));
  b.onclick = async () => {
    if (promptInstalar) {
      promptInstalar.prompt();
      await promptInstalar.userChoice.catch(() => {});
      promptInstalar = null;
      b.classList.add('hidden');
    } else {
      mostrarGuiaInstalacion();
    }
  };
}

// ── AVISOS (Web Push) ────────────────────────────────────────────────────────
// Lo que hace útil el chat: que la respuesta de recepción llegue aunque la app
// esté cerrada. Sin esto el huésped tiene que quedarse mirando la pantalla.
//
// iOS tiene una condición que Android no: desde iOS 16.4 el push funciona, pero
// SOLO si la app está instalada en la pantalla de inicio. Por eso, en iPhone sin
// instalar, el botón manda a instalar primero en vez de pedir un permiso que el
// sistema va a ignorar.
function actualizarBotonAvisos() {
  const b = document.getElementById('btn-avisos');
  if (!b) return;
  const soporta = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const yaOK    = soporta && Notification.permission === 'granted';

  b.classList.toggle('hidden', !soporta && !esIOS());
  b.querySelector('span').textContent = yaOK ? t('avisosActivos') : t('activarAvisos');
  b.disabled = yaOK;
  b.onclick = async () => {
    // En iPhone el push solo funciona con la app instalada: se manda a instalar
    // en vez de pedir un permiso que el sistema va a ignorar.
    if (esIOS() && !yaInstalada()) { mostrarGuiaInstalacion(); return; }
    await ensurePushSubscription();
    actualizarBotonAvisos();
    if (Notification.permission === 'granted') showToast?.(t('avisosListos'));
  };
}

// ── CHAT CON RECEPCIÓN ───────────────────────────────────────────────────────
// La conversación queda dentro del sistema (antes salía a WhatsApp y el
// historial se perdía). Se sondea cada 15 s mientras la vista está abierta, y
// más lento en segundo plano solo para el contador de no leídos.
let chatCache = [];
let chatTimer = null;

async function cargarChat({ silencioso = false } = {}) {
  if (!app.token) return;
  try {
    const msgs = await fetch(`${API}/room/${app.token}/chat`).then(r => r.ok ? r.json() : []);
    const hayNuevos = msgs.length !== chatCache.length;
    chatCache = msgs;
    if (!silencioso || hayNuevos) renderChat();
    actualizarBadgeChat();
  } catch { /* sin conexión: se reintenta en el próximo ciclo */ }
}

function renderChat() {
  const box = document.getElementById('chat-mensajes');
  if (!box) return;
  if (!chatCache.length) {
    box.innerHTML = `<div class="chat-vacio">${t('chatVacio')}</div>`;
    return;
  }
  const hora = iso => new Date(iso).toLocaleTimeString(LOCALES[app.lang] || 'es-CL',
    { hour: '2-digit', minute: '2-digit' });
  // El asistente se distingue del hotel: el huésped tiene que saber si le
  // respondió una persona o el sistema, sobre todo cuando le pide que aclare algo.
  box.innerHTML = chatCache.map(m => `
    <div class="chat-msg ${m.de === 'huesped' ? 'mio' : m.de === 'bot' ? 'bot' : 'hotel'}">
      ${escapeHtml(m.texto)}
      <span class="chat-meta">${
        m.de === 'huesped' ? t('chatTu')
        : m.de === 'bot'   ? t('chatAsistente')
        : escapeHtml(m.autor || t('chatHotel'))} · ${hora(m.at)}</span>
    </div>`).join('');
  box.scrollTop = box.scrollHeight;

  // Solo si el navegador trae reconocimiento y hay aparatos: si no, el botón
  // flotante no existe y ofrecer voz sería mentir.
  const pista = document.getElementById('chat-voz-hint');
  if (pista) pista.classList.toggle('hidden', !document.getElementById('voice-btn'));
}

// Marca en el menú cuántas respuestas del hotel no se han visto.
function actualizarBadgeChat() {
  const b = document.getElementById('chat-badge');
  if (!b) return;
  const n = chatCache.filter(m => m.de !== 'huesped' && !m.leidoHuesped).length;
  b.textContent = n;
  b.classList.toggle('hidden', n === 0 || currentView === 'chat');
}

async function enviarChat(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const texto = input.value.trim();
  if (!texto) return;
  input.value = '';
  // Se pinta al instante: el huésped no debe esperar la ida y vuelta.
  chatCache.push({ de: 'huesped', texto, at: new Date().toISOString(), leidoHuesped: true });
  renderChat();
  try {
    await fetch(`${API}/room/${app.token}/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });
    await cargarChat();
  } catch {
    // Falló el envío: se avisa en vez de dejar el mensaje como si hubiera salido.
    chatCache.pop();
    renderChat();
    showToast?.(t('errNetwork') || 'No se pudo enviar. Revisa tu conexión.');
  }
}

function iniciarChat() {
  const form = document.getElementById('chat-form');
  if (form && !form.dataset.listo) {
    form.addEventListener('submit', enviarChat);
    form.dataset.listo = '1';
  }
  cargarChat();
  if (!chatTimer) chatTimer = setInterval(() => cargarChat({ silencioso: true }), 15000);
}

// Escapa el texto del huésped: se pinta con innerHTML y no puede inyectar HTML.
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Íconos de la ficha de servicio (16px, mismo trazo que el resto de la app).
const ICON_CLOCK_SRV = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
const ICON_CAL_SRV   = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
const ICON_PIN_SRV   = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const ICON_USERS_SRV = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
const ICON_ALERT_SRV = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

// Días como los nombra una persona: 1=lunes … 7=domingo.
const SRV_DIAS = { 1: 'lun', 2: 'mar', 3: 'mié', 4: 'jue', 5: 'vie', 6: 'sáb', 7: 'dom' };

function srvDuracion(min) {
  if (!min) return '';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Las líneas de detalle: solo las que el hotel completó. Un servicio informativo
// simple no debe verse como una ficha a medio llenar.
function srvDetalle(s) {
  const filas = [];
  const dur = srvDuracion(s.duracion_min);
  if (dur)                   filas.push([ICON_CLOCK_SRV, dur]);
  if (s.horarios?.length)    filas.push([ICON_CLOCK_SRV, 'Salidas: ' + s.horarios.join(' · ')]);
  if (s.dias_semana?.length) filas.push([ICON_CAL_SRV, s.dias_semana.map(d => SRV_DIAS[d] || d).join(', ')]);
  if (s.punto_encuentro)     filas.push([ICON_PIN_SRV, s.punto_encuentro]);

  const cupo = [];
  if (s.cupo_min && s.cupo_max)      cupo.push(`${s.cupo_min} a ${s.cupo_max} personas`);
  else if (s.cupo_max)               cupo.push(`hasta ${s.cupo_max} personas`);
  else if (s.cupo_min)               cupo.push(`desde ${s.cupo_min} personas`);
  if (s.cupo_recomendado)            cupo.push(`ideal ${s.cupo_recomendado}`);
  if (cupo.length)           filas.push([ICON_USERS_SRV, cupo.join(' · ')]);

  if (s.anticipacion_horas)  filas.push([ICON_ALERT_SRV, `Avisar con ${s.anticipacion_horas} h de anticipación`]);

  return filas.length
    ? `<div class="srv-detalle">${filas.map(([ico, txt]) =>
        `<div class="srv-dato">${ico}<span>${escapeHtml(txt)}</span></div>`).join('')}</div>`
    : '';
}

function srvIncluye(s) {
  const bloques = [];
  if (s.incluye)    bloques.push(`<div class="srv-inc"><span class="srv-inc-lbl">Incluye</span>${escapeHtml(s.incluye)}</div>`);
  if (s.no_incluye) bloques.push(`<div class="srv-inc srv-no"><span class="srv-inc-lbl">No incluye</span>${escapeHtml(s.no_incluye)}</div>`);
  if (s.politica_cancelacion) bloques.push(`<div class="srv-cancel">${escapeHtml(s.politica_cancelacion)}</div>`);
  return bloques.join('');
}




// ── ACTIVIDAD DE LA HABITACIÓN (A10) ────────────────────────────────────────
//
// 🔴 Es lo que hace defendible que el hotel pueda operar la pieza de un huésped
// alojado sin pedirle permiso. Ese permiso se decidió así por la misma razón que
// en C9 —uno que hay que pedirle a alguien dormido no se pide, se saltea— y solo
// se sostiene si la persona puede ver qué se hizo.
async function loadActividadHuesped() {
  const card = document.getElementById('actividad-card');
  if (!card || window.location.protocol === 'file:' || !app.token) return;
  let items = [];
  try {
    const r = await fetch(`${API}/room/${app.token}/actividad${roomParam()}`);
    if (!r.ok) return;
    items = (await r.json()).items || [];
  } catch { return; }

  // Ahora el historial es su propia pestaña: en vez de ocultar la tarjeta cuando
  // no hay nada (dejaría la vista en blanco), se muestra un estado vacío.
  if (!items.length) {
    document.getElementById('actividad-lista').innerHTML =
      `<p class="directorio-desc">${escapeHtml(t('actEmpty'))}</p>`;
    return;
  }

  // El QUIÉN va primero y con marca propia: es la pregunta que la persona
  // trae cuando abre esto —"¿alguien estuvo acá?"— y enterrarlo entre el
  // texto haría que tenga que leer cada línea para encontrarla.
  const marca = { hotel: "🛎", huesped: "👤", sistema: "⚙️" };
  document.getElementById('actividad-lista').innerHTML = items.map(x => {
    const priv = x.nivel === 'privacidad';
    const fecha = new Date(x.at).toLocaleString(app.lang === 'en' ? 'en-GB' : 'es-CL',
      { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `<div class="directorio-item"${priv ? ' style="border-left:3px solid var(--alert)"' : ''}>
      <div><strong>${marca[x.quien] || "•"} ${escapeHtml(x.texto)}</strong><br>
      <span class="directorio-desc">${escapeHtml(fecha)}${
        x.quien === 'hotel' ? ' · ' + t('actPorHotel') : ''}</span></div>
    </div>`;
  }).join('');
}
// ── MODO ECO DEL HUÉSPED (A8) y su control desde el aviso (A8b, rediseñado) ──
//
// 🔴 Estas rutas existían y ninguna pantalla las llamaba; lo encontró el guardia de
// alcanzabilidad al corregir un falso positivo (cualquier ruta colgada de
// /room/:token pasaba sola). Hoy la tarjeta de abajo (loadEcoHuesped) cablea el
// modo eco, y el aviso "ahorro activado" da el control de 3 estados
// (mantener/pausar/quitar, POST /eco/control, ver I15). La vieja confirmación
// "¿saliste?" quedó retirada de la UI (su ruta quedó anotada en la lista DEUDA).
async function loadEcoHuesped() {
  const card = document.getElementById('eco-card');
  if (!card || window.location.protocol === 'file:' || !app.token) return;
  // Delegación sobre la tarjeta: las funciones se repintan en cada carga, así
  // que un listener por casilla se perdería en el primer repintado.
  if (!card.__enganchada) {
    card.addEventListener('change', handleEcoClick);
    document.getElementById('eco-activo')?.addEventListener('change', guardarEcoHuesped);
    card.__enganchada = true;
  }
  let est;
  try {
    const r = await fetch(`${API}/room/${app.token}/eco${roomParam()}`);
    if (!r.ok) return;
    est = await r.json();
  } catch { return; }

  // Si el plan de la pieza no ofrece ninguna función, la tarjeta no aparece:
  // un interruptor que no controla nada es peor que no tenerlo.
  card.classList.toggle('hidden', !(est.funciones || []).length);
  if (!(est.funciones || []).length) return;

  document.getElementById('eco-activo').checked = !!est.activo;
  document.getElementById('eco-funciones').innerHTML = est.funciones.map(f => `
    <label class="support-btn" style="width:100%;justify-content:flex-start;gap:10px;margin-bottom:6px;opacity:${est.activo ? 1 : 0.55}">
      <input type="checkbox" data-action="eco-func" data-clave="${f.clave}"
        ${f.tildada ? 'checked' : ''} ${est.activo ? '' : 'disabled'}>
      <span><strong>${escapeHtml(f.etiqueta)}</strong><br>
      <span class="directorio-desc">${escapeHtml(f.detalle || '')}</span></span>
    </label>`).join('');

  // Resumen de ahorro (resumen_ahorro): se pide aparte y solo si está tildada.
  pintarAhorroEco(est);
}

// "Cuánto llevo ahorrado" (A8 resumen_ahorro). El número es una ESTIMACIÓN del
// consumo evitado mientras la pieza estuvo vacía —no una medición— y así se dice.
// Si la casilla no está tildada, o no hay ahorro todavía, no se pinta un monto.
async function pintarAhorroEco(est) {
  const box = document.getElementById('eco-ahorro');
  if (!box) return;
  const tildada = (est.funciones || []).some(f => f.clave === 'resumen_ahorro' && f.tildada);
  if (!est.activo || !tildada) { box.classList.add('hidden'); box.innerHTML = ''; return; }
  let a;
  try {
    const r = await fetch(`${API}/room/${app.token}/eco/ahorro${roomParam()}`);
    if (!r.ok) { box.classList.add('hidden'); return; }
    a = await r.json();
  } catch { box.classList.add('hidden'); return; }
  if (!a || !a.habilitado) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  // 0 es finito y legítimo: al principio de la estadía todavía no hay ahorro. Se
  // muestra un mensaje, no un "$0" que se lee como que el sistema no sirve.
  const hayAhorro = !a.sinDatos && Number(a.pesosEvitado) > 0;
  if (!hayAhorro) {
    box.innerHTML = `<div class="manual-note" style="margin-top:10px">${escapeHtml(t('ecoAhorroVacio'))}</div>`;
    return;
  }
  const pesos = '$' + Math.round(a.pesosEvitado).toLocaleString('es-CL') + ' CLP';
  box.innerHTML = `
    <div style="margin-top:12px;padding:12px;border-radius:12px;background:rgba(0,157,113,.10)">
      <div class="section-label">${escapeHtml(t('ecoAhorroTitulo'))}</div>
      <div style="font-size:22px;font-weight:700;color:#009D71;margin:2px 0 4px">≈ ${escapeHtml(pesos)}</div>
      <div class="directorio-desc">${escapeHtml(t('ecoAhorroEstimadoNota'))}</div>
    </div>`;
}

// El estado completo se manda entero en cada cambio y no como parche: el
// backend normaliza `{activo, funciones}` de una, y mandar solo lo que cambió
// obligaría al cliente a llevar una copia del estado que puede desincronizarse.
async function guardarEcoHuesped() {
  const activo = document.getElementById('eco-activo').checked;
  const funciones = {};
  document.querySelectorAll('[data-action="eco-func"]').forEach(el => {
    funciones[el.dataset.clave] = el.checked;
  });
  try {
    await fetch(`${API}/room/${app.token}/eco${roomParam()}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo, funciones }),
    });
    // Se recarga en vez de repintar con lo que mandamos: el hotel puede tener
    // funciones deshabilitadas y el servidor es quien resuelve los defaults.
    await loadEcoHuesped();
  } catch { showToast(t('ecoError')); }
}

// ── A8b ─────────────────────────────────────────────────────────────────────
function abrirPreguntaSalida() {
  const ov = document.getElementById('eco-salida-overlay');
  if (!ov) return;
  // El enganche va acá, en el único camino que abre la hoja: así no depende de
  // que alguna otra vista se haya cargado antes.
  if (!ov.__enganchada) {
    ov.addEventListener('click', handleEcoClick);
    document.getElementById('eco-salida-cerrar')
      ?.addEventListener('click', () => ov.classList.add('hidden'));
    ov.__enganchada = true;
  }
  ov.classList.remove('hidden');
}

// Modo eco del huésped: mantener / pausar (vuelve solo) / quitar. Reemplaza la
// vieja "¿saliste?": el aviso INFORMA que se activó el ahorro y da control.
async function controlEco(accion) {
  try {
    await fetch(`${API}/room/${app.token}/eco/control${roomParam()}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion }),
    });
    document.getElementById('eco-salida-overlay').classList.add('hidden');
    showToast(t('ecoOk'));
  } catch { showToast(t('ecoError')); }
}

// Aviso al abrir: SOLO si el hotel arranca a sus huéspedes con modo eco activado
// (`porDefectoDelHotel`) y el huésped no lo desactivó. Una vez por estadía.
async function chequearModoEcoBienvenida() {
  if (!app.token || localStorage.getItem(`nexo_eco_bienvenida_${app.token}`)) return;
  try {
    const est = await (await fetch(`${API}/room/${app.token}/eco${roomParam()}`)).json();
    if (est && est.activo && est.porDefectoDelHotel) {
      document.getElementById('eco-bienvenida-overlay')?.classList.remove('hidden');
    }
  } catch { /* sin conexión: no molestar */ }
}

function handleEcoClick(e) {
  const ctrl = e.target.closest('[data-action="eco-control"]');
  if (ctrl) { controlEco(ctrl.dataset.accion); return; }
  const func = e.target.closest('[data-action="eco-func"]');
  if (func) guardarEcoHuesped();
}
// ── AGENDA DEL HUÉSPED (D4) ─────────────────────────────────────────────────
//
// 🔴 El módulo `agenda.js` existía desde el 07-08-2026 con 24 tests verdes y
// ninguna forma de llegar a él: el huésped no podía reservar nada. Esta es la
// mitad que faltaba.
//
// Reservar un tour no es solo una venta: es lo que le dice al sistema que la
// habitación va a estar vacía de 9 a 18, y eso habilita el ahorro profundo. Es
// la ventaja que ningún competidor tiene — leen sensores, no la agenda.
async function loadAgendaHuesped() {
  const wrap = document.getElementById('agenda-wrap');
  if (wrap && !wrap.__agendaEnganchada) { wrap.addEventListener('click', handleAgendaClick); wrap.__agendaEnganchada = true; }
  if (!wrap || window.location.protocol === 'file:' || !app.token) return;
  let servicios = [], mias = [];
  try {
    const [a, b] = await Promise.all([
      fetch(`${API}/room/${app.token}/agenda/servicios`).then(r => r.ok ? r.json() : { servicios: [] }),
      fetch(`${API}/room/${app.token}/agenda`).then(r => r.ok ? r.json() : { reservas: [] }),
    ]);
    servicios = a.servicios || []; mias = b.reservas || [];
  } catch { return; }

  // Si el hotel no cargó nada agendable, la sección entera no aparece: un
  // encabezado sobre una lista vacía se lee como que algo no cargó.
  wrap.classList.toggle('hidden', !servicios.length && !mias.length);
  if (!servicios.length && !mias.length) return;

  document.getElementById('agenda-mias').innerHTML = !mias.length ? '' :
    mias.map(r => `
      <div class="directorio-item">
        <div><strong>${escapeHtml(r.nombre)}</strong><br>
        <span class="directorio-desc">${escapeHtml(r.fecha)} · ${escapeHtml(r.hora)} · ${r.personas} p.</span></div>
        <button class="btn-sm" data-action="agenda-cancelar" data-id="${r.id}">${t('agendaCancelar')}</button>
      </div>`).join('');

  document.getElementById('agenda-lista').innerHTML = servicios.map(s => {
    // Cada horario es una franja con su propio cupo: se ofrecen como botones y
    // no como un campo de hora libre, porque un huésped no puede adivinar a qué
    // hora sale el tour.
    const horas = (s.horarios || []).map(h =>
      `<button class="btn-sm" data-action="agenda-pedir" data-srv="${s.id}" data-hora="${escapeHtml(h)}">${escapeHtml(h)}</button>`).join(' ');
    return `
      <div class="directorio-item srv-rica">
        <div>
          <strong>${escapeHtml(s.nombre)}</strong>
          <div class="directorio-desc">${escapeHtml(s.descripcion || '')}</div>
          <div class="directorio-desc">${s.duracionMin} min${s.precio ? ' · ' + fPrecio(s.precio) : ''}</div>
          <div style="margin-top:6px">${horas}</div>
        </div>
      </div>`;
  }).join('');
}

// El precio viene en la moneda del hotel y SIN convertir (regla 3): no se
// multiplica por nada acá.
const fPrecio = (n) => new Intl.NumberFormat('es-CL').format(n);

async function agendarHuesped(servicioId, hora) {
  // La fecha es HOY por defecto y se pregunta, porque un tour se reserva casi
  // siempre para mañana y dar por hecho "hoy" haría que el huésped reserve mal
  // sin darse cuenta.
  const hoy = new Date();
  const p = n => String(n).padStart(2, '0');
  const sug = hoy.getFullYear() + '-' + p(hoy.getMonth() + 1) + '-' + p(hoy.getDate());
  const fecha = prompt(t('agendaFecha'), sug);
  if (!fecha) return;
  const personas = Number(prompt(t('agendaPersonas'), '1')) || 1;
  try {
    const res = await fetch(`${API}/room/${app.token}/agenda`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ servicioId, fecha, hora, personas }),
    });
    const body = await res.json();
    // El 409 de cupo trae cuántos quedan: decirlo evita el segundo intento a
    // ciegas, que es lo que hace que la gente termine llamando a recepción.
    if (!res.ok) { showToast(body.error || t('agendaError')); return; }
    showToast(t('agendaOk'));
    await loadAgendaHuesped();
  } catch { showToast(t('agendaError')); }
}

async function cancelarAgendaHuesped(id) {
  if (!confirm(t('agendaCancelarConf'))) return;
  try {
    await fetch(`${API}/room/${app.token}/agenda/${id}`, { method: 'DELETE' });
    await loadAgendaHuesped();
  } catch { showToast(t('agendaError')); }
}
// Delegación en la vista de servicios, que es donde vive la agenda. Se engancha
// una sola vez sobre el contenedor: las tarjetas se repintan en cada carga y un
// listener por botón se perdería en el primer repintado.
function handleAgendaClick(e) {
  const pedir = e.target.closest('[data-action="agenda-pedir"]');
  if (pedir) { agendarHuesped(pedir.dataset.srv, pedir.dataset.hora); return; }
  const cancelar = e.target.closest('[data-action="agenda-cancelar"]');
  if (cancelar) cancelarAgendaHuesped(cancelar.dataset.id);
}

async function loadDirectorioServicios() {
  const el = document.getElementById('servicios-directorio');
  if (!el || window.location.protocol === 'file:' || !app.token) return;
  try {
    const res = await fetch(`${API}/room/${app.token}/servicios`);
    if (!res.ok) return;
    const lista = await res.json();
    if (!lista.length) {
      el.innerHTML = `<div class="directorio-desc">${t('directorioEmpty')}</div>`;
      return;
    }
    el.innerHTML = lista.map(s => {
      const detalle = srvDetalle(s);
      const extras  = srvIncluye(s);
      // Con ficha completa la tarjeta crece; sin ella se mantiene la fila
      // compacta de siempre, que es lo correcto para "Wi-Fi" o "Desayuno 7-10".
      const rica = detalle || extras || s.imagen_url;
      return `
      <div class="directorio-item ${s.tipo === 'upsell' ? 'upsell' : ''} ${rica ? 'srv-rica' : ''}">
        ${s.imagen_url ? `<img class="srv-foto" src="${escapeHtml(s.imagen_url)}" alt="" loading="lazy"
             data-remove-on-error>` : ''}
        <div class="srv-cuerpo">
          <div class="srv-cabecera">
            <div class="directorio-nombre">${s.tipo === 'upsell' ? `<span style="display:inline-flex;vertical-align:-1px;margin-right:4px;color:var(--teal)">${ICON_STAR}</span>` : ''}${escapeHtml(s.nombre)}</div>
            ${s.precio_clp ? `<div class="directorio-precio">$${s.precio_clp.toLocaleString('es-CL')}</div>` : ''}
          </div>
          ${s.descripcion ? `<div class="directorio-desc">${escapeHtml(s.descripcion)}</div>` : ''}
          ${detalle}
          ${extras}
        </div>
      </div>`;
    }).join('');
  } catch { /* directorio es informativo — falla en silencio, no bloquea el resto de la app */ }
}

async function apiCommand(device, command) {
  // En modo estático (file://) no hay servidor — simular éxito
  if (window.NEXO_SIM) return window.NEXO_SIM.comando(device, command);
  if (window.location.protocol === 'file:') return { success: true };

  const res = await fetch(`${API}/room/${app.token}/command${roomParam()}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ device, command }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(body.error || `HTTP_${res.status}`);
  }
  return res.json();
}

// ── ANIMACIÓN DE LA BARRA DE CORTINA ──────────────────────────────────────────
// Las cortinas motorizadas tardan en moverse de verdad; antes la barra saltaba
// de inmediato al extremo. Esto la mueve gradualmente hasta el destino, y si se
// presiona Parar antes de llegar, queda congelada donde iba en ese momento.
const CURTAIN_TRAVEL_MS = 35000; // default si el instalador no fijó uno por aparato

function stopCurtainAnim(key) {
  if (app._curtainAnim[key]) {
    clearInterval(app._curtainAnim[key]);
    delete app._curtainAnim[key];
  }
}

function animateCurtainTo(key, target) {
  stopCurtainAnim(key);
  const from = app.devices[key]?.position ?? 0;
  if (from === target) return;
  const duration = (Math.abs(target - from) / 100) * (app.config[key]?.travelMs || CURTAIN_TRAVEL_MS);
  const start = Date.now();

  app._curtainAnim[key] = setInterval(() => {
    const progress = Math.min(1, (Date.now() - start) / duration);
    const pos = Math.round(from + (target - from) * progress);
    app.devices[key].position = pos;

    const slider = document.querySelector(`input[data-action="curtain-pos"][data-key="${key}"]`);
    if (slider) slider.value = pos;
    const valEl = document.getElementById(`curtain-val-${key}`);
    if (valEl) valEl.textContent = pos + '%';

    if (progress >= 1) {
      stopCurtainAnim(key);
      updateCard(key); // refresca el texto de estado (Abierta/Cerrada) al llegar
    }
  }, 100);
}

async function curtainControl(key, ctrl) {
  const before = app.devices[key]?.position ?? 0;
  if (ctrl === 'open'  && before === 100) { showToast(t('toastCurtainMaxOpen'), ''); return; }
  if (ctrl === 'close' && before === 0)   { showToast(t('toastCurtainMaxClosed'), ''); return; }
  if (ctrl === 'stop') {
    stopCurtainAnim(key); // congela la posición donde iba la animación
  } else {
    animateCurtainTo(key, ctrl === 'open' ? 100 : 0);
  }
  try {
    await apiCommand(key, { control: ctrl });
  } catch (err) {
    stopCurtainAnim(key);
    app.devices[key].position = before;
    updateCard(key);
    showToast(t('toastCmdFail'), 'error');
    console.error('[CMD]', key, { control: ctrl }, err.message);
  }
}

// ── COMANDO CON OPTIMISTIC UI ─────────────────────────────────────────────────
async function doCmd(deviceKey, command) {
  const prev = { ...app.devices[deviceKey] };
  // `dimeoDesde`/`dimeoHasta` son pistas para el server (fundido de apagar/
  // encender), no estado del aparato: no las mezclamos en app.devices, pero sí
  // viajan en el comando.
  const { dimeoDesde, dimeoHasta, ...estado } = command;
  Object.assign(app.devices[deviceKey], estado);
  updateCard(deviceKey);

  try {
    await apiCommand(deviceKey, command);
  } catch (err) {
    app.devices[deviceKey] = prev;
    updateCard(deviceKey);
    showToast(t('toastCmdFail'), 'error');
    console.error('[CMD]', deviceKey, command, err.message);
  }
}

// ── BLOQUEO DEL TOGGLE DURANTE EL FUNDIDO ─────────────────────────────────────
// El on/off de una luz dispara un fundido en el server (~1-2 s, por pasos). Un
// segundo toque a mitad manda otro on/off que pisa los pasos y deja la luz en un
// estado inconsistente (lo reportó el hotel). Bloqueamos el toggle de ESA luz
// mientras dura, y le ponemos la clase `fading` para que se vea "ocupado". Las
// duraciones cubren el fundido del server (SEGUNDOS_APAGADO/ENCENDIDO_DIMEO en
// backend) + el ida y vuelta del último comando; si allá se alargan, subí estas.
const FADE_LOCK_MS = { off: 2600, on: 1500 };
function lockFade(key, dir) {
  app._fadeLock = app._fadeLock || {};
  clearTimeout(app._fadeLock[key] && app._fadeLock[key].timer);
  const marcar = (on) => document
    .querySelectorAll(`[data-action^="toggle-light"][data-key="${key}"]`)
    .forEach(el => el.classList.toggle('fading', on));
  marcar(true);
  app._fadeLock[key] = { timer: setTimeout(() => { delete app._fadeLock[key]; marcar(false); }, FADE_LOCK_MS[dir] || 2600) };
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // ── MODO ESTÁTICO: archivo abierto directamente desde el disco ──────────────
  // Para un preview rápido sin servidor. En producción siempre corre con Node.
  if (window.NEXO_SIM) {   // simulación 3D: datos y comandos van por puente-simulacion.js
    renderApp(window.NEXO_SIM.datos(STATIC_DEMO));
    window.NEXO_SIM.listo();
    return;
  }
  if (window.location.protocol === 'file:') {
    renderApp(STATIC_DEMO);
    return;
  }

  // ── MODO NORMAL: con servidor Express ──────────────────────────────────────
  app.token = getToken();
  // Habitación seleccionada del link multi-habitación (?room=) — antes del
  // primer apiGet, que ya la incluye vía roomParam().
  app.roomId = new URLSearchParams(location.search).get('room') || null;

  // 🔴 A8b: el push abre la app con ?eco=salida y hasta hoy no lo leía NADIE, así
  // que la pregunta se mandaba y no había dónde contestarla. Es lo que dejaba
  // inalcanzable el ahorro profundo del sistema.
  //
  // Se lee acá y se muestra al final del arranque: abrir la hoja antes de tener
  // el token resuelto la dejaría sin a dónde mandar la respuesta.
  app.preguntarSalida = new URLSearchParams(location.search).get('eco') === 'salida';

  if (!app.token) {
    showError('invalid');
    return;
  }

  try {
    const data = await apiGet(app.token);
    renderApp(data);
    // Recién con la app pintada: la hoja necesita el token resuelto para poder
    // mandar la respuesta, y mostrarla sobre una pantalla vacía asusta.
    if (app.preguntarSalida) abrirPreguntaSalida();
  } catch (err) {
    showError(err.message === 'TOKEN_INVALID' ? 'invalid'
      : err.message === 'TOKEN_VENCIDO' ? 'vencido'
      : err.message === 'TOKEN_NO_EMPEZO' ? 'noempezo'
      : err.message === 'TOKEN_REVOCADO' ? 'revoked'
      : err.message === 'ACCESS_REVOKED' ? 'revoked'
      : err.message === 'ACCESS_PENDING' ? 'pending' : 'server', err.desde);
  }
});

function renderApp(data) {
  app.data = data;

  // Construir estado — un dispositivo que el hotel ocultó no entra a app.config,
  // así que automáticamente queda afuera de la grilla, de las escenas nuevas,
  // de favoritos, etc. (todo eso ya opera solo sobre las claves de app.config).
  for (const [key, dev] of Object.entries(data.devices)) {
    if (dev.hidden) continue;
    app.config[key]  = { type: dev.type, label: dev.label, channels: dev.channels, available: dev.available, manualUnlock: !!dev.manualUnlock, irButtons: dev.irButtons, irMeta: dev.irMeta, caps: dev.caps, icon: dev.icon, programable: dev.programable, travelMs: dev.travelMs };
    app.devices[key] = dev.state ? { ...dev.state } : {};
  }

  app.plan = data.plan || 'base';
  app.hasBathroom = data.hasBathroom !== false;
  app.scenes = data.scenes || {};

  // Idioma y accesibilidad del huésped (en modo estático, localStorage manda)
  app.lang = (window.location.protocol === 'file:' && localStorage.getItem('nexo_lang'))
    || data.lang || 'es';
  if (!I18N[app.lang]) app.lang = 'es';
  app.a11y = (window.location.protocol === 'file:' && localStorage.getItem('nexo_a11y'))
    || data.accessibility || 'none';
  app.dnd = data.dnd || false;
  app.alarmSensors = data.alarmSensors || {};
  // Link multi-habitación: guardar el conjunto y la pieza actual, y armar el
  // selector del header (se oculta si el token cubre una sola habitación).
  app.rooms  = data.rooms || [];
  app.roomId = data.roomId || (app.rooms[0]?.id ?? null);
  setupRoomSwitcher();

  try {
    app.favorites = JSON.parse(localStorage.getItem(`nexo_favs_${app.token || 'static'}`) || '[]');
  } catch { app.favorites = []; }

  app.theme = localStorage.getItem('nexo_theme') || 'auto';

  document.documentElement.lang = app.lang;
  applyA11y();
  applyTheme();
  setInterval(applyTheme, 10 * 60 * 1000);
  // Poll cada 6s (antes 20s): el estado del server está cacheado (Zigbee es
  // instantáneo, Tuya local usa conexión persistente), así que es barato y baja
  // la latencia del aviso de puerta/ventana a ~6s en vez de ~20s.
  setInterval(refreshRoomState, 6 * 1000);
  applyTexts();

  startClock(new Date(data.checkout));

  // Banner demo
  if (data.demoMode) document.getElementById('demo-banner').style.display = 'flex';

  // Grid de dispositivos (incluye funciones del plan y TV) y vista de clima
  renderGrid();
  renderFavorites();
  renderScenes();
  loadDirectorioServicios();
  cargarChat({ silencioso: true });   // trae no leídos para el contador del menú
  prepararInstalacion();               // manifest + service worker de esta estadía
  renderClimateView();
  renderSecurityView();

  // Ocultar la sección "Clima" del menú si el plan de la habitación no la incluye
  if (planLevel(app.plan) < PLAN_TIERS.premium) {
    document.querySelector('.nav-item[data-view="climate"]')?.classList.add('hidden');
  }

  // Sin sensores de puerta/ventana: ocultar Seguridad del menú (no hay nada que armar).
  if (!securityDeviceKeys().length) {
    document.querySelector('.nav-item[data-view="security"]')?.classList.add('hidden');
  }

  // PLAN SOLO PMS: la habitación no tiene domótica contratada. Se ocultan las
  // secciones de control (Habitación, Escenas, Clima, Seguridad) — no por falta
  // de aparatos, sino porque el plan no las incluye — y la app arranca en
  // Servicios: pedidos a recepción y lo que ofrece el hotel. Es lo que hace
  // vendible el PMS a un hotel que no compra IoT.
  if (esPlanPMS(app.plan)) {
    ['room', 'scenes', 'climate', 'security'].forEach(v =>
      document.querySelector(`.nav-item[data-view="${v}"]`)?.classList.add('hidden'));
    switchView('servicios');
  } else if (!Object.keys(app.config).length) {
    // Con plan IoT pero sin aparatos instalados todavía: mismo efecto práctico,
    // no hay nada que controlar.
    document.querySelector('.nav-item[data-view="room"]')?.classList.add('hidden');
    document.querySelector('.nav-item[data-view="scenes"]')?.classList.add('hidden');
    document.querySelector('.nav-item[data-view="climate"]')?.classList.add('hidden');
    switchView('support');
  }

  // La agenda (itinerario + servicios agendables) va en Servicios y sirve para
  // TODO plan, no solo PMS: antes se cargaba solo en el branch PMS y en una pieza
  // con IoT el huésped nunca veía su itinerario. loadAgendaHuesped se auto-oculta
  // si el hotel no ofrece nada agendable, así que llamarla siempre es seguro.
  loadAgendaHuesped();

  restoreView();   // volver a donde estaba, si esa vista sigue disponible

  // Mostrar app
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');

  // Botón de voz push-to-talk (solo si el navegador trae reconocimiento)
  initVoice();

  // Push instantáneo de alarmas de puerta/ventana (SSE), sin esperar el poll
  initInstantAlarms();

  // Si ya había alarmas armadas de una sesión previa y el permiso ya está dado,
  // re-suscribir en silencio (por si expiró la suscripción o es otro dispositivo).
  if (Object.values(app.alarmSensors || {}).some(Boolean) &&
      typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    ensurePushSubscription();
  }

  // Delegación de eventos para la vista de Escenas
  document.getElementById('scenes-grid').addEventListener('click', handleSceneGridClick);
  document.getElementById('scenes-grid').addEventListener('keydown', handleSceneGridKeydown);
  document.getElementById('scene-new-btn').addEventListener('click', () => expandScenesConfig('create'));
  document.getElementById('scene-modal-cancel').addEventListener('click', closeSceneModal);
  document.getElementById('scene-modal-save').addEventListener('click', saveNewScene);
  document.getElementById('scenes-config-save-btn').addEventListener('click', saveScenesConfig);
  document.getElementById('scenes-config-cancel-btn').addEventListener('click', collapseScenesConfig);

  const scenesDeviceGrid = document.getElementById('scenes-device-grid');
  scenesDeviceGrid.addEventListener('click',  handleGridClick);
  scenesDeviceGrid.addEventListener('input',  handleGridInput);
  scenesDeviceGrid.addEventListener('change', handleGridInput);
  scenesDeviceGrid.addEventListener('click',  handlePlanGridClick);
  scenesDeviceGrid.addEventListener('input',  handlePlanGridInput);
  scenesDeviceGrid.addEventListener('change', handlePlanGridInput);

  // Delegación de eventos para los controles del grid
  const grid = document.getElementById('device-grid');
  grid.addEventListener('click',  handleGridClick);
  grid.addEventListener('input',  handleGridInput);
  grid.addEventListener('change', handleGridInput);
  setupColorWheelDrag(grid);
  // La TV vive dentro de Controles inteligentes (no es un dispositivo Tuya
  // real, es un placeholder) — reusa el mismo manejador que las demás
  // funciones del plan, así que también se enlaza acá.
  grid.addEventListener('click',  handlePlanGridClick);
  grid.addEventListener('input',  handlePlanGridInput);
  grid.addEventListener('change', handlePlanGridInput);

  // El control agrandado (modal de accesibilidad) reusa los mismos manejadores
  // — es la misma tarjeta, solo más grande, con la misma data-key/data-action.
  const enlargeBody = document.getElementById('enlarge-modal-body');
  enlargeBody.addEventListener('click',  handleGridClick);
  enlargeBody.addEventListener('input',  handleGridInput);
  enlargeBody.addEventListener('change', handleGridInput);

  // Delegación de eventos para la barra de favoritos
  document.getElementById('favorites-bar')?.addEventListener('click', handleFavBarClick);

  // Delegación de eventos para la vista de Clima (Premium). También necesita
  // handleGridClick (no solo handlePlanGridClick) porque el botón de reportar
  // problema (featureIconsRow) usa data-action="report-problem", manejado ahí
  // — mismo motivo por el que #device-grid ya tiene ambos manejadores.
  const climateContent = document.getElementById('climate-content');
  climateContent.addEventListener('click',  handleGridClick);
  climateContent.addEventListener('click',  handlePlanGridClick);
  climateContent.addEventListener('input',  handlePlanGridInput);
  climateContent.addEventListener('change', handlePlanGridInput);
  setupColorWheelDrag(climateContent);

  // Delegación de eventos para la vista de Seguridad (armar/desarmar alarma)
  document.getElementById('security-content').addEventListener('click', handleGridClick);

  // ── CSP S5: delegación global para los onclick inline "sueltos" ──────────────
  // Los que NO viven dentro de una tarjeta del grid (accesos, botón de soporte,
  // cancelar programación, cerrar modales). data-csp-action es un namespace propio
  // para no chocar con el data-action que despachan los handlers del grid.
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-csp-action]');
    if (!el) return;
    const d = el.dataset;
    switch (d.cspAction) {
      case 'goto-support':    switchView('support'); break;
      case 'close-help':      closeHelpModal(); break;
      case 'close-enlarge':   closeEnlargeModal(); break;
      case 'cancel-schedule': cancelSchedule(d.id); break;
      case 'acceso-aprobar':  aprobarAcceso(d.dev, d.val === 'true'); break;
      case 'acceso-revocar':  revocarAcceso(d.dev, d.val === 'true'); break;
    }
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-csp-action="acceso-modo"]');
    if (el) toggleModoAprobacion(el.checked);
  });
  // Una <img> que se auto-removía con onerror inline. `error` no burbujea, así que
  // se escucha en fase de captura.
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.hasAttribute('data-remove-on-error')) t.remove();
  }, true);

  // Navegación (sidebar y vistas)
  initNav();

  // Onboarding: solo la primera vez que se abre el enlace de esta estadía.
  if (!localStorage.getItem(`nexo_onboarded_${app.token || 'static'}`)) {
    document.getElementById('onboarding-overlay')?.classList.remove('hidden');
    // El aviso de modo eco va DESPUÉS del onboarding (ver el dismiss), para no apilar.
  } else {
    chequearModoEcoBienvenida();
  }
}

// ── TEXTOS LOCALIZADOS (header, sidebar, ajustes y estáticos) ────────────────
function applyTexts() {
  // Elementos estáticos marcados con data-i18n en index.html
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });

  const d = app.data;
  if (!d) return;
  const loc = LOCALES[app.lang] || 'es-CL';

  // Onboarding: insertar nombre del hotel y saludo personalizado
  const onbTitleEl = document.getElementById('onb-title');
  const onbGreetEl = document.getElementById('onb-greet');
  const guestFirst = (d.guestName || '').split(' ')[0] || t('welcome');
  if (onbTitleEl) onbTitleEl.textContent = t('onbTitle', { hotel: d.hotelName });
  // Sin domótica el saludo NO menciona controlar la habitación: prometer
  // aparatos que no existen confunde al huésped desde el primer segundo.
  if (onbGreetEl) {
    onbGreetEl.textContent = t(esPlanPMS(d.plan) ? 'onbGreetPms' : 'onbGreet',
      { name: guestFirst, hotel: d.hotelName });
  }
  // Los pasos del onboarding también cambian: en modo PMS se habla de Servicios
  // y Chat, no de escenas ni aparatos inteligentes.
  if (esPlanPMS(d.plan)) {
    const paso = (sel, clave) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = t(clave);
    };
    paso('[data-i18n="onbScenes"]',  'onbServiciosPms');
    paso('[data-i18n="onbSupport"]', 'onbChatPms');
  }

  document.getElementById('hotel-name').textContent = d.hotelName;
  document.getElementById('room-name').textContent  = d.roomName;
  document.getElementById('guest-name').textContent = d.guestName
    ? t('hello', { name: d.guestName.split(' ')[0] })
    : t('welcome');

  document.getElementById('sidebar-hotel').textContent = d.hotelName;
  document.getElementById('sidebar-room').textContent  = d.roomName;

  const co     = new Date(d.checkout);
  const coDate = co.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
  const coTime = co.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  document.getElementById('checkout-info').innerHTML = ICON_CALENDAR + `<span>${t('checkoutLine', { date: coDate, time: coTime })}</span>`;

  document.getElementById('set-hotel').textContent    = d.hotelName;
  document.getElementById('set-room').textContent     = d.roomName;
  document.getElementById('set-guest').textContent    = d.guestName;
  document.getElementById('set-checkout').textContent = `${coDate}, ${coTime}`;
  document.getElementById('set-mode').textContent     = d.demoMode ? t('modeDemo') : t('modeLive');
  if (d.checkin) {
    const ci = new Date(d.checkin);
    document.getElementById('set-checkin').textContent =
      `${ci.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' })}, ` +
      `${ci.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })}`;
  }

  // Sensor de puerta en header
  if (d.devices.puerta?.state?.open) {
    const ds = document.getElementById('door-status');
    ds.style.display = 'flex';
    ds.innerHTML      = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"/><path d="M4 21h15"/><path d="M15 12v.01"/></svg>' + `<span>${t('doorOpen')}</span>`;
  }

  document.getElementById('demo-banner').innerHTML = ICON_INFO + `<span>${t('demoBanner')}</span>`;

  updateConnStatus();

  document.querySelectorAll('[data-action="toggle-dnd"]').forEach(el => el.classList.toggle('on', app.dnd));
  renderHomeServices();
  applyContactMethod();

  renderPrefsRows();
}

// El método para contactar a recepción lo define cada hotel (whatsapp/citófono/
// bajar a recepción/otro) — solo "whatsapp" usa el botón secundario de llamar
// por teléfono, el resto son mensajes informativos sin acción externa.
function applyContactMethod() {
  const btn    = document.getElementById('call-reception-btn');
  const telBtn = document.getElementById('call-reception-tel');
  if (!btn) return;
  const method = app.data?.contactMethod || 'whatsapp';
  telBtn?.classList.toggle('hidden', method !== 'whatsapp');
  if (method === 'whatsapp') {
    btn.innerHTML = ICON_MESSAGE + `<span>${t('callReception')}</span>`;
  } else if (method === 'citofono') {
    btn.innerHTML = ICON_PHONE + `<span>${t('callReceptionCitofono')}</span>`;
  } else if (method === 'bajar_recepcion') {
    btn.innerHTML = ICON_MAPPIN + `<span>${t('callReceptionBajar')}</span>`;
  } else {
    btn.innerHTML = ICON_MESSAGE + `<span>${t('callReceptionOtra')}</span>`;
  }
  if (telBtn) telBtn.innerHTML = ICON_PHONE + `<span>${t('callReceptionTel')}</span>`;
}

// ── SELECTORES DE IDIOMA Y ACCESIBILIDAD (vista Ajustes) ─────────────────────
// Copia de la sección "Servicios" (no molestar, solicitudes) directo en la
// página de Inicio, debajo de los dispositivos — sin el bloque de contactar a
// recepción, que sigue viviendo solo en la pestaña Soporte. Los ids llevan
// sufijo -home y se sincronizan con su par en Soporte vía toggleDnd. La
// alarma de puerta/ventana se mudó completa a la pestaña Seguridad.
function renderHomeServices() {
  const el = document.getElementById('home-services');
  if (!el) return;
  el.innerHTML = `
    <div class="device-card full-width" id="dnd-card-home">
      <div class="card-head">
        <div class="card-ico-name"><span class="card-ico">${ICON_BELL}</span><span class="card-label">${t('dndTitle')}</span></div>
        <div class="toggle ${app.dnd ? 'on' : ''}" id="dnd-toggle-home" data-action="toggle-dnd"></div>
      </div>
      <div class="card-status">${t('dndDesc')}</div>
    </div>
    <div class="support-card" style="padding:24px 32px;gap:10px">
      <button class="support-btn" id="request-towels-btn-home" style="width:100%">${ICON_BASKET}<span>${t('requestTowels')}</span></button>
      <button class="support-btn" id="request-roomservice-btn-home" style="width:100%">${ICON_UTENSILS}<span>${t('requestRoomService')}</span></button>
      <button class="support-btn" id="request-cleaning-btn-home" style="width:100%">${ICON_SPARKLES}<span>${t('requestCleaning')}</span></button>
      <button class="support-btn" id="request-late-checkout-btn-home" style="width:100%">${ICON_CLOCK}<span>${t('requestLateCheckout')}</span></button>
      <button class="support-btn" id="request-maintenance-btn-home" style="width:100%">${ICON_WRENCH}<span>${t('requestMaintenance')}</span></button>
      <button class="support-btn" id="request-other-btn-home" style="width:100%">${ICON_MESSAGE}<span>${t('requestOther')}</span></button>
    </div>`;

  document.getElementById('dnd-toggle-home').addEventListener('click', toggleDnd);
  document.getElementById('request-towels-btn-home').addEventListener('click', () => sendServiceRequest('towels'));
  document.getElementById('request-roomservice-btn-home').addEventListener('click', () => sendServiceRequest('roomservice'));
  document.getElementById('request-cleaning-btn-home').addEventListener('click', openCleaningModal);
  document.getElementById('request-late-checkout-btn-home').addEventListener('click', () => sendServiceRequest('late_checkout'));
  document.getElementById('request-maintenance-btn-home').addEventListener('click', () => sendServiceRequestWithNote('maintenance'));
  document.getElementById('request-other-btn-home').addEventListener('click', () => sendServiceRequestWithNote('other'));
}

// ── SEGURIDAD (sensores de puerta/ventana) ───────────────────────────────────
function securityDeviceKeys() {
  return Object.keys(app.config).filter(k => ['door_sensor', 'window_sensor'].includes(app.config[k].type));
}

function buildSecuritySensorCard(key) {
  const cfg   = app.config[key];
  const open  = !!app.devices[key]?.open;
  const armed = !!app.alarmSensors[key];
  return `<div class="device-card full-width" id="security-card-${key}">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${cfg.type === 'door_sensor' ? ICON_DOOR : ICON_WINDOW}</span><span class="card-label">${devLabel(key, cfg)}</span></div>
    </div>
    <div class="card-status-row">
      <span class="card-status ${open ? 'on' : ''}">${open ? t('sensorOpen') : t('sensorClosed')}</span>
    </div>
    <div class="manual-row">
      <span>${t('alarmSensorTitle')}</span>
      <div class="toggle toggle-sm ${armed ? 'on' : ''}" data-key="${key}" data-action="toggle-sensor-alarm"></div>
    </div>
    ${armed ? `<div class="manual-note">${t('alarmSensorNote')}</div>` : ''}
  </div>`;
}

function renderSecurityView() {
  const el = document.getElementById('security-content');
  if (!el) return;
  const keys = securityDeviceKeys();
  el.innerHTML = `
    <div class="section-label">${t('sectionSecurity')}</div>
    ${keys.length
      ? `<div class="device-grid">${keys.map(buildSecuritySensorCard).join('')}</div>`
      : `<div class="support-card" style="text-align:center"><span class="support-card-ico">${ICON_SHIELD}</span><p>${t('noSecuritySensorsMsg')}</p></div>`}
    <div id="accesos-panel"></div>
  `;
  renderAccesos();
}

// Panel de "Accesos" (seguridad de QR): dispositivos que han usado el link. Solo
// lo ve el dispositivo TITULAR (el primero que abrió el link); puede revocar los
// que no reconozca. Si no soy titular, el backend responde 403 y no se muestra.
async function renderAccesos() {
  const el = document.getElementById('accesos-panel');
  if (!el || !app.token || window.location.protocol === 'file:') return;
  let data;
  try {
    const res = await fetch(`${API}/room/${app.token}/accesos`);
    if (!res.ok) { el.innerHTML = ''; return; }   // 403 = no soy titular → oculto
    data = await res.json();
  } catch { return; }
  const devs = data.devices || [];
  const fecha = iso => { try { return new Date(iso).toLocaleString(LOCALES[app.lang] || 'es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
  const btn = (label, action, dev, val, cls, style) => `<button class="btn ${cls || ''}" style="padding:6px 10px;font-size:13px;white-space:nowrap;${style || ''}" data-csp-action="${action}" data-dev="${dev}" data-val="${val}">${label}</button>`;
  el.innerHTML = `
    <div class="section-label" style="margin-top:18px">🔐 ${t('accesosTitle')}</div>
    <div class="support-card" style="text-align:left">
      <p style="margin:0 0 8px;color:var(--text2);font-size:13px">${t('accesosDesc')}</p>
      <label style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--card2);border-radius:10px;cursor:pointer;font-size:13px">
        <input type="checkbox" ${data.approvalRequired ? 'checked' : ''} data-csp-action="acceso-modo">
        <span>${t('accesosApprovalMode')}</span>
      </label>
      ${devs.map(d => {
        const yo = d.deviceId === data.me;
        const icono = d.revoked ? '🚫' : d.pending ? '⏳' : d.primary ? '👑' : '📱';
        const tag = d.primary ? ' · ' + t('accesosOwner') : d.pending ? ' · ' + t('accesosPending') : yo ? ' · ' + t('accesosThis') : '';
        let acc = '';
        if (!d.primary) {
          if (d.pending) acc = btn(t('accesosApprove'), 'acceso-aprobar', d.deviceId, true, '') + ' ' + btn(t('accesosReject'), 'acceso-revocar', d.deviceId, true, 'sec');
          else acc = btn(d.revoked ? t('accesosRestore') : t('accesosRevoke'), 'acceso-revocar', d.deviceId, d.revoked ? false : true, d.revoked ? 'sec' : '');
        }
        return `<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-top:1px solid var(--border)">
          <span style="font-size:18px">${icono}</span>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600">${escapeHtml(d.label)}${tag}</div>
            <div style="font-size:12px;color:var(--text2)">${d.ip ? escapeHtml(d.ip) + ' · ' : ''}${t('accesosSince')} ${fecha(d.firstSeen)}</div>
          </div>
          <div style="display:flex;gap:6px">${acc}</div>
        </div>`;
      }).join('')}
    </div>`;
}

window.aprobarAcceso = async (deviceId, approved) => {
  try {
    await fetch(`${API}/room/${app.token}/accesos/aprobar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId, approved }),
    });
    showToast(approved ? t('accesosApprovedOk') : t('accesosRejectedOk'), 'success');
    renderAccesos();
  } catch (err) { showToast(err.message, 'error'); }
};

window.toggleModoAprobacion = async (on) => {
  try {
    await fetch(`${API}/room/${app.token}/accesos/modo`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvalRequired: on }),
    });
    showToast(on ? t('accesosModeOn') : t('accesosModeOff'), 'success');
    renderAccesos();
  } catch (err) { showToast(err.message, 'error'); }
};

window.revocarAcceso = async (deviceId, revoked) => {
  // Confirmar antes de REVOCAR (un toque por error no debe cortar el acceso).
  // Restaurar no pide confirmación. El aviso recuerda que se puede deshacer.
  if (revoked && !confirm(t('accesosRevokeConfirm'))) return;
  try {
    await fetch(`${API}/room/${app.token}/accesos/revocar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, revoked }),
    });
    showToast(revoked ? t('accesosRevokedOk') : t('accesosRestoredOk'), 'success');
    renderAccesos();
  } catch (err) { showToast(err.message, 'error'); }
};

function rerenderSecurityCard(key) {
  const el = document.getElementById(`security-card-${key}`);
  if (el) el.outerHTML = buildSecuritySensorCard(key);
}

function toggleSensorAlarm(key) {
  app.alarmSensors[key] = !app.alarmSensors[key];
  rerenderSecurityCard(key);
  showToast(app.alarmSensors[key] ? t('toastSensorAlarmOn') : t('toastSensorAlarmOff'), '');
  savePrefs({ alarmSensors: { [key]: app.alarmSensors[key] } });
  // Desarmar mientras SUENA tiene que callarla en el acto. Antes solo dejaba de
  // re-disparar, pero el beep en curso seguía porque nada limpiaba el timer ni
  // cerraba el overlay: el huésped apagaba la opción y el ruido no paraba.
  if (!app.alarmSensors[key]) dismissDoorAlarm();
  // Al armar, pedir permiso y suscribir el push (para recibir la alarma aunque
  // la app esté cerrada). Se hace acá porque el gesto del usuario (tocar armar)
  // habilita el prompt de permiso; sin gesto los navegadores lo bloquean.
  if (app.alarmSensors[key]) ensurePushSubscription();
}

// Registra el service worker y suscribe este dispositivo al Web Push. Silencioso
// si el navegador no soporta push o el usuario niega el permiso (queda el aviso
// en-app como respaldo). Idempotente: reusar la suscripción existente.
async function ensurePushSubscription() {
  try {
    if (window.location.protocol === 'file:' || !app.token) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm !== 'granted') return;
    // El service worker del HUÉSPED, no el del panel: registrar dos con el mismo
    // alcance hace que se pisen y las notificaciones dejen de llegar.
    const reg = await (window.NEXO_SIM ? Promise.reject(new Error('simulación')) : navigator.serviceWorker.register('/sw-huesped.js'));
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const { key } = await (await fetch(`${API}/push/vapid-public-key`)).json();
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
    }
    await fetch(`${API}/room/${app.token}/push-subscribe`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub }),
    });
  } catch (err) { console.warn('[push] no se pudo suscribir:', err.message); }
}

// VAPID public key (base64url) → Uint8Array que espera pushManager.subscribe
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function renderPrefsRows() {
  const langEl = document.getElementById('lang-options');
  if (langEl) {
    langEl.innerHTML = Object.keys(I18N).map(l =>
      `<button class="pref-btn ${app.lang === l ? 'active' : ''}" data-lang="${l}">${LANG_NAMES[l]}</button>`
    ).join('');
  }
  const a11yEl = document.getElementById('a11y-options');
  if (a11yEl) {
    const modes = [['none', 'a11yNone'], ['vision', 'a11yVision'], ['hearing', 'a11yHearing']];
    a11yEl.innerHTML = modes.map(([m, k]) =>
      `<button class="pref-btn ${app.a11y === m ? 'active' : ''}" data-a11y="${m}">${t(k)}</button>`
    ).join('');
  }
  const note = document.getElementById('a11y-note');
  if (note) {
    note.textContent = app.a11y === 'vision' ? t('a11yVisionNote')
      : app.a11y === 'hearing' ? t('a11yHearingNote') : '';
    note.style.display = app.a11y === 'none' ? 'none' : 'block';
  }
  const themeEl = document.getElementById('theme-options');
  if (themeEl) {
    const modes = [['auto', 'themeAuto'], ['light', 'themeLight'], ['dark', 'themeDark']];
    themeEl.innerHTML = modes.map(([m, k]) =>
      `<button class="pref-btn ${app.theme === m ? 'active' : ''}" data-theme="${m}">${t(k)}</button>`
    ).join('');
  }
}

// Guarda idioma/accesibilidad en el servidor (o localStorage en modo estático)
async function savePrefs(prefs) {
  if (window.location.protocol === 'file:') {
    if (prefs.lang)          localStorage.setItem('nexo_lang', prefs.lang);
    if (prefs.accessibility) localStorage.setItem('nexo_a11y', prefs.accessibility);
    return;
  }
  try {
    await fetch(`${API}/room/${app.token}/prefs${roomParam()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
  } catch { /* mejor esfuerzo: la preferencia ya quedó aplicada localmente */ }
}

function setLang(lang) {
  if (!I18N[lang] || lang === app.lang) return;
  app.lang = lang;
  document.documentElement.lang = lang;
  applyTexts();
  renderGrid();
  renderClimateView();
  renderSecurityView();
  renderScenes();
  renderHomeServices();
  applyContactMethod();
  savePrefs({ lang });
}

// ── NO MOLESTAR ───────────────────────────────────────────────────────────────
function toggleDnd() {
  app.dnd = !app.dnd;
  document.querySelectorAll('[data-action="toggle-dnd"]').forEach(el => el.classList.toggle('on', app.dnd));
  showToast(app.dnd ? t('toastDndOn') : t('toastDndOff'), '');
  savePrefs({ dnd: app.dnd });
}

// ── ALARMA DE SENSORES DE SEGURIDAD (puerta/ventana) ─────────────────────────
// La app no recibe push real (sin Service Worker con Web Push) — mientras la
// tenga abierta, un polling cada 20s detecta si algún sensor armado pasó de
// cerrado a abierto y dispara un aviso visual+sonoro local. Recepción lo ve por
// su cuenta: el server registra el disparo al detectar el evento del sensor, sin
// que el cliente tenga que postear nada.
let doorAlarmAudioCtx  = null;
let doorAlarmBeepTimer = null;

async function refreshRoomState() {
  if (window.location.protocol === 'file:' || !app.token) return;
  const prevDevices = app.devices;
  try {
    const data = await apiGet(app.token);
    app.data = data;
    // Mantener las mismas estructuras del primer render: app.config lleva la
    // ficha (incluida la disponibilidad, que puede cambiar durante la estadía —
    // ej. un dispositivo Zigbee que reporta recién después de arrancar el
    // backend) y app.devices SOLO el estado. Antes esto pisaba app.devices con
    // el objeto crudo de la API (shape distinto) y la disponibilidad quedaba
    // congelada en el primer render: un dispositivo que volvía a estar en línea
    // seguía mostrándose "no disponible" hasta recargar la página completa.
    const devices = {};
    for (const [key, dev] of Object.entries(data.devices)) {
      if (dev.hidden) continue;
      if (app.config[key]) {
        app.config[key].available = dev.available;
        app.config[key].irButtons = dev.irButtons; // códigos IR aprendidos pueden crecer durante la estadía
        app.config[key].irMeta    = dev.irMeta;
      } else {
        // Dispositivo asignado durante la estadía (ej. desde el modo instalador)
        app.config[key] = { type: dev.type, label: dev.label, channels: dev.channels, available: dev.available, manualUnlock: !!dev.manualUnlock, irButtons: dev.irButtons, irMeta: dev.irMeta, caps: dev.caps, icon: dev.icon, programable: dev.programable, travelMs: dev.travelMs };
      }
      devices[key] = dev.state ? { ...dev.state } : {};
    }
    app.devices = devices;
    renderGrid();
    if (!document.getElementById('view-security').classList.contains('hidden')) renderSecurityView();

    for (const key of securityDeviceKeys()) {
      const wasOpen   = !!prevDevices[key]?.open;
      const isOpenNow = !!app.devices[key]?.open;
      if (!wasOpen && isOpenNow && app.alarmSensors[key]) fireDoorAlarm(key);
    }

    // Automatización de Clima: ventana abierta + apagado automático activo + AC encendido.
    const s = app._placeholder.climate;
    const anyWindowOpen = securityDeviceKeys().some(k => app.config[k].type === 'window_sensor' && app.devices[k]?.open);
    if (s?.autoOff && s?.acOn && anyWindowOpen) {
      s.acOn = false;
      if (!document.getElementById('view-climate').classList.contains('hidden')) renderClimateView();
      showToast(t('toastAcAutoOff'), '');
    }
  } catch { /* la próxima vuelta del polling reintenta sola */ }
}

// Selector de habitación (solo con link multi-habitación). Al cambiar, recarga
// con ?room=<id> para re-inicializar todo limpio para la nueva pieza.
function setupRoomSwitcher() {
  const sel = document.getElementById('room-switcher');
  if (!sel) return;
  if (!app.rooms || app.rooms.length <= 1) { sel.style.display = 'none'; return; }
  sel.innerHTML = app.rooms.map(r => `<option value="${escapeHtml(r.id)}" ${r.id === app.roomId ? 'selected' : ''}>${escapeHtml(r.name)}</option>`).join('');
  sel.style.display = '';
  sel.onchange = () => switchRoom(sel.value);
}

function switchRoom(roomId) {
  if (roomId === app.roomId) return;
  const u = new URL(location.href);
  u.searchParams.set('room', roomId);
  location.href = u.toString(); // recarga: re-init limpio (grid, escenas, SSE, etc.)
}

// Muestra/oculta el aviso "puerta/ventana abierta" del header según cualquier
// sensor de contacto de la habitación.
function updateDoorHeader() {
  const ds = document.getElementById('door-status');
  if (!ds) return;
  const abierto = securityDeviceKeys().some(k => app.devices[k]?.open);
  ds.style.display = abierto ? 'flex' : 'none';
  if (abierto) ds.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"/><path d="M4 21h15"/><path d="M15 12v.01"/></svg>' + `<span>${t('doorOpen')}</span>`;
}

// Alerta en-app (visual/sonora) cuando la app está abierta. El REGISTRO para
// recepción y la NOTIFICACIÓN push la hace el servidor al detectar el sensor
// (funciona con la app cerrada), así que el cliente ya no la POSTea — solo
// muestra el aviso local. Idempotente: si el estado ya quedó "abierto", la
// próxima vuelta del poll no lo vuelve a mostrar.
function fireDoorAlarm(key) {
  triggerDoorAlarmUI(key);
}

// Push instantáneo de alarmas: un EventSource recibe el cambio del sensor en el
// momento (sin esperar el poll de 6s). Solo para sensores de contacto — el
// resto del estado sigue por el poll. EventSource reconecta solo si se corta.
function initInstantAlarms() {
  if (window.location.protocol === 'file:' || !app.token || typeof EventSource === 'undefined') return;
  if (!securityDeviceKeys().length) return;
  const es = new EventSource(`${API}/room/${app.token}/events${roomParam()}`);
  es.onmessage = ev => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.type !== 'contact') return;
    const key = msg.deviceKey;
    if (!app.config[key]) return;
    const wasOpen = !!app.devices[key]?.open;
    app.devices[key] = { ...(app.devices[key] || {}), open: msg.open };
    updateDoorHeader();
    if (!document.getElementById('view-security').classList.contains('hidden')) renderSecurityView();
    if (msg.open && !wasOpen && app.alarmSensors[key]) fireDoorAlarm(key);
  };
}

function triggerDoorAlarmUI(key) {
  const label = devLabel(key, app.config[key]);
  document.getElementById('door-alarm-overlay-title').textContent = t('doorAlarmTriggeredTitle', { device: label });
  document.getElementById('door-alarm-overlay-desc').textContent  = t('doorAlarmTriggeredDesc', { device: label });
  document.getElementById('door-alarm-overlay')?.classList.remove('hidden');
  // Nunca apilar loops de beep. Dos caminos disparan la alarma —el SSE instantáneo
  // y el poll, cada uno con su propio "flanco de apertura"— y una sola apertura
  // puede gatillar ambos: eso creaba DOS setInterval y el handle solo recordaba el
  // último, así que "Entendido" limpiaba uno y el otro seguía sonando para siempre.
  // Limpiando antes de armar el nuevo, hay un único timer pase lo que pase.
  clearInterval(doorAlarmBeepTimer);
  playDoorAlarmBeep();
  doorAlarmBeepTimer = setInterval(playDoorAlarmBeep, 1500);
}

function dismissDoorAlarm() {
  document.getElementById('door-alarm-overlay')?.classList.add('hidden');
  clearInterval(doorAlarmBeepTimer);
  doorAlarmBeepTimer = null;
}

// Tono generado con Web Audio (sin archivo de audio que cargar/mantener).
function playDoorAlarmBeep() {
  try {
    doorAlarmAudioCtx = doorAlarmAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc  = doorAlarmAudioCtx.createOscillator();
    const gain = doorAlarmAudioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(doorAlarmAudioCtx.destination);
    osc.start();
    osc.stop(doorAlarmAudioCtx.currentTime + 0.4);
  } catch { /* navegador sin Web Audio o sin permiso de audio todavía — no es crítico */ }
}

// ── SOLICITUDES DE SERVICIO ───────────────────────────────────────────────────
// Cubre toda la comunicación habitual huésped↔recepción durante la estadía,
// con o sin domótica: toallas, room service, limpieza, late checkout,
// reportar un problema y solicitudes libres (las dos últimas con nota).
async function sendServiceRequest(type, note = '', extra = {}) {
  if (window.location.protocol === 'file:') {
    showToast(t('toastRequestSent'), 'success');
    return;
  }
  try {
    const res = await fetch(`${API}/room/${app.token}/request`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type, note, ...extra }),
    });
    if (!res.ok) throw new Error();
    showToast(t('toastRequestSent'), 'success');
  } catch {
    showToast(t('toastCmdFail'), 'error');
  }
}

// ── SOLICITAR LIMPIEZA (pregunta por cuánto tiempo estará fuera) ─────────────
// El tiempo le llega al personal de aseo junto con el aviso automático, para que
// sepa qué ventana tiene disponible para entrar a limpiar.
const CLEANING_TIMES = [
  { code: 'now', key: 'cleaningTimeNow' },
  { code: '30m', key: 'cleaningTime30m' },
  { code: '1h',  key: 'cleaningTime1h' },
  { code: '2h',  key: 'cleaningTime2h' },
  { code: '3h',  key: 'cleaningTime3h' },
];

function openCleaningModal() {
  const card = document.getElementById('cleaning-modal-card');
  const optsHtml = CLEANING_TIMES
    .map(o => `<button type="button" class="report-option" data-time="${o.code}">${t(o.key)}</button>`)
    .join('');
  card.innerHTML = `
    <div class="onboarding-ico">${ICON_SPARKLES}</div>
    <h2>${t('cleaningModalTitle')}</h2>
    <p class="scene-modal-desc">${t('cleaningModalDesc')}</p>
    <div class="report-options">${optsHtml}</div>
    <div class="scene-modal-actions">
      <button class="support-btn" id="cleaning-modal-cancel">${t('reportBackBtn')}</button>
      <button class="support-btn" id="cleaning-modal-skip">${t('cleaningTimeSkip')}</button>
    </div>`;
  card.querySelectorAll('[data-time]').forEach(btn => {
    btn.onclick = () => { closeCleaningModal(); sendServiceRequest('cleaning', '', { tiempoFuera: btn.dataset.time }); };
  });
  document.getElementById('cleaning-modal-cancel').onclick = closeCleaningModal;
  document.getElementById('cleaning-modal-skip').onclick = () => { closeCleaningModal(); sendServiceRequest('cleaning'); };
  document.getElementById('cleaning-modal-overlay').classList.remove('hidden');
}

function closeCleaningModal() {
  document.getElementById('cleaning-modal-overlay').classList.add('hidden');
}

// Tipos que requieren describir el pedido antes de enviarlo.
function sendServiceRequestWithNote(type) {
  const note = (window.prompt(t('requestNotePrompt')) || '').trim();
  if (!note) return; // cancelado o vacío — no se envía
  sendServiceRequest(type, note);
}

// ── REPORTAR PROBLEMA GENERAL (app/PMS) — llega al hotel Y al admin de la app ──
function openAppProblemModal() {
  document.getElementById('app-problem-text').value = '';
  document.getElementById('app-problem-modal-overlay').classList.remove('hidden');
}

function closeAppProblemModal() {
  document.getElementById('app-problem-modal-overlay').classList.add('hidden');
}

async function submitAppProblem() {
  const note = document.getElementById('app-problem-text').value.trim();
  if (!note) return;
  await sendServiceRequest('app_problem', note);
  closeAppProblemModal();
}

// ── REPORTAR PROBLEMA DE DISPOSITIVO ─────────────────────────────────────────
// Asistente de 3 pasos (intro → opciones → "otra") que termina enviando una
// solicitud tipo 'maintenance' con el dispositivo y el motivo en la nota —
// reutiliza el mismo pipeline de solicitudes que ya ve recepción en Mensajes,
// sin necesitar un endpoint ni un tipo de solicitud nuevos.
const REPORT_OPTIONS = {
  light:      ['noEnciende', 'noApaga', 'noIntensidad', 'noTemperatura'],
  light_rgb:  ['noEnciende', 'noApaga', 'noIntensidad', 'noColores'],
  curtain:    ['noAbre', 'noCierra', 'noPara', 'seMueveSola'],
  switch:     ['noEnciende', 'noApaga'],
  switch_3ch: ['canalNoResponde', 'ningunCanalResponde'],
  ac:         ['noEnciende', 'noApaga', 'noTemperaturaAC', 'noEnfriaCalienta'],
};
const REPORT_OPTION_LABELS = {
  noEnciende: 'reportOptNoEnciende', noApaga: 'reportOptNoApaga',
  noIntensidad: 'reportOptNoIntensidad', noTemperatura: 'reportOptNoTemperatura',
  noColores: 'reportOptNoColores', noAbre: 'reportOptNoAbre', noCierra: 'reportOptNoCierra',
  noPara: 'reportOptNoPara', seMueveSola: 'reportOptSeMueveSola',
  canalNoResponde: 'reportOptCanalNoResponde', ningunCanalResponde: 'reportOptNingunCanalResponde',
  noTemperaturaAC: 'reportOptNoTemperaturaAC', noEnfriaCalienta: 'reportOptNoEnfriaCalienta',
};

let reportState = null; // { key, step, option, otherText }

function openReportModal(key) {
  reportState = { key, step: key ? 'intro' : 'pick-device', option: null, otherText: '' };
  renderReportModal();
  document.getElementById('report-modal-overlay').classList.remove('hidden');
}

function closeReportModal() {
  document.getElementById('report-modal-overlay').classList.add('hidden');
  reportState = null;
}

function renderReportModal() {
  if (!reportState) return;
  const { key, step, option } = reportState;
  const cfg   = app.config[key] || {};
  const label = featureOrDeviceLabel(key);
  const card  = document.getElementById('report-modal-card');

  if (step === 'pick-device') {
    const devOpts = Object.entries(app.config)
      .map(([k, cfg]) => `<button type="button" class="report-option" data-pick="${k}">${devLabel(k, cfg)}</button>`)
      .join('');
    card.innerHTML = `
      <div class="onboarding-ico">${ICON_ALERT}</div>
      <h2>${t('reportTitle')}</h2>
      <p class="scene-modal-desc">${t('reportPickDevice')}</p>
      <div class="report-options" id="report-pick-list">${devOpts}</div>
      <div class="scene-modal-actions">
        <button class="support-btn" id="report-modal-back">${t('reportBackBtn')}</button>
      </div>`;
    document.getElementById('report-pick-list').querySelectorAll('[data-pick]').forEach(btn => {
      btn.onclick = () => { reportState.key = btn.dataset.pick; reportState.step = 'intro'; renderReportModal(); };
    });
    document.getElementById('report-modal-back').onclick = closeReportModal;
    return;
  }

  if (step === 'intro') {
    card.innerHTML = `
      <div class="onboarding-ico">${ICON_ALERT}</div>
      <h2>${t('reportTitle')}</h2>
      <p class="scene-modal-desc">${t('reportIntroDesc', { device: label })}</p>
      <div class="scene-modal-actions">
        <button class="support-btn" id="report-modal-back">${t('reportBackBtn')}</button>
        <button class="support-btn" id="report-modal-next">${t('reportContinueBtn')}</button>
      </div>`;
    document.getElementById('report-modal-back').onclick = closeReportModal;
    document.getElementById('report-modal-next').onclick = () => { reportState.step = 'options'; renderReportModal(); };
    return;
  }

  if (step === 'options') {
    const optKeys = REPORT_OPTIONS[cfg.type] || REPORT_OPTIONS.light;
    const optsHtml = optKeys
      .map(k => `<button type="button" class="report-option ${option === k ? 'active' : ''}" data-opt="${k}">${t(REPORT_OPTION_LABELS[k])}</button>`)
      .concat(`<button type="button" class="report-option ${option === 'otra' ? 'active' : ''}" data-opt="otra">${t('reportOptOtra')}</button>`)
      .join('');

    card.innerHTML = `
      <div class="onboarding-ico">${ICON_ALERT}</div>
      <h2>${t('reportOptionsTitle')}</h2>
      <div class="report-options" id="report-options-list">${optsHtml}</div>
      <div class="scene-modal-actions">
        <button class="support-btn" id="report-modal-back">${t('reportBackBtn')}</button>
        <button class="support-btn" id="report-modal-send">${t('reportSendBtn')}</button>
      </div>`;

    document.getElementById('report-options-list').querySelectorAll('.report-option').forEach(btn => {
      btn.onclick = () => { reportState.option = btn.dataset.opt; renderReportModal(); };
    });
    document.getElementById('report-modal-back').onclick = () => { reportState.step = 'intro'; renderReportModal(); };
    document.getElementById('report-modal-send').onclick = () => {
      if (!reportState.option) { showToast(t('reportNoOptionToast'), 'error'); return; }
      if (reportState.option === 'otra') { reportState.step = 'other'; renderReportModal(); return; }
      submitReport();
    };
    return;
  }

  if (step === 'other') {
    card.innerHTML = `
      <div class="onboarding-ico">${ICON_ALERT}</div>
      <h2>${t('reportOtherTitle')}</h2>
      <textarea class="report-other-textarea" id="report-other-text" placeholder="${t('reportOtherPlaceholder')}" rows="4"></textarea>
      <div class="scene-modal-actions">
        <button class="support-btn" id="report-modal-back">${t('reportBackBtn')}</button>
        <button class="support-btn" id="report-modal-send">${t('reportSendBtn')}</button>
      </div>`;
    document.getElementById('report-modal-back').onclick = () => { reportState.step = 'options'; renderReportModal(); };
    document.getElementById('report-modal-send').onclick = () => {
      reportState.otherText = document.getElementById('report-other-text').value.trim();
      submitReport();
    };
  }
}

function submitReport() {
  const { key, option, otherText } = reportState;
  const label = featureOrDeviceLabel(key);
  const detail = option === 'otra'
    ? (otherText ? `${t('reportOptOtra')}: ${otherText}` : t('reportOptOtra'))
    : t(REPORT_OPTION_LABELS[option]);
  sendServiceRequest('maintenance', `${label} — ${detail}`);
  closeReportModal();
}

// ── PROGRAMAR DISPOSITIVOS Y ESCENAS ─────────────────────────────────────────
// Modal genérico: rango horario (desde/hasta, con apagado automático opcional)
// + repetición (una vez en una fecha, o ciertos días de la semana). Para
// escenas no hay "hasta" (aplicar una escena no tiene un inverso natural) — se
// disparan solo a la hora de inicio, con o sin repetición. buildPasos(valor)
// siempre arma el array de pasos {dev,cmd} que espera el backend (mismo
// formato que ya usa applyScene()); buildPasosFin(valor) es su inverso.
const SCHEDULE_DIAS = [
  { value: 1, key: 'L' }, { value: 2, key: 'M' }, { value: 3, key: 'M2' },
  { value: 4, key: 'J' }, { value: 5, key: 'V' }, { value: 6, key: 'S' }, { value: 0, key: 'D' },
];
let scheduleState = null;

function openScheduleModal({ descripcion, choices, buildPasos, buildPasosFin, matches }) {
  scheduleState = {
    descripcion, choices, buildPasos, buildPasosFin, matches,
    selected: choices ? choices[0].value : null,
    horaInicio: '', horaFin: '', apagarAuto: false,
    repetir: 'once', fecha: new Date().toISOString().slice(0, 10), diasSel: [],
  };
  renderScheduleModal();
  document.getElementById('schedule-modal-overlay').classList.remove('hidden');
}

function closeScheduleModal() {
  document.getElementById('schedule-modal-overlay').classList.add('hidden');
  scheduleState = null;
}

function renderScheduleModal() {
  if (!scheduleState) return;
  const { descripcion, choices, selected, apagarAuto, repetir, diasSel, buildPasosFin } = scheduleState;
  const card = document.getElementById('schedule-modal-card');

  const choicesHtml = choices ? `
    <div class="report-options" id="schedule-onoff">
      ${choices.map(c => `<button type="button" class="report-option ${c.value === selected ? 'active' : ''}" data-value="${c.value}">${c.label}</button>`).join('')}
    </div>` : '';

  const autoOffHtml = buildPasosFin ? `
    <label class="schedule-check-row">
      <input type="checkbox" id="schedule-auto-off" ${apagarAuto ? 'checked' : ''}>
      <span>${t('scheduleAutoOff')}</span>
    </label>
    ${apagarAuto ? `
      <label class="schedule-label">${t('scheduleUntil')}</label>
      <input type="time" class="scene-name-input" id="schedule-time-end" value="${scheduleState.horaFin}">` : ''}` : '';

  const repeatBodyHtml = repetir === 'weekly' ? `
    <div class="schedule-days-row">
      ${SCHEDULE_DIAS.map(d => `<button type="button" class="schedule-day-btn ${diasSel.includes(d.value) ? 'active' : ''}" data-day="${d.value}">${t('scheduleDay_' + d.key)}</button>`).join('')}
    </div>` : `
    <input type="date" class="scene-name-input" id="schedule-date" min="${new Date().toISOString().slice(0, 10)}" value="${scheduleState.fecha}">`;

  card.innerHTML = `
    <div class="onboarding-ico">${ICON_CLOCK}</div>
    <h2>${t('scheduleTitle')}</h2>
    <p class="scene-modal-desc">${t(choices ? 'scheduleDesc' : 'scheduleDescScene', { device: descripcion })}</p>
    ${choicesHtml}
    <label class="schedule-label">${t('scheduleFrom')}</label>
    <input type="time" class="scene-name-input" id="schedule-time-start" value="${scheduleState.horaInicio}">
    ${autoOffHtml}
    <div class="report-options" id="schedule-repeat">
      <button type="button" class="report-option ${repetir === 'once' ? 'active' : ''}" data-repeat="once">${t('scheduleOnce')}</button>
      <button type="button" class="report-option ${repetir === 'weekly' ? 'active' : ''}" data-repeat="weekly">${t('scheduleWeekly')}</button>
    </div>
    ${repeatBodyHtml}
    <div class="form-error" id="schedule-error" style="color:#E5484D;font-size:12px;margin:8px 0"></div>
    <div class="scene-modal-actions">
      <button class="support-btn" id="schedule-modal-back">${t('reportBackBtn')}</button>
      <button class="support-btn" id="schedule-modal-send">${t('scheduleSendBtn')}</button>
    </div>
    <div id="schedule-pending-list" style="margin-top:16px"></div>`;

  if (choices) {
    document.querySelectorAll('#schedule-onoff .report-option').forEach(btn => {
      btn.onclick = () => { scheduleState.selected = btn.dataset.value; renderScheduleModal(); };
    });
  }
  document.getElementById('schedule-time-start').oninput = e => { scheduleState.horaInicio = e.target.value; };
  if (buildPasosFin) {
    document.getElementById('schedule-auto-off').onchange = e => { scheduleState.apagarAuto = e.target.checked; renderScheduleModal(); };
    if (apagarAuto) document.getElementById('schedule-time-end').oninput = e => { scheduleState.horaFin = e.target.value; };
  }
  document.querySelectorAll('#schedule-repeat .report-option').forEach(btn => {
    btn.onclick = () => { scheduleState.repetir = btn.dataset.repeat; renderScheduleModal(); };
  });
  if (repetir === 'weekly') {
    document.querySelectorAll('.schedule-day-btn').forEach(btn => {
      btn.onclick = () => {
        const d = parseInt(btn.dataset.day, 10);
        const idx = scheduleState.diasSel.indexOf(d);
        if (idx >= 0) scheduleState.diasSel.splice(idx, 1); else scheduleState.diasSel.push(d);
        renderScheduleModal();
      };
    });
  } else {
    document.getElementById('schedule-date').oninput = e => { scheduleState.fecha = e.target.value; };
  }
  document.getElementById('schedule-modal-back').onclick = closeScheduleModal;
  document.getElementById('schedule-modal-send').onclick = submitSchedule;

  loadPendingSchedules();
}

async function submitSchedule() {
  const errEl = document.getElementById('schedule-error');
  errEl.textContent = '';
  const { descripcion, buildPasos, buildPasosFin, selected, horaInicio, horaFin, apagarAuto, repetir, fecha, diasSel } = scheduleState;

  if (!horaInicio) { errEl.textContent = t('scheduleNoTimeError'); return; }
  if (apagarAuto && !horaFin) { errEl.textContent = t('scheduleNoEndTimeError'); return; }
  if (apagarAuto && horaFin === horaInicio) { errEl.textContent = t('scheduleSameTimeError'); return; }
  if (repetir === 'once' && !fecha) { errEl.textContent = t('scheduleNoDateError'); return; }
  if (repetir === 'weekly' && !diasSel.length) { errEl.textContent = t('scheduleNoDaysError'); return; }

  const body = {
    descripcion,
    pasosInicio: buildPasos(selected),
    pasosFin: apagarAuto && buildPasosFin ? buildPasosFin(selected) : null,
    horaInicio, horaFin: apagarAuto ? horaFin : null,
    repetir, fecha: repetir === 'once' ? fecha : null, diasSemana: repetir === 'weekly' ? diasSel : null,
  };

  try {
    const res = await fetch(`${API}/room/${app.token}/schedule`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    showToast(t('toastScheduleSaved'), 'success');
    loadPendingSchedules();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

const SCHEDULE_DIAS_CORTAS = ['scheduleDayShortD', 'scheduleDayShortL', 'scheduleDayShortM', 'scheduleDayShortM2', 'scheduleDayShortJ', 'scheduleDayShortV', 'scheduleDayShortS'];

function formatScheduleRow(c) {
  const rango = c.hora_fin ? `${c.hora_inicio}–${c.hora_fin}` : c.hora_inicio;
  const cuando = c.repetir === 'once'
    ? new Date(c.fecha + 'T00:00:00').toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })
    : JSON.parse(c.dias_semana).map(d => t(SCHEDULE_DIAS_CORTAS[d])).join(', ');
  return `${rango} · ${cuando}`;
}

async function loadPendingSchedules() {
  const list = document.getElementById('schedule-pending-list');
  if (!list || !scheduleState) return;
  try {
    const res = await fetch(`${API}/room/${app.token}/schedule`);
    const all = await res.json();
    const propios = (Array.isArray(all) ? all : []).filter(scheduleState.matches);
    if (!propios.length) { list.innerHTML = `<div class="scenes-hint">${t('scheduleNonePending')}</div>`; return; }
    list.innerHTML = propios.map(c => `<div class="ch-row">
        <span class="ch-label">${escapeHtml(c.descripcion)} · ${formatScheduleRow(c)}</span>
        <button type="button" class="report-btn" data-csp-action="cancel-schedule" data-id="${c.id}" aria-label="${t('scheduleCancelBtn')}">${ICON_X}</button>
      </div>`).join('');
  } catch {
    list.innerHTML = '';
  }
}

window.cancelSchedule = async function(id) {
  try {
    await fetch(`${API}/room/${app.token}/schedule/${id}`, { method: 'DELETE' });
    showToast(t('toastScheduleCancelled'), '');
    loadPendingSchedules();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// Atajos por tipo de dispositivo — arman los `opts` que espera openScheduleModal().
window.scheduleOnOff = function(key) {
  openScheduleModal({
    descripcion: devLabel(key, app.config[key] || {}),
    choices: [{ value: 'true', label: t('scheduleTurnOn') }, { value: 'false', label: t('scheduleTurnOff') }],
    buildPasos:    v => [{ dev: key, cmd: { on: v === 'true' } }],
    buildPasosFin: v => [{ dev: key, cmd: { on: v !== 'true' } }],
    matches: c => { try { return JSON.parse(c.pasos_inicio).some(s => s.dev === key && 'on' in s.cmd); } catch { return false; } },
  });
};

window.scheduleChannel = function(key, ch) {
  const cfg = app.config[key] || {};
  const label = (cfg.channels && cfg.channels[ch]) || devLabel(key, cfg);
  openScheduleModal({
    descripcion: label,
    choices: [{ value: 'true', label: t('scheduleTurnOn') }, { value: 'false', label: t('scheduleTurnOff') }],
    buildPasos:    v => [{ dev: key, cmd: { [`ch${ch + 1}`]: v === 'true' } }],
    buildPasosFin: v => [{ dev: key, cmd: { [`ch${ch + 1}`]: v !== 'true' } }],
    matches: c => { try { return JSON.parse(c.pasos_inicio).some(s => s.dev === key && `ch${ch + 1}` in s.cmd); } catch { return false; } },
  });
};

window.scheduleCurtain = function(key) {
  openScheduleModal({
    descripcion: devLabel(key, app.config[key] || {}),
    choices: [{ value: 'open', label: t('curtainOpenBtn') }, { value: 'close', label: t('curtainCloseBtn') }],
    buildPasos:    v => [{ dev: key, cmd: { control: v } }],
    buildPasosFin: v => [{ dev: key, cmd: { control: v === 'open' ? 'close' : 'open' } }],
    matches: c => { try { return JSON.parse(c.pasos_inicio).some(s => s.dev === key && 'control' in s.cmd); } catch { return false; } },
  });
};

window.scheduleScene = function(sceneId) {
  const scene = getSceneList().find(s => s.id === sceneId);
  if (!scene) return;
  openScheduleModal({
    descripcion: scene.title,
    choices: null,
    buildPasos: () => getSceneSteps(sceneId),
    buildPasosFin: null,
    matches: c => c.descripcion === scene.title,
  });
};

function setA11y(mode) {
  if (mode === app.a11y) return;
  app.a11y = mode;
  applyA11y();
  renderPrefsRows();
  savePrefs({ accessibility: mode });
}

// Presets visuales según discapacidad: baja visión (texto/controles grandes,
// alto contraste) y auditiva (avisos visuales destacados y más duraderos).
function applyA11y() {
  document.body.classList.toggle('a11y-vision',  app.a11y === 'vision');
  document.body.classList.toggle('a11y-hearing', app.a11y === 'hearing');
}

// ── TEMA (claro / oscuro / automático según la hora) ─────────────────────────
// En modo "auto", entre las 20:00 y las 07:00 (hora local del dispositivo) se
// aplica el tema oscuro. En "light"/"dark" el huésped fija el tema manualmente.
function applyTheme() {
  let dark;
  if (app.theme === 'dark') dark = true;
  else if (app.theme === 'light') dark = false;
  else {
    const hour = new Date().getHours();
    dark = hour >= 20 || hour < 7;
  }
  document.body.classList.toggle('theme-dark', dark);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.innerHTML = dark ? ICON_SUN : ICON_MOON;
    const label = dark ? t('themeDeactivateDark') : t('themeActivateDark');
    btn.title = label;
    btn.setAttribute('aria-label', label);
  }
}

function setTheme(mode) {
  if (mode === app.theme) return;
  app.theme = mode;
  localStorage.setItem('nexo_theme', mode);
  applyTheme();
  renderPrefsRows();
}

// ── INDICADOR DE ESTADO DE CONEXIÓN ───────────────────────────────────────────
function updateConnStatus() {
  const el = document.getElementById('conn-status');
  if (!el) return;
  const online = navigator.onLine;
  el.classList.toggle('offline', !online);
  el.innerHTML = `<span class="conn-dot"></span>${online ? t('connOnline') : t('connOffline')}`;
}

window.addEventListener('online', () => {
  updateConnStatus();
  showToast(t('toastOnline'), 'success');
});
window.addEventListener('offline', () => {
  updateConnStatus();
  showToast(t('toastOffline'), 'error');
});

// Clicks en los selectores de idioma/accesibilidad/tema
document.addEventListener('click', e => {
  const lb = e.target.closest('[data-lang]');
  if (lb) { setLang(lb.dataset.lang); return; }
  const ab = e.target.closest('[data-a11y]');
  if (ab) { setA11y(ab.dataset.a11y); return; }
  const tb = e.target.closest('[data-theme]');
  if (tb) setTheme(tb.dataset.theme);
});

// ── NAVEGACIÓN: SIDEBAR Y VISTAS ──────────────────────────────────────────────
let currentView = 'room';

// Recordar la vista activa: si el huésped recarga (o vuelve desde el navegador)
// no lo devolvemos a Habitación perdiendo dónde estaba.
function viewKey() { return `nexo_view_${app.token || 'static'}`; }

function restoreView() {
  let view = null;
  try { view = sessionStorage.getItem(viewKey()); } catch { /* Safari privado */ }
  if (!view) return;
  // Solo si esa vista sigue existiendo y visible: con plan PMS la mitad del
  // menú está oculto y restaurar "Escenas" dejaría una pantalla en blanco.
  const nav = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (!nav || nav.classList.contains('hidden')) return;
  switchView(view);
}

function switchView(view) {
  currentView = view;
  // En Safari privado sessionStorage lanza al escribir: no vale romper la
  // navegación por no poder recordar la vista.
  try { sessionStorage.setItem(viewKey(), view); } catch { /* sin persistencia */ }
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(`view-${view}`)?.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-view="${view}"]`)?.classList.add('active');

  // El chat arranca su sondeo al abrirse y marca lo pendiente como visto.
  if (view === 'chat') iniciarChat();
  // A8: la tarjeta de ahorro vive en Ajustes y se recarga al entrar, porque el
  // hotel puede deshabilitar funciones mientras el huésped está alojado.
  if (view === 'settings') loadEcoHuesped();
  if (view === 'historial') loadActividadHuesped();
  if (view === 'climate') cargarObjetivoTermico();
  actualizarBadgeChat();

  if (view === 'scenes') {
    const key = `nexo_scenes_onboarded_${app.token || 'static'}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1');
      openSceneHelpModal();
    }
  }
}

// ── TUTORIAL GUIADO (encender una luz / mover la cortina) ────────────────────
const TUTORIAL_STEPS = [
  {
    view: 'room',
    selector: () => document.querySelector('[data-key="luz_techo"][data-action="toggle-light"]'),
    titleKey: 'tutLightTitle',
    descKey:  'tutLightDesc',
  },
  {
    view: 'room',
    selector: () => document.querySelector('#device-grid [data-curtain="open"]'),
    titleKey: 'tutCurtainOpenTitle',
    descKey:  'tutCurtainOpenDesc',
  },
  {
    view: 'room',
    selector: () => document.querySelector('#device-grid [data-curtain="stop"]'),
    titleKey: 'tutCurtainStopTitle',
    descKey:  'tutCurtainStopDesc',
  },
  {
    view: 'room',
    selector: () => document.querySelector('#device-grid [data-curtain="close"]'),
    titleKey: 'tutCurtainCloseTitle',
    descKey:  'tutCurtainCloseDesc',
  },
];

let tutorialStep = 0;

function startTutorial() {
  tutorialStep = 0;
  showTutorialStep();
}

function showTutorialStep() {
  // Saltar pasos cuyo dispositivo no existe en esta habitación
  while (tutorialStep < TUTORIAL_STEPS.length && !TUTORIAL_STEPS[tutorialStep].selector()) {
    tutorialStep++;
  }
  if (tutorialStep >= TUTORIAL_STEPS.length) return endTutorial();

  const step = TUTORIAL_STEPS[tutorialStep];
  switchView(step.view);
  document.getElementById('tutorial-overlay').classList.remove('hidden');

  requestAnimationFrame(() => {
    const target = step.selector();
    if (!target) { tutorialStep++; return showTutorialStep(); }
    target.scrollIntoView({ behavior: 'instant', block: 'center' });
    // rAF extra para que el browser confirme el layout después del scroll
    requestAnimationFrame(() => positionTutorial(target, step));
  });
}

function positionTutorial(target, step) {
  const highlight = document.getElementById('tutorial-highlight');
  const tooltip   = document.getElementById('tutorial-tooltip');
  const pad = 6;

  const rect = target.getBoundingClientRect();
  highlight.style.top    = `${rect.top - pad}px`;
  highlight.style.left   = `${rect.left - pad}px`;
  highlight.style.width  = `${rect.width + pad * 2}px`;
  highlight.style.height = `${rect.height + pad * 2}px`;

  document.getElementById('tutorial-title').textContent = t(step.titleKey);
  document.getElementById('tutorial-desc').textContent  = t(step.descKey);
  document.getElementById('tutorial-step-count').textContent =
    t('tutStepCount', { n: tutorialStep + 1, total: TUTORIAL_STEPS.length });
  document.getElementById('tutorial-prev').style.visibility = tutorialStep === 0 ? 'hidden' : 'visible';
  document.getElementById('tutorial-next').textContent =
    tutorialStep === TUTORIAL_STEPS.length - 1 ? t('tutFinish') : t('tutNext');

  const tooltipRect = tooltip.getBoundingClientRect();
  let top = rect.bottom + pad + 14;
  if (top + tooltipRect.height > window.innerHeight - 12) {
    top = rect.top - pad - tooltipRect.height - 14;
  }
  top = Math.max(12, top);
  let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - tooltipRect.width - 12));
  tooltip.style.top  = `${top}px`;
  tooltip.style.left = `${left}px`;
}

function endTutorial() {
  document.getElementById('tutorial-overlay')?.classList.add('hidden');
  document.getElementById('tutorial-choice-overlay')?.classList.add('hidden');
  localStorage.setItem(`nexo_onboarded_${app.token || 'static'}`, '1');
}

function initNav() {
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const burger   = document.getElementById('hamburger-btn');

  function openSidebar()  { sidebar.classList.add('open');    backdrop.classList.add('open'); }
  function closeSidebar() { sidebar.classList.remove('open'); backdrop.classList.remove('open'); }

  burger.addEventListener('click', openSidebar);
  backdrop.addEventListener('click', closeSidebar);

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      switchView(item.dataset.view);
      closeSidebar();
    });
  });

  // Botón de soporte: contactar a recepción — WhatsApp como vía principal
  // (mismo canal que ya usa recepción para responder desde el Centro de
  // Mensajes), con llamada telefónica real como respaldo. Si el hotel no
  // configuró un teléfono, se degrada al mensaje genérico de siempre.
  document.getElementById('call-reception-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const method = app.data?.contactMethod || 'whatsapp';
    if (method === 'citofono') { alert(t('callReceptionCitofonoMsg')); return; }
    if (method === 'bajar_recepcion') { alert(t('callReceptionBajarMsg')); return; }
    if (method === 'otro') { alert(app.data?.contactMessage || t('callReceptionMsg')); return; }
    const phone = app.data?.hotelPhone;
    if (!phone) { alert(t('callReceptionMsg')); return; }
    const digits = phone.replace(/[^0-9]/g, '');
    const msg = t('callReceptionWaMsg', { room: app.data?.roomName || '', hotel: app.data?.hotelName || '' });
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, '_blank');
  });
  document.getElementById('call-reception-tel')?.addEventListener('click', (e) => {
    e.preventDefault();
    const phone = app.data?.hotelPhone;
    if (!phone) { alert(t('callReceptionMsg')); return; }
    window.location.href = `tel:${phone}`;
  });

  // No molestar y solicitudes de servicio
  document.getElementById('dnd-toggle')?.addEventListener('click', toggleDnd);
  document.getElementById('door-alarm-toggle')?.addEventListener('click', toggleDoorAlarm);
  document.getElementById('door-alarm-dismiss')?.addEventListener('click', dismissDoorAlarm);
  document.getElementById('request-towels-btn')?.addEventListener('click', () => sendServiceRequest('towels'));
  document.getElementById('request-roomservice-btn')?.addEventListener('click', () => sendServiceRequest('roomservice'));
  document.getElementById('request-cleaning-btn')?.addEventListener('click', openCleaningModal);
  document.getElementById('request-late-checkout-btn')?.addEventListener('click', () => sendServiceRequest('late_checkout'));
  document.getElementById('request-maintenance-btn')?.addEventListener('click', () => sendServiceRequestWithNote('maintenance'));
  document.getElementById('request-other-btn')?.addEventListener('click', () => sendServiceRequestWithNote('other'));

  document.getElementById('report-app-problem-btn')?.addEventListener('click', openAppProblemModal);
  document.getElementById('app-problem-cancel')?.addEventListener('click', closeAppProblemModal);
  document.getElementById('app-problem-send')?.addEventListener('click', submitAppProblem);

  // Cerrar al hacer clic fuera de la tarjeta (clic en el fondo/backdrop) — solo
  // para los modales que el huésped abre con un botón. Onboarding, tutorial y la
  // alarma de puerta quedan afuera porque exigen una acción explícita para cerrarse.
  const DISMISSABLE_MODALS = {
    'report-modal-overlay':      closeReportModal,
    'schedule-modal-overlay':    closeScheduleModal,
    'cleaning-modal-overlay':    closeCleaningModal,
    'app-problem-modal-overlay': closeAppProblemModal,
    'help-modal-overlay':        closeHelpModal,
    'enlarge-modal-overlay':     closeEnlargeModal,
    'scene-modal-overlay':       closeSceneModal,
  };
  Object.entries(DISMISSABLE_MODALS).forEach(([overlayId, close]) => {
    document.getElementById(overlayId)?.addEventListener('click', (e) => {
      if (e.target.id === overlayId) close();
    });
  });

  // Botones globales del header: ⚠️ reportar y ❓ tutorial
  document.getElementById('btn-global-report')?.addEventListener('click', () => openReportModal(null));
  document.getElementById('btn-global-tutorial')?.addEventListener('click', () => {
    document.getElementById('onboarding-overlay')?.classList.add('hidden');
    document.getElementById('tutorial-choice-overlay')?.classList.remove('hidden');
  });

  // Onboarding: al cerrar el mensaje de bienvenida, ofrecer el tutorial guiado
  document.getElementById('onboarding-dismiss')?.addEventListener('click', () => {
    document.getElementById('onboarding-overlay')?.classList.add('hidden');
    // En un plan solo PMS no hay tutorial que ofrecer: todos sus pasos apuntan
    // a controles de domótica (luz de techo, cortina) que en esa habitación no
    // existen. Ofrecer enseñar algo que no está confunde más de lo que ayuda.
    if (esPlanPMS(app.plan)) {
      localStorage.setItem(`nexo_onboarded_${app.token || 'static'}`, '1');
      chequearModoEcoBienvenida();   // sin tutorial de por medio: el aviso de eco puede ir ya
      return;
    }
    document.getElementById('tutorial-choice-overlay')?.classList.remove('hidden');
  });

  // Modo eco activado (aviso al abrir): "Entendido" cierra; "Más info" abre Ajustes,
  // donde vive la tarjeta para activar/desactivar funciones o el modo eco completo.
  const cerrarEcoBienv = () => {
    document.getElementById('eco-bienvenida-overlay')?.classList.add('hidden');
    if (app.token) localStorage.setItem(`nexo_eco_bienvenida_${app.token}`, '1');
  };
  document.getElementById('eco-bienv-ok')?.addEventListener('click', cerrarEcoBienv);
  document.getElementById('eco-bienv-info')?.addEventListener('click', () => {
    cerrarEcoBienv();
    switchView('settings');
  });

  // El huésped ya sabe usar los controles smart: no mostrar el tutorial
  document.getElementById('tutorial-skip-btn')?.addEventListener('click', () => {
    document.getElementById('tutorial-choice-overlay')?.classList.add('hidden');
    localStorage.setItem(`nexo_onboarded_${app.token || 'static'}`, '1');
  });

  // Iniciar el tutorial guiado paso a paso
  document.getElementById('tutorial-start-btn')?.addEventListener('click', () => {
    document.getElementById('tutorial-choice-overlay')?.classList.add('hidden');
    startTutorial();
  });

  // Navegación y salida del tutorial guiado
  document.getElementById('tutorial-exit-btn')?.addEventListener('click', endTutorial);
  document.getElementById('tutorial-next')?.addEventListener('click', () => {
    if (tutorialStep >= TUTORIAL_STEPS.length - 1) return endTutorial();
    tutorialStep++;
    showTutorialStep();
  });
  document.getElementById('tutorial-prev')?.addEventListener('click', () => {
    if (tutorialStep === 0) return;
    tutorialStep--;
    showTutorialStep();
  });
  // Reenviar el clic al control real resaltado (luz/cortina) cuando cae dentro
  // del recuadro destacado, para que el huésped pueda probarlo de verdad en
  // vez de que el overlay del tutorial absorba el clic sin hacer nada.
  document.getElementById('tutorial-overlay')?.addEventListener('click', (e) => {
    if (e.target.closest('.tutorial-tooltip') || e.target.closest('.tutorial-exit-btn')) return;
    const step   = TUTORIAL_STEPS[tutorialStep];
    const target = step?.selector();
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      target.click();
    }
  });
  window.addEventListener('resize', () => {
    if (document.getElementById('tutorial-overlay').classList.contains('hidden')) return;
    const step = TUTORIAL_STEPS[tutorialStep];
    const target = step?.selector();
    if (target) positionTutorial(target, step);
  });

  // Acceso rápido al tema desde el encabezado (alterna claro/oscuro)
  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    const dark = document.body.classList.contains('theme-dark');
    setTheme(dark ? 'light' : 'dark');
  });

}

// ── ÍCONOS PERSONALIZADOS ─────────────────────────────────────────────────────
const ICON_BED = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/><path d="M2 17h20v3"/><path d="M2 20v-3"/><path d="M22 20v-3"/><path d="M4 10V6a1 1 0 0 1 1-1h6v5"/></svg>';
const ICON_LAMP = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8l4 7H4z"/><line x1="12" y1="11" x2="12" y2="19"/><line x1="8" y1="21" x2="16" y2="21"/></svg>';
const ICON_CEILING_LAMP = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="7"/><path d="M6 16l2-9h8l2 9z"/><line x1="6" y1="16" x2="18" y2="16"/></svg>';

const DEVICE_ICON_OVERRIDES = {
  led_cama:     ICON_BED,
  luz_velador1: ICON_LAMP,
  luz_velador2: ICON_LAMP,
  luz_techo:    ICON_CEILING_LAMP,
};
const deviceIcon = (key, fallback) => DEVICE_ICON_OVERRIDES[key] || fallback;

// ── FAVORITOS (accesos directos) ─────────────────────────────────────────────
const FAV_MAX = 3;

// channel: índice de canal para dispositivos multi-canal (enchufe con Estufa/
// Aromatizador en canales separados) — sin esto, favoritear cualquier canal
// marcaba el mismo "enchufe" genérico y la barra de accesos rápidos no podía
// saber cuál de los dos era ni mostrar su nombre real.
function favBtn(key, channel) {
  const favId = channel != null ? `${key}:${channel}` : key;
  const active = app.favorites.includes(favId);
  return `<button type="button" class="fav-btn ${active ? 'active' : ''}" data-key="${key}" ${channel != null ? `data-channel="${channel}"` : ''} data-action="toggle-favorite" aria-label="${t('favToggle')}">${active ? ICON_STAR : ICON_STAR_OUTLINE}</button>`;
}

function reportBtn(key) {
  return `<button type="button" class="report-btn" data-key="${key}" data-action="report-problem" aria-label="${t('reportProblemBtn')}">${ICON_ALERT_SM}</button>`;
}

function scheduleBtn(key) {
  return `<button type="button" class="report-btn" data-action="schedule-onoff" data-key="${key}" aria-label="${t('scheduleBtn')}">${ICON_CLOCK}</button>`;
}

function helpBtn(key) {
  return `<button type="button" class="report-btn" data-action="help-modal" data-key="${key}" aria-label="${t('helpBtn')}">${ICON_HELP}</button>`;
}

function enlargeBtn(key) {
  return `<button type="button" class="report-btn" data-action="enlarge-modal" data-key="${key}" aria-label="${t('enlargeBtn')}">${ICON_SEARCH}</button>`;
}

// Fila de iconos común a toda tarjeta de dispositivo — separada de card-head para
// que el interruptor principal nunca se vea forzado a compartir espacio con ellos
// (eso era lo que rompía el layout cuando la etiqueta del dispositivo era larga).
function cardIconsRow(key, scheduleHtml, channel) {
  return `<div class="card-icons-row">${favBtn(key, channel)}${scheduleHtml}</div>`;
}

function featureIconsRow(_key) {
  return '';
}

const HELP_TEXT_BY_TYPE = {
  light: 'helpTextLight', light_rgb: 'helpTextLED', curtain: 'helpTextCurtain',
  switch: 'helpTextSwitch', switch_3ch: 'helpTextSwitch', ac: 'helpTextAC',
};

window.openHelpModal = function(key) {
  const cfg = app.config[key];
  document.getElementById('help-modal-title').textContent = featureOrDeviceLabel(key);
  const textKey = cfg ? HELP_TEXT_BY_TYPE[cfg.type] : HELP_TEXT_BY_FEATURE[key];
  document.getElementById('help-modal-body').textContent = t(textKey || 'helpTextGeneric');
  document.getElementById('help-modal-overlay').classList.remove('hidden');
};

window.closeHelpModal = function() {
  document.getElementById('help-modal-overlay').classList.add('hidden');
};

let enlargedKey = null;

window.openEnlargeModal = function(key) {
  enlargedKey = key;
  document.getElementById('enlarge-modal-title').textContent = featureOrDeviceLabel(key);
  document.getElementById('enlarge-modal-body').innerHTML = app.config[key] ? buildCard(key) : (PLACEHOLDER_BUILDERS[key]?.() || '');
  document.getElementById('enlarge-modal-overlay').classList.remove('hidden');
};

window.closeEnlargeModal = function() {
  enlargedKey = null;
  document.getElementById('enlarge-modal-overlay').classList.add('hidden');
};

function saveFavorites() {
  try { localStorage.setItem(`nexo_favs_${app.token || 'static'}`, JSON.stringify(app.favorites)); } catch {}
}

function renderFavorites() {
  const bar = document.getElementById('favorites-bar');
  if (!bar) return;
  const items = app.favorites
    .map(favId => {
      const [key, channel] = favId.split(':');
      return { key, channel: channel !== undefined ? Number(channel) : null, cfg: app.config[key] };
    })
    // Enchufes pausados: nunca en favoritos aunque hayan quedado marcados antes.
    .filter(({ key, cfg }) => cfg && app.devices[key] && cfg.type !== 'switch' && cfg.type !== 'switch_3ch');

  if (!items.length) {
    bar.classList.add('hidden');
    bar.innerHTML = '';
    return;
  }

  bar.classList.remove('hidden');
  bar.innerHTML = `
    <div class="favorites-label">${t('sectionFavorites')}</div>
    <div class="favorites-row">${items.map(({ key, cfg, channel }) => buildFavChip(key, cfg, channel)).join('')}</div>`;
}

function buildFavChip(key, cfg, channel) {
  const s = app.devices[key] || {};
  const prop = channel != null ? `ch${channel + 1}` : (cfg.type === 'switch_3ch' ? 'ch1' : 'on');
  const on = !!s[prop];
  // El nombre de cada canal (ej. "🔥 Estufa") ya trae su propio emoji — un ícono
  // genérico aparte se vería duplicado, así que el chip de canal no lleva uno.
  const label = channel != null ? (cfg.channels?.[channel] || devLabel(key, cfg)) : devLabel(key, cfg);
  const icoHtml = channel != null ? '' : `<span class="fav-chip-ico">${cfg.type === 'ac' ? ICON_SNOWFLAKE : cfg.type === 'switch' || cfg.type === 'switch_3ch' ? ICON_PLUG : deviceIcon(key, ICON_BULB)}</span>`;
  return `<button type="button" class="fav-chip ${on ? 'on' : ''}" data-key="${key}" data-prop="${prop}" data-action="fav-toggle">
    ${icoHtml}<span class="fav-chip-label">${label}</span>
  </button>`;
}

function handleFavBarClick(e) {
  const chip = e.target.closest('[data-action="fav-toggle"]');
  if (!chip) return;
  const key  = chip.dataset.key;
  const prop = chip.dataset.prop;
  doCmd(key, { [prop]: !app.devices[key]?.[prop] });
  renderFavorites();
}

// ── MODO MANUAL (luces / enchufes) ───────────────────────────────────────────
function manualRow(key) {
  const manual = !!app._manual[key];
  return `<div class="manual-row">
    <span>${t('manualMode')}</span>
    <div class="toggle toggle-sm ${manual ? 'on' : ''}" data-key="${key}" data-action="toggle-manual"></div>
  </div>
  ${manual ? `<div class="manual-note">${t('manualNote')}</div>` : ''}`;
}

// ── MOTOR DE CORTINA DESBLOQUEADO ─────────────────────────────────────────────
// Solo se muestra si el hotel habilitó el modo manual para esta cortina
// (checkbox "Permitir modo manual" en el panel del hotel).
function unlockRow(key) {
  if (!app.config[key]?.manualUnlock) return '';
  const unlocked = !!app._unlocked[key];
  return `<div class="manual-row">
    <span>${t('unlockMotor')}</span>
    <div class="toggle toggle-sm ${unlocked ? 'on' : ''}" data-key="${key}" data-action="toggle-unlock"></div>
  </div>
  ${unlocked ? `<div class="manual-note">${t('unlockNoteOn')}</div>` : ''}`;
}

// ── RENDER GRID ────────────────────────────────────────────────────────────────
const CARD_ORDER = ['luz_techo','luz_velador2','led_cama','luz_velador1','cortina','enchufe'];

function renderGrid() {
  const grid = document.getElementById('device-grid');
  const securityKeys = securityDeviceKeys();
  // El enchufe (Estufa/Aromatizador) se inserta a mano junto a TV, no en su
  // posición de CARD_ORDER — ver más abajo.
  const keys = [
    ...CARD_ORDER.filter(k => app.config[k] && k !== 'enchufe'),
    ...Object.keys(app.config).filter(k => !CARD_ORDER.includes(k) && k !== 'enchufe' && !securityKeys.includes(k)),
  ];
  if (!keys.length) {
    grid.innerHTML = `
      <div class="support-card" style="text-align:center">
        <span class="support-card-ico">${ICON_BELL}</span>
        <p>${t('noDevicesMsg')}</p>
        <button class="support-btn" data-csp-action="goto-support">${t('noDevicesBtn')}</button>
      </div>` + buildTVCard() + buildAudioCard() + buildClimateIRCard() + buildCustomIRCards() + buildPlanFeatureCards();
    return;
  }
  // TV pareja con Cortina (misma fila en la grilla de 2 columnas), y el enchufe
  // (Estufa/Aromatizador) va justo después de TV — si no hay cortina, ambos
  // arrancan la grilla.
  const cards = keys.map(buildCard);
  const cortinaPos = keys.indexOf('cortina');
  cards.splice(cortinaPos >= 0 ? cortinaPos + 1 : cards.length, 0,
    buildTVCard() + buildAudioCard() + buildClimateIRCard() + buildCustomIRCards());
  grid.innerHTML = cards.join('') + buildPlanFeatureCards();
}

function updateCard(key) {
  const cfg = app.config[key];
  // El enchufe inteligente se reparte en varias tarjetas (una por canal/función)
  // — hay que refrescarlas todas, no solo una, porque comparten estado (ej.
  // "Modo manual" es del dispositivo completo, no de un canal en particular).
  if (cfg && cfg.type === 'switch_3ch') {
    const chs = cfg.channels || ['Canal 1', 'Canal 2', 'Canal 3'];
    chs.forEach((label, i) => {
      const el = document.getElementById(`card-${key}-${i}`);
      if (el) el.outerHTML = buildSwitchChannelCard(key, i, label);
    });
    if (scenesConfigMode) renderScenesConfigGrid();
    return;
  }
  const el = document.getElementById(`card-${key}`);
  if (el) el.outerHTML = buildCard(key);
  if (enlargedKey === key) document.getElementById('enlarge-modal-body').innerHTML = buildCard(key);
  if (scenesConfigMode) renderScenesConfigGrid();
}

function buildCard(key) {
  const cfg = app.config[key];
  if (!cfg) return '';
  // El blaster IR no tiene tarjeta propia (su interfaz es la tarjeta TV), y el
  // sensor de presencia es infraestructura de automatización (enciende la luz de
  // baño solo) — ninguno se muestra como aparato controlable al huésped.
  // El termómetro tampoco: es infraestructura de verificación del clima. Su
  // lectura se muestra DENTRO de la tarjeta del aire, que es donde informa.
  if (cfg.type === 'ir_remote' || cfg.type === 'presence_sensor' || cfg.type === 'temp_sensor') return '';
  if (!cfg.available) return buildOfflineCard(key, cfg);
  switch (cfg.type) {
    case 'light':     return buildLightCard(key);
    case 'light_rgb': return buildLEDCard(key);
    case 'curtain':   return buildCurtainCard(key);
    // ENCHUFES PAUSADOS — NO MOSTRAR EN NINGUNA PARTE DE LA APP (2026-07-26).
    // El enfoque de enchufes (switch/switch_3ch, incluidos los "botones
    // programables" 🔥 Estufa / 🌸 Aromatizador, que son enchufes rebautizados)
    // queda en pausa: se reemplaza por el blaster + aparatos IR. Los builders y
    // el flujo del instalador quedan definidos por si se reactiva más adelante;
    // acá TODO switch devuelve vacío. Ver también el checklist del backend.
    case 'switch':    return ''; // return app.config[key]?.programable ? buildSwitchCard(key) : '';
    case 'switch_3ch':return ''; // return buildSwitch3CHCard(key);
    case 'ac':        return buildACCard(key);
    default:          return '';
  }
}

function buildOfflineCard(key, cfg) {
  return `<div class="device-card offline" id="card-${key}">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${ICON_ALERT}</span><span class="card-label">${devLabel(key, cfg)}</span></div>
    </div>
    <div class="offline-label">${t('offlineDevice')}</div>
    <div class="card-icons-row">${reportBtn(key)}${helpBtn(key)}</div>
  </div>`;
}

// ── LIGHT CARD ────────────────────────────────────────────────────────────────
function buildLightCard(key) {
  const s   = app.devices[key] || {};
  const cfg = app.config[key];
  const on  = s.on;
  const int = s.intensity ?? 50;
  const ct  = s.colorTemp ?? 50;
  const manual = !!app._manual[key];

  return `<div class="device-card ${on && !manual ? 'on' : ''}" id="card-${key}">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${deviceIcon(key, ICON_BULB)}</span><span class="card-label">${devLabel(key, cfg)}</span></div>
    </div>
    <div class="card-status-row">
      <span class="card-status ${on && !manual ? 'on' : ''}">${manual ? t('manualMode') : (on ? t('onF') : t('offF'))}</span>
      <div class="toggle ${on ? 'on' : ''} ${manual ? 'disabled' : ''} ${app._fadeLock?.[key] ? 'fading' : ''}" data-key="${key}" data-action="toggle-light"></div>
    </div>
    ${on && !manual ? `
      <div class="slider-lbl">${t('intensity')}</div>
      <div class="slider-row">
        <input type="range" min="5" max="100" value="${int}"
          data-key="${key}" data-action="intensity">
        <span class="slider-val">${int}%</span>
      </div>
      <div class="ct-row">
        <button class="ct-btn ${ct < 33 ? 'active' : ''}" data-key="${key}" data-ct="5">${t('warm')}</button>
        <button class="ct-btn ${ct >= 33 && ct < 66 ? 'active' : ''}" data-key="${key}" data-ct="50">${t('neutral')}</button>
        <button class="ct-btn ${ct >= 66 ? 'active' : ''}" data-key="${key}" data-ct="95">${t('cold')}</button>
      </div>` : ''}
    ${manualRow(key)}
    ${cardIconsRow(key, scheduleBtn(key))}
  </div>`;
}

// ── LED RGB CARD ──────────────────────────────────────────────────────────────
const WHEEL_RADIUS = 55; // radio medio del anillo: (70px outer + 40px inner) / 2

// Presets de escena (ciclo de colores/efectos) para tiras/luces con scene_data
const LED_SCENE_PRESETS = [
  { id: 'colorido', label: '🌈 Colores' },
  { id: 'suave',    label: '🕯 Suave' },
  { id: 'fiesta',   label: '🎉 Fiesta' },
];

function buildLEDCard(key) {
  const s    = app.devices[key] || {};
  const cfg  = app.config[key];
  // Capacidades del aparato (una tira LED no tiene brillo/blanco propios). Sin
  // dato → luz RGB completa (comportamiento de antes).
  const caps = cfg.caps || { color: true, brightness: true, whiteTemp: true, scenes: false };
  const on   = s.on;
  const int  = s.intensity ?? 50;
  const ct   = s.colorTemp ?? 50;
  // Sin blanco, el modo por defecto es color (la tira no puede ir a blanco)
  const mode = s.mode ?? (caps.whiteTemp ? 'white' : 'colour');
  const hue  = s.hue ?? 0;
  const val  = s.value ?? 1000; // brillo del color (V del HSV), 0-1000
  const manual = !!app._manual[key];

  const isColour = mode === 'colour';
  const isScene  = mode === 'scene';
  const colorPreview = `hsl(${hue}, 100%, 50%)`;

  // Cursor de la rueda: saturación fija al máximo (color vivo), solo el hue mueve
  const angle = (hue * Math.PI) / 180;
  const cx    = Math.sin(angle) * WHEEL_RADIUS;
  const cy    = -Math.cos(angle) * WHEEL_RADIUS;

  return `<div class="device-card ${on && !manual ? 'on' : ''}" id="card-${key}">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${deviceIcon(key, ICON_BULB)}</span><span class="card-label">${devLabel(key, cfg)}</span></div>
    </div>
    <div class="card-status-row">
      <span class="card-status ${on && !manual ? 'on' : ''}">${manual ? t('manualMode') : (on ? t('onM') : t('offM'))}</span>
      <div class="toggle ${on ? 'on' : ''} ${manual ? 'disabled' : ''} ${app._fadeLock?.[key] ? 'fading' : ''}" data-key="${key}" data-action="toggle-light"></div>
    </div>
    ${on && !manual ? `
      ${!isColour && !isScene && caps.brightness ? `
      <div class="slider-lbl">${t('intensity')}</div>
      <div class="slider-row">
        <input type="range" min="5" max="100" value="${int}"
          data-key="${key}" data-action="intensity">
        <span class="slider-val">${int}%</span>
      </div>` : ''}
      <div class="ct-row">
        ${caps.whiteTemp ? `
        <button class="ct-btn ${!isColour && !isScene && ct < 33 ? 'active' : ''}" data-key="${key}" data-ct="5">${t('warm')}</button>
        <button class="ct-btn ${!isColour && !isScene && ct >= 33 && ct < 66 ? 'active' : ''}" data-key="${key}" data-ct="50">${t('neutral')}</button>
        <button class="ct-btn ${!isColour && !isScene && ct >= 66 ? 'active' : ''}" data-key="${key}" data-ct="95">${t('cold')}</button>` : ''}
        <button class="ct-btn color-toggle-btn ${isColour ? 'open' : ''}" data-key="${key}" data-action="enter-color"
          style="${isColour ? `border-color:${colorPreview};color:${colorPreview}` : ''}">
          <span class="color-dot" style="background:${colorPreview}"></span> ${t('color')}
        </button>
        ${caps.scenes ? `<button class="ct-btn ${isScene ? 'active' : ''}" data-key="${key}" data-action="enter-scene">${ICON_SPARKLES} ${t('scenes')}</button>` : ''}
      </div>
      ${isColour ? `
      <div class="color-wheel-wrap">
        <div class="color-wheel" data-key="${key}" data-action="pick-color">
          <div class="color-wheel-cursor" style="transform: translate(${cx}px, ${cy}px); background:${colorPreview}"></div>
          <div class="color-wheel-center" style="background:${colorPreview}"></div>
        </div>
      </div>
      <div class="slider-lbl">${t('colorIntensity')}</div>
      <div class="slider-row">
        <input type="range" min="10" max="100" value="${Math.round(val / 10)}"
          data-key="${key}" data-action="color-bright">
        <span class="slider-val">${Math.round(val / 10)}%</span>
      </div>` : ''}
      ${isScene ? `
      <div class="ct-row" style="flex-wrap:wrap">
        ${LED_SCENE_PRESETS.map(p => `<button class="ct-btn" data-key="${key}" data-scene="${p.id}">${p.label}</button>`).join('')}
      </div>` : ''}` : ''}
    ${manualRow(key)}
    ${cardIconsRow(key, scheduleBtn(key))}
  </div>`;
}

// ── CURTAIN CARD ──────────────────────────────────────────────────────────────
function buildCurtainCard(key) {
  const s   = app.devices[key] || {};
  const cfg = app.config[key];
  const pos = s.position ?? 0;
  const lbl = pos === 0 ? t('curtainClosed') : pos === 100 ? t('curtainOpened') : t('curtainPct', { p: pos });
  const unlocked = !!app._unlocked[key];

  return `<div class="device-card" id="card-${key}">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${ICON_WINDOW}</span><span class="card-label">${devLabel(key, cfg)}</span></div>
      <span class="card-status" style="margin:0">${unlocked ? t('manualShort') : lbl}</span>
    </div>
    <div class="curtain-vcontrol">
      <div class="curtain-vbtns">
        <button class="curtain-vbtn" data-key="${key}" data-curtain="open" ${unlocked ? 'disabled' : ''}>${t('curtainOpenBtn')}</button>
        <button class="curtain-vbtn stop-vbtn" data-key="${key}" data-curtain="stop" ${unlocked ? 'disabled' : ''}>${t('curtainStopBtn')}</button>
        <button class="curtain-vbtn" data-key="${key}" data-curtain="close" ${unlocked ? 'disabled' : ''}>${t('curtainCloseBtn')}</button>
      </div>
      <div class="curtain-vslider-wrap">
        <div class="curtain-vtrack">
          <input type="range" class="curtain-vslider" min="0" max="100" value="${pos}"
            data-key="${key}" data-action="curtain-pos" ${unlocked ? 'disabled' : ''}>
        </div>
        <span class="curtain-vval" id="curtain-val-${key}">${pos}%</span>
      </div>
    </div>
    ${unlockRow(key)}
    ${cardIconsRow(key, `<button type="button" class="report-btn" data-action="schedule-curtain" data-key="${key}" aria-label="${t('scheduleBtn')}">${ICON_CLOCK}</button>`)}
  </div>`;
}

// ── SWITCH CARD ───────────────────────────────────────────────────────────────
function buildSwitchCard(key) {
  const s   = app.devices[key] || {};
  const cfg = app.config[key];
  const on  = s.on;
  const manual = !!app._manual[key];

  return `<div class="device-card ${on && !manual ? 'on' : ''}" id="card-${key}">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${cfg.icon || (on ? '🔌' : '⬜')}</span><span class="card-label">${devLabel(key, cfg)}</span></div>
    </div>
    <div class="card-status-row">
      <span class="card-status ${on && !manual ? 'on' : ''}">${manual ? t('manualMode') : (on ? t('onM') : t('offM'))}</span>
      <div class="toggle ${on ? 'on' : ''} ${manual ? 'disabled' : ''}" data-key="${key}" data-action="toggle-switch"></div>
    </div>
    ${manualRow(key)}
    ${cardIconsRow(key, scheduleBtn(key))}
  </div>`;
}

// ── SWITCH MULTI-CANAL (2 o 3 canales) ───────────────────────────────────────
// El enchufe inteligente es el mecanismo, no el aparato — cada canal controla
// una función distinta (🔥 Estufa, 🌸 Aromatizador, etc.), así que cada uno se
// muestra como su propia tarjeta independiente (ícono+nombre+toggle), igual
// que un switch normal, en vez de agruparlos en una sola tarjeta con filas.
function buildSwitch3CHCard(key) {
  const cfg = app.config[key];
  const chs = cfg.channels || ['Canal 1', 'Canal 2', 'Canal 3'];
  return chs.map((label, i) => buildSwitchChannelCard(key, i, label)).join('');
}

function buildSwitchChannelCard(key, i, label) {
  const s = app.devices[key] || {};
  const vals = [s.ch1, s.ch2, s.ch3];
  const manual = !!app._manual[key];
  const on = !manual && vals[i];
  return `<div class="device-card ${on ? 'on' : ''}" id="card-${key}-${i}">
    <div class="card-head">
      <span class="card-label">${label}</span>
    </div>
    <div class="card-status-row">
      <span class="card-status ${on ? 'on' : ''}">${manual ? t('manualMode') : (vals[i] ? t('onM') : t('offM'))}</span>
      <div class="toggle ${vals[i] ? 'on' : ''} ${manual ? 'disabled' : ''}" data-key="${key}" data-action="toggle-ch${i + 1}"></div>
    </div>
    ${manualRow(key)}
    ${cardIconsRow(key, `<button type="button" class="report-btn" data-action="schedule-channel" data-key="${key}" data-ch="${i}" aria-label="${t('scheduleBtn')}">${ICON_CLOCK}</button>`, i)}
  </div>`;
}

// ── AC CARD ───────────────────────────────────────────────────────────────────
function buildACCard(key) {
  const s   = app.devices[key] || {};
  const cfg = app.config[key];
  const on  = s.on;
  const temp = s.temp ?? 22;

  return `<div class="device-card ${on ? 'on' : ''}" id="card-${key}">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${ICON_SNOWFLAKE}</span><span class="card-label">${devLabel(key, cfg)}</span></div>
    </div>
    <div class="card-status-row">
      <span class="card-status ${on ? 'on' : ''}">${on ? t('onM') : t('offM')}</span>
      <div class="toggle ${on ? 'on' : ''}" data-key="${key}" data-action="toggle-ac"></div>
    </div>
    <div class="ac-temp-display">
      <div class="ac-temp-val ${on ? 'on' : ''}">${temp}°C</div>
    </div>
    <div class="ac-temp-btns">
      <button class="ac-btn" data-key="${key}" data-temp="-1" ${on ? '' : 'disabled'}>−</button>
      <span class="ac-range">16 – 30°C</span>
      <button class="ac-btn" data-key="${key}" data-temp="+1" ${on ? '' : 'disabled'}>+</button>
    </div>
    ${cardIconsRow(key, scheduleBtn(key))}
  </div>`;
}

// ── FUNCIONES DEL PLAN (placeholders no conectados a dispositivos reales) ────
const PLAN_FEATURES_INFO = {
  bathroom: { minPlan: 'max_comfort' },
  bidet:    { minPlan: 'max_comfort' },
  rug:      { minPlan: 'max_comfort' },
};

function buildPlanFeatureCards() {
  const cards = [];
  // Baño y baño japonés solo si la habitación TIENE baño (el instalador lo marca).
  if (app.hasBathroom !== false) {
    cards.push(buildFeatureCard('bathroom', PLAN_FEATURES_INFO.bathroom, buildBathroomCard));
    cards.push(buildFeatureCard('bidet',    PLAN_FEATURES_INFO.bidet,    buildBidetCard));
  }
  cards.push(buildFeatureCard('rug', PLAN_FEATURES_INFO.rug, buildRugCard));
  return cards.join('');
}

// Si la habitación no tiene el plan requerido, la función se oculta por
// completo (sin indicar que existe) para no exponer al huésped funciones
// no disponibles en su estadía.
function buildFeatureCard(key, info, builder) {
  if (planLevel(app.plan) >= planLevel(info.minPlan)) return builder();
  return '';
}

// ── TV ────────────────────────────────────────────────────────────────────────
// Blaster IR de la habitación con control de TV aprendido (o null). La tarjeta
// TV pasa de placeholder a control REAL cuando el instalador aprendió tv_power.
// Busca el blaster IR de la habitación que tenga aprendido un botón dado.
function irDeviceKeyFor(button) {
  for (const [key, cfg] of Object.entries(app.config)) {
    if (cfg.type === 'ir_remote' && cfg.available && (cfg.irButtons || []).includes(button)) return key;
  }
  return null;
}
function irTvInfo() {
  const key = irDeviceKeyFor('tv_power');
  return key ? { key, buttons: app.config[key].irButtons } : null;
}
function irAudioInfo() {
  const key = irDeviceKeyFor('audio_power');
  return key ? { key, buttons: app.config[key].irButtons } : null;
}
function irAcInfo() {
  // `ac_power` es el botón viejo (un solo código para prender y apagar). Se
  // sigue reconociendo para no romper los hoteles que ya lo aprendieron, pero
  // los nuevos usan ac_off/ac_on, que es lo que de verdad funciona.
  const key = irDeviceKeyFor('ac_off') || irDeviceKeyFor('ac_on') || irDeviceKeyFor('ac_power');
  return key ? { key, buttons: app.config[key].irButtons } : null;
}

// 🔴 CÓMO SE ENCIENDE UN AIRE POR INFRARROJO, que es la razón de todo esto.
//
// Un control de aire no manda órdenes: manda el ESTADO COMPLETO en cada
// pulsación ("encendido, frío, 23°, ventilador medio"). Así que **cualquier
// acción lo enciende**, porque todo cuadro lleva "encendido" adentro.
//
// De ahí que el botón único de encendido solo apagara: se capturó apagando el
// equipo, y el cuadro guardado dice "apagado" para siempre.
//
// Orden de preferencia para prender: el código de encender si se aprendió; si
// no, cualquier acción — que es exactamente lo que el huésped descubrió solo
// cuando apretó "Temp +" y el aire arrancó.
function irCodigoParaEncender(ir) {
  const preferidos = ['ac_on', 'ac_mode_cool', 'ac_mode_heat', 'ac_temp_up', 'ac_mode'];
  const hallado = preferidos.find(id => ir.buttons.includes(id));
  if (hallado) return hallado;
  // Cualquier temperatura absoluta sirve: encender en 23° es encender.
  return ir.buttons.find(id => /^ac_t\d+$/.test(id)) || null;
}

// Aparatos IR PERSONALIZADOS: junta los botones custom (con irMeta) de todos los
// blasters, agrupados por "appliance". Devuelve [{ appliance, key, botones:[{id,label}] }].
function irCustomAppliances() {
  const grupos = {};
  for (const [key, cfg] of Object.entries(app.config)) {
    if (cfg.type !== 'ir_remote' || !cfg.available) continue;
    const meta = cfg.irMeta || {};
    for (const bid of (cfg.irButtons || [])) {
      if (!meta[bid]) continue; // solo los personalizados
      const ap = meta[bid].appliance || 'Controles IR';
      (grupos[ap] = grupos[ap] || { appliance: ap, key, botones: [] }).botones.push({ id: bid, label: meta[bid].label || bid });
    }
  }
  return Object.values(grupos);
}

// Una tarjeta por aparato IR personalizado, con sus botones (disparan el código)
function buildCustomIRCards() {
  return irCustomAppliances().map(g => `
    <div class="device-card" id="feature-ir-${g.appliance.replace(/[^a-z0-9]/gi, '')}">
      <div class="card-head">
        <div class="card-ico-name"><span class="card-ico">${ICON_WIFI_OFF}</span><span class="card-label">${g.appliance}</span></div>
      </div>
      <div class="source-row" style="flex-wrap:wrap">
        ${g.botones.map(b => `<button class="source-btn" data-action="ir" data-ir="${b.id}">${b.label}</button>`).join('')}
      </div>
    </div>`).join('');
}

// Tarjeta Home Theater / equipo de sonido — solo aparece si el blaster tiene
// aprendido audio_power. El mismo blaster puede controlar TV y audio a la vez.
function buildAudioCard() {
  const ir = irAudioInfo();
  if (!ir) return '';
  const s = app._placeholder.audio ?? (app._placeholder.audio = { on: false });
  const volBtns = ir.buttons.includes('audio_vol_up') && ir.buttons.includes('audio_vol_down');
  return `<div class="device-card" id="feature-audio">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></span><span class="card-label">${t('audioTitle')}</span></div>
    </div>
    <div class="source-row">
      <button class="source-btn" data-feature="audio" data-action="ir" data-ir="audio_power">${ICON_POWER} ${t('irOnOff')}</button>
    </div>
    ${volBtns ? `
    <div class="slider-lbl">${t('volume')}</div>
    <div class="source-row">
      <button class="source-btn" data-feature="audio" data-action="ir" data-ir="audio_vol_down">−</button>
      ${ir.buttons.includes('audio_mute') ? `<button class="source-btn" data-feature="audio" data-action="ir" data-ir="audio_mute">${ICON_MUTE}</button>` : ''}
      <button class="source-btn" data-feature="audio" data-action="ir" data-ir="audio_vol_up">+</button>
    </div>` : ''}
  </div>`;
}

// Tarjeta Clima por IR — aparece si el blaster aprendió ac_off, ac_on o el viejo
// ac_power. El aire
// por infrarrojo es de un solo sentido: no reporta su estado real, así que NO
// mostramos un número de temperatura (mentiría). Exponemos los botones que el
// instalador capturó de un control universal de AC: On/Off, Temp ± y Modo.
// ── TEMPERATURA DEL AIRE: − [número] + ──────────────────────────────────────
//
// Pedido de terreno: en vez de una fila de botones, el control clásico de
// termostato — bajar con −, subir con +, o escribir el número directo.
//
// 🔴 Lo que hay debajo NO es un termostato: son códigos IR absolutos, uno por
// temperatura, y solo existen los que el instalador capturó. Así que:
//   · el stepper salta ENTRE LOS CAPTURADOS (si hay 21, 23 y 25, el + desde 21
//     va a 23, no a 22 — mandar 22 sin código sería fingir);
//   · escribir un número directo manda el capturado MÁS CERCANO, y el toast
//     dice cuál salió, que es lo único afirmable;
//   · el número que se muestra es el último que MANDAMOS, no el estado del
//     aire — el IR no reporta. Antes del primer toque se muestra "--".
// ── QUÉ JUEGO DE TEMPERATURAS USAR ──────────────────────────────────────────
//
// 🔴 El cuadro IR lleva el MODO adentro: una temperatura capturada en frío pone
// frío SIEMPRE. Un huésped en invierno que toque "23°" del juego frío apagaría
// la calefacción. Por eso hay tres juegos posibles (genérico ac_tNN para
// hoteles de un solo modo, ac_cool_tNN y ac_heat_tNN para los de dos) y la app
// elige así:
//
//   1. Si el huésped ya eligió modo EN ESTA SESIÓN (tocó 🧊 o 🔥, o mandó una
//      temperatura de un juego específico), se usa el juego de ese modo.
//   2. Sin modo elegido: el genérico si existe; si no, el único juego que haya.
//   3. Con los dos juegos y sin modo elegido, frío — es determinista, el cuadro
//      que salga PONE ese modo (autoconsistente), y quien quiere calor toca 🔥
//      primero, que además queda recordado.
//
// El recuerdo es de lo que mandó LA APP, no del estado del aire: mismo criterio
// que el ventilador y el número mostrado. El IR no reporta.
function juegoTemps(ir) {
  const de = (re) => ir.buttons
    .filter(id => re.test(id))
    .map(id => Number(id.match(/(\d+)$/)[1]))
    .filter(g => Number.isFinite(g))
    .sort((a, b) => a - b);
  const generico = de(/^ac_t\d+$/);
  const frio = de(/^ac_cool_t\d+$/);
  const calor = de(/^ac_heat_t\d+$/);

  const modo = app._acModoUltimo || null;
  if (modo === 'heat' && calor.length) return { temps: calor, prefijo: 'ac_heat_t' };
  if (modo === 'cool' && frio.length) return { temps: frio, prefijo: 'ac_cool_t' };
  // 🔴 Con LOS DOS juegos capturados y sin modo elegido, NO se adivina: se
  // pregunta. La primera versión caía a frío por defecto y en terreno pasó
  // exactamente lo esperable: el huésped estaba calefaccionando, tocó una
  // temperatura, y el cuadro frío que salió le apagó la calefacción. La app no
  // puede ver el modo del aire (el IR no reporta) — lo único honesto es que el
  // huésped lo diga una vez por sesión.
  if (frio.length && calor.length) return { temps: [], prefijo: null, preguntarModo: true };
  if (generico.length) return { temps: generico, prefijo: 'ac_t' };
  if (calor.length) return { temps: calor, prefijo: 'ac_heat_t' };
  if (frio.length) return { temps: frio, prefijo: 'ac_cool_t' };
  return { temps: [], prefijo: 'ac_t' };
}

function tempsCapturadas(ir) {
  return juegoTemps(ir).temps;
}

// Fila de MODO del clima. Con termómetro es un modo LÓGICO (Frío/Calor/Auto) que
// decide la dirección del lazo del backend: Frío/Calor la fuerzan, Auto la elige
// según ambiente vs objetivo. NO manda un código IR directo — el lazo manda el
// código de temperatura, que ya lleva el modo adentro. Sin termómetro, son los
// botones de modo IR de siempre (que además eligen el juego de temperaturas).
function filaModoClima(ir) {
  if (hayTermometro()) {
    const m = app._acModoUltimo;
    const b = (modo, txt) => `<button class="source-btn ${m === modo ? 'active' : ''}" data-feature="climateIr" data-action="clima-modo" data-modo="${modo}">${txt}</button>`;
    return `<div class="slider-lbl">${t('acModoLbl')}</div>
    <div class="source-row">
      ${b('cool', t('acFrio'))}${b('heat', t('acCalor'))}${b('auto', t('acAuto'))}
    </div>`;
  }
  return filaIrOpcional(ir, [['ac_mode_cool', t('acFrio')], ['ac_mode_heat', t('acCalor')]], t('acModoLbl'));
}

function filaTemperaturaStepper(ir) {
  // 🔴 CON TERMÓMETRO el número es el OBJETIVO de la pieza (18-28°), no lo que se le
  // pide al equipo: el huésped elige a cuánto quiere la habitación y el lazo del
  // backend decide qué código mandar. Se muestra SIEMPRE, pero queda BLOQUEADO hasta
  // elegir modo arriba (Frío/Calor/Auto): el modo define la dirección (enfriar o
  // calentar). Bloqueado = grisado; al pasar el mouse o intentar tocarlo avisa.
  const hayTempsAbs = ir.buttons.some(b => /^ac_\w*t\d+$/.test(b));   // ac_cool_t16 / ac_heat_t22 / ac_t20
  if (hayTermometro() && hayTempsAbs) {
    const bloqueado = !app._acModoUltimo;
    const obj = app._acObjetivo ?? null;
    const amb = tempAmbienteActual();
    let pie = '';
    if (bloqueado) {
      pie = `<div class="slider-lbl" style="opacity:.75">🔒 ${t('acPrimeroModo')}</div>`;
    } else if (obj !== null && amb !== null && Math.abs(amb - obj) > 0.5) {
      pie = `<div class="slider-lbl" style="opacity:.7">${t('acLlegando')}</div>`;
    } else if (obj !== null && Number(app._acLlegadaMin) > 0) {
      pie = `<div class="slider-lbl" style="opacity:.7">${t('acLlego').replace('{n}', obj).replace('{min}', app._acLlegadaMin)}</div>`;
    }
    const rowAttrs = bloqueado ? `class="source-row ac-locked" title="${t('acPrimeroModo')}"` : 'class="source-row"';
    const dl = bloqueado ? ' data-locked="1"' : '';
    return `<div class="slider-lbl">${t('acQuiero')}</div>
    <div ${rowAttrs}>
      <button class="source-btn" data-feature="climateIr" data-action="ir-obj-paso" data-dir="-1"${dl}>−</button>
      <input class="source-btn" style="text-align:center;width:64px" type="number"
        inputmode="numeric" min="18" max="28"
        value="${obj ?? ''}" placeholder="--"${bloqueado ? ' readonly' : ''}
        data-feature="climateIr" data-action="ir-obj-directo"${dl}>
      <button class="source-btn" data-feature="climateIr" data-action="ir-obj-paso" data-dir="1"${dl}>+</button>
    </div>${pie}`;
  }

  // Sin termómetro: temperaturas ABSOLUTAS por modo; hay que elegir modo primero.
  const juego = juegoTemps(ir);
  // Con dos juegos y sin elección, el selector reemplaza al stepper: elegir el
  // modo acá NO manda nada al aire — solo decide de qué juego saldrán las
  // temperaturas, y el primer cuadro que se mande pondrá ese modo de todas
  // formas (lo lleva adentro).
  if (juego.preguntarModo) {
    // Con botones de modo capturados no se dibuja un SEGUNDO par Frío/Calor:
    // dos pares iguales que hacen cosas distintas es una trampa (captura de
    // terreno del 24-08). Solo la pista de usar los de arriba.
    const hayBotonesModo = ir.buttons.includes('ac_mode_cool') || ir.buttons.includes('ac_mode_heat');
    if (hayBotonesModo) {
      return `<div class="slider-lbl">${t('acTempLbl')}</div>
      <div class="slider-lbl" style="opacity:.7">${t('acElegiModoArriba')}</div>`;
    }
    // Las etiquetas ya traen su emoji (acFrio = "🧊 Frío"): no se antepone otro.
    return `<div class="slider-lbl">${t('acTempLbl')}</div>
    <div class="source-row">
      <button class="source-btn" data-feature="climateIr" data-action="ir-temp-modo" data-modo="cool">${t('acFrio')}</button>
      <button class="source-btn" data-feature="climateIr" data-action="ir-temp-modo" data-modo="heat">${t('acCalor')}</button>
    </div>
    <div class="slider-lbl" style="opacity:.7">${t('acElegiModo')}</div>`;
  }
  const temps = juego.temps;
  if (!temps.length) return '';

  // Sin termómetro no hay lazo posible: el número ES el del equipo, y la
  // etiqueta lo dice en vez de prometer un control que no existe.
  const ultimo = app._acTempUltima ?? null;
  return `<div class="slider-lbl">${t('acTempEquipo')}</div>
    <div class="source-row">
      <button class="source-btn" data-feature="climateIr" data-action="ir-temp-paso" data-dir="-1">−</button>
      <input class="source-btn" style="text-align:center;width:64px" type="number"
        inputmode="numeric" min="${temps[0]}" max="${temps[temps.length - 1]}"
        value="${ultimo ?? ''}" placeholder="--"
        data-feature="climateIr" data-action="ir-temp-directa">
      <button class="source-btn" data-feature="climateIr" data-action="ir-temp-paso" data-dir="1">+</button>
    </div>`;
}

// Manda el código capturado más cercano a lo pedido y deja el rastro.
function mandarTempIr(grados) {
  const ir = irAcInfo();
  if (!ir) return;
  const temps = tempsCapturadas(ir);
  if (!temps.length) return;
  const juego = juegoTemps(ir);
  const objetivo = temps.reduce((m, x) => Math.abs(x - grados) < Math.abs(m - grados) ? x : m, temps[0]);
  app._acTempUltima = objetivo;
  // Mandar del juego frío/calor también FIJA el modo (el cuadro lo lleva
  // adentro): se recuerda, para que el stepper siga en ese juego.
  if (juego.prefijo === 'ac_heat_t') app._acModoUltimo = 'heat';
  if (juego.prefijo === 'ac_cool_t') app._acModoUltimo = 'cool';
  const input = document.querySelector('input[data-action="ir-temp-directa"]');
  if (input) input.value = objetivo;
  apiCommand(ir.key, { ir: juego.prefijo + objetivo })
    .then(() => showToast(objetivo + '°' + (objetivo !== Math.round(grados) ? ' (' + t('acTempCercana') + ')' : '')))
    .catch(err => showToast(err.message, 'error'));
}

// El objetivo se guarda en el SERVIDOR y no en la app: el control corre en el
// barrido del backend cada pocos minutos, con o sin el teléfono del huésped
// abierto. Guardarlo solo acá haría que el lazo dejara de correr al bloquear la
// pantalla — justo cuando más falta hace, de noche.
async function fijarObjetivo(grados) {
  const obj = Math.min(28, Math.max(18, Math.round(grados * 2) / 2));
  app._acObjetivo = obj;
  app._acLlegadaMin = null;   // objetivo nuevo: el tiempo a la temperatura se re-mide
  renderGrid();
  try {
    await fetch(`${API}/room/${app.token}/clima-objetivo${roomParam()}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      // El modo (cool/heat/auto) viaja con el objetivo: define la dirección que
      // usa el lazo del backend. Solo se manda si el huésped ya eligió uno.
      body: JSON.stringify({ objetivo: obj, modo: app._acModoUltimo || undefined }),
    });
    showToast(t('acObjetivoOk').replace('{n}', obj));
  } catch { showToast(t('ecoError')); }
}

// Trae del server el objetivo vigente y el tiempo que tardó en llegar, para
// pintarlos. El objetivo vive en el server (el lazo corre en el barrido), así que
// al abrir Clima se hidrata desde ahí — si no, el número quedaría vacío al reabrir.
async function cargarObjetivoTermico() {
  if (window.location.protocol === 'file:' || !app.token) return;
  try {
    const r = await fetch(`${API}/room/${app.token}/clima-objetivo${roomParam()}`);
    if (!r.ok) return;
    const d = await r.json();
    if (d.objetivo != null) app._acObjetivo = d.objetivo;
    if (d.modo) app._acModoUltimo = d.modo;   // hidratar el modo elegido (desbloquea el stepper)
    app._acLlegadaMin = d.llegadaMin ?? null;
    renderClimateView();
  } catch { /* sin conexión: se muestra lo local */ }
}

function pasoObjetivo(dir) {
  const base = app._acObjetivo ?? tempAmbienteActual() ?? 22;
  fijarObjetivo(base + dir);
}

function pasoTempIr(dir) {
  const ir = irAcInfo();
  if (!ir) return;
  const temps = tempsCapturadas(ir);
  if (!temps.length) return;   // incluye el caso "hay que elegir modo primero"
  const actual = app._acTempUltima;
  // Sin historial, el primer toque parte del capturado más cercano a 22°: el
  // punto neutro de un hotel. Partir del extremo mandaría 16° de entrada.
  if (actual === null || actual === undefined) { mandarTempIr(22); return; }
  const i = temps.indexOf(actual);
  const siguiente = temps[Math.min(temps.length - 1, Math.max(0, i + dir))];
  if (siguiente !== actual) mandarTempIr(siguiente);
}

// ── VENTILADOR: UN botón que rota bajo → medio → alto → bajo ────────────────
//
// Pedido de terreno, imitando el control físico. La vuelta técnica: el botón
// del control cicla porque el CONTROL recuerda en qué velocidad va — el código
// capturado lleva UNA velocidad fija adentro, así que reproducirlo no cicla
// nada. Pero acá el que manda somos nosotros: la app recuerda cuál código
// mandó ELLA última vez y rota al siguiente.
//
// ⚠️ Ese recuerdo es de lo que NOSOTROS mandamos, no del estado del aire (el IR
// no reporta). Si alguien cambia la velocidad con el control físico, la
// rotación no se entera — y no importa: apretar el botón un par de veces
// recorre las tres velocidades igual. El toast dice cuál se acaba de mandar,
// que es lo único que se puede afirmar sin mentir.
const ORDEN_VENT = ['ac_fan_low', 'ac_fan_med', 'ac_fan_high'];

function filaVentiladorIr(ir) {
  const capturados = ORDEN_VENT.filter(id => ir.buttons.includes(id));
  if (!capturados.length) return '';
  return `<div class="source-row">
    <button class="source-btn" data-feature="climateIr" data-action="ir-vent">🌬 ${t('acVentLbl')}</button>
  </div>`;
}

function etiquetaVent(id) {
  return id === 'ac_fan_low' ? t('acVentBajo') : id === 'ac_fan_med' ? t('acVentMedio') : t('acVentAlto');
}

function cicloVentilador() {
  const ir = irAcInfo();
  if (!ir) return;
  const capturados = ORDEN_VENT.filter(id => ir.buttons.includes(id));
  if (!capturados.length) return;
  // El siguiente al último que MANDAMOS; si nunca mandamos, el primero.
  const idx = capturados.indexOf(app._ventUltimo);
  const id = capturados[(idx + 1) % capturados.length];
  app._ventUltimo = id;
  apiCommand(ir.key, { ir: id })
    .then(() => showToast('🌬 ' + etiquetaVent(id)))
    .catch(err => showToast(err.message, 'error'));
}

// Dibuja una fila de botones IR con los que el blaster REALMENTE aprendió.
//
// Que sea condicional es el punto: un botón que dispara un código inexistente
// no falla —el IR es ciego, no hay respuesta— así que el huésped lo aprieta, no
// pasa nada, y concluye que el aire está roto. Mejor no ofrecerlo.
function filaIrOpcional(ir, pares, etiqueta) {
  const hay = pares.filter(([id]) => ir.buttons.includes(id));
  if (!hay.length) return '';
  return `${etiqueta ? `<div class="slider-lbl">${etiqueta}</div>` : ''}
    <div class="source-row">
      ${hay.map(([id, txt]) =>
        `<button class="source-btn" data-feature="climateIr" data-action="ir" data-ir="${id}">${txt}</button>`).join('')}
    </div>`;
}

// La temperatura MEDIDA de la pieza, si hay un termómetro instalado. Es lo
// único del aire por IR que se puede afirmar sin mentir: no es el estado del
// equipo ni un eco de lo que mandamos — es una medición independiente. Y es la
// misma con la que A7 verifica que el comando se cumplió.
// La habitación tiene termómetro propio: con eso el objetivo es alcanzable y
// verificable, y el número del equipo deja de importarle a nadie.
function hayTermometro() {
  return Object.entries(app.config).some(([, c]) => c.type === 'temp_sensor' && c.available);
}

function tempAmbienteActual() {
  const entry = Object.entries(app.config).find(([, c]) => c.type === 'temp_sensor' && c.available);
  if (!entry) return null;
  const t = app.devices[entry[0]]?.tempAmbiente;
  return typeof t === 'number' ? t : null;
}

function lineaAmbiente() {
  const entry = Object.entries(app.config).find(([, c]) => c.type === 'temp_sensor' && c.available);
  if (!entry) return '';
  const st = app.devices[entry[0]];
  if (typeof st?.tempAmbiente !== 'number') return '';
  const hum = typeof st.humedad === 'number' ? ` · ${st.humedad}%` : '';
  return `<div class="slider-lbl">🌡 ${t('acAmbiente')}: <strong>${st.tempAmbiente}°${hum}</strong></div>`;
}

function buildClimateIRCard() {
  const ir = irAcInfo();
  if (!ir) return '';

  // Encender y apagar como BOTONES, cada uno con su código. Encender cae a
  // cualquier acción si no hay código propio —todo cuadro IR de aire lleva
  // "encendido" adentro—; apagar exige el suyo: no hay acción inocua que apague.
  const idEncender = ir.buttons.includes('ac_on') ? 'ac_on' : irCodigoParaEncender(ir);
  const idApagar = ir.buttons.includes('ac_off') ? 'ac_off'
    : (ir.buttons.includes('ac_power') ? 'ac_power' : null);

  // 🔴 SIN Temp ±, aunque estén aprendidos, y es una decisión: el código de un
  // aire lleva la temperatura ABSOLUTA con la que se capturó ("23°"), así que
  // "+" funciona una vez y después repite 23 para siempre. Se vio en terreno
  // dos veces. Lo que sirve son las temperaturas absolutas de abajo.
  const hasMode = ir.buttons.includes('ac_mode');
  return `<div class="device-card" id="feature-climateIr">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${ICON_SNOWFLAKE}</span><span class="card-label">${t('acTitle')}</span></div>
    </div>
    ${lineaAmbiente()}
    <div class="source-row">
      ${idEncender ? `<button class="source-btn" data-feature="climateIr" data-action="ir" data-ir="${idEncender}">${ICON_POWER} ${t('acEncender')}</button>` : ''}
      ${idApagar ? `<button class="source-btn" data-feature="climateIr" data-action="ir" data-ir="${idApagar}">${ICON_POWER} ${t('acApagar')}</button>` : ''}
    </div>
    ${hasMode && !ir.buttons.includes('ac_mode_cool') ? `
    <div class="source-row">
      <button class="source-btn" data-feature="climateIr" data-action="ir" data-ir="ac_mode">${ICON_REPEAT} ${t('acModeBtn')}</button>
    </div>` : ''}
    ${filaModoClima(ir)}
    ${filaVentiladorIr(ir)}
    ${filaTemperaturaStepper(ir)}
    ${filaIrOpcional(ir, [
      ['ac_display_off', t('acPantalla')],
      ['ac_display_on', t('acPantallaOn')],
    ])}
  </div>`;
}

function buildTVCard() {
  const s = app._placeholder.tv ?? (app._placeholder.tv = { on: false, vol: 30, source: 'cable' });
  const ir = irTvInfo();

  if (ir) {
    // Modo REAL: los botones disparan códigos IR por el blaster de la pieza.
    // El encendido es un código toggle (IR no reporta estado — s.on es cosmético).
    const volBtns = ir.buttons.includes('tv_vol_up') && ir.buttons.includes('tv_vol_down');
    // Sin estado ni toggle: el IR no reporta, y el "Encendido" que mostrábamos
    // se desincronizaba al primer uso del control físico. Botón que dispara.
    return `<div class="device-card" id="feature-tv">
      <div class="card-head">
        <div class="card-ico-name"><span class="card-ico">${ICON_TV}</span><span class="card-label">TV</span></div>
      </div>
      <div class="source-row">
        <button class="source-btn" data-feature="tv" data-action="ir" data-ir="tv_power">${ICON_POWER} ${t('irOnOff')}</button>
      </div>
      ${volBtns ? `
      <div class="slider-lbl">${t('volume')}</div>
      <div class="source-row">
        <button class="source-btn" data-feature="tv" data-action="ir" data-ir="tv_vol_down">−</button>
        ${ir.buttons.includes('tv_mute') ? `<button class="source-btn" data-feature="tv" data-action="ir" data-ir="tv_mute">${ICON_MUTE}</button>` : ''}
        <button class="source-btn" data-feature="tv" data-action="ir" data-ir="tv_vol_up">+</button>
      </div>` : ''}
      ${featureIconsRow('tv')}
    </div>`;
  }

  // Sin blaster IR con TV aprendida NO se muestra tarjeta: antes había un
  // placeholder "TV demo" (fuentes cable/netflix/hdmi ficticias) que confundía
  // en piezas sin TV real. La tarjeta aparece sola cuando se aprende tv_power.
  return '';
}

// ── BAÑO INTELIGENTE (sensor de presencia + luz) ─────────────────────────────
function buildBathroomCard() {
  const s = app._placeholder.bathroom ?? (app._placeholder.bathroom = {
    presence: false, lightOn: false, intensity: 60, colorTemp: 50, auto: true, manual: false,
    mode: 'white', hue: 0, saturation: 1000,
  });
  const manual = !!s.manual;
  const isColour = s.mode === 'colour';
  const wheelOpen = !!app._wheelOpen.bathroom;
  const colorPreview = `hsl(${s.hue}, 100%, 50%)`;
  const r     = (s.saturation / 1000) * WHEEL_RADIUS;
  const angle = (s.hue * Math.PI) / 180;
  const cx    = Math.sin(angle) * r;
  const cy    = -Math.cos(angle) * r;
  return `<div class="device-card full-width ${s.lightOn ? 'on' : ''}" id="feature-bathroom">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${ICON_DROPLET}</span><span class="card-label">${t('bathTitle')}</span></div>
    </div>
    <div class="card-status-row">
      <span class="card-status ${s.lightOn ? 'on' : ''}">${manual ? t('manualMode') : (s.lightOn ? t('lightOn') : t('lightOff'))}${s.auto && !manual ? t('bathAutoNote') : ''}</span>
      <div class="toggle ${s.lightOn ? 'on' : ''} ${manual ? 'disabled' : ''}" data-feature="bathroom" data-action="toggle"></div>
    </div>
    <div class="feature-row" data-action="presence" style="cursor:pointer">
      <span class="feature-row-label"><span class="led-dot ${s.presence ? 'on' : ''}"></span>${t('presenceSensor')}</span>
      <span class="preview-tag">${s.presence ? t('presenceYes') : t('presenceNo')}</span>
    </div>
    <div class="feature-row">
      <span class="feature-row-label">${t('bathAuto')}</span>
      <div class="toggle ${s.auto ? 'on' : ''} ${manual ? 'disabled' : ''}" data-feature="bathroom" data-action="auto"></div>
    </div>
    ${s.lightOn && !manual ? `
    <div class="slider-lbl">${t('intensity')}</div>
    <div class="slider-row">
      <input type="range" min="5" max="100" value="${s.intensity}" data-feature="bathroom" data-action="intensity">
      <span class="slider-val">${s.intensity}%</span>
    </div>
    <div class="ct-row">
      <button class="ct-btn ${!isColour && s.colorTemp < 33 ? 'active' : ''}" data-feature="bathroom" data-action="ct" data-ct="5">${t('warm')}</button>
      <button class="ct-btn ${!isColour && s.colorTemp >= 33 && s.colorTemp < 66 ? 'active' : ''}" data-feature="bathroom" data-action="ct" data-ct="50">${t('neutral')}</button>
      <button class="ct-btn ${!isColour && s.colorTemp >= 66 ? 'active' : ''}" data-feature="bathroom" data-action="ct" data-ct="95">${t('cold')}</button>
      <button class="ct-btn color-toggle-btn ${wheelOpen ? 'open' : ''}" data-feature="bathroom" data-action="toggle-wheel"
        style="${isColour ? `border-color:${colorPreview};color:${colorPreview}` : ''}">
        <span class="color-dot" style="background:${colorPreview}"></span> ${t('color')}
      </button>
    </div>
    ${wheelOpen ? `
    <div class="color-wheel-wrap">
      <div class="color-wheel" data-feature="bathroom" data-action="pick-color">
        <div class="color-wheel-cursor" style="transform: translate(${cx}px, ${cy}px); background:${colorPreview}"></div>
        <div class="color-wheel-center" style="background:${colorPreview}"></div>
      </div>
    </div>` : ''}` : ''}
    <div class="manual-row">
      <span>${t('manualMode')}</span>
      <div class="toggle toggle-sm ${manual ? 'on' : ''}" data-feature="bathroom" data-action="manual"></div>
    </div>
    ${manual ? `<div class="manual-note">${t('bathManualNote')}</div>` : ''}
    ${featureIconsRow('bathroom')}
  </div>`;
}

// ── BAÑO JAPONÉS (bidé inteligente) ──────────────────────────────────────────
// Solo expone el asiento calefaccionado; el resto se opera desde el panel físico.
function buildBidetCard() {
  const s = app._placeholder.bidet ?? (app._placeholder.bidet = { on: false });
  return `<div class="device-card ${s.on ? 'on' : ''}" id="feature-bidet">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${ICON_TOILET}</span><span class="card-label">${t('bidetTitle')}</span></div>
    </div>
    <div class="card-status-row">
      <span class="card-status ${s.on ? 'on' : ''}">${s.on ? t('heatedSeatOn') : t('heatedSeatOff')}</span>
      <div class="toggle ${s.on ? 'on' : ''}" data-feature="bidet" data-action="toggle"></div>
    </div>
    <p class="form-note" style="margin:0 0 10px">${t('bidetPanelNote')}</p>
    ${featureIconsRow('bidet')}
  </div>`;
}

// ── ALFOMBRA CALEFACCIONABLE ──────────────────────────────────────────────────
function buildRugCard() {
  const s = app._placeholder.rug ?? (app._placeholder.rug = { on: false, level: 'media' });
  const levels = [{ id: 'baja', label: t('low') }, { id: 'media', label: t('medium') }, { id: 'alta', label: t('high') }];
  return `<div class="device-card ${s.on ? 'on' : ''}" id="feature-rug">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${ICON_FLAME}</span><span class="card-label">${t('rugTitle')}</span></div>
    </div>
    <div class="card-status-row">
      <span class="card-status ${s.on ? 'on' : ''}">${s.on ? t('onF') : t('offF')}</span>
      <div class="toggle ${s.on ? 'on' : ''}" data-feature="rug" data-action="toggle"></div>
    </div>
    ${s.on ? `
    <div class="level-row">
      ${levels.map(l => `<button class="level-btn ${s.level === l.id ? 'active' : ''}" data-feature="rug" data-action="level" data-level="${l.id}">${l.label}</button>`).join('')}
    </div>` : ''}
    ${featureIconsRow('rug')}
  </div>`;
}

// ── VISTA CLIMA (AC + sensor de ventana + automatizaciones, Premium+) ────────
function buildClimateACCard() {
  const s = app._placeholder.climate;
  return `<div class="device-card ${s.acOn ? 'on' : ''}" id="feature-climateAc">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${ICON_SNOWFLAKE}</span><span class="card-label">${t('acTitle')}</span></div>
      <div class="toggle ${s.acOn ? 'on' : ''}" data-feature="climate" data-action="ac-toggle"></div>
    </div>
    <div class="ac-temp-display"><div class="ac-temp-val ${s.acOn ? 'on' : ''}">${s.temp}°C</div></div>
    <div class="ac-temp-btns">
      <button class="ac-btn" data-feature="climate" data-action="ac-temp" data-delta="-1" ${s.acOn ? '' : 'disabled'}>−</button>
      <span class="ac-range">16 – 30°C</span>
      <button class="ac-btn" data-feature="climate" data-action="ac-temp" data-delta="1" ${s.acOn ? '' : 'disabled'}>+</button>
    </div>
    ${featureIconsRow('climateAc')}
  </div>`;
}

function buildClimateAutoCard() {
  const s = app._placeholder.climate;
  return `<div class="device-card full-width" id="feature-climateAuto">
    <div class="card-head">
      <div class="card-ico-name"><span class="card-ico">${ICON_SETTINGS}</span><span class="card-label">${t('autoOffTitle')}</span></div>
      <div class="toggle ${s.autoOff ? 'on' : ''}" data-feature="climate" data-action="auto-toggle"></div>
    </div>
    <div class="card-status">${t('autoOffDesc')}</div>
    ${featureIconsRow('climateAuto')}
  </div>`;
}

function renderClimateView() {
  const el = document.getElementById('climate-content');

  // Sin plan Premium+ esta vista no es accesible (el nav-item está oculto),
  // pero se deja vacía por seguridad si se llegara a invocar.
  if (planLevel(app.plan) < PLAN_TIERS.premium) {
    el.innerHTML = '';
    return;
  }

  app._placeholder.climate ?? (app._placeholder.climate = { acOn: false, temp: 22, autoOff: true });

  el.innerHTML = `
    <div class="section-label">${t('acSection')}</div>
    <div class="device-grid">${buildClimateACCard()}</div>
    <div class="section-label" style="margin-top:18px">${t('autoSection')}</div>
    <div class="device-grid">${buildClimateAutoCard()}</div>
  `;

  // Si una de estas tarjetas está agrandada, refrescar también el modal —
  // mismo criterio que rerenderFeature() para tv/baño/bidé/alfombra.
  if (['climateAc', 'climateAuto'].includes(enlargedKey)) {
    document.getElementById('enlarge-modal-body').innerHTML = PLACEHOLDER_BUILDERS[enlargedKey]();
  }
}

// ── EVENTOS: FUNCIONES DEL PLAN (placeholders) ───────────────────────────────
// Mismo mapa que usan openEnlargeModal()/featureOrDeviceLabel() para que las
// "funciones del plan" (no son dispositivos Tuya reales, viven en
// app._placeholder en vez de app.config) tengan ayuda/reportar/agrandar igual
// que cualquier tarjeta de Controles.
const PLACEHOLDER_BUILDERS = {
  tv: buildTVCard, audio: buildAudioCard, climateIr: buildClimateIRCard,
  bathroom: buildBathroomCard, bidet: buildBidetCard, rug: buildRugCard,
  climateAc: buildClimateACCard, climateAuto: buildClimateAutoCard,
};
const PLACEHOLDER_TITLE_KEY = {
  tv: null, bathroom: 'bathTitle', bidet: 'bidetTitle', rug: 'rugTitle',
  climateAc: 'acTitle', climateAuto: 'autoOffTitle',
};
const HELP_TEXT_BY_FEATURE = {
  tv: 'helpTextTV', bathroom: 'helpTextBathroom', bidet: 'helpTextBidet', rug: 'helpTextRug',
  climateAc: 'helpTextAC', climateAuto: 'helpTextClimateAuto',
};

function featureOrDeviceLabel(key) {
  if (app.config[key]) return devLabel(key, app.config[key]);
  if (key in PLACEHOLDER_TITLE_KEY) return PLACEHOLDER_TITLE_KEY[key] ? t(PLACEHOLDER_TITLE_KEY[key]) : 'TV';
  return key;
}

function rerenderFeature(key) {
  const el = document.getElementById(`feature-${key}`);
  if (el && PLACEHOLDER_BUILDERS[key]) el.outerHTML = PLACEHOLDER_BUILDERS[key]();
  if (enlargedKey === key) document.getElementById('enlarge-modal-body').innerHTML = PLACEHOLDER_BUILDERS[key]();
}

// La tarjeta de baño nació como vista previa de una función del plan, sin
// hardware detrás. Cuando el instalador asigna una luz real al slot `luz_bano`,
// deja de ser una maqueta y tiene que mandar comandos de verdad — que es lo que
// faltaba: se asignaba la luz, la tarjeta se pintaba, y tocarla solo cambiaba un
// objeto en memoria.
const LUZ_BANO = 'luz_bano';
const banoReal = () => (app.config?.[LUZ_BANO]?.available ? LUZ_BANO : null);

// Manda el comando si hay luz real; si no, avisa que es vista previa. Devuelve
// true cuando fue real, para no mostrar el toast de maqueta encima.
function comandoBano(command) {
  const key = banoReal();
  if (!key) { showPreviewToast(); return false; }
  apiCommand(key, command).catch(err => showToast(err.message, 'error'));
  return true;
}

function showPreviewToast() {
  showToast(t('toastPreview'), '');
}

function handlePlanGridClick(e) {
  // Botones IR reales (tarjeta TV con blaster aprendido): disparan el código
  // por el backend — sin toast de "vista previa", esto SÍ llega al aparato.
  const irBtn = e.target.closest('[data-action="ir"]');
  if (irBtn) {
    const btn = irBtn.dataset.ir;
    // El modo elegido se recuerda: decide de qué juego salen las temperaturas
    // del stepper. Es memoria de lo que mandamos, no del estado del aire.
    if (btn === 'ac_mode_cool' || btn === 'ac_mode_heat') {
      app._acModoUltimo = btn === 'ac_mode_cool' ? 'cool' : 'heat';
      // Repintar YA: si el selector de temperaturas estaba esperando el modo,
      // el stepper tiene que aparecer con este toque, no con el próximo.
      const key2 = irDeviceKeyFor(btn);
      if (key2) apiCommand(key2, { ir: btn }).catch(err => showToast(err.message, 'error'));
      renderGrid();
      return;
    }
    const key = irDeviceKeyFor(btn); // el blaster que tenga ese botón (TV o audio)
    if (key) apiCommand(key, { ir: btn }).catch(err => showToast(err.message, 'error'));
    return;
  }

  // El ventilador rota entre los códigos capturados: la app recuerda cuál mandó.
  if (e.target.closest('[data-action="ir-vent"]')) {
    cicloVentilador();
    return;
  }

  // Stepper del objetivo BLOQUEADO (falta elegir modo): avisar en vez de actuar.
  // Cubre los −/+ y el input cuando todavía no se eligió Frío/Calor/Auto.
  if (e.target.closest('[data-locked]')) { showToast(t('acPrimeroModo')); return; }

  const pasoObj = e.target.closest('[data-action="ir-obj-paso"]');
  if (pasoObj) {
    pasoObjetivo(Number(pasoObj.dataset.dir) || 1);
    return;
  }

  const paso = e.target.closest('[data-action="ir-temp-paso"]');
  if (paso) {
    pasoTempIr(Number(paso.dataset.dir) || 1);
    return;
  }

  const modoTemp = e.target.closest('[data-action="ir-temp-modo"]');
  if (modoTemp) {
    app._acModoUltimo = modoTemp.dataset.modo;
    renderGrid();   // el selector se convierte en stepper del juego elegido
    return;
  }

  // Modo lógico del clima (con termómetro): Frío/Calor fuerzan la dirección,
  // Auto la deja al sistema (por ambiente vs objetivo). Desbloquea el stepper.
  const climaModo = e.target.closest('[data-action="clima-modo"]');
  if (climaModo) {
    app._acModoUltimo = climaModo.dataset.modo;   // 'cool' | 'heat' | 'auto'
    renderGrid();
    // Si ya hay objetivo fijado, reaplicar con el modo nuevo: el backend cambia
    // la dirección al toque, no en el próximo barrido.
    if (app._acObjetivo != null) fijarObjetivo(app._acObjetivo);
    return;
  }

  const tog = e.target.closest('[data-action="toggle"]');
  if (tog) {
    const key = tog.dataset.feature;
    // El clima IR comparte estado con la vista Clima (app._placeholder.climate,
    // campo acOn) — su on/off es cosmético porque el IR no reporta estado.
    if (key === 'climateIr') {
      const c = app._placeholder.climate ?? (app._placeholder.climate = { acOn: false, temp: 22, autoOff: true });
      c.acOn = !c.acOn;
    } else {
      const s = app._placeholder[key];
      if (key === 'bathroom') s.lightOn = !s.lightOn;
      else s.on = !s.on;
    }
    rerenderFeature(key);
    // Baño con luz real instalada: encender/apagar de verdad.
    if (key === 'bathroom' && banoReal()) {
      comandoBano({ on: app._placeholder.bathroom.lightOn });
      return;
    }
    // TV, equipo de sonido y aire con blaster IR son control real: disparan el
    // código de encendido (toggle IR) en vez del toast de vista previa.
    // Los aparatos IR ya no dibujan toggle —el estado no se puede saber y
    // mentirlo desincroniza la app al primer uso del control físico—, pero el
    // camino queda por si algún markup viejo lo dispara: manda ENCENDER, lo
    // único honesto que un toggle IR puede hacer.
    if (key === 'climateIr') {
      const ir = irAcInfo();
      if (ir) {
        const boton = irCodigoParaEncender(ir);
        if (boton) apiCommand(ir.key, { ir: boton }).catch(err => showToast(err.message, 'error'));
        else showToast(t('acSinCodigo'));
        return;
      }
    }
    const powerBtn = key === 'tv' ? 'tv_power' : key === 'audio' ? 'audio_power' : null;
    if (powerBtn) {
      const irKey = irDeviceKeyFor(powerBtn);
      if (irKey) {
        apiCommand(irKey, { ir: powerBtn }).catch(err => showToast(err.message, 'error'));
        return;
      }
    }
    showPreviewToast();
    return;
  }

  const bathroomManual = e.target.closest('[data-feature="bathroom"][data-action="manual"]');
  if (bathroomManual) {
    const s = app._placeholder.bathroom;
    s.manual = !s.manual;
    if (s.manual) {
      // En modo manual la luz queda fija encendida en cálido: el interruptor
      // físico la enciende/apaga como una luz normal.
      s.lightOn = true;
      s.colorTemp = 5;
    }
    rerenderFeature('bathroom');
    showPreviewToast();
    return;
  }

  const bathroomAuto = e.target.closest('[data-feature="bathroom"][data-action="auto"]');
  if (bathroomAuto) {
    app._placeholder.bathroom.auto = !app._placeholder.bathroom.auto;
    rerenderFeature('bathroom');
    showPreviewToast();
    return;
  }

  const bathroomCt = e.target.closest('[data-feature="bathroom"][data-action="ct"]');
  if (bathroomCt) {
    app._placeholder.bathroom.colorTemp = parseInt(bathroomCt.dataset.ct);
    app._placeholder.bathroom.mode = 'white';
    app._wheelOpen.bathroom = false; // cerrar la rueda de color al elegir temperatura
    rerenderFeature('bathroom');
    // Elegir temperatura implica luz encendida: si no, el huésped toca "cálido"
    // y no pasa nada visible.
    if (!comandoBano({ on: true, colorTemp: app._placeholder.bathroom.colorTemp })) return;
    app._placeholder.bathroom.lightOn = true;
    return;
  }

  // Mismo selector de color que las luces RGB reales, pero sobre el placeholder.
  const bathroomWheelBtn = e.target.closest('[data-feature="bathroom"][data-action="toggle-wheel"]');
  if (bathroomWheelBtn) {
    const s = app._placeholder.bathroom;
    const wasOpen = !!app._wheelOpen.bathroom;
    app._wheelOpen.bathroom = !wasOpen;
    if (!wasOpen && s.mode !== 'colour') {
      s.mode = 'colour';
      s.lightOn = true;
    }
    rerenderFeature('bathroom');
    showPreviewToast();
    return;
  }


  const presence = e.target.closest('[data-action="presence"]');
  if (presence) {
    app._placeholder.bathroom.presence = !app._placeholder.bathroom.presence;
    rerenderFeature('bathroom');
    showPreviewToast();
    return;
  }

  const src = e.target.closest('[data-action="source"]');
  if (src) {
    app._placeholder.tv.source = src.dataset.source;
    rerenderFeature('tv');
    showPreviewToast();
    return;
  }

  const level = e.target.closest('[data-action="level"]');
  if (level) {
    app._placeholder.rug.level = level.dataset.level;
    rerenderFeature('rug');
    showPreviewToast();
    return;
  }

  const acTog = e.target.closest('[data-action="ac-toggle"]');
  if (acTog) {
    app._placeholder.climate.acOn = !app._placeholder.climate.acOn;
    renderClimateView();
    showPreviewToast();
    return;
  }

  const acTemp = e.target.closest('[data-action="ac-temp"]');
  if (acTemp && !acTemp.disabled) {
    const s = app._placeholder.climate;
    s.temp = Math.min(30, Math.max(16, s.temp + parseInt(acTemp.dataset.delta)));
    renderClimateView();
    showPreviewToast();
    return;
  }

  const autoTog = e.target.closest('[data-action="auto-toggle"]');
  if (autoTog) {
    app._placeholder.climate.autoOff = !app._placeholder.climate.autoOff;
    renderClimateView();
    showPreviewToast();
    return;
  }
}

function handlePlanGridInput(e) {
  // Temperatura del aire escrita a mano. Va por 'change' (al confirmar), no por
  // 'input': mandar un código IR por cada dígito tecleado dispararía 2 y luego
  // 23 al escribir "23".
  const objDirecto = e.target.closest('input[data-action="ir-obj-directo"]');
  if (objDirecto) {
    if (e.type !== 'change') return;
    const v = Number(objDirecto.value);
    if (Number.isFinite(v) && objDirecto.value.trim() !== '') fijarObjetivo(v);
    return;
  }

  const tempDirecta = e.target.closest('input[data-action="ir-temp-directa"]');
  if (tempDirecta) {
    if (e.type !== 'change') return;
    const v = Number(tempDirecta.value);
    if (Number.isFinite(v) && tempDirecta.value.trim() !== '') mandarTempIr(v);
    return;
  }
  const vol = e.target.closest('input[data-feature="tv"][data-action="vol"]');
  if (vol) {
    const val = parseInt(vol.value);
    const valEl = vol.parentElement?.querySelector('.slider-val');
    if (valEl) valEl.textContent = val + '%';
    app._placeholder.tv.vol = val;
    return;
  }

  const intensity = e.target.closest('input[data-feature="bathroom"][data-action="intensity"]');
  if (intensity) {
    const val = parseInt(intensity.value);
    const valEl = intensity.parentElement?.querySelector('.slider-val');
    if (valEl) valEl.textContent = val + '%';
    app._placeholder.bathroom.intensity = val;
    // Con luz real, el brillo se aplica de verdad — pero SOLO al soltar. El
    // manejador está atado a 'input' y a 'change', así que mandar en ambos
    // dispararía un comando por cada píxel arrastrado y saturaría la malla
    // Zigbee. El número en pantalla sí sigue el dedo, con 'input'.
    if (e.type === 'change' && banoReal()) comandoBano({ on: true, intensity: val });
    return;
  }
}

// ── EVENT: CLICK EN EL GRID ───────────────────────────────────────────────────
function handleGridClick(e) {
  // Reportar un problema con el dispositivo
  const reportBtnEl = e.target.closest('[data-action="report-problem"]');
  if (reportBtnEl) { openReportModal(reportBtnEl.dataset.key); return; }

  // CSP S5: botones de tarjeta que eran `onclick` inline (los mataría una CSP
  // script-src 'self'). Manejados acá y con return — antes del click de fondo de
  // la tarjeta (5182, que abre el modal ampliado): reemplaza el stopPropagation
  // del inline. (De todas formas ese fondo ya excluye clicks en <button>.)
  const schedOnOff = e.target.closest('[data-action="schedule-onoff"]');
  if (schedOnOff) { scheduleOnOff(schedOnOff.dataset.key); return; }
  const helpBtnEl = e.target.closest('[data-action="help-modal"]');
  if (helpBtnEl) { openHelpModal(helpBtnEl.dataset.key); return; }
  const enlargeBtnEl = e.target.closest('[data-action="enlarge-modal"]');
  if (enlargeBtnEl) { openEnlargeModal(enlargeBtnEl.dataset.key); return; }
  const schedCurtain = e.target.closest('[data-action="schedule-curtain"]');
  if (schedCurtain) { scheduleCurtain(schedCurtain.dataset.key); return; }
  const schedChannel = e.target.closest('[data-action="schedule-channel"]');
  if (schedChannel) { scheduleChannel(schedChannel.dataset.key, Number(schedChannel.dataset.ch)); return; }

  // Marcar/desmarcar favorito (acceso directo)
  const favBtnEl = e.target.closest('[data-action="toggle-favorite"]');
  if (favBtnEl) {
    const key = favBtnEl.dataset.key;
    const channel = favBtnEl.dataset.channel;
    const favId = channel !== undefined ? `${key}:${channel}` : key;
    const idx = app.favorites.indexOf(favId);
    if (idx >= 0) {
      app.favorites.splice(idx, 1);
    } else {
      if (app.favorites.length >= FAV_MAX) {
        showToast(t('toastFavMax'), '');
        return;
      }
      app.favorites.push(favId);
    }
    saveFavorites();
    updateCard(key);
    renderFavorites();
    return;
  }

  // Modo manual (luces / enchufes)
  const manualTog = e.target.closest('[data-action="toggle-manual"]');
  if (manualTog) {
    const key = manualTog.dataset.key;
    app._manual[key] = !app._manual[key];
    const type = app.config[key]?.type;
    if (app._manual[key] && (type === 'light' || type === 'light_rgb')) {
      // En modo manual la luz queda fija encendida en cálido: el interruptor
      // físico la enciende/apaga como una luz normal.
      doCmd(key, { on: true, mode: 'white', colorTemp: 5 });
    } else {
      updateCard(key);
    }
    showToast(app._manual[key] ? t('toastManualOn') : t('toastManualOff'), '');
    return;
  }

  // Motor de cortina desbloqueado (manual)
  const unlockTog = e.target.closest('[data-action="toggle-unlock"]');
  if (unlockTog) {
    const key = unlockTog.dataset.key;
    app._unlocked[key] = !app._unlocked[key];
    updateCard(key);
    showToast(app._unlocked[key] ? t('toastUnlockOn') : t('toastUnlockOff'), '');
    return;
  }

  // Armar/desarmar alarma de un sensor de puerta/ventana (pestaña Seguridad)
  const sensorAlarmTog = e.target.closest('[data-action="toggle-sensor-alarm"]');
  if (sensorAlarmTog) {
    toggleSensorAlarm(sensorAlarmTog.dataset.key);
    return;
  }

  // Toggle genérico de luz/LED
  const tog = e.target.closest('[data-action^="toggle-light"]');
  if (tog) {
    const key = tog.dataset.key;
    if (app._fadeLock?.[key]) return;   // fundido en curso: un toque a mitad pisa los pasos
    const encendida = !!app.devices[key]?.on;
    const brillo    = Number(app.devices[key]?.intensity);
    // Solo las luces con fundido por hardware (Zigbee, `fade:true`) reciben las
    // pistas de dimeo y bloquean el botón mientras dura. Tuya local (`fade:false`)
    // va on/off directo, instantáneo y sin bloqueo: su rampa por software era una
    // escalera sobre el túnel.
    const conFundido = app.devices[key]?.fade === true && Number.isFinite(brillo) && brillo > 0;
    if (conFundido) lockFade(key, encendida ? 'off' : 'on');
    if (encendida) {
      doCmd(key, conFundido ? { on: false, dimeoDesde: brillo } : { on: false });
    } else {
      doCmd(key, conFundido ? { on: true, dimeoHasta: brillo } : { on: true });
    }
    return;
  }

  // Toggle de enchufe
  const sw = e.target.closest('[data-action="toggle-switch"]');
  if (sw) { doCmd(sw.dataset.key, { on: !app.devices[sw.dataset.key]?.on }); return; }

  // Toggle AC
  const ac = e.target.closest('[data-action="toggle-ac"]');
  if (ac) { doCmd(ac.dataset.key, { on: !app.devices[ac.dataset.key]?.on }); return; }

  // Toggle canales switch_3ch
  ['1','2','3'].forEach(n => {
    const ch = e.target.closest(`[data-action="toggle-ch${n}"]`);
    if (ch) {
      const key = ch.dataset.key;
      const prop = `ch${n}`;
      doCmd(key, { [prop]: !app.devices[key]?.[prop] });
    }
  });

  // Color temp buttons
  const ctBtn = e.target.closest('[data-ct]');
  if (ctBtn) {
    const key = ctBtn.dataset.key;
    const ct  = parseInt(ctBtn.dataset.ct);
    const cmd = { colorTemp: ct, mode: 'white' };
    if (!app.devices[key]?.on) cmd.on = true;
    app._wheelOpen[key] = false; // cerrar la rueda de color al elegir temperatura
    doCmd(key, cmd);
    return;
  }

  // Botones de cortina (open/stop/close) — la barra se anima gradualmente, ver curtainControl()
  const cBtn = e.target.closest('[data-curtain]');
  if (cBtn) {
    curtainControl(cBtn.dataset.key, cBtn.dataset.curtain);
    return;
  }

  // Botón "Color": entra a modo color. En modo color la tarjeta oculta la barra
  // de intensidad blanca (el brillo queda al máximo) y muestra la rueda + la
  // barra de saturación ("intensidad del color"). Se vuelve a blanco tocando
  // Cálido/Neutro/Frío (handler data-ct, que fija mode:'white').
  const colorBtn = e.target.closest('[data-action="enter-color"]');
  if (colorBtn) {
    const key = colorBtn.dataset.key;
    const d   = app.devices[key] || {};
    // Aplicar YA el color de la rueda (hue actual, saturación llena, brillo
    // actual) — sin esto el aparato quedaba en blanco hasta tocar la rueda.
    doCmd(key, { on: true, mode: 'colour', hue: d.hue ?? 0, saturation: 1000, value: d.value ?? 1000 });
    return;
  }

  // Botón "Escenas": entra al modo escena (efectos/ciclo de colores). Muestra
  // los presets; el huésped elige uno (data-scene).
  const sceneModeBtn = e.target.closest('[data-action="enter-scene"]');
  if (sceneModeBtn) {
    const key = sceneModeBtn.dataset.key;
    app.devices[key].mode = 'scene';
    updateCard(key);
    return;
  }

  // Preset de escena elegido → lo aplica en el aparato (work_mode=scene)
  const sceneBtn = e.target.closest('[data-scene]');
  if (sceneBtn && sceneBtn.dataset.key) {
    doCmd(sceneBtn.dataset.key, { on: true, scene: sceneBtn.dataset.scene, mode: 'scene' });
    return;
  }

  // AC +/−
  const acBtn = e.target.closest('[data-temp]');
  if (acBtn && !acBtn.disabled) {
    const key    = acBtn.dataset.key;
    const delta  = parseInt(acBtn.dataset.temp);
    const newTemp = Math.min(30, Math.max(16, (app.devices[key]?.temp ?? 22) + delta));
    doCmd(key, { temp: newTemp });
    return;
  }

  // Click en el fondo de la tarjeta (no en un control interactivo) → modal ampliado
  const cardEl = e.target.closest('.device-card');
  if (cardEl && !e.target.closest('button, input, label, select, [data-action], [data-curtain], [data-ct], [data-temp]')) {
    const raw = cardEl.id.replace(/^(card-|feature-)/, '');
    if (raw) openEnlargeModal(raw);
  }
}

// ── EVENT: INPUT EN EL GRID (sliders) ────────────────────────────────────────
function handleGridInput(e) {
  // Slider de intensidad
  const intSlider = e.target.closest('input[data-action="intensity"]');
  if (intSlider) {
    const key = intSlider.dataset.key;
    const val = parseInt(intSlider.value);
    // Actualizar display inmediatamente
    const valEl = intSlider.parentElement?.querySelector('.slider-val');
    if (valEl) valEl.textContent = val + '%';
    // Debounce a 250ms
    clearTimeout(app._timers[`int-${key}`]);
    app._timers[`int-${key}`] = setTimeout(() => doCmd(key, { intensity: val }), 250);
    return;
  }

  // Barra de "intensidad del color" (solo en modo color): controla el BRILLO del
  // color (V del HSV), manteniendo el color a saturación máxima. Bajarla atenúa
  // el mismo color en vez de lavarlo a blanco. 10-100% → 100-1000.
  const brightSlider = e.target.closest('input[data-action="color-bright"]');
  if (brightSlider) {
    const key = brightSlider.dataset.key;
    const val = parseInt(brightSlider.value); // 10-100
    const valEl = brightSlider.parentElement?.querySelector('.slider-val');
    if (valEl) valEl.textContent = val + '%';
    app.devices[key].value = val * 10;
    clearTimeout(app._timers[`cb-${key}`]);
    app._timers[`cb-${key}`] = setTimeout(
      () => doCmd(key, { on: true, hue: app.devices[key]?.hue ?? 0, saturation: 1000, value: val * 10, mode: 'colour' }), 250);
    return;
  }

  // Slider de posición de cortina
  const curtainSlider = e.target.closest('input[data-action="curtain-pos"]');
  if (curtainSlider) {
    const key = curtainSlider.dataset.key;
    stopCurtainAnim(key); // el huésped toma control manual — cancela cualquier animación en curso
    const pos = parseInt(curtainSlider.value);
    const valEl = document.getElementById(`curtain-val-${key}`);
    if (valEl) valEl.textContent = pos + '%';
    clearTimeout(app._timers[`curtain-${key}`]);
    app._timers[`curtain-${key}`] = setTimeout(() => {
      app.devices[key].position = pos;
      doCmd(key, { position: pos });
    }, 250);
  }
}

// ── COLOR WHEEL DRAG ─────────────────────────────────────────────────────────
// Permite arrastrar el cursor sobre el anillo para cambiar el color en tiempo real.
// Usa PointerEvents (captura mouse + touch con una sola API).
let _wheelDragging = false;
let _wheelKey = null; // dispositivo real cuya rueda se está arrastrando

function applyColorFromWheel(wheel, clientX, clientY) {
  const rect = wheel.getBoundingClientRect();
  const dx = clientX - (rect.left + rect.width / 2);
  const dy = clientY - (rect.top  + rect.height / 2);
  let hue = Math.atan2(dx, -dy) * (180 / Math.PI);
  if (hue < 0) hue += 360;
  hue = Math.round(hue);

  const key     = wheel.dataset.key;
  const feature = wheel.dataset.feature;
  // Saturación fija al máximo (color vivo); el cursor va siempre al borde y solo
  // el ángulo (hue) cambia al arrastrar. El brillo lo lleva la barra (V).
  const cursor = wheel.querySelector('.color-wheel-cursor');
  const center = wheel.querySelector('.color-wheel-center');
  const color  = `hsl(${hue}, 100%, 50%)`;
  const angle  = (hue * Math.PI) / 180;
  const cx = Math.sin(angle) * WHEEL_RADIUS;
  const cy = -Math.cos(angle) * WHEEL_RADIUS;
  if (cursor) cursor.style.transform = `translate(${cx}px, ${cy}px)`;
  if (center) center.style.background = color;
  if (cursor) cursor.style.background = color;

  if (key) {
    // CLAVE: durante el arrastre NO usamos doCmd (que re-renderiza la tarjeta y
    // destruye la rueda a mitad del gesto). Actualizamos el estado y mandamos el
    // comando directo; el re-render se hace UNA vez al soltar (pointerup).
    app.devices[key].hue = hue;
    app.devices[key].mode = 'colour';
    clearTimeout(app._timers[`wheel-${key}`]);
    // Saturación llena (color vivo) + el brillo actual (V); el hue lo mueve la rueda.
    app._timers[`wheel-${key}`] = setTimeout(
      () => apiCommand(key, { on: true, hue, saturation: 1000, value: app.devices[key]?.value ?? 1000, mode: 'colour' }).catch(() => {}), 80
    );
  } else if (feature === 'bathroom') {
    clearTimeout(app._timers['wheel-bathroom']);
    app._timers['wheel-bathroom'] = setTimeout(
      () => setBathroomColor(hue), 80
    );
  }
}

function setBathroomColor(hue) {
  const s = app._placeholder.bathroom;
  s.hue = hue; s.saturation = 1000; s.mode = 'colour'; s.lightOn = true;
  rerenderFeature('bathroom');
  showPreviewToast();
}

function setupColorWheelDrag(container) {
  container.addEventListener('pointerdown', e => {
    const wheel = e.target.closest('[data-action="pick-color"]');
    if (!wheel) return;
    e.preventDefault();               // evita que el gesto haga scroll de la página
    _wheelDragging = true;
    _wheelKey = wheel.dataset.key || null;
    wheel.setPointerCapture(e.pointerId);
    applyColorFromWheel(wheel, e.clientX, e.clientY);
  });
  container.addEventListener('pointermove', e => {
    if (!_wheelDragging) return;
    const wheel = e.target.closest('[data-action="pick-color"]');
    if (!wheel) return;
    applyColorFromWheel(wheel, e.clientX, e.clientY);
  });
  const finDrag = () => {
    if (!_wheelDragging) return;
    _wheelDragging = false;
    // Recién ahora re-renderizamos (con la rueda ya soltada, no rompe el gesto).
    if (_wheelKey) updateCard(_wheelKey);
    _wheelKey = null;
  };
  container.addEventListener('pointerup',     finDrag);
  container.addEventListener('pointercancel', finDrag);
}

// ── ESCENAS ───────────────────────────────────────────────────────────────────
function renderScenes() {
  const grid = document.getElementById('scenes-grid');
  grid.innerHTML = getSceneList().map(scene => {
    const titleEsc = escapeHtml(scene.title.replace(/'/g, "\\'"));
    const scheduleAction = `<button class="scene-action-btn" data-scene-action="schedule" data-scene="${scene.id}" title="${t('scheduleBtn')}" aria-label="${t('scheduleBtn')}">${ICON_CLOCK}</button>`;
    const helpAction = `<button class="scene-action-btn" data-scene-action="help" title="${t('helpBtn')}" aria-label="${t('helpBtn')}">${ICON_HELP}</button>`;
    const reportAction = `<button class="scene-action-btn" data-scene-action="report" data-title="${titleEsc}" title="${t('reportProblemBtn')}" aria-label="${t('reportProblemBtn')}">${ICON_ALERT_SM}</button>`;
    const actions = (scene.isCustom
      ? `<button class="scene-action-btn" data-scene-action="edit"   data-scene="${scene.id}" title="${t('sceneEditTitle')}"   aria-label="${t('sceneEditTitle')}">${ICON_EDIT}</button>
         <button class="scene-action-btn" data-scene-action="delete" data-scene="${scene.id}" title="${t('sceneDeleteTitle')}" aria-label="${t('sceneDeleteTitle')}">${ICON_TRASH}</button>`
      : `<button class="scene-action-btn" data-scene-action="edit" data-scene="${scene.id}" title="${t('sceneEditTitle')}" aria-label="${t('sceneEditTitle')}">${ICON_EDIT}</button>
         ${scene.hasOverride ? `<button class="scene-action-btn" data-scene-action="reset" data-scene="${scene.id}" title="${t('sceneResetTitle')}" aria-label="${t('sceneResetTitle')}">${ICON_UNDO}</button>` : ''}`) + scheduleAction + helpAction + reportAction;

    // div, no button: el botón externo no puede contener los botones internos
    // de editar/eliminar (edit/trash/undo) — un <button> dentro de otro <button> es
    // inválido en HTML5 y el navegador cierra el externo antes de tiempo,
    // dejando ícono/título/descripción como hijos sueltos de la grilla.
    return `<div class="scene-card" role="button" tabindex="0" data-scene="${scene.id}" aria-label="${escapeHtml(scene.title)}">
      <span class="scene-card-ico">${scene.icon}</span>
      <span class="scene-card-title">${escapeHtml(scene.title)}</span>
      <span class="scene-card-desc">${escapeHtml(scene.desc)}</span>
      <div class="scene-card-actions">${actions}</div>
    </div>`;
  }).join('');
}

window.openSceneHelpModal = function() {
  document.getElementById('help-modal-title').textContent = t('sceneHelpTitle');
  document.getElementById('help-modal-body').textContent = t('sceneHelpText');
  document.getElementById('help-modal-overlay').classList.remove('hidden');
};

window.reportSceneProblem = function(sceneTitle) {
  const note = (window.prompt(t('reportSceneProblemPrompt', { name: sceneTitle })) || '').trim();
  if (!note) return;
  sendServiceRequest('maintenance', t('reportSceneProblemNote', { name: sceneTitle, note }));
};

function handleSceneGridClick(e) {
  const actionBtn = e.target.closest('[data-scene-action]');
  if (actionBtn) {
    e.stopPropagation();
    const id = actionBtn.dataset.scene;
    const action = actionBtn.dataset.sceneAction;
    if (action === 'edit')   return expandScenesConfig(id);
    if (action === 'delete') return confirmDeleteScene(id);
    if (action === 'reset')  return confirmDeleteScene(id);
    // CSP S5: los que eran onclick inline en la tarjeta de escena.
    if (action === 'schedule') return scheduleScene(id);
    if (action === 'help')     return openSceneHelpModal();
    if (action === 'report')   return reportSceneProblem(actionBtn.dataset.title);
    return;
  }
  const card = e.target.closest('.scene-card');
  if (card) applyScene(card.dataset.scene);
}

// .scene-card ya no es un <button> nativo (ver renderScenes) — se restaura
// la activación por teclado (Enter/Espacio) que el navegador daba gratis.
function handleSceneGridKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.scene-card');
  if (!card) return;
  e.preventDefault();
  applyScene(card.dataset.scene);
}

async function applyScene(sceneId) {
  const steps = getSceneSteps(sceneId);
  if (!steps) return;

  const btn = document.querySelector(`.scene-card[data-scene="${sceneId}"]`);
  if (btn) btn.classList.add('loading');

  // Filtrar solo los dispositivos que existen en esta habitación
  const validSteps = steps.filter(({ dev }) => app.config[dev]);

  // Optimistic: aplicar estados localmente
  validSteps.forEach(({ dev, cmd, optimistic }) => {
    Object.assign(app.devices[dev], cmd, optimistic || {});
  });
  renderGrid();

  try {
    await Promise.all(validSteps.map(({ dev, cmd }) => apiCommand(dev, cmd)));
    showToast(t('toastScene'), 'success');
  } catch {
    showToast(t('toastSceneFail'), 'error');
  } finally {
    if (btn) btn.classList.remove('loading');
  }
}

// Guarda el estado actual de la habitación como pasos de una escena (nueva o existente)
async function apiSaveScene(payload) {
  if (window.location.protocol === 'file:') return { success: true, id: payload.id || `custom_${Date.now()}` };
  const res = await fetch(`${API}/room/${app.token}/scenes${roomParam()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('SAVE_SCENE_FAILED');
  return res.json();
}

async function apiDeleteScene(id) {
  if (window.NEXO_SIM) return window.NEXO_SIM.comando(device, command);
  if (window.location.protocol === 'file:') return { success: true };
  const res = await fetch(`${API}/room/${app.token}/scenes/${id}${roomParam()}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('DELETE_SCENE_FAILED');
  return res.json();
}

// ── CONTROLES EMBEBIDOS EN ESCENAS (ajustar y guardar sin cambiar de pestaña) ──
// null cuando está colapsado; 'create' al crear una escena nueva; el id de la
// escena cuando se está editando una existente.
let scenesConfigMode = null;

function scenesConfigDeviceKeys() {
  const securityKeys = securityDeviceKeys();
  return [
    ...CARD_ORDER.filter(k => app.config[k]),
    ...Object.keys(app.config).filter(k => !CARD_ORDER.includes(k) && !securityKeys.includes(k)),
  ];
}

function renderScenesConfigGrid() {
  document.getElementById('scenes-device-grid').innerHTML = scenesConfigDeviceKeys().map(buildCard).join('');
}

function expandScenesConfig(mode) {
  scenesConfigMode = mode;
  const isEdit = mode !== 'create';
  const scene = isEdit ? getSceneList().find(s => s.id === mode) : null;
  document.getElementById('scenes-config-label').textContent = t('scenesConfigLabel');
  document.getElementById('scenes-config-hint').textContent = isEdit
    ? t('scenesConfigHintEdit', { name: scene?.title || '' })
    : t('scenesConfigHintCreate');
  document.getElementById('scenes-config-save-btn').textContent = isEdit
    ? t('scenesConfigSaveEdit', { name: scene?.title || '' })
    : t('scenesConfigSaveCreate');
  renderScenesConfigGrid();
  const section = document.getElementById('scenes-config-section');
  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function collapseScenesConfig() {
  scenesConfigMode = null;
  document.getElementById('scenes-config-section').classList.add('hidden');
}

// Botón "Guardar" dentro de la sección expandida — crea (abre el modal de
// nombre/ícono de siempre) o sobrescribe una escena existente directamente.
async function saveScenesConfig() {
  if (scenesConfigMode === 'create') {
    openSceneModal();
    return;
  }
  const id = scenesConfigMode;
  const scene = getSceneList().find(s => s.id === id);
  if (!scene) return;
  const steps = captureSceneSteps();
  try {
    await apiSaveScene({ id, name: scene.title, icon: scene.icon, steps });
    if (!app.scenes[id]) app.scenes[id] = {};
    app.scenes[id].steps = steps;
    if (scene.isCustom) {
      app.scenes[id].name = scene.title;
      app.scenes[id].icon = scene.icon;
    }
    renderScenes();
    collapseScenesConfig();
    showToast(t('toastSceneSaved'), 'success');
  } catch {
    showToast(t('toastSceneSaveFail'), 'error');
  }
}

// Elimina una escena personalizada, o restaura una escena por defecto a su configuración original
async function confirmDeleteScene(id) {
  const scene = getSceneList().find(s => s.id === id);
  if (!scene) return;
  const msg = scene.isCustom ? t('sceneDeleteConfirm', { name: scene.title }) : t('sceneResetConfirm', { name: scene.title });
  if (!confirm(msg)) return;

  try {
    await apiDeleteScene(id);
    delete app.scenes[id];
    renderScenes();
    showToast(t('toastSceneDeleted'), 'success');
  } catch {
    showToast(t('toastSceneDeleteFail'), 'error');
  }
}

// ── MODAL: NUEVA ESCENA ───────────────────────────────────────────────────────
let sceneModalIcon = SCENE_ICON_CHOICES[0];

function openSceneModal() {
  const nameInput = document.getElementById('scene-name-input');
  nameInput.value = '';
  sceneModalIcon = SCENE_ICON_CHOICES[0];

  const picker = document.getElementById('scene-icon-picker');
  picker.innerHTML = SCENE_ICON_CHOICES.map((ico, i) =>
    `<button type="button" class="scene-icon-opt ${i === 0 ? 'active' : ''}" data-icon="${ico}">${ico}</button>`
  ).join('');
  picker.querySelectorAll('.scene-icon-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      picker.querySelectorAll('.scene-icon-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sceneModalIcon = btn.dataset.icon;
    });
  });

  document.getElementById('scene-modal-overlay').classList.remove('hidden');
  nameInput.focus();
}

function closeSceneModal() {
  document.getElementById('scene-modal-overlay').classList.add('hidden');
}

async function saveNewScene() {
  const name = document.getElementById('scene-name-input').value.trim();
  if (!name) {
    showToast(t('toastSceneNameRequired'), 'error');
    return;
  }
  const customCount = Object.keys(app.scenes).filter(id => !DEFAULT_SCENE_IDS.includes(id)).length;
  if (customCount >= 6) {
    showToast(t('toastSceneMax'), 'error');
    return;
  }

  const steps = captureSceneSteps();
  try {
    const result = await apiSaveScene({ name, icon: sceneModalIcon, steps });
    app.scenes[result.id] = { name, icon: sceneModalIcon, steps };
    renderScenes();
    closeSceneModal();
    collapseScenesConfig();
    showToast(t('toastSceneSaved'), 'success');
  } catch {
    showToast(t('toastSceneSaveFail'), 'error');
  }
}

// ── RELOJ EN TIEMPO REAL ──────────────────────────────────────────────────────
function startClock(checkoutDate) {
  const clockEl     = document.getElementById('live-clock');
  const countdownEl = document.getElementById('checkout-countdown');
  const coInfoEl    = document.getElementById('checkout-info');

  function tick() {
    const now  = new Date();
    const diff = checkoutDate - now; // ms

    // Hora actual (24 h para evitar confusión con a.m./p.m.)
    clockEl.textContent = now.toLocaleTimeString('es-CL', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });

    if (diff > 0) {
      const d  = Math.floor(diff / 86_400_000);
      const h  = Math.floor((diff % 86_400_000) / 3_600_000);
      const m  = Math.floor((diff % 3_600_000)  / 60_000);
      const s  = Math.floor((diff % 60_000)      / 1_000);

      if (diff > 86_400_000) {
        // Más de 24 h → mostrar días para que se entienda de inmediato
        countdownEl.textContent = t('cdLeft', { t: `${d}d ${h}h ${m}m` });
        countdownEl.className   = 'countdown ok';
        coInfoEl.className      = 'checkout-info';
      } else if (diff > 14_400_000) {
        // 4 h – 24 h
        countdownEl.textContent = t('cdLeft', { t: `${h}h ${m}m` });
        countdownEl.className   = 'countdown ok';
        coInfoEl.className      = 'checkout-info';
      } else if (diff > 1_800_000) {
        // 30 min – 4 h
        countdownEl.textContent = t('cdLeft', { t: `${h > 0 ? h + 'h ' : ''}${m}m` });
        countdownEl.className   = 'countdown soon';
        coInfoEl.className      = 'checkout-info soon';
      } else {
        // Menos de 30 min — urgente con segundos
        countdownEl.textContent = t('cdLeft', { t: `${m}m ${s}s` });
        countdownEl.className   = 'countdown urgent';
        coInfoEl.className      = 'checkout-info soon';
      }
    } else {
      // Pasó el checkout
      const over = Math.abs(diff);
      const oh   = Math.floor(over / 3_600_000);
      const om   = Math.floor((over % 3_600_000) / 60_000);
      const os   = Math.floor((over % 60_000)    / 1_000);

      countdownEl.textContent = oh > 0
        ? t('cdOverdue', { t: `${oh}h ${om}m` })
        : om > 0
          ? t('cdOverdue', { t: `${om}m ${os}s` })
          : t('cdNow');
      countdownEl.className = 'countdown expired';
      coInfoEl.className    = 'checkout-info urgent';
    }
  }

  tick();
  setInterval(tick, 1000);
}

// ── CHECKOUT BUTTON ───────────────────────────────────────────────────────────
document.addEventListener('click', e => {
  if (e.target.closest('.checkout-btn')) {
    alert(t('checkoutMsg'));
  }
});

// ── ERROR SCREENS ─────────────────────────────────────────────────────────────
function showError(type, desde) {
  document.getElementById('loading-screen').style.display = 'none';
  const es = document.getElementById('error-screen');
  es.classList.remove('hidden');

  // La fecha se arma con el idioma que ya eligió la app; si no vino, no se
  // inventa nada y se cae al texto genérico.
  const cuando = desde ? new Date(desde) : null;
  const fecha = cuando && !isNaN(cuando)
    ? cuando.toLocaleDateString(app.lang === 'en' ? 'en-US' : app.lang === 'pt' ? 'pt-BR' : 'es-CL',
        { day: 'numeric', month: 'long' })
    : null;

  if (type === 'vencido') {
    document.getElementById('err-icon').innerHTML    = ICON_CLOCK;
    document.getElementById('err-title').textContent = t('errVencidoTitle');
    document.getElementById('err-sub').textContent   = fecha
      ? t('errVencidoSubFecha').replace('{fecha}', fecha)
      : t('errInvalidSub');
  } else if (type === 'noempezo') {
    document.getElementById('err-icon').innerHTML    = ICON_CLOCK;
    document.getElementById('err-title').textContent = t('errNoEmpezoTitle');
    document.getElementById('err-sub').textContent   = fecha
      ? t('errNoEmpezoSubFecha').replace('{fecha}', fecha)
      : t('errInvalidSub');
  } else if (type === 'pending') {
    document.getElementById('err-icon').innerHTML    = ICON_CLOCK;
    document.getElementById('err-title').textContent = t('errPendingTitle');
    document.getElementById('err-sub').textContent   = t('errPendingSub');
    startPendingPoll();
  } else if (type === 'revoked') {
    document.getElementById('err-icon').innerHTML    = ICON_ALERT;
    document.getElementById('err-title').textContent = t('errRevokedTitle');
    document.getElementById('err-sub').textContent   = t('errRevokedSub');
  } else if (type === 'invalid') {
    document.getElementById('err-icon').innerHTML    = ICON_LOCK;
    document.getElementById('err-title').textContent = t('errInvalidTitle');
    document.getElementById('err-sub').textContent   = t('errInvalidSub');
  } else {
    document.getElementById('err-icon').innerHTML    = ICON_WIFI_OFF;
    document.getElementById('err-title').textContent = t('errServerTitle');
    document.getElementById('err-sub').textContent   = t('errServerSub');
  }
}

// Dispositivo pendiente de aprobación: reintenta en silencio cada 5s; en cuanto
// el titular lo aprueba, la carga responde 200 y la app se abre sola.
let _pendingPoll = null;
function startPendingPoll() {
  if (_pendingPoll || !app.token) return;
  _pendingPoll = setInterval(async () => {
    try {
      const data = await apiGet(app.token);
      clearInterval(_pendingPoll); _pendingPoll = null;
      document.getElementById('error-screen').classList.add('hidden');
      renderApp(data);
    } catch { /* sigue pendiente o inválido → seguir esperando */ }
  }, 5000);
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  // Con accesibilidad auditiva los avisos visuales duran más
  const duration = app.a11y === 'hearing' ? 7000 : 3000;
  renderToast(msg, { type, axis: 'y', duration });
}

// ── CONTROL POR VOZ (push-to-talk) ────────────────────────────────────────────
// Se graba con `MediaRecorder` y el audio va a NUESTRO backend, que lo
// transcribe. Mantené presionado el 🎤, hablá, soltá.
//
// ── POR QUÉ NO SE USA LA API DE VOZ DEL NAVEGADOR ───────────────────────────
// Antes esto usaba `webkitSpeechRecognition`. Se cambió por tres motivos, y los
// tres importan:
//
//   1. **Solo funciona en Chrome CON servicios de Google.** Eso obligaba a que
//      la tablet de la habitación estuviera certificada por Google Play, y
//      descartaba la mayoría de las tablets baratas del mercado — justo las que
//      hacen viable el plan Base.
//
//   2. **Mandaba el audio de una habitación de hotel a Google**, sin que
//      figurara como destinatario en el registro de tratamiento. Ahora va a un
//      procesador nuestro, bajo contrato y declarable (Ley 21.719).
//
//   3. `MediaRecorder` funciona en **cualquier navegador moderno**, así que la
//      elección de tablet deja de estar atada al proveedor del navegador.
//
// El costo pasa a ser nuestro (se transcribe con Whisper), pero está acotado por
// el push-to-talk y el tope de grabación.
//
// Las escenas se resuelven acá mismo —viven en el cliente, incluidas las que se
// creó el huésped—, así que el audio vuelve como TEXTO (`?solo=texto`) antes de
// ejecutarse. Los comandos de aparatos sí van al backend. Pensado también para
// accesibilidad: la respuesta se lee en voz alta.

// Tope de grabación. Es la regla de producto (5 min) y además una guarda de
// costo: un botón trabado no puede transcribir media hora.
const VOZ_MAX_MS = 5 * 60 * 1000;

function initVoice() {
  const soportado = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  if (!soportado || document.getElementById('voice-btn')) return;  // sin soporte → sin botón
  if (!Object.keys(app.config).length) return;                     // nada que controlar

  const btn = document.createElement('button');
  btn.id = 'voice-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', t('vozBtn'));
  btn.title = t('vozBtn');
  btn.innerHTML = ICON_MIC;
  document.body.appendChild(btn);

  let rec = null, stream = null, trozos = [], escuchando = false, corte = null;

  // Suelta el micrófono. **Crítico y no es limpieza opcional**: si el stream
  // queda abierto, la tablet muestra el indicador de grabación de forma
  // permanente. En una habitación de hotel eso se ve como que el aparato está
  // escuchando siempre — exactamente lo que el producto promete que NO hace.
  const soltarMicrofono = () => {
    if (stream) { try { stream.getTracks().forEach(t => t.stop()); } catch {} stream = null; }
  };

  const start = async e => {
    e.preventDefault();
    if (escuchando) return;
    escuchando = true;
    trozos = [];
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Permiso denegado o sin micrófono: se dice y se sigue. El resto de la
      // app funciona igual, así que no se rompe nada.
      escuchando = false;
      showToast(t('vozSinMicrofono'), 'error');
      return;
    }
    try {
      rec = new MediaRecorder(stream);
    } catch {
      escuchando = false; soltarMicrofono();
      showToast(t('vozSinMicrofono'), 'error');
      return;
    }

    rec.ondataavailable = ev => { if (ev.data && ev.data.size) trozos.push(ev.data); };
    rec.onstop = async () => {
      clearTimeout(corte);
      btn.classList.remove('listening');
      escuchando = false;
      const blob = new Blob(trozos, { type: rec.mimeType || 'audio/webm' });
      soltarMicrofono();
      // Grabaciones minúsculas son un toque accidental, no una orden.
      if (blob.size < 2000) return;
      await transcribirYProcesar(blob);
    };

    btn.classList.add('listening');
    showToast(t('vozEscuchando'), '');
    rec.start();
    corte = setTimeout(() => { try { rec.stop(); } catch {} }, VOZ_MAX_MS);
  };

  const stop = () => { if (rec && rec.state === 'recording') try { rec.stop(); } catch {} };

  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointercancel', stop);
  btn.addEventListener('pointerleave', stop);
  btn.addEventListener('contextmenu', e => e.preventDefault()); // long-press móvil
}

/** Manda el audio a transcribir y sigue con el flujo de siempre. */
async function transcribirYProcesar(blob) {
  if (window.location.protocol === 'file:') { showPreviewToast(); return; }
  try {
    // roomParam() ya trae su propio '?', así que el separador depende de si hay
    // habitación en el token multi-pieza.
    const rp = roomParam();
    const res = await fetch(`${API}/room/${app.token}/voice-command${rp}${rp ? '&' : '?'}solo=texto`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'audio/webm' },
      body: blob,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP_${res.status}`);
    // Degradado (Whisper falló, tope o sub-cuota): el server ya dejó la consulta
    // en el chat, así que se lleva ahí al huésped en vez de un "no te entendí"
    // sin salida. Antes esto solo se manejaba en el flujo de texto, no en el de
    // audio, así que un fallo de Whisper mostraba un error crudo.
    if (body.enChat) {
      vozFeedback(body.mensaje || t('vozNoEntendi'), 'error');
      await cargarChat();
      setTimeout(() => switchView('chat'), 900);
      return;
    }
    const texto = (body.texto || '').trim();
    if (!texto) { vozFeedback(t('vozNoEntendi'), 'error'); return; }
    await procesarVoz(texto);
  } catch (err) {
    vozFeedback(err.message, 'error');
  }
}

async function procesarVoz(texto) {
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const tnorm = norm(texto);

  // 1) Escenas — por nombre (incluye las personalizadas del huésped), pidiendo
  //    una palabra clave para no confundir frases casuales con nombres cortos.
  const escena = getSceneList().find(s => {
    const nombre = norm(s.title);
    return tnorm.includes(nombre) && (/(modo|escena|activa|aplica|pon)/.test(tnorm) || tnorm === nombre);
  });
  if (escena) {
    applyScene(escena.id);
    vozFeedback(`${t('vozActivando')} ${escena.title}`);
    return;
  }

  // 2) Aparatos — el backend interpreta y ejecuta (en file:// no hay backend)
  if (window.location.protocol === 'file:') { showPreviewToast(); return; }
  try {
    const res = await fetch(`${API}/room/${app.token}/voice-text${roomParam()}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP_${res.status}`);
    vozFeedback(body.entendido ? body.accion : (body.mensaje || t('vozNoEntendi')), body.entendido ? '' : 'error');
    if (body.entendido) setTimeout(() => { try { refreshRoomState(); } catch {} }, 1200);
    // Si no se entendió, el backend dejó la consulta escrita en el chat: se lleva
    // al huésped ahí para que la continúe escribiendo o volviendo a hablar, en vez
    // de dejarlo con un "no te entendí" y ninguna salida.
    if (!body.entendido && body.enChat) {
      await cargarChat();
      setTimeout(() => switchView('chat'), 900);
    }
  } catch (err) {
    vozFeedback(err.message, 'error');
  }
}

// Toast + respuesta hablada (accesibilidad: huéspedes no videntes)
function vozFeedback(msg, type = '') {
  showToast(msg, type);
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(msg);
    u.lang = { es: 'es-CL', en: 'en-US', pt: 'pt-BR' }[app.lang] || 'es-CL';
    speechSynthesis.speak(u);
  } catch {}
}
