/* Text clearance check (owner 11/2/2026, standing rule): no line, rule, diagonal or shape ever runs into or touches
   text, on any piece. Loaded by renderer/render.py after a piece lays out; Clearance.check() returns issues
   {kind: 'line-hits-text', text, by} for the print checks.

   How it works: every text line's box (each line of each text node, from Range.getClientRects) is compared with the
   visible edges of everything else that draws: background and image boxes, each border side, clip-path polygons,
   rotated or skewed boxes and SVG strokes. Edges are walked point by point (every 0.5 px, after transforms and the
   ancestors' overflow clipping); a point inside a text line's box, or within CLEAR pt of it, fails. Shapes that hold
   the text whole (a panel, a photo under a title) never fail: only their edges count. The text's own inline parent
   is skipped (its box is the text's box).
   Boxes that hold text count too (the owner 11/6/2026, B46B square: the gold chevron line ran into the white event box):
   a filled box holding text, in a color other than the page's, keeps the same air from every slanted shape edge and every
   rule drawn by something else (kind 'line-hits-text-box'). Plain box edges meeting it are layout, not a hit. */
(() => {
  const CLEAR = 0.75;            // pt of air every line, rule or shape edge keeps from text
  const PX = 96 / 72, STEP = 0.5;
  const transparent = c => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c);

  const visible = el => { for(let e = el; e && e.nodeType === 1; e = e.parentElement){ const s = getComputedStyle(e);
    if(s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return true; };

  // the visible window an element is clipped to by its ancestors (overflow other than visible, and clip-path insets ignored)
  const clipOf = el => { let r = {l: -1e9, t: -1e9, r: 1e9, b: 1e9};
    for(let e = el.parentElement; e && e !== document.body; e = e.parentElement){ const s = getComputedStyle(e);
      if(s.overflow !== 'visible' || s.overflowX !== 'visible' || s.overflowY !== 'visible'){ const b = e.getBoundingClientRect();
        r = {l: Math.max(r.l, b.left), t: Math.max(r.t, b.top), r: Math.min(r.r, b.right), b: Math.min(r.b, b.bottom)}; } }
    return r; };

  // local box -> page: element's untransformed rect plus its own transform about its origin
  const mapper = el => {
    const s = getComputedStyle(el), tr = s.transform;
    if(!tr || tr === 'none'){ const b = el.getBoundingClientRect(); return {w: b.width, h: b.height, map: (x, y) => [b.left + x, b.top + y]}; }
    const keep = el.style.transform; el.style.transform = 'none'; const b = el.getBoundingClientRect(); el.style.transform = keep;
    const [ox, oy] = s.transformOrigin.split(' ').map(parseFloat), M = new DOMMatrix(tr);
    return {w: b.width, h: b.height, map: (x, y) => { const p = M.transformPoint(new DOMPoint(x - ox, y - oy)); return [b.left + ox + p.x, b.top + oy + p.y]; }};
  };

  const len = (v, ref) => v.endsWith('%') ? parseFloat(v) / 100 * ref : parseFloat(v);
  const polygonOf = (cp, w, h) => { const m = /polygon\((.*)\)/.exec(cp); if(!m) return null;
    return m[1].replace(/^\s*(nonzero|evenodd)\s*,/, '').split(',').map(pt => { const [x, y] = pt.trim().split(/\s+/); return [len(x, w), len(y, h)]; }); };

  // edges of one drawing element, as segments in local coords: [[x1,y1,x2,y2,label], ...]
  const segments = (el, w, h) => {
    const s = getComputedStyle(el), out = [];
    const poly = s.clipPath && s.clipPath !== 'none' ? polygonOf(s.clipPath, w, h) : null;
    const fills = !transparent(s.backgroundColor) || s.backgroundImage !== 'none' || /^(IMG|CANVAS|VIDEO)$/.test(el.tagName);
    if(poly){ if(fills) poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; out.push([p[0], p[1], q[0], q[1], 'shape edge']); }); return out; }
    if(fills) out.push([0, 0, w, 0, 'box edge'], [w, 0, w, h, 'box edge'], [w, h, 0, h, 'box edge'], [0, h, 0, 0, 'box edge']);
    const bw = k => s[`border${k}Style`] !== 'none' && !transparent(s[`border${k}Color`]) ? parseFloat(s[`border${k}Width`]) : 0;
    const T = bw('Top'), R = bw('Right'), B = bw('Bottom'), Lf = bw('Left');
    // a border is a band: both of its long edges count
    if(T) out.push([0, 0, w, 0, 'rule'], [0, T, w, T, 'rule']);
    if(B) out.push([0, h, w, h, 'rule'], [0, h - B, w, h - B, 'rule']);
    if(Lf) out.push([0, 0, 0, h, 'rule'], [Lf, 0, Lf, h, 'rule']);
    if(R) out.push([w, 0, w, h, 'rule'], [w - R, 0, w - R, h, 'rule']);
    return out;
  };

  const svgPoints = (g, add) => {
    if(typeof g.getTotalLength !== 'function') return;
    const st = getComputedStyle(g), stroke = st.stroke !== 'none' && !transparent(st.stroke), fill = st.fill !== 'none' && !transparent(st.fill);
    if(!stroke && !fill) return;
    const ctm = g.getScreenCTM(), L = g.getTotalLength(), pad = stroke ? parseFloat(st.strokeWidth || 1) / 2 * (ctm ? Math.hypot(ctm.a, ctm.b) : 1) : 0;
    for(let d = 0; d <= L; d += STEP){ const p = g.getPointAtLength(d), q = ctm ? new DOMPoint(p.x, p.y).matrixTransform(ctm) : p; add(q.x, q.y, pad, 'line'); }
  };

  window.Clearance = {CLEAR, check(root){
    root = root || document.getElementById('pages') || document.body;
    // text line boxes, trimmed to the type's body (a line box carries the font's full ascent and descent)
    const lines = [], tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), ctx = document.createElement('canvas').getContext('2d');
    for(let n; (n = tw.nextNode());){
      const el = n.parentElement; if(!n.textContent.trim() || !visible(el) || el.closest('[data-twin],[data-clear-skip]')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      // the letters' own ink, not the font's full line box: canvas measures the run's ascent and descent from the baseline
      const st = getComputedStyle(el); ctx.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
      const fm = ctx.measureText(n.textContent.trim()), up = (st.textTransform === 'uppercase' ? ctx.measureText(n.textContent.trim().toUpperCase()) : fm);
      for(const r of rg.getClientRects()){ if(r.width < 1 || r.height < 1) continue;
        const base = r.top + (r.height - (up.fontBoundingBoxAscent + up.fontBoundingBoxDescent)) / 2 + up.fontBoundingBoxAscent;
        lines.push({l: r.left, r: r.right, t: base - up.actualBoundingBoxAscent, b: base + up.actualBoundingBoxDescent, el, text: n.textContent.trim().slice(0, 40)}); }
    }
    if(!lines.length) return [];
    const pad = CLEAR * PX, hits = new Map();
    const name = el => String(el.dataset && el.dataset.slot || (typeof el.className === 'string' && el.className) || el.tagName).slice(0, 40);
    // an edge only counts where it shows: not under something opaque painted above it (a ribbon over a color edge)
    const opaque = e => { const st = getComputedStyle(e); return !transparent(st.backgroundColor) || st.backgroundImage !== 'none' || /^(IMG|CANVAS|VIDEO)$/.test(e.tagName); };
    const shows = (x, y, el) => { for(const e of document.elementsFromPoint(x, y)){
      if(e === el || el.contains(e)) return true; if(e.contains(el)) return true; if(opaque(e)) return false; } return true; };
    // the paint at a point: the topmost opaque thing's color (page white when nothing)
    const paintAt = (x, y) => { for(const e of document.elementsFromPoint(x, y)){ if(e instanceof SVGElement) continue; const st = getComputedStyle(e);
      if(st.backgroundImage !== 'none' || /^(IMG|CANVAS|VIDEO)$/.test(e.tagName)) return 'image:' + (e.currentSrc || st.backgroundImage).slice(0, 80) + e.dataset.slot;
      if(!transparent(st.backgroundColor)) return st.backgroundColor; } return 'rgb(255, 255, 255)'; };
    // a fill's edge shows only where the paint differs on its two sides (a paper-colored box on paper has no edge)
    const edgeShows = (x, y, nx, ny) => paintAt(x + nx * 2, y + ny * 2) !== paintAt(x - nx * 2, y - ny * 2);
    const report = (k, v) => { if(!hits.has(k)) hits.set(k, v); };
    const hit = (x, y, extra, lab, el, own) => { for(const L of lines){
      if(own && L.el === el) continue;   // the inline box wrapping its own text run draws exactly around it
      const g = pad + extra; if(x > L.l - g && x < L.r + g && y > L.t - g && y < L.b + g && shows(x, y, el))
        report(L.text + '|' + lab + '|' + name(el), {kind: 'line-hits-text', text: L.text, by: lab + ' of ' + name(el), at: [Math.round(x * 0.75), Math.round(y * 0.75)]}); } };
    // write-in lines and thin rules (axis-aligned, at most 3 px tall or wide): a slanted edge never crosses one
    const rules = [...root.querySelectorAll('*')].filter(e => !(e instanceof SVGElement) && visible(e) && !e.closest('[data-twin],[data-clear-skip]') && getComputedStyle(e).transform === 'none' && !e.textContent.trim()).map(e => ({e, r: e.getBoundingClientRect()}))
      .filter(({e, r}) => (r.height <= 3 && r.width > 12 || r.width <= 3 && r.height > 12) && segments(e, r.width, r.height).length);
    const cross = (x, y, el) => { for(const {e, r} of rules){ if(e === el || el.contains(e) || e.contains(el)) continue;
      if(x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad && shows(x, y, el))
        report('rule|' + name(e) + '|' + Math.round(r.top) + '|' + name(el), {kind: 'line-hits-text', text: '(write-in line or rule)', by: 'slanted edge of ' + name(el), at: [Math.round(x * 0.75), Math.round(y * 0.75)]}); } };
    // filled boxes holding text, in a color other than the page's
    const pageBg = (() => { const pg = root.querySelector('.page'); return pg ? getComputedStyle(pg).backgroundColor : ''; })();
    const boxes = [...root.querySelectorAll('*')].filter(e => { if(e instanceof SVGElement || !visible(e) || e.closest('[data-twin],[data-clear-skip]') || e.classList.contains('page')) return false;
      const st = getComputedStyle(e); if(transparent(st.backgroundColor) || st.backgroundColor === pageBg || st.backgroundImage !== 'none' || st.clipPath !== 'none') return false;
      // holds text: a text line sits on it (its own text, or text laid over an empty background box)
      const r = e.getBoundingClientRect(); return r.width > 20 && r.height > 12 && lines.some(L => (L.l + L.r)/2 > r.left && (L.l + L.r)/2 < r.right && (L.t + L.b)/2 > r.top && (L.t + L.b)/2 < r.bottom); })
      .map(e => { const r = e.getBoundingClientRect(); return {e, r, text: lines.find(L => (L.l + L.r)/2 > r.left && (L.l + L.r)/2 < r.right && (L.t + L.b)/2 > r.top && (L.t + L.b)/2 < r.bottom).text}; });
    // only lines and bands drawn by something else: a photo's own edge meeting a panel is layout, and a rule framing the
    // box (its center inside the rule's box) is the box's own border
    const nearBox = (x, y, el, lab) => { const er = el.getBoundingClientRect();
      if(/^(IMG|CANVAS|VIDEO)$/.test(el.tagName) || el.classList.contains('photo') || getComputedStyle(el).backgroundImage !== 'none') return;
      for(const {e, r, text} of boxes){ if(e === el || el.contains(e) || e.contains(el)) continue;
      if((r.left + r.right)/2 > er.left && (r.left + r.right)/2 < er.right && (r.top + r.bottom)/2 > er.top && (r.top + r.bottom)/2 < er.bottom && lab === 'rule') continue;
      // at the box's outline only (a rule drawn well inside a box is the box's own furniture; letters have their own check)
      const deep = x > r.left + pad && x < r.right - pad && y > r.top + pad && y < r.bottom - pad;
      if(!deep && x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad && shows(x, y, el))
        report('box|' + name(e) + '|' + Math.round(r.top) + '|' + name(el), {kind: 'line-hits-text-box', text, by: lab + ' of ' + name(el), at: [Math.round(x * 0.75), Math.round(y * 0.75)]}); } };
    root.querySelectorAll('*').forEach(el => {
      if(!visible(el) || el.closest('[data-twin],[data-clear-skip]')) return;
      const c = clipOf(el), inside = (x, y) => x >= c.l && x <= c.r && y >= c.t && y <= c.b;
      if(el instanceof SVGElement){ if(el.tagName.toLowerCase() !== 'svg') svgPoints(el, (x, y, e, lab) => { if(inside(x, y)){ hit(x, y, e, lab, el, false); cross(x, y, el); } }); return; }
      const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      const {w, h, map} = mapper(el); if(w < 0.5 && h < 0.5) return;
      for(const [x1, y1, x2, y2, lab] of segments(el, w, h)){
        const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / STEP));
        const [ax, ay] = map(x1, y1), [bx, by] = map(x2, y2), slant = Math.abs(ax - bx) > 1 && Math.abs(ay - by) > 1;
        const d = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / d, ny = (bx - ax) / d, fillEdge = lab !== 'rule' && Math.min(w, h) > 4;
        for(let i = 0; i <= n; i++){ const [x, y] = map(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n); if(!inside(x, y)) continue;
          if(fillEdge && !edgeShows(x, y, nx, ny)) continue;
          hit(x, y, 0, lab, el, own); if(slant) cross(x, y, el);
          if(slant || lab === 'rule' || (lab === 'shape edge' && Math.min(w, h) <= 12)) nearBox(x, y, el, lab); }
      }
    });
    return [...hits.values()];
  }};
})();
