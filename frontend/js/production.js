/* ============================================================
   PANCORE — сторінка «Виробництво»
   ескізи виробів · паспорт звою (повзунок довжини) · графік OTDR ·
   перемикач пропелерів · підсвітка навігації по досьє
   ============================================================ */

import { reducedMotion } from './site.js';
import { mountSketches, propSketch } from './sketches.js';

mountSketches();

/* ---------- паспорт звою: лінійка 5–60 км (розрахункова геометрія за еталоном 25 км) ---------- */
const RANGE = {
  km: [5, 10, 20, 25, 40, 60],
  od: [92, 92, 103.8, 103.8, 115, 132],
  id: 53,
  h: [66, 121, 172, 215.56, 264, 282],
  kg: [0.38, 0.70, 1.40, 1.751, 2.80, 4.20],
  ref: 3,
};
const fmt = (n, d = 1) => n.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: d });
const pass = document.getElementById('passport');
if (pass) {
  const slider = pass.querySelector('input[type="range"]');
  const set = (i) => {
    pass.querySelector('[data-ro="km"]').textContent = RANGE.km[i];
    pass.querySelector('[data-ro="od"]').firstChild.textContent = fmt(RANGE.od[i]);
    pass.querySelector('[data-ro="id"]').firstChild.textContent = RANGE.id;
    pass.querySelector('[data-ro="h"]').firstChild.textContent = fmt(RANGE.h[i], 2);
    pass.querySelector('[data-ro="kg"]').firstChild.textContent = fmt(RANGE.kg[i], 3);
    pass.querySelector('[data-ro="ref"]').hidden = i !== RANGE.ref;
    pass.querySelectorAll('.passport__ticks span').forEach((el, k) => el.classList.toggle('is-on', k === i));
  };
  slider.addEventListener('input', () => set(Number(slider.value)));
  set(Number(slider.value));
}

/* ---------- OTDR: рефлектограма за протоколами тестів ---------- */
const OTDR = {
  1310: { km: 21.339, loss: 7.38, slope: 0.35, refl: null, date: '03.07.2026' },
  1550: { km: 30.212, loss: 6.07, slope: 0.20, refl: -27.94, date: '27.07.2026' },
};
const otdr = document.getElementById('otdr');
if (otdr) {
  const plot = otdr.querySelector('.otdr__plot');
  const tip = otdr.querySelector('.otdr__tip');
  const W = 640, H = 300, L = 46, R = 14, T = 14, B = 34;
  let cur = 1550;

  function draw(wl) {
    cur = wl;
    const d = OTDR[wl];
    const xMax = d.km * 1.08, yMin = -(d.loss + 13), yMax = 3;
    const sx = (km) => L + (km / xMax) * (W - L - R);
    const sy = (db) => T + ((yMax - db) / (yMax - yMin)) * (H - T - B);
    // траса: імпульс запуску, лінійне загасання, відбиття від торця, шумовий поріг
    const pts = [[0, 0.2], [0.12, 1.8], [0.3, 0], [d.km, -d.loss], [d.km + 0.05, -d.loss + 3.2], [d.km + 0.25, -d.loss - 10], [xMax, -d.loss - 11.5]];
    const path = pts.map(([km, db], i) => `${i ? 'L' : 'M'}${sx(km).toFixed(1)},${sy(db).toFixed(1)}`).join(' ');
    const area = `${path} L${sx(xMax).toFixed(1)},${sy(yMin)} L${sx(0)},${sy(yMin)} Z`;
    const xt = [], yt = [];
    const stepX = d.km > 25 ? 5 : 2.5;
    for (let km = 0; km <= xMax; km += stepX) xt.push(km);
    for (let db = 0; db >= yMin + 2; db -= 4) yt.push(db);
    plot.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Рефлектограма OTDR, ${wl} нм">
        <defs><linearGradient id="otdr-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,61,79,0.28)"/><stop offset="1" stop-color="rgba(255,61,79,0)"/></linearGradient></defs>
        <g class="grid">${yt.map((db) => `<line x1="${L}" x2="${W - R}" y1="${sy(db).toFixed(1)}" y2="${sy(db).toFixed(1)}"/>`).join('')}${xt.map((km) => `<line y1="${T}" y2="${H - B}" x1="${sx(km).toFixed(1)}" x2="${sx(km).toFixed(1)}"/>`).join('')}</g>
        <path class="area" d="${area}"/>
        <path class="trace" d="${path}"/>
        <line class="ev" x1="${sx(d.km).toFixed(1)}" x2="${sx(d.km).toFixed(1)}" y1="${T}" y2="${H - B}"/>
        <text class="evl" x="${(sx(d.km) - 6).toFixed(1)}" y="${T + 12}" text-anchor="end">кінець волокна · ${fmt(d.km, 3)} км</text>
        <g class="axis">
          <line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>
          ${xt.map((km) => `<text x="${sx(km).toFixed(1)}" y="${H - B + 16}" text-anchor="middle">${fmt(km)}</text>`).join('')}
          <text x="${W - R}" y="${H - 4}" text-anchor="end">км</text>
          ${yt.map((db) => `<text x="${L - 6}" y="${(sy(db) + 3).toFixed(1)}" text-anchor="end">${db}</text>`).join('')}
          <text x="${L - 6}" y="${T - 2}" text-anchor="end">дБ</text>
        </g>
        <g class="hover" hidden><line class="cross" y1="${T}" y2="${H - B}"/><circle class="dot" r="4"/></g>
      </svg>`;
    const stats = otdr.querySelector('.otdr__stats');
    stats.innerHTML = [
      [fmt(d.km, 3) + '<small> км</small>', 'довжина волокна'],
      [fmt(d.loss, 2) + '<small> дБ</small>', 'загальні втрати'],
      [d.slope.toFixed(2).replace('.', ',') + '<small> дБ/км</small>', 'нахил кривої'],
      [d.refl != null ? fmt(d.refl, 2) + '<small> дБ</small>' : 'рівномірний', d.refl != null ? 'відбиття від торця' : 'без подій по довжині'],
    ].map(([v, k]) => `<div><b>${v}</b><span>${k}</span></div>`).join('');
    otdr.querySelector('.otdr__fn').textContent = `Auto OTDR, ${wl} нм, ${d.date}. Крива рівномірна по всій довжині: без муфт, зламів і локальних втрат.`;
    otdr.querySelectorAll('.seg button').forEach((b) => b.classList.toggle('is-on', Number(b.dataset.wl) === wl));

    // наведення: перехрестя + підказка (значення на лінійній ділянці)
    const svg = plot.querySelector('svg'), hov = svg.querySelector('.hover');
    const move = (e) => {
      const r = svg.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      const km = Math.max(0, Math.min(d.km, ((x - L) / (W - L - R)) * xMax));
      const db = -(km * d.loss / d.km);
      hov.hidden = false;
      hov.querySelector('.cross').setAttribute('x1', sx(km)); hov.querySelector('.cross').setAttribute('x2', sx(km));
      hov.querySelector('.dot').setAttribute('cx', sx(km)); hov.querySelector('.dot').setAttribute('cy', sy(db));
      tip.hidden = false;
      tip.style.left = `${(sx(km) / W) * 100}%`; tip.style.top = `${(sy(db) / H) * 100}%`;
      tip.textContent = `${fmt(km, 2)} км · ${fmt(db, 2)} дБ`;
    };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerleave', () => { hov.hidden = true; tip.hidden = true; });
  }
  otdr.querySelector('.seg').addEventListener('click', (e) => { const b = e.target.closest('[data-wl]'); if (b) draw(Number(b.dataset.wl)); });
  draw(cur);
}

/* ---------- пропелери: 10″ / 15″ ---------- */
const PROPS = {
  10: { pitch: '5.0', a75: '12,0°', tip: '9,0°', d: '254 мм', force: '3 200 kN', item: 902 },
  15: { pitch: '10', a75: '15,8°', tip: '12,0°', d: '381 мм', force: '3 800 kN', item: 903 },
};
const propBox = document.getElementById('prop-box');
if (propBox) {
  const set = (inch) => {
    const p = PROPS[inch];
    propBox.querySelector('[data-sketch="prop"]').innerHTML = propSketch(inch, p.pitch);
    propBox.querySelector('[data-p="d"]').textContent = `${inch}″ · ${p.d}`;
    propBox.querySelector('[data-p="pitch"]').textContent = `${p.pitch}″`;
    propBox.querySelector('[data-p="a75"]').textContent = p.a75;
    propBox.querySelector('[data-p="tip"]').textContent = p.tip;
    propBox.querySelector('[data-p="force"]').textContent = p.force;
    propBox.querySelector('[data-p="link"]').href = `catalog.html#item-${p.item}`;
    propBox.querySelectorAll('.toggle button').forEach((b) => b.classList.toggle('is-on', Number(b.dataset.inch) === inch));
  };
  propBox.querySelector('.toggle').addEventListener('click', (e) => { const b = e.target.closest('[data-inch]'); if (b) set(Number(b.dataset.inch)); });
  set(10);
}

/* ---------- навігація по досьє: підсвітка поточного розділу ---------- */
const dosNav = document.querySelector('.dos-nav');
if (dosNav && 'IntersectionObserver' in window) {
  const links = [...dosNav.querySelectorAll('a[href^="#"]')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-on', a.getAttribute('href') === '#' + en.target.id)); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  links.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); s && io.observe(s); });
}

/* ---------- плавний скрол по якорях ---------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const t = document.querySelector(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  t.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', a.getAttribute('href'));
}));
