/* Marquee page layouts (11/16/2026). Loaded after mq-fo.js: the fill engine, the checks and the plan/contact plumbing come from the
   pilot (twilight-frame, as carried by mq-fo.js); every page below is drawn new in the hand of the approved Open House library flyer
   P51 Marquee and its sign-in sheet:
     the brand's MAIN color is the field, edge to edge; the brand's DARK is the leaf (P51's calendar leaf: a panel at the right of a block
     that holds one huge Anton numeral over a short accent rule); the ACCENT is the seam (a 4 pt line where a block meets a photo, edge to
     edge) and the tracked caps; Anton capitals at poster scale for the one display line of a page, the street and every numeral; Work Sans
     for the rest; the sign-in sheet's numbered squares (an Anton numeral reversed out of a square) for every numbered list.
   Panel coordinates in pt, trim 612 x 792, bleed to -9 / 621 / 801. Photos at the fold stop 3.6 pt short of it (owner 11/16). */
(function(){
  const esc = SW.esc, X0 = 36, X1 = 576, CW = X1 - X0, GAPF = 3.6;
  const AF = 'font-family:Anton;letter-spacing:.5pt';
  FO.aw = (t, f) => FXS.width(String(t).toUpperCase(), `${AF};font-size:${f}pt`);
  FO.afit = (t, w, max, min) => { let f = max; while(f > (min || 8) && FO.aw(t, f) > w) f -= 0.5; return f; };
  FO.feet = s => { const m = String(s || '').match(/(\d+)'\s*(?:\d+")?\s*x\s*(\d+)'/i); return m ? `${m[1]}' x ${m[2]}'` : ''; };
  // the poster line: the words of t split into 1..nMax lines (in order), each line as wide as the column allows, all one size; the split
  // with the largest size wins (a fewer-line split wins a tie within 4%). Returns {lines, f, lh}.
  FO.poster = (t, w, hMax, maxF, minF, nMax, k) => { k = k || 1.0; const W = String(t).toUpperCase().split(/\s+/).filter(Boolean); let best = null;
    const parts = (i, n) => { if(n === 1) return [[W.slice(i).join(' ')]]; const out = []; for(let j = i + 1; j <= W.length - n + 1; j++) parts(j, n - 1).forEach(r => out.push([W.slice(i, j).join(' ')].concat(r))); return out; };
    for(let n = 1; n <= Math.min(nMax, W.length); n++) parts(0, n).forEach(ls => { let f = Math.min(maxF, hMax/(n*k)); ls.forEach(l => { f = Math.min(f, FO.afit(l, w, f, minF)); }); f = Math.max(minF, Math.floor(f*2)/2);
      if(!best || f > best.f*1.04 || (f > best.f && n <= best.lines.length)) best = {lines: ls, f, lh: +(f*k).toFixed(2)}; });
    return best; };
  FO.posterHtml = (P, x, y, w, slot, o) => { o = o || {}; return P.lines.map((l, i) => `<div class="mq-hl${o.ac && i === o.ac - 1 ? ' ac' : ''}" style="left:${x}pt;top:${y + i*P.lh}pt;width:${w}pt;height:${P.lh}pt;font-size:${P.f}pt;line-height:${P.lh}pt;text-align:${o.al || 'left'}" data-slot="${slot}${i ? '.' + i : ''}" data-lines="1">${esc(l)}</div>`).join(''); };
  FO.bal2 = (t, maxW, maxF, minF) => { t = String(t).toUpperCase(); const W = t.split(/\s+/); for(let f = maxF; f >= minF; f -= 0.5){ if(FO.aw(t, f) <= maxW) return {lines: [t], f, w: FO.aw(t, f)};
      let best = null; for(let i = 1; i < W.length; i++){ const a = W.slice(0, i).join(' '), b = W.slice(i).join(' '), wa = FO.aw(a, f), wb = FO.aw(b, f), m = Math.max(wa, wb); if(m <= maxW && Math.min(wa, wb)/m >= 0.78 && (!best || m < best.w)) best = {lines: [a, b], f, w: m}; } if(best) return best; }
    return {lines: [t], f: minF, w: maxW}; };
  // the leaf card's rows: each row the fullest true wording that sets in two or three full lines (every line 80%+, the last 90%+), all
  // rows one size and measure; as many rows as fit the room (most rows first, then the bigger size)
  FO.rowsN = (items0, taken, o) => { const ok = a => !taken || !taken(a); let best = null;
    for(let f = 9.5; f <= 11.51; f += 0.25) for(const V of o.Vs){ const css = `font-family:WorkSans;font-weight:400;font-size:${f}pt`, lh = f*1.4;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1, bn = 0;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const Lw = FO.wrapW(t, css, V), n = Lw.length; if(n < 2 || n > 4 || Lw.slice(0, -1).some(x => x < 0.8*V) || Lw[n - 1] < 0.9*V) return; const sc = (5 - n)*3 + Lw.reduce((a, b) => a + b, 0)/V/n; if(sc > bs){ bs = sc; bt = t; bn = n; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt, n: bn}; }).filter(r => r.t);
      const kept = []; let used = 0; for(const r of rows){ const hh = 13 + r.n*lh + 12; if(kept.length < o.maxRows && used + hh <= o.room){ kept.push(r); used += hh; } }
      const score = Math.min(kept.length, 5)*100 + f*4 + V*0.05;
      if(!best || score > best.score) best = {score, f, V, rows: kept}; }
    return best; };
  FO.seam = (y, x0, x1, t) => { t = t || 4; return `<div class="mq-seam" style="left:${x0}pt;top:${y - t/2}pt;width:${x1 - x0}pt;height:${t}pt"></div>`; };
  FO.kk = (t, x, y, w, slot, o) => { o = o || {}; const fs = o.fs || 9.5, ls = o.ls == null ? 3.6 : o.ls, al = o.al || 'left';
    let f = fs; while(f > 8.6 && FXS.width(String(t).toUpperCase(), `font-family:WorkSans;font-weight:700;letter-spacing:${ls}pt;font-size:${f}pt`) > w - 2) f -= 0.25;
    let l = ls; while(l > 0.6 && FXS.width(String(t).toUpperCase(), `font-family:WorkSans;font-weight:700;letter-spacing:${l}pt;font-size:${f}pt`) > w - 2) l -= 0.4;
    return `<div class="mq-kk${o.w ? ' w' : ''}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${f*1.3}pt;font-size:${f}pt;line-height:${f*1.3}pt;letter-spacing:${l}pt;text-align:${al}${o.color ? ';color:' + o.color : ''}" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`; };
  FO.sq = (n, x, y, s, cls) => `<div class="mq-sq ${cls || ''}" style="left:${x}pt;top:${y}pt;width:${s}pt;height:${s}pt;font-size:${(s*0.62).toFixed(1)}pt">${esc(String(n))}</div>`;
  // a stack of blocks centered top to bottom between y0 and y1: items [{h, html: y => ''}] (the leaf, a head band)
  FO.vstack = (items, y0, y1) => { const tot = items.reduce((s, it) => s + it.h, 0); let y = y0 + (y1 - y0 - tot)/2; return items.map(it => { const s = it.html(y); y += it.h; return s; }).join(''); };
  FO.lid = s => String(s).replace(/(^| )([AaI]) /g, '$1$2 ');
  // the photo's room name and its plan size (feet only)
  FO.room = (D, id) => { const c = FXS.cardFor(D, id) || {}, L = FXS.leadLabel(c.lead || FO.lead(D, id)); return {name: String(L.name || FO.lead(D, id)), size: FO.feet(L.size)}; };

  // ---------------- a caption beside its photo (left or right), its block centered top to bottom beside the photo ----------------
  // the label (accent caps, plan size beside it), then the caption (Work Sans). Class "cap side" so the fill takes it as a side caption;
  // data-capl marks a caption that sits LEFT of its photo (the refit then widens the photo leftward). FO.stackCenter centers it after the fill.
  FO.sideCap = (D, c, x, y, w, H, slot, o) => { o = o || {}; c = FXS.augment(D, c); const L0 = FXS.leadLabel(c.lead), lh = o.lh || 15, fs = o.fs || 10.75, n = Math.max(3, Math.min(o.max || 12, Math.floor((H - 24)/lh))), sz = o.noSize ? '' : FO.feet(L0.size);
    const showSize = sz && !(FXS.__sizes = FXS.__sizes || new Set()).has(sz); if(showSize) FXS.__sizes.add(sz);
    const nm = L0.name.toUpperCase(), P = FO.poster(nm, w, 84, o.maxF || 40, 22, 2, 1.0), nh = P.lines.length*P.lh;
    return `<div class="abs" data-stk="${slot}" data-sh="${nh + 8}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${nh}pt"><div class="mq-h" style="position:absolute;left:0;top:0;width:${w}pt;height:${nh}pt;font-size:${P.f}pt;line-height:${P.lh}pt;color:var(--mq-on)" data-slot="${slot}.label" data-lines="${P.lines.length}">${P.lines.map(esc).join('<br>')}</div></div>`
      + (showSize ? `<div class="abs" data-stk="${slot}" data-sh="18" style="left:${x}pt;top:${y}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-size="1" data-slot="${slot}.size" data-lines="1">${esc(sz)}</div></div>` : '')
      + `<div class="mq-rl" data-stk="${slot}" data-sh="14" data-dy="3" style="left:${x}pt;width:40pt;background:var(--mq-accent)"></div>`
      + `<div class="abs cap side" data-ph-top="${y}" data-ph-h="${H}" data-stkbox="${slot}"><div class="a" style="position:absolute;left:${x}pt;top:${y + 22}pt;width:${w}pt;height:${n*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-room="${esc(L0.name)}" data-lh="${lh}" data-lines="${n}" data-min="3" data-narrow="0" ${o.capl ? 'data-capl="1" ' : ''}${FXS.sd(c.s)}></div></div>`; };
  // after the fill: every stacked block (data-stk="<slot>": label, numeral, rule) and its caption are centered top to bottom in their box
  FO.stackCenter = () => document.querySelectorAll('.cap.side[data-stkbox]').forEach(box => { const slot = box.dataset.stkbox, a = box.querySelector('.a'); if(!a) return;
    const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight); a.style.height = (n*lh) + 'pt'; a.dataset.lines = n;
    const pre = [...document.querySelectorAll(`[data-stk="${slot}"]`)], tot = pre.reduce((s, e) => s + +e.dataset.sh, 0) + n*lh, top0 = +box.dataset.phTop, H = +box.dataset.phH;
    let y = top0 + (H - tot)/2; pre.forEach(e => { e.style.top = (y + (+e.dataset.dy || 0)) + 'pt'; y += +e.dataset.sh; }); a.style.top = y + 'pt'; });
  FO.sideCenter = FO.stackCenter;

  // ---------------- the inside head band: the eyebrow, then the page's one display line in Anton, as big as two lines allow ----------------
  FO.HB = 196;   // the seam under the head band: one horizon across the spread
  FO.headBand = (kicker, title, slot, x, w) => { const t = FO.lid(String(title || '').replace(/\.$/, '')).toUpperCase(), fam = `${AF}`;
    const room = FO.HB - 16 - 18 - 24, pick = nMax => { for(let ff = 66; ff >= 30; ff -= 0.5){ if(nMax*ff*1.04 > room + 0.5 && nMax > 2) continue; for(let ww = w; ww >= w*0.6; ww -= 12){ const LL = FO.wrapLines(t, `${fam};font-size:${ff}pt`, ww); if((nMax < 3 ? LL.length <= nMax : LL.length === 3) && LL.length*ff*1.04 <= room && (LL.length === 1 || LL[LL.length - 1] >= 0.45*w)) return {f: ff, L: LL, ww}; if(nMax < 3) break; } } return null; };
    const p2 = pick(2), p3 = pick(3), P0 = !p2 ? p3 : p3 && (p3.f > p2.f*1.12 || room - p2.L.length*p2.f*1.04 > 36) ? p3 : p2; let f = P0 ? P0.f : 34, L = P0 ? P0.L : FO.wrapLines(t, `${fam};font-size:34pt`, w); if(P0 && P0.ww) w = Math.min(w, P0.ww);
    if(L.length === 1){ const one = FO.aw(t, f); if(one > w*0.62){ for(let ww = one*0.5; ww <= w; ww += 4){ const L2 = FO.wrapLines(t, `${fam};font-size:${f}pt`, ww); if(L2.length === 2){ L = L2; break; } } } }
    const n = L.length, lh = +(f*1.04).toFixed(2), words = q => new Set((String(q).toLowerCase().match(/[a-z0-9]+/g) || []).filter(x => x.length > 2)), kw = [...words(kicker)], tw = words(title), rep = !kicker || (kw.length && kw.every(x => tw.has(x)));
    const items = []; if(!rep) items.push({h: 24, html: y => FO.kk(kicker, x, y, w, slot + '.kicker')});
    const lines = (() => { const out = []; let cur = ''; t.split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, `${fam};font-size:${f}pt`) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out; })();
    items.push({h: n*lh, html: y => `<div class="mq-h" style="left:${x}pt;top:${y}pt;width:${w + 8}pt;height:${n*lh}pt;font-size:${f}pt;line-height:${lh}pt;letter-spacing:.5pt;white-space:nowrap" data-slot="${slot}.title" data-lines="${n}" data-fine="1">${lines.map(esc).join('<br>')}</div>`});
    return FO.vstack(items, 18, FO.HB - 16); };

  // ---------------- COVER (fold-over front): no agent, no brokerage ----------------
  // The marquee: the street in Anton capitals as big as the main-color block holds (one to three lines), the place in tracked accent caps
  // under it; the dark leaf at the right holds the year the house was built as the huge accent numeral (P51's day), over a short accent rule
  // and the house's height in stories (P51's time); the accent seam; the whole house edge to edge; under it the write-up and two framed
  // rooms (the sign-in sheet's framed house).
  FO.BH = 262;
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, C = P.mq || {};
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), BH = FO.BH, LX = 412;
    let h = `<div class="mq-leaf" style="left:${LX}pt;top:-9pt;width:${621 - LX}pt;height:${BH + 9}pt"></div>`;
    const place = [FXS.hood(L), 'Houston, TX'].filter(Boolean).join('  ·  ');
    const PS = FO.poster(L.address, LX - 22 - X0, BH - 40 - 30, 118, 40, 3, 0.98);
    h += FO.vstack([{h: PS.lines.length*PS.lh, html: y => FO.posterHtml(PS, X0 - 2, y, LX - 20 - X0, 'address')}, {h: 10, html: () => ''}, {h: 18, html: y => FO.kk(place, X0, y, LX - 22 - X0, 'front.place', {fs: 12, ls: 3.4})}], 6, BH);
    // the leaf
    const yr = String(L.yearBuilt || L.year || ''), st = +L.stories || 0, stW = ['', 'One story', 'Two stories', 'Three stories', 'Four stories'][st] || '', lw = 621 - LX - 9, cx = LX;
    const nf = FO.afit(yr, lw - 40, 108, 50), items = [{h: 22, html: y => FO.kk('Built in', cx, y, lw, 'front.leaf.k', {al: 'center', fs: 11, ls: 4.4, color: 'var(--mq-acc-dark)'})},
      {h: nf*1.0 + 6, html: y => `<div class="mq-num" style="left:${cx}pt;top:${y}pt;width:${lw}pt;height:${nf}pt;font-size:${nf}pt;line-height:${nf}pt" data-slot="front.leaf.n" data-lines="1">${esc(yr)}</div>`},
      {h: 14, html: y => `<div class="mq-rl" style="left:${cx + 44}pt;top:${y + 4}pt;width:${lw - 88}pt"></div>`}];
    if(stW) items.push({h: 24, html: y => `<div class="mq-kk w" style="left:${cx}pt;top:${y}pt;width:${lw}pt;height:22pt;font-size:15pt;line-height:22pt;letter-spacing:1.6pt;text-align:center;color:var(--mq-on-dark);font-weight:600;text-transform:none" data-slot="front.leaf.s" data-lines="1">${esc(stW)}</div>`});
    h += yr ? FO.vstack(items, 0, BH) : '';
    // the house, edge to edge (3.6 pt off the fold), the seam across its top
    let HP = Math.max(318, 792 - FO.BH - 176); while(HP < 380 && !SW.fits(D, hero, 621 - GAPF, HP)) HP += 4;
    h += FXS.box(D, hero, GAPF, BH, 621 - GAPF, HP, 'front.house') + FO.seam(BH, -9, 621, 4);
    // under it: the write-up at the left, two framed rooms at the right
    const y0 = BH + HP + 16, y1 = 770, strip = (o.strip || C.cover || P.strip || []).filter(id => id !== hero).slice(0, 2), RX = 300, gw = (X1 - RX - 12)/2, lbH = 16, rh = y1 - y0 - lbH - 4;
    strip.forEach((id, i) => { const x = RX + i*(gw + 12); h += FXS.box(D, id, x, y0, gw, rh, 'front.strip' + i) + `<div class="mq-pf" style="left:${x}pt;top:${y0}pt;width:${gw}pt;height:${rh}pt"></div>`;
      h += `<div class="mq-place" style="left:${x}pt;top:${y0 + rh + 6}pt;width:${gw}pt;height:12pt;font-size:8.6pt;line-height:12pt;letter-spacing:2.2pt;text-align:center" data-slot="front.strip${i}.label" data-lines="1">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div>`; });
    const intro = o.intro || K.summary || F.intro || [], ww = RX - 22 - X0, nl = Math.max(3, Math.min(o.lines || 5, Math.floor((y1 - y0 - 14)/18))), lh = 18;
    h += `<div class="mq-rl" data-zone="${y0},${y1}" style="left:${X0}pt;top:${y0}pt;width:44pt;height:2pt;background:var(--mq-accent)" data-role="front-rule"></div>`;
    h += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="${nl},${nl - 1}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0}pt;top:${y0 + 12}pt;width:${ww}pt;height:${nl*lh}pt;font-size:12pt;line-height:${lh}pt;color:var(--mq-on)"></div>`);
    return h; };
  // after the fill: the cover's rule and write-up sit centered top to bottom in their zone
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'), ru = document.querySelector('[data-role="front-rule"]'); if(!su || !ru || !su.textContent.trim()) return;
    const [y0, y1] = ru.dataset.zone.split(',').map(Number), n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), tot = 2 + 12 + n*lh, top = y0 + (y1 - y0 - tot)/2;
    ru.style.top = top + 'pt'; su.style.top = (top + 14) + 'pt'; su.style.height = (n*lh) + 'pt'; };

  // ---------------- TWO-SIDED FLYER FRONT: its own composition (no agent, no brokerage) ----------------
  // The house first, edge to edge across the top, the seam under it; then a tall leaf down the right side to the bleed with the house's
  // numbers stacked as Anton numerals (P51's day, four times); at the left the street in Anton, the place, the write-up and two framed rooms.
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, C = P.mq || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'); let HP = 360; while(HP < 420 && !SW.fits(D, hero, 630, HP + 9)) HP += 4;
    let h = FXS.box(D, hero, -9, -9, 630, HP + 9, 'front.house') + FO.seam(HP, -9, 621, 4);
    const LX = 430, lw = 621 - LX - 9;
    h += `<div class="mq-leaf" style="left:${LX}pt;top:${HP}pt;width:${621 - LX}pt;height:${801 - HP}pt"></div>`;
    const parts = FXS.statItems(L).filter(x => !/^Built/.test(x)).map(FXS.statParts); const yr = L.yearBuilt || L.year; if(yr) parts.push({n: String(yr), l: 'Built'});
    const cell = (792 - HP - 24)/Math.max(1, parts.length), nf = Math.min(54, cell*0.5);
    parts.forEach((p, i) => { const y = HP + 12 + i*cell, f = FO.afit(p.n, lw - 30, nf, 24), bh = f + 8 + 14, t = y + (cell - bh)/2;
      if(i) h += `<div class="abs" style="left:${LX + 40}pt;top:${y - .5}pt;width:${lw - 80}pt;height:1pt;background:color-mix(in srgb, var(--mq-on-dark) 40%, transparent)"></div>`;
      h += `<div class="mq-num" style="left:${LX}pt;top:${t}pt;width:${lw}pt;height:${f}pt;font-size:${f}pt;line-height:${f}pt" data-slot="front.fact${i}" data-lines="1">${esc(p.n)}</div>`;
      h += FO.kk(p.l, LX, t + f + 8, lw, `front.fact${i}.l`, {al: 'center', fs: 9.5, ls: 3, color: 'var(--mq-on-dark)'}); });
    // the left column
    const LW = LX - 24 - X0, PS = FO.poster(L.address, LW, 112, 64, 30, 2, 0.98);
    let y = HP + 22; h += FO.posterHtml(PS, X0 - 1, y, LW, 'address'); y += PS.lines.length*PS.lh + 6;
    h += FO.kk([FXS.hood(L), 'Houston, TX'].filter(Boolean).join('  ·  '), X0, y, LW, 'front.place', {fs: 11, ls: 3}); y += 24;
    const nl = o.lines || 4, lh = 16, wy = y + 4;
    h += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="${nl},${nl - 1}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0}pt;top:${wy}pt;width:${LW}pt;height:${nl*lh}pt;font-size:10.75pt;line-height:${lh}pt;color:var(--mq-on)"></div>`);
    const ry = wy + nl*lh + 16, strip = (o.strip || C.flyerStrip || P.flyerStrip || P.strip || []).filter(id => id !== hero).slice(0, 2), gw = (LW - 12)/2, rh = 770 - 18 - ry;
    strip.forEach((id, i) => { const x = X0 + i*(gw + 12); h += FXS.box(D, id, x, ry, gw, rh, 'front.strip' + i) + `<div class="mq-pf" style="left:${x}pt;top:${ry}pt;width:${gw}pt;height:${rh}pt"></div>`;
      h += `<div class="mq-place" style="left:${x}pt;top:${ry + rh + 6}pt;width:${gw}pt;height:12pt;font-size:8.6pt;line-height:12pt;letter-spacing:2.2pt;text-align:center" data-slot="front.strip${i}.label" data-lines="1">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div>`; });
    return h; };

  // ---------------- INSIDE SPREAD: a mirror around the fold ----------------
  // Both pages open with a head band (the eyebrow and the page's headline in Anton) over one seam that runs across the spread at FO.HB.
  // Under it the two pages mirror each other around the fold: the outer edges carry the big photos (the kitchen bleeding off the left
  // edge, the lead bedroom off the right); the two dark leaves face each other across the fold like the two halves of a marquee (the
  // kitchen card on the left leaf, the lead room's name, plan size and write-up on the right leaf); under them two photos meet at the
  // fold as a pair, each with its write-up at its outer side. One horizon, one seam, no grid of equal tiles.
  FO.TOPY = FO.HB + 4; FO.TOPB = 534; FO.BOTY = 548; FO.BOTB = 770;
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, C = P.mq || {};
    const kid = C.left || 'kitchen', bot = C.leftRow ? C.leftRow[0] : null;
    let h = FO.headBand(I.kicker, C.leftTitle || I.title, 'left', X0, CW - 6) + FO.seam(FO.HB, -9, 621, 4);
    const PX1 = 326, LX = PX1 + 12, LX1 = 612 - 18;   // the leaf stops 0.25 in short of the fold; its twin on the right page starts 0.25 in past it
    h += FXS.box(D, kid, -9, FO.TOPY, PX1 + 9, FO.TOPB - FO.TOPY, 'left.wide');
    h += `<div class="mq-leaf" style="left:${LX}pt;top:${FO.TOPY}pt;width:${LX1 - LX}pt;height:${FO.TOPB - FO.TOPY}pt"></div>`;
    // the kitchen card on the leaf: the room's name (and plan size), then numbered rows: the sign-in sheet's squares, each row its label in
    // accent caps over two full lines of true detail. A row that only repeats what the back's lists print is left out (Night Fade's filter)
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const taken = a => /^(It|Its|They|This|That)\b/.test(a) || SW.grams4(a).some(g => backG.has(g)) || backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w))));
    const lx = LX + 18, sqS = 24, tx = lx + sqS + 12, tw = LX1 - 18 - tx;
    const T = FO.rowsN((box.items || []).slice(0, 10), taken, {maxRows: 6, Vs: Array.from({length: 23}, (_, i) => tw - 44 + 2*i), room: FO.TOPB - FO.TOPY - 64}) || {rows: [], f: 10, V: tw};
    const rows = T.rows, lh = +(T.f*1.4).toFixed(2), gap = 12, rm = FO.room(D, kid);
    const items = [{h: 20, html: y => FO.kk(box.kicker && !/kitchen/i.test(box.kicker) ? box.kicker : 'The kitchen', lx, y, LX1 - 18 - lx, 'left.box.kicker', {fs: 10, ls: 3.6, color: 'var(--mq-acc-dark)'})}];
    if(rm.size && !(box.kicker && !/kitchen/i.test(box.kicker))){ (FXS.__sizes = FXS.__sizes || new Set()).add(rm.size); items.push({h: 20, html: y => `<div class="mq-kk w" style="left:${lx}pt;top:${y}pt;width:${LX1 - 18 - lx}pt;height:14pt;font-size:9.5pt;line-height:14pt;letter-spacing:1.4pt;color:var(--mq-on-dark);font-weight:500;text-transform:none" data-size="1" data-slot="left.wide.size" data-lines="1">${esc('Kitchen, ' + rm.size)}</div>`}); }
    items.push({h: 10, html: y => `<div class="mq-rl" style="left:${lx}pt;top:${y + 2}pt;width:40pt"></div>`});
    rows.forEach((r, i) => items.push({h: 13 + r.n*lh + (i < rows.length - 1 ? gap : 0), html: y => FO.sq(i + 1, lx, y + 1, sqS, '')
      + `<div class="mq-wl" style="left:${tx}pt;top:${y}pt;width:${tw}pt;color:var(--mq-acc-dark)" data-slot="left.list.l${i}" data-lines="1">${esc(r.l)}</div>`
      + `<div class="abs" style="left:${tx}pt;top:${y + 13}pt;width:${T.V + 1}pt;height:${r.n*lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--mq-font);color:color-mix(in srgb, var(--mq-on-dark) 88%, var(--mq-dark));overflow:hidden;text-align:justify;text-align-last:left" data-slot="left.list.t${i}" data-lines="${r.n}">${esc(r.t)}</div>`}));
    h += `<div class="mq-leaf-on">${FO.vstack(items, FO.TOPY, FO.TOPB)}</div>`;
    // the pair at the fold: this page's photo runs to the fold (3.6 pt short), its write-up at the outer side
    if(bot){ const c = FXS.cardFor(D, bot), PX = 258; if(c){ h += FXS.box(D, bot, PX, FO.BOTY, 612 - GAPF - PX, FO.BOTB - FO.BOTY, 'left.photo0') + FO.sideCap(D, c, X0, FO.BOTY, PX - 16 - X0, FO.BOTB - FO.BOTY, 'left.photo0', {capl: true}); } }
    return h; };
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, C = P.mq || {};
    const top = FXS.cardFor(D, C.right || 'primary'), bot = (C.rightRow || [])[0];
    let h = FO.headBand(R.kicker, C.rightTitle || R.title, 'right', X0, CW - 6) + FO.seam(FO.HB, -9, 621, 4);
    const LX = 18, LX1 = 254, PX = LX1 + 12;
    h += `<div class="mq-leaf" style="left:${LX}pt;top:${FO.TOPY}pt;width:${LX1 - LX}pt;height:${FO.TOPB - FO.TOPY}pt"></div>`;
    h += FXS.box(D, top.photo, PX, FO.TOPY, 621 - PX, FO.TOPB - FO.TOPY, 'right.wide');
    // the right leaf: the lead room's plan size as the marquee numeral (when the plan prints one), its name, the rule, its write-up
    const c0 = FXS.augment(D, top), L0 = FXS.leadLabel(c0.lead), sz = FO.feet(L0.size), lx = LX + 18, lw = LX1 - 18 - lx, slot = 'right.photo0';
    const RP = FO.poster(L0.name.toUpperCase(), lw, 96, 44, 24, 2, 1.0), rnh = RP.lines.length*RP.lh;
    let pre = `<div class="abs" data-stk="${slot}" data-sh="${rnh + 8}" style="left:${lx}pt;width:${lw}pt;height:${rnh}pt"><div class="mq-h" style="position:absolute;left:0;top:0;width:${lw}pt;height:${rnh}pt;font-size:${RP.f}pt;line-height:${RP.lh}pt;color:var(--mq-on-dark)" data-slot="${slot}.label" data-lines="${RP.lines.length}">${RP.lines.map(esc).join('<br>')}</div></div>`;
    if(sz){ (FXS.__sizes = FXS.__sizes || new Set()).add(sz); const f = FO.afit(sz, lw, 58, 30); pre += `<div class="mq-num" data-stk="${slot}" data-sh="${f + 4}" style="left:${lx}pt;width:${lw}pt;height:${f}pt;font-size:${f}pt;line-height:${f}pt;text-align:left" data-size="1" data-slot="right.size" data-lines="1">${esc(sz)}</div>`; }
    pre += `<div class="mq-rl" data-stk="${slot}" data-sh="16" data-dy="5" style="left:${lx}pt;width:40pt"></div>`;
    const lh = 15.5, n = Math.max(3, Math.min(12, Math.floor((FO.TOPB - FO.TOPY - 150)/lh)));
    h += `<div class="mq-leaf-on">${pre}<div class="abs cap side" data-ph-top="${FO.TOPY}" data-ph-h="${FO.TOPB - FO.TOPY}" data-stkbox="${slot}"><div class="a" style="position:absolute;left:${lx}pt;top:${FO.TOPY + 60}pt;width:${lw}pt;height:${n*lh}pt;font-size:11pt;line-height:${lh}pt;color:color-mix(in srgb, var(--mq-on-dark) 90%, var(--mq-dark))" data-slot="${slot}" data-room="${esc(L0.name)}" data-lh="${lh}" data-lines="${n}" data-min="3" data-narrow="0" data-nofit="1" ${FXS.sd(c0.s)}></div></div></div>`;
    if(bot){ const c = FXS.cardFor(D, bot), PX1 = 354; if(c){ h += FXS.box(D, bot, GAPF, FO.BOTY, PX1 - GAPF, FO.BOTB - FO.BOTY, 'right.photo1') + FO.sideCap(D, c, PX1 + 16, FO.BOTY, X1 - PX1 - 16, FO.BOTB - FO.BOTY, 'right.photo1'); } }
    return h; };
  FO.leftHead = () => {};

  // ---------------- BACK (fold-over) and FLYER BACK ----------------
  // Fold-over back: the marquee board across the top: a dark band with the house's numbers as Anton numerals in the accent, each over its
  // name (P51's day, in a row), the seam under it. Flyer back: the same band carries Nearby (the flyer front already shows the numbers).
  // Under it: the listing's own plan in a box its own shape with the floors' write-up beside it (or, with no plan, the big outdoor photo
  // and its write-up); Nearby as a row of Anton miles on the fold-over; the lists in P51's white box with one captioned photo; the
  // half-height contact card; the fine print.
  FO.BAND = 104;
  FO.band = (D, cells, slot) => { let h = `<div class="mq-leaf" style="left:-9pt;top:-9pt;width:630pt;height:${FO.BAND + 9}pt"></div>` + FO.seam(FO.BAND, -9, 621, 4);
    const n = cells.length, cw = CW/n;
    cells.forEach((c, i) => { const x = X0 + i*cw, f = FO.afit(c.n, cw - 16, 50, 22), bh = f + 6 + 13, y = (FO.BAND - bh)/2 + 2;
      if(i) h += `<div class="abs" style="left:${x - .5}pt;top:22pt;width:1pt;height:${FO.BAND - 44}pt;background:color-mix(in srgb, var(--mq-on-dark) 40%, transparent)"></div>`;
      h += `<div class="mq-num" style="left:${x}pt;top:${y}pt;width:${cw}pt;height:${f}pt;font-size:${f}pt;line-height:${f}pt" data-slot="${slot}${i}" data-lines="1">${esc(c.n)}</div>`;
      h += FO.kk(c.l, x + 6, y + f + 6, cw - 12, `${slot}${i}.l`, {al: 'center', fs: 9, ls: 2.4, color: 'var(--mq-on-dark)'}); });
    return h; };
  FO.nearCells = D => (((D.sw || {}).back || {}).nearby || []).slice(0, 3).map(nn => { const m = /^([\d.,]+)\s*(.*)$/.exec(String(nn.dist).trim()) || [0, nn.dist, '']; return {n: m[1] + (/mile/i.test(m[2]) ? ' mi' : m[2] ? ' ' + m[2] : ''), l: String(nn.place)}; });
  FO.NB = 62;
  FO.nearRow = (D, y) => { const N = FO.nearCells(D), n = N.length; if(!n) return {html: '', y}; let h = '';
    const cw = CW/n;
    N.forEach((c, i) => { const x = X0 + i*cw, f = 30;
      if(i) h += `<div class="abs" style="left:${x - .5}pt;top:${y + 8}pt;width:1pt;height:${FO.NB - 16}pt;background:var(--mq-rule)"></div>`;
      h += `<div class="abs" data-slot="back.near${i}" data-lines="1" data-fine="1" style="left:${x + 8}pt;top:${y + (FO.NB - f - 14)/2}pt;width:${cw - 16}pt;height:${f + 14}pt;text-align:center;white-space:nowrap;overflow:hidden">`
        + `<div style="font-family:Anton;font-size:${f}pt;line-height:${f}pt;color:var(--mq-accent);letter-spacing:.4pt;text-transform:uppercase">${esc(c.n)}</div>`
        + `<div style="font-family:var(--mq-font);font-weight:700;font-size:8.6pt;line-height:14pt;letter-spacing:2pt;color:var(--mq-on);text-transform:uppercase">${esc(c.l)}</div></div>`; });
    return {html: h, y: y + FO.NB}; };
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, C = P.mq || {}, flyer = !!o.flyer, issues = [], L = D.listing;
    const topId = flyer ? (C.flyerTop || (P.backNoplan || [])[0]) : (C.backTop || (P.backNoplan || [])[0]);
    const footId = hasPlan ? topId : flyer ? C.flyerFootNoplan : C.backFootNoplan;
    const L0 = X0, R0 = X1, TOP = FO.BAND + 20;
    let h = '';
    if(flyer) h += FO.band(D, FO.nearCells(D), 'back.near');
    else { const parts = FXS.statItems(L).filter(x => !/^Built/.test(x)).map(FXS.statParts); h += FO.band(D, parts, 'back.fact'); }
    const nearH = flyer ? 0 : FO.NB + 10;
    let top, leftW;
    const LV = hasPlan ? (D.plan.levels || []) : [], tall = hasPlan && (LV.length >= 4 || (LV.length === 1 && LV[0].h/LV[0].w > 1.5));
    const BX0 = KB.boxes || {}, SF0 = FXS.sellingFacts(D), nrows = Math.max(2, Math.min(4, Math.max(((BX0.inside && BX0.inside.items) || SF0.inside).length, ((BX0.outside && BX0.outside.items) || SF0.outside).length))), listH = hasPlan ? 18 + nrows*22 + 34 : 150, BOXB = FO.CARD_Y - 16;
    const TH = BOXB - listH - 14 - nearH - TOP - (tall ? 0 : 0);
    if(hasPlan){ const pc = FO.planBox(D, L0, TOP, TH - 30, tall ? 300 : 352); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom; leftW = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])); }
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    if(!hasPlan){ const tph = TH - 25 - 3*14 - 4; leftW = 300; const c = FXS.cardFor(D, topId); h += FXS.captioned(D, c, L0, TOP, leftW, tph, 3, 'back.top', {fs: 10.5, lh: 14, min: 3}); top = TOP + tph + 25 + 3*14; }
    const used = FO.cards(D, [topId, footId].filter(Boolean));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s)), ax = L0 + leftW + 22, aw = R0 - ax;
    const kickT = +(L.stories) > 1 ? 'Floor by floor' : 'Room by room';
    const ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, '').toUpperCase(), HT = ht ? FO.bal2(ht, aw - 4, 30, 15) : {lines: [], f: 0, w: aw}, hf = HT.f, hn = HT.lines.length, hlh = hf*1.06, hh = ht ? hn*hlh + 10 : 0;
    const head = y => FO.kk(kickT, ax, y, aw, 'back.about.title', {fs: 9.5, ls: 3.2}) + (ht ? `<div class="mq-h" style="left:${ax}pt;top:${y + 18}pt;width:${Math.ceil(HT.w) + 3}pt;height:${hn*hlh}pt;font-size:${hf}pt;line-height:${hlh}pt;white-space:nowrap" data-slot="back.about.head" data-lines="${hn}">${HT.lines.map(esc).join('<br>')}</div>` : '');
    { const T0 = TOP + 20 + hh, n = Math.max(3, Math.floor((top - T0)/16)), lh = +((top - T0)/n).toFixed(3);
      h += head(TOP + 2) + FO.full(FO.wu(keep(f2.concat(f1)), ax, T0, aw, n*lh + 0.01, 'back.about', 10.75, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${aw < 240 ? ' data-rag="1"' : ''} data-span="${(top - T0).toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`); }
    let y = top + 12;
    if(!flyer){ const nr = FO.nearRow(D, y); h += `<div class="abs" style="left:${X0}pt;top:${y - .5}pt;width:${CW}pt;height:1pt;background:var(--mq-rule)"></div>` + nr.html; y = nr.y + 10; }
    // the lists in P51's white box (the event box: a 1.2 pt accent line), one captioned photo beside it, both down to the card
    const by = y, BH = hasPlan && BOXB - by - listH > 132 ? listH : BOXB - by, footC = footId ? FXS.cardFor(D, footId) : null, PW = footC && (!hasPlan || (BOXB - by - listH <= 132 && BOXB - by >= 170)) ? 214 : 0, BW = R0 - L0 - (PW ? PW + 16 : 0);
    { const fitW = BW > 300 ? (BW - 36 - 22)/2 : BW - 36, keepW = a => a.filter(x => FXS.width(x, 'font-family:WorkSans;font-weight:400;font-size:10.5pt') <= fitW - 14); const k1 = keepW(c1), k2 = keepW(c2); c1.length = 0; c1.push(...k1); c2.length = 0; c2.push(...k2); }
    let t2 = 'Outside'; if(c1.length < 3){ if(c1.length) t2 = 'Inside and out'; c2.push(...c1.filter(x => !c2.includes(x))); c1.length = 0; }
    { const two = BW > 300 && c1.length > 0, cw = two ? (BW - 36 - 22)/2 : BW - 36, n1 = Math.min(c1.length, 4), n2 = Math.min(c2.length, 4);
      let t = `<div class="mq-wb" style="left:${L0}pt;top:${by}pt;width:${BW}pt;height:${BH}pt"></div>`;
      if(two){ const nr = Math.max(n1, n2, 2), rh = Math.min(28, (BH - 30 - 14)/nr), ch = 18 + nr*rh, yy = by + (BH - ch)/2;
        t += `<div class="abs" style="left:${L0 + 18 + cw + 10.5}pt;top:${by + 14}pt;width:1pt;height:${BH - 28}pt;background:rgba(0,0,0,.16)"></div>`;
        t += `<div class="mq-wl" style="left:${L0 + 18}pt;top:${yy}pt;width:${cw}pt" data-slot="back.updates.title" data-lines="1">${esc(t1.toUpperCase())}</div>` + FXS.bullets(c1, L0 + 18, yy + 18, cw, rh, 'back.updates', 4, 10).html;
        t += `<div class="mq-wl" style="left:${L0 + 18 + cw + 22}pt;top:${yy}pt;width:${cw}pt" data-slot="back.outside.title" data-lines="1">${esc(t2.toUpperCase())}</div>` + FXS.bullets(c2, L0 + 18 + cw + 22, yy + 18, cw, rh, 'back.outside', 4, 10).html; }
      else { const n2b = Math.min(c2.length, c1.length ? 4 : 6), heads = c1.length ? 2 : 1, rh = Math.min(30, (BH - 30 - heads*18 - (heads - 1)*12)/(n1 + n2b)), ch = heads*18 + (heads - 1)*12 + (n1 + n2b)*rh; let yy = by + (BH - ch)/2;
        if(c1.length){ t += `<div class="mq-wl" style="left:${L0 + 18}pt;top:${yy}pt;width:${cw}pt" data-slot="back.updates.title" data-lines="1">${esc(t1.toUpperCase())}</div>` + FXS.bullets(c1, L0 + 18, yy + 18, cw, rh, 'back.updates', n1, 10.5).html; yy += 18 + n1*rh + 12; }
        t += `<div class="mq-wl" style="left:${L0 + 18}pt;top:${yy}pt;width:${cw}pt" data-slot="back.outside.title" data-lines="1">${esc(t2.toUpperCase())}</div>` + FXS.bullets(c2, L0 + 18, yy + 18, cw, rh, 'back.outside', n2b, 10.5).html; }
      h += `<div class="mq-on-wb">${t}</div>`; }
    if(hasPlan && footC && BOXB - (by + BH) > 120){ const sy = by + BH + 12, sh = BOXB - sy, pw = 300; h += FXS.box(D, footC.photo, -9, sy, pw + 9, sh, 'back.photo1') + FO.sideCap(D, footC, pw + 16, sy, R0 - pw - 16, sh, 'back.photo1', {maxF: 30}); }
    if(PW && footC) h += FXS.captioned(D, footC, R0 - PW, by, PW, BH - 25 - 3*13, 3, 'back.photo1', {fs: 10, lh: 13, min: 3});
    h += FO.contact(D, X0, FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D);
    return {html: h, issues}; };
  FO.tallStack = () => {};
})();
