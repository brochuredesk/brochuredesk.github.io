/* Open House extras for design sets, batch h (owner 11/15/2026: every set gets its own sign-in sheet and feedback card):
   FXS-23, FXS-24, FXS-28, FXS-36, FXS-40. These sets have fixed palettes (not the agent's brand kit), so each look carries its
   set's own colors, drawn inside one wrapper that sets the page's color variables (the footer and write-in rules read them).
   The writing area (columns, fields, standard footer #1, light grayscale photo on black and white, no date on public
   sign-in sheets) is the approved system; the look around it comes from the set's own fold-over, flyers and postcards.

   Round 2 (owner 11/15/2026, the design pass): the house leads on every sheet (3 in or wider, bleeding or filling a panel),
   every color card carries a real field of its set's color, each set brings its signature over at full size, every
   feedback card has its own layout, and the writing areas are easier on a pen (a rule down every column, rows tinted 8%
   or lighter, Y/N marks 0.28 in, headers 8.5 pt and up, answer lines 0.28 in apart, round rating marks under "Circle one",
   every mark to circle on a light ground). Black-and-white cards print the brokerage's black logo.
     FXS-23  black page, the gold double frame that the corner photo breaks (its postcards), the gold Pinyon script headline, the
             fact row between gold hairlines; the writing area is a cream card under a gold header band
     FXS-24  royal blue bar with the street in tracked bold caps, the photo and blue fact panel under it (its Open House
             flyer), a solid blue number gutter, a blue agent footer; Montserrat
     FXS-28  cream page, the forest spine carrying the street name, the photo beside a stack of forest stat tiles,
             forest number tiles; the feedback card's date is a tile too; Oswald caps / Montserrat
     FXS-36  black page, the big red Oswald address, the photo running off the corner beside its column of red tiles,
             heavy red rules, red number tiles and red label tabs on a white card
     FXS-40  white page, the photo beside a pale blue panel with the slate circle badge sitting over the photo's edge,
             icon facts, a slate header band and filled slate number circles; Oswald / Montserrat */
(function(){
  const X = Extras, L$ = X.looks, K = X.lib;
  const {cols, labels, qs, box, txt, ph, foot1, icon, edge} = K;
  const MONT = "'Mont H',Helvetica,Arial,sans-serif", OSW = "'Osw H','Arial Narrow',Impact,sans-serif", CORM = "'Corm H',Georgia,serif", PIN = "'Pinyon H',cursive";

  /* ---------- the five fixed palettes (from each set's tokens) and the black-and-white one ---------- */
  const PAL = {
    '23': {dark: '#0e0e0e', page: '#0e0e0e', card: '#f4efe5', ink: '#2a2a2a', muted: '#5a5448', acc: '#d6b56e', accInk: '#6b5217', fill: '#d6b56e', onFill: '#0e0e0e',
      hi: '#ffffff', hiSoft: '#dedede', hiAcc: '#d6b56e', lineOn: 'rgba(214,181,110,.5)', line: 'rgba(107,82,23,.38)', tint: 'rgba(214,181,110,.08)', pale: '#f4efe5', disp: CORM},
    '24': {dark: '#1e4b8f', page: '#ffffff', card: '#ffffff', ink: '#161616', muted: '#4a4a4a', acc: '#1e4b8f', accInk: '#1e4b8f', fill: '#1e4b8f', onFill: '#ffffff',
      hi: '#ffffff', hiSoft: '#dbe5f5', hiAcc: '#dbe5f5', lineOn: 'rgba(255,255,255,.4)', line: 'rgba(30,75,143,.34)', tint: 'rgba(0,0,0,.032)', pale: '#ffffff', disp: MONT},
    '28': {dark: '#1d3b3a', page: '#ece4d6', card: '#f4efe4', ink: '#1d3b3a', muted: '#4f4c43', acc: '#1d3b3a', accInk: '#1d3b3a', fill: '#1d3b3a', onFill: '#ece4d6',
      hi: '#ece4d6', hiSoft: '#d9d1c2', hiAcc: '#ece4d6', lineOn: 'rgba(236,228,214,.4)', line: 'rgba(29,59,58,.36)', tint: 'rgba(29,59,58,.05)', pale: '#f4efe4', disp: OSW, name: MONT},
    '36': {dark: '#141414', page: '#141414', card: '#ffffff', ink: '#1a1a1a', muted: '#4a4a4a', acc: '#c8102e', accInk: '#c8102e', fill: '#c8102e', onFill: '#ffffff',
      hi: '#ffffff', hiSoft: '#d8d8d8', hiAcc: '#ffffff', lineOn: 'rgba(255,255,255,.34)', line: 'rgba(26,26,26,.3)', tint: 'rgba(0,0,0,.035)', pale: '#ffffff', disp: OSW, name: MONT},
    '40': {dark: '#45556a', page: '#ffffff', card: '#ffffff', ink: '#45556a', muted: '#4f4f4f', acc: '#45556a', accInk: '#45556a', fill: '#45556a', onFill: '#ffffff',
      hi: '#ffffff', hiSoft: '#e6ecf1', hiAcc: '#ffffff', lineOn: 'rgba(255,255,255,.34)', line: 'rgba(69,85,106,.42)', tint: 'rgba(69,85,106,.07)', pale: '#d5dee6', disp: OSW, name: MONT}};
  // black and white: white field, black ink; "hi" (type that sits on the set's dark fields) is black because those fields are white
  const BWP = {dark: '#111', page: '#fff', card: '#fff', ink: '#111', muted: '#4a4a4a', acc: '#111', accInk: '#111', fill: '#111', onFill: '#fff', hi: '#111', hiSoft: '#4a4a4a', hiAcc: '#111',
    lineOn: 'rgba(0,0,0,.36)', line: 'rgba(0,0,0,.36)', tint: 'rgba(0,0,0,.035)', pale: '#fff'};
  const pal = (k, E) => E.bw ? Object.assign({}, BWP, {disp: PAL[k].disp, name: PAL[k].name}) : PAL[k];
  // black-and-white cards print the brokerage's black logo, never a colored one turned grey (round 2, finding 7)
  const forBw = (D, E) => { if(!E.bw) return D; const b = D.brand || {}, k = (b.logos || {}).black || b.logoBlack;
    return k ? Object.assign({}, D, {brand: Object.assign({}, b, {logo: k})}) : D; };
  // everything is drawn inside one wrapper that sets the page's variables (the shared footer and write-in rules read them)
  const wrap = (P, body, W, H) => `<div class="abs" data-fxacc="${P.hiAcc}" data-fxh="1" style="left:0;top:0;width:${W}pt;height:${H}pt;font-family:${MONT};color:${P.ink};--paper:${P.card};--ink:${P.ink};--muted:${P.muted};--accent:${P.accInk};` +
    `--line:${P.line};--tint:${P.tint};--on:${P.hi};--on-soft:${P.hiSoft};--gold:${P.hiAcc};--line-on:${P.lineOn};--font-display:${P.name || P.disp};--font-body:${MONT};--cc-paper:transparent">${body}</div>`;
  // the standard footer judges its small accent label (CALL / TEXT) as if the paper were white; on this batch's dark fields the
  // label and stripe take the set's own light accent instead (only inside this batch's wrapper)
  if(window.StandardFooter && !StandardFooter._hh){
    const fin = StandardFooter.finish; StandardFooter._hh = 1;
    StandardFooter.finish = function(root){
      const r = fin.apply(this, arguments);
      (root || document).querySelectorAll('[data-fxacc] .std-footer-1[style*="--cc-ink:#fff"]').forEach(w => { const c = w.closest('[data-fxacc]').dataset.fxacc;
        w.querySelectorAll('.cc-acc').forEach(e => e.style.color = c); w.querySelectorAll('.cc-stripe').forEach(e => e.style.background = c); });
      return r; };
  }
  const dateText = ev => `${ev.long}   ·   ${ev.time}`;
  const f3 = (L, short) => [[String(L.beds), short ? 'Beds' : 'Bedrooms'], [String(Number(L.baths)), 'Baths'], [Number(L.sqft).toLocaleString('en-US'), 'Sq Ft']];
  const disc = (x, y, d, style) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${d}pt;height:${d}pt;border-radius:50%;${style}"></div>`;

  /* ---------- the sign-in writing area: header labels, seven rows, a rule down every column. o shapes each look ---------- */
  const tbl = (E, P, o) => {
    // rows: seven, or eight where the owner asked for one more (Royal Blue Bar, Forest Spine; owner 11/16/2026); the second sheet
    // numbers on from the first. bleedL / bleedR (pt): the tints, the number gutter and the rules run that far past the table's
    // sides, off the sheet on the printer file (a table that runs edge to edge)
    const N = o.rows || 7, first = (E.first - 1) / 7 * N + 1, bl = o.bleedL || 0, br = o.bleedR || 0;
    const x0 = o.x0, W = o.W, top = o.top, bot = o.bot, hd = o.hd || 34, rh = (bot - top - hd) / N, y0 = top + hd, n = o.numW || 40, R = W - n, d = o.ynD || 20;
    const w1 = Math.round(R * .30), w2 = Math.round(R * .28), w3 = Math.max(112, Math.round(R * .16));
    const cs = cols(x0, n, [w1, w2, w3, R - w1 - w2 - w3]);
    let h = o.headBg ? box(x0 - bl, top, W + bl + br, hd, `background:${o.headBg}`) : '';
    h += labels(cs, top + (o.labY == null ? 6 : o.labY), o.labH || 22, o.label);
    if(o.headRule) h += box(x0 - bl, y0 - o.headRule, W + bl + br, o.headRule, `background:${o.headColor || P.fill}`);
    for(let i = 0; i < N; i++) if(o.band && o.band(i)) h += `<div class="rowband" style="left:${x0 - bl}pt;top:${y0 + i * rh}pt;width:${W + bl + br}pt;height:${rh}pt;background:${o.bandBg || P.tint}"></div>`;
    // the number gutter is the table's own furniture, like a row's tint (class rowband)
    if(o.gutter) h += `<div class="rowband" style="left:${x0 - bl}pt;top:${y0}pt;width:${n + bl}pt;height:${N * rh}pt;background:${o.gutter}"></div>`;
    for(let i = 0; i < N; i++){
      const y = y0 + i * rh;
      h += o.num(first + i, x0, y, rh, n);
      if(i < N - 1) h += box(x0 + (o.gutter ? n : -bl), y + rh, W - (o.gutter ? n : -bl) + br, 0, o.sep || `border-top:.5pt solid ${P.line}`);
      if(i < N - 1 && o.gutter) h += box(x0 - bl, y + rh - .4, n + bl, .8, `background:${o.gutterSep || '#fff'}`);
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - d - 3, y + rh / 2 - d / 2, d, o.yn); });
    }
    cs.forEach((c, i) => { if(i || !o.gutter) h += `<div class="vrule" style="left:${c.x}pt;top:${y0 + (o.headBg ? 1.5 : 0)}pt;height:${N * rh - (o.headBg ? 1.5 : 0)}pt"></div>`; });
    return h;
  };
  const numBox = (st, wd, hg) => (n, x, y, rh, nw) => `<div class="abs" style="left:${x + (nw - wd) / 2}pt;top:${y + rh / 2 - (hg || 24) / 2}pt;width:${wd}pt;height:${hg || 24}pt;text-align:center;${st(n)}">${n}</div>`;

  /* ---------- the feedback card's fields (the approved wording and order); each look places them its own way ---------- */
  // S: lab (label type), q + qsz (question type), first (a question's top to its first answer line), sp (line to line, 0.28 in or more)
  const fbk = S => {
    const sp = S.sp || 20.5, first = S.first || 30, ln = S.line || '';
    const lab = (slot, s, x, y, w, extra) => txt(slot, s, x, y, w, `${S.lab};line-height:1;${extra || ''}`);
    const ask = (k, text, x, y, w, n) => X.line('q.' + k, text, x, y, w, S.qsz, 8, '', S.q) + Array.from({length: n}, (_, i) => X.wline(x, y + first + i * sp, w, ln)).join('');
    const field = (slot, s, x, y, w) => lab(slot, s, x, y, w) + X.wline(x, y + 21, w, ln);
    // the three price answers, the middle one a little wider (its words are longer)
    const pills = (FB, x, y, w, hgt, style, gap) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;display:flex;gap:${gap == null ? 5 : gap}pt">` +
      FB.choices.map((c, i) => `<span class="pill" style="flex:${i === 1 ? 1.34 : 1} 1 0;min-width:0;white-space:nowrap;height:${hgt}pt;${style}">${c}</span>`).join('') + '</div>';
    return {lab, ask, field, pills, sp, first};
  };
  // Oswald column labels: the face's line box is taller than its type, so the label keeps 3 pt under it (the label fitter measures the line box)
  const OSL = `font:600 11pt/12pt ${OSW};letter-spacing:1.5pt;text-transform:uppercase;padding-bottom:3pt`;
  // rating and price marks are always outlined, never filled, in the set's own mark shape (round 3): squares, or circles on the badge set
  const round = s => () => `${s};border-radius:50%`, sq = s => () => `${s};border-radius:0`;

  /* ============================== FXS-23: black, gold double frame, gold script ============================== */
  // the gold double frame, whole on every card: the photo sits inside it, as on every piece of the set (round 3)
  const frame23 = (P, W, H) => box(22, 22, W - 44, H - 44, `border:.8pt solid ${P.acc}`) + box(25.6, 25.6, W - 51.2, H - 51.2, `border:.4pt solid ${P.acc};opacity:.75`);
  L$['fxs-23-signin'] = (D, E) => {
    D = forBw(D, E);
    const P = pal('23', E), L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 48, pw = 696, e = edge(E);
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', `background:${P.dark}`);
    // the photo sits inside the gold frame, lined up with the card under it
    h += frame23(P, 792, 612) + ph(D, E, 43, 38, 272, 156);
    const tx = 338, tw = 749 - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 33, dated ? 196 : tw, 9.5, 8, '', `font:500 9.5pt/1 ${MONT};letter-spacing:4.5pt;color:${P.hiAcc}`);
    if(dated) h += X.line('oh.date', dateText(ev), tx + 200, 30, tw - 200, 13, 9, '', `text-align:right;font:600 13pt/15pt ${CORM};color:${P.hi}`);
    // the script title sits centered top to bottom between the label line and the address by its own ink (its swash and the
    // tail of the g, not the font box; owner 11/16/2026, p21-p22)
    h += X.inkMark(X.line('title', 'Please sign in', tx - 4, 49, tw + 4, 58, 36, '', `font:400 58pt/64pt ${PIN};color:${P.hiAcc}`), 'data-inkv="oh.label|oh.date:address"');
    h += X.line('address', L.address.toUpperCase(), tx, 127, tw, 26, 16, '', `font:600 26pt/29pt ${CORM};letter-spacing:2.2pt;color:${P.hi}`);
    h += X.line('place', X.place(L).toUpperCase(), tx, 159, tw, 8.5, 8, '', `font:500 8.5pt/1 ${MONT};letter-spacing:2.6pt;color:${P.hiAcc}`);
    // the fact row between gold hairlines (the flyer's fact column, laid on its side)
    const cw = tw / 3;
    h += box(tx, 173, tw, 0, `border-top:.6pt solid ${P.acc}`) + box(tx, 202, tw, 0, `border-top:.6pt solid ${P.acc}`);
    f3(L).forEach(([v, l], i) => { const x = tx + i * cw;
      if(i) h += box(x, 178, 0, 19, `border-left:.6pt solid ${P.acc}`);
      h += `<div class="abs nowrap" data-slot="fact${i}" style="left:${x + (i ? 14 : 0)}pt;top:175.5pt;width:${cw - (i ? 20 : 8)}pt;height:25pt;color:${P.hi}"><span style="font:500 20pt/25pt ${CORM}">${v}</span> <span style="font:500 8pt/1 ${MONT};letter-spacing:2.6pt;text-transform:uppercase;color:${P.hiAcc};margin-left:5pt">${l}</span></div>`; });
    // the cream card: gold rules over and under the labels (no filled bar), Cormorant numerals in deep gold
    const top = 216, bot = 504, hd = 34;
    h += box(m, top, pw, bot - top, bw ? `border:.9pt solid ${P.ink}` : `background:${P.card}`) + box(m - 5, top - 5, pw + 10, bot - top + 10, `border:.8pt solid ${P.acc}`);
    h += tbl(E, P, {x0: m, W: pw, top, bot, hd, numW: 50, headRule: bw ? 1.6 : 1.2, headColor: P.accInk, labY: 5, label: `font:600 8.5pt/10pt ${MONT};letter-spacing:1.9pt;text-transform:uppercase;color:${P.accInk}`, band: i => i % 2 === 1,
      num: numBox(() => `font:600 23pt/26pt ${CORM};font-variant-numeric:lining-nums;color:${P.accInk}`, 44, 26), yn: `border:.9pt solid ${P.accInk};color:${P.accInk};font:600 9pt/1 ${MONT};border-radius:0`});
    h += foot1(D, [m, 518, pw, 56], {dark: !bw});
    return wrap(P, h, 792, 612);
  };

  L$['fxs-23-feedback'] = (D, E) => {
    D = forBw(D, E);
    const P = pal('23', E), L = D.listing, ev = X.ev(D), bw = E.bw, m = 36, pw = 540, e = edge(E), FB = qs(D);
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', `background:${P.dark}`);
    h += frame23(P, 612, 396) + ph(D, E, 40, 36, 138, 58);
    const tx = 196, tw = 576 - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 35, 170, 8, 8, '', `font:500 8pt/1 ${MONT};letter-spacing:3.6pt;color:${P.hiAcc}`);
    h += X.line('oh.date', dateText(ev), tx + 174, 31, tw - 174, 12, 8.5, '', `text-align:right;font:600 12pt/14pt ${CORM};color:${P.hi}`);
    h += X.line('title', 'Your feedback', tx - 3, 46, 200, 36, 26, '', `font:400 36pt/42pt ${PIN};color:${P.hiAcc}`);
    h += X.line('address', L.address.toUpperCase(), tx + 216, 55, tw - 216, 15, 10, '', `text-align:right;font:600 15pt/17pt ${CORM};letter-spacing:1.6pt;color:${P.hi}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), tx + 216, 76, tw - 216, 8, 8, '', `text-align:right;font:500 8pt/1 ${MONT};letter-spacing:2pt;color:${P.hiAcc}`);
    // the cream card: the ratings as a fact column between gold hairlines, then two columns to write in
    const top = 102, bot = 300, hl = bw ? P.line : 'rgba(107,82,23,.5)';
    h += box(m, top, pw, bot - top, bw ? `border:.9pt solid ${P.ink}` : `background:${P.card}`) + box(m - 4, top - 4, pw + 8, bot - top + 8, `border:.8pt solid ${P.acc}`);
    const F = fbk({lab: `font:600 8pt/1 ${MONT};letter-spacing:1.8pt;text-transform:uppercase;color:${P.accInk}`, q: `font-family:${CORM};font-weight:600;color:${P.ink}`, qsz: 10.5, first: 30, sp: 20.5});
    const rx = m + 14, rw = 142, hair = y => box(rx, y, rw, 0, `border-top:.6pt solid ${hl}`), lite = bw ? '#fff' : '#fbf8f2';
    h += F.lab('q.price', FB.price, rx, top + 12, rw);
    // the price choices in the set's letterspaced caps, one to a line with room around the words
    FB.choices.forEach((c, i) => { h += `<span class="pill abs" style="left:${rx}pt;top:${top + 25 + i * 20}pt;width:${rw}pt;height:17pt;white-space:nowrap;border:.8pt solid ${P.accInk};color:${P.ink};background:${lite};font:500 8pt/1 ${MONT};letter-spacing:2.2pt;border-radius:0">${c}</span>`; });
    h += hair(top + 90);
    const dot = sq(`background:${lite};border:.8pt solid ${P.accInk};color:${P.ink};font:600 12pt/1 ${CORM};font-variant-numeric:lining-nums`);
    h += F.lab('q.cond', FB.cond, rx, top + 97, rw) + X.dots(rx, top + 109, rw, 20, dot);
    h += hair(top + 136);
    h += F.lab('q.shows', FB.shows, rx, top + 143, rw) + X.dots(rx, top + 155, rw, 20, dot);
    h += txt('q.scale', FB.scale, rx, top + 181, rw, `font:400 8pt/1 ${MONT};color:${P.muted}`);
    h += box(rx + rw + 11, top + 12, 0, bot - top - 24, `border-left:.6pt solid ${hl}`);
    const ax = rx + rw + 22, cw = 168, bx = ax + cw + 16, [p1, p2, p3] = FB.prompts;
    h += F.ask(p1[0], p1[1], ax, top + 8, cw, 3) + F.ask(p2[0], p2[1], ax, top + 87, cw, 3) + F.field('q.name', FB.name, ax, top + 169, cw);
    h += F.ask(p3[0], p3[1], bx, top + 8, cw, 3) + F.ask('seller', FB.seller, bx, top + 87, cw, 2) + F.field('q.contact', FB.contact, bx, top + 169, cw);
    h += foot1(D, [m, 310, pw, 54], {dark: !bw});
    return wrap(P, h, 612, 396);
  };

  /* ============================== FXS-24: royal blue bar, photo and fact panel, Montserrat ============================== */
  L$['fxs-24-signin'] = (D, E) => {
    D = forBw(D, E);
    const P = pal('24', E), L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 48, pw = 696, e = edge(E);
    // the bar with the street in tracked caps, then the photo with the blue fact panel beside it (the Open House flyer's top);
    // the street a size up and centered both ways in the bar by its own ink (owner 11/16/2026, p25-p26)
    let h = E.fl(0, 0, 792, 54, 'ltr', `background:${P.dark}`);
    h += X.inkMark(X.line('address', L.address.toUpperCase(), m, E.home ? 18 : 9, pw, 30, 16, '', `text-align:center;font:800 30pt/36pt ${MONT};letter-spacing:6pt;color:#fff`), `data-inkv="${E.home ? 18 : 0}:54" data-inkh="0:792"`);
    h += ph(D, E, e, 58, 372 - e, 140);
    const px = 376, x0 = px + 22, w0 = 744 - x0;
    h += bw ? box(px, 58, 792 - e - px, 140, 'border:1.2pt solid #111') : E.fl(px, 58, 792 - px, 140, 'r', `background:${P.dark}`);
    h += X.line('oh.label', ev.label.toUpperCase(), x0, dated ? 68 : 72, w0, 9, 8, '', `font:700 9pt/1 ${MONT};letter-spacing:2.6pt;color:${P.hiSoft}`);
    h += X.line('title', 'Please sign in', x0, dated ? 80 : 88, w0, dated ? 27 : 31, 20, '', `font:800 ${dated ? '27pt/31pt' : '31pt/36pt'} ${MONT};letter-spacing:2pt;text-transform:uppercase;color:${P.hi}`);
    if(dated) h += X.line('oh.date', dateText(ev), x0, 114, w0, 10.5, 8, '', `font:600 10.5pt/13pt ${MONT};color:${P.hi}`);
    h += box(x0, 134, w0, 0, `border-top:.6pt solid ${P.lineOn}`);
    const cw = w0 / 3;
    f3(L).forEach(([v, l], i) => { const x = x0 + i * cw;
      if(i) h += box(x, 144, 0, 40, `border-left:.6pt solid ${P.lineOn}`);
      h += txt('fact' + i, v, x + 4, 142, cw - 8, `text-align:center;font:800 22pt/26pt ${MONT};color:${P.hi}`);
      h += txt('fact' + i + 'l', l, x + 4, 173, cw - 8, `text-align:center;font:600 8pt/1 ${MONT};letter-spacing:1.8pt;text-transform:uppercase;color:${P.hiSoft}`); });
    // the table: no second header bar; a heavy blue rule, and the row numbers in one solid blue gutter. Eight rows, run edge to
    // edge under the photo and the blue column (to the white margin at home, off the sheet on the printer file; owner 11/16/2026)
    const top = 208, bot = 526, hd = 32, tx0 = Math.max(e, 0), tW = 792 - 2 * tx0, bl = E.home ? 0 : 9;
    h += tbl(E, P, {x0: tx0, W: tW, top, bot, hd, rows: 8, bleedL: bl, bleedR: bl, numW: 42, headRule: 2.5, labY: 3, label: `font:700 8.5pt/10pt ${MONT};letter-spacing:1.7pt;text-transform:uppercase;color:${P.accInk}`, band: i => i % 2 === 1,
      gutter: P.fill, num: numBox(() => `font:800 15pt/24pt ${MONT};color:#fff`, 34), yn: `border:1pt solid ${P.accInk};color:${P.accInk};font:700 9pt/1 ${MONT};border-radius:0`});
    h += box(tx0 - bl, bot, tW + 2 * bl, 0, `border-top:1.4pt solid ${P.fill}`);
    // the agent's blue band, shorter top to bottom (owner 11/16/2026): the card sits centered in what shows of it
    const fy = 534, fh = 50, vis = E.home ? 594 : 612;
    h += bw ? box(tx0 - bl, fy + 1, tW + 2 * bl, 3.5, 'background:#111') : E.fl(0, fy, 792, 612 - fy, 'lrb', `background:${P.dark}`);
    h += foot1(D, [m, bw ? fy + 9 : Math.round((fy + vis) / 2 - fh / 2), pw, fh], {dark: !bw});
    return wrap(P, h, 792, 612);
  };

  L$['fxs-24-feedback'] = (D, E) => {
    D = forBw(D, E);
    const P = pal('24', E), L = D.listing, ev = X.ev(D), bw = E.bw, m = 40, pw = 532, e = edge(E), FB = qs(D);
    // owner 11/16/2026 (p27-p28): the street bigger and centered both ways in the bar by its own ink; the agent's band shorter;
    // everything between them a size up to fill the room it gave back
    let h = E.fl(0, 0, 612, 42, 'ltr', `background:${P.dark}`);
    h += X.inkMark(X.line('address', L.address.toUpperCase(), m, E.home ? 19 : 10, pw, 18, 10, '', `text-align:center;font:800 18pt/22pt ${MONT};letter-spacing:5pt;color:#fff`), `data-inkv="${E.home ? 18 : 0}:42" data-inkh="0:612"`);
    // the photo under the bar; beside it the title, then the ratings as the set's stat band
    const pr = 160, by = 88, bh = 58;
    h += ph(D, E, e, 46, pr - e, by + bh - 46);
    const tx = pr + 16, tw = 572 - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 49, 170, 8.5, 8, '', `font:700 8.5pt/1 ${MONT};letter-spacing:2.6pt;color:${P.accInk}`);
    h += X.line('oh.date', dateText(ev), tx + 174, 48, tw - 174, 9, 8, '', `text-align:right;font:600 9pt/11pt ${MONT};color:${P.ink}`);
    h += X.line('title', 'Your feedback', tx, 58, tw, 25, 16, '', `font:800 25pt/29pt ${MONT};letter-spacing:2.6pt;text-transform:uppercase;color:${P.accInk}`);
    h += box(pr + 4, by, 612 - e - pr - 4, bh, `border-top:2.5pt solid ${P.fill};border-bottom:1pt solid ${P.fill}`);   // white, between blue rules (the set is solid blue or white)
    const F = fbk({lab: `font:700 8.5pt/1 ${MONT};letter-spacing:1.3pt;text-transform:uppercase;color:${P.accInk}`, q: `font-family:${MONT};font-weight:700;color:${P.ink}`, qsz: 10.5, first: 29, sp: 21.5, line: `border-top-color:${P.line}`});
    const c1 = 178, c2 = (tw - c1 - 28) / 2, x2 = tx + c1 + 14, x3 = x2 + c2 + 14;
    h += F.lab('q.price', FB.price, tx, by + 9, c1);
    h += F.pills(FB, tx, by + 22, c1, 21, `border:1pt solid ${P.fill};color:${P.accInk};background:#fff;font:600 8pt/1 ${MONT};letter-spacing:.2pt;border-radius:0`, 4);
    const dot = sq(`background:#fff;border:1pt solid ${P.fill};color:${P.accInk};font:700 10pt/1 ${MONT}`);
    h += box(x2 - 7, by + 9, 0, bh - 16, `border-left:.6pt solid ${P.line}`) + box(x3 - 7, by + 9, 0, bh - 16, `border-left:.6pt solid ${P.line}`);
    h += F.lab('q.cond', FB.cond, x2, by + 9, c2) + X.dots(x2, by + 22, c2, 18, dot);
    h += F.lab('q.shows', FB.shows, x3, by + 9, c2) + X.dots(x3, by + 22, c2, 18, dot);
    h += txt('q.scale', FB.scale, x2, by + 45, 2 * c2 + 14, `text-align:right;font:500 8pt/1 ${MONT};color:${P.muted}`);
    // two wide columns to write in
    const cw = 254, bx = m + cw + 24, y1 = 155, [p1, p2, p3] = FB.prompts;
    h += F.ask('seller', FB.seller, m, y1, cw, 2) + F.ask(p1[0], p1[1], m, y1 + 60, cw, 3);
    h += F.field('q.name', FB.name, m, y1 + 140, 119) + F.field('q.contact', FB.contact, m + 135, y1 + 140, cw - 135);
    h += F.ask(p2[0], p2[1], bx, y1, cw, 3) + F.ask(p3[0], p3[1], bx, y1 + 84, cw, 3);
    // the agent's blue band, shorter top to bottom: the card sits centered in what shows of it
    const fy = 324, fh = 48, vis = E.home ? 378 : 396;
    h += bw ? box(m, fy + 1, pw, 3.5, 'background:#111') : E.fl(0, fy, 612, 396 - fy, 'lrb', `background:${P.dark}`);
    h += foot1(D, [m, bw ? fy + 9 : Math.round((fy + vis) / 2 - fh / 2), pw, fh], {dark: !bw});
    return wrap(P, h, 612, 396);
  };

  /* ============================== FXS-28: cream page, forest spine, stat tiles, Oswald ============================== */
  // text turned a quarter turn up the spine: the box is len long, centered on (cx, cy); text-align left starts at the bottom
  const up = (slot, text, cx, cy, len, hgt, size, floor, style) => X.line(slot, text, cx - len / 2, cy - hgt / 2, len, size, floor, '', `height:${hgt}pt;transform:rotate(-90deg);${style}`);
  const spine = (D, E, P, sw, H, size) => {
    const L = D.listing, cx = (sw + edge(E)) / 2, on = E.bw ? '#fff' : P.hi, soft = E.bw ? '#e2e2e2' : P.hiSoft;
    let h = E.fl(0, 0, sw, H, 'ltb', `background:${P.dark}`);
    const len = H - 190;
    h += up('spine', L.address.toUpperCase(), cx, H - 30 - len / 2, len, size * 1.3, size, 16, `text-align:left;font:600 ${size}pt/${size * 1.3}pt ${OSW};letter-spacing:3pt;color:${on}`);
    h += up('spine.place', String(L.neighborhood || 'Houston').toUpperCase(), cx, 36 + 60, 120, 14, 10, 8, `text-align:right;font:500 10pt/14pt ${MONT};letter-spacing:5pt;color:${soft}`);
    return h;
  };
  L$['fxs-28-signin'] = (D, E) => {
    D = forBw(D, E);
    const P = pal('28', E), L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 84, pw = 660, sw = 66;
    const on = bw ? '#fff' : P.hi, soft = bw ? '#e2e2e2' : P.hiSoft;
    let h = spine(D, E, P, sw, 612, 26);
    // the photo with the stat tiles stacked beside it (the Open House flyer), then the title
    h += ph(D, E, m, 30, 286, 146);
    const tx = m + 286 + 8, tw = 92;
    f3(L).forEach(([v, l], i) => { const y = 30 + i * 50;
      h += box(tx, y, tw, 46, `background:${P.dark}`);
      h += txt('tile' + i, v, tx, y + 4, tw, `text-align:center;font:600 22pt/25pt ${OSW};color:${on}`);
      h += txt('tile' + i + 'l', l, tx, y + 32, tw, `text-align:center;font:600 8pt/1 ${MONT};letter-spacing:1.8pt;text-transform:uppercase;color:${soft}`); });
    // the title block sits centered top to bottom beside the tiles (with or without the date line)
    const rx = tx + tw + 20, rw = 744 - rx, grp = (s, sp) => s.replace('data-slot=', `data-vgroup="t28" ${sp ? 'data-vspace="30,176" ' : ''}data-slot=`);
    h += grp(X.line('oh.label', ev.label.toUpperCase(), rx, 34, rw, 9.5, 8, '', `font:600 9.5pt/1 ${MONT};letter-spacing:3pt;color:${P.accInk}`), 1);
    h += grp(X.line('title', 'Please sign in', rx, 48, rw, 42, 26, '', `font:700 42pt/46pt ${OSW};letter-spacing:1.2pt;text-transform:uppercase;color:${P.ink}`));
    h += grp(X.line('address', L.address.toUpperCase(), rx, 100, rw, 21, 13, '', `font:600 21pt/24pt ${OSW};letter-spacing:1pt;color:${P.ink}`));
    h += grp(X.line('place', X.cityZip(L), rx, 128, rw, 9, 8, '', `font:500 9pt/1 ${MONT};letter-spacing:2.4pt;color:${P.muted}`));
    if(dated) h += grp(X.line('oh.date', dateText(ev), rx, 146, rw, 10, 8, '', `font:600 10pt/12pt ${MONT};letter-spacing:.3pt;color:${P.ink}`));
    h += box(m, 186, pw, 2.5, `background:${P.fill}`);
    // the rows sit on the lighter cream (round 2: lighter rows), every other one a shade of forest. Eight rows, and the agent's
    // card moved down toward the foot of the sheet (owner 11/16/2026, p29-p30)
    const ft = E.home ? 534 : 540, top = 190, bot = ft - 11;
    if(!bw) h += `<div class="rowband" style="left:${m}pt;top:${top + 38}pt;width:${pw}pt;height:${bot - top - 38}pt;background:#f8f4ec"></div>`;
    h += tbl(E, P, {x0: m, W: pw, top, bot, hd: 38, rows: 8, numW: 44, labY: 4, labH: 30, label: `${OSL};color:${P.accInk}`, band: i => i % 2 === 1, headRule: 1, headColor: P.fill,
      num: numBox(() => `font:600 15pt/26pt ${OSW};background:${P.fill};color:${P.onFill}`, 30, 26), ynD: 21, yn: `border:1pt solid ${P.fill};color:${P.fill};font:600 10pt/1 ${OSW};border-radius:0`});
    h += box(m, bot + 1, pw, 0, `border-top:1.4pt solid ${P.fill}`);
    h += foot1(D, [m, ft, pw, 58], {dark: false});
    return wrap(P, h, 792, 612);
  };

  L$['fxs-28-feedback'] = (D, E) => {
    D = forBw(D, E);
    const P = pal('28', E), L = D.listing, ev = X.ev(D), bw = E.bw, m = 70, e = edge(E), FB = qs(D);
    const on = bw ? '#fff' : P.hi, soft = bw ? '#e2e2e2' : P.hiSoft;
    // the agent's card sits lower (owner 11/16/2026, p31-p32); the questions, their lines, the photo and the rating tiles all
    // grow into the room it gives back (kl: the writing columns, kr: the photo and tiles), so nothing is left blank
    const ft = E.home ? 322 : 330, kl = (ft - 14 - 116) / 182, kr = (ft - 12 - 22) / 278, yl = d => Math.round(d * kl * 2) / 2, yr = y => Math.round((22 + (y - 22) * kr) * 2) / 2;
    let h = spine(D, E, P, 54, 396, 20);
    // the day as a stat tile, the title, then two columns to write in; the photo and the rating tiles stack on the right
    h += box(m, 22, 58, 58, `background:${P.dark}`);
    h += txt('oh.day', ev.day, m, 26, 58, `text-align:center;font:600 27pt/30pt ${OSW};color:${on}`);
    h += txt('oh.mon', ev.mon3, m, 62, 58, `text-align:center;font:600 8pt/1 ${MONT};letter-spacing:2.4pt;text-transform:uppercase;color:${soft}`);
    const tx = m + 70, tw = 398 - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 22, tw, 8.5, 8, '', `font:600 8.5pt/1 ${MONT};letter-spacing:3pt;color:${P.accInk}`);
    h += X.line('title', 'Your feedback', tx, 31, tw, 34, 22, '', `font:700 34pt/38pt ${OSW};letter-spacing:1.2pt;text-transform:uppercase;color:${P.ink}`);
    h += X.line('oh.date', `${ev.weekday}   ·   ${ev.time}`, tx, 72, tw, 8.5, 8, '', `font:600 8.5pt/1 ${MONT};letter-spacing:.4pt;color:${P.muted}`);
    h += X.line('address', `${L.address.toUpperCase()}  ·  ${X.cityZip(L)}`, m, 88, 328, 11.5, 8, '', `font:600 11.5pt/13pt ${OSW};letter-spacing:1pt;color:${P.ink}`);
    h += box(m, 106, 328, 2.5, `background:${P.fill}`);
    const qsz = Math.round(10.5 * Math.min(kl, 1.06) * 2) / 2;
    const F = fbk({lab: `font:600 8.5pt/1 ${OSW};letter-spacing:1.6pt;text-transform:uppercase;color:${P.accInk}`, q: `font-family:${OSW};font-weight:500;letter-spacing:0;color:${P.ink}`, qsz, first: yl(30), sp: yl(21)});
    const cw = 157, bx = m + cw + 14, y1 = 116, [p1, p2, p3] = FB.prompts;
    h += F.ask(p1[0], p1[1], m, y1, cw, 3) + F.ask(p2[0], p2[1], m, y1 + yl(80), cw, 3) + F.field('q.name', FB.name, m, y1 + yl(161), cw);
    h += F.ask(p3[0], p3[1], bx, y1, cw, 3) + F.ask('seller', FB.seller, bx, y1 + yl(80), cw, 3) + F.field('q.contact', FB.contact, bx, y1 + yl(161), cw);
    const px = 414, pwd = 158;
    h += ph(D, E, px, 22, pwd, yr(112) - 22);   // inset, as the set always insets its photos
    // rating tiles: a forest cap over a light body, so a pen shows on them
    const tile = (y, hgt) => box(px, y, pwd, hgt, bw ? 'border:1pt solid #111' : `background:${P.card}`) + box(px, y, pwd, 4, `background:${P.fill}`);
    const t1 = yr(120), t2 = yr(180), tb = yr(300);
    h += tile(t1, t2 - 6 - t1) + F.lab('q.price', FB.price, px + 9, t1 + 11, pwd - 18);
    h += F.pills(FB, px + 9, t1 + 24 + (t2 - 6 - t1 - 54) / 2, pwd - 18, 21, `border:1pt solid ${P.fill};color:${P.accInk};font:500 8pt/1 ${OSW};letter-spacing:0;border-radius:0`, 3);
    const dot = sq(`border:1pt solid ${P.fill};color:${P.accInk};font:600 11pt/1 ${OSW}`), g = (tb - t2 - 120) / 3;
    h += tile(t2, tb - t2) + F.lab('q.cond', FB.cond, px + 9, t2 + 12 + g, pwd - 18) + X.dots(px + 9, t2 + 25 + g, pwd - 18, 21, dot);
    h += F.lab('q.shows', FB.shows, px + 9, t2 + 58 + 2 * g, pwd - 18) + X.dots(px + 9, t2 + 71 + 2 * g, pwd - 18, 21, dot);
    h += txt('q.scale', FB.scale, px + 9, t2 + 102 + 3 * g, pwd - 18, `font:400 8pt/1 ${MONT};color:${P.muted}`);
    // a headshot takes room from the email line: the card then runs a little further right (to the photo's edge and past it)
    h += foot1(D, [m, ft, (D.agent || {}).headshot ? 520 : 502, 54], {dark: false});
    return wrap(P, h, 612, 396);
  };

  /* ============================== FXS-36: black, red Oswald, red tiles, heavy red rules ============================== */
  L$['fxs-36-signin'] = (D, E) => {
    D = forBw(D, E);
    const P = pal('36', E), L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 48, pw = 696, e = edge(E), lw = 326;
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', `background:${P.dark}`);
    h += X.line('address', L.address.toUpperCase(), m, 20, lw, 46, 30, '', `font:700 46pt/52pt ${OSW};color:${P.acc}`);
    h += X.line('place', X.place(L).toUpperCase(), m, 78, lw, 9.5, 8, '', `font:600 9.5pt/1 ${MONT};letter-spacing:2.6pt;color:${P.hiSoft}`);
    h += box(m, 96, lw, 2.5, `background:${P.acc}`);
    h += X.line('oh.label', ev.label.toUpperCase(), m, dated ? 107 : 110, lw, 9, 8, '', `font:600 9pt/1 ${MONT};letter-spacing:3pt;color:${P.hi}`);
    h += X.line('title', 'Please sign in', m, dated ? 119 : 128, lw, 44, 26, '', `font:500 44pt/50pt ${OSW};letter-spacing:2.6pt;text-transform:uppercase;color:${P.hi}`);
    if(dated) h += X.line('oh.date', dateText(ev), m, 176, lw, 12, 8, '', `font:500 12pt/15pt ${OSW};letter-spacing:1.4pt;text-transform:uppercase;color:${P.hi}`);
    // the photo runs off the top right corner with its column of red tiles beside it (the flyer's top, mirrored)
    const px = 478, tx = 392, tw = 78;
    h += ph(D, E, px, e, 792 - e - px, 194 - e);
    f3(L, true).forEach(([v, l], i) => { const y = 22 + i * 59;
      h += box(tx, y, tw, 54, `background:${bw ? '#111' : P.fill}`);
      h += txt('tile' + i, v, tx, y + 6, tw, `text-align:center;font:600 25pt/28pt ${OSW};color:#fff`);
      h += txt('tile' + i + 'l', l, tx, y + 38, tw, `text-align:center;font:600 8pt/1 ${MONT};letter-spacing:2pt;text-transform:uppercase;color:#fff`); });
    // the writing field in the set's red-outline box with a red top rule: white for a pen, a very light grey alternate row, red number tiles
    const top = 208, bot = 504;
    h += box(m, top, pw, bot - top, `background:${P.card};border:1.2pt solid ${P.fill}`) + box(m, top, pw, 3.5, `background:${P.fill}`);
    h += tbl(E, P, {x0: m, W: pw, top: top + 3.5, bot, hd: 34, numW: 48, headRule: 1.2, headColor: P.fill, labY: 5, label: `font:600 8.5pt/10pt ${MONT};letter-spacing:2pt;text-transform:uppercase;color:${P.ink}`, band: i => i % 2 === 1,
      num: numBox(() => `font:600 15pt/26pt ${OSW};background:${P.fill};color:#fff`, 30, 26), ynD: 21, yn: `border:1pt solid ${P.ink};color:${P.ink};font:600 10pt/1 ${OSW};border-radius:0`});
    h += box(m, 511, pw, 2.5, `background:${P.acc}`);
    h += foot1(D, [m, 520, pw, 56], {dark: !bw});
    return wrap(P, h, 792, 612);
  };

  L$['fxs-36-feedback'] = (D, E) => {
    D = forBw(D, E);
    const P = pal('36', E), L = D.listing, ev = X.ev(D), bw = E.bw, m = 40, pw = 532, e = edge(E), FB = qs(D), px = 402, lw = px - m - 16;
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', `background:${P.dark}`);
    h += ph(D, E, px, e, 612 - e - px, 92 - e);
    h += X.line('title', 'Your feedback', m, 14, lw, 42, 26, '', `font:700 42pt/46pt ${OSW};text-transform:uppercase;color:${P.acc}`);
    h += X.line('address', L.address.toUpperCase(), m, 60, lw, 17, 11, '', `font:600 17pt/19pt ${OSW};letter-spacing:1pt;color:${P.hi}`);
    h += X.line('oh.label', ev.label.toUpperCase(), m, 83, 122, 8, 8, '', `font:600 8pt/1 ${MONT};letter-spacing:1.6pt;color:${P.hi}`);
    h += X.line('oh.date', dateText(ev), m + 130, 80.5, lw - 130, 9.5, 8, '', `text-align:right;font:500 9.5pt/12pt ${OSW};letter-spacing:.8pt;text-transform:uppercase;color:${P.hiSoft}`);
    h += box(m, 96, pw, 2.5, `background:${P.acc}`);
    // the red-outline box, white inside for a pen: ratings under letterspaced labels with a thin red underline, three columns of prompts, then the seller question and who you are
    const top = 100, bot = 300, ix = m + 14, iw = pw - 28;
    h += box(m, top, pw, bot - top, `background:${P.card};border:1.2pt solid ${P.fill}`);
    const F = fbk({lab: `font:600 8pt/1 ${MONT};letter-spacing:1.4pt;text-transform:uppercase;color:${P.ink}`, q: `font-family:${OSW};font-weight:500;letter-spacing:.3pt;color:${P.ink}`, qsz: 11, first: 29, sp: 20.2});
    const tab = (slot, s, x, w) => txt(slot, s, x, top + 10, w, `font:600 8pt/1 ${MONT};letter-spacing:1.8pt;text-transform:uppercase;color:${P.ink}`) + box(x, top + 22, w, 1, `background:${P.fill}`);
    const g1 = 190, g2 = (iw - g1 - 32) / 2, x2 = ix + g1 + 16, x3 = x2 + g2 + 16;
    h += tab('q.price', FB.price, ix, g1) + F.pills(FB, ix, top + 28, g1, 20, `border:1.1pt solid ${P.fill};color:${P.ink};font:600 9pt/1 ${OSW};letter-spacing:.6pt;border-radius:0`, 5);
    const dot = sq(`border:1.1pt solid ${P.fill};color:${P.ink};font:600 11pt/1 ${OSW}`);
    h += tab('q.cond', FB.cond, x2, g2) + X.dots(x2, top + 28, g2, 20, dot);
    h += tab('q.shows', FB.shows, x3, g2) + X.dots(x3, top + 28, g2, 20, dot);
    h += txt('q.scale', FB.scale, x2, top + 52, iw - g1 - 16, `text-align:right;font:400 8pt/1 ${MONT};color:${P.muted}`);
    const cw = (iw - 32) / 3, y1 = top + 64, [p1, p2, p3] = FB.prompts;
    [p1, p2, p3].forEach((p, i) => { h += F.ask(p[0], p[1], ix + i * (cw + 16), y1, cw, 3); });
    h += F.ask('seller', FB.seller, ix, y1 + 78, 2 * cw + 16, 2);
    const fx = ix + 2 * (cw + 16);
    h += F.lab('q.name', FB.name, fx, y1 + 78, cw) + X.wline(fx, y1 + 99, cw) + F.lab('q.contact', FB.contact, fx, y1 + 106, cw) + X.wline(fx, y1 + 127.2, cw);
    h += box(m, 304, pw, 2.5, `background:${P.acc}`);
    h += foot1(D, [m, 312, pw, 54], {dark: !bw});
    return wrap(P, h, 612, 396);
  };

  /* ============================== FXS-40: white, pale blue panel, slate circle badge, Oswald ============================== */
  const badge = (D, E, P, cx, cy, d, sizes) => {
    const L = D.listing, parts = String(L.address).trim().split(/\s+/), num = parts[0], rest = parts.slice(1), suf = rest.length > 1 ? rest.pop() : '', name = rest.join(' ');
    const [a, b, c] = sizes, x = cx - d / 2, w = d;
    const tot = a * 1.05 + b * 1.05 + (suf ? c * 1.5 + 3 : 0), y0 = cy - tot / 2;
    let h = disc(x, cy - d / 2, d, `background:${P.dark}`);
    h += X.line('addr.num', num, x + 16, y0, w - 32, a, 14, '', `text-align:center;font:700 ${a}pt/${a * 1.05}pt ${OSW};color:#fff`);
    h += X.line('address', name.toUpperCase(), x + 16, y0 + a * 1.05, w - 32, b, 12, '', `text-align:center;font:700 ${b}pt/${b * 1.05}pt ${OSW};color:#fff`);
    if(suf) h += X.line('addr.suffix', suf.toUpperCase(), x + 16, y0 + a * 1.05 + b * 1.05 + 3, w - 32, c, 8, '', `text-align:center;font:600 ${c}pt/${c * 1.2}pt ${MONT};letter-spacing:3pt;color:#fff`);
    return h;
  };
  L$['fxs-40-signin'] = (D, E) => {
    D = forBw(D, E);
    const P = pal('40', E), L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 48, pw = 696, e = edge(E);
    // the photo, the pale panel, and the slate badge sitting over the edge between them (the set's flyers)
    let h = ph(D, E, e, e, 396 - e, 192 - e);
    h += bw ? box(396, 192, 792 - e - 396, 0, 'border-top:1.2pt solid #111') : E.fl(396, 0, 396, 192, 'rt', `background:${P.pale}`);
    h += badge(D, E, P, 452, 98, 138, [31, 28, 9]);
    const rx = 540, rw = 220;
    h += X.line('oh.label', ev.label.toUpperCase(), rx, 36, rw, 8.5, 8, '', `font:600 8.5pt/1 ${MONT};letter-spacing:3pt;color:${P.ink}`);
    if(dated) h += X.line('oh.date', dateText(ev), rx, 50, rw, 9, 8, '', `font:600 9pt/1 ${MONT};color:${P.ink}`);
    const ty = dated ? 64 : 54;
    h += X.line('title', 'Please', rx, ty, rw, 36, 22, '', `font:600 36pt/38pt ${OSW};letter-spacing:2pt;text-transform:uppercase;color:${P.ink}`);
    h += X.line('title2', 'sign in', rx, ty + 36, rw, 36, 22, '', `font:600 36pt/38pt ${OSW};letter-spacing:2pt;text-transform:uppercase;color:${P.ink}`);
    h += box(rx, 142, rw, 0, `border-top:.6pt solid ${P.line}`);
    const fw = rw / 3;
    ['bed', 'bath', 'area'].forEach((ic, i) => { const [v, l] = f3(L, true)[i], x = rx + i * fw;
      h += icon(ic, x + fw / 2 - 7, 148, 14, P.ink);
      h += `<div class="abs nowrap" data-slot="fact${i}" style="left:${x}pt;top:164pt;width:${fw - 4}pt;text-align:center;color:${P.ink}"><span style="font:600 14pt/16pt ${OSW}">${v}</span> <span style="font:600 8pt/1 ${MONT};letter-spacing:1pt;text-transform:uppercase">${l}</span></div>`; });
    // the table: a slate header band, filled slate number circles, rows tinted every other one
    const top = 208, bot = 504, hd = 38;
    h += tbl(E, P, {x0: m, W: pw, top, bot, hd, numW: 48, headBg: P.dark, labY: 4, labH: 30, label: `${OSL};color:#fff`, band: i => i % 2 === 1,
      num: numBox(() => `font:600 14pt/27pt ${OSW};border-radius:50%;background:${P.dark};color:#fff`, 27, 27), yn: `border:1pt solid ${P.ink};color:${P.ink};font:600 9.5pt/1 ${OSW}`});
    h += box(m, top, pw, bot - top, `border:.9pt solid ${P.ink}`);
    h += bw ? box(m, 513, pw, 0, 'border-top:2pt solid #111') : E.fl(0, 512, 792, 100, 'lrb', `background:${P.pale}`);
    h += foot1(D, [m, 522, pw, 56], {dark: false});
    return wrap(P, h, 792, 612);
  };

  L$['fxs-40-feedback'] = (D, E) => {
    D = forBw(D, E);
    const P = pal('40', E), L = D.listing, ev = X.ev(D), bw = E.bw, m = 40, pw = 532, e = edge(E), FB = qs(D), pe = 186;
    // a pale panel down the left: the photo, then the ratings; the slate badge sits over the photo's edge
    let h = bw ? box(pe, 118, 0, 184, 'border-left:1.2pt solid #111') + box(m, 303, pw, 0, 'border-top:2pt solid #111') : E.fl(0, 0, pe, 396, 'ltb', `background:${P.pale}`) + E.fl(0, 302, 612, 94, 'lrb', `background:${P.pale}`);
    h += ph(D, E, e, e, pe - e, 118 - e);
    // the seal carries the address, as on every piece of the set; the title sits beside it, the icon fact row under it
    h += badge(D, E, P, 228, 70, 92, [20, 18, 8]);
    const rx = 290, rw = 572 - rx;
    h += X.line('oh.label', ev.label.toUpperCase(), rx, 24, rw, 8, 8, '', `font:600 8pt/1 ${MONT};letter-spacing:3pt;color:${P.ink}`);
    h += X.line('title', 'Your feedback', rx, 34, rw, 27, 16, '', `font:600 27pt/30pt ${OSW};letter-spacing:1.6pt;text-transform:uppercase;color:${P.ink}`);
    h += X.line('oh.date', dateText(ev), rx, 68, rw, 9, 8, '', `font:600 9pt/11pt ${MONT};color:${P.ink}`);
    h += box(rx, 84, rw, 0, `border-top:.6pt solid ${P.line}`);
    ['bed', 'bath', 'area'].forEach((ic, i) => { const [v, l] = f3(L, true)[i], x = rx + i * rw / 3;
      h += icon(ic, x, 90, 13, P.ink);
      h += `<div class="abs nowrap" data-slot="fact${i}" style="left:${x + 19}pt;top:89pt;width:${rw / 3 - 22}pt;color:${P.ink}"><span style="font:600 13pt/15pt ${OSW}">${v}</span> <span style="font:600 8pt/1 ${MONT};letter-spacing:1pt;text-transform:uppercase">${l}</span></div>`; });
    const F = fbk({lab: `font:600 8.5pt/1 ${OSW};letter-spacing:1.6pt;text-transform:uppercase;color:${P.ink}`, q: `font-family:${OSW};font-weight:500;letter-spacing:.2pt;color:${P.ink}`, qsz: 10.5, first: 30, sp: 20.5});
    const ix = 32, iw = pe - 14 - ix;
    h += F.lab('q.price', FB.price, ix, 134, iw);
    // the price choices as one rule-separated row
    h += box(ix, 147, iw, 21, `border:1pt solid ${P.ink};background:#fff`) + F.pills(FB, ix, 147, iw, 21, `color:${P.ink};font:600 8pt/1 ${OSW};letter-spacing:0`, 0);
    [1, 2.34].forEach(k => { h += box(ix + iw * k / 3.34, 147, 0, 21, `border-left:1pt solid ${P.ink}`); });
    const dot = round(`background:#fff;border:1pt solid ${P.ink};color:${P.ink};font:600 11pt/1 ${OSW}`);
    h += box(ix, 180, iw, 0, `border-top:.6pt solid ${P.line}`);
    h += F.lab('q.cond', FB.cond, ix, 190, iw) + X.dots(ix, 203, iw, 21, dot);
    h += F.lab('q.shows', FB.shows, ix, 236, iw) + X.dots(ix, 249, iw, 21, dot);
    h += txt('q.scale', FB.scale, ix, 280, iw, `font:400 8pt/1 ${MONT};color:${P.muted}`);
    const ax = 206, cw = 175, bx = ax + cw + 16, y1 = 120, [p1, p2, p3] = FB.prompts;
    h += box(rx, 110, rw, 0, `border-top:.6pt solid ${P.line}`);
    h += F.ask(p1[0], p1[1], ax, y1, cw, 3) + F.ask(p2[0], p2[1], ax, y1 + 79, cw, 3) + F.field('q.name', FB.name, ax, y1 + 157, cw);
    h += F.ask(p3[0], p3[1], bx, y1, cw, 3) + F.ask('seller', FB.seller, bx, y1 + 79, cw, 3) + F.field('q.contact', FB.contact, bx, y1 + 157, cw);
    h += foot1(D, [m, 312, pw, 54], {dark: false});
    return wrap(P, h, 612, 396);
  };
})();
