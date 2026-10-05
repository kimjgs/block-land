/* 놀이 2: 고르기, 풍선, 짝 맞추기, 먹이 주기, 나누기, 따라 쓰기, 그림책, 노래, 글자 합치기, 차례대로 */
window.Games2 = (function () {
  const { h, SFX, M } = E;
  const G = () => window.Games;
  const NUMW = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
  const NAME = Object.fromEntries(C.STICKERS.map((s) => [s.id, s.name]));
  const COLORS = ['#F2453D', '#FF8C2A', '#FFD230', '#4CC34A', '#3E9BFF', '#5A54D9', '#E040A8'];
  const cheer = () => E.cheer[Math.floor(Math.random() * E.cheer.length)];
  const wrap = (el) => ({ anim: (kf, ms, o = {}) => el.animate(kf, { duration: ms, easing: o.ease || 'ease-out', iterations: o.it || 1 }).finished.catch(() => {}) });
  const center = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const inside = (pt, el, pad = 30) => { const r = el.getBoundingClientRect(); return pt.x > r.left - pad && pt.x < r.right + pad && pt.y > r.top - pad && pt.y < r.bottom + pad; };
  const starAt = (S, el) => { const c = center(el), sr = document.getElementById('stage').getBoundingClientRect(), k = S.app.scale; E.fx(S.play, 'star', (c.x - sr.left) / k, (c.y - sr.top) / k, 6, { dist: 130, spread: 4 }); };

  /* 그림 하나: {fr:'n3'} 캐릭터 · {emoji:'🍎'} · {text:'가', color} 글자 · {color} 색 블록 */
  function art(it, ex = '기본') {
    if (!it) return '';
    if (it.fr) { const e2 = it.ex || ex; return (FR[it.fr] && (FR[it.fr][e2] || FR[it.fr]['기본'])) || ''; }
    if (it.emoji) return `<div class="emo">${it.emoji}</div>`;
    if (it.text) return `<div class="gl" style="color:${it.color || '#5A3FC8'}">${it.text}</div>`;
    if (it.color) return `<div class="swatch" style="background:${it.color}"></div>`;
    return it.html || '';
  }
  function shell(app, n, bg) { const S = G().shell(app, n, bg); S.app = app; return S; }
  const done = async (S, app, kind, text) => { S.guide.mood('기쁨'); SFX.tada(); M.bounce(S.guide, 1); await S.guide.say(text || '다 했다! 정말 잘했어!'); await S.run.wait(400); app.finish(kind || 'play'); };
  const guard = (fn) => async (app, opt = {}) => { try { await fn(app, opt); } catch (e) { if (e !== E.ABORT) throw e; } };

  /* 끌어서 놓기 (놓은 곳이 맞으면 onDrop이 true를 돌려준다) */
  function draggable(S, el, onDrop) {
    let off = null; const home = { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
    el.style.touchAction = 'none'; el.style.cursor = 'grab';
    el.addEventListener('pointerdown', (e) => { if (!S.run.alive || el.dataset.lock) return; E.resume(); const p = S.app.toStage(e); off = { x: p.x - parseFloat(el.style.left), y: p.y - parseFloat(el.style.top) }; try { el.setPointerCapture(e.pointerId); } catch (er) {} el.style.zIndex = 50; el.classList.add('drag'); SFX.tap(); });
    el.addEventListener('pointermove', (e) => { if (!off) return; const p = S.app.toStage(e); el.style.left = p.x - off.x + 'px'; el.style.top = p.y - off.y + 'px'; });
    const up = () => {
      if (!off) return; off = null; el.classList.remove('drag');
      if (onDrop(center(el))) return;
      el.animate([{ left: el.style.left, top: el.style.top }, { left: home.x + 'px', top: home.y + 'px' }], { duration: 350, easing: 'ease-out' });
      el.style.left = home.x + 'px'; el.style.top = home.y + 'px'; el.style.zIndex = 20;
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }

  /* ---------------- 1. 고르기 (그림·글자·색 중에서 맞는 것) ---------------- */
  const choose = guard(async (app, opt) => {
    const rounds = (opt.keep ? opt.rounds : E.shuffle(opt.rounds)).slice(0, opt.n || Math.min(4, opt.rounds.length));
    const S = shell(app, rounds.length, opt.bg), { run, play, guide } = S;
    if (opt.intro) await guide.say(opt.intro);
    for (let r = 0; r < rounds.length; r++) {
      const q = rounds[r]; let items = q.keep ? q.items : E.shuffle(q.items);
      if (!q.any && !q.keep) { // 적응형: 최근에 쉽게 해냈으면 보기 +1, 도움이 많았으면 보기 -1 (아이를 떨어뜨리는 게 아니라 할 수 있는 수준으로)
        const info = app.masteryInfo(app.returnTo && app.returnTo.goal);
        if (info.level >= 3 && items.length < 4) { const pool = E.shuffle(rounds.filter((x) => x !== q).flatMap((x) => x.items.filter((i) => !i.ok))).filter((i) => !items.some((j) => JSON.stringify(j) === JSON.stringify(i))); if (pool[0]) items = [...items, pool[0]]; }
        else if (info.level === 1 && info.lastAssist >= 2 && items.length > 2) { const w = items.find((i) => !i.ok); items = items.filter((i) => i !== w); }
      }
      const counting = items.length > 1 && items.every((i) => i.emoji) && new Set(items.map((i) => [...i.emoji].length)).size > 1 && items.some((i) => [...i.emoji].length > 1); // 개수를 비교하는 문제는 그림 크기를 똑같이
      const box = h('div', { class: 'choices' + (items.length > 3 ? ' four' : '') + (counting ? ' counting' : '') }); play.innerHTML = ''; play.append(box);
      const cards = items.map((it) => { const c = h('div', { class: 'choice', html: art(it) }); if (it.label) c.append(h('div', { class: 'clabel' }, it.label)); c.dataset.ok = it.ok ? 1 : ''; box.append(c); M.pop(wrap(c)); return c; });
      const target = cards.find((c) => c.dataset.ok);
      guide.mood('기본'); await guide.say(q.say);
      let picked = null;
      await new Promise((resolve) => {
        let misses = 0, idle = setTimeout(function nudge() { target.classList.add('hint'); E.assist(); idle = setTimeout(nudge, 9000); }, 11000);
        cards.forEach((c) => c.addEventListener('click', async () => {
          if (!run.alive) return; E.resume(); clearTimeout(idle);
          if (q.any) { picked = c; SFX.pop(); return resolve(); } // 예상하기: 아이의 선택을 먼저 받는다
          if (c === target) return resolve();
          SFX.oops(); M.shake(wrap(c)); misses++; target.classList.add('hint');
          if (misses === 2) { const w = cards.find((x) => x !== target && x !== c && x.style.pointerEvents !== 'none'); if (w) { w.style.opacity = .25; w.style.pointerEvents = 'none'; } } // 두 번째: 보기 하나 줄이기
          if (misses >= 3) { await guide.say('여기 있어! 같이 눌러 볼까?'); return resolve(); } // 세 번째: 친구가 보여 줘요
          await guide.say(misses === 1 ? (q.hint || cheer()) : q.say);
        }));
      });
      cards.forEach((c) => c.classList.remove('hint')); target.classList.add('right');
      cards.filter((c) => c !== target).forEach((c) => (c.style.opacity = .3));
      SFX.tada(); starAt(S, target); guide.mood('기쁨'); M.bounce(guide, 1);
      await guide.say(q.any && picked !== target ? (q.miss || q.right || '이렇게 되는 거야!') : ((Math.random() < .35 ? E.say1(E.praise) + ' ' : '') + (q.right || '맞았어!'))); guide.mood('기본');
      S.setDot(r); await run.wait(400);
    }
    await done(S, app, opt.kind, opt.end);
  });

  /* ---------------- 2. 풍선 터뜨리기 ---------------- */
  const balloonSvg = (c) => `<svg viewBox="0 0 120 190" width="120" height="190"><path d="M60 140 q-6 18 4 26 q10 8 -2 24" stroke="#8A90A0" stroke-width="3" fill="none"/><ellipse cx="60" cy="66" rx="52" ry="62" fill="${c}"/><ellipse cx="40" cy="38" rx="12" ry="18" fill="#fff" opacity=".45" transform="rotate(-25 40 38)"/><path d="M52 126 h16 l-8 12z" fill="${c}"/></svg>`;
  const pop = guard(async (app, opt) => {
    const rounds = opt.rounds || [], R = rounds.length;
    const S = shell(app, R, opt.bg || 'sky'), { run, play, guide } = S;
    if (opt.intro) await guide.say(opt.intro);
    for (let r = 0; r < R; r++) {
      const q = rounds[r]; play.innerHTML = '';
      let got = 0, live = true; const need = q.count || 1;
      const counter = q.count ? h('div', { class: 'eqbox' }, `0 / ${need}`) : null; if (counter) play.append(counter);
      const spawn = () => {
        if (!live || !run.alive) return;
        const it = q.count ? { color: COLORS[Math.floor(Math.random() * 7)] } : q.pool[Math.floor(Math.random() * q.pool.length)];
        const isOk = q.count ? true : it.ok;
        const b = h('div', { class: 'balloon', html: balloonSvg(it.color || COLORS[Math.floor(Math.random() * 7)]), style: { left: E.rand(380, 1120) + 'px', top: '740px' } });
        if (it.text || it.emoji) b.append(h('div', { class: 'blabel' + (it.emoji ? ' e' : '') }, it.text || it.emoji));
        b.dataset.ok = isOk ? 1 : ''; play.append(b);
        const fly = b.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${E.rand(-60, 60)}px,-980px)` }], { duration: E.rand(6500, 9000), easing: 'linear' });
        fly.finished.then(() => b.remove()).catch(() => {});
        b.addEventListener('pointerdown', async () => {
          if (!live || b.dataset.p) return; E.resume();
          if (!isOk) { SFX.oops(); b.animate([{ rotate: '0deg' }, { rotate: '-12deg' }, { rotate: '12deg' }, { rotate: '0deg' }], 400); if (q.hint) guide.say(q.hint); return; }
          b.dataset.p = 1; fly.pause(); SFX.pop(); const c = center(b), sr = document.getElementById('stage').getBoundingClientRect();
          E.fx(play, 'confetti', (c.x - sr.left) / app.scale, (c.y - sr.top) / app.scale - 30, 10, { spread: 6.2, dist: 90 });
          b.animate([{ transform: getComputedStyle(b).transform + ' scale(1)', opacity: 1 }, { transform: getComputedStyle(b).transform + ' scale(1.5)', opacity: 0 }], 220).finished.then(() => b.remove());
          got++; if (counter) { counter.textContent = `${got} / ${need}`; E.speak(NUMW[got] || String(got), { kind: 'f', pitch: 1.25 }); }
        });
      };
      guide.mood('기본'); await guide.say(q.say);
      spawn(); const tm = setInterval(spawn, q.count ? 800 : 1000);
      try { while (got < need) await run.wait(150); } finally { live = false; clearInterval(tm); }
      SFX.tada(); guide.mood('기쁨'); M.bounce(guide, 1); await guide.say(q.right || '잘했어!'); guide.mood('기본');
      S.setDot(r); await run.wait(300);
    }
    play.innerHTML = '';
    await done(S, app, opt.kind, opt.end);
  });

  /* ---------------- 3. 카드 짝 맞추기 ---------------- */
  const match = guard(async (app, opt) => {
    const pairs = opt.pairs || 3, keys = E.shuffle(opt.keys).slice(0, pairs);
    const S = shell(app, pairs, opt.bg || 'village'), { run, play, guide } = S;
    const deck = E.shuffle([...keys, ...keys]), cols = pairs <= 3 ? 3 : 4;
    const grid = h('div', { class: 'mgrid', style: { gridTemplateColumns: `repeat(${cols}, 1fr)` } }); play.append(grid);
    const cards = deck.map((k) => { const c = h('div', { class: 'mcard' }, h('div', { class: 'mface back' }, '?'), h('div', { class: 'mface front', html: art(opt.emoji ? { emoji: k } : { fr: k }) })); c.dataset.k = k; grid.append(c); return c; });
    await guide.say(opt.intro || '같은 그림 두 장을 찾아볼까? 카드를 눌러 봐!');
    let open = [], found = 0, busy = false;
    await new Promise((resolve) => {
      cards.forEach((c) => c.addEventListener('click', async () => {
        if (!run.alive || busy || c.classList.contains('open')) return; E.resume(); SFX.tap();
        c.classList.add('open'); open.push(c);
        const nm = opt.names ? opt.names[c.dataset.k] : NAME[c.dataset.k]; if (nm) E.speak(nm, { kind: 'f', pitch: 1.2 });
        if (open.length < 2) return;
        busy = true; const [a, b] = open; open = [];
        if (a.dataset.k === b.dataset.k) {
          await E.sleep(450); a.classList.add('got'); b.classList.add('got'); SFX.sparkle(); starAt(S, b); S.setDot(found); found++;
          guide.mood('기쁨'); await guide.say(`짝꿍 찾았다! ${nm || ''}!`).catch(() => {}); guide.mood('기본'); busy = false;
          if (found === pairs) resolve();
        } else { await E.sleep(1000); SFX.oopsSoft(); a.classList.remove('open'); b.classList.remove('open'); busy = false; }
      }));
    });
    await done(S, app, opt.kind, '짝꿍을 모두 찾았어! 기억력 최고!');
  });

  /* ---------------- 4. 먹이 주기 (세면서 끌어다 주기) ---------------- */
  const feed = guard(async (app, opt) => {
    const nums = opt.nums || [2, 3, 4], S = shell(app, nums.length, opt.bg || 'village'), { run, play, guide } = S;
    const ak = opt.animal || 'nana', hgt = opt.h || 300;
    const pet = new E.Actor(run, play, FR[ak], 960, 640 - E.feetFrac(ak) * hgt, hgt, { z: 6, voice: C.VOICE[ak] });
    const bowl = h('div', { class: 'bowl', style: { left: '730px', top: '580px' } }); play.append(bowl);
    for (let r = 0; r < nums.length; r++) {
      const n = nums[r]; play.querySelectorAll('.food').forEach((f) => f.remove());
      const total = Math.min(10, n + 2), foods = [];
      for (let i = 0; i < total; i++) {
        const f = h('div', { class: 'food', html: opt.food || '🐟', style: { left: 380 + (i % 4) * 110 + 'px', top: 210 + Math.floor(i / 4) * 130 + 'px' } }); play.append(f); foods.push(f);
        let given = false;
        draggable(S, f, (pt) => {
          if (given || !(inside(pt, pet.el, 10) || inside(pt, bowl, 40))) return false;
          given = true; f.dataset.lock = 1; f.remove(); got++; SFX.ding(got - 1); E.speak(NUMW[got], { kind: 'f', pitch: 1.25 }); M.hop(pet);
          bowl.textContent = (opt.food || '🐟').repeat(Math.min(got, 5)); return true;
        });
      }
      let got = 0; bowl.textContent = '';
      guide.mood('기본'); await guide.say(`${NAME[ak] || ''}에게 ${opt.foodName || '생선'} ${NUMW[n]} 개를 주자! 끌어서 줘 봐.`);
      while (got < n) await run.wait(150);
      foods.forEach((f) => { f.dataset.lock = 1; f.style.opacity = .35; });
      pet.mood('기쁨'); SFX.tada(); M.bounce(pet, 2); await pet.say(`냠냠! ${opt.foodName || '생선'} ${NUMW[n]}! 고마워!`); pet.mood('기본');
      S.setDot(r); await run.wait(400);
    }
    await done(S, app, opt.kind, '배불러! 모두 잘 세었어!');
  });

  /* ---------------- 5. 나누기 (알맞은 바구니에 넣기) ---------------- */
  const sort = guard(async (app, opt) => {
    const items = E.shuffle(opt.items).slice(0, opt.n || 6), S = shell(app, items.length, opt.bg || 'village'), { run, play, guide } = S;
    const bins = opt.bins.map((b, i) => { const el = h('div', { class: 'bin', style: { left: 380 + i * (860 / opt.bins.length) + 'px', width: 860 / opt.bins.length - 30 + 'px' } }, h('div', { class: 'bin-art', html: art(b.art) }), h('div', { class: 'bin-name' }, b.label)); play.append(el); return el; });
    if (opt.intro) await guide.say(opt.intro);
    for (let r = 0; r < items.length; r++) {
      const it = items[r];
      const el = h('div', { class: 'sorti', html: art(it.art), style: { left: '700px', top: '120px' } }); el.dataset.bin = it.bin; play.append(el); M.pop(wrap(el));
      let ok = false;
      draggable(S, el, (pt) => {
        const bi = bins.findIndex((b) => inside(pt, b, 0)); if (bi < 0) return false;
        if (bi !== it.bin) { SFX.oops(); M.shake(wrap(bins[bi])); guide.say(it.hint || cheer()); return false; }
        ok = true; el.dataset.lock = 1; return true;
      });
      guide.mood('기본'); await guide.say(it.say || opt.ask.replace('$', it.name));
      while (!ok) await run.wait(120);
      const b = bins[it.bin]; SFX.pop(); starAt(S, b);
      el.style.transition = 'all .35s'; const br = b.getBoundingClientRect(), sr = document.getElementById('stage').getBoundingClientRect();
      el.style.left = (br.left - sr.left) / app.scale + 20 + (r % 3) * 40 + 'px'; el.style.top = (br.top - sr.top) / app.scale + 120 + 'px'; el.style.transform = 'scale(.45)';
      guide.mood('기쁨'); await guide.say(it.right || '맞아!'); guide.mood('기본');
      S.setDot(r); await run.wait(300);
    }
    await done(S, app, opt.kind, opt.end);
  });

  /* ---------------- 6. 따라 쓰기 ---------------- */
  const SHAPES = (() => {
    const L = (ch, ...strokes) => ({ ch, strokes });
    const circle = (cx, cy, r, a0, a1) => { const p = []; for (let a = a0; a0 < a1 ? a <= a1 : a >= a1; a += (a0 < a1 ? 6 : -6)) p.push([cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)]); return p; };
    return {
      ㄱ: L('ㄱ', [[40, 60], [190, 60], [190, 245]]), ㄴ: L('ㄴ', [[60, 40], [60, 200], [215, 200]]),
      ㅁ: L('ㅁ', [[50, 60], [50, 215]], [[50, 60], [200, 60], [200, 215]], [[50, 215], [200, 215]]),
      ㅂ: L('ㅂ', [[50, 40], [50, 215]], [[200, 40], [200, 215]], [[50, 128], [200, 128]], [[50, 215], [200, 215]]),
      ㅇ: L('ㅇ', circle(125, 138, 88, -90, -450)), ㅏ: L('ㅏ', [[90, 40], [90, 245]], [[90, 140], [200, 140]]),
      ㅣ: L('ㅣ', [[125, 40], [125, 245]]), ㅜ: L('ㅜ', [[35, 90], [215, 90]], [[125, 90], [125, 245]]),
      ㅓ: L('ㅓ', [[160, 40], [160, 245]], [[160, 140], [70, 140]]), ㅗ: L('ㅗ', [[35, 195], [215, 195]], [[125, 195], [125, 90]]), ㅅ: L('ㅅ', [[120, 50], [55, 215]], [[120, 105], [195, 215]]),
      lineV: L('|', [[125, 45], [125, 225]]), lineH: L('―', [[35, 138], [215, 138]]), zig: L('zig', [[35, 200], [95, 70], [155, 200], [215, 70]]),
      가: L('가', [[25, 55], [120, 55], [120, 200]], [[175, 40], [175, 235]], [[175, 135], [225, 135]]), 나: L('나', [[30, 45], [30, 200], [125, 200]], [[180, 40], [180, 235]], [[180, 135], [228, 135]]),
      1: L('1', [[95, 70], [135, 40], [135, 225]]),
      2: L('2', [[70, 85], [90, 52], [128, 38], [168, 52], [182, 88], [166, 128], [70, 220], [190, 220]]),
      3: L('3', [[70, 62], [110, 40], [158, 48], [172, 82], [146, 114], [112, 122], [158, 132], [180, 170], [160, 208], [115, 222], [68, 205]]),
      4: L('4', [[150, 40], [60, 160], [195, 160]], [[150, 95], [150, 228]]),
      5: L('5', [[92, 45], [86, 116], [130, 104], [170, 124], [182, 168], [162, 208], [116, 224], [72, 206]], [[92, 45], [175, 45]]),
      D: L('D', [[70, 40], [70, 222]], [[70, 40], [130, 44], [180, 90], [184, 170], [140, 214], [70, 222]]), E: L('E', [[70, 40], [70, 222]], [[70, 40], [190, 40]], [[70, 130], [170, 130]], [[70, 222], [190, 222]]),
      F: L('F', [[70, 40], [70, 222]], [[70, 40], [190, 40]], [[70, 130], [165, 130]]), H: L('H', [[70, 40], [70, 222]], [[180, 40], [180, 222]], [[70, 130], [180, 130]]),
      I: L('I', [[125, 40], [125, 222]], [[85, 40], [165, 40]], [[85, 222], [165, 222]]), L: L('L', [[80, 40], [80, 222], [185, 222]]),
      A: L('A', [[125, 40], [60, 222]], [[125, 40], [190, 222]], [[85, 158], [165, 158]]),
      B: L('B', [[70, 40], [70, 222]], [[70, 40], [140, 40], [176, 64], [172, 104], [140, 126], [70, 126]], [[70, 126], [150, 126], [186, 156], [182, 198], [146, 222], [70, 222]]),
      C: L('C', circle(130, 132, 92, -40, -320)),
    };
  })();
  const dens = (pts, step = 6) => { const o = [pts[0]]; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(d / step)); for (let k = 1; k <= n; k++) o.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]); } return o; };
  const trace = guard(async (app, opt) => {
    const list = opt.shapes, S = shell(app, list.length, opt.bg || 'village'), { run, play, guide } = S;
    const SZ = 560, K = 2.0, OFF = 30, X = (p) => [OFF + p[0] * K, OFF + p[1] * K];
    const side = h('div', { class: 'traceside' }); play.append(side);
    let cv = null;
    for (let r = 0; r < list.length; r++) {
      if (cv) cv.remove(); // 판을 새로 깔아서 지난 손가락 기록을 지운다
      cv = h('canvas', { class: 'tracecv', width: SZ, height: SZ, style: { left: '560px', top: '130px' } }); cv.dataset.ch = list[r].ch; play.append(cv);
      const c = cv.getContext('2d'); c.lineCap = 'round'; c.lineJoin = 'round';
      const sh = list[r], def = SHAPES[sh.ch], color = sh.color || '#8E6CE0', strokes = def.strokes.map((s) => dens(s).map(X));
      side.innerHTML = ''; let si = 0, pi = 0; const doneS = [];
      const paint = () => {
        c.clearRect(0, 0, SZ, SZ);
        strokes.forEach((s) => { c.strokeStyle = '#E4E6F2'; c.lineWidth = 70; c.beginPath(); s.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); });
        strokes.forEach((s, k) => { if (k < si) return; c.setLineDash([2, 16]); c.strokeStyle = '#B9BED3'; c.lineWidth = 8; c.beginPath(); s.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.setLineDash([]); });
        const drawn = (s, upto) => { c.strokeStyle = color; c.lineWidth = 56; c.beginPath(); s.slice(0, upto + 1).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
        doneS.forEach((k) => drawn(strokes[k], strokes[k].length - 1)); if (si < strokes.length && pi > 0) drawn(strokes[si], pi);
        if (si < strokes.length) { const s = strokes[si], [x, y] = s[pi], [nx, ny] = s[Math.min(s.length - 1, pi + 4)]; c.fillStyle = '#4CC34A'; c.beginPath(); c.arc(x, y, 22, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '900 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(si + 1, x, y + 1);
          const a = Math.atan2(ny - y, nx - x); c.fillStyle = '#4CC34A'; c.beginPath(); c.moveTo(x + Math.cos(a) * 44, y + Math.sin(a) * 44); c.lineTo(x + Math.cos(a + 2.5) * 30, y + Math.sin(a + 2.5) * 30); c.lineTo(x + Math.cos(a - 2.5) * 30, y + Math.sin(a - 2.5) * 30); c.fill(); }
      };
      paint(); guide.mood('기본'); const said = guide.say(sh.say || `${sh.ch}를 따라 써 볼까? 초록 점에서 시작해!`).catch(() => {}); // 말하는 동안에도 바로 그릴 수 있게
      await new Promise((resolve) => {
        let drawing = false, idle;
        const kick = () => { clearTimeout(idle); idle = setTimeout(() => { if (run.alive && si < strokes.length) { SFX.tap(); E.assist(); cv.animate([{ filter: 'drop-shadow(0 0 0 #4CC34A)' }, { filter: 'drop-shadow(0 0 18px #4CC34A)' }, { filter: 'drop-shadow(0 0 0 #4CC34A)' }], 900); kick(); } }, 7000); };
        const local = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * SZ / r.width, (e.clientY - r.top) * SZ / r.height]; };
        const move = (e) => {
          if (!drawing || si >= strokes.length) return; const [x, y] = local(e), s = strokes[si]; let moved = false;
          while (pi < s.length - 1 && Math.hypot(s[pi + 1][0] - x, s[pi + 1][1] - y) < 48) { pi++; moved = true; }
          // 조금 앞의 점까지 손가락이 가 있으면 따라잡기 (빠르게 그어도 괜찮게)
          for (let k = pi + 2; k < Math.min(s.length, pi + 7); k++) if (Math.hypot(s[k][0] - x, s[k][1] - y) < 36) { pi = k; moved = true; }
          if (moved) { kick(); paint(); }
          if (pi >= s.length - 1) { doneS.push(si); si++; pi = 0; SFX.ding(si); paint(); if (si >= strokes.length) { clearTimeout(idle); resolve(); } }
        };
        cv.addEventListener('pointerdown', (e) => { E.resume(); drawing = true; try { cv.setPointerCapture(e.pointerId); } catch (er) {} move(e); });
        cv.addEventListener('pointermove', move);
        ['pointerup', 'pointercancel'].forEach((ev) => cv.addEventListener(ev, () => { drawing = false; }));
        kick();
      });
      await said; SFX.tada(); starAt(S, cv);
      if (sh.fr) { side.innerHTML = art({ fr: sh.fr }, '기쁨'); M.pop(wrap(side)); }
      guide.mood('기쁨'); await guide.say(sh.right || `우와! ${sh.ch} 완성!`); guide.mood('기본');
      S.setDot(r); await run.wait(500);
    }
    await done(S, app, opt.kind, opt.end || '글씨를 정말 잘 쓰네!');
  });

  /* ---------------- 7. 그림책 ---------------- */
  const pages = guard(async (app, opt) => {
    const P = opt.pages, S = shell(app, P.length, opt.bg || 'village'), { run, play, guide } = S;
    const book = h('div', { class: 'pbook' }), pic = h('div', { class: 'ppic' }), txt = h('div', { class: 'ptxt' }), num = h('div', { class: 'pnum' });
    const next = h('button', { class: 'pinkbtn pnext' }, '→'); book.append(pic, txt, num); play.append(book, next);
    if (opt.title) { pic.innerHTML = art(opt.cover || P[0].art, '기쁨'); txt.innerHTML = `<b class="ptitle">${opt.title}</b>`; num.textContent = ''; await guide.say(opt.title + '! 같이 읽어 볼까?'); }
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      book.animate([{ transform: 'perspective(1400px) rotateY(-14deg)', opacity: .4 }, { transform: 'perspective(1400px) rotateY(0)', opacity: 1 }], { duration: 450, easing: 'ease-out' });
      SFX.whoosh(); pic.innerHTML = art(p.art, p.ex || '기본'); pic.style.background = p.bg || '#FFF7E0'; txt.textContent = E.plain(p.text); num.textContent = `${i + 1} / ${P.length}`;
      const reread = () => { E.cancelSpeech(); guide.say(p.say || p.text).catch(() => {}); }; txt.onclick = reread; pic.onclick = () => { SFX.pop(); M.squash(wrap(pic.firstElementChild || pic)); reread(); };
      next.style.visibility = 'hidden';
      await guide.say(p.say || p.text);
      if (p.echo) { await run.wait(400); await guide.say('따라 말해 볼까?'); await run.wait(2600); await guide.say(p.echo); } // 영어: 듣고 → 따라 말하기(기다려 줌) → 다시 들려주기
      S.setDot(i); next.style.visibility = 'visible'; next.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 900, iterations: Infinity });
      await new Promise((res) => { next.onclick = () => { E.resume(); E.cancelSpeech(); SFX.tap(); res(); }; });
      run.check();
    }
    next.remove(); pic.innerHTML = art(opt.cover || P[P.length - 1].art, '기쁨'); txt.innerHTML = '<b class="ptitle">끝!</b>'; num.textContent = '';
    await done(S, app, opt.kind, opt.end || '책 한 권을 다 읽었어! 멋지다!');
  });

  /* ---------------- 8. 노래 (반주에 맞춰 같이 부르기) ---------------- */
  const SCALE = [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3, 587.3, 659.3];
  const song = guard(async (app, opt) => {
    const S = shell(app, 1, opt.bg || 'village'), { run, play, guide } = S;
    E.Music.stop();
    const board = h('div', { class: 'lyrics' }), cur = h('div', { class: 'ly-cur' }), nxt = h('div', { class: 'ly-next' }); board.append(cur, nxt); play.append(board);
    const cast = (opt.cast || []).map((k, i, a) => { const hh = opt.castH || 230; const x = 420 + i * (780 / Math.max(1, a.length)); const ac = new E.Actor(run, play, FR[k], x, 690 - E.feetFrac(k) * hh, hh, { z: 5, onclick: () => { SFX.note(); M.hop(ac); } }); return ac; });
    await guide.say(opt.intro || `${opt.title}! 같이 불러 볼까?`); guide.mood('기쁨');
    const bpm = opt.bpm || 100, beat = 60 / bpm, mel = opt.melody || [0, 2, 4, 2, 4, 5, 4, -1];
    const lines = opt.lines;
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]; cur.textContent = E.plain(line); nxt.textContent = lines[li + 1] ? E.plain(lines[li + 1]) : '';
      cur.animate([{ transform: 'scale(.85)', opacity: .3 }, { transform: 'scale(1)', opacity: 1 }], 300);
      const bars = Math.max(1, Math.ceil(line.length / 9)), steps = mel.length * bars;
      const t0 = performance.now();
      for (let k = 0; k < steps; k++) { const n = mel[k % mel.length]; if (n >= 0) E.tone(SCALE[n % SCALE.length] * (n >= 7 ? 1 : 1), beat * .9, 'triangle', .07, 1, k * beat); if (k % 2 === 0) E.tone(SCALE[0] / 2 * (k % 4 ? 1.5 : 1), beat * 1.6, 'sine', .06, 1, k * beat); }
      const bob = setInterval(() => cast.forEach((a, i) => (i + li) % 2 === Math.floor(performance.now() / (beat * 1000)) % 2 && M.hop(a)), beat * 1000);
      try { await run.speak(line, { kind: 'f', pitch: 1.3, rate: opt.rate || 1.0 }); const left = steps * beat * 1000 - (performance.now() - t0); if (left > 0) await run.wait(E.fast ? 50 : left); }
      finally { clearInterval(bob); }
    }
    cur.textContent = '짝짝짝! 노래 끝!'; nxt.textContent = '';
    cast.forEach((a) => { a.mood('기쁨'); M.bounce(a, 2); }); SFX.jingle(); E.fx(play, 'note', 800, 300, 10, { spread: 3, dist: 200 });
    S.setDot(0);
    await done(S, app, opt.kind, opt.end || '노래 정말 잘 부른다!');
  });

  /* ---------------- 9. 글자 합치기 (자음 + 모음 = 글자) ---------------- */
  const CHO = { ㄱ: 0, ㄴ: 2, ㅁ: 6, ㅂ: 7, ㅅ: 9, ㅇ: 11 }, JUNG = { ㅏ: 0, ㅓ: 4, ㅗ: 8, ㅜ: 13, ㅣ: 20 };
  const syl = (a, b) => String.fromCharCode(0xAC00 + (CHO[a] * 21 + JUNG[b]) * 28);
  const syllable = guard(async (app, opt) => {
    const pairs = opt.pairs, S = shell(app, pairs.length, opt.bg || 'village'), { run, play, guide } = S;
    const L = Object.fromEntries(window.LETTERS.map((l) => [l.id, l]));
    for (let r = 0; r < pairs.length; r++) {
      play.innerHTML = '';
      const [ci, vi] = pairs[r], cl = L[ci], vl = L[vi], hh = 300, s = syl(cl.ch, vl.ch);
      const V = new E.Actor(run, play, FR[vi], 860, 620 - E.feetFrac(vi) * hh, hh, { z: 4 });
      const zone = h('div', { class: 'dropzone', style: { left: '680px', top: 620 - E.feetFrac(vi) * hh + 'px' } }); play.append(zone);
      const cEl = h('div', { class: 'sorti big', html: FR[ci]['기본'], style: { left: '420px', top: 620 - E.feetFrac(ci) * hh + 'px' } }); play.append(cEl);
      M.pop(V); M.pop(wrap(cEl)); let ok = false;
      draggable(S, cEl, (pt) => { if (inside(pt, zone, 40) || inside(pt, V.el, 0)) { ok = true; cEl.dataset.lock = 1; return true; } return false; });
      guide.mood('기본'); await guide.say(`${cl.name}를 모음 ${vl.name} 옆으로 데려다줄까?`);
      while (!ok) await run.wait(120);
      SFX.snap(); cEl.style.transition = 'all .4s'; cEl.style.left = '650px'; cEl.style.top = 620 - E.feetFrac(ci) * hh + 'px'; zone.remove();
      await run.wait(450);
      const big = h('div', { class: 'sylbig' }, s); play.append(big); big.animate([{ transform: 'translate(-50%,-50%) scale(0)' }, { transform: 'translate(-50%,-50%) scale(1.2)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 500, easing: 'ease-out' });
      SFX.tada(); E.fx(play, 'sparkle', 760, 200, 10, { spread: 6.2, dist: 150 });
      guide.mood('기쁨'); await guide.say(`${cl.name}랑 ${vl.name} 소리가 만나서 ${s}!`); guide.mood('기본');
      S.setDot(r); await run.wait(500);
    }
    await done(S, app, opt.kind, '글자를 척척 만들었어!');
  });

  /* ---------------- 10. 차례대로 누르기 (무지개 색, 숫자 순서) ---------------- */
  const order = guard(async (app, opt) => {
    const seq = opt.items, S = shell(app, 1, opt.bg || 'sky'), { run, play, guide } = S;
    const slots = h('div', { class: 'oslots' }); play.append(slots);
    const sl = seq.map(() => { const d = h('div', { class: 'oslot' }); slots.append(d); return d; });
    const pile = h('div', { class: 'opile' }); play.append(pile);
    const cards = E.shuffle(seq.map((it, i) => ({ it, i }))).map(({ it, i }) => { const c = h('div', { class: 'ocard', html: art(it) }); c.dataset.i = i; pile.append(c); return c; });
    await guide.say(opt.say);
    let k = 0;
    await new Promise((resolve) => {
      let idle; const kick = () => { clearTimeout(idle); idle = setTimeout(() => { const nx = cards.find((c) => +c.dataset.i === k); if (nx) { nx.classList.add('hint'); E.assist(); } }, 8000); }; kick();
      cards.forEach((c) => c.addEventListener('click', async () => {
        if (!run.alive || c.dataset.used) return; E.resume(); kick();
        if (+c.dataset.i !== k) { SFX.oops(); M.shake(wrap(c)); return; }
        c.dataset.used = 1; c.classList.remove('hint'); c.style.visibility = 'hidden'; sl[k].innerHTML = c.innerHTML; sl[k].classList.add('on'); SFX.ding(k);
        E.speak(E.plain(seq[k].say || ''), { kind: 'f', pitch: 1.2 }); k++;
        if (k === seq.length) { clearTimeout(idle); resolve(); }
      }));
    });
    await run.wait(700); SFX.tada(); starAt(S, slots); S.setDot(0);
    if (opt.right) { guide.mood('기쁨'); await guide.say(opt.right); }
    await done(S, app, opt.kind, opt.end);
  });


  /* ---------------- 11. 마음 친구 (감정 고르기: 정답이 없고, 친구가 아이의 선택에 반응해요) ---------------- */
  const feel = guard(async (app, opt) => {
    const rounds = opt.rounds, S = shell(app, rounds.length, opt.bg || 'village'), { run, play, guide } = S;
    for (let r = 0; r < rounds.length; r++) {
      const q = rounds[r];
      const box = h('div', { class: 'choices' + (q.options.length > 3 ? ' four' : '') }); play.querySelectorAll('.choices').forEach((x) => x.remove()); play.append(box);
      const cards = q.options.map((o) => { const c = h('div', { class: 'choice', html: art(o.art, '기본') }); if (o.label) c.append(h('div', { class: 'clabel' }, o.label)); box.append(c); M.pop(wrap(c)); return c; });
      guide.mood('기본'); const said = guide.say(q.say).catch(() => {}); // 질문하는 동안에도 마음을 고를 수 있게
      const idx = await new Promise((resolve) => cards.forEach((c, i) => c.addEventListener('click', () => { if (!run.alive) return; E.resume(); resolve(i); })));
      E.cancelSpeech(); await said;
      const o = q.options[idx]; cards.forEach((c, i) => { if (i !== idx) c.style.opacity = .3; }); cards[idx].classList.add('right');
      SFX.pop(); starAt(S, cards[idx]);
      M.bounce(guide, 1);
      guide.mood('기쁨'); await guide.say(o.react || '그렇구나!'); guide.mood('기본');
      if (q.after) { guide.mood('기쁨'); await guide.say(q.after); guide.mood('기본'); }
      S.setDot(r); await run.wait(400);
    }
    await done(S, app, opt.kind, opt.end || '친구 마음을 잘 알아주었어! 다정하다!');
  });

  return { feel, choose, pop, match, feed, sort, trace, pages, song, syllable, order, art, SHAPES };
})();
