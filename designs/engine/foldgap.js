/* Fold gap (owner 11/16/2026): on every 11 x 17 fold-over, in every design and every version, a photo never runs into the
   center fold. Any photo whose edge lands at the fold, past it, or within 0.05 in of it is pulled back so it stops 0.05 in
   short of the fold (about 1/10 in of clear paper across the crease), so a slightly off fold still looks clean.
   Bars, bands and color fields (anything that is not a photo) still run all the way across. A photo that deliberately
   crosses the fold as one image (the same photo on both panels, meeting at the fold over the same stretch) stays as it is,
   and so does anything inside [data-fold-cross].
   How: a clip-path inset on the photo's box (or its frame, when the frame is just the photo's box), on the fold side only. Nothing is resized or moved, the photo still covers
   its frame without distortion, and only pixels within the gap change. Works in both renderer modes:
     proof  one .page per panel (data-page front/back/left/right or front/back/top/bottom); the fold is that panel's trim
            edge on its fold side (portrait half-fold: back and inside-left fold on the right, cover and inside-right on the
            left; top-fold landscape: cover, back and inside-bottom fold at the top, inside-top at the bottom)
     print  one .page per spread with two .half children; the fold is where the halves meet (a turned panel is measured
            unturned, so the clip lands on the right side of the photo)
   Photos: every <img> and every element painting a url() background, 12 x 12 px or bigger and visible. SVG and canvas
   drawings (plans, maps drawn as vectors) are not photos.
   Run by renderer/render.py render_foldover on every fold-over render, after the page has laid out:
     FoldGap.apply({fold})  -> [{slot, side, cut_pt}]   what was pulled back (idempotent)
     FoldGap.check({fold})  -> [{slot, kind: 'fold-photo-touch', level: 'fail', detail}]   empty = passes
   fold: the piece's fold from pieces.json ('vertical' = portrait panels side by side, else top over bottom). */
(function(){
  const PX = 96 / 72, OUT = 60, GAP_PT = 3.6, GAP = GAP_PT * PX, BLEED = 9 * PX, MIN = 12, TOL = 0.5;
  const SIDE = {vertical: {back: 'right', left: 'right', front: 'left', right: 'left'},
                horizontal: {front: 'top', back: 'top', bottom: 'top', top: 'bottom'}};
  const PAIR = {back: 'front', front: 'back', left: 'right', right: 'left', top: 'bottom', bottom: 'top'};
  const axisOf = s => (s === 'left' || s === 'right') ? 'x' : 'y';

  const shown = el => {
    for(let e = el; e && e.nodeType === 1; e = e.parentElement){
      const cs = getComputedStyle(e);
      if(cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    }
    return true;
  };
  const bgUrl = el => { const m = /url\(["']?(.*?)["']?\)/.exec(getComputedStyle(el).backgroundImage || ''); return m ? m[1] : ''; };
  const srcOf = el => el.tagName === 'IMG' ? (el.currentSrc || el.getAttribute('src') || '') : bgUrl(el);
  const name = el => el.dataset.photo || el.dataset.slot || (el.closest('[data-slot]') || {dataset: {}}).dataset.slot || el.getAttribute('class') || el.tagName.toLowerCase();
  const rect = r => ({l: r.left, t: r.top, r: r.right, b: r.bottom});
  const meet = (a, b) => ({l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b)});

  // the fold edges: one per panel, each with its panel's trim box, which side the fold is on, and the panel it faces
  function edges(fold){
    const out = [], pages = [...document.querySelectorAll('.page')];
    for(const pg of pages){
      const halves = [...pg.children].filter(c => c.classList.contains('half'));
      if(halves.length === 2){   // print spread
        const two = halves.map(h => {
          const panel = h.querySelector('.panel') || h.firstElementChild || h, turned = panel.classList.contains('flip') || getComputedStyle(panel).transform !== 'none';
          const c = h.classList, side = c.contains('l') ? 'right' : c.contains('r') ? 'left' : c.contains('bottom') ? 'top' : turned ? 'top' : 'bottom';
          return {root: h, panel, side, turned, id: `${pg.dataset.page || 'spread'}:${c.contains('l') || c.contains('top') ? 'a' : 'b'}`};
        });
        two[0].pair = two[1]; two[1].pair = two[0];
        two.forEach(e => e.mirror = axisOf(e.side) === 'y' && two[0].turned !== two[1].turned);
        out.push(...two);
      } else {   // proof panel
        const id = pg.dataset.page, f = fold || (pg.offsetHeight > pg.offsetWidth ? 'vertical' : 'horizontal'), side = (SIDE[f] || {})[id];
        if(!side) continue;
        const panel = pg.querySelector(':scope > .panel') || pg;
        out.push({root: pg, panel, side, turned: false, id, role: id});
      }
    }
    for(const e of out) if(e.role && !e.pair){
      e.pair = out.find(o => o.role === PAIR[e.role]) || null;
      e.mirror = axisOf(e.side) === 'y' && (e.role === 'back' || e.role === 'front');
    }
    return out;
  }

  // measure every photo of one panel (a turned panel is measured unturned): its box, what of it shows, the fold line
  function measure(e){
    const undo = e.turned ? e.panel.style.transform : null;
    if(e.turned) e.panel.style.transform = 'none';
    try {
      const pr = e.panel.getBoundingClientRect(), rr = e.root.getBoundingClientRect();
      let T = rect(pr);
      if(Math.abs(pr.width - rr.width) < 2 && Math.abs(pr.height - rr.height) < 2)   // no trim box: the page less its bleed
        T = {l: pr.left + BLEED, t: pr.top + BLEED, r: pr.right - BLEED, b: pr.bottom - BLEED};
      const F = {right: T.r, left: T.l, top: T.t, bottom: T.b}[e.side];
      const photos = [];
      for(const el of e.root.querySelectorAll('*')){
        if(el.closest('svg') || el.tagName === 'CANVAS') continue;
        if(!(el.tagName === 'IMG' || bgUrl(el))) continue;
        const r = el.getBoundingClientRect();
        if(r.width < MIN || r.height < MIN || !shown(el)) continue;
        let V = rect(r);
        for(let a = el.parentElement; a && a !== e.root.parentElement; a = a.parentElement){
          const cs = getComputedStyle(a);
          if(cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || a === e.root) V = meet(V, rect(a.getBoundingClientRect()));
        }
        if(V.r - V.l < 1 || V.b - V.t < 1) continue;
        photos.push({el, r, V, src: srcOf(el), cross: !!el.closest('[data-fold-cross]'),
                     along: axisOf(e.side) === 'x' ? [V.t - T.t, V.b - T.t] : [V.l - T.l, V.r - T.l], W: T.r - T.l});
      }
      return {F, T, photos};
    } finally {
      if(e.turned) e.panel.style.transform = undo;
    }
  }

  // how far a shown area reaches into the gap (px, > 0 = too close), on the edge's side
  const reach = (side, V, F) => side === 'right' ? V.r - (F - GAP) : side === 'left' ? (F + GAP) - V.l : side === 'bottom' ? V.b - (F - GAP) : (F + GAP) - V.t;
  const touches = (side, V, F) => side === 'right' ? V.r > F - 3 * GAP : side === 'left' ? V.l < F + 3 * GAP : side === 'bottom' ? V.b > F - 3 * GAP : V.t < F + 3 * GAP;

  // a photo that crosses the fold on purpose: the same photo on the facing panel, at the fold, over the same stretch
  function markCross(all){
    for(const [e, m] of all){
      if(!e.pair) continue;
      const pm = all.get(e.pair);
      if(!pm) continue;
      for(const p of m.photos){
        if(p.cross || !p.src || !touches(e.side, p.V, m.F)) continue;
        for(const q of pm.photos){
          if(q.src !== p.src || !touches(e.pair.side, q.V, pm.F)) continue;
          const qa = e.mirror ? [q.W - q.along[1], q.W - q.along[0]] : q.along;
          const ov = Math.min(p.along[1], qa[1]) - Math.max(p.along[0], qa[0]);
          if(ov > 0.5 * Math.min(p.along[1] - p.along[0], qa[1] - qa[0])){ p.cross = q.cross = true; }
        }
      }
    }
  }

  function survey(fold){
    const all = new Map();
    for(const e of edges(fold)) all.set(e, measure(e));
    markCross(all);
    return all;
  }

  // the inset of a clip-path inset() on one element, as a viewport box (null when it has none)
  function insetBox(el){
    const cp = getComputedStyle(el).clipPath || 'none', m = /^inset\(([^)]*)\)/.exec(cp);
    if(!m) return null;
    const v = m[1].split(/\s+round\s+/)[0].trim().split(/\s+/).map(parseFloat), [t, r, b, l] = [v[0], v[1] ?? v[0], v[2] ?? v[0], v[3] ?? v[1] ?? v[0]];
    const R = el.getBoundingClientRect(), sx = R.width / (el.offsetWidth || R.width), sy = R.height / (el.offsetHeight || R.height);
    return {l: R.left + l * sx, t: R.top + t * sy, r: R.right - r * sx, b: R.bottom - b * sy};
  }
  // the shown area after every clip-path inset on the photo or its frames (ours or the design's)
  function clipped(p, root){
    let V = p.V;
    for(let a = p.el; a && a !== root.parentElement; a = a.parentElement){ const B = insetBox(a); if(B) V = meet(V, B); }
    return V;
  }
  // the box to clip: the photo, or its frame when the frame is just the photo's box (so a frame's own fill never shows in
  // the gap); never the panel, the page or anything holding more than the photo
  function target(p, e){
    const R = p.el.getBoundingClientRect(), I = {l: R.left - 2, t: R.top - 2, r: R.right + 2, b: R.bottom + 2};
    let t = p.el;
    for(let a = p.el.parentElement; a && a !== e.root && a !== e.panel && !a.contains(e.panel); a = a.parentElement){
      const A = a.getBoundingClientRect();
      if(A.left < I.l || A.top < I.t || A.right > I.r || A.bottom > I.b) break;
      t = a;
    }
    return t;
  }

  function apply(opts){
    const fold = (opts || {}).fold, done = [];
    for(const [e, m] of survey(fold)){
      const undo = e.turned ? e.panel.style.transform : null;
      if(e.turned) e.panel.style.transform = 'none';
      try {
        for(const p of m.photos){
          if(p.cross) continue;
          const el = target(p, e), own = el.dataset.foldgap != null;
          if(own) el.style.clipPath = el.dataset.foldgapWas || '';
          if(!own && (getComputedStyle(el).clipPath || 'none') !== 'none') continue;   // the design's own clip: left alone (the check still reports a touch)
          const V = p.V;
          if(reach(e.side, V, m.F) <= 0.01) continue;
          const r = el.getBoundingClientRect(), sx = r.width / (el.offsetWidth || r.width), sy = r.height / (el.offsetHeight || r.height);
          const cut = e.side === 'right' ? (r.right - (m.F - GAP)) / sx : e.side === 'left' ? ((m.F + GAP) - r.left) / sx
                    : e.side === 'bottom' ? (r.bottom - (m.F - GAP)) / sy : ((m.F + GAP) - r.top) / sy;
          const ins = {top: -OUT, right: -OUT, bottom: -OUT, left: -OUT}; ins[e.side] = Math.max(0, cut);   // other sides open: their edges and shadows render exactly as before
          if(!own) el.dataset.foldgapWas = el.style.clipPath || '';
          el.dataset.foldgap = e.side;
          el.style.clipPath = `inset(${ins.top}px ${ins.right}px ${ins.bottom}px ${ins.left}px)`;
          done.push({slot: name(p.el), panel: e.id, side: e.side, cut_pt: +(reach(e.side, V, m.F) / PX).toFixed(2)});
        }
      } finally {
        if(e.turned) e.panel.style.transform = undo;
      }
    }
    window.FoldGap.done = done;
    return done;
  }

  function check(opts){
    const fold = (opts || {}).fold, out = [];
    for(const [e, m] of survey(fold)){
      const undo = e.turned ? e.panel.style.transform : null;
      if(e.turned) e.panel.style.transform = 'none';
      try {
        for(const p of m.photos){
          if(p.cross) continue;
          const V = clipped(p, e.root), over = reach(e.side, V, m.F);
          if(over > TOL && V.r - V.l > 1 && V.b - V.t > 1){
            const gap = (GAP - over) / PX / 72;
            out.push({slot: name(p.el), kind: 'fold-photo-touch', level: 'fail', panel: e.id,
                      detail: `photo ${gap <= 0 ? 'runs into the fold' : `stops ${gap.toFixed(3)} in from the fold`} on the ${e.id} panel (0.05 in gap wanted)`});
          }
        }
      } finally {
        if(e.turned) e.panel.style.transform = undo;
      }
    }
    return out;
  }

  window.FoldGap = {apply, check, done: [], GAP_PT};
})();
