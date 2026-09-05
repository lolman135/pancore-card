/* ============================================================
   PANCORE — сторінка «Асортимент» (products.html)
   Дані — js/data/products.js (ASSORTMENT): категорії → позиції {назва, марка}.
   Технічних характеристик тут немає навмисно: докладно про власне
   виробництво — production.html, специфікації — на запит.
   Поле граней у шапці монтує site.js (canvas#mesh у .mesh-stage).
   ============================================================ */

import { prefillRequest, observeRise } from './site.js';
import { ASSORTMENT } from './data/products.js';

const EN = /^en/i.test(document.documentElement.lang || '');
const t = (uk, en) => (EN ? en : uk);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/* --i — порядковий номер для каскадної появи чипів (CSS animation-delay) */
const list = (items) => `<ul class="plist">${items.map((i, k) => `<li style="--i:${k}"><span>${esc(i.n)}</span>${i.b ? `<i>${esc(i.b)}</i>` : ''}</li>`).join('')}</ul>`;

/* ---------- зміст: чипи-якорі на категорії ---------- */
const toc = document.getElementById('toc');
if (toc) toc.innerHTML = ASSORTMENT.map((c) => `<a class="chip" href="#oth-${c.id}">${esc(c.name)}</a>`).join('');
/* українська множина: 1 позиція · 2–4 позиції · 5+ позицій (11–14 — як 5+) */
const plural = (n, one, few, many) => { const m10 = n % 10, m100 = n % 100; return (m10 === 1 && m100 !== 11) ? one : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) ? few : many; };
const total = document.getElementById('total');
if (total) {
  const n = ASSORTMENT.reduce((a, c) => a + c.items.length, 0), k = ASSORTMENT.length;
  total.textContent = EN ? `${n} items · ${k} categories`
    : `${n} ${plural(n, 'позиція', 'позиції', 'позицій')} · ${k} ${plural(k, 'категорія', 'категорії', 'категорій')}`;
}

/* ---------- категорії: акордеон з анімацією висоти ---------- */
const host = document.getElementById('assortment-items');
if (host) {
  host.innerHTML = ASSORTMENT.map((c, k) => {
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
  const open = (card, on) => {
    card.classList.toggle('is-open', on);
    card.querySelector('.oth__head').setAttribute('aria-expanded', String(on));
    if (on) card.querySelectorAll('.plist li').forEach((li) => { li.classList.remove('is-anim'); void li.offsetWidth; li.classList.add('is-anim'); });
  };
  host.addEventListener('click', (e) => {
    const head = e.target.closest('.oth__head');
    if (head) { const card = head.closest('.oth'); open(card, !card.classList.contains('is-open')); }
  });
  /* якір #oth-… (зі змісту або з іншої сторінки) відкриває категорію */
  const byHash = () => { const hit = location.hash && host.querySelector(location.hash); if (hit) open(hit, true); };
  byHash();
  addEventListener('hashchange', byHash);
}

/* ---------- «Запит»: підставляємо категорію у форму ---------- */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-req]');
  if (b) prefillRequest(b.dataset.req);
});

/* нові .rise з’явилися після рендера — підписуємо на появу */
observeRise();
