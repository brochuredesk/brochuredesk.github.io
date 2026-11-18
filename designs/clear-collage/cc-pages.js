/* ======================= Clear Collage page builders (11/16/2026; every layout here is this set's own) =======================
   The hand is the approved Open House library flyer P37 Clear Collage and its sign-in sheet. Every face is a WINDOW: a clear white
   sheet inside a solid frame of the agent's main color, crossed by one bar of the same color that joins the frame on both sides (the
   flyer's date bar), white Fraunces on its left and Outfit on its right. The hero looks through the window (it runs to the frame);
   rooms sit on the white as a clean collage with 8 pt gutters. Fraunces 600 in the main color is the one display line on the white;
   Outfit tracked caps are the address line and the labels; the sign-in sheet's numbered circles key the photos and the lists; line
   icons carry the facts. The pale panel (the main color a whisper on the white, the sign-in rows) is the one quiet field. */
(function(){
  const esc = SW.esc, G = 8, FR = 14, M = 34, FRA = 'font-family:Fraunces;font-weight:600', OUT = 'font-family:Outfit';
  const T = window.CCT = {};
  // ---------------- marks ----------------
  T.tile = (x, y, w, h, tone, id) => `<div class="cc-t ${tone || ''}"${id ? ` id="${id}"` : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"></div>`;
  T.on = h => `<div class="cc-on">${h}</div>`;
  // the frame: solid main color from the bleed to f pt inside trim, on the sides named ('t', 'r', 'b', 'l'); W x H is the face
  T.frame = (W, H, f, sides) => { f = f || FR; sides = sides || 'trbl'; const b = 9, s = (x, y, w, h) => `<div class="cc-frm" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"></div>`; let h = '';
    if(sides.includes('t')) h += s(-b, -b, W + 2*b, f + b);
    if(sides.includes('b')) h += s(-b, H - f, W + 2*b, f + b);
    if(sides.includes('l')) h += s(-b, -b, f + b, H + 2*b);
    if(sides.includes('r')) h += s(W - f, -b, f + b, H + 2*b);
    return h; };
  // the bar: the main color run frame to frame (x0..x1 default: bleed to bleed), at y, h tall
  T.bar = (y, h, x0, x1, id) => `<div class="cc-bar"${id ? ` id="${id}"` : ''} style="left:${x0 == null ? -9 : x0}pt;top:${y}pt;width:${(x1 == null ? 621 : x1) - (x0 == null ? -9 : x0)}pt;height:${h}pt"></div>`;
  T.addr = L => { const a = String(L.address || '').trim(), m = /^(\d+[A-Za-z]?)\s+(.+)$/.exec(a); return m ? {num: m[1], street: m[2], full: a} : {num: '', street: a, full: a}; };
  T.city = L => FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, '');
  T.place = L => [FXS.hood(L), T.city(L)].filter(Boolean).join('  ·  ');
  // a stack of parts centered top to bottom in a box: [{h, html: y => ...}]
  T.vstack = (y, h, parts, gap) => { const tot = parts.reduce((s, p) => s + p.h, 0) + (parts.length - 1)*(gap || 0); let yy = y + (h - tot)/2, out = ''; parts.forEach(p => { out += p.html(yy); yy += p.h + (gap || 0); }); return out; };
  // tracked Outfit caps (the flyer's address line and labels); o.on: on the bar (white, or gold with o.gold)
  T.caps = (t, x, w, slot, o) => { o = o || {}; const ls = o.ls == null ? 2.2 : o.ls, wt = o.wt || 500, fs = FXS.fitSize(String(t).toUpperCase(), `${OUT};font-weight:${wt};letter-spacing:${ls}pt`, w, o.max || 10, o.min || 8.6), lh = Math.max(12, +(fs*1.3).toFixed(2));
    return {h: lh, html: yy => `<div class="cc-caps2${o.on ? ' on' : ''}${o.gold ? ' gold' : ''}" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${lh}pt;font-size:${fs}pt;line-height:${lh}pt;letter-spacing:${ls}pt;font-weight:${wt};text-align:${o.al || 'left'}" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`}; };
  // one Fraunces display line (main color on the white; white on the bar with o.on)
  T.fra = (t, x, w, max, min, slot, o) => { o = o || {}; const fs = FXS.fitSize(t, `${FRA};letter-spacing:-.4pt`, w - 2, max, min), lh = +(fs*(o.lh || 1.12)).toFixed(2);
    return {h: lh, fs, html: yy => `<div class="cc-fra${o.on ? ' on' : ''}" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${lh}pt;font-size:${fs}pt;line-height:${lh}pt;text-align:${o.al || 'left'}" data-slot="${slot}" data-lines="1">${esc(t)}</div>`}; };
  // a Fraunces headline on up to n lines, the largest size from max down that sets in n lines or fewer with a full last line
  T.head = (t, x, w, max, min, n, slot) => { t = String(t || '').replace(/\.$/, '').replace(/(^| )([AaI]) /g, '$1$2 '); let f = max, L;
    for(; f >= min; f -= .5){ L = FO.wrapLines(t, `${FRA};letter-spacing:-.4pt;font-size:${f}pt`, w - 4); if(L.length <= n && (L.length === 1 || L[L.length - 1] >= 0.42*(w - 4))) break; }
    f = Math.max(f, min); L = FO.wrapLines(t, `${FRA};letter-spacing:-.4pt;font-size:${f}pt`, w - 4); const lh = +(f*1.1).toFixed(2);
    return {h: L.length*lh, fs: f, html: yy => `<div class="cc-fra" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${L.length*lh}pt;font-size:${f}pt;line-height:${lh}pt;white-space:normal" data-slot="${slot}" data-lines="${L.length}" data-fine="1">${esc(t)}</div>`}; };
  // the sign-in sheet's numbered circle: a Fraunces numeral in a fine circle
  T.circ = (n, x, y, d, o) => { o = o || {}; return `<div class="cc-cn${o.on ? ' on' : ''}" style="left:${x}pt;top:${y}pt;width:${d}pt;height:${d}pt;font-size:${(d*0.56).toFixed(2)}pt;line-height:${d}pt">${esc(n)}</div>`; };
  // the flyer's line icons (ohlib.js OHL.ICON, drawn in currentColor)
  const ICON = {
    bed: '<svg viewBox="0 0 24 24"><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/></svg>',
    bath: '<svg viewBox="0 0 24 24"><path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 12V5a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/></svg>',
    area: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 9h5M15 4v5M9 20v-5M20 15h-5"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>'};
  T.icon = (name, size) => (ICON[name] || ICON.pin).replace('<svg', `<svg style="width:${size}pt;height:${size}pt;stroke:currentColor;fill:none;stroke-width:1.5;display:block"`);
  T.iconOf = t => /bed/i.test(t) ? 'bed' : /bath/i.test(t) ? 'bath' : /sq|feet/i.test(t) ? 'area' : /built/i.test(t) ? 'cal' : 'pin';
  // the facts on the bar: icon, Fraunces numeral, the word in caps (gold); spread evenly between x0 and x1, centered in the bar
  T.barFacts = (items, x0, x1, y, h, slot, o) => { o = o || {}; const n = items.length; if(!n) return ''; const P = items.map(FXS.statParts), cw = (x1 - x0)/n;
    let nf = o.nf || 24, lf = o.lf || 9.5, isz = o.isz || 20, out = '';
    const wOf = p => isz + 9 + FXS.width(p.n, `${FRA};font-size:${nf}pt`) + 7 + FXS.width(String(p.l).toUpperCase(), `${OUT};font-weight:600;letter-spacing:1.8pt;font-size:${lf}pt`);
    while(nf > 14 && P.some(p => wOf(p) > cw - 14)){ nf -= 1; lf = Math.max(8.6, lf - .25); isz = Math.max(15, isz - .5); }
    P.forEach((p, i) => { const cx = x0 + i*cw;
      out += `<div class="cc-bf" data-slot="${slot}.${i}" data-lines="1" style="left:${cx}pt;top:${y}pt;width:${cw}pt;height:${h}pt">`
        + `<span class="ic">${T.icon(T.iconOf(items[i]), isz)}</span><span class="n" style="font-size:${nf}pt">${esc(p.n)}</span><span class="l" style="font-size:${lf}pt">${esc(String(p.l).toUpperCase())}</span></div>`; });
    return out; };
  // after the fill: a write-up inside a panel sits centered top to bottom in it
  FO.cellCenter = () => document.querySelectorAll('[data-cell]').forEach(el => { const [y, h] = el.dataset.cell.split(',').map(Number), n = SW.lines(el).n, lh = parseFloat(el.style.lineHeight); if(!(n > 0)) return; el.style.height = (n*lh) + 'pt'; el.style.top = (y + (h - n*lh)/2) + 'pt'; });
  // after the fill: the right page's lead write-up (Fraunces, on the pale panel) takes the largest size at which its chosen sentences
  // still fill every line (80%+, the last 90%+) and fit the panel; the line count may change, the words never do
  FO.growLead = () => document.querySelectorAll('[data-growlead]').forEach(el => { const av = +el.dataset.growlead, W0 = parseFloat(el.style.width), X0 = parseFloat(el.style.left); if(!el.textContent.trim()) return;
    const chars = el.textContent.length; let best = null;
    for(let fs = 18; fs >= 11.5 && !best; fs -= .25){ const lh = Math.round(fs*1.36*4)/4;
      for(let w = W0; w >= W0*0.76 && !best; w -= 2){ el.style.fontSize = fs + 'pt'; el.style.lineHeight = lh + 'pt'; el.style.width = w + 'pt'; el.style.height = 'auto'; el.style.textAlign = 'left'; el.dataset.rag = '1'; const L = SW.lines(el);
        if(L.n >= 3 && L.n*lh <= av && L.fill >= .9 && L.min >= .8 && chars/L.n >= 16) best = {fs, lh, n: L.n, w}; } }
    if(!best){ el.style.width = W0 + 'pt'; el.style.fontSize = el.dataset.fs0 + 'pt'; el.style.lineHeight = el.dataset.lh + 'pt'; el.style.height = el.dataset.hbox + 'pt'; return; }
    el.style.fontSize = best.fs + 'pt'; el.style.lineHeight = best.lh + 'pt'; el.style.width = best.w + 'pt'; el.style.left = (X0 + (W0 - best.w)/2) + 'pt'; el.style.height = (best.n*best.lh) + 'pt';
    el.dataset.lh = best.lh; el.dataset.lines = best.n; el.dataset.hbox = best.n*best.lh; });
  // a caption's room label keyed with the numbered circle
  FO.keyed = (html, n) => html.replace('<div class="lbl"', `<span class="cc-cn in">${n}</span><div class="lbl"`);

  // ---------------- COVER: the window. The house fills the upper pane right to the frame; the bar crosses the sheet under it with the
  // street in white Fraunces and the neighborhood in Outfit; the lower pane is the white sheet with three rooms as a collage.
  // No agent, no brokerage, no facts (they are inside).
  FO.front = (D, o) => { const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {};
    const C0 = P.cc || {}, inside = new Set([C0.left, ...(C0.leftRow || []), C0.right, ...(C0.rightRow || []), C0.backTop, D.plan ? null : C0.backFootNoplan].filter(Boolean));
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), strip = (C0.cover || P.strip || []).filter(id => id !== hero && !inside.has(id)).slice(0, 3), A = T.addr(L);
    const PW = 612 - 2*FR; let HH = 430; while(HH < 492 && !SW.fits(D, hero, PW, HH)) HH += 4;
    let h = T.frame(612, 792) + FXS.box(D, hero, FR, FR, PW, HH, 'front.house');
    // the bar: the street left in Fraunces, the place right in Outfit (the date bar: date left, time right)
    const by = FR + HH, iw = 612 - 2*M, hood = FXS.hood(L), city = T.city(L);
    const st = FXS.fitSize(A.full, `${FRA};letter-spacing:-.4pt`, iw*0.66, 44, 26), stW = FXS.width(A.full, `${FRA};letter-spacing:-.4pt;font-size:${st}pt`);
    const rw = iw - stW - 24, hf = Math.min(15, FXS.fitSize(hood || city, `${OUT};font-weight:500`, rw, 15, 10)), cf = 9.5;
    const BH = Math.round(Math.max(st*1.25, hf*1.3 + 4 + 13) + 34);
    h += T.bar(by, BH) + T.on(T.vstack(by, BH, [T.fra(A.full, M, stW + 4, st, st, 'address', {on: true})], 0)
      + T.vstack(by, BH, [{h: hf*1.3, html: yy => `<div class="cc-out on" style="left:${M + stW + 24}pt;top:${yy}pt;width:${rw}pt;height:${hf*1.3}pt;font-size:${hf}pt;line-height:${hf*1.3}pt;text-align:right" data-slot="front.place" data-lines="1">${esc(hood || city)}</div>`},
        ...(hood ? [T.caps(city, M + stW + 24, rw, 'front.city', {on: true, gold: true, al: 'right', max: cf, ls: 2.4, wt: 600})] : [])], 4));
    // the lower pane: three rooms on the white, the first larger, one height, 8 pt gutters, 20 pt of white to the frame
    const y0 = by + BH + 20, ph = 792 - FR - 20 - y0, n = strip.length;
    if(n){ const wts = n === 3 ? [1.36, 1, 1] : n === 2 ? [1.25, 1] : [1], tw = iw - (n - 1)*G, sum = wts.reduce((a, b) => a + b, 0); let x = M;
      strip.forEach((id, i) => { const w = Math.round(tw*wts[i]/sum*100)/100; h += FXS.box(D, id, x, y0, i === n - 1 ? M + iw - x : w, ph, 'front.strip' + i); x += w + G; }); }
    return h; };

  // ---------------- FLYER FRONT, its own composition: the sign-in sheet's head. The street in big Fraunces on the white with the place
  // line in tracked caps under it; the bar with the facts on line icons; the house in the window between white margins; under it the
  // write-up beside a room. No agent, no brokerage.
  FO.flyerFront = (D, o) => { o = o || {}; const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), strip = ((P.cc || {}).flyerStrip || P.flyerStrip || P.strip || []).filter(id => id !== hero), A = T.addr(L), iw = 612 - 2*M;
    let h = T.frame(612, 792);
    const HD = 132, st = T.fra(A.full, M, iw, 60, 30, 'address', {lh: 1.05}), pl = T.caps(T.place(L), M, iw, 'front.place', {max: 12, ls: 2.6});
    h += T.vstack(FR, HD - FR, [st, pl], 10);
    const by = HD, BH = 58, it = FXS.statItems(L).slice(0, 4);
    h += T.bar(by, BH) + T.on(T.barFacts(it, M, 612 - M, by, BH, 'front.fact', {nf: 22, lf: 9, isz: 18}));
    const R3 = 196, yH = by + BH + 20, y3 = 792 - FR - 20 - R3, HHt = y3 - G - yH;
    h += FXS.box(D, hero, M, yH, iw, HHt, 'front.house');
    const half = Math.round((iw - G)/2), cw = iw - half - G;
    if(strip[0]) h += FXS.box(D, strip[0], M + cw + G, y3, half, R3, 'front.strip0');
    const cx = M, cww = strip[0] ? cw : iw; h += `<div class="cc-cell" style="left:${cx}pt;top:${y3}pt;width:${cww}pt;height:${R3}pt"></div>`;
    { const wx = cx + 18, ww = cww - 36, lh = 16, kh = 22, avail = R3 - 30 - kh, nl = Math.max(3, Math.floor(avail/lh)), t0 = y3 + 15 + kh;
      h += `<div class="cc-mk" style="left:${wx}pt;top:${y3 + 14}pt;width:${ww}pt" data-slot="front.about.k" data-lines="1">ABOUT THIS HOME</div>`;
      h += FO.full(`<div class="abs wu" data-slot="front.summary" data-cell="${t0},${R3 - 15 - kh - 12}" data-lines="${nl}" data-try="${nl},${nl - 1},${nl - 2}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${wx}pt;top:${t0}pt;width:${ww}pt;height:${nl*lh}pt;font-size:10.75pt;line-height:${lh}pt;color:#1e1e1e"></div>`); }
    return h; };

  // the kitchen card's rows: one line count for every row (1, 2 or 3 full lines: every line but the last 80%+, the last 90%+), the type
  // size and measure chosen so the most rows fill (up to maxRows), then the richest line count
  FO.tableRowsN = (items0, taken, o) => { o = o || {}; const ok = a => !taken || !taken(a); let best = null;
    for(const NL of (o.NLs || [1, 2, 3])) for(let f = 10.5; f <= (NL === 1 ? 14.01 : 12.51); f += 0.25) for(const V of o.Vs){ const css = `font-family:Outfit;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== NL || Lw.slice(0, -1).some(w => w < 0.8*V) || Lw[NL - 1] < (NL === 1 ? 0.86 : 0.9)*V) return; const sc = Lw.reduce((a, b) => a + b, 0)/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 4), need = n*(13 + NL*f*1.42 + 14) + (o.top || 0);
      if(need > (o.H || 1e9)) continue;
      const score = n*1000 + NL*(o.H ? Math.round(100*need/o.H) : 10) + f;
      if(!best || score > best.score) best = {score, f, V, NL, rows: rows.slice(0, o.maxRows || 4)}; }
    return best || {f: 10.5, V: o.Vs[0], NL: 1, rows: []}; };

  // ---------------- INSIDE SPREAD: one window 17 inches wide. The frame runs round the whole spread (no line at the fold); both pages
  // open with a tracked-caps room name and a Fraunces headline on one horizon; the hero room of each page runs to the outer frame (the
  // kitchen left, the best room right) with its panel toward the fold; one bar crosses both pages at one height carrying the house's
  // facts on line icons; under it the numbered rooms (the sign-in sheet's circles key them, 1 to 5 across the spread).
  const HZ = 162, PH = 296, BY = HZ + PH + 16, BHs = 54, RY = BY + BHs + 16, IN = 30, OUTX = 34;
  FO.SPREAD = {HZ, PH, BY, BHs, RY};
  FO.ccHead = (D, id, title, slot, left) => { const c = FXS.cardFor(D, id) || {}, lab = FXS.leadLabel(c.lead || FO.lead(D, id)), x0 = left ? OUTX : IN + 6, x1 = left ? 612 - IN - 6 : 612 - OUTX, w = x1 - x0;
    if(lab.size) (FXS.__sizes = FXS.__sizes || new Set()).add(lab.size);
    const k = T.caps(String(lab.name || FO.lead(D, id)), x0, w, slot + '.room', {max: 10, ls: 3, wt: 600}), hd = T.head(title, x0, w, 40, 26, 2, slot + '.title');
    const y0 = HZ - 20 - (k.h + 8 + hd.h); return k.html(y0) + hd.html(y0 + k.h + 8); };
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, C = P.cc || {};
    const kid = C.left || 'kitchen', rowC = FO.cards(D, C.leftRow || (P.left || []).filter(id => id !== kid).slice(0, 2));
    let h = T.frame(612, 792, FR, 'tbl') + FO.ccHead(D, kid, C.leftTitle || I.title, 'left', true);
    const KW = 346, cardX = FR + KW + G, cardW = 612 - IN - cardX;
    h += FXS.box(D, kid, FR, HZ, KW, PH, 'left.wide');
    // the kitchen card on the pale panel: its kicker, then rows of real detail, each its label in main-color caps over full lines;
    // a row that only repeats what the back's lists print is left out
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const taken = a => /^(It|Its|They|This|That)\b/.test(a) || SW.grams4(a).some(g => backG.has(g)) || backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w))));
    const iw = cardW - 36, kk = /kitchen/i.test(box.kicker || 'kitchen') ? '' : String(box.kicker), Tb = FO.tableRowsN((box.items || []).slice(0, 10), taken, {maxRows: 5, Vs: [iw - 12, iw - 6, iw], H: PH - 24 - (kk ? 26 : 0), top: 0});
    const rows = Tb.rows, lhT = +(Tb.f*1.42).toFixed(2), NL = Tb.NL, top = kk ? 40 : 12, rowH = (PH - top - 12)/Math.max(1, rows.length);
    let b = `<div class="cc-cell" style="left:${cardX}pt;top:${HZ}pt;width:${cardW}pt;height:${PH}pt"></div>`;
    if(kk) b += `<div class="cc-mk" style="left:${cardX + 18}pt;top:${HZ + 16}pt;width:${iw}pt;height:12pt;letter-spacing:3pt" data-slot="left.box.kicker" data-lines="1">${esc(kk.toUpperCase())}</div>`;
    rows.forEach((r, i) => { const ry = HZ + top + i*rowH, c0 = ry + (rowH - 15 - NL*lhT)/2;
      if(i || kk) b += `<div class="abs" style="left:${cardX}pt;top:${ry - 1}pt;width:${cardW}pt;height:2pt;background:#fff"></div>`;
      b += `<div class="cc-mk" style="left:${cardX + 18}pt;top:${c0}pt;width:${iw}pt;font-size:8.6pt;letter-spacing:1.8pt" data-slot="left.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${cardX + 18}pt;top:${c0 + 15}pt;width:${Tb.V + 1}pt;height:${NL*lhT}pt;font-weight:400;font-size:${Tb.f}pt;line-height:${lhT}pt;font-family:var(--cc-font);color:#1e1e1e;overflow:hidden;${NL > 1 ? 'text-align:justify;text-align-last:left' : 'white-space:nowrap'}" data-slot="left.list.t${i}" data-lines="${NL}">${esc(r.t)}</div>`; });
    h += `<div class="cc-on-wb">${b}</div>`;
    // the bar, left half: the rooms' facts
    const it = FXS.statItems(D.listing).slice(0, 4), half = Math.ceil(it.length/2);
    h += T.bar(BY, BHs, -9, 612) + T.on(T.barFacts(it.slice(0, half), OUTX, 612 - 44, BY, BHs, 'left.fact', {nf: 24, lf: 9.5, isz: 20}));
    const n = Math.max(1, rowC.length), clh = 14.5, Lc = 3, W2 = (612 - IN - OUTX - (n - 1)*G)/n, RH = 792 - FR - 18 - RY - 25 - Lc*clh;
    rowC.forEach((c, i) => { h += FO.keyed(FXS.captioned(D, c, OUTX + i*(W2 + G), RY, W2, RH, Lc, 'left.photo' + i, {fs: 10.75, lh: clh, min: 3}).replace(`data-slot="left.photo${i}" data-room`, `data-slot="left.photo${i}" data-nopair="1" data-room`), i + 1); });
    return h; };
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, C = P.cc || {}, L = D.listing;
    const ids = C.right ? [C.right].concat(C.rightRow || []) : (P.right || []), cs = FO.cards(D, ids), top = cs[0], rest = cs.slice(1, 4);
    let h = T.frame(612, 792, FR, 'tbr') + FO.ccHead(D, top.photo, C.rightTitle || R.title, 'right', false);
    const score = c => /closet|wic|pbath|bath|laundry|hall|powder/i.test(c.photo) ? 0 : /bed|game|living|family|media|flex/i.test(c.photo) ? 2 : 1, ord = rest.slice().sort((a, b) => score(b) - score(a)), n0 = Math.max(1, FO.cards(D, (C.leftRow || []).slice(0, 2)).length);
    // the best room runs to the outer frame; toward the fold a small collage column: its own write-up on the pale panel, set in Fraunces
    // as the page's lead, and under it the weakest room small, numbered and captioned, its caption ending level with the big photo
    const colC = ord.length >= 3 ? ord.pop() : null, PWr = 330, px = 612 - FR - PWr, cx = IN, cw = px - G - cx, clh0 = 13, HP = 104, capH = 25 + 3*clh0;
    const P0 = colC ? PH - G - HP - capH : PH;
    h += FXS.box(D, top.photo, px, HZ, PWr, PH, 'right.wide');
    const c0 = FXS.augment(D, top), wl = 18, ww = cw - 36, nw = Math.max(3, Math.floor((P0 - 28)/wl)), lab = FXS.leadLabel(top.lead).name;
    h += `<div class="cc-cell" style="left:${cx}pt;top:${HZ}pt;width:${cw}pt;height:${P0}pt"></div>`;
    h += `<div class="abs cap"><div class="a" style="position:absolute;left:${cx + 18}pt;top:${HZ + 14}pt;width:${ww}pt;height:${nw*wl}pt;font-size:12.5pt;line-height:${wl}pt;color:#1e1e1e;font-family:Fraunces,Georgia,serif;font-weight:500" data-growlead="${P0 - 24}" data-fs0="12.5" data-slot="right.photo0" data-room="${esc(lab)}" data-lh="${wl}" data-hbox="${nw*wl}" data-lines="${nw}" data-min="3" data-narrow="0" data-cell="${HZ},${P0}" ${FXS.sd(c0.s)}></div></div>`;
    if(colC){ const k = n0 + 1; h += FO.keyed(FXS.captioned(D, colC, cx, HZ + P0 + G, cw, HP, 3, 'right.photo' + k, {fs: 9.75, lh: clh0, min: 3}).replace(`data-slot="right.photo${k}" data-room`, `data-slot="right.photo${k}" data-nopair="1" data-room`), k); }
    const it = FXS.statItems(L).slice(0, 4), half = Math.ceil(it.length/2);
    h += T.bar(BY, BHs, 0, 621) + T.on(T.barFacts(it.slice(half), 44, 612 - OUTX, BY, BHs, 'right.fact', {nf: 24, lf: 9.5, isz: 20}));
    const clh = 13.5, Lc = 3, ws = (612 - OUTX - IN - (ord.length - 1)*G)/Math.max(1, ord.length), RH = 792 - FR - 18 - RY - 25 - Lc*clh;
    ord.forEach((c, i) => { h += FO.keyed(FXS.captioned(D, c, IN + i*(ws + G), RY, ws, RH, Lc, 'right.photo' + (i + 1), {fs: ord.length < 3 ? 11.25 : 10.5, lh: ord.length < 3 ? 15 : 14, min: 3}).replace(`data-slot="right.photo${i + 1}" data-room`, `data-slot="right.photo${i + 1}" data-nopair="1" data-room`), n0 + i + 1 + (colC ? 1 : 0)); });
    return h; };

  // ---------------- BACK (fold-over) and flyer back: the window again. Head on the white: the tracked-caps kicker and one Fraunces line.
  // The listing's own plan in its own small window (a box its shape, a 1.5 pt main-color line, as given) with the floor-by-floor write-up
  // beside it; the two lists on the pale panel, numbered, beside a captioned photo; the bar across the sheet frame to frame carrying
  // Nearby (Fraunces miles, gold caps unit, the place in white caps); the half-height contact card on the white under it.
  FO.NB = 70; FO.CARD_H = 62; FO.CARD_Y = 690; FO.HB = 96;
  FO.nearBar = (D, y, h) => { const N = ((D.sw || {}).back || {}).nearby || [], n = Math.min(3, N.length), x0 = M, cw = (612 - 2*M)/Math.max(1, n); let o = '';
    N.slice(0, n).forEach((nn, i) => { const cx = x0 + i*cw, m = /^([\d.,]+)\s*(.*)$/.exec(String(nn.dist).trim()) || [0, nn.dist, ''], num = m[1], unit = String(m[2] || '').toUpperCase(), pl = String(nn.place).toUpperCase();
      const pf = FXS.fitSize(pl, `${OUT};font-weight:500;letter-spacing:1.8pt`, cw - 24, 9.5, 8.6);
      o += `<div class="abs" data-slot="back.near${i}" data-lines="1" data-fine="1" style="left:${cx}pt;top:${y + (h - 46)/2}pt;width:${cw}pt;height:46pt;text-align:center;white-space:nowrap">`
        + `<div style="${FRA};font-size:24pt;line-height:28pt;color:#fff">${esc(num)}<span style="font-family:Outfit;font-weight:600;font-size:9pt;letter-spacing:2pt;margin-left:6pt;color:var(--cc-gold)">${esc(unit)}</span></div>`
        + `<div style="margin-top:4pt;font-family:Outfit;font-weight:500;font-size:${pf}pt;line-height:13pt;letter-spacing:1.8pt;color:#fff">${esc(pl)}</div></div>`;
      if(i) o += `<div class="abs" style="left:${cx - .5}pt;top:${y + 16}pt;width:1pt;height:${h - 32}pt;background:rgba(255,255,255,.55)"></div>`; });
    return o; };
  // the standard contact card on the white (the flyer's footer): the color logo, main-color labels
  FO.contactW = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = CC.logoPaper(D); const pw = 180, lh = Math.min(46, H - 30), s = {name: 16.5, nameFloor: 13, line: 8.6, rowGap: 10, phone: 12, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div class="cc-ccw cc-white" style="--cc-display:Fraunces;--cc-body:Outfit;--cc-paper:#ffffff;--cc-ink:#161616;--cc-muted:#3a3a3a;--cc-accent:var(--cc-main-ink);--cc-line:var(--cc-main-ink)">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5}) + '</div>'; };
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, C = P.cc || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? (C.flyerTop || (P.backNoplan || [])[0]) : (C.backTop || (P.backNoplan || [])[0]);
    const footId = hasPlan ? topId : flyer ? C.flyerFootNoplan : C.backFootNoplan;
    const L0 = M, R0 = 612 - M, CWb = R0 - L0, TOP = FR + FO.HB + 6, BT = FO.CARD_Y - 16 - FO.NB;
    let h = T.frame(612, 792), top, leftW;
    const LV = hasPlan ? (D.plan.levels || []) : [], tall = hasPlan && (LV.length >= 4 || (LV.length === 1 && LV[0].h/LV[0].w > 1.5));
    const TH = tall ? BT - 16 - 131 - 8 - TOP - 30 : BT - 16 - 190 - 8 - TOP - 30;
    if(hasPlan){ const pc = FO.planBox(D, L0, TOP, TH, tall ? 300 : 352); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom; leftW = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])); }
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    if(!hasPlan){ const tph = Math.max(170, BT - 16 - 200 - TOP - 25 - 42); leftW = 300; const c = FXS.cardFor(D, topId); h += FXS.captioned(D, c, L0, TOP, leftW, tph, 3, 'back.top', {fs: 10.5, lh: 14, min: 3}); top = TOP + tph + 25 + FXS.MAT + 3*14; }
    const used = FO.cards(D, [topId, footId].filter(Boolean));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s)), ax = L0 + leftW + 20, aw = R0 - ax;
    const kickT = +(D.listing || {}).stories > 1 ? 'Floor by floor' : 'Room by room';
    const ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, '');
    // the head on the white: the kicker, then one Fraunces line (two when it must), centered in the head zone
    h += T.vstack(FR, FO.HB, [T.caps(flyer ? (T.addr(D.listing).full + '  ·  ' + kickT) : kickT, L0, CWb, 'back.about.title', {max: 10, ls: 3, wt: 600}), ...(ht ? [T.head(ht, L0, CWb, 36, 22, 2, 'back.about.head')] : [])], 6);
    if(tall){
      const c0 = FXS.cardFor(D, footId || topId), PHt = 112, lh = 15, yE = TOP + PHt + 25 + FXS.MAT + 3*13.5 + 14, T0 = yE, Rr = top - T0 - 9, N = Math.max(6, Math.floor(Rr/lh));
      if(c0) h += FXS.captioned(D, c0, ax, TOP, aw, PHt, 3, 'back.photo0', {fs: 10.25, lh: 13.5, min: 3});
      const para = (list, y, n, slot) => FO.wu(list, ax, y, aw, n*lh + 0.01, slot, 10.5, lh, 'body').replace(`data-slot="${slot}"`, `data-slot="${slot}" data-narrow="0" data-fill="0.9" data-lfill="0.8" data-rag="1" data-tall="1" data-para="1"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
      h += para(keep(f2.concat(f1)), T0, N, 'back.about');
      h += `<div data-tallcol="${top}" style="display:none"></div>`;
    } else {
      const T0 = TOP + 2, n = Math.floor((top - T0)/16), lh = +((top - T0)/n).toFixed(3);
      h += FO.full(FO.wu(keep(f2.concat(f1)), ax, T0, aw, n*lh + 0.01, 'back.about', 10.75, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${aw < 240 ? ' data-rag="1"' : ''} data-span="${(top - T0).toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
    }
    const BOXB = BT - 16, footC = !tall && footId ? FXS.cardFor(D, footId) : null;
    const listHead = (n, t, x, y, w, slot) => T.circ(n, x, y - 2, 15) + `<div class="cc-wl" style="left:${x + 22}pt;top:${y}pt;width:${w - 22}pt" data-slot="${slot}" data-lines="1">${esc(t.toUpperCase())}</div>`;
    if(footC){   // the lists stacked on the pale panel, the captioned photo beside it, one height
      const by = top + 18, BH = BOXB - by, PW = 228, BW = CWb - PW - 16, cw = BW - 36; let t = `<div class="cc-wb" style="left:${L0}pt;top:${by}pt;width:${BW}pt;height:${BH}pt"></div>`;
      const n1 = Math.min(c1.length, 4), n2 = Math.min(c2.length, 4), rh = Math.min(24, (BH - 26 - 2*19 - 12)/(n1 + n2)), ch = 18 + n1*rh + 12 + 18 + n2*rh; let y = by + Math.max(13, (BH - ch)/2);
      t += listHead(1, t1, L0 + 18, y, cw, 'back.updates.title') + FXS.bullets(c1, L0 + 18, y + 18, cw, rh, 'back.updates', n1, 10).html; y += 18 + n1*rh + 12;
      t += listHead(2, 'Outside', L0 + 18, y, cw, 'back.outside.title') + FXS.bullets(c2, L0 + 18, y + 18, cw, rh, 'back.outside', n2, 10).html;
      h += `<div class="cc-on-wb">${t}</div>` + FXS.captioned(D, footC, R0 - PW, by, PW, BH - 25 - FXS.MAT - 3*14, 3, 'back.photo1', {fs: 10.75, lh: 14, min: 3});
    } else {   // the lists in two columns across the page, the panel sized to them
      const cw = (CWb - 36 - 24)/2, nr = Math.max(Math.min(c1.length, 4), Math.min(c2.length, 4), 2), rh = 22, BH = 13 + 19 + nr*rh + 11, by = BOXB - BH;
      let t = `<div class="cc-wb" style="left:${L0}pt;top:${by}pt;width:${CWb}pt;height:${BH}pt"></div><div class="abs" style="left:${L0 + CWb/2 - 1}pt;top:${by}pt;width:2pt;height:${BH}pt;background:#fff"></div>`;
      t += listHead(1, t1, L0 + 18, by + 13, cw, 'back.updates.title') + FXS.bullets(c1, L0 + 18, by + 32, cw, rh, 'back.updates', 4, 10).html;
      t += listHead(2, 'Outside', L0 + 18 + cw + 24, by + 13, cw, 'back.outside.title') + FXS.bullets(c2, L0 + 18 + cw + 24, by + 32, cw, rh, 'back.outside', 4, 10).html;
      h += `<div class="cc-on-wb">${t}</div>`;
    }
    h += T.bar(BT, FO.NB) + T.on(FO.nearBar(D, BT, FO.NB));
    h += FO.contactW(D, L0, FO.CARD_Y, CWb, FO.CARD_H) + FO.fine(D).replace('top:758pt', 'top:' + (FO.CARD_Y + FO.CARD_H + 4) + 'pt').replace(/left:[\d.]+pt;top/, `left:${L0}pt;top`).replace(/width:[\d.]+pt;height:8pt/, `width:${CWb}pt;height:8pt`);
    return {html: h, issues};
  };
})();
