/* templates/poster/po-social.js: Poster's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on piece matches
   its set's main pieces). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and replaces its three layouts for this
   set only; nothing shared changes.

   Read off the approved Poster pieces (postcard.html, flyer.html, foldover.html, po-tokens.css, po-marks.css):
     - the brand kit's dark as the field, edge to edge; Archivo 700 caps set tight and very large
     - the status stacked: JUST in the paper color over LISTED / SOLD in the accent (the postcard fronts)
     - the house number as a giant numeral in the paper color with the street in accent caps beside or under it (the cover, the flyer)
     - the whole house inside the thin offset accent keyline (po-ofr); room photos square-cornered on the field
     - the heavy rule in the paper color under the headline; faint hairlines between list rows and over the agent
     - small tracked accent caps for the place; numerals in the paper color with tracked accent labels for the facts (the cover's row)
     - the pull quote with the accent bar beside it (the flyer front)
     - Just Sold: "Thinking about selling?" in the accent, the seller note in the paper box with ink, the agent's name set large
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house in every frame (the engine's
   house-cut check), text at the phone floors of templates/_shared/readsize.js. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const AR = "'Archivo'", HEAD = 'var(--po-head)', ACC = 'var(--po-accent)', SOFT = 'var(--po-soft)', RULE = 'var(--po-rule)';
  const Q = 'Thinking about selling?', PITCH = .88;
  const F = {
    hl: s => `font:700 ${s}pt ${AR};text-transform:uppercase;letter-spacing:${(-s*.016).toFixed(2)}pt`,
    eye: s => `font:700 ${s}pt ${AR};text-transform:uppercase;letter-spacing:${(s*.26).toFixed(2)}pt`,
    eye2: s => `font:700 ${s}pt ${AR};text-transform:uppercase;letter-spacing:${(s*.12).toFixed(2)}pt`,
    lab: s => `font:700 ${s}pt ${AR};text-transform:uppercase;letter-spacing:${(s*.18).toFixed(2)}pt`,
    num: s => `font:700 ${s}pt ${AR}`,
    pq: s => `font:600 ${s}pt ${AR}`,
    note: s => `font:400 ${s}pt ${AR}`,
    name: s => `font:700 ${s}pt ${AR};letter-spacing:${(-s*.015).toFixed(2)}pt`,
    phone: s => `font:700 ${s}pt ${AR}`,
    cta: s => `font:700 ${s}pt ${AR}`,
  };
  const CSS = `<style>
    .ss .pos-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:flex-start}
    .ss .pos-logo.r .logo{justify-content:flex-end}
    .ss .pos-logo.c .logo{justify-content:center}
    .ss .pos-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .pos-logo .text{font:700 12pt/1.15 ${AR};color:inherit}
    .ss .pos-c{position:absolute;white-space:nowrap}
    .ss .pos-hs{position:absolute;overflow:hidden}.ss .pos-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2};
    const M = document.createElement('div'); document.body.appendChild(M);
    const tmemo = new Map();
    T.tw = (t, css) => { const key = t + '|' + css; if(tmemo.has(key)) return tmemo.get(key); M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:nowrap;${css}`; M.textContent = t; const v = M.getBoundingClientRect().width*.75; tmemo.set(key, v); return v; };
    // every face here scales evenly with its size (tracking included): one measure at 100 pt gives the width at any size
    T.w100 = (t, face) => T.tw(t, face(100));
    T.wd = (t, face, s) => T.w100(t, face)*s/100;
    T.fit = (t, face, w, max, min) => { const s = Math.min(Math.max(max, min), Math.floor(w/Math.max(1, T.w100(t, face))*200)/2); return s >= min - .01 ? s : null; };
    const memo = new Map();
    T.rows = (t, css, w, lh) => { const key = t + '|' + css + '|' + w.toFixed(1) + '|' + lh.toFixed(2); if(memo.has(key)) return memo.get(key);
      M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:normal;width:${w}pt;${css};line-height:${lh}pt;text-align:left`; M.textContent = t;
      const rg = document.createRange(); rg.selectNodeContents(M); const out = [];
      [...rg.getClientRects()].forEach(b => { if(b.width < .5) return; const r = out.find(x => Math.abs(x.top - b.top) < b.height*.5); if(r){ r.l = Math.min(r.l, b.left); r.r = Math.max(r.r, b.right); } else out.push({top: b.top, l: b.left, r: b.right}); });
      out.sort((a, b) => a.top - b.top); const ws = out.map(r => (r.r - r.l)*.75);
      const res = {n: out.length, ws, wide: Math.max(1, ...ws), last: ws[ws.length - 1] || 0}; memo.set(key, res); return res;
    };
    T.done = () => M.remove();
    return T;
  };
  // the capitals, measured on the page: the cap height and where the baseline falls in a line box as tall as the type (both in em)
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = `700 200px ${AR}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:700 200px ${AR};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}; return MET; };
  const capH = s => met().cap*s;
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  // one line of capitals set by its ink: the top of the letters at y (any of the 700 caps faces)
  const caps = (slot, t, x, y, w, s, face, color, o) => { o = o || {}; const m = met();
    return `<div class="pos-c" data-slot="${slot}" data-lines="1"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y - (m.base - m.cap)*s}pt;width:${w}pt;height:${s}pt;${face(s)};line-height:${s}pt;color:${color};text-align:${o.align || 'left'}">${o.span ? `<span>${esc(t)}</span>` : esc(t)}</div>`; };
  const heavy = (T, x, y, w) => rect(x, y, w, T.RH, `background:${HEAD}`);
  const hair = (T, x, y, w) => rect(x, y, w, T.HH, `background:${RULE}`);

  // ---------- photos: the house in the offset accent keyline; rooms square on the field ----------
  const heroKit = (D, T) => {
    const f = T.f, id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const O = r2(Math.min(6*f, 9)), LW = Math.max(1.05, r2(1.1*f*2)/2);
    const frame = (x, y, w, h) => `<div class="abs" style="left:${x + LW}pt;top:${y + LW}pt;width:${w - 2*LW}pt;height:${h - 2*LW}pt;box-shadow:0 0 0 ${LW}pt ${ACC};opacity:.92;pointer-events:none"></div>`;
    const plain = (pid, x, y, w, ht) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${ht}pt`);
    const framed = (pid, x, y, w, ht) => frame(x, y, w, ht) + plain(pid, x + O, y + O, w - 2*O, ht - 2*O);
    const KIND = [/foyer|entry|hall|stair|walk|landing/, /living|family|great|den|openplan|game|flex/, /dining|nook|breakfast/, /kitchen|bar|pantry|wine/, /primary|bed/, /bath|shower|powder|closet/, /deck|patio|yard|pool|balcon|porch|evening|rear|back/];
    const kind = p => { const t = (p + ' ' + ((D.photos[p] || {}).tags || '')).toLowerCase(), i = KIND.findIndex(r => r.test(t)); return i < 0 ? 'x' + p : i; };
    // room photos to stand together: one of each kind of room first (never two near-identical rooms side by side), in the writer's order
    const sup = n => { const all = window.OHEmail ? OHEmail.support(D, id, 14) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)), seen = new Set(), out = [];
      all.forEach(p => { const q = kind(p); if(!seen.has(q)){ seen.add(q); out.push(p); } }); all.forEach(p => { if(!out.includes(p)) out.push(p); }); return out.slice(0, n); };
    const imin = w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)), imax = w => Math.ceil(hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : w/pAR);
    return {id, pAR, O, plain, framed, sup,
      // all sizes are the frame's outer size (keyline included)
      min: w => imin(w - 2*O) + 2*O, max: w => imax(w - 2*O) + 2*O, nat: w => Math.ceil((w - 2*O)/pAR) + 2*O,
      hero: (x, y, w, ht) => { const iw = w - 2*O, ih = ht - 2*O; if(hb && ih > iw/pAR){ const vis = iw/(ih*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return framed(id, x, y, w, ht); },
      // n room photos side by side, from the skip-th on
      row: (x, y, w, ht, n, g, skip) => { const ids = sup(n + (skip || 0)).slice(skip || 0); if(!ids.length || ht < 30) return ''; const pw = (w - (ids.length - 1)*g)/ids.length; return ids.map((p, i) => plain(p, x + i*(pw + g), y, pw, ht)).join(''); }};
  };

  // ---------- the headline words ----------
  // the status stacked: JUST in the paper color over LISTED / SOLD in the accent, as wide as w allows (up to max)
  const word = (T, w, max) => { const ls = SocialSet.M.split(' '), s = Math.max(T.FE, Math.min(max || 999, ...ls.map(t => Math.floor(w/T.w100(t, F.hl)*200)/2)));
    const wide = Math.max(...ls.map(t => T.wd(t, F.hl, s))), h = (ls.length - 1)*s*PITCH + capH(s);
    return {s, h, wide, html: (x, y) => ls.map((t, i) => caps(i ? 'moment.l' + i : 'moment', t, x, y + i*s*PITCH, wide + 4, s, F.hl, i === ls.length - 1 && i ? ACC : HEAD)).join('')}; };
  const parts = a => { const m = /^(\d[\w\-\/]*)\s+(.+)$/.exec(String(a || '').trim()); return m ? {num: m[1], st: m[2]} : {num: '', st: String(a || '').trim()}; };
  // one line (the flyer front): the house number large in the paper color, the street in accent caps on its baseline
  const addrRow = (T, Li, w, max, R) => { const P = parts(Li.address); R = R || .62;
    if(!P.num){ const s = T.fit(P.st, F.hl, w, (max || 999)*R, T.FE); return s ? {h: capH(s), wide: T.wd(P.st, F.hl, s), html: (x, y) => caps('address', P.st, x, y, w, s, F.hl, ACC, {span: 1})} : null; }
    const unit = (T.w100(P.num, F.hl) + 22 + T.w100(P.st, F.hl)*R)/100, sN = Math.min(max || 999, Math.floor(w/unit*2)/2), sS = Math.floor(sN*R*2)/2;
    if(sS < T.FE) return null;
    const nW = T.wd(P.num, F.hl, sN), sW = T.wd(P.st, F.hl, sS);
    return {h: capH(sN), sN, wide: nW + sN*.22 + sW, html: (x, y) => caps('addr.num', P.num, x, y, nW + 2, sN, F.hl, HEAD) + caps('address', P.st, x + nW + sN*.22, y + capH(sN) - capH(sS), sW + 3, sS, F.hl, ACC, {span: 1})}; };
  // stacked (the cover): the number over the street, each as wide as the column allows; hMax: the height the stack may take
  const addrStack = (T, Li, w, hMax, o) => { o = o || {}; const P = parts(Li.address), wsS = P.st.split(/\s+/), cap = met().cap, nW = P.num ? T.w100(P.num, F.hl) : 0;
    const cands = [[P.st]];   // the street always on one line (never split)
    // the number stands well over the street (the cover: nearly twice its size); the street steps down until it does
    let best = null;
    // o.numFirst (beside the status word): the number as large as its room allows, then the street as large as leaves it there
    if(o.numFirst && P.num) for(const lines of cands){ const sw = Math.max(...lines.map(t => T.w100(t, F.hl))), top = Math.min(o.maxN || 999, Math.floor(w/nW*200)/2);
      const nAt = sS => hMax == null ? top : Math.min(top, Math.floor((hMax - ((lines.length - 1)*sS*.96 + cap*sS) - Math.max(4*T.f, sS*.34))/cap*2)/2), n0 = nAt(T.FE);
      for(let sS = Math.min(o.maxS || 999, Math.floor(w/sw*200)/2); sS >= T.FE - .01; sS -= .5){ const sN = nAt(sS); if(sN < n0*.9 || sN < sS*1.2) continue;
        const sc = sN*2 + sS*(lines.length > 1 ? .8 : 1); if(!best || sc > best.sc) best = {sc, lines, sS, sN, stH: (lines.length - 1)*sS*.96 + cap*sS, g1: Math.max(4*T.f, sS*.34)}; break; } }
    if(!best) for(const ratio of (P.num ? [1.8, 1.45, 1.15] : [0])){
      for(const lines of cands){ const sw = Math.max(...lines.map(t => T.w100(t, F.hl)));
        for(let sS = Math.min(o.maxS || 999, Math.floor(w/sw*200)/2); sS >= T.FE - .01; sS -= .5){ const stH = (lines.length - 1)*sS*.96 + cap*sS, g1 = P.num ? Math.max(4*T.f, sS*.34) : 0;
          let sN = 0; if(P.num){ sN = Math.min(o.maxN || 999, Math.floor(w/nW*200)/2); if(hMax != null) sN = Math.min(sN, Math.floor((hMax - stH - g1)/cap*2)/2); if(sN < sS*ratio) continue; }
          else if(hMax != null && stH > hMax) continue;
          const sc = sN + sS*(lines.length > 1 ? 1.5 : 1) + (lines.length === 1 ? 1000 : 0); if(!best || sc > best.sc) best = {sc, lines, sS, sN, stH, g1}; break; } }
      if(best) break; }
    if(!best) return null;
    const {lines, sS, sN, stH, g1} = best, lp = sS*.96, h = (P.num ? cap*sN + g1 : 0) + stH;
    const wide = Math.max(P.num ? T.wd(P.num, F.hl, sN) : 0, ...lines.map(t => T.wd(t, F.hl, sS)));
    return {h, sN, sS, wide, numW: P.num ? T.wd(P.num, F.hl, sN) : 0, numH: P.num ? cap*sN : 0, html: (x, y) => { const al = o.align || 'left'; let s = P.num ? caps('addr.num', P.num, x, y, w, sN, F.hl, HEAD, {align: al}) : '', yy = y + (P.num ? cap*sN + g1 : 0);
      lines.forEach((t, i) => { s += caps(i ? 'address.l' + i : 'address', t, x, yy + i*lp, w, sS, F.hl, ACC, {align: al, span: 1}); }); return s; }}; };
  // the city line with its zip in small tracked accent caps (tighter tracking where the line is short of room); never without the zip
  const eyebrow = (T, D, w, k, o) => { o = o || {}; const t = OHL.place(D.listing); if(!t) return null;
    for(const face of (o.tight ? [F.eye, F.eye2] : [F.eye])){ const s = T.fit(t, face, w - 2, r2(Math.max(T.FS, T.FS*1.08*Math.min(k, 1.3))), T.FS); if(!s) continue;
      return {h: capH(s), s, wide: T.wd(t, face, s), html: (x, y, al) => caps('place', t, x, y, w, s, face, ACC, {small: 1, align: al})}; }
    return null; };
  // ---------- Just Listed: the facts ----------
  const statItems = D => OHL.factSix(D.listing).map(([ic, t]) => { if(ic === 'cal') return [t.replace(/^Built in\s*/i, ''), 'Built']; if(ic === 'stories') return null;
    const m = /^([\d,.½\/]+)\s+(.+)$/.exec(t); return m ? [m[1], m[2].replace(/square feet/i, 'sq ft')] : null; }).filter(Boolean).slice(0, 4);
  const shortLab = l => l.replace(/^bedrooms?$/i, m => /s$/i.test(m) ? 'beds' : 'bed').replace(/^full baths?$/i, m => /s$/i.test(m) ? 'baths' : 'bath');
  // the cover's row: numerals in the paper color with tracked accent labels, spread across the width. All four facts on one row
  // first (the numerals a step smaller where that is what it takes), then three; two rows of two where one row cannot hold them.
  const statRow = (T, SI, w, k, o) => { o = o || {}; if(SI.length < 2) return null; const sh = SI.map(([n, l]) => [n, shortLab(l)]), gmin = r2(Math.min(12*T.f, w*.02));
    const mk = ns => { const ls = Math.max(T.FB, r2(ns*.5)), gp = ns*.3, cw = ([n, l]) => T.tw(n, F.num(ns)) + gp + T.tw(l, F.lab(ls)) - ls*.18;
      return {ns, cw, cell: (i, [n, l], x, y) => `<div class="pos-c" data-slot="facts.${i}" data-lines="1" style="left:${x}pt;top:${y}pt;width:${cw([n, l]) + ls*.18 + 3}pt;height:${ns*1.12}pt;${F.num(ns)};line-height:${ns*1.12}pt;color:${HEAD}">${esc(n)}<span style="${F.lab(ls)};color:${ACC};margin-left:${gp.toFixed(2)}pt">${esc(l)}</span></div>`}; };
    const sizes = [...new Set([r2(Math.max(T.FB*1.25, T.FB*1.55*k)), r2(T.FB*1.25), r2(T.FB*1.1), T.FB])];
    for(const cnt of [4, 3]) for(const ns of sizes) for(const base of [SI, sh]){ const list = base.slice(0, cnt), n = list.length, M = mk(ns), ws = list.map(M.cw), tot = ws.reduce((a, b) => a + b, 0); if(n < 2 || tot + (n - 1)*gmin > w) continue;
      const gap = (w - tot)/(n - 1); return {h: ns*1.12, rows: 1, n, html: (x, y) => { let xx = x, s = ''; list.forEach((it, i) => { s += M.cell(i, it, xx, y); xx += ws[i] + gap; }); return s; }}; }
    if(o.grid !== false) for(const list of [SI, sh]){ const M = mk(sizes[0]); if(list.length < 4 || list.some(it => M.cw(it) > w/2 - 6*T.f)) continue; const rp = M.ns*1.12 + r2(5*T.f);
      const c2 = w - Math.max(M.cw(list[1]), M.cw(list[3]));   // the second column ends at the right edge
      return {h: rp + M.ns*1.12, rows: 2, n: 4, html: (x, y) => list.map((it, i) => M.cell(i, it, x + (i % 2 ? c2 : 0), y + (i > 1 ? rp : 0))).join('')}; }
    return null; };
  const pool = (T, D) => T.pool || (T.pool = SocialSet.sentences(D, Ivory.facts(D.listing)).slice(0, 12));
  // the flyer front's pull quote: the writer's sentences in order (the first always kept) beside the accent bar; every line 80%+ and the
  // last 90%+ of the measure (owner 11/8), the measure narrowed a little or the type raised up to 12% to get there
  const writeUp = (T, D, w0, s0, maxN) => { T.wu = T.wu || {}; const key = [Math.round(w0), s0, maxN].join('|'); if(key in T.wu) return T.wu[key];
    const bar = r2(3*T.f), bg = r2(9*T.f), w = w0 - bar - bg, list = pool(T, D).slice(0, 7), near = /\bmiles?\b/i; let best = null;
    for(let mask = 1; mask < (1 << list.length); mask += 2){ const pk = list.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of [1, .97, .94]) for(const s of [s0, r2(s0*1.06), r2(s0*1.12)]){ const r = T.rows(t, F.pq(s), w*m, s*1.42); if(r.n > maxN || r.n < 2) continue;
        if(r.last < .93*w || r.ws.slice(0, -1).some(x => x < .85*w)) continue;
        const sc = r.n*100 + (near.test(t) ? 60 : 0) + m*30 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc, just: false}; } }
    if(best){ best.h = best.n*best.s*1.42 + best.s*.15;
      best.html = (x, y) => rect(x, y + best.s*.2, bar, best.h - best.s*.45, `background:${ACC}`) + txt('writeup', best.t, x + bar + bg, y, best.w, best.s, 1.42, F.pq, HEAD, {n: best.n, css: best.just ? 'text-align:justify;text-align-last:left' : ''}); }
    return (T.wu[key] = best); };

  // ---------- Just Sold: the question, the seller note in the paper box ----------
  const cta = (T, w, k, max) => { let ls = [Q], s = T.fit(Q, F.cta, w, max || r2(T.FE*1.3*k), T.FB);
    if(!s || s < T.FE){ const s2 = T.fit('Thinking about', F.cta, w, max || r2(T.FE*1.3*k), T.FB); if(s2 && (!s || s2 > s*1.25)){ ls = ['Thinking about', 'selling?']; s = s2; } }
    if(!s) return null;
    return {h: ls.length*s*1.18, s, wide: Math.max(...ls.map(t => T.tw(t, F.cta(s)))), html: (x, y) => ls.map((t, i) => txt('sold.cta' + (i ? 2 : ''), t, x, y + i*s*1.18, w, s, 1.18, F.cta, ACC)).join('')}; };
  // the postcard's seller note: its sentences in order (the first always kept), each in its longer or shorter wording
  const noteTexts = D => { if(D.__poNotes) return D.__poNotes; const N = ((((D.sw || {}).pc || {}).js || {}).front || {}).note || {}, items = [].concat(N.s || []).slice(0, 7), out = [];
    const alt = (it, j) => { const a = [].concat(it); return String(a[Math.min(j, a.length - 1)]); };
    for(let n = items.length; n >= 1; n--) for(let m = 0; m < (1 << n); m++){ const t = items.slice(0, n).map((it, i) => alt(it, (m >> i) & 1)).join(' '); if(!out.includes(t) && !SocialSet.CONDITION.test(t)) out.push(t); }
    if(!out.length) out.push(((D.companion || {}).justSold || {}).ctaNext || 'Call or text me anytime.');
    return (D.__poNotes = out); };
  const ASK = /\b(I can|I would be glad|glad to|call or text)\b/i;
  // exactly n lines at width iw: every line 80%+ and the last 90%+ (owner 11/8), the block narrowed a little or the type raised up to 13%
  const pickNote = (T, D, iw, s0, n) => { T.pn = T.pn || {}; const key = [Math.round(iw), s0, n].join('|'); if(key in T.pn) return T.pn[key]; let hit = null;
    // set ragged (never justified: no wide word gaps); the note always carries the ask, never the sale alone
    out: for(let s = s0; s <= s0*1.13 + .01; s += .5) for(const t of noteTexts(D)){ if(!ASK.test(t)) continue;
      const w = iw, r = T.rows(t, F.note(s), w, s*1.42); if(r.n !== n) continue;
      if(n === 1 ? r.wide < .93*w : (r.last < .93*w || r.ws.slice(0, -1).some(x => x < .86*w))) continue;
      hit = {t, n, s, w, just: false}; break out; }
    return (T.pn[key] = hit); };
  const noteBox = (T, D, w, k, n) => { const nb = r2(Math.min(9*T.f*Math.min(k, 1.25), 14)), s0 = r2(Math.max(T.FB, T.FB*1.04*Math.min(k, 1.3))), pk = pickNote(T, D, w - 2*nb, s0, n); if(!pk) return null;
    const lh = pk.s*1.42, h = pk.n*lh + pk.s*.15 + 2*nb;
    return {h, n: pk.n, len: pk.t.length, html: (x, y) => rect(x, y, w, h, 'background:var(--po-paper)')
      + txt('sold.note', pk.t, x + nb + (w - 2*nb - pk.w)/2, y + nb, pk.w + (pk.n === 1 ? 6 : 0), pk.s, 1.42, F.note, 'var(--po-paper-ink)', {n: pk.n, css: pk.just ? 'text-align:justify;text-align-last:left' : ''})}; };

  // the short seller line where no fuller note fits (the approved socials' own words), beside the accent bar: one line, or its two sentences
  const shortNote = (T, w, k) => { const t = SocialSet.SOLD_POST, bar = r2(Math.min(3*T.f, 4.5)), bg = r2(Math.min(9*T.f, 12)), iw = w - bar - bg, mx = r2(T.FB*1.3*Math.max(k, 1));
    let ls = [t], s = T.fit(t, F.pq, iw, mx, T.FB);
    if(!s){ ls = t.split(/(?<=[.!?])\s+/); s = Math.min(...ls.map(x => T.fit(x, F.pq, iw, mx, T.FB) || 0)); if(!s) return null; }
    const lh = s*1.3, h = ls.length*lh;
    return {h, short: 1, wide: bar + bg + Math.max(...ls.map(x => T.tw(x, F.pq(s)))), html: (x, y) => rect(x, y + s*.18, bar, h - s*.36, `background:${ACC}`)
      + ls.map((q, i) => txt('sold.line' + (i ? 2 : ''), q, x + bar + bg, y + i*lh, iw, s, 1.3, F.pq, HEAD)).join('')}; };

  // ---------- the agent: a hairline, the name in the paper color, the phone in the accent, the brokerage logo ----------
  // 'row': the lines at the left (after the headshot), the logo at the right end. 'stack': the name across the column, then the phone
  // with the logo at the right end of its line (the Just Sold postcard), or under it where the line cannot hold both.
  // o.big: the name set large (Just Sold); o.nameMax: the largest the name may be (always under the status word); o.rule: the hairline over it
  const agent = (T, D, w, k, o) => { o = o || {};
    const A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), f = T.f, gap = r2(9*Math.min(f, 1.5));
    let nmax = 0; const top = o.rule ? T.HH + r2(Math.min(9*f*Math.min(k, 1.2), 14)) : 0, ps0 = r2(Math.max(T.FB, T.FB*(o.big ? 1.3 : 1.15)*k)), ds = r2(Math.max(T.FS, T.FS*Math.min(k, 1.15)));
    nmax = Math.min(o.nameMax || 999, T.FB*(o.big ? 2.4 : 1.5)*k);
    const dW = nar ? T.tw('REALTOR®', F.lab(ds)) : 0, name = A.name || '', phone = A.phone || '';
    const logo = (x, y, lw, lh, cls) => `<div class="abs pos-logo ${cls || ''}" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${HEAD}">${OHL.logo(D, 'dark', '')}</div>`;
    const hs = (x, y, hw, hh) => `<div class="abs pos-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    const wrap = (h, inner, wide) => ({h: top + h, wide: wide || w, html: (x, y) => (o.rule ? hair(T, x, y, w) : '') + inner(x, y + top)});
    // the name and phone lines in a column cw wide; REALTOR(R) rides on the name's line, else the phone's, else its own
    const lines = cw => { const ns = T.fit(name, F.name, cw, nmax, T.FB*1.1), ps = T.fit(phone, F.phone, cw, ps0, T.FB); if(!ns || !ps) return null;
      const nW = T.tw(name, F.name(ns)), pW = T.tw(phone, F.phone(ps));
      const at = !nar ? '' : nW + ns*.35 + dW <= cw ? 'name' : pW + ps*.6 + dW <= cw ? 'phone' : 'own';
      const th = ns*1.16 + 2*f + ps*1.25 + (at === 'own' ? ds*1.3 + f : 0), wide = Math.max(nW + (at === 'name' ? ns*.35 + dW : 0), pW + (at === 'phone' ? ps*.6 + dW : 0), at === 'own' ? dW : 0);
      return {ns, ps, th, wide, pW, at, nameH: ns*1.16, html: (x, y) => { let s = txt('agent.name', name, x, y, nW + 3, ns, 1.16, F.name, HEAD), yy = y + ns*1.16 + 2*f;
        if(at === 'name') s += txt('agent.desig', 'REALTOR®', x + nW + ns*.35, y + ns*1.16*.8 - ds*1.3*.8, dW + 3, ds, 1.3, F.lab, SOFT, {small: 1});
        if(at === 'own'){ s += txt('agent.desig', 'REALTOR®', x, yy, dW + 3, ds, 1.3, F.lab, SOFT, {small: 1}); yy += ds*1.3 + f; }
        s += txt('agent.phone', phone, x, yy, pW + 3, ps, 1.25, F.phone, ACC);
        if(at === 'phone') s += txt('agent.desig', 'REALTOR®', x + pW + ps*.6, yy + ps*1.25*.8 - ds*1.3*.8, dW + 3, ds, 1.3, F.lab, SOFT, {small: 1});
        return s; }}; };
    const row = h0 => { const lmin = Math.max(72*f, w*.34), p0 = lines(w); if(!p0) return null;
      const hsW = h0 ? Math.round(p0.th) : 0, cw = w - lmin - gap*1.5 - (h0 ? hsW + gap : 0), S = lines(cw); if(!S) return null;
      const tx = h0 ? Math.round(S.th) + gap : 0, lx = tx + S.wide + gap*1.5, lh = S.th*.94, lw = Math.min(w - lx, lh*4.3);
      const r = wrap(S.th, (x, y) => (h0 ? hs(x, y, Math.round(S.th), S.th) : '') + S.html(x + tx, y) + logo(x + w - lw, y + S.th*.03, lw, lh, 'r'));
      r.air = Math.max(0, w - lx)*Math.max(0, lh - Math.min(lw, w - lx)/4)/2; return r; };
    const stack = h0 => { const nm0 = nmax; if(o.big) nmax = Math.min(o.nameMax || 999, T.FB*2.4*Math.max(k, 1)); try { return stack0(h0); } finally { nmax = nm0; } };
    const stack0 = h0 => { const p0 = lines(w); if(!p0) return null;
      const hsW = h0 ? Math.round(p0.nameH + 2*f + p0.ps*1.25) : 0, cw = w - (h0 ? hsW + gap : 0), S = lines(cw); if(!S) return null;
            const tx = h0 ? hsW + gap : 0, lh0 = r2(Math.max(S.ps*1.7, S.ns*.7, T.FB*1.9)), lineW = S.pW + (S.at === 'phone' ? S.ps*.6 + dW : 0), beside = cw - lineW - gap*1.4;
      if(beside >= lh0*2.4){ const lw = Math.min(beside, lh0*4.2), ly = S.th - S.ps*1.25 + (S.ps*1.25 - lh0)/2;   // the logo at the right end of the phone's line
        const ext = Math.max(0, ly + lh0 - S.th);
        return wrap(S.th + ext, (x, y) => (h0 ? hs(x, y, hsW, S.th) : '') + S.html(x + tx, y) + logo(x + w - lw, y + ly, lw, lh0, 'r')); }
      const lw = S.wide, lh1 = Math.min(lh0*1.25, r2(lw/3.3));   // the logo under the lines, centered on them and as wide as they run
      return wrap(S.th + gap*.8 + lh1, (x, y) => (h0 ? hs(x, y, hsW, S.th) : '') + S.html(x + tx, y) + logo(x + tx, y + S.th + gap*.8, lw, lh1, 'c'), tx + S.wide); };
    // 'band' (across the foot of a landscape image): the headshot, the name over the phone and REALTOR(R), the logo large at the right end
    const band = h0 => { const ps = T.fit(phone, F.phone, w*.42, ps0, T.FB); if(!ps) return null;
      // the name about as wide as the phone and REALTOR(R) under it, so neither line leaves a hole beside it
      const ns = T.fit(name, F.name, Math.min(w*.46, T.tw(phone, F.phone(ps)) + (nar ? ps*.6 + dW : 0)), Math.min(o.nameMax || 999, nmax*1.35), T.FB*1.1); if(!ns) return null;
      const nW = T.tw(name, F.name(ns)), pW = T.tw(phone, F.phone(ps)), th = ns*1.16 + 2*f + ps*1.25, hsW = h0 ? Math.round(th) : 0, tx = h0 ? hsW + gap : 0;
      const onName = nar && nW + ns*.35 + dW <= Math.max(nW, pW + ps*.6 + dW) + 1 && nW < pW, leftW = tx + (onName ? Math.max(nW + ns*.35 + dW, pW) : Math.max(nW, pW + (nar ? ps*.6 + dW : 0))), lh = th*.92, av = w - leftW - gap*1.3, lw = Math.min(av, lh*4.3); if(lw < lh*2.4) return null;
      const lx = av > lw*1.35 ? w - (av + lw)/2 : w - lw;   // a wide band: the logo sits in the middle of the room at the right, not hard against the edge
      const yp = ns*1.16 + 2*f, r = wrap(th, (x, y) => (h0 ? hs(x, y, hsW, th) : '') + txt('agent.name', name, x + tx, y, nW + 3, ns, 1.16, F.name, HEAD) + txt('agent.phone', phone, x + tx, y + yp, pW + 3, ps, 1.25, F.phone, ACC)
        + (!nar ? '' : onName ? txt('agent.desig', 'REALTOR®', x + tx + nW + ns*.35, y + ns*1.16*.8 - ds*1.3*.8, dW + 3, ds, 1.3, F.lab, SOFT, {small: 1}) : txt('agent.desig', 'REALTOR®', x + tx + pW + ps*.6, y + yp + ps*1.25*.8 - ds*1.3*.8, dW + 3, ds, 1.3, F.lab, SOFT, {small: 1})) + logo(x + lx, y + (th - lh)/2, lw, lh, av > lw*1.35 ? 'c' : 'r'));
      r.hs = h0 ? 1 : 0; r.ns = ns; return r; };
    if(o.band) return (hsOn && band(true)) || band(false);
    const order = o.stack ? [() => stack(hsOn), () => stack(false), () => row(hsOn), () => row(false)] : [() => row(hsOn), () => row(false), () => stack(hsOn), () => stack(false)];
    for(const fn of order){ const r = fn(); if(r) return r; }
    // the logo alone where the column cannot hold the name at a size that reads
    const lh = r2(Math.max(T.FB*2, 22*f)), lw = Math.min(w, lh*4.2);
    return wrap(lh, (x, y) => logo(x, y, lw, lh, ''));
  };

  // a column of items {h, g: the least gap over it, html(x, y)} in `room`: spare height opens every gap alike
  const column = (items, room) => { const need = items.reduce((s, it) => s + it.h + it.g, 0); if(need > room + .5) return null;
    const n = Math.max(1, items.length - 1), e = Math.max(0, room - need)/n;
    return {slack: Math.max(0, room - need), e, html: (x, y) => { let s = ''; items.forEach((it, i) => { y += it.g + (i ? e : 0); s += it.html(x, y); y += it.h; }); return s; }}; };

  const PO = {};
  // ================= post, pin, story, square =================
  // JUST / LISTED with the house number, street and city line beside it (the cover and the flyer front); the heavy rule; Just Listed: the
  // facts row, the house in its keyline across the width, the pull quote, the agent. Just Sold: the house, the question, the seller
  // note in the paper box (or the short seller line where no note fits), the agent. A story opens on the house (no words in its top
  // and bottom 250 px) and ends on two rooms.
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB} = T; T.RH = r2(2.5*f); T.HH = Math.max(1.05, r2(f*2)/2);
    const X = heroKit(D, T), Li = D.listing, sold = D.piece.moment === 'js', story = shape === 'story', SI = statItems(D);
    const pad = r2(16*f), w = W - 2*pad, g = r2(9*f), SAFE = 96, y0 = story ? r2(13*f) : pad, BOT = story ? H - SAFE : H - pad;
    const heads = {}, CAP = {side: 999, sideM: FE*3.2, sideS: FE*2.4, sideXS: FE*1.8};
    // the address reads in order and never splits: the number and the street on one line where the room holds them (the flyer front),
    // else the number over the street (the cover); the city line with its zip directly under the street
    const head = kind => { if(kind in heads) return heads[kind]; let r = null; const cg = r2(6*f);
      if(kind === 'stack'){ const wd = word(T, w), ad = addrRow(T, Li, w, wd.s*.72), ct = eyebrow(T, D, w, 1, {tight: 1}), ga = g*1.25;
        if(ad && ct && ad.wide >= w*.8) r = {h: wd.h + ga + ad.h + cg + ct.h, ws: wd.s, html: (x, y) => wd.html(x, y) + ad.html(x, y + wd.h + ga) + ct.html(x, y + wd.h + ga + ad.h + cg)}; }
      else { let best = null;   // the word with the address beside it: the split that leaves the least room over and beside the address
        for(let wk = .64; wk >= .2; wk -= .02){ const wd = word(T, w*wk, CAP[kind]), gc = r2(15*f), rw = w - wd.wide - gc, ct = eyebrow(T, D, rw, 1, {tight: 1}); if(!ct) continue;
          const room = wd.h - ct.h - cg, a1 = [.62, .74, .86].map(R => addrRow(T, Li, rw, wd.s*.95, R)).filter(q => q && q.h <= wd.h - ct.h - cg + .5).sort((p, q) => q.wide - p.wide)[0] || null, ad = (a1 && a1.h <= room + .5 ? a1 : null) || addrStack(T, Li, rw, room, {maxN: wd.s, maxS: wd.s*.8, numFirst: 1}); if(!ad) continue;
          const sc = (room - ad.h)*3 + (rw - ad.wide)*.6 + Math.abs(wk - .56)*40 - wd.s*1.5; if(!best || sc < best.sc) best = {sc, wd, gc, ad, ct}; }
        if(best){ const {wd, gc, ad, ct} = best, ax = wd.wide + gc;
          r = {h: wd.h, ws: wd.s, html: (x, y) => wd.html(x, y) + ad.html(x + ax, y + wd.h - ct.h - cg - ad.h) + ct.html(x + ax, y + wd.h - ct.h)}; } }
      return (heads[kind] = r); };
    const build = (k, o) => { const hd = head(o.head); if(!hd) return null; const kg = Math.min(1.15, Math.max(.8, k));
      const above = [{h: hd.h, g: 0, html: hd.html}, {h: T.RH, g: g*1.15*kg, html: (x, y) => heavy(T, x, y, w)}], below = [];
      if(!sold){
        if(o.stats){ const st = statRow(T, SI, w, k); if(!st) return null; above.push({h: st.h, g: g*1.05*kg, html: st.html}); }
        if(o.wl){ const wu = writeUp(T, D, w, r2(Math.max(FB, FB*1.04*k)), o.wl); if(!wu || wu.n < Math.min(o.wl, 2)) return null; below.push({h: wu.h, g: g*1.15*kg, html: wu.html}); }
        const ag = agent(T, D, w, k, {rule: 1, nameMax: hd.ws*.6}); below.push({h: ag.h, g: g*1.15*kg, html: ag.html});
      } else {
        if(o.cta !== 0){ const c = cta(T, w, k, Math.min(hd.ws*.75, FE*1.5*k)); if(!c) return null; below.push({h: c.h, g: g*1.1*kg, html: c.html}); }
        const nt = o.nl === 's' ? shortNote(T, w, k) : noteBox(T, D, w, k, o.nl); if(!nt) return null; below.push({h: nt.h, g: g*(o.cta !== 0 ? .7 : 1.1)*kg, html: nt.html});
        const ag = agent(T, D, w, k, {rule: 1, big: shape !== 'square', nameMax: hd.ws*.6}); below.push({h: ag.h, g: g*1.25*kg, html: ag.html});
      }
      const sum = l => l.reduce((s, it) => s + it.h + it.g, 0), gp = g*1.2*kg;   // gp: the gap over the house (a story's house leads, so the gap is under it)
      return {above, below, gp, room: BOT - y0 - sum(above) - sum(below) - gp};
    };
    const J = (hd, a) => a.map(x => Object.assign({head: hd}, x)), SD = ['side', 'sideM', 'sideS', 'sideXS'], each = x => SD.map(hd => Object.assign({head: hd}, x));
    const opts = sold ? J('stack', [{nl: 3}, {nl: 2}]).concat(J('side', [{nl: 4}, {nl: 3}, {nl: 2}]), J('sideM', [{nl: 3}, {nl: 2}]), J('sideS', [{nl: 3}, {nl: 2}]), each({nl: 1}), each({nl: 's'}), each({nl: 's', cta: 0}))
      : J('stack', [{stats: 1, wl: 3}, {stats: 1, wl: 2}]).concat(J('side', [{stats: 1, wl: 3}]), each({stats: 1, wl: 2}), J('stack', [{stats: 1, wl: 0}]), each({stats: 1, wl: 0}), each({stats: 0, wl: 0}));
    const KMAX = 1.5, KMIN = .6, NK = story ? 1 : shape === 'square' ? 0 : sold ? .2 : .35; let pick = null;
    for(const [kFloor, low] of [[.8, 1], [KMIN, 1], [KMIN, .72]]){   // last: the house narrower than the image, rooms beside it
      for(const o of opts){ const b1 = build(KMIN, o); if(!b1 || b1.room < X.min(w)*low) continue;
        const need = low < 1 ? X.min(w)*low : Math.min(b1.room, X.min(w) + NK*(X.nat(w) - X.min(w)));
        let k = 0; for(let t = KMAX; t >= kFloor - .001; t -= .025){ const b = build(t, o); if(b && b.room >= need){ k = t; break; } }
        if(k){ pick = {o, k}; break; } }
      if(pick) break; }
    const last = {head: 'sideXS', nl: 's', cta: 0, stats: 0, wl: 0};
    pick = pick || {o: last, k: KMIN};
    const B = build(pick.k, pick.o) || build(KMIN, pick.o) || build(KMIN, last);
    const narrow = !story && B.room < X.min(w) - .5;
    const ph = narrow ? B.room : Math.max(X.min(w), Math.min(story ? X.nat(w) : X.max(w), B.room)), spare = Math.max(0, B.room - ph);
    const heroAt = yy => { if(!narrow) return X.hero(pad, yy, w, ph); let hw = w; while(hw > 100 && X.min(hw) > ph) hw -= 3;
      const sw = w - hw - g, n = Math.max(1, Math.min(3, Math.round(ph/(sw*.85)))), ids = X.sup(n), rh = (ph - (ids.length - 1)*g)/Math.max(1, ids.length);
      return X.hero(pad, yy, hw, ph) + ids.map((id, i) => X.plain(id, pad + hw + g, yy + i*(rh + g), sw, rh)).join(''); };
    const rowH = !story && spare >= 64*f ? spare - g : 0, gaps = B.above.length - 1 + B.below.length + 1, e = story || rowH ? 0 : spare/gaps;
    let h = CSS, y = y0;
    const run = list => list.forEach(it => { y += it.g + (it.g ? e : 0); h += it.html(pad, y); y += it.h; });
    if(story){ h += X.hero(pad, y, w, ph); y += ph + B.gp; run(B.above); run(B.below);
      const ry = y + g*1.3; h += X.row(pad, ry, w, H - pad - ry, 2, g); }
    else { run(B.above); y += B.gp + e; h += heroAt(y); y += ph;
      if(rowH){ h += X.row(pad, y + g, w, rowH, 2, g); y += rowH + g; }
      run(B.below); }
    T.done();
    return h;
  };

  // ================= wide (X), Google Business Profile: the postcard fronts, with the cover's foot =================
  // The type column (JUST / LISTED or SOLD, the house number and street, the city line under them, the heavy rule) beside the
  // house in its keyline: type at the left for Just Listed, at the right for Just Sold, as the postcards have it.
  // Across the foot: the facts row (Just Listed) or the seller note in its paper box (Just Sold), then the agent's band with the
  // headshot and the logo. A house too tall for its column keeps its own shape and room photos stack beside it.
  const land = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB} = T; T.RH = r2(Math.min(2.5*f, 4)); T.HH = Math.max(1.05, r2(Math.min(f, 1.5)*2)/2);
    const X = heroKit(D, T), Li = D.listing, sold = D.piece.moment === 'js', SI = statItems(D);
    const m = r2(Math.min(13*f, H*.05)), g = r2(Math.min(8*f, H*.028)), gC = r2(Math.min(12*f, W*.028)), AV = H - 2*m, full = W - 2*m;
    const KS = [1.3, 1.15, 1, .9, .8, .7, .6], WK = [1, .88, .76, .64, .52, .4];
    // the number never stands taller than the status word
    const addr = (tw, wd, k) => { const kk = Math.min(1, Math.max(.8, k || 1)); const mr = Math.max(wd.s*.7, FE/.62 + .5); return (mr <= wd.s ? addrRow(T, Li, tw, mr) : null) || addrStack(T, Li, tw, null, {maxN: Math.max(wd.s, FE), maxS: Math.max(wd.s*.8*kk, FE)}); };
    // the house in a column pw wide and `room` tall, never cropped much past its own shape; what it cannot take goes to a room photo under it
    const photos = (pw, room) => { if(room < X.min(pw)){
        // a house too tall for the column's width keeps its own shape, narrower, and room photos stack beside it (the flyer's rooms)
        let hw = pw; while(hw > 80 && X.min(hw) > room) hw -= 4; const sw = pw - hw - g; if(hw <= 80 || sw < 46*Math.min(f, 1.3)) return null;
        const n = Math.max(1, Math.min(4, Math.round(room/(sw*.85)))), rh = (room - (n - 1)*g)/n; if(rh < sw*.45 || rh > sw*1.9) return null;
        const ids = X.sup(n); if(ids.length < n) return null;
        return {pen: 8, hw, area: hw*room + sw*room*.5, html: (x, y) => X.hero(x, y, hw, room) + ids.map((id, i) => X.plain(id, x + hw + g, y + i*(rh + g), sw, rh)).join('')}; }
      const ph = Math.min(room, X.max(pw), Math.ceil(X.nat(pw)*1.15)), rest = room - ph;
      if(rest - g >= Math.max(50*f, (pw - 2*X.O)*.4)) return {pen: 6, hw: pw, area: pw*ph + pw*(rest - g)*.5, html: (x, y) => X.hero(x, y, pw, ph) + X.row(x, y + ph + g, pw, rest - g, 1, g)};
      return {pen: rest > 6*f ? rest*(rest > 26*f ? 5 : 2) : 0, hw: pw, area: pw*ph, html: (x, y) => X.hero(x, y + rest/2, pw, ph)}; };
    // the status word as wide as its column, held to a size where the room beside JUST (the shorter line) stays a small part of the image
    const wordC = (tw, wk) => { let wd = word(T, tw); if(wk && wk < 1) wd = word(T, tw, Math.max(FE*1.25, wd.s*wk)); const ls = SocialSet.M.split(' '), d = (T.w100(ls[1], F.hl) - T.w100(ls[0], F.hl))/100;
      for(let i = 0; i < 80 && (Math.max(0, d)*wd.s + gC)*(wd.s*PITCH + 6) > .024*W*H && wd.s > FE*1.25; i++) wd = word(T, tw, wd.s - 1);
      return wd; };
    const wordSc = (wd, tw, wk) => Math.min(wd.s/FE, 3.2)*30 - (1 - (wk || 1))*120 - Math.max(0, tw - wd.wide - 6*f)*1.2;
    // the room left at the right of each item narrower than its column, as a share of the image
    const airPen = (items, tw, C) => items.reduce((a, it) => { const d = tw - (it.wide || tw); return a + (d + gC > W*.07 ? (d + gC)*(it.h + it.g + C.e) : d*(it.h + it.g)*.15); }, 0)/(W*H)*4000;
    const slackPen = C => Math.max(0, C.e - 9*Math.min(f, 1.4))*6 + Math.max(0, C.slack - 30*Math.min(f, 1.4))*3;
    // the type column: the status word; the address in order and never split (the number and street on one line; or the number
    // beside the word with the street under them; or the number over the street); the city line with its zip directly under the
    // street; the heavy rule
    const textCol = (tw, k, o, room) => { const items = [], kg = Math.min(1.15, Math.max(.6, k)), kk = Math.min(1, Math.max(.8, k));
      const wd = wordC(tw, o.wk); items.push({h: wd.h, g: 0, html: wd.html, wide: wd.wide});
      const PA = parts(Li.address), free = tw - wd.wide - r2(9*f), ct = eyebrow(T, D, tw, Math.min(k, 1), {tight: 1}); if(!ct) return null;
      if(o.mode === 'side'){
        if(!PA.num) return null; const sN = Math.min(wd.s, Math.floor(free/T.w100(PA.num, F.hl)*200)/2); if(sN < FE) return null;
        if((wd.h - capH(sN))/2 > H*.07 || (free - T.wd(PA.num, F.hl, sN))*wd.h > (sold ? .03 : .017)*W*H) return null;   // never a hole over, under or beside the number
        const nW = T.wd(PA.num, F.hl, sN), stt = addrStack(T, {address: PA.st}, tw, null, {maxS: Math.max(wd.s*.8*kk, FE)}); if(!stt) return null;
        // (Just Sold: a number much narrower than its room sits in the middle of it, so the room parts into two small margins)
        const gapR = tw - wd.wide - nW, nx = sold && gapR*(wd.h + m + g*1.1*kg) > .028*W*H ? wd.wide + gapR/2 - 1 : tw - nW - 2;
        items[0] = {h: wd.h, g: 0, wide: tw, html: (x, y) => wd.html(x, y) + caps('addr.num', PA.num, x + nx, y + (wd.h - capH(sN))/2, nW + 2, sN, F.hl, HEAD, {align: 'right'})};
        items.push({h: stt.h, g: g*1.1*kg, html: stt.html, wide: stt.wide});
      } else if(o.mode === 'row'){ let ad = null; for(const R of [.62, .74, .86]){ const mr = Math.max(wd.s*.72*kk, FE/R + .5); if(mr > wd.s) continue; ad = addrRow(T, Li, tw, mr, R); if(ad) break; }
        if(!ad) return null; items.push({h: ad.h, g: g*1.1*kg, html: ad.html, wide: ad.wide});
      } else { const ad = addrStack(T, Li, tw, null, {maxN: Math.max(wd.s*kk, FE), maxS: Math.max(wd.s*.8*kk, FE)}); if(!ad) return null; items.push({h: ad.h, g: g*1.1*kg, html: ad.html, wide: ad.wide}); }
      items.push({h: ct.h, g: g*.85*kg, html: ct.html, wide: ct.wide});
      items.push({h: T.RH, g: g*1.3*kg, html: (x, y) => heavy(T, x, y, tw)});
      const C = room == null ? column(items, items.reduce((a, it) => a + it.h + it.g, 0)) : column(items, room); if(!C) return null;
      const l0 = SocialSet.M.split(' ')[0], top = o.mode === 'side' ? [] : [{wide: T.wd(l0, F.hl, wd.s), h: wd.s*PITCH, g: 0}];   // the room beside JUST, the shorter line
      return Object.assign(C, {wd, sc: wordSc(wd, tw, o.wk) - airPen(items.concat(top), tw, C) + k*30 - slackPen(C) + ({row: 24, side: 8}[o.mode] || 0)}); };
    // the foot: the agent's band at a few sizes; over it the facts row (Just Listed) or the seller note (Just Sold)
    const bands = []; for(const ka of [1.3, 1.1, 1, .85, .7, .6]){ const a = agent(T, D, full, ka, {rule: 1, band: 1, nameMax: FE*1.2}); if(a && !bands.some(b => Math.abs(b.a.h - a.h) < 1 && b.a.hs === a.hs)) bands.push({a, ka}); }
    if(bands.some(b => b.a.hs)) for(let i = bands.length - 1; i >= 0; i--) if(!bands[i].a.hs) bands.splice(i, 1);   // the headshot versions always show the headshot
    if(!bands.length) bands.push({a: agent(T, D, full, .7, {rule: 1}), ka: .7});
    const strips = [];
    if(!sold){ for(const ks of [1.1, .9, .7, .6]){ const s = statRow(T, SI, full, ks, {grid: false}); if(s && !strips.some(q => q.n === s.n && Math.abs(q.h - s.h) < 1.5)) strips.push(Object.assign(s, {sc: s.n*22 + ks*6})); } }
    else { for(const n of [3, 2, 1]) for(const kn of [1.15, 1, .9]){ const s = noteBox(T, D, full, kn, n); if(s){ strips.push(Object.assign(s, {sc: n > 1 ? 70 : 55})); break; } }
      const sn = shortNote(T, full, 1); if(sn) strips.push(Object.assign(sn, {sc: 45})); }
    strips.push(null);
    let pick = null, cur = null; const per = [], take = c => { if(!cur || c.sc > cur.sc) cur = c; };
    for(const st of strips){ cur = null; for(const bd of bands){ const AVt = AV - (st ? st.h + g*1.5 : 0) - bd.a.h - g*1.5; if(AVt < 70) continue;
      for(let fr = .26; fr <= .62; fr += .01){ const tw = Math.round(full*fr), pw = full - tw - gC; if(tw < 60*f || pw < 90) continue;
        const P = photos(pw, AVt); if(!P) continue;
        for(const mode of ['row', 'side', 'stack']) for(const wk of WK){ let C = null; for(const k of KS){ C = textCol(tw, k, {wk, mode}, AVt); if(C) break; } if(!C) continue;
          // the house keeps 45% of the image's width or more; the agent's name stays well under the status word
          take({C, P, st, bd, tw, pw, sc: C.sc + P.area/(W*H)*480 - P.pen - (P.hw < W*.45 ? 150 + (W*.45 - P.hw)*2 : 0) + (st ? st.sc : -80) + (bd.a.hs ? 40 : 0) + bd.ka*10 - ((bd.a.ns || 0) > C.wd.s*.72 ? 260 : 0)}); break; } } }
      if(cur) per.push(cur); }
    // the fullest foot (all the facts, the fullest note) wherever it lays out nearly as well as the best of the others
    { const top = Math.max(-1e9, ...per.map(c => c.sc - (c.st ? c.st.sc : -80))); const withFoot = per.filter(c => c.st); pick = withFoot.find(c => c.sc - c.st.sc >= top - (sold ? 120 : 1e9)) || withFoot[0] || per[0] || null; }
    if(!pick){ const bd = bands[bands.length - 1], tw = Math.round(full*.5), pw = full - tw - gC, C = textCol(tw, .6, {wk: .4, mode: 'stack'}, null) || {html: () => ''};
      pick = {C, P: photos(pw, AV - bd.a.h - g*1.5) || {html: (x, y) => X.hero(x, y, pw, X.min(pw))}, st: null, bd, tw, pw}; }
    const {C, P, st, bd, tw, pw} = pick, tx = sold ? m + pw + gC : m, px = sold ? m : m + tw + gC;
    let h = CSS + C.html(tx, m) + P.html(px, m);
    if(st) h += st.html(m, H - m - bd.a.h - g*1.5 - st.h);
    h += bd.a.html(m, H - m - bd.a.h);
    T.done();
    return h;
  };
  PO.portrait = tall;
  PO.landscape = land;

  // ================= carousel photo slides =================
  // the room inside the accent keyline on the dark field; under it the heavy rule, JUST / LISTED (or SOLD) stacked at the left and the
  // house number over the street at the right
  PO.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), {f} = T; T.RH = r2(2.5*f); T.HH = 1.05;
    const X = heroKit(D, T), pad = r2(16*f), w = W - 2*pad, g = r2(9*f);
    let wd = null, ad = null;
    { let best = null; for(let wk = .64; wk >= .28; wk -= .02){ const a = word(T, w*wk, T.FE*3.6), b = addrStack(T, D.listing, w - a.wide - r2(18*f), a.h, {align: 'right', maxN: a.s, maxS: a.s*.8, numFirst: 1}); if(!b) continue;
        const gap = w - a.wide - b.wide, sc = gap + Math.abs(wk - .5)*30; if(!best || sc < best.sc) best = {sc, a, b}; }
      if(best){ wd = best.a; ad = best.b; } else wd = word(T, w*.4, T.FE*2.6); }
    const foot = wd.h, top = pad, ph = H - pad - foot - g*1.3 - T.RH - g*1.3 - top;
    let h = CSS + X.framed(D.piece.photo, pad, top, w, ph), y = top + ph + g*1.3;
    h += heavy(T, pad, y, w); y += T.RH + g*1.3;
    h += wd.html(pad, y) + (ad ? ad.html(pad + wd.wide + r2(18*f), y + wd.h - ad.h) : '');
    T.done();
    return h;
  };
  window.POSocial = PO;
})();
