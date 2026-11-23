/* Serif Headline fold-over and two-sided flyer builders (the fill machinery grown from the FXS-14 builders through the pilot; the hand is
   the approved Open House library flyer P20). Panel coordinates in pt: trim 612 x 792 (the proof page adds a 9 pt bleed; anything that bleeds runs to -9 / 621 / 801).
   B01's closed frame sits at 20/30/592/776 on every panel, drawn last. After the fill: FO.refit sets any block, caption row or table
   that still misses the fill rules again (type size, line count, caption widths, at its own height); FO.capSnug / frontSnug / sideCenter /
   leftHead close the room a block did not use. */
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
    else if(best.pick){ el.style.fontSize = best.fs + 'pt'; el.innerHTML = (el.dataset.growlead && el.dataset.lead ? `<b>${SW.esc(el.dataset.lead)}</b> ` : '') + best.pick.map(x => x.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))).join(' '); SW.noteGrams(el, best.pick.join(' ')); }
    const lh = el.dataset.span ? best.fs*r : Math.min(H/best.n, best.fs*1.7);
    el.style.lineHeight = lh + 'pt'; el.style.height = (best.n*lh) + 'pt'; el.dataset.lines = best.n; el.style.textAlign = 'justify'; });
  // owner 11/8/2026 (FXS-14 versions review p3-p27, standing rule): every write-up runs at least three full lines at its full width (never narrowed, so no line
  // runs past the rule above it), set ragged with every line 80%+ while its true sentences are picked and the last line 90%+, then justified so every line but
  // the last reaches the edge. Runs before SW.fill on the fold-over and flyer; FO.just3 justifies after the fill; FO.fill3Check reports any block that misses.
  FO.prep3 = () => document.querySelectorAll('[data-s][data-slot]').forEach(el => {
    el.dataset.narrow = '0'; el.dataset.fill = Math.max(0.9, +el.dataset.fill || 0); el.dataset.lfill = Math.max(+el.dataset.lfill || 0, el.dataset.h0 ? 0.8 : !(/\.box\.t\d+$/.test(el.dataset.slot) || el.closest('.cap')) ? 0.75 : parseFloat(el.style.width) < 150 ? 0.8 : 0.84); el.dataset.j3 = '1';   // rows and captions 84% (80% in a narrow column) while picked so the box check holds; floor write-ups their approved 80%; intros 75% el.dataset.j3 = '1';   // a table row: 84% while picked so the box check (80%) holds; a floor write-up keeps its approved 80%
    if(el.dataset.try){ let t = el.dataset.try.split(',').map(Number).filter(n => n >= 3); if(el.dataset.span){ const S = JSON.parse(el.dataset.s).slice(0, +el.dataset.pool || 12).map(x => [].concat(x).sort((p, q) => q.length - p.length)[0]), keep = el.innerHTML;   // a spread write-up: only the counts its sentences can reach
        el.innerHTML = SW.esc(S.join(' ')); const most = SW.lines(el).n; el.innerHTML = keep; const r = t.filter(n => n <= most); t = r.length ? r : t.slice(-1); }
      else if(el.dataset.h0) t = t.slice(0, 2);   // a floor write-up fills its box (its top two counts), never a short block over blank space (owner p21/p27)
      el.dataset.try = (t.length ? t : [3]).join(','); }
    if(el.closest('.cap')){ el.dataset.min = Math.max(3, +el.dataset.min || 0); } });
  FO.just3 = () => document.querySelectorAll('[data-j3]').forEach(el => { if(el.textContent.trim() && SW.lines(el).n >= 2) el.style.textAlign = 'justify'; });
  const worstGap = el => { let worst = 0; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const t = n.textContent; for(let i = 0; i < t.length; i++){ if(t[i] !== ' ') continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const q = r.getBoundingClientRect(); if(q.width > worst && q.height > 0) worst = q.width; } }
    return worst; };
  // a justified block whose word gaps open past 3.2 spaces: first a quarter-point step in its size (down to -1 pt, up to +0.5 pt) that keeps its
  // line count and its full last line and closes the gaps; only then is it set ragged (Serif Headline, 11/16)
  FO.gaps = () => document.querySelectorAll('[data-slot]').forEach(el => { if(el.dataset.rag){ el.style.textAlign = 'left'; return; }
    if(getComputedStyle(el).textAlign !== 'justify' || el.querySelector('[data-slot]')) return;
    const bad = () => worstGap(el) > parseFloat(getComputedStyle(el).fontSize)*0.28*3.2; if(!bad()) return;
    const f0 = parseFloat(el.style.fontSize) || parseFloat(getComputedStyle(el).fontSize)*0.75, L0 = SW.lines(el);
    for(const d of [-0.25, 0.25, -0.5, 0.5, -0.75, -1]){ el.style.fontSize = (f0 + d) + 'pt'; const L = SW.lines(el); if(L.n === L0.n && L.fill >= Math.min(0.9, L0.fill) && !bad()) return; }
    el.style.fontSize = f0 + 'pt'; el.style.textAlign = 'left'; });
  FO.fill3Check = () => [...document.querySelectorAll('[data-j3]')].filter(el => el.textContent.trim()).flatMap(el => { const L = SW.lines(el);
    return L.n < 3 ? [{slot: el.dataset.slot, kind: 'writeup-under-3-lines', lines: L.n}] : L.fill < 0.895 ? [{slot: el.dataset.slot, kind: 'writeup-last-line-short', pct: Math.round(L.fill*100)}] : []; });

  // Serif Headline: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
  // fill their lines (every line 80%+ set ragged, the last 90%+), all rows the same; rows keep their height (lines x leading <= the box).
  // Tried from the row's own size up 1.75 pt in 0.25 steps, then down 0.5; the best partial answer stays when none fits every row.
  FO.tableFit = () => { const T = new Map();
    document.querySelectorAll('[data-slot][data-s]').forEach(el => { const m = /^(.*\.box)\.t\d+$/.exec(el.dataset.slot || ''); if(m) (T.get(m[1]) || T.set(m[1], []).get(m[1])).push(el); });
    T.forEach(rows => { const H = Math.min(...rows.map(e => +e.dataset.h00 || (e.dataset.h00 = parseFloat(e.style.height)))), fs0 = parseFloat(rows[0].style.fontSize) || parseFloat(getComputedStyle(rows[0]).fontSize)*0.75;
      const counts = [...new Set([].concat(...rows.map(e => (e.dataset.try || e.dataset.lines).split(',').map(Number))))].filter(n => n >= 3).sort((a, b) => b - a);
      const sizes = []; for(let f = fs0; f <= fs0 + 1.75 + 1e-6; f += 0.25) sizes.push(+f.toFixed(2)); sizes.push(fs0 - 0.25, fs0 - 0.5);
      let best = null;
      for(const n of counts) for(const f of sizes){ const lh = Math.min(H/n, f*1.42); if(lh < f*1.18) continue;
        let ok = 0; const picks = rows.map(e => { e.style.fontSize = f + 'pt'; e.style.lineHeight = lh + 'pt'; e.style.height = 'auto'; const b = SW.pfN(e, n); if(b) ok++; return b; });
        if(!best || ok > best.ok) best = {ok, n, f, lh, picks};
        if(ok === rows.length) break; }
      if(best && best.ok === rows.length || best && best.ok > 0){ rows.forEach((e, i) => { e.style.fontSize = best.f + 'pt'; e.style.lineHeight = best.lh + 'pt'; e.style.height = (best.n*best.lh) + 'pt'; e.dataset.lines = best.n;
        const p = best.picks[i]; if(p){ e.innerHTML = p.pick.map(x => SW.esc(x)).join(' '); SW.noteGrams(e, p.pick.join(' ')); delete e.dataset.diag; } }); }
    }); };

  // Serif Headline refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
  // (three lines or more, every line 80%+ set ragged, the last 90%+, rows of one table or one photo row on one line count) is set again
  // as a group: the line counts it may take x type sizes from its own size up a quarter (0.25 pt steps) and down 8%, at its own height
  // (the leading follows), until every member's true sentences fill. Nothing is cut or narrowed; only whole sentences, only real copy.
  const okEl = (el, T) => { const L = SW.lines(el); return L.n === T && L.fill >= Math.max(0.895, (+el.dataset.fill || 0) - 0.005) && (L.n < 2 || L.min >= 0.8) && !SW.sameFactIn(el.textContent) && !SW.rep5(el.textContent); };
  FO.refit = () => { const G = new Map();
    document.querySelectorAll('[data-s][data-slot]').forEach(el => { if(!el.getClientRects().length || el.dataset.nofit) return;
      const tb = /^(.*\.box)\.t\d+$/.exec(el.dataset.slot || ''), cap = el.closest('.cap'), face = el.closest('.panel, .sheet');
      const key = tb ? 'tb:' + tb[1] : cap ? 'cap:' + [...document.querySelectorAll('.panel, .sheet')].indexOf(face) + ':' + Math.round(parseFloat(el.style.top)) : 'el:' + el.dataset.slot;
      (G.get(key) || G.set(key, []).get(key)).push(el); });
    [...G.values()].sort((a, b) => (b[0].closest('.cap') ? 1 : 0) - (a[0].closest('.cap') ? 1 : 0)).forEach(els => { const n0 = Math.max(...els.map(e => SW.lines(e).n));   // photo captions first: their pools are the thinnest
      const minl = +els[0].dataset.minl || 3;
      const clash = els.some(e => { if(!e.closest('.cap')) return false; const face = e.closest('.panel, .sheet'), mine = SW.sentences(e.textContent, e.dataset.lead || ''); return [...(face ? face.querySelectorAll('.cap .a[data-slot]') : [])].some(o => o !== e && SW.sentences(o.textContent, '').some(x => mine.some(y => SW.sameFact(x, y)))); });
      if(n0 >= minl && !clash && els.every(e => okEl(e, n0))) return;
      const H = Math.min(...els.map(e => +e.dataset.hbox || +e.dataset.hfit || (e.dataset.hfit = parseFloat(e.style.height) || e.getBoundingClientRect().height*0.75)));   // the planned box (data-hbox) when the caption has one, not the height the first fill left it at
      const fs0 = +els[0].dataset.fs0 || (els[0].dataset.fs0 = parseFloat(getComputedStyle(els[0]).fontSize)*0.75);
      const tmax = Math.max(3, Math.min(8, Math.floor((H + 24)/(fs0*1.18)))), counts = []; for(let t = tmax; t >= minl; t--) if(Math.abs(t - Math.max(minl, n0)) <= 1 || els.every(e => e.closest('.cap.side') || e.dataset.sidecap) || (els.length > 1 && els.every(e => e.dataset.nopair))) counts.push(t);   // a locked row (data-nopair) may take any count its box allows
      const sizes = []; for(let f = fs0; f <= fs0*1.28 + 1e-6; f += 0.2) sizes.push(+f.toFixed(2)); for(let f = fs0 - 0.2; f >= fs0*0.92 - 1e-6; f -= 0.2) sizes.push(+f.toFixed(2));
      const keep = els.map(e => [e.innerHTML, e.style.fontSize, e.style.lineHeight, e.style.height]);
      let done = false;
      // a row of two photo captions may share its width unevenly (each photo as wide as its caption's true sentences fill)
      const pair = els.length === 2 && els.every(e => e.closest('.cap') && !e.closest('.cap.side') && !e.dataset.nopair), parts = pair ? els.map(e => { const sl = e.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), lb = document.querySelector(`[data-slot="${sl}.label"]`); return {e, pb: ph && ph.parentElement, lb: lb && lb.parentElement, x: parseFloat(e.style.left), w: parseFloat(e.style.width)}; }).sort((p, q) => p.x - q.x) : null;
      const split = r => { if(!pair) return; const [A, B] = parts, span = B.x + B.w - A.x, g = B.x - A.x - A.w, wa = (span - g)*r, wb = span - g - wa;
        [[A, A.x, wa], [B, A.x + wa + g, wb]].forEach(([P, x, w]) => { [P.e, P.pb, P.lb].forEach(el => { if(el){ el.style.left = x + 'pt'; el.style.width = w + 'pt'; } }); if(P.lb && P.lb.firstElementChild) P.lb.firstElementChild.style.maxWidth = w + 'pt'; P.e.dataset.w0 = w; P.e.__pfMemo = null; }); };
      const ratios = pair ? [0.5, 0.55, 0.45, 0.6, 0.4, 0.64, 0.36] : [null];
      const side = els.length === 1 && els[0].closest('.cap.side'), spb = side ? (() => { const ph = document.querySelector(`.ph[data-slot-photo="${els[0].dataset.slot}"]`); return ph && ph.parentElement; })() : null, pw0 = spb ? (+spb.dataset.pw0 || (spb.dataset.pw0 = parseFloat(spb.style.width))) : 0;
      const shrink = els.length === 1 && els[0].dataset.shrinkphoto, sp = shrink ? (() => { const e = els[0], sl = e.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), lb = document.querySelector(`[data-slot="${sl}.label"]`); return {pb: ph && ph.parentElement, lb: lb && lb.parentElement}; })() : null;
      const ms = side ? [1, 0.88, 0.76, 1.15, 1.3] : shrink ? [1, 0.93, 0.86, 0.8, 0.74, 0.68] : (els[0].dataset.measures || '1').split(',').map(Number), w0 = +els[0].dataset.wfit || (els[0].dataset.wfit = parseFloat(els[0].style.width)), x0 = +els[0].dataset.xfit || (els[0].dataset.xfit = parseFloat(els[0].style.left));
      const flex = els.every(e => e.closest('.cap') || e.dataset.flexh);   // a caption beside its photo: as many lines as it fills, top aligned
      // a caption under its photo may take up to 24 pt from the photo's foot when a bigger size needs the room (the label and caption move up with it)
      const capParts = els.map(e => { const sl = e.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), lb = document.querySelector(`[data-slot="${sl}.label"]`); return {e, pb: !e.closest('.cap.side') && ph && ph.parentElement, lb: lb && lb.parentElement}; });
      capParts.forEach(c => { c.ph0 = c.pb ? parseFloat(c.pb.style.height) : 0; c.lt0 = c.lb ? parseFloat(c.lb.style.top) : 0; c.et0 = parseFloat(c.e.style.top); });
      const lift = d => capParts.forEach(c => { if(!c.pb) return; c.pb.style.height = (c.ph0 - d) + 'pt'; if(c.lb) c.lb.style.top = (c.lt0 - d) + 'pt'; c.e.style.top = (c.et0 - d) + 'pt'; });
      for(const rr of ratios){ if(done) break; if(rr != null) split(rr);
      for(const m of ms){ if(ms.length > 1) els.forEach(e => { e.style.width = (w0*m) + 'pt'; e.style.left = (side ? x0 + w0*(1 - m) : e.dataset.malign === 'left' || shrink ? x0 : x0 + w0*(1 - m)/2) + 'pt'; if(side && spb){ spb.style.width = (pw0 + w0*(1 - m)) + 'pt'; const lb = document.querySelector(`[data-slot="${e.dataset.slot}.label"]`); if(lb) lb.parentElement.style.left = e.style.left; } e.dataset.w0 = w0*m; e.__pfMemo = null; if(shrink){ [sp.pb, sp.lb].forEach(q => { if(q) q.style.width = (w0*m) + 'pt'; }); if(sp.lb && sp.lb.firstElementChild) sp.lb.firstElementChild.style.maxWidth = (w0*m) + 'pt'; } });
      for(const f of sizes){ for(const T of counts){ const lh = flex ? f*1.32 : H/T; if(!flex && (lh < f*1.2 || lh > f*1.75)) continue; const over = flex ? T*lh - H : 0; if(over > 24.5 || (over > 0.5 && capParts.some(c => !c.pb || isNaN(c.et0) || (c.ph0 - over) < parseFloat(c.pb.style.width)/2.7))) continue; lift(Math.max(0, over));
          let dead = false; const picks = els.map(e => { if(dead) return null; e.style.fontSize = f + 'pt'; e.style.lineHeight = lh + 'pt'; e.style.height = (flex ? T*lh : H) + 'pt'; e.style.textAlign = 'left'; const b = SW.pfN(e, T); if(!b) dead = true; /* one member cannot fill at this size and count: the rest are not tried */ if(b){ const lead = e.dataset.lead || ''; e.innerHTML = (lead ? `<b>${SW.esc(lead)}</b> ` : '') + b.pick.map(x => SW.esc(x)).join(' '); } return b; });   // each member set as soon as it is picked, so the next one sees it
          if(picks.every(Boolean)){ els.forEach((e, i) => { const lead = e.dataset.lead || ''; e.innerHTML = (lead ? `<b>${SW.esc(lead)}</b> ` : '') + picks[i].pick.map(x => SW.esc(x)).join(' '); SW.noteGrams(e, lead + ' ' + picks[i].pick.join(' ')); e.dataset.lines = T; delete e.dataset.diag; });
            if(els.every(e => okEl(e, T))){ done = true; break; } } }
        if(done) break; }
      if(done) break; }
      }
      if(!done && pair) split(0.5);
      if(!done) lift(0);
      if(!done){ els.forEach((e, i) => { [e.innerHTML, e.style.fontSize, e.style.lineHeight, e.style.height] = keep[i]; }); if(ms.length > 1) els.forEach(e => { e.style.width = w0 + 'pt'; e.style.left = x0 + 'pt'; e.dataset.w0 = w0; if(shrink) [sp.pb, sp.lb].forEach(q => { if(q) q.style.width = w0 + 'pt'; }); }); }
    }); };

  // after the fill: a row of captions that set fewer lines than their box hands the unused lines to its photos (they grow down; the label
  // and caption move with them), so no gap opens under a caption (textbox-underfull, blank check)
  FO.capSnug = () => { const rows = new Map();
    document.querySelectorAll('.cap .a[data-slot]').forEach(el => { const k = Math.round(parseFloat(el.style.top)) + '|' + [...document.querySelectorAll('.panel, .sheet')].indexOf(el.closest('.panel, .sheet')); (rows.get(k) || rows.set(k, []).get(k)).push(el); });
    rows.forEach(els => { if(els.some(e => e.closest('.cap.side'))) return; const lh = parseFloat(els[0].style.lineHeight) || +els[0].dataset.lh || 13, box = Math.max(+els[0].dataset.hfit || 0, +els[0].dataset.hbox || 0) || parseFloat(els[0].style.height), n = Math.max(...els.map(e => SW.lines(e).n)); if(!(n >= 1) || n*lh >= box - 0.5) return; const d = box - n*lh;
      els.forEach(el => { const sl = el.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), pb = ph && ph.parentElement, lbl = document.querySelector(`[data-slot="${sl}.label"]`);
        if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + d) + 'pt';
        el.style.top = (parseFloat(el.style.top) + d) + 'pt'; el.style.height = (n*lh) + 'pt'; el.dataset.lines = n; }); }); };
  FO.sideCenter = () => document.querySelectorAll('.cap.side').forEach(c => { const a = c.querySelector('.a'), lbl = a && document.querySelector(`[data-slot="${a.dataset.slot}.label"]`); if(!a || !lbl) return;
    const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight), hh = 20 + n*lh, top = +c.dataset.phTop + (+c.dataset.phH - hh)/2; a.style.height = (n*lh) + 'pt'; lbl.parentElement.style.top = top + 'pt'; a.style.top = (top + 20) + 'pt'; });
  // after the fill: an inside-left intro whose true sentences are all said elsewhere on the piece (it cannot set three full lines) is left out;
  // the heading column then sets its title larger and sits centered beside the room photo
  FO.leftHead = () => { const it = document.querySelector('[data-slot="left.intro"]'), ti = document.querySelector('[data-slot="left.title"]'), kk = document.querySelector('[data-slot="left.kicker"]'), ru = document.querySelector('[data-role="left-rule"]');
    if(!it || !ti || !kk || !ru) return; const L = SW.lines(it); if(it.textContent.trim() && L.n >= 3 && L.fill >= 0.895) return;
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:'EB Garamond';font-weight:600;letter-spacing:3.4pt", HW, 24, 13, 5), lh = T.f*1.3, H = 17 + T.n*lh + 9 + 1.2, y = 30 + (270 - 30 - H)/2;
    kk.style.top = y + 'pt'; ti.style.top = (y + 17) + 'pt'; ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = (T.n*lh) + 'pt'; ti.dataset.lines = T.n; ru.style.top = (y + 17 + T.n*lh + 9) + 'pt'; };
  // after the fill: the cover write-up sits on the frame's foot; the rooms above it grow down into any room it did not use (no empty band)
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = 766 - n*lh;
    const lbls = [...document.querySelectorAll('[data-slot^="front.strip"][data-slot$=".label"]')]; if(!lbls.length) return; const lb = Math.max(...lbls.map(l => parseFloat(l.style.top) + 11)), d = top - 16 - lb; su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt'; if(d <= 0) return;
    lbls.forEach(l => { l.style.top = (parseFloat(l.style.top) + d) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---- helpers kept from the pilot engine ----
  // how many lines a text sets in width w (greedy word wrap, measured)
  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  // a heading that wraps: the size (from max down) at which its last line is at least 80% of the box (the last-line rule), else the largest one-line size
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  FO.fitTitle = (t, fam, w, max, min, maxLines) => { for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w)) return {f, n: L.length, w}; }
    for(const k of [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6]) for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w*k); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w*k)) return {f, n: L.length, w: w*k}; }
    return {f: min, n: FO.wrapLines(t, `${fam};font-size:${min}pt`, w).length, w}; };
  // the standard contact card as B01's footer: agent on the left, the brokerage panel on the right with the one logo, knockout on the dark
  FO.contact = (D, x, y, w, H, onFloor) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = HL.logoSrc(D, onFloor); const ko = onFloor && !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 180, lh = Math.min(46, H - 30), s = {name: 18, nameFloor: 15, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div style="--cc-display:'EB Garamond';--cc-body:Manrope">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };
  // Design pass 11/15: a dusk exterior of the same house is the hero when the listing has one (photos.<id>.dusk)
  FO.heroId = (D, id) => { const ph = D.photos || {}, sp = SW.space(D, id); if((ph[id] || {}).dusk) return id; const d = Object.keys(ph).find(k => ph[k].dusk && ph[k].fullHouse && SW.space(D, k) === sp); return d || id; };
  FO.isDusk = (D, id) => !!((D.photos || {})[id] || {}).dusk;
  // Design pass 11/15: hero crops go tighter on the subject house, but never under 300 ppi. After SW.focus has placed the crop, a hero whose
  // house (photos.<id>.box) leaves room on every side is enlarged in its frame, centered on the house, until the house has a 5% margin
  // (the whole roof and both sides always stay inside). The enlargement is capped by the photo's OWN pixels (photos.<id>.w/h, never the
  // renderer's enlarged copy) at the printed size: only a photo with pixels to spare is tightened, and only as far as 300 ppi allows.
  // SW.check fails any photo enlarged in its frame past that (hero-enlarged-under-300ppi).
  FO.tighten = (D, m) => { m = m == null ? 0.05 : m; document.querySelectorAll('.ph[data-photo]').forEach(el => { if(!/^front\.(house|hero)$/.test(el.dataset.slotPhoto || '')) return; const p = (D.photos || {})[el.dataset.photo], img = el.querySelector('img'); if(!p || !p.box || !img || !p.w || !p.h) return;
    const W = p.w, H = p.h, tw = el.clientWidth, th = el.clientHeight, ia = W/H, ta = tw/th, vis = ia > ta ? {w: ta/ia, h: 1} : {w: 1, h: ia/ta};
    const ppi1 = W*vis.w/(tw/96), zmax = ppi1/300;   // the photo's own resolution in this frame before any enlargement; the most it may be enlarged
    const [x0, y0, x1, y1] = p.box, z = Math.min(1.5, zmax, vis.w/((x1 - x0) + 2*m), vis.h/((y1 - y0) + 2*m)); if(!(z > 1.03)) return;
    const op = (img.style.objectPosition || '50% 50%').split(' ').map(v => parseFloat(v)/100), px = isNaN(op[0]) ? .5 : op[0], py = isNaN(op[1]) ? .5 : op[1];
    const place = (c, v, p0) => { const lo = (1 - v)*p0, start = Math.min(Math.max(c - v/(2*z), lo), lo + v - v/z); return (start - lo)/v; };   // where the enlarged window starts inside the crop (0 .. 1 - 1/z)
    const sx = place((x0 + x1)/2, vis.w, px), sy = place((y0 + y1)/2, vis.h, py);
    img.style.cssText = `position:absolute;max-width:none;width:${z*100}%;height:${z*100}%;left:${-sx*z*100}%;top:${-sy*z*100}%;object-fit:cover;object-position:${px*100}% ${py*100}%`; }); };
  // Design pass 11/15: a labeled table in the set's own panel. Every row is one full line: the label in accent caps in a column as wide as
  // the longest label needs (labels never touch values), then the fullest true wording of the row that sets on one line. The type size
  // (10 to 12 pt) and the value column's width are chosen so the most rows fill 86% or more of their line (set ragged: a one-line row justified opens wide word gaps).
  // A row that cannot fill its line is left out while four or more remain (a short row reads as a mistake); kept rows keep their order.
  FO.tableRows = (items0, liw, taken, o) => { o = o || {}; const lcss = 'font-family:Manrope;font-weight:500;font-size:8.6pt;letter-spacing:2.2pt', LW0 = o.stack ? 0 : Math.ceil(Math.max(...items0.map(it => FXS.width(String(it.l).toUpperCase(), lcss)))) + 20;
    const ok = a => !taken || !taken(a); let best = null; const MIN = 0.86, opts = o.stack ? (o.Vs || [178, 184, 190, 196, 202, 208, 214]).map(V => [0, V]) : [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60].map(d => [LW0 + d, liw - LW0 - d]);
    for(let f = o.stack ? 10 : 10.5; f <= (o.stack ? 11.51 : 12.01); f += 0.25) for(const [LW, V] of opts){ const css = `font-family:Manrope;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bw = 0;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const w = FXS.width(t, css); if(w <= V - 2 && w > bw){ bw = w; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt, fill: bw/V}; }).filter(r => r.t);
      const full = Math.min(rows.filter(r => r.fill >= MIN).length, o.maxRows || 99), score = full*100 + (LW === LW0 ? 3 : 0) + f - (o.stack ? V*0.04 : rows.filter(r => r.fill < MIN).length*2) + Math.min(...rows.map(r => r.fill).concat(1))*10;
      if(!best || score > best.score) best = {score, f, LW, V, rows}; }
    let rows = best.rows; const good = rows.filter(r => r.fill >= MIN);
    if(good.length >= 4) rows = good; else { const keep = rows.slice().sort((a, b) => b.fill - a.fill).slice(0, Math.max(4, good.length)); rows = rows.filter(r => keep.includes(r)); }
    return Object.assign(best, {rows: rows.slice(0, o.maxRows || 99)}); };
  // Design pass 11/15 (second review): the card beside the kitchen is the fold-over's one light moment (B01's white card), four rows of real
  // detail. Each row is its label over TWO full lines (the first 80%+ of the measure, the last 90%+, by the house fill rules): the
  // wording, the type size (10 to 11.5 pt) and the measure are chosen so every kept row fills; a row that cannot is left out.
  FO.wrapW = (t, css, V) => { const out = []; let cur = ''; String(t).split(' ').forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > V - 0.5){ out.push(FXS.width(cur, css)); cur = wd; } else cur = tr; }); if(cur) out.push(FXS.width(cur, css)); return out; };
  FO.tableRows2 = (items0, taken, o) => { o = o || {}; const ok = a => !taken || !taken(a); let best = null;
    for(const f of (o.fs || [10, 10.25, 10.5, 10.75, 11, 11.25, 11.5])) for(const V of (o.Vs || [184, 190, 196, 202, 208, 214, 220])){ const css = `font-family:Manrope;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || /^(It|Its|They|Their|This|That)\b/.test(t) || SW.sameFactIn(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== 2 || Lw[0] < 0.8*V || Lw[1] < 0.9*V) return; const sc = (Lw[0] + Lw[1])/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 4), score = n*100 + f*2 - V*0.05;
      if(!best || score > best.score) best = {score, f, V, LW: 0, rows: rows.slice(0, o.maxRows || 4)}; }
    return best; };
  // each nearby place sits centered top to bottom between its rules (owner 11/7, p6)
  const nearRows = (D, x, y, w, o) => { o = o || {}; const N = ((D.sw || {}).back || {}).nearby || [], top = o.top == null ? 20 : o.top, rh = o.rowH || 28, ds = o.d || 15, ps = o.p || 8.5;
    const pfit = Math.min(...N.slice(0, 3).map(n => { let q = ps; while(q > 8.5 && FXS.width(String(n.dist), `font-family:'EB Garamond';font-weight:500;font-size:${ds}pt`) + 9 + FXS.width(String(n.place).toUpperCase(), `font-family:Manrope;font-weight:500;letter-spacing:1.6pt;font-size:${q}pt`) > w - 3) q -= 0.2; return q; }));
    return N.slice(0, 3).map((n, i) => `<div class="fo-near" style="left:${x}pt;top:${y + top + i*rh}pt;width:${w}pt;height:${rh - 0.5}pt" data-slot="back.near${i}" data-lines="1" data-fine="1"><div class="in"><span class="d" style="font-size:${ds}pt">${esc(n.dist)}</span><span class="p" style="font-size:${pfit}pt">${esc(n.place)}</span></div></div>`).join('') + FO.kick('Nearby', x, y, 'back.near.kicker'); };
  // the plan in its box (the design's own dark background; the plan prints clear with light lines, PlanInk). Design pass 11/15: the box is as
  // wide as the drawing needs and no wider (a narrow plan gets a narrow box; the write-up beside it takes the rest)
  FO.planBox = (D, x, y, maxH, maxW) => { const A = D.plan.turn && D.plan.kind === 'color' ? 270 : undefined, rot = !!D.plan.turn, noteW = Math.ceil(FXS.width((D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate.', 'font-family:Manrope;font-size:8pt')) + 34;
    const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: rot ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: rot, angle: A}); let cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 40, D.plan.minCard || 0, noteW, 188));
    // the plan may print smaller than the box allows (its own resolution): the box then follows the drawing, never a small plan in a big box
    for(let hh = maxH; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: cw - 28.8, h: hh}, {allowRotate: rot, angle: A}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')){ if(big.usedW) cw = Math.min(cw, Math.max(Math.ceil(big.usedW) + 40, D.plan.minCard || 0, noteW, 188)); break; } }
    return FXS.planCard(D, x, y, cw, maxH); };
  FO.CARD_H = 62; FO.CARD_Y = 688;   // B01's footer: the card at 694, the fine print at 762, inside the frame
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:756pt;width:${CW}pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };

  // ================= Serif Headline (grown from the approved Open House library flyer P38 and its sign-in sheet) =================
  // White paper, near-black ink. The two-tone headline: EB Garamond roman, big and tight, centered, its closing words in the agent's main
  // color. The ruled register: a centered line of tracked capitals (or a serif line) held between two thin rules (the flyer's date line).
  // The outlined ring with a line icon (the flyer's facts column). The floor: a solid field of the main color, edge to edge, under the lower
  // part of the page; the page's main photo stands across its top edge. On the floor type turns white and the closing words gold.
  // Every page is built on its center line (the flyer's centered axis); the inside spread is built on the fold.
  const X0 = 40, X1 = 572, CW = X1 - X0, MID = (X0 + X1)/2;
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW; FO.MID = MID;
  FO.frame = () => '';
  const GAR = (wt, ls) => `font-family:'EB Garamond';font-weight:${wt || 500};letter-spacing:${ls == null ? '-0.018em' : ls}`;
  const MAN = (fs, ls, wt) => `font-family:Manrope;font-weight:${wt || 600};letter-spacing:${ls || 0}pt;font-size:${fs}pt`;
  FO.GAR = GAR; FO.MAN = MAN;
  // the flyer's line icons (templates/oh-library/ohlib.js OHL.ICON, copied: the library is read-only)
  HL.ICON = {
    bed:'<svg viewBox="0 0 24 24"><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/></svg>',
    bath:'<svg viewBox="0 0 24 24"><path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 12V5a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/></svg>',
    area:'<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 9h5M15 4v5M9 20v-5M20 15h-5"/></svg>',
    pin:'<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>',
    cal:'<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    lot:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" stroke-dasharray="2.2 1.8"/><path d="M7.5 14.5l4.5-4 4.5 4M9 13.2V17h6v-3.8"/></svg>',
    stories:'<svg viewBox="0 0 24 24"><path d="M4 11l8-6 8 6M6 9.5V20h12V9.5M6 14.5h12"/></svg>'
  };
  HL.icon = (name, size) => (HL.ICON[name] || HL.ICON.pin).replace('<svg', `<svg style="width:${size}pt;height:${size}pt;stroke:currentColor;fill:none;stroke-width:1.5;display:block"`);
  // the listing facts as [icon, text], the flyer's own list (beds, baths, square feet, year built, lot size; stories only when short)
  HL.facts = L => { const f = [], n = v => Number(v).toLocaleString('en-US');
    if(L.beds) f.push(['bed', `${L.beds} bedroom${L.beds == 1 ? '' : 's'}`]);
    if(L.baths){ const bt = BD.bathsText(L); f.push(['bath', bt.main.toLowerCase()]); if(bt.half) f.push(['bath', bt.half.toLowerCase()]); }
    if(L.sqft) f.push(['area', `${n(L.sqft)} square feet`]);
    const yr = L.yearBuilt || L.year; if(yr) f.push(['cal', `Built in ${yr}`]);
    const lot = L.lotAcres ? (L.lotAcres >= 0.5 ? `${L.lotAcres} acre lot` : `${n(Math.round(L.lotAcres*43560))} sq ft lot`) : L.lotSqft ? `${n(L.lotSqft)} sq ft lot` : L.lotSize ? String(L.lotSize).replace(/\bSq Ft\b/i, 'sq ft').replace(/\bLot\b/, 'lot') : '';
    if(lot) f.push(['lot', lot]);
    if(f.length < 5 && L.stories) f.push(['stories', L.stories == 1 ? 'One story' : `${L.stories} stories`]);
    return f; };
  // the ring: an outlined circle (1 pt, the main color; white on the floor) with a line icon centered in it
  HL.ring = (icon, cx, cy, d, cls) => `<div class="sh-ring${cls ? ' ' + cls : ''}" style="left:${(cx - d/2).toFixed(2)}pt;top:${(cy - d/2).toFixed(2)}pt;width:${d}pt;height:${d}pt">${HL.icon(icon, d*0.54)}</div>`;
  // a fact on a ring: the ring at (x, y), the words beside it, centered on the ring's middle
  HL.factRow = (f, x, y, w, d, fs, slot) => HL.ring(f[0], x + d/2, y + d/2, d) + `<div class="sh-fact" style="left:${x + d + 9}pt;top:${y}pt;width:${w - d - 9}pt;height:${d}pt;font-size:${fs}pt;line-height:${d}pt" data-slot="${slot}" data-lines="1">${esc(f[1])}</div>`;

  // ---- the two-tone headline ----
  // which words close the headline in the main color: the last word, or the last two when the last is a short word ("wine bar")
  HL.tone = (t, k) => { const w = String(t || '').trim().replace(/\.$/, '').split(/\s+/).filter(Boolean); if(k == null){ const last = (w[w.length - 1] || '').replace(/[^A-Za-z]/g, ''); k = w.length > 2 && last.length <= 3 && !/^\d/.test(w[w.length - 2] || '') ? 2 : 1; } return {words: w, k: w.length < 2 ? 0 : Math.min(k, w.length - 1)}; };
  // the break (up to n lines) and the size (max down to min) that set it largest in width w; one more line costs pen of its size;
  // a line never ends on a one-letter word, and the last line is never a lone short word
  HL.fit = (t, w, max, min, n, o) => { o = o || {}; const T = HL.tone(t, o.k), W = T.words, css = GAR(o.wt, o.ls), pen = o.pen == null ? 0.16 : o.pen; let best = null;
    const tries = [[W]]; if(n >= 2) for(let i = 1; i < W.length; i++) tries.push([W.slice(0, i), W.slice(i)]);
    if(n >= 3) for(let i = 1; i < W.length - 1; i++) for(let j = i + 1; j < W.length; j++) tries.push([W.slice(0, i), W.slice(i, j), W.slice(j)]);
    tries.forEach(L => { if(L.slice(0, -1).some(l => l[l.length - 1].replace(/[^A-Za-z]/g, '').length === 1)) return; if(L.length > 1 && L[L.length - 1].join(' ').length <= 2) return;
      const f = Math.min(...L.map(l => FXS.fitSize(l.join(' '), css, w, max, min))); if(L.some(l => FXS.width(l.join(' '), `${css};font-size:${f}pt`) > w)) return;
      const ws = L.map(l => FXS.width(l.join(' '), `${css};font-size:${f}pt`)), bal = L.length > 1 ? Math.min(...ws)/Math.max(...ws) : 1, sc = f*(1 - pen*(L.length - 1))*(0.8 + 0.2*bal) - (L.length > 1 && bal < 0.45 ? f*0.2 : 0); if(!best || sc > best.sc + 0.01) best = {sc, f, lines: L}; });
    if(!best) best = {f: min, lines: [W]}; const lh = +(best.f*(o.lh || 1.1)).toFixed(2); return Object.assign(best, {k: T.k, n: W.length, lh, h: best.lines.length*lh}); };
  // the headline's HTML: each line centered (or o.align) in (x, w); the closing k words wrapped in <i>
  HL.hl = (F, x, y, w, slot, o) => { o = o || {}; let wi = 0, h = '';
    F.lines.forEach((l, i) => { const t = l.map(wd => { const s = (wi++ >= F.n - F.k) ? `<i>${esc(wd)}</i>` : esc(wd); return s; }).join(' ').replace(/<\/i> <i>/g, ' ');
      h += `<div class="sh-hl" style="left:${x}pt;top:${(y + i*F.lh).toFixed(2)}pt;width:${w}pt;height:${F.lh}pt;font-size:${F.f}pt;line-height:${F.lh}pt;text-align:${o.align || 'center'}${o.wt ? ';font-weight:' + o.wt : ''}" data-slot="${slot}${i ? '.' + (i + 1) : ''}" data-lines="1">${t}</div>`; });
    return h; };
  // ---- the ruled register: rules at y and y + H (from rx0 to rx1), the words centered between them ----
  HL.reg = (t, x, y, w, slot, o) => { o = o || {}; const H = o.h || 28, ls = o.ls == null ? 3 : o.ls, cls = o.serif ? 'sh-ser' : 'sh-caps';
    const css = o.serif ? GAR(500, '0') : MAN(1, ls, 700).replace(/;font-size:1pt$/, ''); let fs = o.fs || 9.5; const tt = o.serif ? String(t) : String(t).toUpperCase();
    while(fs > (o.min || 8.6) && FXS.width(tt, `${css};font-size:${fs}pt`) > w - 10) fs -= 0.2;
    const rx0 = o.rx0 == null ? x : o.rx0, rx1 = o.rx1 == null ? x + w : o.rx1, lh = o.serif ? fs*1.2 : fs*1.3;
    return `<div class="sh-ln" style="left:${rx0}pt;top:${y}pt;width:${rx1 - rx0}pt"></div><div class="sh-ln" style="left:${rx0}pt;top:${y + H}pt;width:${rx1 - rx0}pt"></div>` +
      `<div class="${cls}" style="left:${x}pt;top:${(y + (H - lh)/2 + 0.5).toFixed(2)}pt;width:${w}pt;height:${lh.toFixed(2)}pt;font-size:${fs.toFixed(2)}pt;line-height:${lh.toFixed(2)}pt;text-align:center${o.serif ? '' : `;letter-spacing:${ls}pt;text-indent:${ls}pt`}${o.color ? ';color:' + o.color : ''}" data-slot="${slot}" data-lines="1">${esc(tt)}</div>`; };
  // ---- the floor: the main color from (x0, y) to the bleed ----
  HL.floor = (y, o) => { o = o || {}; const x0 = o.x0 == null ? -9 : o.x0, x1 = o.x1 == null ? 621 : o.x1, y1 = o.y1 == null ? 801 : o.y1;
    return `<div class="sh-floor" data-floor="1" style="left:${x0}pt;top:${y}pt;width:${x1 - x0}pt;height:${y1 - y}pt"></div>`; };
  const cline = (cls, t, x, y, w, fs, lh, slot, extra) => `<div class="abs ${cls}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${lh}pt;font-size:${fs}pt;line-height:${lh}pt;${extra || ''}" data-slot="${slot}" data-lines="1">${esc(t)}</div>`;
  FO.cline = cline;
  // a captioned photo of this set: the photo; under it the caption, the room's name run in in EB Garamond (justified after the fill)
  FO.capT = (D, c, x, y, w, ph, lines, slot, o) => { o = o || {}; c = FXS.augment(D, c); const tx = o.tx == null ? x : o.tx, tw = o.tw == null ? w : o.tw, name = FXS.leadLabel(c.lead).name, lh = o.lh || 13.5, fs = o.fs || 10, gap = o.gap || 8;
    return FXS.box(D, c.photo, x, y, w, ph, slot) +
      `<div class="abs cap"><div class="a" style="position:absolute;left:${tx}pt;top:${y + ph + gap}pt;width:${tw}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-lead="${esc(name ? name + '.' : '')}" data-room="${esc(name)}" data-nopair="1" ${o.fill ? `data-fill="${o.fill}" ` : ''}data-lh="${lh}" data-hbox="${lines*lh}" data-lines="${lines}" data-min="${o.min || 3}" data-narrow="0" ${FXS.sd(c.s)}></div></div>`; };
  // a caption standing beside a photo, centered top to bottom in its column after the fill (FO.sideFit)
  FO.sideCap = (D, c, x, y, w, hh, slot, col, noAug, fs) => { if(!noAug) c = FXS.augment(D, c); fs = fs || 10.25; const name = FXS.leadLabel(c.lead).name, lh = +(fs*1.4).toFixed(2), n = Math.max(3, Math.floor(hh/lh)), tr = []; for(let q = n; q >= 3; q--) tr.push(q);
    return `<div class="abs cap"><div class="a" style="position:absolute;left:${x}pt;top:${y}pt;width:${w}pt;height:${n*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}.side" data-lead="${esc(name ? name + '.' : '')}" data-room="${esc(name)}" data-nopair="1" data-flexh="1" data-lh="${lh}" data-lines="${n}" data-try="${tr.join(',')}" data-min="3" data-narrow="0" data-sidecap="${col || hh}" data-y0="${y}" data-sidex="${x}" ${FXS.sd(c.s)}></div></div>`; };
  FO.icapsLines = (t, w, max, min, n, css) => { const F = HL.fit(t, w, max, min, n, {pen: 0}); return {f: F.f, lines: F.lines.map(l => l.join(' '))}; };
  FO.headL = (kicker, title, slot, x, y, w, o) => { o = o || {}; const F = HL.fit(title, w, o.max || 40, o.min || 26, 2); return {html: HL.hl(F, x, y, w, slot + '.title'), y: y + F.h}; };

  // ---------------- FRONT: the fold-over cover (no agent, no brokerage, no facts) ----------------
  // The street as the two-tone headline across the top, as large as the measure allows; the neighborhood and city in the ruled register;
  // the whole house inside the margins, standing across the top edge of the floor; on the floor, the cover's one line in white and gold.
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {};
    const hood = FXS.hood(L), city = FXS.placeLine(L), hero = FO.heroId(D, F.hero || K.hero || 'front');
    let h = '', y = 26;
    const S = HL.fit(L.address, CW, 104, 56, 2, {pen: 0.24, lh: 1.06}); h += HL.hl(S, X0, y, CW, 'address'); y += S.h + 6;
    h += HL.reg([hood, city].filter(Boolean).join('  ·  '), X0, y, CW, 'front.place', {h: 30, fs: 10.5, ls: 3.6}); y += 30;
    const line = String(K.line || '').replace(/\.$/, ''), LN = line ? HL.fit(line, CW - 48, 34, 22, 2, {pen: 0.1, lh: 1.16}) : null, foot = LN ? LN.h : 0;
    const PT = y + 18, PB = 766 - foot - (foot ? 28 : 0);
    let ph = PB - PT; while(ph > 280 && !SW.fits(D, hero, CW, ph)) ph -= 4;
    h += SW.heroHtml(D, hero, X0, PT, CW, ph, 'front.house', []);
    const seam = Math.round(PT + ph*0.6), ly = PT + ph + (766 + 6 - (PT + ph) - foot)/2;
    h = HL.floor(seam) + h;
    if(LN) h += `<div class="sh-fl">${HL.hl(LN, X0 + 24, ly, CW - 48, 'front.line')}</div>`;
    return h;
  };

  // ---------------- FRONT: the two-sided flyer's front (its own composition in the same hand) ----------------
  // The floor turned into a ceiling: the main color across the top with the street in white and gold, the place and the facts on white
  // rings; the house hangs from it, standing across its lower edge; under it on the paper three rooms named in the main-color caps and
  // the write-up to the foot.
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hood = FXS.hood(L), city = FXS.placeLine(L), hero = FO.heroId(D, F.hero || K.hero || 'front');
    let t = '', y = 24;
    t += HL.reg([hood, city].filter(Boolean).join('  ·  '), X0, y, CW, 'front.city', {h: 26, fs: 9.6, ls: 3.4}); y += 26 + 8;
    const S = HL.fit(L.address, CW, 70, 40, 1, {lh: 1.08}); t += HL.hl(S, X0, y, CW, 'address'); y += S.h + 8;
    // the facts on white rings, one centered row
    const fs = HL.facts(L).slice(0, 5), d = 26, f9 = 9.6, cellW = fs.map(f => d + 8 + FXS.width(f[1], MAN(f9, 0, 600)));
    const gap = Math.max(14, (CW - cellW.reduce((a, b) => a + b, 0))/Math.max(1, fs.length - 1)); let x = X0 + (CW - cellW.reduce((a, b) => a + b, 0) - gap*(fs.length - 1))/2;
    fs.forEach((f, i) => { t += HL.ring(f[0], x + d/2, y + d/2, d) + `<div class="sh-fact" style="left:${x + d + 8}pt;top:${y}pt;width:${cellW[i] - d - 6}pt;height:${d}pt;font-size:${f9}pt;line-height:${d}pt" data-slot="front.facts${i}" data-lines="1">${esc(f[1])}</div>`; x += cellW[i] + gap; });
    y += d + 16;
    const ceil = y + 46;
    // the house hangs from the ceiling: its top inside the main color, the rest on the paper
    let HB = 286; while(HB > 230 && !SW.fits(D, hero, CW, HB)) HB -= 4;
    let h = HL.floor(-9, {y1: ceil}) + `<div class="sh-fl">${t}</div>` + SW.heroHtml(D, hero, X0, y, CW, HB, 'front.house', []);
    y += HB + 16;
    // three rooms named in caps, then the write-up to the foot
    const strip = (o.strip || P.flyerStrip || P.strip || []).slice(0, 3), nl = o.lines || 4, lh = 16.5, fs2 = 11, wh = nl*lh, wy = 766 - wh, n = Math.max(1, strip.length), g = 14, tw = (CW - (n - 1)*g)/n, th = wy - 14 - 20 - y;
    strip.forEach((id, i) => { h += FO.tile(D, id, X0 + i*(tw + g), y, tw, th, 'front.strip' + i); });
    h += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="${nl},${nl - 1}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0}pt;top:${wy}pt;width:${CW}pt;height:${wh}pt;font-size:${fs2}pt;line-height:${lh}pt"></div>`);
    return h;
  };
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = 766 - n*lh, old = parseFloat(su.style.top); su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt';
    const d = top - old; if(d <= 0) return; document.querySelectorAll('[data-slot^="front.strip"][data-slot$=".label"]').forEach(l => { const box = l.parentElement; box.style.top = (parseFloat(box.style.top) + d) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };
  // a photo with its name under it, centered, in the main-color caps
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 6}pt;width:${w}pt;white-space:nowrap;text-align:center"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt;letter-spacing:2.2pt;text-indent:2.2pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- INSIDE: one spread, built on the fold ----------------
  // Both pages open on one horizon: the two-tone headline centered on its page, then the ruled register, whose two rules run bleed to bleed
  // across the whole spread (through the fold) with each page's kicker centered between them. The page's big photo (the kitchen; the lead
  // bedroom) stands across one seam: the floor starts at the same height on both pages and runs through the fold. On the floor, white
  // type: the big photo's caption, then the left page's kitchen card and a room, the right page's rooms as a ledger (photo, caption beside).
  FO.TT = 12; FO.HZ = 112; FO.SEAM = 385; FO.PT = 130; FO.PH = 340; FO.COLW = 176;   // owner 11/17 (book 4 p42): the headings much tighter top to bottom, everything under them moved up and bigger
  const spreadTop = (D, I, slot, side) => { const F = HL.fit(I.title || '', CW, 40, 28, 2, {pen: -0.08, lh: 1.0}), top = FO.TT + Math.max(0, (FO.HZ - 12 - FO.TT - F.h)/2);
    let h = HL.hl(F, X0, top, CW, slot + '.title');
    h += HL.reg(I.kicker || '', X0, FO.HZ - 10, CW, slot + '.kicker', {h: 24, fs: 9, ls: 3, rx0: side === 'left' ? -9 : -9, rx1: side === 'left' ? 621 : 621});
    return h; };
  // the kitchen card: the ruled card (deepened floor, gold rules top and foot) with its label centered, the rows two by two, label over two full lines
  // the kitchen card: the ruled card (the floor deepened, gold rules at its top and foot): its label in gold caps, its heading in EB Garamond,
  // then its rows, each a label over two full justified lines, hairlines between; the rows centered top to bottom in the card
  // the kitchen card: the ruled card (the floor deepened, gold rules at its top and foot): its label in gold caps, its heading in EB Garamond,
  // the kitchen's own caption (run in, as many lines as its true sentences fill), then two rows, each a label over two full justified lines.
  // After the fill FO.stacks sets the parts one under the other and centers the stack top to bottom in the card.
  const kitchenCard = (D, T, kicker, heading, x, y, w, hgt, slot) => { const n = T.rows.length, lh = +(T.f*1.36).toFixed(2), rowC = 12 + 4 + 2*lh, pad = (w - T.V)/2;
    const hd = String(heading || '').replace(/\.$/, ''), hs = hd ? FXS.fitSize(hd, GAR(500, '0'), T.V, 20, 13) : 0, head = 12 + 14 + (hd ? hs*1.2 + 6 : 0);
    const rowH = Math.min(rowC + 18, (hgt - head - 22)/Math.max(1, n)), body = head + 10 + n*rowH, y0 = y + (hgt - body)/2;
    let b = `<div class="sh-card" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += cline('sh-caps', String(kicker || '').toUpperCase(), x + 12, y0, w - 24, 9, 12, slot + '.box.kicker', 'text-align:center;letter-spacing:3pt;text-indent:3pt');
    if(hd) b += cline('sh-ser', hd, x + pad, y0 + 18, T.V, hs, +(hs*1.2).toFixed(2), slot + '.box.heading', 'text-align:center');
    T.rows.forEach((r, i) => { const ry = y0 + head + 10 + i*rowH, c0 = ry + (rowH - rowC)/2;
      b += `<div class="abs hr" style="left:${x + pad}pt;top:${ry - .5}pt;width:${T.V}pt;height:1pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${x + pad}pt;top:${c0}pt;width:${T.V}pt" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${x + pad}pt;top:${c0 + 16}pt;width:${T.V + 1}pt;height:${2*lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--sh-font);color:var(--fx-soft);overflow:hidden;text-align:justify;text-align-last:left" data-slot="${slot}.list.t${i}" data-lines="2">${esc(r.t)}</div>`; });
    return b; };
  // after the fill: every stack (data-stack="g") is set top to bottom in its order (each part's own height, then its data-gap) and the whole
  // stack centered in its box (data-stackbox="g"); a caption part takes its filled lines' height
  FO.stacks = () => { const G = new Map(); document.querySelectorAll('[data-stack]').forEach(el => { const k = el.dataset.stack; (G.get(k) || G.set(k, []).get(k)).push(el); });
    G.forEach((els, k) => { const bx = document.querySelector(`[data-stackbox="${k}"]`); if(!bx) return; const top = parseFloat(bx.style.top), H = parseFloat(bx.style.height);
      const hs = els.map(el => { if(el.dataset.lh && (el.dataset.sidecap || el.closest('.cap'))){ const n = SW.lines(el).n, lh = parseFloat(el.style.lineHeight); el.style.height = (n*lh) + 'pt'; el.dataset.lines = n; return n*lh; } return parseFloat(el.style.height); });
      const gaps = els.reduce((a, el, i) => a + (i < els.length - 1 ? +(el.dataset.gap || 0) : 0), 0), gi = els.findIndex(el => el.dataset.grow);
      if(gi >= 0){ hs[gi] = Math.max(60, H - gaps - hs.reduce((a, b, i) => a + (i === gi ? 0 : b), 0)); els[gi].style.height = hs[gi] + 'pt'; }
      const tot = hs.reduce((a, b) => a + b, 0) + gaps; let y = top + (bx.dataset.top ? 0 : Math.max(0, (H - tot)/2));
      els.forEach((el, i) => { el.style.top = y + 'pt'; y += hs[i] + +(el.dataset.gap || 0); }); }); };
  FO.kitchenCardH = T => 0;

  // ---------------- INSIDE LEFT (the living level) ----------------
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, ids = P.left || [], heroC = FXS.cardFor(D, ids[0]), roomC = ids[1] ? FXS.cardFor(D, ids[1]) : null;
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), cw = t => (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new', 'a', 'the', 'and', 'of', 'with', 'in'].includes(w)).map(stem), says = (b, a) => { const bw = cw(b), aw = new Set(cw(a)); return bw.length > 0 && bw.every(w => aw.has(w)); };
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside || {}).items || SFb.inside, (BXb.outside || {}).items || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    // the card's rows: the "What's new" story keeps four (foundation to roof), a kitchen three; a row goes back to the kitchen's caption when
    // the caption's own true sentences would not fill four lines beside it
    const isNew = /new/i.test(box.kicker || ''), T0 = FO.tableRows2((box.items || []).slice(0, 10), a => SW.grams4(a).some(g => backG.has(g)) || backT.some(b => says(b, a)), {maxRows: isNew ? 4 : 3, Vs: isNew ? [196, 202, 208, 214, 220, 226, 232] : [206, 212, 218, 224], fs: isNew ? [9.75, 10] : [10.75, 11, 11.25, 11.5, 11.75, 12]});
    const RL = (((D.companion || {}).roomLines || {})[heroC.photo] || {}).all || [];
    const STOP = ['with','that','from','into','over','under','along','beside','kitchen','room'], kOver = (a, b) => { const w = t => new Set((String(t).toLowerCase().match(/[a-z]{4,}/g) || []).filter(x => !STOP.includes(x))), A = w(a), B = w(b); let n = 0; A.forEach(x => { if(B.has(x)) n++; }); return n >= 2; };
    const poolFor = T => { const shown = T.rows.map(r => r.t), clash = a => shown.some(b => SW.sameFact(a, b) || SW.sharedPhrase(a, b));
      return [].concat(heroC.s || [], isNew ? [] : (box.items || []).filter(it => !T.rows.some(r => r.l === it.l)).map(it => [].concat(it.s[0])), RL).map(x => [].concat(x).filter(a => !clash(a))).filter(a => a.length).filter((a, i, arr) => !arr.slice(0, i).some(b => SW.sameFact(a[0], b[0]) || kOver(a[0], b[0]))); };
    const chars = S => S.reduce((a, x) => a + Math.max(...[].concat(x).map(s => s.length)) + 1, 0), need = 4.3*(X1 - (X0 + T0.V + 64))/5.2;
    let T = T0, kS = poolFor(T0); if(chars(kS) < need && T0.rows.length > (isNew ? 3 : 2)){ T = Object.assign({}, T0, {rows: T0.rows.slice(0, -1)}); kS = poolFor(T); }
    if(isNew) box.heading = '';
    const kC = Object.assign({}, heroC, {s: kS, noAugment: true});
    let h = HL.floor(FO.SEAM, {x1: 621}), f = '';
    h += spreadTop(D, I, 'left', 'left');
    h += FXS.box(D, kC.photo, X0, FO.PT, CW, FO.PH, 'left.wide');
    // on the floor, under the kitchen: the kitchen card on the outer side (its label, heading, the kitchen's own caption, two rows), the
    // second room on the inner side with its caption under it
    const zy = FO.PT + FO.PH + 16, zh = 766 - zy, cwid = T.V + 44, cx = X0, ix = cx + cwid + 20, iw = X1 - ix, g = 'stk-left';
    f += kitchenCard(D, T, box.kicker || 'The kitchen', box.heading, cx, zy, cwid, zh, 'left');
    // the inner column: the kitchen's caption right under the kitchen, then the second room and its caption (the room takes what is left)
    f += `<div data-stackbox="${g}" data-top="1" style="position:absolute;left:${ix}pt;top:${zy - 4}pt;width:${iw}pt;height:${zh + 4}pt"></div>`;
    f += FO.sideCap(D, kC, ix, zy, iw, 7*15.4, 'left.wide', 7*15.4, true, 11).replace('data-sidecap=', `data-stack="${g}" data-gap="14" data-sidecap=`);
    if(roomC){ const rl = 3, rlh = 14.6, html = FO.capT(D, roomC, ix, zy + 100, iw, 110, rl, 'left.room', {fs: 10.75, lh: rlh, min: 3});
      f += html.replace('<div class="abs" style="left:', `<div class="abs" data-stack="${g}" data-grow="1" data-gap="8" style="left:`).replace('<div class="a" style="position:absolute;', `<div class="a" data-stack="${g}" data-gap="0" style="position:absolute;`); }
    return h + `<div class="sh-fl">${f}</div>`;
  };

  // ---------------- INSIDE RIGHT (bedrooms and baths) ----------------
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs = FO.cards(D, P.right || []);
    let h = HL.floor(FO.SEAM, {x0: -9}), f = '';
    h += spreadTop(D, R, 'right', 'right');
    h += FXS.box(D, cs[0].photo, X0, FO.PT, CW, FO.PH, 'right.photo0');
    // on the floor, under the lead room: its caption in the outer column, and beside it the ledger (each room a photo with its caption beside it)
    const zy = FO.PT + FO.PH + 16, zh = 766 - zy, colW = 204, lx0 = X0, lw = CW - colW - 22, ccx = X1 - colW;
    // the ledger first, so its rooms keep their own facts; the lead room's write-up then fills its column from what is left
    // the lead bedroom's own bath: told in its write-up when its photo is not needed in the ledger (the fourth room)
    const suite = SW.space(D, cs[0].photo) === 'primary' ? (cs.slice(3).find(c => SW.space(D, c.photo) === 'primarybath')) : null;
    const rest = cs.slice(1).filter(c => c !== suite).slice(0, 2), n = rest.length, gL = 16, rh = (zh - (n - 1)*gL)/Math.max(1, n), pw = Math.round(Math.min(lw*0.5, rh*1.45));
    rest.forEach((c, i) => { const ry = zy + i*(rh + gL);
      if(i) f += `<div class="sh-hair" style="left:${lx0}pt;top:${ry - gL/2 - .5}pt;width:${lw}pt"></div>`;
      f += FXS.box(D, c.photo, lx0, ry, pw, rh, 'right.photo' + (i + 1));
      f += FO.sideCap(D, c, lx0 + pw + 16, ry, lw - pw - 16, rh, 'right.photo' + (i + 1), rh, false, 10.5); });
    // owner 11/17 (book 4 p42: the primary bedroom write-up was weak, blank around it): the lead bedroom's write-up also tells its own bath
    // when the bath's photo is not on the page (the suite read as one), set in bigger type that fills its column
    const more = !suite && cs[3] ? FXS.augment(D, cs[3]) : null;
    // the column's stack starts just under the photo (its name centered between the photo and its rule); when the bath is not the lead
    // room's own, the page's fourth room follows as a second section (name, rule, write-up), so the column is full
    { const c0 = FXS.augment(D, cs[0]), g = 'stk-right', sec = more ? 2 : 1, ch = (zh - 6 - sec*42)/sec - (sec - 1)*10;
      f += `<div data-stackbox="${g}" data-top="1" style="position:absolute;left:${ccx}pt;top:${FO.PT + FO.PH + 4}pt;width:${colW}pt;height:${zh + 12}pt"></div>`;
      [[c0, 'right.photo0', [].concat(c0.s || [], suite ? suite.s || [] : more ? [] : [].concat(R.intro || []))], more ? [more, 'right.photo3', more.s || []] : null].filter(Boolean).forEach(([c, slot, pool], k) => {
        const nm = FXS.leadLabel(c.lead).name, ns = FXS.fitSize(nm, GAR(500, '0'), colW, 22, 15);
        f += cline('sh-ser', nm, ccx, zy, colW, ns, +(ns*1.2).toFixed(2), slot + '.name', `color:var(--sh-gold)" data-stack="${g}" data-gap="8`);
        f += `<div class="sh-rule" data-stack="${g}" data-gap="10" style="left:${ccx}pt;top:${zy}pt;width:40pt;height:1pt"></div>`;
        f += FO.full(FO.sideCap(D, Object.assign({}, c, {lead: '', s: pool}), ccx, zy, colW, ch, slot, ch, true, more ? 11 : 12)).replace('data-sidecap=', `data-colcap="1" data-stack="${g}" data-gap="${k < sec - 1 ? 16 : 0}" data-sidecap=`); }); }   // a column write-up, not one of a row of captions
    f += `<div class="sh-vhair" style="left:${ccx - 11.5}pt;top:${zy + 6}pt;height:${zh - 12}pt"></div>`;
    return h + `<div class="sh-fl">${f}</div>`;
  };
  FO.rightFit = () => {}; FO.leftHead = () => {};
  // after the fill: a caption in the column beside a photo sits centered top to bottom in that column (owner 11/16: everything centered in its space)
  FO.sideFit = () => { const G = new Map(); document.querySelectorAll('[data-sidecap]:not([data-stack])').forEach(el => { const k = el.dataset.sidex + '|' + el.dataset.y0 + '|' + [...document.querySelectorAll('.panel, .sheet')].indexOf(el.closest('.panel, .sheet')); (G.get(k) || G.set(k, []).get(k)).push(el); });
    G.forEach(els => { const hh = +els[0].dataset.sidecap, gap = 16; els.forEach(el => { const n = SW.lines(el).n, lh = parseFloat(el.style.lineHeight); el.style.height = (n*lh) + 'pt'; el.dataset.lines = n; el.__h = n*lh; });
      const tot = els.reduce((a, e) => a + e.__h, 0) + gap*(els.length - 1); let y = +els[0].dataset.y0 + Math.max(0, (hh - tot)/2);
      els.forEach(el => { el.style.top = y + 'pt'; y += el.__h + gap; }); }); };

  // ---------------- BACK (fold-over) and flyer back ----------------
  // The headline and the register ("Floor by floor"), the floor-by-floor write-up across the measure; the listing's plan in a box its own
  // width on the center line (no plan: the outdoor photo, captioned), the facts on rings in the column to its left and the distances in
  // EB Garamond numerals in the column to its right; then the floor: a row of captioned photos standing across its top edge, the two lists
  // (new and updated, outside) on white rings, the half-height card and the fine print in white.
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [], L = D.listing || {};
    const topId = flyer ? P.flyerTop || (P.backNoplan || [])[0] : (P.back || [])[0] || (P.backNoplan || [])[0];
    const rowIds = flyer ? (P.flyerBack || []).slice(0, 3) : (P.backRow || ['bath2']).slice(0, 3), rowCards = FO.cards(D, rowIds), n = Math.max(1, rowCards.length);
    const CT = FO.CARD_Y, LH3 = 19, LBY = CT - 14 - 3*LH3 - 18, CL = 3, clh = 13, RH0 = n > 2 ? 130 : 142, CPY = LBY - 9 - CL*clh, RY0 = CPY - 8 - RH0, ZB0 = RY0 - 16;
    let RY = RY0, RH = RH0, SEAM = RY0 + 44, ZB = ZB0;
    let h = '', t = '', f = '';
    // the headline and the register
    const kickT = +L.stories > 1 ? 'Floor by floor' : 'Room by room', ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, '');
    const HF = HL.fit(ht, CW, 38, 26, 1, {lh: 1.08}); t += HL.hl(HF, X0, 24, CW, 'back.about.head'); let y = 24 + HF.h + 4;
    t += HL.reg(kickT, X0, y, CW, 'back.about.kicker', {h: 24, fs: 9, ls: 3}); y += 24 + 10;
    // the write-up across the measure, justified (three or four full lines)
    const floors = FB.floors || [], isTop = fl => fl.top != null ? !!fl.top : fl.level === 2, f2 = [].concat(...floors.filter(isTop).map(fl => fl.s)), f1 = [].concat(...floors.filter(fl => !isTop(fl)).map(fl => fl.s));
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(x => !/^Built in|story|bedrooms|square feet/i.test(x))).slice(0, 5), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 5), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(x => { const bw = (String(x).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const wl = 3, wlh = 15.5, wh = wl*wlh;
    t += FO.full(FO.wu(keep(f2.concat(f1)), X0, y, CW, wh + 0.01, 'back.about', 10.5, wlh, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-pool="${Math.max(P.pool || 16, 18)}"`);
    y += wh + 16;
    // the plan (its box its own width, on the center line) or the outdoor photo, flanked by the facts and the distances
    const ZT = y, ZH = ZB - ZT; let pw = 300, py = ZT, pbh = ZH;
    if(hasPlan){ const PM = (D.plan.levels || []).length >= 3 ? 320 : 300, pc0 = FO.planBox(D, X0, ZT, ZH - 36, PM); pw = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc0.html)[1])); pbh = pc0.bottom - ZT; py = ZT + Math.max(0, (ZH - pbh)/2); const pc = FO.planBox(D, MID - pw/2, py, ZH - 36, PM);
      h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; }
    else { const c = FXS.cardFor(D, topId); pw = 300; t += FO.capT(D, c, MID - pw/2, ZT, pw, ZH - 8 - 3*13, 3, 'back.top', {fs: 10, lh: 13, min: 3}); }
    // the zone is as tall as its tallest part (the plan box, or the facts and distances columns); the row of photos grows up into the rest
    { const need = Math.max(hasPlan ? pbh : ZH, 196); if(need < ZH - 4){ const d = ZH - need; ZB = ZT + need; RY = ZB + 16; RH = RH0 + d; SEAM = RY + 44; if(hasPlan) h = h.replace(/top:([\d.]+)pt/g, (m, v) => Math.abs(+v - py) < 0.6 || +v > py ? `top:${(+v - (py - ZT - (need - pbh)/2)).toFixed(2)}pt` : m); } }
    const ZH2 = ZB - ZT, FW = (CW - pw)/2 - 18, fx0 = X0, fx1 = X1 - FW;
    { const fs = HL.facts(L).slice(0, 5), d = 24, rowp = Math.min(40, ZH2/Math.max(1, fs.length)), y0 = ZT + (ZH2 - rowp*fs.length)/2;
      fs.forEach((fc, i) => { let s9 = 9.4; while(s9 > 8.6 && FXS.width(fc[1], MAN(s9, 0, 600)) > FW - d - 10) s9 -= 0.2; if(FXS.width(fc[1], MAN(s9, 0, 600)) > FW - d - 10) fc = [fc[0], fc[1].replace('square feet', 'sq ft').replace(/^Built in /, 'Built ')]; t += HL.factRow(fc, fx0, y0 + i*rowp + (rowp - d)/2, FW, d, s9, 'back.fact' + i); }); }
    { const N = (KB.nearby || []).slice(0, 3), rh = Math.min(64, ZH2/Math.max(1, N.length + 0.5)), y0 = ZT + (ZH2 - rh*N.length - 18)/2;
      t += cline('sh-caps', 'NEARBY', fx1, y0, FW, 8.8, 12, 'back.near.kicker', 'text-align:center;letter-spacing:2.6pt;text-indent:2.6pt');
      N.forEach((nb, i) => { const yy = y0 + 18 + i*rh; let ds = 22, ps = 9.2; while(ds > 14 && FXS.width(String(nb.dist), GAR(500, '0') + `;font-size:${ds}pt`) > FW) ds -= 0.5; while(ps > 8.6 && FXS.width(String(nb.place), MAN(ps, 0, 500)) > FW) ps -= 0.2;
        if(i) t += `<div class="sh-ln" style="left:${fx1 + FW*0.3}pt;top:${yy - 1}pt;width:${FW*0.4}pt"></div>`;
        t += `<div class="abs sh-num" style="left:${fx1}pt;top:${yy + (rh - ds*1.15 - 14)/2}pt;width:${FW}pt;height:${ds*1.15}pt;font-size:${ds}pt;line-height:${ds*1.15}pt" data-slot="back.near${i}" data-lines="1" data-fine="1">${esc(nb.dist)}</div>`;
        t += `<div class="abs sh-det" style="left:${fx1}pt;top:${yy + (rh - ds*1.15 - 14)/2 + ds*1.15}pt;width:${FW}pt;height:14pt;font-size:${ps}pt;line-height:14pt;font-weight:500;text-align:center" data-slot="back.near${i}.p" data-lines="1" data-fine="1">${esc(nb.place)}</div>`; }); }
    // the floor: the row of captioned photos standing across its top edge
    { const g = 16, rw = (CW - (n - 1)*g)/n; rowCards.forEach((c, i) => { f += FO.capT(D, c, X0 + i*(rw + g), RY, rw, RH, CL, 'back.photo' + i, {fs: n > 2 ? 9.25 : 10, lh: clh, min: 3}); }); }
    // the two lists on the floor: each item on a small white ring, hairlines between; side by side, centered on the page
    { const lw = (CW - 30)/2, lx = i => X0 + i*(lw + 30);
      f += cline('sh-caps', t1.toUpperCase(), lx(0), LBY, lw, 8.8, 12, 'back.updates.title', 'letter-spacing:2.6pt') + FXS.bullets(c1, lx(0), LBY + 18, lw, LH3, 'back.updates', 3, 9.8).html;
      f += [0, 1].map(i => `<div class="sh-hair" style="left:${lx(i)}pt;top:${LBY - 5}pt;width:${lw}pt"></div>`).join('') + cline('sh-caps', 'OUTSIDE', lx(1), LBY, lw, 8.8, 12, 'back.outside.title', 'letter-spacing:2.6pt') + FXS.bullets(c2, lx(1), LBY + 18, lw, LH3, 'back.outside', 3, 9.8).html; }
    f += FO.contact(D, X0, FO.CARD_Y, CW, FO.CARD_H, true) + FO.fine(D);
    h = HL.floor(SEAM) + h;
    return {html: h + `<div class="sh-ink">${t}</div><div class="sh-fl">${f}</div>`, issues};
  };

  FO.tallStack = () => { const col = document.querySelector('[data-tallcol]'); if(!col) return; const bottom = +col.dataset.tallcol, ps = [...document.querySelectorAll('[data-para]')]; if(ps.length < 2) return;
    const [a, b] = ps, la = parseFloat(a.style.lineHeight), lb = parseFloat(b.style.lineHeight), na = SW.lines(a).n, nb = SW.lines(b).n;
    a.style.height = (na*la) + 'pt'; b.style.top = (parseFloat(a.style.top) + na*la + 9) + 'pt'; b.style.height = (nb*lb) + 'pt';
    const free = bottom - 8 - (parseFloat(b.style.top) + nb*lb); if(free < 1) return;
    const cap = document.querySelector('.cap .a[data-slot="back.photo0"]'), ph = document.querySelector('.ph[data-slot-photo="back.photo0"]'), pb = ph && ph.parentElement, lbl = document.querySelector('[data-slot="back.photo0.label"]');
    if(pb) pb.style.height = (parseFloat(pb.style.height) + free) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + free) + 'pt'; if(cap) cap.style.top = (parseFloat(cap.style.top) + free) + 'pt';
    document.querySelectorAll('[data-tall]').forEach(e => { e.style.top = (parseFloat(e.style.top) + free) + 'pt'; }); };
  // after the fill: a block with data-span spreads the lines it took over that height, so its last line ends where its neighbor's does (owner 11/7, p12)
  FO.span = () => document.querySelectorAll('[data-span]').forEach(el => { const T = +el.dataset.lines, lh = Math.min(+el.dataset.span/T, parseFloat(getComputedStyle(el).fontSize)*0.75*1.75); el.style.lineHeight = lh + 'pt'; el.style.height = (T*lh) + 'pt'; el.style.top = (parseFloat(el.style.top) + (el.dataset.vc ? (+el.dataset.span - T*lh)/2 : +el.dataset.span - T*lh)) + 'pt'; });
  // the facts row: no two facts closer than 6 pt (text boxes measured on the letters)
  FO.factsCheck = () => { const out = [], it = [...document.querySelectorAll('.fo-fact')].map(e => { const r = document.createRange(); r.selectNodeContents(e); const qs = [...r.getClientRects()].filter(q => q.width > 1); return {slot: e.dataset.slot, l: Math.min(...qs.map(q => q.left)), r: Math.max(...qs.map(q => q.right)), t: Math.min(...qs.map(q => q.top)), b: Math.max(...qs.map(q => q.bottom))}; }).sort((a, b) => a.l - b.l);
    for(let i = 1; i < it.length; i++){ const a = it[i-1], b = it[i], gap = (b.l - a.r)*0.75, vo = Math.min(a.b, b.b) - Math.max(a.t, b.t); if(vo > 2 && gap < 6) out.push({slot: b.slot, kind: 'facts-collide', detail: `${a.slot} and ${b.slot} are ${gap.toFixed(1)} pt apart (6 pt minimum)`}); }
    return out; };
  // no text may sit under a photo or the agent card (the owner's clearance rule, 11/7): any text box that overlaps one fails
  FO.overlapCheck = () => { const out = [], els = [...document.querySelectorAll('.ph, .fo-acard:not(.abs)')].map(e => ({e, r: e.getBoundingClientRect()})).filter(x => x.r.width > 2 && x.r.height > 2), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement; if(!p || !n.textContent.trim() || p.closest('script, style, .plan-svg, .planwrap, .fo-acard, .logo, .sh-tab')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(q => { if(q.width < 2 || q.height < 2) return;
        els.forEach(({e, r}) => { if(e.contains(p)) return; const ox = Math.min(q.right, r.right) - Math.max(q.left, r.left), oy = Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top);
          if(ox > 1.5 && oy > 3) out.push({slot: (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || 'text', kind: 'text-under-element', detail: `"${n.textContent.trim().slice(0, 28)}" overlaps a ${e.className.split(' ')[0]}`}); }); }); }
    const seen = new Set(); return out.filter(i => { const k = i.slot + i.detail; if(seen.has(k)) return false; seen.add(k); return true; }); };
})();
