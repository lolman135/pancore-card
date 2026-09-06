/* ============================================================
   PANCORE — сповіщення про обробку персональних даних (UA та EN: тексти за <html lang>)
   Показується, лише поки в браузері немає cookie pc_consent: на першому
   заході та щоразу після очищення cookie, а не на кожній сторінці.
   «Зрозуміло» ставить cookie на рік. Розмітку створює скрипт,
   стилі — .consent у style.css. Підключає site.js; 404.html — напряму.
   ============================================================ */

const COOKIE = 'pc_consent';
const YEAR = 60 * 60 * 24 * 365;

const EN = /^en/i.test(document.documentElement.lang || '');
const T = EN ? {
  aria: 'Personal data notice',
  label: 'Personal data',
  text: 'We process the personal data you leave in the enquiry form to reply to it, and use cookies to collect visit analytics. By continuing to use the site, you agree to this.',
  ok: 'Got it',
} : {
  aria: 'Повідомлення про обробку персональних даних',
  label: 'Персональні дані',
  text: 'Ми обробляємо персональні дані, які ви залишаєте у формі запиту, щоб відповісти на нього, а також використовуємо файли cookie для аналітики відвідувань. Продовжуючи користуватися сайтом, ви погоджуєтеся з цим.',
  ok: 'Зрозуміло',
};

const hasConsent = () => document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE}=`));
function setConsent() {
  // Secure лише на https: на http://127.0.0.1 браузер такий cookie не збереже
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE}=1; Max-Age=${YEAR}; Path=/; SameSite=Lax${secure}`;
}

function render() {
  const el = document.createElement('aside');
  el.className = 'consent';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', T.aria);
  el.innerHTML = `
    <p class="consent__k">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
      <span>${T.label}</span>
    </p>
    <p class="consent__t">${T.text}</p>
    <div class="consent__foot"><button class="btn btn--primary btn--sm" type="button">${T.ok}</button></div>`;
  return el;
}

export function initConsent() {
  if (hasConsent()) return;
  let shown = false;
  const show = () => {
    if (shown) return;
    shown = true;
    const el = render();
    document.body.appendChild(el);
    document.body.classList.add('consent-open');   // ховає .fab-desk, що стоїть на тому ж місці
    // клас — після примусового reflow, інакше перехід появи не програється (як у swapIn)
    void el.offsetWidth;
    el.classList.add('is-on');
    el.querySelector('button').addEventListener('click', () => {
      setConsent();
      document.body.classList.remove('consent-open');
      el.classList.remove('is-on');
      el.addEventListener('transitionend', (e) => { if (e.target === el) el.remove(); });
      setTimeout(() => el.remove(), 600);   // страховка: без переходів (reduced motion) transitionend не прийде
    }, { once: true });
  };
  /* Картка з'являється через секунду після load — коли лоадер уже зник, а не під ним.
     Якщо load затягується (шрифти, CDN) — не пізніше 3,5 с. */
  const later = () => setTimeout(show, 1000);
  if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
  setTimeout(show, 3500);
}
