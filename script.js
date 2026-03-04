/**
 * ClockTab — script.js
 * Real-time digital clock for America/New_York timezone.
 * Uses requestAnimationFrame + Intl.DateTimeFormat for
 * millisecond-accurate, drift-free updates.
 */

'use strict';

/* ============================================================
   State
   ============================================================ */
let wakeLock = null;        // Wake Lock sentinel

/* ============================================================
   DOM references (resolved after DOMContentLoaded)
   ============================================================ */
let elHHMM, elSS, elAMPM, elDate;

/* ============================================================
   Intl formatters — created once, reused every frame
   ============================================================ */
const TZ = 'America/New_York';

const fmt = {
  h12: new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit', minute: '2-digit', hour12: true
  }),
  sec: new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    second: '2-digit'
  }),
  date: new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'long', month: 'long', day: '2-digit'
  }),
  titleClock: new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  })
};

/* ============================================================
   Clock rendering
   ============================================================ */

/**
 * Extracts named parts from an Intl.DateTimeFormat result.
 * @param {Intl.DateTimeFormat} formatter
 * @param {Date} now
 * @returns {Object.<string,string>}
 */
function getParts(formatter, now) {
  const parts = {};
  formatter.formatToParts(now).forEach(({ type, value }) => {
    parts[type] = value;
  });
  return parts;
}

/** Last rendered second — used to skip redraws when nothing changed */
let lastSecond = -1;

/**
 * Updates the DOM with the current time.
 * Called on every animation frame but only mutates DOM when the second ticks.
 */
function renderClock() {
  const now = new Date();

  // Get current second in NY timezone
  const secParts = getParts(fmt.sec, now);
  const currentSecond = parseInt(secParts.second, 10);

  // Only update DOM when the second changes (or on first render)
  if (currentSecond !== lastSecond) {
    lastSecond = currentSecond;

    const ss = secParts.second; // already zero-padded by Intl

    const parts = getParts(fmt.h12, now);
    // h12 gives hour as "01"–"12"; strip leading zero for aesthetics
    const hh = parts.hour.replace(/^0/, '');
    const mm = parts.minute;
    elHHMM.textContent = `${hh}:${mm}`;
    // dayPeriod is the reliable AM/PM field from Intl; fall back to hour-based check
    elAMPM.textContent = parts.dayPeriod || (parseInt(parts.hour, 10) < 12 ? 'AM' : 'PM');

    elSS.textContent = ss;

    // Date: "WEDNESDAY — MARCH 04"
    const dateParts = getParts(fmt.date, now);
    elDate.textContent =
      `${dateParts.weekday.toUpperCase()} \u2014 ${dateParts.month.toUpperCase()} ${dateParts.day}`;

    // Live title
    document.title = fmt.titleClock.format(now);
  }
}

/* ============================================================
   Animation loop — synchronized to display refresh
   ============================================================ */
function tick() {
  renderClock();
  requestAnimationFrame(tick);
}

/* ============================================================
   Wake Lock — prevents screen sleep on supported browsers
   ============================================================ */
async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    // Re-acquire after tab becomes visible again
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && wakeLock === null) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch (_) { /* ignore */ }
      }
    });
  } catch (_) { /* graceful degradation */ }
}

/* ============================================================
   Initialisation
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Resolve DOM refs
  elHHMM = document.getElementById('clock-hhmm');
  elSS   = document.getElementById('clock-ss');
  elAMPM = document.getElementById('clock-ampm');
  elDate = document.getElementById('clock-date');

  // Start clock loop
  requestAnimationFrame(tick);

  // Wake Lock (non-blocking)
  requestWakeLock();
});

