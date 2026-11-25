/* templates/lifted-photo/lp-social.js: Lifted Photo's own Just Listed and Just Sold social images (owner 11/18/2026: every
   follow-on piece matches its set's main pieces). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and replaces
   its three layouts for this set only; nothing shared changes.

   Read off the approved Lifted Photo pieces (postcard.html, flyer.html, lp-tokens.css, lp-marks.css):
     - the brand kit's paper as the field
     - Just Listed: the house as a print lifting off the paper, bleeding off the edges, its free edge on one sweep over a soft shadow
       (the postcard front's left edge; across a tall image the foot, as the postcard back's strip of prints)
     - Just Sold: the house as a snapshot set down on the paper, tilted a little, one soft corner, a soft shadow (the Just Sold front)
     - "Just" in ink over "Listed" / "Sold" in the main color, Fraunces 600, sentence case (on one line in the two tones where a
       wide image's column cannot hold the stack with everything else, and on the carousel slides)
     - the eyebrow in tracked accent caps: the city line with its zip on Just Listed, "Thinking about selling?" on Just Sold
       (no neighborhood: the shared engine keeps it off socials)
     - the street in Fraunces 600; the facts as a Fraunces numeral with its tracked caps label in the main color, hairlines between
       the rows; the highlights on round accent marks; hairlines at a quarter ink; the agent's name in Fraunces over the number in
       the main color, REALTOR(R), the headshot where the agent shows one, the one logo
     - the postcard backs' block of the main color along the foot with the agent reversed on it (post, pin, story, square)
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold and a seller note on every Just Sold image, the
   whole house in every frame (every swept edge is tested with OHL.polyFits; the house photo is never cropped in from the sides on the
   tall shapes), every note and write-up line 80%+ and the last 90%+ of its measure, text at the phone floors of
   templates/_shared/readsize.js. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const FR = "'Fraunces'", OU = "'Outfit'";
  const INK = 'var(--lp-ink)', TEXT = 'var(--lp-text)', MAIN = 'var(--lp-main)', ACC = 'var(--lp-accent)', RULE = 'var(--lp-rule)', BAND = 'var(--lp-band)', ONB = 'var(--lp-on-band)';
  const Q = 'Thinking about selling?';
  const F = {
    word: s => `font:600 ${s}pt ${FR};letter-spacing:${(-s*.008).toFixed(2)}pt`,
    street: s => `font:600 ${s}pt ${FR};letter-spacing:${(-s*.015).toFixed(2)}pt`,
    eye: tr => s => `font:600 ${s}pt ${OU};text-transform:uppercase;letter-spacing:${(s*tr).toFixed(2)}pt`,
    caps: s => `font:600 ${s}pt ${OU};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`,
    num: s => `font:600 ${s}pt ${FR}`,
    body: s => `font:400 ${s}pt ${OU}`,
    name: s => `font:600 ${s}pt ${FR};letter-spacing:${(-s*.01).toFixed(2)}pt`,
    phone: s => `font:600 ${s}pt ${OU};letter-spacing:${(s*.04).toFixed(2)}pt`,
    q: s => `font:600 ${s}pt ${FR};letter-spacing:${(-s*.012).toFixed(2)}pt`,
  };
  const CSS = `<style>
    .ss .lps-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:flex-end}
    .ss .lps-logo.c .logo{justify-content:center}
    .ss .lps-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .lps-logo .text{font:600 12pt/1.15 ${OU};text-align:right;color:inherit}
    .ss .lps-hs{position:absolute;overflow:hidden}.ss .lps-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .lps-w{position:absolute;white-space:nowrap}
    .ss .lps-row{position:absolute;white-space:nowrap;overflow:hidden;display:flex;align-items:baseline}
    .ss .lps-bul{position:absolute;white-space:nowrap;overflow:hidden;display:flex;align-items:center}
    .ss .lps-bul i{border-radius:50%;background:${ACC};flex:none;display:block}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2};
    const M = document.createElement('div'); document.body.appendChild(M);
    const tmemo = new Map();
    T.tw = (t, css) => { const key = t + '|' + css; if(tmemo.has(key)) return tmemo.get(key); M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:nowrap;${css}`; M.textContent = t; const v = M.getBoundingClientRect().width*.75; tmemo.set(key, v); return v; };
    const memo = new Map();
    T.rows = (t, css, w, lh) => { const key = t + '|' + css + '|' + w.toFixed(1) + '|' + lh.toFixed(2); if(memo.has(key)) return memo.get(key);
      M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:normal;width:${w}pt;${css};line-height:${lh}pt;text-align:left`; M.textContent = t;
      const rg = document.createRange(); rg.selectNodeContents(M); const out = [];
      [...rg.getClientRects()].forEach(b => { if(b.width < .5) return; const r = out.find(x => Math.abs(x.top - b.top) < b.height*.5); if(r){ r.l = Math.min(r.l, b.left); r.r = Math.max(r.r, b.right); } else out.push({top: b.top, l: b.left, r: b.right}); });
      out.sort((a, b) => a.top - b.top); const ws = out.map(r => (r.r - r.l)*.75);
      const res = {n: out.length, ws, wide: Math.max(1, ...ws), last: ws[ws.length - 1] || 0}; memo.set(key, res); return res;
    };
    T.one = (t, face, w, max, min) => { for(let s = Math.max(max, min); s >= min - .01; s -= .5) if(T.tw(t, face(s)) <= w) return s; return T.tw(t, face(min)) <= w ? min : null; };
    T.done = () => M.remove();
    return T;
  };
  // Fraunces 600 capitals, measured on the page: the cap height and where the baseline falls in a line box as tall as the type (em)
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = `600 200px ${FR}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:600 200px ${FR};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}; return MET; };
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const hair = (x, y, w) => rect(x, y, w, 1, `background:${RULE}`), vhair = (x, y, h) => rect(x, y, 1, h, `background:${RULE}`);
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  const none = {h: 0, html: () => ''};

  // ---------- the house and the prints ----------
  const heroKit = (D, f) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, full = Ivory.fullHouse(D, id), hb = HP.house && full ? HP.house : null, fx0 = HP.focusX;
    const X = {id, pAR, hb};
    // a frame taller than the photo's shape centers on the house
    X.focus = (w, h) => { if(hb && h > w/pAR + .5){ const vis = w/(h*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } else if(fx0 == null) delete HP.focusX; else HP.focusX = fx0; };
    X.box = (w, h) => { X.focus(w, h); return OHL.houseInFrame(D, id, w, h); };
    // does the whole house stand in a frame w x h (a little air at the sides and the foot)? no box: only the photo's own shape
    X.whole = (w, h) => { if(!full) return true; if(!hb) return Math.abs(h - w/pAR) <= 2; const b = X.box(w, h); return !!b && b.left >= .012 && b.right <= .988 && b.bottom <= .985 && h >= w/pAR*.755 - .5; };
    X.min = w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR));
    X.max = w => Math.ceil(hb ? Math.max(w/pAR, w/((hb.right - hb.left + .06)*pAR)) : w/pAR);
    X.nat = w => Math.ceil(w/pAR);
    // the tallest frame w wide, at most hMax, that keeps the house whole (0: none)
    X.tallest = (w, hMax) => { for(let h = Math.min(hMax, X.max(w)); h >= X.min(w) - 8; h -= 2) if(X.whole(w, h)) return h; return X.whole(w, X.min(w)) && X.min(w) <= hMax ? X.min(w) : 0; };
    const sh = (dx, dy, bl, a) => `filter:drop-shadow(${(dx*f).toFixed(1)}pt ${(dy*f).toFixed(1)}pt ${(bl*f).toFixed(1)}pt rgba(0,0,0,${a}))`;
    const N = 16, pw = u => Math.pow(Math.max(0, Math.min(1, u)), 1.7);
    const POLY = {
      foot: l => [[0, 0], [1, 0]].concat([...Array(N + 1)].map((_, i) => { const u = 1 - i/N; return [u, 1 - l*pw(u)]; })),          // lowest at the left, lifting toward the right
      left: l => [[1, 0], [1, 1]].concat([...Array(N + 1)].map((_, i) => { const yy = 1 - i/N; return [l*pw(1 - yy), yy]; })),     // sweeping out toward the top
    };
    // a print whose free edge runs on one sweep over a soft shadow; the sweep flattens until the whole house stands inside it
    X.swept = (pid, x, y, w, h, edge, lift) => { if(pid === id) X.focus(w, h);
      let l = lift, poly = null; for(; l >= .025; l -= .01){ poly = POLY[edge](l); if(OHL.polyFits(D, pid, w, h, poly, .015)) break; poly = null; }
      const st = `left:0;top:0;width:${w}pt;height:${h}pt`;
      return `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${edge === 'left' ? sh(-6, 3, 8, .3) : sh(0, 6, 8, .32)}">${poly ? OHL.maskedPhoto(D, pid, st, poly) : OHL.photo(D, pid, st)}</div>`; };
    X.lift = (w, h, edge, lift) => { X.focus(w, h); for(let l = lift; l >= .025; l -= .01) if(OHL.polyFits(D, id, w, h, POLY[edge](l), .015)) return l; return 0; };
    // the Just Sold snapshot: tilted a little, one soft corner where the house leaves it room, a soft shadow
    X.tilt = (x, y, w, h) => { const b = X.box(w, h), soft = !b || b.left > .12 || b.bottom < .86;
      return `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;transform:rotate(-1.6deg);${sh(0, 6, 9, .3)}">${OHL.photo(D, id, `left:0;top:0;width:${w}pt;height:${h}pt;${soft ? `border-radius:0 0 0 ${(w*.17).toFixed(1)}pt / 0 0 0 ${(h*.115).toFixed(1)}pt` : ''}`)}</div>`; };
    X.side = () => (window.OHEmail ? OHEmail.support(D, id, 1) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)))[0] || null;
    X.snap = (pid, x, y, w, h) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;transform:rotate(-1.6deg);${sh(0, 6, 9, .3)}">${OHL.photo(D, pid, `left:0;top:0;width:${w}pt;height:${h}pt`)}</div>`;
    // room prints along the foot of a tall image, their tops on one sweep (the postcard back's strip, turned over)
    X.strip = (x, y, w, h, n) => { const all = window.OHEmail ? OHEmail.support(D, id, n + 6) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)), root = p => String((D.photos[p] || {}).tags || p).split(',')[0].trim().toLowerCase().replace(/[\s\d]+$/, '').replace(/b$/, ''), ids = [];
      all.forEach(p => { if(ids.length < n && !ids.some(q => root(q) === root(p))) ids.push(p); }); if(!ids.length || h < 30) return '';
      const g = r2(4*f), cw = (w - (ids.length - 1)*g)/ids.length, L = Math.min(h*.2, 20*f), top = u => L*(1 - pw(u));
      return ids.map((p, i) => { const x0 = i*(cw + g), poly = [[1, 1], [0, 1]].concat([...Array(N + 1)].map((_, j) => { const u = j/N; return [u, top((x0 + u*cw)/w)/h]; }));
        return `<div class="abs" style="left:${x + x0}pt;top:${y}pt;width:${cw}pt;height:${h}pt;${sh(0, -3, 5, .26)}">${OHL.maskedPhoto(D, p, `left:0;top:0;width:${cw}pt;height:${h}pt`, poly)}</div>`; }).join(''); };
    return X;
  };

  // ---------- words ----------
  // "Just" in ink over "Listed" / "Sold" in the main color, set by its ink: the top of the capitals at y
  const wordBlock = (T, b, w, max, min) => { const ss = T.one(b, F.word, w - 1, max, min); if(!ss) return null;
    const m = met(), ww = Math.max(T.tw('Just', F.word(ss)), T.tw(b, F.word(ss))), step = ss*.97, h = step + m.cap*ss;
    const line = (slot, t, x, y, c) => `<div class="lps-w" data-slot="${slot}" data-lines="1" style="left:${x - ss*.035}pt;top:${y - (m.base - m.cap)*ss}pt;width:${ww + ss*.12}pt;height:${ss}pt;${F.word(ss)};line-height:${ss}pt;color:${c}">${t}</div>`;
    return {ss, h, w: ww, html: (x, y) => line('moment', 'Just', x, y, INK) + line('moment.1', b, x, y + step, MAIN)}; };
  // both words on one line (the carousel slides' foot)
  const wordLine = (T, b, w, max, min) => { const t = 'Just ' + b, ss = T.one(t, F.word, w - 1, max, min); if(!ss) return null; const m = met(), ww = T.tw(t, F.word(ss));
    return {ss, h: m.cap*ss, w: ww, html: (x, y) => `<div class="lps-w" data-slot="moment" data-lines="1" style="left:${x}pt;top:${y - (m.base - m.cap)*ss}pt;width:${ww + 2}pt;height:${ss}pt;${F.word(ss)};line-height:${ss}pt;color:${INK}">Just <span style="color:${MAIN}">${b}</span></div>`}; };
  // the city line with its zip in tracked caps: the eyebrow over the word (accent, the postcard front's first line) or the line under
  // the street (the postcard back). fillTo: the tracking opened so the line runs that width.
  const placeLine = (T, Li, w, k, color, fillTo) => { const t = OHL.place(Li);
    for(const tr of [.28, .2, .13, .07]){ const s = T.one(t, F.eye(tr), w, T.FS*1.08*Math.min(Math.max(k, 1), fillTo ? 1.7 : 1.25), T.FS); if(!s) continue;
      let tr2 = tr; if(fillTo) for(let q = tr; q <= .5 && T.tw(t, F.eye(q)(s)) <= Math.min(w, fillTo); q += .01) tr2 = q;
      return {h: s*1.3, wide: T.tw(t, F.eye(tr2)(s)), html: (x, y) => txt('place', t, x, y, w, s, 1.3, F.eye(tr2), color, {small: 1})}; }
    return null; };
  const eyebrow = (T, D, w, k, fillTo) => placeLine(T, D.listing, w, k, ACC, fillTo) || none;
  // the street with the city line under it
  const withPlace = (T, st, Li, w, k, color, fillTo) => { const pl = st && placeLine(T, Li, w, k, color, fillTo); if(!pl) return null; const gp = 2*T.f;
    return {h: st.h + gp + pl.h, n: st.n, s: st.s, w: Math.max(st.w || 0, pl.wide), wide: Math.max(st.w || 0, pl.wide), html: (x, y, c) => st.html(x, y, c) + pl.html(x, y + st.h + gp)}; };
  // the street, never shortened and never split: one line, down to the floor size; a measure too narrow for that is not used
  const street = (T, Li, w, max) => { const t = Li.address, s = T.one(t, F.street, w, max, T.FE); if(!s) return null;
    const st = {t, s, n: 1, w: T.tw(t, F.street(s)), h: s*1.18};
    st.html = (x, y, color) => txt('address', st.t, x, y, w, st.s, 1.18, F.street, color || INK, {html: `<span>${esc(st.t)}</span>`});
    return st; };
  // the facts as the flyer sets them: a Fraunces numeral with its tracked caps label in the main color, one to a row
  const parts = D => { const L = D.listing, n = v => Number(v).toLocaleString('en-US'), out = [];
    if(L.beds) out.push([String(L.beds), L.beds == 1 ? 'Bedroom' : 'Bedrooms']);
    if(L.baths){ const bt = window.BD && BD.bathsText ? BD.bathsText(L) : {main: `${L.baths} Full Baths`}; [bt.main, bt.half].filter(Boolean).forEach(t => { const m = /^([\d.,½]+)\s+(.*)$/.exec(String(t)); if(m) out.push([m[1], m[2]]); }); }
    if(L.sqft) out.push([n(L.sqft), 'Sq Ft']);
    const yr = L.yearBuilt || L.year; if(yr) out.push([String(yr), 'Built']);
    const lot = (OHL.factSix(L).find(([ic]) => ic === 'lot') || [])[1], lm = lot && /^([\d.,]+)\s+(.*)$/.exec(lot); if(lm) out.push([lm[1], lm[2]]);
    if(L.stories) out.push([String(L.stories), L.stories == 1 ? 'Story' : 'Stories']);
    return out; };
  const factRows = (T, list, w, k, cols, top) => { cols = cols || 1; if(!list.length) return null;
    const g = r2(10*T.f), cw = (w - (cols - 1)*g)/cols;
    for(let ns = r2(T.FB*1.5*Math.max(k, .8)); ns >= T.FB - .01; ns -= .5){ const ls = Math.max(T.FS, r2(ns*.5)), gp = ls*.5;
      if(list.some(([a, b]) => T.tw(a, F.num(ns)) + gp + T.tw(b, F.caps(ls)) > cw - 1)) continue;
      const rh = ns*1.36, rows = Math.ceil(list.length/cols);
      return {h: rows*rh, n: list.length, wide: cols > 1 ? w : Math.max(...list.map(([a, b]) => T.tw(a, F.num(ns)) + gp + T.tw(b, F.caps(ls)))), html: (x, y) => [...Array(rows - (top ? 0 : 1))].map((_, r) => hair(x, y + (r + (top ? 0 : 1))*rh - .5, w)).join('') + list.map(([a, b], i) => `<div class="lps-row" data-slot="facts.${i}" data-lines="1" style="left:${x + (i % cols)*(cw + g)}pt;top:${y + Math.floor(i/cols)*rh}pt;width:${cw}pt;height:${rh}pt;font:600 ${ns}pt/${rh}pt ${FR};color:${INK}"><span>${esc(a)}</span><span data-small="1" style="${F.caps(ls)};color:${MAIN};margin-left:${gp}pt">${esc(b)}</span></div>`).join('')}; }
    return null; };
  const factText = (T, D, w, k) => { const six = OHL.factSix(D.listing).filter(([ic]) => ic !== 'stories').map(([ic, t]) => ic === 'bed' ? t.replace('bedroom', 'bed') : ic === 'area' ? t.replace(' square feet', ' sq ft') : ic === 'cal' ? t.replace('Built in', 'Built') : t);
    const face = z => `font:600 ${z}pt ${OU}`, J = l => l.join('  ·  ');
    // whole facts to a line (a dot only between two facts on one line), two lines before three, the shortest line as long as it can be
    const cutsOf = n => { const out = []; for(let a = 1; a < n; a++){ out.push([a]); for(let c = a + 1; c < n; c++) out.push([a, c]); } return out.sort((p, q) => p.length - q.length); };
    for(const n of [Math.min(six.length, 4)]){ const list = six.slice(0, n);
      for(let z = r2(T.FB*1.4); z >= T.FB - .01; z -= .5){ let best = null;
        for(const ct of cutsOf(n)){ const ls = [0].concat(ct).map((a, q, arr) => list.slice(a, q + 1 < arr.length ? arr[q + 1] : n)), ws = ls.map(l => T.tw(J(l), face(z))); if(Math.max(...ws) > w) continue;
          const sc = -ls.length*1000 + Math.min(...ws); if(!best || sc > best.sc) best = {ls, sc, wide: Math.max(...ws), lo: Math.min(...ws)}; }
        if(!best || (best.ls.length > 2 && z > T.FB + .01)) continue; const m = best.ls.length;
        return {h: m*z*1.36 + z*.15, n, wide: best.wide, lo: best.lo, html: (x, y) => txt('facts', '', x, y, w, z, 1.36, face, MAIN, {n: m, html: best.ls.map(l => esc(J(l))).join('<br>'), css: 'white-space:nowrap'})}; } }
    return null; };
  // the highlights on round accent marks (the postcard front's list); cols 2: two columns across a wide measure
  const tagList = D => { if(!(window.FXS && FXS.tagFacts)) return []; let t = [];
    try { t = FXS.tagFacts(D).tags || []; } catch(e){ t = []; }
    t = t.filter(x => x && !SocialSet.CONDITION.test(x)).filter((x, i, a) => !a.slice(0, i).some(u => window.SW && SW.sameFact ? SW.sameFact(x, u) : x === u));
    const rank = x => /\b(19|20)\d\d\b/.test(x) ? 0 : /^new\b|replaced|updated|remodel|renovat|added\b/i.test(x) ? 1 : 2;
    return t.map((x, i) => [rank(x), i, x]).sort((p, q) => p[0] - q[0] || p[1] - q[1]).map(x => x[2]); };
  const bullets = (T, list, w, k, rows, cols) => { cols = cols || 1; if(rows < 1) return null;
    const g = r2(12*T.f), fs0 = r2(Math.max(T.FB, T.FB*1.06*Math.min(k, 1.35)));
    for(let fs = fs0; fs >= T.FB - .01; fs -= .5){ const dot = Math.max(5, fs*.46), gp = fs*.6, iw = t => T.tw(t, F.body(fs)) + dot + gp + 1;
      const fit = list.filter(t => iw(t) <= (cols > 1 ? w*.6 : w - 1)).slice(0, rows*cols); if(fit.length < rows*cols){ if(fs > T.FB + .01) continue; if(cols > 1 || fit.length < 2) return null; }
      const cws = [...Array(cols)].map((_, j) => Math.max(0, ...fit.filter((_, i) => i % cols === j).map(iw))), sum = cws.reduce((p, q) => p + q, 0);
      if(sum + (cols - 1)*g > w){ if(fs > T.FB + .01) continue; return null; }
      const gap = cols > 1 ? (w - sum)/(cols - 1) : 0, xs = cws.map((_, j) => cws.slice(0, j).reduce((p, q) => p + q + gap, 0));
      const rh = fs*1.62, nr = Math.ceil(fit.length/cols);
      return {h: nr*rh, n: fit.length, gap, html: (x, y) => (gap > 44*T.f ? cws.slice(0, -1).map((_, j) => vhair(x + xs[j] + cws[j] + gap/2, y + rh*.18, nr*rh - rh*.36)).join('') : '') + fit.map((t, i) => `<div class="lps-bul" style="left:${x + xs[i % cols]}pt;top:${y + Math.floor(i/cols)*rh}pt;width:${cols > 1 ? cws[i % cols] + 1 : w}pt;height:${rh}pt"><i style="width:${dot}pt;height:${dot}pt;margin-right:${gp}pt"></i><span data-slot="hl.${i}" data-lines="1" style="${F.body(fs)};line-height:${rh}pt;color:${INK}">${esc(t)}</span></div>`).join('')}; }
    return null; };

  // ---------- Just Sold: the question and the agent's own note ----------
  // the seller question: the eyebrow in tracked accent caps on one line; where the line cannot hold it, in Fraunces (the Just Sold back)
  const ask = (T, w, k) => { const s0 = r2(Math.max(T.FB, T.FB*1.02*Math.min(k, 1.3)));
    for(const tr of [.24, .17, .11]){ const s = T.one(Q, F.eye(tr), w, s0, T.FB); if(s) return {h: s*1.3, wide: T.tw(Q, F.eye(tr)(s)), html: (x, y) => txt('sold.q', Q, x, y, w, s, 1.3, F.eye(tr), ACC)}; }
    return ask2(T, w, s0*2.7) || askF(T, w, k); };
  // on two lines in the same caps, as large as the measure and the height hh hold
  const ask2 = (T, w, hh) => { for(const tr of [.2, .13, .08]){ const s = Math.min(T.one('Thinking about', F.eye(tr), w, 999, T.FB) || 0, hh/2.7); if(s < T.FB) continue;
      const w1 = T.tw('Thinking about', F.eye(tr)(s)); let tr2 = tr; for(let q = tr; q <= tr + .16 && T.tw('selling?', F.eye(q)(s)) <= w1 + s*q; q += .01) tr2 = q;
      return {h: s*2.7, wide: w1, html: (x, y) => txt('sold.q', 'Thinking about', x, y, w, s, 1.35, F.eye(tr), ACC) + txt('sold.q2', 'selling?', x, y + s*1.35, w, s, 1.35, F.eye(tr2), ACC)}; }
    return null; };
  // a measure too narrow for the caps: Fraunces in the accent (the Just Sold back sets the question in Fraunces)
  const askF = (T, w, k) => { const s1 = T.one(Q, F.q, w, T.FB*1.4*k, T.FB); if(s1) return {h: s1*1.25, html: (x, y) => txt('sold.q', Q, x, y, w, s1, 1.25, F.q, ACC)};
    const s2 = T.one('Thinking about', F.q, w, T.FB*1.4*k, T.FB); if(!s2) return null;
    return {h: s2*2.4, html: (x, y) => txt('sold.q', 'Thinking about', x, y, w, s2, 1.2, F.q, ACC) + txt('sold.q2', 'selling?', x, y + s2*1.2, w, s2, 1.2, F.q, ACC)}; };
  const askFill = (T, w, hh, k) => { const one = ask(T, w, k); if(one && hh < one.h*1.9) return one;
    for(const tr of [.24, .17]){ const s = Math.min(T.one(Q, F.eye(tr), w, 999, T.FB) || 0, hh/1.3, T.FB*2); if(s >= T.FB*1.1 && T.tw(Q, F.eye(tr)(s)) >= .8*w) return {h: s*1.3, wide: T.tw(Q, F.eye(tr)(s)), html: (x, y) => txt('sold.q', Q, x, y, w, s, 1.3, F.eye(tr), ACC)}; }
    return ask2(T, w, hh) || one; };
  const askHead = (T, w, k) => { for(const tr of [.28, .24, .17, .11]){ const s = T.one(Q, F.eye(tr), w, T.FB*1.25*Math.min(Math.max(k, 1), 1.4), T.FB); if(s) return {h: s*1.3, html: (x, y) => txt('sold.q', Q, x, y, w, s, 1.3, F.eye(tr), ACC)}; } return ask(T, w, k); };
  // the note's wordings: the writer's sentences in order from the first, each in its short or long form
  const notePool = D => { if(D._lpNotes) return D._lpNotes;
    const N = (((((D.sw || {}).pc || {}).js || {}).front || {}).note || {}), S = [].concat(N.s || []).map(x => [].concat(x).map(String).filter(t => !SocialSet.CONDITION.test(t))).filter(a => a.length);
    const out = [], sh = a => a[0], lg = a => a[a.length - 1], n = Math.min(S.length, 6);
    for(let mask = 3; mask < (1 << n); mask += 2){ const run = S.filter((_, i) => i < n && (mask & (1 << i))); out.push(run.map(sh).join(' '), run.map(lg).join(' ')); if(run.length > 1) out.push(run.map((a, i) => i === 0 ? lg(a) : sh(a)).join(' ')); }
    out.push(SocialSet.SOLD_POST);
    return (D._lpNotes = out.filter((t, i, a) => a.indexOf(t) === i)); };
  // the fullest wording that sets in maxN lines or fewer at width w: every line 80%+ and the last 90%+ of the measure (owner 11/8),
  // the measure narrowed a little or the type raised up to 12% to get there
  const pickNote = (T, D, w, s0, maxN, grow) => { const list = notePool(D); let best = null; T.pn = T.pn || {}; const key = [Math.round(w*2), s0, maxN, grow ? 1 : 0].join('|'); if(key in T.pn) return T.pn[key];
    for(const m of (grow ? [1, .96, .92] : [1, .94, .88, .82])) for(const s of [s0, r2(s0*1.06), r2(s0*1.12)].concat(grow ? [r2(s0*1.2), r2(s0*1.3), r2(s0*1.4)] : [])) for(const t of list){ const ww = w*m, r = T.rows(t, F.body(s), ww, s*1.42); if(r.n > maxN) continue;
      if(r.n === 1 ? r.wide < .9*ww : (r.last < .9*ww || r.ws.slice(0, -1).some(x => x < .8*ww))) continue;
      const sc = r.n*100 + m*30 - (s - s0)*3 + t.length*.05 - (t === SocialSet.SOLD_POST ? 60 : 0); if(!best || sc > best.sc) best = {t, n: r.n, s, w: ww, sc, just: r.n > 1 && r.ws.slice(0, -1).every(x => x >= .93*ww)}; }
    if(!best) return (T.pn[key] = null);
    T.pn[key] = best; best.h = best.n*best.s*1.42 + best.s*.15;
    best.html = (x, y) => txt('sold.note', best.t, x, y, best.w, best.s, 1.42, F.body, TEXT, {n: best.n, css: ''});
    return best; };

  // ---------- the agent: the name in Fraunces over the number in the main color, REALTOR(R), the headshot, the one logo ----------
  // tone 'paper' (the postcard fronts) or 'band' (reversed on the block of the main color, the postcard backs).
  // mode 'row': the headshot, the lines, the logo at the right end; 'stack': the headshot and the lines, the logo centered under them.
  // The headshot (where the agent shows one) and REALTOR(R) are on every image; an arrangement that cannot hold them is not used.
  const agent = (D, T, w, k, tone, mode) => {
    const A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), onB = tone === 'band', gap = r2(9*T.f);
    const cN = onB ? ONB : INK, cP = onB ? ONB : MAIN, cT = onB ? ONB : TEXT, kk = Math.max(.75, Math.min(k, 1.35));
    const logo = (x, y, lw, lh, c) => `<div class="abs lps-logo${c ? ' c' : ''}" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${cN}">${OHL.logo(D, onB ? 'dark' : 'light', '')}</div>`;
    // the lines in a measure cw: the name, the number, REALTOR(R) beside the number, else beside the name, else on its own line
    const lines = cw => { const ps = T.one(A.phone || '', F.phone, cw, T.FB*1.18*kk, T.FB), ns = T.one(A.name || '', F.name, cw, T.FB*1.5*kk, T.FB*1.1), ds = r2(Math.max(T.FS, T.FS*Math.min(kk, 1.15))); if(!ps || !ns) return null;
      const nW = T.tw(A.name || '', F.name(ns)), pW = T.tw(A.phone || '', F.phone(ps)), dW = nar ? T.tw('REALTOR®', F.caps(ds)) : 0; if(dW > cw) return null;
      const at = !nar ? '' : pW + ps*.7 + dW <= cw ? 'phone' : nW + ns*.5 + dW <= cw ? 'name' : 'own';
      const th = ns*1.2 + (at === 'own' ? ds*1.35 : 0) + ps*1.3, wide = Math.max(nW + (at === 'name' ? ns*.5 + dW : 0), pW + (at === 'phone' ? ps*.7 + dW : 0), at === 'own' ? dW : 0);
      return {th, wide, ns, html: (x, y) => { const py = y + ns*1.2 + (at === 'own' ? ds*1.35 : 0);
        return txt('agent.name', A.name || '', x, y, nW + 2, ns, 1.2, F.name, cN) + txt('agent.phone', A.phone || '', x, py, pW + 2, ps, 1.3, F.phone, cP)
          + (at === 'phone' ? txt('agent.desig', 'REALTOR®', x + pW + ps*.7, py + ps*1.3*.79 - ds*1.3*.79, dW + 2, ds, 1.3, F.caps, cT, {small: 1})
            : at === 'name' ? txt('agent.desig', 'REALTOR®', x + nW + ns*.5, y + ns*1.2*.79 - ds*1.3*.79, dW + 2, ds, 1.3, F.caps, cT, {small: 1})
            : at === 'own' ? txt('agent.desig', 'REALTOR®', x, y + ns*1.2, dW + 2, ds, 1.3, F.caps, cT, {small: 1}) : ''); }}; };
    const hs = (x, y, hw, hh) => `<div class="abs lps-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt;border-radius:${r2(4*T.f)}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    let hsW0 = hsOn ? Math.round((T.FB*1.5*kk*1.2 + T.FB*1.18*kk*1.3)*.84) : 0, tx = hsOn ? hsW0 + gap : 0;
    if(hsOn && mode !== 'row' && !lines(w - tx)){ hsW0 = Math.round(hsW0*.8); tx = hsW0 + gap; }
    if(mode === 'row'){ const lmin = Math.max(34*T.f, w*.22), L = lines(w - tx - lmin - gap*1.5); if(!L) return null;
      const th = Math.max(L.th, hsOn ? hsW0*1.1 : 0), lw = Math.min(w - tx - L.wide - gap*1.5, th*4.4), lh = Math.min(th, Math.max(L.th*.92, lw/3.4));
      return {h: th, lw, html: (x, y) => (hsOn ? hs(x, y, hsW0, th) : '') + L.html(x + tx, y + (th - L.th)/2) + logo(x + w - lw, y + (th - lh)/2, lw, lh)}; }
    const L = lines(w - tx); if(!L) return null;
    const th = Math.max(L.th, hsOn ? hsW0*1.1 : 0), lh = r2(Math.max(L.ns*1.35, T.FB*1.55)), gl = r2(6*T.f), tot = tx + L.wide, x0 = (w - tot)/2, mid = x0 + tx + L.wide/2, lw = Math.min(w, lh*3.6, 2*Math.min(mid, w - mid));
    return {h: th + gl + lh, html: (x, y) => (hsOn ? hs(x + x0, y, hsW0, th) : '') + L.html(x + x0 + tx, y + (th - L.th)/2) + logo(x + mid - lw/2, y + th + gl, lw, lh, 1)};
  };

  // a column of blocks set from the top, the room left over opened evenly between them (never more than `open` at each)
  const flow = (blocks, x, y, room, open) => { blocks = blocks.filter(b => b && b[0]);
    const tot = blocks.reduce((s, [b, g]) => s + b.h + g, 0), e = Math.max(0, Math.min(open == null ? 1e9 : open, (room - tot)/(blocks.length + 1))); let yy = y + (room - tot - e*(blocks.length - 1))/2, h = '';
    blocks.forEach(([b, g], i) => { yy += g + (i ? e : 0); h += b.html(x, yy); yy += b.h; }); return h; };
  const total = blocks => blocks.filter(b => b && b[0]).reduce((s, [b, g]) => s + b.h + g, 0);
  // Just Listed: the writer's lines (the house's story and what is nearby): the sentences in order, the first always kept, that fill
  // maxN lines or fewer at width w, every line 80%+ and the last 90%+ of the measure (owner 11/8)
  const writeUp = (T, D, w, s0, maxN) => { T.wu = T.wu || {}; const key = [Math.round(w), s0, maxN].join('|'); if(key in T.wu) return T.wu[key];
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing)).slice(0, 7), near = /\bmiles?\b/i; let best = null;
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of [1, .96, .92]) for(const s of [s0, r2(s0*1.06), r2(s0*1.12)]){ const r = T.rows(t, F.body(s), w*m, s*1.42); if(r.n > maxN || r.n < 2) continue;
        if(r.last < .9*w*m || r.ws.slice(0, -1).some(x => x < .8*w*m)) continue;
        const sc = r.n*100 + (near.test(t) ? 80 : 0) + m*20 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, pk, n: r.n, s, w: w*m, sc, just: r.ws.slice(0, -1).every(x => x >= .93*w*m)}; } }
    if(best){ best.h = best.n*best.s*1.42 + best.s*.15;
      best.html = (x, y, W0) => txt('writeup', best.t, x + (W0 - best.w)/2, y, best.w, best.s, 1.42, F.body, TEXT, {n: best.n}); }
    return (T.wu[key] = best); };

  const LP = {};
  // ================= post, pin, story, square =================
  // Just Listed: the house as a print across the head, bleeding off the top and both sides, its foot on one sweep over the shadow;
  // on the paper the city line as the eyebrow over "Just / Listed", a column hairline, the street and the facts beside them (the
  // postcard back's headline | text pair), the writer's lines, the highlights on their round marks, and the block of the main color
  // along the foot with the agent. Just Sold: the snapshot tilted on the paper; "Just / Sold" with the street, the city line and the
  // question beside it; the agent's note; the same foot. A story's foot is a strip of room prints (no words in the top and bottom 250 px).
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', story = shape === 'story', b = sold ? 'Sold' : 'Listed';
    const pad = r2(17*f), g = r2(8*f), gv = r2(11*f), w = W - 2*pad, m = r2(15*f), BOT = story ? H - Math.max(96, r2(100*f)) : H, tags = sold ? [] : tagList(D), P = sold ? [] : parts(D);
    const pwJS = W - 2*m, same = (a, c) => window.SW && SW.sameFact ? SW.sameFact(a, c) : false;
    const build = (k, o) => {
      const ag = agent(D, T, w, k, 'band', 'row'); if(!ag) return null;
      const bp = r2(10*f*Math.min(Math.max(k, .8), 1.25)), bandH = ag.h + 2*bp;
      const wb = wordBlock(T, b, w*(o.wk || .5), FE*3.5*k, FE*1.5); if(!wb) return null;
      const cw = w - wb.w - 2*gv, st0 = street(T, Li, cw, sold ? Math.min(wb.ss*.8, FE*3) : Math.min(wb.ss*.62, FE*1.6*Math.min(k, 1.5))); if(!st0) return null;
      let col, eb = none, bul = null, note = null, wu = null, st = st0, qh = null;
      if(!sold){
        st = withPlace(T, st0, Li, cw, k, ACC); if(!st) return null;
        let fr = null, fb = null; const nMin = Math.min(P.length, 4), lim = wb.h*(o.lf || 1.08) - st.h - g*.7;
        for(const kr of [2, 1.7, 1.45, 1.2, 1, .8, .6]){ if((kr > k*1.25 && kr > 1) || T.FB*1.5*kr > wb.ss*.62) continue;
          for(const cols of [1, 2]) for(let n = Math.min(P.length, cols > 1 ? 6 : 5); n >= nMin && !fr; n--){ if(cols > 1 && n % 2) continue; const c = factRows(T, P.slice(0, n), cw, kr, cols); if(!c || c.h > lim) continue;
            if(cols > 1 || c.wide >= cw*.55) fr = c; else { fb = fb || c; break; } }
          if(fr) break; }
        fr = fr || fb; if(!fr) return null;
        col = [[st, 0], [fr, g*.7]];
        if(o.wl){ wu = writeUp(T, D, w, r2(Math.max(FB, FB*1.03*Math.min(k, 1.3))), o.wl); if(!wu) return null; }
        if(o.bul){ const tg = wu ? tags.filter(t => !wu.pk.some(x => same(t, x))) : tags, b3 = bullets(T, tg, w, k, o.bul, 3), b2 = bullets(T, tg, w, k, o.bul, 2); bul = b3 && (!b2 || b3.gap <= b2.gap) ? b3 : b2; if(!bul) return null; }
      } else {
        st = withPlace(T, st0, Li, cw, Math.max(k, st0.s/FE), MAIN, st0.w); if(!st) return null;
        const kn = Math.min(k, 1.5); qh = askHead(T, w, kn); if(!qh) return null;
        note = pickNote(T, D, w, r2(Math.max(FB*(story || shape === 'pin' ? 1.3 : 1), FB*1.02*kn)), o.nl); if(!note || (note.n < 2 && o.nl > 1)) return null;
        col = [[st, 0]];
      }
      const colH = total(col), leftH = (eb.h ? eb.h + g*.9 : 0) + wb.h, pairH = Math.max(leftH, colH);
      const textH = g*1.5 + pairH + (wu ? g*1.3 + wu.h : 0) + (bul ? g*1.2 + bul.h : 0) + (note ? g*1.4 + qh.h + g*.7 + note.h : 0) + g*1.5;
      return {ag, bp, bandH, wb, cw, col, colH, leftH, pairH, eb, bul, wu, note, qh, textH, stn: st0.n, slack: Math.max(0, cw - Math.max(st.w || 0, ...col.slice(1).map(c => (c[0] && c[0].wide) || cw))), room: BOT - textH - bandH - (sold ? m + g*.4 : 0)};
    };
    const pw = sold ? pwJS : W;
    const opts = sold ? [4, 3, 2, 1].map(nl => ({nl})) : shape === 'square' ? [{wl: 2, bul: 0}, {wl: 0, bul: 1}, {wl: 0, bul: 0}] : shape === 'post' ? [{wl: 3, bul: 1}, {wl: 3, bul: 0}, {wl: 2, bul: 1}, {wl: 2, bul: 0}] : [{wl: 3, bul: 2}, {wl: 3, bul: 1}, {wl: 2, bul: 1}, {wl: 3, bul: 0}, {wl: 2, bul: 0}];
    const KMAX = 2.4, KMIN = .7, need = Math.min(X.nat(pw), X.min(pw) + (story ? 1 : .6)*(X.nat(pw) - X.min(pw)));
    const capH = Math.ceil(X.nat(pw)*1.05);   // the house photo whole, as the Before showed it: never cropped in from the sides
    let pick = null;
    for(const o0 of opts) for(const lf of (sold ? [1] : [1.08, 1.4])) for(const wk of (sold ? [.56, .5, .44, .38] : [.62, .56, .5, .44, .38])){ const o = Object.assign({wk, lf}, o0);
      for(let k = KMAX; k >= KMIN - .001; k -= .1){ const B = build(k, o); if(!B || B.room < (k < KMIN + .05 ? X.min(pw) : need)) continue;
        const sc = Math.min(k, 1.5)*.6 + (o.bul || 0)*.25 + (o.wl || 0)*.35 + (o.nl || 0)*.3 + B.wb.ss/FE*.45 - Math.abs(B.colH - B.leftH)/B.pairH*(sold ? 3 : .5) - (B.stn > 1 ? .3 : 0) - B.slack/w*2 - Math.max(0, B.room - capH)/H*8;
        if(!pick || sc > pick.sc) pick = {o, k, sc}; break; } }
    // nothing leaves the house its room at these sizes: the smallest type, the fewest lines, and the print takes what is left
    if(!pick) for(const o of (sold ? [{nl: 2, wk: .44}, {nl: 2, wk: .36}, {nl: 1, wk: .36}] : [{wl: 0, bul: 0, wk: .5, lf: 1.4}, {wl: 0, bul: 0, wk: .44, lf: 1.8}, {wl: 0, bul: 0, wk: .36, lf: 2.2}])){ const B = build(KMIN, o); if(B){ pick = {o, k: KMIN}; break; } }
    if(!pick){ T.done(); return CSS; }
    const B = build(pick.k, pick.o);
    // the print: as tall as the room allows while the house stands whole; a room too short for it narrows the print instead
    let room = B.room, pwF = pw, ph;
    if(room < X.min(pw)){ pwF = Math.floor(pw*room/X.min(pw)); ph = sold ? X.tallest(pwF, room) || room : room; }
    else ph = sold ? X.tallest(pw, Math.min(room, capH)) || Math.min(room, X.nat(pw)) : Math.min(room, capH);
    const spare = Math.max(0, room - ph), e = spare/5;
    let h = CSS, y;
    const sideW = pw - pwF - r2(5*f), side = sideW >= 44*f ? X.side() : null;
    if(!sold){ h += (side ? X.swept(side, 0, 0, sideW, ph, 'foot', 0) : '') + X.swept(X.id, W - pwF, 0, pwF, ph, 'foot', Math.min(.13, 30*f/ph)); y = ph; }
    else { h += (side ? X.snap(side, m + pwF + r2(5*f), m + e*.5, sideW, ph) : '') + X.tilt(side ? m : m + (pw - pwF)/2, m + e*.5, pwF, ph); y = m + e + ph + g*.4; }
    y += g*1.5 + e;
    { const ly = y + (B.pairH - B.leftH)/2; if(B.eb.h) h += B.eb.html(pad, ly); h += B.wb.html(pad, ly + B.leftH - B.wb.h); }
    h += vhair(pad + B.wb.w + gv, y + 2, B.pairH - 4) + flow(B.col, pad + B.wb.w + 2*gv, y, B.pairH, g);
    y += B.pairH;
    if(B.wu){ y += g*1.3 + e; h += B.wu.html(pad, y, w); y += B.wu.h; }
    if(B.bul){ y += g*1.2 + e; h += B.bul.html(pad, y); y += B.bul.h; }
    if(B.note){ y += g*1.4 + e; h += B.qh.html(pad, y); y += B.qh.h + g*.7; h += B.note.html(pad, y); y += B.note.h; }
    const by = BOT - B.bandH;
    h += rect(0, by, W, B.bandH + (story ? 0 : 1), `background:${BAND}`) + B.ag.html(pad, by + B.bp);
    if(story) h += X.strip(0, BOT + r2(4*f), W, H - BOT - r2(4*f), 2);
    T.done();
    return h;
  };

  // ================= wide (X) and Google Business Profile =================
  // Just Listed: the print at the right, bleeding off the top and the right edge, its left edge sweeping out toward the top over the
  // shadow; under it, as its caption, the street and the city line. On the paper beside it the word in its two tones (stacked where
  // the column holds it with everything else, on one line where it does not), a hairline, the facts one to a row with hairlines
  // between them, a hairline, the agent with the logo under. Just Sold: the snapshot tilted at the left with the same caption;
  // beside it the word, the question in accent caps, the agent's note, a hairline, the agent.
  const card = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', b = sold ? 'Sold' : 'Listed';
    const pad = r2(Math.min(17*f, W*(shape === 'wide' ? .035 : .045))), pv = r2(Math.min(15*f, H*(shape === 'wide' ? .026 : .04))), g = r2(Math.min(8*f, H*.03)), gC = r2(Math.min(15*f, W*.035)), P = sold ? [] : parts(D);
    const agB = sold && shape === 'wide' ? agent(D, T, W - 2*pad, .76, 'band', 'row') : null, bp = r2(7*f*.5), bandH = agB ? agB.h + 2*bp : 0;
    const room = H - bandH - 2*pv, hole = .0295*W*H, rule = cw => ({h: 1, html: (x, y) => hair(x, y, cw)});
    const search = strict => { let pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
      for(let fr = .64; fr >= (sold ? .455 + pad/W : strict ? .5 : .46); fr -= (shape === 'wide' ? .01 : .02)){
        const PX = Math.round(W*(1 - fr)), fw = W - PX, PW = Math.round(W*fr) - pad, cx = sold ? pad + PW + gC*1.3 : pad, cw = sold ? W - pad - cx : PX - pad - gC; if(cw < 70*f) continue;
        const uw = sold ? PW + gC*.7 : fw - gC*.5 - pad, pw = sold ? PW : fw;   // the caption's width; the print's width
        // the caption's street large where the print keeps its height, at the reading floor where the house needs the room
        let stU = null, capFix = 0, PH = 0;
        for(const sm of [1.35, 1]){ stU = withPlace(T, street(T, Li, uw, FE*sm), Li, uw, 1, sold ? MAIN : ACC); if(!stU) break;
          capFix = g*(agB ? 1.1 : 1.5) + stU.h + (sold ? 0 : pv*.9);
          PH = X.tallest(pw, Math.min((sold ? room : H) - capFix, pw/1.04)); if(PH) break; }   // never a slice: no taller than its width
        if(!stU || !PH) continue;
        const slackU = (sold ? room : H) - PH - capFix, lift = sold ? 0 : X.lift(fw, PH, 'left', .15), area = pw*PH/(W*H);
        const c0 = Math.min(6, H*(sold ? .27 : .2)/FE);
        for(const cap of (sold ? [6, c0, c0*.84, c0*.7, c0*.56, 0] : [c0, c0*.84, c0*.7, c0*.56, 0])){
          const wb = cap ? wordBlock(T, b, cw, FE*cap, FE*1.5) : wordLine(T, b, cw, FE*2.6, FE); if(!wb || (cap && cap < (sold ? 6 : c0) && wb.ss < FE*cap - .6)) continue;
          const jw = cap ? T.tw('Just', F.word(wb.ss)) : wb.w;
          const pen = (cap ? 0 : 70) + ((cw + gC + 6*f - jw)*wb.ss*1.12 > hole || (cw + gC + 6*f - wb.w)*(wb.h + 12*f) > hole ? 200 : 0) + Math.max(0, cw - wb.w - 10*f)*3;
          for(const k of [1.35, 1.15, 1, .8]) for(const am of ['stack', 'row']) for(const ru of [1, 0]){
            if(agB && (am !== 'stack' || ru)) continue;
            const ag = agB ? none : agent(D, T, cw, k, 'paper', am); if(!ag) continue;
            const foot = agB ? [] : ru ? [[rule(cw), g*1.1], [ag, g*1.1]] : [[ag, g*1.05]];
            let best = null;
            if(!sold){
              for(let n = Math.min(P.length, 5); n >= Math.min(P.length, 4) && !best; n--) for(const kr of [1.3, 1.1, .9, .67]){ if(T.FB*1.5*kr > wb.ss*.7) continue;
                const fc = factRows(T, P.slice(0, n), cw, kr, 1, false); if(!fc) continue;
                const blocks = [[wb, 0], [rule(cw), g*1.2], [fc, g*.6]].concat(foot), tot = total(blocks); if(tot > room) continue;
                best = {blocks, tot, sc: 40 + n*30 + kr*20 - Math.min(45, Math.max(0, cw - fc.wide - 16*f))}; break; }
              // the column cannot hold four rows: the same facts as lines of words
              if(!best){ const ft = factText(T, D, cw, k); if(ft){ const blocks = [[wb, 0], [rule(cw), g*1.2], [ft, g*1.1]].concat(foot), tot = total(blocks); if(tot <= room) best = {blocks, tot, sc: ft.n*30 - Math.min(60, Math.max(0, cw - ft.lo - 30*f)*.6)}; } }
            } else {
              for(const q of [ask(T, cw, k), askF(T, cw, k)]){ if(!q) continue;
                for(let nl = 7; nl >= 1; nl--){ const nt = pickNote(T, D, cw, r2(Math.max(FB, FB*1.02*Math.min(k, 1.15))), nl, true) || pickNote(T, D, cw, r2(Math.max(FB, FB*1.02*Math.min(k, 1.15))), nl); if(!nt || (strict && nt.n < 2)) break;
                  const blocks = [[wb, 0], [q, g*1.05], [nt, g*.6]].concat(foot), tot = total(blocks); if(tot > room) continue;
                  const sc = Math.min(nt.n, 5)*16 + Math.min(nt.t.length, 220)*.1 - (nt.t === SocialSet.SOLD_POST ? 30 : 0); if(!best || sc > best.sc) best = {blocks, tot, sc}; break; } }
            }
            if(!best) continue;
            const left = room - best.tot;
            take({k, stU, uw, wb, blocks: best.blocks, left, PX, fw, PW, PH, cx, cw, slackU,
              sc: best.sc + k*25 + wb.ss/FE*14 + area*420 + lift*200 - left*3 - slackU*3 - pen - (am === 'row' ? (!sold && ag.lw < 58*f ? 60 : 0) : 8) - (ru ? 0 : 5)});
          }
        }
      }
      return pick; };
    const pick = search(true) || search(false);
    if(!pick){ T.done(); return null; }
    let h = CSS;
    if(!sold){
      const y0 = pick.PH + g*1.5 + Math.max(0, pick.slackU)*.45;
      h += X.swept(X.id, pick.PX, 0, pick.fw, pick.PH, 'left', .15) + pick.stU.html(pick.PX + gC*.5, y0) + flow(pick.blocks, pick.cx, pv, room, g*.9);
    } else {
      if(agB) h += rect(0, H - bandH, W, bandH + 1, `background:${BAND}`) + agB.html(pad, H - bandH + bp);
      const cg = g*(agB ? 1.1 : 1.5), tot = pick.PH + cg + pick.stU.h, y0 = pv + (room - tot)/2;
      h += X.tilt(pad, y0, pick.PW, pick.PH) + pick.stU.html(pad, y0 + pick.PH + cg) + flow(pick.blocks, pick.cx, pv, room, g*.9);
    }
    T.done();
    return h;
  };
  LP.portrait = (D, L, W, H, shape) => tall(D, L, W, H, shape);
  LP.landscape = (D, L, W, H, shape) => card(D, L, W, H, shape) || tall(D, L, W, H, shape);

  // ================= carousel photo slides: the room as a lifted print, its foot on the sweep over the shadow; on the paper under
  // it the eyebrow, "Just Listed" / "Just Sold" in the two tones on one line, a hairline and the street =================
  LP.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), {f, FE} = T, X = heroKit(D, f), pad = r2(17*f), g = r2(8*f), gv = r2(11*f), w = W - 2*pad, sold = D.piece.moment === 'js', Li = D.listing;
    let wl = null, st = null;
    for(let z = FE*2.4; z >= FE - .01 && !st; z -= 1){ wl = wordLine(T, sold ? 'Sold' : 'Listed', w*.56, z, FE); if(!wl) break; const cw = w - wl.w - 2*gv, s0 = street(T, Li, cw, Math.max(FE, wl.ss*.7)); st = s0 && s0.n === 1 ? withPlace(T, s0, Li, cw, 1, ACC) : null; }
    let foot, draw;
    if(wl && st){ const rowH = Math.max(wl.h, st.h); foot = g*1.8 + rowH + g*1.9;
      draw = y => wl.html(pad, y + (rowH - wl.h)/2) + vhair(pad + wl.w + gv, y, rowH) + st.html(pad + wl.w + 2*gv, y + (rowH - st.h)/2); }
    else { wl = wordLine(T, sold ? 'Sold' : 'Listed', w, FE*2, FE); st = withPlace(T, street(T, Li, w, FE*1.3), Li, w, 1, ACC) || none; foot = g*1.8 + wl.h + g + st.h + g*1.6;
      draw = y => wl.html(pad, y) + st.html(pad, y + wl.h + g); }
    const ph = H - foot, h = CSS + X.swept(D.piece.photo, 0, 0, W, ph, 'foot', Math.min(.1, 28*f/ph)) + draw(ph + g*1.8);
    T.done();
    return h;
  };
  window.LPSocial = LP;
})();
