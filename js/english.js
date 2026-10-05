/* 영어 교육 재설계 (content.js 뒤에 불러온다)
   원칙: 듣기 → 따라 말하기(기다려 줌) → 그림과 뜻 연결 → 짧은 표현 → 반복. 시험처럼 만들지 않는다.
   영어는 {중괄호}로 감싸면 영어 목소리로 읽는다. 알파벳 전부를 쓰게 하는 게 아니라 소리에 익숙해지는 것이 목표. */
(function () {
  const H = C._H, A = H.A, em = H.em, tx = H.tx, P = H.P, shuffle = E.shuffle;
  const L = (title, hero, color, say, acts) => ({ title, hero, color, say, acts });
  const R = (say, items, right, hint) => ({ say, items, right, hint });
  const sw = (c, ok) => ({ color: c, ok });

  /* ---------- 데이터 ---------- */
  const LET = { A: ['apple', '사과', '🍎'], B: ['ball', '공', '⚽'], C: ['cat', '고양이', '🐱'], D: ['dog', '강아지', '🐶'], E: ['egg', '달걀', '🥚'], F: ['fish', '물고기', '🐟'], G: ['goat', '염소', '🐐'], H: ['hat', '모자', '🎩'], I: ['ice cream', '아이스크림', '🍦'], J: ['juice', '주스', '🧃'], K: ['kite', '연', '🪁'], L: ['lion', '사자', '🦁'] };
  const ANI = [['cat', '고양이', '🐱'], ['dog', '강아지', '🐶'], ['pig', '돼지', '🐷'], ['cow', '소', '🐮'], ['bear', '곰', '🐻'], ['rabbit', '토끼', '🐰']];
  const CLR = [['red', '빨강', '#F2453D'], ['blue', '파랑', '#3E9BFF'], ['yellow', '노랑', '#FFD230'], ['green', '초록', '#4CC34A'], ['purple', '보라', '#9B4BD6'], ['orange', '주황', '#FF8C2A']];
  const NUM = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'], NUMKO = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
  const ACT = [['jump', '폴짝 뛰어요', '🤸'], ['run', '달려요', '🏃'], ['sit', '앉아요', '🧎'], ['clap', '박수 쳐요', '👏']];
  const EXP = [['Hello', '안녕', '👋'], ['Bye', '잘 가', '🖐️'], ['Good morning', '좋은 아침', '🌅'], ['Thank you', '고마워', '🙏'], ['Look', '봐!', '👀'], ['Come here', '이리 와', '🤗'], ["Let's go", '가자', '🚀'], ['I like it', '마음에 들어', '❤️']];
  C.ENGLISH = { LET, ANI, CLR, NUM, ACT, EXP };

  /* ---------- 문제 만들기 ---------- */
  const pickOthers = (arr, i, n = 2) => shuffle(arr.filter((_, j) => j !== i)).slice(0, n);
  // 소리 → 그림
  const listenRounds = (items) => items.map((it, i, all) => R(`{${it[0]}}! 어느 그림일까?`, [em(it[2], 1), ...pickOthers(all, i).map((o) => em(o[2]))], `맞아! {${it[0]}}! ${it[1]}!`, `{${it[0]}}. 천천히 들어 봐!`));
  const letterRounds = (ls) => ls.map((l) => { const [w, ko, pic] = LET[l], others = shuffle(Object.keys(LET).filter((x) => x !== l)).slice(0, 2); return R(`{${l} is for ${w}}! ${ko}를 찾아봐!`, [em(pic, 1), ...others.map((o) => em(LET[o][2]))], `맞아! {${l} is for ${w}}!`, `{${w}}. ${ko}!`); });
  const colorRounds = (cs) => cs.map((c, i, all) => R(`{${c[0]}}! ${c[1]}색을 찾아봐!`, [sw(c[2], 1), ...pickOthers(all, i).map((o) => sw(o[2]))], `맞아! {${c[0]}}! ${c[1]}!`, `{${c[0]}}. ${c[1]}색이야!`));
  // 짧은 문장
  const seeRounds = (items) => items.map((it, i, all) => R(`{I see a ${it[0]}}. 어느 그림일까?`, [em(it[2], 1), ...pickOthers(all, i).map((o) => em(o[2]))], `맞아! {I see a ${it[0]}}!`, `{${it[0]}}를 찾아봐!`));
  const itsRounds = (cs) => cs.map((c, i, all) => R(`{It's ${c[0]}}. 어느 색일까?`, [sw(c[2], 1), ...pickOthers(all, i).map((o) => sw(o[2]))], `맞아! {It's ${c[0]}}!`, `{${c[0]}}!`));
  const expRounds = (ex) => ex.map((e, i, all) => R(`{${e[0]}}! 어느 그림일까?`, [em(e[2], 1), ...pickOthers(all, i).map((o) => em(o[2]))], `맞아! {${e[0]}}! ${e[1]}!`, `{${e[0]}}. ${e[1]}!`));
  const actRounds = (ac) => ac.map((a, i, all) => R(`{${a[0]}}! 어느 그림일까?`, [em(a[2], 1), ...pickOthers(all, i).map((o) => em(o[2]))], `맞아! {${a[0]}}! ${a[1]}!`, `{${a[0]}}. ${a[1]}!`));
  // 숫자: 개수 그림
  const grp = (e, n, ok) => ({ ok, html: `<div class="grp" style="font-size:${n <= 3 ? 84 : n <= 6 ? 62 : 46}px">${Array.from({ length: n }, () => `<span>${e}</span>`).join('')}</div>` });
  const numRounds = (ns, hi) => ns.map((n, i) => { const e = ['🍎', '🐟', '🍓', '⭐'][i % 4], o = shuffle([n - 2, n - 1, n + 1, n + 2].filter((x) => x >= 1 && x <= hi)).slice(0, 2); return R(`{${NUM[n]}}! ${NUMKO[n]} 개는 어느 쪽일까?`, [grp(e, n, 1), ...o.map((x) => grp(e, x))], `맞아! {${NUM[n]}}!`, `하나씩 세어 봐! {${NUM.slice(1, n + 1).join(', ')}}`); });
  // 풍선
  const balloons = (qs) => qs.map(([say, ok, others, right]) => ({ say, right, pool: [ok, ok, ...others].map((x, i) => ({ ...x, ok: i < 2 })) }));
  const COL5 = ['#8E6CE0', '#FF6FA8', '#3E9BFF', '#4CC34A', '#FF8C2A'];
  const letterBalloons = (ls) => balloons(ls.map((l, i) => { const o = shuffle(Object.keys(LET).filter((x) => x !== l)).slice(0, 2); return [`{${l}}! ${l} 풍선을 터뜨려!`, { text: l, color: COL5[i % 5] }, o.map((x, j) => ({ text: x, color: COL5[(i + j + 1) % 5] })), `{${l}}!`]; }));
  const colorBalloons = (cs) => balloons(cs.map((c, i, all) => [`{${c[0]}}! ${c[1]} 풍선을 터뜨려!`, sw(c[2]), pickOthers(all, i).map((o) => sw(o[2])), `{${c[0]}}!`]));
  const numBalloons = (ns) => balloons(ns.map((n, i) => { const o = shuffle(NUM.map((_, k) => k).filter((k) => k >= 1 && k !== n)).slice(0, 2); return [`{${NUM[n]}}! ${n} 풍선을 터뜨려!`, { text: String(n), color: COL5[i % 5] }, o.map((x, j) => ({ text: String(x), color: COL5[(i + j + 1) % 5] })), `{${NUM[n]}}!`]; }));

  /* ---------- 그림책(따라 말하기) · 노래 ---------- */
  const echoPage = (art, text, say, echo) => ({ art, text, say, echo });
  const letterPages = (ls) => ls.map((l) => { const [w, ko, pic] = LET[l]; return echoPage({ emoji: pic }, `${l} · ${w} · ${ko}`, `{${l}}! {${l} is for ${w}}. ${ko}!`, `{${w}}`); });
  const aniPages = (an) => an.map(([w, ko, pic]) => echoPage({ emoji: pic }, `${w} · ${ko}`, `{${w}}! ${ko}는 {${w}}!`, `{${w}}`));
  const clrPages = (cs) => cs.map(([w, ko, c]) => echoPage({ color: c }, `${w} · ${ko}`, `{${w}}! ${ko}색은 {${w}}!`, `{${w}}`));
  const numPages = (ns) => ns.map((n) => echoPage({ html: `<div class="gl" style="color:#E0457B">${n}</div>` }, `${n} · ${NUM[n]} · ${NUMKO[n]}`, `{${NUM[n]}}! ${NUMKO[n]}은 {${NUM[n]}}!`, `{${NUM[n]}}`));
  const actPages = (ac) => ac.map(([w, ko, pic]) => echoPage({ emoji: pic }, `${w} · ${ko}`, `{${w}}! ${ko}!`, `{${w}}`));
  const expPages = (ex) => ex.map(([w, ko, pic]) => echoPage({ emoji: pic }, `${w} · ${ko}`, `{${w}}! ${ko}!`, `{${w}}`));
  const seePages = (an) => an.map(([w, ko, pic]) => echoPage({ emoji: pic }, `I see a ${w}.`, `{I see a ${w}}! ${ko}가 보여요!`, `{I see a ${w}}`));
  const itsPages = (cs) => cs.map(([w, ko, c]) => echoPage({ color: c }, `It's ${w}.`, `{It's ${w}}! ${ko}색이에요!`, `{It's ${w}}`));
  const letterSong = (ls) => ls.map((l) => `{${l}}, {${l}}, {${LET[l][0]}}! ${LET[l][1]}!`);

  /* ---------- 활동 ---------- */
  const bookA = (name, pages, color = '#E07BC9') => A('pages', name, '📒', color, { title: name, pages });
  const chooseA = (name, rounds, intro, icon = '👂', color = '#4AA3FF') => A('choose', name, icon, color, { intro, rounds });
  const popA = (name, rounds) => A('pop', name, '🎈', '#FF6F8E', { rounds });
  const songA = (title, cast, lines, melody) => A('song', title, '🎤', '#B47BE6', { title, cast, lines, melody: melody || [0, 0, 4, 4, 5, 5, 4, -1] });
  const matchA = (name, keys, names, pairs = 3) => A('match', name, '🃏', '#5A9BFF', { emoji: true, keys, pairs, names });
  const traceA = (name, chs) => A('trace', name, '✏️', '#38C9A6', { shapes: chs.map((c) => ({ ch: c, color: '#38C9A6', say: `{${c}}를 따라 써 볼까? 초록 점에서 시작해!`, right: `{${c}}! 멋지게 썼어!` })) });
  const mapNames = (items) => Object.fromEntries(items.map((i) => [i[2], `{${i[0]}}`]));
  const letterPair = (ls) => matchA('같은 그림 찾기', ls.map((l) => LET[l][2]), mapNames(ls.map((l) => LET[l])), Math.min(ls.length, 4));
  const letterTrio = (ls, shapes) => [bookA('따라 말하기', letterPages(ls)), chooseA('그림 찾기', letterRounds(ls.concat(ls)), '소리를 잘 들어 봐!'), popA('글자 풍선', letterBalloons(ls.concat(ls))), traceA('따라 쓰기', shapes), songA(`${ls.join(' ')} 노래`, ['coco', 'somi'], letterSong(ls))];
  const ANI4 = ANI.slice(0, 4), CLR4 = CLR.slice(0, 4);

  const unit1 = [
    L('A B 만나기', 'coco', '#FFE9A8', '에이, 비! 소리를 들어 볼까?', letterTrio(['A', 'B'], ['A', 'B'])),
    L('C D 만나기', 'coco', '#FFD3E8', '씨, 디! 고양이랑 강아지를 만나 보자!', letterTrio(['C', 'D'], ['C', 'D'])),
    L('동물 친구', 'somi', '#D3F2FF', '동물 친구들을 영어로 불러 볼까?', [
      bookA('따라 말하기', aniPages(ANI)), chooseA('동물 찾기', listenRounds(ANI), '소리를 잘 들어 봐!'), matchA('동물 짝 맞추기', ANI.map((a) => a[2]), mapNames(ANI), 4),
      songA('동물 노래', ['somi', 'nana'], C._H.SONG.animal.lines, C._H.SONG.animal.melody)]),
    L('색깔과 Hello', 'n7', '#DDF7D3', '색깔을 영어로 말하고, 인사도 해 보자!', [
      bookA('색깔 따라 말하기', clrPages(CLR4)), chooseA('색깔 찾기', colorRounds(CLR4), '소리를 잘 들어 봐!', '🎨'), popA('색깔 풍선', colorBalloons(CLR4)),
      bookA('Hello 따라 말하기', expPages(EXP.slice(0, 1)), '#FF8C6E'), songA('Hello 노래', ['coco', 'yuni'], C._H.SONG.hello.lines, C._H.SONG.hello.melody)])];

  const unit2 = [
    L('E F 만나기', 'coco', '#FFE9A8', '이, 에프! 달걀이랑 물고기를 만나 보자!', letterTrio(['E', 'F'], ['E', 'F'])),
    L('G H 만나기', 'coco', '#FFD3E8', '지, 에이치! 염소랑 모자를 만나 보자!', letterTrio(['G', 'H'], ['H'])),
    L('One ~ Five', 'n5', '#D3F2FF', '하나부터 다섯까지 영어로 세어 볼까?', [
      bookA('숫자 따라 말하기', numPages([1, 2, 3, 4, 5])), chooseA('개수 찾기', numRounds([1, 2, 3, 4, 5], 5), '하나씩 세어 보자!', '🔢'), popA('숫자 풍선', numBalloons([1, 2, 3, 4, 5])),
      songA('숫자 노래', ['n1', 'n2', 'n3'], ['{One, two, three}, 하나 둘 셋', '{Four, five}, 넷 다섯', '{One, two, three, four, five}!', '다섯까지 다 셌다!'], [0, 1, 2, -1, 3, 4, 5, -1])]),
    L('I see a …', 'somi', '#DDF7D3', '"I see a cat." 보이는 걸 말해 볼까?', [
      bookA('따라 말하기', seePages(ANI4)), chooseA('보이는 것 찾기', seeRounds(ANI), '문장을 잘 들어 봐!', '👀'), bookA('색깔 문장', itsPages(CLR4.slice(0, 2)), '#FF8C6E'), chooseA('색깔 찾기', itsRounds(CLR4), '"It\'s red." 어느 색일까?', '🎨')])];

  const unit3 = [
    L('I J 만나기', 'coco', '#FFE9A8', '아이, 제이! 아이스크림이랑 주스를 만나 보자!', letterTrio(['I', 'J'], ['I'])),
    L('K L 만나기', 'coco', '#FFD3E8', '케이, 엘! 연이랑 사자를 만나 보자!', letterTrio(['K', 'L'], ['L'])),
    L('One ~ Ten · 동작', 'n10', '#D3F2FF', '열까지 세고, 몸으로 말해 볼까?', [
      bookA('숫자 따라 말하기', numPages([6, 7, 8, 9, 10])), chooseA('개수 찾기', numRounds([6, 7, 8, 9, 10], 10), '하나씩 세어 보자!', '🔢'), bookA('동작 따라 말하기', actPages(ACT), '#FF8C6E'), chooseA('동작 찾기', actRounds(ACT), '소리를 잘 들어 봐!'),
      songA('영어 숫자 노래', ['n1', 'n2', 'n3'], C._H.SONG.count.lines, C._H.SONG.count.melody)]),
    L('짧은 문장', 'yuni', '#DDF7D3', '"It\'s red." "I like it." 짧게 말해 보자!', [
      bookA('색깔 문장', itsPages(CLR.slice(0, 4))), chooseA('색깔 찾기', itsRounds(CLR), '"It\'s blue." 어느 색일까?', '🎨'), bookA('표현 따라 말하기', expPages(EXP.slice(6, 8)), '#FF8C6E'),
      songA('Goodbye 노래', ['coco', 'mongi'], C._H.SONG.bye.lines, C._H.SONG.bye.melody)])];

  const unit4 = [
    L('Hello · Bye · Good morning', 'yuni', '#FFE9A8', '인사를 영어로 해 볼까?', [
      bookA('인사 따라 말하기', expPages(EXP.slice(0, 3))), chooseA('인사 찾기', expRounds(EXP.slice(0, 3).concat(EXP.slice(0, 3))), '소리를 잘 들어 봐!'), matchA('인사 짝 맞추기', EXP.slice(0, 4).map((e) => e[2]), mapNames(EXP.slice(0, 4)), 3), songA('Hello 노래', ['coco', 'yuni'], C._H.SONG.hello.lines, C._H.SONG.hello.melody)]),
    L('Thank you · Look · Come here', 'coco', '#FFD3E8', '고맙다고 말하고, 불러 보자!', [
      bookA('표현 따라 말하기', expPages(EXP.slice(3, 6))), chooseA('표현 찾기', expRounds(EXP.slice(3, 6).concat(EXP.slice(3, 6))), '소리를 잘 들어 봐!'), matchA('표현 짝 맞추기', EXP.slice(3, 7).map((e) => e[2]), mapNames(EXP.slice(3, 7)), 3)]),
    L("Let's go · I like it", 'mongi', '#D3F2FF', '같이 가자! 마음에 들어!', [
      bookA('표현 따라 말하기', expPages(EXP.slice(6, 8))), chooseA('표현 찾기', expRounds(EXP.slice(5, 8).concat(EXP.slice(5, 8))), '소리를 잘 들어 봐!'), songA('Goodbye 노래', ['coco', 'mongi'], C._H.SONG.bye.lines, C._H.SONG.bye.melody)]),
    L('ABC 모험', 'coco', '#DDF7D3', 'A부터 L까지! 코코랑 모험을 떠나자!', [
      A('story', '열기구 이야기', '📖', '#9B7BE6', { story: 'abc' }), chooseA('그림 찾기', letterRounds(['A', 'C', 'F', 'H', 'K']), '소리를 잘 들어 봐!'), letterPair(['A', 'B', 'C', 'D']), popA('글자 풍선', letterBalloons(['A', 'D', 'F', 'L']))])];

  const v = C.VILLAGES.english;
  v.units = [unit1, unit2, unit3, unit4]; v.lessons = unit1; v.hello = '영어 마을에 어서 와! {Hello}! 천천히 해 보자.';
})();
