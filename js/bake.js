/* 3D 그림 굽기: 주소 끝에 ?bake=1 을 붙여 이 컴퓨터(serve.py)에서 열면,
   실행 중에 그린 3D 그림을 전부 파일(img3d/)로 저장하고 js/baked.js 를 만든다.
   다음부터는 그림을 그리지 않고 파일을 바로 불러와서 앱이 곧장 열린다. */
(function () {
  const status = document.createElement('div');
  status.style.cssText = 'position:fixed;left:10px;top:10px;z-index:9999;background:#2A2350;color:#fff;padding:10px 16px;border-radius:12px;font:700 18px sans-serif';
  status.textContent = '3D 그림 그리는 중…'; (document.body || document.documentElement).append(status);

  const SRC = /<img src="(data:image\/(png|jpeg);base64,[^"]+)"([^>]*)>/;
  // PNG(투명) → WebP로 줄이기. 배경(JPEG)도 WebP로.
  function toWebp(url, q) {
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); c.toBlob((b) => res(b), 'image/webp', q); };
      im.src = url;
    });
  }
  const post = (path, body) => fetch('/bake/' + path, { method: 'POST', body }).then((r) => { if (!r.ok) throw new Error(path + ' ' + r.status); });

  async function bake() {
    const lines = [], files = [], ver = Date.now().toString(36); // ?v= 가 바뀌면 새 그림으로 받는다
    let n = 0;
    const one = async (html, name, q) => {
      const m = html && html.match(SRC); if (!m) return null;
      const blob = await toWebp(m[1], q), file = name + '.webp';
      await post('img3d/' + file, blob); files.push(file); n++;
      status.textContent = `파일로 저장 중… ${n}`;
      return html.replace(m[1], 'img3d/' + file + '?v=' + ver);
    };
    const keys = Object.keys(FR);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i], exs = Object.keys(FR[key]);
      for (let j = 0; j < exs.length; j++) {
        const out = await one(FR[key][exs[j]], `c${i}_${j}_${key.replace(/[^A-Za-z0-9]/g, '')}`, .9);
        if (out) lines.push(`F(${JSON.stringify(key)},${JSON.stringify(exs[j])},${JSON.stringify(out)});`);
      }
    }
    for (const k of Object.keys(BG)) {
      const out = await one(BG[k], 'bg_' + k.replace(/[^A-Za-z0-9]/g, ''), .88);
      if (out) lines.push(`BG[${JSON.stringify(k)}]=${JSON.stringify(out)};`);
    }
    const js = `/* 자동으로 만든 파일 (js/bake.js) — 직접 고치지 마세요. ${new Date().toISOString().slice(0, 10)} */
(function () {
  if (/[?&](bake|live)=1/.test(location.search) || !window.FR || !window.BG) return;
  window.BAKED = true;
  const F = (k, e, v) => { (FR[k] = FR[k] || {})[e] = v; };
${lines.map((l) => '  ' + l).join('\n')}
  window.MAP_HOT = ${JSON.stringify(window.MAP_HOT || null)};
  // 처음 한 번 화면에 쓰이는 모든 그림(캐릭터·배경·장난감 블록)을 실제 주소 그대로 미리 받아 두면, 인터넷이 끊겨도 보인다.
  setTimeout(() => {
    const urls = new Set(), grab = (h) => { if (typeof h === 'string') for (const m of h.matchAll(/src="(img3d\/[^"]+)"/g)) urls.add(m[1]); };
    Object.values(window.FR || {}).forEach((o) => Object.values(o).forEach(grab)); Object.values(window.BG || {}).forEach(grab);
    Object.values(window.TOYS || {}).forEach((t) => urls.add('img3d/' + t[0] + '?v=' + (window.TOY_V || 't1')));
    const list = [...urls]; let i = 0; const next = () => { for (let k = 0; k < 6 && i < list.length; k++) new Image().src = list[i++]; if (i < list.length) setTimeout(next, 120); };
    next();
  }, 1500);
})();
`;
    await post('js/baked.js', new Blob([js], { type: 'text/javascript' }));
    status.textContent = `다 됐어요! 그림 ${n}장 저장`; status.style.background = '#2E9E4A';
    window.BAKE_DONE = n;
  }

  const prev = window.onFR3D;
  window.onFR3D = (d) => { if (prev) prev(d); setTimeout(() => bake().catch((e) => { status.textContent = '실패: ' + e.message; status.style.background = '#C0392B'; console.error(e); }), 300); };
})();
