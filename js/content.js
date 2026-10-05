/* 이름, 목소리, 스티커, 놀이 문제, 이야기 목록 */
window.C = (function () {
  const VOICE = {
    mongi: { kind: 'f', pitch: 1.2, rate: 1 },
    tori: { kind: 'f', pitch: 1.3, rate: .95 },
    coco: { kind: 'f', pitch: 1.1, rate: .85 },
    somi: { kind: 'f', pitch: 1.8, rate: .95 },
    nana: { kind: 'f', pitch: .95, rate: .9 },
    fire: { kind: 'm', pitch: 1.2, rate: 1.05 },
    captain: { kind: 'm', pitch: .8, rate: .95 },
    n1: { kind: 'm', pitch: 1.5, rate: 1.15 },
    n2: { kind: 'f', pitch: 1.3, rate: 1.05 },
    n3: { kind: 'm', pitch: 1.4, rate: 1 },
    teacher: { kind: 'f', pitch: 1.1, rate: .9 },
  };

  const GUIDES = [
    { id: 'mongi', name: '몽이', role: '숫자 마을 친구', say: '같이 해볼까?', names: ['몽이', '콩이', '토토', '두두'] },
    { id: 'tori', name: '토리', role: '한글 마을 친구', say: '이건 뭘까?', names: ['토리', '콩이', '몽이', '두두'] },
    { id: 'coco', name: '코코', role: '영어 마을 친구', say: '천천히~', names: ['코코', '콩이', '토토', '몽이'] },
  ];

  /* 스티커 (보물상자와 별로 모아요) */
  const STICKERS = [
    ['mongi', '몽이'], ['tori', '토리'], ['coco', '코코'], ['somi', '솜이'], ['nana', '나나'], ['fire', '앵앵이'],
    ['captain', '하늘 대장'], ['yuni', '윤이'], ['teacher', '해님 선생님'], ['n1', '하나'], ['n2', '둘'], ['n3', '셋'],
    ['n4', '넷'], ['n5', '다섯'], ['n6', '여섯'], ['n7', '일곱'], ['n8', '여덟'], ['n9', '아홉'], ['n10', '열'],
    ['amb', '삐뽀'], ['police', '삐용이'], ['excav', '포키'], ['dump', '덤덤이'], ['dozer', '밀밀이'],
    ['L0', '기역이'], ['L1', '니은이'], ['L2', '미음이'], ['L3', '비읍이'], ['L4', '이응이'], ['L5', '아'], ['L6', '이'], ['L7', '우'], ['L8', '어'], ['L9', '오'], ['L10', '시옷이'],
  ].map(([id, name]) => ({ id, name }));

  /* 듣고 고르기 문제 */
  const NUMS = [['n1', '하나', '하나를'], ['n2', '둘', '둘을'], ['n3', '셋', '셋을'], ['n4', '넷', '넷을'], ['n5', '다섯', '다섯을']];
  const VEH = [
    ['fire', '소방차', '소방차를', '빨간 사다리가 있는 차야!'], ['amb', '구급차', '구급차를', '하트가 그려진 하얀 차야!'],
    ['police', '경찰차', '경찰차를', '파란 경광등이 있는 차야!'], ['excav', '굴착기', '굴착기를', '팔이 길게 뻗은 노란 차야!'],
    ['dump', '덤프트럭', '덤프트럭을', '흙을 가득 실은 트럭이야!'], ['dozer', '불도저', '불도저를', '앞에 큰 삽이 달린 차야!'],
  ];
  const PICK = [];
  const NUMS2 = [['n6', '여섯', '여섯을'], ['n7', '일곱', '일곱을'], ['n8', '여덟', '여덟을'], ['n9', '아홉', '아홉을'], ['n10', '열', '열을']];
  NUMS2.forEach(([id, w, p]) => PICK.push({ id: 'pick_' + id, area: 'numbers2', target: id, pool: NUMS2.map((x) => x[0]), say: `${p} 찾아볼까?`, right: `맞아! ${w}!`, word: w, hint: `${w} 칸을 세어 봐!` }));
  NUMS.forEach(([id, w, p]) => PICK.push({ id: 'pick_' + id, area: 'numbers', target: id, pool: NUMS.map((x) => x[0]), say: `${p} 찾아볼까?`, right: `맞아! ${w}!`, word: w, hint: `${w} 칸을 세어 봐!` }));
  VEH.forEach(([id, w, p, hint]) => PICK.push({ id: 'pick_' + id, area: 'vehicles', target: id, pool: VEH.map((x) => x[0]), say: `${p} 찾아볼까?`, right: `맞아! ${w}!`, word: w, hint }));
  window.LETTERS.forEach((l) => PICK.push({ id: 'pick_' + l.id, area: 'hangul', target: l.id, pool: window.LETTERS.map((x) => x.id), say: `"${l.sound}" 소리가 나는 친구를 찾아볼까?`, right: `맞아! ${l.sound}~ ${l.name}!`, word: l.name, hint: `${l.buddy}의 첫소리야! ${l.sound}~` }));

  /* 합치기 문제 (아래 a칸 + 위 b칸) */
  const COMBINE = [[1, 1], [2, 1], [3, 1], [2, 2], [3, 2], [4, 1]];
  const NUMW = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];

  /* 이야기 목록 */
  const STORIES = [{ id: 's1', title: '솜이를 구해 줘!', bg: 'forest', minutes: 6 }];

  /* 하루 미션 */
  const MISSIONS = [
    { id: 'story', name: '이야기 보기', sub: '솜이를 구해 줘!', ico: '📖', color: '#FFD230' },
    { id: 'pick', name: '듣고 고르기', sub: '친구를 찾아봐', ico: '👂', color: '#8FD0FF' },
    { id: 'play', name: '놀이', sub: '', ico: '🧩', color: '#9BDC85' },
  ];

  /* 같이 볼 때 물어봐 주세요 */
  const ASK = [
    '솜이는 몇 칸 높이에 있었어? (다섯)',
    '셋이랑 둘이 만나면 몇이 돼? (다섯) — 손가락으로 같이 세어 보세요.',
    '도움이 필요할 때는 몇 번에 전화하지? (119) — 장난 전화는 안 된다는 것도 알려 주세요.',
    '솜이는 높은 곳에서 어떤 기분이었을까? (무서웠어요) 그때 엄마가 와서 어땠을까?',
  ];

  return { VOICE, GUIDES, STICKERS, PICK, COMBINE, NUMW, STORIES, MISSIONS, ASK, NUMS, VEH };
})();

/* 아이 친구 기본 모습 (부모님이 보내 준 사진을 참고: 앞머리 검은 머리, 하얀 벙거지 모자, 연보라 티셔츠, 연청 바지) */
C.KID_DEFAULT = { skin: '#F6D3B6', hair: 'bangs', hairColor: '#211C1C', shirt: '#B97AA8', pants: '#9DC3E6', hat: 'bucket', hatColor: '#EEEBE2', glasses: false, print: 'star', voice: 'boy' };
C.VOICE.yuni = { kind: 'm', pitch: 1.55, rate: 1.05 };

/* ===== 마을, 수업, 20일차 (참고 앱 구조: 지도 → 마을 → 수업 → 활동) ===== */
(function () {
  const A = (type, name, icon, color, opt) => ({ id: type + '_' + name, type, name, icon, color, opt });
  const em = (e, ok) => ({ emoji: e, ok });
  const tx = (t, ok, color) => ({ text: t, ok, color });
  const sw = (c, ok) => ({ color: c, ok });
  const fr = (k, ok) => ({ fr: k, ok });
  const P = (art, text, say) => ({ art: typeof art === 'string' ? (FR[art] ? { fr: art } : { emoji: art }) : art, text, say });

  /* ---------- 이야기 목록 ---------- */
  C.STORIES = [
    { id: 's1', title: '솜이를 구해 줘!', bg: 'forest', fn: 'Story1' },
    { id: 'rainbow', title: '비 오는 날의 무지개', bg: 'village', fn: 'StoryRainbow' },
    { id: 'ice', title: '얼음이 사라졌어요', bg: 'village', fn: 'StoryIce' },
    { id: 'stars', title: '밤하늘 별', bg: 'night', fn: 'StoryStars' },
    { id: 'letters', title: '글자 친구들이 놀러 왔어요', bg: 'village', fn: 'StoryLetters' },
    { id: 'abc', title: '코코의 ABC 열기구', bg: 'sky', fn: 'StoryABC' },
    { id: 'sea', title: '바다 친구를 만나요', bg: 'sea', fn: 'StorySea' },
  ];
  const story = (id, name = '이야기 보기', color = '#9B7BE6') => A('story', name, '📖', color, { story: id });

  /* ---------- 노래 (직접 지은 노랫말) ---------- */
  const SONG = {
    num: { title: '숫자 노래', cast: ['n1', 'n2', 'n3'], melody: [0, 0, 4, 4, 5, 5, 4, -1], lines: ['하나, 하나, 혼자서도 씩씩해', '둘, 둘, 둘이서 손을 잡고', '셋, 셋, 셋이서 세모 모양', '넷, 넷, 네모 반듯 네 칸', '다섯, 다섯, 손가락이 다섯 개!'] },
    plus: { title: '합치기 노래', cast: ['n2', 'n3', 'n5'], melody: [4, 2, 2, 3, 1, 1, 0, -1], lines: ['셋이랑 둘이 만나면', '하나 둘 셋 넷 다섯!', '넷이랑 하나가 만나도', '하나 둘 셋 넷 다섯!', '다섯은 한 손 가득!'] },
    hangul: { title: '글자 노래', cast: ['L0', 'L1', 'L5'], melody: [0, 2, 4, 2, 0, 2, 4, -1], lines: ['기역 기역, 그 그 그, 기린의 그', '니은 니은, 느 느 느, 나비의 느', '미음 미음, 므 므 므, 말의 므', '이응 이응, 응 응 응, 오리의 응', '아 아 아, 아기의 아!'] },
    abc: { title: 'ABC 노래', cast: ['coco', 'somi'], melody: [0, 0, 4, 4, 5, 5, 4, -1], lines: ['{A}, {A}, {apple}! 사과!', '{B}, {B}, {ball}! 공!', '{C}, {C}, {cat}! 고양이!', '{D}, {D}, {dog}! 강아지!', '{A, B, C, D}! 잘했어!'] },
    animal: { title: '동물 노래', cast: ['somi', 'nana'], melody: [4, 4, 2, -1, 4, 4, 2, -1], lines: ['{Cat}, {cat}, 야옹 야옹', '{Dog}, {dog}, 멍멍 멍멍', '{Pig}, {pig}, 꿀꿀 꿀꿀', '{Cow}, {cow}, 음매 음매', '동물 친구 모두 안녕!'] },
    color: { title: '색깔 노래', cast: ['n1', 'n3', 'n4'], melody: [0, 2, 4, 5, 4, 2, 0, -1], lines: ['{Red}, {red}, 빨간 사과', '{Yellow}, {yellow}, 노란 바나나', '{Green}, {green}, 초록 나뭇잎', '{Blue}, {blue}, 파란 하늘'] },
    hello: { title: 'Hello 노래', cast: ['coco', 'yuni'], melody: [4, 2, 4, 2, 5, 4, 2, -1], lines: ['{Hello}, {hello}, 안녕 안녕', '{How are you}? 잘 지내니?', "{I'm fine, thank you}! 나는 좋아요", '{Hello}, {hello}, 반가워!'] },
    count: { title: '하나 둘 셋 영어 노래', cast: ['n1', 'n2', 'n3'], melody: [0, 1, 2, -1, 3, 4, 5, -1], lines: ['{One, two, three}, 하나 둘 셋', '{Four, five, six}, 넷 다섯 여섯', '{Seven, eight, nine}, 일곱 여덟 아홉', '{Ten}! 열! 다 셌다!'] },
    bye: { title: 'Goodbye 노래', cast: ['coco', 'mongi'], melody: [5, 4, 2, -1, 4, 2, 0, -1], lines: ['{Goodbye}, {goodbye}, 잘 가 잘 가', '{See you tomorrow}, 내일 또 만나', '{Bye bye}! 안녕!'] },
  };
  const song = (k, name, color = '#B47BE6') => A('song', name || SONG[k].title, '🎤', color, SONG[k]);

  /* ---------- 그림책 ---------- */
  const BOOK = {
    num5: { title: '숫자 친구 그림책', pages: [P('n1', '하나는 한 칸! 혼자서도 씩씩해요.'), P('n2', '둘은 두 칸! 둘이 사이좋게 손을 잡아요.'), P('n3', '셋은 세 칸! 세모를 좋아해요.'), P('n4', '넷은 네 칸! 네모 반듯한 넷이에요.'), P('n5', '다섯은 다섯 칸! 손가락도 다섯 개예요.')] },
    num10: { title: '여섯부터 열까지', pages: [P('n6', '여섯은 여섯 칸! 두 줄로 나란히 서요.'), P('n7', '일곱은 일곱 칸! 무지개 일곱 색깔이에요.'), P('n8', '여덟은 여덟 칸! 문어 다리도 여덟 개!'), P('n9', '아홉은 아홉 칸! 셋, 셋, 셋 네모 모양이에요.'), P('n10', '열은 열 칸! 양손 손가락을 모두 펴면 열!')] },
    big: { title: '열이 모이면', pages: [P('n10', '열 칸이 모이면 한 묶음이 돼요.'), P('🖐️', '두 손 손가락을 모두 펴 볼까? 하나부터 열까지!'), P({ text: '10', color: '#E0457B' }, '1 다음에 0을 쓰면 10. 열이라고 읽어요.'), P({ emoji: '🍓🍓' }, '딸기가 열 개 있으면 한 접시 가득!')] },
    letters: { title: '글자 친구 그림책', pages: [P('L0', '기역이는 "그" 소리! 기린의 그!'), P('L1', '니은이는 "느" 소리! 나비의 느!'), P('L2', '미음이는 "므" 소리! 말의 므!'), P('L3', '비읍이는 "브" 소리! 박쥐의 브!'), P('L4', '이응이는 "응" 소리! 오리의 응!'), P('L5', '아는 "아" 소리! 아기의 아!')] },
    words: { title: '낱말 그림책', pages: [P('🦋', '나비. 나, 비. 팔랑팔랑 나비!'), P('🌳', '나무. 나, 무. 키가 큰 나무!'), P('🍌', '바나나. 바, 나, 나. 노란 바나나!'), P('🧼', '비누. 비, 누. 손을 깨끗하게 비누!'), P('👶', '아기. 아, 기. 귀여운 아기!')] },
    abc: { title: 'ABC 그림책', pages: [P('🍎', '{A} is for {apple}. 사과는 {apple}!'), P('⚽', '{B} is for {ball}. 공은 {ball}!'), P('🐱', '{C} is for {cat}. 고양이는 {cat}!'), P('🐶', '{D} is for {dog}. 강아지는 {dog}!'), P('🥚', '{E} is for {egg}. 달걀은 {egg}!'), P('🐟', '{F} is for {fish}. 물고기는 {fish}!')] },
    animals: { title: '동물 친구 그림책', pages: [P('🐱', '고양이는 {cat}! 야옹!'), P('🐶', '강아지는 {dog}! 멍멍!'), P('🐰', '토끼는 {rabbit}! 깡충깡충!'), P('🐻', '곰은 {bear}! 어흥… 아니, 곰은 크앙!'), P('🐷', '돼지는 {pig}! 꿀꿀!'), P('🐮', '소는 {cow}! 음매!')] },
    rain: { title: '비는 어디서 올까?', pages: [P('☁️', '구름 속에는 작은 물방울이 가득해요.'), P('🌧️', '물방울이 모여 무거워지면 비가 되어 내려요.'), P('☂️', '비가 오면 우산을 써요.'), P('🌈', '비가 그치고 해님이 나오면 무지개가 떠요.')] },
    ice: { title: '얼음과 물', pages: [P('🧊', '얼음은 차갑고 단단해요.'), P('☀️', '따뜻한 곳에 두면 얼음이 녹아요.'), P('💧', '녹은 얼음은 물이 돼요.'), P('❄️', '물을 꽁꽁 차갑게 하면 다시 얼음이 돼요.')] },
    homes: { title: '동물 친구 집', pages: [P('🐟', '물고기는 물속에 살아요.'), P('🐦', '새는 나무 위 둥지에 살아요.'), P('🐝', '꿀벌은 벌집에 살아요.'), P('🐰', '토끼는 땅속 굴에 살아요.'), P('🐶', '강아지는 우리 집에서 같이 살아요.')] },
    moon: { title: '낮과 밤', pages: [P('☀️', '낮에는 해님이 떠요. 환해요!'), P('🌙', '밤에는 달님이 떠요. 깜깜해요.'), P('🌓', '달은 날마다 모양이 조금씩 바뀌어요.'), P('⭐', '별은 아주 멀리서 반짝반짝 빛나요.'), P('🦉', '부엉이는 밤에 깨어 있어요.')] },
    sea: { title: '바다 친구 그림책', pages: [P('🐠', '물고기는 지느러미로 헤엄쳐요.'), P('🐙', '문어는 다리가 여덟 개예요.'), P('🦀', '꽃게는 옆으로 걸어요.'), P('🐳', '고래는 아주 커요. 물 위로 올라와 숨을 쉬어요.'), P('🐢', '바다거북은 모래밭에 알을 낳아요.')] },
    clean: { title: '바다를 지켜요', pages: [P('🥤', '바다에 쓰레기를 버리면 어떻게 될까?'), P('🐢', '바다 친구들이 쓰레기를 먹고 아파요.'), P('🗑️', '쓰레기는 꼭 쓰레기통에 버려요.'), P('🌊', '깨끗한 바다에서 바다 친구들이 행복해요!')] },
  };
  const book = (k, name = '그림책', color = '#E07BC9') => A('pages', name, '📒', color, BOOK[k]);

  /* ---------- 고르기 문제 ---------- */
  const R = (say, items, right, hint) => ({ say, items, right, hint });
  const CH = {
    first: { intro: '첫소리를 잘 들어 봐!', rounds: [R('"그" 소리로 시작하는 건?', [em('🦒', 1), em('🦋'), em('🐴')], '맞아! 기린, 그!'), R('"느" 소리로 시작하는 건?', [em('🦋', 1), em('🦒'), em('🦆')], '맞아! 나비, 느!'), R('"므" 소리로 시작하는 건?', [em('🐴', 1), em('👶'), em('🦋')], '맞아! 말, 므!'), R('"아" 소리로 시작하는 건?', [em('👶', 1), em('🐴'), em('🦒')], '맞아! 아기, 아!'), R('"오" 소리로 시작하는 건?', [em('🦆', 1), em('🦒'), em('🐴')], '맞아! 오리, 오!')] },
    syl: { rounds: [R('"가"를 찾아볼까?', [tx('가', 1), tx('나'), tx('마')], '맞아! 가!'), R('"나"를 찾아볼까?', [tx('나', 1), tx('가'), tx('바')], '맞아! 나!'), R('"마"를 찾아볼까?', [tx('마', 1), tx('나'), tx('아')], '맞아! 마!'), R('"바"를 찾아볼까?', [tx('바', 1), tx('마'), tx('가')], '맞아! 바!')] },
    words: { intro: '낱말을 잘 보고 골라 봐!', rounds: [R('"나비" 글자는 어디 있을까?', [tx('나비', 1, '#3E9BFF'), tx('나무', 0, '#3E9BFF'), tx('아기', 0, '#3E9BFF')], '맞아! 나비!'), R('"나무" 글자는 어디 있을까?', [tx('나무', 1, '#4CA33A'), tx('나비', 0, '#4CA33A'), tx('비누', 0, '#4CA33A')], '맞아! 나무!'), R('"아기" 글자는 어디 있을까?', [tx('아기', 1, '#E0457B'), tx('바나나', 0, '#E0457B'), tx('나비', 0, '#E0457B')], '맞아! 아기!'), R('"바나나" 글자는 어디 있을까?', [tx('바나나', 1, '#E0A800'), tx('비누', 0, '#E0A800'), tx('나무', 0, '#E0A800')], '맞아! 바나나! 세 글자야!')] },
    abc: { rounds: [R('{A} is for {apple}! 사과를 찾아봐!', [em('🍎', 1), em('⚽'), em('🐱')], '{Apple}! 맞아!'), R('{B} is for {ball}! 공을 찾아봐!', [em('⚽', 1), em('🍎'), em('🐶')], '{Ball}! 맞아!'), R('{C} is for {cat}! 고양이를 찾아봐!', [em('🐱', 1), em('🐶'), em('🍎')], '{Cat}! 맞아!'), R('{D} is for {dog}! 강아지를 찾아봐!', [em('🐶', 1), em('🐱'), em('⚽')], '{Dog}! 맞아!')] },
    animals: { rounds: [R('{Where is the cat}? 고양이는 어디 있을까?', [em('🐱', 1), em('🐶'), em('🐷')], '{Cat}! 야옹!'), R('{Where is the dog}? 강아지는 어디 있을까?', [em('🐶', 1), em('🐰'), em('🐮')], '{Dog}! 멍멍!'), R('{Where is the pig}? 돼지는 어디 있을까?', [em('🐷', 1), em('🐻'), em('🐱')], '{Pig}! 꿀꿀!'), R('{Where is the rabbit}? 토끼는 어디 있을까?', [em('🐰', 1), em('🐷'), em('🐶')], '{Rabbit}! 깡충!'), R('{Where is the cow}? 소는 어디 있을까?', [em('🐮', 1), em('🐻'), em('🐰')], '{Cow}! 음매!')] },
    colors: { rounds: [R('{Red}! 빨간색을 찾아봐!', [sw('#F2453D', 1), sw('#3E9BFF'), sw('#FFD230')], '{Red}! 빨강!'), R('{Blue}! 파란색을 찾아봐!', [sw('#3E9BFF', 1), sw('#4CC34A'), sw('#F2453D')], '{Blue}! 파랑!'), R('{Yellow}! 노란색을 찾아봐!', [sw('#FFD230', 1), sw('#F2453D'), sw('#9B4BD6')], '{Yellow}! 노랑!'), R('{Green}! 초록색을 찾아봐!', [sw('#4CC34A', 1), sw('#FFD230'), sw('#3E9BFF')], '{Green}! 초록!'), R('{Purple}! 보라색을 찾아봐!', [sw('#9B4BD6', 1), sw('#4CC34A'), sw('#FF8C2A')], '{Purple}! 보라!')] },
    rainbow: { rounds: [R('무지개가 뜨려면 무엇이 필요할까?', [em('🌦️', 1), em('🌙'), em('❄️')], '맞아! 해님이랑 비가 만나야 해!'), R('비는 어디에서 올까?', [em('☁️', 1), em('🌳'), em('🏠')], '맞아! 구름에서 와!'), R('비가 올 때 쓰는 건?', [em('☂️', 1), em('🕶️'), em('🧤')], '맞아! 우산!')] },
    cold: { rounds: [R('차가운 것은 어느 것?', [em('🧊', 1), em('🔥'), em('☕')], '맞아! 얼음은 차가워!'), R('해님 아래에서 녹는 것은?', [em('🍦', 1), em('🧸'), em('🥄')], '맞아! 아이스크림은 녹아!'), R('겨울에 만드는 것은?', [em('⛄', 1), em('🍉'), em('🌻')], '맞아! 눈사람!')] },
    homes: { rounds: [R('물고기는 어디에 살까?', [em('🌊', 1), em('🌳'), em('🏠')], '맞아! 물속!'), R('새는 어디에 살까?', [em('🌳', 1), em('🌊'), em('🏠')], '맞아! 나무 위 둥지!'), R('꿀벌은 무엇을 만들까?', [em('🍯', 1), em('🍞'), em('🧀')], '맞아! 달콤한 꿀!'), R('강아지는 어디에 살까?', [em('🏠', 1), em('🌊'), em('☁️')], '맞아! 우리 집에서 같이 살아!')] },
    night: { rounds: [R('밤하늘에 볼 수 있는 것은?', [em('🌙', 1), em('🌈'), em('🌻')], '맞아! 달님!'), R('밤에 깨어 있는 새는?', [em('🦉', 1), em('🐓'), em('🐧')], '맞아! 부엉이!'), R('낮에 떠서 환하게 비추는 것은?', [em('☀️', 1), em('⭐'), em('🌙')], '맞아! 해님!')] },
    more: { intro: '어느 쪽이 더 많을까?', rounds: [R('물고기가 더 많은 쪽은?', [em('🐟🐟🐟', 1), em('🐟')], '맞아! 셋이 하나보다 많아!'), R('딸기가 더 많은 쪽은?', [em('🍓🍓'), em('🍓🍓🍓🍓', 1)], '맞아! 넷이 둘보다 많아!'), R('별이 더 적은 쪽은?', [em('⭐', 1), em('⭐⭐⭐')], '맞아! 하나가 셋보다 적어!')] },
    seaFriends: { rounds: [R('문어를 찾아볼까?', [em('🐙', 1), em('🦀'), em('🐠')], '맞아! 다리가 여덟 개 문어!'), R('꽃게를 찾아볼까?', [em('🦀', 1), em('🐳'), em('🐙')], '맞아! 옆으로 걷는 꽃게!'), R('고래를 찾아볼까?', [em('🐳', 1), em('🐠'), em('🦀')], '맞아! 커다란 고래!'), R('바다거북을 찾아볼까?', [em('🐢', 1), em('🐙'), em('🐳')], '맞아! 바다거북!')] },
    size: { intro: '크기를 비교해 보자!', rounds: [R('더 큰 친구는?', [em('🐳', 1), em('🐟')], '맞아! 고래가 더 커!'), R('더 작은 친구는?', [em('🦀', 1), em('🐬')], '맞아! 꽃게가 더 작아!'), R('더 큰 숫자 친구는?', [fr('n5', 1), fr('n2')], '맞아! 다섯이 둘보다 커!')] },
    cleanSea: { rounds: [R('바다에 버리면 안 되는 것은?', [em('🥤', 1), em('🐠'), em('🐚')], '맞아! 쓰레기는 쓰레기통에!'), R('쓰레기는 어디에 버릴까?', [em('🗑️', 1), em('🌊'), em('🏖️')], '맞아! 쓰레기통!')] },
  };
  const choose = (k, name, icon = '👂', color = '#4AA3FF') => A('choose', name, icon, color, CH[k]);

  /* ---------- 나누기 ---------- */
  const SO = {
    melt: { intro: '해님 아래에 두면 녹을까, 안 녹을까?', ask: '$, 어느 쪽일까?', bins: [{ label: '녹아요', art: { emoji: '💧' } }, { label: '안 녹아요', art: { emoji: '🧱' } }], items: [{ art: { emoji: '🧊' }, name: '얼음', bin: 0 }, { art: { emoji: '🍦' }, name: '아이스크림', bin: 0 }, { art: { emoji: '⛄' }, name: '눈사람', bin: 0 }, { art: { emoji: '🍫' }, name: '초콜릿', bin: 0 }, { art: { emoji: '🧸' }, name: '곰 인형', bin: 1 }, { art: { emoji: '🥄' }, name: '숟가락', bin: 1 }, { art: { emoji: '⚽' }, name: '공', bin: 1 }] },
    live: { intro: '동물 친구들을 사는 곳으로 보내 주자!', ask: '$, 어디에 살까?', bins: [{ label: '물', art: { emoji: '🌊' } }, { label: '땅', art: { emoji: '🌳' } }, { label: '하늘', art: { emoji: '☁️' } }], items: [{ art: { emoji: '🐟' }, name: '물고기', bin: 0 }, { art: { emoji: '🐙' }, name: '문어', bin: 0 }, { art: { emoji: '🐶' }, name: '강아지', bin: 1 }, { art: { emoji: '🐰' }, name: '토끼', bin: 1 }, { art: { emoji: '🐘' }, name: '코끼리', bin: 1 }, { art: { emoji: '🐦' }, name: '새', bin: 2 }, { art: { emoji: '🦋' }, name: '나비', bin: 2 }] },
    daynight: { intro: '낮에 볼까, 밤에 볼까?', ask: '$, 낮일까 밤일까?', bins: [{ label: '낮', art: { emoji: '☀️' } }, { label: '밤', art: { emoji: '🌙' } }], items: [{ art: { emoji: '🌈' }, name: '무지개', bin: 0 }, { art: { emoji: '🐓' }, name: '닭', bin: 0 }, { art: { emoji: '🌻' }, name: '해바라기', bin: 0 }, { art: { emoji: '⭐' }, name: '별', bin: 1 }, { art: { emoji: '🦉' }, name: '부엉이', bin: 1 }, { art: { emoji: '💤' }, name: '쿨쿨 잠', bin: 1 }] },
    colors: { intro: '같은 색끼리 모아 볼까?', ask: '$, 무슨 색일까?', bins: [{ label: '빨강', art: { color: '#F2453D' } }, { label: '노랑', art: { color: '#FFD230' } }, { label: '초록', art: { color: '#4CC34A' } }], items: [{ art: { emoji: '🍎' }, name: '사과', bin: 0 }, { art: { emoji: '🍓' }, name: '딸기', bin: 0 }, { art: { emoji: '🍌' }, name: '바나나', bin: 1 }, { art: { emoji: '🌻' }, name: '해바라기', bin: 1 }, { art: { emoji: '🥦' }, name: '브로콜리', bin: 2 }, { art: { emoji: '🍀' }, name: '네잎클로버', bin: 2 }] },
    bigsmall: { intro: '큰 것과 작은 것으로 나눠 보자!', ask: '$, 클까 작을까?', bins: [{ label: '커요', art: { emoji: '🐘' } }, { label: '작아요', art: { emoji: '🐜' } }], items: [{ art: { emoji: '🐳' }, name: '고래', bin: 0 }, { art: { emoji: '🦒' }, name: '기린', bin: 0 }, { art: { emoji: '🚌' }, name: '버스', bin: 0 }, { art: { emoji: '🐞' }, name: '무당벌레', bin: 1 }, { art: { emoji: '🐭' }, name: '생쥐', bin: 1 }, { art: { emoji: '🍒' }, name: '체리', bin: 1 }] },
    trash: { intro: '바다를 깨끗하게! 쓰레기는 통에, 바다 친구는 바다로!', ask: '$, 어디로 갈까?', bins: [{ label: '바다', art: { emoji: '🌊' } }, { label: '쓰레기통', art: { emoji: '🗑️' } }], items: [{ art: { emoji: '🐠' }, name: '물고기', bin: 0 }, { art: { emoji: '🐢' }, name: '바다거북', bin: 0 }, { art: { emoji: '🦀' }, name: '꽃게', bin: 0 }, { art: { emoji: '🥤' }, name: '컵', bin: 1 }, { art: { emoji: '🛍️' }, name: '비닐봉지', bin: 1 }, { art: { emoji: '🥫' }, name: '깡통', bin: 1 }] },
  };
  const sort = (k, name, color = '#38C9A6') => A('sort', name, '🧺', color, SO[k]);

  /* ---------- 풍선 ---------- */
  const balloonsFind = (pairs) => pairs.map(([say, ok, others, right]) => ({ say, right, pool: [ok, ok, ...others].map((x, i) => ({ ...x, ok: i < 2 })) }));
  const NUMB = (n, c) => ({ text: String(n), color: c });
  const PO = {
    count: { intro: '풍선을 세면서 터뜨려 보자!', rounds: [{ count: 3, say: '풍선 셋을 터뜨려 볼까?', right: '셋! 잘했어!' }, { count: 5, say: '이번엔 다섯!', right: '다섯! 최고!' }, { count: 7, say: '일곱도 할 수 있을까?', right: '일곱! 대단해!' }] },
    ten: { intro: '열까지 세어 보자!', rounds: [{ count: 10, say: '풍선 열 개를 터뜨려 볼까? 하나부터 열까지!', right: '열! 열까지 다 셌어!' }] },
    nums: { rounds: balloonsFind([['숫자 3 풍선을 터뜨려!', NUMB(3, '#FFD230'), [NUMB(1, '#F2453D'), NUMB(5, '#3E9BFF')], '셋!'], ['숫자 5 풍선을 터뜨려!', NUMB(5, '#3E9BFF'), [NUMB(2, '#FF8C2A'), NUMB(4, '#4CC34A')], '다섯!'], ['숫자 1 풍선을 터뜨려!', NUMB(1, '#F2453D'), [NUMB(3, '#FFD230'), NUMB(4, '#4CC34A')], '하나!']]) },
    nums2: { rounds: balloonsFind([['숫자 7 풍선을 터뜨려!', NUMB(7, '#9B4BD6'), [NUMB(6, '#5A54D9'), NUMB(9, '#8E7BB5')], '일곱!'], ['숫자 10 풍선을 터뜨려!', NUMB(10, '#F2453D'), [NUMB(8, '#E040A8'), NUMB(6, '#5A54D9')], '열!'], ['숫자 8 풍선을 터뜨려!', NUMB(8, '#E040A8'), [NUMB(7, '#9B4BD6'), NUMB(9, '#8E7BB5')], '여덟!']]) },
    colors: { rounds: balloonsFind([['{Red} 풍선을 터뜨려! 빨간색!', { color: '#F2453D' }, [{ color: '#3E9BFF' }, { color: '#FFD230' }], '{Red}!'], ['{Blue} 풍선을 터뜨려! 파란색!', { color: '#3E9BFF' }, [{ color: '#4CC34A' }, { color: '#F2453D' }], '{Blue}!'], ['{Yellow} 풍선을 터뜨려! 노란색!', { color: '#FFD230' }, [{ color: '#9B4BD6' }, { color: '#3E9BFF' }], '{Yellow}!']]) },
    letters: { rounds: balloonsFind([['"그" 소리, ㄱ 풍선을 터뜨려!', { text: 'ㄱ', color: '#8E6CE0' }, [{ text: 'ㄴ', color: '#FF6FA8' }, { text: 'ㅁ', color: '#3E9BFF' }], '그! 기역!'], ['"느" 소리, ㄴ 풍선을 터뜨려!', { text: 'ㄴ', color: '#FF6FA8' }, [{ text: 'ㄱ', color: '#8E6CE0' }, { text: 'ㅇ', color: '#4CC34A' }], '느! 니은!'], ['"아" 소리, ㅏ 풍선을 터뜨려!', { text: 'ㅏ', color: '#FF8C2A' }, [{ text: 'ㅜ', color: '#3E9BFF' }, { text: 'ㅣ', color: '#4CC34A' }], '아!']]) },
    fish: { intro: '물고기 풍선을 세어 보자!', rounds: [{ count: 4, say: '풍선 넷을 터뜨려 볼까?', right: '넷!' }, { count: 6, say: '이번엔 여섯!', right: '여섯!' }] },
  };
  const pop = (k, name, color = '#FF6F8E', bg) => A('pop', name, '🎈', color, { ...PO[k], bg });

  /* ---------- 따라 쓰기, 차례대로, 짝, 먹이, 글자 합치기 ---------- */
  const TR = (chs, frs) => ({ shapes: chs.map((ch, i) => ({ ch, fr: frs && frs[i], color: /[A-Z]/.test(ch) ? '#38C9A6' : /\d/.test(ch) ? '#FF8C2A' : /[ㅏㅣㅜ]/.test(ch) ? '#FF6FA8' : '#8E6CE0', say: /[A-Z]/.test(ch) ? `{${ch}}를 따라 써 볼까? 초록 점에서 시작해!` : undefined, right: /[A-Z]/.test(ch) ? `{${ch}}! 멋지게 썼어!` : undefined })) });
  const trace = (chs, frs, name = '따라 쓰기', color = '#FF8C6E') => A('trace', name, '✏️', color, TR(chs, frs));
  const RAIN = [['#F2453D', '빨강'], ['#FF8C2A', '주황'], ['#FFD230', '노랑'], ['#4CC34A', '초록'], ['#3E9BFF', '파랑'], ['#3A3FA8', '남색'], ['#9B4BD6', '보라']];
  const RAIN_EN = [['#F2453D', '{red}'], ['#FF8C2A', '{orange}'], ['#FFD230', '{yellow}'], ['#4CC34A', '{green}'], ['#3E9BFF', '{blue}'], ['#9B4BD6', '{purple}']];
  const ORD = {
    rainbow: { say: '무지개 색을 차례대로 눌러 볼까? 빨강부터!', right: '빨주노초파남보! 무지개 완성!', items: RAIN.map(([c, w]) => ({ color: c, say: w })) },
    rainbowEn: { say: '{red}부터 차례대로 눌러 볼까?', right: '{Rainbow}! 무지개!', items: RAIN_EN.map(([c, w]) => ({ color: c, say: w })) },
    ten: { say: '1부터 10까지 차례대로 눌러 볼까?', right: '하나부터 열까지 다 했다!', items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ text: String(n), color: ['#F2453D', '#FF8C2A', '#E0A800', '#4CC34A', '#3E9BFF', '#5A54D9', '#9B4BD6', '#E040A8', '#8E7BB5', '#2A2350'][n - 1], say: C.NUMW[n] })) },
    seaSize: { say: '작은 친구부터 큰 친구까지 차례대로 눌러 볼까?', right: '작은 꽃게부터 커다란 고래까지!', items: [{ emoji: '🦐', say: '새우' }, { emoji: '🐟', say: '물고기' }, { emoji: '🐬', say: '돌고래' }, { emoji: '🐳', say: '고래' }] },
  };
  const order = (k, name, icon = '🌈', color = '#FFB020', bg) => A('order', name, icon, color, { ...ORD[k], bg });
  const match = (opt, name = '카드 짝 맞추기', color = '#5A9BFF') => A('match', name, '🃏', color, opt);
  const feed = (opt, name, color = '#FF8C6E') => A('feed', name, '🍽️', color, opt);
  const syl = (pairs, name = '글자 합치기', color = '#FF8C6E') => A('syllable', name, '🧩', color, { pairs });

  C._H = { A, em, tx, fr, P, SONG, BOOK, CH, PO, SO, song, book, choose, pop, trace, syl };
  C.VILLAGES = {
    number: { name: '숫자 마을', guide: 'mongi', hello: '숫자 마을에 온 걸 환영해!', bg: 'linear-gradient(#EDE8FF,#C9D6FF)', lessons: [
      { title: '1~5 세어 보기', hero: 'n3', color: '#FFE9A8', say: '하나부터 다섯까지 세어 볼까?', acts: [A('count', '칸 세기', '🔢', '#FF8C6E'), A('pick', '숫자 친구 찾기', '👂', '#4AA3FF', { area: 'numbers' }), story('s1'), song('num'), book('num5', '놀이책')] },
      { title: '합쳐서 다섯', hero: 'n5', color: '#FFD3E8', say: '친구들이 합쳐지면 몇이 될까?', acts: [A('combine', '합치기', '🧩', '#FF8C6E'), feed({ animal: 'nana', food: '🐟', foodName: '생선', nums: [2, 3, 5] }, '생선 주며 세기', '#4AA3FF'), trace(['1', '2', '3', '4', '5'], ['n1', 'n2', 'n3', 'n4', 'n5'], '숫자 따라 쓰기', '#38C9A6'), song('plus'), story('s1', '솜이를 구해 줘')] },
      { title: '6~10 만나기', hero: 'n8', color: '#D3F2FF', say: '여섯부터 열까지 친구들을 만나 볼까?', acts: [A('count', '칸 세기', '🔢', '#FF8C6E', { min: 6, max: 10 }), A('pick', '숫자 친구 찾기', '👂', '#4AA3FF', { area: 'numbers2' }), order('ten', '차례대로', '🔟', '#FFB020', 'village'), pop('nums2', '숫자 풍선', '#FF6F8E'), book('num10')] },
      { title: '큰 수 놀이', hero: 'n10', color: '#DDF7D3', say: '열까지 세어 볼까?', acts: [pop('ten', '풍선 열 개', '#FF6F8E'), feed({ animal: 'nana', food: '🐟', foodName: '생선', nums: [6, 8, 10] }, '생선 열 개', '#4AA3FF'), choose('more', '많은 쪽 찾기', '⚖️', '#38C9A6'), book('big')] }] },
    hangul: { name: '글자 마을', guide: 'tori', hello: '글자 마을이야! 글자 친구들이 기다려.', bg: 'linear-gradient(#FFF6C2,#FFE07A)', lessons: [
      { title: '글자 친구 만나기', hero: 'L5', color: '#FFE9A8', say: '글자 친구들의 소리를 들어 볼까?', acts: [A('pick', '글자 친구 찾기', '👂', '#4AA3FF', { area: 'hangul' }), song('hangul', '글자 노래'), trace(['ㄱ', 'ㄴ', 'ㅏ', 'ㅣ'], ['L0', 'L1', 'L5', 'L6']), book('letters', '놀이책')] },
      { title: 'ㄱ ㄴ ㅁ 첫소리', hero: 'L0', color: '#FFD3E8', say: '낱말의 첫소리를 들어 볼까?', acts: [choose('first', '첫소리 찾기'), pop('letters', '글자 풍선'), trace(['ㄱ', 'ㄴ', 'ㅁ', 'ㅂ', 'ㅇ'], ['L0', 'L1', 'L2', 'L3', 'L4']), match({ keys: ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'], pairs: 4 })] },
      { title: '글자 합치기', hero: 'L2', color: '#D3F2FF', say: '글자 친구들이 만나면 어떤 소리가 날까?', acts: [syl([['L0', 'L5'], ['L1', 'L5'], ['L2', 'L5'], ['L3', 'L5']]), choose('syl', '글자 고르기', '🔤'), story('letters')] },
      { title: '낱말 읽기', hero: 'L3', color: '#DDF7D3', say: '낱말을 같이 읽어 볼까?', acts: [book('words', '낱말 그림책'), choose('words', '낱말 찾기', '🔤'), syl([['L1', 'L6'], ['L2', 'L7'], ['L3', 'L6'], ['L4', 'L5']], '글자 만들기', '#9B7BE6')] }] },
    english: { name: '영어 마을', guide: 'coco', hello: '영어 마을에 어서 와! 천천히 해 보자.', bg: 'linear-gradient(#E3FAF3,#B7EBDD)', lessons: [
      { title: 'A B C 소리', hero: 'coco', color: '#FFE9A8', say: '에이, 비, 씨! 같이 해 보자!', acts: [song('abc'), choose('abc', '그림 찾기'), trace(['A', 'B', 'C']), book('abc', 'ABC 그림책'), story('abc', '열기구 이야기')] },
      { title: '동물 이름', hero: 'somi', color: '#FFD3E8', say: '동물 친구들을 영어로 불러 볼까?', acts: [book('animals', '동물 그림책'), choose('animals', '동물 찾기'), match({ emoji: true, keys: ['🐱', '🐶', '🐰', '🐷', '🐮', '🐻'], pairs: 4, names: { '🐱': '{cat}', '🐶': '{dog}', '🐰': '{rabbit}', '🐷': '{pig}', '🐮': '{cow}', '🐻': '{bear}' } }), song('animal')] },
      { title: '색깔 이름', hero: 'n7', color: '#D3F2FF', say: '색깔을 영어로 말해 볼까?', acts: [choose('colors', '색 찾기', '🎨'), pop('colors', '색 풍선'), song('color'), order('rainbowEn', '무지개 차례')] },
      { title: '노래로 영어', hero: 'yuni', color: '#DDF7D3', say: '노래하면서 영어를 배워 보자!', acts: [song('hello', 'Hello 노래', '#FF8C6E'), song('count', '숫자 노래', '#4AA3FF'), song('color', '색깔 노래', '#38C9A6'), song('bye', 'Goodbye 노래', '#B47BE6')] }] },
    science: { name: '과학 연구소', guide: 'tori', hello: '과학 연구소야! 이건 뭘까?', bg: 'linear-gradient(#E6F3FF,#BFDCFF)', lessons: [
      { title: '비 오는 날의 무지개', hero: 'tori', color: '#D3F2FF', say: '무지개는 어떻게 생길까?', acts: [story('rainbow', '이야기 보기', '#9B7BE6'), order('rainbow', '무지개 만들기'), choose('rainbow', '퀴즈', '❓'), book('rain')] },
      { title: '얼음이 사라졌어요', hero: 'nana', color: '#E8F7FF', say: '얼음은 어디로 갔을까?', acts: [story('ice', '이야기 보기', '#9B7BE6'), sort('melt', '녹을까 안 녹을까'), choose('cold', '퀴즈', '❓'), book('ice')] },
      { title: '동물 친구 집', hero: 'somi', color: '#DDF7D3', say: '동물 친구들은 어디에 살까?', acts: [sort('live', '사는 곳 찾기'), choose('homes', '퀴즈', '❓'), book('homes'), match({ emoji: true, keys: ['🐟', '🐦', '🐝', '🐰', '🐶', '🐘'], pairs: 4, names: { '🐟': '물고기', '🐦': '새', '🐝': '꿀벌', '🐰': '토끼', '🐶': '강아지', '🐘': '코끼리' } })] },
      { title: '밤하늘 별', hero: 'mongi', color: '#E5E0FF', say: '밤하늘에는 무엇이 있을까?', acts: [story('stars', '이야기 보기', '#9B7BE6'), sort('daynight', '낮일까 밤일까'), choose('night', '퀴즈', '❓'), book('moon')] }] },
    story: { name: '이야기 숲', guide: 'mongi', hello: '이야기 숲이야! 어떤 이야기를 볼까?', bg: 'linear-gradient(#EAFAD9,#C6EDB0)', lessons: [
      { title: '솜이를 구해 줘!', hero: 'somi', color: '#FFE9A8', say: '솜이 이야기를 볼까?', acts: [story('s1', '이야기 보기', '#FF8C6E'), A('daily', '12주 계획', '📅', '#4AA3FF'), A('count', '칸 세기', '🔢', '#9B7BE6'), A('combine', '합치기', '🧩', '#E07BC9')] },
      { title: '글자 친구들이 놀러 왔어요', hero: 'L5', color: '#FFD3E8', say: '글자 친구들 이야기를 볼까?', acts: [story('letters', '이야기 보기', '#FF8C6E'), book('letters', '그림책'), syl([['L0', 'L5'], ['L1', 'L5']], '가, 나 만들기', '#4AA3FF')] },
      { title: '비 오는 날의 무지개', hero: 'tori', color: '#D3F2FF', say: '무지개 이야기를 볼까?', acts: [story('rainbow', '이야기 보기', '#FF8C6E'), order('rainbow', '무지개 만들기'), choose('rainbow', '퀴즈', '❓')] },
      { title: '코코의 ABC 열기구', hero: 'coco', color: '#DDF7D3', say: '코코랑 열기구 여행을 떠나 볼까?', acts: [story('abc', '이야기 보기', '#FF8C6E'), choose('abc', '그림 찾기'), song('abc')] }] },
    play: { name: '놀이터', guide: 'mongi', hello: '놀이터야! 마음껏 놀자!', bg: 'linear-gradient(#FFE8F0,#FFC7DA)', lessons: [
      { title: '자유 놀이', hero: 'yuni', color: '#FFE9A8', say: '무엇을 하고 놀까?', acts: [A('pick', '듣고 고르기', '👂', '#4AA3FF'), A('count', '칸 세기', '🔢', '#FF8C6E'), A('combine', '합치기', '🧩', '#9B7BE6'), story('s1', '이야기 다시 보기', '#38C9A6'), A('book', '스티커북', '📒', '#E07BC9')] },
      { title: '풍선 터뜨리기', hero: 'n5', color: '#FFD3E8', say: '풍선을 펑펑 터뜨려 볼까?', acts: [pop('count', '세면서 펑!', '#FF6F8E'), pop('nums', '숫자 풍선', '#4AA3FF'), pop('colors', '색깔 풍선', '#38C9A6'), pop('letters', '글자 풍선', '#9B7BE6')] },
      { title: '카드 짝 맞추기', hero: 'n2', color: '#D3F2FF', say: '같은 카드를 찾아볼까?', acts: [match({ keys: ['n1', 'n2', 'n3', 'n4', 'n5'], pairs: 3 }, '숫자 짝 (3쌍)', '#FF8C6E'), match({ keys: ['fire', 'amb', 'police', 'excav', 'dump', 'dozer'], pairs: 4 }, '자동차 짝 (4쌍)', '#4AA3FF'), match({ keys: ['mongi', 'tori', 'coco', 'somi', 'nana', 'captain', 'yuni', 'teacher'], pairs: 6 }, '친구 짝 (6쌍)', '#9B7BE6')] },
      { title: '먹이 주기', hero: 'nana', color: '#DDF7D3', say: '배고픈 친구에게 맛있는 걸 주자!', acts: [feed({ animal: 'nana', food: '🐟', foodName: '생선', nums: [1, 2, 3] }, '나나에게 생선', '#FF8C6E'), feed({ animal: 'somi', h: 220, food: '🥛', foodName: '우유', nums: [2, 3, 4] }, '솜이에게 우유', '#4AA3FF'), feed({ animal: 'mongi', food: '🍓', foodName: '딸기', nums: [3, 4, 5] }, '몽이에게 딸기', '#9B7BE6')] }] },
    sea: { name: '바다 마을', guide: 'coco', hello: '바다 마을에 온 걸 환영해! 바닷속 친구들을 만나 보자.', bg: 'linear-gradient(#DDF3FF,#9FD6F5)', lessons: [
      { title: '바다 친구들', hero: 'coco', color: '#D3F2FF', say: '바다에는 누가 살까?', acts: [story('sea', '이야기 보기', '#9B7BE6'), book('sea'), choose('seaFriends', '친구 찾기'), match({ emoji: true, keys: ['🐠', '🐙', '🦀', '🐳', '🐢', '🐬'], pairs: 4, names: { '🐠': '물고기', '🐙': '문어', '🦀': '꽃게', '🐳': '고래', '🐢': '바다거북', '🐬': '돌고래' } })] },
      { title: '물고기 세기', hero: 'n5', color: '#E8F7FF', say: '물고기를 세어 볼까?', acts: [feed({ animal: 'nana', food: '🐟', foodName: '생선', nums: [2, 4, 5], bg: 'sea' }, '생선 주며 세기', '#FF8C6E'), choose('more', '많은 쪽 찾기', '⚖️', '#38C9A6'), pop('fish', '물고기 풍선', '#4AA3FF', 'sea')] },
      { title: '큰 것 작은 것', hero: 'n10', color: '#DDF7D3', say: '크고 작은 걸 비교해 볼까?', acts: [choose('size', '더 큰 것', '📏', '#FF8C6E'), order('seaSize', '작은 것부터', '🐳', '#4AA3FF', 'sea'), sort('bigsmall', '크다 작다')] },
      { title: '바다를 지켜요', hero: 'somi', color: '#FFE9A8', say: '깨끗한 바다를 만들어 볼까?', acts: [sort('trash', '바다 청소'), book('clean'), choose('cleanSea', '퀴즈', '❓')] }] },
  };
  /* 한 이야기를 20일 동안 다르게 만나기 (지금 앱에 있는 놀이로 짰어요) */
  const S = (label, type, icon, opt) => ({ label, type, icon, opt });
  C.DAILY = [
    S('이야기 보기', 'story', '📖'), S('칸 세기', 'count', '🔢'), S('숫자 친구 찾기', 'pick', '👂', { area: 'numbers' }), S('합치기', 'combine', '🧩'), S('이야기 다시 보기', 'story', '📖'),
    S('칸 세기', 'count', '🔢'), S('친구 찾기', 'pick', '👂'), S('합치기', 'combine', '🧩'), S('이야기 보기', 'story', '📖'), S('칸 세기', 'count', '🔢'),
    S('숫자 친구 찾기', 'pick', '👂', { area: 'numbers' }), S('합치기', 'combine', '🧩'), S('이야기 보기', 'story', '📖'), S('칸 세기', 'count', '🔢'), S('친구 찾기', 'pick', '👂'),
    S('합치기', 'combine', '🧩'), S('이야기 보기', 'story', '📖'), S('칸 세기', 'count', '🔢'), S('숫자 친구 찾기', 'pick', '👂', { area: 'numbers' }), S('마지막 이야기', 'story', '🎁'),
  ];
})();
