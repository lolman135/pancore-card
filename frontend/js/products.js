/* ============================================================
   PANCORE — сторінка «Асортимент» (products.html)
   Дані — js/data/products.js: основні позиції (MAIN) з візуалом і
   призначенням, решта (OTHER) — назви й марки за категоріями.
   Технічних характеристик тут немає навмисно: специфікації — на запит.
   Поле граней над «Інше» монтує site.js (canvas#mesh у .mesh-stage).
   ============================================================ */

import { prefillRequest, observeRise } from './site.js';
import { mountSketches, propSketch } from './sketches.js';
import { MAIN, OTHER } from './data/products.js';

const EN = /^en/i.test(document.documentElement.lang || '');
const t = (uk, en) => (EN ? en : uk);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const pad2 = (n) => String(n).padStart(2, '0');

function visual(v) {
  if (v.type === 'img') {
    return `<figure class="photo pitem__photo" style="margin:0"><img src="${v.src}" alt="${esc(v.alt || '')}" loading="lazy">${v.cap ? `<figcaption class="photo__cap">${esc(v.cap)}</figcaption>` : ''}</figure>`;
  }
  if (v.type === 'prop') return `<div class="sk sk--prop pitem__sk" data-prop="${v.inch || 10}" aria-hidden="true"></div>`;
  return `<div class="sk pitem__sk" data-sketch="${v.key}" aria-hidden="true"></div>`;
}
/* --i — порядковий номер для каскадної появи чипів (CSS animation-delay) */
const list = (items) => `<ul class="plist">${items.map((i, k) => `<li style="--i:${k}"><span>${esc(i.n)}</span>${i.b ? `<i>${esc(i.b)}</i>` : ''}</li>`).join('')}</ul>`;

/* ---------- основні позиції ---------- */
const mainHost = document.getElementById('main-items');
if (mainHost) {
  mainHost.innerHTML = MAIN.map((p, i) => `
    <section class="pitem rise" id="${p.id}">
      <div class="pitem__fig${p.visual.length > 1 ? ' pitem__fig--two' : ''}">${p.visual.map(visual).join('')}</div>
      <div class="pitem__txt">
        <p class="eyebrow">${pad2(i + 1)} · ${esc(p.tag)}</p>
        <h2 class="h-display h2">${esc(p.name)}</h2>
        <p class="lead">${esc(p.purpose)}</p>
        ${p.items && p.items.length ? `<p class="plist__ttl">${t('Позиції', 'Items')} · ${p.items.length}</p>${list(p.items)}` : ''}
        <div class="pitem__cta">
          <button class="btn btn--primary" type="button" data-req="${esc(p.name)}">${t('Запит', 'Enquire')}</button>
          ${p.more ? `<a class="btn btn--ghost" href="${p.more.href}">${esc(p.more.text)} <span class="arr">→</span></a>` : ''}
        </div>
      </div>
    </section>`).join('');
  mountSketches(mainHost);
  mainHost.querySelectorAll('[data-prop]').forEach((el) => { el.innerHTML = propSketch(Number(el.dataset.prop) || 10); });
}

/* ---------- зміст (чипи-якорі) ---------- */
const toc = document.getElementById('toc');
if (toc) {
  toc.innerHTML = MAIN.map((p) => `<a class="chip" href="#${p.id}">${esc(p.name)}</a>`).join('') + `<a class="chip" href="#other">${t('Інше', 'Other')}</a>`;
}

/* ---------- інше: назви й марки за категоріями (акордеон з анімацією висоти) ---------- */
const otherHost = document.getElementById('other-items');
if (otherHost) {
  otherHost.innerHTML = OTHER.map((c, k) => {
    const brands = [...new Set(c.items.map((i) => i.b).filter(Boolean))];
    return `<article class="oth rise" data-delay="${k % 4}" id="oth-${c.id}">
      <button class="oth__head" type="button" aria-expanded="false" aria-controls="oth-${c.id}-body">
        <b>${esc(c.name)}</b>
        <span class="oth__meta">${c.items.length} ${t('поз.', 'items')}${brands.length ? ' · ' + esc(brands.slice(0, 4).join(', ')) + (brands.length > 4 ? '…' : '') : ''}</span>
        <i class="oth__x" aria-hidden="true"></i>
      </button>
      <div class="oth__body" id="oth-${c.id}-body"><div class="oth__in">
        ${list(c.items)}
        <div class="oth__cta"><button class="btn btn--ghost btn--sm" type="button" data-req="${esc(c.name)}">${t('Запит по категорії', 'Enquire about this category')}</button></div>
      </div></div>
    </article>`;
  }).join('');
  otherHost.addEventListener('click', (e) => {
    const head = e.target.closest('.oth__head');
    if (!head) return;
    const card = head.closest('.oth');
    const open = !card.classList.contains('is-open');
    card.classList.toggle('is-open', open);
    head.setAttribute('aria-expanded', String(open));
    if (open) card.querySelectorAll('.plist li').forEach((li) => { li.classList.remove('is-anim'); void li.offsetWidth; li.classList.add('is-anim'); });
  });
  /* відкрити категорію за якорем #oth-… */
  const hit = location.hash && otherHost.querySelector(location.hash);
  if (hit) hit.querySelector('.oth__head').click();
}

/* ---------- «Запит»: підставляємо позицію у форму ---------- */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-req]');
  if (b) prefillRequest(b.dataset.req);
});

/* нові .rise з’явилися після рендера — підписуємо на появу */
observeRise();
