/* 글자 친구(ㄱ ㄴ ㅁ ㅂ ㅇ ㅏ ㅣ ㅜ)와 구급차·경찰차·포크레인·덤프트럭·불도저를 3D로. (three3d_chars.js 뒤에 불러온다) */
(function () {
  if (!window.T3 || !window.T3C || !window.FR) return;
  const { T, lin, dark, mat, mesh, sph, tube, roundedBox } = window.T3;
  const { facePlane, tex, arm, legs, FACES, FULL, enqueue, enqueueMotion } = window.T3C;

  /* ================= 글자 친구 ================= */
  // 그림(0~250) 좌표를 3D로: 100 = 1칸, 아래가 땅
  const X = (x) => (x - 125) / 100, Y = (y) => (290 - y) / 100;
  const SW = .7; // 획 두께
  const LETTERS = [
    { key: 'L0', segs: [[40, 60, 190, 60], [190, 60, 190, 245]], face: [100, 62], mouth: 'smile', arms: [[8, 72, 'down'], [226, 150, 'wave']], legs: [176, 206, 278] },
    { key: 'L1', segs: [[60, 40, 60, 200], [60, 200, 215, 200]], face: [60, 92], mouth: 'grin', arms: [[26, 130, 'down'], [96, 104, 'wave']], legs: [80, 196, 233] },
    { key: 'L2', segs: [[50, 60, 200, 60], [200, 60, 200, 215], [200, 215, 50, 215], [50, 215, 50, 60]], face: [125, 58], mouth: 'o', arms: [[15, 140, 'down'], [235, 130, 'wave']], legs: [66, 184, 248] },
    { key: 'L3', segs: [[50, 40, 50, 215], [50, 215, 200, 215], [200, 215, 200, 40], [50, 128, 200, 128]], face: [125, 126], mouth: 'big', arms: [[15, 150, 'down'], [235, 120, 'wave']], legs: [66, 184, 248] },
    { key: 'L4', ring: [125, 138, 88], face: [125, 54], mouth: 'grin', eyes: 'happy', arms: [[37, 140, 'down'], [213, 130, 'wave']], legs: [98, 152, 268] },
    { key: 'L5', segs: [[90, 40, 90, 245], [90, 140, 200, 140]], face: [90, 88], mouth: 'big', arms: [[55, 190, 'down'], [235, 140, 'out']], legs: [74, 106, 278], vowel: true },
    { key: 'L6', segs: [[125, 40, 125, 245]], face: [125, 88], mouth: 'grin', arms: [[90, 150, 'down'], [160, 140, 'wave']], legs: [109, 141, 278], vowel: true },
    { key: 'L7', segs: [[35, 90, 215, 90], [125, 90, 125, 245]], face: [125, 90], mouth: 'o', arms: [[0, 100, 'down'], [250, 90, 'wave']], legs: [109, 141, 278], vowel: true },
    { key: 'L8', segs: [[160, 40, 160, 245], [160, 140, 70, 140]], face: [160, 88], mouth: 'o', arms: [[90, 190, 'down'], [205, 150, 'wave']], legs: [144, 176, 278], vowel: true },
    { key: 'L9', segs: [[35, 195, 215, 195], [125, 195, 125, 100]], face: [125, 196], mouth: 'o', arms: [[0, 200, 'down'], [250, 190, 'wave']], legs: [80, 170, 250], vowel: true },
    { key: 'L10', segs: [[125, 50, 55, 215], [125, 50, 195, 215]], face: [125, 108], mouth: 'smile', arms: [[46, 150, 'down'], [205, 140, 'wave']], legs: [55, 195, 262] },
  ];
  const ALT_POSE = { down: 'down', wave: 'up', out: 'wave', up: 'wave' };
  function letter(L) {
    const color = L.vowel ? '#FF6FA8' : '#8E6CE0';
    return (face, alt) => {
      const g = new T.Group(), body = mat(color, { rough: .26, coat: .9 });
      if (L.ring) {
        const [cx, cy, r] = L.ring, sh = new T.Shape(), hole = new T.Path();
        sh.absarc(0, 0, r / 100 + SW / 2, 0, Math.PI * 2, false); hole.absarc(0, 0, r / 100 - SW / 2, 0, Math.PI * 2, true); sh.holes.push(hole);
        const geo = new T.ExtrudeGeometry(sh, { depth: SW - .24, bevelEnabled: true, bevelThickness: .12, bevelSize: .12, bevelSegments: 6, curveSegments: 64 });
        g.add(mesh(geo, body, X(cx), Y(cy), -(SW - .24) / 2));
      } else {
        L.segs.forEach(([x1, y1, x2, y2]) => {
          if (x1 !== x2 && y1 !== y2) { // 비스듬한 획(ㅅ)
            const dx = (x2 - x1) / 100, dy = (y1 - y2) / 100, len = Math.hypot(dx, dy) + SW * .55, m = mesh(roundedBox(len, SW, SW, .3), body, X((x1 + x2) / 2), Y((y1 + y2) / 2), 0);
            m.rotation.z = Math.atan2(dy, dx); g.add(m); return;
          }
          const w = Math.abs(x2 - x1) / 100 + SW, h = Math.abs(y2 - y1) / 100 + SW;
          g.add(mesh(roundedBox(w, h, SW, .3), body, X((x1 + x2) / 2), Y((y1 + y2) / 2), 0));
        });
      }
      const am = mat(dark(color, .1), { rough: .3 }), hm = mat(dark(color, .04), { rough: .3 });
      L.arms.forEach(([x, y, pose], i) => arm(g, i === 0 ? -1 : 1, alt && alt.pose ? alt.pose[i] : alt && i === 1 ? ALT_POSE[pose] : pose, X(x), Y(y), .95, am, hm, 0));
      legs(g, [X(L.legs[0]), X(L.legs[1])], Y(L.legs[2]) + .12, dark(color, .12), 1.0);
      const fp = facePlane(1.3, 1.0, face, { cy: .45, sep: 60, sc: 1.15 }); fp.position.set(X(L.face[0]), Y(L.face[1] + 4), SW / 2 + .015); g.add(fp);
      g.rotation.y = -.18; return g;
    };
  }
  LETTERS.filter((L) => !window.__ONLY || window.__ONLY.includes(L.key)).forEach((L) => { const f = FACES(L.mouth, 'normal', L.eyes || 'normal'); enqueue(L.key, f, FULL, letter(L), { padX: 1.0 }); enqueueMotion(L.key, f, letter(L), { padX: 1.0 }); });

  /* ================= 탈것 공통 부품 ================= */
  const glass = () => new T.MeshPhysicalMaterial({ color: lin('#A8DCFF'), roughness: .05, clearcoat: 1, metalness: .1 });
  function wheel(g, x, z, r = .58) {
    const w = mesh(new T.CylinderGeometry(r, r, .3, 28), mat('#33334A', { rough: .6, coat: .2 }), x, r - .1, z); w.rotation.x = Math.PI / 2; g.add(w);
    const h = mesh(new T.CylinderGeometry(r * .52, r * .52, .32, 20), mat('#D5DAE4', { rough: .25, metal: .6 }), x, r - .1, z); h.rotation.x = Math.PI / 2; g.add(h);
  }
  function track(g, x, len, z) { // 무한궤도
    g.add(mesh(roundedBox(len, .72, .5, .34), mat('#3A3A50', { rough: .55, coat: .2 }), x, .36, z));
    const rm = mat('#C9CED8', { rough: .3, metal: .5 });
    for (let i = 0; i < 5; i++) { const w = mesh(new T.CylinderGeometry(.17, .17, .54, 16), rm, x - len / 2 + .36 + i * (len - .72) / 4, .36, z); w.rotation.x = Math.PI / 2; g.add(w); }
  }
  const lamp = (g, color, x, y, z, r = .18, on = true) => g.add(sph(r, new T.MeshPhysicalMaterial({ color: lin(on ? color : dark(color, .35)), emissive: lin(on ? color : '#000000'), emissiveIntensity: on ? .8 : 0, roughness: .2, clearcoat: 1 }), x, y, z));
  const decal = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = Math.round(w * 128); cv.height = Math.round(h * 128); draw(cv.getContext('2d'), cv.width, cv.height); return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex(cv), transparent: true })); };
  const sideFace = (g, face, x, y, z, w = 2.0, h = 1.1, sc = 1.8, sep = 90) => { const fp = facePlane(w, h, face, { cy: .5, sep, sc }); fp.position.set(x, y, z); g.add(fp); };

  /* 구급차 (삐뽀) */
  function ambulance(face, alt) {
    const g = new T.Group(), wm = mat('#E4EAF3', { rough: .38, coat: .6 }), cm = mat('#D5DEEA', { rough: .38, coat: .6 });
    g.add(mesh(roundedBox(3.4, 2.0, 1.6, .32), wm, -.55, 1.45, 0));
    g.add(mesh(roundedBox(1.6, 1.6, 1.6, .36), cm, 1.75, 1.25, 0));
    g.add(mesh(roundedBox(3.42, .14, 1.62, .05), mat('#F2453D', { rough: .3 }), -.55, 2.25, 0));
    g.add(mesh(roundedBox(.95, .62, .12, .08), glass(), 2.0, 1.6, .79));
    g.add(mesh(roundedBox(4.95, .22, 1.64, .06), mat('#F2453D', { rough: .3 }), .2, .95, 0));
    const heart = decal(.62, .62, (c, w) => { c.fillStyle = '#FF5A5A'; c.strokeStyle = '#C93A3A'; c.lineWidth = 6; c.beginPath(); c.moveTo(w / 2, w * .85); c.bezierCurveTo(-w * .1, w * .4, w * .2, -w * .05, w / 2, w * .28); c.bezierCurveTo(w * .8, -w * .05, w * 1.1, w * .4, w / 2, w * .85); c.fill(); c.stroke(); });
    heart.position.set(-1.75, 2.05, .81); g.add(heart);
    lamp(g, '#FF4040', 1.5, 2.15, 0, .18, !alt); lamp(g, '#3E9BFF', 2.0, 2.15, 0, .18, alt);
    lamp(g, '#FFD230', 2.57, 1.0, .5, .12);
    sideFace(g, face, -.4, 1.42, .81);
    wheel(g, -1.5, .72); wheel(g, 1.75, .72); wheel(g, -1.5, -.72); wheel(g, 1.75, -.72);
    g.rotation.y = -.3; return g;
  }
  /* 경찰차 (씽씽) */
  function police(face, alt) {
    const g = new T.Group(), blue = mat('#3E7BEF', { rough: .22, coat: 1 }), wm = mat('#F4F6FA', { rough: .25, coat: 1 });
    g.add(mesh(roundedBox(4.4, 1.05, 1.6, .4), blue, 0, .98, 0));
    g.add(mesh(roundedBox(4.42, .2, 1.62, .06), mat('#FFFFFF', { rough: .3 }), 0, 1.0, 0));
    g.add(mesh(roundedBox(2.5, .95, 1.4, .36), wm, -.15, 1.85, 0));
    [-.75, .45].forEach((x) => g.add(mesh(roundedBox(.95, .6, .1, .08), glass(), x, 1.88, .7)));
    g.add(mesh(roundedBox(.5, .26, .5, .1), mat(alt ? '#A83030' : '#FF4848', { rough: .25, coat: 1 }), -.42, 2.45, 0));
    g.add(mesh(roundedBox(.5, .26, .5, .1), mat(alt ? '#4AA8FF' : '#2A5AA0', { rough: .25, coat: 1 }), .12, 2.45, 0));
    lamp(g, '#FF4848', -.42, 2.5, 0, .14, !alt); lamp(g, '#4AA8FF', .12, 2.5, 0, .14, alt);
    lamp(g, '#FFD230', 2.15, 1.1, .55, .12);
    sideFace(g, face, .2, .98, .81, 1.6, .9, 1.45, 74);
    wheel(g, -1.45, .72, .5); wheel(g, 1.45, .72, .5); wheel(g, -1.45, -.72, .5); wheel(g, 1.45, -.72, .5);
    g.rotation.y = -.3; return g;
  }
  /* 포크레인 (파파) */
  function excavator(face, alt) {
    const g = new T.Group(), yel = mat('#FFC21A', { rough: .26, coat: 1 }), steel = mat('#8A90A0', { rough: .3, metal: .55 });
    track(g, -.3, 3.2, .55); track(g, -.3, 3.2, -.55);
    g.add(mesh(roundedBox(2.6, 1.0, 1.5, .3), yel, -.4, 1.25, 0));
    g.add(mesh(roundedBox(1.2, 1.1, 1.25, .26), yel, .25, 2.25, 0));
    g.add(mesh(roundedBox(.8, .58, .1, .08), glass(), .3, 2.35, .63));
    const sh = alt ? [1.0, 1.6, 0] : [1.0, 1.6, 0], el = alt ? [1.9, 3.1, 0] : [2.0, 2.9, 0], wr = alt ? [3.0, 2.6, 0] : [2.95, 1.75, 0];
    g.add(tube([sh, el], .2, mat('#E0A800', { rough: .3, coat: .8 }))); g.add(tube([el, wr], .17, mat('#E0A800', { rough: .3, coat: .8 })));
    g.add(sph(.16, steel, ...el));
    const bk = mesh(roundedBox(.62, .55, 1.0, .12), steel, wr[0] + .15, wr[1] - .32, 0); bk.rotation.z = alt ? -.2 : .45; g.add(bk);
    for (let i = -1; i <= 1; i++) { const t = mesh(new T.ConeGeometry(.08, .22, 8), steel, wr[0] + .32, wr[1] - .66, i * .3); t.rotation.z = Math.PI; g.add(t); }
    sideFace(g, face, -.55, 1.26, .76, 1.7, .95, 1.5, 76);
    g.rotation.y = -.3; return g;
  }
  /* 덤프트럭 (쿵쿵) */
  function dump(face, alt) {
    const g = new T.Group(), org = mat('#FF8C2A', { rough: .26, coat: 1 }), grn = mat('#4CC34A', { rough: .24, coat: 1 });
    g.add(mesh(roundedBox(4.5, .32, 1.4, .12), mat('#5A5A70', { rough: .4 }), .1, .74, 0));
    const bed = new T.Group(); bed.add(mesh(roundedBox(2.8, 1.35, 1.6, .2), org, 0, .68, 0));
    const dirt = mat('#A87444', { rough: .8 });
    [[-.9, 1.4, .2, .38], [-.3, 1.5, -.15, .45], [.35, 1.45, .2, .4], [.9, 1.36, -.1, .3]].forEach(([x, y, z, r]) => bed.add(sph(r, dirt, x, y, z)));
    bed.position.set(-.75, .9, 0); if (alt) { bed.rotation.z = .28; bed.position.y = 1.15; } g.add(bed);
    g.add(mesh(roundedBox(1.45, 1.5, 1.6, .34), grn, 1.75, 1.6, 0));
    g.add(mesh(roundedBox(.82, .55, .1, .08), glass(), 1.95, 1.95, .79));
    lamp(g, '#FFD230', 2.5, 1.2, .55, .12);
    sideFace(g, face, -.75, 1.58, .82, 1.8, 1.0, 1.65, 82);
    wheel(g, -1.5, .7, .52); wheel(g, -.5, .7, .52); wheel(g, 1.7, .7, .52); wheel(g, -1.5, -.7, .52); wheel(g, -.5, -.7, .52); wheel(g, 1.7, -.7, .52);
    g.rotation.y = -.3; return g;
  }
  /* 불도저 (밀밀) */
  function dozer(face, alt) {
    const g = new T.Group(), c = mat('#F5A623', { rough: .26, coat: 1 }), steel = mat('#9AA0B0', { rough: .3, metal: .55 });
    track(g, -.2, 3.0, .55); track(g, -.2, 3.0, -.55);
    g.add(mesh(roundedBox(2.6, 1.0, 1.5, .3), c, -.25, 1.25, 0));
    g.add(mesh(roundedBox(1.25, 1.0, 1.25, .26), c, -.55, 2.2, 0));
    g.add(mesh(roundedBox(.85, .55, .1, .08), glass(), -.5, 2.3, .63));
    const by = alt ? .55 : .25;
    [-.5, .5].forEach((z) => g.add(tube([[.9, 1.0, z], [1.6, by + .55, z]], .09, steel)));
    const blade = mesh(roundedBox(.24, 1.3, 1.95, .1), steel, 1.72, by + .62, 0); blade.rotation.z = .14; g.add(blade);
    g.add(mesh(roundedBox(.3, .14, 2.0, .06), mat('#6A7080', { rough: .3, metal: .5 }), 1.62, by + 1.28, 0));
    for (let i = -2; i <= 2; i++) g.add(mesh(roundedBox(.05, 1.1, .05, .02), mat('#7A8090', { rough: .3, metal: .5 }), 1.86, by + .64, i * .38));
    sideFace(g, face, -.3, 1.26, .76, 1.7, .95, 1.5, 76);
    g.rotation.y = -.3; return g;
  }
  if (!window.__ONLY) { // (일부 글자만 다시 굽는 도구에서는 탈것을 건너뜀)
  window.T3B = Object.assign(window.T3B || {}, { more: { letter, LETTERS, ambulance, police, excavator, dump, dozer } });
  enqueue('amb', FACES('smile'), FULL, ambulance, { padX: .9, padTop: .3, minW: 3.5 });
  enqueue('police', FACES('grin'), FULL, police, { padX: .9, padTop: .3, minW: 3.5 });
  enqueue('excav', FACES('big'), FULL, excavator, { padX: .9, padTop: .3, minW: 3.5 });
  enqueue('dump', FACES('smile'), FULL, dump, { padX: .9, padTop: .3, minW: 3.5 });
  enqueue('dozer', FACES('grin'), FULL, dozer, { padX: .9, padTop: .3, minW: 3.5 });
  }
})();
