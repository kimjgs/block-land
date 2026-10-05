/* 블록 대륙 — 화면 흐름, 저장, 보상, 부모 영역 */
(function () {
  const { h, SFX, M } = E;
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'blockland.v1';
  const SCREENS = ['sTitle', 'sSetup', 'sHome', 'sStory', 'sGame', 'sBook', 'sParent', 'sEnd', 'sVillage', 'sLesson', 'sToday', 'sDaily', 'sExplore'];
  const pad2 = (n) => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  /* ---------- 저장 ---------- */
  function defaults() {
    return { setup: false, guide: 'mongi', friendName: '', childName: '', pin: '', minutes: 10, endMode: 'continue', sfx: true, music: true, voice: true,
      stars: 0, giftStars: 0, stickers: [], days: {}, log: {}, diff: { pick: 2 }, recent: { pick: [] }, progress: { countMax: 3 }, mastery: {} };
  }
  function load() { try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return defaults(); } }
  const state = load();
  if (state.daily && state.daily.done && state.daily.done.length && !state.curMigrated) { // 예전 '이야기 20일' 기록을 12주 계획으로 옮김
    state.cur = state.cur || { done: [], last: '' };
    for (let n = 1; n <= state.daily.done.length; n++) if (!state.cur.done.includes(n)) state.cur.done.push(n);
    state.cur.last = state.daily.last || state.cur.last; state.curMigrated = true;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  const day = () => (state.days[dayKey()] = state.days[dayKey()] || { secs: 0, done: { story: false, pick: false, play: false }, opened: false, extra: 0, endShown: false });
  const sync = () => { E.settings.sfx = state.sfx; E.settings.music = state.music; E.settings.voice = state.voice; };
  sync();

  const app = { state, scale: 1, save };
  window.App = app;
  const stage = $('#stage');
  function fit() {
    const k = Math.min(innerWidth / 1280, innerHeight / 720); app.scale = k;
    stage.style.transform = `translate(${-640 * k}px,${-360 * k}px) scale(${k})`;
  }
  addEventListener('resize', fit); fit();
  app.toStage = (e) => { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / app.scale, y: (e.clientY - r.top) / app.scale }; };

  /* ---------- 화면 이동 ---------- */
  let current = null, homeRun = null, storyRun = null;
  function stopAll() { Games.stop(); if (storyRun) { storyRun.stop(); storyRun = null; } if (homeRun) { homeRun.stop(); homeRun = null; } E.cancelSpeech(); }
  app.go = (name, arg) => {
    stopAll();
    const id = { title: 'sTitle', setup: 'sSetup', home: 'sHome', story: 'sStory', game: 'sGame', book: 'sBook', parent: 'sParent', end: 'sEnd', village: 'sVillage', lesson: 'sLesson', today: 'sToday', daily: 'sDaily', explore: 'sExplore' }[name];
    SCREENS.forEach((s) => $('#' + s).classList.toggle('on', s === id)); current = name;
    $('#overlay').innerHTML = '';
    if (name === 'home') { E.Music.start('home'); renderHome(); }
    else if (name === 'setup' || name === 'title') E.Music.start('home');
    else if (name === 'book') renderBook();
    else if (name === 'parent') renderParent();
    else if (name === 'end') { E.Music.start('night'); renderEnd(); }
    else if (name === 'village') { E.Music.start('home'); renderVillage(arg); }
    else if (name === 'lesson') { E.Music.start('home'); renderLesson(arg); }
    else if (name === 'today') { E.Music.start('home'); renderToday(arg); }
    else if (name === 'daily') { E.Music.start('home'); renderDaily(); }
    else if (name === 'explore') { E.Music.start('home'); renderExplore(); }
  };

  /* ---------- 시간 ---------- */
  const limitSecs = () => state.minutes * 60 + (day().extra || 0);
  const timeUp = () => day().secs >= limitSecs();
  setInterval(() => {
    if (document.hidden) return;
    if (current === 'story' || current === 'game') { day().secs++; if (day().secs % 10 === 0) save(); const b = $('.timebar i'); if (b) b.style.width = Math.min(100, (day().secs / limitSecs()) * 100) + '%'; }
  }, 1000);

  /* ---------- 기록, 난이도 ---------- */
  /* ---------- 학습 경험 기록 (아이에게는 보이지 않는 내부 기록) ----------
     목표(goal) = '마을.호.수업'. 한 번 할 때마다 '도움 없이 했나(clean)'만 남긴다. 점수나 벌점은 없다.
     단계: 0 아직 안 함 · 1 처음/도움받아 성공(learning) · 2 스스로 성공(developing) · 3 반복해서 스스로 성공(stable) */
  app.masteryInfo = (goal) => {
    const m = goal && state.mastery && state.mastery[goal]; if (!m || !m.rec.length) return { level: 0, n: 0, lastAssist: 0 };
    const rec = m.rec, last3 = rec.slice(-3), clean = rec.filter((x) => x.a === 0).length;
    const level = rec.length >= 3 && last3.every((x) => x.a === 0) ? 3 : clean >= 1 ? 2 : 1;
    return { level, n: m.n, lastAssist: rec[rec.length - 1].a, clean };
  };
  app.recordGoal = (goal, assist) => {
    if (!goal) return; state.mastery = state.mastery || {};
    const m = (state.mastery[goal] = state.mastery[goal] || { rec: [], n: 0, first: Date.now(), last: 0 });
    m.rec.push({ a: Math.min(assist, 9), t: Date.now() }); if (m.rec.length > 8) m.rec.shift(); m.n++; m.last = Date.now(); save();
  };
  const LEVEL_NAME = ['아직 안 해 봤어요', '처음 해 봤어요', '스스로 해냈어요', '자주 스스로 해요'];
  app.goalLabel = (goal) => { const [v, u, l] = goal.split('.'), V = C.VILLAGES[v], L = V && V.units && V.units[+u] && V.units[+u][+l]; return L ? { village: V.name, unit: +u + 1, title: L.title, hero: L.hero } : { village: '', unit: 0, title: goal }; };
  app.masteryReport = () => Object.keys(state.mastery || {}).map((g) => ({ goal: g, ...app.goalLabel(g), ...app.masteryInfo(g), name: LEVEL_NAME[app.masteryInfo(g).level] }));
  app.record = (id, kind) => { const r = (state.log[id] = state.log[id] || { ok: 0, hint: 0, miss: 0, last: 0 }); r[kind] = (r[kind] || 0) + 1; r.last = Date.now(); save(); };
  app.adapt = (kind, acc) => {
    const arr = (state.recent[kind] = state.recent[kind] || []); arr.push(acc); if (arr.length > 6) arr.shift();
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    if (arr.length >= 3 && avg >= .9 && state.diff[kind] === 2) state.diff[kind] = 3;
    else if (arr.length >= 2 && avg < .6 && state.diff[kind] === 3) state.diff[kind] = 2;
    save();
  };

  /* ---------- 보상 ---------- */
  const unowned = () => C.STICKERS.filter((s) => !state.stickers.includes(s.id));
  function giveSticker() { const pool = unowned(); if (!pool.length) return null; const s = pool[Math.floor(Math.random() * pool.length)]; state.stickers.push(s.id); save(); return s; }
  function rewardScreen({ title, sub, sticker, buttonText = '계속', onClose }) {
    const ov = $('#overlay');
    const box = h('div', { class: 'reward' });
    if (sticker) box.append(h('div', { class: 'gift', html: FR[sticker.id]['기쁨'] || FR[sticker.id]['기본'] }));
    else box.append(h('div', { html: E.FXSVG.star().replace('width="40"', 'width="200"'), style: { animation: 'pop .6s ease-out' } }));
    box.append(h('div', {}, title), sub ? h('div', { style: { fontSize: '30px', fontWeight: 700 } }, sub) : null,
      h('button', { class: 'btn', onclick: () => { box.remove(); onClose && onClose(); } }, buttonText));
    ov.append(box); SFX.open(); const s = h('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none' } }); box.append(s);
    E.fx(s, 'confetti', 640, 200, 40, { spread: 3.6, dist: 320, fall: 200, stagger: 12 });
    E.speak(title.replace(/[!]/g, ''), { kind: 'f', pitch: 1.2 });
  }
  const goBack = () => {
    const r = app.returnTo; app.returnTo = null;
    if (r && r.nextCur) { startCurStep('C', r.screen, false, r.cur && r.cur.n); return; } // 핵심 놀이 뒤에 짧은 복습
    if (r && r.next === 'pick') { app.returnTo = { screen: r.screen }; app.go('game'); Games.pick(app, {}); return; } // 오늘의 놀이: 놀이 뒤에 짧은 듣고 고르기
    if (r && r.screen) app.go(r.screen, r.arg); else app.go('home');
  };
  const afterActivity = () => { if (timeUp() && !day().endShown) { day().endShown = true; save(); app.returnTo = null; app.go('end'); } else goBack(); };
  app.finish = (kind) => {
    const d = day(), r = app.returnTo || {};
    if (r.key) { state.done2 = state.done2 || {}; state.done2[r.key] = true; }
    if (r.daily) { const ds = dailyState(); if (!ds.done.includes(r.daily)) ds.done.push(r.daily); ds.last = dayKey(); kind = 'story'; }
    if (r.goal) app.recordGoal(r.goal, E.assistN);
    { state.hist = state.hist || []; const gl = r.goal ? app.goalLabel(r.goal) : null; state.hist.push({ d: dayKey(), t: Date.now(), type: app.lastType || kind, goal: r.goal || null, hero: gl && gl.hero || null }); if (state.hist.length > 400) state.hist.shift(); }
    if (r.mission) kind = r.mission;
    else if (app.free && app.free.need.length) { kind = app.free.need.shift(); r.cur = { n: app.free.n }; if (!app.free.need.length) app.free = null; } // 12주차 자유 놀이
    const mission = kind; const first = !d.done[mission]; d.done[mission] = true;
    state.stars++; state.giftStars++; save();
    const all = d.done.story && d.done.pick && d.done.play;
    if (r.cur && all) completeCur(r.cur.n);
    const giftNow = state.giftStars >= 5; let sticker = null;
    if (giftNow) { state.giftStars -= 5; sticker = giveSticker(); save(); }
    const sub = giftNow && sticker ? '별 5개를 모아서 스티커를 받았어요!' : `별 ${state.giftStars}/5 · ${first ? '오늘의 미션 완료!' : ''}${all && first ? ' 보물상자가 열렸어요!' : ''}`;
    $('#overlay').innerHTML = '';
    rewardScreen({ title: sticker ? `새 스티커, ${sticker.name}!` : '별을 받았어요!', sub, sticker, buttonText: '좋아요', onClose: afterActivity });
  };

  /* ---------- 제목 ---------- */
  function renderTitle() {
    const sc = $('#sTitle'); sc.innerHTML = '';
    sc.append(h('div', { class: 'bgfill', html: BG.village }));
    E.ambient(sc, 16);
    const gid = state.guide, run = new E.Run();
    const a = new E.Actor(run, sc, FR[gid], 60, 664 - E.feetFrac(gid) * 440, 440, { z: 5 });
    sc.append(h('div', { class: 'abs title', style: { left: '560px', top: '130px', fontSize: '84px' } }, '블록 대륙'),
      h('div', { class: 'abs pill', style: { left: '566px', top: '270px' } }, '숫자·한글·영어 친구들과 놀아요'),
      h('button', { class: 'btn', style: { position: 'absolute', left: '566px', top: '400px', minHeight: '120px', fontSize: '48px', padding: '0 70px' },
        onclick: () => { E.resume(); SFX.jingle(); E.Music.start('home'); app.go(state.setup ? 'home' : 'setup'); if (!state.setup) renderSetup(); } }, '▶ 시작하기'));
    app.go('title');
  }

  /* ---------- 처음 설정: 친구, 이름, 비밀번호 ---------- */
  function renderSetup() {
    const sc = $('#sSetup'); sc.innerHTML = ''; sc.append(h('div', { class: 'bgfill', html: BG.village }));
    const body = h('div', { class: 'abs', style: { inset: 0 } }); sc.append(body);
    step1();
    function step1() {
      body.innerHTML = '';
      body.append(h('div', { class: 'abs title', style: { left: 0, right: 0, top: '30px', textAlign: 'center' } }, '어떤 친구와 놀까?'));
      const sel = h('div', { class: 'sel abs', style: { left: 0, right: 0, top: '150px' } });
      C.GUIDES.forEach((g) => {
        const c = h('div', { class: 'card' + (state.guide === g.id ? ' on' : ''), html: FR[g.id]['기본'] }, h('div', {}, g.name), h('div', { style: { fontSize: '22px', color: '#5a6a7a' } }, g.role));
        c.addEventListener('click', () => { state.guide = g.id; E.resume(); SFX.pop(); E.speak(`안녕! 나는 ${g.name}이야!`, { ...C.VOICE[g.id] }); sel.querySelectorAll('.card').forEach((x) => x.classList.remove('on')); c.classList.add('on'); });
        sel.append(c);
      });
      body.append(sel, h('button', { class: 'btn', style: { position: 'absolute', right: '50px', bottom: '40px' }, onclick: step2 }, '이 친구가 좋아! →'));
    }
    function step2() {
      const g = C.GUIDES.find((x) => x.id === state.guide);
      body.innerHTML = '';
      body.append(h('div', { class: 'abs title', style: { left: 0, right: 0, top: '28px', textAlign: 'center' } }, '친구 이름을 지어 줄까?'),
        h('div', { class: 'abs charbox', style: { left: '60px', top: '150px', height: '480px' }, html: FR[state.guide]['기쁨'] }));
      const right = h('div', { class: 'abs', style: { left: '420px', right: '40px', top: '150px' } });
      const nameIn = h('input', { class: 'input', placeholder: '친구 이름', value: state.friendName || g.names[0], maxlength: 6 });
      const names = h('div', { class: 'names', style: { justifyContent: 'flex-start', flexWrap: 'wrap' } }, g.names.map((n) => h('button', { class: 'chip', onclick: () => { nameIn.value = n; E.speak(n, { ...C.VOICE[state.guide] }); } }, n)));
      const childIn = h('input', { class: 'input', placeholder: '(선택) 아이 이름', value: state.childName, maxlength: 6 });
      right.append(h('p', { style: { fontSize: '30px', margin: '0 0 6px', fontWeight: 800 } }, '이름을 눌러 골라요'), names,
        h('div', { class: 'row2' }, nameIn), h('p', { style: { fontSize: '24px', color: '#5a6a7a', marginTop: '24px' } }, '(부모님) 아이 이름을 쓰면 친구가 이름을 불러 줘요. 이 기기 안에만 저장돼요.'),
        h('div', { class: 'row2' }, childIn, h('button', { class: 'chip', onclick: () => E.speak(`${childIn.value || '친구'}야! 오늘도 놀자!`, { ...C.VOICE[state.guide] }) }, '🔊 들어 보기')));
      body.append(right, h('button', { class: 'btn gray', style: { position: 'absolute', left: '40px', bottom: '40px' }, onclick: step1 }, '← 뒤로'),
        h('button', { class: 'btn', style: { position: 'absolute', right: '50px', bottom: '40px' }, onclick: () => { state.friendName = nameIn.value.trim() || g.names[0]; state.childName = childIn.value.trim(); save(); step3(); } }, '다음 →'));
    }
    function step3() {
      body.innerHTML = '';
      body.append(h('div', { class: 'abs title', style: { left: 0, right: 0, top: '30px', textAlign: 'center' } }, '부모님 비밀번호 만들기'));
      let first = null;
      const wrap = h('div', { class: 'abs', style: { left: 0, right: 0, top: '130px' } });
      const label = h('p', { style: { textAlign: 'center', fontSize: '30px', fontWeight: 800, margin: '0 0 6px' } }, '숫자 4개를 눌러 주세요');
      const pin = pinPad((code, api) => {
        if (!first) { first = code; label.textContent = '한 번 더 눌러 주세요'; api.clear(); }
        else if (first === code) { state.pin = code; state.setup = true; save(); SFX.tada(); app.go('home'); }
        else { first = null; label.textContent = '달라요. 처음부터 다시 눌러 주세요'; api.shake(); }
      });
      wrap.append(label, pin); body.append(wrap, h('p', { class: 'abs', style: { left: 0, right: 0, bottom: '30px', textAlign: 'center', fontSize: '24px', color: '#44506a' } }, '부모 화면은 홈 왼쪽 위 톱니바퀴를 2초 꾹 누르면 열려요.'));
    }
  }

  /* 숫자 패드 (비밀번호) */
  function pinPad(onFull) {
    const dots = Array.from({ length: 4 }, () => h('i')); let code = '';
    const dotBox = h('div', { class: 'pin' }, dots);
    const api = { clear() { code = ''; dots.forEach((d) => d.classList.remove('on')); }, shake() { dotBox.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-14px)' }, { transform: 'translateX(14px)' }, { transform: 'translateX(0)' }], 300); api.clear(); } };
    const press = (d) => { E.resume(); SFX.tap(); if (code.length >= 4) return; code += d; dots[code.length - 1].classList.add('on'); if (code.length === 4) setTimeout(() => onFull(code, api), 150); };
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '지움', '0', ''];
    const pad = h('div', { class: 'pad' }, keys.map((k) => k === '' ? h('span') : h('button', { onclick: () => { if (k === '지움') { code = code.slice(0, -1); dots.forEach((x, i) => x.classList.toggle('on', i < code.length)); } else press(k); } }, k)));
    return h('div', {}, dotBox, pad);
  }
  function modal(content) { const m = h('div', { class: 'modal' }, h('div', { class: 'box' }, content)); $('#overlay').append(m); return m; }

  /* ---------- 홈: 블록 대륙 지도 ---------- */
  let greeted = false;
  function playKind() { return Math.floor(Date.now() / 86400000) % 2 === 0 ? 'count' : 'combine'; }
  const chestSvg = '<svg viewBox="0 0 150 130" width="150"><rect x="14" y="52" width="122" height="66" rx="12" fill="#B07A4A" stroke="#6E4A26" stroke-width="5"/><path d="M14 66 Q14 20 75 20 Q136 20 136 66Z" fill="#C99560" stroke="#6E4A26" stroke-width="5"/><rect x="14" y="62" width="122" height="12" fill="#FFC21A" stroke="#C99400" stroke-width="3"/><rect x="62" y="56" width="26" height="34" rx="6" fill="#FFD230" stroke="#C99400" stroke-width="4"/><circle cx="75" cy="72" r="5" fill="#6E4A26"/></svg>';
  const chestOpen = '<svg viewBox="0 0 150 130" width="150"><path d="M20 52 L8 8 Q75 -6 142 8 L130 52Z" fill="#C99560" stroke="#6E4A26" stroke-width="5"/><rect x="14" y="52" width="122" height="66" rx="12" fill="#B07A4A" stroke="#6E4A26" stroke-width="5"/><ellipse cx="75" cy="56" rx="50" ry="8" fill="#FFE070"/><polygon points="50,52 58,34 66,52" fill="#FFD230"/><polygon points="80,52 90,28 98,52" fill="#FFB020"/></svg>';
  const WD = '일월화수목금토';
  const voc = (n) => { const c = n.charCodeAt(n.length - 1) - 0xAC00; return c >= 0 && c % 28 !== 0 ? n + '아' : n + '야'; }; // 강윤 → 강윤아, 윤이 → 윤이야
  const dateStr = () => { const n = new Date(); return `${n.getMonth() + 1}월 ${n.getDate()}일 ${WD[n.getDay()]}요일`; };
  const frameOf = (key) => (FR[key] && (FR[key]['기쁨'] || FR[key]['기본'] || FR[key].lit5)) || '';
  const outlined = (cls, text) => h('div', { class: 'otitle ' + cls }, text);
  function cornerButtons(sc, back) {
    if (back) sc.append(h('button', { class: 'pinkbtn', style: { left: '18px', top: '16px' }, onclick: () => { E.resume(); SFX.tap(); back(); } }, '←'));
    sc.append(h('button', { class: 'pinkbtn', style: { right: '18px', top: '16px' }, onclick: () => { E.resume(); SFX.tap(); app.go('home'); } }, '⌂'));
  }
  function gearButton(sc) {
    const gear = h('button', { class: 'gear' }, '⚙'); let gt = null;
    const startHold = () => { gear.classList.add('hold'); gt = setTimeout(() => { gear.classList.remove('hold'); askParent(() => app.go('parent')); }, 2000); };
    const endHold = () => { clearTimeout(gt); gear.classList.remove('hold'); };
    gear.addEventListener('pointerdown', startHold); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => gear.addEventListener(ev, endHold));
    sc.append(gear);
  }
  /* ---------- 새 홈: 친구가 맞이하고, 큰 버튼은 3개 ---------- */
  const HOME_ICON = {
    story: '<svg viewBox="0 0 120 120" width="150" height="150"><defs><linearGradient id="hs1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3A8"/><stop offset="1" stop-color="#FFC233"/></linearGradient></defs><polygon points="60,8 74,42 111,45 83,69 92,106 60,86 28,106 37,69 9,45 46,42" fill="url(#hs1)" stroke="#E09A00" stroke-width="6" stroke-linejoin="round"/><ellipse cx="46" cy="38" rx="9" ry="5" fill="#fff" opacity=".7" transform="rotate(-30 46 38)"/></svg>',
    play: '<svg viewBox="0 0 120 120" width="150" height="150"><rect x="14" y="62" width="44" height="44" rx="12" fill="#F2625A" stroke="#B83A34" stroke-width="5"/><rect x="62" y="62" width="44" height="44" rx="12" fill="#FFD84F" stroke="#C99A00" stroke-width="5"/><rect x="38" y="16" width="44" height="44" rx="12" fill="#5AB4FF" stroke="#2E7FCC" stroke-width="5"/><rect x="20" y="68" width="14" height="6" rx="3" fill="#fff" opacity=".6"/><rect x="68" y="68" width="14" height="6" rx="3" fill="#fff" opacity=".6"/><rect x="44" y="22" width="14" height="6" rx="3" fill="#fff" opacity=".6"/></svg>',
    gift: '<svg viewBox="0 0 120 120" width="150" height="150"><rect x="16" y="50" width="88" height="58" rx="10" fill="#FF7FA6" stroke="#C94A78" stroke-width="5"/><rect x="10" y="36" width="100" height="24" rx="9" fill="#FF9BBB" stroke="#C94A78" stroke-width="5"/><rect x="52" y="36" width="16" height="72" fill="#FFE36B" stroke="#C99A00" stroke-width="3"/><path d="M60 36 C40 8 14 20 34 36 Z M60 36 C80 8 106 20 86 36 Z" fill="#FFE36B" stroke="#C99A00" stroke-width="4" stroke-linejoin="round"/></svg>',
    map: '<svg viewBox="0 0 48 48" width="40" height="40"><circle cx="24" cy="24" r="20" fill="#fff" stroke="#4A6FD0" stroke-width="4"/><polygon points="24,9 29,24 24,39 19,24" fill="#F2625A"/><polygon points="24,39 29,24 24,24 19,24" fill="#4A6FD0" opacity=".75"/><circle cx="24" cy="24" r="3" fill="#fff"/></svg>',
  };
  function renderHome() {
    const sc = $('#sHome'); sc.innerHTML = '';
    const d = day(), ds = dailyState(), playedStory = ds.last === dayKey(), storyDone = !!d.done.story, playDone = !!(d.done.play && d.done.pick), all = storyDone && playDone;
    sc.append(h('div', { class: 'bgfill', html: BG.village })); E.ambient(sc, 14);
    sc.append(outlined('hlogo', '블록대륙'));
    // 친구가 맞이해요
    const run = new E.Run(); homeRun = run; const gid = state.guide;
    const hh = 430, m = E.meta(gid) || { w: 400, h: 330 }, wpx = m.w / m.h * hh;
    const a = new E.Actor(run, sc, FR[gid], 215 - wpx / 2, 706 - E.feetFrac(gid) * hh, hh, { voice: C.VOICE[gid], z: 6, onclick: () => { E.resume(); SFX.pop(); M.bounce(a, 1); a.wave(4); } });
    const bubble = h('div', { class: 'speech hbubble' }); run.cap = bubble; sc.append(bubble);
    const msg = state.childName ? `${voc(state.childName)}, 오늘도 같이 놀까?` : '오늘도 같이 놀까?';
    bubble.textContent = msg;
    if (!greeted) { greeted = true; setTimeout(async () => { try { a.wave(4); await a.say(msg); } catch (e) {} bubble.textContent = msg; bubble.style.display = 'block'; }, 500); }
    // 큰 버튼 3개
    const card = (cls, label, sub, ico, onclick, extra) => h('button', { class: 'hcard ' + cls, onclick: () => { E.resume(); SFX.pop(); onclick(); } }, h('div', { class: 'hic', html: ico }), outlined('hl', label), h('div', { class: 'hs' }, sub), extra);
    const check = (on) => (on ? h('div', { class: 'hbadge' }, '✓') : null);
    const ct = curToday(), lb = C.curLabel(ct.day);
    const cards = h('div', { class: 'hcards' },
      card('c-story' + (storyDone ? ' done' : ''), '오늘의 이야기', ct.replay ? '또 보기' : `${ct.day.week}주 ${ct.day.day}일`, HOME_ICON.story, () => startCurStep('A', 'home'), check(storyDone)),
      card('c-play' + (playDone ? ' done' : ''), '오늘의 놀이', lb.B ? lb.B.name : '놀이', HOME_ICON.play, () => startCurStep('B', 'home'), check(playDone)),
      card('c-gift' + (all && !d.opened ? ' ready' : '') + (d.opened ? ' opened' : ''), '선물 열기', d.opened ? '내일 또!' : all ? '열어 보자!' : '둘 다 하면 열려요', HOME_ICON.gift, () => openChest(all),
        h('div', { class: 'hdots' }, h('i', { class: storyDone ? 'on' : '' }), h('i', { class: playDone ? 'on' : '' }))));
    sc.append(cards);
    // 탐험 + 별
    sc.append(h('div', { class: 'hbottom' }, h('button', { class: 'hexplore', onclick: () => { E.resume(); SFX.pop(); app.go('explore'); } }, h('span', { html: HOME_ICON.map }), '블록대륙 탐험하기')));
    sc.append(h('div', { class: 'pill hstars' }, h('span', { html: E.FXSVG.star() }), `${state.stars}`));
    gearButton(sc);
    sc.append(h('div', { class: 'timebar', title: '오늘 놀이 시간' }, h('i', { style: { width: Math.min(100, (d.secs / limitSecs()) * 100) + '%' } })));
  }

  function renderExplore() {
    const sc = $('#sExplore'); sc.innerHTML = '';
    const d = day();
    sc.append(h('div', { class: 'bgfill', html: BG.map || BG.village })); E.ambient(sc, 12);
    if (BG.map && window.MAP_HOT) {
      window.MAP_HOT.forEach((v) => {
        const go = () => { E.resume(); SFX.pop(); openVillage(v.id); };
        sc.append(h('button', { class: 'hot', style: { left: v.x - 100 + 'px', top: v.y - 95 + 'px' }, 'aria-label': v.name, onclick: go }),
          h('div', { class: 'vlabel' + (v.id === 'soon' ? ' soon' : ''), style: { left: v.lx + 'px', top: v.ly + 'px' }, onclick: go }, v.name));
      });
    } else {
      const grid = h('div', { class: 'vgrid' });
      ['number', 'hangul', 'story', 'english', 'science', 'play'].forEach((id) => grid.append(h('button', { class: 'btn sky', onclick: () => { E.resume(); openVillage(id); } }, C.VILLAGES[id].name)));
      sc.append(grid);
    }
    sc.append(h('div', { class: 'rightcol' },
      h('div', { class: 'datechip' }, dateStr()),
      h('button', { class: 'todaybtn', onclick: () => { E.resume(); SFX.pop(); app.go('today'); } }, h('div', { class: 'tb-img', html: frameOf(state.guide) }), h('div', { class: 'tb-t' }, '오늘의', h('br'), '학습')),
      h('div', { class: 'row2', style: { gap: '12px', justifyContent: 'center' } },
        h('button', { class: 'minibtn sky', onclick: () => { E.resume(); SFX.pop(); app.go('daily'); } }, h('b', {}, '계획'), h('small', {}, '12주')),
        h('button', { class: 'minibtn sun', onclick: () => { E.resume(); SFX.pop(); app.go('book'); } }, h('b', {}, '스티커'), h('small', {}, `${state.stickers.length}/${C.STICKERS.length}`)))));
    const all = d.done.story && d.done.pick && d.done.play;
    const chest = h('div', { class: 'chest' + (all && !d.opened ? ' glow' : ''), html: d.opened ? chestOpen : chestSvg, style: { cursor: 'pointer' } });
    chest.addEventListener('click', () => { E.resume(); openChest(all); });
    sc.append(h('div', { class: 'homebar' }, h('div', { class: 'pill' }, h('span', { html: E.FXSVG.star() }), `${state.stars}`), chest));
    if (app.free && app.free.need.length) sc.append(h('div', { class: 'freebar' }, `오늘은 가고 싶은 곳을 직접 골라요! (${app.free.need.length}가지 남았어요)`));
    gearButton(sc);
    sc.append(h('button', { class: 'pinkbtn', style: { left: '18px', top: '96px' }, onclick: () => { E.resume(); SFX.tap(); app.go('home'); } }, '←'));
    sc.append(h('div', { class: 'timebar', title: '오늘 놀이 시간' }, h('i', { style: { width: Math.min(100, (d.secs / limitSecs()) * 100) + '%' } })));
  }
  window.onMapReady = () => { if (current === 'explore') renderExplore(); };
  function openVillage(id) {
    app.go('village', id);
  }
  function openChest(all) {
    const d = day();
    if (d.opened) return toast('보물상자는 내일 또 열려요!');
    if (!all) return toast('오늘의 학습 3개를 하면 열려요!');
    d.opened = true; const s = giveSticker(); save();
    $('#overlay').innerHTML = '';
    rewardScreen({ title: s ? `보물상자 속에는… ${s.name} 스티커!` : '스티커를 모두 모았어요!', sub: '스티커북에 붙였어요', sticker: s, buttonText: '좋아요', onClose: () => app.go(current === 'explore' ? 'explore' : 'home') });
  }
  function toast(t) { const el = h('div', { class: 'toast' }, t); $('#overlay').append(el); SFX.oops(); E.speak(t, { kind: 'f', pitch: 1.2 }); setTimeout(() => el.remove(), 2600); }

  /* ---------- 활동 시작 (어디서 왔는지 기억했다가 끝나면 돌아가요) ---------- */
  function launch(type, opt = {}, ret = null) {
    app.returnTo = ret; E.assistN = 0; app.lastType = type;
    if (type === 'story') playStory(C.STORIES.find((s) => s.id === opt.story) || C.STORIES[0]);
    else if (type === 'pick') { app.go('game'); Games.pick(app, opt); }
    else if (type === 'count') { app.go('game'); Games.count(app, opt); }
    else if (Games2[type]) { app.go('game'); Games2[type](app, opt); }
    else if (type === 'combine') { app.go('game'); Games.combine(app); }
    else if (type === 'daily') { app.returnTo = null; app.go('daily'); }
    else if (type === 'book') { app.returnTo = null; app.go('book'); }
    else { app.returnTo = null; toast('준비 중이에요! 곧 만나요.'); }
  }
  function start(id) { // 오늘의 학습 3개
    if (id === 'story') startDaily(dailyToday().n);
    else if (id === 'pick') launch('pick', {}, { screen: 'today' });
    else launch(playKind(), {}, { screen: 'today' });
  }

  /* ---------- 마을 ---------- */
  const unitOf = {};
  function renderVillage(id) {
    const v = C.VILLAGES[id], sc = $('#sVillage'); sc.innerHTML = ''; sc.style.background = v.bg;
    E.ambient(sc, 10, '#FFFFFF');
    sc.append(outlined('vhead', v.name)); cornerButtons(sc, () => app.go('explore'));
    const tabs = h('div', { class: 'tabs' });
    const units = v.units || [v.lessons], cur = Math.min(unitOf[id] || 0, units.length - 1);
    for (let i = 1; i <= 12; i++) tabs.append(h('button', { class: 'tab' + (i - 1 === cur ? ' on' : ''), onclick: () => { if (!units[i - 1]) return toast(`${i}호는 다음에 열려요!`); E.resume(); SFX.pop(); unitOf[id] = i - 1; renderVillage(id); } }, `${i}호`));
    sc.append(tabs);
    const row = h('div', { class: 'lrow' });
    (units[cur] || v.lessons).forEach((L, i) => {
      const locked = !L.acts;
      const card = h('div', { class: 'lcard' + (locked ? ' locked' : '') }, h('div', { class: 'lc-top', style: { background: L.color }, html: frameOf(L.hero) }), h('div', { class: 'lc-name' }, L.title), locked ? h('div', { class: 'lock' }, '곧 열려요') : h('div', { class: 'lnum' }, `수업 ${i + 1}`));
      card.addEventListener('click', () => { E.resume(); SFX.pop(); if (locked) return toast('곧 열려요! 조금만 기다려 줘.'); app.go('lesson', { village: id, lesson: i, unit: cur }); });
      row.append(card);
    });
    sc.append(row);
    E.speak(v.hello, { ...(C.VOICE[v.guide] || {}) });
  }

  /* ---------- 수업 ---------- */
  function renderLesson(ctx) {
    const v = C.VILLAGES[ctx.village], unit = ctx.unit || 0, L = ((v.units && v.units[unit]) || v.lessons)[ctx.lesson], sc = $('#sLesson'); sc.innerHTML = ''; sc.style.background = v.bg;
    E.ambient(sc, 14, '#FFFFFF');
    cornerButtons(sc, () => app.go('village', ctx.village));
    sc.append(outlined('ltitle', L.title), h('div', { class: 'chip1' }, `${v.name} · ${unit + 1}호 · 수업 ${ctx.lesson + 1}`));
    const heroEl = h('div', { class: 'hero', html: frameOf(L.hero) });
    sc.append(h('div', { class: 'herobox' }, h('div', { class: 'ring' }), h('div', { class: 'ring r2' }), heroEl));
    setTimeout(() => E.waveEl(heroEl, L.hero), 400); // 주인공이 손 흔들며 맞이
    const row = h('div', { class: 'arow' }), done = state.done2 || {};
    L.acts.forEach((A) => {
      const key = `${ctx.village}.${unit ? 'u' + unit + '.' : ''}${ctx.lesson}.${A.id}`, soon = A.type === 'soon';
      const card = h('button', { class: 'acard' + (soon ? ' soon' : ''), style: { background: `linear-gradient(${A.color}, ${A.color}dd)` } },
        h('div', { class: 'ai' }, A.icon), h('div', { class: 'an' }, A.name), done[key] ? h('div', { class: 'badge' }, '✓') : null, soon ? h('div', { class: 'soontag' }, '준비 중') : null);
      card.addEventListener('click', () => { E.resume(); SFX.pop(); launch(A.type, A.opt || {}, { screen: 'lesson', arg: ctx, key, goal: `${ctx.village}.${unit}.${ctx.lesson}` }); });
      row.append(card);
    });
    sc.append(row);
    E.speak(L.say || L.title, { ...(C.VOICE[v.guide] || {}) });
  }

  /* ---------- 오늘의 학습 ---------- */
  function renderToday(nArg) {
    const sc = $('#sToday'); sc.innerHTML = ''; const d = day(), ct = curToday(), n = nArg || ct.n;
    E.ambient(sc, 12, '#FFFFFF');
    cornerButtons(sc, () => app.go(nArg ? 'daily' : 'explore'));
    const dy = C.CUR.days[n - 1], lb = C.curLabel(dy);
    sc.append(h('div', { class: 'datechip big' }, `${dy.week}주 ${dy.day}일 · ${dy.kind}`), outlined('ttitle', dy.theme));
    const TAG = { story: '이야기', pages: '그림책', song: '노래' };
    const heroOf = (st, fb) => (st && st.hero) || fb;
    const cards = [
      { id: 'story', part: 'A', tag: '시작 · ' + (TAG[lb.A && lb.A.type] || '이야기'), head: '#FFD9A8', st: lb.A, hero: dy.character },
      { id: 'play', part: 'B', tag: '핵심 놀이', head: '#F3D3F8', st: lb.B, hero: 'n3' },
      { id: 'pick', part: 'C', tag: '짧은 복습', head: '#CFE2FF', st: lb.C, hero: 'fire' },
    ];
    const row = h('div', { class: 'trow' });
    cards.forEach((c) => {
      const el = h('div', { class: 'tcard' + (d.done[c.id] ? ' done' : '') },
        h('div', { class: 'tc-head', style: { background: c.head } }, h('small', {}, c.tag), h('b', {}, c.st ? c.st.name : '준비 중')),
        h('div', { class: 'tc-body' }, h('div', { class: 'tc-img', html: frameOf(heroOf(c.st, c.hero)) }), h('div', { class: 'tc-sub' }, ({ number: '숫자', hangul: '한글', english: '영어', review: '탐구 · 복습' })[dy.core.split('_')[0]] || '놀이')),
        d.done[c.id] ? h('div', { class: 'tc-done' }, '✓ 했어요') : null);
      el.addEventListener('click', () => { E.resume(); SFX.pop(); startCurStep(c.part, 'today', false, n); });
      row.append(el);
    });
    sc.append(row);
    E.speak('오늘의 학습을 시작해요! 무엇부터 해 볼까?', { ...C.VOICE[state.guide] });
  }

  /* ---------- 이야기 20일 ---------- */
  /* ---------- 12주 계획표: 오늘은 몇 번째 날인지, 오늘의 3단계 ---------- */
  const curState = () => (state.cur = state.cur || { done: [], last: '' });
  function curToday() {
    const c = curState(), total = C.CUR.days.length; let n = c.done.length + (c.last === dayKey() ? 0 : 1); n = Math.max(1, Math.min(total, n));
    return { n, day: C.CUR.days[n - 1], replay: c.last === dayKey() || c.done.includes(n) };
  }
  function completeCur(n) { const c = curState(); if (!c.done.includes(n)) c.done.push(n); c.last = dayKey(); save(); }
  function startCurStep(part, back = 'home', chain = true, nOverride) {
    const ct = curToday(), n = nOverride || ct.n, dy = C.CUR.days[n - 1], st = C.curStep(dy.plan[part]);
    if (!st) return toast('준비 중이에요! 곧 만나요.');
    if (st.type === 'free') { // 12주차: 아이가 가고 싶은 곳을 고른다 (두 가지를 하면 오늘이 끝나요)
      const d = day(), need = ['play', 'pick'].filter((m) => !d.done[m]);
      if (!need.length) return toast('오늘은 다 했어요!');
      app.free = { n, need }; app.returnTo = null; app.go('explore'); toast(`가고 싶은 곳을 골라 봐! (${need.length}가지)`); return;
    }
    app.free = null;
    const ret = { screen: back, mission: { A: 'story', B: 'play', C: 'pick' }[part], cur: { n }, goal: st.ref ? st.ref.slice(0, 3).join('.') : null };
    if (part === 'B' && chain && C.curStep(dy.plan.C).type !== 'free') ret.nextCur = true;
    launch(st.type, st.opt, ret);
  }
  const dailyState = () => (state.daily = state.daily || { done: [], last: '' });
  function dailyToday() { const ds = dailyState(); let n = ds.done.length + (ds.last === dayKey() ? 0 : 1); n = Math.max(1, Math.min(20, n)); return { n, ...C.DAILY[n - 1] }; }
  function startDaily(n, replay, back) { const it = C.DAILY[n - 1]; launch(it.type, it.opt || {}, { screen: back || 'daily', daily: replay ? null : n }); }
  let planWeek = null;
  function renderDaily() { // 12주 계획: 주를 고르고, 그 주의 5일을 본다
    const sc = $('#sDaily'); sc.innerHTML = ''; const c = curState(), ct = curToday(), todayN = ct.replay ? 0 : ct.n;
    E.ambient(sc, 10, '#FFFFFF'); cornerButtons(sc, () => app.go('explore'));
    if (planWeek == null) planWeek = ct.day.week;
    sc.append(outlined('dtitle', '12주 계획'));
    const tabs = h('div', { class: 'pweeks' });
    for (let w = 1; w <= 12; w++) {
      const doneAll = [1, 2, 3, 4, 5].every((k) => c.done.includes((w - 1) * 5 + k));
      tabs.append(h('button', { class: 'pw' + (w === planWeek ? ' on' : '') + (doneAll ? ' fin' : ''), onclick: () => { E.resume(); SFX.tap(); planWeek = w; renderDaily(); } }, `${w}주`));
    }
    sc.append(tabs);
    const wk = C.CUR.weeks[planWeek - 1];
    sc.append(h('div', { class: 'pinfo' }, h('b', {}, `${planWeek}주 · ${wk.theme}`), h('small', {}, wk.goal)));
    const row = h('div', { class: 'pdays' });
    for (let k = 1; k <= 5; k++) {
      const n = (planWeek - 1) * 5 + k, dy = C.CUR.days[n - 1], done = c.done.includes(n), isToday = n === todayN, open = done || isToday, lb = C.curLabel(dy);
      const st = (x) => (x ? `${x.icon} ${x.name}` : '');
      const el = h('button', { class: 'pday' + (done ? ' done' : '') + (isToday ? ' today' : '') + (open ? '' : ' locked') },
        h('small', {}, `${k}일 · ${dy.kind}`), h('b', {}, done ? '✓' : isToday ? '오늘' : '🔒'),
        h('div', { class: 'psteps' }, h('i', {}, st(lb.A)), h('i', {}, st(lb.B)), h('i', {}, st(lb.C))));
      el.addEventListener('click', () => { E.resume(); SFX.pop(); if (open) return app.go('today', n); toast(n === c.done.length + 2 && ct.replay ? '내일 또 열려요!' : '하루에 하나씩 열려요!'); });
      row.append(el);
    }
    sc.append(row);
    E.speak(ct.replay ? '오늘은 다 했어! 내일 또 만나자.' : `오늘은 ${ct.day.week}주 ${ct.day.day}일이야! 같이 해 볼까?`, { ...C.VOICE[state.guide] });
  }

  /* ---------- 이야기 재생 ---------- */
  async function playStory(def) {
    app.go('story'); const sc = $('#sStory'); sc.innerHTML = '';
    const world = h('div', { class: 'world', html: def.bg ? BG[def.bg] : '' }); sc.append(world);
    const bgEl = world.querySelector('svg,img'); if (bgEl) Object.assign(bgEl.style, { position: 'absolute', left: 0, top: 0, width: '1000px', height: '560px' });
    world.style.transform = 'scale(1.28)';
    const cap = h('div', { class: 'caption' }); sc.append(cap);
    sc.append(h('div', { class: 'top' }, h('button', { class: 'pinkbtn', style: { position: 'relative' }, onclick: () => goBack() }, '←')));
    const run = new E.Run(); run.cap = cap; storyRun = run;
    const S = StoryKit(world, cap, run);
    try { await (window[def.fn] || Story1)(S); app.finish('story'); } catch (e) { if (e !== E.ABORT) { console.error(e); throw e; } }
  }

  /* ---------- 스티커북 ---------- */
  function renderBook() {
    const sc = $('#sBook'); sc.innerHTML = '';
    const page = h('div', { class: 'page' });
    page.append(h('div', { class: 'title', style: { marginBottom: '16px' } }, `스티커북 ${state.stickers.length}/${C.STICKERS.length}`));
    const grid = h('div', { class: 'sgrid' });
    C.STICKERS.forEach((s) => {
      const own = state.stickers.includes(s.id);
      const el = h('div', { class: 'sticker' + (own ? '' : ' off'), html: (FR[s.id]['기쁨'] || FR[s.id]['기본']) }, h('div', { class: 'nm' }, own ? s.name : '?'));
      if (own) el.addEventListener('click', () => { E.resume(); SFX.pop(); M.squash({ anim: (kf, ms) => el.animate(kf, { duration: ms }).finished.catch(() => {}) }); E.speak(s.name, { ...(C.VOICE[s.id] || C.VOICE.mongi) }); });
      grid.append(el);
    });
    page.append(grid); sc.append(page, h('div', { style: { position: 'absolute', left: '20px', top: '16px', zIndex: 5 } }, h('button', { class: 'btn round gray', onclick: () => app.go('home') }, '←')));
  }

  /* ---------- 마무리 ---------- */
  function renderEnd() {
    const sc = $('#sEnd'); sc.innerHTML = ''; sc.append(h('div', { class: 'bgfill', html: BG.night }));
    const d = day(), run = new E.Run(); homeRun = run;
    const speech = h('div', { class: 'speech', style: { left: '420px', top: '120px', maxWidth: '700px', fontSize: '38px' } }); sc.append(speech); run.cap = speech;
    const gid = state.guide, a = new E.Actor(run, sc, FR[gid], 40, 672 - E.feetFrac(gid) * 470, 470, { voice: C.VOICE[gid] });
    const did = [d.done.story && '이야기', d.done.pick && '친구 찾기', d.done.play && '놀이'].filter(Boolean);
    const msg = `오늘 정말 재미있었다!${did.length ? ` 오늘은 ${did.join(', ')}를 같이 했네!` : ''} 내일 또 만나자!`;
    speech.textContent = msg; sc.append(h('button', { class: 'gear' }, '⚙'));
    const btns = h('div', { class: 'abs row2', style: { left: '420px', top: '430px', gap: '24px' } }, h('div', { class: 'pill', style: { fontSize: '40px' } }, '내일 또 만나자! 👋'));
    if (state.endMode === 'continue') btns.append(h('button', { class: 'btn sun', onclick: () => { d.extra = (d.extra || 0) + 5 * 60; d.endShown = false; save(); app.go('home'); } }, '조금 더 놀기'));
    sc.append(btns);
    setTimeout(async () => { try { a.mood('기쁨'); M.bounce(a, 2); await a.say(msg); } catch (e) {} speech.textContent = msg; speech.style.display = 'block'; }, 500);
    const g = $('#sEnd .gear'); let gt = null;
    g.addEventListener('pointerdown', () => { gt = setTimeout(() => askParent(() => app.go('parent')), 2000); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => g.addEventListener(ev, () => clearTimeout(gt)));
  }

  /* ---------- 부모 영역 ---------- */
  function askParent(onOk) {
    const label = h('h2', {}, '부모님 비밀번호'); const m = modal(label);
    const pin = pinPad((code, api) => { if (code === state.pin) { m.remove(); SFX.pop(); onOk(); } else { api.shake(); label.textContent = '다시 눌러 주세요'; } });
    m.firstChild.append(pin, h('div', { style: { marginTop: '14px' } }, h('button', { class: 'btn gray', onclick: () => m.remove() }, '닫기')));
  }
  function streak() {
    let n = 0; const d = new Date(); if (!(state.days[dayKey(d)] && state.days[dayKey(d)].secs > 0)) d.setDate(d.getDate() - 1);
    while (state.days[dayKey(d)] && state.days[dayKey(d)].secs > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function mastery(id) { const r = state.log[id]; if (!r) return null; if (r.ok >= 2 && r.miss + r.hint <= r.ok) return '✓'; if (r.miss + r.hint > 0) return '△'; return '○'; }
  function renderParent() {
    const sc = $('#sParent'); sc.innerHTML = '';
    const page = h('div', { class: 'page' }); const d = day();
    const seg = (opts, cur, set) => h('div', { class: 'seg' }, opts.map(([label, val]) => h('button', { class: cur === val ? 'on' : '', onclick: (e) => { set(val); save(); sync(); e.target.parentElement.querySelectorAll('button').forEach((b) => b.classList.remove('on')); e.target.classList.add('on'); } }, label)));
    page.append(h('div', { class: 'title', style: { marginBottom: '14px' } }, '부모님 화면'));
    const mins = Math.floor(d.secs / 60);
    page.append(h('div', { class: 'panel' }, h('h3', {}, '오늘'),
      h('p', {}, `오늘 ${mins}분 놀았어요. (설정 ${state.minutes}분)`), h('p', {}, `연속 ${streak()}일째 놀고 있어요 · 별 ${state.stars}개 · 스티커 ${state.stickers.length}개`),
      h('p', {}, `오늘의 학습: ${curToday().day.week}주 ${curToday().day.day}일 · ${curToday().day.theme} — ${curToday().day.goal}`),
      h('p', {}, `오늘의 미션: 이야기 ${d.done.story ? '✓' : '○'} · 듣고 고르기 ${d.done.pick ? '✓' : '○'} · 놀이 ${d.done.play ? '✓' : '○'}`)));
    /* ----- 이번 주 · 요즘 익숙해진 것 · 다시 해 보면 좋은 것 (쉬운 문장으로, 정답률은 앞세우지 않아요) ----- */
    const TYPEKO = { story: '이야기', count: '칸 세기', pick: '듣고 고르기', combine: '합치기', choose: '그림 고르기', pop: '풍선 터뜨리기', match: '짝 맞추기', feed: '먹이 주기', sort: '나누기', trace: '따라 쓰기', pages: '그림책', song: '노래', syllable: '글자 합치기', order: '차례대로 누르기', feel: '마음 친구' };
    const week = new Date(Date.now() - 6 * 86400000), wkKey = dayKey(week), hist = (state.hist || []).filter((x) => x.d >= wkKey);
    const tally = (arr) => arr.reduce((m, k) => (k ? ((m[k] = (m[k] || 0) + 1), m) : m), {}), top = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
    const playedDays = new Set(hist.map((x) => x.d)).size, topType = top(tally(hist.map((x) => x.type)), 2), topGoal = top(tally(hist.map((x) => x.goal)), 2), topHero = top(tally(hist.map((x) => x.hero)), 1);
    const heroName = (id) => { const st = C.STICKERS.find((x) => x.id === id); return st ? st.name : id; };
    const lines = [];
    lines.push(playedDays ? `이번 주에는 ${playedDays}일 놀았어요.` : '이번 주 기록이 아직 없어요. 오늘 같이 시작해 보세요!');
    if (topType.length) lines.push(`가장 많이 한 놀이는 "${TYPEKO[topType[0][0]] || topType[0][0]}"${topType[0][1] > 1 ? ` (${topType[0][1]}번)` : ''}이에요.`);
    topGoal.forEach(([g]) => { const L = app.goalLabel(g); lines.push(`이번 주에 많이 한 수업 — "${L.title}"`); });
    if (topHero.length) lines.push(`이번 주에 가장 많이 만난 친구 — ${heroName(topHero[0][0])}`);
    const rep2 = app.masteryReport(), recentGood = rep2.filter((x) => x.level >= 2).sort((a, b) => state.mastery[b.goal].last - state.mastery[a.goal].last).slice(0, 3);
    const again = rep2.filter((x) => x.level === 1 || (x.level >= 2 && Date.now() - state.mastery[x.goal].last > 7 * 86400000)).sort((a, b) => state.mastery[a.goal].last - state.mastery[b.goal].last).slice(0, 3);
    const subj = (v, nm) => { const us = C.VILLAGES[v].units || [C.VILLAGES[v].lessons], total = us.reduce((n, u) => n + u.length, 0), got = rep2.filter((x) => x.goal.startsWith(v + '.') && x.level >= 2).length; return `${nm}: ${total}개 수업 중 ${got}개를 스스로 해냈어요`; };
    const ctp = curToday();
    page.append(h('div', { class: 'panel' }, h('h3', {}, '이번 주'), lines.map((t) => h('p', {}, t))));
    page.append(h('div', { class: 'panel' }, h('h3', {}, '요즘 익숙해진 것'),
      recentGood.length ? recentGood.map((x) => h('p', {}, `"${x.title}" — 스스로 잘하고 있어요.`)) : h('p', {}, '아직 기록이 쌓이는 중이에요. 천천히 하면 돼요.'),
      h('h3', { style: { marginTop: '14px' } }, '다시 경험하면 좋은 것'),
      again.length ? again.map((x) => h('p', {}, `"${x.title}" — 한 번 더 같이 해 보면 좋아요.`)) : h('p', {}, '지금은 특별히 다시 해야 할 것이 없어요.')));
    page.append(h('div', { class: 'panel' }, h('h3', {}, '12주 계획'), h('p', {}, `${curState().done.length}일 / ${C.CUR.days.length}일을 마쳤어요. 오늘은 ${ctp.day.week}주 ${ctp.day.day}일이에요.`),
      h('p', {}, subj('number', '숫자 마을')), h('p', {}, subj('hangul', '글자 마을')), h('p', {}, subj('english', '영어 마을')), h('p', {}, subj('science', '과학 연구소')),
      h('p', { style: { fontSize: '20px', color: '#6b7794' } }, '수업 난이도는 아이에 맞춰 알아서 조절돼요. 도움을 받아도 괜찮아요. 점수는 매기지 않아요.')));
    page.append(h('div', { class: 'panel' }, h('h3', {}, '같이 볼 때 물어봐 주세요'), [`오늘 '${ctp.day.theme}'에서 뭐가 제일 재미있었어?`, ...C.ASK].map((q) => h('p', {}, '• ' + q))));
    // 설정
    page.append(h('div', { class: 'panel' }, h('h3', {}, '설정'),
      h('p', {}, '하루 놀이 시간'), seg([['5분', 5], ['10분', 10], ['15분', 15]], state.minutes, (v) => (state.minutes = v)),
      h('p', {}, '시간이 끝나면'), seg([['내일 또 만나자(종료)', 'lock'], ['조금 더 놀기 허용', 'continue']], state.endMode, (v) => (state.endMode = v)),
      h('p', {}, '효과음'), seg([['켜기', true], ['끄기', false]], state.sfx, (v) => (state.sfx = v)),
      h('p', {}, '배경 음악'), seg([['켜기', true], ['끄기', false]], state.music, (v) => (state.music = v)),
      h('p', {}, '목소리'), seg([['켜기', true], ['끄기', false]], state.voice, (v) => (state.voice = v)),
      h('p', {}, `아이가 쓰는 친구: ${C.GUIDES.find((g) => g.id === state.guide).name} (${state.friendName})`),
      h('div', { class: 'row2' }, h('button', { class: 'chip', onclick: () => { state.setup = false; save(); app.go('setup'); renderSetup(); } }, '친구·이름 바꾸기'),
        h('button', { class: 'chip', onclick: () => changePin() }, '비밀번호 바꾸기'),
        h('button', { class: 'chip', style: { background: '#ffd9d4' }, onclick: () => resetAll() }, '기록 지우기'))));
    const info = E.voiceInfo();
    page.append(h('div', { class: 'panel' }, h('h3', {}, '기기 정보'), h('p', {}, info ? `지금 목소리: ${info}` : '이 기기에는 한국어 목소리가 없어요. 설정 → 시스템 → 언어 → 텍스트 음성 변환에서 한국어 음성을 받아 주세요.'),
      h('p', {}, '앱처럼 쓰려면 크롬 오른쪽 위 ⋮ 메뉴 → "홈 화면에 추가"를 눌러 주세요.')));
    sc.append(page, h('div', { style: { position: 'absolute', left: '20px', top: '16px', zIndex: 5 } }, h('button', { class: 'btn round gray', onclick: () => app.go('home') }, '←')));
  }
  function changePin() {
    let first = null; const label = h('h2', {}, '새 비밀번호 4자리'); const m = modal(label);
    m.firstChild.append(pinPad((code, api) => { if (!first) { first = code; label.textContent = '한 번 더'; api.clear(); } else if (first === code) { state.pin = code; save(); m.remove(); toast('비밀번호를 바꿨어요'); } else { first = null; label.textContent = '달라요. 다시 4자리'; api.shake(); } }),
      h('div', { style: { marginTop: '14px' } }, h('button', { class: 'btn gray', onclick: () => m.remove() }, '닫기')));
  }
  function resetAll() {
    const m = modal([h('h2', {}, '모든 기록을 지울까요?'), h('p', { style: { fontSize: '26px' } }, '별, 스티커, 학습 기록이 모두 사라져요. 되돌릴 수 없어요.'),
      h('div', { class: 'row2', style: { justifyContent: 'center', gap: '20px' } }, h('button', { class: 'btn gray', onclick: () => m.remove() }, '아니요'),
        h('button', { class: 'btn', onclick: () => { const keep = { pin: state.pin, setup: true, guide: state.guide, friendName: state.friendName, childName: state.childName, minutes: state.minutes, endMode: state.endMode }; Object.assign(state, defaults(), keep); save(); m.remove(); app.go('parent'); } }, '지우기'))]);
  }

  /* ---------- 시작 ---------- */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  renderTitle();
})();
