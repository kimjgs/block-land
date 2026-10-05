/* 짧은 이야기들 (2~3분): 무지개, 얼음, 밤하늘 별, 글자 친구, 코코의 ABC 열기구, 바다 친구 */
(function () {
  const { h, SFX } = E;

  /* 이야기 도구 더하기: 제목 카드, 비, 배경 바꾸기, 소품, 색 칩, 큰 글자 */
  function kit(S) {
    const { world, run } = S, M = E.M;
    S.title = async (t, sub) => {
      const card = h('div', { class: 'stitle' }, h('b', {}, t), sub ? h('small', {}, sub) : null); world.append(card);
      card.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }], { duration: 500, easing: 'ease-out' });
      SFX.jingle(); await run.speak(t, { kind: 'f', pitch: 1.2 }); await run.wait(900);
      await card.animate([{ opacity: 1 }, { opacity: 0 }], 400).finished.catch(() => {}); card.remove();
    };
    let rainEl = null;
    S.rain = (on) => {
      if (on && !rainEl) { rainEl = h('div', { class: 'srain' }); world.append(rainEl); SFX.whoosh(); }
      if (!on && rainEl) { const r = rainEl; rainEl = null; r.animate([{ opacity: 1 }, { opacity: 0 }], 1200).finished.then(() => r.remove()); }
    };
    S.setBg = async (key) => {
      const layer = h('div', { html: BG[key], style: { position: 'absolute', left: 0, top: 0, width: '1000px', height: '560px', zIndex: 1, opacity: 0 } });
      layer.querySelectorAll('img,svg').forEach((x) => { x.style.width = '100%'; x.style.height = '100%'; x.style.objectFit = 'cover'; x.style.display = 'block'; });
      world.insertBefore(layer, world.children[1] || null);
      await layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1200, fill: 'forwards' }).finished.catch(() => {});
    };
    S.prop = (html, x, y, size = 80, z = 9) => {
      const el = h('div', { class: 'sprop', html: html.length <= 4 ? `<span style="font-size:${size}px">${html}</span>` : html, style: { left: x + 'px', top: y + 'px', zIndex: z } }); world.append(el);
      const p = { el, x, y,
        pop: () => el.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.2)', offset: .7 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' }).finished.catch(() => {}),
        move: (nx, ny, ms = 1000, ease = 'ease-in-out') => { const a = el.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${nx - p.x}px,${ny - p.y}px)` }], { duration: ms, easing: ease, fill: 'forwards' }); return a.finished.then(() => { a.cancel(); el.style.left = nx + 'px'; el.style.top = ny + 'px'; p.x = nx; p.y = ny; }).catch(() => {}); },
        bob: () => el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-12px)' }, { transform: 'translateY(0)' }], { duration: 1800, iterations: Infinity, easing: 'ease-in-out' }),
        twinkle: () => el.animate([{ transform: 'scale(1)', filter: 'brightness(1)' }, { transform: 'scale(1.15)', filter: 'brightness(1.4)' }, { transform: 'scale(1)', filter: 'brightness(1)' }], { duration: 1400, iterations: Infinity, delay: Math.random() * 800 }),
        shrink: (k, ms = 2500) => el.animate([{ transform: 'scale(1)' }, { transform: `scale(${k})` }], { duration: ms, fill: 'forwards', easing: 'ease-in' }).finished.catch(() => {}),
        remove: () => el.remove() };
      return p;
    };
    S.chips = async (list, y = 40) => { // [[색, 이름], ...] 하나씩 나오며 읽기
      const row = h('div', { class: 'schips', style: { top: y + 'px' } }); world.append(row);
      for (let i = 0; i < list.length; i++) {
        const [c, w, sp] = list[i], d = h('div', { class: 'schip', style: { background: c } }, h('span', {}, E.plain(w))); row.append(d);
        d.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.15)', offset: .7 }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });
        SFX.ding(i); if (sp === '') await run.wait(450); else await run.speak(sp || w, { kind: 'f', pitch: 1.2 }); await run.wait(120);
      }
      return { remove: () => row.remove() };
    };
    S.big = async (t, say, color = '#E0457B') => {
      const d = h('div', { class: 'sbig', style: { color } }, t); world.append(d);
      d.animate([{ transform: 'translate(-50%,0) scale(0)' }, { transform: 'translate(-50%,0) scale(1.2)', offset: .7 }, { transform: 'translate(-50%,0) scale(1)' }], { duration: 450, easing: 'ease-out' });
      SFX.sparkle(); if (say) await run.speak(say, { kind: 'f', pitch: 1.2 }); await run.wait(700);
      return d;
    };
    S.count = async (n, onEach) => { for (let i = 1; i <= n; i++) { if (onEach) onEach(i); SFX.ding(i - 1); await run.speak(C.NUMW[i] || String(i), { kind: 'f', pitch: 1.25 }); await run.wait(120); } };
    S.walkIn = async (a, x, ms = 1300) => { await a.moveTo(x, parseFloat(a.el.style.top), ms, 'ease-out'); };
    S.M = M;
    return S;
  }

const RAINCLOUD = (w) => `<svg viewBox="0 0 200 110" width="${w}"><defs><radialGradient id="rcg" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#E9EEF6"/><stop offset="1" stop-color="#8E9BB2"/></radialGradient></defs><g fill="url(#rcg)"><circle cx="60" cy="62" r="38"/><circle cx="105" cy="45" r="44"/><circle cx="150" cy="64" r="34"/><rect x="40" y="60" width="130" height="40" rx="20"/></g></svg>`;
  /* ================= 비 오는 날의 무지개 ================= */
  window.StoryRainbow = async function (S0) {
    const S = kit(S0), { run } = S, M = E.M;
    E.Music.start('story');
    await S.title('비 오는 날의 무지개', '과학 이야기');
    const yuni = S.actor('yuni', 560, S.groundTop(300, 'yuni'), 300, { z: 6 });
    const tori = S.actor('tori', 1100, S.groundTop(220, 'tori'), 220, { z: 7 });
    yuni.mood('기쁨'); M.bounce(yuni, 1);
    await yuni.say('오늘은 밖에서 신나게 놀아야지!');
    const cloud = S.prop(RAINCLOUD(240), 260, -140, 0, 4); const dim = S.prop('<div class="sdim"></div>', 0, 0, 0, 3); dim.el.firstChild.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1400, fill: 'forwards' });
    await cloud.move(260, 10, 1400);
    const cloud2 = S.prop(RAINCLOUD(200), 600, -140, 0, 4); cloud2.move(600, 30, 1400);
    S.rain(true); yuni.mood('놀람'); M.hop(yuni);
    await yuni.say('앗, 차가워! 비가 와요!');
    await S.walkIn(tori, 760);
    const umb = S.prop('☂️', 780, 120, 120, 8); umb.pop();
    await tori.say('비가 오면 우산을 쓰면 돼. 같이 쓰자!');
    tori.mood('생각'); await tori.say('그런데 비는 어디에서 올까?');
    await S.ask('비는 어디에서 올까?', 2600);
    tori.mood('기쁨'); await tori.say('비는 구름에서 와! 구름 속 작은 물방울들이 모여서 무거워지면 톡톡 떨어져.');
    await S.ask('같이 말해요! 톡, 톡, 톡!', 2600);
    S.rain(false); cloud.move(-300, 0, 1800); cloud2.move(1100, 0, 1800); umb.remove();
    await dim.el.firstChild.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1500, fill: 'forwards' }).finished.catch(() => {}); SFX.sparkle();
    await tori.say('비가 그치고 해님이 나왔어!');
    await S.setBg('sky'); SFX.sparkle(); S.flash();
    const somi = S.actor('somi', 360, S.groundTop(140, 'somi'), 140, { z: 8 }); M.pop(somi); somi.mood('놀람');
    await somi.say('우와! 하늘에 저게 뭐야?');
    yuni.mood('기쁨'); await yuni.say('무지개다!');
    await tori.say('해님 빛이 공기 속 작은 물방울을 지나가면 여러 가지 색으로 나뉘어. 그게 무지개야!');
    const chips = await S.chips([['#F2453D', '빨강'], ['#FF8C2A', '주황'], ['#FFD230', '노랑'], ['#4CC34A', '초록'], ['#3E9BFF', '파랑'], ['#3A3FA8', '남색'], ['#9B4BD6', '보라']]);
    await tori.say('무지개는 몇 가지 색일까?'); await S.ask('같이 세어 봐요!', 1500);
    await S.count(7); chips.remove();
    tori.mood('기쁨'); await tori.say('일곱 가지! 빨주노초파남보!');
    somi.mood('기쁨'); M.bounce(somi, 2); yuni.mood('기쁨'); M.bounce(yuni, 2);
    await yuni.say('해님이랑 비가 만나면 무지개가 생기는구나!');
    await tori.say('다음에 비가 그치고 해님이 나오면, 해님 반대쪽 하늘을 꼭 봐!');
    await S.mark('end');
  };

  /* ================= 얼음이 사라졌어요 ================= */
  window.StoryIce = async function (S0) {
    const S = kit(S0), { run } = S, M = E.M;
    E.Music.start('story');
    await S.title('얼음이 사라졌어요', '과학 이야기');
    const somi = S.actor('somi', 300, S.groundTop(140, 'somi'), 140, { z: 7 });
    const nana = S.actor('nana', 1100, S.groundTop(170, 'nana'), 170, { z: 6 });
    somi.mood('걱정'); S.fx('sweat', 380, 330, 2, { dist: 40, fall: 30 });
    await somi.say('엄마, 너무너무 더워요!');
    await S.walkIn(nana, 520);
    const plate = S.prop('<div class="splate">🧊🧊🧊</div>', 470, 380, 0, 9); plate.pop();
    nana.mood('기쁨'); await nana.say('시원한 얼음을 가져왔어. 여기 두고 먹으렴.');
    somi.mood('기쁨'); await somi.say('와, 얼음이다! 차가워!');
    const bf = S.butterfly([[1100, 200], [800, 260], [600, 180], [300, 240], [-100, 200]], 4200);
    somi.mood('놀람'); await somi.say('앗, 나비다! 나비야, 같이 놀자!');
    somi.moveTo(-200, S.groundTop(140, 'somi'), 2200, 'ease-in'); await run.wait(1200);
    await nana.say('솜아, 얼음은 해님 아래에 두면….');
    nana.moveTo(1150, S.groundTop(170, 'nana'), 1500, 'ease-in');
    await S.ask('얼음은 어떻게 될까?', 2400);
    // 시간이 흘러요
    const ice = plate.el.querySelector('.splate'); const puddle = S.prop('<div class="spuddle"></div>', 455, 430, 0, 8);
    puddle.el.firstChild.animate([{ transform: 'scaleX(.1)', opacity: 0 }, { transform: 'scaleX(1)', opacity: 1 }], { duration: 3500, fill: 'forwards' });
    ice.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.3)', opacity: 0 }], { duration: 3500, fill: 'forwards' });
    SFX.slide(); await run.wait(3700);
    await somi.moveTo(330, S.groundTop(140, 'somi'), 1500, 'ease-out');
    somi.mood('놀람'); await somi.say('어? 내 얼음이 어디 갔지? 여기엔 물만 있어!');
    await S.ask('얼음은 어디로 갔을까?', 2600);
    const tori = S.actor('tori', 1100, S.groundTop(220, 'tori'), 220, { z: 6 }); await S.walkIn(tori, 700);
    tori.mood('기쁨'); await tori.say('얼음은 따뜻해지면 녹아서 물이 돼. 이걸 "녹는다"고 해.');
    await S.big('얼음 → 물', '얼음이 녹으면 물이 돼요!', '#3E9BFF');
    await tori.say('물을 아주 아주 차갑게 하면 어떻게 될까?');
    const fz = S.prop('❄️', 600, 300, 90, 9); fz.pop(); fz.twinkle();
    await tori.say('다시 꽁꽁 얼음이 돼! 이건 "언다"고 해.');
    S.world.querySelector('.sbig').textContent = '물 → 얼음'; SFX.sparkle(); await run.speak('물이 얼면 얼음이 돼요!', { kind: 'f', pitch: 1.2 });
    S.world.querySelector('.sbig').remove(); fz.remove();
    tori.mood('생각'); await tori.say('또 무엇이 해님 아래에서 녹을까?');
    const ic = S.prop('🍦', 420, 220, 90, 9), sm = S.prop('⛄', 560, 210, 100, 9); ic.pop(); sm.pop();
    await S.ask('아이스크림, 눈사람!', 2600);
    somi.mood('기쁨'); await somi.say('아이스크림은 녹기 전에 빨리 먹어야겠다!');
    M.bounce(somi, 2); tori.mood('기쁨'); await tori.say('맞아! 차가운 것은 시원한 곳에 두자.');
    await S.mark('end');
  };

  /* ================= 밤하늘 별 ================= */
  window.StoryStars = async function (S0) {
    const S = kit(S0), { run } = S, M = E.M;
    E.Music.start('night');
    await S.title('밤하늘 별', '과학 이야기');
    const somi = S.actor('somi', 330, S.groundTop(140, 'somi'), 140, { z: 7 });
    const mongi = S.actor('mongi', 520, S.groundTop(200, 'mongi'), 200, { z: 6 });
    somi.mood('걱정'); await somi.say('몽이야, 잠이 안 와….');
    mongi.mood('기쁨'); await mongi.say('그럼 우리 같이 밤하늘 별을 세어 볼까?');
    const pos = [[160, 60], [300, 130], [460, 50], [620, 120], [760, 70]], stars = [];
    await S.count(5, (i) => { const st = S.prop('⭐', pos[i - 1][0], pos[i - 1][1], 60, 4); st.pop(); st.twinkle(); stars.push(st); });
    somi.mood('기쁨'); await somi.say('별이 다섯 개! 반짝반짝!');
    await mongi.say('별은 아주아주 멀리 있어서 작게 보이는 거래. 사실은 해님처럼 스스로 빛나!');
    const moon = S.prop('🌙', 850, 40, 110, 3); moon.pop();
    somi.mood('놀람'); await somi.say('저기 달님도 있어!');
    await mongi.say('달님은 매일 모양이 조금씩 바뀌어. 가느다란 달, 반달, 동그란 보름달!');
    const phases = await S.chips(['🌑', '🌒', '🌓', '🌔', '🌕'].map((e) => ['#2A2F66', e, '']), 380);
    await S.ask('동그란 달은 무슨 달? (보름달)', 2600); phases.remove();
    const owl = S.prop('🦉', 120, 300, 80, 8); owl.pop(); SFX.chirp();
    await run.speak('부엉, 부엉!', { kind: 'm', pitch: .9 });
    await mongi.say('부엉이는 낮에 자고, 밤에 일어나서 놀아.');
    mongi.mood('생각'); await mongi.say('해님은 언제 뜨지? 달님은 언제 뜨지?');
    await S.ask('해님은 낮에, 달님은 밤에!', 2800);
    somi.mood('기쁨'); await somi.say('이제 졸려…. 별님, 달님, 잘 자요.');
    somi.mood('blink'); const zz = S.prop('💤', 400, 300, 60, 9); zz.bob();
    mongi.mood('기쁨'); await mongi.say('잘 자, 솜이야. 내일 또 놀자.');
    stars.forEach((s) => s.twinkle());
    await run.wait(800); await S.mark('end');
  };

  /* ================= 글자 친구들이 놀러 왔어요 ================= */
  window.StoryLetters = async function (S0) {
    const S = kit(S0), { run } = S, M = E.M;
    E.Music.start('story');
    await S.title('글자 친구들이 놀러 왔어요', '글자 이야기');
    const tori = S.actor('tori', 60, S.groundTop(220, 'tori'), 220, { z: 7 });
    tori.mood('기쁨'); await tori.wave(5);
    await tori.say('오늘은 글자 친구들이 우리 마을에 놀러 온대! 누가 오는지 볼까?');
    const L = Object.fromEntries(window.LETTERS.map((l) => [l.id, l]));
    const EMO = { L0: '🦒', L1: '🦋', L2: '🐴', L4: '🦆', L5: '👶' };
    const list = ['L0', 'L1', 'L2', 'L4', 'L5'], xs = [260, 400, 540, 680, 820], A = {};
    for (let i = 0; i < list.length; i++) {
      const id = list[i], l = L[id], a = S.actor(id, 1100, S.groundTop(170, id), 170, { z: 6 + i, voice: { kind: 'f', pitch: 1.35, rate: 1 } }); A[id] = a;
      SFX.pop(); await S.walkIn(a, xs[i], 1200); a.mood('기쁨');
      const p = S.prop(EMO[id], xs[i] + 30, 150, 70, 9); p.pop();
      await a.say(l.sound ? `나는 ${l.name}! ${l.sound}~ ${l.buddy}의 ${l.sound}!` : `나는 ${l.name}! ${l.buddy}에서 만나!`);
      p.remove(); a.mood('기본');
    }
    await tori.say('모두 반가워! 그런데 글자 친구들이 손을 잡으면 신기한 일이 생긴대.');
    await A.L0.say('아 친구야, 나랑 손잡자!'); SFX.snap();
    await A.L0.moveTo(xs[4] - 120, parseFloat(A.L0.el.style.top), 1200, 'ease-in-out');
    const b1 = await S.big('가', '가!', '#8E6CE0');
    await tori.say('기역이랑 모음 아가 손을 잡으면 "가"가 돼! 가방의 가!'); b1.remove();
    await A.L1.say('나도 해 볼래!'); SFX.snap();
    await A.L0.moveTo(xs[0], parseFloat(A.L0.el.style.top), 900, 'ease-in-out');
    await A.L1.moveTo(xs[4] - 120, parseFloat(A.L1.el.style.top), 1000, 'ease-in-out');
    const b2 = await S.big('나', '나!', '#8E6CE0');
    await tori.say('니은이랑 모음 아가 만나면 "나"! 나비의 나!'); b2.remove();
    await S.ask('같이 말해요! 가, 나!', 2800);
    tori.mood('기쁨'); await tori.say('글자 친구들은 서로 만나서 여러 가지 소리를 만들어. 다음에 또 놀자!');
    Object.values(A).forEach((a) => { a.mood('기쁨'); M.bounce(a, 2); }); SFX.jingle();
    await run.wait(1200); await S.mark('end');
  };

  /* ================= 코코의 ABC 열기구 ================= */
  const balloonHtml = (inner) => `<div class="hotair"><svg viewBox="0 0 220 300" width="220" height="300"><path d="M110 10 C40 10 10 70 20 120 C30 170 80 200 90 220 L130 220 C140 200 190 170 200 120 C210 70 180 10 110 10Z" fill="#FF6F8E"/><path d="M110 10 C80 40 72 140 92 220 L128 220 C148 140 140 40 110 10Z" fill="#FFD230"/><path d="M58 30 C40 80 52 160 90 220" stroke="#fff" stroke-width="5" fill="none" opacity=".5"/><line x1="92" y1="220" x2="78" y2="250" stroke="#8A6A3A" stroke-width="4"/><line x1="128" y1="220" x2="142" y2="250" stroke="#8A6A3A" stroke-width="4"/><rect x="66" y="246" width="88" height="48" rx="10" fill="#B07A3A" stroke="#7A5226" stroke-width="4"/></svg><div class="hotair-rider">${inner}</div></div>`;
  window.StoryABC = async function (S0) {
    const S = kit(S0), { run } = S, M = E.M;
    E.Music.start('story');
    await S.title('코코의 ABC 열기구', '영어 이야기');
    const coco = S.actor('coco', 300, S.groundTop(190, 'coco'), 190, { z: 7 });
    coco.mood('기쁨'); await coco.wave(5);
    await coco.say('{Hello}! 안녕! 나는 코코야. 오늘은 열기구를 타고 에이비씨 여행을 떠날 거야!');
    coco.remove();
    const bal = S.prop(balloonHtml(FR.coco['기쁨']), 280, 230, 0, 7); bal.pop(); SFX.whoosh();
    await bal.move(120, 40, 2200); bal.bob();
    await run.speak('출발!', { kind: 'f', pitch: 1.2 });
    const stops = [['A', '🍎', 'apple', '사과'], ['B', '⚽', 'ball', '공'], ['C', '🐱', 'cat', '고양이']];
    for (let i = 0; i < stops.length; i++) {
      const [L, e, w, ko] = stops[i];
      const card = S.prop(`<div class="abccard"><b>${L}</b><span>${e}</span></div>`, 560, 90, 0, 8); card.pop(); SFX.sparkle();
      await run.speak(`{${L}}!`, C.VOICE.coco);
      await run.speak(`{${L} is for ${w}}.`, C.VOICE.coco);
      await run.speak(`${ko}는 {${w}}!`, C.VOICE.coco);
      await S.ask(`같이 말해요! ${L}, ${w}!`, 2600);
      if (L === 'C') { const somi = S.actor('somi', 800, S.groundTop(140, 'somi'), 140, { z: 8 }); M.pop(somi); somi.mood('기쁨'); await somi.say('야옹! 나도 {cat}이야!'); }
      card.remove();
    }
    await run.speak('이번엔 풍선을 세어 볼까? {One, two, three}!', C.VOICE.coco);
    const bs = [];
    for (let i = 0; i < 3; i++) { const b = S.prop('🎈', 560 + i * 110, 200, 80, 8); b.pop(); b.bob(); bs.push(b); SFX.ding(i); await run.speak(`{${['One', 'Two', 'Three'][i]}}`, { lang: 'en' }); await run.wait(200); }
    await S.ask('같이 세어요! one, two, three!', 2800);
    bs.forEach((b) => b.remove());
    await bal.move(300, 230, 2200, 'ease-in'); SFX.thud();
    await run.speak('도착! 오늘 배운 것, {A, B, C}!', C.VOICE.coco);
    await run.speak('{Goodbye}! 또 만나!', C.VOICE.coco);
    await S.mark('end');
  };

  /* ================= 바다 친구를 만나요 ================= */
  window.StorySea = async function (S0) {
    const S = kit(S0), { run } = S, M = E.M;
    E.Music.start('story');
    await S.title('바다 친구를 만나요', '바다 이야기');
    const mongi = S.actor('mongi', 160, S.groundTop(190, 'mongi'), 190, { z: 7 });
    const coco = S.actor('coco', 360, S.groundTop(170, 'coco'), 170, { z: 6 });
    mongi.mood('기쁨'); await mongi.say('우와, 여기는 바닷속이야! 뽀글뽀글!');
    await coco.say('바다에는 어떤 친구들이 살까? 같이 찾아보자!');
    const fish = [];
    await S.count(5, (i) => { const f = S.prop(['🐠', '🐟', '🐡', '🐠', '🐟'][i - 1], 1050, 120 + i * 40, 60, 5); fish.push(f); f.move(440 + i * 90, 100 + (i % 2) * 60, 1200); });
    await coco.say('물고기가 다섯 마리! 물고기는 아가미로 숨을 쉬어.');
    fish.forEach((f, i) => f.move(-150, 100 + i * 30, 2500 + i * 200));
    const oct = S.prop('🐙', 640, 250, 120, 6); oct.pop(); oct.bob();
    await run.speak('안녕! 나는 문어야. 내 다리는 몇 개게?', { kind: 'm', pitch: 1.1 });
    await S.ask('같이 세어 봐요!', 1500); await S.count(8);
    await coco.say('여덟 개! 문어 다리는 여덟 개야.'); oct.remove();
    const crab = S.prop('🦀', 900, 410, 80, 8); crab.pop();
    await crab.move(560, 410, 1800);
    await mongi.say('꽃게는 옆으로 걸어! 나도 따라 해 볼래!');
    await mongi.moveTo(320, parseFloat(mongi.el.style.top), 900); await mongi.moveTo(160, parseFloat(mongi.el.style.top), 900);
    crab.remove();
    const whale = S.prop('🐳', 1050, 60, 200, 3); await whale.move(380, 60, 2500);
    mongi.mood('놀람'); await mongi.say('우와아! 엄청 크다!');
    await coco.say('고래야! 고래는 바다에서 아주 큰 친구야. 물 위로 올라가서 숨을 쉬어.');
    whale.move(-300, 0, 2600);
    const star = S.prop('⭐', 820, 300, 50, 6); star.pop();
    await run.speak('엉엉, 엄마 어디 있어요?', { kind: 'f', pitch: 1.7 });
    await coco.say('아기 불가사리가 엄마를 잃어버렸대. 엄마 불가사리는 어디 있을까?');
    await S.ask('어디 있을까?', 2400);
    const mom = S.prop('<span style="font-size:90px;filter:hue-rotate(-30deg)">⭐</span>', 500, 440, 0, 6); mom.pop(); SFX.sparkle();
    await mongi.say('찾았다! 모래 위에 있어!');
    await star.move(560, 420, 1200); SFX.heart(); S.fx('heart', 580, 420, 5, { dist: 70 });
    await run.speak('엄마! 고마워요!', { kind: 'f', pitch: 1.7 });
    mongi.mood('기쁨'); coco.mood('기쁨'); M.bounce(mongi, 2); M.bounce(coco, 2);
    await coco.say('바다 친구들, 안녕! 또 놀러 올게!');
    await S.mark('end');
  };
  window.StoryKit2 = kit; // 새 이야기 파일에서도 같은 도구를 쓴다
})();
