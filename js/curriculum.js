/* 12주 × 5일 커리큘럼 (수업 내용과 분리된 '계획표').
   각 날은 3단계: ① 시작(이야기·그림책·노래) → ② 핵심 놀이 → ③ 짧은 복습 → 보상.
   단계마다 마을 수업 안의 활동을 가리킨다: ref = [마을, 호(0부터), 수업(0부터), 활동(0부터)].
   요일 흐름: 1 이야기 발견 · 2 듣고 찾기 · 3 손으로 놀기 · 4 표현하기 · 5 모험 복습. (content.js 등 뒤에 불러온다) */
(function () {
  const V = C.VILLAGES;
  const act = (ref) => { const [v, u, l, a] = ref, un = V[v] && V[v].units && V[v].units[u]; return un && un[l] && un[l].acts && un[l].acts[a]; };
  C.curAct = act;

  /* ---------- 주 계획 ---------- */
  // num/han/eng/sci = [호, 수업] (숫자·글자·영어 마을), extra = [마을, 호, 수업] (과학·감정·비교 등)
  const WEEKS = [
    { theme: '몽이와 첫 만남', goal: '1~3 세기 · 모음 ㅏ ㅣ 소리 · 영어 A B · 기쁨과 놀람', char: 'mongi', story: 's1', story2: 'rainbow', num: [0, 0], han: [0, 0], eng: [0, 0], extra: ['story', 1, 0] },
    { theme: '하나 둘 셋 넷 다섯', goal: '1~5 세기 · ㄱ ㄴ와 가 고 나 노 · 영어 C와 색깔', char: 'mongi', story: 's1', story2: 'ice', num: [0, 1], han: [0, 2], eng: [0, 1], extra: ['science', 0, 0] },
    { theme: '블록을 모아 보자', goal: '부분과 전체 · ㅁ ㅂ와 마모무 바보부 · 영어 D · 도움 주고받기', char: 'tori', story: 's1', story2: 'shop', num: [0, 3], han: [1, 1], eng: [0, 2], extra: ['story', 1, 1] },
    { theme: '첫 번째 작은 모험', goal: '1~5 복습 · ㄱ ㄴ ㅁ ㅂ 복습 · 영어 A~D 복습 · 비와 무지개', char: 'mongi', story: 'rainbow', story2: 'picnic', num: [0, 2], han: [1, 3], eng: [0, 3], extra: ['science', 0, 0] },
    { theme: '여섯, 일곱, 동물 친구', goal: '6 7 · ㅅ ㅇ · 영어 E F · 동물과 사는 곳', char: 'somi', story: 'sea', story2: 'shop', num: [1, 0], han: [2, 0], eng: [1, 0], extra: ['science', 0, 2] },
    { theme: '여덟, 아홉, 열', goal: '8 9 10 · 모음 ㅓ ㅗ ㅜ · 영어 G H · 많다와 적다', char: 'mongi', story: 'shop', story2: 'sea', num: [1, 1], han: [2, 1], eng: [1, 1], extra: ['number', 2, 0] },
    { theme: '순서와 패턴', goal: '1~10 순서 · 글자 합치기 · 영어 색깔 · 무지개 색 순서', char: 'coco', story: 'picnic', story2: 'rainbow', num: [3, 0], han: [3, 0], eng: [0, 3], extra: ['science', 0, 0] },
    { theme: '낱말을 만나요', goal: '크다 작다 · 두 글자 낱말 · 영어 동물 복습 · 글자 친구 이야기', char: 'tori', story: 'letters', story2: 'picnic', num: [2, 1], han: [3, 2], eng: [0, 2], extra: ['hangul', 3, 3] },
    { theme: '모아서 만들기', goal: '합치기와 남은 것 · 음절 듣고 찾기 · One~Five · 함께 해결', char: 'mongi', story: 's1', story2: 'shop', num: [3, 2], han: [3, 1], eng: [1, 2], extra: ['story', 1, 1] },
    { theme: '순서와 기억', goal: '1~10 순서 · 첫소리 · One~Ten · 같은 것 찾기', char: 'mongi', story: 'stars', story2: 's1', num: [3, 1], han: [0, 3], eng: [2, 2], extra: ['number', 2, 2] },
    { theme: '블록대륙 탐험대', goal: '숫자 → 한글 → 영어를 하나의 모험에서', char: 'coco', story: 'abc', story2: 'letters', num: [3, 3], han: [3, 3], eng: [3, 3], extra: ['science', 3, 0] },
    { theme: '축제와 자유 놀이', goal: '12주 복습 · 좋아하는 놀이 고르기', char: 'mongi', story: 'abc', story2: 's1', num: [3, 3], han: [3, 1], eng: [3, 2], extra: ['story', 1, 2] },
  ];
  const DAYKIND = ['이야기 발견', '듣고 찾기', '손으로 놀기', '표현하기', '모험 복습'];

  /* ---------- 활동 고르기 ---------- */
  const OK = (t) => t && t !== 'soon' && t !== 'daily' && t !== 'book';
  // 수업(L) 안에서 원하는 종류의 활동을 순서대로 찾는다
  function pick(v, [u, l], prefs, skip = []) {
    const L = V[v].units[u][l], acts = L.acts;
    // 같은 수업에 부드러운 시작(그림책·노래)이 없으면 같은 호의 다른 수업에서 찾는다
    if (prefs[0] === 'pages' || prefs[0] === 'song') {
      if (!acts.some((x) => prefs.includes(x.type))) for (let k = 0; k < V[v].units[u].length; k++) { const j = V[v].units[u][k].acts.findIndex((x) => prefs.includes(x.type)); if (j >= 0) return [v, u, k, j]; }
    }
    for (const t of prefs) { const i = acts.findIndex((a, k) => a.type === t && !skip.includes(k)); if (i >= 0) return [v, u, l, i]; }
    const i = acts.findIndex((a, k) => OK(a.type) && a.type !== 'story' && !skip.includes(k)); return [v, u, l, Math.max(0, i)];
  }
  const storyRef = (id) => ({ story: id });

  function dayPlan(w, wi, d) {
    if (wi === 11) { // 12주차 축제: 이야기 뒤에 아이가 가고 싶은 곳을 직접 고른다 (두 가지)
      const st = (kind, extra) => ({ kind, ref: null, ...extra });
      return { core: 'free_choice', secondary: `story_${d % 2 ? w.story2 : w.story}`, A: st('story', { story: d % 2 ? w.story2 : w.story }), B: st('play', { free: true }), C: st('pick', { free: true, skip: true }) };
    }
    const num = ['number', ...w.num], han = ['hangul', ...w.han], eng = ['english', ...w.eng], ex = w.extra;
    const step = (kind, ref, extra = {}) => ({ kind, ref, ...extra });
    const prev = WEEKS[Math.max(0, wi - 1)];
    switch (d) {
      case 0: return { core: `number_${w.num.join('_')}`, secondary: `hangul_${w.han.join('_')}`, A: step('story', null, storyRef(w.story)), B: step('play', pick(...[num[0], w.num], ['count', 'pages', 'choose'])), C: step('pick', pick(...[num[0], w.num], ['pick', 'choose'])) };
      case 1: return { core: `hangul_${w.han.join('_')}`, secondary: `english_${w.eng.join('_')}`, A: step('story', pick(...[han[0], w.han], ['pages', 'song'])), B: step('play', pick(...[han[0], w.han], ['pick', 'choose'])), C: step('pick', pick(...[han[0], w.han], ['pop', 'match', 'choose'])) };
      case 2: return { core: `number_${w.num.join('_')}`, secondary: 'hands_on', A: step('story', pick(...[num[0], w.num], ['song', 'pages'])), B: step('play', pick(...[num[0], w.num], ['combine', 'feed', 'count', 'sort', 'order'])), C: step('pick', pick(...[num[0], w.num], ['match', 'pop', 'choose'])) };
      case 3: return { core: `english_${w.eng.join('_')}`, secondary: `hangul_${w.han.join('_')}`, A: step('story', pick(...[eng[0], w.eng], ['pages', 'song'])), B: step('play', pick(...[eng[0], w.eng], ['trace', 'song', 'choose'])), C: step('pick', pick(...[eng[0], w.eng], ['choose', 'pop', 'match'])) };
      default: return { core: `review_${ex[0]}_${ex[1]}_${ex[2]}`, secondary: `story_${w.story2}`, A: step('story', null, storyRef(w.story2)), B: step('play', pick(...[ex[0], [ex[1], ex[2]]], ['choose', 'feel', 'sort', 'pick', 'order', 'match'])), C: step('pick', pick('number', prev.num, ['pick', 'choose', 'count'])) };
    }
  }

  const DAYS = [];
  WEEKS.forEach((w, wi) => {
    for (let d = 0; d < 5; d++) {
      const p = dayPlan(w, wi, d);
      DAYS.push({ n: wi * 5 + d + 1, week: wi + 1, day: d + 1, kind: DAYKIND[d], theme: w.theme, goal: w.goal, character: w.char, core: p.core, secondary: p.secondary, story: p.A.story || null, steps: ['캐릭터 등장', '짧은 상황', '질문', '아이 행동', '즉각 반응', '작은 성공', '보상'], time: 10, plan: { A: p.A, B: p.B, C: p.C } });
    }
  });
  C.CUR = { weeks: WEEKS, days: DAYS };

  /* 한 단계가 가리키는 활동 → {type, opt, name, icon} */
  C.curStep = (s) => {
    if (s.free) return { type: 'free', opt: {}, name: s.skip ? '자유 놀이 (위에서 함께 끝나요)' : '가고 싶은 곳 고르기', icon: '🌎' };
    if (s.story) return { type: 'story', opt: { story: s.story }, name: (C.STORIES.find((x) => x.id === s.story) || {}).title || '이야기', icon: '📖' };
    const a = act(s.ref); return a ? { type: a.type, opt: a.opt || {}, name: a.name, icon: a.icon, ref: s.ref, hero: (V[s.ref[0]].units[s.ref[1]][s.ref[2]] || {}).hero } : null;
  };
  // 시작 단계가 이야기가 아닌 날(그림책·노래)도 있어서, 단계 이름을 사람이 읽기 쉽게
  const heroOf = (s) => { if (s.story || !s.ref) return null; const [v, u, l] = s.ref; return V[v].units[u][l].hero; };
  C.curLabel = (day) => ({ A: C.curStep(day.plan.A), B: C.curStep(day.plan.B), C: C.curStep(day.plan.C) });
})();
