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

/** Пропелер — вигляд зверху, три лопаті, діаметр і крок. */
export function propSketch(inch = 10, pitch = '5.0') {
  const blade = 'M0,0 C 18,-28 36,-64 30,-96 C 27,-108 12,-112 5,-106 C -6,-88 -9,-44 0,0 Z';
  return wrap(`Пропелер ${inch}″`, `
  <g transform="translate(115,104)">
    <circle class="hair" r="98"/><circle class="dim" r="73"/>
    <g class="ln fillDim"><path d="${blade}"/><path d="${blade}" transform="rotate(120)"/><path d="${blade}" transform="rotate(240)"/></g>
    <circle class="ln2 fillDim" r="14"/><circle class="ln" r="4"/>
    <line class="hair" x1="-112" y1="0" x2="112" y2="0"/><line class="hair" x1="0" y1="-112" x2="0" y2="112"/>
    <line class="dim" x1="73" y1="0" x2="98" y2="0"/><text x="84" y="-6" text-anchor="middle">0.75R</text>
  </g>
  <line class="dim" x1="17" y1="196" x2="213" y2="196" marker-end="url(#sk-ar)"/>
  <text x="115" y="192" text-anchor="middle">Ø ${inch}″ · крок ${pitch}″ · 3 лопаті</text>`);
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
