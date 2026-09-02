/* ============================================================
   PANCORE — сторінка «Асортимент»
   групування за категоріями · пошук (назва, бренд, характеристики) ·
   фільтр за категорією · розгортання картки з тех.специфікацією ·
   запит на позицію
   ============================================================ */

import { prefillRequest, observeRise, reducedMotion } from './site.js';
import { CATEGORIES, ITEMS } from './data/catalog.js';
import { SPECS } from './data/specs.js';

const host = document.getElementById('catalog');
const chipsHost = document.getElementById('chips');
const search = document.getElementById('q');
const countEl = document.getElementById('count');

const catName = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));
const counts = {};
ITEMS.forEach((it) => { counts[it.cat] = (counts[it.cat] || 0) + 1; });

const state = { cat: 'all', q: '' };
const open = new Set();       // id розгорнутих карток — переживає перерендер
const openCats = new Set();   // id розгорнутих категорій — теж переживає перерендер

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (id) => `#${String(id).padStart(3, '0')}`;

/* --- чипи категорій --- */
function renderChips() {
  const all = `<button class="chip ${state.cat === 'all' ? 'is-on' : ''}" data-cat="all" type="button">Усі <b>${ITEMS.length}</b></button>`;
  chipsHost.innerHTML = all + CATEGORIES.map(
    (c) => `<button class="chip ${state.cat === c.id ? 'is-on' : ''}" data-cat="${c.id}" type="button">${c.name} <b>${counts[c.id] || 0}</b></button>`,
  ).join('');
}
chipsHost.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  state.cat = b.dataset.cat;
  if (state.cat !== 'all') openCats.add(state.cat);
  history.replaceState(null, '', location.pathname + location.search + (state.cat === 'all' ? '' : `#${state.cat}`));
  renderChips();
  render();
  const on = chipsHost.querySelector('.is-on');
  on && on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
});

/* --- пошук: назва, бренд, категорія, значення характеристик --- */
const norm = (s) => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[×x]/g, 'x').replace(/\s+/g, ' ');
const hayCache = new Map();
function hay(it) {
  if (!hayCache.has(it.id)) {
    const sp = SPECS[it.id];
    const extra = sp ? sp.specs.map((s) => `${s.k} ${s.v}`).join(' ') + ' ' + (sp.desc || '') : '';
    hayCache.set(it.id, norm(`${it.name} ${it.brand} ${catName[it.cat]} ${extra}`));
  }
  return hayCache.get(it.id);
}
let t = 0;
search.addEventListener('input', () => {
  clearTimeout(t);
  t = setTimeout(() => { state.q = norm(search.value.trim()); render(); }, 120);
});

function filtered() {
  return ITEMS.filter((it) => {
    if (state.cat !== 'all' && it.cat !== state.cat) return false;
    if (state.q) return state.q.split(' ').every((w) => hay(it).includes(w));
    return true;
  });
}

/* --- картка --- */
const CHEV = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6l4.5 4.5L12.5 6"/></svg>';

function itemCard(it) {
  const isOpen = open.has(it.id);
  return `
    <article class="item ${isOpen ? 'is-open' : ''}" data-id="${it.id}">
      <button class="item__head" type="button" aria-expanded="${isOpen}" aria-controls="spec-${it.id}">
        <span>
          <span class="item__top"><span>${esc(catName[it.cat])}${it.brand ? ' · ' + esc(it.brand) : ''}</span><span>${pad(it.id)}</span></span>
          <span class="item__name">${esc(it.name)}</span>
        </span>
        <span class="item__chev" aria-hidden="true">${CHEV}</span>
      </button>
      <div class="item__body" id="spec-${it.id}"><div>${isOpen ? itemBody(it) : ''}</div></div>
    </article>`;
}

function itemBody(it) {
  const sp = SPECS[it.id];
  const rows = sp && sp.specs.length
    ? sp.specs.map((s) => `<dl class="spec"><dt>${esc(s.k)}</dt><dd>${esc(s.v)}</dd></dl>`).join('')
    : '';
  const desc = sp && sp.desc ? `<p class="item__desc">${esc(sp.desc)}</p>` : '';
  const note = sp && sp.note ? `<p class="item__note">${esc(sp.note)}</p>` : '';
  const src = sp && sp.from === 'doc' && sp.src
    ? `<p class="item__src">За технічною документацією: ${esc(sp.src)}</p>`
    : `<p class="item__src">Повна специфікація та документація — за запитом</p>`;
  return `
    <div class="item__inner">
      ${desc}
      ${rows || '<p class="item__empty">Параметри уточнюємо за запитом.</p>'}
      ${note}
      ${src}
      <div class="item__foot">
        <span class="muted mono" style="font-size:11px;letter-spacing:.1em">${pad(it.id)}</span>
        <button class="btn btn--ghost btn--sm" type="button" data-req="${it.id}">Запит на позицію</button>
      </div>
    </div>`;
}

/* --- рендер --- */
function render() {
  const list = filtered();
  countEl.textContent = `${list.length} із ${ITEMS.length}`;
  if (!list.length) {
    host.innerHTML = `<p class="empty">Нічого не знайдено. Спробуйте інше слово або надішліть запит — підберемо аналог.</p>`;
    return;
  }
  const groups = new Map();
  list.forEach((it) => { if (!groups.has(it.cat)) groups.set(it.cat, []); groups.get(it.cat).push(it); });
  // під час пошуку групи розгорнуті — інакше знахідки лишились би за згорнутими вкладками
  const forceOpen = Boolean(state.q);
  host.innerHTML = CATEGORIES.filter((c) => groups.has(c.id)).map((c) => {
    const isOpen = forceOpen || openCats.has(c.id);
    return `
    <section class="cat-group rise ${isOpen ? 'is-open' : ''}" id="${c.id}">
      <button class="cat-group__head" type="button" aria-expanded="${isOpen}" aria-controls="cat-${c.id}">
        <h2 class="h-display">${c.name}</h2>
        <span>${groups.get(c.id).length} поз.</span>
        <span class="cat-group__chev" aria-hidden="true">${CHEV}</span>
      </button>
      <div class="cat-group__body" id="cat-${c.id}"><div>
        <div class="items">${groups.get(c.id).map(itemCard).join('')}</div>
      </div></div>
    </section>`;
  }).join('');
  observeRise(host);
}

/* --- розгортання та запит --- */
host.addEventListener('click', (e) => {
  const req = e.target.closest('[data-req]');
  if (req) {
    const it = ITEMS.find((x) => x.id === Number(req.dataset.req));
    if (it) prefillRequest(`${it.name} (${catName[it.cat]}, ${pad(it.id)})`);
    return;
  }
  const catHead = e.target.closest('.cat-group__head');
  if (catHead) {
    const group = catHead.closest('.cat-group');
    const willOpen = !group.classList.contains('is-open');
    group.classList.toggle('is-open', willOpen);
    catHead.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) openCats.add(group.id); else openCats.delete(group.id);
    return;
  }
  const head = e.target.closest('.item__head');
  if (!head) return;
  const card = head.closest('.item');
  const id = Number(card.dataset.id);
  const willOpen = !card.classList.contains('is-open');
  const body = card.querySelector('.item__body > div');
  if (willOpen && !body.innerHTML.trim()) {
    const it = ITEMS.find((x) => x.id === id);
    body.innerHTML = itemBody(it);
  }
  card.classList.toggle('is-open', willOpen);
  head.setAttribute('aria-expanded', String(willOpen));
  if (willOpen) open.add(id); else open.delete(id);
});

/* --- старт: категорія з хеша --- */
const hash = location.hash.slice(1);
if (hash && catName[hash]) { state.cat = hash; openCats.add(hash); }
renderChips();
render();
