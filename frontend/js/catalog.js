/* ============================================================
   PANCORE — сторінка «Асортимент»
   бічна навігація · пошук по назвах і характеристиках · фільтри
   (бренд, напруга S, діапазон) · власне виробництво першим ·
   чисті картки (іконка категорії, назва, один ключовий параметр) ·
   вікно позиції з ключовими фактами, ескізом для власних виробів,
   переходом попередня/наступна, адресою #item-NNN · порівняння до трьох
   ============================================================ */

import { prefillRequest, observeRise, reducedMotion, swapIn } from './site.js';
import { CATEGORIES, ITEMS } from './data/catalog.js';
import { SPECS } from './data/specs.js';
import { OWN_CATEGORY, OWN_ITEMS, OWN_SPECS } from './data/own.js';
import { coilSketch, propSketch } from './sketches.js';

const CATS = [OWN_CATEGORY, ...CATEGORIES];
const ALL = [...OWN_ITEMS, ...ITEMS];
const SPEC = { ...SPECS, ...OWN_SPECS };
const catName = Object.fromEntries(CATS.map((c) => [c.id, c.name]));
const byId = Object.fromEntries(ALL.map((it) => [it.id, it]));
const counts = {};
ALL.forEach((it) => { counts[it.cat] = (counts[it.cat] || 0) + 1; });

const host = document.getElementById('catalog-list');
const navHost = document.getElementById('cat-nav');
const chipsHost = document.getElementById('chips');
const filtersHost = document.getElementById('filters');
const search = document.getElementById('q');
const countEl = document.getElementById('count');
const drawer = document.getElementById('drawer');
const cmpBar = document.getElementById('cmp-bar');

const LIMIT = 6;          // позицій у категорії в режимі «Усі» до кнопки «Показати ще»
const CMP_MAX = 3;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (id) => `#${String(id).padStart(3, '0')}`;
const CHEV = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5L10.5 8 6 12.5"/></svg>';
const CHEV_L = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5L5.5 8 10 12.5"/></svg>';
const CHEV_DOWN = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6l4.5 4.5L12.5 6"/></svg>';
const X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M3 3l10 10M13 3L3 13"/></svg>';

/* ---------- іконки категорій (лінійні, 24×24) ---------- */
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  coil:   I('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2.5"/><path d="M20.5 12h2"/>'),
  /* пропелер: три суцільні лопаті з легким серпоподібним профілем і ступиця-кільце — читається і на 22 px, і на 120 px */
  prop:   I('<g fill="currentColor" stroke="none"><path d="M12 12C9.1 9.9 8.4 5.6 10.1 2.9c.9-1.4 2.7-1.4 3.6-.1 1.4 2.2 1.1 5.9-1.7 9.2z"/><path d="M12 12C9.1 9.9 8.4 5.6 10.1 2.9c.9-1.4 2.7-1.4 3.6-.1 1.4 2.2 1.1 5.9-1.7 9.2z" transform="rotate(120 12 12)"/><path d="M12 12C9.1 9.9 8.4 5.6 10.1 2.9c.9-1.4 2.7-1.4 3.6-.1 1.4 2.2 1.1 5.9-1.7 9.2z" transform="rotate(240 12 12)"/></g><circle cx="12" cy="12" r="2.7" fill="var(--bg-2, #0c0e13)" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none"/>'),
  motors: I('<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 4.5V2M12 22v-2.5M4.5 12H2M22 12h-2.5M6.7 6.7L5 5M19 19l-1.7-1.7M17.3 6.7L19 5M5 19l1.7-1.7"/>'),
  esc:    I('<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M13 8l-3 4.5h4L11 17"/>'),
  fc:     I('<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3"/><circle cx="12" cy="12" r="1.5"/>'),
  pdb:    I('<rect x="5" y="9" width="14" height="6" rx="1"/><path d="M12 9V4M12 20v-5M5 12H2M22 12h-3M8 4h8"/>'),
  vtx:    I('<path d="M12 21V10"/><circle cx="12" cy="8.5" r="1.5"/><path d="M8.5 5a5 5 0 0 1 7 0M6 2.5a8.5 8.5 0 0 1 12 0"/><path d="M8 21h8"/>'),
  vrx:    I('<rect x="3" y="7" width="14" height="10" rx="1.5"/><path d="M7 20h6M10 17v3"/><path d="M19 8.5a4 4 0 0 1 0 6M21.5 6a7.5 7.5 0 0 1 0 11"/>'),
  rx:     I('<rect x="4" y="12" width="16" height="7" rx="1.5"/><path d="M8 12V6M8 6l4-3M16 12V8"/><circle cx="16" cy="15.5" r="1"/>'),
  tx:     I('<rect x="3" y="9" width="18" height="9" rx="2"/><circle cx="8" cy="13.5" r="1.8"/><circle cx="16" cy="13.5" r="1.8"/><path d="M6 9V4M18 9V6"/>'),
  ant:    I('<path d="M12 21V9M12 9l-5-6M12 9l5-6M12 9l-2.5-6M12 9l2.5-6"/><circle cx="12" cy="9" r="1.5"/>'),
  cam:    I('<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2.5h5L16 7"/>'),
  optic:  I('<rect x="2" y="7.5" width="7" height="9" rx="1.5"/><rect x="15" y="7.5" width="7" height="9" rx="1.5"/><path d="M9 12h6"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><path d="M4.5 10.5v3M19.5 10.5v3M5.5 4.5v3M18.5 16.5v3"/>'),
  fiber:  I('<path d="M4 12a8 8 0 1 1 8 8"/><path d="M7 12a5 5 0 1 1 5 5"/><circle cx="12" cy="12" r="1.5"/>'),
  carbon: I('<path d="M3 15l7-4 11 4-7 4z"/><path d="M3 11l7-4 11 4M3 7l7-4 11 4"/>'),
  get props() { return this.prop; },
  frames: I('<rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 9L3.5 3.5M15 9l5.5-5.5M9 15l-5.5 5.5M15 15l5.5 5.5"/><circle cx="3.5" cy="3.5" r="1.5"/><circle cx="20.5" cy="3.5" r="1.5"/><circle cx="3.5" cy="20.5" r="1.5"/><circle cx="20.5" cy="20.5" r="1.5"/>'),
  ice:    I('<rect x="6" y="9" width="12" height="11" rx="1.5"/><path d="M9 9V5h6v4M12 5V2M6 14H3M21 14h-3"/>'),
  jet:    I('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2"/><path d="M12 10V4.5M13.8 11l4.7-2.8M13.8 13l4.7 2.8M12 14v5.5M10.2 13l-4.7 2.8M10.2 11L5.5 8.2"/>'),
  other:  I('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9"/>'),
};
const iconOf = (it) => (it.id === 901 ? ICONS.coil : it.own ? ICONS.prop : ICONS[it.cat] || ICONS.other);

/* ---------- ключові параметри: які підписи головні для категорії ---------- */
const KEY = {
  own:      [/стандартні|діаметр$/i, /еталон|крок/i, /загасання|кут атаки/i],
  motors:   [/^kv/i, /струм/i, /^маса/i],
  esc:      [/струм/i, /акумулятор|напруга|живлення/i, /прошивка|конфігурація/i],
  fc:       [/мікроконтролер/i, /напруга/i, /uart/i],
  pdb:      [/струм на канал/i, /канали/i, /напруга/i],
  vtx:      [/діапазон/i, /потужність/i, /маса|напруга/i],
  vrx:      [/діапазон/i, /тип/i],
  rx:       [/частот|діапазон/i, /антени/i, /протокол/i],
  tx:       [/діапазони/i, /протокол/i, /тип/i],
  ant:      [/діапазон/i, /довжина/i, /поляризація/i],
  cam:      [/роздільна/i, /сенсор/i, /маса|відео/i],
  optic:    [/довжина хвилі|живлення/i, /дальність/i, /маса/i],
  fiber:    [/довжина відрізка/i, /загасання/i, /покриття/i],
  carbon:   [/формат|зовнішній/i, /товщина|довжина/i, /матеріал/i],
  props:    [/діаметр/i, /крок/i, /лопаті|напрям/i],
  frames:   [/пропелер/i, /матеріал/i, /виробник/i],
  ice:      [/потужність/i, /об'єм/i, /^маса/i],
  jet:      [/тяга/i, /тип/i],
};
function keyParams(it) {
  const sp = SPEC[it.id];
  if (!sp || !sp.specs.length) return [];
  const pats = KEY[it.cat];
  if (!pats) return sp.specs.slice(0, 3);
  const out = [];
  pats.forEach((re) => { const s = sp.specs.find((x) => re.test(x.k) && !out.includes(x)); if (s) out.push(s); });
  return out.length ? out : sp.specs.slice(0, 3);
}
const short = (v, n = 34) => (v.length > n ? v.slice(0, n - 1).replace(/[\s·,;:]+\S*$/, '') + '…' : v);
/* стисле значення для картки і плиток фактів: перший фрагмент до « · », без дужок — «900 KV», «20 і 30 км» */
const brief = (v, n = 28) => short(v.split(' · ')[0].replace(/\s*\([^)]*\)/g, '').trim(), n);
const DOC = { yes: 'Документація виробника', analog: 'Аналог за запитом' };

/* ---------- коротка назва на картці: повна лишається у вікні позиції ---------- */
const NAMES = { 901: 'Безшпульний звій SFC-K · 5–60 км', 902: 'Пропелер 10 дюймів', 903: 'Пропелер 15 дюймів' };
const METAS = { 901: 'PANCORE · еталон SFC-30 · 30,212 км', 902: 'PANCORE · 10 × 5,0 × 3', 903: 'PANCORE · 15 × 10 × 3' };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
const INCH = /^(Пропелер|Рама)\s+(\d{1,2})["″]\s*([^—(]*)/;
function shortName(it) {
  if (NAMES[it.id]) return NAMES[it.id];
  let n = it.name.replace(/\s*\([^)]*\)/g, '').replace(/\s*:\s+/g, ' ');
  const inch = INCH.exec(n);
  if (inch) return `${inch[1]} ${inch[2]} дюймів`;
  let [head, tail] = n.split(/\s+—\s+/);
  if (it.brand && tail && head.trim().toLowerCase() === it.brand.toLowerCase()) head = tail;   // «Opticallink — медіаконвертер…»
  if (it.brand) head = head.replace(new RegExp(`\\s+${reEsc(it.brand)}$`, 'i'), '');              // бренд у кінці → у мета-рядок
  return short(cap(head.replace(/,\s+/g, ' · ').trim()), 46);
}
function cardMeta(it) {
  if (METAS[it.id]) return METAS[it.id];
  const parts = it.brand ? [esc(it.brand)] : [];
  const inch = INCH.exec(it.name);
  if (inch) {   // пропелери та рами: модель замість параметра
    const model = it.brand ? inch[3].replace(new RegExp(reEsc(it.brand), 'i'), '').replace(/\s+/g, ' ').trim() : inch[3].trim();
    if (model) parts.push(`<b>${esc(model)}</b>`);
    return parts.join(' · ');
  }
  // перший параметр, який не повторює назву (у сервоприводів і платформ «Модель» = назва)
  const nm = norm(it.name);
  const k = keyParams(it).find((s) => !/модель|назва|позиц/i.test(s.k) && !nm.includes(norm(brief(s.v))));
  if (k) parts.push(`<b>${esc(brief(k.v))}</b>`);
  return parts.join(' · ') || esc(catName[it.cat]);
}

/* ---------- фільтри: бренд, напруга S, діапазон ---------- */
const S_RE = /(\d{1,2})S\b/g;
const BAND_RE = /(\d+(?:[.,]\d)?) ?(?:G\b|ГГц)/g;
const BAND_CATS = new Set(['vtx', 'vrx', 'rx', 'tx', 'ant']);
function tokens(it, kind) {
  const sp = SPEC[it.id]; const set = new Set();
  if (!sp) return set;
  sp.specs.forEach(({ k, v }) => {
    if (kind === 's' && /напруг|акумул|живлен|струм/i.test(k)) for (const m of v.matchAll(S_RE)) set.add(m[1] + 'S');
    if (kind === 'band') for (const m of v.matchAll(BAND_RE)) set.add(m[1].replace('.', ',') + ' ГГц');
  });
  return set;
}

/* ---------- стан ---------- */
const state = { cat: 'all', q: '', brand: '', s: '', band: '', expanded: new Set(), compare: new Set(), openId: null };
/* на телефоні (без бічної навігації) категорії — згорнуті вкладки; власне виробництво відкрите одразу */
const mobileMQ = matchMedia('(max-width: 1100px)');
const openCats = new Set(['own']);

/* ---------- бічна навігація та чипи ---------- */
function renderNav() {
  const row = (id, name, n, own) => `<button type="button" data-cat="${id}" class="${state.cat === id ? 'is-on' : ''} ${own ? 'is-own' : ''}"><span>${name}</span><b>${n}</b></button>`;
  navHost.innerHTML = row('all', 'Усі позиції', ALL.length) + CATS.map((c) => row(c.id, c.name, counts[c.id] || 0, c.id === 'own')).join('');
  chipsHost.innerHTML = `<button class="chip ${state.cat === 'all' ? 'is-on' : ''}" data-cat="all" type="button">Усі <b>${ALL.length}</b></button>` +
    CATS.map((c) => `<button class="chip ${state.cat === c.id ? 'is-on' : ''}" data-cat="${c.id}" type="button">${c.name} <b>${counts[c.id] || 0}</b></button>`).join('');
}
function setCat(id) {
  state.cat = id; state.brand = ''; state.s = ''; state.band = '';
  if (id !== 'all') openCats.add(id);
  history.replaceState(null, '', location.pathname + location.search + (id === 'all' ? '' : `#${id}`));
  renderNav(); renderFilters(); render(true);
  const on = chipsHost.querySelector('.is-on');
  on && on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
  const top = document.querySelector('.toolbar--cat');
  if (top && scrollY > top.offsetTop) scrollTo({ top: top.offsetTop - 70, behavior: reducedMotion ? 'auto' : 'smooth' });
}
[navHost, chipsHost].forEach((h) => h.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]'); if (b) setCat(b.dataset.cat);
}));

function renderFilters() {
  if (state.cat === 'all') { filtersHost.hidden = true; filtersHost.innerHTML = ''; return; }
  const items = ALL.filter((it) => it.cat === state.cat);
  const brands = [...new Set(items.map((it) => it.brand).filter(Boolean))].sort();
  const sVals = [...new Set(items.flatMap((it) => [...tokens(it, 's')]))].sort((a, b) => parseInt(a) - parseInt(b));
  const bands = BAND_CATS.has(state.cat) ? [...new Set(items.flatMap((it) => [...tokens(it, 'band')]))].sort((a, b) => parseFloat(a.replace(',', '.')) - parseFloat(b.replace(',', '.'))) : [];
  const group = (lab, key, vals) => vals.length < 2 ? '' : `<span class="lab">${lab}</span><span class="chips">${vals.map((v) => `<button type="button" class="chip ${state[key] === v ? 'is-on' : ''}" data-f="${key}" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</span>`;
  const html = group('Бренд', 'brand', brands) + group('Акумулятор', 's', sVals) + group('Діапазон', 'band', bands);
  filtersHost.innerHTML = html;
  filtersHost.hidden = !html;
}
filtersHost.addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]'); if (!b) return;
  state[b.dataset.f] = state[b.dataset.f] === b.dataset.v ? '' : b.dataset.v;
  renderFilters(); render(true);
});

/* ---------- пошук ---------- */
const norm = (s) => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[×x]/g, 'x').replace(/\s+/g, ' ');
const hayCache = new Map();
function hay(it) {
  if (!hayCache.has(it.id)) {
    const sp = SPEC[it.id];
    const extra = sp ? sp.specs.map((s) => `${s.k} ${s.v}`).join(' ') + ' ' + (sp.desc || '') : '';
    hayCache.set(it.id, norm(`${it.name} ${it.brand} ${catName[it.cat]} ${extra}`));
  }
  return hayCache.get(it.id);
}
let t = 0;
search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = norm(search.value.trim()); render(); }, 120); });

function filtered() {
  return ALL.filter((it) => {
    if (state.cat !== 'all' && it.cat !== state.cat) return false;
    if (state.brand && it.brand !== state.brand) return false;
    if (state.s && !tokens(it, 's').has(state.s)) return false;
    if (state.band && !tokens(it, 'band').has(state.band)) return false;
    if (state.q) return state.q.split(' ').every((w) => hay(it).includes(w));
    return true;
  });
}

/* ---------- зведення по категорії: бренди + діапазон головного параметра ---------- */
function summary(cat, items) {
  const brands = [...new Set(items.map((it) => it.brand).filter(Boolean))];
  const parts = [];
  const pats = KEY[cat];
  if (pats && cat !== 'own') {   // у власних виробах різні головні параметри (км і дюйми) — діапазон не має сенсу
    const found = items.map((it) => { const sp = SPEC[it.id]; return sp && sp.specs.find((x) => pats[0].test(x.k)); }).filter(Boolean);
    const nums = found.map((s) => parseFloat((s.v.match(/\d+(?:[.,]\d+)?/) || [''])[0].replace(',', '.'))).filter((n) => !Number.isNaN(n));
    if (nums.length >= 3 && Math.min(...nums) !== Math.max(...nums)) {
      const unit = (found.map((s) => s.v).join(' ').match(/\b(KV|ГГц|МГц|А|В|кг|г|мм|км|к\.с\.|kgf|см³|TVL)\b/) || [''])[0];
      const f = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
      parts.push(`<b>${esc(found[0].k.toLowerCase())}</b> ${f(Math.min(...nums))}…${f(Math.max(...nums))} ${unit}`);
    }
  }
  if (brands.length) parts.push(`<b>бренди</b> ${brands.slice(0, 4).map(esc).join(', ')}${brands.length > 4 ? ' та ін.' : ''}`);
  return parts.join(' · ');
}

/* ---------- картка: іконка, назва, один ключовий параметр ---------- */
function itemCard(it) {
  return `
    <article class="item ${it.own ? 'item--own' : ''} ${state.compare.has(it.id) ? 'is-cmp' : ''}" data-id="${it.id}">
      <button class="item__head" type="button" data-open="${it.id}" aria-haspopup="dialog" title="${esc(it.name)}">
        <span class="item__ico" aria-hidden="true">${iconOf(it)}</span>
        <span class="item__txt">
          <span class="item__name">${esc(shortName(it))}</span>
          <span class="item__meta">${cardMeta(it)}</span>
        </span>
        <span class="item__chev" aria-hidden="true">${CHEV}</span>
      </button>
      <div class="item__foot">
        <span class="item__id">${pad(it.id)}</span>
        <button class="item__cmp ${state.compare.has(it.id) ? 'is-on' : ''}" type="button" data-cmp="${it.id}">Порівняти</button>
      </div>
    </article>`;
}

/* ---------- рендер списку (animate — плавна поява після зміни категорії чи фільтра) ---------- */
function render(animate = false) {
  if (animate) swapIn(host);
  const list = filtered();
  countEl.textContent = `${list.length} із ${ALL.length}`;
  if (!list.length) {
    const near = state.q ? CATS.find((c) => norm(c.name).includes(state.q.split(' ')[0])) : null;
    host.innerHTML = `<div class="empty"><p>Нічого не знайдено за «${esc(search.value)}».</p>
      ${near ? `<p style="margin-top:8px">Спробуйте категорію <button class="chip" type="button" data-cat="${near.id}">${near.name}</button></p>` : ''}
      <button class="btn btn--ghost btn--sm" type="button" data-req-q="1">Запит на «${esc(search.value)}» →</button></div>`;
    return;
  }
  const single = state.cat !== 'all' || Boolean(state.q);
  const groups = new Map();
  list.forEach((it) => { if (!groups.has(it.cat)) groups.set(it.cat, []); groups.get(it.cat).push(it); });
  host.innerHTML = CATS.filter((c) => groups.has(c.id)).map((c) => {
    const all = groups.get(c.id);
    const show = single || state.expanded.has(c.id) ? all : all.slice(0, LIMIT);
    const rest = all.length - show.length;
    // десктоп: завжди розгорнуто; телефон: вкладка відкрита, якщо обрана категорія, пошук або її розгорнули
    const isOpen = !mobileMQ.matches || single || openCats.has(c.id);
    return `
    <section class="cat-group ${c.id === 'own' ? 'cat-group--own' : ''} ${isOpen ? 'is-open' : ''} rise" id="${c.id}">
      <div class="cat-group__head">
        <h2 class="h-display"><button type="button" class="cat-group__btn" aria-expanded="${isOpen}" aria-controls="cat-${c.id}">${c.name}<span class="cnt">${all.length} поз.</span><span class="cat-group__chev" aria-hidden="true">${CHEV_DOWN}</span></button></h2>
        <p class="cat-sum">${summary(c.id, all)}</p>
      </div>
      <div class="cat-group__body" id="cat-${c.id}"><div>
        <div class="items">${show.map(itemCard).join('')}</div>
        ${rest > 0 ? `<button class="more" type="button" data-more="${c.id}">Показати ще ${rest}</button>` : ''}
      </div></div>
    </section>`;
  }).join('');
  observeRise(host);
}
mobileMQ.addEventListener('change', render);

host.addEventListener('click', (e) => {
  const tab = e.target.closest('.cat-group__btn');
  if (tab) {
    if (!mobileMQ.matches) return;
    const g = tab.closest('.cat-group'); const on = !g.classList.contains('is-open');
    g.classList.toggle('is-open', on); tab.setAttribute('aria-expanded', String(on));
    if (on) openCats.add(g.id); else openCats.delete(g.id);
    return;
  }
  const more = e.target.closest('[data-more]');
  if (more) { state.expanded.add(more.dataset.more); render(); return; }
  const cat = e.target.closest('[data-cat]');
  if (cat) { setCat(cat.dataset.cat); return; }
  const rq = e.target.closest('[data-req-q]');
  if (rq) { prefillRequest(search.value.trim()); return; }
  const cmp = e.target.closest('[data-cmp]');
  if (cmp) { toggleCompare(Number(cmp.dataset.cmp)); return; }
  const open = e.target.closest('[data-open]');
  if (open) openItem(Number(open.dataset.open));
});

function requestItem(id) {
  const it = byId[id];
  if (it) prefillRequest(`${it.name} (${catName[it.cat]}, ${pad(it.id)})`);
}

/* ---------- вікно позиції ---------- */
function specRows(sp, keys) {
  if (!sp || !sp.specs.length) return '<p class="item__empty">Параметри уточнюємо за запитом.</p>';
  return `<div class="specs-tbl">${sp.specs.map((s) => `<dl class="spec ${keys.includes(s) ? 'is-key' : ''}"><dt>${esc(s.k)}</dt><dd>${esc(s.v)}</dd></dl>`).join('')}</div>`;
}
/* ескіз для власних виробів, велика іконка категорії для решти */
function heroArt(it) {
  if (it.id === 901) return `<div class="drawer__sk">${coilSketch()}</div>`;
  if (it.id === 902 || it.id === 903) return `<div class="drawer__sk drawer__sk--prop">${propSketch(it.id === 902 ? 10 : 15)}</div>`;
  return `<div class="drawer__glyph">${iconOf(it)}</div>`;
}
function openItem(id) {
  const it = byId[id]; if (!it) return;
  const sp = SPEC[id];
  const keys = keyParams(it);
  const list = filtered();
  const pos = list.findIndex((x) => x.id === id);
  const prev = pos > 0 ? list[pos - 1] : null, next = pos >= 0 && pos < list.length - 1 ? list[pos + 1] : null;
  const wasOpen = !drawer.hidden;   // перехід між позиціями: панель не виїжджає знову, а плавно змінює вміст
  state.openId = id;
  drawer.classList.remove('drawer--cmp');
  drawer.innerHTML = `
    <div class="drawer__back" data-close></div>
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="dr-title">
      <div class="drawer__hero ${it.own ? 'drawer__hero--own' : ''}">
        <div class="drawer__bar">
          <div class="drawer__nav">
            <button type="button" data-go="${prev ? prev.id : ''}" ${prev ? '' : 'disabled'} aria-label="Попередня позиція">${CHEV_L}</button>
            <span>${pos + 1} / ${list.length}</span>
            <button type="button" data-go="${next ? next.id : ''}" ${next ? '' : 'disabled'} aria-label="Наступна позиція">${CHEV}</button>
          </div>
          <button class="drawer__x" type="button" data-close aria-label="Закрити">${X}</button>
        </div>
        ${heroArt(it)}
        <div class="drawer__meta">${it.own ? '<span class="own-badge">PANCORE</span>' : `<span>${esc(catName[it.cat])}</span>`}${it.brand && !it.own ? `<span>${esc(it.brand)}</span>` : ''}<span class="mono">${pad(id)}</span></div>
        <h2 id="dr-title">${esc(it.name)}</h2>
        <div class="drawer__chips">${DOC[it.doc] ? `<span class="chip chip--doc">${DOC[it.doc]}</span>` : ''}${it.own ? '<span class="chip">Made in EU</span>' : ''}</div>
      </div>
      <div class="drawer__body">
        ${keys.length ? `<div class="facts">${keys.slice(0, 3).map((s) => `<div class="fact"><b>${esc(brief(s.v, 34))}</b><span>${esc(s.k)}</span></div>`).join('')}</div>` : ''}
        ${sp && sp.desc ? `<p class="item__desc">${esc(sp.desc)}</p>` : ''}
        <p class="drawer__h">Характеристики</p>
        ${specRows(sp, keys)}
        ${sp && sp.note ? `<p class="item__note">${esc(sp.note)}</p>` : ''}
        <p class="item__src">${sp && sp.from === 'doc' && sp.src ? 'За технічною документацією: ' + esc(sp.src) : 'Повна специфікація та документація — за запитом'}</p>
      </div>
      <div class="drawer__foot">
        <button class="btn btn--primary btn--sm" type="button" data-req="${id}">Запит на позицію</button>
        <button class="btn btn--ghost btn--sm" type="button" data-copy="${id}">Скопіювати</button>
        <button class="btn btn--ghost btn--sm" type="button" data-print>PDF</button>
        <button class="btn btn--ghost btn--sm" type="button" data-cmp="${id}">${state.compare.has(id) ? 'У порівнянні ✓' : 'Порівняти'}</button>
        <span class="drawer__ok" id="dr-ok"></span>
      </div>
    </div>`;
  drawer.hidden = false;
  if (wasOpen) swapIn(drawer.querySelector('.drawer__panel'));
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', `${location.pathname}${location.search}#item-${String(id).padStart(3, '0')}`);
  drawer.querySelector('.drawer__body').scrollTop = 0;
  drawer.querySelector('.drawer__x').focus();
}
function closeDrawer() {
  if (drawer.hidden) return;
  drawer.hidden = true; state.openId = null;
  document.body.style.overflow = '';
  if (/^#item-|^#compare/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search + (state.cat === 'all' ? '' : `#${state.cat}`));
}
drawer.addEventListener('click', async (e) => {
  if (e.target.closest('[data-close]')) { closeDrawer(); return; }
  const go = e.target.closest('[data-go]');
  if (go) { if (go.dataset.go) openItem(Number(go.dataset.go)); return; }
  if (e.target.closest('[data-print]')) {
    // PDF = друк у файл: у @media print видно лише панель специфікації (pages.css, body.is-printing)
    document.body.classList.add('is-printing');
    window.print();
    return;
  }
  const req = e.target.closest('[data-req]');
  if (req) { const id = Number(req.dataset.req); closeDrawer(); requestItem(id); return; }
  const cmp = e.target.closest('[data-cmp]');
  if (cmp) { const id = Number(cmp.dataset.cmp); toggleCompare(id); cmp.textContent = state.compare.has(id) ? 'У порівнянні ✓' : 'Порівняти'; return; }
  const cp = e.target.closest('[data-copy]');
  if (cp) {
    const it = byId[Number(cp.dataset.copy)]; const sp = SPEC[it.id];
    const text = [it.name, ...(sp ? sp.specs.map((s) => `${s.k}: ${s.v}`) : []), `PANCORE · ${location.origin}${location.pathname}#item-${String(it.id).padStart(3, '0')}`].join('\n');
    try { await navigator.clipboard.writeText(text); drawer.querySelector('#dr-ok').textContent = 'Скопійовано у буфер'; }
    catch { drawer.querySelector('#dr-ok').textContent = 'Не вдалося скопіювати'; }
  }
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeDrawer(); return; }
  if (drawer.hidden || state.openId == null || /input|textarea/i.test(document.activeElement?.tagName || '')) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    const b = drawer.querySelector(`[data-go]:${e.key === 'ArrowLeft' ? 'first' : 'last'}-of-type`);
    if (b && b.dataset.go) openItem(Number(b.dataset.go));
  }
});

/* ---------- порівняння ---------- */
function toggleCompare(id) {
  if (state.compare.has(id)) state.compare.delete(id);
  else if (state.compare.size >= CMP_MAX) { flashBar(`Максимум ${CMP_MAX} позиції`); return; }
  else state.compare.add(id);
  renderBar(); render();
}
let flashT = 0;
function flashBar(msg) { renderBar(msg); clearTimeout(flashT); flashT = setTimeout(() => renderBar(), 1800); }
function renderBar(msg) {
  const n = state.compare.size;
  cmpBar.hidden = n === 0;
  if (!n) return;
  cmpBar.innerHTML = msg ? `<span>${esc(msg)}</span>` : `<span>Обрано ${n} із ${CMP_MAX}</span>
    <button class="btn btn--primary btn--sm" type="button" data-cmp-open ${n < 2 ? 'disabled' : ''}>Порівняти</button>
    <button class="x" type="button" data-cmp-clear aria-label="Очистити">${X}</button>`;
}
cmpBar.addEventListener('click', (e) => {
  if (e.target.closest('[data-cmp-clear]')) { state.compare.clear(); renderBar(); render(); return; }
  if (e.target.closest('[data-cmp-open]')) openCompare();
});
function openCompare() {
  const items = [...state.compare].map((id) => byId[id]);
  const labels = [];
  items.forEach((it) => (SPEC[it.id] ? SPEC[it.id].specs : []).forEach((s) => { const k = s.k.trim(); if (!labels.some((l) => l.toLowerCase() === k.toLowerCase())) labels.push(k); }));
  const cell = (it, k) => { const sp = SPEC[it.id]; const s = sp && sp.specs.find((x) => x.k.trim().toLowerCase() === k.toLowerCase()); return s ? esc(s.v) : '<span class="muted">—</span>'; };
  const rows = labels.map((k) => {
    const vals = items.map((it) => cell(it, k));
    const differ = new Set(vals).size > 1;
    return `<tr><th>${esc(k)}</th>${vals.map((v) => `<td class="${differ ? 'diff' : ''}">${v}</td>`).join('')}</tr>`;
  }).join('');
  state.openId = null;
  drawer.classList.add('drawer--cmp');
  drawer.innerHTML = `
    <div class="drawer__back" data-close></div>
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Порівняння">
      <div class="drawer__hero drawer__hero--cmp">
        <div class="drawer__bar"><span class="drawer__meta"><span>Порівняння</span><span class="mono">${items.length} поз.</span></span><button class="drawer__x" type="button" data-close aria-label="Закрити">${X}</button></div>
        <h2>Параметри поруч</h2>
      </div>
      <div class="drawer__body"><div class="cmp-wrap"><table class="cmp-table">
        <thead><tr><th></th>${items.map((it) => `<th>${esc(it.name)}<br><span class="muted mono" style="font-size:10px">${pad(it.id)}</span></th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody></table></div>
        <p class="item__src">Підсвічено рядки, де значення відрізняються.</p></div>
      <div class="drawer__foot">${items.map((it) => `<button class="btn btn--ghost btn--sm" type="button" data-req="${it.id}">Запит ${pad(it.id)}</button>`).join('')}</div>
    </div>`;
  drawer.hidden = false; document.body.style.overflow = 'hidden';
  history.replaceState(null, '', `${location.pathname}${location.search}#compare`);
}

addEventListener('afterprint', () => document.body.classList.remove('is-printing'));

/* ---------- старт: пошук із шапки (?q=), категорія або позиція з хеша ---------- */
const qp = (new URLSearchParams(location.search).get('q') || '').trim();
if (qp) { search.value = qp; state.q = norm(qp); }
const h = location.hash.slice(1);
const m = /^item-(\d+)$/.exec(h);
if (h && catName[h]) { state.cat = h; openCats.add(h); }
renderNav(); renderFilters(); render(); renderBar();
if (m && byId[Number(m[1])]) openItem(Number(m[1]));
