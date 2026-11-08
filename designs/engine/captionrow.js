/* Photos side by side in a row: their captions run the same number of lines (the owner, 10/29/2026).
   Runs on every render (renderer/render.py, every design and piece kind) after the template's own checks. A failure
   goes back to the writer, who evens the lines out with real facts from the listing, never filler.
     CaptionRow.check() -> [{slot, kind:'caption-row-line-mismatch', detail}]   empty = passes
   A photo is a visible image (or a box with a background photo) at least 60 x 45 pt that is not a logo, headshot, plan,
   map or QR. Its caption is the text stacked straight under it: [data-slot] blocks whose middle sits over the photo,
   no wider than the photo plus a little, the first starting within 30 pt of the photo's foot and each next one of the same
   caption (same slot group) within 12 pt of the last. Photos on one page whose tops and heights line up (2 pt) and that
   don't overlap across are a row; a row of two
   or more captioned photos fails when the caption line counts differ. */
(function(){
  const PT = 96 / 72;
  const SKIP = /logo|headshot|portrait|plan|map|qr|badge|icon|signature/i;
  function visible(el){ const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity !== 0; }
  function skipped(el){
    for(let p = el; p && p !== document.body; p = p.parentElement){
      if(SKIP.test(p.className && p.className.baseVal != null ? p.className.baseVal : p.className || '') || SKIP.test(p.dataset && (p.dataset.slot || '') || '')) return true;
      if(p.classList && [...p.classList].some(c => /^cc(-|$)/.test(c))) return true;   // the contact card
    }
    return false;
  }
  function photos(){
    const out = [];
    const add = (el, src) => {
      if(!visible(el) || SKIP.test(src || '') || skipped(el)) return;
      const r = el.getBoundingClientRect(); if(r.width < 60 * PT || r.height < 45 * PT) return;
      out.push({el, r, page: el.closest('.page, [data-page], .pg') || document.body});
    };
    for(const im of document.querySelectorAll('img')) add(im, im.getAttribute('src'));
    for(const el of document.querySelectorAll('[style*="background-image"]')){
      const bg = getComputedStyle(el).backgroundImage; if(bg && bg !== 'none' && !el.querySelector('img')) add(el, bg);
    }
    // an image inside a photo frame counts once, at the frame (the frame is what lines up with its neighbors)
    return out.filter(p => !out.some(q => q !== p && q.el.contains(p.el)));
  }
  // distinct lines of text in an element: line boxes of its text, grouped by their middle
  // (one element or a caption's blocks together: a size set on its title's line is the same line, 11/3)
  function lines(els){
    const rg = document.createRange(), mids = [];
    for(const el of [].concat(els)){ const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while(w.nextNode()){
      const n = w.currentNode; if(!n.textContent.trim() || !visible(n.parentElement)) continue;
      rg.selectNodeContents(n);
      for(const r of rg.getClientRects()) if(r.width > 1 && r.height > 1) mids.push({m: (r.top + r.bottom) / 2, h: r.height});
    } }
    mids.sort((a, b) => a.m - b.m);
    let n = 0, last = -1e9, lh = 0;
    for(const x of mids){ if(x.m - last > Math.max(lh, x.h) * 0.5){ n++; last = x.m; lh = x.h; } }
    return n;
  }
  function captionFor(p, blocks){
    const r = p.r, below = blocks.filter(b => {
      const c = (b.r.left + b.r.right) / 2;
      return b.page === p.page && c > r.left && c < r.right && b.r.width <= r.width + 14 * PT && b.r.top >= r.bottom - 2 * PT;
    }).sort((a, b) => a.r.top - b.r.top);
    // one caption = the first block under the photo and the blocks of the same caption right under it (same slot group,
    // "cap0.name" then "cap0.text"); a heading or paragraph further down belongs to something else
    const group = b => (b.el.dataset.slot || '').replace(/\.[^.]*$/, '');
    const stack = []; let foot = r.bottom, gap = 30 * PT;
    // a block of the same caption may sit past an empty line kept for the row (a photo with no room size, 11/3): 30 pt
    for(const b of below){ const same = stack.length && group(b) === group(stack[0]);
      if(b.r.top - foot > (same ? 30 * PT : gap) || (stack.length && !same)) break; stack.push(b); foot = Math.max(foot, b.r.bottom); gap = 12 * PT; }
    return stack;
  }
  function check(){
    const ph = photos();
    // an empty line a caption keeps on purpose (data-optional: a room size the photo doesn't have) holds the row's lines even
    const blocks = [...document.querySelectorAll('[data-slot]')].filter(el => visible(el) && !el.querySelector('[data-slot]') && !skipped(el) &&
      (el.textContent.trim() || el.dataset.optional) && !ph.some(p => p.el.contains(el)))
      .map(el => ({el, r: el.getBoundingClientRect(), page: el.closest('.page, [data-page], .pg') || document.body}));
    const caps = new Map();
    for(const p of ph){ const s = captionFor(p, blocks); if(s.length) caps.set(p, s); }
    const done = new Set(), out = [];
    for(const p of caps.keys()){
      if(done.has(p)) continue;
      const row = [...caps.keys()].filter(q => q.page === p.page && Math.abs(q.r.top - p.r.top) <= 2 * PT && Math.abs(q.r.height - p.r.height) <= 2 * PT)
        .sort((a, b) => a.r.left - b.r.left);   // a row: same top, same height (a hero beside a small photo is not a row)
      row.forEach(q => done.add(q));
      if(row.length < 2 || row.some((q, i) => i && q.r.left < row[i - 1].r.right - 1)) continue;   // overlapping frames are a collage, not a row
      const counts = row.map(q => lines(caps.get(q).map(b => b.el)) + caps.get(q).filter(b => !b.el.textContent.trim()).length);
      if(new Set(counts).size > 1){
        const slots = row.map(q => caps.get(q).map(b => b.el.dataset.slot).join('+'));
        out.push({slot: slots.join(' | '), kind: 'caption-row-line-mismatch', slots: row.flatMap(q => caps.get(q).map(b => b.el.dataset.slot)),
          detail: `captions under photos side by side run ${counts.join(', ')} lines; they must match (the writer evens them out with real facts, never filler)`});
      }
    }
    return out;
  }
  window.CaptionRow = {check, lines};
})();
