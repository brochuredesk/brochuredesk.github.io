/* Lifted Photo fold-over and two-sided flyer builders (grown from the FXS-14 builders; the hand is the approved Open House library
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

  // Lifted Photo: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Lifted Photo refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), z0 = +su.dataset.z0, z1 = +su.dataset.z1;
    su.style.height = (n*lh) + 'pt'; su.style.top = (z0 + (z1 - z0 - n*lh)/2) + 'pt'; };
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- Lifted Photo geometry (pt, panel trim 612 x 792; bleed to -9 / 621 / 801) ----------------
  // B11's hand on the paper: the lead photo of a page is a print curling off the paper (one free edge sweeps up toward one side, a
  // soft shadow under it; the sweep crosses ground, sky or floor only, never the house); under it the flyer's grid: blocks between
  // hairline rules at a quarter ink, columns split by vertical hairlines, a tracked caps label in the main color on top of each
  // column; display lines in Fraunces, two lines in two tones (ink, then the main color).
  const X0 = 36, X1 = 576, CW = X1 - X0, DISP = "font-family:Fraunces;font-weight:600;letter-spacing:-.4pt";
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW;
  FO.frame = () => '';
  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  FO.wrapText = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).filter(Boolean).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out; };
  FO.wrapLines = (t, css, w) => FO.wrapText(t, css, w).map(l => FXS.width(l, css));

  // ---- the lifted print ----
  // where the house sits in a w x h frame (shares of the frame: left, top, right, bottom), exactly as SW.focus crops it
  FO.houseIn = (D, id, w, h) => { const p = (D.photos || {})[id]; if(!p || !p.box || !p.w || !p.h) return null; const ia = p.w/p.h, ta = w/h, [x0, y0, x1, y1] = p.box, pl = (lo, hi, v) => Math.min(1 - v, Math.max(0, (lo + hi)/2 - v/2));
    if(ia > ta){ const v = ta/ia, off = p.boxAlign && x1 - x0 <= v ? Math.min(1 - v, Math.max(0, p.boxAlign === 'right' ? x1 - v + .01 : x0 - .01)) : pl(x0, x1, v); return [(x0 - off)/v, y0, (x1 - off)/v, y1]; } const v = ia/ta, off = pl(y0, y1, v); return [x0, (y0 - off)/v, x1, (y1 - off)/v]; };
  FO.houseFoot = (D, id, w, h) => { const b = FO.houseIn(D, id, w, h); return b ? b[3] : null; };
  const rise = (u, lift) => lift*Math.pow(Math.max(0, Math.min(1, u)), 1.7);
  // the sweep a house allows: the edge (bottom or top) may rise toward `dir` ('r' or 'l') by `want` of the frame, never over the house
  // (2% clear); under 5% it stays straight (B11 on tall houses, approved 11/15/2026: "straight photo edge on tall houses: OK")
  FO.liftFor = (D, id, w, h, want, edge, dir) => { const b = FO.houseIn(D, id, w, h); if(!b) return want;
    const u = dir === 'r' ? b[2] : 1 - b[0], k = Math.pow(Math.max(.05, Math.min(1, u)), 1.7);
    const room = edge === 'top' ? b[1] - .02 : 1 - b[3] - .02, L = Math.min(want, room/k); return L >= .05 ? L : 0; };
  // a polygon (fractions of the frame) for a print whose `edge` sweeps up toward `dir`
  FO.poly = (edge, dir, lift, n) => { n = n || 16; const pts = [...Array(n + 1)].map((_, i) => i/n), u = x => dir === 'r' ? x : 1 - x;
    if(edge === 'top') return pts.map(x => [x, rise(u(x), lift)]).concat([[1, 1], [0, 1]]);
    return [[0, 0], [1, 0]].concat(pts.slice().reverse().map(x => [x, 1 - rise(u(x), lift)])); };
  FO.clip = poly => `clip-path:polygon(${poly.map(([x, y]) => `${(x*100).toFixed(2)}% ${(y*100).toFixed(2)}%`).join(',')})`;
  // the print: a photo in its frame, clipped to its sweep, the soft shadow under it
  FO.print = (D, id, x, y, w, h, slot, poly, cls) => `<div class="lp-print ${cls || ''}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${SW.photo(D, id, 'position:absolute;inset:0;' + (poly ? FO.clip(poly) : ''), slot)}</div>`;
  // the edge's height (pt, page) at page x for a bottom sweep on a frame (x, y, w, h)
  FO.edgeAt = (fx, fy, fw, fh, lift, dir, px) => { const t = (px - fx)/fw; return fy + fh*(1 - rise(dir === 'r' ? t : 1 - t, lift)); };

  // ---- type ----
  // the display line in two tones (B11's "Public / Open House"): two balanced lines, the first in ink, the second in the main color, at the
  // largest size (max..min) where both fit w; never a one-letter word ending a line; o.split: the two lines given (a street: number / name)
  FO.title2 = (text, x, y, w, max, min, slot, o) => { o = o || {}; const t = String(text || '').replace(/\.$/, '').trim(), css = f => `${DISP};font-size:${f}pt`; let best = null;
    const words = t.split(/\s+/), splits = o.split ? [o.split] : (words.length < 2 ? [[t]] : words.slice(1).map((_, i) => [words.slice(0, i + 1).join(' '), words.slice(i + 1).join(' ')]).filter(([a]) => !/(^|\s)\S$/.test(a)));
    for(let f = max; f >= min && !best; f -= 0.5){ let pick = null;
      splits.forEach(ls => { const ws = ls.map(l => FXS.width(l, css(f))); if(Math.max(...ws) > w - 2) return; const sc = Math.abs(ws[0] - (ws[1] || ws[0])); if(!pick || sc < pick.sc) pick = {ls, sc}; });
      if(pick) best = {f, ls: pick.ls}; }
    if(!best) best = {f: min, ls: splits[0]};
    const lh = best.f*(o.lh || 1.04); let h = '';
    best.ls.forEach((ln, i) => { h += `<div class="lp-title${i ? ' b' : ''}" style="left:${x}pt;top:${y + i*lh}pt;width:${w}pt;height:${best.f*1.3}pt;font-size:${best.f}pt;line-height:${best.f*1.3}pt;text-align:${o.align || 'left'}" data-slot="${slot}${i ? '.' + i : ''}" data-lines="1">${esc(ln)}</div>`; });
    return {html: h, y: y + (best.ls.length - 1)*lh + best.f*1.18, f: best.f, n: best.ls.length}; };
  FO.titleH = (n, f, lhk) => (n - 1)*f*(lhk || 1.04) + f*1.18;
  // the street as the two-tone display: the number in ink over the street in the main color
  FO.streetSplit = a => { const m = /^(\d+[A-Za-z]?)\s+(.+)$/.exec(String(a || '').trim()); return m ? [m[1], m[2]] : [String(a || '').trim()]; };
  FO.place = L => [FXS.hood(L), L.city].filter(Boolean).join('  ·  ').toUpperCase();
  FO.eyebrow = (t, x, y, w, slot, align) => `<div class="lp-eyebrow" style="left:${x}pt;top:${y}pt;width:${w}pt;text-align:${align || 'left'}" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`;
  FO.k = (t, x, y, w, slot, align) => `<div class="lp-k" style="left:${x}pt;top:${y}pt;width:${w}pt;text-align:${align || 'left'}" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`;
  FO.hair = (x, y, w) => `<div class="lp-hair" style="left:${x}pt;top:${y}pt;width:${w}pt"></div>`;
  FO.vhair = (x, y, h) => `<div class="lp-vhair" style="left:${x}pt;top:${y}pt;height:${h}pt"></div>`;
  // the facts as the flyer sets its date: a Fraunces numeral and a tracked caps label in the main color, one row each
  FO.factParts = (L, short) => FXS.statItems(L).map(t => FXS.statParts(short ? String(t) : String(t).replace(/^(\d[\d,]*) Sq Ft$/, '$1 Square feet')));
  FO.factStack = (L, x, y, w, h, slot, o) => { o = o || {}; const P = FO.factParts(L), n = P.length, rh = h/Math.max(1, n); let s = o.max || 30, out = '';
    const fits = s => P.every(p => FXS.width(p.n, `${DISP};font-size:${s}pt`) + 7 + FXS.width(String(p.l).toUpperCase(), `font-family:Outfit;font-weight:600;letter-spacing:2pt;font-size:${Math.max(8.6, s*0.34)}pt`) <= w - 2);
    while(s > 14 && (!fits(s) || s*1.2 > rh)) s -= 0.5; const ls = Math.max(8.6, +(s*0.34).toFixed(2));
    P.forEach((p, i) => { out += `<div class="fo-fact" style="left:${x}pt;top:${y + i*rh + (rh - s*1.25)/2}pt;width:${w}pt;height:${s*1.25}pt;line-height:${s*1.25}pt" data-slot="${slot}.${i}" data-lines="1"><span class="n" style="font-size:${s}pt">${esc(p.n)}</span>${p.l ? `<span class="l" style="font-size:${ls}pt">${esc(p.l)}</span>` : ''}</div>`;
      if(i && o.rules) out += FO.hair(x, y + i*rh, w); });
    return out; };
  // a photo with its name under it in tracked caps (no caption text)
  FO.tileC = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 8}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;
  // the standard contact card on the paper (B11's own: the agent in Fraunces, the main-color bar beside the name, the logo right)
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = LP.logoSrc(D);
    const pw = 186, lh = Math.min(46, H - 28), s = {name: 21, nameFloor: 15, hsW: Math.round(H*0.78), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 30, H - 30], tall: [H - 28, H - 28]}};
    return `<div class="lp-card" style="--cc-display:Fraunces;--cc-body:Outfit">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: false}) + '</div>'; };

  // ---------------- FRONT ----------------
  // FOLD-OVER COVER (grown from the Open House flyer): the house is the print across the top, its foot sweeping up to the right over a
  // soft shadow; under it the flyer's two columns: the street in two tones as large as the column allows (the number in ink, the street
  // in the main color) beside a hairline, the facts stacked on the right, starting higher where the print has lifted; a rule; the write-up.
  FO.front = (D, o) => { o = o || {}; if(o.flyer) return FO.flyerFront(D, o);
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = F.hero || K.hero || 'front', FOOT = 766, SLH = 20, RX = 396, LW = RX - 20 - X0;
    const ST = FO.streetSplit(L.address), sf = Math.min(84, ...ST.map(l => FXS.fitSize(l, DISP, LW - 2, 84, 34))), sh = FO.titleH(ST.length, sf, 0.98);
    const block = 15 + 8 + sh + 18 + 1 + 16 + 3*SLH;
    let HB = Math.round(FOOT - block); while(HB > 380 && !SW.fits(D, hero, 630, HB + 9)) HB -= 6;
    const FH = HB + 9, lift = FO.liftFor(D, hero, 630, FH, 0.17, 'bottom', 'r'), poly = lift ? FO.poly('bottom', 'r', lift) : null;
    let h = FO.print(D, hero, -9, -9, 630, FH, 'front.house', poly), t = '';
    let y = HB + 16;
    t += FO.eyebrow(FO.place(L), X0, y, LW, 'front.place'); y += 15 + 8;
    t += FO.title2('', X0, y, LW, sf, sf, 'address', {split: ST, lh: 0.98}).html; const yS = y + sh;
    // the facts column: from under the lifted edge at its own x down to the street's foot
    const yR = Math.max(HB - 70, FO.edgeAt(-9, -9, 630, FH, lift, 'r', RX) + 20), fh = yS - yR;
    t += FO.vhair(RX - 1, yR + 4, fh - 4) + FO.factStack(L, RX + 18, yR, X1 - RX - 18, fh, 'front.facts', {max: 30});
    y = yS + 18; t += FO.hair(X0, y, CW); y += 16;
    { const avail = FOOT - y, n = Math.max(3, Math.min(6, Math.round(avail/SLH))), lh = Math.min(avail/n, 21), fs = Math.min(13.5, +(lh/1.5).toFixed(2));
      t += FO.full(`<div class="abs wu" data-slot="front.summary" data-z0="${y}" data-z1="${FOOT}" data-lines="${n}" data-try="${n},${n - 1}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:${n*lh}pt;font-size:${fs}pt;line-height:${lh}pt"></div>`); }
    return h + t;
  };
  // FLYER FRONT (its own composition, not the cover): the type first, as the flyer's lower block reads: the place, the street on one line
  // in two tones, the facts in a row between hairlines; the write-up; two rooms as prints; then the house as the print along the foot,
  // bleeding off three edges, its top edge sweeping up to the left (the print curling the other way).
  FO.flyerFront = (D, o) => { const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = F.hero || K.hero || 'front', strip = (P.flyerStrip || P.strip || []).filter(id => (D.photos || {})[id]).slice(0, 2);
    let t = FO.eyebrow(FO.place(L), X0, 30, CW, 'front.place'), y = 47;
    const ST = FO.streetSplit(L.address), one = ST.join(' ');
    let sf = FXS.fitSize(one, DISP, CW - 4, 58, 30); const two = sf < 40 && ST.length > 1;
    if(two) sf = Math.min(58, ...ST.map(l => FXS.fitSize(l, DISP, CW - 4, 58, 30)));
    if(!two && ST.length > 1){ const w1 = FXS.width(ST[0] + ' ', `${DISP};font-size:${sf}pt`);
      t += `<div class="lp-title" style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:${sf*1.3}pt;font-size:${sf}pt;line-height:${sf*1.3}pt" data-slot="address" data-lines="1">${esc(ST[0])} <span style="color:var(--lp-main)">${esc(ST[1])}</span></div>`; y += sf*1.18; void w1; }
    else { t += FO.title2('', X0, y, CW, sf, sf, 'address', {split: ST, lh: 0.98}).html; y += FO.titleH(ST.length, sf, 0.98); }
    y += 10; t += FO.hair(X0, y, CW);
    // the facts in one row: numeral and label, hairlines between
    { const Pp = FO.factParts(L, true), n = Pp.length, cw = CW/n, FHh = 40; let s = 24; const ok = s => Pp.every(p => FXS.width(p.n, `${DISP};font-size:${s}pt`) + 6 + FXS.width(String(p.l).toUpperCase(), `font-family:Outfit;font-weight:600;letter-spacing:2pt;font-size:8.6pt`) <= cw - 14);
      while(s > 14 && !ok(s)) s -= 0.5;
      Pp.forEach((p, i) => { if(i) t += FO.vhair(X0 + i*cw, y + 9, FHh - 18);
        t += `<div class="fo-fact" style="left:${X0 + i*cw + (i ? 12 : 0)}pt;top:${y + (FHh - s*1.25)/2 + 1}pt;width:${cw - 14}pt;height:${s*1.25}pt;line-height:${s*1.25}pt" data-slot="front.facts.${i}" data-lines="1"><span class="n" style="font-size:${s}pt">${esc(p.n)}</span>${p.l ? `<span class="l" style="font-size:8.6pt;margin-left:6pt">${esc(p.l)}</span>` : ''}</div>`; });
      y += FHh; t += FO.hair(X0, y, CW); y += 14; }
    const SL = 3, SLH = 18.5; const sumTop = y;
    t += FO.full(`<div class="abs wu" data-slot="front.summary" data-z0="${sumTop}" data-z1="${sumTop + SL*SLH}" data-lines="${SL}" data-try="${SL}" data-lh="${SLH}" ${FXS.sd(intro)} style="left:${X0}pt;top:${sumTop}pt;width:${CW}pt;height:${SL*SLH}pt;font-size:12pt;line-height:${SLH}pt"></div>`);
    y = sumTop + SL*SLH + 16;
    // the house along the foot; the rooms take what it leaves (a tall house takes room from them)
    let RH = 150, HH = 801 - (y + RH + 22 + 18);
    while(RH > 100 && !SW.fits(D, hero, 630, HH)){ RH -= 6; HH += 6; }
    let hw = 630; while(hw > 400 && !SW.fits(D, hero, hw, HH)) hw -= 10;
    const g = 14, w0 = strip.length > 1 ? Math.round((CW - g)*0.56) : CW, w1 = CW - w0 - g;
    let h = '';
    if(strip[0]) h += FO.tileC(D, strip[0], X0, y, w0, RH, 'front.strip0');
    if(strip[1]) h += FO.tileC(D, strip[1], X0 + w0 + g, y, w1, RH, 'front.strip1');
    const hy = y + RH + 22 + 18, lift = FO.liftFor(D, hero, hw, HH, 0.14, 'top', 'l'), poly = lift ? FO.poly('top', 'l', lift) : null;
    h += FO.print(D, hero, (612 - hw)/2, hy, hw, 801 - hy, 'front.house', poly);
    return h + t;
  };

  // ---------------- THE INSIDE SPREAD: one sweep across the fold ----------------
  // Both pages open on a room as a print across the top. The two prints' feet are ONE curve across the whole spread, lowest at the fold
  // and lifting toward both outer edges (the open sheet curling), each print held 1/8 in off the fold so the paper shows between them.
  // Under the curve both pages share one horizon: the eyebrow and two-tone title (mirrored about the fold: set to the fold on the left
  // page, from the fold on the right), a hairline, the kitchen card (left) or the bedroom's lead (right), and the locked row of rooms.
  FO.BAND = {LOW: 334, LIFT: 66, HEAD: 350, RULE: 456, MID: 468, ROW: 580, FOOT: 766};
  FO.spreadY = X => FO.BAND.LOW - FO.BAND.LIFT*Math.pow(Math.abs(X/612 - 1), 1.7);   // X: spread x, 0..1224, the fold at 612
  FO.bandPrint = (D, id, slot, right) => { const fx = right ? 9 : -9, fy = -9, fh = FO.BAND.LOW + 9, n = 24;
    const poly = [[0, 0], [1, 0]].concat([...Array(n + 1)].map((_, i) => 1 - i/n).map(u => { const px = fx + u*612, X = right ? 612 + px : px; return [u, (FO.spreadY(X) - fy)/fh]; }));
    return FO.print(D, id, fx, fy, 612, fh, slot, poly); };
  FO.head = (kicker, title, slot, right) => { const B = FO.BAND, al = right ? 'left' : 'right';
    let h = kicker ? FO.eyebrow(kicker, X0, B.HEAD, CW, slot + '.kicker', al) : '';
    const T = FO.title2(title || '', X0, B.HEAD + 17, CW, 36, 24, slot + '.title', {align: al}); h += T.html; return h; };
  FO.row3 = (D, cards, slot0, i0) => { const B = FO.BAND, n = cards.length, g = 14, w = (CW - (n - 1)*g)/n, clh = 13.5, LN = 3, ph = B.FOOT - B.ROW - 25 - LN*clh; let h = '';
    cards.forEach((c, i) => { let cap = FXS.captioned(D, c, X0 + i*(w + g), B.ROW, w, ph, LN, slot0 + (i0 + i), {fs: 10.25, lh: clh, min: 3}); if(c.photo === 'bar') cap = cap.replace('<div class="ph" data-photo="bar"', '<div class="ph" data-zoom="2.4,0.103,0.566" data-photo="bar"'); h += cap; });
    return h; };
  // INSIDE LEFT (the living level): the kitchen is the print; its card is the feedback card's soft tint panel under the title, the
  // kitchen's facts in two columns of labeled rows split by a hairline; the living rooms follow in the locked row.
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, cs = FO.cards(D, P.left || []), B = FO.BAND;
    const kid = (P.strip || []).find(id => (D.photos || {})[id]) || (cs[0] || {}).photo, rowCards = cs.filter(c => c.photo !== kid).slice(0, 3);
    let h = FO.bandPrint(D, kid, 'left.wide', false) + FO.head(I.kicker, I.title, 'left') + FO.hair(X0, B.RULE, CW);
    const items0 = (box.items || []).slice(0, 8), inl = items0.length >= 6, colW = (CW - 36 - 30)/2, tcss = 'font-family:Outfit;font-weight:400;font-size:10.5pt';
    // six rows or more (the one-story "What's new" card): each row on one line, the label in tracked caps and the fact after it
    const lwm = inl ? Math.max(...items0.map(it => FXS.width(String(it.l).toUpperCase(), 'font-family:Outfit;font-weight:600;font-size:8.6pt;letter-spacing:1.8pt'))) + 16 : 0, lw = () => lwm;
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const oneLine = it => { const S = (it.s || []).map(x => [].concat(x).filter(a => !SW.grams4(a).some(g => backG.has(g)) && !backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w)))))).filter(a => a.length); let best = '';
      const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(t && !/^(It|Its|They|This|That)\b/.test(t) && t.length > best.length && FXS.width(t, tcss) <= (inl ? CW - 36 : colW) - 2 - lw(it) && !SW.sameFactIn(t)) best = t; return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
      walk(0, []); return best; };
    const lines1 = items0.map(oneLine); let items = items0.map((it, i) => [it, lines1[i]]).filter(x => x[1]); items = items.slice(0, inl ? 6 : items.length >= 4 ? 4 : items.length);
    if(inl){ const need = 12 + 18 + items.length*17 + 10, have = B.ROW - 18 - B.MID; if(need > have){ const d = need - have; ['LOW', 'HEAD', 'RULE', 'MID'].forEach(k => B[k] -= d); h = FO.bandPrint(D, kid, 'left.wide', false) + FO.head(I.kicker, I.title, 'left') + FO.hair(X0, B.RULE, CW); } }
    const PY = B.MID, PH = B.ROW - 18 - PY, cols = inl ? 1 : items.length >= 4 ? 2 : 1, rows = Math.ceil(items.length/cols), ix = X0 + 18, KY = PY + 12, y0 = KY + 18, rowH = (PY + PH - 8 - y0)/Math.max(1, rows), cw = cols === 2 ? colW : CW - 36;
    h += `<div class="lp-panel" style="left:${X0}pt;top:${PY}pt;width:${CW}pt;height:${PH}pt"></div>`;
    h += FO.k(String(box.kicker || 'The kitchen'), ix, KY, CW - 36, 'left.box.kicker');
    if(cols === 2) h += FO.vhair(ix + colW + 15, y0 + 3, rows*rowH - 8);
    items.forEach(([it, txt], i) => { const c = cols === 2 ? i % 2 : 0, r = cols === 2 ? Math.floor(i/2) : i, x = ix + c*(colW + 30), y = y0 + r*rowH, pad = Math.max(0, (rowH - 27)/2);
      if(inl){ const l = lw(it), py = y + (rowH - 15)/2;
        h += `<div class="abs fo-li-l" style="left:${x}pt;top:${py + 2.5}pt;width:${l}pt;color:var(--lp-ink)" data-slot="left.list.l${i}" data-lines="1">${esc(it.l)}</div>`;
        h += `<div class="abs fo-li-t" style="left:${x + l}pt;top:${py}pt;width:${cw - l}pt;height:15pt" data-slot="left.list.t${i}" data-lines="1">${esc(txt)}</div>`; return; }
      h += `<div class="abs fo-li-l" style="left:${x}pt;top:${y + pad}pt;width:${cw}pt;color:var(--lp-ink)" data-slot="left.list.l${i}" data-lines="1">${esc(it.l)}</div>`;
      h += `<div class="abs fo-li-t" style="left:${x}pt;top:${y + pad + 12}pt;width:${cw}pt;height:15pt" data-slot="left.list.t${i}" data-lines="1">${esc(txt)}</div>`; });
    return h + FO.row3(D, rowCards, 'left.photo', 0);
  };
  // INSIDE RIGHT (bedrooms and baths): the best room of the page is the print (the primary suite, else a bedroom); its name and what there
  // is to say about it run under the title at full width; the other rooms follow in the locked row.
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs0 = FO.cards(D, P.right || []), B = FO.BAND;
    const score = c => /closet|wic|pbath|bath|laundry|hall/i.test(c.photo) ? 0 : /^primary\d*$|suite/i.test(c.photo) ? 3 : /bed|game|living|family|media/i.test(c.photo) ? 2 : 1;
    const lead = P.rightLead && cs0.find(c => c.photo === P.rightLead), top = lead ? [9, 0, lead] : cs0.slice(0, 4).map((c, i) => [score(c), -i, c]).sort((a, b) => b[0] - a[0] || b[1] - a[1])[0], cs = top ? [top[2]].concat(cs0.filter(c => c !== top[2])) : cs0;
    let h = FO.head(R.kicker, R.title, 'right', true) + FO.hair(X0, B.RULE, CW);
    if(cs[0]){ const c = FXS.augment(D, cs[0]), L0 = FXS.leadLabel(c.lead), ly = B.MID, ty = ly + 20, H = B.ROW - 18 - ty;
      h += FO.bandPrint(D, c.photo, 'right.photo0', true);
      h += `<div class="abs" style="left:${X0}pt;top:${ly}pt;width:${CW}pt;white-space:nowrap"><div class="lbl" data-slot="right.photo0.label" data-lines="1" style="max-width:${CW}pt">${esc(L0.name.toUpperCase())}</div>${L0.size ? `<span data-size="1" class="lbl sz">${esc(L0.size)}</span>` : ''}</div>`;
      const llh = Math.max(19, Math.min(22.5, H/4.4)); h += FO.full(FO.wu((c.s || []).concat(R.intro || []), X0, ty, CW, H, 'right.lead', +(llh/1.52).toFixed(2), llh, 'wu')).replace('data-slot="right.lead"', `data-room="${esc(L0.name)}" data-slot="right.lead"`); }
    return h + FO.row3(D, cs.slice(1, 4), 'right.photo', 1);
  };
  FO.rightFit = () => {}; FO.rightCapFit = () => {}; FO.leftFit = () => {};

  // ---------------- BACK (fold-over) and flyer back ----------------
  // The flyer's grid carried to the back: the year on the eyebrow and what the house is in two tones across the top; a rule; the plan on
  // the tint panel sized to the plan as drawn, a hairline, and beside it "Floor by floor" over the write-up and a captioned outdoor print
  // (no plan: the outdoor print large on the left, the write-up and a second captioned print beside it); a rule; three columns split by
  // hairlines, Inside | Outside | Nearby (the distances in Fraunces numerals); the rule and the contact card.
  FO.planBox = (D, x, y, maxH, maxW) => { const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: D.plan.turn ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: !!D.plan.turn, angle: D.plan.turn && D.plan.kind === 'color' ? 270 : undefined}), cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 44, D.plan.minCard || 0, 220)); return FO.planPanel(FXS.planCard(D, x, y, cw, maxH)); };
  FO.planPanel = pc => Object.assign(pc, {html: pc.html.replace('<div class="card" style="', '<div class="lp-panel" style="').replace('background:var(--fx-seal)"', 'background:var(--lp-tint)"').replace('--paper:var(--fx-seal)', '--paper:var(--lp-tint)')});
  FO.CARD_H = 62; FO.CARD_Y = 690;
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:759pt;width:${CW}pt;height:8pt;text-align:left" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  // Nearby as a column: each place's distance in a Fraunces numeral over the place in tracked caps
  FO.nearCol = (D, x, y, w, h) => { const N = (((D.sw || {}).back || {}).nearby || []).slice(0, 3), rh = (h - 18)/Math.max(1, N.length); let out = FO.k('Nearby', x, y, w, 'back.near.kicker');
    N.forEach((n, i) => { const ps = FXS.fitSize(String(n.place).toUpperCase(), 'font-family:Outfit;font-weight:600;letter-spacing:1.6pt', w - 2, 8.8, 8.6), ds = Math.min(20, rh*0.42);
      out += `<div class="fo-near" style="left:${x}pt;top:${y + 18 + i*rh + (rh - ds*1.2 - 13)/2}pt;width:${w}pt;height:${ds*1.2 + 13}pt" data-slot="back.near${i}" data-lines="2" data-fine="1"><div class="d" style="font-size:${ds}pt;line-height:${ds*1.2}pt">${esc(n.dist)}</div><div class="p" style="font-size:${ps}pt;line-height:13pt">${esc(n.place)}</div></div>`; });
    return out; };
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, F = ((D.companion || {}).flyer || {}).front || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [], L = D.listing || {};
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    const usedIn = new Set([].concat(P.left || [], P.right || [], [topId, (P.strip || [])[0]])), freeRow = (P.strip || []).slice(1).filter(id => (D.photos || {})[id] && !usedIn.has(id) && FXS.cardFor(D, id));
    const rowIds = flyer ? (P.flyerBack || []).slice(0, 3) : (hasPlan && (P.backNoplan || [])[0] ? [P.backNoplan[0]] : (P.backRowNoplan || (freeRow.length ? [freeRow[0]] : P.backRow) || ['bath2'])), rowCards = FO.cards(D, rowIds);
    const TOP = 34; let h = '';
    // the top: the year on the eyebrow, the house in two tones
    const yr = L.yearBuilt || L.year, head = String(F.head || (K.front || {}).head || '').replace(/\.$/, '') || FXS.hood(L) || 'The house';
    h += FO.eyebrow(yr ? 'Built in ' + yr : FXS.hood(L), X0, TOP, CW, 'back.about.title');
    const natW = hasPlan && !D.plan.turn ? (IvoryPlan.draw(D.plan, {x: 0, y: 0, w: 900, h: 256}, {allowRotate: false}).usedW || 0) : 0, wide = natW + 44 >= 400;
    // owner 11/16 (Book 3 p41/p44): the headline is one line in two tones (ink, then the main color) so the top stays tight and the
    // space goes to the plan, the write-up and the lists; two lines only when one line would set under 28 pt
    const HD = (() => { const t = String(head).trim(), ws = t.split(/\s+/), css = f => `${DISP};font-size:${f}pt`, mx = flyer ? 38 : 40;
      if(ws.length > 1) for(let f = mx; f >= 28; f -= 0.5){ if(FXS.width(t, css(f)) > CW - 4) continue;
        let k1 = 1, sc = Infinity; for(let i = 1; i < ws.length; i++){ if(/^\S$/.test(ws[i - 1])) continue; const d = Math.abs(FXS.width(ws.slice(0, i).join(' '), css(f)) - FXS.width(ws.slice(i).join(' '), css(f))); if(d < sc){ sc = d; k1 = i; } }
        return {html: `<div class="lp-title" style="left:${X0}pt;top:${TOP + 15}pt;width:${CW}pt;height:${f*1.3}pt;font-size:${f}pt;line-height:${f*1.3}pt" data-slot="back.head" data-lines="1">${esc(ws.slice(0, k1).join(' '))} <span style="color:var(--lp-main)">${esc(ws.slice(k1).join(' '))}</span></div>`, y: TOP + 15 + f*1.22, f, n: 1}; }
      return FO.title2(head, X0, TOP + 16, CW, wide ? 32 : 34, 24, 'back.head'); })(); h += HD.html;
    let y = HD.y + 10; h += FO.hair(X0, y, CW); y += 14;
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'Inside';
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const pool = P.pool ? ` data-pool="${P.pool}"` : '';
    // the lists band and the card from the foot up
    const LISTH = flyer ? 146 : 172, CARDR = FO.CARD_Y - 12, LB = CARDR - 14, LT = LB - LISTH, RULE2 = LT - 14;
    const midB = RULE2 - 14;   // the middle block runs y .. midB

    const wuBlock = (x, wy, w, hh, fs, lh) => { const n = Math.max(3, Math.floor(hh/lh)), l2 = +(hh/n).toFixed(3); return FO.full(FO.wu(keep(f2.concat(f1)), x, wy, w, n*l2 + 0.01, 'back.about', fs, l2, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-span="${hh.toFixed(2)}"${pool}`); };
    if(hasPlan && wide){
      // a plan of many floors runs across the page on its panel; the write-up runs under it at full width
      const wantH = Math.min(flyer ? 230 : 260, midB - y - 36 - 14 - 18 - 3*(flyer ? 15.5 : 17) - 4), pw0 = Math.min(CW, Math.ceil(natW*Math.min(1, (wantH - 34)/256)) + 80), pc = FO.planPanel(FXS.planCard(D, X0 + Math.round((CW - pw0)/2), y, pw0, wantH)); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues;
      let wy = pc.bottom + 14; h += FO.k(flyer ? 'Floor by floor' : 'Floor by floor', X0, wy, CW, 'back.floors.k'); wy += 18;
      h += wuBlock(X0, wy, CW, midB - wy, flyer ? 10.75 : 11.5, flyer ? 15.5 : 17);
    } else if(hasPlan){
      const pc = FO.planBox(D, X0, y, midB - y - 36, 316); issues.push(...pc.issues); window.planIssues = pc.issues;
      // owner 11/16 (Book 3 p41): no blank under the plan: its panel runs down to the block's foot, the plan centered top to bottom in it
      { const ex = midB - pc.bottom; if(ex > 2){ pc.html = pc.html.replace(/(<div class="lp-panel" style="[^"]*?height:)([\d.]+)pt/, (m, a, hh) => a + (+hh + ex).toFixed(2) + 'pt').replace('class="abs planwrap" style="left:0;top:0;', `class="abs planwrap" style="left:0;top:${(ex/2).toFixed(2)}pt;`); } }
      h += pc.html;
      const pw = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])), ax = X0 + pw + 21, aw = X1 - ax;
      h += FO.vhair(ax - 11, y, midB - y);
      h += FO.k(L.stories > 1 ? 'Floor by floor' : 'Room by room', ax, y, aw, 'back.floors.k');
      const c0 = rowCards[0], ph = c0 ? Math.max(110, Math.min(170, Math.round(aw*0.62))) : 0, capH = c0 ? 25 + 3*13.5 : 0;
      const wy = y + 18, wh = (midB - wy) - (c0 ? ph + capH + 14 : 0);
      h += wuBlock(ax, wy, aw, wh, flyer ? 10.75 : 11, flyer ? 15.5 : 16.5);
      if(c0) h += FXS.captioned(D, c0, ax, midB - ph - capH, aw, ph, 3, 'back.photo1', {fs: 10, lh: 13.5, min: 3});
    } else {
      // no plan: the outdoor print large on the left with its caption, the write-up and a second captioned print beside it
      const lw = 300, c = FXS.cardFor(D, topId), capH = 25 + 3*14, tph = midB - y - capH;
      h += FXS.captioned(D, c, X0, y, lw, tph, 3, 'back.top', {fs: 10.5, lh: 14, min: 3});
      const ax = X0 + lw + 21, aw = X1 - ax; h += FO.vhair(ax - 11, y, midB - y);
      h += FO.k(L.stories > 1 ? 'Floor by floor' : 'Room by room', ax, y, aw, 'back.floors.k');
      const c0 = rowCards[0], ph = c0 ? 132 : 0, cH = c0 ? 25 + 3*13.5 : 0, wy = y + 18, wh = (midB - wy) - (c0 ? ph + cH + 14 : 0);
      h += wuBlock(ax, wy, aw, wh, flyer ? 10.75 : 11, flyer ? 15.5 : 16.5);
      if(c0) h += FXS.captioned(D, c0, ax, midB - ph - cH, aw, ph, 3, 'back.photo1', {fs: 10, lh: 13.5, min: 3});
    }
    h += FO.hair(X0, RULE2, CW);
    // the three columns: Inside | Outside | Nearby
    // owner 11/16 (Book 3 p41): no blank under the bullets: every column's rows run the band's full height, and the type takes the largest
    // size (10.25 to 13 pt) at which every item still sets on one line
    const cw3 = (CW - 2*30)/3, rows = Math.max(3, Math.min(6, Math.max(c1.length, c2.length))), rh = (LISTH - 22)/rows;
    let bfs = 13; while(bfs > 10.25 && [...c1, ...c2].some(t => FXS.width(t, `font-family:Outfit;font-weight:400;font-size:${bfs}pt`) > cw3 - 14)) bfs -= 0.25;
    bfs = Math.min(bfs, rh*0.5);
    const rh1 = (LISTH - 22)/Math.max(1, Math.min(rows, c1.length)), rh2 = (LISTH - 22)/Math.max(1, Math.min(rows, c2.length));
    h += FO.k(t1, X0, LT, cw3, 'back.updates.title') + FXS.bullets(c1, X0, LT + 20, cw3, rh1, 'back.updates', rows, bfs).html;
    h += FO.vhair(X0 + cw3 + 15, LT, LISTH) + FO.k('Outside', X0 + cw3 + 30, LT, cw3, 'back.outside.title') + FXS.bullets(c2, X0 + cw3 + 30, LT + 20, cw3, rh2, 'back.outside', rows, bfs).html;
    h += FO.vhair(X0 + 2*cw3 + 45, LT, LISTH) + FO.nearCol(D, X0 + 2*cw3 + 60, LT, cw3, LISTH);
    h += FO.hair(X0, CARDR, CW);
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
  // a print clipped to its sweep: text overlaps it only where the text's box reaches inside the polygon (the paper the sweep leaves is paper)
  FO.inClip = (e, q) => { const m = /polygon\(([^)]+)\)/.exec(e.style.clipPath || ''); if(!m) return true; const r = e.getBoundingClientRect();
    const P = m[1].split(',').map(t => t.trim().split(/\s+/).map(v => parseFloat(v)/100)).map(([x, y]) => [r.left + x*r.width, r.top + y*r.height]);
    const inP = (x, y) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, yi] = P[i], [xj, yj] = P[j]; if(((yi > y) !== (yj > y)) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) c = !c; } return c; };
    for(let a = 0; a <= 4; a++) for(let b = 0; b <= 2; b++){ const x = q.left + 1 + (q.width - 2)*a/4, y = q.top + q.height*0.15 + q.height*0.7*b/2; if(inP(x, y)) return true; } return false; };
  FO.overlapCheck = () => { const out = [], els = [...document.querySelectorAll('.ph, .fo-acard:not(.abs)')].map(e => ({e, r: e.getBoundingClientRect()})).filter(x => x.r.width > 2 && x.r.height > 2), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement; if(!p || !n.textContent.trim() || p.closest('script, style, .plan-svg, .planwrap, .fo-acard, .logo')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(q => { if(q.width < 2 || q.height < 2) return;
        els.forEach(({e, r}) => { if(e.contains(p)) return; const ox = Math.min(q.right, r.right) - Math.max(q.left, r.left), oy = Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top);
          if(ox > 1.5 && oy > 3 && FO.inClip(e, q)) out.push({slot: (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || 'text', kind: 'text-under-element', detail: `"${n.textContent.trim().slice(0, 28)}" overlaps a ${e.className.split(' ')[0]}`}); }); }); }
    const seen = new Set(); return out.filter(i => { const k = i.slot + i.detail; if(seen.has(k)) return false; seen.add(k); return true; }); };
})();
