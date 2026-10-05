/* 아이 친구 '윤이': 부모님이 AI로 만든 그림(img3d/kid_*.webp)을 쓴다. 표정이 6가지뿐이라 비슷한 것끼리 나눠 쓴다. */
(function () {
  if (!window.FR) return;
  const V = '?v=1';
  const t = (n) => `<img src="img3d/${n}.webp${V}" alt="" draggable="false" style="height:100%;width:auto;display:block" width="237" height="460" data-feet="438">`;
  const F = { base: t('kid_base'), happy: t('kid_happy'), wow: t('kid_wow'), talk: t('kid_talk'), wave: t('kid_wave1'), walk: t('kid_walk1') };
  FR.yuni = { '기본': F.base, '기쁨': F.happy, '놀람': F.wow, '걱정': F.wow, '속상': F.base, '생각': F.base, blink: F.happy, talk: F.talk, alt: F.happy, alt2: F.base,
    walk1: F.walk, walk2: F.base, wave1: F.wave, wave2: F.talk };
})();
