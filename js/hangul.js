/* 한글 교육 재설계 (content.js 뒤에 불러온다)
   원칙: ① 모음 소리를 먼저 경험 ② 자음은 '이름'(기역·니은…)으로 만난다 — "ㄱ=그" 같은 임의 소리는 가르치지 않는다
        ③ 자음이 들어간 실제 음절(가·고·나·노…)로 첫소리를 경험 ④ 그림과 연결 ⑤ 두 글자 낱말 ⑥ 듣고 고르기 */
(function () {
  const H = C._H, A = H.A, em = H.em, tx = H.tx, fr = H.fr, P = H.P;
  const shuffle = E.shuffle;

  /* ---------- 데이터 ---------- */
  const VOW = { L5: { ch: 'ㅏ', say: '아', word: '아기', pic: '👶' }, L8: { ch: 'ㅓ', say: '어', word: '어부', pic: '🎣' }, L9: { ch: 'ㅗ', say: '오', word: '오리', pic: '🦆' }, L7: { ch: 'ㅜ', say: '우', word: '우유', pic: '🥛' }, L6: { ch: 'ㅣ', say: '이', word: '이빨', pic: '🦷' } };
  const CON = { L0: { ch: 'ㄱ', name: '기역', word: '가방', syl: '가' }, L1: { ch: 'ㄴ', name: '니은', word: '나비', syl: '나' }, L2: { ch: 'ㅁ', name: '미음', word: '말', syl: '마' }, L3: { ch: 'ㅂ', name: '비읍', word: '바다', syl: '바' }, L10: { ch: 'ㅅ', name: '시옷', word: '사과', syl: '사' }, L4: { ch: 'ㅇ', name: '이응', word: '아기', syl: '아' } };
  // 자음 + 모음 = 실제 음절 (ㅇ은 소리가 없는 자리라 모음 소리 그대로)
  const SYL = { L0: { L5: '가', L9: '고', L7: '구' }, L1: { L5: '나', L9: '노', L7: '누' }, L2: { L5: '마', L9: '모', L7: '무' }, L3: { L5: '바', L9: '보', L7: '부' }, L10: { L5: '사', L9: '소', L7: '수' }, L4: { L5: '아', L9: '오', L7: '우' } };
  const WORDS = [['가방', 'L0', '🎒'], ['나비', 'L1', '🦋'], ['나무', 'L1', '🌳'], ['말', 'L2', '🐴'], ['모자', 'L2', '🧢'], ['바다', 'L3', '🌊'], ['바나나', 'L3', '🍌'], ['사과', 'L10', '🍎'], ['사자', 'L10', '🦁'], ['아기', 'L4', '👶'], ['우유', 'L4', '🥛']].map(([w, c, pic]) => ({ w, c, pic, syl: w[0] }));
  const wordsOf = (ids) => WORDS.filter((x) => ids.includes(x.c));
  C.HANGUL = { VOW, CON, SYL, WORDS };

  /* ---------- 듣고 고르기 문제 (옛 "그·느·므" 문제를 모두 대체) ---------- */
  const keep = C.PICK.filter((it) => it.area !== 'hangul');
  C.PICK.length = 0; keep.forEach((it) => C.PICK.push(it));
  const vowIds = Object.keys(VOW), conIds = Object.keys(CON);
  vowIds.forEach((id) => { const v = VOW[id]; C.PICK.push({ id: 'pick_' + id, area: 'vowels', target: id, pool: vowIds, say: `"${v.say}" 소리를 내는 친구를 찾아볼까?`, right: `맞아! ${v.say}~ ${v.word}의 ${v.say}!`, word: v.say, hint: `${v.word}에서 처음 들리는 소리야! ${v.say}~` }); });
  conIds.forEach((id) => { const c = CON[id]; C.PICK.push({ id: 'pick_' + id, area: 'consonants', target: id, pool: conIds, say: `${c.name}을 찾아볼까?`, right: `맞아! ${c.name}! ${c.word}의 ${c.syl}에서 만나!`, word: c.name, hint: `${c.word}의 "${c.syl}"에서 처음 만나는 친구야!` }); });
  WORDS.forEach((x) => { const c = CON[x.c]; C.PICK.push({ id: 'pickI_' + x.w, area: 'initial', target: x.c, pool: conIds, say: `${x.w}! 처음 소리는 어느 친구일까?`, right: `맞아! ${x.w}는 ${c.name}으로 시작해!`, word: x.w, hint: `${x.w}를 천천히 말해 봐. ${x.syl}~` }); });

  /* ---------- 활동 만들기 ---------- */
  const pickA = (name, area, ids, color = '#4AA3FF') => A('pick', name, '👂', color, { area, ids });
  const songA = (title, cast, lines, melody) => A('song', title, '🎤', '#B47BE6', { title, cast, lines, melody: melody || [0, 2, 4, 2, 0, 2, 4, -1] });
  const bookA = (title, pages, color = '#E07BC9') => A('pages', title, '📒', color, { title, pages });
  const chooseA = (name, rounds, intro, icon = '🔤', color = '#4AA3FF') => A('choose', name, icon, color, { intro, rounds });
  const popA = (name, rounds) => A('pop', name, '🎈', '#FF6F8E', { rounds });
  const sylA = (name, pairs) => A('syllable', name, '🧩', '#FF8C6E', { pairs });
  const matchA = (name, keys, names, pairs = 3) => A('match', name, '🃏', '#5A9BFF', { emoji: true, keys, pairs, names });
  const traceA = (name, list, color = '#FF8C6E') => A('trace', name, '✏️', color, { shapes: list.map((it) => (typeof it === 'string' ? shapeOf(it) : it)) });
  function shapeOf(ch) {
    const id = Object.keys(CON).find((k) => CON[k].ch === ch) || Object.keys(VOW).find((k) => VOW[k].ch === ch);
    const isV = id && VOW[id], c = id && (isV ? VOW[id] : CON[id]), nm = isV ? c.say : c && c.name;
    if (ch === 'lineV') return { ch, color: '#8E6CE0', say: '위에서 아래로 쭈욱! 초록 점에서 시작해!', right: '쭉 그었어! 멋지다!' };
    if (ch === 'lineH') return { ch, color: '#8E6CE0', say: '옆으로 쭈욱! 초록 점에서 시작해!', right: '쭉 그었어!' };
    if (ch === 'zig') return { ch, color: '#8E6CE0', say: '뾰족뾰족 산을 넘어가 볼까?', right: '산을 넘었어!' };
    if (ch === '가' || ch === '나') return { ch, color: '#FF8C6E', say: `"${ch}" 글자를 따라 써 볼까? 자음 먼저, 모음은 그다음!`, right: `${ch}! 멋지게 썼어!` };
    return { ch, fr: id, color: isV ? '#FF6FA8' : '#8E6CE0', say: isV ? `모음 ${nm} 모양을 따라 그려 볼까?` : `${nm}을 따라 써 볼까? 초록 점에서 시작해!`, right: isV ? `${nm}! 멋지게 그렸어!` : `${nm}! 멋지게 썼어!` };
  }
  const R = (say, items, right, hint) => ({ say, items, right, hint });
  // 모음 소리 → 낱말 그림
  const vowelRounds = (ids) => ids.map((id) => { const v = VOW[id], others = shuffle(vowIds.filter((x) => x !== id)).slice(0, 2); return R(`"${v.say}" 소리로 시작하는 건?`, [em(v.pic, 1), ...others.map((o) => em(VOW[o].pic))], `맞아! ${v.word}! ${v.say}~`, `${v.say}~ ${v.word}를 천천히 말해 봐`); });
  // 낱말을 듣고 첫소리 친구 고르기
  const initRounds = (ws) => ws.map((x) => { const others = shuffle(conIds.filter((c) => c !== x.c)).slice(0, 2); return R(`${x.w}! 처음 소리는 어느 친구일까?`, [fr(x.c, 1), ...others.map((o) => fr(o))], `맞아! ${x.w}는 ${CON[x.c].name}으로 시작해!`, `${x.w}를 천천히 말해 봐. ${x.syl}~`); });
  // 음절 글자 고르기
  const sylTextRounds = (list) => list.map((s) => { const others = shuffle(allSyl().filter((x) => x !== s)).slice(0, 2); return R(`"${s}"를 찾아볼까?`, [tx(s, 1), ...others.map((o) => tx(o))], `맞아! ${s}!`); });
  const allSyl = () => Object.values(SYL).flatMap((r) => Object.values(r));
  // 음절 소리 → 그림
  const sylPicRounds = (ws) => ws.map((x) => { const others = shuffle(WORDS.filter((y) => y.syl !== x.syl)).slice(0, 2); return R(`"${x.syl}" 소리로 시작하는 건?`, [em(x.pic, 1), ...others.map((o) => em(o.pic))], `맞아! ${x.w}! ${x.syl}~`, `${x.syl}~ ${x.w}`); });
  // 풍선
  const COL = ['#8E6CE0', '#FF6FA8', '#3E9BFF', '#4CC34A', '#FF8C2A'];
  const balloonRounds = (qs) => qs.map(([say, ok, others, right]) => ({ say, right, pool: [ok, ok, ...others].map((x, i) => ({ ...x, ok: i < 2 })) }));
  const consBalloons = (ids) => balloonRounds(ids.map((id, i) => { const c = CON[id], o = shuffle(conIds.filter((x) => x !== id)).slice(0, 2); return [`${c.name}! ${c.ch} 풍선을 터뜨려!`, { text: c.ch, color: COL[i % 5] }, o.map((x, j) => ({ text: CON[x].ch, color: COL[(i + j + 1) % 5] })), `${c.name}!`]; }));
  const vowBalloons = (ids) => balloonRounds(ids.map((id, i) => { const v = VOW[id], o = shuffle(vowIds.filter((x) => x !== id)).slice(0, 2); return [`"${v.say}" 소리! ${v.ch} 풍선을 터뜨려!`, { text: v.ch, color: COL[i % 5] }, o.map((x, j) => ({ text: VOW[x].ch, color: COL[(i + j + 1) % 5] })), `${v.say}!`]; }));
  const sylBalloons = (list) => balloonRounds(list.map((s, i) => { const o = shuffle(allSyl().filter((x) => x !== s)).slice(0, 2); return [`"${s}" 풍선을 터뜨려!`, { text: s, color: COL[i % 5] }, o.map((x, j) => ({ text: x, color: COL[(i + j + 1) % 5] })), `${s}!`]; }));
  const popB = (name, rounds) => popA(name, rounds);

  /* ---------- 그림책·노래 ---------- */
  const conPages = (ids) => ids.map((id) => { const c = CON[id]; return P(id, `${c.name}! ${c.word}의 ${c.syl}에서 만나요.`, `${c.name}! ${c.word}의 ${c.syl}!`); });
  const vowPages = (ids) => ids.map((id) => { const v = VOW[id]; return P(id, `모음 ${v.say}! ${v.word}의 ${v.say}.`, `모음 ${v.say}! ${v.word}의 ${v.say}!`); });
  const conSong = (ids) => ids.map((id) => `${CON[id].name} ${CON[id].name}, ${CON[id].word}의 ${CON[id].syl}`);
  const vowSong = (ids) => ids.map((id) => `${VOW[id].say} ${VOW[id].say} ${VOW[id].say}, ${VOW[id].word}의 ${VOW[id].say}`);
  const wordPages = (ws) => ws.map((x) => P({ emoji: x.pic }, `${x.w}. ${[...x.w].join(', ')}.`, `${x.w}! ${[...x.w].join(', ')}!`));

  /* ---------- 4개의 '호' (2주씩) ---------- */
  const L = (title, hero, color, say, acts) => ({ title, hero, color, say, acts });
  const pairsOf = (cons, vows) => cons.flatMap((c) => vows.map((v) => [c, v]));
  const sylsOf = (cons, vows) => cons.flatMap((c) => vows.map((v) => SYL[c][v]));
  const ws1 = wordsOf(['L0', 'L1']), ws2 = wordsOf(['L2', 'L3']), ws3 = wordsOf(['L10', 'L4']);
  const units = [
    // 호1 — 모음 ㅏ ㅣ, 자음 ㄱ ㄴ
    [
      L('ㅏ ㅣ 소리 만나기', 'L5', '#FFE9A8', '모음 친구들의 소리를 들어 볼까?', [
        pickA('소리 친구 찾기', 'vowels', ['L5', 'L6']), chooseA('소리로 그림 찾기', vowelRounds(['L5', 'L6', 'L5', 'L6']), '소리를 잘 들어 봐!', '👂'),
        traceA('선 따라가기', ['lineV', 'lineH', 'zig']), traceA('ㅣ ㅏ 따라 쓰기', ['ㅣ', 'ㅏ']), songA('모음 노래', ['L5', 'L6'], vowSong(['L5', 'L6']))]),
      L('ㄱ ㄴ 친구 만나기', 'L0', '#FFD3E8', '기역이랑 니은이를 만나 볼까?', [
        pickA('기역 · 니은 찾기', 'consonants', ['L0', 'L1']), popB('자음 풍선', consBalloons(['L0', 'L1', 'L0', 'L1'])),
        traceA('ㄱ ㄴ 따라 쓰기', ['ㄱ', 'ㄴ']), songA('자음 노래', ['L0', 'L1', 'L5'], conSong(['L0', 'L1'])), bookA('기역 · 니은 그림책', conPages(['L0', 'L1']))]),
      L('가 고 나 노', 'L1', '#D3F2FF', '친구들이 손을 잡으면 어떤 소리가 될까?', [
        sylA('글자 합치기', pairsOf(['L0', 'L1'], ['L5', 'L9'])), chooseA('글자 찾기', sylTextRounds(['가', '고', '나', '노']), '글자를 잘 봐!'),
        popB('글자 풍선', sylBalloons(['가', '고', '나', '노'])), traceA('가 나 따라 쓰기', ['가', '나'])]),
      L('첫소리 놀이', 'L2', '#DDF7D3', '낱말의 첫소리를 들어 볼까?', [
        chooseA('첫소리 친구 찾기', initRounds(ws1.slice(0, 4)), '천천히 말해 봐!', '👂'), pickA('첫소리 듣고 고르기', 'initial', ws1.map((x) => x.c).filter((v, i, a) => a.indexOf(v) === i)),
        chooseA('소리로 그림 찾기', sylPicRounds(ws1.slice(0, 3)), '"가"는 어디에 있을까?'), matchA('낱말 그림 짝', ws1.map((x) => x.pic), Object.fromEntries(ws1.map((x) => [x.pic, x.w])), 3)])],
    // 호2 — 자음 ㅁ ㅂ
    [
      L('ㅁ ㅂ 친구 만나기', 'L2', '#FFE9A8', '미음이랑 비읍이를 만나 볼까?', [
        pickA('미음 · 비읍 찾기', 'consonants', ['L2', 'L3']), popB('자음 풍선', consBalloons(['L2', 'L3', 'L2', 'L3'])),
        traceA('ㅁ ㅂ 따라 쓰기', ['ㅁ', 'ㅂ']), songA('자음 노래', ['L2', 'L3', 'L5'], conSong(['L2', 'L3'])), bookA('미음 · 비읍 그림책', conPages(['L2', 'L3']))]),
      L('마 모 무 바 보 부', 'L3', '#FFD3E8', '새 친구랑 손을 잡아 볼까?', [
        sylA('글자 합치기', pairsOf(['L2', 'L3'], ['L5', 'L9', 'L7'])), chooseA('글자 찾기', sylTextRounds(sylsOf(['L2', 'L3'], ['L5', 'L9', 'L7']).slice(0, 4)), '글자를 잘 봐!'),
        popB('글자 풍선', sylBalloons(['마', '모', '바', '보']))]),
      L('첫소리 놀이', 'L1', '#D3F2FF', '말, 모자, 바다, 바나나! 첫소리를 찾아봐!', [
        chooseA('첫소리 친구 찾기', initRounds(ws2.slice(0, 4)), '천천히 말해 봐!', '👂'), pickA('첫소리 듣고 고르기', 'initial', ['L2', 'L3']),
        chooseA('소리로 그림 찾기', sylPicRounds(ws2.slice(0, 4)), '소리를 잘 들어 봐!'), matchA('낱말 그림 짝', ws2.map((x) => x.pic), Object.fromEntries(ws2.map((x) => [x.pic, x.w])), 4)]),
      L('ㄱ ㄴ ㅁ ㅂ 복습', 'L3', '#DDF7D3', '지금까지 만난 친구들이야!', [
        pickA('자음 친구 찾기', 'consonants', ['L0', 'L1', 'L2', 'L3']), popB('자음 풍선', consBalloons(['L0', 'L1', 'L2', 'L3'])),
        matchA('글자 친구 짝', ['L0', 'L1', 'L2', 'L3'].map((k) => k), {}, 4), traceA('ㄱ ㄴ ㅁ ㅂ', ['ㄱ', 'ㄴ', 'ㅁ', 'ㅂ'])])],
    // 호3 — 자음 ㅅ ㅇ, 모음 ㅓ ㅗ ㅜ
    [
      L('ㅅ ㅇ 친구 만나기', 'L10', '#FFE9A8', '시옷이랑 이응이를 만나 볼까?', [
        pickA('시옷 · 이응 찾기', 'consonants', ['L10', 'L4']), popB('자음 풍선', consBalloons(['L10', 'L4', 'L10', 'L4'])),
        traceA('ㅅ ㅇ 따라 쓰기', ['ㅅ', 'ㅇ']), songA('자음 노래', ['L10', 'L4', 'L5'], conSong(['L10', 'L4'])), bookA('시옷 · 이응 그림책', conPages(['L10', 'L4']))]),
      L('모음 ㅓ ㅗ ㅜ', 'L9', '#FFD3E8', '모음 친구들이 더 왔어!', [
        pickA('모음 소리 찾기', 'vowels', ['L8', 'L9', 'L7']), chooseA('소리로 그림 찾기', vowelRounds(['L8', 'L9', 'L7', 'L9']), '소리를 잘 들어 봐!', '👂'),
        popB('모음 풍선', vowBalloons(['L8', 'L9', 'L7'])), traceA('ㅓ ㅗ ㅜ 따라 쓰기', ['ㅓ', 'ㅗ', 'ㅜ']), bookA('모음 그림책', vowPages(['L5', 'L8', 'L9', 'L7', 'L6']))]),
      L('사 소 수 · 아 오 우', 'L10', '#D3F2FF', '새 글자를 만들어 볼까?', [
        sylA('글자 합치기', pairsOf(['L10', 'L4'], ['L5', 'L9', 'L7'])), chooseA('글자 찾기', sylTextRounds(['사', '소', '수', '오']), '글자를 잘 봐!'),
        popB('글자 풍선', sylBalloons(['사', '소', '수', '우']))]),
      L('첫소리 놀이', 'L4', '#DDF7D3', '사과, 사자, 아기, 우유! 첫소리는?', [
        chooseA('첫소리 친구 찾기', initRounds(ws3.slice(0, 4)), '천천히 말해 봐!', '👂'), pickA('첫소리 듣고 고르기', 'initial', ['L10', 'L4']),
        chooseA('소리로 그림 찾기', sylPicRounds(ws3.slice(0, 4)), '소리를 잘 들어 봐!'), matchA('낱말 그림 짝', ws3.map((x) => x.pic), Object.fromEntries(ws3.map((x) => [x.pic, x.w])), 4)])],
    // 호4 — 음절과 낱말
    [
      L('글자 합치기', 'L2', '#FFE9A8', '자음과 모음이 만나면 글자가 돼!', [
        sylA('글자 합치기', pairsOf(['L0', 'L1', 'L2', 'L3', 'L10'], ['L5']).slice(0, 5)), chooseA('글자 찾기', sylTextRounds(['가', '나', '마', '바', '사']), '글자를 잘 봐!'),
        popB('글자 풍선', sylBalloons(['가', '나', '마', '바', '사'])), traceA('가 나 따라 쓰기', ['가', '나'])]),
      L('음절 듣고 찾기', 'L3', '#FFD3E8', '소리를 듣고 그림을 찾아봐!', [
        chooseA('소리로 그림 찾기', sylPicRounds(WORDS.filter((x) => ['가', '나', '마', '바', '사'].includes(x.syl)).slice(0, 5)), '소리를 잘 들어 봐!', '👂'),
        pickA('첫소리 듣고 고르기', 'initial', ['L0', 'L1', 'L2', 'L3', 'L10']), matchA('낱말 그림 짝', ['🎒', '🦋', '🌳', '🍎', '🦁', '🌊'], { '🎒': '가방', '🦋': '나비', '🌳': '나무', '🍎': '사과', '🦁': '사자', '🌊': '바다' }, 4)]),
      L('두 글자 낱말', 'L1', '#D3F2FF', '글자 두 개로 낱말이 돼요!', [
        bookA('낱말 그림책', wordPages(WORDS.filter((x) => x.w.length === 2).slice(0, 6))), chooseA('낱말 찾기', [R('"나비"는 어디 있을까?', [tx('나비', 1, '#3E9BFF'), tx('나무', 0, '#3E9BFF'), tx('가방', 0, '#3E9BFF')], '맞아! 나비!'), R('"가방"은 어디 있을까?', [tx('가방', 1, '#E0457B'), tx('바다', 0, '#E0457B'), tx('사자', 0, '#E0457B')], '맞아! 가방!'), R('"바다"는 어디 있을까?', [tx('바다', 1, '#2E8FD6'), tx('나비', 0, '#2E8FD6'), tx('우유', 0, '#2E8FD6')], '맞아! 바다!'), R('"사자"는 어디 있을까?', [tx('사자', 1, '#E0A800'), tx('아기', 0, '#E0A800'), tx('가방', 0, '#E0A800')], '맞아! 사자!')], '낱말을 잘 봐!'),
        chooseA('그림 찾기', [R('나비! 어느 그림일까?', [em('🦋', 1), em('🌳'), em('🎒')], '맞아! 나비!'), R('바다! 어느 그림일까?', [em('🌊', 1), em('🦁'), em('🍎')], '맞아! 바다!'), R('사자! 어느 그림일까?', [em('🦁', 1), em('🥛'), em('🦋')], '맞아! 사자!')], '이름을 듣고 찾아봐!', '👂')]),
      L('글자 친구 이야기', 'L5', '#DDF7D3', '글자 친구들 이야기를 볼까?', [
        A('story', '이야기 보기', '📖', '#FF8C6E', { story: 'letters' }), bookA('글자 친구 그림책', conPages(['L0', 'L1', 'L2', 'L3', 'L10', 'L4'])), songA('글자 노래', ['L0', 'L1', 'L5'], conSong(['L0', 'L1', 'L2', 'L3', 'L10', 'L4']))])],
  ];
  // 짝 맞추기의 글자 친구 카드(FR 키)는 emoji 모드가 아니라서 따로 처리
  units.forEach((u) => u.forEach((l) => l.acts.forEach((a) => { if (a.type === 'match' && a.opt.keys.every((k) => /^L\d+$/.test(k))) { delete a.opt.emoji; delete a.opt.names; } })));

  const v = C.VILLAGES.hangul;
  v.units = units; v.lessons = units[0];
  v.hello = '글자 마을이야! 글자 친구들이 기다려.';
})();
