/* 안내자·동물·사람·소방차를 3D로 그려서 그림(PNG)으로 바꿔 끼운다. (three3d.js 뒤에 불러온다) */
(function () {
  if (!window.T3 || !window.FR) return;
  const { T, lin, dark, mat, mesh, sph, tube, roundedBox, renderGroup, put, tasks } = window.T3;
  const INK = '#22223A';
  const SKIN = '#FFD6B0';

  /* ---------- 얼굴 그리기 (공통) ---------- */
  function drawFace(c, cx, cy, sep, sc, p, cat) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    const eye = (ex, kind) => {
      if (kind === 'happy') { c.strokeStyle = INK; c.lineWidth = 12 * sc; c.beginPath(); c.arc(ex, cy + 14 * sc, 26 * sc, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); return; }
      if (kind === 'closed') { c.strokeStyle = INK; c.lineWidth = 12 * sc; c.beginPath(); c.arc(ex, cy - 10 * sc, 26 * sc, Math.PI * .15, Math.PI * .85); c.stroke(); return; }
      const wide = kind === 'wide', rx = (wide ? 33 : 30) * sc, ry = (wide ? 43 : 39) * sc;
      c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 6 * sc; c.beginPath(); c.ellipse(ex, cy, rx, ry, 0, 0, 7); c.fill(); c.stroke();
      const look = kind === 'look', px = ex + (look ? 12 : 5) * sc, py = cy + (look ? -12 : 8) * sc;
      c.fillStyle = INK; c.beginPath(); c.ellipse(px, py, (wide ? 11 : 17) * sc, (wide ? 14 : 24) * sc, 0, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(px + 8 * sc, py - 10 * sc, 7 * sc, 0, 7); c.fill(); c.beginPath(); c.arc(px - 5 * sc, py + 12 * sc, 3 * sc, 0, 7); c.fill();
    };
    [-1, 1].forEach((s) => {
      const ex = cx + s * sep; let kind = p.eyes; if (kind === 'wink') kind = s === 1 ? 'happy' : 'normal'; eye(ex, kind);
      c.strokeStyle = cat ? '#6B4A2A' : INK; c.lineWidth = 9 * sc;
      if (p.brows === 'worried') { c.beginPath(); c.moveTo(ex + s * 28 * sc, cy - 54 * sc); c.lineTo(ex - s * 26 * sc, cy - 72 * sc); c.stroke(); }
      else if (p.brows !== 'none') { const lift = (p.brows === 'up' || (p.brows === 'curious' && s === -1)) ? 14 * sc : 0; c.beginPath(); c.moveTo(ex - 26 * sc, cy - 60 * sc - lift); c.quadraticCurveTo(ex, cy - 78 * sc - lift, ex + 26 * sc, cy - 60 * sc - lift); c.stroke(); }
      c.fillStyle = 'rgba(255,100,130,.38)'; c.beginPath(); c.ellipse(cx + s * (sep + 40 * sc), cy + 54 * sc, 22 * sc, 13 * sc, 0, 0, 7); c.fill();
    });
    let my = cy + 66 * sc; const m = p.mouth; c.strokeStyle = INK; c.lineWidth = 7 * sc;
    if (cat) { // 코와 수염
      c.fillStyle = '#FF8BA7'; c.strokeStyle = '#C94A64'; c.lineWidth = 4 * sc; c.beginPath(); c.moveTo(cx - 14 * sc, cy + 52 * sc); c.lineTo(cx + 14 * sc, cy + 52 * sc); c.lineTo(cx, cy + 68 * sc); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(120,90,60,.8)'; c.lineWidth = 4 * sc; [-1, 1].forEach((s) => [-12, 10].forEach((d) => { c.beginPath(); c.moveTo(cx + s * (sep + 60 * sc), cy + 50 * sc + d * sc); c.lineTo(cx + s * (sep + 150 * sc), cy + 42 * sc + d * 2 * sc); c.stroke(); }));
      my = cy + 76 * sc; c.strokeStyle = INK; c.lineWidth = 6 * sc;
    }
    const w = (m === 'big' ? 46 : 34) * sc, d = (m === 'big' ? 66 : 48) * sc;
    if (m === 'smile' || m === 'big') {
      c.fillStyle = '#6B1F2E'; c.beginPath(); c.moveTo(cx - w, my - 4 * sc); c.quadraticCurveTo(cx, my + d, cx + w, my - 4 * sc); c.closePath(); c.fill(); c.stroke();
      if (m === 'big') { c.fillStyle = '#fff'; c.fillRect(cx - w * .72, my - 3 * sc, w * 1.44, 11 * sc); }
      c.fillStyle = '#FF7A93'; c.beginPath(); c.ellipse(cx, my + d * .5, w * .38, 11 * sc, 0, 0, 7); c.fill();
    } else if (m === 'grin') { c.lineWidth = 11 * sc; c.beginPath(); c.moveTo(cx - 34 * sc, my); c.quadraticCurveTo(cx, my + 36 * sc, cx + 34 * sc, my); c.stroke(); }
    else if (m === 'o') { c.fillStyle = '#6B1F2E'; c.beginPath(); c.ellipse(cx, my + 14 * sc, 19 * sc, 26 * sc, 0, 0, 7); c.fill(); c.stroke(); }
    else if (m === 'frown') { c.lineWidth = 11 * sc; c.beginPath(); c.moveTo(cx - 30 * sc, my + 28 * sc); c.quadraticCurveTo(cx, my - 2 * sc, cx + 30 * sc, my + 28 * sc); c.stroke(); }
    else if (m === 'flat') { c.lineWidth = 11 * sc; c.beginPath(); c.moveTo(cx - 22 * sc, my + 14 * sc); c.lineTo(cx + 22 * sc, my + 14 * sc); c.stroke(); }
    else if (m === 'wavy') { c.lineWidth = 10 * sc; c.beginPath(); c.moveTo(cx - 36 * sc, my + 16 * sc); c.bezierCurveTo(cx - 24 * sc, my, cx - 12 * sc, my, cx, my + 16 * sc); c.bezierCurveTo(cx + 12 * sc, my + 32 * sc, cx + 24 * sc, my + 32 * sc, cx + 36 * sc, my + 16 * sc); c.stroke(); }
  }
  function tex(cv) { const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; }
  /* 둥근 머리 앞에 씌우는 얼굴 (구의 일부) */
  function faceCap(r, p, o = {}) {
    if (window.T3FACE && window.T3FACE.cap) return window.T3FACE.cap(r, p, o);
    const cv = document.createElement('canvas'); cv.width = 560; cv.height = 400; const c = cv.getContext('2d');
    drawFace(c, 280, o.cy ?? 190, o.sep ?? 86, o.sc ?? 1, p, o.cat);
    const wA = o.wA ?? 1.9, hA = o.hA ?? 1.36;
    const g = new T.SphereGeometry(r * 1.004, 48, 32, Math.PI / 2 - wA / 2, wA, Math.PI / 2 - hA / 2, hA);
    return new T.Mesh(g, new T.MeshBasicMaterial({ map: tex(cv), transparent: true, toneMapped: false }));
  }
  /* 네모난 몸 앞에 붙이는 얼굴 */
  function facePlane(w, h, p, o = {}) {
    if (window.T3FACE && window.T3FACE.plane) return window.T3FACE.plane(w, h, p, o);
    const cv = document.createElement('canvas'); cv.width = Math.round(256 * w); cv.height = Math.round(256 * h); const c = cv.getContext('2d');
    drawFace(c, cv.width / 2, cv.height * (o.cy ?? .45), o.sep ?? 46 + (w - 1) * 22, o.sc ?? 1 + (w - 1) * .1, p);
    return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex(cv), transparent: true, toneMapped: false }));
  }

  /* ---------- 공통 부품 ---------- */
  const HAND = { down: [-.55, -1.0], wave: [.62, .95], up: [.42, 1.25], out: [1.0, .12], sw1: [-.15, -1.0], sw2: [-.85, -.78] }; // sw1·sw2: 걸을 때 팔 흔들기
  function arm(g, side, pose, sx, sy, scale, armMat, handMat, z = 0) {
    const [dx, dy] = HAND[pose]; const k = scale;
    const hx = sx + side * (pose === 'down' ? .45 : pose === 'out' ? .75 : .3 + Math.abs(dx) * .35) * k, hy = sy + dy * k, hz = z + .15;
    const mid = [(sx + hx) / 2 + side * .15 * k, sy + dy * .3 * k + (pose === 'down' ? 0 : .1 * k), z + .05];
    g.add(tube([[sx - side * .05, sy, z], mid, [hx, hy, hz]], .13 * k, armMat));
    g.add(sph(.2 * k, handMat, hx, hy, hz));
  }
  function legs(g, xs, y, color, scale = 1) {
    const lm = mat(color, { rough: .4 }), shoe = mat('#3A3A50', { rough: .45, coat: .5 });
    const st = window.T3STEP || 0; // 걸음: 1이면 왼발, -1이면 오른발을 든다
    xs.forEach((x, i) => { const up = (i === 0 ? st > 0 : st < 0) ? .16 * scale : 0; g.add(mesh(new T.CylinderGeometry(.12 * scale, .12 * scale, .36 * scale, 14), lm, x, y - .1 * scale + up * .6, .05)); const s = sph(.3 * scale, shoe, x + .04, y - .32 * scale + up, .16 * scale + up * .6); s.scale.set(1.15, .52, 1.45); s.rotation.x = up ? -.35 : 0; g.add(s); });
  }
  const FACES = (m = 'smile', br = 'normal', ey = 'normal') => ({
    기본: { eyes: ey, mouth: m, brows: br }, 기쁨: { eyes: 'happy', mouth: 'big', brows: 'normal' }, 놀람: { eyes: 'wide', mouth: 'o', brows: 'up' },
    걱정: { eyes: 'normal', mouth: 'wavy', brows: 'worried' }, 속상: { eyes: 'normal', mouth: 'frown', brows: 'worried' }, 생각: { eyes: 'look', mouth: 'flat', brows: 'curious' },
    blink: { eyes: 'closed', mouth: m, brows: br }, talk: { eyes: 'normal', mouth: 'big', brows: 'normal' }, alt: { eyes: 'happy', mouth: 'big', brows: 'normal' }, alt2: { eyes: ey, mouth: m, brows: br },
  });
  const FULL = ['기본', '기쁨', '놀람', '걱정', '속상', '생각', 'blink', 'talk', 'alt', 'alt2'], BASIC = ['기본', '기쁨', '놀람'];
  /* 캐릭터 하나의 모든 표정을 작업 목록에 넣는다. build(face, altPose) → Group */
  function enqueue(key, faces, keys, build, opt = {}) {
    keys.forEach((k) => tasks.push({ k: k === '기본' || k === '기쁨' ? '기본' : 'zz', run: () => put(key, k, renderGroup(build(faces[k], k === 'alt' || k === 'alt2'), opt)) }));
  }
  /* 걷기·손 흔들기 그림. 크기가 '기본'과 똑같도록 기본 자세로 틀을 잰다. */
  const MOTION = { walk1: { step: 1, pose: ['sw2', 'sw1'], face: '기본' }, walk2: { step: -1, pose: ['sw1', 'sw2'], face: '기본' }, wave1: { step: 0, pose: ['down', 'wave'], face: '기쁨' }, wave2: { step: 0, pose: ['down', 'up'], face: '기쁨' } };
  function enqueueMotion(key, faces, build, opt = {}) {
    Object.entries(MOTION).forEach(([k, m]) => tasks.push({ k: 'zz', run: () => {
      const ref = build(faces['기본'], false); let g;
      window.T3STEP = m.step; try { g = build(faces[m.face], { pose: m.pose }); } finally { window.T3STEP = 0; }
      put(key, k, renderGroup(g, { ...opt, ref }));
      ref.traverse((x) => { if (x.material && x.material.map) x.material.map.dispose(); });
    } }));
  }

  /* ================= 고양이 (솜이, 나나) ================= */
  function cat(cfg) {
    return (face, alt) => {
      const g = new T.Group(), cream = '#FFEBD0', orange = '#FF9A3C', s = cfg.size;
      const cm = mat(cream, { rough: .55, coat: .15 }), om = mat(orange, { rough: .5, coat: .15 });
      // 몸
      const body = sph(.8, cm, 0, 0, 0); body.scale.set(1, 1.1, .9); g.add(body);
      const belly = sph(.5, mat('#FFFFFF', { rough: .6, coat: 0 }), 0, -.1, .45); belly.scale.set(1, 1.1, .5); g.add(belly);
      // 머리 (오렌지 얼룩은 꼭짓점 색으로)
      const hg = new T.SphereGeometry(.95, 48, 32), pos = hg.attributes.position, cols = [];
      const c1 = lin(cream), c2 = lin(orange), v = new T.Vector3();
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const d = Math.hypot(v.x - .55, v.y - .55, v.z - .1); const t = Math.max(0, Math.min(1, (.8 - d) / .25)); const c = c1.clone().lerp(c2, t); cols.push(c.r, c.g, c.b); }
      hg.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
      const head = new T.Mesh(hg, new T.MeshPhysicalMaterial({ vertexColors: true, roughness: .55, clearcoat: .15 })); head.scale.set(1.18, 1, 1); head.position.set(0, 1.25, .1); g.add(head);
      // 귀
      [-1, 1].forEach((sd) => { const e = mesh(new T.ConeGeometry(.34, .6, 4), sd < 0 ? cm : om, sd * .72, 2.08, .02); e.rotation.z = -sd * .35; e.rotation.y = Math.PI / 4; g.add(e); const ie = mesh(new T.ConeGeometry(.2, .42, 4), mat('#FFB3C4', { coat: 0 }), sd * .72, 2.04, .13); ie.rotation.z = -sd * .35; ie.rotation.y = Math.PI / 4; g.add(ie); });
      // 얼굴
      const fc = faceCap(.95, face, { cat: true, wA: 2.0, hA: 1.4, cy: 185, sep: 98, sc: 1.55 }); fc.scale.set(1.18, 1, 1); fc.position.copy(head.position); g.add(fc);
      // 발, 꼬리
      const st = window.T3STEP || 0; [-1, 1].forEach((sd) => { const up = (sd < 0 ? st > 0 : st < 0) ? .16 : 0; g.add(sph(.22, cm, sd * .32, -.78 + up * .7, .62)); const f = sph(.3, cm, sd * .52, -.92 + up, .3 + up * .5); f.scale.set(1, .6, 1.3); g.add(f); });
      const isAlt = alt === true, tx = isAlt ? -1 : 1, tp = [[.7 * tx, -.55, -.2], [1.3 * tx, -.2, -.3], [1.45 * tx, .55, -.2], [(isAlt ? 1.1 : 1.35) * tx, 1.1, -.1]];
      g.add(tube(tp, .15, om)); g.add(sph(.15, mat('#FFFFFF', { coat: 0 }), tp[3][0], tp[3][1], tp[3][2]));
      g.scale.setScalar(s); g.rotation.y = -.2; return g;
    };
  }

  /* ================= 사람 ================= */
  function person(cfg) {
    return (face, alt) => {
      const g = new T.Group(), skin = mat(SKIN, { rough: .5, coat: .15 }), coat = mat(cfg.coat, { rough: .35 }), pants = cfg.pants;
      legs(g, [-.4, .4], .3, pants, 1.1);
      const torso = mesh(roundedBox(1.6, 1.7, 1.0, .38), coat, 0, 1.25, 0); g.add(torso);
      if (cfg.bottom) g.add(mesh(roundedBox(1.62, .75, 1.02, .3), mat(cfg.bottom, { rough: .4 }), 0, .62, 0));
      cfg.torsoExtra && cfg.torsoExtra(g, coat);
      const sleeve = mat(dark(cfg.coat, .08), { rough: .35 });
      const poses = alt && alt.pose ? alt.pose : alt ? cfg.altPose : cfg.pose;
      arm(g, -1, poses[0], -.88, 1.75, 1.15, sleeve, skin); arm(g, 1, poses[1], .88, 1.75, 1.15, sleeve, skin);
      // 머리
      const head = sph(1, skin, 0, 3.0, 0); head.scale.set(1.05, 1, 1); g.add(head);
      [-1, 1].forEach((sd) => g.add(sph(.2, skin, sd * 1.02, 2.95, 0)));
      const fc = faceCap(1, face, { wA: 2.0, hA: 1.45, cy: 200, sep: 92, sc: 1.55 }); fc.scale.set(1.05, 1, 1); fc.position.copy(head.position); g.add(fc);
      cfg.head && cfg.head(g);
      cfg.held && cfg.held(g, poses);
      g.rotation.y = -.2; return g;
    };
  }
  const stripe = (g) => { const y = mat('#FFD230', { rough: .3, metal: .2 }); g.add(mesh(roundedBox(1.62, .16, 1.04, .05), y, 0, .95, 0)); g.add(mesh(roundedBox(.16, 1.5, 1.04, .05), y, 0, 1.3, .0)); };
  const captain = person({
    coat: '#2F3A66', pants: '#262E52', pose: ['down', 'wave'], altPose: ['down', 'up'],
    torsoExtra: stripe,
    head: (g) => {
      const hm = mat('#FFC21A', { rough: .22, coat: 1, metal: .1 });
      const dome = mesh(new T.SphereGeometry(1.08, 40, 20, 0, Math.PI * 2, 0, Math.PI * .52), hm, 0, 3.12, 0); dome.scale.x = 1.05; g.add(dome);
      g.add(mesh(new T.CylinderGeometry(1.38, 1.38, .1, 40), hm, 0, 3.12, .05).translateZ(.06));
      const badge = mesh(new T.CylinderGeometry(.28, .28, .06, 24), mat('#F2453D', { rough: .3 }), 0, 3.75, 1.0); badge.rotation.x = Math.PI / 2 - .2; g.add(badge);
      g.add(mesh(roundedBox(.12, .75, .12, .04), mat('#E0A800'), 0, 3.78, .15));
    },
  });
  /* ================= 아이 친구 (꾸미기 가능) =================
     cfg: skin, hair(bangs·short·bob·long·pigtails·curly), hairColor, shirt, pants, hat(none·bucket·cap·ribbon·headband), hatColor, glasses, print(none·star·heart·five) */
  function kid(cfg) {
    return (face, alt) => {
      const g = new T.Group(), skin = mat(cfg.skin, { rough: .5, coat: .15 }), shirt = mat(cfg.shirt, { rough: .55, coat: .1 });
      legs(g, [-.4, .4], .3, cfg.pants, 1.1);
      g.add(mesh(roundedBox(1.6, 1.7, 1.0, .38), shirt, 0, 1.25, 0));
      g.add(mesh(roundedBox(1.62, .62, 1.02, .28), mat(cfg.pants, { rough: .6 }), 0, .58, 0)); // 반바지·바지 윗부분
      const neck = mesh(new T.TorusGeometry(.36, .07, 10, 28), mat(dark(cfg.shirt, .12), { rough: .55 }), 0, 2.08, .1); neck.rotation.x = Math.PI / 2 - .25; g.add(neck); // 목둘레
      if (cfg.print && cfg.print !== 'none') {
        const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
        const col = cfg.print === 'heart' ? '#FF5A7A' : cfg.print === 'five' ? '#F2453D' : '#FFF6D0';
        c.fillStyle = col; c.strokeStyle = dark(col, .25); c.lineWidth = 5;
        if (cfg.print === 'five') { c.font = '900 108px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('5', 64, 70); }
        else if (cfg.print === 'heart') { c.beginPath(); c.moveTo(64, 108); c.bezierCurveTo(-6, 58, 30, 6, 64, 38); c.bezierCurveTo(98, 6, 134, 58, 64, 108); c.fill(); c.stroke(); }
        else { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 22 : 54; c.lineTo(64 + Math.cos(a) * r, 66 + Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); }
        const p = new T.Mesh(new T.PlaneGeometry(.62, .62), new T.MeshBasicMaterial({ map: tex(cv), transparent: true })); p.position.set(0, 1.42, .52); g.add(p);
      }
      // 팔: 짧은 소매 + 맨팔
      const poses = alt && alt.pose ? alt.pose : alt ? ['down', 'up'] : ['down', 'wave'];
      arm(g, -1, poses[0], -.88, 1.75, 1.15, skin, skin); arm(g, 1, poses[1], .88, 1.75, 1.15, skin, skin);
      [-1, 1].forEach((sd) => { const sl = sph(.36, shirt, sd * .86, 1.78, 0); sl.scale.set(1, .95, 1); g.add(sl); });
      // 머리
      const head = sph(1, skin, 0, 3.0, 0); head.scale.set(1.05, 1, 1); g.add(head);
      [-1, 1].forEach((sd) => g.add(sph(.2, skin, sd * 1.02, 2.95, 0)));
      const fc = faceCap(1, face, { wA: 2.0, hA: 1.45, cy: 200, sep: 92, sc: 1.55 }); fc.scale.set(1.05, 1, 1); fc.position.copy(head.position); g.add(fc);
      const fm = new T.Object3D(); fm.name = 'faceMark'; fm.position.set(0, 2.86, .86); g.add(fm); // 사진 얼굴 자리 (가운데, 가장자리)
      const fe = new T.Object3D(); fe.name = 'faceEdge'; fe.position.set(0, 2.86 + .78, .86); g.add(fe);
      // 머리카락
      const hm = mat(cfg.hairColor, { rough: .62, coat: .25 });
      const cap = (theta, rx, y = 3.0, z = -.04, r = 1.075) => { const m = mesh(new T.SphereGeometry(r, 44, 24, 0, Math.PI * 2, 0, Math.PI * theta), hm, 0, y, z); m.scale.set(1.08, 1, 1.04); m.rotation.x = rx; g.add(m); return m; };
      const hair = cfg.hair;
      if (hair === 'bangs') { cap(.435, .07); cap(.56, -.95); [-1, 1].forEach((sd) => { const sb = sph(.16, hm, sd * .98, 3.22, .18); sb.scale.set(.6, 1.3, .8); g.add(sb); }); }
      else if (hair === 'short') { cap(.38, -.2); cap(.5, -1.0); }
      else if (hair === 'bob') { cap(.42, .02); const b = sph(1.13, hm, 0, 2.92, -.26); b.scale.set(1.12, .92, 1); g.add(b); }
      else if (hair === 'long') { cap(.42, .02); const b = sph(1.13, hm, 0, 2.92, -.26); b.scale.set(1.1, .95, 1); g.add(b); g.add(mesh(roundedBox(2.0, 1.6, .5, .25), hm, 0, 2.05, -.62)); }
      else if (hair === 'pigtails') { cap(.42, .02); cap(.55, -.95); [-1, 1].forEach((sd) => { const p = sph(.42, hm, sd * 1.25, 2.72, -.25); p.scale.set(.9, 1.15, .9); g.add(p); g.add(sph(.13, mat('#FF6F9F', { rough: .4 }), sd * 1.05, 3.02, -.1)); }); }
      else if (hair === 'curly') { cap(.4, -.05); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = i % 2 ? .78 : .62; g.add(sph(.32, hm, Math.cos(a) * rr * 1.05, 3.72 + (i % 3) * .06, Math.sin(a) * rr - .15)); } }
      // 모자, 장식
      const hc = mat(cfg.hatColor || '#EEEBE2', { rough: .72, coat: .05 });
      if (cfg.hat === 'bucket') {
        const hat = new T.Group();
        hat.add(mesh(new T.CylinderGeometry(.98, 1.1, .72, 44), hc, 0, .3, 0));
        const top = mesh(new T.SphereGeometry(.98, 44, 16, 0, Math.PI * 2, 0, Math.PI / 2), hc, 0, .66, 0); top.scale.y = .32; hat.add(top);
        const brim = mesh(new T.CylinderGeometry(1.1, 1.72, .44, 48, 1, true), hc, 0, -.17, 0); brim.material = brim.material.clone(); brim.material.side = T.DoubleSide; hat.add(brim);
        hat.add(mesh(new T.CylinderGeometry(1.105, 1.12, .12, 44), mat(dark(cfg.hatColor || '#F7F7F2', .12), { rough: .8 }), 0, .02, 0));
        hat.position.set(0, 3.76, -.06); hat.rotation.x = -.2; g.add(hat);
      } else if (cfg.hat === 'cap') {
        const dome = mesh(new T.SphereGeometry(1.1, 44, 20, 0, Math.PI * 2, 0, Math.PI * .5), hc, 0, 3.15, -.02); dome.scale.set(1.06, .95, 1.04); dome.rotation.x = -.1; g.add(dome);
        const bill = mesh(roundedBox(1.3, .1, .9, .05), hc, 0, 3.28, .95); bill.rotation.x = .12; g.add(bill);
        g.add(sph(.1, hc, 0, 4.2, -.1));
      } else if (cfg.hat === 'ribbon') {
        const rm = mat(cfg.hatColor || '#FF6F9F', { rough: .4, coat: .4 });
        [-1, 1].forEach((sd) => { const w = mesh(new T.ConeGeometry(.24, .5, 18), rm, .62 + sd * .26, 3.92, .1); w.rotation.z = sd * Math.PI / 2; g.add(w); });
        g.add(sph(.13, rm, .62, 3.92, .14));
      } else if (cfg.hat === 'headband') {
        const hb = mesh(new T.TorusGeometry(1.06, .07, 10, 48, Math.PI), mat(cfg.hatColor || '#FF6F9F', { rough: .4, coat: .4 }), 0, 3.25, .05); hb.rotation.y = Math.PI / 2; hb.rotation.z = 0; hb.rotation.order = 'YXZ'; hb.rotation.x = -.35; g.add(hb);
      }
      if (cfg.glasses) {
        const gm = mat('#2A2A3E', { rough: .3, coat: .6 });
        [-1, 1].forEach((sd) => g.add(mesh(new T.TorusGeometry(.27, .045, 10, 32), gm, sd * .36, 3.02, 1.0)));
        const br = mesh(new T.CylinderGeometry(.03, .03, .2, 8), gm, 0, 3.05, 1.03); br.rotation.z = Math.PI / 2; g.add(br);
      }
      g.rotation.y = -.2; return g;
    };
  }
  const yuni = kid(C.KID_DEFAULT);
  const teacher = person({
    coat: '#7FC8F8', bottom: '#5A5A78', pants: '#5A5A78', pose: ['down', 'out'], altPose: ['down', 'wave'],
    torsoExtra: (g) => { const ap = mesh(roundedBox(1.1, 1.5, .12, .08), mat('#FF8FB1', { rough: .45 }), 0, 1.0, .52); g.add(ap); g.add(sph(.14, mat('#FFD230', { metal: .3 }), 0, 1.15, .6)); },
    head: (g) => {
      const hm = mat('#3A2418', { rough: .55, coat: .3 });
      const cap = mesh(new T.SphereGeometry(1.07, 40, 24, 0, Math.PI * 2, 0, Math.PI * .42), hm, 0, 3.0, -.07); cap.scale.set(1.08, 1, 1.03); cap.rotation.x = -.2; g.add(cap);
      g.add(sph(.4, hm, 1.0, 3.45, -.3)); g.add(sph(.15, mat('#FF8FB1', { rough: .3 }), .85, 3.55, -.15));
    },
    held: (g, poses) => { const bk = mesh(roundedBox(.8, .1, 1.0, .05), mat('#5CC85A', { rough: .4 }), 2.0, 1.7, .25); bk.rotation.z = .4; bk.rotation.x = .3; g.add(bk); g.add(sph(.15, mat('#FFD230'), 2.0, 1.78, .3)); },
  });

  /* ================= 안내자 (몽이, 토리, 코코) ================= */
  function guide(cfg) {
    return (face, alt) => {
      const g = new T.Group(), body = mat(cfg.color, { rough: .28, coat: .9 }), bump = mat(dark(cfg.color, .08), { rough: .3, coat: .8 });
      const [w, h, d] = cfg.size;
      g.add(mesh(roundedBox(w, h, d, cfg.r), body, 0, h / 2 + .1, 0));
      [-1, 1].forEach((sd) => g.add(mesh(roundedBox(.62, .5, .62, .2), bump, sd * w * .27, h + .3, 0)));
      const fp = facePlane(Math.min(w * .95, 2.2), 1.1, face, { cy: .5, sep: cfg.fsep ?? 100, sc: cfg.fsc ?? 1.9 }); fp.position.set(0, h * (cfg.faceY ?? .62), d / 2 + .02); g.add(fp);
      const am = mat(dark(cfg.color, .1), { rough: .3 }), hm = mat(dark(cfg.color, .05), { rough: .3 });
      const pose = alt && alt.pose ? alt.pose : alt ? cfg.altPose : cfg.pose, sy = h * .55;
      arm(g, -1, pose[0], -w / 2 - .02, sy, 1.15, am, hm); arm(g, 1, pose[1], w / 2 + .02, sy, 1.15, am, hm);
      legs(g, [-w * .27, w * .27], .15, dark(cfg.color, .1), 1.1);
      cfg.extra && cfg.extra(g, w, h, d);
      g.rotation.y = -.2; return g;
    };
  }
  const mongi = guide({ color: '#FF7F6E', size: [2.3, 2.3, 1.7], r: .8, pose: ['down', 'wave'], altPose: ['down', 'up'], faceY: .6 });
  const tori = guide({ color: '#9B7BE6', size: [1.7, 2.9, 1.4], r: .6, pose: ['down', 'out'], altPose: ['down', 'wave'], faceY: .66, fsep: 80, fsc: 1.6,
    extra: (g, w, h) => { const gold = mat('#FFB52E', { rough: .25, metal: .5 }); const ring = mesh(new T.TorusGeometry(.5, .08, 14, 36), gold, w / 2 + 1.5, h * .55 + .55, .35); g.add(ring); const gl = mesh(new T.CircleGeometry(.46, 32), new T.MeshPhysicalMaterial({ color: lin('#DFF4FF'), transparent: true, opacity: .45, roughness: .05, clearcoat: 1 }), w / 2 + 1.5, h * .55 + .55, .36); g.add(gl); const hd = mesh(new T.CylinderGeometry(.07, .07, .7, 10), mat('#8A5A2B', { coat: .2 }), w / 2 + 1.15, h * .55 + .05, .35); hd.rotation.z = .8; g.add(hd); } });
  const coco = guide({ color: '#38C9A6', size: [3.0, 1.9, 1.6], r: .72, pose: ['down', 'down'], altPose: ['wave', 'down'], faceY: .66,
    extra: (g, w, h, d) => { const b = mesh(roundedBox(1.5, 1.0, .18, .06), mat('#FFCF5A', { rough: .35 }), 0, h * .22, d / 2 + .12); b.rotation.x = -.12; g.add(b); [-1, 1].forEach((sd) => g.add(mesh(new T.PlaneGeometry(.55, .55), (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); c.fillStyle = sd < 0 ? '#E0457B' : '#3E9BFF'; c.font = '900 56px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(sd < 0 ? 'A' : 'B', 32, 36); return new T.MeshBasicMaterial({ map: tex(cv), transparent: true }); })(), sd * .38, h * .22, d / 2 + .23))); } });

  /* ================= 소방차 (앵앵이) ================= */
  function fireTruck(face, alt) {
    const g = new T.Group(), red = mat('#F2453D', { rough: .24, coat: 1 }), glass = new T.MeshPhysicalMaterial({ color: lin('#A8DCFF'), roughness: .05, clearcoat: 1, metalness: .1 }), wheelM = mat('#33334A', { rough: .6, coat: .2 }), hub = mat('#D5DAE4', { rough: .25, metal: .6 });
    g.add(mesh(roundedBox(3.6, 1.35, 1.5, .3), red, -.5, 1.05, 0));
    g.add(mesh(roundedBox(1.7, 1.9, 1.5, .34), red, 1.75, 1.3, 0));
    g.add(mesh(roundedBox(1.0, .72, .12, .08), glass, 2.05, 1.75, .74));
    g.add(mesh(roundedBox(3.7, .2, 1.52, .06), mat('#FFD230', { rough: .3 }), -.5, .98, 0));
    const lad = mat('#D5DAE4', { rough: .3, metal: .5 });
    [-.28, .28].forEach((z) => g.add(mesh(roundedBox(3.0, .1, .1, .03), lad, -.7, 1.88, z)));
    for (let i = 0; i < 7; i++) { const r = mesh(new T.CylinderGeometry(.04, .04, .6, 8), lad, -2 + i * .45, 1.88, 0); r.rotation.x = Math.PI / 2; g.add(r); }
    [[-1.6, 0], [1.9, 0]].forEach(([x]) => [-1, 1].forEach((z) => { const w = mesh(new T.CylinderGeometry(.58, .58, .3, 28), wheelM, x, .48, z * .72); w.rotation.x = Math.PI / 2; g.add(w); const h = mesh(new T.CylinderGeometry(.3, .3, .32, 20), hub, x, .48, z * .72); h.rotation.x = Math.PI / 2; g.add(h); }));
    [-.35, .35].forEach((x) => g.add(sph(.2, new T.MeshPhysicalMaterial({ color: lin(alt ? '#A85050' : '#FF4040'), emissive: lin(alt ? '#000000' : '#FF3030'), emissiveIntensity: alt ? 0 : .8, roughness: .2, clearcoat: 1 }), 1.75 + x, 2.38, 0)));
    const fp = facePlane(2.0, 1.1, face, { cy: .5, sep: 90, sc: 1.8 }); fp.position.set(-.4, 1.08, .76); g.add(fp);
    g.rotation.y = -.3; return g;
  }

  window.T3B = { captain, teacher, fireTruck, mongi, tori, coco };
  window.T3C = { drawFace, faceCap, facePlane, tex, arm, legs, FACES, FULL, BASIC, enqueue, enqueueMotion, kid };

  /* ---------- 작업 등록 ---------- */
  enqueue('somi', FACES('o', 'curious'), FULL, cat({ size: 1 }), { padX: .8, minW: 2.4 });
  enqueue('nana', FACES('smile', 'normal'), FULL, cat({ size: 1.25 }), { padX: .8, minW: 2.4 });
  enqueue('mongi', FACES('big'), FULL, mongi, { padX: 1.4 });
  enqueue('tori', FACES('o', 'curious'), FULL, tori, { padX: 1.4 });
  enqueue('coco', FACES('smile'), FULL, coco, { padX: 1.4 });
  enqueue('captain', FACES('big'), FULL, captain, { padX: 1.0, padTop: .3 });
  enqueue('teacher', FACES('smile'), BASIC, teacher, { padX: 1.4 });
  enqueue('fire', FACES('big'), FULL, fireTruck, { padX: .9, padTop: .3, minW: 3.5 });
  enqueueMotion('somi', FACES('o', 'curious'), cat({ size: 1 }), { padX: .8, minW: 2.4 });
  enqueueMotion('nana', FACES('smile', 'normal'), cat({ size: 1.25 }), { padX: .8, minW: 2.4 });
  enqueueMotion('mongi', FACES('big'), mongi, { padX: 1.4 });
  enqueueMotion('tori', FACES('o', 'curious'), tori, { padX: 1.4 });
  enqueueMotion('coco', FACES('smile'), coco, { padX: 1.4 });
  enqueueMotion('captain', FACES('big'), captain, { padX: 1.0, padTop: .3 });
  enqueueMotion('teacher', FACES('smile'), teacher, { padX: 1.4 });
})();
