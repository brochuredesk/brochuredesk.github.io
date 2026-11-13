/* templates/_shared/ohemail.js: the Open House email version (The owner, 10/20/2026; brief docs/briefs/open-house-email-build.md).
   Rebuilt 10/30/2026 from the owner's Book 4 voice review ("nobody consulted a marketing designer"): no more one stack for
   every flyer. Each email is its own recipe of blocks drawn from its print flyer, in that flyer's colors, fonts and
   signature shapes (bands, side banners, triangles, accent blocks, full-bleed and faded heroes, framed photos).

   Standing rules (10/30/2026):
     1. The event details (label, date, time, Refreshments, Special notes) sit in a clear box in the design's own colors
        (white, a light tint, or light gray with a thin accent border). Notable, never cheesy or oversized. The event
        type is set bigger. The agent can resize the box on the proof (openHouse.box.w: a scale, 0.8 to 1.25).
     2. A REALTOR(R) email gives the event room: label, day, time, what's served and the notes read in seconds.
     3. Only the 600 px width is fixed (450 pt, rendered at 2x). Each email runs as long as its design needs, with more
        photos and the write-up already written. The event block stays at the top, above the fold.
     4. No cookie-cutter photo rows: each recipe picks its own photo layout (rows of three, a tall photo beside two,
        a wide photo over two, grids, rounded squares), and `skip` rotates the photos so emails don't share a pair.
     5. The print flyer's design language comes across (the deco list and the block options below).
   Book 4 review rules (10/30/2026 evening):
     - The box behind what's served and the notes is always drawn (white or a design color), never blended in.
     - REALTOR(R) and broker emails: that box is about twice as big, with bigger type (BIG below), and grows or shrinks
       with what the agent types. Print flyers keep their size.
     - Event-box text always grows to fill its box: the label, date and time are set up to the width they have
       (grow(), capped at GROW times their base size), never past it.
   Kept: no price, no QR, no photo numbers, no "virtually staged" labels, city and state only, whole house in every
   front-of-house photo (masked or faded edges only when the house box proves the house stays clear), one logo.
   Event lines come from data (openHouse.*), so every update re-renders at no AI cost.

   Each design folder has email.html (fonts, brand colors) and email.json: one look per flyer, keyed by piece id.
   A look:
     page, ink, accent, muted, dark     the page field and text colors (dark: the card takes the white logo)
     display, dw, italic, caps, track   the display face (label, date, address); labelFont/labelW/labelCaps/labelTrack,
                                        dateFont/dateW when the flyer sets them apart; body, bw: the body face
     align                              'center' | 'left' (the default for every block)
     padL, padR                         side margins (default 24 pt; a side banner widens one)
     blocks                             the email, top to bottom (below)
     deco                               page shapes: {t:'frame', inset, color} | {t:'banner', side, w, color, text, ink}
                                        (a full-height side banner, optional upright text) | {t:'rule', y, h, color}
   Blocks (each takes bg: a field behind it, full width or with side borders (inset); bgTop/bgBottom extend it):
     event   {style:'stack'|'side', box:'all'|'lines'|'none', boxBg, boxLine, boxInk, boxAccent, boxRadius, boxW,
              kicker, labelSize, labelLines, labelInk, dateInk, timeInk, tagInk, lineInk, ink, accent, rule}
             side: {sideW, panel, panelInk, panelLine, timeSize, photo:'hero'|'room', flip, h, lines:{box options below}}
     hero    {mode:'bleed'|'inset'|'field', m, ratio, pick:'straight'|'angled', cut:'angle'|'angleL'|'chevron'|'arc',
              arcLine, fade (color), radius, border:{w, color}, fieldAt, fieldColor, fieldInset, shadow:{dx, dy, color},
              tri:{corner, size, color}}
     address {size, caps, track, facts:'line'|'none', ink, accent, muted, kicker, align}
     facts   {ink, accent, size}                   the flyer's icon row (beds, baths, square feet)
     photos  {layout, h, gap, radius, border, skip, ext, shadow, tri, full}
             layout: row2 row3 row4 verticals3 squares2 squares3 tallL tallR wide2 2wide grid4 mosaic5
     writeup {size, lh, lines, ink, heading, align} the listing's own write-up (already written; no AI call)
     heading {text, ink, size, track}               a small tracked heading the flyer itself uses
     card    {ink, accent, dark, rule}              the shared contact card with the one brokerage logo
     label   {the event options}                   the label alone, when the date sits lower (B02, B03)
     fine, gap {h}, rule {color, w}

   Open House socials (OE.social, the owner 10/30 Part 3) come from the same look, one image per social shape.

   Needs on the page: ivory.js, agentcard.js, ohlib.js. OHEmail.start(fonts, brandVars). */
(function(){
  const W = 450;
  const esc = s => Ivory.esc(s);
  const OE = {W, blocks: {}};

  const STYLE = `
  .page.em{position:relative;overflow:hidden}
  .em .abs{position:absolute}
  .em .photo{position:absolute;overflow:hidden}
  .em .photo img{width:100%;height:100%;object-fit:cover;display:block}
  .em .nw{white-space:nowrap;overflow:hidden}
  .em .wr{white-space:normal;overflow:hidden}`;

  // a color's lightness (any CSS color the canvas knows): true for white, cream and pale tints
  const light = c => { const x = light.c || (light.c = document.createElement('canvas').getContext('2d')); x.fillStyle = '#000'; x.fillStyle = String(c || '');
    const m = x.fillStyle.match(/^#(..)(..)(..)/), v = m ? m.slice(1).map(h => parseInt(h, 16)) : (x.fillStyle.match(/[\d.]+/g) || [0,0,0]).map(Number);
    return .2126*v[0] + .7152*v[1] + .0722*v[2] > 170; };
  const textW = (t, font) => { const c = textW.c || (textW.c = document.createElement('canvas').getContext('2d')); c.font = font; return c.measureText(t).width*72/96; };
  // how many lines a wrapping text needs at this font and width (pt)
  const linesN = (text, font, w, lh) => {
    const m = document.createElement('div');
    m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;font:${font};line-height:${lh}pt;white-space:normal`;
    m.textContent = text; document.body.appendChild(m);
    const n = Math.max(1, Math.round(m.getBoundingClientRect().height*72/96/lh)); m.remove(); return n;
  };

  // n supporting interior photos (never the hero, the food photo or a plan); exteriors only when the listing has no
  // interiors. The social sets use it too (templates/_shared/socialset.js).
  OE.support = (D, hero, n) => {
    const all = OHL.photos(D).filter(id => id !== hero);
    const inside = all.filter(id => !Ivory.fullHouse(D, id) && !/exterior|yard|lawn|aerial|street/i.test((D.photos[id]||{}).tags||''));
    return (inside.length >= n ? inside : inside.concat(all.filter(id => !inside.includes(id)))).slice(0, n);
  };

  // REALTOR(R) and broker emails (The owner 10/30 evening, rule 5): the box with what's served and the notes, about twice the
  // size: line type 14 -> 18 pt, tags 8.5 -> 10.5 pt, more padding
  const BIG = {line: 18, lh: 24, tag: 12.5, tagH: 18, pad: 24};
  const GROW = 1.4;
  // Round 2 review (The owner 10/30 late evening): write-up 15 pt and up (it may step to 16.5 pt so its last line fills);
  // "Houston, TX" a touch bigger (10 -> 12.5 pt); the beds / baths / sq ft line bigger than the write-up (FACTS)
  const WU = {min: 15, max: 16.5, lh: 1.5}, PLACE = 12.5, FACTS = 18;
  // one-line event text grows to fill its width (rule 8): the size at which `text` fills `w` (94%), between base and base*cap
  const grow = (text, font, base, w, cap) => {
    if(!text) return base;
    const k = (w*.94)/Math.max(1, textW(text, font.replace('@', base + 'pt')));
    return Math.max(base, Math.min(base*(cap || GROW), Math.floor(base*k*2)/2));
  };
  OE.grow = grow;

  OE.build = (D, L) => {
    const E = OHL.event(D), Li = D.listing, C = D.companion || {}, O = D.openHouse || {};
    const PL = L.padL != null ? L.padL : 24, PR = L.padR != null ? L.padR : 24, CW = W - PL - PR;
    const disp = w => `${L.italic ? 'italic ' : ''}${w || L.dw || 700}`;
    const caps = on => on ? 'text-transform:uppercase;' : '';
    const used = new Set();
    const hero = OHL.hero(D, (L.blocks.find(b => b.t === 'hero') || {}).pick || '');
    used.add(hero);
    const back = [], h = [];   // fields behind; everything else on top
    let y = 0;
    // where the agent dragged the refreshments / notes box (openHouse.boxAt; the event box by default)
    const boxAt = /^(writeup|photos|card)$/.test(O.boxAt || '') ? O.boxAt : 'event';

    // photos for a layout: interiors first (never the hero, the food photo or a plan), then other exteriors
    const take = (n, o) => {
      const all = OHL.photos(D).filter(id => !used.has(id));
      const out = id => Ivory.fullHouse(D, id) || /exterior|yard|lawn|aerial|street|patio|pool/i.test((D.photos[id]||{}).tags||'');
      let list = o.ext ? all.filter(out).concat(all.filter(id => !out(id))) : all.filter(id => !out(id)).concat(all.filter(out));
      const k = Math.min(o.skip || 0, Math.max(0, list.length - n));
      list = list.slice(k).concat(list.slice(0, k));
      const pick = list.slice(0, n); pick.forEach(id => used.add(id)); return pick;
    };
    const pic = (id, x, y0, w, ht, extra) => OHL.photo(D, id, `left:${x}pt;top:${y0}pt;width:${w}pt;height:${ht}pt${extra || ''}`);
    const rect = (x, y0, w, ht, css) => `<div class="abs" style="left:${x}pt;top:${y0}pt;width:${w}pt;height:${ht}pt;${css}"></div>`;
    const tri = (t, x, y0, w, ht) => {   // a small solid triangle tucked at a photo corner (P18)
      const s = t.size || 26, c = t.color || L.accent;
      const at = {tl: [x - s*0.4, y0 - s*0.4, '0 0,100% 0,0 100%'], br: [x + w - s*0.6, y0 + ht - s*0.6, '100% 0,100% 100%,0 100%'],
                  tr: [x + w - s*0.6, y0 - s*0.4, '0 0,100% 0,100% 100%'], bl: [x - s*0.4, y0 + ht - s*0.6, '0 0,100% 100%,0 100%']}[t.corner || 'tl'];
      return rect(at[0], at[1], s, s, `background:${c};clip-path:polygon(${at[2]})`);
    };
    const shadow = (s, x, y0, w, ht) => rect(x + (s.dx != null ? s.dx : 10), y0 + (s.dy != null ? s.dy : 10), w, ht, `background:${s.color || L.accent}`);

    const B = {};
    B.gap = b => { y += b.h || 16; };
    // the label on its own, at the top (when the flyer sets the date further down, under the house: B02, B03)
    B.label = b => {
      const sv = {date: E.long, time: E.time, refreshments: E.refreshments, note: E.note};
      E.long = E.time = E.refreshments = E.note = '';
      B.event(Object.assign({box: 'none', after: 6}, b));
      Object.assign(E, {long: sv.date, time: sv.time, refreshments: sv.refreshments, note: sv.note});
    };
    B.rule = b => { h.push(rect(PL, y, CW, b.w || .8, `background:${b.color || L.accent};opacity:${b.opacity || .7}`)); y += (b.w || .8) + (b.after || 14); };

    // the event: label (set bigger), date, time, then on broker and REALTOR(R) opens what's served and the notes, each
    // from openHouse.* as typed, never invented, hidden when empty, never shrunk. box 'all' boxes the whole event,
    // 'lines' only what's served and the notes (when the flyer's date block is already its own shape).
    B.event = b => {
      const ink = b.ink || L.ink, acc = b.accent || L.accent, fieldBg = b.boxBg && b.box !== 'lines' && b.box !== 'none' ? b.boxBg : (b.bg || L.page);
      const align = b.align || L.align || 'center', ta = `text-align:${align}`;
      const box = b.box || 'all', scale = Math.max(.8, Math.min(1.25, +((O.box || {}).w) || 1));
      // a refreshments version (b.food) shows the type the agent picked ("Sweets & Coffee") when they typed nothing (11/2/2026)
      const lines = [[E.refreshments || (b.food && E.refreshTitle) || '', E.refreshments ? 'oh.refreshments' : 'oh.refreshTitle', b.refreshTag || 'Refreshments'], [E.note, 'oh.note', b.noteTag || 'Good to know']].filter(l => l[0]);
      if(b.linesOnly && !lines.length) return;
      const pad = box === 'all' ? 18 : 0;
      const bw = Math.min(W - 16, Math.round(CW*(b.boxW || 1)*scale)), bx = (W - bw)/2 + (PL - PR)/2;
      const ix = bx + pad, iw = bw - 2*pad;
      const top = y + (b.top != null ? b.top : 24);
      let yy = top + (box === 'all' ? pad - 2 : 0);
      const at = [];
      if(!b.linesOnly){
        if(b.kicker){ at.push(`<div class="abs nw" data-small="1" style="left:${ix}pt;top:${yy}pt;width:${iw}pt;height:17pt;font:${L.bw || 600} 12.5pt/17pt ${L.body};letter-spacing:2.4pt;text-transform:uppercase;color:${b.kickerInk || acc};${ta}">${esc(b.kicker)}</div>`); yy += 18; }
        const ltr = (L.labelTrack != null ? L.labelTrack : L.track) || 0, lcaps = caps(L.labelCaps != null ? L.labelCaps : L.caps);
        const ltxt = (b.labelLines === 2 ? OHL.labelLines(E.label, 2) : [E.label]).reduce((a, t) => t.length > a.length ? t : a, '');
        // tracking and caps widen the label: measured as set (caps, plus the tracking per letter)
        const lmeas = lcaps ? ltxt.toUpperCase() : ltxt, lbase = b.labelSize || 30;
        const lsz = box === 'none' && !b.growLabel ? lbase : grow(lmeas, `${L.labelW || disp()} @ ${L.labelFont || L.display}`, lbase, iw - ltr*lmeas.length, b.labelGrow || 1.3);
        const lf = `${L.labelW || disp()} ${lsz}pt ${L.labelFont || L.display}`;
        (b.skipLabel ? [] : b.labelLines === 2 ? OHL.labelLines(E.label, 2) : [E.label]).forEach(t => {
          at.push(`<div class="abs nw" data-slot="oh.label" data-lines="1" data-fit="${lsz},${Math.round(lsz*.7)}" data-bg="${fieldBg}" style="left:${ix}pt;top:${yy}pt;width:${iw}pt;height:${lsz*1.22}pt;line-height:${lsz*1.18}pt;font:${lf};${lcaps}letter-spacing:${ltr}pt;color:${b.labelInk || ink};${ta}">${esc(t)}</div>`);
          yy += lsz*1.12;
        });
        if(!b.skipLabel) yy += b.labelGap != null ? b.labelGap : 8;
        if(b.rule){ at.push(rect(align === 'center' ? ix + iw/2 - 30 : ix, yy - 2, 60, 1.6, `background:${acc}`)); yy += 10; }
        if(E.long){   // the date: at least 30 pt (40 px); a weekday date too wide for one line goes to two
          const dfam = L.dateFont || L.display, dwt = L.dateW || L.dw || 700;
          const wide = E.weekday && textW(E.long, `${disp(dwt)} 30pt ${dfam}`) > iw - 2;
          const dbase = b.dateSize || 34, longer = [E.weekday + ',', E.monthDay].reduce((a, t) => String(t).length > a.length ? String(t) : a, '');
          const dsz = grow(wide ? longer : E.long, `${disp(dwt)} @ ${dfam}`, dbase, iw, b.dateGrow || GROW);
          const dt = wide ? `${esc(E.weekday)},<br>${esc(E.monthDay)}` : esc(E.long), dh = wide ? dsz*2.4 : dsz*1.25;
          at.push(`<div class="abs ${wide ? 'wr' : 'nw'}" data-slot="oh.date" data-lines="${wide ? 2 : 1}"${wide ? '' : ` data-fit="${dsz},30"`} data-bg="${fieldBg}" style="left:${ix}pt;top:${yy}pt;width:${iw}pt;height:${dh}pt;font:${disp(dwt)} ${dsz}pt ${dfam};line-height:${wide ? dsz*1.18 : dsz*1.2}pt;color:${b.dateInk || ink};${ta}">${dt}</div>`);
          yy += dh + 2;
        }
        if(E.time){
          const tsz = grow(E.time, `${L.bw || 700} @ ${L.body}`, b.timeSize || 22, iw*.8, b.timeGrow || 1.3), th = tsz*1.36;
          at.push(`<div class="abs nw" data-slot="oh.time" data-lines="1" data-bg="${fieldBg}" style="left:${ix}pt;top:${yy}pt;width:${iw}pt;height:${th}pt;font:${L.bw || 700} ${tsz}pt/${th}pt ${L.body};color:${b.timeInk || acc};${ta}">${esc(E.time)}</div>`);
          yy += th + 4;
        }
      }
      // what's served and the notes (The owner 10/30 late evening, Round 2 ALSO): a full text box of its own, white unless the
      // recipe gives it a design color, on every email that has either one. Nothing entered: no box at all and the email
      // tightens up. Anything entered: the box goes in and grows to fit. Each line keeps its own alignment
      // (openHouse.align.refreshments / .note: one value or one per line), the agent's own photo can sit in it
      // (openHouse.boxPhoto {src, w: share of the box width, align}), and the agent can move the whole box lower in the
      // email (openHouse.boxAt 'writeup' | 'photos' | 'card': under the write-up, under the first photo block, above the card).
      if(lines.length && (b.linesOnly || boxAt === 'event')){
        const inAll = box === 'all' && !b.linesOnly, bp = inAll ? 16 : BIG.pad;
        const outer = inAll ? iw : Math.min(W - 16, Math.round(CW*(b.boxW || 1)*scale));
        const lw = outer - 2*bp, lx = inAll ? ix + bp : (W - outer)/2 + (PL - PR)/2 + bp;
        const ltop = yy + (b.linesOnly ? 0 : inAll ? 12 : 10);
        let ly = ltop + bp - 2;
        const LS = b.lineSize || BIG.line, LH = b.lineLH || BIG.lh, TS = BIG.tag;
        // light text on the white box would vanish (a recipe written for a dark box): dark ink and accent on white instead
        const onLight = light(b.linesBg || '#fff'), tagC = c => onLight && light(c) ? (light(L.accent) ? L.ink : L.accent) : c, inkC = c => onLight && light(c) ? (light(L.ink) ? '#1d1d1b' : L.ink) : c;
        const AL = O.align || {}, alignOf = (slot, i) => { const a = AL[slot.slice(3)]; return (Array.isArray(a) ? a[i] || a[a.length - 1] : a) || align; };
        // refreshments versions of the library (11/2/2026): the matching food photo heads the box, as on the flyer,
        // when something is served and the agent dropped in no photo of their own (b.food: share of the width as height)
        const food = b.food && E.hasRefresh && !(O.boxPhoto && O.boxPhoto.src) && Object.keys(D.photos || {}).find(id => /^food\b/i.test(D.photos[id].tags || ''));
        if(food){ const fh = Math.round(lw*(+b.food || .42)); at.push(pic(food, lx, ly + 2, lw, fh, b.foodRadius ? `;border-radius:${b.foodRadius}pt` : '')); ly += fh + 14; }
        lines.forEach(([t, slot, tag], k) => {
          if(k) ly += 14;
          at.push(`<div class="abs nw" data-tag="${slot}" data-small="1" style="left:${lx}pt;top:${ly}pt;width:${lw}pt;height:${BIG.tagH}pt;font:${L.bw || 700} ${TS}pt/${BIG.tagH}pt ${L.body};letter-spacing:1.8pt;text-transform:uppercase;color:${tagC(b.tagInk || b.boxAccent || acc)};text-align:${alignOf(slot, 0)}">${esc(tag)}</div>`);
          ly += BIG.tagH + 2;
          const f = `${/^oh\.refresh/.test(slot) ? (L.bw || 700) : 500} ${LS}pt ${L.body}`;
          // the agent's mixed sizes, colors and bold per line (rule 5, the proof editor 11/2: openHouse.lineStyle
          // .refreshments / .note, one {size: 's'|'m'|'l', color, bold} per line); never under the 15 pt base x 0.85
          const LST = ((O.lineStyle || {})[slot.slice(3)]) || [];
          String(t).split(/\n/).map(x => x.trim()).filter(Boolean).forEach((part, i) => {
            const st = LST[i] || {}, k = st.size === 'l' ? 1.25 : st.size === 's' ? .87 : 1, lh = Math.round(LH*k*10)/10;
            const fi = k === 1 && !st.bold ? f : `${st.bold ? 800 : f.split(' ')[0]} ${Math.round(LS*k*10)/10}pt ${L.body}`;
            const n = linesN(part, fi, lw, lh);
            at.push(`<div class="abs wr" data-slot="${slot}" data-lines="${n}" style="left:${lx}pt;top:${ly}pt;width:${lw}pt;height:${n*lh}pt;font:${fi};line-height:${lh}pt;color:${st.color ? inkC(st.color) : inkC(b.lineInk || b.boxInk || ink)};text-align:${alignOf(slot, i)}">${esc(part)}</div>`);
            ly += n*lh;
          });
        });
        const BP = O.boxPhoto;
        if(BP && BP.src){   // the agent's own picture (lunch, the title company's logo), resized on the proof
          const pw = Math.round(lw*Math.max(.2, Math.min(1, +BP.w || .5))), ph = Math.round(pw*(+BP.ratio || .62));
          const px = (BP.align || align) === 'left' ? lx : (BP.align || align) === 'right' ? lx + lw - pw : lx + (lw - pw)/2;
          ly += 12;
          at.push(`<div class="photo" data-slot="oh.boxPhoto" style="left:${px}pt;top:${ly}pt;width:${pw}pt;height:${ph}pt"><img src="${esc(BP.src)}" alt="" style="object-fit:${BP.fit || 'cover'}"></div>`);
          ly += ph;
        }
        ly += bp;
        // white on a white event box gets a thin rule in the design's accent so it still stands out
        const lbg = b.linesBg || '#fff', white = /^#fff(fff)?$/i.test(lbg), onWhite = /^#fff(fff)?$/i.test(inAll ? (b.boxBg || '#fff') : (b.bg || L.page));
        const line = b.boxLine || (white && onWhite ? acc : '');
        at.unshift(rect(lx - bp, ltop, lw + 2*bp, ly - ltop, `background:${lbg};${line ? `border:${b.boxLineW || 1}pt solid ${line};` : ''}${b.boxRail ? `border-left:${b.boxRail.w || 6}pt solid ${b.boxRail.color};border-right:${b.boxRail.w || 6}pt solid ${b.boxRail.color};` : ''}box-sizing:border-box;border-radius:${b.boxRadius || 0}pt`).replace('class="abs', 'data-box="oh.lines" class="abs'));
        yy = ly;
      }
      const end = yy + pad;
      if(box === 'all' && !b.linesOnly) at.unshift(rect(bx, top, bw, end - top, `background:${b.boxBg || '#fff'};${b.boxLine ? `border:${b.boxLineW || 1}pt solid ${b.boxLine};` : ''}border-radius:${b.boxRadius || 0}pt`));
      at.forEach(x => h.push(box === 'none' ? x : x.replace('class="abs', 'data-box="oh.box" class="abs')));
      y = end + (b.after != null ? b.after : 22);
    };

    // the side event: the hero (or a room photo) on one side, a color panel beside it with the label, weekday, the date
    // set big and the time (P06, B16, B14). What's served and the notes run full width under it, in their own box.
    B.side = b => {
      const top = y + (b.top != null ? b.top : 24), sw = b.sideW || 168, gap = b.gapW != null ? b.gapW : 10, pw = CW - sw - gap;
      const id = b.photo === 'room' ? take(1, {})[0] : hero;
      let ph = b.h || 250;
      if(id === hero){ const fr = OHL.fitHero(D, hero, pw, ph, true); ph = fr.h; }   // never taller than the house photo allows
      const left = b.flip ? PL + sw + gap : PL, px = b.flip ? PL : PL + pw + gap, panel = b.panel || L.accent, pi = b.panelInk || '#fff';
      h.push(pic(id, left, top, pw, ph));
      const cx = px + 12, cw = sw - 24, ll = OHL.labelLines(E.label, 2), lw0 = ll.reduce((a, t) => t.length > a.length ? t : a, '');
      const lsz = grow(L.caps ? lw0.toUpperCase() : lw0, `${disp()} @ ${L.labelFont || L.display}`, b.labelSize || 22, cw, 1.3);
      const at = [];
      let yy = top + 20;
      OHL.labelLines(E.label, 2).forEach(t => { at.push(`<div class="abs nw" data-slot="oh.label" data-lines="1" data-fit="${lsz},14" data-bg="${panel}" style="left:${cx}pt;top:${yy}pt;width:${cw}pt;height:${lsz*1.2}pt;font:${disp()} ${lsz}pt/${lsz*1.18}pt ${L.labelFont || L.display};${caps(L.caps)}color:${pi};text-align:center">${esc(t)}</div>`); yy += lsz*1.12; });
      yy += 14;
      if(b.tagline){ at.push(`<div class="abs nw" data-small="1" style="left:${cx}pt;top:${yy}pt;width:${cw}pt;height:17pt;font:${L.bw || 700} 12.5pt/17pt ${L.body};letter-spacing:2.2pt;text-transform:uppercase;color:${pi};opacity:.9;text-align:center">${esc(b.tagline)}</div>`); yy += 26; }
      if(E.weekday){ at.push(`<div class="abs nw" data-slot="oh.day" style="left:${cx}pt;top:${yy}pt;width:${cw}pt;height:26pt;font:${L.bw || 700} 20pt/26pt ${L.body};letter-spacing:2.2pt;text-transform:uppercase;color:${pi};text-align:center">${esc(E.weekday)}</div>`); yy += 28; }
      if(E.long){ const t = E.weekday ? `${E.monthShort} ${E.day}` : E.long, ds = grow(t, `${disp(L.dateW)} @ ${L.dateFont || L.display}`, b.dateSize || 40, cw, 1.35);
        at.push(`<div class="abs nw" data-slot="oh.date" data-lines="1" data-fit="${ds},30" data-bg="${panel}" style="left:${cx}pt;top:${yy}pt;width:${cw}pt;height:${ds*1.2}pt;font:${disp(L.dateW)} ${ds}pt/${ds*1.2}pt ${L.dateFont || L.display};color:${pi};text-align:center">${esc(t)}</div>`); yy += ds*1.2 + 2; }
      if(E.time){ const ts = Math.max(b.timeSize || 18, Math.min(24, Math.max(...E.time.split(/ to /).map(x => grow(x, `${L.bw || 700} @ ${L.body}`, b.timeSize || 18, cw, 1.35))))), tl = ts*1.28, n = linesN(E.time, `${L.bw || 700} ${ts}pt ${L.body}`, cw, tl);
        at.push(`<div class="abs wr" data-slot="oh.time" data-lines="${n}" data-bg="${panel}" style="left:${cx}pt;top:${yy}pt;width:${cw}pt;height:${n*tl}pt;font:${L.bw || 700} ${ts}pt/${tl}pt ${L.body};color:${pi};text-align:center;text-wrap:balance">${esc(E.time)}</div>`); yy += n*tl; }
      const bottom = Math.max(top + ph, yy + 18);
      h.push(rect(px, top, sw, bottom - top, `background:${panel}` + (b.panelLine ? `;border:1pt solid ${b.panelLine};box-sizing:border-box` : '')).replace('class="abs', 'data-box="oh.box" class="abs'));
      // the label, date and time sit vertically centered in the panel (The owner 10/30 late evening: P06, P08, every big label box)
      const off = Math.max(0, ((bottom - top) - (yy - top - 20))/2 - 20);
      h.push(`<div class="abs" style="left:0;top:${off}pt;width:0;height:0">${at.join('')}</div>`);
      y = bottom + 14;
      B.event(Object.assign({box: 'lines'}, b.lines || {}, {top: 0, linesOnly: true, after: 14}));
      y += 8;
    };

    // the hero: the whole house, roof to steps, in the flyer's way
    B.hero = b => {
      const mode = b.mode || 'bleed';
      const m = mode === 'bleed' ? 0 : (b.m != null ? b.m : mode === 'field' ? 34 : PL);
      const fw = W - 2*m - (mode === 'bleed' ? 0 : 0), want = Math.round(fw*(b.ratio || .66));
      const fr = OHL.fitHero(D, hero, fw, want, true), hx = (b.x != null ? b.x : m) + (fw - fr.w)/2, top = y + (b.top || 0);
      if(mode === 'field') back.push({y: top + fr.h*(b.fieldAt != null ? b.fieldAt : .34), color: b.fieldColor || L.accent, inset: b.fieldInset || 0});
      if(b.shadow) h.push(shadow(b.shadow, hx, top, fr.w, fr.h));
      const style = `left:${hx}pt;top:${top}pt;width:${fr.w}pt;height:${fr.h}pt` + (b.radius ? `;border-radius:${b.radius}pt` : '') + (b.border ? `;box-shadow:0 0 0 ${b.border.w || 6}pt ${b.border.color || '#fff'}` : '');
      const cuts = {angle: [[0,0],[1,0],[1,.86],[0,1]], angleL: [[0,0],[1,0],[1,1],[0,.86]], chevron: [[0,0],[1,0],[1,.88],[.5,1],[0,.88]], arc: [[0,0],[1,0],[1,.86],[.5,1],[0,.86]]};
      const cut = b.cut && cuts[b.cut] && OHL.polyFits(D, hero, fr.w, fr.h, cuts[b.cut], .015) ? b.cut : '';
      if(cut === 'arc') h.push(OHL.photo(D, hero, style + ';border-radius:0 0 50% 50% / 0 0 14% 14%'));
      else if(cut) h.push(OHL.maskedPhoto(D, hero, style, cuts[cut]));
      else h.push(OHL.photo(D, hero, style));
      // the fade (B01): the photo melts into the page just below the house, only where the house box clears it
      if(b.fade){
        const f = [.26, .2, .14].find(k => OHL.maskFits(D, hero, fr.w, fr.h, 1 - k));
        if(f) h.push(rect(hx, top + fr.h*(1 - f), fr.w, fr.h*f + 1, `background:linear-gradient(to bottom, color-mix(in srgb, ${b.fade} 0%, transparent), ${b.fade})`));
      }
      if(cut === 'arc' && b.arcLine) h.push(`<div class="abs" style="left:${hx}pt;top:${top + fr.h*.5}pt;width:${fr.w}pt;height:${fr.h*.5 + 5}pt;border-bottom:2.5pt solid ${b.arcLine};border-radius:0 0 50% 50% / 0 0 28% 28%"></div>`);
      if(b.tri) h.push(tri(b.tri, hx, top, fr.w, fr.h));
      y = top + fr.h + (b.after != null ? b.after : 20);
    };

    B.address = b => {
      const ta = `text-align:${b.align || L.align || 'center'}`, ink = b.ink || L.ink;
      if(b.kicker){ h.push(`<div class="abs nw" data-small="1" style="left:${PL}pt;top:${y}pt;width:${CW}pt;height:17pt;font:${L.bw || 600} 12.5pt/17pt ${L.body};letter-spacing:2.2pt;text-transform:uppercase;color:${b.accent || L.accent};${ta}">${esc(b.kicker)}</div>`); y += 18; }
      const s = b.size || 26;
      h.push(`<div class="abs nw" data-slot="address" data-lines="1" data-fit="${s},16" style="left:${PL}pt;top:${y}pt;width:${CW}pt;height:${s*1.22}pt;line-height:${s*1.2}pt;font:${L.addrW || disp()} ${s}pt ${L.display};${caps(b.caps)}letter-spacing:${b.track || 0}pt;color:${ink};${ta}">${esc(Li.address)}</div>`);
      y += s*1.24;
      h.push(`<div class="abs nw" data-slot="place" data-lines="1" style="left:${PL}pt;top:${y}pt;width:${CW}pt;height:${PLACE*1.4}pt;font:${L.bw || 600} ${PLACE}pt/${PLACE*1.4}pt ${L.body};letter-spacing:1.6pt;text-transform:uppercase;color:${b.muted || L.muted || ink};${ta}">${esc(OHL.place(Li))}</div>`);
      y += PLACE*1.4 + 5;
      const facts = Ivory.facts(Li).map(t => t.replace(' square feet', ' sq ft')).join('  ·  ');
      if(facts && b.facts !== 'none'){ h.push(`<div class="abs nw" data-slot="facts" data-lines="1" data-fit="${FACTS},${WU.max + 1}" style="left:${PL}pt;top:${y}pt;width:${CW}pt;height:${FACTS*1.4}pt;font:${L.bw || 600} ${FACTS}pt/${FACTS*1.4}pt ${L.body};color:${b.accent || L.accent};${ta}">${esc(facts)}</div>`); y += FACTS*1.4 + 4; }
      y += b.after != null ? b.after : 16;
    };

    B.facts = b => {
      const cells = OHL.factCells(Li); if(!cells.length) return;
      const cw = CW/cells.length, ink = b.ink || L.ink, s = Math.max(FACTS, b.size || 22);
      if(b.rule !== false) h.push(rect(PL, y, CW, .8, `background:${ink};opacity:.3`));
      const top = y + 12;
      cells.forEach(([ic, v, k], i) => {
        const x = PL + i*cw;
        h.push(`<div class="abs" style="left:${x + cw/2 - 11}pt;top:${top}pt;width:22pt;height:22pt">${OHL.icon(ic, 22, b.accent || L.accent)}</div>`);
        h.push(`<div class="abs nw" data-slot="fact.${i}" data-lines="1" style="left:${x}pt;top:${top + 26}pt;width:${cw}pt;height:${s*1.2}pt;font:${disp()} ${s}pt/${s*1.2}pt ${L.display};color:${ink};text-align:center">${esc(String(v))}</div>`);
        h.push(`<div class="abs nw" data-small="1" style="left:${x}pt;top:${top + 28 + s*1.2}pt;width:${cw}pt;height:17pt;font:${L.bw || 600} 12.5pt/17pt ${L.body};letter-spacing:1.2pt;text-transform:uppercase;color:${ink};opacity:.85;text-align:center">${esc(k)}</div>`);
      });
      y = top + 49 + s*1.2;
      if(b.rule !== false) h.push(rect(PL, y, CW, .8, `background:${ink};opacity:.3`));
      y += b.after != null ? b.after : 18;
    };

    B.heading = b => {
      const ta = `text-align:${b.align || L.align || 'center'}`;
      h.push(`<div class="abs nw" style="left:${PL}pt;top:${y}pt;width:${CW}pt;height:16pt;font:${L.bw || 700} ${b.size || 10}pt/16pt ${L.body};letter-spacing:${b.track != null ? b.track : 2.6}pt;text-transform:uppercase;color:${b.ink || L.accent};${ta}">${esc(b.text)}</div>`);
      y += 22;
    };

    // the listing's own write-up (the writer's sentences already on the flyer; no new AI call)
    // The owner 10/30 late evening (Round 2 review, ALSO): the write-up runs side to side, lined up with the left and right
    // edges of the photos (the content column; b.full photos use it too), at WU.min pt or more (READ-1: 15 pt reads at
    // 12 px on a phone). No narrowing: the last line reaches 3/4 by stepping the size up within WU.min..WU.max and the
    // line count (most lines first), never by a narrower column.
    B.writeup = b => {
      const want = Math.max(WU.min, b.size || 0), maxL = Math.max(b.lines || 6, 5);
      const cls = s => { const c = 'em-wu-' + Math.round(s*10);
        if(!document.getElementById(c)){ const st = document.createElement('style'); st.id = c; st.textContent = `.${c}{font:400 ${s}pt ${L.body};line-height:${+(s*WU.lh).toFixed(2)}pt}`; document.head.appendChild(st); }
        return c; };
      let best = null;
      for(let s = want; s <= Math.max(want, WU.max) + .01; s += .25){
        const lh = +(s*WU.lh).toFixed(2), wu = OHL.writeup(D, cls(s), CW, lh, maxL, null);
        if(!wu.text) return;
        const r = {s, lh, wu, score: (wu.fill >= .75 ? 1000 : 0) + wu.n*10 - (s - want)};
        if(!best || r.score > best.score) best = r;
        if(wu.fill >= .75 && wu.n >= maxL - 1) break;
      }
      const {s, lh, wu} = best;
      if(b.heading) B.heading({text: b.heading, ink: b.headInk, align: b.align});
      h.push(`<div class="abs wr ${cls(s)}" data-slot="writeup" data-lines="${wu.n}" style="left:${PL}pt;top:${y}pt;width:${CW}pt;height:${wu.n*lh}pt;color:${b.ink || L.ink};text-align:${b.align || L.align || 'left'}">${esc(wu.text)}</div>`);
      y += wu.n*lh + (b.after != null ? b.after : 22);
    };

    // photo layouts, each email its own
    B.photos = b => {
      const g = b.gap != null ? b.gap : 8, x0 = b.full ? 0 : PL, w0 = b.full ? W : CW, r = b.radius ? `;border-radius:${b.radius}pt` : '';
      const bd = b.border ? `;box-shadow:0 0 0 ${b.border.w || 5}pt ${b.border.color || '#fff'}` : '';
      const lay = b.layout || 'row3', top = y;
      const put = (id, x, yy, w, ht) => { if(!id) return; if(b.shadow) h.push(shadow(b.shadow, x, yy, w, ht)); h.push(pic(id, x, yy, w, ht, r + bd)); };
      let bottom = top;
      const row = (n, ratio) => { const ids = take(n, b); if(!ids.length) return; const pw = (w0 - g*(ids.length - 1))/ids.length, ph = Math.round(b.h || pw*ratio);
        ids.forEach((id, i) => put(id, x0 + i*(pw + g), top, pw, ph)); bottom = top + ph; };
      if(lay === 'row2') row(2, .74);
      else if(lay === 'row3') row(3, .78);
      else if(lay === 'row4') row(4, .82);
      else if(lay === 'verticals3') row(3, 1.32);
      else if(lay === 'squares2') row(2, 1);
      else if(lay === 'squares3') row(3, 1);
      else if(lay === 'tallL' || lay === 'tallR'){   // one tall photo beside two stacked
        const ids = take(3, b), tw = Math.round((w0 - g)*.54), sw = w0 - g - tw, th = b.h || Math.round(tw*1.2), sh = (th - g)/2;
        const tx = lay === 'tallL' ? x0 : x0 + sw + g, sx = lay === 'tallL' ? x0 + tw + g : x0;
        put(ids[0], tx, top, tw, th); put(ids[1], sx, top, sw, sh); put(ids[2], sx, top + sh + g, sw, sh);
        bottom = top + th;
      } else if(lay === 'wide2' || lay === '2wide'){   // a wide photo over (or under) two
        const ids = take(3, b), wh = b.h || Math.round(w0*.52), pw = (w0 - g)/2, ph = Math.round(pw*.74);
        const wy = lay === 'wide2' ? top : top + ph + g, py = lay === 'wide2' ? top + wh + g : top;
        put(ids[0], x0, wy, w0, wh); put(ids[1], x0, py, pw, ph); put(ids[2], x0 + pw + g, py, pw, ph);
        bottom = top + wh + g + ph;
      } else if(lay === 'grid4'){
        const ids = take(4, b), pw = (w0 - g)/2, ph = Math.round(b.h || pw*.74);
        ids.forEach((id, i) => put(id, x0 + (i%2)*(pw + g), top + Math.floor(i/2)*(ph + g), pw, ph));
        bottom = top + (ids.length > 2 ? 2*ph + g : ph);
      } else if(lay === 'mosaic5'){   // two over three, different widths
        const ids = take(5, b), a = Math.round((w0 - g)*.6), c = w0 - g - a, h1 = Math.round(b.h || a*.66), p3 = (w0 - 2*g)/3, h2 = Math.round(p3*.84);
        put(ids[0], x0, top, a, h1); put(ids[1], x0 + a + g, top, c, h1);
        ids.slice(2).forEach((id, i) => put(id, x0 + i*(p3 + g), top + h1 + g, p3, h2));
        bottom = top + h1 + g + h2;
      }
      if(b.tri) h.push(tri(b.tri, x0, top, w0, bottom - top));
      y = bottom + (b.after != null ? b.after : 22);
    };

    B.card = b => {
      const cardH = 200, cw = CW + 12, dark = b.dark != null ? b.dark : L.dark;   // the email card (READ-1): read on a phone
      y += b.top || 0;
      if(b.rule) h.push(rect(PL, y - 12, CW, .8, `background:${b.ink || L.ink};opacity:.3`));
      h.push(OHL.contact(D, {x: PL - 6, y, w: cw, h: cardH, field: dark ? 'dark' : 'paper', tone: dark ? 'dark' : 'light',
        color: b.ink || L.cardInk || L.ink, accent: b.accent || L.cardAccent || L.accent, size: 'email',
        nameFont: L.display, nameWeight: L.dw || 700, bodyFont: L.body}));
      y += cardH + 12;
    };

    B.fine = b => {   // wraps when the brokerage's fine print runs long
      const t = C.fineprint || 'Information deemed reliable but not guaranteed.', n = linesN(t, `400 10pt ${L.body}`, CW, 14);
      h.push(`<div class="abs wr" data-slot="fineprint" data-lines="${n}" data-fine="1" style="left:${PL}pt;top:${y}pt;width:${CW}pt;height:${n*14}pt;font:400 10pt/14pt ${L.body};color:${b.ink || L.muted || L.ink};opacity:.85;text-align:${L.align || 'center'}">${esc(t)}</div>`);
      y += n*14 + (b.after != null ? b.after : 18);
    };

    // run the recipe; a block with bg paints a field behind itself (full width, or inset with side borders)
    const fields = [];
    const evB = L.blocks.find(b => b.t === 'event') || {}, movedBox = () => B.event(Object.assign({box: 'lines'}, evB.style === 'side' ? evB.lines || {} : evB, {top: 0, linesOnly: true, after: 22, bg: undefined}));
    let moved = boxAt === 'event';
    L.blocks.forEach(b => {
      if(!moved && boxAt === 'card' && b.t === 'card'){ movedBox(); moved = true; }
      const t0 = y;
      if(b.t === 'event' && b.style === 'side') B.side(b);
      else if(B[b.t]) B[b.t](b);
      // a set's own block (its signature piece, e.g. the Atlas map), registered by the set's email.html:
      // OHEmail.blocks[name] = (b, ctx) => newY; ctx = {y, W, PL, PR, CW, D, L, push(html), back(html), take, pic, rect, esc}
      else if(OE.blocks[b.t]) y = OE.blocks[b.t](b, {y, W, PL, PR, CW, D, L, push: x => h.push(x), take, pic, rect, esc}) || y;
      if(b.bg) fields.push({y: t0 - (b.bgTop || 0), h: y - t0 + (b.bgTop || 0) + (b.bgBottom || 0), color: b.bg, inset: b.inset || 0});
      if(!moved && (boxAt === 'writeup' && b.t === 'writeup' || boxAt === 'photos' && b.t === 'photos')){ movedBox(); moved = true; }
    });
    const H = Math.round(y);
    back.forEach(f => fields.unshift({y: f.y, h: H - f.y, color: f.color, inset: f.inset}));
    const deco = [];
    (L.deco || []).forEach(d => {
      if(d.t === 'frame') deco.push(rect(d.inset || 10, d.inset || 10, W - 2*(d.inset || 10), H - 2*(d.inset || 10), `border:${d.w || .9}pt solid ${d.color || L.accent};pointer-events:none`));
      if(d.t === 'banner'){
        const x = d.side === 'right' ? W - d.w : 0;
        deco.push(rect(x, d.from || 0, d.w, H - (d.from || 0), `background:${d.color || L.accent}`));
        if(d.text){
          const t = d.text === 'place' ? OHL.place(Li) : d.text, ty = d.textY || Math.round(H*.55);
          deco.push(`<div class="abs nw" data-small="1" style="left:${x + d.w/2 - 150}pt;top:${ty - 8.5}pt;width:300pt;height:17pt;font:${L.bw || 700} 12.5pt/17pt ${L.body};letter-spacing:3pt;text-transform:uppercase;color:${d.ink || '#fff'};text-align:center;transform:rotate(-90deg)">${esc(t)}</div>`);
        }
      }
      if(d.t === 'rule') deco.push(rect(0, d.y === 'bottom' ? H - (d.h || 8) : 0, W, d.h || 8, `background:${d.color || L.accent}`));
    });
    const bg = fields.map(f => rect(f.inset, f.y, W - 2*f.inset, f.h, `background:${f.color}`)).join('');
    return {W, H, html: `<div class="page em" data-page="${esc(D.piece.id)}" style="width:${W}pt;height:${H}pt;background:${L.page}">${bg}${deco.join('')}${h.join('')}</div>`};
  };

  // email checks on top of the print checks
  //  - the date and the time are on the email, visible and readable on their field (The owner 10/30: B08 showed neither)
  //  - the date at least 40 px at 1x, and above the fold (inside the first 600 px)
  OE.check = D => {
    const out = [], px = el => parseFloat(getComputedStyle(el).fontSize), E = OHL.event(D);
    const probe = c => { const p = document.createElement('div'); p.style.color = c; document.body.appendChild(p); const v = getComputedStyle(p).color; p.remove(); return v; };
    // rgb(255 255 255) or color(srgb 1 1 1) (what Chromium returns for color-mix())
    const rgb = s => { const n = (s.replace(/^color\(srgb/, '').match(/[\d.]+/g) || [0,0,0]).slice(0, 3).map(Number); return /^color\(srgb/.test(s) ? n.map(v => v*255) : n; };
    const lum = c => { const [r, g, b] = rgb(c).map(v => { v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v + .055)/1.055, 2.4); }); return .2126*r + .7152*g + .0722*b; };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05)/(Math.min(x, y) + .05); };
    const page = document.querySelector('.page.em').getBoundingClientRect();
    [['oh.date', E.long, 'date'], ['oh.time', E.time, 'time']].forEach(([slot, want, word]) => {
      if(!want) return;
      const els = [...document.querySelectorAll(`[data-slot="${slot}"]`)];
      if(!els.length || !els.map(e => e.textContent).join(' ').trim()){ out.push({slot, kind: 'email-event-missing', detail: `the ${word} is not on the email`}); return; }
      els.forEach(el => {
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        if(r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .5 || r.right > page.right + 1 || r.bottom > page.bottom + 1)
          out.push({slot, kind: 'email-event-missing', detail: `the ${word} is hidden or off the email`});
        else if(el.dataset.bg && ratio(cs.color, probe(el.dataset.bg)) < 3)
          out.push({slot, kind: 'email-event-missing', detail: `the ${word} does not read on its field (contrast ${ratio(cs.color, probe(el.dataset.bg)).toFixed(1)} to 1)`});
      });
    });
    const d = document.querySelector('[data-slot="oh.date"]');
    if(d && px(d) < 39.9) out.push({slot: 'oh.date', kind: 'email-date-small', detail: `date is ${px(d).toFixed(1)} px (40 px minimum)`});
    if(d && (d.getBoundingClientRect().bottom - page.top) > 600) out.push({slot: 'oh.date', kind: 'email-event-low', detail: 'the date sits below the first 600 px (keep the event above the fold)'});
    return out;
  };

  // ---------- Open House socials (The owner 10/30/2026, Part 3; redesigned 10/31 for READ-2) ----------
  // Posts and stories for the open house itself, in the flyer's own look: drawn from the same email recipe (its colors,
  // fonts, event box, hero treatment, banner and frame), so every Open House flyer has a set and every update re-renders
  // at no AI cost. D.piece = {shape, px}; pages in pt at 0.375 pt per PNG pixel (rendered at 2x).
  // READ-2 (The owner 10/30 late evening, docs/reports/social-readability-10-30.md): every line is sized from the phone
  // floors (16 px date, time, address; 12 px anything a reader needs; 10 px small print, at the width each shape shows on
  // a phone), then the layout grows the type and the photos to fill the image: no hole, nothing under the floor.
  //   post, pin     the event in its box, the whole house, the address, the facts line, the card; spare height goes to
  //                 a row of two interiors under the house
  //   story         the house from the top edge, the event, address, facts and card inside the text-safe band (no text
  //                 in the top and bottom 250 px), then two interiors to the bottom edge
  //   square, gbp   the house across the top, then two columns: the event in its box | address, facts and card
  //   wide (X)      the house the full height of the left side, cropped to the house box; the event, address and logo
  //                 in the event's color on the right
  // Too much for a size: the notes go first, then the facts line, then the agent's name and cell (the logo stays),
  // then what's served; the caption carries all of it. Never under the floor.
  OE.social = (D, L) => {
    OHL.houseFromBox(D);   // set data gives the house outline as box (11/2)
    const K = .375, [pxW, pxH] = D.piece.px, W = pxW*K, H = pxH*K, shape = D.piece.shape;
    const E = OHL.event(D), Li = D.listing, A = D.agent || {};
    const evB = L.blocks.find(b => b.t === 'event') || {}, side = evB.style === 'side';
    const heroB = L.blocks.find(b => b.t === 'hero') || {};
    // 'all': the whole event in the box; 'lines': label, date and time on the event's own field, what's served and the
    // notes in the box; side: the flyer's color panel
    const mode = side ? 'side' : (evB.box || 'all');
    const lb = {bg: evB.boxBg || '#fff', line: evB.boxLine || '', ink: evB.boxInk || evB.lineInk || L.ink, tag: evB.tagInk || evB.boxAccent || L.accent};
    const ev = mode === 'side' ? {bg: evB.panel || L.accent, ink: evB.panelInk || '#fff', accent: evB.panelInk || '#fff', line: ''}
      : mode === 'lines' ? {bg: evB.bg || L.page, ink: evB.ink || L.ink, accent: evB.accent || L.accent, line: '',
         label: evB.labelInk, date: evB.dateInk, time: evB.timeInk}
      : mode === 'none' ? {bg: evB.bg || L.page, ink: evB.ink || L.ink, accent: evB.accent || L.accent, line: '', label: evB.labelInk, date: evB.dateInk, time: evB.timeInk}
      : {bg: evB.boxBg || '#fff', ink: evB.boxInk || evB.ink || L.ink, accent: evB.accent || L.accent, line: evB.boxLine || '',
         label: evB.labelInk, date: evB.dateInk, time: evB.timeInk, tag: evB.tagInk || evB.boxAccent, lineInk: evB.lineInk};
    const disp = w => `${L.italic ? 'italic ' : ''}${w || L.dw || 700}`;
    const capsOn = !!(L.labelCaps != null ? L.labelCaps : L.caps);
    const track = (L.labelTrack != null ? L.labelTrack : L.track) || 0;
    const hero = OHL.hero(D, heroB.pick || ''), HP = D.photos[hero] || {};
    const banner = (L.deco || []).find(d => d.t === 'banner'), frame = (L.deco || []).find(d => d.t === 'frame');
    const bw = banner ? Math.round(banner.w*.5) : 0, X0 = banner && banner.side !== 'right' ? bw : 0, X1 = W - (banner && banner.side === 'right' ? bw : 0);
    const rect = (x, y0, w, ht, css) => `<div class="abs" style="left:${x}pt;top:${y0}pt;width:${w}pt;height:${ht}pt;${css}"></div>`;
    const r2 = v => Math.round(v*2)/2;

    // the phone floors in pt for this shape (ReadSize.SHOWN phone widths; 3% to spare)
    const f = pxW/({wide: 330, gbp: 360}[shape] || 393)*K*1.03;
    const FE = Math.ceil(16*f*2)/2, FB = Math.ceil(12*f*2)/2, FS = Math.ceil(10*f*2)/2;

    // measuring (DOM, so letter-spacing and capitals count)
    const meas = document.createElement('div'); document.body.appendChild(meas);
    const tw = (t, css) => { meas.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:nowrap;${css}`; meas.textContent = t; return meas.getBoundingClientRect().width*.75; };
    const tn = (t, css, w, lh) => { meas.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:normal;width:${w}pt;${css};line-height:${lh}pt`; meas.textContent = t; return Math.max(1, Math.round(meas.getBoundingClientRect().height*.75/lh)); };
    // a text item: one line from size down to oneMin, else wrapped (up to `lines`) from size down to min
    const fit = (o, w) => {
      if(!o.text) return null;
      const one = o.oneMin != null ? Math.max(o.min, o.oneMin) : o.min;
      for(let s = Math.max(o.size, one); s >= one - .01; s -= .5) if(tw(o.text, o.face(s)) <= w*.97) return {s, n: 1};
      if((o.lines || 1) > 1){
        const words = o.text.split(/[ \t\n]+/);
        for(let s = Math.max(o.size, o.min); s >= o.min - .01; s -= .5){
          if(Math.max(...words.map(x => tw(x, o.face(s)))) > w*.97) continue;
          const n = tn(o.text, o.face(s), w*.97, s*o.lhK); if(n <= o.lines) return {s, n};
        }
      }
      for(let s = one - .5; s >= o.min - .01; s -= .5) if(tw(o.text, o.face(s)) <= w*.97) return {s, n: 1};
      return null;
    };
    const hOf = (o, r) => r.n*r.s*o.lhK + (r.n > 1 ? r.s*.15 : 0);   // a wrapped display line box runs a little over its line height
    // a wrapped item is set at the width it was measured at (97%), centered in its room
    const put = (o, r, x0, y, w0) => { const w = r.n > 1 ? w0*.97 : w0, x = x0 + (o.align === 'left' ? 0 : (w0 - w)/2); return `<div class="abs ${r.n > 1 ? 'wr' : 'nw'}" data-slot="${o.slot}" data-lines="${r.n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hOf(o, r)}pt;${o.face(r.s)};line-height:${r.s*o.lhK}pt;color:${o.color};text-align:${o.align || 'center'}">${o.html ? o.html(r.s) : esc(o.text)}</div>`; };
    const isDark = c => { const p = document.createElement('div'); p.style.color = c; document.body.appendChild(p); const v = getComputedStyle(p).color; p.remove();
      const n = (v.replace(/^color\(srgb/, '').match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number), [R, G, B] = /^color\(srgb/.test(v) ? n.map(x => x*255) : n;
      return .299*R + .587*G + .114*B < 140; };

    const F = {
      label: s => `font:${L.labelW || disp()} ${s}pt ${L.labelFont || L.display};${capsOn ? 'text-transform:uppercase;' : ''}letter-spacing:${(Math.min(track, 3)*s/22).toFixed(2)}pt`,
      date: s => `font:${disp(L.dateW)} ${s}pt ${L.dateFont || L.display}`,
      time: s => `font:${L.bw || 700} ${s}pt ${L.body}`,
      tag: s => `font:${L.bw || 700} ${s}pt ${L.body};text-transform:uppercase;letter-spacing:${(s*.12).toFixed(2)}pt`,
      line: s => `font:500 ${s}pt ${L.body}`, served: s => `font:${L.bw || 700} ${s}pt ${L.body}`,
      addr: s => `font:${L.addrW || disp()} ${s}pt ${L.display}`,
      place: s => `font:${L.bw || 600} ${s}pt ${L.body};text-transform:uppercase;letter-spacing:${(s*.12).toFixed(2)}pt`,
      facts: s => `font:${L.bw || 600} ${s}pt ${L.body}`,
      name: s => `font:${disp()} ${s}pt ${L.display}`,
      phone: s => `font:${L.bw || 700} ${s}pt ${L.body}`,
    };
    const ALL = [[E.refreshments || ((evB.food || (evB.lines || {}).food) && E.refreshTitle) || '', E.refreshments ? 'oh.refreshments' : 'oh.refreshTitle', 'Refreshments'], [E.note, 'oh.note', 'Good to know']].filter(l => l[0]);

    // ---- the event: label, date (one line, or the weekday over the month and day), time; what's served and the notes
    // o: {lines (subset of ALL), box: draw the box with padding, fillH: the box's height (content centered), maxLines}
    const eventB = (x, y, w, k, o) => {
      const boxed = o.box && mode !== 'none', bp = boxed && !(mode === 'lines' && !evB.bg) ? r2(11*f*Math.min(k, 1.25)) : 0, iw = w - 2*bp, P = [];
      let hh = 0, ok = true, dateS = 0;
      const add = (it, gap) => { const r = fit(it, iw); if(!r){ ok = false; return; } P.push([it, r, hh]); hh += hOf(it, r) + gap; return r; };
      { // the label keeps the flyer's letter-spacing where it fits, else sets tight
        const lab = {slot: 'oh.label', text: E.label.replace(/Open House$/i, m => m.replace(' ', '\u00a0')), face: F.label, size: r2(FE*1.12*k), min: FE, oneMin: FE*1.05, lhK: 1.2, lines: 2, color: inkOn(ev.label || ev.ink, ev.bg, ev.ink)};
        add(fit(lab, iw) ? lab : Object.assign(lab, {face: s => F.label(s).replace(/letter-spacing:[\d.]+pt/, 'letter-spacing:0pt')}), 3*f*k);
      }
      const dt = {slot: 'oh.date', text: E.long, face: F.date, size: r2(FE*1.62*k), min: Math.max(FE + 1, FE*1.3), lhK: 1.16, lines: 1, color: inkOn(ev.date || ev.ink, ev.bg, ev.ink)};
      if(E.long){
        const r = fit(dt, iw);
        if(r){ P.push([dt, r, hh]); hh += hOf(dt, r) + 3*f*k; dateS = r.s; }
        else if(E.weekday){   // two lines: "Wednesday," over "September 29"
          add({slot: 'oh.day', text: E.weekday + ',', face: F.date, size: r2(FE*1.25*k), min: FE, lhK: 1.12, lines: 1, color: inkOn(ev.date || ev.ink, ev.bg, ev.ink)}, 0);
          const md = Object.assign({}, dt, {text: E.monthDay, min: FE + 1});
          const rr = fit(md, iw) ? add(md, 3*f*k) : add(Object.assign(md, {text: `${E.monthShort} ${E.day}`}), 3*f*k); dateS = rr ? rr.s : 0;
        } else { const rr = add(Object.assign({}, dt, {lines: 3, min: FE + 1}), 3*f*k); dateS = rr ? rr.s : 0; }
      }
      if(E.time) add({slot: 'oh.time', text: E.time.replace(/ (am|pm)\b/g, '\u00a0$1'), face: F.time, size: r2(FE*1.08*k), min: FE, oneMin: FE, lhK: 1.24, lines: 2, color: inkOn(ev.time || ev.accent, ev.bg, ev.ink)}, 0);
      // what's served and the notes: in 'lines' mode on their own box inside the event's field
      const inner = mode === 'lines' && o.lines.length, ip = inner ? r2(8*f*Math.min(k, 1.2)) : 0, lw = iw - 2*ip;
      let l0 = 0;
      if(o.lines.length){
        hh += 7*f*k; l0 = hh; hh += ip;
        o.lines.forEach(([t, slot, tag], i) => {
          if(i) hh += 5*f*k;
          const tg = {slot: 'oh.tag', text: tag, face: F.tag, size: r2(FS*1.02*k), min: FS, lhK: 1.3, lines: 1, small: 1, color: inner ? inkOn(lb.tag, lb.bg, lb.ink) : inkOn(ev.tag || ev.accent, ev.bg, ev.ink)};
          const r = fit(tg, lw); if(!r){ ok = false; return; } P.push([tg, r, hh, ip]); hh += hOf(tg, r) + 1.5*f;
          const tx = {slot, text: t, face: /^oh\.refresh/.test(slot) ? F.served : F.line, size: r2(FB*1.06*k), min: FB, lhK: 1.3, lines: o.maxLines || 4, color: inner ? inkOn(lb.ink, lb.bg, lb.ink) : inkOn(ev.lineInk || ev.ink, ev.bg, ev.ink)};
          const r2_ = fit(tx, lw); if(!r2_){ ok = false; return; } P.push([tx, r2_, hh, ip]); hh += hOf(tx, r2_);
        });
        hh += ip;
      }
      const ch = hh, bh = Math.max(o.fillH || 0, ch + 2*bp);
      // o.spread: a tall box spaces its lines out (top, between, bottom) instead of centering the block
      // (11/2/2026) the last line keeps at least 2% of the width under it, clear of the bottom edge (text-past-border):
      // when the even spacing leaves less, the air under the last line is fixed and the rest is spread above it
      const minB = .02*W, sp0 = o.spread && o.fillH && !inner ? (bh - ch - 2*bp)/(P.length + 1) : 0;
      const sp = sp0 && sp0 < minB ? Math.max(0, (bh - ch - 2*bp - minB)/P.length) : sp0, dy = sp0 ? y + bp + sp : y + (bh - ch)/2;
      const html = [];
      if(boxed || o.fillH) html.push(rect(x, y, w, bh, `background:${ev.bg};${boxed && ev.line ? `border:1pt solid ${ev.line};box-sizing:border-box;` : ''}border-radius:${o.fillH ? 0 : evB.boxRadius || 0}pt`).replace('class="abs', 'data-box="oh.box" class="abs'));
      if(inner) html.push(rect(x + bp, dy + l0, iw, ch - l0, `background:${lb.bg};${lb.line ? `border:1pt solid ${lb.line};box-sizing:border-box;` : ''}border-radius:${evB.boxRadius || 0}pt`));
      P.forEach(([it, r, yy, px], i) => html.push(put(it, r, x + bp + (px || 0), dy + yy + i*sp, iw - 2*(px || 0))));
      return {h: bh, html, ok, dateS};
    };

    // ---- the address and the city line
    const addrB = (x, y, w, k, o) => {
      const ad = {slot: 'address', text: Li.address, face: F.addr, size: r2(Math.min(FE*1.3*k, (o.dateS || 99) - 1.5)), min: FE, lhK: 1.15, lines: 2, color: o.ink, align: o.align};
      ad.oneMin = ad.min;   // one line whenever it fits at the floor
      const pl = {slot: 'place', text: OHL.place(Li), face: F.place, size: r2(FS*1.08*k), min: FS, lhK: 1.3, lines: 1, small: 1, color: o.muted || o.ink, align: o.align};
      // one line when it fits; else without "Street" (the print rule, OHL.printStreet) on one line; else two lines
      let ra = fit(Object.assign({}, ad, {lines: 1}), w);
      if(!ra && OHL.printStreet(Li.address) !== Li.address){ const short = Object.assign({}, ad, {text: OHL.printStreet(Li.address), lines: 1}); ra = fit(short, w); if(ra) ad.text = short.text; }
      if(!ra) ra = fit(ad, w);
      const rp = fit(pl, w);
      if(!ra || !rp) return {h: 0, html: [], ok: false};
      const h1 = hOf(ad, ra);
      return {h: h1 + 2*f + hOf(pl, rp), html: [put(ad, ra, x, y, w), put(pl, rp, x, y + h1 + 2*f, w)], ok: true};
    };

    // ---- the facts line: beds, baths, size, then year and lot when they fit (lot before "one story", OHL.factSix)
    // "one story" only when nothing stronger is there (lot size and year beat it; The owner's rule 9)
    const six = OHL.factSix(Li), strong = six.some(([ic]) => ic === 'lot' || ic === 'cal');
    const facts = six.filter(([ic]) => !(ic === 'stories' && strong)).map(([ic, t]) => ic === 'bed' ? t.replace('bedroom', 'bed') : ic === 'bath' ? t.replace(' full bath', ' bath').replace(/, (\d) half/, ', $1 half') : ic === 'area' ? t.replace(' square feet', ' sq ft') : ic === 'cal' ? t.replace('Built in', 'Built') : t);
    const factsB = (x, y, w, k, o) => {
      for(let n = facts.length; n >= Math.min(3, facts.length); n--){
        const it = {slot: 'facts', text: facts.slice(0, n).join('  ·  '), face: F.facts, size: r2(FB*1.12*k), min: FB, lhK: 1.3, lines: 1, color: o.ink, align: o.align};
        const r = fit(it, w); if(r) return {h: hOf(it, r), html: [put(it, r, x, y, w)], ok: true};
      }
      // two (or o.lines) lines, broken only between facts
      for(let n = facts.length; n >= Math.min(3, facts.length) && o.two !== false; n--){
        const it = {slot: 'facts', text: facts.slice(0, n).map(t => t.replace(/ /g, '\u00a0')).join('  ·  '), face: F.facts, size: r2(FB*1.12*k), min: FB, lhK: 1.3, lines: o.lines || 2, color: o.ink, align: o.align};
        const r = fit(it, w); if(r) return {h: hOf(it, r), html: [put(it, r, x, y, w)], ok: true};
      }
      return {h: 0, html: [], ok: false};
    };

    // ---- the social contact card: name and cell set large, REALTOR(R), one brokerage logo (email and website are in the
    // caption). o: {ink, accent, dark, name (false: the logo alone), stack (logo under the name)}
    const hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot;
    const nar = A.nar || /realtor/i.test(A.designation || '');
    const cardB = (x, y, w, k, o) => {
      const html = [], ink = o.ink, acc = o.accent || ink;
      const logo = (lx, ly, lw, lh) => `<div class="abs sc-logo" style="left:${lx}pt;top:${ly}pt;width:${lw}pt;height:${lh}pt;color:${ink}">${OHL.logo(D, o.dark ? 'dark' : 'light', '')}</div>`;
      if(o.name === false || !A.name){
        const lh0 = r2(Math.max(FB*1.8, 24*f)*Math.min(k, 1.2)), lh = o.logoH ? Math.max(lh0, Math.min(o.logoH, w/4.2)) : lh0, lw = Math.min(w, lh*4.2);
        return {h: lh, html: [logo(x + (w - lw)/2, y, lw, lh)], ok: true};
      }
      const labT = A.phoneLabel || 'Call / Text';
      const tryRow = (stack, lab) => {
        const ns = r2(FB*1.5*k), ps = r2(FB*1.18*k);
        const nm = {slot: 'agent.name', text: A.name, face: F.name, size: ns, min: FB*1.1, lhK: 1.14, lines: 1, color: ink, align: stack && !hsOn ? 'center' : 'left'};
        const ds = {slot: 'agent.desig', text: 'REALTOR®', face: F.tag, size: r2(FS*k), min: FS, lhK: 1.25, lines: 1, small: 1, color: acc, align: nm.align};
        const ls = r2(FS*1.0*k);
        const ph = {slot: 'agent.phone', text: `${lab}  ${A.phone || ''}`, face: F.phone, size: ps, min: FB, lhK: 1.25, lines: 1, color: ink, align: nm.align,
          html: s => (lab ? `<span data-small="1" style="${F.tag(Math.max(FS, Math.min(ls, s*.8)))};color:${acc};margin-right:${(s*.45).toFixed(1)}pt">${esc(lab)}</span>` : '') + esc(A.phone || '')};
        const hs0 = hsOn ? 1 : 0, gap = 10*f;
        let lw = stack ? w*.62 : Math.min(w*.34, 150*f), tx = 0;
        const textH = nm.size*1.14 + (nar ? FS*1.25*k + 2 : 0) + ph.size*1.25 + 3*f;
        const hsW = hs0 ? Math.round(textH*.8) : 0;
        const colW = stack ? w - (hs0 ? hsW + gap : 0) : w - lw - 2*gap - (hs0 ? hsW + gap : 0);
        const rn = fit(nm, colW), rd = nar ? fit(ds, colW) : null;
        // the phone line: its label rides on the number's line
        let rp = null;
        for(let s = Math.max(ps, FB); s >= FB - .01; s -= .5){
          const wd = (lab ? tw(lab, F.tag(Math.max(FS, Math.min(ls, s*.8)))) + s*.45 : 0) + tw(A.phone || '', F.phone(s));
          if(wd <= colW*.97){ rp = {s, n: 1, wd}; break; }
        }
        if(!rn || !rp || (nar && !rd)) return null;
        // REALTOR(R) rides on the name's line when it fits there (left-set cards)
        const nW = rn ? tw(A.name, F.name(rn.s)) : 0, dW = rd ? tw('REALTOR®', F.tag(rd.s)) : 0;
        const inl = rd && nm.align === 'left' && nW + 8*f + dW <= colW*.97;
        const th = hOf(nm, rn) + (rd && !inl ? hOf(ds, rd) + 2*f : 0) + 3*f + hOf(ph, rp);
        // o.center (square socials, the owner 11/2): the photo and the agent's lines sit centered as one group above the logo
        const grpW = o.center && stack && hs0 ? hsW + gap + Math.max(inl ? nW + 8*f + dW : Math.max(nW, dW), rp.wd) + 2 : 0;
        const gx = grpW && grpW < w ? x + (w - grpW)/2 : x;
        const out = [], cx = gx + (hs0 ? hsW + gap : 0);
        const tW = grpW && grpW < w ? grpW - hsW - gap : colW;
        if(hs0) out.push(`<div class="abs sc-hs" style="left:${gx}pt;top:${y}pt;width:${hsW}pt;height:${th}pt"><img src="${esc(A.headshot)}" alt=""></div>`);
        let yy = y;
        if(inl){
          out.push(put(nm, rn, cx, yy, nW + 2)); const dx = nW + 8*f;
          out.push(put(ds, rd, cx + dx, yy + rn.s*1.14*.78 - rd.s*1.25*.78, tW - dx));
          yy += hOf(nm, rn);
        } else {
          out.push(put(nm, rn, cx, yy, tW)); yy += hOf(nm, rn);
          if(rd){ yy += 2*f; out.push(put(ds, rd, cx, yy, tW)); yy += hOf(ds, rd); }
        }
        yy += 3*f; out.push(put(ph, rp, cx, yy, tW));
        if(stack){
          const lh = r2(Math.max(rn.s*1.3, FB*2)), lw2 = Math.min(w*.7, lh*4.2);
          out.push(logo(x + (w - lw2)/2, y + th + 8*f, lw2, lh));
          return {h: th + 8*f + lh, html: out, ok: true};
        }
        const lh = Math.max(th, rn.s*1.1);
        out.push(rect(x + w - lw - gap, y + 2, .6, lh - 4, `background:${ink};opacity:.3`));
        out.push(logo(x + w - lw + gap*.2, y, lw - gap*.2, lh));
        return {h: lh, html: out, ok: true};
      };
      return (!o.stack && tryRow(false, labT)) || tryRow(true, labT) || tryRow(true, '') || {h: 0, html: [], ok: false};
    };

    // ---- photos
    const pAR = HP.w && HP.h ? HP.w/HP.h : 1.5;
    const heroMin = w => Math.min(OHL.minFrameH(D, hero, w, 99999), Math.floor(w/pAR));
    // the design's signature shapes on every social (the owner 11/2/2026, Q1: "bring each design's signature shape into every
    // library design's socials"; standing rule: one cohesive package). L.social.sig, drawn around the hero photo:
    //   {t:'cut', cut:'angle'|'angleL'|'chevron'|'arrow'|'arrowL'|'arc', d}   the photo's own cut (only where the house stays whole)
    //   {t:'edge', color, w}            a band along the cut edge under the photo (Chevron's gold rule, Diagonal's rule)
    //   {t:'tab', corner, size, color}  a solid triangle tucked at a photo corner (Asymmetric)
    //   {t:'offset', dx, dy, color}     a color block offset behind the photo (Asymmetric's frame)
    //   {t:'ribbon', color, ink, angle} the writer's kicker (or the facts) on a tilted band across the photo's foot (Angle)
    //   {t:'inline', color, w, inset}   a thin line inside the photo's edge (Twilight Frame, Pale Gallery)
    const SIG = ((L.social || {}).sig || []), sigOf = t => SIG.find(s => s.t === t);
    const CUTS = d => ({angle: [[0,0],[1,0],[1,1-d],[0,1]], angleL: [[0,0],[1,0],[1,1],[0,1-d]], chevron: [[0,0],[1,0],[1,1-d],[.5,1],[0,1-d]],
      arrow: [[0,0],[1-d*.8,0],[1,.5],[1-d*.8,1],[0,1]], arrowL: [[d*.8,0],[1,0],[1,1],[d*.8,1],[0,.5]], arc: [[0,0],[1,0],[1,1-d],[.5,1],[0,1-d]]});
    let HR = null;
    const photo = (id, x, y, w, ht, radius) => {
      const st = `left:${x}pt;top:${y}pt;width:${w}pt;height:${ht}pt` + (radius ? `;border-radius:${radius}pt` : '');
      if(id !== hero || HR) return OHL.photo(D, id, st);
      // the cut's depth steps down (full, 70%, half) until the house stays whole; none fits: a plain frame
      // an edge band with a lift (the owner 11/6, B46B square): the cut and its band end lift pt above the frame's foot, so
      // the band keeps clear air from a box laid just under the photo
      const eg = sigOf('edge'), up = eg && eg.lift ? ((eg.w || 4) + eg.lift)*f/ht : 0, cutAt = d => (CUTS(d)[c.cut] || []).map(([px, py]) => [px, py*(1 - up)]);
      const c = sigOf('cut'), dd = c ? [1, .7, .5].map(k => (c.d || .12)*k).find(d => OHL.polyFits(D, hero, w, ht, cutAt(d), .015)) : null;
      const ok = dd != null && !!CUTS(dd)[c.cut], poly = ok ? cutAt(dd) : null;
      HR = {x, y, w, h: ht, poly, cut: c ? (ok ? c.cut + ':' + dd.toFixed(3) : c.cut + ':none') : SIG.map(t => t.t).join('+')};
      if(ok && c.cut === 'arc') return OHL.photo(D, id, st + `;border-radius:0 0 50% 50% / 0 0 ${Math.round(dd*100)}% ${Math.round(dd*100)}%`);
      return ok ? OHL.maskedPhoto(D, id, st, poly) : OHL.photo(D, id, st);
    };
    // drawn once the layout is done: behind the photo (offset) and over it (edge, tab, ribbon, inline)
    const sigDraw = () => {
      if(!HR || !SIG.length) return {under: '', over: ''};
      let under = '', over = '';
      const {x, y, w, h: ht, poly} = HR, pts = poly || [[0,0],[1,0],[1,1],[0,1]];
      SIG.forEach(s => {
        // the offset block: behind an inset photo; a photo that runs to the page's edge shows only its foot, as a strip
        // dy deep along the photo's whole bottom edge (over the ground, never the band's type)
        if(s.t === 'offset'){ const dx = (s.dx != null ? s.dx : 10)*f, dy = (s.dy != null ? s.dy : 10)*f;
          if(x > 1 && y > 1) under += rect(x + dx, y + dy, w, ht, `background:${s.color || L.accent}`);
          else over += rect(x, y + ht - dy, Math.min(w, W - x), dy, `background:${s.color || L.accent}`); }
        if(s.t === 'inline') over += rect(x + (s.inset || 6)*f, y + (s.inset || 6)*f, w - 2*(s.inset || 6)*f, ht - 2*(s.inset || 6)*f, `border:${(s.w || 1)*f}pt solid ${s.color || '#fff'};box-sizing:border-box;pointer-events:none`);
        // atEdge: only where the photo's side at that corner runs to the page's edge (else the tab would meet a panel)
        if(s.t === 'tab' && s.atEdge && !(/r/.test(s.corner || 'tl') ? x + w >= W - 1 : x <= 1)) return;
        if(s.t === 'tab'){ const z = (s.size || 26)*f, at = {tl: [x - z*.4, y - z*.4, '0 0,100% 0,0 100%'], br: [x + w - z*.6, y + ht - z*.6, '100% 0,100% 100%,0 100%'],
          tr: [x + w - z*.6, y - z*.4, '0 0,100% 0,100% 100%'], bl: [x - z*.4, y + ht - z*.6, '0 0,100% 100%,0 100%']}[s.corner || 'tl'];
          // tucked inside the photo where its corner meets the page's edge
          at[0] = Math.max(x, Math.min(at[0], x + w - z, W - z)); at[1] = Math.max(y, Math.min(at[1], y + ht - z, H - z));
          over += rect(at[0], at[1], z, z, `background:${s.color || L.accent};clip-path:polygon(${at[2]})`); }
        if(s.t === 'edge'){   // the photo's bottom edge (its cut), as a band s.w pt deep just under it
          const bw = (s.w || 4)*f, bot = pts.filter(p => p[1] > .5).sort((a, b) => a[0] - b[0]);
          // with a lift, the band also stops lift pt short of a side that doesn't reach the page's edge (a box beside the photo)
          const lf = s.lift ? s.lift*f : 0, inL = lf && x > 1 ? lf : 0, inR = lf && x + w < W - 1 ? lf : 0, bw2 = w - inL - inR, X = px => ((px*w - inL)/bw2*100).toFixed(2);
          const top = bot.map(([px, py]) => `${X(px)}% ${(py*ht/(ht + bw)*100).toFixed(2)}%`), low = bot.slice().reverse().map(([px, py]) => `${X(px)}% ${((py*ht + bw)/(ht + bw)*100).toFixed(2)}%`);
          over += rect(x + inL, y, bw2, ht + bw, `background:${s.color || L.accent};clip-path:polygon(${top.concat(low).join(',')})`); }
        if(s.t === 'ribbon'){
          const C = D.companion || {}, txt = String((C.listing || {}).kicker || '').trim() || Ivory.factsShort(Li).replace(/  \/  /g, '  ·  ');
          const fs = Math.max(FB, r2(FB*1.05)), rh = r2(fs*2), rw = Math.min(w*.62, tw(txt, F.tag(fs)) + 3*fs), ang = s.angle != null ? s.angle : -4;
          if(tw(txt, F.tag(fs)) + 2*fs <= w*.62)
            over += `<div class="abs" style="left:${x + w - rw + 2}pt;top:${y + ht - rh*.9}pt;width:${rw + 6}pt;height:${rh}pt;background:${s.color || L.accent};transform:rotate(${ang}deg);transform-origin:100% 100%;display:flex;align-items:center;padding-left:${fs*1.2}pt;box-sizing:border-box"><span class="nw" data-slot="kicker" data-lines="1" style="${F.tag(fs)};color:${s.ink || '#161616'};white-space:nowrap">${esc(txt)}</span></div>`;
        }
      });
      return {under, over};
    };
    const row = (x, y, w, ht, n, skip) => {
      const ids = OE.support(D, hero, n + (skip || 0)).slice(skip || 0); if(!ids.length || ht < 30) return '';
      const g = 4*f, pw = (w - (ids.length - 1)*g)/ids.length;
      return ids.map((id, i) => photo(id, x + i*(pw + g), y, pw, ht)).join('');
    };

    // what may be dropped, in order, when a size is full (the caption carries it)
    const optsList = () => {
      const L0 = [], seen = new Set();
      const push = o => { const key = JSON.stringify([o.lines.map(l => l[1]), o.name, o.facts]); if(!seen.has(key)){ seen.add(key); L0.push(o); } };
      const served = ALL.filter(l => /^oh\.refresh/.test(l[1]));
      push({lines: ALL, name: true, facts: true}); push({lines: served, name: true, facts: true}); push({lines: served, name: true, facts: false});
      push({lines: served, name: false, facts: false}); push({lines: [], name: false, facts: false});
      return L0;
    };
    // the largest type scale k (KMAX down to 1) at which `room(k)` stays at or above `need`; null when even 1 doesn't
    const KMAX = {post: 1.3, pin: 1.3, story: 1.3, square: 1.2, gbp: 1.15, wide: 1.1}[shape] || 1.2;
    // under 1 the type steps back toward the floors (never under them) when a size is tight
    const KMIN = .6, bestK = (room, need) => { for(let k = KMAX; k >= KMIN - .001; k -= .025) if(room(k) >= need) return k; return null; };

    const h = [], st = `<style>.em .sc-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
      .em .sc-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
      .em .sc-logo .text{font:${L.bw || 700} ${r2(FB*1.15)}pt/1.15 ${L.body};text-align:center;color:inherit}
      .em .sc-hs{position:absolute;overflow:hidden}.em .sc-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}</style>`;
    let back = rect(0, 0, W, H, `background:${L.page}`);
    const pageDark = isDark(L.page), pageInk = L.ink, muted = L.muted || L.ink;
    // a color that reads on bg (3:1): fg, else the fallback, else white or near-black
    const inkOn = (fg, bg, fb) => reads(fg, bg) ? fg : reads(fb, bg) ? fb : (isDark(bg) ? '#ffffff' : '#161616');
    // the facts line in the accent where it reads on the page (3:1), else in the page's ink
    const rgbOf = c => { const p = document.createElement('div'); p.style.color = c; document.body.appendChild(p); const v = getComputedStyle(p).color; p.remove();
      const n = (v.replace(/^color\(srgb/, '').match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number); return /^color\(srgb/.test(v) ? n.map(x => x*255) : n; };
    const lumOf = c => { const [R, G, B] = rgbOf(c).map(v => { v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v + .055)/1.055, 2.4); }); return .2126*R + .7152*G + .0722*B; };
    const reads = (fg, bg) => { const a = lumOf(fg), b = lumOf(bg); return (Math.max(a, b) + .05)/(Math.min(a, b) + .05) >= 3; };
    const factInk = reads(L.accent, L.page) ? L.accent : pageInk;
    const cardLook = {ink: L.cardInk || pageInk, accent: L.cardAccent || L.accent, dark: pageDark};

    if(shape === 'wide' || shape === 'gbp'){
      // the house top left, the address band under it; beside them the event in its color, the column running the full
      // height, the card under the event. When the house box allows it (wide), the photo runs the full height of the
      // left side and the band lies over its lawn, in the page color at 90%.
      const pad = r2(11*f), hb = HP.house && Ivory.fullHouse(D, hero) ? HP.house : null, evDark = isDark(ev.bg);
      const fin = frame ? 8 + 4*f : 0;   // a frame's line sits 8 pt in: the band's words stay clear of it
      const parts = (pw, k, o) => {
        const cw = X1 - X0 - pw, e = eventB(X0 + pw + pad, 0, cw - 2*pad, k, {lines: o.lines, box: false, maxLines: 3});
        const a = addrB(X0 + pad, 0, pw - 2*pad, k, {dateS: e.dateS, ink: pageInk, muted});
        const fc = o.facts ? factsB(X0 + pad, 0, pw - 2*pad, k, {ink: factInk}) : {h: 0, ok: false};
        const c = cardB(X0 + pw + pad, 0, cw - 2*pad, k, {ink: ev.ink, accent: ev.accent, dark: evDark, name: o.name, stack: true});
        const left = a.h + (fc.ok ? fc.h + 4*f : 0);
        return {ok: e.ok && a.ok && c.ok, e, a, fc, c, cw, left, band: left + 2.4*pad, col: e.h + c.h + 2*pad + 8*f};
      };
      // the photo frame for a left side pw wide: full height when the house box lets the sides go (wide only), else the
      // photo's own shape, trimmed from the ground at most down to the house
      const frameFor = pw => {
        const nat = H*pAR;
        if(shape === 'wide' && hb && (hb.right - hb.left + .05)*nat <= pw && pw <= nat) return {full: true, h: H, top: hb.bottom*H + 8*f};
        // a taller frame than the photo's shape crops the sides, as far as the house box allows
        return {full: false, h: Math.floor(hb ? Math.min(H, Math.max(pw/pAR, pw/((hb.right - hb.left + .05)*pAR))) : pw/pAR), top: heroMin(pw)};
      };
      let pick = null;
      for(const o0 of optsList()) for(const fx of [true, false]){
        if(pick) break;
        const o = Object.assign({}, o0, {facts: fx});
        for(let fr = .72; fr >= .44 && !pick; fr -= .02){
          const pw = Math.round((X1 - X0)*fr), fm = frameFor(pw), r1 = parts(pw, KMIN, o);
          if(!r1.ok || r1.col > H || Math.min(fm.h, H - r1.band) < fm.top) continue;
          const k = bestK(k => { const r = parts(pw, k, o); return r.ok && r.col <= H ? Math.min(fm.h, H - r.band) - fm.top : -1; }, 0) || KMIN;
          pick = {o, k, pw, fm};
        }
      }
      if(!pick){   // nothing fits: the widest house the event column can still hold (the Open House label never drops), the band over the photo's foot
        const bare = {lines: [], name: false, facts: false}; let fb = .6;
        for(let fr = .72; fr >= .3; fr -= .02){ if(parts(Math.round((X1 - X0)*fr), KMIN, bare).e.ok){ fb = fr; break; } }
        const pw = Math.round((X1 - X0)*fb); pick = {o: bare, k: 1, pw, fm: frameFor(pw)}; }
      const {o, k, pw, fm} = pick, P = parts(pw, k, o), P0 = parts(pw, KMIN, o), top = Math.min(fm.h, H - Math.min(P.band, P0.ok ? P0.band : P.band));   // the house takes the height first; the band's type fills what's left
      const fh = fm.full ? H : top;
      if(hb){ const nat = fh*pAR, vis = pw/nat, cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); if(vis < 1) HP.focusX = Math.round(lft/(1 - vis)*1000)/10; }
      h.push(photo(hero, X0, 0, pw, fh));
      // the band under the house: address, city, facts
      h.push(rect(X0, top, pw, H - top, `background:${L.page};${fm.full ? 'opacity:.9;' : ''}`));
      // the band's own type grows to fill it; the facts come in when they fit
      const bandFill = t => { const a = addrB(X0 + pad, 0, pw - 2*pad, t, {dateS: P.e.dateS, ink: pageInk, muted}), fc = factsB(X0 + pad, 0, pw - 2*pad, t, {ink: factInk});
        return {a, fc, ok: a.ok, h: a.h + (fc.ok ? fc.h + 4*f : 0)}; };
      let kB = k, B = bandFill(k);
      if(B.h > H - top - 1.2*pad - fin) B = Object.assign(B, {fc: {ok: false, h: 0}, h: B.a.h});
      let got = false;
      for(let t = 1.5; t > KMIN - .001 && !got; t -= .025){ const b = bandFill(t); if(b.ok && b.fc.ok && b.h <= H - top - 1.2*pad - fin){ kB = t; B = b; got = true; } }
      for(let t = 1.5; t > k && !got; t -= .025){ const b = bandFill(t); if(b.ok && b.h <= H - top - 1.2*pad - fin){ kB = t; B = b; got = true; } }
      const g = (H - fin - top - B.h)/(B.fc.ok ? 2.5 : 2);
      let y = top + g;
      h.push(...addrB(X0 + pad, y, pw - 2*pad, kB, {dateS: P.e.dateS, ink: pageInk, muted}).html);
      if(B.fc.ok){ y += B.a.h + g*.5 + 4*f; h.push(...factsB(X0 + pad, y, pw - 2*pad, kB, {ink: factInk}).html); }
      // the event column, the full height: the event, a short rule, the card, spaced evenly
      back += rect(X0 + pw, 0, P.cw, H, `background:${ev.bg}`);
      const sp = (H - P.e.h - P.c.h)/3;
      h.push(...eventB(X0 + pw + pad, sp, P.cw - 2*pad, k, {lines: o.lines, box: false, maxLines: 3}).html);
      h.push(rect(X0 + pw + P.cw*.38, sp*1.5 + P.e.h, P.cw*.24, .8, `background:${ev.ink};opacity:.35`));
      h.push(...cardB(X0 + pw + pad, sp*2 + P.e.h, P.cw - 2*pad, k, {ink: ev.ink, accent: ev.accent, dark: evDark, name: o.name, stack: true}).html);
    } else if(shape === 'square'){
      // the house across the top; under it the event in its box | the address, facts and card
      const pad = r2(12*f), gut = r2(12*f), inner = X1 - X0 - 2*pad, lw = Math.round((inner - gut)*.53), rw = inner - gut - lw;
      const lx = X0, lW = pad + lw + gut/2, rx = X0 + pad + lw + gut;
      const pnat = Math.floor((X1 - X0)/pAR), pmin = heroMin(X1 - X0);
      const cols = (k, o) => {
        const e = eventB(lx + pad, 0, lW - 2*pad, k, {lines: o.lines, box: false, maxLines: 3});
        const a = addrB(rx, 0, rw, k, {dateS: e.dateS, ink: pageInk, muted});
        const fc = o.facts ? factsB(rx, 0, rw, k, {ink: factInk}) : {h: 0, ok: true};
        const c = cardB(rx, 0, rw, k, Object.assign({name: o.name, stack: true}, cardLook));
        const right = a.h + (o.facts && fc.ok ? fc.h + 6*f : 0) + c.h + 14*f;
        return {ok: e.ok && a.ok && c.ok, band: Math.max(e.h + 2*pad, right + 2*pad), e, a, fc, c, right};
      };
      let pick = null;
      for(const o of optsList()){
        const r1 = cols(KMIN, o); if(!r1.ok || H - r1.band < pmin) continue;
        const need = Math.min(H - r1.band, pmin + .5*(pnat - pmin));
        const k = bestK(k => { const r = cols(k, o); return r.ok ? H - r.band : -1; }, need);
        pick = {o, k: k || KMIN}; break;
      }
      pick = pick || {o: {lines: [], name: false, facts: false}, k: 1};
      const {o, k} = pick, c = cols(k, o);
      const ph = Math.min(pnat, H - c.band), bandY = ph, band = H - ph;
      h.push(photo(hero, X0, 0, X1 - X0, ph));
      // the event's box fills its column from the photo to the bottom edge (text centered in it)
      h.push(rect(lx, bandY, lW, band, `background:${ev.bg}`).replace('class="abs', 'data-box="oh.box" class="abs'));
      // the event's own type grows to fill its box (up to 1.45 x the floors' scale)
      let kE = k; for(let t = Math.max(k, 1.45); t > k; t -= .025){ const e = eventB(lx + pad, 0, lW - 2*pad, t, {lines: o.lines, box: false, maxLines: 3}); if(e.ok && e.h <= band - 1.6*pad - (frame ? 8 + 4*f : 0)){ kE = t; break; } }
      // under a frame the lines spread between the photo and the frame's line (8 pt in from the bottom edge)
      const fin = frame ? 8 + 4*f : 0;
      h.push(...eventB(lx + pad, bandY, lW - 2*pad, kE, {lines: o.lines, box: false, maxLines: 3, fillH: band - fin - (L.squareFill ? .05*W : 0), spread: true}).html.slice(1));
      // a logo with no agent line beside it fills the free space (owner 11/8, logo-adrift): it grows by half the spare height, up to its width
      const SQF = !!L.squareFill, logoOnly = SQF && (o.name === false || !A.name), ins = SQF ? .05*W : 0;
      const cc = logoOnly ? cardB(rx, 0, rw, k, Object.assign({name: o.name, stack: true, logoH: c.c.h + (band - (c.right - 14*f) - ins)*.5}, cardLook)) : c.c;
      const fcOn = o.facts && c.fc.ok, spare = band - ins - (c.right - 14*f) - (logoOnly ? cc.h - c.c.h : 0), g = spare/(fcOn ? 4 : 3);
      let y = bandY + g;
      h.push(...addrB(rx, y, rw, k, {dateS: c.e.dateS, ink: pageInk, muted}).html); y += c.a.h + g*(fcOn ? .6 : 1);
      if(fcOn){ h.push(...factsB(rx, y, rw, k, {ink: factInk}).html); y += c.fc.h + g*1.4; }
      h.push(...cardB(rx, y, rw, k, Object.assign({name: o.name, stack: true, center: !!OE.squareCardCenter, logoH: logoOnly ? cc.h : 0}, cardLook)).html);
    } else {
      // post, pin, story: one column
      const story = shape === 'story', TOP = story ? 94 : 0, BOT = story ? H - 94 : H;
      const pad = r2(16*f), x = X0 + pad, w = X1 - X0 - 2*pad, g = r2(9*f);
      const bleed = story || (heroB.mode !== 'inset' && !heroB.radius), hx = bleed ? X0 : x, hw = bleed ? X1 - X0 : w;
      // an offset block behind an inset photo (Asymmetric) hangs dy below it: the words under the photo start below it (11/6)
      const oS = sigOf('offset'), foot = oS && !bleed ? (oS.dy != null ? oS.dy : 10)*f : 0;
      const parts = (k, o) => {
        const e = eventB(x, 0, w, k, {lines: o.lines, box: true, maxLines: 4});
        const a = addrB(x, 0, w, k, {dateS: e.dateS, ink: pageInk, muted});
        const fc = o.facts ? factsB(x, 0, w, k, {ink: factInk}) : {h: 0, ok: false};
        const c = cardB(x, 0, w, k, Object.assign({name: o.name}, cardLook));
        const fh = fc.ok ? fc.h + g*.5 : 0;
        // story: photo, event, address, facts, card (the card's bottom on the safe line at most); post and pin: event first
        const text = e.h + a.h + fh + c.h + (story ? 3*g : 4*g) + (story ? 0 : pad*.9) + (o.sig ? SIGH + 4*f : 0) + foot;
        return {ok: e.ok && a.ok && c.ok, e, a, fc, fh, c, text, room: (story ? BOT - g : H - pad*.8) - text};
      };
      // a set's own signature drawing (Atlas: the street map; window.SocialSignature, see templates/_shared/socialset.js)
      // takes the interiors' row under the house, kept before anything else is dropped (owner 10/31, standing rule 7)
      const SG = window.SocialSignature, SIG = SG && (!SG.on || SG.on(D)) ? SG : null, SIGH = !SIG ? 0 : typeof SIG.min === 'function' ? Math.round(H*SIG.min(shape)) : story ? 0 : Math.round(H*(SIG.min || .2));   // min: a share of the height, or by shape (stories too)
      const opts = SIGH ? optsList().map(o => Object.assign({sig: true}, o)).concat(optsList()) : optsList();
      // the house may narrow (an interior beside it, or centered) before anything the reader needs is dropped
      let pick = null;
      for(const o of opts){
        const r1 = parts(KMIN, o); if(!r1.ok) continue;
        for(const sc of [1, .78, .7]){
          const hw2 = Math.round(hw*sc), pmin = heroMin(hw2), pnat = Math.floor(hw2/pAR);
          if(r1.room < pmin) continue;
          const need = Math.min(r1.room, story ? pnat : pmin + .6*(pnat - pmin));
          const k = bestK(k => { const r = parts(k, o); return r.ok ? r.room : -1; }, need);
          pick = {o, k: k || KMIN, hw2}; break;
        }
        if(pick) break;
      }
      pick = pick || {o: {lines: [], name: false, facts: false}, k: 1, hw2: hw};
      const {o, k, hw2} = pick, P = parts(k, o), pnat = Math.floor(hw2/pAR);
      let ph = Math.min(pnat, P.room), spare = P.room - ph;
      // too little spare for a row of interiors: the house frame grows taller instead (its sides crop, never the house)
      const hb = HP.house && Ivory.fullHouse(D, hero) ? HP.house : null;
      if(!story && spare < 60*f && hb){ const phMax = Math.floor(hw2/((hb.right - hb.left + .05)*pAR)), add = Math.min(spare, Math.max(0, phMax - ph)); ph += add; spare -= add; }
      if(hb && ph > hw2/pAR){ const nat = ph*pAR, vis = hw2/nat, cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; }
      // a narrowed house: an interior fills the side when there's room for one, else the house sits centered
      const sideW = hw - hw2 - 4*f, side = sideW >= 60*f && OE.support(D, hero, 1).length;
      const heroAt = (yy, rad) => side ? photo(hero, hx, yy, hw2, ph, rad) + row(hx + hw2 + 4*f, yy, sideW, ph, 1) : photo(hero, hx + (hw - hw2)/2, yy, hw2, ph, rad);
      const rad = heroB.radius && !bleed ? heroB.radius : 0;
      if(story){
        h.push(heroAt(0, 0));
        let y = ph + g;
        h.push(...eventB(x, y, w, k, {lines: o.lines, box: true, maxLines: 4}).html); y += P.e.h + g;
        h.push(...addrB(x, y, w, k, {dateS: P.e.dateS, ink: pageInk, muted}).html); y += P.a.h + g*.5;
        if(P.fh){ h.push(...factsB(x, y, w, k, {ink: factInk}).html); y += P.fh; }
        y += g*.5;
        h.push(...cardB(x, y, w, k, Object.assign({name: o.name}, cardLook)).html); y += P.c.h + g;
        // two interiors from under the card to the bottom edge (pictures may sit in the bottom 250 px; text may not)
        // with a signature: it fills the text-safe space under the card, two interiors under it to the bottom edge
        h.push(SIG ? SIG.html(X0, y, X1 - X0, BOT - y) + row(X0, BOT + 4*f, X1 - X0, H - BOT - 4*f, 2, side ? 1 : 0) : row(X0, y, X1 - X0, H - y, 2, side ? 1 : 0));
      } else {
        // spare height: a row of two interiors under the house when there's room for one, else more air
        const rowH = o.sig ? SIGH + spare : spare >= 60*f ? spare - 4*f : 0;
        // no row: the event's own type grows into the spare height first (up to 1.6 x the floors' scale)
        let kE = k, eh = P.e.h;
        if(!rowH) for(let t = 1.6; t > k; t -= .025){ const e = eventB(x, 0, w, t, {lines: o.lines, box: true, maxLines: 4}); if(e.ok && e.h - P.e.h <= spare*.8){ kE = t; eh = e.h; break; } }
        const gs = rowH ? 0 : (spare - (eh - P.e.h))/5;
        let y = pad*.9 + gs*.6;
        h.push(...eventB(x, y, w, kE, {lines: o.lines, box: true, maxLines: 4}).html); y += eh + g + gs;
        h.push(heroAt(y, rad)); y += ph + foot;
        if(rowH){ h.push(o.sig ? SIG.html(hx, y + 4*f, hw, rowH) : row(hx, y + 4*f, hw, rowH, 2, side ? 1 : 0)); y += rowH + 4*f; }
        y += g + gs;
        h.push(...addrB(x, y, w, k, {dateS: P.e.dateS, ink: pageInk, muted}).html); y += P.a.h + g*.5;
        if(P.fh){ h.push(...factsB(x, y, w, k, {ink: factInk}).html); y += P.fh; }
        y += g*.5 + gs;
        h.push(...cardB(x, y, w, k, Object.assign({name: o.name}, cardLook)).html);
      }
    }
    const SG = sigDraw();
    meas.remove();
    if(banner) back += rect(banner.side === 'right' ? W - bw : 0, 0, bw, H, `background:${banner.color || L.accent}`);
    back += SG.under; h.push(SG.over);
    const fr = frame ? rect(8, 8, W - 16, H - 16, `border:.8pt solid ${frame.color || L.accent};box-sizing:border-box;pointer-events:none`).replace('class="abs', 'data-frame="1" class="abs') : '';
    return {W, H, html: `<div class="page em" data-page="${esc(D.piece.id)}"${HR ? ` data-sig="${HR.cut}"` : ''} style="width:${W}pt;height:${H}pt;background:${L.page}">${st}${back}${h.join('')}${fr}</div>`};
  };

  OE.start = (fonts, brandVars) => {
    const D = Ivory.data();
    if(!D.listing){ document.getElementById('pages').innerHTML = '<p style="padding:20pt">No data injected.</p>'; return; }
    D.listing.neighborhood = '';
    OHL.useData(D);
    const L = Object.assign({}, D.emailLook || {});
    OE.L = L;   // the resolved look (the carousel plan reads it)
    const st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);
    if(brandVars) brandVars(D);
    // a page in a light tint of the main color (B47 Itinerary, as its flyer; 11/2/2026): L.paperTint is the share of white;
    // the agent's own background pick (openHouse.paper) wins
    if(L.paperTint){ const k = OHL.colors(D), paper = (D.openHouse || {}).paper || OHL.mix(k.main, '#ffffff', +L.paperTint), rs = document.documentElement.style;
      rs.setProperty('--paper', paper); rs.setProperty('--on-paper', OHL.on(paper));
      rs.setProperty('--accent-on-paper', OHL.readable(k.accent, paper)); rs.setProperty('--main-on-paper', OHL.readable(k.main, paper)); }
    // a face given as a design token (var(--font-display)) is read after the brand kit is applied (an agent's own fonts)
    const root = getComputedStyle(document.documentElement);
    ['display', 'body', 'labelFont', 'dateFont'].forEach(k => { const m = /^var\((--[\w-]+)\)$/.exec(L[k] || ''); if(m) L[k] = root.getPropertyValue(m[1]).trim() || L[k]; });
    const want = fonts.concat([`${L.dw || 700} 20px ${L.display}`, `400 12px ${L.body}`, `500 12px ${L.body}`, `${L.bw || 700} 12px ${L.body}`,
      L.italic ? `italic ${L.dw || 700} 20px ${L.display}` : '',
      L.labelFont ? `${L.labelW || 700} 20px ${L.labelFont}` : '', L.dateFont ? `${L.dateW || 700} 20px ${L.dateFont}` : ''].filter(Boolean));
    window.brochureReady = Promise.all([...want.map(f => document.fonts.load(f).catch(() => 0)), OHL.cardReady]).catch(()=>{}).then(() => {
      // carousel slides (templates/_shared/carousel.js, the owner 11/1): every photo with its two lines, in the flyer's look
      const cs = D.piece.shape === 'slide' && window.Carousel ? Carousel.slide(D, L, D.piece.px[0]*.375, D.piece.px[1]*.375) : null;
      const f = cs ? {W: cs.W, H: cs.H, html: `<div class="page em" data-page="${esc(D.piece.id)}" style="width:${cs.W}pt;height:${cs.H}pt;background:${cs.field}">${cs.html}</div>`}
        : D.piece.shape ? OE.social(D, L) : OE.build(D, L);
      document.getElementById('pages').innerHTML = f.html;
      Ivory.shapeLogos();
      OHL.fitAll();
      // the address never outsizes the date (the date stays the largest type)
      const dt = document.querySelector('[data-slot="oh.date"]'), ad = document.querySelector('[data-slot="address"]');
      // (10/30 evening: "bigger address" on most cards; the address may come within 1 pt of the date)
      if(dt && ad && parseFloat(ad.style.fontSize) >= parseFloat(dt.style.fontSize)) OHL.fit(ad, parseFloat(dt.style.fontSize) - 1, 16);
      const imgs = [...document.querySelectorAll('.cc img, .photo img')].map(i => i.complete ? 0 : new Promise(r => { i.addEventListener('load', r, {once:true}); i.addEventListener('error', r, {once:true}); }));
      return Promise.all(imgs).then(OHL.cardFonts).then(() => document.fonts.ready).then(() => {
        const card = OHL.fitCards();
        window.pieceSize = {W: f.W, H: f.H, bleed: 0};
        window.brochureCheck = () => OHL.check(card.concat(D.piece.shape ? [] : OE.check(D))).concat(cs ? Carousel.check(D) : []);
      });
    });
  };
  window.OHEmail = OE;
})();
