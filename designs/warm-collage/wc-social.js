/* templates/warm-collage/wc-social.js: Warm Collage's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on
   piece matches its set's main pieces). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and replaces its three
   layouts for this set only; nothing shared changes.

   Read off the approved Warm Collage pieces (postcard.html, flyer.html, wc-tokens.css, wc-marks.css):
     - one collage of tiles on the mat (a tint of the main color): photos with square corners and solid blocks, the mat showing only as
       the gutter between tiles; tiles run off the edges of the image
     - the main-color block that names the piece: JUST / LISTED stacked (JUST SOLD on one line across the image) in Bitter 700 caps,
       the place in tracked Schibsted Grotesk caps over it
     - the accent anchor bar set inside the main block at its foot: the street in Bitter 700, the facts in small tracked caps under it
       (Just Listed) or the place at its right end (Just Sold)
     - the dark blocks: the agent (headshot where the agent has one, name in Bitter, the phone, REALTOR(R) in accent caps, the white
       logo); on Just Listed the house's highlights with small accent squares and the writer's lines; on Just Sold "Thinking about
       selling?" over the seller note
     - the house as its own tile, never cut and never cropped to less than two thirds of its photo; room photos as more tiles
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house in every frame (the engine's
   house-cut check), text at the phone floors of templates/_shared/readsize.js. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const BIT = "'Bitter'", SG = "'Schibsted Grotesk'";
  const C = {main: 'var(--wcs-main)', dark: 'var(--wcs-dark)', acc: 'var(--wcs-accent)', onM: 'var(--wcs-on-main)', onD: 'var(--wcs-on-dark)', onA: 'var(--wcs-on-accent)',
    accD: 'var(--wcs-acc-on-dark)', softD: 'var(--wcs-soft-dark)', softM: 'var(--wcs-soft-main)', hairD: 'var(--wcs-hair-dark)'};
  const Q = 'Thinking about selling?';
  // words set on a color block are that tile's own (a badge on it), never the caption of the photo tile over it: the shared caption
  // checks (captionrow.js, captionfill.js) leave elements so marked alone
  const BADGE = 'wcs-badge';
  const F = {
    word: s => `font:700 ${s}pt ${BIT};letter-spacing:.2pt;text-transform:uppercase`,
    street: s => `font:700 ${s}pt ${BIT}`,
    caps: (s, tr) => `font:600 ${s}pt ${SG};text-transform:uppercase;letter-spacing:${(s*(tr == null ? .14 : tr)).toFixed(2)}pt`,
    fact: s => `font:600 ${s}pt ${SG};letter-spacing:.2pt`,
    bul: s => `font:500 ${s}pt ${SG}`,
    note: s => `font:400 ${s}pt ${SG}`,
    name: s => `font:700 ${s}pt ${BIT}`,
    phone: s => `font:600 ${s}pt ${SG};letter-spacing:.4pt`,
    tag: s => `font:700 ${s}pt ${SG};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`,
  };
  const CSS = `<style>
    .ss .wcs-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ss .wcs-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .wcs-logo .text{font:700 12pt/1.15 ${BIT};text-align:center;color:inherit}
    .ss .wcs-hs{position:absolute;overflow:hidden}.ss .wcs-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .wcs-caps{position:absolute;white-space:nowrap}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, v: SHOWN[shape] ? Math.min(f, 1.15) : f, u: SHOWN[shape] ? Math.min(f, 1.4) : f, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2};
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
    // the largest size from max down to min (half points) at which t sets in w on one line
    T.one = (t, face, w, max, min) => { let s = Math.ceil(Math.max(max, min)*2 - .02)/2; const w0 = T.tw(t, face(s)); if(w0 > w) s = Math.max(min, Math.floor(s*w/w0*2)/2 + .5);
      for(; s >= min - .01; s -= .5) if(T.tw(t, face(s)) <= w) return s; return null; };
    T.done = () => M.remove();
    return T;
  };
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = `700 200px ${BIT}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:700 200px ${BIT};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}; return MET; };
  const capH = s => met().cap*s;
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}${o.cls ? ' ' + o.cls : ''}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  // one line of capitals set by its ink: the top of the letters at y
  const caps = (slot, t, x, y, w, s, color) => { const m = met(), base = m.base*s;
    return `<div class="wcs-caps" data-slot="${slot}" data-lines="1" style="left:${x}pt;top:${y - (base - m.cap*s)}pt;width:${w}pt;height:${s}pt;${F.word(s)};line-height:${s}pt;color:${color}">${esc(t)}</div>`; };
  // tracked caps that give up tracking before they give up size (postcard.html capsFit)
  const capsFit = (T, t, w, max, min) => { let best = null;
    for(const tr of [.22, .14, .08, .03, 0]){ const s = T.one(t, z => F.caps(z, tr), w, max, min); if(s && (!best || s > best.s + .01)) best = {s, tr}; if(s && s >= max - .01) break; }
    return best; };

  // ---------- photos: tiles of the collage ----------
  const heroKit = (D) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const photo = (pid, x, y, w, ht) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${ht}pt`);
    const all = window.OHEmail ? OHEmail.support(D, id, 8) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)).slice(0, 8);
    return {id, pAR, photo, rooms: all,
      min: w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)), // (taller crops the sides: never past the house, never under three quarters of the photo's width)
      max: w => Math.ceil(Math.min(w/(pAR*.75), hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : w/pAR)), nat: w => Math.ceil(w/pAR),
      hero: (x, y, w, ht) => { if(hb && ht > w/pAR){ const vis = w/(ht*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return photo(id, x, y, w, ht); }};
  };
  // a region w x h filled with photo tiles, the mat (G) between them: the house alone where its frame holds the whole house; a region
  // taller than that gets a row of room tiles under the house; a region too short gets the house narrower with a room tile beside it.
  // skip: room photos already used elsewhere on the image
  const tiles = (X, T, w, h, G, skip, minHero) => {
    const f = T.f, mn = X.min(w), mx = X.max(w), nat = X.nat(w), rooms = X.rooms.slice(skip || 0);
    if(h < 30*f) return {ok: false};
    if(h >= mn - .5 && h <= mx + .5) return {ok: true, area: w*h, hw: w, hh: h, used: 0, html: (x, y) => X.hero(x, y, w, h)};
    if(h > mx){
      let hh = Math.max(mn, Math.min(mx, Math.max(nat, h - G - w*.4))), rr = h - G - hh;
      if(rr < 54*f){ hh = h - G - 54*f; rr = 54*f; }
      if(hh < mn - .5 || !rooms.length) return {ok: false};
      const n = Math.max(1, Math.min(T.v < T.f ? 1 : 3, rooms.length, Math.round(w/(rr*1.5)))), pw = (w - (n - 1)*G)/n;
      return {ok: true, area: w*hh, hw: w, hh, used: n, html: (x, y) => X.hero(x, y, w, hh) + rooms.slice(0, n).map((p, i) => X.photo(p, x + i*(pw + G), y + hh + G, pw, rr)).join('')};
    }
    let hw = Math.floor(w*h/mn); while(hw > 40 && X.min(hw) > h + .5) hw -= 2;
    const side = w - hw - G; if(side < Math.max((minHero ? 60 : 80)*T.u, w*(minHero ? .2 : .24)) || !rooms.length || hw < w*(minHero || .45)) return {ok: false};
    const n = side/h > 1.7 && rooms.length > 1 ? 2 : 1, pw = (side - (n - 1)*G)/n;
    return {ok: true, area: hw*h, hw, hh: h, used: n, html: (x, y) => X.hero(x, y, hw, h) + rooms.slice(0, n).map((p, i) => X.photo(p, x + hw + G + i*(pw + G), y, pw, h)).join('')};
  };
  const roomRow = (X, x, y, w, h, G, skip) => { const rooms = X.rooms.slice(skip || 0); if(!rooms.length || h < 20) return '';
    const n = Math.max(1, Math.min(3, rooms.length, Math.round(w/(h*1.35)))), pw = (w - (n - 1)*G)/n;
    return rooms.slice(0, n).map((p, i) => X.photo(p, x + i*(pw + G), y, pw, h)).join(''); };

  // ---------- words ----------
  // the street, never shortened and never split (owner 11/18): one line down to the floor size; a bar too narrow for that is not used.
  // Set inside a span, so the shared address pass (templates/_shared/addressfit.js) leaves it as written.
  const street = (T, Li, w, max) => { const t = Li.address, s = T.one(t, F.street, w, max, T.FE);
    return s ? {t, s, n: 1, w: T.tw(t, F.street(s))} : null; };
  const stH = st => st.n*st.s*1.2 + (st.n > 1 ? st.s*.15 : 0);
  const stTxt = (st, x, y, w, color) => txt('address', st.t, x, y, w, st.s, 1.2, F.street, color, {n: st.n, html: `<span>${esc(st.t)}</span>`});
  // the moment word in Bitter caps: its lines stacked, the longest as wide as the measure (q: a share of that)
  const wordLines = (T, lines, w, q) => { const up = lines.map(t => t.toUpperCase()), long = up.reduce((a, b) => T.tw(a, F.word(100)) >= T.tw(b, F.word(100)) ? a : b);
    const fill = T.one(long, F.word, w, 400, T.FE); if(!fill) return null;
    const s = Math.max(T.FE, r2(fill*(q || 1))), ch = capH(s), pitch = ch + s*.2;
    return {s, h: ch + (lines.length - 1)*pitch, wide: T.tw(long, F.word(s)), html: (x, y, color) => lines.map((t, i) => caps(i ? 'moment' + (i + 1) : 'moment', t, x, y + i*pitch, w + 2, s, color)).join('')}; };
  // the listing's facts as the postcards write them, and their short forms
  const factSets = D => { const all = OHL.factSix(D.listing).filter(([ic]) => ic !== 'stories'), six = all.filter(([ic]) => ic !== 'lot').slice(0, 5), lot = all.filter(([ic]) => ic === 'lot').map(([, t]) => t).slice(0, 1);
    return {lot, full: six.map(([ic, t]) => ic === 'area' ? t.replace(' square feet', ' sq ft') : ic === 'cal' ? t.replace('Built in', 'Built') : t),
      short: six.map(([ic, t]) => ic === 'bed' ? t.replace('bedroom', 'bed') : ic === 'bath' ? t.replace(' full bath', ' bath') : ic === 'area' ? t.replace(' square feet', ' sq ft') : ic === 'cal' ? t.replace('Built in', 'Built') : t)}; };
  // the facts in w, always in the postcards' tracked caps: on one line, or on two lines that run alike (with the lot size where two
  // lines still hold it), else one fact to a line. o.low: where the caps cannot stand at the type floor at all (X's wide image),
  // the same facts in sentence case on two lines.
  const factLines = (T, D, w, k, o) => { o = o || {}; const S = factSets(D), sizes = [...new Set([r2(Math.max(T.FB, T.FB*Math.min(k, 1.15))), T.FB])];
    if(!S.full.length) return {n: 0, h: 0, all: true, caps: true, html: () => ''};
    const split = (list, face, n, sep) => { let best = null; const J = l => l.join(sep), go = (i, acc) => { if(acc.length === n - 1){ const ls = acc.concat([list.slice(i)]); if(ls.some(l => !l.length)) return; const ws = ls.map(l => T.tw(J(l), face)), wide = Math.max(...ws); if(!best || wide < best.wide) best = {lines: ls.map(J), wide, ws}; return; }
      for(let j = i + 1; j < list.length; j++) go(j, acc.concat([list.slice(i, j)])); }; if(n <= list.length) go(0, []); return best; };
    const capsF = [.14, .08, .03, 0].map(tr => z => F.caps(z, tr)), seps = ['  ·  ', ' · '];
    const lists = (S.lot.length ? [S.full.concat(S.lot), S.short.concat(S.lot)] : []).concat([S.full, S.short]); let pk = null;
    const tryIt = (list, face, n, z, sep, extra) => { if(pk) return; const p = split(list, face(z), n, sep); if(p && p.wide <= w && (n === 1 || Math.min(...p.ws) >= .68*p.wide)) pk = Object.assign(p, {s: z, face, caps: true}, extra); };
    for(const n of [1, 2]) for(const list of lists) for(const face of capsF) for(const sep of seps) for(const z of sizes) tryIt(list, face, n, z, sep, {});
    if(!pk && S.short.length >= 3) for(const face of capsF.slice(1)) for(const z of sizes){ if(pk) break; const ws = S.short.map(t => T.tw(t, face(z))), c1 = Math.max(...ws.filter((_, i) => i%2 === 0)), c2 = Math.max(...ws.filter((_, i) => i%2 === 1)), cg = z*1.5;
      if(c1 + cg + c2 <= w) pk = {grid: {c1, c2, x2: Math.max(c1 + cg, Math.min(w*.5, w - c2))}, lines: S.short, s: z, face, caps: true}; }
    if(pk && pk.grid){ const lh = pk.s*1.38, rows = Math.ceil(pk.lines.length/2), g = pk.grid;
      return {n: rows, all: true, caps: true, per: false, h: rows*lh, html: (x, y, color) => pk.lines.map((t, i) => txt('facts.' + i, t, x + (i%2 ? g.x2 : 0), y + Math.floor(i/2)*lh, (i%2 ? g.c2 : g.c1) + 2, pk.s, 1.38, pk.face, color)).join('')}; }
    if(!pk && (o.maxLines || 2) >= S.short.length){ const face = capsF[1]; for(let z = r2(T.FB*Math.min(1.5, Math.max(1, k*1.15))); z >= T.FB - .01 && !pk; z -= .5){ const wd = Math.max(...S.short.map(t => T.tw(t, face(z)))); if(wd <= w) pk = {lines: S.short, s: z, face, caps: true, per: true, waste: (w - wd)*S.short.length*z*1.3}; } }
    if(!pk && o.low) for(const list of [S.full, S.short]) for(const z of sizes) tryIt(list, F.fact, 2, z, seps[0], {caps: false});
    if(!pk) return {n: 0, h: 0, html: () => ''};
    const lh = pk.s*(pk.per ? 1.3 : 1.38);
    return {n: pk.lines.length, all: true, caps: pk.caps, per: !!pk.per, waste: pk.waste || 0, h: pk.lines.length*lh, html: (x, y, color) => pk.lines.map((t, i) => txt('facts.' + i, t, x, y + i*lh, w, pk.s, pk.per ? 1.3 : 1.38, pk.face, color)).join('')}; };
  const hlList = D => [].concat(((((D.sw || {}).pc || {}).jl || {}).front || {}).highlights || []).map(String).filter(t => t && !SocialSet.CONDITION.test(t));   // no condition claims on a social image
  // the seller notes, fullest first (the writer's, then their closing sentences), and last the approved socials' own line
  const FALLBACK = 'I just sold this house. Yours could be next.';
  const notes = D => { const F0 = ((((D.sw || {}).pc || {}).js || {}).front || {}), n2 = [].concat(F0.note2 || []).map(String);
    const tail = n2.map(t => t.split(/(?<=[.!?])\s+/).slice(1).join(' ')).filter(Boolean);
    return n2.concat(['I can tell you what your own home could bring in today’s market.'], tail, ['I can tell you what your home could bring today.', FALLBACK])
      .filter((t, i, a) => t && a.indexOf(t) === i && !SocialSet.CONDITION.test(t)); };

  // ---------- the accent anchor bar, w wide, its words px in from its ends ----------
  // The street with the city line in tracked caps at the right end of its line (the Just Sold postcard), directly under the street
  // where the line cannot hold both, so the address always reads in order. 'facts': the facts under them (the Just Listed postcard).
  // 'street': the street alone.
  const anchor = (T, D, w, px, k, mode, fo, stMax) => { const Li = D.listing, inner = w - 2*px, kk = Math.min(k, 1.3), SM = Math.max(T.FE, Math.min(T.FE*1.4*k, stMax || 999)), py = r2(7*T.v*kk), place = OHL.place(Li);
    let st = null, pc = null, inline = false, fx = null;
    if(mode !== 'street'){
      for(let q = 1; q >= (mode === 'facts' ? .65 : .5) && !inline; q -= .05){ const a = street(T, Li, inner, Math.max(T.FE, SM*q)); if(!a) break;
        const p = capsFit(T, place, inner - a.w - 12*T.f, Math.max(T.FS, T.FS*1.1*kk*q), T.FS); if(p){ st = a; pc = p; inline = true; } }
      if(!inline){ st = street(T, Li, inner, SM); pc = capsFit(T, place, inner, T.FS*(mode === 'facts' ? 1.6 : 1.1)*kk, T.FS); if(!pc) return null; }   // the city line is never dropped
    } else st = street(T, Li, inner, SM);
    if(!st) return null;
    if(mode === 'facts') fx = factLines(T, D, inner, k, fo);
    const sh = stH(st), g2 = r2(2*T.f), ph = pc && !inline ? g2 + pc.s*1.3 : 0, under = ph + (fx && fx.n ? g2*1.5 + fx.h : 0), h = py + sh + under + py*(under ? 1.05 : 1);
    return {h, facts: fx ? fx.n : 0, allFacts: !!(fx && fx.all), capsFacts: !!(fx && fx.caps), perLine: !!(fx && fx.per), waste: fx ? fx.waste || 0 : 0, stN: st.n, html: (x, y) => { let s = `<div class="abs" data-anchor="1" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;background:${C.acc}"></div>` + stTxt(st, x + px, y + py, inline ? st.w + 2 : inner, C.onA);
      if(pc && inline){ const pw = T.tw(place, F.caps(pc.s, pc.tr)); s += txt('place', place, x + px + inner - pw - 2, y + py + (sh - pc.s*1.3)/2, pw + 2, pc.s, 1.3, z => F.caps(z, pc.tr), C.onA, {small: 1, align: 'right'}); }
      else if(pc) s += txt('place', place, x + px, y + py + sh + g2, inner, pc.s, 1.3, z => F.caps(z, pc.tr), C.onA, {small: 1});
      if(fx && fx.n) s += fx.html(x + px, y + py + sh + ph + g2*1.5, C.onA);
      return s; }};
  };
  // the main-color block with the word alone (the anchor bar runs across the image under it): the word's lines as large as the block
  // holds, set from the left
  const wordBlock = (T, w, h, opts) => { const pad = r2(14*T.u), inner = w - 2*pad, vp = r2(9*T.v); let best = null;
    for(const lines of opts){ const full = wordLines(T, lines, inner, 1); if(!full) continue; const q = Math.min(1, (h - 2*vp)/full.h), wd = q >= .999 ? full : wordLines(T, lines, inner, q); if(!wd || wd.s < T.FE*1.2) continue;
      const gapW = inner - wd.wide + pad, gapV = (h - wd.h)/2, c = {wd, s: wd.s, side: gapW*h, cap: gapV*w}; if(!best || c.s > best.s) best = c; }
    return best && {ws: best.s, side: best.side, cap: best.cap, html: (x, y) => rect(x, y, w, h, `background:${C.main}`) + best.wd.html(x + pad, y + (h - best.wd.h)/2, C.onM)}; };

  // ---------- the main-color block: the word, the anchor at its foot ----------
  // o.lines: the word's lines; o.anchor: 'facts' | 'place' | 'street'; o.place: the place in tracked caps over the word; o.q: the
  // word's share of the full measure; o.maxLines: the most fact lines
  const mainBlock = (T, D, w, k, o) => { const f = T.f, kk = Math.min(k, 1.25), pad = r2(14*T.u), ai = r2(7*T.v), inner = w - 2*pad;
    const wd = wordLines(T, o.lines, inner, o.q); if(!wd) return null;
    const an = anchor(T, D, w - 2*ai, pad - ai, k, o.anchor, o.fo, wd.s*.8); if(!an) return null;
    const place = OHL.place(D.listing), pc = o.place ? capsFit(T, place, inner, T.FS*1.1*kk, T.FS) : null; if(o.place && !pc) return null;
    const sp = o.side ? capsFit(T, place, inner - wd.wide - 14*f, T.FS*1.15*kk, T.FS) : null;
    const v = T.v, pt = r2(Math.max(10*v, 12*v*kk)), g = r2(Math.max(8*v, 10*v*kk)), ph = pc ? pc.s*1.3 + r2(5*v*kk) : 0, need = pt + ph + wd.h + g + an.h + ai;
    return {h: need, ws: wd.s, facts: an.facts, allFacts: an.allFacts, capsFacts: an.capsFacts, perLine: an.perLine, waste: an.waste, stN: an.stN, html: (x, y, h) => { const e = Math.max(0, (h || need) - need); let s = rect(x, y, w, h || need, `background:${C.main}`), yy = y + pt + e*.5;
      if(pc){ s += txt('place', place, x + pad, yy, inner, pc.s, 1.3, z => F.caps(z, pc.tr), C.onM, {small: 1, cls: BADGE}); yy += ph; }
      if(sp){ const pw = T.tw(place, F.caps(sp.s, sp.tr)); s += txt('place', place, x + pad + inner - pw - 2, yy + (wd.h - sp.s*1.3)/2, pw + 2, sp.s, 1.3, z => F.caps(z, sp.tr), C.onM, {small: 1, align: 'right', cls: BADGE}); }
      return s + wd.html(x + pad, yy, C.onM) + an.html(x + ai, y + (h || need) - ai - an.h); }};
  };

  // ---------- the agent on the dark block: name, the phone with REALTOR(R) in accent caps, the white logo ----------
  // 'row': the lines at the left (after the headshot), the logo in the rest of the row (the postcards). 'stack': the lines with the
  // logo centered under them, the group centered. 'mini': name, phone and REALTOR(R) centered, no logo (carousel slides).
  const agent = (D, T, w, k, mode) => {
    const A = D.agent || {}, hsOn = mode !== 'mini' && OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), gap = 10*T.f, INK = C.onD, LAB = C.accD;
    const sizes = (cw, fillName) => { const aK = T.agK || 1; let ns = T.one(A.name || '', F.name, cw, Math.max(T.FB*1.6*k, T.FB*1.1*aK), T.FB*1.1*aK); const ps0 = r2(Math.max(T.FB*aK, T.FB*1.15*k)), ds = r2(Math.max(T.FS*aK, T.FS*Math.min(k, 1.3))); if(!ns) return null;
      const dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0; let ps = null, inl = true;
      for(let s = ps0; s >= T.FB - .01 && !ps; s -= .5) if(dW + (nar ? s*.6 : 0) + T.tw(A.phone || '', F.phone(s)) <= cw) ps = s;
      if(!ps){ inl = false; ps = T.one(A.phone || '', F.phone, cw, ps0, T.FB); if(!ps) return null; }
      if(fillName && inl && nar){ const l2 = dW + ps*.6 + T.tw(A.phone || '', F.phone(ps)); ns = Math.max(ns, T.one(A.name || '', F.name, l2, T.FB*2.3*k, ns) || ns); }
      const wide = Math.max(T.tw(A.name || '', F.name(ns)), inl ? dW + (nar ? ps*.6 : 0) + T.tw(A.phone || '', F.phone(ps)) : Math.max(dW, T.tw(A.phone || '', F.phone(ps))));
      return {ns, ps, ds, dW, inl, wide, th: ns*1.18 + 2*T.f + (inl || !nar ? 0 : ds*1.3 + T.f) + ps*1.3}; };
    const lines = (S, x, y, cw, a) => { let s = txt('agent.name', A.name || '', x, y, cw, S.ns, 1.18, F.name, INK, {align: a}), yy = y + S.ns*1.18 + 2*T.f;
      const pw = T.tw(A.phone || '', F.phone(S.ps));
      if(S.inl && nar){ const tot = pw + S.ps*.6 + S.dW, x0 = a === 'left' ? x : x + (cw - tot)/2;
        s += txt('agent.phone', A.phone || '', x0, yy, pw + 2, S.ps, 1.3, F.phone, INK);
        s += txt('agent.desig', 'REALTOR®', x0 + pw + S.ps*.6, yy + S.ps*1.3*.78 - S.ds*1.3*.78, S.dW + 2, S.ds, 1.3, F.tag, LAB, {small: 1}); }
      else { s += txt('agent.phone', A.phone || '', x, yy, cw, S.ps, 1.3, F.phone, INK, {align: a}); yy += S.ps*1.3 + T.f;
        if(nar) s += txt('agent.desig', 'REALTOR®', x, yy, cw, S.ds, 1.3, F.tag, LAB, {small: 1, align: a}); }
      return s; };
    const logo = (x, y, lw, lh) => `<div class="abs wcs-logo" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${INK}">${OHL.logo(D, 'dark', '')}</div>`;
    const hs = (x, y, hw, hh) => `<div class="abs wcs-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    if(mode === 'mini'){ const S = sizes(w); if(!S) return null; const S2 = Object.assign({}, S, {inl: false, th: S.ns*1.18 + 2*T.f + S.ps*1.3 + (nar ? T.f + S.ds*1.3 : 0)});
      return {h: S2.th, ww: w, hs: false, html: (x, y) => lines(S2, x, y, w, 'center')}; }
    if(mode === 'tower'){ if(!hsOn) return null; const S = sizes(w); if(!S) return null;
      const lg = 6*T.v, hsW = r2(Math.min(w*.5, 42*T.f*k)), hsH = r2(hsW*1.2), lh1 = r2(Math.max(S.ns*1.5, T.FB*1.9)), tWd = Math.min(w, S.wide + 2), lw = Math.min(w, Math.max(tWd, lh1*3.4)), lh = Math.min(lh1, r2(lw/3.6)), full = hsH + lg*1.3 + S.th + lg + lh;
      return {h: full, ww: Math.max(tWd, lw), hs: true, html: (x, y) => hs(x + (w - hsW)/2, y, hsW, hsH) + lines(S, x + (w - tWd)/2, y + hsH + lg*1.3, tWd, 'center') + logo(x + (w - lw)/2, y + hsH + lg*1.3 + S.th + lg, lw, lh)}; }
    if(mode === 'row'){
      const lmin = Math.max(56*T.u, w*.3);
      for(const h0 of (hsOn ? [1, 0] : [0])){
        const probe = sizes(w), hsW = h0 && probe ? Math.round(probe.th*.8) : 0, cw = w - lmin - gap*1.4 - (h0 ? hsW + gap : 0), S = sizes(cw, true); if(!S) continue;
        const tx = (h0 ? hsW + gap : 0), rest = w - tx - S.wide - gap*1.4, lw = Math.min(rest, S.th*3.6), lx = rest - lw > 40*T.u ? w - rest + (rest - lw)/2 : w - lw;
        return {h: S.th, ww: w, hs: !!h0, inl: S.inl || !nar, gapW: rest - lw, html: (x, y) => (h0 ? hs(x, y, hsW, S.th) : '') + lines(S, x + tx, y, S.wide + 2, 'left') + logo(x + lx, y + S.th*.04, lw, S.th*.92)};
      }
      return null;
    }
    // (the headshot beside the lines at three widths before it is given up; the logo centered under the lines)
    for(const hf of (hsOn ? [.34, .28, .22, 0] : [0])){
      const p0 = sizes(w); if(!p0) return null;
      const lg = 6*T.v, LK = T.v < T.f ? 1.55 : 1.9, lh0 = r2(Math.max(p0.ns*1.5, T.FB*LK)), hsW = hf ? Math.round(Math.min((p0.th + lg + lh0)*.7, w*hf)) : 0, cw = w - (hf ? hsW + gap : 0), S = sizes(cw); if(!S) continue;
      const tWd = Math.min(cw, S.wide + 2), lh1 = r2(Math.max(S.ns*1.5, T.FB*LK)), lw = Math.min(cw, Math.max(tWd, lh1*3.4)), lh = Math.min(lh1, r2(lw/3.6)), full = S.th + lg + lh, gW = Math.max(tWd, lw), hsH = Math.min(full, hsW/.74);
      return {h: full, ww: (hf ? hsW + gap : 0) + gW, hs: !!hf, html: (x, y) => { const tot = (hf ? hsW + gap : 0) + gW, x0 = x + (w - tot)/2, tx = x0 + (hf ? hsW + gap : 0);
        return (hf ? hs(x0, y + (full - hsH)/2, hsW, hsH) : '') + lines(S, tx + (gW - tWd)/2, y, tWd, 'center') + logo(tx + (gW - lw)/2, y + S.th + lg, lw, lh); }};
    }
    return null;
  };

  // ---------- Just Listed: the highlights, each after a small accent square (the postcard's dark block) ----------
  // one: every item on one line (an item that cannot is left out)
  const bullets = (T, list, w, k, max, one) => { const fs0 = r2(Math.max(T.FB, T.FB*1.05*Math.min(k, 1.35)));
    const set = z => { const sq = r2(z*.46), off = sq + r2(z*.8), tw = w - off, lh = z*1.3, items = [];
      for(const t of list){ if(items.length >= max) break; const w1 = T.tw(t, F.bul(z));
        if(w1 <= tw){ items.push({t, n: 1, w: w1 + 2}); continue; } if(one) continue;
        const r = T.rows(t, F.bul(z) + ';text-wrap:balance', tw, lh); if(r.n === 2 && r.last >= .78*r.wide) items.push({t, n: 2, w: Math.min(tw, r.wide + 2)}); }
      return {fs: z, sq, off, tw, lh, items}; };
    let B = null; for(let z = fs0; z >= T.FB - .01; z -= .5){ const c = set(z); if(!B || c.items.length > B.items.length) B = c; if(c.items.length >= Math.min(max, list.length)) break; }
    if(!B || !B.items.length) return null;
    // the list as large as its column holds (the same items on the same lines), up to a third over
    for(let z = B.fs + .5; z <= fs0*1.35 + .01; z += .5){ const c = set(z); if(c.items.length < B.items.length || c.items.some((it, i) => it.t !== B.items[i].t || it.n !== B.items[i].n)) break; B = c; }
    const {fs, sq, off, tw, lh, items} = B, gap = fs*.75, h = items.reduce((s, it) => s + it.n*lh, 0) + (items.length - 1)*gap;
    return {h, n: items.length, texts: items.map(it => it.t), wide: off + Math.max(...items.map(it => it.w)), html: (x, y, avail) => { const e = Math.max(0, (avail || h) - h), ge = gap + (items.length > 1 ? Math.min(fs*1.1, e/(items.length - 1)) : 0); let yy = y + (e - (ge - gap)*(items.length - 1))/2, s = '';
      items.forEach((it, i) => { s += rect(x, yy + lh/2 - sq/2, sq, sq, `background:${C.accD}`) + txt('hl.' + i, it.t, x + off, yy, it.n > 1 ? it.w : tw, fs, 1.3, F.bul, C.onD, {n: it.n, cls: BADGE, css: it.n > 1 ? 'text-wrap:balance' : ''}); yy += it.n*lh + ge; });
      return s; }}; };
  // the writer's lines beside the highlights: whole sentences in order (the first kept), exactly n lines at width w, every line 80%+ and
  // the last 90%+ of the measure (owner 11/8), the measure narrowed a little or the type raised up to 12% to get there. A sentence that
  // says what a highlight beside it already says is left out.
  const writeUp = (T, D, w, s0, n, shown) => {
    const COMMON = new Set('house home first second third floor floors there their which where with from that this have room rooms built opens open into over under both'.split(' '));
    const words = t => (String(t).toLowerCase().match(/[a-z0-9-]{4,}/g) || []).map(x => x.replace(/s$/, '')).filter(x => !COMMON.has(x)), sw = (shown || []).map(words);
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing)).filter(t => { const ws = new Set(words(t)); return !sw.some(b => b.some(x => ws.has(x))); }).slice(0, 8), near = /\bmiles?\b/i; let best = null;
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of [1, .96, .92]) for(const s of [s0, r2(s0*1.06), r2(s0*1.12)]){ const r = T.rows(t, F.note(s), w*m, s*1.42); if(r.n !== n) continue;
        if(r.last < .9*w*m || r.ws.slice(0, -1).some(x => x < .8*w*m)) continue;
        const sc = (near.test(t) ? 80 : 0) + m*20 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc, just: false}; } }
    if(best){ best.h = best.n*best.s*1.42 + best.s*.15;
      best.html = (x, y, W0) => txt('writeup', best.t, x + (W0 - best.w)/2, y, best.w, best.s, 1.42, F.note, C.softD, {n: best.n, cls: BADGE, css: best.just ? 'text-align:justify;text-align-last:left' : ''}); }
    return best; };
  // the dark block across the image under the two blocks: the highlights, one to a line, with the writer's lines beside them; where no
  // lines fill that column, the highlights on their own dark tile with a room tile of the collage beside it
  const listBlock = (T, D, X, w, k, G, wrow) => { const f = T.f, kk = Math.min(k, 1.25), pad = r2(14*T.u), inner = w - 2*pad, pt = r2(11*T.v*kk), cg = r2(18*f), dark = `background:${C.dark}`;
    const bl = bullets(T, hlList(D), inner*.66, k, 3, true); if(!bl || bl.n < 2) return null;
    const bw = bl.wide, ww = inner - bw - cg, s0 = r2(Math.max(T.FB, T.FB*1.02*Math.min(k, 1.2))), n0 = Math.round(bl.h/(s0*1.42)); let wu = null;
    if(ww >= 96*f) for(const n of [n0, n0 + 1, n0 - 1]){ if(n < 2 || wu) continue; wu = writeUp(T, D, ww, s0, n, bl.texts); }
    if(wu){ const ch = Math.max(bl.h, wu.h), h = 2*pt + ch;
      return {h, wu: true, html: (x, y) => rect(x, y, w, h, dark) + bl.html(x + pad, y + pt + (ch - bl.h)/2) + wu.html(x + pad + bw + cg, y + pt + (ch - wu.h)/2, ww)}; }
    const room = X.rooms[3] || X.rooms[X.rooms.length - 1], dw = Math.ceil(bw + 2*pad), tw = w - dw - G, h1 = 2*pt + bl.h; if(!room || tw < 64*f) return null;
    let w2 = null; if(wrow) for(const n of [2, 3]){ if(!w2) w2 = writeUp(T, D, inner, s0, n, bl.texts); }
    if(wrow && !w2) return null;
    const h = h1 + (w2 ? G + 2*pt + w2.h : 0);
    return {h, wu: !!w2, html: (x, y) => rect(x, y, dw, h1, dark) + bl.html(x + pad, y + pt) + X.photo(room, x + dw + G, y, tw, h1) + (w2 ? rect(x, y + h1 + G, w, 2*pt + w2.h, dark) + w2.html(x + pad, y + h1 + G + pt, inner) : '')}; };

  // ---------- Just Sold: the question over the seller note (the postcard's dark block) ----------
  // The note is the fullest of the seller notes that fills its lines: every line 80%+ and the last 90%+ of the measure (owner 11/8),
  // the measure narrowed a little or the type raised up to 13% to get there. o.noQ: where the question and a note cannot both stand
  // at the type floors (X's wide image), the short note alone, set as the heading.
  const pickNote = (T, D, iw, ns0, maxN) => { const all = notes(D);
    for(const list of [all.filter(t => t !== FALLBACK), [FALLBACK]]) for(let n = Math.min(maxN, list.length === 1 && list[0] === FALLBACK ? 2 : 6); n >= 1; n--) for(const m of [1, .96, .92, .88]) for(let s = ns0; s <= ns0*1.13 + .01; s += .5) for(const t of list){
      const w = iw*m, r = T.rows(t, F.note(s), w, s*1.42); if(r.n !== n) continue;
      if(n === 1 ? r.wide < .62*w : (r.last < .9*w || r.ws.slice(0, -1).some(x => x < .8*w))) continue;
      return {t, n, s, w, just: false}; }
    return null; };
  const sell = (D, T, w, k, o) => {
    if(o.noQ){ const max = T.FE*1.3*k, min = T.FB*1.12, s1 = T.one(FALLBACK, F.street, w, max, min), parts = FALLBACK.split(/(?<=\.)\s+/), s2 = Math.min(...parts.map(t => T.one(t, F.street, w, max*1.2, min) || 0));
      const ls = s1 ? [FALLBACK] : s2 ? parts : null, s = s1 || s2; if(!ls) return null;
      return {h: ls.length*s*1.2, n: ls.length, html: (x, y) => ls.map((t, i) => txt('sold.cta' + (i ? 2 : ''), t, x, y + i*s*1.2, w, s, 1.2, F.street, C.onD, {cls: BADGE})).join('')}; }
    const max = T.FE*1.55*k, s1 = T.one(Q, F.street, w, max, T.FB), s2 = Math.min(T.one('Thinking about', F.street, w, max, T.FB) || 0, T.one('selling?', F.street, w, max, T.FB) || 0);
    const two = s2 && !s1, ql = two ? ['Thinking about', 'selling?'] : [Q], qs = two ? s2 : s1; if(!qs) return null;
    const qh = ql.length*qs*1.14, ns0 = r2(Math.max(T.FB*1.12, T.FB*1.15*k)), g = r2(7*T.v*Math.min(k, 1.3));
    const pk = pickNote(T, D, w, ns0, o.lines); if(!pk || pk.n < o.lines) return null;
    const lh = pk.s*1.42, h = qh + g + pk.n*lh + pk.s*.15;
    return {h, n: pk.n, fb: pk.t === FALLBACK, len: pk.t.length, html: (x, y) => { let s = '', yy = y;
      ql.forEach((t, i) => { s += txt('sold.q' + (i ? 2 : ''), t, x, yy, w, qs, 1.14, F.street, C.onD); yy += qs*1.14; });
      return s + txt('sold.note', pk.t, x, yy + g, pk.w, pk.s, 1.42, F.note, C.softD, {n: pk.n, cls: BADGE, css: pk.just ? 'text-align:justify;text-align-last:left' : ''}); }};
  };

  // ---------- the dark block ----------
  // o.top: null | the question block ({h, html}); o.agent: the agent arrangement(s) to try in order
  const darkBlock = (T, D, w, k, o) => { const kk = Math.min(k, 1.25), pad = r2(14*T.u), inner = w - 2*pad, pt = r2(12*T.v*kk), g = r2(8*T.v*kk);
    let ag = null; for(const m of o.agent){ ag = agent(D, T, inner, k, m); if(ag) break; } if(!ag) return null;
    const top = o.top ? o.top(inner) : null; if(o.top && !top) return null;
    const need = pt + (top ? top.h + g + 1 + g : 0) + ag.h + pt;
    return {h: need, n: top ? top.n : 0, fb: !!(top && top.fb), hs: ag.hs, inl: ag.inl !== false, gapW: ag.gapW || 0, side: top ? 0 : pad + (inner - ag.ww)/2, html: (x, y, h) => { h = h || need; const e = Math.max(0, h - need); let s = rect(x, y, w, h, `background:${C.dark}`);
      if(!top) return s + ag.html(x + pad, y + (h - ag.h)/2);
      const ay = y + h - pt - e*.12 - ag.h, hy = ay - g - e*.1 - 1, room = hy - g - (y + pt);
      s += top.html(x + pad, y + pt + (room - top.h)/2, room);
      return s + rect(x + pad, hy, inner, 1, `background:${C.hairD}`) + ag.html(x + pad, ay); }};
  };
  const sellTop = (T, D, k, o) => w => sell(D, T, w, k, o);
  // the dark block across the foot of a wide image: the question and the note at the left, a hairline, the agent (headshot, lines,
  // logo) at the right
  const splitBlock = (T, D, w, k, o) => { const kk = Math.min(k, 1.25), pad = r2(14*T.u), inner = w - 2*pad, pt = r2(12*T.v*kk), cg = r2(24*T.u); let best = null;
    for(const lf of [.62, .56, .5]){ const lw = Math.round((inner - cg)*lf), rw = inner - cg - lw, sl = sell(D, T, lw, k, o), ag = agent(D, T, rw, k, 'stack'); if(!sl || !ag) continue;
      const diff = Math.abs(sl.h - ag.h); if(best && best.diff <= diff) continue; const ch = Math.max(sl.h, ag.h), h = 2*pt + ch;
      best = {h, diff, hs: ag.hs, n: sl.n, fb: !!sl.fb, gapW: 0, html: (x, y) => rect(x, y, w, h, `background:${C.dark}`) + sl.html(x + pad, y + pt + (ch - sl.h)/2) + rect(x + pad + lw + cg/2, y + pt, 1, ch, `background:${C.hairD}`) + ag.html(x + pad + lw + cg, y + pt + (ch - ag.h)/2)}; }
    return best; };
  const factPen = M => M.allFacts ? (M.capsFacts ? (M.perLine ? 40 : 0) : 220) : M.facts ? 320 : 600;

  const WC = {};
  const KS = [1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1, .9, .8, .7, .6], KS2 = [1.5, 1.3, 1.15, 1, .85, .7, .6];
  const memo = fn => { const m = new Map(); return (...a) => { const key = a.join('|'); if(!m.has(key)) m.set(key, fn(...a)); return m.get(key); }; };
  // ================= post, pin, story, square =================
  // Just Listed (the postcard's wide-house front): the house tile across the top; under it the main block (JUST / LISTED, the anchor
  // with the street and the facts) beside the dark block with the agent; then the dark block across the image with the highlights and
  // the writer's lines (a square keeps the room for the house). Just Sold (its postcard): the main block across the top (JUST SOLD on
  // one line, the street on the anchor), the house tile, then the dark block (the question, the note, the agent).
  // Room the house cannot take goes to room tiles; a story opens with the house and closes with a row of room tiles.
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), f = T.f, X = heroKit(D), sold = D.piece.moment === 'js', story = shape === 'story', G = r2(6*f), SAFE = story ? Math.max(94, r2(104*f)) : 0;
    T.agK = story ? 1.2 : 1;   // the story's contact panel reads at phone size (review 11/22)
    const words = SocialSet.M.split(' '), nat = X.nat(W), hsWant = OHL.cardMode(D) === 'headshot' && !!(D.agent || {}).headshot;
    let pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
    const want = X.min(W) + .6*(nat - X.min(W)), photoSc = tl => Math.min(1, tl.area/(W*want))*1000 - (tl.hw < W ? 60 : 0);
    const footSc = foot => - Math.max(0, foot - W*.45)*2 - Math.max(0, W*.32 - foot)*3;
    if(!sold){
      const mainAt = memo((mw, k, stack) => mainBlock(T, D, mw, k, {lines: stack ? words : [SocialSet.M], anchor: 'facts', fo: {maxLines: 4}}));
      const darkAt = memo((dw, k) => darkBlock(T, D, dw, k, {top: null, agent: ['tower', 'stack']}));
      const PK = shape === 'square' ? 2.4 : 1;
      const listAt = memo((k, wrow) => listBlock(T, D, X, W, k, G, wrow));
      for(const fr of [.68, .62, .58, .54]) for(const stack of [1, 0]) for(const km of KS2) for(const kd of KS2){
        const mw = Math.round((W - G)*fr), dw = W - G - mw, M = mainAt(mw, km, stack), Dk = darkAt(dw, kd); if(!M || !Dk) continue;
        const bh = Math.max(M.h, Dk.h), base = (stack ? 60 : 0) - (Dk.side*bh > .027*W*H ? 500 : 0) - (M.waste > .022*W*H ? 500 : 0) + (km + kd)/2*150 - Math.abs(M.h - Dk.h)*3 - factPen(M) - (M.stN > 1 ? 300 : 0) - (hsWant && !Dk.hs ? 400 : 0);
        for(const kc of KS2.concat([0])) for(const wrow of (kc && shape !== 'square' ? [1, 0] : [0])){ const Cb = kc ? listAt(kc, wrow) : null; if(kc && !Cb) continue;
          const ch = Cb ? Cb.h + G : 0, cs = Cb ? (shape === 'square' ? 260 : 520) + kc*60 + (Cb.wu ? (shape === 'post' ? 150 : 300) : 0) : 0;
          if(story){ const ph = Math.max(X.min(W), Math.min(X.max(W), nat)), foot = H - ph - 2*G - bh - ch; if(foot < SAFE) continue;
            take({M, Dk, Cb, mw, dw, bh, ph, foot, sc: base + cs + footSc(foot)}); }
          else { const tl = tiles(X, T, W, H - G - bh - ch, G, 0, shape === 'square' ? .7 : 0); if(!tl.ok) continue;
            take({M, Dk, Cb, mw, dw, bh, tl, sc: base + cs + photoSc(tl)*PK}); } }
      }
      if(!pick){ const mw = Math.round((W - G)*.58), dw = W - G - mw, M = mainBlock(T, D, mw, .6, {lines: [SocialSet.M], anchor: 'facts', fo: {maxLines: 4, low: true}}), Dk = darkBlock(T, D, dw, .6, {top: null, agent: ['stack', 'mini']}), bh = Math.max(M.h, Dk.h);
        pick = {M, Dk, mw, dw, bh, ph: H - G - bh, foot: 0, tl: {html: (x, y) => X.hero(x, y, W, H - G - bh), used: 0}}; }
      const {M, Dk, Cb, mw, bh} = pick; let h = CSS, y = 0;
      if(story){ h += X.hero(0, 0, W, pick.ph); y = pick.ph + G; } else { h += pick.tl.html(0, 0); y = H - bh - (Cb ? Cb.h + G : 0); }
      h += M.html(0, y, bh) + Dk.html(mw + G, y, bh); y += bh + G;
      if(Cb){ h += Cb.html(0, y); y += Cb.h + G; }
      if(story && pick.foot > 20) h += roomRow(X, 0, y, W, H - y, G, 0);
      T.done(); return h;
    }
    const noteSc = o => o.noQ ? 0 : 60 + (o.lines === 2 || o.lines === 3 ? 240 : o.lines === 4 ? 200 : 0), SQ = shape === 'square', PKS = SQ ? 1.5 : 1;
    for(const o of [{lines: 4}, {lines: 3}, {lines: 2}, {lines: 1}, {noQ: 1}]) for(const k of KS){
      const M = mainBlock(T, D, W, k, {lines: [SocialSet.M], anchor: 'place'}), Dk = darkBlock(T, D, W, k, {top: sellTop(T, D, k, Object.assign({two: false}, o)), agent: ['row', 'stack']});
      if(!M || !Dk) continue; const hp = (hsWant && !Dk.hs ? 400 : 0) + (Dk.fb ? 90 : 0);
      if(story){ const ph = Math.max(X.min(W), Math.min(X.max(W), nat)), foot = H - ph - 3*G - M.h - Dk.h; if(foot < SAFE) continue;
        take({M, Dk, ph, foot, sc: k*150 + noteSc(o) + footSc(foot) - hp}); }
      else { const tl = tiles(X, T, W, H - 2*G - M.h - Dk.h, G, 0, SQ ? .7 : 0); if(!tl.ok) continue;
        take({M, Dk, tl, sc: photoSc(tl)*PKS + k*150 + noteSc(o) - hp}); }
    }
    if(!pick){ const M = mainBlock(T, D, W, .6, {lines: [SocialSet.M], anchor: 'place'}), Dk = darkBlock(T, D, W, .6, {top: sellTop(T, D, .6, {noQ: 1}), agent: ['row', 'stack', 'mini']});
      pick = {M, Dk, ph: H - 2*G - M.h - Dk.h, foot: 0, tl: {html: (x, y) => X.hero(x, y, W, H - 2*G - M.h - Dk.h)}}; }
    const {M, Dk} = pick; let h = CSS;
    if(story){ h += X.hero(0, 0, W, pick.ph) + M.html(0, pick.ph + G) + Dk.html(0, pick.ph + 2*G + M.h); const y = pick.ph + 3*G + M.h + Dk.h; if(pick.foot > 20) h += roomRow(X, 0, y, W, H - y, G, 0); }
    else h += M.html(0, 0) + pick.tl.html(0, M.h + G) + Dk.html(0, H - Dk.h);
    T.done(); return h;
  };

  // ================= wide (X), Google Business Profile =================
  // The house tile at the top left (a room tile under it where the house cannot take the height), the main block beside it (the word,
  // the anchor with the street and the facts, or the street and the place on Just Sold), and the dark block across the foot: the agent
  // with the headshot and the white logo; on Just Sold the question and the seller note over the agent.
  const card = (D, L, W, H, shape) => {
    const T = kit(D, shape), f = T.f, X = heroKit(D), sold = D.piece.moment === 'js', G = r2(6*f), words = SocialSet.M.split(' ');
    const hsWant = OHL.cardMode(D) === 'headshot' && !!(D.agent || {}).headshot, ai = r2(7*T.v), pad = r2(14*T.u), mode = sold ? 'place' : 'facts';
    let pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
    const mainAt = memo((cw, k, stack) => mainBlock(T, D, cw, k, {lines: stack ? words : [SocialSet.M], anchor: mode, fo: {maxLines: 4, low: true}}));
    const barAt = memo(k => anchor(T, D, W - 2*ai, pad - ai, k, mode, {maxLines: 2}));
    const small = pw => pw < W*.45 ? 400 + (W*.45 - pw)*4 : 0;   // the house keeps 45% of the width or more
    for(const co of (sold ? [{lines: 3}, {lines: 2}, {lines: 1}, {noQ: 1}, {noQ: 1, row: 1}] : [null])) for(const kc of KS2){
      const Cb = co && !co.row ? splitBlock(T, D, W, kc, co) : darkBlock(T, D, W, kc, {top: co ? sellTop(T, D, kc, co) : null, agent: ['row']}); if(!Cb) continue;
      const cs = kc*50 + (co ? (co.noQ ? 0 : 110 + co.lines*10 - (Cb.fb ? 90 : 0)) - (Cb.diff || 0)*2 : 0) - (hsWant && !Cb.hs ? 400 : 0) - (Cb.gapW > 60*T.u ? Cb.gapW*1.5 : 0) - (Cb.inl === false ? 300 : 0);
      // (1) the main block beside the house carries the bar at its foot
      const top = H - G - Cb.h;
      if(top >= H*.42) for(let fr = .72; fr >= .34; fr -= .02){ const pw = Math.round(W*fr), cw = W - G - pw, tl = tiles(X, T, pw, top, G); if(!tl.ok) continue;
        for(const stack of [1, 0]) for(const km of KS2){ const M = mainAt(cw, km, stack); if(!M || M.h > top) continue;
          const slack = top - M.h;
          take({v: 1, M, Cb, pw, cw, tl, top, sc: tl.area/(W*H)*1400 + km*40 + cs + (stack ? 70 : 0) - slack*3 - (sold ? 0 : factPen(M)) - (M.waste > .022*W*H ? 500 : 0) - small(tl.hw) - (tl.used ? 15 : 0)}); break; } }
      // (2) the bar runs across the image under the house and the word block (a street too long for the block's width)
      for(const ka of KS2){ const bar = barAt(ka); if(!bar || (!sold && !(bar.allFacts && bar.capsFacts))) continue;
        const sh = bar.h + 2*ai, top2 = H - Cb.h - sh - G; if(top2 < H*.3) continue;
        for(let fr = .72; fr >= .4; fr -= .02){ const pw = Math.round(W*fr), cw = W - G - pw, tl = tiles(X, T, pw, top2 - G, G); if(!tl.ok) continue;
          const wb = wordBlock(T, cw, top2, [words, [SocialSet.M]]); if(!wb) continue;
          take({v: 2, wb, bar, sh, Cb, pw, cw, tl, top2, sc: tl.area/(W*H)*1400 + ka*30 + cs + wb.ws*.6 - (wb.side > .027*W*H ? 500 : 0) - (wb.cap > .027*W*H ? 500 : 0) - small(tl.hw) - (tl.used ? 15 : 0) - 30}); } }
    }
    if(!pick){ const Cb = darkBlock(T, D, W, .6, {top: null, agent: ['row', 'stack', 'mini']}), top = H - G - Cb.h, pw = Math.round(W*.4), cw = W - G - pw, M = mainBlock(T, D, cw, .6, {lines: [SocialSet.M], anchor: 'street'}) || {html: () => ''};
      pick = {v: 1, M, Cb, pw, cw, top, tl: {html: (x, y) => X.hero(x, y, pw, top)}}; }
    const {Cb, pw, cw} = pick; let h = CSS;
    if(pick.v === 1) h += pick.tl.html(0, 0) + pick.M.html(pw + G, 0, pick.top) + Cb.html(0, pick.top + G);
    else { const {top2, sh, bar, wb} = pick;
      h += pick.tl.html(0, 0) + wb.html(pw + G, 0, cw, top2 + 1) + rect(0, top2, W, sh, `background:${C.main}`) + bar.html(ai, top2 + ai) + Cb.html(0, top2 + sh + G); }
    T.done(); return h;
  };
  WC.portrait = tall;
  WC.landscape = card;

  // ================= carousel photo slides: the room as a tile, the main block under it =================
  // the word in Bitter caps over the anchor with the street and the city line (no agent box: the room photo takes the room)
  WC.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), G = r2(6*T.f);
    const M = mainBlock(T, D, W, 1, {lines: [SocialSet.M], anchor: 'place', q: .8}) || mainBlock(T, D, W, .7, {lines: [SocialSet.M], anchor: 'place', q: .8});
    const h = CSS + OHL.photo(D, D.piece.photo, `left:0;top:0;width:${W}pt;height:${H - M.h - G}pt`) + M.html(0, H - M.h);
    T.done();
    return h;
  };
  window.WCSocial = WC;
})();
