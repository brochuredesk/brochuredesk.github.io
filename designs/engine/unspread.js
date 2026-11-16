/* templates/_shared/unspread.js: wide justified gaps set ragged (11/16/2026; the owner's round 3 ruling on Outside First carried to every piece:
   "wide gaps set ragged instead", and 11/10 "never spread words"). Runs after a piece lays out, in the print renderer (renderer/render.py _load)
   and on the order page (order/agent.js), the same as AddressFit and ShrinkFit, so the proof and the print file match.

   A justified text box whose widest word gap (any line but the last) runs past the word-gap check's limit (config/print-checks.json gapRatio,
   gapEm; the same measure as templates/_shared/printchecks.js word-gap-wide) is set ragged instead, but only when every line of it, set ragged,
   still reaches 80% of the box and the last line keeps the width it had (the write-up rules: 80% lines, last line 90%). Otherwise it stays
   justified and the check reports it, so the copy gets fixed.

     Unspread.run({gapRatio: 3.5, gapEm: 0.75, lineMin: 0.8}) -> [{slot, ratio}] the boxes it set ragged */
(function(){
  const ctx = document.createElement('canvas').getContext('2d');
  const words = t => String(t || '').trim().split(/\s+/).filter(Boolean);
  const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  // the widest word gap on any line but the last, over a normal space ({ratio, worst, normal, fs})
  function gap(el){
    const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize) || 10; ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const normal = ctx.measureText(' ').width + (parseFloat(cs.wordSpacing) || 0) + (parseFloat(cs.letterSpacing) || 0);
    const by = {}, tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), rg = document.createRange();
    for(let n = tw.nextNode(); n; n = tw.nextNode()){ const s = n.textContent;
      for(let i = 0; i < s.length; i++){ if(s[i] !== ' ') continue; rg.setStart(n, i); rg.setEnd(n, i + 1); const q = rg.getBoundingClientRect(); if(q.width > 0) (by[Math.round(q.top)] = by[Math.round(q.top)] || []).push(q.width); } }
    const ks = Object.keys(by).map(Number).sort((a, b) => a - b).slice(0, -1); let worst = 0; for(const k of ks) worst = Math.max(worst, ...by[k]);
    return {ratio: worst/normal, worst, normal, fs};
  }
  // each line's inked width over the box's inner width, top to bottom
  function lineFills(el){
    const cs = getComputedStyle(el), r = el.getBoundingClientRect(), inner = r.width - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    const rg = document.createRange(); rg.selectNodeContents(el); const by = {};
    for(const q of rg.getClientRects()){ if(q.width < .5 || q.height < .5) continue; const k = Math.round(q.top); const o = by[k] = by[k] || {l: Infinity, r: -Infinity}; o.l = Math.min(o.l, q.left); o.r = Math.max(o.r, q.right); }
    return Object.keys(by).map(Number).sort((a, b) => a - b).map(k => (by[k].r - by[k].l)/inner);
  }
  function run(o){
    o = Object.assign({gapRatio: 3.5, gapEm: 0.75, lineMin: 0.8}, o || {}); const out = [];
    for(const el of document.querySelectorAll('[data-slot], p')){
      if(!vis(el) || el.querySelector('[data-slot]')) continue;
      const cs = getComputedStyle(el); if(!/justify/.test(cs.textAlign) || words(el.textContent).length < 6) continue;
      const g = gap(el); if(!(g.ratio > o.gapRatio && g.worst - g.normal > g.fs*o.gapEm)) continue;
      const before = lineFills(el), ta = el.style.textAlign, tal = el.style.textAlignLast;
      el.style.textAlign = 'left'; el.style.textAlignLast = 'auto';
      const after = lineFills(el);
      const ok = after.length === before.length && after.every(f => f >= o.lineMin - 1e-3) && after[after.length - 1] >= before[before.length - 1] - 0.01;
      if(ok){ el.dataset.ragged = '1'; out.push({slot: el.dataset.slot || 'p', ratio: +g.ratio.toFixed(2)}); }
      else { el.style.textAlign = ta; el.style.textAlignLast = tal; }
    }
    return out;
  }
  window.Unspread = {run, gap, lineFills};
})();
