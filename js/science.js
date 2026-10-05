/* 과학(관찰·예상) · 마음 친구(감정) · 새 이야기 연결 (content.js 뒤에 불러온다)
   과학: 정답을 먼저 말하지 않고 아이가 먼저 '예상'을 고른 뒤 이야기·놀이로 확인한다. 감정: 정답이 없고 친구가 아이의 선택에 반응한다. */
(function () {
  const H = C._H, A = H.A, em = H.em, shuffle = E.shuffle;
  const L = (title, hero, color, say, acts) => ({ title, hero, color, say, acts });
  const R = (say, items, right, miss) => ({ say, items, right, miss, any: true });
  const lab = (e, label, ok) => ({ emoji: e, label, ok });
  const sw = (e) => e;

  /* ---------- 새 이야기 등록 ---------- */
  C.STORIES.push({ id: 'shop', title: '몽이의 블록 가게', bg: 'village', fn: 'StoryShop' }, { id: 'picnic', title: '코코의 색깔 소풍', bg: 'sky', fn: 'StoryPicnic' });
  const storyA = (id, name = '이야기 보기', color = '#9B7BE6') => A('story', name, '📖', color, { story: id });

  /* ---------- 새 '나누기' 주제 ---------- */
  const SO = H.SO, it = (e, name, bin) => ({ art: { emoji: e }, name, bin });
  SO.float = { intro: '물에 넣으면 뜰까, 가라앉을까?', ask: '$, 어떻게 될까?', bins: [{ label: '둥둥 떠요', art: { emoji: '🛟' } }, { label: '가라앉아요', art: { emoji: '⚓' } }], items: [it('🦆', '오리 인형', 0), it('🍃', '나뭇잎', 0), it('🏐', '공', 0), it('🪨', '돌멩이', 1), it('🔑', '열쇠', 1), it('🪙', '동전', 1)] };
  SO.hotcold = { intro: '뜨거운 것과 차가운 것으로 나눠 볼까?', ask: '$, 뜨거울까 차가울까?', bins: [{ label: '뜨거워요', art: { emoji: '🔥' } }, { label: '차가워요', art: { emoji: '🧊' } }], items: [it('☕', '따뜻한 차', 0), it('🍲', '끓는 국', 0), it('☀️', '한낮 햇볕', 0), it('🍦', '아이스크림', 1), it('🧊', '얼음', 1), it('⛄', '눈사람', 1)] };
  SO.weather = { intro: '날씨에 맞는 걸 찾아 줘!', ask: '$, 어떤 날에 쓸까?', bins: [{ label: '비 오는 날', art: { emoji: '🌧️' } }, { label: '햇볕 쨍쨍', art: { emoji: '☀️' } }], items: [it('☂️', '우산', 0), it('🥾', '장화', 0), it('🕶️', '선글라스', 1), it('👒', '모자', 1), it('🍧', '빙수', 1)] };
  SO.loud = { intro: '소리가 클까, 작을까?', ask: '$, 소리가 어떨까?', bins: [{ label: '소리가 커요', art: { emoji: '📢' } }, { label: '소리가 작아요', art: { emoji: '🤫' } }], items: [it('🚒', '소방차', 0), it('🥁', '북', 0), it('⚡', '천둥', 0), it('🐜', '개미 발소리', 1), it('🍃', '나뭇잎 소리', 1), it('🐱', '고양이 걸음', 1)] };

  /* ---------- 예상하기 문제 ---------- */
  const PRED = {
    rainbow: [R('비가 그치고 해님이 나오면 하늘에 뭐가 보일까? 예상해 봐!', [lab('🌈', '무지개', 1), lab('⛄', '눈사람'), lab('🌙', '달')], '우와, 예상이 맞았어! 비가 그치고 해님이 나오면 무지개가 떠!', '그렇게 생각했구나! 이야기를 보면서 확인해 보자. 사실은 무지개가 떠!'),
      R('비는 어디에서 내려올까?', [lab('☁️', '구름', 1), lab('🌳', '나무'), lab('🏠', '집')], '맞았어! 비는 구름에서 내려와!', '그렇게 생각했구나! 비는 사실 구름에서 내려와.')],
    ice: [R('얼음을 햇볕 아래에 두면 어떻게 될까? 예상해 봐!', [lab('💧', '녹아요', 1), lab('🧊', '그대로예요'), lab('🧱', '더 단단해져요')], '맞았어! 얼음은 따뜻하면 녹아서 물이 돼!', '그렇게 생각했구나! 이야기에서 직접 보자. 사실은 녹아서 물이 돼!'),
      R('물을 냉동실에 넣으면 어떻게 될까?', [lab('🧊', '얼음이 돼요', 1), lab('🔥', '뜨거워져요'), lab('💨', '없어져요')], '맞았어! 꽁꽁 얼어서 얼음이 돼!', '그렇게 생각했구나! 사실은 얼어서 얼음이 돼!'),
      R('눈사람을 따뜻한 방에 두면?', [lab('💧', '녹아요', 1), lab('⛄', '그대로예요'), lab('🌱', '싹이 나요')], '맞았어! 눈사람도 녹아!', '그렇게 생각했구나! 따뜻하면 눈사람도 녹아!')],
    homes: [R('물고기는 어디에 살까? 예상해 봐!', [lab('🌊', '물속', 1), lab('🌳', '나무 위'), lab('🏠', '집 안')], '맞았어! 물고기는 물속에 살아!', '그렇게 생각했구나! 물고기는 사실 물속에 살아.'),
      R('새는 어디에 집을 지을까?', [lab('🌳', '나무 위', 1), lab('🌊', '물속'), lab('🕳️', '땅속')], '맞았어! 새는 나무 위에 둥지를 지어!', '그렇게 생각했구나! 새는 나무 위에 둥지를 지어.'),
      R('토끼는 어디에 숨어 살까?', [lab('🕳️', '땅속 굴', 1), lab('☁️', '구름 위'), lab('🌊', '바닷속')], '맞았어! 토끼는 땅속 굴에 살아!', '그렇게 생각했구나! 토끼는 땅속 굴에 살아.')],
    night: [R('밤하늘에는 무엇이 보일까? 예상해 봐!', [lab('🌙', '달과 별', 1), lab('🌈', '무지개'), lab('☀️', '해님')], '맞았어! 밤에는 달과 별이 반짝여!', '그렇게 생각했구나! 밤에는 달과 별이 보여.'),
      R('낮에 환하게 비추는 건 뭘까?', [lab('☀️', '해님', 1), lab('🌙', '달님'), lab('⭐', '별')], '맞았어! 낮에는 해님이 비춰!', '그렇게 생각했구나! 낮에는 해님이 비춰.'),
      R('부엉이는 언제 깨어 있을까?', [lab('🌙', '밤', 1), lab('☀️', '낮'), lab('🌅', '아침')], '맞았어! 부엉이는 밤에 깨어 있어!', '그렇게 생각했구나! 부엉이는 밤에 깨어 있어.')],
    size: [R('코끼리와 생쥐 중에 누가 더 무거울까?', [lab('🐘', '코끼리', 1), lab('🐭', '생쥐')], '맞았어! 코끼리가 훨씬 무거워!', '그렇게 생각했구나! 코끼리가 훨씬 무거워.'),
      R('큰 것과 작은 것, 누가 더 빨리 달릴 수 있을까? 생각해 봐!', [lab('🐆', '표범', 1), lab('🐢', '거북이')], '정답은 하나가 아니야! 표범이 빨라, 거북이는 느리지만 오래 걸어!', '정답은 하나가 아니야! 표범이 빨라, 거북이는 느리지만 오래 걸어!')],
    plant: [R('씨앗에 물을 주고 햇볕을 쬐어 주면 어떻게 될까?', [lab('🌱', '싹이 나요', 1), lab('🪨', '돌이 돼요'), lab('🧊', '얼음이 돼요')], '맞았어! 싹이 나고 자라!', '그렇게 생각했구나! 사실은 싹이 나고 자라!'),
      R('꽃이 피려면 무엇이 필요할까?', [lab('💧', '물과 햇볕', 1), lab('🍬', '사탕'), lab('🧸', '인형')], '맞았어! 물과 햇볕이 필요해!', '그렇게 생각했구나! 꽃은 물과 햇볕이 필요해.')],
  };
  const predA = (name, k, color = '#4AA3FF') => A('choose', name, '🔮', color, { intro: '먼저 예상해 봐! 정답은 하나가 아니어도 괜찮아.', rounds: PRED[k] });
  const sortA = (name, k, color = '#38C9A6') => A('sort', name, '🧺', color, SO[k]);
  const bookA = (name, key, color = '#E07BC9') => A('pages', name, '📒', color, H.BOOK[key]);
  // 새 그림책: 식물, 날씨
  H.BOOK.plant = { title: '씨앗이 자라요', pages: [H.P('🌰', '작은 씨앗을 땅에 심어요.'), H.P('💧', '물을 주고 햇볕을 쬐어 줘요.'), H.P('🌱', '며칠 뒤, 쏙! 싹이 나요.'), H.P('🌷', '시간이 지나면 예쁜 꽃이 피어요!')] };
  H.BOOK.weather = { title: '오늘 날씨는?', pages: [H.P('☀️', '해님이 쨍쨍! 따뜻해요.'), H.P('☁️', '구름이 많아요.'), H.P('🌧️', '비가 와요. 우산을 써요.'), H.P('⛄', '눈이 와요. 아주 차가워요.')] };
  const orderA = (name, items, say, right) => A('order', name, '🌱', '#FFB020', { say, right, items });
  const matchA = (name, keys, names, pairs = 3) => A('match', name, '🃏', '#5A9BFF', { emoji: true, keys, pairs, names });

  /* ---------- 과학 연구소: 4개의 호 ---------- */
  const science = [
    [L('비 오는 날의 무지개', 'tori', '#D3F2FF', '무지개는 어떻게 생길까? 먼저 예상해 보자!', [predA('예상해 봐', 'rainbow'), storyA('rainbow'), A('order', '무지개 만들기', '🌈', '#FFB020', H.A ? { say: '무지개 색을 차례대로 눌러 볼까? 빨강부터!', right: '빨주노초파남보! 무지개 완성!', items: [['#F2453D', '빨강'], ['#FF8C2A', '주황'], ['#FFD230', '노랑'], ['#4CC34A', '초록'], ['#3E9BFF', '파랑'], ['#3A3FA8', '남색'], ['#9B4BD6', '보라']].map(([c, w]) => ({ color: c, say: w })) } : {}), bookA('비는 어디서 올까?', 'rain')]),
      L('얼음이 사라졌어요', 'nana', '#E8F7FF', '얼음은 어디로 갔을까? 먼저 예상해 보자!', [predA('예상해 봐', 'ice'), storyA('ice'), sortA('녹을까 안 녹을까', 'melt'), bookA('얼음과 물', 'ice')]),
      L('동물 친구 집', 'somi', '#DDF7D3', '동물 친구들은 어디에 살까?', [predA('예상해 봐', 'homes'), sortA('사는 곳 찾기', 'live'), matchA('동물과 집 짝', ['🐟', '🐦', '🐝', '🐰', '🐶', '🐘'], { '🐟': '물고기', '🐦': '새', '🐝': '꿀벌', '🐰': '토끼', '🐶': '강아지', '🐘': '코끼리' }, 4), bookA('동물 친구 집', 'homes')]),
      L('낮과 밤', 'mongi', '#E5E0FF', '낮에는 뭐가 보이고, 밤에는 뭐가 보일까?', [predA('예상해 봐', 'night'), storyA('stars'), sortA('낮일까 밤일까', 'daynight'), bookA('낮과 밤', 'moon')])],
    [L('큰 것 작은 것', 'n10', '#FFE9A8', '크기와 무게를 생각해 볼까?', [predA('예상해 봐', 'size'), sortA('크다 작다', 'bigsmall'), A('choose', '더 큰 것', '📏', '#FF8C6E', { rounds: H.CH.size.rounds, intro: '크기를 비교해 보자!' })]),
      L('뜰까 가라앉을까', 'nana', '#D3F2FF', '물에 넣으면 어떻게 될까?', [sortA('뜰까 가라앉을까', 'float'), predA('예상해 봐', 'ice'), bookA('얼음과 물', 'ice')]),
      L('뜨거운 것 차가운 것', 'somi', '#FFD3E8', '뜨거운 것과 차가운 것을 나눠 볼까?', [sortA('뜨겁다 차갑다', 'hotcold'), predA('예상해 봐', 'ice'), storyA('ice')]),
      L('소리 큰 것 작은 것', 'fire', '#DDF7D3', '소리를 잘 들어 볼까?', [sortA('큰 소리 작은 소리', 'loud'), A('choose', '소리 찾기', '👂', '#4AA3FF', { rounds: [{ say: '"삐뽀삐뽀!" 소리가 나는 건?', items: [em('🚒', 1), em('🐟'), em('🌳')], right: '맞아! 소방차!' }, { say: '"멍멍!" 소리가 나는 건?', items: [em('🐶', 1), em('🐱'), em('🐷')], right: '맞아! 강아지!' }, { say: '"야옹!" 소리가 나는 건?', items: [em('🐱', 1), em('🐶'), em('🐮')], right: '맞아! 고양이!' }] })])],
    [L('씨앗이 자라요', 'tori', '#DDF7D3', '씨앗은 어떻게 자랄까?', [predA('예상해 봐', 'plant'), orderA('자라는 순서', [{ emoji: '🌰', say: '씨앗' }, { emoji: '🌱', say: '싹' }, { emoji: '🌷', say: '꽃' }], '씨앗부터 꽃까지 차례대로 눌러 볼까?', '씨앗, 싹, 꽃! 잘 자랐어!'), bookA('씨앗이 자라요', 'plant')]),
      L('날씨 놀이', 'mongi', '#D3F2FF', '오늘 날씨는 어떨까?', [sortA('날씨에 맞는 물건', 'weather'), bookA('오늘 날씨는?', 'weather'), storyA('rainbow')]),
      L('바다 친구', 'coco', '#E8F7FF', '바다에는 누가 살까?', [predA('예상해 봐', 'homes'), storyA('sea'), bookA('바다 친구 그림책', 'sea')]),
      L('자연 산책', 'somi', '#FFE9A8', '자연을 가만히 관찰해 볼까?', [sortA('사는 곳 찾기', 'live'), sortA('낮일까 밤일까', 'daynight'), storyA('stars')])],
    [L('관찰 모험 1', 'tori', '#E5E0FF', '지금까지 본 것을 다시 예상해 볼까?', [predA('얼음 예상', 'ice'), predA('낮과 밤 예상', 'night'), sortA('녹을까 안 녹을까', 'melt')]),
      L('관찰 모험 2', 'mongi', '#D3F2FF', '이번엔 동물과 식물!', [predA('동물 예상', 'homes'), predA('식물 예상', 'plant'), sortA('사는 곳 찾기', 'live')]),
      L('관찰 모험 3', 'nana', '#FFD3E8', '무게, 소리, 온도를 알아봐!', [sortA('뜰까 가라앉을까', 'float'), sortA('뜨겁다 차갑다', 'hotcold'), sortA('큰 소리 작은 소리', 'loud')]),
      L('관찰 모험 4', 'somi', '#DDF7D3', '비와 무지개를 다시 만나자!', [predA('무지개 예상', 'rainbow'), storyA('rainbow'), storyA('ice', '얼음 이야기')])],
  ];
  science.splice(3, 0); // (4호까지 만든다)
  C.VILLAGES.science.units = science; C.VILLAGES.science.lessons = science[0];

  /* ---------- 마음 친구 (감정) ---------- */
  const F = (ex, label, react) => ({ art: { fr: 'somi', ex }, label, mood: ex, react });
  const EMO = (a, b) => [F('기쁨', '기뻐요', a), F('속상', '슬퍼요', b), F('걱정', '무서워요', '무서운 마음이구나. 괜찮아, 곁에 친구가 있어.'), F('놀람', '깜짝 놀랐어요', '깜짝 놀랐구나!')];
  const FEEL1 = { who: 'somi', rounds: [
    { say: '솜이가 높은 나무에 올라갔는데 내려오지 못해. 솜이는 어떤 기분일까?', mood: '걱정', options: EMO('신나게 올라갔는데도 기분이 좋구나!', '솜이가 슬퍼 보이니? 엄마가 오면 괜찮아질 거야.'), after: '엄마가 와 줘서 고마워!' },
    { say: '솜이가 엄마를 만나서 꼭 안겼어. 솜이는 어떤 기분일까?', mood: '기쁨', options: EMO('맞아, 따뜻하고 기쁜 마음이야!', '안겨서도 눈물이 나나 봐. 안심이 되어서 그런 거야.') },
    { say: '솜이가 좋아하는 장난감이 고장 났어. 솜이는 어떤 기분일까?', mood: '속상', options: EMO('고장 났는데 기쁘다고 생각했구나!', '맞아, 속상한 마음이야. 그럴 때는 누가 도와주면 좋겠지?') }] };
  const HELP = (react) => [{ art: { emoji: '🤗' }, label: '안아 줄래', mood: '기쁨', react }, { art: { emoji: '🤝' }, label: '도와줄래', mood: '기쁨', react }, { art: { emoji: '🚶' }, label: '같이 있을래', mood: '기쁨', react }];
  const FEEL2 = { who: 'somi', rounds: [
    { say: '친구가 울고 있네. 어떻게 해 줄까?', mood: '속상', options: HELP('다정한 마음이야. 솜이가 기운이 났대!'), after: '고마워! 이제 괜찮아졌어.' },
    { say: '친구가 높은 곳에서 못 내려와. 어떻게 도와줄까?', mood: '걱정', options: HELP('좋은 생각이야! 솜이는 안심이 됐어.'), after: '와, 고마워! 무섭지 않아!' },
    { say: '친구가 혼자 놀고 있어. 어떻게 해 줄까?', mood: '기본', options: HELP('같이 놀면 더 즐거워!'), after: '같이 놀아서 정말 신나!' }] };
  H.BOOK.feel = { title: '마음 그림책', pages: [{ art: { fr: 'somi' }, ex: '기쁨', text: '기뻐요! 입꼬리가 올라가고 눈이 반짝해요.', say: '기뻐요! 입꼬리가 올라가고 눈이 반짝해요.' }, { art: { fr: 'somi' }, ex: '속상', text: '슬퍼요. 눈물이 날 수도 있어요. 안아 주면 좋아요.', say: '슬퍼요. 눈물이 날 수도 있어요. 안아 주면 좋아요.' }, { art: { fr: 'somi' }, ex: '걱정', text: '무서워요. 곁에 친구가 있으면 괜찮아져요.', say: '무서워요. 곁에 친구가 있으면 괜찮아져요.' }, { art: { fr: 'somi' }, ex: '놀람', text: '깜짝 놀랐어요! 눈이 동그래져요.', say: '깜짝 놀랐어요! 눈이 동그래져요.' }] };
  const feelA = (name, opt, color = '#F58FA8') => A('feel', name, '💗', color, opt);
  const COLR = [['#F2453D', 'red'], ['#FFD230', 'yellow'], ['#4CC34A', 'green'], ['#3E9BFF', 'blue']];
  const picnicChoose = A('choose', '색깔 찾기', '🎨', '#4AA3FF', { intro: '소리를 잘 들어 봐!', rounds: COLR.map(([c, en], i) => ({ say: `{${en}}! 어느 색일까?`, items: shuffle([{ color: c, ok: 1 }, ...COLR.filter((x, j) => j !== i).slice(0, 2).map(([cc]) => ({ color: cc }))]), right: `맞아! {${en}}!` })) });
  const shopChoose = A('choose', '개수 찾기', '🔢', '#FF8C6E', { intro: '블록이 몇 개일까?', rounds: [3, 5, 2].map((n) => ({ say: `블록 ${['', '하나', '둘', '셋', '넷', '다섯'][n]} 개는 어느 쪽일까?`, items: shuffle([n, n === 2 ? 4 : n - 1, n === 5 ? 3 : n + 1].map((x, i) => ({ ok: i === 0, html: `<div class="grp" style="font-size:${x <= 3 ? 70 : 52}px">${Array.from({ length: x }, (_, k) => `<span class="sbl" style="background:${['#F2453D', '#FF8C2A', '#FFD230', '#4CC34A', '#3E9BFF'][k % 5]}"></span>`).join('')}</div>` }))), right: '맞아! 잘 세었어!' })) });

  const sv = C.VILLAGES.story, unit1 = sv.lessons;
  sv.units = [unit1, [
    L('마음 친구 솜이', 'somi', '#FFD3E8', '솜이의 기분을 같이 알아볼까?', [feelA('솜이는 어떤 기분일까?', FEEL1), A('pages', '마음 그림책', '📒', '#E07BC9', H.BOOK.feel), storyA('s1', '솜이를 구해 줘', '#FF8C6E')]),
    L('친구를 도와요', 'nana', '#FFE9A8', '친구가 힘들 때 어떻게 해 줄까?', [feelA('어떻게 해 줄까?', FEEL2, '#FF8C6E'), A('feel', '다시 해 보기', '💗', '#F58FA8', { who: 'somi', rounds: FEEL1.rounds.slice(0, 2) }), storyA('s1', '솜이를 구해 줘', '#9B7BE6')]),
    L('몽이의 블록 가게', 'mongi', '#D3F2FF', '손님이 블록을 사러 와요!', [storyA('shop', '이야기 보기', '#FF8C6E'), shopChoose, A('count', '칸 세기', '🔢', '#4AA3FF', { min: 1, max: 5 }), A('combine', '합치기', '🧩', '#9B7BE6')]),
    L('코코의 색깔 소풍', 'coco', '#DDF7D3', '색깔 소풍을 떠나 볼까?', [storyA('picnic', '이야기 보기', '#FF8C6E'), picnicChoose, A('pop', '색깔 풍선', '🎈', '#FF6F8E', { rounds: COLR.map(([c, en]) => ({ say: `{${en}}! 풍선을 터뜨려!`, right: `{${en}}!`, pool: [{ color: c, ok: 1 }, { color: c, ok: 1 }, ...COLR.filter(([cc]) => cc !== c).slice(0, 2).map(([cc]) => ({ color: cc }))] })) })]),
  ]];
  sv.lessons = unit1;
})();
