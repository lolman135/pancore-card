/* ============================================================
   PANCORE — сторінка «Асортимент»
   бічна навігація · пошук по назвах і характеристиках · фільтри
   (бренд, напруга S, діапазон) · власне виробництво першим ·
   ключові параметри на картці · шухляда специфікації з адресою
   #item-NNN · порівняння до трьох позицій · запит на позицію
   ============================================================ */

import { prefillRequest, observeRise, reducedMotion } from './site.js';
import { CATEGORIES, ITEMS } from './data/catalog.js';
import { SPECS } from './data/specs.js';
import { OWN_CATEGORY, OWN_ITEMS, OWN_SPECS } from './data/own.js';

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
const CHEV_DOWN = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6l4.5 4.5L12.5 6"/></svg>';
const X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M3 3l10 10M13 3L3 13"/></svg>';

/* ---------- ключові параметри на картці: які підписи головні для категорії ---------- */
const KEY = {
  own:      [/лінійка|діаметр/i, /еталон|крок/i, /загасання|кут атаки/i],
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
  renderNav(); renderFilters(); render();
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
  renderFilters(); render();
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

/* ---------- картка ---------- */
function itemCard(it) {
  const kv = keyParams(it).map((s) => `<i>${esc(s.k)}</i> ${esc(short(s.v))}`).join(' · ');
  const own = it.own ? '<span class="own-badge">PANCORE</span>' : esc(catName[it.cat]) + (it.brand ? ' · ' + esc(it.brand) : '');
  return `
    <article class="item ${it.own ? 'item--own' : ''} ${state.compare.has(it.id) ? 'is-cmp' : ''}" data-id="${it.id}">
      <button class="item__head" type="button" data-open="${it.id}" aria-haspopup="dialog">
        <span>
          <span class="item__top"><span>${own}</span><span>${pad(it.id)}</span></span>
          <span class="item__name">${esc(it.name)}</span>
          ${kv ? `<span class="item__kv">${kv}</span>` : ''}
        </span>
        <span class="item__chev" aria-hidden="true">${CHEV}</span>
      </button>
      <div class="item__foot">
        <button class="item__cmp ${state.compare.has(it.id) ? 'is-on' : ''}" type="button" data-cmp="${it.id}">Порівняти</button>
        <button class="item__req" type="button" data-req="${it.id}">Запит →</button>
      </div>
    </article>`;
}

/* ---------- рендер списку ---------- */
function render() {
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
  const req = e.target.closest('[data-req]');
  if (req) { requestItem(Number(req.dataset.req)); return; }
  const cmp = e.target.closest('[data-cmp]');
  if (cmp) { toggleCompare(Number(cmp.dataset.cmp)); return; }
  const open = e.target.closest('[data-open]');
  if (open) openItem(Number(open.dataset.open));
});

function requestItem(id) {
  const it = byId[id];
  if (it) prefillRequest(`${it.name} (${catName[it.cat]}, ${pad(it.id)})`);
}

/* ---------- шухляда специфікації ---------- */
function specTable(sp) {
  return sp && sp.specs.length ? sp.specs.map((s) => `<dl class="spec"><dt>${esc(s.k)}</dt><dd>${esc(s.v)}</dd></dl>`).join('') : '<p class="item__empty">Параметри уточнюємо за запитом.</p>';
}
function openItem(id) {
  const it = byId[id]; if (!it) return;
  const sp = SPEC[id];
  state.openId = id;
  drawer.classList.remove('drawer--cmp');
  drawer.innerHTML = `
    <div class="drawer__back" data-close></div>
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="dr-title">
      <div class="drawer__head">
        <div>
          <div class="item__top"><span>${it.own ? '<span class="own-badge">PANCORE</span>' : esc(catName[it.cat]) + (it.brand ? ' · ' + esc(it.brand) : '')}</span><span>${pad(id)}</span></div>
          <h2 id="dr-title">${esc(it.name)}</h2>
        </div>
        <button class="drawer__x" type="button" data-close aria-label="Закрити">${X}</button>
      </div>
      <div class="drawer__body">
        ${sp && sp.desc ? `<p class="item__desc">${esc(sp.desc)}</p>` : ''}
        ${specTable(sp)}
        ${sp && sp.note ? `<p class="item__note">${esc(sp.note)}</p>` : ''}
        <p class="item__src">${sp && sp.from === 'doc' && sp.src ? 'За технічною документацією: ' + esc(sp.src) : 'Повна специфікація та документація — за запитом'}</p>
      </div>
      <div class="drawer__foot">
        <button class="btn btn--primary btn--sm" type="button" data-req="${id}">Запит на позицію</button>
        <button class="btn btn--ghost btn--sm" type="button" data-copy="${id}">Скопіювати</button>
        <button class="btn btn--ghost btn--sm" type="button" data-cmp="${id}">${state.compare.has(id) ? 'У порівнянні ✓' : 'Порівняти'}</button>
        <span class="drawer__ok" id="dr-ok"></span>
      </div>
    </div>`;
  drawer.hidden = false;
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', `${location.pathname}${location.search}#item-${String(id).padStart(3, '0')}`);
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
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

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
  drawer.classList.add('drawer--cmp');
  drawer.innerHTML = `
    <div class="drawer__back" data-close></div>
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Порівняння">
      <div class="drawer__head"><div><div class="item__top"><span>Порівняння</span><span>${items.length} поз.</span></div><h2>Параметри поруч</h2></div><button class="drawer__x" type="button" data-close aria-label="Закрити">${X}</button></div>
      <div class="drawer__body"><div class="cmp-wrap"><table class="cmp-table">
        <thead><tr><th></th>${items.map((it) => `<th>${esc(it.name)}<br><span class="muted mono" style="font-size:10px">${pad(it.id)}</span></th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody></table></div>
        <p class="item__src">Підсвічено рядки, де значення відрізняються.</p></div>
      <div class="drawer__foot">${items.map((it) => `<button class="btn btn--ghost btn--sm" type="button" data-req="${it.id}">Запит ${pad(it.id)}</button>`).join('')}</div>
    </div>`;
  drawer.hidden = false; document.body.style.overflow = 'hidden';
  history.replaceState(null, '', `${location.pathname}${location.search}#compare`);
}

/* ---------- старт: категорія або позиція з хеша ---------- */
const h = location.hash.slice(1);
const m = /^item-(\d+)$/.exec(h);
if (h && catName[h]) { state.cat = h; openCats.add(h); }
renderNav(); renderFilters(); render(); renderBar();
if (m && byId[Number(m[1])]) openItem(Number(m[1]));
