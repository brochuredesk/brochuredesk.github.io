/* Text under a photo fills the photo's width (the owner, 11/8/2026, FX kitchen box full bullets review p2/p3, standing rule for every
   design and piece): every line of a caption or write-up set under a photo runs at least 80% of that photo's width (ideally 90%+),
   so the right edge of the text lines up under the photo. Never fixed by shortening: fuller true facts or bigger type.
     CaptionFill.check() -> [{slot, kind:'caption-line-short', pct, line, lines, detail}]   empty = passes
   A photo and its caption are found the same way as captionrow.js (the text stacked straight under a photo). One-line room labels
   (slots ending in label/name/title/kicker/size/heading, or a single line of 5 words or fewer) are names, not write-ups, and are left out.
   Runs on every render (renderer/render.py fact_repeats). */
(function(){
  const PT = 96 / 72, MIN = 0.8;
  const SKIP = /logo|headshot|portrait|plan|map|qr|badge|icon|signature/i;
  const LABEL = /(label|name|title|kicker|size|heading|head|lbl|\.q|address|place|addr|headline|location|\.h)$/i;   // headings, questions and addresses are names, not write-ups
  function visible(el){ const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity !== 0; }
  function skipped(el){
    for(let p = el; p && p !== document.body; p = p.parentElement){
      if(SKIP.test(p.className && p.className.baseVal != null ? p.className.baseVal : p.className || '') || SKIP.test(p.dataset && (p.dataset.slot || '') || '')) return true;
      if(p.classList && [...p.classList].some(c => /^cc(-|$)/.test(c))) return true;
    }
    return false;
  }
  // the part of a photo that shows: a zoomed or cropped image is clipped by its frame (overflow hidden), so measure the frame's window
  function clipRect(el){
    const r0 = el.getBoundingClientRect(); let l = r0.left, t = r0.top, rr = r0.right, b = r0.bottom;
    for(let p = el.parentElement; p && p !== document.body; p = p.parentElement){
      const cs = getComputedStyle(p); if(!/(hidden|clip)/.test(cs.overflow + cs.overflowX + cs.overflowY)) continue;
      const q = p.getBoundingClientRect(); l = Math.max(l, q.left); t = Math.max(t, q.top); rr = Math.min(rr, q.right); b = Math.min(b, q.bottom);
    }
    return {left: l, top: t, right: rr, bottom: b, width: Math.max(0, rr - l), height: Math.max(0, b - t)};
  }
  function photos(){
    const out = [];
    const add = (el, src) => {
      if(!visible(el) || SKIP.test(String(src || '').split(/[\\/]/).pop()) || skipped(el)) return;   // the file name only: an upscaled photo's folder can be named for the plan version
      const r = clipRect(el); if(r.width < 60 * PT || r.height < 45 * PT) return;
      out.push({el, r, page: el.closest('.page, [data-page], .pg') || document.body});
    };
    for(const im of document.querySelectorAll('img')) add(im, im.getAttribute('src'));
    for(const el of document.querySelectorAll('[style*="background-image"]')){
      const bg = getComputedStyle(el).backgroundImage; if(bg && bg !== 'none' && !el.querySelector('img')) add(el, bg);
    }
    return out.filter(p => !out.some(q => q !== p && q.el.contains(p.el)));
  }
  // each line of the text: its left and right edge (line boxes grouped by their middle)
  function lineBoxes(el){
    const rg = document.createRange(), rs = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while(w.nextNode()){
      const n = w.currentNode; if(!n.textContent.trim() || !visible(n.parentElement)) continue;
      // per word, so a justified line's trailing space never counts
      const t = n.textContent, re = /\S+/g; let m;
      while((m = re.exec(t))){ rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        for(const r of rg.getClientRects()) if(r.width > .5 && r.height > .5) rs.push(r); }
    }
    const lines = [];
    for(const r of rs){ const m = (r.top + r.bottom) / 2; const l = lines.find(x => Math.abs(x.m - m) < r.height * .5);
      if(l){ l.l = Math.min(l.l, r.left); l.r = Math.max(l.r, r.right); } else lines.push({m, l: r.left, r: r.right, h: r.height}); }
    return lines.sort((a, b) => a.m - b.m);
  }
  function captionFor(p, blocks){
    const r = p.r, below = blocks.filter(b => {
      const c = (b.r.left + b.r.right) / 2;
      return b.page === p.page && c > r.left && c < r.right && b.r.width <= r.width + 14 * PT && b.r.width >= r.width * .5 && b.r.top >= r.bottom - 2 * PT;   // a facts band of small cells under a photo is not a caption
    }).sort((a, b) => a.r.top - b.r.top);
    const group = b => (b.el.dataset.slot || '').replace(/\.[^.]*$/, '');
    const stack = []; let foot = r.bottom, gap = 30 * PT;
    for(const b of below){ if(b.r.top - foot > gap || (stack.length && group(b) !== group(stack[0]) && (b.el.dataset.slot || '') !== group(stack[0]) && group(b) !== (stack[0].el.dataset.slot || ''))) break; stack.push(b); foot = Math.max(foot, b.r.bottom); gap = 12 * PT; }
    return stack;
  }
  function check(){
    const ph = photos();
    const blocks = [...document.querySelectorAll('[data-slot]')].filter(el => visible(el) && !el.querySelector('[data-slot]') && !skipped(el) &&
      el.textContent.trim() && !ph.some(p => p.el.contains(el)))
      .map(el => ({el, r: el.getBoundingClientRect(), page: el.closest('.page, [data-page], .pg') || document.body}));
    const out = [], seen = new Set();
    for(const p of ph){
      for(const b of captionFor(p, blocks)){
        if(seen.has(b.el)) continue; seen.add(b.el);
        const slot = b.el.dataset.slot || '';
        if(LABEL.test(slot)) continue;
        const L = lineBoxes(b.el);
        if(!L.length) continue;
        if(L.length === 1 && b.el.textContent.trim().split(/\s+/).length <= 5) continue;   // a room name, not a write-up
        // a column the design sets narrower than the photo (beside a badge or circle) is measured against its own width; a caption the fitter
        // narrowed (data-w0 / data-narrow) or any block 80%+ as wide as the photo is measured against the photo
        const own = b.r.width, fitted = !!b.el.closest('.cap') && b.el.dataset.w0 != null && +b.el.dataset.w0 - own * .75 > 1;   // a photo caption the fitter narrowed (a write-up column set narrower by design is measured on its own width)   // the fitter narrowed this box below its own width
        const W = (own < p.r.width * .8 && !fitted) ? own : p.r.width;
        // owner 11/9 (kitchen box full bullets p4): a write-up that wraps around a title circle (class wrapc): a line beside the circle is
        // measured against the room the circle leaves it (up to the circle's edge, less its 10 pt margin)
        const circ = b.el.classList.contains('wrapc') ? [...document.querySelectorAll('.badge')].filter(c => visible(c)).map(c => c.getBoundingClientRect()) : [];
        const room = x => { let w = W; for(const c of circ){ const cy = (c.top + c.bottom) / 2, rr = c.width / 2, top = x.m - x.h / 2, bot = x.m + x.h / 2, dy = cy < top ? top - cy : cy > bot ? cy - bot : 0;
          if(dy < rr + 10 * PT && c.left > x.l){ const edge = (c.left + c.right) / 2 - Math.sqrt(Math.max(0, (rr + 10 * PT) ** 2 - dy ** 2)); w = Math.min(w, Math.max(1, edge - x.l)); } } return w; };
        const pcts = L.map(x => (x.r - x.l) / room(x)), min = Math.min(...pcts), i = pcts.indexOf(min);
        if(min < MIN - 0.005) out.push({slot, kind: 'caption-line-short', pct: Math.round(min * 100), line: i + 1, lines: L.length,
          detail: `line ${i + 1} of ${L.length} runs ${Math.round(min * 100)}% of ${W === own && own < p.r.width * .8 ? 'its column' : "the photo's width"} (every line 80%+, ideally 90%; owner 11/8): fuller true facts or bigger type, never shorter`});
      }
    }
    return out;
  }
  window.CaptionFill = {check};
})();
