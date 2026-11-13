/* Open House extras for library flyers, batch c (owner 11/2/2026: roll out to every library flyer):
   P02 Poster, P04 Soft Geometry, P05 Rounded Frame, P06 Warm Collage, P08 Architect, P10 Charcoal Classic.
   Each look takes its fonts, palette roles, ornaments and layout language from its flyer (templates/oh-library/). */
(function(){
  const X = Extras, L$ = X.looks, K = X.lib, {cols, labels, qs, box, txt, ph, foot1, esc, libTheme, facts, edge, mixOf} = K;

  /* ---- shared builders: the seven writing rows and the feedback card's questions, styled by each look ---- */
  // o: x0, W, y0, rh, numW, widths[4], ly, lh, ls (label style), row(i,y), num(i,y,n), sep(i,y), yn (style), ynD, vr(c)
  const rows = (E, o) => {
    const cs = cols(o.x0, o.numW, o.widths); let h = labels(cs, o.ly, o.lh, o.ls);
    for(let i = 0; i < 7; i++){
      const y = o.y0 + i * o.rh;
      h += (o.row ? o.row(i, y) : '') + o.num(i, y, E.first + i) + o.sep(i, y + o.rh);
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - o.ynD - 3, y + (o.rh - o.ynD) / 2, o.ynD, o.yn); });
    }
    if(o.vr) cs.forEach(c => { h += o.vr(c); });
    return h;
  };
  // the feedback questions in two columns from (x, y): price, 1-5 marks, the seller question, name and contact on the left,
  // the three prompts on the right. o: aw (left width), gap, w (full width), lab(slot,t,x,y,w), q(slot,t,x,y,w), pill, dot(i), pillH, div
  const fbBody = (D, E, o) => {
    const FB = qs(D), ax = o.x, aw = o.aw, bx = ax + aw + o.gap, bw2 = o.x + o.w - bx, y = o.y; let h = '';
    h += o.lab('q.price', FB.price, ax, y, aw);
    h += `<div class="abs" style="left:${ax}pt;top:${y + 12}pt;width:${aw}pt;display:flex;gap:6pt">` + FB.choices.map(t => `<span class="pill" style="flex:1;height:${o.pillH || 20}pt;${o.pill}">${t}</span>`).join('') + '</div>';
    h += o.lab('q.cond', FB.cond, ax, y + 48, 100) + X.dots(ax + 108, y + 41, aw - 108, 22, o.dot);
    h += o.lab('q.shows', FB.shows, ax, y + 76, 100) + X.dots(ax + 108, y + 69, aw - 108, 22, o.dot);
    h += txt('q.scale', FB.scale, ax + 108, y + 101, aw - 108, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += o.q('q.seller', FB.seller, ax, y + 116, aw) + X.wline(ax, y + 144, aw) + X.wline(ax, y + 160, aw);
    h += o.lab('q.name', FB.name, ax, y + 166, 100) + X.wline(ax, y + 186, 108) + o.lab('q.contact', FB.contact, ax + 120, y + 166, aw - 120) + X.wline(ax + 120, y + 186, aw - 120);
    if(o.div) h += box(ax + aw + o.gap / 2, y + 4, 0, 178, o.div);
    FB.prompts.forEach(([k, t], i) => { const yy = y + 6 + i * 60;
      h += o.q('q.' + k, t, bx, yy, bw2) + X.wline(bx, yy + 26, bw2) + X.wline(bx, yy + 41, bw2) + X.wline(bx, yy + 56, bw2); });
    return h;
  };
  const stripe = (x, y, w, h, color) => box(x, y, w, h, `background:${color}`);
  // text on a flat dark/colour flood in colour, or plain ink in black and white
  const tone = (bw, c) => bw ? 'var(--ink)' : c;
  // the facts as short lines: "3 bedrooms", "2 full baths", "1,385 square feet"
  const factLines = L => facts(L).map(([, v, k]) => `${v} ${k.toLowerCase()}`);

  /* ================================ P02 POSTER ================================ */
  // Archivo 700 caps stacked huge on the dark field, the date big beside it, the house in a thin offset frame, a paper highlight box
  const A = "'Archivo',Helvetica,Arial,sans-serif";
  const p02Photo = (D, E, x, y, w, h) => {
    const c = E.bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    return box(x - 7, y - 7, w + 14, h + 14, `border:.9pt solid ${c};opacity:.85`) + ph(D, E, x, y, w, h);
  };
  const p02Num = (i, y, n, rh) => `<div class="num" style="left:36pt;top:${y + (rh - 24) / 2}pt;width:42pt;text-align:left;font:700 20pt/24pt ${A};letter-spacing:-.5pt;color:var(--main-on-paper)">${n}</div>`;

  L$['p02-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720;
    const on = tone(bw, 'var(--paper)'), ac = tone(bw, 'var(--accent-on-dark)');
    let h = bw ? box(m, 176, W, 0, 'border-top:4pt solid var(--ink)') : E.fl(0, 0, 792, 176, 'ltr', 'background:var(--dark)');
    h += p02Photo(D, E, 570, 30, 186, 124);
    h += X.line('oh.label', ev.label, m, 30, 320, 9.5, 8, '', `font-family:${A};font-weight:700;letter-spacing:3pt;text-transform:uppercase;color:${ac}`);
    h += X.line('title', 'Please', m - 1, 46, 330, 60, 40, '', `font-family:${A};font-weight:700;text-transform:uppercase;letter-spacing:-1.5pt;line-height:56pt;color:${on}`);
    h += X.line('title2', 'sign in', m - 1, 98, 330, 60, 40, '', `font-family:${A};font-weight:700;text-transform:uppercase;letter-spacing:-1.5pt;line-height:56pt;color:${ac}`);
    const cx = 384, cw = 166;
    if(dated){
      h += txt('oh.weekday', ev.weekday, cx, 32, cw, `font:700 9.5pt/1 ${A};letter-spacing:3pt;text-transform:uppercase;color:${ac}`);
      h += X.line('oh.date', `${ev.mon3} ${ev.day}`, cx, 46, cw, 38, 24, '', `font-family:${A};font-weight:700;text-transform:uppercase;letter-spacing:-.5pt;color:${on}`);
      h += X.line('oh.time', ev.time, cx, 94, cw, 12, 8, '', `font-family:${A};font-weight:700;color:${ac}`);
      h += box(cx, 116, cw, 0, `border-top:.8pt solid ${on};opacity:.4`);
      h += X.line('address', L.address, cx, 124, cw, 16, 10, '', `font-family:${A};font-weight:700;color:${on}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), cx, 146, cw, 8.5, 8, '', `font:400 8.5pt/1 ${A};letter-spacing:1.4pt;color:${on};opacity:.85`);
    } else {
      h += txt('welcome', 'Welcome to', cx, 32, cw, `font:700 9.5pt/1 ${A};letter-spacing:3pt;text-transform:uppercase;color:${ac}`);
      h += X.line('address', L.address, cx, 46, cw, 28, 14, '', `font-family:${A};font-weight:700;letter-spacing:-.4pt;color:${on}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), cx, 84, cw, 8.5, 8, '', `font:400 8.5pt/1 ${A};letter-spacing:1.4pt;color:${on};opacity:.85`);
      h += box(cx, 104, cw, 0, `border-top:.8pt solid ${on};opacity:.4`);
      factLines(L).forEach((t, i) => { h += txt(`fact.${i}`, t, cx, 114 + i * 14, cw, `font:400 10pt/1 ${A};color:${on}`); });
    }
    const mc = 'var(--ink)';
    h += rows(E, {x0: m, W, y0: 214, rh: 40, numW: 44, widths: [208, 196, 92, W - 44 - 208 - 196 - 92], ly: 186, lh: 20,
      ls: `font-family:${A};font-weight:700;font-size:8.5pt;letter-spacing:1.4pt;color:${mc};align-items:center`,
      num: (i, y, n) => p02Num(i, y, n, 40),
      sep: (i, y) => i === 6 ? box(m, y, W, 0, `border-top:2.5pt solid ${mc}`) : box(m, y, W, 0, 'border-top:.6pt solid var(--line)'),
      yn: `border:1.6pt solid ${mc};border-radius:0;color:${mc};font-family:${A}`, ynD: 18,
      vr: c => box(c.x, 218, 0, 7 * 40 - 8, 'border-left:.5pt solid var(--line)')});
    h += box(m, 210.5, W, 2.5, `background:${mc}`);
    h += bw ? box(m, 506, W, 0, 'border-top:2.5pt solid var(--ink)') : E.fl(0, 506, 792, 106, 'lrb', 'background:var(--dark)');
    h += foot1(D, [m, 520, W, 58], {dark: !bw});
    return h;
  };

  L$['p02-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, FB = null;
    const on = tone(bw, 'var(--paper)'), ac = tone(bw, 'var(--accent-on-dark)'), mc = 'var(--ink)';
    let h = bw ? box(m, 112, W, 0, 'border-top:4pt solid var(--ink)') : E.fl(0, 0, 612, 112, 'ltr', 'background:var(--dark)');
    h += p02Photo(D, E, 440, 28, 126, 76);
    h += X.line('oh.label', ev.label, m + 4, 24, 300, 9, 8, '', `font-family:${A};font-weight:700;letter-spacing:3pt;text-transform:uppercase;color:${ac}`);
    h += X.line('title', 'Your feedback', m + 3, 36, 360, 40, 24, '', `font-family:${A};font-weight:700;text-transform:uppercase;letter-spacing:-.8pt;line-height:42pt;color:${on}`);
    h += X.line('address', L.address, m + 4, 80, 150, 15, 10, '', `font-family:${A};font-weight:700;color:${on}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), m + 4, 98, 150, 8, 8, '', `font:400 8pt/1 ${A};letter-spacing:1.2pt;color:${on};opacity:.85`);
    h += X.line('oh.date', `${ev.long}`, m + 168, 82, 240, 10, 8, '', `font-family:${A};font-weight:700;letter-spacing:.3pt;color:${ac}`);
    h += X.line('oh.time', ev.time, m + 168, 96, 240, 10, 8, '', `font-family:${A};font-weight:700;color:${on}`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:700 8.5pt/1 ${A};letter-spacing:1.1pt;text-transform:uppercase;color:${mc}`);
    h += fbBody(D, E, {x: m + 8, y: 124, aw: 244, gap: 30, w: W - 16, lab,
      q: (slot, t, x, y, w) => X.line(slot, t, x, y, w, 10.5, 8, '', `font-family:${A};font-weight:700;color:${mc}`),
      pill: `border:1.4pt solid ${mc};border-radius:0;color:${mc};font:700 8.5pt/1 ${A};letter-spacing:.8pt`,
      dot: () => `border:1.4pt solid ${mc};border-radius:0;color:${mc};font:700 10.5pt/1 ${A}`, div: 'border-left:.5pt solid var(--line)'});
    h += bw ? box(m, 316, W, 0, 'border-top:2.5pt solid var(--ink)') : E.fl(0, 314, 612, 82, 'lrb', 'background:var(--dark)');
    h += foot1(D, [m, 322, W, 52], {dark: !bw});
    return h;
  };
  X.themes.p02 = libTheme;

  /* ================================ P04 SOFT GEOMETRY ================================ */
  // Urbanist on the dark brand field, slanted edges (never over the photo), an accent wedge holding the address, a sunburst
  const U = "'Urbanist',Helvetica,Arial,sans-serif";
  const sunburst = (cx, cy, r1, r2, n, color, w) => {
    let d = ''; for(let i = 0; i < n; i++){ const a = i * 2 * Math.PI / n; d += `M${(cx + r1 * Math.cos(a)).toFixed(1)} ${(cy + r1 * Math.sin(a)).toFixed(1)}L${(cx + r2 * Math.cos(a)).toFixed(1)} ${(cy + r2 * Math.sin(a)).toFixed(1)}`; }
    return `<svg class="abs" style="left:${cx - r2 - 2}pt;top:${cy - r2 - 2}pt;width:${2 * r2 + 4}pt;height:${2 * r2 + 4}pt" viewBox="${cx - r2 - 2} ${cy - r2 - 2} ${2 * r2 + 4} ${2 * r2 + 4}"><path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none"/></svg>`;
  };
  // a polygon block from (x, y) of size w x h; pts in pt relative to its corner
  const poly = (x, y, w, h, pts, style) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;clip-path:polygon(${pts});${style}"></div>`;

  const P04TY = -9.5;
  L$['p04-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36;
    const on = tone(bw, 'var(--on-dark)'), ac = tone(bw, 'var(--accent-on-dark)'), mc = 'var(--main-on-paper)', oa = tone(bw, 'var(--on-accent)');
    let h = '';
    if(!bw){
      h += E.fl(0, 0, 792, 150, 'ltr', 'background:var(--dark)');
      h += E.fl(0, 150, 792, 4, 'lr', 'background:var(--accent)');
      h += E.fl(0, 506, 792, 106, 'lrb', 'background:var(--dark)');
    } else {
      h += box(m, 149, 720, 0, 'border-top:3pt solid var(--ink)');
      h += box(m, 506, 720, 0, 'border-top:3pt solid var(--ink)');
    }
    const hy = E.home ? 9 : 0, TY = P04TY + hy; // centered in the bar; it shows from 18 pt down in the home file (owner 11/6)
    h += sunburst(262, 75 + hy, 14, 36, 16, ac, 2.4);
    // text group lifted so it sits centered in the bar, the g of "sign in" whole (owner 11/6)
    h += X.line('oh.label', ev.label, m, 24 + TY, 300, 10, 8, '', `font-family:${U};font-weight:600;letter-spacing:3.5pt;text-transform:uppercase;color:${on};opacity:.9`);
    h += X.line('title', 'Please', m - 1, 40 + TY, 170, 52, 34, '', `font-family:${U};font-weight:700;letter-spacing:-1pt;line-height:50pt;color:${on};padding-bottom:16pt;`);
    h += X.line('title2', 'sign in', m - 1, 86 + TY, 170, 52, 34, '', `font-family:${U};font-weight:700;letter-spacing:-1pt;line-height:50pt;color:${ac};padding-bottom:16pt;`);
    h += ph(D, E, 588, 19 + hy, 168, 112);
    // the slanted accent block in the header holds the date (broker), the address, the place and the facts
    const PX = 326, PW = 250, PY = 19 + hy, PH = 112, lean = 22, TX = PX + 46, tw = PW - 46 - 46;
    h += bw ? box(PX, PY, PW, PH, 'border:0;background:none') + `<div class="abs" style="left:${PX}pt;top:${PY}pt;width:${PW}pt;height:${PH}pt;clip-path:polygon(${lean}pt 0,100% 0,calc(100% - ${lean}pt) 100%,0 100%);background:var(--ink)"></div><div class="abs" style="left:${PX + 1.6}pt;top:${PY + 1.6}pt;width:${PW - 3.2}pt;height:${PH - 3.2}pt;clip-path:polygon(${lean}pt 0,100% 0,calc(100% - ${lean}pt) 100%,0 100%);background:#fff"></div>`
             : poly(PX, PY, PW, PH, `${lean}pt 0,100% 0,calc(100% - ${lean}pt) 100%,0 100%`, 'background:var(--accent)');
    const ink = bw ? 'var(--ink)' : oa;
    if(dated){
      h += txt('oh.weekday', ev.weekday, TX, PY + 10, tw, `font:700 9pt/1 ${U};letter-spacing:2.6pt;text-transform:uppercase;color:${ink}`);
      h += X.line('oh.date', `${ev.mon3} ${ev.day}`, TX, PY + 22, tw, 30, 18, '', `font-family:${U};font-weight:700;color:${ink}`);
      h += X.line('oh.time', ev.time, TX, PY + 60, tw, 11, 8, '', `font-family:${U};font-weight:700;color:${ink}`);
      h += X.line('address', L.address, TX, PY + 78, tw, 15, 10, '', `font-family:${U};font-weight:700;color:${ink}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), TX, PY + 98, tw, 8.5, 8, '', `font:600 8.5pt/1 ${U};letter-spacing:1.4pt;color:${ink}`);
    } else {
      h += txt('welcome', 'Welcome to', TX, PY + 10, tw, `font:700 9pt/1 ${U};letter-spacing:2.6pt;text-transform:uppercase;color:${ink}`);
      h += X.line('address', L.address, TX, PY + 24, tw, 22, 12, '', `font-family:${U};font-weight:700;color:${ink}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), TX, PY + 54, tw, 8.5, 8, '', `font:600 8.5pt/1 ${U};letter-spacing:1.4pt;color:${ink}`);
      factLines(L).forEach((t, i) => { h += txt(`fact.${i}`, t.toUpperCase(), TX, PY + 74 + i * 13, tw, `font:600 8.5pt/1 ${U};letter-spacing:1.6pt;color:${ink}`); });
    }
    // the rows: soft cards with round numerals, the full width of the sheet
    const x0 = m, W = 720, rh = 44, y0 = 188, wd = [214, 220, 84, W - 38 - 214 - 220 - 84];
    const cs = cols(x0, 38, wd);
    h += rows(E, {x0, W, y0, rh, numW: 38, widths: wd, ly: 160, lh: 24,
      ls: `font-family:${U};font-weight:700;font-size:8.5pt;letter-spacing:1.2pt;color:${mc};align-items:flex-end`,
      row: (i, y) => box(x0, y + 3, W, rh - 6, `border-radius:9pt;background:var(--tint);border:.7pt solid var(--line)`) + cs.slice(1).map(c => box(c.x, y + 10, 0, rh - 20, 'border-left:.6pt solid var(--line)')).join(''),
      num: (i, y, n) => `<div class="abs" style="left:${x0 + 9}pt;top:${y + (rh - 22) / 2}pt;width:22pt;height:22pt;border-radius:50%;${bw ? 'border:1.1pt solid var(--ink)' : 'background:var(--main)'};color:${bw ? 'var(--ink)' : 'var(--on-main)'};font:700 11pt/22pt ${U};text-align:center">${n}</div>`,
      sep: () => '', yn: `border:1.1pt solid ${mc};color:${mc};font-family:${U};background:#fff`, ynD: 18});
    h += foot1(D, [m, 520, 720, 58], {dark: !bw});
    return h;
  };

  L$['p04-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, e = edge(E);
    const on = tone(bw, 'var(--on-dark)'), ac = tone(bw, 'var(--accent-on-dark)'), mc = 'var(--main-on-paper)';
    let h = '';
    if(!bw){
      h += poly(e, e, 612 - 2 * e, 112 - e, `0 0,100% 0,100% ${84 - e}pt,0 ${106 - e}pt`, 'background:var(--dark)');
      h += poly(e, 90, 612 - 2 * e, 24, `0 ${16}pt,100% 0,100% ${4}pt,0 ${20}pt`, 'background:var(--accent)');
      h += poly(e, 306, 612 - 2 * e, 90 - e, `0 10pt,100% 0,100% 100%,0 100%`, 'background:var(--dark)');
    } else {
      h += `<div class="abs" style="left:${m}pt;top:106pt;width:556pt;height:0;border-top:2.4pt solid var(--ink);transform-origin:0 0;transform:rotate(-2.3deg)"></div>`;
      h += `<div class="abs" style="left:${m}pt;top:314pt;width:556pt;height:0;border-top:2.4pt solid var(--ink);transform-origin:0 0;transform:rotate(-1deg)"></div>`;
    }
    h += sunburst(430, 48, 10, 28, 16, ac, 2);
    h += ph(D, E, 482, 20, 102, 68);
    h += X.line('oh.label', ev.label, m + 4, 18 + (E.home ? 8 : 0), 260, 9, 8, '', `font-family:${U};font-weight:600;letter-spacing:3pt;text-transform:uppercase;color:${on};opacity:.9`);
    h += X.line('title', 'Your feedback', m + 3, 34, 300, 36, 22, '', `font-family:${U};font-weight:700;letter-spacing:-.6pt;line-height:38pt;color:${on}`);
    h += X.line('address', L.address, m + 4, 72, 140, 13, 10, '', `font-family:${U};font-weight:700;color:${on}`);
    h += X.line('oh.date', `${ev.long}  ·  ${ev.time}`, m + 156, 76, 290, 9, 8, '', `font:600 9pt/1 ${U};letter-spacing:.6pt;color:${ac}`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:700 8.5pt/1 ${U};letter-spacing:1pt;text-transform:uppercase;color:${mc}`);
    h += fbBody(D, E, {x: m + 8, y: 117, aw: 240, gap: 32, w: W - 16, lab,
      q: (slot, t, x, y, w) => X.line(slot, t, x, y, w, 10.5, 8, '', `font-family:${U};font-weight:700;color:var(--ink)`),
      pill: `border:1.1pt solid ${bw ? 'var(--ink)' : 'var(--accent)'};border-radius:10pt;background:var(--tint);color:${mc};font:700 8.5pt/1 ${U};letter-spacing:.5pt`,
      dot: () => `border:1.1pt solid ${bw ? 'var(--ink)' : 'var(--main)'};background:#fff;color:${mc};font:700 10.5pt/1 ${U}`,
      div: `border-left:.6pt solid var(--line);transform:skewX(-4deg)`});
    h += foot1(D, [m, 322, W, 52], {dark: !bw});
    return h;
  };
  X.themes.p04 = libTheme;

  /* ================================ P05 ROUNDED FRAME ================================ */
  // rounded outline boxes in the main color frame each part; facts and the event as pills; Lexend
  const R = "'Lexend',Helvetica,Arial,sans-serif";
  const rbox = (x, y, w, h, r, E) => box(x, y, w, h, `border:1.6pt solid ${E.bw ? 'var(--ink)' : 'var(--main-on-paper)'};border-radius:${r}pt;background:#fff`);
  const pill5 = (E, slot, t, x, y, w, hgt, sz, style) => box(x, y, w, hgt, `border:1.3pt solid ${E.bw ? 'var(--ink)' : 'var(--main-on-paper)'};border-radius:99pt`) +
    X.line(slot, t, x + 10, y + (hgt - sz * 1.2) / 2, w - 20, sz, 8, '', `font-family:${R};font-weight:500;text-align:center;color:var(--ink);${style || ''}`);

  const P05TY = 28;
  L$['p05-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720;
    const mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = rbox(m, 24, W, 104, 18, E) + ph(D, E, m + 14, 36, 136, 80, 'border-radius:10pt');
    h += X.line('title', 'Please sign in', 206, P05TY, 520, 50, 30, '', `font-family:${R};font-weight:600;letter-spacing:-1.5pt;text-align:center;line-height:54pt;color:${mc};padding-bottom:16pt;`); // g whole (owner 11/6)
    const px = 198, pw = 540;
    const items = dated ? [['oh.date', ev.long], ['oh.time', ev.time], ['address', L.address]] : [['address', L.address], ...factLines(L).map((t, i) => ['fact.' + i, t.replace(/^\d/, c => c).replace(/\b\w/g, c => c.toUpperCase())])];
    const gp = 10, n = items.length, iw = (pw - gp * (n - 1)) / n;
    items.forEach(([slot, t], i) => { h += pill5(E, slot, t, px + i * (iw + gp), 94, iw, 26, 10); });
    h += rbox(m, 140, W, 366, 18, E);
    const x0 = m + 16, WW = W - 32, rh = 44, y0 = 172;
    h += rows(E, {x0, W: WW, y0, rh, numW: 40, widths: [210, 192, 96, WW - 40 - 210 - 192 - 96], ly: 150, lh: 20,
      ls: `font-family:${R};font-weight:600;font-size:8.5pt;letter-spacing:.2pt;color:${mc};align-items:center`,
      num: (i, y, n) => `<div class="abs" style="left:${x0 + 6}pt;top:${y + (rh - 26) / 2}pt;width:26pt;height:26pt;border-radius:50%;border:1.3pt solid ${mc};font:600 11.5pt/23pt ${R};text-align:center;color:${mc}">${n}</div>`,
      sep: (i, y) => i === 6 ? '' : box(x0, y, WW, 0, 'border-top:.6pt solid var(--line)'),
      yn: `border:1.3pt solid ${mc};color:${mc};font-family:${R}`, ynD: 20,
      vr: c => box(c.x, y0 + 6, 0, 7 * rh - 12, 'border-left:.6pt solid var(--line)')});
    h += box(x0, y0 - 1, WW, 0, `border-top:1.3pt solid ${mc}`);
    h += foot1(D, [m, 516, W, 56], {dark: false});
    return h;
  };

  L$['p05-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = rbox(m, 20, W, 76, 16, E) + ph(D, E, m + 10, 29, 92, 58, 'border-radius:8pt');
    h += X.line('title', 'Your feedback', m + 116, 26, 250, 34, 20, '', `font-family:${R};font-weight:600;letter-spacing:-.8pt;line-height:34pt;color:${mc}`);
    h += X.line('address', L.address, m + 116, 62, 200, 14, 10, '', `font-family:${R};font-weight:600;color:var(--ink)`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, m + 116, 79, 330, 9, 8, '', `font:400 9pt/1 ${R};color:var(--muted)`);
    h += pill5(E, 'oh.label', ev.label, m + W - 150, 30, 136, 24, 9);
    h += rbox(m, 104, W, 202, 16, E);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:600 8.5pt/1 ${R};letter-spacing:.2pt;color:${mc}`);
    h += fbBody(D, E, {x: m + 16, y: 111, aw: 238, gap: 30, w: W - 32, lab,
      q: (slot, t, x, y, w) => X.line(slot, t, x, y, w, 10, 8, '', `font-family:${R};font-weight:600;color:var(--ink)`),
      pill: `border:1.2pt solid ${mc};border-radius:99pt;color:${mc};font:500 8pt/1 ${R};text-transform:none;letter-spacing:0;white-space:nowrap`,
      dot: () => `border:1.2pt solid ${mc};background:#fff;color:${mc};font:500 10.5pt/1 ${R}`, div: 'border-left:.6pt solid var(--line)'});
    h += foot1(D, [m, 316, W, 54], {dark: false});
    return h;
  };
  X.themes.p05 = libTheme;

  /* ================================ P06 WARM COLLAGE ================================ */
  // a warm tint of the main color for the page, main-color blocks, the accent date block, Bitter over Schibsted Grotesk
  const BT = "'Bitter',Georgia,serif", SG = "'Schibsted Grotesk',Helvetica,Arial,sans-serif";
  const p06Date = (E, ev, x, y, w, hgt, big) => {
    const oa = tone(E.bw, 'var(--on-accent)');
    return box(x, y, w, hgt, E.bw ? 'border:1.2pt solid var(--ink)' : 'background:var(--accent)') +
      txt('oh.weekday', ev.weekday, x + 6, y + (big ? 10 : 8), w - 12, `text-align:center;font:700 ${big ? 10 : 8}pt/1 ${SG};letter-spacing:2.2pt;text-transform:uppercase;color:${oa}`) +
      X.line('oh.date', `${ev.mon3} ${ev.day}`, x + 6, y + (big ? 24 : 19), w - 12, big ? 30 : 22, 16, '', `text-align:center;font-family:${BT};font-weight:700;color:${oa}`) +
      X.line('oh.time', ev.time, x + 6, y + (big ? 66 : 46), w - 12, big ? 12 : 9, 8, '', `text-align:center;font-family:${SG};font-weight:600;color:${oa}`);
  };
  const p06Tint = (D, E) => { const c = (D.brand || {}).colors || {}; return mixOf(c.main || '#8c4a2a', '#f6efe6', .82); };

  L$['p06-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 28, W = 736;
    const onm = tone(bw, 'var(--on-main)'), oa = tone(bw, 'var(--on-accent)'), mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = bw ? '' : E.fl(0, 0, 792, 612, 'ltrb', `background:${p06Tint(D, E)}`);
    h += ph(D, E, m, 28, 232, 154);
    const bx = m + 232 + 8, bw2 = 792 - m - bx;
    h += box(bx, 28, bw2, 154, bw ? 'border:1.2pt solid var(--ink)' : 'background:var(--main)');
    h += X.line('oh.label', ev.label, bx + 14, 44, bw2 - 28 - 130, 9.5, 8, '', `font-family:${SG};font-weight:500;letter-spacing:2.6pt;text-transform:uppercase;color:${onm}`);
    h += X.line('title', 'Please', bx + 14, 62, 300, 44, 28, '', `font-family:${BT};font-weight:700;text-transform:uppercase;line-height:44pt;color:${onm}`);
    h += X.line('title2', 'sign in', bx + 14, 104, 300, 44, 28, '', `font-family:${BT};font-weight:700;text-transform:uppercase;line-height:44pt;color:${onm}`);
    const dx = bx + bw2 - 14 - 148;
    if(dated){
      h += p06Date(E, ev, dx, 42, 148, 98, true);
      h += X.line('address', L.address, dx, 150, 148, 13, 9, '', `text-align:center;font-family:${BT};font-weight:700;color:${onm}`);
    } else {
      h += box(dx, 42, 148, 98, bw ? 'border:1.2pt solid var(--ink)' : 'background:var(--accent)');
      h += txt('welcome', 'Welcome to', dx + 6, 54, 136, `text-align:center;font:700 9pt/1 ${SG};letter-spacing:2.2pt;text-transform:uppercase;color:${oa}`);
      h += X.line('address', L.address, dx + 8, 72, 132, 21, 12, '', `text-align:center;font-family:${BT};font-weight:700;color:${oa}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), dx + 8, 100, 132, 8.5, 8, '', `text-align:center;font:500 8.5pt/1 ${SG};letter-spacing:1.2pt;color:${oa}`);
      h += X.line('facts', factLines(L).map(t => t.replace(' bedrooms', ' bd').replace(' full baths', ' ba').replace(' square feet', ' sq ft')).join('  ·  '), dx + 8, 118, 132, 9, 8, '', `text-align:center;font:500 9pt/1 ${SG};color:${oa}`);
    }
    // the writing block: a white panel with an accent edge, banded rows
    const top = 196, bot = 504;
    h += box(m, top, W, bot - top, `background:#fff;border:${bw ? '1.2pt solid var(--ink)' : '1.1pt solid var(--accent)'}`);
    const x0 = m + 14, WW = W - 28, rh = 38, y0 = top + 34;
    h += rows(E, {x0, W: WW, y0, rh, numW: 36, widths: [214, 200, 96, WW - 36 - 214 - 200 - 96], ly: top + 10, lh: 20,
      ls: `font-family:${SG};font-weight:700;font-size:8.5pt;letter-spacing:1.2pt;text-transform:uppercase;color:${mc};align-items:center`,
      row: (i, y) => i % 2 === 0 ? `<div class="rowband" style="left:${x0}pt;top:${y}pt;width:${WW}pt;height:${rh}pt;background:var(--tint)"></div>` : '',
      num: (i, y, n) => box(x0 + 5, y + (rh - 22) / 2, 22, 22, `${bw ? 'border:1.1pt solid var(--ink)' : 'background:var(--main)'}`) + `<div class="abs" style="left:${x0 + 5}pt;top:${y + (rh - 22) / 2}pt;width:22pt;height:22pt;text-align:center;font:700 11.5pt/22pt ${BT};color:${onm.replace('var(--on-main)', 'var(--on-main)')}">${n}</div>`,
      sep: (i, y) => box(x0, y, WW, 0, 'border-top:.5pt solid var(--line)'), yn: `border:1.1pt solid ${mc};color:${mc};font-family:${SG};background:#fff;border-radius:3pt`, ynD: 18,
      vr: c => box(c.x, y0 + 6, 0, 7 * rh - 12, 'border-left:.5pt solid var(--line)')});
    h += box(x0, y0 - 1, WW, 0, `border-top:1.4pt solid ${bw ? 'var(--ink)' : 'var(--accent)'}`);
    h += foot1(D, [m + 8, 514, W - 16, 58], {dark: false});
    return h;
  };

  L$['p06-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556;
    const onm = tone(bw, 'var(--on-main)'), mc = bw ? 'var(--ink)' : 'var(--main-on-paper)', dy = E.home ? 6 : 0;
    let h = bw ? '' : E.fl(0, 0, 612, 396, 'ltrb', `background:${p06Tint(D, E)}`);
    h += ph(D, E, m, 24 + dy, 138, 80 - dy);
    const bx = m + 138 + 6, bw2 = 612 - m - bx;
    h += box(bx, 24 + dy, bw2, 80 - dy, bw ? 'border:1.2pt solid var(--ink)' : 'background:var(--main)');
    h += X.line('oh.label', ev.label, bx + 12, 32 + dy, 200, 8, 8, '', `font-family:${SG};font-weight:500;letter-spacing:2.2pt;text-transform:uppercase;color:${onm}`);
    h += X.line('title', 'Your feedback', bx + 12, 40 + dy, 250, 30, 18, '', `font-family:${BT};font-weight:700;text-transform:uppercase;line-height:32pt;color:${onm}`);
    h += X.line('address', L.address, bx + 12, 76 + dy, 150, 13, 9, '', `font-family:${BT};font-weight:700;color:${onm}`);
    h += p06Date(E, ev, 612 - m - 10 - 104, 32 + dy, 104, 64 - dy, false);
    h += box(m, 110, W, 202, `background:#fff;border:${bw ? '1.2pt solid var(--ink)' : '1.1pt solid var(--accent)'}`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:700 8.5pt/1 ${SG};letter-spacing:1pt;text-transform:uppercase;color:${mc}`);
    h += fbBody(D, E, {x: m + 14, y: 119, aw: 232, gap: 28, w: W - 28, lab,
      q: (slot, t, x, y, w) => X.line(slot, t, x, y, w, 10, 8, '', `font-family:${BT};font-weight:700;color:var(--ink)`),
      pill: `border:1.1pt solid ${bw ? 'var(--ink)' : 'var(--accent)'};border-radius:3pt;background:var(--tint);color:${mc};font:700 8pt/1 ${SG};letter-spacing:.4pt;text-transform:none;white-space:nowrap`,
      dot: () => `border:1.1pt solid ${bw ? 'var(--ink)' : 'var(--main)'};border-radius:3pt;background:var(--tint);color:${mc};font:700 10.5pt/1 ${BT}`, div: 'border-left:.5pt solid var(--line)'});
    h += foot1(D, [m + 6, 320, W - 12, 52], {dark: false});
    return h;
  };
  X.themes.p06 = libTheme;

  /* ================================ P08 ARCHITECT ================================ */
  // stone-gray field, Baskerville capitals, thin drafting rules, corner ticks around the house photo and the writing area
  const BK = "'Libre Baskerville',Georgia,serif", IS = "'Instrument Sans',Helvetica,Arial,sans-serif";
  const ticks = (x, y, w, hgt, c, n) => { n = n || 10; const t = 1; return [[x - 7, y - 7, `border-top:${t}pt solid ${c};border-left:${t}pt solid ${c}`], [x + w - n + 7, y - 7, `border-top:${t}pt solid ${c};border-right:${t}pt solid ${c}`], [x - 7, y + hgt - n + 7, `border-bottom:${t}pt solid ${c};border-left:${t}pt solid ${c}`], [x + w - n + 7, y + hgt - n + 7, `border-bottom:${t}pt solid ${c};border-right:${t}pt solid ${c}`]].map(([a, b, st]) => box(a, b, n, n, st)).join(''); };
  const grayOf = D => { const c = (D.brand || {}).colors || {}; return mixOf(c.dark || '#2e3236', '#d9d6cf', .06); };

  L$['p08-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720;
    const on = tone(bw, '#fff'), ink = 'var(--ink)';
    let h = bw ? box(m, 148, W, 0, 'border-top:1.2pt solid var(--ink)') : E.fl(0, 0, 792, 148, 'ltr', `background:${grayOf(D)}`);
    h += ph(D, E, 590, 28, 166, 102);
    h += ticks(590, 28, 166, 102, bw ? 'var(--ink)' : '#fff');
    h += X.line('oh.label', ev.label, m + 2, 24, 400, 10, 8, '', `font-family:${IS};font-weight:500;letter-spacing:3.2pt;text-transform:uppercase;color:${on}`);
    h += X.line('title', 'Please sign in', m, 40, 520, 52, 28, '', `font-family:${BK};font-weight:700;text-transform:uppercase;letter-spacing:-1pt;color:${on}`);
    h += box(m + 2, 104, 520, 0, `border-top:.7pt solid ${on};opacity:.5`);
    if(dated){
      h += X.line('oh.date', ev.long, m + 2, 112, 250, 16, 11, '', `font-family:${BK};color:${on}`);
      h += X.line('oh.time', ev.time, m + 2, 130, 250, 10, 8, '', `font-family:${IS};font-weight:600;color:${on}`);
      h += X.line('address', L.address, m + 280, 112, 242, 16, 11, '', `text-align:right;font-family:${BK};color:${on}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), m + 280, 131, 242, 8.5, 8, '', `text-align:right;font:500 8.5pt/1 ${IS};letter-spacing:1.4pt;color:${on}`);
    } else {
      h += X.line('address', L.address, m + 2, 112, 250, 16, 11, '', `font-family:${BK};color:${on}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), m + 2, 131, 250, 8.5, 8, '', `font:500 8.5pt/1 ${IS};letter-spacing:1.4pt;color:${on}`);
      h += X.line('facts', factLines(L).join('  ·  '), m + 262, 118, 260, 10, 8, '', `text-align:right;font:500 9.5pt/1 ${IS};color:${on}`);
    }
    const x0 = m, WW = W, rh = 40, y0 = 204;
    h += rows(E, {x0, W: WW, y0, rh, numW: 40, widths: [208, 196, 96, WW - 40 - 208 - 196 - 96], ly: 172, lh: 24,
      ls: `font-family:${IS};font-weight:600;font-size:8.5pt;letter-spacing:1.4pt;text-transform:uppercase;color:${ink};align-items:center`,
      num: (i, y, n) => `<div class="num" style="left:${x0}pt;top:${y + (rh - 18) / 2}pt;width:40pt;font:400 13pt/18pt ${BK};color:${ink}">${n}</div>`,
      sep: (i, y) => box(x0, y, WW, 0, `border-top:${i === 6 ? 1.2 : .7}pt solid ${i === 6 ? ink : 'var(--line)'}`),
      yn: `border:1pt solid ${ink};border-radius:0;color:${ink};font-family:${IS}`, ynD: 17,
      vr: c => box(c.x, y0, 0, 7 * rh, 'border-left:.6pt solid var(--line)')});
    h += box(x0, y0 - 1, WW, 0, `border-top:1.2pt solid ${ink}`);
    h += ticks(x0, 168, WW, 7 * rh + 54, ink);
    h += bw ? box(m, 512, W, 0, 'border-top:1.2pt solid var(--ink)') : E.fl(0, 512, 792, 100, 'lrb', `background:${grayOf(D)}`);
    h += foot1(D, [m, 522, W, 58], {dark: !bw});
    return h;
  };

  L$['p08-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, dy = E.home ? 6 : 0;
    const on = tone(bw, '#fff'), ink = 'var(--ink)';
    let h = bw ? box(m, 100, W, 0, 'border-top:1.2pt solid var(--ink)') : E.fl(0, 0, 612, 100, 'ltr', `background:${grayOf(D)}`);
    const py = 18 + (E.home ? 9 : 0);   // home file: the corner ticks (7 pt out) stay inside the band, clear of the white margin (11/13)
    h += ph(D, E, 468, py, 100, 84 - py);
    h += ticks(468, py, 100, 84 - py, bw ? 'var(--ink)' : '#fff', 8);
    h += X.line('oh.label', ev.label, m + 2, 20 + dy, 300, 9, 8, '', `font-family:${IS};font-weight:500;letter-spacing:3pt;text-transform:uppercase;color:${on}`);
    h += X.line('title', 'Your feedback', m, 34 + dy, 400, 34, 18, '', `font-family:${BK};font-weight:700;text-transform:uppercase;letter-spacing:-.6pt;color:${on}`);
    h += X.line('address', L.address, m + 2, 72 + dy, 150, 12, 9, '', `font-family:${BK};color:${on}`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, m + 164, 74 + dy, 270, 9, 8, '', `font:500 9pt/1 ${IS};letter-spacing:.4pt;color:${on}`);
    h += box(m + 2, 118, W - 4, 186, 'background:#fff;border:.8pt solid var(--ink)');
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:600 8.5pt/1 ${IS};letter-spacing:1.2pt;text-transform:uppercase;color:${ink}`);
    h += fbBody(D, E, {x: m + 16, y: 114 + 6, aw: 236, gap: 28, w: W - 28, lab,
      q: (slot, t, x, y, w) => X.line(slot, t, x, y, w, 10, 8, '', `font-family:${BK};color:${ink}`),
      pill: `border:.9pt solid ${ink};border-radius:0;color:${ink};font:600 8pt/1 ${IS};letter-spacing:.5pt;text-transform:none;white-space:nowrap`,
      dot: () => `border:.9pt solid ${ink};border-radius:0;color:${ink};font:400 11pt/1 ${BK}`, div: 'border-left:.6pt solid var(--line)'});
    h += bw ? box(m, 314, W, 0, 'border-top:1.2pt solid var(--ink)') : E.fl(0, 312, 612, 84, 'lrb', `background:${grayOf(D)}`);
    h += foot1(D, [m, 322, W, 52], {dark: !bw});
    return h;
  };
  X.themes.p08 = libTheme;

  /* ================================ P10 CHARCOAL CLASSIC ================================ */
  // the house photo at the top-left of a charcoal field, centered Crimson Pro capitals, a thin accent rule, Jost details
  const CP = "'Crimson Pro',Georgia,serif", JO = "'Jost',Helvetica,Arial,sans-serif";

  L$['p10-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720, e = edge(E);
    const on = tone(bw, 'var(--on-dark)'), ac = tone(bw, 'var(--accent-on-dark)'), ink = 'var(--ink)';
    let h = bw ? box(m, 172, W, 0, 'border-top:2.4pt solid var(--ink)') : E.fl(0, 0, 792, 172, 'ltr', 'background:var(--dark)');
    h += ph(D, E, e, e, 258 - e, 172 - e - (bw ? 12 : 0));
    const cx = 282, cw = 792 - 36 - cx;
    h += X.line('oh.label', ev.label, cx, 26, cw, 10, 8, '', `text-align:center;font-family:${JO};font-weight:500;letter-spacing:4pt;text-transform:uppercase;color:${ac}`);
    h += X.line('title', 'Please sign in', cx, 42, cw, 46, 28, '', `text-align:center;font-family:${CP};font-weight:600;letter-spacing:3pt;text-transform:uppercase;line-height:50pt;color:${on}`);
    h += box(cx + cw / 2 - 90, 98, 180, 0, `border-top:1pt solid ${ac}`);
    if(dated){
      h += X.line('oh.date', ev.long, cx, 108, cw, 22, 14, '', `text-align:center;font-family:${CP};font-weight:500;color:${on}`);
      h += X.line('oh.time', ev.time, cx, 134, cw, 11, 8, '', `text-align:center;font-family:${JO};font-weight:500;letter-spacing:1pt;color:${ac}`);
      h += X.line('address', `${L.address}, ${X.cityZip(L)}`, cx, 152, cw, 10, 8, '', `text-align:center;font-family:${JO};font-weight:500;letter-spacing:.6pt;color:${on}`);
    } else {
      h += txt('welcome', 'Welcome to', cx, 108, cw, `text-align:center;font:500 10pt/1 ${JO};letter-spacing:3.5pt;text-transform:uppercase;color:${ac}`);
      h += X.line('address', L.address, cx, 124, cw, 22, 14, '', `text-align:center;font-family:${JO};font-weight:500;color:${on}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), cx, 152, cw, 9, 8, '', `text-align:center;font:400 9pt/1 ${JO};letter-spacing:2pt;color:${on};opacity:.85`);
    }
    const x0 = m, rh = 40, y0 = 214;
    h += rows(E, {x0, W, y0, rh, numW: 40, widths: [208, 196, 96, W - 40 - 208 - 196 - 96], ly: 182, lh: 24,
      ls: `font-family:${JO};font-weight:500;font-size:8.5pt;letter-spacing:1.6pt;text-transform:uppercase;color:${ink};align-items:center`,
      num: (i, y, n) => `<div class="num" style="left:${x0}pt;top:${y + (rh - 24) / 2}pt;width:40pt;font:500 18pt/24pt ${CP};color:${bw ? 'var(--ink)' : 'var(--accent-on-paper)'}">${n}</div>`,
      sep: (i, y) => box(x0, y, W, 0, 'border-top:.6pt solid var(--line)'),
      yn: `border:.9pt solid ${ink};color:${ink};font-family:${JO}`, ynD: 18,
      vr: c => box(c.x, y0 + 6, 0, 7 * rh - 12, 'border-left:.5pt solid var(--line)')});
    h += box(x0, y0 - 1, W, 0, `border-top:1.2pt solid ${bw ? ink : 'var(--accent)'}`);
    h += box(x0, y0 + 7 * rh, W, 0, `border-top:1.2pt solid ${bw ? ink : 'var(--accent)'}`);
    h += bw ? '' : E.fl(0, 510, 792, 102, 'lrb', 'background:var(--dark)');
    h += foot1(D, [m, 522, W, 58], {dark: !bw});
    return h;
  };

  L$['p10-feedback'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), bw = E.bw, m = 28, W = 556, e = edge(E);
    const on = tone(bw, 'var(--on-dark)'), ac = tone(bw, 'var(--accent-on-dark)'), ink = 'var(--ink)';
    let h = bw ? box(m, 114, W, 0, 'border-top:2.4pt solid var(--ink)') : E.fl(0, 0, 612, 114, 'ltr', 'background:var(--dark)');
    h += ph(D, E, e, e, 168 - e, 114 - e - (bw ? 12 : 0));
    const cx = 186, cw = 612 - 28 - cx;
    h += X.line('oh.label', ev.label, cx, 16 + (E.home ? 6 : 0), cw, 9, 8, '', `text-align:center;font-family:${JO};font-weight:500;letter-spacing:3.5pt;text-transform:uppercase;color:${ac}`);
    h += X.line('title', 'Your feedback', cx, 31, cw, 30, 20, '', `text-align:center;font-family:${CP};font-weight:600;letter-spacing:2.4pt;text-transform:uppercase;line-height:32pt;color:${on}`);
    h += box(cx + cw / 2 - 70, 66, 140, 0, `border-top:1pt solid ${ac}`);
    h += X.line('address', L.address, cx, 76, cw, 12, 9, '', `text-align:center;font-family:${JO};font-weight:500;color:${on}`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, cx, 92, cw, 9, 8, '', `text-align:center;font:500 9pt/1 ${JO};letter-spacing:.6pt;color:${ac}`);
    h += box(m, 122, W, 190, `background:#fff;border:${bw ? '.9pt solid var(--ink)' : '1pt solid var(--accent)'}`);
    const lab = (slot, t, x, y, w) => txt(slot, t, x, y, w, `font:500 8.5pt/1 ${JO};letter-spacing:1.4pt;text-transform:uppercase;color:${ink}`);
    h += fbBody(D, E, {x: m + 14, y: 125, aw: 238, gap: 28, w: W - 28, lab,
      q: (slot, t, x, y, w) => X.line(slot, t, x, y, w, 11.5, 8, '', `font-family:${CP};font-weight:600;color:${ink}`),
      pill: `border:1pt solid ${bw ? ink : 'var(--accent)'};border-radius:2pt;color:${ink};font:500 8pt/1 ${JO};letter-spacing:.6pt;text-transform:none;white-space:nowrap`,
      dot: () => `border:1pt solid ${bw ? ink : 'var(--accent)'};background:var(--tint);color:${ink};font:500 11pt/1 ${CP}`, div: 'border-left:.5pt solid var(--line)'});
    h += bw ? '' : E.fl(0, 319, 612, 77, 'lrb', 'background:var(--dark)');
    h += foot1(D, [m, 325, W, 50], {dark: !bw});
    return h;
  };
  X.themes.p10 = libTheme;

})();
