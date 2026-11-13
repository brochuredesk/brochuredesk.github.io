/* Open House extras for library flyers, batch a (owner 11/2/2026: roll out to every library flyer): B02 Gallery Line,
   B03 Formal Invitation, B08 Night Fade, B10 Luncheon Band, B11 Lifted Photo, B13 Tasting Table.
   Each look takes its flyer's fonts, palette roles, ornaments and layout language; the writing area (columns, fields,
   standard footer #1, light grayscale photo on black and white, no date on public sign-in sheets) is the approved system. */
(function(){
  const X = Extras, L$ = X.looks, esc = X.esc, K = X.lib;
  const {cols, labels, qs, box, txt, ph, foot1, icon, facts, edge} = K;
  ['b02', 'b03', 'b08', 'b10', 'b11', 'b13'].forEach(s => X.themes[s] = K.libTheme);

  const F = {
    b02: {cap: "'Spectral',Georgia,serif", sans: "'Jost',Helvetica,sans-serif"},
    b03: {cap: "'EB Garamond',Georgia,serif", sans: "'Josefin Sans',Helvetica,sans-serif"},
    b08: {cap: "'Archivo',Helvetica,sans-serif", sans: "'Archivo',Helvetica,sans-serif"},
    b10: {cap: "'Plex Condensed',Helvetica,sans-serif", sans: "'Libre Franklin',Helvetica,sans-serif"},
    b11: {cap: "'Fraunces',Georgia,serif", sans: "'Outfit',Helvetica,sans-serif"},
    b13: {cap: "'Newsreader',Georgia,serif", sans: "'Instrument Sans',Helvetica,sans-serif"}};
  const col = (E, c, bwc) => E.bw ? (bwc || 'var(--ink)') : c;
  const fillOf = E => E.bw ? 'var(--ink)' : 'var(--accent)', onFill = E => E.bw ? '#fff' : 'var(--on-accent)';
  const facts1 = L => facts(L).map(([, v, l]) => `${v} ${l}`).join('  ·  ').toUpperCase();

  /* ---------- the sign-in writing area: header labels, seven rows, column rules. o shapes each look ---------- */
  const table = (D, E, o) => {
    const x0 = o.x0, W = o.W, top = o.top, bot = o.bot, hd = 36, rh = (bot - top - hd) / 7, y0 = top + hd, n = o.numW || 40;
    const cs = cols(x0, n, [196, 184, 104, W - n - 196 - 184 - 104]);
    let h = labels(cs, top + 8, 20, o.label);
    h += box(x0, y0 - 1, W, o.headRule || 1, `background:${o.headColor || 'var(--accent)'}`);
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      if(o.band && o.band(i)) h += `<div class="rowband" style="left:${x0}pt;top:${y + (o.bandInset || 0)}pt;width:${W}pt;height:${rh - 2 * (o.bandInset || 0)}pt;background:var(--tint);${o.bandStyle || ''}"></div>`;
    }
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      h += o.num(E.first + i, x0, y, rh);
      if(o.sep !== false && i < 6) h += box(x0, y + rh, W, 0, o.sep || 'border-top:.5pt solid var(--line)');
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - 20, y + rh / 2 - 9, 18, o.yn); });
    }
    if(o.vr !== false) cs.forEach(c => { h += `<div class="vrule" style="left:${c.x}pt;top:${y0 + 6}pt;height:${7 * rh - 12}pt"></div>`; });
    return h;
  };
  // the brief's date line for broker sheets
  const dateText = ev => `${ev.long}   ·   ${ev.time}`;
  const LB = (E, f, extra) => `font-family:${f};font-weight:600;letter-spacing:1.6pt;color:${E.bw ? 'var(--ink)' : 'var(--main-on-paper)'};align-items:center;${extra || ''}`;

  /* ============================== B02 GALLERY LINE ============================== */
  // paper header with a brass gallery line, a dark field below holding the paper writing area
  L$['b02-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, f = F.b02, m = 48, pw = 696;
    const ink = bw ? 'var(--ink)' : 'var(--main-on-paper)', ac = bw ? 'var(--ink)' : 'var(--accent-on-paper)';
    let h = bw ? '' : E.fl(0, 176, 792, 436, 'lrb', 'background:var(--dark)');
    h += ph(D, E, m, 34, 158, 106);
    const tx = m + 158 + 34, tw = 792 - m - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 36, tw, 9.5, 8, '', `font:500 9.5pt/1 ${f.sans};letter-spacing:4.5pt;color:${ac}`);
    h += X.line('title', 'Please sign in', tx, 52, tw, 34, 20, '', `font-family:${f.cap};font-weight:400;letter-spacing:6pt;text-transform:uppercase;color:${ink}`);
    h += box(tx, 94, 72, 1, `background:${bw ? 'var(--ink)' : 'var(--accent)'}`);
    h += X.line('address', L.address, tx, 104, tw, 20, 13, '', `font-family:${f.cap};font-weight:500;color:${ink}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), tx, 128, tw, 8.5, 8, '', `font:500 8.5pt/1 ${f.sans};letter-spacing:2.4pt;color:${ac}`);
    if(dated) h += X.line('oh.date', dateText(ev), tx, 148, tw, 10, 8, '', `font:500 10pt/1 ${f.cap};color:${ink}`);
    h += box(m, 175, pw, 1.4, `background:${bw ? 'var(--ink)' : 'var(--accent)'}`);
    const top = 194, bot = 506, x0 = m + 14, W = pw - 28;
    h += box(m, top, pw, bot - top, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--paper)');
    h += table(D, E, {x0, W, top: top + 4, bot: bot - 4, label: LB(E, f.cap, 'font-weight:500;letter-spacing:2pt;'),
      num: (n, x, y, rh) => `<div class="abs" style="left:${x}pt;top:${y + rh / 2 - 11}pt;width:36pt;height:22pt;font:500 15pt/22pt ${f.cap};text-align:center;color:${ink}">${n}</div>`,
      yn: `border:.8pt solid ${ink};color:${ink};font-family:${f.sans}`, sep: `border-top:.6pt solid ${bw ? 'var(--line)' : 'var(--accent)'}`});
    h += foot1(D, [m, 516, pw, 58], {dark: !bw});
    return h;
  };

  /* ============================ B03 FORMAL INVITATION ============================ */
  const ROMAN = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'][n];
  const dbl = (x, y, w, E) => { const c = bw => E.bw ? 'var(--ink)' : 'var(--accent-on-dark)'; return box(x, y, w, .7, `background:${c()}`) + box(x, y + 3.5, w, .7, `background:${c()}`); };
  L$['b03-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, f = F.b03, m = 48, pw = 696;
    const hi = bw ? 'var(--ink)' : 'var(--on-dark)', ha = bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', 'background:var(--dark)');
    const pxw = 150, px = 396 - pxw / 2, py = 30;
    h += ph(D, E, px, py, pxw, 100) + box(px, py + 100, pxw, 4, `background:${ha}`);
    const lw = px - 26 - m, rx = px + pxw + 26, rw = 792 - m - rx;
    h += X.line('oh.label', ev.label.toUpperCase(), m, 38, lw, 8.5, 8, '', `text-align:right;font:600 8.5pt/1 ${f.sans};letter-spacing:4pt;color:${ha}`);
    h += X.line('title', 'Please sign in', m, 54, lw, 32, 20, '', `text-align:right;font-family:${f.cap};font-weight:500;letter-spacing:3pt;text-transform:uppercase;color:${hi}`);
    if(dated){ h += X.line('oh.date', ev.long, m, 98, lw, 14, 9, '', `text-align:right;font:500 13pt/1 ${f.cap};color:${hi}`) + X.line('oh.time', ev.time, m, 116, lw, 12, 8.5, '', `text-align:right;font:600 8.5pt/1 ${f.sans};letter-spacing:2pt;text-transform:uppercase;color:${ha}`); }
    h += txt('welcome', 'Welcome to', rx, 42, rw, `font:600 8.5pt/1 ${f.sans};letter-spacing:4pt;text-transform:uppercase;color:${ha}`);
    h += X.line('address', L.address, rx, 56, rw, 28, 14, '', `font-family:${f.cap};font-weight:500;color:${hi}`);
    h += X.line('place', X.cityZip(L), rx, 92, rw, 12, 8.5, '', `font:500 11.5pt/1 ${f.cap};color:${hi}`);
    h += X.line('facts', `${L.beds} BD  ·  ${Math.ceil(Number(L.baths) || 0)} BA  ·  ${Number(L.sqft).toLocaleString('en-US')} SQ FT`, rx, 112, rw, 8, 8, '', `font:600 8pt/1 ${f.sans};letter-spacing:1.2pt;color:${ha}`);
    h += dbl(m, 148, pw, E);
    const top = 168, bot = 506, x0 = m + 4, W = pw - 8;
    h += box(m, top, pw, bot - top, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--paper)');
    h += box(m + 4, top + 4, pw - 8, bot - top - 8, `border:.5pt solid var(--accent);opacity:${bw ? .5 : .8}`);
    h += table(D, E, {x0: x0 + 10, W: W - 20, top: top + 10, bot: bot - 10, label: LB(E, f.sans, 'font-size:8pt;font-weight:600;letter-spacing:2pt;text-transform:uppercase;'),
      band: i => i % 2 === 0,
      num: (n, x, y, rh) => `<div class="abs" style="left:${x}pt;top:${y + rh / 2 - 11}pt;width:40pt;height:22pt;font:500 14pt/22pt ${f.cap};text-align:center;color:var(--main-on-paper)">${ROMAN(n)}</div>`,
      yn: `border:.8pt solid var(--main-on-paper);color:var(--main-on-paper);font-family:${f.sans}`});
    h += foot1(D, [m, 516, pw, 58], {dark: !bw});
    return h;
  };

  /* ============================== B08 NIGHT FADE ============================== */
  L$['b08-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, f = F.b08, m = 48, pw = 696;
    const hi = bw ? 'var(--ink)' : 'var(--on-dark)', ha = bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', 'background:var(--dark)');
    const px = m, py = 34, pwid = 214, phh = 143;
    h += ph(D, E, px, py, pwid, phh);
    if(!bw) h += box(px, py + phh * .5, pwid, phh * .5 + 1, 'background:linear-gradient(to bottom,transparent,var(--dark))');
    const tx = px + pwid + 34, tw = 792 - m - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 40, tw, 9, 8, '', `font:700 9pt/1 ${f.sans};letter-spacing:4pt;color:${ha}`);
    h += X.line('title', 'Open House', tx, 56, tw, 46, 28, '', `font:700 44pt/46pt ${f.cap};letter-spacing:-.5pt;text-transform:uppercase;color:${hi}`);
    h += `<div class="abs" style="left:${tx}pt;top:116pt;width:${tw}pt;height:30pt;background:${fillOf(E)}"></div>`;
    h += X.line(dated ? 'oh.date' : 'bar', dated ? dateText(ev) : 'Please sign in', tx + 14, 123, tw - 28, 15, 10, '', `font:700 15pt/16pt ${f.cap};color:${onFill(E)};${dated ? '' : 'letter-spacing:3pt;text-transform:uppercase'}`);
    h += X.line('address', L.address.toUpperCase(), tx, 158, tw, 16, 11, '', `font:700 14pt/16pt ${f.cap};letter-spacing:3.5pt;color:${hi}`);
    h += X.line('place', `${X.cityZip(L).toUpperCase()}  ·  ${facts1(L)}`, tx, 180, tw, 8.5, 8, '', `font:400 8.5pt/1 ${f.sans};letter-spacing:1.6pt;color:${ha}`);
    const top = 204, bot = 506, x0 = m, W = pw;
    h += box(m, top, pw, bot - top, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--paper)');
    h += box(m, top, 5, bot - top, `background:${fillOf(E)}`);
    h += table(D, E, {x0: x0 + 14, W: W - 22, top: top + 8, bot: bot - 6, label: LB(E, f.sans, 'font-size:8pt;font-weight:700;letter-spacing:1.8pt;text-transform:uppercase;'),
      band: i => i % 2 === 1,
      num: (n, x, y, rh) => `<div class="abs" style="left:${x + 8}pt;top:${y + rh / 2 - 12}pt;width:24pt;height:24pt;background:${fillOf(E)};color:${onFill(E)};font:700 12pt/24pt ${f.cap};text-align:center">${n}</div>`,
      yn: `border:1pt solid var(--main-on-paper);color:var(--main-on-paper);font-family:${f.sans};border-radius:0`});
    h += foot1(D, [m, 516, pw, 58], {dark: !bw});
    return h;
  };

  /* ============================== B10 LUNCHEON BAND ============================== */
  L$['b10-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, f = F.b10, m = 48, pw = 696;
    const ink = bw ? 'var(--ink)' : 'var(--main-on-paper)', on = bw ? 'var(--ink)' : 'var(--on-dark)', ad = bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    let h = '';
    h += ph(D, E, m, 30, 150, 100);
    const tx = m + 150 + 30, tw = 792 - m - tx;
    h += X.line('title', 'Open House', tx, 26, tw, 60, 36, '', `font:700 56pt/60pt ${f.cap};text-transform:uppercase;letter-spacing:.5pt;color:${ink}`);
    h += X.line('address', `${L.address}  ·  ${X.cityZip(L)}`, tx, 90, tw, 17, 11, '', `font:600 15pt/17pt ${f.sans};color:${ink}`);
    // the flyer's at-a-glance row
    facts(L).forEach(([ic, v, l], i) => { const x = tx + i * 124;
      h += icon(ic, x, 116, 15, bw ? '#111' : 'var(--accent-on-paper)') + X.line('fact' + i, `${v} ${l}`, x + 21, 117, 98, 12, 8, '', `font:600 9.5pt/13pt ${f.sans};color:${ink}`); });
    if(!bw) h += E.fl(0, 148, 792, 34, 'lr', 'background:var(--dark)'); else h += box(m, 148, pw, 34, 'border:.9pt solid var(--ink)');
    h += X.line('bar', 'Please sign in', m + 14, 158, 300, 14, 10, '', `font:700 14pt/14pt ${f.cap};letter-spacing:3pt;text-transform:uppercase;color:${on}`);
    h += X.line(dated ? 'oh.date' : 'oh.label', dated ? dateText(ev) : ev.label.toUpperCase(), 792 - m - 354, 159, 340, 12, 8, '', `text-align:right;font:600 ${dated ? 11 : 9.5}pt/12pt ${f.sans};letter-spacing:${dated ? .6 : 3}pt;color:${ad}`);
    const top = 194, bot = 508;
    h += table(D, E, {x0: m, W: pw, top, bot, label: LB(E, f.cap, 'font-size:9.5pt;font-weight:700;letter-spacing:1.6pt;text-transform:uppercase;'),
      headRule: 2, headColor: ink, band: i => i % 2 === 0,
      num: (n, x, y, rh) => `<div class="abs" style="left:${x + 6}pt;top:${y + rh / 2 - 12}pt;width:26pt;height:24pt;background:${bw ? 'var(--ink)' : 'var(--main)'};color:${bw ? '#fff' : 'var(--on-main)'};font:700 14pt/24pt ${f.cap};text-align:center">${n}</div>`,
      yn: `border:1pt solid ${ink};color:${ink};font-family:${f.cap};border-radius:2pt`});
    h += box(m, bot + 2, pw, 0, `border-top:1.4pt solid ${ink}`);
    h += foot1(D, [m, 516, pw, 58], {dark: false});
    return h;
  };

  /* ============================== B11 LIFTED PHOTO ============================== */
  L$['b11-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, f = F.b11, m = 48, pw = 696, e = edge(E);
    const ink = bw ? 'var(--ink)' : 'var(--main-on-paper)', ac = bw ? 'var(--ink)' : 'var(--accent-on-paper)';
    let h = '';
    const px = 492, pw2 = 792 - e - px, ph2 = 172 - e;
    h += ph(D, E, px, e, pw2, ph2, 'border-radius:0 0 0 96pt / 0 0 0 58pt');
    h += X.line('title', 'Open', m, 26, 220, 54, 40, '', `font:600 52pt/54pt ${f.cap};color:${ink}`);
    h += X.line('title2', 'House', m, 80, 220, 54, 40, '', `font:600 52pt/54pt ${f.cap};color:${bw ? 'var(--ink)' : 'var(--accent-on-paper)'}`);
    h += box(284, 38, 0, 96, `border-left:.9pt solid ${bw ? 'var(--ink)' : 'var(--accent)'}`);
    const tx = 302, tw = px - 22 - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 36, tw, 8.5, 8, '', `font:600 8.5pt/1 ${f.sans};letter-spacing:2.6pt;color:${ac}`);
    h += X.line('sub', 'Please sign in', tx, 52, tw, 22, 14, '', `font:600 20pt/22pt ${f.cap};color:${ink}`);
    h += X.line('address', L.address, tx, 84, tw, 17, 11, '', `font:400 15pt/17pt ${f.cap};color:${ink}`);
    h += X.line('place', X.cityZip(L), tx, 105, tw, 9.5, 8, '', `font:500 9.5pt/1 ${f.sans};letter-spacing:.6pt;color:var(--muted)`);
    if(dated) h += X.line('oh.date', ev.long, tx, 120, tw, 11, 8, '', `font:600 10pt/12pt ${f.sans};color:${ink}`);
    const top = 182, bot = 506;
    h += table(D, E, {x0: m, W: pw, top, bot, label: LB(E, f.sans, 'font-size:8pt;font-weight:600;letter-spacing:1.8pt;text-transform:uppercase;'),
      headRule: 1.4, band: i => i % 2 === 0, bandInset: 2, bandStyle: 'border-radius:10pt', sep: false,
      num: (n, x, y, rh) => `<div class="abs" style="left:${x + 8}pt;top:${y + rh / 2 - 12}pt;width:24pt;height:24pt;border-radius:50%;background:${fillOf(E)};color:${onFill(E)};font:600 12pt/24pt ${f.cap};text-align:center">${n}</div>`,
      yn: `border:.9pt solid ${ink};color:${ink};font-family:${f.sans}`});
    h += foot1(D, [m, 516, pw, 58], {dark: false});
    return h;
  };

  /* ============================== B13 TASTING TABLE ============================== */
  L$['b13-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, f = F.b13, m = 48, pw = 696;
    const ink = bw ? 'var(--ink)' : 'var(--main-on-paper)', on = bw ? 'var(--ink)' : 'var(--on-dark)', ad = bw ? 'var(--ink)' : 'var(--accent-on-dark)', ac = bw ? 'var(--ink)' : 'var(--accent-on-paper)';
    let h = bw ? box(m, 124, pw - 150 - 20, 0, 'border-top:1.4pt solid var(--ink)') : E.fl(0, 0, 792, 124, 'ltr', 'background:var(--dark)');
    h += X.line('oh.label', ev.label.toUpperCase(), m, 40, 400, 9, 8, '', `font:600 9pt/1 ${f.sans};letter-spacing:4.5pt;color:${ad}`);
    h += X.line('title', 'Please sign in', m, 54, 480, 46, 28, '', `font:500 42pt/46pt ${f.cap};color:${on}`);
    if(dated) h += X.line('oh.date', dateText(ev), m, 98, 480, 16, 10, '', `font:400 14pt/16pt ${f.cap};color:${on}`);
    h += ph(D, E, 792 - m - 150 - 3, 40, 150, 100, `border:3pt solid ${bw ? '#fff' : 'var(--paper)'}`);
    h += txt('join', 'Join us at', m, 146, 200, `font:600 8.5pt/1 ${f.sans};letter-spacing:3pt;text-transform:uppercase;color:${ac}`);
    h += X.line('address', `${L.address}  ·  ${X.cityZip(L)}`, m, 160, 520, 24, 14, '', `font:500 24pt/26pt ${f.cap};color:${ink}`);
    h += X.line('facts', facts1(L), m, 190, 520, 9, 8, '', `font:600 9pt/1 ${f.sans};letter-spacing:1.6pt;color:${ink}`);
    const top = 206, bot = 508;
    h += table(D, E, {x0: m, W: pw, top, bot, label: LB(E, f.sans, 'font-size:8pt;font-weight:600;letter-spacing:2pt;text-transform:uppercase;'),
      headRule: 1, headColor: ink, sep: `border-top:.7pt dotted ${bw ? '#666' : 'var(--accent)'}`,
      num: (n, x, y, rh) => `<div class="abs" style="left:${x}pt;top:${y + rh / 2 - 11}pt;width:40pt;height:22pt;font:500 16pt/22pt ${f.cap};text-align:center;color:${ink}">${n}</div>` + box(x + 4, y + rh / 2 + 12, 32, 0, `border-top:1.2pt solid ${fillOf(E)}`),
      yn: `border:.8pt solid ${ink};color:${ink};font-family:${f.sans};border-radius:4pt`});
    h += box(m, bot + 2, pw, 0, `border-top:1pt solid ${ink}`);
    h += foot1(D, [m, 516, pw, 58], {dark: false});
    return h;
  };

  /* ====================== feedback cards: the approved fields, in each flyer's look ====================== */
  const Q = {
    b02: {pill: 'border-radius:0', dot: 'border-radius:50%', cap: 'b02', head: 'font-weight:500;letter-spacing:1.6pt;text-transform:uppercase;font-size:8.5pt', q: 'font-weight:500', sz: 10.5},
    b03: {pill: 'border-radius:0', dot: 'border-radius:50%', head: 'font-weight:600;letter-spacing:1.6pt;text-transform:uppercase;font-size:8pt', q: 'font-weight:500', sz: 11},
    b08: {pill: 'border-radius:0', dot: 'border-radius:0', head: 'font-weight:700;letter-spacing:1.4pt;text-transform:uppercase;font-size:8pt', q: 'font-weight:700', sz: 10.5},
    b10: {pill: 'border-radius:2pt', dot: 'border-radius:2pt', head: 'font-weight:700;letter-spacing:1.4pt;text-transform:uppercase;font-size:9pt', q: 'font-weight:700', sz: 11.5},
    b11: {pill: 'border-radius:12pt', dot: 'border-radius:50%', head: 'font-weight:600;letter-spacing:1.2pt;text-transform:uppercase;font-size:8pt', q: 'font-weight:600', sz: 11},
    b13: {pill: 'border-radius:4pt', dot: 'border-radius:50%', head: 'font-weight:600;letter-spacing:1.6pt;text-transform:uppercase;font-size:8pt', q: 'font-weight:500', sz: 11.5}};
  const fbBody = (D, E, k, panel) => {
    const FB = qs(D), f = F[k], q = Q[k], bw = E.bw, m = 40, pw = 532, top = 108, bot = 300;
    const ink = bw ? 'var(--ink)' : 'var(--main-on-paper)', body = k === 'b03' || k === 'b02' || k === 'b13' || k === 'b08' ? f.cap : f.cap;
    let h = panel;
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font-family:${f.sans};${q.head};line-height:1;color:${ink}`);
    const fill = k === 'b08' && !bw ? `background:${fillOf(E)};color:${onFill(E)};border:.8pt solid ${fillOf(E)}` : `background:var(--tint);color:${ink};border:.8pt solid ${bw ? 'var(--ink)' : 'var(--accent)'}`;
    const ax = m + 16, aw = 244, bx = ax + aw + 26, bw2 = m + pw - 16 - bx;
    const qs1 = `font-family:${f.cap};${q.q};color:var(--ink)`;
    h += lab('q.price', FB.price, ax, 116, aw);
    h += `<div class="abs" style="left:${ax}pt;top:128pt;width:${aw}pt;display:flex;gap:6pt">` + FB.choices.map(t => `<span class="pill" style="flex:1;height:20pt;border:.8pt solid ${bw ? 'var(--ink)' : 'var(--accent)'};color:${ink};font:500 8.5pt/1 ${f.sans};letter-spacing:.8pt;${q.pill}">${t}</span>`).join('') + '</div>';
    const dot = () => `${fill};${q.dot};font:600 10.5pt/1 ${f.cap}`;
    h += lab('q.cond', FB.cond, ax, 164, 100) + X.dots(ax + 108, 157, aw - 108, 22, dot);
    h += lab('q.shows', FB.shows, ax, 192, 100) + X.dots(ax + 108, 185, aw - 108, 22, dot);
    h += txt('q.scale', FB.scale, ax + 108, 209, aw - 108, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += X.line('q.seller', FB.seller, ax, 224, aw, q.sz, 8, '', qs1) + X.wline(ax, 252, aw) + X.wline(ax, 268, aw);
    h += lab('q.name', FB.name, ax, 274, 100) + X.wline(ax, 291, 108) + lab('q.contact', FB.contact, ax + 120, 274, aw - 120) + X.wline(ax + 120, 291, aw - 120);
    h += box(ax + aw + 13, 118, 0, 170, 'border-left:.5pt solid var(--line)');
    FB.prompts.forEach(([kk, t], i) => { const y = 114 + i * 60;
      h += X.line('q.' + kk, t, bx, y, bw2, q.sz, 8, '', qs1) + X.wline(bx, y + 26, bw2) + X.wline(bx, y + 41, bw2) + X.wline(bx, y + 56, bw2); });
    return h;
  };
  const kick = (E, f, c) => `font:500 8.5pt/1 ${f.sans};letter-spacing:3.5pt;color:${c}`;

  L$['b02-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, f = F.b02, m = 40, pw = 532;
    const ink = bw ? 'var(--ink)' : 'var(--main-on-paper)', ac = bw ? 'var(--ink)' : 'var(--accent-on-paper)';
    let h = bw ? '' : E.fl(0, 99, 612, 297, 'lrb', 'background:var(--dark)');
    h += ph(D, E, m, 20, 96, 64);
    const tx = m + 96 + 24, tw = 612 - m - tx;
    h += X.line('oh.label', ev.label.toUpperCase(), tx, 22, tw, 8.5, 8, '', kick(E, f, ac));
    h += X.line('title', 'Your feedback', tx, 36, tw, 28, 16, '', `font-family:${f.cap};letter-spacing:4pt;text-transform:uppercase;color:${ink}`);
    h += X.line('address', L.address, tx, 66, tw, 14, 10, '', `font:500 13pt/14pt ${f.cap};color:${ink}`);
    h += X.line('oh.date', `${X.cityZip(L).toUpperCase()}   ·   ${ev.long}   ·   ${ev.time}`, tx, 83, tw, 8.5, 8, '', `font:500 8.5pt/1 ${f.sans};letter-spacing:1.2pt;color:${ac}`);
    h += box(m, 98, pw, 1.4, `background:${bw ? 'var(--ink)' : 'var(--accent)'}`);
    const panel = box(m, 108, pw, 192, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--paper)') + box(m, 112, pw, .6, `background:${bw ? 'var(--ink)' : 'var(--accent)'};opacity:.7`) + box(m, 296, pw, .6, `background:${bw ? 'var(--ink)' : 'var(--accent)'};opacity:.7`);
    h += fbBody(D, E, 'b02', panel);
    h += foot1(D, [m, 308, pw, 54], {dark: !bw});
    return h;
  };

  L$['b03-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, f = F.b03, m = 40, pw = 532;
    const hi = bw ? 'var(--ink)' : 'var(--on-dark)', ha = bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', 'background:var(--dark)');
    const px = 306 - 48;
    h += ph(D, E, px, 16, 96, 64) + box(px, 80, 96, 3, `background:${ha}`);
    const lw = px - 22 - m, rx = px + 96 + 22, rw = 612 - m - rx;
    h += X.line('oh.label', ev.label.toUpperCase(), m, 24, lw, 8, 8, '', `text-align:right;font:600 8pt/1 ${f.sans};letter-spacing:3.5pt;color:${ha}`);
    h += X.line('title', 'Your feedback', m, 38, lw, 26, 16, '', `text-align:right;font:500 22pt/26pt ${f.cap};letter-spacing:2pt;text-transform:uppercase;color:${hi}`);
    h += X.line('address', L.address, rx, 24, rw, 20, 12, '', `font:500 17pt/20pt ${f.cap};color:${hi}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), rx, 48, rw, 8, 8, '', `font:600 8pt/1 ${f.sans};letter-spacing:2pt;color:${ha}`);
    h += X.line('oh.date', ev.long, rx, 63, rw, 12, 8.5, '', `font:500 12pt/13pt ${f.cap};color:${hi}`);
    h += X.line('oh.time', ev.time, rx, 78, rw, 9, 8, '', `font:600 8.5pt/1 ${f.sans};letter-spacing:1.2pt;color:${ha}`);
    h += dbl(m, 92, pw, E);
    const panel = box(m, 108, pw, 192, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--paper)') + box(m + 4, 112, pw - 8, 184, `border:.5pt solid var(--accent);opacity:${bw ? .5 : .8}`);
    h += fbBody(D, E, 'b03', panel);
    h += foot1(D, [m, 308, pw, 54], {dark: !bw});
    return h;
  };

  L$['b08-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, f = F.b08, m = 40, pw = 532;
    const hi = bw ? 'var(--ink)' : 'var(--on-dark)', ha = bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', 'background:var(--dark)');
    h += ph(D, E, m, 14, 108, 72);
    if(!bw) h += box(m, 14 + 36, 108, 37, 'background:linear-gradient(to bottom,transparent,var(--dark))');
    const tx = m + 108 + 24, tw = 612 - m - tx;
    h += X.line('title', 'Your feedback', tx, 20, tw, 28, 18, '', `font:700 26pt/28pt ${f.cap};letter-spacing:-.2pt;text-transform:uppercase;color:${hi}`);
    h += `<div class="abs" style="left:${tx}pt;top:54pt;width:${tw}pt;height:22pt;background:${fillOf(E)}"></div>`;
    h += X.line('oh.date', `${ev.long}   |   ${ev.time}`, tx + 10, 59, tw - 20, 12, 8.5, '', `font:700 11.5pt/12pt ${f.cap};color:${onFill(E)}`);
    h += X.line('address', `${L.address}  ·  ${X.cityZip(L)}  ·  ${ev.label}`.toUpperCase(), tx, 83, tw, 8, 8, '', `font:700 8pt/1 ${f.sans};letter-spacing:1.4pt;color:${ha}`);
    const panel = box(m, 108, pw, 192, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--paper)') + box(m, 108, 4, 192, `background:${fillOf(E)}`);
    h += fbBody(D, E, 'b08', panel);
    h += foot1(D, [m, 308, pw, 54], {dark: !bw});
    return h;
  };

  L$['b10-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, f = F.b10, m = 40, pw = 532;
    const ink = bw ? 'var(--ink)' : 'var(--main-on-paper)', on = bw ? 'var(--ink)' : 'var(--on-dark)', ad = bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    let h = ph(D, E, m, 16, 84, 56);
    const tx = m + 84 + 24, tw = 612 - m - tx;
    h += X.line('title', 'Your feedback', tx, 12, tw, 38, 24, '', `font:700 34pt/38pt ${f.cap};text-transform:uppercase;color:${ink}`);
    h += X.line('address', `${L.address}  ·  ${X.cityZip(L)}`, tx, 52, tw, 14, 10, '', `font:600 12pt/14pt ${f.sans};color:${ink}`);
    h += bw ? box(m, 76, pw, 24, 'border:.9pt solid var(--ink)') : E.fl(0, 76, 612, 24, 'lr', 'background:var(--dark)');
    h += X.line('oh.label', ev.label.toUpperCase(), m + 10, 84, 200, 8, 8, '', `font:700 8pt/1 ${f.cap};letter-spacing:2.6pt;color:${on}`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, 612 - m - 10 - 300, 84, 300, 9, 8, '', `text-align:right;font:600 9pt/1 ${f.sans};letter-spacing:.5pt;color:${ad}`);
    const panel = box(m, 108, pw, 0, `border-top:1.4pt solid ${ink}`) + box(m, 300, pw, 0, `border-top:1.4pt solid ${ink}`) + box(m, 108, pw, 192, 'background:var(--tint)');
    h += fbBody(D, E, 'b10', panel);
    h += foot1(D, [m, 308, pw, 54], {dark: false});
    return h;
  };

  L$['b11-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, f = F.b11, m = 40, pw = 532, e = edge(E);
    const ink = bw ? 'var(--ink)' : 'var(--main-on-paper)', ac = bw ? 'var(--ink)' : 'var(--accent-on-paper)';
    const px = 432;
    let h = ph(D, E, px, e, 612 - e - px, 96 - e, 'border-radius:0 0 0 52pt / 0 0 0 30pt');
    h += X.line('oh.label', ev.label.toUpperCase(), m, 24, 360, 8, 8, '', `font:600 8pt/1 ${f.sans};letter-spacing:2.6pt;color:${ac}`);
    h += X.line('title', 'Your feedback', m, 36, 370, 36, 22, '', `font:600 32pt/36pt ${f.cap};color:${ink}`);
    h += X.line('address', `${L.address}  ·  ${X.cityZip(L)}`, m, 74, 370, 12, 9, '', `font:400 12pt/13pt ${f.cap};color:${ink}`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, m, 90, 370, 8, 8, '', `font:600 8.5pt/1 ${f.sans};letter-spacing:.8pt;color:var(--muted)`);
    const panel = box(m, 108, pw, 192, `border-radius:14pt;${bw ? 'border:.9pt solid var(--ink)' : 'background:var(--tint)'}`);
    h += fbBody(D, E, 'b11', panel);
    h += foot1(D, [m, 308, pw, 54], {dark: false});
    return h;
  };

  L$['b13-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, f = F.b13, m = 40, pw = 532;
    const ink = bw ? 'var(--ink)' : 'var(--main-on-paper)', on = bw ? 'var(--ink)' : 'var(--on-dark)', ad = bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    let h = bw ? box(m, 100, pw, 0, 'border-top:1.4pt solid var(--ink)') : E.fl(0, 0, 612, 100, 'ltr', 'background:var(--dark)');
    h += X.line('oh.label', ev.label.toUpperCase(), m, 26, 380, 8, 8, '', `font:600 8pt/1 ${f.sans};letter-spacing:4pt;color:${ad}`);
    h += X.line('title', 'Your feedback', m, 38, 380, 30, 20, '', `font:500 30pt/32pt ${f.cap};color:${on}`);
    h += X.line('address', `${L.address}  ·  ${X.cityZip(L)}`, m, 72, 380, 12, 9, '', `font:400 12pt/13pt ${f.cap};color:${on}`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, m, 87, 380, 8, 8, '', `font:600 8pt/1 ${f.sans};letter-spacing:1.2pt;color:${ad}`);
    h += ph(D, E, 612 - m - 96 - 3, 20, 96, 64, `border:3pt solid ${bw ? '#fff' : 'var(--paper)'}`);
    const panel = box(m, 108, pw, 0, `border-top:1pt solid ${ink}`) + box(m, 300, pw, 0, `border-top:1pt solid ${ink}`);
    h += fbBody(D, E, 'b13', panel);
    h += foot1(D, [m, 308, pw, 54], {dark: false});
    return h;
  };
})();
