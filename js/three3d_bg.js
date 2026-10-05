/* 배경(숲, 마을, 하늘, 밤, 바닷속, 공사장)을 3D로 그려서 그림(JPEG)으로 바꿔 끼운다. 위치는 평면 배경과 같게 맞춰 둠(가로 1000 × 세로 560, 땅 474). */
(function () {
  if (!window.T3 || !window.BG) return;
  const { T, renderer, lin, tasks } = window.T3;
  const W = 1000, H = 560, GY = 474;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const Y = (y) => H - y; // 설계 좌표(위에서 아래) → 3D(아래에서 위)

  const std = (hex, o = {}) => new T.MeshStandardMaterial({ color: lin(hex), roughness: o.rough ?? .75, metalness: 0, emissive: o.emis ? lin(o.emis) : 0x000000, emissiveIntensity: o.ei ?? 0 });
  const add = (sc, m, x, y, z = 0, cast = true, recv = true) => { m.position.set(x, Y(y), z); m.castShadow = cast; m.receiveShadow = recv; sc.add(m); return m; };
  const ball = (sc, r, hex, x, y, z, sx = 1, sy = 1, sz = 1, o) => { const m = new T.Mesh(new T.SphereGeometry(r, 40, 24), std(hex, o)); m.scale.set(sx, sy, sz); return add(sc, m, x, y, z); };
  const cyl = (sc, r1, r2, h, hex, x, y, z = 0, o) => add(sc, new T.Mesh(new T.CylinderGeometry(r2, r1, h, 24), std(hex, o)), x, y, z);
  function rbox(w, h, d, r) {
    const g = new T.BoxGeometry(w, h, d, 6, 6, 6), pos = g.attributes.position, nor = g.attributes.normal, v = new T.Vector3(), inn = new T.Vector3(), n = new T.Vector3();
    const hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r, cl = (x, a) => Math.max(-a, Math.min(a, x));
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); inn.set(cl(v.x, hw), cl(v.y, hh), cl(v.z, hd)); n.copy(v).sub(inn); if (n.lengthSq() > 1e-9) { n.normalize(); v.copy(inn).addScaledVector(n, r); nor.setXYZ(i, n.x, n.y, n.z); } pos.setXYZ(i, v.x, v.y, v.z); }
    return g;
  }
  const box = (sc, w, h, d, r, hex, x, y, z = 0, o) => add(sc, new T.Mesh(rbox(w, h, d, r), std(hex, o)), x, y, z);

  function gradTex(stops, w = 4, h = 512) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, 0, h); stops.forEach(([o, col]) => g.addColorStop(o, col)); c.fillStyle = g; c.fillRect(0, 0, w, h); const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; return t; }
  function glow(sc, x, y, size, color = 'rgba(255,244,184,1)') { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'), g = c.createRadialGradient(128, 128, 4, 128, 128, 126); g.addColorStop(0, color); g.addColorStop(.4, color.replace(',1)', ',.3)')); g.addColorStop(1, color.replace(',1)', ',0)')); c.fillStyle = g; c.fillRect(0, 0, 256, 256); const t = new T.CanvasTexture(cv); const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false })); m.position.set(x, Y(y), -600); sc.add(m); }
  function sky(sc, stops) { const m = new T.Mesh(new T.PlaneGeometry(W * 3, H * 3), new T.MeshBasicMaterial({ map: gradTex(stops), toneMapped: false })); m.position.set(W / 2, H / 2, -800); sc.add(m); }
  function cloud(sc, x, y, s = 1, z = -250) { const hex = '#FFFFFF', m = std(hex, { rough: .9, emis: '#FFFFFF', ei: .35 }); [[0, 0, 74, 1], [-34, 10, 44, .8], [38, 8, 50, .85], [-8, -14, 46, .8]].forEach(([dx, dy, r, k]) => { const b = new T.Mesh(new T.SphereGeometry(r * s * .55, 28, 18), m); b.scale.set(1.25, .82, .8); b.position.set(x + dx * s, Y(y + dy * s), z); b.castShadow = false; sc.add(b); }); }
  function lights(sc, o = {}) {
    sc.add(new T.HemisphereLight(o.sky ?? 0xdff0ff, o.ground ?? 0x7fae6b, o.hemi ?? .85));
    const d = new T.DirectionalLight(o.sun ?? 0xfff2d8, o.sunI ?? 1.5); d.position.set(o.sx ?? 120, 760, 650); d.target.position.set(500, 200, 0); sc.add(d.target);
    d.castShadow = true; d.shadow.mapSize.set(2048, 2048); const c = d.shadow.camera; c.left = -400; c.right = 1500; c.top = 900; c.bottom = -300; c.near = 10; c.far = 2500; d.shadow.bias = -.0006; d.shadow.radius = 5;
    sc.add(d);
  }
  function hills(sc, defs) { defs.forEach(([x, y, rx, ry, hex, z]) => { const m = ball(sc, 1, hex, x, y, z, rx, ry, 160, { rough: .9 }); m.castShadow = false; m.receiveShadow = false; }); }
  function grassTex(base, dark, light) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256; const c = cv.getContext('2d'); c.fillStyle = base; c.fillRect(0, 0, 1024, 256);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 700; i++) { const x = rnd() * 1024, y = rnd() * 256, h = 6 + rnd() * 14; c.strokeStyle = rnd() > .5 ? dark : light; c.globalAlpha = .45; c.lineWidth = 2 + rnd() * 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rnd() - .5) * 6, y - h); c.stroke(); }
    const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.wrapS = T.RepeatWrapping; return t;
  }
  function ground(sc, base, dark, light, top = GY) { const m = new T.Mesh(new T.BoxGeometry(2400, 500, 500), new T.MeshStandardMaterial({ map: grassTex(base, dark, light), roughness: .95 })); m.position.set(500, Y(top) - 250, 0); m.receiveShadow = true; sc.add(m); const lip = new T.Mesh(new T.BoxGeometry(2400, 14, 520), std(dark, { rough: .9 })); lip.position.set(500, Y(top) - 3, 0); lip.receiveShadow = true; sc.add(lip); }
  function bush(sc, x, s = 1) { ball(sc, 1, '#4FBF55', x, GY - 14 * s, 18, 52 * s, 34 * s, 34 * s); ball(sc, 1, '#5CCB62', x - 24 * s, GY - 8 * s, 28, 28 * s, 22 * s, 24 * s); ball(sc, 1, '#45B34C', x + 26 * s, GY - 6 * s, 26, 30 * s, 22 * s, 24 * s); }
  function flower(sc, x, color) { cyl(sc, 2.5, 2.5, 26, '#3A9A3A', x, GY + 18, 30); ball(sc, 8, color, x, GY + 4, 32); ball(sc, 3.5, '#FFD230', x, GY + 4, 40); }
  function house(sc, x, top, w, body, roof) {
    const h = GY - top; box(sc, w, h, 110, 10, body, x + w / 2, top + h / 2, -10);
    const rf = new T.Shape(); rf.moveTo(-w / 2 - 14, 0); rf.lineTo(0, 66); rf.lineTo(w / 2 + 14, 0); rf.closePath();
    const rm = new T.Mesh(new T.ExtrudeGeometry(rf, { depth: 130, bevelEnabled: true, bevelSize: 6, bevelThickness: 6, bevelSegments: 3 }), std(roof, { rough: .55 })); rm.position.set(x + w / 2, Y(top) - 2, -75); rm.castShadow = true; rm.receiveShadow = true; sc.add(rm);
    box(sc, 34, 62, 14, 7, '#FFFFFF', x + w / 2, GY - 31, 52); [x + 31, x + w - 31].forEach((wx) => { box(sc, 32, 32, 12, 8, '#CFEFFF', wx, top + 42, 52, { rough: .2 }); box(sc, 38, 38, 8, 9, '#FFFFFF', wx, top + 42, 49); });
  }
  function tree(sc, x, trunkTop, r, z = 0) { cyl(sc, 9, 12, GY - trunkTop, '#A0703F', x, (GY + trunkTop) / 2, z); ball(sc, r, '#5CC85A', x, trunkTop - r * .55, z + 4); ball(sc, r * .62, '#66D463', x - r * .65, trunkTop - r * .2, z + 8); ball(sc, r * .6, '#52BE50', x + r * .65, trunkTop - r * .25, z + 8); }

  function render(build, o = {}) {
    const sc = new T.Scene(); build(sc);
    const PXW = 1600, PXH = 896; renderer.setSize(PXW, PXH, false); renderer.domElement.width = PXW; renderer.domElement.height = PXH;
    const cam = new T.OrthographicCamera(0, W, H, 0, -2000, 3000); cam.position.set(0, 0, 1200); cam.lookAt(0, 0, 0);
    renderer.render(sc, cam);
    const url = renderer.domElement.toDataURL('image/jpeg', .92);
    sc.traverse((x) => { if (x.geometry) x.geometry.dispose(); if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); } });
    return `<img src="${url}" alt="" draggable="false" style="width:100%;height:100%;object-fit:cover;display:block">`;
  }

  const SCENES = {
    forest(sc) {
      sky(sc, [[0, '#8FD0FF'], [1, '#E4F5FF']]); glow(sc, 110, 80, 560); ball(sc, 42, '#FFE070', 110, 80, -500, 1, 1, 1, { emis: '#FFD94A', ei: 1 });
      cloud(sc, 300, 90, 1); cloud(sc, 860, 62, 1.25);
      hills(sc, [[250, 400, 520, 120, '#B8E4C4', -420], [800, 395, 560, 110, '#B2E0BE', -440], [330, 450, 640, 100, '#9BDC85', -250], [900, 440, 520, 90, '#93D67F', -270]]);
      lights(sc); ground(sc, '#7FD36B', '#4FAE45', '#A6E78F');
      // 큰 나무 (줄기 x 496~546, 가지 끝 660,150)
      cyl(sc, 24, 27, GY - 120, '#A0703F', 521, (GY + 120) / 2, 0);
      const br = new T.Mesh(new T.CylinderGeometry(9, 12, 150, 20), std('#A0703F')); br.rotation.z = Math.PI / 2 + .14; add(sc, br, 590, 160, 0);
      ball(sc, 80, '#5CC85A', 450, 100, 6); ball(sc, 92, '#5CC85A', 560, 50, 4); ball(sc, 64, '#5CC85A', 520, 140, 24); ball(sc, 46, '#66D463', 410, 135, 28); ball(sc, 50, '#52BE50', 610, 95, 26);
      ball(sc, 13, '#F2453D', 430, 80, 80, 1, 1, 1, { rough: .3 }); ball(sc, 13, '#F2453D', 590, 30, 84, 1, 1, 1, { rough: .3 });
      bush(sc, 60); bush(sc, 250); bush(sc, 880); [[140, '#FF6F8E'], [330, '#FFD230'], [790, '#FFFFFF'], [930, '#FF6F8E']].forEach(([x, c]) => flower(sc, x, c));
    },
    village(sc) {
      sky(sc, [[0, '#9AD6FF'], [1, '#EAF7FF']]); glow(sc, 880, 80, 560); ball(sc, 42, '#FFE070', 880, 80, -500, 1, 1, 1, { emis: '#FFD94A', ei: 1 });
      cloud(sc, 200, 80, 1); cloud(sc, 620, 120, .9);
      hills(sc, [[250, 370, 560, 120, '#BFE8CC', -420], [800, 360, 560, 110, '#B9E4C6', -440], [450, 440, 700, 100, '#A6E08C', -250]]);
      lights(sc, { sx: 880 }); ground(sc, '#7FD36B', '#4FAE45', '#A6E78F');
      const path = new T.Shape(); path.moveTo(380, 0); path.quadraticCurveTo(470, 30, 600, 40); path.lineTo(640, 40); path.quadraticCurveTo(560, 20, 520, 0 - 90); path.lineTo(380, -90);
      const pm = new T.Mesh(new T.ShapeGeometry(path), std('#F1D9A0', { rough: .95 })); pm.position.set(0, Y(GY + 40) + 10, 40); pm.receiveShadow = true; sc.add(pm);
      [[60, 330, '#FF8A7A', '#E85F4E'], [250, 350, '#FFD230', '#E0B000'], [680, 340, '#6FC3F0', '#4AA3D6'], [850, 360, '#9BDC85', '#6DB84A']].forEach(([x, t, b, r]) => house(sc, x, t, 130, b, r));
      tree(sc, 458, 380, 52, 30); tree(sc, 838, 380, 52, 30);
      [[20, '#FF6F8E'], [220, '#FFFFFF'], [640, '#FFD230'], [960, '#FF6F8E']].forEach(([x, c]) => flower(sc, x, c));
    },
    sky(sc) {
      sky(sc, [[0, '#6EC0FF'], [1, '#D9F1FF']]); glow(sc, 140, 100, 700); ball(sc, 50, '#FFE070', 140, 100, -500, 1, 1, 1, { emis: '#FFD94A', ei: 1 });
      lights(sc, { hemi: 1.0, sx: 140 });
      ['#F2453D', '#FF9A3C', '#FFD93B', '#4CC34A', '#3E9BFF', '#5A54D9', '#E040A8'].forEach((c, i) => { const r = 330 - i * 20, t = new T.Mesh(new T.TorusGeometry(r, 11, 20, 90, Math.PI), std(c, { rough: .55, emis: c, ei: .25 })); t.position.set(500, Y(470), -200); t.scale.z = .5; t.castShadow = true; sc.add(t); });
      cloud(sc, 190, 360, 1.6, 40); cloud(sc, 800, 330, 1.8, 40); cloud(sc, 500, 470, 2.2, 60); cloud(sc, 850, 130, 1, -100); cloud(sc, 380, 120, 1.2, -100);
    },
    night(sc) {
      sky(sc, [[0, '#14183F'], [1, '#3B3F85']]); glow(sc, 820, 110, 640, 'rgba(255,243,176,1)'); ball(sc, 52, '#FFF3B0', 820, 110, -500, 1, 1, 1, { emis: '#FFF3B0', ei: 1 });
      let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 70; i++) ball(sc, 1.5 + rnd() * 2.8, '#FFF7C2', rnd() * W, 10 + rnd() * 330, -450, 1, 1, 1, { emis: '#FFF7C2', ei: 1 });
      lights(sc, { sky: 0x7d86d8, ground: 0x232857, hemi: .75, sun: 0xaab4ff, sunI: .9, sx: 820 });
      hills(sc, [[250, 440, 560, 110, '#2B2F66', -300], [800, 430, 560, 100, '#272B5E', -320]]);
      ground(sc, '#232857', '#1B1F47', '#2C3270');
    },
    sea(sc) {
      // 위 150까지 하늘, 아래는 물속. 모래 바닥 500.
      sky(sc, [[0, '#BDE8FF'], [.34, '#BDE8FF'], [.422, '#E9F8FF'], [.4235, '#5CC8F2'], [.571, '#2E8FD6'], [.667, '#1C5DA8'], [1, '#1C5DA8']]); // 하늘 판은 화면의 3배 높이
      glow(sc, 880, 70, 420); ball(sc, 40, '#FFE070', 880, 70, -500, 1, 1, 1, { emis: '#FFD94A', ei: 1 });
      cloud(sc, 250, 70, 1, -450);
      lights(sc, { sky: 0xd8f4ff, ground: 0x2e7fc6, hemi: 1.0, sun: 0xf2fbff, sunI: 1.25, sx: 600 });
      // 물결 (수면)
      for (let x = -20; x <= 1020; x += 46) { const m = ball(sc, 1, '#8FDBFF', x, 156, -380, 30, 12, 20, { rough: .3, emis: '#8FDBFF', ei: .35 }); m.castShadow = false; }
      // 빛줄기
      [[300, 70], [520, 100], [760, 60]].forEach(([x, w]) => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 256); const t = new T.CanvasTexture(cv); const m = new T.Mesh(new T.PlaneGeometry(w, 420), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false })); m.position.set(x, Y(370), -350); m.rotation.z = -.25; sc.add(m); });
      // 모래 바닥 (조금 울퉁불퉁)
      const sand = new T.Mesh(new T.BoxGeometry(2400, 500, 500), std('#E8CB8C', { rough: .95 })); sand.position.set(500, Y(500) - 250, 0); sand.receiveShadow = true; sc.add(sand);
      [[120, 506, 260], [520, 498, 300], [880, 504, 240]].forEach(([x, y, r]) => { const m = ball(sc, 1, '#E2C283', x, y, -40, r, 26, 120, { rough: .95 }); m.castShadow = false; });
      // 산호
      const coral = (x, c) => { const m = std(c, { rough: .45 }); const T3t = window.T3.tube; [[[0, 0], [0, -70]], [[0, -40], [-22, -70]], [[0, -50], [22, -82]]].forEach(([a, b]) => { const p = (q) => [x + q[0], Y(500 + q[1]), 10]; const tb = T3t([p(a), [x + (a[0] + b[0]) / 2, Y(500 + (a[1] + b[1]) / 2) + 4, 10], p(b)], 7, m); tb.castShadow = true; sc.add(tb); add(sc, new T.Mesh(new T.SphereGeometry(8, 16, 12), m), x + b[0], 500 + b[1], 10); }); };
      [[80, '#FF7A93'], [220, '#FFA64D'], [700, '#E040A8'], [900, '#FF7A93']].forEach(([x, c]) => coral(x, c));
      // 해초 (흔들리는 건 위에 겹치는 그림이 맡음 — 여기선 바위와 조개)
      [[300, 494, 26, '#8A9AB0'], [330, 500, 16, '#9AA8BC'], [640, 496, 22, '#8A9AB0'], [960, 498, 18, '#9AA8BC']].forEach(([x, y, r, c]) => ball(sc, r, c, x, y, 20, 1.3, .8, 1, { rough: .8 }));
      const star = new T.Shape(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 7 : 17; i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); } star.closePath();
      [[470, 508, '#FF8C5A'], [790, 512, '#FFD230']].forEach(([x, y, c]) => { const m = new T.Mesh(new T.ExtrudeGeometry(star, { depth: 4, bevelEnabled: true, bevelSize: 3, bevelThickness: 3, bevelSegments: 2 }), std(c, { rough: .5 })); m.rotation.x = -1.1; add(sc, m, x, y, 60); });
      add(sc, new T.Mesh(new T.SphereGeometry(14, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std('#FFC4D0', { rough: .4 })), 590, 506, 60).scale.set(1, .6, 1);
    },
    construction(sc) {
      sky(sc, [[0, '#A3D9FF'], [1, '#F0F9FF']]); glow(sc, 120, 80, 520); ball(sc, 40, '#FFE070', 120, 80, -500, 1, 1, 1, { emis: '#FFD94A', ei: 1 });
      cloud(sc, 500, 80, 1); cloud(sc, 850, 120, .9);
      hills(sc, [[300, 420, 620, 60, '#C9B38C', -300], [850, 410, 520, 55, '#CDB791', -320]]);
      lights(sc, { ground: 0xb89b6a, sx: 200 });
      ground(sc, '#D8BE8E', '#BFA070', '#E6D0A4');
      // 크레인
      const yel = '#FFC21A';
      box(sc, 26, 356, 26, 3, yel, 843, 120 + 178, -120, { rough: .45 });
      for (let i = 0; i < 8; i++) { const b = new T.Mesh(new T.CylinderGeometry(2, 2, 34, 8), std('#C99400')); b.rotation.z = .9; add(sc, b, 843, 150 + i * 40, -106); }
      box(sc, 300, 20, 20, 3, yel, 790, 118, -120, { rough: .45 });
      box(sc, 50, 30, 30, 4, '#5A6070', 920, 140, -120);
      cyl(sc, 1.5, 1.5, 100, '#555566', 656, 180, -120);
      box(sc, 40, 30, 30, 5, '#F2453D', 656, 245, -120, { rough: .4 });
      // 흙더미
      ball(sc, 1, '#B58A5A', 160, GY, 10, 100, 90, 70, { rough: .9 }); ball(sc, 1, '#C49A68', 285, GY, 30, 75, 62, 60, { rough: .9 });
      [[120, 440], [190, 420], [260, 455], [300, 440]].forEach(([x, y]) => ball(sc, 9, '#8A6540', x, y, 70, 1, .8, 1, { rough: .9 }));
      // 고깔
      [434, 474, 714].forEach((x) => { add(sc, new T.Mesh(new T.ConeGeometry(15, 46, 24), std('#FF8C2A', { rough: .4 })), x, GY - 23, 50); add(sc, new T.Mesh(new T.CylinderGeometry(9.5, 11, 7, 24), std('#FFFFFF', { rough: .4 })), x, GY - 22, 50); box(sc, 34, 5, 34, 2, '#C25F00', x, GY - 1, 50); });
      // 줄무늬 울타리
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 32; const c = cv.getContext('2d'); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#FFD230' : '#2E2E44'; c.beginPath(); c.moveTo(i * 32, 32); c.lineTo(i * 32 + 16, 0); c.lineTo(i * 32 + 48, 0); c.lineTo(i * 32 + 32, 32); c.fill(); }
      const st = new T.CanvasTexture(cv); st.encoding = T.sRGBEncoding;
      add(sc, new T.Mesh(new T.BoxGeometry(160, 18, 6), [std('#FFD230'), std('#FFD230'), std('#FFD230'), std('#FFD230'), new T.MeshStandardMaterial({ map: st, roughness: .5 }), std('#FFD230')]), 600, GY - 34, 30);
      [530, 670].forEach((x) => box(sc, 8, 44, 8, 2, '#8A90A0', x, GY - 22, 26));
    },
  };
  // 바닷속은 해초가 흔들리고 물고기·거품이 움직이는 부분만 그림 위에 겹친다.
  const seaLive = () => {
    let o = '';
    [150, 340, 560, 820].forEach((x) => { o += `<path d="M${x} 500 q-14 -40 0 -70 t0 -70" stroke="#3DBF7A" stroke-width="10" fill="none" stroke-linecap="round"><animate attributeName="d" values="M${x} 500 q-14 -40 0 -70 t0 -70;M${x} 500 q14 -40 0 -70 t0 -70;M${x} 500 q-14 -40 0 -70 t0 -70" dur="4s" repeatCount="indefinite"/></path>`; });
    [[300, 300, 8], [320, 260, 5], [650, 340, 9], [670, 290, 6], [460, 230, 7]].forEach(([x, y, r]) => { o += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".35" stroke="#fff" stroke-width="2"><animate attributeName="cy" values="${y};${y - 60};${y}" dur="6s" repeatCount="indefinite"/></circle>`; });
    [[420, 380, '#FFA64D'], [600, 300, '#FFD230']].forEach(([x, y, c]) => { o += `<g><ellipse cx="${x}" cy="${y}" rx="30" ry="16" fill="${c}"/><polygon points="${x + 26},${y} ${x + 48},${y - 14} ${x + 48},${y + 14}" fill="${c}"/><circle cx="${x - 16}" cy="${y - 3}" r="4" fill="#2E2E44"/><animateTransform attributeName="transform" type="translate" values="0 0;-30 6;0 0" dur="7s" repeatCount="indefinite"/></g>`; });
    return `<svg viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0">${o}</svg>`;
  };
  const LIVE = { sea: seaLive };
  ['forest', 'village', 'sky', 'night', 'sea', 'construction'].forEach((k) => tasks.push({ k: 'zz', run: () => { try { const img = render(SCENES[k]); BG[k] = LIVE[k] ? `<div style="position:relative;width:100%;height:100%">${img}${LIVE[k]()}</div>` : img; } catch (e) { console.warn('3D 배경 실패', k, e); } } }));
})();
