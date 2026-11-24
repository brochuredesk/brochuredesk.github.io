/* P18 Asymmetric page compositions (11/16/2026). Loaded after as-fo.js: these replace the copied engine's cover, inside pages, back and
   flyer front with the P18 hand; the fill machinery (SW.fill, FO.refit, FO.grow, FO.tableRows2, FXS.captioned, the checks) is unchanged.
   The grid, on every 8.5 x 11 face: a narrow column 180 pt wide at the left margin (36 pt), an 18 pt gutter, a wide column 342 pt
   (234 .. 576), the P18 flyer's own proportion (176 | 16 | 360). The narrow column always sits on the left. */
(function(){
  const esc = SW.esc, M = 36, NX = 36, NW = 180, WX = 234, WW = 342, R = 576, CW = 540, OFF = 16, TRI = 40, BAND = 702;
  FO.AS = {M, NX, NW, WX, WW, R, CW, OFF, TRI, BAND};
  const eye = (t, x, y, w, slot, o) => { o = o || {}; const fs = o.fs || 9.5, ls = o.ls == null ? 2.6 : o.ls;
    return `<div class="as-eye" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${fs*1.3}pt;font-size:${fs}pt;line-height:${fs*1.3}pt;letter-spacing:${ls}pt${o.align ? ';text-align:' + o.align : ''}${o.color ? ';color:' + o.color : ''}" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`; };
  FO.eye = eye;
  const roomName = (D, id) => FO.lead(D, id).split(/ and |, /)[0];
  // a captioned photo whose row is locked (one line count across the row)
  FO.capBlk = (D, c, x, y, w, ph, slot, o) => AS.blk(x, y, w, ph, OFF) + FXS.captioned(D, c, x, y, w, ph, 3, slot, Object.assign({fs: 10, lh: 13.5, min: 3}, o || {})).replace(`top:${y + ph + 7}pt`, `top:${y + ph + OFF + 6}pt`).replace(`top:${y + ph + 25}pt`, `top:${y + ph + OFF + 24}pt`).replace(`data-slot="${slot}" data-room`, `data-slot="${slot}" data-nopair="1" data-room`);
  const capd = (D, c, x, y, w, ph, slot, o) => FXS.captioned(D, c, x, y, w, ph, 3, slot, Object.assign({fs: 10, lh: 13.5, min: 3}, o || {})).replace(`data-slot="${slot}" data-room`, `data-slot="${slot}" data-nopair="1" data-room`);

  // ---------------- COVER: the offset block becomes the page ----------------
  // The house across the page with P18's accent triangle on its corner; the main-color block that sits behind every P18 photo is offset
  // down and right as always, but here it runs on off the right edge and down into the band across the foot, one stepped shape. The
  // band carries the street (the display moment), a white hairline, then the asymmetric grid: one room in the narrow column, the
  // write-up in the wide one. The place sits flush right over the photo. No agent, no brokerage, no facts (owner 11/16 cover review).
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, C = P.as || {};
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), intro = [].concat(o.intro || K.summary || [], F.intro || []);
    const HY = 62; let HH = 340; while(HH < 408 && SW.fits(D, hero, CW, HH + 4)) HH += 4;
    const HB = HY + HH, BT = HB + 20;
    let h = AS.blk(0, 0, 0, 0, 0, {block: [M + 20, HY + 20, 621 - M - 20, BT - HY - 20]}) + `<div class="as-band" style="left:-9pt;top:${BT}pt;width:630pt;height:${801 - BT}pt"></div>`;
    h += FXS.box(D, hero, M, HY, CW, HH, 'front.house') + AS.tri(M, HY, 52);
    const place = [FXS.hood(L), FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, '')].filter(Boolean).join('  ·  ');
    h += eye(place, M + 40, 32, CW - 40, 'front.place', {align: 'right', fs: 10, ls: 3});
    let t = '';
    const ad = String(L.address || ''), as = FXS.fitSize(ad, "font-family:'Red Hat Display';font-weight:700;letter-spacing:-.4pt", CW, 64, 34);
    let y = BT + 22;
    t += `<div class="as-addr" style="left:${M}pt;top:${y}pt;width:${CW}pt;height:${as*1.12}pt;font-size:${as}pt;line-height:${as*1.12}pt;letter-spacing:-.4pt" data-slot="address" data-lines="1">${esc(ad)}</div>`;
    y += as*1.12 + 12;
    t += `<div class="abs" style="left:${M}pt;top:${y}pt;width:${CW}pt;height:1pt;background:rgba(255,255,255,.55)"></div>`;
    y += 20;
    const rowH = 792 - 36 - y, room = (C.cover || P.strip || []).filter(id => id !== hero)[0];
    if(room){ const rh = rowH - 18;
      t += FXS.box(D, room, NX, y, NW, rh, 'front.strip0') + AS.tri(NX, y, 26);
      t += eye(roomName(D, room), NX, y + rh + 6, NW, 'front.strip0.label', {fs: 8.6, ls: 2.2, color: 'var(--as-on-main)'}); }
    if(room){   // owner 11/17 (p40): the write-up runs top to bottom beside the room photo, its first line level with the photo's top and its
      // last line's foot on the photo's foot: larger type (13 to 16 pt) and as many true sentences as fill it (FO.coverSpan sets the leading)
      const rh = rowH - 18, fs = 16, nl = Math.max(3, Math.floor(rh/(fs*1.4))), lh = +(rh/nl).toFixed(2);
      t += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="${[nl, nl - 1, nl - 2].filter(q => q >= 3).join(',')}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${WX}pt;top:${y}pt;width:${WW}pt;height:${nl*lh}pt;font-size:${fs}pt;line-height:${(fs*1.5).toFixed(2)}pt"></div>`).replace('data-slot="front.summary"', `data-slot="front.summary" data-span="${rh.toFixed(2)}" data-cspan="${rh.toFixed(2)}" data-top0="${y}"`); }
    else { const nl = Math.max(3, Math.min(6, Math.floor(rowH/20))), lh = +(rowH/nl).toFixed(2), fs = Math.min(13, +(lh/1.45).toFixed(2));
      t += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="${[nl, nl - 1, nl - 2, nl - 3].filter(q => q >= 3).join(',')}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${room ? WX : M}pt;top:${y}pt;width:${room ? WW : CW}pt;height:${nl*lh}pt;font-size:${fs}pt;line-height:${lh}pt"></div>`).replace('data-slot="front.summary"', `data-slot="front.summary" data-span="${rowH.toFixed(2)}" data-vc="1" data-top0="${y}"`); }
    return h + `<div class="as-onm">${t}</div>`;
  };

  // ---------------- INSIDE: one horizon across the spread ----------------
  // Both pages: the narrow column opens with the accent eyebrow and the page's headline stacked in P18's caps (the flyer's PUBLIC /
  // OPEN HOUSE), the lead room fills the wide column with the main-color block offset behind it and the accent triangle on its corner,
  // both lead photos end on one line (FO.AS.PB); under them a row of rooms set on the grid, standing on a band of the main color that
  // runs across the whole spread (through the fold) and carries their captions in white.
  const PB = 404; FO.AS.PB = PB;
  const head = (D, kicker, title, slot) => { const S = AS.fitStack(String(title || '').replace(/\.$/, ''), NW, 38, 24, 6);
    let h = eye(kicker, NX, 40, NW, slot + '.kicker', {fs: 9.5});
    h += AS.stack(S.lines, NX, 60, NW, S.fs, slot + '.title', {lh: 1.0});
    return {html: h, y: 60 + S.lines.length*S.fs + S.fs*0.12}; };
  const band = (y) => `<div class="as-band" style="left:-9pt;top:${y}pt;width:630pt;height:${801 - y}pt"></div>`;
  const row = (D, cards, y, slot) => { let h = ''; const n = cards.length, ph = BAND - y;
    if(n === 2){ h += capd(D, cards[0], NX, y, NW, ph, slot + '1') + capd(D, cards[1], WX, y, WW, ph, slot + '2'); }
    else if(n >= 3){ const w2 = (WW - 14)/2; h += capd(D, cards[0], NX, y, NW, ph, slot + '1') + capd(D, cards[1], WX, y, w2, ph, slot + '2') + capd(D, cards[2], WX + w2 + 14, y, w2, ph, slot + '3'); }
    else if(n === 1) h += capd(D, cards[0], NX, y, CW, ph, slot + '1');
    return h; };
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, C = P.as || {};
    const kid = C.left || 'kitchen', rowC = FO.cards(D, C.leftRow || []).slice(0, 2);
    const hd = head(D, box.kicker || 'The kitchen', C.leftTitle || I.title, 'left');
    let h = hd.html;
    h += AS.photo(D, kid, WX, 40, WW, PB - 40, 'left.wide', OFF, TRI);
    // the kitchen card: P18's event box (a light tint of the main color with a thin main edge), its rows each a main-color caps label over
    // two full lines of true detail; a row that only repeats what the back's lists print is left out (Night Fade's filter)
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    // the card never restates the page's headline either: a row sentence that is the headline's fact, or shares two of its content words, is left out
    const stemW = t => new Set((String(t).toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length > 3 && !['with', 'that', 'from', 'over', 'into', 'along'].includes(w)).map(w => w.replace(/(ing|es|s)$/, ''))), headT = String(C.leftTitle || I.title || ''), headW = stemW(headT);
    const taken = a => /^(It|Its|They|This|That)\b/.test(a) || SW.grams4(a).some(g => backG.has(g)) || backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w)))) || (headT && (SW.sameFact(headT, a) || [...stemW(a)].filter(w => headW.has(w)).length >= 2));
    const by = hd.y + 16, bh = PB - by, iw = NW - 24;
    const NLr = 1, T = FO.tableRows((box.items || []).slice(0, 10), iw, taken, {stack: true, maxRows: 6, Vs: [iw - 8, iw - 4, iw]});
    let rows = T.rows.filter(r => r.fill >= 0.86); const lh = +(T.f*1.4).toFixed(2), unit = 13 + NLr*lh;
    while(rows.length > 1 && rows.length*unit + (rows.length - 1)*10 + 20 > bh) rows = rows.slice(0, -1);
    const gap = rows.length > 1 ? Math.min(18, (bh - 24 - rows.length*unit)/(rows.length - 1)) : 0, used = rows.length*unit + (rows.length - 1)*gap; let ry = by + (bh - used)/2;
    let b = `<div class="as-tintbox" style="left:${NX}pt;top:${by}pt;width:${NW}pt;height:${bh}pt;border:1pt solid var(--as-mp)"></div>`;
    rows.forEach((r, i) => { if(i) b += `<div class="abs" style="left:${NX + 12}pt;top:${ry - gap/2}pt;width:${iw}pt;height:1pt;background:color-mix(in srgb, var(--as-mp) 35%, transparent)"></div>`;
      b += `<div class="abs lbl" style="left:${NX + 12}pt;top:${ry}pt;width:${iw}pt;font-size:8.6pt;line-height:11pt" data-slot="left.list.l${i}" data-lines="1">${esc(String(r.l).toUpperCase())}</div>`;
      b += `<div class="abs" style="left:${NX + 12}pt;top:${ry + 12}pt;width:${T.V + 1}pt;height:${NLr*lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--as-font);color:var(--as-on);overflow:hidden;white-space:nowrap" data-slot="left.list.t${i}" data-lines="${NLr}">${esc(r.t)}</div>`;
      ry += unit + gap; });
    h += b;
    const y2 = PB + OFF + 26;
    h += band(BAND) + `<div class="as-onm">${row(D, rowC, y2, 'left.photo')}</div>`;
    return h;
  };
  FO.right = (D) => { const K = D.sw || {}, Rr = K.right || {}, P = K.plan || {}, C = P.as || {};
    const ids = [C.right].concat(C.rightRow || []).filter(Boolean), cs = FO.cards(D, ids), top = cs[0], rest = cs.slice(1, 4);
    const hd = head(D, roomName(D, top.photo), C.rightTitle || Rr.title, 'right');
    let h = hd.html;
    h += AS.photo(D, top.photo, WX, 40, WW, PB - 40, 'right.wide', OFF, TRI);
    // the lead room's own write-up in the narrow column beside it, set ragged (a narrow column is never justified), down to the horizon
    const c0 = FXS.augment(D, top), wy = hd.y + 16, wh = PB - wy, lh = 15.5, nw = Math.max(3, Math.floor(wh/lh));
    h += `<div class="abs cap"><div class="a" style="position:absolute;left:${NX}pt;top:${wy}pt;width:${NW}pt;height:${nw*lh}pt;font-size:10.75pt;line-height:${lh}pt" data-slot="right.photo0" data-room="${esc(FXS.leadLabel(top.lead).name)}" data-lh="${lh}" data-hbox="${nw*lh}" data-lines="${nw}" data-try="${nw},${nw - 1},${nw - 2}" data-min="3" data-narrow="0" data-rag="1" data-nofit="1" data-vbox="${wy},${wh}" ${FXS.sd(c0.s)}></div></div>`;
    const y2 = PB + OFF + 26;
    h += band(BAND) + `<div class="as-onm">${row(D, rest, y2, 'right.photo')}</div>`;
    return h;
  };

  // a labeled table row over N full lines (every line 80%+, the last 90%+): FO.tableRows2 generalized to N lines for the narrow column
  FO.tableRowsN = (items0, taken, NL, o) => { o = o || {}; const ok = a => !taken || !taken(a); let best = null;
    for(let f = 9.5; f <= 10.51; f += 0.25) for(const V of (o.Vs || [150])){ const css = `font-family:Outfit;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== NL || Lw.slice(0, -1).some(w => w < 0.8*V) || Lw[NL - 1] < 0.9*V) return; const sc = Lw.reduce((a, b) => a + b, 0)/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 4), score = n*100 + f*2 - V*0.05;
      if(!best || score > best.score) best = {score, f, V, LW: 0, rows: rows.slice(0, o.maxRows || 4)}; }
    return best; };

  // after FO.span: a write-up marked data-vc sits centered top to bottom in its span (owner 11/16: everything centered in its space)
  // the cover write-up beside the room photo: its lines spread so the block runs exactly the photo's height, top on top
  // (optically: the first line's capitals start level with the photo's top edge, the last line's baseline sits on its foot)
  FO.coverSpan = () => document.querySelectorAll('[data-cspan]').forEach(el => { const S = +el.dataset.cspan, n = SW.lines(el).n, fs = parseFloat(getComputedStyle(el).fontSize)*0.75; if(n < 2 || !(S > 0)) return;
    const lh = (S - 0.55*fs)/(n - 1), T = +el.dataset.top0 - (lh - fs)/2 - 0.25*fs;
    el.style.lineHeight = lh + 'pt'; el.style.height = (n*lh) + 'pt'; el.style.top = T + 'pt'; el.dataset.lines = n; });
  FO.centerSpan = () => { FO.coverSpan(); document.querySelectorAll('[data-vc][data-span]').forEach(el => { const S = +el.dataset.span, top0 = +el.dataset.top0, hh = parseFloat(el.style.height); if(!(S > 0) || isNaN(top0)) return; el.style.top = (top0 + (S - hh)/2) + 'pt'; });
    document.querySelectorAll('[data-vbox]').forEach(el => { const [y0, hh] = el.dataset.vbox.split(',').map(Number), n = SW.lines(el).n, lh = parseFloat(el.style.lineHeight); if(!n) return; el.style.height = (n*lh) + 'pt'; el.style.top = (y0 + (hh - n*lh)/2) + 'pt'; }); };

  // ---------------- FLYER FRONT: the Open House flyer's own grid, with the house in place of the event ----------------
  // The narrow column: the place in the accent eyebrow, the street stacked in P18's caps (the flyer's PUBLIC / OPEN HOUSE), a tall room
  // photo. The wide column: the house with the offset block and the accent triangle, the write-up, a second room. The foot: P18's band of
  // the main color, carrying the listing's facts on the flyer's line icons, in white. No agent, no brokerage on the front.
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, C = P.as || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), BT = 738;   // owner 11/17 (p43): a slimmer foot band, the column above it fuller
    let HH = 300; while(HH > 220 && !SW.fits(D, hero, WW, HH)) HH -= 4;
    let h = AS.photo(D, hero, WX, 40, WW, HH, 'front.house', OFF, TRI + 6);
    const S = AS.fitStack(String(L.address || ''), NW, 46, 26, 4); h += AS.stack(S.lines, NX, 40, NW, S.fs, 'address', {lh: 1.0});
    const sy = 40 + S.lines.length*S.fs + 24;
    const strip = (C.flyerStrip || P.flyerStrip || P.strip || []).filter(id => id !== hero).slice(0, 2), LB = BT - 26;
    // the facts on the flyer's line icons, at the foot of the narrow column (the Open House flyer's own place for them)
    // owner 11/17 (p43): the facts in larger type, filling the room under the room photo (up to 21 pt, each still on one line in the column)
    const fx = AS.facts(L).slice(0, 5), nF = fx.length, tot = LB + 8 - sy, ph = Math.max(150, Math.min(NW*1.45, tot - 38 - nF*24)), roomF = tot - 38 - ph;
    let fsz = 10.5; for(let f = 21; f > 10.5; f -= 0.25){ if(nF*f*2.1 <= roomF && fx.every(([ic, tt]) => FXS.width(tt, `font-family:Outfit;font-weight:600;font-size:${f}pt`) + f*2.25 + 4 <= NW)){ fsz = f; break; } }
    const frh = Math.min(fsz*3.2, roomF/Math.max(1, nF)), fy = sy + ph + 38 + (roomF - nF*frh)/2;
    fx.forEach(([ic, t], i) => { h += AS.fact(ic, t, NX, fy + i*frh + (frh - fsz*1.7)/2, NW, fsz, 'front.fact' + i); });
    if(strip[0]){ h += FXS.box(D, strip[0], NX, sy, NW, ph, 'front.strip0') + eye(roomName(D, strip[0]), NX, sy + ph + 6, NW, 'front.strip0.label', {fs: 8.6, ls: 2.2, color: 'var(--as-mp)'}); }
    const wy = 40 + HH + OFF + 20, nl = 5, lh = 17.5, fs2 = 12;
    h += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="6,5,4,3" data-lh="${lh}" ${FXS.sd(intro)} style="left:${WX}pt;top:${wy}pt;width:${WW}pt;height:${nl*lh}pt;font-size:${fs2}pt;line-height:${lh}pt"></div>`).replace('data-slot="front.summary"', `data-slot="front.summary" data-span="${(nl*lh).toFixed(2)}" data-vc="1" data-top0="${wy}"`);
    if(strip[1]){ const py = wy + nl*lh + 20; h += AS.blk(WX, py, WW - OFF, LB - py - 4 - OFF, OFF) + FXS.box(D, strip[1], WX, py, WW - OFF, LB - py - 4 - OFF, 'front.strip1') + eye(roomName(D, strip[1]), WX, LB + 2, WW, 'front.strip1.label', {fs: 8.6, ls: 2.2, color: 'var(--as-mp)'}); }
    // the band: the neighborhood large in white and the city in tracked caps (the flyer's address band, the street being up top)
    h += `<div class="as-band" style="left:-9pt;top:${BT}pt;width:630pt;height:${801 - BT}pt"></div>`;
    const hood = FXS.hood(L) || String(L.city || ''), city = FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, '');
    // a name with a descender (Rice Military) rides up a touch so its ink, not its line box, is centered in the band
    const hs = FXS.fitSize(hood, "font-family:'Red Hat Display';font-weight:700", CW - 200, 30, 18), mid = BT + (792 - BT)/2;
    let f = `<div class="as-addr" style="left:${M}pt;top:${mid - hs*0.6 - (/[gjpqy]/.test(hood) ? 0.095*hs : 0)}pt;width:${CW - 190}pt;height:${hs*1.2}pt;font-size:${hs}pt;line-height:${hs*1.2}pt" data-slot="front.hood" data-lines="1">${esc(hood)}</div>`;
    f += eye(city, R - 190, mid - 7, 190, 'front.place', {fs: 10, ls: 3, align: 'right', color: 'var(--as-on-main)'});
    h += `<div class="as-onm">${f}</div>`;
    return h;
  };

  // after the fill: the inside spread's band starts where the rooms' captions need it. Its top is set 7 pt above the highest room label on
  // either page (one horizon across the fold), and every row photo ends on it, so a caption that took a fourth line never sits under a photo.
  FO.bandFix = () => { const bands = [...document.querySelectorAll('.panel .as-band')].filter(b => Math.abs(parseFloat(b.style.top) - BAND) < 0.5); if(!bands.length) return;
    const lbls = [...document.querySelectorAll('[data-slot^="left.photo"][data-slot$=".label"], [data-slot^="right.photo"][data-slot$=".label"]')].filter(l => !/photo0/.test(l.dataset.slot));
    const caps = [...document.querySelectorAll('.cap .a[data-slot^="left.photo"], .cap .a[data-slot^="right.photo"]')].filter(a => a.dataset.slot !== 'right.photo0');
    if(!caps.length) return;
    // the lowest caption foot fixes the block: label 18 pt over its caption, the band 7 pt over the label
    const deep = Math.max(...caps.map(a => SW.lines(a).n*parseFloat(a.style.lineHeight))), top = Math.min(BAND, 792 - 36 - 18 - deep), pad = (792 - top - 18 - deep)/2;
    caps.forEach(a => { const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight); a.style.top = (top + pad + 18) + 'pt'; a.style.height = (n*lh) + 'pt'; });
    lbls.forEach(l => { l.parentElement.style.top = (top + pad) + 'pt'; });
    bands.forEach(b => { b.style.top = top + 'pt'; b.style.height = (801 - top) + 'pt'; });
    caps.forEach(a => { const ph = document.querySelector(`.ph[data-slot-photo="${a.dataset.slot}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (top - parseFloat(pb.style.top)) + 'pt'; }); };
  FO.frontSnug = () => {};   // the cover write-up keeps its own row (data-span spreads it over the row's height)

  // ---------------- BACK (fold-over) and flyer back ----------------
  // Top: the narrow column carries the eyebrow, the stacked caps headline and the floor-by-floor write-up (ragged, a narrow column); the
  // wide column the listing's own plan in a box the plan's own shape, on the page's paper, with the main-color block offset behind it
  // and the accent triangle on its corner (P18's photo treatment given to the plan). No plan: the big outdoor photo takes that place.
  // Under it, on the same grid: one captioned photo in the narrow column; in the wide column the two lists in P18's event box (a tint
  // of the main color, a thin main edge) and Nearby as the sign-in sheet's numbered squares, the miles inside. The foot: P18's band of
  // the main color across the page, holding the half-height contact card (owner 11/15) and the fine print.
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, C = P.as || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? (C.flyerTop || C.backTop) : C.backTop, footId = hasPlan ? topId : (flyer ? C.flyerFootNoplan : C.backFootNoplan);
    const TOP = 36, BT = 662, LOW = BT - 20;
    let h = '', top;
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 5), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 5), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    // the wide column: the plan (or the outdoor photo)
    const TH = 300; let PXL = WX;
    if(hasPlan){ const pc = FO.planBox(D, WX, TOP, TH, WW); let cw = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])), px = R - cw; const html = pc.html.split(`left:${WX}pt`).join(`left:${px}pt`).replace(/left:(\d+(?:\.\d+)?)pt;top:(\d+(?:\.\d+)?)pt/g, (m, a, b) => m);
      // re-place the plan card at the right edge of the wide column (FO.planBox drew it at WX): redraw there
      const pc2 = px === WX ? pc : FO.planBox(D, px, TOP, TH, WW); issues.push(...pc2.issues); window.planIssues = pc2.issues; top = pc2.bottom;
      h += AS.blk(px, TOP, cw, top - TOP, OFF) + pc2.html + AS.tri(px, TOP, TRI); PXL = px; }
    else { const c = FXS.cardFor(D, topId), ph = TH - OFF - 24 - 3*15.5; h += FO.capBlk(D, c, WX, TOP, WW - OFF, ph, 'back.top', {fs: 11.5, lh: 15.5}) + AS.tri(WX, TOP, TRI); top = TOP + TH; }
    // the narrow column: eyebrow, stacked title, the write-up down to the plan's foot
    const used = FO.cards(D, [topId, footId].filter(Boolean));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const kickT = !hasPlan && (KB.noplan || {}).kicker ? KB.noplan.kicker : +(D.listing || {}).stories > 1 ? 'Floor by floor' : 'Room by room';   // no plan: the eyebrow names what the page shows (the sample's own 'Outside' / 'Outside and floors')
    const ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, '');
    h += eye(kickT, NX, TOP + 4, NW, 'back.about.title');
    let ty = TOP + 22;
    if(ht){ const S = AS.fitStack(ht, NW, 30, 19, 5); h += AS.stack(S.lines, NX, ty, NW, S.fs, 'back.about.head', {lh: 1.0}); ty += S.lines.length*S.fs + 16; }
    { const span = top - ty, lh = 15, n = Math.max(3, Math.floor(span/lh));
      h += FO.full(FO.wu(keep(f2.concat(f1)), NX, ty, PXL - 18 - NX, n*lh + 0.01, 'back.about', 10.25, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-rag="1" data-span="${span.toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`); }
    // Nearby across the page: the sign-in sheet's numbered squares, the miles inside, the unit and the place beside each
    const N0 = (KB.nearby || []).slice(0, 3), SQ = 36, phTry = LOW - SQ - 22 - (top + (hasPlan ? OFF + 22 : 20)) - OFF - 24 - 3*15.5, inBox = phTry < 140, N = inBox ? [] : N0, ny = LOW - SQ;   // Nearby sits low, right over the band (FB5)
    { const cw3 = (CW - 2*18)/3; N.forEach((nn, i) => { const x = M + i*(cw3 + 18), m = /^([\d.,]+)\s*(.*)$/.exec(String(nn.dist).trim()) || [0, nn.dist, ''];
        h += AS.num(x, ny, SQ, m[1]);
        h += `<div class="abs" data-slot="back.near${i}" data-lines="2" data-fine="1" style="left:${x + SQ + 9}pt;top:${ny}pt;width:${cw3 - SQ - 9}pt;height:${SQ}pt;display:flex;flex-direction:column;justify-content:center;white-space:nowrap;overflow:hidden">`
          + `<div style="font-family:var(--as-font);font-weight:600;font-size:8.6pt;line-height:11pt;letter-spacing:1.6pt;color:var(--as-accent)">${esc(String(m[2] || '').toUpperCase())}</div>`
          + `<div style="font-family:var(--as-font);font-weight:600;font-size:10.5pt;line-height:13pt;color:var(--as-on)">${esc(String(nn.place))}</div></div>`; }); }
    const y2 = top + (hasPlan ? OFF + 22 : 20), LB2 = N.length ? ny - 22 : LOW;
    // the lower row: the two lists stacked in P18's event box in the narrow column; a captioned photo in the wide column with the block
    { const bx = NX, by = y2, bw = NW, bh = LB2 - by, iw = bw - 24, n3 = inBox ? N0.length : 0, n1 = Math.min(c1.length, inBox ? 4 : 5), n2 = Math.min(c2.length, inBox ? 3 : 5), nsec = n3 ? 3 : 2;
      const rh = Math.min(25, (bh - 28 - nsec*18 - (nsec - 1)*14)/(n1 + n2 + n3)), ch = nsec*18 + (nsec - 1)*14 + (n1 + n2 + n3)*rh; let yy = by + (bh - ch)/2;
      let t = `<div class="as-tintbox" style="left:${bx}pt;top:${by}pt;width:${bw}pt;height:${bh}pt;border:1pt solid var(--as-mp)"></div>`;
      t += `<div class="abs lbl" style="left:${bx + 12}pt;top:${yy}pt;width:${iw}pt" data-slot="back.updates.title" data-lines="1">${esc(t1.toUpperCase())}</div>` + FXS.bullets(c1, bx + 12, yy + 18, iw, rh, 'back.updates', n1, 9.75).html; yy += 18 + n1*rh + 14;
      t += `<div class="abs lbl" style="left:${bx + 12}pt;top:${yy}pt;width:${iw}pt" data-slot="back.outside.title" data-lines="1">OUTSIDE</div>` + FXS.bullets(c2, bx + 12, yy + 18, iw, rh, 'back.outside', n2, 9.75).html; yy += 18 + n2*rh + 14;
      if(n3) t += `<div class="abs lbl" style="left:${bx + 12}pt;top:${yy}pt;width:${iw}pt" data-slot="back.near.title" data-lines="1">NEARBY</div>` + FXS.bullets(N0.map(nn => `${nn.place}, ${nn.dist}`), bx + 12, yy + 18, iw, rh, 'back.near', n3, 9.75).html;
      h += t; }
    const fc = FXS.cardFor(D, hasPlan ? topId : footId);
    if(fc){ const ph = LB2 - y2 - OFF - 24 - 3*15.5; h += FO.capBlk(D, fc, WX, y2, WW - OFF, ph, 'back.photo1', {fs: 11.5, lh: 15.5}); }
    // the foot band and the contact card on it
    h += `<div class="as-band" style="left:-9pt;top:${BT}pt;width:630pt;height:${801 - BT}pt"></div>`;
    h += `<div class="as-onm">` + FO.fine(D).replace('top:758pt', `top:${BT + 26}pt`) + FO.contact(D, M, BT + 42, CW, FO.CARD_H) + `</div>`;
    return {html: h, issues};
  };
})();
