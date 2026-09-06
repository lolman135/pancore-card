/* ============================================================
   PANCORE — векторні ескізи виробів, креслярський стиль
   (як у Megaptera: тонкі лінії, штрихові розмірні, моно-підписи).
   Пропорції — з паспортів: звій 25 км Ø103,8 × H215,56, сердечник Ø53;
   sky station 42 × 42 × 15; ground station 95 × 62 × 48.
   Підписи двомовні: tx(uk, en) обирає за <html lang>.
   Стилі: .sketch .ln / .ln2 / .hair / .dim / .fillDim / text — у pages.css.
   ============================================================ */

const EN = /^en/i.test(document.documentElement.lang || '');
const tx = (uk, en) => (EN ? en : uk);

const ARROW = `<marker id="sk-ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,1 L7,4 L0,7 Z" fill="rgba(255,255,255,0.35)"/></marker>`;
const wrap = (label, body, vb = '0 0 230 205') =>
  `<svg class="sketch" viewBox="${vb}" role="img" aria-label="${label}"><defs>${ARROW}</defs>${body}</svg>`;

/** Безшпульний звій — переріз А–А з шарами намотки та розмірами еталона SFC-30 (30 км). */
export function coilSketch() {
  // масштаб ~1,2 px/мм: Ø121 → 145, Ø53 → 64, H 213,8 → 150
  const x0 = 42, x1 = 187, ix0 = 83, ix1 = 146, y0 = 28, y1 = 178;
  let hatch = '';
  for (let x = x0 + 5; x < ix0; x += 5) hatch += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`;
  for (let x = ix1 + 5; x < x1; x += 5) hatch += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`;
  return wrap(tx('Переріз безшпульного звою', 'Spool-less coil section'), `
  <line class="dim" x1="114" y1="10" x2="114" y2="196"/>
  <rect class="ln2 fillDim" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/>
  <rect class="ln" x="${ix0}" y="${y0}" width="${ix1 - ix0}" height="${y1 - y0}"/>
  <g class="hair">${hatch}</g>
  <path class="ln" d="M${ix0},${y0 - 6} L${ix0 - 14},${y0 - 20} M${ix1},${y0 - 6} L${ix1 + 14},${y0 - 20}"/>
  <line class="dim" x1="${x0}" y1="18" x2="${x1}" y2="18" marker-end="url(#sk-ar)"/>
  <text x="114" y="14" text-anchor="middle">Ø121</text>
  <line class="dim" x1="${ix0}" y1="${y1 + 10}" x2="${ix1}" y2="${y1 + 10}" marker-end="url(#sk-ar)"/>
  <text x="114" y="${y1 + 22}" text-anchor="middle">Ø53</text>
  <line class="dim" x1="${x1 + 12}" y1="${y0}" x2="${x1 + 12}" y2="${y1}" marker-end="url(#sk-ar)"/>
  <text x="${x1 + 24}" y="106" transform="rotate(-90 ${x1 + 24} 106)" text-anchor="middle">H 213.8</text>
  <line class="dim" x1="${x0 - 10}" y1="${y0}" x2="${x0 - 10}" y2="${ix0 - x0 + y0}"/>
  <text x="${x0 - 14}" y="${y0 + 20}" transform="rotate(-90 ${x0 - 14} ${y0 + 20})" text-anchor="middle">34</text>
  <text x="8" y="${y1 + 22}">SFC-30 · 2245 ${tx('г', 'g')}</text>
  <text x="${x1 + 4}" y="${y1 + 22}">${tx('сердечник', 'core')}</text>`);
}

/** Польовий корпус — фронтальний силует із кришкою twist-lock і кріпленням. */
export function casingSketch() {
  return wrap(tx('Польовий корпус звою', 'Field casing'), `
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
  <line class="dim" x1="160" y1="66" x2="176" y2="66"/><text x="180" y="69">${tx('конус виводу', 'exit cone')}</text>
  <line class="dim" x1="56" y1="140" x2="36" y2="140"/><text x="6" y="150" transform="rotate(-90 6 150)" text-anchor="middle">${tx('ластівчин хвіст', 'dovetail')}</text>
  <line class="dim" x1="160" y1="177" x2="176" y2="177"/><text x="180" y="180">${tx('сервісний порт', 'service port')}</text>
  <text x="80" y="196">PETG · ${tx('3D-друк · опція IP67', '3D print · IP67 option')}</text>`);
}

/** Sky station S-T — плата 42 × 42 мм із FC-роз'ємом та клемою даних. */
export function skySketch() {
  return wrap(tx('Бортова станція S-T', 'Sky station S-T'), `
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
  <line class="dim" x1="58" y1="38" x2="170" y2="38" marker-end="url(#sk-ar)"/><text x="114" y="34" text-anchor="middle">42 × 42 · 15 ${tx('мм', 'mm')}</text>
  <text x="92" y="184">FC · 1310/1550 ${tx('нм', 'nm')} · ≤16 ${tx('г', 'g')}</text>`);
}

/** Ground station S-R — передня панель: V1/V2, FC, індикатори; ззаду XT60. */
export function groundSketch() {
  return wrap(tx('Наземна станція S-R', 'Ground station S-R'), `
  <rect class="ln2 fillDim" x="34" y="56" width="162" height="100" rx="4"/>
  <circle class="ln2" cx="70" cy="90" r="11"/><circle class="hair" cx="70" cy="90" r="5"/><text x="70" y="114" text-anchor="middle">V1</text>
  <circle class="ln2" cx="106" cy="90" r="11"/><circle class="hair" cx="106" cy="90" r="5"/><text x="106" y="114" text-anchor="middle">V2</text>
  <rect class="ln2" x="140" y="80" width="22" height="20"/><circle class="hair" cx="151" cy="90" r="6"/><text x="151" y="114" text-anchor="middle">FC</text>
  <circle class="ln" cx="52" cy="140" r="2.4"/><circle class="ln" cx="62" cy="140" r="2.4"/><circle class="ln" cx="72" cy="140" r="2.4"/><circle class="ln" cx="82" cy="140" r="2.4"/>
  <rect class="ln" x="120" y="132" width="24" height="12"/><text x="150" y="141">CRSF/PPM</text>
  <path class="ln2" d="M196,106 L214,106"/><rect class="ln" x="214" y="98" width="10" height="16"/><text x="200" y="124">XT60 2S–6S</text>
  <line class="dim" x1="34" y1="44" x2="196" y2="44" marker-end="url(#sk-ar)"/><text x="115" y="40" text-anchor="middle">95 × 62 · 48 ${tx('мм', 'mm')}</text>
  <text x="34" y="180">2 × ${tx('відео · тренер DSC', 'video · DSC trainer')} · 112 ${tx('г', 'g')}</text>`);
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
const uk = (n, d = 1) => (EN ? n.toFixed(d) : n.toFixed(d).replace('.', ','));
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
const holesAt = (rr, hr) => [-90, 30, 150].map((a) => { const t = (a * Math.PI) / 180; return `<circle class="ln" cx="${f1(rr * Math.cos(t))}" cy="${f1(rr * Math.sin(t))}" r="${f1(hr)}"/>`; }).join('');
const pitchTxt = (g) => uk(g.P, g.P % 1 ? 1 : 0);

/** Пропелер 10″ / 15″ — планформа (вигляд зверху) + ступиця + переріз лопаті на 0,75R. Два SVG: поруч на десктопі, один під одним на телефоні. */
export function propSketch(inch = 10) {
  const g = PROP_GEO[inch] || PROP_GEO[10];
  const R = 132, k = R / (g.D / 2), P = g.P * 25.4;
  const beta = (r) => (Math.atan(P / (2 * Math.PI * r)) * 180) / Math.PI;
  const b75 = beta((0.75 * g.D) / 2), btip = beta(g.D / 2);
  const blade = bladePath(g, k);
  const hubR = (g.hub / 2) * k, pcdR = (g.pcd / 2) * k, boreR = (g.bore / 2) * k, holeR = Math.max(1.1, (g.hole / 2) * k);
  const r75 = 0.75 * R;
  const plan = `<svg class="sketch sketch--prop" viewBox="0 0 300 330" role="img" aria-label="${tx(`Пропелер ${inch}″ — вигляд зверху`, `Propeller ${inch}″ — top view`)}"><defs>${PA}</defs>
    <g transform="translate(150,150)">
      <circle class="hair" r="${R}"/><circle class="dim" r="${f1(r75)}"/>
      <line class="hair" x1="-${R + 8}" x2="${R + 8}" y1="0" y2="0"/><line class="hair" y1="-${R + 8}" y2="${R + 8}" x1="0" x2="0"/>
      <g class="ln fillDim"><path d="${blade}"/><path d="${blade}" transform="rotate(120)"/><path d="${blade}" transform="rotate(240)"/></g>
      <circle class="ln2 fillDim" r="${f1(hubR)}"/><circle class="dim" r="${f1(pcdR)}"/><circle class="ln" r="${f1(boreR)}"/>${holesAt(pcdR, holeR)}
      <line class="dimL" x1="-30" x2="30" y1="-${f1(r75)}" y2="-${f1(r75)}"/>
      <text x="-38" y="-${f1(r75 - 3)}" text-anchor="end">A</text><text x="38" y="-${f1(r75 - 3)}">A</text>
      <text x="${f1(r75 * 0.72 + 6)}" y="-${f1(r75 * 0.72 + 2)}">0${EN ? '.' : ','}75R</text>
      <line class="hair" x1="-${R}" x2="-${R}" y1="0" y2="150"/><line class="hair" x1="${R}" x2="${R}" y1="0" y2="150"/>
      <line class="dimL" x1="-${R}" x2="${R}" y1="145" y2="145" marker-start="url(#pa)" marker-end="url(#pa)"/>
      <text class="big" x="0" y="164" text-anchor="middle">Ø${g.D}</text>
      <text x="0" y="176" text-anchor="middle">${inch}″ · ${tx('3 лопаті · крок', '3 blades · pitch')} ${pitchTxt(g)}″</text>
    </g></svg>`;
  const kh = 30 / (g.hub / 2), ks = 3.2, c = g.c75 * ks;
  const arc = (rr) => `M${f1(rr)},0 A${f1(rr)} ${f1(rr)} 0 0 0 ${f1(rr * Math.cos((b75 * Math.PI) / 180))},${f1(-rr * Math.sin((b75 * Math.PI) / 180))}`;
  const det = `<svg class="sketch sketch--prop" viewBox="0 0 230 330" role="img" aria-label="${tx(`Ступиця та переріз лопаті пропелера ${inch}″`, `Hub and blade section, propeller ${inch}″`)}"><defs>${PA}</defs>
    <g transform="translate(108,92)">
      <text class="t" x="0" y="-64" text-anchor="middle">${tx('СТУПИЦЯ · ВИГЛЯД ЗВЕРХУ', 'HUB · TOP VIEW')}</text>
      <line class="hair" x1="-46" x2="46" y1="0" y2="0"/><line class="hair" y1="-46" y2="46" x1="0" x2="0"/>
      <circle class="ln2 fillDim" r="30"/><circle class="dim" r="${f1((g.pcd / 2) * kh)}"/><circle class="ln" r="${f1((g.bore / 2) * kh)}"/>${holesAt((g.pcd / 2) * kh, (g.hole / 2) * kh)}
      <line class="hair" x1="0" x2="60" y1="-30" y2="-30"/><line class="hair" x1="0" x2="60" y1="30" y2="30"/>
      <line class="dimL" x1="56" x2="56" y1="-30" y2="30" marker-start="url(#pa)" marker-end="url(#pa)"/>
      <text x="62" y="3">Ø${g.hub}</text>
      <line class="hair" x1="-4" y1="-4" x2="-48" y2="-48"/><text x="-50" y="-52" text-anchor="end">Ø${g.bore} ${tx('посадка', 'bore')}</text>
      <text x="0" y="52" text-anchor="middle">3 × Ø${g.hole} ${tx('на', 'on')} Ø${g.pcd}</text>
    </g>
    <g transform="translate(108,238)">
      <text class="t" x="0" y="-62" text-anchor="middle">${tx('ПЕРЕРІЗ A–A · r = 0,75R =', 'SECTION A–A · r = 0.75R =')} ${Math.round((0.75 * g.D) / 2)} ${tx('мм', 'mm')}</text>
      <line class="dim" x1="-94" x2="94" y1="0" y2="0"/><text x="-94" y="17">${tx('площина обертання', 'plane of rotation')}</text>
      <g transform="rotate(-${f1(b75)})">
        <line class="dim" x1="${f1(-c / 2 - 12)}" x2="${f1(c / 2 + 12)}" y1="0" y2="0"/>
        <path class="ln2 fillDim" d="M${f1(-c / 2)},0 C${f1(-c / 2 + c * 0.1)},${f1(-c * 0.16)} ${f1(c / 2 - c * 0.25)},${f1(-c * 0.13)} ${f1(c / 2)},0 C${f1(c / 2 - c * 0.3)},${f1(c * 0.05)} ${f1(-c / 2 + c * 0.2)},${f1(c * 0.06)} ${f1(-c / 2)},0 Z"/>
      </g>
      <path class="dimL" d="${arc(44)}" marker-end="url(#pa)"/>
      <text x="50" y="-8">β = ${uk(b75)}°</text>
      <text x="0" y="36" text-anchor="middle">${tx('хорда', 'chord')} ${uk(g.c75)} ${tx('мм', 'mm')} · β = arctg(P / 2πr)</text>
      <text x="0" y="50" text-anchor="middle">${tx('на кінці лопаті', 'at blade tip')} ${uk(btip)}° · P = ${Math.round(P)} ${tx('мм', 'mm')}</text>
    </g></svg>`;
  return `<div class="propsk">${plan}${det}</div>`;
}

/** Обидва пропелери в одному масштабі: 15″ приглушено, 10″ поверх. */
export function propScaleSketch() {
  const g15 = PROP_GEO[15], g10 = PROP_GEO[10];
  const R = 132, k = R / (g15.D / 2), R10 = (g10.D / 2) * k;
  const b15 = bladePath(g15, k), b10 = bladePath(g10, k);
  return `<div class="propsk propsk--one"><svg class="sketch sketch--prop" viewBox="0 0 300 330" role="img" aria-label="${tx('Пропелери 10″ і 15″ в одному масштабі', 'Propellers 10″ and 15″ to the same scale')}"><defs>${PA}</defs>
    <g transform="translate(150,150)">
      <circle class="hair" r="${R}"/><circle class="dim" r="${f1(R10)}"/>
      <line class="hair" x1="-${R + 8}" x2="${R + 8}" y1="0" y2="0"/><line class="hair" y1="-${R + 8}" y2="${R + 8}" x1="0" x2="0"/>
      <g class="ln fillDim" opacity="0.45"><path d="${b15}"/><path d="${b15}" transform="rotate(120)"/><path d="${b15}" transform="rotate(240)"/></g>
      <circle class="ln fillDim" r="${f1((g15.hub / 2) * k)}" opacity="0.45"/>
      <g class="ln2 fillDim" transform="rotate(60)"><path d="${b10}"/><path d="${b10}" transform="rotate(120)"/><path d="${b10}" transform="rotate(240)"/></g>
      <circle class="ln2 fillDim" r="${f1((g10.hub / 2) * k)}"/><circle class="ln" r="${f1((g10.bore / 2) * k)}"/>
      <line class="hair" x1="-${R}" x2="-${R}" y1="0" y2="150"/><line class="hair" x1="${R}" x2="${R}" y1="0" y2="150"/>
      <line class="dimL" x1="-${R}" x2="${R}" y1="145" y2="145" marker-start="url(#pa)" marker-end="url(#pa)"/>
      <text class="big" x="0" y="164" text-anchor="middle">Ø381 · Ø254</text>
      <line class="dimL" x1="-${f1(R10)}" x2="${f1(R10)}" y1="-${f1(R10 + 10)}" y2="-${f1(R10 + 10)}" marker-start="url(#pa)" marker-end="url(#pa)"/>
      <text x="0" y="-${f1(R10 + 16)}" text-anchor="middle">Ø254 · 10″</text>
      <text x="0" y="176" text-anchor="middle">${tx('15″ (приглушено) і 10″ в одному масштабі', '15″ (dimmed) and 10″ to the same scale')}</text>
    </g></svg></div>`;
}

/** Карбоновий лист — у перспективі, з шарами та товщиною. */
export function sheetSketch() {
  return wrap(tx('Карбоновий лист', 'Carbon sheet'), `
  <path class="ln2 fillDim" d="M30,150 L150,150 L200,80 L80,80 Z"/>
  <path class="ln2 fillDim" d="M30,150 L30,162 L150,162 L150,150 Z"/>
  <path class="ln fillDim" d="M150,150 L150,162 L200,92 L200,80 Z"/>
  <g class="hair"><line x1="30" y1="154" x2="150" y2="154"/><line x1="30" y1="158" x2="150" y2="158"/></g>
  <g class="hair"><path d="M60,140 L120,90"/><path d="M78,144 L138,94"/><path d="M96,146 L156,96"/><path d="M114,148 L174,98"/></g>
  <line class="dim" x1="30" y1="172" x2="150" y2="172" marker-end="url(#sk-ar)"/><text x="90" y="184" text-anchor="middle">600 × 500 · 1000 × 1000</text>
  <line class="dim" x1="212" y1="150" x2="212" y2="162"/><text x="216" y="158">2…8 ${tx('мм', 'mm')}</text>
  <text x="30" y="60">${tx('вуглецеве волокно · епоксидна матриця', 'carbon fibre · epoxy matrix')}</text>`);
}

/** Карбонова труба — вигляд збоку та торець. */
export function tubeSketch() {
  return wrap(tx('Карбонова труба', 'Carbon tube'), `
  <rect class="ln2 fillDim" x="20" y="88" width="140" height="30" rx="2"/>
  <line class="hair" x1="20" y1="96" x2="160" y2="96"/><line class="hair" x1="20" y1="110" x2="160" y2="110"/>
  <path class="hair" d="M40,88 v30 M60,88 v30 M80,88 v30 M100,88 v30 M120,88 v30 M140,88 v30"/>
  <circle class="ln2 fillDim" cx="196" cy="103" r="15"/><circle class="ln" cx="196" cy="103" r="11"/>
  <line class="dim" x1="20" y1="132" x2="160" y2="132" marker-end="url(#sk-ar)"/><text x="90" y="144" text-anchor="middle">L 2000 ${tx('мм', 'mm')}</text>
  <line class="dim" x1="196" y1="80" x2="196" y2="70"/><text x="196" y="66" text-anchor="middle">Ø16 / Ø12</text>
  <text x="20" y="170">${tx('намотування · інші перерізи за запитом', 'wound · other sections on request')}</text>`);
}

/** SMT — плата з компонентами. */
export function smtSketch() {
  return wrap(tx('SMT-монтаж плат', 'SMT assembly'), `
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
  <text x="34" y="36">${tx('лінія поверхневого монтажу', 'surface-mount line')}</text>`);
}

/** Оптичний лінк: борт + звій + sky → одне волокно → ground station → оператор. */
export function linkSketch() {
  return wrap(tx('Схема оптичного каналу', 'Optical link diagram'), `
  <g class="ln2 fillDim"><rect x="14" y="44" width="78" height="42" rx="4"/></g>
  <text x="53" y="60" text-anchor="middle">${tx('БОРТ БпЛА', 'UAV ONBOARD')}</text><text x="53" y="72" text-anchor="middle">${tx('звій + S-T', 'coil + S-T')}</text>
  <circle class="ln" cx="30" cy="100" r="9"/><circle class="hair" cx="30" cy="100" r="4"/>
  <path class="ln2" d="M92,66 C150,66 170,66 230,66 C300,66 320,66 372,66"/>
  <path class="hair" d="M92,62 C150,62 300,62 372,62"/>
  <text x="232" y="56" text-anchor="middle">${tx('одне волокно · до 80 км · 1310 / 1550 нм', 'single fibre · up to 80 km · 1310 / 1550 nm')}</text>
  <text x="232" y="84" text-anchor="middle">${tx('без радіосигнатури — нема що глушити чи пеленгувати', 'no radio signature — nothing to jam or locate')}</text>
  <g class="ln2 fillDim"><rect x="372" y="44" width="72" height="42" rx="4"/></g>
  <text x="408" y="60" text-anchor="middle">GROUND</text><text x="408" y="72" text-anchor="middle">S-R</text>
  <path class="ln" d="M444,58 L466,44 M444,66 L470,66 M444,74 L466,88"/>
  <text x="472" y="46">${tx('окуляри', 'goggles')}</text><text x="472" y="69">${tx('монітор', 'monitor')}</text><text x="472" y="92">${tx('пульт RC', 'RC transmitter')}</text>`, '0 0 520 120');
}

/** Схема підключення наземної станції (за польовою інструкцією): борт зі звоєм → конектор →
    оптична розетка S-R · АКБ у XT60 · монітор/ПК · пульт RC. */
export function hookupSketch() {
  const osd = (x, y, t) => `<text class="osd" x="${x}" y="${y}">${t}</text>`;
  return wrap(tx('Схема підключення наземної станції', 'Ground station hook-up'), `
  <g class="hair"><path d="M22,22 l16,16 M38,22 l-16,16"/><circle cx="22" cy="22" r="3"/><circle cx="38" cy="22" r="3"/><circle cx="22" cy="38" r="3"/><circle cx="38" cy="38" r="3"/></g>
  <rect class="ln" x="25" y="25" width="10" height="10" rx="2"/>
  <text x="46" y="26">${tx('БпЛА · sky S-T', 'UAV · sky S-T')}</text><text x="46" y="36">${tx('звій на борту', 'coil on board')}</text>
  <path class="ln2 fillDim" d="M14,58 h50 a4,4 0 0 1 4,4 v10 l10,4 v8 l-10,4 v10 a4,4 0 0 1 -4,4 h-50 a4,4 0 0 1 -4,-4 v-36 a4,4 0 0 1 4,-4 z"/>
  <path class="hair" d="M18,66 h42 M18,72 h42 M18,78 h42 M18,84 h42 M18,90 h42"/>
  <rect class="ln" x="80" y="74" width="12" height="10" rx="1"/><path class="hair" d="M83,74 v10 M86,74 v10 M89,74 v10"/>
  <text x="12" y="112">${tx('звій у корпусі', 'coil in casing')}</text><text x="12" y="121">${tx('twist-lock · PETG', 'twist-lock · PETG')}</text>
  <path class="fiber" d="M92,79 C120,79 140,79 168,79"/>
  <text x="98" y="70">${tx('конектор', 'connector')}</text>
  <text class="warn" x="98" y="112">${tx('співвісність паза та виїмки', 'align key and notch')}</text>
  <text class="warn" x="98" y="121">${tx('контргайка — до упору', 'lock-nut fully tight')}</text>
  <rect class="ln2 fillDim" x="170" y="52" width="120" height="54" rx="5"/>
  <circle class="ln2" cx="170" cy="79" r="5"/><circle class="hair" cx="170" cy="79" r="2"/>
  <text x="176" y="66">GROUND STATION</text><text x="176" y="76">S-R</text>
  <text x="176" y="93">${tx('оптична розетка', 'optical socket')}</text><text x="176" y="102">${tx('1310/1550 нм · ≤ 80 км', '1310/1550 nm · ≤ 80 km')}</text>
  <rect class="ln" x="222" y="46" width="14" height="6"/><path class="ln" d="M229,46 v-14"/>
  <rect class="ln2 fillDim" x="206" y="12" width="46" height="20" rx="3"/><text x="212" y="25">XT60 · 2S–6S</text>
  <rect class="ln" x="290" y="62" width="6" height="8"/><rect class="ln" x="290" y="86" width="6" height="8"/>
  <path class="ln" d="M296,66 h34"/><path class="ln" d="M296,90 C320,90 330,124 360,124 h80"/>
  <text x="296" y="59">V1 / V2</text>
  <rect class="ln2" x="330" y="40" width="112" height="70" rx="4"/><rect class="fillDim" x="336" y="46" width="100" height="56"/>
  <path class="ln" d="M370,110 v8 M402,110 v8 M360,118 h52"/>
  ${osd(341, 56, 'ACRO · 00:00 · alt 1.1 m')}${osd(341, 66, 'link-ok · rx −3.6 · tx −0.1')}${osd(341, 76, '26.9V · 4.48V · 0.5 A')}${osd(341, 86, '99 % · FPS 30')}${osd(341, 96, 'FW 2.18 · SN 12345678')}
  <text x="330" y="132">${tx('монітор / ПК · відео і телеметрія', 'monitor / PC · video and telemetry')}</text>
  <rect class="ln2 fillDim" x="448" y="82" width="62" height="40" rx="8"/>
  <circle class="ln" cx="464" cy="102" r="7"/><circle class="hair" cx="464" cy="102" r="2.5"/><circle class="ln" cx="494" cy="102" r="7"/><circle class="hair" cx="494" cy="102" r="2.5"/>
  <path class="ln" d="M479,82 v-22"/><circle class="hair" cx="479" cy="58" r="2"/>
  <text x="420" y="144">${tx('пульт RC · CRSF/PPM', 'RC · CRSF/PPM')}</text>
  <text class="warn" x="12" y="140">${tx('на позиції не витягуйте більше 2 м волокна · при перевірці — до 10 см', 'do not pull out more than 2 m of fibre · up to 10 cm when testing')}</text>`, '0 0 520 150');
}

/* Ізометрична сітка: точка (u, v) на площині 0…1 → координати SVG. */
function isoGrid(cx, cy, sx, sy) {
  const P = (u, v) => [cx + (u - v) * sx, cy + (u + v) * sy];
  const at = (u, v, dy = 0) => { const [x, y] = P(u, v); return `${x.toFixed(1)},${(y + dy).toFixed(1)}`; };
  const pts = (...uv) => uv.map(([u, v]) => at(u, v)).join(' ');
  const slab = () => `<polygon class="ln2 fillDim" points="${pts([0, 0], [1, 0], [1, 1], [0, 1])}"/>
  <path class="hair" d="M${at(0, 1)} v8 L${at(1, 1, 8)} L${at(1, 0, 8)} v-8 M${at(1, 1)} v8"/>`;
  const tree = (u, v, k = 1) => { const [x, y] = P(u, v); return `<path class="green" d="M${(x - 5 * k).toFixed(1)},${y.toFixed(1)} l${5 * k},${-12 * k} l${5 * k},${12 * k} z"/><path class="hair" d="M${x.toFixed(1)},${y.toFixed(1)} v${3 * k}"/>`; };
  const drone = (u, v, lift = 0) => { const [x, y0] = P(u, v); const y = y0 - lift; const c = (dx, dy) => `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="2.2"/>`; return `<g class="ln"><path d="M${(x - 5).toFixed(1)},${(y - 5).toFixed(1)} l10,10 M${(x + 5).toFixed(1)},${(y - 5).toFixed(1)} l-10,10"/>${c(-5, -5)}${c(5, -5)}${c(-5, 5)}${c(5, 5)}</g>`; };
  return { P, at, pts, slab, tree, drone };
}

/** Волокно на складному маршруті — за мотивами польової інструкції: пагорб із деревами,
    дорога, опора ЛЕП; лінія проходить над усім цим без обриву. Без тактики — лише про якість волокна. */
export function terrainSketch() {
  const g = isoGrid(262, 64, 200, 58);
  const { at, pts, slab, tree, drone } = g;
  const [hx, hy] = g.P(0.28, 0.5);
  const [tx0, ty0] = g.P(0.86, 0.42);
  const hill = [[72, 27], [48, 18], [26, 10]].map(([rx, ry]) => `<ellipse class="hair" cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" rx="${rx}" ry="${ry}"/>`).join('');
  const tower = `<g class="ln"><path d="M${(tx0 - 7).toFixed(1)},${ty0.toFixed(1)} L${(tx0 - 2).toFixed(1)},${(ty0 - 42).toFixed(1)} M${(tx0 + 7).toFixed(1)},${ty0.toFixed(1)} L${(tx0 + 2).toFixed(1)},${(ty0 - 42).toFixed(1)} M${(tx0 - 10).toFixed(1)},${(ty0 - 30).toFixed(1)} h20"/></g>
  <g class="hair"><path d="M${(tx0 - 5.5).toFixed(1)},${(ty0 - 12).toFixed(1)} h11 M${(tx0 - 4).toFixed(1)},${(ty0 - 24).toFixed(1)} h8 M${(tx0 - 3).toFixed(1)},${(ty0 - 36).toFixed(1)} h6"/></g>
  <path class="ln" d="M${(tx0 - 10).toFixed(1)},${(ty0 - 30).toFixed(1)} L${(tx0 - 62).toFixed(1)},${(ty0 - 58).toFixed(1)} M${(tx0 + 10).toFixed(1)},${(ty0 - 30).toFixed(1)} L${(tx0 + 58).toFixed(1)},${(ty0 - 50).toFixed(1)}"/>`;
  return wrap(tx('Волокно на складному маршруті', 'Fibre over difficult terrain'), `
  ${slab()}
  ${hill}
  <polygon class="road" points="${pts([0.57, 0], [0.67, 0], [0.67, 1], [0.57, 1])}"/>
  <path class="hair" stroke-dasharray="4 4" d="M${at(0.62, 0.04)} L${at(0.62, 0.96)}"/>
  ${tree(0.2, 0.44, 1.1)}${tree(0.27, 0.36, 0.9)}${tree(0.33, 0.47, 1.2)}${tree(0.24, 0.56, 0.8)}${tree(0.36, 0.58, 1)}${tree(0.5, 0.28, 0.9)}${tree(0.72, 0.3, 0.9)}${tree(0.76, 0.62, 1.1)}
  ${tower}
  <path class="fiber" d="M${at(0.03, 0.93)} C${at(0.1, 0.72)} ${at(0.18, 0.5, -20)} ${at(0.28, 0.44, -24)} S${at(0.46, 0.3, -6)} ${at(0.57, 0.3, -12)} S${at(0.7, 0.28, -12)} ${at(0.8, 0.26, -2)} S${at(0.9, 0.16)} ${at(0.94, 0.06, -6)}"/>
  ${drone(0.94, 0.06, 8)}
  <text x="12" y="20">${tx('волокно на складному маршруті', 'fibre over difficult terrain')}</text>
  <text x="12" y="30">${tx('пагорб · дерева · дорога · ЛЕП', 'hill · trees · road · power line')}</text>
  <text x="${(hx - 34).toFixed(1)}" y="${(hy - 44).toFixed(1)}">${tx('над деревами', 'over the trees')}</text>
  <text x="${(g.P(0.62, 0.3)[0] - 28).toFixed(1)}" y="${(g.P(0.62, 0.3)[1] - 34).toFixed(1)}">${tx('над дорогою', 'over the road')}</text>
  <text x="${(tx0 + 14).toFixed(1)}" y="${(ty0 + 6).toFixed(1)}">${tx('під проводами', 'under the wires')}</text>
  <text class="ok" x="12" y="196">${tx('G.657.A2 · радіус вигину 7,5 мм · 5–60 км без з’єднань', 'G.657.A2 · bend radius 7.5 mm · 5–60 km without splices')}</text>
  <text class="ok" x="12" y="206">${tx('тримає натяг, вітер і перепади висот — без обриву й втрат сигналу', 'holds tension, wind and elevation changes — no break, no signal loss')}</text>`, '0 0 520 212');
}

export const SKETCHES = {
  coil: coilSketch, casing: casingSketch, sky: skySketch, ground: groundSketch,
  prop: propSketch, propScale: propScaleSketch, sheet: sheetSketch, tube: tubeSketch, smt: smtSketch, link: linkSketch,
  hookup: hookupSketch, terrain: terrainSketch,
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
