/* 소리, 목소리, 음악, 캐릭터 움직임, 효과를 담당하는 엔진 */
(function () {
  const E = (window.E = {});
  const ABORT = { aborted: true };
  E.ABORT = ABORT;
  E.settings = { sfx: true, music: true, voice: true };
  E.fast = /[?&]fast/.test(location.search); // 시험용: 빨리 감기
  E.stopAt = (location.search.match(/[?&]stop=(\w+)/) || [])[1]; // 시험용: 그 장면에서 멈춤

  /* ---------- 작은 도구 ---------- */
  E.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(kid));
    return el;
  };
  E.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  E.rand = (a, b) => a + Math.random() * (b - a);
  E.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- 소리 (브라우저가 직접 만드는 효과음) ---------- */
  let AC = null, sfxGain = null, musicGain = null;
  function ac() {
    if (!AC) {
      try {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        sfxGain = AC.createGain(); sfxGain.gain.value = 1; sfxGain.connect(AC.destination);
        musicGain = AC.createGain(); musicGain.gain.value = .55; musicGain.connect(AC.destination);
      } catch (e) {}
    }
    return AC;
  }
  E.resume = () => { const a = ac(); if (a && a.state === 'suspended') a.resume(); };
  function tone(freq, dur, type = 'sine', vol = .18, slide = 0, when = 0) {
    const a = ac(); if (!a || !E.settings.sfx) return;
    const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g).connect(sfxGain); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, vol = .2, when = 0) {
    const a = ac(); if (!a || !E.settings.sfx) return;
    const b = a.createBuffer(1, Math.max(1, a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900; s.buffer = b; g.gain.value = vol;
    s.connect(f).connect(g).connect(sfxGain); s.start(a.currentTime + when);
  }
  E.tone = tone; // 노래 반주용
  E.assistN = 0; E.assist = () => { E.assistN++; }; // 한 번의 활동에서 힌트·오답이 몇 번 있었는지 (벌점이 아니라 '도움을 받았나' 기록용)
  E.SFX = {
    boing() { tone(220, .35, 'sine', .22, 3.2); },
    pop() { tone(600, .12, 'triangle', .2, 1.8); },
    tap() { tone(520, .08, 'triangle', .14, 1.3); },
    ding(i = 0) { tone([523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319][i % 10], .35, 'sine', .22); tone([1046, 1174, 1318, 1396, 1568, 1760, 1976, 2093, 2349, 2637][i % 10], .25, 'sine', .06); },
    whoosh() { noise(.35, .25); },
    thud() { tone(120, .25, 'sine', .35, .5); noise(.15, .25); },
    snap() { tone(900, .06, 'square', .12); noise(.1, .3); tone(300, .2, 'sine', .25, .6); },
    sparkle() { [0, .07, .14, .21, .28].forEach((w, i) => tone(1200 + i * 220, .25, 'sine', .07, 1, w)); },
    tada() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .4, 'triangle', .14, 1, i * .09)); },
    siren() { [0, .5].forEach((w) => { tone(660, .45, 'sine', .05, 1, w); tone(880, .45, 'sine', .05, 1, w + .25); }); },
    note() { [659, 784, 880].forEach((f, i) => tone(f, .22, 'triangle', .1, 1, i * .16)); },
    slide() { tone(700, .4, 'sine', .15, .4); },
    heart() { tone(880, .15, 'sine', .1); tone(1175, .2, 'sine', .1, 1, .1); },
    oops() { E.assist(); tone(330, .18, 'triangle', .12, .8); tone(262, .25, 'triangle', .12, .8, .16); },
    oopsSoft() { tone(330, .18, 'triangle', .1, .8); tone(262, .25, 'triangle', .1, .8, .16); }, // 기억 카드처럼 틀려도 정상인 놀이용 (도움으로 세지 않음)
    chirp() { [0, .12].forEach((w) => tone(1900, .08, 'sine', .08, 1.3, w)); },
    open() { [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, .35, 'triangle', .12, 1, i * .1)); },
    jingle() { [523, 659, 784, 659, 784, 1046].forEach((f, i) => tone(f, .22, 'triangle', .1, 1, i * .13)); },
  };

  /* ---------- 배경 음악 (직접 작곡, 무료·저작권 걱정 없음) ---------- */
  const PENTA = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3];
  const MOODS = {
    home: { bpm: 112, melody: [2, -1, 4, -1, 5, 4, 2, -1, 3, -1, 4, -1, 2, 0, -1, -1, 2, -1, 4, -1, 5, 6, 7, -1, 6, -1, 4, -1, 5, -1, -1, -1], bass: [130.8, 110, 87.3, 98], vol: .035 },
    story: { bpm: 84, melody: [0, -1, 2, -1, 4, -1, 2, -1, 3, -1, 5, -1, 3, -1, 2, -1, 0, -1, 2, -1, 4, -1, 5, -1, 4, -1, 2, -1, 0, -1, -1, -1], bass: [130.8, 110, 87.3, 98], vol: .022 },
    night: { bpm: 64, melody: [4, -1, -1, 2, -1, -1, 4, -1, 5, -1, -1, 4, -1, -1, 2, -1, 4, -1, -1, 2, -1, -1, 0, -1, 2, -1, -1, 1, -1, -1, 0, -1], bass: [130.8, 110, 87.3, 98], vol: .02 },
  };
  const Music = (E.Music = {
    timer: null, mood: null, step: 0, next: 0,
    start(mood) {
      if (this.mood === mood && this.timer) return;
      this.stop(); const a = ac(); if (!a || !MOODS[mood]) return;
      this.mood = mood; this.step = 0; this.next = a.currentTime + .1;
      this.timer = setInterval(() => this.tick(), 60);
    },
    stop() { if (this.timer) clearInterval(this.timer); this.timer = null; this.mood = null; },
    tick() {
      const a = AC; if (!a || !this.mood) return;
      const m = MOODS[this.mood], dt = 60 / m.bpm / 2;
      while (this.next < a.currentTime + .25) {
        if (E.settings.music && !document.hidden) {
          const s = this.step % m.melody.length, n = m.melody[s];
          if (n >= 0) this.note(PENTA[n], dt * 1.6, 'triangle', m.vol, this.next);
          if (s % 8 === 0) this.note(m.bass[Math.floor(s / 8) % 4], dt * 6, 'sine', m.vol * 1.5, this.next);
        }
        this.next += dt; this.step++;
      }
    },
    note(f, dur, type, vol, t) {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(musicGain); o.start(t); o.stop(t + dur + .05);
    },
    duck(on) { if (musicGain && AC) musicGain.gain.setTargetAtTime(on ? .22 : .55, AC.currentTime, .1); },
  });

  /* ---------- 목소리 (기기에 들어 있는 무료 한국어 음성) ---------- */
  let ko = [], en = [];
  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    const all = speechSynthesis.getVoices() || [];
    ko = all.filter((v) => /^ko/i.test(v.lang) || /korean|한국/i.test(v.name));
    en = all.filter((v) => /^en[-_](US|GB)/i.test(v.lang));
  }
  /* 영어 낱말은 영어 목소리로 (Edge: Aria·Jenny, 안드로이드: Google 영어) */
  function pickEn() {
    if (!en.length) return null;
    const natural = (v) => /Natural|Online|Neural/i.test(v.name), fem = (v) => /Aria|Jenny|Ana|Michelle|Female|Samantha|Google US/i.test(v.name);
    return en.slice().sort((a, b) => natural(b) * 2 + fem(b) - (natural(a) * 2 + fem(a)))[0];
  }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  const FEMALE = /SunHi|선히|Heami|혜미|Yuna|유나|Seoyeon|서연|Female|여성/i, MALE = /InJoon|인준|Injoon|Gook|국|Minsu|민수|Male|남성/i;
  function pickVoice(kind) {
    if (!ko.length) return { v: null, shift: 1 };
    const natural = (v) => /Natural|Online|Neural/i.test(v.name);
    const by = (re) => ko.filter((v) => re.test(v.name)).sort((a, b) => natural(b) - natural(a))[0];
    if (kind === 'm') { const v = by(MALE); if (v) return { v, shift: 1 }; }
    if (kind === 'f') { const v = by(FEMALE); if (v) return { v, shift: 1 }; }
    const v = ko.slice().sort((a, b) => natural(b) - natural(a))[0];
    return { v, shift: kind === 'm' ? .72 : 1.06 };
  }
  E.voiceInfo = () => { const f = pickVoice('f').v; return f ? f.name : null; };
  E.cancelSpeech = () => { try { speechSynthesis.cancel(); } catch (e) {} };
  /* {Cat} 처럼 중괄호 안은 영어로 읽는다: "고양이는 {cat}!" */
  E.plain = (t) => (t || '').replace(/[{}]/g, '');
  E.speak = function (text, o = {}) {
    if (/\{[^}]+\}/.test(text) && !o.lang) {
      const parts = text.split(/(\{[^}]+\})/).filter((x) => x.trim());
      return parts.reduce((pr, x) => pr.then(() => (x[0] === '{' ? E.speak(x.slice(1, -1), { ...o, lang: 'en' }) : E.speak(x, o))), Promise.resolve());
    }
    return new Promise((res) => {
      const est = 500 + text.length * 190;
      if (E.fast) return setTimeout(res, 150);
      if (!E.settings.voice || !('speechSynthesis' in window)) return setTimeout(res, Math.min(est, 2500));
      const isEn = o.lang === 'en', pv = pickVoice(o.kind || 'f'), v = isEn ? pickEn() || pv.v : pv.v, shift = isEn ? 1 : pv.shift;
      if (!v) return setTimeout(res, est);
      let done = false;
      const fin = () => { if (!done) { done = true; clearTimeout(guard); Music.duck(false); res(); } };
      const guard = setTimeout(fin, est + 6000);
      const u = new SpeechSynthesisUtterance(text);
      u.voice = v; u.lang = isEn ? v.lang : 'ko-KR'; u.pitch = isEn ? Math.min(1.4, Math.max(.9, o.pitch || 1)) : Math.max(.1, Math.min(2, (o.pitch || 1) * shift)); u.rate = (o.rate || 1) * (isEn ? .8 : .92);
      u.onend = fin; u.onerror = fin;
      Music.duck(true);
      try { speechSynthesis.speak(u); } catch (e) { fin(); }
    });
  };

  /* ---------- 한 번의 재생(이야기, 놀이)을 다루는 Run ---------- */
  class Run {
    constructor() { this.alive = true; }
    check() { if (!this.alive) throw ABORT; }
    async wait(ms) { await E.sleep(E.fast ? ms * .25 : ms); this.check(); }
    async speak(t, o) { this.check(); await E.speak(t, o); this.check(); }
    stop() { this.alive = false; E.cancelSpeech(); }
  }
  E.Run = Run;

  /* ---------- 캐릭터 ---------- */
  class Actor {
    constructor(run, world, frames, x, y, h, opt = {}) {
      this.run = run; this.frames = frames; this.base = opt.base || '기본'; this.cur = null; this.talking = false;
      this.voice = opt.voice || { kind: 'f', pitch: 1.1, rate: 1 };
      this.el = E.h('div', { class: 'actor' }); this.inner = E.h('div'); this.el.append(this.inner);
      Object.assign(this.el.style, { left: x + 'px', top: y + 'px', height: h + 'px', zIndex: opt.z || 5 });
      world.append(this.el); this.world = world; this.set(this.base); this.blinkLoop();
      // 숨 쉬듯 살짝 커졌다 작아지는 움직임 (친구마다 박자가 조금씩 달라요)
      this.inner.style.transformOrigin = '50% 100%';
      try { this.inner.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.014,.982)' }, { transform: 'scale(1,1)' }], { duration: 2400 + Math.random() * 1200, iterations: Infinity, easing: 'ease-in-out', delay: -Math.random() * 2000 }); } catch (e) {}
      if (opt.onclick) { this.el.style.cursor = 'pointer'; this.el.addEventListener('click', opt.onclick); }
    }
    set(name) {
      if (!this.frames[name] || this.cur === name) return;
      this.cur = name; const html = this.frames[name];
      // 파일 그림은 다 받아진 뒤에 바꿔 끼운다 (빈 화면이 깜빡이지 않게). 처음 한 장은 바로.
      if (!this.inner.firstChild) { this.inner.innerHTML = html; return; }
      E.whenReady(html, () => { if (this.cur === name) this.inner.innerHTML = html; });
    }
    mood(name) { this.base = name; this.set(name); }
    blinkLoop() {
      setTimeout(() => {
        if (!this.el.isConnected) return;
        if (!this.talking && this.cur === this.base && this.base === '기본' && this.frames.blink) { this.set('blink'); setTimeout(() => this.set(this.base), 130); }
        this.blinkLoop();
      }, 2200 + Math.random() * 2600);
    }
    async say(text, o = {}) {
      this.talking = true; E.caption(this.run.cap, text);
      let open = false; const flap = setInterval(() => { open = !open; this.set(open ? 'talk' : this.base); }, 140);
      try { await this.run.speak(text, { ...this.voice, ...o }); }
      finally { clearInterval(flap); this.talking = false; this.set(this.base); E.caption(this.run.cap, null); }
    }
    anim(kf, ms, opt = {}) { return this.el.animate(kf, { duration: ms, easing: opt.ease || 'ease-in-out', fill: 'forwards', iterations: opt.it || 1 }).finished.catch(() => {}); }
    moveTo(x, y, ms, ease) {
      const fx = parseFloat(this.el.style.left), fy = parseFloat(this.el.style.top);
      // 옆으로 걸어갈 때는 발을 번갈아 든다 (걷기 그림이 있고, 표정이 기본·기쁨일 때)
      const walk = this.frames.walk1 && Math.abs(x - fx) > 40 && Math.abs(x - fx) > Math.abs(y - fy) && ms >= 300 && (this.base === '기본' || this.base === '기쁨');
      let i = 0; const steps = walk ? setInterval(() => { if (!this.talking) this.set(i++ % 2 ? 'walk2' : 'walk1'); }, 170) : null;
      return this.anim([{ transform: 'translate(0,0)' }, { transform: `translate(${x - fx}px,${y - fy}px)` }], ms, { ease }).then(() => {
        if (steps) { clearInterval(steps); if (!this.talking) this.set(this.base); }
        this.el.getAnimations().forEach((a) => a.cancel()); this.el.style.left = x + 'px'; this.el.style.top = y + 'px';
      });
    }
    /* 손 흔들어 인사 (그림이 없으면 몸을 살랑) */
    wave(times = 6) {
      if (!this.frames.wave1) return M.wiggle(this, 2);
      return new Promise((res) => { let i = 0; const t = setInterval(() => { if (!this.talking) this.set(i % 2 ? 'wave2' : 'wave1'); if (++i >= times) { clearInterval(t); if (!this.talking) this.set(this.base); res(); } }, 230); });
    }
    center() { const l = parseFloat(this.el.style.left), t = parseFloat(this.el.style.top); return { x: l + this.el.offsetWidth / 2, y: t, w: this.el.offsetWidth, h: this.el.offsetHeight }; }
    remove() { this.el.remove(); }
  }
  E.Actor = Actor;

  /* ---------- 움직임 ---------- */
  const M = (E.M = {
    bounce: (a, n = 3) => a.anim([{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(0) scale(1.08,.9)', offset: .15 }, { transform: 'translateY(-40px) scale(.95,1.06)', offset: .5 }, { transform: 'translateY(0) scale(1.08,.92)', offset: .85 }, { transform: 'translateY(0) scale(1,1)' }], 520, { it: n }),
    hop: (a) => a.anim([{ transform: 'translateY(0)' }, { transform: 'translateY(-28px)', offset: .5 }, { transform: 'translateY(0)' }], 340, { it: 2 }),
    wiggle: (a, n = 3) => a.anim([{ transform: 'rotate(0)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(7deg)' }, { transform: 'rotate(0)' }], 500, { it: n }),
    sway: (a, n = 2) => a.anim([{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg) translateX(-8px)' }, { transform: 'rotate(5deg) translateX(8px)' }, { transform: 'rotate(0)' }], 1100, { it: n }),
    shake: (a) => a.anim([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(0)' }], 360),
    pop: (a) => a.anim([{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: .7 }, { transform: 'scale(1)', opacity: 1 }], 420, { ease: 'ease-out' }),
    squash: (a) => a.anim([{ transform: 'scale(1.18,.8)' }, { transform: 'scale(.94,1.06)', offset: .5 }, { transform: 'scale(1,1)' }], 380, { ease: 'ease-out' }),
    jumpBig: (a) => a.anim([{ transform: 'translateY(0) scale(1.1,.88)' }, { transform: 'translateY(-90px) scale(.92,1.1)', offset: .45 }, { transform: 'translateY(0) scale(1.12,.88)', offset: .9 }, { transform: 'translateY(0) scale(1,1)' }], 800),
    dashFall: (a, dx = 140) => a.anim([{ transform: 'translateX(0) rotate(0)' }, { transform: `translateX(${dx}px) rotate(8deg)`, offset: .45 }, { transform: `translateX(${dx + 30}px) rotate(80deg) translateY(10px)`, offset: .62 }, { transform: `translateX(${dx + 30}px) rotate(80deg) translateY(10px)`, offset: .85 }, { transform: 'translateX(0) rotate(0)' }], 2000),
    driveIn: (a) => a.anim([{ transform: 'translateX(-620px)' }, { transform: 'translateX(18px)', offset: .8 }, { transform: 'translateX(-6px)', offset: .9 }, { transform: 'translateX(0)' }], 1500, { ease: 'ease-out' }),
    tumble: (a) => a.anim([{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(40px,-50px) rotate(180deg)', offset: .4 }, { transform: 'translate(80px,10px) rotate(360deg)', offset: .75 }, { transform: 'translate(80px,0) rotate(360deg) scale(1.1,.85)' }], 1100),
    lie: (a) => a.anim([{ transform: 'rotate(0)' }, { transform: 'rotate(-90deg)' }], 700, { ease: 'ease-in-out' }),
  });
  E.whenReady = (html, cb) => { const m = /^<img src="([^"]+)"/.exec(html || ''); if (!m) return cb(); const im = new Image(); im.src = m[1]; if (im.complete && im.naturalWidth) cb(); else { im.onload = cb; im.onerror = cb; } };
  E.waveEl = (el, key, times = 8) => {
    const F = FR[key]; if (!F || !F.wave1) return;
    const go = () => { let i = 0; const t = setInterval(() => { if (!el.isConnected) return clearInterval(t); el.innerHTML = F[i % 2 ? 'wave2' : 'wave1']; if (++i >= times) { clearInterval(t); el.innerHTML = F['기본']; } }, 260); };
    let ready = 0; E.whenReady(F.wave1, () => ++ready === 2 && go()); E.whenReady(F.wave2, () => ++ready === 2 && go());
  };
  E.cycle = (a, names, ms, times) => new Promise((res) => { let i = 0; const t = setInterval(() => { a.set(names[i % names.length]); i++; if (i >= times) { clearInterval(t); a.set(a.base); res(); } }, ms); });

  /* ---------- 효과 ---------- */
  const FXSVG = (E.FXSVG = {
    star: (c) => `<svg viewBox="-20 -20 40 40" width="40"><polygon points="0,-18 5,-6 18,-6 8,2 12,16 0,8 -12,16 -8,2 -18,-6 -5,-6" fill="${c || '#FFD230'}" stroke="#D9A900" stroke-width="2"/></svg>`,
    heart: (c) => `<svg viewBox="-20 -20 40 40" width="38"><path d="M0 14 C-22 0 -14 -18 0 -8 C14 -18 22 0 0 14Z" fill="${c || '#FF6F8E'}" stroke="#C93A5A" stroke-width="2"/></svg>`,
    note: (c) => `<svg viewBox="-20 -24 40 44" width="34"><path d="M4 12 L4 -18 L16 -21 L16 6" stroke="#2E2E44" stroke-width="4" fill="none"/><ellipse cx="0" cy="12" rx="6" ry="5" fill="${c || '#5A54D9'}"/><ellipse cx="12" cy="6" rx="6" ry="5" fill="${c || '#5A54D9'}"/></svg>`,
    sparkle: (c) => `<svg viewBox="-20 -20 40 40" width="30"><path d="M0 -18 Q3 -3 18 0 Q3 3 0 18 Q-3 3 -18 0 Q-3 -3 0 -18Z" fill="${c || '#FFF3A0'}" stroke="#FFD230" stroke-width="2"/></svg>`,
    dust: () => `<svg viewBox="-20 -20 40 40" width="46"><circle r="14" fill="#E9E2D6" stroke="#CFC4B0" stroke-width="2"/></svg>`,
    confetti: (c) => `<svg viewBox="-8 -5 16 10" width="16"><rect x="-8" y="-5" width="16" height="10" rx="2" fill="${c}"/></svg>`,
    bang: () => `<svg viewBox="-24 -30 48 60" width="44"><rect x="-8" y="-28" width="16" height="36" rx="8" fill="#F2453D" stroke="#A82A24" stroke-width="3"/><circle cy="20" r="8" fill="#F2453D" stroke="#A82A24" stroke-width="3"/></svg>`,
    q: () => `<svg viewBox="-24 -30 48 60" width="44"><text y="22" text-anchor="middle" font-size="56" font-weight="900" fill="#3E9BFF" stroke="#1F6FCC" stroke-width="2" font-family="system-ui">?</text></svg>`,
    sweat: () => `<svg viewBox="-12 -16 24 32" width="22"><path d="M0 -14 C8 0 10 6 0 14 C-10 6 -8 0 0 -14Z" fill="#8FD3FF" stroke="#3E9BFF" stroke-width="2"/></svg>`,
    zzz: () => `<svg viewBox="0 0 60 40" width="60"><text x="0" y="34" font-size="34" font-weight="900" fill="#5A54D9" font-family="system-ui">Z</text><text x="26" y="20" font-size="24" font-weight="900" fill="#7C77F0" font-family="system-ui">z</text></svg>`,
    leaf: () => `<svg viewBox="-12 -12 24 24" width="26"><path d="M-10 8 Q-12 -10 10 -10 Q12 10 -10 8Z" fill="#5CC85A" stroke="#3A9A3A" stroke-width="2"/></svg>`,
    bubble: () => `<svg viewBox="-12 -12 24 24" width="24"><circle r="10" fill="#fff" fill-opacity=".5" stroke="#fff" stroke-width="2"/></svg>`,
    butterfly: () => `<svg viewBox="-30 -24 60 48" width="62"><g class="wing"><ellipse cx="-14" cy="-8" rx="15" ry="12" fill="#FFD230" stroke="#D9A900" stroke-width="2"/><ellipse cx="-11" cy="10" rx="10" ry="8" fill="#FFB020" stroke="#D9A900" stroke-width="2"/><ellipse cx="14" cy="-8" rx="15" ry="12" fill="#FFD230" stroke="#D9A900" stroke-width="2"/><ellipse cx="11" cy="10" rx="10" ry="8" fill="#FFB020" stroke="#D9A900" stroke-width="2"/></g><rect x="-3" y="-14" width="6" height="28" rx="3" fill="#2E2E44"/><path d="M-2 -14 q-6 -10 -12 -12 M2 -14 q6 -10 12 -12" stroke="#2E2E44" stroke-width="2" fill="none"/></svg>`,
  });
  const CONF = ['#F2453D', '#FF8C2A', '#FFD230', '#4CC34A', '#3E9BFF', '#5A54D9', '#E040A8'];
  E.fx = function (world, type, x, y, n = 1, opt = {}) {
    for (let i = 0; i < n; i++) {
      const d = E.h('div', { class: 'fx', html: FXSVG[type](opt.color || (type === 'confetti' ? CONF[i % 7] : null)) });
      d.style.left = x + 'px'; d.style.top = y + 'px'; world.append(d);
      const ang = opt.spread ? (-Math.PI / 2 + (Math.random() - .5) * opt.spread) : -Math.PI / 2 + (i - (n - 1) / 2) * .5;
      const dist = (opt.dist || 90) * (.7 + Math.random() * .6);
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist + (opt.fall || 0);
      const rot = (Math.random() - .5) * (type === 'confetti' ? 720 : 60);
      d.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: `translate(calc(-50% + ${dx * .6}px),calc(-50% + ${dy * .6}px)) scale(1.1) rotate(${rot / 2}deg)`, opacity: 1, offset: .35 }, { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.9) rotate(${rot}deg)`, opacity: 0 }],
        { duration: (opt.ms || 1100) + Math.random() * 300, easing: 'ease-out', delay: i * (opt.stagger || 40) }).finished.then(() => d.remove()).catch(() => d.remove());
    }
  };
  /* 둥둥 떠다니는 반짝이 가루 (분위기) */
  E.ambient = function (box, n = 16, color = '#FFF6C8') {
    const layer = E.h('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden' } }); box.append(layer);
    for (let i = 0; i < n; i++) {
      const sz = E.rand(4, 11), d = E.h('i', { style: { position: 'absolute', left: E.rand(0, 100) + '%', top: E.rand(10, 95) + '%', width: sz + 'px', height: sz + 'px', borderRadius: '50%', background: color, boxShadow: `0 0 ${sz * 2}px ${sz / 2}px ${color}88`, opacity: 0 } });
      layer.append(d);
      d.animate([{ transform: 'translate(0,0)', opacity: 0 }, { opacity: .85, offset: .3 }, { transform: `translate(${E.rand(-60, 60)}px,${E.rand(-120, -40)}px)`, opacity: 0 }], { duration: E.rand(5000, 9000), iterations: Infinity, delay: -E.rand(0, 8000), easing: 'ease-in-out' });
    }
    return layer;
  };
  E.caption = function (cap, text) {
    if (!cap) return;
    if (text) { cap.textContent = E.plain(text); cap.style.display = 'block'; } else cap.style.display = 'none';
  };

  /* 3D 그림의 크기와 발 위치 (평면 그림이면 null) */
  E.meta = function (key, ex = '기본') {
    const f = window.FR && FR[key] && (FR[key][ex] || FR[key]['기본']); if (!f || typeof f !== 'string' || f.charAt(1) !== 'i') return null;
    const feet = /data-feet="([\d.]+)"/.exec(f), w = /\swidth="(\d+)"/.exec(f), h = /\sheight="(\d+)"/.exec(f);
    const px = /data-px="([\d.]+)"/.exec(f); // 한 칸(1단위)을 몇 픽셀로 그렸는지 (없으면 78)
    return feet && w && h ? { feet: +feet[1], w: +w[1], h: +h[1], px: px ? +px[1] : 78 } : null;
  };
  E.feetFrac = (key) => { const m = E.meta(key); return m ? m.feet / m.h : .94; };
  /* 월드(1000×560) 크기 맞추기 */
  E.fitWorld = function (box, world) {
    const fit = () => { const k = box.clientWidth / 1000; world.style.transform = `scale(${k})`; };
    fit(); return fit;
  };

  /* 칭찬·격려 말 (틀렸다고 말하지 않는다) */
  E.praise = ['맞아! 정말 잘했어!', '와, 찾았다! 최고야!', '짝짝짝! 잘했어!', '맞았어! 대단해!'];
  // 틀렸을 때: 평가하지 않고 부드럽게
  E.cheer = ['음, 이 친구는 아니네.', '다른 친구를 찾아볼까?', '천천히 해도 괜찮아.', '다시 찾아보자.', '힌트를 볼까?', '거의 다 왔어!'];
  // 맞았을 때: 매번 같은 말만 하지 않게
  E.praise = ['찾았네!', '딱 맞았어!', '우와!', '같이 해냈다!', '대단해!', '역시!'];
  E.say1 = (a) => a[Math.floor(Math.random() * a.length)];
})();
