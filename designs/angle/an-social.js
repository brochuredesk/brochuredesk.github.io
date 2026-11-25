/* templates/angle/an-social.js: Angle's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on piece matches
   its set's main pieces). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and replaces its three layouts for this
   set only; nothing shared changes.

   Read off the approved Angle pieces (postcard.html, flyer.html, foldover.html, an-tokens.css, an-marks.css):
     - the brand's main color as the field everywhere; every photo cut on the one slant (higher at the right) with the thick accent
       stripe along the cut: the house's inner edge leaning beside the words (the postcard fronts), or its foot cut across the image
       with the street set on the same tilt under it (the flyer front)
     - JUST / LISTED stacked in giant Asap Condensed 700 caps, white over the accent (the Just Listed postcard)
     - JUST SOLD in the on-accent color on the leaning accent slab (the Just Sold postcard), always far larger than the agent
     - the place in small tracked accent caps; the facts as condensed numerals with small accent caps labels, parted by leaning
       accent slashes (the postcard) or stacked beside one long leaning rule (the flyer); highlights on leaning accent ticks
     - Just Sold: "Thinking about selling?" in accent condensed caps and the agent's note beside the thin accent bar
     - the brand's dark color as the foot band, its head leaning with the accent stripe along it, carrying the agent and the one logo
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house inside every cut
   (OHL.polyFits before any cut; the engine's house-cut check on every frame), text at the phone floors of
   templates/_shared/readsize.js (16 px word and street, 12 px body, 10 px small). */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const CO = "'Asap Condensed'", OF = "'Outfit'", TAN = Math.tan(14*Math.PI/180);
  const ON = 'var(--an-on)', ACC = 'var(--an-accent)', TAG = 'var(--an-tag)', ONTAG = 'var(--an-on-accent)', DEEP = 'var(--an-deep)', OND = 'var(--an-on-deep)', ACCD = 'var(--an-deep-accent)', RULE = 'var(--an-rule)';
  const Q = 'Thinking about selling?';
  const F = {
    word: s => `font:700 ${s}pt ${CO};text-transform:uppercase;letter-spacing:${(s*.007).toFixed(2)}pt`,
    street: s => `font:700 ${s}pt ${CO};letter-spacing:.2pt`,
    place: s => `font:600 ${s}pt ${OF};text-transform:uppercase;letter-spacing:${(s*.2).toFixed(2)}pt`,
    num: s => `font:700 ${s}pt ${CO}`,
    lab: s => `font:600 ${s}pt ${OF};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`,
    hl: s => `font:500 ${s}pt ${OF}`,
    q: s => `font:700 ${s}pt ${CO};text-transform:uppercase;letter-spacing:.3pt`,
    note: s => `font:400 ${s}pt ${OF}`,
    name: s => `font:700 ${s}pt ${CO}`,
    phone: s => `font:600 ${s}pt ${OF}`,
  };
  const CSS = `<style>
    .ss .ans-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:flex-end}
    .ss .ans-logo.c .logo{justify-content:center}
    .ss .ans-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .ans-logo .text{font:700 12pt/1.15 ${CO};text-align:right;color:inherit}
    .ss .ans-hs{position:absolute;overflow:hidden}.ss .ans-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .ans-caps{position:absolute;white-space:nowrap}
    .ss .ans-row{position:absolute;white-space:nowrap}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2};
    const M = document.createElement('div'); document.body.appendChild(M);
    const tmemo = new Map();
    T.tw = (t, css) => { const key = t + '|' + css; if(tmemo.has(key)) return tmemo.get(key); M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:nowrap;${css}`; M.textContent = t; const v = M.getBoundingClientRect().width*.75; tmemo.set(key, v); return v; };
    // a paragraph at width w: its line count and each line's width (pt)
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
  // Asap Condensed's capitals, measured on the page: the cap height and where the baseline falls in a line box as tall as the type
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = `700 200px ${CO}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:700 200px ${CO};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}; return MET; };
  const capH = s => met().cap*s;
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  // one line of capitals set by its ink: the top of the letters at y (w: the room; align right sets it against the room's right end)
  const caps = (slot, t, x, y, w, s, color, face, align) => { const m = met(), base = m.base*s;
    return `<div class="ans-caps" data-slot="${slot}" data-lines="1" style="left:${x}pt;top:${y - (base - m.cap*s)}pt;width:${w}pt;height:${s}pt;${(face || F.word)(s)};line-height:${s}pt;color:${color};text-align:${align || 'left'}">${esc(t)}</div>`; };
  // a filled shape in page points
  const poly = (W, H, pts, fill) => `<svg class="abs" style="left:0;top:0;width:${W}pt;height:${H}pt;overflow:visible;pointer-events:none" viewBox="0 0 ${W} ${H}"><polygon points="${pts.map(p => p.map(v => v.toFixed(2)).join(',')).join(' ')}" style="fill:${fill}"/></svg>`;
  // a thin leaning mark (the slash between facts, the tick before a highlight, the long rule beside the stacked facts)
  const lean = (x, y, w, h, color) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;background:${color};transform:skewX(-14deg)"></div>`;

  // ---------- photos ----------
  const heroKit = (D, f) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, full = Ivory.fullHouse(D, id), hb = HP.house && full ? HP.house : null;
    const sup = n => window.OHEmail ? OHEmail.support(D, id, n) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)).slice(0, n);
    const X = {id, pAR, sup,
      nat: w => Math.ceil(w/pAR),
      min: w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)),
      max: w => Math.ceil(hb ? Math.max(w/pAR, w/((hb.right - hb.left + .08)*pAR)) : w/pAR),
      // a frame taller than the photo's own shape centers on the house
      center: (w, h) => { if(hb && h > w/pAR){ const vis = w/(h*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } },
      // the foot cut (rising to the right) on a frame w x h: the largest rise up to vMax that keeps the whole house; 0 = a straight foot
      footCut: (w, h, vMax) => { X.center(w, h); for(let v = vMax; v >= 8; v -= 2) if(OHL.polyFits(D, id, w, h, [[0, 0], [1, 0], [1, 1 - v/h], [0, 1]], .015)) return v; return 0; },
      foot: (x, y, w, h, v) => { X.center(w, h); const st = `left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt`; return v ? OHL.maskedPhoto(D, id, st, [[0, 0], [1, 0], [1, 1 - v/h], [0, 1]]) : OHL.photo(D, id, st); },
      // the leaning inner edge (the frame's left edge, its head vMax to the right of its foot at most) on a frame w x h: the largest
      // lean that keeps the whole house, the house then centered in the room the lean leaves; null when the house does not fit the frame
      lean: (w, h, vMax) => {
        if(!full) return {v: vMax, fx: null};
        if(!hb) return OHL.polyFits(D, id, w, h, [[0, 0], [1, 0], [1, 1], [0, 1]], .015) ? {v: 0, fx: null} : null;
        const iw = Math.max(w, h*pAR), ih = iw/pAR, slack = iw - w, keep = HP.focusX;
        if(hb.bottom*ih > h - 2) return null;
        let best = null;
        const vs = []; for(let v = vMax; v >= 6; v -= 2) vs.push(v); vs.push(0);
        for(const v of vs){ const pg = [[v/w, 0], [1, 0], [1, 1], [0, 1]];
          for(let fx = 0; fx <= 100; fx += (slack > 1 ? 4 : 100)){ HP.focusX = fx; if(!OHL.polyFits(D, id, w, h, pg, .02)) continue;
            const b = OHL.houseInFrame(D, id, w, h), l0 = v/w*(1 - b.top), off = Math.abs((b.left - l0) - (1 - b.right));
            if(!best || off < best.off) best = {v, fx, off}; }
          if(best) break; }
        HP.focusX = keep; return best; },
      side: (x, y, w, h, ln) => { if(ln.fx != null) HP.focusX = ln.fx; const st = `left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt`; return ln.v ? OHL.maskedPhoto(D, id, st, [[ln.v/w, 0], [1, 0], [1, 1], [0, 1]]) : OHL.photo(D, id, st); },
      photo: (pid, x, y, w, h) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt`),
      row: (x, y, w, h, n, gap) => { const key = p => String(p).replace(/[\d_-]+$/, '').slice(0, 5), ids = []; for(const p of sup(10)){ if(ids.length < n && !ids.some(q => key(q) === key(p))) ids.push(p); } if(!ids.length || h < 30) return ''; const pw = (w - (ids.length - 1)*gap)/ids.length; return ids.map((p, i) => X.photo(p, x + i*(pw + gap), y, pw, h)).join(''); }};
    return X;
  };

  // ---------- the words ----------
  // the facts as the postcards print them: a numeral and its small caps label
  const factItems = Li => { const out = [], n = v => Number(v).toLocaleString('en-US'), part = t => { const m = /^([\d,]+(?:\.\d+)?½?)\s+(.*)$/.exec(String(t)); return m ? {n: m[1], l: m[2]} : null; };
    if(Li.beds) out.push({n: String(Li.beds), l: Li.beds == 1 ? 'Bed' : 'Beds'});
    if(Li.baths){ const bt = window.BD && BD.bathsText ? BD.bathsText(Li) : {main: `${Li.baths} Baths`}, a = part(bt.main), b = bt.half ? part(bt.half) : null; if(a) out.push(a); if(b) out.push(b); }
    if(Li.sqft) out.push({n: n(Li.sqft), l: 'Sq Ft'});
    const yr = Li.yearBuilt || Li.year; if(yr) out.push({n: String(yr), l: 'Built'});
    const lot = Li.lotSqft ? `${n(Li.lotSqft)} Sq Ft Lot` : Li.lotSize ? String(Li.lotSize) : '', lp = lot ? part(lot) : null; if(lp && /lot/i.test(lp.l)) out.push(lp);
    return out; };
  // the highlights the Just Listed postcard carries (no condition claims on a social)
  const highlights = D => [].concat((((((D.sw || {}).pc || {}).jl || {}).front || {}).highlights) || []).map(String).filter(t => t && !SocialSet.CONDITION.test(t));
  // the agent's own Just Sold note (the postcard's): every way its two sentences are written, fullest first, then with the closing line
  const notes = D => { const S = ((((((D.sw || {}).pc || {}).js || {}).front || {}).note || {}).s || []).map(x => [].concat(x).map(String)), cta = ((D.companion || {}).justSold || {}).ctaNext || '';
    const a = S[0] || [], b = S[1] || [], out = [];
    a.forEach(x => b.forEach(y => { out.push(x + ' ' + y); if(cta) out.push(x + ' ' + y + ' ' + cta); }));
    b.forEach(y => { if(cta) out.push(y + ' ' + cta); out.push(y); });
    return out.filter((t, i, l) => t && l.indexOf(t) === i && !SocialSet.CONDITION.test(t)).sort((p, q) => q.length - p.length); };

  // JUST / LISTED stacked, white over the accent (the Just Listed postcard): the second word as wide as w, sMax at most
  const stackW = (T, w, sMax) => { const [a, b] = SocialSet.M.toUpperCase().split(' '), s = T.one(b, F.word, w, sMax, T.FE); if(!s) return null;
    const pitch = s*.9, bw = Math.max(T.tw(a, F.word(s)), T.tw(b, F.word(s)));
    return {s, w: bw, jw: T.tw(a, F.word(s)), h: pitch + capH(s), html: (x, y, right) => { const al = right === 'center' ? 'center' : right ? 'right' : 'left'; return caps('moment', a, x, y, bw + 2, s, ON, null, al) + caps('moment', b, x, y + pitch, bw + 2, s, ACC, null, al); }}; };
  // JUST SOLD on the leaning accent slab (the Just Sold postcard), as wide as w at most
  const slab = (T, w, sMax) => { const t = SocialSet.M.toUpperCase();
    for(let s = Math.ceil(sMax*2)/2; s >= T.FE - .01; s -= .5){ const sh = s*1.16, d = sh*TAN/2, px = s*.24, tw = T.tw(t, F.word(s)), need = tw + 2*px + 2*d; if(need > w) continue;
      return {s, h: sh, w: need, html: (x, y, full) => `<div class="abs" style="left:${x + d}pt;top:${y}pt;width:${Math.max(need, full || 0) - 2*d}pt;height:${sh}pt;background:${TAG};transform:skewX(-14deg)"></div>` + caps('moment', t, x + d + px, y + (sh - capH(s))/2, tw + 2, s, ONTAG)}; }
    return null; };
  // the street, never shortened and never split: one line down to the floor size, else null.
  // Set inside a span, so the shared address pass (templates/_shared/addressfit.js) leaves it as written.
  const street = (T, Li, w, max, two) => { const t = Li.address, s = T.one(t, F.street, w, max, T.FE);
    if(s) return {t, s, n: 1, w: T.tw(t, F.street(s)), h: s*1.14};
    return null; };   // never split: a wider column or another arrangement serves
  const stTxt = (st, x, y, w, color) => txt('address', st.t, x, y, w, st.s, 1.14, F.street, color, {n: st.n, html: `<span>${esc(st.t)}</span>`});
  // the street and the place under it, set on the cut's tilt (the flyer front): the top left corner at (x, y), rising to the right
  const tilt = (T, Li, wMax, sMax, th, k) => { const cos = Math.cos(th), sin = Math.sin(th), tan = Math.tan(th), t = Li.address, place = OHL.place(Li);
    const s = T.one(t, F.street, wMax/cos - 6, sMax, T.FE) || T.one(t, F.street, wMax/cos - 6, T.FE, 9) || 9, L = T.tw(t, F.street(s)) + 2, hA = s*1.1;
    const ps = T.one(place, F.place, wMax/cos - 6, Math.max(T.FS, T.FS*1.05*Math.min(k, 1.3)), T.FS) || T.FS, LP = T.tw(place, F.place(ps)) + 2, hP = ps*1.3, tk = hA + hP;
    const rot = `transform:rotate(${(-th*180/Math.PI).toFixed(3)}deg);transform-origin:0 0`;
    return {s, ps, tk, L, LP,
      // where its lower edge runs at page x (the block's top left corner at x0, y0)
      low: (x0, y0, xq) => y0 - (xq - x0)*tan + tk/cos,
      // the level bands the overlap check reads a tilted line as (the middle of its bounding box): [x from, x to, lowest y]
      bands: (x0, y0) => [[x0, x0 + L*cos + hA*sin, (y0 - L*sin + y0 + hA*cos)/2 + s*.4],
        [x0 + hA*sin, x0 + hA*sin + LP*cos + hP*sin, (y0 + hA*cos - LP*sin + y0 + hA*cos + hP*cos)/2 + ps*.4]],
      html: (x, y) => txt('address', t, x, y, L, s, 1.1, F.street, ON, {html: `<span>${esc(t)}</span>`, css: rot})
        + txt('place', place, x + hA*sin, y + hA*cos, LP, ps, 1.3, F.place, ACC, {small: 1, css: rot})}; };
  // the facts in one row parted by leaning accent slashes (the postcard front); two rows where one cannot hold them
  const factsRow = (T, items, w, nMax, o) => { o = o || {};
    let tight = false; const labF = z => tight ? F.lab(z).replace(/letter-spacing:[^;]+/, `letter-spacing:${(z*.07).toFixed(2)}pt`) : F.lab(z);
    const wOf = (p, nf, lf) => T.tw(p.n, F.num(nf)) + nf*(tight ? .18 : .24) + T.tw(p.l.toUpperCase(), labF(lf)), lfOf = nf => r2(Math.max(T.FS, Math.min(nf*.46, T.FS*1.5)));
    const set = (list, nf) => { const lf = lfOf(nf), gap = nf*(tight ? .6 : .95), ws = list.map(p => wOf(p, nf, lf)); return {list, nf, lf, gap, ws, w: ws.reduce((a, b) => a + b, 0) + gap*(list.length - 1)}; };
    const min = r2(T.FB*1.15);
    const tryRows = (lists, nf0) => { for(let nf = Math.ceil(Math.max(nf0, min)*2)/2; nf >= min - .01; nf -= .5){ const R = lists.map(l => set(l, nf)); if(R.every(r => r.w <= w)) return R; } return null; };
    let R = null;
    for(let n = items.length; n >= Math.min(3, items.length) && !R; n--){ const l = items.slice(0, n), hf = Math.ceil(n/2);
      for(const tg of (n <= 4 ? [false, true] : [false])){ tight = tg; R = (o.rows === 2 ? null : tryRows([l], nMax)) || (n >= 3 && o.rows !== 1 ? tryRows([l.slice(0, hf), l.slice(hf)], nMax) : null); if(R) break; } }
    if(!R) return null;
    const nf = R[0].nf, lf = R[0].lf, rh = nf*1.22, rg = nf*.3, h = R.length*rh + (R.length - 1)*rg;
    return {h, n: R.reduce((a, r) => a + r.list.length, 0), rows: R.length, w: Math.max(...R.map(r => r.w)), nf, html: (x, y, ww, center) => { let s = '', i = 0;
      R.forEach((r, q) => { let xx = x + (center ? ((ww || w) - r.w)/2 : 0); const yy = y + q*(rh + rg);
        r.list.forEach((p, j) => { s += `<div class="ans-row" data-slot="facts.${i++}" data-lines="1" style="left:${xx}pt;top:${yy}pt;width:${r.ws[j] + 3}pt;height:${rh}pt;${F.num(nf)};line-height:${rh}pt;color:${ON}">${esc(p.n)}<span data-small="1" style="${labF(lf)};color:${ACC};margin-left:${(nf*(tight ? .18 : .24)).toFixed(2)}pt">${esc(p.l)}</span></div>`;
          xx += r.ws[j] + r.gap; if(j < r.list.length - 1) s += lean(xx - r.gap/2 - .8, yy + rh*.14, 1.6, rh*.74, TAG); }); });
      return s; }}; };
  // the facts stacked, numerals set against one line and the labels after them, the long leaning rule at their left (the flyer front)
  const factsCol = (T, items, w, hAvail, nMax) => { const min = r2(T.FB*1.15);
    for(let n = Math.min(items.length, 5); n >= Math.min(3, items.length); n--){ const l = items.slice(0, n);
      for(let nf = Math.ceil(Math.min(nMax, hAvail/(n*1.12))*2)/2; nf >= min - .01; nf -= .5){ const lf = r2(Math.max(T.FS, Math.min(nf*.42, T.FS*1.4))), nw = Math.max(...l.map(p => T.tw(p.n, F.num(nf)))), lw = Math.max(...l.map(p => T.tw(p.l.toUpperCase(), F.lab(lf)))), gp = nf*.26, rw = nf*.55;
        if(rw + nw + gp + lw > w) continue;
        const pitch = Math.min(nf*1.5, hAvail/n), hh = (n - 1)*pitch + nf*1.12;
        return {n, nf, w: rw + nw + gp + lw, h: hh, html: (x, y, ww, hBox, o) => { const x0 = x + ((ww || w) - (rw + nw + gp + lw))*(o && o.at != null ? o.at : .66), y0 = y + ((hBox || hh) - hh)/2, d = hh*TAN/2;
          let s = lean(x0 + rw*.2 - .7, y0, 1.5, hh, TAG);
          l.forEach((p, i) => { s += `<div class="ans-row" data-slot="facts.${i}" data-lines="1" style="left:${x0 + rw}pt;top:${y0 + i*pitch}pt;width:${nw + gp + lw + 3}pt;height:${nf*1.12}pt;${F.num(nf)};line-height:${nf*1.12}pt;color:${ON}"><span style="display:inline-block;width:${nw.toFixed(2)}pt;text-align:right">${esc(p.n)}</span><span data-small="1" style="${F.lab(lf)};color:${ACC};margin-left:${gp.toFixed(2)}pt">${esc(p.l)}</span></div>`; });
          return s; }}; } }
    return null; };
  // the same facts two to a row beside the leaning rule: a column too wide and too short for the stack of four
  const factsGrid = (T, items, w, hAvail) => { const l = items.slice(0, 4), min = r2(T.FB*1.15); if(l.length < 4) return null;
    for(let nf = Math.ceil(Math.min(T.FE*2.8, hAvail/2.35)*2)/2; nf >= min - .01; nf -= .5){ const lf = r2(Math.max(T.FS, Math.min(nf*.42, T.FS*1.4))), gp = nf*.26, rw = nf*.55, gc = nf*.9;
      const cell = p => T.tw(p.n, F.num(nf)) + gp + T.tw(p.l.toUpperCase(), F.lab(lf)), c1 = Math.max(cell(l[0]), cell(l[2])), c2 = Math.max(cell(l[1]), cell(l[3])), tot = rw + c1 + gc + c2;
      if(tot > w) continue;
      const pitch = Math.min(nf*1.6, hAvail/2), hh = pitch + nf*1.12;
      return {n: 4, nf, w: tot, h: hh, html: (x, y, ww, hBox) => { const x0 = x + ((ww || w) - tot)/2, y0 = y + ((hBox || hh) - hh)/2; let s = lean(x0 + rw*.2 - .7, y0, 1.5, hh, TAG);
        l.forEach((p, i) => { const cx = x0 + rw + (i % 2 ? c1 + gc : 0), cy = y0 + (i >> 1)*pitch;
          s += `<div class="ans-row" data-slot="facts.${i}" data-lines="1" style="left:${cx}pt;top:${cy}pt;width:${cell(p) + 3}pt;height:${nf*1.12}pt;${F.num(nf)};line-height:${nf*1.12}pt;color:${ON}">${esc(p.n)}<span data-small="1" style="${F.lab(lf)};color:${ACC};margin-left:${gp.toFixed(2)}pt">${esc(p.l)}</span></div>`; });
        return s; }}; }
    return null; };
  // the highlights, each on a leaning accent tick (the postcard front)
  const ticks = (T, list, w, k, maxN) => { const hs0 = r2(Math.max(T.FB, T.FB*1.05*k)), tkW = r2(hs0*.36), gp = hs0*.6;
    const use = list.filter(t => T.tw(t, F.hl(T.FB)) <= w - tkW - gp).slice(0, maxN); if(!use.length) return null;
    const hs = Math.min(...use.map(t => T.one(t, F.hl, w - tkW - gp - 2, hs0, T.FB))), rh = hs*1.6;
    return {n: use.length, h: use.length*rh, hs, html: (x, y, hBox) => { const p = hBox ? hBox/use.length : rh;
      return use.map((t, i) => lean(x + hs*.12, y + i*p + (p - hs*.9)/2, tkW, hs*.9, TAG) + txt('hl.' + i, t, x + tkW + gp, y + i*p + (p - hs*1.3)/2, w - tkW - gp, hs, 1.3, F.hl, ON)).join(''); }}; };
  // a paragraph beside the thin accent bar (the flyer's write-up, the Just Sold note): the fullest text of `pool` in maxN lines or fewer,
  // every line 80%+ of its measure and the last 90%+ (the measure narrowed a little or the type raised up to 12% to get there)
  const barText = (T, slot, pool, w, s0, maxN, minN) => { const bw = r2(Math.max(2.5, 3*T.f)), gp = r2(8*T.f), iw = w - bw - gp; let best = null;
    // a wide measure stays full (a narrowed block would leave the side empty); only a narrow column may narrow further
    for(const ms of (iw >= 170*T.f ? [[1, .97, .94, .91], [.88, .85, .82]] : [[1, .96, .92, .88, .84, .8]])){ if(best) break;
    for(let n = maxN; n >= (minN || 1); n--) for(const m of ms) for(const s of [s0, r2(s0*1.06), r2(s0*1.12), r2(s0*1.18)]) for(const t of pool){
      const r = T.rows(t, F.note(s), iw*m, s*1.42); if(r.n !== n) continue;
      if(n === 1 ? r.wide < .88*iw*m : (r.last < .9*iw*m || r.ws.slice(0, -1).some(x => x < .85*iw*m))) continue;
      const sc = t.length*1.2 + n*14 + m*260 - (s - s0)*3; if(!best || sc > best.sc) best = {t, n, s, w: iw*m, sc, just: n > 1 && m >= .97 && r.ws.slice(0, -1).every(x => x >= .95*iw*m)}; } }
    if(!best) return null;
    const h = best.n*best.s*1.42 + (best.n > 1 ? best.s*.15 : 0);
    return {h, n: best.n, len: best.t.length, html: (x, y) => rect(x, y + best.s*.2, bw, h - best.s*.4, `background:${TAG}`)
      + txt(slot, best.t, x + bw + gp, y, best.w, best.s, 1.42, F.note, ON, {n: best.n, css: best.just ? 'text-align:justify;text-align-last:left' : ''})}; };
  // the writer's lines for Just Listed: sentences in the writer's order (the first always kept), none that says a shown highlight again
  const sig = t => String(t).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(x => x.length >= 4 && !/^(with|this|that|from|into|over|have|were|been)$/.test(x));
  const writePool = (D, shownHl) => { const hl = (shownHl || []).map(sig);
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing)).filter(t => { const w = new Set(sig(t)); return !hl.some(h => { const c = h.filter(x => w.has(x)).length; return c >= 2 || (h.length && c >= h.length/2); }); }).slice(0, 7);
    const out = [], near = /\bmiles?\b/i;
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 5) continue; out.push(pk.join(' ')); }
    return out.sort((a, b) => (near.test(b) ? 60 : 0) + b.length - (near.test(a) ? 60 : 0) - a.length); };
  // Just Sold: the question in accent condensed caps, on one line (w) or two
  const question = (T, w, sMax, two) => { const one = two ? null : T.one(Q, F.q, w, sMax, T.FB);
    const ls = one ? [Q] : ['Thinking about', 'selling?'], s = one || Math.min(...ls.map(t => T.one(t, F.q, w, sMax, T.FB) || 0)); if(!s) return null;
    const lh = s*1.06;
    return {s, n: ls.length, h: (ls.length - 1)*lh + capH(s), w: Math.max(...ls.map(t => T.tw(t, F.q(s)))), html: (x, y) => ls.map((t, i) => caps('sold.q', t, x, y + i*lh, T.tw(t, F.q(s)) + 2, s, ACC, F.q)).join('')}; };

  // ---------- the foot band: the brand's dark, its head leaning with the accent stripe along it, the agent and the one logo ----------
  // o.line: the name and the phone on one line (a short image, where two lines would take too much of the height)
  const agentBand = (D, T, W, k0, pad, o) => { o = o || {};
    const A = D.agent || {}, f = T.f, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || '');
    const bv = r2(Math.min(W*.03, (o.H || 9999)*.04)), sb = r2(Math.max(3.5, W*.012)), gap = r2(10*f), lab = A.phoneLabel || 'Call / Text';
    const tone = getComputedStyle(document.documentElement).getPropertyValue('--an-on-deep').trim().toLowerCase() === '#161616' ? 'light' : 'dark';
    const shell = (y0, hh) => poly(W, y0 + hh, [[0, y0 + bv], [W, y0], [W, y0 + sb], [0, y0 + bv + sb]], TAG)
      + `<div class="abs" data-band="1" style="left:0;top:${y0 + sb - .3}pt;width:${W}pt;height:${hh - sb + .3}pt;background:${DEEP};clip-path:polygon(0 ${bv}pt, 100% 0, 100% 100%, 0 100%)"></div>`;
    const logo = (x, y, lw, lh, c) => `<div class="abs ans-logo${c ? ' c' : ''}" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${OND}">${OHL.logo(D, tone, '')}</div>`;
    if(!A.name){ const lh = r2(Math.max(T.FB*2.2, 26*f)*Math.min(k0, 1.3)), pt = r2(7*f), hh = sb + bv + pt + lh + pt; return {h: hh, html: y0 => shell(y0, hh) + logo(W*.25, y0 + sb + bv + pt, W*.5, lh, 1)}; }
    // REALTOR(R) after the name and the label before the phone; then without the label; then REALTOR(R) before the phone; then neither.
    // Each is tried from the wanted size down before the next gives anything up.
    const modes = nar ? [[1, 1, 0], [1, 0, 0], [0, 0, 1], [0, 0, 0]] : [[0, 1, 0], [0, 0, 0]];
    for(const [inl, withLab, preD] of modes) for(const k of [1, .92, .84, .76, .68, .6].map(q => Math.max(.6, k0*q))){
      const pt = r2(7*f*Math.min(k, 1.2)), pb = r2(9*f*Math.min(k, 1.2));
      const ps = r2(Math.max(T.FB, T.FB*1.12*k)), ls = r2(Math.max(T.FS, Math.min(ps*.74, T.FS*1.25))), ns0 = Math.max(T.FB*1.15, T.FB*1.7*k), pre = withLab ? lab : preD ? 'REALTOR®' : '';
      const dW = T.tw('REALTOR®', F.lab(ls)), preW = pre ? T.tw(pre, F.lab(ls)) + ps*.5 : 0, pW = T.tw(A.phone || '', F.phone(ps));
      if(o.line){
        const sep = r2(7*f), dg = 5*f, labL = z => F.lab(z).replace(/letter-spacing:[^;]+/, `letter-spacing:${(z*.08).toFixed(2)}pt`), dW = T.tw('REALTOR®', labL(ls)); let lw = 0, ns = null, th = 0;
        const hsL = hsOn ? Math.round(ps*1.3*1.25) + r2(7*f) : 0;
        for(const q of [.26, .22, .185, .16, .14, .13]){ lw = Math.min(W*q, ps*1.3*4.4); ns = T.one(A.name, F.name, W - 2*pad - hsL - lw - gap*1.2 - (inl ? dW + dg : 0) - sep - preW - pW, ns0, T.FB*1.15); if(ns) break; }
        if(!ns) continue;
        th = Math.max(ns*1.15, ps*1.3);
        const nW = T.tw(A.name, F.name(ns)), hh = sb + bv + pt + th + pb, used = nW + (inl ? dW + dg : 0) + sep + preW + pW;
        return {h: hh, ns, html: y0 => { const cy = y0 + sb + bv + pt, base = cy + th*.5 + ns*.3, x0 = pad + hsL, px = x0 + used - pW - preW; let s = shell(y0, hh);
          if(hsL) s += `<div class="abs ans-hs" style="left:${pad}pt;top:${cy - bv*.2 - 2}pt;width:${hsL - r2(7*f)}pt;height:${th + bv*.2 + 4}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
          s += txt('agent.name', A.name, x0, base - ns*1.15*.79, nW + 2, ns, 1.15, F.name, OND);
          if(inl) s += txt('agent.desig', 'REALTOR®', x0 + nW + dg, base - ls*1.3*.78, dW + 2, ls, 1.3, labL, ACCD, {small: 1});
          if(pre) s += txt(withLab ? 'agent.label' : 'agent.desig', pre, px, base - ls*1.3*.78, preW, ls, 1.3, F.lab, ACCD, {small: 1});
          s += txt('agent.phone', A.phone || '', px + preW, base - ps*1.3*.78, pW + 2, ps, 1.3, F.phone, OND);
          return s + logo(W - pad - lw, cy - bv*.2, lw, th); }};
      }
      const th0 = ns0*1.15 + 2*f + ps*1.3, hsW = hsOn ? Math.round(th0*.84) : 0, lw = Math.min(W*.3, th0*3.2), cw = W - 2*pad - (hsOn ? hsW + gap : 0) - lw - gap*1.3;
      if(preW + pW > cw) continue;
      const ns = T.one(A.name, F.name, cw - (inl ? dW + 7*f : 0), ns0, T.FB*1.15); if(!ns) continue;
      const th = ns*1.15 + 2*f + ps*1.3, hh = sb + bv + pt + th + pb, nW = T.tw(A.name, F.name(ns));
      return {h: hh, ns, html: y0 => { const cy = y0 + sb + bv + pt, tx = pad + (hsOn ? hsW + gap : 0), y2 = cy + ns*1.15 + 2*f; let s = shell(y0, hh);
        if(hsOn) s += `<div class="abs ans-hs" style="left:${pad}pt;top:${cy}pt;width:${hsW}pt;height:${th}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
        s += txt('agent.name', A.name, tx, cy, nW + 2, ns, 1.15, F.name, OND);
        if(inl) s += txt('agent.desig', 'REALTOR®', tx + nW + 7*f, cy + ns*1.15*.79 - ls*1.3*.78, dW + 2, ls, 1.3, F.lab, ACCD, {small: 1});
        if(pre) s += txt(withLab ? 'agent.label' : 'agent.desig', pre, tx, y2 + ps*1.3*.78 - ls*1.3*.78, preW, ls, 1.3, F.lab, ACCD, {small: 1});
        s += txt('agent.phone', A.phone || '', tx + preW, y2, pW + 2, ps, 1.3, F.phone, OND);
        const lh = th*.96, ly = cy + (th - lh)/2 - bv*.25;
        return s + logo(W - pad - lw, ly, lw, lh); }};
    }
    return null;
  };

  const AN = {};
  // ================= post, pin, story: the flyer front's cut, the postcards' words =================
  // The house runs across the head, its foot cut on the slant with the accent stripe along it; the street and the place ride the cut
  // on the same tilt. Under them the words step up with the cut: Just Listed sets JUST / LISTED stacked at the left and the facts
  // stacked beside the leaning rule at the right; Just Sold sets the JUST SOLD slab at the left and the seller question at the right,
  // the agent's note beside the accent bar under them. The dark band with its leaning head carries the agent at the foot.
  // A story keeps its words out of the top and bottom 250 px: two rooms fill its foot under the band.
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', story = shape === 'story';
    const pad = r2(16*f), g = r2(8*f), st = r2(Math.max(5, W*.017)), gcol = r2(12*f), SAFE = 96, items = factItems(Li);
    // (a square whose listing has no lot size: the story count as the fifth fact, so the stack beside the word runs its full height)
    if(shape === 'square' && items.length === 4 && Li.stories) items.push({n: String(Li.stories), l: Li.stories == 1 ? 'Story' : 'Stories'});
    let HW = W;   // the house frame's width (the full width, except a square whose text would not fit under a full-width house)
    const build = (k, o, ph, e) => { e = e || 0;
      const v = Math.floor(X.footCut(HW, ph, r2(W*.23*HW/W))*W/HW), tan = v/W, th = Math.atan(tan), cos = Math.cos(th), stv = st/cos;
      let tx = pad, ty = ph - pad*tan + stv + 3*f; const under = x => ph - x*tan + stv;   // the stripe's lower edge at x
      // the highest a level block from x0 to x1 may start under the cut: under the tilted lines where they reach over it, else under the stripe
      const clearOf = tl => { const reach = Math.max(...tl.bands(tx, ty).map(b => b[1])) + 8*f;
        return (x0, x1) => reach < x0 ? under(x0) + g*1.2 : Math.max(tl.low(tx, ty, x0) + g*1.1, ...tl.bands(tx, ty).filter(b => b[1] > x0 && b[0] < x1).map(b => b[2] + 3)); };
      const parts = []; let y2, tl = null, share = .56;
      if(!sold){
        const sw = stackW(T, (W - 2*pad)*(o.split || (shape === 'square' ? .62 : .56)), FE*4.9*k); if(!sw) return null;
        share = sw.w/(W - 2*pad);
        const cx = pad + sw.w + gcol, cw = W - pad - cx;
        // the word at the left, straight under the stripe; at the right (where the cut stands higher) the street and the place on the
        // cut's tilt and the facts stacked under them
        const t2 = tilt(T, Li, cw, Math.max(FE, Math.min(FE*2.2*k, sw.s*.62)), th, k);
        if(t2.s >= FE - .01){ tl = t2; tx = cx; ty = under(cx) + 3*f;
          const wy = under(pad) + g*1.3, fy = tl.low(tx, ty, cx) + g*.9, fh = wy + sw.h - fy;
          let fc = fh > 30*f ? factsCol(T, items, cw, fh, FE*2.8) : null; if(!fc || fc.n < Math.min(shape === 'square' ? 3 : 4, items.length)) return null;
          if(cw - fc.w > W*.1){ const fg = factsGrid(T, items, cw, fh); if(fg && fg.w > fc.w*1.15 && (shape !== 'square' || fg.w*fg.h > fc.w*fc.h)) fc = fg; }
          if(!o.split && fc.w < cw*.88){ const b2 = build(k, Object.assign({}, o, {split: .65}), ph, e); if(b2) return b2; }
          // (a square whose JUST would leave a tall empty room between it and the leaning rule: JUST centered over LISTED, so the
          // room parts into two narrow margins)
          const lx = y => cx + (cw - fc.w)*.5 + fc.nf*.55*.2 + (fy + (fh - fc.h)/2 + fc.h/2 - y)*TAN, lt = wy + sw.s*.9;   // the leaning rule's x at height y
          const hx = pad + sw.jw, top = Math.max(under(hx), lx(lt) > tx ? tl.low(tx, ty, tx) : 0), cen = shape === 'square' && (lx(lt) - hx)*(lt - top) > .035*W*H;
          parts.push(sw.html(pad, wy, cen ? 'center' : false), fc.html(cx, fy, cw, fh, shape === 'square' ? {at: .5} : null)); y2 = wy + sw.h;
        } else {   // a long street: its tilted lines run the width over the word and the facts
          tl = tilt(T, Li, W - 2*pad, FE*1.6*k, th, k); const clear = clearOf(tl);
          const wy = clear(pad, pad + sw.w), fy = clear(cx, W - pad);
          const fc = factsCol(T, items, cw, wy + sw.h - fy, FE*2.8); if(!fc || fc.n < Math.min(3, items.length)) return null;
          parts.push(sw.html(pad, wy), fc.html(cx, fy, cw, wy + sw.h - fy)); y2 = wy + sw.h; }
      } else {
        // the slab at the right, high under the cut, the street's tilted lines at the left; then the question across the width
        for(const share of [.6, .54, .48, .42]){ const sl = slab(T, (W - 2*pad)*share, FE*3.8*k); if(!sl) continue;
          const sx = W - pad - sl.w, t2 = tilt(T, Li, sx - pad - gcol*.6, FE*2.3*k, th, k); if(t2.s < FE - .01) continue;
          const q = question(T, W - 2*pad, Math.min(FE*2.6*k, sl.s*.96)); if(!q) return null;
          const s0 = under(sx) + g*1.1, qy = Math.max(t2.low(tx, ty, pad) + g*1.2, s0 + sl.h + g*1.2), sy = s0 + Math.max(0, (qy - g*1.2 - s0 - sl.h)*.5);
          tl = t2; parts.push(sl.html(sx, sy), q.html(pad, qy)); y2 = qy + q.h; break; }
        if(!tl){   // a long street: its tilted lines run the width, the slab under them at the left and the question beside it
          tl = tilt(T, Li, W - 2*pad, FE*2.3*k, th, k); const clear = clearOf(tl);
          const sl = slab(T, (W - 2*pad)*.6, FE*3.8*k); if(!sl) return null;
          const sy = clear(pad, pad + sl.w), cx = pad + sl.w + gcol, cw = W - pad - cx, qy0 = clear(cx, W - pad);
          const q = question(T, cw, FE*1.9*k, true); if(!q) return null;
          const qy = Math.max(qy0, sy + (sl.h - q.h)/2);
          parts.push(sl.html(pad, sy), q.html(cx + (cw - q.w)/2, qy)); y2 = Math.max(sy + sl.h, qy + q.h); }
      }
      let y = y2;
      const fs = r2(Math.max(FB, FB*1.06*k));
      const para = sold ? (o.nl ? barText(T, 'sold.note', notes(D), W - 2*pad, fs, o.nl, Math.min(2, o.nl)) : null) : (o.wl ? barText(T, 'writeup', writePool(D), W - 2*pad, fs, o.wl, Math.min(2, o.wl)) : null);
      if((sold ? o.nl : o.wl) && !para) return null;
      if(para){ y += g*1.4 + e; parts.push(para.html(pad, y)); y += para.h; }
      const bd = agentBand(D, T, W, k, pad); if(!bd) return null;
      y += g*1.1 + e;
      return {v, tan, stv, tl, tx, ty, parts, bd, end: y + bd.h, bandY: y, gaps: para ? 2 : 1, lines: para ? para.n : 0, share};
    };
    const LIM = story ? H - SAFE : H, sg = r2(4*f);
    const opts = sold ? (shape === 'square' ? [3, 2] : [4, 3, 2]).map(nl => ({nl})) : (story ? [5, 4, 3, 2] : shape === 'pin' ? [4, 3, 2] : shape === 'square' ? [2, 0] : [3, 2]).map(wl => ({wl})).concat(shape === 'square' ? [] : [{wl: 0, last: 1}]);
    const KMAX = {post: 1.3, pin: 1.35, story: 1.5, square: 1.15}[shape] || 1.3, KMIN = shape === 'square' ? .5 : .6;
    // every arrangement (how many lines of write-up or note) at every house height from the photo's own shape down to its shortest:
    // the largest type that fits, scored with the cut first (the set's signature), then the type, the house and the fuller text
    let pick = null;
    const widths = shape === 'square' && X.sup(1).length ? [W, Math.round(W*.72)] : [W];
    widths.forEach((hw0, wi) => { if(wi && pick && pick.k >= .62) return; HW = hw0; const nat = X.nat(HW), mn = X.min(HW);
    opts.forEach((o, oi) => { if(o.last && pick) return;
      for(const q of [1, .92, .84, .72, .6, .4, 0]){ const ph = Math.round(mn + (nat - mn)*q); let k = null, b = null;
        for(let t = KMAX; t >= KMIN - .001; t -= .025){ b = build(t, o, ph); if(b && b.end <= LIM){ k = t; break; } }
        if(k == null) continue;
        const sc = Math.min(k, 1.1)*1.2 - (k < .85 ? (.85 - k)*3 : 0) + Math.min(b.v/W, .2)*9 - (b.v ? 0 : .8) + q*.15 + Math.min(b.lines, 3)*.1 - Math.max(0, .5 - b.share)*6;
        if(!pick || sc - wi*.6 > pick.sc) pick = {o, k, ph, sc: sc - wi*.6, hw: HW}; }
    }); });
    if(!pick && shape === 'square'){ T.done(); return null; }
    HW = pick ? pick.hw : W;
    pick = pick || {o: sold ? {nl: 2} : {wl: 0}, k: KMIN, ph: X.min(W)};
    let {o, k, ph} = pick, B = build(k, o, ph) || build(KMIN, sold ? {nl: 2} : {wl: 0}, X.min(W));
    if(!B){ T.done(); return SocialSet.__portrait(D, L, W, H, shape); }
    // room left over: the spaces between the blocks first, then a taller house frame (never past the cut it has)
    let spare = LIM - B.end;
    if(spare > 1){ const e = Math.min(7*f, spare/B.gaps), b2 = build(k, o, ph, e); if(b2 && b2.end <= LIM + .01){ B = b2; B.e = e; spare = LIM - B.end; } }
    if(spare > 2 && !story){ const ph2 = Math.min(HW < W ? X.nat(HW) : X.max(W), ph + spare), b2 = ph2 > ph + 1 ? build(k, o, ph2, B.e) : null; if(b2 && b2.end <= LIM + .01 && b2.v >= B.v*.85){ B = b2; ph = ph2; spare = LIM - B.end; } }
    if(spare > 1 && !story){ const e = (B.e || 0) + spare/B.gaps, b2 = build(k, o, ph, e); if(b2 && b2.end <= LIM + .01) B = b2; }
    let h = CSS + X.foot(0, 0, HW, ph, B.v*HW/W);
    if(HW < W){ const x0 = HW + sg; const up = 4;   // the room photo bleeds a little off the head: one photo cut in two by the gap, not a row of captioned photos
      h += OHL.maskedPhoto(D, X.sup(1)[0], `left:${x0}pt;top:${-up}pt;width:${W - x0}pt;height:${ph + up}pt`, [[0, 0], [1, 0], [1, (ph - B.v + up)/(ph + up)], [0, (ph - B.v*x0/W + up)/(ph + up)]]); }
    h += poly(W, H, [[0, ph], [W, ph - B.v], [W, ph - B.v + B.stv], [0, ph + B.stv]], TAG);
    h += B.tl.html(B.tx, B.ty) + B.parts.join('');
    const by = story ? B.bandY : H - B.bd.h;
    h += B.bd.html(by);
    if(story) h += X.row(0, by + B.bd.h, W, H - by - B.bd.h, 2, r2(4*f));
    T.done();
    return h;
  };

  // ================= square, wide (X), Google Business Profile: the postcard fronts =================
  // The house stands at the right, its inner edge leaning (as far as the house allows) with the accent stripe along it; the words sit
  // on the field beside it: Just Listed the place, JUST / LISTED stacked, the street, the facts parted by leaning slashes and the
  // highlights on leaning ticks; Just Sold the JUST SOLD slab, the street and the place, the seller question and the note beside the
  // accent bar. Where the column beside the house cannot hold them all (a wide house, a square image) the house takes the head of
  // the image and the later lines run the full width under it. The dark band with its leaning head carries the agent across the foot.
  const card = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js';
    const pad = r2(Math.min(16*f, W*.045)), g = r2(Math.min(8*f, H*.028)), st = r2(Math.max(5, W*.014)), gc = r2(Math.min(10*f, W*.026)), items = factItems(Li), HL = sold ? [] : highlights(D);
    const place = OHL.place(Li), fw = W - 2*pad;
    // the band: as large as a quarter of the height allows
    let bd = null; for(const kb of [1.3, 1.15, 1, .9, .8, .7, .6]){ const b = agentBand(D, T, W, kb, pad, {H}); if(b && b.h <= H*.235){ bd = b; break; } }
    if(!bd) for(const kb of [1.2, 1.05, .9, .8, .7, .6]){ const b = agentBand(D, T, W, kb, pad, {H, line: 1}); if(b && (b.h <= H*.22 || kb === .6)){ bd = b; break; } }
    if(!bd){ T.done(); return SocialSet.__landscape(D, L, W, H, shape); }
    const bandY = H - bd.h, tp = r2(pad*.85);
    // one block: {h, html(x, y, w)}
    const B = {
      place: (w, k) => { const ps = T.one(place, F.place, w, Math.max(FS, FS*1.05*Math.min(k, 1.4)), FS); return ps ? {h: ps*1.3, html: (x, y) => txt('place', place, x, y, w, ps, 1.3, F.place, ACC, {small: 1})} : null; },
      stack: (w, k) => { const s = stackW(T, w, Math.min(FE*4.8, H*.3)*k); return s ? {h: s.h, s: s.s, jw: s.jw, lw: s.w, html: (x, y) => s.html(x, y)} : null; },
      // the stacked word set against the leaning stripe, each line's end following the lean (a column that carries the word alone)
      stackR: (w, k) => { const s0 = stackW(T, w, Math.min(FE*4.8, H*.3)*k); if(!s0) return null;
        const [a, b] = SocialSet.M.toUpperCase().split(' '), s = s0.s, wa = T.tw(a, F.word(s)), wb = T.tw(b, F.word(s)), pitch = s*.9;
        return {h: s0.h, s, ra: wa, rb: wb, html: (x, y, cw, xr) => { const ra = xr ? xr(y + capH(s)) : x + cw, rb = xr ? xr(y + s0.h) : x + cw;
          return caps('moment', a, ra - wa - 2, y, wa + 2, s, ON, null, 'right') + caps('moment', b, rb - wb - 2, y + pitch, wb + 2, s, ACC, null, 'right'); }}; },
      // the stacked word with both lines set to one width (the first line larger): where the equal-size stack would leave an empty
      // block beside its shorter first line (X's wide image, a column that carries the word alone)
      stackJ: (w, k) => { const [a, b] = SocialSet.M.toUpperCase().split(' '), sb = T.one(b, F.word, w, FE*4.8*k, FE); if(!sb) return null;
        const wb = T.tw(b, F.word(sb)), sa = T.one(a, F.word, wb, sb*2.2, sb) || sb, gl = sb*.2;
        return {h: capH(sa) + gl + capH(sb), lw: wb, html: (x, y) => caps('moment', a, x, y, wb + 4, sa, ON) + caps('moment', b, x, y + capH(sa) + gl, wb + 4, sb, ACC)}; },
      slab: (w, k) => { const s = slab(T, w, FE*3.4*Math.max(k, .6)); if(s) B._ss = s.s; return s ? {h: s.h, s: s.s, html: (x, y, cw) => s.html(x, y, cw)} : null; },
      street: (w, k) => { const a = street(T, Li, w, FE*1.6*k, true); return a ? {h: a.h, two: a.n > 1, html: (x, y) => stTxt(a, x, y, w, ON)} : null; },
      streetPlace: (w, k) => { const a = street(T, Li, w, FE*1.6*k, true), ps = T.one(place, F.place, w, Math.max(FS, FS*1.05*Math.min(k, 1.4)), FS); if(!a || !ps) return null;
        return {h: a.h + 1*f + ps*1.3, two: a.n > 1, html: (x, y) => stTxt(a, x, y, w, ON) + txt('place', place, x, y + a.h + 1*f, w, ps, 1.3, F.place, ACC, {small: 1})}; },
      // the street at the left and the place at the right end of one line (under the house, full width)
      streetLine: (w, k) => { const ps = Math.max(FS, r2(FS*1.05*Math.min(k, 1.4))), pw2 = T.tw(place, F.place(ps)) + 2, a = street(T, Li, w - pw2 - 14*f, FE*1.6*k); if(!a) return null;
        return {h: a.h, html: (x, y) => stTxt(a, x, y, a.w + 2, ON) + txt('place', place, x + w - pw2, y + a.s*1.14*.8 - ps*1.3*.8, pw2, ps, 1.3, F.place, ACC, {small: 1, align: 'right'})}; },
      facts: (w, k, center) => { const r = factsRow(T, items, w, FE*1.55*k, center ? {rows: 1} : null) || (center ? factsRow(T, items, w, FE*1.55*k) : null); return r ? {h: r.h, html: (x, y) => r.html(x, y, w, center)} : null; },
      ticks: (w, k, n) => { const t = ticks(T, HL, w, k, n); return t && t.n >= Math.min(2, n) ? {h: t.h, html: (x, y) => t.html(x, y)} : null; },
      write: (w, k, n) => { const p = barText(T, 'writeup', writePool(D, []), w, r2(Math.max(FB, FB*1.04*k)), n, Math.min(2, n)); return p ? {h: p.h, html: (x, y) => p.html(x, y)} : null; },
      q: (w, k, big) => { const q = question(T, w, big ? Math.max(FB*1.2, Math.min(FE*2.3*Math.max(k, .7), (B._ss || 999)*.96)) : Math.min(FE*1.45*k, (B._ss || 999)*.96)); return q ? {h: q.h, html: (x, y) => q.html(x, y)} : null; },
      note: (w, k, n) => { const p = barText(T, 'sold.note', notes(D), w, r2(Math.max(FB, FB*1.06*k)), n, Math.min(2, n)); return p ? {h: p.h, len: p.len, html: (x, y) => p.html(x, y)} : null; },
    };
    // the arrangements: what stands beside the house, what runs under it
    const plans = sold ? [
      {id: 'A4', col: [['slab'], ['streetPlace'], ['q'], ['note', 4]], under: [], rank: 30},
      {id: 'A3', col: [['slab'], ['streetPlace'], ['q'], ['note', 3]], under: [], rank: 28},
      {id: 'A2', col: [['slab'], ['streetPlace'], ['q'], ['note', 2]], under: [], rank: 22},
      {id: 'B3', col: [['slab'], ['streetPlace']], under: [['q', true], ['note', 3]], rank: 20},
      {id: 'B2', col: [['slab'], ['streetPlace']], under: [['q', true], ['note', 2]], rank: 18},
      {id: 'B1', col: [['slab'], ['streetPlace']], under: [['q', true], ['note', 1]], rank: 6},
      {id: 'E1', col: [['slab'], ['streetPlace']], under: [['q', true], ['note', 2]], rank: 4},
      {id: 'E0', col: [['slab'], ['streetPlace'], ['q']], under: [], rank: -30},
      {id: 'F0', col: [['slab'], ['streetPlace']], under: [['q', true]], rank: -40},
    ] : [
      {id: 'A3', col: [['stack'], ['streetPlace'], ['facts'], ['ticks', 3]], under: [], rank: 30},
      {id: 'A2', col: [['stack'], ['streetPlace'], ['facts'], ['ticks', 2]], under: [], rank: 26},
      {id: 'A0', col: [['stack'], ['streetPlace'], ['facts']], under: [], rank: 18},
      {id: 'B3', col: [['stack'], ['streetPlace']], under: [['facts', true], ['write', 3]], rank: 24},
      {id: 'B2', col: [['stack'], ['streetPlace']], under: [['facts', true], ['write', 2]], rank: 22},
      {id: 'B0', col: [['stack'], ['streetPlace']], under: [['facts', true]], rank: 12},
      {id: 'K2', col: [['stackJ'], ['streetPlace']], under: [['facts', true], ['write', 2]], rank: 16},
      {id: 'C2', col: [['stackR']], under: [['streetLine'], ['facts', true], ['write', 2]], rank: 14},
      {id: 'C0', col: [['stackR']], under: [['streetLine'], ['facts', true]], rank: 8},
      {id: 'J0', col: [['stackJ'], ['streetPlace']], under: [['facts', true]], rank: 7},
      {id: 'J1', col: [['stackJ']], under: [['streetLine'], ['facts', true]], rank: 6},
      {id: 'F0', col: [['stackJ']], under: [['streetLine']], rank: -40},
    ];
    // X's wide image (its type floors are large): the word alone beside the house, both lines one width, the street, the place and the
    // facts across the width under them; nothing else leaves the column full
    const use = shape === 'wide' && !sold ? plans.filter(P => P.id === 'J1' || P.rank < 0) : plans;
    const KS = [1.6, 1.45, 1.3, 1.2, 1.1, 1, .9, .8, .7, .6, .52, .45, .39, .34];
    const make = (list, w, k) => { const out = []; for(const [nm, a] of list){ const b = B[nm](w, k, a); if(!b) return null; out.push(b); } return out; };
    const sum = l => l.reduce((a, b) => a + b.h, 0);
    let pick = null;
    for(const pass of [0, 1]){ if(pick) break;
    for(const P of use){ if((P.rank < 0) !== !!pass) continue;
      for(let fr = .72; fr >= .36; fr -= .01){ const pw = Math.round(W*fr), cw = W - pw - st - gc - pad; if(cw < 60*f) continue;
        for(const k of KS){
          const col = make(P.col, cw, k); if(!col) continue;
          const un = make(P.under, fw, k); if(!un) continue;
          const uh = un.length ? sum(un) + (un.length - 1)*g*1.25 + g*1.5 + g*1.2 : 0;
          const PH = un.length ? bandY - uh : bandY - r2(5*f);
          if(PH < H*.3) continue;
          const ch = sum(col), room = PH - tp - (un.length ? g*.6 : g*1.2), gMin = g*.9; if(ch + (col.length - 1)*gMin > room) continue;
          // the house in the panel; a panel wider than the whole house can stand in takes a room photo at its far side (never paper)
          let ln = X.lean(pw, PH, Math.min(PH*TAN, pw*.3)), hw = pw;
          if(!ln){ const sg = r2(4*f); for(let q = pw - Math.ceil(46*f) - sg; q >= Math.max(pw*.5, W*.45) && !ln; q -= 2){ const l2 = X.lean(q, PH, Math.min(PH*TAN, q*.3)); if(l2){ ln = l2; hw = q; } } if(!ln || !X.sup(1).length) continue; }
          const slackC = room - ch - (col.length - 1)*gMin, per = col.length > 1 ? slackC/(col.length - 1) : slackC;
          if(PH > hw/X.pAR*1.34 || hw < W*.45) continue;
          const nlen = sold ? Math.min(120, Math.max(0, ...col.concat(un).map(b => b.len || 0))) : 0;
          const sc = P.rank + Math.min(k, 1.3)*60 + (ln.v/(PH*TAN))*36 + hw*PH/(W*H)*260 - Math.max(0, per - g*1.6)*4 - (ln.v ? 0 : 20) + nlen*.5;
          // the room a stacked word leaves beside its shorter first line (up to the stripe) never grows into an empty block
          const stB = col.find(b => b.jw != null); let hole = 0;
          if(stB){ const gp0 = col.length > 1 ? Math.min((room - ch)/(col.length - 1), g*3.2) : 0; let yy = tp + (room - ch - gp0*(col.length - 1))/2; for(const b of col){ if(b === stB) break; yy += b.h + gp0; }
            const yb = yy + stB.s*.9, xs = W - pw - st + ln.v*(1 - yb/PH); hole = Math.max(0, xs - (pad + stB.jw) - 2*f)*(col[0] === stB ? yb - H*.03 : stB.s*.9 + gp0 + 4*f)/(W*H); }
          const stR = col.find(b => b.ra != null);   // the word set against the stripe: the room left of its first line, and of the whole word
          if(stR){ const yy = tp + (room - ch)/2, xq = q => W - pw - st + ln.v*(1 - q/PH) - gc, yj = yy + stR.s*.9, ye = yy + stR.h;
            hole = Math.max(Math.max(0, xq(yj) - stR.ra - W*.03)*(yj - H*.03), Math.max(0, xq(ye) - stR.rb - W*.03)*(ye - H*.03))/(W*H); }
          // a column wider than the word: the strip between the word and the stripe
          const stL = col.find(b => b.lw != null);
          if(stL){ const gp0 = col.length > 1 ? Math.min((room - ch)/(col.length - 1), g*3.2) : 0; let yy = tp + (room - ch - gp0*(col.length - 1))/2; for(const b of col){ if(b === stL) break; yy += b.h + gp0; }
            const ye = yy + stL.h, xe = W - pw - st + ln.v*(1 - ye/PH); hole = Math.max(hole, Math.max(0, xe - pad - stL.lw - 4*f)*(stL.h + (col[0] === stL ? yy - H*.03 : gp0))/(W*H)); }
          const sc2 = sc - (hole > .022 ? 60 + hole*1500 : hole*300) - (col.some(b => b.two) ? 25 : 0);
          if(!pick || sc2 - (hw < pw ? 8 : 0) > pick.sc) pick = {P, pw, hw, cw, k, un, col, PH, ln, ch, room, sc: sc2 - (hw < pw ? 8 : 0)};
          break; }
      }
    }
    }
    if(!pick){ T.done(); return shape === 'square' ? SocialSet.__portrait(D, L, W, H, shape) : SocialSet.__landscape(D, L, W, H, shape); }
    const {pw, hw, cw, un, col, PH, ln, ch, room} = pick, px = W - pw;
    let h = CSS + X.side(px, 0, hw, PH, ln) + (hw < pw ? X.photo(X.sup(1)[0], px + hw + r2(4*f), 0, pw - hw - r2(4*f), PH) : '');
    h += poly(W, H, [[px + ln.v - st, 0], [px + ln.v, 0], [px, PH], [px - st, PH]], TAG);
    // the column: its blocks spread over the house's height
    { const gp = col.length > 1 ? Math.min((room - ch)/(col.length - 1), g*3.2) : 0, tot = ch + gp*(col.length - 1); let y = tp + (room - tot)/2;
      const xr = yq => px - st + ln.v*(1 - yq/PH) - gc;
      col.forEach(b => { h += b.html(pad, y, cw, xr); y += b.h + gp; }); }
    if(un.length){ const tot = sum(un), free = bandY - PH - tot, gp = free/(un.length + 1.15); let y = PH + gp*1.15;
      un.forEach(b => { h += b.html(pad, y, fw); y += b.h + gp; }); }
    h += bd.html(bandY);
    T.done();
    return h;
  };
  AN.portrait = (D, L, W, H, shape) => shape === 'square' ? (tall(D, L, W, H, shape) || card(D, L, W, H, shape)) : tall(D, L, W, H, shape);
  AN.landscape = card;

  // ================= carousel photo slides =================
  // The room with its foot cut on the steep slant and the accent stripe along it; under the cut the street and the place on the same
  // tilt at the left, and at the right JUST / LISTED stacked white over the accent, or the JUST SOLD slab over the seller question.
  AN.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), {f, FE, FB, FS} = T, Li = D.listing, sold = D.piece.moment === 'js', pad = r2(16*f), g = r2(8*f), st = r2(Math.max(5, W*.017));
    const v = r2(W*.23), tan = v/W, th = Math.atan(tan), cos = Math.cos(th), stv = st/cos, bot = H - pad*.95;
    // the block at the right foot
    let blk, bw, bh;
    if(!sold){ const s = stackW(T, W*.36, FE*3.6); bw = s.w; bh = s.h; blk = (x, y) => s.html(x, y, true); }
    else { const s = slab(T, W*.47, FE*2.5), q = question(T, s.w, FE*1.3, true); bw = Math.max(s.w, q.w); bh = s.h + g*.9 + q.h;
      blk = (x, y) => s.html(x + bw - s.w, y) + q.html(x + bw - q.w - s.h*TAN/2, y + s.h + g*.9); }
    const bx = W - pad - bw, by = bot - bh;
    const tl = tilt(T, Li, bx - pad - r2(12*f), FE*1.9, th, 1.2);
    // the cut passes just over the block's top left corner and leaves the tilted lines their room over the foot
    const ph = Math.min(H*.86, by - g - stv + bx*tan, bot - (stv + 3*f + tl.tk/cos) + pad*tan), ty = ph - pad*tan + stv + 3*f;
    let h = CSS + OHL.maskedPhoto(D, D.piece.photo, `left:0;top:0;width:${W}pt;height:${ph}pt`, [[0, 0], [1, 0], [1, 1 - v/ph], [0, 1]]);
    h += poly(W, H, [[0, ph], [W, ph - v], [W, ph - v + stv], [0, ph + stv]], TAG);
    h += tl.html(pad, ty) + blk(bx, by);
    T.done();
    return h;
  };
  window.ANSocial = AN;
})();
