/* ============================================================
   PANCORE — сторінка «Виробництво» (UA та EN: тексти за <html lang>)
   ескізи виробів · паспорт котушки (повзунок довжини) · графік OTDR ·
   пропелери 10″/15″ (креслення, масштаб, матеріал, завантаження SVG/PNG) ·
   точки-навігація по блоках
   ============================================================ */

import { reducedMotion, swapIn, scrollToEl } from './site.js';
import { mountSketches, propSketch, propScaleSketch, terrainSketch, hookupSketch } from './sketches.js';

const EN = /^en/i.test(document.documentElement.lang || '');
const LOC = EN ? 'en-GB' : 'uk-UA';
const t = (uk, en) => (EN ? en : uk);

mountSketches();

/* ---------- 3D-сцени: модуль вантажиться, коли блок наближається до кадру;
   без WebGL або при помилці — статичний SVG-ескіз.
   ⚠ версія в import має збігатися з версією в link3d.js (спільний route3d.js) ---------- */
const WEBGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
function boot3d(id, load, sketch) {
  const host = document.getElementById(id);
  if (!host) return;
  const fallback = () => { host.classList.add('is-fallback'); host.innerHTML = sketch(); };
  if (!WEBGL) { fallback(); return; }
  let done = false;
  const boot = () => {
    if (done) return; done = true;
    load().then((create) => create(host, { static: reducedMotion })).catch((e) => { console.warn(id + ':', e); fallback(); });
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ents) => { if (ents.some((e) => e.isIntersecting) || !innerHeight) { io.disconnect(); boot(); } }, { rootMargin: '600px 0px' });
    io.observe(host);
    /* фонова вкладка / прихована панель: спостерігач може не спрацювати — стартуємо, якщо блок близько */
    setTimeout(() => { const r = host.getBoundingClientRect(); if (!innerHeight || r.top < innerHeight + 1200) { io.disconnect(); boot(); } }, 1500);
  } else boot();
}
boot3d('route3d', () => import('./route3d.js?v=20260904e').then((m) => m.createRouteScene), terrainSketch);
/* 2D-схема роботи каналу: звичайний SVG, тому без перевірки WebGL — вантажимо одразу,
   коли блок наближається до кадру; prefers-reduced-motion → статичний кадр */
(() => {
  const host = document.getElementById('link2d');
  if (!host) return;
  let done = false;
  const boot = () => {
    if (done) return; done = true;
    import('./link2d.js?v=20260905a').then((m) => m.createLinkScene(host, { static: reducedMotion }))
      .catch((e) => { console.warn('link2d:', e); host.innerHTML = hookupSketch(); });
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ents) => { if (ents.some((e) => e.isIntersecting) || !innerHeight) { io.disconnect(); boot(); } }, { rootMargin: '600px 0px' });
    io.observe(host);
    setTimeout(() => { const r = host.getBoundingClientRect(); if (!innerHeight || r.top < innerHeight + 1200) { io.disconnect(); boot(); } }, 1500);
  } else boot();
})();

/* ---------- паспорт котушки: лінійка 5–60 км за КП SFC від 03.09.2026 ----------
   Маса kg — котушка без корпусу та модулів, kgc — у корпусі без модулів (40/60 км: корпус під замовлення).
   Еталон SFC-30: 30,212 км за OTDR, 2 245 г. */
const RANGE = {
  km:  [5, 10, 20, 30, 40, 60],
  od:  [110, 110, 100.2, 121, 128, 150],
  id:  [53, 53, 53, 53, 64, 64],
  h:   [51, 102, 213.8, 213.8, 241, 241],
  kg:  [0.38, 0.70, 1.459, 2.245, 2.96, 4.20],
  kgc: [0.605, 1.094, 1.853, 2.795, null, null],
  std: [false, false, true, true, false, false],
  ref: 3,
};
const fmt = (n, d = 1) => n.toLocaleString(LOC, { minimumFractionDigits: 0, maximumFractionDigits: d });
const pass = document.getElementById('passport');
if (pass) {
  const slider = pass.querySelector('input[type="range"]');
  const fill = pass.querySelector('.rail__fill'), thumb = pass.querySelector('.rail__thumb');
  const stops = [...pass.querySelectorAll('.rail__stops span')];
  const svg = pass.querySelector('.pcoil');
  const ro = (k) => pass.querySelector(`[data-ro="${k}"]`);
  const K = 0.8, CX = 85, BASE = 206;   // силует: мм → px, вісь і лінія основи
  const set = (i) => {
    const od = RANGE.od[i], id = RANGE.id[i], h = RANGE.h[i], last = RANGE.km.length - 1;
    ro('km').textContent = RANGE.km[i];
    ro('od').firstChild.textContent = fmt(od);
    ro('id').firstChild.textContent = id;
    ro('h').firstChild.textContent = fmt(h);
    const kgf = (v) => v.toLocaleString(LOC, { minimumFractionDigits: 2, maximumFractionDigits: 3 });   // 0,70 · 1,459 · 4,20 — як у КП
    ro('kg').firstChild.textContent = kgf(RANGE.kg[i]);
    ro('kgc').firstChild.textContent = RANGE.kgc[i] != null ? kgf(RANGE.kgc[i]) : '—';
    ro('kgc').closest('.ro').classList.toggle('is-na', RANGE.kgc[i] == null);
    // плашки не зникають із потоку (інакше рядок стрибав би), а гаснуть
    ro('std').classList.toggle('is-off', !RANGE.std[i]);
    ro('ref').classList.toggle('is-off', i !== RANGE.ref);
    if (!reducedMotion) pass.querySelectorAll('.ro b, .passport__km').forEach((b) => { b.classList.remove('is-tick'); void b.offsetWidth; b.classList.add('is-tick'); });
    slider.value = i;
    slider.setAttribute('aria-valuetext', `${RANGE.km[i]} ${t('км', 'km')}`);
    const p = `${(i / last) * 100}%`;
    fill.style.width = p; thumb.style.left = p;
    stops.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-past', k < i); });
    // силует котушки в масштабі: ширина = зовнішній Ø, висота = H, сердечник = внутрішній Ø
    const w = od * K, hh = h * K, iw = id * K, top = BASE - hh;
    const body = svg.querySelector('[data-el="body"]'), core = svg.querySelector('[data-el="core"]');
    [['x', CX - w / 2], ['y', top], ['width', w], ['height', hh]].forEach(([a, v]) => body.setAttribute(a, v.toFixed(1)));
    [['x', CX - iw / 2], ['y', top], ['width', iw], ['height', hh]].forEach(([a, v]) => core.setAttribute(a, v.toFixed(1)));
    const tOd = svg.querySelector('[data-el="od"]'), tH = svg.querySelector('[data-el="h"]');
    tOd.textContent = `Ø${fmt(od)}`; tOd.setAttribute('y', (top - 9).toFixed(1));
    tH.textContent = `H ${fmt(h)}`; tH.setAttribute('x', (CX + w / 2 + 6).toFixed(1)); tH.setAttribute('y', (top + hh / 2 + 3).toFixed(1));
    svg.querySelector('[data-el="id"]').textContent = `Ø${id}`;
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
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('Рефлектограма OTDR', 'OTDR trace')}, ${wl} ${t('нм', 'nm')}" style="touch-action:pan-y">
        <defs><linearGradient id="otdr-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,61,79,0.28)"/><stop offset="1" stop-color="rgba(255,61,79,0)"/></linearGradient></defs>
        <g class="grid">${yt.map((db) => `<line x1="${L}" x2="${W - R}" y1="${sy(db).toFixed(1)}" y2="${sy(db).toFixed(1)}"/>`).join('')}${xt.map((km) => `<line y1="${T}" y2="${H - B}" x1="${sx(km).toFixed(1)}" x2="${sx(km).toFixed(1)}"/>`).join('')}</g>
        <path class="area" d="${area}"/>
        <path class="trace" d="${path}"/>
        <line class="ev" x1="${sx(d.km).toFixed(1)}" x2="${sx(d.km).toFixed(1)}" y1="${T}" y2="${H - B}"/>
        <text class="evl" x="${(sx(d.km) - 6).toFixed(1)}" y="${T + 12}" text-anchor="end">${t('кінець волокна', 'end of fibre')} · ${fmt(d.km, 3)} ${t('км', 'km')}</text>
        <g class="axis">
          <line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>
          ${xt.map((km) => `<text x="${sx(km).toFixed(1)}" y="${H - B + 16}" text-anchor="middle">${fmt(km)}</text>`).join('')}
          <text x="${W - R}" y="${H - 4}" text-anchor="end">${t('км', 'km')}</text>
          ${yt.map((db) => `<text x="${L - 6}" y="${(sy(db) + 3).toFixed(1)}" text-anchor="end">${db}</text>`).join('')}
          <text x="${L - 6}" y="${T - 2}" text-anchor="end">${t('дБ', 'dB')}</text>
        </g>
        <g class="hover" visibility="hidden"><line class="cross" y1="${T}" y2="${H - B}"/><circle class="dot" r="4"/></g>
      </svg>`;
    plot.appendChild(tip);   // innerHTML вище зніс підказку з DOM — повертаємо той самий вузол
    const stats = otdr.querySelector('.otdr__stats');
    stats.innerHTML = [
      [fmt(d.km, 3) + `<small> ${t('км', 'km')}</small>`, t('довжина волокна', 'fibre length')],
      [fmt(d.loss, 2) + `<small> ${t('дБ', 'dB')}</small>`, t('загальні втрати', 'total loss')],
      [fmt(d.slope, 2) + `<small> ${t('дБ/км', 'dB/km')}</small>`, t('нахил кривої', 'slope')],
      [d.refl != null ? fmt(d.refl, 2) + `<small> ${t('дБ', 'dB')}</small>` : t('рівномірний', 'uniform'), d.refl != null ? t('відбиття від торця', 'end reflection') : t('без подій по довжині', 'no events along the length')],
    ].map(([v, k]) => `<div><b>${v}</b><span>${k}</span></div>`).join('');
    otdr.querySelector('.otdr__fn').textContent = t(
      `Auto OTDR, ${wl} нм, ${d.date}. Крива рівномірна по всій довжині: без муфт, зламів і локальних втрат.`,
      `Auto OTDR, ${wl} nm, ${d.date}. The trace is uniform over the whole length: no splices, breaks or local losses.`,
    );
    otdr.querySelectorAll('.seg button').forEach((b) => b.classList.toggle('is-on', Number(b.dataset.wl) === wl));
    swapIn(plot); swapIn(stats);

    // живі показання: значення беруться з самої кривої (кусково-лінійна інтерполяція між точками траси)
    const live = otdr.querySelector('.otdr__live');
    const perKm = d.loss / d.km;
    const idleText = t('наведіть курсор на криву — покажемо загасання у точці', 'hover over the trace to read the attenuation at a point');
    const setLive = (km, db) => {
      if (km == null) { live.innerHTML = `<span class="otdr__hint">${idleText}</span>`; return; }
      const zone = km < 0.3 ? t('імпульс запуску', 'launch pulse') : km > d.km ? t('за торцем · відбиття та шум', 'beyond the end · reflection and noise') : t('лінійна ділянка', 'linear section');
      live.innerHTML = [
        [fmt(km, 2), t('км', 'km'), t('відстань', 'distance')],
        [fmt(db, 2), t('дБ', 'dB'), t('загасання у точці', 'attenuation at point')],
        [fmt(perKm, 3), t('дБ/км', 'dB/km'), t('питоме загасання', 'attenuation per km')],
      ].map(([v, u, k]) => `<div><b>${v}<small> ${u}</small></b><span>${k}</span></div>`).join('') + `<div class="otdr__zone"><b>${zone}</b><span>${t('ділянка траси', 'trace section')}</span></div>`;
    };
    const traceDb = (km) => {
      for (let i = 1; i < pts.length; i++) {
        const [k0, v0] = pts[i - 1], [k1, v1] = pts[i];
        if (km <= k1) return k1 === k0 ? v1 : v0 + ((km - k0) / (k1 - k0)) * (v1 - v0);
      }
      return pts[pts.length - 1][1];
    };
    setLive(null);

    // наведення: перехрестя + підказка біля курсора + рядок показань
    const svg = plot.querySelector('svg'), hov = svg.querySelector('.hover');
    const cross = hov.querySelector('.cross'), dot = hov.querySelector('.dot');
    const move = (e) => {
      const r = svg.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      const km = Math.max(0, Math.min(xMax, ((x - L) / (W - L - R)) * xMax));
      const db = traceDb(km);
      const px = sx(km), py = sy(db);
      hov.setAttribute('visibility', 'visible');
      cross.setAttribute('x1', px.toFixed(1)); cross.setAttribute('x2', px.toFixed(1));
      dot.setAttribute('cx', px.toFixed(1)); dot.setAttribute('cy', py.toFixed(1));
      tip.hidden = false;
      // підказка не виходить за край графіка і не накриває курсор біля верхнього краю
      tip.style.left = `${Math.max(11, Math.min(89, (px / W) * 100))}%`;
      tip.style.top = `${(py / H) * 100}%`;
      tip.classList.toggle('is-below', py < T + 40);
      tip.textContent = `${fmt(km, 2)} ${t('км', 'km')} · ${fmt(db, 2)} ${t('дБ', 'dB')}`;
      setLive(km, db);
    };
    const leave = () => { hov.setAttribute('visibility', 'hidden'); tip.hidden = true; setLive(null); };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerdown', move);
    svg.addEventListener('pointerleave', leave);
    svg.addEventListener('pointercancel', leave);
  }
  otdr.querySelector('.seg').addEventListener('click', (e) => { const b = e.target.closest('[data-wl]'); if (b) draw(Number(b.dataset.wl)); });
  draw(cur);
}

/* ---------- пропелери 10″ / 15″: розміри з обміру зразків 02.09.2026, два матеріали ---------- */
const PROPS = {
  10: {
    name: t('10 × 5,0 × 3', '10 × 5.0 × 3'), d: t('10″ · 254 мм', '10″ · 254 mm'), pitch: t('5,0″ · 127 мм', '5.0″ · 127 mm'),
    ang: t('12,0° на 0,75R · 9,0° на кінці лопаті', '12.0° at 0.75R · 9.0° at the tip'),
    hub: t('Ø20 · посадка Ø6 · 3 × Ø2 на Ø15', 'Ø20 · bore Ø6 · 3 × Ø2 on Ø15'),
    chord: t('макс. 25 мм на r ≈ 43 мм · 16,5 мм на 0,75R', 'max. 25 mm at r ≈ 43 mm · 16.5 mm at 0.75R'),
    chords: EN ? ['24', '23', '16.5', '8'] : ['24', '23', '16,5', '8'], force: '3 200 kN · Haitian MA3200', item: 902,
  },
  15: {
    name: '15 × 10 × 3', d: t('15″ · 381 мм', '15″ · 381 mm'), pitch: t('10″ · 254 мм', '10″ · 254 mm'),
    ang: t('15,8° на 0,75R · 12,0° на кінці лопаті', '15.8° at 0.75R · 12.0° at the tip'),
    hub: t('Ø25 · посадка Ø6 · 3 × Ø2 на Ø15', 'Ø25 · bore Ø6 · 3 × Ø2 on Ø15'),
    chord: t('макс. 25,5 мм на r ≈ 76 мм · 16,5 мм на 0,75R', 'max. 25.5 mm at r ≈ 76 mm · 16.5 mm at 0.75R'),
    chords: EN ? ['22.5', '24.5', '16.5', '8.5'] : ['22,5', '24,5', '16,5', '8,5'], force: '3 800 kN · Haitian MA3800', item: 903,
  },
};
const MATS = {
  ppa: [
    [t('Склад', 'Composition'), t('PPA + 30 % скловолокно + 10 % вуглецеве волокно', 'PPA + 30 % glass fibre + 10 % carbon fibre')],
    [t('Жорсткість', 'Stiffness'), t('максимальна — вуглецеве волокно тримає геометрію лопаті на високих обертах', 'maximum — carbon fibre keeps the blade geometry at high rpm')],
    [t('Вологопоглинання', 'Moisture uptake'), t('мінімальне — крок і баланс стабільні у дощ та спеку', 'minimal — pitch and balance stay stable in rain and heat')],
    [t('Теплостійкість', 'Heat resistance'), t('найвища серед поліамідних компаундів', 'highest among polyamide compounds')],
    [t('Призначення', 'Intended for'), t('важкі платформи, довгі місії, гарячий клімат', 'heavy platforms, long missions, hot climates')],
  ],
  pa6: [
    [t('Склад', 'Composition'), t('PA6 + 40 % скловолокно (PA6-GF40)', 'PA6 + 40 % glass fibre (PA6-GF40)')],
    [t('Жорсткість', 'Stiffness'), t('висока — перевірений серійний компаунд', 'high — a proven series compound')],
    [t('Вологопоглинання', 'Moisture uptake'), t('помірне', 'moderate')],
    [t('Теплостійкість', 'Heat resistance'), t('стандартна для поліаміду 6', 'standard for polyamide 6')],
    [t('Призначення', 'Intended for'), t('серійні платформи, оптимальна ціна', 'series platforms, best price')],
  ],
};
const propBox = document.getElementById('prop-box');
if (propBox) {
  const q = (s) => propBox.querySelector(s);
  let curInch = 10, view = 10;
  const set = (key) => {
    view = key;
    if (key === 'scale') {
      q('[data-sketch="prop"]').innerHTML = propScaleSketch();
    } else {
      curInch = Number(key);
      const p = PROPS[curInch];
      q('[data-sketch="prop"]').innerHTML = propSketch(curInch);
      q('[data-p="title"]').textContent = `${t('Пропелер PANCORE GROUP', 'PANCORE GROUP propeller')} ${p.name}`;
      ['d', 'pitch', 'ang', 'hub', 'chord', 'force'].forEach((k) => { q(`[data-p="${k}"]`).textContent = p[k]; });
      propBox.querySelectorAll('[data-c]').forEach((td, i) => { td.textContent = p.chords[i]; });
      const link = q('[data-p="link"]');   // посилання на специфікацію може бути прибране з розмітки
      if (link) link.href = `catalog.html#item-${p.item}`;
    }
    propBox.querySelectorAll('.toggle button').forEach((b) => b.classList.toggle('is-on', b.dataset.inch === String(key)));
    swapIn(q('[data-sketch="prop"]')); swapIn(q('.propdeck__spec'));
  };
  const setMat = (key) => {
    q('[data-p="mat"]').innerHTML = MATS[key].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    swapIn(q('[data-p="mat"]'));
    propBox.querySelectorAll('.mat__opt').forEach((b) => { const on = b.dataset.mat === key; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
  };
  q('.toggle').addEventListener('click', (e) => { const b = e.target.closest('[data-inch]'); if (b) set(b.dataset.inch); });
  q('.mat').addEventListener('click', (e) => { const b = e.target.closest('[data-mat]'); if (b) setMat(b.dataset.mat); });
  set(10); setMat('ppa');

  /* завантаження креслення: SVG (векторний файл) або PNG (растр 2×).
     Стилі ескізу вбудовуються, бо у файлі немає pages.css. */
  const DL_STYLE = 'text{font-family:"JetBrains Mono",Consolas,monospace;fill:#b6bcc8;font-size:9px;letter-spacing:.06em}.t{fill:#7f8697;font-size:7.5px;letter-spacing:.18em}.big{fill:#eef0f4;font-size:12px;font-weight:500}.ln{fill:none;stroke:#aab3bb;stroke-width:1.2}.ln2{fill:none;stroke:#eef0f4;stroke-width:1.5}.hair{fill:none;stroke:rgba(255,255,255,.28);stroke-width:.85}.dim{fill:none;stroke:rgba(255,61,79,.55);stroke-width:.75;stroke-dasharray:3 3}.dimL{fill:none;stroke:rgba(255,61,79,.75);stroke-width:.8}.fillDim{fill:rgba(211,217,222,.07)}';
  function drawingSvg() {
    const parts = [...q('[data-sketch="prop"]').querySelectorAll('svg')].map((s) => {
      const [, , w, h] = s.getAttribute('viewBox').split(' ').map(Number);
      return { w, h, vb: s.getAttribute('viewBox'), html: s.innerHTML };
    });
    const W = parts.reduce((a, p) => a + p.w, 0) + 20 * (parts.length + 1), H = 330 + 46;
    let x = 20;
    const inner = parts.map((p) => { const s = `<svg x="${x}" y="16" width="${p.w}" height="${p.h}" viewBox="${p.vb}">${p.html}</svg>`; x += p.w + 20; return s; }).join('');
    const cap = view === 'scale' ? t('пропелери 10″ і 15″ в одному масштабі', 'propellers 10″ and 15″ to the same scale') : `${t('пропелер', 'propeller')} ${PROPS[curInch].name}`;
    const title = `<text class="t" x="20" y="${H - 12}">PANCORE GROUP · ${cap} · ${t('розміри у мм · обмір серійних зразків 02.09.2026', 'dimensions in mm · measured on production samples 02.09.2026')}</text>`;
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W * 2}" height="${H * 2}" viewBox="0 0 ${W} ${H}"><style>${DL_STYLE}</style><rect width="100%" height="100%" fill="#0c0e13"/>${inner}${title}</svg>`;
  }
  const save = (name, blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  };
  propBox.querySelectorAll('[data-dl]').forEach((b) => b.addEventListener('click', () => {
    const svg = drawingSvg();
    const base = `pancore-propeller-${view === 'scale' ? '10-15-scale' : curInch}`;
    if (b.dataset.dl === 'svg') { save(`${base}.svg`, new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })); return; }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      c.toBlob((bl) => bl && save(`${base}.png`, bl), 'image/png');
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }));
}

/* ---------- точки-навігація праворуч: який блок зараз перед очима ---------- */
const dots = document.getElementById('dots');
const blocks = [...document.querySelectorAll('section[data-dot]')];
if (dots && blocks.length) {
  dots.innerHTML = blocks.map((s, i) => `<a href="#${s.id}" aria-label="${s.dataset.dot}"><span>${String(i + 1).padStart(2, '0')} · ${s.dataset.dot}</span><i></i></a>`).join('');
  const links = [...dots.children];
  let cur = -1, flashT = 0, ticking = false;
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  const update = () => {
    ticking = false;
    const line = scrollY + innerHeight * 0.42;
    let i = -1;
    blocks.forEach((s, k) => { if (top(s) <= line) i = k; });
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) i = blocks.length - 1;
    if (i === cur) return;
    cur = i;
    links.forEach((a, k) => { a.classList.toggle('is-on', k === i); a.classList.remove('is-flash'); });
    if (i >= 0) { links[i].classList.add('is-flash'); clearTimeout(flashT); flashT = setTimeout(() => links[i].classList.remove('is-flash'), 1600); }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}

/* ---------- плавний скрол по якорях ---------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const tg = document.querySelector(a.getAttribute('href'));
  if (!tg) return;
  e.preventDefault();
  scrollToEl(tg, 8);
  history.replaceState(null, '', a.getAttribute('href'));
}));
