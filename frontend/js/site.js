/* ============================================================
   PANCORE — спільна логіка сторінок
   шапка · мобільне меню · активний пункт · поява блоків ·
   підсвітка карток · WebGL-поле · лічильники · форма запиту
   ============================================================ */

import { createMesh } from './mesh.js';

export const reducedMotion =
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  new URLSearchParams(location.search).has('static');

/* ---------- шапка ---------- */
const head = document.getElementById('head');
if (head) {
  const onScroll = () => head.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- активний пункт меню ---------- */
const page = document.body.dataset.page || 'home';
document.querySelectorAll('[data-nav]').forEach((a) => {
  a.classList.toggle('is-active', a.dataset.nav === page);
});

/* ---------- мобільне меню ---------- */
const burger = document.querySelector('.burger');
if (burger) {
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.mnav a').forEach((a) =>
    a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    }),
  );
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.body.classList.remove('menu-open');
  });
}

/* ---------- поява блоків ---------- */
export function observeRise(root = document) {
  const els = root.querySelectorAll('.rise:not(.is-in)');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  els.forEach((el) => io.observe(el));
}
observeRise();

/* ---------- підсвітка карток за курсором ---------- */
export function bindCardGlow(root = document) {
  root.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    });
  });
}
bindCardGlow();

/* ---------- WebGL-поле граней ---------- */
const canvas = document.getElementById('mesh');
if (canvas) {
  const stage = canvas.closest('.mesh-stage');
  const isFixed = !stage.classList.contains('is-band');
  const mesh = createMesh(canvas, {
    static: reducedMotion,
    density: isFixed ? 1 : 0.85,
    edge: isFixed ? 1 : 0.9,
    fill: isFixed ? 1 : 0.8,
  });
  window.__mesh = mesh;
  if (mesh.ok && isFixed) {
    // герой яскравий, далі поле приглушується; поза героєм рендер зупиняємо (GPU/батарея)
    let ticking = false;
    const update = () => {
      ticking = false;
      const h = Math.max(innerHeight, 1);   // у прихованій вкладці innerHeight може бути 0
      const k = Math.max(0, Math.min(1, 1 - (scrollY - h * 0.2) / (h * 0.9)));
      mesh.setIntensity(0.2 + 0.8 * k);
      if (scrollY > h * 1.6) mesh.pause(); else mesh.resume();
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  } else if (mesh.ok && 'IntersectionObserver' in window) {
    // смуга на внутрішніх сторінках: анімуємо лише поки вона в кадрі
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? mesh.resume() : mesh.pause()));
    }, { threshold: 0.02 });
    io.observe(stage);
  }
}

/* ---------- карта світу (головна) ---------- */
const wmHost = document.getElementById('worldmap');
if (wmHost) {
  import('./worldmap.js').then(({ mountWorldMap }) => mountWorldMap(wmHost, { reduced: reducedMotion }));
}

/* ---------- лічильники ---------- */
/* У розмітці стоїть кінцеве значення; анімація лише «докручує» його
   від нуля, коли блок з'являється на екрані. Без JS/анімацій число видно одразу. */
function animateCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length || reducedMotion || !('IntersectionObserver' in window)) return;
  const run = (el) => {
    const to = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split('.')[1] || '').length;
    const final = el.textContent;
    const dur = 1400, t0 = performance.now();
    const fmt = (v) => v.toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? fmt(to * e) : final;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.4 });
  els.forEach((el) => io.observe(el));
}
animateCounters();

/* ---------- чипи категорій на головній ---------- */
const chipsHost = document.getElementById('cat-chips');
if (chipsHost) {
  import('./data/catalog.js').then(({ CATEGORIES, ITEMS }) => {
    const counts = {};
    ITEMS.forEach((it) => { counts[it.cat] = (counts[it.cat] || 0) + 1; });
    chipsHost.innerHTML = CATEGORIES.map(
      (c) => `<a class="chip" href="catalog.html#${c.id}">${c.name} <b>${counts[c.id] || 0}</b></a>`,
    ).join('');
    const total = document.getElementById('cat-total');
    if (total) total.textContent = ITEMS.length;
  });
}

/* ---------- форма запиту → POST {API_BASE}/api/v1/contact ----------
   Контракт бекенда (backend/app/dto/contact.py):
     запит   { contact: string ≤254 (email | телефон | @telegram), comment: string ≤4000 }
     200     { status: "ok", contact_type: "email" | "phone" | "telegram" }
     422     { detail: "текст" } — контакт не розпізнано; або список pydantic
   Ім'я, компанія, позиція та сторінка пакуються в comment.
   API_BASE — <meta name="api-base" content="https://api.example.com">;
   порожньо = той самий origin. */
const API_BASE = (document.querySelector('meta[name="api-base"]')?.content || '').replace(/\/+$/, '');
const CONTACT_URL = `${API_BASE}/api/v1/contact`;

const MSG = {
  sending: 'Надсилаємо…',
  ok: 'Заявку надіслано. Відповімо протягом робочого дня.',
  invalid: 'Перевірте поля форми.',
  contact: 'Вкажіть email, телефон або @telegram.',
  limit: 'Забагато запитів із вашої адреси. Спробуйте пізніше або напишіть на пошту.',
  fail: 'Не вдалося надіслати. Напишіть нам на пошту — адреса поруч із формою.',
};

function buildPayload(form) {
  const fd = new FormData(form);
  const get = (k) => String(fd.get(k) || '').trim();
  const lines = [];
  if (get('name')) lines.push(`Ім’я: ${get('name')}`);
  if (get('company')) lines.push(`Компанія: ${get('company')}`);
  if (get('item')) lines.push(`Позиція: ${get('item')}`);
  lines.push(`Сторінка: ${location.pathname}${location.hash}`);
  const comment = `${lines.join('\n')}\n\n${get('message')}`.slice(0, 4000);
  return { contact: get('contact').slice(0, 254), comment };
}

export function initLeadForm(form) {
  const status = form.querySelector('.form__status');
  const btn = form.querySelector('[type="submit"]');
  const say = (text, cls = '') => { status.textContent = text; status.className = `form__status ${cls}`.trim(); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // пастка для ботів: приховане поле має лишатися порожнім
    if (form.elements.website && form.elements.website.value) { say(MSG.ok, 'ok'); form.reset(); return; }
    if (!form.reportValidity()) { say(MSG.invalid, 'err'); return; }

    const payload = buildPayload(form);
    btn.disabled = true;
    say(MSG.sending);
    try {
      const res = await fetch(CONTACT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { say(MSG.ok, 'ok'); form.reset(); }
      else if (res.status === 422) {
        // бекенд віддає RFC 7807 application/problem+json:
        // { type, title, status, detail, instance, field?: "contact", errors?: [{field, message, type}] }
        const j = await res.json().catch(() => null);
        const field = j && (j.field || (Array.isArray(j.errors) && j.errors[0] && j.errors[0].field)) || '';
        const detail = j && typeof j.detail === 'string' ? j.detail : '';
        const detailUa = /[а-яіїєґ]/i.test(detail) ? detail : '';
        if (field === 'contact' || /invalid-contact/.test(String(j && j.type))) {
          say(detailUa || MSG.contact, 'err');
          form.elements.contact && form.elements.contact.focus();
        } else {
          say(detailUa || MSG.invalid, 'err');
          const f = field && form.elements[field];
          f && f.focus && f.focus();
        }
      }
      else if (res.status === 429) say(MSG.limit, 'err');
      else throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      say(MSG.fail, 'err');
    } finally {
      btn.disabled = false;
    }
  });
}
document.querySelectorAll('form[data-lead]').forEach(initLeadForm);

/* ---------- утиліта: підставити позицію у форму ---------- */
export function prefillRequest(text) {
  const form = document.querySelector('form[data-lead]');
  if (!form) return;
  const item = form.elements.item;
  if (item) item.value = text;
  const msg = form.elements.message;
  if (msg && !msg.value.trim()) msg.value = `Прошу комерційну пропозицію на позицію: ${text}.\nКількість: `;
  form.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
  setTimeout(() => form.elements.name && form.elements.name.focus({ preventScroll: true }), reducedMotion ? 0 : 500);
}
