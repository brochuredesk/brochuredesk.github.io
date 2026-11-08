// HeadTouch: a headline letter never touches the line below it (owner 11/8/2026, FXS-14 review p19, p23, p25.1: the J of
// "Just Listed" ran into the address). Part of the cut-off-letter print check; every piece of every design gets it (renderer
// fact_repeats hook).
//
// Every letter set at 20 pt or more is a headline letter. Its real ink (the drawn glyph, script swash and tail included, read
// column by column from a canvas) must stay at least 3 pt above the ink of any letter in another text block below it. Letters of
// one script lockup (another headline-size block in the same font, e.g. the stacked "Just / Sold") nest on purpose and are not checked
// against each other.
(function(){
  const HEAD_PT = 20, CLEAR_PT = 3, PX = 96/72;
  let cv = null; const prof = new Map();
  const box = (ch, font) => { cv = cv || document.createElement('canvas').getContext('2d'); cv.font = font; const m = cv.measureText(ch), f = cv.measureText('Hg');
    return {l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent, fa: f.fontBoundingBoxAscent, fd: f.fontBoundingBoxDescent}; };
  // the bottom of a glyph's ink per pixel column, measured from the ink top, cached per font and letter
  const profile = (ch, font) => { const key = font + '|' + ch; if(prof.has(key)) return prof.get(key);
    const k = box(ch, font), w = Math.ceil(k.l + k.r) + 4, h = Math.ceil(k.a + k.d) + 4, c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h);
    const g = c.getContext('2d'); g.font = font; g.fillStyle = '#000'; g.fillText(ch, k.l + 2, k.a + 2);
    const d = g.getImageData(0, 0, c.width, c.height).data, bot = new Array(c.width).fill(-1);
    for(let x = 0; x < c.width; x++) for(let y = c.height - 1; y >= 0; y--) if(d[(y*c.width + x)*4 + 3] > 40){ bot[x] = y - 2; break; }
    const r = {bot, ox: k.l + 2}; prof.set(key, r); return r; };
  const letters = () => { const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), rg = document.createRange();
    for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement, t = n.textContent; if(!p || !t.trim() || p.closest('script, style, svg, [aria-hidden="true"]')) continue;
      const cs = getComputedStyle(p); if(cs.visibility === 'hidden' || +cs.opacity === 0 || !p.getClientRects().length) continue;
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, up = cs.textTransform === 'uppercase', blk = p.closest('[data-slot]') || p, pt = parseFloat(cs.fontSize)/PX;
      for(let i = 0; i < t.length; i++){ let ch = t[i]; if(!ch.trim()) continue; if(up) ch = ch.toUpperCase();
        rg.setStart(n, i); rg.setEnd(n, i + 1); const r = rg.getClientRects()[0]; if(!r || r.width < .1) continue;
        const k = box(ch, font), sc = r.height/((k.fa + k.fd) || r.height), base = r.top + k.fa*sc;
        out.push({ch, font, fam: cs.fontFamily, sc, blk, pt, x0: r.left, l: r.left - k.l*sc, r: r.left + k.r*sc, t: base - k.a*sc, b: base + k.d*sc, text: t.trim().slice(0, 40)}); } }
    return out; };
  const check = () => { const L = letters(), out = [], seen = new Set(), clr = CLEAR_PT*PX;
    L.filter(h => h.pt >= HEAD_PT).forEach(h => { let pr = null;
      L.forEach(o => { if(o.blk === h.blk || o.blk.contains(h.blk) || h.blk.contains(o.blk)) return;
        if(o.pt >= HEAD_PT && o.fam === h.fam) return;                                    // one lockup
        if(o.t <= h.t + (h.b - h.t)*.5 || o.r <= h.l || o.l >= h.r || o.t - h.b >= clr) return;   // not below, not under it, or clear by its box
        pr = pr || profile(h.ch, h.font);
        let low = -1e9; for(let X = Math.max(o.l, h.l); X <= Math.min(o.r, h.r); X += 1){ const v = pr.bot[Math.round((X - h.x0)/h.sc + pr.ox)]; if(v === undefined || v < 0) continue; low = Math.max(low, h.t + v*h.sc); }
        if(low < -1e8) return; const gap = o.t - low; if(gap >= clr) return;
        const key = h.text + '|' + h.ch + '|' + o.text; if(seen.has(key)) return; seen.add(key);
        out.push({slot: (h.blk.dataset && h.blk.dataset.slot) || 'headline', kind: 'headline-touches-below', detail: `"${h.ch}" in "${h.text}" ${gap < 0 ? 'runs into' : 'comes within ' + (gap/PX).toFixed(1) + ' pt of'} "${o.text}" (needs ${CLEAR_PT} pt clear)`}); }); });
    return out; };
  // how far a line's ink reaches below its line box (pt; negative = stays inside), for a box with line-height lhPt: a layout uses it to clear a swash
  const below = (text, family, sizePt, lhPt) => { cv = cv || document.createElement('canvas').getContext('2d'); cv.font = `400 ${sizePt}pt ${family}`;
    const m = cv.measureText(text), f = cv.measureText('Hg'), lh = (lhPt || sizePt)*PX, base = (lh - (f.fontBoundingBoxAscent + f.fontBoundingBoxDescent))/2 + f.fontBoundingBoxAscent;
    return (base + m.actualBoundingBoxDescent - lh)/PX; };
  window.HeadTouch = {check, below, HEAD_PT, CLEAR_PT};
})();
