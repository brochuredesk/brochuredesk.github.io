/* Open House extras (brief docs/briefs/open-house-extras-build.md, owner 10/20 and 11/1/2026): the sign-in sheet and the
   broker feedback card, drawn in the look of the set whose Open House flyer the agent picked. Data fields only: no AI,
   no invented property copy, no price, no QR. Round 2 (owner 11/1/2026): every piece landscape, its own design per set,
   and a black-and-white version of each (no front photo, same layout).

   Two files per piece (renderer/render.py writes them as email.pdf and print.pdf):
     email.pdf  the print-at-home file. Sign-in: 11 x 8.5 with a white 0.25 in margin, two sheets (rows 1-7 and 8-14).
                Feedback: two 8.5 x 5.5 cards on a letter sheet, a dashed cut line across the middle, each card with its
                own white margin.
     print.pdf  the printer file: the piece at trim plus 0.125 in bleed all round, color to the edge (TrimBox/BleedBox).

   Pieces (pieces.json): {kind: 'signin' | 'feedback', look: '<set>-<signin|feedback>', bw: true for the black-and-white
   version (white field, black ink, no front photo; the look draws its own stand-in where the photo sat).
   Each look is a function (D, E) -> html in trim coordinates (pt, origin at the trim's top left). E tells it the mode:
     E.home   true for the print-at-home file
     E.bw     true for the black-and-white version
     E.first  the first row number on this sheet (sign-in: 1, then 8)
     E.W, E.H trim size
     E.fl(x, y, w, h, sides, style)   a color flood; the sides it names ('l', 't', 'r', 'b') run to the bleed on the
                                      printer file and stop at the white margin on the home file
   Checks (window.brochureCheck): text past its box, type under 8 pt (6 pt fine print), empty slots, the whole house in
   every photo crop, photo resolution, the contact card's own checks. */
(function(){
  const X = window.Extras = {looks: {}};
  const esc = X.esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const HOME = 18, BLEED = 9;
  const issues = [], placements = [];

  X.issue = i => issues.push(i);
  X.data = () => JSON.parse(document.getElementById('brochure-data').textContent || '{}');

  // ---- the event, from openHouse {kind, date 'YYYY-MM-DD', start 'HH:MM', end 'HH:MM'} ----
  const KINDS = {public: 'Public Open House', broker: 'Broker Open House', realtor: 'REALTOR® Open House'};
  const clock = t => { if(!t) return ''; let [h, m] = t.split(':').map(Number); const ap = h < 12 ? 'am' : 'pm'; h = h % 12 || 12;
    return {t: `${h}:${String(m || 0).padStart(2, '0')}`, ap}; };
  X.ev = D => {
    const O = D.openHouse || {}, A = D.agent || {};
    let kind = O.kind || 'public'; if(kind === 'realtor' && !A.nar) kind = 'broker';
    const r = {kind, label: KINDS[kind] || KINDS.public, weekday: '', month: '', day: '', long: '', time: '', short: ''};
    if(O.date){
      const [y, mo, d] = O.date.split('-').map(Number), dt = new Date(Date.UTC(y, mo - 1, d, 12));
      const f = o => new Intl.DateTimeFormat('en-US', Object.assign({timeZone: 'UTC'}, o)).format(dt);
      r.weekday = f({weekday: 'long'}); r.wd3 = f({weekday: 'short'}); r.month = f({month: 'long'}); r.mon3 = f({month: 'short'}); r.day = String(d);
      r.monthDay = `${r.month} ${r.day}`; r.long = `${r.weekday}, ${r.monthDay}`;
    }
    const s = clock(O.start), e = clock(O.end);
    if(s && e) r.time = s.ap === e.ap ? `${s.t} to ${e.t} ${e.ap}` : `${s.t} ${s.ap} to ${e.t} ${e.ap}`;
    return r;
  };
  const ST = {texas: 'TX'};
  X.cityZip = L => `${L.city || ''}, ${ST[String(L.state || '').toLowerCase()] || L.state || ''} ${L.zip || ''}`.trim();
  X.place = L => [L.neighborhood, X.cityZip(L)].filter(Boolean).join(' · ');

  // ---- photos: cover the box, keep the whole house in the crop (the roofline rule) ----
  X.photo = (D, key, x, y, w, h, extra) => {
    const P = (D.photos || {})[key];
    if(!P || !P.src){ issues.push({kind: 'empty-slot', slot: 'photo.' + key}); return `<div class="photo" data-slot="photo.${key}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${extra || ''}"></div>`; }
    const iw = P.w || 3, ih = P.h || 2, s = Math.max(w / iw, h / ih), dw = iw * s, dh = ih * s;
    const hb = P.house ? [P.house.left, P.house.top, P.house.right, P.house.bottom] : P.box || [0.1, 0.1, 0.9, 0.95];
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    // across: center the house; up and down: the roof sits just under the top edge with a little sky (a listing's house box
    // often starts at the roof's eaves, so centering can still clip a gable), as long as the house's foot stays in
    const ox = clamp(w / 2 - (hb[0] + hb[2]) / 2 * dw, w - dw, 0);
    let oy = clamp(0.08 * h - hb[1] * dh, h - dh, 0);
    if(hb[3] * dh + oy > h) oy = clamp(h / 2 - (hb[1] + hb[3]) / 2 * dh, h - dh, 0);
    const inL = hb[0] * dw + ox, inR = hb[2] * dw + ox, inT = hb[1] * dh + oy, inB = hb[3] * dh + oy;
    if(inL < -0.5 || inT < -0.5 || inR > w + 0.5 || inB > h + 0.5) issues.push({kind: 'crop', slot: 'photo.' + key, detail: 'the whole house does not fit this crop'});
    placements.push({src: P.src, w: dw / 72, h: dh / 72});
    if(P.w && P.w / (dw / 72) < 300) issues.push({kind: 'photo-ppi', slot: 'photo.' + key, ppi: Math.round(P.w / (dw / 72))});
    return `<div class="photo" data-slot="photo.${key}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${extra || ''}">` +
      `<img src="${esc(P.src)}" alt="" style="left:${ox}pt;top:${oy}pt;width:${dw}pt;height:${dh}pt"></div>`;
  };
  window.photoPlacements = () => placements;

  // ---- text ----
  // one line of display type that steps down to fit its width, never under its floor
  X.line = (slot, text, x, y, w, size, floor, cls, style) =>
    `<div class="abs nowrap ${cls || ''}" data-slot="${slot}" data-shrink="${floor}" style="left:${x}pt;top:${y}pt;width:${w}pt;font-size:${size}pt;line-height:${size * 1.2}pt;${style || ''}">${esc(text)}</div>`;
  const shrink = () => document.querySelectorAll('[data-shrink]').forEach(el => {
    const floor = +el.dataset.shrink; let s = parseFloat(el.style.fontSize);
    while(el.scrollWidth > el.clientWidth + 1 && s > floor){ s = Math.max(floor, s - 0.5); el.style.fontSize = s + 'pt'; el.style.lineHeight = s * 1.2 + 'pt'; }
    // an agent's own feedback question (owner 11/2) that is still too long at the floor drops the capitals and wide spacing
    if(el.scrollWidth > el.clientWidth + 1 && /^q\./.test(el.dataset.slot || '')) el.dataset.relax = '1';
  });
  // ...and so do the card's other questions in the same style, so they still match
  const relax = () => document.querySelectorAll('.trim').forEach(t => { const r = t.querySelector('[data-relax]'); if(!r) return;
    const tt = getComputedStyle(r).textTransform;
    t.querySelectorAll('[data-slot="q.like"],[data-slot="q.better"],[data-slot="q.back"],[data-slot="q.seller"]').forEach(q => { if(getComputedStyle(q).textTransform === tt){ q.style.textTransform = 'none'; q.style.letterSpacing = '.2pt'; } }); });
  // a kicker label with hairlines (Ivory's centered label) or one rule running on to the right
  X.flank = (text, cx, y, maxW, cls, style, rule) =>
    `<div class="abs flank" data-flank="${maxW}" style="left:${cx - maxW / 2}pt;top:${y}pt;width:${maxW}pt;display:flex;align-items:center;gap:10pt">` +
    `<div style="flex:1;height:0;border-top:${rule}"></div><div class="${cls}" data-slot="oh.label" style="${style}">${esc(text)}</div><div style="flex:1;height:0;border-top:${rule}"></div></div>`;

  // ---- writing aids ----
  X.yn = (x, y, d, style) => `<div class="yn" style="left:${x}pt;top:${y}pt">` +
    ['Y', 'N'].map(t => `<span style="width:${d}pt;height:${d}pt;${style}">${t}</span>`).join('') + '</div>';
  X.wline = (x, y, w, style) => `<div class="wline" style="left:${x}pt;top:${y}pt;width:${w}pt;${style || ''}"></div>`;
  // five rating marks across [x, x+w], each d pt round; style(i) gives each its own look
  X.dots = (x, y, w, d, style, n = 5) => `<div class="dots" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${d}pt">` +
    Array.from({length: n}, (_, i) => `<div class="dot" style="width:${d}pt;height:${d}pt;${style(i)}">${i + 1}</div>`).join('') + '</div>';

  // ---- the agent's contact footer: the shared standard footer (templates/_shared/footer.js, owner 11/1/2026) ----

  // ---- the page ----
  X.build = async () => {
    const D = X.data(), piece = D.piece || {}, home = D.mode !== 'print';
    const look = X.looks[piece.look], set = String(piece.look || '').split('-')[0], bw = !!piece.bw;
    document.body.classList.add('set-' + set);
    if(bw) document.body.classList.add('bw');
    const br = D.brand || {}, root = document.body.style;
    if(!bw && set === 'ivory' && br.accent) root.setProperty('--accent', br.accent);
    if(!bw && set === 'swatchbook' && br.accent) root.setProperty('--navy', br.accent), root.setProperty('--accent', br.accent), root.setProperty('--ink', br.accent);
    root.setProperty('--field-dark', 'var(--navy, var(--accent))');
    // library flyers' looks (b01, b16, p17) take the agent's brand colors and set their own vars (looks.js X.themes)
    if(X.themes && X.themes[set]) X.themes[set](D, bw, root);
    // landscape (owner 11/1/2026): sign-in 11 x 8.5, feedback 8.5 x 5.5 (two up on a letter sheet at home)
    const fb = piece.kind === 'feedback', tw = fb ? 612 : 792, th = fb ? 396 : 612;
    const two = fb && home, W = two ? 612 : home ? tw : tw + 2 * BLEED, H = two ? 792 : home ? th : th + 2 * BLEED, b = home ? 0 : BLEED;
    const field = home || bw ? '#fff' : (piece.field || 'var(--paper)');
    const mk = first => {
      const E = {home, bw, first: first || 1, W: tw, H: th, D};
      // floods: the named sides run to the bleed (printer file) or stop at the white margin (home file)
      E.fl = (x, y, w, h, sides, style) => {
        const e = home ? HOME : -BLEED;
        let l = x, t = y, r = x + w, bt = y + h;
        if(sides.includes('l')) l = e; if(sides.includes('t')) t = e; if(sides.includes('r')) r = tw - e; if(sides.includes('b')) bt = th - e;
        return `<div class="flood" style="left:${l}pt;top:${t}pt;width:${r - l}pt;height:${bt - t}pt;${style}"></div>`;
      };
      return E;
    };
    if(!look){ document.getElementById('pages').innerHTML = `<p style="padding:20pt">Unknown look ${esc(piece.look)}</p>`; return; }
    // a font shorthand holding a var() (font:700 8.5pt/10pt var(--font-display)) is spelled out as longhands: once any fitter
    // sets the size, Chrome drops the whole pending shorthand and the text falls back to the page's default font and size
    // (Swatchbook's questions overflowed at 12 pt; owner 11/13 pass)
    const longhand = html => html.replace(/font:\s*(italic\s+)?(\d{3})\s+([\d.${}|a-z ()+\-*\/]*?pt)\/([\d.${}|a-z ()+\-*\/]*?(?:pt)?)\s+(var\(--[a-z-]+\)[^;"'`]*)/g,
      (m, it, w, sz, lh, fam) => `${it ? 'font-style:italic;' : ''}font-weight:${w};font-size:${sz};line-height:${lh};font-family:${fam.trim()}`);
    const sheet = html => `<div class="page" style="width:${W}pt;height:${H}pt;background:${longhand(field)}">${longhand(html)}</div>`;
    let pages = '';
    if(two){
      let html = '';
      for(const oy of [0, 396]) html += `<div class="trim" style="left:0;top:${oy}pt;width:${tw}pt;height:${th}pt">${look(D, mk())}</div>`;
      pages = sheet(html + `<div class="cut" style="top:396pt"></div>`);
    } else if(fb) pages = sheet(`<div class="trim" style="left:${b}pt;top:${b}pt;width:${tw}pt;height:${th}pt">${look(D, mk())}</div>`);
    // sign-in: two sheets, rows 1-7 and 8-14 (owner 11/1/2026)
    else for(const first of [1, 8]) pages += sheet(`<div class="trim" style="left:${b}pt;top:${b}pt;width:${tw}pt;height:${th}pt">${look(D, mk(first))}</div>`);
    document.getElementById('pages').innerHTML = pages;
    window.pieceSize = {W, H, bleed: b};
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    shrink();
    relax();
    fit2();
    labelFit();
    unclip();
    if(window.ContactCard) ContactCard.fit(document);
    if(window.StandardFooter && StandardFooter.finish) StandardFooter.finish(document, {home});
    // a flanked label keeps its hairlines only when there's room for them
    document.querySelectorAll('[data-flank]').forEach(f => { const lab = f.children[1]; if(lab.scrollWidth > f.clientWidth - 40) [f.children[0], f.children[2]].forEach(r => r.style.display = 'none'); });
    // a row's light tint is the table's own furniture: its column and row rules meet its edges by design (the clearance
    // check's box rule is for lines running into a box that holds text; 11/13)
    document.querySelectorAll('.rowband').forEach(e => e.dataset.clearSkip = '1');
    // on the two-up sheet and the second sign-in sheet only the first copy's checks count (the rest repeat it)
    document.querySelectorAll('.trim + .trim [data-slot], .page + .page [data-slot]').forEach(e => e.dataset.twin = '1');
  };

  // a two-line display slot (data-fit2="size,lineHeight,floor") steps down until it fits its two lines; a slot with
  // data-follow="slot,gap" then sits that gap (pt) under the followed slot's last line
  const fit2 = () => {
    document.querySelectorAll('[data-fit2]').forEach(el => {
      // one line first, as big as fits down to oneFloor (no street split over two lines when one line will do), then two lines
      let [s, lh, fl, one] = el.dataset.fit2.split(',').map(Number); const r = lh / s, s0 = s;
      const set = v => { el.style.fontSize = v + 'pt'; el.style.lineHeight = v * r + 'pt'; el.style.maxHeight = 2 * v * r + 'pt'; };
      const bad = () => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
      if(one){ el.style.whiteSpace = 'nowrap'; set(s); while(bad() && s > one){ s -= 0.5; set(s); }
        if(!bad()) return; el.style.whiteSpace = 'normal'; s = Math.round(s0 * 0.88 * 2) / 2; }
      set(s); while(bad() && s > fl){ s -= 0.5; set(s); }
    });
    document.querySelectorAll('[data-follow]').forEach(el => {
      const [slot, gap] = el.dataset.follow.split(','), t = el.closest('.trim'), a = t && t.querySelector(`[data-slot="${slot}"]`); if(!a) return;
      const k = t.getBoundingClientRect().width / t.offsetWidth || 1, px = 72 / 96;
      el.style.top = ((a.getBoundingClientRect().bottom - t.getBoundingClientRect().top) / k * px + +gap) + 'pt';
    });
    // a group (data-vgroup="name" on each part, data-vspace="top,bottom" in pt on any one) sits centered top to bottom in its space
    document.querySelectorAll('.trim').forEach(t => {
      const groups = {}; t.querySelectorAll('[data-vgroup]').forEach(e => (groups[e.dataset.vgroup] = groups[e.dataset.vgroup] || []).push(e));
      Object.values(groups).forEach(es => { const sp = es.find(e => e.dataset.vspace); if(!sp) return;
        const [a, b] = sp.dataset.vspace.split(',').map(Number), k = t.getBoundingClientRect().width / t.offsetWidth || 1, px = 72 / 96, t0 = t.getBoundingClientRect().top;
        const rs = es.map(e => e.getBoundingClientRect()), top = (Math.min(...rs.map(r => r.top)) - t0) / k * px, bot = (Math.max(...rs.map(r => r.bottom)) - t0) / k * px;
        const d = (a + b) / 2 - (top + bot) / 2; es.forEach(e => e.style.top = parseFloat(e.style.top) + d + 'pt'); });
    });
  };

  // a column label that wraps to more lines than its box holds grows up into the frame or rule above it: it steps down
  // (never under 8 pt) until its lines sit inside the box; at 8 pt it goes back to the plain wording (reviewer 11/13)
  const labelFit = () => document.querySelectorAll('.collab, [data-slot^="col."]').forEach(el => {
    // over: its lines rise above the box, drop below it (into the rule under the labels), or run wider than it (into the next column's label)
    const over = () => { const r = document.createRange(); r.selectNodeContents(el); const q = [...r.getClientRects()].filter(b => b.width > .5), e = el.getBoundingClientRect();
      return q.length && (Math.min(...q.map(b => b.top)) < e.top - 0.5 || Math.min(...q.map(b => b.left)) < e.left - 0.5 || Math.max(...q.map(b => b.right)) > e.right + 0.5 || Math.max(...q.map(b => b.bottom)) > e.bottom + 0.5); };
    if(!over()) return;
    // tighter tracking first (so "with an agent?" can take one line), then smaller type
    let ls = (parseFloat(getComputedStyle(el).letterSpacing) || 0) * 72 / 96; const lsMin = Math.min(ls, 0.4);
    while(over() && ls > lsMin){ ls = Math.max(lsMin, ls - 0.1); el.style.letterSpacing = ls + 'pt'; }
    const s0 = parseFloat(getComputedStyle(el).fontSize) * 72 / 96, lh0 = el.style.lineHeight;
    const shrinkTo8 = () => { let s = s0; el.style.fontSize = s + 'pt'; el.style.lineHeight = lh0;
      while(over() && s > 8){ s = Math.max(8, s - 0.25); el.style.fontSize = s + 'pt'; el.style.lineHeight = s * 1.12 + 'pt'; } };
    shrinkTo8();
    // still too big at 8 pt in a narrow column: give width back a point a side at a time (never wider than the column
    // less 5 pt a side), each time from its own size again
    const x0 = parseFloat(el.style.left), w0 = parseFloat(el.style.width);
    for(let k = 1; over() && k <= 6; k++){ el.style.left = x0 - k + 'pt'; el.style.width = w0 + 2 * k + 'pt'; shrinkTo8(); }
  });

  // ---- no letter is ever cut (owner 11/13/2026, B16 sign-in: the tail of the g in "sign in" was clipped) ----
  // A one-line slot clips at its own box; a display face's tails (g, j, p, y) or tall capitals can reach past it. Measure each
  // line's real ink with the font's own metrics and grow the box (padding, the text stays where it is) to hold it.
  const inkOf = el => {
    const cs = getComputedStyle(el), t = (el.textContent || '').trim(); if(!t) return null;
    const txt = cs.textTransform === 'uppercase' ? t.toUpperCase() : cs.textTransform === 'lowercase' ? t.toLowerCase() : t;
    const c = inkOf.c || (inkOf.c = document.createElement('canvas').getContext('2d'));
    c.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = c.measureText(txt), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
    const base = parseFloat(cs.paddingTop) + (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
    return {top: base - m.actualBoundingBoxAscent, bottom: base + m.actualBoundingBoxDescent, h: el.getBoundingClientRect().height / (el.getBoundingClientRect().width / el.offsetWidth || 1)};
  };
  const clippers = () => [...document.querySelectorAll('#pages .nowrap, #pages .disp, #pages .fine, #pages [data-shrink]')].filter(e => getComputedStyle(e).overflow !== 'visible' && vis(e) && !e.closest('[data-contactcard]') && !e.querySelector('*') && getComputedStyle(e).whiteSpace === 'nowrap');
  const unclip = () => clippers().forEach(el => {
    const k = inkOf(el); if(!k) return; const cs = getComputedStyle(el), px = 72 / 96;
    if(k.bottom > k.h + 0.5) el.style.paddingBottom = (parseFloat(cs.paddingBottom) + k.bottom - k.h + 1) * px + 'pt';
    if(k.top < -0.5){ const up = -k.top + 1; el.style.paddingTop = (parseFloat(cs.paddingTop) + up) * px + 'pt'; el.style.top = parseFloat(el.style.top) - up * px + 'pt'; }
  });

  // ---- checks ----  // ---- checks ----
  const vis = e => !!(e.offsetParent || e.getClientRects().length);
  window.brochureCheck = () => {
    const seen = new Set(), out = issues.filter(i => { const k = JSON.stringify(i); return !seen.has(k) && seen.add(k); }), pt = px => px * 72 / 96;
    document.querySelectorAll('[data-slot]').forEach(e => {
      if(e.dataset.twin || !vis(e) || e.closest('[data-contactcard]')) return;
      // photos crop on purpose; slots are measured by width, and by height where they hold several lines (data-lines)
      const wide = e.scrollWidth > e.clientWidth + 1, tall = !!e.dataset.lines && e.scrollHeight > e.clientHeight + 1;
      if(!e.matches('.photo') && (wide || tall)) out.push({kind: 'overflow', slot: e.dataset.slot});
      if(e.dataset.shrink && parseFloat(e.style.fontSize) <= +e.dataset.shrink && e.scrollWidth > e.clientWidth + 1) out.push({kind: 'too-long', slot: e.dataset.slot});
      if(!e.matches('.photo') && !e.textContent.trim()) out.push({kind: 'empty-slot', slot: e.dataset.slot});
    });
    // type size: every element that holds text, 8 pt floor, 6 pt for fine print
    const w = document.createTreeWalker(document.getElementById('pages'), NodeFilter.SHOW_TEXT);
    for(let n; (n = w.nextNode());){
      const el = n.parentElement; if(!n.textContent.trim() || !vis(el) || el.closest('[data-twin]')) continue;
      const s = pt(parseFloat(getComputedStyle(el).fontSize)), fine = el.closest('.fine,.cc-fine,[data-fine]');
      if(s < (fine ? 6 : 8) - 0.01) out.push({kind: 'type-small', slot: el.dataset.slot || el.className || el.tagName, size: +s.toFixed(2)});
    }
    // no letter cut off by its own box (owner 11/13); run again here, after the renderer's own fitting (ShrinkFit) resized type
    unclip();
    clippers().forEach(el => { if(el.dataset.twin || el.closest('[data-twin]')) return; const k = inkOf(el); if(k && (k.bottom > k.h + 0.5 || k.top < -0.5)) out.push({kind: 'letter-clipped', slot: el.dataset.slot || el.className, text: el.textContent.trim().slice(0, 40)}); });
    if(window.ContactCard) out.push(...ContactCard.check(document.querySelector('.trim')).map(c => typeof c === 'string' ? {kind: 'agent-card', detail: c} : c));
    // no price and no QR anywhere on these pieces
    const txt = document.getElementById('pages').innerText;
    if(/\$\s?\d{1,3}(,\d{3})+|\$\s?\d{4,}/.test(txt)) out.push({kind: 'price', detail: 'a dollar amount is printed'});
    return out;
  };
})();
