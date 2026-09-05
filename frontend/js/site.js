/* ============================================================
   PANCORE — спільна логіка сторінок
   шапка · мобільне меню · активний пункт · поява блоків ·
   підсвітка карток · WebGL-поле · лічильники · форма запиту
   ============================================================ */

/* Скрипт дійшов до виконання — знімаємо сторож із <head>, інакше він показав би
   весь вміст без анімації через 2 с (див. .js-anim у style.css). */
clearTimeout(window.__riseGuard);

/* env.js генерується з .env (backend/scripts/gen_frontend_env.py) і в репозиторії
   його немає, тож на свіжому клоні статичний import поклав би весь site.js.
   Динамічний із фолбеком лишає сторінку робочою: порожня база = той самий origin. */
const { API_BASE: ENV_API_BASE = '', API_KEY = '' } = await import('./env.js').catch(() => ({}));

export const reducedMotion =
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  new URLSearchParams(location.search).has('static');
/* мова сторінки: тексти, що генеруються скриптом, беруться за <html lang> */
export const EN = /^en/i.test(document.documentElement.lang || '');

/* ---------- плавна заміна вмісту: перезапуск короткої анімації появи на контейнері (.swap-in у style.css) ---------- */
export function swapIn(el) {
  if (!el || reducedMotion) return;
  el.classList.remove('swap-in');
  void el.offsetWidth;
  el.classList.add('swap-in');
}

/* ---------- прокрутка до елемента без «стрибка».
   scrollIntoView бере bounding box, а ще не показаний .rise зсунутий transform-ом на 22 px —
   після появи вміст «підстрибував». Тут позиція рахується через offsetTop (transform не враховується),
   а блоки-цілі одразу позначаються показаними. ---------- */
export function scrollToEl(el, extra = 16) {
  if (!el) return;
  if (el.classList.contains('rise')) el.classList.add('is-in');
  el.querySelectorAll('.rise:not(.is-in)').forEach((r) => r.classList.add('is-in'));
  let top = 0;
  for (let n = el; n; n = n.offsetParent) top += n.offsetTop;
  const headH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--head-h')) || 74;
  scrollTo({ top: Math.max(0, top - headH - extra), behavior: reducedMotion ? 'auto' : 'smooth' });
}

/* ---------- лоадер: логотип із кільцем; зникає після load (мінімум 0,4 с, не довше 1,8 с) ---------- */
const loader = document.querySelector('.loader');
if (loader) {
  if (reducedMotion) loader.remove();
  else {
    const t0 = performance.now();
    let hidden = false;
    const hide = () => {
      if (hidden) return;
      hidden = true;
      const wait = Math.max(0, 420 - (performance.now() - t0));
      setTimeout(() => { loader.classList.add('is-done'); setTimeout(() => loader.remove(), 600); }, wait);
    };
    if (document.readyState === 'complete') hide(); else addEventListener('load', hide, { once: true });
    setTimeout(hide, 1800);
  }
}

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

/* ---------- плаваюча кнопка «Зв’язатися» на десктопі: з’являється після прокрутки ---------- */
const fabDesk = document.querySelector('.fab-desk');
if (fabDesk) {
  const updFab = () => fabDesk.classList.toggle('is-on', scrollY > 360);
  addEventListener('scroll', updFab, { passive: true });
  updFab();
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

/* ---------- відступ для якорів ----------
   Висота фіксованої шапки плюс липкої панелі (каталог), плюс 8px повітря.
   Панель каталогу міняє висоту, коли чіпи переносяться на інший рядок,
   тому стежимо за нею через ResizeObserver, а не задаємо число. */
export function headHeight() {
  const head = document.querySelector('.head');
  return head ? Math.round(head.getBoundingClientRect().height) : 0;
}
export function scrollPad() {
  let pad = headHeight();
  const bar = document.querySelector('.toolbar');
  if (bar && getComputedStyle(bar).position === 'sticky') pad += Math.round(bar.getBoundingClientRect().height);
  return pad + 8;
}
const applyScrollPad = () => document.documentElement.style.setProperty('--scroll-pad', `${scrollPad()}px`);
applyScrollPad();
addEventListener('resize', applyScrollPad, { passive: true });
const stickyBar = document.querySelector('.toolbar');
if (stickyBar && 'ResizeObserver' in window) new ResizeObserver(applyScrollPad).observe(stickyBar);

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

/* Страховка: IntersectionObserver мовчить у фоновій вкладці, після переходу за якорем
   (#system) до першої прокрутки та при нульовому viewport прихованої панелі прев’ю —
   сторінка виглядала порожньою. Тому все, що вже в кадрі (або вище нього), показуємо примусово. */
export function revealVisible() {
  const vh = innerHeight || document.documentElement.clientHeight || 0;
  document.querySelectorAll('.rise:not(.is-in)').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!vh || (r.top < vh + 80 && r.bottom > -4000)) el.classList.add('is-in');
  });
}
[300, 1200, 2600].forEach((ms) => setTimeout(revealVisible, ms));
addEventListener('load', () => setTimeout(revealVisible, 50));
addEventListener('hashchange', () => setTimeout(revealVisible, 60));
addEventListener('resize', revealVisible, { passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(revealVisible, 60); });

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
  /* three.js їде з CDN, тож статичний import ставив би всю сторінку в залежність
     від нього. Динамічний — недоступний CDN коштує лише фону (як worldmap нижче). */
  import('./mesh.js').then(({ createMesh }) => {
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
  }).catch(() => { /* three.js не завантажився — сторінка лишається без фону */ });
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

/* ---------- форма запиту → POST {API_BASE}/api/v1/contact ----------
   Контракт бекенда (backend/app/dto/contact.py):
     запит   { contact: string ≤254 (email | телефон | @telegram), comment: string ≤4000 }
     200     { status: "ok", contact_type: "email" | "phone" | "telegram", mock_status: bool }
             mock_status приходить із PROD_FLAG бекенда: false = мок-режим,
             заявку нікуди не надіслано, тож користувачу кажемо про це прямо
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
  paused: 'Submissions through this form are temporarily suspended. Please e-mail us — the address is next to the form.',
  invalid: 'Please check the form fields.',
  contact: 'Enter an e-mail, phone number or @telegram.',
  limit: 'Too many requests from your address. Try again later or write to us by e-mail.',
  fail: 'Could not send. Please e-mail us — the address is next to the form.',
} : {
  sending: 'Надсилаємо…',
  ok: 'Заявку надіслано. Відповімо протягом робочого дня.',
  okTyped: (label) => `Ваш запит на ${label} надіслано. Відповімо протягом робочого дня.`,
  paused: 'Прийом запитів через форму тимчасово призупинено. Напишіть нам на пошту — адреса поруч із формою.',
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
        // 200 { status: "ok", contact_type: "email" | "phone" | "telegram", mock_status: bool };
        // якщо тіло не прочиталось або тип невідомий — загальне повідомлення
        const j = await res.json().catch(() => null);
        /* mock_status: false — бекенд у мок-режимі (PROD_FLAG вимкнено): заявку лише
           залоговано, нікуди не надіслано. Не вдаємо успіх і форму не чистимо, щоб
           набраний текст лишився. Поля немає (старіший бекенд) — поводимось як раніше. */
        if (j && j.mock_status === false) {
          say(MSG.paused, 'err');
          return;
        }
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
  scrollToEl(form, 24);
  setTimeout(() => {
    const c = field(form, 'contact');
    c && c.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 500);
}
