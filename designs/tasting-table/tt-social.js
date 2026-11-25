/* templates/tasting-table/tt-social.js: Tasting Table's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on
   piece matches its set's main pieces). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and replaces its three
   layouts for this set only; nothing shared changes.

   Read off the approved Tasting Table pieces (postcard.html, tt-fo.js, tt-tokens.css, tt-marks.css):
     - the kit's dark as a block against the kit's paper; on the block the place in tracked copper caps, "Just Listed" / "Just Sold"
       large in Newsreader 500, sentence case, in the on-dark color, and the street under it in copper Newsreader italic
     - every photo plated in a paper border; the house plate laid across the block's edge (the postcard front, the fold-over cover)
     - Just Listed facts as the menu's leader rows: the label in small tracked caps, a dotted copper leader, the Newsreader numeral
       at the right (the postcard back, the fold-over cover)
     - rooms numbered like the sign-in sheet's rows: a Newsreader numeral over a short copper underline, the room in tracked caps
     - Just Sold: "Thinking about selling?" in Newsreader italic over the agent's note on the white card with the thin edge
     - the agent under an ink rule: the name in Newsreader, the number in Instrument Sans 600, REALTOR(R) in tracked caps, the logo
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house in every frame (the engine's
   house-cut check), text at the phone floors of templates/_shared/readsize.js. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const NR = "'Newsreader'", IS = "'Instrument Sans'";
  const DARK = 'var(--tt-dark)', OND = 'var(--tt-on-d)', COPD = 'var(--tt-copper-d)', COP = 'var(--tt-copper)', PAPER = 'var(--tt-paper)';
  const INK = 'var(--tt-on)', SOFT = 'var(--tt-soft)', LAB = 'var(--tt-label)', EDGE = 'var(--tt-edge)';
  const Q = 'Thinking about selling?';
  const AR = () => (window.TTSocial && TTSocial.logoAR) || 3.7;   // the logo's own shape, read before the layout (social.html)
  const F = {
    word: s => `font:500 ${s}pt ${NR};letter-spacing:${(-s*.008).toFixed(2)}pt`,
    street: s => `font:italic 500 ${s}pt ${NR}`,
    eye: tr => s => `font:600 ${s}pt ${IS};text-transform:uppercase;letter-spacing:${(s*tr).toFixed(2)}pt`,
    lab: s => `font:600 ${s}pt ${IS};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`,
    labT: tr => s => `font:600 ${s}pt ${IS};text-transform:uppercase;letter-spacing:${(s*tr).toFixed(2)}pt`,
    num: s => `font:500 ${s}pt ${NR}`,
    q: s => `font:italic 500 ${s}pt ${NR}`,
    note: s => `font:400 ${s}pt ${IS}`,
    name: s => `font:400 ${s}pt ${NR};letter-spacing:${(s*.04).toFixed(2)}pt`,
    tag: s => `font:600 ${s}pt ${IS};text-transform:uppercase;letter-spacing:${(s*.2).toFixed(2)}pt`,
    phone: s => `font:600 ${s}pt ${IS}`,
  };
  const CSS = `<style>
    .ss .tts-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ss .tts-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .tts-logo .text{font:600 12pt/1.15 ${IS};text-align:center;color:inherit}
    .ss .tts-hs{position:absolute;overflow:hidden}.ss .tts-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .tts-plate{position:absolute;background:${PAPER}}
    .ss .tts-dots{position:absolute;height:0;border-top-style:dotted;border-top-color:${COP}}
    .ss .tts-wb{position:absolute;background:#fff;border-style:solid;border-color:${EDGE};box-sizing:border-box}
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
    T.one = (t, face, w, max, min) => { for(let s = Math.ceil(Math.max(max, min)*2 - .02)/2; s >= min - .01; s -= .5) if(T.tw(t, face(s)) <= w) return s; return null; };
    T.done = () => M.remove();
    return T;
  };
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 || o.tall ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  const dots = (T, x, y, w, color) => w < 6 ? '' : `<div class="tts-dots" style="left:${x}pt;top:${y}pt;width:${w}pt;border-top-width:${r2(1.1*T.f)}pt${color ? ';border-top-color:' + color : ''}"></div>`;

  // ---------- photos: plated in the paper ----------
  // every room's own name, as the writer set it beside that photo anywhere in the package ("Kitchen.", "Family room.")
  const names = D => { if(D.__ttNames) return D.__ttNames; const map = {};
    const walk = o => { if(!o || typeof o !== 'object') return; if(Array.isArray(o)){ o.forEach(walk); return; }
      if(typeof o.photo === 'string' && typeof o.lead === 'string' && o.lead.trim() && !map[o.photo]) map[o.photo] = o.lead.trim().replace(/[.:]+$/, '');
      Object.values(o).forEach(walk); };
    walk(D.sw); walk(D.companion); walk(D.copy);
    return (D.__ttNames = map); };
  const roomName = (D, id) => { const n = names(D)[id]; if(n) return n;
    const t = String(((D.photos || {})[id] || {}).tags || '').split(',')[0].trim(); return /^[A-Za-z][A-Za-z ]{3,24}$/.test(t) ? t : ''; };
  // a room's name in tracked caps over a short copper underline; never a photo or stop number (owner 11/24/2026: "Entry", not "01 Entry")
  const capRow = (T, k) => { const ns = r2(T.FB*1.15*Math.min(k || 1, 1.3)), ls = r2(T.FS*Math.min(k || 1, 1.2)); return {ns, ls, h: ns*1.2 + 4*T.f}; };
  const numCap = (T, n, name, x, y, w, onDark, k, align) => { if(!name) return ''; const C = capRow(T, k);
    let ls = C.ls; const lf = F.lab; while(ls > T.FS && T.tw(name, lf(ls)) > w - 6) ls -= .5;
    if(T.tw(name, lf(ls)) > w - 6) return '';
    const lw = T.tw(name, lf(ls)), x0 = align === 'right' ? x + w - (lw + 2) : x;
    return txt('room.' + n + '.l', name, x0, y + C.ns*1.2*.8 - ls*1.3*.8, lw + 2, ls, 1.3, lf, onDark ? COPD : LAB, {small: 1})
      + rect(x0, y + C.ns*1.2 + 1.5*T.f, Math.min(lw, r2(28*T.f)), r2(1.2*T.f), `background:${onDark ? COPD : COP}`); };
  const heroKit = (D, f) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null, M = r2(4.5*f);
    const plate = (x, y, w, h) => `<div class="tts-plate" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"></div>`;
    const photo = (pid, x, y, w, ht) => plate(x, y, w, ht) + OHL.photo(D, pid, `left:${x + M}pt;top:${y + M}pt;width:${w - 2*M}pt;height:${ht - 2*M}pt`);
    const sup = n => { const fl = ((((D.companion || {}).flyer || {}).front || {}).row || []).map(c => c.photo), pc = ((((((D.sw || {}).pc || {}).jl || {}).back || {}).photos) || []).map(c => c.photo);
      const rest = window.OHEmail ? OHEmail.support(D, id, n + 6) : OHL.photos(D), seen = new Set(), out = [];
      fl.concat(pc, rest).forEach(p => { if(!p || p === id || !(D.photos || {})[p] || Ivory.fullHouse(D, p)) return; const key = (roomName(D, p) || p).toLowerCase().replace(/[^a-z]/g, '').slice(0, 6), k2 = p.replace(/\d+$|[a-z]$/, '');
        if(seen.has(key) || seen.has('#' + k2) || out.includes(p)) return; seen.add(key); seen.add('#' + k2); out.push(p); });
      return out.slice(0, n); };
    const imin = w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)), imax = w => Math.ceil(hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : w/pAR);
    return {id, pAR, M, photo, sup,
      min: w => imin(w - 2*M) + 2*M, max: w => imax(w - 2*M) + 2*M, nat: w => Math.ceil((w - 2*M)/pAR) + 2*M,
      hero: (x, y, w, ht) => { const iw = w - 2*M, ih = ht - 2*M; if(hb && ih > iw/pAR){ const vis = iw/(ih*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return photo(id, x, y, w, ht); },
      // n room plates side by side, each with its number and name: under it ('under'), over it ('over') or none
      rooms: (T, x, y, w, ht, n, g, cap, onDark) => { const ids = sup(n); if(!ids.length) return ''; const C = capRow(T, 1), ch = cap ? C.h + 3*T.f : 0, ph = ht - ch; if(ph < 36) return '';
        const pw = (w - (ids.length - 1)*g)/ids.length;
        return ids.map((p, i) => { const px = x + i*(pw + g);
          return photo(p, px, cap === 'over' ? y + ch : y, pw, ph) + (cap ? numCap(T, i + 1, roomName(D, p), px + (cap === 'over' ? 0 : 1), cap === 'over' ? y : y + ph + 3*T.f, pw - 2, onDark && cap !== 'over' ? true : false) : ''); }).join(''); }};
  };

  // ---------- words ----------
  // the street, never shortened: one line down to the floor size, else two lines at the floor with the last two words kept together
  const street = (T, Li, w, max, two) => { const t = Li.address, s = T.one(t, F.street, w - 2, max, T.FE);
    if(s) return {t, s, n: 1, w: T.tw(t, F.street(s)) + 2};
    if(!two) return null;
    const t2 = t.replace(/\s+(\S+)\s*$/, ' $1'), r = T.rows(t2, F.street(T.FE), w, T.FE*1.2);
    return r.n <= 2 ? {t: t2, s: T.FE, n: 2, w: r.wide + 2} : null; };
  const stH = st => st.n*st.s*1.2 + (st.n > 1 ? st.s*.15 : 0);
  const stTxt = (st, x, y, w, color, align) => txt('address', st.t, x, y, w, st.s, 1.2, F.street, color, {n: st.n, align, html: `<span>${esc(st.t)}</span>`});
  const eyebrow = (T, t, w, k) => { for(const tr of [.3, .22, .15, .1, .06]){ const s = T.one(t, F.eye(tr), w - 2, T.FS*1.05*Math.min(k, 1.3), T.FS); if(s) return {s, face: F.eye(tr), w: T.tw(t, F.eye(tr)(s)) + 2}; } return null; };
  // the listing's facts as menu rows: a label and its numeral
  const factList = D => { const out = [];
    OHL.factSix(D.listing).forEach(([ic, t]) => { let m;
      if(ic === 'cal'){ if((m = /(\d{4})/.exec(t))) out.push({l: 'Built', s: 'Built', v: m[1]}); }
      else if(ic === 'lot'){ if((m = /^([\d,.½¼¾]+)\s+(.+)$/.exec(t))) out.push(/acre/i.test(m[2]) ? {l: 'Acre lot', s: 'Acres', v: m[1]} : {l: 'Lot, square feet', s: 'Lot sq ft', v: m[1]}); }
      else if((m = /^([\d,.½¼¾]+)\s+(.+)$/.exec(t))) out.push({l: m[2], s: ic === 'bed' ? 'Beds' : ic === 'area' ? 'Sq ft' : m[2].replace(/full /i, ''), v: m[1]}); });
    return out; };
  // Just Sold: the agent's own note from the postcard, whole sentences in the writer's order (the first always kept), fullest first
  const notes = D => { const N = ((((((D.sw || {}).pc || {}).js || {}).front || {}).note || {}).s || []).slice(0, 5), a = N.map(x => String([].concat(x)[0])), b = N.map(x => String([].concat(x).slice(-1)[0])), out = [];
    for(let mask = (1 << N.length) - 1; mask >= 3; mask--){ if(!(mask & 1)) continue; for(const v of [b, a]) out.push(v.filter((_, i) => mask & (1 << i)).join(' ')); }
    out.sort((x, y) => y.length - x.length);
    return out.filter((t, i, arr) => t && arr.indexOf(t) === i && !SocialSet.CONDITION.test(t)); };

  // ---------- the block's words ----------
  // a column w wide: the word (one line, or its two words stacked where that sets it larger), the street on one line (never split)
  // and the place in tracked copper caps right under it
  const block = (T, Li, w, k, o) => { o = o || {};
    const place = OHL.place(Li), ey = eyebrow(T, place, w, k); if(!ey) return null;
    const cap = T.FE*2.7*k*(o.wordK || 1), one = T.one(SocialSet.M, F.word, w - 3, cap, T.FE), parts = SocialSet.M.split(' ');
    const two = o.stack && parts.length === 2 ? Math.min(...parts.map(p => T.one(p, F.word, w - 3, cap, T.FE) || 0)) : 0;
    const stacked = two && (!one || (two >= one*1.22 && Math.max(...parts.map(p => T.tw(p, F.word(two)))) >= w*.7)), ws = stacked ? two : one; if(!ws) return null;
    const n = stacked ? 2 : 1, lhK = stacked ? .96 : 1.04;
    const st = street(T, Li, w, Math.max(T.FE, Math.min(T.FE*1.5*k, ws*.58))); if(!st) return null;
    const wh = n*ws*lhK + ws*.1, g2 = 1*T.f, g3 = 1.5*T.f, h = wh + g2 + stH(st) + g3 + ey.s*1.3;
    const tw = Math.max(st.w, ey.w, ...(stacked ? parts : [SocialSet.M]).map(p => T.tw(p, F.word(ws))));
    return {h, ws, tw, ss: st.s, html: (x, y, sp) => txt('moment', SocialSet.M, x - ws*.03, y, w + ws*.03, ws, lhK, F.word, OND, {n, tall: 1, css: 'overflow:visible', html: stacked ? parts.map(esc).join('<br>') : null})
      + stTxt(st, x, y + wh + g2 + (sp || 0), w, COPD) + txt('place', place, x, y + wh + g2 + stH(st) + g3 + 2*(sp || 0), w, ey.s, 1.3, ey.face, OND, {small: 1})}; };
  // across a tall image: the word as wide as the block allows; under it the street, a dotted copper leader and the place (the menu row)
  const blockWide = (T, Li, w, k, o) => { o = o || {}; const place = OHL.place(Li), f = T.f;
    const ws = T.one(SocialSet.M, F.word, o.reserve ? w - o.reserve - 3 : (w - 3)*.86, T.FE*8, T.FE); if(!ws) return null;   // the word runs most of the block's width: nothing empty beside it
    const smax = Math.max(T.FE, Math.min(T.FE*1.45*k, ws*.5)); let st = null, ey = null, inline = false;
    for(let mx = smax; mx >= T.FE - .01 && !inline; mx -= 1){ const a = street(T, Li, w, mx); if(!a) break; const e = eyebrow(T, place, w - a.w - 30*f, Math.min(k, 1.15)); if(e){ st = a; ey = e; inline = true; } }
    if(!inline){ st = street(T, Li, w, smax); if(!st) return null; ey = eyebrow(T, place, w, Math.min(k, 1.15)); if(!ey) return null; }
    const wh = ws*1.04 + ws*.04, h = wh + stH(st) + (inline ? 0 : 1*f + ey.s*1.3);
    return {h, ws, html: (x, y) => { const y2 = y + wh, yb = y2 + st.s*1.2*.8;
      return txt('moment', SocialSet.M, x - ws*.03, y, w + ws*.03, ws, 1.04, F.word, OND, {tall: 1, css: 'overflow:visible'}) + stTxt(st, x, y2, inline ? st.w + 2 : w, COPD)
        + (inline ? dots(T, x + st.w + 9*f, y2 + st.s*1.2*.66, w - st.w - ey.w - 18*f, COPD) + txt('place', place, x + w - ey.w, yb - ey.s*1.3*.8, ey.w, ey.s, 1.3, ey.face, OND, {small: 1, align: 'right'})
          : txt('place', place, x, y2 + stH(st) + 1*f, w, ey.s, 1.3, ey.face, OND, {small: 1})); }}; };
  // one row across a wide image: the word at the left; at the right the street over the place
  const blockRow = (T, Li, w, k) => { const place = OHL.place(Li), gh = 22*T.f;
    for(let mx = Math.max(T.FE, T.FE*1.35*k); mx >= T.FE - .01; mx -= 1){
      const st = street(T, Li, w*.6, mx); if(!st) return null;
      const ey = eyebrow(T, place, Math.max(w*.42, st.w), Math.min(k, 1)); if(!ey) return null;
      const rw = Math.max(st.w, ey.w), ws = T.one(SocialSet.M, F.word, w - rw - gh - 3, T.FE*3.3*k, T.FE); if(!ws || ws < st.s*1.25) continue;
      const rh = stH(st) + 1*T.f + ey.s*1.3, wh = ws*1.04 + ws*.1, h = Math.max(rh, wh);
      return {h, ws, html: (x, y) => txt('moment', SocialSet.M, x - ws*.03, y + (h - wh)/2, w - rw - gh, ws, 1.04, F.word, OND, {tall: 1, css: 'overflow:visible'})
        + stTxt(st, x + w - rw, y + (h - rh)/2, rw, COPD, 'right') + txt('place', place, x + w - rw, y + (h - rh)/2 + stH(st) + 1*T.f, rw, ey.s, 1.3, ey.face, COPD, {small: 1, align: 'right'})}; }
    return null; };

  // ---------- the agent under the ink rule: name, REALTOR(R) beside the phone, the logo ----------
  const agent = (D, T, w, k, mode, al, lm) => { lm = lm || 0;
    const A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), gap = 10*T.f;
    const sizes = cw => { const ns = T.one(A.name || '', F.name, cw, T.FB*1.6*k, T.FB*1.1), ps0 = r2(Math.max(T.FB, T.FB*1.2*k)), ds = r2(Math.max(T.FS, T.FS*Math.min(k, 1.3))); if(!ns) return null;
      const dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0; let ps = null, inl = true;
      for(let s = ps0; s >= T.FB - .01 && !ps; s -= .5) if(dW + (nar ? s*.6 : 0) + T.tw(A.phone || '', F.phone(s)) <= cw) ps = s;
      if(!ps){ inl = false; ps = T.one(A.phone || '', F.phone, cw, ps0, T.FB); if(!ps) return null; }
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
    const logo = (x, y, lw, lh) => `<div class="abs tts-logo" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${INK}">${OHL.logo(D, 'light', '')}</div>`;
    const hs = (x, y, hw, hh) => `<div class="abs tts-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    // 'row': the lines at the left (after the headshot); the logo takes the rest of the row, as tall as the lines
    if(mode === 'row'){
      const lmin = Math.max(60*T.f, w*.34);
      for(const h0 of (hsOn ? [1, 0] : [0])){
        const probe = sizes(w), hsW = h0 && probe ? Math.round(probe.th*.8) : 0, cw = w - lmin - gap*1.4 - (h0 ? hsW + gap : 0), S = sizes(cw); if(!S) continue;
        const tx = (h0 ? hsW + gap : 0), lx = tx + S.wide + gap*1.4, lw = w - lx;
        if(al !== 'any' && lw - S.th*AR() > 70*T.f) return null;
        return {h: S.th, hs: !!h0, lg: Math.min(S.th*.94*AR(), lw), html: (x, y) => (h0 ? hs(x, y, hsW, S.th) : '') + lines(S, x + tx, y, S.wide + 2, 'left') + logo(x + lx, y + S.th*.03, lw, S.th*.94)};
      }
      return null;
    }
    // 'tower': the headshot centered over the lines, the logo centered under them (Google Just Sold, where the column beside the note
    // is far taller than the stack)
    if(mode === 'tower'){ if(!hsOn) return null; const S = sizes(w); if(!S) return null;
      // (the headshot nearly the column's width, as tall as the column leaves it: T.twAvail)
      const tWd = Math.min(w, S.wide + 2), hsW = r2(w*.82), lh1 = r2(Math.max(S.ns*1.4, T.FB*1.85)), lw0 = Math.min(w, lm ? Math.max(lm, tWd*.85) : Math.max(tWd, lh1*AR()));
      const lh = Math.min(T.FB*3.2, r2(lw0/AR())), lw = Math.min(lw0, lh*AR() + 2), lgG = (T.lgGap || 6)*T.f, g2 = r2(gap*.8), hsH = r2(Math.min(hsW*.86, (T.twAvail || 1e9) - (g2 + S.th + lgG + lh))); if(hsH < hsW*.55) return null;
      const full = hsH + g2 + S.th + lgG + lh, gW = Math.max(tWd, lw, hsW);
      return {h: full, hs: true, lg: lw, ww: gW, html: (x, y) => { const x0 = al === 'left' ? x : x + (w - gW)/2;
        return hs(x0 + (gW - hsW)/2, y, hsW, hsH) + lines(S, x0 + (gW - tWd)/2, y + hsH + g2, tWd, 'center') + logo(x0 + (gW - lw)/2, y + hsH + g2 + S.th + lgG, lw, lh); }}; }
    // 'stack': the lines with the logo centered under them; with a headshot the photo stands at the left, as tall as the stack and
    // as wide as the column leaves beside the lines
    for(const h0 of (hsOn ? [1, 0] : [0])){
      const p0 = sizes(w); if(!p0) return null;
      const lh0 = r2(Math.max(p0.ns*1.4, T.FB*1.85)), est = p0.th + 6*T.f + lh0;
      for(let hsW = h0 ? Math.round(est*(T.hsK || .72)) : 0; hsW >= (h0 ? est*.4 : 0); hsW -= 4){
        const cw = w - (h0 ? hsW + gap : 0), S = sizes(cw); if(!S){ if(!h0) break; continue; }
        const tWd = Math.min(cw, S.wide + 2), lh1 = r2(Math.max(S.ns*1.4, T.FB*1.85)), lw0 = Math.min(cw, lm ? Math.max(lm, tWd*.85) : Math.max(tWd, lh1*AR())), lh = Math.min(T.FB*3.2, r2(lw0/AR())), lw = Math.min(lw0, lh*AR() + 2), lgG = (T.lgGap || 6)*T.f, full = S.th + lgG + lh, gW = Math.max(tWd, lw);
        return {h: full, hs: !!h0, lg: lw, ww: (h0 ? hsW + gap : 0) + gW, html: (x, y) => { const tot = (h0 ? hsW + gap : 0) + gW, x0 = al === 'left' ? x : x + (w - tot)/2, tx = x0 + (h0 ? hsW + gap : 0);
          return (h0 ? hs(x0, y, hsW, full) : '') + lines(S, tx + (gW - tWd)/2, y, tWd, 'center') + logo(tx + (gW - lw)/2, y + S.th + lgG, lw, lh); }};
        if(!h0) break;
      }
    }
    return null;
  };

  // ---------- Just Listed: the menu rows ----------
  // list in `cols` columns across w: the label in tracked caps, the dotted copper leader, the numeral at the right
  const factRows = (T, list, w, k, cols, dark) => { if(!list.length) return null; return factRows0(T, list, w, k, cols, dark, 10, Math.max(6*T.f, 11)) || (cols > 1 ? factRows0(T, list, w, k, cols, dark, 6, 8) : null); };
  const factRows0 = (T, list, w, k, cols, dark, cgk, res) => { const cg = (cols > 1 ? cgk : 0)*T.f, cw = (w - (cols - 1)*cg)/cols, gap = 4*T.f;
    const odd = cols === 2 && list.length % 2 === 1 && list.length > 1, grid = odd ? list.slice(0, -1) : list;
    for(const vk of [1, 0]) for(const key of ['l', 's']) for(const tr of [.16, .1, .05]){ const LF = F.labT(tr);
      const vs = vk ? r2(Math.max(T.FB*1.1, T.FE*1.15*Math.min(k, 1.5))) : T.FB, ls = vk ? r2(Math.max(T.FS, T.FS*Math.min(k, 1.25))) : T.FS;
      if(grid.some(f => T.tw(f[key], LF(ls)) + T.tw(f.v, F.num(vs)) + 2*gap + res > cw)) continue;
      const rh = vs*1.3, per = Math.ceil(grid.length/cols), row = (f, i, x0, y0, rw0, kk) => { const lw = T.tw(f[kk], LF(ls)), vw = T.tw(f.v, F.num(vs));
        return txt('facts.' + i + '.l', f[kk], x0, y0 + rh*.8 - ls*1.3*.8, lw + 2, ls, 1.3, LF, dark ? OND : LAB, {small: 1}) + dots(T, x0 + lw + gap + 2, y0 + rh*.68, rw0 - lw - vw - 2*gap - 4, dark ? COPD : '')
          + txt('facts.' + i + '.v', f.v, x0 + rw0 - vw - 2, y0, vw + 2, vs, 1.3, F.num, dark ? OND : INK, {align: 'right'}); };
      return {h: (per + (odd ? 1 : 0))*rh, n: list.length, vs, rows: per + (odd ? 1 : 0), html: (x, y, sp) => grid.map((f, i) => row(f, i, x + Math.floor(i/per)*(cw + cg), y + (i % per)*(rh + (sp || 0)), cw, key)).join('')
        + (odd ? row(list[list.length - 1], list.length - 1, x, y + per*(rh + (sp || 0)), w, 'l') : '')}; }
    return null; };
  // the writer's lines (the house's story and what is nearby): sentences in order (the first always kept), every line 80%+ and the
  // last 90%+ of the measure, the measure narrowed a little or the type raised up to 12% to get there
  const writeUp = (T, D, w, s0, maxN) => { T.wu = T.wu || {}; const key = [Math.round(w), s0, maxN].join('|'); if(key in T.wu) return T.wu[key];
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing)).slice(0, 7), near = /\bmiles?\b/i; let best = null;
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of [1, .96, .92]) for(const s of [s0, r2(s0*1.06), r2(s0*1.12)]){ const r = T.rows(t, F.note(s), w*m, s*1.42); if(r.n > maxN || r.n < 2) continue;
        if(r.last < .9*w*m || r.ws.slice(0, -1).some(x => x < .8*w*m)) continue;
        const sc = r.n*100 + (near.test(t) ? 80 : 0) + m*20 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc, just: r.ws.slice(0, -1).every(x => x >= .88*w*m)}; } }
    if(best){ best.h = best.n*best.s*1.42 + best.s*.15;
      best.html = (x, y, W0) => txt('writeup', best.t, x + (W0 - best.w)/2, y, best.w, best.s, 1.42, F.note, SOFT, {n: best.n}); }
    return (T.wu[key] = best); };

  // ---------- Just Sold: the question in Newsreader italic over the note on the white card with the thin edge ----------
  // the fullest note that sets in maxN lines or fewer: every line 80%+ and the last 90%+ of its measure (the text block may narrow a
  // little, centered in the card), the type raised up to 13% where that fills the lines
  const pickNote = (T, D, iw, ns0, maxN, hmax) => { let best = null;
    notes(D).forEach((t, ti) => { for(const m of [1, .97, .94]) for(let s = ns0; s <= ns0*1.13 + .01; s += .5){
      const w = iw*m, r = T.rows(t, F.note(s), w, s*1.42); if(r.n > maxN || (hmax && r.n*s*1.42 > hmax)) continue;
      if(r.n === 1 ? r.wide < .9*iw : (r.last < .9*w || r.ws.slice(0, -1).some(x => x < .88*iw))) continue;
      const sc = r.n*1000 + Math.min(t.length, 400) - ti*.01 + m*30 - (s - ns0)*4;
      if(!best || sc > best.sc) best = {t, n: r.n, s, w, sc, just: r.n > 1 && r.ws.slice(0, -1).every(x => x >= .95*w)}; } });
    if(best || maxN < 1) return best;
    // "I just sold this house. Yours could be next.": on one line where it fills the card, else its two sentences one to a line (as
    // the engine sets it), the type raised until the longer one runs the card's width
    const P = SocialSet.SOLD_POST, two = P.split(/(?<=[.!?])\s+/), fits = (n, s) => !hmax || n*s*1.42 <= hmax;
    for(let s = r2(ns0*1.3); s >= ns0 - .01; s -= .5){ const w1 = T.tw(P, F.note(s)); if(w1 <= iw && w1 >= .9*iw && fits(1, s)) return {t: P, n: 1, s, w: w1 + 2, hug: 1}; }
    if(maxN >= 2 && two.length === 2) for(let s = r2(ns0*2.4); s >= ns0 - .01; s -= .5){ const ws = two.map(x => T.tw(x, F.note(s))); if(Math.max(...ws) <= iw && fits(2, s)) return Math.max(...ws) >= .8*iw ? {t: P, n: 2, s, w: Math.max(...ws) + 2, hug: 1, html: two.map(esc).join('<br>')} : null; }
    for(let s = r2(ns0*1.3); s >= ns0 - .01; s -= .5){ const w1 = T.tw(P, F.note(s)); if(w1 <= iw && fits(1, s)) return {t: P, n: 1, s, w: w1 + 2, hug: 1, slim: 1}; }
    return null; };
  // the note on its card, w wide (the card hugs a short fallback line): maxN lines at most
  const noteBox = (T, D, w, k, maxN, hroom) => { const nb = r2(8*T.f*Math.min(k, 1.2)), ns0 = r2(Math.max(T.FB, T.FB*1.05*k)), bw = r2(1.1*T.f);
    const pk = maxN > 0 ? pickNote(T, D, w - 2*nb, ns0, Math.min(8, maxN), hroom ? hroom - 2*nb - ns0*.15 : 0) : null; if(!pk) return null;
    const lh = pk.s*1.42, h = pk.n*lh + pk.s*.15 + 2*nb, bwid = pk.slim ? pk.w + 2*nb : w;   // (a short fallback line that cannot fill the card: the card hugs it)
    return {h, n: pk.n, len: pk.t.length, slim: !!pk.slim, fb: !!pk.hug, wd: bwid, html: (x, y) => `<div class="tts-wb" style="left:${x + (w - bwid)/2}pt;top:${y}pt;width:${bwid}pt;height:${h}pt;border-width:${bw}pt"></div>`
      + txt('sold.note', pk.t, x + (w - pk.w)/2, y + nb, pk.w, pk.s, 1.42, F.note, SOFT, {n: pk.n, html: pk.html, css: pk.hug ? 'text-align:center' : ''})}; };
  // the question over the card. o.lines: the most note lines; or o.room: the height (pt) the two may take.
  // o.side: the question on two lines at the left of the card (a short image).
  const sell = (D, T, w, k, o) => {
    let ql = [Q], qs = o.side ? null : T.one(Q, F.q, w - 3, T.FE*1.25*k*(o.qK || 1), T.FB);
    if(!qs){ ql = ['Thinking about', 'selling?']; qs = T.one(ql[0], F.q, (o.side ? w*.4 : w) - 3, T.FE*1.2*k, T.FB); if(!qs) return null; }
    const qh = ql.length*qs*1.22, qw = T.tw(ql[0], F.q(qs)) + 4, sg = 12*T.f, qg = o.side ? 0 : 6*T.f, bwid = o.side ? w - qw - sg : w, lhMin = r2(Math.max(T.FB, T.FB*1.05*k))*1.42, nb2 = 2*r2(8*T.f*Math.min(k, 1.2));
    let nb = null;
    for(let mx = Math.min(o.max || 8, o.lines != null ? o.lines : Math.floor(((o.side ? o.room : o.room - qh - qg) - nb2)/lhMin)); mx >= 1 && !nb; mx--){ const b = noteBox(T, D, bwid, k, mx, o.room != null ? (o.side ? o.room : o.room - qh - qg) : mx*lhMin*1.14 + nb2 + 4); if(b && (o.room == null || (o.side ? b.h : qh + qg + b.h) <= o.room)) nb = b; }
    if(!nb) return null;
    const h = o.side ? Math.max(qh, nb.h) : qh + qg + nb.h;
    return {h, len: nb.len, n: nb.n, fb: nb.fb, slim: nb.slim, html: (x, y) => { let s = '', yy = o.side ? y + (h - qh)/2 : y;
      ql.forEach((t, i) => { s += txt('sold.q' + (i ? 2 : ''), t, x, yy, o.side ? qw : w, qs, 1.22, F.q, LAB); yy += qs*1.22; });
      return s + (o.side ? nb.html(x + qw + sg, y + (h - nb.h)/2) : nb.html(x, yy + qg)); }};
  };
  const inkRule = (T, x, y, w) => rect(x, y, w, r2(1.1*T.f), `background:${INK}`);

  const TT = {};
  // ================= post, pin =================
  // The block across the head: the place, the word, the street. The house plate laid across the block's foot. On the paper under it:
  // Just Listed, the menu rows in two columns and the writer's lines; Just Sold, the question and the note on its card; then the ink
  // rule and the agent. Room the house cannot take goes to two numbered room plates.
  // ================= story =================
  // The block holds the house plate and, under it, the words (clear of the top 250 px). The paper carries the rows or the note and
  // the agent; two room plates, numbered over them, cross the edge of the foot block and run to the foot (no words in the last 250 px).
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', story = shape === 'story', BOT = story ? H - Math.max(94, r2(100*f)) : H;
    const sq = shape === 'square', m = r2((sq ? 11 : 13)*f), pad = r2(16*f), g = r2((sq ? 6.5 : 8)*f), pw = W - 2*m, cw = W - 2*pad, FL = factList(D), ov = r2((sq ? 26 : 34)*f), CR = capRow(T, 1), rw = r2(1.1*f);
    const rowMin = story ? H - m - (BOT - 3*f) + CR.h + 3*f : 0;   // the room plates under their numbers: the numbers end above the last 250 px
    const build = (k, o) => {
      const hd = (sq && blockRow(T, Li, cw, k)) || blockWide(T, Li, cw, k); if(!hd) return null;
      const list = sold ? null : FL.slice(0, o.nf), body = sold ? sell(D, T, cw, k, {lines: o.nl, side: sq}) : o.c4 ? factRows(T, list, cw, Math.min(k, .8), 4) : (factRows(T, list, cw, k, 2) || factRows(T, list, cw, k, 1)); if(!body || (sold && body.n < Math.min(o.nl, 2))) return null;
      const wu = !sold && o.wl ? writeUp(T, D, cw, r2(Math.max(FB, FB*1.05*k)), o.wl) : null; if(!sold && o.wl && (!wu || wu.n < Math.min(o.wl, 2))) return null;
      const ag = agent(D, T, cw, k, 'row', 'any'); if(!ag) return null;
      const tp = r2(11*f*Math.min(k, 1.3)), lower = g*1.5 + body.h + (wu ? g*1.2 + wu.h : 0) + g*1.3 + rw + g*1.1 + ag.h;
      const fixed = story ? m + g*1.2 + hd.h + g*1.7 + lower + g*1.8 + m : tp + hd.h + g*1.4 + lower + m*.95;
      return {hd, body, wu, ag, tp, lower, room: H - fixed};
    };
    const nfs = [5, 4, 2].filter(n => n <= FL.length); if(!nfs.length) nfs.push(FL.length);
    const opts = sold ? (story || shape === 'pin' ? [6, 5, 4, 3, 2, 1] : [4, 3, 2, 1]).map(nl => ({nl}))
      : [].concat(...nfs.map(nf => (story || shape === 'pin' ? [4, 3, 2, 0] : sq ? [0] : [3, 2, 0]).map(wl => ({nf, wl})).concat(sq && nf === 4 ? [{nf: 4, wl: 0, c4: 1}] : [])));
    const KMAX = {post: 1.6, pin: 1.7, story: 1.6}[shape] || 1.5, KMIN = .6, PMAX = Math.min(X.max(pw), X.nat(pw)*1.03);
    let pick = null;
    for(const o of opts){
      const b1 = build(KMIN, o); if(!b1 || b1.room < X.min(pw) + rowMin) continue;
      const need = Math.min(b1.room, (story ? X.nat(pw) : X.min(pw) + (sq ? .3 : .75)*(X.nat(pw) - X.min(pw))) + rowMin);
      let k = KMIN; for(let t = KMAX; t >= KMIN; t -= .025){ const b = build(t, o); if(b && b.room >= need){ k = t; break; } }
      pick = {o, k}; break;
    }
    pick = pick || {o: sold ? {nl: 1} : {nf: Math.min(2, FL.length), wl: 0}, k: KMIN};
    const B = build(pick.k, pick.o) || build(KMIN, pick.o);
    let h = CSS, y;
    const lowerAt = (y0, e) => { let yy = y0 + g*1.5 + e, s = '';
      s += B.body.html(pad, yy); yy += B.body.h;
      if(B.wu){ yy += g*1.2 + e; s += B.wu.html(pad, yy, cw); yy += B.wu.h; }
      yy += g*1.3 + e; s += inkRule(T, pad, yy, cw); yy += rw + g*1.1;
      s += B.ag.html(pad, yy); return {s, y: yy + B.ag.h}; };
    if(!story){
      let ph = Math.max(X.min(pw), Math.min(PMAX, B.room)), spare = Math.max(0, B.room - ph);
      const rowH = spare >= 92*f ? spare - g : 0, gs = rowH ? 0 : spare, top = B.tp + gs*.12, hy = top + B.hd.h + g*1.4 + gs*.12, BH = hy + ov;
      h += rect(0, 0, W, BH, `background:${DARK}`) + B.hd.html(pad, top) + X.hero(m, hy, pw, ph); y = hy + ph;
      if(rowH){ h += X.rooms(T, m, y + g, pw, rowH, 2, g, 'under'); y += rowH + g; }
      h += lowerAt(y, gs*.76/(B.wu ? 3 : 2)).s;
    } else {
      const room = B.room - rowMin; let ph = Math.max(X.min(pw), Math.min(X.nat(pw), room)), rest = Math.max(0, room - ph);
      const add = Math.min(rest, 70*f); rest -= add; const more = Math.min(rest, Math.max(0, PMAX - ph)); ph += more; rest -= more;
      const e = rest/5;
      h += rect(0, 0, W, m + ph + g*1.2 + B.hd.h + g*1.7 + e*1.2, `background:${DARK}`) + X.hero(m, m, pw, ph) + B.hd.html(pad, m + ph + g*1.2 + e*.6);
      const lo = lowerAt(m + ph + g*1.2 + B.hd.h + g*1.7 + e*1.2, e); h += lo.s;
      const yR = lo.y + g*1.8 + e*.8, rh = H - m - yR, ch = CR.h + 3*f;
      h += rect(0, yR + ch + (rh - ch)*.42, W, H - (yR + ch + (rh - ch)*.42), `background:${DARK}`) + X.rooms(T, m, yR, pw, rh, 2, g, 'over');
    }
    T.done();
    return h;
  };

  // ================= wide (X), Google Business Profile =================
  // The block across the head. The house plate at the left, as large as the image allows in the photo's own shape, from the top
  // margin down across the block's foot; in the block beside it the place, the word and the street. Under the house on the paper:
  // Just Listed, the menu rows in two columns; Just Sold, the note on its card. Beside it on the paper: the question (Just Sold, where
  // the column holds it) and the agent with the logo.
  const land = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', wide = shape === 'wide';
    const m = r2(Math.min(13*f, H*.045)), pad = r2(Math.min(16*f, W*.035)), g = r2(Math.min(8*f, H*.026)), gC = r2(Math.min(14*f, W*.03)), FL = factList(D), lm = r2(FB*2.05);
    const lmW = r2(W*(wide ? .27 : .23));
    const KS = [1.6, 1.4, 1.25, 1.1, 1, .9, .8, .7, .6], hsWant = OHL.cardMode(D) === 'headshot' && !!(D.agent || {}).headshot;
    let pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
    // the narrowest the agent sets (the rows or the note may run wider than the house, up to the agent's column)
    T.lgGap = 6; let a0 = null; for(const q of [.26, .29, .32, .36, .4, .45, .5]){ a0 = agent(D, T, W*q, .6, 'stack', 'center', lmW); if(a0 && (a0.hs || !hsWant)) break; }
    const swMax = a0 ? Math.floor(W - m - pad - gC - a0.ww - 4) : 0;
    for(const relax of [0, 1]){ if(pick) break;
      for(let fr = .66; fr >= (relax ? .36 : .45); fr -= .015){ const pw = Math.round(W*fr), cw = W - m - pw - gC - pad; if(cw < 56*f) continue;
        const pMin = X.min(pw), pMax = Math.min(X.max(pw), X.nat(pw)*(wide ? 1.04 : 1.28));
        for(const sw of (swMax > pw + 8 ? [0, .25, .5, .75, 1].map(t => Math.round(pw + t*(swMax - pw))) : [pw])){
        // under the house: the rows, or the question over the note, at the largest size that leaves the house its room
        let strip = null, ph = 0;
        for(const ks of KS){ const room = H - 2*m - g*1.3 - pMin; let b = null;
          if(sold){ b = sell(D, T, sw, ks, {room, max: 4}) || sell(D, T, sw, ks, {room, side: 1, max: 4}); if(b && b.h > room) b = null; }
          else if(ks <= (wide ? .8 : 1.1)) for(const [n, cols] of [[4, 2], [4, 1], [2, 2], [2, 1]]){ if(b || n > FL.length) continue; const c = factRows(T, FL.slice(0, n), sw, ks, cols); if(c && c.h <= room){ b = c; b.re = w2 => factRows(T, FL.slice(0, n), w2, ks, cols); } }
          if(!b) continue;
          const p = Math.min(pMax, H - 2*m - g*1.3 - b.h), sc = (sold ? Math.min(b.len, 200)*3 + (b.n >= 2 ? 120 : 0) - (b.slim ? 200 : 0) - (b.fb ? 160 : 0) : b.n*300) + ks*40 + p*2 - (H - 2*m - g*1.3 - b.h - p)*5;
          if(!strip || sc > strip.sc){ strip = Object.assign({sc, ks}, {b}); ph = p; } }
        if(!strip) continue;
        const lfL = H - 2*m - g*1.3 - strip.b.h - ph, cwA = W - pad - m - sw - gC;
        for(const tight of (wide ? [0, 1] : [0])) for(const k of KS) for(const wk of (k > .61 ? [1.5] : [1.5, 1.1, .95, .85, .78, .72, .66, .62])){
          const hd = block(T, Li, cw, k, {stack: 1, wordK: wk}); if(!hd) continue;
          const tk = tight ? .62 : 1, tp = r2(Math.min(11*f*Math.min(k, 1.3), H*.04)*tk), bp = r2(Math.min(10*f*Math.min(k, 1.3), H*.035)*tk), BH = tp + hd.h + bp;
          if(BH < m + 26*f || BH > m + ph - 9*f) continue;   // the plate crosses the block's foot
          const avail = H - m*.85*tk - BH - g*1.2*(tight ? .8 : 1); T.lgGap = tight ? 3 : 6;
          let ags = [2.2, 1.8, 1.5, 1.25, 1, .8, .6].map(ka => agent(D, T, cwA, Math.max(.6, k*ka), 'stack', 'center', lmW)).filter(a => a && a.h <= avail).slice(0, 2);
          // (Google: an agent whose lines and logo would leave tall room above and below them: a narrower headshot gives the lines and
          // the logo the width to grow into that room)
          if(!wide && ags.length && ags[0].hs && avail - ags[0].h > H*.07){ T.hsK = .5; ags = ags.concat([2.6, 2.2, 1.8, 1.5].map(ka => agent(D, T, cwA, Math.max(.6, k*ka), 'stack', 'center', r2(W*.3))).filter(a => a && a.h <= avail).slice(0, 2).map(a => Object.assign(a, {lgB: 1}))); T.hsK = 0; }
          // (Google Just Sold: a headshot stack far shorter than its column: the headshot over the lines instead)
          if(!wide && sold && hsWant && ags.length && avail - ags[0].h > H*.07) { T.twAvail = avail; ags = ags.concat([2.2, 1.8, 1.5, 1.25, 1].map(ka => agent(D, T, cwA, Math.max(.6, k*ka), 'tower', 'center', lmW)).filter(a => a && a.h <= avail).slice(0, 2)); T.twAvail = 0; }
          for(const ag of ags){ const lf = avail - ag.h;
            take({pw, ph, sw, cw, cwA, hd, tp, BH, strip: strip.b, lfL, ag, lf, sc: pw*ph/(W*H)*2600 + strip.sc*.6 + k*70 + hd.ws*2 - (hd.ws < hd.ss*1.15 ? 500 : 0) - Math.max(0, cwA - ag.ww - 16*f)*4 - Math.max(0, cw - hd.tw - 14*f)*4 - (sw - pw)*.3 - (sw - pw)*Math.max(0, m + ph - BH)/(W*H)*20000 - tight*12 + (ag.hs || !hsWant ? 0 : -600) - Math.max(0, (ag.lgB ? r2(W*.3) : lmW) - ag.lg)*2 - lf*4 - lfL*3});
          }
        } } }
    }
    T.lgGap = 6;
    if(!pick){ T.done(); return TT.base ? TT.base.landscape(D, L, W, H, shape) : CSS; }
    // room left over in the text column opens evenly between its lines (nothing stands in a large empty field)
    const P = pick, tx = m + P.pw + gC, up = Math.min(P.lf*4/6, 24*f, Math.max(0, m + P.ph - 9*f - P.BH)), BH = P.BH + up; let h = CSS + rect(0, 0, W, BH, `background:${DARK}`);
    // the rows run out to the agent's column where the agent leaves room beside them
    let strip = P.strip, sw = P.sw; const slack = P.cwA - P.ag.ww;
    if(strip.re && slack > 12*f){ const s2 = strip.re(sw + slack - 10*f); if(s2 && s2.h <= strip.h + .5 && s2.n === strip.n){ strip = s2; sw += slack - 10*f; } }
    { const rws = strip.rows || 0, sp = rws > 1 ? Math.min(P.lfL*.45/(rws - 1), 14*f) : 0, lr = P.lfL - sp*Math.max(0, rws - 1);
      h += X.hero(m, m + lr*.2, P.pw, P.ph) + strip.html(m, m + lr*.6 + P.ph + g*1.3, sp) + P.hd.html(tx, P.tp + up/4, up/4); }
    // (where the agent stands well clear of the house plate, with a tall empty field between them over the rows: the agent moves
    // toward the plate, centered in the paper beside it, never over the rows)
    let ax = m + P.sw + gC + (sw - P.sw)/2; { const L0 = ax + (P.cwA - P.ag.ww)/2, gapL = L0 - (m + P.pw), tall = m + P.ph - BH;
      if(gapL*tall > W*H*.025){ const L1 = Math.max(m + sw + gC*.6, (m + P.pw + gC + W - pad - P.ag.ww)/2); if(L1 < L0) ax -= L0 - L1; } }
    h += P.ag.html(ax, BH + g*1.2 + (P.lf - up)*.5);
    T.done();
    return h;
  };
  TT.portrait = tall;
  TT.landscape = land;

  // ================= carousel photo slides: the room plated on the paper, laid across the edge of the foot block =================
  // on the block: the word and the street in copper italic at the left; the room's number and name at the right
  TT.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), {f, FE} = T, X = heroKit(D, f), m = r2(13*f), pad = r2(16*f), w = W - 2*pad, ov = r2(34*f), bp = r2(12*f);
    const id = D.piece.photo, ids = SocialSet.slides(D), n = Math.max(1, ids.indexOf(id) + 1), name = roomName(D, id);
    const C = capRow(T, 1.2), capW = name ? T.tw(name, F.lab(C.ls)) + 8 : 0;
    // the caption beside the word where the word keeps its size; else on its own line over the word (never run into it)
    let hd = null; for(const k of [1.05, .95, .85]){ hd = blockWide(T, D.listing, w, k, {reserve: capW ? capW + 18*f : 0}); if(hd) break; }
    const own = !hd && capW > 0, ch = own ? r2(C.ns*1.2 + 6*f) : 0; if(!hd) hd = blockWide(T, D.listing, w, 1.05, {}) || blockWide(T, D.listing, w, .7, {});
    const BH = ov + bp + ch + hd.h + bp, BT = H - BH, y = BT + ov + bp + ch;
    let h = CSS + rect(0, BT, W, BH, `background:${DARK}`) + X.photo(id, m, m, W - 2*m, BT + ov - m) + hd.html(pad, y);
    if(capW) h += own ? numCap(T, n, name, pad + w - capW, y - ch, capW, true, 1.2, 'right') : numCap(T, n, name, pad + w - capW, y + hd.ws*1.04*.8 - C.ns*1.2*.8, capW, true, 1.2, 'right');
    T.done();
    return h;
  };
  window.TTSocial = TT;
})();
