/* ============================================================
   PANCORE GROUP — мультимовність поверх однієї розмітки.
   Джерело — українська. Словник js/i18n/dict.js: текст → [en, pl].
   Мову задає <html lang> (виставляється синхронним скриптом у <head>
   з ?lang=, localStorage/cookie або мови системи: uk/ru → uk, pl → pl,
   інші → en — до запуску модулів, щоб EN/PL бачили всі скрипти). Тут: підміна текстових вузлів і атрибутів, спостерігач
   за динамічним вмістом (каталог, віджети) і перемикач у шапці.
   ============================================================ */

import { DICT } from './i18n/dict.js';

export const LANGS = ['uk', 'en', 'pl'];
export const STORAGE_KEY = 'pancore-lang';
export const lang = (() => {
  const l = (document.documentElement.lang || 'uk').slice(0, 2).toLowerCase();
  return LANGS.includes(l) ? l : 'uk';
})();
export const EN = lang === 'en';
export const LOC = { uk: 'uk-UA', en: 'en-GB', pl: 'pl-PL' }[lang];
const IDX = { en: 0, pl: 1 }[lang];

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

/* переклад довільного українського рядка (категорії, ключі характеристик); без перекладу — як є */
export function tr(s) {
  if (IDX == null || s == null) return s;
  const hit = DICT[norm(s)];
  return hit && hit[IDX] ? hit[IDX] : s;
}

/* t(uk, en, pl): англійська може бути передана прямо у коді, польська — зі словника */
export function t(uk, en, pl) {
  if (lang === 'uk') return uk;
  if (lang === 'pl') return pl ?? (DICT[norm(uk)] && DICT[norm(uk)][1]) ?? en ?? uk;
  return en ?? (DICT[norm(uk)] && DICT[norm(uk)][0]) ?? uk;
}

const ATTRS = ['placeholder', 'aria-label', 'title', 'alt', 'aria-valuetext', 'data-dot'];
const SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|CODE|PRE)$/;

function translateText(node) {
  const raw = node.nodeValue;
  if (!raw || !/[А-Яа-яІіЇїЄєҐґ]/.test(raw)) return;
  const hit = DICT[norm(raw)];
  if (!hit || !hit[IDX]) return;
  const lead = raw.match(/^\s*/)[0], tail = raw.match(/\s*$/)[0];
  node.nodeValue = lead + hit[IDX] + tail;
}

function translateAttrs(el) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (!v) continue;
    const hit = DICT[norm(v)];
    if (hit && hit[IDX]) el.setAttribute(a, hit[IDX]);
  }
}

/* переклад усього піддерева: текстові вузли + атрибути */
export function applyI18n(root = document) {
  if (IDX == null) return;
  const scope = root.nodeType === 9 ? root.body : root;
  if (!scope) return;
  if (scope.nodeType === 1) translateAttrs(scope);
  const w = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeType === 1 ? (SKIP.test(n.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) : NodeFilter.FILTER_ACCEPT),
  });
  while (w.nextNode()) { const n = w.currentNode; if (n.nodeType === 3) translateText(n); else translateAttrs(n); }
  if (root.nodeType === 9) {
    // заголовок вкладки та мета-описи
    if (document.title) { const hit = DICT[norm(document.title)]; if (hit && hit[IDX]) document.title = hit[IDX]; }
    document.querySelectorAll('meta[name="description"], meta[property^="og:"]').forEach((m) => {
      const v = m.getAttribute('content'); const hit = v && DICT[norm(v)];
      if (hit && hit[IDX]) m.setAttribute('content', hit[IDX]);
    });
  }
}

/* динамічний вміст (каталог, віджети, ескізи) — перекладаємо все, що додається в DOM */
export function observeI18n() {
  if (IDX == null || !('MutationObserver' in window)) return;
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') { translateText(m.target); continue; }
      m.addedNodes.forEach((n) => { if (n.nodeType === 3) translateText(n); else if (n.nodeType === 1 && !SKIP.test(n.tagName)) applyI18n(n); });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
}

/* перемикач мови: кнопки .lang[data-lang] у шапці та мобільному меню */
export function initLangSwitcher() {
  document.querySelectorAll('.lang[data-lang]').forEach((b) => {
    b.classList.toggle('is-on', b.dataset.lang === lang);
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    b.addEventListener('click', () => {
      const next = b.dataset.lang;
      if (next === lang) return;
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* приватний режим */ }
      document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      const url = new URL(location.href);
      url.searchParams.set('lang', next);
      location.href = url.toString();
    });
  });
}
