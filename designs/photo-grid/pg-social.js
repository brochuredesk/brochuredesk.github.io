/* templates/photo-grid/pg-social.js: Photo Grid's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on
   piece matches its set's main pieces). Plugs into templates/_shared/socialset.js (data, the checks) and replaces its three layouts
   for this set only; nothing shared changes.

   Read off the approved Photo Grid pieces (postcard.html, flyer.html, pg-tokens.css, pg-marks.css, pg-fo.js):
     - the paper as the page; a locked grid of tiles set in from the trim with even gutters; every photo a tile
     - the main-color tile: JUST / LISTED stacked tight in IBM Plex Sans Condensed 700 caps, the short bar, then the facts as ruled
       rows (the numeral in the accent at the left, the label in tracked caps at the right). No neighborhood line: the shared engine
       keeps the neighborhood off every social.
     - the dark tile: the street in Plex Condensed caps, the place in the accent's tracked caps, the listing's own highlights with
       accent-square bullets
     - the pale tint tile for who to call: the headshot as a photo tile flush in its end, the name, REALTOR(R), the phone in the
       main ink, the brokerage logo
     - Just Sold: JUST SOLD giant on one line across a full-width main-color tile with the street in the accent under it; the house;
       the white cell with the thin main-color line ("Thinking about selling?" over the agent's note, its first sentence bold)
     - the flyer's white cell (a tracked-caps label over the write-up) where a tall shape has the room
   Rules carried: no price, no broker address, no beds / baths / square feet on Just Sold, the whole house in every frame (the
   engine's house-cut check), text at the phone floors of templates/_shared/readsize.js, stories keep text out of the top and
   bottom 250 px. Colors are the agent's brand kit (set in social.html as PG.brand in pg.js sets them). */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const CD = "'Plex Condensed'", MN = "'Manrope'";
  const ONM = 'var(--pg-on-main)', OND = 'var(--pg-on-dark)', ACM = 'var(--pg-acc-main)', ACD = 'var(--pg-acc-dark)', MINK = 'var(--pg-main-ink)', INK = '#161616', TXT = '#222222';
  // Plex Condensed 700 caps in a line box as tall as the type: the capitals run from .177 to .875 of it (pg-fo.js); stacked lines pitch .9
  const CAPT = .177, CAPB = .875, CAP = CAPB - CAPT, PITCH = .9, LH = 1.42;
  const F = {
    hl: s => `font:700 ${s}pt ${CD};letter-spacing:.2pt;text-transform:uppercase`,
    adr: s => `font:700 ${s}pt ${CD};letter-spacing:${(s*.06).toFixed(2)}pt;text-transform:uppercase`,
    eb: s => `font:700 ${s}pt ${MN};letter-spacing:${(s*.2).toFixed(2)}pt;text-transform:uppercase`,
    pl: s => `font:700 ${s}pt ${MN};letter-spacing:${(s*.13).toFixed(2)}pt;text-transform:uppercase`,
    num: s => `font:700 ${s}pt ${CD}`,
    lab: s => `font:700 ${s}pt ${MN};letter-spacing:${(s*.16).toFixed(2)}pt;text-transform:uppercase`,
    bul: s => `font:600 ${s}pt ${MN}`,
    name: s => `font:700 ${s}pt ${MN}`,
    phone: s => `font:700 ${s}pt ${MN}`,
    q: s => `font:700 ${s}pt ${CD};letter-spacing:.4pt;text-transform:uppercase`,
    note: s => `font:500 ${s}pt ${MN}`,
  };
  const CSS = `<style>
    .ss .pgs-main{background:var(--pg-main)} .ss .pgs-dark{background:var(--pg-dark)} .ss .pgs-tint{background:var(--pg-tint)}
    .ss .pgs-cell{background:#fff;box-shadow:inset 0 0 0 .9pt var(--pg-line)}
    .ss .pgs-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ss .pgs-logo.l .logo{justify-content:flex-start} .ss .pgs-logo.r .logo{justify-content:flex-end}
    .ss .pgs-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .pgs-logo .text{font:700 13pt/1.15 ${MN};color:inherit}
    .ss .pgs-hs{position:absolute;overflow:hidden}.ss .pgs-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .pgs-row{position:absolute;display:flex;align-items:center;justify-content:space-between;white-space:nowrap;overflow:hidden}
    .ss .pgs-bul{position:absolute;display:flex;align-items:center;white-space:nowrap;overflow:hidden}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2};
    const M = document.createElement('div'); document.body.appendChild(M);
    const tmemo = new Map(), rmemo = new Map();
    T.tw = (t, css) => { const key = t + '|' + css; if(tmemo.has(key)) return tmemo.get(key); M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:nowrap;${css}`; M.textContent = t; const v = M.getBoundingClientRect().width*.75; tmemo.set(key, v); return v; };
    // a paragraph (markup allowed) at width w: its line count and each line's width (pt)
    T.rows = (html, css, w, lh) => { const key = html + '|' + css + '|' + w.toFixed(1) + '|' + lh.toFixed(2); if(rmemo.has(key)) return rmemo.get(key);
      M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:normal;width:${w}pt;${css};line-height:${lh}pt;text-align:left`; M.innerHTML = html;
      const rg = document.createRange(); rg.selectNodeContents(M); const out = [];
      [...rg.getClientRects()].forEach(b => { if(b.width < .5) return; const r = out.find(x => Math.abs(x.top - b.top) < b.height*.5); if(r){ r.l = Math.min(r.l, b.left); r.r = Math.max(r.r, b.right); } else out.push({top: b.top, l: b.left, r: b.right}); });
      out.sort((a, b) => a.top - b.top); const ws = out.map(r => (r.r - r.l)*.75);
      const res = {n: out.length, ws, wide: Math.max(1, ...ws), last: ws[ws.length - 1] || 0}; rmemo.set(key, res); return res; };
    // the largest size (max down to min, half points) at which t sets on one line w wide
    T.one = (t, face, w, max, min) => { for(let s = Math.floor(Math.max(max, min)*2 + .01)/2; s > min; s -= .5) if(T.tw(t, face(s)) <= w) return s; return T.tw(t, face(min)) <= w ? min : null; };
    T.done = () => M.remove();
    // the city line's face: tracked caps, the tracking closed up where the tile is narrow (the zip always stays)
    T.plf = (t, ps, w) => { for(const tr of [.13, .1, .07, .04, .02]){ const fc = q => `font:700 ${q}pt ${MN};letter-spacing:${(q*tr).toFixed(2)}pt;text-transform:uppercase`; if(T.tw(t, fc(ps)) <= w) return fc; } return null; };
    // the listing's own words
    const Li = D.listing || {}, bn = window.BD && BD.bathNum ? BD.bathNum(Li) : {num: Li.baths, label: 'Full Baths', half: ''}, num = v => Number(v).toLocaleString('en-US');
    T.parts = [];
    if(Li.beds) T.parts.push({n: String(Li.beds), l: Li.beds == 1 ? 'Bedroom' : 'Bedrooms', s: Li.beds == 1 ? 'Bed' : 'Beds'});
    if(Li.baths) T.parts.push({n: String(bn.num), l: bn.label, s: 'Baths'});
    if(bn.half) T.parts.push({n: bn.half.split(' ')[0], l: bn.half.split(' ').slice(1).join(' '), s: bn.half.split(' ').slice(1).join(' ')});
    if(Li.sqft) T.parts.push({n: num(Li.sqft), l: 'Square feet', s: 'Sq ft'});
    if(Li.yearBuilt || Li.year) T.parts.push({n: String(Li.yearBuilt || Li.year), l: 'Built', s: 'Built'});
    const J = ((D.sw || {}).pc || {}).jl || {}, S = ((D.sw || {}).pc || {}).js || {};
    T.hl = [].concat((J.front || {}).highlights || []).map(String).filter(t => t && !SocialSet.CONDITION.test(t) && !/\$\s?\d/.test(t));
    T.noteS = (((S.front || {}).note || {}).s || []).map(x => [].concat(x).map(String).filter(t => !SocialSet.CONDITION.test(t))).filter(x => x.length);
    T.head = String((((D.companion || {}).flyer || {}).front || {}).head || 'About this home');
    return T;
  };
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const tile = (kind, x, y, w, h) => `<div class="abs pgs-${kind}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"></div>`;
  const line = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {};
    return `<div class="abs nw" data-slot="${slot}" data-lines="1"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${s*lhK}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'}">${o.html || esc(t)}</div>`; };
  // one line of Plex Condensed caps set by its ink: the top of the capitals at y
  const hl = (slot, t, x, y, w, s, color, face) => `<div class="abs nw" data-slot="${slot}" data-lines="1" style="left:${x}pt;top:${y - s*CAPT}pt;width:${w}pt;height:${s}pt;${(face || F.hl)(s)};line-height:${s}pt;color:${color}">${slot === 'address' ? `<span>${esc(t)}</span>` : esc(t)}</div>`;
  const stackH = (n, s) => (n - 1)*s*PITCH + s*CAP;
  const stack = (slot, L, x, y, w, s, color) => L.map((t, i) => hl(i ? `${slot}.l${i}` : slot, t, x, y + i*s*PITCH, w, s, color)).join('');
  const para = (slot, p, x, y, color) => `<div class="abs wr" data-slot="${slot}" data-lines="${p.n}" style="left:${x}pt;top:${y}pt;width:${p.w}pt;height:${p.h}pt;${F.note(p.s)};line-height:${p.s*LH}pt;color:${color};text-align:left">${p.html}</div>`;

  // ---------- photos: every one a tile ----------
  const photoKit = (D, f) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const photo = (pid, x, y, w, h) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt`);
    const sup0 = window.OHEmail ? OHEmail.support(D, id, 10) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)).slice(0, 10);
    // no two rooms of one kind side by side (the same room twice, two outdoor shots): the next tile is the first photo of another kind
    const kind = p => { const t = (p + ' ' + ((D.photos[p] || {}).tags || '')).toLowerCase(); return /exterior|yard|walk|entry|gate|fence|deck|patio|pergola|side|front|porch|balcon|terrace|drive/.test(t) ? 'out' : String(p).replace(/\d+[a-z]?$/, ''); };
    const sup = []; { const rest = sup0.slice(); while(rest.length && sup.length < 6){ const last = sup.length ? kind(sup[sup.length - 1]) : '', minor = p => /\b(bath|shower|closet|laundry|utility|pantry|hall|garage|powder|mud|storage|stair)/i.test(p + ' ' + ((D.photos[p] || {}).tags || ''));
      let i = rest.findIndex(p => kind(p) !== last && !minor(p)); if(i < 0) i = Math.max(0, rest.findIndex(p => kind(p) !== last)); sup.push(rest.splice(i, 1)[0]); } }
    let used = 0;
    const X = {id, pAR, photo, left: () => sup.length - used,
      min: w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)), nat: w => Math.ceil(w/pAR),
      // the tallest frame: a little over the photo's own shape, never past the house (the photo is shown about as wide as it was taken)
      max: w => Math.ceil(Math.min(w/pAR*1.06, hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : w/pAR)),
      hero: (x, y, w, h) => { if(hb && h > w/pAR){ const vis = w/(h*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return photo(id, x, y, w, h); },
      // n room tiles side by side
      rooms: (x, y, w, h, n, g) => { const ids = sup.slice(used, used + n); used += ids.length; if(!ids.length) return ''; const pw = (w - (ids.length - 1)*g)/ids.length; return ids.map((p, i) => photo(p, x + i*(pw + g), y, pw, h)).join(''); }};
    // n room tiles one over another (the column beside a narrowed house)
    X.col = (x, y, w, h, n, g) => { const ids = sup.slice(used, used + n); used += ids.length; if(!ids.length) return ''; const ph = (h - (ids.length - 1)*g)/ids.length; return ids.map((p, i) => photo(p, x, y + i*(ph + g), w, ph)).join(''); };
    // the photo tiles of a column pw wide and h tall: the house alone while the frame keeps its own shape, else the house over a row of
    // room tiles. null when the column is too short for the whole house or the rest holds no good row.
    X.block = (pw, h, g) => { const mn = X.min(pw), nat = X.nat(pw), one = X.max(pw); if(h < mn - .5) return null;
      if(h <= one + .5) return {heroH: h, rooms: 0, html: (x, y) => X.hero(x, y, pw, h)};
      const n = pw >= 150*f ? 2 : 1, tw = (pw - (n - 1)*g)/n, rmin = Math.max(38*f, tw*.42);
      let rh = Math.max(rmin, Math.min(tw/1.25, h - g - nat)), h1 = h - g - rh;
      if(h1 > one){ h1 = one; rh = h - g - h1; } if(h1 < mn){ h1 = mn; rh = h - g - h1; }
      if(rh < rmin || rh > tw*1.5 || sup.length - used < n) return null;
      return {heroH: h1, rooms: n, html: (x, y) => X.hero(x, y, pw, h1) + X.rooms(x, y + h1 + g, pw, rh, n, g)}; };
    return X;
  };

  // ---------- the facts as ruled rows: the numeral in the accent at the left, the label in tracked caps at the right ----------
  // cols 2: the same ruled rows two to a line (the wide shapes, where four rows one under another do not fit the height)
  const factRows = (T, w, k, n, cols, tight) => { const P = T.parts.slice(0, n); if(!P.length) return null; cols = cols || 1;
    const plain = t => String(t).replace(/<[^>]+>/g, ''), gc = cols > 1 ? r2(8*T.f*Math.min(1, k + .2)) : 0, LAB = cols > 1 ? (q => `font:700 ${q}pt ${MN};letter-spacing:${(q*(tight ? 0 : .05)).toFixed(2)}pt;text-transform:uppercase`) : F.lab, cw = (w - (cols - 1)*gc)/cols, R = Math.ceil(P.length/cols);
    const ls0 = r2(Math.max(T.FS, T.FS*Math.min(k, 1.3))), ns = tight ? T.FB : r2(Math.max(T.FB*1.1, cols > 1 && k < .8 ? 0 : ls0*(k < .8 ? 1.5 : 1.75))), rh = r2(ns*(k < .8 ? 1.36 : 1.42));
    for(const short of (cols > 1 ? [1] : [0, 1])){ const lab = p => short ? p.s : p.l; let ls = ls0;
      const fits = q => P.every(p => T.tw(plain(p.n), F.num(ns)) + ns*(tight ? .15 : cols > 1 ? .22 : .3) + T.tw(lab(p), LAB(q)) <= cw), widest = q => Math.max(...P.map(p => T.tw(plain(p.n), F.num(ns)) + T.tw(lab(p), LAB(q))));
      if(!fits(ls)) continue;
      // a wide row: the labels step up (to seven tenths of the numeral at most) so no row is mostly air between its two ends
      if(widest(ls) < cw*.72) for(let q = r2(Math.min(ns*.7, ls0*1.4)); q > ls0; q -= .5) if(fits(q) && widest(q) <= cw*.9){ ls = q; break; }
      return {h: R*rh, n: P.length, rh, cols, html: (x, y, hh) => { const r = (hh || R*rh)/R;
        return P.map((p, i) => { const cx = x + (i % cols)*(cw + gc), cy = y + Math.floor(i/cols)*r; return rect(cx, cy, cw, 1, 'background:var(--pg-rule-on)')
          + `<div class="pgs-row" data-slot="fact.${i}" data-lines="1" style="left:${cx}pt;top:${cy + 1}pt;width:${cw}pt;height:${r - 1}pt"><span style="${F.num(ns)};line-height:${r - 1}pt;color:${ACM}">${p.n}</span><span data-small="1" style="${LAB(ls)};line-height:${r - 1}pt;color:${ONM}">${esc(lab(p))}</span></div>`; }).join(''); }}; }
    return null; };

  // ---------- Just Listed: the main-color tile ----------
  // 'col' (the postcard's column): JUST / LISTED stacked (o.one: on one line), the short bar, the ruled facts under them (o.cols 2: two to a line)
  const mainCol = (T, w, k, o) => { o = o || {};
    const pad = r2(Math.min((o.tight ? 8 : o.cols > 1 ? 11 : 13)*T.f*Math.min(k, 1.2), w*.085)), iw = w - 2*pad, WL = o.one ? ['Just Listed'] : ['Just', 'Listed'], sW = T.one(o.one ? 'JUST LISTED' : 'LISTED', F.hl, iw, 240, T.FE); if(!sW) return null;
    const s = Math.max(T.FE, r2(Math.min(sW, T.FE*4.6*k)*(o.wk || 1))), nL = WL.length;
    const fr = o.nf ? factRows(T, iw, k, o.nf, o.cols, o.tight) : null; if(o.nf && !fr) return null;
    const g = r2(9*T.f*Math.min(k, 1.2)), barH = Math.max(1.5, r2(s*.035)), barW = Math.min(iw*.5, s*.58);
    const top = stackH(nL, s) + g*1.1 + barH, h = pad + top + (fr ? g*1.35 + fr.h : 0) + pad*.9;
    const wordW = Math.max(...WL.map(t => T.tw(t, F.hl(s))));
    return {h, s, one: o.one ? 1 : 0, cols: o.cols || 1, nf: fr ? fr.n : 0, voidA: (iw - wordW)*(stackH(nL, s) + pad), html: (x, y, hh) => { const slack = Math.max(0, hh - h), grow = fr ? Math.min(slack, fr.h*.4) : 0, rest = slack - grow, a = rest*(fr ? .3 : .5), b = fr ? rest*.45 : 0;
      let yy = y + pad + a, out = tile('main', x, y, w, hh);
      out += stack('moment', WL, x + pad - s*.02, yy, iw + 4, s, ONM); yy += stackH(nL, s) + g*1.1;
      out += rect(x + pad, yy, barW, barH, `background:${ONM};opacity:.6`); yy += barH;
      if(fr) out += fr.html(x + pad, yy + g*1.35 + b, fr.h + grow);
      return out; }}; };
  // 'bar' (a full-width tile on the tall shapes): the stacked word at the left, the ruled facts filling the tile beside it
  const mainBar = (T, w, k, o) => { o = o || {};
    const pad = r2(13*T.f*Math.min(k, 1.2)), iw = w - 2*pad, gap = r2(17*T.f), cols = o.cols || 1, sW = T.one('LISTED', F.hl, iw*(cols > 1 ? .4 : .5), 240, T.FE); if(!sW) return null;
    const s = Math.max(T.FE, r2(Math.min(sW, T.FE*4.4*k))), wW = T.tw('LISTED', F.hl(s)), fw = iw - wW - gap;
    const fr = factRows(T, fw, k, o.nf || 4, cols); if(!fr) return null;
    const g = r2(9*T.f*Math.min(k, 1.2)), barH = Math.max(1.5, r2(s*.035)), barW = Math.min(wW*.5, s*.58);
    const lh = stackH(2, s) + g*1.1 + barH, inner = Math.max(lh, fr.h), h = pad + inner + pad;
    return {h, s, nf: fr.n, html: (x, y, hh) => { const inn = hh - 2*pad, fh = Math.min(inn, fr.h*1.5); let yy = y + pad + (inn - lh)/2, out = tile('main', x, y, w, hh);
      out += stack('moment', ['Just', 'Listed'], x + pad - s*.02, yy, wW + 4, s, ONM); yy += stackH(2, s) + g*1.1;
      out += rect(x + pad, yy, barW, barH, `background:${ONM};opacity:.6`);
      return out + fr.html(x + pad + wW + gap, y + pad + (inn - fh)/2, fh); }}; };

  // ---------- Just Sold: JUST SOLD across the main-color tile, the street in the accent, the city line with its zip ----------
  // 'under': the word across the tile's width, the street under it (the city line after it on the same line, else under it)
  // 'beside': the word at the left (as tall as o.capH allows), the street over the city line beside it past a hairline
  // The street reads as one unit: one line, or the number over the name with nothing between; never shortened.
  const soldTile = (T, D, w, k, o) => { o = o || {};
    const Li = D.listing, pad = r2(13*T.f*Math.min(k, 1.2)), iw = w - 2*pad, street = String(Li.address || ''), place = OHL.place(Li), g = r2(8*T.f*Math.min(k, 1.2));
    const sW = T.one('JUST SOLD', F.hl, iw, 400, T.FE); if(!sW) return null;
    const ps = r2(Math.max(T.FS, T.FS*Math.min(k, 1.25))), m2 = /^(\S+)\s+(.+)$/.exec(street);
    // the street in aw: one line down to the floor size, else two
    const adr = (aw, max) => { for(const fc of [F.adr, F.hl]){ const one = T.one(street, fc, aw, max, T.FE); if(one) return {L: [street], s: one, fc}; }
      return null; };   // (never split: a tile too narrow for the street on one line is not used)
    const aW = A => Math.max(...A.L.map(t => T.tw(t, A.fc(A.s))));
    if(o.mode !== 'beside'){
      const s = Math.max(T.FE, r2(sW*(o.wk || 1))); let A = adr(iw, Math.max(T.FE, Math.min(s*.3, T.FE*1.5*k))); const PL = T.plf(place, ps, iw); if(!A || A.s > s*.8 || !PL) return null; const pW = T.tw(place, PL(ps));
      const inl = A.L.length === 1 && aW(A) + A.s*.75 + pW <= iw;
      if(!inl && A.L.length === 1) A = adr(iw, Math.max(A.s, Math.min(s*.42, T.FE*2*k))) || A;   // the city line under it: the street may run the width
      // o.cb (the Google post): where the city line will not share the street's line, the city over the state and zip, two short lines
      // right-aligned at the tile's right edge (under the word's end), the pair centered on the street, so no room opens beside it
      const cut = place.lastIndexOf(','), two = cut > 0 ? [place.slice(0, cut + 1), place.slice(cut + 1).trim()] : null;
      if(o.cb && !inl && two) for(let as = A.s; as >= Math.max(T.FE, A.s*.8) - .01; as -= .5){ const B = adr(iw, as); if(!B) continue; const room = iw - aW(B) - B.s*.9;
        for(let q = Math.max(ps, r2(Math.min(B.s*.6, ps*1.3))); q >= ps - .01; q -= .5){ const fc = T.plf(two[0], q, room) && T.plf(two[1], q, room) ? [.13, .1, .07, .04, .02].map(tr => (z => `font:700 ${z}pt ${MN};letter-spacing:${(z*tr).toFixed(2)}pt;text-transform:uppercase`)).find(f2 => two.every(t => T.tw(t, f2(q)) <= room)) : null; if(!fc) continue;
          const cw2 = Math.max(...two.map(t => T.tw(t, fc(q)))), rH = Math.max(B.s*CAP, 2*q*1.3), h = pad + s*CAP + g*1.3 + rH + pad*.9;
          return {h, s, cb: 1, html: (x, y, hh) => { let yy = y + pad + (hh - h)/2, out = tile('main', x, y, w, hh);
            out += hl('moment', 'Just Sold', x + pad - s*.03, yy, iw + 8, s, ONM); yy += s*CAP + g*1.3;
            out += hl('address', street, x + pad, yy + (rH - B.s*CAP)/2, aW(B) + 4, B.s, ACM, B.fc);
            return out + two.map((t, i) => line('place' + (i ? '.2' : ''), t, x + pad + iw - cw2 - 3, yy + (rH - 2*q*1.3)/2 + i*q*1.3, cw2 + 3, q, 1.3, fc, ONM, {small: 1, align: 'right'})).join(''); }}; } }
      let ps2 = ps, PL2 = PL; if(!inl) for(let q = r2(Math.min(A.s*.7, ps*2.2)); q > ps; q -= .5){ const fc = T.plf(place, q, iw*.84); if(fc){ ps2 = q; PL2 = fc; break; } }
      const aH = stackH(A.L.length, A.s), h = pad + s*CAP + g*1.3 + aH + (inl ? 0 : g*.8 + ps2*1.3) + pad*.9;
      return {h, s, voidA: inl ? 0 : (iw - Math.max(aW(A), T.tw(place, PL2(ps2))))*(aH + g*.8 + ps2*1.3), html: (x, y, hh) => { let yy = y + pad + (hh - h)/2, out = tile('main', x, y, w, hh);
        out += hl('moment', 'Just Sold', x + pad - s*.03, yy, iw + 8, s, ONM); yy += s*CAP + g*1.3;
        out += A.L.map((t, i) => hl(i ? 'address.l1' : 'address', t, x + pad, yy + i*A.s*PITCH, aW(A) + 4, A.s, ACM, A.fc)).join('');
        if(inl) out += line('place', place, x + pad + aW(A) + A.s*.75, yy + A.s*CAP - ps*1.3*.78, pW + 3, ps, 1.3, PL, ONM, {small: 1});
        else out += line('place', place, x + pad, yy + aH + g*.8, iw, ps2, 1.3, PL2, ONM, {small: 1});
        return out; }};
    }
    const s = Math.max(T.FE, r2(Math.min(sW, o.capH/CAP))), wW = T.tw('JUST SOLD', F.hl(s)), gap = r2(11*T.f), rest = iw - wW - 2*gap, PL = T.plf(place, ps, rest); if(!PL) return null;
    const A = adr(rest, Math.max(T.FE, Math.min(s*.5, T.FE*1.7*k))); if(!A || A.s > s*.86) return null;
    const aH = stackH(A.L.length, A.s), rh = aH + g*.8 + ps*1.3, inner = Math.max(s*CAP, rh), h = pad + inner + pad;
    return {h, s, html: (x, y, hh) => { const y0 = y + (hh - inner)/2, rx = x + pad + wW + 2*gap; let out = tile('main', x, y, w, hh);
      out += hl('moment', 'Just Sold', x + pad - s*.03, y0 + (inner - s*CAP)/2, wW + 8, s, ONM);
      out += rect(x + pad + wW + gap, y0 - pad*.2, 1, inner + pad*.4, 'background:var(--pg-rule-on)');
      out += A.L.map((t, i) => hl(i ? 'address.l1' : 'address', t, rx, y0 + (inner - rh)/2 + i*A.s*PITCH, rest, A.s, ACM, A.fc)).join('');
      out += line('place', place, rx, y0 + (inner - rh)/2 + aH + g*.8, rest, ps, 1.3, PL, ONM, {small: 1});
      return out; }}; };

  // ---------- the dark tile: the street in caps, the city line with its zip in the accent under it, the highlights with accent squares ----------
  // o.nb: how many highlights (each must set on one line); o.side: the highlights beside the street past a hairline, else under it;
  // o.big: the street as large as the tile's width holds it (o.smax: never larger than this, the moment word stays the largest type)
  const darkTile = (T, D, w, k, o) => { o = o || {};
    const Li = D.listing, pad = r2(Math.min(13*T.f*Math.min(k, 1.2), w*.08)), iw = w - 2*pad, street = String(Li.address || ''), g = r2(8*T.f*Math.min(k, 1.2));
    let bs = r2(Math.max(T.FB, T.FB*Math.min(k, 1.15))), sq = r2(bs*.4), bg = r2(bs*.62), brh = r2(bs*1.6); const nb = o.nb || 0, gap = r2(11*T.f);
    const bulls = bw => T.hl.filter(t => sq + bg + T.tw(t, F.bul(bs)) + 1 <= bw).slice(0, nb);
    // the highlights as large as the tile's width holds them (up to a third over their size), so the longest runs the width
    const grow = bw => { const l0 = bulls(bw); if(l0.length < nb || !nb) return; for(let q = r2(bs*1.33); q > bs; q -= .5) if(l0.every(t => r2(q*.4) + r2(q*.62) + T.tw(t, F.bul(q)) + 1 <= bw)){ bs = q; sq = r2(bs*.4); bg = r2(bs*.62); brh = r2(bs*1.6); return; } };
    const side = nb && o.side, cap = Math.min(o.smax || 999, T.FE*(o.big ? 3 : 2.2)*k);
    // the street on one line, never split and never shortened (a tile too narrow for it is not used)
    const adr = aw => { const one = T.one(street, F.hl, aw, Math.max(T.FE, cap), T.FE); return one ? {L: [street], s: one} : null; };   // never split
    const place = OHL.place(Li), ps0 = r2(Math.max(T.FS, T.FS*Math.min(k, 1.25))), PL = T.plf(place, ps0, side ? iw*.5 : iw); if(!PL) return null; const pW = T.tw(place, PL(ps0));
    let A = null, list = [], aw = iw, bw = iw;
    if(side){ for(const fr of [.52, .46, .4, .34]){ const a0 = adr(iw*fr); if(!a0) continue; const wA = Math.max(pW, ...a0.L.map(t => T.tw(t, F.hl(a0.s)))) + 2, l = bulls(iw - wA - 2*gap); if(l.length < nb) continue; A = a0; aw = wA; bw = iw - wA - 2*gap; grow(bw); list = bulls(bw); break; } if(!A) return null; }
    else { A = adr(iw); if(!A) return null; grow(iw); list = bulls(iw); if(list.length < nb) return null; }
    const aH = stackH(A.L.length, A.s) + g*.8 + ps0*1.3, bH = list.length*brh;
    const inner = side ? Math.max(aH, bH) : aH + (list.length ? g*1.3 + bH : 0), h = pad + inner + pad;
    const bul = (t, i, x, y) => `<div class="pgs-bul" data-slot="hl.${i}" data-lines="1" style="left:${x}pt;top:${y}pt;width:${bw}pt;height:${brh}pt;${F.bul(bs)};line-height:${brh}pt;color:${OND};gap:${bg}pt"><span style="width:${sq}pt;height:${sq}pt;background:${ACD};flex:none"></span>${esc(t)}</div>`;
    const bwMax = list.length ? Math.max(...list.map(t => sq + bg + T.tw(t, F.bul(bs)))) : 0, aWd = Math.max(pW, ...A.L.map(t => T.tw(t, F.hl(A.s))));
    const voidA = side ? 0 : Math.max(list.length ? (iw - bwMax)*(bH + g*1.3 + pad) : 0, (iw - aWd)*(aH + pad), A.L.length > 1 ? (iw - T.tw(A.L[0], F.hl(A.s)))*(A.s*CAP + pad) : 0);
    return {h, nb: list.length, s: A.s, voidA, html: (x, y, hh) => { const y0 = y + (hh - inner)/2; let out = tile('dark', x, y, w, hh), ya = side ? y0 + (inner - aH)/2 : y0;
      out += stack('address', A.L, x + pad - A.s*.02, ya, aw + 4, A.s, OND) + line('place', place, x + pad, ya + stackH(A.L.length, A.s) + g*.8, Math.max(aw, pW) + 2, ps0, 1.3, PL, ACD, {small: 1});
      if(side){ out += rect(x + pad + aw + gap, y0 - pad*.15, 1, inner + pad*.3, 'background:var(--pg-rule-ond)'); list.forEach((t, i) => out += bul(t, i, x + pad + aw + 2*gap, y0 + (inner - bH)/2 + i*brh)); }
      else list.forEach((t, i) => out += bul(t, i, x + pad, y0 + aH + g*1.3 + i*brh));
      return out; }}; };

  // ---------- who to call on the pale tint tile: the headshot, the name, REALTOR(R), the phone in the main ink, the logo ----------
  // 'stack': the lines with the logo under them (the postcard's tile). 'row': the lines at the left, the logo at the right.
  // 'tower' (a narrow column): the headshot as a photo tile across the tint tile's head, the lines and the logo under it.
  // An agent with a headshot on file always gets it: a photo tile flush in the tint tile's left end, as tall as the tile.
  // REALTOR(R) always shows for a member; the phone's label rides before the number where the line holds both.
  const agentTile = (T, D, w, k, mode, o) => { o = o || {};
    const A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), lab = A.phoneLabel || 'Call / Text';
    const pad = r2(Math.min(12*T.f*Math.min(k, 1.2), w*.085)), gap = r2(9*T.f*Math.min(1, k + .2)), LGH = r2(T.FB*2*Math.min(1, Math.max(.84, k + .2)));
    const sizes = cw => { const ns = T.one(A.name || '', F.name, cw, T.FB*1.45*k, T.FB*1.1), ps = T.one(A.phone || '', F.phone, cw, Math.max(T.FB, T.FB*1.12*k), T.FB), ds = r2(Math.max(T.FS, T.FS*.95*Math.min(k, 1.3))); if(!ns || !ps) return null;
      const nW = T.tw(A.name || '', F.name(ns)), dW = nar ? T.tw('REALTOR®', F.lab(ds)) : 0, pW = T.tw(A.phone || '', F.phone(ps)), lW = T.tw(lab, F.lab(ds)); if(dW > cw) return null;
      const dInl = nar && nW + ns*.45 + dW <= cw, lInl = lW + ps*.5 + pW <= cw;
      const th = ns*1.22 + (nar && !dInl ? ds*1.35 : 0) + 2*T.f + ps*1.3;
      return {ns, ps, ds, nW, dW, pW, lW, dInl, lInl, th, wide: Math.max(dInl ? nW + ns*.45 + dW : Math.max(nW, dW), lInl ? lW + ps*.5 + pW : pW)}; };
    const lines = (S, x, y) => { let out = line('agent.name', A.name || '', x, y, S.nW + 2, S.ns, 1.22, F.name, INK), yy = y + S.ns*1.22;
      if(nar && S.dInl) out += line('agent.desig', 'REALTOR®', x + S.nW + S.ns*.45, y + S.ns*1.22*.78 - S.ds*1.35*.76, S.dW + 2, S.ds, 1.35, F.lab, MINK, {small: 1});
      else if(nar){ out += line('agent.desig', 'REALTOR®', x, yy, S.dW + 2, S.ds, 1.35, F.lab, MINK, {small: 1}); yy += S.ds*1.35; }
      yy += 2*T.f;
      if(S.lInl) out += line('agent.label', lab, x, yy + S.ps*1.3*.78 - S.ds*1.4*.76, S.lW + 2, S.ds, 1.4, F.lab, MINK, {small: 1}) + line('agent.phone', A.phone || '', x + S.lW + S.ps*.5, yy, S.pW + 2, S.ps, 1.3, F.phone, MINK);
      else out += line('agent.phone', A.phone || '', x, yy, S.pW + 2, S.ps, 1.3, F.phone, MINK);
      return out; };
    const logo = (x, y, lw, lh, al) => `<div class="abs pgs-logo ${al}" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${INK}">${OHL.logo(D, 'light', '')}</div>`;
    const hs = (x, y, hw, hh) => `<div class="abs pgs-headshot pgs-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    // the tile with a headshot hw wide in its left end (0: none)
    const make = hw => { const cw = w - hw - 2*pad; if(cw < 40) return null;
      if(mode === 'row' && o.nologo){ const S = sizes(cw); if(!S) return null; const inner = S.th, h = pad + inner + pad;
        return {h, mode, hs: hw ? 1 : 0, voidA: 0, logoH: 99, html: (x, y, hh) => tile('tint', x, y, w, hh) + (hw ? hs(x, y, hw, hh) : '') + lines(S, x + hw + pad + Math.min((cw - S.wide)/2, pad), y + (hh - inner)/2)}; }
      if(mode === 'row'){
        const S = sizes(cw - gap*1.5 - LGH*2.7); if(!S) return null;
        const lx = S.wide + gap*1.5, lw = Math.min(cw - lx, LGH*4.2), inner = Math.max(S.th, LGH), h = pad + inner + pad;
        return {h, mode, hs: hw ? 1 : 0, voidA: Math.max(0, cw - lx - lw - gap)*inner, logoH: Math.min(LGH, lw/3.6), html: (x, y, hh) => { const y0 = y + (hh - inner)/2, x0 = x + hw + pad;
          return tile('tint', x, y, w, hh) + (hw ? hs(x, y, hw, hh) : '') + lines(S, x0, y0 + (inner - S.th)/2) + logo(x + w - pad - lw, y0 + (inner - LGH)/2, lw, LGH, 'r'); }};
      }
      const S = sizes(cw); if(!S) return null;
      if(!hw && S.pW + gap*1.5 + LGH*2.7 <= cw && (S.dInl || !nar)){ const top = S.th - S.ps*1.3, lw = cw - S.pW - gap*1.5, LG2 = r2(Math.max(LGH, Math.min(LGH*1.5, lw/3.9))), foot = Math.max(S.ps*1.3, LG2), inner = top + gap*.4 + foot, h = pad + inner + pad;
        return {h, mode, hs: 0, voidA: 0, logoH: Math.min(LG2, lw/3.6), html: (x, y, hh) => { const y0 = y + (hh - inner)/2, x0 = x + pad, S2 = Object.assign({}, S, {lInl: false});
          // the lines as set, the phone dropped to the foot row so it stands beside the logo
          return tile('tint', x, y, w, hh) + lines(S2, x0, y0).replace(/(data-slot="agent\.phone"[^>]*top:)[\d.]+pt/, `$1${y0 + top + gap*.4 + (foot - S.ps*1.3)/2}pt`) + logo(x + w - pad - lw, y0 + top + gap*.4 + (foot - LG2)/2, lw, LG2, ''); }}; }
      const lw = Math.min(cw, LGH*4.2), inner = S.th + gap*.9 + LGH, h = pad + inner + pad, bW = Math.max(S.wide, lw), cx = hw ? Math.min((cw - bW)/2, pad*.6) : (cw - bW)/2;
      return {h, mode, hs: hw ? 1 : 0, voidA: (cw - bW)*inner*(hw ? .8 : .5), logoH: Math.min(LGH, lw/3.6), html: (x, y, hh) => { const y0 = y + (hh - inner)/2, x0 = x + hw + pad + cx;
        return tile('tint', x, y, w, hh) + (hw ? hs(x, y, hw, hh) : '') + lines(S, x0, y0) + logo(x0, y0 + S.th + gap*.9, lw, LGH, 'l'); }};
    };
    if(mode === 'tower'){ if(!hsOn) return null; const cw = w - 2*pad, S = sizes(cw); if(!S) return null;
      const lw = Math.min(cw, LGH*4.2), th = r2(w*.62), inner = S.th + gap*.9 + LGH, h = th + pad + inner + pad, bW = Math.max(S.wide, lw), cx = (cw - bW)/2;
      return {h, mode, hs: 1, voidA: 0, logoH: Math.min(LGH, lw/3.6), html: (x, y, hh) => { const t2 = th + (hh - h)*.6, y0 = y + t2 + pad + (hh - t2 - 2*pad - inner)/2, x0 = x + pad + cx;
        return tile('tint', x, y, w, hh) + hs(x, y, w, t2) + lines(S, x0, y0) + logo(x0, y0 + S.th + gap*.9, lw, LGH, 'l'); }}; }
    if(!hsOn) return make(0);
    const p = make(0); if(!p) return null;
    for(const q of [.78, .68, .58, .5]){ const hw = r2(Math.min(p.h*q, w*.44)), a = make(hw); if(a && hw >= a.h*.45) return a; }
    return null; };

  // ---------- the white cell with the thin main-color line: a heading over a paragraph that fills it ----------
  // the fullest pick of whole sentences that sets in minN..maxN lines w wide: every line 80%+ and the last 90%+ of the measure, the
  // type raised a little or the measure narrowed a touch to get there (owner 11/8); justified only when every line runs nearly full
  const fillPara = (T, cands, w, s0, maxN, minN) => { T.fp = T.fp || {}; const key = [cands.id, Math.round(w), s0, maxN, minN].join('|'); if(key in T.fp) return T.fp[key];
    let best = null;
    if(maxN >= 1) for(const m of [1, .95]) for(const s of [s0, r2(s0*1.05), r2(s0*1.1), r2(s0*1.16)]) for(const c of cands){ const ww = w*m, est = c.len*s*.5/ww; if(est > maxN*1.3 + .3 || est < ((minN || 1) - 1)*.75) continue;   // (a pick far too long or short for the lines is not measured)
      const r = T.rows(c.html, F.note(s), ww, s*LH);
      if(r.n > maxN || r.n < (minN || 1) || (r.n > 1 && ww/(s*.52) < 18)) continue;   // (a column too narrow for a line of words sets no note)
      if(r.n === 1 ? r.wide < .86*ww : (r.last < .9*ww || r.ws.slice(0, -1).some(x => x < .82*ww))) continue;
      const sc = r.n*100 + (c.pref || 0) - (1 - m)*600 - (s - s0)*3 + Math.min(c.len, 500)*.04;
      if(!best || sc > best.sc) best = {html: c.html, len: c.len, n: r.n, s, w: ww, sc, h: r.n*s*LH + s*.15, just: r.n > 1 && r.ws.slice(0, -1).every(x => x >= .93*ww)}; }
    return (T.fp[key] = best); };
  // Just Sold: the agent's note (data.sw.pc.js.front.note), its first sentence (the sale) bold, then whole sentences in the writer's order;
  // where no pick of it sets well, the engine's own Just Sold line
  const soldCands = T => { if(T.sc) return T.sc; const S = T.noteS, out = [], B = t => `<b style="font-weight:700;color:${INK}">${esc(t)}</b>`;
    if(S.length){ const lead = S[0], rest = S.slice(1), N = rest.length;
      for(let mask = 0; mask < (1 << N); mask++){ const pk = rest.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue;
        for(const lv of lead) for(const v of [0, 1]){ const tail = pk.map(a => a[Math.min(v, a.length - 1)]).join(' ');
          if(!tail && !/help you|glad to/i.test(lv)) continue;   // the sale alone is no note: it always carries what the agent can do for the reader
          out.push({html: B(lv) + (tail ? ' ' + esc(tail) : ''), len: lv.length + tail.length, pref: mask & 1 ? 12 : 0}); } } }
    const fb = String(SocialSet.SOLD_POST || 'I just sold this house. Yours could be next.'), i = fb.search(/(?<=[.!?])\s/);
    out.push({html: i > 0 ? B(fb.slice(0, i)) + esc(fb.slice(i)) : B(fb), len: fb.length, pref: -70});
    const res = out.filter((c, j, a) => a.findIndex(q => q.html === c.html) === j); res.id = 'js'; return (T.sc = res); };
  // Just Listed: the writer's sentences (the first always kept), none that says again what a highlight on the image says
  const listCands = (T, D, shown) => { T.lc = T.lc || {}; const id = 'jl' + shown.length; if(T.lc[id]) return T.lc[id];
    const wd = t => (String(t).toLowerCase().match(/[a-z]{4,}/g) || []).map(x => x.replace(/s$/, '')), sw = shown.map(wd);
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing)).filter(t => !sw.some(b => { const c = wd(t).filter(x => b.includes(x)); return c.length >= 2 || c.some(x => x.length >= 6); })).slice(0, 7), out = [];
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 5) continue; const t = pk.join(' ');
      out.push({html: esc(t), len: t.length, pref: /\bmiles?\b/i.test(t) ? 30 : 0}); }
    out.id = id; return (T.lc[id] = out); };
  // o.head ('' : the paragraph alone), o.cands, o.lines (the most lines) or o.room (the height the cell may take), o.min (the fewest lines)
  const cellTile = (T, w, k, o) => {
    const pad = r2(Math.min(12*T.f*Math.min(k, 1.25), w*.07)), iw = w - 2*pad, sold = o.kind === 'sold';
    let HL_ = o.head ? [o.head] : [], qs = !o.head ? 0 : sold ? T.one(o.head, F.q, iw, T.FE*1.3*k*(o.qK || 1), T.FB*1.1) : T.one(o.head, F.eb, iw, Math.max(T.FS, T.FS*Math.min(k, 1.3)), T.FS);
    if(o.head && !qs && sold){ HL_ = ['Thinking about', 'selling?']; qs = T.one(HL_[0], F.q, iw, T.FE*1.3*k, T.FB*1.1); }
    if(o.head && !qs) return null;
    const g = r2(7*T.f*Math.min(k, 1.2)), qh = !o.head ? 0 : (sold ? stackH(HL_.length, qs) : qs*1.3) + g, s0 = r2(Math.max(T.FB, T.FB*1.04*k));
    const maxN = o.lines != null ? o.lines : Math.floor((o.room - 2*pad - qh - s0*.15)/(s0*1.16*LH));
    const p = maxN > 0 ? fillPara(T, o.cands, iw, s0, maxN, o.min || 1) : null; if(!p) return null;
    const inner = qh + p.h, h = pad + inner + pad;
    return {h, n: p.n, len: p.len, s: p.s, two: HL_.length > 1, noq: !o.head, html: (x0, y, hh) => { let yy = y + (hh - inner)/2, out = tile('cell', x0, y, w, hh); const x = x0 + (iw - p.w)/2;
      if(o.head && sold) out += HL_.map((t, i) => hl(i ? 'sold.q2' : 'sold.q', t, x + pad, yy + i*qs*PITCH, iw, qs, MINK, F.q)).join('');
      else if(o.head) out += line('about.head', o.head, x + pad, yy, iw, qs, 1.3, F.eb, MINK, {small: 1});
      out += para(sold ? 'sold.note' : 'writeup', p, x + pad, yy + qh, TXT);
      return out; }}; };

  // a tile set again with larger type, as large as its room (w x hh) holds: no tile is mostly air around small words
  const grown = (t0, mk, hh) => { for(const kk of [2.6, 2.3, 2, 1.8, 1.6, 1.45, 1.3, 1.15, 1, .9, .8, .7]){ const t = mk(kk); if(t && t.h <= hh + .5 && t.h > t0.h + .5) return t; } return t0; };
  const KS = [1.6, 1.45, 1.3, 1.15, 1, .9, .8, .7, .6], KC = [1.6, 1.3, 1.1, .9, .75, .6, .5], Q = 'Thinking about selling?';
  const PG = {};
  // ================= post, pin, story =================
  // Just Listed: the house; the main-color tile (JUST / LISTED, the ruled facts); the dark tile (the street, the highlights) beside the
  // tint tile (who to call), or each across the width; where the shape has the room, the white cell with the write-up and a row of
  // room tiles. Just Sold: the main-color tile with JUST SOLD across it; the house; the white cell ("Thinking about selling?" and the
  // note) with the tint tile beside or under it. A story opens on the house (no text in its top and bottom 250 px) and closes on room tiles.
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f} = T, X = photoKit(D, f), sold = D.piece.moment === 'js', story = shape === 'story';
    const m = r2(W*.03), g = r2(W*.015), w0 = W - 2*m, BOT = story ? H - Math.max(94, r2(100*f)) : H - m, nat = X.nat(w0), mn = X.min(w0);
    const sum = rows => rows.reduce((a, b) => a + b + g, 0), sq = shape === 'square';
    // the house in the room rm the tiles leave: across the full width while it stays whole; else narrowed (never under 70% of the
    // width) with room tiles in the column beside it
    const heroFit = rm => { if(rm >= mn - .5) return {hw: w0, ph: Math.min(rm, X.max(w0)), sw: 0};
      for(let q = .86; q >= .7 - .001; q -= .02){ const hw = Math.round(w0*q), sw = w0 - g - hw; if(X.min(hw) <= rm && sw >= 44*f) return {hw, ph: Math.min(rm, X.max(hw)), sw}; }
      return null; };
    const build = (k, o) => { const aw = Math.round(w0*(o.af || .46)), dw = w0 - g - aw;
      if(!sold){
        const main = mainBar(T, w0, k, {nf: 4, cols: o.bar === 'grid' ? 2 : 1}); if(!main) return null;
        const cell = o.wl ? cellTile(T, w0, k, {head: T.head, cands: listCands(T, D, o.nb ? T.hl : []), lines: o.wl, min: Math.min(o.wl, 2)}) : null; if(o.wl && (!cell || cell.n < o.wl)) return null;
        if(o.arr === 'R'){   // the dark tile and the tint tile each across the width
          const ag = agentTile(T, D, w0, k, 'row'), dark = o.nb ? darkTile(T, D, w0, k, {nb: o.nb, side: 1, smax: main.s*.92}) : darkTile(T, D, w0, k, {nb: 0, big: 1, smax: main.s*.92}); if(!ag || !dark) return null;
          const rows = [main.h, dark.h, ag.h].concat(cell ? [cell.h] : []); return {main, dark, ag, cell, rows, aw, dw, gapR: 0, fixed: sum(rows)};
        }
        const ag = agentTile(T, D, aw, k, 'stack'); if(!ag) return null;
        // the dark tile as tall as the tile beside it: the street on one line, or the number over the name set larger
        const dark = [darkTile(T, D, dw, k, {nb: o.nb, smax: main.s*.92}), darkTile(T, D, dw, k, {nb: o.nb, big: 1, smax: main.s*.92})].filter(Boolean).sort((p, q) => Math.abs(p.h - ag.h) - Math.abs(q.h - ag.h))[0]; if(!dark) return null;
        const rows = [main.h, Math.max(dark.h, ag.h)].concat(cell ? [cell.h] : []);
        return {main, dark, ag, cell, rows, aw, dw, gapR: Math.abs(dark.h - ag.h), fixed: sum(rows)};
      }
      const st = soldTile(T, D, w0, k, {}); if(!st) return null;
      if(o.arr === 'A'){
        const cell = cellTile(T, w0, k, {kind: 'sold', head: Q, cands: soldCands(T), lines: o.n, min: o.n}), ag = agentTile(T, D, w0, k, 'row'); if(!cell || !ag) return null;
        const rows = [st.h, cell.h, ag.h]; return {st, cell, ag, rows, aw, dw, gapR: 0, fixed: sum(rows)};
      }
      const ag = agentTile(T, D, aw, k, 'stack'); if(!ag) return null;
      const cell = cellTile(T, dw, k, {kind: 'sold', head: Q, cands: soldCands(T), lines: o.n, min: o.n}); if(!cell) return null;
      const rows = [st.h, Math.max(cell.h, ag.h)]; return {st, cell, ag, rows, aw, dw, gapR: Math.abs(cell.h - ag.h), fixed: sum(rows)};
    };
    const opts = [], AF = [.4, .48, .56, .64];
    if(sold) for(const n of [5, 4, 3, 2, 1]){ opts.push({arr: 'A', n}); if(!sq) for(const af of AF) opts.push({arr: 'B', n, af}); }
    else for(const bar of (sq ? ['grid', 'rows'] : ['rows'])) for(const nb of [3, 2, 0].filter(v => v <= T.hl.length)) for(const wl of (sq ? [0] : [4, 3, 2, 0])){ opts.push({arr: 'R', nb, wl, bar}); for(const af of AF) opts.push({arr: 'S', nb, wl, af, bar}); }
    const room = b => BOT - m - b.fixed, target = sq ? X.nat(Math.round(w0*.8)) : nat, kW = shape === 'post' ? 130 : 300;
    let pick = null;
    for(const o of opts){ const b0 = build(.6, o); if(!b0 || !heroFit(room(b0))) continue;
      let k = .6; for(const t of KS){ const b = build(t, o); if(b && room(b) >= target){ k = t; break; } }
      const b = build(k, o), hf = heroFit(room(b)), hero = hf.hw*Math.min(hf.ph, X.nat(hf.hw))/(w0*nat);
      const sc = hero*1500 + k*kW - b.gapR*1.5 - (b.ag.voidA > W*H*.02 ? 300 : 0) + (sold ? o.n*42 + Math.min(b.cell.len, 260)*.3 + (o.arr === 'A' ? 15 : 0) : b.dark.nb*55 + (b.cell ? 110 + b.cell.n*35 : 0) - (b.dark.voidA > W*H*.02 ? 200 : 0));
      if(!pick || sc > pick.sc) pick = {o, k, sc}; }
    let h = CSS; const B = pick && (build(pick.k, pick.o) || build(.6, pick.o));
    if(!B){ T.done(); return sq ? null : h; }
    const dw = B.dw, R0 = pick.o.arr === 'R';
    // the house takes the room the tiles leave: up to its own shape; then a row of room tiles when the rest holds one; what is still
    // left opens the tiles evenly
    const rm = room(B), HF = heroFit(rm) || {hw: w0, ph: rm, sw: 0}; let ph = HF.sw ? HF.ph : Math.max(mn, Math.min(rm, nat)), spare = Math.max(0, rm - ph), rowH = 0;
    if(!story && !HF.sw && spare >= 62*f + g && X.left() >= 2){ rowH = spare - g; spare = 0; }
    else if(!HF.sw){ const add = Math.min(spare, Math.max(0, X.max(w0) - ph)); ph += add; spare -= add; }
    const heroAt = y => X.hero(m, y, HF.hw, ph) + (HF.sw ? X.col(m + HF.hw + g, y, HF.sw, ph, ph/HF.sw > 1.7 ? 2 : 1, g) : '');
    const ex = spare/B.rows.length, R = B.rows.map(v => v + ex);
    const body = (y, from) => { let i = 1;
      if(!sold){ if(from === 0){ h += B.main.html(m, y, R[0]); y += R[0] + g; }
        if(R0){ h += B.dark.html(m, y, R[1]); y += R[1] + g; h += B.ag.html(m, y, R[2]); y += R[2] + g; i = 3; }
        else { h += B.dark.html(m, y, R[1]) + B.ag.html(m + dw + g, y, R[1]); y += R[1] + g; i = 2; }
        if(B.cell){ h += B.cell.html(m, y, R[i]); y += R[i] + g; } }
      else { if(from === 0){ h += B.st.html(m, y, R[0]); y += R[0] + g; }
        if(pick.o.arr === 'A'){ h += B.cell.html(m, y, R[1]); y += R[1] + g; h += B.ag.html(m, y, R[2]); y += R[2] + g; }
        else { h += B.cell.html(m, y, R[1]) + B.ag.html(m + dw + g, y, R[1]); y += R[1] + g; } }
      return y; };
    let y = m;
    if(story || !sold){ h += heroAt(y); y += ph + g; if(rowH){ h += X.rooms(m, y, w0, rowH, 2, g); y += rowH + g; } y = body(y, 0); }
    else { h += B.st.html(m, y, R[0]); y += R[0] + g; h += heroAt(y); y += ph + g; if(rowH){ h += X.rooms(m, y, w0, rowH, 2, g); y += rowH + g; } y = body(y, 1); }
    if(story && H - m - y >= 40*f) h += X.rooms(m, y, w0, H - m - y, 2, g);
    T.done();
    return h;
  };

  // ================= square, wide (X), Google Business Profile: the postcard fronts =================
  // Just Listed: two columns of tiles. Left: the house tile (over room tiles where the column is tall), the dark tile under it. Right:
  // the main-color tile (JUST / LISTED, the bar, the four ruled facts; on the wide shapes the word on one line and the facts two to a
  // line), the tint tile under it.
  // Just Sold, the arrangement that keeps the house the largest tile and holds a real note:
  //   'top'  JUST SOLD across the full-width tile; under it the house at the left, the white cell and the tint tile at the right
  //   'base' the same tile; under it the house beside the tint tile; the white cell across the foot
  //   'col'  the JUST SOLD tile over the house in the left column; the white cell and the tint tile in the right column
  const card = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f} = T, X = photoKit(D, f), sold = D.piece.moment === 'js';
    const m = r2(Math.min(W, H)*.032), g = r2(Math.min(W, H)*.016), w0 = W - 2*m, h0 = H - 2*m, A0 = W*H;
    let h = CSS, pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
    const FRS = [.7, .66, .62, .58, .55, .52, .5, .48, .47];   // the house column: never under 45% of the image's width
    // the photo tiles of a column pw wide with hL to fill: the block, or the house at its tallest with the rest handed back (rest > 0)
    const photos = (pw, hL) => { const mn = X.min(pw); if(hL < mn - .5) return null; const pb = X.block(pw, hL, g); if(pb) return {pb, hh: hL, rest: 0, heroH: pb.heroH};
      const hh = X.max(pw); return {pb: {heroH: hh, rooms: 0, html: (x, y) => X.hero(x, y, pw, hh)}, hh, rest: hL - hh, heroH: hh}; };
    if(!sold){
      const two = NF => {
      for(const fr of FRS){ const pw = Math.round(w0*fr), cw = w0 - g - pw, nat = X.nat(pw);
        for(const k of KC){
          const mains = [{wk: 1}, {wk: .85}, {wk: .7}, {one: 1}, {one: 1, wk: .82}, {cols: 2}, {cols: 2, wk: .8}, {one: 1, cols: 2}, {one: 1, cols: 2, wk: .82}, {one: 1, cols: 2, tight: 1}, {one: 1, cols: 2, tight: 1, wk: .8}].map(o => mainCol(T, cw, k, Object.assign({nf: NF}, o))).filter(q => q && q.nf === NF);
          const ags = ['stack', 'row'].map(mode => agentTile(T, D, cw, k, mode)).filter(Boolean); if(!mains.length || !ags.length) continue;
          const darks = [[3, 1], [3, 0], [2, 1], [2, 0], [0, 0], [0, 0, 1]].filter(v => v[0] <= T.hl.length);
          for(const main of mains) for(const ag of ags){ const slackR = h0 - main.h - g - ag.h; if(slackR < -.5) continue;
            for(const [nb, side, big] of darks){ const dark = darkTile(T, D, pw, k, {nb, side, big, smax: main.s*.92, area: A0}); if(!dark) continue;
              const P = photos(pw, h0 - g - dark.h); if(!P) continue;
              take({pw, cw, ag, main, dark, P, slackR, sc: pw*Math.min(P.heroH, nat)/A0*1700 + dark.nb*36 + k*45 + main.s*(main.one ? 1.4 : .9) - (main.cols > 1 ? 30 : 0) + dark.s*.4 + ag.logoH*1.2
                - (ag.voidA > A0*.02 ? 300 : 0) - (dark.voidA > A0*.018 ? 300 : 0) - (main.voidA > A0*.024 ? 300 : 0) - slackR*1.8 - P.rest*2.5 - (P.rest > H*.07 ? 300 : 0) - (P.pb.rooms ? 20 : 0)}); } } } } };
      // 'strip' (a street too long for the house column at its size): the dark tile across the foot (the street on one line, the city
      // line under it, the logo at its end); over it the house, the main-color tile and the tint tile (the headshot, the lines)
      const strip = NFS => { const pad = r2(9*f*.6), street = String(D.listing.address || ''), place = OHL.place(D.listing), LGH = r2(T.FB*1.7), lw = r2(LGH*4.2), iw = w0 - 2*pad, tw = iw - lw - 2*pad;
        const as = T.one(street, F.hl, tw, T.FE*1.4, T.FE), ps = T.FS, PL = as ? T.plf(place, ps, tw) : null, gI = r2(5*f*.7);
        if(as && PL){ const inner = Math.max(as*CAP + gI + ps*1.3, LGH), sh = 2*pad + inner, hT = h0 - g - sh;
          for(const NF of NFS){ if(pick) break;
            for(const fr of FRS){ const pw = Math.round(w0*fr), cw = w0 - g - pw, P = photos(pw, hT); if(!P || P.rest > 2) continue;
              for(const k of KC){ const ag = agentTile(T, D, cw, k, 'row', {nologo: 1}); if(!ag) continue;
                const mains = [{one: 1, cols: 2}, {one: 1, cols: 2, wk: .8}, {one: 1, cols: 2, wk: .66}, {one: 1, cols: 2, tight: 1}, {one: 1, cols: 2, tight: 1, wk: .8}, {one: 1, cols: 2, tight: 1, wk: .66}, {one: 1}, {wk: .8}].map(o => mainCol(T, cw, k, Object.assign({nf: Math.min(NF, T.parts.length)}, o))).filter(q => q && q.nf === Math.min(NF, T.parts.length) && q.s > as*1.05);
                for(const main of mains){ const slackR = hT - main.h - g - ag.h; if(slackR < -.5) continue;
                  take({strip: {pad, street, place, as, ps, PL, gI, inner, sh, hT, LGH, lw}, pw, cw, ag, main, P, slackR, sc: pw*Math.min(P.heroH, X.nat(pw))/A0*1700 + k*45 + main.s - slackR*1.8}); } } } } } };
      // the four facts first: in two columns, else over the strip; fewer facts only where neither holds four
      const NP = Math.min(4, T.parts.length); two(NP); if(!pick) strip([NP]); for(const n of [3, 2].filter(v => v < NP)){ if(!pick) two(n); if(!pick) strip([n]); } if(!pick) strip([0]);
      if(pick && pick.strip){ const {pw, cw, ag, main, P, slackR, strip: Z} = pick, AG = grown(ag, kk => agentTile(T, D, cw, kk, 'row', {nologo: 1}), ag.h + slackR), ah = AG.h + (Z.hT - g - main.h - AG.h)*.5, mh = Z.hT - g - ah, sy = m + Z.hT + g, y0 = sy + Z.pad, th = Z.as*CAP + Z.gI + Z.ps*1.3;
        h += P.pb.html(m, m) + main.html(m + pw + g, m, mh) + AG.html(m + pw + g, m + mh + g, ah) + tile('dark', m, sy, w0, Z.sh)
          + hl('address', Z.street, m + Z.pad, y0 + (Z.inner - th)/2, w0 - 2*Z.pad - Z.lw - Z.pad, Z.as, OND) + line('place', Z.place, m + Z.pad, y0 + (Z.inner - th)/2 + Z.as*CAP + Z.gI, w0 - 2*Z.pad - Z.lw - Z.pad, Z.ps, 1.3, Z.PL, ACD, {small: 1})
          + `<div class="abs pgs-logo r" style="left:${m + w0 - Z.pad - Z.lw}pt;top:${y0 + (Z.inner - Z.LGH)/2}pt;width:${Z.lw}pt;height:${Z.LGH}pt;color:${OND}">${OHL.logo(D, 'dark', '')}</div>`; }
      else if(pick){ const {pw, cw, ag, main, dark, P, slackR} = pick, AG = grown(ag, kk => agentTile(T, D, cw, kk, ag.mode), ag.h + slackR), left = h0 - g - main.h - AG.h, ah = AG.h + left*(AG.hs ? .5 : .15), mh = h0 - g - ah, dh = dark.h + P.rest;
        h += P.pb.html(m, m) + dark.html(m, m + P.hh + g, dh) + main.html(m + pw + g, m, mh) + AG.html(m + pw + g, m + mh + g, ah); }
    } else {
      const noteSc = c => Math.min(c.len, 240)*.9 - (c.len < 46 ? 150 : 0) + (c.n >= 2 ? 120 : 40) - Math.max(0, c.n - 5)*80 - (c.two ? 60 : 0) - (c.noq ? 160 : 0) + c.s*2;
      const tiles = [];
      for(const wk of [1, .9]) for(const kt of [1, .7, .5]) for(const cb of (shape === 'gbp' ? [0, 1] : [0])){ const t = soldTile(T, D, w0, kt, {wk, cb}); if(t && t.h <= H*.5 && (!cb || t.cb)) tiles.push(t); }
      for(const cf of [.2, .16, .13, .11, .095, .085, .075]){ const t = soldTile(T, D, w0, 1, {mode: 'beside', capH: H*cf}) || soldTile(T, D, w0, .7, {mode: 'beside', capH: H*cf}) || soldTile(T, D, w0, .5, {mode: 'beside', capH: H*cf}); if(t && t.h <= H*.36) tiles.push(t); }
      console.log('DBG tiles', tiles.map(t => Math.round(t.h) + '/' + t.s).join(' '), [.085, .075].map(cf => [1, .7, .5].map(kt => { const t = soldTile(T, D, w0, kt, {mode: 'beside', capH: H*cf}); return t ? Math.round(t.h) : 'x'; }).join(',')).join(' ; '));
      const uniq = tiles.filter((t, i, a) => a.findIndex(q => Math.abs(q.h - t.h) < 4 && Math.abs(q.s - t.s) < 3 && !q.cb === !t.cb) === i);
      for(const fr of FRS){ const pw = Math.round(w0*fr), cw = w0 - g - pw, nat = X.nat(pw);
        for(const k of KC){ const ags = ['stack', 'row', 'tower'].map(mode => agentTile(T, D, cw, k, mode)).filter(Boolean); if(!ags.length) continue;
          const cells = (ag, room) => [Q, ''].map(head => cellTile(T, cw, k, {kind: 'sold', head, cands: soldCands(T), room})).filter(c => c && c.h <= room + .5);
          // 'top' and 'base': the full-width tile
          for(const st of uniq){ const h1 = h0 - st.h - g, P = photos(pw, h1); if(!P) continue;
            const base = (shape === 'gbp' && st.voidA > A0*.025 ? -300 : 0) + pw*Math.min(P.heroH, nat)/A0*1700 + st.s*CAP/H*2600 + k*45 - P.rest*4 - (P.rest > 2 ? 400 : 0) - (pw*P.heroH < w0*st.h ? 250 : 0);
            for(const ag of ags){ for(const cell of cells(ag, h1 - g - ag.h)){ const slack = h1 - g - ag.h - cell.h;
                take({v: 'top', st, pw, cw, ag, cell, P, h1, slack, sc: base + noteSc(cell) + ag.logoH*1.2 - (ag.voidA > A0*.02 ? 300 : 0) - slack*2.2}); }
              for(const n of [4, 3, 2]){ const cell = cellTile(T, w0, k, {kind: 'sold', head: Q, cands: soldCands(T), lines: n, min: n}); if(!cell) continue;
                const mid = h1 - g - cell.h, P2 = photos(pw, mid); if(!P2 || ag.h > mid + .5) continue;
                take({v: 'base', st, pw, cw, ag, cell, P: P2, mid, sc: (shape === 'gbp' && st.voidA > A0*.025 ? -300 : 0) + pw*Math.min(P2.heroH, nat)/A0*1700 + st.s*CAP/H*2600 + k*45 - P2.rest*4 - (P2.rest > 2 ? 400 : 0) - (pw*P2.heroH < w0*st.h ? 250 : 0)
                  + noteSc(cell) + ag.logoH*1.2 - (mid - ag.h)*(ag.mode === 'tower' ? .6 : 2) - (ag.mode !== 'tower' && cw*(mid - ag.h) > A0*.02 ? 300 : 0)}); } } }
          // 'col': the tile over the house
          for(const kt of [1, .7, .5]){ const st = soldTile(T, D, pw, kt, {}); if(!st) continue; const P = photos(pw, h0 - st.h - g); if(!P) continue;
            for(const ag of ags) for(const cell of cells(ag, h0 - g - ag.h)){ const slack = h0 - g - ag.h - cell.h;
              take({v: 'col', st, pw, cw, ag, cell, P, slack, sc: pw*Math.min(P.heroH, nat)/A0*1700 + st.s*CAP/H*2600 + k*45 - P.rest*2.5 - (P.rest > H*.07 ? 300 : 0) - (pw*P.heroH < pw*st.h ? 250 : 0)
                + noteSc(cell) + ag.logoH*1.2 - (ag.voidA > A0*.02 ? 300 : 0) - slack*2.2 - 30}); } } } }
      // last resort (a street so long that the tiles leave the note no room at its size): the tile, the house, who to call
      if(!pick) for(const st of uniq){ const h1 = h0 - st.h - g; for(const fr of FRS){ const pw = Math.round(w0*fr), cw = w0 - g - pw, P = photos(pw, h1); if(!P || P.rest > 2) continue;
        for(const k of KC) for(const mode of ['stack', 'row', 'tower']){ const ag = agentTile(T, D, cw, k, mode); if(ag && ag.h <= h1 + .5) take({v: 'solo', st, pw, cw, ag, P, h1, sc: pw*P.heroH/A0*1700 + st.s*CAP/H*2600 + k*45 + ag.logoH - Math.max(0, h1 - ag.h)*2 - (ag.voidA > A0*.02 ? 300 : 0)}); } } }
      if(!pick) console.log('DBG solo', uniq.map(t => Math.round(t.h) + '/' + t.s).join(' '), FRS.map(fr => { const pw = Math.round(w0*fr), cw = w0 - g - pw; return fr + ':' + uniq.map(st => { const P = photos(pw, h0 - st.h - g); return P ? Math.round(P.rest) : 'x'; }).join(',') + ' ag ' + ['stack', 'row'].map(mo => { const a = agentTile(T, D, cw, .5, mo); return a ? Math.round(a.h) : 'x'; }); }).join(' | '));
      if(pick && pick.v === 'solo'){ const {st, pw, cw, ag, P, h1} = pick, y1 = m + st.h + g;
        // (a tile for who to call much shorter than the column at its largest: a row of room tiles stands under it, so no wide empty
        // band opens above and below the agent's lines)
        const mk = kk => agentTile(T, D, cw, kk, ag.mode), A1 = grown(ag, mk, h1), n = cw >= 100*f ? 2 : 1, tw = (cw - (n - 1)*g)/n, rL = h1 - P.heroH - g, fL = rL > 8 ? [1.6, 1.3, 1.15, 1, .9, .8, .7, .6, .5].map(mk).find(t => t && t.h <= h1 - rL - g + .5) : null, rh = fL ? rL : Math.min(h1 - ag.h - g, tw/1.1);   // (level with the house's own room row where the tile fits above it)
        // (where the tile cannot come down to the house's height, the house grows to the tile's, within its own shape, so the two
        // room rows still start and end level)
        const aMin = fL ? null : Math.min(...[1.6, 1.3, 1.15, 1, .9, .8, .7, .6, .5].map(mk).filter(Boolean).map(t => t.h)), nL = P.pb.rooms;
        const lift = !fL && nL && rL > 8 && aMin > P.heroH && aMin <= X.max(pw) + .5 && h1 - aMin - g >= Math.max(tw/2.4, (pw - (nL - 1)*g)/nL/2.4) ? aMin : 0;
        if(lift && cw*(h1 - A1.h) > W*H*.04 && X.left() >= nL + n){ const rh2 = h1 - lift - g;
          h += st.html(m, m, st.h) + X.hero(m, y1, pw, lift) + X.rooms(m, y1 + lift + g, pw, rh2, nL, g) + grown(ag, mk, lift).html(m + pw + g, y1, lift) + X.rooms(m + pw + g, y1 + lift + g, cw, rh2, n, g); }
        else if(cw*(h1 - A1.h) > W*H*.04 && rh >= tw/2.4 && X.left() >= n){ const ah = h1 - rh - g; h += st.html(m, m, st.h) + P.pb.html(m, y1) + (fL || grown(ag, mk, ah)).html(m + pw + g, y1, ah) + X.rooms(m + pw + g, y1 + ah + g, cw, rh, n, g); }
        else h += st.html(m, m, st.h) + P.pb.html(m, y1) + A1.html(m + pw + g, y1, h1); }
      else if(pick){ const {v, st, pw, cw, ag, cell, P} = pick, rx = m + pw + g;
        const AG = hh => grown(ag, kk => agentTile(T, D, cw, kk, ag.mode), hh), CW = v === 'base' ? w0 : cw, CL = hh => grown(cell, kk => { const c = cellTile(T, CW, kk, {kind: 'sold', head: cell.noq ? '' : Q, cands: soldCands(T), room: hh}); return c && c.len >= cell.len && c.two === cell.two ? c : null; }, hh);
        if(v === 'col'){ const sh = st.h + P.rest, ch = cell.h + pick.slack*.55;
          h += st.html(m, m, sh) + P.pb.html(m, m + sh + g) + CL(ch).html(rx, m, ch) + AG(h0 - ch - g).html(rx, m + ch + g, h0 - ch - g); }
        else if(v === 'base'){ const y1 = m + st.h + g;
          h += st.html(m, m, st.h) + P.pb.html(m, y1) + AG(pick.mid).html(rx, y1, pick.mid) + cell.html(m, y1 + pick.mid + g, cell.h); }
        else { const y1 = m + st.h + g, ch = cell.h + pick.slack*.55;
          h += st.html(m, m, st.h) + P.pb.html(m, y1) + CL(ch).html(rx, y1, ch) + AG(pick.h1 - ch - g).html(rx, y1 + ch + g, pick.h1 - ch - g); }
      }
    }
    T.done();
    return h;
  };
  PG.portrait = (D, L, W, H, shape) => tall(D, L, W, H, shape) || (shape === "square" ? card(D, L, W, H, shape) : "");   // post, pin, story and square: the house across the width (a square no tile stack fits: the postcard front)
  PG.landscape = card;

  // ================= carousel photo slides: the room as the big tile, the word tile and the dark street tile under it =================
  PG.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), {f} = T, sold = D.piece.moment === 'js', m = r2(W*.03), g = r2(W*.015), w0 = W - 2*m;
    const pad = r2(12*f), words = sold ? ['Just', 'Sold'] : ['Just', 'Listed'], s = r2(T.FE*2.1), ww = Math.max(...words.map(t => T.tw(t, F.hl(s)))), mw = Math.round(ww + 2*pad + 2), dw = w0 - g - mw;
    const barH = Math.max(1.5, r2(s*.035)), inner = stackH(2, s) + r2(7*f) + barH, rh = Math.round(inner + 2*pad), ty = H - m - rh;
    const dark = darkTile(T, D, dw, 1, {nb: 0, smax: s*.92}) || darkTile(T, D, dw, .6, {nb: 0, smax: s*.92});
    let h = CSS + OHL.photo(D, D.piece.photo, `left:${m}pt;top:${m}pt;width:${w0}pt;height:${ty - g - m}pt`);
    h += tile('main', m, ty, mw, rh) + stack('moment', words, m + pad - s*.02, ty + pad, ww + 4, s, ONM) + rect(m + pad, ty + pad + stackH(2, s) + r2(7*f), Math.min(ww*.5, s*.58), barH, `background:${ONM};opacity:.6`);
    h += dark ? dark.html(m + mw + g, ty, rh) : tile('dark', m + mw + g, ty, dw, rh);
    T.done();
    return h;
  };
  window.PGSocial = PG;
})();
