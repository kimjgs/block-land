/* 숫자 교육 재설계 (content.js 뒤에 불러온다)
   원칙: 항상 실제 물건·친구로 양을 경험 → 1~3 → 1~5 → 1~10 → 많다/적다 → 같다/다르다 → 앞·뒤·순서 → 부분과 전체.
        추상적인 덧셈식 암기는 먼저 시키지 않는다 (합치기는 블록 친구가 실제로 만나는 놀이로). */
(function () {
  const H = C._H, A = H.A, em = H.em, tx = H.tx, fr = H.fr, P = H.P, shuffle = E.shuffle, W = C.NUMW;
  const R = (say, items, right, hint) => ({ say, items, right, hint });

  /* 같은 물건을 n개 늘어놓은 그림 (faded: 뒤에서 몇 개를 흐리게 = 먹었거나 가져간 것) */
  const grp = (e, n, ok, faded = 0) => {
    const fs = n <= 3 ? 84 : n <= 6 ? 62 : 46;
    return { ok, html: `<div class="grp" style="font-size:${fs}px">${Array.from({ length: n }, (_, i) => `<span class="${i >= n - faded ? 'fd' : ''}">${e}</span>`).join('')}</div>` };
  };
  const FRUIT = ['🍎', '🍓', '🍌', '🍊', '🍇'], ANIMAL = ['🐟', '🐥', '🐰', '🐱'];
  const pickE = (i) => (i % 2 ? FRUIT : ANIMAL)[(i * 2) % 4];
  const near = (n, lo, hi) => shuffle([n - 2, n - 1, n + 1, n + 2].filter((x) => x >= lo && x <= hi)).slice(0, 2);

  /* ---------- 문제 만들기 ---------- */
  // 양 알아보기: "다섯! 다섯 개는 어느 쪽일까?"
  const qtyRounds = (ns, hi = 10) => ns.map((n, i) => { const e = pickE(i + n); return R(`${W[n]}! ${W[n]} 개는 어느 쪽일까?`, [grp(e, n, 1), ...near(n, 1, hi).map((x) => grp(e, x))], `맞아! ${W[n]}!`, `하나씩 세어 봐!`); });
  // 많다 / 적다
  const moreRounds = (pairs, less = false) => pairs.map(([a, b], i) => { const e = pickE(i), many = Math.max(a, b), few = Math.min(a, b); return R(less ? '어느 쪽이 더 적을까?' : '어느 쪽이 더 많을까?', [grp(e, many, !less), grp(e, few, less)], less ? '맞아! 이쪽이 더 적어!' : '맞아! 이쪽이 더 많아!', '하나씩 세어 비교해 봐!'); });
  // 높다 / 낮다 (숫자 친구의 키)
  const tallRounds = (pairs, low = false) => pairs.map(([a, b]) => { const big = Math.max(a, b), small = Math.min(a, b); return R(low ? '누가 더 낮을까?' : '누가 더 높을까?', [fr('n' + (low ? small : big), 1), fr('n' + (low ? big : small))], low ? `맞아! ${W[small]}이 더 낮아!` : `맞아! ${W[big]}이 더 높아!`, '칸이 몇 개인지 봐!'); });
  // 같다 / 다르다: 다른 하나 찾기
  const oddRounds = (sets) => sets.map(([same, diff]) => R('다른 하나는 어느 거야?', shuffle([em(same), em(same), em(diff, 1)]), '맞아! 이건 달라!', '두 개는 똑같아. 다른 건?'));
  const sameCountRounds = (ns) => ns.map((n, i) => { const e = pickE(i + 1), e2 = pickE(i + 2); return R(`${e}가 ${W[n]} 개야. ${e2}도 ${W[n]} 개인 쪽은?`, [grp(e2, n, 1), ...near(n, 1, 6).map((x) => grp(e2, x))], `맞아! 똑같이 ${W[n]} 개야!`, '하나씩 세어 봐!'); });
  // 순서: 다음 / 바로 앞 / 바로 뒤
  const numTx = (n, ok) => tx(String(n), ok, ['#F2453D', '#FF8C2A', '#E0A800', '#4CC34A', '#3E9BFF', '#5A54D9', '#9B4BD6', '#E040A8', '#8E7BB5', '#2A2350'][(n - 1) % 10]);
  const nextRounds = (starts, hi = 10) => starts.map((s) => R(`${[s, s + 1].map((x) => W[x]).join(', ')}… 그다음은?`, shuffle([numTx(s + 2, 1), ...near(s + 2, 1, hi).map((x) => numTx(x))]), `맞아! ${W[s + 2]}!`, `하나, 둘, 셋… 소리 내어 세어 봐!`));
  const afterRounds = (ns, hi = 10) => ns.map((n) => R(`${W[n]} 바로 뒤는 누구일까?`, shuffle([numTx(n + 1, 1), ...near(n + 1, 1, hi).filter((x) => x !== n).map((x) => numTx(x))]), `맞아! ${W[n]} 다음은 ${W[n + 1]}!`, '하나 더 많은 수야!'));
  const beforeRounds = (ns, hi = 10) => ns.map((n) => R(`${W[n]} 바로 앞은 누구일까?`, shuffle([numTx(n - 1, 1), ...near(n - 1, 1, hi).filter((x) => x !== n).map((x) => numTx(x))]), `맞아! ${W[n - 1]} 다음이 ${W[n]}!`, '하나 더 적은 수야!'));
  // 부분과 전체: 합쳐서 몇 개? / 먹고 남은 건?
  const wholeRounds = (pairs) => pairs.map(([a, b], i) => { const e = pickE(i + 2), s = a + b; return R(`${W[a]} 개와 ${W[b]} 개가 만나면 모두 몇 개일까?`, [grp(e, s, 1), ...near(s, 2, 8).map((x) => grp(e, x))], `맞아! 모두 ${W[s]}!`, '하나씩 세어 봐!'); });
  const leftRounds = (pairs) => pairs.map(([all, ate], i) => { const e = pickE(i + 3), left = all - ate; return R(`${W[all]} 개 중에 ${W[ate]} 개를 먹었어. 몇 개가 남았을까?`, [grp(e, left, 1), ...near(left, 1, 6).map((x) => grp(e, x))], `맞아! ${W[left]} 개 남았어!`, '남은 걸 세어 봐!'); });

  /* ---------- 활동 ---------- */
  const chooseA = (name, rounds, intro, icon = '🔢', color = '#4AA3FF') => A('choose', name, icon, color, { intro, rounds });
  const countA = (name, min, max, color = '#FF8C6E') => A('count', name, '🔢', color, min != null ? { min, max } : {});
  const pickA = (name, ids, area = 'numbers', color = '#4AA3FF') => A('pick', name, '👂', color, { area, ids });
  const feedA = (name, nums, food, foodName, animal = 'nana', color = '#FF8C6E', extra = {}) => A('feed', name, '🍽️', color, { animal, food, foodName, nums, ...extra });
  const bookA = (title, pages, color = '#E07BC9') => A('pages', title, '📒', color, { title, pages });
  const songA = (title, cast, lines, melody) => A('song', title, '🎤', '#B47BE6', { title, cast, lines, melody });
  const popA = (name, count, say) => A('pop', name, '🎈', '#FF6F8E', { intro: '풍선을 세면서 터뜨려 보자!', rounds: count.map((n) => ({ count: n, say: say || `풍선 ${W[n]}을 터뜨려 볼까?`, right: `${W[n]}! 잘 세었어!` })) });
  const orderA = (name, items, say, right, color = '#FFB020') => A('order', name, '🌈', color, { say, right, items });
  const matchA = (name, keys, pairs = 3, color = '#5A9BFF') => A('match', name, '🃏', color, { keys, pairs });
  const sortA = (name, key, color = '#38C9A6') => H.A('sort', name, '🧺', color, H.SO && H.SO[key]);
  const traceA = (name, chs, frs) => H.trace(chs, frs, name, '#38C9A6');
  const L = (title, hero, color, say, acts) => ({ title, hero, color, say, acts });
  const nFr = (n) => ({ fr: 'n' + n });
  const numPages = (ns) => ns.map((n) => P('n' + n, `${W[n]}은 ${W[n]} 칸! 손가락으로 같이 세어 볼까요?`, `${W[n]}은 ${W[n]} 칸! 하나씩 세어 봐요!`));
  const orderItems = (ns) => ns.map((n) => ({ fr: 'n' + n, say: W[n] }));

  const unit1 = [
    L('하나 둘 셋', 'n3', '#FFE9A8', '하나, 둘, 셋! 같이 세어 볼까?', [
      countA('칸 세기', 1, 3), pickA('숫자 친구 찾기', ['n1', 'n2', 'n3']), feedA('생선 주며 세기', [1, 2, 3], '🐟', '생선'),
      bookA('하나 둘 셋 그림책', numPages([1, 2, 3])), traceA('숫자 따라 쓰기', ['1', '2', '3'], ['n1', 'n2', 'n3'])]),
    L('넷 다섯', 'n5', '#FFD3E8', '넷, 다섯! 손가락이 다섯 개!', [
      countA('칸 세기', 3, 5), pickA('숫자 친구 찾기', ['n4', 'n5']), chooseA('개수 찾기', qtyRounds([4, 5, 4, 5], 5), '하나씩 세어 보자!'),
      feedA('딸기 주며 세기', [3, 4, 5], '🍓', '딸기', 'somi'), traceA('4 5 따라 쓰기', ['4', '5'], ['n4', 'n5'])]),
    L('1~5 세어 보기', 'n3', '#D3F2FF', '하나부터 다섯까지 세어 볼까?', [
      countA('칸 세기'), pickA('숫자 친구 찾기', null), A('story', '이야기 보기', '📖', '#9B7BE6', { story: 's1' }), songA('숫자 노래', ['n1', 'n2', 'n3'], C._H.SONG.num.lines, C._H.SONG.num.melody), bookA('숫자 친구 그림책', numPages([1, 2, 3, 4, 5]))]),
    L('합쳐서 다섯', 'n5', '#DDF7D3', '친구들이 만나면 몇이 될까?', [
      A('combine', '합치기', '🧩', '#FF8C6E'), chooseA('합쳐서 몇 개?', wholeRounds([[2, 1], [3, 1], [2, 2], [3, 2]]), '두 무리가 만나면?', '🧩'), feedA('생선 주며 세기', [2, 3, 5], '🐟', '생선'),
      songA('합치기 노래', ['n2', 'n3', 'n5'], C._H.SONG.plus.lines, C._H.SONG.plus.melody), A('story', '솜이를 구해 줘', '📖', '#9B7BE6', { story: 's1' })])];

  const unit2 = [
    L('여섯 일곱', 'n7', '#FFE9A8', '여섯, 일곱! 무지개는 일곱 색깔이야!', [
      countA('칸 세기', 6, 7), pickA('숫자 친구 찾기', ['n6', 'n7'], 'numbers2'), chooseA('개수 찾기', qtyRounds([6, 7, 6, 7]), '하나씩 세어 보자!'), popA('풍선 세기', [6, 7]), bookA('여섯 일곱 그림책', numPages([6, 7]))]),
    L('여덟 아홉 열', 'n8', '#FFD3E8', '여덟, 아홉, 열! 열은 손가락 모두!', [
      countA('칸 세기', 8, 10), pickA('숫자 친구 찾기', ['n8', 'n9', 'n10'], 'numbers2'), chooseA('개수 찾기', qtyRounds([8, 9, 10, 9]), '하나씩 세어 보자!'), popA('풍선 세기', [8, 10]), bookA('여덟 아홉 열 그림책', numPages([8, 9, 10]))]),
    L('6~10 만나기', 'n8', '#D3F2FF', '여섯부터 열까지 친구들을 만나 볼까?', [
      countA('칸 세기', 6, 10), pickA('숫자 친구 찾기', null, 'numbers2'), orderA('차례대로', orderItems([6, 7, 8, 9, 10]), '여섯부터 열까지 차례대로 눌러 볼까?', '여섯부터 열까지 다 했다!'), popA('풍선 세기', [6, 8, 10]), bookA('여섯부터 열까지', numPages([6, 7, 8, 9, 10]))]),
    L('열까지 놀이', 'n10', '#DDF7D3', '열까지 세어 볼까?', [
      popA('풍선 열 개', [10], '풍선 열 개를 터뜨려 볼까? 하나부터 열까지!'), feedA('생선 주며 세기', [6, 8, 10], '🐟', '생선'), orderA('1부터 10까지', orderItems([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), '하나부터 열까지 차례대로 눌러 볼까?', '하나부터 열까지 다 했다!'), bookA('열이 모이면', C._H.BOOK.big.pages)])];

  const unit3 = [
    L('많다 적다', 'n5', '#FFE9A8', '어느 쪽이 더 많을까?', [
      chooseA('더 많은 쪽', moreRounds([[5, 2], [3, 1], [6, 4], [4, 2], [7, 3]]), '하나씩 세어 비교해 봐!', '⚖️'), chooseA('더 적은 쪽', moreRounds([[4, 1], [6, 3], [5, 2], [3, 2]], true), '이번엔 더 적은 쪽!', '⚖️'),
      feedA('나눠 주기 (적게)', [1, 2, 3], '🐟', '생선', 'somi'), feedA('나눠 주기 (많이)', [4, 5, 6], '🍓', '딸기', 'nana'), popA('풍선 세기', [3, 5])]),
    L('높다 낮다', 'n10', '#FFD3E8', '누가 더 높을까? 칸을 비교해 봐!', [
      chooseA('더 높은 친구', tallRounds([[2, 5], [3, 7], [1, 4], [6, 9]]), '칸이 많으면 높아!', '📏'), chooseA('더 낮은 친구', tallRounds([[2, 5], [4, 8], [1, 3]], true), '이번엔 더 낮은 친구!', '📏'),
      sortA('크다 작다 나누기', 'bigsmall'), orderA('작은 친구부터', orderItems([1, 2, 3, 4, 5]), '작은 친구부터 차례대로 눌러 볼까?', '작은 친구부터 큰 친구까지!')]),
    L('같다 다르다', 'n2', '#D3F2FF', '똑같은 걸 찾아볼까?', [
      matchA('같은 숫자 찾기', ['n1', 'n2', 'n3', 'n4', 'n5'], 3), chooseA('다른 하나 찾기', oddRounds([['🍎', '🍌'], ['🐟', '🐥'], ['⭐', '🌙'], ['🐱', '🐶']]), '똑같은 건 두 개!', '👀'),
      chooseA('똑같이 몇 개?', sameCountRounds([2, 3, 4, 5]), '개수가 똑같은 쪽!', '🔢')]),
    L('비교 놀이', 'n7', '#DDF7D3', '많다, 적다, 높다, 낮다! 모두 해 볼까?', [
      chooseA('많다 적다', moreRounds([[6, 3], [2, 5], [8, 4]], false), '어느 쪽이 더 많을까?', '⚖️'), chooseA('높다 낮다', tallRounds([[3, 8], [5, 9], [2, 6]]), '누가 더 높을까?', '📏'),
      matchA('친구 짝 맞추기', ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'], 4), popA('풍선 세기', [4, 6])])];

  const unit4 = [
    L('처음 다음', 'n3', '#FFE9A8', '하나, 둘, 셋… 그다음은?', [
      orderA('1부터 5까지', orderItems([1, 2, 3, 4, 5]), '하나부터 다섯까지 차례대로 눌러 볼까?', '하나부터 다섯까지 다 했다!'), chooseA('그다음은?', nextRounds([1, 2, 3, 4, 5, 6, 7]), '이어서 세어 봐!', '➡️'), countA('칸 세기', 1, 5)]),
    L('앞 뒤', 'n4', '#FFD3E8', '바로 앞, 바로 뒤!', [
      chooseA('바로 뒤는?', afterRounds([1, 2, 3, 5, 7]), '하나 더 많은 수!', '➡️'), chooseA('바로 앞은?', beforeRounds([3, 4, 6, 8, 10]), '하나 더 적은 수!', '⬅️'), orderA('1부터 10까지', orderItems([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), '하나부터 열까지 차례대로 눌러 볼까?', '하나부터 열까지 다 했다!')]),
    L('부분과 전체', 'n5', '#D3F2FF', '작은 무리가 모이면 큰 무리가 돼!', [
      A('combine', '친구 합치기', '🧩', '#FF8C6E'), chooseA('합쳐서 몇 개?', wholeRounds([[2, 1], [1, 3], [3, 2], [2, 2], [4, 1]]), '두 무리가 만나면?', '🧩'), chooseA('남은 건 몇 개?', leftRounds([[5, 2], [4, 1], [3, 2], [5, 3]]), '먹고 나면 몇 개 남을까?', '🍎'),
      feedA('나눠 주기', [2, 3, 5], '🐟', '생선')]),
    L('숫자 모험', 'n8', '#DDF7D3', '지금까지 배운 걸 모험에서 써 볼까?', [
      countA('칸 세기', 1, 10), pickA('숫자 친구 찾기', null, 'numbers'), A('story', '이야기 보기', '📖', '#9B7BE6', { story: 's1' }), orderA('1부터 10까지', orderItems([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), '하나부터 열까지 차례대로 눌러 볼까?', '하나부터 열까지 다 했다!')])];

  const v = C.VILLAGES.number;
  v.units = [unit1, unit2, unit3, unit4]; v.lessons = unit1;
  // 4세용 선택지: 큰 수가 섞인 풀에서도 보기 3개로 (아이 수준에 맞춰 줄이거나 늘려요)
  C.NUMBER_PLAN = ['1~3', '1~5', '6~10', '비교(많다·적다·높다·낮다·같다·다르다)', '순서(처음·다음·앞·뒤)', '부분과 전체'];
})();
