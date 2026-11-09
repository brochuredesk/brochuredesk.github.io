/* fxs-11 helpers (ported from the swatchbook set's swatchbook.js, FX11 look): data, photos, captions and paragraphs that fill their boxes, logos, print checks, the set's tokens (FXS.tok, read from fxs11.css) and marks (icons, arch).

   Captions and paragraphs are written as a lead plus whole sentences (data-s). Each box has a line count; the fill pass
   picks the sentences, in the writer's order, that set in exactly that many lines with the last line at least 3/4 full.
   It never cuts a word or a sentence; when no set of whole sentences fits, the box is reported and goes back to the writer. */
(function(){
  const SW = {};
  const FXS = SW;
  const esc = SW.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pt = px => px*72/96;
  SW.data = () => { const D = JSON.parse(document.getElementById('brochure-data').textContent || '{}'); const C = ((D.sw || {}).colors) || {}, st = document.documentElement.style, hx = v => /^#[0-9a-f]{6}$/i.test(String(v || '')); if(hx(C.page)){ ['--fx-paper','--cc-paper','--paper','--navy'].forEach(n => st.setProperty(n, C.page)); } if(hx(C.planBox)){ st.setProperty('--fx-plan', C.planBox); } return D; }; /* editable colors: sw.colors.page (page tone) and sw.colors.planBox (floor-plan card) */

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
    return {n: lines.length, fill: last ? (last.r-last.l)/box : 0, min: lines.length > 1 ? Math.min(...lines.slice(0, -1).map(l => (l.r - l.l)/box)) : 1};
  };
  SW.textWidth = el => { const r = document.createRange(); r.selectNodeContents(el); return pt(r.getBoundingClientRect().width); };
  const html = (lead, sents) => (lead ? `<b>${esc(lead)}</b> ` : '') + esc(sents.join(' '));
  // The sets of whole sentences (the first always stays) that set in exactly T lines with the last line 3/4 full or more.
  // Returns {pick, fill} (fewest sentences first), or null with el.dataset.diag saying how close the pool came.
  const USED = new Set(), nrm = t => String(t).toLowerCase().replace(/\s+/g, ' ').trim();
  const cw_ = t => new Set((String(t).toLowerCase().match(/[a-z]{4,}/g) || []));
  const sameFact = pick => { const ws = pick.map(cw_); for(let a = 0; a < ws.length; a++) for(let b = a + 1; b < ws.length; b++){ const c = [...ws[a]].filter(x => ws[b].has(x)).length; if(c >= 3 && c >= .6*Math.min(ws[a].size, ws[b].size)) return true; } return false; };
  SW.resetUsed = () => USED.clear();
  const pickFor = (el, T) => {
    // each sentence is a string, or a list of ways to say the same fact at different lengths (only one is ever used); a sentence already set elsewhere on the piece is left out
    let S = JSON.parse(el.dataset.s).map(x => [].concat(x)); const S0 = S;
    S = S.map((a, i) => { const f = a.filter(t => !USED.has(nrm(t))); return f; }).filter(a => a.length); if(!S.length) S = S0;
    const lead = el.dataset.lead || '', n = Math.min(S.length, 12);
    let best = null, near = null, hi = null, lo = null;
    const full = S.map(a => a[0]);
    el.innerHTML = html(lead, full); const A = SW.lines(el), allLen = (lead ? lead.length + 1 : 0) + full.join(' ').length, cpl = allLen / Math.max(.5, A.n - 1 + A.fill);
    const lead0 = lead ? lead.length + 1 : 0;
    const test = pick => {
      if(sameFact(pick)) return;
      if(pick.length < (+el.dataset.min || 1)) return;   // a box that asks for two sentences never settles for one
      const est = (lead0 + pick.join(' ').length) / cpl;
      if(est < T - 1.5 || est > T + 0.9) return;
      el.innerHTML = html(lead, pick);
      const L = SW.lines(el);
      if(L.n === T + 1 && (!hi || L.fill < hi.fill)) hi = {fill: L.fill};
      if(L.n === T - 1 && (!lo || L.fill > lo.fill)) lo = {fill: L.fill};
      if(L.n !== T) return;
      if(!near || L.fill > near.fill) near = {pick, fill: L.fill};
      if(L.fill < Math.max(0.76, +el.dataset.fill || 0)) return;   // data-fill: a write-up's own floor for its last line (0.9, owner 11/7-11/8)
      if(el.dataset.lfill && L.min < +el.dataset.lfill) return;   // a justified write-up: every other line already 80%+ full set ragged, so justifying never opens wide gaps
      const score = (L.fill >= 0.8 ? 1000 : 500) - pick.length * 10 + L.fill + (el.dataset.lfill ? 20*L.min : 0);   // the fewest, fullest sentences that fill the box; the last line well filled
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
  // Same as pickFor, and when the box's whole sentences cannot fill T lines at its width, the box narrows (6 pt steps, up to data-narrow steps, 8 by default;
  // text is left aligned, so a slightly shorter line is invisible) until a set of whole sentences does. Returns null (width restored) when none does.
  const pfN = (el, T) => {
    if(el.dataset.w0 == null) el.dataset.w0 = el.getBoundingClientRect().width*.75;
    const base = +el.dataset.w0, maxK = el.dataset.narrow != null ? +el.dataset.narrow : 8;
    for(let k = 0; k <= maxK; k++){ el.style.width = (base - k*(+el.dataset.nstep || 6)) + 'pt'; const b = pickFor(el, T); if(b) return b; }
    el.style.width = base + 'pt'; return pickFor(el, T);
  };
  SW.pfN = pfN;   // SW.grow re-picks a write-up's sentences at a bigger size
  const LH = 12.5, CAPPAD = 5;
  // owner 11/8/2026: a caption's own sentences, then the listing's other true lines about the same photo (companion.roomLines[photo].all), at most 9, no fact twice
  SW.capPool = (D, c) => { const own = [].concat(c.s || c.a || []), R = ((((D || {}).companion || {}).roomLines || {})[c.photo] || {}).all || [], key = x => String([].concat(x)[0]).toLowerCase().replace(/[^a-z ]/g, '').slice(0, 24);
    const STOP = /^(the|and|with|from|into|that|this|room|one|its|has|have|sits|runs|over|under|along|each|both)$/, cw = x => new Set(String(x).toLowerCase().match(/[a-z]{4,}/g) || []), near = (a, b) => { const A = cw(a); let k = 0; cw(b).forEach(w => { if(A.has(w) && !STOP.test(w)) k++; }); return k >= 2; };
    const seen = new Set(own.map(key)), out = own.slice(); R.forEach(r => { if(out.length < 11 && !seen.has(key(r)) && !out.some(o => [].concat(o).some(a => near(a, r)))){ seen.add(key(r)); out.push(r); } }); return out; };
  SW.fill = () => {
    const issues = []; USED.clear();
    const caps = [...document.querySelectorAll('.cap .a[data-s]')], rest = [...document.querySelectorAll('[data-s]')].filter(e => !caps.includes(e));
    const settle = (el, T) => {   // T lines: the best set, else the nearest and a report
      const lead = el.dataset.lead || '', b = pfN(el, T);
      if(b){ el.innerHTML = html(lead, b.pick); delete el.dataset.diag; b.pick.forEach(t => USED.add(nrm(t))); }
      else { const pk = el.__near ? el.__near.pick : JSON.parse(el.dataset.s).map(x => [].concat(x)[0]); el.innerHTML = html(lead, pk); pk.forEach(t => USED.add(nrm(t))); }
      el.dataset.lines = T; if(el.dataset.justify && b) el.style.textAlign = 'justify'; return !!b;
    };
    const fitRest = el => {
      // data-try="5,4,3": the line counts this box may take (most lines first); the first that the whole sentences fill (last line 3/4 full) wins
      const tries = (el.dataset.try || '').split(',').map(Number).filter(Boolean);
      if(tries.length){
        let T = tries.find(t => pfN(el, t));
        if(!T){ let bestT = tries[0], bf = -1; tries.forEach(t => { pfN(el, t); if(el.__near && el.__near.fill > bf){ bf = el.__near.fill; bestT = t; } }); T = bestT; }
        settle(el, T);
        if(el.dataset.lh) el.style.height = (T * +el.dataset.lh) + 'pt';
      } else settle(el, +el.dataset.lines || 1);
    };
    rest.forEach(fitRest);
    // the captions in one row share a line count and size
    const groups = new Map();
    caps.forEach(el => { const g = el.closest('.row') || el; (groups.get(g) || groups.set(g, []).get(g)).push(el); });
    // owner 11/8/2026 (standing rule, every design): the caption under a photo keeps the photo's full width (never narrowed); every line, set ragged,
    // runs 80%+ of it (the last line too), then it is justified so its right edge lines up under the photo. When whole sentences can't fill the
    // space's lines at the set size, the type grows (up to 12%, same line count). Never a shorter caption, never empty space under a photo.
    groups.forEach(els => {
      const max = Math.max(...els.map(e => +e.dataset.lines)), lh0 = +els[0].dataset.lh || LH;
      const fs0 = els.map(e => parseFloat(getComputedStyle(e).fontSize) * .75), lhs = els.map(e => +e.dataset.lh || LH);
      els.forEach(e => { const ph = e.closest('.item') && e.closest('.item').querySelector('.ph'), pw = +e.dataset.pw || (ph ? ph.getBoundingClientRect().width * .75 : 0), bw = e.getBoundingClientRect().width * .75, f = Math.min(.97, Math.max(.8, pw && bw ? .8 * pw / bw : .8));   // every line 80%+ of the PHOTO's width (a column indented from its photo needs a fuller share of its own box)
        e.dataset.narrow = '0'; e.dataset.fill = f; e.dataset.lfill = f; e.style.textAlign = 'left'; });
      const size = k => els.forEach((e, i) => { e.style.fontSize = fs0[i] * k + 'pt'; });
      const ks = [1, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.1, 1.11, 1.12, 0.98, 0.96];   // up to 12% bigger; a last resort (0.98, 0.96) only when no larger size fills
      let chosen = null;
      for(const T of [max]){ for(const k of ks){ size(k); if(els.every(e => pfN(e, T))){ chosen = [T, k]; break; } } if(chosen) break; }
      if(chosen){ size(chosen[1]); els.forEach(e => settle(e, chosen[0])); }
      else els.forEach((e, i) => {   // no common size fills: each takes the size at which its own sentences do (caption-line-short reports any that still can't)
        let best = null; const T = max;
        for(const k of ks){ e.style.fontSize = fs0[i] * k + 'pt'; e.__near = null; if(pfN(e, T)){ best = {k, fill: 2}; break; } if(e.__near && (!best || e.__near.fill > best.fill)) best = {k, fill: e.__near.fill, pick: e.__near.pick}; }
        if(best){ e.style.fontSize = fs0[i] * best.k + 'pt'; e.__near = best.pick ? {pick: best.pick, fill: best.fill} : null; settle(e, T); }
        else {   // nothing sets in the space: the whole sentences, in order, that fit (never an overflow)
          e.style.fontSize = fs0[i] + 'pt'; const S = JSON.parse(e.dataset.s).map(x => [].concat(x)[0]), lead = e.dataset.lead || '', pick = [];
          for(const x of S){ e.innerHTML = html(lead, pick.concat(x)); if(SW.lines(e).n <= T) pick.push(x); }
          e.innerHTML = html(lead, pick.length ? pick : [S[0]]); e.dataset.lines = T; } });
      els.forEach((e, i) => { e.style.textAlign = 'justify'; e.style.height = (max * lhs[i]) + 'pt'; });
      els.forEach(e => { e.parentElement.style.height = (CAPPAD + max * lh0) + 'pt'; });
    });
    SW.grow();
    return issues;
  };

  // A full-width write-up (data-justify: owner 11/8, a write-up beside a plan or photo keeps its column's full width, every line to the edge, last line 90%+):
  // when its sentences end short of the box, it takes the smallest bigger type (0.25 pt steps, up to 1.25x) at which a set of its sentences fills the box,
  // every line 80%+ and the last 90%+ set ragged; then it is justified. Runs after SW.fill.
  // a cover write-up that keeps every sentence (data-just): the type moves in 0.1 pt steps until the lines as the page really sets them end 90%+ full in the same room
  SW.tune = () => document.querySelectorAll('[data-just]').forEach(el => { if(!el.textContent.trim()) return;
    const n0 = +el.dataset.lines, cs0 = getComputedStyle(el), fs0 = parseFloat(cs0.fontSize)*0.75, lh0 = parseFloat(cs0.lineHeight)*0.75, H = n0*lh0, w1 = el.style.width, w0 = +el.dataset.w0 || parseFloat(w1);
    const okLh = (fs, n) => { const q = H/n/fs; return q >= 1.3 && q <= 1.65; };   // the box keeps its height: one line more or less changes the line spacing a little
    const order = [0]; for(let k = 1; k <= 40; k++) order.push(-k, k);
    el.style.width = w0 + 'pt';   // the column's full width
    const keepH = el.innerHTML; let ok = null;
    for(const k of order){ const fs = fs0 + k*0.1; el.style.fontSize = fs + 'pt'; const L = SW.lines(el);   // 1: the same sentences, type moves
      if(Math.abs(L.n - n0) <= 1 && L.fill >= 0.9 && okLh(fs, L.n)){ ok = {fs, n: L.n}; break; } }
    if(!ok){   // 2: the sentence versions move too (every sentence stays), last line 90%+, every other line 70%+ set ragged
      const alts = JSON.parse(el.dataset.s).flatMap(x => [].concat(x)), txt = el.textContent, mine = alts.filter(t => txt.indexOf(t) >= 0);
      mine.forEach(t => USED.delete(nrm(t))); const was = [el.dataset.fill, el.dataset.lfill, el.dataset.narrow]; el.dataset.fill = '0.9'; el.dataset.lfill = '0.62'; el.dataset.narrow = '0';
      outer: for(const k of order){ const fs = fs0 + k*0.1; el.style.fontSize = fs + 'pt';
        for(const n of [n0, n0 - 1, n0 + 1]){ if(!okLh(fs, n)) continue; const b = pfN(el, n); if(b && b.pick.length >= +(el.dataset.min || 1)){ ok = {fs, n}; el.innerHTML = (el.dataset.lead ? `<b>${esc(el.dataset.lead)}</b> ` : '') + esc(b.pick.join(' ')); b.pick.forEach(t => USED.add(nrm(t))); break outer; } } }
      if(!ok){ el.innerHTML = keepH; mine.forEach(t => USED.add(nrm(t))); if(was[0]) el.dataset.fill = was[0]; else delete el.dataset.fill; if(was[1]) el.dataset.lfill = was[1]; else delete el.dataset.lfill; el.dataset.narrow = was[2]; } }
    if(ok){ el.style.fontSize = ok.fs + 'pt'; el.style.lineHeight = (H/ok.n) + 'pt'; el.style.height = H + 'pt'; el.dataset.lines = ok.n; el.style.textAlign = 'justify'; el.dataset.fill = '0.9'; }
    else { el.style.fontSize = fs0 + 'pt'; el.style.width = w1; } });
  SW.grow = () => {
    SW.tune();
    const groups = new Map();
    document.querySelectorAll('[data-justify]').forEach(el => { if(!el.textContent.trim()) return; const k = el.dataset.group || el; (groups.get(k) || groups.set(k, []).get(k)).push(el); });
    groups.forEach(els => {   // the write-ups of one group (the sections of a back, the entries of a list) share one type size
      const S = els.map(el => { const cs = getComputedStyle(el), fs0 = parseFloat(cs.fontSize)*0.75, r = (parseFloat(cs.lineHeight)*0.75)/fs0 || 1.5, H = +(el.dataset.h0 || parseFloat(el.style.height)),
        keep = el.innerHTML, txt = el.textContent, mine = JSON.parse(el.dataset.s).flatMap(x => [].concat(x)).filter(t => txt.indexOf(t) >= 0);
        mine.forEach(t => USED.delete(nrm(t))); el.style.textAlign = 'left'; el.style.height = 'auto';   // its own sentences are free to be picked again
        return {el, fs0, r, H, keep, mine, T0: Math.max(2, Math.round(H/(fs0*r)))}; });
      if(S[0].el.dataset.spread){   // a list of short entries (the fact tiles): each takes the type size its own sentences fill at, within a quarter-point window of the others
        const win = +S[0].el.dataset.spread; let done = null;
        for(const tier of [{fill: '0.9', lfill: '0.8'}, {fill: '0.9', lfill: '0.7'}]){
          S.forEach(o => { o.el.dataset.fill = tier.fill; o.el.dataset.lfill = tier.lfill; });
          const feas = S.map(o => { const m = {}; for(let k = 0; k < 40; k++){ const fs = o.fs0 + k*0.25; if(fs > o.fs0*1.25 + 0.01) break; o.el.style.fontSize = fs + 'pt';
            for(const t of [o.T0, o.T0 - 1]){ if(t < 2 || o.H/t < fs*1.3 || o.H/t > fs*1.75) continue; o.el.style.lineHeight = (o.H/t) + 'pt'; const b = pfN(o.el, t); if(b){ m[k] = {fs, n: t, pick: b.pick}; break; } } } return m; });
          for(let k0 = 0; k0 < 40 && !done; k0++){ const sel = feas.map(m => { for(let k = k0; k <= k0 + win; k++) if(m[k]) return m[k]; return null; }); if(sel.every(Boolean)) done = sel.map((g, i) => Object.assign({o: S[i]}, g)); }
          if(done) break; }
        if(done){ done.forEach(g => { const el = g.o.el; el.style.fontSize = g.fs + 'pt'; el.innerHTML = (el.dataset.lead ? `<b>${esc(el.dataset.lead)}</b> ` : '') + esc(g.pick.join(' ')); g.pick.forEach(t => USED.add(nrm(t)));
            el.style.lineHeight = (g.o.H/g.n) + 'pt'; el.style.height = g.o.H + 'pt'; el.dataset.lines = g.n; el.style.textAlign = 'justify'; }); return; }
        S.forEach(o => { delete o.el.dataset.lfill; delete o.el.dataset.fill; });
      }
      let ok = null;
      for(const tier of [{fill: '0.9', lfill: '0.8'}, {fill: '0.9', lfill: '0.72'}]){   // strict first; a little looser rather than falling back to short lines
        S.forEach(o => { o.el.dataset.fill = tier.fill; o.el.dataset.lfill = tier.lfill; });
        for(let k = 0; k < 30 && !ok; k++){
          const picks = [];
          for(const o of S){ const fs = o.fs0 + k*0.25; if(fs > o.fs0*1.25 + 0.01){ picks.length = 0; break; }
            o.el.style.fontSize = fs + 'pt'; let got = null;   // the box keeps its height; the line height eases toward 1.3x the type before the line count drops
            for(const t of [o.T0, o.T0 - 1]){ if(t < 2 || o.H/t < fs*1.3 || o.H/t > fs*1.75) continue; o.el.style.lineHeight = (o.H/t) + 'pt'; const b = pfN(o.el, t); if(b){ got = {o, fs, n: t, pick: b.pick}; break; } }
            if(!got){ picks.length = 0; break; } picks.push(got); }
          if(picks.length === S.length) ok = picks; else if(!picks.length && S[0].fs0 + k*0.25 > S[0].fs0*1.25) break; }
        if(ok) break; }
      if(ok) ok.forEach(g => { const el = g.o.el; el.style.fontSize = g.fs + 'pt'; el.innerHTML = (el.dataset.lead ? `<b>${esc(el.dataset.lead)}</b> ` : '') + esc(g.pick.join(' ')); g.pick.forEach(t => USED.add(nrm(t)));
        el.style.lineHeight = (g.o.H/g.n) + 'pt'; el.style.height = g.o.H + 'pt'; el.dataset.lines = g.n; el.style.textAlign = 'justify'; });
      else S.forEach(o => { const el = o.el;   // the pool is too short for this width: back to the set's earlier fit (ragged, narrowed a little), last line 3/4 full
        el.style.fontSize = o.fs0 + 'pt'; el.style.lineHeight = (o.fs0*o.r) + 'pt'; el.dataset.nogrow = '1'; el.dataset.narrow = el.dataset.nfb || '8'; delete el.dataset.lfill; delete el.dataset.justify; el.dataset.fill = '0.75';
        const tries = (el.dataset.try || '').split(',').map(Number).filter(Boolean); let T = tries.find(t => pfN(el, t)); if(!T) T = +el.dataset.lines;
        const b = pfN(el, T); const pk = b ? b.pick : JSON.parse(el.dataset.s).map(x => [].concat(x)[0]);
        el.innerHTML = (el.dataset.lead ? `<b>${esc(el.dataset.lead)}</b> ` : '') + esc(pk.join(' ')); pk.forEach(t => USED.add(nrm(t)));
        const L = SW.lines(el); el.style.height = (L.n*o.fs0*o.r) + 'pt'; el.dataset.lines = L.n; el.style.textAlign = 'left'; });
    });
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
    if(L.baths) s.push(L.halfBaths ? `${L.baths} Full & ${L.halfBaths} Half Baths` : pl(L.baths, 'Full Bath', 'Full Baths'));
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
      else if(L.fill < Math.max(0.75, (+el.dataset.fill || 0) - 0.005)) issues.push({slot:el.dataset.slot, kind:'last-line-short', pct:Math.round(L.fill*100), diag: el.dataset.diag || ''});
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
    // the same photo twice on one page (or a near-duplicate: the same room or view under another number, review r2)
    const famOf = id => { id = String(id).replace(/(\d)[a-z]$/, '$1'); return /^(deck|pergola|patio|fence|evening)\d*$/.test(id) ? 'outdoor' : /^(front)\d*$/.test(id) ? 'front' : /^(primary|game|terrace|gazebo)\d*$/.test(id) ? id.replace(/\d+$/, '') : id; };   // the same view or room under another number
    document.querySelectorAll('.panel').forEach(pn => {
      const seen = new Map();
      pn.querySelectorAll('.ph[data-photo]').forEach(el => {
        const id = el.dataset.photo; if(!id) return;
        const key = famOf(id), prev = seen.get(key);
        if(prev && prev !== id) issues.push({slot: el.dataset.slotPhoto || id, kind: 'near-duplicate-photo', detail: `${id} and ${prev} show the same room or view on one page`});
        else if(prev === id) issues.push({slot: el.dataset.slotPhoto || id, kind: 'duplicate-photo', detail: `${id} is on the page twice`});
        seen.set(key, id);
      });
    });
    // no photo number, QR, pin or listing price anywhere on the piece
    if(/\bqr\b|scan for/i.test(document.body.innerText)) issues.push({slot:'piece', kind:'qr-text'});
    // FX11 set checks: the same sentence twice in one piece, a photo (or an identical caption lead) twice across the whole piece, a pill that is a box label
    (() => {
      const norm = t => t.toLowerCase().replace(/\s+/g, ' ').trim(), seen = new Map(), words = t => new Set((t.toLowerCase().match(/[a-z]{4,}/g) || []));
      document.querySelectorAll('[data-s][data-slot], .body[data-slot], .wu[data-slot]').forEach(el => {
        const lead0 = (el.dataset.lead || '').trim(); let t = el.textContent.replace(/\s+/g, ' ').trim(); if(lead0 && t.startsWith(lead0)) t = t.slice(lead0.length).trim(); const ss = t.split(/(?<=[.!?])\s+/).filter(s => s.split(' ').length >= 5), mine = [];
        ss.forEach(s => { const k = norm(s); if(seen.has(k) && seen.get(k) !== el) issues.push({slot: el.dataset.slot, kind: 'sentence-twice', detail: `"${s.slice(0, 60)}" is on this piece twice`}); else seen.set(k, el);
          const w = words(s); mine.forEach(m => { const c = [...w].filter(x => m.has(x)).length; if(c >= 3 && c >= .6*Math.min(w.size, m.size)) issues.push({slot: el.dataset.slot, kind: 'same-fact-twice', detail: `two sentences here say the same thing: "${s.slice(0, 50)}"`}); }); mine.push(w); });
      });
      const ids = new Map(), leads = new Map();
      document.querySelectorAll('.ph[data-photo]').forEach(el => { const id = el.dataset.photo; if(!id) return; if(ids.has(id)) issues.push({slot: el.dataset.slotPhoto || id, kind: 'duplicate-photo-on-piece', detail: `${id} is on this piece twice`}); ids.set(id, 1); });
      document.querySelectorAll('.cap .a[data-lead]').forEach(el => { const l = (el.dataset.lead || '').toLowerCase(); if(!l || /^(front|back)/.test(l)) return; if(leads.has(l)) issues.push({slot: el.dataset.slot, kind: 'caption-lead-twice', detail: `"${el.dataset.lead}" opens two captions on this piece`}); leads.set(l, 1); });
      document.querySelectorAll('.pill').forEach(el => { if(el.childNodes.length > 1 || /-IN[A-Z]/.test(el.textContent)) issues.push({slot: el.dataset.slot || 'pill', kind: 'pill-text-split', detail: `"${el.textContent.trim()}" would lose a space`}); });
      const labels = new Set((((D || {}).sw || {}).left && D.sw.left.box ? D.sw.left.box.items : []).map(i => String(i.l).toLowerCase()));
      document.querySelectorAll('.pill.tag').forEach(el => { if(labels.has(el.textContent.trim().toLowerCase())) issues.push({slot: el.dataset.slot || 'tag', kind: 'pill-is-box-label', detail: el.textContent.trim()}); });
    })();
    if(window.ContactCard) issues.push(...ContactCard.check(document));
    if(window.IvoryPlan) issues.push(...IvoryPlan.check());
    return issues;
  };
  SW.famOf = id => { id = String(id).replace(/(\d)[a-z]$/, '$1'); return /^(deck|pergola|patio|fence|evening)\d*$/.test(id) ? 'outdoor' : /^(front)\d*$/.test(id) ? 'front' : /^(primary|game|terrace|gazebo)\d*$/.test(id) ? id.replace(/\d+$/, '') : id; };
  SW.placements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));


  // ---------- single pieces (Open House flyers, postcards) ----------
  // The page: print adds 0.125 in bleed on postcards, and a white 0.25 in margin on flyers (home printers): the sheet is clipped
  // to the margin, so the gray band and every photo stop 0.25 in from the paper's edge there.
  SW.frame = function(D, trimW, trimH, inner){
    const mode = D.mode || 'email', P = D.piece || {};
    const bleed = (mode === 'print' && P.print === 'bleed') ? 9 : 0;
    const inset = (mode === 'print' && P.print === 'margin') ? (P.margin || 18) : 0;
    const W = trimW + 2*bleed, H = trimH + 2*bleed;
    return {W, H, bleed, inset, html: `<div class="page spage" data-page="${esc(P.id||'')}" style="width:${W}pt;height:${H}pt;background:var(--fx-paper)">
      <div class="sheet abs panel" style="left:${bleed}pt;top:${bleed}pt;width:${trimW}pt;height:${trimH}pt;${inset ? `clip-path:inset(${inset}pt)` : ''}">${inner}</div></div>`};
  };
  SW.setup = async function(D){
    await Promise.all(['300 10pt Montserrat','400 10pt Montserrat','500 10pt Montserrat','600 10pt Montserrat','700 10pt Montserrat','800 10pt Montserrat'].map(f => document.fonts.load(f)));
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


  // ---------- the set's tokens (fxs11.css is the one source) and marks ----------
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  FXS.tok = new Proxy({}, {get: (_, k) => ({
    paper: cssVar('--fx-paper'), band: cssVar('--fx-band'), ink: cssVar('--fx-ink'), ink2: cssVar('--fx-ink2'), text: cssVar('--fx-text'),
    textDark: cssVar('--fx-text-dark'), mute: cssVar('--fx-mute'), rule: cssVar('--fx-rule'), onInk: cssVar('--fx-on-ink'),
    onInkSoft: cssVar('--fx-on-ink-soft'), outline: cssVar('--fx-outline'), card: cssVar('--fx-card'), onCard: cssVar('--fx-on-card'), onCardSoft: cssVar('--fx-on-card-soft'), facts: cssVar('--fx-facts'), font: 'Montserrat', bandW: parseFloat(cssVar('--fx-band-w')), m: parseFloat(cssVar('--fx-m')),
    ruleW: parseFloat(cssVar('--fx-rule-w')), barW: parseFloat(cssVar('--fx-bar-w'))})[k]});
  // line icons (24 box, round caps): FX11's own five, plus stories and lot in the same hand
  FXS.ICON = {
    bed:'<path d="M3 18v-7h18v7M3 14h18M6 11V8h5v3M13 11V8h5v3"/>',
    bath:'<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/>',
    area:'<path d="M4 4h16v16H4zM4 9h5M15 20v-5h5"/>',
    cal:'<path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"/>',
    pin:'<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    stories:'<path d="M4 11l8-6 8 6M6 9.5V20h12V9.5M6 14.5h12"/>',
    lot:'<path d="M3 4h18v16H3z" stroke-dasharray="2.2 1.8"/><path d="M7.5 14.5l4.5-4 4.5 4M9 13.2V17h6v-3.8"/>'
  };
  FXS.icon = (name, size, color) => `<svg aria-hidden="true" width="${size}pt" height="${size}pt" viewBox="0 0 24 24" fill="none" stroke="${color || FXS.tok.ink2}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block">${FXS.ICON[name]}</svg>`;
  // the arch: the round left end (a half-capsule when the photo is wider than tall)
  FXS.arch = (w, h) => { const r = Math.min(w, h)/2; return `border-radius:${r}pt 0 0 ${r}pt`; };
  FXS.archBox = (w, h) => { const r = Math.min(w, h)/2; return `border-radius:${r}pt 0 0 ${r}pt`; };
  // the listing facts [icon, label, value]: beds, baths, sq ft, built, then stories and lot when the listing has them
  FXS.facts = (L, opts) => {
    const f = [], n = v => Number(v).toLocaleString('en-US');
    if(L.beds) f.push(['bed', 'Beds', String(L.beds)]);
    if(L.baths){   // baths wording: templates/_shared/baths.js (3 Full Baths / 3½ Baths / two or more halves on their own line)
      const b = window.BD && BD.bathNum ? BD.bathNum(L) : {num: String(L.baths), half: ''};
      f.push(['bath', b.label === 'Baths' ? 'Baths' : (+L.baths === 1 ? 'Full bath' : 'Full baths'), String(b.num).replace(/<[^>]*>/g, '')]);
      if(b.half) f.push(['bath', 'Half baths', String(L.halfBaths)]);
    }
    if(L.sqft) f.push(['area', 'Sq ft', n(L.sqft)]);
    const yr = L.yearBuilt || L.year; if(yr) f.push(['cal', 'Built', String(yr)]);
    if(opts && opts.more){
      if(L.stories) f.push(['stories', 'Stories', String(L.stories)]);
      const lot = L.lotAcres ? (L.lotAcres >= 0.5 ? `${L.lotAcres} acres` : `${n(Math.round(L.lotAcres*43560))} sq ft`) : L.lotSqft ? `${n(L.lotSqft)} sq ft` : L.lotSize ? String(L.lotSize).replace(/\s*Sq Ft Lot/i, ' sq ft') : '';
      if(lot) f.push(['lot', 'Lot', lot]);
    }
    return f;
  };
  // the street: light number over heavy caps name (the suffix drops first, then a long street runs two lines)
  FXS.SUF = /\s+(Street|St|Drive|Dr|Lane|Ln|Road|Rd|Avenue|Ave|Boulevard|Blvd|Court|Ct|Circle|Cir|Place|Pl|Way|Trail|Trl|Parkway|Pkwy|Terrace|Ter|Highway|Hwy)\.?$/i;
  FXS.width = (t, css) => { const m = document.createElement('span'); m.style.cssText = `position:absolute;left:-9999pt;visibility:hidden;white-space:nowrap;${css}`; m.textContent = t; document.body.appendChild(m); const w = m.getBoundingClientRect().width*.75; m.remove(); return w; };
  FXS.fitSize = (t, css, w, max, min) => { let s = max; while(s > min && FXS.width(t, `${css};font-size:${s}pt`) > w) s -= .5; return s; };
  FXS.street = (address, w, max) => {
    const parts = (String(address).match(/^\s*(\d+[A-Za-z-]*)\s+(.+)$/) || [null, '', address]);
    const NUM = parts[1], NAME = parts[2].toUpperCase();
    const css = "font-family:Montserrat;font-weight:700;letter-spacing:-.5pt";
    const cands = [NAME]; const ns = NAME.replace(FXS.SUF, ''); if(ns && ns !== NAME) cands.push(ns);
    for(const c of cands){ const s = FXS.fitSize(c, css, w, max, max*.62); if(FXS.width(c, `${css};font-size:${s}pt`) <= w) return {num: NUM, lines: [c], s}; }
    const c = cands[cands.length - 1], ws = c.split(/\s+/); let best = null;
    for(let i = 1; i < ws.length; i++){ const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '), d = Math.max(FXS.width(a, `${css};font-size:20pt`), FXS.width(b, `${css};font-size:20pt`)); if(!best || d < best.d) best = {d, l: [a, b]}; }
    const l = best ? best.l : [c];
    return {num: NUM, lines: l, s: Math.min(max, Math.min(...l.map(t => FXS.fitSize(t, css, w, max, 14))))};
  };
  // the street block as html at (x, y) in width w: number (light) over the name (heavy caps); returns {html, h}
  FXS.streetBlock = (address, x, y, w, max, slot) => {
    const st = FXS.street(address, w, max), ns = Math.min(st.s*.8, 48);
    let yy = y, h = '';
    if(st.num){ h += `<div class="abs ttl" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${ns*1.1}pt;font-size:${ns}pt;line-height:${ns*1.1}pt;color:var(--fx-ink)" data-slot="${slot}.number" data-lines="1">${esc(st.num)}</div>`; yy += ns*1.1; }
    st.lines.forEach(t => { h += `<div class="abs ttl" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${st.s*1.08}pt;font-size:${st.s}pt;line-height:${st.s*1.08}pt;font-weight:700;letter-spacing:-.5pt" data-slot="${slot}" data-lines="1">${esc(t)}</div>`; yy += st.s*1.08; });
    return {html: h, h: yy - y, st};
  };
  // light words then a bold last word: "Two levels, one private deck." -> light + bold
  FXS.lightBold = t => { const w = String(t).trim().split(/\s+/); if(w.length < 2) return `<b>${esc(t)}</b>`; return esc(w.slice(0, -1).join(' ')) + ' <b>' + esc(w[w.length - 1]) + '</b>'; };
  // a facts grid (icon, label, value), two columns, at (x, y) in width w; returns {html, h}
  FXS.factGrid = (facts, x, y, w, rowH, icon, slot) => {
    let h = '';
    facts.forEach(([ic, lab, v], i) => {
      const cx = x + (i % 2)*(w/2), cy = y + Math.floor(i/2)*rowH;
      h += `<div class="abs" style="left:${cx}pt;top:${cy + 2}pt">${FXS.icon(ic, icon)}</div>`;
      h += `<div class="abs fact" style="left:${cx + icon + 9}pt;top:${cy}pt;width:${w/2 - icon - 12}pt;height:${rowH}pt"><div class="fl" data-slot="${slot}.${ic}.label" data-lines="1">${lab}</div><div class="fv" data-slot="${slot}.${ic}" data-lines="1" style="overflow:hidden">${esc(v)}</div></div>`;
    });
    return {html: h, h: Math.ceil(facts.length/2)*rowH};
  };
  // the arch photo: a room photo with the round left end
  FXS.archPhoto = (D, id, x, y, w, h, slot) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${SW.photo(D, id, `position:absolute;inset:0;${FXS.arch(w, h)}`, slot)}</div>`;
  // a logo, sized to a box, left aligned (the one brokerage logo of a side)
  FXS.logo = (D, x, y, w, h, just) => { const b = D.brand || {}; const src = b.logoOnDark || b.logo; return `<div class="abs logo" data-area="${w*h}" data-maxh="${h}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;justify-content:${just || 'flex-start'}">${src ? `<img src="${esc(src)}" alt="">` : `<span class="word" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span>`}</div>`; };


  // ---------- FX11 marks: address block, three-item stat row, outlined pill tags ----------
  FXS.CAPSPEC = "font-family:Montserrat;text-transform:uppercase";
  // the address as the FX11 front sets it: kicker (neighborhood . city), the big heavy number, the street in 700 caps, the city line.
  // (x, y, w) in pt; opts.num = max number size (default 88), opts.st = max street size (default 27); returns {html, h, st}
  FXS.addrBlock = (L, x, y, w, opts) => {
    opts = opts || {};
    const m = String(L.address).match(/^\s*(\d+[A-Za-z-]*)\s+(.+)$/) || [null, '', L.address];
    const NUM = m[1], NAME = m[2].toUpperCase();
    const tx = /^texas$/i.test(L.state) ? 'TX' : L.state;
    const kick = [L.neighborhood, L.city].filter(Boolean).join(' · ').toUpperCase(), cityLine = `${L.city}, ${tx} ${L.zip || ''}`.trim().toUpperCase();
    let h = '', yy = y;
    if(!opts.noKicker && kick){ h += `<div class="abs" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${(opts.kick || 9.75)*1.25}pt;font:600 ${opts.kick || 9.75}pt/${(opts.kick || 9.75)*1.25}pt var(--fx-font);letter-spacing:${opts.kick ? 2 : 3}pt;color:var(--fx-text);white-space:nowrap;overflow:hidden" data-slot="${opts.slot || 'address'}.kicker" data-lines="1">${esc(kick)}</div>`; yy += (opts.kick || 9.75)*1.25 + 5; }
    if(NUM){
      const nCss = 'font-family:Montserrat;font-weight:800;letter-spacing:1.5pt';
      const ns = FXS.fitSize(NUM, nCss, w, opts.num || 88, 40);
      h += `<div class="abs" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${ns*.92}pt;font:800 ${ns}pt/${ns*.92}pt var(--fx-font);letter-spacing:1.5pt;color:var(--fx-ink);white-space:nowrap;overflow:hidden" data-slot="${opts.slot || 'address'}.number" data-lines="1">${esc(NUM)}</div>`; yy += ns*.92 + 2;
    }
    const sCss = 'font-family:Montserrat;font-weight:700;letter-spacing:.75pt';
    const cands = [NAME]; const ns2 = NAME.replace(FXS.SUF, ''); if(ns2 && ns2 !== NAME) cands.push(ns2);
    let st = null; const sMax = opts.st || 27;
    for(const c of cands){ const s = FXS.fitSize(c, sCss, w, sMax, sMax*.72); if(FXS.width(c, `${sCss};font-size:${s}pt`) <= w){ st = {lines: [c], s}; break; } }
    if(!st){ const c = cands[cands.length - 1], ws = c.split(/\s+/); let best = null;
      for(let i = 1; i < ws.length; i++){ const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '), d = Math.max(FXS.width(a, `${sCss};font-size:20pt`), FXS.width(b, `${sCss};font-size:20pt`)); if(!best || d < best.d) best = {d, l: [a, b]}; }
      const l = best ? best.l : [c]; st = {lines: l, s: Math.min(sMax, ...l.map(t => FXS.fitSize(t, sCss, w, sMax, 14)))}; }
    st.lines.forEach(t => { h += `<div class="abs" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${st.s*1.15}pt;font:700 ${st.s}pt/${st.s*1.15}pt var(--fx-font);letter-spacing:.75pt;color:var(--fx-ink);white-space:nowrap;overflow:hidden" data-slot="${opts.slot || 'address'}" data-lines="1">${esc(t)}</div>`; yy += st.s*1.15; });
    if(!opts.noCity){ yy += 3; h += `<div class="abs" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:17pt;font:500 ${opts.citySize || 14}pt/17pt var(--fx-font);letter-spacing:2.25pt;color:var(--fx-text);white-space:nowrap;overflow:hidden" data-slot="${opts.slot || 'address'}.city" data-lines="1">${esc(cityLine)}</div>`; yy += 17; }
    return {html: h, h: yy - y, st};
  };
  // the stat row: three items, an outline icon over a caps caption, centered (beds, baths, sq ft)
  FXS.statItems = (L, short, bathFull, five) => {
    const n = v => Number(v).toLocaleString('en-US'), s = [];
    if(L.beds) s.push([n(L.beds), short ? (L.beds == 1 ? 'Bed' : 'Beds') : (L.beds == 1 ? 'Bedroom' : 'Bedrooms')]);
    if(L.baths){ const b = window.BD && BD.bathNum ? BD.bathNum(L) : {num: String(L.baths), label: 'Full Baths'}; s.push([String(b.num).replace(/<[^>]*>/g, ''), short && !bathFull ? b.label.replace(/^Full /, '') : b.label]); }
    if(L.sqft) s.push([n(L.sqft), 'Sq Ft']);
    if(five){ if(L.yearBuilt || L.year) s.push([String(L.yearBuilt || L.year), 'Built']); const lot = /([\d,]{4,})/.exec(String(L.lotSize || '')); if(lot) s.push([lot[1], 'Lot SF']); else if(L.stories) s.push([String(L.stories), +L.stories === 1 ? 'Story' : 'Stories']); return s.slice(0, 5); }
    return s.slice(0, 3);
  };
  // the stat row (FX11 stat style): the numeral on its own line, bold white, the caps label under it; no icons. o.num = numeral pt (16), o.size = label pt (8.5)
  FXS.statRow = (L, x, y, w, o) => {
    o = o || {}; let it = FXS.statItems(L, o.short, o.bathFull, o.five), cw = w/Math.max(3, it.length); let ns = o.num || 16; const ns0 = ns; let ls = o.size || 8.5, h = '', tr = o.track != null ? o.track : 1.2;
    let pos = it.map((_, i) => [x + i*cw, cw]), two = false, splitAt = -1;
    if(o.spread && it.length > 1){   // columns sized to their own labels, with equal gaps; when they would touch, the longest two-word label (FULL BATHS) sets on two lines, never smaller type
      const mk = sp => { const lc = `font-family:Montserrat;font-weight:600;text-transform:uppercase;font-size:${ls}pt;letter-spacing:${tr + .3}pt`, ws = it.map(([v, lab], i) => Math.ceil(Math.max(...(i === sp ? lab.split(' ') : [lab]).map(t => FXS.width(t, lc)), FXS.width(v, `font-family:Montserrat;font-weight:700;font-size:${ns}pt`))) + 12); return {ws, gap: (w - ws.reduce((a, b) => a + b, 0))/(it.length - 1)}; };
      const need = Math.max(14, ns*.6); let m_ = mk(-1);
      if(m_.gap < need){ const li = it.map(([v, lab]) => lab).reduce((bi, lab, i, arr) => lab.length > arr[bi].length ? i : bi, 0); if(/ /.test(it[li][1])){ splitAt = li; two = true; m_ = mk(li); } }
      if(o.minGap && it.length > 4 && m_.gap < o.minGap){ it = it.slice(0, 4); pos = it.map(() => [0, 0]); splitAt = -1; two = false; m_ = mk(-1); if(m_.gap < need){ const li = it.map(([v, lab]) => lab).reduce((bi, lab, i, arr) => lab.length > arr[bi].length ? i : bi, 0); if(/ /.test(it[li][1])){ splitAt = li; two = true; m_ = mk(li); } } }   // five facts when they fit, else four
      while(m_.gap < 12 && tr > .2){ tr = Math.max(.2, tr - .3); m_ = mk(splitAt); }
      while(m_.gap < 12 && ns > ns0*.88){ ns -= 1; m_ = mk(splitAt); }   // then the numerals give way a little, never touching
      const ws = m_.ws, gap = m_.gap;
      let cx = x; pos = ws.map(wd => { const r = [cx, wd]; cx += wd + gap; return r; });
    }
    it.forEach(([v, lab], i) => { h += `<div class="stat" style="left:${pos[i][0]}pt;top:${y}pt;width:${pos[i][1]}pt;text-align:${o.align || 'center'}"><div class="sn" style="font:700 ${ns}pt/${ns*1.15}pt var(--fx-font);color:#fff;white-space:nowrap" data-slot="${o.slot || 'fact'}.${i}.num" data-lines="1">${esc(v)}</div><div class="sl" style="white-space:nowrap;font-size:${ls}pt;line-height:${ls*1.35}pt;letter-spacing:${tr}pt;margin-top:1pt" data-slot="${o.slot || 'fact'}.${i}" data-lines="${i === splitAt ? 2 : 1}">${i === splitAt ? esc(lab).replace(' ', '<br>') : esc(lab)}</div></div>`; });
    return {html: h, h: ns*1.15 + 1 + ls*1.35*(two ? 2 : 1) + 2};
  };
  // outlined pill tags in a wrapping row at (x, y) in width w; returns {html, h}; rows that do not fit in maxH drop the last tags
  FXS.tags = (labels, x, y, w, maxH, o) => {
    o = o || {}; const fs = o.size || 10.5, ph = o.h || 30, padX = o.padX || 12, gx = o.gx || 7.5, gy = o.gap || 9, trk = o.track != null ? o.track : .9, css = `font-family:Montserrat;font-weight:600;letter-spacing:${trk}pt;font-size:${fs}pt;text-transform:uppercase`;
    let cx = 0, cy = 0, h = '', rows = 1, ti = -1;
    for(const t of labels){
      ti++;
      const tw = FXS.width(t, css) + 2*padX + 1.5;
      if(cx && (cx + tw > w || (labels.breaks && labels.breaks.includes(ti)))){ cx = 0; cy += ph + gy; rows++; }
      if(maxH && cy + ph > maxH) break;
      h += `<div class="pill tag" style="position:absolute;left:${x + cx}pt;top:${y + cy}pt;width:${tw}pt;height:${ph}pt;padding:0;font-size:${fs}pt;letter-spacing:${trk}pt" data-slot="${o.slot || 'tag'}.${ti}" data-field="fx11.tags.${ti}" data-lines="1"><span>${esc(t)}</span></div>`;
      cx += tw + gx;
    }
    return {html: h, h: cy + ph};
  };
  // a white pill with espresso type at (x, y)
  FXS.pillSolid = (text, x, y, w, h, slot, size) => `<div class="abs pill solid" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;border-radius:${h/2}pt;font-size:${size || 15}pt" data-slot="${slot}" data-lines="1">${esc(text)}</div>`;
  // square bullets, as the source's lists: one per line
  FXS.sqList = items => items.map(t => `<div class="sq"><i>▪</i><div>${esc(t)}</div></div>`).join('');

  // ---------- the FX11 front (flyer front and fold-over cover share it) ----------
  // Dark panel on the left (kicker, big number, street, city, "Built in" pill, three stats, hairline, write-up, pill tags), a column of three
  // photos down the right edge (the whole house first), a hairline, then the agent and the one logo. Panel 612 x 792 pt, photos run to the edges (bleed).
  FXS.roomScore = (D, id) => { const p = (D.photos||{})[id] || {}; if(p.fullHouse) return -9; if(/^powder|^halfbath/.test(id)) return -5; /* powder rooms and half baths rank last */ const k = /^(family|living|great|open)/.test(id) ? 3 : /^(dining|primary)(?!.*bath)/.test(id) ? 2 : /kitchen|bar|bath/.test(id) ? 0 : 1; return k*10 + (p.w && p.h ? Math.min(p.w/p.h, 1.6) : 1); };
  // the room group of a photo id (mirrors scripts/fxsets/carousel_copy.py room_group, plus the entry/stair family): two photos of one group are never neighbors or shown on both flyer sides
  FXS.group = id => { const b = String(id).toLowerCase().replace(/\d+[a-z]?$/, ''); const G = [['outdoor', ['deck', 'patio', 'evening', 'yard', 'porch', 'balcony', 'pergola', 'fence', 'terrace', 'gazebo']], ['bath', ['pbath', 'shower', 'bath', 'hallbath', 'powder']], ['living', ['family', 'living', 'great', 'open', 'dining', 'wine', 'ceiling']], ['kitchen', ['kitchen', 'bar', 'nook']], ['entry', ['stair', 'foyer', 'entry', 'hall', 'walk']]]; for(const [g, ks] of G) if(ks.some(k => b.startsWith(k))) return g; return b; };
  // the photos of the front (flyer front and fold-over cover, 11/7 spec): the whole house, then the strongest rooms from four different spaces: the family room,
  // the kitchen, the primary suite, the outdoor space. Photos in o.avoid (the ones the fold-over's inside pages use) are taken last, so a space is not shown again as the same photo.
  FXS.frontIds = (D, o) => {
    const F = (o && o.F) || {}, heroId = F.hero || 'front', avoid = new Set((o && o.avoid) || []), P = D.photos || {};
    const avoidFam = new Set([...avoid].map(i => SW.famOf(i)));   // a photo the inside pages placed, or another view of its room, is not used again (the page check flags both)
    const ok = id => P[id] && !P[id].fullHouse && id !== heroId && !avoidFam.has(SW.famOf(id));
    const lists = [
      ['family', 'living', 'openplan', 'family2', 'living2', 'living3', 'living4'],
      ['kitchen', 'kitchen2', 'kitchen3', 'bar'],
      ['primary', 'primary2'],
      ['deck', 'pergola', 'evening', 'terrace', 'yard', 'patio', 'yard2', 'balcony', 'terrace2'] ];
    const out = [], spare = ['family', 'living', 'openplan', 'kitchen', 'nook', 'dining', 'dining2', 'family2', 'kitchen2', 'wine', 'bar', 'game', 'primary2', 'living2', 'skyline', 'park'].filter(ok);
    lists.forEach(l => { const id = l.filter(ok).find(i => !out.includes(i)); if(id) out.push(id); });
    // a space the inside pages already use (every list above came up empty): the strongest unused view of another room, never two of one group while a different one is left
    while(out.length < 4){ const id = spare.find(i => !out.includes(i) && !out.some(p => FXS.group(p) === FXS.group(i))); if(!id) break; out.push(id); }   // fewer than four rooms left: the grid takes the rooms it has (no weak rooms, no repeats)
    // still short of four (the inside pages took the rest): the strongest other views of a room, a different photo file from every one the inside pages placed, never two of one group
    if(out.length < 4){ const ok2 = id => P[id] && !P[id].fullHouse && id !== heroId && !avoid.has(id) && !out.includes(id); const pool = [].concat(...lists, spare, ['dining', 'dining2', 'nook', 'game', 'primary', 'wine', 'bar']).filter(ok2); while(out.length < 4){ const id = pool.find(i => ok2(i) && !out.some(p => FXS.group(p) === FXS.group(i))) || pool.find(i => ok2(i)); if(!id) break; out.push(id); } }
    return [heroId, ...out];
  };
  // the front's pills packed into `rows` full rows (owner 11/7): the writer's front tags first, then its other tags, all from the
  // listing's own facts. A tag that shares a main word with one already in ("GATED ENTRY" / "GATE AT THE DOOR", "QUARTZ ISLAND" /
  // "CENTER ISLAND") is left out. Of every way to fill the rows from the first seven tags, it takes the one that keeps the most front
  // tags, then the fullest shortest row, then the most width used; FXS.tags then wraps the list into exactly these rows.
  FXS.frontPills = (D, w, o, rows) => {
    const X11 = (D || {}).fx11 || {}, seen = [], pool = [];
    const stems = t => String(t).toUpperCase().split(/[^A-Z0-9]+/).filter(s => s.length >= 4).map(s => s.slice(0, 4));
    [].concat(X11.frontTags || [], X11.tags || [], FXS.tagLabels(D)).forEach(t => { t = String(t || '').trim(); if(!t) return; const st = stems(t); if(pool.some(p => p.toUpperCase() === t.toUpperCase()) || st.some(s => seen.includes(s))) return; pool.push(t); seen.push(...st); });
    const css = `font-family:Montserrat;font-weight:600;letter-spacing:${o.track}pt;font-size:${o.size}pt;text-transform:uppercase`, tw = t => FXS.width(t, css) + 2*o.padX + 1.5;
    const P = pool.slice(0, 7), W = P.map(tw), nFront = (X11.frontTags || []).length;
    const rowW = ix => ix.reduce((a, i) => a + W[i], 0) + (ix.length - 1)*o.gx;
    const combos = []; (function sub(s, ix){ if(ix.length && rowW(ix) <= w) combos.push(ix); if(ix.length >= 3) return; for(let i = s; i < P.length; i++) sub(i + 1, ix.concat(i)); })(0, []);
    let best = null;
    (function pick(used, chosen){
      if(chosen.length === rows || !combos.some(c => c.every(i => !used.has(i)))){
        const fills = chosen.map(c => rowW(c)/w), sc = 1000*chosen.flat().filter(i => i < nFront).length + 100*chosen.length + 10*Math.min(...fills) + fills.reduce((a, b) => a + b, 0);
        if(!best || sc > best.sc) best = {sc, chosen}; return; }
      for(const c of combos) if(c.every(i => !used.has(i)) && (!chosen.length || c[0] > chosen[chosen.length - 1][0])) pick(new Set([...used, ...c]), chosen.concat([c]));
    })(new Set(), []);
    const out = best ? best.chosen.flat().map(i => P[i]) : [];
    out.breaks = best ? best.chosen.map(c => c.length).reduce((a, n) => a.concat((a[a.length - 1] || 0) + n), []).slice(0, -1) : [];   // where each new row starts
    return out;
  };
  FXS.tagLabels = D => { if(((D||{}).fx11||{}).tags && D.fx11.tags.length) return D.fx11.tags.slice(0, 8); const it = (((D.sw||{}).left||{}).box||{}).items || []; return it.map(i => String(i.l)).filter(Boolean).slice(0, 8); };
  // lines a text sets in at font css and width w (pt); hyphenated words stay whole, as on the page
  FXS.measureText = (text, css, w) => { const m = document.createElement('div'); m.className = 'body'; m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;white-space:normal;${css}`; m.innerHTML = esc(text).replace(/\S*\w-\w\S*/g, t => `<span style="white-space:nowrap">${t}</span>`); document.body.appendChild(m);
    const r = document.createRange(); r.selectNodeContents(m); const rows = []; [...r.getClientRects()].filter(q => q.width > .5).forEach(q => { const l = rows.find(x => Math.abs(x.top - q.top) < 4); if(l){ l.l = Math.min(l.l, q.left); l.r = Math.max(l.r, q.right); } else rows.push({top: q.top, l: q.left, r: q.right}); }); m.remove(); rows.sort((a, b) => a.top - b.top);
    const last = rows[rows.length - 1]; return {n: rows.length, fill: last ? (last.r - last.l)/(w*96/72) : 0}; };
  FXS.front = (D, o) => {
    // 11/7 spec: espresso panel on the left (~40%), the photo column on the right bleeding off the top, right and bottom: the whole house across the top,
    // then a 2 x 2 of the strongest rooms. No agent and no brokerage on the front (they live on the back).
    const L = D.listing, X11 = D.fx11 || {};
    let h = '';
    const ids = FXS.frontIds(D, o), heroId = ids[0], LW = 240, CX = LW, CW = 621 - CX, G = 4, X = 25, W = LW - X - 12, BOT = 801;
    let hh = 360; const hy = -9; while(hh > 250 && !SW.fits(D, heroId, CW, hh)) hh -= 4;   // the tallest frame (45% of the page at most) that holds the whole house
    h += SW.heroHtml(D, heroId, CX, hy, CW, hh, 'front.house', []);
    const gy = hy + hh + G, rooms = ids.slice(1, 5), n = rooms.length;
    // 4 rooms: 2 x 2; 3 rooms: two over one wide; 2 rooms: two stacked; the grid always runs to the bottom edge
    const rows = n >= 4 ? 2 : n === 3 ? 2 : n;
    const rhh = (BOT - gy - (rows - 1)*G)/rows, cw2 = (CW - G)/2;
    rooms.forEach((id, i) => { const r = n >= 3 ? Math.floor(i/2) : i, wide = n === 3 ? (i === 2) : n < 3, c = n >= 3 ? i % 2 : 0; h += `<div class="abs" style="left:${CX + (wide ? 0 : c*(cw2 + G))}pt;top:${gy + r*(rhh + G)}pt;width:${wide ? CW : cw2}pt;height:${rhh}pt">${SW.photo(D, id, 'position:absolute;inset:0', 'front.room' + i)}</div>`; });
    const ab = FXS.addrBlock(L, X, 25, W, {num: 84, st: 25, kick: 8.5, citySize: 12}); h += ab.html;
    let y = 25 + ab.h + 14;
    const sr = FXS.statRow(L, X, y, W, {num: 18, size: 8, track: .4, spread: 1, five: 1, minGap: 10, bathFull: 1, short: 1}); h += sr.html; y += sr.h + 10;
    h += `<div class="hr" style="left:${X}pt;top:${y}pt;width:${W}pt"></div>`; y += 14;
    // owner 11/7 (FXS-11 round 3, p1 and p6): three full rows of pills fill the bottom of the panel, all real listing facts
    const tgo = {slot: 'front.tag', size: 8.5, h: 23, gap: 6, padX: 9, gx: 6, track: .4}, tagMax = 3*tgo.h + 2*tgo.gap;
    const pills = FXS.frontPills(D, W, tgo, 3);
    const tg = FXS.tags(pills, X, 0, W, tagMax, tgo), tagTop = 792 - 25 - tg.h;
    h += FXS.tags(pills, X, tagTop, W, tagMax, tgo).html;
    const avail = tagTop - 16 - y, sents = (X11.frontWrite && X11.frontWrite.length ? X11.frontWrite : [].concat(o.intro || [])).map(t => [].concat(t)[0]);
    // the biggest type (13 pt down to 10.5) whose paragraph fills the room above the pills: last line at least 3/4 full, never past the pills
    let pick = null; const joined = sents.join(' ');
    const tryFs = (lo) => { for(let fs = 15; fs >= 10.5; fs = Math.round((fs - .1)*10)/10){ const lh = Math.round(fs*1.42*4)/4, m = FXS.measureText(joined, `font-size:${fs}pt;line-height:${lh}pt`, W); if(m.n*lh <= avail && m.n*lh >= avail - lo*lh && m.fill >= .78) return {fs, lh, n: m.n}; } return null; };
    pick = tryFs(2) || tryFs(4) || tryFs(9);
    if(!pick){ for(let fs = 15; fs >= 10; fs -= .25){ const lh = Math.round(fs*1.42*4)/4, m = FXS.measureText(joined, `font-size:${fs}pt;line-height:${lh}pt`, W); if(m.n*lh <= avail){ pick = {fs, lh, n: m.n}; break; } } }
    pick = pick || {fs: 10, lh: 14, n: Math.floor(avail/14)};
    const tries = [pick.n, pick.n - 1, pick.n + 1].filter(t => t > 3);
    h += `<div class="abs body" data-slot="front.summary" data-fixed="1" data-min="${sents.length}" data-narrow="8" data-nstep="4" data-just="1" data-lines="${pick.n}" data-try="${tries.join(',')}" data-lh="${pick.lh}" data-s='${esc(JSON.stringify((X11.frontWrite && X11.frontWrite.length ? X11.frontWrite : [].concat(o.intro || [])).map(t => [].concat(t)))).replace(/'/g,'&#39;')}' style="left:${X}pt;top:${y}pt;width:${W}pt;height:${pick.n*pick.lh}pt;font-size:${pick.fs}pt;line-height:${pick.lh}pt"></div>`;
    return h;
  };

  // the two outlined boxes side by side (FX11 back): "WHAT IS NEW" (the roof, window and deck facts as square bullets) and "NEARBY" (three real places, real distances)
  FXS.twoBoxes = (D, x, y, w, h, slot, o) => {
    o = o || {}; const X11 = D.fx11 || {}, NR = o.rows || 6, news = (X11.new || []).slice(0, NR), near = ((X11.nearby || []).length ? X11.nearby : ((D.sw || {}).back || {}).nearby || []).slice(0, NR);
    const gap = 10, bw = (w - gap)/2, fs = o.size || 9.5, rowH = o.rowH || Math.max(13.5, Math.min(18, (h - 46)/NR));
    const rows = (n, f) => `<div style="margin-top:9pt;height:${NR*rowH}pt;display:flex;flex-direction:column;justify-content:flex-start">${Array.from({length: NR}, (_, i) => f(n[i], i)).join('')}</div>`;
    const box = (bx, title, body, sl) => `<div class="abs inkbox" style="left:${bx}pt;top:${y}pt;width:${bw}pt;height:${h}pt;padding:11pt 9pt;overflow:hidden"><div class="lbl" style="color:var(--fx-ink)" data-slot="${sl}.title" data-lines="1">${esc(title)}</div>${body}</div>`;
    const newRow = (t, i) => t ? `<div class="sq" style="height:${rowH}pt;font-size:${nfs}pt;line-height:${rowH}pt;white-space:nowrap;overflow:hidden" data-slot="${slot}.new.${i}" data-lines="1" data-fixed="1"><i>▪</i><div>${esc(t)}</div></div>` : `<div style="height:${rowH}pt"></div>`;
    // the Nearby names are never clipped or shortened: the type steps down (to 8 pt) until the longest name fits beside its distance
    const nW = (t, ff) => FXS.width(t, `font-family:Montserrat;font-weight:400;font-size:${ff}pt`)*1.08;   // printed glyphs run about 6% wider than the layout advances: every name gets that allowance as its cell
    const nfs = (() => { let f = fs; const room = ff => near.map(n => bw - 18 - 7 - 6 - 8 - FXS.width(String(n.dist).replace(' miles', ' mi'), `font-family:Montserrat;font-weight:500;font-size:${ff}pt`) - nW(n.place, ff)); while(f > 8 && Math.min(...room(f)) < 0) f -= .25; return f; })();
    const nearRow = (n, i) => n ? `<div class="sq" style="height:${rowH}pt;font-size:${nfs}pt;line-height:${rowH}pt;white-space:nowrap;justify-content:space-between" data-slot="${slot}.near.${i}" data-lines="1" data-fixed="1"><span style="display:flex;gap:6pt;flex:none"><i>▪</i><span style="flex:none">${esc(n.place)}</span></span><span style="color:var(--fx-ink);flex:none;margin-left:6pt">${esc(String(n.dist).replace(' miles', ' mi'))}</span></div>` : `<div style="height:${rowH}pt"></div>`;
    return box(x, String(X11.newTitle || 'What is new').toUpperCase(), rows(news, newRow), slot + '.new') + box(x + bw + gap, 'NEARBY', rows(near, nearRow), slot + '.near');
  };

  window.SW = SW; window.FXS = SW;
})();
