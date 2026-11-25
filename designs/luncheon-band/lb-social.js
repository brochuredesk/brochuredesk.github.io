/* templates/luncheon-band/lb-social.js: Luncheon Band's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on
   piece matches its set's main pieces). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and replaces its three
   layouts for this set only; nothing shared changes.

   Read off the approved Luncheon Band pieces (postcard.html, flyer.html, foldover.html, lb-tokens.css, lb-marks.css):
     - the brand kit's paper as the field; the house as a plain photo set inside the margin (never full bleed)
     - ONE tall dark band edge to edge with the status word in very large bold Plex Condensed caps.
       Just Listed: the band across the foot with the icon facts in it (a line icon in the accent over the number in Plex Condensed
       bold over a small caps label, hairlines between the cells). Just Sold: the band across the head, the street under the word in
       the accent at regular weight (one line with the word where the image is wide, as on the postcard back).
     - on the paper: the street in bold condensed caps, the place in Libre Franklin under it, the main-color rule, highlights on
       small main-color squares, a 25% hairline, then the agent (name in Plex Condensed bold, REALTOR(R) in tracked caps beside the
       phone) with the logo past a vertical hairline
     - Just Sold: "THINKING ABOUT SELLING?" stacked in bold condensed caps, the last word in the main color; the note in the white
       box with the thin main-color line; a hairline; the agent
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house in every frame (the engine's
   house-cut check), text at the phone floors of templates/_shared/readsize.js. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const PC = "'PlexCond'", FR = "'Franklin'";
  const DARK = 'var(--lb-dark)', OND = 'var(--lb-on-dark)', ACC = 'var(--lb-acc-dark)', MAINP = 'var(--lb-main-paper)', INK = 'var(--lb-ink)', TEXT = 'var(--lb-text)', RULE = 'var(--lb-rule)';
  // B10's line icons (lb.js LB.ICON)
  const ICON = {
    bed: '<svg viewBox="0 0 24 24"><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/></svg>',
    bath: '<svg viewBox="0 0 24 24"><path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 12V5a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/></svg>',
    area: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 9h5M15 4v5M9 20v-5M20 15h-5"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>'
  };
  const F = {
    word: s => `font:700 ${s}pt ${PC};letter-spacing:.3pt;text-transform:uppercase`,
    streetR: s => `font:400 ${s}pt ${PC};letter-spacing:.3pt;text-transform:uppercase`,
    place: s => `font:400 ${s}pt ${FR}`,
    val: s => `font:700 ${s}pt ${PC}`,
    lab: s => `font:700 ${s}pt ${FR};text-transform:uppercase;letter-spacing:.4pt`,
    body: s => `font:400 ${s}pt ${FR}`,
    note: s => `font:500 ${s}pt ${FR}`,
    bul: s => `font:500 ${s}pt ${FR}`,
    name: s => `font:700 ${s}pt ${PC}`,
    tag: s => `font:700 ${s}pt ${FR};text-transform:uppercase;letter-spacing:${(s*.2).toFixed(2)}pt`,
    phone: s => `font:600 ${s}pt ${FR}`,
  };
  const CSS = `<style>
    .ss .lbs-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ss .lbs-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .lbs-logo .text{font:700 12pt/1.15 ${PC};text-align:center;color:inherit}
    .ss .lbs-hs{position:absolute;overflow:hidden}.ss .lbs-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .lbs-caps{position:absolute;white-space:nowrap}
    .ss .lbs-ic svg{width:100%;height:100%;display:block;fill:none;stroke:${ACC};stroke-width:1.5}
    .ss .lbs-box{position:absolute;background:#fff;border:.9pt solid ${MAINP};box-sizing:border-box}
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
    // the largest size from max down to min at which one line fits w (the width grows with the size, so a halving search)
    T.one = (t, face, w, max, min) => { max = Math.max(max, min); if(T.tw(t, face(min)) > w) return null; if(T.tw(t, face(max)) <= w) return r2(max);
      let lo = min, hi = max; while(hi - lo > .5){ const md = (lo + hi)/2; if(T.tw(t, face(md)) <= w) lo = md; else hi = md; }
      let s = Math.floor(lo*2)/2; if(s < min) s = min; return T.tw(t, face(s)) <= w ? s : min; };
    T.done = () => M.remove();
    return T;
  };
  // a face's capitals, measured on the page: the cap height and where the baseline falls in a line box as tall as the type (in em)
  const METS = {};
  const met = (fam, wt) => { const key = fam + wt; if(METS[key]) return METS[key]; const c = document.createElement('canvas').getContext('2d'); c.font = `${wt} 200px ${fam}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:${wt} 200px ${fam};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    return (METS[key] = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}); };
  const MC = () => met(PC, 700), capH = s => MC().cap*s, capsH = (n, s, lhK) => (n - 1)*s*lhK + capH(s);
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  // condensed capitals set by their ink: the top of the first line's letters at y (lines: html, one per line)
  const capsAt = (slot, lines, x, y, w, s, lhK, face, color, o) => { o = o || {}; const m = MC(), lh = s*lhK, top = y - ((lh - s)/2 + (m.base - m.cap)*s), n = lines.length;
    return `<div class="lbs-caps" data-slot="${slot}" data-lines="${n}" style="left:${x}pt;top:${top}pt;width:${w}pt;height:${n*lh}pt;${face(s)};line-height:${lh}pt;color:${color};text-align:${o.align || 'left'}">${lines.join('<br>')}</div>`; };
  const span = t => `<span>${esc(t)}</span>`;   // (inside a span the shared address pass leaves the street as written)
  // a one-line text in Franklin whose baseline sits at by
  const onBase = (slot, t, x, by, w, s, face, color, o) => { const m = met(FR, 400), lh = s*1.3; return txt(slot, t, x, by - ((lh - s)/2 + m.base*s), w, s, 1.3, face, color, o); };

  // ---------- photos: plain, inset on the paper ----------
  const heroKit = (D, f) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const photo = (pid, x, y, w, ht) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${ht}pt`);
    // room photos side by side: one photo a room (kitchen and kitchen2 are one room), the main rooms before halls, baths and side yards
    const MINOR = /^(bath|pbath|powder|shower|closet|laundry|utility|pantry|hall|garage|mud|storage|stair|entry|foyer|walk|wine|side|yard|drive)/i;
    const sup = n => { const all = window.OHEmail ? OHEmail.support(D, id, 24) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)), seen = new Set();
      const rooms = all.filter(p => { const r = String(p).replace(/\d+[a-z]?$/i, ''); if(seen.has(r)) return false; seen.add(r); return true; });
      const main = rooms.filter(p => !MINOR.test(p) && !MINOR.test(String((D.photos[p] || {}).tags || ''))), ord = main.concat(rooms.filter(p => !main.includes(p)));
      return (ord.length >= n ? ord : all).slice(0, n); };
    return {id, pAR, photo,
      min: w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)), nat: w => Math.ceil(w/pAR),
      max: w => Math.ceil(hb ? Math.max(w/pAR, Math.min(w/pAR*1.1, w/((hb.right - hb.left + .05)*pAR))) : w/pAR),   // a little taller crops the sides a little, never the house
      maxH: w => Math.ceil(hb ? Math.max(w/pAR, Math.min(w/pAR*1.5, w/((hb.right - hb.left + .05)*pAR))) : w/pAR),   // the most the sides may go where a shape leaves no other way
      hero: (x, y, w, ht) => { if(hb && ht > w/pAR){ const vis = w/(ht*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return photo(id, x, y, w, ht); },
      // n room photos side by side
      row: (x, y, w, ht, n, g, skip) => { const ids = sup(n + (skip || 0)).slice(skip || 0); if(!ids.length || ht < 30) return ''; const pw = (w - (ids.length - 1)*g)/ids.length; return ids.map((p, i) => photo(p, x + i*(pw + g), y, pw, ht)).join(''); }};
  };

  // ---------- words ----------
  // the street, never shortened: one line down to the floor size, else (two: true) two lines broken where both stand largest
  const street = (T, t, face, w, max, min, two) => { const s = T.one(t, face, w, max, min); if(s) return {ls: [t], s, w: T.tw(t, face(s))};
    if(!two || T.tw(t, face(min)) <= w) return null; const ws = t.split(/\s+/); let best = null;   // (two lines only for a street no line of this width holds)
    for(let i = 1; i < ws.length; i++){ const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '), s2 = Math.min(T.one(a, face, w, max, min) || 0, T.one(b, face, w, max, min) || 0);
      if(s2 && (!best || s2 > best.s)) best = {ls: [a, b], s: s2, w: Math.max(T.tw(a, face(s2)), T.tw(b, face(s2)))}; }
    return best; };
  // the icon facts, as the postcard's band carries them: [icon, value, label, short label]
  const cellsOf = D => { const L = D.listing, out = [];
    if(L.beds) out.push(['bed', String(L.beds), L.beds == 1 ? 'Bedroom' : 'Bedrooms', L.beds == 1 ? 'Bed' : 'Beds']);
    if(L.baths){ const fb = +L.baths || 0, hb = +L.halfBaths || 0;
      if(hb === 1) out.push(['bath', fb + '½', 'Baths', 'Baths']);
      else { out.push(['bath', String(fb), fb === 1 ? 'Full Bath' : 'Full Baths', hb >= 2 ? (fb === 1 ? 'Full Bath' : 'Full Baths') : (fb === 1 ? 'Bath' : 'Baths')]); if(hb >= 2) out.push(['bath', String(hb), 'Half Baths', 'Half Baths']); } }
    if(L.sqft) out.push(['area', Number(L.sqft).toLocaleString('en-US'), 'Sq ft', 'Sq ft']);
    const yr = L.yearBuilt || L.year; if(yr) out.push(['cal', String(yr), 'Built', 'Built']);
    return out; };
  const cellKit = (T, list, k, short, tight) => { const ls = r2(Math.max(T.FS, T.FS*k)), vs = r2(tight ? T.FB*1.15 : Math.max(T.FB*1.3, ls*1.85*Math.min(1, k))), is = r2(tight ? vs : vs*.92), px = r2(tight ? 5 : Math.min(6*T.f, 8)), lab = c => short ? c[3] : c[2];
    const cw = Math.max(...list.map(c => Math.max(T.tw(c[1], F.val(vs)), T.tw(lab(c).toUpperCase(), F.lab(ls)), is))) + 2*px, h = is + 2.5*T.f + vs*1.1 + ls*1.25;
    return {cw, h, html: (x, y, w) => list.map((c, i) => { const cx = x + i*w;
      return `<div class="abs lbs-ic" style="left:${cx + (w - is)/2}pt;top:${y}pt;width:${is}pt;height:${is}pt">${ICON[c[0]]}</div>`
        + txt('facts.' + i, c[1], cx, y + is + 2.5*T.f, w, vs, 1.1, F.val, OND, {align: 'center'})
        + txt('facts.' + i + '.k', lab(c), cx, y + is + 2.5*T.f + vs*1.1, w, ls, 1.25, F.lab, OND, {align: 'center', small: 1, css: 'opacity:.9'}); }).join('')}; };
  // the listing's other facts (what the icon cells do not show), for the highlights on their squares
  const bulItems = (D, shown) => OHL.factSix(D.listing).filter(([ic]) => !shown.includes(ic)).map(([, t]) => t.charAt(0).toUpperCase() + t.slice(1)).slice(0, 4);

  // ---------- the band ----------
  // Just Listed. 'row' (the postcard front): the word flush left as large as it goes, the icon cells at the right with a hairline
  // before each. 'stack' (the narrow shapes): the word across the band, the cells in a row under it.
  const bandJL = (T, D, W, k, mode, pad, bpMax, nC, tight) => { const CL = cellsOf(D), kk = Math.min(k, 1.15), bp = r2(Math.min(13*T.f*kk, bpMax || 99)), word = SocialSet.M, HL = 'background:rgba(255,255,255,.35)';
    if(mode === 'stack'){ const ws = T.one(word, F.word, W - 2*pad - 2, 300, T.FE), g = r2(12*T.f*kk); if(!ws) return null;
      for(const n of [4, 3, 2]) for(const short of [false, true]){ const list = CL.slice(0, n); if(list.length < Math.min(n, CL.length)) continue; if(!list.length) continue;
        const C = cellKit(T, list, k, short), cwE = (W - 2*pad)/list.length; if(C.cw > cwE) continue;
        const h = bp + capH(ws) + g + C.h + bp*.9, cy = bp + capH(ws) + g;
        return {h, ws, up: Math.max(0, ws*.34 + 5 - bp), icons: list.map(c => c[0]), html: y => rect(0, y, W, h + 1, `background:${DARK}`) + capsAt('moment', [esc(word)], pad, y + bp, W - 2*pad, ws, .8, F.word, OND)
          + C.html(pad, y + cy, cwE) + list.slice(1).map((_, i) => rect(pad + (i + 1)*cwE - .5, y + cy + 1, 1, C.h - 2, HL)).join('')}; }
      return null; }
    let best = null;
    for(const short of [false, true]){ const list = CL.slice(0, nC || 3); if(!list.length) continue; const C = cellKit(T, list, k, short, tight), cellsW = C.cw*list.length, gap = r2(tight ? 10*T.f : 14*T.f);
      const ws0 = T.one(word, F.word, W - 2*pad - cellsW - gap, 300, T.FE); if(!ws0) continue; const ws = Math.min(ws0, r2(C.h*1.06/MC().cap));
      if(!best || ws > best.ws*1.12) best = {list, C, gap, ws}; }
    if(!best) return null;
    const {list, C, gap, ws} = best, wordW = T.tw(word, F.word(ws)), cw = Math.min(C.cw*(tight ? 1.12 : 1.35), (W - 2*pad - gap - wordW)/list.length), cellsW = cw*list.length, inner = Math.max(capH(ws), C.h), h = inner + 2*bp, x0 = W - pad - cellsW;
    return {h, ws, up: Math.max(0, ws*.34 + 5 - bp - (inner - capH(ws))/2), icons: list.map(c => c[0]), html: y => rect(0, y, W, h + 1, `background:${DARK}`) + capsAt('moment', [esc(word)], pad, y + bp + (inner - capH(ws))/2, wordW + 4, ws, .8, F.word, OND)
      + C.html(x0, y + bp + (inner - C.h)/2, cw) + list.map((_, i) => rect(x0 + i*cw - .5, y + bp*.7, 1, h - bp*1.4, HL)).join('')};
  };
  // Just Sold. 'stack' (the postcard front): the word centered, the street under it in the accent at regular weight.
  // 'row' (the postcard back): the word and the street on one line.
  const bandJS = (T, Li, W, k, mode, pad, o) => { o = o || {}; const kk = Math.min(k, 1.15), bp = r2(Math.min(13*T.f*kk, o.bpMax || 99)), word = SocialSet.M, ad = Li.address, place = OHL.place(Li);
    if(mode === 'row'){
      const ps = r2(Math.max(T.FS, T.FS*1.1*kk)), pw = T.tw(place, F.place(ps)), pg = r2(Math.min(4*T.f, 6));
      for(let s = Math.ceil(T.FE*3.4*Math.max(k, 1)); s >= T.FE*1.25; s -= .5){ const a = T.tw(word, F.word(s)), ss = Math.max(T.FE, r2(s*.62)), b = Math.max(T.tw(ad, F.streetR(ss)), pw), sp = s*.4; if(a + sp + b > W - 2*pad) continue;
        const rh = capH(ss) + pg + ps*1.2, inner = Math.max(capH(s), rh), h = inner + 2*bp, x0 = (W - a - sp - b)/2, ry = bp + (inner - rh)/2;
        return {h, ws: s, html: y => rect(0, y, W, h + 1, `background:${DARK}`) + capsAt('moment', [esc(word)], x0, y + bp + (inner - capH(s))/2, a + 2, s, .8, F.word, OND)
          + capsAt('address', [span(ad)], x0 + a + sp, y + ry, b + 2, ss, .8, F.streetR, ACC) + txt('place', place, x0 + a + sp, y + ry + capH(ss) + pg - ps*.12, b + 2, ps, 1.3, F.place, OND, {small: 1})}; }
      return null; }
    const ws = Math.min(T.one(word, F.word, (W - 2*pad)*(o.wordW || .8), 300, T.FE) || 0, o.wordMax || 999); if(!ws) return null;
    const g = r2(9*T.f*kk), st = street(T, ad, F.streetR, W - 2*pad, Math.max(T.FE, ws*.38), T.FE, true); if(!st) return null;
    const ps = r2(Math.max(T.FS, T.FS*1.1*kk)), pg = r2(Math.min(4*T.f, 6)), sh = capsH(st.ls.length, st.s, 1.12), pw = T.tw(place, F.place(ps)), sp = st.s*.6;
    const inl = st.ls.length === 1 && st.w + sp + pw <= W - 2*pad, h = bp + capH(ws) + g + sh + (inl ? 0 : pg + ps*1.3 - bp*.2) + bp, sy = bp + capH(ws) + g, x0 = (W - st.w - sp - pw)/2;
    return {h, ws, html: y => rect(0, y, W, h + 1, `background:${DARK}`) + capsAt('moment', [esc(word)], pad, y + bp, W - 2*pad, ws, .8, F.word, OND, {align: 'center'})
      + (inl ? capsAt('address', [span(ad)], x0, y + sy, st.w + 2, st.s, .8, F.streetR, ACC) + onBase('place', place, x0 + st.w + sp, y + sy + capH(st.s), pw + 2, ps, F.place, OND, {small: 1})
        : capsAt('address', st.ls.map(span), pad, y + sy, W - 2*pad, st.s, 1.12, F.streetR, ACC, {align: 'center'}) + txt('place', place, pad, y + sy + sh + pg, W - 2*pad, ps, 1.3, F.place, OND, {small: 1, align: 'center'}))};
  };

  // ---------- the agent on the paper ----------
  // 'row' (the postcards): the headshot, the name over REALTOR(R) and the phone, a vertical hairline, the logo.
  // 'stack' (a narrow column): the same lines with the logo centered under them.
  const agent = (D, T, w, k, mode, o) => { o = o || {};
    const A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), gap = Math.min(r2(9*T.f), 12), name = A.name || '', phone = A.phone || '';
    const NK = mode === 'row' && !hsOn ? 1.5 : 1;   // (no headshot in a row: the name stands larger, nearer the width of the line under it)
    const sizes = cw => { const ns = T.one(name, F.name, cw, Math.min(T.FB*1.75*k, o.nameMax || 999)*NK, T.FB*1.06); if(!ns) return null;
      const ps0 = r2(Math.max(T.FB, T.FB*1.12*k)), ds = r2(Math.max(T.FS, T.FS*Math.min(k, 1.25))), dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0; let ps = null, inl = true;
      for(let s = ps0; s >= T.FB - .01 && !ps; s -= .5) if(dW + (nar ? s*.7 : 0) + T.tw(phone, F.phone(s)) <= cw) ps = s;
      if(!ps){ inl = false; ps = T.one(phone, F.phone, cw, ps0, T.FB); if(!ps) return null; }
      const wide = Math.max(T.tw(name, F.name(ns)), inl ? dW + (nar ? ps*.7 : 0) + T.tw(phone, F.phone(ps)) : Math.max(dW, T.tw(phone, F.phone(ps))));
      return {ns, ps, ds, dW, inl, wide, th: ns*1.15 + 1.5*T.f + (inl || !nar ? 0 : ds*1.3 + T.f) + ps*1.3}; };
    const lines = (S, x, y, cw, a) => { let s = txt('agent.name', name, x, y, cw, S.ns, 1.15, F.name, INK, {align: a}), yy = y + S.ns*1.15 + 1.5*T.f;
      const pw = T.tw(phone, F.phone(S.ps));
      if(S.inl && nar){ const tot = S.dW + S.ps*.7 + pw, x0 = a === 'left' ? x : x + (cw - tot)/2;
        s += txt('agent.desig', 'REALTOR®', x0, yy + S.ps*1.3*.78 - S.ds*1.3*.78, S.dW + 2, S.ds, 1.3, F.tag, MAINP, {small: 1});
        s += txt('agent.phone', phone, x0 + S.dW + S.ps*.7, yy, pw + 2, S.ps, 1.3, F.phone, INK); }
      else { if(nar){ s += txt('agent.desig', 'REALTOR®', x, yy, cw, S.ds, 1.3, F.tag, MAINP, {small: 1, align: a}); yy += S.ds*1.3 + T.f; }
        s += txt('agent.phone', phone, x, yy, cw, S.ps, 1.3, F.phone, INK, {align: a}); }
      return s; };
    const logo = (x, y, lw, lh) => `<div class="abs lbs-logo" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${INK}">${OHL.logo(D, 'light', '')}</div>`;
    const hs = (x, y, hw, hh) => `<div class="abs lbs-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    for(const h0 of (hsOn ? (o.loose ? [1, 0] : [1]) : [0])){
      const p0 = sizes(w*(mode === 'row' ? .6 : 1)); if(!p0) return null;
      const hsW = h0 ? Math.round(p0.th*.82) : 0, tx = h0 ? hsW + gap : 0;
      if(mode === 'row'){
        // (the headshot is as tall as the lines: with REALTOR(R) beside the phone it is narrower, which may be what lets them share a line)
        const lmin = Math.max(o.logoMin || 0, 56*T.f, w*.27), hsI = h0 ? Math.round((p0.ns*1.15 + 1.5*T.f + p0.ps*1.3)*.82) : 0, SI = h0 ? sizes(w - hsI - gap - gap*2.4 - lmin) : null;
        const S = SI && SI.inl ? SI : sizes(w - tx - gap*2.4 - lmin); if(!S) continue;
        if(S === SI) return ((hsW, tx) => { const lw = Math.min(w - tx - S.wide - gap*2.4, S.th*4.6), lx = w - lw, vx = (tx + S.wide + lx)/2;
          return {h: S.th, mode, html: (x, y) => hs(x, y, hsW, S.th) + lines(S, x + tx, y, S.wide + 2, 'left') + rect(x + vx, y + 2, .9, S.th - 4, `background:${RULE}`) + logo(x + lx, y + S.th*.03, lw, S.th*.94)}; })(Math.round(S.th*.82), Math.round(S.th*.82) + gap);
        const lw = Math.min(w - tx - S.wide - gap*2.4, S.th*(h0 ? 4.6 : 9)), lx = w - lw, vx = (tx + S.wide + lx)/2;
        return {h: S.th, mode, html: (x, y) => (h0 ? hs(x, y, hsW, S.th) : '') + lines(S, x + tx, y, S.wide + 2, 'left') + rect(x + vx, y + 2, .9, S.th - 4, `background:${RULE}`) + logo(x + lx, y + S.th*.03, lw, S.th*.94)};
      }
      if(!(o.tallHs && h0)){   // stack: the headshot as tall as the lines at their left, the logo centered under the lines
        const S = sizes(w - tx); if(!S) continue;
        const lh0 = r2(Math.max(S.ns*1.4, T.FB*1.9)*(o.logoK || 1)), lw = Math.min(w, lh0*4.2), lh = Math.min(lh0, r2(lw/3.5)), tWd = S.wide + 2, lg = Math.min(7*T.f, o.lg || 99), full = S.th + lg + lh; if(o.logoMin && lw < o.logoMin - 1) continue;
        return {h: full, mode, html: (x, y) => { const c = Math.max(x + w/2, x + tx + S.wide/2), lw2 = Math.min(lw, 2*(x + w - c));
          return (h0 ? hs(c - S.wide/2 - tx, y, hsW, S.th) + lines(S, c - S.wide/2, y, tWd, 'left') : lines(S, x, y, w, 'center')) + logo(c - lw2/2, y + S.th + lg, lw2, lh); }};
      }
      // o.tallHs (X's wide image): the photo stands the full height at the left, the lines and the logo centered on each other beside it
      const lh = r2(Math.max(p0.ns*1.55, T.FB*2.1)*(o.logoK || 1)), lg = Math.min(7*T.f, o.lg || 99), hsS = h0 ? Math.round((p0.th + lg + Math.min(lh, w*.5/3.5))*.52) : 0, cw = w - (h0 ? hsS + gap : 0), S = sizes(cw); if(!S) continue;
      const lw = Math.min(cw, lh*4.2); if(o.logoMin && lw < o.logoMin - 1) continue;
      const lhE = Math.min(lh, r2(lw/3.5)), full = S.th + lg + lhE, colW = Math.max(S.wide + 2, lw), gW = (h0 ? hsS + gap : 0) + colW;
      return {h: full, mode, html: (x, y) => { const x0 = x + (w - gW)/2, cx = x0 + (h0 ? hsS + gap : 0);
        return (h0 ? hs(x0, y, hsS, full) : '') + lines(S, cx, y, colW, 'center') + logo(cx + (colW - lw)/2, y + S.th + lg, lw, lhE); }};
    }
    return null;
  };

  // ---------- Just Listed: highlights on main-color squares, and the writer's lines ----------
  const sq = (T, x, y, s) => rect(x, y, s, s, `background:${MAINP}`);
  // one to a line down a column (the postcard front)
  const bulCol = (T, items, w, k) => { if(!items.length) return null; const s0 = r2(5.5*T.f), ind = s0 + r2(8*T.f);
    const fs = Math.min(...items.map(t => T.one(t, F.bul, w - ind - 2, items.length <= 2 ? T.FB*1.5 : Math.min(T.FB*1.15*k, T.FB*1.3), T.FB) || 0)); if(!fs) return null; const rh = fs*1.75;
    return {fs, rh, n: items.length, html: (x, y, rr) => items.map((t, i) => sq(T, x, y + i*rr + (rr - s0)/2, s0) + txt('hl.' + i, t, x + ind, y + i*rr + (rr - fs*1.3)/2, w - ind, fs, 1.3, F.bul, INK)).join('')}; };
  // side by side across the width, spread to its two ends
  const bulRow = (T, items, w, k) => { const s0 = r2(5.5*T.f), ind = s0 + r2(7*T.f);
    for(let n = Math.min(items.length, 3); n >= 2; n--) for(let fs = r2(Math.max(T.FB, T.FB*1.1*k)); fs >= T.FB - .01; fs -= .5){ const ws = items.slice(0, n).map(t => ind + T.tw(t, F.bul(fs)) + 2), tot = ws.reduce((a, b) => a + b, 0);
      if(tot + (n - 1)*14*T.f > w) continue; const sp = (w - tot)/(n - 1);
      return {h: fs*1.3, html: (x, y) => { let xx = x, s = ''; ws.forEach((wd, i) => { s += sq(T, xx, y + (fs*1.3 - s0)/2, s0) + txt('hl.' + i, items[i], xx + ind, y, wd - ind, fs, 1.3, F.bul, INK); xx += wd + sp; }); return s; }}; }
    return null; };
  // The writer's sentences in order (the first always kept), as many as fill maxN lines or fewer at width w: every line 80%+ and the
  // last 90%+ of the measure (owner 11/8), the measure narrowed a little or the type raised up to 12% to get there. A pick that names
  // a nearby place with its distance is preferred.
  const writeUp = (T, D, w, s0, maxN) => { T.wu = T.wu || {}; const key = [Math.round(w), s0, maxN].join('|'); if(key in T.wu) return T.wu[key];
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing)).slice(0, 7), near = /\bmiles?\b/i; let best = null;
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of [1, .97, .94, .91, .88, .85, .82]) for(const s of [s0, r2(s0*1.04), r2(s0*1.08), r2(s0*1.12)]){ const r = T.rows(t, F.body(s), w*m, s*1.42); if(r.n > maxN || r.n < 2) continue;
        if(r.last < .9*w*m || r.ws.slice(0, -1).some(x => x < .8*w*m)) continue;
        const sc = r.n*100 + (near.test(t) ? 80 : 0) + m*20 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc, just: false}; } }
    if(best){ best.h = best.n*best.s*1.42 + best.s*.15;
      best.html = (x, y, W0) => txt('writeup', best.t, x + (W0 - best.w)/2, y, best.w, best.s, 1.42, F.body, TEXT, {n: best.n, css: best.just ? 'text-align:justify;text-align-last:left' : ''}); }
    return (T.wu[key] = best); };

  // ---------- Just Sold: the stacked question, the note in the white box ----------
  const QS = {3: ['Thinking', 'about', 'selling?'], 2: ['Thinking about', 'selling?'], 1: ['Thinking about selling?']};
  const question = (T, w, n, max) => { const ls = QS[n], s = Math.min(...ls.map(t => T.one(t, F.word, w - 1, max, T.FB) || 0)); if(!s) return null;
    return {s, n, h: capsH(n, s, 1.06), ww: Math.max(...ls.map(t => T.tw(t, F.word(s)))), html: (x, y, a) => capsAt('sold.q', ls.map((t, i) => i === n - 1 && n > 1 ? `<span style="color:${MAINP}">${esc(t)}</span>` : n === 1 ? esc(t).replace(/(selling\?)/i, `<span style="color:${MAINP}">$1</span>`) : esc(t)), x, y, w, s, 1.06, F.word, INK, {align: a || 'left'})}; };
  // the seller notes the writer wrote for the Just Sold postcard, fullest first (o.more: the next sentence joined on, where a
  // tall image has the room)
  const noteList = (D, more) => { const F0 = ((((D.sw || {}).pc || {}).js || {}).front || {}), S = (((F0.note || {}).s) || []).map(x => [].concat(x).map(String));
    const byLen = a => a.slice().sort((p, q) => q.length - p.length), a0 = byLen(S[0] || []), a = a0.length > 1 ? a0.slice(0, -1) : a0, b = byLen(S[1] || []);   // (the bare "I just helped sell this ..." never stands alone: the note carries the ask)
    let list = a.slice(); if(more && a[0]) list = b.map(t => a[0] + ' ' + t).concat(list);
    return list.concat([].concat(F0.note2 || []).map(String), [SocialSet.SOLD_POST])   // (the last: the line the approved set's posts carried)
      .filter((t, i, arr) => t && arr.indexOf(t) === i && !SocialSet.CONDITION.test(t)); };
  // the fullest note that sets in maxN lines or fewer with every line 80%+ and the last 90%+ of its measure (owner 11/8); the
  // measure may narrow a little (centered in the box) or the type rise up to 15% to get there
  const pickNote = (T, D, iw, s0, maxN, more, real) => { T.pn = T.pn || {}; const key = [Math.round(iw*2), s0, maxN, more ? 1 : 0, real ? 1 : 0].join('|'); if(key in T.pn) return T.pn[key]; let res = null;
    const list = noteList(D, more).filter(t => !real || t !== SocialSet.SOLD_POST);
    for(let ti = 0; ti < list.length && !res; ti++){ const t = list[ti];
      for(let m = 1; m >= .795; m -= .01){ for(let s = s0; s <= s0*1.2 + .01 && !res; s += .5){ const w = iw*m, r = T.rows(t, F.note(s), w, s*1.42); if(r.n > maxN || (r.n === 1 && m < .9)) continue;
          if(r.n === 1 ? r.wide < .9*w : (r.last < (t === SocialSet.SOLD_POST ? .86 : .9)*w || r.ws.slice(0, -1).some(x => x < .8*w))) continue;   // (the approved posts' own two sentences break between them: its second line runs 88% of its first)
          res = {t, len: t.length, n: r.n, s, w, just: false}; } if(res) break; } }
    return (T.pn[key] = res); };
  const noteBox = (T, pk, w, k) => { const nb = Math.min(r2(10*T.f*Math.min(Math.max(k, .8), 1.15)), 15), lh = pk.s*1.42, h = pk.n*lh + pk.s*.15 + 2*nb;
    const bw = Math.min(w, pk.w + 2*NB(T, k)), bx = (w - bw)/2;   // the box closes on its text (centered in the room it was given)
    return {h, html: (x, y) => `<div class="lbs-box" style="left:${x + bx}pt;top:${y}pt;width:${bw}pt;height:${h}pt"></div>`
      + txt('sold.note', pk.t, x + (w - pk.w)/2, y + nb, pk.w, pk.s, 1.42, F.note, INK, {n: pk.n})}; };
  const NB = (T, k) => Math.min(r2(10*T.f*Math.min(Math.max(k, .8), 1.15)) + 3*T.f, 18);   // the box's inner margin, side to side

  const LB = {};
  // ================= post, pin, story =================
  // Just Listed: the house inset on the paper; under it the street in caps with the place at the end of its line, the rule, the
  // highlights, the writer's lines, a hairline and the agent; the band across the foot (the word across it, the icon cells under).
  // Just Sold: the band across the head; the house; the stacked question beside the note in its box; a hairline; the agent.
  // A story keeps its words out of the top and bottom: the house first, room photos across the foot.
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', story = shape === 'story', sq = shape === 'square';
    const m = r2(15*f), g = r2(9*f), w = W - 2*m, place = OHL.place(Li), gC = r2(13*f);
    const rowH = story ? Math.max(r2(104*f), 98 - m - g) : 0, BOT = story ? H - m - rowH - g : H, KMAX = {post: 1.5, pin: 1.6, story: 1.6}[shape] || 1.5, KMIN = .6;
    const agentAt = k0 => { const k = Math.min(k0, 1.15); return agent(D, T, w, k, 'row') || agent(D, T, w, k, 'stack') || (k0 <= KMIN + .01 ? agent(D, T, w, k, 'stack', {loose: 1}) : null); };   // (the agent's lines stop growing where the word and the house should)
    const build = (k, o) => {
      if(!sold){
        const band = sq ? bandJL(T, D, W, k, 'row', m, H*.032, 4, true) : bandJL(T, D, W, k, 'stack', m); if(!band) return null;
        const ps = r2(Math.max(FS, FS*1.12*k)), pw0 = T.tw(place, F.place(ps)); let st = street(T, Li.address, F.word, w - pw0 - 14*f, Math.min(FE*1.5*k, band.ws*.8), FE), inl = !!st;
        if(!st){ st = street(T, Li.address, F.word, w, FE*1.5*k, FE, true); if(!st) return null; }
        const adH = inl ? capH(st.s) : capsH(st.ls.length, st.s, 1.1) + 4*f + ps*1.3, addrH = adH + 6.5*f + 1.4;
        const bl = o.bul ? bulRow(T, bulItems(D, band.icons), w, k) : null; if(o.bul && !bl) return null;
        const wu = o.wl ? writeUp(T, D, w, r2(Math.max(FB, FB*1.05*k)), o.wl) : null; if(o.wl && (!wu || wu.n < Math.min(o.wl, 2))) return null;
        const ag = agentAt(k); if(!ag) return null;
        const gB = Math.max(g*1.25, band.up), under = g*1.2 + addrH + (bl ? g + bl.h : 0) + (wu ? g*.9 + wu.h : 0) + g + .9 + g*.85 + ag.h + gB;
        return {band, st, ps, pw0, inl, adH, bl, wu, ag, under, gB, room: BOT - m - under - band.h};
      }
      const band = (sq && bandJS(T, Li, W, k, 'row', m, {bpMax: H*.034})) || bandJS(T, Li, W, k, 'stack', m, {wordW: Math.min(.86, .56 + .3*k)}); if(!band) return null;
      const ag = agentAt(k); if(!ag) return null;
      const ns0 = r2(Math.max(FB, FB*1.02*k)); let blk = null;
      if(o.v === 'A'){   // the question stacked at the left, the note's box beside it, as tall as each other as the widths allow
        for(let fr = .36; fr <= .581; fr += .02){ const qw = r2(w*fr), bw = w - qw - gC, Q = question(T, qw, 3, Math.min(FE*3.2*k, band.ws*.8)), pk = Q && pickNote(T, D, bw - 2*NB(T, k), ns0, 9, 0, o.real); if(!pk) continue;
          const nbx = noteBox(T, pk, bw, k), c = {Q, nbx, qw, bw, len: pk.len, h: Math.max(Q.h, nbx.h), d: Math.abs(Q.h - nbx.h)};
          if(!blk || c.len > blk.len || (c.len === blk.len && c.d < blk.d)) blk = c; }
      } else {   // the question across the width (two lines, or one), the note's box under it
        const Q = question(T, w, o.q || 2, Math.min(FE*3.6*k, band.ws*.8)), pk = Q && (o.nl ? pickNote(T, D, w - 2*NB(T, k), ns0, o.nl, o.more, o.real) : null); if(!Q || (o.nl && !pk)) return null;
        const nbx = pk ? noteBox(T, pk, w, k) : null; blk = {Q, nbx, len: pk ? pk.len : 0, h: Q.h + (nbx ? g*1.1 + nbx.h : 0)};
      }
      if(!blk) return null;
      const below = g*1.3 + blk.h + g*1.1 + .9 + g*.85 + ag.h + (story ? 0 : m*.95);
      return {band, ag, blk, below, room: BOT - (story ? m : 0) - band.h - m*.9 - below};
    };
    const must = sq ? (sold ? [{v: 'B', q: 1, nl: 2, real: 1}, {v: 'B', q: 1, nl: 3, real: 1}, {v: 'A', real: 1}, {v: 'B', q: 1, nl: 2}, {v: 'A'}, {v: 'B', q: 1, nl: 1}] : [{bul: 1}, {}]) : sold ? (story ? [{v: 'B', nl: 4, more: 1, real: 1}, {v: 'B', nl: 3, real: 1}, {v: 'B', nl: 2, real: 1}, {v: 'B', nl: 2}] : [{v: 'A', real: 1}, {v: 'B', nl: 3, real: 1}, {v: 'B', nl: 2, real: 1}, {v: 'B', q: 1, nl: 2, real: 1}, {v: 'A'}, {v: 'B', q: 1, nl: 2}, {v: 'B', q: 1, nl: 1}])
      : [{wl: 3, bul: 1}, {wl: 3}, {wl: 2, bul: 1}, {wl: 2}], rest = sold ? [{v: 'A'}, {v: 'B', q: 1, nl: 1}, {v: 'B', q: 1, nl: 0}] : [{bul: 1}, {}];
    // a house too tall for the room at full width stands narrower with a room photo beside it (never paper)
    let pick = null; const sg = g*.8;
    for(const opts of [must, rest]) for(const hk of (sq ? [1, .72] : [1, .72, .64])) for(const k0 of [.9, .75, KMIN]){ if(pick) break; const pw = hk === 1 ? w : Math.round(w*hk);
      for(const o of opts){
        const b1 = build(k0, o); if(!b1 || b1.room < X.min(pw)) continue;
        const need = Math.min(b1.room, X.min(pw) + (story ? .85 : .7)*(X.nat(pw) - X.min(pw)));
        let k = k0; for(let t = KMAX; t >= k0; t -= .025){ const b = build(t, o); if(b && b.room >= need){ k = t; break; } }
        pick = {o, k, pw}; break;
      }
    }
    pick = pick || {o: sold ? {v: 'B', q: 1, nl: 0} : {}, k: KMIN, pw: w};
    const {o, k, pw} = pick, heroAt = (y, ht) => X.hero(m, y, pw, ht) + (pw < w ? X.row(m + pw + sg, y, w - pw - sg, ht, 1, 0) : ''), B = build(k, o) || build(KMIN, o);
    const ph = Math.max(X.min(pw), Math.min(X.max(pw), B.room)), spare = Math.max(0, B.room - ph);
    const r2H = !story && spare >= 64*f ? spare - g*.8 : 0, e = r2H ? 0 : spare/5;
    let h = CSS, y;
    if(!sold){
      y = m; h += heroAt(y, ph); y += ph;
      if(r2H){ h += X.row(m, y + g*.8, w, r2H, 2, g*.8); y += r2H + g*.8; }
      y += g*1.2 + e;
      if(B.inl){ h += capsAt('address', [span(B.st.ls[0])], m, y, B.st.w + 3, B.st.s, 1.1, F.word, INK) + onBase('place', place, m + B.st.w + r2(11*f), y + capH(B.st.s), B.pw0 + 2, B.ps, F.place, INK, {small: 1}); }
      else { h += capsAt('address', B.st.ls.map(span), m, y, w, B.st.s, 1.1, F.word, INK) + txt('place', place, m, y + capsH(B.st.ls.length, B.st.s, 1.1) + 4*f, w, B.ps, 1.3, F.place, INK, {small: 1}); }
      y += B.adH + 6.5*f; h += rect(m, y, w, 1.4, `background:${MAINP}`); y += 1.4;
      if(B.bl){ y += g + e*.5; h += B.bl.html(m, y); y += B.bl.h; }
      if(B.wu){ y += g*.9 + e*.5; h += B.wu.html(m, y, w); y += B.wu.h; }
      y += g + e; h += rect(m, y, w, .9, `background:${RULE}`); y += .9 + g*.85 + e;
      h += B.ag.html(m, y); y += B.ag.h + B.gB + e*(B.bl && B.wu ? 1 : B.bl || B.wu ? 1.5 : 2);
      h += B.band.html(y); y += B.band.h;
      if(story) h += X.row(m, y + g, w, H - m - y - g, 3, g*.8);
    } else {
      if(story){ y = m; h += heroAt(y, ph); y += ph + m*.9; h += B.band.html(y); y += B.band.h; }
      else { h += B.band.html(0); y = B.band.h + m*.9; h += heroAt(y, ph); y += ph; if(r2H){ h += X.row(m, y + g*.8, w, r2H, 2, g*.8); y += r2H + g*.8; } }
      y += g*1.3 + e*1.5; const K0 = B.blk;
      if(K0.qw){ h += K0.Q.html(m, y + (K0.h - K0.Q.h)/2) + K0.nbx.html(m + K0.qw + gC, y + (K0.h - K0.nbx.h)/2); }
      else { h += K0.Q.html(m, y, 'center'); if(K0.nbx) h += K0.nbx.html(m, y + K0.Q.h + g*1.1); }
      y += K0.h + g*1.1 + e*1.5; h += rect(m, y, w, .9, `background:${RULE}`); y += .9 + g*.85 + e;
      h += B.ag.html(m, y); y += B.ag.h;
      if(story) h += X.row(m, y + g + e, w, H - m - y - g - e, 3, g*.8);
    }
    T.done();
    return h;
  };

  // ================= square, wide (X), Google Business Profile: the postcard fronts =================
  // Just Listed: the house at the left inside the margin; beside it the street, the place, the rule, the highlights, a hairline and
  // the agent; the band across the foot (the word, the icon cells). Just Sold: the band across the head; the house at the left;
  // beside it the stacked question, the note in its box, a hairline and the agent.
  const card = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', place = OHL.place(Li);
    const m = r2(Math.min(15*f, H*.04)), g = r2(Math.min(9*f, H*.026)), gC = r2(Math.min(16*f, W*.035)), BP = H*(shape === 'wide' ? .024 : .04), u = Math.min(f, 1.3), PL = shape === 'wide' ? 1.18 : 1.3, KS = [1.7, 1.5, 1.35, 1.2, 1.1, 1, .9, .8, .7, .6];
    const LOGO = {wide: 178, gbp: 110}[shape] || 0;   // the logo never smaller than the approved set showed it on these two shapes
    const agentIn = (cw, k, nm) => { const a = agent(D, T, cw, k, 'row', {logoMin: LOGO, loose: LOOSE, nameMax: nm}); if(a) return a;
      for(const lk of [1, 1.2, 1.45, 1.7]){ const st = agent(D, T, cw, k, 'stack', {logoK: lk, logoMin: LOGO, lg: (LOGO ? 5 : 7)*u, loose: LOOSE, nameMax: nm}); if(st) return st; }
      return null; };
    // (the stacked logo's box width at this size, as agent() sets it)
    const stackLogoW = (cw, k, lk) => { const ns = T.one((D.agent || {}).name || '', F.name, cw, FB*1.75*k, FB*1.06) || FB*1.06; return Math.min(cw, r2(Math.max(ns*1.4, FB*1.9)*lk)*4.2); };
    const okRest = (r, pw) => r <= 3 || r >= Math.max(46*f, pw/4.6);
    // the house in a column pw wide and room tall: what it cannot take (taller would cut it) goes to room photos under it
    const heroCol = (x, y, pw, room) => { const ph = Math.max(X.min(pw), Math.min(room, X.maxH(pw))), r = room - ph;
      return r >= Math.max(46*f, pw/4.6) ? X.hero(x, y, pw, ph) + X.row(x, y + ph + g*.8, pw, r - g*.8, 2, g*.8) : X.hero(x, y, pw, ph); };
    const leftCol = (x, y, pw, room) => { const ph = Math.max(X.min(pw), Math.min(room, X.max(pw))), r = room - ph;
      return r >= Math.max(46*f, pw/4.6) ? X.hero(x, y, pw, ph) + X.row(x, y + ph + g*.8, pw, r - g*.8, r - g*.8 >= pw/2.3 ? 1 : 2, g*.8) : X.hero(x, y, pw, ph); };
    let h = CSS, pick = null, LOOSE = 0; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
    if(!sold){
      // X's wide image and Google's (the sizes at or near their floors): the band as on the postcard with four icon cells set close. On the paper the street
      // with the place beside it on its line and the rule under them (as on the tall shapes); under the rule the house, a room photo
      // where the house leaves width, and the agent with the logo under the lines
      const CL = cellsOf(D).slice(0, 4), word = SocialSet.M, bp = r2(BP), HL = 'background:rgba(255,255,255,.35)', w = W - 2*m;
      let C = cellKit(T, CL, .6, false, true); if(C.cw*CL.length > W*.5) C = cellKit(T, CL, .6, true, true);
      const cellsW = C.cw*CL.length, gapB = r2(12*u), lw = w - cellsW - gapB;
      const ws = Math.max(Math.min(T.one(word, F.word, lw, 300, FE) || FE, r2(C.h*1.06/MC().cap)), FE), inner = Math.max(capH(ws), C.h), bh = inner + 2*bp, BT = H - bh, x0 = W - m - cellsW;
      const ps = r2(FS*1.1), pw0 = T.tw(place, F.place(ps)), st = street(T, Li.address, F.word, w - pw0 - 14*u, Math.min(FE*1.5, ws*.8), FE) || street(T, Li.address, F.word, w, FE, FE, true) || {ls: [Li.address], s: FE, w};
      const inl = st.ls.length === 1 && st.w + 14*u + pw0 <= w, headH = (inl ? capH(st.s) : capsH(st.ls.length, st.s, 1.1) + 3*u + ps*PL) + 5*u + 1.4 + g;
      const y0 = m + headH, hRow = BT - m*.9 - y0, natW = Math.round(hRow*X.pAR); let maxW = natW; while(maxW + 6 < w*.72 && X.min(maxW + 6) <= hRow) maxW += 6;
      const hl = [];   // (no highlights here: on every house the room the agent leaves in the column goes to a room photo)
      const PMIN = Math.ceil(W*.455), CAS = shape === 'wide' ? [186, 198, 210, 222, 236, 250, 264, 278, 292] : [116, 126, 136, 148, 160, 172, 184, 196];   // the house keeps 45% of the width or more
      for(LOOSE = 0; LOOSE < 2 && !pick; LOOSE++) for(const cA0 of CAS){ const R = w - cA0 - gC; let pw, rw = 0, cA = cA0;
        if(R <= maxW){ pw = R; if(X.min(pw) > hRow) continue; } else if(R - Math.max(natW, PMIN) - gC >= 100*Math.min(f, 1.4)/1.4 && Math.max(natW, PMIN) <= maxW){ pw = Math.max(natW, PMIN); rw = R - pw - gC; } else { pw = maxW; cA = w - maxW - gC; }
        if(pw < PMIN) continue; const short = Math.max(0, hRow - X.maxH(pw));   // (a house that cannot stand the row's height takes room photos under it)
        for(const k of KS){ let hit = false;
          for(const lk of [1.8, 1.6, 1.4, 1.2, 1]){ const ag = agent(D, T, cA, k, 'stack', {logoK: lk, logoMin: LOGO, lg: 5*u, loose: LOOSE, nameMax: ws*.85, tallHs: 1}); if(!ag || ag.h > hRow) continue;
            const fitB = t => T.tw(t, F.bul(FB)) <= cA - r2(5.5*f) - r2(8*f) - 3, items = hl.filter(fitB).slice(0, 3); let BL = null, nb = 0;
            for(let n = items.length; n >= 2 && !BL; n--){ const b = bulCol(T, items.slice(0, n), cA, Math.min(k, 1)); if(b && ag.h + n*b.rh + g + .9 + g*.9 <= hRow){ BL = b; nb = n; } }
            const left0 = hRow - ag.h - (BL ? nb*BL.rh + g + .9 + g*.9 : 0), cp = !BL && left0 - g >= cA/3.3 ? left0 - g : 0, left = cp ? 0 : left0;   // (room the agent leaves in the column: a room photo over the agent)
            take({pw, rw, cA, ag, BL, nb, cp, sc: k*25 + lk*20 + nb*14 - left*2.5 - cA*.4 + (rw ? 0 : pw*.2) - (short > 3 && !okRest(short, pw) ? short*5 : 0)}); hit = true; break; }
          if(hit) break; } }
      if(!pick){ const cA = 210; pick = {pw: w - cA - gC, rw: 0, cA, ag: agent(D, T, cA, .6, 'stack', {loose: 1}) || {h: 0, html: () => ''}}; }
      const {pw, rw, cA, ag, BL, nb, cp} = pick; let y = m;
      if(inl) h += capsAt('address', [span(st.ls[0])], m, y, st.w + 3, st.s, 1.1, F.word, INK) + onBase('place', place, m + st.w + r2(11*f), y + capH(st.s), pw0 + 2, ps, F.place, INK, {small: 1});
      else h += capsAt('address', st.ls.map(span), m, y, w, st.s, 1.1, F.word, INK) + txt('place', place, m, y + capsH(st.ls.length, st.s, 1.1) + 3*u, w, ps, PL, F.place, INK, {small: 1});
      h += rect(m, y0 - g - 1.4, w, 1.4, `background:${MAINP}`);
      h += heroCol(m, y0, pw, hRow) + (rw ? X.row(m + pw + gC*.6, y0, rw + gC*.4, hRow, 1, 0) : '');
      if(BL){ const ax = W - m - cA, ay = y0 + hRow - ag.h, hy = ay - g*.9 - .9, R = hy - y0, rr = Math.min(R/nb, BL.rh*1.5); h += BL.html(ax, y0 + (R - nb*rr)/2, rr) + rect(ax, hy, cA, .9, `background:${RULE}`) + ag.html(ax, ay); }
      else if(cp) h += X.row(W - m - cA, y0, cA, cp, 1, 0, rw ? 1 : 0) + ag.html(W - m - cA, y0 + hRow - ag.h);
      else h += ag.html(W - m - cA, y0 + (hRow - ag.h)/2);
      h += rect(0, BT, W, bh + 1, `background:${DARK}`) + capsAt('moment', [esc(word)], m, BT + bp + (inner - capH(ws))/2, lw, ws, .8, F.word, OND)
        + C.html(x0, BT + bp + (inner - C.h)/2, C.cw) + CL.map((_, i) => rect(x0 + i*C.cw - .5, BT + bp*.8, 1, bh - bp*1.6, HL)).join('');
      pick.band = {h: bh, ws};
    } else {
      const bandsS = (shape !== 'square' ? [bandJS(T, Li, W, 1, 'row', m, {bpMax: BP}), bandJS(T, Li, W, .8, 'row', m, {bpMax: BP})].filter(Boolean).slice(0, 1) : []).concat([.8, .68, .56].map(ww => bandJS(T, Li, W, 1, 'stack', m, {wordW: ww, bpMax: BP}))).filter(b => b && b.h <= H*.36).slice(0, shape === 'square' ? 3 : 1);
      const noteSc = pk => Math.min(pk.len, 150)*5;
      for(const FMIN of [.455 + m/W, .34]) for(LOOSE = 0; LOOSE < 2 && !pick; LOOSE++) bandsS.forEach((band, bi) => { const top = band.h, y0 = top + m*.9, avail = H - m - y0;
        for(let fr = .6; fr >= FMIN; fr -= .01){ const pw = Math.round(W*fr) - m, cx = m + pw + gC, cw = W - m - cx; if(cw < 70*f || avail < X.min(pw)) continue;
          const ph = Math.min(avail, X.max(pw)), rest = avail - ph, pSc = pw*ph/(W*H)*2400 - (okRest(rest, pw) ? 0 : rest*5);
          for(const k of KS){ const ns0 = r2(Math.max(FB, FB*1.02*k)), nb = NB(T, k);
            // 'foot': the agent on one row across the foot, the logo at its end; over it the house, and the question and the note beside it
            { const agF = agent(D, T, W - 2*m, k, 'row', {logoMin: LOGO, loose: LOOSE, nameMax: band.ws*.62}), mid = agF ? avail - agF.h - g*.9 - .9 - g*1.1 : 0;
              if(agF && mid >= X.min(pw)){ const phF = Math.min(mid, X.max(pw)), restF = mid - phF;
                for(const qn of [3, 2, 1]){ const Q = question(T, cw, qn, Math.min(FE*3.2*k, band.ws*.8)); if(!Q) continue; const room = mid - Q.h - g*1.2, maxN = Math.floor((room - 2*(nb - 3*f) - ns0*.2)/(ns0*1.42)), pk = maxN >= 1 ? pickNote(T, D, cw - 2*nb, ns0, Math.min(maxN, 9)) : null; if(!pk) continue;
                  const nbx = noteBox(T, pk, cw, k), left = room - nbx.h; if(left < 0) continue;
                  take({v: 'foot', band, y0, avail, pw, cx, cw, Q, nbx, ag: agF, left, mid, sc: noteSc(pk) + k*25 + pw*phF/(W*H)*2400 - (okRest(restF, pw) ? 0 : restF*5) + Q.s*1.2 + band.ws*.5 - left*3 - 15 - bi*2}); } } }
            const ag = agentIn(cw, k, band.ws*.62); if(!ag) continue; const foot = g*1.1 + .9 + g*.9 + ag.h;
            for(const qn of [3, 2]){ const Q = question(T, cw, qn, Math.min(FE*3.2*k, band.ws*.8)); if(!Q) continue;
              // 'beside' (the postcard): the question, the note's box, a hairline, the agent down the column
              { const room = avail - Q.h - g*1.2 - foot, maxN = Math.floor((room - 2*(nb - 3*f) - ns0*.2)/(ns0*1.42)), pk = maxN >= 1 ? pickNote(T, D, cw - 2*nb, ns0, Math.min(maxN, 9)) : null;
                if(pk){ const nbx = noteBox(T, pk, cw, k), left = room - nbx.h; if(left >= 0) take({v: 'beside', band, y0, avail, pw, cx, cw, Q, nbx, ag, left, sc: noteSc(pk) + k*25 + pSc + Q.s*1.2 + band.ws*.5 - left*3 - bi*2}); } }
              // 'base': the note's box across the foot, full width; over it the house, and the question and the agent beside it
              { const pk = pickNote(T, D, W - 2*m - 2*nb, ns0, 3); if(!pk) continue; const nbx = noteBox(T, pk, W - 2*m, k), mid = avail - nbx.h - g*1.1; if(mid < X.min(pw)) continue;
                const phB = Math.min(mid, X.max(pw)), restB = mid - phB, left = mid - Q.h - foot; if(left < 0) continue;
                take({v: 'base', band, y0, avail, pw, cx, cw, Q, nbx, ag, left, mid, sc: noteSc(pk) + k*25 + pw*phB/(W*H)*2400 - (okRest(restB, pw) ? 0 : restB*5) + Q.s*1.2 + band.ws*.5 - left*3 + (shape === 'wide' ? -40 : 400) - bi*2}); } } } } });   // (square and Google: one family on every house)
      if(!pick){ const band = bandsS[bandsS.length - 1] || bandJS(T, Li, W, .6, 'stack', m, {wordW: .5}), y0 = band.h + m*.9, avail = H - m - y0, pw = Math.round(W*.5) - m, cx = m + pw + gC, cw = W - m - cx;
        pick = {v: 'beside', band, y0, avail, pw, cx, cw, Q: question(T, cw, 3, FE) || question(T, cw, 1, FE) || {h: 0, html: () => ''}, nbx: null, ag: agent(D, T, cw, .6, 'stack') || {h: 0, html: () => ''}, left: 0}; }
      const {band, y0, avail, pw, cx, cw, Q, nbx, ag, left} = pick;
      h += band.html(0);
      if(pick.v === 'foot'){ const mid = pick.mid, yq = y0 + left*.3;
        h += leftCol(m, y0, pw, mid) + Q.html(cx, yq) + nbx.html(cx, yq + Q.h + g*1.2 + left*.3) + rect(m, y0 + mid + g*1.1, W - 2*m, .9, `background:${RULE}`) + ag.html(m, H - m - ag.h); }
      else if(pick.v === 'base'){ const mid = pick.mid;
        h += leftCol(m, y0, pw, mid) + Q.html(cx, y0 + left*.3) + rect(cx, y0 + mid - ag.h - g*.9 - .9, cw, .9, `background:${RULE}`) + ag.html(cx, y0 + mid - ag.h) + nbx.html(m, H - m - nbx.h); }
      else { h += leftCol(m, y0, pw, avail); let y = y0;
        h += Q.html(cx, y); y += Q.h + g*1.2 + left*.45;
        if(nbx){ h += nbx.html(cx, y); y += nbx.h; }
        const ay = y0 + avail - ag.h; h += rect(cx, ay - g*.9 - .9, cw, .9, `background:${RULE}`) + ag.html(cx, ay); }
    }
    T.done();
    return h;
  };
  LB.portrait = tall;
  LB.landscape = card;

  // ================= carousel photo slides: the room inset on the paper, the band as on the post =================
  // Just Listed: the band across the foot with the word and the icon cells, the street in caps over it. Just Sold: the band across
  // the head (the word, the street), the seller question in caps across the foot.
  LB.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), {f, FE, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', m = r2(15*f), g = r2(9*f), w = W - 2*m, place = OHL.place(Li);
    let h = CSS;
    if(!sold){
      const band = bandJL(T, D, W, 1, 'stack', m), ps = r2(FS*1.12), pw0 = T.tw(place, F.place(ps));
      let st = street(T, Li.address, F.word, w - pw0 - 14*f, FE*1.5, FE), inl = !!st; if(!st) st = street(T, Li.address, F.word, w, FE*1.5, FE, true) || {ls: [Li.address], s: FE, w};
      const adH = inl ? capH(st.s) : capsH(st.ls.length, st.s, 1.1) + 4*f + ps*1.3, BT = H - band.h, ay = BT - g*1.3 - adH, py = ay - g*1.2;
      h += X.photo(D.piece.photo, m, m, w, py - m);
      h += inl ? capsAt('address', [span(st.ls[0])], m, ay, st.w + 3, st.s, 1.1, F.word, INK) + onBase('place', place, m + st.w + r2(11*f), ay + capH(st.s), pw0 + 2, ps, F.place, INK, {small: 1})
        : capsAt('address', st.ls.map(span), m, ay, w, st.s, 1.1, F.word, INK) + txt('place', place, m, ay + capsH(st.ls.length, st.s, 1.1) + 4*f, w, ps, 1.3, F.place, INK, {small: 1});
      h += band.html(BT);
    } else {
      const band = bandJS(T, Li, W, 1, 'stack', m, {wordW: .8}), Q = question(T, w, 1, FE*3), py = band.h + m*.9, qy = H - m - Q.h;
      h += band.html(0) + X.photo(D.piece.photo, m, py, w, qy - g*1.4 - py) + Q.html(m, qy, 'center');
    }
    T.done();
    return h;
  };
  window.LBSocial = LB;
})();
