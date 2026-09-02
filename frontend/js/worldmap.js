/* ============================================================
   PANCORE — карта світу з анімованими маршрутами
   Точкова карта (один <path>) + підсвітка країн-учасниць, дуги між
   вузлами, «пакети», що рухаються по дугах (SMIL animateMotion),
   пульс вузлів. Підписи — HTML поверх SVG (читаються на телефоні).
   На вузьких екранах viewBox обрізається до коридору ЄС–Китай.
   Фільтр маршрутів: легенда-вкладки, картки маршрутів, тап по дузі.
   Дешево для GPU: без SVG-фільтрів, анімації лише stroke-dashoffset
   і transform.
   ============================================================ */

import { VIEW, NODES, DOTS, DOTS_HI } from './data/worldmap.js';

const NS = 'http://www.w3.org/2000/svg';
const EN = /^en/i.test(document.documentElement.lang || '');

/* маршрути: [звідки, куди, тип] — in: сировина/компоненти до ЄС, out: готова продукція */
const ROUTES = [
  ['cn', 'eu', 'in'],
  ['cn2', 'eu', 'in'],
  ['eu', 'ua', 'out'],
  ['eu', 'tr', 'out'],
];

/* підписи вузлів: текст, бік від точки (l/r) і вертикальний зсув у px */
const LABELS = {
  uk: { cn: 'Китай', eu: 'ЄС · виробництво', ua: 'Україна', tr: 'Туреччина' },
  en: { cn: 'China', eu: 'EU · production', ua: 'Ukraine', tr: 'Türkiye' },
};
const PLACE = { cn: ['r', 0], eu: ['l', 0], ua: ['r', -14], tr: ['r', 12] };
/* на обрізаній карті ЄС стоїть біля лівого краю — підпис іде під точку, Туреччина нижче */
const PLACE_CROP = { cn: ['r', 0], eu: ['b', 0], ua: ['r', -16], tr: ['r', 26] };

/* телефон: коридор ЄС–Китай (lon −5…140, lat 68…−4) замість усього світу */
const CROP = { x: 660, y: 40, w: 580, h: 330 };
const narrow = matchMedia('(max-width: 640px)');

function el(name, attrs = {}, parent) {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (parent) parent.appendChild(n);
  return n;
}

/* дуга: квадратична крива, контрольна точка зміщена по нормалі
   так, щоб дуга вигиналась «угору» (на північ) — як велике коло */
function arcPath(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  let nx = -dy / dist, ny = dx / dist;
  if (ny > 0) { nx = -nx; ny = -ny; }
  const lift = Math.min(dist * 0.28, 130);
  const cx = (a.x + b.x) / 2 + nx * lift, cy = (a.y + b.y) / 2 + ny * lift;
  return `M${a.x} ${a.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x} ${b.y}`;
}

export function mountWorldMap(host, { reduced = false } = {}) {
  const L = LABELS[EN ? 'en' : 'uk'];
  const svg = el('svg', { viewBox: `0 0 ${VIEW.w} ${VIEW.h}`, class: 'wm', 'aria-hidden': 'true' });

  // суходіл + країни-учасниці яскравіше
  el('path', { class: 'wm__dots', d: DOTS }, svg);
  const hi = el('g', { class: 'wm__hi' }, svg);
  Object.entries(DOTS_HI).forEach(([k, d]) => el('path', { class: `wm__hi--${k}`, d }, hi));

  // маршрути
  const routes = el('g', { class: 'wm__routes' }, svg);
  ROUTES.forEach(([from, to, kind], i) => {
    const d = arcPath(NODES[from], NODES[to]);
    const g = el('g', { class: `wm__route wm__route--${kind}`, 'data-kind': kind, style: `--i:${i}` }, routes);
    el('path', { class: 'wm__base', d }, g);
    const flow = el('path', { class: 'wm__flow', d }, g);
    el('path', { class: 'wm__hit', d }, g);   // широка невидима зона для наведення / тапу
    if (!reduced) {
      const pkt = el('circle', { class: 'wm__pkt', r: 3.2 }, g);
      const am = el('animateMotion', { dur: `${(4.5 + (i % 3) * 0.9).toFixed(1)}s`, repeatCount: 'indefinite', begin: `${(i * 0.7).toFixed(1)}s`, path: d, rotate: 'auto' }, pkt);
      am.setAttribute('calcMode', 'linear');
    } else {
      flow.classList.add('is-static');
    }
  });

  // вузли
  const nodes = el('g', { class: 'wm__nodes' }, svg);
  ['cn', 'cn2', 'eu', 'ua', 'tr'].forEach((key, i) => {
    const n = NODES[key];
    const g = el('g', { class: `wm__node wm__node--${key}`, transform: `translate(${n.x} ${n.y})`, style: `--i:${i}` }, nodes);
    if (L[key]) el('circle', { class: 'wm__pulse', r: 11 }, g);
    el('circle', { class: 'wm__dot', r: L[key] ? 3.8 : 2.8 }, g);
  });

  host.innerHTML = '';
  host.appendChild(svg);

  // підписи — HTML поверх карти: фіксований розмір шрифту на будь-якому екрані
  const lab = document.createElement('div');
  lab.className = 'wm__labels';
  Object.keys(L).forEach((key) => {
    const [side, dy] = PLACE[key];
    const s = document.createElement('span');
    s.className = `wm__lbl wm__lbl--${side} wm__lbl--${key}`;
    s.dataset.node = key;
    s.style.setProperty('--dy', `${dy}px`);
    s.textContent = L[key];
    lab.appendChild(s);
  });
  host.appendChild(lab);

  function layout() {
    const crop = narrow.matches;
    const vb = crop ? CROP : { x: 0, y: 0, w: VIEW.w, h: VIEW.h };
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    svg.classList.toggle('wm--crop', crop);
    lab.querySelectorAll('.wm__lbl').forEach((s) => {
      const n = NODES[s.dataset.node];
      const [side, dy] = (crop ? PLACE_CROP : PLACE)[s.dataset.node];
      s.className = `wm__lbl wm__lbl--${side} wm__lbl--${s.dataset.node}`;
      s.style.setProperty('--dy', `${dy}px`);
      s.style.left = `${(((n.x - vb.x) / vb.w) * 100).toFixed(2)}%`;
      s.style.top = `${(((n.y - vb.y) / vb.h) * 100).toFixed(2)}%`;
    });
  }
  layout();
  narrow.addEventListener('change', layout);

  // фільтр маршрутів: легенда-вкладки та картки (data-kind-btn), тап по дузі
  const wrap = host.closest('.wm-wrap') || host;
  const setKind = (kind) => {
    wrap.dataset.kind = kind;
    wrap.querySelectorAll('[data-kind-btn]').forEach((b) => {
      const on = b.dataset.kindBtn === kind;
      b.classList.toggle('is-on', on);
      if (b.getAttribute('role') === 'tab') b.setAttribute('aria-selected', String(on));
    });
  };
  wrap.addEventListener('click', (e) => {
    const b = e.target.closest('[data-kind-btn]');
    if (!b) return;
    const k = b.dataset.kindBtn;
    setKind(k !== 'all' && wrap.dataset.kind === k ? 'all' : k);   // повторний клік знімає фільтр
  });
  routes.querySelectorAll('.wm__route').forEach((g) => {
    g.addEventListener('pointerenter', () => { wrap.dataset.hover = g.dataset.kind; });
    g.addEventListener('pointerleave', () => { delete wrap.dataset.hover; });
    g.addEventListener('click', () => setKind(wrap.dataset.kind === g.dataset.kind ? 'all' : g.dataset.kind));
  });
  setKind('all');

  // анімації запускаємо, коли карта в кадрі (економимо GPU поза екраном)
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => host.classList.toggle('is-visible', e.isIntersecting));
    }, { threshold: 0.05 });
    io.observe(host);
  } else {
    host.classList.add('is-visible');
  }
  return svg;
}
