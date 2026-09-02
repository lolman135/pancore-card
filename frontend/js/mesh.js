/* ============================================================
   PANCORE — інтерактивне поле граней (WebGL, three.js)

   Ключовий візуальний елемент сайту. Підрозділена площина, яку
   в реальному часі деформує шум (GPU, вершинний шейдер), з
   трьома шарами відображення в одному матеріалі:
     • грані   — напівпрозорі трикутники, яскравість залежить від
                 кута до камери (френель) і від відстані до курсору;
     • ребра   — світні лінії по барицентричних координатах
                 (антиаліасинг через fwidth, без wireframe-режиму);
     • вершини — точки-вузли, частина з них «зірки».
   Плюс задній шар (той самий меш далі від камери, без ребер) для
   глибини. Курсор притягує вершини та «піднімає» поверхню.

   Використання:
     import { createMesh } from './mesh.js';
     const mesh = createMesh(canvasEl, { density: 1 });
     mesh.setIntensity(0.4);   // приглушити (на скролі)
     mesh.destroy();
   ============================================================ */

import * as THREE from 'three';

const NOISE_GLSL = /* glsl */`
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`;

/* Деформація має залежати ТІЛЬКИ від базової позиції та часу:
   вершини трикутників продубльовані (не індексована геометрія),
   і сусідні грані мають отримати однакове зміщення. */
const DISPLACE_GLSL = /* glsl */`
  uniform float uTime;
  uniform vec2  uPointer;
  uniform float uPointerK;   // 0..1 — наскільки активний курсор
  uniform float uRadius;     // радіус впливу курсору (світові одиниці)
  uniform float uAmp;        // амплітуда рельєфу

  float pointerWeight(vec2 p){
    float d = distance(uPointer, p);
    float w = 1.0 - smoothstep(0.0, uRadius, d);
    return w * w * uPointerK;
  }

  /* зональна маска: сітка не рівномірна — є щільні світлі згустки
     і темні провали, які повільно пливуть */
  float zoneMask(vec2 p){
    float t = uTime;
    float z = snoise(p * 0.085 + vec2(t * 0.012, t * 0.009)) * 0.6
            + snoise(p * 0.21 - vec2(t * 0.02, t * 0.015)) * 0.4;
    return smoothstep(-0.55, 0.75, z);
  }

  vec3 displace(vec3 p){
    float t = uTime;
    float n1 = snoise(p.xy * 0.19 + vec2(t * 0.05, -t * 0.037));
    float n2 = snoise(p.xy * 0.47 - vec2(t * 0.08,  t * 0.06));
    float n3 = snoise(p.xy * 1.10 + vec2(-t * 0.11, t * 0.09));
    float z = (n1 * 1.25 + n2 * 0.45 + n3 * 0.12) * uAmp;

    // легке «дихання» в площині
    p.xy += vec2(snoise(p.xy * 0.35 + t * 0.04), snoise(p.yx * 0.35 - t * 0.04)) * 0.14;

    // курсор: притягання в площині + підняття поверхні
    vec2 d = uPointer - p.xy;
    float dist = max(length(d), 1e-3);
    float w = pointerWeight(p.xy);
    p.xy += (d / dist) * w * 0.55 * min(dist, 1.0);
    z += w * 1.15;

    return vec3(p.xy, z);
  }
`;

const FACET_VERT = /* glsl */`
  attribute vec3  aBary;
  attribute float aFid;
  varying vec3  vW;
  varying vec3  vB;
  varying float vFid;
  varying float vK;
  varying float vZ;
  ${NOISE_GLSL}
  ${DISPLACE_GLSL}
  void main(){
    vec3 p = displace(position);
    vec4 w = modelMatrix * vec4(p, 1.0);
    vW = w.xyz;
    vB = aBary;
    vFid = aFid;
    vK = pointerWeight(position.xy);
    vZ = zoneMask(position.xy);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const FACET_FRAG = /* glsl */`
  precision highp float;
  uniform vec3  uAccent;
  uniform vec3  uAccent2;
  uniform vec3  uDeep;
  uniform vec3  uCam;
  uniform float uEdge;
  uniform float uFill;
  uniform float uFade;
  uniform float uNear;
  uniform float uFar;
  varying vec3  vW;
  varying vec3  vB;
  varying float vFid;
  varying float vK;
  varying float vZ;

  void main(){
    // плоска нормаль грані з похідних світової позиції
    vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
    vec3 v = normalize(uCam - vW);
    float fr = pow(1.0 - abs(dot(n, v)), 2.2);
    float rnd = fract(sin(vFid * 12.9898) * 43758.5453);
    rnd = rnd * rnd;                       // більшість граней темні, окремі — яскраві
    float zone = 0.12 + vZ * 0.88;         // зональна маска (згустки / провали)

    // заливка грані
    vec3  fillCol = mix(uDeep, uAccent, clamp(fr * 0.9 + rnd * 0.35, 0.0, 1.0));
    float fill = uFill * (0.18 + rnd * 0.82) * (0.20 + fr * 1.1) * zone + vK * 0.4;

    // ребра (антиаліасинг по ширині пікселя)
    float d = min(vB.x, min(vB.y, vB.z));
    float w = fwidth(d);
    float line = 1.0 - smoothstep(0.0, w * 1.5, d);
    vec3  edgeCol = mix(uAccent, uAccent2, clamp(vK * 1.4, 0.0, 1.0));
    float edge = line * uEdge * ((0.22 + rnd * 0.45 + fr * 0.4) * zone + vK * 1.2);

    // глибина: далекі грані гаснуть (edge0 < edge1 — інакше smoothstep невизначений)
    float fade = 1.0 - smoothstep(uNear, uFar, distance(uCam, vW));

    vec3 col = (fillCol * fill + edgeCol * edge) * fade * uFade;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const POINT_VERT = /* glsl */`
  attribute float aSize;
  attribute float aStar;
  uniform float uDpr;
  uniform vec3  uCam;
  uniform float uNear;
  uniform float uFar;
  varying float vA;
  varying float vStar;
  varying float vK;
  ${NOISE_GLSL}
  ${DISPLACE_GLSL}
  void main(){
    vec3 p = displace(position);
    vec4 w = modelMatrix * vec4(p, 1.0);
    vec4 mv = viewMatrix * w;
    float k = pointerWeight(position.xy);
    vK = k; vStar = aStar;
    vA = (1.0 - smoothstep(uNear, uFar, distance(uCam, w.xyz))) * (0.25 + 0.75 * zoneMask(position.xy));
    gl_PointSize = (aSize * (1.0 + k * 1.8) + aStar * 3.0) * uDpr * (52.0 / max(-mv.z, 1.0));
    gl_Position = projectionMatrix * mv;
  }
`;

const POINT_FRAG = /* glsl */`
  precision highp float;
  uniform vec3  uAccent;
  uniform vec3  uAccent2;
  uniform float uFade;
  varying float vA;
  varying float vStar;
  varying float vK;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c) * 2.0;
    float core = smoothstep(0.55, 0.0, r);
    float halo = smoothstep(1.0, 0.0, r) * 0.35;
    vec3 col = mix(uAccent, vec3(1.0, 0.93, 0.94), vStar * 0.85 + vK * 0.5);
    col = mix(col, uAccent2, vK * 0.4);
    float a = (core * (0.55 + vStar * 0.45 + vK * 0.6) + halo * (0.5 + vStar)) * vA * uFade;
    gl_FragColor = vec4(col * a, 1.0);
  }
`;

function hexToVec(hex) {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

/* Побудова геометрії: сітка з джиттером + випадкова діагональ у
   кожній клітинці (сітка виглядає «живою»). Повертає не індексовану
   геометрію граней і геометрію точок з унікальних вершин. */
function buildGeometry(cols, rows, w, h, seed) {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  const dx = w / (cols - 1), dy = h / (rows - 1);
  const pts = new Float32Array(cols * rows * 3);
  const sizes = new Float32Array(cols * rows);
  const stars = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      pts[i * 3]     = -w / 2 + c * dx + (rand() - 0.5) * dx * 0.8;
      pts[i * 3 + 1] = -h / 2 + r * dy + (rand() - 0.5) * dy * 0.8;
      pts[i * 3 + 2] = 0;
      sizes[i] = 0.7 + rand() * 1.6;
      stars[i] = rand() < 0.09 ? 1 : 0;
    }
  }

  const tris = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
      if (rand() < 0.5) { tris.push(a, b, e, a, e, d); } else { tris.push(a, b, d, b, e, d); }
    }
  }

  const n = tris.length;
  const pos = new Float32Array(n * 3);
  const bary = new Float32Array(n * 3);
  const fid = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = tris[i];
    pos[i * 3] = pts[v * 3]; pos[i * 3 + 1] = pts[v * 3 + 1]; pos[i * 3 + 2] = 0;
    const k = i % 3;
    bary[i * 3 + k] = 1;
    fid[i] = Math.floor(i / 3);
  }

  const facets = new THREE.BufferGeometry();
  facets.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  facets.setAttribute('aBary', new THREE.BufferAttribute(bary, 3));
  facets.setAttribute('aFid', new THREE.BufferAttribute(fid, 1));

  const points = new THREE.BufferGeometry();
  points.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  points.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  points.setAttribute('aStar', new THREE.BufferAttribute(stars, 1));

  return { facets, points };
}

export function createMesh(canvas, opts = {}) {
  const o = Object.assign({
    density: 1,              // 1 — герой; 0.6 — компактніша смуга
    accent: '#ff3d4f',
    accent2: '#ffb0a0',
    deep: '#4a0d1c',
    background: '#07080b',
    edge: 0.85,
    fill: 0.7,
    static: false,           // без анімації (prefers-reduced-motion)
  }, opts);

  let renderer;
  try {
    // antialias вимкнено свідомо: ребра згладжуються в шейдері (fwidth), а MSAA на
    // повноекранному адитивному полотні — найдорожча частина кадру
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.style.display = 'none';
    return { setIntensity() {}, pause() {}, resume() {}, destroy() {}, ok: false };
  }
  const coarse = matchMedia('(pointer: coarse)').matches;
  // роздільність рендера нижча за екранну — грані м'які, різниці не видно, а пікселів удвічі менше
  let dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.25);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(new THREE.Color(o.background), 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
  camera.position.set(0, -4.2, 9.2);
  camera.lookAt(0, 0.9, 0);

  const cols = Math.round((coarse ? 22 : 36) * o.density) + 6;
  const rows = Math.round((coarse ? 26 : 22) * o.density) + 6;
  const W = 30, H = 20;

  const uniforms = {
    uTime:     { value: 0 },
    uPointer:  { value: new THREE.Vector2(1e3, 1e3) },
    uPointerK: { value: 0 },
    uRadius:   { value: 3.2 },
    uAmp:      { value: 1.0 },
    uAccent:   { value: hexToVec(o.accent) },
    uAccent2:  { value: hexToVec(o.accent2) },
    uDeep:     { value: hexToVec(o.deep) },
    uCam:      { value: camera.position },
    uEdge:     { value: o.edge },
    uFill:     { value: o.fill },
    uFade:     { value: 1 },
    uNear:     { value: 9 },
    uFar:      { value: 26 },
    uDpr:      { value: dpr },
  };

  const front = buildGeometry(cols, rows, W, H, 1337);
  const facetMat = new THREE.ShaderMaterial({
    vertexShader: FACET_VERT, fragmentShader: FACET_FRAG, uniforms,
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const pointMat = new THREE.ShaderMaterial({
    vertexShader: POINT_VERT, fragmentShader: POINT_FRAG, uniforms,
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const facets = new THREE.Mesh(front.facets, facetMat);
  const points = new THREE.Points(front.points, pointMat);
  scene.add(facets, points);

  // задній шар: власні uniform-и (менша амплітуда, без курсору, без ребер)
  const back = buildGeometry(Math.round(cols * 0.6), Math.round(rows * 0.6), W * 1.5, H * 1.5, 4242);
  const backUniforms = Object.assign({}, uniforms, {
    uPointerK: { value: 0 },
    uEdge: { value: 0.22 },
    uFill: { value: 0.3 },
    uAmp: { value: 1.6 },
    uNear: { value: 12 },
    uFar: { value: 30 },
    uFade: { value: 1 },
    uTime: uniforms.uTime,
  });
  const backMesh = new THREE.Mesh(back.facets, new THREE.ShaderMaterial({
    vertexShader: FACET_VERT, fragmentShader: FACET_FRAG, uniforms: backUniforms,
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  backMesh.position.z = -7;
  scene.add(backMesh);

  // ---- курсор → точка на площині z=0
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  const target = new THREE.Vector2(1e3, 1e3);
  let targetK = 0;

  function onMove(x, y) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) { target.set(hit.x, hit.y); targetK = 1; }
  }
  const onMouse = (e) => onMove(e.clientX, e.clientY);
  const onTouch = (e) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); };
  const onLeave = () => { targetK = 0; };
  if (!o.static) {
    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchend', onLeave);
    document.addEventListener('mouseleave', onLeave);
  }

  // ---- розмір
  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // на вузьких екранах відсуваємо камеру, щоб сітка лишалась суцільною
    camera.position.z = camera.aspect < 0.8 ? 12.5 : camera.aspect < 1.2 ? 10.5 : 9.2;
    camera.lookAt(0, 0.9, 0);
    // зміна розміру очищає полотно — одразу малюємо кадр, не чекаючи rAF
    if (scene.children.length) renderer.render(scene, camera);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  // перший кадр одразу (до rAF): полотно не лишається порожнім у прихованій вкладці
  renderer.render(scene, camera);

  // ---- цикл
  let raf = 0, last = performance.now(), running = true, intensity = 1, paused = false;
  const clock = { t: 0 };
  // адаптивна якість: якщо кадр стабільно повільний — знижуємо роздільність рендера
  let acc = 0, n = 0;
  function adapt(dt) {
    acc += dt; n++;
    if (n < 90) return;
    const avg = acc / n; acc = 0; n = 0;
    if (avg > 0.024 && dpr > 0.75) {
      dpr = Math.max(0.75, +(dpr - 0.25).toFixed(2));
      renderer.setPixelRatio(dpr);
      uniforms.uDpr.value = dpr;
      resize();
    }
  }
  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!o.static) adapt(dt);
    clock.t += dt * (o.static ? 0 : 1);
    uniforms.uTime.value = clock.t;

    // плавний курсор
    const cur = uniforms.uPointer.value;
    if (targetK > 0 && cur.x > 500) cur.copy(target);
    cur.lerp(target, 1 - Math.pow(0.001, dt));
    uniforms.uPointerK.value += (targetK - uniforms.uPointerK.value) * (1 - Math.pow(0.02, dt));
    uniforms.uFade.value += (intensity - uniforms.uFade.value) * (1 - Math.pow(0.01, dt));
    backUniforms.uFade.value = uniforms.uFade.value;

    renderer.render(scene, camera);
    if (!o.static) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function stop() { running = false; cancelAnimationFrame(raf); }
  function start() {
    if (running || o.static) return;
    running = true; last = performance.now(); raf = requestAnimationFrame(frame);
  }
  // пауза на прихованій вкладці
  const onVis = () => { if (document.hidden) stop(); else if (!paused) start(); };
  document.addEventListener('visibilitychange', onVis);

  return {
    ok: true,
    renderer, scene, camera, uniforms,   // для діагностики
    setIntensity(v) {
      if (!Number.isFinite(v)) return;
      intensity = Math.max(0, Math.min(1, v));
      if (o.static) { uniforms.uFade.value = intensity; backUniforms.uFade.value = intensity; renderer.render(scene, camera); }
    },
    pause() { if (!paused) { paused = true; stop(); } },
    resume() { if (paused) { paused = false; if (!document.hidden) start(); } },
    render() { renderer.render(scene, camera); },
    destroy() {
      running = false; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('mousemove', onMouse); window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', onLeave); document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
      front.facets.dispose(); front.points.dispose(); back.facets.dispose(); back.points.dispose();
      facetMat.dispose(); pointMat.dispose(); backMesh.material.dispose(); renderer.dispose();
    },
  };
}
