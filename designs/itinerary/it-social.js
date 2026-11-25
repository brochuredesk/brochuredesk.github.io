/* templates/itinerary/it-social.js: Itinerary's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on piece
   matches its set's main pieces). Plugs into templates/_shared/socialset.js (data, the checks) and replaces its three layouts for
   this set only; nothing shared changes.

   Read off the approved Itinerary pieces (postcard.html, flyer.html, foldover.html, it-tokens.css, it-marks.css):
     - the paper is a light tint of the agent's main color; photos are square and run edge to edge
     - the title bar: the main color run in from the trim edge, a thin accent line on its top edge, JUST LISTED / JUST SOLD in
       Montserrat 800 caps (stacked JUST over LISTED beside the house, one line across the head on Just Sold)
     - the ruled table: small tracked Montserrat caps labels in the main color at the left (WHERE / THE HOME / NEW / INSIDE / ABOUT),
       one vertical hairline, hairlines between rows, the values in Playfair Display (the street in 700 in the main color, the place
       in tracked caps, the facts in 600), square main-color bullets under NEW
     - the stop number on a room photo: a main-color square in the photo's corner with a Playfair numeral (01, 02), the room beside it
     - the one white box with a thin accent edge: the write-up (ABOUT), or on Just Sold the agent's note under "Thinking about
       selling?" in Playfair 600 in the main color
     - the agent under a hairline: the name in Playfair 700, the phone in Montserrat 700, REALTOR(R) in tracked caps, the one logo
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house in every frame (the engine's
   house-cut check), text at the phone floors of templates/_shared/readsize.js, 4:5 text inside the middle 3:4, story text out of
   the top and bottom 250 px. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const MO = "'Montserrat'", PF = "'Playfair Display'";
  const AOM = 'var(--it-aom)', MAIN = 'var(--it-main)', ONM = 'var(--it-on-main)', ACC = 'var(--it-accent)', MOP = 'var(--it-mop)', INK = 'var(--it-ink)', RULE = 'var(--it-rule-s)';
  const Q = 'Thinking about selling?';
  const F = {
    bar: s => `font:800 ${s}pt ${MO};letter-spacing:${(s*.03).toFixed(2)}pt;text-transform:uppercase`,
    lab: s => `font:700 ${s}pt ${MO};letter-spacing:${(s*.22).toFixed(2)}pt;text-transform:uppercase`,
    adr: s => `font:700 ${s}pt ${PF}`,
    val: s => `font:600 ${s}pt ${PF}`,
    bul: s => `font:500 ${s}pt ${MO}`,
    q: s => `font:600 ${s}pt ${PF}`,
    note: s => `font:400 ${s}pt ${MO}`,
    name: s => `font:700 ${s}pt ${PF}`,
    phone: s => `font:700 ${s}pt ${MO}`,
    tag: s => `font:700 ${s}pt ${MO};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`,
    num: s => `font:600 ${s}pt ${PF}`,
  };
  const CSS = `<style>
    .ss .its-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ss .its-logo.r .logo{justify-content:flex-end}
    .ss .its-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .its-logo .text{font:700 12pt/1.15 ${MO};text-align:center;color:inherit}
    .ss .its-hs{position:absolute;overflow:hidden}.ss .its-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .its-caps{position:absolute;white-space:nowrap}
    .ss .its-wb{position:absolute;background:#fff;border:1.2pt solid ${ACC};box-sizing:border-box}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2};
    const M = document.createElement('div'); document.body.appendChild(M);
    const tmemo = new Map();
    T.tw = (t, css) => { const key = t + '|' + css; if(tmemo.has(key)) return tmemo.get(key); M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:nowrap;${css}`; M.textContent = t; const v = M.getBoundingClientRect().width*.75; tmemo.set(key, v); return v; };
    const memo = new Map();
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
  // the bar's capitals, measured on the page: the cap height and where the baseline falls in a line box as tall as the type (em)
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = `800 200px ${MO}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:800 200px ${MO};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}; return MET; };
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const hr = (x, y, w) => rect(x, y, w, .75, `background:${RULE}`), vr = (x, y, h) => rect(x, y, .75, h, `background:${RULE}`);
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  // one line of the bar's capitals set by its ink: the top of the letters at y
  const caps = (slot, t, x, y, w, s, color) => { const m = met(), base = m.base*s;
    return `<div class="its-caps" data-slot="${slot}" data-lines="1" style="left:${x}pt;top:${y - (base - m.cap*s)}pt;width:${w}pt;height:${s}pt;${F.bar(s)};line-height:${s}pt;color:${color}">${esc(t)}</div>`; };

  // ---------- photos: square, edge to edge ----------
  const heroKit = (D, T) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const photo = (pid, x, y, w, ht) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${ht}pt`);
    const ids0 = window.OHEmail ? OHEmail.support(D, id, 14) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)).slice(0, 14);
    const kind = p => { const t = String((D.photos[p] || {}).tags || p).toLowerCase().replace(/[0-9]+[a-z]?$/, '').trim(); return /foyer|stair|entry|hall/.test(t) ? 'entry' : t; };
    const named = ids0.filter(p => roomName(D, p)).concat(ids0.filter(p => !roomName(D, p))), seen = new Set(), first = [], rest = [];
    named.forEach(p => { const q = kind(p); if(seen.has(q)) rest.push(p); else { seen.add(q); first.push(p); } });
    const ids = first.concat(rest).slice(0, 8);   // rooms the writer named come first; never two photos of one room side by side
    const X = {id, pAR, photo, ids, cur: 0,
      take: n => { const out = X.ids.slice(X.cur, X.cur + n); X.cur += out.length; return out; },
      min: w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)),
      max: w => Math.ceil(hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : w/pAR),
      nat: w => Math.ceil(w/pAR),
      hero: (x, y, w, ht) => { if(hb && ht > w/pAR){ const vis = w/(ht*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return photo(id, x, y, w, ht); }};
    // the widest house frame (w or narrower) that keeps the whole house at height ht
    X.fitW = (w, ht, ms) => { if(X.min(w) <= ht + .5 && ht <= X.max(w) + .5) return w; for(let q = w - (ms || 60)*T.f; q >= w*.36; q -= w*.03) if(X.min(q) <= ht + .5 && ht <= X.max(q) + .5) return Math.floor(q); return 0; };
    // the house in a block w wide and ht tall: where the frame must narrow to keep the house whole, room photos fill beside it
    X.block = (x, y, w, ht, left, ms) => { const hw = X.fitW(w, ht, ms) || w; if(hw >= w - 1) return X.hero(x, y, w, ht);
      const g = r2(4*T.f), sw = w - hw - g, n = Math.max(1, Math.min(3, Math.round(ht/(sw/1.4)))), side = X.take(n), sh = (ht - (side.length - 1)*g)/Math.max(1, side.length);
      if(!side.length) return X.hero(x + (w - hw)/2, y, hw, ht);
      const hx = left ? x + sw + g : x, sx = left ? x : x + hw + g;
      return X.hero(hx, y, hw, ht) + side.map((p, i) => photo(p, sx, y + i*(sh + g), sw, sh)).join(''); };
    return X;
  };
  // the room a photo shows, as the writer named it (the lead of its caption)
  const roomName = (D, id) => { let out = ''; const walk = o => { if(out || !o || typeof o !== 'object') return; if(Array.isArray(o)) return o.forEach(walk);
      if(o.photo === id && typeof o.lead === 'string' && o.lead.trim()){ out = o.lead.replace(/[.:]\s*$/, '').trim(); return; } Object.values(o).forEach(walk); };
    walk(D.sw); walk(D.companion); if(out) return out;
    const t = String((D.photos[id] || {}).tags || '').toLowerCase().replace(/[0-9]+[a-z]?$/, '').trim();
    return ({kitchen: 'Kitchen', dining: 'Dining area', family: 'Family room', living: 'Living room', primary: 'Primary bedroom', pbath: 'Primary bath', bath: 'Bath', bed: 'Bedroom', foyer: 'Entry', entry: 'Entry', stair: 'Stairs', game: 'Game room', office: 'Office', deck: 'Deck', patio: 'Patio', pergola: 'Pergola', laundry: 'Laundry', bar: 'Bar', wine: 'Wine bar'})[t] || ''; };
  // the room tag: a main-color tab in the photo's corner with the room's name; never a stop or photo number (owner 11/24/2026: "Entry", not "01 Entry")
  const chip = (T, D, num, id, x, yEdge, maxW, top) => { const cs = T.FS*(T.chipK || 1), ch = r2(cs*1.9), nm = id ? roomName(D, id) : '', px = r2(Math.max(6*T.f, cs*.7));
    const nw = nm ? T.tw(nm, F.tag(cs)) : 0; if(!nm || nw + 2*px > maxW*.94) return '';
    const w = nw + 2*px, y = top ? yEdge : yEdge - ch;
    return rect(x, y, w, ch, `background:${MAIN}`) + txt('stop.' + num + '.room', nm, x + px, y + (ch - cs*1.3)/2, nw + 2, cs, 1.3, F.tag, ONM, {small: 1}); };
  const photoRow = (T, D, X, x, y, w, ht, n, num0, top) => { const ids = X.take(n); if(!ids.length || ht < 30) return ''; const g = r2(5*T.f), pw = (w - (ids.length - 1)*g)/ids.length;
    return ids.map((p, i) => X.photo(p, x + i*(pw + g), y, pw, ht) + chip(T, D, num0 + i, p, x + i*(pw + g), top ? y : y + ht, pw, top)).join(''); };

  // ---------- words ----------
  // the street, never shortened: one line down to the floor size, else (two: true) two lines at the floor with the last two words kept
  // together. Set inside a span, so the shared address pass leaves it as written.
  const street = (T, Li, w, max, two) => { const t = Li.address, s = T.one(t, F.adr, w, max, T.FE);
    if(s) return {t, s, n: 1, w: T.tw(t, F.adr(s))};
    if(!two) return null;
    const t2 = t.replace(/\s+(\S+)\s*$/, ' $1'), r = T.rows(t2, F.adr(T.FE), w, T.FE*1.2);
    return r.n <= 2 ? {t: t2, s: T.FE, n: 2, w: r.wide} : null; };
  const stH = st => st.n*st.s*1.2 + (st.n > 1 ? st.s*.15 : 0);
  const stTxt = (st, x, y, w) => txt('address', st.t, x, y, w, st.s, 1.2, F.adr, MOP, {n: st.n, html: `<span>${esc(st.t)}</span>`});
  // the place in tracked caps: it gives up tracking before it gives up size (the postcard's rule)
  const plFit = (T, place, w, max) => { for(const tr of [.2, .14, .08, .03]){ const face = s => `font:700 ${s}pt ${MO};text-transform:uppercase;letter-spacing:${(s*tr).toFixed(2)}pt`;
      const s = T.one(place, face, w - 2, Math.max(T.FS, max), T.FS); if(s) return {s, face, w: T.tw(place, face(s))}; } return null; };
  // the highlights under NEW, as the postcard front picks them: real selling facts, the dated ones first
  const tags = D => { let tg = []; try { tg = FXS.tagFacts(D).tags; } catch(e){ tg = []; }
    tg = tg.filter(t => !SocialSet.CONDITION.test(t)).filter((t, i, a) => !a.slice(0, i).some(u => FXS.sameFact(t, u)));
    const sc = t => (/\b(19|20)\d\d\b/.test(t) ? 4 : 0) + (/\d/.test(t) ? 1 : 0) + Math.min(t.length, 30)/30;
    return tg.map((t, i) => [sc(t), i, t]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map(x => x[2]); };
  // the agent's own note to the neighbors (the Just Sold postcard's box): the writer's sentences in order, each in either of its
  // written forms, from the first one on
  const notes = D => { const S = (((((D.sw || {}).pc || {}).js || {}).front || {}).note || {}).s || [], out = [];
    const alts = S.map(x => [].concat(x).map(String)).slice(0, 5);
    // the first sentence always, then any of the others in their order; each in its short form, its long form, or the first long
    for(let m = (1 << alts.length) - 1; m >= 3; m -= 2){ const pk = alts.filter((_, i) => m & (1 << i));   // (never the first sentence alone: the note always carries the ask)
      [a => a[0], a => a[a.length - 1], (a, i) => a[i ? 0 : a.length - 1]].forEach(fn => out.push(pk.map(fn).join(' '))); }
    out.push(SocialSet.SOLD_POST);
    return out.filter((t, i, a) => t && a.indexOf(t) === i && !SocialSet.CONDITION.test(t)); };

  // ---------- the title bar ----------
  // the main color from the left edge, bw wide, the accent line on its top edge, the words in 800 caps as large as the bar holds
  // (up to maxS), one line or stacked. o.grow: extra height shared above and under the words.
  const mkBar = (T, words, bw, padL, padR, maxS, o) => { o = o || {}; const iw = bw - padL - padR, acc = r2(Math.max(2.5, 3*T.f));
    const s = Math.min(...words.map(t => T.one(t, F.bar, iw - 2, maxS, T.FE) || 0)); if(!s) return null;
    const cap = met().cap*s, lg = r2(s*.27), bp = r2(Math.max((T.rpK && T.rpK < .5 ? 5.5 : 7)*T.f, s*.3)), n = words.length, h = acc + 2*bp + n*cap + (n - 1)*lg + (o.grow || 0);
    return {h, s, acc, bp, top: bp + cap + lg + (o.grow || 0)/2, ww: Math.max(...words.map(t => T.tw(t, F.bar(s)))), wmin: Math.min(...words.map(t => T.tw(t, F.bar(s)))), html: (y, x0) => rect(x0 || 0, y, bw, h, `background:${MAIN}`) + rect(x0 || 0, y, bw, acc, `background:${ACC}`)
      + words.map((t, i) => caps('moment' + (i ? i + 1 : ''), t, (x0 || 0) + padL, y + acc + bp + (o.grow || 0)/2 + i*(cap + lg), iw, s, ONM)).join('')}; };

  // ---------- the ruled table ----------
  const tcol = (T, labs, w) => { const ls = T.FS, gk = T.rpK ? (T.rpK < .5 ? .55 : .65) : 1, RL = Math.max(...labs.map(t => T.tw(t, F.lab(ls)))) - ls*.22 + r2(9*T.f*gk), vo = RL + r2(10*T.f*gk); return {ls, RL, vo, vw: w - vo, w}; };
  // rows: [{lab, h, html(vx, y, vw, h), top}]; o.extra: spare height shared among the rows; o.foot: a hairline under the last row
  const table = (T, C, rows, o) => { o = o || {}; const ex = (o.extra || 0)/rows.length, h = rows.reduce((s, r) => s + r.h + ex, 0);
    return {h, html: (x, y) => { let s = '', yy = y; rows.forEach((r, i) => { const rh = r.h + ex; if(i) s += hr(x, yy, C.w);
        s += txt('lab.' + r.lab.toLowerCase().replace(/\W+/g, ''), r.lab, x, r.top ? yy + r2(7*T.f) : yy + (rh - C.ls*1.3)/2, C.RL, C.ls, 1.3, F.lab, MOP, {small: 1});
        s += r.html(x + C.vo, yy, C.vw, rh); yy += rh; });
      s += vr(x + C.RL, y + r2(4*T.f), h - r2(8*T.f)); if(o.foot) s += hr(x, y + h, C.w); return s; }}; };
  const RP = (T, k) => r2(7.5*T.f*(T.rpK || Math.min(Math.max(k, .45), 1.25)));
  // WHERE: the street in Playfair 700 in the main color, the place in tracked caps under it (or at the right end of its line)
  const rowWhere = (T, Li, vw, k, inline, lgD, cap) => { const rp = RP(T, k), place = OHL.place(Li), gap = r2(14*T.f), SM = Math.min(cap || (lgD && lgD.cap) || 999, T.FE*1.5*Math.max(k, lgD ? .8 : 0));
    // lgD: the brokerage logo at the row's right end, large enough to stand in the row (never adrift in it); lgD.place: the place under the street
    if(lgD){ for(let mx = Math.max(SM, T.FE); mx >= T.FE - .01; mx -= 2){ const st = street(T, Li, vw - 60*T.f, mx); if(!st) return null;
        let pl = null; if(lgD.place){ for(const cut of [60, 90, 120, 150, 180]){ const q = plFit(T, place, vw - cut*T.f, T.FS*1.1*Math.min(k, 1)); if(!q) break; pl = q; if(vw - Math.max(st.w, q.w) - gap >= (st.s*1.2 + 2*T.f + q.s*1.3 + 2*rp)*1.9) break; } if(!pl) return null; }
        const lgap = r2(6*T.f), ch = st.s*1.2 + (pl ? 2*T.f + pl.s*1.3 : 0), hR = ch + 2*rp, lg = Math.min(vw - Math.max(st.w, pl ? pl.w : 0) - lgap, hR*3.4); if(lg < Math.max(46*T.f, hR*1.88)) continue;
        return {lab: 'Where', h: hR, ww: vw - Math.max(0, vw - Math.max(st.w, pl ? pl.w : 0) - lgap - lg), stn: 1, html: (vx, y, _, hh) => { const y0 = y + (hh - ch)/2;
          return stTxt(st, vx, y0, st.w + 2) + (pl ? txt('place', place, vx, y0 + st.s*1.2 + 2*T.f, pl.w + 2, pl.s, 1.3, pl.face, INK, {small: 1}) : '') + logoBox(lgD.D, vx + vw - lg, y + rp*.5, lg, hh - rp, 'r'); }}; }
      return null; }
    if(inline){ const st = street(T, Li, vw*.64, Math.min(SM, T.FE*1.5*k)); if(!st) return null;
      const pl = plFit(T, place, vw - st.w - gap, T.FS*1.1*k); if(!pl) return null;
      return {lab: 'Where', h: st.s*1.2 + 2*rp, ww: vw, html: (vx, y, _, hh) => { const y0 = y + (hh - st.s*1.2)/2;
        return stTxt(st, vx, y0, st.w + 2) + txt('place', place, vx + vw - pl.w - 2, y0 + st.s*1.2*.8 - pl.s*1.3*.8, pl.w + 2, pl.s, 1.3, pl.face, INK, {small: 1, align: 'right'}); }}; }
    const st = street(T, Li, vw, Math.min(SM, T.FE*1.5*k)); if(!st) return null;
    const pl = plFit(T, place, vw, T.FS*1.1*k), ch = stH(st) + (pl ? 2*T.f + pl.s*1.3 : 0);
    return {lab: 'Where', h: ch + 2*rp, ww: Math.max(st.w, pl ? pl.w : 0), stn: st.n, html: (vx, y, _, hh) => { const y0 = y + (hh - ch)/2;
      return stTxt(st, vx, y0, vw) + (pl ? txt('place', place, vx, y0 + stH(st) + 2*T.f, vw, pl.s, 1.3, pl.face, INK, {small: 1}) : ''); }}; };
  // THE HOME: bedrooms, baths and size on one Playfair line (the postcard's row), the year and the lot after them where the line holds them
  const rowHome = (T, D, vw, k, lgD) => { const six = OHL.factSix(D.listing), get = ic => six.filter(([i]) => i === ic).map(([, t]) => t.replace(' square feet', ' sq ft'));
    const bb = get('bed').concat(get('bath')), ar = get('area'), yr = get('cal').map(t => t.replace('Built in', 'built')), lot = get('lot'), J = l => l.join('  ·  ');
    const st = lot.length ? [] : get('stories').map(t => t.replace(/^One story$/, 'one story')), more = lot.length ? lot : st;   // the lot, or the story count where there is none
    const rp = RP(T, k), s0 = r2(Math.max(T.FB, T.FB*1.2*k)); if(!bb.length && !ar.length) return null;
    const sets = [[J(bb.concat(ar, yr, more))], [J(bb.concat(ar, yr))], [J(bb), J(ar.concat(yr, more))], [J(bb), J(ar.concat(yr))], [J(bb.slice(0, 1)), J(bb.slice(1).concat(ar))]].map(q => q.filter(Boolean));
    for(const lines of sets){ const s = Math.min(...lines.map(t => T.one(t, F.val, vw - 2, s0, T.FB) || 0)); if(!s) continue;
      const lh = s*1.32, ch = lines.length*lh, ww = Math.max(...lines.map(t => T.tw(t, F.val(s)))), hR = ch + 2*rp;
      if(lgD){ const lg = Math.min(vw - ww - r2(6*T.f), hR*3.4); if(lg < Math.max(46*T.f, hR*1.88)) continue;
        return {lab: 'The home', h: hR, ww: vw, html: (vx, y, _, hh) => { const y0 = y + (hh - ch)/2; return lines.map((t, i) => txt('facts.' + i, t, vx, y0 + i*lh, ww + 2, s, 1.32, F.val, INK)).join('') + logoBox(lgD.D, vx + vw - lg, y + rp*.5, lg, hh - rp, 'r'); }}; }
      return {lab: 'The home', h: hR, ww, html: (vx, y, _, hh) => { const y0 = y + (hh - ch)/2; return lines.map((t, i) => txt('facts.' + i, t, vx, y0 + i*lh, vw, s, 1.32, F.val, INK)).join(''); }}; }
    return null; };
  // NEW: the highlights on square main-color bullets, n of them in cols columns
  const rowNew = (T, D, vw, k, n, cols) => { const rp = RP(T, k), s0 = r2(Math.max(T.FB, T.FB*1.05*k)), bx = r2(4.5*T.f), off = r2(12*T.f), cg = r2(14*T.f), cw = (vw - (cols - 1)*cg)/cols;
    const list = tags(D).slice(0, n); if(list.length < Math.min(n, 2) || list.some(t => T.tw(t, F.bul(T.FB)) > cw - off - 2)) return null;
    const s = Math.min(...list.map(t => T.one(t, F.bul, cw - off - 2, s0, T.FB))), lh = s*1.6, nr = Math.ceil(list.length/cols), ch = nr*lh;
    return {lab: 'New', h: ch + 2*rp, shown: list, ww: cols > 1 ? vw : off + Math.max(...list.map(t => T.tw(t, F.bul(s)))), html: (vx, y, _, hh) => { const y0 = y + (hh - ch)/2;
      return list.map((t, i) => { const x = vx + (i % cols)*(cw + cg), yy = y0 + Math.floor(i/cols)*lh;
        return rect(x, yy + (lh - bx)/2, bx, bx, `background:${MAIN}`) + txt('new.' + i, t, x + off, yy + (lh - s*1.3)/2, cw - off, s, 1.3, F.bul, INK); }).join(''); }}; };
  // INSIDE: room photos side by side, each with its stop number
  const rowInside = (T, D, X, ht, num0) => { const rp = r2(6*T.f);
    return {lab: 'Inside', h: ht, top: 1, html: (vx, y, vw, hh) => { const ph = hh - 2*rp, n = Math.max(1, Math.min(3, Math.floor(vw/(128*T.f)))); return photoRow(T, D, X, vx, y + rp, vw, ph, n, num0); }}; };
  // the writer's sentences in order (the first always kept), as many as fill maxN lines or fewer at width w: every line 80%+ and the
  // last 90%+ of the measure (owner 11/8), the measure narrowed a little or the type raised up to 12% to get there
  const writeUp = (T, D, w, s0, maxN, shown) => { T.wu = T.wu || {}; const key = [Math.round(w), s0, maxN].join('|'); if(key in T.wu) return T.wu[key];
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing).concat(shown || [])).slice(0, 7), near = /\bmiles?\b/i; let best = null;
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of [1, .96, .92, .88, .84, .8]) for(const s of [s0, r2(s0*1.06), r2(s0*1.12)]){ const r = T.rows(t, F.note(s), w*m, s*1.42); if(r.n > maxN || r.n < 2) continue;
        if(r.last < .9*r.wide || r.ws.slice(0, -1).some(x => x < .8*r.wide) || r.wide < .82*w) continue;
        const sc = r.n*100 + (near.test(t) ? 80 : 0) + m*20 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc, wide: r.wide}; } }
    if(best){ best.h = best.n*best.s*1.42 + best.s*.15;
      best.html = (x, y) => txt('writeup', best.t, x, y, best.w, best.s, 1.42, F.note, INK, {n: best.n}); }
    return (T.wu[key] = best); };
  // ABOUT: the write-up in the white box with the thin accent edge
  const rowAbout = (T, D, vw, k, maxN, shown) => { const rp = RP(T, k), nb = r2(8*T.f*Math.min(k, 1.2)), wu = writeUp(T, D, vw - 2*nb, r2(Math.max(T.FB, T.FB*1.02*k)), maxN, shown); if(!wu) return null;
    const bh = wu.h + 2*nb;
    return {lab: 'About', h: bh + 2*rp, n: wu.n, html: (vx, y, _, hh) => `<div class="its-wb" style="left:${vx}pt;top:${y + rp}pt;width:${Math.min(vw, wu.wide + 2*nb + 3)}pt;height:${hh - 2*rp}pt"></div>` + wu.html(vx + nb, y + rp + (hh - 2*rp - wu.h)/2)}; };

  // ---------- Just Sold: the question over the agent's note in the white box ----------
  const pickNote = (T, D, iw, ns0, maxN, av) => { T.pn = T.pn || {}; const key = [iw.toFixed(1), ns0, maxN, Math.round(av || 0)].join('|'); if(key in T.pn) return T.pn[key]; return (T.pn[key] = pickNote0(T, D, iw, ns0, maxN, av)); };
  const pickNote0 = (T, D, iw, ns0, maxN, av) => { const list = T.notes || (T.notes = notes(D));
    // ragged lines, every one 80%+ of the widest and the last 90%+; the measure narrows to get there (the box is sized to the text, and
    // runs 92%+ of its room where any note allows it)
    for(const full of [.92, .82]) for(let n = Math.min(maxN, 8); n >= 1; n--) for(const m of [1, .96, .92, .88, .84]) for(let s = ns0; s <= Math.min(ns0*1.13, av ? (av - ns0*.2)/(n*1.42) : 999) + .01; s += .5) for(const t of list){
      const w = iw*m, r = T.rows(t, F.note(s), w, s*1.42); if(r.n !== n) continue;
      if(r.wide < full*iw || (n > 1 && (r.last < .9*r.wide || r.ws.slice(0, -1).some(x => x < .8*r.wide)))) continue;
      return {t, n, s, w, wide: r.wide}; }
    return null; };
  // o.lines: the most note lines; or o.room: the height the block may take
  const sell = (D, T, w, k, o) => {
    let ql = [Q], qs = T.one(Q, F.q, w, T.FE*1.25*k*(o.qK || 1), T.FB);
    if(!qs){ ql = ['Thinking about', 'selling?']; qs = T.one(ql[0], F.q, w, T.FE*1.25*k, T.FB); if(!qs) return null; }
    if(o.noq) ql = [];
    const qh = ql.length*qs*1.22, nb = r2(8.5*T.f*Math.min(k, 1.25)), ns0 = r2(Math.max(T.FB*(o.nK || 1), T.FB*1.05*k)), qg = ql.length ? r2(5*T.f) : 0;
    const av = o.lines != null ? 0 : o.room - qh - qg - 2*nb, maxN = o.lines != null ? o.lines : Math.floor((av - ns0*.2)/(ns0*1.42));
    const pk = maxN > 0 ? pickNote(T, D, w - 2*nb, ns0, maxN, av) : null; if(!pk) return null;
    const lh = pk.s*1.42, mh = pk.n*lh + pk.s*.15 + 2*nb, h = qh + qg + mh;
    return {h, len: pk.t.length, n: pk.n, html: (x, y) => { let s = '', yy = y;
      ql.forEach((t, i) => { s += txt('sold.q' + (i ? 2 : ''), t, x, yy, w, qs, 1.22, F.q, MOP); yy += qs*1.22; });
      s += `<div class="its-wb" style="left:${x}pt;top:${yy + qg}pt;width:${Math.min(w, pk.wide + 2*nb + 3)}pt;height:${mh}pt"></div>`
        + txt('sold.note', pk.t, x + nb, yy + qg + nb, pk.w, pk.s, 1.42, F.note, INK, {n: pk.n});
      return s; }}; };

  // ---------- the agent: the name in Playfair 700, the phone in Montserrat 700 with REALTOR(R) in tracked caps, the one logo ----------
  // 'row': the lines at the left (after the headshot), the logo at the right end. 'line': one line across. 'stack': the lines with
  // the logo centered under them.
  const agent = (D, T, w, k, mode, nologo) => {
    const A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), gap = r2(9*T.f);
    const tone = /^#?f/i.test(getComputedStyle(document.documentElement).getPropertyValue('--it-ink').trim()) ? 'dark' : 'light';
    const sizes = cw => { const ns = T.one(A.name || '', F.name, cw, T.FB*1.6*k, T.FB*1.1); if(!ns) return null;
      const ds = r2(Math.max(T.FS, T.FS*Math.min(k, 1.2))), dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0; let ps = null, inl = true;
      for(let s = r2(Math.max(T.FB, T.FB*1.15*k)); s >= T.FB - .01 && !ps; s -= .5) if(T.tw(A.phone || '', F.phone(s)) + (nar ? s*.6 + dW : 0) <= cw) ps = s;
      if(!ps){ inl = false; ps = T.one(A.phone || '', F.phone, cw, T.FB*1.15*k, T.FB); if(!ps) return null; }
      const pW = T.tw(A.phone || '', F.phone(ps)), nW = T.tw(A.name || '', F.name(ns));
      // REALTOR(R) rides the shorter of the two lines (after the name, or after the phone as on the postcard), so the block runs even
      const onName = nar && inl && nW < pW && nW + ns*.5 + dW <= cw;
      const wide = onName ? Math.max(nW + ns*.5 + dW, pW) : Math.max(nW, inl ? pW + (nar ? ps*.6 + dW : 0) : Math.max(pW, dW));
      return {ns, ps, ds, dW, pW, nW, onName, inl, wide, th: ns*1.2 + 2*T.f + ps*1.3 + (inl || !nar ? 0 : T.f + ds*1.3)}; };
    const lines = (S, x, y) => { let s = txt('agent.name', A.name || '', x, y, (S.onName ? S.nW : S.wide) + 2, S.ns, 1.2, F.name, INK), yy = y + S.ns*1.2 + 2*T.f;
      s += txt('agent.phone', A.phone || '', x, yy, S.pW + 2, S.ps, 1.3, F.phone, INK);
      if(nar && S.onName) s += txt('agent.desig', 'REALTOR®', x + S.nW + S.ns*.5, y + S.ns*1.2*.8 - S.ds*1.3*.78, S.dW + 2, S.ds, 1.3, F.tag, MOP, {small: 1});
      else if(nar) s += S.inl ? txt('agent.desig', 'REALTOR®', x + S.pW + S.ps*.6, yy + S.ps*1.3*.78 - S.ds*1.3*.78, S.dW + 2, S.ds, 1.3, F.tag, MOP, {small: 1})
        : txt('agent.desig', 'REALTOR®', x, yy + S.ps*1.3 + T.f, S.dW + 2, S.ds, 1.3, F.tag, MOP, {small: 1});
      return s; };
    const logo = (x, y, lw, lh, cls) => `<div class="abs its-logo ${cls || ''}" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${INK}">${OHL.logo(D, tone, '')}</div>`;
    const hs = (x, y, hw, hh) => `<div class="abs its-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    if(mode === 'line') for(const h1 of (hsOn ? [1, 0] : [0])){
      const ns = T.one(A.name || '', F.name, w*.42, T.FB*1.6*k, T.FB*1.1), ps = r2(Math.max(T.FB, T.FB*1.15*k)), ds = r2(Math.max(T.FS, T.FS*Math.min(k, 1.2))); if(!ns) return null;
      const lh = r2(ns*1.5), hsW = h1 ? r2(lh*.85) : 0, nW = T.tw(A.name || '', F.name(ns)), pW = T.tw(A.phone || '', F.phone(ps)), dW = nar ? ps*.6 + T.tw('REALTOR®', F.tag(ds)) : 0;
      const lw = nologo ? 0 : Math.min(w*.28, lh*3.6), slack = w - (hsW ? hsW + gap : 0) - nW - pW - dW - lw; if(slack < (nologo ? 1 : 2)*gap*1.5){ if(h1) continue; return null; }
      return {h: lh, html: (x, y) => { const x0 = x + (hsW ? hsW + gap : 0), mx = nologo ? x + w - pW - dW : x0 + nW + slack/2, by = y + lh/2 + ns*.3;
        return (hsW ? hs(x, y, hsW, lh) : '') + txt('agent.name', A.name || '', x0, by - ns*1.2*.8, nW + 2, ns, 1.2, F.name, INK)
          + (nologo ? rect(x0 + nW + slack/2, y + lh*.2, .75, lh*.6, `background:${RULE}`) : rect(x0 + nW + slack/4, y + lh*.2, .75, lh*.6, `background:${RULE}`) + rect(mx + pW + dW + slack/4, y + lh*.2, .75, lh*.6, `background:${RULE}`))
          + txt('agent.phone', A.phone || '', mx, by - ps*1.3*.78, pW + 2, ps, 1.3, F.phone, INK) + (nar ? txt('agent.desig', 'REALTOR®', mx + pW + ps*.6, by - ds*1.3*.78, dW, ds, 1.3, F.tag, MOP, {small: 1}) : '')
          + (nologo ? '' : logo(x + w - lw, y, lw, lh, 'r')); }};
    }
    // the line cannot hold all of it: REALTOR(R) goes under the name, the phone stands between two hairlines, the logo at the right end
    if(mode === 'line' && !nologo) for(const h1 of (hsOn ? [1, 0] : [0])){
      const ns = T.one(A.name || '', F.name, w*.42, T.FB*1.6*k, T.FB*1.1), ps = r2(Math.max(T.FB, T.FB*1.3*k)), ds = r2(Math.max(T.FS, T.FS*Math.min(k, 1.2))); if(!ns) return null;
      const nW = T.tw(A.name || '', F.name(ns)), dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0, b1 = Math.max(nW, dW), pW = T.tw(A.phone || '', F.phone(ps));
      const lh = ns*1.2 + (nar ? T.f + ds*1.3 : 0), hsW = h1 ? r2(lh*.82) : 0, lw = Math.min(w*.32, lh*3.6), slack = w - (hsW ? hsW + gap : 0) - b1 - pW - lw; if(slack < 4*gap || lw < 50*T.f){ if(h1) continue; return null; }
      return {h: lh, html: (x, y) => { const x0 = x + (hsW ? hsW + gap : 0), px = x0 + b1 + slack/2;
        return (hsW ? hs(x, y, hsW, lh) : '') + txt('agent.name', A.name || '', x0, y, nW + 2, ns, 1.2, F.name, INK) + (nar ? txt('agent.desig', 'REALTOR®', x0, y + ns*1.2 + T.f, dW + 2, ds, 1.3, F.tag, MOP, {small: 1}) : '')
          + rect(x0 + b1 + slack/4, y + lh*.15, .75, lh*.7, `background:${RULE}`) + rect(px + pW + slack/4, y + lh*.15, .75, lh*.7, `background:${RULE}`)
          + txt('agent.phone', A.phone || '', px, y + (lh - ps*1.3)/2, pW + 2, ps, 1.3, F.phone, INK) + logo(x + w - lw, y, lw, lh, 'r'); }};
    }
    if(mode === 'line') return null;
    if(mode === 'row'){
      for(const h0 of (hsOn ? [1, 0] : [0])){
        const p0 = sizes(w*.6); if(!p0) return null;
        const hsW = h0 ? Math.round(p0.th*.82) : 0, tx = h0 ? hsW + gap : 0; let S = null;
        if(nologo){ S = sizes(w - tx); if(!S) continue; const off = Math.max(0, (w - tx - S.wide)/2); return {h: S.th, html: (x, y) => (h0 ? hs(x + off, y, hsW, S.th) : '') + lines(S, x + off + tx, y)}; }
        // the logo gives up width before REALTOR(R) leaves the phone's line
        for(const q of [.4, .32, .25]){ const lw0 = Math.max(56*T.f, Math.min(w*q, p0.th*3.4)), c = sizes(w - lw0 - gap*1.6 - tx); if(c && (!S || (c.inl && !S.inl))) S = c; if(S && S.inl) break; }
        if(!S) continue;
        const lw = Math.min(w - tx - S.wide - gap*1.6, S.th*3.6); if(lw < 50*T.f) continue;
        return {h: S.th, html: (x, y) => (h0 ? hs(x, y, hsW, S.th) : '') + lines(S, x + tx, y) + logo(x + w - lw, y + S.th*.04, lw, S.th*.92, 'r')};
      }
      return null;
    }
    for(const h0 of (hsOn ? [1, 0] : [0])){
      const p0 = sizes(w); if(!p0) return null;
      if(nologo){ const hsW = h0 ? Math.round(p0.th*.82) : 0, S = sizes(w - (h0 ? hsW + gap : 0)); if(!S) continue;
        return {h: S.th, html: (x, y) => { const tot = (h0 ? hsW + gap : 0) + S.wide, x0 = x + (w - tot)/2; return (h0 ? hs(x0, y, hsW, S.th) : '') + lines(S, x0 + (h0 ? hsW + gap : 0), y); }}; }
      const lh0 = r2(Math.max(p0.ns*1.4, T.FB*1.9)), hsW = h0 ? Math.round((p0.th + 6*T.f + lh0)*.72) : 0, cw = w - (h0 ? hsW + gap : 0), S = sizes(cw); if(!S) continue;
      const lh1 = r2(Math.max(S.ns*1.4, T.FB*1.9)), lw = Math.min(cw, Math.max(S.wide, lh1*3.4)), lh = Math.min(lh1, r2(lw/3.6)), full = S.th + 6*T.f + lh, gW = Math.max(S.wide, lw);
      return {h: full, html: (x, y) => { const tot = (h0 ? hsW + gap : 0) + gW, x0 = x + (w - tot)/2, tx = x0 + (h0 ? hsW + gap : 0);
        return (h0 ? hs(x0, y, hsW, full) : '') + lines(S, tx + (gW - S.wide)/2, y) + logo(tx + (gW - lw)/2, y + S.th + 6*T.f, lw, lh); }};
    }
    return null;
  };

  const paperTone = () => /^#?f/i.test(getComputedStyle(document.documentElement).getPropertyValue('--it-ink').trim()) ? 'dark' : 'light';
  const logoBox = (D, x, y, lw, lh, cls) => `<div class="abs its-logo ${cls || ''}" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${INK}">${OHL.logo(D, paperTone(), '')}</div>`;
  const IS = {};
  // ================= post, pin, story =================
  // Just Listed: the house edge to edge across the head, the title bar under it, the ruled table (WHERE, THE HOME, NEW, INSIDE with
  // its numbered room photos, ABOUT in the white box), a hairline, the agent. Just Sold: the title bar across the head (under the
  // house on a story, whose top stays free of words), the house, WHERE, the question and the note in the white box, a hairline, the
  // agent. A story ends on numbered room photos run to its foot.
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB} = T, X = heroKit(D, T), Li = D.listing, sold = D.piece.moment === 'js', story = shape === 'story', sq = shape === 'square';
    const pad = r2(15*f), w = W - 2*pad, g = r2((sq ? 6 : 8)*f), BOT = story ? H - Math.max(94, r2(100*f)) : H, top0 = sold && !story ? r2((sq ? 4 : 8)*f) : 0, inMin = r2(64*f);
    const stripMin = story ? H - BOT + r2(30*f) : 0;
    const build = (k, o) => {
      const bar = mkBar(T, [SocialSet.M], W, pad, pad, FE*(sq ? 2.2 : 2.6)); if(!bar) return null;
      let ag = (!sq && agent(D, T, w, Math.max(k, 1), 'row')) || agent(D, T, w, k, 'row'); if(!ag) return null;   // the agent never smaller than the engine's own size
      if(!sold){
        const labs = ['Where', 'The home'].concat(o.fresh ? ['New'] : [], o.inside ? ['Inside'] : [], o.about ? ['About'] : []), C = tcol(T, labs, w);
        const rows = [sq && rowWhere(T, Li, C.vw, k, true, null, bar.s*.82) || rowWhere(T, Li, C.vw, k, false, null, bar.s*.82), rowHome(T, D, C.vw, k)]; if(rows.some(r => !r)) return null;
        // a WHERE row left bare at its right end: the street grows to run the row
        if(sq && (C.vw - rows[0].ww)*rows[0].h > .024*W*H) rows[0] = [1.2, 1.5, 1.8, 2.2].map(q => rowWhere(T, Li, C.vw, Math.max(k, 1)*q, false, null, bar.s*.82)).find(q => q && (C.vw - q.ww)*q.h <= .024*W*H) || rows[0];
        let shown = [];
        if(o.fresh){ let r = rowNew(T, D, C.vw, k, o.fresh, 1); if(!r) return null;
          if((C.vw - r.ww) > .3*C.vw) r = rowNew(T, D, C.vw, k, 4, 2) || rowNew(T, D, C.vw, k, 2, 2) || [1.3, 1.6, 1.9, 2.3].map(q => rowNew(T, D, C.vw, Math.max(k, 1)*q, o.fresh, 1)).find(q => q && (C.vw - q.ww)*q.h <= .026*W*H) || r;   // short highlights: two columns, or larger
          rows.push(r); shown = r.shown; }
        let ab = null; if(o.about){ ab = rowAbout(T, D, C.vw, k, o.about, shown); if(!ab || ab.n < Math.min(o.about, 2)) return null; }
        const fixed = bar.h + rows.reduce((s, r) => s + r.h, 0) + (ab ? ab.h : 0) + g + ag.h + (story ? g + stripMin : pad*.75) + (o.inside ? inMin : 0);
        return {bar, C, rows, ab, ag, room: H - fixed};
      }
      const C = tcol(T, o.inside ? ['Where', 'Inside'] : ['Where'], w), wr = rowWhere(T, Li, C.vw, k, true, null, bar.s*.82) || rowWhere(T, Li, C.vw, k, false, null, bar.s*.82); if(!wr) return null;
      // o.split (the square): the question and the note at the left, a hairline, the agent with the logo under at the right
      const wL = o.split ? r2(w*.52) : w, sl = sell(D, T, wL, k, {lines: o.nl, nK: story ? 1.3 : 1}); if(!sl || sl.n < Math.min(o.nl, 2)) return null;
      if(o.split){ const cwA = w - wL - 2*g; ag = null;
        const lgW = Math.min(w - bar.ww - 14*f, (bar.h - bar.acc - 10*f)*3.8), barLogo = lgW >= 46*f;
        for(const ka of [1.5, 1.3, 1.15, 1, .9, .8, .7, .6]){ const a = agentCol(D, T, ka, {logo: !barLogo}); if(a.w <= cwA && a.h <= Math.max(sl.h, 60*f) + 2){ ag = {h: a.h, html: (x, y) => a.html(x + (cwA - a.w)/2, y)}; break; } }
        ag = ag || agent(D, T, cwA, k, 'stack', barLogo); if(!ag) return null;
        return {bar, C, rows: [wr], sl, ag, wL, lgW: barLogo ? lgW : 0, room: H - (top0 + bar.h + wr.h + g + Math.max(sl.h, ag.h) + pad*.75)}; }
      const fixed = top0 + bar.h + wr.h + g + sl.h + g + g + ag.h + (story ? g + stripMin : pad*.75) + (o.inside ? inMin : 0);
      return {bar, C, rows: [wr], sl, ag, room: H - fixed};
    };
    const opts = sold ? (story ? [6, 5, 4, 3, 2, 1].map(nl => ({nl})) : sq ? [{nl: 5, split: 1}, {nl: 4, split: 1}, {nl: 3, split: 1}, {nl: 2, split: 1}, {nl: 1, split: 1}] : [{nl: 4, inside: 1}, {nl: 3, inside: 1}, {nl: 5}, {nl: 4}, {nl: 3}, {nl: 2}, {nl: 1}])
      : story ? [{fresh: 3, about: 4}, {fresh: 2, about: 3}, {fresh: 2, about: 2}, {fresh: 2}, {}]
      : sq ? [{inside: 1}, {fresh: 2}, {}]
      : [{fresh: 2, inside: 1, about: 2}, {inside: 1, about: 2}, {fresh: 2, about: 2}, {about: 2}, {fresh: 2, inside: 1}, {inside: 1}, {fresh: 2}, {}];   // the write-up stays on the post and the pin
    const hMinFull = X.min(W);   // the square keeps the house about as large as its photo's own shape
    const KMAX = 1.6, KMIN = .6, heroMin = Math.min(X.min(W), ...[.8, .66, .55, .45].map(q => X.min(W*q)));
    let pick = null;
    const narrowOK = room => { const q = X.fitW(W, room); return q && (!sq || q >= .7*W); };
    const tries = !sold && !story && !sq ? [1, 0].flatMap(full => opts.filter(o => o.about).map(o => [o, full])).concat([1, 0].flatMap(full => opts.filter(o => !o.about).map(o => [o, full])))
      : [1, 0].flatMap(full => opts.map(o => [o, full]));
    { for(const [o, full] of tries){
      const b1 = build(KMIN, o); if(!b1 || (full ? b1.room < hMinFull : !narrowOK(b1.room))) continue;
      const need = full ? Math.min(b1.room, Math.max(hMinFull, X.min(W) + .55*(X.nat(W) - X.min(W)))) : b1.room;
      let k = KMIN; for(let t = KMAX; t >= KMIN; t -= .025){ const b = build(t, o); if(b && b.room >= need && (full ? b.room >= hMinFull : narrowOK(b.room))){ k = t; break; } }
      pick = {o, k}; break;
    } }
    pick = pick || {o: sold ? {nl: 1} : {}, k: KMIN};
    const {o, k} = pick, B = build(k, o) || build(KMIN, o) || build(KMIN, sold ? {nl: 1} : {});
    // the house takes the room the words leave (never more than keeps it whole); what is left goes to the room photos, then the rows
    const ph = Math.max(heroMin, Math.min(X.max(W), B.room)), spare = Math.max(0, B.room - ph);
    const inH = o.inside ? inMin + Math.min(spare, r2(46*f)) : 0, stripH = story ? stripMin + Math.min(spare, r2(60*f)) : 0, extra = spare - (o.inside ? inH - inMin : 0) - (story ? stripH - stripMin : 0);
    let h = CSS, y = 0, num = 1;
    if(!sold){
      h += X.block(0, 0, W, ph); y = ph;
      h += B.bar.html(y); y += B.bar.h;
      const rows = B.rows.slice(); if(o.inside){ rows.push(rowInside(T, D, X, inH, num)); }
      if(B.ab) rows.push(B.ab);
      const tb = table(T, B.C, rows, {extra: extra*.7, foot: 1}); h += tb.html(pad, y); y += tb.h + g + extra*.15;
      h += B.ag.html(pad, y); y += B.ag.h;
      if(story) h += photoRow(T, D, X, 0, y + g + extra*.15, W, H - y - g - extra*.15, 2, 1, true);
    } else {
      if(story){ h += X.block(0, 0, W, ph); y = ph; h += B.bar.html(y); y += B.bar.h; }
      else { y = top0; h += B.bar.html(y);
        if(B.lgW){ const tone = /^#?f/i.test(getComputedStyle(document.documentElement).getPropertyValue('--it-on-main').trim()) ? 'dark' : 'light', lh = B.bar.h - B.bar.acc - r2(10*f);
          h += `<div class="abs its-logo r" style="left:${W - pad - B.lgW}pt;top:${y + B.bar.acc + r2(5*f)}pt;width:${B.lgW}pt;height:${lh}pt;color:${ONM}">${OHL.logo(D, tone, '')}</div>`; }
        y += B.bar.h; h += X.block(0, y, W, ph); y += ph; }
      const rows = B.rows.slice(); if(o.inside) rows.push(rowInside(T, D, X, inH, num));
      const tb = table(T, B.C, rows, {extra: extra*.3, foot: 1}); h += tb.html(pad, y); y += tb.h + g + extra*.2;
      if(o.split){ const hh = Math.max(B.sl.h, B.ag.h); y += extra*.3;
        h += B.sl.html(pad, y + (hh - B.sl.h)/2) + vr(pad + B.wL + g, y, hh) + B.ag.html(pad + B.wL + 2*g, y + (hh - B.ag.h)/2); y += hh; }
      else {
      h += B.sl.html(pad, y); y += B.sl.h + g + extra*.2;
      h += hr(pad, y, w); y += g + extra*.15;
      h += B.ag.html(pad, y); y += B.ag.h; }
      if(story) h += photoRow(T, D, X, 0, y + g + extra*.15, W, H - y - g - extra*.15, 2, 1, true);
    }
    T.done();
    return h;
  };

  // ================= wide (X) and Google Business Profile =================
  // The postcard front's arrangement with the house kept as large as it was: the title bar runs in from the left edge with JUST over
  // LISTED (or SOLD), hugging its words; under it in the same column the agent (headshot, name, REALTOR(R), phone); the house takes the
  // rest of the width off the top and right edges. Under them the ruled rows run the full width: WHERE (the street over the place, the
  // brokerage logo at the row's right end), then THE HOME (bedrooms, baths, size, year) on Just Listed, or the question and the agent's
  // note in the white box on Just Sold.
  const agentCol = (D, T, k, o) => { const A = D.agent || {}, hsOn = !o.nohs && OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), gap = r2(8*T.f);
    const ns = r2(Math.max(T.FB*1.1, T.FB*1.5*k)), ds = r2(Math.max(T.FS, T.FS*Math.min(k, 1.2))), ps = r2(Math.max(T.FB, T.FB*1.15*k));
    const nW = T.tw(A.name || '', F.name(ns)), dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0, pW = T.tw(A.phone || '', F.phone(ps)), lw = Math.max(nW, dW, pW);
    const th = ns*1.2 + (nar ? ds*1.3 : 0) + T.f + ps*1.3, hsH = o.above ? r2(th*.66) : th, hsW = hsOn ? (o.above ? Math.min(lw, r2(hsH*1.3)) : r2(hsH*.82)) : 0, lgH = o.logo ? r2(Math.max(ns*1.25, T.FB*1.8)) : 0;
    const side = hsOn && !o.above, w = side ? hsW + gap + lw : Math.max(lw, hsW), h = (hsOn && o.above ? hsH + gap*.7 : 0) + th + (lgH ? gap + lgH : 0);
    return {w, h, html: (x, y) => { let s = '', tx = x + (side ? hsW + gap : 0), yy = y;
      if(hsOn){ s += `<div class="abs its-hs" style="left:${x}pt;top:${y}pt;width:${hsW}pt;height:${hsH}pt"><img src="${esc(A.headshot)}" alt=""></div>`; if(o.above) yy += hsH + gap*.7; }
      s += txt('agent.name', A.name || '', tx, yy, nW + 2, ns, 1.2, F.name, INK); yy += ns*1.2;
      if(nar){ s += txt('agent.desig', 'REALTOR®', tx, yy, dW + 2, ds, 1.3, F.tag, MOP, {small: 1}); yy += ds*1.3; }
      yy += T.f; s += txt('agent.phone', A.phone || '', tx, yy, pW + 2, ps, 1.3, F.phone, INK); yy += ps*1.3;
      if(lgH) s += logoBox(D, tx, yy + gap, lw, lgH);
      return s; }}; };
  const land = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE} = T, X = heroKit(D, T), Li = D.listing, sold = D.piece.moment === 'js', wide = shape === 'wide'; T.rpK = wide ? .26 : .6;
    const pad = r2(Math.min(14*f, W*.035)), w = W - 2*pad, g = r2(wide ? 2*f : Math.min(7*f, H*.02)), strip = wide ? 0 : r2(Math.min(8*f, H*.026)), pr = r2(7*f), padB = r2(pad*(wide ? .3 : .45)), HOLE = .0285*W*H, hsOn = OHL.cardMode(D) === 'headshot' && !!(D.agent || {}).headshot;
    const words = ['Just', sold ? 'Sold' : 'Listed'], C = tcol(T, sold ? ['Where'] : ['Where', 'The home'], w);
    let pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
    for(const relax of [0, 1]){ for(const k of [1.5, 1.3, 1.15, 1, .9, .8, .7, .6, .5]) for(const lgRow of (sold ? [1, 0] : [1, 2, 0])) for(const above of [0]) for(const ka of [1.7, 1.4, 1.15, .95, .8, .65, .5]){
      // above 2: the headshot stands at the bar's right end, over the agent's lines
      const ag = agentCol(D, T, ka, {above: above === 1, nohs: above === 2, logo: !lgRow});
      for(let mx = FE*3.2*k; mx >= FE*1.2 - .01; mx -= 3){ const b = mkBar(T, words, 9999, pad, pr, mx); if(!b) break;
        // the bar hugs its words; where the agent's block under it is wider, a room photo stands between the bar and the house
        const hug = Math.ceil(pad + b.ww + pr), bw0 = Math.ceil(Math.max(hug, pad + ag.w + pr)), fillW = bw0 - hug >= 44*f ? bw0 - hug : 0, bhs = 0, bw = bw0, PW = W - bw; if(PW < W*.45) continue;
        const barW = fillW ? hug : bw;
        if(!relax && Math.max((barW - pad - b.wmin - 5)*(b.top - 5), (barW - pad - b.ww - 5)*(b.h - 5)) > HOLE) continue;
        const cap = b.s*.9;   // the house number never stands taller than the moment word
        if(!relax && (bw - pad - ag.w - 5)*(ag.h - 5) > HOLE) continue;   // no bare paper beside the agent's lines
        const wr = lgRow === 1 ? rowWhere(T, Li, C.vw, k, false, {D, place: 1, cap}) : (rowWhere(T, Li, C.vw, k, true, null, cap) || rowWhere(T, Li, C.vw, k, false, null, cap)); if(!wr) continue;
        if(!relax && (C.vw - wr.ww)*wr.h > HOLE) continue;
        const h1 = strip + b.h + g + ag.h + g, hTop = Math.min(X.max(PW), X.nat(PW)*1.25);
        const hw = h1 <= hTop + .5 ? X.fitW(PW, h1, 40) : 0; if(!hw || (!relax && hw < W*.45)) continue;
        const lows = sold ? [{lines: 3}, {lines: 2}, {lines: 2, noq: 1}, {lines: 1, noq: 1}].map(q => sell(D, T, w, k, q)).filter(Boolean) : [rowHome(T, D, C.vw, k, lgRow === 2 ? {D} : null)].filter(Boolean);
        for(const lo of lows){ const left = H - h1 - wr.h - lo.h - (sold ? g : 0) - padB; if(left < 0 || (!sold && !relax && (C.vw - lo.ww)*lo.h > HOLE)) continue;
          const up = Math.max(0, Math.min(left, Math.min(X.max(PW), X.nat(PW)*1.12) - h1, .05*H)), rest = left - up; if(!relax && rest > 18*f) continue;
          take({k, b, bw, barW, fillW, PW, ag, wr, lo, h1: h1 + up, up, rest, sc: k*100 + ka*45 + hw*(h1 + up)/(W*H)*700 + b.s*4 - (fillW ? 15 : 0) - rest*2 - (hw < PW ? 40 : 0) - (lgRow ? 0 : 70) - (above ? 30 + above*10 : 0) + (sold ? Math.min(lo.len, 120)*1.2 + (lo.n > 1 ? 60 : 0) : 0)});
          break; }
      } }
      if(pick) break; }
    let h = CSS;
    if(!pick){ const b = mkBar(T, words, 9999, pad, pr, FE*1.2), ag = agentCol(D, T, .5, {above: 0, logo: 1}), bw = Math.ceil(pad + Math.max(b.ww, ag.w) + pr), wr = rowWhere(T, Li, C.vw, .5) || {lab: 'Where', h: 0, html: () => ''};
      pick = {k: .5, b, bw, barW: bw, fillW: 0, PW: W - bw, ag, wr, lo: {lab: 'The home', h: 0, html: () => ''}, h1: H - wr.h - padB, up: 0, rest: 0}; }
    const P = pick, bar = mkBar(T, words, P.barW, pad, pr, P.b.s);
    h += X.block(P.bw, 0, P.PW, P.h1, false, 40) + bar.html(strip) + P.ag.html(pad, strip + bar.h + g + P.up/2);
    if(P.fillW){ const rid = X.take(1)[0]; h += rid ? X.photo(rid, P.barW, 0, P.fillW - r2(3*f), strip + bar.h) : rect(P.barW, strip, P.fillW, bar.h, `background:${MAIN}`); }
    let y = P.h1;
    if(!sold){ const tb = table(T, C, [P.wr, P.lo].filter(r => r.h), {extra: P.rest*.8}); h += tb.html(pad, y); }
    else { const tb = table(T, C, [P.wr], {extra: P.rest*.4, foot: 1}); h += tb.html(pad, y); y += tb.h + g + P.rest*.3; h += P.lo.html(pad, y); }
    T.done();
    return h;
  };
  IS.portrait = tall;
  IS.landscape = land;

  // ================= carousel photo slides =================
  // the room edge to edge with its stop number (the slide's place in the carousel) and its name; the title bar with the accent line
  // under it; the ruled WHERE row at the foot
  IS.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), {f, FE} = T, X = heroKit(D, T), pad = r2(15*f), w = W - 2*pad, id = D.piece.photo;
    T.chipK = 1.3;   // the slide's stop chip reads at phone size (review 11/22)
    const bar = mkBar(T, [SocialSet.M], W, pad, pad, FE*2.1), C = tcol(T, ['Where'], w), wr = rowWhere(T, D.listing, C.vw, 1.15, true) || rowWhere(T, D.listing, C.vw, 1);
    const tb = table(T, C, [wr], {}), ph = H - bar.h - tb.h - r2(3*f), num = +(/(\d+)\s*$/.exec(String(D.piece.id || '')) || [0, 1])[1] || 1;
    const h = CSS + X.photo(id, 0, 0, W, ph) + chip(T, D, num, id, 0, ph, W, false) + bar.html(ph) + tb.html(pad, ph + bar.h);
    T.done();
    return h;
  };
  window.ITSocial = IS;
})();
