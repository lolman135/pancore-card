/* ============================================================
   PANCORE — спільна логіка сторінок
   шапка · мобільне меню · активний пункт · поява блоків ·
   підсвітка карток · WebGL-поле · лічильники · форма запиту
   ============================================================ */

import { createMesh } from './mesh.js';
import { API_BASE as ENV_API_BASE, API_KEY } from './env.js';

export const reducedMotion =
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  new URLSearchParams(location.search).has('static');
/* мова сторінки: тексти, що генеруються скриптом, беруться за <html lang> */
export const EN = /^en/i.test(document.documentElement.lang || '');

/* ---------- пошук у шапці → каталог; «/» ставить курсор у пошук ---------- */
document.querySelectorAll('form.hsearch').forEach((f) => f.addEventListener('submit', (e) => {
  if (!f.querySelector('input').value.trim()) e.preventDefault();
}));
addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^(input|textarea|select)$/i.test(document.activeElement?.tagName || '')) return;
  const s = document.querySelector('#q, .hsearch input');
  if (s) { e.preventDefault(); s.focus(); }
});

/* ---------- шапка ---------- */
const head = document.getElementById('head');
if (head) {
  const onScroll = () => head.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- смуга прокрутки вгорі (є лише на сторінках із розміткою .progress) ---------- */
const progress = document.querySelector('.progress i');
if (progress) {
  let pTick = false;
  const upd = () => {
    pTick = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  addEventListener('scroll', () => { if (!pTick) { pTick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd);
  upd();
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
   Адреса бекенда, за спаданням пріоритету:
     1) <meta name="api-base" content="https://api.example.com"> — ручне перевизначення;
     2) API_BASE з ./env.js — генерується з .env (backend/scripts/gen_frontend_env.py);
     3) порожньо = той самий origin. */
const API_BASE = (document.querySelector('meta[name="api-base"]')?.content || ENV_API_BASE || '').replace(/\/+$/, '');
const CONTACT_URL = `${API_BASE}/api/v1/contact`;

/* Як назвати канал зв'язку у відповіді: бекенд віддає contact_type,
   але «phone» користувачеві показуємо словами. */
const CONTACT_LABEL = EN
  ? { email: 'e-mail', phone: 'phone', telegram: 'Telegram' }
  : { email: 'email', phone: 'мобільний телефон', telegram: 'telegram' };

const MSG = EN ? {
  sending: 'Sending…',
  ok: 'Your enquiry has been sent. We reply within one business day.',
  okTyped: (label) => `Your enquiry via ${label} has been sent. We reply within one business day.`,
  invalid: 'Please check the form fields.',
  contact: 'Enter an e-mail, phone number or @telegram.',
  limit: 'Too many requests from your address. Try again later or write to us by e-mail.',
  fail: 'Could not send. Please e-mail us — the address is next to the form.',
} : {
  sending: 'Надсилаємо…',
  ok: 'Заявку надіслано. Відповімо протягом робочого дня.',
  okTyped: (label) => `Ваш запит на ${label} надіслано. Відповімо протягом робочого дня.`,
  invalid: 'Перевірте поля форми.',
  contact: 'Вкажіть email, телефон або @telegram.',
  limit: 'Забагато запитів із вашої адреси. Спробуйте пізніше або напишіть на пошту.',
  fail: 'Не вдалося надіслати. Напишіть нам на пошту — адреса поруч із формою.',
};

/* Бекенд приймає лише contact і comment, тому все, що є у формі понад це
   (позиція з каталогу, сторінка), додається у comment окремими рядками. */
function buildPayload(form) {
  const fd = new FormData(form);
  const get = (k) => String(fd.get(k) || '').trim();
  const lines = [];
  if (get('position')) lines.push(`Позиція: ${get('position')}`);
  lines.push(`Сторінка: ${location.pathname}${location.hash}`);
  const comment = `${lines.join('\n')}\n\n${get('message')}`.slice(0, 4000);
  return { contact: get('contact').slice(0, 254), comment };
}

/* Поля беремо через querySelector: form.elements.<name> ламається на іменах,
   що збігаються з властивостями колекції (item, length, namedItem…). */
const field = (form, name) => form.querySelector(`[name="${name}"]`);

export function initLeadForm(form) {
  const status = form.querySelector('.form__status');
  const btn = form.querySelector('[type="submit"]');
  const say = (text, cls = '') => { status.textContent = text; status.className = `form__status ${cls}`.trim(); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // пастка для ботів: приховане поле має лишатися порожнім
    const hp = field(form, 'website');
    if (hp && hp.value) { say(MSG.ok, 'ok'); form.reset(); return; }
    if (!form.reportValidity()) { say(MSG.invalid, 'err'); return; }

    const payload = buildPayload(form);
    btn.disabled = true;
    say(MSG.sending);
    try {
      const res = await fetch(CONTACT_URL, {
        method: 'POST',
        // X-API-Key з env.js; у Docker ключ порожній — його підставляє nginx при проксуванні
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // 200 { status: "ok", contact_type: "email" | "phone" | "telegram" };
        // якщо тіло не прочиталось або тип невідомий — загальне повідомлення
        const j = await res.json().catch(() => null);
        const label = CONTACT_LABEL[j && j.contact_type];
        say(label ? MSG.okTyped(label) : MSG.ok, 'ok');
        form.reset();
      }
      else if (res.status === 422) {
        // бекенд віддає RFC 7807 application/problem+json:
        // { type, title, status, detail, instance, field?: "contact", errors?: [{field, message, type}] }
        const j = await res.json().catch(() => null);
        const badField = (j && (j.field || (Array.isArray(j.errors) && j.errors[0] && j.errors[0].field))) || '';
        const detail = j && typeof j.detail === 'string' ? j.detail : '';
        const detailUa = /[а-яіїєґ]/i.test(detail) ? detail : '';
        if (badField === 'contact' || /invalid-contact/.test(String(j && j.type))) {
          say(detailUa || MSG.contact, 'err');
          const c = field(form, 'contact');
          c && c.focus();
        } else {
          say(detailUa || MSG.invalid, 'err');
          const f = badField && field(form, badField);
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
  const pos = field(form, 'position');
  if (pos) pos.value = text;
  // окремого поля «Позиція» у формі може не бути — тоді позиція йде в повідомлення,
  // причому дописується, а не затирає вже набраний текст
  const msg = field(form, 'message');
  if (msg) {
    const line = EN ? `Please quote the following item: ${text}.` : `Прошу комерційну пропозицію на позицію: ${text}.`;
    msg.value = msg.value.trim()
      ? `${msg.value.replace(/\s+$/, '')}\n${line}`
      : `${line}\n${EN ? 'Quantity: ' : 'Кількість: '}`;
  }
  form.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
  setTimeout(() => {
    const c = field(form, 'contact');
    c && c.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 500);
}
