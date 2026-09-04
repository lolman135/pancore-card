/* ============================================================
   PANCORE — «Волокно на складному маршруті»: 3D-сцена (three.js)

   Ізометрична плита рельєфу в стилі поля граней сайту: підрозділена
   поверхня з пагорбом (ребра по барицентричних координатах + ізолінії
   висот), дорога, дерева-конуси, опори ЛЕП із проводами. Червоне волокно
   розмотується з борту дрона, який летить над усім цим від наземної
   станції до кінцевої точки: над деревами, над дорогою, під проводами.
   Підписи — HTML поверх канви (проєкція точок сцени щокадру).

   Використання:
     import { createRouteScene } from './route3d.js';
     const sc = createRouteScene(hostEl, { static: false });
     sc.destroy();
   Дешево для GPU: одна ортокамера, ~4k трикутників, без тіней і постобробки,
   рендер лише коли блок у кадрі.
   ============================================================ */

import * as THREE from 'three';

const ACCENT = 0xff3d4f;
const EN = /^en/i.test(document.documentElement.lang || '');
const t = (uk, en) => (EN ? en : uk);

/* ---------- рельєф: висота у точці (x, z), плита 60 × 40 ---------- */
const W = 60, D = 40;
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return (a + (b - a) * sx) + ((c - a) + (a - b - c + d) * sx) * sz;
}
const ROAD_X = 7.2, ROAD_W = 6;
export function height(x, z) {
  const g = (cx, cz, a, s) => a * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * s * s));
  let h = g(-13, 0, 6.2, 8.5) + g(-4, -9, 1.6, 6) + g(24, -12, 1.8, 7) + g(18, 14, 1.1, 6);
  h += (vnoise(x * 0.18 + 3, z * 0.18 + 7) - 0.5) * 1.4 + (vnoise(x * 0.5, z * 0.5) - 0.5) * 0.35;
  // дорога — рівна смуга; переходи згладжені
  const dr = Math.abs(x - ROAD_X) - ROAD_W / 2;
  const k = THREE.MathUtils.smoothstep(dr, 0, 3);
  const roadH = 0.35 + (vnoise(z * 0.08, 2) - 0.5) * 0.6;
  return roadH + (h - roadH) * k;
}

/* ---------- матеріал плити: заливка за висотою + ребра + ізолінії ---------- */
const TERRAIN_VERT = /* glsl */`
  attribute vec3 bary;
  varying vec3 vBary; varying float vH; varying vec3 vPos;
  void main(){
    vBary = bary; vH = position.y; vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const TERRAIN_FRAG = /* glsl */`
  precision highp float;
  uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uEdge; uniform float uHmax; uniform float uFade;
  varying vec3 vBary; varying float vH; varying vec3 vPos;
  void main(){
    float hn = clamp(vH / uHmax, 0.0, 1.0);
    vec3 fill = mix(uC0, uC1, hn * hn);
    float d = min(min(vBary.x, vBary.y), vBary.z);
    float w = fwidth(d);
    float edge = 1.0 - smoothstep(0.0, w * 1.4, d);
    float ch = vH / 1.25; float cf = fract(ch); float cw = fwidth(ch);
    float contour = (1.0 - smoothstep(0.0, cw * 1.6, min(cf, 1.0 - cf))) * step(0.9, vH);
    float vign = 1.0 - 0.35 * smoothstep(18.0, 30.0, abs(vPos.x)) - 0.25 * smoothstep(12.0, 20.0, abs(vPos.z));
    vec3 col = fill + uEdge * edge * (0.14 + 0.40 * hn) + vec3(0.9, 0.93, 1.0) * contour * 0.16;
    gl_FragColor = vec4(col * vign, 1.0) * uFade;
  }`;

function terrainMesh() {
  const seg = 46, segZ = 31;
  const geo = new THREE.PlaneGeometry(W, D, seg, segZ).rotateX(-Math.PI / 2).toNonIndexed();
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)));
  const bary = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) bary[i * 3 + (i % 3)] = 1;
  geo.setAttribute('bary', new THREE.BufferAttribute(bary, 3));
  geo.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    vertexShader: TERRAIN_VERT, fragmentShader: TERRAIN_FRAG,
    uniforms: {
      uC0: { value: new THREE.Color(0x0b0d12) }, uC1: { value: new THREE.Color(0x232833) },
      uEdge: { value: new THREE.Color(0xffffff) }, uHmax: { value: 7 }, uFade: { value: 1 },
    },
  });
  return new THREE.Mesh(geo, mat);
}

/* ---------- допоміжне: лінії з масиву точок ---------- */
function lines(points, color, opacity = 1, segments = false) {
  const g = new THREE.BufferGeometry().setFromPoints(points);
  const m = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
  return segments ? new THREE.LineSegments(g, m) : new THREE.Line(g, m);
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* обрамлення плити: верхній край іде по рельєфу, торець вниз до -3 */
function slabFrame() {
  const g = new THREE.Group();
  const rim = [];
  const n = 40;
  const edge = (fx, fz) => { for (let i = 0; i <= n; i++) { const k = i / n; const x = fx(k), z = fz(k); rim.push(V(x, height(x, z) + 0.02, z)); } };
  edge((k) => -W / 2 + W * k, () => -D / 2); edge(() => W / 2, (k) => -D / 2 + D * k);
  edge((k) => W / 2 - W * k, () => D / 2); edge(() => -W / 2, (k) => D / 2 - D * k);
  g.add(lines(rim, 0xffffff, 0.9));
  const B = -3;
  const bottom = [V(-W / 2, B, -D / 2), V(W / 2, B, -D / 2), V(W / 2, B, D / 2), V(-W / 2, B, D / 2), V(-W / 2, B, -D / 2)];
  g.add(lines(bottom, 0xffffff, 0.28));
  const corners = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]];
  const vert = [];
  corners.forEach(([x, z]) => vert.push(V(x, B, z), V(x, height(x, z), z)));
  g.add(lines(vert, 0xffffff, 0.35, true));
  // темні торці
  const side = new THREE.MeshBasicMaterial({ color: 0x090a0e, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  const faces = [];
  for (let s = 0; s < 4; s++) {
    const a = corners[s], b = corners[(s + 1) % 4];
    const pts = [];
    for (let i = 0; i <= n; i++) { const k = i / n; const x = a[0] + (b[0] - a[0]) * k, z = a[1] + (b[1] - a[1]) * k; pts.push([x, height(x, z), z]); }
    for (let i = 0; i < n; i++) {
      const p0 = pts[i], p1 = pts[i + 1];
      faces.push(p0[0], B, p0[2], p1[0], B, p1[2], p1[0], p1[1], p1[2], p0[0], B, p0[2], p1[0], p1[1], p1[2], p0[0], p0[1], p0[2]);
    }
  }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(faces, 3));
  g.add(new THREE.Mesh(fg, side));
  return g;
}

/* дорога: стрічка по рельєфу + пунктир осі */
function road() {
  const g = new THREE.Group();
  const n = 48, half = ROAD_W / 2;
  const pos = [], left = [], right = [], mid = [];
  for (let i = 0; i <= n; i++) {
    const z = -D / 2 + D * (i / n);
    const y = height(ROAD_X, z) + 0.06;
    pos.push(ROAD_X - half, y, z, ROAD_X + half, y, z);
    left.push(V(ROAD_X - half, y + 0.02, z)); right.push(V(ROAD_X + half, y + 0.02, z)); mid.push(V(ROAD_X, y + 0.03, z));
  }
  const idx = [];
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x252a35, transparent: true, opacity: 0.96 })));
  g.add(lines(left, 0xffffff, 0.5)); g.add(lines(right, 0xffffff, 0.5));
  const mg = new THREE.BufferGeometry().setFromPoints(mid);
  const ml = new THREE.Line(mg, new THREE.LineDashedMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, dashSize: 0.9, gapSize: 0.8 }));
  ml.computeLineDistances(); g.add(ml);
  return g;
}

/* дерева: конус-каркас + стовбур */
function tree(x, z, s = 1) {
  const g = new THREE.Group();
  const y = height(x, z);
  const cone = new THREE.ConeGeometry(1.15 * s, 3.2 * s, 6, 1, true);
  g.add(new THREE.Mesh(cone, new THREE.MeshBasicMaterial({ color: 0x6fe3a0, transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false })));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(cone, 1), new THREE.LineBasicMaterial({ color: 0x6fe3a0, transparent: true, opacity: 0.55 })));
  g.position.set(x, y + 1.6 * s + 0.5 * s, z);
  const trunk = lines([V(0, -1.6 * s, 0), V(0, -1.6 * s - 0.5 * s, 0)], 0xaab3bb, 0.6);
  g.add(trunk);
  return g;
}

/* опора ЛЕП: ґратчаста щогла з траверсою */
function pylon(x, z, h = 8.5, rot = 0) {
  const g = new THREE.Group();
  const y0 = height(x, z);
  const b = 1.7, tp = 0.6, arm = 2.8;
  const pts = [];
  const legs = [[-b, -b], [b, -b], [b, b], [-b, b]];
  legs.forEach(([lx, lz], i) => {
    const sx = Math.sign(lx) * tp, sz = Math.sign(lz) * tp;
    pts.push(V(lx, 0, lz), V(sx, h, sz));
    const [nx, nz] = legs[(i + 1) % 4];
    for (let k = 1; k <= 3; k++) {
      const q = k / 4; const yy = h * q;
      const ax = lx + (Math.sign(lx) * tp - lx) * q, az = lz + (Math.sign(lz) * tp - lz) * q;
      const bx = nx + (Math.sign(nx) * tp - nx) * q, bz = nz + (Math.sign(nz) * tp - nz) * q;
      pts.push(V(ax, yy, az), V(bx, yy, bz));
    }
  });
  pts.push(V(-arm, h * 0.82, 0), V(arm, h * 0.82, 0), V(-arm * 0.7, h * 0.62, 0), V(arm * 0.7, h * 0.62, 0));
  pts.push(V(0, h, 0), V(0, h + 0.8, 0));
  g.add(lines(pts, 0xaab3bb, 0.9, true));
  g.position.set(x, y0, z); g.rotation.y = rot;
  g.userData.tips = [V(-arm, h * 0.82, 0), V(arm, h * 0.82, 0), V(-arm * 0.7, h * 0.62, 0), V(arm * 0.7, h * 0.62, 0)].map((p) => p.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rot).add(g.position));
  return g;
}
function wire(a, b, sag = 1.1) {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const k = i / 24; pts.push(V(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k - sag * Math.sin(Math.PI * k), a.z + (b.z - a.z) * k)); }
  return lines(pts, 0xd6dbe3, 0.7);
}

/* наземна станція: коробка + антена */
function station(x, z) {
  const g = new THREE.Group();
  const y = height(x, z);
  const box = new THREE.BoxGeometry(2.0, 0.9, 1.4);
  g.add(new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: 0x141821 })));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(box), new THREE.LineBasicMaterial({ color: 0xaab3bb })));
  g.add(lines([V(-0.6, 0.45, 0), V(-0.6, 2.4, 0)], 0xaab3bb, 0.9));
  g.position.set(x, y + 0.45, z);
  return g;
}

/* дрон: корпус, промені, кільця, гвинти (обертаються) */
function drone() {
  const g = new THREE.Group();
  const white = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
  const body = new THREE.BoxGeometry(1.1, 0.3, 1.1);
  g.add(new THREE.Mesh(body, new THREE.MeshBasicMaterial({ color: 0x0c0e13 })));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(body), white));
  const arms = [];
  const R = 1.35;
  const rotors = [];
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
    arms.push(V(0, 0, 0), V(sx * R, 0.05, sz * R));
    const ring = [];
    for (let i = 0; i <= 28; i++) { const a = (i / 28) * Math.PI * 2; ring.push(V(sx * R + Math.cos(a) * 0.72, 0.1, sz * R + Math.sin(a) * 0.72)); }
    g.add(lines(ring, 0xffffff, 0.8));
    const prop = new THREE.Group();
    prop.add(lines([V(-0.62, 0, 0), V(0.62, 0, 0), V(0, 0, -0.62), V(0, 0, 0.62)], 0xffffff, 0.55, true));
    prop.position.set(sx * R, 0.14, sz * R); prop.userData.dir = sx * sz;
    g.add(prop); rotors.push(prop);
  });
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(arms), white));
  // точка виходу волокна знизу
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshBasicMaterial({ color: ACCENT }));
  light.position.y = -0.22; g.add(light);
  g.userData.rotors = rotors;
  return g;
}

/* маршрут волокна: станція → над пагорбом і деревами → над дорогою → під проводами → дрон */
function routeCurve() {
  const P = (x, dz, z) => V(x, height(x, z) + dz, z);
  return new THREE.CatmullRomCurve3([
    P(-27, 0.6, -17), P(-22, 2.4, -12), P(-17, 3.8, -6), P(-13, 4.4, -1), P(-8, 3.8, 2),
    P(-1, 3.4, 3.5), P(ROAD_X, 3.4, 5), P(12, 3.2, 7), P(15.2, 2.9, 8.6), P(20, 3.2, 10.5), P(25, 3.6, 12),
  ], false, 'catmullrom', 0.5);
}

/* світна точка (sprite) для пульсу сигналу */
function glowSprite(color, size) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, color); gr.addColorStop(1, 'rgba(255,61,79,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(size);
  return s;
}

export function createRouteScene(host, opts = {}) {
  const o = { static: false, ...opts };
  const canvas = host.querySelector('canvas') || host.appendChild(document.createElement('canvas'));
  const labelsHost = host.querySelector('.scene3d__labels') || host.appendChild(Object.assign(document.createElement('div'), { className: 'scene3d__labels' }));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(devicePixelRatio || 1, matchMedia('(max-width: 640px)').matches ? 1 : 1.25);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -300, 600);
  const target = new THREE.Vector3(1, 0.5, -1);
  const view = { yaw: -0.62, pitch: 0.50, dyaw: 0, dpitch: 0, dragging: false };
  function placeCamera(tm) {
    const yaw = view.yaw + view.dyaw + (o.static ? 0 : Math.sin(tm * 0.18) * 0.06);
    const pitch = THREE.MathUtils.clamp(view.pitch + view.dpitch, 0.28, 0.9);
    camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * 160, target.y + Math.sin(pitch) * 160, target.z + Math.cos(yaw) * Math.cos(pitch) * 160);
    camera.lookAt(target);
  }

  scene.add(terrainMesh());
  scene.add(slabFrame());
  scene.add(road());
  [[-14, 4, 1.1], [-9, 6, 0.9], [-6, -1, 1.2], [-12, -6, 0.85], [-17, -2, 1.0], [-8, -7.5, 1.0], [-2, 4, 0.9], [-11, 1, 1.15], [-4, -6, 0.8],
   [-1, -12, 0.9], [1, 13, 0.8], [23, -13, 1.0], [26, -8, 0.85], [20, -16, 0.9], [-24, 14, 0.8], [-20, 10, 1.0], [16, -5, 0.75]]
    .forEach(([x, z, s]) => scene.add(tree(x, z, s)));
  const p1 = pylon(20, 3, 7.6, -0.75), p2 = pylon(6, 18.5, 7, -0.75);
  scene.add(p1, p2);
  scene.add(wire(p1.userData.tips[0], p2.userData.tips[0]), wire(p1.userData.tips[1], p2.userData.tips[1]));
  scene.add(wire(p1.userData.tips[2], p2.userData.tips[2], 0.9), wire(p1.userData.tips[3], p2.userData.tips[3], 0.9));

  const curve = routeCurve();
  const SEGS = 260;
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, SEGS, 0.11, 6, false), new THREE.MeshBasicMaterial({ color: ACCENT }));
  const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, SEGS, 0.38, 6, false), new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(tube, halo);
  const idxTotal = tube.geometry.index.count;
  const stationPos = curve.getPointAt(0);
  scene.add(station(stationPos.x, stationPos.z));

  const uav = drone(); scene.add(uav);
  const pulse = glowSprite('rgba(255,61,79,0.9)', 1.6); scene.add(pulse);
  const beacon = glowSprite('rgba(255,61,79,0.8)', 2.4); beacon.position.copy(stationPos).add(V(0, 1.2, 0)); scene.add(beacon);

  /* підписи */
  const LABELS = [
    { key: 'st', text: t('наземна станція', 'ground station'), at: curve.getPointAt(0).clone().add(V(0, 1.6, 0)), dy: -8 },
    { key: 'trees', text: t('над деревами', 'over the trees'), at: curve.getPointAt(0.30).clone().add(V(0, 1.2, 0)), dy: -6, when: 0.28 },
    { key: 'road', text: t('над дорогою', 'over the road'), at: curve.getPointAt(0.60).clone().add(V(0, 1.2, 0)), dy: -6, when: 0.58 },
    { key: 'wires', text: t('під проводами', 'under the wires'), at: curve.getPointAt(0.80).clone().add(V(0, -1.0, 0)), dy: 30, when: 0.78 },
    { key: 'uav', text: t('БпЛА · волокно з борту', 'UAV · fibre paid out from the airframe'), at: null, dy: -16, when: 0.02 },
  ];
  LABELS.forEach((l) => { l.el = document.createElement('span'); l.el.className = 'scene3d__lbl'; l.el.textContent = l.text; l.el.style.opacity = '0'; labelsHost.appendChild(l.el); l.bw = l.el.offsetWidth; l.bh = l.el.offsetHeight; });

  /* розмір */
  let w = 1, h = 1;
  function resize() {
    const r = host.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false);
    const aspect = w / h;
    const VH = Math.max(46, 80 / aspect);
    camera.left = -VH * aspect / 2; camera.right = VH * aspect / 2; camera.top = VH / 2; camera.bottom = -VH / 2;
    camera.updateProjectionMatrix();
    if (o.static) renderOnce();
  }
  const ro = new ResizeObserver(resize); ro.observe(host);

  /* обертання перетягуванням (тільки по горизонталі на телефоні — вертикаль лишається прокрутці) */
  let px = 0, py = 0;
  const onDown = (e) => { if (e.button !== undefined && e.button !== 0) return; view.dragging = true; px = e.clientX; py = e.clientY; host.classList.add('is-drag'); host.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => { if (!view.dragging) return; view.dyaw += (e.clientX - px) * 0.006; view.dpitch -= (e.clientY - py) * 0.004; view.dyaw = THREE.MathUtils.clamp(view.dyaw, -0.9, 0.9); px = e.clientX; py = e.clientY; if (o.static) renderOnce(); };
  const onUp = () => { view.dragging = false; host.classList.remove('is-drag'); };
  host.addEventListener('pointerdown', onDown); host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerup', onUp); host.addEventListener('pointercancel', onUp); host.addEventListener('pointerleave', onUp);

  /* анімація: політ 17 с → пауза 5 с → згасання 1 с → спочатку */
  const T_FLY = 17, T_HOLD = 5, T_FADE = 1.0, T_ALL = T_FLY + T_HOLD + T_FADE;
  const ease = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  let tm = 0, last = performance.now(), raf = 0, running = false;

  function project(p) { tmp2.copy(p).project(camera); return [(tmp2.x + 1) / 2 * w, (1 - tmp2.y) / 2 * h]; }
  function placeLabels(prog) {
    LABELS.forEach((l) => {
      const at = l.key === 'uav' ? uav.position.clone().add(V(0, 1.3, 0)) : l.at;
      const [x, y] = project(at);
      l.el.style.transform = `translate(${(x - l.bw / 2).toFixed(1)}px, ${(y + l.dy - l.bh).toFixed(1)}px)`;
      const on = l.when === undefined ? 1 : THREE.MathUtils.clamp((prog - l.when) / 0.05, 0, 1);
      l.el.style.opacity = String(on);
    });
  }
  function update(prog, dt) {
    const p = THREE.MathUtils.clamp(prog, 0, 1);
    const drawn = Math.floor(idxTotal * p / 6) * 6;
    tube.geometry.setDrawRange(0, drawn); halo.geometry.setDrawRange(0, drawn);
    const pos = curve.getPointAt(p); const tan = curve.getTangentAt(p);
    uav.position.copy(pos).add(V(0, 0.55 + Math.sin(tm * 2.2) * 0.12, 0));
    const yaw = Math.atan2(tan.x, tan.z);
    uav.rotation.set(0, yaw, 0);
    const speed = p < 1 ? 1 : 0;
    uav.rotateX(0.18 * speed); uav.rotation.z += Math.sin(tm * 1.3) * 0.04;
    uav.userData.rotors.forEach((r) => { r.rotation.y += dt * 38 * r.userData.dir; });
    // пульс сигналу від станції до дрона
    const q = (tm * 0.22) % 1;
    if (p > 0.03 && q < p) { pulse.visible = true; pulse.position.copy(curve.getPointAt(q)).add(V(0, 0.15, 0)); } else pulse.visible = false;
    beacon.material.opacity = 0.55 + 0.45 * Math.sin(tm * 3);
    placeLabels(p);
  }
  function setFade(f) {
    scene.traverse((obj) => { if (obj.material && obj.material.uniforms && obj.material.uniforms.uFade) obj.material.uniforms.uFade.value = f; });
    host.style.setProperty('--scene-fade', String(f));
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; tm += dt;
    const cyc = tm % T_ALL;
    let prog, fade = 1;
    if (cyc < T_FLY) prog = ease(cyc / T_FLY);
    else if (cyc < T_FLY + T_HOLD) prog = 1;
    else { prog = 1; fade = 1 - (cyc - T_FLY - T_HOLD) / T_FADE; }
    setFade(fade);
    placeCamera(tm);
    update(prog, dt);
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }
  function renderOnce() { placeCamera(0); update(1, 0); renderer.render(scene, camera); }

  function start() { if (running || o.static) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  /* innerHeight 0 — прихована панель прев’ю: вважаємо блок видимим */
  const io = new IntersectionObserver((ents) => ents.forEach((e) => ((e.isIntersecting || !innerHeight) && !document.hidden ? start() : stop())), { rootMargin: '80px 0px' });
  io.observe(host);
  const onVis = () => (document.hidden ? stop() : (io.takeRecords(), start()));
  document.addEventListener('visibilitychange', onVis);

  resize();
  if (o.static) renderOnce();

  return {
    /* для налагодження/скріншотів: перемотати на момент часу й відрендерити один кадр */
    seek(sec) { stop(); tm = sec - 0.016; last = performance.now() - 16; running = false; frame(performance.now()); },
    destroy() {
      stop(); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis);
      scene.traverse((obj) => { obj.geometry?.dispose?.(); if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => { m.map?.dispose?.(); m.dispose(); }); });
      renderer.dispose();
    },
  };
}
