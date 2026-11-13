/* Open House extras, round 3 (owner 11/1/2026, round 2 review; brief docs/briefs/open-house-extras-build.md).
   Every piece is landscape and has its own design in its set's look; the three sets are built on different layouts:

   Ivory       sign-in: a centered invitation header beside the photo, full-width tinted rows with Playfair numbers,
               the standard footer (#1, full width) along the foot.
               feedback: no color flood; photo and Playfair address up top, choices, 1-5 marks and the seller question
               on the left, the three guided prompts with three write-in lines each on the right.
   Atlas       sign-in: a map-room side column (photo, a crop of the flyer's real street map with the pin, the address,
               the standard footer #2) beside a ledger with red index rings and a double neatline between them.
               feedback: a ledger: numbered rings, square marks, the three prompts side by side across the bottom.
   Swatchbook  sign-in: the brand color as a side panel at the right (photo, address, standard footer #2 knocked out),
               a heavy navy border at the page edge around the white area meeting the panel (none in black and white),
               two-digit gold numbers.
               feedback: a navy band across the top whose type fills it, the photo matted over its edge, swatch-chip
               choices and 1-5 marks on the right, the prompts on the left.

   Standing rules (owner 11/1/2026, round 2 review):
   - Public open house sign-in sheets never show a date or time (agents print a stack and reuse them). Broker and
     REALTOR® open sign-in sheets keep the date and time; feedback cards keep the date and time.
   - Black-and-white public sign-in sheets get a light grayscale photo of the house (X.photo + the .light class).
   - The agent contact footer is the shared standard footer (templates/_shared/footer.js), one of its three versions.
   Feedback fields (owner 11/1): Your price opinion (Too high / About right / Too low); Condition and How it shows 1-5
   ("1 low, 5 high"); What should the seller update or change?; three guided prompts; Your name; Phone or email.

   D.opt holds the review options shown to the owner before they're built (Q5, Q6 of round 2):
     opt.fbBw     black-and-white Ivory and Atlas feedback card header: 'photo' (built, owner 11/2 Q1/Q2: the light
                  grayscale photo) | 'date' | 'none'/'map'
     opt.register Atlas sign-in "Guest register" label: 'none' (built, owner 11/2 Q3: removed) | 'red' | 'ink' | 'kicker'

   The agent can reword every question on a feedback card (owner 11/2/2026, standing rule; no review needed): D.feedback
   {price, cond, shows, seller, prompts: [three strings]}; a blank or missing one keeps the default wording. Each question
   steps down to fit its line, never under 8 pt; one still too long is flagged (too-long) for the editor to ask for less. */
(function(){
  const X = Extras, L$ = X.looks, esc = X.esc;
  const COLS = [{k: 'name', t: 'Name'}, {k: 'contact', t: 'Phone / Email'}, {k: 'agent', t: 'Working with an agent?', yn: true}, {k: 'agentName', t: "Agent's name"}];
  const cols = (x0, numW, widths) => { let x = x0 + numW; return COLS.map((c, i) => { const r = Object.assign({x, w: widths[i]}, c); x += widths[i]; return r; }); };
  const labels = (cs, y, hgt, style) => cs.map(c =>
    `<div class="abs collab" data-slot="col.${c.k}" style="left:${c.x + (c.yn ? 11 : 6)}pt;top:${y}pt;width:${c.w - (c.yn ? 22 : 10)}pt;height:${hgt}pt;white-space:normal;line-height:9.5pt;display:flex;align-items:flex-end;${c.yn ? 'justify-content:center;text-align:center;' : ''}${style || ''}">${c.yn ? 'Working<br>with an agent?' : esc(c.t)}</div>`).join('');   // its last line the longest (last-line rule; 11/13); 11 pt in from each side so it never runs up to the next column's label (owner 11/13, P13/P26)
  const FB = {
    price: 'Your price opinion', choices: ['Too high', 'About right', 'Too low'], cond: 'Condition', shows: 'How it shows',
    scale: 'Circle one: 1 low, 5 high', seller: 'What should the seller update or change?', name: 'Your name', contact: 'Phone or email',
    prompts: [['like', 'What did you like most?'], ['better', 'What would help it show better?'], ['back', 'What would hold a buyer back?']]};
  // the card's questions with the agent's own wording laid over the defaults (D.feedback)
  const qs = D => { const o = D.feedback || {}, v = t => typeof t === 'string' && t.trim() ? t.trim() : '';
    const r = Object.assign({}, FB);
    ['price', 'cond', 'shows', 'seller'].forEach(k => { if(v(o[k])) r[k] = v(o[k]); });
    r.prompts = FB.prompts.map(([k, t], i) => [k, v((o.prompts || [])[i]) || t]);
    return r; };
  const box = (x, y, w, h, style) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${style || ''}"></div>`;
  const txt = (slot, t, x, y, w, style, cls) => `<div class="abs nowrap ${cls || ''}" ${slot ? `data-slot="${slot}"` : ''}${/^q\./.test(slot) && w ? ' data-shrink="8"' : ''} style="left:${x}pt;top:${y}pt;${w ? `width:${w}pt;` : ''}${style || ''}">${esc(t)}</div>`;
  // the house photo; on black-and-white pieces a light grayscale print of it
  const ph = (D, E, x, y, w, h, extra) => { const s = X.photo(D, 'front', x, y, w, h, extra); return E.bw ? s.replace('class="photo"', 'class="photo light"') : s; };
  const opt = D => D.opt || {};
  // the standard footer (templates/_shared/footer.js); feedback cards all use #1 at the same spot
  const FOOT = 308, FOOT_H = 58;
  const foot1 = (D, box, o) => StandardFooter.html(1, D, box, o);
  const foot2 = (D, box, o) => StandardFooter.html(2, D, box, o);

  /* ================================ IVORY ================================ */
  L$['ivory-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), m = 36, W = 792 - 2 * m, dated = ev.kind !== 'public';
    let h = '';
    if(dated){
      // broker and REALTOR® opens keep the date: photo | invitation | the date tile in the agent's color
      h += ph(D, E, m, 30, 196, 134);
      const tx = m + W - 150;
      h += box(tx, 30, 150, 134, E.bw ? 'border:.9pt solid var(--ink)' : 'background:var(--accent)');
      h += txt('oh.weekday', ev.weekday, tx, 44, 150, 'text-align:center;font:600 9pt/1 var(--font-body);letter-spacing:1.8pt;text-transform:uppercase;color:var(--on-soft)');
      h += txt('oh.day', ev.day, tx, 56, 150, 'text-align:center;font-size:58pt;line-height:64pt;color:var(--on)', 'disp');
      h += txt('oh.month', ev.month, tx, 122, 150, 'text-align:center;font:600 10pt/1 var(--font-body);letter-spacing:2pt;text-transform:uppercase;color:var(--on)');
      h += X.line('oh.time', ev.time, tx + 8, 140, 134, 10, 8, '', 'text-align:center;font-weight:700;color:var(--on-soft)');
      const cx = m + 196 + 22, cw = tx - 22 - cx;
      h += X.flank(ev.label, cx + cw / 2, 34, cw, 'kicker', 'font-size:10pt;letter-spacing:2.6pt;color:var(--accent)', '.6pt solid var(--accent)');
      h += X.line('title', 'Please sign in', cx, 52, cw, 40, 28, 'disp', 'text-align:center;line-height:50pt');
      h += txt('welcome', 'Welcome to', cx, 106, cw, 'text-align:center;font:400 11pt/1 var(--font-body);color:var(--muted)');
      h += X.line('address', L.address, cx, 120, cw, 20, 14, 'disp', 'text-align:center');
      h += X.line('place', X.cityZip(L).toUpperCase(), cx, 149, cw, 8.5, 8, '', 'text-align:center;letter-spacing:1.8pt;color:var(--muted);font-weight:600');
    } else {
      // public: no date or time; the invitation grows to fill the header (black and white: bigger, with air around it)
      h += ph(D, E, m, 30, 196, 134);
      const cx = m + 196 + 26, cw = m + W - cx, big = !E.bw;
      const S = big ? {lab: 12.5, ly: 28, ty: 38, t: 56, tl: 62, wy: 106, w: 12.5, ay: 122, a: 28, py: 158, p: 9.5}
                    : {lab: 11, ly: 36, ty: 48, t: 46, tl: 52, wy: 106, w: 11.5, ay: 121, a: 23, py: 153, p: 8.5};
      const iw = big ? cw : cw - 60, ix = cx + (cw - iw) / 2;
      h += X.flank(ev.label, ix + iw / 2, S.ly, iw, 'kicker', `font-size:${S.lab}pt;letter-spacing:3pt;color:var(--accent)`, '.6pt solid var(--accent)');
      h += X.line('title', 'Please sign in', ix, S.ty, iw, S.t, 36, 'disp', `text-align:center;line-height:${S.tl}pt`);
      h += txt('welcome', 'Welcome to', ix, S.wy, iw, `text-align:center;font:400 ${S.w}pt/1 var(--font-body);color:var(--muted)`);
      h += X.line('address', L.address, ix, S.ay, iw, S.a, 16, 'disp', 'text-align:center');
      h += X.line('place', X.cityZip(L).toUpperCase(), ix, S.py, iw, S.p, 8, '', 'text-align:center;letter-spacing:2pt;color:var(--muted);font-weight:600');
    }
    h += E.fl(0, 178, 792, 1.1, 'lr', 'background:var(--accent)');
    // seven roomy rows, full width
    const cs = cols(m, 38, [250, 232, 82, 118]), y0 = 214, rh = 44;
    h += labels(cs, 186, 24, 'color:var(--accent)');
    h += box(m, y0 - 1.2, W, 1.2, 'background:var(--accent)');
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      if(i % 2 === 0) h += `<div class="rowband" style="left:${m}pt;top:${y}pt;width:${W}pt;height:${rh}pt;background:var(--tint)"></div>`;
      h += `<div class="num disp" style="left:${m}pt;top:${y + 12}pt;width:38pt;font-size:17pt;line-height:20pt;color:var(--accent)">${E.first + i}</div>`;
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - 20.5, y + 13, 18, 'border:.8pt solid var(--accent);color:var(--accent)'); });
    }
    cs.forEach(c => { h += `<div class="vrule" style="left:${c.x}pt;top:${y0}pt;height:${7 * rh}pt"></div>`; });
    h += box(m, y0 + 7 * rh, W, 0, 'border-top:.8pt solid var(--accent)');
    h += foot1(D, [m, y0 + 7 * rh + 12, W, 62]);
    return h;
  };

  // the ruled date (black-and-white feedback cards, where the photo sits on the color card)
  const ruledDate = (ev, x, y, w, h) => box(x, y, w, h, 'border:.9pt solid var(--ink);background:#fff') +
    txt('oh.weekday', ev.wd3, x, y + 8, w, 'text-align:center;font:600 8pt/1 var(--font-body);letter-spacing:1.6pt;text-transform:uppercase') +
    txt('oh.day', ev.day, x, y + h / 2 - 20, w, `text-align:center;font-size:${Math.min(34, h * .45)}pt;line-height:40pt`, 'disp') +
    txt('oh.month', ev.month, x, y + h - 16, w, 'text-align:center;font:600 8pt/1 var(--font-body);letter-spacing:1.6pt;text-transform:uppercase');

  L$['ivory-feedback'] = (D, E) => {
    const FB = qs(D);
    const L = D.listing, ev = X.ev(D), m = 28, W = 612 - 2 * m, bwMode = E.bw ? (opt(D).fbBw || 'photo') : 'photo';
    let h = '';
    // header: no color flood (owner 11/1: less background color); the photo, the label on a rule, the address in Playfair
    let hx = m + 120;
    if(bwMode === 'date') h += ruledDate(ev, m, 22, 104, 70);
    else if(bwMode === 'photo') h += ph(D, E, m, 22, 104, 70);
    else hx = m;
    const hw = m + W - hx;
    h += `<div class="abs" style="left:${hx}pt;top:22pt;width:${hw}pt;display:flex;align-items:center;gap:8pt"><div class="kicker" data-slot="oh.label" style="font-size:9pt;letter-spacing:2.2pt;color:var(--accent)">${esc(ev.label)}</div><div style="flex:1;border-top:.6pt solid var(--accent);opacity:.6"></div></div>`;
    h += X.line('address', L.address, hx, 35, hw, 22, 14, 'disp');
    h += X.line('place', X.cityZip(L).toUpperCase(), hx, 64, hw, 8, 8, '', 'letter-spacing:1.6pt;color:var(--muted);font-weight:600');
    h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, hx, 78, hw, 10, 8, '', 'font-weight:700;color:var(--accent)');
    h += box(m, 99, W, 0, 'border-top:.8pt solid var(--accent)');
    // left: the price choice, the 1-5 marks, the seller question, who you are
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, 'font-size:8pt;color:var(--accent)', 'collab');
    const lw = 262;
    h += lab('q.price', FB.price, m, 110, lw);
    h += `<div class="abs" style="left:${m}pt;top:122pt;width:${lw}pt;display:flex;gap:8pt">` + FB.choices.map(t => `<span class="pill" style="flex:1;height:22pt;border-radius:11pt;border:.8pt solid var(--accent);color:var(--accent);font-size:8.5pt;letter-spacing:.8pt">${t}</span>`).join('') + '</div>';
    const soft = () => 'border:.9pt solid var(--accent);background:var(--tint);color:var(--accent);font-size:10pt';
    h += lab('q.cond', FB.cond, m, 160, 100) + X.dots(m + 104, 153, lw - 104, 23, soft);
    h += lab('q.shows', FB.shows, m, 189, 100) + X.dots(m + 104, 182, lw - 104, 23, soft);
    h += txt('q.scale', FB.scale, m + 104, 208, lw - 104, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += X.line('q.seller', FB.seller, m, 222, lw, 11.5, 9.5, 'disp', 'color:var(--ink)') + X.wline(m, 251, lw) + X.wline(m, 270, lw);
    h += lab('q.name', FB.name, m, 279) + X.wline(m, 300, 122) + lab('q.contact', FB.contact, m + 134, 279) + X.wline(m + 134, 300, lw - 134);
    // right: the three guided prompts, a Playfair question over three writing lines each (owner 11/1)
    const rx = m + lw + 26, rw = W - lw - 26;
    h += `<div class="vrule" style="left:${m + lw + 13}pt;top:110pt;height:190pt"></div>`;
    FB.prompts.forEach(([k, t], i) => { const y = 106 + i * 66;
      h += X.line('q.' + k, t, rx, y, rw, 12, 10, 'disp', 'color:var(--ink)') + X.wline(rx, y + 30, rw) + X.wline(rx, y + 47, rw) + X.wline(rx, y + 64, rw); });
    h += foot1(D, [m, FOOT, W, FOOT_H]);
    return h;
  };

  /* ================================ ATLAS ================================ */
  // a crop of the flyer's real street map (owner 11/1, Q4): data.map, the same OpenStreetMap data the Atlas flyer draws
  // (local meters, x east, y south, the listing at 0,0). Streets, parks and water in the set's map colors (grays in black
  // and white), the listing's red pin at (px, py) in the tile. The piece credits OpenStreetMap under it.
  let mapN = 0;
  const CLS = {residential: [3.2, 2.2], unclassified: [3.2, 2.2], tertiary: [3.9, 2.9], secondary: [4.7, 3.7], primary: [5.6, 4.6], trunk: [6, 5], motorway: [6.6, 5.6]};
  const ORDER = ['residential', 'unclassified', 'tertiary', 'secondary', 'primary', 'trunk', 'motorway'];
  const pin = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s || 1})"><path d="M0 0c-6.5-8.5-9.5-13-9.5-17a9.5 9.5 0 0 1 19 0c0 4-3 8.5-9.5 17z" fill="var(--signal)" stroke="#fff" stroke-width="1"/><circle cy="-17" r="3.6" fill="#fff"/></g>`;
  const streetMap = (D, E, x, y, w, h, o) => {
    o = o || {};
    const M = D.map, id = 'mc' + (++mapN), px = o.px != null ? o.px : w / 2, py = o.py != null ? o.py : h / 2 + 8;
    const c = E.bw ? {land: '#fff', casing: '#a3a3a3', fill: '#fff', park: '#ececec', water: '#dedede', edge: '#111'}
                   : {land: 'var(--land)', casing: '#bdb8a8', fill: '#fbfaf5', park: '#cfdcc2', water: '#bccfd3', edge: 'rgba(31,58,50,.45)'};
    let g = `<svg class="abs" style="left:${x}pt;top:${y}pt" width="${w}pt" height="${h}pt" viewBox="0 0 ${w} ${h}">` +
      `<defs><clipPath id="${id}"><rect width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#${id})"><rect width="${w}" height="${h}" fill="${c.land}"/>`;
    if(M){
      const k = o.k || w / 760, P = pts => 'M' + pts.map(p => `${(px + p[0] * k).toFixed(1)} ${(py + p[1] * k).toFixed(1)}`).join('L');
      (M.areas || []).forEach(a => { g += a.line ? `<path d="${P(a.p)}" fill="none" stroke="${c.water}" stroke-width="${Math.max(3, 18 * k)}" stroke-linecap="round"/>` : `<path d="${P(a.p)}Z" fill="${a.k === 'water' ? c.water : c.park}"/>`; });
      const by = ORDER.map(cl => (M.ways || []).filter(wy => wy.c === cl));
      by.forEach((ws, i) => { if(ws.length) g += `<path d="${ws.map(wy => P(wy.p)).join('')}" fill="none" stroke="${c.casing}" stroke-width="${CLS[ORDER[i]][0]}" stroke-linecap="round" stroke-linejoin="round"/>`; });
      by.forEach((ws, i) => { if(ws.length) g += `<path d="${ws.map(wy => P(wy.p)).join('')}" fill="none" stroke="${c.fill}" stroke-width="${CLS[ORDER[i]][1]}" stroke-linecap="round" stroke-linejoin="round"/>`; });
    } else X.issue({kind: 'map-missing', slot: 'map'});
    g += `</g><rect x=".4" y=".4" width="${w - .8}" height="${h - .8}" fill="none" stroke="${c.edge}" stroke-width=".8"/>`;
    if(o.pin !== false) g += pin(px, py, o.pinScale);
    return g + '</svg>' + (o.north ? north(x + w - 29, y + 5) : '');
  };
  const credit = (x, y, w) => `<div class="abs fine" data-fine="1" style="left:${x}pt;top:${y}pt;width:${w}pt">Street map drawn from OpenStreetMap data. © OpenStreetMap contributors</div>`;
  const north = (x, y) => `<svg class="abs" style="left:${x}pt;top:${y}pt" width="22pt" height="22pt" viewBox="0 0 26 26"><circle cx="13" cy="13" r="12" fill="#fff" stroke="var(--ink)" stroke-width="1"/><path d="M13 3.5l5 14-5-3.5-5 3.5z" fill="var(--ink)"/></svg><div class="abs" style="left:${x}pt;top:${y + 23}pt;width:22pt;text-align:center;font:700 8pt/1 var(--font-display);color:var(--ink)"><span style="display:inline-block;padding:2pt 3pt;background:rgba(255,255,255,.92);border-radius:2pt">N</span></div>`;   // the white chip keeps streets off the N (owner 11/2 clearance rule)
  const ring = (x, y, d, n, size) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${d}pt;height:${d}pt;border-radius:50%;border:1.1pt solid var(--signal);color:var(--signal);font:700 ${size || 8.5}pt/${d - 2.2}pt var(--font-display);text-align:center">${n}</div>`;
  const pinGlyph = '<svg width="7pt" height="10pt" viewBox="0 0 7 10" style="vertical-align:-1pt;margin-right:4pt"><path d="M3.5 10C1.2 7 0 5.3 0 3.6a3.5 3.5 0 0 1 7 0C7 5.3 5.8 7 3.5 10z" fill="var(--signal)"/><circle cx="3.5" cy="3.5" r="1.3" fill="#fff"/></svg>';

  L$['atlas-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), m = 36, cw = 212, dated = ev.kind !== 'public', reg = opt(D).register || 'none';
    let h = '';
    // the side column: event (and the date on broker opens), photo, the street map, address, the standard footer #2
    h += txt('oh.label', ev.label, m, 34, cw, 'font:700 10.5pt/1 var(--font-body);letter-spacing:2.4pt;text-transform:uppercase;color:var(--signal)');
    let ty = 52;
    if(dated){
      h += X.line('oh.date', ev.long, m - 1, 50, cw, 26, 18, 'disp', 'font-weight:700;letter-spacing:-.3pt');
      h += X.line('oh.time', ev.time, m, 82, cw, 16, 12, 'disp', 'font-weight:600');
      ty = 112;
    }
    const phH = dated ? 104 : 150, my = ty + phH + 8, mh = dated ? 80 : 96;
    h += ph(D, E, m, ty, cw, phH);
    h += streetMap(D, E, m, my, cw, mh, {north: true});
    h += credit(m, my + mh + 3, cw);
    // welcome, address (one or two lines) and place flow down from under the map
    h += `<div class="abs" style="left:${m}pt;top:${my + mh + 18}pt;width:${cw}pt">` +
      `<div class="nowrap" data-slot="welcome" style="font:600 11pt/14pt var(--font-body);color:var(--muted)">Welcome to</div>` +
      `<div class="disp" data-slot="address" data-lines="2" style="margin-left:-1pt;max-height:58pt;white-space:normal;font-weight:700;font-size:24pt;line-height:28pt;letter-spacing:-.3pt">${esc(L.address)}</div>` +
      `<div class="nowrap" data-slot="place" style="margin-top:5pt;font:600 8.5pt/10pt var(--font-body);letter-spacing:1.5pt;color:var(--signal);text-transform:uppercase">${pinGlyph}${esc(X.place(L))}</div></div>`;
    h += foot2(D, [m, 430, cw, 160]);
    // the neatline: a heavy rule with a hairline beside it, like a map's border
    const nx = m + cw + 18;
    h += box(nx, 30, 0, 560, 'border-left:1.4pt solid var(--ink)') + box(nx + 4, 30, 0, 560, 'border-left:.5pt solid var(--ink)');
    // the ledger
    const lx = nx + 22, lw = 792 - m - lx, cs = cols(lx, 34, [146, 140, 60, lw - 34 - 146 - 140 - 60]);
    const regStyle = 'font:700 9pt/1 var(--font-body);letter-spacing:2pt;text-transform:uppercase;';
    if(reg === 'kicker'){
      h += txt('', 'Guest register', lx, 24, 200, regStyle + 'color:var(--signal)');
      h += X.line('title', 'Please sign in', lx - 1, 32, lw, 40, 28, 'disp', 'font-weight:700;letter-spacing:-.5pt');
    } else {
      h += X.line('title', 'Please sign in', lx - 1, 26, lw - 140, 40, 28, 'disp', 'font-weight:700;letter-spacing:-.5pt');
      if(reg !== 'none') h += txt('', 'Guest register', lx + lw - 140, 46, 140, regStyle + 'text-align:right;color:' + (reg === 'ink' ? 'var(--muted)' : 'var(--signal)'));
    }
    h += labels(cs, 76, 30, 'font-family:var(--font-display);font-weight:700;font-size:9pt;letter-spacing:.9pt;color:var(--ink);line-height:10pt');
    const y0 = 110, rh = 68;
    h += box(lx, y0 - 1.4, lw, 1.4, 'background:var(--ink)');
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      if(i % 2) h += `<div class="rowband" style="left:${lx}pt;top:${y}pt;width:${lw}pt;height:${rh}pt;background:var(--tint)"></div>`;
      h += ring(lx + 6, y + 24, 20, E.first + i, 9.5);
      h += `<div class="hrule" style="left:${lx}pt;top:${y + rh}pt;width:${lw}pt;${i === 6 ? 'border-top:1.4pt solid var(--ink)' : ''}"></div>`;
      // tick marks at the column starts, top and bottom, like a survey's ledger
      cs.forEach(c => { h += `<div class="abs" style="left:${c.x}pt;top:${y + 6}pt;height:${rh - 12}pt;border-left:.5pt solid var(--line)"></div>`;
        if(c.yn) h += X.yn(c.x + c.w / 2 - 20.5, y + 25, 18, 'border:.9pt solid var(--ink);color:var(--ink);font-family:var(--font-display)'); });
    }
    return h;
  };

  L$['atlas-feedback'] = (D, E) => {
    const FB = qs(D);
    const L = D.listing, ev = X.ev(D), m = 28, W = 612 - 2 * m, bwMode = E.bw ? (opt(D).fbBw || 'photo') : 'photo';
    let h = '';
    h += txt('oh.label', ev.label, m, 20, 380, 'font:700 9.5pt/1 var(--font-body);letter-spacing:2.2pt;text-transform:uppercase;color:var(--signal)');
    h += X.line('address', L.address, m - 1, 30, 390, 26, 18, 'disp', 'font-weight:700;letter-spacing:-.3pt');
    h += `<div class="abs nowrap" data-slot="place" style="left:${m}pt;top:63pt;width:390pt;font:600 8pt/1 var(--font-body);letter-spacing:1.4pt;color:var(--signal);text-transform:uppercase">${pinGlyph}${esc(X.cityZip(L))}</div>`;
    h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, m, 76, 390, 11.5, 9, 'disp', 'font-weight:600');
    // the street map tile with the photo matted on its left and the pin in the open strip at the right
    const tx = m + W - 150, tw = 150, th = 74, ty = 16;   // 74: the credit under the tile clears the rule at 100 (owner 11/2 clearance rule)
    if(bwMode === 'map') h += streetMap(D, E, tx, ty, tw, th, {px: tw / 2, py: th / 2 + 8, k: tw / 520});
    else {
      h += streetMap(D, E, tx, ty, tw, th, {px: 124, py: th / 2 + 10, k: tw / 520});
      h += box(tx + 5, ty + 5, 94, th - 10, 'background:#fff');
      h += bwMode === 'date' ? ruledDate(ev, tx + 8, ty + 8, 88, th - 16) : ph(D, E, tx + 8, ty + 8, 88, th - 16);
    }
    h += credit(tx - 120, ty + th + 2, tw + 120).replace('Street map drawn from OpenStreetMap data. ', 'Map: ').replace('width:', 'text-align:right;width:');
    h += box(m, 100, W, 1.4, 'background:var(--ink)');
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w || 0, 'font:700 9.5pt/11pt var(--font-display);letter-spacing:1pt;text-transform:uppercase');
    const sq = () => 'border:.9pt solid var(--ink);color:var(--ink);font-family:var(--font-display);border-radius:0;font-size:10pt';
    const half = (W - 24) / 2, rx = m + half + 24;
    // left: price, the two 1-5 marks; right: the seller question, who you are
    h += ring(m, 109, 17, 1) + lab('q.price', FB.price, m + 24, 112, half - 24);
    h += `<div class="abs" style="left:${m + 24}pt;top:129pt;width:${half - 24}pt;display:flex;gap:6pt">` + FB.choices.map(t => `<span style="flex:1;height:20pt;display:flex;align-items:center;gap:5pt;padding-left:6pt;border:.9pt solid var(--ink);font:700 8.5pt/1 var(--font-display);letter-spacing:.6pt;text-transform:uppercase;white-space:nowrap"><span style="width:9pt;height:9pt;border:.9pt solid var(--signal);flex:none"></span>${t}</span>`).join('') + '</div>';
    h += ring(m, 160, 17, 2) + lab('q.cond', FB.cond, m + 24, 163, 100) + X.dots(m + 128, 156, half - 128, 23, sq);
    h += ring(m, 188, 17, 3) + lab('q.shows', FB.shows, m + 24, 191, 100) + X.dots(m + 128, 184, half - 128, 23, sq);
    h += txt('q.scale', 'Check one: 1 low, 5 high', m + 128, 210, half - 128, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += box(m + half + 12, 109, 0, 112, 'border-left:.5pt solid var(--line)');
    h += ring(rx, 109, 17, 4) + X.line('q.seller', FB.seller, rx + 24, 112, half - 24, 9.5, 8, '', 'font:700 9.5pt/11pt var(--font-display);letter-spacing:.6pt;text-transform:uppercase');
    h += X.wline(rx, 145, half, 'border-color:var(--ink);opacity:.45') + X.wline(rx, 164, half, 'border-color:var(--ink);opacity:.45');
    h += lab('q.name', FB.name, rx, 176) + X.wline(rx, 196, half * .44, 'border-color:var(--ink);opacity:.45');
    h += lab('q.contact', FB.contact, rx + half * .5, 176) + X.wline(rx + half * .5, 196, half * .5, 'border-color:var(--ink);opacity:.45');
    h += box(m, 224, W, 0, 'border-top:.5pt solid var(--ink)');
    // the three prompts side by side, each with its ring, across the foot of the ledger
    const pw = (W - 2 * 16) / 3;
    FB.prompts.forEach(([k, t], i) => { const x = m + i * (pw + 16);
      if(i) h += box(x - 8, 232, 0, 66, 'border-left:.5pt solid var(--line)');
      h += ring(x, 231, 16, 5 + i, 8) + X.line('q.' + k, t, x + 21, 233, pw - 21, 9, 8, 'disp', 'font-weight:700;letter-spacing:.2pt');
      h += X.wline(x, 262, pw) + X.wline(x, 280, pw) + X.wline(x, 298, pw); });
    h += foot1(D, [m, FOOT, W, FOOT_H]);
    return h;
  };

  /* ============================== SWATCHBOOK ============================== */
  L$['swatchbook-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), m = 44, px = 536, pi = px + 20, pw = 792 - 36 - pi, dated = ev.kind !== 'public';
    let h = '';
    // the brand color as a side panel at the right (black-and-white: a ruled panel)
    h += E.bw ? box(px, 18, 792 - 18 - px, 576, 'border:1pt solid var(--ink)') : E.fl(px, 0, 792 - px, 612, 'trb', 'background:var(--navy)');
    // public: no date or time, the photo takes the room; broker opens keep the date under a shorter photo
    const phH = dated ? 160 : 236;
    h += ph(D, E, pi, 36, pw, phH);
    let y = 36 + phH + 14;
    h += txt('oh.label', ev.label, pi, y, pw, 'font:700 9.5pt/1 var(--font-display);letter-spacing:2.4pt;text-transform:uppercase;color:var(--gold)');
    if(dated){
      h += txt('oh.weekday', ev.weekday, pi, y + 18, pw, 'font:500 13pt/1 var(--font-display);color:var(--on-soft)');
      h += X.line('oh.date', ev.monthDay, pi - 1, y + 34, pw, 32, 22, 'disp', 'font-weight:500;color:var(--on);letter-spacing:-.5pt');
      h += X.line('oh.time', ev.time, pi, y + 74, pw, 15, 11, 'disp', 'font-weight:700;color:var(--on)');
      y += 104;
    } else y += 22;
    h += box(pi, y, 36, 2, 'background:var(--gold)');
    h += `<div class="abs" style="left:${pi}pt;top:${y + 14}pt;width:${pw}pt">` +
      `<div class="nowrap" data-slot="welcome" style="font:500 10.5pt/14pt var(--font-display);color:var(--on-soft)">Welcome to</div>` +
      `<div class="disp" data-slot="address" data-lines="2" style="margin-left:-1pt;max-height:60pt;white-space:normal;font-weight:500;font-size:${dated ? 20 : 23}pt;line-height:${dated ? 25 : 30}pt;color:var(--on);letter-spacing:-.3pt">${esc(L.address)}</div>` +
      `<div class="nowrap" data-slot="place" style="margin-top:6pt;font:700 8.5pt/10pt var(--font-body);letter-spacing:1.7pt;color:var(--gold);text-transform:uppercase">${esc(X.cityZip(L))}</div></div>`;
    h += foot2(D, [pi, 430, pw, 146], {dark: !E.bw});
    // the writing side: "Please sign in" in a heavy brand-color bracket, open on the left (owner 11/1)
    // color (owner 11/2): the heavy navy border moves out to the page edge, around the white area's left, top and bottom
    // like a U, meeting the navy panel; it runs into the bleed on the printer file and sits on the white margin at home
    if(!E.bw){ const inner = (E.home ? 18 : 0) + 6;
      h += E.fl(0, 0, inner, 612, 'ltb', 'background:var(--navy)') + E.fl(0, 0, px, inner, 'lt', 'background:var(--navy)') + E.fl(0, 612 - inner, px, inner, 'lb', 'background:var(--navy)'); }
    const lw = px - 22 - m, cs = cols(m, 32, [128, 150, 60, lw - 32 - 128 - 150 - 60]);
    h += X.line('title', 'Please sign in', m - 1, 24, lw, 38, 26, 'disp', 'font-weight:500;letter-spacing:-.6pt;line-height:46pt');
    h += labels(cs, 82, 24, 'font-family:var(--font-display);font-weight:700;color:var(--navy);letter-spacing:.9pt');
    const y0 = 112, rh = 66;
    h += box(m, y0 - 2, lw, 2, 'background:var(--gold)');
    for(let i = 0; i < 7; i++){
      const ry = y0 + i * rh;
      if(i % 2) h += `<div class="rowband" style="left:${m}pt;top:${ry}pt;width:${lw}pt;height:${rh}pt;background:var(--tint)"></div>`;
      h += `<div class="num" style="left:${m}pt;top:${ry + 26}pt;width:32pt;font:700 12pt/14pt var(--font-display);color:var(--gold-ink)">${String(E.first + i).padStart(2, '0')}</div>`;
      cs.forEach(c => { h += `<div class="vrule" style="left:${c.x}pt;top:${ry + 8}pt;height:${rh - 16}pt"></div>`;
        if(c.yn) h += X.yn(c.x + c.w / 2 - 20.5, ry + 24, 18, 'border:.9pt solid var(--navy);color:var(--navy);font-family:var(--font-display)'); });
    }
    h += box(m, y0 + 7 * rh, lw, 0, 'border-top:.8pt solid var(--navy)');
    return h;
  };

  L$['swatchbook-feedback'] = (D, E) => {
    const FB = qs(D);
    const L = D.listing, ev = X.ev(D), m = 28, W = 612 - 2 * m, tw = 410, dy = E.home ? 6 : 0;   // home file: the label clears the 18 pt white margin
    let h = '';
    // the navy band across the top; its type fills it top to bottom (owner 11/1), the photo matted over its lower edge
    h += E.bw ? box(m, 92, W, 0, 'border-top:1.2pt solid var(--ink)') : E.fl(0, 0, 612, 92, 'ltr', 'background:var(--navy)');
    h += txt('oh.label', ev.label, m, 13 + dy, tw, 'font:700 11.5pt/1 var(--font-display);letter-spacing:2.6pt;text-transform:uppercase;color:var(--gold)');
    h += X.line('address', L.address, m - 1.5, 25 + dy, tw, 33, 22, 'disp', 'font-weight:500;color:var(--on);letter-spacing:-.5pt;line-height:38pt');
    h += X.line('oh.date', `${X.cityZip(L).toUpperCase()}  ·  ${ev.long}  ·  ${ev.time}`, m, 66 + dy, tw, 11.5, 8.5, '', 'font-weight:600;color:var(--on-soft);letter-spacing:.2pt');
    h += box(m + W - 126, 20, 126, 90, `background:#fff;${E.bw ? 'border:.6pt solid #888' : 'box-shadow:0 1pt 4pt rgba(0,0,0,.18)'}`) + ph(D, E, m + W - 122, 24, 118, 82);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, 'font:700 8.5pt/10pt var(--font-display);letter-spacing:1.2pt;text-transform:uppercase;color:var(--navy)');
    // left: the three prompts
    const lw = 250;
    h += X.line('title', 'Your feedback', m - 1, 100, lw, 19, 15, 'disp', 'font-weight:500;color:var(--navy);letter-spacing:-.3pt');
    FB.prompts.forEach(([k, t], i) => { const y = 130 + i * 60;
      h += box(m, y + 1, 3, 9, 'background:var(--gold)') + lab('q.' + k, t, m + 9, y, lw - 9) + X.wline(m, y + 27, lw) + X.wline(m, y + 46, lw); });
    // right: the choices and marks as swatch chips (flat, equal fills: no mark looks like the right answer)
    const rx = m + lw + 26, rw = W - lw - 26;
    h += box(m + lw + 13, 120, 0, 178, 'border-left:.5pt solid var(--line)');
    h += lab('q.price', FB.price, rx, 118, rw);
    h += `<div class="abs" style="left:${rx}pt;top:131pt;width:${rw}pt;display:flex;gap:4pt">` + FB.choices.map((t, i) => `<span class="pill" style="flex:1;height:22pt;background:${E.bw ? `rgba(0,0,0,${[.05, .1, .05][i]})` : `rgba(30,44,74,${[.07, .14, .07][i]})`};border-bottom:2pt solid var(--gold);color:var(--navy);font-family:var(--font-display);font-size:8.5pt;letter-spacing:.8pt">${t}</span>`).join('') + '</div>';
    const chip = () => `background:${E.bw ? 'rgba(0,0,0,.04)' : 'rgba(30,44,74,.07)'};border:.8pt solid var(--gold-ink);color:var(--navy);border-radius:0;font-family:var(--font-display);font-weight:700;font-size:10pt`;
    h += lab('q.cond', FB.cond, rx, 169, 92) + X.dots(rx + 96, 162, rw - 96, 23, chip);
    h += lab('q.shows', FB.shows, rx, 197, 92) + X.dots(rx + 96, 190, rw - 96, 23, chip);
    h += txt('q.scale', 'Mark one: 1 low, 5 high', rx + 96, 216, rw - 96, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += box(rx, 229, 3, 9, 'background:var(--gold)') + lab('q.seller', FB.seller, rx + 9, 228, rw - 9) + X.wline(rx, 252, rw) + X.wline(rx, 270, rw);
    h += lab('q.name', FB.name, rx, 279) + X.wline(rx, 298, 120) + lab('q.contact', FB.contact, rx + 132, 279) + X.wline(rx + 132, 298, rw - 132);
    h += foot1(D, [m, FOOT, W, FOOT_H]);
    return h;
  };

  /* the three standard footers side by side, for the review book (not a customer piece) */
  L$['ivory-footer-sampler'] = (D, E) => {
    const m = 36, cap = (t, x, y) => txt('', t, x, y, 0, 'font:700 9pt/1 var(--font-body);letter-spacing:1.6pt;text-transform:uppercase;color:var(--muted)');
    let h = cap('#1 Full width (sign-in sheets, feedback cards, flyers)', m, 30) + foot1(D, [m, 46, 720, 62]);
    h += box(m, 130, 720, 0, 'border-top:.5pt solid var(--line)');
    h += cap('#2 Narrow column', m, 150) + foot2(D, [m, 166, 212, 170]);
    h += cap('#3 Band (pieces about 4 to 5.5 in wide)', m + 270, 150) + StandardFooter.html(3, D, [m + 270, 236, 396, 100]);
    return h;
  };
  /* ====================== OPEN HOUSE LIBRARY FLYERS (owner 11/2/2026) ======================
     The approved system (landscape sheets and cards, the same columns and fields, the standard footers, the light grayscale
     photo on black-and-white versions, no date on public sign-in sheets) applied to three library flyers with different
     looks. Each takes its flyer's fonts, colors, ornaments and layout language, and the agent's brand kit:
       B01 Twilight Frame  a dark field with one closed hairline frame; Tenor Sans caps, Spectral, Jost; brass accents.
       B16 Evening Panel   a dark side panel with the house, an outlined accent box, DM Serif Display and Manrope, a light
                           highlights band and a dark contact band.
       P17 Angle           a main-color field, a photo cut on a slant, an accent ribbon on the same slant, Asap Condensed
                           caps and Outfit; everything leans the same way.
     The brand kit's three colors (brand.colors {main, accent, dark}) are read the way the flyers read them (ohlib.js). */
  const rgbOf = h => { h = String(h || '').replace('#', ''); if(h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const lumOf = h => { const c = rgbOf(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const contrastOf = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const onOf = bg => contrastOf(bg, '#ffffff') >= contrastOf(bg, '#161616') ? '#ffffff' : '#161616';
  const readableOf = (fg, bg, min) => contrastOf(fg, bg) >= (min || 3) ? fg : onOf(bg);
  const mixOf = (a, b, t) => { const x = rgbOf(a), y = rgbOf(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  X.themes = X.themes || {};
  const libTheme = (D, bw, root) => {
    const b = D.brand || {}, c = b.colors || {};
    const main = c.main || b.accent || '#2f4a3a', dark = c.dark || b.ink || '#1c1c1c', accent = c.accent || b.accent2 || main, paper = b.paper || mixOf(main, '#ffffff', .93);
    const set = (k, v) => root.setProperty(k, v);
    if(bw){
      Object.entries({main: '#111', dark: '#111', accent: '#111', paper: '#fff', 'on-main': '#111', 'on-dark': '#111', 'on-accent': '#fff', 'accent-on-dark': '#111', 'accent-on-main': '#111',
        'accent-on-paper': '#111', 'main-on-paper': '#111', gold: '#111', on: '#111', 'on-soft': '#4a4a4a', 'line-on': 'rgba(0,0,0,.34)'}).forEach(([k, v]) => set('--' + k, v));
      return;
    }
    Object.entries({main, dark, accent, paper, 'on-main': onOf(main), 'on-dark': onOf(dark), 'on-accent': onOf(accent),
      'accent-on-dark': readableOf(accent, dark), 'accent-on-main': readableOf(accent, main), 'accent-on-paper': readableOf(accent, paper), 'main-on-paper': readableOf(main, paper),
      ink: '#161616', muted: '#555555', line: 'rgba(22,22,22,.2)', tint: 'rgba(120,110,80,.09)', gold: readableOf(accent, dark), on: '#ffffff', 'on-soft': 'rgba(255,255,255,.82)', 'line-on': 'rgba(255,255,255,.3)'}).forEach(([k, v]) => set('--' + k, v));
  };
  ['b01', 'b16', 'p17'].forEach(s => X.themes[s] = libTheme);

  // line icons for the highlights band (the flyer's own)
  const LIC = {
    bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
    bath: '<path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 12V5a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/>',
    area: '<path d="M4 4h16v16H4zM4 9h5M15 4v5M9 20v-5M20 15h-5"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/>'};
  const icon = (n, x, y, s, color) => `<svg class="abs" style="left:${x}pt;top:${y}pt;width:${s}pt;height:${s}pt;stroke:${color};fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24">${LIC[n]}</svg>`;
  // the listing's facts as [icon, value, label] from the listing data (beds, baths, square feet)
  const facts = L => { const f = [], b = Number(L.baths) || 0, full = Math.floor(b), half = b % 1 ? 1 : 0;
    if(L.beds) f.push(['bed', String(L.beds), L.beds == 1 ? 'Bedroom' : 'Bedrooms']);
    if(full) f.push(['bath', String(full), full == 1 ? 'Full Bath' : 'Full Baths']);
    if(half) f.push(['bath', '1', 'Half Bath']);
    if(L.sqft) f.push(['area', Number(L.sqft).toLocaleString('en-US'), 'Square Feet']);
    return f; };
  // the label as a headline's two lines: "REALTOR® Open House" -> REALTOR® / Open House
  const labelLines = t => { const w = String(t).split(/\s+/); return /open house$/i.test(t) && w.length > 2 ? [w.slice(0, -2).join(' '), 'Open House'] : [t]; };
  const edge = E => E.home ? 18 : -9;   // where a color or photo that runs off the sheet stops: the white margin (home) or the bleed (printer)

  /* ================================ B01 TWILIGHT FRAME ================================ */
  const B01 = {caps: "'Tenor Sans','Jost',sans-serif", serif: "'Spectral',Georgia,serif"};
  // the closed hairline frame, drawn last so it sits over everything (the flyer's signature)
  const b01Frame = (E, x0, y0, x1, y1) => { const c = E.bw ? 'var(--ink)' : 'var(--on-dark)', t = 1.2;
    return [[x0, y0, x1 - x0, t], [x0, y0, t, y1 - y0], [x1 - t, y0, t, y1 - y0], [x0, y1 - t, x1 - x0, t]].map(([x, y, w, h]) => box(x, y, w, h, `background:${c};opacity:${E.bw ? 1 : .92}`)).join(''); };
  // a small brass diamond between two hairlines
  const b01Rule = (cx, y, E) => { const c = E.bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    return box(cx - 52, y, 40, 1, `background:${c}`) + box(cx + 12, y, 40, 1, `background:${c}`) + box(cx - 3, y - 2.5, 6, 6, `background:${c};transform:rotate(45deg)`); };
  const b01Photo = (D, E, x, y, w, h) => box(x - 5, y - 5, w + 10, h + 10, `border:.7pt solid ${E.bw ? 'var(--ink)' : 'var(--accent-on-dark)'};opacity:${E.bw ? .55 : .75}`) + ph(D, E, x, y, w, h);

  L$['b01-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 48, pw = 792 - 2 * m;
    const hi = bw ? 'var(--ink)' : 'var(--on-dark)', ha = bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', 'background:var(--dark)');
    const px = m + 4, py = 44, pwid = 158, phh = 106;
    h += b01Photo(D, E, px, py, pwid, phh);
    const tx = px + pwid + 38, tw = 792 - m - tx, cx = tx + tw / 2;
    h += X.flank(ev.label, cx, 44, tw, 'kicker', `font:500 10pt/12pt 'Jost';letter-spacing:4.5pt;color:${ha}`, `.6pt solid ${ha}`);
    if(dated){
      h += X.line('title', 'Please sign in', tx, 60, tw, 30, 20, '', `font-family:${B01.caps};letter-spacing:5pt;text-transform:uppercase;text-align:center;color:${hi}`);
      h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, tx, 98, tw, 14, 9, '', `font-family:${B01.serif};font-weight:500;text-align:center;color:${hi}`);
      h += b01Rule(cx, 122, E);
      h += txt('welcome', 'Welcome to', tx, 130, tw, `text-align:center;font:500 9pt/1 'Jost';letter-spacing:3pt;text-transform:uppercase;color:${hi};opacity:.8`);
      h += X.line('address', L.address, tx, 143, tw, 22, 14, '', `font-family:${B01.serif};font-weight:500;text-align:center;color:${hi}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), tx, 170, tw, 8.5, 8, '', `text-align:center;font:600 8.5pt/1 'Jost';letter-spacing:2.4pt;color:${ha}`);
    } else {
      h += X.line('title', 'Please sign in', tx, 62, tw, 34, 22, '', `font-family:${B01.caps};letter-spacing:5pt;text-transform:uppercase;text-align:center;color:${hi}`);
      h += b01Rule(cx, 112, E);
      h += txt('welcome', 'Welcome to', tx, 122, tw, `text-align:center;font:500 9.5pt/1 'Jost';letter-spacing:3pt;text-transform:uppercase;color:${hi};opacity:.8`);
      h += X.line('address', L.address, tx, 136, tw, 27, 16, '', `font-family:${B01.serif};font-weight:500;text-align:center;color:${hi}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), tx, 170, tw, 8.5, 8, '', `text-align:center;font:600 8.5pt/1 'Jost';letter-spacing:2.4pt;color:${ha}`);
    }
    // the paper panel with a brass keyline inside it, seven roomy rows
    const top = 192, bot = 506, x0 = m + 16, W = pw - 32;
    h += box(m, top, pw, bot - top, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--paper)');
    h += box(m + 5, top + 5, pw - 10, bot - top - 10, `border:.5pt solid var(--accent);opacity:${bw ? .5 : .7}`);
    const cs = cols(x0, 40, [196, 184, 104, W - 40 - 196 - 184 - 104]), y0 = top + 36, rh = 39;
    h += labels(cs, top + 12, 18, `font-family:${B01.caps};font-weight:400;letter-spacing:1.6pt;color:var(--main-on-paper);align-items:center`);
    h += box(x0, y0 - 1, W, 1, 'background:var(--accent)');
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      if(i % 2 === 0) h += `<div class="rowband" style="left:${x0}pt;top:${y}pt;width:${W}pt;height:${rh}pt;background:var(--tint)"></div>`;
    }
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      h += `<div class="abs" style="left:${x0 + 8}pt;top:${y + 9}pt;width:22pt;height:22pt;border-radius:50%;border:.8pt solid var(--accent);color:var(--main-on-paper);font:500 11pt/20pt ${B01.serif};text-align:center">${E.first + i}</div>`;
      h += box(x0, y + rh, W, 0, 'border-top:.5pt solid var(--line)');
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - 20, y + 11, 18, `border:.8pt solid var(--main-on-paper);color:var(--main-on-paper);font-family:'Jost'`); });
    }
    cs.forEach(c => { h += `<div class="vrule" style="left:${c.x}pt;top:${y0 + 6}pt;height:${7 * rh - 12}pt"></div>`; });
    h += foot1(D, [m, 516, pw, 58], {dark: !bw});
    h += b01Frame(E, 30, 30, 762, 582);
    return h;
  };

  L$['b01-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 40, pw = 612 - 2 * m;
    const hi = bw ? 'var(--ink)' : 'var(--on-dark)', ha = bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', 'background:var(--dark)');
    h += b01Photo(D, E, m + 4, 42, 84, 56);
    const tx = m + 108, tw = 612 - m - tx, cx = tx + tw / 2;
    h += X.flank(ev.label, cx, 40, tw, 'kicker', `font:500 9pt/11pt 'Jost';letter-spacing:4pt;color:${ha}`, `.6pt solid ${ha}`);
    h += X.line('address', L.address, tx, 56, tw, 25, 14, '', `font-family:${B01.serif};font-weight:500;text-align:center;color:${hi}`);
    h += X.line('oh.date', `${X.cityZip(L).toUpperCase()}   ·   ${ev.long}   ·   ${ev.time}`, tx, 86, tw, 8.5, 8, '', `text-align:center;font:600 8.5pt/1 'Jost';letter-spacing:1.4pt;color:${ha}`);
    const top = 108, bot = 300;
    h += box(m, top, pw, bot - top, bw ? 'border:.9pt solid var(--ink)' : 'background:var(--paper)');
    h += box(m + 4, top + 4, pw - 8, bot - top - 8, `border:.5pt solid var(--accent);opacity:${bw ? .5 : .7}`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:500 8.5pt/1 'Tenor Sans','Jost',sans-serif;letter-spacing:1.4pt;text-transform:uppercase;color:var(--main-on-paper)`);
    const ax = m + 16, aw = 244, bx = ax + aw + 26, bw2 = m + pw - 16 - bx;
    h += lab('q.price', FB.price, ax, 116, aw);
    h += `<div class="abs" style="left:${ax}pt;top:128pt;width:${aw}pt;display:flex;gap:6pt">` + FB.choices.map(t => `<span class="pill" style="flex:1;height:20pt;border:.8pt solid var(--accent);color:var(--main-on-paper);font:500 8.5pt/1 'Jost';letter-spacing:.9pt">${t}</span>`).join('') + '</div>';
    const dot = () => `border:.8pt solid var(--accent);background:var(--tint);color:var(--main-on-paper);font:500 10.5pt/1 ${B01.serif}`;
    h += lab('q.cond', FB.cond, ax, 164, 100) + X.dots(ax + 108, 157, aw - 108, 22, dot);
    h += lab('q.shows', FB.shows, ax, 192, 100) + X.dots(ax + 108, 185, aw - 108, 22, dot);
    h += txt('q.scale', FB.scale, ax + 108, 209, aw - 108, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += X.line('q.seller', FB.seller, ax, 224, aw, 10.5, 8, '', `font-family:${B01.serif};font-weight:500;color:var(--ink)`) + X.wline(ax, 252, aw) + X.wline(ax, 268, aw);
    h += lab('q.name', FB.name, ax, 274, 100) + X.wline(ax, 296 - 5, 108) + lab('q.contact', FB.contact, ax + 120, 274, aw - 120) + X.wline(ax + 120, 291, aw - 120);
    h += box(ax + aw + 13, 118, 0, 170, 'border-left:.5pt solid var(--line)');
    FB.prompts.forEach(([k, t], i) => { const y = 114 + i * 60;
      h += X.line('q.' + k, t, bx, y, bw2, 10.5, 8, '', `font-family:${B01.serif};font-weight:500;color:var(--ink)`) + X.wline(bx, y + 26, bw2) + X.wline(bx, y + 41, bw2) + X.wline(bx, y + 56, bw2); });
    h += foot1(D, [m, 308, pw, 54], {dark: !bw});
    h += b01Frame(E, 26, 26, 586, 370);
    return h;
  };

  /* ================================ B16 EVENING PANEL ================================ */
  const B16 = {serif: "'DM Serif Display',Georgia,serif", sans: "'Manrope',Helvetica,Arial,sans-serif"};
  // the outlined accent box with the date, the flyer's signature: weekday in tracked caps, the date, then the time
  const b16Date = (ev, x, y, w, E, big) => {
    const on = E.bw ? 'var(--ink)' : 'var(--on-dark)', ac = E.bw ? 'var(--ink)' : 'var(--accent-on-dark)', hgt = big ? 86 : 70;
    return box(x, y, w, hgt, `border:.9pt solid ${ac}`) +
      txt('oh.weekday', ev.weekday, x + 14, y + 12, w - 28, `font:700 9pt/1 ${B16.sans};letter-spacing:2.6pt;text-transform:uppercase;color:${ac}`) +
      X.line('oh.date', ev.monthDay, x + 14, y + 26, w - 28, big ? 28 : 20, 14, '', `font-family:${B16.serif};color:${on}`) +
      box(x + 14, y + (big ? 61 : 50), w - 28, 0, `border-top:.7pt solid ${ac};opacity:.6`) +
      X.line('oh.time', ev.time, x + 14, y + (big ? 66 : 54), w - 28, big ? 13 : 10.5, 8.5, '', `font-family:${B16.sans};font-weight:700;color:${on}`);
  };

  L$['b16-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, PW = 250, X0 = 30, W0 = PW - X0 - 24, e = edge(E);
    const on = bw ? 'var(--ink)' : 'var(--on-dark)', ac = bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    let h = '';
    if(!bw){ h += E.fl(0, 0, PW, 612, 'ltb', 'background:var(--dark)') + E.fl(0, 528, 792, 84, 'lrb', 'background:var(--dark)') + E.fl(PW, 0, 792 - PW, 110, 'tr', 'background:var(--paper)'); }
    else h += box(PW, 12, 0, 504, 'border-left:1pt solid var(--ink)') + box(PW + 24, 112, 792 - PW - 48, 0, 'border-top:1pt solid var(--ink)') + box(30, 528, 732, 0, 'border-top:1pt solid var(--ink)');
    // the panel: eyebrow, "Please / sign in" as the headline, a short accent rule, the house, address
    h += X.line('oh.label', ev.label, X0, 38, W0, 9, 8, '', `font-family:${B16.sans};font-weight:600;letter-spacing:3pt;text-transform:uppercase;color:${on};opacity:.9`);
    h += X.line('title', 'Please', X0 - 2, 54, W0 + 4, 46, 30, '', `font-family:${B16.serif};color:${on};line-height:48pt`);
    h += X.line('title2', 'sign in', X0 - 2, 102, W0 + 4, 46, 30, '', `font-family:${B16.serif};color:${ac};line-height:48pt`);
    h += box(X0, 160, 56, 1.4, `background:${ac}`);
    const phH = dated ? 150 : 236;
    h += ph(D, E, e, 174, PW - e, phH);
    // the address big, up to two lines, filling the panel under the photo (owner 11/13: "beef it up")
    const vg = dated ? `data-vgroup="addr" data-vspace="430,524"` : `data-vgroup="addr" data-vspace="414,524"`;
    const addr = (y, size, lh) => icon('pin', X0 - 3, y + (lh - 18) / 2 - 1, 18, ac).replace('<svg ', `<svg data-vgroup="addr" `) +
      `<div class="abs" ${vg} style="left:${X0 + 22}pt;top:${y}pt;width:${W0 - 22}pt"><div class="disp" data-slot="address" data-lines="2" data-fit2="${size},${lh},16,${size - 6}" style="white-space:normal;padding-bottom:4pt;max-height:${2 * lh}pt;font-family:${B16.serif};font-size:${size}pt;line-height:${lh}pt;color:${on}">${esc(L.address)}</div></div>`;
    // the city line sits a set gap under the address's last line (one line or two: extras.js data-follow)
    const placeY = top => X.line('place', X.cityZip(L).toUpperCase(), X0 + 22, top, W0 - 22, 10, 8, '', `font:600 10pt/1 ${B16.sans};letter-spacing:1.4pt;color:${ac}`).replace('data-slot="place"', 'data-follow="address,6" data-vgroup="addr" data-slot="place"');
    if(dated){
      h += b16Date(ev, X0, 340, W0, E, true);
      h += addr(434, 32, 38);
      h += placeY(500);
    } else {
      h += txt('welcome', 'Welcome to', X0 + 22, 418, W0 - 22, `font:600 9.5pt/1 ${B16.sans};letter-spacing:2.4pt;text-transform:uppercase;color:${on};opacity:.8`).replace('<div ', '<div data-vgroup="addr" ');
      h += addr(428, 34, 40);
      h += placeY(506);
    }
    // the highlights band (light), the flyer's own, from the listing's facts
    const f = facts(L), rx = PW + 28, rw = 792 - 28 - rx, cw = rw / f.length, mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    const hy = E.home ? 8 : 0;   // home file: below the 18 pt white margin
    h += box(rx, 20 + hy, 150, 1, `background:${mc};opacity:.4`);
    h += txt('', 'Home highlights', rx + 160, 15 + hy, 166, `text-align:center;font:700 9pt/12pt ${B16.sans};letter-spacing:4pt;text-transform:uppercase;color:${mc}`);
    h += box(rx + rw - 150, 20 + hy, 150, 1, `background:${mc};opacity:.4`);
    f.forEach(([ic, v, k], i) => {
      h += icon(ic, rx + i * cw + cw / 2 - 11, 34 + hy, 22, mc);
      h += txt(`fact.${i}`, v, rx + i * cw, 60 + hy, cw, `text-align:center;font:400 20pt/24pt ${B16.serif}`);
      h += txt(`fact.${i}.k`, k, rx + i * cw, 87 + hy, cw, `text-align:center;font:700 8.4pt/11pt ${B16.sans};letter-spacing:1.6pt;text-transform:uppercase;opacity:.7`);
      if(i) h += box(rx + i * cw, 38 + hy, 0, 62, 'border-left:.8pt solid var(--line)');
    });
    // the writing area: rows as fields, a numeral cell with an accent line, labels in the flyer's tracked caps
    const cs = cols(rx, 40, [150, 144, 62, rw - 40 - 150 - 144 - 62]), y0 = 150, rh = 51;
    h += labels(cs, 124, 22, `font-family:${B16.sans};font-weight:700;font-size:8.4pt;letter-spacing:1.3pt;color:${mc}`);
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      h += box(rx, y, rw, rh - 7, `border:.8pt solid var(--line);${i % 2 === 0 ? 'background:var(--paper)' : ''}`);
      h += `<div class="num" style="left:${rx}pt;top:${y + 9}pt;width:38pt;font:400 20pt/24pt ${B16.serif};color:var(--accent-on-paper)">${E.first + i}</div>`;
      h += box(rx + 38, y + 8, 1.4, rh - 7 - 16, 'background:var(--accent)');
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - 20, y + 12, 18, `border:.8pt solid var(--main-on-paper);color:var(--main-on-paper);font-family:${B16.sans}`);
        else if(c.k !== 'name') h += box(c.x, y + 8, 0, rh - 7 - 16, 'border-left:.5pt solid var(--line)'); });
      h += box(cs[2].x, y + 8, 0, rh - 7 - 16, 'border-left:.5pt solid var(--line)');
    }
    h += foot1(D, [34, 538, 724, 58], {dark: !bw});
    return h;
  };

  L$['b16-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, PW = 160, X0 = 30, W0 = PW - X0 - 12, e = edge(E);
    const on = bw ? 'var(--ink)' : 'var(--on-dark)', ac = bw ? 'var(--ink)' : 'var(--accent-on-dark)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = '';
    if(!bw) h += E.fl(0, 0, PW, 324, 'lt', 'background:var(--dark)') + E.fl(0, 324, 612, 72, 'lrb', 'background:var(--dark)');
    else h += box(PW, 14, 0, 296, 'border-left:1pt solid var(--ink)') + box(28, 324, 556, 0, 'border-top:1pt solid var(--ink)');
    h += ph(D, E, e, e, PW - e, 108 - e);
    // the label, address and date block centered left to right in the panel (owner 11/13: it was crowded to the right);
    // the panel shows from the white margin on the home file
    const vl = E.home ? 18 : 0, CX = vl + 12, CW = PW - CX - 12, ctr = 'text-align:center;';
    const [l1, l2] = labelLines(ev.label);
    h += X.line('oh.label', l1, CX, 120, CW, 20, 13, '', `${ctr}font-family:${B16.serif};color:${on}`);
    if(l2) h += X.line('oh.label2', l2, CX, 142, CW, 20, 13, '', `${ctr}font-family:${B16.serif};color:${ac}`);
    h += box(CX + CW / 2 - 18, 170, 36, 1.2, `background:${ac}`);
    h += `<div class="abs" style="left:${CX}pt;top:180pt;width:${CW}pt"><div class="disp" data-slot="address" data-lines="2" style="${ctr}white-space:normal;height:42pt;max-height:42pt;font-family:${B16.serif};font-size:17pt;line-height:20pt;color:${on}">${esc(L.address)}</div></div>`;
    h += X.line('place', X.cityZip(L).toUpperCase(), CX, 224, CW, 8, 8, '', `${ctr}font:600 8pt/1 ${B16.sans};letter-spacing:1pt;color:${ac}`);
    h += box(CX, 242, CW, 66, `border:.9pt solid ${ac}`);
    h += txt('oh.weekday', ev.weekday, CX + 8, 251, CW - 16, `${ctr}font:700 8pt/1 ${B16.sans};letter-spacing:2pt;text-transform:uppercase;color:${ac}`);
    h += X.line('oh.date', ev.monthDay, CX + 8, 264, CW - 16, 18, 12, '', `${ctr}font-family:${B16.serif};color:${on}`);
    h += X.line('oh.time', ev.time, CX + 8, 290, CW - 16, 9.5, 8, '', `${ctr}font-family:${B16.sans};font-weight:700;color:${on}`);
    // the questions on white, two columns
    const ax = PW + 22, aw = 204, bx = ax + aw + 22, bw2 = 612 - 26 - bx;
    h += X.line('title', 'Your feedback', ax, 14, aw, 22, 16, '', `font-family:${B16.serif};color:${mc}`);
    h += box(ax, 40, 612 - 26 - ax, 0, `border-top:.9pt solid var(--accent);opacity:.8`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:700 9pt/1 ${B16.sans};letter-spacing:.1pt;color:${mc}`);
    h += lab('q.price', FB.price, ax, 52, aw);
    h += `<div class="abs" style="left:${ax}pt;top:65pt;width:${aw}pt;display:flex;gap:5pt">` + FB.choices.map(t => `<span class="pill" style="flex:1;height:21pt;border:.9pt solid var(--accent);background:var(--paper);color:${mc};font:700 8pt/1 ${B16.sans};letter-spacing:.4pt">${t}</span>`).join('') + '</div>';
    const dot = () => `border:.9pt solid var(--accent);background:var(--paper);color:${mc};font:400 11pt/1 ${B16.serif}`;
    h += lab('q.cond', FB.cond, ax, 106, 66) + X.dots(ax + 70, 99, aw - 70, 22, dot);
    h += lab('q.shows', FB.shows, ax, 136, 66) + X.dots(ax + 70, 129, aw - 70, 22, dot);
    h += txt('q.scale', FB.scale, ax + 70, 154, aw - 70, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += X.line('q.seller', FB.seller, ax, 174, aw, 9.5, 8, '', `font-family:${B16.sans};font-weight:700;color:${mc}`) + X.wline(ax, 204, aw) + X.wline(ax, 223, aw) + X.wline(ax, 242, aw);
    h += lab('q.name', FB.name, ax, 254, 92) + X.wline(ax, 284, 92) + lab('q.contact', FB.contact, ax + 104, 254, aw - 104) + X.wline(ax + 104, 284, aw - 104);
    h += box(ax + aw + 11, 52, 0, 244, 'border-left:.5pt solid var(--line)');
    FB.prompts.forEach(([k, t], i) => { const y = 52 + i * 90;
      h += X.line('q.' + k, t, bx, y, bw2, 9.5, 8, '', `font-family:${B16.sans};font-weight:700;color:${mc}`) + X.wline(bx, y + 30, bw2) + X.wline(bx, y + 50, bw2) + X.wline(bx, y + 70, bw2); });
    h += foot1(D, E.home ? [28, 326, 556, 48] : [28, 331, 556, 56], {dark: !bw});   // home: inside the 18 pt white margin
    return h;
  };

  /* ================================ P17 ANGLE ================================ */
  const P17 = {cond: "'Asap Condensed','Oswald',Helvetica,sans-serif", sans: "'Outfit',Helvetica,Arial,sans-serif", sk: -14};
  // the header's photo, cut on a slant (the left edge leans), with an accent stripe along the cut (the flyer's ribbon, on the same angle)
  const p17Photo = (D, E, x, hgt, cut) => {
    const e = edge(E), right = E.W - e, pw = right - x, top = e, ph0 = hgt - top, bw = E.bw;
    let h = ph(D, E, x, top, pw, ph0, `clip-path:polygon(${cut}pt 0,100% 0,100% 100%,0 100%)`);
    const t = 11;   // the stripe's thickness
    h += `<div class="abs" style="left:${x - t - 4}pt;top:${top}pt;width:${cut + t + 4}pt;height:${ph0}pt;background:${bw ? 'var(--ink)' : 'var(--accent)'};clip-path:polygon(${cut - t}pt 0,${cut}pt 0,${t + 4}pt 100%,4pt 100%)"></div>`;
    return h;
  };
  // the ribbon tag that carries the label, leaning on the same angle
  const p17Tag = (label, x, y, w, hgt, E) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt;background:${E.bw ? 'var(--ink)' : 'var(--accent)'};transform:skewX(${P17.sk}deg);display:flex;align-items:center;padding-left:16pt">` +
    `<div class="nowrap" data-slot="oh.label" data-shrink="8" style="width:${w - 26}pt;transform:skewX(${-P17.sk}deg);font:600 10.5pt/1 ${P17.sans};letter-spacing:2.2pt;text-transform:uppercase;color:${E.bw ? '#fff' : 'var(--on-accent)'}">${esc(label)}</div></div>`;
  const skew = `transform:skewX(${P17.sk}deg)`;

  L$['p17-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720, HB = 144;
    const dy = E.home ? 8 : 0;   // home file: the headline's caps clear the 18 pt white margin
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)';
    let h = '';
    if(!bw) h += E.fl(0, 0, 792, HB, 'ltr', 'background:var(--main)');
    // the band at the foot leans like the photo's cut: higher at the right
    const e = edge(E), bt = 470;   // 470 (was 484, owner 11/13): the band is taller so the agent info can grow
    if(!bw) h += `<div class="abs" style="left:${e}pt;top:${bt - 20}pt;width:${792 - 2 * e}pt;height:${612 - e - bt + 20}pt;background:var(--main);clip-path:polygon(0 20pt,100% 8pt,100% 100%,0 100%)"></div>` +
      `<div class="abs" style="left:${e}pt;top:${bt - 28}pt;width:${792 - 2 * e}pt;height:34pt;background:var(--accent);clip-path:polygon(0 20pt,100% 8pt,100% 14pt,0 26pt)"></div>`;
    else h += `<div class="abs" style="left:36pt;top:${bt - 28}pt;width:720pt;height:34pt;background:var(--ink);clip-path:polygon(0 20pt,100% 8pt,100% 9.5pt,0 21.5pt)"></div>`;
    h += p17Photo(D, E, 404, HB, 40);
    if(dated){
      h += X.line('title', 'Please sign in', m - 1, 8 + dy, 350, 46, 28, '', `font-family:${P17.cond};font-weight:700;text-transform:uppercase;letter-spacing:.5pt;color:${on};line-height:50pt`);
      h += X.line('oh.date', ev.long, m, 62 + dy, 350, 26, 16, '', `font-family:${P17.cond};font-weight:700;text-transform:uppercase;letter-spacing:.4pt;color:${on}`);
      h += X.line('oh.time', ev.time, m, 92 + dy, 350, 20, 12, '', `font-family:${P17.cond};font-weight:500;text-transform:uppercase;letter-spacing:1pt;color:${ac}`);
    } else {
      h += X.line('title', 'Please', m - 1, 4 + dy, 350, 56, 30, '', `font-family:${P17.cond};font-weight:700;text-transform:uppercase;letter-spacing:.5pt;color:${on};line-height:56pt`);
      h += X.line('title2', 'sign in', m - 1, 54 + dy, 350, 56, 30, '', `font-family:${P17.cond};font-weight:700;text-transform:uppercase;letter-spacing:.5pt;color:${ac};line-height:56pt`);
    }
    h += p17Tag(ev.label, m - 6, 124, 250, 26, E);
    // the writing area: rows with a leaning numeral tab and leaning dividers
    const cs = cols(m, 46, [204, 204, 94, W - 46 - 204 - 204 - 94]), y0 = 192, rh = 36;   // 36: the last row clears the leaning stripe (owner 11/2 clearance rule) on the taller band (11/13)
    // "Working / with an agent?": its last line the longest (the last-line rule; owner 11/13 pass)
    h += labels(cs, 166, 20, `font-family:${P17.cond};font-weight:700;font-size:10.5pt;letter-spacing:1.3pt;color:var(--main-on-paper);align-items:center`).replace('>Working with an agent?<', '>Working<br>with an agent?<');
    h += box(m, y0 - 1.5, W, 1.5, `background:${bw ? 'var(--ink)' : 'var(--main)'}`);
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      if(i % 2 === 0) h += `<div class="rowband" style="left:${m}pt;top:${y}pt;width:${W}pt;height:${rh}pt;background:var(--tint)"></div>`;
      h += `<div class="abs" style="left:${m + 6}pt;top:${y + 5}pt;width:34pt;height:${rh - 10}pt;background:${bw ? 'var(--ink)' : 'var(--main)'};${skew};display:flex;align-items:center;justify-content:center"><span style="transform:skewX(${-P17.sk}deg);font:700 14pt/1 ${P17.cond};color:${bw ? '#fff' : 'var(--on-main)'}">${E.first + i}</span></div>`;
      h += box(m, y + rh, W, 0, 'border-top:.5pt solid var(--line)');
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - 22, y + 10, 18, `border:.9pt solid var(--main-on-paper);color:var(--main-on-paper);font-family:${P17.cond};border-radius:2pt;${skew}`); });
    }
    // the address on the band, the footer under it
    h += txt('welcome', 'Welcome to', m, 481, 200, `font:600 9pt/1 ${P17.sans};letter-spacing:2.4pt;text-transform:uppercase;color:${ac}`);
    h += X.line('address', L.address, m - 1, 491, 460, 26, 15, '', `font-family:${P17.cond};font-weight:700;color:${on}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), m + W - 240, 500, 240, 9.5, 8, '', `text-align:right;font:400 9.5pt/1 ${P17.sans};letter-spacing:1.4pt;color:${on}`);
    h += foot1(D, [m, 532, W, 62], {dark: !bw});   // 532: clear of the address above it (reviewer 11/13)
    return h;
  };

  L$['p17-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 612 - 2 * m, HB = 92, e = edge(E);
    const dy = E.home ? 8 : 0;   // home file: the headline's caps clear the 18 pt white margin
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = '';
    if(!bw) h += E.fl(0, 0, 612, HB, 'ltr', 'background:var(--main)') +
      `<div class="abs" style="left:${e}pt;top:${304 - 12}pt;width:${612 - 2 * e}pt;height:${396 - e - 304 + 12}pt;background:var(--main);clip-path:polygon(0 12pt,100% 0,100% 100%,0 100%)"></div>` +
      `<div class="abs" style="left:${e}pt;top:${304 - 18}pt;width:${612 - 2 * e}pt;height:24pt;background:var(--accent);clip-path:polygon(0 12pt,100% 0,100% 4pt,0 16pt)"></div>`;
    else h += `<div class="abs" style="left:28pt;top:${304 - 18}pt;width:556pt;height:24pt;background:var(--ink);clip-path:polygon(0 12pt,100% 0,100% 1.5pt,0 13.5pt)"></div>`;
    h += p17Photo(D, E, 400, HB, 28);
    h += X.line('title', 'Your feedback', m - 1, 6 + dy, 350, 40, 26, '', `font-family:${P17.cond};font-weight:700;text-transform:uppercase;letter-spacing:.5pt;color:${on};line-height:44pt`);
    h += X.line('address', L.address, m - 1, 46 + dy, 340, 20, 12, '', `font-family:${P17.cond};font-weight:700;color:${on}`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, m, 68 + dy, 345, 9, 8, '', `font:600 9pt/1 ${P17.sans};letter-spacing:1.2pt;text-transform:uppercase;color:${ac}`);
    h += p17Tag(ev.label, m - 6, 80 + dy, 210, 20, E);
    // the leaning divider runs from x = dv + lean (top) to dv - lean (bottom); the right column starts clear of its top,
    // the left column's lowest lines end clear of its foot (owner 11/2: no diagonal touches text or a write-in line)
    const ax = m, aw = 262, dv = 318, lean = 88 * Math.tan(-P17.sk * Math.PI / 180), bx = Math.ceil(dv + lean + 8), bw2 = 612 - m - bx;
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:600 9pt/1 ${P17.sans};letter-spacing:.2pt;color:${mc}`);
    h += lab('q.price', FB.price, ax, 112, aw);
    h += `<div class="abs" style="left:${ax}pt;top:124pt;width:${aw}pt;display:flex;gap:6pt">` + FB.choices.map(t => `<span class="pill" style="flex:1;height:20pt;border:.9pt solid var(--main-on-paper);color:${mc};background:var(--tint);border-radius:2pt;${skew}"><span style="display:block;transform:skewX(${-P17.sk}deg);font:600 8.5pt/1 ${P17.sans};letter-spacing:.6pt">${t}</span></span>`).join('') + '</div>';
    const dot = () => `border:.9pt solid var(--main-on-paper);background:var(--tint);color:${mc};border-radius:2pt;font:700 11pt/1 ${P17.cond};${skew}`;
    h += lab('q.cond', FB.cond, ax, 160, 80) + X.dots(ax + 86, 153, aw - 86 - 6, 21, dot);
    h += lab('q.shows', FB.shows, ax, 187, 80) + X.dots(ax + 86, 180, aw - 86 - 6, 21, dot);
    h += txt('q.scale', FB.scale, ax + 86, 204, aw - 92, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += X.line('q.seller', FB.seller, ax, 220, aw, 10, 8, '', `font-family:${P17.cond};font-weight:700;color:${mc}`) + X.wline(ax, 240, aw) + X.wline(ax, 256, aw);
    h += lab('q.name', FB.name, ax, 260, 100) + X.wline(ax, 283, 112) + lab('q.contact', FB.contact, ax + 124, 260, aw - 124) + X.wline(ax + 124, 283, aw - 124);
    h += `<div class="abs" style="left:${dv}pt;top:114pt;height:176pt;border-left:.6pt solid var(--line);${skew}"></div>`;
    FB.prompts.forEach(([k, t], i) => { const y = 112 + i * 58;
      h += X.line('q.' + k, t, bx, y, bw2, 11, 8, '', `font-family:${P17.cond};font-weight:700;color:${mc}`) + X.wline(bx, y + 26, bw2) + X.wline(bx, y + 40, bw2) + X.wline(bx, y + 54, bw2); });
    h += foot1(D, [m, 326, W, 56], {dark: !bw});
    return h;
  };

  /* shared helpers for the other library flyers' looks (looks-lib-*.js, one file per batch, loaded after this one) */
  X.lib = {COLS, cols, labels, qs, box, txt, ph, opt, foot1, foot2, esc, libTheme, icon, facts, labelLines, edge, rgbOf, contrastOf, onOf, readableOf, mixOf};
})();
