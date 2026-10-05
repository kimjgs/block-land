/* 놀이 3종: 듣고 고르기, 칸 세기, 합치기 */
window.Games = (function () {
  const { h, SFX, M } = E;
  let cur = null;
  const frame = (id, ex = '기본') => (FR[id] && (FR[id][ex] || FR[id]['기본'])) || '';
  const COLORS = ['#F2453D', '#FF8C2A', '#FFD230', '#4CC34A', '#3E9BFF'];

  function stop() { if (cur) { cur.stop(); cur = null; } }

  /* 공통 틀: 머리 줄(뒤로가기, 점), 안내 친구, 말풍선 */
  function shell(app, rounds, bgName) {
    stop();
    const sc = document.getElementById('sGame'); sc.innerHTML = '';
    const run = new E.Run(); cur = run;
    sc.append(h('div', { class: 'bgfill', html: BG[bgName || 'village'] }));
    E.ambient(sc, 12);
    const play = h('div', { class: 'play' }); sc.append(play);
    const dots = Array.from({ length: rounds }, () => h('i'));
    sc.append(h('div', { class: 'head' }, h('button', { class: 'pinkbtn', style: { position: 'relative' }, onclick: () => { stop(); const r = app.returnTo; app.returnTo = null; if (r && r.screen) app.go(r.screen, r.arg); else app.go('home'); } }, '←'), h('div', { class: 'dots' }, dots)));
    const bubble = h('div', { class: 'speech', style: { left: '30px', bottom: '300px', display: 'none' } }); sc.append(bubble);
    run.cap = bubble;
    const gid = app.state.guide;
    const guide = new E.Actor(run, sc, FR[gid], 10, 700 - E.feetFrac(gid) * 300, 300, { voice: C.VOICE[gid], z: 8 });
    guide.wave(5); // 처음엔 손 흔들며 인사
    return { sc, run, play, dots, bubble, guide, setDot: (i) => dots[i] && dots[i].classList.add('on') };
  }

  /* 점수 말고 칭찬: 시간이 지나도 힌트를 못 받는 일이 없게 */
  function weighted(items, w, n) {
    const out = [], pool = items.slice();
    while (out.length < n && pool.length) {
      const total = pool.reduce((s, it) => s + w(it), 0); let r = Math.random() * total, k = 0;
      for (; k < pool.length; k++) { r -= w(pool[k]); if (r <= 0) break; }
      out.push(pool.splice(Math.min(k, pool.length - 1), 1)[0]);
    }
    return out;
  }

  /* ---------------- 1. 듣고 고르기 ---------------- */
  async function pick(app, opt = {}) {
    const log = app.state.log;
    const seen = (it) => log[it.id] || { ok: 0, hint: 0, miss: 0 };
    // 4세 첫 단계: 숫자 1~3, 소리가 쉬운 글자, 차 이름부터. 잘하면 문제가 넓어진다.
    const HG = ['vowels', 'consonants', 'initial'];
    const base = C.PICK.filter((it) => (!opt.area || it.area === opt.area || (opt.area === 'hangul' && HG.includes(it.area))) && (!opt.ids || opt.ids.includes(it.target)));
    const R = Math.min(5, Math.max(base.length, 1)), items = weighted(base, (it) => { const s = seen(it); return s.miss + s.hint > 0 ? 3 : s.ok === 0 ? 2 : 1; }, R);
    const S = shell(app, R, 'village'), { run, play, guide } = S;
    let firstTry = 0, hinted = 0;
    try {
      for (let r = 0; r < R; r++) {
        const it = items[r], s0 = seen(it), review = s0.miss + s0.hint > 0;
        const n = app.state.diff.pick;
        const others = E.shuffle(it.pool.filter((x) => x !== it.target && (!opt.ids || opt.ids.length < 2 || opt.ids.includes(x) || n > opt.ids.length))).slice(0, n - 1);
        const ids = E.shuffle([it.target, ...others]);
        const box = h('div', { class: 'choices', 'data-target': it.target }); play.innerHTML = ''; play.append(box);
        const cards = ids.map((id) => {
          const c = h('div', { class: 'choice', 'data-id': id, html: frame(id) }); box.append(c); M.pop({ anim: (kf, ms, o) => c.animate(kf, { duration: ms, easing: 'ease-out' }).finished.catch(() => {}) }); return c;
        });
        guide.mood('기본');
        if (review) { SFX.sparkle(); await guide.say('오늘의 보물찾기! ' + it.say); } else await guide.say(it.say);
        let misses = 0, hint = false;
        const target = cards.find((c) => c.dataset.id === it.target);
        const result = await new Promise((resolve) => {
          let idle = setTimeout(function nudge() { target.classList.add('hint'); hint = true; E.assist(); guide.say('어디 있을까? ' + it.word + '!'); idle = setTimeout(nudge, 9000); }, 10000);
          cards.forEach((c) => c.addEventListener('click', async () => {
            if (!run.alive) return; E.resume(); clearTimeout(idle);
            if (c === target) { clearTimeout(idle); resolve({ misses, hint: hint || misses > 0 }); return; }
            SFX.oops(); M.shake({ anim: (kf, ms) => c.animate(kf, { duration: ms }).finished.catch(() => {}) }); misses++;
            if (misses === 1) { guide.mood('기본'); await guide.say(E.cheer[Math.floor(Math.random() * E.cheer.length)]); target.classList.add('hint'); hint = true; }
            else if (misses === 2) { // 두 번째: 보기를 하나 줄이고 힌트
              const w = cards.find((x) => x !== target && x !== c && x.style.pointerEvents !== 'none'); if (w) { w.style.opacity = .25; w.style.pointerEvents = 'none'; }
              target.classList.add('hint'); await guide.say(it.hint);
            } else { // 세 번째: 친구가 정답 가까이 가서 보여 줘요
              target.classList.add('hint'); await guide.say('여기 있어! 같이 눌러 볼까?'); resolve({ misses, hint: true, shown: true }); return;
            }
            idle = setTimeout(() => { target.classList.add('hint'); }, 6000);
          }));
        });
        // 성공 (힌트를 받고 맞혀도 정상 성공)
        target.classList.remove('hint'); cards.forEach((c) => c.classList.remove('hint'));
        target.innerHTML = frame(it.target, '기쁨');
        target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18) rotate(-3deg)' }, { transform: 'scale(1)' }], { duration: 700 });
        SFX.tada(); const rc = target.getBoundingClientRect(), sr = document.getElementById('stage').getBoundingClientRect();
        const worldBox = h('div', { style: { position: 'absolute', left: 0, top: 0, width: '1280px', height: '720px', pointerEvents: 'none' } }); S.sc.append(worldBox);
        E.fx(worldBox, 'star', (rc.left - sr.left + rc.width / 2) / app.scale, (rc.top - sr.top) / app.scale + 60, 6, { dist: 140, spread: 4 });
        cards.filter((c) => c !== target).forEach((c) => (c.style.opacity = .35));
        guide.mood('기쁨'); M.bounce(guide, 1); await guide.say((Math.random() < .4 ? E.say1(E.praise) + ' ' : '') + it.right); guide.mood('기본');
        S.setDot(r); app.record(it.id, misses === 0 ? 'ok' : result.hint ? 'hint' : 'ok');
        if (misses === 0 && !result.hint) firstTry++; else hinted++;
        await run.wait(500); worldBox.remove();
      }
      app.adapt('pick', firstTry / R);
      guide.mood('기쁨'); SFX.tada();
      await guide.say('다 찾았다! 정말 잘했어!');
      await run.wait(400);
      app.finish('pick');
    } catch (e) { if (e !== E.ABORT) throw e; }
  }

  /* ---------------- 2. 칸 세기 ---------------- */
  async function count(app, opt = {}) {
    const R = 3, S = shell(app, R, 'forest'), { run, play, guide } = S;
    const ranged = opt.max != null, lo = opt.min || 1, big = lo > 5, maxN = ranged ? opt.max : app.state.progress.countMax || 3; // 수업에서 정해 준 범위가 있으면 그 안에서만
    let usedHint = false;
    try {
      for (let r = 0; r < R; r++) {
        const n = ranged ? (r === R - 1 ? opt.max : lo + Math.floor(Math.random() * (opt.max - lo + 1))) : Math.max(1, Math.min(maxN, r === R - 1 ? maxN : 1 + Math.floor(Math.random() * maxN)));
        play.innerHTML = '';
        const fh = n > 5 ? 430 : 440; const friend = new E.Actor(run, play, FR['n' + n], n > 5 ? 380 : 520, 640 - E.feetFrac('n' + n) * fh, fh, { voice: C.VOICE['n' + n] || C.VOICE.n3, z: 4 });
        M.pop(friend);
        const wrap = h('div', { class: 'stackwrap' + (n > 5 ? ' ten' : '') }); play.append(wrap);
        const blks = Array.from({ length: n }, (_, i) => h('div', { class: 'blk', style: { background: COLORS[(n - 1) % 5], borderColor: COLORS[(n - 1) % 5] } })); blks.forEach((b) => wrap.append(b));
        guide.mood('기본'); await guide.say(`${C.NUMW[n]}! 하나씩 눌러서 세어 볼까?`);
        let lit = 0;
        await new Promise((resolve) => {
          let idle = setTimeout(function nudge() { const nx = blks[lit]; if (nx) { nx.classList.add('hint'); usedHint = true; E.assist(); } idle = setTimeout(nudge, 8000); }, 9000);
          blks.forEach((b) => b.addEventListener('click', async () => {
            if (!run.alive || b.classList.contains('lit')) return; E.resume(); clearTimeout(idle);
            blks.forEach((x) => x.classList.remove('hint')); b.classList.add('lit'); b.textContent = lit + 1; SFX.ding(lit);
            E.speak(C.NUMW[lit + 1], { kind: 'f', pitch: 1.2 }); lit++;
            if (lit === n) { clearTimeout(idle); setTimeout(resolve, 900); }
            else idle = setTimeout(() => { const nx = blks.find((x) => !x.classList.contains('lit')); if (nx) nx.classList.add('hint'); usedHint = true; E.assist(); }, 8000);
          }));
        });
        friend.mood('기쁨'); SFX.tada(); M.bounce(friend, 2); guide.mood('기쁨');
        await guide.say(`${C.NUMW[n]}! 모두 ${n}칸이야!`); guide.mood('기본');
        S.setDot(r); app.record('count_' + n, 'ok'); await run.wait(500);
      }
      if (!ranged && !usedHint && maxN < 5) app.state.progress.countMax = maxN + 1;
      guide.mood('기쁨'); await guide.say('모두 세었다! 정말 잘했어!'); await run.wait(300);
      app.finish('play');
    } catch (e) { if (e !== E.ABORT) throw e; }
  }

  /* ---------------- 3. 합치기 ---------------- */
  async function combine(app) {
    const R = 3, S = shell(app, R, 'sky'), { run, play, guide } = S;
    const rowsOf = (n) => (n === 4 ? 2 : n === 6 ? 3 : n);
    const hgt = (rows) => (rows * 64 + 154) * 1.0;
    const combos = E.shuffle(C.COMBINE).slice(0, R);
    try {
      for (let r = 0; r < R; r++) {
        const [a, b] = combos[r]; play.innerHTML = '';
        const A = new E.Actor(run, play, FR['n' + a], 470, 570 - E.feetFrac('n' + a) * hgt(rowsOf(a)), hgt(rowsOf(a)), { z: 4, voice: C.VOICE['n' + a] });
        const B = new E.Actor(run, play, FR['n' + b], 930, 570 - E.feetFrac('n' + b) * hgt(rowsOf(b)), hgt(rowsOf(b)), { z: 9, voice: C.VOICE['n' + b] });
        M.pop(A); M.pop(B);
        guide.mood('기본'); await guide.say(`${C.NUMW[b]}을 ${C.NUMW[a]} 위에 올려 볼까?`.replace('하나을', '하나를').replace('둘을', '둘을').replace('셋을', '셋을'));
        B.el.style.cursor = 'grab'; B.el.style.touchAction = 'none';
        const home = { x: parseFloat(B.el.style.left), y: parseFloat(B.el.style.top) };
        const dropped = await new Promise((resolve) => {
          let idle = setTimeout(async function nudge() {
            const ac = A.center(); B.anim([{ transform: 'translate(0,0)' }, { transform: `translate(${ac.x - home.x - B.el.offsetWidth / 2 - 10}px,${ac.y - home.y - hgt(rowsOf(b)) * .85}px)` }, { transform: 'translate(0,0)' }], 1800);
            idle = setTimeout(nudge, 9000);
          }, 9000);
          let dragging = false, off = { x: 0, y: 0 };
          const pos = (e) => app.toStage(e);
          B.el.addEventListener('pointerdown', (e) => { E.resume(); clearTimeout(idle); dragging = true; B.el.getAnimations().forEach((x) => x.cancel()); try { B.el.setPointerCapture(e.pointerId); } catch (er) {} const p = pos(e); off = { x: p.x - parseFloat(B.el.style.left), y: p.y - parseFloat(B.el.style.top) }; B.el.style.zIndex = 30; SFX.tap(); });
          B.el.addEventListener('pointermove', (e) => { if (!dragging) return; const p = pos(e); B.el.style.left = p.x - off.x + 'px'; B.el.style.top = p.y - off.y + 'px'; });
          const up = async () => {
            if (!dragging) return; dragging = false;
            const bc = B.center(), ac = A.center(), near = Math.abs(bc.x - ac.x) < 170 && Math.abs((bc.y + B.el.offsetHeight) - (ac.y + 20)) < 190;
            if (near) { resolve(true); } else {
              SFX.oops(); await B.moveTo(home.x, home.y, 450, 'ease-out'); idle = setTimeout(() => { M.wiggle(B, 2); }, 6000);
              if (!run.alive) return; await guide.say('괜찮아! 다시 올려 볼까?');
            }
          };
          B.el.addEventListener('pointerup', up); B.el.addEventListener('pointercancel', up);
        });
        // 합쳐짐
        B.remove(); SFX.snap(); const sum = a + b, merged = 'm' + a + b;
        const mh = hgt(sum) * 1.0, scale = Math.min(1, 520 / mh);
        A.remove();
        const M2 = new E.Actor(run, play, FR[merged], 470, 570 - E.feetFrac(merged) * mh * scale, mh * scale, { z: 5, base: '기쁨' });
        E.fx(play, 'sparkle', M2.center().x, M2.center().y + 60, 8, { spread: 6.2, dist: 120 }); M.squash(M2);
        for (let i = 0; i < sum; i++) { SFX.ding(i); await run.speak(['하나', '둘', '셋', '넷', '다섯'][i], { kind: 'f', pitch: 1.2 }); await run.wait(100); }
        const eq = h('div', { class: 'eqbox' }, `${C.NUMW[sum]}!`); play.append(eq); eq.animate([{ transform: 'translateX(-50%) scale(0)' }, { transform: 'translateX(-50%) scale(1.15)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 450 });
        SFX.tada(); E.fx(play, 'confetti', 640, 120, 30, { spread: 3.4, dist: 240, fall: 140, stagger: 15 });
        guide.mood('기쁨'); await guide.say(`${C.NUMW[a]}이랑 ${C.NUMW[b]}이 만나면 ${C.NUMW[sum]}!`.replace('하나이랑', '하나랑').replace('셋이랑', '셋이랑')); guide.mood('기본');
        S.setDot(r); app.record(`combine_${a}${b}`, 'ok'); await run.wait(600);
      }
      guide.mood('기쁨'); await guide.say('모두 합쳤다! 정말 잘했어!'); await run.wait(300);
      app.finish('play');
    } catch (e) { if (e !== E.ABORT) throw e; }
  }

  return { pick, count, combine, stop, shell };
})();
