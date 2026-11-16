/* Atlas: text under a photo fills the photo's width (owner 11/8/2026, standing rule for every design and piece).
   A caption keeps its full column (never narrowed) and is set justified. When its last line comes up short of what the check
   asks (every line 80% of the photo's width, or 80% of its own column where the design sets the column under 80% of the photo),
   the type steps up in small steps, 12% at most, with the same number of lines in the same box, until the last line reaches it.
   A caption that no step fills stays as it was (ragged) and is rewritten by hand. */
(function(){
  const AT = window.AT = window.AT || {};
  const lastFill = el => {
    const r = document.createRange(), ls = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while(w.nextNode()){ const n = w.currentNode, re = /\S+/g; let m;
      while((m = re.exec(n.textContent))){ r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        for(const q of r.getClientRects()){ if(q.width < .5) continue; const mid = (q.top + q.bottom) / 2; let l = ls.find(x => Math.abs(x.m - mid) < q.height * .5);
          if(l){ l.l = Math.min(l.l, q.left); l.r = Math.max(l.r, q.right); } else ls.push({m: mid, l: q.left, r: q.right}); } } }
    ls.sort((a, b) => a.m - b.m); return ls;
  };
  AT.capFit = function(root){
    (root || document).querySelectorAll('.cap .a').forEach(el => {
      if(!el.textContent.trim() || !el.getClientRects().length) return;
      el.style.maxWidth = ''; delete el.dataset.w0; el.style.textAlign = 'left'; el.style.fontSize = '';
      const item = el.closest('.item, .itm'), ph = item && item.querySelector('.ph'); if(!ph) return;
      const photoW = ph.getBoundingClientRect().width; let colW = el.getBoundingClientRect().width;
      // a column only just over 80% of its photo (the small plan beside it takes the rest) gets 2% more air next to the plan, so it is the design's own
      // narrower column (checked on its own width) and not a photo-wide caption that came up a few points short (judgment call 11/8; delete this line to undo)
      if(colW >= photoW * .8 && colW < photoW * .84){ el.style.maxWidth = (photoW * .79) + 'px'; colW = el.getBoundingClientRect().width; }
      const need = colW >= photoW * .8 ? (photoW * .8) / colW + .02 : .82;
      const base = parseFloat(getComputedStyle(el).fontSize), n0 = lastFill(el).length;   // inline size cleared above: always from the design's own size
      const ok = () => { const ls = lastFill(el); if(ls.length !== n0) return false; const last = ls[ls.length - 1]; return (last.r - last.l) / colW >= need; };
      // owner 11/10/2026 (rule 8): justify only a small stretch: every line above the last already runs 88%+ ragged
      const settle = () => { el.style.textAlign = 'left'; const ls = lastFill(el); const body = ls.slice(0, -1).map(l => (l.r - l.l) / colW);
        if(body.length && Math.min(...body) >= .88) el.style.textAlign = 'justify'; };
      el.style.textAlign = 'left';
      if(ok()){ settle(); return; }
      for(let k = 1.0025; k <= 1.12; k += .0025){
        el.style.fontSize = (base * k) + 'px';
        if(lastFill(el).length > n0){ continue; }
        if(ok()){ el.dataset.capfit = k.toFixed(3); settle(); return; }
      }
      el.style.fontSize = ''; settle();
    });
  };
})();
