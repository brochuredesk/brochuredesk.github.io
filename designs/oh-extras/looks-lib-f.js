/* Open House extras for library flyers, batch f (owner 11/2/2026: roll the sign-in sheet and broker feedback card out to every
   library flyer). Each look takes its flyer's fonts, palette roles, ornaments and layout language, and the agent's brand kit.
     P39 Black Rules     white page, heavy black rules above and below every band, Red Hat Display caps over Libre Franklin,
                         the main color only for the time and the small labels; square marks.
     P45 Civic Diagonal  a dark slab with a slanted foot at the top right, the house cut on the same slant beside it; Jost caps.
                         The slant lives only in the header, well clear of every line of text and write-in line.
     P49 Arc             a cream field, the photo's foot swept in a curve with a gold hairline under it, Spectral over Jost,
                         a dark rounded-corner band holding the footer.
     P50 Crosscut        a dark band with a slanted foot at the top and an opposing slant at the bottom, a gold stripe on each,
                         Epilogue and Crimson Pro.
     P51 Marquee         a poster-scale Anton headline on the main color, a dark box with the date, a main-color foot band,
                         Work Sans.
   Rules (the brief docs/briefs/oh-extras-library-rollout.md): public sign-in sheets carry no date or time, broker sheets and
   feedback cards keep them; black-and-white versions get the light grayscale photo and no color; footer #1 on every card, on
   the dark field where the look has one; print-at-home files stop color at the 18 pt margin (edge(E)). */
(function(){
  const X = Extras, L$ = X.looks, {cols, labels, qs, box, txt, ph, foot1, edge, facts} = X.lib;
  ['p39', 'p45', 'p49', 'p50', 'p51'].forEach(s => X.themes[s] = X.lib.libTheme);
  const factLine = L => facts(L).map(([i, v, k]) => `${v} ${k}`).join('   ·   ');

  /* ---- geometry helpers ---- */
  // a slab from the top down to a slanted foot (y at its left edge yl, at its right edge yr)
  const slab = (x, top, w, yl, yr, style) => `<div class="abs" style="left:${x}pt;top:${top}pt;width:${w}pt;height:${Math.max(yl, yr) - top}pt;${style};clip-path:polygon(0 0,${w}pt 0,${w}pt ${yr - top}pt,0 ${yl - top}pt)"></div>`;
  // a slanted stripe t pt thick whose top edge runs from yl (left) to yr (right)
  const sband = (x, w, yl, yr, t, style) => { const top = Math.min(yl, yr), hg = Math.abs(yl - yr) + t;
    return `<div class="abs" style="left:${x}pt;top:${top}pt;width:${w}pt;height:${hg}pt;${style};clip-path:polygon(0 ${yl - top}pt,${w}pt ${yr - top}pt,${w}pt ${yr - top + t}pt,0 ${yl - top + t}pt)"></div>`; };
  // a block from a slanted top edge down to y = bottom
  const slabBelow = (x, w, yl, yr, bottom, style) => { const top = Math.min(yl, yr), hg = bottom - top;
    return `<div class="abs" style="left:${x}pt;top:${top}pt;width:${w}pt;height:${hg}pt;${style};clip-path:polygon(0 ${yl - top}pt,${w}pt ${yr - top}pt,${w}pt ${hg}pt,0 ${hg}pt)"></div>`; };
  const lineY = (x, x0, yl, x1, yr) => yl + (yr - yl) * (x - x0) / (x1 - x0);
  // a curved strip along points
  const strip = (pts, t, style) => { const x0 = pts[0][0], x1 = pts[pts.length - 1][0], top = Math.min(...pts.map(p => p[1])), bot = Math.max(...pts.map(p => p[1])) + t;
    const up = pts.map(p => `${(p[0] - x0).toFixed(2)}pt ${(p[1] - top).toFixed(2)}pt`), dn = pts.slice().reverse().map(p => `${(p[0] - x0).toFixed(2)}pt ${(p[1] - top + t).toFixed(2)}pt`);
    return `<div class="abs" style="left:${x0}pt;top:${top}pt;width:${x1 - x0}pt;height:${bot - top}pt;${style};clip-path:polygon(${up.concat(dn).join(',')})"></div>`; };

  /* ---- the writing area (sign-in) and the question body (feedback), shared; each look passes its own type and marks ---- */
  const signRows = (D, E, o) => {
    const {x0, W, y0, rh, numW = 46} = o, w3 = o.w3 || [204, 204, 94];
    const cs = cols(x0, numW, [w3[0], w3[1], w3[2], W - numW - w3[0] - w3[1] - w3[2]]);
    let h = labels(cs, o.labY, o.labH || 20, o.lab);
    if(o.band) for(let i = 0; i < 7; i += 2) h += `<div class="rowband" style="left:${x0}pt;top:${y0 + i * rh}pt;width:${W}pt;height:${rh}pt;background:var(--tint)"></div>`;
    for(let i = 0; i < 7; i++){
      const y = y0 + i * rh;
      h += o.num(E.first + i, x0, y, rh);
      h += box(x0, y + rh, W, 0, o.rule || 'border-top:.5pt solid var(--line)');
      cs.forEach(c => { if(c.yn) h += X.yn(c.x + c.w / 2 - 21, y + (rh - 18) / 2, 18, o.yn); });
    }
    if(o.vr) cs.forEach(c => { h += `<div class="vrule" style="left:${c.x}pt;top:${y0 + 5}pt;height:${7 * rh - 10}pt"></div>`; });
    return h;
  };
  const fbBody = (D, E, o) => {
    const FB = qs(D), {x0: ax, w, top: t} = o, aw = Math.floor((w - 26) * .49), bx = ax + aw + 26, bw2 = w - aw - 26;
    const lab = (slot, s, x, y, ww) => txt(slot, s, x, y, ww, o.lab);
    let h = lab('q.price', FB.price, ax, t + 8, aw);
    h += `<div class="abs" style="left:${ax}pt;top:${t + 20}pt;width:${aw}pt;display:flex;gap:6pt">` + FB.choices.map(c => `<span class="pill" style="flex:1;height:20pt;${o.pill}">${c}</span>`).join('') + '</div>';
    h += lab('q.cond', FB.cond, ax, t + 56, 100) + X.dots(ax + 108, t + 49, aw - 108, 22, o.dot);
    h += lab('q.shows', FB.shows, ax, t + 84, 100) + X.dots(ax + 108, t + 77, aw - 108, 22, o.dot);
    h += txt('q.scale', FB.scale, ax + 108, t + 101, aw - 108, 'text-align:right;font-size:8pt;color:var(--muted)');
    h += X.line('q.seller', FB.seller, ax, t + 116, aw, 10.5, 8, '', o.q) + X.wline(ax, t + 144, aw) + X.wline(ax, t + 160, aw);
    h += lab('q.name', FB.name, ax, t + 166, 100) + X.wline(ax, t + 183, 108) + lab('q.contact', FB.contact, ax + 120, t + 166, aw - 120) + X.wline(ax + 120, t + 183, aw - 120);
    h += box(ax + aw + 13, t + 10, 0, 170, o.div || 'border-left:.5pt solid var(--line)');
    FB.prompts.forEach(([k, s], i) => { const y = t + 6 + i * 60;
      h += X.line('q.' + k, s, bx, y, bw2, 10.5, 8, '', o.q) + X.wline(bx, y + 26, bw2) + X.wline(bx, y + 41, bw2) + X.wline(bx, y + 56, bw2); });
    return h;
  };

  /* ================================ P39 BLACK RULES ================================ */
  const P39 = {h: "'Red Hat Display','Libre Franklin',sans-serif", b: "'Libre Franklin',Helvetica,Arial,sans-serif"};
  const p39Lab = `font:700 8.5pt/1 ${P39.h};letter-spacing:1.3pt;text-transform:uppercase;color:var(--ink)`;
  const p39Sq = `border:1pt solid var(--ink);color:var(--ink);font-family:${P39.h};border-radius:0;background:#fff`;

  L$['p39-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 36, W = 720, ix = m + 142, iw = W - 142;
    const mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = box(m, 34, W, 5, 'background:var(--ink)');
    h += X.line('title', 'Please sign in', m, 46, W, 42, 28, '', `font-family:${P39.h};font-weight:700;text-transform:uppercase;letter-spacing:8pt;text-align:center;color:var(--ink)`);
    h += box(m, 104, W, 2.5, 'background:var(--ink)');
    h += ph(D, E, m, 114, 124, 80) + box(m, 114, 124, 80, 'border:1pt solid var(--ink)');
    const small = `font-family:${P39.b};font-weight:700;font-size:8.5pt;letter-spacing:1.5pt;text-transform:uppercase`;
    if(dated){
      h += X.line('oh.date', ev.long, ix, 113, 360, 20, 13, '', `font-family:${P39.b};font-weight:700;color:var(--ink)`);
      h += X.line('oh.time', ev.time, m + W - 230, 113, 230, 20, 13, '', `font-family:${P39.h};font-weight:700;text-align:right;color:${mc}`);
      h += box(ix, 144, iw, 1, 'background:var(--ink)');
      h += X.line('address', L.address, ix, 152, 360, 18, 12, '', `font-family:${P39.h};font-weight:700;color:var(--ink)`);
      h += X.line('place', X.cityZip(L).toUpperCase(), m + W - 220, 157, 220, 9.5, 8, '', `font-family:${P39.b};font-weight:700;letter-spacing:1.5pt;text-align:right;color:${mc}`);
      h += X.line('oh.label', ev.label, ix, 183, 200, 9, 8, '', `${small};color:${mc}`);
      h += X.line('facts', factLine(L), m + W - 400, 183, 400, 9, 8, '', `${small};font-weight:600;letter-spacing:1pt;text-align:right;color:var(--ink)`);
    } else {
      h += X.line('oh.label', ev.label, ix, 117, 300, 10, 8, '', `${small};letter-spacing:3.4pt;color:${mc}`);
      h += X.line('address', L.address, ix, 133, iw, 26, 16, '', `font-family:${P39.h};font-weight:700;color:var(--ink)`);
      h += box(ix, 170, iw, 1, 'background:var(--ink)');
      h += X.line('place', X.cityZip(L).toUpperCase(), ix, 180, 200, 9.5, 8, '', `${small};letter-spacing:1.5pt;color:${mc}`);
      h += X.line('facts', factLine(L), m + W - 400, 180, 400, 9, 8, '', `${small};font-weight:600;letter-spacing:1pt;text-align:right;color:var(--ink)`);
    }
    h += box(m, 197, W, 1, 'background:var(--ink)');
    h += signRows(D, E, {x0: m, W, y0: 230, rh: 39, labY: 206, labH: 20, lab: `font-family:${P39.h};font-weight:700;font-size:9pt;letter-spacing:1.5pt;color:var(--ink)`,
      band: true, vr: true, w3: [196, 196, 118], rule: 'border-top:.7pt solid var(--ink)', yn: p39Sq,
      num: (n, x0, y, rh) => `<div class="abs" style="left:${x0 + 5}pt;top:${y + (rh - 24) / 2}pt;width:24pt;height:24pt;background:var(--ink);display:flex;align-items:center;justify-content:center"><span style="font:700 12pt/1 ${P39.h};color:#fff">${n}</span></div>`});
    h += box(m, 230 - 2.5, W, 2.5, 'background:var(--ink)');
    h += box(m, 505, W, 4, 'background:var(--ink)');
    h += foot1(D, [m, 516, W, 58]);
    return h;
  };

  L$['p39-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 34, W = 544, mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = box(m, 26, W, 5, 'background:var(--ink)');
    h += X.line('title', 'Your feedback', m, 38, 380, 26, 18, '', `font-family:${P39.h};font-weight:700;text-transform:uppercase;letter-spacing:4pt;color:var(--ink)`);
    h += X.line('address', L.address, m, 70, 400, 14, 10, '', `font-family:${P39.b};font-weight:700;color:var(--ink)`);
    h += X.line('oh.date', `${ev.label}   ·   ${ev.long}   ·   ${ev.time}`, m, 91, 410, 8.5, 8, '', `font-family:${P39.b};font-weight:700;letter-spacing:.8pt;text-transform:uppercase;color:${mc}`);
    h += ph(D, E, m + W - 112, 38, 112, 66) + box(m + W - 112, 38, 112, 66, 'border:1pt solid var(--ink)');
    h += box(m, 112, W, 2.5, 'background:var(--ink)');
    h += fbBody(D, E, {x0: m + 4, w: W - 8, top: 118, lab: p39Lab, q: `font-family:${P39.b};font-weight:600;color:var(--ink)`,
      pill: `${p39Sq};font:700 8.5pt/1 ${P39.h};letter-spacing:.8pt`, dot: () => `${p39Sq};font:700 10pt/1 ${P39.h}`, div: 'border-left:.8pt solid var(--ink)'});
    h += box(m, 309, W, 4, 'background:var(--ink)');
    h += foot1(D, [m, 318, W, 52]);
    return h;
  };

  /* ================================ P45 CIVIC DIAGONAL ================================ */
  const P45 = {j: "'Jost',Helvetica,Arial,sans-serif"};
  // the header slab: dark with a slanted foot, the photo cut on the same slant beside it, an accent stripe along the foot.
  // sx = slab's left edge, px = where the photo starts, yl/yr = the foot's height at the left/right (x = sx and x = trim width)
  const p45Slab = (D, E, W, sx, px, yl, yr) => {
    const e = edge(E), R = W - e, top = e, yAt = x => lineY(x, sx, yl, W, yr);
    let h = '';
    if(!E.bw) h += slab(sx, top, px - 5 - sx, yAt(sx), yAt(px - 5), 'background:var(--dark)');
    h += ph(D, E, px, top, R - px, yAt(px) - top, `clip-path:polygon(0 0,100% 0,100% ${yAt(R) - top}pt,0 ${yAt(px) - top}pt)`);
    h += sband(sx, R - sx, yAt(sx) + 5, yAt(R) + 5, E.bw ? 1.6 : 4, E.bw ? 'background:var(--ink)' : 'background:var(--accent)');
    return h;
  };

  L$['p45-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 48, W = 696;
    const on = bw ? 'var(--ink)' : 'var(--on-dark)', ac = bw ? 'var(--ink)' : 'var(--accent-on-dark)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = p45Slab(D, E, 792, 392, 612, 150, 112);
    h += txt('oh.label', ev.label, m, 36, 330, `font:500 9pt/1 ${P45.j};letter-spacing:4pt;text-transform:uppercase;color:${mc}`);
    h += X.line('title', 'Please', m - 2, 52, 330, 36, 24, '', `font-family:${P45.j};font-weight:300;text-transform:uppercase;letter-spacing:8pt;color:var(--ink)`);
    h += X.line('title2', 'sign in', m - 2, 92, 330, 36, 24, '', `font-family:${P45.j};font-weight:300;text-transform:uppercase;letter-spacing:8pt;color:var(--ink)`);
    if(dated){
      h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, m, 140, 330, 12, 9, '', `font-family:${P45.j};font-weight:500;color:${mc}`);
      h += X.line('facts', factLine(L), m, 160, 330, 8.5, 8, '', `font-family:${P45.j};font-weight:500;letter-spacing:1.3pt;text-transform:uppercase;color:var(--ink)`);
    } else h += X.line('facts', factLine(L), m, 150, 330, 8.5, 8, '', `font-family:${P45.j};font-weight:500;letter-spacing:1.3pt;text-transform:uppercase;color:var(--ink)`);
    h += txt('welcome', 'Welcome to', 418, 42, 170, `font:500 8.5pt/1 ${P45.j};letter-spacing:3.4pt;text-transform:uppercase;color:${ac}`);
    h += X.line('address', L.address, 417, 58, 176, 20, 11, '', `font-family:${P45.j};font-weight:500;letter-spacing:2pt;text-transform:uppercase;color:${on}`);
    h += X.line('place', X.cityZip(L).toUpperCase(), 418, 88, 176, 9, 8, '', `font:500 9pt/1 ${P45.j};letter-spacing:2.4pt;color:${ac}`);
    h += box(418, 106, 36, 1.4, `background:${ac}`);
    const y0 = 214, rh = 37;
    h += box(m, y0 - 2, W, 1.5, 'background:var(--ink)');
    h += signRows(D, E, {x0: m, W, y0, rh, labY: 188, labH: 22, lab: `font-family:${P45.j};font-weight:500;font-size:9pt;letter-spacing:2pt;color:var(--ink)`, band: true, vr: true,
      yn: `border:.8pt solid var(--ink);color:var(--ink);font-family:${P45.j};font-weight:500`,
      num: (n, x0, y, r) => `<div class="num" style="left:${x0}pt;top:${y + (r - 24) / 2}pt;width:34pt;font:300 20pt/24pt ${P45.j};color:${mc}">${n}</div>`});
    h += foot1(D, [m, 490, W, 58]);
    return h;
  };

  L$['p45-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 36, W = 540;
    const on = bw ? 'var(--ink)' : 'var(--on-dark)', ac = bw ? 'var(--ink)' : 'var(--accent-on-dark)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = p45Slab(D, E, 612, 262, 452, 112, 82);
    h += X.line('title', 'Your', m, 36, 214, 24, 16, '', `font-family:${P45.j};font-weight:300;text-transform:uppercase;letter-spacing:6pt;color:var(--ink)`);
    h += X.line('title2', 'feedback', m, 58, 214, 24, 16, '', `font-family:${P45.j};font-weight:300;text-transform:uppercase;letter-spacing:6pt;color:var(--ink)`);
    h += X.line('oh.date', ev.long, m, 90, 214, 10.5, 8, '', `font-family:${P45.j};font-weight:500;color:${mc}`);
    h += txt('oh.label', ev.label, 282, 34, 160, `font:500 8pt/1 ${P45.j};letter-spacing:2.6pt;text-transform:uppercase;color:${ac}`);
    h += X.line('address', L.address, 281, 50, 160, 16, 10, '', `font-family:${P45.j};font-weight:500;letter-spacing:1.6pt;text-transform:uppercase;color:${on}`);
    h += X.line('oh.time', ev.time, 282, 74, 160, 9.5, 8, '', `font-family:${P45.j};font-weight:500;letter-spacing:.6pt;color:${ac}`);
    h += fbBody(D, E, {x0: m, w: W, top: 122, lab: `font:500 8.5pt/1 ${P45.j};letter-spacing:1.6pt;text-transform:uppercase;color:var(--ink)`, q: `font-family:${P45.j};font-weight:500;color:var(--ink)`,
      pill: `border:.8pt solid var(--ink);color:var(--ink);background:var(--tint);font:500 8.5pt/1 ${P45.j};letter-spacing:.9pt`,
      dot: () => `border:.8pt solid var(--ink);background:var(--tint);color:var(--ink);font:500 10pt/1 ${P45.j}`});
    h += foot1(D, [m, 316, W, 54]);
    return h;
  };

  /* ================================ P49 ARC ================================ */
  const P49 = {s: "'Spectral',Georgia,serif", j: "'Jost',Helvetica,Arial,sans-serif"};
  // the photo's curved foot, swept like the flyer's: from x = xs (height yl) to the trim's right edge (height yr). The photo is a
  // block at the right, about three times as wide as it is tall, so the whole house fits its crop.
  const arcY = (x, xs, W, yl, yr) => { const t = Math.min(1, Math.max(0, (x - xs) / (W - xs))); return yl + (yr - yl) * (1 - Math.pow(1 - t, 2.2)); };
  const arcPts = (xs, W, e, yl, yr, off) => Array.from({length: 33}, (_, i) => { const x = xs + (W - e - xs) * i / 32; return [x, arcY(x, xs, W, yl, yr) + (off || 0)]; });
  const p49Photo = (D, E, xs, W, yl, yr) => {
    const e = edge(E), top = e, pts = arcPts(xs, W, e, yl, yr, 0), w = W - e - xs, hg = yr - top;
    let h = ph(D, E, xs, top, w, hg, `clip-path:polygon(0 0,${w}pt 0,${pts.slice().reverse().map(p => `${(p[0] - xs).toFixed(2)}pt ${(p[1] - top).toFixed(2)}pt`).join(',')})`);
    h += strip(arcPts(xs, W, e, yl, yr, 5), 1.3, E.bw ? 'background:var(--ink)' : 'background:var(--accent)');
    return h;
  };

  const P49TY = -10;
  L$['p49-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 48, W = 696;
    const mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = p49Photo(D, E, 300, 792, 118, 172);
    h += X.line('oh.label', ev.label, m + 1, 40 + P49TY, 240, 9, 8, '', `font:600 9pt/1 ${P49.j};letter-spacing:3.4pt;text-transform:uppercase;color:${bw ? 'var(--ink)' : 'var(--accent-on-paper)'}`);
    h += X.line('title', 'Please', m, 54 + P49TY, 240, 41, 24, '', `font-family:${P49.s};font-weight:500;color:${mc};line-height:41pt;padding-bottom:16pt;`);
    h += X.line('title2', 'sign in', m, 92 + P49TY, 240, 41, 24, '', `font-family:${P49.s};font-weight:500;color:${mc};line-height:41pt;padding-bottom:16pt;`); // up, g whole (owner 11/6)
    h += X.line('address', L.address, m, 142, 240, 16, 11, '', `font-family:${P49.s};font-weight:500;color:var(--ink)`);
    h += X.line('place', X.cityZip(L).toUpperCase(), m, 163, 240, 9.5, 8, '', `font:500 9.5pt/1 ${P49.j};letter-spacing:2.2pt;color:${mc}`);
    h += X.line(dated ? 'oh.date' : 'facts', dated ? `${ev.long}   ·   ${ev.time}` : factLine(L), m, 179, 244, 10, 8, '', `font-family:${P49.j};font-weight:500;color:var(--ink)`);
    const y0 = 226, rh = 34;
    h += box(m, y0 - 1.2, W, 1.2, bw ? 'background:var(--ink)' : 'background:var(--accent)');
    h += signRows(D, E, {x0: m, W, y0, rh, labY: 200, labH: 22, lab: `font-family:${P49.j};font-weight:600;font-size:8.8pt;letter-spacing:2.2pt;color:${mc}`, band: true, vr: true,
      yn: `border:.8pt solid var(--accent);color:${mc};font-family:${P49.j};font-weight:500`,
      num: (n, x0, y, r) => `<div class="num" style="left:${x0}pt;top:${y + (r - 24) / 2}pt;width:34pt;font:500 17pt/24pt ${P49.s};color:${mc}">${n}</div>`});
    if(!bw) h += E.fl(0, 480, 704, 140, 'lb', 'background:var(--dark);border-top-right-radius:44pt');
    else h += box(m, 480, W, 0, 'border-top:1.2pt solid var(--ink)');
    h += foot1(D, [m, 490, 640, 58], {dark: !bw});
    return h;
  };

  L$['p49-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 36, W = 540, mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = p49Photo(D, E, 350, 612, 70, 104);
    h += X.line('oh.label', ev.label, m + 1, 32, 250, 8.5, 8, '', `font:600 8.5pt/1 ${P49.j};letter-spacing:3pt;text-transform:uppercase;color:${bw ? 'var(--ink)' : 'var(--accent-on-paper)'}`);
    h += X.line('title', 'Your feedback', m, 46, 280, 32, 18, '', `font-family:${P49.s};font-weight:500;color:${mc}`);
    h += X.line('address', L.address, m, 82, 280, 15, 10, '', `font-family:${P49.s};font-weight:500;color:var(--ink)`);
    h += X.line('oh.date', `${ev.long}   ·   ${ev.time}`, m, 100, 290, 9, 8, '', `font:500 9pt/1 ${P49.j};color:${mc}`);
    h += fbBody(D, E, {x0: m, w: W, top: 116, lab: `font:600 8.5pt/1 ${P49.j};letter-spacing:1.8pt;text-transform:uppercase;color:${mc}`, q: `font-family:${P49.s};font-weight:500;color:var(--ink)`,
      pill: `border:.8pt solid var(--accent);color:${mc};background:var(--tint);border-radius:11pt;font:500 8.5pt/1 ${P49.j};letter-spacing:.9pt`,
      dot: () => `border:.8pt solid var(--accent);background:var(--tint);color:${mc};font:500 10.5pt/1 ${P49.s}`});
    if(!bw) h += E.fl(0, 312, 580, 90, 'lb', 'background:var(--dark);border-top-right-radius:34pt');
    else h += box(m, 312, W, 0, 'border-top:1.2pt solid var(--ink)');
    h += foot1(D, [m, 322, 500, 52], {dark: !bw});
    return h;
  };

  /* ================================ P50 CROSSCUT ================================ */
  const P50 = {e: "'Epilogue',Helvetica,Arial,sans-serif", c: "'Crimson Pro',Georgia,serif"};
  // top slab with a slanted foot (low at the left, high at the right), the photo cut on the same slant at the right, a gold stripe under it
  const p50Top = (D, E, W, px, yl, yr) => {
    const e = edge(E), R = W - e, yAt = x => lineY(x, 0, yl, W, yr);
    let h = '';
    if(!E.bw) h += slab(e, e, px - 6 - e, yAt(e), yAt(px - 6), 'background:var(--dark)');
    h += ph(D, E, px, e, R - px, yAt(px) - e, `clip-path:polygon(0 0,100% 0,100% ${yAt(R) - e}pt,0 ${yAt(px) - e}pt)`);
    h += sband(e, R - e, yAt(e) + 4, yAt(R) + 4, E.bw ? 1.6 : 5, E.bw ? 'background:var(--ink)' : 'background:var(--accent)');
    return h;
  };
  // the opposing slant at the foot: a dark band whose top edge falls to the right, a gold stripe above it
  const p50Foot = (E, W, H, yl, yr) => {
    const e = edge(E), R = W - e;
    if(E.bw) return sband(e, R - e, yl, yr, 1.6, 'background:var(--ink)');
    return slabBelow(e, R - e, yl, yr, H - e, 'background:var(--dark)') + sband(e, R - e, yl - 7, yr - 7, 5, 'background:var(--accent)');
  };

  L$['p50-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 48, W = 696;
    const on = bw ? 'var(--ink)' : 'var(--on-dark)', ac = bw ? 'var(--ink)' : 'var(--accent-on-dark)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = p50Top(D, E, 792, 574, 166, 126);
    h += X.line('title', 'Please', m, 32, 230, 40, 24, '', `font-family:${P50.e};font-weight:700;text-transform:uppercase;color:${on};line-height:44pt`);
    h += X.line('title2', 'sign in', m, 74, 230, 40, 24, '', `font-family:${P50.e};font-weight:700;text-transform:uppercase;color:${ac};line-height:44pt`);
    if(dated){
      h += X.line('oh.label', ev.label, 304, 34, 250, 8.5, 8, '', `font-family:${P50.e};font-weight:600;letter-spacing:2.4pt;text-transform:uppercase;color:${ac}`);
      h += X.line('oh.date', ev.long, 304, 48, 250, 20, 12, '', `font-family:${P50.c};font-weight:600;color:${on}`);
      h += X.line('oh.time', ev.time, 304, 72, 250, 15, 10, '', `font-family:${P50.c};font-weight:500;color:${ac}`);
      h += X.line('address', L.address, 304, 96, 250, 13, 9, '', `font-family:${P50.e};font-weight:700;color:${on}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), 304, 114, 250, 8, 8, '', `font:600 8pt/1 ${P50.e};letter-spacing:1.4pt;color:${ac}`);
    } else {
      h += txt('welcome', 'Welcome to', 304, 40, 250, `font:600 8.5pt/1 ${P50.e};letter-spacing:2.6pt;text-transform:uppercase;color:${ac}`);
      h += X.line('address', L.address, 304, 56, 250, 22, 12, '', `font-family:${P50.e};font-weight:700;color:${on}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), 304, 88, 250, 9, 8, '', `font:600 9pt/1 ${P50.e};letter-spacing:1.6pt;color:${ac}`);
      h += X.line('facts', factLine(L), 304, 106, 252, 8, 8, '', `font:500 8pt/1 ${P50.e};letter-spacing:.2pt;color:${on};opacity:.85`);
    }
    const y0 = 212, rh = 36;
    h += box(m, y0 - 1.5, W, 1.5, `background:${bw ? 'var(--ink)' : 'var(--main)'}`);
    h += signRows(D, E, {x0: m, W, y0, rh, labY: 188, labH: 20, lab: `font-family:${P50.e};font-weight:700;font-size:8.6pt;letter-spacing:1.6pt;color:var(--main-on-paper)`, band: true, vr: true,
      yn: `border:.8pt solid var(--main-on-paper);color:var(--main-on-paper);font-family:${P50.e};font-weight:600`,
      num: (n, x0, y, r) => `<div class="abs" style="left:${x0 + 2}pt;top:${y + 6}pt;width:34pt;height:${r - 12}pt;background:${bw ? 'var(--ink)' : 'var(--main)'};display:flex;align-items:center;justify-content:center"><span style="font:700 12pt/1 ${P50.e};color:${bw ? '#fff' : 'var(--on-main)'}">${n}</span></div>`});
    h += p50Foot(E, 792, 612, 492, 514);
    h += foot1(D, [m, 524, W, 58], {dark: !bw});
    return h;
  };

  L$['p50-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 36, W = 540;
    const on = bw ? 'var(--ink)' : 'var(--on-dark)', ac = bw ? 'var(--ink)' : 'var(--accent-on-dark)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = p50Top(D, E, 612, 458, 98, 62);
    h += X.line('title', 'Your feedback', m, 30, 250, 26, 14, '', `font-family:${P50.e};font-weight:700;text-transform:uppercase;color:${on}`);
    h += X.line('address', L.address, m, 62, 250, 17, 10, '', `font-family:${P50.c};font-weight:600;color:${ac}`);
    h += X.line('oh.label', ev.label, 302, 26, 148, 8, 8, '', `font-family:${P50.e};font-weight:600;letter-spacing:1.6pt;text-transform:uppercase;color:${ac}`);
    h += X.line('oh.date', ev.long, 302, 40, 148, 14, 9, '', `font-family:${P50.c};font-weight:600;color:${on}`);
    h += X.line('oh.time', ev.time, 302, 55, 148, 12, 9, '', `font-family:${P50.c};font-weight:500;color:${ac}`);
    h += fbBody(D, E, {x0: m, w: W, top: 112, lab: `font:700 8.4pt/1 ${P50.e};letter-spacing:1.3pt;text-transform:uppercase;color:${mc}`, q: `font-family:${P50.c};font-weight:600;font-size:11pt;color:var(--ink)`,
      pill: `border:.9pt solid var(--main-on-paper);color:${mc};background:var(--tint);font:700 8.2pt/1 ${P50.e};letter-spacing:.5pt`,
      dot: () => `border:.9pt solid var(--main-on-paper);background:var(--tint);color:${mc};font:700 10pt/1 ${P50.e}`});
    h += p50Foot(E, 612, 396, 311, 323);
    h += foot1(D, [m, 328, W, 50], {dark: !bw});
    return h;
  };

  /* ================================ P51 MARQUEE ================================ */
  const P51 = {a: "'Anton','Oswald',Impact,sans-serif", w: "'Work Sans',Helvetica,Arial,sans-serif"};
  const p51Mark = (bw, n, x, y, w, hg, sz) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hg}pt;background:${bw ? 'var(--ink)' : 'var(--main)'};display:flex;align-items:center;justify-content:center"><span style="font:400 ${sz}pt/1 ${P51.a};color:${bw ? '#fff' : 'var(--on-main)'}">${n}</span></div>`;

  L$['p51-signin'] = (D, E) => {
    const L = D.listing, ev = X.ev(D), dated = ev.kind !== 'public', bw = E.bw, m = 48, W = 696, HB = 128, e = edge(E);
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)', od = bw ? 'var(--ink)' : 'var(--on-dark)', ad = bw ? 'var(--ink)' : 'var(--accent-on-dark)';
    let h = '';
    if(!bw) h += E.fl(0, 0, 792, HB, 'ltr', 'background:var(--main)') + E.fl(584, 0, 208, HB, 'tr', 'background:var(--dark)') + E.fl(0, HB, 792, 4, 'lr', 'background:var(--accent)');
    else h += box(m, 30, 530, 3, 'background:var(--ink)') + box(m, HB, W, 3, 'background:var(--ink)') + box(584, 30, 0, HB - 30, 'border-left:1.2pt solid var(--ink)');
    h += X.line('title', 'Please sign in', m, 30, 370, 56, 30, '', `font-family:${P51.a};text-transform:uppercase;letter-spacing:1.5pt;color:${on}`);
    h += X.line('oh.label', ev.label, m, 98, 360, 9.5, 8, '', `font-family:${P51.w};font-weight:600;letter-spacing:3.4pt;text-transform:uppercase;color:${ac}`);
    h += ph(D, E, 424, 26, 146, 80) + box(424, 26, 146, 80, `border:1.5pt solid ${on}`);
    if(dated){
      h += txt('oh.weekday', ev.weekday, 604, 32, 170, `font:600 9pt/1 ${P51.w};letter-spacing:4pt;text-transform:uppercase;color:${ad}`);
      h += X.line('oh.date', ev.monthDay, 603, 47, 164, 30, 16, '', `font-family:${P51.a};text-transform:uppercase;letter-spacing:1pt;color:${od}`);
      h += box(604, 90, 160, 1.4, `background:${ad}`);
      h += X.line('oh.time', ev.time, 604, 99, 170, 12, 9, '', `font-family:${P51.w};font-weight:700;color:${od}`);
    } else {
      h += txt('welcome', 'Welcome to', 604, 32, 170, `font:600 9pt/1 ${P51.w};letter-spacing:4pt;text-transform:uppercase;color:${ad}`);
      h += X.line('address', L.address, 603, 47, 164, 26, 13, '', `font-family:${P51.a};text-transform:uppercase;letter-spacing:.5pt;color:${od}`);
      h += box(604, 90, 160, 1.4, `background:${ad}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), 604, 99, 164, 9, 8, '', `font:700 9pt/1 ${P51.w};letter-spacing:1.6pt;color:${od}`);
    }
    const y0 = 172, rh = 36;
    h += signRows(D, E, {x0: m, W, y0, rh, labY: 146, labH: 20, lab: `font-family:${P51.w};font-weight:700;font-size:8.6pt;letter-spacing:1.5pt;color:${bw ? 'var(--ink)' : 'var(--main-on-paper)'}`, band: true, vr: true,
      yn: `border:1pt solid var(--ink);color:var(--ink);font-family:${P51.w};font-weight:700`,
      num: (n, x0, y, r) => p51Mark(bw, n, x0 + 3, y + 5, 30, r - 10, 15)});
    h += box(m, y0 - 2.5, W, 2.5, 'background:var(--ink)');
    if(!bw){
      h += E.fl(0, 452, 792, 160, 'lrb', 'background:var(--main)');
      h += E.fl(0, 450, 792, 3, 'lr', 'background:var(--accent)');
    } else h += box(m, 451, W, 3, 'background:var(--ink)');
    if(dated){
      h += X.line('address', L.address, m, 466, 440, 26, 14, '', `font-family:${P51.a};text-transform:uppercase;letter-spacing:.8pt;color:${on}`);
      h += X.line('place', X.cityZip(L).toUpperCase(), m + W - 240, 474, 240, 10, 8, '', `font:700 10pt/1 ${P51.w};letter-spacing:2pt;text-align:right;color:${ac}`);
    } else h += X.line('facts', factLine(L).toUpperCase(), m, 470, W, 11, 8, '', `font:700 11pt/1 ${P51.w};letter-spacing:2.6pt;color:${ac}`);
    h += foot1(D, [m, 504, W, 58], {dark: !bw});
    return h;
  };

  L$['p51-feedback'] = (D, E) => {
    const FB = qs(D), L = D.listing, ev = X.ev(D), bw = E.bw, m = 30, W = 552, HB = 98;
    const on = bw ? 'var(--ink)' : 'var(--on-main)', ac = bw ? 'var(--ink)' : 'var(--accent-on-main)', od = bw ? 'var(--ink)' : 'var(--on-dark)', ad = bw ? 'var(--ink)' : 'var(--accent-on-dark)', mc = bw ? 'var(--ink)' : 'var(--main-on-paper)';
    let h = '';
    if(!bw) h += E.fl(0, 0, 612, HB, 'ltr', 'background:var(--main)') + E.fl(470, 0, 142, HB, 'tr', 'background:var(--dark)') + E.fl(0, HB, 612, 3, 'lr', 'background:var(--accent)');
    else h += box(m, 26, W, 3, 'background:var(--ink)') + box(m, HB, W, 3, 'background:var(--ink)') + box(470, 26, 0, HB - 26, 'border-left:1.2pt solid var(--ink)');
    h += X.line('title', 'Your feedback', m, 26, 230, 38, 20, '', `font-family:${P51.a};text-transform:uppercase;letter-spacing:1.2pt;color:${on}`);
    h += X.line('address', L.address, m, 68, 230, 13, 9, '', `font-family:${P51.w};font-weight:600;color:${on}`);
    h += X.line('oh.label', ev.label, m, 84, 230, 8.5, 8, '', `font-family:${P51.w};font-weight:600;letter-spacing:2.6pt;text-transform:uppercase;color:${ac}`);
    h += ph(D, E, 276, 28, 176, 60) + box(276, 28, 176, 60, `border:1.5pt solid ${on}`);
    h += txt('oh.weekday', ev.weekday, 486, 30, 118, `font:600 8.5pt/1 ${P51.w};letter-spacing:3.6pt;text-transform:uppercase;color:${ad}`);
    h += X.line('oh.date', ev.monthDay, 485, 44, 104, 24, 13, '', `font-family:${P51.a};text-transform:uppercase;letter-spacing:.8pt;color:${od}`);
    h += X.line('oh.time', ev.time, 486, 76, 104, 10.5, 8, '', `font-family:${P51.w};font-weight:700;color:${od}`);
    h += fbBody(D, E, {x0: m, w: W, top: 110, lab: `font:700 8.4pt/1 ${P51.w};letter-spacing:1.3pt;text-transform:uppercase;color:${mc}`, q: `font-family:${P51.w};font-weight:600;color:var(--ink)`,
      pill: `border:1pt solid var(--ink);color:${mc};background:var(--tint);border-radius:0;font:700 8.2pt/1 ${P51.w};letter-spacing:.6pt`,
      dot: () => `border:1pt solid var(--ink);background:#fff;color:${mc};border-radius:0;font:400 11pt/1 ${P51.a}`});
    if(!bw) h += E.fl(0, 316, 612, 80, 'lrb', 'background:var(--main)') + E.fl(0, 314, 612, 3, 'lr', 'background:var(--accent)');
    else h += box(m, 315, W, 3, 'background:var(--ink)');
    h += foot1(D, [m, 324, W, 52], {dark: !bw});
    return h;
  };
})();
