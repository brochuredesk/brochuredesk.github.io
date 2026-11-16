/* Open House extras for four approved design sets that had none of their own (11/15/2026, NEW designs for the owner's
   review, not approved): The Modern Chronicle, Inside to Outside, The Survey Book and The Vaulted Opening.

   Each sheet and card is built from its set's own fold-over and Open House flyer (templates/<set>/openhouse-a.html and
   its -cards.css), so a sheet laid beside the flyer is plainly the same family:
     chronicle   warm paper; Fraunces headline with the second word in deep red (the set's "Just Listed"); tracked red
                 caps kickers; the red double rule under the masthead; facts in a dotted-rule stack beside the address
                 behind a red hairline; dotted rules between rows.
     insideout   a navy masthead band and a navy foot band holding the contact card (the set's navy field), the writing
                 area white; bold Schibsted titles with "sign in" in amber; amber tracked caps, amber hairlines; facts
                 right-aligned in white caps over amber hairlines; the amber call-out box on the feedback card.
     surveybook  white page; Spectral titles; steel-blue tracked caps; the double hairline under the title; L-shaped
                 corner marks on the photo and on the light-blue panel; facts in a ledger row with vertical dividers;
                 dotted ledger lines between rows.
     vaulted     a midnight page; DM Serif Display titles; pale-blue tracked caps; one white hairline under the title;
                 white keyline frames (a white border with a thin keyline set off it) on the photo and on the white
                 board the rows sit on; the contact card knocked out in white. Never an inset photo.

   The approved extras system (owner, sign-in rounds 2-4, 11/1-11/2/2026) applies to all four:
     - landscape: sign-in 11 x 8.5 (two sheets, rows 1-7 and 8-14), feedback 8.5 x 5.5 (two up at home)
     - the same columns (Name, Phone / Email, Working with an agent? Y N, Agent's name) and roomy hand-writing rows
     - public sign-in sheets never show a date or time; broker and REALTOR® sheets and every feedback card keep it
     - black-and-white versions: no color floods, black ink, and the light grayscale house photo
     - the shared standard footer (#1, full width) for the agent and brokerage
     - feedback fields: price opinion (Too high / About right / Too low), Condition and How it shows 1-5 ("1 low, 5
       high"), "What should the seller update or change?", three prompts with three write-in lines each, Your name,
       Phone or email; the agent may reword every question (D.feedback), each steps down to fit, never under 8 pt
   Brokerage logo: D.brand.logo is the light-ground colorway, D.brand.logoOnDark the knocked-out one for a dark field,
   D.brand.logoBlack the black one for black-and-white pieces (each falls back to D.brand.logo). */
(function(){
  const X = Extras, L$ = X.looks, esc = X.esc;
  const COLS = [{k: 'name', t: 'Name'}, {k: 'contact', t: 'Phone / Email'}, {k: 'agent', t: 'Working with an agent?', yn: true}, {k: 'agentName', t: "Agent's name"}];
  const cols = (x0, numW, widths) => { let x = x0 + numW; return COLS.map((c, i) => { const r = Object.assign({x, w: widths[i]}, c); x += widths[i]; return r; }); };
  const labels = (cs, y, hgt, style) => cs.map(c =>
    `<div class="abs collab" data-slot="col.${c.k}" style="left:${c.x + (c.yn ? 11 : 6)}pt;top:${y}pt;width:${c.w - (c.yn ? 22 : 10)}pt;height:${hgt}pt;white-space:normal;line-height:9.5pt;display:flex;align-items:flex-end;${c.yn ? 'justify-content:center;text-align:center;' : ''}${style || ''}">${c.yn ? 'Working<br>with an agent?' : esc(c.t)}</div>`).join('');
  const FBQ = {
    price: 'Your price opinion', choices: ['Too high', 'About right', 'Too low'], cond: 'Condition', shows: 'How it shows',
    scale: 'Circle one: 1 low, 5 high', seller: 'What should the seller update or change?', name: 'Your name', contact: 'Phone or email',
    prompts: [['like', 'What did you like most?'], ['better', 'What would help it show better?'], ['back', 'What would hold a buyer back?']]};
  const qs = D => { const o = D.feedback || {}, v = t => typeof t === 'string' && t.trim() ? t.trim() : '';
    const r = Object.assign({}, FBQ);
    ['price', 'cond', 'shows', 'seller'].forEach(k => { if(v(o[k])) r[k] = v(o[k]); });
    r.prompts = FBQ.prompts.map(([k, t], i) => [k, v((o.prompts || [])[i]) || t]);
    return r; };
  const box = (x, y, w, h, style) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${style || ''}"></div>`;
  const txt = (slot, t, x, y, w, style, cls) => `<div class="abs nowrap ${cls || ''}" ${slot ? `data-slot="${slot}"` : ''}${/^q\./.test(slot) && w ? ' data-shrink="8"' : ''} style="left:${x}pt;top:${y}pt;${w ? `width:${w}pt;` : ''}${style || ''}">${esc(t)}</div>`;
  const ph = (D, E, x, y, w, h, extra) => { const s = X.photo(D, 'front', x, y, w, h, extra); return E.bw ? s.replace('class="photo"', 'class="photo light"') : s; };
  // a headline whose second part takes the set's accent (Chronicle's red "Listed", Inside to Outside's amber), one line,
  // stepping down to fit its width
  const head = (slot, a, b, x, y, w, size, floor, style, bStyle) =>
    `<div class="abs nowrap" data-slot="${slot}" data-shrink="${floor}" style="left:${x}pt;top:${y}pt;width:${w}pt;font-size:${size}pt;line-height:${size * 1.24}pt;${style}">${esc(a)} <span style="${bStyle}">${esc(b)}</span></div>`;
  // the brokerage logo colorway for the ground the footer sits on
  const withLogo = (D, E, dark) => { const b = D.brand || {};
    const logo = E.bw ? (b.logoBlack || b.logo) : dark ? (b.logoOnDark || b.logo) : b.logo;
    return Object.assign({}, D, {brand: Object.assign({}, b, {logo, logoOnDark: logo})}); };
  const foot1 = (D, E, bx, dark) => StandardFooter.html(1, withLogo(D, E, dark && !E.bw), bx, dark && !E.bw ? {dark: true} : {});
  // the listing's facts the way the sets' flyers list them
  const facts = L => { const f = [], b = Number(L.baths) || 0, full = Math.floor(b), half = b % 1 ? 1 : 0;
    if(L.beds) f.push([String(L.beds), L.beds == 1 ? 'Bedroom' : 'Bedrooms']);
    if(full) f.push([String(full), full == 1 ? 'Full Bath' : 'Full Baths']);
    if(half) f.push(['1', 'Half Bath']);
    if(L.sqft) f.push([Number(L.sqft).toLocaleString('en-US'), 'Sq Ft']);
    if(L.yearBuilt) f.push([String(L.yearBuilt), 'Year Built']);
    return f.slice(0, 4); };
  const factLines = L => facts(L).map(([v, t]) => t === 'Sq Ft' ? `${v} Square Feet` : t === 'Year Built' ? `Built in ${v}` : `${v} ${t}`);
  // seven hand-writing rows: numbers, column rules, the row rule and the Y / N marks in the set's own style
  const rows = (E, o) => {
    let h = '';
    for(let i = 0; i < 7; i++){
      const y = o.y0 + i * o.rh;
      if(o.band && i % 2 === o.band - 1) h += `<div class="rowband" style="left:${o.x}pt;top:${y}pt;width:${o.w}pt;height:${o.rh}pt;background:var(--tint)"></div>`;
      h += o.num(E.first + i, y);
      if(i < 6 || o.lastSep) h += `<div class="abs" style="left:${o.x}pt;top:${y + o.rh}pt;width:${o.w}pt;height:0;${i === 6 && o.lastSep ? o.lastSep : o.sep}"></div>`;
      o.cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - 20.5, y + (o.rh - 18) / 2, 18, o.yn); });
    }
    o.cs.forEach(c => { h += `<div class="abs" style="left:${c.x}pt;top:${o.y0 + (o.vInset || 0)}pt;height:${7 * o.rh - 2 * (o.vInset || 0)}pt;width:0;${o.vrule}"></div>`; });
    return h;
  };
  // the feedback card's questions, in two columns, in the set's style (S): left the price, the two 1-5 marks, the seller
  // question, who you are; right the three prompts with three write-in lines each
  const fbBody = (D, E, S) => {
    const FB = qs(D), x = S.x, lw = S.lw, rx = x + lw + S.gap, rw = S.w - lw - S.gap, y = S.y;
    // labels: tracked caps in the set's body face (not .collab, whose column-label fitter would nudge them left)
    const lab = (slot, t, lx, ly, w) => txt(slot, t, lx, ly, w || 0, 'font-family:var(--font-body);font-weight:700;font-size:8pt;line-height:11pt;letter-spacing:1.1pt;text-transform:uppercase;' + S.lab);
    let h = '';
    h += lab('q.price', FB.price, x, y, lw);
    h += `<div class="abs" style="left:${x}pt;top:${y + 12}pt;width:${lw}pt;display:flex;gap:${S.pillGap != null ? S.pillGap : 7}pt">` + FB.choices.map((t, i) => `<span class="pill" style="flex:1;height:21pt;${S.pill(i)}">${t}</span>`).join('') + '</div>';
    const dx = 104;
    h += lab('q.cond', FB.cond, x, y + 47, dx - 4) + X.dots(x + dx, y + 41, lw - dx, 22, S.dot);
    h += lab('q.shows', FB.shows, x, y + 73, dx - 4) + X.dots(x + dx, y + 67, lw - dx, 22, S.dot);
    h += txt('q.scale', FB.scale, x + dx, y + 90, lw - dx, 'text-align:right;font-size:8pt;color:var(--muted)');
    const sy = y + 108;
    if(S.callout) h += box(x - 8, sy - 6, lw + 16, 54, S.callout);
    h += X.line('q.seller', FB.seller, x, sy, lw, S.qSize || 11.5, 9.5, '', S.q) + X.wline(x, sy + 27, lw, S.wl) + X.wline(x, sy + 44, lw, S.wl);
    const ny = y + 160;
    h += lab('q.name', FB.name, x, ny) + X.wline(x, ny + 20, 118, S.wl) + lab('q.contact', FB.contact, x + 130, ny) + X.wline(x + 130, ny + 20, lw - 130, S.wl);
    if(S.divider) h += box(x + lw + S.gap / 2, y + 2, 0, 174, S.divider);
    const pg = S.pg || 64, py = S.py != null ? S.py : y - 4;
    FB.prompts.forEach(([k, t], i) => { const qy = py + i * pg;
      h += X.line('q.' + k, t, rx, qy, rw, S.pSize || 12, 9.5, '', S.q) +
        (S.lo || [25, 41, 57]).map(o => X.wline(rx, qy + o, rw, S.wl)).join(''); });
    return h;
  };
  const dated = ev => ev.kind !== 'public';
  const placeOf = L => [L.neighborhood, X.cityZip(L)].filter(Boolean).join(' · ').toUpperCase();

  /* =============================== THE MODERN CHRONICLE =============================== */
  const crRule2 = (x, y, w) => box(x, y, w, 3.5, 'border-top:1.6pt solid var(--signal);border-bottom:.5pt solid var(--line)');
  const crStack = (L, x, y, w) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt">` + factLines(L).map((t, i) =>
    `<div class="nowrap" data-slot="fact${i}" style="font-family:var(--font-body);font-weight:600;font-size:8.5pt;line-height:10.5pt;letter-spacing:1.2pt;text-transform:uppercase;color:var(--ink);padding:2pt 0;${i < 3 ? 'border-bottom:.6pt dotted var(--dot)' : ''}">${esc(t)}</div>`).join('') + '</div>';

  L$['chronicle-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), m = 36, W = 720, dt = dated(ev);
    let h = E.bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', 'background:var(--paper)');
    // the masthead: the label in tracked red caps, "Please sign in" in Fraunces (sign in red), the place and address with
    // the facts beside them behind a red hairline; the house on the right
    const lw = 444, px = m + lw + 20, pw = m + W - px;
    h += txt('oh.label', ev.label, m, 30, lw, 'font-family:var(--font-body);font-weight:600;font-size:14pt;line-height:17pt;letter-spacing:3pt;text-transform:uppercase;color:var(--signal)');
    h += head('title', 'Please', 'sign in', m - 2, 46, lw, 56, 36, 'font-family:var(--font-display);font-weight:400;letter-spacing:-1.4pt;color:var(--ink)', 'color:var(--signal)');
    h += txt('place', placeOf(L), m, 120, 262, 'font-family:var(--font-body);font-weight:600;font-size:8.5pt;line-height:10pt;letter-spacing:1.4pt;color:var(--signal)');
    h += X.line('address', L.address, m - 1, 132, 262, 30, 18, 'disp', 'letter-spacing:-.4pt;color:var(--ink)');
    h += box(m + 272, 120, 0.8, 54, 'background:var(--soft)');
    h += crStack(L, m + 284, 117, lw - 284);
    if(dt){
      h += ph(D, E, px, 30, pw, 96);
      h += X.line('oh.date', ev.long, px, 130, pw, 19, 13, 'disp', 'letter-spacing:-.4pt;color:var(--ink)');
      h += X.line('oh.time', ev.time, px, 153, pw, 14, 10, 'disp', 'font-weight:500;color:var(--signal)');
    } else h += ph(D, E, px, 30, pw, 142);
    h += crRule2(m, 178, W);
    // the rows: red labels, red column hairlines, dotted rules between rows (the flyer's facts rules)
    const cs = cols(m, 38, [250, 232, 82, 118]), y0 = 216, rh = 43;
    h += labels(cs, 186, 26, 'color:var(--signal);letter-spacing:1.2pt');
    h += box(m, y0 - .8, W, .8, 'background:var(--signal)');
    h += rows(E, {x: m, y0, w: W, rh, cs, sep: 'border-top:.7pt dotted var(--dot)', lastSep: 'border-top:.8pt solid var(--signal)',
      vrule: 'border-left:.6pt solid var(--soft)', vInset: 0, yn: 'border:.8pt solid var(--signal);color:var(--signal)',
      num: (n, y) => `<div class="num" style="left:${m}pt;top:${y + (rh - 22) / 2}pt;width:38pt;font-family:var(--font-display);font-weight:500;font-size:18pt;line-height:22pt;color:var(--signal)">${n}</div>`});
    h += foot1(D, E, [m, y0 + 7 * rh + 11, W, 62]);
    return h;
  };

  L$['chronicle-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), m = 28, W = 556, tw = 392;
    let h = E.bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', 'background:var(--paper)');
    h += txt('oh.label', ev.label, m, 22, tw, 'font-family:var(--font-body);font-weight:600;font-size:10pt;line-height:12pt;letter-spacing:2.4pt;text-transform:uppercase;color:var(--signal)');
    h += X.line('address', L.address, m - 1, 35, tw, 27, 18, 'disp', 'letter-spacing:-.6pt;color:var(--ink)');
    h += txt('place', placeOf(L), m, 69, tw, 'font-family:var(--font-body);font-weight:600;font-size:8pt;line-height:10pt;letter-spacing:1.4pt;color:var(--signal)');
    h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, m, 81, tw, 12.5, 9.5, 'disp', 'font-weight:500;color:var(--signal)');
    h += ph(D, E, m + W - 140, 22, 140, 80);
    h += crRule2(m, 108, W);
    h += fbBody(D, E, {x: m, y: 120, w: W, lw: 262, gap: 26, py: 116, pg: 63,
      lab: 'font-size:8pt;color:var(--signal);letter-spacing:1.2pt',
      pill: () => 'border:.8pt solid var(--signal);color:var(--ink);font-family:var(--font-body);font-size:8.5pt;letter-spacing:.8pt',
      dot: () => 'border:.9pt solid var(--signal);color:var(--signal);font-family:var(--font-display);font-weight:500;font-size:10.5pt',
      q: 'font-family:var(--font-display);font-weight:500;color:var(--ink);letter-spacing:-.1pt', wl: 'border-top:.6pt solid var(--line)',
      divider: 'border-left:.6pt solid var(--soft)'});
    h += foot1(D, E, [m, 310, W, 58]);
    return h;
  };

  /* ================================ INSIDE TO OUTSIDE ================================ */
  const ioStack = (L, x, y, w) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt">` + factLines(L).map((t, i) =>
    `<div class="nowrap" data-slot="fact${i}" style="text-align:right;font-family:var(--font-display);font-weight:700;font-size:9pt;line-height:12pt;letter-spacing:.9pt;text-transform:uppercase;color:var(--on);${i < 3 ? 'border-bottom:.6pt solid var(--line-on)' : ''}">${esc(t)}</div>`).join('') + '</div>';

  L$['insideout-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), m = 36, W = 720, dt = dated(ev), bw = E.bw;
    let h = '';
    // the navy masthead band (black and white: a heavy rule under the header instead)
    h += bw ? box(m, 182, W, 2, 'background:var(--ink)') : E.fl(0, 0, 792, 184, 'ltr', 'background:var(--navy)');
    h += ph(D, E, m, 30, 216, 132);
    const tx = m + 216 + 24, tw = m + W - tx, fx = m + W - 150;
    h += txt('oh.label', ev.label, tx, 30, tw, 'font-family:var(--font-body);font-weight:600;font-size:13pt;line-height:16pt;letter-spacing:3pt;text-transform:uppercase;color:var(--gold)');
    if(dt){
      h += head('title', 'Please', 'sign in', tx - 1, 48, tw, 44, 30, 'font-family:var(--font-display);font-weight:700;letter-spacing:-1.4pt;color:var(--on)', 'color:var(--gold)');
      h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, tx, 104, tw, 15, 10, '', 'font-family:var(--font-display);font-weight:600;color:var(--gold)');
      h += box(tx, 127, tw, 0, 'border-top:.7pt solid var(--line-on)');
      h += X.line('address', L.address, tx - 1, 136, fx - 14 - tx, 25, 16, '', 'font-family:var(--font-display);font-weight:700;letter-spacing:-.6pt;color:var(--on)');
      h += ioStack(L, fx, 129, 150);
    } else {
      h += head('title', 'Please', 'sign in', tx - 1, 48, tw, 56, 36, 'font-family:var(--font-display);font-weight:700;letter-spacing:-1.8pt;color:var(--on)', 'color:var(--gold)');
      h += box(tx, 121, tw, 0, 'border-top:.7pt solid var(--line-on)');
      h += txt('place', placeOf(L), tx, 129, fx - 14 - tx, 'font-family:var(--font-body);font-weight:600;font-size:8.5pt;line-height:10pt;letter-spacing:1.4pt;color:var(--gold)');
      h += X.line('address', L.address, tx - 1, 140, fx - 14 - tx, 27, 17, '', 'font-family:var(--font-display);font-weight:700;letter-spacing:-.6pt;color:var(--on)');
      h += ioStack(L, fx, 123, 150);
    }
    // the white writing area: navy labels over a heavy navy rule, tinted rows, amber call-out boxes for Y / N
    const cs = cols(m, 38, [250, 232, 82, 118]), y0 = 220, rh = 42;
    h += labels(cs, 190, 24, 'font-family:var(--font-display);font-weight:700;font-size:8.5pt;letter-spacing:1pt;color:var(--navy)');
    h += box(m, y0 - 1.4, W, 1.4, 'background:var(--navy)');
    h += rows(E, {x: m, y0, w: W, rh, cs, band: 2, sep: 'border-top:.5pt solid var(--line)', lastSep: 'border-top:1.4pt solid var(--navy)',
      vrule: 'border-left:.5pt solid var(--line)', vInset: 7, yn: `border:1.1pt solid ${bw ? 'var(--ink)' : 'var(--gold)'};border-radius:0;color:var(--navy);font-family:var(--font-display)`,
      num: (n, y) => `<div class="num" style="left:${m}pt;top:${y + (rh - 18) / 2}pt;width:38pt;font-family:var(--font-display);font-weight:700;font-size:15pt;line-height:18pt;color:var(--navy)">${n}</div>`});
    // the navy foot band holds the contact card, knocked out
    const fy = y0 + 7 * rh + 9;
    h += bw ? '' : E.fl(0, fy, 792, 612 - fy, 'lrb', 'background:var(--navy)');
    // narrow navy sides join the two bands, framing the sheet like the set's 8.5 x 11 flyer (owner 11/16/2026, p5)
    if(!bw) h += E.fl(0, 184, 28, fy - 184, 'l', 'background:var(--navy)') + E.fl(792 - 28, 184, 28, fy - 184, 'r', 'background:var(--navy)');
    h += foot1(D, E, [m, fy + 9, W, 56], true);
    return h;
  };

  L$['insideout-feedback'] = (D, E) => {
    // color: the content steps in to 36 pt so the gold call-out box clears the navy sides (owner 11/16/2026, p7)
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = bw ? 28 : 36, W = 612 - 2 * m, tw = 400, fx = bw ? 0 : 8;
    let h = bw ? box(m, 98, W, 1.6, 'background:var(--ink)') : E.fl(0, 0, 612, 100, 'ltr', 'background:var(--navy)');
    h += txt('oh.label', ev.label, m, 24, tw, 'font-family:var(--font-body);font-weight:600;font-size:10pt;line-height:12pt;letter-spacing:2.4pt;text-transform:uppercase;color:var(--gold)');
    h += X.line('address', L.address, m - 1, 37, tw, 27, 18, '', 'font-family:var(--font-display);font-weight:700;letter-spacing:-.7pt;color:var(--on)');
    h += X.line('oh.date', `${X.cityZip(L).toUpperCase()}  ·  ${ev.long}  ·  ${ev.time}`, m, 74, tw, 10.5, 8.5, '', 'font-family:var(--font-body);font-weight:600;color:var(--on-soft);letter-spacing:.2pt');
    // the house, in an amber hairline frame set off it
    h += box(m + W - 134, 21, 134, 72, `border:.8pt solid ${bw ? 'var(--ink)' : 'var(--gold)'}`) + ph(D, E, m + W - 130, 25, 126, 64);
    h += fbBody(D, E, {x: m, y: 112, w: W, lw: 262 - fx, gap: 30 - fx, py: 110, pg: 62,
      lab: 'font-family:var(--font-display);font-weight:700;font-size:8.5pt;letter-spacing:1pt;color:var(--navy)',
      pill: () => 'background:var(--tint);border-bottom:2pt solid var(--gold);color:var(--navy);font-family:var(--font-display);font-size:8.5pt;letter-spacing:.8pt',
      dot: () => 'border:.9pt solid var(--navy);color:var(--navy);font-family:var(--font-display);font-weight:700;font-size:10pt',
      q: 'font-family:var(--font-display);font-weight:700;color:var(--navy);letter-spacing:-.2pt', qSize: 11, pSize: 11.5,
      wl: 'border-top:.6pt solid var(--line)', callout: `border:1.2pt solid ${bw ? 'var(--ink)' : 'var(--gold)'}`,
      divider: 'border-left:.5pt solid var(--line)'});
    const fy = 300;
    h += bw ? '' : E.fl(0, fy, 612, 396 - fy, 'lrb', 'background:var(--navy)');
    // the same narrow navy sides as the sign-in sheet, framed like the flyer (owner 11/16/2026, p7)
    if(!bw) h += E.fl(0, 100, 24, fy - 100, 'l', 'background:var(--navy)') + E.fl(612 - 24, 100, 24, fy - 100, 'r', 'background:var(--navy)');
    h += foot1(D, E, [m, fy + 8, W, 58], true);
    return h;
  };

  /* ================================== THE SURVEY BOOK ================================== */
  const sbRule2 = (x, y, w) => box(x, y, w, 3.5, 'border-top:1.4pt solid var(--signal);border-bottom:.5pt solid var(--line)');
  const sbCorners = (x, y, w, h) => `<div class="sb-corners" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"></div>`;
  const sbLedger = (L, x, y, w) => { const f = facts(L);
    return `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;display:flex;border-top:.6pt solid var(--line);border-bottom:.6pt solid var(--line)">` +
      f.map(([v, t], i) => `<div style="flex:1;min-width:0;padding:4pt 0 4pt ${i ? 7 : 0}pt;${i ? 'border-left:.6pt solid var(--line)' : ''}">` +
        `<div class="nowrap" data-slot="fact${i}.v" style="font-family:var(--font-display);font-weight:500;font-size:16pt;line-height:18pt;color:var(--ink)">${esc(v)}</div>` +
        `<div class="nowrap" data-slot="fact${i}.t" style="margin-top:1pt;font-family:var(--font-body);font-weight:600;font-size:8pt;line-height:10pt;letter-spacing:.4pt;text-transform:uppercase;color:var(--signal)">${esc(t)}</div></div>`).join('') + '</div>'; };

  L$['surveybook-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), m = 36, W = 720, dt = dated(ev);
    let h = '';
    // the house with the survey's corner marks set off it
    h += ph(D, E, m + 4, 36, 198, 124) + sbCorners(m + 4, 36, 198, 124);
    const tx = m + 202 + 28, tw = m + W - tx;
    h += txt('oh.label', ev.label, tx, 30, tw, 'font-family:var(--font-body);font-weight:600;font-size:13pt;line-height:16pt;letter-spacing:3pt;text-transform:uppercase;color:var(--signal)');
    h += X.line('title', 'Please sign in', tx - 2, 47, tw, dt ? 44 : 52, 34, 'disp', 'font-weight:600;letter-spacing:-1.2pt;color:var(--ink)');
    h += sbRule2(tx, 112, tw);
    const lx = m + W - 272, aw = lx - 14 - tx;
    if(dt){
      h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, tx, 123, aw, 13, 9, 'disp', 'font-weight:500;color:var(--signal)');
      h += X.line('address', L.address, tx - 1, 141, aw, 22, 15, 'disp', 'font-weight:600;letter-spacing:-.5pt;color:var(--ink)');
    } else {
      h += txt('place', placeOf(L), tx, 124, aw, 'font-family:var(--font-body);font-weight:600;font-size:8.5pt;line-height:10pt;letter-spacing:1.4pt;color:var(--signal)');
      h += X.line('address', L.address, tx - 1, 137, aw, 25, 16, 'disp', 'font-weight:600;letter-spacing:-.6pt;color:var(--ink)');
    }
    h += sbLedger(L, lx, 124, m + W - lx);
    // the rows on the light-blue panel with corner marks, dotted ledger lines between rows
    h += `<div class="sb-panel" style="left:${m}pt;top:184pt;width:${W}pt;height:336pt"></div>`;
    const x0 = m + 8, w0 = W - 16, cs = cols(x0, 36, [248, 230, 82, w0 - 36 - 248 - 230 - 82]), y0 = 218, rh = 42;
    h += labels(cs, 190, 24, 'font-family:var(--font-body);font-weight:600;font-size:8pt;letter-spacing:1.2pt;color:var(--signal)');
    h += box(x0, y0 - 3.5, w0, 3.5, 'border-top:1.4pt solid var(--signal);border-bottom:.5pt solid var(--line)');
    h += rows(E, {x: x0, y0, w: w0, rh, cs, sep: 'border-top:.7pt dotted var(--dot)', vrule: 'border-left:.6pt solid var(--line)', vInset: 6,
      yn: 'border:.8pt solid var(--signal);color:var(--signal);font-family:var(--font-body)',
      num: (n, y) => `<div class="num" style="left:${x0}pt;top:${y + (rh - 20) / 2}pt;width:36pt;font-family:var(--font-display);font-weight:600;font-size:17pt;line-height:20pt;color:var(--signal)">${n}</div>`});
    h += foot1(D, E, [m, 530, W, 58]);
    return h;
  };

  L$['surveybook-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), m = 28, W = 556, tw = 396;
    let h = '';
    h += txt('oh.label', ev.label, m, 22, tw, 'font-family:var(--font-body);font-weight:600;font-size:10pt;line-height:12pt;letter-spacing:2.4pt;text-transform:uppercase;color:var(--signal)');
    h += X.line('address', L.address, m - 1, 35, tw, 27, 18, 'disp', 'font-weight:600;letter-spacing:-.6pt;color:var(--ink)');
    h += txt('place', placeOf(L), m, 70, tw, 'font-family:var(--font-body);font-weight:600;font-size:8pt;line-height:10pt;letter-spacing:1.4pt;color:var(--signal)');
    h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, m, 82, tw, 12.5, 9.5, 'disp', 'font-weight:500;color:var(--ink)');
    h += ph(D, E, m + W - 134, 24, 128, 76) + sbCorners(m + W - 134, 24, 128, 76);
    h += sbRule2(m, 110, W);
    // right: the three prompts on the light-blue panel with corner marks
    const lw = 254, gap = 30, rx = m + lw + gap;
    h += `<div class="sb-panel" style="left:${rx - 12}pt;top:122pt;width:${m + W - rx + 12}pt;height:178pt"></div>`;
    h += fbBody(D, E, {x: m, y: 124, w: W - 6, lw, gap, py: 125, pg: 57, lo: [23, 38, 53],
      lab: 'font-family:var(--font-body);font-weight:600;font-size:8pt;letter-spacing:1.2pt;color:var(--signal)',
      pill: i => `border:.6pt solid var(--line);${i ? 'border-left:0;' : ''}color:var(--ink);font-family:var(--font-body);font-size:8.5pt;letter-spacing:.8pt`, pillGap: 0,
      dot: () => 'border:.8pt solid var(--signal);color:var(--signal);font-family:var(--font-display);font-weight:600;font-size:10.5pt',
      q: 'font-family:var(--font-display);font-weight:600;color:var(--ink);letter-spacing:-.1pt', qSize: 11.5, pSize: 12,
      wl: 'border-top:.6pt dotted var(--dot)'});
    h += foot1(D, E, [m, 312, W, 56]);
    return h;
  };

  /* ================================ THE VAULTED OPENING ================================ */
  // the set's white keyline frame: a white border on the box, a thin keyline set 5 pt off it
  const voFrame = (E, x, y, w, h, border) => box(x - 5, y - 5, w + 10, h + 10, `border:.8pt solid ${E.bw ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.75)'}`) +
    (border ? box(x, y, w, h, `border:${border}pt solid ${E.bw ? 'var(--ink)' : '#fff'}`) : '');
  const voStack = (L, x, y, w) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt">` + facts(L).map(([v, t], i) =>
    `<div style="display:flex;align-items:baseline;gap:7pt;white-space:nowrap;border-top:.6pt solid var(--line-on);${i === 3 ? 'border-bottom:.6pt solid var(--line-on);' : ''}padding:1.5pt 0 1pt">` +
      `<b data-slot="fact${i}.v" style="min-width:40pt;font-family:var(--font-display);font-weight:400;font-size:12pt;line-height:12pt;color:var(--on)">${esc(v)}</b>` +
      `<span data-slot="fact${i}.t" style="font-family:var(--font-body);font-weight:600;font-size:8pt;line-height:10pt;letter-spacing:1.1pt;text-transform:uppercase;color:var(--gold)">${esc(t)}</span></div>`).join('') + '</div>';
  const NAVY = 'var(--navy)';

  L$['vaulted-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), m = 36, W = 720, dt = dated(ev), bw = E.bw;
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', 'background:var(--paper)');
    // the house in a white keyline frame
    h += ph(D, E, m + 6, 36, 204, 124) + voFrame(E, m + 6, 36, 204, 124, 2.5);
    const tx = m + 210 + 28, tw = m + W - tx, fx = m + W - 152;
    h += txt('oh.label', ev.label, tx, 30, tw, 'font-family:var(--font-body);font-weight:600;font-size:13pt;line-height:16pt;letter-spacing:3.5pt;text-transform:uppercase;color:var(--gold)');
    h += X.line('title', 'Please sign in', tx - 2, 47, tw, dt ? 46 : 54, 34, 'disp', 'letter-spacing:-1pt;color:var(--on)');
    h += box(tx, 116, tw, 1, `background:${bw ? 'var(--ink)' : 'rgba(255,255,255,.8)'}`);
    if(dt){
      h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, tx, 126, fx - 16 - tx, 15, 10, 'disp', 'color:var(--gold)');
      h += X.line('address', L.address, tx - 1, 146, fx - 16 - tx, 22, 15, 'disp', 'letter-spacing:-.3pt;color:var(--on)');
    } else {
      h += txt('place', placeOf(L), tx, 127, fx - 16 - tx, 'font-family:var(--font-body);font-weight:600;font-size:8.5pt;line-height:10pt;letter-spacing:1.4pt;color:var(--gold)');
      h += X.line('address', L.address, tx - 1, 139, fx - 16 - tx, 27, 17, 'disp', 'letter-spacing:-.4pt;color:var(--on)');
    }
    h += voStack(L, fx, 120, 152);
    // the white board the rows are written on, framed the way the set frames its photos and plan
    const by = 192, bh = 330;
    h += box(m, by, W, bh, `background:#fff;${bw ? 'border:1pt solid var(--ink)' : ''}`) + voFrame(E, m, by, W, bh, 0);
    const x0 = m + 10, w0 = W - 20, cs = cols(x0, 36, [248, 230, 82, w0 - 36 - 248 - 230 - 82]), y0 = by + 38, rh = 41.5;
    h += labels(cs, by + 8, 24, `font-family:var(--font-body);font-weight:700;font-size:8pt;letter-spacing:1.3pt;color:${NAVY}`);
    h += box(x0, y0 - 1, w0, 1, `background:${NAVY}`);
    h += rows(E, {x: x0, y0, w: w0, rh, cs, sep: 'border-top:.6pt solid var(--line)', vrule: 'border-left:.6pt solid var(--line)', vInset: 6,
      yn: `border:.9pt solid ${NAVY};color:${NAVY};font-family:var(--font-body)`,
      num: (n, y) => `<div class="num" style="left:${x0}pt;top:${y + (rh - 21) / 2}pt;width:36pt;font-family:var(--font-display);font-weight:400;font-size:18pt;line-height:21pt;color:${NAVY}">${n}</div>`});
    h += foot1(D, E, [m, 534, W, 56], true);
    return h;
  };

  L$['vaulted-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), m = 28, W = 556, bw = E.bw;
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', 'background:var(--paper)');
    h += ph(D, E, m + 6, 30, 112, 68) + voFrame(E, m + 6, 30, 112, 68, 2.2);
    const tx = m + 140, tw = m + W - tx;
    h += txt('oh.label', ev.label, tx, 26, tw, 'font-family:var(--font-body);font-weight:600;font-size:10pt;line-height:12pt;letter-spacing:2.8pt;text-transform:uppercase;color:var(--gold)');
    h += X.line('address', L.address, tx - 1, 39, tw, 27, 18, 'disp', 'letter-spacing:-.4pt;color:var(--on)');
    h += box(tx, 75, tw, 1, `background:${bw ? 'var(--ink)' : 'rgba(255,255,255,.8)'}`);
    h += X.line('oh.date', `${X.cityZip(L).toUpperCase()}  ·  ${ev.long}  ·  ${ev.time}`, tx, 83, tw, 10.5, 8.5, '', 'font-family:var(--font-body);font-weight:600;color:var(--on-soft);letter-spacing:.2pt');
    // the white board with its keyline
    const by = 110, bh = 192;
    h += box(m, by, W, bh, `background:#fff;${bw ? 'border:1pt solid var(--ink)' : ''}`) + voFrame(E, m, by, W, bh, 0);
    h += fbBody(D, E, {x: m + 12, y: by + 6, w: W - 24, lw: 250, gap: 26, py: by + 4, pg: 58,
      lab: `font-family:var(--font-body);font-weight:700;font-size:8pt;letter-spacing:1.3pt;color:${NAVY}`,
      pill: () => `border:.8pt solid ${NAVY};color:${NAVY};font-family:var(--font-body);font-size:8.5pt;letter-spacing:.8pt`,
      dot: () => `border:.9pt solid ${NAVY};color:${NAVY};font-family:var(--font-display);font-size:11pt`,
      q: `font-family:var(--font-display);font-weight:400;color:${NAVY}`, qSize: 12, pSize: 12.5,
      wl: 'border-top:.6pt solid var(--line)', divider: 'border-left:.6pt solid var(--line)'});
    h += foot1(D, E, [m, 314, W, 56], true);
    return h;
  };
})();
