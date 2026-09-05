/* ============================================================
   PANCORE — «Як це працює в полі»: жива 2D-схема каналу (SVG)

   Не інструкція складання, а показ роботи: дрон із котушкою висить у
   повітрі (гвинти крутяться, апарат похитується), котушка розмотується,
   волокно живою дугою — з провисом і коливанням — приходить в оптичну
   розетку наземної станції. Кабелі живлення, відео та пульта так само
   провисають і гойдаються. По волокну біжать імпульси: вниз — відео і
   телеметрія, вгору — керування; на моніторі змінюється телеметрія.

   Малюємо звичайний SVG у стилі решти ескізів (класи .sketch .ln/.hair/
   .fiber/.osd з pages.css) і щокадру оновлюємо кілька атрибутів —
   ніякого WebGL. prefers-reduced-motion → один статичний кадр.

   Використання:
     import { createLinkScene } from './link2d.js';
     const sc = createLinkScene(hostEl, { static: false });
     sc.destroy();
   ============================================================ */

const EN = /^en/i.test(document.documentElement.lang || '');
const t = (uk, en) => (EN ? en : uk);
const n1 = (v) => Math.round(v * 10) / 10;

/* точки з'єднань: котушка → розетка станції, АКБ → станція, станція → монітор, пульт → монітор */
const P = {
  exit: [112, 104],     // вихід волокна із котушки
  sock: [252, 176],     // оптична розетка станції
  batt: [236, 226], pwr: [296, 206],
  vidA: [372, 184], vidB: [524, 152],
  usbA: [598, 202], usbB: [616, 174],
};

/* дуга з провисом і коливанням: кубічна крива, контрольні точки «дихають» */
function sagD(a, b, sag, sway, tm, phase = 0) {
  const [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay;
  const s1 = Math.sin(tm * 1.15 + phase), s2 = Math.sin(tm * 0.9 + phase + 1.1);
  const c1x = ax + dx * 0.3 + sway * s1, c1y = ay + dy * 0.28 + sag + sway * 0.5 * s2;
  const c2x = ax + dx * 0.7 + sway * s2, c2y = by - dy * 0.06 + sag * 0.55 + sway * 0.5 * s1;
  return `M${n1(ax)},${n1(ay)} C${n1(c1x)},${n1(c1y)} ${n1(c2x)},${n1(c2y)} ${n1(bx)},${n1(by)}`;
}

function markup() {
  const T = (x, y, s, cls = '') => `<text${cls ? ` class="${cls}"` : ''} x="${x}" y="${y}">${s}</text>`;
  const osd = (x, y, id) => `<text class="osd" id="${id}" x="${x}" y="${y}"></text>`;
  return `<svg class="sketch" viewBox="0 0 720 272" xmlns="http://www.w3.org/2000/svg" role="img"
   aria-label="${t('Схема роботи оптичного каналу: дрон із котушкою, волокно, наземна станція, монітор і пульт',
                   'How the optical link works: drone with the coil, fibre, ground station, monitor and RC')}">
  <defs>
    <radialGradient id="lk-glow"><stop offset="0" stop-color="rgba(255,61,79,0.85)"/><stop offset="1" stop-color="rgba(255,61,79,0)"/></radialGradient>
    <radialGradient id="lk-glow2"><stop offset="0" stop-color="rgba(226,232,240,0.9)"/><stop offset="1" stop-color="rgba(226,232,240,0)"/></radialGradient>
  </defs>

  ${T(14, 16, t('як це працює в полі', 'how it works in the field'))}
  ${T(14, 26, t('котушка на борту · одне волокно · наземна станція', 'coil on board · one fibre · ground station'))}

  <!-- дрон із котушкою -->
  <g id="lk-uav">
    <path class="ln" d="M90,58 L60,46 M134,58 L164,46"/>
    <rect class="ln2 fillDim" x="90" y="50" width="44" height="15" rx="3"/>
    <rect class="ln" x="55" y="40" width="10" height="7" rx="1"/><rect class="ln" x="159" y="40" width="10" height="7" rx="1"/>
    <ellipse class="hair" id="lk-p1" cx="60" cy="40" rx="24" ry="2.6"/>
    <ellipse class="hair" id="lk-p2" cx="164" cy="40" rx="24" ry="2.6"/>
    <rect class="ln" x="100" y="42" width="18" height="8" rx="1"/>
    ${T(122, 40, 'sky S-T')}
    <!-- котушка: обичайка + витки, що біжать -->
    <ellipse class="ln" cx="112" cy="72" rx="17" ry="4"/>
    <path class="ln" d="M95,72 v24 M129,72 v24"/>
    <ellipse class="ln" cx="112" cy="96" rx="17" ry="4"/>
    <path class="dimL" id="lk-wind" stroke-dasharray="5 3" d="M96,78 h32 M96,83 h32 M96,88 h32 M96,93 h32"/>
    <circle class="hair" cx="112" cy="102" r="1.8"/>
  </g>
  ${T(186, 52, t('БпЛА · sky S-T із котушкою на борту', 'UAV · sky S-T with the coil on board'))}
  ${T(186, 62, t('котушка розмотується у польоті', 'the coil pays out in flight'))}

  <!-- волокно -->
  <path class="fiber" id="lk-fib" d=""/>
  <circle id="lk-dn" r="3.4" fill="url(#lk-glow)"/>
  <circle id="lk-up" r="2.8" fill="url(#lk-glow2)"/>
  ${T(140, 140, t('одне волокно · 1310 / 1550 нм', 'single fibre · 1310 / 1550 nm'))}
  ${T(140, 150, t('відео і телеметрія ↓', 'video and telemetry ↓'), 'warn')}
  ${T(140, 160, t('керування ↑', 'control ↑'))}

  <!-- наземна станція -->
  <rect class="ln2 fillDim" x="252" y="152" width="120" height="52" rx="5"/>
  <circle class="ln" cx="252" cy="176" r="5.5"/><circle id="lk-sock" cx="252" cy="176" r="7" fill="url(#lk-glow)"/>
  <circle class="hair" cx="252" cy="176" r="2"/>
  ${T(260, 166, 'GROUND STATION')}${T(260, 176, 'S-R')}
  ${T(260, 190, t('оптична розетка', 'optical socket'))}
  ${T(260, 199, t('1310 / 1550 нм · до 80 км', '1310 / 1550 nm · up to 80 km'))}
  <path class="ln" d="M372,168 h8 M372,182 h8"/>${T(376, 162, 'V1 / V2')}
  <path class="ln" d="M294,204 v3"/>

  <!-- АКБ і кабель живлення -->
  <path class="ln" id="lk-pwr" d=""/>
  <rect class="ln2 fillDim" x="170" y="224" width="66" height="26" rx="3"/>
  <rect class="dimL" x="222" y="219" width="14" height="5" rx="1"/>
  ${T(176, 241, t('АКБ 2S–6S', 'battery 2S–6S'))}${T(222, 216, 'XT60')}

  <!-- монітор -->
  <path class="ln" id="lk-vid" d=""/>
  <circle id="lk-pv" r="2.4" fill="url(#lk-glow)"/>
  <g transform="translate(112 0)">
  <rect class="ln2" x="408" y="92" width="134" height="84" rx="4"/>
  <rect class="fillDim" x="413" y="97" width="124" height="74"/>
  <path class="hair" d="M468,176 v8 M482,176 v8 M456,184 h38"/>
  <path class="hair" d="M469,130 h12 M475,124 v12"/>
  ${osd(418, 108, 'lk-o1')}${osd(418, 118, 'lk-o2')}${osd(418, 128, 'lk-o3')}
  ${osd(418, 156, 'lk-o4')}${osd(418, 166, 'lk-o5')}
  <text class="osd" id="lk-o6" x="532" y="108" text-anchor="end"></text>
  <text class="osd" id="lk-o7" x="532" y="118" text-anchor="end"></text>
  <text class="osd" id="lk-o8" x="532" y="166" text-anchor="end"></text>
  ${T(408, 88, t('монітор / ПК · відео і телеметрія', 'monitor / PC · video and telemetry'))}
  </g>

  <!-- пульт -->
  <path class="ln" id="lk-usb" d=""/>
  <g transform="translate(112 0)">
  <rect class="ln2 fillDim" x="408" y="200" width="78" height="32" rx="7"/>
  <circle class="ln" cx="428" cy="216" r="6"/><circle class="hair" id="lk-s1" cx="428" cy="216" r="2.2"/>
  <circle class="ln" cx="466" cy="216" r="6"/><circle class="hair" id="lk-s2" cx="466" cy="216" r="2.2"/>
  <path class="ln" d="M482,200 L496,186"/><circle class="hair" cx="497" cy="184" r="1.6"/>
  ${T(408, 246, t('пульт RC · CRSF / PPM', 'RC · CRSF / PPM'))}
  </g>

  ${T(14, 258, t('відео і телеметрія — вниз, керування — вгору: одним волокном', 'video and telemetry down, control up — over a single fibre'), 'ok')}
  ${T(14, 268, t('без радіосигнатури — нема що глушити чи пеленгувати', 'no radio signature — nothing to jam or direction-find'), 'ok')}
</svg>`;
}

export function createLinkScene(host, opts = {}) {
  const o = { static: false, ...opts };
  host.innerHTML = markup();
  const q = (id) => host.querySelector('#' + id);
  const uav = q('lk-uav'), p1 = q('lk-p1'), p2 = q('lk-p2'), wind = q('lk-wind');
  const fib = q('lk-fib'), pwr = q('lk-pwr'), vid = q('lk-vid'), usb = q('lk-usb');
  const dn = q('lk-dn'), up = q('lk-up'), pv = q('lk-pv'), sock = q('lk-sock');
  const s1 = q('lk-s1'), s2 = q('lk-s2');
  const osd = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => q('lk-o' + i));

  let fibLen = 0, vidLen = 0;
  const at = (path, len, k, el) => {
    if (!len) return;
    const p = path.getPointAtLength(Math.max(0, Math.min(1, k)) * len);
    el.setAttribute('cx', n1(p.x)); el.setAttribute('cy', n1(p.y));
  };

  function drawOsd(tm) {
    const mm = String(Math.floor(tm / 60) % 60).padStart(2, '0'), ss = String(Math.floor(tm) % 60).padStart(2, '0');
    const texts = [
      'ACRO', `00:${mm}:${ss}`, `alt ${(18 + Math.sin(tm * 0.3) * 6).toFixed(1)} m`,
      'link-ok', 'rx −3.6 · tx −0.1',
      '26.9V · 4.48V', `${(0.48 + Math.sin(tm * 0.9) * 0.06).toFixed(2)} A · 99 %`, 'FPS 30 · SN 12345678',
    ];
    osd.forEach((el, i) => { if (el) el.textContent = texts[i]; });
  }

  function update(tm) {
    /* дрон: похитування і гвинти */
    const bob = Math.sin(tm * 1.6) * 2.4, tilt = Math.sin(tm * 0.7) * 1.1;
    uav.setAttribute('transform', `translate(0 ${n1(bob)}) rotate(${n1(tilt)} 112 66)`);
    const rx = (ph) => n1(4 + 20 * Math.abs(Math.cos(tm * 9 + ph)));
    p1.setAttribute('rx', rx(0)); p2.setAttribute('rx', rx(1.1));
    wind.setAttribute('stroke-dashoffset', n1(-tm * 26 % 8));

    /* волокно й кабелі: провис і коливання */
    const ex = [P.exit[0], P.exit[1] + bob];
    fib.setAttribute('d', sagD(ex, P.sock, 24 + Math.sin(tm * 0.5) * 3, 4.5, tm));
    pwr.setAttribute('d', sagD(P.batt, P.pwr, 7, 1.0, tm, 1.7));
    vid.setAttribute('d', sagD(P.vidA, P.vidB, 8, 1.2, tm, 3.1));
    usb.setAttribute('d', sagD(P.usbA, P.usbB, 6, 1.0, tm, 4.4));
    fibLen = fib.getTotalLength(); vidLen = vid.getTotalLength();

    /* імпульси: вниз відео і телеметрія, вгору керування */
    at(fib, fibLen, (tm * 0.42) % 1, dn);
    at(fib, fibLen, 1 - ((tm * 0.42 + 0.5) % 1), up);
    at(vid, vidLen, (tm * 0.6) % 1, pv);
    sock.setAttribute('r', n1(5 + 2.6 * Math.abs(Math.sin(tm * 2.2))));

    /* стіки пульта */
    s1.setAttribute('cx', n1(428 + Math.sin(tm * 0.9) * 2.2));  // всередині g translate(112)
    s2.setAttribute('cy', n1(216 + Math.sin(tm * 0.7 + 1) * 2.2));
  }

  let tm = 0, last = performance.now(), raf = 0, running = false, lastOsd = -1;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; tm += dt;
    update(tm);
    if (tm - lastOsd > 0.4) { drawOsd(tm); lastOsd = tm; }
    if (running) raf = requestAnimationFrame(frame);
  }
  function start() { if (running || o.static) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  update(6); drawOsd(6);
  if (!o.static) {
    /* рахуємо тільки коли блок у кадрі; innerHeight 0 — прихована панель прев'ю */
    const io = new IntersectionObserver((ents) => ents.forEach((e) => ((e.isIntersecting || !innerHeight) && !document.hidden ? start() : stop())), { rootMargin: '80px 0px' });
    io.observe(host);
    const onVis = () => (document.hidden ? stop() : (io.takeRecords(), start()));
    document.addEventListener('visibilitychange', onVis);
    return {
      seek(sec) { stop(); tm = sec; update(tm); drawOsd(tm); },
      destroy() { stop(); io.disconnect(); document.removeEventListener('visibilitychange', onVis); },
    };
  }
  return { seek(sec) { tm = sec; update(tm); drawOsd(tm); }, destroy() {} };
}
