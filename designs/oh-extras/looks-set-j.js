/* Open House extras for design sets, batch j (owner 11/15/2026: every design set gets its own sign-in sheet and broker feedback
   card, in that set's own look): in-sections, answer-book, inside-out, long-view, map-room, midnight.
   The set's palette is fixed (the set's own css), so the cards use it as the set's pieces do; the body class is
   set-<first word of the look> (in, answer, inside, long, map, midnight), see extras-set-j.css.

   Round 2, the design pass (owner 11/15/2026, brief docs/briefs/set-extras-11-15.md): each set leads with its house, a real
   field of its own color and the one thing its brochure is known for; every card has its own skeleton.
     in-sections  pale gray page, a red band, the house bleeding off the left, white row bands that each open with a red
                  section block; the card is three section columns with red section tabs.
     answer-book  cream paper, the house bleeding off the corner beside the dark teal block with gold capitals, a white page
                  whose gold index tabs carry the row numbers; the card's tabs stand on a teal band.
     inside-out   a navy field, the house and address in a side column, a white board that holds the writing, amber marks.
     long-view    a deep teal field, a long photo off the corner, a cyan band and writing lines that run edge to edge;
                  the card is an L of teal around the pale writing sheet.
     map-room     a navy block with the map grid, the house in a neatline frame with crosshairs, a table framed like a map
                  sheet (alternating border cells, a registration mark in the corner).
     midnight     a midnight field, the house in a gold keyline, rows of lit ivory panes with gold numerals, Newsreader.
   Shared in every set: column dividers, round rating marks under "Circle one", answer lines 0.28 in apart or more, the
   black logo on black-and-white cards (brand.logos.black), the standard footer at its own size. */
(function(){
  const X = Extras, L$ = X.looks, K = X.lib, esc = X.esc;
  const {cols, labels, qs, box, txt, ph, foot1, foot2} = K;
  const FOOT = 308, FOOT_H = 58;
  const wl = (x, y, w, st) => X.wline(x, y, w, st);
  const eg = E => E.home ? 18 : -9;   // the sheet's visible edge: the white margin (home file) or the bleed (printer file)
  const fl = (l, t, r, b, style) => `<div class="flood" style="left:${l}pt;top:${t}pt;width:${r - l}pt;height:${b - t}pt;${style}"></div>`;
  const band = (x, y, w, h, style) => `<div class="rowband" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${style}"></div>`;
  const vr = (x, y, h, c) => box(x, y, 0, h, `border-left:.5pt solid ${c || 'var(--line)'}`);
  const hr = (x, y, w, c) => box(x, y, w, 0, `border-top:.5pt solid ${c || 'var(--line)'}`);
  const num = (x, y, w, hgt, n, style) => `<div class="num" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt;${style};line-height:${hgt}pt">${n}</div>`;
  // black-and-white cards carry the black logo, not a colored one printed grey (round 2, shared finding 7)
  const bwD = (D, E) => { const b = D.brand || {}, k = (b.logos || {}).black; return E.bw && k ? Object.assign({}, D, {brand: Object.assign({}, b, {logo: k})}) : D; };

  // ---- the feedback card's parts (fields and wording are fixed, product.md; where they sit is each set's own) ----
  const mkS = S => Object.assign({q: (slot, t, x, y, w) => X.line(slot, t, x, y, w, S.qs, 8, 'disp', S.qst)}, S);
  // the three price choices: in a row, or stacked (o.col); o.plain sets them in sentence case for a narrow column
  const pills = (FB, x, y, w, S, o) => { o = o || {};
    return `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;display:flex;${o.col ? 'flex-direction:column;' : ''}gap:${o.gap || 5}pt">` +
      FB.choices.map((t, i) => `<span class="pill" style="${o.col ? 'flex:none' : o.plain ? 'flex:1 1 auto' : 'flex:1'};height:${o.h || 22}pt;${S.pill(i)}${o.plain ? ';text-transform:none;letter-spacing:.1pt' : ''}">${esc(t)}</span>`).join('') + '</div>'; };
  // a narrow column (about 2.4 in): every label over its marks, name and contact stacked; 266 pt tall
  const narrow = (FB, x, y, w, S) => {
    let h = S.lab('q.price', FB.price, x, y, w) + pills(FB, x, y + 12, w, S, {plain: true});
    h += S.lab('q.cond', FB.cond, x, y + 42, w) + X.dots(x, y + 54, w, 23, S.dot);
    h += S.lab('q.shows', FB.shows, x, y + 85, w) + X.dots(x, y + 97, w, 23, S.dot);
    h += txt('q.scale', FB.scale, x, y + 123, w, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += S.q('q.seller', FB.seller, x, y + 139, w) + wl(x, y + 174, w, S.wl) + wl(x, y + 195, w, S.wl);
    h += S.lab('q.name', FB.name, x, y + 203) + wl(x, y + 231, w, S.wl) + S.lab('q.contact', FB.contact, x, y + 238) + wl(x, y + 266, w, S.wl);
    return h; };
  // a wide column (about 3.6 in), from the two 1-5 marks down: condition and how it shows side by side, the seller
  // question, name and contact side by side; 136 pt tall
  const lower = (FB, x, y, w, S) => { const g = (w - 16) / 2, x2 = x + g + 16, sx = x + (S.qIn || 0);
    let h = S.lab('q.cond', FB.cond, x, y, g) + X.dots(x, y + 12, g, 20, S.dot) + S.lab('q.shows', FB.shows, x2, y, g) + X.dots(x2, y + 12, g, 20, S.dot);
    h += txt('q.scale', FB.scale, x, y + 35, w, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += (S.mark ? S.mark(3, x, y + 48) : '') + S.q('q.seller', FB.seller, sx, y + 48, w - (S.qIn || 0)) + wl(x, y + 80, w, S.wl) + wl(x, y + 101, w, S.wl);
    h += S.lab('q.name', FB.name, x, y + 110) + wl(x, y + 136, g, S.wl) + S.lab('q.contact', FB.contact, x2, y + 110) + wl(x2, y + 136, g, S.wl);
    return h; };
  // the three guided prompts, each a question over three write-in lines (lo: where the lines sit under the question)
  const prompts = (FB, x, w, y0, S, pitch, lo) => FB.prompts.map(([k, t], i) => { const y = y0 + i * pitch, qx = x + (S.qIn || 0), [a, b, c] = lo || [30, 51, 72];
    return (S.mark ? S.mark(i, x, y) : '') + S.q('q.' + k, t, qx, y, w - (S.qIn || 0)) + wl(x, y + a, w, S.wl) + wl(x, y + b, w, S.wl) + wl(x, y + c, w, S.wl); }).join('');

  /* ================================ IN-SECTIONS ================================ */
  // the brochure's pale gray page cut into sections under red heads: a red band, the house off the left edge, "sign in" in
  // red (the postcard's Just / Listed), white row bands that each open with a red section block
  L$['in-sections-signin'] = (D0, E) => {
    const D = bwD(D0, E), L = D.listing, ev = X.ev(D), m = 36, W = 720, dated = ev.kind !== 'public', bw = E.bw, e = eg(E), R = 792 - e;
    const red = bw ? '#111' : 'var(--accent)', tint = bw ? 'rgba(0,0,0,.06)' : 'var(--tint)';
    let h = bw ? '' : fl(e, e, R, 612 - e, 'background:var(--paper)');
    h += fl(e, e, R, 46, `background:${red}`);
    h += txt('oh.label', ev.label, m, 23, 400, 'font:700 10.5pt/13pt var(--font-body);letter-spacing:2.8pt;text-transform:uppercase;color:#fff');
    if(dated) h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, 440, 23, 316, 10.5, 8, '', 'text-align:right;font-weight:700;letter-spacing:.3pt;color:#fff');
    h += ph(D, E, e, 46, 300 - e, 150);
    h += `<div class="abs" data-slot="title" style="left:322pt;top:54pt;width:434pt;white-space:nowrap;font:500 54pt/62pt var(--font-display);letter-spacing:-1.4pt;color:var(--ink)">Please <span style="color:${red}">sign in</span></div>`;
    // the address section: a tinted panel under a red head, as on the set's Open House flyer
    h += box(324, 126, 432, 70, `background:${tint}`);
    h += txt('welcome', 'Welcome to', 338, 136, 180, `font:700 8.5pt/10pt var(--font-body);letter-spacing:1.8pt;text-transform:uppercase;color:${red}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), 530, 136, 212, 8.5, 8, '', `text-align:right;letter-spacing:1.8pt;color:${red};font-weight:700`);
    h += X.line('address', L.address, 337, 151, 405, 29, 16, 'disp', 'font-weight:500;letter-spacing:-.6pt');
    const cs = cols(m, 38, [212, 226, 88, 156]), y0 = 230, pitch = 40.5, bh = 37;
    h += labels(cs, 202, 24, `color:${red};font-size:8.5pt`);
    for(let i = 0; i < 7; i++){
      const y = y0 + i * pitch;
      h += band(m, y, W, bh, `background:#fff;${bw ? 'border:.6pt solid #111;' : ''}`);
      h += box(m, y, 38, bh, `background:${tint}`) + num(m, y, 38, bh, E.first + i, `font:600 17pt var(--font-display);color:${red}`);
      cs.forEach((c, k) => { if(k) h += vr(c.x, y + 5, bh - 10);
        if(c.yn) h += X.yn(c.x + c.w / 2 - 21, y + (bh - 18) / 2, 18, `border:.9pt solid ${red};color:${red};background:#fff`); });
    }
    return h + foot1(D, [m, 520, W, 62]);
  };
  // three section columns: the address section (tinted, the house on top), the ratings section, and three prompt sections
  // (round 3: red stays in labels, hairlines and one band, as in the set)
  L$['in-sections-feedback'] = (D0, E) => {
    const D = bwD(D0, E), FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, e = eg(E), R = 612 - e;
    const red = bw ? '#111' : 'var(--accent)', tint = bw ? 'rgba(0,0,0,.06)' : 'var(--tint)', pan = `background:#fff;${bw ? 'border:.6pt solid #111;' : ''}`;
    const S = mkS({qs: 11, qst: 'font-weight:500;color:var(--ink);letter-spacing:0',
      lab: (slot, t, x, y, w) => txt(slot, t, x, y, w || 0, `font:700 8pt/10pt var(--font-body);letter-spacing:1.1pt;text-transform:uppercase;color:${red}`),
      pill: () => `border:.9pt solid ${red};background:#fff;color:${red};font-size:8.5pt;padding:0 5pt`,
      dot: () => `border:.9pt solid ${red};background:#fff;color:${red};font-size:10pt;font-family:var(--font-display);font-weight:700`});
    let h = bw ? '' : fl(e, e, R, 396 - e, 'background:var(--paper)');
    h += box(e, e, 164 - e, 302 - e, `background:${tint}`) + box(e, 296, 164 - e, 6, `background:${red}`);
    h += ph(D, E, e, e, 164 - e, 128 - e);
    h += `<div class="abs" style="left:30pt;top:139pt;width:126pt">` +
      `<div data-slot="oh.label" style="font:700 8.5pt/11pt var(--font-body);letter-spacing:1.5pt;text-transform:uppercase;color:${red}">${esc(ev.label)}</div>` +
      `<div class="disp" data-slot="address" data-lines="2" data-fit2="21,24,12" style="margin-top:6pt;max-height:48pt;white-space:normal;font-weight:500;font-size:21pt;line-height:24pt;letter-spacing:-.4pt;color:var(--ink)"><span>${esc(L.address)}</span></div>` +
      `<div class="nowrap" data-slot="place" style="margin-top:5pt;font:700 8pt/10pt var(--font-body);letter-spacing:1.3pt;text-transform:uppercase;color:${red}">${esc(X.cityZip(L))}</div>` +
      `<div class="nowrap" data-slot="oh.date" style="margin-top:13pt;font:600 10.5pt/13pt var(--font-body);color:var(--ink)">${esc(ev.long)}</div>` +
      `<div class="nowrap" data-slot="oh.time" style="margin-top:1pt;font:400 10.5pt/13pt var(--font-body);color:var(--ink)">${esc(ev.time)}</div></div>`;
    h += box(174, 22, 192, 280, pan) + narrow(FB, 184, 31, 172, S);
    FB.prompts.forEach(([k, t], i) => { const y = 22 + i * 95;
      h += box(376, y, 208, 90, pan) + S.q('q.' + k, t, 386, y + 8, 188) + wl(386, y + 38, 188) + wl(386, y + 60, 188) + wl(386, y + 82, 188); });
    return h + foot1(D, [28, FOOT, 556, FOOT_H]);
  };

  /* ================================ ANSWER-BOOK ================================ */
  // cream paper; the house bleeding off the corner beside the dark teal block with gold capitals (the postcard front); a
  // white page for the writing whose gold index tabs carry the row numbers; one teal header band; gold question dashes
  const dash = (E, x, y, w) => box(x, y, w || 9, 2.4, E.bw ? 'background:#111' : 'background:var(--gold)');
  const tabR = 'border-radius:0 0 2pt 2pt;';   // the set's tabs: square, hanging from the top edge, 2 pt on the bottom corners only
  L$['answer-book-signin'] = (D0, E) => {
    const D = bwD(D0, E), L = D.listing, ev = X.ev(D), m = 36, W = 720, dated = ev.kind !== 'public', bw = E.bw, e = eg(E), R = 792 - e;
    const teal = bw ? '#111' : 'var(--dark)', gold = bw ? '#111' : 'var(--gold)', on = bw ? '#111' : 'var(--on)', soft = bw ? 'var(--muted)' : 'var(--on-soft)';
    let h = bw ? '' : fl(e, e, R, 612 - e, 'background:var(--paper)');
    h += ph(D, E, e, e, 400 - e, 196 - e);
    h += box(400, 54, R - 400, 142, bw ? 'border:1.2pt solid #111' : `background:${teal}`);
    h += box(424, e, 216, 42 - e, tabR + (bw ? 'border:1.2pt solid #111;border-top:0' : 'background:var(--gold)'));
    h += X.line('oh.label', ev.label, 432, 25, 200, 9.5, 8, '', 'font:700 9.5pt/11.4pt var(--font-display);letter-spacing:2.2pt;text-transform:uppercase;color:var(--ink);text-align:center');
    const tx = 424, tw = 326;
    h += X.line('title', 'Please sign in', tx - 1, 66, tw, 31, 22, 'disp', `font-weight:700;letter-spacing:2pt;text-transform:uppercase;color:${gold}`);
    if(dated){
      h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, tx, 110, tw, 12.5, 9, '', `font:700 12.5pt/15pt var(--font-display);color:${gold}`);
      h += X.line('address', L.address, tx - 1, 130, tw, 27, 16, 'disp', `font-weight:500;letter-spacing:-.4pt;color:${on}`);
    } else {
      h += txt('welcome', 'Welcome to', tx, 113, tw, `font:500 10.5pt/1 var(--font-body);color:${soft}`);
      h += X.line('address', L.address, tx - 1, 127, tw, 29, 16, 'disp', `font-weight:500;letter-spacing:-.5pt;color:${on}`);
    }
    h += X.line('place', X.cityZip(L).toUpperCase(), tx, 172, tw, 8.5, 8, '', `letter-spacing:1.9pt;color:${gold};font-weight:700`);
    // the page: one teal header band, column rules, and the row numbers on gold index tabs that stick out of its left edge
    const px = 76, PW = 680, cs = cols(px, 0, [222, 236, 88, 134]), yh = 208, y0 = 232, rh = 39.5, bot = y0 + 7 * rh;
    h += band(px, yh, PW, bot - yh, `background:${bw ? '#fff' : 'var(--page)'}`);
    h += box(px, yh, PW, 24, `background:${teal}`);
    h += labels(cs, yh, 22, `font-family:var(--font-display);font-weight:700;font-size:8.5pt;letter-spacing:1pt;color:${bw ? '#fff' : 'var(--on)'}`);
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      h += box(44, y + 5, 32, rh - 10, `border-radius:2pt 0 0 2pt;background:${gold}`) + num(44, y + 5, 32, rh - 10, E.first + i, `font:700 14pt var(--font-display);color:${bw ? '#fff' : 'var(--ink)'}`);
      if(i < 6) h += hr(px, y + rh, PW);
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - 21, y + (rh - 18) / 2, 18, 'border:.9pt solid var(--ink);color:var(--ink);font-family:var(--font-display)'); });
    }
    cs.forEach((c, k) => { if(k) h += vr(c.x, y0 + 2, 7 * rh - 2); });
    h += band(px, yh, PW, bot - yh, `border:.8pt solid ${teal}`);
    return h + foot1(D, [m, 520, W, 62]);
  };
  // the set's tab row hangs from the top edge (the postcard back); gold dashes open the questions; the house sits with
  // the price choices stacked beside it
  L$['answer-book-feedback'] = (D0, E) => {
    const D = bwD(D0, E), FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, e = eg(E), R = 612 - e;
    const teal = bw ? '#111' : 'var(--dark)', gold = bw ? '#111' : 'var(--gold)', pg = bw ? '#fff' : 'var(--page)';
    const S = mkS({qs: 11, qst: 'font-weight:500;color:var(--ink);letter-spacing:-.1pt', qIn: 16,
      lab: (slot, t, x, y, w) => txt(slot, t, x, y, w || 0, 'font:700 8pt/10pt var(--font-display);letter-spacing:.9pt;text-transform:uppercase;color:var(--accent)'),
      pill: () => `border:.9pt solid var(--ink);background:${pg};color:var(--ink);font-family:var(--font-display);font-size:8pt;letter-spacing:.5pt`,
      dot: () => `border:.9pt solid var(--ink);background:transparent;color:var(--ink);font-size:9.5pt;font-family:var(--font-display);font-weight:600`,
      mark: (i, x, y) => dash(E, x, y + 6, 9)});
    let h = bw ? '' : fl(e, e, R, 396 - e, 'background:var(--paper)');
    // the set's tab row hangs from the top edge: the gold tab, the address tab, and the date on the dark teal
    const tab = (fill, inner, grow, col) => `<div style="flex:${grow ? '1;min-width:0' : 'none'};padding:${46 - e - 24}pt 12pt 0;display:flex;${col ? 'flex-direction:column;justify-content:center;' : 'align-items:center;gap:9pt;'}${tabR}${bw ? 'border:1pt solid #111;border-top:0;background:#fff' : 'background:' + fill}">${inner}</div>`;
    h += `<div class="abs" style="left:28pt;top:${e}pt;width:556pt;height:${46 - e}pt;display:flex;gap:4pt">` +
      tab('var(--gold)', `<div class="nowrap" data-slot="oh.label" style="font:700 8.5pt/11pt var(--font-display);letter-spacing:1.5pt;text-transform:uppercase;color:var(--ink)">${esc(ev.label)}</div>`) +
      tab('var(--tab)', `<div class="nowrap" data-slot="address" data-shrink="8.5" style="flex:0 1 auto;min-width:0;font:700 10.5pt/13pt var(--font-display);letter-spacing:.7pt;text-transform:uppercase;color:var(--ink)">${esc(L.address)}</div>` +
        `<div class="nowrap" data-slot="place" style="flex:none;font:700 8pt/10pt var(--font-body);letter-spacing:.8pt;text-transform:uppercase;color:var(--accent)">${esc(X.cityZip(L))}</div>`, true) +
      tab('var(--dark)', `<div class="nowrap" data-slot="oh.date" style="font:700 8.5pt/10.5pt var(--font-body);color:${bw ? '#111' : 'var(--gold)'}">${esc(ev.long)}</div>` +
        `<div class="nowrap" data-slot="oh.time" style="font:600 8.5pt/10.5pt var(--font-body);color:${bw ? '#111' : 'var(--on)'}">${esc(ev.time)}</div>`, false, true) + '</div>';
    h += prompts(FB, 28, 268, 62, S, 80, [30, 51, 72]) + vr(308, 60, 238);
    const x = 320, w = 264;
    h += ph(D, E, x, 60, 150, 72);
    h += `<div class="abs" data-slot="q.price" data-lines="2" style="left:480pt;top:60pt;width:104pt;max-height:20pt;overflow:hidden;font:700 8pt/10pt var(--font-display);letter-spacing:.9pt;text-transform:uppercase;color:var(--accent)">${esc(FB.price)}</div>`;
    h += pills(FB, 480, 84, 104, S, {col: true, h: 14, gap: 3});
    h += lower(FB, x, 142, w, S);
    return h + foot1(D, [28, FOOT, 556, FOOT_H]);
  };

  /* ================================ INSIDE-OUT ================================ */
  // a navy field with the house and address in a side column and a white board that holds the writing (the plan board)
  // footer #2 with the logo at its own size: the logo over the office line, not squeezed beside it (round 2, shared finding 8)
  const foot2n = (D, bx, o) => foot2(D, bx, o)
    .replace('display:flex;align-items:center;justify-content:space-between;gap:12pt', 'display:flex;flex-direction:column;align-items:flex-start;gap:7pt')
    .replace('flex:0 1 auto;min-width:0;object-fit:contain', 'flex:none;object-fit:contain')
    .replace('white-space:nowrap;text-align:right', 'white-space:nowrap;text-align:left');
  L$['inside-out-signin'] = (D0, E) => {
    const D = bwD(D0, E), L = D.listing, ev = X.ev(D), m = 36, cw = 184, dated = ev.kind !== 'public', bw = E.bw, e = eg(E);
    const on = bw ? 'var(--ink)' : 'var(--on)', am = bw ? 'var(--ink)' : 'var(--gold)';
    let h = bw ? '' : fl(e, e, 792 - e, 612 - e, 'background:var(--field)');
    h += txt('oh.label', ev.label, m, 36, cw, `font:700 9.5pt/1 var(--font-body);letter-spacing:2.2pt;text-transform:uppercase;color:${am}`);
    h += X.line('title', 'Please', m - 1, 50, cw, 36, 24, 'disp', `font-weight:700;letter-spacing:-.8pt;color:${on}`);
    h += X.line('title2', 'sign in', m - 1, 90, cw, 36, 24, 'disp', `font-weight:700;letter-spacing:-.8pt;color:${am}`);
    h += box(m, 141, cw, 0, `border-top:.7pt solid ${am}`);
    // the house runs off the left edge of the sheet
    const phH = dated ? 90 : 126;
    h += ph(D, E, e, 154, m + cw - e, phH);
    let y = 154 + phH + 13;
    if(dated){
      h += X.line('oh.date', ev.long, m, y, cw, 13, 10, '', `font-family:var(--font-display);font-weight:700;color:${am}`);
      h += X.line('oh.time', ev.time, m, y + 17, cw, 11, 9, '', `font-family:var(--font-display);font-weight:600;color:${on}`);
      y += 39;
    }
    h += `<div class="abs" style="left:${m}pt;top:${y}pt;width:${cw}pt">` +
      `<div class="nowrap" data-slot="welcome" style="font:500 10pt/14pt var(--font-body);color:${bw ? 'var(--muted)' : 'var(--on-soft)'}">Welcome to</div>` +
      `<div class="disp" data-slot="address" data-lines="2" data-fit2="25,28,14" style="max-height:56pt;white-space:normal;font-weight:700;font-size:25pt;line-height:28pt;letter-spacing:-.5pt;color:${on}"><span>${esc(L.address)}</span></div>` +
      `<div class="nowrap" data-slot="place" style="margin-top:5pt;font:700 8.5pt/10pt var(--font-body);letter-spacing:1.5pt;color:${am};text-transform:uppercase">${esc(X.cityZip(L))}</div>` +
      `<div style="margin-top:8pt;height:0;border-top:.7pt solid ${am}"></div></div>`;
    h += foot2n(D, [m, 400, cw, 182], {dark: !bw});
    // the board
    const bx = 244, bw2 = 792 - 36 - bx, by = 30, bh = 554;
    h += box(bx, by, bw2, bh, bw ? 'border:1.2pt solid var(--ink)' : 'background:#fff');
    const x0 = bx + 16, W0 = bw2 - 32, cs = cols(x0, 34, [130, 144, 64, W0 - 34 - 130 - 144 - 64]), y0 = 80, rh = 71;
    h += labels(cs, 38, 32, 'font-family:var(--font-display);font-weight:700;font-size:9pt;letter-spacing:1pt;color:var(--ink)');
    h += box(x0, y0 - 3, W0, 2.2, 'background:var(--signal)');
    for(let i = 0; i < 7; i++){
      const yy = y0 + i * rh;
      h += box(x0 + 2, yy + rh / 2 - 12, 24, 24, bw ? 'background:#111' : 'background:var(--field)') + num(x0 + 2, yy + rh / 2 - 12, 24, 24, E.first + i, 'font:700 11.5pt var(--font-display);color:#fff');
      h += box(x0, yy + rh, W0, 0, i === 6 ? 'border-top:1.4pt solid var(--ink)' : 'border-top:.5pt solid var(--line)');
      cs.forEach(c => { h += vr(c.x, yy + 8, rh - 16);
        if(c.yn) h += X.yn(c.x + c.w / 2 - 21, yy + rh / 2 - 9, 18, 'border:.9pt solid var(--ink);color:var(--ink);font-family:var(--font-display)'); });
    }
    return h;
  };
  // the same plan: the side column on the navy field (label, the house off the edge, address, date), the white board with
  // its amber edge for the writing, navy number squares in the gutter between the two columns
  L$['inside-out-feedback'] = (D0, E) => {
    const D = bwD(D0, E), FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, e = eg(E);
    const on = bw ? 'var(--ink)' : 'var(--on)', am = bw ? 'var(--ink)' : 'var(--gold)';
    const S = mkS({qs: 10.5, qst: 'font-weight:600;letter-spacing:0;color:var(--ink)',
      lab: (slot, t, x, y, w) => txt(slot, t, x, y, w || 0, 'font:700 8pt/10pt var(--font-display);letter-spacing:1pt;text-transform:uppercase;color:var(--ink)'),
      pill: () => 'border:.9pt solid var(--ink);background:#fff;color:var(--ink);font-family:var(--font-display);font-size:8.5pt;padding:0 5pt;border-radius:0',
      dot: () => 'border:.9pt solid var(--ink);background:transparent;color:var(--ink);font-size:10pt;font-family:var(--font-display)',
      mark: (i, x, y) => box(x - 22, y - 2, 17, 17, bw ? 'background:#111' : 'background:var(--field)') + num(x - 22, y - 2, 17, 17, i + 1, 'font:700 9pt var(--font-display);color:#fff')});
    let h = bw ? '' : fl(e, e, 612 - e, 396 - e, 'background:var(--field)');
    h += `<div class="abs" data-slot="oh.label" style="left:28pt;top:23pt;width:136pt;font:700 8.5pt/11pt var(--font-body);letter-spacing:1.5pt;text-transform:uppercase;color:${am}">${esc(ev.label)}</div>`;
    h += ph(D, E, e, 40, 166 - e, 122);
    h += `<div class="abs" style="left:28pt;top:173pt;width:138pt">` +
      `<div class="disp" data-slot="address" data-lines="2" data-fit2="21,24,12" style="max-height:48pt;white-space:normal;font-weight:700;font-size:21pt;line-height:24pt;letter-spacing:-.4pt;color:${on}"><span>${esc(L.address)}</span></div>` +
      `<div class="nowrap" data-slot="place" style="margin-top:5pt;font:700 8pt/10pt var(--font-body);letter-spacing:1.3pt;text-transform:uppercase;color:${am}">${esc(X.cityZip(L))}</div>` +
      `<div style="margin-top:10pt;height:0;border-top:.7pt solid ${am}"></div>` +
      `<div class="nowrap" data-slot="oh.date" style="margin-top:9pt;font:700 11pt/14pt var(--font-display);color:${am}">${esc(ev.long)}</div>` +
      `<div class="nowrap" data-slot="oh.time" style="margin-top:1pt;font:600 10.5pt/13pt var(--font-display);color:${on}">${esc(ev.time)}</div></div>`;
    h += box(178, 20, 412, 282, bw ? 'border:1.1pt solid var(--ink)' : 'background:#fff') + box(178, 20, 5, 282, `background:${am}`);
    h += narrow(FB, 196, 29, 176, S);
    h += prompts(FB, 402, 176, 32, S, 90, [32, 54, 76]);
    return h + foot1(D, [28, FOOT, 556, FOOT_H], {dark: !bw});
  };

  /* ================================ LONG-VIEW ================================ */
  // a deep teal field, the long photo running off the corner, a cyan band for the column heads and a pale sheet whose
  // writing lines run from one edge of the paper to the other (the long view)
  L$['long-view-signin'] = (D0, E) => {
    const D = bwD(D0, E), L = D.listing, ev = X.ev(D), m = 36, W = 720, dated = ev.kind !== 'public', bw = E.bw, e = eg(E), R = 792 - e;
    const on = bw ? 'var(--ink)' : 'var(--on)', cy = bw ? 'var(--ink)' : 'var(--cyan)';
    const y0 = 230, rh = 40.25, bot = y0 + 7 * rh;
    let h = bw ? '' : fl(e, e, R, 612 - e, 'background:var(--field)') + fl(e, y0, R, bot, 'background:var(--paper)');
    h += ph(D, E, e, e, 470 - e, 204 - e);
    const tx = 494, tw = 262;
    h += txt('oh.label', ev.label, tx, 40, tw, `font:700 10pt/12pt var(--font-body);letter-spacing:2.4pt;text-transform:uppercase;color:${cy}`);
    h += X.line('title', 'Please sign in', tx - 1, 57, tw, 40, 28, 'disp', `font-weight:400;letter-spacing:-.8pt;color:${on}`);
    h += box(tx, 116, tw, 0, `border-top:.7pt solid ${cy}`);
    if(dated){
      h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, tx, 126, tw, 13, 9, '', `font:500 13pt/16pt var(--font-display);color:${cy}`);
      h += X.line('address', L.address, tx - 1, 146, tw, 24, 15, 'disp', `color:${on};letter-spacing:-.3pt`);
    } else {
      h += txt('welcome', 'Welcome to', tx, 127, tw, `font:500 11pt/1 var(--font-body);color:${bw ? 'var(--muted)' : 'var(--on-soft)'}`);
      h += X.line('address', L.address, tx - 1, 142, tw, 27, 16, 'disp', `color:${on};letter-spacing:-.4pt`);
    }
    h += X.line('place', X.cityZip(L).toUpperCase(), tx, 181, tw, 8.5, 8, '', `letter-spacing:1.9pt;color:${cy};font-weight:600`);
    h += fl(e, y0 - 1.2, R, y0, `background:${bw ? '#111' : 'var(--cyan)'}`);
    const cs = cols(m, 38, [214, 226, 88, 154]);
    h += labels(cs, 205, 22, `font-family:var(--font-body);font-weight:700;font-size:8.5pt;letter-spacing:1.1pt;color:${cy}`);
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      h += num(m, y, 38, rh, E.first + i, 'font:500 18pt var(--font-display);color:var(--ink)');
      if(i < 6) h += hr(e, y + rh, R - e);
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - 21, y + (rh - 18) / 2, 18, 'border:.9pt solid var(--ink);color:var(--ink);font-family:var(--font-display)'); });
    }
    cs.forEach(c => { h += vr(c.x, y0 + 2, bot - y0 - 2); });
    if(bw) h += box(e, bot, R - e, 0, 'border-top:1pt solid #111');
    return h + foot1(D, [m, 522, W, 60], {dark: !bw});
  };
  // the teal field throughout (the set's rule); the writing sits on a pale board, the house and address down the right side
  L$['long-view-feedback'] = (D0, E) => {
    const D = bwD(D0, E), FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, e = eg(E), R = 612 - e, px = 436;
    const on = bw ? 'var(--ink)' : 'var(--on)', cy = bw ? 'var(--ink)' : 'var(--cyan)';
    const S = mkS({qs: 10.5, qst: 'font-weight:500;color:var(--ink)',
      lab: (slot, t, x, y, w) => txt(slot, t, x, y, w || 0, 'font:700 8pt/10pt var(--font-body);letter-spacing:1pt;text-transform:uppercase;color:var(--accent)'),
      pill: () => 'border:.9pt solid var(--ink);background:#fff;color:var(--ink);font-family:var(--font-body);font-size:8.5pt;padding:0 5pt;border-radius:0',
      dot: () => `border:.9pt solid var(--ink);background:transparent;color:var(--ink);font-size:10pt;font-family:var(--font-display);font-weight:500`});
    let h = bw ? box(24, 22, 400, 280, 'border:1pt solid #111') : fl(e, e, R, 396 - e, 'background:var(--field)') + box(24, 22, 400, 280, 'background:var(--paper)');
    h += ph(D, E, px, e, R - px, 138 - e);
    h += `<div class="abs" style="left:448pt;top:151pt;width:136pt">` +
      `<div data-slot="oh.label" style="font:700 8.5pt/11pt var(--font-body);letter-spacing:1.5pt;text-transform:uppercase;color:${cy}">${esc(ev.label)}</div>` +
      `<div class="disp" data-slot="address" data-lines="2" data-fit2="21,24,12" style="margin-top:6pt;max-height:48pt;white-space:normal;font-size:21pt;line-height:24pt;letter-spacing:-.3pt;color:${on}"><span>${esc(L.address)}</span></div>` +
      `<div class="nowrap" data-slot="place" style="margin-top:5pt;font:600 8pt/10pt var(--font-body);letter-spacing:1.4pt;text-transform:uppercase;color:${cy}">${esc(X.cityZip(L))}</div>` +
      `<div style="margin-top:11pt;height:0;border-top:.7pt solid ${cy}"></div>` +
      `<div class="nowrap" data-slot="oh.date" style="margin-top:9pt;font:500 12pt/15pt var(--font-display);color:${on}">${esc(ev.long)}</div>` +
      `<div class="nowrap" data-slot="oh.time" style="margin-top:1pt;font:500 10.5pt/13pt var(--font-body);color:${bw ? 'var(--muted)' : 'var(--on-soft)'}">${esc(ev.time)}</div></div>`;
    h += narrow(FB, 36, 29, 178, S) + vr(224, 30, 264);
    h += prompts(FB, 234, 178, 32, S, 90, [32, 54, 76]);
    return h + foot1(D, [28, FOOT, 556, FOOT_H], {dark: !bw});
  };

  /* ================================ MAP-ROOM ================================ */
  // white, serif navy: a navy block ruled with the map grid (the set's signature, the postcard back), the house plain
  // beside it, the pale band tint under the column heads and the navy row numbers, square bullets on the questions
  const grid = c => `background-image:linear-gradient(${c} .6pt,transparent .6pt),linear-gradient(90deg,${c} .6pt,transparent .6pt);background-size:18pt 18pt`;
  const block = bw => bw ? `background-color:#fff;${grid('rgba(0,0,0,.11)')};border:1.2pt solid #111` : `background-color:var(--ink);${grid('rgba(255,255,255,.085)')}`;
  L$['map-room-signin'] = (D0, E) => {
    const D = bwD(D0, E), L = D.listing, ev = X.ev(D), m = 36, W = 720, dated = ev.kind !== 'public', bw = E.bw, e = eg(E);
    const navy = bw ? '#111' : 'var(--ink)', sky = bw ? '#111' : 'var(--sky)', on = bw ? '#111' : '#fff', pale = bw ? 'rgba(0,0,0,.06)' : 'var(--band)';
    let h = box(e, e, 452 - e, 196 - e, block(bw));
    h += box(m + 4, 45, 8, 8, `background:${sky}`);
    h += txt('oh.label', ev.label, m + 20, 43, 380, `font:700 10pt/12pt var(--font-body);letter-spacing:2.6pt;text-transform:uppercase;color:${sky}`);
    h += X.line('title', 'Please sign in', m + 3, 58, 400, 48, 32, 'disp', `font-weight:600;letter-spacing:-.9pt;color:${on}`);
    if(dated){
      h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, m + 4, 124, 400, 13, 9, '', `font:600 13pt/16pt var(--font-display);color:${sky}`);
      h += X.line('address', L.address, m + 3, 142, 400, 24, 15, 'disp', `font-weight:600;letter-spacing:-.3pt;color:${on}`);
    } else {
      h += txt('welcome', 'Welcome to', m + 4, 125, 400, `font:400 11pt/1 var(--font-body);color:${bw ? 'var(--muted)' : 'var(--on-soft)'}`);
      h += X.line('address', L.address, m + 3, 139, 400, 26, 16, 'disp', `font-weight:600;letter-spacing:-.4pt;color:${on}`);
    }
    h += X.line('place', X.cityZip(L).toUpperCase(), m + 4, 175, 400, 8.5, 8, '', `letter-spacing:1.9pt;color:${sky};font-weight:700`);
    h += ph(D, E, 474, 36, 282, 160);
    // the table in the set's one treatment: the pale band tint under the column heads and down the number column, navy type
    const nw = 36, cs = cols(m, nw, [210, 222, 96, 156]), yh = 212, y0 = 238, rh = 39, bot = y0 + 7 * rh;
    h += band(m, yh, W, y0 - yh, `background:${pale}`) + band(m, y0, nw, bot - y0, `background:${pale}`);
    h += labels(cs, yh + 1, 22, 'font-weight:700;font-size:8.5pt;letter-spacing:1pt;color:var(--ink)');
    h += box(m, y0 - 1.4, W, 1.4, `background:${navy}`);
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      h += num(m, y, nw, rh, E.first + i, `font:600 16pt var(--font-display);color:${navy}`);
      if(i < 6) h += hr(m, y + rh, W);
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - 21, y + (rh - 18) / 2, 18, 'border:.9pt solid var(--ink);color:var(--ink)'); });
    }
    cs.forEach(c => { h += vr(c.x, y0 + 2, bot - y0 - 2); });
    h += box(m, bot, W, 0, `border-top:1.4pt solid ${navy}`);
    return h + foot1(D, [m, 522, W, 60]);
  };
  // the navy grid block runs across the top with the house set into it; the set's square bullets open the three prompts
  L$['map-room-feedback'] = (D0, E) => {
    const D = bwD(D0, E), FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, e = eg(E), R = 612 - e;
    const navy = bw ? '#111' : 'var(--ink)', sky = bw ? '#111' : 'var(--sky)', on = bw ? '#111' : '#fff', blue = bw ? '#111' : 'var(--accent)';
    const S = mkS({qs: 11, qst: 'font-weight:600;color:var(--ink)', qIn: 16,
      lab: (slot, t, x, y, w) => txt(slot, t, x, y, w || 0, `font:700 8pt/10pt var(--font-body);letter-spacing:1pt;text-transform:uppercase;color:${blue}`),
      pill: () => 'border:.9pt solid var(--ink);background:#fff;color:var(--ink);font-size:8pt;letter-spacing:.6pt',
      dot: () => 'border:.9pt solid var(--ink);background:transparent;color:var(--ink);font-size:9.5pt;font-family:var(--font-display);font-weight:600',
      mark: (i, x, y) => i > 2 ? '' : box(x + 1, y + 3.5, 7, 7, `background:${blue}`)});
    let h = box(e, e, R - e, 66 - e, block(bw));
    h += box(28, 25.5, 7, 7, `background:${sky}`);
    h += txt('oh.label', ev.label, 42, 23, 250, `font:700 8.5pt/11pt var(--font-body);letter-spacing:2.2pt;text-transform:uppercase;color:${sky}`);
    h += X.line('address', L.address, 27, 34, 264, 21, 13, 'disp', `font-weight:600;letter-spacing:-.3pt;color:${on}`);
    h += X.line('oh.date', ev.long, 296, 23, 144, 10.5, 8, '', `text-align:right;font:600 10.5pt/13pt var(--font-display);color:${on}`);
    h += X.line('oh.time', ev.time, 296, 37, 144, 9.5, 8, '', `text-align:right;font-weight:500;color:${bw ? 'var(--muted)' : 'var(--on-soft)'}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), 296, 50, 144, 8, 8, '', `text-align:right;letter-spacing:1.5pt;font-weight:700;color:${sky}`);
    h += ph(D, E, 452, 24, 132, 78);
    h += prompts(FB, 28, 268, 76, S, 76, [28, 49, 70]) + vr(308, 74, 226);
    const x = 320, w = 264;
    h += S.lab('q.price', FB.price, x, 110, w) + pills(FB, x, 122, w, S, {h: 20});
    h += lower(FB, x, 150, w, Object.assign({}, S, {qIn: 0, mark: null}));
    return h + foot1(D, [28, FOOT, 556, FOOT_H]);
  };

  /* ================================ MIDNIGHT ================================ */
  // a midnight field with no page frame: the house in the set's single gold keyline, the centered invitation beside it,
  // and the writing on square ivory bars under a gold rule (gold hairline dividers, gold numerals on the dark); every
  // label in the set's tracked Source Sans capitals
  const key = (E, x, y, w, hgt) => { const c = E.bw ? '#111' : 'var(--gold)';
    return box(x - 4, y - 4, w + 8, hgt + 8, `border:.7pt solid ${c}`); };   // one thin gold keyline, as the set frames its photos
  const pane = (x, y, w, hgt, bw) => band(x, y, w, hgt, bw ? 'border:.7pt solid #111;background:#fff' : 'background:var(--paper)');
  L$['midnight-signin'] = (D0, E) => {
    const D = bwD(D0, E), L = D.listing, ev = X.ev(D), m = 48, W = 696, dated = ev.kind !== 'public', bw = E.bw, e = eg(E), R = 792 - e;
    const on = bw ? 'var(--ink)' : 'var(--on)', gd = bw ? 'var(--ink)' : 'var(--gold)', gi = bw ? 'var(--ink)' : 'var(--gold-ink)';
    let h = bw ? '' : fl(e, e, R, 612 - e, 'background:var(--field)');
    h += fl(e, e, R, e + 3, `background:${gd}`);
    h += key(E, m + 8, 42, 282, 150) + ph(D, E, m + 8, 42, 282, 150);
    const tx = 372, tw = 372, cx = tx + tw / 2;
    h += X.flank(ev.label, cx, 40, tw, 'kicker', `font:700 10.5pt/12pt var(--font-body);letter-spacing:3.4pt;color:${gd}`, `.6pt solid ${gd}`);
    h += X.line('title', 'Please sign in', tx, 56, tw, 48, 32, 'disp', `text-align:center;color:${on};font-weight:400;letter-spacing:-.6pt`);
    h += box(cx - 52, 124, 104, 0, `border-top:.7pt solid ${gd}`);
    if(dated){
      h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, tx, 134, tw, 13, 9, '', `text-align:center;font:500 13pt/16pt var(--font-display);color:${gd}`);
      h += X.line('address', L.address, tx, 152, tw, 23, 14, 'disp', `text-align:center;color:${on}`);
    } else {
      h += txt('welcome', 'Welcome to', tx, 135, tw, `text-align:center;font:600 9.5pt/1 var(--font-body);letter-spacing:3pt;text-transform:uppercase;color:${bw ? 'var(--muted)' : 'var(--on-soft)'}`);
      h += X.line('address', L.address, tx, 148, tw, 27, 16, 'disp', `text-align:center;color:${on}`);
    }
    h += X.line('place', X.cityZip(L).toUpperCase(), tx, 184, tw, 8.5, 8, '', `text-align:center;letter-spacing:2.2pt;color:${gd};font-weight:700`);
    const cs = cols(88, 0, [208, 222, 90, 136]), y0 = 232, pitch = 39.5, bh = 35.5;
    h += labels(cs, 205, 22, `font-family:var(--font-body);font-weight:700;font-size:8.5pt;letter-spacing:1.6pt;color:${gd}`);
    h += box(88, y0 - 3.5, 656, 0, `border-top:1pt solid ${gd}`);
    for(let i = 0; i < 7; i++){
      const y = y0 + i * pitch;
      h += num(m, y, 36, bh, E.first + i, `font:500 21pt var(--font-display);color:${gd}`);
      h += pane(88, y, 656, bh, bw);
      cs.forEach((c, k) => { if(k) h += vr(c.x, y + 4, bh - 8, bw ? 'rgba(0,0,0,.4)' : 'rgba(125,98,36,.6)');
        if(c.yn) h += X.yn(c.x + c.w / 2 - 21, y + (bh - 18) / 2, 18, `border:.8pt solid ${gi};color:var(--ink)`); });
    }
    return h + foot1(D, [m, 520, W, 60], {dark: !bw});
  };
  // the same lit panes as a grid of windows: the ratings, the three prompts side by side, then the seller question
  L$['midnight-feedback'] = (D0, E) => {
    const D = bwD(D0, E), FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, e = eg(E), R = 612 - e;
    const on = bw ? 'var(--ink)' : 'var(--on)', gd = bw ? 'var(--ink)' : 'var(--gold)', gi = bw ? 'var(--ink)' : 'var(--gold-ink)';
    const S = mkS({qs: 10.5, qst: 'font-weight:500;color:var(--ink)',
      lab: (slot, t, x, y, w) => txt(slot, t, x, y, w || 0, `font:700 8pt/10pt var(--font-body);letter-spacing:1.4pt;text-transform:uppercase;color:${gi}`),
      pill: () => `border:.8pt solid ${gi};background:transparent;color:var(--ink);font-family:var(--font-body);font-size:8pt;letter-spacing:1pt;white-space:nowrap;border-radius:0`,
      dot: () => `border:.8pt solid ${gi};background:transparent;color:var(--ink);font-size:10pt;font-family:var(--font-display)`, wl: `border-top-color:${bw ? 'rgba(0,0,0,.34)' : 'rgba(18,26,43,.36)'}`});
    let h = bw ? '' : fl(e, e, R, 396 - e, 'background:var(--field)');
    h += fl(e, e, R, e + 2.5, `background:${gd}`);
    h += key(E, 40, 33, 138, 48) + ph(D, E, 40, 33, 138, 48);
    const tx = 200, tw = 380, cx = tx + tw / 2;
    h += X.flank(ev.label, cx, 27, tw, 'kicker', `font:700 9pt/11pt var(--font-body);letter-spacing:3pt;color:${gd}`, `.6pt solid ${gd}`);
    h += X.line('address', L.address, tx, 39, tw, 23, 15, 'disp', `text-align:center;color:${on}`);
    h += `<div class="abs" style="left:${tx}pt;top:70pt;width:${tw}pt;display:flex;justify-content:center;gap:12pt">` +
      `<div class="nowrap" data-slot="place" style="font:700 8pt/11pt var(--font-body);letter-spacing:2pt;text-transform:uppercase;color:${gd}">${esc(X.cityZip(L))}</div>` +
      `<div class="nowrap" data-slot="oh.date" style="font:600 9pt/11pt var(--font-body);color:${bw ? 'var(--muted)' : 'var(--on-soft)'}">${esc(`${ev.long}  ·  ${ev.time}`)}</div></div>`;
    // the ratings: two panes
    h += pane(28, 92, 252, 54, bw) + S.lab('q.price', FB.price, 38, 99, 232) + pills(FB, 38, 113, 232, S, {h: 22});
    h += pane(284, 92, 300, 54, bw) + S.lab('q.cond', FB.cond, 294, 99, 132) + X.dots(294, 111, 132, 21, S.dot) + S.lab('q.shows', FB.shows, 442, 99, 132) + X.dots(442, 111, 132, 21, S.dot);
    h += txt('q.scale', FB.scale, 294, 134.5, 280, 'text-align:center;font-size:8pt;color:var(--muted)');
    // the three prompts: three panes side by side
    const pw = (556 - 8) / 3;
    FB.prompts.forEach(([k, t], i) => { const x = 28 + i * (pw + 4), y = 150;
      h += pane(x, y, pw, 84, bw) + S.q('q.' + k, t, x + 8, y + 7, pw - 16) + wl(x + 8, y + 35, pw - 16, S.wl) + wl(x + 8, y + 56, pw - 16, S.wl) + wl(x + 8, y + 77, pw - 16, S.wl); });
    // the seller question, name and contact: one long pane
    h += pane(28, 238, 556, 64, bw) + S.q('q.seller', FB.seller, 38, 245, 330) + wl(38, 272, 334, S.wl) + wl(38, 293, 334, S.wl);
    h += S.lab('q.name', FB.name, 392, 243) + wl(392, 268, 182, S.wl) + S.lab('q.contact', FB.contact, 392, 272) + wl(392, 296, 182, S.wl);
    return h + foot1(D, [28, FOOT, 556, FOOT_H], {dark: !bw});
  };

  // the body class is the look's first word (in, answer, inside, long, map, midnight); the fixed palettes need no brand kit
  X.themes = X.themes || {};
  ['in', 'answer', 'inside', 'long', 'map', 'midnight'].forEach(k => { X.themes[k] = () => {}; });
})();
