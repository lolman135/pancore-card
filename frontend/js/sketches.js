/* ============================================================
   PANCORE — векторні ескізи виробів, креслярський стиль
   (як у Megaptera: тонкі лінії, штрихові розмірні, моно-підписи).
   Пропорції — з паспортів: звій 25 км Ø103,8 × H215,56, сердечник Ø53;
   sky station 42 × 42 × 15; ground station 95 × 62 × 48.
   Стилі: .sketch .ln / .ln2 / .hair / .dim / .fillDim / text — у style.css.
   ============================================================ */

const ARROW = `<marker id="sk-ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,1 L7,4 L0,7 Z" fill="rgba(255,255,255,0.35)"/></marker>`;
const wrap = (label, body, vb = '0 0 230 205') =>
  `<svg class="sketch" viewBox="${vb}" role="img" aria-label="${label}"><defs>${ARROW}</defs>${body}</svg>`;

/** Безшпульний звій — переріз А–А з шарами намотки та розмірами еталона 25 км. */
export function coilSketch() {
  // масштаб ~1,2 px/мм: Ø103,8 → 125, Ø53 → 64, H 215,56 → 150
  const x0 = 52, x1 = 177, ix0 = 83, ix1 = 146, y0 = 28, y1 = 178;
  let hatch = '';
  for (let x = x0 + 5; x < ix0; x += 5) hatch += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`;
  for (let x = ix1 + 5; x < x1; x += 5) hatch += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`;
  return wrap('Переріз безшпульного звою', `
  <line class="dim" x1="114" y1="10" x2="114" y2="196"/>
  <rect class="ln2 fillDim" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/>
  <rect class="ln" x="${ix0}" y="${y0}" width="${ix1 - ix0}" height="${y1 - y0}"/>
  <g class="hair">${hatch}</g>
  <path class="ln" d="M${ix0},${y0 - 6} L${ix0 - 14},${y0 - 20} M${ix1},${y0 - 6} L${ix1 + 14},${y0 - 20}"/>
  <line class="dim" x1="${x0}" y1="18" x2="${x1}" y2="18" marker-end="url(#sk-ar)"/>
  <text x="114" y="14" text-anchor="middle">Ø103.8</text>
  <line class="dim" x1="${ix0}" y1="${y1 + 10}" x2="${ix1}" y2="${y1 + 10}" marker-end="url(#sk-ar)"/>
  <text x="114" y="${y1 + 22}" text-anchor="middle">Ø53</text>
  <line class="dim" x1="${x1 + 12}" y1="${y0}" x2="${x1 + 12}" y2="${y1}" marker-end="url(#sk-ar)"/>
  <text x="${x1 + 24}" y="106" transform="rotate(-90 ${x1 + 24} 106)" text-anchor="middle">H 215.56</text>
  <line class="dim" x1="${x0 - 10}" y1="${y0}" x2="${x0 - 10}" y2="${ix0 - x0 + y0}"/>
  <text x="${x0 - 14}" y="${y0 + 20}" transform="rotate(-90 ${x0 - 14} ${y0 + 20})" text-anchor="middle">25.4</text>
  <text x="8" y="${y1 + 22}">SR-FOC-25 · 1751 г</text>
  <text x="${x1 + 4}" y="${y1 + 22}">сердечник</text>`);
}

/** Польовий корпус — фронтальний силует із кришкою twist-lock і кріпленням. */
export function casingSketch() {
  return wrap('Польовий корпус звою', `
  <line class="dim" x1="120" y1="8" x2="120" y2="198"/>
  <rect class="ln2 fillDim" x="106" y="14" width="28" height="18" rx="2"/>
  <path class="hair" d="M112,23 h16 M116,18 l4,5 -4,5"/>
  <path class="ln2 fillDim" d="M80,60 L106,32 L134,32 L160,60 Z"/>
  <rect class="ln2 fillDim" x="80" y="60" width="80" height="112"/>
  <g class="hair">
    <line x1="80" y1="80" x2="160" y2="80"/><line x1="80" y1="100" x2="160" y2="100"/>
    <line x1="80" y1="120" x2="160" y2="120"/><line x1="80" y1="140" x2="160" y2="140"/><line x1="80" y1="160" x2="160" y2="160"/>
  </g>
  <rect class="ln2 fillDim" x="76" y="172" width="88" height="10" rx="2"/>
  <circle class="ln" cx="120" cy="177" r="2.6"/>
  <path class="ln fillDim" d="M56,118 L80,112 L80,168 L56,162 Z"/>
  <path class="hair" d="M62,124 v34 M70,122 v40"/>
  <line class="dim" x1="134" y1="23" x2="176" y2="23"/><text x="180" y="26">twist-lock</text>
  <line class="dim" x1="160" y1="66" x2="176" y2="66"/><text x="180" y="69">конус виводу</text>
  <line class="dim" x1="56" y1="140" x2="36" y2="140"/><text x="6" y="150" transform="rotate(-90 6 150)" text-anchor="middle">ластівчин хвіст</text>
  <line class="dim" x1="160" y1="177" x2="176" y2="177"/><text x="180" y="180">сервісний порт</text>
  <text x="80" y="196">PETG · 3D-друк · опція IP67</text>`);
}

/** Sky station S-T — плата 42 × 42 мм із FC-роз'ємом та клемою даних. */
export function skySketch() {
  return wrap('Бортова станція S-T', `
  <rect class="ln2 fillDim" x="58" y="48" width="112" height="112" rx="3"/>
  <circle class="hair" cx="66" cy="56" r="2.2"/><circle class="hair" cx="162" cy="56" r="2.2"/>
  <circle class="hair" cx="66" cy="152" r="2.2"/><circle class="hair" cx="162" cy="152" r="2.2"/>
  <rect class="ln fillDim" x="92" y="86" width="36" height="30"/>
  <g class="hair"><line x1="92" y1="94" x2="86" y2="94"/><line x1="92" y1="102" x2="86" y2="102"/><line x1="92" y1="110" x2="86" y2="110"/><line x1="128" y1="94" x2="134" y2="94"/><line x1="128" y1="102" x2="134" y2="102"/><line x1="128" y1="110" x2="134" y2="110"/></g>
  <rect class="ln2" x="30" y="94" width="28" height="18"/><circle class="hair" cx="44" cy="103" r="5"/><circle class="ln" cx="44" cy="103" r="1.6"/>
  <path class="ln2" d="M30,103 C10,103 8,140 40,150 C90,166 150,166 210,166"/>
  <rect class="ln" x="146" y="60" width="18" height="10"/><g class="hair"><line x1="149" y1="60" x2="149" y2="70"/><line x1="153" y1="60" x2="153" y2="70"/><line x1="157" y1="60" x2="157" y2="70"/><line x1="161" y1="60" x2="161" y2="70"/></g>
  <circle class="ln" cx="70" cy="140" r="2.4"/><circle class="ln" cx="80" cy="140" r="2.4"/><circle class="ln" cx="90" cy="140" r="2.4"/><circle class="ln" cx="100" cy="140" r="2.4"/>
  <text x="66" y="150">P F V D</text>
  <text x="140" y="56" text-anchor="end">MH1.25 5P</text>
  <line class="dim" x1="58" y1="38" x2="170" y2="38" marker-end="url(#sk-ar)"/><text x="114" y="34" text-anchor="middle">42 × 42 · 15 мм</text>
  <text x="92" y="184">FC · 1310/1550 нм · ≤16 г</text>`);
}

/** Ground station S-R — передня панель: V1/V2, FC, індикатори; ззаду XT60. */
export function groundSketch() {
  return wrap('Наземна станція S-R', `
  <rect class="ln2 fillDim" x="34" y="56" width="162" height="100" rx="4"/>
  <circle class="ln2" cx="70" cy="90" r="11"/><circle class="hair" cx="70" cy="90" r="5"/><text x="70" y="114" text-anchor="middle">V1</text>
  <circle class="ln2" cx="106" cy="90" r="11"/><circle class="hair" cx="106" cy="90" r="5"/><text x="106" y="114" text-anchor="middle">V2</text>
  <rect class="ln2" x="140" y="80" width="22" height="20"/><circle class="hair" cx="151" cy="90" r="6"/><text x="151" y="114" text-anchor="middle">FC</text>
  <circle class="ln" cx="52" cy="140" r="2.4"/><circle class="ln" cx="62" cy="140" r="2.4"/><circle class="ln" cx="72" cy="140" r="2.4"/><circle class="ln" cx="82" cy="140" r="2.4"/>
  <rect class="ln" x="120" y="132" width="24" height="12"/><text x="150" y="141">CRSF/PPM</text>
  <path class="ln2" d="M196,106 L214,106"/><rect class="ln" x="214" y="98" width="10" height="16"/><text x="200" y="124">XT60 2S–6S</text>
  <line class="dim" x1="34" y1="44" x2="196" y2="44" marker-end="url(#sk-ar)"/><text x="115" y="40" text-anchor="middle">95 × 62 · 48 мм</text>
  <text x="34" y="180">2 × відео · тренер DSC · 112 г</text>`);
}

/* ---------- пропелери: креслення за обміром серійних зразків (02.09.2026) ----------
   Планформа лопаті знята з фото зразків на лінійці (координати кромок у мм,
   вісь лопаті вгору); ступиця, посадка та отвори — з фото ступиці.
   Кут β на 0,75R і на кінці лопаті рахується з кроку: β = arctg(P / 2πr). */
const PROP_GEO = {
  10: {
    D: 254, P: 5, hub: 20, bore: 6, pcd: 15, hole: 2, c75: 16.5,
    LE: [[-7.9, -8.7], [-11.8, -21.6], [-12.8, -35.2], [-12.4, -49.9], [-11.7, -63.2], [-10.3, -76.5], [-9.2, -89.7], [-8.3, -103.7], [-7.3, -116.7], [-7, -123.2]],
    TE: [[6.8, -9.5], [9.9, -22.5], [11.5, -35.7], [12, -50], [11.2, -63.3], [10.1, -76.5], [8.2, -89.8], [6.3, -103.8], [3.8, -116.8], [0.2, -123.4]],
    tip: [-3.5, -127],
  },
  15: {
    D: 381, P: 10, hub: 25, bore: 6, pcd: 15, hole: 2, c75: 16.5,
    LE: [[-3.4, -16.3], [-6.2, -35.3], [-9.5, -54.3], [-11.5, -74.6], [-12, -93.9], [-12.3, -113.3], [-12.2, -132.6], [-12, -152], [-12.6, -171.2], [-11.8, -181.5]],
    TE: [[10.1, -13.2], [13, -33.4], [14, -53.3], [13.9, -74.2], [12.3, -93.9], [9.7, -113.6], [6.5, -133], [3.5, -152.5], [-0.8, -171.7], [-5.2, -181.8]],
    tip: [-8.9, -190.3],
  },
};
const f1 = (n) => String(Math.round(n * 10) / 10);
const uk = (n, d = 1) => n.toFixed(d).replace('.', ',');
/* ламана → гладка крива (Catmull-Rom → кубічні Безьє) */
function crPath(pts) {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
  }
  return d;
}
function bladePath(g, k) {
  const sc = (pts) => pts.map(([x, y]) => [x * k, y * k]);
  const le = sc(g.LE), te = sc(g.TE).reverse(), tip = [g.tip[0] * k, g.tip[1] * k];
  return `M${f1(le[0][0])},${f1(le[0][1])}${crPath(le)} Q${f1(tip[0])},${f1(tip[1])} ${f1(te[0][0])},${f1(te[0][1])}${crPath(te)} Z`;
}
const PA = '<marker id="pa" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L7,4 L0,7 Z" fill="rgba(255,61,79,0.85)"/></marker>';

/** Пропелер 10″ / 15″ — планформа (вигляд зверху) + ступиця + переріз лопаті на 0,75R. Два SVG: поруч на десктопі, один під одним на телефоні. */
export function propSketch(inch = 10) {
  const g = PROP_GEO[inch] || PROP_GEO[10];
  const R = 132, k = R / (g.D / 2), P = g.P * 25.4;
  const beta = (r) => (Math.atan(P / (2 * Math.PI * r)) * 180) / Math.PI;
  const b75 = beta((0.75 * g.D) / 2), btip = beta(g.D / 2);
  const blade = bladePath(g, k);
  const hubR = (g.hub / 2) * k, pcdR = (g.pcd / 2) * k, boreR = (g.bore / 2) * k, holeR = Math.max(1.1, (g.hole / 2) * k);
  const holesAt = (rr, hr) => [-90, 30, 150].map((a) => { const t = (a * Math.PI) / 180; return `<circle class="ln" cx="${f1(rr * Math.cos(t))}" cy="${f1(rr * Math.sin(t))}" r="${f1(hr)}"/>`; }).join('');
  const r75 = 0.75 * R;
  const plan = `<svg class="sketch sketch--prop" viewBox="0 0 300 330" role="img" aria-label="Пропелер ${inch}″ — вигляд зверху"><defs>${PA}</defs>
    <g transform="translate(150,150)">
      <circle class="hair" r="${R}"/><circle class="dim" r="${f1(r75)}"/>
      <line class="hair" x1="-${R + 8}" x2="${R + 8}" y1="0" y2="0"/><line class="hair" y1="-${R + 8}" y2="${R + 8}" x1="0" x2="0"/>
      <g class="ln fillDim"><path d="${blade}"/><path d="${blade}" transform="rotate(120)"/><path d="${blade}" transform="rotate(240)"/></g>
      <circle class="ln2 fillDim" r="${f1(hubR)}"/><circle class="dim" r="${f1(pcdR)}"/><circle class="ln" r="${f1(boreR)}"/>${holesAt(pcdR, holeR)}
      <line class="dimL" x1="-30" x2="30" y1="-${f1(r75)}" y2="-${f1(r75)}"/>
      <text x="-38" y="-${f1(r75 - 3)}" text-anchor="end">A</text><text x="38" y="-${f1(r75 - 3)}">A</text>
      <text x="${f1(r75 * 0.72 + 6)}" y="-${f1(r75 * 0.72 + 2)}">0,75R</text>
      <line class="hair" x1="-${R}" x2="-${R}" y1="0" y2="150"/><line class="hair" x1="${R}" x2="${R}" y1="0" y2="150"/>
      <line class="dimL" x1="-${R}" x2="${R}" y1="145" y2="145" marker-start="url(#pa)" marker-end="url(#pa)"/>
      <text class="big" x="0" y="164" text-anchor="middle">Ø${g.D}</text>
      <text x="0" y="176" text-anchor="middle">${inch}″ · 3 лопаті · крок ${uk(g.P, g.P % 1 ? 1 : 0)}″</text>
    </g></svg>`;
  const kh = 30 / (g.hub / 2), ks = 3.2, c = g.c75 * ks;
  const arc = (rr) => `M${f1(rr)},0 A${f1(rr)} ${f1(rr)} 0 0 0 ${f1(rr * Math.cos((b75 * Math.PI) / 180))},${f1(-rr * Math.sin((b75 * Math.PI) / 180))}`;
  const det = `<svg class="sketch sketch--prop" viewBox="0 0 230 330" role="img" aria-label="Ступиця та переріз лопаті пропелера ${inch}″"><defs>${PA}</defs>
    <g transform="translate(108,92)">
      <text class="t" x="0" y="-64" text-anchor="middle">СТУПИЦЯ · ВИГЛЯД ЗВЕРХУ</text>
      <line class="hair" x1="-46" x2="46" y1="0" y2="0"/><line class="hair" y1="-46" y2="46" x1="0" x2="0"/>
      <circle class="ln2 fillDim" r="30"/><circle class="dim" r="${f1((g.pcd / 2) * kh)}"/><circle class="ln" r="${f1((g.bore / 2) * kh)}"/>${holesAt((g.pcd / 2) * kh, (g.hole / 2) * kh)}
      <line class="hair" x1="0" x2="60" y1="-30" y2="-30"/><line class="hair" x1="0" x2="60" y1="30" y2="30"/>
      <line class="dimL" x1="56" x2="56" y1="-30" y2="30" marker-start="url(#pa)" marker-end="url(#pa)"/>
      <text x="62" y="3">Ø${g.hub}</text>
      <line class="hair" x1="-4" y1="-4" x2="-48" y2="-48"/><text x="-50" y="-52" text-anchor="end">Ø${g.bore} посадка</text>
      <text x="0" y="52" text-anchor="middle">3 × Ø${g.hole} на Ø${g.pcd}</text>
    </g>
    <g transform="translate(108,238)">
      <text class="t" x="0" y="-62" text-anchor="middle">ПЕРЕРІЗ A–A · r = 0,75R = ${Math.round((0.75 * g.D) / 2)} мм</text>
      <line class="dim" x1="-94" x2="94" y1="0" y2="0"/><text x="-94" y="17">площина обертання</text>
      <g transform="rotate(-${f1(b75)})">
        <line class="dim" x1="${f1(-c / 2 - 12)}" x2="${f1(c / 2 + 12)}" y1="0" y2="0"/>
        <path class="ln2 fillDim" d="M${f1(-c / 2)},0 C${f1(-c / 2 + c * 0.1)},${f1(-c * 0.16)} ${f1(c / 2 - c * 0.25)},${f1(-c * 0.13)} ${f1(c / 2)},0 C${f1(c / 2 - c * 0.3)},${f1(c * 0.05)} ${f1(-c / 2 + c * 0.2)},${f1(c * 0.06)} ${f1(-c / 2)},0 Z"/>
      </g>
      <path class="dimL" d="${arc(44)}" marker-end="url(#pa)"/>
      <text x="50" y="-8">β = ${uk(b75)}°</text>
      <text x="0" y="36" text-anchor="middle">хорда ${uk(g.c75)} мм · β = arctg(P / 2πr)</text>
      <text x="0" y="50" text-anchor="middle">на кінці лопаті ${uk(btip)}° · P = ${Math.round(P)} мм</text>
    </g></svg>`;
  return `<div class="propsk">${plan}${det}</div>`;
}

/** Карбоновий лист — у перспективі, з шарами та товщиною. */
export function sheetSketch() {
  return wrap('Карбоновий лист', `
  <path class="ln2 fillDim" d="M30,150 L150,150 L200,80 L80,80 Z"/>
  <path class="ln2 fillDim" d="M30,150 L30,162 L150,162 L150,150 Z"/>
  <path class="ln fillDim" d="M150,150 L150,162 L200,92 L200,80 Z"/>
  <g class="hair"><line x1="30" y1="154" x2="150" y2="154"/><line x1="30" y1="158" x2="150" y2="158"/></g>
  <g class="hair"><path d="M60,140 L120,90"/><path d="M78,144 L138,94"/><path d="M96,146 L156,96"/><path d="M114,148 L174,98"/></g>
  <line class="dim" x1="30" y1="172" x2="150" y2="172" marker-end="url(#sk-ar)"/><text x="90" y="184" text-anchor="middle">600 × 500 · 1000 × 1000</text>
  <line class="dim" x1="212" y1="150" x2="212" y2="162"/><text x="216" y="158">2…8 мм</text>
  <text x="30" y="60">вуглецеве волокно · епоксидна матриця</text>`);
}

/** Карбонова труба — вигляд збоку та торець. */
export function tubeSketch() {
  return wrap('Карбонова труба', `
  <rect class="ln2 fillDim" x="20" y="88" width="140" height="30" rx="2"/>
  <line class="hair" x1="20" y1="96" x2="160" y2="96"/><line class="hair" x1="20" y1="110" x2="160" y2="110"/>
  <path class="hair" d="M40,88 v30 M60,88 v30 M80,88 v30 M100,88 v30 M120,88 v30 M140,88 v30"/>
  <circle class="ln2 fillDim" cx="196" cy="103" r="15"/><circle class="ln" cx="196" cy="103" r="11"/>
  <line class="dim" x1="20" y1="132" x2="160" y2="132" marker-end="url(#sk-ar)"/><text x="90" y="144" text-anchor="middle">L 2000 мм</text>
  <line class="dim" x1="196" y1="80" x2="196" y2="70"/><text x="196" y="66" text-anchor="middle">Ø16 / Ø12</text>
  <text x="20" y="170">намотування · інші перерізи за запитом</text>`);
}

/** SMT — плата з компонентами. */
export function smtSketch() {
  return wrap('SMT-монтаж плат', `
  <rect class="ln2 fillDim" x="34" y="46" width="162" height="112" rx="3"/>
  <rect class="ln fillDim" x="94" y="86" width="42" height="34"/>
  <g class="hair">
    <path d="M94,92 h-8 M94,100 h-8 M94,108 h-8 M94,116 h-8 M136,92 h8 M136,100 h8 M136,108 h8 M136,116 h8"/>
    <path d="M102,86 v-8 M110,86 v-8 M118,86 v-8 M126,86 v-8 M102,120 v8 M110,120 v8 M118,120 v8 M126,120 v8"/>
  </g>
  <g class="ln"><rect x="48" y="60" width="10" height="5"/><rect x="62" y="60" width="10" height="5"/><rect x="48" y="72" width="10" height="5"/><rect x="62" y="72" width="10" height="5"/><rect x="160" y="60" width="20" height="8"/><rect x="160" y="74" width="20" height="8"/></g>
  <rect class="ln2" x="48" y="128" width="40" height="16"/><g class="hair"><line x1="56" y1="128" x2="56" y2="144"/><line x1="64" y1="128" x2="64" y2="144"/><line x1="72" y1="128" x2="72" y2="144"/><line x1="80" y1="128" x2="80" y2="144"/></g>
  <circle class="ln" cx="160" cy="134" r="8"/><circle class="hair" cx="160" cy="134" r="3"/>
  <circle class="hair" cx="42" cy="54" r="2"/><circle class="hair" cx="188" cy="54" r="2"/><circle class="hair" cx="42" cy="150" r="2"/><circle class="hair" cx="188" cy="150" r="2"/>
  <text x="34" y="176">0201 … QFP / BGA · SPI · AOI · X-Ray</text>
  <text x="34" y="36">лінія поверхневого монтажу</text>`);
}

/** Оптичний лінк: борт + звій + sky → одне волокно → ground station → оператор. */
export function linkSketch() {
  return wrap('Схема оптичного каналу', `
  <g class="ln2 fillDim"><rect x="14" y="44" width="78" height="42" rx="4"/></g>
  <text x="53" y="60" text-anchor="middle">БОРТ БпЛА</text><text x="53" y="72" text-anchor="middle">звій + S-T</text>
  <circle class="ln" cx="30" cy="100" r="9"/><circle class="hair" cx="30" cy="100" r="4"/>
  <path class="ln2" d="M92,66 C150,66 170,66 230,66 C300,66 320,66 372,66"/>
  <path class="hair" d="M92,62 C150,62 300,62 372,62"/>
  <text x="232" y="56" text-anchor="middle">одне волокно · до 80 км · 1310 / 1550 нм</text>
  <text x="232" y="84" text-anchor="middle">без радіосигнатури — нема що глушити чи пеленгувати</text>
  <g class="ln2 fillDim"><rect x="372" y="44" width="72" height="42" rx="4"/></g>
  <text x="408" y="60" text-anchor="middle">GROUND</text><text x="408" y="72" text-anchor="middle">S-R</text>
  <path class="ln" d="M444,58 L466,44 M444,66 L470,66 M444,74 L466,88"/>
  <text x="472" y="46">окуляри</text><text x="472" y="69">монітор</text><text x="472" y="92">пульт RC</text>`, '0 0 520 120');
}

export const SKETCHES = {
  coil: coilSketch, casing: casingSketch, sky: skySketch, ground: groundSketch,
  prop: propSketch, sheet: sheetSketch, tube: tubeSketch, smt: smtSketch, link: linkSketch,
};

/* Підставити ескізи у всі [data-sketch="ключ"] (data-arg передається аргументом). */
export function mountSketches(root = document) {
  root.querySelectorAll('[data-sketch]').forEach((el) => {
    const fn = SKETCHES[el.dataset.sketch];
    if (!fn) return;
    const args = (el.dataset.arg || '').split(',').filter(Boolean);
    el.innerHTML = fn(...args);
  });
}
