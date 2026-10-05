/* 이모지(그림 문자)를 '장난감 블록에 붙은 3D 그림'으로 바꿔 보여 준다.
   그림 파일과 목록은 toy_gen.html 이 만든다 (js/toys.js 의 window.TOYS). 목록에 없는 이모지는 그대로 문자로 보인다. */
(function () {
  const T = window.TOYS; if (!T) return;
  const UI = '✓➡'; // 체크 표시·화살표는 화면 기호라서 그대로 둔다
  const keys = Object.keys(T).filter((k) => !UI.includes(k)).sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 변형선택자(FE0F)가 붙어 있어도 같은 그림으로 본다
  const re = new RegExp('(' + keys.map((k) => esc(k) + '\\uFE0F?').join('|') + ')', 'g');
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, NOSCRIPT: 1 };
  const url = (e) => 'img3d/' + T[e][0] + '?v=' + (window.TOY_V || 't1');

  function img(e) {
    const im = document.createElement('img');
    im.src = url(e); im.alt = e; im.draggable = false; im.className = 'toy'; im.dataset.emo = e; return im;
  }
  function convert(node) {
    const txt = node.nodeValue; re.lastIndex = 0; if (!re.test(txt)) return; re.lastIndex = 0;
    const frag = document.createDocumentFragment(); let last = 0, m, run = [];
    // 붙어 있는 이모지(🍓🍓🍓)는 한 묶음으로 만들어, 칸 안에서 줄을 바꿔 가며 작게 보이게 한다 (개수 세기 놀이용)
    const flush = () => {
      if (run.length > 1) { const sp = document.createElement('span'); sp.className = 'toyrun'; sp.dataset.n = Math.min(run.length, 6); run.forEach((e) => sp.append(img(e))); frag.append(sp); }
      else if (run.length === 1) frag.append(img(run[0]));
      run = [];
    };
    while ((m = re.exec(txt))) {
      if (m.index > last) { flush(); frag.append(txt.slice(last, m.index)); }
      run.push(m[0].replace(/️/g, '')); last = m.index + m[0].length;
    }
    flush();
    if (last < txt.length) frag.append(txt.slice(last));
    node.parentNode.replaceChild(frag, node);
  }
  function scan(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (root.parentNode && !SKIP[root.parentNode.nodeName]) convert(root); return; }
    if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [];
    while (w.nextNode()) { const n = w.currentNode; if (n.nodeValue.length && !SKIP[n.parentNode.nodeName]) list.push(n); }
    list.forEach(convert);
  }
  let pending = new Set(), queued = false;
  const flush = () => { queued = false; const p = pending; pending = new Set(); p.forEach((n) => { if (n.isConnected) scan(n); }); };
  const add = (n) => { pending.add(n); if (!queued) { queued = true; setTimeout(flush, 16); } };
  new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') add(m.target); else m.addedNodes.forEach(add); } }).observe(document.documentElement, { childList: true, characterData: true, subtree: true });
  if (document.body) scan(document.body); else document.addEventListener('DOMContentLoaded', () => scan(document.body));
  window.TOY ={ scan, has: (e) => keys.includes(e.replace(/️/g, '')) };
})();
