/* templates/soft-geometry/sg-social.js: Soft Geometry's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on
   piece matches its set's main pieces). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and replaces its three
   layouts for this set only; nothing shared changes.

   Read off the approved Soft Geometry pieces (postcard.html, flyer.html, sg-tokens.css, sg-marks.css, SG.burst / SG.wedge / SG.foot in sg.js):
     - Just Listed: the brand dark as the field, the house bleeding off the edges; "Just" in white and "listed" in the accent, Urbanist 700,
       sentence case, tight, as large as its room allows, the 16-ray sunburst beside the word; the accent wedge (a slanted ribbon that
       bleeds off the left edge) holding the street in 700 over the facts in tracked 600 caps; the highlights on small 12-ray sunbursts;
       a hairline, then the agent (name, REALTOR(R) in accent caps, phone) and the one logo. Room photos take the soft 9 pt corners.
       A house too wide to stand beside the words takes the head of the image, with the flyer's slanted accent block under it.
     - Just Sold: the kit's pale paper as the field, the house in soft corners; "Just" in ink and "sold" in the main color with the
       accent sunburst; the street; "Thinking about selling?" in the main color over the seller note; the dark foot under a slanted
       seam with the accent ribbon riding it, the agent and the logo on the foot.
     - carousel slides: the room in soft corners, the two-tone word with its sunburst, the street on the wedge (listed) or on the
       slanted dark foot (sold).
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house in every frame (the engine's
   house-cut check), text at the phone floors of templates/_shared/readsize.js. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const UR = "'Urbanist'", Q = 'Thinking about selling?';
  const C = {dark: 'var(--sg-dark)', on: 'var(--sg-on)', acc: 'var(--sg-accent)', wedge: 'var(--sg-wedge)', onw: 'var(--sg-on-accent)', paper: 'var(--sg-paper)',
    ink: 'var(--sg-ink)', text: 'var(--sg-text)', pmain: 'var(--sg-pmain)'};
  const F = {
    disp: s => `font:700 ${s}pt ${UR};letter-spacing:${(-s*.018).toFixed(2)}pt`,
    street: s => `font:700 ${s}pt ${UR};letter-spacing:-.3pt`,
    caps: ls => s => `font:600 ${s}pt ${UR};text-transform:uppercase;letter-spacing:${(s*ls).toFixed(2)}pt`,
    hl: s => `font:600 ${s}pt ${UR}`,
    q: s => `font:700 ${s}pt ${UR}`,
    note: s => `font:500 ${s}pt ${UR}`,
    name: s => `font:700 ${s}pt ${UR}`,
    tag: s => `font:600 ${s}pt ${UR};text-transform:uppercase;letter-spacing:${(s*.2).toFixed(2)}pt`,
    phone: s => `font:600 ${s}pt ${UR}`,
  };
  const CSS = `<style>
    .ss .sgs-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ss .sgs-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .sgs-logo .text{font:700 12pt/1.15 ${UR};text-align:center;color:inherit}
    .ss .sgs-hs{position:absolute;overflow:hidden}.ss .sgs-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .sgs-d{position:absolute;white-space:nowrap}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2, R: r2(Math.min(9*f, 14))};
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
    T.one = (t, face, w, max, min) => { for(let s = Math.ceil(Math.max(max, min)*2 - .02)/2; s >= min - .01; s -= .5) if(T.tw(t, face(s)) <= w) return s; return null; };
    T.done = () => M.remove();
    return T;
  };
  // Urbanist 700 measured on the page: how tall the letters of "Just listed" stand, and where the baseline falls in a line box as tall as the type (em)
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = `700 200px ${UR}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:700 200px ${UR};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {asc: c.measureText('Jld').actualBoundingBoxAscent/200, base}; return MET; };
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };

  // ---------- the set's marks (SG.burst and SG.poly of sg.js) ----------
  const burst = (cx, cy, r1, r2x, o) => { o = o || {}; const n = o.n || 16, w = o.w || Math.max(1.2, r2x*.055), s = 2*(r2x + w + 1); let d = '';
    for(let i = 0; i < n; i++){ const a = i*2*Math.PI/n; d += `M${(s/2 + r1*Math.cos(a)).toFixed(2)} ${(s/2 + r1*Math.sin(a)).toFixed(2)}L${(s/2 + r2x*Math.cos(a)).toFixed(2)} ${(s/2 + r2x*Math.sin(a)).toFixed(2)}`; }
    return `<svg class="abs" style="left:${cx - s/2}pt;top:${cy - s/2}pt;width:${s}pt;height:${s}pt;overflow:visible;pointer-events:none" viewBox="0 0 ${s} ${s}"><path d="${d}" stroke="${o.color || C.wedge}" stroke-width="${w}" stroke-linecap="round" fill="none"/></svg>`; };
  const big = (cx, cy, r) => burst(cx, cy, r*.36, r, {w: Math.max(2, r*.075)});
  const mini = (cx, cy, r) => burst(cx, cy, r*.38, r, {n: 12, w: Math.max(1.2, r*.16)});
  const poly = (pts, fill) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
    return `<svg class="abs" style="left:${x0}pt;top:${y0}pt;width:${w}pt;height:${h}pt;overflow:visible;pointer-events:none" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polygon points="${pts.map(p => (p[0] - x0).toFixed(2) + ',' + (p[1] - y0).toFixed(2)).join(' ')}" fill="${fill}"/></svg>`; };
  // the dark foot under a slanted seam (it rises to the right) with the accent ribbon riding the seam: the Just Sold postcard's foot
  const foot = (W, H, yl, rise, rb) => poly([[-1, yl], [W + 1, yl - rise], [W + 1, yl - rise + rb], [-1, yl + rb]], C.wedge) + poly([[-1, yl + rb - .3], [W + 1, yl - rise + rb - .3], [W + 1, H + 1], [-1, H + 1]], C.dark);

  // ---------- photos: the house whole; rooms and inset photos in soft corners ----------
  const heroKit = (D, T) => {
    const f = T.f, id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const photo = (pid, x, y, w, ht, soft) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${ht}pt${soft ? `;border-radius:${T.R}pt` : ''}`);
    const ids = (window.OHEmail ? OHEmail.support(D, id, 6) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)).slice(0, 6));
    const min = w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)), max = w => Math.ceil(hb ? Math.max(w/pAR, w/((hb.right - hb.left + .06)*pAR)) : w/pAR);
    const X = {id, pAR, hb, ids, photo, min, max, nat: w => Math.ceil(w/pAR),
      // a frame taller than the photo's own shape centers on the house
      hero: (x, y, w, ht, soft) => { if(hb && ht > w/pAR){ const vis = w/(ht*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return photo(id, x, y, w, ht, soft); },
      // does the whole house stand in a frame w wide and ht tall?
      fits: (w, ht) => ht <= w/pAR + .5 ? ht >= min(w) - .5 : !!hb && ht <= max(w) + .5,
      // n room photos side by side in soft corners, from the i-th
      row: (x, y, w, ht, n, g, i) => { const room = p => String((D.photos[p] || {}).tags || p).split(',')[0].trim().toLowerCase(), rest = ids.slice(i || 0), l = rest.slice(0, 1); rest.slice(1).forEach(p => { if(l.length < n && !l.some(q => room(q) === room(p))) l.push(p); }); rest.slice(1).forEach(p => { if(l.length < n && !l.includes(p)) l.push(p); }); if(!l.length || ht < 30) return ''; const pw = (w - (l.length - 1)*g)/l.length; return l.map((p, j) => photo(p, x + j*(pw + g), y, pw, ht, true)).join(''); },
      // the house in a column pw wide and room tall, in soft corners: where the house cannot fill the height, a room photo goes under it
      prints: (x, y, pw, room, g) => { const ph = Math.max(min(pw), Math.min(room, max(pw))), r = room - ph;
        return r >= 60*f && ids.length ? X.hero(x, y, pw, ph, true) + photo(ids[0], x, y + ph + g, pw, r - g, true) : X.hero(x, y + r/2, pw, ph, true); },
      // a frame too short for the whole house narrows (same shape) and a room photo takes the side, never paper
      block: (x, y, w, ht, soft, g) => { if(ht >= min(w) - .5) return X.hero(x, y, w, ht, soft); const sw = Math.max(w*.26, Math.min(w*.29 - g, w - Math.floor(w*ht/min(w)) - g)), hw = w - sw - g, pid = ids[0]; if(pid) X.off = 1;
        return pid ? X.hero(x, y, hw, Math.min(ht, max(hw)), soft) + photo(pid, x + hw + g, y, sw, ht, soft) : X.hero(x + (w - hw)/2, y, hw, Math.min(ht, max(hw)), soft); },
      rest: (pw, room) => { const r = room - Math.max(min(pw), Math.min(room, max(pw))); return r >= 60*f && ids.length ? 0 : r; }};
    return X;
  };

  // ---------- the two-tone word ----------
  const second = D => D.piece.moment === 'js' ? 'sold' : 'listed';
  const tones = sold => sold ? [C.ink, C.pmain] : [C.on, C.acc];
  // one line ("Just listed"), the sunburst beside it: as large as w holds, up to max
  const wordRow = (T, D, w, max) => { const sold = D.piece.moment === 'js', t2 = second(D), m = met(); let fs = null;
    const rk = sold ? .56 : .4;
    for(let s = Math.ceil(max*2)/2; s >= T.FE - .01; s -= .5) if(T.tw('Just ' + t2, F.disp(s)) + s*(.3 + 2*rk) <= w){ fs = s; break; }
    if(!fs) return null;
    const ww = T.tw('Just ' + t2, F.disp(fs)), r = fs*rk, [c1, c2] = tones(sold);
    return {fs, h: m.asc*fs, html: (x, y) => `<div class="sgs-d" data-slot="moment" data-lines="1" style="left:${x}pt;top:${y - (m.base - m.asc)*fs}pt;width:${ww + 2}pt;height:${fs}pt;${F.disp(fs)};line-height:${fs}pt;color:${c1}">Just <span style="color:${c2}">${t2}</span></div>`
      + big(x + ww + fs*.26 + r, y + m.asc*fs*.5, r)}; };
  // two lines ("Just" over "listed"), the sunburst beside the short word
  const wordStack = (T, D, w, max) => { const sold = D.piece.moment === 'js', t2 = second(D), m = met(); let fs = null;
    for(let s = Math.ceil(max*2)/2; s >= T.FE - .01; s -= .5) if(T.tw(t2, F.disp(s)) <= w - 1 && T.tw('Just', F.disp(s)) + s*.7 <= w){ fs = s; break; }
    if(!fs) return null;
    const jw = T.tw('Just', F.disp(fs)), r = Math.min(fs*.42, (w - jw - fs*.24)/2 - 1), lh = fs*.98, [c1, c2] = tones(sold);
    return {fs, h: m.asc*fs + lh, wide: Math.max(T.tw(t2, F.disp(fs)), jw + fs*.24 + 2*r), html: (x, y) => `<div class="sgs-d" data-slot="moment" data-lines="2" style="left:${x}pt;top:${y - (m.base - .01 - m.asc)*fs}pt;width:${w}pt;height:${2*lh + fs*.08}pt;${F.disp(fs)};line-height:${lh}pt;color:${c1}">Just<br><span style="color:${c2}">${t2}</span></div>`
      + (r >= 7*T.f ? big(x + jw + fs*.24 + r, y + m.asc*fs*.5, r) : '')}; };

  // ---------- words ----------
  // the street, never shortened: one line down to the floor size, else two lines at the floor, the number kept with the street's name
  const street = (T, Li, w, max, two) => { const t = Li.address, s = T.one(t, F.street, w, max, T.FE);
    if(s) return {t, s, n: 1, w: T.tw(t, F.street(s))};
    if(!two) return null;
    const t2 = t.replace(/^(\S+)\s+(\S+)/, '$1 $2'), r = T.rows(t2, F.street(T.FE), w, T.FE*1.2);
    return r.n <= 2 ? {t: t2, s: T.FE, n: 2, w: r.wide, last: r.last} : null; };
  const stH = st => st.n*st.s*1.2 + (st.n > 1 ? st.s*.15 : 0);
  const stTxt = (st, x, y, w, color) => txt('address', st.t, x, y, w, st.s, 1.2, F.street, color, {n: st.n, html: `<span>${esc(st.t)}</span>`});
  // the place in tracked caps (the postcards' eyebrow), the tracking closing up until the line holds it
  const placeFit = (T, Li, w, max, min) => { const t = OHL.place(Li); min = min || T.FS; for(const ls of [.3, .22, .14, .08, .04]){ const face = F.caps(ls), s = T.one(t, face, w, Math.max(max, min), min); if(s) return {t, s, face, w: T.tw(t, face(s))}; } return null; };
  const eyebrow = (T, Li, w, k, color) => { const p = placeFit(T, Li, w, T.FB*Math.min(k, 1.25), T.FS); if(!p) return null;
    return {h: p.s*1.3, html: (x, y) => txt('place', p.t, x, y, w, p.s, 1.3, p.face, color, {small: 1})}; };
  // the facts as the postcard's wedge carries them: bedrooms, baths, square feet, in tracked caps; the year built and the lot (the
  // flyer's block) where asked; short forms and a second line where the room is narrow
  const factSet = D => { const six = OHL.factSix(D.listing), pick = six.filter(([ic]) => ic === 'bed' || ic === 'bath' || ic === 'area'), yr = six.filter(([ic]) => ic === 'cal').map(([, t]) => t.replace('Built in', 'Built')), lot = six.filter(([ic]) => ic === 'lot').map(([, t]) => t);
    return {yr, lot, full: pick.map(([ic, t]) => ic === 'area' ? t.replace(' square feet', ' sq ft') : t),
      short: pick.map(([ic, t]) => ic === 'bed' ? t.replace('bedroom', 'bed') : ic === 'bath' ? t.replace(' full bath', ' bath') : t.replace(' square feet', ' sq ft'))}; };
  const J = l => l.join('  ·  ');
  // extra: 'yr' (the year built too) or 'all' (the year and the lot): one line when it holds them, else two (the listing's three, then the extras)
  const factFit = (T, FX, w, max, two, extra) => { const ex = extra === 'all' ? FX.yr.concat(FX.lot) : extra === 'yr' ? FX.yr : [];
    for(const list of [FX.full, FX.short]) for(const ls of [.12, .07, .03]){ const l = list.concat(ex), face = F.caps(ls), s = T.one(J(l), face, w, max, T.FB); if(s) return {lines: [J(l)], s, face, wide: T.tw(J(l), face(s))}; }
    if(two || ex.length) for(const list of [FX.full, FX.short]) for(const ls of [.1, .05, .02]){ if(list.length < 2) continue;
      const l4 = ex.length ? list.concat(ex) : list.length % 2 ? list.concat(FX.yr) : list, face = F.caps(ls), hf = ex.length > 1 ? list.length : Math.ceil(l4.length/2), ln = [J(l4.slice(0, hf)), J(l4.slice(hf))].filter(Boolean);
      const s = Math.min(...ln.map(t => T.one(t, face, w, max, T.FB) || 0)); if(s) return {lines: ln, s, face, wide: Math.max(...ln.map(t => T.tw(t, face(s))))}; }
    return null; };
  // the accent wedge's words: the street over the facts. o.place: the place in caps at the far end of the street's line when it holds
  // both; o.under: else on its own line under the street. o.smax: the street's largest size (the word above always stands larger)
  const wedge = (T, D, w, k, o) => { o = o || {}; const Li = D.listing, kk = Math.min(k, 1.5), py = r2(Math.min(8*T.f, 12)*Math.min(k, 1.2)), sm = Math.max(T.FE, Math.min(o.smax || 999, T.FE*1.5*kk));
    const fx = o.nofacts ? {lines: [], s: 0, wide: 0} : factFit(T, factSet(D), w, T.FB*(o.fmax || 1.05)*kk, o.two, o.extra); if(!fx) return null;
    let st = null, pl = null, un = null;
    if(o.place) for(let q = sm; q >= T.FE - .01 && !pl; q -= T.FE*.1){ const a = street(T, Li, w, q); if(!a) break; const p = placeFit(T, Li, w - a.w - 12*T.f, T.FB*Math.min(kk, 1.15), T.FB); if(p){ st = a; pl = p; } }
    if(!st) st = street(T, Li, w, sm, true); if(!st) return null;
    let tl = null; if(!pl && o.under && st.n === 2) tl = placeFit(T, Li, w - st.last - 12*T.f, T.FB*Math.min(kk, 1.15), T.FS);
    if(!pl && !tl && o.under){ un = placeFit(T, Li, w, T.FB*Math.min(kk, 1.15), T.FS); if(!un) return null; }
    const uh = un ? un.s*1.3 + 1 : 0, fh = fx.lines.length*fx.s*1.4, h = py + stH(st) + uh + 1 + fh + py*1.1;
    return {h, st, place: !!(pl || un || tl), wide: Math.max(st.w + (pl ? pl.w + 12*T.f : 0), fx.wide), inner: (x, y) => stTxt(st, x, y + py, pl ? st.w + 2 : w, C.onw)
      + (pl ? txt('place', pl.t, x + w - pl.w - 2, y + py + st.s*1.2*.8 - pl.s*1.3*.8, pl.w + 2, pl.s, 1.3, pl.face, C.onw, {small: 1, align: 'right'}) : '')
      + (un ? txt('place', un.t, x, y + py + stH(st), w, un.s, 1.3, un.face, C.onw, {small: 1}) : '')
      + (tl ? txt('place', tl.t, x + w - tl.w - 2, y + py + st.s*1.2 + st.s*1.2*.8 - tl.s*1.3*.8, tl.w + 2, tl.s, 1.3, tl.face, C.onw, {small: 1, align: 'right'}) : '')
      + fx.lines.map((t, i) => txt('facts.' + i, t, x, y + py + stH(st) + uh + 1 + i*fx.s*1.4, w, fx.s, 1.4, fx.face, C.onw)).join('')}; };
  // the wedge itself: from the left bleed to x1, leaning `lean` pt at its right end
  const ribbon = (x1, y, h, lean) => poly([[-1, y], [x1, y], [x1 - lean, y + h], [-1, y + h]], C.wedge);
  // the highlights of the Just Listed postcard, each on a small sunburst (a condition claim never goes on a social)
  const highlights = D => ((((D.sw || {}).pc || {}).jl || {}).front || {}).highlights || [];
  const bullets = (T, all, n, w, k) => { const mk = s => s*1.35, list = all.filter(t => t && !SocialSet.CONDITION.test(t) && T.one(t, F.hl, w - mk(T.FB), T.FB, T.FB)).slice(0, n); if(!list.length) return null;
    const sizes = list.map(t => T.one(t, F.hl, w - mk(T.FB), T.FB*1.15*Math.min(k, 1.5), T.FB)), ok = list;
    const fs = Math.min(...sizes), rh = fs*1.75;
    return {n: ok.length, h: ok.length*rh, wide: mk(fs) + Math.max(...ok.map(t => T.tw(t, F.hl(fs)))), html: (x, y, hh) => { const sp = Math.max(rh, (hh || 0)/ok.length);
      return ok.map((t, i) => mini(x + fs*.42, y + i*sp + sp/2, fs*.42) + txt('hl.' + i, t, x + mk(fs), y + i*sp + (sp - fs*1.3)/2, w - mk(fs), fs, 1.3, F.hl, C.on)).join(''); }}; };
  // the writer's lines (the house's story and what is nearby): his sentences in order, the first always kept, as many as fill minN to
  // maxN lines at width w, every line 80%+ and the last 90%+ of the measure (owner 11/8); set ragged, never stretched
  const GENERIC = new Set('house home homes room rooms floor floors first second third with this that from into through whole away mile miles built have runs over under behind beside between every their there which where'.split(' '));
  const keys = t => String(t || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(x => x.length >= 4 && !GENERIC.has(x)).map(x => x.replace(/(ing|ed|es|s)$/, ''));
  const writeUp = (T, D, w, s0, minN, maxN, avoid) => { T.wu = T.wu || {}; const key = [Math.round(w), s0, minN, maxN, (avoid || []).length].join('|'); if(key in T.wu) return T.wu[key];
    const shown = new Set((avoid || []).flatMap(keys)), tight = !!(avoid && avoid.length);
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing)).filter(t => !keys(t).some(x => shown.has(x))).slice(0, 7), near = /\bmiles?\b/i; let best = null;
    for(let mask = 1; mask < (1 << pool.length); mask += 1){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of (tight ? [1, .96, .92] : [1, .96, .92, .88, .84])) for(const s of [T.FB, s0, r2(s0*1.06), r2(s0*1.12)]){ const r = T.rows(t, F.note(s), w*m, s*1.4); if(r.n > maxN || r.n < minN) continue;
        if(r.last < .9*w*m || r.ws.slice(0, -1).some(x => x < (tight ? .86 : .8)*w*m) || (tight && t.length < 46)) continue;   // beside the bullets: full lines and a real sentence, or the room photo stands there instead
        const sc = r.n*100 + (near.test(t) ? 60 : 0) + (mask & 1 ? 30 : 0) + m*40 + Math.min(...r.ws)/w*40 - (s - s0)*2; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc}; } }
    if(best){ best.h = best.n*best.s*1.4 + best.s*.15; best.html = (x, y) => txt('writeup', best.t, x, y, best.w, best.s, 1.4, F.note, C.on, {n: best.n}); }
    return (T.wu[key] = best); };

  // ---------- the agent on the dark: name, REALTOR(R) in accent caps, the phone, the one logo ----------
  // 'line': one line across; 'row': the lines at the left (after the headshot), the logo at the right; 'stack': the lines with the logo under them
  const agent = (D, T, w, k, mode, al) => {
    const A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), gap = 10*T.f, INK = C.on, LAB = C.acc;
    const sizes = cw => { const ns = T.one(A.name || '', F.name, cw, T.FB*1.55*k, T.FB*1.1), ps0 = r2(Math.max(T.FB, T.FB*1.2*k)), ds = r2(Math.max(T.FS, T.FS*Math.min(k, 1.3))); if(!ns) return null;
      const dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0; let ps = null, inl = true;
      for(let s = ps0; s >= T.FB - .01 && !ps; s -= .5) if(dW + (nar ? s*.6 : 0) + T.tw(A.phone || '', F.phone(s)) <= cw) ps = s;
      if(!ps){ inl = false; ps = T.one(A.phone || '', F.phone, cw, ps0, T.FB); if(!ps) return null; }
      const wide = Math.max(T.tw(A.name || '', F.name(ns)), inl ? dW + (nar ? ps*.6 : 0) + T.tw(A.phone || '', F.phone(ps)) : Math.max(dW, T.tw(A.phone || '', F.phone(ps))));
      return {ns, ps, ds, dW, inl, wide, th: ns*1.18 + 2*T.f + (inl || !nar ? 0 : ds*1.3 + T.f) + ps*1.3}; };
    const lines = (S, x, y, cw, a) => { let s = txt('agent.name', A.name || '', x, y, cw, S.ns, 1.18, F.name, INK, {align: a}), yy = y + S.ns*1.18 + 2*T.f;
      const pw = T.tw(A.phone || '', F.phone(S.ps));
      if(S.inl && nar){ const tot = S.dW + S.ps*.6 + pw, x0 = a === 'left' ? x : x + (cw - tot)/2;
        s += txt('agent.desig', 'REALTOR®', x0, yy + S.ps*1.3*.78 - S.ds*1.3*.78, S.dW + 2, S.ds, 1.3, F.tag, LAB, {small: 1});
        s += txt('agent.phone', A.phone || '', x0 + S.dW + S.ps*.6, yy, pw + 2, S.ps, 1.3, F.phone, INK); }
      else { if(nar){ s += txt('agent.desig', 'REALTOR®', x, yy, cw, S.ds, 1.3, F.tag, LAB, {small: 1, align: a}); yy += S.ds*1.3 + T.f; }
        s += txt('agent.phone', A.phone || '', x, yy, cw, S.ps, 1.3, F.phone, INK, {align: a}); }
      return s; };
    const logo = (x, y, lw, lh) => `<div class="abs sgs-logo" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${INK}">${OHL.logo(D, 'dark', '')}</div>`;
    const hs = (x, y, hw, hh) => `<div class="abs sgs-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt;border-radius:${Math.min(T.R, hw*.2)}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    if(mode === 'row'){
      const lmin = Math.max(52*T.f, w*.26);
      for(const h0 of (hsOn ? [1] : [0])){
        const probe = sizes(w), hsW = h0 && probe ? Math.round(probe.th*.8) : 0, cw = w - lmin - gap*1.4 - (h0 ? hsW + gap : 0), S = sizes(cw); if(!S) continue;
        const tx = (h0 ? hsW + gap : 0), lx = tx + S.wide + gap*1.4, lw = w - lx;
        if(al === 'col' && lw < S.th*2.4) return null;   // a logo that cannot stand as tall as the lines beside it goes under them
        return {h: S.th, ns: S.ns, ww: w, html: (x, y) => (h0 ? hs(x, y, hsW, S.th) : '') + lines(S, x + tx, y, S.wide + 2, 'left') + logo(x + lx, y + S.th*.03, lw, S.th*.94)};
      }
      return null;
    }
    // 'line': the name, REALTOR(R) and the phone on one line, the logo at the far end (the postcard's own row)
    if(mode === 'line'){
      for(const h0 of (hsOn ? [1] : [0])){
        const ns = T.one(A.name || '', F.name, w*.4, T.FB*1.55*k, T.FB*1.1), ps = r2(Math.max(T.FB, T.FB*1.2*k)), ds = r2(Math.max(T.FS, T.FS*Math.min(k, 1.3))); if(!ns) return null;
        const nW = T.tw(A.name || '', F.name(ns)), dW = nar ? T.tw('REALTOR®', F.tag(ds)) + ns*.5 : 0, pW = T.tw(A.phone || '', F.phone(ps)), lh = ns*1.5, lw = Math.min(w*.3, lh*4.2), hsW = h0 ? Math.round(lh*.9) : 0, tx = h0 ? hsW + gap : 0;
        const slack = w - tx - nW - dW - ns*.9 - pW - lw; if(slack < gap*1.2) continue;
        const sh = slack > 60*T.f ? slack/2 : 0;   // a long row: REALTOR(R) and the phone sit midway between the name and the logo
        return {h: lh, ns, ww: w, html: (x, y) => { const by = y + lh*.5 + ns*.36;
          return (h0 ? hs(x, y, hsW, lh) : '') + txt('agent.name', A.name || '', x + tx, by - ns*1.18*.8, nW + 2, ns, 1.18, F.name, INK)
            + (nar ? txt('agent.desig', 'REALTOR®', x + tx + nW + ns*.5 + sh, by - ds*1.3*.78, dW, ds, 1.3, F.tag, LAB, {small: 1}) : '') + txt('agent.phone', A.phone || '', x + tx + nW + dW + ns*.9 + sh, by - ps*1.3*.79, pW + 2, ps, 1.3, F.phone, INK)
            + logo(x + w - lw, y, lw, lh).replace('justify-content:center', 'justify-content:flex-end'); }};
      }
      return null;
    }
    for(const hk of (hsOn ? [.72, .58, .46, .36, .3] : [0])){ const h0 = hk ? 1 : 0;
      const p0 = sizes(w); if(!p0) return null;
      const lh0 = r2(Math.max(p0.ns*1.4, T.FB*1.85)), hsW = h0 ? Math.round((p0.th + 6*T.f + lh0)*hk) : 0, cw = w - (h0 ? hsW + gap : 0), S = sizes(cw); if(!S) continue;
      const tWd = Math.min(cw, S.wide + 2), lh1 = r2(Math.max(S.ns*1.4, T.FB*1.85)*(al === 'left' ? 1.25 : 1)), lw = al === 'left' ? tWd : Math.min(cw, Math.max(tWd, lh1*3.4)), lh = Math.min(lh1, r2(lw/4)), full = S.th + 6*T.f + lh, gW = Math.max(tWd, lw);
      return {h: full, ns: S.ns, ww: (h0 ? hsW + gap : 0) + gW, html: (x, y) => { const tot = (h0 ? hsW + gap : 0) + gW, x0 = al === 'left' ? x : x + (w - tot)/2, tx = x0 + (h0 ? hsW + gap : 0);
        const hh = Math.min(full, hsW*1.3), hy = y + (full - hh)/2;
        return al === 'left' ? (h0 ? hs(x0, hy, hsW, hh) : '') + lines(S, tx, y, tWd, 'left') + logo(tx, y + S.th + 6*T.f, lw, lh).replace('justify-content:center', 'justify-content:flex-start')
          : (h0 ? hs(x0, hy, hsW, hh) : '') + lines(S, tx + (gW - tWd)/2, y, tWd, 'center') + logo(tx + (gW - lw)/2, y + S.th + 6*T.f, lw, lh); }};
    }
    return null;
  };

  // ---------- Just Sold: the question over the seller note ----------
  // the data's own notes, fullest first; the last resort is the set's standing line (never the question alone)
  const notes = D => { const F0 = ((((D.sw || {}).pc || {}).js || {}).front || {}), n2 = [].concat(F0.note2 || []).map(String);
    const tail = n2.map(t => t.split(/(?<=[.!?])\s+/).slice(1).join(' ')).filter(Boolean);
    return n2.concat(['I can tell you what your own home could bring in today’s market.'], tail, ['I can tell you what your home could bring today.', SocialSet.SOLD_POST])
      .filter((t, i, a) => t && a.indexOf(t) === i && !SocialSet.CONDITION.test(t)); };
  // the fullest note that fills the measure: as many lines as maxN allows, every line 80%+ and the last 90%+ (owner 11/8); the
  // measure may narrow a little or the type rise to get there. Always ragged: no stretched lines.
  const pickNote = (T, D, iw, ns0, maxN, up) => { const list = notes(D); up = up || 1.13;
    let best = null;
    for(let n = Math.min(maxN, 6); n >= 1 && !(best && best.n > n + 1); n--) for(const m of [1, .96, .92, .88]) for(let s = ns0; s <= ns0*up + .01; s += .5) list.forEach((t, i) => {
      const w = iw*m, r = T.rows(t, F.note(s), w, s*1.38); if(r.n !== n) return;
      if(n === 1 ? r.wide < .9*w : (r.last < .9*w || r.ws.slice(0, -1).some(x => x < .8*w))) return;
      const sc = Math.min(...r.ws)/iw*160 + (r.last/iw)*20 + (s - ns0)*1.5 - i*3 + n*6 + Math.min(t.length, 120)*.25;
      if(!best || sc > best.sc) best = {t, n, s, w, sc}; });
    return best; };
  // o.lines: the most note lines; or o.room: the height the question and the note may take
  const sell = (D, T, w, k, o) => {
    const qs = o.noq ? 0 : T.one(Q, F.q, w, o.qFill ? T.FE*o.qFill : T.FE*1.5*Math.min(k, 1.6), T.FB); if(!o.noq && !qs) return null;
    const qh = qs*1.22, ns0 = r2(Math.max(T.FB, T.FB*(o.noq ? 1.3 : 1.15)*Math.min(k, 1.5))), gq = o.noq ? 0 : 5*T.f;
    const maxN = o.lines != null ? o.lines : Math.floor((o.room - qh - gq - ns0*.2)/(ns0*1.38));
    const pk = maxN > 0 ? pickNote(T, D, w, ns0, maxN, o.lines ? 1.3 : 1.01) : null; if(o.lines && !pk) return null;
    const lh = pk ? pk.s*1.38 : 0, h = qh + (pk ? gq + pk.n*lh + pk.s*.15 : 0);
    return {h, n: pk ? pk.n : 0, len: pk ? pk.t.length : 0, last: pk && pk.t === SocialSet.SOLD_POST, html: (x, y) => (o.noq ? '' : txt('sold.q', Q, x, y, w, qs, 1.22, F.q, C.pmain))
      + (pk ? txt('sold.note', pk.t, x, y + qh + gq, pk.w, pk.s, 1.38, F.note, C.text, {n: pk.n, css: o.noq ? 'font-weight:600;color:' + C.pmain : ''}) : '')}; };
  // the street with the place in caps at the far end of its line (under it when the line cannot hold both)
  const streetRow = (T, Li, w, k, smax) => { const kk = Math.min(k, 1.5), sm = Math.max(T.FE, Math.min(smax || 999, T.FE*1.5*kk));
    for(let q = sm; q >= T.FE - .01; q -= T.FE*.1){ const a = street(T, Li, w, q); if(!a) break; const p = placeFit(T, Li, w - a.w - 12*T.f, T.FB*Math.min(kk, 1.15), T.FB);
      if(p) return {h: stH(a), two: 0, html: (x, y) => stTxt(a, x, y, a.w + 2, C.ink) + txt('place', p.t, x + w - p.w - 2, y + a.s*1.2*.8 - p.s*1.3*.8, p.w + 2, p.s, 1.3, p.face, C.pmain, {small: 1, align: 'right', css: 'font-weight:700'})}; }
    const a = street(T, Li, w, sm, true), p = placeFit(T, Li, w, T.FB*Math.min(kk, 1.15), T.FS); if(!a || !p) return null;
    return {h: stH(a) + 2*T.f + p.s*1.3, two: a.n > 1 ? 1 : 0, html: (x, y) => stTxt(a, x, y, w, C.ink) + txt('place', p.t, x, y + stH(a) + 2*T.f, w, p.s, 1.3, p.face, C.pmain, {small: 1, css: 'font-weight:700'})}; };

  // a column of blocks from y0, the room left over opened evenly between them
  const stack = (items, x, y0, room) => { const hh = items.reduce((s, it) => s + it.h + (it.gap || 0), 0), e = Math.max(0, room - hh)/(items.length + 1); let y = y0 + e, s = '';
    items.forEach(it => { y += it.gap || 0; s += it.html(x, y); y += it.h + e; }); return s; };
  const colH = items => items.reduce((s, it) => s + it.h + (it.gap || 0), 0);

  const SG = {};
  // ================= post, pin, square, story =================
  // Just Listed: the house across the head, bleeding off three edges; on the dark under it the word with its sunburst, the wedge
  // with the street and the facts, the highlights on small sunbursts beside a room in soft corners, a hairline, the agent.
  // Just Sold: the paper card; the house in soft corners, the word, the street, the question over the note, the slanted dark foot.
  // A story keeps its words out of the top and bottom 250 px: rooms in soft corners fill its foot.
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, T), Li = D.listing, sold = D.piece.moment === 'js', story = shape === 'story', sq = shape === 'square';
    const pad = r2(16*f), w = W - 2*pad, g = r2((sq ? 5 : 8)*f), BOT = story ? H - 96 : H, HL = highlights(D).filter(t => !SocialSet.CONDITION.test(t));
    const m = r2((sq ? 5 : 8)*f), rise = r2(W*.024), rb = Math.max(3, r2(3.5*f));
    const hw = sold ? W - 2*m : W;
    const agentT = k => agent(D, T, w, k, 'line') || agent(D, T, w, k, 'row') || agent(D, T, w, k, 'stack', 'center');
    const build = (k, o) => {
      const word = wordRow(T, D, w, FE*(sq ? 4.1 : 4.4)*Math.min(1.1, k*(sold ? (sq ? 1.5 : 1.5) : sq ? 1.38 : 1.25))); if(!word) return null;
      if(!sold){
        const wd = wedge(T, D, w - r2(6*f), k, {place: true, under: true, fmax: 1.3, extra: sq ? 'yr' : 'all', smax: word.fs*.8}); if(!wd) return null;
        let bl = null, wu = null, mh = 0;
        if(o.bul){ bl = bullets(T, HL, o.bul, w*(o.wu ? .56 : .6), k); if(!bl || bl.n < o.bul) return null; mh = bl.h;
          if(o.wu){ const rw = w - bl.wide - g*2.6, s0 = r2(Math.max(FB, FB*1.02*Math.min(k, 1.3))); if(rw < 96*f) return null;
            wu = writeUp(T, D, rw, s0, Math.max(2, bl.n), Math.max(3, Math.round(bl.h*1.25/(s0*1.4))), HL.slice(0, o.bul)); if(!wu) return null; mh = Math.max(bl.h, wu.h); } }
        else if(o.wu){ wu = writeUp(T, D, w, r2(Math.max(FB, FB*1.02*Math.min(k, 1.3))), 2, 3); if(!wu) return null; mh = wu.h; }
        const ag = agentT(k); if(!ag || word.fs < ag.ns*1.3) return null;
        const fixed = g*1.5 + word.h + g*1.4 + wd.h + (mh ? g*1.5 + mh : 0) + g*1.4 + 1 + g*1.1 + ag.h + (story ? g : pad*.9);
        return {word, wd, bl, wu, mh, ag, room: BOT - fixed};
      }
      const st = streetRow(T, Li, w, k, word.fs*.8), sl = sell(D, T, w, k, {lines: o.nl, noq: o.noq, qFill: story ? 2 : 1.45}), ag = agentT(k);
      if(!st || !sl || !ag || word.fs < ag.ns*1.3) return null;
      const footH = rise + rb + g*1.3 + ag.h + (story ? g : sq ? pad*.5 : pad*.85);
      return {word, st, sl, ag, footH, room: BOT - (m + g*1.5 + word.h + g*1.2 + st.h + g*1.2 + sl.h + g*1.6 + footH)};
    };
    const nb = [Math.min(3, HL.length)].filter(Boolean);
    const opts = sold ? (sq ? [{nl: 2, noq: 1}, {nl: 1, noq: 1}] : [{nl: 4}, {nl: 3}, {nl: 2}, {nl: 2, noq: 1}, {nl: 1, noq: 1}, {nl: 1}])
      : sq ? [{bul: 0}] : nb.flatMap(bul => [{bul, wu: 1}, {bul}]).concat([{bul: 0, wu: 1}, {bul: 0}]);
    const KMAX = 1.7, KMIN = .6, mn = X.min(hw), nat = X.nat(hw);
    // the richest arrangement that leaves the house a full frame; a tighter frame, then a narrowed one, only when nothing else fits
    let pick = null;
    const tries = opts.flatMap(o => [[o, mn + .2*(nat - mn)], [o, mn]]).concat(opts.map(o => [o, X.min(hw*.71)]));
    for(const [o, req] of tries){
      {
        const b1 = build(KMIN, o); if(!b1 || b1.room < req) continue;
        const need = Math.min(b1.room, story ? nat*.9 : mn + .7*(nat - mn));
        let k = KMIN; for(let t = KMAX; t >= KMIN; t -= .025){ const b = build(t, o); if(b && b.room >= need){ k = t; break; } }
        pick = {o, k}; break;
      }
      if(pick) break;
    }
    pick = pick || {o: sold ? {nl: 1} : {bul: 0}, k: KMIN};
    const B = build(pick.k, pick.o) || build(KMIN, pick.o);
    const ph = Math.max(60*f, Math.min(story ? nat*1.12 : X.max(hw), B.room)), spare = Math.max(0, B.room - ph), e = story ? 0 : spare/5;
    let h = CSS, y;
    if(!sold){
      h += X.block(0, 0, W, ph, false, r2(3*f)); y = ph + g*1.5 + e;
      h += B.word.html(pad, y); y += B.word.h + g*1.4 + e;
      h += ribbon(W - pad*.55, y, B.wd.h, r2(14*f)) + B.wd.inner(pad, y); y += B.wd.h;
      let used = 0;
      if(B.mh){ y += g*1.5 + e;
        if(B.bl && B.wu) h += B.bl.html(pad, y + (B.mh - B.bl.h)/2, B.bl.h) + B.wu.html(pad + w - B.wu.w, y + (B.mh - B.wu.h)/2);
        else if(B.wu) h += B.wu.html(pad + (w - B.wu.w)/2, y);
        else { const sw = w - B.bl.wide - g*2.2; if(sw >= 56*f && X.ids.length > (X.off || 0)){ h += X.photo(X.ids[X.off || 0], pad + w - sw, y, sw, B.bl.h, true); used = 1; } h += B.bl.html(pad, y, B.bl.h); }
        y += B.mh; }
      y += g*1.4 + e; h += rect(pad, y, w, 1, `background:${C.on};opacity:.3`); y += 1 + g*1.1 + e*.5;
      h += B.ag.html(pad, y); y += B.ag.h;
      if(story) h += X.row(pad, y + g*1.6, w, H - r2(7*f) - y - g*1.6, 2, g, used + (X.off || 0));
    } else {
      h += X.block(m, m, hw, ph, true, g); y = m + ph + g*1.5 + e;
      h += B.word.html(pad, y); y += B.word.h + g*1.2 + e;
      h += B.st.html(pad, y); y += B.st.h + g*1.2 + e;
      h += B.sl.html(pad, y); y += B.sl.h + g*1.6 + e + rise;
      h += foot(W, H, y, rise, rb); y += rb + g*1.3 + e*.5;
      h += B.ag.html(pad, y); y += B.ag.h;
      if(story) h += X.row(pad, y + g*1.6, w, H - r2(7*f) - y - g*1.6, 2, g, X.off || 0);
    }
    T.done();
    return h;
  };

  // ================= wide (X) and Google Business Profile =================
  // Just Listed, one layout for every house: the house at the head of the right side, as wide as three fifths of the image; under it
  // the flyer's slanted accent block with the street, the place and the facts; the word, the highlights (where the column holds them)
  // and the agent down the dark column at the left.
  // Just Sold, the postcard: the house in soft corners at the left, the words beside it, the slanted dark foot with the agent.
  const side = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, T), Li = D.listing, sold = D.piece.moment === 'js';
    const padX = r2(Math.min(15*f, W*.045)), padY = r2(Math.min(13*f, H*.06)), g = r2(Math.min(7*f, H*.03)), gC = r2(Math.min(13*f, W*.035));
    const KS = [2, 1.8, 1.6, 1.45, 1.3, 1.15, 1, .9, .8, .7, .6, .5, .42, .35], HL = highlights(D).filter(t => !SocialSet.CONDITION.test(t));
    let h = CSS, pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
    // the agent in a column: the largest setting that leaves no hole beside it
    const agentIn = (cw, k, fs) => { let best = null; for(const q of [1.6, 1.35, 1.15, 1, .85]){ const a = agent(D, T, cw, k*q, 'row', 'col') || agent(D, T, cw, k*q, 'stack', 'left'); if(!a || (fs && fs < a.ns*1.3)) continue;
      a.hole = Math.max(0, cw + gC - a.ww)*a.h/(W*H); if(!best || a.hole < best.hole - .004) best = a; if(a.hole < .02) break; } return best; };
    if(!sold){
      const col = (iw, k, o) => { const it = [];
        if(o.eye){ const e = eyebrow(T, Li, iw, k, C.on); if(!e) return null; it.push(e); }
        const word = o.one ? wordRow(T, D, iw, FE*4.2*k) : wordStack(T, D, iw, FE*4.2*k); if(!word) return null; if(o.one) word.wide = iw; it.push(Object.assign({gap: o.eye ? g*.7 : 0}, word));
        if(o.fcol){ let fx = factFit(T, factSet(D), iw, FB*1.1*Math.min(k, 1.5), true, 'yr');
          if(!fx){ const FX = factSet(D), l = FX.short.concat(FX.yr), hf = Math.ceil(l.length/2), ln = [l.slice(0, hf).join(' · '), l.slice(hf).join(' · ')].filter(Boolean), sz = Math.min(...ln.map(t => T.one(t, F.hl, iw, FB*1.1*Math.min(k, 1.5), FB) || 0)); if(sz) fx = {lines: ln, s: sz, face: F.hl}; }
          if(!fx) return null;
          it.push({h: fx.lines.length*fx.s*1.4, gap: g*1.1, html: (x, y) => fx.lines.map((t, i) => txt('facts.' + i, t, x, y + i*fx.s*1.4, iw, fx.s, 1.4, fx.face, C.acc)).join('')}); }
        if(o.bul){ const bl = bullets(T, HL, o.bul, iw, k); if(!bl || bl.n < o.bul) return null; it.push({h: bl.h, gap: g*1.1, html: (x, y) => bl.html(x, y, bl.h)}); }
        const ag = agentIn(iw, k, word.fs); if(!ag) return null;
        it.push({h: 1, gap: g*1.2, html: (x, y) => rect(x, y, iw, 1, `background:${C.on};opacity:.3`)}); it.push(Object.assign({gap: g}, ag));
        return {it, h: colH(it), k, fs: word.fs, hole: ag.hole || 0, slack: iw - Math.max(word.wide, ag.ww || 0) + (ag.hole > .027 ? 200 : 0)}; };
      const avail = H - 2*padY, bulls = [3, 2, 1, 0].filter(n => n <= HL.length), gB = r2(4*f);
      for(const two of [0, 1]){ if(pick) break;
      for(let fr = .3; fr <= .471; fr += .01){ const cw = Math.round(W*fr), iw = cw - padX - gC*.6, pw = W - cw, lean = r2(Math.min(12*f, 16)), nat = X.nat(pw), bw = pw - lean - padX*.9;
        // the block's words as large as leave the house its own shape (a shorter frame only when no size does)
        for(const fcol of [0, 1]){
        let wd = null; for(const kw of KS){ const q = wedge(T, D, bw, kw, {place: true, under: true, extra: 'yr', two: true, nofacts: fcol}); if(!q || (!two && q.st.n > 1) || H - gB - q.h < X.min(pw)) continue; wd = wd || q; if(H - gB - q.h >= nat*.94){ wd = q; break; } }
        if(!wd) continue;
        const phU = Math.min(H - gB - wd.h, Math.max(nat*1.15, X.min(pw)), X.max(pw)), bh = H - gB - phU;
        for(const o of bulls.flatMap(bul => [{bul, fcol}, {bul, fcol, one: 1}])){ let c = null; for(const kc of KS){ c = col(iw, kc, o); if(c && c.h <= avail && c.fs >= wd.st.s*1.15) break; c = null; } if(!c) continue;
          take({cw, iw, pw, wd, phU, bh, lean, c, sc: c.k*60 + o.bul*30 - (o.one ? 25 : 0) - fcol*30 + pw*phU/(W*H)*500 - (avail - c.h)*1.2 - (bh - wd.h)*2 - c.slack*1.5 - c.hole*4000 - (wd.st.n > 1 ? 80 : 0)}); break; } } } }
      if(pick){ const px = W - pick.pw, by = pick.phU + gB;
        h += X.hero(px, 0, pick.pw, pick.phU) + poly([[px + pick.lean, by], [W + 1, by], [W + 1, H + 1], [px, H + 1]], C.wedge) + pick.wd.inner(px + pick.lean + padX*.3, by + (pick.bh - pick.wd.h)/2)
          + stack(pick.c.it, padX, padY, avail); }
    } else {
      const rise = r2(W*.022), rb = Math.max(3, r2(3*f)), m = r2(padY*.6);
      const col = (iw, k, o, room) => { const it = [];
        const word = o.one ? wordRow(T, D, iw, FE*4.2*k) : wordStack(T, D, iw, FE*4.2*k); if(!word) return null; if(o.one) word.wide = iw; it.push(word);
        const st = streetRow(T, Li, iw, k, word.fs*.8); if(!st) return null; it.push(Object.assign({gap: g*1.1}, st));
        const sl = sell(D, T, iw, k, {room: room - colH(it) - g*1.2, noq: o.noq}); if(!sl || !sl.n) return null; it.push(Object.assign({gap: g*1.2}, sl));
        return {it, h: colH(it), k, fs: word.fs, sl, two: st.two, slack: iw - word.wide}; };
      for(const pass of [0, 1]){ if(pick) break;
      for(const ka of [1.3, 1.05, .85, .7, .6]){ const ag = agent(D, T, W - 2*padX, ka, 'line') || agent(D, T, W - 2*padX, ka, 'row'); if(!ag) continue;
        const footH = rb + g*1.5 + ag.h + padY*.9, FT = H - footH, avail = FT - rise - 2*m; if(avail < H*.5) continue;
        for(let fr = pass ? .36 : .45; fr <= .62; fr += .02){ const pw = Math.round(W*fr), iw = W - m - pw - gC - padX; if(avail < X.min(pw)) continue;
          for(const o of [{}, {one: 1}, {noq: 1}, {one: 1, noq: 1}]) for(const k of KS){ const c = col(iw, k, o, avail); if(!c || (!pass && c.two) || c.h > avail || c.fs < ag.ns*1.3) continue;
            take({pw, iw, c, ag, FT, avail, sc: k*70 + ka*10 - (o.one ? 20 : 0) - (o.noq ? 60 : 0) + Math.min(c.sl.len, 130)*2 + (c.sl.last ? -80 : 0) + (c.sl.n >= 2 ? 60 : 0) - c.two*150 - (avail - c.h)*1.2 - c.slack*1.5 - X.rest(pw, avail)*2 + pw*Math.min(avail, X.max(pw))/(W*H)*500}); break; } } } }
      if(pick){ const {pw, c, ag, FT, avail} = pick;
        h += X.prints(m, m, pw, avail, g) + stack(c.it, m + pw + gC, m, avail) + foot(W, H, FT, rise, rb) + ag.html(padX, FT + rb + g*1.5 - rise*.3); }
    }
    T.done();
    return h;
  };
  SG.portrait = tall;
  SG.landscape = side;

  // ================= carousel photo slides =================
  // the room in soft corners; Just Listed on the dark: the word with its sunburst over the street on the wedge. Just Sold on the paper:
  // the word with its sunburst, the street on the slanted dark foot.
  SG.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), {f, FE, FS} = T, X = heroKit(D, T), Li = D.listing, sold = D.piece.moment === 'js', m = r2(13*f), pad = r2(16*f), w = W - 2*pad, g = r2(8*f);
    const word = wordRow(T, D, w, FE*4.2), rise = r2(W*.024), rb = Math.max(3, r2(3.5*f));
    let st = null, pl = null; for(let q = 1.5; q >= .99 && !pl; q -= .1){ const a = street(T, Li, w - 8*f, FE*q); if(!a) break; const p = placeFit(T, Li, w - 8*f - a.w - 12*f, T.FB, T.FB); if(p){ st = a; pl = p; } }
    st = st || street(T, Li, w - 8*f, FE*1.5, true) || {t: Li.address, s: FE, n: 1, w: w};
    const py = r2(8*f), bh = stH(st) + 2*py, tail = sold ? rise + rb + bh + pad*.5 : bh + pad*.9, ph = H - m - g*1.6 - word.h - g*1.5 - tail;
    let h = CSS + X.photo(D.piece.photo, m, m, W - 2*m, ph, true), y = m + ph + g*1.6;
    h += word.html(pad, y); y += word.h + g*1.5;
    const row = (c1, c2) => stTxt(st, pad, y + py, pl ? st.w + 2 : w - 8*f, c1) + (pl ? txt('place', pl.t, pad + w - 8*f - pl.w - 2, y + py + st.s*1.2*.8 - pl.s*1.3*.8, pl.w + 2, pl.s, 1.3, pl.face, c2, {small: 1, align: 'right'}) : '');
    if(!sold) h += ribbon(W - pad*.55, y, bh, r2(14*f)) + row(C.onw, C.onw);
    else { y += rise; h += foot(W, H, y, rise, rb); y += rb; h += row(C.on, C.acc); }
    T.done();
    return h;
  };
  window.SGSocial = SG;
})();
