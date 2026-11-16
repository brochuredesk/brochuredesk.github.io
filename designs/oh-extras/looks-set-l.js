/* Open House extras for design sets, batch l (owner 11/15/2026: every set gets its own sign-in sheet and feedback card).
   Sets: connections, split-edition, stepped-gallery, survey-book, vaulted-opening. Round 3 (owner 11/15/2026, one style thread
   through the whole set): a card uses only its set's own shapes, fills, colors and type, bigger and better; the one exception is
   a light writing field on a dark set, drawn in the set's own box language. Rating and price marks are outlined, never filled.
     Connections       slate-teal field; the photo runs off the corner and one sand line drops from it through every row's
                       numbered dot; on the card the same line runs across the three questions
     Split Edition     the page split in two: a burgundy side with the giant house number, the photo and the 2 x 2 facts
                       grid, and the white writing side; the set's maroon italic line
     Stepped Gallery   navy throughout; the house photos step at staggered heights, the heading over the pale-sky rule,
                       only the writing sheet light
     Survey Book       white paper; the double hairline, corner brackets on the photo, dotted rows, plain Spectral numerals,
                       the postcard's steel edge strip and tab
     Vaulted Opening   navy throughout; the photo large in the set's white border and keyline, a white square-cornered
                       writing sheet, serif-numeral facts between hairlines
   The writing area (columns, seven rows, fields and wording, standard footer #1, light grayscale photo in black and white,
   no date on public sign-in sheets) is the approved system. Write-in lines on the cards sit 20.5 pt (0.28 in) apart.
   The body class is the look's first word (extras.js), so the themes below are keyed by it as well as by the set name. */
(function(){
  const X = Extras, L$ = X.looks, esc = X.esc, K = X.lib;
  const {cols, labels, qs, box, txt, ph, foot1, facts} = K;

  // brand colors: Connections takes the agent's accent for its field and Survey Book for its steel (the sets' own flyers do)
  const brandTheme = (D, bw, root) => { const b = D.brand || {}, set = (k, v) => root.setProperty(k, v);
    if(bw || !b.accent) return;
    if(document.body.classList.contains('set-connections')){ set('--field', b.accent); set('--accent', b.accent); }
    if(document.body.classList.contains('set-survey')) set('--accent', b.accent); };
  // Survey Book and Vaulted Opening take no theme here: their approved cards are looks-sets.js (owner 11/16/2026); these drafts are retired
  ['connections', 'split', 'split-edition', 'stepped', 'stepped-gallery'].forEach(s => X.themes[s] = brandTheme);

  const yearOf = L => L.yearBuilt || L.year_built || '';
  const lastFact = L => yearOf(L) ? `Built in ${yearOf(L)}` : L.stories ? `${L.stories} ${Number(L.stories) === 1 ? 'Story' : 'Stories'}` : '';
  const fact4 = L => { const f = facts(L).map(([, v, k]) => [v, k]); if(L.stories) f.push([String(L.stories), Number(L.stories) === 1 ? 'Story' : 'Stories']); else if(yearOf(L)) f.push([String(yearOf(L)), 'Year Built']); return f.slice(0, 4); };
  const factLines = L => { const f = facts(L).map(([, v, k]) => `${v} ${k}`); if(lastFact(L)) f.push(lastFact(L)); return f.slice(0, 4); };
  const eg = E => E.home ? 18 : -9;                 // where color that runs off the sheet stops
  // the black-and-white cards carry the black logo colorway (brand.logos.black), never a greyed color logo
  const fD = (D, E) => { const k = E.bw && D.brand && D.brand.logos && D.brand.logos.black;
    return k ? Object.assign({}, D, {brand: Object.assign({}, D.brand, {logo: k, logoOnDark: k})}) : D; };
  // the house photo in a box whose named sides run off the sheet
  const phB = (D, E, x0, y0, x1, y1, sides, extra) => { const e = eg(E);
    if(sides.includes('l')) x0 = e; if(sides.includes('t')) y0 = e; if(sides.includes('r')) x1 = E.W - e; if(sides.includes('b')) y1 = E.H - e;
    return ph(D, E, x0, y0, x1 - x0, y1 - y0, extra); };
  const numSplit = a => { const m = /^\s*(\d+[A-Za-z]?)\s+(.+)$/.exec(a || ''); return m ? [m[1], m[2]] : ['', a || '']; };
  const attr = (html, a) => html.replace('<div class="abs', `<div ${a} class="abs`);   // an attribute on a part's outer box (data-follow, data-vgroup)
  const shortFacts = L => facts(L).map(([, v, k]) => `${v} ${k === 'Square Feet' ? 'Sq Ft' : k}`).join('  ·  ');
  const BWO = 'outline:.9pt solid #111;outline-offset:-.9pt';

  /* ---- the sign-in writing area: label row, seven roomy rows, a divider at every column; o shapes each look ---- */
  const ledger = (E, o) => {
    const W = o.W, nw = o.numW, yn = 108, rest = W - nw - yn, n1 = Math.round(rest * .37), n2 = Math.round(rest * .34);
    const cs = cols(o.x0, nw, [n1, n2, yn, rest - n1 - n2]), d = o.ynD || 20, vp = o.vPad == null ? 4 : o.vPad;
    const bx = o.bx == null ? o.x0 : o.bx, bwid = o.bw == null ? W : o.bw;
    let h = (o.pre ? o.pre(cs) : '') + labels(cs, o.ly, o.lh, o.lab) + (o.head || '');
    for(let i = 0; i < 7; i++){
      const y = o.y0 + i * o.rh;
      if(o.band && o.band(i)) h += `<div class="rowband" style="left:${bx}pt;top:${y}pt;width:${bwid}pt;height:${o.rh}pt;background:${o.tint || 'var(--tint)'}"></div>`;
    }
    for(let i = 0; i < 7; i++){
      const y = o.y0 + i * o.rh;
      h += o.num(E.first + i, i, y, o.rh);
      if(i < 6) h += box(bx, y + o.rh, bwid, 0, o.sep || 'border-top:.5pt solid var(--line)');
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - d - 3, y + o.rh / 2 - d / 2, d, o.yn); });
    }
    cs.forEach((c, i) => { if(i || !o.noFirst) h += `<div class="vrule" style="left:${c.x}pt;top:${o.y0 + vp}pt;height:${7 * o.rh - 2 * vp}pt;${o.vr || ''}"></div>`; });
    return h;
  };

  /* ---- the feedback card's parts: write-in lines 20.5 pt (0.28 in) apart; s carries each look's styles ---- */
  const LS = 20.5;
  const wl = (x, y, w, n, style) => Array.from({length: n}, (_, i) => X.wline(x, y + i * LS, w, style)).join('');
  const pills = (FB, x, y, w, hgt, style, gap) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;display:flex;gap:${gap == null ? 6 : gap}pt">` +
    FB.choices.map(c => `<span class="pill" style="flex:1 1 0;min-width:0;height:${hgt}pt;${style}">${c}</span>`).join('') + '</div>';
  // price, the two 1-5 rows and the note under them (height 110)
  const rate = (FB, x, y, w, s) => { const d = s.d || 18, dw = 5 * d + 4 * 4, lw = w - dw;
    return s.lab('q.price', FB.price, x, y, w) + pills(FB, x, y + 12, w, 22, s.pill + ';text-transform:none;font-size:8.5pt;letter-spacing:.2pt', s.gap) +
      s.lab('q.cond', FB.cond, x, y + 48 + d / 2 - 4, lw - 6, s.rls == null ? .5 : s.rls) + X.dots(x + lw, y + 48, dw, d, s.dot) +
      s.lab('q.shows', FB.shows, x, y + 76 + d / 2 - 4, lw - 6, s.rls == null ? .5 : s.rls) + X.dots(x + lw, y + 76, dw, d, s.dot) +
      txt('q.scale', FB.scale, x + lw, y + 100, w - lw, `text-align:right;font-size:8pt;line-height:10pt;color:var(--muted);${s.scale || ''}`); };
  // the seller question with its two lines (height 55)
  const seller = (FB, x, y, w, s) => X.line('q.seller', FB.seller, x, y, w, s.qs, 8, '', s.qstyle) + wl(x, y + 34, w, 2, s.wl);
  const who = (FB, k, x, y, w, s) => s.lab('q.' + k, FB[k], x, y, w) + X.wline(x, y + 22, w, s.wl);
  // one guided question with its three lines (height 74)
  const prompt = (FB, i, x, y, w, s) => X.line('q.' + FB.prompts[i][0], FB.prompts[i][1], x, y, w, s.qs, 8, '', s.qstyle) + wl(x, y + 33, w, 3, s.wl);
  // the left column of a two-column card: everything but the three guided questions (height 250)
  const colA = (FB, x, y, w, s) => rate(FB, x, y, w, s) + seller(FB, x, y + 122, w, s) + who(FB, 'name', x, y + 192, w, s) + who(FB, 'contact', x, y + 226, w, s);
  const colB = (FB, x, y, w, s, pitch) => [0, 1, 2].map(i => prompt(FB, i, x, y + i * (pitch || 90), w, s)).join('');

  /* ================================ CONNECTIONS ================================
     Slate-teal field, sand tracked caps, Cormorant. The set strings its rooms on a sand line with a dot at each photo. Here
     the house photo runs off the corner and is the first dot: one sand line drops from it down the field and through every
     row's numbered dot. On the card the line runs across, a dot over each of the three questions. */
  const CN = {d: "'Cormorant Garamond',Georgia,serif", s: "'Karla',Helvetica,Arial,sans-serif"};
  const cnPath = (x, y, E) => { const c = E.bw ? 'var(--ink)' : 'var(--sand)';
    return box(x, y, 6, 6, `background:${c};border-radius:50%`) + box(x + 10, y + 2.6, 44, .8, `background:${c};opacity:.7`) + box(x + 58, y, 6, 6, `background:${c};border-radius:50%`) +
      box(x + 68, y + 2.6, 44, .8, `background:${c};opacity:.7`) + box(x + 116, y, 6, 6, `background:${c};border-radius:50%`); };
  // the flyer's facts stack: right-aligned tracked caps between sand hairlines
  const cnStack = (L, x, y, w, rh, E, size) => factLines(L).map((t, i) => (i ? box(x, y + i * rh, w, 0, `border-top:.6pt solid ${E.bw ? 'var(--ink)' : 'var(--sand)'};opacity:.5`) : '') +
      X.line(`oh.facts${i}`, t.toUpperCase(), x, y + i * rh + (rh - size) / 2 + 1, w, size, 8, '', `font-family:${CN.s};font-weight:600;letter-spacing:1.3pt;text-align:right;color:${E.bw ? 'var(--ink)' : 'var(--on)'}`)).join('');

  L$['connections-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 40, pw = 712;
    const hi = bw ? 'var(--ink)' : 'var(--on)', sa = bw ? 'var(--ink)' : 'var(--sand)';
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', 'background:var(--field)');
    // the house runs off the top left corner; it is the first dot on the line
    const pr = 306, pb = 186, nx = 58;
    h += phB(D, E, 0, 0, pr, pb, 'lt', bw ? BWO : '');
    const tx = 332, tw = 258;
    if(dated){
      h += X.line('oh.label', ev.label.toUpperCase(), tx, 32, tw, 10.5, 8, '', `font-family:${CN.s};font-weight:600;letter-spacing:4pt;color:${sa}`);
      h += X.line('title', 'Please sign in', tx - 1, 45, tw, 42, 30, '', `font-family:${CN.d};font-weight:600;letter-spacing:-.4pt;color:${hi};line-height:48pt`);
      h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, tx, 97, tw, 16, 11, '', `font-family:${CN.d};font-weight:600;color:${sa}`);
      h += cnPath(tx, 125, E);
      h += X.line('address', L.address, tx - 1, 135, tw, 24, 16, '', `font-family:${CN.d};font-weight:600;color:${hi}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), tx, 168, tw, 8.5, 8, '', `font-family:${CN.s};font-weight:600;letter-spacing:2.2pt;color:${sa}`);
    } else {
      h += X.line('oh.label', ev.label.toUpperCase(), tx, 38, tw, 11, 8, '', `font-family:${CN.s};font-weight:600;letter-spacing:4.2pt;color:${sa}`);
      h += X.line('title', 'Please sign in', tx - 1, 54, tw, 46, 32, '', `font-family:${CN.d};font-weight:600;letter-spacing:-.5pt;color:${hi};line-height:54pt`);
      h += cnPath(tx, 120, E);
      h += X.line('address', L.address, tx - 1, 133, tw, 26, 16, '', `font-family:${CN.d};font-weight:600;color:${hi}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), tx, 168, tw, 8.5, 8, '', `font-family:${CN.s};font-weight:600;letter-spacing:2.2pt;color:${sa}`);
    }
    h += cnStack(L, 612, 44, 140, 33, E, 9.5);
    // the paper writing area; its numbers sit out on the field, strung on the line from the photo
    const top = 204, bot = 506, sx = 84, W = m + pw - sx, y0 = 240, rh = 37.6, cy = i => y0 + i * rh + rh / 2;
    // (the line is drawn node to node: it never runs behind a numeral)
    h += box(nx - .6, pb, 1.2, cy(0) - 12.5 - pb, `background:${sa}`) + [0, 1, 2, 3, 4, 5].map(i => box(nx - .6, cy(i) + 12.5, 1.2, rh - 25, `background:${sa}`)).join('') + box(nx - 4.5, pb - 4.5, 9, 9, `background:${sa};border-radius:50%`);
    h += box(sx, top, W, bot - top, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--paper)');
    h += ledger(E, {x0: sx, W, numW: 12, noFirst: true, ly: top + 10, lh: 21, y0, rh, lab: `font-family:${CN.s};font-weight:700;font-size:8.5pt;letter-spacing:1.5pt;color:var(--field);align-items:center`,
      head: box(sx + 10, y0 - 1.4, W - 20, 1.4, 'background:var(--field)'), band: i => i % 2 === 0, bx: sx + 10, bw: W - 20, yn: `border:.9pt solid var(--field);color:var(--field);font-family:${CN.s}`,
      num: (n, i) => `<div class="abs" style="left:${nx - 12.5}pt;top:${cy(i) - 12.5}pt;width:25pt;height:25pt;border-radius:50%;border:1.3pt solid ${sa};background:${bw ? '#fff' : 'var(--field)'};color:${hi};font:600 14pt/22pt ${CN.d};text-align:center">${n}</div>`});
    h += box(sx + 10, y0 + 7 * rh, W - 20, 0, 'border-top:.8pt solid var(--field)');
    h += foot1(fD(D, E), [m, 516, pw, 58], {dark: !bw});
    return h;
  };

  L$['connections-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), FB = qs(D), bw = E.bw, m = 28, pw = 556;
    const hi = bw ? 'var(--ink)' : 'var(--on)', sa = bw ? 'var(--ink)' : 'var(--sand)', fd = 'var(--field)';
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', 'background:var(--field)');
    // the house off the top right corner, the address and day right-aligned under it (the set sets its facts flush right)
    const px = 440, rw = 584 - px;
    h += phB(D, E, px, 0, 612, 126, 'tr', bw ? BWO : '');
    h += X.line('oh.label', ev.label.toUpperCase(), px, 135, rw, 8, 8, '', `font-family:${CN.s};font-weight:600;letter-spacing:1.9pt;text-align:right;color:${sa}`);
    h += X.line('address', L.address, px, 146, rw, 20, 13, '', `font-family:${CN.d};font-weight:600;text-align:right;color:${hi};letter-spacing:-.2pt`);
    h += X.line('place', X.cityZip(L).toUpperCase(), px, 172, rw, 8, 8, '', `font-family:${CN.s};font-weight:600;letter-spacing:1.4pt;text-align:right;color:${sa}`);
    h += X.line('oh.date', `${ev.wd3}, ${ev.mon3} ${ev.day}  ·  ${ev.time}`, px, 184, rw, 8.5, 8, '', `font-family:${CN.s};font-weight:600;letter-spacing:.3pt;text-align:right;color:${hi}`);
    const lab = (s, t, x, y, w, ls) => txt(s, t, x, y, w, `font:700 8.5pt/1 ${CN.s};letter-spacing:${ls == null ? 1.2 : ls}pt;text-transform:uppercase;color:${fd}`);
    const S = {lab, pill: `border:.9pt solid var(--sandd);color:${fd};font:700 8pt/1 ${CN.s};border-radius:0`,
      dot: () => `border:1pt solid var(--sandd);color:${fd};font:600 11.5pt/1 ${CN.d}`,
      qs: 11.5, qstyle: `font-family:${CN.d};font-weight:600;color:var(--ink)`, wl: ''};
    const sheet = (x, y, w, hgt) => box(x, y, w, hgt, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--paper)');
    // the first sheet: the ratings and the seller question
    h += sheet(m, 28, 400, 166);
    h += rate(FB, 40, 37, 196, S) + who(FB, 'name', 40, 157, 196, S);
    h += box(246, 40, 0, 142, 'border-left:.5pt solid var(--line)');
    h += seller(FB, 256, 58, 160, S) + who(FB, 'contact', 256, 157, 160, S);
    // the line, a dot over each question
    const qw = 164, qg = 16, qx = i => 42 + i * (qw + qg);
    h += box(m, 201.4, pw, 1.2, `background:${sa}`) + [0, 1, 2].map(i => box(qx(i), 198, 8, 8, `background:${sa};border-radius:50%`)).join('');
    h += sheet(m, 210, pw, 96);
    [0, 1, 2].forEach(i => { h += prompt(FB, i, qx(i), 219, qw, S); if(i) h += box(qx(i) - qg / 2, 222, 0, 74, 'border-left:.5pt solid var(--line)'); });
    h += foot1(fD(D, E), [m, 312, pw, 58], {dark: !bw});
    return h;
  };

  /* ================================ SPLIT EDITION ================================
     Source Serif over Albert Sans, burgundy. The set splits its page and opens with a giant serif house number over the street
     name. Here the burgundy side is solid: the giant number, the street, the photo across its full width and the 2 x 2 facts
     grid crossed by hairlines; the writing side is white under a rose header band with a heavy burgundy rule. */
  const SP = {d: "'Source Serif 4',Georgia,serif", s: "'Albert Sans',Helvetica,Arial,sans-serif"};
  const spC = bw => bw ? {on: 'var(--ink)', soft: 'var(--ink)', rule: '#111', tagBg: '#111', tagInk: '#fff'} : {on: '#fff', soft: 'var(--pink)', rule: 'rgba(255,255,255,.42)', tagBg: 'transparent', tagInk: '#fff'};
  const spTag = (t, x, y, C, size) => `<div class="abs nowrap" data-slot="oh.label" style="left:${C.tagBg === 'transparent' ? x - 7 : x}pt;top:${y}pt;padding:3.5pt 7pt 3pt;background:${C.tagBg};color:${C.tagInk};font:700 ${size}pt/${size + 1.5}pt ${SP.s};letter-spacing:1.4pt">${esc(t.toUpperCase())}</div>`;
  const spHouse = (L, x, y, w, C, big, st) => { const [no, street] = numSplit(L.address);
    return no ? X.line('address.no', no, x - 2, y, w, big, big * .6, '', `font-family:${SP.d};font-weight:500;color:${C.on};letter-spacing:-1.5pt;line-height:${big}pt`) +
        X.line('address', street, x, y + big + 2, w, st, st * .65, '', `font-family:${SP.d};font-weight:500;color:${C.on}`)
      : X.line('address', L.address, x, y + big - st * 1.2, w, st * 1.2, st * .65, '', `font-family:${SP.d};font-weight:500;color:${C.on}`); };
  const spGrid = (D, x, y, w, hgt, C, num) => {
    const f = fact4(D.listing), cw = w / 2, rh = hgt / 2; let h = '';
    f.forEach(([v, k], i) => { const cx = x + (i % 2) * cw, cy = y + Math.floor(i / 2) * rh, pad = i % 2 ? 14 : 0;
      h += txt(`fact.${i}`, v, cx + pad, cy + rh / 2 - num * .8, cw - pad - 4, `font:500 ${num}pt/${num + 3}pt ${SP.d};color:${C.on}`) + txt(`fact.${i}.k`, k, cx + pad, cy + rh / 2 + num * .42, cw - pad - 4, `font:600 8pt/10pt ${SP.s};letter-spacing:1.4pt;text-transform:uppercase;color:${C.soft}`); });
    return h + box(x + cw, y + 5, 0, hgt - 10, `border-left:.8pt solid ${C.rule}`) + box(x, y + rh, w, 0, `border-top:.8pt solid ${C.rule}`);
  };

  L$['split-edition-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, PW = 236, cx = 40, cw = PW - cx - 16, BASE = 506, e = eg(E), C = spC(bw);
    const ac = bw ? '#111' : 'var(--accent)';
    let h = bw ? box(PW - 1.4, e, 0, BASE - e, 'border-left:1.4pt solid #111') : E.fl(0, 0, PW, BASE, 'lt', 'background:var(--accent)');
    h += E.fl(0, BASE, 792, 2.2, 'lr', `background:${ac}`);
    // the burgundy side: the house
    h += spTag(ev.label, cx, 30, C, 8);
    h += spHouse(L, cx, 52, cw, C, 76, 21);
    h += X.line('place', X.cityZip(L).toUpperCase(), cx, 160, cw, 8.5, 8, '', `font-family:${SP.s};font-weight:600;letter-spacing:1.6pt;color:${C.soft}`);
    if(dated){
      h += X.line('oh.date', ev.long, cx, 178, cw, 13, 9, '', `font-family:${SP.d};font-weight:600;color:${C.on}`);
      h += X.line('oh.time', ev.time, cx, 197, cw, 9, 8, '', `font-family:${SP.s};font-weight:600;letter-spacing:.6pt;color:${C.soft}`);
    }
    const py = dated ? 218 : 184, phh = dated ? 136 : 152;
    h += ph(D, E, e, py, PW - e - (bw ? 1.4 : 0), phh);
    const gy = py + phh + 6, gh = BASE - 10 - gy;
    h += spGrid(D, cx, gy, cw, gh, C, 24);
    // the writing side
    const x0 = PW + 22, W = 752 - x0, y0 = 119, rh = 54;
    h += X.line('title', 'Please sign in', x0 - 1, 28, 330, 40, 28, '', `font-family:${SP.d};font-weight:500;color:${ac};letter-spacing:-.6pt;line-height:48pt`);
    h += box(x0, 82, 44, 2.4, `background:${ac}`);
    h += txt('thanks', 'Welcome, and thank you for visiting.', 752 - 230, 50, 230, `font:400 italic 13pt/17pt ${SP.d};text-align:right;color:${ac}`);
    h += box(x0, 92, W, 24.8, `background:${bw ? '#111' : 'var(--soft)'}`);
    h += ledger(E, {x0, W, numW: 40, ly: 94, lh: 19, y0, rh, lab: `font-family:${SP.s};font-weight:700;font-size:8.5pt;letter-spacing:1.2pt;color:${bw ? '#fff' : 'var(--accent)'};align-items:flex-end`,
      head: box(x0, 116.8, W, 2.2, `background:${ac}`), band: i => i % 2 === 1, yn: `border:.9pt solid ${ac};color:${ac};font-family:${SP.s}`,
      num: (n, i, y, r) => txt('', String(n), x0 + 2, y + r / 2 - 12, 34, `font:500 20pt/24pt ${SP.d};text-align:center;color:${ac}`)});
    h += box(x0, y0 + 7 * rh, W, 0, `border-top:.8pt solid ${ac}`);
    h += foot1(fD(D, E), [40, 516, 712, 58]);
    return h;
  };

  L$['split-edition-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), FB = qs(D), bw = E.bw, m = 28, pw = 556, PW = 168, cx = 28, cw = PW - cx - 10, BASE = 302, e = eg(E), C = spC(bw);
    const ac = bw ? '#111' : 'var(--accent)';
    let h = bw ? box(PW - 1.4, e, 0, BASE - e, 'border-left:1.4pt solid #111') : E.fl(0, 0, PW, BASE, 'lt', 'background:var(--accent)');
    h += E.fl(0, BASE, 612, 2.2, 'lr', `background:${ac}`);
    h += spTag(ev.label, cx, 27, C, 8);
    h += spHouse(L, cx, 46, cw, C, 48, 15.5);
    h += X.line('place', X.cityZip(L).toUpperCase(), cx, 119, cw, 8, 8, '', `font-family:${SP.s};font-weight:600;letter-spacing:1.3pt;color:${C.soft}`);
    h += ph(D, E, e, 136, PW - e - (bw ? 1.4 : 0), 102);
    h += X.line('oh.date', ev.long, cx, 249, cw, 12, 8.5, '', `font-family:${SP.d};font-weight:600;color:${C.on}`);
    h += X.line('oh.time', ev.time, cx, 268, cw, 8.5, 8, '', `font-family:${SP.s};font-weight:600;letter-spacing:.5pt;color:${C.soft}`);
    const lab = (s, t, x, y, w, ls) => txt(s, t, x, y, w, `font:700 8.5pt/1 ${SP.s};letter-spacing:${ls == null ? 1.2 : ls}pt;text-transform:uppercase;color:${ac}`);
    const S = {lab, pill: `border:.9pt solid ${ac};color:var(--ink);font:600 8pt/1 ${SP.s};border-radius:0`,
      dot: () => `border:.9pt solid ${ac};color:var(--ink);font:500 11pt/1 ${SP.d}`,
      qs: 11, qstyle: `font-family:${SP.d};font-weight:500;color:var(--ink)`, wl: ''};
    h += colA(FB, 186, 24, 192, S);
    h += txt('thanks', 'Thank you for your feedback.', 186, 280, 192, `font:400 italic 11.5pt/14pt ${SP.d};color:${ac}`);
    h += box(388, 28, 0, 262, `border-left:1.2pt solid ${ac}`);
    h += colB(FB, 398, 28, 186, S);
    h += foot1(fD(D, E), [m, 310, pw, 58]);
    return h;
  };

  /* ================================ STEPPED GALLERY ================================
     Lora over Nunito Sans; ink navy on every piece, pale sky for type and rules only, photos that step down the page at
     staggered heights. Here the navy runs through the header and footer, the house photos step (the first off the corner,
     the second set lower), the heading sits over the set's pale-sky rule, and only the writing sheet is light (the
     postcard's mail-panel tint), square-cornered like every frame in the set. */
  const SG = {d: "'Lora',Georgia,serif", s: "'Nunito Sans',Helvetica,Arial,sans-serif"};
  const sgSheet = (x, y, w, hgt, bw) => box(x, y, w, hgt, bw ? 'border:.9pt solid #111' : 'background:var(--paper)');
  const has2 = D => !!(D.photos && D.photos.front2 && D.photos.front2.src);
  const ph2 = (D, E, x, y, w, hgt, extra) => { const s = X.photo(D, 'front2', x, y, w, hgt, extra); return E.bw ? s.replace('class="photo"', 'class="photo light"') : s; };

  L$['stepped-gallery-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 40, pw = 712, two = has2(D);
    const hi = bw ? 'var(--ink)' : '#fff', sk = bw ? 'var(--ink)' : 'var(--sky)';
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', 'background:var(--field)');
    // the photos step: the first runs off the corner, the second starts lower
    h += phB(D, E, 0, 0, two ? 292 : 336, 178, 'lt', bw ? BWO : '');
    if(two) h += ph2(D, E, 302, 62, 184, 138, bw ? BWO : '');
    const tx = two ? 508 : 364, tw = m + pw - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 70, tw, 9, 8, '', `font-family:${SG.s};font-weight:700;letter-spacing:2.4pt;color:${sk}`);
    h += X.line('title', 'Please sign in', tx - 1, 84, tw, 32, 22, '', `font-family:${SG.d};font-weight:600;color:${hi};letter-spacing:-.4pt;line-height:40pt`);
    h += box(tx, 130, tw, 0, `border-top:1pt solid ${sk}`);
    h += X.line('address', L.address, tx - 1, 137, tw, 17, 11, '', `font-family:${SG.d};font-weight:600;color:${hi};letter-spacing:-.2pt`);
    h += X.line('place', X.cityZip(L).toUpperCase(), tx, 163, tw, 8, 8, '', `font-family:${SG.s};font-weight:700;letter-spacing:1.4pt;color:${sk}`);
    if(dated) h += X.line('oh.date', `${ev.wd3}, ${ev.mon3} ${ev.day}  ·  ${ev.time}`, tx, 177, tw, 9, 8, '', `font-family:${SG.s};font-weight:700;letter-spacing:.3pt;color:${hi}`);
    h += X.line('oh.facts', shortFacts(L).toUpperCase(), tx, dated ? 191 : 180, tw, 8, 8, '', `font-family:${SG.s};font-weight:700;letter-spacing:.4pt;color:${hi}`);
    // the light writing sheet
    const top = 214, bot = 508, y0 = 248, rh = 36.6;
    h += sgSheet(m, top, pw, bot - top, bw);
    h += ledger(E, {x0: m, W: pw, numW: 44, ly: top + 8, lh: 21, y0, rh, lab: `font-family:${SG.s};font-weight:700;font-size:8.5pt;letter-spacing:1.4pt;color:var(--ink);align-items:flex-end`,
      head: box(m + 10, y0 - 3, pw - 20, 1.6, 'background:var(--ink)'), band: i => i % 2 === 1, bx: m + 10, bw: pw - 20, yn: `border:.9pt solid var(--ink);color:var(--ink);font-family:${SG.s};border-radius:0`,
      num: (n, i, y, r) => txt('', String(n), m + 8, y + r / 2 - 10, 32, `font:600 15pt/20pt ${SG.d};text-align:center;color:var(--ink)`)});
    h += foot1(fD(D, E), [m, 516, pw, 58], {dark: !bw});
    return h;
  };

  L$['stepped-gallery-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), FB = qs(D), bw = E.bw, m = 28, pw = 556, two = has2(D);
    const hi = bw ? 'var(--ink)' : '#fff', sk = bw ? 'var(--ink)' : 'var(--sky)';
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', 'background:var(--field)');
    // the photos step down the left side; the address and the day under them
    const cw = 148;
    if(two) h += phB(D, E, 0, 0, 150, 112, 'lt', bw ? BWO : '') + ph2(D, E, 44, 120, 132, 80, bw ? BWO : '');
    else { h += phB(D, E, 0, 0, 176, 124, 'lt', bw ? BWO : '');
      factLines(L).slice(0, 3).forEach((t, i) => { h += (i ? box(m, 136 + i * 21, cw, 0, `border-top:.6pt solid ${sk};opacity:.6`) : '') + X.line(`oh.facts${i}`, t.toUpperCase(), m, 142 + i * 21, cw, 8, 8, '', `font-family:${SG.s};font-weight:700;letter-spacing:1pt;color:${hi}`); }); }
    h += X.line('oh.label', ev.label.toUpperCase(), m, 210, cw, 8, 8, '', `font-family:${SG.s};font-weight:700;letter-spacing:.9pt;color:${sk}`);
    h += X.line('address', L.address, m - 1, 221, cw + 1, 15, 10, '', `font-family:${SG.d};font-weight:600;color:${hi};letter-spacing:-.2pt`);
    h += X.line('place', X.cityZip(L).toUpperCase(), m, 243, cw, 8, 8, '', `font-family:${SG.s};font-weight:700;letter-spacing:.9pt;color:${sk}`);
    h += box(m, 257, cw, 0, `border-top:.8pt solid ${sk}`);
    h += X.line('oh.date', ev.long, m - 1, 263, cw + 1, 11.5, 8.5, '', `font-family:${SG.d};font-weight:600;color:${hi}`);
    h += X.line('oh.time', ev.time, m, 281, cw, 8.5, 8, '', `font-family:${SG.s};font-weight:700;color:${sk}`);
    // the light writing sheet
    h += sgSheet(188, 28, 396, 274, bw);
    const lab = (s, t, x, y, w, ls) => txt(s, t, x, y, w, `font:700 8.5pt/1 ${SG.s};letter-spacing:${ls == null ? 1.1 : ls}pt;text-transform:uppercase;color:var(--ink)`);
    const S = {lab, d: 17, rls: .1, pill: `border:.9pt solid var(--ink);color:var(--ink);font:700 8pt/1 ${SG.s};border-radius:0`,
      dot: () => `border:.9pt solid var(--ink);color:var(--ink);font:600 10.5pt/1 ${SG.d}`,
      qs: 10.5, qstyle: `font-family:${SG.d};font-weight:600;color:var(--ink)`, wl: ''};
    h += colA(FB, 198, 37, 180, S);
    h += box(387, 38, 0, 254, 'border-left:.5pt solid var(--line)');
    h += colB(FB, 396, 37, 178, S, 88);
    h += foot1(fD(D, E), [m, 312, pw, 58], {dark: !bw});
    return h;
  };

  /* ================================ SURVEY BOOK ================================
     Spectral over IBM Plex Sans on white paper, steel blue. The set's own marks, bigger: the double hairline under headings,
     the two corner brackets on the photo, dotted leader rows, plain Spectral numerals, and the postcard's color (the steel
     edge strip across the top and its plain steel tab running off the right edge). */
  const SB = {d: "'Spectral',Georgia,serif", s: "'IBM Plex Sans',Helvetica,Arial,sans-serif"};
  const sbDouble = (x, y, w, c) => box(x, y, w, 0, `border-top:.9pt solid ${c}`) + box(x, y + 3, w, 0, `border-top:.9pt solid ${c}`);
  // the set's corner marks: a bracket at the photo's top left and bottom right, 5 pt off it
  const sbBr = (x, y, w, hgt, c) => box(x - 5, y - 5, 13, 13, `border-left:1.6pt solid ${c};border-top:1.6pt solid ${c}`) + box(x + w - 8, y + hgt - 8, 13, 13, `border-right:1.6pt solid ${c};border-bottom:1.6pt solid ${c}`);
  const sbFacts = (L, x, y, w, rh, rule, n) => factLines(L).slice(0, n || 4).map((t, i, a) => X.line(`fact.${i}`, t.toUpperCase(), x, y + i * rh + (rh - 11) / 2, w, 9, 8, '', `font-family:${SB.s};font-weight:600;letter-spacing:1.3pt;color:var(--ink)`) + (i < a.length - 1 ? box(x, y + (i + 1) * rh, w, 0, `border-top:.9pt dotted ${rule}`) : '')).join('');

  L$['survey-book-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 40, pw = 712;
    const ac = bw ? '#111' : 'var(--accent)';
    let h = E.fl(0, 0, 792, 27, 'ltr', `background:${ac}`) + E.fl(716, 46, 76, 78, 'r', `background:${ac}`);
    // the house, large, with its corner marks
    const px = 46, py = 48, pwid = 240, phh = 146;
    h += sbBr(px, py, pwid, phh, ac) + ph(D, E, px, py, pwid, phh);
    const tx = 316, tw = 700 - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 46, tw, 9.5, 8, '', `font-family:${SB.s};font-weight:700;letter-spacing:2.8pt;color:${ac}`);
    h += X.line('title', 'Please sign in', tx - 1, 58, tw, 42, 28, '', `font-family:${SB.d};font-weight:700;letter-spacing:-.5pt;color:var(--ink);line-height:50pt`);
    h += sbDouble(tx, 114, tw, ac);
    h += X.line('address', L.address, tx - 1, 124, 204, 21, 14, '', `font-family:${SB.d};font-weight:600;color:var(--ink)`);
    h += X.line('place', X.cityZip(L).toUpperCase(), tx, 154, 204, 8.5, 8, '', `font-family:${SB.s};font-weight:600;letter-spacing:2pt;color:${ac}`);
    if(dated) h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, tx, 173, 204, 10, 8, '', `font-family:${SB.s};font-weight:600;letter-spacing:.3pt;color:var(--ink)`);
    h += sbFacts(L, 540, 122, 160, 18, ac);
    // the book's page: steel caps over the double hairline, dotted rows, plain numerals
    const y0 = 240, rh = 37.4;
    h += ledger(E, {x0: m, W: pw, numW: 44, ly: 206, lh: 21, y0, rh, lab: `font-family:${SB.s};font-weight:700;font-size:8.5pt;letter-spacing:1.3pt;color:${ac};align-items:flex-end`,
      head: sbDouble(m, 232, pw, ac), band: i => i % 2 === 1, sep: `border-top:.9pt dotted ${ac}`, yn: `border:.9pt solid ${ac};color:${ac};font-family:${SB.s};border-radius:0`,
      num: (n, i, y, r) => txt('', String(n), m + 6, y + r / 2 - 10, 32, `font:600 15pt/20pt ${SB.d};text-align:center;color:var(--ink)`)});
    h += sbDouble(m, y0 + 7 * rh + 3, pw, ac);
    h += foot1(fD(D, E), [m, 518, pw, 58]);
    return h;
  };

  L$['survey-book-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), FB = qs(D), bw = E.bw, m = 28, pw = 556;
    const ac = bw ? '#111' : 'var(--accent)';
    let h = E.fl(0, 0, 612, 26, 'ltr', `background:${ac}`);
    // the right column: the house with its corner marks, the address, the facts, the day on the steel tab
    const px = 444, pwid = 140, py = 40, phh = 86;
    h += sbBr(px, py, pwid, phh, ac) + ph(D, E, px, py, pwid, phh);
    h += X.line('oh.label', ev.label.toUpperCase(), px, 137, pwid, 8, 8, '', `font-family:${SB.s};font-weight:700;letter-spacing:1.2pt;color:${ac}`);
    h += X.line('address', L.address, px - 1, 148, pwid + 1, 16, 11, '', `font-family:${SB.d};font-weight:700;color:var(--ink);letter-spacing:-.3pt`);
    h += X.line('place', X.cityZip(L).toUpperCase(), px, 171, pwid, 8, 8, '', `font-family:${SB.s};font-weight:600;letter-spacing:1.2pt;color:${ac}`);
    h += sbDouble(px, 186, pwid, ac);
    h += sbFacts(L, px, 191, pwid, 18, ac, 3);
    h += E.fl(px, 252, 612 - px, 50, 'r', `background:${ac}`);
    h += X.line('oh.date', ev.long, px + 10, 259, pwid - 14, 12, 8.5, '', `font-family:${SB.d};font-weight:600;color:#fff`);
    h += X.line('oh.time', ev.time, px + 10, 280, pwid - 14, 8.5, 8, '', `font-family:${SB.s};font-weight:600;letter-spacing:.4pt;color:#fff`);
    const lab = (s, t, x, y, w, ls) => txt(s, t, x, y, w, `font:700 8.5pt/1 ${SB.s};letter-spacing:${ls == null ? 1.1 : ls}pt;text-transform:uppercase;color:${ac}`);
    const dotted = `border-top:.9pt dotted ${ac}`;
    const S = {lab, gap: 4, pill: `border:.9pt solid ${ac};color:var(--ink);font:600 8pt/1 ${SB.s};border-radius:0`,
      dot: () => `border:.9pt solid ${ac};color:var(--ink);font:600 10.5pt/1 ${SB.d}`,
      qs: 10.5, qstyle: `font-family:${SB.d};font-weight:600;color:var(--ink)`, wl: dotted};
    h += colA(FB, m, 40, 190, S);
    h += box(229, 40, 0, 254, `border-left:.9pt dotted ${ac}`);
    h += colB(FB, 240, 40, 186, S, 88);
    h += foot1(fD(D, E), [m, 310, pw, 58]);
    return h;
  };

  /* ================================ VAULTED OPENING ================================
     DM Serif Display over DM Sans; midnight navy on every piece, white type and keylines, the set's pale-blue accent
     (#b7c7e6), no curves anywhere. The photo sits large in the set's frame (a white border with a thin white keyline set off
     it); the header and footer are navy; only the writing sheet is white, square-cornered like the postcard's mail panel;
     facts are a serif numeral over a tracked label between hairlines. */
  const VO = {d: "'DM Serif Display',Georgia,serif", s: "'DM Sans',Helvetica,Arial,sans-serif"};
  const voPhoto = (D, E, x, y, w, hgt, g) => box(x - g, y - g, w + 2 * g, hgt + 2 * g, `border:.8pt solid ${E.bw ? 'var(--ink)' : 'rgba(255,255,255,.8)'}`) + ph(D, E, x, y, w, hgt, E.bw ? 'outline:2.5pt solid var(--ink)' : 'outline:2.5pt solid #fff');
  const voSheet = (x, y, w, hgt, bw) => box(x, y, w, hgt, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--sheet)');

  L$['vaulted-opening-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 40, pw = 712;
    const hi = bw ? 'var(--ink)' : '#fff', sg = bw ? 'var(--ink)' : 'var(--sig)', ln = bw ? 'var(--ink)' : 'rgba(255,255,255,.75)';
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', 'background:var(--field)');
    const px = m + 10, py = 42, pwid = 256, phh = 152;
    h += voPhoto(D, E, px, py, pwid, phh, 7);
    const tx = px + pwid + 38, tw = m + pw - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 38, tw, 10, 8, '', `font-family:${VO.s};font-weight:600;letter-spacing:3.6pt;color:${sg}`);
    h += X.line('title', 'Please sign in', tx - 1, 52, tw, 46, 30, '', `font-family:${VO.d};color:${hi};letter-spacing:-.4pt;line-height:52pt`);
    h += box(tx, 110, tw, 0, `border-top:1pt solid ${ln}`);
    h += X.line('address', L.address, tx - 1, 118, tw, 22, 14, '', `font-family:${VO.d};color:${hi}`);
    h += X.line('place', (dated ? `${ev.wd3}, ${ev.mon3} ${ev.day}  ·  ${ev.time}  ·  ` : '') + X.cityZip(L).toUpperCase(), tx, 148, tw, 8.5, 8, '', `font-family:${VO.s};font-weight:600;letter-spacing:1.8pt;color:${sg}`);
    const f = fact4(L), fw = tw / f.length;
    h += box(tx, 164, tw, 0, `border-top:.6pt solid ${ln};opacity:.7`);
    f.forEach(([v, k], i) => { h += txt(`fact.${i}`, v, tx + i * fw, 168, fw - 8, `font:400 20pt/22pt ${VO.d};color:${hi}`) + txt(`fact.${i}.k`, k, tx + i * fw, 191, fw - 8, `font:600 8pt/10pt ${VO.s};letter-spacing:1.3pt;text-transform:uppercase;color:${sg}`);
      if(i) h += box(tx + i * fw - 10, 170, 0, 30, `border-left:.6pt solid ${ln};opacity:.6`); });
    // the white writing sheet
    const top = 214, bot = 508, y0 = 250, rh = 36.4;
    h += voSheet(m, top, pw, bot - top, bw);
    h += ledger(E, {x0: m, W: pw, numW: 46, ly: top + 9, lh: 22, y0, rh, lab: `font-family:${VO.s};font-weight:700;font-size:8.5pt;letter-spacing:1.5pt;color:var(--ink);align-items:flex-end`,
      head: box(m + 10, y0 - 3, pw - 20, 1.4, 'background:var(--ink)'), band: i => i % 2 === 1, bx: m + 10, bw: pw - 20, yn: `border:.9pt solid var(--ink);color:var(--ink);font-family:${VO.s};border-radius:0`,
      num: (n, i, y, r) => txt('', String(n), m + 8, y + r / 2 - 12, 34, `font:400 19pt/24pt ${VO.d};text-align:center;color:var(--ink)`)});
    h += foot1(fD(D, E), [m, 516, pw, 58], {dark: !bw});
    return h;
  };

  L$['vaulted-opening-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), FB = qs(D), bw = E.bw, m = 28, pw = 556;
    const hi = bw ? 'var(--ink)' : '#fff', sg = bw ? 'var(--ink)' : 'var(--sig)', ln = bw ? 'var(--ink)' : 'rgba(255,255,255,.7)';
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', 'background:var(--field)');
    // the right column, on the navy: the framed house, the address, the day, the facts
    const cx = 444, cw = 140;
    h += voPhoto(D, E, cx + 6, 36, cw - 12, 80, 6);
    h += X.line('oh.label', ev.label.toUpperCase(), cx, 133, cw, 8, 8, '', `font-family:${VO.s};font-weight:600;letter-spacing:1.3pt;color:${sg}`);
    h += X.line('address', L.address, cx - 1, 144, cw + 1, 16, 11, '', `font-family:${VO.d};color:${hi}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), cx, 167, cw, 8, 8, '', `font-family:${VO.s};font-weight:600;letter-spacing:1.2pt;color:${sg}`);
    h += box(cx, 182, cw, 0, `border-top:.8pt solid ${ln}`);
    h += X.line('oh.date', ev.long, cx - 1, 188, cw + 1, 13, 9, '', `font-family:${VO.d};color:${hi}`);
    h += X.line('oh.time', ev.time, cx, 207, cw, 8.5, 8, '', `font-family:${VO.s};font-weight:600;letter-spacing:.3pt;color:${sg}`);
    h += box(cx, 223, cw, 0, `border-top:.8pt solid ${ln}`);
    fact4(L).slice(0, 3).forEach(([v, k], i) => { const y = 228 + i * 24;
      h += txt(`fact.${i}`, v, cx, y, 50, `font:400 15pt/18pt ${VO.d};color:${hi}`) + txt(`fact.${i}.k`, k, cx + 54, y + 6, cw - 54, `font:600 8pt/10pt ${VO.s};letter-spacing:1.2pt;text-transform:uppercase;color:${sg}`);
      if(i) h += box(cx, y - 3, cw, 0, `border-top:.6pt solid ${ln};opacity:.55`); });
    // the white writing sheet
    h += voSheet(m, 28, 400, 274, bw);
    const lab = (s, t, x, y, w, ls) => txt(s, t, x, y, w, `font:700 8.5pt/1 ${VO.s};letter-spacing:${ls == null ? 1.1 : ls}pt;text-transform:uppercase;color:var(--ink)`);
    const S = {lab, pill: `border:.9pt solid var(--ink);color:var(--ink);font:600 8pt/1 ${VO.s};border-radius:0`,
      dot: () => `border:.9pt solid var(--ink);color:var(--ink);font:400 11pt/1 ${VO.d}`,
      qs: 11, qstyle: `font-family:${VO.d};color:var(--ink)`, wl: ''};
    h += colA(FB, 40, 37, 180, S);
    h += box(229, 38, 0, 254, 'border-left:.5pt solid var(--line)');
    h += colB(FB, 238, 37, 180, S, 88);
    h += foot1(fD(D, E), [m, 312, pw, 58], {dark: !bw});
    return h;
  };
})();
