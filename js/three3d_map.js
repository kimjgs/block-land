/* 홈 화면용 블록 대륙 지도(3D). 섬마다 마을 건물이 있고, 누를 자리(MAP_HOT)를 함께 계산한다. */
(function () {
  if (!window.T3 || !window.BG) return;
  const { T, renderer, lin, tasks } = window.T3;
  const RBC = ['#F2453D', '#FF8C2A', '#FFD230', '#4CC34A', '#3E9BFF', '#5A54D9', '#E040A8'];
  const VILLAGES = [
    { id: 'number', name: '숫자 마을', x: -110, z: -175 }, { id: 'hangul', name: '글자 마을', x: -440, z: -150 }, { id: 'science', name: '과학 연구소', x: 205, z: -160 },
    { id: 'story', name: '이야기 숲', x: -470, z: 150 }, { id: 'english', name: '영어 마을', x: -150, z: 165 }, { id: 'play', name: '놀이터', x: 165, z: 150 },
    { id: 'sea', name: '바다 마을', x: 470, z: 165 },
  ];
  window.MAP_VILLAGES = VILLAGES;

  const std = (hex, o = {}) => new T.MeshStandardMaterial({ color: lin(hex), roughness: o.rough ?? .75, emissive: o.emis ? lin(o.emis) : 0x000000, emissiveIntensity: o.ei ?? 0 });
  function rbox(w, h, d, r) {
    const g = new T.BoxGeometry(w, h, d, 6, 6, 6), pos = g.attributes.position, nor = g.attributes.normal, v = new T.Vector3(), inn = new T.Vector3(), n = new T.Vector3();
    const hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r, cl = (x, a) => Math.max(-a, Math.min(a, x));
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); inn.set(cl(v.x, hw), cl(v.y, hh), cl(v.z, hd)); n.copy(v).sub(inn); if (n.lengthSq() > 1e-9) { n.normalize(); v.copy(inn).addScaledVector(n, r); nor.setXYZ(i, n.x, n.y, n.z); } pos.setXYZ(i, v.x, v.y, v.z); }
    return g;
  }
  function gradTex(stops) { const cv = document.createElement('canvas'); cv.width = 4; cv.height = 512; const c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, 0, 512); stops.forEach(([o, col]) => g.addColorStop(o, col)); c.fillStyle = g; c.fillRect(0, 0, 4, 512); const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; return t; }
  function grassTex(base, dark, light) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d'); c.fillStyle = base; c.fillRect(0, 0, 1024, 512);
    let seed = 9; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 1600; i++) { const x = rnd() * 1024, y = rnd() * 512, h = 4 + rnd() * 9; c.strokeStyle = rnd() > .5 ? dark : light; c.globalAlpha = .35; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rnd() - .5) * 5, y - h); c.stroke(); }
    const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; return t;
  }
  function cubeTex(ch, bg, fg) { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'); c.fillStyle = bg; c.fillRect(0, 0, 128, 128); c.fillStyle = fg; c.font = '900 92px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, 64, 70); const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; return t; }

  function renderMap() {
    const sc = new T.Scene();
    sc.background = gradTex([[0, '#7CC8FF'], [.55, '#BFE6FF'], [1, '#EAF8FF']]);
    sc.add(new T.HemisphereLight(0xe8f5ff, 0x7fae6b, .9));
    const sun = new T.DirectionalLight(0xfff2d8, 1.35); sun.position.set(-300, 700, 450); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -900, right: 900, top: 700, bottom: -700, near: 10, far: 3000 }); sun.shadow.bias = -.0008; sun.shadow.radius = 6; sc.add(sun);
    const put = (m, x, y, z, cast = true, recv = true) => { m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; sc.add(m); return m; };
    const sp = (r, hex, x, y, z, sx = 1, sy = 1, sz = 1, o) => { const m = new T.Mesh(new T.SphereGeometry(r, 32, 20), std(hex, o)); m.scale.set(sx, sy, sz); return put(m, x, y, z); };
    const rb = (w, h, d, r, hex, x, y, z, o) => put(new T.Mesh(rbox(w, h, d, r), std(hex, o)), x, y, z);
    const cy = (r1, r2, h, hex, x, y, z, o) => put(new T.Mesh(new T.CylinderGeometry(r1, r2, h, 40), std(hex, o)), x, y, z);

    // 땅, 먼 언덕, 구름
    const gnd = new T.Mesh(new T.PlaneGeometry(2400, 1000), new T.MeshStandardMaterial({ map: grassTex('#8EDB72', '#5DBA4E', '#B6EE98'), roughness: .95 })); gnd.rotation.x = -Math.PI / 2; gnd.position.set(0, 0, 80); gnd.receiveShadow = true; sc.add(gnd);
    [[-520, 300, 90], [-120, 380, 110], [330, 340, 100], [700, 300, 90]].forEach(([x, rx, ry]) => { const h = sp(1, '#A9E3A0', x, 0, -470, rx, ry, 80, { rough: .9 }); h.castShadow = false; });
    [[-560, 230, -560, 1.2], [-180, 270, -580, .9], [260, 250, -560, 1.1], [620, 210, -560, 1]].forEach(([x, y, z, s]) => { const m = std('#FFFFFF', { rough: .9, emis: '#FFFFFF', ei: .4 }); [[0, 0, 60], [-46, -8, 42], [48, -10, 46], [10, 18, 44]].forEach(([dx, dy, r]) => { const b = new T.Mesh(new T.SphereGeometry(r * s, 24, 16), m); b.position.set(x + dx * s, y + dy * s, z); b.scale.z = .5; sc.add(b); }); });

    // 강
    const curve = new T.CatmullRomCurve3([[-760, 0, -60], [-560, 0, 10], [-300, 0, -20], [-30, 0, 40], [260, 0, 0], [480, 0, -40], [760, 0, 20]].map((p) => new T.Vector3(...p)));
    const ribbon = (width, y, hex, o) => { const pts = curve.getPoints(160), pos = [], idx = []; pts.forEach((p, i) => { const t = curve.getTangent(i / 160), n = new T.Vector3(-t.z, 0, t.x).normalize().multiplyScalar(width / 2); pos.push(p.x + n.x, y, p.z + n.z, p.x - n.x, y, p.z - n.z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }); const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const m = new T.Mesh(g, std(hex, o)); m.material.side = T.DoubleSide; m.receiveShadow = true; sc.add(m); };
    ribbon(112, .5, '#F3E3B5', { rough: .95 }); ribbon(84, 1.2, '#6CC8F2', { rough: .2 }); ribbon(30, 1.6, '#B8EBFF', { rough: .15 });

    // 장식
    const tree = (x, z, s = 1) => { cy(5 * s, 7 * s, 40 * s, '#A0703F', x, 20 * s, z); sp(26 * s, '#55C657', x, 52 * s, z); sp(17 * s, '#66D463', x - 16 * s, 44 * s, z + 8); };
    [[-640, -250, 1.1], [-620, 300, 1], [-290, 305, .9], [10, 310, 1], [320, 300, .9], [620, -200, 1.1], [-270, -330, .9], [70, -335, .8], [390, -320, .9], [640, 330, 1]].forEach(([x, z, s]) => tree(x, z, s));
    let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const nearRiver = (x, z, d) => Math.abs(curve.getPoint(Math.max(0, Math.min(1, (x + 760) / 1520))).z - z) < d;
    for (let i = 0; i < 40; i++) { const x = -680 + rnd() * 1360, z = -330 + rnd() * 680; if (VILLAGES.some((v) => Math.hypot(v.x - x, v.z - z) < 150) || nearRiver(x, z, 70)) continue; sp(6, ['#FF6F8E', '#FFD230', '#FFFFFF', '#7FB8FF'][i % 4], x, 6, z); }
    for (let i = 0; i < 18; i++) { const x = -680 + rnd() * 1360, z = -330 + rnd() * 680; if (VILLAGES.some((v) => Math.hypot(v.x - x, v.z - z) < 160) || nearRiver(x, z, 80)) continue; const c = RBC[i % 7]; if (i % 2) rb(18, 18, 18, 5, c, x, 9, z, { rough: .35 }); else sp(10, c, x, 10, z, 1, 1, 1, { rough: .3 }); }

    // 마을 건물
    const BUILD = {
      number(x, y, z) { [0, 1, 2, 3, 4].forEach((i) => rb(42, 42, 42, 10, RBC[i], x - 30, y + 21 + i * 43, z, { rough: .3 })); [0, 1, 2].forEach((i) => rb(42, 42, 42, 10, RBC[i + 2], x + 26, y + 21 + i * 43, z + 14, { rough: .3 })); rb(42, 42, 42, 10, RBC[5], x + 70, y + 21, z + 20, { rough: .3 }); cy(2.5, 2.5, 60, '#8A6A3A', x - 30, y + 245, z); put(new T.Mesh(new T.PlaneGeometry(40, 24), std('#FFD230')), x - 9, y + 262, z, false); },
      hangul(x, y, z) { const pu = '#8E6CE0', pk = '#FF6FA8'; rb(120, 34, 34, 15, pu, x - 50, y + 170, z); rb(34, 150, 34, 15, pu, x - 7, y + 95, z); rb(34, 150, 34, 15, pk, x + 55, y + 95, z + 10); rb(60, 30, 30, 13, pk, x + 88, y + 105, z + 10); put(new T.Mesh(new T.TorusGeometry(26, 11, 16, 32), std('#FFC233', { rough: .3 })), x - 60, y + 38, z + 50); },
      science(x, y, z) { cy(58, 62, 80, '#F4F6FA', x, y + 40, z); put(new T.Mesh(new T.SphereGeometry(60, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), std('#7FB8FF', { rough: .3 })), x, y + 80, z); rb(18, 60, 70, 6, '#2E3A66', x, y + 110, z, { rough: .4 }); const tl = put(new T.Mesh(new T.CylinderGeometry(9, 13, 90, 20), std('#FFC233', { rough: .3 })), x + 38, y + 135, z + 10); tl.rotation.z = -.7; sp(14, '#FF6F8E', x - 62, y + 20, z + 50); },
      story(x, y, z) { const pg = std('#FFFFFF', { rough: .6 }); [-1, 1].forEach((s) => { const b = put(new T.Mesh(rbox(95, 8, 120, 4), std(s < 0 ? '#3E9BFF' : '#F2453D', { rough: .4 })), x + s * 48, y + 22, z); b.rotation.z = s * .22; const p = put(new T.Mesh(rbox(88, 6, 112, 3), pg), x + s * 46, y + 28, z); p.rotation.z = s * .22; }); cy(7, 9, 70, '#A0703F', x, y + 60, z - 10); sp(40, '#55C657', x, y + 115, z - 10); sp(26, '#66D463', x - 30, y + 100, z); sp(24, '#4FB84F', x + 30, y + 98, z); sp(7, '#F2453D', x + 18, y + 120, z + 30); },
      english(x, y, z) { const mk = (ch, bg, px, py, pz) => put(new T.Mesh(new T.BoxGeometry(56, 56, 56), [0, 1, 2, 3, 4, 5].map((i) => i === 4 ? new T.MeshStandardMaterial({ map: cubeTex(ch, bg, '#FFFFFF'), roughness: .35 }) : std(bg, { rough: .35 }))), px, py, pz); mk('A', '#FF6F8E', x - 32, y + 28, z); mk('B', '#3E9BFF', x + 32, y + 28, z); mk('C', '#FFC233', x, y + 86, z); const rf = new T.Shape(); rf.moveTo(-50, 0); rf.lineTo(0, 46); rf.lineTo(50, 0); rf.closePath(); put(new T.Mesh(new T.ExtrudeGeometry(rf, { depth: 64, bevelEnabled: true, bevelSize: 4, bevelThickness: 4 }), std('#38C9A6', { rough: .4 })), x, y + 114, z - 32); },
      play(x, y, z) { rb(46, 90, 46, 8, '#FFC233', x - 40, y + 45, z, { rough: .4 }); const sl = put(new T.Mesh(rbox(110, 8, 38, 4), std('#FF6F8E', { rough: .3 })), x + 20, y + 52, z); sl.rotation.z = -.62; ['#F2453D', '#3E9BFF', '#FFD230', '#4CC34A', '#E040A8'].forEach((c, i) => { const bx = x + 50 + (i % 3) * 18 - 18, by = y + 150 + Math.floor(i / 3) * 26 + (i % 2) * 8; sp(16, c, bx, by, z - 10, 1, 1.15, 1, { rough: .25 }); put(new T.Mesh(new T.CylinderGeometry(.8, .8, by - y - 60, 6), std('#FFFFFF')), bx, (by + y + 60) / 2, z - 10, false); }); },
      sea(x, y, z) { // 등대와 작은 바다, 조개
        const pool = put(new T.Mesh(new T.CylinderGeometry(70, 70, 6, 40), std('#5CC8F2', { rough: .15 })), x + 20, y + 3, z + 20); pool.scale.z = .7;
        put(new T.Mesh(new T.TorusGeometry(70, 5, 10, 40), std('#F3E3B5', { rough: .9 })), x + 20, y + 5, z + 20).rotation.x = Math.PI / 2;
        [0, 1, 2, 3].forEach((i) => cy(26 - i * 2.5, 28 - i * 2.5, 36, i % 2 ? '#FFFFFF' : '#F2453D', x - 40, y + 18 + i * 36, z - 10, { rough: .4 }));
        cy(20, 20, 26, '#FFE89A', x - 40, y + 165, z - 10, { rough: .2, emis: '#FFD94A', ei: .6 });
        put(new T.Mesh(new T.ConeGeometry(26, 30, 32), std('#2E3A66', { rough: .4 })), x - 40, y + 193, z - 10);
        sp(13, '#FFB3C4', x + 40, y + 10, z + 40, 1.2, .6, 1, { rough: .4 }); sp(10, '#FFD230', x + 70, y + 8, z + 10, 1, .6, 1, { rough: .4 });
        const fin = put(new T.Mesh(new T.ConeGeometry(12, 26, 4), std('#3E7BEF', { rough: .3 })), x + 30, y + 16, z + 12); fin.rotation.z = -.4;
      },
    };
    VILLAGES.forEach((v) => {
      const isl = put(new T.Mesh(new T.CylinderGeometry(112, 120, 30, 56), [std('#6BC25A'), std('#93DE78'), std('#6BC25A')]), v.x, 15, v.z); isl.scale.z = .78;
      const lip = put(new T.Mesh(new T.TorusGeometry(112, 9, 14, 56), std('#B4EE9A', { rough: .5 })), v.x, 30, v.z); lip.rotation.x = Math.PI / 2; lip.scale.y = .78;
      BUILD[v.id](v.x, 30, v.z);
    });

    const PXW = 1600, PXH = 900; renderer.setSize(PXW, PXH, false); renderer.domElement.width = PXW; renderer.domElement.height = PXH;
    const cam = new T.OrthographicCamera(-640, 640, 360, -360, -3000, 5000); cam.position.set(0, 640, 760); cam.lookAt(0, 0, -20); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    renderer.render(sc, cam);
    const url = renderer.domElement.toDataURL('image/jpeg', .9);
    const proj = (x, y, z) => { const v = new T.Vector3(x, y, z).project(cam); return { x: (v.x + 1) / 2 * 1280, y: (1 - v.y) / 2 * 720 }; };
    window.MAP_HOT = VILLAGES.map((v) => { const a = proj(v.x, 110, v.z), b = proj(v.x, 0, v.z + 92); return { id: v.id, name: v.name, x: a.x, y: a.y, lx: b.x, ly: b.y }; });
    sc.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && !Array.isArray(o.material)) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    return `<img src="${url}" alt="" draggable="false" style="width:100%;height:100%;object-fit:cover;display:block">`;
  }
  tasks.unshift({ k: 'map', run: () => { try { BG.map = renderMap(); if (window.onMapReady) window.onMapReady(); } catch (e) { console.warn('지도 실패', e); } } });
})();
