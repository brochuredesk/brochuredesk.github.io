/* Text nobody can read (11/16/2026: the Modern Chronicle Open House room captions ran under the contact card and read
   "...wood floors, with" with 0 hits; the build fails, not the owner's eye, owner 11/10/2026). Fail-level (level 'fail'), on every single-page
   piece (renderer/render.py render_single). Reads only; the page is unchanged.
     text-covered: a line of text has something drawn over it (a box with a fill, a photo, a logo, another block of text) that is
                   not part of the text's own box: the text runs under the contact card, a photo or a panel.
     text-hidden:  a whole line of text sits outside a box that hides its overflow, so the text stops mid-sentence (PrintChecks'
                   text-clipped catches letters partly cut; a line wholly past the edge was left to the overflow check, which a
                   box drawn for fewer lines than the text needs did not catch).
   Each line of every visible text node is tested at the middle of each word's letters; one hit per text block.
     TextHidden.check() -> [{slot, kind, by?, text}] */
(function(){
  const transparent = c => !c || c === 'transparent' || /rgba\([^)]*,\s*0(\.0*)?\)$/.test(c);
  const alpha = c => { const m = /rgba\([^)]*,\s*([\d.]+)\)$/.exec(c || ''); return m ? +m[1] : 1; };
  const visible = el => { for(let e = el; e && e.nodeType === 1; e = e.parentElement){ const s = getComputedStyle(e);
    if(s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return true; };
  // something that draws over what is under it: a fill at least half opaque, a picture, or its own visible text
  // a transparent image (a logo) draws only where its pixels have ink: the mask from the renderer, mapped through object-fit/position
  let MASKS = {};
  const imgInk = (img, x, y) => { const m = MASKS[img.currentSrc || img.src]; if(!m || !img.naturalWidth) return true;
    const r = img.getBoundingClientRect(), s = getComputedStyle(img), nw = img.naturalWidth, nh = img.naturalHeight;
    let w = r.width, h = r.height;
    if(s.objectFit === 'contain' || s.objectFit === 'scale-down'){ const k = Math.min(r.width/nw, r.height/nh, s.objectFit === 'scale-down' ? 1 : 1e9); w = nw*k; h = nh*k; }
    else if(s.objectFit === 'cover'){ const k = Math.max(r.width/nw, r.height/nh); w = nw*k; h = nh*k; }
    else if(s.objectFit === 'none'){ w = nw; h = nh; }
    const [px, py] = (s.objectPosition || '50% 50%').split(' ').map(v => v.endsWith('%') ? parseFloat(v)/100 : null);
    const ox = r.left + (r.width - w) * (px == null ? .5 : px), oy = r.top + (r.height - h) * (py == null ? .5 : py);
    const u = (x - ox) / w, v = (y - oy) / h; if(u < 0 || u >= 1 || v < 0 || v >= 1) return false;
    return m.rows[Math.floor(v*m.h)][Math.floor(u*m.w)] === '1'; };
  const paints = (el, x, y) => { const s = getComputedStyle(el);
    if(el.tagName === 'IMG') return x == null || imgInk(el, x, y);
    if(/^(CANVAS|VIDEO)$/i.test(el.tagName)) return true;
    // an svg's own box draws nothing (a full-page drawing layer over the text); its shapes count where the hit test lands on their
    // fill or stroke (visiblePainted), and only when that paint is not see-through
    if(el instanceof SVGElement){ if(!(el instanceof SVGGeometryElement || /^(text|image|use)$/i.test(el.tagName))) return false;
      const f = s.fill, k = s.stroke; return +s.opacity >= .5 && ((f && f !== 'none' && !transparent(f) && +s.fillOpacity >= .5) || (k && k !== 'none' && !transparent(k) && +s.strokeOpacity >= .5)); }
    if(+s.opacity < .5) return false;
    if(!transparent(s.backgroundColor) && alpha(s.backgroundColor) >= .5) return true;
    if(s.backgroundImage && s.backgroundImage !== 'none' && !/gradient/.test(s.backgroundImage)) return true;
    return false; };
  // other text counts only where its own letters are: a wide text box whose words sit elsewhere covers nothing (11/16/2026 triage:
  // the Atlas fine print, Poster's JUST SOLD box and Room Proportions' scale ticks read as covering text their letters never touch)
  // each word's own box (small even when the text is rotated, where a line's box is a wide slanted bounding square)
  const wordBoxes = node => { const rg = document.createRange(), out = [], re = /\S+/g, t = node.textContent; let m;
    while((m = re.exec(t))){ rg.setStart(node, m.index); rg.setEnd(node, m.index + m[0].length); const q = rg.getBoundingClientRect(); if(q.width > .5 && q.height > .5) out.push(q); }
    return out; };
  // ...trimmed top and bottom to the letters' own ink (a display face's box runs well above its capitals and below its baseline)
  const ctx = document.createElement('canvas').getContext('2d');
  // a word's ink, top to bottom: {t, b} inside its box q (canvas metrics: the font's box is centred on the line, the letters sit on its baseline)
  const inkY = (e, q, w) => { const st = getComputedStyle(e); ctx.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
    const m = ctx.measureText(st.textTransform === 'uppercase' ? w.toUpperCase() : w), fa = m.fontBoundingBoxAscent, fd = m.fontBoundingBoxDescent;
    const base = q.top + (q.height - (fa + fd)) / 2 + fa; return {t: base - m.actualBoundingBoxAscent, b: base + m.actualBoundingBoxDescent}; };
  const words = n => (n.textContent.match(/\S+/g) || []);
  const inkAt = (e, x, y) => { if(e.children.length || !e.textContent.trim() || !visible(e)) return false;
    return [...e.childNodes].filter(c => c.nodeType === 3).some(c => { const ws = words(c);
      return wordBoxes(c).some((q, i) => { const k = inkY(e, q, ws[i] || 'x'); return x >= q.left && x <= q.right && y >= k.t && y <= k.b; }); }); };
  const name = el => { const s = el.closest('[data-slot]'); if(s && s.dataset.slot) return s.dataset.slot;
    const c = el.closest('.cc, .agentcard, .contact-card'); if(c) return 'contact card';
    const p = el.closest('[data-photo]'); if(p) return 'photo ' + p.dataset.photo;
    return (el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '')).slice(0, 50); };
  // the window a text node is clipped to: its own box and every ancestor that hides overflow
  const clipOf = el => { let r = {l: -1e9, t: -1e9, r: 1e9, b: 1e9, by: null};
    for(let e = el; e && e !== document.body; e = e.parentElement){ const s = getComputedStyle(e);
      if(s.overflowX !== 'visible' || s.overflowY !== 'visible'){ const b = e.getBoundingClientRect();
        const n = {l: s.overflowX !== 'visible' ? Math.max(r.l, b.left) : r.l, r: s.overflowX !== 'visible' ? Math.min(r.r, b.right) : r.r,
                   t: s.overflowY !== 'visible' ? Math.max(r.t, b.top) : r.t, b: s.overflowY !== 'visible' ? Math.min(r.b, b.bottom) : r.b};
        if(n.l > r.l || n.r < r.r || n.t > r.t || n.b < r.b) n.by = e; else n.by = r.by;
        r = n; } }
    return r; };

  function check(root, masks){
    MASKS = masks || {};
    root = root || document.getElementById('pages') || document.body;
    const out = [], seen = new Set(), tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    // the page can be taller than the window: points are tested in page coordinates, scrolling each into view first
    const sx0 = scrollX, sy0 = scrollY; scrollTo(0, 0);
    // elementsFromPoint skips anything set pointer-events:none, so text in such a layer (the Chronicle plan board's labels) read as covered
    // by the box under it: every element takes part in the hit test while the check runs (samplehouse-1115, 11/16/2026)
    const pe = document.createElement('style'); pe.textContent = '*{pointer-events:auto !important}'; document.head.appendChild(pe);
    const at = (x, y) => { if(y - scrollY < 1 || y - scrollY > innerHeight - 1 || x - scrollX < 1 || x - scrollX > innerWidth - 1) scrollTo(Math.max(0, x - innerWidth/2), Math.max(0, y - innerHeight/2));
      return document.elementsFromPoint(x - scrollX, y - scrollY); };
    const lines = [];
    for(let n; (n = tw.nextNode());){
      const el = n.parentElement, txt = n.textContent.trim();
      if(!txt || !el || !visible(el) || el.closest('[data-twin],[data-clear-skip],[data-hidden-ok],script,style')) continue;
      const block = el.closest('[data-slot]') || el;
      if(seen.has(block)) continue;
      const clip = clipOf(el), rg = document.createRange(); rg.selectNodeContents(n);
      const ws = words(n); lines.push({n, el, txt, block, clip, rects: [...rg.getClientRects()], words: wordBoxes(n).map((q, i) => { const k = inkY(el, q, ws[i] || 'x'); return {q, y: (k.t + k.b) / 2}; })});
    }
    for(const {el, txt, block, clip, rects, words} of lines){
      if(seen.has(block)) continue;
      for(const r of rects){
        if(r.width < 2 || r.height < 2) continue;
        const y = r.top + r.height / 2;
        // the points tested: the middle of each word on this line (a rotated line's box holds words of other lines and empty corners)
        const pts = words.filter(({q}) => { const cx = q.left + q.width/2, cy = q.top + q.height/2; return cx >= r.left - .5 && cx <= r.right + .5 && cy >= r.top - .5 && cy <= r.bottom + .5; })
          .map(({q, y}) => [q.left + q.width/2, y]);   // the middle of the word's letters, not of its box
        // cut off: the middle of the line falls outside a box that hides overflow (by more than a pixel)
        if(clip.by && (y < clip.t - 1 || y > clip.b + 1 || r.left + r.width * .5 > clip.r + 1 || r.left + r.width * .5 < clip.l - 1)){
          out.push({level: 'fail', slot: name(block), kind: 'text-hidden', by: name(clip.by), text: txt.slice(0, 60)}); seen.add(block); break; }
        // covered: walk what is stacked at the point from the top down to the text's own element
        let hit = null;
        for(const [x, wy] of pts){
          for(const e of at(x, wy)){
            if(e === el || el.contains(e)) break;          // reached the text (or its own inline parts): nothing above it
            if(e.contains(el)) break;                       // a box that holds the text draws under it
            if(paints(e, x - scrollX, wy - scrollY) || inkAt(e, x - scrollX, wy - scrollY)){ hit = e; break; }
          }
          if(hit) break;
        }
        if(hit){ out.push({level: 'fail', slot: name(block), kind: 'text-covered', by: name(hit), text: txt.slice(0, 60)}); seen.add(block); break; }
      }
    }
    pe.remove(); scrollTo(sx0, sy0);
    return out;
  }
  window.TextHidden = {check};
})();
