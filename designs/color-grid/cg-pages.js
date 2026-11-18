/* ======================= Color Grid page builders (11/16/2026; every layout here is this set's own) =======================
   One grid on every face: the paper, a 24 pt margin, 8 pt gutters. Photos and solid tiles of the kit's main color and its dark abut;
   every display word sits in a tile (white Schibsted Grotesk 700, the flyer's gold tracked caps over it). Numerals sit in square
   tiles (the sign-in sheet's numbered rows). P19's white cell with a 1.5 pt main-color border is the light moment. On the inside
   spread the fold is one more gutter: tiles stop 4 pt short of it on each page, so the 8 pt grid runs on across 17 inches. */
(function(){
  const esc = SW.esc, X = 24, G = 8, W = 564, SG = 'font-family:Schibsted Grotesk';
  const T = window.CGT = {};
  T.tile = (x, y, w, h, tone, id) => `<div class="cg-t ${tone || ''}"${id ? ` id="${id}"` : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"></div>`;
  T.on = h => `<div class="cg-on">${h}</div>`;
  T.addr = L => { const a = String(L.address || '').trim(), m = /^(\d+[A-Za-z]?)\s+(.+)$/.exec(a); return m ? {num: m[1], street: m[2], full: a} : {num: '', street: a, full: a}; };
  T.city = L => FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, '');
  // a stack of parts centered top to bottom in a box: [{h, html: y => ...}]
  T.vstack = (y, h, parts, gap) => { const tot = parts.reduce((s, p) => s + p.h, 0) + (parts.length - 1)*(gap || 0); let yy = y + (h - tot)/2, out = ''; parts.forEach(p => { out += p.html(yy); yy += p.h + (gap || 0); }); return out; };
  // the house number as a row of square numeral tiles (the sign-in sheet's numbered blocks), alternating dark and main
  // each tile tw wide (square on the 4-digit sample; wider for 1-3 digits, narrower for 5-6, so the row always runs the grid's full width)
  T.digits = (num, x, y, s, slot, tone0, gap, tw) => { let h = ''; const g = gap == null ? G : gap, w = tw || s, ds = String(num).split('');
    const fs = Math.min(s*0.84, ...ds.map(d => FXS.fitSize(d, `${SG};font-weight:700;letter-spacing:-1pt`, w - 14, s*0.84, 24)));
    ds.forEach((d, i) => { const tx = x + i*(w + g), tone = (i + (tone0 || 0)) % 2 ? '' : 'dk';
      h += T.tile(tx, y, w, s, tone) + `<div class="cg-num" style="left:${tx}pt;top:${y}pt;width:${w}pt;height:${s}pt;font-size:${fs}pt;line-height:${s}pt" data-slot="${slot}.${i}" data-lines="1">${esc(d)}</div>`; });
    return h; };
  T.gk = (t, x, w, slot, o) => { o = o || {}; const ls = o.ls == null ? 3 : o.ls, fs = FXS.fitSize(String(t).toUpperCase(), `${SG};font-weight:700;letter-spacing:${ls}pt`, w, o.max || 9.5, 8.6), lh = Math.max(12, fs*1.3);
    return {h: lh, html: yy => `<div class="cg-gk" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${lh}pt;font-size:${fs}pt;line-height:${lh}pt;letter-spacing:${ls}pt;text-align:${o.al || 'left'}${o.color ? ';color:' + o.color : ''}" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`}; };
  T.line = (t, x, w, fs, slot, o) => { o = o || {}; const lh = +(fs*(o.lh || 1.1)).toFixed(2);
    return {h: lh, html: yy => `<div class="${o.cls || 'cg-wt'}" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${lh}pt;font-size:${fs}pt;line-height:${lh}pt;text-align:${o.al || 'left'}${o.color ? ';color:' + o.color : ''}" data-slot="${slot}" data-lines="1">${esc(t)}</div>`}; };
  // after the fill: a write-up inside a white cell sits centered top to bottom in it
  FO.cellCenter = () => document.querySelectorAll('[data-cell]').forEach(el => { const [y, h] = el.dataset.cell.split(',').map(Number), n = SW.lines(el).n, lh = parseFloat(el.style.lineHeight); if(!(n > 0)) return; el.style.height = (n*lh) + 'pt'; el.style.top = (y + (h - n*lh)/2) + 'pt'; });

  // ---------------- COVER: the house over its house number. The hero across the top; the house number as a row of square numeral tiles
  // (dark, main, dark, main); under them the street in a main tile with the neighborhood in gold caps and the city, one room beside it.
  // No agent, no brokerage, no facts (they are inside).
  FO.front = (D, o) => { const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {};
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), strip = ((P.cg || {}).cover || P.strip || []).filter(id => id !== hero), A = T.addr(L), n = A.num.length;
    // the number row is always the 4-digit row's height and the grid's full width: 1-3 digits take wider tiles, 5-6 narrower ones
    // (owner 11/17/2026, p40: the layout worked only with a 4-digit number)
    const s = n ? (W - 3*G)/4 : 0, tw = n ? (W - (n - 1)*G)/n : 0, BRmin = 150; let HH = 410; while(HH < 470 && !SW.fits(D, hero, W, HH)) HH += 4;
    HH = Math.min(HH, 768 - X - G - (n ? s + G : 0) - BRmin);
    const yD = X + HH + G, yB = yD + (n ? s + G : 0), BR = 768 - yB;
    let h = FXS.box(D, hero, X, X, W, HH, 'front.house');
    if(n) h += T.digits(A.num, X, yD, s, 'front.num', 0, G, tw);
    const PW = strip[0] ? 184 : 0, BW = W - (PW ? PW + G : 0), ix = X + 26, iw = BW - 52;
    // the street on one line at 34-54 pt; a long one drops its suffix (Boulevard, Road...) to stay on one line, else it runs on two
    // balanced lines (the last two words together) at the biggest size the tile holds, never under 22 pt
    const SCSS = `${SG};font-weight:700;letter-spacing:-.3pt`, fit1 = t => FXS.fitSize(t, SCSS, iw, 54, 34), ok1 = t => FXS.width(t, `${SCSS};font-size:${fit1(t)}pt`) <= iw;
    const hood = FXS.hood(L); let street = A.street, ss = fit1(street), two = null;
    if(!ok1(street)){ const dr = window.AddressFit && AddressFit.drop('0 ' + street), sh = dr && dr.replace(/^0 /, '');
      if(sh && ok1(sh)){ street = sh; ss = fit1(sh); }
      else { const w = street.split(/\s+/); let best = null;
        for(let i = 1; i < w.length - 1; i++){ const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), m = Math.max(FXS.width(a, `${SCSS};font-size:10pt`), FXS.width(b, `${SCSS};font-size:10pt`)); if(!best || m < best.m) best = {a, b, m}; }
        if(!best) best = {a: street, b: ''};
        const room = BR - 28 - (hood ? 20 : 0) - 8 - 23;   // the tile less its padding, the place line and the city line
        ss = Math.min(FXS.fitSize(best.a, SCSS, iw, 44, 22), FXS.fitSize(best.b || best.a, SCSS, iw, 44, 22), Math.max(22, Math.floor(room/(2*1.06)*2)/2)); two = best; } }
    const cs = Math.max(14, Math.min(18, ss*0.4));
    const parts = []; if(hood) parts.push(T.gk(hood, ix, iw, 'front.place', {max: 11}));
    if(two){ const lh = +(ss*1.06).toFixed(2), nb = t => esc(t).replace(/ /g, '&nbsp;');
      parts.push({h: 2*lh, html: yy => `<div class="cg-wt" style="left:${ix}pt;top:${yy}pt;width:${iw}pt;height:${2*lh}pt;font-size:${ss}pt;line-height:${lh}pt;white-space:normal" data-slot="${n ? 'front.street' : 'address'}" data-lines="2">${nb(two.a)} ${nb(two.b)}</div>`}); }
    else parts.push(T.line(street, ix, iw, ss, n ? 'front.street' : 'address', {lh: 1.06}));
    parts.push(T.line(T.city(L), ix, iw, cs, 'front.city', {cls: 'cg-wm', lh: 1.25}));
    h += T.tile(X, yB, BW, BR) + T.on(T.vstack(yB, BR, parts, 8));
    if(PW) h += FXS.box(D, strip[0], X + BW + G, yB, PW, BR, 'front.strip0');
    return h; };

  // ---------------- FLYER FRONT, its own composition: the flyer's header pair across the top (the place and the full street in the main
  // tile; the facts centered in the dark tile, P19's features block), the house across the page, then a room beside the write-up in
  // P19's white cell. No agent, no brokerage.
  FO.flyerFront = (D, o) => { o = o || {}; const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), strip = ((P.cg || {}).flyerStrip || P.flyerStrip || P.strip || []).filter(id => id !== hero);
    const HB = 136, AW = 372, FW = W - AW - G, A = T.addr(L), ix = X + 22, iw = AW - 44;
    const place = [FXS.hood(L), T.city(L)].filter(Boolean).join('  ·  '), as = FXS.fitSize(A.full, `${SG};font-weight:700;letter-spacing:-.3pt`, iw, 38, 22);
    let h = T.tile(X, X, AW, HB) + T.on(T.vstack(X, HB, [T.gk(place, ix, iw, 'front.place'), T.line(A.full, ix, iw, as, 'address', {lh: 1.08})], 10));
    const it = FXS.statItems(L).map(FO.factText).slice(0, 4), ff = Math.min(...it.map(t => FXS.fitSize(t, `${SG};font-weight:500`, FW - 24, 14.5, 10))), fl = Math.min(26, (HB - 20)/Math.max(1, it.length));
    h += T.tile(X + AW + G, X, FW, HB, 'dk') + T.on(T.vstack(X, HB, it.map((t, i) => ({h: fl, html: yy => `<div class="cg-wm" style="left:${X + AW + G + 8}pt;top:${yy}pt;width:${FW - 16}pt;height:${fl}pt;font-size:${ff}pt;line-height:${fl}pt;text-align:center" data-slot="front.fact.${i}" data-lines="1">${esc(t)}</div>`})), 0));
    const R3 = 178, yH = X + HB + G, HH = 768 - R3 - G - yH, y3 = yH + HH + G;
    h += FXS.box(D, hero, X, yH, W, HH, 'front.house');
    const half = (W - G)/2; if(strip[0]) h += FXS.box(D, strip[0], X, y3, half, R3, 'front.strip0');
    const cx = strip[0] ? X + half + G : X, cw = strip[0] ? half : W; h += `<div class="cg-cell" style="left:${cx}pt;top:${y3}pt;width:${cw}pt;height:${R3}pt"></div>`;
    { const wx = cx + 18, ww = cw - 36, lh = 16, avail = R3 - 30, nl = Math.max(3, Math.floor(avail/lh));
      h += FO.full(`<div class="abs wu" data-slot="front.summary" data-cell="${y3},${R3}" data-lines="${nl}" data-try="${nl},${nl - 1},${nl - 2}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${wx}pt;top:${y3 + (R3 - nl*lh)/2}pt;width:${ww}pt;height:${nl*lh}pt;font-size:10.75pt;line-height:${lh}pt;color:#1e1e1e"></div>`); }
    return h; };


  // the kitchen card's rows: one line count for every row (1, 2 or 3 full lines: every line but the last 80%+, the last 90%+), the type
  // size and measure chosen so the most rows fill (up to maxRows), then the richest line count
  FO.tableRowsN = (items0, taken, o) => { o = o || {}; const ok = a => !taken || !taken(a); let best = null;
    for(const NL of (o.NLs || [1, 2, 3])) for(let f = 10.5; f <= (NL === 1 ? 14.01 : 12.51); f += 0.25) for(const V of o.Vs){ const css = `font-family:Schibsted Grotesk;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== NL || Lw.slice(0, -1).some(w => w < 0.8*V) || Lw[NL - 1] < (NL === 1 ? 0.86 : 0.9)*V) return; const sc = Lw.reduce((a, b) => a + b, 0)/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 4), need = n*(13 + NL*f*1.42 + 14) + (o.top || 0);
      if(need > (o.H || 1e9)) continue;
      const score = n*1000 + NL*(o.H ? Math.round(100*need/o.H) : 10) + f;
      if(!best || score > best.score) best = {score, f, V, NL, rows: rows.slice(0, o.maxRows || 4)}; }
    return best || {f: 10.5, V: o.Vs[0], NL: 1, rows: []}; };

  // ---------------- INSIDE SPREAD. The fold is a gutter: the left page's tiles end at 608, the right page's start at 4. Each page opens with
  // a header pair meeting at the fold: a dark numeral tile (01, 02) with the room's name in gold caps, and a main tile with the headline.
  const LX0 = 24, LX1 = 608, RX0 = 4, RX1 = 588, HDR = 150, COLA = 330;
  FO.cgHead = (D, id, title, slot, num, left) => { const c = FXS.cardFor(D, id) || {}, lab = FXS.leadLabel(c.lead || FO.lead(D, id)), t = String(title || '').replace(/\.$/, '').replace(/ ([AaI]) /g, ' $1 ');
    const x0 = left ? LX0 : RX0, x1 = left ? LX1 : RX1, nw = x1 - x0 - COLA - G, mx = left ? x0 : x0 + nw + G, nx = left ? x0 + COLA + G : x0;
    const iw = COLA - 44, fam = `${SG};font-weight:700;letter-spacing:-.3pt`; let f = 36; const nl = ff => FO.wrapLines(t, `${fam};font-size:${ff}pt`, iw).length;
    while(f > 22 && nl(f) > 3) f -= 0.5; const lines = nl(f), lh = +(f*1.1).toFixed(2);
    if(lab.size) (FXS.__sizes = FXS.__sizes || new Set()).add(lab.size);
    let h = T.tile(mx, X, COLA, HDR) + T.on(T.vstack(X, HDR, [{h: lines*lh, html: yy => `<div class="cg-wt" style="left:${mx + 22}pt;top:${yy}pt;width:${iw}pt;height:${lines*lh}pt;font-size:${f}pt;line-height:${lh}pt;white-space:normal" data-slot="${slot}.title" data-lines="${lines}" data-fine="1">${esc(t)}</div>`}], 0));
    const name = String(lab.name || FO.lead(D, id)).toUpperCase();
    h += T.tile(nx, X, nw, HDR, 'dk') + T.on(T.vstack(X, HDR, [T.line(num, nx, nw, 88, slot + '.num', {cls: 'cg-num', lh: 0.9, al: 'center'}), T.gk(name, nx + 12, nw - 24, slot + '.room', {al: 'center', max: 10})], 10));
    return h; };
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, C = P.cg || {};
    const kid = C.left || 'kitchen', rowC = FO.cards(D, C.leftRow || (P.left || []).filter(id => id !== kid).slice(0, 2));
    let h = FO.cgHead(D, kid, C.leftTitle || I.title, 'left', '01', true);
    const y2 = X + HDR + G, KH = 300, cardX = LX0 + COLA + G, cardW = LX1 - cardX;
    h += FXS.box(D, kid, LX0, y2, COLA, KH, 'left.wide');
    // the kitchen card in P19's white cell: its kicker, then rows of real detail, each its label in main-color caps over two full lines;
    // a row that only repeats what the back's lists print is left out
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const taken = a => /^(It|Its|They|This|That)\b/.test(a) || SW.grams4(a).some(g => backG.has(g)) || backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w))));
    const iw = cardW - 36, kk = /kitchen/i.test(box.kicker || 'kitchen') ? '' : String(box.kicker), Tb = FO.tableRowsN((box.items || []).slice(0, 10), taken, {maxRows: 5, Vs: [iw - 12, iw - 6, iw], H: KH - 24 - (kk ? 26 : 0), top: 0});
    const rows = Tb.rows, lhT = +(Tb.f*1.42).toFixed(2), NL = Tb.NL, top = kk ? 38 : 12, rowH = (KH - top - 12)/Math.max(1, rows.length);
    let b = `<div class="cg-cell" style="left:${cardX}pt;top:${y2}pt;width:${cardW}pt;height:${KH}pt"></div>`;
    if(kk) b += `<div class="cg-t" style="left:${cardX}pt;top:${y2}pt;width:${cardW}pt;height:30pt"></div><div class="cg-gk" style="left:${cardX + 18}pt;top:${y2 + 9}pt;width:${iw}pt;height:12pt" data-slot="left.box.kicker" data-lines="1">${esc(kk.toUpperCase())}</div>`;
    rows.forEach((r, i) => { const ry = y2 + top + i*rowH, c0 = ry + (rowH - 15 - NL*lhT)/2;
      if(i) b += `<div class="abs" style="left:${cardX + 18}pt;top:${ry - .5}pt;width:${iw}pt;height:1pt;background:var(--cg-main);opacity:.35"></div>`;
      b += `<div class="cg-mk" style="left:${cardX + 18}pt;top:${c0}pt;width:${iw}pt;font-size:8.6pt;letter-spacing:1.8pt" data-slot="left.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${cardX + 18}pt;top:${c0 + 15}pt;width:${Tb.V + 1}pt;height:${NL*lhT}pt;font-weight:400;font-size:${Tb.f}pt;line-height:${lhT}pt;font-family:var(--cg-font);color:#1e1e1e;overflow:hidden;${NL > 1 ? 'text-align:justify;text-align-last:left' : 'white-space:nowrap'}" data-slot="left.list.t${i}" data-lines="${NL}">${esc(r.t)}</div>`; });
    h += `<div class="cg-on-wb">${b}</div>`;
    const y3 = y2 + KH + G, n = Math.max(1, rowC.length), clh = 14.5, Lc = 3, W2 = (LX1 - LX0 - (n - 1)*G)/n, RH = 768 - y3 - 25 - Lc*clh;
    rowC.forEach((c, i) => { h += FXS.captioned(D, c, LX0 + i*(W2 + G), y3, W2, RH, Lc, 'left.photo' + i, {fs: 10.75, lh: clh, min: 3}).replace(`data-slot="left.photo${i}" data-room`, `data-slot="left.photo${i}" data-nopair="1" data-room`); });
    return h; };
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, C = P.cg || {};
    const ids = C.right ? [C.right].concat(C.rightRow || []) : (P.right || []), cs = FO.cards(D, ids), top = cs[0], rest = cs.slice(1, 4);
    let h = FO.cgHead(D, top.photo, C.rightTitle || R.title, 'right', '02', false);
    const y2 = X + HDR + G, PH = 262, RW = RX1 - RX0;
    h += FXS.box(D, top.photo, RX0, y2, RW, PH, 'right.wide');
    // the big room's own write-up, set large as the page's lead, in P19's white cell under it
    const c0 = FXS.augment(D, top), wl = 20, nw = 3, cy = y2 + PH + G, CH = nw*wl + 30;
    h += `<div class="cg-cell" style="left:${RX0}pt;top:${cy}pt;width:${RW}pt;height:${CH}pt"></div>`;
    h += `<div class="abs cap"><div class="a" style="position:absolute;left:${RX0 + 20}pt;top:${cy + 15}pt;width:${RW - 40}pt;height:${nw*wl}pt;font-size:14pt;line-height:${wl}pt;color:#1e1e1e" data-slot="right.photo0" data-room="${esc(FXS.leadLabel(top.lead).name)}" data-lh="${wl}" data-hbox="${nw*wl}" data-lines="${nw}" data-min="3" data-narrow="0" ${FXS.sd(c0.s)}></div></div>`;
    const y3 = cy + CH + G, clh = 13.5, Lc = 3, ws = (RW - (rest.length - 1)*G)/Math.max(1, rest.length), RH = 768 - y3 - 25 - Lc*clh;
    const score = c => /closet|wic|pbath|bath|laundry|hall|powder/i.test(c.photo) ? 0 : /bed|game|living|family|media|flex/i.test(c.photo) ? 2 : 1, ord = rest.slice().sort((a, b) => score(b) - score(a));
    ord.forEach((c, i) => { h += FXS.captioned(D, c, RX0 + i*(ws + G), y3, ws, RH, Lc, 'right.photo' + (i + 1), {fs: 10, lh: clh, min: 3}).replace(`data-slot="right.photo${i + 1}" data-room`, `data-slot="right.photo${i + 1}" data-nopair="1" data-room`); });
    return h; };
})();
