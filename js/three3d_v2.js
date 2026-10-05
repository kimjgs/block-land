/* 블록대륙 아트 스타일 v2 — "고급 3D 애니메이션 장난감 세계"
   공통 규칙: 왼쪽 위 앞에서 오는 따뜻한 빛 · 오른쪽 아래 부드러운 그림자 · 발밑 접지 그림자 · 같은 카메라/렌즈 · 같은 재질 품질.
   기존 three3d.js의 T3(three.js)와 T3C(표정 목록)를 빌려 쓰고, 렌더러·조명·재질은 새로 만든다. */
(function () {
  if (!window.T3 || !window.T3C) return;
  const { T } = window.T3, { FACES } = window.T3C;
  const lin = (h) => new T.Color(h).convertSRGBToLinear();
  const dk = (h, a) => '#' + new T.Color(h).multiplyScalar(1 - a).getHexString();
  const lt = (h, a) => '#' + new T.Color(h).lerp(new T.Color('#ffffff'), a).getHexString();

  /* ---------- 렌더러 · 조명 ---------- */
  const canvas = document.createElement('canvas');
  const R = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  R.outputEncoding = T.sRGBEncoding; R.setClearColor(0x000000, 0); R.setPixelRatio(1);
  R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;

  const envScene = new T.Scene();
  { // 따뜻한 스튜디오: 왼쪽 위 앞의 큰 소프트박스, 오른쪽 차가운 보조광, 아래 바닥 반사
    const g = new T.SphereGeometry(40, 32, 16), cols = [], p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = (p.getY(i) / 40 + 1) / 2, c = new T.Color().setRGB(.62 + .4 * t, .62 + .38 * t, .72 + .3 * t); cols.push(c.r, c.g, c.b); }
    g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
    envScene.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    const box = (w, h, x, y, z, c) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m); };
    box(24, 16, -16, 20, 20, new T.Color(3.4, 3.1, 2.7)); box(12, 18, 24, 6, 10, new T.Color(1.8, 2.1, 2.7)); box(30, 8, 0, -26, 8, new T.Color(1.6, 1.5, 1.3)); box(26, 6, 6, 30, -10, new T.Color(2.4, 2.4, 2.4));
  }
  const envTex = new T.PMREMGenerator(R).fromScene(envScene, .04).texture;
  const scene = new T.Scene(); scene.environment = envTex;
  scene.add(new T.HemisphereLight(0xfff3e4, 0xcdbcf0, .42));
  const key = new T.DirectionalLight(0xfff0dc, .92); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0005; key.shadow.normalBias = .03; scene.add(key, key.target);
  const fillL = new T.DirectionalLight(0xdce8ff, .3); fillL.position.set(7, 2.5, 5); scene.add(fillL);
  const rim = new T.DirectionalLight(0xffffff, .5); rim.position.set(3, 5, -7); scene.add(rim);

  /* ---------- 재질: 고무·플라스틱 장난감 ---------- */
  const noise = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'); c.fillStyle = '#808080'; c.fillRect(0, 0, 256, 256); let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 2600; i++) { const v = 120 + rnd() * 20; c.fillStyle = `rgba(${v},${v},${v},.35)`; c.beginPath(); c.arc(rnd() * 256, rnd() * 256, 1 + rnd() * 2.4, 0, 7); c.fill(); } const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(3, 3); return t; })();
  const mc = {};
  function M(hex, o = {}) {
    const k = hex + JSON.stringify(o); if (mc[k]) return mc[k];
    const m = new T.MeshPhysicalMaterial({ color: lin(hex), roughness: o.rough ?? .36, metalness: o.metal ?? 0, clearcoat: o.coat ?? .45, clearcoatRoughness: .24, envMapIntensity: o.env ?? .4, vertexColors: true, bumpMap: noise, bumpScale: o.bump ?? .06 });
    m.userData.ao = true; return (mc[k] = m);
  }
  const glossy = (hex, o = {}) => new T.MeshPhysicalMaterial({ color: lin(hex), roughness: o.rough ?? .12, metalness: 0, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: o.env ?? .9 });
  const INK = glossy('#3A2430', { rough: .3 });
  const part = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  const sph = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = part(new T.SphereGeometry(r, 36, 24), mat, x, y, z); m.scale.set(sx, sy, sz); return m; };
  const tubeG = (pts, r, mat, seg = 28) => part(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p))), seg, r, 14, false), mat);
  function rb(w, h, d, r, taper = [1, 1]) { // 둥근 블록 (부드러운 bevel), 위아래 폭 조절 가능
    const g = new T.BoxGeometry(w, h, d, 18, 18, 18), pos = g.attributes.position, nor = g.attributes.normal, v = new T.Vector3(), inn = new T.Vector3(), n = new T.Vector3();
    const hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r, cl = (x, a) => Math.max(-a, Math.min(a, x));
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i); inn.set(cl(v.x, hw), cl(v.y, hh), cl(v.z, hd)); n.copy(v).sub(inn);
      if (n.lengthSq() > 1e-9) { n.normalize(); v.copy(inn).addScaledVector(n, r); nor.setXYZ(i, n.x, n.y, n.z); }
      const s = taper[0] + (taper[1] - taper[0]) * ((v.y + h / 2) / h); pos.setXYZ(i, v.x * s, v.y, v.z * (1 + (s - 1) * .6));
    }
    return g;
  }

  /* 부드러운 명암(ambient occlusion 느낌): 아래쪽·밑면을 살짝 어둡게, 위쪽을 밝게 */
  function applyAO(g) {
    g.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(g), y0 = bb.min.y, hh = Math.max(.001, bb.max.y - bb.min.y), v = new T.Vector3(), n = new T.Vector3(), nm = new T.Matrix3();
    g.traverse((o) => {
      if (!o.isMesh || !o.material.userData.ao) return;
      const geo = o.geometry.clone(), p = geo.attributes.position, nr = geo.attributes.normal, base = geo.attributes.color, cols = new Float32Array(p.count * 3);
      nm.getNormalMatrix(o.matrixWorld);
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); n.fromBufferAttribute(nr, i).applyMatrix3(nm).normalize();
        const t = Math.min(1, Math.max(0, (v.y - y0) / hh)), ao = (.74 + .26 * Math.pow(t, .7)) * (1 - .16 * Math.max(0, -n.y));
        cols[i * 3] = (base ? base.getX(i) : 1) * ao; cols[i * 3 + 1] = (base ? base.getY(i) : 1) * ao; cols[i * 3 + 2] = (base ? base.getZ(i) : 1) * ao;
      }
      geo.setAttribute('color', new T.BufferAttribute(cols, 3)); o.geometry = geo; o.userData.own = true;
    });
  }

  /* ---------- 얼굴 ---------- */
  const tex = (cv) => { const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; };
  function mouthTex(kind) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c = cv.getContext('2d'); c.lineCap = c.lineJoin = 'round';
    const ink = '#4B2330', cx = 256, cy = 84;
    const lens = (w, top, bot) => { c.beginPath(); c.moveTo(cx - w, cy); c.quadraticCurveTo(cx, cy + top, cx + w, cy); c.quadraticCurveTo(cx, cy + bot, cx - w, cy); c.closePath(); };
    const open = (path, ty) => {
      path(); const gr = c.createLinearGradient(0, cy, 0, cy + 170); gr.addColorStop(0, '#6E1F33'); gr.addColorStop(1, '#B83E5A'); c.fillStyle = gr; c.fill();
      c.save(); path(); c.clip(); c.fillStyle = '#FF8EA4'; c.beginPath(); c.ellipse(cx, ty, 70, 44, 0, 0, 7); c.fill(); c.fillStyle = '#FFB2C0'; c.beginPath(); c.ellipse(cx - 18, ty - 14, 26, 12, 0, 0, 7); c.fill(); c.restore();
      path(); c.strokeStyle = ink; c.lineWidth = 11; c.stroke();
    };
    if (kind === 'smile') open(() => lens(108, 18, 150), cy + 130);
    else if (kind === 'big') { open(() => { c.beginPath(); c.moveTo(cx - 122, cy); c.quadraticCurveTo(cx, cy + 14, cx + 122, cy); c.quadraticCurveTo(cx + 110, cy + 170, cx, cy + 172); c.quadraticCurveTo(cx - 110, cy + 170, cx - 122, cy); c.closePath(); }, cy + 150);
      c.save(); c.beginPath(); c.moveTo(cx - 118, cy + 4); c.quadraticCurveTo(cx, cy + 16, cx + 118, cy + 4); c.lineTo(cx + 108, cy + 40); c.quadraticCurveTo(cx, cy + 52, cx - 108, cy + 40); c.closePath(); c.fillStyle = '#FFFDF6'; c.fill(); c.restore(); }
    else if (kind === 'o') open(() => { c.beginPath(); c.ellipse(cx, cy + 70, 50, 68, 0, 0, 7); }, cy + 118);
    else if (kind === 'grin') { c.strokeStyle = ink; c.lineWidth = 16; c.beginPath(); c.moveTo(cx - 98, cy + 22); c.quadraticCurveTo(cx, cy + 112, cx + 98, cy + 22); c.stroke(); c.lineWidth = 9; [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(cx + s * 112, cy + 6); c.lineTo(cx + s * 100, cy + 24); c.stroke(); }); }
    else if (kind === 'frown') { c.strokeStyle = ink; c.lineWidth = 16; c.beginPath(); c.moveTo(cx - 78, cy + 96); c.quadraticCurveTo(cx, cy + 14, cx + 78, cy + 96); c.stroke(); }
    else if (kind === 'flat') { c.strokeStyle = ink; c.lineWidth = 16; c.beginPath(); c.moveTo(cx - 56, cy + 64); c.lineTo(cx + 56, cy + 64); c.stroke(); }
    else if (kind === 'wavy') { c.strokeStyle = ink; c.lineWidth = 15; c.beginPath(); c.moveTo(cx - 96, cy + 64); c.bezierCurveTo(cx - 64, cy + 20, cx - 32, cy + 20, cx, cy + 64); c.bezierCurveTo(cx + 32, cy + 108, cx + 64, cy + 108, cx + 96, cy + 64); c.stroke(); }
    return tex(cv);
  }
  const cheekTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(255,110,140,.62)'); g.addColorStop(.6, 'rgba(255,110,140,.3)'); g.addColorStop(1, 'rgba(255,110,140,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); return tex(cv); })();
  const flat = (w, h, map, x, y, z) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map, transparent: true, toneMapped: false, depthWrite: false })); m.position.set(x, y, z); m.userData.flat = true; return m; };

  /* c: {sep, y, r, surf(x,y)->z, iris, lid, asym, dir, bodyHex, brow, mouthY, mouthW, cheekX, cheekY, nose} */
  function face3d(g, f, c) {
    const eyesKind = f.eyes, bodyM = c.bodyHex ? M(c.bodyHex) : null;
    [-1, 1].forEach((s) => {
      let kind = eyesKind; if (kind === 'wink') kind = s === 1 ? 'happy' : 'normal';
      const k = c.asym ? c.asym[s < 0 ? 0 : 1] : 1, r = c.r * k * (kind === 'wide' ? 1.1 : 1), x = s * c.sep, y = c.y, z = c.surf(x, y);
      if (kind === 'happy' || kind === 'closed') {
        const up = kind === 'happy', R0 = r * .95, pts = [];
        for (let i = 0; i <= 10; i++) { const a = ((up ? 18 : 198) + i * 14.4) * Math.PI / 180; pts.push([x + R0 * Math.cos(a), y + (up ? -R0 * .12 : R0 * .34) + R0 * .62 * Math.sin(a), z + .06]); }
        const t = tubeG(pts, r * .19, INK); t.userData.flat = true; g.add(t); [pts[0], pts[10]].forEach((q) => { const e = sph(r * .19, INK, q[0], q[1], q[2]); e.userData.flat = true; g.add(e); });
      } else {
        const sc = part(new T.SphereGeometry(r, 40, 28), glossy('#FFFCF4', { rough: .18 }), x, y, z); sc.scale.set(1, 1.1, .5); sc.userData.flat = true; g.add(sc);
        const dir = kind === 'look' ? [.24, .22] : (c.dir || [0, -.04]), ir = r * (kind === 'wide' ? .52 : .7);
        const ix = x + dir[0] * r, iy = y + dir[1] * r, irisFront = z + r * .53, iz = irisFront - ir * .45;
        const iris = part(new T.SphereGeometry(ir, 36, 24), glossy(c.iris, { rough: .2 }), ix, iy, iz); iris.scale.set(1, 1.08, .45); iris.userData.flat = true; g.add(iris);
        const ppr = ir * (kind === 'wide' ? .42 : .5), pu = part(new T.SphereGeometry(ppr, 28, 18), glossy('#241820', { rough: .1 }), ix, iy, irisFront + r * .02 - ppr * .5); pu.scale.set(1, 1.05, .5); pu.userData.flat = true; g.add(pu);
        const hl = (rr, dx, dy) => { const m = new T.Mesh(new T.SphereGeometry(rr, 16, 12), new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); m.position.set(ix + dx * r, iy + dy * r, irisFront + r * .06); m.scale.z = .4; m.userData.flat = true; g.add(m); };
        hl(r * .17, -.24, .27); hl(r * .075, .2, -.23);
        if (c.lid > 0 && bodyM) { const lid = part(new T.SphereGeometry(r * 1.08, 40, 20, 0, Math.PI * 2, 0, Math.PI * c.lid), bodyM, x, y + r * .02, z + r * .02); lid.scale.set(1, 1.1, .55); g.add(lid); }
      }
      // 눈썹
      if (f.brows && f.brows !== 'none') {
        const bw = r * .95, yb = y + r * 1.32, inn = x - s * bw, out = x + s * bw; let yi = yb, ym = yb + r * .14, yo = yb - r * .05;
        if (f.brows === 'up') { yi += r * .34; ym += r * .34; yo += r * .3; }
        else if (f.brows === 'worried') { yi += r * .3; ym += r * .1; yo -= r * .12; }
        else if (f.brows === 'curious' && s === -1) { yi += r * .26; ym += r * .4; yo += r * .22; }
        const mid = (inn + out) / 2, zb = (xx, yy) => c.surf(xx, yy) + .05;
        const t = tubeG([[inn, yi, zb(inn, yi)], [mid, ym, zb(mid, ym)], [out, yo, zb(out, yo)]], r * .12, glossy(c.brow || '#5A3A32', { rough: .35 })); t.userData.flat = true; g.add(t);
        [[inn, yi], [out, yo]].forEach(([bx, by]) => { const e = sph(r * .12, glossy(c.brow || '#5A3A32', { rough: .35 }), bx, by, zb(bx, by)); e.userData.flat = true; g.add(e); });
      }
    });
    // 입, 볼, 코
    const mw = c.mouthW || 1.05, mz = c.surf(0, c.mouthY) + .075;
    const mouth = flat(mw, mw / 2, mouthTex(f.mouth), 0, c.mouthY - mw * .12, mz); g.add(mouth);
    [-1, 1].forEach((s) => { const x = s * c.cheekX, z = c.surf(x, c.cheekY) + .06, ch = flat(.7, .46, cheekTex, x, c.cheekY, z); ch.rotation.y = s * (c.cheekTurn || .12); g.add(ch); });
    if (c.nose) c.nose(g);
  }

  /* ---------- 팔, 다리 ---------- */
  const HANDS = { down: [-.55, -1.0], wave: [.62, .95], up: [.42, 1.25], out: [1.0, .12], sw1: [-.15, -1.0], sw2: [-.85, -.78] };
  function arm2(g, side, pose, sx, sy, k, aMat, mitMat, z = 0) {
    const [dx, dy] = HANDS[pose], hx = sx + side * (pose === 'down' ? .45 : pose === 'out' ? .75 : pose === 'sw1' || pose === 'sw2' ? .3 : .3 + Math.abs(dx) * .35) * k, hy = sy + dy * k, hz = z + .15;
    const mid = [(sx + hx) / 2 + side * .15 * k, sy + dy * .3 * k + (pose === 'down' ? 0 : .1 * k), z + .05];
    g.add(tubeG([[sx - side * .05, sy, z], mid, [hx, hy, hz]], .155 * k, aMat)); g.add(sph(.2 * k, aMat, sx, sy, z));
    g.add(sph(.29 * k, mitMat, hx, hy, hz, 1, 1.08, .95)); g.add(sph(.12 * k, mitMat, hx - side * .2 * k, hy + .11 * k, hz + .2 * k));
    return [hx, hy, hz];
  }
  function legs2(g, xs, y, color, sole, scale = 1) {
    const st = window.T3STEP || 0, lm = M(color), sm = M(color, { coat: .7 }), wm = M(sole, { rough: .5, coat: .3 });
    xs.forEach((x, i) => {
      const up = (i === 0 ? st > 0 : st < 0) ? .18 * scale : 0;
      g.add(part(new T.CylinderGeometry(.15 * scale, .17 * scale, .4 * scale, 20), lm, x, y - .06 * scale + up * .6, .05));
      const sh = sph(.34 * scale, sm, x + .04, y - .3 * scale + up, .18 * scale, 1.18, .56, 1.5); sh.rotation.x = up ? -.35 : 0; g.add(sh);
      const so = sph(.35 * scale, wm, x + .04, y - .42 * scale + up, .18 * scale, 1.2, .2, 1.52); so.rotation.x = up ? -.35 : 0; g.add(so);
    });
  }
  /* 위아래 폭이 다른 몸의 앞면 위치(얼굴이 몸 속에 파묻히지 않게) */
  const fz = (D, H, by, tp) => (x, y) => { const t = Math.min(1, Math.max(0, (y - by + H / 2) / H)), s = tp[0] + (tp[1] - tp[0]) * t; return D / 2 * (1 + (s - 1) * .6) - .03; };
  const poseOf = (alt, base, altP) => (alt && alt.pose ? alt.pose : alt ? altP : base);

  /* ================= 몽이: 앱의 마스코트. 둥글고 말랑한 코랄 블록 ================= */
  const MONGI = '#FF8E7C';
  function mongi(face, alt) {
    const g = new T.Group(), bm = M(MONGI), am = M(dk(MONGI, .08)), cream = M('#FFEAD8', { rough: .5, coat: .3 });
    const W = 2.3, H = 2.15, D = 1.8, by = H / 2 + .1;
    const TP = [1.07, .93], F = fz(D, H, by, TP);
    g.add(part(rb(W, H, D, .72, TP), bm, 0, by, 0));
    [-1, 1].forEach((s) => { g.add(sph(.4, bm, s * .68, H + .1, -.05, 1, 1.18, .92)); g.add(sph(.24, M('#FFB8A6', { rough: .5 }), s * .68, H + .06, .17, 1, 1.18, .5)); });
    g.add(sph(.38, cream, 0, .36, F(0, .36) - .12, 1.1, .95, .42));
    const pose = poseOf(alt, ['down', 'wave'], ['down', 'up']);
    arm2(g, -1, pose[0], -W / 2 + .02, by + .05, 1.12, am, cream); arm2(g, 1, pose[1], W / 2 - .02, by + .05, 1.12, am, cream);
    legs2(g, [-.58, .58], .16, dk(MONGI, .1), '#FFF6EC', 1.1);
    face3d(g, face, { sep: .62, y: 1.66, r: .33, surf: F, iris: '#6A3F30', brow: '#8A4A36', mouthY: 1.22, mouthW: 1.3, cheekX: .86, cheekY: 1.38, cheekTurn: .2 });
    g.rotation.y = -.2; return g;
  }

  /* ================= 코코: 차분하고 느긋한 민트 블록, 머리 위 ABC 장난감 ================= */
  const COCO = '#6DD6BC';
  const letterTex = (ch, bg) => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'); c.fillStyle = 'rgba(0,0,0,0)'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#FFFFFF'; c.font = '900 92px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 4; c.shadowOffsetY = 3; c.fillText(ch, 64, 70); return tex(cv); };
  function coco(face, alt) {
    const g = new T.Group(), bm = M(COCO), am = M(dk(COCO, .1)), cream = M('#FFF3D6', { rough: .5, coat: .3 });
    const W = 3.0, H = 1.85, D = 1.7, by = H / 2 + .1;
    const TP = [1.06, .94], F = fz(D, H, by, TP);
    g.add(part(rb(W, H, D, .62, TP), bm, 0, by, 0));
    [['A', '#F58FA8', -.78, .26, .42], ['B', '#66B6E8', .62, -.2, -.3]].forEach(([ch, col, x, rz, ry]) => {
      const cube = new T.Group(); cube.add(part(rb(.66, .66, .66, .16), M(col), 0, 0, 0)); const pl = flat(.5, .5, letterTex(ch), 0, 0, .335); cube.add(pl);
      cube.position.set(x, H + .32, .05); cube.rotation.set(0, ry, rz); g.add(cube);
    });
    g.add(sph(.42, cream, 0, .4, F(0, .4) - .13, 1.5, .78, .4));
    const pose = poseOf(alt, ['down', 'down'], ['wave', 'down']);
    arm2(g, -1, pose[0], -W / 2 + .03, by, 1.0, am, cream); arm2(g, 1, pose[1], W / 2 - .03, by, 1.0, am, cream);
    legs2(g, [-.85, .85], .16, dk(COCO, .12), '#FFF6EC', 1.1);
    face3d(g, face, { sep: .76, y: 1.42, r: .33, surf: F, iris: '#2F5E6A', brow: '#2F6A5A', lid: .3, bodyHex: COCO, mouthY: 1.06, mouthW: 1.15, cheekX: 1.15, cheekY: 1.16, cheekTurn: .25 });
    g.rotation.y = -.2; return g;
  }

  /* ================= 토리: 키가 크고 호기심 많은 보라 블록, 한쪽 눈썹이 올라가 있음 ================= */
  const TORI = '#A98BE8';
  function tori(face, alt) {
    const g = new T.Group(), bm = M(TORI), am = M(dk(TORI, .08)), cream = M('#F1EAFF', { rough: .5, coat: .3 }), gold = M('#FFC94A', { rough: .25, metal: .5, coat: .8 });
    const W = 1.75, H = 2.9, D = 1.45, by = H / 2 + .1;
    const TP = [1.1, .88], F = fz(D, H, by, TP);
    g.add(part(rb(W, H, D, .56, TP), bm, 0, by, 0));
    [-1, 1].forEach((s) => { const e = part(rb(.36, .95, .3, .15), M(dk(TORI, .06)), s * .66, H + .22, -.02); e.rotation.z = -s * .3; g.add(e); const ie = part(rb(.18, .62, .1, .07), M('#D9C8FA', { rough: .5 }), s * .66, H + .22, .13); ie.rotation.z = -s * .3; g.add(ie); });
    g.add(tubeG([[-.1, H + .02, 0], [-.04, H + .36, 0], [.16, H + .6, 0], [.4, H + .52, 0], [.44, H + .3, 0], [.28, H + .26, 0]], .055, gold)); g.add(sph(.15, gold, .28, H + .26, 0));
    const pose = poseOf(alt, ['down', 'out'], ['down', 'wave']);
    arm2(g, -1, pose[0], -W / 2 + .03, by + .1, 1.12, am, cream);
    const hand = arm2(g, 1, pose[1], W / 2 - .03, by + .1, 1.12, am, cream);
    { // 돋보기: 손잡이는 손에, 렌즈는 위쪽
      const hd = part(new T.CylinderGeometry(.075, .085, .72, 16), M('#8A5A2B', { rough: .5 }), hand[0] + .18, hand[1] + .28, hand[2] + .02); hd.rotation.z = -.55; g.add(hd);
      const cx = hand[0] + .5, cy = hand[1] + .78;
      g.add(part(new T.TorusGeometry(.42, .075, 18, 40), gold, cx, cy, hand[2] + .02));
      const gl = new T.Mesh(new T.CircleGeometry(.4, 36), new T.MeshPhysicalMaterial({ color: lin('#DFF4FF'), transparent: true, opacity: .4, roughness: .05, clearcoat: 1 })); gl.position.set(cx, cy, hand[2] + .04); g.add(gl);
    }
    legs2(g, [-.4, .4], .16, dk(TORI, .12), '#FFF6EC', 1.05);
    face3d(g, face, { sep: .45, y: 2.14, r: .33, surf: F, iris: '#4A3E86', brow: '#4A3A7A', asym: [1.14, .88], dir: [.1, .1], mouthY: 1.64, mouthW: 1.0, cheekX: .6, cheekY: 1.78, cheekTurn: .2 });
    g.rotation.y = -.2; g.rotation.z = .035; return g;
  }

  /* ================= 솜이: 오렌지 얼룩 아기 고양이 ================= */
  const CREAM = '#FFF0DC', ORANGE = '#FFA85C';
  function somi(face, alt) {
    const g = new T.Group(), cm = M('#FFF0DC'), om = M(ORANGE), wm = M('#FFFFFF', { rough: .5, coat: .25 });
    const body = sph(.8, cm, 0, 0, 0, 1, 1.1, .9); g.add(body); g.add(sph(.5, wm, 0, -.1, .45, 1, 1.1, .5));
    // 머리: 정점 색으로 오렌지 얼룩
    const hg = new T.SphereGeometry(.95, 56, 40), pos = hg.attributes.position, cols = [], c1 = lin(CREAM), c2 = lin(ORANGE), v = new T.Vector3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const d = Math.hypot(v.x - .55, v.y - .55, v.z - .1), t = Math.max(0, Math.min(1, (.82 - d) / .28)), c = c1.clone().lerp(c2, t); cols.push(c.r, c.g, c.b); }
    hg.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
    const head = part(hg, M('#FFFFFF'), 0, 1.25, .1); head.scale.set(1.18, 1, 1); g.add(head);
    [-1, 1].forEach((s) => { const e = part(new T.ConeGeometry(.38, .64, 28), s < 0 ? cm : om, s * .74, 2.1, .0); e.scale.z = .6; e.rotation.z = -s * .34; g.add(e); const ie = part(new T.ConeGeometry(.24, .46, 28), M('#FFB8C8', { rough: .5 }), s * .74, 2.06, .1); ie.scale.z = .4; ie.rotation.z = -s * .34; g.add(ie); });
    const A = 1.121, B = .95, Cc = .95, surf = (x, y) => .1 + Cc * Math.sqrt(Math.max(0, 1 - (x / A) ** 2 - ((y - 1.25) / B) ** 2));
    face3d(g, face, { sep: .46, y: 1.3, r: .27, surf, iris: '#3C7A5A', brow: '#9A5A32', dir: [0, -.02], mouthY: .85, mouthW: .8, cheekX: .78, cheekY: .98, cheekTurn: .5,
      nose: (gg) => { gg.add(sph(.075, glossy('#FF8BA7', { rough: .3 }), 0, 1.0, surf(0, 1.0) + .02, 1.2, .8, .8)); [-1, 1].forEach((s) => [-.07, .05].forEach((dy, i) => { const t = tubeG([[s * .62, 1.0 + dy, surf(s * .62, 1.0) + .02], [s * .95, 1.02 + dy * 2.2, surf(s * .75, 1.0) + .06], [s * 1.32, 1.0 + dy * 3.4 + .02, .6]], .014, glossy('#FFFFFF', { rough: .4 })); t.userData.flat = true; gg.add(t); })); } });
    const st = window.T3STEP || 0; [-1, 1].forEach((s) => { const up = (s < 0 ? st > 0 : st < 0) ? .16 : 0; g.add(sph(.23, cm, s * .32, -.78 + up * .7, .62)); g.add(sph(.31, cm, s * .52, -.92 + up, .3 + up * .5, 1, .6, 1.3)); });
    const isAlt = alt === true, tx = isAlt ? -1 : 1, tp = [[.7 * tx, -.55, -.2], [1.3 * tx, -.2, -.3], [1.45 * tx, .55, -.2], [(isAlt ? 1.1 : 1.35) * tx, 1.1, -.1]];
    g.add(tubeG(tp, .16, om)); g.add(sph(.16, wm, tp[3][0], tp[3][1], tp[3][2]));
    g.rotation.y = -.2; return g;
  }

  /* ---------- 그리기 ---------- */
  const floorTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 2, 64, 64, 62); g.addColorStop(0, 'rgba(30,20,70,.62)'); g.addColorStop(.5, 'rgba(30,20,70,.28)'); g.addColorStop(1, 'rgba(30,20,70,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); return new T.CanvasTexture(cv); })();
  function render(g, o = {}) {
    scene.add(g); g.traverse((m) => { if (m.isMesh && !m.userData.flat && m.material && m.material.type !== 'MeshBasicMaterial') { m.castShadow = true; m.receiveShadow = true; } }); // 기존 모델도 그림자를 만들고 받게
    applyAO(g); const ref = o.ref || g; ref.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(ref), sz = new T.Vector3(); bb.getSize(sz); const cx = (bb.min.x + bb.max.x) / 2, cy0 = (bb.min.y + bb.max.y) / 2, cz = (bb.min.z + bb.max.z) / 2;
    const width = Math.max(sz.x + (o.padX ?? 1.5), o.minW ?? 2.8), top = bb.max.y + (o.padTop ?? .4), bottom = bb.min.y - (o.padBottom ?? .55), height = top - bottom;
    const PX = o.px ?? 170, wpx = Math.round(width * PX), hpx = Math.round(height * PX);
    R.setSize(wpx, hpx, false);
    // 빛: 왼쪽 위 앞에서
    const span = Math.max(sz.x, sz.y) * .85 + 2;
    key.target.position.set(cx, cy0, cz); key.position.set(cx - 5, cy0 + 8.5, cz + 7);
    Object.assign(key.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 40 }); key.shadow.camera.updateProjectionMatrix();
    // 바닥: 진짜 그림자 + 접지 그림자 2겹
    const floor = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({ opacity: .3, color: 0x2a2060 })); floor.rotation.x = -Math.PI / 2; floor.position.set(cx, bb.min.y, cz); floor.receiveShadow = true; scene.add(floor);
    const blob = (w, d, op, dx = 0) => { const m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ map: floorTex, transparent: true, opacity: op, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(cx + dx, bb.min.y + .012, cz + .1); scene.add(m); return m; };
    const b1 = blob(sz.x * .78, sz.z * 1.5 + .7, .75), b2 = blob(sz.x * 1.25, sz.z * 2.2 + 1.2, .4, .15);
    const fov = 12, cam = new T.PerspectiveCamera(fov, wpx / hpx, .1, 300), t = Math.tan(fov * Math.PI / 360);
    const D = Math.max((height / 2) / t, (width / 2) / (t * (wpx / hpx))), cy = (top + bottom) / 2;
    cam.position.set(cx, cy + D * .12, D); cam.lookAt(cx, cy, 0);
    R.render(scene, cam);
    const url = canvas.toDataURL('image/png');
    scene.remove(g, floor, b1, b2); [floor, b1, b2].forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
    g.traverse((x) => { if (x.userData.own) x.geometry.dispose(); if (x.userData.flat && x.material.map) { x.material.map.dispose(); } });
    return { url, w: wpx, h: hpx, feet: (top - bb.min.y) * PX, px: PX };
  }

  const CH = { mongi: { build: mongi, f: FACES('big'), o: { padX: 1.6 } }, coco: { build: coco, f: FACES('smile'), o: { padX: 1.6 } }, tori: { build: tori, f: FACES('o', 'curious'), o: { padX: 1.6 } }, somi: { build: somi, f: FACES('o', 'curious'), o: { padX: 1.0, minW: 2.6 } } };
  /* key의 표정 하나를 같은 크기 틀로 그린다 (k: 기본·기쁨·놀람·걱정·속상·생각·blink·talk·alt·alt2·walk1·walk2·wave1·wave2) */
  function frame(key, k, px) {
    const c = CH[key], ref = c.build(c.f['기본'], false); let g;
    const MO = { walk1: [1, ['sw2', 'sw1'], '기본'], walk2: [-1, ['sw1', 'sw2'], '기본'], wave1: [0, ['down', 'wave'], '기쁨'], wave2: [0, ['down', 'up'], '기쁨'] };
    if (MO[k]) { window.T3STEP = MO[k][0]; try { g = c.build(c.f[MO[k][2]], { pose: MO[k][1] }); } finally { window.T3STEP = 0; } }
    else g = c.build(c.f[k], k === 'alt' || k === 'alt2');
    return render(g, { ...c.o, px: px || 170, ref });
  }
  window.V2 = { frame, render, CH, M, part, sph, rb, face3d, arm2, legs2, tubeG, glossy, lin, dk };
})();
