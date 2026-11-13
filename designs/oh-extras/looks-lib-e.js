/* Open House extras for library flyers, batch e (owner 11/2/2026: roll out to every library flyer).
     P22  Diagonal         a main-color header whose lower edge slopes up to the right, the photo cut on that slope, an accent
                           stripe along it, Barlow caps, and a dark bar at the foot.
     P24  White Editorial  white page, Newsreader caps with Hanken Grotesk details, hairline rules, a double rule under the header.
     P24B White Editorial B  the same type, a full-width rule under the title and "The home" sidebar with the photo.
     P26  Tall Column      a tinted column down the left with the headline, round icon facts and the footer, the writing area beside it.
     P37  Clear Collage    a heavy main-color frame, Fraunces over Outfit, a solid main bar with the date and time (or the facts).
     P38  Serif Headline   centered EB Garamond headline with a two-tone title, thin gray rules, the photo and the facts either side. */
(function(){
  const X = Extras, L$ = X.looks, lib = X.lib;
  const {cols, labels, qs, box, txt, ph, foot1, foot2, esc, libTheme, icon, facts, edge} = lib;
  ['p22', 'p24', 'p24b', 'p26', 'p37', 'p38'].forEach(s => X.themes[s] = libTheme);
  const BAR = 'Barlow', ASAP = "'Asap Condensed','Oswald',Helvetica,sans-serif", NEWS = "'Newsreader',Georgia,serif", HANK = "'Hanken Grotesk',Helvetica,Arial,sans-serif",
    FRA = "'Fraunces',Georgia,serif", OUT = "'Outfit',Helvetica,Arial,sans-serif", GAR = "'EB Garamond',Georgia,serif", MAN = "'Manrope',Helvetica,Arial,sans-serif";
  const ink = E => E.bw ? 'var(--ink)' : 'var(--ink)';
  const mp = E => E.bw ? 'var(--ink)' : 'var(--main-on-paper)';
  const panel = 'background:color-mix(in srgb, var(--main) 9%, #fff)';

  // the slope: y(x) runs from yl at the left edge of the trim to yr at the right; floods, stripe and photo follow it
  const slope = (E, yl, yr) => x => yl + (yr - yl) * x / E.W;
  const fillSlope = (E, yl, yr, style) => { const e = edge(E), y = slope(E, yl, yr), w = E.W - 2 * e, hh = Math.max(y(e), y(E.W - e)) - e;
    return `<div class="abs" style="left:${e}pt;top:${e}pt;width:${w}pt;height:${hh}pt;${style};clip-path:polygon(0 0,100% 0,100% ${y(E.W - e) - e}pt,0 ${y(e) - e}pt)"></div>`; };
  const stripe = (E, yl, yr, off, th, color) => { const e = edge(E), y = slope(E, yl, yr), x0 = e, x1 = E.W - e, a = y(x0) + off, b = y(x1) + off, top = Math.min(a, b), hh = Math.max(a, b) + th - top;
    return `<div class="abs" style="left:${x0}pt;top:${top}pt;width:${x1 - x0}pt;height:${hh}pt;background:${color};clip-path:polygon(0 ${a - top}pt,100% ${b - top}pt,100% ${b - top + th}pt,0 ${a - top + th}pt)"></div>`; };
  const photoSlope = (D, E, x0, yl, yr) => { const e = edge(E), y = slope(E, yl, yr), x1 = E.W - e;
    return ph(D, E, x0, e, x1 - x0, y(x0) - e, `clip-path:polygon(0 0,100% 0,100% ${y(x1) - e}pt,0 ${y(x0) - e}pt)`); };

  // seven numbered rows with the four columns; c: x, W, numW, widths, y0, rh, labelY, labelH, labelStyle, num(n, y), yn (style), yd (mark size), band, top, rule, vr
  const tableRows = (E, c) => {
    const cs = cols(c.x, c.numW, c.widths); let h = labels(cs, c.labelY, c.labelH, c.labelStyle) + (c.top || '');
    for(let i = 0; i < 7; i++){ const y = c.y0 + i * c.rh;
      if(i % 2 === 0 && c.band !== false) h += `<div class="rowband" style="left:${c.x}pt;top:${y}pt;width:${c.W}pt;height:${c.rh}pt;background:var(--tint)"></div>`;
      h += c.num(E.first + i, y) + box(c.x, y + c.rh, c.W, 0, c.rule || 'border-top:.5pt solid var(--line)');
      cs.forEach(k => { if(k.yn) h += X.yn(k.x + k.w / 2 - c.yd - 3, y + (c.rh - c.yd) / 2, c.yd, c.yn); }); }
    if(c.vr) cs.forEach(k => h += `<div class="vrule" style="left:${k.x}pt;top:${c.y0 + 6}pt;height:${7 * c.rh - 12}pt"></div>`);
    return h; };

  // the feedback card's fields: left column (price opinion, Condition, How it shows, the seller question, name and contact), right
  // column (three prompts, three lines each). c: x0, cw, gap, t, sc (spacing), lab, q, qs, pill(i), dot(i), cw2
  const fbBody = (D, E, c) => {
    const FB = qs(D), t = c.t, s = c.sc || 1, ax = c.x0, aw = c.cw, bx = ax + aw + c.gap, bw2 = c.cw2 || aw;
    const lab = (slot, v, x, y, w) => txt(slot, v, x, y, w, c.lab), ql = (slot, v, x, y, w) => X.line(slot, v, x, y, w, c.qs || 10.5, 8, '', c.q);
    let h = lab('q.price', FB.price, ax, t, aw);
    h += `<div class="abs" style="left:${ax}pt;top:${t + 12}pt;width:${aw}pt;display:flex;gap:6pt">` + FB.choices.map((v, i) => `<span class="pill" style="flex:1;height:20pt;${c.pill(i)}">${v}</span>`).join('') + '</div>';
    h += lab('q.cond', FB.cond, ax, t + 48 * s, 80) + X.dots(ax + (c.lo || 86), t + 41 * s, aw - (c.lo || 86) - 6, c.dd || 21, c.dot);
    h += lab('q.shows', FB.shows, ax, t + 75 * s, 80) + X.dots(ax + (c.lo || 86), t + 68 * s, aw - (c.lo || 86) - 6, c.dd || 21, c.dot);
    h += txt('q.scale', FB.scale, ax + (c.lo || 86), t + 92 * s, aw - (c.lo || 86) - 6, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += ql('q.seller', FB.seller, ax, t + 108 * s, aw) + X.wline(ax, t + 128 * s, aw) + X.wline(ax, t + 144 * s, aw);
    h += lab('q.name', FB.name, ax, t + 148 * s, 100) + X.wline(ax, t + 171 * s, 112) + lab('q.contact', FB.contact, ax + 124, t + 148 * s, aw - 124) + X.wline(ax + 124, t + 171 * s, aw - 124);
    h += box(ax + aw + c.gap / 2, t + 2, 0, 171 * s, 'border-left:.6pt solid var(--line)');
    FB.prompts.forEach(([k, v], i) => { const y = t + i * 58 * s;
      h += ql('q.' + k, v, bx, y, bw2) + X.wline(bx, y + 26 * s, bw2) + X.wline(bx, y + 40 * s, bw2) + X.wline(bx, y + 54 * s, bw2); });
    return h; };
  const circ = (E, x, y, d, style) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${d}pt;height:${d}pt;border-radius:50%;display:flex;align-items:center;justify-content:center;${style}"></div>`;
  const factText = (f, x, y, w, style) => txt('', `${f[1]} ${f[2]}`, x, y, w, style);

  /* ================================ P22 DIAGONAL ================================ */
  const p22Dark = (E, y, hgt) => E.bw ? box(36, y, E.W - 72, 1.6, 'background:var(--ink)') : E.fl(0, y, E.W, hgt, 'lrb', 'background:var(--dark)');
  L$['p22-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720, dy = E.home ? 10 : 0;
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)', yl = 150, yr = 118;
    let h = bw ? '' : fillSlope(E, yl, yr, 'background:var(--main)');
    h += photoSlope(D, E, 440, yl, yr) + stripe(E, yl, yr, 4, bw ? 6 : 5, bw ? 'var(--ink)' : 'var(--accent)');
    h += txt('oh.label', ev.label, m, 14 + dy, 380, `font:600 10.5pt/1 ${BAR};letter-spacing:3pt;text-transform:uppercase;color:${ac}`);
    if(dated){
      h += X.line('title', 'Please sign in', m - 1, 28 + dy, 380, 40, 28, '', `font-family:${BAR};font-weight:700;text-transform:uppercase;letter-spacing:-.3pt;color:${on};line-height:42pt`);
      h += X.line('oh.date', ev.long, m, 74 + dy, 380, 22, 16, '', `font-family:${BAR};font-weight:600;color:${on}`);
      h += X.line('oh.time', ev.time, m, 102 + dy, 380, 14, 11, '', `font-family:${BAR};font-weight:500;color:${ac}`);
    } else {
      h += X.line('title', 'Please', m - 1, 28 + dy, 380, 44, 30, '', `font-family:${BAR};font-weight:700;text-transform:uppercase;letter-spacing:-.3pt;color:${on};line-height:46pt`);
      h += X.line('title2', 'sign in', m - 1, 72 + dy, 380, 44, 30, '', `font-family:${BAR};font-weight:700;text-transform:uppercase;letter-spacing:-.3pt;color:${ac};line-height:46pt`);
    }
    h += tableRows(E, {x: m, W, numW: 46, widths: [204, 204, 94, 172], y0: 196, rh: 41, labelY: 168, labelH: 20, labelStyle: `font-family:${BAR};font-weight:700;font-size:10pt;letter-spacing:1.3pt;color:var(--main-on-paper);align-items:center`,
      top: box(m, 194.5, W, 1.5, `background:${bw ? 'var(--ink)' : 'var(--main)'}`), vr: true, yd: 18, yn: `border:.9pt solid var(--main-on-paper);color:var(--main-on-paper);font-family:${BAR};border-radius:2pt`,
      num: (n, y) => `<div class="abs" style="left:${m + 3}pt;top:${y + 6}pt;width:32pt;height:${41 - 12}pt;background:${bw ? 'var(--ink)' : 'var(--main)'};display:flex;align-items:center;justify-content:center;font:700 15pt/1 ${BAR};color:${bw ? '#fff' : 'var(--on-main)'}">${n}</div>`});
    h += p22Dark(E, 500, 112) + foot1(D, [m, 512, W, 62], {dark: !bw});
    return h;
  };
  L$['p22-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, dy = E.home ? 16 : 0, yl = 120, yr = 94;
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)', mc = mp(E);
    let h = bw ? '' : fillSlope(E, yl, yr, 'background:var(--main)');
    h += photoSlope(D, E, 372, yl, yr) + stripe(E, yl, yr, 3, bw ? 5 : 4, bw ? 'var(--ink)' : 'var(--accent)');
    h += txt('oh.label', ev.label, m, 6 + dy, 330, `font:600 9pt/1 ${BAR};letter-spacing:2.6pt;text-transform:uppercase;color:${ac}`);
    h += X.line('title', 'Your feedback', m - 1, 16 + dy, 330, 29, 22, '', `font-family:${BAR};font-weight:700;text-transform:uppercase;letter-spacing:-.2pt;color:${on};line-height:32pt`);
    h += X.line('address', L.address, m, 50 + dy, 330, 15, 11, '', `font-family:${BAR};font-weight:600;color:${on}`);
    h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, m, 70 + dy, 330, 9, 8, '', `font:500 9pt/1 ${BAR};letter-spacing:1pt;text-transform:uppercase;color:${ac}`);
    h += fbBody(D, E, {x0: m, cw: 262, gap: 32, t: 136, lab: `font:600 9pt/1 ${BAR};letter-spacing:.2pt;color:${mc}`, qs: 10.5, q: `font-family:${BAR};font-weight:700;color:${mc}`,
      pill: i => `border:.9pt solid var(--main-on-paper);color:${mc};background:var(--tint);border-radius:2pt;font:600 8.5pt/1 ${BAR};letter-spacing:.5pt;text-transform:none`,
      dot: i => `border:.9pt solid var(--main-on-paper);background:var(--tint);color:${mc};border-radius:2pt;font:700 11pt/1 ${BAR}`});
    h += p22Dark(E, 316, 80) + foot1(D, [m, 322, W, 54], {dark: !bw});
    return h;
  };

  /* ================================ P24 WHITE EDITORIAL ================================ */
  const edRule = (x, y, w) => box(x, y, w, 1.6, 'background:var(--accent-on-paper)') + box(x, y + 4, w, .7, 'background:var(--ink);opacity:.4');
  L$['p24-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720, mc = mp(E);
    let h = ph(D, E, 528, 30, 228, 112);
    h += txt('oh.label', ev.label, m, 30, 440, `font:600 9pt/1 ${HANK};letter-spacing:2.2pt;text-transform:uppercase;color:${mc}`);
    h += X.line('title', 'Please sign in', m, 46, 470, 30, 22, '', `font-family:${NEWS};font-weight:500;text-transform:uppercase;letter-spacing:2.4pt;line-height:36pt`);
    h += X.line('address', L.address, m, 88, 470, 20, 15, '', `font-family:${NEWS};font-weight:400`);
    h += txt('place', X.cityZip(L), m, 112, 470, `font:400 10pt/1 ${HANK};color:var(--muted)`);
    if(dated) h += X.line('oh.date', `${ev.long}   |   ${ev.time}`, m, 128, 470, 10, 8, '', `font-family:${HANK};font-weight:600;letter-spacing:1.4pt;text-transform:uppercase;color:${mc}`);
    else h += txt('facts', facts(L).map(f => `${f[1]} ${f[2]}`).join('   |   '), m, 128, 470, `font:600 9pt/1 ${HANK};letter-spacing:1.6pt;text-transform:uppercase;color:${mc}`);
    h += edRule(m, 154, W);
    h += tableRows(E, {x: m, W, numW: 44, widths: [206, 206, 92, 172], y0: 198, rh: 41, labelY: 170, labelH: 22, labelStyle: `font-family:${HANK};font-weight:600;font-size:8.5pt;letter-spacing:1.3pt;color:${mc};align-items:center`,
      band: false, vr: true, yd: 18, yn: `border:.8pt solid ${mc};color:${mc};font-family:${HANK};font-weight:600`,
      top: box(m, 196.6, W, 1, 'background:var(--ink);opacity:.55'),
      num: (n, y) => `<div class="abs" style="left:${m}pt;top:${y}pt;width:30pt;height:41pt;display:flex;align-items:center;justify-content:center;font:500 16pt/1 ${NEWS};color:${mc}">${n}</div>`});
    h += foot1(D, [m, 516, W, 62]);
    return h;
  };
  L$['p24-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, mc = mp(E);
    let h = ph(D, E, 434, 26, 150, 70);
    h += txt('oh.label', ev.label, m, 26, 380, `font:600 8.5pt/1 ${HANK};letter-spacing:2pt;text-transform:uppercase;color:${mc}`);
    h += X.line('title', 'Your feedback', m, 40, 380, 26, 20, '', `font-family:${NEWS};font-weight:500;text-transform:uppercase;letter-spacing:2pt;line-height:30pt`);
    h += X.line('address', L.address, m, 72, 380, 15, 12, '', `font-family:${NEWS}`);
    h += X.line('oh.date', `${ev.long}   |   ${ev.time}`, m, 92, 380, 9, 8, '', `font-family:${HANK};font-weight:600;letter-spacing:1.2pt;text-transform:uppercase;color:${mc}`);
    h += edRule(m, 112, W);
    h += fbBody(D, E, {x0: m, cw: 262, gap: 32, t: 130, sc: 1.02, lab: `font:600 9pt/1 ${HANK};letter-spacing:.2pt;color:${mc}`, qs: 11, q: `font-family:${NEWS};font-weight:500;color:var(--ink)`,
      pill: i => `border:.8pt solid ${mc};color:${mc};background:transparent;border-radius:0;font:600 8.5pt/1 ${HANK};letter-spacing:.5pt;text-transform:none`,
      dot: i => `border:.8pt solid ${mc};background:transparent;color:${mc};border-radius:50%;font:500 11pt/1 ${NEWS}`});
    h += box(m, 318, W, 0, 'border-top:.5pt solid var(--line)') + foot1(D, [m, 326, W, 54]);
    return h;
  };

  /* ================================ P24B WHITE EDITORIAL B ================================ */
  L$['p24b-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720, mc = mp(E), sw = 140, tw = W - sw - 18, sx = m + tw + 18;
    let h = X.line('title', 'Please sign in', m, 26, 400, 28, 20, '', `font-family:${NEWS};font-weight:500;text-transform:uppercase;letter-spacing:2.6pt;line-height:36pt`);
    h += txt('oh.label', ev.label, m + W - 300, 38, 300, `text-align:right;font:600 9.5pt/1 ${HANK};letter-spacing:2pt;text-transform:uppercase;color:${mc}`);
    h += box(m, 70, W, 1.6, `background:${bw ? 'var(--ink)' : 'var(--main)'}`);
    h += X.line('address', L.address, m, 80, 330, 24, 16, '', `font-family:${NEWS}`);
    if(dated) h += X.line('oh.date', `${ev.long}   |   ${ev.time}`, m + 330, 88, W - 330, 10, 8, '', `text-align:right;font-family:${HANK};font-weight:600;letter-spacing:1.2pt;text-transform:uppercase;color:${mc}`);
    else h += txt('place', X.cityZip(L), m + W - 300, 88, 300, `text-align:right;font:400 10.5pt/1 ${HANK};color:var(--muted)`);
    h += tableRows(E, {x: m, W: tw, numW: 34, widths: [154, 164, 86, 124], y0: 150, rh: 48, labelY: 118, labelH: 28, labelStyle: `font-family:${HANK};font-weight:600;font-size:8.5pt;letter-spacing:1.2pt;color:${mc};align-items:flex-end`,
      band: false, vr: true, yd: 18, yn: `border:.8pt solid ${mc};color:${mc};font-family:${HANK};font-weight:600`,
      top: box(m, 148.6, tw, 1.4, `background:${bw ? 'var(--ink)' : 'var(--accent)'}`),
      num: (n, y) => `<div class="abs" style="left:${m}pt;top:${y}pt;width:28pt;height:48pt;display:flex;align-items:center;justify-content:center;font:500 16pt/1 ${NEWS};color:${mc}">${n}</div>`});
    // the sidebar: the photo, then "The home" with its facts between hairlines
    h += ph(D, E, sx, 118, sw, 118);
    h += txt('', 'The home', sx, 252, sw, `font:600 8.5pt/1 ${HANK};letter-spacing:2.2pt;text-transform:uppercase;color:${mc}`) + box(sx, 268, sw, 1.4, `background:${bw ? 'var(--ink)' : 'var(--accent)'}`);
    const rows = facts(L).map(f => `${f[1]} ${f[2].toLowerCase()}`); if(L.yearBuilt) rows.push(`Built in ${L.yearBuilt}`); if(L.lotSize) rows.push(String(L.lotSize).replace(/\s*Sq Ft Lot/i, ' sq ft lot'));
    // the facts' rows fill the column down to the table's last line, their last hairline level with it (owner 11/13: no
    // blank space under the list)
    const fr = rows.slice(0, 5), fTop = 270, fBot = 150 + 7 * 48, fp = (fBot - fTop) / Math.max(fr.length, 4);
    fr.forEach((r, i) => { h += txt('', r, sx, fTop + i * fp + (fp - 13) / 2, sw, `font:400 13pt/1 ${NEWS}`) + box(sx, fTop + (i + 1) * fp, sw, 0, 'border-top:.5pt solid var(--line)'); });
    h += foot1(D, [m, 516, W, 62]);
    return h;
  };
  L$['p24b-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, mc = mp(E);
    let h = X.line('title', 'Your feedback', m, 22, 300, 24, 18, '', `font-family:${NEWS};font-weight:500;text-transform:uppercase;letter-spacing:2.2pt;line-height:30pt`);
    h += txt('oh.label', ev.label, m + W - 230, 33, 230, `text-align:right;font:600 8.5pt/1 ${HANK};letter-spacing:1.8pt;text-transform:uppercase;color:${mc}`);
    h += box(m, 56, W, 1.6, `background:${bw ? 'var(--ink)' : 'var(--main)'}`);
    h += ph(D, E, m + W - 118, 66, 118, 62);
    h += X.line('address', L.address, m, 66, 400, 19, 13, '', `font-family:${NEWS}`);
    h += X.line('oh.date', `${ev.long}   |   ${ev.time}`, m, 90, 400, 9, 8, '', `font-family:${HANK};font-weight:600;letter-spacing:1.2pt;text-transform:uppercase;color:${mc}`);
    h += txt('place', X.cityZip(L), m, 106, 400, `font:400 9.5pt/1 ${HANK};color:var(--muted)`);
    h += fbBody(D, E, {x0: m, cw: 262, gap: 32, t: 138, lab: `font:600 9pt/1 ${HANK};letter-spacing:.2pt;color:${mc}`, qs: 11, q: `font-family:${NEWS};font-weight:500;color:var(--ink)`,
      pill: i => `border:.8pt solid ${mc};color:${mc};background:transparent;border-radius:0;font:600 8.5pt/1 ${HANK};letter-spacing:.5pt;text-transform:none`,
      dot: i => `border:.8pt solid ${mc};background:transparent;color:${mc};border-radius:50%;font:500 11pt/1 ${NEWS}`});
    h += box(m, 322, W, 0, 'border-top:.5pt solid var(--line)') + foot1(D, [m, 328, W, 50]);
    return h;
  };

  /* ================================ P26 TALL COLUMN ================================ */
  const p26Facts = (D, E, x, y, step, w) => { let h = ''; facts(D.listing).forEach((f, i) => { const yy = y + i * step;
    h += circ(E, x, yy, 26, E.bw ? 'border:1pt solid var(--ink)' : 'background:var(--main)') + icon(f[0], x + 5, yy + 5, 16, E.bw ? 'var(--ink)' : 'var(--on-main)');
    h += txt('', `${f[1]} ${f[2]}`, x + 36, yy + 8, w - 36, `font:600 9.5pt/1 ${BAR};letter-spacing:1.3pt;text-transform:uppercase;color:var(--ink)`); }); return h; };
  L$['p26-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, cw = 186, mc = mp(E), tx = 270, tW = 486, rh = 43;
    let h = bw ? box(254, 20, 0, 572, 'border-left:1pt solid var(--ink)') : E.fl(0, 0, 250, 612, 'ltb', panel);
    h += txt('oh.label', ev.label, m, 36, cw, `font:600 9.5pt/1 ${BAR};letter-spacing:2.4pt;text-transform:uppercase;color:${mc}`);
    h += X.line('title', 'Please', m - 1, 52, cw, 50, 30, '', `font-family:${ASAP};font-weight:700;text-transform:uppercase;color:${mc};line-height:50pt`);
    h += X.line('title2', 'sign in', m - 1, 100, cw, 50, 30, '', `font-family:${ASAP};font-weight:700;text-transform:uppercase;color:${mc};line-height:50pt`);
    let y;
    if(dated){
      h += txt('oh.weekday', ev.weekday, m, 168, cw, `font:600 9.5pt/1 ${BAR};letter-spacing:3pt;text-transform:uppercase;color:var(--ink)`);
      h += X.line('oh.date', ev.monthDay.toUpperCase(), m - 1, 180, cw, 38, 26, '', `font-family:${ASAP};font-weight:700;color:${mc};line-height:42pt`);
      h += X.line('oh.time', ev.time, m, 226, cw, 15, 11, '', `font-family:${BAR};font-weight:600;color:var(--ink)`);
      h += box(m, 254, cw, 2.4, `background:${bw ? 'var(--ink)' : 'var(--main)'}`); y = 266;
    } else { h += box(m, 166, cw, 2.4, `background:${bw ? 'var(--ink)' : 'var(--main)'}`); y = 180; }
    h += X.line('address', L.address, m - 1, y, cw, 26, 14, '', `font-family:${ASAP};font-weight:700;color:${mc};line-height:30pt`);
    h += txt('place', X.cityZip(L), m, y + 33, cw, `font:600 9pt/1 ${BAR};letter-spacing:1.6pt;text-transform:uppercase;color:var(--muted)`);
    h += p26Facts(D, E, m, dated ? 336 : 252, dated ? 30 : 40, cw);
    h += foot2(D, [m, 416, cw, 164]);
    h += tableRows(E, {x: tx, W: tW, numW: 34, widths: [118, 128, 80, 126], y0: 70, rh, labelY: 36, labelH: 28, labelStyle: `font-family:${ASAP};font-weight:700;font-size:10.5pt;letter-spacing:1.2pt;color:${mc};align-items:flex-end`,
      top: box(tx, 68.4, tW, 1.6, `background:${bw ? 'var(--ink)' : 'var(--main)'}`), vr: true, yd: 18, yn: `border:.9pt solid ${mc};color:${mc};font-family:${ASAP};border-radius:50%`,
      num: (n, y) => `<div class="abs" style="left:${tx + 3}pt;top:${y + 8.5}pt;width:26pt;height:26pt;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${bw ? 'transparent' : 'var(--main)'};border:${bw ? '1pt solid var(--ink)' : 'none'};font:700 12.5pt/1 ${ASAP};color:${bw ? 'var(--ink)' : 'var(--on-main)'}">${n}</div>`});
    // the house under the table, as wide as the writing area
    h += ph(D, E, tx, 396, tW, 184);
    return h;
  };
  L$['p26-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, cw = 126, mc = mp(E);
    let h = bw ? box(176, 20, 0, 290, 'border-left:1pt solid var(--ink)') : E.fl(0, 0, 170, 318, 'lt', panel);
    h += txt('oh.label', ev.label, m, 30, cw, `font:600 8.5pt/1 ${BAR};letter-spacing:1.6pt;text-transform:uppercase;color:${mc}`);
    h += X.line('title', 'Your', m - 1, 44, cw, 34, 24, '', `font-family:${ASAP};font-weight:700;text-transform:uppercase;color:${mc};line-height:34pt`);
    h += X.line('title2', 'feedback', m - 1, 76, cw, 34, 22, '', `font-family:${ASAP};font-weight:700;text-transform:uppercase;color:${mc};line-height:34pt`);
    h += box(m, 118, cw, 2.2, `background:${bw ? 'var(--ink)' : 'var(--main)'}`);
    h += X.line('address', L.address, m - 1, 128, cw, 16, 11, '', `font-family:${ASAP};font-weight:700;color:${mc}`);
    h += txt('place', X.cityZip(L), m, 150, cw, `font:600 8pt/1 ${BAR};letter-spacing:1pt;text-transform:uppercase;color:var(--muted)`);
    h += X.line('oh.date', ev.long, m, 168, cw, 10, 8, '', `font-family:${BAR};font-weight:600;color:var(--ink)`);
    h += X.line('oh.time', ev.time, m, 183, cw, 10, 8, '', `font-family:${BAR};font-weight:500;color:var(--ink)`);
    h += ph(D, E, m, 206, cw, 100);
    h += fbBody(D, E, {x0: 194, cw: 184, gap: 20, lo: 70, dd: 19, t: 30, sc: 1.55, lab: `font:600 9pt/1 ${BAR};letter-spacing:.2pt;color:${mc}`, qs: 10.5, q: `font-family:${ASAP};font-weight:700;color:${mc}`,
      pill: i => `border:.9pt solid ${mc};color:${mc};background:var(--tint);border-radius:10pt;font:600 8pt/1 ${BAR};letter-spacing:.2pt;text-transform:none`,
      dot: i => `border:.9pt solid ${mc};background:var(--tint);color:${mc};border-radius:50%;font:700 11pt/1 ${ASAP}`});
    h += box(m, 322, W, 0, 'border-top:.5pt solid var(--line)') + foot1(D, [m, 328, W, 50]);
    return h;
  };

  /* ================================ P37 CLEAR COLLAGE ================================ */
  const p37Frame = E => { const e = edge(E), fi = E.home ? 24 : 6, c = E.bw ? 'var(--ink)' : 'var(--main)', W = E.W, H = E.H;
    return box(e, e, W - 2 * e, fi - e, `background:${c}`) + box(e, H - fi, W - 2 * e, fi - e, `background:${c}`) + box(e, e, fi - e, H - 2 * e, `background:${c}`) + box(W - fi, e, fi - e, H - 2 * e, `background:${c}`); };
  const p37Bar = (E, y, hgt) => { const e = edge(E); return E.bw ? box(36, y, E.W - 72, hgt, 'border:1.4pt solid var(--ink)') : box(e, y, E.W - 2 * e, hgt, 'background:var(--main)'); };
  L$['p37-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 44, W = 704, mc = mp(E), on = bw ? 'var(--ink)' : 'var(--on-main)', dy = E.home ? 4 : 0;
    let h = p37Frame(E) + p37Bar(E, 130, 42);
    h += ph(D, E, 486, 32 + dy, 262, 90);
    h += X.line('title', 'Please sign in', m - 1, 30 + dy, 420, 42, 28, '', `font-family:${FRA};font-weight:600;color:${mc};line-height:48pt`);
    h += X.line('address', `${L.address} · ${X.cityZip(L)}`.toUpperCase(), m, 86 + dy, 420, 10, 8, '', `font-family:${OUT};font-weight:500;letter-spacing:2.2pt;color:var(--ink)`);
    h += X.line('oh.label', ev.label, m, 139, 330, 22, 14, '', `font-family:${FRA};font-weight:600;color:${on};line-height:26pt`);
    const right = dated ? `${ev.long}  ·  ${ev.time}` : facts(L).map(f => `${f[1]} ${f[2].toLowerCase()}`).join('  ·  ');
    h += X.line(dated ? 'oh.date' : 'facts', right, m + W - 360 - 6, 144, 360, 12, 8, '', `text-align:right;font-family:${OUT};font-weight:600;color:${on}`);
    h += tableRows(E, {x: m, W, numW: 44, widths: [204, 204, 90, 162], y0: 206, rh: 39, labelY: 180, labelH: 22, labelStyle: `font-family:${OUT};font-weight:600;font-size:8.5pt;letter-spacing:1.2pt;color:${mc};align-items:center`,
      top: box(m, 204.6, W, 1.4, `background:${bw ? 'var(--ink)' : 'var(--main)'}`), vr: true, yd: 18, yn: `border:.9pt solid ${mc};color:${mc};font-family:${OUT};font-weight:600`,
      num: (n, y) => `<div class="abs" style="left:${m + 6}pt;top:${y + 7.5}pt;width:24pt;height:24pt;border-radius:50%;border:.9pt solid ${mc};display:flex;align-items:center;justify-content:center;font:600 11.5pt/1 ${FRA};color:${mc}">${n}</div>`});
    h += foot1(D, [m, 508, W, 62]);
    return h;
  };
  L$['p37-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 36, W = 540, mc = mp(E), on = bw ? 'var(--ink)' : 'var(--on-main)', dy = E.home ? 4 : 0;
    let h = p37Frame(E) + p37Bar(E, 98, 26);
    h += ph(D, E, 408, 28 + dy, 168, 62);
    h += X.line('title', 'Your feedback', m - 1, 26 + dy, 310, 30, 22, '', `font-family:${FRA};font-weight:600;color:${mc};line-height:34pt`);
    h += X.line('address', `${L.address} · ${X.cityZip(L)}`.toUpperCase(), m, 70 + dy, 310, 9, 8, '', `font-family:${OUT};font-weight:500;letter-spacing:1.8pt;color:var(--ink)`);
    h += X.line('oh.label', ev.label, m + (bw ? 10 : 0), 103, 220, 16, 11, '', `font-family:${FRA};font-weight:600;color:${on};line-height:18pt`);
    h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, m + W - 300 - (bw ? 10 : 0), 107, 300, 10, 8, '', `text-align:right;font-family:${OUT};font-weight:600;color:${on}`);
    h += fbBody(D, E, {x0: m, cw: 250, gap: 40, t: 136, lab: `font:600 9pt/1 ${OUT};letter-spacing:.2pt;color:${mc}`, qs: 11, q: `font-family:${FRA};font-weight:600;color:${mc}`,
      pill: i => `border:.9pt solid ${mc};color:${mc};background:var(--tint);border-radius:10pt;font:500 8.5pt/1 ${OUT};letter-spacing:.3pt;text-transform:none`,
      dot: i => `border:.9pt solid ${mc};background:var(--tint);color:${mc};border-radius:50%;font:600 10.5pt/1 ${FRA}`});
    h += box(m, 312, W, 0, 'border-top:.5pt solid var(--line)') + foot1(D, [m, 318, W, 48]);
    return h;
  };

  /* ================================ P38 SERIF HEADLINE ================================ */
  const twoTone = (slot, a, b, x, y, w, size, floor, mc, E, extra = '') =>
    `<div class="abs nowrap" data-slot="${slot}" data-shrink="${floor}" style="left:${x}pt;top:${y}pt;width:${w}pt;text-align:center;font:500 ${size}pt/${size * 1.18}pt ${GAR};color:var(--ink);${extra}">${esc(a)} <span style="color:${mc}">${esc(b)}</span></div>`;
  const grey = 'background:var(--ink);opacity:.4';
  const P38TY = 12;
  L$['p38-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720, mc = mp(E), cx = 196, cwid = 400;
    let h = ph(D, E, m, 30, 150, 100);
    h += twoTone('title', 'Please', 'sign in', cx, P38TY, cwid, 44, 30, mc, E, 'padding-bottom:16pt;'); // up, g whole (owner 11/6)
    h += box(cx, 78, cwid, 1, grey);
    h += X.line('address', L.address, cx, 88, cwid, 25, 16, '', `text-align:center;font-family:${GAR};font-weight:600;line-height:30pt`);
    h += txt('oh.label', ev.label, cx, 120, cwid, `text-align:center;font:600 9pt/1 ${MAN};letter-spacing:2.4pt;text-transform:uppercase;color:${mc}`);
    if(dated){
      h += box(cx, 140, cwid, 1, grey);
      h += X.line('oh.date', ev.long, cx, 148, cwid, 20, 14, '', `text-align:center;font-family:${GAR};font-weight:600;line-height:24pt`);
      h += X.line('oh.time', ev.time, cx, 174, cwid, 13, 10, '', `text-align:center;font-family:${MAN};font-weight:600;color:${mc}`);   // 174: clear of the date's tails (11/13)
    } else h += txt('place', X.cityZip(L), cx, 138, cwid, `text-align:center;font:500 10pt/1 ${MAN};color:var(--muted)`);
    facts(L).forEach((f, i) => { const y = 38 + i * 36;
      h += circ(E, 626, y, 28, `border:.9pt solid ${mc}`) + icon(f[0], 632, y + 6, 16, mc) + txt('', `${f[1]} ${f[2].toLowerCase()}`, 662, y + 9, 96, `font:600 9pt/1 ${MAN};color:var(--ink)`); });
    h += box(m, 196, W, 1, grey);
    h += tableRows(E, {x: m, W, numW: 44, widths: [206, 206, 92, 172], y0: 228, rh: 39, labelY: 202, labelH: 22, labelStyle: `font-family:${MAN};font-weight:700;font-size:8.5pt;letter-spacing:1.2pt;color:${mc};align-items:center`,
      band: false, vr: true, top: box(m, 227, W, 1, grey), yd: 18, yn: `border:.8pt solid ${mc};color:${mc};font-family:${MAN};font-weight:700`, rule: 'border-top:.5pt solid var(--line)',
      num: (n, y) => `<div class="abs" style="left:${m}pt;top:${y}pt;width:32pt;height:39pt;display:flex;align-items:center;justify-content:center;font:500 16pt/1 ${GAR};color:${mc}">${n}</div>`});
    h += foot1(D, [m, 518, W, 62]);
    return h;
  };
  L$['p38-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, mc = mp(E), cx = 150, cwid = 312;
    let h = ph(D, E, m, 28, 100, 66);
    h += twoTone('title', 'Your', 'feedback', cx, 22, cwid, 32, 22, mc, E);
    h += box(cx, 64, cwid, 1, grey);
    h += X.line('address', L.address, cx, 70, cwid, 16, 12, '', `text-align:center;font-family:${GAR};font-weight:600;line-height:20pt`);
    h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, cx, 92, cwid, 9, 8, '', `text-align:center;font-family:${MAN};font-weight:600;letter-spacing:.8pt;text-transform:uppercase;color:${mc}`);
    h += txt('oh.label', ev.label, cx, 106, cwid, `text-align:center;font:600 8pt/1 ${MAN};letter-spacing:2pt;text-transform:uppercase;color:var(--muted)`);
    facts(L).forEach((f, i) => { const y = 30 + i * 24;
      h += circ(E, 478, y, 20, `border:.9pt solid ${mc}`) + icon(f[0], 482, y + 4, 12, mc) + txt('', `${f[1]} ${f[2].toLowerCase()}`, 504, y + 6, 82, `font:600 8.5pt/1 ${MAN};color:var(--ink)`); });
    h += box(m, 122, W, 1, grey);
    h += fbBody(D, E, {x0: m, cw: 262, gap: 32, t: 136, lab: `font:600 9pt/1 ${MAN};letter-spacing:.1pt;color:${mc}`, qs: 11.5, q: `font-family:${GAR};font-weight:600;color:var(--ink)`,
      pill: i => `border:.8pt solid ${mc};color:${mc};background:transparent;border-radius:0;font:600 8.5pt/1 ${MAN};letter-spacing:.3pt;text-transform:none`,
      dot: i => `border:.8pt solid ${mc};background:transparent;color:${mc};border-radius:50%;font:500 11.5pt/1 ${GAR}`});
    h += box(m, 322, W, 0, 'border-top:.5pt solid var(--line)') + foot1(D, [m, 326, W, 52]);
    return h;
  };
})();
