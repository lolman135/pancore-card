/* ============================================================
   PANCORE — карта світу з анімованими маршрутами
   Точкова карта (один <path>), дуги між вузлами, «пакети», що
   рухаються по дугах (SMIL animateMotion), пульс вузлів.
   Дешево для GPU: без SVG-фільтрів, анімації лише stroke-dashoffset
   і transform.
   ============================================================ */

import { VIEW, NODES, DOTS } from './data/worldmap.js';

const NS = 'http://www.w3.org/2000/svg';

/* маршрути: [звідки, куди, тип] — in: сировина/компоненти до ЄС,
   out: готова продукція, world: інші замовники */
const ROUTES = [
  ['cn', 'eu', 'in'],
  ['cn2', 'eu', 'in'],
  ['eu', 'ua', 'out'],
  ['eu', 'tr', 'out'],
  ['eu', 'w1', 'world'],
  ['eu', 'w2', 'world'],
  ['eu', 'w3', 'world'],
  ['eu', 'w4', 'world'],
];

/* підписи: зміщення відносно вузла та вирівнювання */
const LABELS = {
  cn: { dx: 14, dy: 4, anchor: 'start' },
  eu: { dx: -16, dy: -14, anchor: 'end' },
  ua: { dx: 14, dy: -8, anchor: 'start' },
  tr: { dx: 14, dy: 16, anchor: 'start' },
  w1: { dx: -14, dy: 4, anchor: 'end' },
};

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
  const svg = el('svg', { viewBox: `0 0 ${VIEW.w} ${VIEW.h}`, class: 'wm', role: 'img', 'aria-label': 'Карта постачання: Китай, ЄС, Україна, Туреччина, світ' });
  svg.style.setProperty('--wm-w', VIEW.w);

  // суходіл
  el('path', { class: 'wm__dots', d: DOTS }, svg);

  // маршрути
  const routes = el('g', { class: 'wm__routes' }, svg);
  ROUTES.forEach(([from, to, kind], i) => {
    const a = NODES[from], b = NODES[to];
    const d = arcPath(a, b);
    const g = el('g', { class: `wm__route wm__route--${kind}`, style: `--i:${i}` }, routes);
    el('path', { class: 'wm__base', d }, g);
    const flow = el('path', { class: 'wm__flow', d }, g);
    if (!reduced) {
      // «пакет», що біжить по дузі
      const pkt = el('circle', { class: 'wm__pkt', r: 3.2 }, g);
      const am = el('animateMotion', { dur: `${(4.5 + (i % 3) * 0.9).toFixed(1)}s`, repeatCount: 'indefinite', begin: `${(i * 0.7).toFixed(1)}s`, path: d, rotate: 'auto' }, pkt);
      am.setAttribute('calcMode', 'linear');
      if (kind === 'in') { /* рух у бік ЄС уже задано порядком точок */ }
    } else {
      flow.classList.add('is-static');
    }
  });

  // вузли
  const nodes = el('g', { class: 'wm__nodes' }, svg);
  Object.entries(NODES).forEach(([key, n], i) => {
    const g = el('g', { class: `wm__node wm__node--${key}`, transform: `translate(${n.x} ${n.y})`, style: `--i:${i}` }, nodes);
    if (n.label) el('circle', { class: 'wm__pulse', r: 11 }, g);
    el('circle', { class: 'wm__dot', r: n.label ? 3.8 : 2.8 }, g);
    if (n.label) {
      const L = LABELS[key] || { dx: 12, dy: 4, anchor: 'start' };
      const t = el('text', { class: 'wm__label', x: L.dx, y: L.dy, 'text-anchor': L.anchor }, g);
      t.textContent = n.label;
    }
  });

  host.innerHTML = '';
  host.appendChild(svg);

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
