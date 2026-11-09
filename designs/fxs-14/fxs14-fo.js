/* fxs-14 fold-over and flyer builders, round 7 rethink (11/7), second pass. Panel coordinates in pt: the trim is 612 x 792 (the proof page adds a 9 pt bleed all round;
   anything that bleeds runs to -9 / 621 / 801). Text keeps 36 pt off the fold and 18 pt off the trim. One taupe block per panel; photos overlap it; type is ink on white
   and white on taupe (the .tp wrapper flips the variables). The cover carries a strip of four rooms across the hero's foot, so every other panel uses the rooms left:
   one physical space once on the fold-over (scripts/fxsets/spaces.py). */
(function(){
  const FO = window.FO = {}, esc = SW.esc;
  FO.tp = h => `<div class="abs tp" style="left:0;top:0;width:612pt;height:792pt">${h}</div>`;
  FO.cards = (D, ids) => (ids || []).map(id => FXS.cardFor(D, id)).filter(Boolean);
  FO.lead = (D, id) => { const P = ((D.sw || {}).plan || {}), l = (P.leads || {})[id] || (FXS.cardFor(D, id) || {}).lead || FXS.labelFor(id); return FXS.leadLabel(l).name; };
  FO.kick = (t, x, y, slot) => `<div class="abs fo-kick" style="left:${x}pt;top:${y}pt" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`;
  FO.title = (t, x, y, w, slot, lines, fs) => `<div class="abs fo-title" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${lines*fs*1.4}pt;font-size:${fs}pt;line-height:${fs*1.4}pt" data-slot="${slot}" data-lines="${lines}" data-fine="1">${esc(String(t).replace(/\.$/, '').toUpperCase())}</div>`;
  FO.wu = (list, x, y, w, h, slot, fs, lh, cls) => { const n = Math.max(2, Math.floor(h/lh)), tr = []; for(let q = n; q >= 2; q--) tr.push(q);
    return `<div class="abs ${cls || 'wu'}" data-slot="${slot}" data-lines="${n}" data-try="${tr.join(',')}" data-lh="${lh}" ${FXS.sd(list)} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*lh}pt;font-size:${fs}pt;line-height:${lh}pt"></div>`; };
  // a write-up that keeps its full width (never narrowed), justified, last line at least 90% full: owner 11/8 (FXS-14 r3 p6/p12; carried to every write-up beside the plan or deck)
  FO.full = s => s.replace('data-slot=', `data-narrow="0" data-fill="0.9" data-lfill="0.8" data-justify="1" data-h0="${(/height:([\d.]+)pt/.exec(s) || [0, 0])[1]}" data-slot=`);   // set ragged while the sentences are picked (every line 80%+), justified after the fill
  // after the fill: a full-width write-up whose sentences end short of its box takes the smallest bigger type (0.25 pt steps, up to 1.25x) at which a set of its sentences fills the box,
  // every line still 80%+ and the last 90%+ set ragged; then it is justified (owner 11/7 "a back that still has room takes bigger type"; 11/8 no blank space)
  FO.grow = () => document.querySelectorAll('[data-justify]').forEach(el => { if(!el.textContent.trim() || !SW.pfN) return;
    const H = el.dataset.span ? +el.dataset.span : +(el.dataset.h0 || parseFloat(el.style.height)), cs = getComputedStyle(el), fs0 = parseFloat(cs.fontSize)*0.75, r = (parseFloat(cs.lineHeight)*0.75)/fs0 || 1.5;
    const keep = el.innerHTML; el.style.textAlign = 'left'; el.style.height = 'auto'; let best = null;
    for(let fs = fs0; fs <= fs0*1.25 + 0.01 && !best; fs += 0.25){ el.style.fontSize = fs + 'pt'; el.style.lineHeight = (fs*r) + 'pt';   // the smallest step up that fills the box
      const T = Math.floor((H + 0.5)/(fs*r)); if(T < 2) continue;
      if(fs === fs0 && !el.dataset.diag){ const n0 = SW.lines(el).n; if((n0 === T || n0 === T - 1) && n0*fs*1.7 >= H){ best = {fs, n: n0, pick: null}; break; } }   // the fill already filled it at this size: same answer, no second search
      for(const t of [T, T - 1]){ if(t*fs*1.7 < H) continue; const b = SW.pfN(el, t); if(b){ best = {fs, n: t, pick: b.pick}; break; } } }
    if(!best){ el.style.fontSize = fs0 + 'pt'; el.innerHTML = keep; el.style.lineHeight = (fs0*r) + 'pt'; best = {fs: fs0, n: SW.lines(el).n}; }
    else if(best.pick){ el.style.fontSize = best.fs + 'pt'; el.innerHTML = best.pick.map(x => x.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))).join(' '); }
    const lh = el.dataset.span ? best.fs*r : Math.min(H/best.n, best.fs*1.7);
    el.style.lineHeight = lh + 'pt'; el.style.height = (best.n*lh) + 'pt'; el.dataset.lines = best.n; el.style.textAlign = 'justify'; });
  // owner 11/8/2026 (FXS-14 versions review p3-p27, standing rule): every write-up runs at least three full lines at its full width (never narrowed, so no line
  // runs past the rule above it), set ragged with every line 80%+ while its true sentences are picked and the last line 90%+, then justified so every line but
  // the last reaches the edge. Runs before SW.fill on the fold-over and flyer; FO.just3 justifies after the fill; FO.fill3Check reports any block that misses.
  FO.prep3 = () => document.querySelectorAll('[data-s][data-slot]').forEach(el => { if(el.dataset.slot === 'front.summary') return;   // the cover write-up: its own approved 4/5-line fit
    el.dataset.narrow = '0'; el.dataset.fill = Math.max(0.9, +el.dataset.fill || 0); el.dataset.lfill = Math.max(+el.dataset.lfill || 0, el.dataset.h0 ? 0.8 : !(/\.box\.t\d+$/.test(el.dataset.slot) || el.closest('.cap')) ? 0.75 : parseFloat(el.style.width) < 150 ? 0.8 : 0.84); el.dataset.j3 = '1';   // rows and captions 84% (80% in a narrow column) while picked so the box check holds; floor write-ups their approved 80%; intros 75% el.dataset.j3 = '1';   // a table row: 84% while picked so the box check (80%) holds; a floor write-up keeps its approved 80%
    if(el.dataset.try){ let t = el.dataset.try.split(',').map(Number).filter(n => n >= 3); if(el.dataset.span){ const S = JSON.parse(el.dataset.s).slice(0, +el.dataset.pool || 12).map(x => [].concat(x).sort((p, q) => q.length - p.length)[0]), keep = el.innerHTML;   // a spread write-up: only the counts its sentences can reach
        el.innerHTML = SW.esc(S.join(' ')); const most = SW.lines(el).n; el.innerHTML = keep; const r = t.filter(n => n <= most); t = r.length ? r : t.slice(-1); }
      else if(el.dataset.h0) t = t.slice(0, 2);   // a floor write-up fills its box (its top two counts), never a short block over blank space (owner p21/p27)
      el.dataset.try = (t.length ? t : [3]).join(','); }
    if(el.closest('.cap')){ el.dataset.min = Math.max(3, +el.dataset.min || 0); } });
  FO.just3 = () => document.querySelectorAll('[data-j3]').forEach(el => { if(el.textContent.trim() && SW.lines(el).n >= 2) el.style.textAlign = 'justify'; });
  FO.fill3Check = () => [...document.querySelectorAll('[data-j3]')].filter(el => el.textContent.trim()).flatMap(el => { const L = SW.lines(el);
    return L.n < 3 ? [{slot: el.dataset.slot, kind: 'writeup-under-3-lines', lines: L.n}] : L.fill < 0.895 ? [{slot: el.dataset.slot, kind: 'writeup-last-line-short', pct: Math.round(L.fill*100)}] : []; });
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- FRONT (fold-over cover and flyer front: no agent, no brokerage) ----------------
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    let h = `<div class="taupeb" style="left:-9pt;top:400pt;width:630pt;height:411pt"></div>`;
    h += SW.heroHtml(D, F.hero || K.hero || 'front', -9, -9, 630, 455, 'front.house', []);
    // the strip of four rooms across the foot of the hero (kitchen, living room, primary suite, deck), names under them
    const strip = (P.strip || []).slice(0, 4), gap = 9, sx = 38, sw_ = (549 - (strip.length - 1)*gap)/Math.max(1, strip.length);
    strip.forEach((id, i) => { h += `<div class="abs taupeb" style="left:${sx + i*(sw_ + gap) - 3.5}pt;top:${422.5}pt;width:${sw_ + 7}pt;height:95pt"></div>`; });
    strip.forEach((id, i) => { let b = FXS.box(D, id, sx + i*(sw_ + gap), 426, sw_, 88, 'front.strip' + i); if(id === 'bar') b = b.replace('<div class="ph" data-photo="bar"', '<div class="ph" data-zoom="2.2,0.1,0.56" data-photo="bar"'); h += b; });
    let t = '';
    strip.forEach((id, i) => { t += `<div class="abs" style="left:${sx + i*(sw_ + gap)}pt;top:521pt;width:${sw_}pt;white-space:nowrap"><div class="lbl" data-slot="front.strip${i}.label" data-lines="1" style="max-width:${sw_}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`; });
    // round 3 (owner 11/7, p1 p5 p7 p11): the neighborhood line tucks up under the address; the facts, the rule and the write-up follow it up,
    // and the write-up takes the room that frees at a bigger type (fold-over: four lines; flyer: its same amount of text, five lines)
    const ad = FXS.street(L.address).toUpperCase(), fsz = FXS.fitSize(ad, "font-family:'Libre Baskerville';font-weight:700;letter-spacing:1.5pt", 549, 40, 24), aTop = 540 + (52 - fsz)*0.5;
    t += `<div class="abs fo-addr" data-slot="address" data-lines="1" style="left:38pt;top:${aTop}pt;width:549pt;height:${fsz*1.3}pt;font-size:${fsz}pt;line-height:${fsz*1.3}pt">${esc(ad)}</div>`;
    const pY = aTop + fsz*1.3 - 2;
    t += `<div class="abs" style="left:38pt;top:${pY}pt;width:300pt;font:600 11pt/16pt var(--fx-font);letter-spacing:5pt;color:#fff;white-space:nowrap" data-slot="front.place" data-lines="1">${esc((FXS.hood(L) || L.city).toUpperCase())}</div>`;
    const items = FXS.statItems(L); if(L.lotSize) items.push(String(L.lotSize));
    const fw = 549/items.length, fY = pY + 24;
    t += items.map((it, i) => { const p = FXS.statParts(it); return `<div class="fo-fact${window.__factsInline ? ' inline' : ''}" style="left:${37 + i*fw}pt;top:${fY}pt;height:38pt" data-slot="fact.${i}" data-lines="1"><span class="n">${esc(p.n)}</span><span class="l">${esc(p.l)}</span></div>`; }).join('');
    t += `<div class="abs hr" style="left:38pt;top:${fY + 46}pt;width:547pt"></div>`;
    { const wy = fY + 58, avail = 774 - wy, n = o.lines || 5, lh = Math.min(avail/n, 22), fs = o.fs || Math.min(13.5, +(lh/1.55).toFixed(2));
      t += `<div class="abs wu" data-slot="front.summary" data-lines="${n}" data-try="${n}" data-lh="${lh}" ${FXS.sd(intro)} style="left:38pt;top:${wy + (avail - n*lh)}pt;width:547pt;height:${n*lh}pt;font-size:${fs}pt;line-height:${lh}pt"></div>`; }
    return h + FO.tp(t);
  };

  // ---------------- INSIDE LEFT (the living level): hero over the taupe corner, two rooms, the kitchen as a ruled list ----------------
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, cs = FO.cards(D, P.left || []), [heroC, ...rest] = cs, three = rest.length >= 2;
    let h = `<div class="taupeb" style="left:316pt;top:-9pt;width:320pt;height:291pt"></div>`;
    h += FXS.box(D, heroC.photo, -9, -9, 385, 257, 'left.wide');
    let t = FO.kick(I.kicker || '', 394, 24, 'left.kicker') + FO.title(I.title || '', 394, 44, 191, 'left.title', 4, 11.5);
    t += FO.wu(I.intro || [], 394, 108, 191, 168, 'left.intro', 9.75, 14.5, 'wu');
    h += FO.tp(t);
    const zoomBar = c => '<div class="ph" data-zoom="2.4,0.103,0.566" data-photo="bar"';
    const items = (box.items || []).slice(0, 7), lx = 22, cw = 125, gx = 16, ly = three ? 558 : 330;
    if(three){
      const X = [22, 319], W = [256, 266];
      rest.slice(0, 2).forEach((c, i) => { let cap = FXS.captioned(D, c, X[i], 296, W[i], 165, 4, 'left.photo' + i, {fs: 9.5, lh: 12.5, min: 4});
        if(c.photo === 'bar') cap = cap.replace('<div class="ph" data-photo="bar"', zoomBar());
        h += cap; });
      h += FO.kick(box.kicker || 'The kitchen', lx, ly, 'left.box.kicker');
      h += `<div class="abs fo-sub" style="left:${lx}pt;top:${ly + 16}pt;width:549pt" data-slot="left.box.heading" data-lines="1">${esc((box.heading || '').replace(/\.$/, ''))}</div>`;
      items.forEach((it, i) => { const r = i < 4 ? 0 : 1, n = r ? items.length - 4 : 4, w = r ? (549 - (n - 1)*gx)/n : cw, c = r ? i - 4 : i, x = lx + c*(w + gx), y = ly + 44 + r*82;
        h += `<div class="abs hr" style="left:${x}pt;top:${y}pt;width:${w}pt"></div><div class="abs fo-li-l" style="left:${x}pt;top:${y + 5}pt;width:${w}pt" data-slot="left.box.l${i}" data-lines="1">${esc(it.l)}</div>`;
        h += `<div class="abs" style="left:${x}pt;top:${y + 19}pt;width:${w}pt;height:${4*13.5}pt;font:300 9.5pt/13.5pt var(--fx-font);color:var(--fx-soft);overflow:hidden" data-slot="left.box.t${i}" data-lines="4" data-try="4,3,2" data-narrow="30" data-lh="13.5" ${FXS.sd(it.s)}></div>`; });
    } else {
      // no-plan: the stair beside the kitchen list (one column, ruled), both under the hero
      h += FXS.captioned(D, rest[0], 22, 296, 262, 385, 4, 'left.photo0', {fs: 9.5, lh: 12.5, min: 2});
      const cx = 319, cwid = 266;
      h += FO.kick(box.kicker || 'The kitchen', cx, 296, 'left.box.kicker');
      h += `<div class="abs fo-sub" style="left:${cx}pt;top:${312}pt;width:${cwid}pt" data-slot="left.box.heading" data-lines="1">${esc((box.heading || '').replace(/\.$/, ''))}</div>`;
      const pitch = items.length >= 7 ? 60.8 : 435.6/Math.max(1, items.length);   // fewer rows: spread so the last row's text ends level with the 7-row master's   // fewer rows spread down the same height (7 rows: the approved 60.8 pt)
      items.forEach((it, i) => { const y = 344 + i*pitch;
        h += `<div class="abs hr" style="left:${cx}pt;top:${y}pt;width:${cwid}pt"></div><div class="abs fo-li-l" style="left:${cx}pt;top:${y + 5}pt;width:${cwid}pt" data-slot="left.box.l${i}" data-lines="1">${esc(it.l)}</div>`;
        h += `<div class="abs" style="left:${cx}pt;top:${y + 19}pt;width:${cwid}pt;height:${3*14}pt;font:300 10pt/14pt var(--fx-font);color:var(--fx-soft);overflow:hidden" data-slot="left.box.t${i}" data-lines="3" data-try="2,3" data-narrow="70" data-lh="14" ${FXS.sd(it.s)}></div>`; });
    }
    return h;
  };

  // ---------------- INSIDE RIGHT (bedrooms and baths): the headline and intro on top, a large bath, the other rooms over the taupe foot ----------------
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs = FO.cards(D, P.right || []);
    let h = `<div class="taupeb" style="left:-9pt;top:650pt;width:630pt;height:161pt"></div>`;
    h += FO.kick(R.kicker || '', 36, 26, 'right.kicker') + FO.title(R.title || '', 36, 44, 549, 'right.title', 1, 15);
    h += FO.wu(R.intro || [], 36, 76, 549, 70, 'right.intro', 11, 16.5);
    const W = 268, PHs = [215 - 13.22, 240 - 13.22], X = [36, 585 - W], Y = [152, 466];
    cs.slice(0, 4).forEach((c, i) => { const cap = FXS.captioned(D, c, X[i % 2], Y[Math.floor(i/2)], W, PHs[Math.floor(i/2)], i < 2 ? 4 : 3, 'right.photo' + i, {fs: 10.25, lh: 13.22, min: 3}); h += i >= 2 ? FO.tp(cap) : cap; });
    return h;
  };

  // after the fill: an inside-right intro that sets fewer than three lines hands its freed room to the top row of photos (they grow upward),
  // so no empty band opens between the intro and the photos (blank check, 11/8); three lines or more: nothing moves (the approved 2-story page)
  FO.rightFit = () => { const el = document.querySelector('[data-slot="right.intro"]'); if(!el || !el.textContent.trim()) return; const n = SW.lines(el).n; if(n >= 3) return;
    const d = (3 - n)*16.5; ['right.photo0', 'right.photo1'].forEach(sl => { const ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), box = ph && ph.parentElement; if(!box) return;
      box.style.top = (parseFloat(box.style.top) - d) + 'pt'; box.style.height = (parseFloat(box.style.height) + d) + 'pt'; }); };

  // after the fill: top-row captions on the inside right that set fewer than their four lines: both photos grow down by the unused lines, labels and
  // captions moving with them, so no band opens above the bottom row (owner 11/8: four lines under the top photos where the facts allow; blank check)
  FO.rightCapFit = () => { const caps = ['right.photo0', 'right.photo1'].map(sl => document.querySelector(`.cap .a[data-slot="${sl}"]`)).filter(Boolean); if(!caps.length) return;
    const n = Math.max(...caps.map(c => SW.lines(c).n)), lh = +caps[0].dataset.lh || 13.22; if(n >= 4) return; const d = (4 - n)*lh;
    ['right.photo0', 'right.photo1'].forEach(sl => { const ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), box = ph && ph.parentElement, lbl = document.querySelector(`[data-slot="${sl}.label"]`), cap = document.querySelector(`.cap .a[data-slot="${sl}"]`);
      if(box) box.style.height = (parseFloat(box.style.height) + d) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + d) + 'pt'; if(cap) cap.style.top = (parseFloat(cap.style.top) + d) + 'pt'; }); };

  // after the fill: the single side photo on the inside left (the stair-beside-the-list layout) whose caption sets fewer than four lines grows
  // downward by the lines it did not use, its label and caption moving with it, so the panel's foot lines up with the approved 2-story page
  FO.leftFit = () => { if(document.querySelector('[data-slot="left.photo1"]')) return; const cap = document.querySelector('.cap .a[data-slot="left.photo0"]'); if(!cap) return;
    const n = SW.lines(cap).n, lh = +cap.dataset.lh || 12.5; if(n >= 4) return; const d = (4 - n)*lh;
    const ph = document.querySelector('.ph[data-slot-photo="left.photo0"]'), box = ph && ph.parentElement, lbl = document.querySelector('[data-slot="left.photo0.label"]');
    if(box) box.style.height = (parseFloat(box.style.height) + d) + 'pt';
    if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + d) + 'pt';
    cap.style.top = (parseFloat(cap.style.top) + d) + 'pt'; };

  // ---------------- BACK (fold-over) and flyer back ----------------
  // each place sits centered top to bottom between its rules (owner 11/7, p6); o.top/o.rowH line the last rule up with a list beside it
  const nearRows = (D, x, y, w, o) => { o = o || {}; const N = ((D.sw || {}).back || {}).nearby || [], top = o.top == null ? 20 : o.top, rh = o.rowH || 28, ds = o.d || 14, ps = o.p || 8;
    return N.slice(0, 3).map((n, i) => `<div class="fo-near" style="left:${x}pt;top:${y + top + i*rh}pt;width:${w}pt;height:${rh - 0.5}pt" data-slot="back.near${i}" data-lines="1" data-fine="1"><div class="in"><span class="d" style="font-size:${ds}pt">${esc(n.dist)}</span><span class="p" style="font-size:${ps}pt">${esc(n.place)}</span></div></div>`).join('') + FO.kick('Nearby', x, y, 'back.near.k'); };
  const agentCard = (D, x, y, w, h) => { const A = D.agent || {}, hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '', hz = hsSrc ? 82 : 0;
    let s = `<div class="fo-acard" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"></div>`;
    if(hz) s += `<div class="abs" style="left:${x}pt;top:${y}pt;width:${hz}pt;height:${h}pt;overflow:hidden"><img src="${esc(hsSrc)}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:center 20%"></div>`;
    const nx = hz ? x + hz + 12 : x + 14, nw = x + w - 12 - nx;
    s += `<div class="abs fo-acard" style="left:${nx}pt;top:${y + 10}pt;width:${nw}pt;height:${h - 20}pt;box-shadow:none;background:none"><div class="n" data-slot="agent.name" data-lines="1">${esc(A.name || '')}</div><div class="d" data-slot="agent.desig" data-lines="1" data-fine="1">REALTOR®</div><div class="p" style="margin-top:4pt" data-slot="agent.phone" data-lines="1">${esc(A.phone || '')}</div><div class="e" data-slot="agent.email" data-lines="1">${esc(A.email || '')}</div></div>`;
    s += `<div class="abs" style="left:${nx}pt;top:${y + h - 32}pt;width:${nw}pt;height:24pt">${FXS.logo(D, 0, 0, Math.min(nw, 120), 24, 'flex-start')}</div>`;
    return s; };
  // the plan on a white card exactly as wide as the plan needs (the plan fills the card's width): the card is sized from the drawing's own width at the height asked
  FO.planBox = (D, x, y, maxH, maxW) => { const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: D.plan.turn ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: !!D.plan.turn, angle: D.plan.turn && D.plan.kind === 'color' ? 270 : undefined}), cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 44, D.plan.minCard || 0)); return FXS.planCard(D, x, y, cw, maxH); };   // minCard: a narrow plan's card still holds its legend on one line
  // the standard contact block (templates/_shared/agentcard.js, panel layout: the agent left, the brokerage logo right), white type on the taupe band
  const contactBlock = (D, y) => { const A = D.agent || {}, b = D.brand || {}, hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    return `<div style="--cc-paper:var(--fx-taupe);--cc-ink:#fff;--cc-muted:#f4efe9;--cc-accent:#f4efe9;--cc-line:rgba(255,255,255,.45)">` + ContactCard.html([22, y, 563, FO.CARD_H], Object.assign({}, A, {headshot: hsSrc}), Object.assign({}, b, {logo: b.logo}), {layout: 'panel', size: 'short', fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: 'filter:brightness(0) invert(1)'}) + '</div>'; };
  FO.CARD_H = 62; FO.CARD_Y = 766.5 - FO.CARD_H;   // the footer rule: the card ends 0.35 in above the trim
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    const rowIds = flyer ? (P.flyerBack || []).concat([P.flyerRow4 || 'stair']) : (P.backRow || ['bath2']), rowCards = FO.cards(D, rowIds);
    let h = '', top, leftW;
    const TH = flyer ? (P.flyerTH || 312) : 292;   // flyerTH: a tall multi-floor plan gives the lists below room
    if(hasPlan){ const pc = FO.planBox(D, 22, 22, TH, 380); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom; leftW = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])); }
    else { leftW = 372; const c = FXS.cardFor(D, topId); h += FXS.captioned(D, c, 22, 22, leftW, 230, 3, 'back.top', {fs: 9.5, lh: 12.5, min: 3}); top = 22 + 230 + 25 + 3*12.5; }
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const gn = list => { if(!hasPlan || P.alias === false) return list; let done = false; return list.map(x => done ? x : [].concat(x).some(t => /game room/i.test(t)) ? (done = true, Array.isArray(x) ? x.map(t => t.replace(/game room/i, 'game room (the living room on the plan)')) : x.replace(/game room/i, 'game room (the living room on the plan)')) : x); };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, FT = KB.floorTitles || ['Second floor', 'First floor'], f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s)), ax = 22 + leftW + 16, aw = 585 - ax;
    // beside the plan or the deck: the second floor (the flyer: both floors)
    if(flyer){ // The house ends on the same line as the deck caption's last line (or the plan card's foot): owner 11/7, p12
      const n = Math.floor((top - 48)/14.5), lh = +((top - 48)/n).toFixed(3);
      h += FO.kick('The house', ax, 26, 'back.about.title') + FO.full(FO.wu(gn(keep(f2.concat(f1))), ax, 48, aw, n*lh + 0.01, 'back.about', 9.75, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-span="${(top - 48).toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
    } else h += FO.kick(FT[0], ax, 26, 'back.about.title') + FO.full(FO.wu(gn(keep(f2)), ax, 48, aw, Math.max(140, top - 48 - 6), 'back.about', 10.5, 16, 'body'));
    const y0 = top + 16;
    let rowEnd;
    if(flyer){
      // a short plan (a listing's own plan, wide and low) leaves room above the lists: the photo row takes it, never a blank band (owner 11/8, raw plans)
      const n = rowCards.length, gap = 10, tw = (563 - (n - 1)*gap)/n, need = 18 + 24 + 5*30 + 22, PH = 118 + Math.max(0, Math.min(90, FO.CARD_Y - need - 16 - (y0 + 118 + 25 + 4*11.5)));
      rowCards.forEach((c, i) => { h += FXS.captioned(D, c, 22 + i*(tw + gap), y0, tw, PH, 4, 'back.photo' + i, {fs: 8.5, lh: 11.5, min: 2}); });
      rowEnd = y0 + PH + 25 + 4*11.5;
    } else {
      const pw = 228, ph = 152 + Math.max(0, Math.min(90, FO.CARD_Y - (16 + 22 + 5*24 + 18) - 16 - (y0 + 152 + 25 + 3*12.5))); h += FXS.captioned(D, rowCards[0], 22, y0, pw, ph, 3, 'back.photo1', {fs: 9.5, lh: 12.5, min: 2}).replace('<div class="ph" data-photo="bath2"', '<div class="ph" data-zoom="1.8,0,0.5" data-photo="bath2"');
      rowEnd = y0 + ph + 25 + 3*12.5;
      const fx = 22 + pw + 16, fw = 585 - fx, nh = 20 + 3*28 + 2;
      h += FO.kick(FT[1], fx, y0 - 2, 'back.first.title') + FO.full(FO.wu(gn(keep(f1)), fx, y0 + 20, fw, rowEnd - y0 - 20 - nh - 8, 'back.first', 10, 15, 'body'));
      h += nearRows(D, fx, rowEnd - nh + 2, fw);
    }
    const by = rowEnd + 16;
    h += `<div class="taupeb" style="left:-9pt;top:${by}pt;width:630pt;height:${811 - by}pt"></div>`;
    let t;
    if(flyer){
      // round 3 (owner 11/7, p6/p12): the smaller contact block frees room, so the lists and Nearby set bigger and their rows fill down to it;
      // Nearby's last rule lines up with New and updated's last rule, each place centered between its rules
      const ty = by + 18, ly = ty + 24, W = [158, 172], X = [36, 36 + W[0] + 10, 36 + W[0] + 10 + W[1] + 12], fs = 10.5;
      const cap = Math.max(3, Math.min(5, Math.floor((FO.CARD_Y - 22 - ly)/19))), b1 = FXS.bullets(c1, X[0], 0, W[0], 1, 'x', cap, fs).n, b2 = FXS.bullets(c2, X[1], 0, W[1], 1, 'x', cap, fs).n, rows = Math.max(b1, b2, 3), rh = Math.min(32, (FO.CARD_Y - 22 - ly)/rows);
      t = FO.kick(t1, X[0], ty, 'back.updates.title') + FXS.bullets(c1, X[0], ly, W[0], rh, 'back.updates', cap, fs).html;
      t += FO.kick('Outside', X[1], ty, 'back.outside.title') + FXS.bullets(c2, X[1], ly, W[1], rh, 'back.outside', cap, fs).html;
      t += nearRows(D, X[2], ty, 592 - X[2], {top: ly - ty, rowH: b1*rh/3, d: 15, p: 8.25});
    } else {
      // carried from the flyer back (owner 11/7, p6): the smaller contact block's room goes to bigger list type
      const ty = by + 16, ly = ty + 22, cap = Math.max(3, Math.min(5, Math.floor((FO.CARD_Y - 18 - ly)/19))), rows = Math.max(Math.min(c1.length, cap), Math.min(c2.length, cap), 3), rh = Math.min(26, (FO.CARD_Y - 18 - ly)/rows);
      t = FO.kick(t1, 36, ty, 'back.updates.title') + FXS.bullets(c1, 36, ly, 254, rh, 'back.updates', cap, 11).html;
      t += FO.kick('Outside', 324, ty, 'back.outside.title') + FXS.bullets(c2, 324, ly, 261, rh, 'back.outside', cap, 11).html;
    }
    h += FO.tp(t);
    h += contactBlock(D, window.__cardY || FO.CARD_Y);
    return {html: h, issues};
  };
  // after the fill: a block with data-span spreads the lines it took over that height, so its last line ends where its neighbor's does (owner 11/7, p12)
  FO.span = () => document.querySelectorAll('[data-span]').forEach(el => { const T = +el.dataset.lines, lh = Math.min(+el.dataset.span/T, parseFloat(getComputedStyle(el).fontSize)*0.75*1.75); el.style.lineHeight = lh + 'pt'; el.style.height = (T*lh) + 'pt'; el.style.top = (parseFloat(el.style.top) + +el.dataset.span - T*lh) + 'pt'; });
  // the facts row: no two facts closer than 6 pt (text boxes measured on the letters)
  FO.factsCheck = () => { const out = [], it = [...document.querySelectorAll('.fo-fact')].map(e => { const r = document.createRange(); r.selectNodeContents(e); const qs = [...r.getClientRects()].filter(q => q.width > 1); return {slot: e.dataset.slot, l: Math.min(...qs.map(q => q.left)), r: Math.max(...qs.map(q => q.right)), t: Math.min(...qs.map(q => q.top)), b: Math.max(...qs.map(q => q.bottom))}; }).sort((a, b) => a.l - b.l);
    for(let i = 1; i < it.length; i++){ const a = it[i-1], b = it[i], gap = (b.l - a.r)*0.75, vo = Math.min(a.b, b.b) - Math.max(a.t, b.t); if(vo > 2 && gap < 6) out.push({slot: b.slot, kind: 'facts-collide', detail: `${a.slot} and ${b.slot} are ${gap.toFixed(1)} pt apart (6 pt minimum)`}); }
    return out; };
  // no text may sit under a photo or the agent card (the owner's clearance rule, 11/7): any text box that overlaps one fails
  FO.overlapCheck = () => { const out = [], els = [...document.querySelectorAll('.ph, .fo-acard:not(.abs)')].map(e => ({e, r: e.getBoundingClientRect()})).filter(x => x.r.width > 2 && x.r.height > 2), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement; if(!p || !n.textContent.trim() || p.closest('script, style, .plan-svg, .planwrap, .fo-acard, .logo')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(q => { if(q.width < 2 || q.height < 2) return;
        els.forEach(({e, r}) => { if(e.contains(p)) return; const ox = Math.min(q.right, r.right) - Math.max(q.left, r.left), oy = Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top);
          if(ox > 1.5 && oy > 3) out.push({slot: (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || 'text', kind: 'text-under-element', detail: `"${n.textContent.trim().slice(0, 28)}" overlaps a ${e.className.split(' ')[0]}`}); }); }); }
    const seen = new Set(); return out.filter(i => { const k = i.slot + i.detail; if(seen.has(k)) return false; seen.add(k); return true; }); };
})();
