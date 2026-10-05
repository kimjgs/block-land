/* 숫자 친구 1~10을 진짜 3D(three.js)로 그려서 그림(PNG)으로 바꿔 끼운다.
   three.js를 못 불러오면(인터넷이 끊긴 첫 실행 등) 기존 그림을 그대로 쓴다. */
(function () {
  if (!window.THREE || !window.FR) return;
  const T = THREE;
  const RB = ['#F2453D', '#FF8C2A', '#FFD230', '#4CC34A', '#3E9BFF', '#5A54D9', '#E040A8'];
  const BODY = { 1: RB[0], 2: RB[1], 3: RB[2], 4: RB[3], 5: RB[4], 6: RB[5], 7: 'rainbow', 8: RB[6], 9: '#9C8BC4', 10: '#FFFFFF' };
  const V = (n) => Array.from({ length: n }, (_, i) => [0, i]);
  const G = (c, r) => { const a = []; for (let i = 0; i < c; i++) for (let j = 0; j < r; j++) a.push([i, j]); return a; };
  const CELLS = { 1: V(1), 2: V(2), 3: V(3), 4: G(2, 2), 5: V(5), 6: G(2, 3), 7: [...V(5), [1, 3], [1, 4]], 8: G(2, 4), 9: G(3, 3), 10: G(2, 5) };
  const MOUTH = { 1: 'big', 2: 'smile', 3: 'o', 4: 'grin', 5: 'big', 6: 'smile', 7: 'smile', 8: 'big', 9: 'grin', 10: 'big' };
  const POSE = { 1: [['down', 'wave'], ['down', 'up']], 2: [['down', 'wave'], ['up', 'up']], 3: [['out', 'wave'], ['wave', 'out']], 5: [['up', 'up'], ['down', 'down']], 7: [['out', 'wave'], ['wave', 'up']] };
  const poseOf = (n, alt) => { const p = POSE[n]; return p ? (alt && p[1] ? p[1] : p[0]) : ['down', 'wave']; };

  /* ---------- 렌더러, 환경 ---------- */
  const canvas = document.createElement('canvas');
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true }); } catch (e) { return; }
  renderer.outputEncoding = T.sRGBEncoding; renderer.setClearColor(0x000000, 0); renderer.setPixelRatio(1);
  const lin = (hex) => new T.Color(hex).convertSRGBToLinear();

  const envScene = new T.Scene();
  { // 부드러운 스튜디오 조명 (빛 반사용)
    const g = new T.SphereGeometry(40, 32, 16), cols = [], p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = (p.getY(i) / 40 + 1) / 2, c = new T.Color().setRGB(.55 + .5 * t, .65 + .45 * t, .85 + .3 * t); cols.push(c.r, c.g, c.b); }
    g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
    envScene.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    const box = (w, h, x, y, z, k) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(k, k, k), side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m); };
    box(22, 14, -14, 20, 22, 6); box(14, 20, 24, 8, 8, 3.5); box(30, 6, 0, 30, -4, 4);
  }
  const pmrem = new T.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(envScene, .04).texture;

  const scene = new T.Scene(); scene.environment = envTex;
  scene.add(new T.HemisphereLight(0xffffff, 0x8a96d8, .32));
  const key = new T.DirectionalLight(0xffffff, .8); key.position.set(3, 7, 6); scene.add(key);
  const fill = new T.DirectionalLight(0xffe6d6, .22); fill.position.set(-5, 2, 4); scene.add(fill);

  /* ---------- 부품 ---------- */
  const geoCache = {};
  function roundedBox(w, h, d, r, seg = 6) {
    const k = [w, h, d, r].join('_'); if (geoCache[k]) return geoCache[k];
    const g = new T.BoxGeometry(w, h, d, seg, seg, seg), pos = g.attributes.position, nor = g.attributes.normal;
    const v = new T.Vector3(), inner = new T.Vector3(), n = new T.Vector3(), hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r;
    const cl = (x, a) => Math.max(-a, Math.min(a, x));
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i); inner.set(cl(v.x, hw), cl(v.y, hh), cl(v.z, hd)); n.copy(v).sub(inner);
      if (n.lengthSq() > 1e-9) { n.normalize(); v.copy(inner).addScaledVector(n, r); nor.setXYZ(i, n.x, n.y, n.z); }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    return (geoCache[k] = g);
  }
  const matCache = {};
  function mat(hex, o = {}) {
    const k = hex + JSON.stringify(o); if (matCache[k]) return matCache[k];
    return (matCache[k] = new T.MeshPhysicalMaterial({ color: lin(hex), roughness: o.rough ?? .3, metalness: o.metal ?? 0, clearcoat: o.coat ?? .85, clearcoatRoughness: .18, envMapIntensity: o.env ?? .5 }));
  }
  const dark = (hex, a) => '#' + new T.Color(hex).multiplyScalar(1 - a).getHexString();
  const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); return o; };
  const sph = (r, m, x, y, z) => mesh(new T.SphereGeometry(r, 24, 16), m, x, y, z);
  const tube = (pts, r, m) => mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p))), 24, r, 12, false), m);

  /* ---------- 얼굴 (캔버스에 그려서 앞면에 붙임) ---------- */
  function faceTexture(W, p) {
    const H = 256, cv = document.createElement('canvas'); cv.width = 256 * W; cv.height = H; const c = cv.getContext('2d');
    const cx = cv.width / 2, cy = 112, INK = '#22223A', sep = 50 + (W - 1) * 24, sc = 1 + (W - 1) * .1;
    c.lineCap = 'round'; c.lineJoin = 'round';
    const eye = (ex, kind) => {
      if (kind === 'happy') { c.strokeStyle = INK; c.lineWidth = 12; c.beginPath(); c.arc(ex, cy + 14, 26 * sc, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); return; }
      if (kind === 'closed') { c.strokeStyle = INK; c.lineWidth = 12; c.beginPath(); c.arc(ex, cy - 10, 26 * sc, Math.PI * .15, Math.PI * .85); c.stroke(); return; }
      const wide = kind === 'wide', rx = (wide ? 33 : 30) * sc, ry = (wide ? 43 : 39) * sc;
      c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.ellipse(ex, cy, rx, ry, 0, 0, 7); c.fill(); c.stroke();
      const look = kind === 'look', px = ex + (look ? 12 : 5) * sc, py = cy + (look ? -12 : 8) * sc;
      c.fillStyle = INK; c.beginPath(); c.ellipse(px, py, (wide ? 11 : 17) * sc, (wide ? 14 : 24) * sc, 0, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(px + 8 * sc, py - 10 * sc, 7 * sc, 0, 7); c.fill(); c.beginPath(); c.arc(px - 5 * sc, py + 12 * sc, 3 * sc, 0, 7); c.fill();
    };
    [-1, 1].forEach((s) => {
      const ex = cx + s * sep; let kind = p.eyes; if (kind === 'wink') kind = s === 1 ? 'happy' : 'normal'; eye(ex, kind);
      c.strokeStyle = INK; c.lineWidth = 9;
      if (p.brows === 'worried') { c.beginPath(); c.moveTo(ex + s * 28 * sc, cy - 54 * sc); c.lineTo(ex - s * 26 * sc, cy - 72 * sc); c.stroke(); }
      else if (p.brows !== 'none') { const lift = (p.brows === 'up' || (p.brows === 'curious' && s === -1)) ? 14 : 0; c.beginPath(); c.moveTo(ex - 26 * sc, cy - 60 * sc - lift); c.quadraticCurveTo(ex, cy - 78 * sc - lift, ex + 26 * sc, cy - 60 * sc - lift); c.stroke(); }
      c.fillStyle = 'rgba(255,100,130,.38)'; c.beginPath(); c.ellipse(cx + s * (sep + 38 * sc), cy + 52, 22, 13, 0, 0, 7); c.fill();
    });
    const my = cy + 66; c.strokeStyle = INK; c.lineWidth = 7;
    const m = p.mouth;
    if (m === 'smile' || m === 'big') {
      const w = m === 'big' ? 46 : 34, d = m === 'big' ? 66 : 48;
      c.fillStyle = '#6B1F2E'; c.beginPath(); c.moveTo(cx - w, my - 4); c.quadraticCurveTo(cx, my + d, cx + w, my - 4); c.closePath(); c.fill(); c.stroke();
      if (m === 'big') { c.fillStyle = '#fff'; c.fillRect(cx - w * .72, my - 3, w * 1.44, 11); }
      c.fillStyle = '#FF7A93'; c.beginPath(); c.ellipse(cx, my + d * .5, w * .38, 11, 0, 0, 7); c.fill();
    } else if (m === 'grin') { c.lineWidth = 11; c.beginPath(); c.moveTo(cx - 34, my); c.quadraticCurveTo(cx, my + 36, cx + 34, my); c.stroke(); }
    else if (m === 'o') { c.fillStyle = '#6B1F2E'; c.beginPath(); c.ellipse(cx, my + 14, 19, 26, 0, 0, 7); c.fill(); c.stroke(); }
    else if (m === 'frown') { c.lineWidth = 11; c.beginPath(); c.moveTo(cx - 30, my + 28); c.quadraticCurveTo(cx, my - 2, cx + 30, my + 28); c.stroke(); }
    else if (m === 'flat') { c.lineWidth = 11; c.beginPath(); c.moveTo(cx - 22, my + 14); c.lineTo(cx + 22, my + 14); c.stroke(); }
    else if (m === 'wavy') { c.lineWidth = 10; c.beginPath(); c.moveTo(cx - 36, my + 16); c.bezierCurveTo(cx - 24, my, cx - 12, my, cx, my + 16); c.bezierCurveTo(cx + 12, my + 32, cx + 24, my + 32, cx + 36, my + 16); c.stroke(); }
    const tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding; tex.anisotropy = 4; return tex;
  }

  /* ---------- 소품 ---------- */
  function accessory(n, g, ctx) {
    const { cx, top, W } = ctx; // cx: 머리 가운데 x, top: 맨 윗줄 윗면 y
    const gold = mat('#FFC21A', { rough: .25, metal: .55 }), ink = mat('#2E2E44', { rough: .5, coat: .3 });
    const add = (o) => { g.add(o); return o; };
    if (n === 1) { add(mesh(new T.CylinderGeometry(.035, .035, 1.1, 10), mat('#8A6A3A', { coat: 0 }), cx + .22, top + .55, 0)); const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(.6, -.18); sh.lineTo(0, -.36); const f = mesh(new T.ShapeGeometry(sh), new T.MeshStandardMaterial({ color: lin('#FFD230'), side: T.DoubleSide }), cx + .24, top + 1.08, 0); add(f); }
    if (n === 2) { const gm = mat('#2E2E44', { coat: .2 }); [-.3, .3].forEach((s) => add(mesh(new T.TorusGeometry(.27, .035, 10, 32), gm, cx + s * (W > 1 ? 1.4 : 1), ctx.eyeY, .53))); add(mesh(new T.CylinderGeometry(.025, .025, .18, 8), gm, cx, ctx.eyeY + .03, .53)).rotation.z = Math.PI / 2; }
    if (n === 3) { const b = add(mesh(new T.CylinderGeometry(.34, .38, .18, 24), gold, cx, top + .07, 0)); for (let i = 0; i < 3; i++) { const x = cx + (i - 1) * .27; add(mesh(new T.ConeGeometry(.12, .34, 16), gold, x, top + .3, 0)); add(sph(.065, mat('#FF5A7A', { rough: .15 }), x, top + .5, 0)); } }
    if (n === 4) { add(mesh(new T.CylinderGeometry(.3, .32, .22, 20), ink, cx, top + .08, 0)); const bd = add(mesh(roundedBox(1.35, .07, 1.35, .02, 2), ink, cx, top + .24, 0)); bd.rotation.y = Math.PI / 4; add(tube([[cx, top + .27, 0], [cx + .55, top + .26, .55], [cx + .6, top - .05, .6]], .018, gold)); add(sph(.06, gold, cx + .6, top - .08, .6)); }
    if (n === 5) { const sh = new T.Shape(), R = .3, r = .13; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } sh.closePath(); const s = add(mesh(new T.ExtrudeGeometry(sh, { depth: .1, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 2 }), mat('#FFD230', { rough: .2, metal: .3 }), cx + .3, top + .12, .15)); s.rotation.z = -.2; }
    if (n === 6) { const am = mat('#2E2E44', { coat: 0 }), bm = mat('#7C77F0'); [-1, 1].forEach((s) => { add(tube([[cx + s * .2, top, 0], [cx + s * .3, top + .35, 0], [cx + s * .55, top + .6, 0]], .03, am)); add(sph(.09, bm, cx + s * .55, top + .62, 0)); }); }
    if (n === 7) { add(mesh(new T.CylinderGeometry(.5, .5, .06, 28), ink, cx, top + .03, 0)); add(mesh(new T.CylinderGeometry(.32, .34, .62, 28), ink, cx, top + .36, 0)); add(mesh(new T.CylinderGeometry(.345, .345, .1, 28), mat('#E040A8'), cx, top + .17, 0)); }
    if (n === 9) { const bm = mat('#3E9BFF'); [-1, 1].forEach((s) => { const c = add(mesh(new T.ConeGeometry(.17, .38, 3), bm, cx + s * .21, ctx.chinY, .55)); c.rotation.z = -s * Math.PI / 2; }); add(sph(.1, mat('#1F6FCC'), cx, ctx.chinY, .56)); }
    if (n === 10) { const sm = new T.MeshStandardMaterial({ color: lin('#F2453D'), roughness: .5 }); const len = Math.hypot(1.25, 3.4); const b = add(mesh(new T.BoxGeometry(len, .34, .05), sm, cx, -2, .52)); b.rotation.z = -Math.atan2(3.4, 1.25); add(sph(.2, mat('#FFD230', { metal: .4 }), cx, -2, .56)).scale.z = .3; }
  }

  /* ---------- 캐릭터 한 장면 만들기 ---------- */
  function build(n, o) {
    const sp = o.spec, an = sp && sp.acc != null ? sp.acc : n;
    const g = new T.Group(), cells = sp ? sp.cells : CELLS[n], cols = Math.max(...cells.map((c) => c[0])) + 1, rows = Math.max(...cells.map((c) => c[1])) + 1;
    const col = sp ? sp.rowColor(0) : BODY[n], isRb = !sp && col === 'rainbow';
    const cubeG = roundedBox(.96, .96, .96, .22);
    cells.forEach(([c, r]) => { const hex = sp ? sp.rowColor(r) : isRb ? RB[(rows - 1 - r) % 7] : col; const lit = sp && sp.lit && r >= rows - sp.lit; const m = lit ? new T.MeshPhysicalMaterial({ color: lin(hex), emissive: lin(hex), emissiveIntensity: .38, roughness: .3, clearcoat: .85, clearcoatRoughness: .18 }) : mat(hex, n === 10 && !sp ? { rough: .22, coat: 1 } : {}); const mm = mesh(cubeG, m, c, -r, 0); if (n === 10 && !sp) { const edge = mesh(roundedBox(1.0, 1.0, 1.0, .24), new T.MeshBasicMaterial({ color: lin('#F2453D'), side: T.BackSide }), c, -r, 0); g.add(edge); } g.add(mm); });
    const armHex = sp ? sp.rowColor(0) : isRb ? RB[0] : n === 10 ? '#F2453D' : n === 9 ? '#8E7BB5' : col, am = mat(dark(armHex, .1), { rough: .35 });
    const topCells = cells.filter((c) => c[1] === 0), x0 = Math.min(...topCells.map((c) => c[0])), x1 = Math.max(...topCells.map((c) => c[0])), W = x1 - x0 + 1, cx = (x0 + x1) / 2;
    // 얼굴
    if (o.v2face) o.v2face(g, { cx, W, face: o.face }); // 새 아트(3D 얼굴)
    else { const tex = faceTexture(W, o.face), fp = new T.Mesh(new T.PlaneGeometry(W * .96, .96), new T.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
      fp.position.set(cx, 0, .49); g.add(fp); }
    // 팔
    const armRow = rows <= 2 ? 0 : 1, rc = cells.filter((c) => c[1] === armRow).map((c) => c[0]), L = Math.min(...rc) - .5, R = Math.max(...rc) + .5, ay = -armRow - .05;
    const HAND = { down: [-.55, -1.0], wave: [.62, .95], up: [.42, 1.25], out: [1.0, .12] };
    const SW = { sw1: [.3, -.97], sw2: [.62, -.8] }; // 걸을 때 팔 흔들기
    const arm = (side, pose, yy) => { const sx = side < 0 ? L : R, [dx, dy] = SW[pose] ? [0, SW[pose][1]] : HAND[pose], hx = SW[pose] ? sx + side * SW[pose][0] : sx + side * (pose === 'down' ? .5 : pose === 'out' ? .3 : .35) * 1 + (pose === 'wave' || pose === 'up' ? side * dx * .55 : pose === 'out' ? side * dx * .5 : side * .0);
      const hy = yy + dy, hz = .15; const mid = [(sx + hx) / 2 + side * .18, yy + dy * .25 - (pose === 'down' ? .05 : -.12), .05];
      g.add(tube([[sx - side * .08, yy, 0], mid, [hx, hy, hz]], .12, am)); g.add(sph(.2, mat(dark(armHex, .05), { rough: .3 }), hx, hy, hz)); };
    if (n === 8) { for (let i = 0; i < 4; i++) { arm(-1, i === 0 ? 'wave' : 'down', -i - .05 - (i === 0 ? 0 : .0)); arm(1, i === 0 ? 'wave' : 'down', -i - .05); } }
    else { const [lp, rp] = o.pose; arm(-1, lp, ay); arm(1, rp, ay); }
    // 다리
    const low = cells.filter((c) => c[1] === rows - 1).map((c) => c[0]), lowL = Math.min(...low), lowR = Math.max(...low), fy = -(rows - 1) - .5;
    const legX = lowL === lowR ? [lowL - .2, lowL + .2] : [lowL, lowR];
    const st = o.step || 0; // 걸음: 1이면 왼발, -1이면 오른발을 든다
    legX.forEach((x, i) => { const up = (i === 0 ? st > 0 : st < 0) ? .16 : 0; g.add(mesh(new T.CylinderGeometry(.11, .11, .32, 14), am, x, fy - .1 + up * .6, .05)); const shoe = sph(.3, mat('#3A3A50', { rough: .45, coat: .5 }), x + .04, fy - .3 + up, .16 + up * .6); shoe.scale.set(1.15, .52, 1.45); shoe.rotation.x = up ? -.35 : 0; g.add(shoe); });
    // 소품
    accessory(an, g, { cx, top: .48, W, eyeY: .02, chinY: -.5 });
    // 가운데 맞추기
    const bb = new T.Box3().setFromObject(g), ctr = new T.Vector3(); bb.getCenter(ctr);
    g.position.x = -((Math.max(...cells.map((c) => c[0])) / 2)); g.rotation.y = -.24;
    return { g, bb };
  }

  const shadowTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'), gr = c.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(20,20,50,.38)'); gr.addColorStop(1, 'rgba(20,20,50,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); return new T.CanvasTexture(cv); })();

  function renderFrame(n, o) {
    const built = build(n, o), g = built.g; let bb = built.bb;
    if (o.ref) { const r = build(n, { ...o, pose: o.ref, step: 0 }); bb = r.bb; r.g.traverse((x) => { if (x.material && x.material.map && x.material.map.isCanvasTexture) x.material.map.dispose(); }); } // 걷기 그림도 '기본'과 같은 크기로
    scene.add(g);
    const sz = new T.Vector3(); bb.getSize(sz);
    const width = Math.max(sz.x + (n === 8 ? 1.3 : 1.7), 2.8), top = bb.max.y + .35, bottom = bb.min.y - .55, height = top - bottom;
    const PX = 78, wpx = Math.round(width * PX), hpx = Math.round(height * PX);
    renderer.setSize(wpx, hpx, false); canvas.width = wpx; canvas.height = hpx;
    const sh = new T.Mesh(new T.PlaneGeometry(width * .78, 1.1), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(0, bb.min.y - .2, .2); scene.add(sh);
    const fov = 12, cam = new T.PerspectiveCamera(fov, wpx / hpx, .1, 200), t = Math.tan(fov * Math.PI / 360);
    const D = Math.max((height / 2) / t, (width / 2) / (t * (wpx / hpx))), cy = (top + bottom) / 2;
    cam.position.set(0, cy + D * .13, D); cam.lookAt(0, cy, 0);
    renderer.render(scene, cam);
    const url = canvas.toDataURL('image/png');
    scene.remove(g); scene.remove(sh); sh.geometry.dispose(); sh.material.dispose();
    g.traverse((x) => { if (x.material && x.material.map && x.material.map.isCanvasTexture) x.material.map.dispose(); });
    return { url, w: wpx, h: hpx, feet: (top - bb.min.y) * PX };
  }

  /* 표정 → 얼굴 설정 */
  function faceOf(n, key) {
    const m = MOUTH[n], eyes0 = n === 7 ? 'wink' : 'normal', br0 = n === 6 ? 'curious' : 'normal';
    const F = {
      기본: { eyes: eyes0, mouth: m, brows: br0 }, 기쁨: { eyes: 'happy', mouth: 'big', brows: 'normal' }, 놀람: { eyes: 'wide', mouth: 'o', brows: 'up' },
      걱정: { eyes: 'normal', mouth: 'wavy', brows: 'worried' }, 속상: { eyes: 'normal', mouth: 'frown', brows: 'worried' }, 생각: { eyes: 'look', mouth: 'flat', brows: 'curious' },
      blink: { eyes: 'closed', mouth: m, brows: br0 }, talk: { eyes: 'normal', mouth: 'big', brows: 'normal' }, alt: { eyes: 'happy', mouth: 'big', brows: 'normal' }, alt2: { eyes: eyes0, mouth: m, brows: br0 },
    };
    return F[key];
  }
  const FULL = ['기본', '기쁨', '놀람', '걱정', '속상', '생각', 'blink', 'talk', 'alt', 'alt2'], BASIC = ['기본', '기쁨', '놀람'];
  const tasks = [];
  const img = (r) => `<img src="${r.url}" alt="" draggable="false" style="height:100%;width:auto;display:block" width="${r.w}" height="${r.h}" data-feet="${r.feet.toFixed(1)}"${r.head ? ` data-head="${r.head.map((v) => v.toFixed(1)).join(',')}"` : ''}>`;
  const put = (key, k, r) => { if (FR[key]) FR[key][k] = img(r); };
  [1, 2, 3].forEach((n) => FULL.forEach((k) => tasks.push({ key: 'n' + n, k, n, face: faceOf(n, k), pose: poseOf(n, k === 'alt' || k === 'alt2') })));
  [4, 5, 6, 7, 8, 9, 10].forEach((n) => BASIC.forEach((k) => tasks.push({ key: 'n' + n, k, n, face: faceOf(n, k), pose: poseOf(n, false) })));
  // 셋 위에 둘이 올라간 다섯 칸 탑 (이야기 핵심 장면)
  const towerSpec = (lit) => ({ cells: V(5), rowColor: (r) => (r < 2 ? RB[1] : RB[2]), acc: 2, lit });
  for (let i = 0; i <= 5; i++) tasks.push({ key: 'tower', k: 'lit' + i, n: 2, spec: towerSpec(i), face: { eyes: 'normal', mouth: 'big', brows: 'normal' }, pose: i === 5 ? ['up', 'up'] : ['down', 'wave'] });
  tasks.push({ key: 'tower', k: '기쁨', n: 2, spec: towerSpec(5), face: { eyes: 'happy', mouth: 'big', brows: 'normal' }, pose: ['up', 'up'] });
  // 합치기 놀이: 아래 a칸 + 위 b칸
  const NUMCOL = { 1: RB[0], 2: RB[1], 3: RB[2], 4: RB[3] };
  [[1, 1], [2, 1], [3, 1], [2, 2], [3, 2], [4, 1]].forEach(([a, b]) => {
    const spec = { cells: V(a + b), rowColor: (r) => (r < b ? NUMCOL[b] : NUMCOL[a]), acc: 0 };
    tasks.push({ key: `m${a}${b}`, k: '기본', n: 2, spec, face: { eyes: 'normal', mouth: 'smile', brows: 'normal' }, pose: ['down', 'wave'] });
    tasks.push({ key: `m${a}${b}`, k: '기쁨', n: 2, spec, face: { eyes: 'happy', mouth: 'big', brows: 'normal' }, pose: ['down', 'wave'] });
  });
  // 걷기·손 흔들기 (1~5)
  const MOTION = { walk1: [1, ['sw2', 'sw1'], '기본'], walk2: [-1, ['sw1', 'sw2'], '기본'], wave1: [0, ['down', 'wave'], '기쁨'], wave2: [0, ['down', 'up'], '기쁨'] };
  [1, 2, 3, 4, 5].forEach((n) => Object.entries(MOTION).forEach(([k, [step, pose, f]]) => tasks.push({ key: 'n' + n, k, n, face: faceOf(n, f), pose, step, ref: poseOf(n, false) })));
  // 눈에 먼저 보이는 것부터
  tasks.sort((a, b) => (['기본', '기쁨', '놀람', 'lit0'].includes(a.k) ? 0 : 1) - (['기본', '기쁨', '놀람', 'lit0'].includes(b.k) ? 0 : 1));
  window.__tasksSorted = true;
  let done = 0;
  function step() {
    const t0 = performance.now();
    while (tasks.length && performance.now() - t0 < 24) {
      const t = tasks.shift();
      try { if (t.run) { t.run(); done++; } else { put(t.key, t.k, renderFrame(t.n, { face: t.face, pose: t.pose, spec: t.spec, step: t.step, ref: t.ref })); done++; } }
      catch (e) { console.warn('3D frame failed', t.key, t.k, e); }
    }
    if (tasks.length) setTimeout(step, 0); else { window.FR3D = true; if (window.onFR3D) window.onFR3D(done); }
  }
  /* 임의의 3D 묶음(Group)을 그림으로 */
  function renderGroup(g, o = {}) {
    scene.add(g); g.updateMatrixWorld(true);
    if (o.ref) o.ref.updateMatrixWorld(true); // 기준 자세로 틀을 재면 걷기 그림도 크기가 같다
    const bb = new T.Box3().setFromObject(o.ref || g), sz = new T.Vector3(); bb.getSize(sz);
    const width = Math.max(sz.x + (o.padX ?? 1.2), o.minW ?? 2.8), top = bb.max.y + (o.padTop ?? .35), bottom = bb.min.y - (o.padBottom ?? .55), height = top - bottom;
    const PX = o.px ?? 78, wpx = Math.round(width * PX), hpx = Math.round(height * PX);
    renderer.setSize(wpx, hpx, false); canvas.width = wpx; canvas.height = hpx;
    const sh = new T.Mesh(new T.PlaneGeometry(width * (o.shadowW ?? .8), o.shadowD ?? 1.3), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set((bb.min.x + bb.max.x) / 2, bb.min.y - .12, .2); scene.add(sh);
    const fov = 12, cam = new T.PerspectiveCamera(fov, wpx / hpx, .1, 300), t = Math.tan(fov * Math.PI / 360);
    const D = Math.max((height / 2) / t, (width / 2) / (t * (wpx / hpx))), cy = (top + bottom) / 2, cx = (bb.min.x + bb.max.x) / 2;
    cam.position.set(cx, cy + D * .12, D); cam.lookAt(cx, cy, 0);
    renderer.render(scene, cam);
    const url = canvas.toDataURL('image/png');
    // 얼굴 자리(사진 얼굴을 덮어씌울 곳)를 그림 좌표로 기록
    let head = null; const fm = g.getObjectByName('faceMark'), fe = g.getObjectByName('faceEdge');
    if (fm && fe) { const px = (o3) => { const v = new T.Vector3(); o3.getWorldPosition(v); v.project(cam); return [(v.x + 1) / 2 * wpx, (1 - v.y) / 2 * hpx]; }; const a = px(fm), b = px(fe); head = [a[0], a[1], Math.hypot(b[0] - a[0], b[1] - a[1])]; }
    scene.remove(g); scene.remove(sh); sh.geometry.dispose(); sh.material.dispose();
    g.traverse((x) => { if (x.material && x.material.map && x.material.map.isCanvasTexture) x.material.map.dispose(); });
    return { url, w: wpx, h: hpx, feet: (top - bb.min.y) * PX, head };
  }
  window.T3 = { T, scene, renderer, canvas, lin, dark, mat, mesh, sph, tube, roundedBox, renderGroup, tasks, put, img, RB,
    addTask: (fn) => { tasks.push({ run: fn, k: 'zz' }); if (window.FR3D) { window.FR3D = false; setTimeout(step, 0); } } };
  window.T3N = { build, faceOf, poseOf, towerSpec, V, RB, FULL, BASIC, NUMCOL, CELLS };
  window.FR3D_render = renderFrame; // 시험용
  setTimeout(step, 400);
})();
