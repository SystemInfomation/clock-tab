'use strict';

let elHHMM, elSS, elAMPM, elDate;

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

function getParts(formatter, now) {
  const parts = {};
  formatter.formatToParts(now).forEach(({ type, value }) => {
    parts[type] = value;
  });
  return parts;
}

let lastSecond = -1;

function renderClock() {
  const now = new Date();

  const secParts = getParts(fmt.sec, now);
  const currentSecond = parseInt(secParts.second, 10);

  if (currentSecond !== lastSecond) {
    lastSecond = currentSecond;

    const ss = secParts.second;

    const parts = getParts(fmt.h12, now);
    const hh = parts.hour.replace(/^0/, '');
    const mm = parts.minute;
    elHHMM.textContent = `${hh}:${mm}`;
    elAMPM.textContent = parts.dayPeriod || (parseInt(parts.hour, 10) < 12 ? 'AM' : 'PM');

    elSS.textContent = ss;

    const dateParts = getParts(fmt.date, now);
    elDate.textContent =
      `${dateParts.weekday.toUpperCase()} \u2014 ${dateParts.month.toUpperCase()} ${dateParts.day}`;

    document.title = fmt.titleClock.format(now);
  }
}

function tick() {
  renderClock();
  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', () => {
  elHHMM = document.getElementById('clock-hhmm');
  elSS   = document.getElementById('clock-ss');
  elAMPM = document.getElementById('clock-ampm');
  elDate = document.getElementById('clock-date');

  requestAnimationFrame(tick);
});

