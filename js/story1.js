/* 이야기 장면을 만드는 도구 + 이야기 1 「솜이를 구해 줘!」 */
window.StoryKit = function (world, cap, run) {
  const { h, fx: efx, SFX } = E;
  const S = { world, cap, run };
  E.ambient(world, 18, '#FFFBD0');
  const F = .9, TM = 93.84, BM = 61.2;
  S.top = (rows) => 445 - (TM + rows * 64) * F;          // 블록 n칸 친구가 서는 위쪽 위치
  S.hh = (rows) => (TM + rows * 64 + BM) * F;             // 블록 n칸 친구 그림 높이
  S.groundTop = (hgt, key) => 476 - (key ? E.feetFrac(key) : .94) * hgt; // 높이 hgt인 그림의 발이 땅에 닿는 위쪽 위치
  S.num = (key, rows, cell = 57.6) => { const m = E.meta(key); return m ? { h: m.h * cell / m.px, w: m.w * cell / m.px, top: 476 - m.feet * cell / m.px } : { h: S.hh(rows), w: S.hh(rows) * .55, top: S.top(rows) }; };
  S.actor = (key, x, y, hgt, opt = {}) => new E.Actor(run, world, FR[key], x, y, hgt, { voice: C.VOICE[key], ...opt });
  S.fx = (type, x, y, n, opt) => efx(world, type, x, y, n, opt);
  S.say = (a, t, o) => a.say(t, o);

  /* 칸 눈금 (1~5): 나무 옆에 점선 칸 5개 */
  const ticks = h('div', { style: { position: 'absolute', left: 0, top: 0, width: '1000px', height: '560px', pointerEvents: 'none', zIndex: 3 } });
  let tk = '<svg viewBox="0 0 1000 560" width="1000" height="560">';
  for (let i = 0; i < 5; i++) {
    const y = 445 - (i + 1) * 57.6;
    tk += `<g id="tk${i}" style="transition:all .25s"><rect x="702" y="${y + 3}" width="52" height="52" rx="10" fill="#ffffff22" stroke="#fff" stroke-width="4" stroke-dasharray="9 7"/><text x="728" y="${y + 40}" text-anchor="middle" font-size="28" font-weight="900" fill="#fff" stroke="#3A6A9A" stroke-width="1.2">${i + 1}</text></g>`;
  }
  ticks.innerHTML = tk + '</svg>'; ticks.style.display = 'none'; world.append(ticks);
  S.showTicks = (on) => { ticks.style.display = on ? 'block' : 'none'; };
  S.tick = (n, on) => {
    for (let i = 0; i < 5; i++) {
      const g = ticks.querySelector('#tk' + i), lit = i < n && on;
      g.style.filter = lit ? 'drop-shadow(0 0 10px #FFE14D)' : ''; g.querySelector('rect').setAttribute('fill', lit ? '#FFF2A0cc' : '#ffffff22');
    }
  };
  S.countAlong = async (words, n, onTick) => {
    for (let i = 0; i < n; i++) { S.tick(i + 1, true); if (onTick) onTick(i); SFX.ding(i); await run.speak(words[i], { kind: 'f', pitch: 1.2, rate: 1 }); await run.wait(150); }
  };

  /* 아이가 같이 말하거나 세어 볼 시간 */
  const askBox = h('div', { class: 'overlay-pause' }); world.parentElement.append(askBox);
  S.ask = async (text, ms = 2800) => { askBox.textContent = text; askBox.style.display = 'block'; try { await run.wait(ms); } finally { askBox.style.display = 'none'; } };

  /* 장면 전환 번쩍 */
  S.mark = async (n) => { if (E.stopAt === n) await new Promise(() => {}); };
  S.flash = () => world.animate([{ filter: 'brightness(1.6)' }, { filter: 'brightness(1)' }], 300);

  /* 큰 숫자 팝업 (119) */
  S.bigNumbers = async (items) => {
    const box = h('div', { style: { position: 'absolute', left: '50%', top: '40px', transform: 'translateX(-50%)', display: 'flex', gap: '20px', zIndex: 40 } });
    world.append(box);
    try {
      for (let i = 0; i < items.length; i++) {
        const d = h('div', { style: { width: '110px', height: '110px', borderRadius: '50%', background: '#fff', border: '8px solid #F2453D', fontSize: '64px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22223A', boxShadow: '0 6px 16px #0003' } }, items[i][0]);
        box.append(d); d.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.2)', offset: .7 }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
        SFX.ding(i * 2); await run.speak(items[i][1], { kind: 'f', pitch: 1.2, rate: .95 }); await run.wait(200);
      }
      await run.wait(900);
    } finally { box.remove(); }
  };

  /* 나비 */
  S.butterfly = (pts, ms) => {
    const el = h('div', { class: 'fx', html: E.FXSVG.butterfly(), style: { left: 0, top: 0, zIndex: 25 } });
    el.querySelector('.wing').style.cssText = 'transform-origin:center;animation:flap .25s infinite alternate';
    world.append(el);
    const kf = pts.map(([x, y], i) => ({ transform: `translate(${x}px,${y}px)`, offset: i / (pts.length - 1) }));
    const an = el.animate(kf, { duration: ms, fill: 'forwards', easing: 'ease-in-out' });
    return { el, done: an.finished.catch(() => {}) };
  };
  if (!document.getElementById('flapcss')) document.head.append(h('style', { id: 'flapcss' }, '@keyframes flap{from{transform:scaleX(1)}to{transform:scaleX(.35)}}'));

  /* 사다리 */
  S.ladder = (x, y, angle, len) => {
    const el = h('div', { style: { position: 'absolute', left: x + 'px', top: y + 'px', width: '0px', height: '30px', transformOrigin: '0 50%', transform: `rotate(${angle}deg)`, zIndex: 6,
      borderTop: '6px solid #C9CED8', borderBottom: '6px solid #C9CED8', boxSizing: 'border-box',
      background: 'repeating-linear-gradient(90deg, transparent 0 20px, #AEB5C4 20px 25px)' } });
    world.append(el);
    return { el, extend: () => el.animate([{ width: '0px' }, { width: len + 'px' }], { duration: 1600, fill: 'forwards', easing: 'ease-out' }).finished.catch(() => {}),
      stuck: () => el.animate([{ transform: `rotate(${angle}deg)` }, { transform: `rotate(${angle - 2}deg)` }, { transform: `rotate(${angle + 1.5}deg)` }, { transform: `rotate(${angle}deg)` }], { duration: 400 }).finished.catch(() => {}),
      retract: () => el.animate([{ width: len + 'px', opacity: 1 }, { width: '0px', opacity: 0 }], { duration: 800, fill: 'forwards' }).finished.catch(() => {}) };
  };

  /* 새 둥지가 걸렸다가 떨어짐 */
  S.nest = async (x, y) => {
    const el = h('div', { class: 'fx', style: { left: x + 'px', top: y + 'px', zIndex: 22 },
      html: '<svg viewBox="0 0 70 56" width="76"><ellipse cx="35" cy="42" rx="32" ry="12" fill="#A0703F" stroke="#6E4A26" stroke-width="3"/><path d="M8 40 q27 -14 54 0" fill="none" stroke="#C99560" stroke-width="4"/><circle cx="35" cy="26" r="13" fill="#FFD230" stroke="#D9A900" stroke-width="3"/><circle cx="31" cy="23" r="3" fill="#22223A"/><circle cx="40" cy="23" r="3" fill="#22223A"/><polygon points="33,29 38,29 35.5,33" fill="#FF8C2A"/></svg>' });
    world.append(el);
    SFX.pop(); await el.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(10px,40px) rotate(25deg)', offset: .4 }, { transform: 'translate(24px,150px) rotate(-10deg)', offset: .8 }, { transform: 'translate(26px,150px) rotate(0)' }], { duration: 900, fill: 'forwards', easing: 'ease-in' }).finished.catch(() => {});
    SFX.thud(); efx(world, 'dust', x + 40, y + 190, 4, { spread: 2.4, dist: 50 });
    await run.wait(300); SFX.chirp();
    await el.animate([{ transform: 'translate(26px,150px)', opacity: 1 }, { transform: 'translate(160px,-40px) scale(.5)', opacity: 0 }], { duration: 1200, fill: 'forwards', easing: 'ease-in' }).finished.catch(() => {});
    el.remove();
  };

  /* 해 질 녘 */
  S.sunset = () => {
    const el = h('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(#FF9A5C00,#FF9A5C88)', opacity: 0, zIndex: 2, pointerEvents: 'none' } });
    world.append(el); el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 2500, fill: 'forwards' });
  };

  return S;
};

/* ================== 이야기 1 ================== */
window.Story1 = async function (S) {
  const { run, world } = S, SFX = E.SFX, M = E.M, wait = (ms) => run.wait(ms);
  const T = S.top, HH = S.hh;
  const P1 = S.num('n1', 1), P2 = S.num('n2', 2), P3 = S.num('n3', 3), TW = S.num('tower', 5);
  const mongi = S.actor('mongi', 140, S.groundTop(200, 'mongi'), 200, { z: 6 }); mongi.el.style.opacity = 0;
  const somi = S.actor('somi', 120, S.groundTop(140, 'somi'), 140, { z: 7 });
  const sayMongi = (t, o) => mongi.say(t, o);
  E.Music.start('story');

  /* ---- 장면 1: 꽈당! ---- */
  S.flash();
  const bf = S.butterfly([[-60, 330], [160, 280], [300, 340], [420, 220], [520, 150], [640, 90], [760, 60], [1100, 30]], 5200);
  somi.mood('기쁨');
  await somi.say('나비야, 같이 놀자!', { rate: 1.05 });
  M.hop(somi); await somi.moveTo(300, S.groundTop(140, 'somi'), 900, 'ease-in-out');
  SFX.oops(); somi.mood('놀람'); S.fx('bang', somi.center().x + 30, somi.center().y, 1, { dist: 30 });
  await M.tumble(somi);
  SFX.boing(); S.fx('star', somi.center().x, somi.center().y + 40, 6, { dist: 100, spread: 5 });
  await somi.moveTo(596, 22, 800, 'ease-in'); somi.el.getAnimations().forEach((a) => a.cancel());
  SFX.thud(); S.fx('leaf', 650, 70, 8, { spread: 5, dist: 70 }); S.fx('star', 640, 40, 5, { dist: 60, color: '#FFE070' });
  somi.mood('놀람'); await wait(500);
  await somi.say('어…? 여기가 어디야?', { pitch: 1.7 });

  /* ---- 장면 2: 너무 높아 ---- */
  somi.mood('걱정'); M.wiggle(somi, 2); S.fx('sweat', 680, 40, 2, { dist: 40, fall: 40 });
  await somi.say('야옹… 너무 높아. 무서워.', { rate: .95 });
  const nana = S.actor('nana', 1100, S.groundTop(160, 'nana'), 160, { z: 5 });
  SFX.heart(); await nana.moveTo(430, S.groundTop(160, 'nana'), 1500, 'ease-out'); nana.mood('걱정');
  await nana.say('솜아! 괜찮아, 엄마 여기 있어. 움직이지 말고 기다려.');
  nana.mood('기본');

  /* ---- 장면 3: 일, 일, 구! ---- */
  mongi.el.style.opacity = 1; M.pop(mongi); SFX.pop(); mongi.mood('기쁨'); await M.bounce(mongi, 1); await mongi.wave(5);
  await sayMongi('솜이가 못 내려오네. 도움이 필요할 땐 누구를 부를까?'); mongi.mood('생각');
  await S.ask('누구를 부를까?', 2600); mongi.mood('기쁨');
  await sayMongi('맞아, 소방관! 같이 눌러 보자.');
  await S.bigNumbers([['1', '일'], ['1', '일'], ['9', '구']]);
  await S.ask('같이 말해요! 일, 일, 구!', 3000);
  mongi.mood('기본'); await sayMongi('119는 정말 도움이 필요할 때만 부르는 거야.');

  /* ---- 장면 4: 출동! ---- */
  mongi.mood('기본'); M.hop(mongi); mongi.moveTo(800, S.groundTop(200, 'mongi'), 800, 'ease-in-out');
  SFX.siren(); const fire = S.actor('fire', -30, S.groundTop(150, 'fire'), 150, { z: 8 });
  const lights = E.cycle(fire, ['alt2', '기본'], 250, 10);
  await M.driveIn(fire); S.fx('dust', 60, 440, 4, { spread: 1.5, dist: 60 });
  await fire.say('출동! 앵앵이가 왔어요!'); await lights;
  const captain = S.actor('captain', 215, S.groundTop(235, 'captain'), 235, { z: 7 }); M.pop(captain); captain.mood('기쁨');
  await captain.say('걱정 마, 우리가 왔어!'); captain.mood('기본');

  /* ---- 장면 5: 사다리가 꽉! ---- */
  const lad = S.ladder(100, 352, -40, 380);
  await lad.extend(); SFX.thud(); lad.stuck();
  S.fx('leaf', 450, 160, 10, { spread: 5, dist: 90, fall: 60 });
  await S.nest(360, 70);
  await fire.say('어이쿠! 가지가 많아서 사다리가 못 들어가요!');
  await captain.say('흠… 솜이는 얼마나 높이 있을까?');
  await sayMongi('나무 옆 칸을 같이 세어 보자!');
  await lad.retract();
  S.showTicks(true);
  const words = ['하나', '둘', '셋', '넷', '다섯'];
  await S.countAlong(words, 5);
  await S.ask('같이 세어 봐요!', 1200);
  mongi.mood('기쁨'); await sayMongi('솜이는 다섯 칸 높이에 있어!'); mongi.mood('기본'); S.tick(0, false);

  /* ---- 장면 6: 내가 먼저! (도전 1) ---- */
  const n1 = S.actor('n1', -240, P1.top, P1.h, { z: 8 });
  SFX.whoosh(); n1.mood('기쁨');
  const run1 = n1.moveTo(120, P1.top, 700, 'ease-in');
  await run1;
  n1.say('내가 먼저! 내가 먼저!', { rate: 1.1 });
  await M.dashFall(n1, 420); SFX.thud(); n1.mood('놀람'); S.fx('dust', 520, 450, 5, { spread: 2.4, dist: 60 });
  n1.mood('기쁨'); await n1.say('괜찮아! 하나는 안 아파!');
  await n1.moveTo(640, P1.top, 900, 'ease-out');
  S.tick(1, true); SFX.ding(0);
  await sayMongi('하나는 몇 칸이지?'); await S.ask('몇 칸일까?', 2200);
  await sayMongi('한 칸! 솜이는 다섯 칸에 있는데…');
  await n1.say('너무 낮아! 친구들 불러 올게!', { rate: 1.1 });
  S.tick(0, false); M.dashFall(n1, -300); await wait(1000); SFX.thud(); S.fx('dust', 360, 450, 4, { spread: 2.4, dist: 50 });
  await wait(1100); n1.remove();

  /* ---- 장면 7: 셋! 셋! 나는 셋! (도전 2) ---- */
  const n3 = S.actor('n3', -260, P3.top, P3.h, { z: 8 });
  SFX.note(); const notes = setInterval(() => { if (!run.alive) return; const c = n3.center(); S.fx('note', c.x + 40, c.y + 20, 1, { dist: 110, spread: 1 }); }, 400);
  n3.mood('기쁨');
  await Promise.all([n3.moveTo(560, P3.top, 1600, 'ease-out'), M.bounce(n3, 3)]);
  await n3.say('셋! 셋! 나는 셋!'); clearInterval(notes); n3.mood('기본');
  await sayMongi('셋은 몇 칸까지 닿을까? 같이 세어 보자!');
  await S.countAlong(words, 3); await S.ask('하나, 둘, 셋!', 900);
  somi.mood('걱정'); M.shake(somi); S.fx('sweat', 680, 40, 1, { dist: 30, fall: 40 });
  await somi.say('야옹… 아직 안 닿아.', { rate: .95 });
  mongi.mood('생각'); S.fx('q', 380, 270, 1, { dist: 30, ms: 1500 });
  await sayMongi('넷, 다섯… 몇 칸이 더 필요할까?'); await S.ask('몇 칸이 더 필요할까?', 2600);
  mongi.mood('기쁨'); await sayMongi('맞아, 두 칸!'); mongi.mood('기본');

  /* ---- 장면 8: 착! 다섯이 됐어요 (도전 3) ---- */
  const n2 = S.actor('n2', -260, P2.top, P2.h, { z: 9 });
  SFX.heart(); n2.mood('기쁨'); S.fx('heart', 120, 240, 2, { dist: 80 });
  await Promise.all([n2.moveTo(330, P2.top, 1300, 'ease-out'), M.hop(n2)]);
  await n2.say('좋아, 좋아! 우리가 두 칸이야!');
  await sayMongi('둘이 셋 위에 올라가면 어떻게 될까?'); await S.ask('어떻게 될까?', 2500);
  SFX.boing(); n2.mood('놀람');
  const sx = parseFloat(n2.el.style.left), sy = parseFloat(n2.el.style.top), ex = 560 + P3.w / 2 - P2.w / 2, ey = TW.top + (TW.h - P2.h) * 0 + 0;
  await n2.anim([{ transform: 'translate(0,0) scale(1.1,.9)' }, { transform: `translate(${(ex - sx) * .5}px,${ey - sy - 120}px) scale(.92,1.1) rotate(-10deg)`, offset: .5 }, { transform: `translate(${ex - sx}px,${ey - sy}px) scale(1,1) rotate(0)` }], 900);
  SFX.snap(); S.fx('dust', 560 + P3.w / 2, TW.top + TW.h * .62, 6, { spread: 3, dist: 70 }); S.fx('sparkle', 620, 280, 8, { spread: 6.2, dist: 120 });
  const tower = new E.Actor(run, world, FR.tower, 560 + P3.w / 2 - TW.w / 2, TW.top, TW.h, { base: 'lit0', z: 9, voice: C.VOICE.n3 });
  n2.remove(); n3.remove(); M.squash(tower); S.flash(); await wait(400);
  await sayMongi('셋 위에 둘이 올라갔어! 이제 몇 칸일까? 같이 세어 보자!');
  S.tick(0, false);
  for (let i = 0; i < 5; i++) { tower.mood('lit' + (i + 1)); S.tick(i + 1, true); SFX.ding(i); M.squash(tower); await run.speak(words[i], { kind: 'f', pitch: 1.2 }); await wait(120); }
  await S.mark('count5');
  const eq = E.h('div', { class: 'fx', style: { left: '500px', top: '60px', transform: 'translateX(-50%) scale(0)', background: '#fff', borderRadius: '40px', padding: '8px 28px', fontSize: '44px', fontWeight: 900, boxShadow: '0 4px 14px #0002', whiteSpace: 'nowrap', zIndex: 40 }, html: '<span style="color:#D9A900">셋</span> + <span style="color:#FF8C2A">둘</span> = <span style="color:#3E9BFF">다섯!</span>' });
  world.append(eq); eq.animate([{ transform: 'translateX(-50%) scale(0)' }, { transform: 'translateX(-50%) scale(1.15)', offset: .7 }, { transform: 'translateX(-50%) scale(1)' }], { duration: 500, fill: 'forwards', easing: 'ease-out' });
  SFX.tada(); S.fx('confetti', 500, 60, 40, { spread: 3.4, dist: 260, fall: 140, stagger: 15 });
  tower.mood('기쁨'); mongi.mood('기쁨');
  await sayMongi('셋이랑 둘이 만나면 다섯이 돼!'); mongi.mood('기본');
  await wait(600); eq.remove();

  /* ---- 장면 9: 조심조심 ---- */
  tower.el.style.zIndex = 9;
  await tower.say('솜아, 우리 위로 올라와!', { kind: 'f', pitch: 1.3 });
  somi.mood('걱정'); await somi.say('야옹… 조심조심.', { rate: .9 });
  SFX.boing(); await somi.moveTo(570, 30, 700, 'ease-in-out'); somi.mood('기쁨'); SFX.pop();
  await sayMongi('이제 우리 누워 볼까?');
  S.showTicks(false); SFX.slide();
  somi.el.style.zIndex = 12;
  await Promise.all([tower.anim([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(90deg) scale(.7)' }], 1500, { ease: 'ease-in-out' }), somi.moveTo(585, S.groundTop(140, 'somi'), 1500, 'ease-in-out')]);
  SFX.thud(); S.fx('dust', 700, 450, 5, { spread: 3, dist: 60 }); await S.mark('lie');
  mongi.mood('기쁨'); await sayMongi('누워도 다섯 칸 그대로야. 모양이 바뀌어도 다섯은 다섯!');
  await tower.anim([{ opacity: 1 }, { opacity: 0 }], 600); tower.remove();

  /* ---- 장면 10: 엄마 품으로 ---- */
  somi.mood('기쁨'); SFX.boing(); await somi.moveTo(nana.center().x - 40, S.groundTop(140, 'somi'), 700, 'ease-in-out'); nana.mood('기쁨');
  SFX.heart(); S.fx('heart', nana.center().x, nana.center().y + 20, 6, { spread: 3, dist: 120 }); M.hop(nana);
  await S.mark('hug');
  await nana.say('고마워요, 친구들.');
  await somi.say('고마워! 야옹!', { pitch: 1.8 });
  captain.mood('기쁨'); await captain.say('모두 함께 해서 해냈어!'); captain.mood('기본');
  mongi.mood('생각'); await sayMongi('솜이는 나무 위에서 어떤 기분이었을까?'); await S.ask('어떤 기분이었을까?', 3000);
  mongi.mood('기본'); await sayMongi('무서웠을 거야. 그런데 엄마와 친구들이 오니까 마음이 놓였지.');
  await sayMongi('여러분도 무서울 때 도와 달라고 말하면 돼.');

  /* ---- 장면 11: 몸 움직이기 + 숫자 노래 ---- */
  mongi.mood('기쁨'); await sayMongi('다 같이 몸을 움직여 볼까? 다섯 번 점프!');
  for (let i = 0; i < 5; i++) { SFX.boing(); SFX.ding(i); [mongi, fire, captain, nana, somi].forEach((a) => M.hop(a)); await run.speak(words[i], { kind: 'f', pitch: 1.2 }); await wait(250); }
  S.fx('star', 500, 240, 6, { dist: 140, spread: 5 });
  E.Music.start('home'); SFX.jingle();
  await S.mark('sing');
  const sing = setInterval(() => { if (!run.alive) return; S.fx('note', E.rand(200, 800), E.rand(260, 380), 1, { dist: 120, spread: 1 }); }, 450);
  [mongi, fire, captain, nana, somi].forEach((a) => { a.mood('기쁨'); M.sway(a, 2); });
  const lyric = async (t) => { await mongi.say(t, { rate: .9, pitch: 1.25 }); };
  for (let r = 0; r < 2; r++) { await lyric('하나 둘 셋, 셋이 왔어요.'); await lyric('둘이 올라가 다섯이 됐죠!'); }
  clearInterval(sing); [mongi, fire, captain, nana, somi].forEach((a) => a.mood('기본'));
  E.Music.start('story');
  await sayMongi('솜이는 몇 칸 높이에 있었지?'); await S.ask('몇 칸이었을까?', 2400);
  await sayMongi('다섯!'); S.fx('star', 500, 240, 4, { dist: 90 });
  await sayMongi('도움이 필요할 땐?'); await S.ask('어디로 전화할까?', 2400);
  await sayMongi('일, 일, 구!'); S.fx('star', 500, 240, 4, { dist: 90 });

  /* ---- 장면 12: 또 나비다! ---- */
  S.sunset(); E.Music.start('night');
  const fr = S.butterfly([[1050, 80], [800, 180], [600, 120], [420, 220], [330, 300]], 3600);
  await wait(900);
  mongi.mood('놀람'); await sayMongi('앗, 또 나비다!');
  somi.mood('놀람'); await somi.say('이번엔… 안 따라갈래!', { pitch: 1.8 });
  await fr.done;
  const sc = somi.center(), lx = sc.x - 31, ly = sc.y + 62 - 24;       // 솜이 코끝
  fr.el.getAnimations().forEach((a) => a.cancel());
  await fr.el.animate([{ transform: 'translate(330px,300px)' }, { transform: `translate(${lx}px,${ly - 40}px)`, offset: .6 }, { transform: `translate(${lx}px,${ly}px)` }], { duration: 1500, fill: 'forwards', easing: 'ease-in-out' }).finished.catch(() => {});
  fr.el.animate([{ transform: `translate(${lx}px,${ly}px)` }, { transform: `translate(${lx + 3}px,${ly + 2}px)` }, { transform: `translate(${lx}px,${ly}px)` }], { duration: 500, iterations: 4 });
  somi.mood('놀람'); S.fx('heart', sc.x, sc.y + 30, 3, { dist: 80 }); await S.mark('nose'); await wait(1500);
  somi.mood('기쁨'); SFX.tada(); S.fx('confetti', 500, 80, 30, { spread: 3.4, dist: 240, fall: 140, stagger: 15 });
  mongi.mood('기쁨'); await sayMongi('오늘도 정말 잘했어! 내일 또 만나자!');
  await wait(1200);
};
