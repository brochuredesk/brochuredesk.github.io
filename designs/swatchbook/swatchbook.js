/* Swatchbook: shared helpers for the fold-over (data, photos, captions that fill their boxes, logos, print checks).

   Captions and paragraphs are written as a lead plus whole sentences (data-s). Each box has a line count; the fill pass
   picks the sentences, in the writer's order, that set in exactly that many lines with the last line at least 3/4 full.
   It never cuts a word or a sentence; when no set of whole sentences fits, the box is reported and goes back to the writer. */
(function(){
  const SW = {};
  const esc = SW.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pt = px => px*72/96;
  SW.data = () => JSON.parse(document.getElementById('brochure-data').textContent || '{}');

  // ---------- photos ----------
  SW.src = (D, id) => (D.photos && D.photos[id] && D.photos[id].src) || '';
  SW.photo = (D, id, style, slot) => {
    const p = (D.photos||{})[id] || {};
    return `<div class="ph" data-photo="${esc(id||'')}" data-slot-photo="${esc(slot||'')}" style="${style||''}">${id && p.src ? `<img src="${esc(p.src)}" alt="">` : ''}</div>`;
  };
  // After layout: set each photo's crop from where the photo's subject sits. A photo with a house box (fractions of the
  // photo) is cropped so the whole house stays inside; the check reports it when it cannot.
  SW.focus = (D) => {
    const issues = [];
    document.querySelectorAll('.ph[data-photo]').forEach(el => {
      const p = (D.photos||{})[el.dataset.photo], img = el.querySelector('img');
      if(!p || !img) return;
      const W = p.w || img.naturalWidth, H = p.h || img.naturalHeight; if(!W || !H) return;
      const tw = el.clientWidth, th = el.clientHeight, ia = W/H, ta = tw/th;
      let fx = (p.focusX != null ? p.focusX : 50)/100, fy = (p.focusY != null ? p.focusY : 50)/100;
      const vis = ia > ta ? {w: ta/ia, h: 1} : {w: 1, h: ia/ta};   // visible share of the photo, each way
      if(p.box){
        const [x0, y0, x1, y1] = p.box;
        const place = (lo, hi, v, f) => { const c = (lo+hi)/2; const off = Math.min(1-v, Math.max(0, c - v/2)); return v >= 1 ? 0.5 : off/(1-v); };
        if(vis.w < 1) fx = place(x0, x1, vis.w, fx);
        if(vis.h < 1) fy = place(y0, y1, vis.h, fy);
        const offx = (1-vis.w)*fx, offy = (1-vis.h)*fy;
        if(x0 < offx - .002 || x1 > offx + vis.w + .002 || y0 < offy - .002 || y1 > offy + vis.h + .002)
          issues.push({slot: el.dataset.slotPhoto || el.dataset.photo, kind:'house-cropped', detail:'the whole house does not fit this photo box'});
      }
      img.style.objectPosition = `${(fx*100).toFixed(1)}% ${(fy*100).toFixed(1)}%`;
    });
    return issues;
  };

  // ---------- text that fills its box ----------
  // lines a block of text sets in, and the share of the last line that is filled
  SW.lines = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
    const lines = [];
    for(const q of rects){ const l = lines.find(x => Math.abs(x.top - q.top) < lh*0.5); if(l){ l.l = Math.min(l.l,q.left); l.r = Math.max(l.r,q.right); } else lines.push({top:q.top,l:q.left,r:q.right}); }
    lines.sort((a,b)=>a.top-b.top);
    const box = el.getBoundingClientRect().width;
    const last = lines[lines.length-1];
    return {n: lines.length, fill: last ? (last.r-last.l)/box : 0, inner: lines.length > 1 ? Math.min(...lines.slice(0, -1).map(x => (x.r-x.l)/box)) : 1};
  };
  SW.textWidth = el => { const r = document.createRange(); r.selectNodeContents(el); return pt(r.getBoundingClientRect().width); };
  const html = (lead, sents) => (lead ? `<b>${esc(lead)}</b> ` : '') + esc(sents.join(' '));
  // The sets of whole sentences (the first always stays) that set in exactly T lines with the last line 3/4 full or more.
  // Returns {pick, fill} (fewest sentences first), or null with el.dataset.diag saying how close the pool came.
  const pickFor = (el, T, minFill) => {
    // each sentence is a string, or a list of ways to say the same fact at different lengths (only one is ever used)
    const S = JSON.parse(el.dataset.s).map(x => [].concat(x)), lead = el.dataset.lead || '', n = Math.min(S.length, 12);
    let best = null, near = null, hi = null, lo = null;
    const full = S.map(a => a[0]);
    el.innerHTML = html(lead, full); const A = SW.lines(el), allLen = (lead ? lead.length + 1 : 0) + full.join(' ').length, cpl = allLen / Math.max(.5, A.n - 1 + A.fill);
    const lead0 = lead ? lead.length + 1 : 0;
    const test = pick => {
      const est = (lead0 + pick.join(' ').length) / cpl;
      if(est < T - 1.5 || est > T + 0.9) return;
      el.innerHTML = html(lead, pick);
      const L = SW.lines(el);
      if(L.n === T + 1 && (!hi || L.fill < hi.fill)) hi = {fill: L.fill};
      if(L.n === T - 1 && (!lo || L.fill > lo.fill)) lo = {fill: L.fill};
      if(L.n !== T) return;
      if(!near || L.fill > near.fill) near = {pick, fill: L.fill};
      if(L.fill < (minFill || 0.82)) return;   // the last line at least 80% of the box (owner 11/8/2026: text under a photo fills its width)
      // owner 11/8: every line set ragged runs 80%+ of the width (then it justifies with small gaps): such a set wins over a longer ragged one
      const score = (L.inner >= 0.8 ? 2000 : 0) + (L.fill >= 0.9 ? 1000 : 500) + pick.join(' ').length + L.fill;   // the most copy that fills the box (never shorter, owner 11/10); the last line well filled
      if(!best || score > best.score) best = {score, pick, fill: L.fill};
    };
    const walk = (m, i, acc) => {
      if(i === n){ test(acc); return; }
      if(!(m >> i & 1)){ walk(m, i + 1, acc); return; }
      for(const alt of S[i]) walk(m, i + 1, acc.concat(alt));
    };
    for(let m = 1; m < (1 << n); m += 2) walk(m, 0, []);   // the first sentence always stays: it carries the point of the box
    if(best) return best;
    el.dataset.diag = `best ${T} lines: ${near ? Math.round(near.fill*100) + '%' : 'none'}` + (hi ? `; ${T+1} lines min ${Math.round(hi.fill*100)}%` : '') + (lo ? `; ${T-1} lines max ${Math.round(lo.fill*100)}%` : '');
    el.__near = near;
    return null;
  };
  const LH = 12.5, CAPPAD = 5; SW._pickFor = pickFor;
  SW.fill = () => {
    const issues = [];
    const caps = [...document.querySelectorAll('.cap .a[data-s]')], rest = [...document.querySelectorAll('[data-s]')].filter(e => !caps.includes(e));
    const settle = (el, T) => {   // T lines: the best set, else the nearest and a report
      const lead = el.dataset.lead || '', b = pickFor(el, T, el.__loose || 0);
      if(b){ el.innerHTML = html(lead, b.pick); delete el.dataset.diag; }
      else el.innerHTML = html(lead, el.__near ? el.__near.pick : JSON.parse(el.dataset.s).map(x => [].concat(x)[0]));
      el.dataset.lines = T; return !!b;
    };
    rest.forEach(el => settle(el, +el.dataset.lines || 1));
    // photo captions shrink to what their sentences honestly fill (never padded): the photo takes the room. The captions in one row share a line count when they can.
    const groups = new Map();
    caps.forEach(el => { const g = el.closest('.row') || el; (groups.get(g) || groups.set(g, []).get(g)).push(el); });
    groups.forEach(els => {
      els.forEach(e => { if(!e.dataset.lines0) e.dataset.lines0 = e.dataset.lines; });   // a second pass (after the page settles) starts from the box's own count
      const max = Math.max(...els.map(e => +e.dataset.lines0));
      let chosen = null;
      // never shorter (owner 11/10/2026): the captions keep their full line count when every one sets it with the last line 3/4 full;
      // CapFit then brings every line to 80%+ (bigger type, justified). Only when that fails do fewer lines come into play.
      let loose = false;
      const total = (T, mf) => { let n = 0; for(const e of els){ const b = pickFor(e, T, mf); if(!b) return -1; n += b.pick.join(' ').length; } return n; };
      let best = null;   // the line count (full fill first, else 3/4 fill) that keeps the most copy across the row
      for(let T = max; T >= 2; T--) for(const mf of [0.82, 0.76, 0.7]){ const n = total(T, mf); if(n > 0 && (!best || n > best.n + 6)) best = {T, n, loose: mf < 0.8 ? mf : false}; }
      if(best){ chosen = best.T; loose = best.loose; }
      // no count every caption fills well: the most lines every caption can set exactly, last lines shorter (owner 10/29:
      // captions side by side always share a line count; CaptionRow sends any row that still differs back to the writer)
      for(let T = max; T >= 2 && !chosen; T--) if(els.every(e => pickFor(e, T) || e.__near)) chosen = T;
      els.forEach(e => {
        const lead = e.dataset.lead || '';
        let T = chosen; e.__loose = loose;
        if(!T){   // no common count: this one alone, at the count it fills best (or comes closest to)
          let bestNear = null;
          for(let t = max; t >= 2 && !T; t--){ if(pickFor(e, t)) T = t; else if(e.__near && (!bestNear || e.__near.fill > bestNear.fill)) bestNear = {t, fill: e.__near.fill}; }
          if(!T) T = bestNear ? bestNear.t : 2;
        }
        settle(e, T);
      });
      const h = Math.max(...els.map(e => +e.dataset.lines));
      els.forEach(e => { const lh = +e.dataset.lh || LH; e.style.height = (+e.dataset.lines * lh) + 'pt'; });
      const lh0 = +els[0].dataset.lh || LH;
      els.forEach(e => { e.parentElement.style.height = (CAPPAD + h * lh0) + 'pt'; });
    });
    return issues;
  };

  // ---------- labeled-items boxes (owner 11/8: every line of a bullet, set ragged, runs 80%+ of its column and the last line 90%+;
  // then justified while the word gaps stay small; owner 11/10: never shorter, bigger type up to ~12% before anything else) ----------
  const rows = el => { const r = document.createRange(), L = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while(w.nextNode()){ const n = w.currentNode, re = /\S+/g; let m;
      while((m = re.exec(n.textContent))){ r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        for(const q of r.getClientRects()){ if(q.width < .5) continue; const mid = (q.top + q.bottom)/2, l = L.find(x => Math.abs(x.m - mid) < q.height*.5);
          if(l){ l.l = Math.min(l.l, q.left); l.r = Math.max(l.r, q.right); l.n++; l.t = Math.min(l.t, q.top); l.b = Math.max(l.b, q.bottom); } else L.push({m: mid, l: q.left, r: q.right, t: q.top, b: q.bottom, n: 1}); } } }
    return L.sort((a, b) => a.m - b.m); };
  SW.rows = rows;
  const CTX = document.createElement('canvas').getContext('2d');
  const gapOf = (el, L) => { const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize); CTX.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const sp = CTX.measureText(' ').width, R = el.getBoundingClientRect().right;
    return Math.max(1, ...L.slice(0, -1).map(x => x.n < 2 ? 9 : (sp + (R - x.r)/(x.n - 1))/sp)); };
  const SC = [1, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.1, 1.11, 1.12];
  SW.boxFit = els => {
    els = [...els].filter(e => e.dataset.s && e.clientWidth); if(!els.length) return;
    const fs0 = parseFloat(getComputedStyle(els[0]).fontSize);
    // every way to say it: the first fact always, each later fact in one of its wordings or left out (the longest that fills wins)
    const combos = el => { const S = JSON.parse(el.dataset.s).map(x => [].concat(x)); let out = [[]];
      S.forEach((alts, i) => { out = out.flatMap(a => (i ? [a] : []).concat(alts.map(x => a.concat(x)))); }); return out.slice(0, 160); };
    const res = els.map(el => {
      const T = +el.dataset.lines || 2, ok = {}, C = combos(el); let near = null; el.style.textAlign = 'left'; if(el.dataset.boxorig === undefined) el.dataset.boxorig = el.textContent;
      // a narrow column may break a long word at a hyphen, only when no wording fills it whole (owner 11/8: every line 80%+)
      for(const hy of ['manual', 'auto']){ el.style.hyphens = hy; if(Object.keys(ok).length) break;
      for(const s of SC){ el.style.fontSize = (fs0*s) + 'px'; let best = null;
        for(const tr of [0, .01, .02]){ el.style.letterSpacing = tr ? tr + 'em' : ''; if(best) break;
        for(const c of C){ el.textContent = c.join(' '); const L = rows(el), W = el.getBoundingClientRect().width;
          if(L.length !== T || el.scrollHeight > el.clientHeight + 1) continue;
          const f = L.map(x => (x.r - x.l)/W), mn = Math.min(...f.slice(0, -1)), last = f[f.length - 1];
          if(!near || Math.min(mn/.8, last/.9) > near.k) near = {k: Math.min(mn/.8, last/.9), mn, last, s, t: c.join(' ')};
          if(mn < .8 || last < .898) continue;   // the check passes at 79.5% and 89.5%
          const len = c.join(' ').length; if(!best || len > best.len) best = {c, len, tr}; } }
        el.style.letterSpacing = ''; if(best) ok[s] = Object.assign(best, {hy}); } }
      return {el, ok, C, T, near}; });
    // one type size for the whole box when it can be had: the size most rows fill at (the smallest of those)
    const tally = SC.map(s => res.filter(r => r.ok[s]).length), most = Math.max(...tally), sBox = SC[tally.indexOf(most)];
    res.forEach(r => { const el = r.el;
      const s = r.ok[sBox] ? sBox : SC.find(x => r.ok[x]);
      if(s === undefined){ el.style.fontSize = ''; el.style.hyphens = 'manual'; el.textContent = el.dataset.boxorig; el.dataset.diag = 'no sentence set fills every line 80%+ and the last 90%+' + (r.near ? ` (closest: ${Math.round(r.near.mn*100)}% / ${Math.round(r.near.last*100)}% at ${r.near.s}x: ${r.near.t})` : ''); return; }
      el.style.fontSize = (fs0*s) + 'px'; el.style.letterSpacing = r.ok[s].tr ? r.ok[s].tr + 'em' : ''; el.style.hyphens = r.ok[s].hy; el.textContent = r.ok[s].c.join(' ');
      const L = rows(el); if(L.length > 1 && gapOf(el, L) <= 2){ el.style.textAlign = 'justify'; el.style.textAlignLast = 'left'; }
      delete el.dataset.diag; });
  };
  // a box heading (kicker + heading column, owner 11/10 rules 5 and 11): the heading's lines are balanced and its box is drawn to its
  // widest line (no short last line); it takes the size that fills the column best top to bottom; if the column still has room, the
  // kicker sits at the top and the heading at the bottom (the column filled, never a floating block)
  SW.headFit = (h, sizes) => {
    if(!h) return; const col = h.parentElement, cs = getComputedStyle(col);
    const keep = {fs: h.style.fontSize, lh: h.style.lineHeight, w: h.style.width, ht: h.style.height, ov: h.style.overflow, jc: col.style.justifyContent};
    const lhk = parseFloat(getComputedStyle(h).lineHeight)/parseFloat(getComputedStyle(h).fontSize);
    const H = col.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom), W0 = h.clientWidth;
    h.style.height = ''; h.style.overflow = 'visible'; col.style.justifyContent = 'center';
    // balanced lines by hand: the width (same line count) whose last line runs closest to the longest; the box is then drawn to its longest line
    const balance = n => { let bw = W0, bk = -1;
      for(let m = W0; m >= W0*.4; m -= 3){ h.style.width = m + 'px'; const L = rows(h); if(L.length !== n || h.scrollWidth > h.clientWidth + 1) { if(L.length > n) break; continue; }
        const k = (L[L.length - 1].r - L[L.length - 1].l)/Math.max(...L.map(x => x.r - x.l)); if(k > bk + .02){ bk = k; bw = m; } }
      h.style.width = bw + 'px'; const L = rows(h), wide = Math.max(...L.map(x => x.r - x.l)); h.style.width = Math.ceil(wide + 1) + 'px'; if(rows(h).length !== n) h.style.width = bw + 'px'; };
    const set = fs => { h.style.width = ''; h.style.fontSize = fs + 'pt'; h.style.lineHeight = (fs*lhk) + 'pt';
      const n0 = rows(h).length; if(h.scrollWidth > W0 + 1 || n0 < 2 || n0 > 4) return {ok: false};
      balance(n0); const L = rows(h), W = h.getBoundingClientRect().width;
      const used = [...col.children].reduce((t, c) => t + c.getBoundingClientRect().height + (parseFloat(getComputedStyle(c).marginTop) || 0), 0);
      return {n: L.length, ok: L.length === n0 && used <= H + 1 && (L[L.length - 1].r - L[L.length - 1].l)/W >= .755, fill: used/H}; };   // LastLine passes at 75%
    let best = null;
    for(const fs of sizes || [34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16]){ const e = set(fs); if(e.ok && (!best || e.fill > best.fill + .02)) best = {fs, ...e}; }
    if(!best){ h.style.fontSize = keep.fs; h.style.lineHeight = keep.lh; h.style.width = keep.w; h.style.height = keep.ht; h.style.overflow = keep.ov; col.style.justifyContent = keep.jc; return; }
    const e = set(best.fs); h.dataset.lines = Math.max(+h.dataset.lines || 0, e.n);
    if(e.fill < .9) col.style.justifyContent = 'space-between';
  };

  // ---------- last lines (owner 11/10/2026: no last line under 80% anywhere; pattern templates/negative/lastfix.js) ----------
  // A write-up, caption or intro whose last line runs under 80% (or close to it) takes a small type step: 100% to 112% of its size, tracking
  // within +-0.02 em, the same number of lines, never past its box. The words (and the bold lead) never change and no word spacing opens.
  // A block it settles is marked data-fixed, so the renderer's grow pass leaves it as fitted. A justified block is measured as set ragged.
  SW.lastFix = (root) => {
    const SKIP = /^(agent|broker|contact|cc|oh)\.|fine|legal|disc|footer|address|^place$|\.place$|fact|stat|kicker|cta|logo|title|head|label|\.name$|\.dist$|return|status|steps|call|grid|level|plannote|footnote/i;
    const T0 = performance.now();
    for(const el of (root || document).querySelectorAll('[data-slot]')){
      if(performance.now() - T0 > 5000) break;
      const slot = el.dataset.slot || ''; if(SKIP.test(slot) || el.querySelector('[data-slot]') || el.closest('.cc')) continue;
      if(el.textContent.trim().split(/\s+/).length < 6 || getComputedStyle(el).whiteSpace === 'nowrap' || !el.getClientRects().length) continue;
      const ta = el.style.textAlign, just = /justify/.test(getComputedStyle(el).textAlign);
      const meas = () => { if(just) el.style.textAlign = 'left'; const L = rows(el), W = el.getBoundingClientRect().width; if(just) el.style.textAlign = ta;
        return {n: L.length, k: L.length ? (L[L.length - 1].r - L[L.length - 1].l)/W : 1, inner: L.length > 1 ? Math.min(...L.slice(0, -1).map(x => (x.r - x.l)/W)) : 1}; };
      const fits = () => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1;
      const m0 = meas(); if(m0.n < 2) continue;
      if(m0.k >= .86) continue;   // well settled
      const fs0 = parseFloat(getComputedStyle(el).fontSize), fsS = el.style.fontSize, ls0 = el.style.letterSpacing; let best = null;
      for(const sc of [1, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.10, 1.11, 1.12]) for(const ls of [0, .005, -.005, .01, -.01, .015, -.015, .02, -.02]){
        el.style.fontSize = (fs0*sc) + 'px'; el.style.letterSpacing = ls ? ls + 'em' : '';
        const m = meas(); if(m.n !== m0.n || m.k < .83 || !fits()) continue;
        const score = Math.min(m.k, .95) + Math.min(m.inner, .9) - Math.abs(sc - 1)*3 - Math.abs(ls)*20;
        if(!best || score > best.score) best = {score, sc, ls}; }
      if(!best && m0.k >= .8){ el.dataset.fixed = el.dataset.fixed || '1'; continue; }   // 80%+ already: keep it as fitted (no grow pass)
      if(best){ el.style.fontSize = (fs0*best.sc) + 'px'; el.style.letterSpacing = best.ls ? best.ls + 'em' : ''; el.dataset.fixed = '1'; el.dataset.lastfix = '1'; }
      else { el.style.fontSize = fsS; el.style.letterSpacing = ls0; }
    }
    SW.noWide(root);
  };
  // owner 11/12: never spread words. The last step on every page: each justified block's lines are measured one by one (the line's slack
  // over its word count, plus a normal space of its own type, as the print check measures it); a line that would open past 2x a normal
  // space sets the whole block ragged. The fitters measure line fill ragged, so their rules still hold.
  SW.noWide = (root, maxX) => {
    maxX = maxX || 2;
    for(const el of (root || document).querySelectorAll('[data-slot]')){
      if(el.querySelector('[data-slot]') || !el.getClientRects().length) continue;
      const cs = getComputedStyle(el); if(!/justify/.test(cs.textAlign)) continue;
      const ta = el.style.textAlign; el.style.textAlign = 'left'; const L = rows(el); el.style.textAlign = ta;
      if(L.length < 2) continue;
      CTX.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const sp = CTX.measureText(' ').width + (parseFloat(cs.wordSpacing) || 0) + (parseFloat(cs.letterSpacing) || 0);
      const R = el.getBoundingClientRect().right - (parseFloat(cs.paddingRight) || 0) - (parseFloat(cs.borderRightWidth) || 0);
      if(sp > .5 && L.slice(0, -1).some(x => x.n > 1 && (R - x.r)/(x.n - 1) + sp > maxX*sp)){ el.style.textAlign = 'left'; el.style.textAlignLast = ''; el.dataset.ragged = '1'; }
    }
    // a row keeps one setting (reviewer6 p36/p38): among multi-line text blocks whose tops line up, if one is ragged the justified ones
    // set ragged too
    const blocks = [...(root || document).querySelectorAll('[data-slot]')].filter(el => { if(el.querySelector('[data-slot]') || !el.getClientRects().length) return false;
      const q = el.getBoundingClientRect(), lh = parseFloat(getComputedStyle(el).lineHeight) || 12; return q.height >= lh*1.5 && el.textContent.trim().length > 40; });
    const just = el => /justify/.test(getComputedStyle(el).textAlign);
    blocks.filter(just).forEach(el => { const t = el.getBoundingClientRect().top;
      if(blocks.some(o => o !== el && !just(o) && !o.dataset.rowragged && Math.abs(o.getBoundingClientRect().top - t) < 3)){ el.style.textAlign = 'left'; el.style.textAlignLast = ''; el.dataset.ragged = '1'; el.dataset.rowragged = '1'; } });
  };

  // ---------- logos ----------
  SW.fitLogos = () => document.querySelectorAll('.logo[data-area] img').forEach(img => {
    const box = img.parentElement, a = img.naturalWidth / img.naturalHeight || 1;
    const maxW = pt(box.clientWidth) || 170;
    let h = Math.min(+box.dataset.maxh, Math.sqrt(+box.dataset.area / a));
    if(h * a > maxW) h = maxW / a;
    img.style.height = h + 'pt'; img.style.width = (h * a) + 'pt'; img.style.maxWidth = 'none'; img.style.maxHeight = 'none';
  });

  // ---------- listing facts ----------
  const n = v => Number(v).toLocaleString('en-US');
  const pl = (k, one, many) => `${n(k)} ${k==1 ? one : many}`;
  SW.stats = L => {
    const s = [];
    if(L.beds) s.push(pl(L.beds, 'Bedroom', 'Bedrooms'));
    if(L.baths){ const bt = BD.bathsText(L); s.push(bt.main); if(bt.half) s.push(bt.half); }
    if(L.sqft) s.push(`${n(L.sqft)} Square Feet`);
    if(L.yearBuilt) s.push(`Built in ${L.yearBuilt}`);
    s.push(L.stories == 1 ? (L.lotSize ? L.lotSize.replace(/^([\d,]+) Sq Ft Lot$/, '$1 Sq Ft Lot') : 'One Story') : `${L.stories} Stories`);
    return s;
  };

  // ---------- print checks ----------
  // Overflow per slot, type under 8 pt (6 pt for fine print), photos under 300 ppi at print size, empty slots, prices,
  // captions whose last line is under 3/4 full, sample text on a real agent's piece.
  SW.check = function(D, extra){
    const issues = [...(extra||[])];
    if(D && D.preview) issues.push({slot:'copy', kind:'preview-text', detail:'rough-draft preview lines; the writer has not run'});
    const sample = /\b(avery morgan|any brokerage|your brokerage|your website|lorem|ipsum|placeholder|tbd|xx+)\b|555[.\-]01\d\d/i;
    document.querySelectorAll('[data-slot]').forEach(el=>{
      const name = el.dataset.slot, cs = getComputedStyle(el), txt = el.textContent.trim();
      if(!el.getClientRects().length) return;
      const size = parseFloat(cs.fontSize)*72/96;
      const oneLine = cs.whiteSpace === 'nowrap';
      const max = +el.dataset.lines || 0;
      const over = oneLine ? el.scrollWidth > el.clientWidth + 1
                 : max ? SW.lines(el).n > max || el.scrollWidth > el.clientWidth + 1
                 : el.scrollHeight > el.clientHeight + 1;
      if(over) issues.push({slot:name, kind:'overflow', text:txt.slice(0,80), ...(max && !oneLine ? {lines:SW.lines(el).n, max} : {})});
      if(size < 8 && !el.dataset.fine) issues.push({slot:name, kind:'type-too-small', size:+size.toFixed(1)});
      if(size < 6) issues.push({slot:name, kind:'fine-print-below-6pt', size:+size.toFixed(1)});
      if(!txt && !el.dataset.optional && el.tagName !== 'IMG') issues.push({slot:name, kind:'empty-slot'});
      if(/\$\s?\d/.test(txt)) issues.push({slot:name, kind:'price', text:txt.slice(0,80)});
      if(!D.sample && sample.test(txt)) issues.push({slot:name, kind:'placeholder', text:txt.slice(0,80)});
    });
    document.querySelectorAll('[data-s][data-slot]').forEach(el=>{
      if(+el.dataset.lines < 2 || !el.textContent.trim()) return;
      const L = SW.lines(el);
      if(L.n < +el.dataset.lines) issues.push({slot:el.dataset.slot, kind:'caption-short', lines:L.n, want:+el.dataset.lines, diag: el.dataset.diag || ''});
      else if(L.fill < 0.75) issues.push({slot:el.dataset.slot, kind:'last-line-short', pct:Math.round(L.fill*100), diag: el.dataset.diag || ''});
    });
    document.querySelectorAll('.ph').forEach(el=>{
      const img = el.querySelector('img'), slot = el.dataset.slotPhoto || el.dataset.photo || 'photo';
      if(!img){ issues.push({slot, kind:'empty-photo-slot'}); return; }
      if(!img.complete || !img.naturalWidth){ issues.push({slot, kind:'photo-missing', src:img.getAttribute('src')}); return; }
      const wIn = el.clientWidth/96, hIn = el.clientHeight/96;
      const ppi = Math.min(img.naturalWidth/wIn, img.naturalHeight/hIn);
      if(ppi < 300) issues.push({slot, photo:el.dataset.photo, kind:'photo-under-300ppi', ppi:Math.round(ppi), placedIn:[+wIn.toFixed(2),+hIn.toFixed(2)]});
    });
    document.querySelectorAll('.ph').forEach(el => { const h = el.clientHeight*72/96, w = el.clientWidth*72/96;
      if(h < 85 || w/h > 3.1) issues.push({slot: el.dataset.slotPhoto || el.dataset.photo, kind:'photo-too-thin', detail: `${w.toFixed(0)} x ${h.toFixed(0)} pt`}); });
    // no photo number, QR, pin or listing price anywhere on the piece
    if(/\bqr\b|scan for/i.test(document.body.innerText)) issues.push({slot:'piece', kind:'qr-text'});
    if(window.ContactCard) issues.push(...ContactCard.check(document));
    if(window.IvoryPlan) issues.push(...IvoryPlan.check());
    return issues;
  };
  SW.placements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));


  // ---------- single pieces (Open House flyers, postcards) ----------
  // The page: print adds 0.125 in bleed on postcards, and a white 0.25 in margin on flyers (home printers); the navy field fills what is left.
  SW.frame = function(D, trimW, trimH, inner){
    const mode = D.mode || 'email', P = D.piece || {};
    const bleed = (mode === 'print' && P.print === 'bleed') ? 9 : 0;
    const inset = (mode === 'print' && P.print === 'margin') ? (P.margin || 18) : 0;
    const W = trimW + 2*bleed, H = trimH + 2*bleed;
    return {W, H, bleed, inset, html: `<div class="page spage" data-page="${esc(P.id||'')}" style="width:${W}pt;height:${H}pt;background:${inset ? '#fff' : 'var(--navy)'}">
      <div class="field" style="left:${inset}pt;top:${inset}pt;right:${inset}pt;bottom:${inset}pt"></div>
      <div class="sheet" style="left:${bleed}pt;top:${bleed}pt;width:${trimW}pt;height:${trimH}pt">${inner}</div></div>`};
  };
  SW.setup = async function(D){
    const b = D.brand || {};
    if(b.accent) document.documentElement.style.setProperty('--navy', b.accent);
    const nav = getComputedStyle(document.documentElement).getPropertyValue('--navy').trim();
    document.documentElement.style.setProperty('--cc-accent', nav);
    document.documentElement.style.setProperty('--cc-ink', nav);
    await Promise.all(['400 10pt Manrope','500 10pt Manrope','600 10pt Manrope','700 10pt Manrope','400 10pt "Source Sans 3"','600 10pt "Source Sans 3"','700 10pt "Source Sans 3"'].map(f => document.fonts.load(f)));
  };
  // the backs' contact card (owner 11/10/2026, rule 1): full width, shorter top to bottom (two rows), the brokerage logo inside it
  SW.CARD_Y = 692; SW.CARD_H = 66;
  SW.card = (box, A, hs, b) => ContactCard.html(box, Object.assign({}, A, {headshot: hs}), Object.assign({}, b, {logo: b.logoOnDark || b.logoKnockout || b.logo}),
    {layout: 'panel', size: 'short', bottomGap: .5, grow: 0, fieldAccent: true,
     s: {name: 21, nameFloor: 15, desigInline: true, wrap: false, phone: 14, line: 9.5, office: 9.5, hsW: 50, hsGap: 14, pad: [6, 14, 5], panelW: 168, panelPad: [5, 8], logo: {wide: [148, 32], square: [34, 34], tall: [36, 36]}}}).replace('class="cc ', 'class="cc sw-short ');
  // the plan's side margins (owner 11/12 review, p35/p37: the dark field beside a tall plan read as blank space): each floor's rooms
  // from the listing (name and size in feet, plus any rooms the data names with no size) stand beside the plan, left floors on the
  // left, the rest on the right, over the plan's full height. The plan itself is never moved, scaled or redrawn.
  SW.planSides = (D, r, box, extra, out) => {   // out: how far past the plan's box the lists may reach (to the page margin), pt
    const lv = ((D.plan && D.plan.levels) || []), n = lv.length, rooms = ((D.listing || {}).rooms || []);
    if(!r || !r.usedW || r.rotated || !n) return '';
    out = out || 0; const m = (box.w - r.usedW)/2 + out, gap = 16, w = m - gap;
    if(w < 72) return '';
    const ft = t => String(t || '').replace(/^(\d+)\s*x\s*(\d+)$/, "$1' x $2'");
    const per = lv.map((L, i) => { const ex = (extra && extra[i]) || null;
      const rows0 = ex ? ex : rooms.filter(q => q.level === i + 1).map(q => [q.name, ft(q.size)]);
      // the plan's own room names and sizes (owner 11/13/2026, captions round 3 Q2): each row takes its room's label from the plan beside it
      const rows = window.PlanRooms ? PlanRooms.match(D, rows0.map(q => ({name: q[0], size: q[1], level: i}))).map(q => [q.name, q.size]) : rows0;
      return {name: n === 2 ? ['Downstairs', 'Upstairs'][i] : (L.name || ''), rows}; });   // the plan already prints each floor's name under it
    const k = Math.ceil(n/2), sides = [per.slice(0, k), per.slice(k)];
    if(sides.some(sd => !sd.some(f => f.rows.length))) return '';
    const top = box.y + Math.max(0, (box.h - r.usedH)/2), H = r.usedH;
    return sides.map((sd, si) => { const x = si ? box.x + box.w + out - w : box.x - out, al = si ? 'right' : 'left';
      const items = [].concat(...sd.map((f, fi) => [{head: f.name, fi}].concat(f.rows.map(q => ({q, fi})))));
      return `<div class="abs plan-side" style="left:${x.toFixed(2)}pt;top:${top.toFixed(2)}pt;width:${w.toFixed(2)}pt;height:${H.toFixed(2)}pt;text-align:${al}">${items.map((it, j) => it.head != null
        ? `<div class="ps-h" data-slot="plan.side${si}.h${it.fi}" data-lines="1">${esc(it.head)}</div>`
        : `<div class="ps-r"><div class="ps-n" data-slot="plan.side${si}.r${j}.n" data-lines="1">${esc(it.q[0])}</div>${it.q[1] ? `<div class="ps-d" data-slot="plan.side${si}.r${j}.d" data-lines="1">${esc(it.q[1])}</div>` : ''}</div>`).join('')}</div>`; }).join('');
  };
  SW.place = L => [L.city, [L.state, L.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  // a paragraph box: whole sentences that fill exactly `lines` lines (fill pass); lead optional
  SW.para = (c, slot, lines, cls, style, lh) => `<div class="${cls||''}" data-slot="${slot}" data-lines="${lines}" data-lead="${esc(c.lead||'')}" data-s='${esc(JSON.stringify([].concat(c.s || c))).replace(/'/g,'&#39;')}' style="height:${lines*(lh||14)}pt;line-height:${lh||14}pt;${style||''}"></div>`;
  // Open house fields. Everything comes from data: nothing is invented. A public open house shows date and time only;
  // broker and REALTOR(R) opens may carry refreshments and a note, and no RSVP wording ever prints (rule of 10/27/2026).
  SW.noRSVP = s => { s = String(s||'').trim(); const ask = /\brsvp|r\.s\.v\.p|please reply|reply by\b/i; if(!ask.test(s)) return s;
    return s.split(/\s*(?:[·;|•]|(?<=[.!?])\s)\s*/).filter(p => p && !ask.test(p)).join('  ·  ').trim(); };
  SW.openHouse = function(D){
    const O = D.openHouse || {}, A = D.agent || {};
    const kinds = {public:'Public Open House', broker:'Broker Open House', realtor:'REALTOR® Open House'};
    let kind = O.kind in kinds ? O.kind : 'public';
    if(kind === 'realtor' && !A.nar) kind = 'broker';
    const r = {kind, label:kinds[kind], long:'', weekday:'', monthDay:'', month:'', monthShort:'', day:'', time:'', note:'', refreshments:''};
    if(kind !== 'public'){ r.note = SW.noRSVP(O.note || O.coop || ''); r.refreshments = String(O.refreshments || '').trim(); }
    const dt = /^\d{4}-\d{2}-\d{2}$/.test(O.date||'') ? new Date(O.date + 'T12:00:00') : null;
    if(dt && !isNaN(dt)){
      const f = o => dt.toLocaleDateString('en-US', o);
      r.weekday = f({weekday:'long'}); r.month = f({month:'long'}); r.monthShort = f({month:'short'}); r.day = f({day:'numeric'});
      r.monthDay = `${r.month} ${r.day}`; r.long = `${r.weekday}, ${r.monthDay}`;
    } else if(O.date){ r.long = String(O.date); }
    const t12 = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s||''); if(!m) return null; let H = +m[1]; const M = +m[2]; const ap = H >= 12 ? 'pm' : 'am'; H = H % 12 || 12; return {txt: M ? `${H}:${String(M).padStart(2,'0')}` : `${H}:00`, ap}; };
    const a = t12(O.start), z = t12(O.end);
    if(O.timeText) r.time = String(O.timeText);
    else if(a && z) r.time = a.ap === z.ap ? `${a.txt} to ${z.txt} ${z.ap}` : `${a.txt} ${a.ap} to ${z.txt} ${z.ap}`;
    else if(a) r.time = `${a.txt} ${a.ap}`;
    return r;
  };


  // Does the whole house (photo.box, fractions) stay inside a w x h frame when the photo covers it? (a photo with no box always does)
  SW.fits = (D, id, w, h) => {
    const p = (D.photos||{})[id]; if(!p || !p.box || !p.w || !p.h) return true;
    const ia = p.w/p.h, ta = w/h, [x0, y0, x1, y1] = p.box;
    return ta >= ia ? (ia/ta >= (y1 - y0) - .002) : (ta/ia >= (x1 - x0) - .002);
  };
  // The hero frame: the whole house across w x h. A tall, narrow house that would be cut in a frame that wide takes a narrower
  // frame (1.3 : 1) and two interiors (side: two photo ids) stacked beside it, so the house is never cut.
  SW.heroHtml = (D, id, x, y, w, h, slot, side) => {
    const box = (px, py, pw, ph, pid, sl) => `<div class="abs" style="left:${px}pt;top:${py}pt;width:${pw}pt;height:${ph}pt">${SW.photo(D, pid, 'position:absolute;inset:0', sl)}</div>`;
    if(!side || !side.length || SW.fits(D, id, w, h)) return box(x, y, w, h, id, slot);
    const w1 = Math.round(h*1.3), gap = 12, w2 = w - w1 - gap, hh = (h - 10)/2;
    return box(x, y, w1, h, id, slot) + box(x + w1 + gap, y, w2, hh, side[0], slot + '.side0') + box(x + w1 + gap, y + hh + 10, w2, hh, side[1], slot + '.side1');
  };

  window.SW = SW;
})();

/* Bath wording (owner 11/1/2026; templates/_shared/baths.js): load it here for every page of this design; a ½ in text is set small. */
(function(){ if(!window.BD || !BD.bathPair) document.write('<script src="../engine/baths.js"><\/script><script src="../engine/baths-text.js"><\/script>'); })();
