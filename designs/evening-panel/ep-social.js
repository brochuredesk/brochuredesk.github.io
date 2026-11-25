/* templates/evening-panel/ep-social.js: Evening Panel's own Just Listed and Just Sold social images (owner 11/18/2026: every
   follow-on piece matches its set's main pieces). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and replaces
   its three layouts for this set only; nothing shared changes.

   Read off the approved Evening Panel pieces (postcard.html, flyer.html, ep-tokens.css, ep-marks.css):
     - the brand's dark color as a solid panel; photos edge to edge beside it with a thin dark gutter between them
     - the status in two tones of DM Serif Display, sentence case: "Just" in white over "Listed" in the accent (Just Listed), or
       "Just Sold" as one oversized line across the head (Just Sold); the short accent rule under the stacked word
     - the pin before the street (DM Serif), the place in tracked accent caps; over the stacked status the city line stands as the
       white tracked eyebrow (the neighborhood stays off the socials, as the shared engine sets it)
     - Just Listed: highlights with the accent dash over their hairlines; the light paper strip across the foot with the line-icon
       facts (icon over a DM Serif numeral over tracked caps, thin rules between) and the logo; the agent (headshot, DM Serif name,
       REALTOR(R), phone) on the strip's second row (post, pin, story) or at the foot of the panel (square, Google, X)
     - Just Sold: "Thinking about selling?" in accent DM Serif, the agent's note in the accent outlined box, the agent quiet on the
       dark with the phone in the accent and the white logo
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house in every frame (the engine's
   house-cut check), text at the phone floors of templates/_shared/readsize.js. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const SER = "'DM Serif Display'", MAN = "'Manrope'";
  const DARK = 'var(--ep-dark)', ON = 'var(--ep-on)', ACC = 'var(--ep-accent)', SOFT = 'var(--ep-soft)', LIFT = 'var(--ep-lift)';
  const PAPER = 'var(--ep-paper)', PINK = 'var(--ep-paper-ink)', PTEXT = 'var(--ep-paper-text)', PMAIN = 'var(--ep-paper-main)';
  const Q = 'Thinking about selling?';
  const F = {
    word: s => `font:400 ${s}pt ${SER}`,
    street: s => `font:400 ${s}pt ${SER}`,
    place: s => `font:700 ${s}pt ${MAN};text-transform:uppercase;letter-spacing:${(s*.2).toFixed(2)}pt`,
    eye: s => `font:600 ${s}pt ${MAN};text-transform:uppercase;letter-spacing:${(s*.3).toFixed(2)}pt`,
    bul: s => `font:600 ${s}pt ${MAN}`,
    note: s => `font:400 ${s}pt ${MAN}`,
    q: s => `font:400 ${s}pt ${SER}`,
    name: s => `font:400 ${s}pt ${SER}`,
    phone: s => `font:700 ${s}pt ${MAN};letter-spacing:.3pt`,
    tag: s => `font:700 ${s}pt ${MAN};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`,
    val: s => `font:400 ${s}pt ${SER}`,
    key: s => `font:700 ${s}pt ${MAN};text-transform:uppercase;letter-spacing:${(s*.13).toFixed(2)}pt`,
  };
  const ICON = {   // the set's line icons (ep.js EP.ICON)
    bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
    bath: '<path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 12V5a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/>',
    area: '<path d="M4 4h16v16H4zM4 9h5M15 4v5M9 20v-5M20 15h-5"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    lot: '<rect x="3" y="4" width="18" height="16" stroke-dasharray="2.2 1.8"/><path d="M7.5 14.5l4.5-4 4.5 4M9 13.2V17h6v-3.8"/>',
  };
  const CSS = `<style>
    .ss .eps-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ss .eps-logo.r .logo{justify-content:flex-end}.ss .eps-logo.l .logo{justify-content:flex-start}
    .ss .eps-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .eps-logo .text{font:700 12pt/1.15 ${MAN};text-align:center;color:inherit}
    .ss .eps-hs{position:absolute;overflow:hidden}.ss .eps-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .eps-w{position:absolute;white-space:nowrap}
    .ss .eps-ic{position:absolute;fill:none;stroke-linecap:round;stroke-linejoin:round}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2, lgMax: shape === 'wide' ? 44 : shape === 'gbp' ? 36 : 999};   // lgMax: the logo's height on the two short images, whose type floors run large
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
  // DM Serif's capitals, measured on the page: the cap height and where the baseline falls in a line box as tall as the type (em)
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = `400 200px ${SER}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:400 200px ${SER};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}; return MET; };
  const capH = s => met().cap*s;
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  const icon = (ic, x, y, s, color, sw) => `<svg class="eps-ic" viewBox="0 0 24 24" style="left:${x}pt;top:${y}pt;width:${s}pt;height:${s}pt;stroke:${color};stroke-width:${sw || 1.5}">${ICON[ic] || ''}</svg>`;
  // the status in DM Serif, set by its ink: the top of the capitals at y. lines: one or two (the second word in the accent)
  const second = D => D.piece.moment === 'js' ? 'Sold' : 'Listed';
  const wordEl = (D, two, x, y, w, s) => { const m = met(), sp = `<span style="color:${ACC}">${second(D)}</span>`;
    return `<div class="eps-w" data-slot="moment.headline" data-lines="${two ? 2 : 1}" style="left:${x}pt;top:${y - (m.base - m.cap)*s}pt;width:${w}pt;height:${(two ? 2 : 1)*s}pt;${F.word(s)};line-height:${s}pt;color:${ON}">${two ? 'Just<br>' + sp : 'Just ' + sp}</div>`; };

  // ---------- photos: edge to edge, a thin dark gutter between them ----------
  const heroKit = (D, f) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const photo = (pid, x, y, w, ht) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${ht}pt`);
    // the room photos in the engine's support order, one per room (a second shot of the same room is skipped)
    const key = p => { const t = String((D.photos[p] || {}).tags || '').split(',')[0].trim().toLowerCase(); return (t || p).replace(/[\s_-]*\d+[a-z]?$/, '').replace(/\s+(room|area)$/, '').trim() || p; };
    const all = window.OHEmail ? OHEmail.support(D, id, 24) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)), seen = new Set(), pool = [];
    all.forEach(p => { const q = key(p); if(seen.has(q)) return; seen.add(q); pool.push(p); }); let ix = 0;
    // the house frame keeps the photo's own shape (a tenth taller at most, and never past the house's sides), so the pictured
    // building shows as it was shot; the shortest frame only gives up ground under the house
    const nat = w => Math.ceil(w/pAR), min = w => Math.min(OHL.minFrameH(D, id, w, 99999), nat(w));
    const max = w => Math.ceil(Math.min(nat(w)*1.1, hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : nat(w)));
    const hero = (x, y, w, ht) => { if(hb && ht > w/pAR){ const vis = w/(ht*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return photo(id, x, y, w, ht); };
    // room photos filling w x ht: side by side when the room is wide, stacked when it is tall
    const rooms = (x, y, w, ht, gut) => { if(ht < 8 || w < 8) return ''; const ar = w/ht;
      let n = 1, across = true; if(ar > 2.1) n = Math.min(4, Math.round(ar/1.45)); else if(ar < .62){ across = false; n = Math.min(3, Math.max(2, Math.round(1/ar/.85))); }
      const ids = []; for(let i = 0; i < n && ix < pool.length; i++) ids.push(pool[ix++]); if(!ids.length) return rect(x, y, w, ht, `background:${LIFT}`);
      const m = ids.length, pw = across ? (w - (m - 1)*gut)/m : w, ph = across ? ht : (ht - (m - 1)*gut)/m;
      return ids.map((p, i) => photo(p, across ? x + i*(pw + gut) : x, across ? y : y + i*(ph + gut), pw, ph)).join(''); };
    // a column w x ht for the house: the house in its own shape; the height it does not take goes to room photos under it
    // the house with the white logo centered in a short dark band under it (Just Sold on the short images)
    const planLogo = (w, ht, lh) => { const mn = min(w), mx = max(w), hh = Math.min(mx, ht - lh*1.45), rest = ht - hh; return hh >= mn - .5 && rest <= lh*1.75 ? {hh, rest} : null; };
    const colLogo = (D1, x, y, w, ht, lh) => { const q = planLogo(w, ht, lh), lw = Math.min(w*.8, lh*3.3); return hero(x, y, w, q.hh) + logo(D1, 'dark', x + (w - lw)/2, y + q.hh + (q.rest - lh)/2, lw, lh, ''); };
    const plan = (w, ht, gut) => { const mn = min(w), mx = max(w), need = Math.max(24, w*.14); if(ht < mn - .5) return null; if(ht <= mx + .5) return {hh: ht, rest: 0};
      if(ht - gut - mx < need && ht <= Math.min(nat(w)*1.22, hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : nat(w)) + .5) return {hh: ht, rest: 0};
      if(ht - gut - mn < need) return null; const hh = Math.max(mn, Math.min(mx, ht - gut - need)); return {hh, rest: ht - gut - hh}; };
    const col = (x, y, w, ht, gut, right) => { const p = plan(w, ht, gut); if(p) return hero(x, y, w, p.hh) + (p.rest ? rooms(x, y + p.hh + gut, w, p.rest, gut) : '');
      const mn = min(w), mx = max(w); if(ht < mn){ const w2 = Math.floor(w*ht/mn); return rooms(right ? x : x + w2 + gut, y, w - w2 - gut, ht, gut) + hero(right ? x + w - w2 : x, y, w2, ht); }
      return hero(x, y, w, mx) + (ht - mx - gut > 12 ? rooms(x, y + mx + gut, w, ht - mx - gut, gut) : rect(x, y + mx, w, ht - mx, `background:${LIFT}`)); };
    // the house across a full-width slot ht tall: where the slot is too short for the whole house it narrows (same shape) and a room stands beside it
    const across = (x, y, w, ht, gut) => { const mn = min(w); if(ht >= mn - .5) return hero(x, y, w, Math.min(ht, max(w)));
      const w2 = Math.floor(w*ht/mn); return hero(x, y, w2, ht) + rooms(x + w2 + gut, y, w - w2 - gut, ht, gut); };
    return {id, pAR, photo, min, max, nat, hero, rooms, plan, col, across, planLogo, colLogo};
  };

  // ---------- words ----------
  // the street, never shortened and never split (owner 11/18/2026): one line, down to the floor size; a column that cannot hold
  // it gives way to a wider one. Set inside a span, so the shared address pass leaves it as written.
  const street = (T, Li, w, max) => { const t = Li.address, s = T.one(t, F.street, w, max, T.FE); return s ? {t, s, n: 1, w: T.tw(t, F.street(s))} : null; };
  const stH = st => st.s*1.18;
  // the pin and the street, the city line in accent caps right under it (o.inline: on the street's line when it fits).
  // o.hang: the pin stands out in the margin, so the street has the column's full width (the short images with a long street)
  const addr = (T, D, w, k, o) => { o = o || {}; const Li = D.listing, kk = Math.min(k, 1.3), place = OHL.place(Li), f = T.f;
    const top = Math.max(T.FE, Math.min(T.FE*1.6*k, o.cap || 999)), offOf = s1 => o.hang ? 0 : r2(s1*1.05);
    const at = mx => { const st = street(T, Li, w - offOf(Math.max(mx, T.FE)), mx); return st ? {st, off: offOf(st.s)} : null; };
    const pl = off => { let ps = T.one(place, F.place, w - off, T.FS*1.05*kk, T.FS), px = off, face = F.place; if(!ps){ ps = T.one(place, F.place, w, T.FS, T.FS); px = 0; }
      for(const tr of [.1, .04]){ if(ps) break; face = s1 => `font:700 ${s1}pt ${MAN};text-transform:uppercase;letter-spacing:${(s1*tr).toFixed(2)}pt`; px = off; ps = T.one(place, face, w - off, T.FS, T.FS); if(!ps){ ps = T.one(place, face, w, T.FS, T.FS); px = 0; } } return ps ? {ps, px, face, pw: T.tw(place, face(ps))} : null; };
    let a = null, P = null, inline = false;
    if(o.inline) for(let mx = top; mx >= T.FE - .01 && !inline; mx -= 1){ const c = at(mx), q = c && pl(c.off); if(q && c.off + c.st.w + 12*f + q.pw + 2 <= w){ a = c; P = q; inline = true; } }
    if(o.inline && !inline){ const c = at(T.FE), face = s1 => `font:700 ${s1}pt ${MAN};text-transform:uppercase;letter-spacing:${(s1*.1).toFixed(2)}pt`, pw = T.tw(place, face(T.FS)); if(c && c.off + c.st.w + 9*f + pw + 2 <= w){ a = c; P = {ps: T.FS, px: 0, pw, face}; inline = true; } }
    if(!a) for(let mx = top; mx >= T.FE - .01 && !a; mx -= 1) a = at(mx);
    if(!a) return null;
    P = P || pl(a.off); if(!P) return null;
    const {st, off} = a, {ps, px, pw, face} = P, h = stH(st) + (inline ? 0 : 3*f + ps*1.3), pinS = r2(st.s*.72), ig = inline ? Math.min(12*f, Math.max(9*f, w - off - st.w - pw - 2)) : 0;
    return {h, s: st.s, n: 1, ww: inline ? off + st.w + ig + pw : Math.max(off + st.w, px + pw), html: (x, y) => icon('pin', o.hang ? x - pinS - 3*f : x - 1, y + (st.s*1.18 - pinS)/2, pinS, ACC, 1.6)
      + txt('address', st.t, x + off, y, st.w + 2, st.s, 1.18, F.street, ON, {html: `<span>${esc(st.t)}</span>`})
      + (inline ? txt('place', place, x + off + st.w + ig, y + st.s*1.18*.8 - ps*1.3*.8, pw + 2, ps, 1.3, face, ACC, {small: 1})
        : txt('place', place, x + px, y + stH(st) + 3*f, pw + 2, ps, 1.3, face, ACC, {small: 1}))}; };
  // the facts for the paper strip: [icon, numeral, label, short label]; ext: the year built and the lot as well
  const cellsOf = (D, ext) => { const L = D.listing || {}, f = [], cap = t => t.charAt(0).toUpperCase() + t.slice(1);
    if(L.beds) f.push(['bed', String(L.beds), L.beds == 1 ? 'Bedroom' : 'Bedrooms', L.beds == 1 ? 'Bed' : 'Beds']);
    if(L.baths){ const bt = window.BD && BD.bathsText ? BD.bathsText(L) : {main: `${L.baths} baths`};
      [bt.main, bt.half].filter(Boolean).forEach((t, i, a) => { const m = /^(\S+)\s+(.+)$/.exec(String(t).trim()); if(m) f.push(['bath', m[1], cap(m[2].toLowerCase()), a.length > 1 ? cap(m[2].toLowerCase()).replace(/\s*bath(room)?s?$/i, '') || 'Baths' : (m[1] == 1 ? 'Bath' : 'Baths')]); }); }
    if(L.sqft) f.push(['area', Number(L.sqft).toLocaleString('en-US'), 'Square feet', 'Sq ft']);
    if(ext){ const yr = L.yearBuilt || L.year; if(yr) f.push(['cal', String(yr), 'Built', 'Built']);
      const lot = (OHL.factSix(L).find(([ic]) => ic === 'lot') || [])[1], m = lot && /^([\d.,]+)\s+(.+)$/.exec(lot); if(m) f.push(['lot', m[1], cap(m[2]), cap(m[2])]); }
    return f; };
  // the highlights with the accent dash: the postcard's own, then the listing's other facts (year, lot, stories) the strip does not show
  const bulletsOf = (D, shown) => { const F0 = ((((D.sw || {}).pc || {}).jl || {}).front || {}), six = OHL.factSix(D.listing);
    const more = six.filter(([ic]) => (ic === 'cal' || ic === 'lot' || ic === 'stories') && !(shown || []).includes(ic)).map(([, t]) => t);
    return [].concat(F0.highlights || [], more).map(String).filter((t, i, a) => t && a.indexOf(t) === i && !SocialSet.CONDITION.test(t)); };
  const notes = D => { const F0 = ((((D.sw || {}).pc || {}).js || {}).front || {}), ns = ((F0.note || {}).s || []).map(x => [].concat(x).map(String));
    const combos = []; if(ns.length >= 2) ns[0].forEach(a => ns[1].forEach(b => combos.push(a + ' ' + b)));
    const tail = ns.length >= 2 ? ns[1] : [];
    return combos.concat([SocialSet.SOLD_POST], tail)   // the sale and the ask together, the engine's own two-sentence line, then the ask alone: never the sale without the ask
     
      .filter((t, i, a) => t && a.indexOf(t) === i && !SocialSet.CONDITION.test(t)); };
  const hsOn = D => OHL.cardMode(D) === 'headshot' && !!(D.agent || {}).headshot;
  const paperDark = () => getComputedStyle(document.documentElement).getPropertyValue('--ep-paper-ink').trim().toLowerCase() === '#ffffff';
  const logo = (D, tone, x, y, w, h, al) => `<div class="abs eps-logo ${al || ''}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;color:${tone === 'dark' ? ON : PINK}">${OHL.logo(D, tone, '')}</div>`;
  const hs = (D, x, y, w, h) => `<div class="abs eps-hs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"><img src="${esc(D.agent.headshot)}" alt=""></div>`;

  // ---------- the agent: the headshot, the name in DM Serif, REALTOR(R) in small caps (beside the phone, or on its own line), the phone ----------
  // photo: 0 none | 1 where it fits | 2 always (the agent's own choice is shown on every shape)
  const agentLines = (T, D, w, k, c, photo, flat) => { if(flat === 1){ const a2 = agentLines(T, D, w, k, c, photo, 0); if(a2 && a2.lines === 2) return a2; const a1 = agentLines(T, D, w, k, c, photo, 2); return a1 || a2; } const A = D.agent || {}, nar = A.nar || /realtor/i.test(A.designation || '');
    const ds = r2(Math.max(T.FS*1.05, T.FS*Math.min(k, 1.2))), dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0;
    for(const h0 of (photo && hsOn(D) ? (photo === 2 ? [1] : [1, 0]) : [0])) for(const pk of [1.12, 1]) for(const inl of (nar ? (flat === 2 ? [1] : [1, 0]) : [1])) for(const hk of (h0 ? [.8, .62] : [0])){
      const ps = r2(Math.max(T.FB*pk, T.FB*1.04*k)), pw = T.tw(A.phone || '', F.phone(ps));
      const three = nar && !inl, ns0 = T.one(A.name || '', F.name, w, Math.max(T.FB*1.6*k, T.FB*(pk > 1 ? 1.4 : 1.1)), T.FB*1.1); if(!ns0) continue;
      const th0 = ns0*1.18 + ps*1.3 + (three ? ds*1.4 : 0), hsW = h0 ? Math.round(th0*hk) : 0, g = h0 ? r2(8*T.f) : 0, cw = w - hsW - g;
      const ns = T.one(A.name || '', F.name, cw, ns0, T.FB*(pk > 1 ? 1.25 : 1.1)); if(!ns || pw + (nar && inl ? ps*.7 + dW : 0) > cw || dW > cw) continue;
      const th = ns*1.18 + ps*1.3 + (three ? ds*1.4 : 0), wide = Math.max(T.tw(A.name || '', F.name(ns)), pw + (nar && inl ? ps*.7 + dW : 0), three ? dW : 0), x0 = hsW + g, py = ns*1.18 + (three ? ds*1.4 : 0);
      return {h: th, w: x0 + wide + 2, ns, lines: three ? 3 : 2, tx: x0, tw: wide, html: (x, y) => (h0 ? hs(D, x, y, hsW, th) : '') + txt('agent.name', A.name || '', x + x0, y, wide + 2, ns, 1.18, F.name, c.name)
        + (three ? txt('agent.desig', 'REALTOR®', x + x0, y + ns*1.18, dW + 2, ds, 1.4, F.tag, c.tag, {small: 1}) : '')
        + txt('agent.phone', A.phone || '', x + x0, y + py, pw + 2, ps, 1.3, F.phone, c.phone)
        + (nar && inl ? txt('agent.desig', 'REALTOR®', x + x0 + pw + ps*.7, y + py + ps*1.3*.78 - ds*1.3*.78, dW + 2, ds, 1.3, F.tag, c.tag, {small: 1}) : '')};
    }
    return null; };
  const ONDARK = {name: ON, phone: ACC, tag: SOFT}, ONPAPER = {name: PINK, phone: PMAIN, tag: PTEXT};
  // on the dark (Just Sold): 'stack' the lines with the white logo under them; 'row' the lines at the left, the logo at the right
  const agentDark = (T, D, w, k, mode, loose) => { const g = r2(9*T.f*Math.min(k, 1.3)), ph = hsOn(D) ? (loose ? 1 : 2) : 0, lh0 = r2(Math.min(T.lgMax, Math.max(T.FB*2.5, 33*T.f*Math.min(k, 1.3))));
    if(mode === 'lines'){ const L = agentLines(T, D, w, k, ONDARK, ph); return L ? {h: L.h, ww: L.w, html: (x, y) => L.html(x, y)} : null; }
    if(mode === 'row'){ const lw0 = Math.max(lh0*2.5, w*.26), L = agentLines(T, D, w - lw0 - 1.5*g, k, ONDARK, ph); if(!L) return null;
      const lh = Math.min(L.h, lh0), lw = Math.min(w - L.w - 1.5*g, lh*3.6); if(lw < lh*2.3) return null;
      return {h: L.h, ww: w, html: (x, y) => L.html(x, y) + logo(D, 'dark', x + w - lw, y + (L.h - lh)/2, lw, lh, 'r')}; }
    const L = agentLines(T, D, w, k, ONDARK, ph); if(!L) return null;
    const lh = r2(Math.max(L.ns*1.6, lh0*.9));   // the logo sits centered under the agent's lines, in a box as wide as they run
    return {h: L.h + g + lh, ww: L.w, html: (x, y) => L.html(x, y) + logo(D, 'dark', x + L.tx, y + L.h + g, L.tw, lh, '')}; };

  // ---------- the paper strip: the agent, the icon facts between thin rules, the logo ----------
  // o.agent 0 | 1 | 2 (2: the headshot always); o.cells; o.short (short labels); o.side (the icon beside its numeral, where the image is
  // short); o.rows 2: the facts across, a hairline, the agent and the logo under; o.mid: a line between the agent and the logo
  const strip = (T, D, W, k, o) => { const f = T.f, kk = Math.min(k, 1.3), tt = o.tight ? .7 : 1, pad = r2(16*f*tt), bp = r2(9*f*kk), g = r2(10*f*tt), cells = o.cells || [], two = o.rows === 2;
    const vs = r2(Math.max(T.FB*1.1, T.FB*1.25*k)), ks = r2(Math.max(T.FS*(o.tight ? 1 : 1.15), T.FS*1.1*k)), cp = r2(4*f*tt), lab = c => o.short ? c[3] : c[2];
    const is = o.side ? r2(vs*1.25) : r2(vs*1.05), ig = r2(5*f), tws = cells.map(c => Math.max(T.tw(c[1], F.val(vs)), T.tw(lab(c), F.key(ks))));
    const cws = cells.map((c, i) => (o.side ? is + ig + tws[i] : Math.max(tws[i], is)) + 2*cp), cellH = !cells.length ? 0 : o.side ? vs*1.2 + ks*1.3 : is + 2*f + vs*1.2 + ks*1.3, sum = cws.reduce((a, b) => a + b, 0);
    const ag = o.agent ? agentLines(T, D, two ? (W - 2*pad)*.62 : W*.5, k, ONPAPER, o.agent === 2 ? 2 : 0) : null; if(o.agent && !ag) return null;
    const lh = r2(Math.min(T.lgMax, Math.max(T.FB*2.5, 33*f*kk))), lw = o.logo === false ? 0 : r2(lh*(o.tight ? 2.9 : 3.3)), tone = paperDark() ? 'dark' : 'light';
    const cell = (c, i, x, y, cw) => { if(o.side){ const x0 = x + (cw - (is + ig + tws[i]))/2;
        return icon(c[0], x0, y + (cellH - is)/2, is, PMAIN) + txt('facts.' + i, c[1], x0 + is + ig, y, tws[i] + 2, vs, 1.2, F.val, PINK) + txt('facts.' + i + '.k', lab(c), x0 + is + ig, y + vs*1.2, tws[i] + 2, ks, 1.3, F.key, PTEXT, {small: 1}); }
      return icon(c[0], x + (cw - is)/2, y, is, PMAIN) + txt('facts.' + i, c[1], x, y + is + 2*f, cw, vs, 1.2, F.val, PINK, {align: 'center'})
        + txt('facts.' + i + '.k', lab(c), x, y + is + 2*f + vs*1.2, cw, ks, 1.3, F.key, PTEXT, {align: 'center', small: 1}); };
    const vr = (x, y, h) => rect(x, y, .8, h, `background:${PMAIN};opacity:.3`);
    if(two){ const lw2 = Math.min(lw, W - 2*pad - ag.w - g); if(sum > W - 2*pad || lw2 < lh*2.4) return null;
      const rowB = Math.max(ag.h, lh), gg = r2(7*f*kk), h = bp + cellH + gg + .8 + gg + rowB + bp;
      return {h, html: y => { let s = rect(0, y, W, h, `background:${PAPER}`), cw = (W - 2*pad)/cells.length, y1 = y + bp + cellH + gg;
        cells.forEach((c, i) => { s += cell(c, i, pad + i*cw, y + bp, cw) + (i ? vr(pad + i*cw, y + bp + cellH*.12, cellH*.76) : ''); });
        s += rect(pad, y1, W - 2*pad, .8, `background:${PMAIN};opacity:.4`);
        return s + ag.html(pad, y1 + .8 + gg + (rowB - ag.h)/2) + logo(D, tone, W - pad - lw2, y1 + .8 + gg + (rowB - lh)/2, lw2, lh, 'r'); }}; }
    const need = 2*pad + (ag ? ag.w + g : 0) + sum + (cells.length && lw ? g : 0) + lw; if(need > W) return null;
    // (under a row of room photos the facts start more than 30 pt down, so they never read as those photos' captions)
    const inner = Math.max(cellH, ag ? ag.h : 0, lh), t0 = o.side ? 0 : is + 2*f, bp1 = o.clear && cells.length ? Math.max(bp, 33 - (inner - cellH)/2 - t0) : bp, h = inner + 2*bp1;
    return {h, html: y => { let s = rect(0, y, W, h, `background:${PAPER}`); const cy = y + bp1 + inner/2, fx0 = pad + (ag ? ag.w + g : 0), fx1 = W - pad - (lw ? lw + g : 0), cw = cells.length ? (fx1 - fx0)/cells.length : 0;
      if(ag) s += ag.html(pad, cy - ag.h/2);
      if(o.mid && !cells.length){ const mw = fx1 - fx0 - g, ms = T.one(o.mid, F.q, mw, T.FB*1.5*k, T.FB), m2 = ms ? null : o.mid.replace(/\s+(\S+)$/, '\n$1').split('\n'), s2 = m2 && m2.length === 2 && inner >= T.FB*2.5 ? T.one(m2[0], F.q, mw, Math.min(T.FB*1.3*k, inner/2.5), T.FB) : 0;
        if(s2) s += vr(fx0, cy - inner*.38, inner*.76) + vr(fx1, cy - inner*.38, inner*.76) + m2.map((t, i) => txt('sold.q' + (i ? 2 : ''), t, fx0 + g/2, cy - s2*1.2 + i*s2*1.2, mw, s2, 1.2, F.q, PMAIN, {align: 'center'})).join('');
        if(ms) s += vr(fx0, cy - inner*.38, inner*.76) + vr(fx1, cy - inner*.38, inner*.76) + txt('sold.q', o.mid, fx0 + g/2, cy - ms*.6, mw, ms, 1.2, F.q, PMAIN, {align: 'center'}); }
      cells.forEach((c, i) => { s += cell(c, i, fx0 + i*cw, cy - cellH/2, cw) + (i || ag ? vr(fx0 + i*cw, cy - cellH*.38, cellH*.76) : ''); });
      return s + (lw ? logo(D, tone, W - pad - lw, cy - lh/2, lw, lh, 'r') : ''); }}; };
  // the facts and the logo across the foot (square, Google, X; the agent stands on the panel): the fullest set of facts the width holds
  const factStrip = (T, D, W, k, side, noClear) => { const base = cellsOf(D), ext = cellsOf(D, true);
    const four = ext.filter(c => c[0] !== 'lot');   // beds, baths, square feet and the year built come before the lot
    for(const [C, short, tight] of [[ext, 0], [ext, 1], [four, 0], [four, 1], [four, 1, 1], [base, 0], [base, 1], [base, 1, 1]]){ const s = strip(T, D, W, k, {agent: 0, cells: C, short, side, tight, clear: !noClear}); if(s){ s.icons = C.map(c => c[0]); return s; } }
    return null; };

  // ---------- Just Listed: the writer's lines ----------
  // the writer's sentences (first always kept) in two to maxN full lines: every line 80%+, the last 90%+ of the measure; justified only
  // where every line already runs nearly full (no wide word gaps)
  const writeUp = (T, D, w, s0, maxN, shown) => { const stem = t => (String(t).toLowerCase().match(/[a-z]{4,}/g) || []).map(x => x.replace(/(ing|ed|es|s)$/, '')).filter(x => !/^(with|this|that|from|have|into|over|there|house|home)$/.test(x));
    const said = (shown || []).map(stem), same = t => { const a = stem(t); return said.some(b => b.filter(x => a.includes(x)).length >= Math.min(2, b.length)); };
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing).concat(OHL.factSix(D.listing).map(x => x[1]), shown || [])).filter((t, i) => !same(t)).slice(0, 9); let best = null;
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 3) continue; const t = pk.join(' ');
      for(const m of [1, .96, .92, .88, .84]) for(const s of [s0, r2(s0*1.06), r2(s0*1.12), r2(s0*1.18), r2(s0*1.24)]){ const r = T.rows(t, F.note(s), w*m, s*1.45); if(r.n > maxN || r.n < 2) continue;
        if(r.last < .9*w*m || r.ws.slice(0, -1).some(x => x < .8*w*m)) continue;
        const sc = r.n*100 + m*20 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc}; } }
    if(best){ best.h = best.n*best.s*1.45 + best.s*.15;
      best.html = (x, y) => txt('writeup', best.t, x, y, best.w, best.s, 1.45, F.note, SOFT, {n: best.n}); }
    return best; };
  const bulletRows = (T, list, bs, rh, tight) => { const f = T.f, dash = r2(9*f), dg = r2(7*f);
    return {h: list.length*rh, ww: Math.max(0, ...list.map(t => T.tw(t, F.bul(bs)))) + dash + dg, html: (x, y, wf) => list.map((t, i) => rect(x, y + i*rh + (rh - 1)/2 - .7, dash, 1.4, `background:${ACC}`) + txt('hl.' + i, t, x + dash + dg, y + i*rh + (rh - 1 - bs*1.3)/2, wf - dash - dg, bs, 1.3, F.bul, ON)
      + rect(x, y + (i + 1)*rh - 1, wf, 1, 'background:var(--ep-rule)')).join('') + (tight ? rect(x, y - 1, wf, 1, 'background:var(--ep-rule)') : '')}; };

  // ---------- Just Listed, the panel of the square, Google and X images ----------
  // the city line as the eyebrow, the two-tone status, the rule, the pin and street, the highlights, the agent at the foot
  // o.eyebrow, o.nb (highlights), o.line (the status on one line), o.agent, o.shown (the facts the strip shows), o.tight (X)
  const panelJL = (T, D, w, k, o) => { const f = T.f, kk = Math.min(k, 1.3), G = [], two = !o.line, top = T.FE*3.3*k;
    const size = big => two ? Math.min(T.one(second(D), F.word, w, big, T.FE) || 0, T.one('Just', F.word, w, big, T.FE) || 0) : (T.one('Just ' + second(D), F.word, w, big, T.FE) || 0);
    const wOf = s1 => T.tw(two ? second(D) : 'Just ' + second(D), F.word(s1));
    // stacked, the dark beside "Just" stays under 3% of the image (the fill check's measure): the status steps down until it does
    const fitsA = b => !two || !o.A || (T.tw(second(D), F.word(b)) - T.tw('Just', F.word(b)) + 13*f)*(13*f + .95*b) <= .027*o.A;
    let big = top; while(big > T.FE && !fitsA(big)) big -= 1; const ws = size(big); if(!ws) return null;
    const wh = capH(ws) + (two ? ws : 0), rg = ws*(o.tight ? .15 : .26), rw = r2(Math.min(w, ws*.95)), rt = Math.max(1.4, r2(ws*.028)), wordW = wOf(ws), w0 = w;
    G.push({h: wh + rg + rt, ww: wordW, html: (x, y) => wordEl(D, two, x - ws*.02, y, Math.max(w0, wordW) + ws*.04, ws) + rect(x, y + wh + rg, rw, rt, `background:${ACC}`)});
    w = Math.min(w, Math.max(wordW*1.04, 60*f));   // what stands under the status runs no wider than it where the street allows
    let ad = addr(T, D, w, k, {cap: ws*.5}); if(!ad){ w = w0; ad = addr(T, D, w, k, {cap: ws*.5}) || addr(T, D, w, k, {cap: ws*.5, hang: 1}); } if(!ad) return null; G.push(ad);
    if(o.nb){ const bs = r2(Math.max(T.FB, Math.min(T.FB*1.04*k, ad.s*.66))), list = bulletsOf(D, o.shown).filter(t => T.tw(t, F.bul(bs)) <= w - 16*f - 2).slice(0, o.nb); if(list.length < o.nb) return null;
      G.push(bulletRows(T, list, bs, bs*(o.tight ? 1.4 : 1.95), o.tight)); }
    if(o.agent){ const La = agentLines(T, D, w, k, ONDARK, hsOn(D) ? 2 : 0, o.tight ? 1 : 0), Lb = o.tight || !La ? agentLines(T, D, w0, k, ONDARK, hsOn(D) ? 2 : 0, o.tight ? 1 : 0) : null, L = La && Lb ? (Lb.h < La.h - 1 ? Lb : La) : (La || Lb); if(!L) return null; G.push({h: L.h, ww: L.w, html: (x, y) => L.html(x, y)}); }
    const gg = r2(10*f*kk*(o.tight ? .6 : 1)), g0 = o.tight ? r2(5*f) : r2(7*f*kk), h = G.reduce((a, x) => a + x.h, 0) + gg*(G.length - 2) + g0;
    const wwAll = Math.max(...G.map(x => x.ww || 0));   // px: the panel's right margin, drawn in where a line runs wider than the status
    // spare height opens between the groups, least under the status (its rule stays close to the street)
    return {h, ws, wordW, ww: wwAll, px: p0 => Math.max(6*f, p0 - Math.max(0, wwAll - wordW)), html: (x, y, avail, wf) => { const n = G.length, slot = Math.max(0, avail - h)/(n - (o.tight ? 1 : .85)); let yy = y + slot/2, s1 = ''; G.forEach((x0, i) => { s1 += x0.html(x, yy, wf || w); yy += x0.h + (i ? gg + slot : g0 + slot*(o.tight ? 0 : .15)); }); return s1; }}; };

  // ---------- Just Listed, the dark block of the post, pin and story ----------
  // two columns under the house: the city line, "Just" over "Listed" and the rule at the left; beside them the pin and street, the
  // highlights and the writer's lines, as tall as the status
  const blockJL = (T, D, W, k, o) => { const f = T.f, kk = Math.min(k, 1.3), pad = r2(16*f), gcol = r2(15*f), cap = T.FE*3.4*k;
    let ws = Math.min(T.one(second(D), F.word, W*.44, cap, T.FE) || 0, T.one('Just', F.word, W*.44, cap, T.FE) || 0); if(!ws) return null;
    // the square (o.A): the dark beside "Just", under "Listed"'s reach, stays a small notch (this estimate runs about a sixth over the
    // fill check's own measure): the status steps down until it does
    if(o.A) while(ws > T.FE && (T.tw(second(D), F.word(ws)) - T.tw('Just', F.word(ws)) + gcol)*(13*f + .95*ws) > .033*o.A) ws -= 1;
    const lw = T.tw(second(D), F.word(ws)), wc = W - 2*pad - lw - gcol; if(wc < 105*f) return null;
    const rg = ws*.26, rt = Math.max(1.4, r2(ws*.028)), hL = capH(ws) + ws + rg + rt;
    const left = (x, yL) => wordEl(D, true, x - ws*.02, yL, lw + ws*.04, ws) + rect(x, yL + capH(ws) + ws + rg, r2(ws*.95), rt, `background:${ACC}`);
    const ad = addr(T, D, wc, Math.max(k, .95), {cap: ws*.5}) || addr(T, D, wc, k, {cap: ws*.5, hang: 1}); if(!ad) return null;
    if(o.agent){ const Lg = agentLines(T, D, wc, k, ONDARK, hsOn(D) ? 2 : 0), g1 = r2(9*f*kk); if(!Lg) return null;   // the square: the street, the highlights the height holds, the agent
      const bs1 = r2(Math.max(T.FB, Math.min(T.FB*1.04*k, ad.s*.7))), rh1 = bs1*1.85, all1 = bulletsOf(D, o.shown).filter(t => T.tw(t, F.bul(bs1)) <= wc - 16*f - 2);
      const nb1 = Math.max(0, Math.min(all1.length, 2, Math.floor((hL + 8*f - ad.h - g1 - Lg.h - g1)/rh1))), rows1 = nb1 ? bulletRows(T, all1.slice(0, nb1), bs1, rh1) : null;
      const hR1 = ad.h + (rows1 ? g1 + rows1.h : 0) + g1 + Lg.h, h1 = Math.max(hL, hR1);
      return {h: h1, ws, street: ad.s, lines: 0, html: (x, y, avail) => { const yL = y + (avail - hL)/2, xr = x + lw + gcol, y0 = y + (avail - h1)/2, mid = h1 - ad.h - Lg.h;
        return left(x, yL) + ad.html(xr, y0)
          + (rows1 ? rows1.html(xr, y0 + ad.h + (mid - rows1.h)/2, wc) : '') + Lg.html(xr, y0 + h1 - Lg.h); }}; }
    const bs = r2(Math.max(T.FB, Math.min(T.FB*1.04*k, ad.s*.7))), rh = bs*1.85, all = bulletsOf(D, o.shown).filter(t => T.tw(t, F.bul(bs)) <= wc - 16*f - 2);
    const s0 = r2(Math.max(T.FB, Math.min(T.FB*1.02*k, ad.s*.68))), g = r2(9*f*kk);
    let best = null;
    for(const nb of [3, 2, 1, 0]){ if(all.length < nb) continue; const list = all.slice(0, nb), room = hL + 12*f - ad.h - (nb ? g + nb*rh : 0) - g, maxN = Math.min(6, Math.floor((room - s0*.15)/(s0*1.45)));
      const wu = maxN >= 2 ? writeUp(T, D, wc, s0, maxN, list) : null, hR = ad.h + (nb ? g + nb*rh : 0) + (wu ? g + wu.h : 0), sc = -Math.abs(hL - hR) + (wu ? 120 + wu.n*4 : 0) + nb*6;
      if(!best || sc > best.sc) best = {list, wu, hR, sc}; }
    const {list, wu, hR} = best, h = Math.max(hL, hR), rows = list.length ? bulletRows(T, list, bs, rh) : null;
    return {h, ws, street: ad.s, lines: wu ? wu.n : 0, gapA: (h - hR)*wc, html: (x, y, avail) => { const yL = y + (avail - hL)/2, xr = x + lw + gcol; let yR = y + (avail - hR)/2, s = '';
      s += left(x, yL);
      s += ad.html(xr, yR); yR += ad.h; if(rows){ s += rows.html(xr, yR + g, wc); yR += g + rows.h; } if(wu) s += wu.html(xr, yR + g);
      return s; }}; };

  // ---------- Just Sold ----------
  // the head: "Just Sold" as one oversized line, the pin, the street and the place right under it
  // o.side: where the width cannot be filled that way, the status at the left and the pin, street and place beside it at the right
  const soldHead = (T, D, W, k, o) => { o = o || {}; const f = T.f, kk = Math.min(k, 1.3), pad = r2(16*f), w = W - 2*pad, big = T.FE*4.8*Math.max(k, o.wk || 0);
    const top = o.top != null ? o.top : r2(15*f*kk), bot = r2(12*f*kk);
    if(o.logo){ let ws = 0, lh = 0, lw = 0; for(let s1 = Math.ceil(big); s1 >= T.FE*1.15 && !ws; s1 -= 1){ lh = r2(Math.max(Math.min(T.lgMax, T.FB*2.3), capH(s1)*.96)); lw = r2(lh*3.3); if(T.tw('Just Sold', F.word(s1)) + r2(16*f) + lw <= w) ws = s1; } if(!ws) return null;
      const ad = addr(T, D, w, k, {inline: 1, cap: ws*.5}); if(!ad) return null;
      const inner = Math.max(capH(ws), lh), g = ws*.3, h = top + inner + g + ad.h + bot;   // the white logo at the end of the status line
      return {h, ws, hasLogo: true, cov: Math.min(1, ad.ww*1.25/w), html: y => wordEl(D, false, pad - ws*.02, y + top + (inner - capH(ws))/2, T.tw('Just Sold', F.word(ws)) + ws*.06, ws) + logo(D, 'dark', W - pad - lw, y + top + (inner - lh)/2, lw, lh, 'r') + ad.html(pad, y + top + inner + g)}; }
    if(!o.side){ const ws = T.one('Just Sold', F.word, w, big, T.FE*1.15); if(!ws) return null;
      const ad = addr(T, D, w, k, {inline: 1, cap: ws*.5}); if(!ad) return null;
      const g = ws*.34, h = top + capH(ws) + g + ad.h + bot;
      return {h, ws, cov: Math.min(T.tw('Just Sold', F.word(ws)), ad.ww*1.25)/w, html: y => wordEl(D, false, pad - ws*.02, y + top, w + ws*.04, ws) + ad.html(pad, y + top + capH(ws) + g)}; }
    const gap = r2(16*f);
    for(let ws = Math.ceil(big); ws >= T.FE*1.15; ws -= 1){ const ww = T.tw('Just Sold', F.word(ws)); if(ww + gap + w*.3 > w) continue;
      const ad = addr(T, D, w - ww - gap, k, {cap: ws*.5}); if(!ad || ad.h > capH(ws)*2.3 + 6*f) continue;
      const inner = Math.max(capH(ws), ad.h), h = top + inner + bot;
      return {h, ws, inkB: top + (inner + capH(ws))/2, cov: (ww + ad.ww)/w, html: y => wordEl(D, false, pad - ws*.02, y + top + (inner - capH(ws))/2, ww + ws*.06, ws) + ad.html(W - pad - ad.ww, y + top + (inner - ad.h)/2)}; }
    return null; };
  // the fullest seller note that sets in maxN lines or fewer: every line 80%+ and the last 90%+ of the measure, about four words or
  // more to a line (never a narrow column of short ragged lines); the measure may narrow a little, the box then hugs the text
  const pickNote = (T, D, iw, ns0, maxN) => { const list = notes(D);
    for(let n = Math.min(maxN, 6); n >= 1; n--) for(const t of list){ if(n > 1 && t.length/n < 20) continue;
      for(const m of [1, .96, .92, .88, .84]) for(let s = ns0*(n === 1 ? 1.5 : 1.22); s >= ns0 - .01; s -= .5){
        const w = iw*m, r = T.rows(t, F.note(s), w, s*1.42); if(r.n !== n) continue;
        if(n === 1 ? r.wide < .86*iw : (r.last < .9*w || r.ws.slice(0, -1).some(x => x < .8*w))) continue;
        return {t, n, s, w: n === 1 ? r.wide + 1 : w}; } }
    return null; };
  // the question in the accent over the note in the accent outlined box
  // qFill: the question grows (to the status's own cap) toward the box's width, where at its size it would leave a wide empty room beside it
  const sell = (T, D, w, k, maxN, noRule, noQ, qFill) => { const f = T.f, kk = Math.min(k, 1.3), qmax = Math.min(T.FE*1.3*k, T.FE*1.9), qmin = T.FB*1.05;
    const quest = wq => { let ql = [Q], qs = T.one(Q, F.q, wq, qmax, qmin); if(qs && qFill) qs = Math.max(qs, T.one(Q, F.q, wq*.9, T.FE*1.9, qmin) || 0); if(!qs){ ql = ['Thinking about', 'selling?']; qs = T.one(ql[0], F.q, wq, qmax, qmin); } return qs ? {ql, qs} : null; };
    if(maxN === 0){ const q0 = quest(w); if(!q0) return null; const qh0 = q0.ql.length*q0.qs*1.2, qw0 = Math.max(...q0.ql.map(t => T.tw(t, F.q(q0.qs)))), rt = Math.max(1.4, r2(q0.qs*.06));
      const qhtml0 = (x, y) => q0.ql.map((t, i) => txt('sold.q' + (i ? 2 : ''), t, x, y + i*q0.qs*1.2, w, q0.qs, 1.2, F.q, ACC)).join('');
      return noRule ? {h: qh0, ww: qw0, n: 0, len: 0, html: qhtml0} : {h: qh0 + q0.qs*.35 + rt, ww: qw0, n: 0, len: 0, html: (x, y) => qhtml0(x, y) + rect(x, y + qh0 + q0.qs*.35, r2(q0.qs*2), rt, `background:${ACC}`)}; }
    const nb = r2(10*f*kk), ns0 = r2(Math.max(T.FB, Math.min(T.FB*1.03*k, T.FE*1.05))), pk = pickNote(T, D, w - 2*nb, ns0, maxN); if(!pk) return null;
    const lh = pk.s*1.42, mh = pk.n*lh + pk.s*.15 + 2*nb, bw = Math.min(w, pk.w + 2*nb + 2), q1 = noQ ? null : quest(bw); if(!noQ && !q1) return null;
    const qh = q1 ? q1.ql.length*q1.qs*1.2 : 0, qg = q1 ? r2(6*f*kk) : 0, h = qh + qg + mh;
    return {h, ww: bw, n: pk.n, len: pk.t.length, qw: q1 ? Math.max(...q1.ql.map(t => T.tw(t, F.q(q1.qs)))) : bw, qh, qn: q1 ? q1.ql.length : 0, html: (x, y) => (q1 ? q1.ql.map((t, i) => txt('sold.q' + (i ? 2 : ''), t, x, y + i*q1.qs*1.2, bw, q1.qs, 1.2, F.q, ACC)).join('') : '')
      + rect(x, y + qh + qg, bw, mh, `border:${Math.max(.9, r2(.9*f))}pt solid ${ACC};box-sizing:border-box`)
      + txt('sold.note', pk.t, x + nb, y + qh + qg + nb, pk.w, pk.s, 1.42, F.note, ON, {n: pk.n})}; };

  // the largest k in [lo, hi] a layout holds (the layouts only grow with k), or null
  const fitK = (ok, lo, hi) => { if(!ok(lo)) return null; if(ok(hi)) return hi; let a = lo, b = hi; for(let i = 0; i < 7; i++){ const m = (a + b)/2; if(ok(m)) a = m; else b = m; } return a; };
  // Just Sold as a panel beside the house (the wide images): the status, the pin and street, the question and note, the agent
  const panelJS = (T, D, w, k, o) => { const f = T.f, kk = Math.min(k, 1.3), lh = o.logo ? r2(Math.min(T.lgMax, Math.max(T.FB*2.3, 30*f*kk))) : 0, lw = r2(lh*3.3);
    const ws = T.one('Just Sold', F.word, w - (lh ? lw + 14*f : 0), T.FE*4.8*k, T.FE*1.15); if(!ws) return null;
    const ad = addr(T, D, w, k, {inline: 1, cap: ws*.5}), sl = ad && sell(T, D, w, k, o.nl, true, o.noQ), ag = sl && agentDark(T, D, w, k, o.logo ? 'lines' : o.mode, o.loose); if(!ag) return null;
    const inner = Math.max(capH(ws), lh), g0 = ws*.32, G = [{h: inner + g0 + ad.h, html: (x, y) => wordEl(D, false, x - ws*.02, y + (inner - capH(ws))/2, T.tw('Just Sold', F.word(ws)) + ws*.06, ws) + (lh ? logo(D, 'dark', x + w - lw, y + (inner - lh)/2, lw, lh, 'r') : '') + ad.html(x, y + inner + g0)}, sl, ag];
    const gg = r2(Math.min(12*f*kk, (o.H || 9999)*.07)), h = G.reduce((a, x) => a + x.h, 0) + gg*2;
    return {h, len: sl.len, cov: Math.min(lh ? w : T.tw('Just Sold', F.word(ws)), ad.ww*1.25)/w - (ad.n > 1 ? .25 : 0), html: (x, y, avail) => { let yy = y + Math.max(0, avail - h)/2, s = ''; G.forEach(x0 => { s += x0.html(x, yy); yy += x0.h + gg; }); return s; }}; };

  const EP = {};
  // ================= post, pin, story =================
  // Just Listed (the flyer front's order): the house edge to edge across the head; under it the dark block (the city line, the two-tone
  // status and the rule; beside them the pin and street, the highlights and the writer's lines); the paper band across the foot in
  // two rows (the icon facts, then the agent and the logo).
  // Just Sold: the oversized status and the street across the head, the house edge to edge, then the question, the note box and the agent.
  // A story opens on the house (no words in the top 250 px) and closes on room photos (none in the bottom 250 px).
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f} = T, X = heroKit(D, f), sold = D.piece.moment === 'js', story = shape === 'story', sq = shape === 'square';
    const pad = r2(16*f), gut = r2(2.5*f), vp = r2((sq ? 9 : 13)*f), AV = story ? H - 96 : H, KMIN = sq ? .5 : .6, KMAX = sq ? 1.3 : shape === 'post' ? 1.5 : 1.7;
    const need0 = story ? X.nat(W) : X.min(W) + .7*(X.nat(W) - X.min(W));
    let h = CSS;
    if(!sold){
      const base = cellsOf(D), ext = cellsOf(D, true), a = hsOn(D) ? 2 : 1; let st = null, shown = [];
      for(const [C, k, short] of [[ext, .85, 0], [ext, .85, 1], [ext, .7, 1], [ext.filter(c => c[0] !== 'cal'), .8, 1], [base, .85, 0], [base, .8, 1], [base, .6, 1]]){ st = strip(T, D, W, k, {agent: a, cells: C, rows: 2, short}); if(st){ shown = C.map(c => c[0]); break; } }
      st = st || strip(T, D, W, .6, {agent: 1, cells: base, short: 1, rows: 2}) || strip(T, D, W, .6, {agent: 1, cells: []});
      if(sq){ const s1 = factStrip(T, D, W, .6, 0, 1) || factStrip(T, D, W, .5, 0, 1); if(s1){ st = s1; shown = s1.icons; } }   // the square: the facts and the logo in one row, the agent in the block
      const build = k => { const B = blockJL(T, D, W, k, {shown, agent: sq, A: sq ? W*H : 0}); return B ? {B, room: AV - gut - (B.h + 2*vp) - st.h} : null; };
      // the words as large as the house allows: the house keeps most of its own shape first, then gives up ground, then narrows
      let pick = null;
      for(const nd of (story ? [X.nat(W), X.min(W)] : sq ? [X.min(W), X.min(W)*.72] : [X.min(W) + .35*(X.nat(W) - X.min(W)), X.min(W), X.min(W)*.74])){ const k = fitK(t => { const b = build(t); return !!b && b.room >= nd; }, KMIN, KMAX); if(k == null) continue; if(sq){ pick = {k}; break; } if(!pick) pick = {k}; if(k >= .9){ pick = {k}; break; } if(k > pick.k + .15) pick = {k}; }
      let B = build(pick ? pick.k : KMIN) || build(KMIN);
      // the post, pin and story: where the street and the highlights leave the column beside the status well short of it (no writer's
      // lines to fill it), the agent comes up into that column and the strip carries the facts and the logo (the square's arrangement)
      if(!sq && B && B.B.gapA > .025*W*H){ const s1 = factStrip(T, D, W, .6, 0, 1) || factStrip(T, D, W, .5, 0, 1);
        const b2 = s1 && (k => { const B2 = blockJL(T, D, W, k, {shown: s1.icons, agent: 1}); return B2 ? {B: B2, room: AV - gut - (B2.h + 2*vp) - s1.h} : null; });
        let k2 = null; if(b2) for(const nd of (story ? [X.nat(W), X.min(W)] : [X.min(W) + .35*(X.nat(W) - X.min(W)), X.min(W), X.min(W)*.74])){ k2 = fitK(t => { const b = b2(t); return !!b && b.room >= nd; }, KMIN, KMAX); if(k2 != null) break; }
        if(k2 != null){ st = s1; B = b2(k2); B.up = 1; } }
      if(B){ let ph = Math.max(40, Math.min(X.max(W), B.room)), extra = Math.max(0, B.room - ph), rowH = (!story || B.up) && extra >= 56*f ? extra - gut : 0; if(rowH) extra = 0;
        const y1 = ph + gut + (rowH ? rowH + gut : 0), MH = AV - y1 - st.h;
        h += X.across(0, 0, W, ph, gut) + (rowH ? X.rooms(0, ph + gut, W, rowH, gut) : '') + rect(0, y1, W, MH, `background:${DARK}`) + B.B.html(pad, y1 + vp, MH - 2*vp) + st.html(y1 + MH);
        if(story) h += X.rooms(0, y1 + MH + st.h + gut, W, H - (y1 + MH + st.h + gut), gut); }
      else h += X.across(0, 0, W, AV - st.h - gut, gut) + st.html(AV - st.h);
    } else {
      const build = (k, nl, loose, noQ, qFill) => { const hd = soldHead(T, D, W, k, story ? {top: r2(13*f*Math.min(k, 1.3)), wk: 1} : sq ? {wk: .7, top: r2(10*f), side: 1} : {wk: 1}) || (sq ? soldHead(T, D, W, k, {wk: .7, top: r2(10*f)}) : null), sl = sell(T, D, W - 2*pad, k, nl, false, noQ, qFill), ag = agentDark(T, D, W - 2*pad, k, 'row', loose); if(!hd || !sl || !ag) return null;
        const g = r2(12*f*Math.min(k, 1.3)), low = vp + sl.h + g + ag.h + vp; return {hd, sl, ag, g, low, room: AV - hd.h - low}; };
      let pick = null;
      for(const lim of (sq ? [1, .72] : [1])){ for(const loose of [0, 1]){ for(const noQ of (sq ? [0, 1] : [0])){ for(const nl of [3, 2, 1]){ const b1 = build(KMIN, nl, loose, noQ); if(!b1 || b1.room < X.min(W)*lim) continue;
          const need = Math.min(b1.room, sq ? X.min(W)*lim : need0), k = fitK(t => { const b = build(t, nl, loose, noQ); return !!b && b.room >= need; }, KMIN, KMAX) || KMIN;
          pick = {nl, k, loose, noQ}; break; } if(pick) break; } if(pick) break; } if(pick) break; }
      if(sq && !pick){ T.done(); return null; }
      pick = pick || {nl: 1, k: KMIN, loose: 1};
      let B = build(pick.k, pick.nl, pick.loose, pick.noQ) || build(KMIN, 1, 1);
      // the square: a one-line question much narrower than the box beside a wide empty room (8% tall or more) grows toward the box's width
      if(sq && B.sl.qn === 1 && B.sl.qh + vp >= .075*H && (W - 2*pad - B.sl.qw)*(B.sl.qh + vp) > .025*W*H){ const B1 = build(pick.k, pick.nl, pick.loose, pick.noQ, 1); if(B1 && B1.room >= B.room - 30*f) B = B1; }
      const ph = Math.max(sq ? 40 : X.min(W), Math.min(X.max(W), B.room));
      let spare = Math.max(0, B.room - ph), y = 0;
      if(story){ h += X.hero(0, 0, W, ph); y = ph; h += B.hd.html(y); y += B.hd.h; spare = 0; }
      else { h += B.hd.html(0); y = B.hd.h; h += X.across(0, y, W, ph, gut); y += ph;
        if(spare >= 56*f){ h += X.rooms(0, y + gut, W, spare - gut, gut); y += spare; spare = 0; } }
      y += vp + spare*.3; h += B.sl.html(pad, y); y += B.sl.h + B.g + spare*.4; h += B.ag.html(pad, y); y += B.ag.h + vp + spare*.3;
      if(story) h += X.rooms(0, y, W, H - y, gut);
    }
    T.done();
    return h;
  };

  // ================= square, wide (X), Google Business Profile: the postcard fronts =================
  // Just Listed: the dark panel at the left (the city line, "Just" over "Listed", the rule, the pin and street, the highlights, the
  // agent), the house edge to edge beside it in its own shape with room photos under it, the paper strip across the foot (the icon
  // facts and the logo).
  // Just Sold: the oversized status and the street across the head; down the left the question, the note box and the agent with the
  // white logo; the house fills the rest to the edges.
  const card = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f} = T, X = heroKit(D, f), sold = D.piece.moment === 'js';
    const pad = r2(16*f), gut = r2(Math.min(2.5*f, 4)), vp = r2(Math.min(13*f, H*(shape === 'wide' ? .034 : .045))), px = r2(Math.min(13*f, W*.03));
    let h = CSS, pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
    if(!sold){
      const strips = [];
      for(const side of [0, 1]) for(const k of [1.1, .9, .75, .6]){ const s = factStrip(T, D, W, k, side); if(s && s.h <= H*.33 && !strips.some(x => Math.abs(x.h - s.h) < 3)){ s.k = k; s.side = side; strips.push(s); } }
      if(!strips.length){ const s = strip(T, D, W, .6, {agent: 0, cells: cellsOf(D).slice(0, 3), short: 1, side: 1}) || strip(T, D, W, .6, {agent: 0, cells: []}); s.k = .6; s.icons = []; strips.push(s); }
      const opts = shape === 'wide' ? [{line: 1}, {}] : [{nb: 2, line: 1}, {nb: 1, line: 1}, {line: 1}, {nb: 2}, {nb: 1}, {}];
      // the house column takes 45% of the width or more; on the X image, where no panel with the agent leaves the house that much,
      // the house column narrows to 38% (the agent is never left off: owner 11/24/2026)
      const lay = (minF, sts, vq) => sts.forEach(st => { const RH = H - st.h;
        for(let fr = .34; fr <= .66; fr += .02){ const w = Math.round(W*fr) - pad - px;
          // every arrangement of the panel that fits this width, each at its largest; the panel as wide as its words
          opts.forEach((o0, oi) => { const o = Object.assign({A: W*H, H, tight: shape === 'wide', agent: 1, shown: st.icons}, o0), k = fitK(t => { const P = panelJL(T, D, w, t, o); return !!P && P.h + 2*vq <= RH; }, shape === 'wide' ? .42 : .6, 2); if(k == null) return;
            let got = {P: panelJL(T, D, w, k, o), o, oi, k}, PW = Math.ceil(pad + got.P.ww + got.P.px(px)), pw = W - PW, pl = pw >= W*minF ? X.plan(pw, RH, gut) : null, RHf = RH;
            if(!pl && pw >= W*minF && RH > X.max(pw) && RH - X.max(pw) < 46*f){ const R2 = X.max(pw), k2 = fitK(t => { const P = panelJL(T, D, w, t, o); return !!P && P.h + 2*vq <= R2; }, shape === 'wide' ? .42 : .6, 2);
              if(k2 != null){ const g2 = {P: panelJL(T, D, w, k2, o), o, oi, k: k2}, PW2 = Math.ceil(pad + g2.P.ww + g2.P.px(px)), p2 = W - PW2 >= W*minF ? X.plan(W - PW2, R2, gut) : null; if(p2){ got = g2; PW = PW2; pw = W - PW2; pl = p2; RHf = R2; } } }
            if(!pl) return;
            const spare = RHf - got.P.h - 2*vq;
            take({st, PW, RH: RHf, got, vq, sc: pw*pl.hh/(W*H)*1800 + got.k*60 + st.k*40 - (st.side ? 150 : 0) + st.icons.length*40 + (got.o.nb || 0)*28 + - Math.max(0, got.P.ww*.92 - got.P.wordW)*8 - spare*8}); }); } });
      lay(.45, strips, vp);
      if(!pick && shape === 'wide'){   // there the panel's margins run a little tighter, and then the facts' labels a step smaller
        const ext = cellsOf(D, true), tightS = [];
        for(const k of [.9, .75, .6]) for(const C of [ext, ext.filter(c => c[0] !== 'lot')]){ const s = strip(T, D, W, k, {agent: 0, cells: C, tight: 1, short: 1, clear: 1}); if(s && s.h <= H*.33 && !tightS.some(x => Math.abs(x.h - s.h) < 3)){ s.k = k; s.side = 0; s.icons = C.map(c => c[0]); tightS.push(s); break; } }
        lay(.38, strips, r2(vp*.82)); if(!pick) lay(.38, tightS, r2(vp*.82)); }
      if(!pick){ const st = strips.slice().sort((a, b) => a.h - b.h)[0], PW = Math.round(W*.55), RH = H - st.h; let P = null; for(const o of [{agent: 1, line: 1, tight: 1}, {line: 1, tight: 1}]){ if(P) break; const k = fitK(t => { const q = panelJL(T, D, PW - pad - px, t, o); return !!q && q.h + 2*vp <= RH; }, .42, 2); if(k != null) P = panelJL(T, D, PW - pad - px, k, o); }
        if(!P) P = panelJL(T, D, PW - pad - px, .42, {line: 1, tight: 1}); pick = {st, PW, RH, got: {P}}; }   // the fallback panel at the largest size its room holds
      const {st, PW, RH, got} = pick, vq = pick.vq || vp;
      const ex = H - st.h - RH;   // (the strip's paper runs up to the photo; its facts sit centered in it)
      h += rect(0, 0, PW, RH, `background:${DARK}`) + (got.P ? got.P.html(pad, vq, RH - 2*vq, PW - pad - got.P.px(px)) : '') + X.col(PW, 0, W - PW, RH, gut, true) + (ex > .5 ? rect(0, RH, W, ex + 2, `background:${PAPER}`) : '') + st.html(RH + ex/2) + (ex > .5 ? rect(0, H - ex/2 - 1, W, ex/2 + 1, `background:${PAPER}`) : '');
    } else {
      const modes = w => (w >= 120*f ? ['row', 'stack'] : ['stack', 'row']), noteSc = len => Math.min(len, 110)*2.4 - (len < 36 ? 200 : 0);
      const heads = []; for(const kh of [1.7, 1.4, 1.2, 1, .85, .7, .6, .5, .42, .35]) for(const v of [{}, {side: 1}]){ const hd = soldHead(T, D, W, kh, v); if(hd && hd.h <= H*.46 && !heads.some(x => !x.hasLogo === !hd.hasLogo && Math.abs(x.h - hd.h) < 3 && x.cov >= hd.cov)){ hd.kh = kh; heads.push(hd); } }
      for(const hd of heads){ const RH = H - hd.h, kh = hd.kh;
        for(let fr = .34; fr <= .551; fr += .02){ const CW = Math.round(W*fr), w = CW - pad - px, pw = W - CW, lhU = r2(Math.min(T.lgMax, Math.max(T.FB*2.3, 30*f))), plU = hd.hasLogo ? null : X.planLogo(pw, RH, lhU), pl = X.plan(pw, RH, gut) || plU; if(!pl) continue;
          let got = null;
          // a real note always: the question gives way before the note does
          [0, 1].some(loose => [0, 1].some(noQ => [3, 2, 1].some(nl => (hd.hasLogo ? ['lines'] : (X.plan(pw, RH, gut) ? modes(w) : []).concat(plU ? ['under'] : [])).some(mode => { const mk = k => { const sl = sell(T, D, w, k, nl, false, noQ), ag = sl && agentDark(T, D, w, k, mode === 'under' ? 'lines' : mode, loose); if(!ag) return null;
              const g = r2(12*f*Math.min(k, 1.3)); return sl.h + g + ag.h + vp*1.6 > RH ? null : {sl, ag, k, g, loose, noQ, under: mode === 'under' ? lhU : 0}; };
            const k = fitK(t => !!mk(t), .6, 2); if(k == null) return false; got = mk(k); return true; }))));
          if(!got) continue; const spare = RH - vp*1.6 - got.sl.h - got.g - got.ag.h;
          // the column as wide as what stands in it; the house takes the rest
          const CWe = Math.min(CW, Math.ceil(pad + Math.max(got.sl.ww, got.ag.ww) + px)), ple = CWe < CW ? (got.under ? X.planLogo(W - CWe, RH, got.under) : X.plan(W - CWe, RH, gut)) : null, CWf = ple ? CWe : CW, plf = ple || (got.under ? plU : pl);
          take({hd, kh, CW: CWf, RH, got, spare, sc: -(ple ? 0 : Math.max(0, CW - CWe - 6*f)*25) + (W - CWf)*plf.hh/(W*H)*1800 + got.k*60 + kh*45 + noteSc(got.sl.len) - (got.loose ? 300 : 0) - (got.noQ ? 220 : 0) - Math.max(0, .9 - hd.cov)*2500 - spare*8}); } }
      // the panel beside the house, the full height (the Just Listed front's composition)
      for(let fr = .4; fr <= .551; fr += .02){ const PW = Math.round(W*fr), w = PW - pad - px, pw = W - PW, pl = X.plan(pw, H, gut); if(!pl) continue;
        let got = null;
        [0, 1].some(loose => [0, 1].some(noQ => [3, 2, 1].some(nl => modes(w).some(mode => { const o = {nl, mode, H, loose, noQ}, k = fitK(t => { const P = panelJS(T, D, w, t, o); return !!P && P.h + 2*vp <= H; }, .6, 2); if(k == null) return false; got = {P: panelJS(T, D, w, k, o), k, loose, noQ}; return true; }))));
        if(!got) continue; const spare = H - 2*vp - got.P.h;
        take({v: 'panel', PW, got, sc: pw*pl.hh/(W*H)*1800 + got.k*105 + noteSc(got.P.len) - (got.loose ? 300 : 0) - (got.noQ ? 220 : 0) - Math.max(0, .9 - got.P.cov)*900 - spare*4}); }
      if(!pick){ const hd = soldHead(T, D, W, .4, {side: 1}) || soldHead(T, D, W, .4) || {h: 0, html: () => ''}, CW = Math.round(W*.55), RH = H - hd.h, w = CW - pad - px; let got = null;
        for(const noQ of [0, 1]) for(const nl of [2, 1]) for(const mode of (hd.hasLogo ? ['lines'] : ['row', 'stack'])){ const sl = !got && sell(T, D, w, .6, nl, false, noQ), ag = sl && agentDark(T, D, w, .6, mode, true); if(ag && sl.h + r2(8*f) + ag.h + vp <= RH) got = {sl, ag, g: r2(8*f)}; }
        pick = {hd, CW, RH, got, spare: got ? Math.max(0, RH - vp*1.6 - got.sl.h - got.g - got.ag.h) : 0}; }
      if(pick.v === 'panel') h += pick.got.P.html(pad, vp, H - 2*vp) + X.col(pick.PW, 0, W - pick.PW, H, gut, true);
      else { const {hd, CW, RH, got, spare} = pick, y0 = hd.h;
        h += hd.html(0) + (got && got.under ? X.colLogo(D, CW, y0, W - CW, RH, got.under) : X.col(CW, y0, W - CW, RH, gut, true));
        // the agent's block runs under the note box; where it is much narrower than the box (no headshot) it sits centered under it,
        // so no tall empty strip stands beside it
        const cw = CW - pad - px, ax = got && (cw - got.ag.ww)*got.ag.h > .025*W*H ? pad + (cw - got.ag.ww)/2 : pad;
        // where a smaller status leaves a deep dark band between it and the question, the question and note move up toward it (the
        // room goes between the note and the agent)
        const slY = y0 + vp*.4 + spare*.12, up = hd.inkB != null ? Math.max(0, Math.min(slY - hd.inkB - 30*f/1.2875, vp*.4 + spare*.12 + 6*f)) * (slY - hd.inkB > 33.5*f/1.2875 ? 1 : 0) : 0;
        if(got) h += got.sl.html(pad, slY - up) + got.ag.html(ax, H - vp*1.2 - got.ag.h - spare*.2); }
    }
    T.done();
    return h;
  };
  EP.portrait = (D, L, W, H, shape) => tall(D, L, W, H, shape) || card(D, L, W, H, shape);
  EP.landscape = card;

  // ================= carousel photo slides: the room edge to edge over the dark panel and the paper strip =================
  // the panel: the two-tone status on one line over the short rule, the pin, the street and the place beside it. The paper strip:
  // the icon facts and the logo (Just Listed), or the agent and the logo (Just Sold: never the house's facts).
  EP.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), {f} = T, X = heroKit(D, f), sold = D.piece.moment === 'js', pad = r2(16*f), vp = r2(12*f), gut = r2(2.5*f), w = W - 2*pad;
    const C = sold ? [] : cellsOf(D), a = hsOn(D) ? 2 : 1;
    const st = sold ? (strip(T, D, W, 1, {agent: a, cells: [], mid: Q}) || strip(T, D, W, .8, {agent: a, cells: [], mid: Q}) || strip(T, D, W, .7, {agent: 1, cells: [], mid: Q}))
      : (strip(T, D, W, 1, {agent: 0, cells: C}) || strip(T, D, W, 1, {agent: 0, cells: C, short: 1}) || strip(T, D, W, .8, {agent: 0, cells: C, short: 1}) || strip(T, D, W, .6, {agent: 0, cells: C.slice(0, 3), short: 1}));
    let ad = null, ws = 0, side = false;
    for(const k of [1.15, 1, .85, .7, .6]){ const a1 = addr(T, D, w*.5, k), s = a1 && T.one('Just ' + second(D), F.word, w - a1.ww - r2(18*f), T.FE*2.3*k, T.FE*1.25); if(s){ ad = a1; ws = s; side = true; break; } }
    if(!ad){ ad = addr(T, D, w, .7, {inline: 1}) || addr(T, D, w, .6); ws = T.one('Just ' + second(D), F.word, w, T.FE*2, T.FE); }
    const rg = ws*.3, rt = Math.max(1.4, r2(ws*.028)), wh = capH(ws) + rg + rt, inner = side ? Math.max(wh, ad.h) : wh + r2(10*f) + ad.h, ph = inner + 2*vp, sh = st ? st.h : 0, py = H - sh - ph;
    let h = CSS + X.photo(D.piece.photo, 0, 0, W, py - gut) + rect(0, py, W, ph, `background:${DARK}`);
    const wy = py + vp + (side ? (inner - wh)/2 : 0);
    h += wordEl(D, false, pad - ws*.02, wy, T.tw('Just ' + second(D), F.word(ws)) + ws*.06, ws) + rect(pad, wy + capH(ws) + rg, r2(ws*.95), rt, `background:${ACC}`);
    h += side ? ad.html(W - pad - ad.ww, py + vp + (inner - ad.h)/2) : ad.html(pad, wy + wh + r2(10*f));
    if(st) h += st.html(H - sh);
    T.done();
    return h;
  };
  window.EPSocial = EP;
})();
