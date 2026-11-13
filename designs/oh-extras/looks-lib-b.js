/* Open House extras for library flyers, batch b (owner 11/2/2026: roll out to every library flyer).
   Sign-in sheet (public/broker, color/black and white) and broker feedback card in the look of:
     B14  Photo Grid        paper field, a main-color tile and a photo tile like the flyer's grid; IBM Plex Sans Condensed caps, Manrope.
     B26  Agent Preview     a dark field, the house in a gold-framed box, an accent-outlined date | time box; Spectral caps over Manrope.
     B46A Arrow             a dark field, a main-color side tab with the place set upright, the house in an arrow with its accent echo; Jost.
     B46B Chevron           a dark field, the house with a V-cut foot and its accent line, centered type with diamonds; Sora.
     B47  Itinerary         a tint of the main color, a main-color title bar from the page edge, a ruled when/time/where table; Montserrat, Playfair.
     P01  Ruled Editorial   cream paper, heavy rules between huge caps, "invited" in the main color; Epilogue and Hanken Grotesk.
   Standing rules: watch where every line starts and ends; no rule, diagonal or shape touches text (owner 11/2/2026). */
(function(){
  const X = Extras, L$ = X.looks, K = X.lib, esc = K.esc;
  const {cols, labels, qs, box, txt, ph, foot1, edge, labelLines, facts, mixOf, readableOf, libTheme} = K;

  ['b14', 'b26', 'b46a', 'b46b', 'p01'].forEach(s => X.themes[s] = libTheme);
  // B47 reads its paper as a tint of the main color, the way the flyer does
  X.themes.b47 = (D, bw, root) => { libTheme(D, bw, root); if(bw) return;
    const c = (D.brand || {}).colors || {}, main = c.main || '#2f4a3a', accent = c.accent || main, paper = mixOf(main, '#ffffff', .86), set = (k, v) => root.setProperty(k, v);
    set('--paper', paper); set('--accent-on-paper', readableOf(accent, paper)); set('--main-on-paper', readableOf(main, paper)); set('--tint', 'rgba(255,255,255,.6)'); };

  // ---------- shared builders ----------
  // the sign-in writing area: column labels, seven rows (band, hairline, numeral from o.num), Y/N marks, optional column rules
  const siRows = (E, o) => {
    const cs = cols(o.x0, o.numW, o.widths), rh = o.rh; let h = labels(cs, o.labY, o.labH, o.labStyle);
    for(let i = 0; i < 7; i++){ const y = o.y0 + i * rh;
      if(o.band && i % 2 === 0) h += `<div class="rowband" style="left:${o.x0}pt;top:${y}pt;width:${o.W}pt;height:${rh}pt;background:var(--tint)"></div>`; }
    for(let i = 0; i < 7; i++){ const y = o.y0 + i * rh;
      h += o.num(E.first + i, o.x0, y, rh);
      if(!o.noH) h += box(o.x0, y + rh, o.W, 0, 'border-top:.5pt solid var(--line)');
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - 21, y + (rh - 18) / 2, 18, o.yn); }); }
    if(o.vr) cs.forEach(c => { h += `<div class="vrule" style="left:${c.x}pt;top:${o.y0 + o.vr[0]}pt;height:${7 * rh - o.vr[1]}pt"></div>`; });
    return h; };
  // the feedback card's questions, laid out the same way on every look (the approved B01 geometry): choices, 1-5 marks and the
  // seller question on the left, the three prompts with three lines each on the right. o: x, top, aw, bx, bw2, lab, pill, dot, q
  const fbBody = (D, E, o) => { const FB = qs(D), ax = o.x, t = o.top, aw = o.aw, bx = o.bx, bw2 = o.bw2; let h = '';
    h += o.lab('q.price', FB.price, ax, t + 8, aw);
    h += `<div class="abs" style="left:${ax}pt;top:${t + 20}pt;width:${aw}pt;display:flex;gap:6pt">` + FB.choices.map(c => `<span class="pill" style="flex:1;height:20pt;${o.pill}">${c}</span>`).join('') + '</div>';
    h += o.lab('q.cond', FB.cond, ax, t + 56, 100) + X.dots(ax + 108, t + 49, aw - 108, 22, o.dot);
    h += o.lab('q.shows', FB.shows, ax, t + 84, 100) + X.dots(ax + 108, t + 77, aw - 108, 22, o.dot);
    h += txt('q.scale', FB.scale, ax + 108, t + 101, aw - 108, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += X.line('q.seller', FB.seller, ax, t + 116, aw, 10.5, 8, '', o.q) + X.wline(ax, t + 144, aw) + X.wline(ax, t + 160, aw);
    h += o.lab('q.name', FB.name, ax, t + 166, 100) + X.wline(ax, t + 183, 108) + o.lab('q.contact', FB.contact, ax + 120, t + 166, aw - 120) + X.wline(ax + 120, t + 183, aw - 120);
    h += box(ax + aw + 13, t + 10, 0, 170, 'border-left:.5pt solid var(--line)');
    FB.prompts.forEach(([k, p], i) => { const y = t + 6 + i * 60;
      h += X.line('q.' + k, p, bx, y, bw2, 10.5, 8, '', o.q) + X.wline(bx, y + 26, bw2) + X.wline(bx, y + 41, bw2) + X.wline(bx, y + 56, bw2); });
    return h; };
  const lines3 = L => facts(L).map(([, v, k]) => `${v} ${k.toLowerCase()}`);
  const shortFacts = L => facts(L).map(([, v, k]) => `${v} ${({Bedrooms: 'beds', Bedroom: 'bed', 'Full Baths': 'full baths', 'Full Bath': 'full bath', 'Half Bath': 'half bath', 'Square Feet': 'sq ft'})[k] || k.toLowerCase()}`).join('  ·  ');
  const solid = (E, bg) => E.bw ? 'border:1pt solid var(--ink)' : `background:${bg}`;

  /* ================================ B14 PHOTO GRID ================================ */
  const B14 = {cond: "'xb Plex Cond','Plex Condensed',sans-serif", sans: "'Manrope',Helvetica,sans-serif"};
  L$['b14-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720;
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = box(m, 30, 372, 130, solid(E, 'var(--main)')) + ph(D, E, m + 382, 30, 338, 130);
    const tx = m + 22, tw = 328;
    h += txt('oh.label', ev.label, tx, 43, tw, `font:600 9.5pt/1 ${B14.sans};letter-spacing:2.2pt;text-transform:uppercase;color:${ac}`);
    h += X.line('title', 'Please sign in', tx, 54, tw, 38, 26, '', `font-family:${B14.cond};font-weight:700;text-transform:uppercase;letter-spacing:.4pt;color:${on}`);
    if(dated){
      h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, tx, 104, tw, 11, 8, '', `font:700 11pt/1 ${B14.sans};color:${ac}`);
      h += X.line('address', L.address, tx, 120, tw, 17, 12, '', `font-family:${B14.cond};font-weight:700;color:${on}`);
      h += X.line('place', X.cityZip(L), tx, 142, tw, 9.5, 8, '', `font:600 9.5pt/1 ${B14.sans};letter-spacing:.8pt;color:${on}`);
    } else {
      h += box(tx, 102, 40, 1, `background:${on};opacity:.5`);
      h += X.line('address', L.address, tx, 110, tw, 22, 14, '', `font-family:${B14.cond};font-weight:700;color:${on}`);
      h += X.line('place', X.cityZip(L), tx, 138, tw, 10.5, 8, '', `font:600 10.5pt/1 ${B14.sans};letter-spacing:.8pt;color:${ac}`);
    }
    // a main-color band carries the column labels, the grid's tile language; rows below on the paper
    h += box(m, 170, W, 27, solid(E, 'var(--main)'));
    h += siRows(E, {x0: m, W, numW: 46, widths: [218, 230, 104, 122], labY: 172, labH: 23, y0: 201, rh: 43, band: true,
      labStyle: `font-family:${B14.cond};font-weight:700;font-size:9.5pt;letter-spacing:1.2pt;color:${on};align-items:center`,
      num: (n, x0, y, rh) => box(x0 + 4, y + 7, 31, rh - 14, solid(E, 'var(--main)')) + `<div class="num" style="left:${x0 + 4}pt;top:${y + rh / 2 - 9}pt;width:31pt;font:700 15pt/18pt ${B14.cond};color:${on}">${n}</div>`,
      yn: `border:.9pt solid var(--main-on-paper);color:var(--main-on-paper);font-family:${B14.cond};border-radius:2pt`, vr: [6, 12]});
    h += foot1(D, [m, 512, W, 60]);
    return h;
  };
  L$['b14-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, tx = m + 18;
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = box(m, 22, 340, 78, solid(E, 'var(--main)')) + ph(D, E, m + 350, 22, 206, 78);
    h += txt('oh.label', ev.label, tx, 31, 300, `font:600 8.5pt/1 ${B14.sans};letter-spacing:2pt;text-transform:uppercase;color:${ac}`);
    h += X.line('address', L.address, tx, 42, 304, 22, 14, '', `font-family:${B14.cond};font-weight:700;color:${on}`);
    h += X.line('place', X.cityZip(L), tx, 70, 304, 9, 8, '', `font:600 9pt/1 ${B14.sans};letter-spacing:.6pt;color:${on}`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, tx, 83, 304, 9, 8, '', `font:700 9pt/1 ${B14.sans};color:${ac}`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:700 9.5pt/1 ${B14.cond};letter-spacing:.9pt;text-transform:uppercase;color:${mc}`);
    h += fbBody(D, E, {x: m + 6, top: 108, aw: 244, bx: m + 6 + 244 + 26, bw2: m + W - 6 - (m + 6 + 244 + 26), lab,
      pill: `border:1pt solid var(--main-on-paper);background:var(--tint);color:${mc};font:700 9pt/1 ${B14.cond};letter-spacing:.8pt;border-radius:2pt`,
      dot: () => `border:1pt solid var(--main-on-paper);background:var(--tint);color:${mc};border-radius:2pt;font:700 11pt/1 ${B14.cond}`,
      q: `font-family:${B14.sans};font-weight:700;color:var(--ink)`});
    h += box(m, 302, W, 0, 'border-top:.9pt solid var(--ink);opacity:.25');
    h += foot1(D, [m, 308, W, 54]);
    return h;
  };

  /* ================================ B26 AGENT PREVIEW ================================ */
  const B26 = {serif: "'Spectral',Georgia,serif", sans: "'Manrope',Helvetica,Arial,sans-serif"};
  L$['b26-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720;
    const hi = bw ? 'var(--ink)' : 'var(--on-dark)', ha = bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', 'background:var(--dark)');
    h += box(m - 5, 31, 410, 154, `border:1.2pt solid ${ha}`) + ph(D, E, m, 36, 400, 144);
    const bx = 476, bwid = 280, cx = bx + bwid / 2;
    h += X.line('oh.label', ev.label, bx, 38, bwid, 9.5, 8, '', `font:700 9.5pt/1 ${B26.sans};letter-spacing:4pt;text-transform:uppercase;text-align:center;color:${ha}`);
    const cap = `font-family:${B26.serif};font-weight:500;text-transform:uppercase;letter-spacing:1pt;text-align:center`;
    if(dated){
      h += X.line('title', 'Please', bx, 52, bwid, 27, 20, '', `${cap};color:${hi}`) + X.line('title2', 'sign in', bx, 82, bwid, 27, 20, '', `${cap};color:${ha}`);
      h += box(cx - 24, 120, 48, 1.4, `background:${ha}`);
      h += X.line('address', L.address, bx, 127, bwid, 15, 11, '', `font-family:${B26.serif};font-weight:500;text-align:center;color:${hi}`);
      h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, bx, 148, bwid, 10, 8, '', `font-family:${B26.serif};font-weight:500;text-align:center;color:${hi}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), bx, 166, bwid, 8.5, 8, '', `font:700 8.5pt/1 ${B26.sans};letter-spacing:2.4pt;text-align:center;color:${ha}`);
    } else {
      h += X.line('title', 'Please', bx, 54, bwid, 30, 20, '', `${cap};color:${hi}`) + X.line('title2', 'sign in', bx, 90, bwid, 30, 20, '', `${cap};color:${ha}`);
      h += box(cx - 24, 134, 48, 1.4, `background:${ha}`);
      h += X.line('address', L.address, bx, 142, bwid, 17, 12, '', `font-family:${B26.serif};font-weight:500;text-align:center;color:${hi}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), bx, 166, bwid, 8.5, 8, '', `font:700 8.5pt/1 ${B26.sans};letter-spacing:2.4pt;text-align:center;color:${ha}`);
    }
    // the writing area on a paper panel inside the flyer's accent-outlined box
    const top = 200, bot = 504;
    h += box(m, top, W, bot - top, `${bw ? '' : 'background:var(--paper);'}border:1.2pt solid ${bw ? 'var(--ink)' : 'var(--accent-on-paper)'}`);
    const x0 = m + 16, W2 = W - 32, mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    h += siRows(E, {x0, W: W2, numW: 42, widths: [200, 196, 104, W2 - 42 - 500], labY: top + 8, labH: 20, y0: top + 34, rh: 38,
      labStyle: `font-family:${B26.sans};font-weight:700;font-size:8pt;letter-spacing:1.8pt;color:${mc};align-items:center`,
      num: (n, xx, y, rh) => `<div class="num" style="left:${xx}pt;top:${y + rh / 2 - 9}pt;width:38pt;font:500 15pt/18pt ${B26.serif};color:${bw ? 'var(--ink)' : 'var(--accent-on-paper)'}">${n}</div>`,
      yn: `border:.8pt solid ${mc};color:${mc};font-family:${B26.sans}`, vr: [6, 12]});
    h += foot1(D, [m, 514, W, 58], {dark: !bw});
    return h;
  };
  L$['b26-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556;
    const hi = bw ? 'var(--ink)' : 'var(--on-dark)', ha = bw ? 'var(--ink)' : 'var(--accent-on-dark)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', 'background:var(--dark)');
    h += box(m + 1, 26, 160, 78, `border:1.2pt solid ${ha}`) + ph(D, E, m + 6, 31, 150, 68);
    const tx = m + 184, tw = 584 - tx;
    h += X.line('oh.label', ev.label, tx, 27, tw, 8.5, 8, '', `font:700 8.5pt/1 ${B26.sans};letter-spacing:3pt;text-transform:uppercase;color:${ha}`);
    h += X.line('address', L.address, tx, 38, tw, 17, 12, '', `font-family:${B26.serif};font-weight:500;color:${hi}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), tx, 61, tw, 8.5, 8, '', `font:700 8.5pt/1 ${B26.sans};letter-spacing:2pt;color:${ha}`);
    const by = 75, bh = 29, dw = 216;
    h += box(tx, by, tw, bh, `border:1.2pt solid ${ha}`) + box(tx + dw, by + 6, 0, bh - 12, `border-left:.8pt solid ${ha};opacity:.6`);
    h += txt('', 'Date', tx + 10, by + 4.5, 60, `font:700 8pt/1 ${B26.sans};letter-spacing:2.2pt;text-transform:uppercase;color:${ha}`) + txt('', 'Time', tx + dw + 10, by + 4.5, 60, `font:700 8pt/1 ${B26.sans};letter-spacing:2.2pt;text-transform:uppercase;color:${ha}`);
    h += X.line('oh.date', ev.long, tx + 10, by + 14, dw - 20, 11, 8, '', `font-family:${B26.serif};font-weight:500;color:${hi}`) + X.line('oh.time', ev.time, tx + dw + 10, by + 14, tw - dw - 20, 11, 8, '', `font-family:${B26.serif};font-weight:500;color:${hi}`);
    const top = 112;
    h += box(m, top, W, 190, `${bw ? '' : 'background:var(--paper);'}border:1.2pt solid ${bw ? 'var(--ink)' : 'var(--accent-on-paper)'}`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:700 8.5pt/1 ${B26.sans};letter-spacing:1.4pt;text-transform:uppercase;color:${mc}`);
    h += fbBody(D, E, {x: m + 16, top: top - 2, aw: 240, bx: m + 16 + 240 + 26, bw2: m + W - 16 - (m + 16 + 240 + 26), lab,
      pill: `border:.9pt solid ${bw ? 'var(--ink)' : 'var(--accent-on-paper)'};color:${mc};font:700 8pt/1 ${B26.sans};letter-spacing:.6pt`,
      dot: () => `border:.9pt solid ${bw ? 'var(--ink)' : 'var(--accent-on-paper)'};background:var(--tint);color:${mc};font:500 10.5pt/1 ${B26.serif}`,
      q: `font-family:${B26.serif};font-weight:500;color:var(--ink)`});
    h += foot1(D, [m, 310, W, 52], {dark: !bw});
    return h;
  };

  /* ================================ B46A ARROW ================================ */
  const ARROW = [[0, 0], [.9, 0], [1, .5], [.9, 1], [0, 1], [.1, .5]], arrowClip = `polygon(${ARROW.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(',')})`;
  // the house in an arrow with its outlined echo a little down and to the right (the flyer's signature)
  const arrowPhoto = (D, E, x, y, w, hh, off) => {
    const pts = ARROW.map(([a, b]) => `${x + off + a * w},${y + off + b * hh}`).join(' ');
    return `<svg class="abs" style="left:0;top:0;width:${E.W}pt;height:${E.H}pt;overflow:visible" viewBox="0 0 ${E.W} ${E.H}"><polygon points="${pts}" fill="none" stroke="${E.bw ? '#111' : 'var(--accent)'}" stroke-width="1.6"/></svg>` +
      ph(D, E, x, y, w, hh, `clip-path:${arrowClip}`); };
  const sideTab = (E, tw, text) => { const cx = (edge(E) + tw) / 2;
    return (E.bw ? box(tw, E.home ? 18 : -9, 0, E.H - (E.home ? 36 : -18), 'border-left:1pt solid var(--ink)') : E.fl(0, 0, tw, E.H, 'ltb', 'background:var(--main)')) +
      `<div class="abs nowrap" data-slot="place.tab" style="left:${cx - 350}pt;top:${E.H / 2 - 8}pt;width:700pt;height:16pt;transform:rotate(-90deg);text-align:center;font:600 9pt/16pt 'Jost';letter-spacing:4pt;text-transform:uppercase;color:${E.bw ? 'var(--ink)' : 'var(--on-main)'}">${esc(text)}</div>`; };
  L$['b46a-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, TW = 44, x0 = 62, W = 694;
    const hi = bw ? 'var(--ink)' : 'var(--on-dark)', ha = bw ? 'var(--ink)' : 'var(--accent-on-dark)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', 'background:var(--dark)');
    h += sideTab(E, TW, X.cityZip(L)) + arrowPhoto(D, E, x0, 34, 320, 128, 10);
    const tx = 414, tw = 756 - tx, cap = `font-family:'Jost';font-weight:600;text-transform:uppercase;letter-spacing:1.5pt;color:${hi}`;
    h += txt('oh.label', ev.label, tx, 36, tw, `font:600 9.5pt/1 'Jost';letter-spacing:3.4pt;text-transform:uppercase;color:${ha}`);
    if(dated){
      h += X.line('title', 'Please sign in', tx, 50, tw, 28, 20, '', cap);
      h += X.line('oh.date', ev.long, tx, 92, tw, 15, 11, '', `font:500 15pt/1 'Jost';color:${hi}`);
      h += X.line('oh.time', ev.time, tx, 113, tw, 12, 9, '', `font:600 12pt/1 'Jost';letter-spacing:1pt;text-transform:uppercase;color:${ha}`);
      h += X.line('address', L.address, tx, 134, tw, 16, 11, '', `font:600 16pt/1 'Jost';color:${hi}`);
      h += X.line('place', X.cityZip(L), tx, 157, tw, 9, 8, '', `font:500 9pt/1 'Jost';letter-spacing:1.6pt;text-transform:uppercase;color:${ha}`);
    } else {
      h += X.line('title', 'Please', tx, 50, tw, 34, 24, '', cap) + X.line('title2', 'sign in', tx, 90, tw, 34, 24, '', cap.replace(hi, ha));
      h += X.line('address', L.address, tx, 136, tw, 17, 12, '', `font:600 17pt/1 'Jost';color:${hi}`);
      h += X.line('place', X.cityZip(L), tx, 160, tw, 9, 8, '', `font:500 9pt/1 'Jost';letter-spacing:1.6pt;text-transform:uppercase;color:${ha}`);
    }
    // the white box (the flyer's event box) with the accent edge holds the rows
    const top = 192, bot = 508;
    h += box(x0, top, W, bot - top, `background:#fff;border:1.2pt solid ${bw ? 'var(--ink)' : 'var(--accent)'}`);
    const rx = x0 + 14, W2 = W - 28;
    h += siRows(E, {x0: rx, W: W2, numW: 44, widths: [190, 188, 104, W2 - 44 - 482], labY: top + 8, labH: 20, y0: top + 34, rh: 39,
      labStyle: `font-family:'Jost';font-weight:600;font-size:8.5pt;letter-spacing:1.6pt;text-transform:uppercase;color:${mc};align-items:center`,
      num: (n, xx, y, rh) => `<div class="abs" style="left:${xx + 2}pt;top:${y + (rh - 22) / 2}pt;width:37pt;height:22pt;background:${bw ? 'var(--ink)' : 'var(--main)'};clip-path:polygon(0 0,80% 0,100% 50%,80% 100%,0 100%);display:flex;align-items:center;padding-left:9pt;font:600 11pt/1 'Jost';color:${bw ? '#fff' : 'var(--on-main)'}">${n}</div>`,
      yn: `border:.9pt solid ${mc};color:${mc};font-family:'Jost'`, vr: [7, 14]});
    h += foot1(D, [x0, 516, W, 58], {dark: !bw});
    return h;
  };
  L$['b46a-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, TW = 40, x0 = 56, W = 528;
    const hi = bw ? 'var(--ink)' : 'var(--on-dark)', ha = bw ? 'var(--ink)' : 'var(--accent-on-dark)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', 'background:var(--dark)');
    h += sideTab(E, TW, X.cityZip(L)) + arrowPhoto(D, E, x0, 24, 168, 72, 8);
    const tx = x0 + 192, tw = 584 - tx;
    h += txt('oh.label', ev.label, tx, 27, tw, `font:600 8.5pt/1 'Jost';letter-spacing:3pt;text-transform:uppercase;color:${ha}`);
    h += X.line('address', L.address, tx, 40, tw, 22, 14, '', `font:600 22pt/1 'Jost';color:${hi}`);
    h += X.line('place', X.cityZip(L), tx, 68, tw, 8.5, 8, '', `font:500 8.5pt/1 'Jost';letter-spacing:1.8pt;text-transform:uppercase;color:${ha}`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, tx, 82, tw, 11, 8, '', `font:500 11pt/1 'Jost';color:${hi}`);
    const top = 112;
    h += box(x0, top, W, 190, `background:#fff;border:1.2pt solid ${bw ? 'var(--ink)' : 'var(--accent)'}`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:600 8.5pt/1 'Jost';letter-spacing:1.5pt;text-transform:uppercase;color:${mc}`);
    h += fbBody(D, E, {x: x0 + 14, top: top - 2, aw: 236, bx: x0 + 14 + 236 + 26, bw2: x0 + W - 14 - (x0 + 14 + 236 + 26), lab,
      pill: `border:1pt solid ${mc};color:${mc};font:600 8.5pt/1 'Jost';letter-spacing:.9pt;text-transform:uppercase`,
      dot: () => `border:1pt solid ${mc};background:var(--tint);color:${mc};font:600 10.5pt/1 'Jost'`,
      q: `font-family:'Jost';font-weight:600;color:var(--ink)`});
    h += foot1(D, [x0, 310, W, 52], {dark: !bw});
    return h;
  };

  /* ================================ B46B CHEVRON ================================ */
  const SORA = "'xb Sora','Sora',Helvetica,sans-serif";
  // the house with a V-cut foot and the accent line that follows it, a little below
  const vee = [[0, 0], [1, 0], [1, .8], [.5, 1], [0, .8]], veeClip = `polygon(${vee.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(',')})`;
  const veePhoto = (D, E, x, y, w, hh, off) => {
    const pts = [[0, .8], [.5, 1], [1, .8]].map(([a, b]) => `${x + a * w},${y + off + b * hh}`).join(' ');
    return `<svg class="abs" style="left:0;top:0;width:${E.W}pt;height:${E.H}pt;overflow:visible" viewBox="0 0 ${E.W} ${E.H}"><polyline points="${pts}" fill="none" stroke="${E.bw ? '#111' : 'var(--accent)'}" stroke-width="2"/></svg>` +
      ph(D, E, x, y, w, hh, `clip-path:${veeClip}`); };
  const diamond = (x, y, s, E, fill) => box(x - s / 2, y - s / 2, s, s, `transform:rotate(45deg);${fill ? `background:${E.bw ? 'var(--ink)' : 'var(--accent)'}` : `border:1pt solid ${E.bw ? 'var(--ink)' : 'var(--accent)'};background:var(--tint)`}`);
  L$['b46b-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720;
    const hi = bw ? 'var(--ink)' : 'var(--on-dark)', ha = bw ? 'var(--ink)' : 'var(--accent-on-dark)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', 'background:var(--dark)');
    h += veePhoto(D, E, 456, 30, 300, 152, 11);
    const tx = m, tw = 400, cx = tx + tw / 2;
    h += X.line('oh.label', ev.label, tx, 40, tw, 10, 8, '', `font:600 10pt/1 ${SORA};letter-spacing:4pt;text-transform:uppercase;text-align:center;color:${ha}`);
    h += X.line('title', 'Please sign in', tx, 58, tw, 28, 20, '', `font:700 28pt/1 ${SORA};letter-spacing:2pt;text-transform:uppercase;text-align:center;color:${hi}`);
    h += box(cx - 74, 106, 56, .9, `background:${ha};opacity:.7`) + box(cx + 18, 106, 56, .9, `background:${ha};opacity:.7`) + diamond(cx, 106, 8, E, true);
    if(dated){
      h += X.line('address', L.address, tx, 114, tw, 19, 13, '', `font:600 19pt/1 ${SORA};text-align:center;color:${hi}`);
      h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, tx, 140, tw, 11, 8, '', `font:600 11pt/1 ${SORA};text-align:center;color:${ha}`);
      h += X.line('place', X.cityZip(L), tx, 160, tw, 9, 8, '', `font:400 9pt/1 ${SORA};letter-spacing:2pt;text-transform:uppercase;text-align:center;color:${hi}`);
    } else {
      h += X.line('address', L.address, tx, 116, tw, 22, 14, '', `font:600 22pt/1 ${SORA};text-align:center;color:${hi}`);
      h += X.line('place', X.cityZip(L), tx, 146, tw, 9.5, 8, '', `font:400 9.5pt/1 ${SORA};letter-spacing:2.2pt;text-transform:uppercase;text-align:center;color:${ha}`);
    }
    const top = 208, bot = 504;
    h += box(m, top, W, bot - top, `background:#fff;border:1.2pt solid ${bw ? 'var(--ink)' : 'var(--accent)'}`);
    const x0 = m + 14, W2 = W - 28;
    h += siRows(E, {x0, W: W2, numW: 44, widths: [200, 206, 104, W2 - 44 - 510], labY: top + 7, labH: 20, y0: top + 32, rh: 37,
      labStyle: `font-family:${SORA};font-weight:700;font-size:8pt;letter-spacing:1.2pt;text-transform:uppercase;color:${mc};align-items:center`,
      num: (n, xx, y, rh) => diamond(xx + 20, y + rh / 2, 20, E) + `<div class="num" style="left:${xx + 2}pt;top:${y + rh / 2 - 6}pt;width:36pt;font:700 9.5pt/12pt ${SORA};color:${mc}">${n}</div>`,
      yn: `border:.9pt solid ${mc};color:${mc};font-family:${SORA}`, vr: [6, 12]});
    h += foot1(D, [m, 514, W, 58], {dark: !bw});
    return h;
  };
  L$['b46b-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556;
    const hi = bw ? 'var(--ink)' : 'var(--on-dark)', ha = bw ? 'var(--ink)' : 'var(--accent-on-dark)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', 'background:var(--dark)');
    h += veePhoto(D, E, m + 4, 22, 176, 74, 8);
    const tx = m + 208, tw = 584 - tx, cx = tx + tw / 2;
    h += X.line('oh.label', ev.label, tx, 28, tw, 8.5, 8, '', `font:600 8.5pt/1 ${SORA};letter-spacing:3.4pt;text-transform:uppercase;text-align:center;color:${ha}`);
    h += X.line('address', L.address, tx, 41, tw, 19, 13, '', `font:600 19pt/1 ${SORA};text-align:center;color:${hi}`);
    h += X.line('place', X.cityZip(L), tx, 67, tw, 8, 8, '', `font:400 8pt/1 ${SORA};letter-spacing:2pt;text-transform:uppercase;text-align:center;color:${hi}`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, tx, 82, tw, 10, 8, '', `font:600 10pt/1 ${SORA};text-align:center;color:${ha}`);
    const top = 114;
    h += box(m, top, W, 188, `background:#fff;border:1.2pt solid ${bw ? 'var(--ink)' : 'var(--accent)'}`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:700 8pt/1 ${SORA};letter-spacing:1pt;text-transform:uppercase;color:${mc}`);
    h += fbBody(D, E, {x: m + 14, top: top - 4, aw: 242, bx: m + 14 + 242 + 26, bw2: m + W - 14 - (m + 14 + 242 + 26), lab,
      pill: `border:1pt solid ${bw ? 'var(--ink)' : 'var(--accent)'};color:${mc};font:600 8pt/1 ${SORA};letter-spacing:.4pt`,
      dot: () => `border:1pt solid ${bw ? 'var(--ink)' : 'var(--accent)'};background:var(--tint);color:${mc};font:600 10pt/1 ${SORA}`,
      q: `font-family:${SORA};font-weight:600;color:var(--ink)`});
    h += foot1(D, [m, 310, W, 52], {dark: !bw});
    return h;
  };

  /* ================================ B47 ITINERARY ================================ */
  const MONT = "'xb Montserrat','Montserrat',Helvetica,sans-serif", PLAY = "'xb Playfair','Playfair Display',Georgia,serif";
  // one ruled itinerary row: tracked label, hairline under, the value in Playfair
  const itin = (E, lab, x, y, hh, lw) => txt('', lab, x, y + 9, lw, `font:700 8pt/1 ${MONT};letter-spacing:2.6pt;text-transform:uppercase;color:${E.bw ? 'var(--ink)' : 'var(--main-on-paper)'}`);
  const titleBar = (E, y, hh) => E.bw ? E.fl(0, y, 792, hh, 'lr', 'border-top:1.2pt solid var(--ink);border-bottom:1.2pt solid var(--ink)') : E.fl(0, y, 792, hh, 'lr', 'background:var(--main)') + E.fl(0, y, 792, 3, 'lr', 'background:var(--accent)');
  L$['b47-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720, e = edge(E);
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)', ink = 'var(--ink)';
    let h = ph(D, E, e, e, 372 - e, 150 - e);
    // the itinerary at the right of the photo
    const lx = 396, vx = 472, ex = 756, ty = 26;
    const val = (slot, t, y, size, floor) => X.line(slot, t, vx + 14, y, ex - vx - 14, size, floor, '', `font-family:${PLAY};font-weight:600;color:${ink}`);
    const hair = y => box(lx, y, ex - lx, 0, 'border-top:.7pt solid var(--line)');
    if(dated){
      h += itin(E, 'When', lx, ty, 38, 70) + val('oh.date', ev.long, ty + 9, 17, 11) + hair(ty + 38);
      h += itin(E, 'Time', lx, ty + 38, 38, 70) + val('oh.time', ev.time, ty + 47, 17, 11) + hair(ty + 76);
      h += itin(E, 'Where', lx, ty + 76, 48, 70) + val('address', L.address, ty + 80, 17, 11) + X.line('place', X.cityZip(L), vx + 14, ty + 104, ex - vx - 14, 9, 8, '', `font:700 9pt/1 ${MONT};letter-spacing:1.8pt;text-transform:uppercase;color:${mc}`);
      h += box(vx, ty, 0, 124, 'border-left:.7pt solid var(--line)');
    } else {
      h += itin(E, 'Where', lx, ty, 58, 70) + val('address', L.address, ty + 8, 22, 13) + X.line('place', X.cityZip(L), vx + 14, ty + 38, ex - vx - 14, 9.5, 8, '', `font:700 9.5pt/1 ${MONT};letter-spacing:1.8pt;text-transform:uppercase;color:${mc}`) + hair(ty + 58);
      h += itin(E, 'The home', lx, ty + 58, 66, 70);
      lines3(L).forEach((t, i) => { h += txt(`fact.${i}`, t, vx + 14, ty + 68 + i * 18, ex - vx - 14, `font:500 13pt/16pt ${PLAY};color:${ink}`); });
      h += box(vx, ty, 0, 124, 'border-left:.7pt solid var(--line)');
    }
    // the title bar from the page edge, the flyer's own: main color with an accent line on top
    h += titleBar(E, 158, 38);
    h += X.line('title', 'Please sign in', m, 167, 420, 18, 14, '', `font:800 18pt/1 ${MONT};letter-spacing:1.4pt;text-transform:uppercase;color:${on}`);
    h += X.line('oh.label', ev.label, 480, 171, 276, 9, 8, '', `text-align:right;font:700 9pt/1 ${MONT};letter-spacing:3pt;text-transform:uppercase;color:${ac}`);
    h += siRows(E, {x0: m, W, numW: 44, widths: [210, 226, 104, 136], labY: 202, labH: 22, y0: 228, rh: 39, band: true,
      labStyle: `font-family:${MONT};font-weight:700;font-size:8pt;letter-spacing:1.6pt;text-transform:uppercase;color:${mc};align-items:center`,
      num: (n, x0, y, rh) => `<div class="num" style="left:${x0}pt;top:${y + rh / 2 - 11}pt;width:42pt;font:600 18pt/22pt ${PLAY};color:${mc}">${n}</div>`,
      yn: `border:.9pt solid ${mc};color:${mc};font-family:${MONT};font-weight:600`, vr: [0, 0]});
    h += foot1(D, [m, 510, W, 58]);
    return h;
  };
  L$['b47-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, e = edge(E);
    const on = bw ? 'var(--ink)' : 'var(--on-main)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)', ink = 'var(--ink)';
    let h = ph(D, E, e, e, 206 - e, 100 - e);
    h += bw ? E.fl(214, 0, 400, 52, 'tr', 'border-top:1.2pt solid var(--ink);border-bottom:1.2pt solid var(--ink)') : E.fl(214, 0, 400, 50, 'tr', 'background:var(--main)') + E.fl(214, 50, 400, 3, 'r', 'background:var(--accent)');
    h += X.line('title', 'Your feedback', 228, 25, 340, 17, 13, '', `font:800 17pt/1 ${MONT};letter-spacing:1.3pt;text-transform:uppercase;color:${on}`);
    const lx = 228, vx = 296, row = (lab, slot, t, y) => txt('', lab, lx, y + 7.5, 64, `font:700 8pt/1 ${MONT};letter-spacing:2.4pt;text-transform:uppercase;color:${mc}`) +
      X.line(slot, t, vx, y + 4, 584 - vx, 12, 8, '', `font-family:${PLAY};font-weight:600;color:${ink}`) + box(lx, y + 23, 584 - lx, 0, 'border-top:.7pt solid var(--line)');
    h += row('When', 'oh.date', `${ev.long}   ·   ${ev.time}`, 62) + row('Where', 'address', `${L.address}   ·   ${X.cityZip(L)}`, 85);
    h += box(vx - 10, 62, 0, 46, 'border-left:.7pt solid var(--line)');
    h += X.line('oh.label', ev.label, 404, 30, 172, 8.5, 8, '', `text-align:right;font:700 8.5pt/1 ${MONT};letter-spacing:2.4pt;text-transform:uppercase;color:${bw ? 'var(--ink)' : 'var(--accent-on-main)'}`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:700 8pt/1 ${MONT};letter-spacing:1.6pt;text-transform:uppercase;color:${mc}`);
    h += fbBody(D, E, {x: m + 6, top: 116, aw: 244, bx: m + 6 + 244 + 26, bw2: m + W - 6 - (m + 6 + 244 + 26), lab,
      pill: `border:.9pt solid ${mc};background:#fff;color:${mc};font:600 8pt/1 ${MONT};letter-spacing:.6pt`,
      dot: () => `border:.9pt solid ${mc};background:#fff;color:${mc};font:600 10.5pt/1 ${PLAY}`,
      q: `font-family:${PLAY};font-weight:600;color:var(--ink)`});
    h += foot1(D, [m, 310, W, 52]);
    return h;
  };

  /* ================================ P01 RULED EDITORIAL ================================ */
  const EPI = "'xb Epilogue','Epilogue',Helvetica,sans-serif", HAN = "'xb Hanken','Hanken Grotesk',Helvetica,sans-serif";
  const rule = (x, y, w, t) => box(x, y, w, t || 1.2, 'background:var(--ink)');
  L$['p01-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720;
    const mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    const big = `font-family:${EPI};font-weight:600;text-transform:uppercase;letter-spacing:-2.4pt;color:var(--ink)`;
    // the headline in two lines between rules, the second pushed to the right; the label as the short "join" note at the left
    let h = rule(m, 24, W) + X.line('title', 'Please', m - 3, 24, 520, 50, 32, '', big) + rule(m, 84, W);
    const [l1, l2] = labelLines(ev.label);
    h += X.line('oh.label', l1, m, 98, 200, 14, 10, '', `font:500 14pt/1 ${HAN};color:${mc}`) + (l2 ? X.line('oh.label2', l2, m, 117, 200, 14, 10, '', `font:500 14pt/1 ${HAN};color:${mc}`) : '');
    h += X.line('title2', 'sign in', m + 190, 84, W - 190 + 3, 50, 32, '', `${big};text-align:right`) + rule(m, 144, W);
    h += ph(D, E, m, 154, 200, 70);
    const mx = m + 218, mw = 270, rx = m + 500, rw = W - 500;
    if(dated){
      h += X.line('address', L.address, mx, 156, mw, 22, 15, '', `font-family:${EPI};font-weight:600;letter-spacing:-.3pt;color:var(--ink)`);
      h += X.line('place', X.cityZip(L), mx, 184, mw, 10, 8, '', `font:600 10pt/1 ${HAN};letter-spacing:2pt;text-transform:uppercase;color:${mc}`);
      h += X.line('oh.facts', shortFacts(L), mx, 204, mw, 9, 8, '', `font:700 9pt/1 ${HAN};letter-spacing:.8pt;text-transform:uppercase;color:var(--ink)`);
      h += X.line('oh.date', ev.long, rx, 158, rw, 20, 13, '', `font-family:${EPI};font-weight:600;letter-spacing:-.6pt;text-align:right;color:var(--ink)`);
      h += X.line('oh.time', ev.time, rx, 186, rw, 15, 10, '', `font:600 15pt/1 ${HAN};text-align:right;color:${mc}`);
    } else {
      h += txt('welcome', 'Welcome to', mx, 158, mw, `font:500 12pt/1 ${HAN};color:${mc}`);
      h += X.line('address', L.address, mx, 174, mw, 22, 15, '', `font-family:${EPI};font-weight:600;letter-spacing:-.3pt;color:var(--ink)`);
      h += X.line('place', X.cityZip(L), mx, 204, mw, 10, 8, '', `font:600 10pt/1 ${HAN};letter-spacing:2pt;text-transform:uppercase;color:${mc}`);
      lines3(L).forEach((t, i) => { h += txt(`fact.${i}`, t.toUpperCase(), rx, 162 + i * 18, rw, `text-align:right;font:700 10pt/1 ${HAN};letter-spacing:1pt;color:var(--ink)`); });
    }
    h += rule(m, 232, W);
    h += siRows(E, {x0: m, W, numW: 44, widths: [210, 226, 104, 136], labY: 236, labH: 20, y0: 258, rh: 36, noH: false,
      labStyle: `font-family:${HAN};font-weight:700;font-size:8.5pt;letter-spacing:1.4pt;text-transform:uppercase;color:${mc};align-items:center`,
      num: (n, x0, y, rh) => `<div class="num" style="left:${x0}pt;top:${y + rh / 2 - 10}pt;width:40pt;font:600 15pt/20pt ${EPI};letter-spacing:-.4pt;color:var(--ink)">${n}</div>`,
      yn: `border:1pt solid var(--ink);color:var(--ink);font-family:${HAN};border-radius:0`, vr: [4, 8]});
    h += rule(m, 513, W);
    h += foot1(D, [m, 520, W, 58]);
    return h;
  };
  L$['p01-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = rule(m, 20, W) + X.line('title', 'Your feedback', m - 2, 24, 390, 32, 22, '', `font-family:${EPI};font-weight:600;text-transform:uppercase;letter-spacing:-1.4pt;color:var(--ink)`);
    h += rule(m, 66, 392);
    h += X.line('address', L.address, m, 71, 392, 15, 11, '', `font-family:${EPI};font-weight:600;letter-spacing:-.2pt;color:var(--ink)`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, m, 90, 392, 10, 8, '', `font:600 10pt/1 ${HAN};color:${mc}`);
    h += ph(D, E, m + 412, 26, 144, 56);
    h += X.line('oh.label', ev.label, m + 412, 87, 144, 8.5, 8, '', `text-align:right;font:700 8.5pt/1 ${HAN};letter-spacing:1.4pt;text-transform:uppercase;color:var(--ink)`);
    h += X.line('place', X.cityZip(L), m + 412, 99, 144, 8.5, 8, '', `text-align:right;font:600 8.5pt/1 ${HAN};letter-spacing:1.2pt;text-transform:uppercase;color:${mc}`);
    h += rule(m, 112, W);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:700 8.5pt/1 ${HAN};letter-spacing:1.3pt;text-transform:uppercase;color:${mc}`);
    h += fbBody(D, E, {x: m + 2, top: 118, aw: 246, bx: m + 2 + 246 + 26, bw2: m + W - 2 - (m + 2 + 246 + 26), lab,
      pill: `border:1pt solid var(--ink);color:var(--ink);font:600 8.5pt/1 ${HAN};letter-spacing:.6pt;border-radius:0`,
      dot: () => `border:1pt solid var(--ink);color:var(--ink);border-radius:0;font:600 10.5pt/1 ${EPI}`,
      q: `font-family:${EPI};font-weight:600;letter-spacing:-.2pt;color:var(--ink)`});
    h += foot1(D, [m, 312, W, 52]);
    return h;
  };
})();
