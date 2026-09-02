/* ============================================================
   PANCORE — сторінка «Асортимент»
   групування за категоріями · пошук · фільтр за категорією ·
   перемикач «тільки з документацією» · запит на позицію
   ============================================================ */

import { prefillRequest, observeRise, reducedMotion } from './site.js';
import { CATEGORIES, ITEMS } from './data/catalog.js';

const host = document.getElementById('catalog');
const chipsHost = document.getElementById('chips');
const search = document.getElementById('q');
const docToggle = document.getElementById('doc-only');
const countEl = document.getElementById('count');

const catName = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));
const counts = {};
ITEMS.forEach((it) => { counts[it.cat] = (counts[it.cat] || 0) + 1; });

const DOC = {
  yes: { cls: 'badge--yes', text: 'Документація' },
  analog: { cls: 'badge--analog', text: 'Док. аналога' },
  no: { cls: '', text: 'За запитом' },
};

const state = { cat: 'all', q: '', docOnly: false };

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
  history.replaceState(null, '', location.pathname + location.search + (state.cat === 'all' ? '' : `#${state.cat}`));
  renderChips();
  render();
  const on = chipsHost.querySelector('.is-on');
  on && on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
});

/* --- пошук --- */
const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').replace(/[×x]/g, 'x').replace(/\s+/g, ' ');
let t = 0;
search.addEventListener('input', () => {
  clearTimeout(t);
  t = setTimeout(() => { state.q = norm(search.value.trim()); render(); }, 120);
});
docToggle.addEventListener('change', () => { state.docOnly = docToggle.checked; render(); });

/* --- фільтрація --- */
function filtered() {
  return ITEMS.filter((it) => {
    if (state.cat !== 'all' && it.cat !== state.cat) return false;
    if (state.docOnly && it.doc === 'no') return false;
    if (state.q) {
      const hay = norm(`${it.name} ${it.brand} ${catName[it.cat]}`);
      return state.q.split(' ').every((w) => hay.includes(w));
    }
    return true;
  });
}

/* --- рендер --- */
function itemCard(it) {
  const d = DOC[it.doc] || DOC.no;
  return `
    <article class="item" data-id="${it.id}">
      <div class="item__top"><span>${catName[it.cat]}</span><span>#${String(it.id).padStart(3, '0')}</span></div>
      <h3 class="item__name">${it.name}</h3>
      <div class="item__foot">
        <span class="badge ${d.cls}">${d.text}</span>
        <button class="item__req" type="button" data-req="${it.id}">Запит →</button>
      </div>
    </article>`;
}

function render() {
  const list = filtered();
  countEl.textContent = `${list.length} із ${ITEMS.length}`;
  if (!list.length) {
    host.innerHTML = `<p class="empty">Нічого не знайдено. Спробуйте інше слово або надішліть запит — підберемо аналог.</p>`;
    return;
  }
  const groups = new Map();
  list.forEach((it) => { if (!groups.has(it.cat)) groups.set(it.cat, []); groups.get(it.cat).push(it); });
  host.innerHTML = CATEGORIES.filter((c) => groups.has(c.id)).map((c) => `
    <section class="cat-group rise" id="${c.id}">
      <div class="cat-group__head"><h2 class="h-display">${c.name}</h2><span>${groups.get(c.id).length} поз.</span></div>
      <div class="items">${groups.get(c.id).map(itemCard).join('')}</div>
    </section>`).join('');
  observeRise(host);
}

host.addEventListener('click', (e) => {
  const b = e.target.closest('[data-req]');
  if (!b) return;
  const it = ITEMS.find((x) => x.id === Number(b.dataset.req));
  if (it) prefillRequest(`${it.name} (${catName[it.cat]}, #${String(it.id).padStart(3, '0')})`);
});

/* --- старт: категорія з хеша --- */
const hash = location.hash.slice(1);
if (hash && catName[hash]) state.cat = hash;
renderChips();
render();
