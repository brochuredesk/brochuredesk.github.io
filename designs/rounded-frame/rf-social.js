/* templates/rounded-frame/rf-social.js: Rounded Frame's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on
   piece matches its set's main pieces). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and replaces its three
   layouts for this set only; nothing shared changes.

   Read off the approved Rounded Frame pieces (postcard.html, flyer.html, rf-tokens.css, rf-marks.css):
     - the kit's paper as the ground; every part in a rounded shape of the one main color; Lexend only
     - Just Listed: the big solid main-color card with JUST / LISTED stacked in tight Lexend 600 caps, the place in small tracked caps,
       the street in 600; the facts as outlined pills (the postcard back's, white on the card); the house inside a rounded outline
       frame, its own corners rounded; the highlights on ring bullets; the agent's name in ink and the phone in the main color
     - Just Sold: JUST SOLD in a full-width solid pill; the framed house; the street in the main color; "Thinking about selling?";
       the note in the rounded tinted box; then who to call
     - carousel slides: the room in the rounded outline frame, the status pill (the word, a dot, the street) under it
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house in every frame (the engine's
   house-cut check), text at the phone floors of templates/_shared/readsize.js, condition claims never shown. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const LX = "'Lexend'", MAIN = 'var(--rf-main)', ONM = 'var(--rf-on-main)', INK = '#161616', LW = .98;
  const Q = 'Thinking about selling?';
  const F = {
    word: s => `font:600 ${s}pt ${LX};letter-spacing:${(-s*.035).toFixed(2)}pt;text-transform:uppercase`,
    street: s => `font:600 ${s}pt ${LX};letter-spacing:${(-s*.012).toFixed(2)}pt`,
    eyebrow: s => `font:600 ${s}pt ${LX};text-transform:uppercase;letter-spacing:${(s*.2).toFixed(2)}pt`,
    pill: s => `font:500 ${s}pt ${LX}`,
    bul: s => `font:500 ${s}pt ${LX}`,
    q: s => `font:600 ${s}pt ${LX}`,
    note: s => `font:400 ${s}pt ${LX}`,
    name: s => `font:600 ${s}pt ${LX}`,
    phone: s => `font:500 ${s}pt ${LX}`,
    tag: s => `font:600 ${s}pt ${LX};text-transform:uppercase;letter-spacing:${(s*.14).toFixed(2)}pt`,
  };
  const CSS = `<style>
    .ss .rfs-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ss .rfs-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .rfs-logo .text{font:600 12pt/1.15 ${LX};text-align:center;color:inherit}
    .ss .rfs-hs{position:absolute;overflow:hidden}.ss .rfs-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .rfs-w{position:absolute;white-space:nowrap}
    .ss .rfs-c{position:absolute;box-sizing:border-box;pointer-events:none}
    .ss .rfs-pill{position:absolute;box-sizing:border-box;border-radius:999pt;text-align:center;white-space:nowrap;overflow:hidden}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, area: D.piece.px[0]*D.piece.px[1]*K*K, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2};
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
    T.one = (t, face, w, max, min) => { for(let s = Math.floor(Math.max(max, min)*2 + .02)/2; s >= min - .01; s -= .5) if(T.tw(t, face(s)) <= w) return s; return T.tw(t, face(min)) <= w ? min : null; };
    T.done = () => M.remove();
    return T;
  };
  // the page's own measures, scaled from the 6 x 9 postcard (432 pt tall): margin, cell corner, photo inset, photo corner, gap
  const geo = (W, H) => { const u = Math.min(W, H); return {E: r2(u*.032), R: r2(u*.045), I: r2(u*.02), PR: r2(u*.03), g: r2(u*.022)}; };
  // the capitals, measured on the page: the cap height and where the baseline falls in a line box as tall as the type (both in em)
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = `600 200px ${LX}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:600 200px ${LX};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}; return MET; };
  const inkH = (s, n) => met().cap*s + (n - 1)*s*LW;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  // the moment word in tight caps, one line or stacked, set by its ink: the top of the first line's letters at y
  const wordEl = (lines, x, y, w, s, color, align) => { const m = met(), L = s*LW, off = m.base*s + (L - s)/2 - m.cap*s;
    return lines.map((t, i) => `<div class="rfs-w" data-slot="moment${i ? '.' + (i + 1) : ''}" data-lines="1" style="left:${x}pt;top:${y - off + i*L}pt;width:${w}pt;height:${L}pt;${F.word(s)};line-height:${L}pt;color:${color};text-align:${align || 'left'}">${esc(t)}</div>`).join(''); };
  const words = () => SocialSet.M.toUpperCase().split(/\s+/);
  const wide1 = (T, s) => Math.max(...words().map(t => T.tw(t, F.word(s))));
  // the paper-free pocket beside the shorter of two stacked words (pt2): kept under 2.6% of the image
  const pocketMax = (T, c) => Math.sqrt(T.area*.0285/c);   // (measured on the renders: the pocket runs about c x the type size squared; c 1.3 beside the facts, 1.5 in a column)

  // ---------- the set's shapes ----------
  const cellM = (x, y, w, h, r) => `<div class="rfs-c" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;border-radius:${Math.min(r, h/2)}pt;background:${MAIN}"></div>`;
  const cellO = (x, y, w, h, r) => `<div class="rfs-c" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;border-radius:${Math.min(r, h/2)}pt;border:1.6pt solid ${MAIN}"></div>`;
  const cellT = (x, y, w, h, r) => `<div class="rfs-c" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;border-radius:${Math.min(r, h/2)}pt;background:var(--rf-tint);border:.8pt solid ${MAIN}"></div>`;

  // ---------- photos: each inside its rounded outline frame, its own corners rounded ----------
  // the narrowest a house frame may stand against its width (the approved set's own crops): never a tall narrow slice
  const ASP = {wide: 1.2, gbp: 1.02};
  const heroKit = (D, G, shape) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null, I = G.I;
    const ph = (pid, x, y, w, h) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;border-radius:${G.PR}pt`);
    const cell = (pid, x, y, w, h) => cellO(x, y, w, h, G.R) + ph(pid, x + I, y + I, w - 2*I, h - 2*I);
    // room photos, no two of the same kind of room side by side
    const kind = p => { const t = (p + ' ' + ((D.photos[p] || {}).tags || '')).toLowerCase(); return /stair|foyer|entry|hall|walk|door|gate/.test(t) ? 'entry' : /kitchen|breakfast|pantry/.test(t) ? 'kitchen' : /living|family|den|open|dining/.test(t) ? 'living' : /bed|primary|suite/.test(t) ? 'bed' : /bath|powder/.test(t) ? 'bath' : /deck|patio|yard|back|roof|pergola/.test(t) ? 'out' : p; };
    const sup = n => { const all = window.OHEmail ? OHEmail.support(D, id, 10) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)).slice(0, 10), out = [];
      all.forEach(p => { if(out.length < n && !out.some(q => kind(q) === kind(p))) out.push(p); }); all.forEach(p => { if(out.length < n && !out.includes(p)) out.push(p); }); return out; };
    const imin = w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR));
    const imax = w => Math.ceil(Math.min(w/(ASP[shape] || pAR/1.04), hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : w/pAR));
    const X = {id, cell,
      // all sizes are the frame's outer size
      min: w => imin(w - 2*I) + 2*I, max: w => Math.max(imin(w - 2*I), imax(w - 2*I)) + 2*I, nat: w => Math.ceil((w - 2*I)/pAR) + 2*I,
      hero: (x, y, w, h) => { const iw = w - 2*I, ih = h - 2*I; if(hb && ih > iw/pAR){ const vis = iw/(ih*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return cell(id, x, y, w, h); },
      // n room photos side by side in one frame
      rooms: (x, y, w, h, n) => { const ids = sup(n); if(!ids.length) return ''; const pw = (w - 2*I - (ids.length - 1)*I)/ids.length;
        return cellO(x, y, w, h, G.R) + ids.map((p, i) => ph(p, x + I + i*(pw + I), y + I, pw, h - 2*I)).join(''); }};
    // the house's frame in a space w wide and room tall: the frame at the photo's own shape (never zoomed in); a space too short for
    // the whole house narrows the frame and sets a room photo beside it. Returns what it used of the height.
    X.band = (T, x, y, w, room) => {
      if(room < X.min(w)){ let pw = w - G.g - Math.ceil(44*T.f); while(pw > w*.3 && X.min(pw) > room) pw -= 2; const sw = w - pw - G.g, ph0 = Math.min(room, X.max(pw));
        return {used: room, html: X.hero(x, y + (room - ph0)/2, pw, ph0) + X.rooms(x + pw + G.g, y, sw, room, 1)}; }
      const ph0 = Math.min(room, X.max(w)); return {used: ph0, html: X.hero(x, y, w, ph0)};
    };
    return X;
  };

  // ---------- words ----------
  // the street, never shortened: one line down to the floor size, else two lines at the floor with the last two words kept together
  const street = (T, Li, w, max, two) => { const t = Li.address, s = T.one(t, F.street, w, max, T.FE);
    if(s) return {t, s, n: 1, w: T.tw(t, F.street(s))};
    if(!two) return null;
    const t2 = t.replace(/\s+(\S+)\s*$/, ' $1'), r = T.rows(t2, F.street(T.FE), w, T.FE*1.2);
    return r.n <= 2 && r.wide <= w ? {t: t2, s: T.FE, n: 2, w: r.wide} : null; };
  const stH = st => st.n*st.s*1.2 + (st.n > 1 ? st.s*.15 : 0);
  const stTxt = (st, x, y, w, color, align) => txt('address', st.t, x, y, w, st.s, 1.2, F.street, color, {n: st.n, align, html: `<span>${esc(st.t)}</span>`});
  // the city line with its zip in small tracked caps; the tracking closes a little before the line gives up its width
  const eyeb = (T, t, w, max) => { for(const tr of [.2, .14, .09, .05]){ const f = s => F.eyebrow(s).replace(/letter-spacing:[^;]+/, `letter-spacing:${(s*tr).toFixed(2)}pt`), s = T.one(t, f, w, Math.max(max, T.FS), T.FS); if(s) return {s, f, w: T.tw(t, f(s))}; } return null; };
  // the street on one line (never split) with the city line directly under it, w wide
  const addr = (T, Li, w, max, C) => { const place = OHL.place(Li), st = street(T, Li, w, max, false); if(!st) return null;
    const e = eyeb(T, place, w, T.FS*1.15); if(!e) return null; const sh = stH(st) + 1.5*T.f;
    return {h: sh + e.s*1.3, n: 1, s: st.s, w: Math.max(st.w, e.w), html: (x, y, al) => stTxt(st, x, y, w, C.street, al) + txt('place', place, x, y + sh, w, e.s, 1.3, e.f, C.place, {small: 1, align: al})}; };
  // on one line across a full width: the street at the left, the city at the right end
  const addrRow = (T, Li, w, max, C) => { const place = OHL.place(Li);
    for(let s = Math.floor(max*2)/2; s >= T.FE - .01; s -= .5){ const sw = T.tw(Li.address, F.street(s)), e = eyeb(T, place, w - sw - s*.8, T.FS*1.15); if(!e) continue;
      return {h: s*1.2, html: (x, y) => stTxt({t: Li.address, s, n: 1}, x, y, sw + 2, C.street) + txt('place', place, x + w - e.w - 2, y + s*1.2*.78 - e.s*1.3*.78, e.w + 2, e.s, 1.3, e.f, C.place, {small: 1})}; }
    return addr(T, Li, w, max, C); };
  // the facts as the postcards write them: 2 Beds, 2 Full Baths, 1,635 Sq Ft, Built 2005
  const tc = t => t.replace(/(^|\s)[a-z]/g, c => c.toUpperCase());
  const facts = D => { const six = OHL.factSix(D.listing);
    return six.filter(([ic]) => ic === 'bed' || ic === 'bath' || ic === 'area' || ic === 'cal').map(([ic, t]) => tc(ic === 'bed' ? t.replace(/bedrooms?/, m => m === 'bedroom' ? 'bed' : 'beds') : ic === 'area' ? t.replace(' square feet', ' sq ft') : ic === 'cal' ? t.replace('Built in', 'Built') : t)); };
  // the postcard front's highlights (never a condition claim, never a price)
  const highlights = D => [].concat((((((D.sw || {}).pc || {}).jl || {}).front || {}).highlights) || []).map(x => String([].concat(x)[0] || '')).filter(t => t && !SocialSet.CONDITION.test(t) && !/\$\s?\d/.test(t));
  // the seller notes: the postcard's own sentences in their order (the first always kept), then its short notes, then the set's own line
  const notes = D => { const Fr = ((((D.sw || {}).pc || {}).js || {}).front || {}), S = [].concat((Fr.note || {}).s || []).map(x => [].concat(x).map(String)), out = [];
    if(S.length){ const rest = S.slice(1); for(let m = (1 << rest.length) - 1; m >= 1; m--) for(const a of S[0]) for(const v of [0, 1]) out.push([a].concat(rest.filter((_, i) => m & (1 << i)).map(x => x[Math.min(v, x.length - 1)])).join(' ')); }
    return out.concat([].concat(Fr.note2 || []).map(String), [SocialSet.SOLD_POST]).filter((t, i, a) => t && a.indexOf(t) === i && !SocialSet.CONDITION.test(t)); };

  // ---------- the fact pills ----------
  // each fact in an outlined capsule, packed into rows w wide; every row runs the full width
  const pills = (T, list, w, s) => { const ph = r2(s*1.9), px = s*.62, g = r2(s*.42), ws = list.map(t => T.tw(t, F.pill(s)) + 2*px + 4);
    if(!list.length || Math.max(...ws) > w) return null;
    const rows = []; let cur = [], cw = 0;
    ws.forEach((pw, i) => { if(cur.length && cw + g + pw > w){ rows.push(cur); cur = []; cw = 0; } cw += (cur.length ? g : 0) + pw; cur.push(i); }); rows.push(cur);
    return {n: rows.length, s, h: rows.length*ph + (rows.length - 1)*g,
      html: (x, y, line, ink) => rows.map((r, ri) => { const tot = r.reduce((a, i) => a + ws[i], 0) + (r.length - 1)*g, add = (w - tot)/r.length; let xx = x;
        return r.map(i => { const pw = ws[i] + add, hh = `<div class="rfs-pill" data-slot="facts.${i}" data-lines="1" style="left:${xx}pt;top:${y + ri*(ph + g)}pt;width:${pw}pt;height:${ph}pt;${F.pill(s)};line-height:${ph - 2.8}pt;color:${ink};border:1.4pt solid ${line}">${esc(list[i])}</div>`; xx += pw + g; return hh; }).join(''); }).join('')}; };
  // the pills in the fewest rows, at the largest type (up to max) that keeps that few
  const pillFit = (T, list, w, max) => { const base = pills(T, list, w, T.FB); if(!base) return null; let best = base;
    for(let s = Math.floor(max*2)/2; s > T.FB; s -= .5){ const p = pills(T, list, w, s); if(p && p.n <= base.n){ best = p; break; } } return best; };
  // the facts as lines of type (X, where the type floor leaves pills no room): whole facts to a line, a dot between two
  const factLines = (T, list, w, s) => { const J = ' · ', rows = []; let cur = '';
    for(const t of list){ const n = cur ? cur + J + t : t; if(cur && T.tw(n, F.pill(s)) > w){ rows.push(cur); cur = t; } else cur = n; } rows.push(cur);
    if(rows.some(t => T.tw(t, F.pill(s)) > w)) return null;
    return {n: rows.length, w: Math.max(...rows.map(t => T.tw(t, F.pill(s)))), h: rows.length*s*1.32, html: (x, y, color, al) => rows.map((t, i) => txt('facts.' + i, t, x, y + i*s*1.32, w, s, 1.32, F.pill, color, {align: al || 'left'})).join('')}; };

  // ---------- the highlights on ring bullets ----------
  const ringW = s => r2(s*.62);
  const bulW = (T, t, s) => T.tw(t, F.bul(s)) + ringW(s) + s*.7 + 2;
  const bulList = (T, list, x, y, w, s, rh) => list.map((t, i) => { const yy = y + i*rh, d = ringW(s);
    return `<div class="abs" style="left:${x + 1}pt;top:${yy + (rh - d)/2 + s*.04}pt;width:${d}pt;height:${d}pt;border:1.4pt solid ${MAIN};border-radius:50%;box-sizing:border-box"></div>`
      + txt('hl.' + i, t, x + d + s*.7, yy + (rh - s*1.3)/2, w - d - s*.7, s, 1.3, F.bul, INK); }).join('');

  // ---------- the agent on the paper: headshot, the name in ink with REALTOR(R), the phone in the main color, the one logo ----------
  // 'row': the headshot and the lines at the left, the logo at the right end. 'stack': the headshot beside the lines, the logo under the
  // lines. 'bare': the headshot and the lines alone (the logo stands elsewhere on the image).
  const hsOn = D => OHL.cardMode(D) === 'headshot' && !!(D.agent || {}).headshot;
  const logoBox = (D, x, y, lw, lh, tone) => `<div class="abs rfs-logo" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${tone === 'dark' ? ONM : INK}">${OHL.logo(D, tone || 'light', '')}</div>`;
  const agent1 = (D, T, G, w, k, mode, nameMax, h0, center) => {
    const A = D.agent || {}, gap = r2(8*T.f), nar = !!(A.nar || /realtor/i.test(A.designation || '')), ds = T.FS, dW = nar ? T.tw('REALTOR®', F.tag(ds)) + 2 : 0;
    const sizes = cw => { if(dW > cw) return null; const ns = T.one(A.name || '', F.name, cw, Math.min(nameMax || 999, T.FB*1.5*k), T.FB*1.1); if(!ns) return null;
      const ps = T.one(A.phone || '', F.phone, cw, Math.max(T.FB, r2(ns*.82)), T.FB); if(!ps) return null;
      const nW = T.tw(A.name || '', F.name(ns)), inl = nar && nW + ns*.4 + dW <= cw;
      return {ns, ps, nW, inl, wide: Math.max(inl ? nW + ns*.4 + dW : Math.max(nW, dW), T.tw(A.phone || '', F.phone(ps))) + 2, th: ns*1.2 + (nar && !inl ? ds*1.35 : 0) + ps*1.25}; };
    const lines = (S, x, y, cw, al) => { let s = '', yy = y + S.ns*1.2;
      if(S.inl){ const tot = S.nW + S.ns*.4 + dW, x0 = al === 'center' ? x + (cw - tot)/2 : x;
        s += txt('agent.name', A.name || '', x0, y, S.nW + 2, S.ns, 1.2, F.name, INK) + txt('agent.desig', 'REALTOR®', x0 + S.nW + S.ns*.4, y + S.ns*1.2*.78 - ds*1.3*.78, dW, ds, 1.3, F.tag, MAIN, {small: 1}); }
      else { s += txt('agent.name', A.name || '', x, y, cw, S.ns, 1.2, F.name, INK, {align: al}); if(nar){ s += txt('agent.desig', 'REALTOR®', x, yy, cw, ds, 1.35, F.tag, MAIN, {small: 1, align: al}); yy += ds*1.35; } }
      return s + txt('agent.phone', A.phone || '', x, yy, cw, S.ps, 1.25, F.phone, MAIN, {align: al}); };
    const hs = (x, y, hw, hh) => `<div class="abs rfs-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt;border-radius:${r2(G.PR*.6)}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    if(mode === 'row' || mode === 'bare'){
      const p = sizes(mode === 'bare' ? w : w*.62); if(!p) return null;
      const lmin = mode === 'bare' ? 0 : 56*T.f, hw = h0 ? Math.round(p.th*.82) : 0, tx = h0 ? hw + gap : 0, S = sizes(w - tx - (lmin ? gap*1.5 + lmin : 0)); if(!S) return null;
      const hw2 = h0 ? Math.round(S.th*.82) : 0, tx2 = h0 ? hw2 + gap : 0, lx = tx2 + S.wide + gap*1.5, lw = lmin ? Math.min(w - lx, S.th*3.4) : 0; if(lmin && lw < lmin) return null;
      const cx0 = mode === 'bare' && center && T.agAlign !== 'left' ? (w - tx2 - S.wide)/2 : 0;
      return {h: S.th, hs: h0, lw, ns: S.ns, ww: tx2 + S.wide, html: (x, y) => (h0 ? hs(x + cx0, y, hw2, S.th) : '') + lines(S, x + cx0 + tx2, y, S.wide, 'left') + (lmin ? logoBox(D, x + w - lw, y + S.th*.04, lw, S.th*.92) : '')};
    }
    const S0 = sizes(w); if(!S0) return null;
    // with a headshot the photo stands beside the lines, as tall as they are; the logo sits centered under the lines
    const hw = h0 ? Math.round(S0.th*.8) : 0, S = sizes(w - (h0 ? hw + gap : 0)); if(!S) return null;
    const lhB = Math.max(S.ns*1.5, T.FB*1.9), lh = r2(T.logoH ? Math.max(lhB*.8, Math.min(T.logoH, w/4.4, lhB*2.2)) : lhB*(T.logoK || 1)), full = S.th + gap*.8 + lh, hw2 = h0 ? Math.round(S.th*.8) : 0, gw = (h0 ? hw2 + gap : 0) + S.wide, lw = Math.min(w, lh*4.6);
    const left = false;
    const lcR = (w - gw)/2 + (h0 ? hw2 + gap : 0) + S.wide/2, lgL = lcR - Math.max(lh*2, Math.min(lw, 2*lcR, 2*(w - lcR)))/2;
    return {h: full, hs: h0, lw, lh, ns: S.ns, ww: Math.max(gw, lw), gw, lgL, gapB: gap*.8, html: (x, y) => { const x0 = left ? x : x + (w - gw)/2;
      if(left) return (h0 ? hs(x0, y, hw2, S.th) : '') + lines(S, x0 + (h0 ? hw2 + gap : 0), y, S.wide, 'left') + logoBox(D, x, y + S.th + gap*.8, Math.min(lw, Math.max(gw, lh*3)), lh).replace('justify-content:center', 'justify-content:flex-start');
      return (h0 ? hs(x0, y, hw2, T.hsTall ? full : S.th) : '') + lines(S, x0 + (h0 ? hw2 + gap : 0), y, S.wide, h0 ? 'left' : 'center') + (() => { const lc = x0 + (h0 ? hw2 + gap : 0) + S.wide/2, bw = Math.max(lh*2, Math.min(lw, 2*(lc - x), 2*(x + w - lc))); return logoBox(D, lc - bw/2, y + S.th + gap*.8, bw, lh); })(); }};
  };
  // a stacked agent whose logo grows into the height its column leaves (so no room stands empty around the logo)
  const fitStack = (T, mk, room) => { T.logoK = .8; T.logoH = 0; const a = mk(); if(!a || a.h > room){ T.logoK = 0; return null; }
    T.logoH = a.lh + (room - a.h); const b = mk(); T.logoH = 0; T.logoK = 0; return b && b.h <= room + .5 ? b : a; };
  // the agent in one arrangement: with the headshot whenever the agent's card carries one (smaller type before the headshot goes)
  const agentIn = (D, T, G, w, k, mode, nameMax, loose) => { const want = hsOn(D);
    for(const kk of [k, Math.max(1, k*.85), 1]){ const a = agent1(D, T, G, w, kk, mode, nameMax, want ? 1 : 0, mode === 'bare'); if(a) return a; }
    return loose && want ? agent1(D, T, G, w, 1, mode, nameMax, 0, mode === 'bare') : null; };

  // ---------- Just Listed: the solid main card ----------
  // JUST / LISTED stacked at the left; beside it the city line and the street. The largest word (up to wsMax) that leaves the street
  // its line.
  const duoCard = (T, G, D, w, wsMax, padK) => { const Li = D.listing, pad = r2(G.R*(padK || .8)), iw = w - 2*pad, L = words(), C = {place: ONM, street: ONM}; let B = null;
    for(const [two, minS] of [[false, 1.25], [false, 1]]){ for(let ws = Math.min(Math.floor(wsMax), Math.floor(pocketMax(T, 1.3))); ws >= T.FE*1.3 && !B; ws -= 1){
      const ww = wide1(T, ws) + 2, gap = r2(ws*.42), rw = iw - ww - gap; if(rw < 70*T.f) continue;
      const a = addr(T, Li, rw, Math.min(T.FE*2.2, Math.max(T.FE, ws*.82)), C); if(!a || (minS > 1 && (a.s || 0) < Math.min(T.FE*minS, ws*.5))) continue;
      B = {ws, ww, gap, rw, a, wh: inkH(ws, L.length)}; } if(B) break; }
    if(!B) return null; const h = Math.max(B.wh, B.a.h) + 2*pad;
    return {h, ws: B.ws, slack: Math.max(0, B.rw - B.a.w), html: (x, y) => cellM(x, y, w, h, G.R) + wordEl(L, x + pad, y + (h - B.wh)/2, B.ww, B.ws, ONM) + B.a.html(x + pad + B.ww + B.gap, y + (h - B.a.h)/2)}; };
  // the writer's lines under the house (the house's story and what is nearby): the writer's sentences in order (the first always
  // kept), as many as fill maxN lines or fewer at width w, every line 80%+ and the last 90%+ of the measure
  const cw4 = t => new Set(String(t).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(x => x.length > 3 || /\d/.test(x)));
  const sameFact = (a, b) => { const x = cw4(a), y = cw4(b); let n = 0; x.forEach(v => { if(y.has(v)) n++; }); return n >= 2; };
  const writeUp = (T, D, w, s0, maxN, avoid) => { T.wu = T.wu || {}; const key = [Math.round(w), s0, maxN, (avoid || []).length].join('|'); if(key in T.wu) return T.wu[key];
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing)).filter(t => !(avoid || []).some(b => sameFact(t, b))).slice(0, 7), near = /\bmiles?\b/i; let best = null;
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of [1, .96]) for(const s of [s0, r2(s0*1.06)]){ const est = T.tw(t, F.note(s))/(w*m); if(est > maxN + .05 || est < 1.2) continue; const r = T.rows(t, F.note(s), w*m, s*1.42); if(r.n > maxN || r.n < 2) continue;
        if(r.last < .9*w*m || r.ws.slice(0, -1).some(x => x < .8*w*m)) continue;
        const sc = r.n*100 + (near.test(t) ? 60 : 0) + m*20 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc}; } }
    if(best){ best.h = best.n*best.s*1.42 + best.s*.15; best.html = (x, y) => txt('writeup', best.t, x + (w - best.w)/2, y, best.w, best.s, 1.42, F.note, INK, {n: best.n}); }
    return (T.wu[key] = best); };
  // under the house on the tall shapes: the highlights on ring bullets at the left, the agent beside them
  const bulFoot = (D, T, G, HL, w, k) => { const cg = r2(G.g*2), want = hsOn(D);
    for(const nb of [3, 2]) for(const lim of [w*.56, w*.5, w*.44]){ const list = HL.filter(t => bulW(T, t, T.FB) <= lim).slice(0, nb); if(list.length < nb) continue;
      for(let s = r2(T.FB*1.2*k); s >= T.FB - .01; s -= .5){ if(!list.every(x => bulW(T, x, s) <= lim)) continue;
        const bw = Math.max(...list.map(x => bulW(T, x, s))), aw = w - bw - cg, ag = agent1(D, T, G, aw, 1.1*k, 'stack', 0, want ? 1 : 0); if(!ag || ag.ns < T.FB*1.3) continue;
        const rh = s*1.75, h = Math.max(nb*rh, ag.h);
        return {h, nb, list, html: (x, y) => bulList(T, list, x, y + (h - nb*rh)/2, bw, s, rh) + ag.html(x + bw + cg, y + (h - ag.h)/2)}; } }
    return null; };

  // ---------- Just Sold ----------
  // JUST SOLD in the solid pill, w wide, the word as large as the pill's width and cap allow
  const soldPill = (T, w, cap) => { const word = SocialSet.M.toUpperCase(); let ws = Math.floor(cap); while(ws > T.FE && T.tw(word, F.word(ws)) > w - ws*1.1) ws -= 1;
    const BH = r2(ws*1.32); return {h: BH, ws, html: (x, y) => cellM(x, y, w, BH, BH) + wordEl([word], x, y + (BH - inkH(ws, 1))/2, w, ws, ONM, 'center')}; };
  // the status pill: the word, a dot, the street, on one line in the solid main color (the carousel slides)
  const statusPill = (T, G, D, w, max, min) => { const word = SocialSet.M.toUpperCase(), ad = D.listing.address, m = met();
    for(let ws = Math.floor(max*2)/2; ws >= min - .01; ws -= .5){ const as = Math.max(T.FE, r2(ws*.74)), ww = T.tw(word, F.word(ws)), aw = T.tw(ad, F.street(as)) + 2, d = r2(ws*.2), gp = ws*.42, BH = r2(ws*1.65), tot = ww + 2*gp + d + aw;
      if(tot > w - BH*.55) continue;
      return {h: BH, ws, html: (x, y) => { const x0 = x + (w - tot)/2, yi = y + (BH - inkH(ws, 1))/2, by = yi + m.cap*ws;
        return cellM(x, y, w, BH, BH) + wordEl([word], x0, yi, ww + 2, ws, ONM) + `<div class="abs" style="left:${x0 + ww + gp}pt;top:${y + (BH - d)/2}pt;width:${d}pt;height:${d}pt;border-radius:50%;background:${ONM}"></div>`
          + txt('address', ad, x0 + ww + 2*gp + d, by - (m.base*as + as*.1), aw, as, 1.2, F.street, ONM, {html: `<span>${esc(ad)}</span>`}); }}; }
    const ws = T.one(word, F.word, w - 2*G.R, max, min) || min, st = street(T, D.listing, w - 2*G.R, T.FE*1.2, true) || {t: ad, s: T.FE, n: 1, w: w}, pad = r2(G.R*.7), h = inkH(ws, 1) + r2(6*T.f) + stH(st) + 2*pad;
    return {h, ws, html: (x, y) => cellM(x, y, w, h, G.R) + wordEl([word], x, y + pad, w, ws, ONM, 'center') + stTxt(st, x + G.R, y + pad + inkH(ws, 1) + r2(6*T.f), w - 2*G.R, ONM, 'center')}; };
  // the note in the rounded tinted box, w wide: the fullest of the seller notes that sets in minN to maxN lines with every line 80%+
  // and the last 90%+ of the box's measure, at type from s0 up to 12% larger
  const noteBox = (T, G, D, w, s0, minN, maxN) => { const nb = r2(Math.min(10*T.f, 13)), iw = w - 2*nb - 2; if(maxN < minN) return null;
    T.nk = T.nk || {}; const key = [Math.round(w), s0, minN, maxN].join('|'); if(key in T.nk) return T.nk[key];
    const list = T.notes || (T.notes = notes(D)); let pk = null;
    for(let n = Math.min(maxN, 9); n >= minN && !pk; n--) for(const s of [s0, r2(s0*1.06), r2(s0*1.12)]){ if(pk) break; const lh = s*1.45;
      for(const t of list){ const est = T.tw(t, F.note(s))/iw; if(est > n + .05 || est < n - 1.3) continue; const r = T.rows(t, F.note(s), iw, lh); if(r.n !== n) continue;
        if(r.last < .9*iw || r.ws.slice(0, -1).some(x => x < .8*iw)) continue;
        pk = {t, n, s, lh}; break; } }
    if(!pk) return (T.nk[key] = null);
    const h = pk.n*pk.lh + pk.s*.15 + 2*nb;
    return (T.nk[key] = {h, n: pk.n, s: pk.s, len: pk.t.length, html: (x, y) => cellT(x, y, w, h, G.R) + txt('sold.note', pk.t, x + nb + 1, y + nb, iw, pk.s, 1.45, F.note, INK, {n: pk.n})}); };

  const RF = {}, PAPER = {place: '#33364a', street: MAIN};
  // ================= post, pin, story, square =================
  // Just Listed: the main card across the head (JUST / LISTED, the city, the street), the fact pills in a row, the framed house, the
  // writer's lines, then the agent (on a story, the highlights on ring bullets beside the agent). Just Sold: the pill across the head,
  // the framed house, the street and the city, the question on its own centered line, the note in its tinted box, the agent.
  // On a story the house comes first and a frame of room photos fills the foot, under the words.
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), G = geo(W, H), X = heroKit(D, G, shape), sold = D.piece.moment === 'js', story = shape === 'story', sq = shape === 'square', w = W - 2*G.E, x = G.E, g = G.g;
    const END = story ? H - 96 : H - G.E, nat = X.nat(w), mn = X.min(w), FX = facts(D), HL = highlights(D), tk = story ? 1.2 : shape === 'pin' ? 1.05 : 1;
    const agentRow = k => agentIn(D, T, G, w, k, 'row');
    const build = o => {
      if(!sold){ const card = duoCard(T, G, D, w, T.FE*o.ws, sq ? .62 : .8); if(!card) return null;
        const pr = pillFit(T, FX, w, sq ? T.FB : T.FB*1.25*tk); if(!pr) return null;
        const foot = o.bul ? bulFoot(D, T, G, HL, w, tk) : agentRow(tk); if(!foot) return null;
        const wu = o.wl ? writeUp(T, D, w, r2(T.FB*1.04*tk), o.wl, foot.list) : null; if(o.wl && !wu) return null;
        return {card, pr, wu, foot, room: END - G.E - card.h - pr.h - (wu ? wu.h + g : 0) - foot.h - 3*g}; }
      const pill = soldPill(T, w, T.FE*o.ws), ar = addrRow(T, D.listing, w, T.FE*1.3*tk, PAPER); if(!ar) return null;
      const qs = o.q ? T.one(Q, F.q, w, T.FE*1.15*tk, T.FB*1.15) : 0; if(o.q && !qs) return null;
      const nt = noteBox(T, G, D, w, r2(T.FB*1.12*tk), 2, o.n) || noteBox(T, G, D, w, T.FB, 2, o.n + 1); if(!nt) return null;
      const ag = agentIn(D, T, G, w, tk, 'row', pill.ws*.62); if(!ag) return null;
      return {pill, ar, qs, nt, ag, room: END - G.E - pill.h - ar.h - (qs ? qs*1.25 + g*.5 : 0) - nt.h - ag.h - 4.6*g};
    };
    // the fullest arrangement that leaves the house its frame: first at (nearly) the photo's own shape, then with ground trimmed
    const opts = [], each = (sizes, list) => sizes.forEach(ws => list.forEach(o => opts.push(Object.assign({ws}, o))));
    if(!sold){
      if(story) each([3.6, 3.1, 2.6], [{wl: 3, bul: 1}, {wl: 2, bul: 1}, {wl: 3}, {wl: 2}]);
      else if(sq) each([2.6, 2.3, 2, 1.75, 1.5, 1.3], [{wl: 0}]);
      else each([2.6, 2.3, 2, 1.75, 1.5], [{wl: 3, bul: 1}, {wl: 2, bul: 1}, {wl: 3}, {wl: 2}, {wl: 0}]); }
    else {
      if(story) each([3.4, 2.9, 2.5], [{q: 1, n: 5}, {q: 1, n: 4}, {q: 1, n: 3}]);
      else if(sq) each([2.9, 2.5, 2.1, 1.8], [{q: 0, n: 2}]);
      else each([2.9, 2.5, 2.1, 1.8], [{q: 1, n: 3}, {q: 1, n: 2}, {q: 0, n: 2}]); }
    // the arrangement that gives the house its frame, the word its size and the words their room, weighed together
    const extra = story ? 80*T.f + g : 0;
    const all = opts.map(o => { const b = build(o); if(!b) return null; const f = Math.min(.95, (b.room - extra)/nat);
      b.sc = 150*f + 16*o.ws + (b.room - extra < mn ? -60 : 0) + (o.wl ? 5 + 3*o.wl : 0) + (o.bul ? 9 : 0) + (o.q ? 14 : 0) + (o.n ? 2*Math.min(o.n, b.nt ? b.nt.n : 0) : 0); return b; }).filter(Boolean);
    let B = all.slice().sort((a, b) => b.sc - a.sc)[0];
    let h = CSS, y = G.E;
    if(!B){ T.done(); return h + X.hero(x, y, w, Math.min(H - 2*G.E, X.max(w))); }
    const foot = yy => { let s = '';
      if(!sold){ if(B.wu){ s += B.wu.html(x, yy); yy += B.wu.h + g; } s += B.foot.html(x, yy); yy += B.foot.h; }
      else { s += B.ar.html(x, yy); yy += B.ar.h + g*.5; if(B.qs){ s += txt('sold.q', Q, x, yy, w, B.qs, 1.25, F.q, INK, {align: 'center'}); yy += B.qs*1.25 + g*.6; } else yy += g*.1;
        s += B.nt.html(x, yy); yy += B.nt.h + g; s += B.ag.html(x, yy); yy += B.ag.h; }
      return [s, yy]; };
    if(story){
      const ph = Math.max(Math.min(mn, B.room), Math.min(nat, B.room)); h += X.hero(x, y, w, ph); y += ph + g;
      if(!sold){ h += B.card.html(x, y); y += B.card.h + g; h += B.pr.html(x, y, MAIN, INK); y += B.pr.h + g; } else { h += B.pill.html(x, y); y += B.pill.h + g; }
      const r = foot(y); h += r[0]; y = r[1] + g;
      h += X.rooms(x, y, w, H - G.E - y, 2);
    } else {
      const band = X.band(T, x, 0, w, Math.max(B.room, 40)), e = Math.max(0, B.room - band.used)/3, at = yy => band.html.replace(/top:([\d.]+)pt/g, (_, v) => `top:${(+v + yy).toFixed(2)}pt`);
      if(!sold){ h += B.card.html(x, y); y += B.card.h + g; h += B.pr.html(x, y, MAIN, INK); y += B.pr.h + g + e; } else { h += B.pill.html(x, y); y += B.pill.h + g + e; }
      h += at(y); y += band.used + g + e; h += foot(y)[0];
    }
    T.done();
    return h;
  };

  // ================= Google Business, Just Listed =================
  // the framed house at the left with the city, the street and the agent under it; the main card down the right, full height:
  // JUST / LISTED, the four fact pills, the brokerage's logo in white (the postcard back's)
  const gbpJL = (D, L, W, H, shape) => {
    const T = kit(D, shape), G = geo(W, H), X = heroKit(D, G, shape), FX = facts(D), g = G.g, ih = H - 2*G.E, iw = W - 2*G.E - g, pad = r2(G.R*.8), LW2 = words(), m = met(); let best = null;
    for(let fr = .66; fr >= .5; fr -= .02){ const pw = Math.round(iw*fr), cw = iw - pw, ci = cw - 2*pad, innerH = ih - 2*pad;
      const pl = pillFit(T, FX, ci, T.FB*1.2); if(!pl) continue;
      const lh = r2(Math.max(T.FB*2.1, Math.min(ci/3.4, 34*T.f))), g1 = r2(10*T.f);
      let ws = Math.floor((innerH - pl.h - lh - 2*g1)/(m.cap + LW)); while(ws >= T.FE*1.3 && (wide1(T, ws) > ci - 2 || ws > pocketMax(T, 1.5))) ws -= 1; if(ws < T.FE*1.3 || ci - wide1(T, ws) > 16*T.f) continue;
      const a = addr(T, D.listing, pw, T.FE*1.25, PAPER), ag = agentIn(D, T, G, pw, 1.15, 'bare'); if(!a || !ag || pw < W*.45) continue;
      const room = ih - a.h - ag.h - 2*g; if(room < X.min(pw)) continue;
      const ph = Math.min(room, X.max(pw)), rest = room - ph, hollow = innerH - (inkH(ws, 2) + pl.h + lh + 2*g1);
      const sc = pw*ph/(W*H)*1500 + ws*3 - rest*4 - hollow*2;
      if(!best || sc > best.sc) best = {sc, pw, cw, ci, pl, lh, g1, ws, a, ag, ph, rest, hollow};
    }
    if(!best){ T.done(); return tall(D, L, W, H, shape); }
    const {pw, cw, ci, pl, lh, g1, ws, a, ag, ph, rest, hollow} = best, cx = G.E + pw + g, e = rest/3, c = hollow/4; let h = CSS, y = G.E;
    h += X.hero(G.E, y, pw, ph); y += ph + g + e; h += a.html(G.E, y); y += a.h + g + e; h += ag.html(G.E, y);
    y = G.E + pad + c; h += cellM(cx, G.E, cw, ih, G.R) + wordEl(LW2, cx + pad, y, ci, ws, ONM); y += inkH(ws, 2) + g1 + c;
    h += pl.html(cx + pad, y, ONM, ONM); y += pl.h + g1 + c; h += logoBox(D, cx + pad, y, ci, lh, 'dark');
    T.done();
    return h;
  };

  // ================= X, Just Listed =================
  // the main card across the head (JUST / LISTED, the city, the street on one line); under it the framed house at the left, the facts
  // in lines of type and the agent at the right
  const wideJL = (D, L, W, H, shape) => {
    const T = kit(D, shape), G = geo(W, H), X = heroKit(D, G, shape), FX = facts(D), g = G.g, w = W - 2*G.E, gc = r2(g*1.6); let best = null;
    for(const wk of [2, 1.8, 1.6, 1.45, 1.3]){ const card = duoCard(T, G, D, w, T.FE*wk); if(!card) continue; const hb = H - 2*G.E - card.h - g;
      for(let fr = .6; fr >= .36; fr -= .02){ const pw = Math.round((w - gc)*fr), cw = w - gc - pw; if(hb < X.min(pw) || pw < W*.45) continue;
        const fl = factLines(T, FX, cw, T.FB); if(!fl) continue;
        for(const nm of (hsOn(D) ? [1.2] : [1.5, 1.35, 1.2])){ const ag = fitStack(T, () => agentIn(D, T, G, cw, nm/1.5, 'stack', T.FB*nm), hb - fl.h - g); if(!ag) continue;
        const left = hb - fl.h - g - ag.h; if(left < 0) continue;
        const ph = Math.min(hb, X.max(pw)), rest = hb - ph, sc = (nm - 1.2)*60 + pw*ph/(W*H)*1500 + card.ws*3 - rest*4 - left*3 - fl.n*12 - card.slack*2 - Math.max(0, cw - Math.max(fl.w, ag.ww) - 30)*3;
        if(!best || sc > best.sc) best = {sc, card, hb, pw, cw, fl, ag, left, ph, rest}; break; } } }
    if(!best){ T.done(); return tall(D, L, W, H, shape); }
    const {card, pw, cw, fl, ag, left, ph, rest} = best, top = G.E + card.h + g, cx = G.E + pw + gc;
    const h = CSS + card.html(G.E, G.E) + X.hero(G.E, top + rest/2, pw, ph) + fl.html(cx, top + left*.35, MAIN, 'center') + ag.html(cx, H - G.E - ag.h - left*.2);
    T.done();
    return h;
  };

  // ================= Google Business and X, Just Sold =================
  // the framed house at the left; at the right JUST SOLD in its pill, the city and the street, the agent; the note in its tinted box
  // across the foot, full width (two or three full lines)
  const landJS = (D, L, W, H, shape) => {
    const T = kit(D, shape), G = geo(W, H), X = heroKit(D, G, shape), g = G.g, w = W - 2*G.E, gc = r2(g*1.6); let best = null;
    // the note: two or three full lines of the agent's own note; where the image has no height for that (X), the set's one-line note
    const notesTry = [noteBox(T, G, D, w, T.FB, 2, 3), noteBox(T, G, D, w, T.FB, 1, 1)].filter(Boolean);
    // the street and the city on one line across the full width (a street is never split), over the note
    for(const ak of [1.2, 1]){ const ar = addrRow(T, D.listing, w, T.FE*ak, PAPER); if(!ar) continue;
      for(const nt of notesTry){ const ht = H - 2*G.E - nt.h - g - ar.h - g*.7;
        for(let fr = .62; fr >= .44; fr -= .02){ const pw = Math.round((w - gc)*fr), cw = w - gc - pw; if(pw < W*.45 || ht < X.min(pw)) continue;
          const ph = Math.min(ht, X.max(pw)), rest = ht - ph;
          for(const pk of [3.4, 3, 2.6, 2.2, 1.9, 1.6, 1.35, 1.2]){ const pill = soldPill(T, cw, T.FE*pk);
            // the logo under the agent's lines grows into the room the column leaves
            let ag = fitStack(T, () => agentIn(D, T, G, cw, 1.4, 'stack', pill.ws*.62), ht - pill.h - g); if(!ag) continue;
            // (no headshot, and a column much wider than the agent's lines and logo: a framed room photo stands beside them where the
            // headshot would, as tall as they are, so no strip stands empty at their sides)
            if(!ag.hs && (cw - Math.max(ag.gw, ag.lw))*ag.h > .025*W*H){ const rw = Math.round(Math.min(cw*.34, cw - Math.max(ag.gw, ag.lw)*1.02 - g)), a2 = rw > 50 ? fitStack(T, () => agentIn(D, T, G, cw - rw - g, 1.4, 'stack', pill.ws*.62), ht - pill.h - g) : null;
              if(a2) ag = Object.assign({}, a2, {room: rw, html: (x, y) => X.rooms(x, y, rw, a2.h, 1) + a2.html(x + rw + g, y)}); }
            const left = ht - pill.h - ag.h - g;
            const sc = pw*ph/(W*H)*1500 + pill.ws*9 + nt.n*45 + ak*20 - rest*4 - left*3 - Math.max(0, cw - ag.ww - 70)*8;
            if(!best || sc > best.sc) best = {sc, ar, nt, ht, pw, cw, ph, rest, pill, ag, left}; break; } } }
      if(best) break; }
    if(!best){ T.done(); return tall(D, L, W, H, shape); }
    const {ar, nt, ht, pw, cw, ph, rest, pill, ag, left} = best, cx = G.E + pw + gc; let h = CSS;
    // (a logo centered under the lines that would leave a tall empty room under the headshot: the headshot runs the agent's full
    // height, beside the lines and the logo)
    T.hsTall = ag.hs && ag.lgL*(ag.lh + ag.gapB) > .022*W*H ? 1 : 0;
    h += X.hero(G.E, G.E + rest/2, pw, ph) + pill.html(cx, G.E) + ag.html(cx, G.E + pill.h + g + left); T.hsTall = 0;
    h += ar.html(G.E, G.E + ht + g*.7) + nt.html(G.E, H - G.E - nt.h);
    T.done();
    return h;
  };
  RF.portrait = tall;
  RF.landscape = (D, L, W, H, shape) => D.piece.moment === 'js' ? landJS(D, L, W, H, shape) : shape === 'wide' ? wideJL(D, L, W, H, shape) : gbpJL(D, L, W, H, shape);

  // ================= carousel photo slides: the room in its rounded frame, the status pill under it =================
  RF.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), G = geo(W, H), X = heroKit(D, G, 'slide'), w = W - 2*G.E;
    const pill = statusPill(T, G, D, w, T.FE*1.5, T.FE), ph = H - 2*G.E - G.g - pill.h;
    const h = CSS + X.cell(D.piece.photo, G.E, G.E, w, ph) + pill.html(G.E, G.E + ph + G.g);
    T.done();
    return h;
  };
  window.RFSocial = RF;
})();
