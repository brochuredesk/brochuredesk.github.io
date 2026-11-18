/* templates/chevron/cv-social.js: Chevron's own Just Sold social images (owner 11/18/2026: the socials "fit the style, look and feel of
   the designs of the main pieces"). Just Listed keeps the approved shared layout (templates/_shared/socialset.js + the V overlay in
   social.html); only moment "js" comes here, and only the six place shapes (carousel slides stay the engine's).

   Read off the approved Just Sold postcard front (postcard.html) and the approved Just Listed socials:
     - the house with its foot cut into the wide V and the gold echo line (the overlay in social.html draws both, as on Just Listed)
     - JUST SOLD in giant white Sora 700 caps, always far bigger than the agent: one line across the main-color band on the tall
       shapes (the Just Listed band, grown), stacked JUST / SOLD in the main-color column on wide and Google Business (the postcard's stack)
     - the gold rule-diamond-rule divider, the street smaller than the word
     - the seller question in the postcard's white box with the gold edge: "Thinking about selling?" in the main color, the note under it
     - the agent as on the postcard: name, REALTOR(R) in gold caps beside the phone, one logo
   Rules carried: no beds, baths or square feet on Just Sold, no price, no broker address, the whole house (the engine's house-cut check
   runs on every frame), text at the phone floors of templates/_shared/readsize.js (16 px word and street, 12 px body, 10 px small). */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const Q = 'Thinking about selling?';
  const F = {
    word: s => `font:700 ${s}pt 'Sora';letter-spacing:${(s*.035).toFixed(2)}pt;text-transform:uppercase`,
    street: s => `font:700 ${s}pt 'Sora'`,
    place: s => `font:500 ${s}pt 'Sora';text-transform:uppercase;letter-spacing:${(s*.3).toFixed(2)}pt`,
    q: s => `font:700 ${s}pt 'Sora'`,
    note: s => `font:400 ${s}pt 'Sora'`,
    name: s => `font:700 ${s}pt 'Sora'`,
    tag: s => `font:500 ${s}pt 'Sora';text-transform:uppercase;letter-spacing:${(s*.14).toFixed(2)}pt`,
    phone: s => `font:500 ${s}pt 'Sora'`,
  };
  const CSS = `<style>
    .ss .cvs-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ss .cvs-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .cvs-logo .text{font:700 12pt/1.15 'Sora';text-align:center;color:inherit}
    .ss .cvs-hs{position:absolute;overflow:hidden}.ss .cvs-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .cvs-caps{position:absolute;white-space:nowrap}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2};
    const M = document.createElement('div'); document.body.appendChild(M);
    const tmemo = new Map();
    T.tw = (t, css) => { const key = t + '|' + css; if(tmemo.has(key)) return tmemo.get(key); M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:nowrap;${css}`; M.textContent = t; const v = M.getBoundingClientRect().width*.75; tmemo.set(key, v); return v; };
    // a centered paragraph at width w: its line count, widest line and last line (pt)
    const memo = new Map();   // the layouts try many sizes and widths: each measure is taken once
    T.rows = (t, css, w, lh) => { const key = t + '|' + css + '|' + w.toFixed(1) + '|' + lh.toFixed(2); if(memo.has(key)) return memo.get(key);
      M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:normal;width:${w}pt;${css};line-height:${lh}pt;text-align:center`; M.textContent = t;
      const rg = document.createRange(); rg.selectNodeContents(M); const out = [];
      [...rg.getClientRects()].forEach(b => { if(b.width < .5) return; const r = out.find(x => Math.abs(x.top - b.top) < b.height*.5); if(r){ r.l = Math.min(r.l, b.left); r.r = Math.max(r.r, b.right); } else out.push({top: b.top, l: b.left, r: b.right}); });
      out.sort((a, b) => a.top - b.top); const ws = out.map(r => (r.r - r.l)*.75);
      const res = {n: out.length, ws, wide: Math.max(1, ...ws), last: ws[ws.length - 1] || 0}; memo.set(key, res); return res;
    };
    T.one = (t, face, w, max, min) => { for(let s = Math.ceil(Math.max(max, min)*2 - .02)/2; s >= min - .01; s -= .5) if(T.tw(t, face(s)) <= w) return s; return null; };
    T.done = () => M.remove();
    return T;
  };
  // Sora's capitals, measured on the page: the cap height and where the baseline falls in a line box as tall as the type (both in em),
  // so capitals can be set by their ink, not their line box
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = "700 200px 'Sora'";
    const p = document.createElement('div'); p.style.cssText = "position:absolute;left:-9999px;top:0;font:700 200px 'Sora';line-height:200px;white-space:nowrap";
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}; return MET; };
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'center'}">${o.html || esc(t)}</div>`; };
  // capitals set by their ink: the top of the first line's letters at y; the ink runs capsH(s, n, lhK) down from there
  const capsH = (s, n, lhK) => (n - 1)*s*lhK + met().cap*s;
  const caps = (slot, lines, x, y, w, s, lhK, color, track) => { const m = met(), L = s*lhK, base = (L - s)/2 + m.base*s;
    return `<div class="cvs-caps" data-slot="${slot}" data-lines="${lines.length}" style="left:${x}pt;top:${y - (base - m.cap*s)}pt;width:${w}pt;height:${lines.length*L}pt;${F.word(s)};${track ? `letter-spacing:${(s*track).toFixed(2)}pt;` : ''}line-height:${L}pt;color:${color};text-align:center;text-indent:${(s*(track || .035)).toFixed(2)}pt">${lines.map(esc).join('<br>')}</div>`; };
  // the postcard's divider: rule, diamond, rule in the accent
  const divider = (cx, y, len, d, color) => rect(cx - len - d*1.5, y + d*.7 - .6, len, 1.2, `background:${color}`) + rect(cx + d*1.5, y + d*.7 - .6, len, 1.2, `background:${color}`)
    + `<div class="abs" style="left:${cx - d/2}pt;top:${y + d*.2}pt;width:${d}pt;height:${d}pt;background:${color};transform:rotate(45deg)"></div>`;
  const divH = d => d*1.4;
  // a color as [r, g, b]; the question's color: the brand's main where it reads on white, else near-black
  const rgbOf = c => { const p = document.createElement('div'); p.style.color = c; document.body.appendChild(p); const v = getComputedStyle(p).color; p.remove();
    const n = (v.replace(/^color\(srgb/, '').match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number); return /^color\(srgb/.test(v) ? n.map(x => x*255) : n; };
  const lum = c => { const v = rgbOf(c).map(q => { q /= 255; return q <= .03928 ? q/12.92 : Math.pow((q + .055)/1.055, 2.4); }); return .2126*v[0] + .7152*v[1] + .0722*v[2]; };
  const onWhite = c => (1.05)/(lum(c) + .05) >= 3 ? c : '#161616';

  // the seller notes, fullest first: the postcard's own (sw.pc.js.front.note2), then shorter ones for a small box
  const notes = D => { const F0 = ((((D.sw || {}).pc || {}).js || {}).front || {}), n2 = [].concat(F0.note2 || []).map(String);
    const tail = n2.map(t => t.split(/(?<=[.!?])\s+/).slice(1).join(' ')).filter(Boolean);
    return n2.concat(['I can tell you what your own home could bring in today’s market.'], tail, ['I can tell you what your home could bring today.', ((D.companion || {}).justSold || {}).ctaNext || 'Call or text me anytime.', 'Call or text me anytime.'])
      .filter((t, i, a) => t && a.indexOf(t) === i && !SocialSet.CONDITION.test(t)).map(t => t.replace(/(^|\s)(I|a|A)\s/g, '$1$2\u00a0')); };

  // ---------- the white box with the gold edge: the question and the note ----------
  // nl: the most note lines; the note is the fullest one whose lines balance (the last at least 78% of the widest)
  const sellBox = (D, T, w, k, nl) => {
    const pad = r2(8*T.f*Math.min(k, 1.25)), iw = w - 2*pad - 3;
    let ql = [Q], qs = T.one(Q, F.q, iw, T.FB*1.5*k, T.FB);
    if(!qs){ ql = ['Thinking about', 'selling?']; qs = T.one(ql[0], F.q, iw, T.FB*1.5*k, T.FB); if(!qs) return null; }
    // the note: the fullest one at nl lines or fewer; every line 80%+ of its measure and the last 90%+ (owner 11/8), the measure
    // narrowed a little or the type raised up to 13% to get there
    const ns0 = r2(Math.max(T.FB*1.08, T.FB*1.15*k)); let pk = null;
    for(let n = nl; n >= 1 && !pk; n--) for(const mK of [1, .94, .88, .82, .76, .7]){ for(let ns = ns0; ns <= ns0*1.13 + .01 && !pk; ns += .5) for(const t of notes(D)){
        const m = iw*mK, r = T.rows(t, F.note(ns), m, ns*1.38); if(r.n !== n) continue;
        if(n === 1 ? r.wide < .8*m : (r.last < .9*m || r.ws.slice(0, -1).some(x => x < .8*m))) continue;
        pk = {t, n, ns, w: m}; break; }
      if(pk) break; }
    if(nl > 0 && !pk) return null;
    const lh = pk ? pk.ns*1.38 : 0, qh = ql.length*qs*1.22, h = 2*pad + qh + (pk ? 3*T.f + pk.n*lh + pk.ns*.15 : 0);
    const html = (x, y, ink) => { let s = `<div class="abs" data-sellbox="1" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;background:#fff;border:1.5pt solid var(--ss-acc);box-sizing:border-box"></div>`, yy = y + pad;
      ql.forEach((t, i) => { s += txt('sold.q' + (i ? 2 : ''), t, x + pad, yy, w - 2*pad, qs, 1.22, F.q, ink); yy += qs*1.22; });
      if(pk) s += txt('sold.note', pk.t, x + (w - pk.w)/2, yy + 3*T.f, pk.w, pk.ns, 1.38, F.note, '#1b1b1b', {n: pk.n});
      return s; };
    return {h, len: pk ? pk.t.length : 0, n: pk ? pk.n : 0, q1: ql.length === 1, html};
  };

  // ---------- the agent, as on the postcard: name, REALTOR(R) beside the phone, the logo ----------
  // mode 'row': the lines at the left (after the headshot), a hairline, the logo at the right (the Just Listed socials' card)
  // mode 'stack': centered, the logo under the lines; with a headshot the photo stands at the left of that stack
  const agent = (D, T, w, k, mode) => {
    const A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || '');
    const gap = 10*T.f, ink = 'var(--ss-ink)', acc = 'var(--ss-acc)';
    const sizes = cw => { const ns = T.one(A.name || '', F.name, cw, T.FB*1.5*k, T.FB*1.1), ps0 = r2(Math.max(T.FB, T.FB*1.18*k)), ds = r2(Math.max(T.FS, T.FS*k)); if(!ns) return null;
      const dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0; let ps = null, inl = true;
      for(let s = ps0; s >= T.FB - .01 && !ps; s -= .5) if(dW + (nar ? s*.6 : 0) + T.tw(A.phone || '', F.phone(s)) <= cw) ps = s;
      if(!ps){ inl = false; ps = T.one(A.phone || '', F.phone, cw, ps0, T.FB); if(!ps) return null; }
      return {ns, ps, ds, dW, inl, th: ns*1.16 + 2*T.f + (inl || !nar ? 0 : ds*1.3 + T.f) + ps*1.3}; };
    const lines = (S, x, y, cw, al) => { let s = txt('agent.name', A.name || '', x, y, cw, S.ns, 1.16, F.name, ink, {align: al}), yy = y + S.ns*1.16 + 2*T.f;
      const pw = T.tw(A.phone || '', F.phone(S.ps));
      if(S.inl && nar){ const tot = S.dW + S.ps*.6 + pw, x0 = al === 'left' ? x : x + (cw - tot)/2;
        s += txt('agent.desig', 'REALTOR®', x0, yy + S.ps*1.3*.78 - S.ds*1.3*.78, S.dW + 2, S.ds, 1.3, F.tag, acc, {small: 1, align: 'left'});
        s += txt('agent.phone', A.phone || '', x0 + S.dW + S.ps*.6, yy, pw + 2, S.ps, 1.3, F.phone, ink, {align: 'left'}); }
      else { if(nar){ s += txt('agent.desig', 'REALTOR®', x, yy, cw, S.ds, 1.3, F.tag, acc, {small: 1, align: al}); yy += S.ds*1.3 + T.f; }
        s += txt('agent.phone', A.phone || '', x, yy, cw, S.ps, 1.3, F.phone, ink, {align: al}); }
      return s; };
    const logo = (x, y, lw, lh) => `<div class="abs cvs-logo" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${ink}">${OHL.logo(D, 'dark', '')}</div>`;
    const hs = (x, y, hw, hh) => `<div class="abs cvs-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    if(mode === 'row'){
      const lw = Math.min(w*.34, 150*T.f);
      for(const h0 of (hsOn ? [1, 0] : [0])){
        const probe = sizes(w), hsW = h0 && probe ? Math.round(probe.th*.8) : 0, cw = w - lw - 2*gap - (h0 ? hsW + gap : 0), S = sizes(cw); if(!S) continue;
        return {h: S.th, html: (x, y) => (h0 ? hs(x, y, hsW, S.th) : '') + lines(S, x + (h0 ? hsW + gap : 0), y, cw, 'left')
          + rect(x + w - lw - gap, y + 2, .6, S.th - 4, `background:${ink};opacity:.3`) + logo(x + w - lw + gap*.2, y, lw - gap*.2, S.th)};
      }
      return null;
    }
    for(const h0 of (hsOn ? [1, 0] : [0])){
      const p0 = sizes(w); if(!p0) return null;
      const lh = r2(Math.max(p0.ns*1.35, T.FB*2)), full0 = p0.th + 7*T.f + lh, hsW = h0 ? Math.round(full0*.74) : 0, cw = w - (h0 ? hsW + gap : 0), S = sizes(cw); if(!S) continue;
      const full = S.th + 7*T.f + lh, lw = Math.min(cw, lh*4.2);
      // the stack is as wide as its widest line, so the photo and the lines sit centered together
      const tWd = Math.min(cw, Math.max(T.tw(D.agent.name || '', F.name(S.ns)), S.inl ? S.dW + S.ps*.6 + T.tw(A.phone || '', F.phone(S.ps)) : T.tw(A.phone || '', F.phone(S.ps)), lw)) + 2;
      return {h: full, html: (x, y) => { const tot = (h0 ? hsW + gap : 0) + tWd, x0 = x + (w - tot)/2, tx = x0 + (h0 ? hsW + gap : 0);
        return (h0 ? hs(x0, y, hsW, full) : '') + lines(S, tx, y, tWd, 'center') + logo(tx + (tWd - lw)/2, y + S.th + 7*T.f, lw, lh); }};
    }
    return null;
  };

  // ---------- the hero and the room photos ----------
  const heroKit = (D, f) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const photo = (pid, x, y, w, ht) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${ht}pt`);
    const sup = n => window.OHEmail ? OHEmail.support(D, id, n) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)).slice(0, n);
    return {id, pAR,
      min: w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)),
      max: w => Math.ceil(hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : w/pAR),   // taller crops the sides, never the house
      hero: (x, y, w, ht) => { if(hb && ht > w/pAR){ const vis = w/(ht*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return photo(id, x, y, w, ht); },
      row: (x, y, w, ht, n, skip) => { const ids = sup(n + (skip || 0)).slice(skip || 0); if(!ids.length || ht < 30) return ''; const g = 4*f, pw = (w - (ids.length - 1)*g)/ids.length; return ids.map((p, i) => photo(p, x + i*(pw + g), y, pw, ht)).join(''); }};
  };
  // the street, never shortened (owner 11/18/2026): one line down to the floor size, else two lines at the floor (the last two
  // words stay together), else one line under the floor
  const street = (T, Li, w, max) => { const t = Li.address, s = T.one(t, F.street, w, max, T.FE);
    if(s) return {t, s, n: 1};
    const t2 = t.replace(/\s+(\S+)\s*$/, '\u00a0$1');
    if(T.rows(t2, F.street(T.FE), w, T.FE*1.2).n <= 2) return {t: t2, s: T.FE, n: 2};
    return {t, s: T.one(t, F.street, w, T.FE, 10) || 10, n: 1}; };
  // set inside a span, so the shared address pass (templates/_shared/addressfit.js) leaves the street as written
  const stTxt = (st, x, y, w, color) => txt('address', st.t, x, y, w, st.s, 1.2, F.street, color, {n: st.n, html: `<span>${esc(st.t)}</span>`});
  const stH = st => st.n*st.s*1.2 + (st.n > 1 ? st.s*.15 : 0);
  const echoGap = w => Math.max(6, w*.018) + Math.max(1.6, w*.006) + 3;   // room under the V for the overlay's gold echo line

  const SOLD = {};
  // ---------- post, pin, square, story ----------
  // post, pin, square: the band with JUST SOLD across it, the house with the V foot, the street, the divider, the seller box, the agent.
  // story: the house from the top edge, then the band and the rest inside the text-safe middle, two rooms to the bottom edge.
  SOLD.portrait = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, story = shape === 'story', BOT = story ? H - 94 : H;
    const pad = r2(16*f), x = pad, w = W - 2*pad, g = r2(8*f), ink = 'var(--ss-ink)', acc = 'var(--ss-acc)', qInk = onWhite('var(--ss-band)');
    const wMax = T.one('JUST SOLD', F.word, w - 2, 110, FE);
    const build = (k, o, hw) => {
      const ws = Math.max(FE, r2(wMax*Math.min(1, .62 + .38*k))), bp = r2(13*f*Math.min(k, 1.2)), bandH = capsH(ws, 1, 1) + 2*bp;
      const st = street(T, Li, w, FE*1.75*k);
      const pl = o.place ? {t: OHL.place(Li), s: T.one(OHL.place(Li), F.place, w, FS*1.25*k, FS)} : null; if(pl && !pl.s) return null;
      // square: the street at the left and the place at the right of one line (the row the Just Listed set's Just Sold uses), so the line runs the full width
      if(pl && shape === 'square'){ pl.row = st.n === 1 && T.tw(st.t, F.street(st.s)) + T.tw(pl.t, F.place(pl.s)) + 14*f <= w; if(!pl.row) return null; }
      const d = r2(5*f*Math.min(k, 1.3)), bx = sellBox(D, T, w, k, o.nl); if(!bx) return null;
      const ag = agent(D, T, w, k, 'row'); if(!ag) return null;
      const eg = echoGap(hw);
      const text = stH(st) + (pl && !pl.row ? 2*f + pl.s*1.3 : 0) + (o.div ? g*.7 + divH(d) : 0) + g + bx.h + g*1.2 + ag.h;
      const fixed = bandH + eg + g*.5 + text + (story ? g : pad*.75);
      return {ws, bp, bandH, st, pl, d, bx, ag, eg, text, room: BOT - fixed};
    };
    const opts = (story || shape === 'pin' ? [3, 2, 1] : shape === 'post' ? [3, 2, 1] : [3, 2, 1]).flatMap(nl => [{nl, div: 1, place: 1}].concat(nl === 2 ? [{nl: 2, div: 0, place: 1}] : [])).concat([{nl: 1, div: 0, place: 1}, {nl: 1, div: 0, place: 0}, {nl: 0, div: 0, place: 0}]);
    const KMAX = {post: 1.5, pin: 1.6, story: 1.5, square: 1.25}[shape] || 1.3, KMIN = .6;
    let pick = null;
    for(const o of opts){
      for(const sc of [1, .78, .7].concat(o.nl === 2 ? [.66] : [])){   // (.66: the house a little narrower, the rooms beside it wider, where that keeps a second full line of the note)
        const hw = Math.round(W*sc), b1 = build(KMIN, o, hw); if(!b1) continue;
        const pmin = X.min(hw), pnat = Math.ceil(hw/X.pAR); if(b1.room < pmin) continue;
        const need = Math.min(b1.room, story ? pnat : pmin + .6*(pnat - pmin));
        let k = KMIN; for(let t = KMAX; t >= KMIN; t -= .025){ const b = build(t, o, hw); if(b && b.room >= need){ k = t; break; } }
        pick = {o, k, hw}; break;
      }
      if(pick) break;
    }
    pick = pick || {o: {nl: 0, div: 0, place: 0}, k: KMIN, hw: W};
    const {o, k, hw} = pick, B = build(k, o, hw) || build(KMIN, {nl: 0, div: 0, place: 0}, hw);
    let ph = Math.min(story ? Math.ceil(hw/X.pAR) : X.max(hw), B.room), spare = B.room - ph;
    const sideW = W - hw - 4*f, side = hw < W && sideW >= 50*f;
    const heroAt = y => side ? X.hero(0, y, hw, ph) + X.row(hw + 4*f, y, sideW, ph, 1) : X.hero((W - hw)/2, y, hw, ph);
    // room the house cannot take: two rooms along the bottom edge when there is enough of it, else it opens the spacing
    const rowH = story ? 0 : spare >= 64*f ? spare - g*.6 : 0, gs = story || rowH ? 0 : spare/4;
    let h = CSS, y = 0;
    const band = y0 => { h += rect(0, y0, W, B.bandH, 'background:var(--ss-band)') + caps('moment', ['Just Sold'], x, y0 + B.bp, w, B.ws, 1, 'var(--ss-bandink)'); };
    if(story){ h += heroAt(0); y = ph + B.eg; band(y); y += B.bandH + g*.5; }
    else { band(0); y = B.bandH; h += heroAt(y); y += ph + B.eg + g*.5 + gs; }
    if(B.pl && B.pl.row){ const sw = T.tw(B.st.t, F.street(B.st.s)) + 2, pw2 = T.tw(B.pl.t, F.place(B.pl.s)) + 2;
      h += txt('address', B.st.t, x, y, sw, B.st.s, 1.2, F.street, ink, {align: 'left', html: `<span>${esc(B.st.t)}</span>`}) + txt('place', B.pl.t, x + w - pw2, y + B.st.s*1.2*.8 - B.pl.s*1.3*.8, pw2, B.pl.s, 1.3, F.place, acc, {small: 1, align: 'right'}); y += stH(B.st); }
    else h += stTxt(B.st, x, y, w, ink), y += stH(B.st);
    if(B.pl && !B.pl.row){ y += 2*f; h += txt('place', B.pl.t, x, y, w, B.pl.s, 1.3, F.place, acc, {small: 1}); y += B.pl.s*1.3; }
    if(o.div){ y += g*.7; h += divider(W/2, y, w/2 - B.d*1.5, B.d, acc); y += divH(B.d); }   // the rules run the width of the box under them
    y += g + gs; h += B.bx.html(x, y, qInk); y += B.bx.h + g*1.2 + gs;
    h += B.ag.html(x, y); y += B.ag.h;
    if(story) h += X.row(0, y + g, W, H - y - g, 2, side ? 1 : 0);
    else if(rowH) h += X.row(0, H - rowH, W, rowH, 2, side ? 1 : 0);
    T.done();
    return h;
  };

  // ---------- wide (X) and Google Business Profile: the postcard's own arrangement ----------
  // the house at the left with the V foot and the agent under it on the dark field; the main-color column at the right with
  // JUST / SOLD stacked, the divider, the street and the seller box
  SOLD.landscape = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, pad = r2(11*f), g = r2(8*f);
    const ink = 'var(--ss-bandink)', acc = 'var(--ss-bandacc)', qInk = onWhite('var(--ss-band)');
    // the column at width W - pw: the word at wk of the column's width, the rest at scale k, the box with up to nl note lines
    const col = (pw, k, nl, wk) => {
      const iw = W - pw - 2*pad, wMax = Math.min(T.one('JUST', F.word, iw - 2, 160, FE) || 0, T.one('SOLD', F.word, iw - 2, 160, FE) || 0); if(!wMax) return null;
      // wk 0: JUST SOLD on one line across the column (a wide column, where the stacked word would leave its sides empty)
      const one = !wk, ws = one ? T.one('JUST SOLD', F.word, iw - 2, 160, FE) : Math.max(FE*1.5, r2(wMax*wk)), wordH = capsH(ws, one ? 1 : 2, 1.0);
      if(!one && T.tw('SOLD', F.word(ws)) < iw*.62) return null;   // a stacked word fills most of its column
      const st = street(T, Li, iw, FE*1.25*k); if(st.s < FE - .01) return null;
      const d = r2(5*f*Math.min(k, 1.3)), bx = sellBox(D, T, iw, k, nl); if(!bx) return null;
      return {iw, ws, one, wordH, st, d, bx, h: wordH + divH(d) + stH(st) + bx.h, gaps: g + g*.6 + g*1.2};
    };
    // every column that fits; the one with the fullest note, then the largest word and photo and the least room left over
    let pick = null;
    // (owner 11/18: the question on one line and two or three full lines of the real note come first; the column widens for them)
    for(let fr = shape === 'wide' ? .58 : .6; fr >= .36; fr -= .02){
      const pw = Math.round(W*fr), a1 = agent(D, T, pw - 2*pad, .7, 'stack'); if(!a1 || H - a1.h - echoGap(pw) - 1.2*pad < X.min(pw)) continue;
      for(const nl of [3, 2, 1, 0]) for(const wk of [1, .9, .8, .7, 0]) for(const k of [1.5, 1.3, 1.15, 1, .85, .7, .55]){
        const c = col(pw, k, nl, wk); if(!c || c.h + c.gaps > H - 1.7*pad) continue;
        const left = H - 1.7*pad - c.h - c.gaps, sc = (c.bx.q1 ? 260 : 0) + (c.bx.n >= 2 ? 320 : c.bx.n ? 120 : 0) + Math.min(c.bx.len, 120) + (wk ? wk*120 : 70) + k*20 + fr*60 - left*3;
        if(!pick || sc > pick.sc) pick = {pw, C: c, sc}; break; }
    }
    pick = pick || {pw: Math.round(W*.5), C: col(Math.round(W*.5), .5, 0, 0)};
    const {pw, C} = pick;
    // the left side: the house takes the height it can, the agent fills what is left under it
    const aw = pw - 2*pad, eg = echoGap(pw); let A = agent(D, T, aw, .7, 'stack');
    // the photo at its own shape first, so the agent's lines can grow to fill the field; then the photo takes any room they leave
    const nat = Math.max(X.min(pw), Math.min(Math.ceil(pw/X.pAR), H - (A ? A.h : 0) - eg - 1.2*pad));
    for(let t = 1.85; t > .7; t -= .025){ const q = agent(D, T, aw, t, 'stack'); if(q && q.h <= H - nat - eg - 1.1*pad){ A = q; break; } }
    const top = Math.max(nat, Math.min(X.max(pw), H - (A ? A.h : 0) - eg - 1.3*pad));
    let h = CSS + X.hero(0, 0, pw, top) + rect(pw, 0, W - pw, H, 'background:var(--ss-band)');
    // room over the agent that neither the photo nor the lines can take: the divider stands in it and the agent sits under it
    const spareA = A ? H - top - eg - A.h - pad : 0, dv = spareA > 16*f ? r2(5*f) : 0;
    if(dv) h += divider(pw/2, top + eg + (spareA - divH(dv))*.3, aw/2 - dv*1.5, dv, 'var(--ss-acc)');
    if(A) h += A.html(pad, dv ? top + eg + (spareA - divH(dv))*.3 + divH(dv) + (spareA - divH(dv))*.3 : top + eg + (H - top - eg - A.h)/2 - pad*.1);
    // room left over opens every space in the column alike, so no one band of it stands empty
    const cx = pw + pad, e = Math.max(0, H - C.h - C.gaps - 1.7*pad)/5; let y = pad*.85 + e;
    h += caps('moment', C.one ? ['Just Sold'] : ['Just', 'Sold'], cx, y, C.iw, C.ws, 1.0, ink); y += C.wordH + g + e;
    h += divider(pw + (W - pw)/2, y, C.iw/2 - C.d*1.5, C.d, acc); y += divH(C.d) + g*.6 + e;
    h += stTxt(C.st, cx, y, C.iw, ink); y += stH(C.st) + g*1.2 + e;
    h += C.bx.html(cx, y, qInk);
    T.done();
    return h;
  };
  // ---------- carousel photo slides (owner 11/18/2026: every slide carries the set's signature) ----------
  // the room photo with its foot cut into the wide V and the gold echo line under it; on the dark field the rule-diamond-rule
  // divider, JUST SOLD in gold caps and the street in white
  SOLD.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), {f, FE} = T, pad = r2(16*f), w = W - 2*pad, acc = 'var(--ss-acc)', Li = D.listing;
    const ws = r2(FE*1.25), d = r2(5.5*f), g = r2(8*f), wf = z => F.word(z).replace(/letter-spacing:[^;]+/, `letter-spacing:${(z*.14).toFixed(2)}pt`);
    // the caption and the street on one line under the divider (the caption at the left, the street at the right end) when the line
    // holds both at full size; else the caption over the street, centered
    const wW = T.tw(SocialSet.M.toUpperCase(), wf(ws)), s1 = T.one(Li.address, F.street, w - wW - 16*f, FE*1.75, FE*1.55), row = !!s1;
    const st = row ? {t: Li.address, s: s1, n: 1} : street(T, Li, w, FE*1.75);
    const foot = g*1.5 + divH(d) + g + (row ? stH(st) : capsH(ws, 1, 1) + g*1.1 + stH(st)) + pad*.9, V = 30, eg = echoGap(W), ph = H - foot - eg;
    const cut = [[0, 0], [1, 0], [1, 1 - V/ph], [.5, 1], [0, 1 - V/ph]], off = Math.max(6, W*.018), sw = Math.max(1.6, W*.006);
    let h = CSS + OHL.maskedPhoto(D, D.piece.photo, `left:0;top:0;width:${W}pt;height:${ph}pt`, cut);
    h += `<svg class="abs" style="left:0;top:0;width:${W}pt;height:${H}pt;overflow:visible;pointer-events:none" viewBox="0 0 ${W} ${H}"><polyline points="0,${(ph - V + off).toFixed(2)} ${W/2},${(ph + off).toFixed(2)} ${W},${(ph - V + off).toFixed(2)}" fill="none" stroke="${acc}" stroke-width="${sw}" stroke-linejoin="miter" stroke-miterlimit="10"/></svg>`;
    let y = ph + eg + g*1.5;
    h += divider(W/2, y, w/2 - d*1.5, d, acc); y += divH(d) + g;
    if(row){ const sw2 = T.tw(st.t, F.street(st.s)) + 2, m = met(), base = (st.s*1.2 - st.s)/2 + m.base*st.s;   // both on the street's baseline
      h += caps('moment', [SocialSet.M], pad, y + base - m.cap*ws, wW + 2, ws, 1, acc, .14).replace('text-align:center', 'text-align:left').replace(/text-indent:[^;"]+/, 'text-indent:0')
        + txt('address', st.t, pad + w - sw2, y, sw2, st.s, 1.2, F.street, 'var(--ss-ink)', {align: 'right', html: `<span>${esc(st.t)}</span>`}); }
    else { h += caps('moment', [SocialSet.M], pad, y, w, ws, 1, acc, .14); y += capsH(ws, 1, 1) + g*1.1; h += stTxt(st, pad, y, w, 'var(--ss-ink)'); }
    T.done();
    return h;
  };
  window.CVSold = SOLD;
})();
