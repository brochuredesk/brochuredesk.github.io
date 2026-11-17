/* Architect fold-over and two-sided flyer builders (grown from the FXS-14 builders; the hand is the approved Open House library
   flyer B01). Panel coordinates in pt: trim 612 x 792 (the proof page adds a 9 pt bleed; anything that bleeds runs to -9 / 621 / 801).
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
    else if(best.pick){ el.style.fontSize = best.fs + 'pt'; el.innerHTML = best.pick.map(x => x.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))).join(' '); SW.noteGrams(el, best.pick.join(' ')); }
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
  FO.gaps = () => document.querySelectorAll('[data-slot]').forEach(el => { if(getComputedStyle(el).textAlign !== 'justify' || el.querySelector('[data-slot]')) return;
    const sp = parseFloat(getComputedStyle(el).fontSize)*0.28; let worst = 0; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const t = n.textContent; for(let i = 0; i < t.length; i++){ if(t[i] !== ' ') continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const q = r.getBoundingClientRect(); if(q.width > worst && q.height > 0) worst = q.width; } }
    if(worst > sp*(parseFloat(el.style.width) < 260 ? 2.3 : 3.2)) el.style.textAlign = 'left'; });
  FO.fill3Check = () => [...document.querySelectorAll('[data-j3]')].filter(el => el.textContent.trim()).flatMap(el => { const L = SW.lines(el);
    return L.n < 3 ? [{slot: el.dataset.slot, kind: 'writeup-under-3-lines', lines: L.n}] : L.fill < 0.895 ? [{slot: el.dataset.slot, kind: 'writeup-last-line-short', pct: Math.round(L.fill*100)}] : []; });

  // Architect: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Architect refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
  // (three lines or more, every line 80%+ set ragged, the last 90%+, rows of one table or one photo row on one line count) is set again
  // as a group: the line counts it may take x type sizes from its own size up a quarter (0.25 pt steps) and down 8%, at its own height
  // (the leading follows), until every member's true sentences fill. Nothing is cut or narrowed; only whole sentences, only real copy.
  const okEl = (el, T) => { const L = SW.lines(el); return L.n === T && L.fill >= 0.895 && (L.n < 2 || L.min >= 0.8) && !SW.sameFactIn(el.textContent) && !SW.rep5(el.textContent); };
  FO.refit = () => { const G = new Map();
    document.querySelectorAll('[data-s][data-slot]').forEach(el => { if(!el.getClientRects().length || el.dataset.nofit) return;
      const tb = /^(.*\.box)\.t\d+$/.exec(el.dataset.slot || ''), cap = el.closest('.cap'), face = el.closest('.panel, .sheet');
      const key = tb ? 'tb:' + tb[1] : cap ? 'cap:' + [...document.querySelectorAll('.panel, .sheet')].indexOf(face) + ':' + Math.round(parseFloat(el.style.top)) : 'el:' + el.dataset.slot;
      (G.get(key) || G.set(key, []).get(key)).push(el); });
    [...G.values()].sort((a, b) => (b[0].closest('.cap') ? 1 : 0) - (a[0].closest('.cap') ? 1 : 0)).forEach(els => { const n0 = Math.max(...els.map(e => SW.lines(e).n));   // photo captions first: their pools are the thinnest
      const minl = +els[0].dataset.minl || 3;
      const clash = els.some(e => { if(!e.closest('.cap')) return false; const face = e.closest('.panel, .sheet'), mine = SW.sentences(e.textContent, e.dataset.lead || ''); return [...(face ? face.querySelectorAll('.cap .a[data-slot]') : [])].some(o => o !== e && SW.sentences(o.textContent, '').some(x => mine.some(y => SW.sameFact(x, y)))); });
      if(n0 >= minl && !clash && els.every(e => okEl(e, n0))) return;
      const H = Math.min(...els.map(e => +e.dataset.hfit || (e.dataset.hfit = parseFloat(e.style.height) || e.getBoundingClientRect().height*0.75)));
      const fs0 = +els[0].dataset.fs0 || (els[0].dataset.fs0 = parseFloat(getComputedStyle(els[0]).fontSize)*0.75);
      const tmax = Math.max(3, Math.min(8, Math.floor((H + 24)/(fs0*1.18)))), counts = []; for(let t = tmax; t >= minl; t--) if(Math.abs(t - Math.max(minl, n0)) <= 1 || els.every(e => e.closest('.cap.side'))) counts.push(t);
      const sizes = []; for(let f = fs0; f <= fs0*1.28 + 1e-6; f += 0.2) sizes.push(+f.toFixed(2)); for(let f = fs0 - 0.2; f >= fs0*0.92 - 1e-6; f -= 0.2) sizes.push(+f.toFixed(2));
      const keep = els.map(e => [e.innerHTML, e.style.fontSize, e.style.lineHeight, e.style.height]);
      let done = false;
      // a row of two photo captions may share its width unevenly (each photo as wide as its caption's true sentences fill)
      const pair = (els.length === 2 || els.length === 3) && els.every(e => e.closest('.cap') && !e.closest('.cap.side')), parts = pair ? els.map(e => { const sl = e.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), lb = document.querySelector(`[data-slot="${sl}.label"]`); return {e, pb: ph && ph.parentElement, lb: lb && lb.parentElement, x: parseFloat(e.style.left), w: parseFloat(e.style.width)}; }).sort((p, q) => p.x - q.x) : null;
      const split = r => { if(!pair) return; const A = parts[0], Z = parts[parts.length - 1], span = Z.x + Z.w - A.x, g = parts.length > 1 ? parts[1].x - A.x - A.w : 0, inner = span - g*(parts.length - 1);
        const ws = parts.length === 2 ? [inner*r, inner*(1 - r)] : r.map(q => inner*q/r.reduce((m, n) => m + n, 0)); let xx = A.x;
        parts.map((P, i) => { const o = [P, xx, ws[i]]; xx += ws[i] + g; return o; }).forEach(([P, x, w]) => { [P.e, P.pb, P.lb].forEach(el => { if(el){ el.style.left = x + 'pt'; el.style.width = w + 'pt'; } }); if(P.lb && P.lb.firstElementChild) P.lb.firstElementChild.style.maxWidth = w + 'pt'; P.e.dataset.w0 = w; P.e.__pfMemo = null; }); };
      const ratios = !pair ? [null] : els.length === 2 ? [0.5, 0.55, 0.45, 0.6, 0.4, 0.64, 0.36] : [[1, 1, 1], [1.2, 1, 1], [1, 1.2, 1], [1, 1, 1.2], [0.85, 1, 1], [1, 0.85, 1], [1, 1, 0.85], [1.2, 1, 0.85], [0.85, 1, 1.2], [1.2, 0.85, 1], [1, 0.85, 1.2], [0.85, 1.2, 1], [1, 1.2, 0.85]];
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
          const picks = els.map(e => { e.style.fontSize = f + 'pt'; e.style.lineHeight = lh + 'pt'; e.style.height = (flex ? T*lh : H) + 'pt'; e.style.textAlign = 'left'; const b = SW.pfN(e, T); if(b){ const lead = e.dataset.lead || ''; e.innerHTML = (lead ? `<b>${SW.esc(lead)}</b> ` : '') + b.pick.map(x => SW.esc(x)).join(' '); } return b; });   // each member set as soon as it is picked, so the next one sees it
          if(picks.every(Boolean)){ els.forEach((e, i) => { const lead = e.dataset.lead || ''; e.innerHTML = (lead ? `<b>${SW.esc(lead)}</b> ` : '') + picks[i].pick.map(x => SW.esc(x)).join(' '); SW.noteGrams(e, lead + ' ' + picks[i].pick.join(' ')); e.dataset.lines = T; delete e.dataset.diag; });
            if(els.every(e => okEl(e, T))){ done = true; break; } } }
        if(done) break; }
      if(done) break; }
      }
      if(!done && pair) split(els.length === 2 ? 0.5 : [1, 1, 1]);
      if(!done) lift(0);
      if(!done){ els.forEach((e, i) => { [e.innerHTML, e.style.fontSize, e.style.lineHeight, e.style.height] = keep[i]; }); if(ms.length > 1) els.forEach(e => { e.style.width = w0 + 'pt'; e.style.left = x0 + 'pt'; e.dataset.w0 = w0; if(shrink) [sp.pb, sp.lb].forEach(q => { if(q) q.style.width = w0 + 'pt'; }); }); }
    }); };

  // after the fill: a row of captions that set fewer lines than their box hands the unused lines to its photos (they grow down; the label
  // and caption move with them), so no gap opens under a caption (textbox-underfull, blank check)
  FO.capSnug = () => { const rows = new Map();
    document.querySelectorAll('.cap .a[data-slot]').forEach(el => { const k = Math.round(parseFloat(el.style.top)) + '|' + [...document.querySelectorAll('.panel, .sheet')].indexOf(el.closest('.panel, .sheet')); (rows.get(k) || rows.set(k, []).get(k)).push(el); });
    rows.forEach(els => { if(els.some(e => e.closest('.cap.side'))) return; const lh = parseFloat(els[0].style.lineHeight) || +els[0].dataset.lh || 13, box = +els[0].dataset.hfit || parseFloat(els[0].style.height), n = Math.max(...els.map(e => SW.lines(e).n)); if(!(n >= 1) || n*lh >= box - 0.5) return; const d = box - n*lh;
      els.forEach(el => { const sl = el.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), pb = ph && ph.parentElement, lbl = document.querySelector(`[data-slot="${sl}.label"]`);
        if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + d) + 'pt';
        el.style.top = (parseFloat(el.style.top) + d) + 'pt'; el.style.height = (n*lh) + 'pt'; el.dataset.lines = n; }); }); };
  FO.sideCenter = () => document.querySelectorAll('.cap.side').forEach(c => { const a = c.querySelector('.a'), lbl = a && document.querySelector(`[data-slot="${a.dataset.slot}.label"]`); if(!a || !lbl) return;
    const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight), hh = 20 + n*lh, top = +c.dataset.phTop + (+c.dataset.phH - hh)/2; a.style.height = (n*lh) + 'pt'; lbl.parentElement.style.top = top + 'pt'; a.style.top = (top + 20) + 'pt'; });
  // after the fill: a caption set beside its photo takes the largest type (its own size up to 1.45x, 0.25 pt steps) at which a set of its true
  // sentences fills 70-88% of the photo's height under its label, every line 80%+ and the last 90%+; no dead column beside a photo (review point 4)
  FO.sideGrow = () => document.querySelectorAll('.cap.side .a[data-slot]').forEach(el => { if(!el.textContent.trim()) return; const c = el.closest('.cap.side'), H = +c.dataset.phH - 22;
    const fs0 = parseFloat(el.style.fontSize), keep = [el.innerHTML, el.style.fontSize, el.style.lineHeight, el.style.height]; let best = null;
    for(let fs = fs0; fs <= Math.min(fs0*1.6, +el.dataset.maxfs || 17) + 1e-6; fs += 0.25){ const lh = fs*1.36; el.style.fontSize = fs + 'pt'; el.style.lineHeight = lh + 'pt'; el.style.height = 'auto'; el.__pfMemo = null;
      for(let T = Math.floor(H*0.88/lh); T >= 3 && T*lh >= H*0.4; T--){ const b = SW.pfN(el, T); if(b){ best = {fs, lh, T, pick: b.pick}; break; } } }
    if(!best){ [el.innerHTML, el.style.fontSize, el.style.lineHeight, el.style.height] = keep; return; }
    el.style.fontSize = best.fs + 'pt'; el.style.lineHeight = best.lh + 'pt'; el.style.height = (best.T*best.lh) + 'pt'; el.dataset.lines = best.T; el.dataset.lh = best.lh;
    el.innerHTML = best.pick.map(x => SW.esc(x)).join(' '); SW.noteGrams(el, best.pick.join(' ')); delete el.dataset.diag; el.style.textAlign = 'justify'; });
  // after the fill: an inside-left intro whose true sentences are all said elsewhere on the piece (it cannot set three full lines) is left out;
  // the heading column then sets its title larger and sits centered beside the room photo
  // after the fill: an inside-left intro whose true sentences are all said elsewhere (it cannot set three full lines) is left out; the
  // heading then sets larger and sits centered top to bottom beside the room photo
  FO.leftHead = () => { const it = document.querySelector('[data-slot="left.intro"]'), kk = document.querySelector('[data-slot="left.kicker"]'), ru = document.querySelector('[data-role="left-rule"]');
    const tls = [...document.querySelectorAll('[data-slot^="left.title"]')]; if(!it || !kk || !ru || !tls.length) return;
    const L = SW.lines(it), top = +it.dataset.top0 || parseFloat(it.style.top), bot = +it.dataset.bot0 || 0;
    if(it.textContent.trim() && L.n >= 3 && L.fill >= 0.895){   // the heading group (kicker, title, rule, intro) sits centered in its column
      const lh = parseFloat(it.style.lineHeight), used = parseFloat(it.style.top) + L.n*lh, free = bot - used; if(free > 2){ const d = free/2; [kk, ru, it, ...tls].forEach(e => e.style.top = (parseFloat(e.style.top) + d) + 'pt'); } return; }
    it.remove(); const g0 = parseFloat(kk.style.top), g1 = parseFloat(ru.style.top) + 1.4, d = (bot - g1 - (g0 - 40))/2; if(d > 0) [kk, ru, ...tls].forEach(e => e.style.top = (parseFloat(e.style.top) + d) + 'pt'); };
  // after the fill: the cover write-up sits centered in the dark foot under the paper band
  // the cover's write-up ends on the foot line; its leading opens (up to 1.9x its size) to take the room, and what is still free moves the
  // place, the street and the facts bar down with it, so no dark band opens between the bar and the write-up or under it (blank check)
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, fs = parseFloat(getComputedStyle(su).fontSize)*0.75, z0 = +su.dataset.z0, z1 = +su.dataset.z1;
    if(su.dataset.cover){ const lh = Math.max(parseFloat(su.style.lineHeight), Math.min((z1 - z0)/n, fs*1.9)), ex = Math.max(0, (z1 - z0) - n*lh);
      su.style.lineHeight = lh + 'pt'; su.style.height = (n*lh + 1) + 'pt'; su.style.top = (z1 - n*lh) + 'pt';
      if(ex > 0.5) document.querySelectorAll('[data-slot="front.place"], .ar-title[data-slot^="address"], .ar-bar').forEach(e => { if(e.closest('.panel') === su.closest('.panel')) e.style.top = (parseFloat(e.style.top) + ex) + 'pt'; });
      return; }
    const lh = parseFloat(su.style.lineHeight); su.style.height = (n*lh) + 'pt'; su.style.top = (z0 + (z1 - z0 - n*lh)/2) + 'pt'; };
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- Architect geometry (pt, panel trim 612 x 792; bleed to -9 / 621 / 801) ----------------
  // P08's hand on every page: the stone field, white type; one display line in Libre Baskerville bold capitals set tight; the street in
  // Baskerville regular; Instrument Sans wide-tracked caps for labels; every lead photo inset inside the four corner ticks (the flyer's
  // drafting ticks, 7 pt out from the photo's corners); the 1 pt drafting rule with a pair set on it; the dimension line (a rule with end
  // ticks and its figure in the accent, set in a gap) carrying the facts and room sizes; the white drafting sheet with ink hairlines as
  // the one light moment of a page; the numbered callout circles for Nearby.
  const X0 = 36, X1 = 576, CW = X1 - X0, DISP = "font-family:Libre Baskerville;font-weight:700;letter-spacing:-1pt";
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW; FO.DISP = DISP;
  FO.frame = () => '';
  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  FO.wrapText = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).filter(Boolean).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out; };
  FO.wrapLines = (t, css, w) => FO.wrapText(t, css, w).map(l => FXS.width(l, css));
  // the fades of the engine are not part of this hand; kept as no-ops so the shared passes still run
  FO.fade = () => ''; FO.leanFade = () => ''; FO.heroFade = () => '';
  FO.houseFoot = (D, id, w, h) => { const p = (D.photos || {})[id]; if(!p || !p.box || !p.w || !p.h) return null; const ia = p.w/p.h, ta = w/h, [x0, y0, x1, y1] = p.box; if(ia >= ta) return y1;
    const v = ia/ta, c = (y0 + y1)/2, off = Math.min(1 - v, Math.max(0, c - v/2)); return (y1 - off)/v; };
  FO.houseIn = (D, id, w, h) => { const p = (D.photos || {})[id]; if(!p || !p.box || !p.w || !p.h) return null; const ia = p.w/p.h, ta = w/h, [x0, y0, x1, y1] = p.box, pl = (lo, hi, v) => Math.min(1 - v, Math.max(0, (lo + hi)/2 - v/2));
    if(ia > ta){ const v = ta/ia, off = p.lean === 'left' ? Math.max(0, Math.min(x0, x1 + .02 - v)) : pl(x0, x1, v); return [(x0 - off)/v, y0, (x1 - off)/v, y1]; } const v = ia/ta, off = pl(y0, y1, v); return [x0, (y0 - off)/v, x1, (y1 - off)/v]; };

  // ---- the marks ----
  // the four corner ticks around a photo (or a drawing area): 10 pt L marks set `off` pt out from its corners; `only` limits the corners (l = the left two)
  FO.ticks = (x, y, w, h, o) => { o = o || {}; const n = o.n || 10, f = o.off == null ? 7 : o.off, t = o.t || 1.5, c = o.c ? `border-color:${o.c};` : '';
    const C = [['tl', x - f, y - f, `border-top-width:${t}pt;border-left-width:${t}pt`], ['tr', x + w + f - n, y - f, `border-top-width:${t}pt;border-right-width:${t}pt`],
      ['bl', x - f, y + h + f - n, `border-bottom-width:${t}pt;border-left-width:${t}pt`], ['br', x + w + f - n, y + h + f - n, `border-bottom-width:${t}pt;border-right-width:${t}pt`]];
    return C.filter(q => !o.only || o.only.includes(q[0])).map(([, l, tp, b]) => `<div class="ar-tk" data-mark="tick" style="left:${l}pt;top:${tp}pt;width:${n}pt;height:${n}pt;${b};${c}"></div>`).join(''); };
  // a photo inset inside its ticks
  FO.tightW = (D, id, w, h, min) => { if(!((D.photos || {})[id] || {}).lean) return w; while(w - 10 >= (min || 300) && SW.fits(D, id, w - 10, h)) w -= 10; return w; };
  FO.inset = (D, id, x, y, w, h, slot, o) => FXS.box(D, id, x, y, w, h, slot) + FO.ticks(x, y, w, h, o);
  // the dimension line: from x to x + w at y (the rule's line), end marks (a 9 pt upright and a 45-degree slash), the figure centered in a gap
  FO.dim = (x, y, w, label, slot, o) => { o = o || {}; const fs = o.fs || 9, tr = o.tr == null ? 2 : o.tr, css = `font-family:Instrument Sans;font-weight:600;letter-spacing:${tr}pt;font-size:${fs}pt`, t = String(label || '').toUpperCase();
    let s = fs; while(s > (o.min || 8.6) && FXS.width(t, css.replace(/font-size:[\d.]+pt/, `font-size:${s}pt`)) > w - 70) s -= 0.25;
    let tr2 = tr; if(o.fill){ while(tr2 < 7 && FXS.width(t, css.replace(/font-size:[\d.]+pt/, `font-size:${s}pt`).replace(/letter-spacing:[\d.]+pt/, `letter-spacing:${tr2}pt`)) < w*o.fill) tr2 += 0.1; }
    const tw = FXS.width(t, css.replace(/font-size:[\d.]+pt/, `font-size:${s}pt`).replace(/letter-spacing:[\d.]+pt/, `letter-spacing:${tr2}pt`)) + 4, gap = 12, cx = o.align === 'left' ? x + 22 + tw/2 : x + w/2, a1 = cx - tw/2 - gap, a2 = cx + tw/2 + gap, lh = s*1.34;
    let h = `<div class="ar-dl" style="left:${x}pt;top:${y - 0.5}pt;width:${Math.max(0, a1 - x)}pt"></div><div class="ar-dl" style="left:${a2}pt;top:${y - 0.5}pt;width:${Math.max(0, x + w - a2)}pt"></div>`;
    h += `<div class="ar-dt" style="left:${x - 0.5}pt;top:${y - 6}pt;height:12pt"></div><div class="ar-dt" style="left:${x + w - 0.5}pt;top:${y - 6}pt;height:12pt"></div>`;
    h += `<div class="ar-ds" style="left:${x - 0.5}pt;top:${y - 4.5}pt"></div><div class="ar-ds" style="left:${x + w - 0.5}pt;top:${y - 4.5}pt"></div>`;
    h += `<div class="ar-dx" style="left:${cx - tw/2}pt;top:${y - lh/2 + 0.6}pt;width:${tw}pt;height:${lh}pt;font-size:${s}pt;line-height:${lh}pt;letter-spacing:${tr2}pt" data-slot="${slot}" data-lines="1">${esc(t)}</div>`;
    return h; };
  // the drafting rule with a pair set on it: left words and right words standing on one 1 pt rule (the flyer's date and address line)
  FO.ruled = (x, y, w, left, right, slot, o) => { o = o || {}; let h = `<div class="ar-rule" style="left:${x}pt;top:${y}pt;width:${w}pt"></div>`;
    if(left) h += left; if(right) h += right; return h; };
  // the level datum across the spread: a 1 pt rule from the page's outer margin to the fold, with the architect's level symbol at the outer end
  FO.datum = (side, y) => { const sym = (cx) => `<svg class="abs" data-mark="datum" style="left:${cx - 8}pt;top:${y - 8}pt;width:16pt;height:16pt;overflow:visible" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7.2" fill="var(--ar-dark)" stroke="var(--ar-on)" stroke-width="1.3"/><path d="M8 8 L8 0.8 A7.2 7.2 0 0 1 15.2 8 Z M8 8 L8 15.2 A7.2 7.2 0 0 1 0.8 8 Z" fill="var(--ar-on)"/></svg>`;
    return side === 'left' ? `<div class="ar-rule" style="left:${X0 + 8}pt;top:${y - 0.5}pt;width:${612 - X0 - 8}pt"></div>` + sym(X0 + 8) : `<div class="ar-rule" style="left:0;top:${y - 0.5}pt;width:${X1 - 8}pt"></div>` + sym(X1 - 8); };
  // the display line: Baskerville bold caps at the largest size (max..min) that sets in maxLines balanced lines; no one-letter word ends a
  // line; every line is its own one-line slot. Returns {html, y (under the last line), f, n}.
  FO.caps = (text, x, y, w, max, min, maxLines, slot, o) => { o = o || {}; const t = String(text || '').replace(/\.$/, '').toUpperCase(), css = f => `${DISP};font-size:${f}pt`; let best = null;
    const ok = ls => ls.length <= maxLines && ls.every((l, i) => i === ls.length - 1 || !/(^|\s)\S$/.test(l));
    for(let f = max; f >= min && !best; f -= 0.5){ let ls = FO.wrapText(t, css(f), w); if(!ok(ls)) continue;
      if(ls.length > 1) for(let k = 0.5; k < 1; k += 0.04){ const b = FO.wrapText(t, css(f), w*k); if(b.length === ls.length && ok(b)){ ls = b; break; } }
      best = {f, ls}; }
    if(!best) best = {f: min, ls: FO.wrapText(t, css(min), w)};
    const lh = best.f*(o.lh || 1.08), y0 = o.zone ? y + Math.max(0, (o.zone - best.ls.length*lh)/2) : y; let h = '';
    best.ls.forEach((ln, i) => { h += `<div class="ar-title" style="left:${x}pt;top:${y0 + i*lh}pt;width:${w}pt;height:${best.f*1.22}pt;font-size:${best.f}pt;line-height:${best.f*1.22}pt;text-align:${o.align || 'center'}${o.color ? ';color:' + o.color : ''}" data-slot="${slot}${i ? '.' + i : ''}" data-lines="1">${esc(ln)}</div>`; });
    return {html: h, y: y0 + best.ls.length*lh, f: best.f, n: best.ls.length}; };
  // the street address as the display line (Baskerville bold caps): one line at the largest size, or the number over the street when that sets the street a third larger
  FO.addrLines = (address, w, max) => { const a = String(address || '').trim().toUpperCase(), m = /^(\d+[A-Z]?)\s+(.+)$/.exec(a), f1 = FXS.fitSize(a, DISP, w, max, 20);
    if(!m) return {ls: [a], f: f1}; const f2 = FXS.fitSize(m[2], DISP, w, max, 20); return f1 < max*0.8 && f2 >= f1*1.3 ? {ls: [m[1], m[2]], f: f2} : {ls: [a], f: f1}; };
  FO.addr = (address, x, y, w, max, slot) => { const A = FO.addrLines(address, w, max), lh = A.f*1.04; let h = '';
    A.ls.forEach((ln, i) => { h += `<div class="ar-title" style="left:${x}pt;top:${y + i*lh}pt;width:${w}pt;height:${A.f*1.24}pt;font-size:${A.f}pt;line-height:${A.f*1.24}pt" data-slot="${slot}${i ? '.' + i : ''}" data-lines="1">${esc(ln)}</div>`; });
    return {html: h, y: y + (A.ls.length - 1)*lh + A.f*1.2, f: A.f, n: A.ls.length}; };
  FO.addrH = (address, w, max) => { const A = FO.addrLines(address, w, max); return (A.ls.length - 1)*A.f*1.04 + A.f*1.2; };
  // the facts as one line for a dimension line: "2 BEDROOMS · 2 FULL BATHS · 1,635 SQ FT · BUILT 2005"
  FO.factCells = L => FXS.statItems(L).map(t => String(t).replace(/^Built in /i, 'Built ').replace(/square feet/i, 'sq ft').toUpperCase());
  FO.factLine = (L, w, fs) => { const css = s => `font-family:Instrument Sans;font-weight:600;letter-spacing:2pt;font-size:${s}pt`; let c = FO.factCells(L); while(c.length > 2 && FXS.width(c.join('  ·  '), css(fs || 9)) > w - 70) c.pop(); return c.join('  ·  '); };
  // the old bar call (postcards): now the facts on a dimension line
  FO.bar = (x, y, w, hh, cells, slot, o) => FO.dim(x, y + hh/2, w, cells.join('  ·  '), slot + '.0', {fs: Math.min(12, (o || {}).max || 11), min: 8.6});
  FO.place = L => [FXS.hood(L), FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, '')].filter(Boolean).join('  ·  ').toUpperCase();
  FO.eyebrow = (t, y, slot, x, w, al) => `<div class="ar-eyebrow" style="left:${x == null ? X0 : x}pt;top:${y}pt;width:${w || CW}pt;text-align:${al || 'center'}" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`;
  // a photo with its name under it (no caption text): the name in tracked caps, the plan's size beside it in the accent
  FO.tileC = (D, id, x, y, w, h, slot, lx) => `${FO.inset(D, id, x, y, w, h, slot, {n: 8, off: 5})}<div class="abs" style="left:${lx == null ? x : lx}pt;top:${y + h + 10}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;
  // the standard contact card on the field under a hairline: agent left, the brokerage panel right with the one logo
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = AR.logoSrc(D); const ko = !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 186, lh = Math.min(46, H - 28), s = {name: 21, nameFloor: 15, hsW: Math.round(H*0.78), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 30, H - 30], tall: [H - 28, H - 28]}};
    return `<div style="--cc-display:Libre Baskerville;--cc-body:Instrument Sans">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };
  // a room's name and plan size for its dimension line ("KITCHEN  ·  13' x 15'")
  FO.roomDim = (D, id) => { const c = FO.cards(D, [id])[0], L0 = FXS.leadLabel(c ? (c.lead || '') : FO.lead(D, id)), nm = (L0.name || FO.lead(D, id)); return L0.size ? `${nm}  ·  ${L0.size}` : nm; };

  // ---------------- FRONT ----------------
  // FOLD-OVER COVER (grown from the approved flyer's own order): the place in tracked caps, the street as the one display line in Baskerville
  // bold capitals as wide as the page allows, a drafting rule; the whole house inset inside its corner ticks; the facts on a dimension
  // line under the house; the write-up. No rooms, no agent, no brokerage.
  FO.front = (D, o) => { o = o || {}; if(o.flyer) return FO.flyerFront(D, o);
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = F.hero || K.hero || 'front', FOOT = 766;
    let t = FO.eyebrow(FO.place(L), 38, 'front.place'), y = 60;
    const A = FO.addr(L.address, X0 - 6, y, CW + 12, 78, 'address'); t += A.html; y = A.y + 10;
    t += `<div class="ar-rule" style="left:${X0}pt;top:${y}pt;width:${CW}pt"></div>`; y += 1 + 24;
    // the house: as wide as the page and tall enough for the whole house; a narrower frame centered when the house is tall
    const SL = 4, SLH = 21, dimGap = 30, sumTop = FOOT - SL*SLH; let HH = sumTop - 22 - dimGap - y, HW = CW;
    while(HW > 380 && !SW.fits(D, hero, HW, HH)) HW -= 10;
    HW = FO.tightW(D, hero, HW, HH, 380);
    const hx = X0 + (CW - HW)/2;
    let h = FO.inset(D, hero, hx, y, HW, HH, 'front.house');
    t += FO.dim(hx, y + HH + dimGap, HW, FO.factLine(L, HW, 10), 'front.facts.0', {fs: 10, tr: 2.2});
    t += FO.full(`<div class="abs wu" data-slot="front.summary" data-z0="${sumTop}" data-z1="${FOOT}" data-lines="${SL}" data-try="${SL},${SL - 1}" data-lh="${SLH}" ${FXS.sd(intro)} style="left:${X0}pt;top:${sumTop}pt;width:${CW}pt;height:${SL*SLH}pt;font-size:13pt;line-height:${SLH}pt;color:var(--ar-soft)"></div>`);
    return h + t;
  };
  // FLYER FRONT (a different piece from the cover): the house first, tall, inside its ticks; under it the street in Baskerville regular and the
  // place stand on one drafting rule (the flyer's date-and-address line); the facts on a dimension line; two rooms of unequal width inside
  // their ticks; the write-up.
  FO.flyerFront = (D, o) => { const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = F.hero || K.hero || 'front', strip = (P.flyerStrip || P.strip || []).filter(id => (D.photos || {})[id]).slice(0, 2);
    const SL = 3, SLH = 18.5, FOOT = 766, sumTop = FOOT - SL*SLH, RH0 = 150;
    // the street line under the house: Baskerville regular, as large as fits beside the place
    const pl = FO.place(L), pcss = 'font-family:Instrument Sans;font-weight:500;letter-spacing:2.6pt;font-size:9.5pt', pw = FXS.width(pl, pcss) + 4, scss = 'font-family:Libre Baskerville;font-weight:400', sw = CW - pw - 18, ss = FXS.fitSize(L.address || '', scss, sw, 34, 18);
    let RH = RH0, HH = sumTop - 18 - 23 - RH - 30 - 26 - ss*1.3 - 12 - 36;
    while(RH > 108 && !SW.fits(D, hero, CW, HH)){ RH -= 6; HH += 6; }
    let HW = CW; while(HW > 380 && !SW.fits(D, hero, HW, HH)) HW -= 10; HW = FO.tightW(D, hero, HW, HH, 380);
    const hx = X0 + (CW - HW)/2, hy = 36;
    let h = FO.inset(D, hero, hx, hy, HW, HH, 'front.house'), y = hy + HH + 18;
    const ry = y + ss*1.3; // the rule under the street
    h += `<div class="ar-street" style="left:${X0}pt;top:${y}pt;width:${sw}pt;height:${ss*1.3}pt;font-size:${ss}pt;line-height:${ss*1.3}pt" data-slot="address" data-lines="1">${esc(L.address || '')}</div>`;
    h += `<div class="ar-eyebrow" style="left:${X1 - pw}pt;top:${ry - 15}pt;width:${pw}pt;font-size:9.5pt;letter-spacing:2.6pt;text-align:right" data-slot="front.place" data-lines="1">${esc(pl)}</div>`;
    h += `<div class="ar-rule" style="left:${X0}pt;top:${ry + 4}pt;width:${CW}pt"></div>`;
    y = ry + 4 + 26;
    h += FO.dim(X0, y, CW, FO.factLine(L, CW, 10), 'front.facts.0', {fs: 10, tr: 2.2}); y += 26;
    const g = 22, w0 = strip.length > 1 ? Math.round((CW - g)*0.58) : CW, w1 = CW - w0 - g, ryy = y + 6;
    if(strip[0]) h += FO.tileC(D, strip[0], X0, ryy, w0, RH, 'front.strip0');
    if(strip[1]) h += FO.tileC(D, strip[1], X0 + w0 + g, ryy, w1, RH, 'front.strip1');
    h += FO.full(`<div class="abs wu" data-slot="front.summary" data-z0="${sumTop}" data-z1="${FOOT}" data-lines="${SL}" data-try="${SL}" data-lh="${SLH}" ${FXS.sd(intro)} style="left:${X0}pt;top:${sumTop}pt;width:${CW}pt;height:${SL*SLH}pt;font-size:12pt;line-height:${SLH}pt;color:var(--ar-soft)"></div>`);
    return h;
  };

  // ---------------- THE INSIDE SPREAD: one datum across the fold ----------------
  // Both pages: the eyebrow and the page's display line over the level datum (a 1 pt rule that runs from the outer margin through the fold,
  // the level symbol at its outer end); under it the page's lead room inset in its ticks between the same two lines on both pages (166 to
  // 406), named and sized on a dimension line; then what belongs to that room; then the smaller rooms.
  FO.BAND = {T: 166, B: 390, D: 146, ROW: 590, FOOT: 766};
  FO.spreadHalves = D => { const K = D.sw || {}, S = K.spread || {}, t = S.title || [(K.left || {}).title, (K.right || {}).title].join('|'); return String(t).split('|').map(x => x.trim()); };
  FO.head = (D, kicker, side, slot) => { const B = FO.BAND, K = D.sw || {}, t = String(((K[side] || {}).title) || FO.spreadHalves(D)[side === 'left' ? 0 : 1] || '').replace(/\.$/, '');
    let h = `<div class="ar-eyebrow" style="left:${X0}pt;top:36pt;width:${CW}pt;text-align:left" data-slot="${slot}.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    h += FO.caps(t, X0 - 2, 56, CW + 4, 34, 21, 2, slot + '.title', {align: 'left', zone: B.D - 14 - 56, lh: 1.1}).html;
    return h + FO.datum(side, B.D); };
  FO.lead = (D, id) => { const P = ((D.sw || {}).plan || {}), l = (P.leads || {})[id] || (FXS.cardFor(D, id) || {}).lead || FXS.labelFor(id); return FXS.leadLabel(l).name; };
  FO.row3 = (D, cards, slot0, i0, y0, o) => { o = o || {}; const B = FO.BAND, n = cards.length, g = o.g || 18, w = (CW - (n - 1)*g)/n, clh = 13.5, LN = 3, ph = B.FOOT - y0 - 25 - LN*clh; let h = '';
    cards.forEach((c, i) => { let cap = FXS.captioned(D, c, X0 + i*(w + g), y0, w, ph, LN, slot0 + (i0 + i), {fs: 10.25, lh: clh, min: 3}); if(c.photo === 'bar') cap = cap.replace('<div class="ph" data-photo="bar"', '<div class="ph" data-zoom="2.4,0.103,0.566" data-photo="bar"'); h += cap; });
    return h; };
  // INSIDE LEFT (the living level): the kitchen is the lead room; under its dimension line the kitchen schedule on the drafting sheet (the
  // sign-in sheet's white body with its ink hairlines and its corner ticks): the room in Baskerville, then labeled rows in two columns;
  // then the other rooms in one locked row.
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, cs = FO.cards(D, P.left || []), B = FO.BAND;
    const kid = (P.strip || []).find(id => (D.photos || {})[id]) || (cs[0] || {}).photo, rowCards = cs.filter(c => c.photo !== kid).slice(0, 3);
    let h = FO.head(D, I.kicker, 'left', 'left') + FO.inset(D, kid, X0, B.T, CW, B.B - B.T, 'left.wide');
    h += FO.dim(X0, B.B + 18, CW, FO.roomDim(D, kid), 'left.wide.label');
    const items0 = (box.items || []).slice(0, 8), colW = (CW - 32 - 24)/2, tcss = 'font-family:Instrument Sans;font-weight:400;font-size:10.5pt';
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const oneLine = it => { const S = (it.s || []).map(x => [].concat(x).filter(a => !SW.grams4(a).some(g => backG.has(g)) && !backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w)))))).filter(a => a.length); let best = '';
      const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(t && !/^(It|Its|They|This|That)\b/.test(t) && t.length > best.length && FXS.width(t, tcss) <= colW - 2 && !SW.sameFactIn(t)) best = t; return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
      walk(0, []); return best; };
    const lines1 = items0.map(oneLine); let items = items0.map((it, i) => [it, lines1[i]]).filter(x => x[1]); items = items.slice(0, items.length >= 6 ? 6 : items.length >= 4 ? 4 : items.length);
    const SY = B.B + 36, SB = B.ROW - 16, cols = items.length >= 4 ? 2 : 1, rows = Math.ceil(items.length/cols), HD = 30, y0 = SY + 12 + HD, rowH = (SB - 10 - y0)/Math.max(1, rows), cw = cols === 2 ? colW : CW - 32;
    h += `<div class="ar-ink"><div class="ar-sheet" style="left:${X0}pt;top:${SY}pt;width:${CW}pt;height:${SB - SY}pt"></div>`;
    h += `<div class="abs" style="left:${X0 + 16}pt;top:${SY + 12}pt;width:${CW - 32}pt;height:${HD}pt;display:flex;align-items:baseline;gap:14pt;white-space:nowrap;overflow:hidden"><span class="fo-kick" style="flex:none" data-slot="left.box.kicker" data-lines="1">${esc(String(box.kicker || 'The kitchen').toUpperCase())}</span><span class="fo-sched-h" data-slot="left.box.heading" data-lines="1">${esc(String(box.heading || '').replace(/\.$/, ''))}</span></div>`;
    h += `<div class="ar-rule" style="left:${X0 + 16}pt;top:${y0 - 2}pt;width:${CW - 32}pt;background:var(--ar-paper-ink);height:1.2pt"></div>`;
    if(cols === 2) h += `<div class="ar-vhair" style="left:${X0 + 16 + colW + 12}pt;top:${y0 + 6}pt;height:${rows*rowH - 12}pt"></div>`;
    items.forEach(([it, txt], i) => { const c = cols === 2 ? i % 2 : 0, r = cols === 2 ? Math.floor(i/2) : i, x = X0 + 16 + c*(colW + 24), y = y0 + r*rowH, pad = Math.max(0, (rowH - 30)/2);
      if(r < rows - 1) h += `<div class="abs hr" style="left:${x}pt;top:${y + rowH - 0.5}pt;width:${cw}pt"></div>`;
      h += `<div class="abs fo-li-l" style="left:${x}pt;top:${y + pad + 1}pt;width:${cw}pt" data-slot="left.list.l${i}" data-lines="1">${esc(it.l)}</div>`;
      h += `<div class="abs fo-li-t" style="left:${x}pt;top:${y + pad + 13}pt;width:${cw}pt;height:15pt" data-slot="left.list.t${i}" data-lines="1">${esc(txt)}</div>`; });
    h += '</div>' + FO.ticks(X0, SY, CW, SB - SY, {n: 8, off: 5});
    return h + FO.row3(D, rowCards, 'left.photo', 0, B.ROW);
  };
  // INSIDE RIGHT (bedrooms and baths): the best room of the page leads between the same two lines as the kitchen; its dimension line; then
  // its write-up across the page; then two rooms side by side, larger than the left page's row (a bath or an empty room goes last).
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs0 = FO.cards(D, P.right || []), B = FO.BAND;
    const score = c => /closet|wic|pbath|bath|laundry|hall/i.test(c.photo) ? 0 : /^primary\d*$|suite/i.test(c.photo) ? 3 : /bed|game|living|family|media/i.test(c.photo) ? 2 : 1;
    const top = cs0.slice(0, 4).map((c, i) => [score(c), -i, c]).sort((a, b) => b[0] - a[0] || b[1] - a[1])[0], cs = top ? [top[2]].concat(cs0.filter(c => c !== top[2])) : cs0;
    let h = FO.head(D, R.kicker, 'right', 'right');
    const rest = cs.slice(1).map((c, i) => [score(c), i, c]).sort((p, q) => q[0] - p[0] || p[1] - q[1]).map(x => x[2]).slice(0, 2);
    const WY = B.B + 36, WL = 4, WLH = 17.5, RY = WY + WL*WLH + 22;
    if(cs[0]){ const c = FXS.augment(D, cs[0]), L0 = FXS.leadLabel(c.lead);
      h += FO.inset(D, c.photo, X0, B.T, CW, B.B - B.T, 'right.photo0') + FO.dim(X0, B.B + 18, CW, FO.roomDim(D, c.photo), 'right.photo0.label');
      h += FO.full(FO.wu((c.s || []).concat(R.intro || []), X0, WY, CW, WL*WLH, 'right.lead', 12, WLH, 'wu')).replace('data-slot="right.lead"', `data-room="${esc(L0.name)}" data-slot="right.lead"`); }
    h += FO.row3(D, rest.length ? [rest[1], rest[0]].filter(Boolean) : [], 'right.photo', 1, RY, {g: 22});
    return h;
  };
  FO.rightFit = () => {}; FO.rightCapFit = () => {}; FO.leftFit = () => {};

  // ---------------- BACK (fold-over) and flyer back ----------------
  // The drawing sheet: the title column on the left (the year in tracked caps, what the house is in Baskerville bold caps, the floors);
  // the listing's own plan on the right in a drawing area sized to the plan and held in its corner ticks (no plan: the outdoor photo with
  // its caption); then the outdoor photo or the rooms beside the drafting sheet with the two lists; Nearby as a measured scale with the
  // numbered callouts, low over the hairline; the contact card.
  FO.miles = d => { const m = /([\d.]+)\s*(mi|mile)/i.exec(String(d || '')); return m ? +m[1] : null; };
  FO.nearScale = (D, x, y, w, hh) => { const N = (((D.sw || {}).back || {}).nearby || []).slice(0, 3), ds = N.map(n => FO.miles(n.dist)), even = ds.some(v => v == null), mx = even ? 1 : Math.max(...ds), span = even ? 1 : Math.ceil(mx*1.1*2)/2;
    const kw = 96, bx = x + kw, bw = w - kw - 10, ly = y + 16;
    let h = `<div class="ar-eyebrow" style="left:${x}pt;top:${ly - 7}pt;width:${kw - 12}pt;text-align:left;font-size:9.5pt;letter-spacing:2.8pt" data-slot="back.near.kicker" data-lines="1">Nearby</div>`;
    h += `<div class="ar-rule" style="left:${bx}pt;top:${ly - 0.5}pt;width:${bw}pt"></div><div class="ar-dt" style="left:${bx - 0.5}pt;top:${ly - 7}pt;height:14pt"></div>`;
    if(!even){ for(let q = 0.5; q < span + 1e-6; q += 0.5){ const tx = bx + bw*q/span, big = Math.abs(q - Math.round(q)) < 1e-6; h += `<div class="ar-dt" style="left:${tx - 0.5}pt;top:${ly - (big ? 5 : 3)}pt;height:${big ? 5 : 3}pt"></div>`; } }
    const pos = N.map((n, i) => even ? bx + bw*(i + 1)/(N.length + 0.4) : bx + bw*ds[i]/span);
    for(let i = 1; i < pos.length; i++) if(pos[i] - pos[i - 1] < 22) pos[i] = pos[i - 1] + 22;
    N.forEach((n, i) => { h += `<div class="ar-call" data-slot="back.near${i}.n" data-lines="1" style="left:${pos[i] - 9}pt;top:${ly - 9}pt;width:18pt;height:18pt;font-size:9.5pt">${i + 1}</div>`; });
    const cw = (w - kw)/Math.max(1, N.length), ty = ly + 20;
    N.forEach((n, i) => { const cx = x + kw + i*cw, pu = String(n.place).toUpperCase(), ptr = FXS.width(pu, 'font-family:Instrument Sans;font-weight:600;letter-spacing:1.6pt;font-size:8.6pt') <= cw - 30 ? 1.6 : FXS.width(pu, 'font-family:Instrument Sans;font-weight:600;letter-spacing:0.7pt;font-size:8.6pt') <= cw - 30 ? 0.7 : 0.2, ps = FXS.fitSize(pu, `font-family:Instrument Sans;font-weight:600;letter-spacing:${ptr}pt`, cw - 30, 8.8, 8.6);
      h += `<div class="ar-call" style="left:${cx}pt;top:${ty + 3}pt;width:15pt;height:15pt;font-size:8.6pt">${i + 1}</div>`;
      h += `<div class="fo-near" style="left:${cx + 22}pt;top:${ty}pt;width:${cw - 24}pt;height:34pt" data-slot="back.near${i}" data-lines="2" data-fine="1"><span class="d">${esc(n.dist)}</span><span class="p" style="font-size:${ps}pt;letter-spacing:${ptr}pt">${esc(n.place)}</span></div>`; });
    return h; };
  FO.planBox = (D, x, y, maxH, maxW) => { const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: D.plan.turn ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: !!D.plan.turn, angle: D.plan.turn && D.plan.kind === 'color' ? 270 : undefined}), cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 44, D.plan.minCard || 0, 236)); return FXS.planCard(D, x, y, cw, maxH); };
  FO.footFade = html => html;
  FO.CARD_H = 64; FO.CARD_Y = 686;
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:758pt;width:${CW}pt;height:9pt;text-align:left" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, F = ((D.companion || {}).flyer || {}).front || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [], L = D.listing || {};
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    const usedIn = new Set([].concat(P.left || [], P.right || [], [topId, (P.strip || [])[0]])), freeRow = (P.strip || []).slice(1).filter(id => (D.photos || {})[id] && !usedIn.has(id) && FXS.cardFor(D, id));
    const rowIds = flyer ? (P.flyerBack || []).slice(0, 3) : (hasPlan && (P.backNoplan || [])[0] ? [P.backNoplan[0]] : (P.backRowNoplan || (freeRow.length ? [freeRow[0]] : P.backRow) || ['bath2'])), rowCards = FO.cards(D, rowIds);
    const L0 = X0, R0 = X1, TOP = 40, NH = 62, NY = FO.CARD_Y - 22 - NH;
    let h = '', top, planW = 0, planX = R0;
    let TH = flyer ? 214 : 282;
    if(hasPlan && !D.plan.turn){ const nw = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: 900, h: TH - 34}, {allowRotate: false}).usedW || 999; if(nw < 190) TH = flyer ? 214 : 300; }
    const THW = flyer ? 176 : 212, natW = hasPlan && !D.plan.turn ? (IvoryPlan.draw(D.plan, {x: 0, y: 0, w: 900, h: THW - 34}, {allowRotate: false}).usedW || 0) : 0, wide = natW + 44 >= 430;
    const tickBox = (x, y, w, hh) => FO.ticks(x, y, w, hh, {n: 10, off: 0});
    if(wide){ const pw0 = Math.min(CW, Math.ceil(natW) + 60), px = L0 + (CW - pw0)/2, pc = FXS.planCard(D, px, TOP, pw0, THW); h += pc.html + tickBox(px, TOP, pw0, pc.bottom - TOP); issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom; }
    else if(hasPlan){ const pc0 = FO.planBox(D, 0, TOP, TH, flyer ? 330 : 310), w0 = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc0.html)[1])); planX = R0 - w0; planW = w0; const pc = FO.planBox(D, planX, TOP, TH, flyer ? 330 : 310); h += pc.html + tickBox(planX, TOP, w0, pc.bottom - TOP); issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom; }
    else { planW = 300; planX = R0 - planW; const c = FXS.cardFor(D, topId), tph = flyer ? 150 : 220; h += FXS.captioned(D, c, planX, TOP, planW, tph, 3, 'back.top', {fs: 10.75, lh: 14, min: 3}) + FO.ticks(planX, TOP, planW, tph, {n: 9, off: 6, only: ['tl', 'tr']}); top = TOP + tph + 25 + 3*14; }
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const yr = L.yearBuilt || L.year, head = String(F.head || (K.front || {}).head || '').replace(/\.$/, '') || FXS.hood(L) || 'The floors';
    const ebrow = (x, y, w) => `<div class="ar-eyebrow" style="left:${x}pt;top:${y}pt;width:${w}pt;text-align:left" data-slot="back.about.title" data-lines="1">${esc(yr ? 'Built in ' + yr : (KB.floorTitles || ['The house'])[0])}</div>`;
    let rowB = top;
    if(wide){ const hy = top + 18, hw = 196, tx = L0 + hw + 18, tw = R0 - tx, n = flyer ? 3 : 5, lh = flyer ? 15.5 : 17;
      if(!flyer) h += ebrow(L0, hy, hw); const HD = FO.caps(head, L0, flyer ? hy : hy + 18, hw, flyer ? 20 : 26, 14, 3, 'back.head', {align: 'left'}); h += HD.html;
      h += FO.full(FO.wu(keep(f2.concat(f1)), tx, hy + 1, tw, n*lh, 'back.about', flyer ? 10.75 : 11.5, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
      rowB = Math.max(HD.y, hy + 1 + n*lh);
    } else {
      const aw = planX - 24 - L0;
      h += ebrow(L0, TOP, aw);
      const HD = FO.caps(head, L0, TOP + 20, aw, 30, 17, 3, 'back.head', {align: 'left'}); h += HD.html;
      const wy = HD.y + 10;
      h += `<div class="ar-rule" style="left:${L0}pt;top:${wy - 1}pt;width:${Math.min(aw, 120)}pt"></div>`;
      const n = Math.max(3, Math.floor((top - wy - 10)/16)), lh = +((top - wy - 10)/n).toFixed(3);
      h += FO.full(FO.wu(keep(f2.concat(f1)), L0, wy + 10, aw, n*lh + 0.01, 'back.about', flyer ? 10.75 : 11.25, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-rag="1" data-span="${(top - wy - 10).toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
    }
    const y1 = rowB + 26, BOXB = NY - 18;
    const sheet = (x, y, w, hh, colsN) => { let t = `<div class="ar-ink"><div class="ar-sheet" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hh}pt"></div>`; const ix = x + 16, iw = w - 32;
      if(colsN === 2){ const cw2 = (iw - 22)/2, ty0 = y + 13, cap = Math.max(2, Math.min(5, Math.floor((y + hh - 9 - ty0 - 17)/18))), rws = Math.max(Math.min(c1.length, cap), Math.min(c2.length, cap), 2), rh = Math.min(30, (y + hh - 9 - ty0 - 17)/rws), ty = y + Math.max(9, (hh - 17 - rws*rh)/2), ly = ty + 17;   // the lists sit centered top to bottom in the sheet (owner 11/16)
        t += FO.kick(t1, ix, ty, 'back.updates.title') + FXS.bullets(c1, ix, ly, cw2, rh, 'back.updates', cap, 10.5).html;
        t += FO.kick('Outside', ix + cw2 + 22, ty, 'back.outside.title') + FXS.bullets(c2, ix + cw2 + 22, ly, cw2, rh, 'back.outside', cap, 10.5).html;
      } else { const n1 = FXS.bullets(c1, ix, 0, iw, 1, 'x', 5, 10.5).n, n2 = FXS.bullets(c2, ix, 0, iw, 1, 'x', 5, 10.5).n, free = hh - 14 - 17 - 12 - 17 - 10; let a = Math.min(n1, 5), b = Math.min(n2, 5); while((a + b)*18 > free && a + b > 4){ if(a >= b) a--; else b--; }
        const rh = Math.min(34, free/Math.max(1, a + b)), ty = y + Math.max(10, (hh - (17 + a*rh + 12 + 17 + b*rh))/2);   // centered top to bottom (owner 11/16)
        t += FO.kick(t1, ix, ty, 'back.updates.title') + FXS.bullets(c1, ix, ty + 17, iw, rh, 'back.updates', a, 10.5).html;
        const ty2 = ty + 17 + a*rh + 12; t += FO.kick('Outside', ix, ty2, 'back.outside.title') + FXS.bullets(c2, ix, ty2 + 17, iw, rh, 'back.outside', b, 10.5).html; }
      return t + '</div>' + FO.ticks(x, y, w, hh, {n: 8, off: 5}); };
    if(flyer){
      const n = rowCards.length, gap = 14, tw = (CW - (n - 1)*gap)/n, nb = Math.max(Math.min(c1.length, wide ? 3 : 4), Math.min(c2.length, wide ? 3 : 4), 2), need = 13 + 17 + nb*19 + 9, PH = Math.max(112, Math.min(200, BOXB - need - 10 - y1 - 25 - 3*13.5));
      rowCards.forEach((c, i) => { h += FXS.captioned(D, c, L0 + i*(tw + gap), y1, tw, PH, 3, 'back.photo' + i, {fs: 10.25, lh: 13.5, min: 3}); });
      const by = y1 + PH + 25 + 3*13.5 + 10; h += sheet(L0, by, CW, BOXB - by, 2);
    } else {
      const bh = BOXB - y1, ph = bh - 25 - 3*14, pw = Math.max(Math.round(ph*1.45), Math.min(288, Math.round(ph*1.6))), sx = L0;
      h += sheet(L0 + pw + 22, y1, CW - pw - 22, bh, CW - pw - 22 >= 400 ? 2 : 1);
      h += FXS.captioned(D, rowCards[0], L0, y1, pw, ph, 3, 'back.photo1', {fs: 10.75, lh: 14, min: 3}).replace('data-slot="back.photo1" data-room', 'data-slot="back.photo1" data-shrinkphoto="1" data-room');
    }
    h += FO.nearScale(D, L0, NY, CW, NH);
    h += `<div class="ar-hair" style="left:${X0}pt;top:${FO.CARD_Y - 11}pt;width:${CW}pt"></div>`;
    h += FO.contact(D, X0, window.__cardY || FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D);
    return {html: h, issues};
  };
  // after the fill: a block with data-span spreads the lines it took over that height, so its last line ends where its neighbor's does (owner 11/7, p12)
  FO.span = () => document.querySelectorAll('[data-span]').forEach(el => { const T = +el.dataset.lines, lh = Math.min(+el.dataset.span/T, parseFloat(getComputedStyle(el).fontSize)*0.75*1.75); el.style.lineHeight = lh + 'pt'; el.style.height = (T*lh) + 'pt'; el.style.top = (parseFloat(el.style.top) + +el.dataset.span - T*lh) + 'pt'; });
  // the facts row: no two facts closer than 6 pt (text boxes measured on the letters)
  FO.factsCheck = () => { const out = [], it = [...document.querySelectorAll('.fo-fact')].map(e => { const r = document.createRange(); r.selectNodeContents(e); const qs = [...r.getClientRects()].filter(q => q.width > 1); return {slot: e.dataset.slot, l: Math.min(...qs.map(q => q.left)), r: Math.max(...qs.map(q => q.right)), t: Math.min(...qs.map(q => q.top)), b: Math.max(...qs.map(q => q.bottom))}; }).sort((a, b) => a.l - b.l);
    for(let i = 1; i < it.length; i++){ const a = it[i-1], b = it[i], gap = (b.l - a.r)*0.75, vo = Math.min(a.b, b.b) - Math.max(a.t, b.t); if(vo > 2 && gap < 6) out.push({slot: b.slot, kind: 'facts-collide', detail: `${a.slot} and ${b.slot} are ${gap.toFixed(1)} pt apart (6 pt minimum)`}); }
    return out; };
  // no text may sit under a photo or the agent card (the owner's clearance rule, 11/7): any text box that overlaps one fails
  // type set into a fade (design pass 11/15): a text line that lies wholly where a fade is 70% dark or more reads on the night, not on the photo
  FO.inSolid = q => [...document.querySelectorAll('.ar-fade')].some(f => { const r = f.getBoundingClientRect(), c = f.classList, k = 0.536, t = 1;
    if(q.left < r.left - t || q.right > r.right + t || q.bottom < r.top || q.top > r.bottom) return false;   // the part of the line over the photo must lie in the dark part
    return c.contains('l') ? q.right <= r.left + (1 - k)*r.width : c.contains('r') ? q.left >= r.left + k*r.width : c.contains('t') ? q.bottom <= r.top + (1 - k)*r.height : q.top >= r.top + k*r.height; });
  FO.overlapCheck = () => { const out = [], els = [...document.querySelectorAll('.ph, .fo-acard:not(.abs)')].map(e => ({e, r: e.getBoundingClientRect()})).filter(x => x.r.width > 2 && x.r.height > 2), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement; if(!p || !n.textContent.trim() || p.closest('script, style, .plan-svg, .planwrap, .fo-acard, .logo, .lbl, [data-tab]')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(q => { if(q.width < 2 || q.height < 2) return;
        els.forEach(({e, r}) => { if(e.contains(p)) return; const ox = Math.min(q.right, r.right) - Math.max(q.left, r.left), oy = Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top);
          if(ox > 1.5 && oy > 3 && !FO.inSolid(q)) out.push({slot: (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || 'text', kind: 'text-under-element', detail: `"${n.textContent.trim().slice(0, 28)}" overlaps a ${e.className.split(' ')[0]}`}); }); }); }
    const seen = new Set(); return out.filter(i => { const k = i.slot + i.detail; if(seen.has(k)) return false; seen.add(k); return true; }); };
})();
