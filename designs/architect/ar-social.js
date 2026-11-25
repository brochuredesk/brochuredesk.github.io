/* templates/architect/ar-social.js: Architect's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on piece
   matches its set's main pieces). Plugs into templates/_shared/socialset.js (data, the checks) and replaces its three layouts for this
   set only; nothing shared changes.

   Read off the approved Architect pieces (postcard.html, flyer.html, foldover.html, ar-tokens.css, ar-marks.css, ar-fo.js):
     - the drafting sheet: the brand dark lifted toward stone as the field, white type
     - JUST LISTED / JUST SOLD in very large Libre Baskerville bold capitals set tight: across the whole image on the upright shapes
       (the Just Sold card), stacked in the title column of the wide ones (the Just Listed card)
     - the street in Baskerville regular and the place (with its ZIP code) in small wide-tracked Instrument Sans caps standing on
       one drafting rule
     - every photo inset inside its four corner ticks, the house at the photo's own shape
     - Just Listed: beds, baths, square feet and the year built in tracked accent caps on a dimension line (a rule with an upright
       and a slash at each end) under the house, or between two rules in the title column (the flyer's facts bar); the lot and the
       highlights on hollow squares with hairlines between them; the writer's lines under them
     - Just Sold: "Thinking about selling?" in Baskerville regular over the seller note (always a note), a hairline, then the agent
     - the agent: the headshot, the name in Baskerville regular, REALTOR(R), the phone in tracked accent figures, the one logo
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house in every frame (the engine's
   house-cut check), no condition claims, text at the phone floors of templates/_shared/readsize.js. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const LB = "'Libre Baskerville'", IS = "'Instrument Sans'";
  const ON = 'var(--ars-on)', ACC = 'var(--ars-acc)', SOFT = 'var(--ars-soft)', RULE = 'var(--ars-rule)', HAIR = 'var(--ars-hair)';
  const Q = 'Thinking about selling?';
  const F = {
    word: s => `font:700 ${s}pt ${LB};letter-spacing:${(-s*.02).toFixed(2)}pt;text-transform:uppercase`,
    street: s => `font:400 ${s}pt ${LB}`,
    place: (s, tr) => `font:500 ${s}pt ${IS};text-transform:uppercase;letter-spacing:${(s*(tr || .24)).toFixed(2)}pt`,
    fact: (s, tr) => `font:600 ${s}pt ${IS};text-transform:uppercase;letter-spacing:${(s*tr).toFixed(2)}pt`,
    bul: s => `font:500 ${s}pt ${IS}`,
    q: s => `font:400 ${s}pt ${LB}`,
    note: s => `font:400 ${s}pt ${IS}`,
    name: s => `font:400 ${s}pt ${LB}`,
    phone: (s, tr) => `font:600 ${s}pt ${IS};letter-spacing:${(s*(tr == null ? .1 : tr)).toFixed(2)}pt`,
    tag: s => `font:600 ${s}pt ${IS};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`,
  };
  const CSS = `<style>
    .ss .ars-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:flex-end}
    .ss .ars-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .ars-logo.c .logo{justify-content:center}
    .ss .ars-logo .text{font:600 12pt/1.15 ${IS};text-align:right;color:inherit}
    .ss .ars-hs{position:absolute;overflow:hidden}.ss .ars-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .ars-caps{position:absolute;white-space:nowrap}
    .ss .ars-tk{position:absolute;border:0 solid ${ON};box-sizing:border-box;pointer-events:none}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, W: D.piece.px[0]*K, H: D.piece.px[1]*K, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2};
    const M = document.createElement('div'); document.body.appendChild(M);
    const tmemo = new Map(), memo = new Map();
    T.tw = (t, css) => { const key = t + '|' + css; if(tmemo.has(key)) return tmemo.get(key); M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:nowrap;${css}`; M.textContent = t; const v = M.getBoundingClientRect().width*.75; tmemo.set(key, v); return v; };
    // a paragraph at width w: its line count and each line's width (pt)
    T.rows = (t, css, w, lh) => { const key = t + '|' + css + '|' + w.toFixed(1) + '|' + lh.toFixed(2); if(memo.has(key)) return memo.get(key);
      M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:normal;width:${w}pt;${css};line-height:${lh}pt;text-align:left`; M.textContent = t;
      const rg = document.createRange(); rg.selectNodeContents(M); const out = [];
      [...rg.getClientRects()].forEach(b => { if(b.width < .5) return; const r = out.find(x => Math.abs(x.top - b.top) < b.height*.5); if(r){ r.l = Math.min(r.l, b.left); r.r = Math.max(r.r, b.right); } else out.push({top: b.top, l: b.left, r: b.right}); });
      out.sort((a, b) => a.top - b.top); const ws = out.map(r => (r.r - r.l)*.75);
      const res = {n: out.length, ws, wide: Math.max(1, ...ws), last: ws[ws.length - 1] || 0}; memo.set(key, res); return res;
    };
    T.one = (t, face, w, max, min) => { for(let s = Math.ceil(Math.max(max, min)*2 - .02)/2; s >= min - .01; s -= .5) if(T.tw(t, face(s)) <= w) return s; return null; };
    T.done = () => M.remove();
    return T;
  };
  // Baskerville bold capitals, measured on the page (in em): the cap height, where the baseline falls in a line box as tall as the
  // type, and how far the J's tail hangs under the baseline
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = `700 200px ${LB}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:700 200px ${LB};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {cap: c.measureText('H').actualBoundingBoxAscent/200, base, tail: c.measureText('J').actualBoundingBoxDescent/200, jl: Math.max(0, c.measureText('J').actualBoundingBoxLeft/200)}; return MET; };
  const capH = s => met().cap*s, tailH = s => met().tail*s;
  // the J's tail swings left of its own box: the capitals start that far in, so the tail stays 1.5 pt outside the margin at most
  const jIn = (T, s) => Math.max(0, met().jl*s - 1.5*T.f);
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const rule = (x, y, w) => rect(x, y, w, 1, `background:${RULE}`), hair = (x, y, w) => rect(x, y, w, 1, `background:${HAIR}`);
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  // one line of the capitals set by its ink: the top of the letters at y, the left of the first letter's box at x
  const caps = (slot, t, x, y, w, s, align) => { const m = met(), base = m.base*s;
    return `<div class="ars-caps" data-slot="${slot}" data-lines="1" style="left:${x}pt;top:${y - (base - m.cap*s)}pt;width:${w}pt;height:${s}pt;${F.word(s)};line-height:${s}pt;color:${ON};text-align:${align || 'left'}">${esc(t)}</div>`; };

  // ---------- photos: every one inset inside its four corner ticks ----------
  // sizes are the photo's own; the ticks stand o pt outside its corners
  const heroKit = (D, T, o, cropK) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const n = r2(9*T.f), t = Math.max(1.5, r2(1.4*T.f));
    const ticks = (x, y, w, h) => [[x - o, y - o, 'top', 'left'], [x + w + o - n, y - o, 'top', 'right'], [x - o, y + h + o - n, 'bottom', 'left'], [x + w + o - n, y + h + o - n, 'bottom', 'right']]
      .map(([l, tp, a, b]) => `<div class="ars-tk" style="left:${l}pt;top:${tp}pt;width:${n}pt;height:${n}pt;border-${a}-width:${t}pt;border-${b}-width:${t}pt"></div>`).join('');
    const photo = (pid, x, y, w, h) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt`) + ticks(x, y, w, h);
    const sup0 = k => window.OHEmail ? OHEmail.support(D, id, k) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)).slice(0, k);
    // (two views of one room never stand side by side: the next photo of another room takes the second place)
    const room = p => String(p).replace(/\d+$/, '') + '|' + String((D.photos[p] || {}).tags || '').split(',')[0].trim().toLowerCase();
    const sup = k => { const out = []; sup0(k + 6).forEach(p => { if(out.length < k && !out.some(q => room(q).split('|').some(x => x && room(p).split('|').includes(x)))) out.push(p); }); return out.length >= k ? out : sup0(k); };
    const min = w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR));
    // the photo keeps its own shape, so the frame shows as much of it as the photo holds (cropK: how far a frame may trim its sides)
    const max = w => Math.ceil(Math.min(w/pAR*(cropK || 1.04), hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : w/pAR));
    return {id, pAR, o, photo, min, max, nat: w => Math.ceil(w/pAR),
      hero: (x, y, w, h) => { if(hb && h > w/pAR){ const vis = w/(h*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return photo(id, x, y, w, h); },
      // k room photos side by side, each inside its ticks
      row: (x, y, w, h, k, skip) => { const ids = sup(k + (skip || 0)).slice(skip || 0); if(!ids.length || h < 30) return ''; const gp = 2*o + r2(4*T.f), pw = (w - (ids.length - 1)*gp)/ids.length;
        return ids.map((p, i) => photo(p, x + i*(pw + gp), y, pw, h)).join(''); },
      // the widest frame at most wMax wide whose whole house fits a height of h
      fitW: (wMax, h) => { let w = wMax; while(w > 40 && min(w) > h) w -= 2; return w; }};
  };

  // ---------- words ----------
  // the street, never shortened and never split: one line down to the floor size. Set inside a span, so the shared address pass (templates/_shared/addressfit.js) leaves it as written.
  const street = (T, Li, w, max, two) => { const t = Li.address, s = T.one(t, F.street, w, max, T.FE);
    if(s) return {t, s, n: 1, w: T.tw(t, F.street(s))};
    return null; };
  const stH = st => st.n*st.s*1.25 + (st.n > 1 ? st.s*.15 : 0);
  const stTxt = (st, x, y, w) => txt('address', st.t, x, y, w, st.s, 1.25, F.street, ON, {n: st.n, html: `<span>${esc(st.t)}</span>`});
  // the listing's facts for the dimension line (longest wording first), and the ones it leaves for the highlights
  const facts = D => { const six = OHL.factSix(D.listing), get = ic => six.filter(([i]) => i === ic).map(([, t]) => t);
    const bed = get('bed'), bath = get('bath'), area = get('area').map(t => t.replace(' square feet', ' sq ft')), yr = get('cal'), lot = get('lot');
    const sb = bed.map(t => t.replace('bedroom', 'bed')), sba = bath.map(t => t.replace(' full bath', ' bath')), syr = yr.map(t => t.replace('Built in', 'Built'));
    const L = (list, year) => ({list, year: !!year && yr.length > 0, area: area.length > 0});
    return {lines: [L([...bed, ...bath, ...area, ...syr], 1), L([...sb, ...sba, ...area, ...syr], 1), L([...bed, ...bath, ...area]), L([...sb, ...sba, ...area])].filter(l => l.list.length),
      rows: [[[...sb, ...sba].join(' · '), [...area, ...syr].join(' · ')], [[...sb, ...sba].join(' · '), ...area, ...syr], [...sb, ...sba, ...area, ...syr]].map(r => r.filter(Boolean)),
      yr: yr[0] || '', lot: lot[0] || '', shown: six.map(([, t]) => t)}; };
  // the lines the Just Listed card sets on hollow squares: the year built and the lot where the dimension line does not carry them,
  // then the writer's own highlights. must: the year has to show (the line above could not hold it).
  const highlights = (D, FX, dm) => { const F0 = ((((D.sw || {}).pc || {}).jl || {}).front || {}), own = [].concat(F0.highlights || []).map(String);
    const pre = dm && dm.year ? [FX.lot] : [FX.yr && FX.lot ? FX.yr + '  ·  ' + FX.lot : '', FX.yr, FX.lot];
    return {must: dm && !dm.year && FX.yr ? 1 : 0, list: pre.concat(own).filter((t, i, a) => t && a.indexOf(t) === i && !SocialSet.CONDITION.test(t) && !/\$\s?\d/.test(t))}; };
  // the seller notes, the fullest first (the Just Sold card's own wording), then their second sentences alone, then the standing line
  const notes = D => { const F0 = ((((D.sw || {}).pc || {}).js || {}).front || {}), n2 = [].concat(F0.note2 || []).map(String).sort((a, b) => b.length - a.length);
    const tail = n2.map(t => t.split(/(?<=[.!?])\s+/).slice(1).join(' ')).filter(Boolean);
    return n2.concat(tail, [SocialSet.SOLD_POST]).filter((t, i, a) => t && a.indexOf(t) === i && !SocialSet.CONDITION.test(t)); };
  // Just Listed: the writer's lines (the house's story and what is nearby). The sentences in order (the first always kept), as many as
  // fill maxN lines or fewer at width w: every line 80%+ and the last 90%+ of the measure. Sentences that say again what a shown fact
  // or highlight says are left out.
  const writeUp = (T, D, w, s0, maxN, shown, avoid) => { const COMMON = /^(house|home|homes|floor|floors|first|second|third|built|square|large|there|their|which|where|about|under|above|along|through|every|other)$/;
    const words = t => (String(t).toLowerCase().match(/[a-z]{5,}/g) || []).filter(x => !COMMON.test(x)).map(x => x.replace(/s$/, '')), av = avoid.map(words);
    const pool = SocialSet.sentences(D, shown).filter(t => !av.some(a => words(t).some(x => a.includes(x)))).slice(0, 7); let best = null;
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of [1, .97, .94]) for(const s of [s0, r2(s0*1.06), r2(s0*1.12)]){ const r = T.rows(t, F.note(s), w*m, s*1.42); if(r.n > maxN || r.n < 2) continue;
        if(r.last < .9*w*m || r.ws.slice(0, -1).some(x => x < .82*w)) continue;
        const sc = r.n*100 + (/\bmiles?\b/i.test(t) ? 80 : 0) + m*20 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc}; } }
    if(best){ best.h = best.n*best.s*1.42 + best.s*.15; best.html = (x, y) => txt('writeup', best.t, x, y, best.w, best.s, 1.42, F.note, SOFT, {n: best.n}); }
    return best; };

  // ---------- the capitals ----------
  // across the full width w, as large as the width holds (max: a ceiling)
  const fitWord = (T, t, w, max) => { let s = Math.floor(Math.min(max || 400, 100*w/T.tw(t, F.word(100)))*2)/2; while(s >= T.FE && T.tw(t, F.word(s)) > w) s -= .5; return s >= T.FE ? s : null; };
  const wordOne = (T, w, max) => { const t = SocialSet.M.toUpperCase(), s0 = fitWord(T, t, w, max), s = s0 && fitWord(T, t, w - jIn(T, s0), max); if(!s) return null;
    return {s, h: capH(s) + tailH(s), cap: capH(s), ww: T.tw(t, F.word(s)), html: (x, y) => caps('moment', SocialSet.M, x + jIn(T, s), y, w + 2, s)}; };
  // stacked in a column w wide (JUST over LISTED / SOLD), kw: a share of the largest size the column holds
  const wordTwo = (T, w, kw, center) => { const ls = SocialSet.M.toUpperCase().split(/\s+/), fit0 = Math.min(...ls.map(t => fitWord(T, t, w) || 0)), fit = fit0 && Math.min(...ls.map(t => fitWord(T, t, w - jIn(T, fit0)) || 0)); if(!fit) return null;
    const s = Math.max(T.FE, r2(fit*kw)), pitch = s*.98;
    return {s, h: pitch + capH(s) + tailH(s)*.25, pitch, wide: Math.max(...ls.map(t => T.tw(t, F.word(s)))), html: (x, y) => ls.map((t, i) => caps(i ? 'moment.' + i : 'moment', t, center ? x : x + jIn(T, s), y + i*pitch, w + 2, s, center ? 'center' : 'left')).join('')}; };

  // the street and the place standing on one drafting rule: the street at the left, the place in tracked caps at the right end of
  // its line (without the ZIP code where the line cannot hold it; under the street where it cannot hold both)
  const headRow = (T, Li, w, k) => { const {f, FE, FS} = T, full = OHL.place(Li);
    for(const q of [1, .85, .7, .55, .4]) for(const tr of [.24, .16, .1]){ const st = street(T, Li, w*.74, Math.max(FE, FE*1.35*k*q)); if(!st) continue;
      const ps = r2(Math.max(FS, FS*1.05*Math.min(k, 1.3)*q)), pw = T.tw(full, F.place(ps, tr));
      if(st.w + 12*f + pw > w) continue;
      const h = stH(st) + 3*f + 1;
      return {h, ss: st.s, html: (x, y) => stTxt(st, x, y, st.w + 2) + txt('place', full, x + w - pw + ps*tr, y + st.s*1.25*.79 - ps*1.3*.77, pw + 2, ps, 1.3, z => F.place(z, tr), ON, {small: 1}) + rule(x, y + h - 1, w)}; }
    const st = street(T, Li, w, Math.max(FE, FE*1.2*k)); if(!st) return null;   // the street is never split (owner 11/18): one line or a wider column
    for(const tr of [.24, .16, .1, .05]){ const ps = T.one(full, z => F.place(z, tr), w, Math.max(FS, FS*1.05*Math.min(k, 1.3)), FS); if(!ps) continue;
      const h = stH(st) + 1.5*f + ps*1.3 + 3.5*f + 1;
      return {h, ss: st.s, side: w - Math.max(st.w, T.tw(full, F.place(ps, tr))), html: (x, y) => stTxt(st, x, y, w) + txt('place', full, x, y + stH(st) + 1.5*f, w, ps, 1.3, z => F.place(z, tr), ON, {small: 1}) + rule(x, y + h - 1, w)}; }
    return null; };

  // ---------- the dimension line: a rule with an upright and a slash at each end, the words in tracked accent caps in its gap ----------
  // lists: wordings, the longest first; the words run 84% of the line or more where o.fill (text under a photo fills its width)
  const dimLine = (T, w, lists, k, o) => { o = o || {}; const {f, FB, FS} = T, J = l => l.join('  ·  '), floor = o.small ? FS : FB, face = (s, tr) => F.fact(s, tr), stub = 9*f;
    for(const pass of (o.fill ? [1, 0] : [0])) for(const L0 of lists){ const list = L0.list || L0, t = J(list);
      for(let s = r2(Math.max(floor, floor*1.08*k)); s >= floor - .01; s -= .5){ const wd = tr => T.tw(t, face(s, tr)); if(wd(.05) > w - 2*stub) continue;
        let tr = .2; while(tr > .05 && wd(tr) > w - 2*stub) tr -= .01; while(pass && tr < .46 && wd(tr) < w*.845) tr += .01;
        if(pass && (wd(tr) < w*.84 || wd(tr) > w - 2*stub)) continue;
        const tw = wd(tr), lh = s*1.34, gp = 5*f, th = Math.max(1, r2(.9*f)), up = r2(11*f), sl = r2(8.5*f);
        return {h: lh, n: list.length, year: !!L0.year, area: !!L0.area, html: (x, y) => { const cy = y + lh/2, a1 = x + (w - tw)/2 - gp, a2 = x + (w + tw)/2 + gp;
          return rect(x, cy - th/2, Math.max(0, a1 - x), th, `background:${RULE}`) + rect(a2, cy - th/2, Math.max(0, x + w - a2), th, `background:${RULE}`)
            + [x, x + w].map(ex => rect(ex - th/2, cy - up/2, th, up, `background:${RULE}`) + rect(ex - th/2, cy - sl/2, th, sl, `background:${ON};transform:rotate(45deg)`)).join('')
            + txt(o.slot || 'facts.0', t, x + (w - tw)/2 + s*tr/2, y, tw + 2, s, 1.34, sz => face(sz, tr), ACC, {small: o.small}); }}; } }
    return null; };

  // ---------- Just Listed: the highlights on hollow squares, hairlines between them ----------
  // up to n of the lines that fit the column on one line at a size that reads; rh: each row's height
  const bullets = (T, list, w, k, n) => { const {f, FB} = T, sq = r2(6.5*f), gp = r2(8*f), max = Math.max(FB, FB*1.1*k);
    // (the year and the lot share a line where the column holds both; then neither is set again alone)
    const ok = []; list.forEach(t => { if(ok.length < n && !ok.some(c => c.includes(t)) && T.one(t, F.bul, w - sq - gp - 2, max, FB)) ok.push(t); }); if(ok.length < n) return null;
    if(!n) return {h: 0, n: 0, texts: [], html: () => ''};
    const fs = Math.min(...ok.map(t => T.one(t, F.bul, w - sq - gp - 2, max, FB))), rh = fs*1.3 + r2(11*f*Math.min(k, 1.25));
    return {h: n*rh, n, rh, texts: ok, tws: ok.map(t => sq + gp + T.tw(t, F.bul(fs))), html: (x, y, e) => { const r = rh + (e || 0); return ok.map((t, i) => (i ? hair(x, y + i*r - .5, w) : '')
      + rect(x, y + i*r + (r - sq)/2, sq, sq, `border:${Math.max(1.5, r2(1.3*f))}pt solid ${ON};box-sizing:border-box`)
      + txt('hl.' + i, t, x + sq + gp, y + i*r + (r - fs*1.3)/2, w - sq - gp, fs, 1.3, F.bul, ON)).join(''); }}; };

  // ---------- Just Sold: the question in Baskerville over the seller note ----------
  // the fullest note that sets in at most maxN lines: every line 80%+ of the measure and the last 90%+ (the measure may narrow a
  // little, the type rise up to 12%); under: the note sits under a photo, so every line also runs 80%+ of the full width
  const pickNote = (T, D, iw, ns0, maxN, under) => { const list = notes(D);
    for(let n = Math.min(maxN, 8); n >= 1; n--) for(const t of list) for(const m of (under ? [1, .97, .94] : [1, .96, .92, .88])) for(let s = ns0; s <= ns0*1.12 + .01; s += .5){
      const w = iw*m, r = T.rows(t, F.note(s), w, s*1.42); if(r.n !== n) continue;
      if(n === 1 ? r.wide < .9*w : (r.last < .9*w || r.ws.slice(0, -1).some(x => x < .8*w))) continue;
      if(under && r.ws.some(x => x < .82*iw)) continue;
      return {t, n, s, w, wide: r.wide}; }
    return null; };
  // o.lines: the most note lines; or o.room: the height (pt) the block may take. 0 lines: the question alone.
  const sell = (D, T, w, k, o) => { const {f, FE, FB} = T, al = o.center ? 'center' : 'left';
    let ql = o.noq ? [] : [Q], qs = o.noq ? 0 : T.one(Q, F.q, w, FE*1.25*k, FB);
    if(!o.noq && !qs){ ql = ['Thinking about', 'selling?']; qs = T.one(ql[0], F.q, w, FE*1.2*k, FB); if(!qs) return null; }
    const qh = ql.length*qs*1.25, gq = ql.length ? r2(4*f*Math.min(k, 1.3)) : 0, ns0 = r2(Math.max(FB, FB*(o.noq ? 1.12 : 1.05)*k));
    const maxN = o.lines != null ? o.lines : Math.floor((o.room - qh - gq - ns0*.2)/(ns0*1.12*1.42));
    const pk = maxN > 0 ? pickNote(T, D, w, ns0, maxN, o.under) : null; if(!pk) return null;   // a seller note on every image, never the question alone
    const nh = pk.n*pk.s*1.42 + pk.s*.15, h = qh + gq + nh;
    return {h, len: pk.t.length, n: pk.n, wide: Math.max(pk.wide, ...ql.map(t => T.tw(t, F.q(qs)))), html: (x, y) => { let s = '', yy = y;
      ql.forEach((t, i) => { s += txt(i ? 'sold2.q' : 'sold.q', t, x, yy, w, qs, 1.25, F.q, ON, {align: al}); yy += qs*1.25; });
      return s + txt('sold.note', pk.t, x + (o.center ? (w - pk.w)/2 : 0), yy + gq, pk.w, pk.s, 1.42, F.note, o.noq ? ON : SOFT, {n: pk.n, align: al}); }}; };

  // ---------- the agent: the name in Baskerville, the phone in tracked accent figures, the one logo at the right ----------
  // 'row': the name over the phone (after the headshot), REALTOR(R) on the line that leaves the logo the most room, the logo at the
  // right end. 'stack' (the text column of the wide images): the headshot beside the name, REALTOR(R) and the phone, the group
  // centered in the column, the logo centered under it.
  const agent = function(D, T, w, k, mode){ if(mode !== 'line') k = Math.min(k, 1.35); const {f, FB, FS} = T, A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), gap = r2(9*f);
    const tone = D.__arsDark ? 'dark' : 'light', nm = A.name || '', phn = A.phone || '';
    const logo = (x, y, lw, lh) => `<div class="abs ars-logo" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${ON}">${OHL.logo(D, tone, '')}</div>`;
    const hs = (x, y, hw, hh) => `<div class="abs ars-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    const ps = r2(Math.max(FB, FB*1.1*k)), ds = r2(Math.max(FS, FS*Math.min(k, 1.2))), pW = T.tw(phn, F.phone(ps)), dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0;
    if(mode === 'stack'){ const tz = arguments[5] || 0, gap = r2(6*f), fph = z => F.phone(z, .04), pW = T.tw(phn, fph(ps));
      for(const two of (nar ? [1, 0] : [1])){
        // two: REALTOR(R) on the name's line where the column holds both; else on its own line
        const th0 = FB*1.1*1.25 + (nar && !two ? ds*1.3 + .5*f : 0) + f + ps*1.3, need = Math.max(T.tw(nm, F.name(FB*1.1)) + (two && nar ? gap*.7 + dW : 0), pW, dW);
        // the headshot beside the lines, narrowed (never under half its height) where the column is tight
        const hs1 = hsOn ? Math.min(Math.round(th0*.8), Math.floor(w - gap - need - 1)) : 0; if(hsOn && hs1 < th0*.45) continue;
        const lw0 = w - (hsOn ? hs1 + gap : 0), ns = T.one(nm, F.name, lw0 - (two && nar ? gap*.7 + dW : 0), FB*1.5*k, FB*1.1); if(!ns || pW > lw0 || dW > lw0) continue;
        const nW = T.tw(nm, F.name(ns)), th = ns*1.25 + (nar && !two ? ds*1.3 + .5*f : 0) + f + ps*1.3;
        const tW = Math.max(nW + (two && nar ? gap*.7 + dW : 0), pW, nar && !two ? dW : 0), hsW = hsOn ? Math.min(Math.round(th*(arguments[6] ? 1.05 : .8)), Math.floor(w - gap - tW)) : 0, gW = (hsOn ? hsW + gap : 0) + tW; if(gW > w + .5) continue;
        const lh = r2(Math.max(FB*(tz && !arguments[6] ? 1.5 : 1.9), ns*(tz && !arguments[6] ? 1.2 : 1.45))), lw = Math.min(w, lh*4.2), lg = r2([6, 4, 2.5][tz]*f);   // (the tall plate keeps the logo at its full size)
        return {h: th + lg + lh, ww: Math.max(gW, lw), thin: hsOn ? Math.max(0, .75 - hsW/th) : 0, html: (x, y) => { const x0 = x + (w - gW)/2, tx = x0 + (hsOn ? hsW + gap : 0), cen = !hsOn, lx = cen ? x : tx, lwd = cen ? w : tW + 2, al = cen ? 'center' : 'left'; let yy = y, o = hsOn ? hs(x0, y, hsW, th) : '';
          if(two && nar){ const gx = cen ? x + (w - nW - gap*.7 - dW)/2 : tx; o += txt('agent.name', nm, gx, yy, nW + 2, ns, 1.25, F.name, ON) + txt('agent.desig', 'REALTOR®', gx + nW + gap*.7, yy + ns*1.25*.79 - ds*1.3*.77, dW + 2, ds, 1.3, F.tag, SOFT, {small: 1}); yy += ns*1.25; }
          else { o += txt('agent.name', nm, lx, yy, lwd, ns, 1.25, F.name, ON, {align: al}); yy += ns*1.25; if(nar){ o += txt('agent.desig', 'REALTOR®', lx, yy, lwd, ds, 1.3, F.tag, SOFT, {small: 1, align: al}); yy += ds*1.3 + .5*f; } }
          o += txt('agent.phone', phn, lx, yy + f, lwd, ps, 1.3, fph, ACC, {align: al});
          // the logo centered under the agent's lines (beside a headshot the lines stand right of the column's middle)
          const lcx = cen ? x + w/2 : Math.min(x + w - lw/2, Math.max(x + lw/2, tx + tW/2));
          return o + `<div class="abs ars-logo c" style="left:${lcx - lw/2}pt;top:${y + th + lg}pt;width:${lw}pt;height:${lh}pt;color:${ON}">${OHL.logo(D, tone, '')}</div>`; }}; }
      return null;
    }
    const probe = T.one(nm, F.name, w*.62, FB*1.5*k, FB*1.1); if(!probe) return null;
    const th0 = probe*1.25 + f + ps*1.3, hsW = hsOn ? Math.round(th0*.8) : 0, x0 = hsOn ? hsW + gap : 0, lmin = arguments[5] === 'slim' ? Math.max(40*f, w*.2) : Math.max(50*f, w*.3), cw = w - x0 - gap*1.5 - lmin;   // (slim: the title block's row, the logo's least room a little narrower)
    const ns = T.one(nm, F.name, cw, FB*1.5*k, FB*1.1); if(!ns || pW > cw) return null;
    const nW = T.tw(nm, F.name(ns)), th = ns*1.25 + f + ps*1.3, fit1 = nar && nW + gap*.8 + dW <= cw, fit2 = nar && pW + gap*.8 + dW <= cw;
    // REALTOR(R) on the line that leaves the logo the most room
    const tag1 = fit1 && (!fit2 || nW <= pW), tag2 = fit2 && !tag1;
    if(nar && !tag1 && !tag2) return null;   // REALTOR(R) always shows: a smaller setting holds it
    const tW = Math.max(nW + (tag1 ? gap*.8 + dW : 0), pW + (tag2 ? gap*.8 + dW : 0)), lw = Math.min(w - x0 - tW - gap*1.5, th*3.3, w*.36);
    return {h: th, html: (x, y) => { const tx = x + x0, y2 = y + ns*1.25 + f;
      return (hsOn ? hs(x, y, hsW, th) : '') + txt('agent.name', nm, tx, y, nW + 2, ns, 1.25, F.name, ON)
        + (tag1 ? txt('agent.desig', 'REALTOR®', tx + nW + gap*.8, y + ns*1.25*.79 - ds*1.3*.77, dW + 2, ds, 1.3, F.tag, SOFT, {small: 1}) : '')
        + txt('agent.phone', phn, tx, y2, pW + 2, ps, 1.3, F.phone, ACC)
        + (tag2 ? txt('agent.desig', 'REALTOR®', tx + pW + gap*.8, y2 + ps*1.3*.77 - ds*1.3*.77, dW + 2, ds, 1.3, F.tag, SOFT, {small: 1}) : '')
        + logo(x + w - lw, y + th*.04, lw, th*.92); }}; };

  const dark = D => { if(D.__arsDark == null){ const p = document.createElement('div'); p.style.color = 'var(--ars-on)'; document.body.appendChild(p); const n = (getComputedStyle(p).color.match(/[\d.]+/g) || [255, 255, 255]).slice(0, 3).map(Number); p.remove(); D.__arsDark = .299*n[0] + .587*n[1] + .114*n[2] > 140; } return D.__arsDark; };

  const AR = {};
  // ================= post, pin, square, story: the Just Sold card's order, stood upright =================
  // The capitals across the whole width, the street and the place on the drafting rule, the house inside its ticks at the photo's
  // own shape; then Just Listed: the facts on the dimension line, the year, the lot and the highlights on hollow squares, the
  // writer's lines; Just Sold: the question and the seller note; a hairline and the agent. On a story the house comes first (no
  // words in the top and bottom 250 px) and two rooms inside their ticks close the image.
  const tall = (D, L, W, H, shape) => { dark(D);
    const T = kit(D, shape), {f, FE, FB, FS} = T, Li = D.listing, sold = D.piece.moment === 'js', story = shape === 'story', sq = shape === 'square';
    const M = r2(14*f), w = W - 2*M, o = r2(6*f), g = r2((sq ? 6.5 : 8)*f), X = heroKit(D, T, o), FX = facts(D);
    const BOT = story ? H - Math.max(94, r2(104*f)) : H - M;
    const word = wordOne(T, w);
    const build = (k, op) => {
      const head = headRow(T, Li, w, k); if(!head) return null;
      const ag = agent(D, T, w, k, 'row'); if(!ag) return null;
      let dm = null, bl = null, wu = null, sl = null, mid;
      if(sold){ sl = sell(D, T, w, k, {lines: op.n, under: 1, noq: !op.q}); if(!sl) return null; mid = g*1.1 + sl.h; }
      else { dm = dimLine(T, w, FX.lines, k, {fill: 1}); if(!dm) return null;
        const HL = highlights(D, FX, dm); if(HL.must && !op.n) return null;
        bl = bullets(T, HL.list, w, k, op.n); if(!bl) return null;
        wu = op.wl ? writeUp(T, D, w, r2(Math.max(FB, FB*1.03*k)), op.wl, FX.shown, bl.texts) : null; if(op.wl && !wu) return null;
        mid = g*.7 + dm.h + (bl.n ? g*.5 + bl.h : 0) + (wu ? g*.9 + wu.h : 0); }
      const headH = word.h + 2.5*f + head.h, foot = g*.9 + 1 + g + ag.h;
      return {head, ag, dm, bl, wu, sl, headH, foot, mid, len: sl ? sl.len : 0, fixed: headH + g*.6 + 2*o + mid + foot};
    };
    const opts = sold ? [5, 4, 3, 2, 1].map(n => ({n, q: 1})).concat([3, 2, 1].map(n => ({n, q: 0})))
      : (sq ? [[1, 0], [0, 0]] : [[3, 3], [2, 3], [3, 2], [2, 2], [1, 2], [2, 0], [1, 0], [0, 0]]).map(([n, wl]) => ({n, wl}));
    const KMAX = {post: 1.5, pin: 1.6, story: 1.5, square: 1.3}[shape] || 1.4, KMIN = .6, rowMin = 84*f, top = story ? M + o : M;
    const roomOf = b => story ? BOT - M - b.fixed - g*.6 : BOT - top - b.fixed;
    let pick = null;
    for(const op of opts){ const b1 = build(KMIN, op); if(!b1 || roomOf(b1) < X.min(w)) continue;
      const need = Math.min(roomOf(b1), story ? X.nat(w) : X.min(w) + .7*(X.nat(w) - X.min(w)));
      let k = KMIN; for(let t = KMAX; t >= KMIN; t -= .025){ const b = build(t, op); if(b && roomOf(b) >= need && b.len >= b1.len){ k = t; break; } }
      pick = {op, k}; break; }
    let narrow = false;
    // (a house too tall for the room left at the smallest type: the fullest arrangement whose frame is narrowed the least)
    if(!pick){ narrow = true; let best = null; opts.forEach(op => { const b = build(KMIN, op); if(b && (!best || roomOf(b) > best.r + 6*f)) best = {op, r: roomOf(b)}; }); pick = {op: (best || {op: opts[opts.length - 1]}).op, k: KMIN}; }
    const B = build(pick.k, pick.op) || build(KMIN, pick.op) || opts.map(op => build(KMIN, op)).filter(Boolean)[0];
    if(!B){ T.done(); return CSS + word.html(M, M) + X.hero(M, M + word.h + g + o, w, Math.max(40, Math.min(H - 2*M - word.h - g - 2*o, X.max(w)))); }   // (never expected)
    const room = roomOf(B);
    let h = CSS, y = top;
    const header = () => { h += word.html(M, y); y += word.h + 2.5*f; h += B.head.html(M, y); y += B.head.h; };
    const dims = e => { if(B.dm){ y += g*.7 + e; h += B.dm.html(M, y); y += B.dm.h; } };
    const rest = (e, g0) => {
      if(sold){ y += g0 + e; h += B.sl.html(M, y); y += B.sl.h; }
      else { if(B.bl.n){ y += g*.5 + e*.5; h += B.bl.html(M, y, 0); y += B.bl.h; } if(B.wu){ y += g*.9 + e*.5; h += B.wu.html(M, y); y += B.wu.h; } }
      y += g*.9 + e; h += hair(M, y, w); y += 1 + g + e*.6; h += B.ag.html(M, y); y += B.ag.h; };
    // the house at the full width; a frame the room cannot hold narrows a little and sits centered, or takes a room beside it
    const house = ph => { if(X.min(w) <= ph){ h += X.hero(M, y, w, ph); return; }
      const hw = X.fitW(w, ph), sw = w - hw - 2*o - r2(4*f);
      h += w - hw <= W*.15 ? X.hero(M + (w - hw)/2, y, hw, ph) : X.hero(M, y, hw, ph) + X.row(M + hw + 2*o + r2(4*f), y, sw, ph, 1); };
    if(story){
      const ph = narrow ? Math.max(40, room) : Math.min(room, X.max(w));
      house(ph); y += ph + o; dims(0); y += g*1.2; header(); rest(0, g*1.1);
      const ry = y + g + o, rh = H - M - o - ry;
      if(rh >= 40) h += X.row(M, ry, w, rh, 2, narrow && w - X.fitW(w, ph) > W*.15 ? 1 : 0);
    } else {
      const ph = narrow ? Math.max(40, room) : Math.min(room, X.max(w)), spare = Math.max(0, room - ph), rowH = spare >= rowMin ? spare - 2*o - r2(4*f) : 0, e = rowH ? 0 : spare/4;
      header(); y += g*.6 + o + e*.6;
      house(ph); y += ph;
      if(rowH){ y += 2*o + r2(4*f); h += X.row(M, y, w, rowH, 2); y += rowH; }
      y += o; dims(e*.4); rest(e*.8, sold ? g*1.1 : 0);
    }
    T.done();
    return h;
  };

  // ================= wide (X), Google Business Profile: the house large at the left, the title block at the right =================
  // The house inside its ticks takes the left of the image at the photo's own shape, the street and the place on the drafting rule
  // under it. The column beside it is the drawing's title block, centered: the capitals stacked, then Just Listed: the four facts in
  // tracked accent caps between two rules; Just Sold: the seller note; the agent beside the headshot with REALTOR(R), and the logo.
  const hole = (T, side, bh) => { const a = side/T.W, b = bh/T.H; return a < .075 || b < .075 ? 0 : a*b; }, HOLE = .027;   // (the fill check passes over anything under 8% wide or tall)
  const factRows = (T, FX, w, k, tz) => { const {f, FB} = T;
    for(const rows of FX.rows){ if(!rows.length) continue; const s = r2(Math.max(FB, FB*1.05*k)); let tr = .18; const wide = t => Math.max(...rows.map(x => T.tw(x, F.fact(s, t))));
      while(tr > .04 && wide(tr) > w) tr -= .01; if(wide(tr) > w) continue;
      const lhK = [1.42, 1.3, 1.22][tz || 0], lh = s*lhK, pd = r2([5, 3, 2][tz || 0]*f), h = rows.length*lh + 2*pd + 2;
      return {h, n: rows.length, html: (x, y) => rule(x, y, w) + rows.map((t, i) => txt('facts.' + i, t, x + s*tr/2, y + 1 + pd + i*lh, w, s, lhK, z => F.fact(z, tr), ACC, {align: 'center'})).join('') + rule(x, y + h - 1, w)}; }
    return null; };
  const plate = (D, L, W, H, shape) => { dark(D);
    const T = kit(D, shape), {f, FE, FB, FS} = T, Li = D.listing, sold = D.piece.moment === 'js';
    const M = Math.ceil(.05*Math.min(W, H)*2)/2, MV = r2(Math.min(M, 7*f)), o = r2(Math.min(6*f, H*.022)), g = r2(Math.min(8*f, H*.03)), pad = r2(Math.min(6*f, W*.02)) + o*.5, HT = H - 2*MV;
    const X = heroKit(D, T, o, shape === 'gbp' ? 1.45 : 1.12), FX = facts(D), KS = [1.5, 1.25, 1.05, .9, .75, .6];
    let pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
    // relax: where nothing holds at the floors, the capitals may stand no larger than the street and leave room beside them
    const DBG = window.__dbg = {}, dbg = k => { DBG[k] = (DBG[k] || 0) + 1; };
    for(const relax of [0, 1, 2]){ if(pick) break;
    for(let fr = .64; fr >= .45*W/(W - 2*M) - .001; fr -= .02){ const pw = Math.round((W - 2*M)*fr), cx = M + pw + pad, cw = W - M - pad - cx; if(cw < 60*f) continue;
      for(const kh of [1.5, 1.1, .8, .6]){ const head = headRow(T, Li, pw, kh); if(!head) continue;
        if(relax < 2 && head.side && hole(T, head.side, head.h + o + g*.7 + MV) > .022){ dbg('side'); continue; }   // (a short street and place under a wide photo leave a hole beside them)
        const avail = HT - 2*o - g*.7 - head.h; if(avail < X.min(pw)){ dbg('min'); continue; }
        const ph = Math.min(avail, X.max(pw)), leftP = avail - ph; if(leftP > H*.1){ dbg('leftP'); continue; }
        for(const tz of [0, 1, 2]) for(const k of KS){ const gg = g*[1, .7, .5][tz], MVz = tz === 2 ? r2(4.5*f) : MV, HTz = H - 2*MVz;   // (2: the tightest setting, for a long street beside a headshot)
          const ag = agent(D, T, cw, Math.min(k, 1.2), 'stack', tz); if(!ag){ dbg('agent'); continue; }
          const fr0 = sold ? null : factRows(T, FX, cw, k, tz); if(!sold && !fr0){ dbg('facts'); continue; }
          for(const kw of [1, .85, .7, .55, .4]){ const wd = wordTwo(T, cw, kw, 1); if(!wd || (relax < 2 && wd.s < head.ss*1.1)) continue;
            if(!relax && hole(T, (cw - wd.wide)/2 + pad + M - .03*W, wd.h + MV) > .022) continue;   // (the room beside the capitals, out to the margin the fill check reads)
            const room = HTz - wd.h - ag.h - 2*gg, mid = sold ? [0, 1].map(noq => sell(D, T, cw, k, {room, center: 1, noq})).filter(m => m && m.h <= room)[0] : fr0; if(!mid || mid.h > room){ dbg('mid'); continue; }
            const leftT = room - mid.h, e = leftT/2;
            if(!relax && sold && hole(T, (cw - Math.max(wd.wide, mid.wide))/2 + pad + M - .03*W, wd.h + gg + e + mid.h + MVz) > .022) continue;
            take({sc: pw*ph/(W*H)*2600 + wd.s/FE*170 + k*40 + (sold ? Math.min(mid.len, 110) + (mid.len >= 85 ? 60 : 0) : 0) - leftT*4 - leftP*5 - tz*30 - relax*200 - ag.thin*150 - Math.abs(1.1 - kh)*40,
              draw: () => { const py = MV + o + leftP/2;
                return X.hero(M, py, pw, ph) + head.html(M, py + ph + o + g*.7) + wd.html(cx, MVz) + mid.html(cx, MVz + wd.h + gg + e) + ag.html(cx, H - MVz - ag.h); }});
            if(!sold) break; } } } } }
    // The tall plate (a wide photo whose house stands narrow in its middle, too wide a frame for the title block to hold the agent
    // beside it): the house inside its ticks down the whole left of the image, the frame trimmed to the house (never into it), and
    // the full title block at the right: the capitals stacked, the street and the place on the drafting rule, the facts between
    // their rules (Just Listed) or the seller note (Just Sold), the agent with the headshot and the logo.
    if(!pick){ const XB = heroKit(D, T, o, 3);
      for(let fr = .46; fr >= .25; fr -= .02){ const pw = Math.round((W - 2*M)*fr), cx = M + pw + pad, cw = W - M - pad - cx; if(cw < 60*f) continue;
        const ph0 = HT - 2*o; if(XB.min(pw) > ph0) continue; const ph = Math.min(ph0, XB.max(pw)), leftP = ph0 - ph; if(leftP > H*.06) continue;
        for(const kh of [1.3, 1.1, .9, .7]){ const head = headRow(T, Li, cw, kh); if(!head) continue;
          for(const tz of [0, 1, 2]) for(const k of KS) for(const am of ['stack', 'row']) for(const ka of [1.6, 1.3, 1]){ const gg = g*[1, .7, .5][tz], MVz = tz === 2 ? r2(4.5*f) : MV, HTz = H - 2*MVz;
            // (the agent in a row, the headshot, the lines and the logo side by side, where the stack leaves the block no height; the
            // agent's lines a size or two larger than the rest where the block's width leaves room beside them)
            const ag = am === 'row' ? agent(D, T, cw, Math.min(k*ka, 1.2), 'row', 'slim') : agent(D, T, cw, Math.min(k*ka, 1.35), 'stack', tz, 1); if(!ag) continue; if(am === 'row') ag.thin = ag.thin || 0;
            const fr0 = sold ? null : factRows(T, FX, cw, k, tz); if(!sold && !fr0) continue;
            // (the capitals stacked, or on one line across the block where the stack leaves the rest no height)
            for(const kw of [1, .85, .7, .55, .4, 0]){ const w1 = kw ? null : wordOne(T, cw, head.ss*(sold ? 1.3 : 1.6)), wd = kw ? wordTwo(T, cw, kw, 1) : w1 && Object.assign({}, w1, {wide: w1.ww}); if(!wd || wd.s < head.ss*1.1) continue;
              if(hole(T, (cw - wd.wide)/2 + pad + M - .03*W, wd.h + MV) > .022) continue;
              if(head.side && hole(T, head.side, head.h + gg) > .022) continue;
              const room = HTz - wd.h - head.h - ag.h - 2*gg, mid = sold ? [0, 1].map(noq => sell(D, T, cw, k, {room, center: 1, noq})).filter(q => q && q.h <= room)[0] : fr0; if(!mid || mid.h > room) continue;
              const leftT = room - mid.h, e = leftT/3;
              if(sold && hole(T, (cw - Math.max(wd.wide, mid.wide))/2 + pad + M - .03*W, mid.h + gg + e) > .022) continue;
              take({sc: pw*ph/(W*H)*2600 + wd.s/FE*170 + k*40 + (sold ? Math.min(mid.len, 110) + (mid.len >= 85 ? 60 : 0) : 0) - leftT*4 - leftP*5 - tz*30 - ag.thin*150 - (ag.ww ? hole(T, (cw - ag.ww)/2 + (W - M - cx - cw)*0 + 1, ag.h)*4000 : 0),
                draw: () => { let y = MVz; const py = MV + o + leftP/2;
                  let s = XB.hero(M, py, pw, ph) + wd.html(cx, y); y += wd.h + gg*.7 + e;
                  s += head.html(cx, y); y += head.h + gg*.7 + e;
                  return s + mid.html(cx, y) + (am === 'row' ? hair(cx, H - MVz - ag.h - gg*.8 - 1, cw) : '') + ag.html(cx, H - MVz - ag.h); }});
              if(!sold) break; } } } } }
    let h = CSS;
    if(pick) h += pick.draw();
    else { T.done(); return tall(D, L, W, H, shape); }   // (never expected: the upright order holds at any size)
    T.done();
    return h;
  };
  AR.portrait = tall;
  AR.landscape = plate;

  // ================= carousel photo slides: the room inside its ticks, the dimension line, the capitals and the street on the rule =================
  AR.slide = (D, L, W, H) => { dark(D);
    const T = kit(D, 'slide'), {f, FE, FB, FS} = T, Li = D.listing, sold = D.piece.moment === 'js', M = r2(14*f), w = W - 2*M, o = r2(6*f), g = r2(8*f), X = heroKit(D, T, o), FX = facts(D);
    // the foot: the capitals at the left, the street at the right end of their line, both standing on the rule
    let st = null, wd = null, inline = false;
    for(const q of [1.25, 1.1, 1]){ const a = street(T, Li, w*.5, FE*q); if(!a) continue; const b = wordOne(T, w - a.w - 16*f, FE*2.4); if(b && b.s >= a.s*1.25){ st = a; wd = b; inline = true; break; } }
    if(!inline){ wd = wordOne(T, w, FE*2.6); st = street(T, Li, w, FE*1.2) || {t: Li.address, s: FE, n: 1, w: w}; }
    const dm = sold ? dimLine(T, w, [[OHL.place(Li)]], 1, {slot: 'place', small: 1}) : dimLine(T, w, FX.lines, 1, {fill: 1});
    const footH = inline ? wd.h + 3*f + 1 : wd.h + 2.5*f + stH(st) + 3*f + 1, dh = dm ? o*.6 + g*.7 + dm.h : 0, ph = H - 2*M - 2*o - dh - g*1.1 - footH;
    let h = CSS + X.photo(D.piece.photo, M, M + o, w, ph), y = M + o + ph;
    if(dm) h += dm.html(M, y + o*.6 + g*.7);
    y = H - M - footH;
    h += wd.html(M, y) + (inline ? stTxt(st, M + w - st.w - 1, y + wd.cap - st.s*1.25*.79, st.w + 2) : stTxt(st, M, y + wd.h + 2.5*f, w)) + rule(M, H - M - 1, w);
    T.done();
    return h;
  };
  window.ARSocial = AR;
})();
