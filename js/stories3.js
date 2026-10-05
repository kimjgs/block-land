/* 새 이야기 둘: 몽이의 블록 가게(수 세기 1~5), 코코의 색깔 소풍(영어 색깔). 한 이야기에 학습 목표 하나. */
(function () {
  const SFX = E.SFX, M = E.M;
  const blk = (c) => `<div class="sblk" style="background:${c}"></div>`;
  const BC = ['#F2453D', '#FF8C2A', '#FFD230', '#4CC34A', '#3E9BFF'];

  /* ================= 몽이의 블록 가게 ================= */
  window.StoryShop = async function (S0) {
    const S = StoryKit2(S0), { run } = S;
    E.Music.start('story');
    await S.title('몽이의 블록 가게', '수 세기 이야기');
    const mongi = S.actor('mongi', 720, S.groundTop(230, 'mongi'), 230, { z: 6 });
    S.prop('<div class="scounter"></div>', 520, 392, 0, 5);
    mongi.mood('기쁨'); await mongi.wave(4);
    await mongi.say('어서 오세요! 여기는 몽이의 블록 가게예요!');
    // 손님 1: 솜이 — 블록 셋
    const somi = S.actor('somi', -160, S.groundTop(150, 'somi'), 150, { z: 7 });
    await S.walkIn(somi, 330, 1500);
    somi.mood('기쁨'); await somi.say('안녕! 블록 셋 주세요!');
    mongi.mood('생각'); await mongi.say('블록 셋이요? 같이 세어 볼까?');
    let shelf = [];
    await S.count(3, (i) => { const b = S.prop(blk(BC[i - 1]), 540 + (i - 1) * 84, 328, 0, 9); b.pop(); shelf.push(b); });
    await S.ask('같이 세어요! 하나, 둘, 셋!', 2200);
    mongi.mood('기쁨'); await mongi.say('셋! 여기 있어요.');
    for (const [i, b] of shelf.entries()) b.move(380 + i * 30, 392, 700);
    SFX.pop(); somi.mood('기쁨'); await somi.say('고마워요! 블록이 셋이나 생겼다!');
    await Promise.all([somi.moveTo(-200, S.groundTop(150, 'somi'), 1500, 'ease-in'), run.wait(1000)]);
    shelf.forEach((b) => b.remove());
    // 손님 2: 나나 — 블록 다섯
    const nana = S.actor('nana', -200, S.groundTop(170, 'nana'), 170, { z: 7 });
    await S.walkIn(nana, 320, 1500);
    nana.mood('기본'); await nana.say('블록 다섯 개를 주겠니? 집을 지을 거야.');
    mongi.mood('기쁨'); await mongi.say('다섯 개요! 하나씩 세어 드릴게요.');
    shelf = [];
    await S.count(5, (i) => { const b = S.prop(blk(BC[i - 1]), 460 + (i - 1) * 70, 328, 0, 9); b.pop(); shelf.push(b); });
    await S.ask('같이 세어요! 하나, 둘, 셋, 넷, 다섯!', 2800);
    await mongi.say('다섯! 한 손에 가득이에요.');
    nana.mood('기쁨'); await nana.say('고맙다. 정말 잘 세는구나!');
    shelf.forEach((b) => b.remove());
    await Promise.all([nana.moveTo(-220, S.groundTop(170, 'nana'), 1500, 'ease-in'), run.wait(1000)]);
    // 손님 3: 윤이 — 블록 둘
    const yuni = S.actor('yuni', -220, S.groundTop(230, 'yuni'), 230, { z: 7 });
    await S.walkIn(yuni, 300, 1500);
    yuni.mood('기쁨'); await yuni.say('몽이야, 블록 둘 주세요!');
    shelf = [];
    await S.count(2, (i) => { const b = S.prop(blk(BC[i + 1]), 560 + (i - 1) * 84, 328, 0, 9); b.pop(); shelf.push(b); });
    await S.ask('둘! 같이 세어 봐요!', 2000);
    mongi.mood('기쁨'); await mongi.say('둘! 여기 있어요. 또 오세요!');
    yuni.mood('기쁨'); M.bounce(yuni, 2); await yuni.say('안녕! 내일 또 올게!');
    // 마무리: 몇 명이 왔을까?
    shelf.forEach((b) => b.remove());
    mongi.mood('생각'); await mongi.say('오늘은 손님이 몇 명 왔을까?');
    await S.ask('솜이, 나나, 윤이… 같이 세어 봐요!', 2800);
    mongi.mood('기쁨'); M.bounce(mongi, 2); await mongi.say('셋! 손님이 셋이나 왔어요. 블록이 하나도 안 남았네!');
    await S.mark('end');
  };

  /* ================= 코코의 색깔 소풍 ================= */
  window.StoryPicnic = async function (S0) {
    const S = StoryKit2(S0), { run } = S;
    E.Music.start('story');
    await S.title('코코의 색깔 소풍', '영어 색깔 이야기');
    const coco = S.actor('coco', 160, S.groundTop(230, 'coco'), 230, { z: 6 });
    S.prop('<div class="sblanket"></div>', 330, 430, 0, 3);
    coco.mood('기쁨'); await coco.wave(4);
    await coco.say('{Hello}! 안녕! 오늘은 색깔 소풍을 왔어!');
    const somi = S.actor('somi', 1100, S.groundTop(150, 'somi'), 150, { z: 7 });
    await S.walkIn(somi, 700, 1500);
    somi.mood('기쁨'); await somi.say('야옹! 나도 소풍 왔어!');
    const items = [['red', '빨간', '🍎', 470], ['yellow', '노란', '🍌', 560], ['green', '초록', '🥒', 650], ['blue', '파란', '🫐', 740]];
    for (const [en, ko, emo, x] of items) {
      const it = S.prop(emo, x, 330, 90, 9); it.pop();
      await coco.say(`이건 ${ko}색이야! {${en}}!`);
      await S.ask(`같이 말해요! ${en}!`, 2400);
      somi.mood('기쁨'); await somi.say(`{${en}}! ${ko}색!`); somi.mood('기본');
    }
    const chips = await S.chips([['#F2453D', 'red', '{red}'], ['#FFD230', 'yellow', '{yellow}'], ['#4CC34A', 'green', '{green}'], ['#3E9BFF', 'blue', '{blue}']].map(([c, w, sp]) => [c, w, sp]), 40);
    coco.mood('기쁨'); M.bounce(coco, 2); await coco.say('{Red, yellow, green, blue}! 네 가지 색깔을 말했어!');
    chips.remove();
    await coco.say('{Goodbye}! 또 소풍 가자!');
    await S.mark('end');
  };
})();
