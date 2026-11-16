/* Open House extras for design sets, batch i (owner 11/15/2026: every set gets its own sign-in sheet and feedback card):
   across-the-fold, negative, built-ins, center-column, four-windows, house-360.
   Round 3 (owner 11/15/2026, "one style thread through the whole set"): a card is a member of its set first. It uses only
   shapes, fills, colors, weights and type treatments its set's fold-over, flyers and postcards use, bigger and better, and
   invents none. Round 2's gains stay (the house 3 in wide or more, a divider on every column, roomy rows, answer lines
   0.28 in apart, round outlined rating marks, the black logo on black and white). Rows are white on hairlines in the
   set's rule color (no grey stripes); corners are square, as in every one of these sets; rating marks are outlined, never
   tinted. The one functional exception: on a dark set the writing sits on a light panel (a pen needs paper), drawn plain.
   The writing area (columns, seven rows, fields and wording, standard footer #1 at its standard size, light grayscale photo
   on black and white, no date on public sign-in sheets) is the approved system. A look's first word is the theme key. */
(function(){
  const X = Extras, L$ = X.looks, esc = X.esc, K = X.lib;
  const {cols, labels, qs, box, txt, ph, foot1, facts, edge, labelLines} = K;

  /* the sets' own palettes and fonts (from each set's css) */
  const S = {
    across: {navy: '#1a2134', navy2: '#252f4a', gold: '#c8a46a', goldInk: '#85652c', serif: "'Source Serif 4',Georgia,serif", sans: "'Hanken Grotesk',Helvetica,sans-serif"},
    negative: {grot: "'Archivo',Helvetica,sans-serif", sans: "'Inter',Helvetica,sans-serif"},
    built: {brick: '#a8322a', ink: '#222', serif: "'Libre Baskerville',Georgia,serif", sans: "'Work Sans',Helvetica,sans-serif"},
    center: {slate: '#1e2e2d', brass: '#c2a36b', brassInk: '#7a5f22', serif: "'EB Garamond',Georgia,serif", sans: "'Mulish',Helvetica,sans-serif"},
    four: {teal: '#182d2d', teal2: '#274141', mint: '#8fd3b8', mintInk: '#2a6b57', grot: "'Archivo',Helvetica,sans-serif", sans: "'Albert Sans',Helvetica,sans-serif"},
    house: {green: '#17403a', pale: '#a9d6c5', mid: '#2f6d5d', serif: "'Source Serif 4',Georgia,serif", sans: "'Source Sans 3',Helvetica,sans-serif"}};

  /* the footer's colors on a dark field and the rows' writing colors (the black-and-white version uses extras.css's) */
  const theme = o => (D, bw, root) => {
    if(bw) return;
    Object.entries(Object.assign({paper: '#ffffff', ink: '#1c1c1c', muted: '#555', line: 'rgba(28,28,28,.26)', tint: 'rgba(0,0,0,.035)',
      on: '#fff', 'on-soft': 'rgba(255,255,255,.84)', 'line-on': 'rgba(255,255,255,.3)'}, o)).forEach(([k, v]) => root.setProperty('--' + k, v));
  };
  X.themes.across = theme({paper: S.across.navy, ink: S.across.navy, gold: S.across.gold, accent: S.across.gold, line: 'rgba(26,33,52,.3)', tint: 'rgba(26,33,52,.045)'});
  X.themes.negative = theme({paper: '#fff', ink: '#000', gold: '#000', accent: '#000', line: 'rgba(0,0,0,.34)', tint: 'rgba(0,0,0,.05)'});
  X.themes.built = theme({paper: '#fff', ink: '#222', gold: S.built.brick, accent: S.built.brick, line: 'rgba(34,34,34,.26)', tint: 'rgba(168,50,42,.04)'});
  X.themes.center = theme({paper: S.center.slate, ink: S.center.slate, gold: S.center.brass, accent: S.center.brass, line: 'rgba(30,46,45,.3)', tint: 'rgba(30,46,45,.045)'});
  X.themes.four = theme({paper: S.four.teal, ink: S.four.teal, gold: S.four.mint, accent: S.four.mint, line: 'rgba(24,45,45,.3)', tint: 'rgba(24,45,45,.045)'});
  X.themes.house = theme({paper: S.house.green, ink: S.house.green, gold: S.house.pale, accent: S.house.pale, line: 'rgba(23,64,58,.3)', tint: 'rgba(23,64,58,.045)'});

  const dateText = ev => `${ev.long}   ·   ${ev.time}`;
  const col = (E, c, bwc) => E.bw ? (bwc || '#111') : c;
  // a number gutter: the table's own furniture, like a row tint (its rows' rules end on its edge by design)
  const gutter = (x, y, w, h, style) => `<div class="rowband" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${style}"></div>`;
  const FOOT_S = [48, 516, 696, 58], FOOT_F = [40, 312, 532, 54];   // the standard footer, the same size on every set
  const YN = 18;                                                     // Y / N marks, 0.25 in
  const factLines = L => facts(L).map(([, v, k]) => `${v} ${k}`.toUpperCase());

  /* ---------- the sign-in writing area: header labels, seven rows, a divider on every column. o shapes each look ---------- */
  const table = (D, E, o) => {
    const x0 = o.x0, W = o.W, top = o.top, bot = o.bot, hd = o.hd || 32, n = o.numW || 40, rh = (bot - top - hd) / 7, y0 = top + hd;
    const cs = cols(x0, n, o.widths || [196, 184, 104, W - n - 196 - 184 - 104]), from = o.from != null ? o.from : n;
    let h = o.under ? o.under(cs, y0, rh) : '';
    for(let i = 0; i < 7; i++) if(o.band && o.band(i)) h += `<div class="rowband" style="left:${x0 + from}pt;top:${y0 + i * rh}pt;width:${W - from}pt;height:${rh}pt;background:${o.bandColor};"></div>`;
    h += labels(cs, top + (o.labY != null ? o.labY : 6), o.labH || hd - 12, `font-size:8.5pt;align-items:center;${o.label}`);
    h += o.head ? o.head(cs, y0) : box(x0, y0 - 1, W, o.headRule || 1, `background:${o.headColor}`);
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      h += o.num(E.first + i, x0, y, rh, n);
      if(i < 6) h += box(x0 + from, y + rh, W - from, 0, o.sep);
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - YN - 3, y + rh / 2 - YN / 2, YN, o.yn); });
    }
    if(o.vr !== false) cs.forEach(c => { h += `<div class="vrule" style="left:${c.x}pt;top:${y0 + 5}pt;height:${7 * rh - 10}pt${o.vrStyle ? ';' + o.vrStyle : ''}"></div>`; });
    return h + (o.over ? o.over(cs, y0, rh) : '');
  };

  /* ---------- the feedback fields, as blocks a look places where its layout wants them. The fields and their wording are
     the approved ones (price pills, two ratings 1-5 with "Circle one", the seller question with two lines, name and contact,
     three prompts with three lines each); write-in lines sit 20.2 pt (0.28 in) apart. o: lab, pill, dot(i), q, muted, sans ---------- */
  const GAP = 20.2;
  // a question: one line where the column is wide; in a narrow column it may take two lines, set on the bottom of its space.
  // When it does wrap it breaks at one place only, nearest the middle with the second line the longer one, so the last line
  // is never a short tail (last-line rule) whatever the agent typed; the words sit in an inline run measured by its own lines
  const twoLine = t => { const w = String(t).trim().split(/\s+/); if(w.length < 2) return w.join('');
    let best = 1, bd = 1e9; for(let k = 1; k < w.length; k++){ const a = w.slice(0, k).join(' ').length, b = w.slice(k).join(' ').length, d = b >= a ? b - a : 1e6 + a - b; if(d < bd){ bd = d; best = k; } }
    return w.slice(0, best).join('\u00a0') + ' ' + w.slice(best).join('\u00a0'); };
  const ask = (slot, t, x, y, w, o, hgt) => { const sz = o.qSize || 10.5; return hgt
    ? `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt;display:flex;align-items:${o.barMid ? 'center' : 'flex-end'};${o.qWrap || ''}">` +
      `<div data-slot="${slot}" data-lines="2" data-fit2="${sz},${sz + 1.5},8,${sz - 1}" style="width:100%;overflow:hidden;font-size:${sz}pt;line-height:${sz + 1.5}pt;${o.q}"><span data-slot="${slot}.t">${esc(twoLine(t))}</span></div></div>`
    : X.line(slot, t, x, y, w, sz, 8, '', o.q + (o.qLine || '')); };
  const pills = (FB, o, x, y, w) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;display:flex;gap:5pt">` +
    FB.choices.map(t => `<span class="pill" style="flex:1 1 auto;height:18pt;padding:0 3pt;white-space:nowrap;${o.pill}">${t}</span>`).join('') + '</div>';
  // price and the two ratings. Wide: the rating label beside its marks (93 pt tall). stack: the label over its marks (116 pt)
  const blkA = (D, E, o, x, y, w, stack) => {
    const FB = qs(D), lab = (slot, t, lx, ly, lw) => txt(slot, t, lx, ly, lw, o.lab), s = o.shift || 0, d = 20;
    let h = lab('q.price', FB.price, x, y, w) + pills(FB, o, x, y + 12 + s, w);
    if(stack){
      h += lab('q.cond', FB.cond, x, y + 37 + s, w) + X.dots(x, y + 47 + s, w, d, o.dot);
      h += lab('q.shows', FB.shows, x, y + 74 + s, w) + X.dots(x, y + 84 + s, w, d, o.dot);
      return h + txt('q.scale', FB.scale, x, y + 108 + s, w, `text-align:right;font:500 8pt/1 ${o.sans};color:${o.muted}`);
    }
    const lw = o.labW || 98;
    h += lab('q.cond', FB.cond, x, y + 43 + s, lw - 8) + X.dots(x + lw, y + 37 + s, w - lw, d, o.dot);
    h += lab('q.shows', FB.shows, x, y + 67 + s, lw - 8) + X.dots(x + lw, y + 61 + s, w - lw, d, o.dot);
    return h + txt('q.scale', FB.scale, x + lw, y + 85 + s, w - lw, `text-align:right;font:500 8pt/1 ${o.sans};color:${o.muted}`);
  };
  // the seller question with two lines, then name and contact. Wide: side by side (90 pt tall). stack: one under the other (128 pt)
  const blkS = (D, E, o, x, y, w, stack) => {
    const FB = qs(D), lab = (slot, t, lx, ly, lw) => txt(slot, t, lx, ly, lw, o.labPlain || o.lab);
    if(stack){
      const q = stack === true ? 24 : stack;
      return ask('q.seller', FB.seller, x, y, w, o, q) + X.wline(x, y + q + 18, w) + X.wline(x, y + q + 18 + GAP, w) +
        lab('q.name', FB.name, x, y + q + 48, w) + X.wline(x, y + q + 72, w) + lab('q.contact', FB.contact, x, y + q + 80, w) + X.wline(x, y + q + 104, w);
    }
    const hw = (w - 14) / 2;
    return ask('q.seller', FB.seller, x, y, w, o) + X.wline(x, y + 32, w) + X.wline(x, y + 32 + GAP, w) +
      lab('q.name', FB.name, x, y + 66, hw) + X.wline(x, y + 90, hw) + lab('q.contact', FB.contact, x + hw + 14, y + 66, hw) + X.wline(x + hw + 14, y + 90, hw);
  };
  // one prompt with its three lines (q pt for the question, then the lines)
  const blkP = (D, E, o, i, x, y, w, q) => { const [k, t] = qs(D).prompts[i]; q = q || 24;
    return ask('q.' + k, t, x, y, w, o, q) + [0, 1, 2].map(j => X.wline(x, y + q + 18 + j * GAP, w)).join(''); };

  /* ======================================= ACROSS THE FOLD =======================================
     Midnight navy, warm gold labels, white serif. The sheet is the brochure opened flat: the house fills the left page up
     to the fold, the words sit on the right page, and the gold fold line runs down the middle of the whole sheet (it is the
     table's middle divider), crossing the gold rule over the table at the set's diamond. White rows on gold hairlines; the
     price boxes are the set's gold-outlined tag; the number gutter is one of its lifted navy boxes. */
  const A = S.across;
  const aLabel = (E, text, x, y, w, size) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;display:flex;align-items:center;gap:14pt">` +
    `<div class="nowrap" data-slot="oh.label" style="font:700 ${size}pt/${size + 3}pt ${A.sans};letter-spacing:${size > 10 ? 4.5 : 3.6}pt;text-transform:uppercase;color:${col(E, A.gold)}">${esc(text)}</div>` +
    `<div style="flex:1;height:0;border-top:.8pt solid ${col(E, A.gold)}"></div></div>`;
  // the diamond where two folds cross, with a little air cut around it
  const diamond = (x, y, d, color, air) => `<div class="abs" data-clear-skip="1" style="left:${x - d / 2}pt;top:${y - d / 2}pt;width:${d}pt;height:${d}pt;background:${color};transform:rotate(45deg);box-shadow:0 0 0 2.5pt ${air}"></div>`;

  L$['across-the-fold-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, e = edge(E), m = 48, pw = 696, fx = 396, hy = 208, bot = 506;
    const on = col(E, '#fff'), gold = col(E, A.gold), ink = col(E, A.navy), g = 36;
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', `background:${A.navy}`);
    // the left page: the whole house, off the top left corner, up to the fold
    h += bw ? ph(D, E, m, 24, fx - 9 - m, hy - 11 - 24) : ph(D, E, e, e, fx - 9 - e, hy - 11 - e);
    // the right page
    const tx = fx + 24, tw = m + pw - tx;
    h += aLabel(E, ev.label, tx, 36, tw, 11);
    h += X.line('title', 'Please sign in', tx, 54, tw, 46, 26, '', `font-family:${A.serif};font-weight:400;letter-spacing:-.4pt;color:${on}`);
    h += X.line('address', L.address, tx, 118, tw, 23, 14, '', `font-family:${A.serif};font-weight:600;color:${on}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), tx, 150, tw, 9, 8, '', `font:700 9pt/1 ${A.sans};letter-spacing:2.8pt;color:${gold}`);
    if(dated) h += X.line('oh.date', dateText(ev), tx, 165, tw, 11, 8, '', `font:600 11pt/1 ${A.sans};letter-spacing:.4pt;color:${on}`);
    h += box(tx, dated ? 182 : 170, tw, 0, `border-top:.6pt solid ${gold};opacity:.7`);
    h += X.line('facts', factLines(L).join('   ·   '), tx, dated ? 187 : 177, tw, 8.5, 8, '', `font:700 8.5pt/1 ${A.sans};letter-spacing:1.5pt;color:${on}`);
    // the writing panel, its number gutter a lifted navy box
    h += box(m, hy, pw, bot - hy, bw ? 'border:.9pt solid #111' : 'background:#fff');
    h += gutter(m, hy, g, bot - hy, bw ? 'border-right:.9pt solid #111' : `background:${A.navy2}`);
    h += table(D, E, {x0: m, W: pw, top: hy, bot, hd: 32, numW: g, widths: [154, 158, 100, pw - g - 412],
      label: `font-family:${A.sans};font-weight:700;letter-spacing:1.5pt;color:${ink}`, headColor: gold, headRule: 1.2,
      sep: `border-top:.6pt solid ${bw ? 'rgba(0,0,0,.32)' : A.gold}`,
      num: (n, x, y, rh) => `<div class="num" style="left:${x}pt;top:${y + rh / 2 - 12}pt;width:${g}pt;font:600 18pt/24pt ${A.serif};color:${bw ? '#111' : A.gold}">${n}</div>`,
      yn: `border:.8pt solid ${ink};color:${ink};font-family:${A.sans}`});
    // the folds: one down the middle of the sheet, one across it over the table, the diamond where they cross
    h += box(fx - .6, e, 1.2, bot - e, `background:${gold}`);
    h += bw ? box(e, hy - .6, 792 - 2 * e, 1.2, 'background:#111') : E.fl(0, hy - .6, 792, 1.2, 'lr', `background:${gold}`);
    h += diamond(fx, hy, 13, gold, bw ? '#fff' : A.navy);
    h += foot1(D, FOOT_S, {dark: !bw});
    return h;
  };

  L$['across-the-fold-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, e = edge(E), m = 40, pw = 532, on = col(E, '#fff'), gold = col(E, A.gold), ink = col(E, A.navy);
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', `background:${A.navy}`);
    h += bw ? ph(D, E, m, 24, 128, 66) : ph(D, E, e, e, 170 - e, 92 - e);
    const tx = 188, tw = m + pw - tx, fx = 306, p0 = 98, fy = 204, p1 = 306;
    h += aLabel(E, ev.label, tx, 27, tw, 9.5);
    h += X.line('address', L.address, tx, 44, tw, 25, 14, '', `font-family:${A.serif};font-weight:600;color:${on}`);
    h += X.line('oh.date', `${X.cityZip(L).toUpperCase()}   ·   ${ev.long}   ·   ${ev.time}`, tx, 78, tw, 8.5, 8, '', `font:700 8.5pt/1 ${A.sans};letter-spacing:1.3pt;color:${gold}`);
    h += box(m, p0, pw, p1 - p0, bw ? 'border:.9pt solid #111' : 'background:#fff');
    const o = {sans: A.sans, muted: bw ? '#444' : '#5c6275', lab: `font:700 8.5pt/1 ${A.sans};letter-spacing:1.2pt;text-transform:uppercase;color:${ink}`,
      pill: `border:.9pt solid ${gold};color:${bw ? '#111' : A.goldInk};font:700 8.5pt/1 ${A.sans};letter-spacing:1.5pt;text-transform:uppercase`,   // the set's outlined tag
      dot: () => `border:.8pt solid ${ink};background:#fff;color:${ink};font:600 10.5pt/1 ${A.serif}`,
      q: `font-family:${A.serif};font-weight:600;color:${ink};`};
    const ax = m + 16, cw = (pw - 32 - 28) / 2;
    h += blkA(D, E, o, ax, p0 + 8, cw) + blkS(D, E, o, fx + 14, p0 + 8, cw);
    const w3 = (pw - 32 - 36) / 3;
    [0, 1, 2].forEach(i => { h += blkP(D, E, o, i, ax + i * (w3 + 18), fy + 6, w3);
      if(i) h += box(ax + i * (w3 + 18) - 9, fy + 14, 0, p1 - fy - 24, `border-left:.6pt solid ${bw ? 'rgba(0,0,0,.3)' : A.gold}`); });
    // the card folded in four: the folds cross at the diamond
    h += box(fx - .5, p0, 1, fy - p0, `background:${gold}`);
    h += bw ? box(e, fy - .5, 612 - 2 * e, 1, 'background:#111') : E.fl(0, fy - .5, 612, 1, 'lr', `background:${gold}`);
    h += diamond(fx, fy, 11, gold, '#fff');
    h += foot1(D, FOOT_F, {dark: !bw});
    return h;
  };

  /* ======================================= NEGATIVE =======================================
     Pure black and white, like the set. One black slab runs the full width of the sheet with the house set into it,
     carries the column heads, and turns down the left edge as the number gutter (white numbers on black). Archivo caps,
     the set's facts (heavy figure over a small caps label, under a rule), white rows on black rules, black caption bars
     over every question on the card. The black-and-white version keeps the slab (it is the set); only the photo goes
     to the light grayscale one. */
  const N = S.negative;
  const nFacts = (L, x, y, on) => facts(L).map(([, v, k], i) =>
    txt(`fact.${i}`, v, x + i * 112, y, 104, `font:900 16pt/18pt ${N.grot};color:${on}`) +
    txt(`fact.${i}.k`, k.toUpperCase(), x + i * 112, y + 20, 104, `font:700 8pt/9pt ${N.grot};letter-spacing:1.8pt;color:${on}`)).join('');
  L$['negative-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', e = edge(E), m = 48, pw = 696, g = 44, top = 190, hd = 30, bot = 506, on = '#fff';
    let h = E.fl(0, 0, 792, top + hd, 'ltr', 'background:#000') + gutter(e, top + hd, m + g - e, bot - top - hd, 'background:#000');
    h += ph(D, E, m, 30, 270, 148);
    const tx = m + 294, tw = m + pw - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 32, tw, 10, 8, '', `font:700 10pt/1 ${N.grot};letter-spacing:4.4pt;color:${on}`);
    h += X.line('title', 'PLEASE SIGN IN', tx, 45, tw, 40, 26, '', `font-family:${N.grot};font-weight:900;letter-spacing:.4pt;color:${on}`);
    h += X.line('address', L.address.toUpperCase(), tx, 94, tw, 18, 13, '', `font-family:${N.grot};font-weight:900;color:${on}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), tx, 120, tw, 9, 8, '', `font:600 9pt/1 ${N.grot};letter-spacing:3pt;color:${on}`);
    if(dated) h += X.line('oh.date', dateText(ev).toUpperCase(), tx, 133, tw, 10, 8, '', `font:700 10pt/1 ${N.grot};letter-spacing:1.2pt;color:${on}`);
    const fy = dated ? 148 : 142;
    h += box(tx, fy, tw, 2, `background:${on}`) + nFacts(L, tx, fy + 6, on);
    h += table(D, E, {x0: m, W: pw, top, bot, hd, numW: g, label: `font-family:${N.grot};font-weight:800;letter-spacing:1.5pt;color:${on}`,
      head: cs => box(m, top, pw, 0, 'border-top:.7pt solid rgba(255,255,255,.6)') + cs.map(c => box(c.x, top + 7, 0, hd - 14, 'border-left:.5pt solid rgba(255,255,255,.5)')).join(''),
      sep: 'border-top:.7pt solid #000',
      num: (n, x, y, rh) => `<div class="num" style="left:${x}pt;top:${y + rh / 2 - 12}pt;width:${g}pt;font:900 20pt/24pt ${N.grot};color:#fff">${n}</div>`,
      over: (cs, y0, rh) => [1, 2, 3, 4, 5, 6].map(i => box(m + 8, y0 + i * rh, g - 16, 0, 'border-top:.6pt solid rgba(255,255,255,.45)')).join(''),
      yn: `border:1.2pt solid #000;color:#000;font-family:${N.grot};border-radius:0`, vrStyle: 'border-left:.6pt solid rgba(0,0,0,.55)'});
    h += box(m, bot, pw, 3.6, 'background:#000');
    h += foot1(D, FOOT_S, {});
    return h;
  };

  L$['negative-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), e = edge(E), m = 40, pw = 532, on = '#fff', p0 = 98, fy = 204, p1 = 306;
    let h = E.fl(0, 0, 612, 92, 'ltr', 'background:#000');
    h += ph(D, E, e, e, 166 - e, 92 - e);
    const tx = 184, tw = m + pw - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 29, tw, 8.5, 8, '', `font:700 8.5pt/1 ${N.grot};letter-spacing:3.6pt;color:${on}`);
    h += X.line('address', L.address.toUpperCase(), tx, 43, tw, 25, 14, '', `font-family:${N.grot};font-weight:900;color:${on}`);
    h += X.line('oh.date', `${X.cityZip(L)}   ·   ${ev.long}   ·   ${ev.time}`.toUpperCase(), tx, 76, tw, 8, 8, '', `font:600 8pt/1 ${N.grot};letter-spacing:1.2pt;color:${on}`);
    // the set's caption bars: every label and question is white type on a black bar
    const bar = 'background:#000;color:#fff;padding:3pt 6pt;margin-top:-3pt;';
    const o = {sans: N.sans, muted: '#000', shift: 4, labW: 104,
      lab: `font:800 8.5pt/1 ${N.grot};letter-spacing:1.4pt;text-transform:uppercase;${bar}`,
      labPlain: `font:800 8.5pt/1 ${N.grot};letter-spacing:1.4pt;text-transform:uppercase;color:#000`,
      pill: `border:1.2pt solid #000;color:#000;font:800 8.5pt/1 ${N.grot};letter-spacing:.8pt;text-transform:uppercase;border-radius:0`,
      dot: () => `border:1.4pt solid #000;background:#fff;color:#000;font:800 10.5pt/1 ${N.grot}`,
      q: `font-family:${N.grot};font-weight:800;color:#fff;`, qLine: 'background:#000;padding:3pt 6pt;margin-top:-3pt;', qWrap: 'background:#000;padding:0 6pt;', barMid: true};
    const cw = (pw - 28) / 2;
    h += blkA(D, E, o, m, p0 + 7, cw) + blkS(D, E, o, m + cw + 28, p0 + 7, cw);
    h += box(m + cw + 14 - .6, p0 + 4, 1.2, fy - p0 - 8, 'background:#000');
    const w3 = (pw - 24) / 3;
    [0, 1, 2].forEach(i => { h += blkP(D, E, o, i, m + i * (w3 + 12), fy + 6, w3); });
    h += box(m, p1, pw, 3, 'background:#000');
    h += foot1(D, FOOT_F, {});
    return h;
  };

  /* ======================================= BUILT-INS =======================================
     White paper, Libre Baskerville, brick small caps over thin brick hairlines: open and ruled, nothing boxed. The
     postcard's solid brick band heads the sheet with its run of type (title, hairline, label); the house is a large square
     photo on a white reveal with a brick hairline; the flyer's facts row (figure over a brick label, dividers between);
     the table is a brick caps label row over a brick hairline, brick Baskerville numbers, rows on hairlines. */
  const B = S.built;
  // the house, square, on a white reveal with a brick hairline round it (it may sit over the band)
  const bPhoto = (D, E, x, y, w, h, mat) => `<div class="abs" data-clear-skip="1" style="left:${x - mat}pt;top:${y - mat}pt;width:${w + 2 * mat}pt;height:${h + 2 * mat}pt;background:#fff;border:.8pt solid ${col(E, B.brick, '#111')}"></div>` + ph(D, E, x, y, w, h);
  // title, hairline, label, hairline: the postcard band's run of type
  const bRun = (E, slot, title, size, label, x, y, w, hgt) => { const on = col(E, '#fff');
    return `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt;display:flex;align-items:center;gap:12pt">` +
      `<div class="nowrap" data-slot="${slot}" style="flex:0 1 auto;font:400 ${size}pt/${hgt}pt ${B.serif};color:${on}">${esc(title)}</div>` +
      `<div style="flex:1 1 12pt;min-width:10pt;height:0;border-top:.7pt solid ${on};opacity:.75"></div>` +
      `<div class="nowrap" data-slot="oh.label" style="flex:none;font:600 9pt/12pt ${B.sans};letter-spacing:2.8pt;color:${on}">${esc(label.toUpperCase())}</div>` +
      `<div style="flex:none;width:18pt;height:0;border-top:.7pt solid ${on};opacity:.75"></div></div>`; };
  const bLine = bw => bw ? 'rgba(0,0,0,.34)' : 'rgba(168,50,42,.42)';
  L$['built-ins-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 48, pw = 696, brick = col(E, B.brick, '#111'), band = 84;
    let h = bw ? box(m, 26, pw, 0, 'border-top:1.6pt solid #111') + box(m, band, pw, 0, 'border-top:1.6pt solid #111') : E.fl(0, 0, 792, band, 'ltr', `background:${B.brick}`);
    const nw = 240, nx = m + pw - nw - 5, lw = nx - 26 - m;
    h += bRun(E, 'title', 'Please sign in', 30, ev.label, m, 34, lw, 40);
    h += bPhoto(D, E, nx, 33, nw, 152, 5);
    h += X.line('address', L.address, m, 96, lw, 25, 14, '', `font-family:${B.serif};font-weight:400;color:${B.ink}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), m, 132, dated ? 170 : lw, 8.5, 8, '', `font:600 8.5pt/1 ${B.sans};letter-spacing:2.2pt;color:${brick}`);
    if(dated) h += X.line('oh.date', dateText(ev), m + 176, 131, lw - 176, 10, 8, '', `text-align:right;font:500 10pt/1 ${B.sans};color:${B.ink}`);
    // the flyer's facts row: the figure over a brick label, hairlines between
    const f = facts(L).map(([, v, k]) => [v, k.toUpperCase()]); if(L.yearBuilt) f.push([String(L.yearBuilt), 'YEAR BUILT']); if(f.length < 4 && L.lotSize) f.push([String(L.lotSize).replace(/\s*sq\.?\s*ft\.?.*$/i, ''), 'SQ FT LOT']);
    const fw = lw / f.length;
    h += box(m, 148, lw, 0, `border-top:.7pt solid ${bLine(bw)}`) + box(m, 190, lw, 0, `border-top:.7pt solid ${bLine(bw)}`);
    f.forEach(([v, k], i) => { const fx = m + i * fw;
      if(i) h += box(fx, 154, 0, 30, `border-left:.5pt solid ${bLine(bw)}`);
      h += txt(`fact.${i}`, v, fx + (i ? 12 : 0), 154, fw - 14, `font:400 14pt/17pt ${B.serif};color:${B.ink}`);
      h += txt(`fact.${i}.k`, k, fx + (i ? 12 : 0), 175, fw - 14, `font:600 8pt/9pt ${B.sans};letter-spacing:1.4pt;color:${brick}`); });
    // the table: a brick caps label row over a brick hairline, rows on hairlines
    const top = 200, bot = 506, g = 40;
    h += table(D, E, {x0: m, W: pw, top, bot, hd: 30, numW: g, label: `font-family:${B.sans};font-weight:600;letter-spacing:1.6pt;color:${brick}`,
      headColor: brick, headRule: 1.1, from: 0, sep: `border-top:.5pt solid ${bLine(bw)}`,
      num: (n, x, y, rh) => `<div class="num" style="left:${x}pt;top:${y + rh / 2 - 12}pt;width:${g}pt;font:400 17pt/24pt ${B.serif};color:${brick}">${n}</div>`,
      yn: `border:.8pt solid ${brick};color:${brick};font-family:${B.sans}`, vrStyle: `border-left:.5pt solid ${bLine(bw)}`});
    h += box(m, bot, pw, 0, `border-top:1.1pt solid ${brick}`);
    h += foot1(D, FOOT_S, {});
    return h;
  };

  L$['built-ins-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 40, pw = 532, brick = col(E, B.brick, '#111'), band = 66, p0 = 98, fy = 204, p1 = 306;
    let h = bw ? box(m, 24, pw, 0, 'border-top:1.4pt solid #111') + box(m, band, pw, 0, 'border-top:1.4pt solid #111') : E.fl(0, 0, 612, band, 'ltr', `background:${B.brick}`);
    const nw = 128, nx = m + pw - nw - 4, lw = nx - 20 - m, on = col(E, '#fff');
    h += `<div class="abs" style="left:${m}pt;top:27pt;width:${lw}pt;display:flex;align-items:center;gap:12pt"><div class="nowrap" data-slot="oh.label" style="font:600 8.5pt/11pt ${B.sans};letter-spacing:2.8pt;color:${on}">${esc(ev.label.toUpperCase())}</div>` +
      `<div style="flex:1;height:0;border-top:.7pt solid ${on};opacity:.75"></div></div>`;
    h += X.line('address', L.address, m, 38, lw, 19, 12, '', `font-family:${B.serif};font-weight:400;color:${on}`);
    h += bPhoto(D, E, nx, 26, nw, 64, 4);
    h += X.line('oh.date', `${X.cityZip(L).toUpperCase()}   ·   ${ev.long}   ·   ${ev.time}`, m, 76, lw, 8.5, 8, '', `font:600 8.5pt/1 ${B.sans};letter-spacing:1pt;color:${brick}`);
    const o = {sans: B.sans, muted: '#555', lab: `font:600 8.5pt/1 ${B.sans};letter-spacing:1.5pt;text-transform:uppercase;color:${brick}`,
      pill: `border:.8pt solid ${brick};color:${brick};font:600 8.5pt/1 ${B.sans};letter-spacing:.8pt;text-transform:uppercase`,
      dot: () => `border:.8pt solid ${brick};color:${B.ink};font:400 10.5pt/1 ${B.serif};background:#fff`,
      q: `font-family:${B.serif};font-weight:400;color:${B.ink};`, qSize: 9.5};
    const cw = (pw - 28) / 2;
    h += box(m, p0, pw, 0, `border-top:.9pt solid ${brick}`);
    h += blkA(D, E, o, m, p0 + 9, cw) + blkS(D, E, o, m + cw + 28, p0 + 9, cw);
    h += box(m + cw + 14, p0 + 10, 0, fy - p0 - 16, `border-left:.5pt solid ${bLine(bw)}`);
    // the three prompts in open columns under a brick hairline, hairlines between
    h += box(m, fy, pw, 0, `border-top:.9pt solid ${brick}`);
    const w3 = (pw - 40) / 3;
    [0, 1, 2].forEach(i => { const x = m + i * (w3 + 20);
      if(i) h += box(x - 10, fy + 10, 0, p1 - fy - 16, `border-left:.5pt solid ${bLine(bw)}`);
      h += blkP(D, E, o, i, x, fy + 7, w3, 22); });
    h += foot1(D, FOOT_F, {});
    return h;
  };

  /* ======================================= CENTER COLUMN =======================================
     Dark green-slate, EB Garamond and brass, as the set does it: a brass caps kicker, a left-aligned Garamond heading whose
     second words are brass italic ("Please sign in"), one full-width hairline under it; then the fold-over interior's
     three columns: words, the house in the center column, a ruled list. Single hairlines only. The writing sits on a plain
     light panel (a pen needs paper), its middle column lined up under the photo column. */
  const C = S.center;
  // a Garamond heading whose last words are brass italic (the set's "Just Listed")
  const cHead = (E, slot, plain, ital, x, y, w, size, floor) => `<div class="abs nowrap" data-slot="${slot}" data-shrink="${floor}" style="left:${x}pt;top:${y}pt;width:${w}pt;font-family:${C.serif};font-weight:500;font-size:${size}pt;line-height:${size * 1.2}pt;color:${col(E, '#fff')}">` +
    `${esc(plain)} <span style="font-style:italic;color:${col(E, C.brass)}">${esc(ital)}</span></div>`;
  // the set's ruled list: a caps label, the figure in brass italic, a hairline under each row
  const cList = (E, rows, x, y, w, step, size, vw = 70, ls = 1.5) => rows.map(([v, k], i) =>
    txt(`fact.${i}.k`, k.toUpperCase(), x, y + i * step + (step - 15), w - vw, `font:700 8pt/9pt ${C.sans};letter-spacing:${ls}pt;color:${col(E, '#fff')}`) +
    txt(`fact.${i}`, v, x + w - vw, y + i * step + (step - size - 8), vw, `text-align:right;font:italic 500 ${size}pt/${size + 2}pt ${C.serif};color:${col(E, C.brass)}`) +
    box(x, y + (i + 1) * step - 2, w, 0, `border-top:.5pt solid ${E.bw ? 'rgba(0,0,0,.34)' : 'rgba(194,163,107,.45)'}`)).join('');
  const cFacts = L => { const f = facts(L).map(([, v, k]) => [v, k]); if(L.lotSize) f.push([String(L.lotSize).replace(/\s*sq\.?\s*ft\.?.*$/i, ''), 'Sq Ft Lot']); return f; };
  L$['center-column-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 48, pw = 696;
    const on = col(E, '#fff'), brass = col(E, C.brass), ink = col(E, C.slate), bi = col(E, C.brassInk), hair = bw ? 'rgba(0,0,0,.34)' : 'rgba(194,163,107,.55)';
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', `background:${C.slate}`);
    h += X.line('oh.label', ev.label.toUpperCase(), m, 30, 500, 9, 8, '', `font:700 9pt/1 ${C.sans};letter-spacing:3.4pt;color:${brass}`);
    h += cHead(E, 'title', 'Please', 'sign in', m, 41, 500, 34, 22);
    h += box(m, 87, pw, 0, `border-top:.8pt solid ${hair}`);
    // three columns, as inside the fold-over: the words, the house, the ruled list
    const pwid = 224, px = (792 - pwid) / 2, c1 = px - 12, c2 = px + pwid + 12, py = 98, top = 222, bot = 506, lw = c1 - 14 - m, rx = c2 + 14;
    h += ph(D, E, px, py, pwid, top - 10 - py);
    const ay = dated ? 0 : 22;
    h += X.line('welcome', 'WELCOME TO', m, 102 + ay, lw, 8.5, 8, '', `font:700 8.5pt/1 ${C.sans};letter-spacing:3pt;color:${brass}`);
    h += X.line('address', L.address, m, 116 + ay, lw, dated ? 25 : 27, 14, '', `font-family:${C.serif};font-weight:500;color:${on}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), m, 151 + ay + (dated ? 0 : 3), lw, 9, 8, '', `font:700 9pt/1 ${C.sans};letter-spacing:2.2pt;color:${brass}`);
    if(dated){ h += box(m, 170, lw, 0, `border-top:.5pt solid ${hair}`);
      h += X.line('oh.date', ev.long, m, 178, lw, 13, 9, '', `font-family:${C.serif};font-weight:500;color:${on}`);
      h += X.line('oh.time', ev.time, m, 197, lw, 9.5, 8, '', `font:600 9.5pt/1 ${C.sans};letter-spacing:.5pt;color:${brass}`); }
    h += cList(E, cFacts(L).slice(0, 4), rx, py - 2, m + pw - rx, 28, 16);
    // the writing panel: plain, single hairlines, the Phone / Email column under the photo column
    const g = 44;
    h += box(m, top, pw, bot - top, bw ? 'border:.9pt solid #111' : 'background:#fff');
    h += table(D, E, {x0: m, W: pw, top, bot, hd: 30, numW: g, widths: [c1 - m - g, c2 - c1, 102, m + pw - c2 - 102],
      label: `font-family:${C.sans};font-weight:700;letter-spacing:1.6pt;color:${ink}`,
      head: (cs, y0) => box(m, y0 - 1, pw, 1, `background:${bw ? '#111' : C.brass}`), from: 0,
      sep: `border-top:.5pt solid ${bw ? 'rgba(0,0,0,.3)' : 'rgba(122,95,34,.5)'}`,
      num: (n, x, y, rh) => `<div class="num" style="left:${x}pt;top:${y + rh / 2 - 13}pt;width:${g}pt;font:italic 500 20pt/26pt ${C.serif};color:${bi}">${n}</div>`,
      yn: `border:.8pt solid ${ink};color:${ink};font-family:${C.sans}`});
    h += foot1(D, FOOT_S, {dark: !bw});
    return h;
  };

  L$['center-column-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 40, pw = 532;
    const on = col(E, '#fff'), brass = col(E, C.brass), ink = col(E, C.slate), bi = bw ? '#111' : C.brassInk, hair = bw ? 'rgba(0,0,0,.34)' : 'rgba(194,163,107,.55)';
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', `background:${C.slate}`);
    const sw = 196, px = m + sw + 12, pwid = pw - 2 * sw - 24, p0 = 26, p1 = 306;
    // the center column: the house, then the event, left-aligned as the set sets its text beside a photo
    h += ph(D, E, px, p0, pwid, 84);
    const ll = labelLines(ev.label), cl = (slot, t, y, size, floor, style) => X.line(slot, t, px, y, pwid, size, floor, '', style);
    h += cHead(E, 'oh.label', ll.length > 1 ? ll[0] : '', ll[ll.length - 1], px, 118, pwid, 15.5, 9);
    h += box(px, 141, pwid, 0, `border-top:.8pt solid ${hair}`);
    h += cl('address', L.address, 149, 14.5, 9, `font-family:${C.serif};font-weight:500;color:${on}`);
    h += cl('place', X.cityZip(L).toUpperCase(), 170, 8, 8, `font:700 8pt/1 ${C.sans};letter-spacing:1pt;color:${brass}`);
    h += box(px, 185, pwid, 0, `border-top:.5pt solid ${hair}`);
    h += cl('oh.date', ev.long, 192, 12.5, 8, `font-family:${C.serif};font-weight:500;color:${on}`);
    h += cl('oh.time', ev.time, 210, 9, 8, `font:600 9pt/1 ${C.sans};letter-spacing:.4pt;color:${brass}`);
    h += box(px, 226, pwid, 0, `border-top:.5pt solid ${hair}`);
    h += cList(E, cFacts(L).slice(0, 3), px, 228, pwid, 24, 13, 38, 1);
    // a plain writing panel each side
    const o = {sans: C.sans, muted: bw ? '#444' : '#556', lab: `font:700 8.5pt/1 ${C.sans};letter-spacing:1.4pt;text-transform:uppercase;color:${ink}`,
      pill: `border:.9pt solid ${bw ? '#111' : C.brass};color:${ink};font:700 8pt/1 ${C.sans};letter-spacing:.3pt;text-transform:uppercase;padding:0 2pt`,
      dot: () => `border:.8pt solid ${bi};color:${ink};font:500 11.5pt/1 ${C.serif};background:#fff`,
      q: `font-family:${C.serif};font-weight:500;color:${ink};`};
    const rx = m + pw - sw;
    [m, rx].forEach(x => { h += box(x, p0, sw, p1 - p0, bw ? 'border:.9pt solid #111' : 'background:#fff'); });
    const iw = sw - 24;
    h += blkA(D, E, o, m + 12, p0 + 12, iw, true) + blkS(D, E, o, m + 12, p0 + 136, iw, 22);
    [0, 1, 2].forEach(i => { h += blkP(D, E, o, i, rx + 12, p0 + 9 + i * 88, iw, 22); });
    h += foot1(D, FOOT_F, {dark: !bw});
    return h;
  };

  /* ======================================= FOUR WINDOWS =======================================
     Dark green field, heavy Archivo, the mint flag tag; every corner square. The header is the set's four windows: the
     house in the big pane (off the top left corner) and three lifted panes beside it (the title, the address, the facts
     on mint hairlines), dark mullions between. The writing panel is a white window, its mullions the column dividers, its
     number gutter a lifted pane with mint numerals. Mint stays on small tags, type and hairlines.
     Standing rule: nothing is ever drawn over the house photo. */
  const F = S.four;
  const fChip = (E, lines, x, y, size) => `<div class="abs nowrap" data-slot="oh.label" style="left:${x}pt;top:${y}pt;display:inline-block;padding:${size * .42}pt ${size * 1.1}pt;background:${E.bw ? 'transparent' : F.mint};border:${E.bw ? '1.6pt solid #111' : '0'};` +
    `font:800 ${size}pt/${size * 1.25}pt ${F.grot};letter-spacing:${size * .22}pt;text-transform:uppercase;color:${E.bw ? '#111' : F.teal}">${lines.map(esc).join('<br>')}</div>`;
  const fHair = bw => bw ? 'rgba(0,0,0,.35)' : 'rgba(143,211,184,.45)';

  L$['four-windows-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, e = edge(E), m = 48, pw = 696;
    const on = col(E, '#fff'), mint = col(E, F.mint), tl = col(E, F.teal), G = 6, vx = 316, hb = 184, my = 96;
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', `background:${F.teal}`);
    // pane 1: the house
    h += bw ? ph(D, E, m, 24, vx - m, hb - 24) : ph(D, E, e, e, vx - e, hb - e);
    // pane 2: the title
    const x2 = vx + G, tx = x2 + 20;
    h += bw ? box(x2, 24, m + pw - x2, my - 24, 'border:1.2pt solid #111') : E.fl(x2, 0, 0, my, 'tr', `background:${F.teal2}`);
    h += fChip(E, [ev.label], tx, 30, 10);
    h += X.line('title', 'Please sign in', tx, 51, m + pw - tx - 8, 34, 24, '', `font-family:${F.grot};font-weight:800;letter-spacing:-.5pt;color:${on}`);
    // pane 3: the address
    const y3 = my + G, x4 = 566;
    h += box(x2, y3, x4 - G - x2, hb - y3, bw ? 'border:1.2pt solid #111' : `background:${F.teal2}`);
    h += X.line('address', L.address, tx, dated ? 110 : 118, x4 - G - tx - 14, 20, 13, '', `font-family:${F.grot};font-weight:700;color:${on}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), tx, dated ? 139 : 149, x4 - G - tx - 14, 9, 8, '', `font:700 9pt/1 ${F.sans};letter-spacing:2.4pt;color:${mint}`);
    if(dated) h += X.line('oh.date', dateText(ev), tx, 158, x4 - G - tx - 14, 10, 8, '', `font:600 10pt/1 ${F.sans};color:${on}`);
    // pane 4: the facts, ruled like the set's room sizes box
    h += bw ? box(x4, y3, m + pw - x4, hb - y3, 'border:1.2pt solid #111') : E.fl(x4, y3, 0, hb - y3, 'r', `background:${F.teal2}`);
    const fx = x4 + 16, fw = m + pw - fx - (bw ? 14 : 0);
    facts(L).slice(0, 3).forEach(([, v, k], i) => { const y = y3 + 9 + i * 23;
      if(i) h += box(fx, y - 5, fw, 0, `border-top:.5pt solid ${fHair(bw)}`);
      h += txt(`fact.${i}.k`, k.toUpperCase(), fx, y + 3, fw - 50, `font:700 8pt/9pt ${F.sans};letter-spacing:1.6pt;color:${mint}`);
      h += txt(`fact.${i}`, v, fx + fw - 50, y, 50, `text-align:right;font:800 12pt/14pt ${F.grot};color:${on}`); });
    // the white window: mullions between the columns, the number gutter a lifted pane with mint numerals
    const top = 190, bot = 506, g = 40, bar = bw ? 1 : 5, mull = bw ? '#111' : F.teal;
    h += box(m, top, pw, bot - top, bw ? 'border:1.2pt solid #111' : 'background:#fff');
    if(!bw) h += gutter(m, top, g, bot - top, `background:${F.teal2}`);
    h += table(D, E, {x0: m, W: pw, top, bot, hd: 34, numW: g, label: `font-family:${F.grot};font-weight:800;letter-spacing:1.4pt;color:${tl}`,
      under: (cs, y0) => cs.map(c => box(c.x - bar / 2, top, bar, bot - top, `background:${mull}`)).join('') + box(m, y0 - bar / 2, pw, bar, `background:${mull}`),
      head: () => '', sep: `border-top:.6pt solid ${bw ? 'rgba(0,0,0,.3)' : 'rgba(24,45,45,.34)'}`,
      num: (n, x, y, rh) => `<div class="num" style="left:${x}pt;top:${y + rh / 2 - 12}pt;width:${g - bar / 2}pt;font:800 19pt/24pt ${F.grot};color:${mint}">${n}</div>`,
      over: (cs, y0, rh) => bw ? '' : [1, 2, 3, 4, 5, 6].map(i => box(m + 7, y0 + i * rh, g - 16, 0, `border-top:.6pt solid ${fHair(bw)}`)).join(''),
      yn: `border:1.2pt solid ${tl};color:${tl};font-family:${F.grot};border-radius:0`, vr: false});
    h += foot1(D, FOOT_S, {dark: !bw});
    return h;
  };

  L$['four-windows-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, e = edge(E), m = 40, pw = 532;
    const on = col(E, '#fff'), mint = col(E, F.mint), tl = col(E, F.teal), G = 6, p0 = 24, p1 = 306;
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', `background:${F.teal}`);
    // window 1: the house over the event pane
    const c1 = 180, py = 122, tx = bw ? m + 11 : m, tw = c1 - tx - 11;
    h += bw ? ph(D, E, m, p0, c1 - m, py - p0) : ph(D, E, e, e, c1 - e, py - e);
    h += bw ? box(m, py + G, c1 - m, p1 - py - G, 'border:1.2pt solid #111') : E.fl(0, py + G, c1, p1 - py - G, 'l', `background:${F.teal2}`);
    h += fChip(E, labelLines(ev.label), tx, 137, 8);
    h += X.line('address', L.address, tx, 171, tw, 14.5, 9, '', `font-family:${F.grot};font-weight:800;letter-spacing:-.2pt;color:${on}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), tx, 193, tw, 8, 8, '', `font:700 8pt/1 ${F.sans};letter-spacing:1.2pt;color:${mint}`);
    h += box(tx, 208, tw, 0, `border-top:.5pt solid ${fHair(bw)}`);
    h += X.line('oh.date', ev.long, tx, 215, tw, 10.5, 8, '', `font:700 10.5pt/1 ${F.sans};color:${on}`);
    h += X.line('oh.time', ev.time, tx, 232, tw, 9.5, 8, '', `font:600 9.5pt/1 ${F.sans};color:${mint}`);
    h += box(tx, 250, tw, 0, `border-top:.5pt solid ${fHair(bw)}`);
    factLines(L).slice(0, 3).forEach((t, i) => { h += X.line('fact.' + i, t, tx, 258 + i * 14, tw, 8, 8, '', `font:700 8pt/1 ${F.sans};letter-spacing:1.2pt;color:${on}`); });
    // window 2: price, ratings, the seller question, name and contact
    const o = {sans: F.sans, muted: bw ? '#444' : '#4a5a58', lab: `font:800 8.5pt/1 ${F.grot};letter-spacing:1.3pt;text-transform:uppercase;color:${tl}`,
      pill: `border:1.2pt solid ${tl};color:${tl};font:700 8pt/1 ${F.sans};letter-spacing:.3pt;text-transform:uppercase;border-radius:0`,
      dot: () => `border:1.2pt solid ${tl};color:${tl};font:800 10.5pt/1 ${F.grot};background:#fff`,
      q: `font-family:${F.grot};font-weight:700;color:${tl};`};
    const x2 = c1 + G, w2 = 200, x3 = x2 + w2 + G, w3 = m + pw - x3, wh = bw ? 'border:1.2pt solid #111' : 'background:#fff';
    h += box(x2, p0, w2, p1 - p0, wh);
    h += blkA(D, E, o, x2 + 11, p0 + 11, w2 - 22, true) + blkS(D, E, o, x2 + 11, p0 + 137, w2 - 22, 22);
    // windows 3, 4 and 5: one prompt each
    const hh = (p1 - p0 - 2 * G) / 3;
    [0, 1, 2].forEach(i => { const y = p0 + i * (hh + G); h += box(x3, y, w3, hh, wh) + blkP(D, E, o, i, x3 + 11, y + 2, w3 - 22, 21); });
    h += foot1(D, FOOT_F, {dark: !bw});
    return h;
  };

  /* ======================================= HOUSE IN 360 =======================================
     Deep green field, white serif, pale green caps and hairlines, the house large off a corner, the fold-over's white spec
     board for everything written. Under the address the set's bold caps one-line statement (here the listing's facts);
     the event and facts as the postcard's ruled caps list. Pale green is type and hairlines only. */
  const H = S.house;
  const hHair = bw => bw ? 'rgba(0,0,0,.34)' : 'rgba(169,214,197,.5)';
  const hState = L => factLines(L).join('. ') + '.';
  L$['house-360-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, e = edge(E), m = 48, pw = 696;
    const on = col(E, '#fff'), pale = col(E, H.pale), gr = col(E, H.green);
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', `background:${H.green}`);
    const pr = 330, hb = 178;
    h += bw ? ph(D, E, m, 24, pr - m, hb - 24) : ph(D, E, e, e, pr - e, hb - e);
    const tx = pr + 26, tw = m + pw - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 34, tw, 10, 8, '', `font:700 10pt/1 ${H.sans};letter-spacing:4.2pt;color:${pale}`);
    h += X.line('title', 'Please sign in', tx, 49, tw, 44, 26, '', `font-family:${H.serif};font-weight:400;letter-spacing:-.5pt;color:${on}`);
    h += box(tx, 107, tw, 0, `border-top:.7pt solid ${pale}`);
    h += X.line('address', L.address, tx, 114, tw, 22, 14, '', `font-family:${H.serif};font-weight:500;color:${on}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), tx, 145, dated ? 190 : tw, 9, 8, '', `font:700 9pt/1 ${H.sans};letter-spacing:2.6pt;color:${pale}`);
    if(dated) h += X.line('oh.date', dateText(ev), tx + 196, 144, tw - 196, 10, 8, '', `text-align:right;font:600 10pt/1 ${H.sans};letter-spacing:.3pt;color:${on}`);
    h += X.line('facts', hState(L), tx, 163, tw, 10.5, 8, '', `font:700 10.5pt/1 ${H.sans};letter-spacing:.9pt;color:${on}`);
    // the white board
    const top = 190, bot = 506, g = 44, hd = 32;
    h += box(m, top, pw, bot - top, bw ? 'border:.9pt solid #111' : 'background:#fff');
    h += table(D, E, {x0: m, W: pw, top, bot, hd, numW: g, label: `font-family:${H.sans};font-weight:700;letter-spacing:1.6pt;color:${gr}`,
      head: (cs, y0) => box(m + 10, y0 - 1, pw - 20, 1, `background:${gr}`), from: 10,
      sep: `border-top:.5pt solid ${bw ? 'rgba(0,0,0,.3)' : 'rgba(23,64,58,.3)'}`,
      num: (n, x, y, rh) => `<div class="num" style="left:${x + 6}pt;top:${y + rh / 2 - 13}pt;width:${g - 6}pt;font:500 20pt/26pt ${H.serif};color:${gr}">${n}</div>`,
      yn: `border:.8pt solid ${gr};color:${gr};font-family:${H.sans}`});
    h += foot1(D, FOOT_S, {dark: !bw});
    return h;
  };

  L$['house-360-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, e = edge(E), m = 40, pw = 532;
    const on = col(E, '#fff'), pale = col(E, H.pale), gr = col(E, H.green);
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', `background:${H.green}`);
    // the house off the top right corner, the event under it as the postcard's ruled caps list
    const cx = 412, cw = m + pw - cx, py = 126, p0 = 24, p1 = 306;
    h += bw ? ph(D, E, cx, p0, cw, py - p0) : ph(D, E, cx, e, 612 - e - cx, py - e);
    h += X.line('oh.label', ev.label.toUpperCase(), cx, 137, cw, 8, 8, '', `font:700 8pt/1 ${H.sans};letter-spacing:2.2pt;color:${pale}`);
    h += X.line('address', L.address, cx, 151, cw, 18, 10, '', `font-family:${H.serif};font-weight:500;color:${on}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), cx, 178, cw, 8, 8, '', `font:700 8pt/1 ${H.sans};letter-spacing:1.6pt;color:${pale}`);
    [ev.long, ev.time].concat(factLines(L).slice(0, 3)).forEach((t, i) => { const y = 194 + i * 21;
      h += box(cx, y, cw, 0, `border-top:.6pt solid ${hHair(bw)}`);
      h += X.line(i < 2 ? ['oh.date', 'oh.time'][i] : 'fact.' + (i - 2), t.toUpperCase(), cx, y + 7, cw, 8.5, 8, '', `font:700 8.5pt/1 ${H.sans};letter-spacing:1.3pt;color:${on}`); });
    h += box(cx, 194 + 5 * 21, cw, 0, `border-top:.6pt solid ${hHair(bw)}`);
    // the white board: two columns, a hairline between
    const bx = m, bwid = cx - 12 - m, mid = bx + bwid / 2;
    h += box(bx, p0, bwid, p1 - p0, bw ? 'border:.9pt solid #111' : 'background:#fff');
    h += box(mid, p0 + 12, 0, p1 - p0 - 24, `border-left:.5pt solid ${bw ? 'rgba(0,0,0,.3)' : 'rgba(23,64,58,.3)'}`);
    const o = {sans: H.sans, muted: bw ? '#444' : '#4a5a56', lab: `font:700 8.5pt/1 ${H.sans};letter-spacing:1.4pt;text-transform:uppercase;color:${gr}`,
      pill: `border:.8pt solid ${gr};color:${gr};font:700 8pt/1 ${H.sans};letter-spacing:.3pt;text-transform:uppercase`,
      dot: () => `border:.8pt solid ${gr};color:${gr};font:500 11pt/1 ${H.serif};background:#fff`,
      q: `font-family:${H.serif};font-weight:500;color:${gr};`};
    const iw = bwid / 2 - 22;
    h += blkA(D, E, o, bx + 12, p0 + 12, iw, true) + blkS(D, E, o, bx + 12, p0 + 137, iw, 22);
    [0, 1, 2].forEach(i => { h += blkP(D, E, o, i, mid + 10, p0 + 9 + i * 88, iw, 22); });
    h += foot1(D, FOOT_F, {dark: !bw});
    return h;
  };
})();
