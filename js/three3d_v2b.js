/* 아트 스타일 v2를 나머지 캐릭터(숫자 친구, 탑, 합체, 나나, 사람, 탈것, 글자)에도 적용한다.
   기존 모델(three3d*.js)은 그대로 쓰고, ① v2 조명·그림자·접지 그림자로 다시 그리고 ② 얼굴을 3D(눈 반사광·눈썹·입·볼)로 바꾼다. */
(function () {
  if (!window.V2 || !window.T3N || !window.T3B) return;
  const { T } = window.T3, N = window.T3N, B = window.T3B, { FACES } = window.T3C, V = window.V2;

  /* ---------- 얼굴 후크: 기존 모델의 2D 얼굴 판을 3D 얼굴로 ---------- */
  window.T3FACE = {
    plane(w, h, p, o) { // 네모난 몸(탈것, 글자)
      const g = new T.Group(), sc = o.sc ?? 1 + (w - 1) * .1, sep = (o.sep ?? 46 + (w - 1) * 22) / 256, y = (.5 - (o.cy ?? .45)) * h;
      V.face3d(g, p, { sep, y, r: 34 * sc / 256, surf: () => .02, iris: '#3A2A24', brow: '#4A3030', mouthY: y - 56 * sc / 256, mouthW: .75 * sc, cheekX: sep + 44 * sc / 256, cheekY: y - 40 * sc / 256, cheekTurn: 0 });
      return g;
    },
    cap(r, p, o) { // 둥근 머리(사람)
      const g = new T.Group(), sep = r * .33, er = r * .2;
      V.face3d(g, p, { sep, y: r * .12, r: er, surf: (x, y) => Math.sqrt(Math.max(0, r * r - x * x - y * y)) - .02, iris: '#3A2A24', brow: '#3A2A20', mouthY: -r * .26, mouthW: r * 1.07, cheekX: r * .6, cheekY: -r * .2, cheekTurn: .5 });
      return g;
    },
  };

  /* ---------- 숫자 친구 ---------- */
  function numFace(g, { cx, W, face }) {
    const fg = new T.Group(); fg.position.set(cx, 0, 0); g.add(fg);
    const sep = [0, .22, .36, .5][Math.min(W, 3)] || .5, r = [0, .16, .19, .21][Math.min(W, 3)] || .21;
    V.face3d(fg, face, { sep, y: .08, r, surf: () => .48, iris: '#3A2A24', brow: '#4A3030', mouthY: -.1, mouthW: .6 + .22 * (W - 1), cheekX: Math.min(sep + .18, W * .48 - .16), cheekY: -.08, cheekTurn: 0 });
  }
  const MOTION = { walk1: [1, ['sw2', 'sw1'], '기본'], walk2: [-1, ['sw1', 'sw2'], '기본'], wave1: [0, ['down', 'wave'], '기쁨'], wave2: [0, ['down', 'up'], '기쁨'] };
  const tw = (lit) => ({ eyes: 'normal', mouth: 'big', brows: 'normal' });
  function numSpec(key, k) { // → {n, spec, face, pose, step, refPose}
    if (key === 'tower') { const lit = /^lit(\d)$/.exec(k); const i = lit ? +lit[1] : 5; return { n: 2, spec: N.towerSpec(i), face: k === '기쁨' ? { eyes: 'happy', mouth: 'big', brows: 'normal' } : tw(), pose: i === 5 || k === '기쁨' ? ['up', 'up'] : ['down', 'wave'], refPose: ['down', 'wave'] }; }
    const m = /^m(\d)(\d)$/.exec(key);
    if (m) { const a = +m[1], b = +m[2], col = { 1: N.RB[0], 2: N.RB[1], 3: N.RB[2], 4: N.RB[3] }; return { n: 2, spec: { cells: N.V(a + b), rowColor: (r) => (r < b ? col[b] : col[a]), acc: 0 }, face: k === '기쁨' ? { eyes: 'happy', mouth: 'big', brows: 'normal' } : { eyes: 'normal', mouth: 'smile', brows: 'normal' }, pose: ['down', 'wave'], refPose: ['down', 'wave'] }; }
    const n = +key.slice(1), mo = MOTION[k];
    if (mo) return { n, face: N.faceOf(n, mo[2]), pose: n === 8 ? N.poseOf(n, false) : mo[1], step: mo[0], refPose: N.poseOf(n, false) };
    return { n, face: N.faceOf(n, k), pose: N.poseOf(n, k === 'alt' || k === 'alt2'), refPose: N.poseOf(n, false) };
  }
  function numFrame(key, k, px) {
    const s = numSpec(key, k), n = s.n, build = (pose, step) => N.build(n, { face: s.face, pose, spec: s.spec, step, v2face: numFace }).g;
    const ref = build(s.refPose, 0), g = build(s.pose, s.step || 0);
    return V.render(g, { ref, px, padX: n === 8 ? 1.3 : 1.7, minW: 2.8, padTop: .35, padBottom: .55 });
  }

  /* ---------- 사람, 나나, 탈것, 글자 ---------- */
  const G = {};
  const catBig = (face, alt) => { const g = V.CH.somi.build(face, alt); g.scale.setScalar(1.25); return g; };
  const set = (key, build, faces, opt) => { G[key] = { build, faces, opt }; };
  set('nana', catBig, FACES('smile', 'normal'), { padX: 1.0, minW: 2.6 });
  set('captain', B.captain, FACES('big'), { padX: 1.0, padTop: .3 });
  set('teacher', B.teacher, FACES('smile'), { padX: 1.4 });
  set('fire', B.fireTruck, FACES('big'), { padX: .9, padTop: .3, minW: 3.5 });
  const M = B.more; if (M) {
    set('amb', M.ambulance, FACES('smile'), { padX: .9, padTop: .3, minW: 3.5 }); set('police', M.police, FACES('grin'), { padX: .9, padTop: .3, minW: 3.5 }); set('excav', M.excavator, FACES('big'), { padX: .9, padTop: .3, minW: 3.5 });
    set('dump', M.dump, FACES('smile'), { padX: .9, padTop: .3, minW: 3.5 }); set('dozer', M.dozer, FACES('grin'), { padX: .9, padTop: .3, minW: 3.5 });
    M.LETTERS.forEach((L) => set(L.key, M.letter(L), FACES(L.mouth, 'normal', L.eyes || 'normal'), { padX: 1.0 }));
  }
  function charFrame(key, k, px) {
    const c = G[key], ref = c.build(c.faces['기본'], false); let g; const mo = MOTION[k];
    if (mo) { window.T3STEP = mo[0]; try { g = c.build(c.faces[mo[2]], { pose: mo[1] }); } finally { window.T3STEP = 0; } }
    else g = c.build(c.faces[k], k === 'alt' || k === 'alt2');
    return V.render(g, { ...c.opt, px, ref });
  }

  /* 어떤 캐릭터든 key·표정으로 한 장 그리기 */
  V.frameAny = (key, k, px) => (G[key] ? charFrame(key, k, px) : /^n\d+$|^tower$|^m\d\d$/.test(key) ? numFrame(key, k, px) : V.frame(key, k, px));
  V.hasAny = (key) => !!G[key] || /^n\d+$|^tower$|^m\d\d$/.test(key) || !!V.CH[key];
})();
