/* Open House extras for design sets, batch g (owner 11/15/2026: every set gets its own sign-in sheet and feedback card).
   Round 3 (docs/briefs/set-extras-11-15.md, "one style thread through the whole set"): a card uses only shapes, fills, colors and type
   treatments its own set uses; the writing field stays light for a pen, drawn in the set's own box language; rating and price marks are
   outlined, never filled, in the set's own mark shape.
   FXS-02 Ink Band      gray band down the left with the icon facts and the row numbers, the house in the arch-ended frame, the black round-ended box off the right edge.
   FXS-09 Navy Copper   navy field, the house inset, the two-voice serif headline, the copper stat row, a white writing field in a copper rule.
   FXS-11 Espresso Pill espresso field, photo off the corner, the huge house number over the street, outline pill tags and the white pill, a square white writing field.
   FXS-13 Seal Gutter   warm paper, the address reading up the gutter beside a thin rule, the solid white seal touching the photo's edge, brown hairlines and letterspaced caps.
   FXS-14 Taupe Script  photo and taupe block off the top and right, the big Pinyon Script title, taupe and white only, thin hairline boxes.
   Each set has a fixed palette (like the set's own pieces), so the colors are written into the looks and set on a wrapper
   (the body class is "set-fxs" for every FXS set, so Extras.themes can't tell them apart). */
(function(){
  const X = Extras, L$ = X.looks, esc = X.esc, Z = X.lib;
  const {cols, labels, qs, box, txt, ph, foot1, icon, edge} = Z;
  const M = "'xg Mont','Montserrat',Helvetica,Arial,sans-serif", DMS = "'xg DMSans',Helvetica,Arial,sans-serif", DMD = "'xg DMSerif',Georgia,serif",
    BOD = "'xg Bodoni',Georgia,serif", COR = "'xg Cormorant',Georgia,serif", PIN = "'xg Pinyon',cursive", BAS = "'xg Baskerville',Georgia,serif";
  // font longhands (never the shorthand: a fitter that sets the size would drop a pending shorthand)
  const F = (w, s, lh, fam) => `font-family:${fam};font-weight:${w};font-size:${s}pt;line-height:${lh}pt;`;
  const pad2 = n => String(n).padStart(2, '0');
  const CCV = '--cc-paper:transparent;--cc-ink:var(--ink);--cc-muted:var(--muted);--cc-accent:var(--accent);--cc-line:var(--line);';
  const BWV = '--ink:#111;--muted:#4a4a4a;--accent:#111;--on:#111;--on-soft:#4a4a4a;--gold:#111;--line:rgba(0,0,0,.34);--line-on:rgba(0,0,0,.34);--tint:rgba(0,0,0,.03);';
  // the wrapper that carries the set's colors and type to everything inside it (the shared footer reads these)
  const wrap = (fonts, vars, bw, html) => `<div class="abs xg" style="left:0;top:0;right:0;bottom:0;${fonts}${CCV}${bw ? BWV + ((vars.match(/--xg-namew:\d+;/) || [''])[0]) : vars}">${html}</div>`;
  const fonts = (d, b) => `--font-display:${d};--font-body:${b};`;
  const place = L => [L.neighborhood, L.city].filter(Boolean).join(' · ');
  const factLine = L => [L.beds && `${L.beds} ${L.beds == 1 ? 'Bed' : 'Beds'}`, L.baths && `${L.baths} ${L.baths == 1 ? 'Bath' : 'Baths'}`,
    L.sqft && `${Number(L.sqft).toLocaleString('en-US')} Sq Ft`].filter(Boolean).join('  ·  ');
  // the address with its number light and the street heavy (FXS-02's way), one line that steps down to fit
  const addrSplit = (slot, addr, x, y, w, size, floor, wl, wh, style) => {
    const m = /^(\d+)\s+(.*)$/.exec(addr || '') || [0, '', addr || ''];
    return `<div class="abs nowrap" data-slot="${slot}" data-shrink="${floor}" style="left:${x}pt;top:${y}pt;width:${w}pt;font-size:${size}pt;line-height:${size * 1.2}pt;font-family:${M};${style || ''}">` +
      (m[1] ? `<span style="font-weight:${wl}">${esc(m[1])}</span> ` : '') + `<span style="font-weight:${wh}">${esc(m[2])}</span></div>`;
  };
  // a one-line slot turned to read upward (the box's top edge sits at `bottom`, its length runs up the page)
  const vt = (slot, t, cx, bottom, len, size, floor, cls, style) => { const hh = size * 1.2;
    return `<div class="abs" style="left:${cx - hh / 2}pt;top:${bottom}pt;width:${len}pt;height:${hh}pt;transform:rotate(-90deg);transform-origin:0 0">` +
      X.line(slot, t, 0, 0, len, size, floor, cls, style) + '</div>'; };

  // one line in two voices (light + heavy, or roman + italic), stepping down to fit
  const two = (slot, parts, x, y, w, size, floor, style) => `<div class="abs nowrap" data-slot="${slot}" data-shrink="${floor}" style="left:${x}pt;top:${y}pt;width:${w}pt;font-size:${size}pt;line-height:${size * 1.2}pt;${style || ''}">` +
    parts.map(([t, st]) => `<span style="${st}">${esc(t)}</span>`).join(' ') + '</div>';
  // the listing's facts as [value, label]
  const factCells = L => { const f = [], b = Number(L.baths) || 0;
    if(L.beds) f.push([String(L.beds), L.beds == 1 ? 'Bedroom' : 'Bedrooms']);
    if(b) f.push([String(b), b == 1 ? 'Bath' : 'Baths']);
    if(L.sqft) f.push([Number(L.sqft).toLocaleString('en-US'), 'Sq Ft']);
    if(L.yearBuilt) f.push([String(L.yearBuilt), 'Built']);
    return f; };

  // ---- the sign-in table: label row, seven writing rows, the hooks each set draws its own way ----
  const tbl = (E, o) => {
    const cs = cols(o.x0, o.numW, o.widths); let h = '';
    if(o.headBox) h += o.headBox;
    h += labels(cs, o.ly, o.lh, o.labelStyle);
    if(o.head) h += box(o.x0, o.y0 - 1, o.W, 0, 'border-top:' + o.head);
    if(o.band) for(let i = o.bandOdd ? 1 : 0; i < 7; i += 2) h += `<div class="rowband" style="left:${o.x0}pt;top:${o.y0 + i * o.rh}pt;width:${o.W}pt;height:${o.rh}pt;background:${o.band}"></div>`;
    for(let i = 0; i < 7; i++){ const y = o.y0 + i * o.rh;
      h += o.num(i, y, E.first + i);
      if(o.hr) h += box(o.x0, y + o.rh, o.W, 0, 'border-top:' + (i === 6 && o.last ? o.last : o.hr));
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - o.yd - 3, y + (o.rh - o.yd) / 2, o.yd, o.yn); }); }
    const vi = o.vi == null ? 5 : o.vi;
    if(o.vr) cs.forEach((c, k) => { if(k || o.numW) h += box(c.x, o.y0 + vi, 0, 7 * o.rh - 2 * vi, 'border-left:' + o.vr); });
    return h;
  };

  // ---- the feedback card's fields (approved fields and wording); every write-in line 20.2 pt (0.28 in) from the next ----
  const SP = 20.2;
  const fbBody = (D, K, o) => {
    const FB = qs(D), x = o.x, y = o.y, aw = o.aw, bx = o.bx, bw2 = o.bw2, lw = o.lw || 106, ind = o.ind || 0; let h = '';
    h += K.lab('q.price', FB.price, x, y, aw) + K.pills(FB.choices, x, y + 14, aw);
    h += K.lab('q.cond', FB.cond, x, y + 51, lw - 8) + K.marks(x + lw, y + 44, aw - lw);
    h += K.lab('q.shows', FB.shows, x, y + 79, lw - 8) + K.marks(x + lw, y + 72, aw - lw);
    h += txt('q.scale', FB.scale, x + lw, y + 97, aw - lw, `text-align:right;${F(400, 8, 9.5, K.fam)}color:${K.mut || 'var(--muted)'}`);
    h += K.q('q.seller', FB.seller, x, y + 112, aw) + K.wl(x, y + 138, aw) + K.wl(x, y + 138 + SP, aw);
    h += K.lab('q.name', FB.name, x, y + 167, 100) + K.wl(x, y + 198, 106) + K.lab('q.contact', FB.contact, x + 118, y + 167, aw - 118) + K.wl(x + 118, y + 198, aw - 118);
    FB.prompts.forEach(([k, t], i) => { const yy = y + i * 67.3;
      h += (o.pnum ? o.pnum(i, bx, yy) : '') + K.q('q.' + k, t, bx + ind, yy, bw2 - ind) + [23, 23 + SP, 23 + 2 * SP].map(d => K.wl(bx, yy + d, bw2)).join(''); });
    return h;
  };
  // a kit: label, question, pills, 1-5 marks and write-in lines in a set's own style
  const kit = (fam, labStyle, qStyle, pillStyle, dotStyle, o) => Object.assign({fam,
    lab: (slot, t, x, y, w) => txt(slot, t, x, y, w, labStyle),
    q: (slot, t, x, y, w) => X.line(slot, t, x, y, w, 10.5, 8, '', qStyle),
    wl: (x, y, w) => X.wline(x, y, w),
    pills: (arr, x, y, w) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;display:flex;gap:6pt">` + arr.map(t => `<span class="pill" style="flex:1 1 auto;padding:0 4pt;height:21pt;${pillStyle}">${esc(t)}</span>`).join('') + '</div>',
    marks: (x, y, w) => X.dots(x, y, w, 22, i => dotStyle)}, o || {});

  // price choices as outlined marks with their words beside them (sets that have no pill or box of their own for this)
  const ticks = (radius, markStyle, labStyle) => (arr, x, y, w) => `<div class="abs" style="left:${x}pt;top:${y + 2}pt;width:${w}pt;height:17pt;display:flex;justify-content:space-between;align-items:center">` +
    arr.map(t => `<span style="display:inline-flex;align-items:center;gap:5pt"><span style="display:block;width:13pt;height:13pt;border-radius:${radius};${markStyle}"></span><span style="white-space:nowrap;${labStyle}">${esc(t)}</span></span>`).join('') + '</div>';
  const splitAddr = addr => { const m = /^(\d+[A-Za-z]?)\s+(.*)$/.exec(addr || ''); return m ? [m[1], m[2]] : ['', addr || '']; };

  /* ---- centered by the ink, not the font box (owner 11/16/2026, sign-in review: "East End" in the Seal Gutter seal, Black and
     Gold's "Please sign in", Royal Blue Bar's address in its bar). A part marked data-inkv="a:b" (and data-inkh="a:b") moves
     until its letters' own ink sits centered between a and b: a number is a position in pt on the card; slot names
     ("oh.label|oh.date") mean the bottom of those parts' ink (for a) or its top (for b). It runs once every fitter has set the
     type (after the standard footer's finish). Only parts that carry the marks move. */
  const inkCtx = document.createElement('canvas').getContext('2d');
  // the ink box (page px) of an element's text, letter by letter, from the face's own glyph metrics
  const inkBox = el => {
    let L = 1e9, T = 1e9, R = -1e9, B = -1e9;
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
    while((n = tw.nextNode())){
      const s = n.textContent; if(!s.trim()) continue;
      const cs = getComputedStyle(n.parentElement), up = cs.textTransform === 'uppercase';
      inkCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const asc = inkCtx.measureText('Hg').fontBoundingBoxAscent;
      for(let i = 0; i < s.length; i++){ const ch = up ? s[i].toUpperCase() : s[i]; if(!ch.trim()) continue;
        const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + 1);
        const r = [...rg.getClientRects()].find(q => q.width) || rg.getBoundingClientRect(); if(!r.width) continue;
        const m = inkCtx.measureText(ch), base = r.top + asc;
        L = Math.min(L, r.left - m.actualBoundingBoxLeft); R = Math.max(R, r.left + m.actualBoundingBoxRight);
        T = Math.min(T, base - m.actualBoundingBoxAscent); B = Math.max(B, base + m.actualBoundingBoxDescent); }
    }
    return L < R ? {left: L, top: T, right: R, bottom: B} : null;
  };
  X.inkCenter = root => (root || document).querySelectorAll('.trim').forEach(t => {
    const k = t.getBoundingClientRect().width / t.offsetWidth || 1, pt = 96 / 72 * k, tr = t.getBoundingClientRect(), num = s => /^-?[\d.]+$/.test(s);
    // a number: that position on the card; slot names: the bottom (top end) or top (bottom end) of those parts' ink
    const end = (spec, axis, lower) => { if(num(spec)) return (axis === 'h' ? tr.left : tr.top) + +spec * pt;
      const bs = spec.split('|').map(s => t.querySelector(`[data-slot="${s}"]`)).filter(Boolean).map(inkBox).filter(Boolean); if(!bs.length) return null;
      return lower ? Math.min(...bs.map(b => b.top)) : Math.max(...bs.map(b => b.bottom)); };
    t.querySelectorAll('[data-inkv], [data-inkh]').forEach(el => {
      const b = inkBox(el); if(!b) return; let dx = 0, dy = 0;
      if(el.dataset.inkv){ const [a, z] = el.dataset.inkv.split(':'), ya = end(a, 'v', false), yz = end(z, 'v', true);
        if(ya != null && yz != null) dy = (ya + yz) / 2 - (b.top + b.bottom) / 2; }
      if(el.dataset.inkh){ const [a, z] = el.dataset.inkh.split(':'); dx = (end(a, 'h') + end(z, 'h')) / 2 - (b.left + b.right) / 2; }
      el.style.translate = `${(dx / pt).toFixed(2)}pt ${(dy / pt).toFixed(2)}pt`;
    });
  });
  if(window.StandardFooter && !StandardFooter._inkc){
    const fin0 = StandardFooter.finish; StandardFooter._inkc = 1;
    StandardFooter.finish = function(root){ const r = fin0.apply(this, arguments); X.inkCenter(root); return r; };
  }
  // the marks go on a part's outer box
  const mark = (html, a) => html.replace(/^<(\w+) /, `<$1 ${a} `);
  X.inkMark = mark;

  /* ======================================= FXS-02 INK BAND ======================================= */
  const V02 = `--ink:#111;--muted:#555;--accent:#111;--on:#fff;--on-soft:#d6d4d0;--gold:#fff;--xg-acc:#111;--xg-namew:600;--line:rgba(17,17,17,.3);--line-on:rgba(255,255,255,.3);--tint:rgba(17,17,17,.03);`;
  const BAND = '#ecebe9', RULE02 = '#cfccc7';
  const ICO02 = {bed: null, bath: null, area: null, built: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>'};
  const ico02 = (n, x, y, sz) => ICO02[n] ? `<svg class="abs" style="left:${x}pt;top:${y}pt;width:${sz}pt;height:${sz}pt;stroke:#111;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24">${ICO02[n]}</svg>` : icon(n, x, y, sz, '#111');
  // the facts the way the set stacks them in its band: a line icon, a small caps label, the value under it
  const facts02 = (L, x, y, pitch, w, vs, max) => { const b = Number(L.baths) || 0, f = [];
    if(L.beds) f.push(['bed', 'Beds', L.beds]); if(b) f.push(['bath', 'Baths', b]); if(L.sqft) f.push(['area', 'Sq Ft', Number(L.sqft).toLocaleString('en-US')]); if(L.yearBuilt) f.push(['built', 'Built', L.yearBuilt]);
    return f.slice(0, max || 4).map(([ic, l, v], i) => { const yy = y + i * pitch;
      return ico02(ic, x, yy, 14) + txt('', l, x, yy + 17, w, `${F(700, 8, 9.5, M)}letter-spacing:1.3pt;text-transform:uppercase;color:#111`) + txt('', String(v), x, yy + 27, w, `${F(400, vs, vs + 2, M)}color:#111`); }).join(''); };
  // the black box with a round left end that runs off the right edge: the flyer's Open House box
  const bar02 = (E, x, y, hgt, right) => E.bw ? box(x, y, right - x, hgt, `border:1.5pt solid #111;border-radius:${hgt / 2}pt 0 0 ${hgt / 2}pt`) : E.fl(x, y, 100, hgt, 'r', `background:#111;border-radius:${hgt / 2}pt 0 0 ${hgt / 2}pt`);
  L$['fxs-02-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, ink = '#111', onB = bw ? '#111' : '#fff', soft = bw ? '#4a4a4a' : '#d6d4d0';
    let h = bw ? '' : E.fl(0, 0, 100, 612, 'ltb', `background:${BAND}`);
    h += facts02(L, 32, 34, 60, 64, 15, 3);
    h += ph(D, E, 118, 26, 318, 184, 'border-radius:92pt 0 0 92pt');
    const tx = 456;
    h += icon('pin', tx, 28, 13, ink) + X.line('place', X.cityZip(L), tx + 18, 29, 278, 10, 8, '', `${F(600, 10, 12, M)}letter-spacing:1.2pt;color:${ink}`);
    h += addrSplit('address', L.address, tx, 46, 296, 30, 16, 300, 800, `text-transform:uppercase;color:${ink};letter-spacing:.5pt`);
    h += bar02(E, tx, 96, 114, 752);
    const dy = dated ? 0 : 10;
    h += X.line('oh.label', ev.label, tx + 46, 113 + dy, 248, 9, 8, '', `${F(700, 9, 11, M)}letter-spacing:2.6pt;text-transform:uppercase;color:${soft}`);
    h += two('title', [['Please', 'font-weight:300'], ['sign in', 'font-weight:800']], tx + 45, 126 + dy, 250, 34, 20, `font-family:${M};color:${onB}`);
    if(dated) h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, tx + 46, 174, 236, 12, 8.5, '', `${F(700, 12, 15, M)}color:${onB}`);
    const x0 = 112, y0 = 252, rh = 36;
    h += box(100, y0 - 1.5, 3, 7 * rh + 1.5, 'background:#111');
    h += tbl(E, {x0, W: 640, numW: 0, widths: [208, 170, 96, 166], ly: 228, lh: 20, y0, rh, yd: 18, head: '1.5pt solid #111', hr: `.75pt solid ${bw ? 'rgba(0,0,0,.34)' : RULE02}`, last: '1.5pt solid #111',
      vr: `.5pt solid ${bw ? 'rgba(0,0,0,.34)' : RULE02}`,
      labelStyle: `${F(700, 8.5, 9.5, M)}letter-spacing:1.5pt;color:#111;align-items:center`, yn: `border:.9pt solid #111;color:#111;font-family:${M}`,
      num: (i, y, n) => txt('', pad2(n), 20, y + 6, 78, `text-align:center;${F(300, 22, 24, M)}color:#111`)});
    h += foot1(D, [112, 516, 640, 58], {});
    return wrap(fonts(M, M), V02, bw, h);
  };
  L$['fxs-02-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, onB = bw ? '#111' : '#fff', soft = bw ? '#4a4a4a' : '#d6d4d0';
    let h = bw ? box(66, 20, 1.5, 356, 'background:#111') : E.fl(0, 0, 66, 396, 'ltb', `background:${BAND}`);
    h += facts02(L, 26, 30, 84, 38, 11);
    h += ph(D, E, 82, 20, 190, 80, 'border-radius:40pt 0 0 40pt');
    h += icon('pin', 288, 21, 12, '#111') + X.line('place', X.cityZip(L), 304, 22, 280, 9.5, 8, '', `${F(600, 9.5, 11, M)}letter-spacing:1.2pt;color:#111`);
    h += addrSplit('address', L.address, 288, 34, 296, 21, 14, 300, 800, `text-transform:uppercase;color:#111;letter-spacing:.4pt`);
    h += bar02(E, 288, 62, 38, 590);
    h += X.line('oh.label', ev.label, 310, 67, 270, 8, 8, '', `${F(700, 8, 10, M)}letter-spacing:2.4pt;text-transform:uppercase;color:${soft}`);
    h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, 310, 79, 270, 11, 8, '', `${F(700, 11, 14, M)}color:${onB}`);
    const K = kit(M, `${F(700, 8.5, 10, M)}letter-spacing:1.4pt;text-transform:uppercase;color:#111`, `${F(600, 10.5, 12.6, M)}color:#111`, '', `border:.9pt solid #111;color:#111;${F(700, 9.5, 11, M)}`,
      {pills: ticks('50%', 'border:.9pt solid #111', `${F(700, 8, 10, M)}letter-spacing:1pt;text-transform:uppercase;color:#111`)});
    h += box(330, 112, 0, 198, `border-left:.75pt solid ${bw ? 'rgba(0,0,0,.34)' : RULE02}`);
    h += fbBody(D, K, {x: 82, y: 110, aw: 232, bx: 346, bw2: 240});
    h += foot1(D, [82, 322, 508, 50], {});
    return wrap(fonts(M, M), V02, bw, h);
  };

  /* ======================================= FXS-09 NAVY COPPER ======================================= */
  const NAVY = '#16223a', CREAM = '#f1eadf', COPPER = '#d98f52', COPPER_D = '#b4642c', SLATE = '#c9d1de';
  const V09 = `--ink:${NAVY};--muted:#4a5875;--accent:${COPPER_D};--on:${CREAM};--on-soft:${SLATE};--gold:${COPPER};--xg-acc:${COPPER};--line:rgba(22,34,58,.34);--line-on:rgba(241,234,223,.3);--tint:rgba(22,34,58,.045);`;
  // the stat row: cells set between thin copper dividers, a copper hairline above and below
  const stat09 = (x, y, w, hgt, cells, bw, rule) => { const c = bw ? '#111' : (rule || COPPER), n = cells.length;
    return `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt;display:flex;border-top:.75pt solid ${c};border-bottom:.75pt solid ${c}">` +
      cells.map((t, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;${i < n - 1 ? `border-right:.75pt solid ${c};` : ''}">${t}</div>`).join('') + '</div>'; };
  L$['fxs-09-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, cr = bw ? '#111' : CREAM, cp = bw ? '#111' : COPPER, sl = bw ? '#4a4a4a' : SLATE, nv = bw ? '#111' : NAVY;
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', `background:${NAVY}`);
    // the house inset on the navy, as the set sets its photos
    h += ph(D, E, 48, 30, 290, 168);
    const tx = 364, tw = 380;
    h += X.line('oh.label', ev.label, tx, 30, 200, 9.5, 8, '', `${F(500, 9.5, 12, DMS)}letter-spacing:3.5pt;text-transform:uppercase;color:${cp}`);
    h += X.line('place', X.place(L), tx + 204, 30, tw - 204, 9, 8, '', `${F(500, 9, 12, DMS)}letter-spacing:2pt;text-transform:uppercase;text-align:right;color:${sl}`);
    h += two('title', [['Please', `color:${cr}`], ['sign in', `font-style:italic;color:${cp};padding-right:3pt`]], tx, 44, tw, 46, 30, `font-family:${DMD};font-weight:400`);
    h += X.line('address', L.address, tx, dated ? 100 : 103, tw, dated ? 21 : 25, 14, '', `font-family:${DMD};font-weight:400;color:${cr}`);
    if(dated) h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, tx, 129, tw, 9.5, 8, '', `${F(500, 9.5, 12, DMS)}letter-spacing:2.4pt;text-transform:uppercase;color:${cp}`);
    h += stat09(tx, 150, tw, 40, factCells(L).map(([v, l]) => `<div style="${F(400, 17, 19, DMD)}color:${cr}">${esc(v)}</div><div style="${F(500, 8, 10, DMS)}letter-spacing:1.8pt;text-transform:uppercase;color:${cp}">${esc(l)}</div>`), bw);
    // the writing field: white, in a copper rule
    const x0 = 60, y0 = 246, rh = 36;
    h += box(48, 212, 696, 292, bw ? 'border:1pt solid #111' : `background:#fff;border:1.2pt solid ${COPPER}`);
    h += tbl(E, {x0, W: 672, numW: 48, widths: [192, 170, 98, 164], ly: 220, lh: 20, y0, rh, yd: 18, head: `1.4pt solid ${bw ? '#111' : COPPER}`, hr: `.5pt solid ${bw ? 'rgba(0,0,0,.34)' : 'rgba(22,34,58,.28)'}`, last: '0 none',
      vr: `.75pt solid ${bw ? 'rgba(0,0,0,.34)' : 'rgba(217,143,82,.85)'}`, vi: 4,
      labelStyle: `${F(700, 8.5, 9.5, DMS)}letter-spacing:2.2pt;color:${nv};align-items:center`, yn: `border:.8pt solid ${nv};color:${nv};font-family:${DMS}`,
      num: (i, y, n) => txt('', pad2(n), x0, y + 6, 48, `text-align:center;${F(400, 20, 24, DMD)}color:${nv}`)});
    h += foot1(D, [48, 516, 696, 58], {dark: !bw});
    return wrap(fonts(DMD, DMS), V09, bw, h);
  };
  L$['fxs-09-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, cr = bw ? '#111' : CREAM, cp = bw ? '#111' : COPPER, sl = bw ? '#4a4a4a' : SLATE, dk = bw ? '#111' : NAVY;
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', `background:${NAVY}`);
    h += ph(D, E, 34, 22, 150, 76);
    h += X.line('oh.label', ev.label, 202, 24, 200, 9, 8, '', `${F(500, 9, 11, DMS)}letter-spacing:3.5pt;text-transform:uppercase;color:${cp}`);
    h += X.line('place', X.cityZip(L), 406, 24, 172, 9, 8, '', `${F(500, 9, 11, DMS)}letter-spacing:2pt;text-transform:uppercase;text-align:right;color:${sl}`);
    h += X.line('address', L.address, 202, 38, 376, 28, 16, '', `font-family:${DMD};font-weight:400;color:${cr}`);
    h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, 202, 77, 376, 9.5, 8, '', `${F(500, 9.5, 12, DMS)}letter-spacing:2.4pt;text-transform:uppercase;color:${cp}`);
    h += box(34, 105, 544, 211, bw ? 'border:1pt solid #111' : `background:#fff;border:1.2pt solid ${COPPER}`);
    const cell = t => `<div style="${F(700, 8, 10, DMS)}letter-spacing:1.2pt;text-transform:uppercase;color:${dk}">${esc(t)}</div>`;
    const K = kit(DMS, `${F(700, 8.5, 10, DMS)}letter-spacing:2pt;text-transform:uppercase;color:${dk}`, `${F(400, 10.5, 12.6, DMD)}color:${dk}`, '', '', {
      pills: (arr, x, y, w) => stat09(x, y, w, 22, arr.map(cell), bw, COPPER_D),
      marks: (x, y, w) => stat09(x, y, w, 22, [1, 2, 3, 4, 5].map(n => `<div style="${F(400, 13, 15, DMD)}color:${dk}">${n}</div>`), bw, COPPER_D)});
    h += box(306, 114, 0, 194, `border-left:.75pt solid ${bw ? 'rgba(0,0,0,.34)' : COPPER}`);
    h += fbBody(D, K, {x: 48, y: 113, aw: 242, bx: 322, bw2: 242});
    h += foot1(D, [34, 322, 544, 50], {dark: !bw});
    return wrap(fonts(DMD, DMS), V09, bw, h);
  };

  /* ======================================= FXS-11 ESPRESSO PILL ======================================= */
  const ESP = '#2c211b', ESP_T = '#d9cec4', ESP_LN = '#ddd3ca';
  const V11 = `--ink:${ESP};--muted:#6b5a4e;--accent:${ESP};--on:#fff;--on-soft:${ESP_T};--gold:#f3e9df;--xg-acc:#f3e9df;--xg-namew:600;--line:rgba(44,33,27,.3);--line-on:#5b4a40;--tint:rgba(44,33,27,.04);`;
  // a pill tag: round ends, a thin outline (the flyer's label tags), or filled white (the flyer's time pill)
  const pill11 = (slot, t, x, y, hgt, bw, filled, sty) => {
    const bc = bw ? '#111' : '#fff', fg = filled && !bw ? ESP : bc;
    return `<div class="abs nowrap" data-slot="${slot}" style="left:${x}pt;top:${y}pt;height:${hgt}pt;line-height:${hgt - 2}pt;padding:0 ${hgt * .6}pt;border:1pt solid ${bc};border-radius:${hgt}pt;${filled && !bw ? 'background:#fff;' : ''}color:${fg};${sty}">${esc(t)}</div>`; };
  // the set's hero: the house number huge, the street small under it
  const hero11 = (L, x, y, w, big, small, color, soft) => { const [n, st] = splitAddr(L.address);
    return n ? X.line('address', n, x - 2, y, w, big, big * .6, '', `${F(800, big, big, M)}letter-spacing:-.5pt;color:${color}`) + X.line('street', st, x, y + big + 2, w, small, 9, '', `${F(800, small, small * 1.2, M)}text-transform:uppercase;letter-spacing:2pt;color:${color}`)
      : X.line('address', st, x, y + big * .3, w, big * .5, 12, '', `${F(800, big * .5, big * .6, M)}text-transform:uppercase;color:${color}`); };
  L$['fxs-11-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, ES = bw ? '#111' : ESP, e = edge(E), cr = bw ? '#111' : '#fff', soft = bw ? '#4a4a4a' : ESP_T;
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', `background:${ES}`);
    h += ph(D, E, 492, e, 792 - e - 492, 184 - e);
    h += X.line('place', X.cityZip(L), 30, 30, 200, 9, 8, '', `${F(600, 9, 11, M)}text-transform:uppercase;letter-spacing:3pt;color:${soft}`);
    h += hero11(L, 30, 46, 216, 76, 16, cr, soft);
    // right of the number: the label, the white pill, the date or the facts
    const rx = 262;
    h += X.line('oh.label', ev.label, rx, 54, 220, 13, 9, '', `${F(800, 13, 16, M)}text-transform:uppercase;letter-spacing:2pt;color:${cr}`);
    h += pill11('title', 'PLEASE SIGN IN', rx, 78, 30, bw, true, `${F(800, 13, 28, M)}letter-spacing:1.6pt;`);
    if(dated) h += X.line('oh.date', ev.long, rx, 122, 220, 13, 9, '', `${F(800, 13, 16, M)}text-transform:uppercase;letter-spacing:1pt;color:${cr}`) + X.line('oh.time', ev.time, rx, 142, 220, 10, 8, '', `${F(600, 10, 12, M)}text-transform:uppercase;letter-spacing:2pt;color:${soft}`);
    else factCells(L).slice(0, 3).forEach(([v, l], i) => { const fx = rx + i * 70;
      h += txt('', v, fx, 122, 66, `${F(800, 14, 17, M)}color:${cr}`) + txt('', l === 'Bedrooms' ? 'Beds' : l, fx, 141, 66, `${F(700, 8, 10, M)}text-transform:uppercase;letter-spacing:1.6pt;color:${soft}`); });
    // the writing field: white, square, as the set's own cards
    h += box(30, 196, 732, 310, bw ? 'border:1pt solid #111' : 'background:#fff');
    const x0 = 44, W = 704;
    h += tbl(E, {x0, W, numW: 46, widths: [208, 182, 100, 168], ly: 206, lh: 20, y0: 234, rh: 37.5, yd: 18, hr: `.6pt solid ${bw ? 'rgba(0,0,0,.3)' : ESP_LN}`, head: `1.8pt solid ${ES}`, last: '0 none',
      vr: `.6pt solid ${bw ? 'rgba(0,0,0,.3)' : ESP_LN}`, vi: 5,
      labelStyle: `${F(700, 8.5, 9.5, M)}letter-spacing:2pt;color:${ES};align-items:center`, yn: `border:1pt solid ${ES};color:${ES};font-family:${M}`,
      num: (i, y, n) => txt('', String(n), x0, y + 9, 46, `text-align:center;${F(800, 16, 20, M)}color:${ES}`)});
    h += foot1(D, [30, 516, 732, 58], {dark: !bw});
    return wrap(fonts(M, M), V11, bw, h);
  };
  L$['fxs-11-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, ES = bw ? '#111' : ESP, e = edge(E), cr = bw ? '#111' : '#fff', soft = bw ? '#4a4a4a' : ESP_T;
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', `background:${ES}`);
    h += ph(D, E, 404, e, 612 - e - 404, 98 - e);
    h += hero11(L, 26, 26, 150, 46, 11, cr, soft);
    h += X.line('oh.label', ev.label, 186, 24, 206, 9.5, 8, '', `${F(700, 9.5, 12, M)}text-transform:uppercase;letter-spacing:2.25pt;color:${soft}`);
    h += X.line('oh.date', ev.long, 186, 40, 206, 14, 9, '', `${F(800, 14, 17, M)}text-transform:uppercase;letter-spacing:.6pt;color:${cr}`);
    h += pill11('oh.time', ev.time.toUpperCase(), 186, 63, 24, bw, true, `${F(800, 9.5, 22, M)}letter-spacing:1pt;`);
    h += box(22, 104, 568, 212, bw ? 'border:1pt solid #111' : 'background:#fff');
    const K = kit(M, `${F(700, 8, 10, M)}letter-spacing:2pt;text-transform:uppercase;color:${ES}`, `${F(700, 10, 12, M)}color:${ES}`,
      `border:1pt solid ${ES};border-radius:11pt;color:${ES};${F(700, 8, 10, M)}letter-spacing:1pt;text-transform:uppercase`, `border:1pt solid ${ES};color:${ES};${F(700, 9.5, 11, M)}`);
    h += box(298, 114, 0, 194, `border-left:.6pt solid ${bw ? 'rgba(0,0,0,.3)' : ESP_LN}`);
    h += fbBody(D, K, {x: 38, y: 113, aw: 244, bx: 314, bw2: 260});
    h += foot1(D, [30, 322, 552, 50], {dark: !bw});
    return wrap(fonts(M, M), V11, bw, h);
  };

  /* ======================================= FXS-13 SEAL GUTTER ======================================= */
  const PAPER13 = '#f3f1ec', GOLD13 = '#7d6343', RULE13 = '#cfc9bd', CARD13 = '#fbfaf6';
  const V13 = `--ink:#2a2a2a;--muted:#555;--accent:${GOLD13};--on:#fff;--on-soft:#fff;--gold:${GOLD13};--xg-acc:${GOLD13};--xg-namew:600;--line:rgba(84,66,47,.42);--line-on:rgba(255,255,255,.3);--tint:rgba(125,99,67,.06);`;
  // the set's seal: a solid white disc with the neighborhood in it (a thin ring only where the page itself is white); the name sits
  // dead center in the disc both ways by its own ink (owner 11/16/2026, p13-p16)
  const seal13 = (x, y, d, name, size, bw) =>
    box(x, y, d, d, `border-radius:50%;background:#fff;${bw ? 'border:1pt solid #111' : ''}`) +
      `<div class="abs" style="left:${x + 10}pt;top:${y + 10}pt;width:${d - 20}pt;height:${d - 20}pt;display:flex;align-items:center;justify-content:center">` +
      `<div class="disp" data-inkv="${y}:${y + d}" data-inkh="${x}:${x + d}" data-slot="seal" data-lines="2" data-fit2="${size},${size * 1.1},10" style="white-space:normal;text-align:center;width:100%;max-height:${size * 2.2}pt;${F(500, size, size * 1.1, COR)}color:${bw ? '#111' : '#2a2a2a'}">${esc(name)}</div></div>`;
  // the facts the way the set stacks them: a Bodoni numeral, a small caps label, a hairline under each
  const facts13 = (L, x, y, w, rh, ns, bw) => { const fc = factCells(L), cw = (w - 16) / 2; let h = '';
    fc.forEach(([v, l], i) => { const cx = x + (i % 2) * (cw + 16), cy = y + Math.floor(i / 2) * rh;
      h += `<div class="abs nowrap" style="left:${cx}pt;top:${cy}pt;width:${cw}pt;height:${rh - 6}pt;display:flex;align-items:baseline;gap:6pt;border-bottom:.6pt solid ${bw ? 'rgba(0,0,0,.4)' : RULE13}"><span style="${F(500, ns, rh - 8, BOD)}color:${bw ? '#111' : '#2a2a2a'}">${esc(v)}</span><span style="${F(600, 8, 10, M)}letter-spacing:1.6pt;text-transform:uppercase;color:${bw ? '#111' : GOLD13}">${esc(l)}</span></div>`; });
    return h; };
  L$['fxs-13-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, g = bw ? '#111' : GOLD13, ink = bw ? '#111' : '#2a2a2a';
    // warm paper; the address reads up the gutter, dark on the page, a thin rule beside it (no band: only the postcard back is brown)
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', `background:${PAPER13}`);
    h += vt('address', L.address, 54, 372, 330, 36, 18, '', `text-align:center;${F(400, 36, 44, BOD)}color:${ink}`);
    h += box(54, 386, 0, 24, `border-left:.9pt solid ${g}`);
    h += vt('place', place(L).toUpperCase(), 54, 584, 164, 8.5, 8, '', `text-align:center;${F(600, 8.5, 10, M)}letter-spacing:3pt;color:${g}`);
    h += box(94, 30, 0, 548, `border-left:.75pt solid ${bw ? 'rgba(0,0,0,.5)' : GOLD13}`);
    h += ph(D, E, 112, 30, 320, 190);
    // the seal touches the photo's edge and never covers the house
    h += seal13(432, 30, 96, L.neighborhood || L.city || '', 21, bw);
    const tx = 546, tw = 206;
    h += X.line('oh.label', ev.label, tx, 36, tw, 9, 8, '', `${F(600, 9, 11, M)}letter-spacing:2.5pt;text-transform:uppercase;color:${g}`);
    h += box(tx, 53, 34, 1.2, `background:${g}`);
    h += X.line('title', 'Please sign in', tx - 1, 58, tw + 1, 40, 24, '', `${F(600, 40, 46, COR)}color:${ink}`);
    if(dated){ h += X.line('oh.date', ev.long, tx, 110, tw, 19, 11, '', `${F(500, 19, 23, BOD)}color:${ink}`) + X.line('oh.time', ev.time, tx, 137, tw, 9.5, 8, '', `${F(600, 9.5, 11, M)}letter-spacing:2pt;text-transform:uppercase;color:${g}`);
      h += facts13(L, tx, 158, tw, 31, 16, bw); }
    else h += X.line('city', X.cityZip(L), tx, 110, tw, 9, 8, '', `${F(600, 9, 11, M)}letter-spacing:2pt;text-transform:uppercase;color:${bw ? '#4a4a4a' : '#555'}`) + facts13(L, tx, 136, tw, 42, 22, bw);
    const x0 = 112, y0 = 256, rh = 36;
    h += tbl(E, {x0, W: 640, numW: 46, widths: [196, 170, 96, 132], ly: 232, lh: 20, y0, rh, yd: 18, hr: `.6pt solid ${bw ? 'rgba(0,0,0,.34)' : RULE13}`, last: `1.2pt solid ${g}`,
      headBox: box(x0, 228, 640, 0, `border-top:1.2pt solid ${g}`), head: `1.2pt solid ${g}`,
      band: bw ? null : 'rgba(255,255,255,.72)', vr: `.5pt solid ${bw ? 'rgba(0,0,0,.34)' : 'rgba(125,99,67,.45)'}`, vi: 0,
      labelStyle: `${F(600, 8.5, 9.5, M)}letter-spacing:2pt;color:${g};align-items:center`, yn: `border:.8pt solid ${g};color:${g};font-family:${M}`,
      num: (i, y, n) => txt('', pad2(n), x0, y + 6, 46, `text-align:center;${F(500, 19, 24, BOD)}color:${ink}`)});
    h += foot1(D, [x0, 518, 640, 58], {});
    return wrap(fonts(COR, M), V13, bw, h);
  };
  L$['fxs-13-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, g = bw ? '#111' : GOLD13, ink = bw ? '#111' : '#2a2a2a';
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', `background:${PAPER13}`);
    h += vt('address', L.address, 42, 352, 308, 24, 14, '', `text-align:center;${F(400, 24, 29, BOD)}color:${ink}`);
    h += box(66, 20, 0, 356, `border-left:.75pt solid ${bw ? 'rgba(0,0,0,.5)' : GOLD13}`);
    h += ph(D, E, 78, 20, 172, 80);
    h += seal13(250, 24, 70, L.neighborhood || L.city || '', 15, bw);
    h += X.line('oh.label', ev.label, 336, 22, 244, 8.5, 8, '', `${F(600, 8.5, 10, M)}letter-spacing:2.5pt;text-transform:uppercase;color:${g}`);
    h += box(336, 36, 30, 1.2, `background:${g}`);
    h += X.line('title', 'Broker feedback', 335, 39, 246, 25, 16, '', `${F(600, 25, 29, COR)}color:${ink}`);
    h += X.line('oh.date', ev.long, 336, 70, 150, 13, 9, '', `${F(500, 13, 16, BOD)}color:${ink}`);
    h += X.line('oh.time', ev.time, 336, 88, 244, 8.5, 8, '', `${F(600, 8.5, 10, M)}letter-spacing:2pt;text-transform:uppercase;color:${g}`);
    h += box(78, 105, 512, 211, `${bw ? 'border:.9pt solid #111' : `background:${CARD13};border:.75pt solid ${RULE13}`}`);
    const K = kit(M, `${F(600, 8, 10, M)}letter-spacing:2pt;text-transform:uppercase;color:${g}`, `${F(600, 12, 14, COR)}color:${ink}`, '', `border:.8pt solid ${g};color:${ink};${F(500, 10, 12, BOD)}`,
      {q: (slot, t, x, y, w) => X.line(slot, t, x, y - 1, w, 12, 8, '', `${F(600, 12, 14, COR)}color:${ink}`),
       pills: ticks('50%', `border:.8pt solid ${g}`, `${F(600, 8, 10, M)}letter-spacing:1pt;text-transform:uppercase;color:${ink}`)});
    h += box(331, 114, 0, 194, `border-left:.6pt solid ${bw ? 'rgba(0,0,0,.34)' : RULE13}`);
    h += fbBody(D, K, {x: 91, y: 113, aw: 226, bx: 346, bw2: 232});
    h += foot1(D, [78, 322, 512, 50], {});
    return wrap(fonts(COR, M), V13, bw, h);
  };

  /* ======================================= FXS-14 TAUPE SCRIPT ======================================= */
  const TAUPE = '#776a5e', SOFT14 = '#f4efe9', RULE14 = '#d8d1c8';
  const V14 = `--ink:#2b2b2b;--muted:#4a4a4a;--accent:${TAUPE};--on:#fff;--on-soft:${SOFT14};--gold:#fff;--xg-acc:#f4efe9;--xg-namew:600;--line:rgba(80,70,60,.42);--line-on:rgba(255,255,255,.45);--tint:rgba(119,106,94,.06);`;
  // the label with its underline, as the flyer sets "Public Open House"
  const lab14 = (slot, t, x, y, color, size) => txt(slot, t, x, y, null, `${F(600, size, size * 1.2, M)}letter-spacing:3pt;text-transform:uppercase;color:${color};border-bottom:.9pt solid ${color};padding-bottom:3pt`);
  L$['fxs-14-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, e = edge(E), on = bw ? '#111' : '#fff', soft = bw ? '#4a4a4a' : SOFT14, g = bw ? '#111' : TAUPE;
    // the photo and the taupe block run off the top edge (and the block off the right), as on the set's Open House flyer
    const top = bw ? 22 : e;
    let h = bw ? box(356, 22, 418, 190, 'border:1.2pt solid #111') : E.fl(356, 0, 436, 212, 'tr', `background:${TAUPE}`);
    h += ph(D, E, 22, top, 334, 212 - top);
    h += lab14('oh.label', ev.label, 384, 38, on, 9.5);
    h += X.line('title', 'Please sign in', 380, 60, 372, 56, 32, '', `${F(400, 56, 66, PIN)}color:${on}`);
    h += box(384, 135, 368, 0, `border-top:.75pt solid ${bw ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.55)'}`);
    h += X.line('address', L.address, 384, 144, 368, 16, 10, '', `${F(700, 16, 19, BAS)}color:${on}`);
    h += X.line('place', X.cityZip(L), 384, 168, 368, 8.5, 8, '', `${F(600, 8.5, 10, M)}letter-spacing:2pt;text-transform:uppercase;color:${soft}`);
    h += X.line(dated ? 'oh.date' : 'facts', dated ? `${ev.long}  ·  ${ev.time}` : factLine(L), 384, 186, 368, 9, 8, '', `${F(600, 9, 11, M)}letter-spacing:1.6pt;text-transform:uppercase;color:${on}`);
    const x0 = 36, y0 = 250, rh = 35;
    h += tbl(E, {x0, W: 720, numW: 48, widths: [220, 186, 100, 166], ly: 226, lh: 20, y0, rh, yd: 18, hr: `.6pt solid ${bw ? 'rgba(0,0,0,.34)' : RULE14}`,
      headBox: bw ? box(x0, 223, 720, 0, 'border-top:1.5pt solid #111') + box(x0, 249, 720, 0, 'border-top:.75pt solid #111') : `<div class="rowband" style="left:${x0}pt;top:223pt;width:720pt;height:27pt;background:${TAUPE}"></div>`,
      band: bw ? null : 'rgba(119,106,94,.075)', vr: `.5pt solid ${bw ? 'rgba(0,0,0,.34)' : '#c9c0b5'}`, vi: 0,
      labelStyle: `${F(600, 8.5, 9.5, M)}letter-spacing:2pt;color:${on};align-items:center`, yn: `border:.8pt solid ${g};color:${g};font-family:${M}`,
      last: bw ? '1.5pt solid #111' : null,
      num: (i, y, n) => txt('', String(n), x0, y + 6, 48, `text-align:center;${F(700, 16, 23, BAS)}color:${g}`)});
    if(!bw) h += E.fl(0, 504, 792, 108, 'lrb', `background:${TAUPE}`);
    h += foot1(D, [36, 522, 720, 58], {dark: !bw});
    return wrap(fonts(BAS, M), V14, bw, h);
  };
  L$['fxs-14-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, e = edge(E), on = bw ? '#111' : '#fff', soft = bw ? '#4a4a4a' : SOFT14, g = bw ? '#111' : TAUPE;
    const top = bw ? 18 : e;
    let h = bw ? box(200, 18, 390, 82, 'border:1.2pt solid #111') : E.fl(200, 0, 412, 100, 'tr', `background:${TAUPE}`);
    h += ph(D, E, 22, top, 178, 100 - top);
    h += lab14('oh.label', ev.label, 218, 25, on, 8.5);
    h += X.line('address', L.address, 216, 45, 368, 30, 20, '', `${F(400, 30, 36, PIN)}color:${on}`);
    h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, 218, 84, 366, 8.5, 8, '', `${F(600, 8.5, 10, M)}letter-spacing:1.6pt;text-transform:uppercase;color:${soft}`);
    // taupe and white only: the questions sit on white inside a thin taupe hairline box, marks are the set's square hairline boxes
    const K = kit(M, `${F(600, 8, 10, M)}letter-spacing:2pt;text-transform:uppercase;color:${g}`, `${F(700, 10, 12, BAS)}color:#2b2b2b`,
      `border:.8pt solid ${g};color:${g};${F(600, 8, 10, M)}letter-spacing:1pt;text-transform:uppercase`, `border:.8pt solid ${g};border-radius:0;color:${g};${F(400, 10.5, 12, BAS)}`);
    h += box(22, 106, 568, 210, `border:.9pt solid ${bw ? 'rgba(0,0,0,.5)' : TAUPE}`);
    h += box(310, 114, 0, 194, `border-left:.6pt solid ${bw ? 'rgba(0,0,0,.34)' : '#c9c0b5'}`);
    h += fbBody(D, K, {x: 38, y: 113, aw: 254, bx: 328, bw2: 246});
    if(!bw) h += E.fl(0, 321, 612, 75, 'lrb', `background:${TAUPE}`);
    h += foot1(D, [36, 326, 540, 50], {dark: !bw});
    return wrap(fonts(BAS, M), V14, bw, h);
  };
})();
