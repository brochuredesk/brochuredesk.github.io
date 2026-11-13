/* Open House extras for library flyers, batch d (owner 11/2/2026: roll out to every library flyer).
   Sign-in sheets and broker feedback cards in the look of:
     P13 Logo Grid     cream paper, white mats with a soft shadow, a band of the main color at the foot, Red Hat Display in wide capitals
     P15 Pale Gallery  a pale tint of the main color for the page, a main-color band with centered Josefin capitals, white boxes
     P16 Modern Frame  a deep main-color frame with a thin accent line inside it, clean Hanken Grotesk, everything centered
     P18 Asymmetric    a photo with an offset block of main color and an accent corner, stacked caps, a dark band at the foot
     P19 Color Grid    blocks of the main color in a grid with the photo as one tile, Schibsted Grotesk
     P20 Garden Serif  the page in the main color, italic Libre Baskerville capitals, the label up a thin rule at the left edge
   The look takes the agent's brand kit (libTheme), sample branding only on these files. Helpers: Extras.lib (looks.js). */
(function(){
  const X = Extras, L$ = X.looks, {cols, labels, qs, box, txt, ph, foot1, esc, libTheme, icon, facts, mixOf} = X.lib;
  const up = s => String(s || '').toUpperCase();

  // themes: P15 pages are a pale tint of the main color
  X.themes = X.themes || {};
  ['p13', 'p16', 'p18', 'p19', 'p20'].forEach(s => X.themes[s] = libTheme);
  X.themes.p15 = (D, bw, root) => { libTheme(D, bw, root); if(!bw){ const c = (D.brand || {}).colors || {}; root.setProperty('--paper', mixOf(c.main || '#2f4a3a', '#ffffff', .88)); } };

  // ---------- shared builders: the writing rows and the feedback fields ----------
  // rows: o {x0, W, y0, rh, numW, widths, labY, labH, lab, yd, yn, row(i, y, n, cs), rule, vr}
  const tbl = (E, o) => {
    const cs = cols(o.x0, o.numW, o.widths), rh = o.rh; let h = labels(cs, o.labY, o.labH, o.lab || '');
    for(let i = 0; i < 7; i++){
      const y = o.y0 + i * rh; h += o.row(i, y, E.first + i, cs);
      if(o.rule) h += box(o.x0, y + rh, o.W, 0, 'border-top:.5pt solid var(--line)');
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - (o.yd + 3), y + (rh - o.yd) / 2 + (o.yy || 0), o.yd, o.yn); });
    }
    if(o.vr !== false){ const v = o.vr || 6; cs.forEach(c => { h += `<div class="vrule" style="left:${c.x}pt;top:${o.y0 + v}pt;height:${7 * rh - 2 * v}pt"></div>`; }); }
    return h;
  };
  // the card's fields from the top T: price, condition, how it shows, the seller question, name and contact on the left (ax, aw);
  // the three prompts on the right (bx, bw). kit {lab, q, pill, dot, gap}
  const fbBody = (E, FB, o) => {
    const k = o.kit, T = o.T, ax = o.ax, aw = o.aw, bx = o.bx, bw = o.bw; let h = '';
    h += k.lab('q.price', FB.price, ax, T + 8, aw);
    h += `<div class="abs" style="left:${ax}pt;top:${T + 20}pt;width:${aw}pt;display:flex;gap:${k.gap || 6}pt">` + FB.choices.map(t => `<span class="pill" style="flex:1;height:20pt;${k.pill}">${t}</span>`).join('') + '</div>';
    h += k.lab('q.cond', FB.cond, ax, T + 56, 100) + X.dots(ax + 108, T + 49, aw - 108, 22, k.dot);
    h += k.lab('q.shows', FB.shows, ax, T + 84, 100) + X.dots(ax + 108, T + 77, aw - 108, 22, k.dot);
    h += txt('q.scale', FB.scale, ax + 108, T + 101, aw - 108, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += k.q('q.seller', FB.seller, ax, T + 116, aw) + X.wline(ax, T + 144, aw) + X.wline(ax, T + 160, aw);
    h += k.lab('q.name', FB.name, ax, T + 166, 100) + X.wline(ax, T + 183, 108) + k.lab('q.contact', FB.contact, ax + 120, T + 166, aw - 120) + X.wline(ax + 120, T + 183, aw - 120);
    if(!o.noDivider) h += box(ax + aw + 13, T + 10, 0, 170, 'border-left:.5pt solid var(--line)');
    FB.prompts.forEach(([key, t], i) => { const y = T + 6 + i * 60;
      h += k.q('q.' + key, t, bx, y, bw) + X.wline(bx, y + 26, bw) + X.wline(bx, y + 41, bw) + X.wline(bx, y + 56, bw); });
    return h;
  };
  // up to three of the listing's facts across [x, x + w], with a hairline between them
  const factRow = (L, x, y, w, size, style, vr, hgt) => {
    const f = facts(L).slice(0, 3), cw = w / f.length; let h = '';
    f.forEach(([ic, v, k], i) => {
      h += txt(`fact.${i}`, `${v} ${k.toLowerCase()}`, x + i * cw, y, cw, `text-align:center;font-size:${size}pt;line-height:${size * 1.2}pt;${style}`);
      if(i) h += box(x + i * cw, y - 3, 0, hgt || size * 1.2 + 6, `border-left:.7pt solid ${vr}`);
    });
    return h;
  };
  const lineNum = (E, n) => E.first + n;

  /* ================================ P13 LOGO GRID ================================ */
  const P13 = "font-family:'Red Hat Display',Helvetica,sans-serif";
  const p13Mat = (x, y, w, h, E) => box(x, y, w, h, E.bw ? 'border:.9pt solid var(--ink);background:#fff' : 'background:#fff;box-shadow:0 2pt 8pt rgba(0,0,0,.18)');

  L$['p13-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720, bandTop = 466;
    const mc = bw ? 'var(--ink)' : 'var(--main-on-paper)', on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-paper)';
    let h = bw ? box(m, bandTop, W, 0, 'border-top:1.2pt solid var(--ink)') : E.fl(0, bandTop, 792, 612 - bandTop, 'lrb', 'background:var(--main)');
    h += X.line('oh.label', ev.label, m, 34, 440, 28, 16, '', `${P13};font-weight:700;letter-spacing:5pt;text-transform:uppercase;color:${mc}`);
    h += box(m, 73, 60, 1.4, `background:${ac}`);
    h += X.line('title', 'Please sign in', m, 82, 440, 34, 22, '', `${P13};font-weight:700;letter-spacing:1.2pt;text-transform:uppercase;color:var(--ink)`);
    h += X.line('address', L.address, m, 124, 440, 19, 13, '', `${P13};font-weight:700;color:var(--ink)`);
    h += X.line('place', up(X.cityZip(L)), m, 150, 440, 9.5, 8, '', `${P13};font-weight:500;letter-spacing:2pt;color:${ac}`);
    h += p13Mat(548, 28, 208, 128, E) + ph(D, E, 556, 36, 192, 112);
    // the writing area on a white mat
    const x0 = m + 14, W2 = W - 28;
    h += p13Mat(m, 166, W, 292, E);
    h += tbl(E, {x0, W: W2, y0: 198, rh: 36, numW: 38, widths: [210, 206, 100, W2 - 38 - 210 - 206 - 100], labY: 170, labH: 22, yd: 17, yn: `border:.8pt solid var(--main-on-paper);color:${mc};${P13}`,
      lab: `${P13};font-weight:700;font-size:8.4pt;letter-spacing:1.6pt;color:${mc};align-items:center`,
      row: (i, y, n) => (i % 2 === 0 ? `<div class="rowband" style="left:${x0}pt;top:${y}pt;width:${W2}pt;height:36pt;background:var(--tint)"></div>` : '') +
        `<div class="num" style="left:${x0}pt;top:${y + 8}pt;width:38pt;font:700 15pt/20pt 'Red Hat Display';color:${ac}">${n}</div>`, rule: true});
    h += box(x0, 197, W2, 0, `border-top:1.2pt solid ${ac}`);
    // the band: the facts (public) or the weekday and date (broker and REALTOR® opens), like the flyer's foot
    if(dated){
      h += X.line('oh.weekday', ev.weekday, m, 470, 330, 28, 18, '', `${P13};font-weight:700;letter-spacing:3pt;text-transform:uppercase;color:${on}`);
      h += box(386, 472, 0, 36, `border-left:1pt solid ${on};opacity:.6`);
      h += X.line('oh.date', ev.monthDay, 404, 470, 350, 18, 13, '', `${P13};font-weight:500;color:${on}`);
      h += X.line('oh.time', ev.time, 404, 491, 350, 14, 10, '', `${P13};font-weight:500;color:${on}`);
    } else h += factRow(L, m, 478, W, 15, `${P13};font-weight:700;color:${on}`, bw ? 'var(--ink)' : 'rgba(255,255,255,.55)', 22);
    h += foot1(D, [m, 514, W, 58], {dark: !bw});
    return h;
  };

  L$['p13-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 30, pw = 552, bandTop = 304;
    const mc = bw ? 'var(--ink)' : 'var(--main-on-paper)', ac = bw ? 'var(--ink)' : 'var(--accent-on-paper)';
    let h = bw ? box(m, bandTop, pw, 0, 'border-top:1.2pt solid var(--ink)') : E.fl(0, bandTop, 612, 396 - bandTop, 'lrb', 'background:var(--main)');
    h += p13Mat(m, 22, 108, 72, E) + ph(D, E, m + 6, 28, 96, 60);
    const tx = m + 126, tw = m + pw - tx;
    h += X.line('oh.label', ev.label, tx, 28, tw, 19, 12, '', `${P13};font-weight:700;letter-spacing:4pt;text-transform:uppercase;color:${mc}`);
    h += X.line('address', L.address, tx, 52, tw, 17, 12, '', `${P13};font-weight:700;color:var(--ink)`);
    h += X.line('oh.date', `${up(X.cityZip(L))}   ·   ${ev.long}   ·   ${ev.time}`, tx, 77, tw, 8.5, 8, '', `${P13};font-weight:700;letter-spacing:1.2pt;color:${ac}`);
    h += p13Mat(m, 102, pw, 196, E);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `${P13};font-weight:700;font-size:8.5pt;line-height:1;letter-spacing:1.4pt;text-transform:uppercase;color:${mc}`);
    const q = (slot, t, x, y, w) => X.line(slot, t, x, y, w, 10.5, 8, '', `${P13};font-weight:700;color:var(--ink)`);
    const kit = {lab, q, pill: `border:.8pt solid var(--main-on-paper);background:var(--tint);color:${mc};font:700 8.5pt/1 'Red Hat Display';letter-spacing:.9pt;border-radius:2pt`,
      dot: () => `border:.8pt solid var(--main-on-paper);background:#fff;color:${mc};font:700 10.5pt/1 'Red Hat Display';border-radius:3pt`};
    const ax = m + 16, aw = 244, bx = ax + aw + 26;
    h += fbBody(E, FB, {kit, T: 104, ax, aw, bx, bw: m + pw - 16 - bx});
    h += foot1(D, [m, 310, pw, 52], {dark: !bw});
    return h;
  };

  /* ================================ P15 PALE GALLERY ================================ */
  const P15 = {d: "font-family:'Josefin Sans',Helvetica,sans-serif", b: "font-family:'Jost',Helvetica,sans-serif"};
  const tintPage = (E, w, hgt) => E.bw ? '' : E.fl(0, 0, w, hgt, 'ltrb', 'background:var(--paper)');
  const p15Box = (x, y, w, hgt, E) => box(x, y, w, hgt, E.bw ? 'border:.9pt solid var(--ink);background:#fff' : 'background:#fff;border:.5pt solid var(--line)');

  L$['p15-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 30, W = 732;
    const mc = bw ? 'var(--ink)' : 'var(--main-on-paper)', on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)';
    let h = tintPage(E, 792, 612);
    h += ph(D, E, m, 26, 196, 118);
    const bx = m + 196, bw2 = m + W - bx, cx = bx + bw2 / 2;
    h += box(bx, 26, bw2, 118, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--main)');
    h += X.flank(ev.label, cx, 38, bw2 - 36, 'kicker', `${P15.d};font-size:11pt;font-weight:700;letter-spacing:4pt;color:${ac}`, `.6pt solid ${ac}`);
    h += X.line('title', 'Please sign in', bx + 18, 56, bw2 - 36, 38, 22, '', `${P15.d};font-weight:700;letter-spacing:5pt;text-transform:uppercase;text-align:center;color:${on}`);
    if(dated){
      h += X.line('oh.date', ev.long, bx + 18, 100, bw2 - 36, 17, 12, '', `${P15.d};font-weight:600;letter-spacing:.8pt;text-align:center;color:${on}`);
      h += X.line('oh.time', ev.time, bx + 18, 121, bw2 - 36, 12, 9, '', `${P15.d};font-weight:600;letter-spacing:1.5pt;text-transform:uppercase;text-align:center;color:${ac}`);
    } else h += factRow(L, bx + 20, 106, bw2 - 40, 13, `${P15.d};font-weight:600;letter-spacing:.4pt;color:${on}`, bw ? 'var(--ink)' : 'rgba(255,255,255,.5)', 20);
    const x0 = m + 14, W2 = W - 28;
    h += p15Box(m, 154, W, 306, E);
    h += tbl(E, {x0, W: W2, y0: 188, rh: 38, numW: 40, widths: [206, 200, 100, W2 - 40 - 206 - 200 - 100], labY: 160, labH: 22, yd: 17, yn: `border:.8pt solid var(--main-on-paper);color:${mc};${P15.d};font-weight:700`,
      lab: `${P15.d};font-weight:700;font-size:8.4pt;letter-spacing:1.8pt;color:${mc};align-items:center`,
      row: (i, y, n) => (i % 2 === 0 ? `<div class="rowband" style="left:${x0}pt;top:${y}pt;width:${W2}pt;height:38pt;background:${bw ? 'var(--tint)' : mixOf('#ffffff', '#ffffff', 0) && 'var(--paper)'};opacity:${bw ? 1 : .6}"></div>` : '') +
        `<div class="num" style="left:${x0}pt;top:${y + 9}pt;width:40pt;font:700 16pt/20pt 'Josefin Sans';color:${mc}">${n}</div>`, rule: true});
    h += box(x0, 187, W2, 0, `border-top:1.2pt solid ${bw ? 'var(--ink)' : 'var(--main)'}`);
    // the address on a band, like the flyer's
    h += box(m, 470, W, 36, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--main)');
    h += X.line('address', [L.address, X.cityZip(L)].join(', '), m + 16, 475, W - 32, 21.5, 13, '', `${P15.d};font-weight:400;letter-spacing:1pt;text-align:center;color:${on}`);
    h += foot1(D, [m, 514, W, 58]);
    return h;
  };

  L$['p15-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, pw = 556;
    const mc = bw ? 'var(--ink)' : 'var(--main-on-paper)', on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)';
    let h = tintPage(E, 612, 396);
    h += ph(D, E, m, 24, 128, 76);
    const bx = m + 128, bw2 = m + pw - bx, cx = bx + bw2 / 2;
    h += box(bx, 24, bw2, 76, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--main)');
    h += X.flank(ev.label, cx, 33, bw2 - 30, 'kicker', `${P15.d};font-size:10pt;font-weight:700;letter-spacing:4pt;color:${ac}`, `.6pt solid ${ac}`);
    h += X.line('address', L.address, bx + 14, 50, bw2 - 28, 19, 12, '', `${P15.d};font-weight:600;letter-spacing:1pt;text-align:center;color:${on}`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, bx + 14, 76, bw2 - 28, 10, 8, '', `${P15.d};font-weight:600;letter-spacing:1.2pt;text-transform:uppercase;text-align:center;color:${ac}`);
    h += p15Box(m, 108, pw, 200, E);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `${P15.d};font-weight:700;font-size:8.5pt;line-height:1;letter-spacing:1.2pt;text-transform:uppercase;color:${mc}`);
    const q = (slot, t, x, y, w) => X.line(slot, t, x, y, w, 10.5, 8, '', `${P15.b};font-weight:600;color:var(--ink)`);
    const kit = {lab, q, pill: `border:.9pt solid var(--main-on-paper);background:var(--paper);color:${mc};font:700 8.5pt/1 'Josefin Sans';letter-spacing:.9pt;border-radius:10pt`,
      dot: () => `border:.9pt solid var(--main-on-paper);background:var(--paper);color:${mc};font:700 10.5pt/1 'Josefin Sans'`};
    const ax = m + 16, aw = 250, bx2 = ax + aw + 26;
    h += fbBody(E, FB, {kit, T: 112, ax, aw, bx: bx2, bw: m + pw - 16 - bx2});
    h += foot1(D, [m, 314, pw, 50]);
    return h;
  };

  /* ================================ P16 MODERN FRAME ================================ */
  const P16 = "font-family:'Hanken Grotesk',Helvetica,sans-serif";
  const p16Frame = (E, w, hgt, inset, gap) => E.bw
    ? box(inset - 8, inset - 8, w - 2 * inset + 16, hgt - 2 * inset + 16, 'border:3pt solid var(--ink)') + box(inset + gap, inset + gap, w - 2 * (inset + gap), hgt - 2 * (inset + gap), 'border:.8pt solid var(--ink)')
    : E.fl(0, 0, w, hgt, 'ltrb', 'background:var(--main)') + box(inset, inset, w - 2 * inset, hgt - 2 * inset, 'background:var(--paper)') +
      box(inset + gap, inset + gap, w - 2 * (inset + gap), hgt - 2 * (inset + gap), 'border:1pt solid var(--accent)');

  L$['p16-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 60, W = 672;
    const mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = p16Frame(E, 792, 612, 34, 6);
    h += ph(D, E, m, 54, 176, 112);
    const tx = m + 176 + 22, tw = m + W - tx;
    h += X.line('oh.label', ev.label, tx, 52, tw, 10, 8, '', `${P16};font-weight:600;letter-spacing:3pt;text-transform:uppercase;text-align:center;color:${mc}`);
    h += X.line('title', 'Please sign in', tx, 66, tw, 46, 28, '', `${P16};font-weight:700;letter-spacing:-1pt;text-align:center;color:${mc}`);
    if(dated){
      h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, tx, 118, tw, 17, 12, '', `${P16};font-weight:700;text-align:center;color:var(--ink)`);
      h += X.line('address', L.address, tx, 142, tw, 15, 11, '', `${P16};font-weight:500;text-align:center;color:var(--ink)`);
      h += X.line('place', up(X.cityZip(L)), tx, 164, tw, 8.5, 8, '', `${P16};font-weight:600;letter-spacing:2.2pt;text-align:center;color:${mc}`);
    } else {
      h += X.line('address', L.address, tx, 122, tw, 21, 14, '', `${P16};font-weight:500;text-align:center;color:var(--ink)`);
      h += X.line('place', up(X.cityZip(L)), tx, 150, tw, 9, 8, '', `${P16};font-weight:600;letter-spacing:2.4pt;text-align:center;color:${mc}`);
    }
    h += tbl(E, {x0: m, W, y0: 202, rh: 40, numW: 42, widths: [226, 202, 94, W - 42 - 226 - 202 - 94], labY: 176, labH: 22, yd: 17, yn: `border:.9pt solid var(--accent);color:${mc};${P16};font-weight:700`,
      lab: `${P16};font-weight:700;font-size:8.4pt;letter-spacing:1.6pt;color:${mc};align-items:center`,
      row: (i, y, n) => (i % 2 === 0 ? `<div class="rowband" style="left:${m}pt;top:${y}pt;width:${W}pt;height:40pt;background:${bw ? 'var(--tint)' : '#fff'}"></div>` : '') +
        `<div class="abs" style="left:${m + 10}pt;top:${y + 9}pt;width:22pt;height:22pt;border-radius:50%;${bw ? 'border:.9pt solid var(--ink);color:var(--ink)' : 'background:var(--main);color:var(--on-main)'};font:700 11pt/22pt 'Hanken Grotesk';text-align:center">${n}</div>`, rule: true});
    h += box(m, 201, W, 0, `border-top:1.2pt solid ${bw ? 'var(--ink)' : 'var(--accent)'}`);
    h += foot1(D, [m, 504, W, 58]);
    return h;
  };

  L$['p16-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 50, W = 512;
    const mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = p16Frame(E, 612, 396, 30, 6);
    h += ph(D, E, m, 44, 88, 54);
    const tx = m + 88 + 16, tw = m + W - tx;
    h += X.line('oh.label', ev.label, tx, 44, tw, 9, 8, '', `${P16};font-weight:600;letter-spacing:3pt;text-transform:uppercase;text-align:center;color:${mc}`);
    h += X.line('address', L.address, tx, 58, tw, 22, 14, '', `${P16};font-weight:700;text-align:center;color:${mc}`);
    h += X.line('oh.date', `${up(X.cityZip(L))}   ·   ${ev.long}   ·   ${ev.time}`, tx, 86, tw, 8.5, 8, '', `${P16};font-weight:600;letter-spacing:1.2pt;text-align:center;color:var(--ink)`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `${P16};font-weight:700;font-size:8.5pt;line-height:1;letter-spacing:1.4pt;text-transform:uppercase;color:${mc}`);
    const q = (slot, t, x, y, w) => X.line(slot, t, x, y, w, 10.5, 8, '', `${P16};font-weight:600;color:var(--ink)`);
    const kit = {lab, q, pill: `border:.9pt solid var(--accent);background:#fff;color:${mc};font:700 8.5pt/1 'Hanken Grotesk';letter-spacing:.9pt;border-radius:10pt`,
      dot: () => `border:.9pt solid var(--accent);background:#fff;color:${mc};font:700 10.5pt/1 'Hanken Grotesk'`};
    const aw = 232, bx = m + aw + 26;
    h += fbBody(E, FB, {kit, T: 106, ax: m, aw, bx, bw: m + W - bx});
    h += foot1(D, [m, 306, W, 48]);
    return h;
  };

  /* ================================ P18 ASYMMETRIC ================================ */
  const P18 = {d: "font-family:'Red Hat Display',Helvetica,sans-serif", b: "font-family:'Outfit',Helvetica,sans-serif"};
  // the photo with an offset block of the main color behind it and an accent corner at its top left
  const p18Photo = (D, E, x, y, w, hgt, off, tri) =>
    box(x + off, y + off, w, hgt, E.bw ? 'border:.9pt solid var(--ink)' : 'background:var(--main)') + ph(D, E, x, y, w, hgt) +
    `<div class="abs" style="left:${x - tri * .45}pt;top:${y - tri * .45}pt;width:${tri}pt;height:${tri}pt;background:${E.bw ? 'var(--ink)' : 'var(--accent)'};clip-path:polygon(0 0,100% 0,0 100%)"></div>`;

  L$['p18-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720, bandTop = 478;
    const mc = bw ? 'var(--ink)' : 'var(--main-on-paper)', ac = bw ? 'var(--ink)' : 'var(--accent-on-paper)', on = bw ? 'var(--ink)' : 'var(--on-main)';
    let h = bw ? box(m, bandTop, W, 0, 'border-top:2pt solid var(--ink)') : E.fl(0, bandTop, 792, 612 - bandTop, 'lrb', 'background:var(--main)');
    h += p18Photo(D, E, 452, 40, 296, 118, 12, 36);
    h += txt('oh.label', ev.label, m, 36, 380, `${P18.b};font-weight:600;font-size:9.5pt;line-height:1;letter-spacing:2.6pt;text-transform:uppercase;color:${ac}`);
    h += X.line('title', 'Please sign in', m - 1, 50, 400, 38, 24, '', `${P18.d};font-weight:700;text-transform:uppercase;letter-spacing:-.3pt;color:${mc}`);
    if(dated){
      h += X.line('oh.date', ev.long, m, 100, 400, 21, 14, '', `${P18.d};font-weight:700;color:var(--ink)`);
      h += X.line('oh.time', ev.time, m, 126, 400, 15, 11, '', `${P18.b};font-weight:500;color:${ac}`);
    } else facts(L).slice(0, 3).forEach(([ic, v, k], i) => {
      const fx = m + i * 134; h += icon(ic, fx, 106, 15, mc) + txt(`fact.${i}`, `${v} ${k.toLowerCase()}`, fx + 21, 107, 108, `${P18.b};font-weight:600;font-size:10.5pt;line-height:13pt;color:var(--ink)`);
    });
    const x0 = m, W2 = W;
    h += box(x0, 178, W2, 288, 'background:#fff;border:.5pt solid var(--line)');
    h += tbl(E, {x0: x0 + 10, W: W2 - 20, y0: 208, rh: 36, numW: 40, widths: [214, 204, 100, W2 - 20 - 40 - 214 - 204 - 100], labY: 182, labH: 22, yd: 17, yn: `border:.9pt solid var(--main-on-paper);color:${mc};${P18.d};font-weight:700;border-radius:2pt`,
      lab: `${P18.b};font-weight:600;font-size:8.4pt;letter-spacing:1.6pt;color:${mc};align-items:center`,
      row: (i, y, n) => (i % 2 === 0 ? `<div class="rowband" style="left:${x0 + 10}pt;top:${y}pt;width:${W2 - 20}pt;height:36pt;background:var(--tint)"></div>` : '') +
        `<div class="abs" style="left:${x0 + 16}pt;top:${y + 6}pt;width:24pt;height:24pt;${bw ? 'border:.9pt solid var(--ink);color:var(--ink)' : 'background:var(--main);color:var(--on-main)'};font:700 12pt/24pt 'Red Hat Display';text-align:center">${n}</div>` +
        (bw ? '' : `<div class="abs" style="left:${x0 + 16}pt;top:${y + 6}pt;width:8pt;height:8pt;background:var(--accent);clip-path:polygon(0 0,100% 0,0 100%)"></div>`), rule: true});
    h += box(x0 + 10, 207, W2 - 20, 0, `border-top:1.4pt solid ${bw ? 'var(--ink)' : 'var(--main)'}`);
    h += X.line('address', L.address, m, 484, 430, 26, 15, '', `${P18.d};font-weight:700;color:${on}`);
    h += X.line('place', up(X.cityZip(L)), m + W - 240, 492, 240, 9.5, 8, '', `${P18.b};font-weight:400;letter-spacing:1.4pt;text-align:right;color:${on}`);
    h += foot1(D, [m, 522, W, 58], {dark: !bw});
    return h;
  };

  L$['p18-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 30, pw = 552, bandTop = 304;
    const mc = bw ? 'var(--ink)' : 'var(--main-on-paper)', ac = bw ? 'var(--ink)' : 'var(--accent-on-paper)';
    let h = bw ? box(m, bandTop, pw, 0, 'border-top:2pt solid var(--ink)') : E.fl(0, bandTop, 612, 396 - bandTop, 'lrb', 'background:var(--main)');
    h += p18Photo(D, E, 424, 28, 148, 66, 9, 26);
    h += txt('oh.label', ev.label, m, 26, 360, `${P18.b};font-weight:600;font-size:9pt;line-height:1;letter-spacing:2.4pt;text-transform:uppercase;color:${ac}`);
    h += X.line('title', 'Your feedback', m - 1, 38, 380, 30, 20, '', `${P18.d};font-weight:700;text-transform:uppercase;letter-spacing:-.2pt;color:${mc}`);
    h += X.line('address', L.address, m, 74, 380, 15, 11, '', `${P18.d};font-weight:700;color:var(--ink)`);
    h += X.line('oh.date', `${up(X.cityZip(L))}   ·   ${ev.long}   ·   ${ev.time}`, m, 95, 380, 8.5, 8, '', `${P18.b};font-weight:600;letter-spacing:1.2pt;color:${ac}`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `${P18.b};font-weight:600;font-size:8.5pt;line-height:1;letter-spacing:1.5pt;text-transform:uppercase;color:${mc}`);
    const q = (slot, t, x, y, w) => X.line(slot, t, x, y, w, 10.5, 8, '', `${P18.d};font-weight:700;color:var(--ink)`);
    const kit = {lab, q, pill: `border:.9pt solid var(--main-on-paper);background:#fff;color:${mc};font:600 8.5pt/1 'Outfit';letter-spacing:.8pt`,
      dot: () => `border:.9pt solid var(--main-on-paper);background:#fff;color:${mc};font:700 10.5pt/1 'Red Hat Display';border-radius:2pt`};
    const aw = 250, bx = m + aw + 26;
    h += fbBody(E, FB, {kit, T: 112, ax: m, aw, bx, bw: m + pw - bx});
    h += foot1(D, [m, 312, pw, 50], {dark: !bw});
    return h;
  };

  /* ================================ P19 COLOR GRID ================================ */
  const P19 = "font-family:'Schibsted Grotesk',Helvetica,sans-serif";
  const blk = (x, y, w, hgt, E) => box(x, y, w, hgt, E.bw ? 'border:1.2pt solid var(--ink)' : 'background:var(--main)');
  const cell = (x, y, w, hgt, E, bd) => box(x, y, w, hgt, E.bw ? 'border:.9pt solid var(--ink);background:#fff' : `background:#fff;border:${bd || '.6pt solid var(--line)'}`);

  L$['p19-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, X0 = 24, W = 744;
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = blk(X0, 24, 252, 98, E) + ph(D, E, 284, 24, 206, 98) + blk(498, 24, 270, 98, E);
    h += txt('oh.label', ev.label, 40, 34, 224, `${P19};font-weight:700;font-size:9pt;line-height:1;letter-spacing:2.6pt;text-transform:uppercase;color:${ac}`);
    h += X.line('title', 'Please', 40, 48, 224, 30, 22, '', `${P19};font-weight:700;color:${on}`);
    h += X.line('title2', 'sign in', 40, 78, 224, 30, 22, '', `${P19};font-weight:700;color:${on}`);
    if(dated){
      h += X.line('oh.date', ev.long, 508, 32, 250, 20, 14, '', `${P19};font-weight:700;text-align:right;color:${on}`);
      h += X.line('oh.time', ev.time, 508, 56, 250, 17, 12, '', `${P19};font-weight:500;text-align:right;color:${ac}`);
      h += X.line('address', L.address, 508, 82, 250, 15, 12, '', `${P19};font-weight:700;text-align:right;color:${on}`);
      h += txt('place', X.cityZip(L), 508, 102, 250, `${P19};font-weight:500;font-size:10pt;line-height:12pt;text-align:right;color:${on}`);
    } else {
      h += txt('welcome', 'Welcome to', 508, 36, 250, `${P19};font-weight:700;font-size:9pt;line-height:1;letter-spacing:2.6pt;text-transform:uppercase;text-align:right;color:${ac}`);
      h += X.line('address', L.address, 508, 52, 250, 26, 14, '', `${P19};font-weight:700;text-align:right;color:${on}`);
      h += txt('place', X.cityZip(L), 508, 90, 250, `${P19};font-weight:500;font-size:10.5pt;line-height:13pt;text-align:right;color:${on}`);
    }
    // the header block, then seven rows each a white cell with a numeral block
    const cs = cols(X0, 42, [226, 206, 92, W - 42 - 226 - 206 - 92]);
    h += blk(X0, 130, W, 34, E) + labels(cs, 130, 34, `${P19};font-weight:700;font-size:8.4pt;letter-spacing:1.6pt;color:${on};align-items:center`);
    h += tbl(E, {x0: X0, W, y0: 168, rh: 45, numW: 42, widths: [226, 206, 92, W - 42 - 226 - 206 - 92], labY: 0, labH: 0, lab: 'display:none', yd: 17, yn: `border:.9pt solid var(--main-on-paper);color:${mc};${P19};font-weight:700`, vr: false,
      row: (i, y, n, c) => cell(X0 + 46, y, W - 46, 41, E) + blk(X0, y, 42, 41, E) +
        `<div class="num" style="left:${X0}pt;top:${y + 9.5}pt;width:42pt;font:700 17pt/22pt 'Schibsted Grotesk';color:${on}">${n}</div>` +
        c.slice(1).map(k => box(k.x, y + 6, 0, 30, 'border-left:.5pt solid var(--line)')).join('')});
    h += foot1(D, [X0, 512, W, 58]);
    return h;
  };

  L$['p19-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, X0 = 24, W = 564;
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = blk(X0, 20, 200, 72, E) + ph(D, E, 232, 20, 150, 72) + blk(390, 20, 198, 72, E);
    h += txt('oh.label', ev.label, 38, 29, 176, `${P19};font-weight:700;font-size:8.5pt;line-height:1;letter-spacing:2.2pt;text-transform:uppercase;color:${ac}`);
    h += X.line('title', 'Your feedback', 38, 44, 176, 24, 16, '', `${P19};font-weight:700;color:${on}`);
    h += X.line('oh.date', ev.long, 400, 28, 176, 15, 11, '', `${P19};font-weight:700;text-align:right;color:${on}`);
    h += X.line('oh.time', ev.time, 400, 46, 176, 13, 10, '', `${P19};font-weight:500;text-align:right;color:${ac}`);
    h += X.line('address', L.address, 400, 64, 176, 14, 10, '', `${P19};font-weight:700;text-align:right;color:${on}`);
    h += cell(X0, 100, 322, 204, E, `1.5pt solid var(--main)`) + cell(354, 100, 234, 204, E, `1.5pt solid var(--main)`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `${P19};font-weight:700;font-size:8.5pt;line-height:1;letter-spacing:1.4pt;text-transform:uppercase;color:${mc}`);
    const q = (slot, t, x, y, w) => X.line(slot, t, x, y, w, 10.5, 8, '', `${P19};font-weight:700;color:var(--ink)`);
    const kit = {lab, q, pill: `border:.9pt solid var(--main-on-paper);background:var(--tint);color:${mc};font:700 8.5pt/1 'Schibsted Grotesk';letter-spacing:.8pt`,
      dot: () => `border:.9pt solid var(--main-on-paper);background:${bw ? '#fff' : 'var(--main)'};color:${on};font:700 10.5pt/1 'Schibsted Grotesk';border-radius:3pt`};
    h += fbBody(E, FB, {kit, T: 104, ax: 38, aw: 292, bx: 368, bw: 206, noDivider: true});
    h += foot1(D, [X0, 312, W, 50]);
    return h;
  };

  /* ================================ P20 GARDEN SERIF ================================ */
  const P20 = {d: "font-family:'Libre Baskerville',Georgia,serif", b: "font-family:'Instrument Sans',Helvetica,sans-serif"};
  // the label repeated up a thin rule at the left edge
  const p20Side = (E, ev, cx, cy, len, ruleX, y0, y1) => {
    const n = Math.max(1, Math.min(5, Math.floor((len - 20) / (ev.label.length * 9.4 + 34)))), t = Array(n).fill(ev.label).join('   ·   ');
    const c = E.bw ? 'var(--ink)' : 'var(--on-main)';
    return `<div class="abs" style="left:${cx - len / 2}pt;top:${cy - 7}pt;width:${len}pt;height:14pt;transform:rotate(-90deg);font:500 8.5pt/14pt 'Instrument Sans';letter-spacing:3.4pt;text-transform:uppercase;text-align:center;white-space:nowrap;overflow:hidden;color:${c};opacity:.85">${esc(t)}</div>` +
      box(ruleX, y0, 0, y1 - y0, `border-left:.8pt solid ${E.bw ? 'var(--ink)' : 'var(--accent-on-main)'};opacity:.7`);
  };
  const p20Paper = (x, y, w, hgt, E) => box(x, y, w, hgt, E.bw ? 'border:.9pt solid var(--ink);background:#fff' : 'background:var(--paper)') +
    (E.bw ? '' : box(x + 4, y + 4, w - 8, hgt - 8, 'border:.5pt solid var(--accent);opacity:.7'));

  L$['p20-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 64, W = 692;
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', 'background:var(--main)');
    h += p20Side(E, ev, 30, 306, 500, 46, 30, 582);
    h += X.line('title', 'Please sign in', m, 34, 362, 38, 22, '', `${P20.d};font-style:italic;font-weight:700;text-transform:uppercase;letter-spacing:-.4pt;color:${on}`);
    h += X.line('address', L.address, m, 88, 362, 18, 12, '', `${P20.b};font-weight:600;color:${on}`);
    if(dated){
      h += X.line('oh.date', ev.long, m, 112, 232, 18, 12, '', `${P20.d};font-style:italic;font-weight:700;color:${on}`);
      h += X.line('oh.time', ev.time, m + 244, 114, 120, 15, 10, '', `${P20.b};font-weight:600;color:${ac}`);
    } else h += X.line('place', up(X.cityZip(L)), m, 114, 362, 10, 8, '', `${P20.b};font-weight:600;letter-spacing:2.4pt;color:${ac}`);
    h += ph(D, E, 440, 26, 316, 134) + box(436, 22, 324, 142, `border:.8pt solid ${bw ? 'var(--ink)' : 'var(--accent-on-main)'};opacity:.6`);
    h += p20Paper(m, 172, W, 294, E);
    const x0 = m + 14, W2 = W - 28;
    h += tbl(E, {x0, W: W2, y0: 212, rh: 34, numW: 38, widths: [206, 196, 94, W2 - 38 - 206 - 196 - 94], labY: 182, labH: 24, yd: 16, yn: `border:.8pt solid var(--accent);color:${mc};${P20.b};font-weight:600`,
      lab: `${P20.b};font-weight:600;font-size:8.2pt;letter-spacing:1.8pt;color:${mc};align-items:center`,
      row: (i, y, n) => (i % 2 === 0 ? `<div class="rowband" style="left:${x0}pt;top:${y}pt;width:${W2}pt;height:34pt;background:var(--tint)"></div>` : '') +
        `<div class="num" style="left:${x0}pt;top:${y + 5.5}pt;width:38pt;font:italic 700 14pt/22pt 'Libre Baskerville';color:${mc}">${n}</div>`, rule: true});
    h += box(x0, 211, W2, 0, `border-top:1.2pt solid ${bw ? 'var(--ink)' : 'var(--accent)'}`);
    h += box(m, 494, W, 0, `border-top:.8pt solid ${bw ? 'var(--ink)' : 'var(--accent-on-main)'};opacity:.5`);
    h += foot1(D, [m, 506, W, 58], {dark: !bw});
    return h;
  };

  L$['p20-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 52, W = 536;
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', 'background:var(--main)');
    h += p20Side(E, ev, 28, 198, 340, 40, 24, 372);
    h += X.line('title', 'Your feedback', m, 22, 320, 34, 20, '', `${P20.d};font-style:italic;font-weight:700;text-transform:uppercase;letter-spacing:-.3pt;color:${on}`);
    h += X.line('address', L.address, m, 62, 320, 16, 11, '', `${P20.b};font-weight:600;color:${on}`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, m, 82, 330, 11, 8, '', `${P20.d};font-style:italic;font-weight:700;color:${ac}`);
    h += ph(D, E, 400, 22, 188, 74) + box(396, 18, 196, 82, `border:.8pt solid ${bw ? 'var(--ink)' : 'var(--accent-on-main)'};opacity:.6`);
    h += p20Paper(m, 106, W, 198, E);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `${P20.b};font-weight:600;font-size:8.5pt;line-height:1;letter-spacing:1.4pt;text-transform:uppercase;color:${mc}`);
    const q = (slot, t, x, y, w) => X.line(slot, t, x, y, w, 10.5, 8, '', `${P20.d};font-style:italic;font-weight:700;color:var(--ink)`);
    const kit = {lab, q, pill: `border:.8pt solid var(--accent);background:var(--tint);color:${mc};font:600 8.5pt/1 'Instrument Sans';letter-spacing:.9pt`,
      dot: () => `border:.8pt solid var(--accent);background:var(--tint);color:${mc};font:italic 700 10pt/1 'Libre Baskerville'`};
    const ax = m + 16, aw = 236, bx = ax + aw + 26;
    h += fbBody(E, FB, {kit, T: 110, ax, aw, bx, bw: m + W - 16 - bx});
    h += foot1(D, [m, 312, W, 50], {dark: !bw});
    return h;
  };
})();
