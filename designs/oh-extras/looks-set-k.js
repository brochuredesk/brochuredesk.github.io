/* Open House extras for design sets, batch k (owner 11/15/2026: every design set gets its own sign-in sheet and broker
   feedback card, color and black and white, in that set's own look). Round 2, the design pass ("make these AMAZING"):
   each set's house photo leads, each color card has a real field of its set's color, one signature from the set's own
   brochure is big enough to read across a kitchen, and the six skeletons differ from each other and from the other batches.

   Round 3 (owner 11/15: one style thread through the whole set): a card uses only shapes, fills, colors, weights and
   type treatments its own set uses; richness comes from the set's own elements used bigger, never from new ones.

   chronicle         warm paper, the big tracked red kicker over one thin red rule, the photo large under it, regular
                     Fraunces, the stat strip, dotted rows, light red hairline dividers. No red fills, no heavy rules.
   outside-first     the flyer's dark side panel and dark foot band as an L around a cream ledger; the photo fills the top of
                     the panel; label and value rows, copper spaced-cap heads, plain numerals.
   plan-and-rooms    white paper, crimson tracked kicker, condensed title over an ink hairline, the facts set as the set's
                     room-dimension rows; crimson is type and rules only; the card's answer boxes in the plan legend's tints.
   red-line          the red rail off the left edge with its label reading up it, the photo butted against it, title-case
                     Oswald, full-width red rules.
   room-proportions  the agent's brand-color block, the photo, the facts as outlined boxes on one baseline (rooms to one
                     scale); gold only as tiny square bullets.
   room-strips       the red banner with the title-case Oswald headline, then white to the foot: a strip of photos, facts,
                     row strips with a short red rule and a plain numeral, red rules, a white footer.

   Looks are registered as '<set>-signin' / '<set>-feedback'. extras.js picks the theme by the first word of the look name,
   so 'room' serves both room-proportions and room-strips (it reads D.piece.look to tell them apart). Colors travel as
   --k-* variables (black and white sets them all to ink), so one drawing serves both versions. Black-and-white cards take
   the brand's black logo (brand.logos.black) instead of a greyed color one. Every footer is standard footer #1 at its
   full size (696 pt wide on sign-in sheets, 556 pt on cards). */
(function(){
  const X = Extras, L$ = X.looks, esc = X.esc, K = X.lib;
  const {cols, labels, qs, box, txt, ph, foot1, facts, onOf, readableOf, icon, edge} = K;
  const SFOOT = [48, 516, 696, 58], FFOOT = [28, 308, 556, 58];

  const FR = "'K Fraunces',Georgia,serif", LF = "'K Libre Franklin',Helvetica,Arial,sans-serif", SG = "'K Space Grotesk',Helvetica,Arial,sans-serif",
    SS = "'K Source Sans',Helvetica,Arial,sans-serif", PC = "'K Plex Condensed',Helvetica,Arial,sans-serif", BA = "'K Barlow',Helvetica,Arial,sans-serif",
    OS = "'K Oswald','Arial Narrow',Helvetica,sans-serif";

  // ---- the sets' palettes (the flyers' own: fixed palettes; room-proportions takes the agent's brand color) ----
  // row = the light tint under alternate write-in rows (8% or lighter); t1..t3 = the plan's room tints
  const PAL = {
    chronicle: {d: FR, b: LF, main: '#9b2c2c', acc: '#9b2c2c', ink: '#2a2420', paper: '#faf7f1', muted: '#6b6258', line: 'rgba(42,36,32,.34)', tint: 'rgba(155,44,44,.06)', row: 'rgba(155,44,44,.05)', div: 'rgba(155,44,44,.3)'},
    outside: {d: SG, b: SS, main: '#bf6a2a', acc: '#bf6a2a', ink: '#1f2b2c', paper: '#fbf3e8', muted: '#5c6663', line: 'rgba(31,43,44,.26)', tint: 'rgba(191,106,42,.10)', row: 'rgba(191,106,42,.07)', dark: '#1f2b2c', onDark: '#fbf3e8', accDark: '#e8a977'},
    plan: {d: PC, b: BA, main: '#b8282f', acc: '#b8282f', ink: '#1d2024', paper: '#ffffff', muted: '#5a5f66', line: 'rgba(29,32,36,.3)', tint: 'rgba(29,32,36,.035)', row: 'rgba(29,32,36,.03)',
      t1: 'rgba(184,40,47,.07)', t2: 'rgba(196,164,106,.16)', t3: 'rgba(111,142,166,.16)'},
    red: {d: OS, b: SS, main: '#d7262b', acc: '#d7262b', ink: '#1b1b1d', paper: '#ffffff', muted: '#686d71', line: 'rgba(27,27,29,.26)', tint: 'rgba(215,38,43,.07)', row: 'rgba(27,27,29,.035)'},
    rp: {d: SG, b: SS, main: '#2f4a3a', acc: '#d3a640', ink: '#16252b', paper: '#ffffff', muted: '#4a5557', line: 'rgba(22,37,43,.26)', tint: 'rgba(22,37,43,.045)', row: 'rgba(22,37,43,.04)', rust: '#b4502f'},
    strips: {d: OS, b: BA, accDark: '#ffffff', main: '#c0292f', acc: '#c0292f', ink: '#1b1b1d', paper: '#ffffff', muted: '#6c6c70', line: 'rgba(27,27,29,.26)', tint: 'rgba(192,41,47,.07)', row: 'rgba(27,27,29,.045)'}};
  const theme = key => (D, bw, root) => {
    const set = (k, v) => root.setProperty(k, v), p = Object.assign({}, PAL[key]);
    if(key === 'rp'){ const a = (D.brand || {}).accent || ((D.brand || {}).colors || {}).main; if(a && /^#[0-9a-f]{6}$/i.test(a)) p.main = a; }
    set('--font-display', p.d); set('--font-body', p.b); set('--cc-paper', 'transparent');
    if(bw){
      Object.entries({main: '#111', 'on-main': '#111', acc: '#111', ink: '#111', paper: '#fff', muted: '#4a4a4a', line: 'rgba(0,0,0,.36)', tint: 'rgba(0,0,0,.04)', row: 'rgba(0,0,0,.035)',
        t1: 'rgba(0,0,0,.03)', t2: 'rgba(0,0,0,.03)', t3: 'rgba(0,0,0,.03)', div: 'rgba(0,0,0,.36)', dark: '#111', 'on-dark': '#111', 'acc-dark': '#111', 'main-ink': '#111', rust: '#111'}).forEach(([k, v]) => set('--k-' + k, v));
      return;
    }
    const dark = p.dark || p.main;
    Object.entries({main: p.main, 'on-main': onOf(p.main), acc: p.acc, ink: p.ink, paper: p.paper, muted: p.muted, line: p.line, tint: p.tint, row: p.row, t1: p.t1 || p.tint, t2: p.t2 || p.tint, t3: p.t3 || p.tint, div: p.div || p.line,
      dark, 'on-dark': p.onDark || onOf(dark), 'acc-dark': p.accDark || readableOf(p.acc, dark), 'main-ink': readableOf(p.main, p.paper, 4.5), rust: p.rust || p.main}).forEach(([k, v]) => set('--k-' + k, v));
    Object.entries({paper: p.paper, ink: p.ink, muted: p.muted, accent: p.main, line: p.line, tint: p.tint, on: '#ffffff', 'on-soft': 'rgba(255,255,255,.86)',
      'line-on': 'rgba(255,255,255,.34)', gold: p.accDark || readableOf(p.acc, dark)}).forEach(([k, v]) => set('--' + k, v));
    if(p.dark){ set('--on', p.onDark); set('--on-soft', 'rgba(251,243,232,.82)'); }
  };
  X.themes = X.themes || {};
  /* chronicle: no theme here; The Modern Chronicle's approved cards are looks-sets.js (owner 11/16/2026), this draft is retired */ X.themes.outside = theme('outside'); X.themes.plan = theme('plan'); X.themes.red = theme('red');
  X.themes.room = (D, bw, root) => theme(String((D.piece || {}).look || '').startsWith('room-strips') ? 'strips' : 'rp')(D, bw, root);

  // ---- small helpers ----
  const f = (fam, w, s, lh) => `font-family:${fam};font-weight:${w};font-size:${s}pt;line-height:${lh || Math.round(s * 12) / 10}pt;`;
  const hr = (x, y, w, t, c) => box(x, y, w, t, `background:${c}`);
  const vl = (x, y, hgt, t, c) => box(x, y, 0, hgt, `border-left:${t}pt solid ${c}`);
  const band = (x, y, w, hgt, style) => `<div class="rowband" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt;${style}"></div>`;
  const dateText = ev => `${ev.long}  ·  ${ev.time}`;
  const up = s => String(s || '').toUpperCase();
  const fact3 = L => facts(L).map(([, v, l]) => [v, l]);
  const fact4 = L => { const r = fact3(L).slice(0, 4); if(L.yearBuilt && r.length < 4) r.push([String(L.yearBuilt), 'Year Built']); return r; };
  const ph2 = (D, E, x, y, w, h) => { const s = X.photo(D, 'front2', x, y, w, h); return E.bw ? s.replace('class="photo"', 'class="photo light"') : s; };
  // the standard footer at its standard size; black-and-white cards take the black logo (never a greyed color one)
  const foot = (D, E, bx, o) => { const b = D.brand || {}, k = E.bw && b.logos && b.logos.black;
    const html = foot1(k ? Object.assign({}, D, {brand: Object.assign({}, b, {logo: k})}) : D, bx, o);
    // on a dark field the card is told the field's color, so its small labels are tuned to read on it (not on white)
    return o && o.dark && o.paper ? html.replace('--cc-paper:transparent', '--cc-paper:' + o.paper) : html; };

  /* ---- the sign-in writing area: header labels (8.5 pt), seven rows, a rule between every column ----
     o: x0, W, top, bot, hd (header height), numW, widths, label (style), num(n, x, y, rh, numW), band(i), bandStyle,
        sep (row rule), lastRule, headRule [pt, color] or 0, vr (column-rule style), vrTop (start of the column rules), yn */
  const grid = (D, E, o) => {
    const x0 = o.x0, W = o.W, top = o.top, bot = o.bot, hd = o.hd || 30, numW = o.numW == null ? 42 : o.numW, y0 = top + hd, rh = (bot - y0) / 7;
    const rest = W - numW, wd = o.widths || [.34, .31, .14], ws = wd.map(v => Math.round(rest * v)); ws.push(rest - ws[0] - ws[1] - ws[2]);
    const cs = cols(x0, numW, ws);
    let h = o.under ? o.under(y0, rh, cs) : '';
    for(let i = 0; i < 7; i++) if(o.band && o.band(i)) h += o.bandDraw ? o.bandDraw(y0 + i * rh, rh) : band(x0, y0 + i * rh, W, rh, 'background:var(--k-row)');
    h += labels(cs, top + 2, hd - 9, 'font-size:8.5pt;' + (o.label || ''));
    if(o.headRule) h += hr(x0, y0 - o.headRule[0], W, o.headRule[0], o.headRule[1]);
    for(let i = 0; i < 7; i++){ const y = y0 + i * rh;
      h += o.num(E.first + i, x0, y, rh, numW);
      if(i < 6) h += box(x0, y + rh, W, 0, o.sep || 'border-top:.5pt solid var(--k-line)');
      else if(o.lastRule) h += box(x0, bot - .5, W, 0, `border-top:${o.lastRule}`);
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - 21, y + rh / 2 - 9, 18, o.yn); });
    }
    const vt = o.vrTop == null ? y0 + 5 : o.vrTop, vb = bot - (o.vrBot == null ? 5 : o.vrBot);
    cs.forEach((c, i) => { if(i || numW) h += `<div class="vrule" style="left:${c.x}pt;top:${vt}pt;height:${vb - vt}pt;${o.vr || ''}"></div>`; });
    return h;
  };
  const numDiv = (n, x, y, rh, w, style) => `<div class="abs" style="left:${x}pt;top:${y + rh / 2 - 13}pt;width:${w}pt;height:26pt;text-align:center;${style}">${n}</div>`;

  /* ---- the feedback card's fields as parts a look places where its own layout wants them (the fields and wording are
     fixed, product.md; answer lines sit at least 0.28 in apart; the rating marks are round under "Circle one") ----
     o: lab, q (styles), qs (question size), qcls, wl (write-line style), pill(i), dot(i) */
  const kit = (D, o) => {
    const FB = qs(D), wl = o.wl || 'border-color:var(--k-ink);opacity:.5', T = {FB};
    T.lab = (slot, s, x, y, w, extra) => txt('q.' + slot, s, x, y - 1, w, 'font-size:8.5pt;line-height:14pt;font-weight:700;text-transform:uppercase;' + o.lab + (extra || ''));
    T.price = (x, y, w, o2) => { o2 = o2 || {}; const ph = o2.h || 20;
      return T.lab('price', FB.price, x, y, w) + `<div class="abs" style="left:${x}pt;top:${y + 14}pt;width:${w}pt;display:flex;${o2.stack ? 'flex-direction:column;' : ''}gap:${o2.gap || 5}pt">` +
        FB.choices.map((c, i) => `<span class="pill" style="flex:${o2.stack ? 'none' : '1 1 auto'};white-space:nowrap;padding:0 3pt;height:${ph}pt;${o.pill(i)}">${c}</span>`).join('') + '</div>'; };
    // a rating: its label and five round marks on one line (lw = the label's width), or the label over the marks
    T.rate = (k, x, y, w, d, lw) => T.lab(k, FB[k], x, y + d / 2 - 6, lw - 3, 'font-size:8pt;') + X.dots(x + lw, y, w - lw, d, o.dot);
    T.rateOver = (k, x, y, w, d) => T.lab(k, FB[k], x, y, w) + X.dots(x, y + 13, w, d, o.dot);
    T.scale = (x, y, w, align) => txt('q.scale', FB.scale, x, y, w, `text-align:${align || 'right'};font-size:8pt;line-height:10pt;color:var(--k-muted)`);
    // a question with n write-in lines: the first line `first` pt under the question's top, the rest `gap` pt apart
    T.ask = (k, s, x, y, w, n, o2) => { o2 = o2 || {}; const first = o2.first || 30, gap = o2.gap || 21, ind = o2.ind || 0; const sz = o.qs || 11.5;
      // in a narrow column a question takes one line as big as fits (down to o2.two pt), else two lines (never under 8 pt)
      let h = (o2.mark || '') + (o2.two ? `<div class="abs ${o.qcls == null ? 'disp' : o.qcls}" data-slot="q.${k}" data-fit2="${sz},${sz * 1.2},8,${o2.two}" style="left:${x + ind}pt;top:${y}pt;width:${w - ind}pt;font-size:${sz}pt;line-height:${sz * 1.2}pt;overflow:hidden;${o.q}">${esc(s)}</div>`
        : X.line('q.' + k, s, x + ind, y, w - ind, sz, 8, o.qcls == null ? 'disp' : o.qcls, o.q));
      for(let i = 0; i < n; i++) h += X.wline(x, y + first + i * gap, w, wl); return h; };
    T.field = (k, x, y, w, drop) => T.lab(k, FB[k], x, y, w) + X.wline(x, y + (drop || 24), w, wl);
    T.wl = (x, y, w) => X.wline(x, y, w, wl);
    return T;
  };

  /* ================================ CHRONICLE ================================
     The set's own page, nothing added: warm paper, the big tracked red kicker over one thin red rule, the photo large
     under that rule, Fraunces in its regular weight, small widely tracked red labels, the stat strip (Fraunces numerals
     over small red labels, hairline dividers), dotted rows. Red is type and thin rules only: no red fills, no heavy rules. */
  const CHK = `font-family:${LF};font-weight:600;letter-spacing:1.4pt;color:var(--k-main);`;
  const chStats = (L, x, y, w, size) => { const fs = fact4(L), cw = w / fs.length; let h = box(x, y, w, 0, 'border-top:.8pt solid var(--k-line)');
    fs.forEach(([v, l], i) => { const cx = x + i * cw + (i ? 12 : 0);
      h += (i ? vl(x + i * cw, y + 6, size + 20, .6, 'var(--k-div)') : '') + X.line('fact' + i, v, cx, y + 6, cw - 16, size, 12, 'disp', 'font-weight:500;color:var(--k-ink)') +
        X.line('factl' + i, up(l), cx, y + 8 + size * 1.2, cw - 14, 8, 8, '', CHK + 'letter-spacing:1.3pt'); });
    return h; };
  L$['chronicle-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', m = 48, W = 696, rx = 372, rw = 744 - rx;
    let h = '';
    h += X.line('oh.label', up(ev.label), m, 28, 420, 12, 9, '', `font-family:${LF};font-weight:700;letter-spacing:4.2pt;color:var(--k-main)`);
    if(dated) h += X.line('oh.date', dateText(ev), 444, 30, 300, 9.5, 8, '', `text-align:right;font-family:${LF};font-weight:600;letter-spacing:.3pt;color:var(--k-ink)`);
    h += hr(m, 50, W, .8, 'var(--k-main)');
    h += ph(D, E, m, 58, 304, 152);
    h += X.line('title', 'Please sign in', rx - 2, 54, rw, 44, 30, 'disp', 'letter-spacing:-.5pt;color:var(--k-ink)');
    h += X.line('place', up(X.place(L)), rx, 117, rw, 8.5, 8, '', CHK);
    h += X.line('address', L.address, rx - 1, 129, rw, 25, 14, 'disp', 'letter-spacing:-.3pt;color:var(--k-ink)');
    h += chStats(L, rx, 168, rw, 19);
    // the register: thin red rule, small red tracked heads, dotted rows, hairline column dividers in the set's light red
    h += hr(m, 220, W, .8, 'var(--k-main)');
    h += grid(D, E, {x0: m, W, top: 221, bot: 508, hd: 27, numW: 44, label: CHK + 'font-weight:600', headRule: [.7, 'var(--k-line)'],
      sep: 'border-top:.8pt dotted var(--k-line)', lastRule: '.8pt solid var(--k-main)', vrTop: 226, vrBot: 4, vr: 'border-left:.6pt solid var(--k-div)',
      num: (n, x, y, rh, nw) => numDiv(n, x, y, rh, nw, `${f(FR, 500, 21, 26)}color:var(--k-main)`),
      yn: `border:.9pt solid var(--k-main);color:var(--k-main);font-family:${LF}`});
    return h + foot(D, E, SFOOT);
  };
  L$['chronicle-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), m = 28, W = 556, c1w = 172, cw = 176, c2 = 216, c3 = 408;
    let h = '';
    h += X.line('oh.label', up(ev.label), m, 24, 260, 9.5, 8, '', `font-family:${LF};font-weight:700;letter-spacing:3.4pt;color:var(--k-main)`);
    h += X.line('oh.date', dateText(ev), m + W - 280, 25, 280, 8.5, 8, '', `text-align:right;font-family:${LF};font-weight:600;letter-spacing:.2pt;color:var(--k-ink)`);
    h += hr(m, 42, W, .8, 'var(--k-main)');
    const T = kit(D, {lab: CHK + 'font-weight:600;letter-spacing:1.2pt;', q: 'color:var(--k-ink);letter-spacing:-.1pt;font-weight:400', qs: 10,
      pill: () => `border:.8pt solid var(--k-main);color:var(--k-main);font-size:8pt;font-weight:600;letter-spacing:.3pt;font-family:${LF}`,
      dot: () => `border:.8pt solid var(--k-main);color:var(--k-main);font-family:${FR};font-weight:500;font-size:10.5pt`});
    const P = T.FB.prompts, top = 58;
    // column 1: the photo under the rule, the address, then the marks
    h += ph(D, E, m, top - 8, c1w, 84);
    h += X.line('address', L.address, m - .5, top + 81, c1w, 17, 11, 'disp', 'color:var(--k-ink);letter-spacing:-.3pt');
    h += X.line('place', up(X.cityZip(L)), m, top + 104, c1w, 8, 8, '', CHK);
    h += box(m, top + 120, c1w, 0, 'border-top:.8pt solid var(--k-line)');
    h += T.price(m, top + 128, c1w, {gap: 4, h: 20}) + T.rate('cond', m, top + 170, c1w, 18, 80) + T.rate('shows', m, top + 195, c1w, 18, 80) + T.scale(m, top + 219, c1w);
    // columns 2 and 3 between the set's hairline dividers
    h += vl(208, top - 8, 240, .6, 'var(--k-div)') + vl(400, top - 8, 240, .6, 'var(--k-div)');
    const o3 = {gap: 22, first: 30};
    h += T.ask('seller', T.FB.seller, c2, top - 4, cw, 2, o3) + box(c2, top + 64, cw, 0, 'border-top:.8pt dotted var(--k-line)') + T.ask(P[0][0], P[0][1], c2, top + 76, cw, 3, o3) + T.field('name', c2, top + 190, cw, 28);
    h += T.ask(P[1][0], P[1][1], c3, top - 4, cw, 3, o3) + T.ask(P[2][0], P[2][1], c3, top + 76, cw, 3, o3) + T.field('contact', c3, top + 190, cw, 28);
    return h + foot(D, E, FFOOT);
  };

  /* ============================== OUTSIDE-FIRST ==============================
     The flyer's dark side panel and dark foot band form an L around the cream ledger. The house photo fills the top of
     the panel edge to edge; under it the panel's parts (label, date, address, facts) spread to fill it, never a gap. */
  const ofFacts = (L, w, dark) => fact3(L).slice(0, 3).map(([v, l], i) =>
    `<div style="position:relative;height:25pt;border-top:${i ? '.5' : '1'}pt solid ${i ? (dark ? 'rgba(251,243,232,.3)' : 'var(--k-line)') : (dark ? 'var(--k-acc-dark)' : 'var(--k-ink)')}">` +
    `<div class="abs nowrap" data-slot="factl${i}" style="left:0;top:8pt;width:${w - 62}pt;${f(SG, 600, 8.5, 11)}letter-spacing:.8pt;text-transform:uppercase;color:${dark ? 'rgba(251,243,232,.82)' : 'var(--k-muted)'}">${esc(l)}</div>` +
    `<div class="abs nowrap" data-slot="fact${i}" style="right:0;top:4pt;width:60pt;text-align:right;${f(SG, 700, 13.5, 17)}color:${dark ? 'var(--k-on-dark)' : 'var(--k-ink)'}">${esc(v)}</div></div>`).join('');
  L$['outside-first-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, e = edge(E), pw = 240, px = 36, cw = pw - px - 20;
    const on = bw ? 'var(--k-ink)' : 'var(--k-on-dark)', ad = bw ? 'var(--k-ink)' : 'var(--k-acc-dark)', PH = dated ? 176 : 246;
    let h = '';
    if(bw) h += hr(pw, 18, 1.6, 490, 'var(--k-ink)') + hr(18, 508, 756, 1.6, 'var(--k-ink)');
    else h += E.fl(0, 0, pw, 512, 'lt', 'background:var(--k-dark)') + E.fl(0, 508, 792, 104, 'lrb', 'background:var(--k-dark)');
    h += ph(D, E, e, e, pw - e, PH - e);
    const ll = K.labelLines(ev.label);
    h += `<div class="abs" style="left:${px}pt;top:${PH + 16}pt;width:${cw}pt;height:${494 - PH - 16}pt;display:flex;flex-direction:column;justify-content:space-between">` +
      `<div>${ll.map((t, i) => `<div class="nowrap" data-slot="oh.label${i ? '2' : ''}" style="${f(SG, 700, 11.5, 17)}letter-spacing:2.6pt;color:${on}">${esc(up(t))}</div>`).join('')}` +
      `<div style="margin-top:8pt;width:46pt;height:2.4pt;background:${ad}"></div></div>` +
      (dated ? `<div><div class="nowrap" data-slot="oh.weekday" style="${f(SG, 500, 13, 16)}color:${on}">${esc(ev.weekday)}</div>` +
        `<div class="nowrap" data-slot="oh.date" style="margin:1pt 0 0 -1pt;${f(SG, 700, 25, 30)}letter-spacing:-.4pt;color:${on}">${esc(ev.monthDay)}</div>` +
        `<div class="nowrap" data-slot="oh.time" style="margin-top:2pt;${f(SG, 600, 12.5, 16)}color:${ad}">${esc(ev.time)}</div></div>` : '') +
      `<div><div class="nowrap" data-slot="welcome" style="${f(SG, 600, 8.5, 11)}letter-spacing:2.2pt;text-transform:uppercase;color:${ad}">Welcome to</div>` +
      `<div class="nowrap" data-slot="address" data-shrink="10" style="margin:3pt 0 0 -1pt;width:${cw + 2}pt;font-family:${SG};font-weight:700;font-size:22pt;line-height:26.4pt;letter-spacing:-.4pt;color:${on}">${esc(L.address)}</div>` +
      `<div class="nowrap" data-slot="place" style="margin-top:4pt;${f(SG, 600, 8.5, 11)}letter-spacing:1.6pt;text-transform:uppercase;color:${ad}">${esc(X.cityZip(L))}</div></div>` +
      `<div>${ofFacts(L, cw, !bw)}</div></div>`;
    // the cream ledger: title over a copper rule, light rows with dark number tiles
    const lx = pw + 28, lw = 744 - lx;
    h += X.line('title', 'Please sign in', lx - 1.5, 26, lw, 42, 28, '', `font-family:${SG};font-weight:700;letter-spacing:-1pt;color:var(--k-ink)`);
    h += hr(lx, 84, 64, 2.6, 'var(--k-main)');
    h += grid(D, E, {x0: lx, W: lw, top: 94, bot: 496, hd: 34, numW: 38, widths: [.335, .32, .135], label: `font-family:${SG};font-weight:700;letter-spacing:1.4pt;color:var(--k-main)`, headRule: [1.2, 'var(--k-main)'],
      band: i => i % 2 === 0, sep: 'border-top:.5pt solid var(--k-line)', lastRule: '1.4pt solid var(--k-ink)',
      num: (n, x, y, rh, nw) => numDiv(n, x, y, rh, nw, `${f(SG, 700, 18, 26)}letter-spacing:-.3pt;color:var(--k-ink)`),
      yn: `border:1pt solid var(--k-ink);color:var(--k-ink);font-family:${SG}`});
    return h + foot(D, E, [48, 524, 696, 58], {dark: !bw, paper: PAL.outside.dark});
  };
  L$['outside-first-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, e = edge(E), pw = 156, px = 28, cw = 114, on = bw ? 'var(--k-ink)' : 'var(--k-on-dark)', ad = bw ? 'var(--k-ink)' : 'var(--k-acc-dark)';
    let h = '';
    if(bw) h += hr(pw, 18, 1.4, 278, 'var(--k-ink)') + hr(18, 296, 576, 1.4, 'var(--k-ink)');
    else h += E.fl(0, 0, pw, 300, 'lt', 'background:var(--k-dark)') + E.fl(0, 296, 612, 100, 'lrb', 'background:var(--k-dark)');
    const PH = 122;
    h += ph(D, E, e, e, pw - e, PH - e);
    const ll = K.labelLines(ev.label);
    h += `<div class="abs" style="left:${px}pt;top:${PH + 12}pt;width:${cw}pt;height:${284 - PH - 12}pt;display:flex;flex-direction:column;justify-content:space-between">` +
      `<div>${ll.map((t, i) => `<div class="nowrap" data-slot="oh.label${i ? '2' : ''}" style="${f(SG, 700, 8.5, 12.5)}letter-spacing:2pt;color:${on}">${esc(up(t))}</div>`).join('')}` +
      `<div style="margin-top:6pt;width:34pt;height:2pt;background:${ad}"></div></div>` +
      `<div><div class="nowrap" data-slot="address" data-shrink="8" style="margin-left:-.5pt;width:${cw + 6}pt;font-family:${SG};font-weight:700;font-size:13.5pt;line-height:17pt;letter-spacing:-.3pt;color:${on}">${esc(L.address)}</div>` +
      `<div class="nowrap" data-slot="place" style="margin-top:3pt;${f(SG, 600, 8, 10)}letter-spacing:1.2pt;text-transform:uppercase;color:${ad}">${esc(X.cityZip(L))}</div></div>` +
      `<div><div class="nowrap" data-slot="oh.date" style="${f(SG, 600, 8.5, 12)}color:${on}">${esc(ev.long)}</div>` +
      `<div class="nowrap" data-slot="oh.time" style="${f(SG, 600, 8.5, 12)}color:${ad}">${esc(ev.time)}</div></div></div>`;
    const T = kit(D, {lab: `color:var(--k-main);font-family:${SG};letter-spacing:1.1pt;`, q: `color:var(--k-ink);font-family:${SG};font-weight:700;letter-spacing:-.1pt`, qcls: '', qs: 11,
      pill: () => `border:1pt solid var(--k-ink);color:var(--k-ink);font-size:8pt;letter-spacing:0;font-weight:600;font-family:${SG};border-radius:0`,
      dot: () => `border:1pt solid var(--k-ink);color:var(--k-ink);font-family:${SG};font-weight:700;font-size:10pt`});
    const ax = 176, aw = 186, bx = 380, bwid = 204, P = T.FB.prompts;
    h += T.price(ax, 24, aw, {gap: 4, h: 22}) + T.rate('cond', ax, 72, aw, 21, 78) + T.rate('shows', ax, 101, aw, 21, 78) + T.scale(ax, 127, aw);
    h += T.ask('seller', T.FB.seller, ax, 148, aw, 2, {gap: 24, first: 34});
    const nw = 84;
    h += T.field('name', ax, 250, nw, 26) + T.field('contact', ax + nw + 12, 250, aw - nw - 12, 26);
    h += vl(371, 24, 258, .5, 'var(--k-line)');
    P.forEach(([k, s], i) => { h += T.ask(k, s, bx, 24 + i * 88, bwid, 3, {gap: 24, first: 34}); });
    return h + foot(D, E, [28, 318, 556, 58], {dark: !bw, paper: PAL.outside.dark});
  };

  /* ============================== PLAN-AND-ROOMS ==============================
     The set's own page, nothing added: white paper, the crimson tracked kicker, condensed titles over an ink hairline,
     the photo large and plain, and the facts set the way the set sets its room dimensions (dark name left, crimson figure
     right, a hairline between). Crimson is type and thin rules only. The feedback card's three answer boxes take the
     plan legend's three tints, lightly. No drawn walls: the set only ever shows the listing's own plan. */
  const INK = 'var(--k-ink)', PKK = `font-family:${BA};font-weight:600;letter-spacing:1.6pt;color:var(--k-main);`;
  const dimRows = (L, x, y, w, rh) => fact4(L).map(([v, l], i, a) => X.line('fact' + i, l, x, y + i * rh + rh / 2 - 7, w - 70, 10.5, 8, '', `font-family:${BA};font-weight:600;color:var(--k-ink)`) +
    X.line('factv' + i, v, x + w - 70, y + i * rh + rh / 2 - 7, 70, 10.5, 8, '', `text-align:right;font-family:${BA};font-weight:600;letter-spacing:.8pt;color:var(--k-main)`) +
    (i < a.length - 1 ? hr(x, y + (i + 1) * rh, w, .6, 'var(--k-line)') : '')).join('');
  L$['plan-and-rooms-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', m = 48, W = 696, tx = 340, tw = 744 - tx;
    let h = ph(D, E, m, 30, 274, 166);
    h += X.line('oh.label', up(ev.label), tx, 31, tw, 11, 8.5, '', PKK + 'letter-spacing:2.2pt');
    h += X.line('title', 'Please sign in', tx - 1.5, 45, tw, 42, 28, 'disp', 'font-weight:600;letter-spacing:-.6pt;color:var(--k-ink)');
    h += hr(tx, 101, tw, .8, INK);
    h += X.line('address', L.address, tx - .5, 112, 214, 23, 13, 'disp', 'font-weight:600;letter-spacing:-.3pt;color:var(--k-ink)');
    h += X.line('place', up(X.place(L)), tx, 144, 214, 8.5, 8, '', PKK);
    if(dated) h += X.line('oh.date', ev.long, tx, 164, 214, 10.5, 8, '', `font-family:${BA};font-weight:600;color:var(--k-ink)`) + X.line('oh.time', ev.time, tx, 179, 214, 10.5, 8, '', `font-family:${BA};font-weight:600;color:var(--k-main)`);
    h += dimRows(L, 574, 105, 170, 22.75);
    // the register: crimson tracked heads over an ink hairline, hairline rows and dividers
    h += hr(m, 206, W, .8, INK);
    h += grid(D, E, {x0: m, W, top: 207, bot: 508, hd: 28, numW: 44, label: PKK, headRule: [.8, INK], sep: 'border-top:.6pt solid var(--k-line)', lastRule: '.8pt solid var(--k-ink)', vrTop: 212, vrBot: 4,
      num: (n, x, y, rh, nw) => numDiv(n, x, y, rh, nw, `${f(PC, 600, 21, 26)}color:var(--k-main)`),
      yn: `border:.9pt solid var(--k-main);color:var(--k-main);font-family:${PC}`});
    return h + foot(D, E, SFOOT);
  };
  L$['plan-and-rooms-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), m = 28, W = 556;
    let h = ph(D, E, m, 22, 172, 98);
    h += X.line('oh.label', up(ev.label), m, 127, 172, 8.5, 8, '', PKK);
    h += X.line('address', L.address, m - .5, 139, 172, 17, 10, 'disp', 'font-weight:600;letter-spacing:-.3pt;color:var(--k-ink)');
    h += X.line('oh.date', ev.long, m, 163, 172, 9, 8, '', `font-family:${BA};font-weight:600;color:var(--k-ink)`);
    h += X.line('oh.time', ev.time, m, 176, 172, 9, 8, '', `font-family:${BA};font-weight:600;color:var(--k-main)`);
    const T = kit(D, {lab: PKK + 'letter-spacing:1.2pt;', q: 'color:var(--k-ink);font-weight:600;letter-spacing:-.1pt', qs: 11.5,
      pill: () => `border:.9pt solid var(--k-main);color:var(--k-main);font-size:8.5pt;letter-spacing:.6pt;font-family:${BA};font-weight:600;border-radius:0`,
      dot: () => `border:.9pt solid var(--k-main);color:var(--k-main);font-family:${PC};font-weight:600;font-size:11pt`});
    const bx = 216, bwd = 172, cx = 404, cwd = 180;
    h += hr(bx, 22, 584 - bx, .8, INK);
    h += T.price(bx, 32, bwd, {gap: 5, h: 21}) + T.rate('cond', bx, 84, bwd, 20, 74) + T.rate('shows', bx, 114, bwd, 20, 74) + T.scale(bx, 142, bwd);
    h += vl(396, 32, 156, .5, 'var(--k-line)');
    h += T.ask('seller', T.FB.seller, cx + 4, 31, cwd - 4, 2, {gap: 22, first: 33}) + T.field('name', cx + 4, 104, cwd - 4, 26) + T.field('contact', cx + 4, 150, cwd - 4, 26);
    // the three prompts in the plan legend's three tints
    const num = (i, x, y) => `<div class="abs" style="left:${x}pt;top:${y - 1.5}pt;width:14pt;${f(PC, 600, 14, 16)}color:var(--k-main)">${i + 1}</div>`;
    const pw = (W - 16) / 3, py = 200, phh = 100;
    T.FB.prompts.forEach(([k, s], i) => { const x = m + i * (pw + 8);
      h += band(x, py, pw, phh, `background:var(--k-t${i + 1})`) + T.ask(k, s, x + 9, py + 9, pw - 18, 3, {gap: 21, first: 31, ind: 14, mark: num(i, x + 9, py + 9)}); });
    return h + foot(D, E, FFOOT);
  };

  /* ================================ RED-LINE ================================
     The red rail runs off the left edge, top to bottom, with the label reading up it; the house photo butts against it
     and runs off the top; Oswald caps and heavy red rules carry the rest. */
  const rail = (E, ev, w, size, ls, pad) => { const e = edge(E), x = E.bw ? 18 : e, y = E.bw ? 18 : e, hgt = E.H - 2 * y, ww = w - x;
    return (E.bw ? box(x, y, ww, hgt, 'border:1.4pt solid var(--k-ink)') : box(x, y, ww, hgt, 'background:var(--k-main)')) +
      `<div class="abs" data-slot="oh.label" style="left:${Math.max(x, 0)}pt;top:18pt;width:${w - Math.max(x, 0)}pt;height:${E.H - 36}pt;display:flex;align-items:center;justify-content:flex-start;padding-top:${pad}pt;writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;${f(OS, 600, size, size * 1.1)}letter-spacing:${ls}pt;text-transform:uppercase;color:${E.bw ? 'var(--k-ink)' : '#fff'}">${esc(ev.label)}</div>`; };
  L$['red-line-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', e = edge(E), rw = 60, tx = 372, tw = 744 - tx;
    let h = rail(E, ev, rw, 21, 8, 30);
    h += ph(D, E, rw, e, 290, 188 - e);
    h += hr(tx, 30, tw, 3, 'var(--k-main)');
    h += X.line('title', 'Please Sign In', tx - 1, 38, tw, 46, 30, '', `font-family:${OS};font-weight:700;letter-spacing:.1pt;color:var(--k-ink)`);
    h += X.line('address', L.address, tx, 96, tw, 22, 13, '', `font-family:${OS};font-weight:700;letter-spacing:.1pt;color:var(--k-ink)`);
    h += X.line('place', up(X.cityZip(L)), tx, 127, 170, 8.5, 8, '', `font-family:${OS};font-weight:600;letter-spacing:1.6pt;color:var(--k-main)`);
    if(dated) h += X.line('oh.date', dateText(ev), tx + 176, 126, tw - 176, 10, 8, '', `text-align:right;font-family:${SS};font-weight:700;color:var(--k-ink)`);
    // the facts, each under its own red rule
    const fs = fact3(L).slice(0, 3), ws = [.29, .29, .42].map(v => v * tw);
    let fx = tx; fs.forEach(([v, l], i) => { const ww = ws[i] - 12;
      h += hr(fx, 148, ww, 1.6, 'var(--k-main)') + `<div class="abs nowrap" style="left:${fx}pt;top:154pt;width:${ww}pt;display:flex;align-items:baseline;gap:6pt">` +
        `<span data-slot="fact${i}" style="${f(OS, 700, 21, 26)}color:var(--k-ink)">${esc(v)}</span><span data-slot="factl${i}" style="${f(OS, 600, 8, 10)}letter-spacing:1.3pt;color:var(--k-muted)">${esc(up(l))}</span></div>`; fx += ws[i]; });
    h += hr(rw + 18, 196, 744 - rw - 18, 3, 'var(--k-main)');
    h += grid(D, E, {x0: rw + 18, W: 744 - rw - 18, top: 201, bot: 508, hd: 30, numW: 46, label: `font-family:${OS};font-weight:600;font-size:8.5pt;letter-spacing:1.6pt;color:var(--k-main)`, headRule: [1, 'var(--k-ink)'], lastRule: '1.6pt solid var(--k-main)',
      sep: 'border-top:.6pt solid var(--k-line)',
      num: (n, x, y, rh, nw) => numDiv(n, x, y, rh, nw, `${f(OS, 600, 22, 26)}color:var(--k-main)`),
      yn: `border:1pt solid var(--k-main);color:var(--k-main);font-family:${OS};border-radius:0`});
    return h + foot(D, E, [rw + 18, 516, 744 - rw - 18, 58]);
  };
  L$['red-line-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), e = edge(E), rw = 42, lx = 54, lw = 152, ax = 224, cw = 171, bx = 413;
    let h = rail(E, ev, rw, 11.5, 5, 16);
    h += ph(D, E, rw, e, lx + lw - rw, 108 - e);
    h += hr(ax, 22, 360, 2.6, 'var(--k-main)');
    h += X.line('address', L.address, ax - 1, 28, 360, 23, 14, '', `font-family:${OS};font-weight:700;color:var(--k-ink)`);
    h += X.line('place', up(X.cityZip(L)), ax, 59, 150, 8.5, 8, '', `font-family:${OS};font-weight:600;letter-spacing:1.6pt;color:var(--k-main)`);
    h += X.line('oh.date', dateText(ev), ax + 152, 58, 208, 9.5, 8, '', `text-align:right;font-family:${SS};font-weight:700;color:var(--k-ink)`);
    h += hr(ax, 78, 360, 2.6, 'var(--k-main)');
    const T = kit(D, {lab: `color:var(--k-main);font-family:${OS};font-weight:600;letter-spacing:1.6pt;`, q: `color:var(--k-ink);font-family:${OS};font-weight:600;letter-spacing:.1pt`, qcls: '', qs: 10.5,
      pill: () => `border:1pt solid var(--k-main);color:var(--k-main);font-size:8.5pt;letter-spacing:1pt;font-family:${OS};border-radius:0;font-weight:500`,
      dot: () => `border:1pt solid var(--k-main);color:var(--k-main);font-family:${OS};font-weight:600;font-size:10.5pt`});
    const P = T.FB.prompts, tick = (x, y) => hr(x, y, cw, 1.6, 'var(--k-main)');
    // under the photo: price, then the two ratings
    h += T.price(lx, 118, lw, {stack: true, gap: 4, h: 17}) + T.rateOver('cond', lx, 198, lw, 20) + T.rateOver('shows', lx, 238, lw, 20) + T.scale(lx, 277, lw, 'left');
    // two columns of questions, each under a red tick
    const y1 = 88, y2 = 177;
    h += tick(ax, y1) + T.ask('seller', T.FB.seller, ax, y1 + 7, cw, 2, {gap: 21, first: 31}) + tick(ax, y2) + T.ask(P[0][0], P[0][1], ax, y2 + 7, cw, 3, {gap: 21, first: 31}) + T.field('name', ax, 268, cw, 24);
    h += tick(bx, y1) + T.ask(P[1][0], P[1][1], bx, y1 + 7, cw, 3, {gap: 21, first: 31}) + tick(bx, y2) + T.ask(P[2][0], P[2][1], bx, y2 + 7, cw, 3, {gap: 21, first: 31}) + T.field('contact', bx, 268, cw, 24);
    h += vl(404, y1, 204, .5, 'var(--k-line)');
    return h + foot(D, E, [lx, 308, 584 - lx, 58]);
  };

  /* ============================ ROOM-PROPORTIONS ============================
     The agent's brand-color block top left holds "Please sign in"; the photo sits beside it; the facts are outlined boxes
     of different sizes standing on one baseline, the way the set draws its rooms to one scale, each with a gold square. */
  const MIX = p => `color-mix(in srgb, var(--k-main) ${p}%, transparent)`;
  const rpBoxes = (L, x, base, bw) => { const dims = [[58, 70], [48, 54], [72, 90]], fs = fact3(L).slice(0, 3); let h = '', bx = x;
    fs.forEach(([v, l], i) => { const [w, hg] = dims[i], y = base - hg;
      h += box(bx, y, w, hg, `border:1pt solid var(--k-ink);background:${i === 0 ? (bw ? 'rgba(0,0,0,.05)' : MIX(11)) : 'transparent'}`) +
        X.line('factl' + i, l, bx, y - 14, w + 8, 8.5, 8, '', `font-family:${SS};font-weight:600;color:var(--k-ink)`) +
        `<div class="abs nowrap" data-slot="fact${i}" style="left:${bx + 2}pt;top:${y + hg / 2 - 13}pt;width:${w - 4}pt;text-align:center;${f(SG, 500, 21, 26)}letter-spacing:-.5pt;color:var(--k-ink)">${esc(v)}</div>`;
      bx += w + 8; });
    return h; };
  L$['room-proportions-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, e = edge(E), bx = 36, bwd = 208, BB = 190, on = bw ? 'var(--k-ink)' : 'var(--k-on-main)', gd = bw ? 'var(--k-ink)' : 'var(--k-acc)';
    let h = bw ? box(18, 18, 244, BB - 18, 'border:1.4pt solid var(--k-ink)') : E.fl(0, 0, 262, BB, 'lt', 'background:var(--k-main)');
    const ll = K.labelLines(ev.label);
    h += `<div class="abs" style="left:${bx}pt;top:32pt;width:${bwd}pt;height:${BB - 32 - 16}pt;display:flex;flex-direction:column;justify-content:space-between">` +
      `<div>${ll.map((t, i) => `<div class="nowrap" data-slot="oh.label${i ? '2' : ''}" style="${f(SG, 700, 10, 15)}letter-spacing:1.8pt;color:${on}">${esc(up(t))}</div>`).join('')}</div>` +
      (dated ? `<div><div class="nowrap" data-slot="oh.date" style="${f(SG, 700, 8.5, 12)}letter-spacing:1.6pt;color:${gd}">${esc(up(ev.long))}</div><div class="nowrap" data-slot="oh.time" style="${f(SG, 600, 11, 14)}color:${on}">${esc(ev.time)}</div></div>` : '') +
      `<div>${dated ? '' : `<div style="width:6pt;height:6pt;background:${gd};margin-bottom:10pt"></div>`}` +
      `<div data-slot="title" style="margin-left:-2pt;font-family:${SG};font-weight:500;font-size:${dated ? 35 : 41}pt;line-height:${dated ? 36 : 42}pt;letter-spacing:-1.2pt;color:${on}">Please<br>sign in</div></div></div>`;
    h += ph(D, E, 272, e, 262, BB - e);
    const ax = 550, aw = 744 - ax;
    h += X.line('address', L.address, ax - 1, 27, aw, 21, 12, '', `font-family:${SG};font-weight:500;letter-spacing:-.5pt;color:var(--k-ink)`);
    h += X.line('place', up(X.cityZip(L)), ax, 58, aw, 8, 8, '', `font-family:${SS};font-weight:600;letter-spacing:1.6pt;color:var(--k-muted)`);
    h += rpBoxes(L, ax, BB, bw);
    // the register: a tinted head row, gold number squares
    const top = 198, hd = 30;
    h += band(48, top, 696, hd, `background:${bw ? 'rgba(0,0,0,.06)' : MIX(12)}`);
    h += grid(D, E, {x0: 48, W: 696, top, bot: 508, hd, numW: 44, label: `font-family:${SG};font-weight:700;letter-spacing:1.4pt;color:var(--k-main-ink)`, headRule: [1.6, 'var(--k-main-ink)'], band: i => i % 2 === 1, lastRule: '1.6pt solid var(--k-main-ink)',
      bandDraw: (y, rh) => band(48, y, 696, rh, `background:${bw ? 'rgba(0,0,0,.03)' : MIX(4.5)}`), sep: 'border-top:.5pt solid var(--k-line)', vrTop: top + 5,
      num: (n, x, y, rh, nw) => box(x + 6, y + rh / 2 - 3, 6, 6, 'background:var(--k-acc)') + numDiv(n, x + 12, y, rh, nw - 14, `${f(SG, 500, 18, 26)}letter-spacing:-.3pt;color:var(--k-ink)`),
      yn: `border:1pt solid var(--k-main-ink);color:var(--k-main-ink);font-family:${SG}`});
    return h + foot(D, E, SFOOT);
  };
  L$['room-proportions-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, e = edge(E), m = 28, BB = 92, on = bw ? 'var(--k-ink)' : 'var(--k-on-main)', gd = bw ? 'var(--k-ink)' : 'var(--k-acc)';
    let h = bw ? box(18, 18, 138, BB - 18, 'border:1.2pt solid var(--k-ink)') : E.fl(0, 0, 156, BB, 'lt', 'background:var(--k-main)');
    const ll = K.labelLines(ev.label);
    h += `<div class="abs" style="left:${m}pt;top:27pt;width:120pt;height:${BB - 27 - 10}pt;display:flex;flex-direction:column;justify-content:space-between">` +
      `<div>${ll.map((t, i) => `<div class="nowrap" data-slot="oh.label${i ? '2' : ''}" style="${f(SG, 700, 9, 13)}letter-spacing:1.4pt;color:${on}">${esc(up(t))}</div>`).join('')}</div>` +
      `<div><div class="nowrap" data-slot="oh.date" style="${f(SG, 700, 8, 11)}letter-spacing:.8pt;color:${gd}">${esc(up(ev.long))}</div><div class="nowrap" data-slot="oh.time" style="${f(SG, 600, 9, 12)}color:${on}">${esc(ev.time)}</div></div></div>`;
    const lr = 364;   // the left region's right edge; the three prompt boxes stand to its right, full height
    h += ph(D, E, 164, e, lr - 164, BB - e);
    h += X.line('address', L.address, m - 1, 98, 200, 18, 12, '', `font-family:${SG};font-weight:500;letter-spacing:-.5pt;color:var(--k-ink)`);
    h += X.line('place', up(X.cityZip(L)), 234, 105, lr - 234, 8, 8, '', `text-align:right;font-family:${SS};font-weight:600;letter-spacing:1.6pt;color:var(--k-muted)`);
    h += hr(m, 125, lr - m, 1, 'var(--k-main-ink)');
    const T = kit(D, {lab: `color:var(--k-main-ink);font-family:${SG};letter-spacing:.7pt;`, q: `color:var(--k-ink);font-family:${SG};font-weight:600;letter-spacing:-.1pt`, qcls: '', qs: 10.5,
      pill: () => `border:1pt solid var(--k-main-ink);color:var(--k-main-ink);font-size:8pt;letter-spacing:.2pt;font-family:${SG};border-radius:0`,
      dot: () => `border:1pt solid var(--k-main-ink);color:var(--k-main-ink);font-family:${SG};font-weight:700;font-size:10pt`});
    const hw = 172, rx = m + hw + 18, rw2 = lr - rx;
    h += T.price(m, 133, hw, {gap: 4, h: 20}) + T.rate('cond', m, 175, hw, 17.5, 83) + T.rate('shows', m, 199, hw, 17.5, 83) + T.scale(m, 221, hw);
    h += vl(m + hw + 9, 133, 98, .5, 'var(--k-line)');
    h += T.field('name', rx, 136, rw2, 30) + T.field('contact', rx, 184, rw2, 30);
    h += box(m, 245, 6, 6, 'background:var(--k-acc)') + T.ask('seller', T.FB.seller, m, 240, lr - m, 2, {gap: 21, first: 31, ind: 13});
    // the three prompts: each a box to write in, its question over it like the set's room labels; the box's own foot is the third line
    const px = 380, pw = 584 - px, bh = 66;
    T.FB.prompts.forEach(([k, s], i) => { const y = 22 + i * 91;
      h += X.line('q.' + k, s, px, y, pw, 10.5, 8, '', `font-family:${SG};font-weight:600;letter-spacing:-.1pt;color:var(--k-ink)`) +
        box(px, y + 18, pw, bh, `border:1pt solid var(--k-ink);background:${i === 0 ? (bw ? 'rgba(0,0,0,.04)' : MIX(7)) : 'transparent'}`) + T.wl(px + 8, y + 18 + 22, pw - 16) + T.wl(px + 8, y + 18 + 44, pw - 16); });
    return h + foot(D, E, FFOOT);
  };

  /* ================================ ROOM-STRIPS ================================
     The set's own page: the red banner off the top with the white Oswald headline in title case, then white paper to the
     foot. Under the banner a strip of photos (the set's signature), the facts as Oswald numerals with small grey caps,
     each write-in row a strip under a hairline with a short red rule over its number, red rules, a white footer. */
  const SKK = `font-family:${BA};font-weight:600;text-transform:uppercase;`;
  const stripFacts = (L, x, y, w, hgt) => { const fs = fact4(L), rh = hgt / fs.length; return hr(x, y, w, 1.6, 'var(--k-main)') + fs.map(([v, l], i) =>
    (i ? hr(x, y + i * rh, w, .6, 'var(--k-line)') : '') + `<div class="abs nowrap" style="left:${x}pt;top:${y + i * rh + rh / 2 - 10.5}pt;width:${w}pt;display:flex;align-items:baseline;gap:7pt">` +
    `<span data-slot="fact${i}" style="${f(OS, 600, 17, 22)}color:var(--k-ink)">${esc(v)}</span><span data-slot="factl${i}" style="${f(BA, 600, 8.5, 10)}letter-spacing:1.1pt;color:var(--k-muted)">${esc(up(l))}</span></div>`).join(''); };
  // a strip of photos, each at its own shape (no crop on the room photos), hgt pt tall, starting at x; returns [html, right edge]
  const anyPh = (D, E, k, x, y, w, hgt) => { const s = X.photo(D, k, x, y, w, hgt); return E.bw ? s.replace('class="photo"', 'class="photo light"') : s; };
  const roomKeys = D => { const P = D.photos || {}, pref = ['living', 'kitchen', 'primary', 'openplan', 'dining', 'bath'], all = Object.keys(P).filter(k => !/^front/.test(k) && P[k] && P[k].src && P[k].w && P[k].h);
    return pref.filter(k => all.includes(k)).concat(all.filter(k => !pref.includes(k))); };
  L$['room-strips-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 48, W = 696, on = bw ? 'var(--k-ink)' : '#fff', BH = 96;
    let h = bw ? hr(18, 18, 756, 3, 'var(--k-ink)') + hr(18, BH - 1.2, 756, 1.2, 'var(--k-ink)') : E.fl(0, 0, 792, BH, 'ltr', 'background:var(--k-main)');
    h += X.line('oh.label', ev.label, m, 28, 330, 9.5, 8, '', SKK + `letter-spacing:1.8pt;color:${on}`);
    h += X.line('title', 'Please Sign In', m - 1, 40, 400, 40, 28, '', `font-family:${OS};font-weight:700;letter-spacing:-.2pt;color:${on}`);
    if(dated) h += X.line('oh.date', dateText(ev), 444, 28, 300, 10, 8, '', `text-align:right;font-family:${OS};font-weight:500;letter-spacing:.4pt;color:${on}`);
    h += X.line('address', L.address, 444, 43, 300, 22, 13, '', `text-align:right;font-family:${OS};font-weight:700;letter-spacing:-.1pt;color:${on}`);
    h += X.line('place', X.cityZip(L), 444, 73, 300, 9.5, 8, '', `text-align:right;${SKK}letter-spacing:1.8pt;color:${on}`);
    // the photo strip
    const sy = BH + 8, sh = 104, two = !!((D.photos || {}).front2 || {}).src;
    h += ph(D, E, m, sy, 300, sh);
    if(two) h += ph2(D, E, m + 308, sy, 212, sh);
    const fx = two ? m + 308 + 212 + 14 : m + 300 + 16;
    h += stripFacts(L, fx, sy, 744 - fx, sh) + hr(fx, sy + sh - 1.6, 744 - fx, 1.6, 'var(--k-main)');
    // the register: seven strips, each under a hairline, a short red rule over its plain Oswald number
    const top = sy + sh + 6;
    h += grid(D, E, {x0: m, W, top, bot: 508, hd: 28, numW: 44, label: `${SKK}letter-spacing:1.4pt;color:var(--k-main)`, headRule: [1.6, 'var(--k-main)'], lastRule: '1.6pt solid var(--k-main)',
      sep: 'border-top:.6pt solid var(--k-line)', vrTop: top + 28 + 5,
      num: (n, x, y, rh, nw) => (n === E.first ? '' : hr(x, y - .8, 30, 1.6, 'var(--k-main)')) + numDiv(n, x - 4, y + 1, rh, nw, `text-align:left;padding-left:5pt;${f(OS, 600, 21, 26)}color:var(--k-ink)`),
      yn: `border:1pt solid var(--k-main);color:var(--k-main);font-family:${OS};border-radius:0`});
    return h + foot(D, E, SFOOT);
  };
  L$['room-strips-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, on = bw ? 'var(--k-ink)' : '#fff', BH = 54;
    let h = bw ? hr(18, 18, 576, 2.6, 'var(--k-ink)') + hr(18, BH - 1, 576, 1, 'var(--k-ink)') : E.fl(0, 0, 612, BH, 'ltr', 'background:var(--k-main)');
    h += X.line('address', L.address, m - 1, 24, 300, 20, 13, '', `font-family:${OS};font-weight:700;letter-spacing:-.1pt;color:${on}`);
    h += X.line('oh.label', ev.label, 334, 24, 250, 8.5, 8, '', `text-align:right;${SKK}letter-spacing:1.8pt;color:${on}`);
    h += X.line('oh.date', dateText(ev), 334, 37, 250, 9.5, 8, '', `text-align:right;font-family:${OS};font-weight:500;letter-spacing:.4pt;color:${on}`);
    const T = kit(D, {lab: `${SKK}letter-spacing:1.2pt;color:var(--k-main);`, q: `color:var(--k-ink);font-family:${OS};font-weight:600;letter-spacing:.1pt`, qcls: '', qs: 11.5,
      pill: () => `border:1pt solid var(--k-main);color:var(--k-main);font-size:8.5pt;letter-spacing:.6pt;font-family:${OS};font-weight:500;border-radius:0`,
      dot: () => `border:1pt solid var(--k-main);color:var(--k-main);font-family:${OS};font-weight:600;font-size:10pt`});
    // the strip: the front of the house and two rooms, then price and the ratings
    const sy = BH + 7, sh = 74; let x = m; const P = D.photos || {}, rooms = roomKeys(D).slice(0, 2);
    h += ph(D, E, x, sy, 130, sh); x += 136;
    rooms.forEach(k => { const w = Math.round(sh * P[k].w / P[k].h); h += anyPh(D, E, k, x, sy, w, sh); x += w + 6; });
    const rx = x + 8, rw = 584 - rx;
    h += T.price(rx, sy, rw, {gap: 4, h: 19}) + T.rate('cond', rx, sy + 39, rw, 16.5, 72) + T.rate('shows', rx, sy + 58.5, rw, 16.5, 72);
    h += T.scale(rx, sy + sh + 3, rw);
    // three prompts across, each under its own red rule (the set's strip headings)
    const s3 = sy + sh + 19, pw = (W - 2 * 14) / 3;
    T.FB.prompts.forEach(([k, s], i) => { const px = m + i * (pw + 14);
      h += hr(px, s3, pw, 1.6, 'var(--k-main)') + T.ask(k, s, px, s3 + 6, pw, 3, {gap: 20.4, first: 29}); });
    // the seller question under its rule; name and contact beside it, label and line on one row
    const s4 = s3 + 84;
    h += hr(m, s4, W, 1.6, 'var(--k-main)') + T.ask('seller', T.FB.seller, m, s4 + 6, 300, 2, {gap: 20.4, first: 29});
    const nx = 348, inl = (k, lw2, y) => T.lab(k, T.FB[k], nx, y - 12, lw2) + T.wl(nx + lw2 + 4, y, 584 - nx - lw2 - 4);
    h += inl('name', 62, s4 + 35) + inl('contact', 88, s4 + 55.4);
    return h + foot(D, E, FFOOT);
  };
})();
