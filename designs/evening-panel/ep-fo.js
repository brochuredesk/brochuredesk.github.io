/* Evening Panel fold-over and two-sided flyer builders (grown from the FXS-14 builders; the hand is the approved Open House library
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
    el.style.lineHeight = lh + 'pt'; el.style.height = (best.n*lh) + 'pt'; el.dataset.lines = best.n; el.style.textAlign = parseFloat(el.style.width) < 300 ? 'left' : 'justify'; });   // a narrow column is set ragged (no wide word gaps, review point 15)
  // owner 11/8/2026 (FXS-14 versions review p3-p27, standing rule): every write-up runs at least three full lines at its full width (never narrowed, so no line
  // runs past the rule above it), set ragged with every line 80%+ while its true sentences are picked and the last line 90%+, then justified so every line but
  // the last reaches the edge. Runs before SW.fill on the fold-over and flyer; FO.just3 justifies after the fill; FO.fill3Check reports any block that misses.
  FO.prep3 = () => document.querySelectorAll('[data-s][data-slot]').forEach(el => {
    el.dataset.narrow = '0'; el.dataset.fill = Math.max(0.9, +el.dataset.fill || 0); el.dataset.lfill = Math.max(+el.dataset.lfill || 0, el.dataset.h0 ? 0.8 : !(/\.box\.t\d+$/.test(el.dataset.slot) || el.closest('.cap')) ? 0.75 : parseFloat(el.style.width) < 150 ? 0.8 : 0.84); if(el.dataset.rag) el.dataset.lfill = el.dataset.rag; el.dataset.j3 = '1';   // rows and captions 84% (80% in a narrow column) while picked so the box check holds; floor write-ups their approved 80%; intros 75% el.dataset.j3 = '1';   // a table row: 84% while picked so the box check (80%) holds; a floor write-up keeps its approved 80%
    if(el.dataset.try){ let t = el.dataset.try.split(',').map(Number).filter(n => n >= 3); if(el.dataset.span){ const S = JSON.parse(el.dataset.s).slice(0, +el.dataset.pool || 12).map(x => [].concat(x).sort((p, q) => q.length - p.length)[0]), keep = el.innerHTML;   // a spread write-up: only the counts its sentences can reach
        el.innerHTML = SW.esc(S.join(' ')); const most = SW.lines(el).n; el.innerHTML = keep; const r = t.filter(n => n <= most); t = r.length ? r : t.slice(-1); }
      else if(el.dataset.h0) t = t.slice(0, 2);   // a floor write-up fills its box (its top two counts), never a short block over blank space (owner p21/p27)
      el.dataset.try = (t.length ? t : [3]).join(','); }
    if(el.closest('.cap')){ el.dataset.min = Math.max(3, +el.dataset.min || 0); } });
  FO.just3 = () => document.querySelectorAll('[data-j3]').forEach(el => { if(el.textContent.trim() && SW.lines(el).n >= 2) el.style.textAlign = (parseFloat(el.style.width) < 300 && !el.closest('.cap')) ? 'left' : 'justify'; });
  FO.gaps = () => document.querySelectorAll('[data-slot]').forEach(el => { if(getComputedStyle(el).textAlign !== 'justify' || el.querySelector('[data-slot]')) return;
    const sp = parseFloat(getComputedStyle(el).fontSize)*0.28; let worst = 0; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const t = n.textContent; for(let i = 0; i < t.length; i++){ if(t[i] !== ' ') continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const q = r.getBoundingClientRect(); if(q.width > worst && q.height > 0) worst = q.width; } }
    if(worst > sp*3.2) el.style.textAlign = 'left'; });
  FO.fill3Check = () => [...document.querySelectorAll('[data-j3]')].filter(el => el.textContent.trim()).flatMap(el => { const L = SW.lines(el);
    return L.n < 3 ? [{slot: el.dataset.slot, kind: 'writeup-under-3-lines', lines: L.n}] : L.fill < 0.895 ? [{slot: el.dataset.slot, kind: 'writeup-last-line-short', pct: Math.round(L.fill*100)}] : []; });

  // Evening Panel: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Evening Panel refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
      const capParts = els.map(e => { const sl = e.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), lb = document.querySelector(`[data-slot="${sl}.label"]`); return {e, pb: !e.closest('.cap.side, .cap[data-under]') && ph && ph.parentElement, lb: lb && lb.parentElement}; });
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
    rows.forEach(els => { if(els.some(e => e.closest('.cap.side, .cap[data-under]'))) return; const lh = parseFloat(els[0].style.lineHeight) || +els[0].dataset.lh || 13, box = +els[0].dataset.hfit || parseFloat(els[0].style.height), n = Math.max(...els.map(e => SW.lines(e).n)); if(!(n >= 1) || n*lh >= box - 0.5) return; const d = box - n*lh;
      els.forEach(el => { const sl = el.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), pb = ph && ph.parentElement, lbl = document.querySelector(`[data-slot="${sl}.label"]`);
        if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + d) + 'pt';
        el.style.top = (parseFloat(el.style.top) + d) + 'pt'; el.style.height = (n*lh) + 'pt'; el.dataset.lines = n; }); }); };
  FO.sideCenter = () => document.querySelectorAll('.cap.side').forEach(c => { const a = c.querySelector('.a'), lbl = a && document.querySelector(`[data-slot="${a.dataset.slot}.label"]`); if(!a || !lbl) return;
    const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight), hh = 20 + n*lh, top = +c.dataset.phTop + (+c.dataset.phH - hh)/2; a.style.height = (n*lh) + 'pt'; lbl.parentElement.style.top = top + 'pt'; a.style.top = (top + 20) + 'pt'; });
  // after the fill: a caption set beside its photo takes the largest type (its own size up to 1.45x, 0.25 pt steps) at which a set of its true
  // sentences fills 70-88% of the photo's height under its label, every line 80%+ and the last 90%+; no dead column beside a photo (review point 4)
  FO.sideGrow = () => document.querySelectorAll('.cap.side .a[data-slot]').forEach(el => { if(!el.textContent.trim()) return; const c = el.closest('.cap.side'), H = +c.dataset.phH - 22;
    const fs0 = parseFloat(el.style.fontSize), keep = [el.innerHTML, el.style.fontSize, el.style.lineHeight, el.style.height]; let best = null;
    for(let fs = fs0; fs <= Math.min(fs0*1.6, 17) + 1e-6; fs += 0.25){ const lh = fs*1.36; el.style.fontSize = fs + 'pt'; el.style.lineHeight = lh + 'pt'; el.style.height = 'auto'; el.__pfMemo = null;
      for(let T = Math.floor(H*0.88/lh); T >= 3 && T*lh >= H*0.4; T--){ const b = SW.pfN(el, T); if(b){ best = {fs, lh, T, pick: b.pick}; break; } } }
    if(!best){ [el.innerHTML, el.style.fontSize, el.style.lineHeight, el.style.height] = keep; return; }
    el.style.fontSize = best.fs + 'pt'; el.style.lineHeight = best.lh + 'pt'; el.style.height = (best.T*best.lh) + 'pt'; el.dataset.lines = best.T; el.dataset.lh = best.lh;
    el.innerHTML = best.pick.map(x => SW.esc(x)).join(' '); SW.noteGrams(el, best.pick.join(' ')); delete el.dataset.diag; el.style.textAlign = 'left'; });
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
    su.style.height = (n*lh) + 'pt'; su.style.top = (su.dataset.bottom ? z0 + Math.max(0, z1 - z0 - n*lh)/2 : z0 + (z1 - z0 - n*lh)/2) + 'pt'; };
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- Evening Panel geometry (pt, panel trim 612 x 792; bleed to -9 / 621 / 801) ----------------
  // No frame: B16's solid dark panel carries the type, photos run edge to edge beside it, a light paper band crosses each page.
  const X0 = 36, X1 = 576, CW = X1 - X0;
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW;
  FO.frame = () => '';
  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  FO.wrapText = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).filter(Boolean).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ const m = /^(.*\S)\s+(\S)$/.exec(cur); if(m){ out.push(m[1]); cur = m[2] + ' ' + wd; } else { out.push(cur); cur = wd; } } else cur = tr; }); if(cur) out.push(cur); return out; };   // a one-letter word never ends a line (review point 15)
  FO.wrapLines = (t, css, w) => FO.wrapText(t, css, w).map(l => FXS.width(l, css));
  FO.fitTitle = (t, fam, w, max, min, maxLines) => { for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.5*w)) return {f, n: L.length, w}; }
    return {f: min, n: FO.wrapLines(t, `${fam};font-size:${min}pt`, w).length, w}; };
  const SERIF = "font-family:'DM Serif Display'";
  // B16's two-tone headline: the text broken into lines at the largest size (max..min, at most maxLines lines, no widow under half the
  // width), every line its own one-line slot, the last line in the accent. Returns {html, y (under the last line), f, n}.
  FO.twoTone = (text, x, y, w, max, min, maxLines, slot, o) => { o = o || {}; const t = String(text || '').replace(/\.$/, ''); let best = null;
    for(let f = max; f >= min && !best; f -= 0.5){ const ls = FO.wrapText(t, `${SERIF};font-size:${f}pt`, w); if(ls.length <= maxLines && (ls.length === 1 || FXS.width(ls[ls.length - 1], `${SERIF};font-size:${f}pt`) >= w*(o.widow || 0.4))) best = {f, ls}; }
    if(!best){ const f = min; best = {f, ls: FO.wrapText(t, `${SERIF};font-size:${f}pt`, w)}; }
    const lh = best.f*(o.lh || 1.1); let h = '';
    best.ls.forEach((ln, i) => { const ac = best.ls.length > 1 && i === best.ls.length - 1 && !o.mono; h += `<div class="ep-hl${ac ? ' ac' : ''}" style="left:${x}pt;top:${y + i*lh}pt;width:${w + 4}pt;height:${best.f*1.3}pt;font-size:${best.f}pt;line-height:${best.f*1.3}pt;${o.color && !ac ? 'color:' + o.color : ''}" data-slot="${slot}${i ? '.' + i : ''}" data-lines="1">${esc(ln)}</div>`; });
    return {html: h, y: y + best.ls.length*lh, f: best.f, n: best.ls.length}; };
  // the street number on its own line, then the street name (wrapping) in the accent, at one size
  FO.addrHead = (address, x, y, w, max, min, slot) => { const a = String(address || '').trim(), m = /^(\d+[A-Za-z]?)\s+(.+)$/.exec(a);
    if(!m) return FO.twoTone(a, x, y, w, max, min, 3, slot);
    let best = null; for(let f = max; f >= min && !best; f -= 0.5){ const ls = FO.wrapText(m[2], `${SERIF};font-size:${f}pt`, w); if(ls.length <= 2) best = {f, ls: [m[1]].concat(ls)}; }
    if(!best) best = {f: min, ls: [m[1]].concat(FO.wrapText(m[2], `${SERIF};font-size:${min}pt`, w))};
    const lh = best.f*1.06; let h = '';
    best.ls.forEach((ln, i) => { h += `<div class="ep-hl${i ? ' ac' : ''}" style="left:${x}pt;top:${y + i*lh}pt;width:${w + 4}pt;height:${best.f*1.3}pt;font-size:${best.f}pt;line-height:${best.f*1.3}pt" data-slot="${slot}${i ? '.' + i : ''}" data-lines="1">${esc(ln)}</div>`; });
    return {html: h, y: y + best.ls.length*lh, f: best.f, n: best.ls.length}; };
  FO.tileC = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs fo-tile-l" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt" data-slot="${slot}.label" data-lines="1">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div>`;
  FO.lift = () => '';
  // the contact band of B16: the standard contact card on the dark field, agent left, the brokerage panel right with the one logo (white)
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = EP.logoSrc(D); const ko = !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 186, lh = Math.min(46, H - 28), s = {name: 21, nameFloor: 15, hsW: Math.round(H*0.78), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 30, H - 30], tall: [H - 28, H - 28]}};
    return `<div style="--cc-display:'DM Serif Display';--cc-body:Manrope">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };

  // ---------------- FRONT (fold-over cover and flyer front: no agent, no brokerage) ----------------
  // B16 grown into a cover: the dark panel on the left with the neighborhood, the street number and name as the two-tone headline, the
  // accent rule, the outlined box (built, the house in a few words, the lot), the pin and the city; the whole house at the top right and
  // a room under it, a second room at the foot of the panel; the paper band with the icon facts; the write-up in the dark foot.
  FO.front = (D, o) => { o = o || {};
    // design pass 11/15: B16's panel runs the full height to the band and carries the write-up at its foot (no dead navy block when a
    // house has no third room to show); the whole house and one room stack on the right; the paper band closes the cover at the bleed
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, intro = o.intro || F.intro || K.summary || [];
    const PW = 240, TX = 34, TW = PW - TX - 18, RX = PW, RW = 621 - RX, G = 6, BY = 646, BH = 801 - BY;
    const hero = F.hero || K.hero || 'front', strip = o.strip || FO.coverIds(D);   // the kitchen is the inside spread's
    let HH = Math.round(RW/1.42); while(HH < 360 && !SW.fits(D, hero, RW, HH)) HH += 4;
    let h = `<div class="abs" style="left:${RX}pt;top:-9pt;width:${RW}pt;height:${HH}pt">${SW.photo(D, hero, 'position:absolute;inset:0', 'front.house')}</div>`;
    if(strip[0]) h += FXS.box(D, strip[0], RX, HH - 9 + G, RW, BY - (HH - 9 + G), 'front.strip0');
    let t = '';
    const hood = FXS.hood(L);
    if(hood) t += `<div class="ep-eyebrow" style="left:${TX}pt;top:40pt;width:${TW}pt" data-slot="front.place" data-lines="1">${esc(hood.toUpperCase())}</div>`;
    const AH = FO.addrHead(L.address, TX - 2, 56, TW + 2, 54, 26, 'address'); t += AH.html;
    let y = AH.y + 12; t += `<div class="ep-rule" style="left:${TX}pt;top:${y}pt;width:56pt"></div>`; y += 22;
    // the outlined box (B16's date box): built, the house in a few words, the lot or the stories
    const yr = L.yearBuilt || L.year, head = String(F.head || K.head || '').replace(/\.$/, ''), lot = L.lotSize ? String(L.lotSize).replace(/\bSq Ft Lot\b/i, 'sq ft lot').replace(/\bSq Ft\b/i, 'sq ft') : (L.stories && !/\b(floors?|stor(y|ies)|level)\b/i.test(head) ? `${L.stories} ${L.stories == 1 ? 'story' : 'stories'}` : '');
    const bx = TX, bw = TW, pad = 13, iw = bw - 2*pad; let by = y + pad + 1, bh = '';
    bh += `<div class="ep-wd" style="left:${bx + pad}pt;top:${by}pt;width:${iw}pt" data-slot="front.box.k" data-lines="1">${esc(yr ? 'Built in ' + yr : 'The home')}</div>`; by += 17;
    if(head){ const hs = FXS.fitSize(head, SERIF, iw, 23, 15), hl = FO.wrapText(head, `${SERIF};font-size:${hs}pt`, iw); hl.slice(0, 2).forEach((ln, i) => { bh += `<div class="ep-serif" style="left:${bx + pad}pt;top:${by}pt;width:${iw}pt;height:${hs*1.3}pt;font-size:${hs}pt;line-height:${hs*1.3}pt" data-slot="front.box.head${i ? '.' + i : ''}" data-lines="1">${esc(ln)}</div>`; by += hs*1.12; }); by += 6; }
    if(lot){ bh += `<div class="ep-ohair" style="left:${bx + pad}pt;top:${by}pt;width:${iw}pt"></div>`; by += 9;
      const ls = FXS.fitSize(lot, 'font-family:Manrope;font-weight:700', iw, 13.5, 9); bh += `<div class="abs" style="left:${bx + pad}pt;top:${by}pt;width:${iw}pt;height:18pt;font-family:var(--ep-font);font-weight:700;font-size:${ls}pt;line-height:18pt;color:var(--ep-on);white-space:nowrap;overflow:hidden" data-slot="front.box.lot" data-lines="1">${esc(lot)}</div>`; by += 18; }
    by += pad - 2; t += `<div class="ep-obox" style="left:${bx}pt;top:${y}pt;width:${bw}pt;height:${by - y}pt"></div>` + bh; y = by + 18;
    // the pin and the city line
    const pl = FXS.placeLine(L).toUpperCase(); t += EP.pin(TX - 1, y - 1, 15) + `<div class="abs fo-place" style="left:${TX + 20}pt;top:${y}pt;width:${TW - 20}pt" data-slot="front.city" data-lines="1">${esc(pl)}</div>`; y += 34;
    // the write-up at the panel's foot, ragged (a narrow column), its last line on the band's horizon less 22 pt
    { const z0 = y, z1 = BY - 20, lh = 16.2, n = Math.max(3, Math.floor((z1 - z0)/lh));
      t += FO.full(FO.wu(intro, TX, z1 - n*lh, TW, n*lh, 'front.summary', 11, lh, 'wu')).replace('data-slot="front.summary"', `data-z0="${z0}" data-z1="${z1}" data-bottom="1" data-rag="0.66" data-slot="front.summary"`).replace('style="left', 'style="color:var(--ep-soft);left'); }
    // the paper band: the icon facts (the year built is in the panel's box)
    t += EP.band('Home highlights', 0, BY, 612, BH, EP.facts(L), 'front.band', {factsY: 34, fh: 76, vs: 21});
    return h + t;
  };

  // ---------------- FLYER FRONT (a different piece from the cover): the whole house across the top edge to edge; under it B16's panel
  // on the left (the neighborhood, the street as the two-tone headline, the rule, the write-up set ragged) beside two rooms stacked to the
  // right edge; the paper band with the four icon facts across the foot. No agent, no brokerage. ----------------
  // design pass 11/15: the whole house dominant (about 60 percent of the page) edge to edge across the top; under it B16's dark panel with the street
  // large as one two-tone line, the rule and the write-up, beside one room the cover does not show; the paper band with four icon facts.
  FO.flyerInterior = D => { const P = (D.sw || {}).plan || {}, cov = FO.coverIds(D)[0], sp = new Set([cov].concat(P.flyerBack || [], P.flyerTop ? [P.flyerTop] : []).filter(Boolean).map(id => SW.space(D, id)));
    const ok = id => id && (D.photos || {})[id] && !(D.photos[id] || {}).fullHouse && id !== cov && !sp.has(SW.space(D, id)) && !/bath|closet|laundry|wic|hall|powder|^front/i.test(id) && !FXS.OUTSIDE.test(id);
    return (P.flyerStrip || []).concat(P.strip || [], P.left || [], P.right || [], Object.keys(D.photos || {})).find(ok) || null; };
  FO.flyerFront = (D) => { const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, intro = F.intro || K.summary || [];
    const hero = F.hero || K.hero || 'front', room = FO.flyerInterior(D), BY = 652;
    let HH = 474; while(HH < 520 && !SW.fits(D, hero, 630, HH)) HH += 4;
    let h = `<div class="abs" style="left:-9pt;top:-9pt;width:630pt;height:${HH}pt">${SW.photo(D, hero, 'position:absolute;inset:0', 'front.house')}</div>`;
    const MY = HH - 9 + 6, RX = room ? 368 : 621;
    if(room) h += FXS.box(D, room, RX, MY, 621 - RX, BY - MY, 'front.strip0');
    const TX = X0, TW = RX - 22 - TX, hood = FXS.hood(L);
    let t = `<div class="ep-eyebrow" style="left:${TX}pt;top:${MY + 20}pt;width:${TW}pt" data-slot="front.place" data-lines="1">${esc([hood, FXS.placeLine(L)].filter(Boolean).join('  ·  ').toUpperCase())}</div>`;
    const ad = String(L.address || ''), m = /^(\d+[A-Za-z]?)\s+(.+)$/.exec(ad), as = FXS.fitSize(ad, SERIF, TW, 46, 24), y1 = MY + 36;
    t += `<div class="ep-hl" style="left:${TX - 1}pt;top:${y1}pt;width:${TW + 4}pt;height:${as*1.3}pt;font-size:${as}pt;line-height:${as*1.3}pt" data-slot="address" data-lines="1">${m ? `${esc(m[1])} <span style="color:var(--ep-accent)">${esc(m[2])}</span>` : esc(ad)}</div>`;
    const ry = y1 + as*1.16 + 8; t += `<div class="ep-rule" style="left:${TX}pt;top:${ry}pt;width:56pt"></div>`;
    const wy = ry + 16, avail = BY - 16 - wy, lh = 14.6, n = Math.max(3, Math.floor(avail/lh));
    t += FO.full(FO.wu(intro, TX, wy, TW, n*lh, 'front.summary', 10.25, lh, 'wu')).replace('data-slot="front.summary"', `data-z0="${wy}" data-z1="${BY - 14}" data-slot="front.summary"`);
    t += EP.band('Home highlights', 0, BY, 612, 801 - BY, EP.facts(L, {built: true}), 'front.band', {factsY: 32, fh: 74, vs: 20});
    return h + t; };

  // ---------------- INSIDE LEFT (the living level) ----------------
  // B16's panel at the top left (accent kicker, two-tone title, rule, intro) beside the widest room, which stops 0.25 in short of the fold;
  // under them the kitchen, big and edge to edge from the left, standing on its own card (the paper band), with one more captioned room
  // beside it. The band's top is the spread's horizon: the inside right's row of three starts on the same line.
  FO.HZ = 590; FO.HB = 318;   // the spread's two horizons: the foot of the top photos and the top of the paper band
  // the cover's two rooms: the plan's strip (not the kitchen, which is the inside spread's), then any room the inside pages and the back do not
  // show, never two of one space
  FO.coverIds = D => { const P = (D.sw || {}).plan || {}, kid = FO.kitchenId(D), F = (D.sw || {}).front || {}, hero = (((D.companion || {}).flyer || {}).front || {}).hero || F.hero || 'front';
    const taken = [kid, hero].concat(P.left || [], P.right || [], [(P.backNoplan || [])[0]]).filter(Boolean), spT = new Set(taken.map(id => SW.space(D, id))), out = [], spO = new Set();
    const ok = id => id && (D.photos || {})[id] && !(D.photos[id] || {}).fullHouse && !taken.includes(id) && !spT.has(SW.space(D, id)) && !spO.has(SW.space(D, id)) && !/bath|closet|laundry|wic|hall|powder|^front/i.test(id);
    (P.strip || []).concat(Object.keys(D.photos || {})).forEach(id => { if(out.length < 1 && ok(id)){ out.push(id); spO.add(SW.space(D, id)); } });
    return out; };
  FO.kitchenId = D => { const P = (D.sw || {}).plan || {}; return P.kitchen || (P.strip || []).find(id => /^kitchen/.test(id)) || Object.keys(D.photos || {}).find(id => /^kitchen\d*$/.test(id)) || null; };
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, kid = FO.kitchenId(D), cs = FO.cards(D, (P.left || []).filter(id => id !== kid)), [heroC, ...rest] = cs;
    // design pass 11/15: the wide room runs into the fold (3 pt short, the thread's 6 pt dark gutter straddling the fold) and meets the inside
    // right's big photo on one top and bottom edge; the title is the page's oversized serif move
    const PW = 252, TX = X0, TW = PW - TX - 14, HB = FO.HB, FOLD = 608.4;
    let h = FXS.box(D, heroC.photo, PW, -9, FOLD - PW, HB + 9, 'left.wide');
    h += `<div class="abs fo-kick" style="left:${TX}pt;top:40pt;width:${TW}pt" data-slot="left.kicker" data-lines="1">${esc(String(I.kicker || '').toUpperCase())}</div>`;
    const T = FO.twoTone(I.title || '', TX - 1, 58, TW, 42, 28, 4, 'left.title', {widow: 0.35, lh: 1.04}); h += T.html;
    const ry = T.y + 10; h += `<div class="ep-rule" data-role="left-rule" style="left:${TX}pt;top:${ry}pt;width:56pt"></div>`;
    if(HB - 12 - ry - 16 >= 3*14.2) h += FO.full(FO.wu(I.intro || [], TX, ry + 16, TW, HB - 12 - ry - 16, 'left.intro', 10, 14.2, 'wu')).replace('data-slot="left.intro"', `data-top0="${ry + 16}" data-bot0="${HB - 12}" data-measures="1,0.94" data-malign="left" data-slot="left.intro"`);
    else h += `<div class="abs wu" data-slot="left.intro" data-top0="${ry + 16}" data-bot0="${HB - 12}" style="left:${TX}pt;top:${ry + 16}pt;width:${TW}pt;height:0"></div>`;
    // the kitchen, big, on its card; one more room with its caption beside it
    const MY = HB + 6, BY = FO.HZ, KW = 340;
    if(kid && (D.photos || {})[kid]) h += `${FXS.box(D, kid, -9, MY, KW + 9, BY - MY, 'left.kitchen')}`;
    if(rest[0]){ const cx = KW + 16, cw = X1 - cx, n = 4, ph = BY - 16 - MY - 25 - n*13.5; h += FXS.captioned(D, rest[0], cx, MY, cw, ph, n, 'left.photo0', {fs: 10.25, lh: 13.5, min: 3}); }
    // the card: B16's paper band. The tracked caps heading between hairlines and a DM Serif line, then the items as a two-column grid,
    // each label in the main color over its fullest true one-line wording
    const items0 = (box.items || []).slice(0, 6), cw = (CW - 28)/2, cw0 = cw, tcss = 'font-family:Manrope;font-weight:400;font-size:10.5pt';
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backG = new Set([].concat(SFb.inside, SFb.outside, (BXb.inside || {}).items || [], (BXb.outside || {}).items || []).flatMap(t => SW.grams4(t)));
    const backT = [].concat(SFb.inside, SFb.outside, (BXb.inside || {}).items || [], (BXb.outside || {}).items || []).map(String);
    const wn = /new/i.test(box.kicker || ''), oneLine = it => { const S = (it.s || []).map(x => [].concat(x).filter(a => wn || (!SW.grams4(a).some(g => backG.has(g)) && !backT.some(b => SW.sameFact(b, a))))).filter(a => a.length); let best = '';   // a What's new card keeps every row: the back's lists drop what it says
      const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(t && t.length > best.length && FXS.width(t, tcss) <= cw - 2 && !SW.sameFactIn(t)) best = t; return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
      walk(0, []); return best; };
    const FBf = (((D.companion || {}).flyer || {}).back || {}).floors || [], floorG = new Set([].concat(...FBf.map(f => [].concat(...(f.s || []).map(x => [].concat(x))))).flatMap(t => SW.grams4(String(t))));
    let lines1 = items0.map(oneLine); { const clash = lines1.map(t => t && SW.grams4(t).some(g => floorG.has(g))); if(lines1.filter((t, i) => t && !clash[i]).length >= 4) lines1 = lines1.map((t, i) => clash[i] ? '' : t); }   // an item the back's write-up also says goes, while four rows stay
    // design pass 11/15: a row that says what a photo caption on this page says goes (the wine bar's cooler once, not twice), and the grid keeps an
    // even count so no hole opens in its second column
    { const capS = rest.slice(0, 1).flatMap(c => [].concat(...(FXS.augment(D, c).s || []).map(x => [].concat(x)))).map(String), key = t => (String(t).toLowerCase().match(/[a-z]{5,}/g) || []).filter(w => !['kitchen','there','their','which','about'].includes(w));
      const said = (it, t) => t && capS.some(c => SW.sameFact(c, t));
      if(lines1.filter((t, i) => t && !said(items0[i], t)).length >= 4) lines1 = lines1.map((t, i) => said(items0[i], t) ? '' : t);
      let k = lines1.filter(Boolean).length; if(k % 2 && k >= 5){ const j = lines1.map((t, i) => t ? i : -1).filter(i => i >= 0).pop(); lines1[j] = ''; } }
    const items = items0.filter((_, i) => lines1[i]), itemText = lines1.filter(Boolean), rows = Math.ceil(items.length/2);
    let b = `<div class="ep-band" style="left:-9pt;top:${BY}pt;width:630pt;height:${801 - BY}pt"></div>`;
    const hw = 200, rl = (CW - hw)/2 - 16;
    b += `<div class="ep-band-r" style="left:${X0}pt;top:${BY + 22}pt;width:${rl}pt"></div><div class="ep-band-r" style="left:${X1 - rl}pt;top:${BY + 22}pt;width:${rl}pt"></div>`;
    b += `<div class="ep-band-h" style="left:${306 - hw/2}pt;top:${BY + 16}pt;width:${hw}pt;height:12pt" data-slot="left.box.kicker" data-lines="1">${esc(String(box.kicker || 'The kitchen').toUpperCase())}</div>`;
    b += `<div class="abs fo-sub" style="left:${X0}pt;top:${BY + 34}pt;width:${CW}pt;text-align:center;color:var(--ep-paper-ink);font-size:20pt;line-height:24pt" data-slot="left.box.heading" data-lines="1">${esc((box.heading || '').replace(/\.$/, ''))}</div>`;
    const gy0 = BY + 72, gh = (776 - gy0)/Math.max(1, rows);
    items.forEach((it, i) => { const c = i % 2, r = Math.floor(i/2), x = X0 + c*(cw0 + 28), y = gy0 + r*gh + (gh - 30)/2, cw = (items.length % 2 && i === items.length - 1) ? CW : cw0;
      b += `<div class="abs" style="left:${x}pt;top:${y + 2}pt;width:14pt;height:1.4pt;background:var(--ep-box-line)"></div>`;
      b += `<div class="abs fo-li-l" style="left:${x + 22}pt;top:${y - 3}pt;width:${cw - 22}pt;color:var(--ep-paper-main)" data-slot="left.list.l${i}" data-lines="1">${esc(it.l)}</div>`;
      b += `<div class="abs" style="left:${x}pt;top:${y + 12}pt;width:${cw}pt;height:16pt;font:400 10.5pt/16pt var(--ep-font);color:var(--ep-paper-text);white-space:nowrap;overflow:hidden" data-slot="left.list.t${i}" data-lines="1">${esc(itemText[i])}</div>`; });
    if(rows > 1) b += `<div class="ep-cellr" style="left:${306}pt;top:${gy0 + 4}pt;height:${(items.length % 2 ? (rows - 1)*gh : 776 - gy0) - 8}pt"></div>`;
    h += `<div class="ep-ink">${b}</div>`;
    return h;
  };

  // ---------------- INSIDE RIGHT (bedrooms and baths): the paper band across the top with the heading, four captioned rooms below it in
  // two rows, the wide photo alternating sides (B16's asymmetry) ----------------
  // design pass 11/15: the inside right answers the inside left across the fold. The best room (the primary suite) runs from the fold to the
  // bleed on the left page's top horizon; under it on the dark the oversized two-tone title and the room's caption, full width; the paper band
  // crosses at the left page's horizon and carries the other three rooms with their captions in the paper's ink (one band across the spread).
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs0 = FO.cards(D, P.right || []);
    // the dominant photo is the best room on the page (the primary suite, else a bedroom, else a living space); closets and baths go small
    const score = c => P.rightLead === c.photo ? 9 : /closet|wic|pbath|bath|laundry|hall/i.test(c.photo) ? 0 : /^primary\d*$|suite/i.test(c.photo) ? 3 : /bed|game|living|family|media/i.test(c.photo) ? 2 : 1;
    const top = cs0.slice(0, 4).map((c, i) => [score(c), -i, c]).sort((a, b) => b[0] - a[0] || b[1] - a[1])[0], cs = top ? [top[2]].concat(cs0.filter(c => c !== top[2])) : cs0;
    const HB = FO.HB, BY = FO.HZ, FX = 3.6;
    let h = '';
    if(cs[0]) h += FXS.box(D, cs[0].photo, FX, -9, 621 - FX, HB + 9, 'right.photo0');
    let y = HB + 22;
    h += `<div class="abs fo-kick" style="left:${X0}pt;top:${y}pt;width:${CW}pt" data-slot="right.kicker" data-lines="1" data-title="${esc(String(R.title || '').replace(/\.$/, ''))}">${esc(String(R.kicker || '').toUpperCase())}</div>`;
    const T = FO.twoTone(R.title || '', X0 - 1, y + 16, CW, 44, 26, 2, 'right.title', {widow: 0.3, lh: 1.04}); h += T.html; y = T.y + 10;
    h += `<div class="ep-rule" style="left:${X0}pt;top:${y}pt;width:56pt"></div>`; y += 18;
    if(cs[0]){ const c = FXS.augment(D, cs[0]), L0 = FXS.leadLabel(c.lead), lh = 17, n = Math.max(3, Math.min(4, Math.floor((BY - 20 - y - 20)/lh)));
      // the big room's story under the title: a full-width write-up with the room's name as its label (three full lines or more, justified)
      h += `<div class="abs" style="left:${X0}pt;top:${y}pt;width:${CW}pt;white-space:nowrap"><div class="lbl" data-slot="right.story.label" data-lines="1" style="max-width:${CW}pt">${esc(L0.name.toUpperCase())}</div></div>`;
      h += FO.full(FO.wu(c.s, X0, y + 19, CW, n*lh, 'right.story', 12, lh, 'wu')).replace('data-slot="right.story"', `data-z1="${BY - 14}" data-room="${esc(L0.name)}" data-measures="1,0.9,0.8,0.7" data-malign="left" data-slot="right.story"`).replace('style="left', 'style="color:var(--ep-soft);left'); }
    // the paper band at the spread's horizon with the three other rooms
    let b = `<div class="ep-band" style="left:-9pt;top:${BY}pt;width:630pt;height:${801 - BY}pt"></div>`;
    const gp = 12, rw = (CW - 2*gp)/3, ROWL = 3, clh = 13.2, rowPH = 776 - (BY + 16) - 25 - ROWL*clh;
    cs.slice(1, 4).forEach((c, i) => { b += FXS.captioned(D, c, X0 + i*(rw + gp), BY + 16, rw, rowPH, ROWL, 'right.photo' + (i + 1), {fs: 10, lh: clh, min: 3}); });
    h += `<div class="ep-ink">${b}</div>`;
    return h;
  };
  // after the fill: the inside right's big caption sets the lines it took; the title block and the caption sit centered between the photo and the band
  FO.rightFit2 = () => { const a = document.querySelector('[data-slot="right.story"]'); if(!a || !a.textContent.trim()) return;
    const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight), bot = +a.dataset.z1; a.style.height = (n*lh) + 'pt';
    const kk = document.querySelector('[data-slot="right.kicker"]'), lbl = document.querySelector('[data-slot="right.story.label"]').parentElement;
    const rule = [...document.querySelectorAll('.ep-rule')].find(r => Math.abs(parseFloat(r.style.top) - (parseFloat(a.style.top) - 37)) < 2);
    let slack = bot - (parseFloat(a.style.top) + n*lh);
    // a short story leaves room: the title takes it first (the page's oversized move grows, up to 60 pt, two or three lines)
    const tl = [...document.querySelectorAll('[data-slot^="right.title"]')], text = kk && kk.dataset.title;
    if(slack > 24 && tl.length && text){ const f0 = parseFloat(tl[0].style.fontSize), t0 = parseFloat(tl[0].style.top), oldH = tl.length*f0*1.04, W = parseFloat(tl[0].style.width) - 4;
      // balanced breaks (two lines split where the longer line is shortest), never a lone word on the last line
      const wd = text.split(/\s+/), bal = f => { const css = `font-family:'DM Serif Display';font-size:${f}pt`; let best = null;
        for(let i = 2; i <= wd.length - 2; i++){ const ls = [wd.slice(0, i).join(' '), wd.slice(i).join(' ')], m = Math.max(...ls.map(l => FXS.width(l, css))); if(m <= W && (!best || m < best.m) && !/^\S$/.test(wd[i - 1])) best = {ls, m}; }
        return best && best.ls; };
      let pick = null; for(let f = 58; f > f0 + 2; f -= 1){ const ls = bal(f); if(!ls) continue; const dh = ls.length*f*1.04 - oldH; if(dh <= slack - 6){ pick = {f, dh, ls}; break; } }
      if(pick){ const x0 = parseFloat(tl[0].style.left), box = document.createElement('div');
        box.innerHTML = pick.ls.map((ln, i) => `<div class="ep-hl${i === pick.ls.length - 1 ? ' ac' : ''}" style="left:${x0}pt;top:${t0 + i*pick.f*1.04}pt;width:${W + 4}pt;height:${pick.f*1.3}pt;font-size:${pick.f}pt;line-height:${pick.f*1.3}pt" data-slot="right.title${i ? '.' + i : ''}" data-lines="1">${SW.esc(ln)}</div>`).join(''); const par = tl[0].parentElement; [...box.children].forEach(c => par.insertBefore(c, tl[0])); tl.forEach(e => e.remove());
        [rule, lbl, a].filter(Boolean).forEach(e => { e.style.top = (parseFloat(e.style.top) + pick.dh) + 'pt'; }); slack -= pick.dh; } }
    const d = slack/2; if(d <= 1) return;
    const els = [kk, ...document.querySelectorAll('[data-slot^="right.title"]'), lbl].filter(Boolean);
    els.concat(rule ? [rule] : [], [a]).forEach(e => { e.style.top = (parseFloat(e.style.top) + d) + 'pt'; }); };

  // after the fill: an inside-right intro that sets fewer than three lines hands its freed room to the top row of photos (they grow upward),
  // so no empty band opens between the intro and the photos (blank check, 11/8); three lines or more: nothing moves (the approved 2-story page)
  FO.rightFit = () => { const el = document.querySelector('[data-slot="right.intro"]'); if(!el || !el.textContent.trim()) return; const n = SW.lines(el).n; if(n >= 3) return;
    const d = (3 - n)*(+el.dataset.lh || 15.5); ['right.photo0', 'right.photo1'].forEach(sl => { const ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), box = ph && ph.parentElement; if(!box) return;
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
  // each nearby place sits centered top to bottom between its rules (owner 11/7, p6)
  const nearRows = (D, x, y, w, o) => { o = o || {}; const N = ((D.sw || {}).back || {}).nearby || [], top = o.top == null ? 20 : o.top, rh = o.rowH || 28, ds = o.d || 15, ps = o.p || 8.5;
    return N.slice(0, 3).map((n, i) => `<div class="fo-near" style="left:${x}pt;top:${y + top + i*rh}pt;width:${w}pt;height:${rh - 0.5}pt" data-slot="back.near${i}" data-lines="1" data-fine="1"><div class="in"><span class="d" style="font-size:${ds}pt">${esc(n.dist)}</span><span class="p" style="font-size:${ps}pt">${esc(n.place)}</span></div></div>`).join('') + FO.kick('Nearby', x, y, 'back.near.kicker'); };
  // the plan in its box (the design's own dark background; the plan prints clear with light lines, PlanInk): the box is as wide as the drawing needs
  FO.planBox = (D, x, y, maxH, maxW) => { const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: D.plan.turn ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: !!D.plan.turn, angle: D.plan.turn && D.plan.kind === 'color' ? 270 : undefined}), cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 44, D.plan.minCard || 0, 170, FXS.width((D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate. Turned on its side.', 'font-family:Manrope;font-size:8pt')/2 + 44)); return FXS.planCard(D, x, y, cw, maxH); };   // the note may take two lines: the box keeps the plan's own width (design pass 11/15)   // as narrow as the plan, never narrower than its note
  FO.CARD_H = 64; FO.CARD_Y = 684;   // B16's contact band: the card on the dark foot, the fine print under it
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:758pt;width:${CW}pt;height:8pt;text-align:left" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  // Nearby as B16 stacks it: the distance in DM Serif over the place in tracked caps, a hairline under each
  const nearStack = (D, x, y, w, rh, o) => { o = o || {}; const N = ((D.sw || {}).back || {}).nearby || [];
    return FO.kick('Nearby', x, y, 'back.near.kicker') + N.slice(0, 3).map((n, i) => { const yy = y + 20 + i*rh;
      return `<div class="abs" style="left:${x}pt;top:${yy + (rh - 34)/2}pt;width:${w}pt;height:34pt"><div style="font:400 ${o.d || 18}pt/20pt var(--ep-serif);color:var(--fx-on);white-space:nowrap" data-slot="back.near${i}" data-lines="1" data-fine="1">${esc(n.dist)}</div><div data-slot="back.near${i}.p" data-lines="1" data-fine="1" style="font:700 8.6pt/12pt var(--ep-font);letter-spacing:1.4pt;text-transform:uppercase;color:var(--fx-soft);white-space:nowrap;overflow:hidden">${esc(n.place)}</div></div>` + (i < 2 ? `<div class="abs hr" style="left:${x}pt;top:${yy + rh - 1}pt;width:${w}pt"></div>` : ''); }).join(''); };
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [];
    const kid = FO.kitchenId(D), coverIds = FO.coverIds(D), inside = [kid].concat(coverIds, P.left || [], P.right || []).filter(Boolean), sp = new Set(inside.map(id => SW.space(D, id))), fresh = id => id && !inside.includes(id) && !sp.has(SW.space(D, id));
    const topId = flyer ? P.flyerTop : ((P.back || [])[0] || (P.backNoplan || []).find(fresh) || (P.backNoplan || [])[0]);
    const rowIds = flyer ? (P.flyerBack || []).slice(0, 3) : [hasPlan ? ((P.backNoplan || []).find(fresh) || (P.backRow || ['bath2'])[0]) : ((P.backRow || []).find(id => fresh(id) && id !== topId) || (P.backNoplan || []).find(id => fresh(id) && id !== topId) || 'bath2')];
    if(!flyer && !FO.cards(D, rowIds).length){ const any = Object.keys(D.photos || {}).find(id => fresh(id) && id !== topId && !(D.photos[id] || {}).fullHouse && !/bath|closet|laundry|powder|hall/i.test(id) && FO.cards(D, [id]).length); if(any) rowIds.splice(0, rowIds.length, any); }   // a fresh room when the plan's own picks are all shown elsewhere
    const rowCards = FO.cards(D, rowIds);
    const L0 = 36, R0 = 576, TOP = 40, CB = FO.CARD_Y - 18;
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6); let t1 = (BX.inside && BX.inside.title) || 'New and updated';
    // the fold-over's inside left carries a What's new card: the back's list drops what that card already says
    { const LB = ((K.left || {}).box) || {}; if(!flyer && /new/i.test(LB.kicker || '')){ const words = [].concat(...(LB.items || []).map(it => [].concat(...(it.s || []).map(x => [].concat(x))).concat(it.l))).map(String);
        const said = t => words.some(w => SW.sameFact(String(t), w) || String(w).toLowerCase().includes(String(t).toLowerCase().replace(/^new\s+/, '')));
        const k1 = c1.filter(t => !said(t)), more = SF.inside.filter(t => !said(t) && !k1.includes(t) && !/^Built in|story|bedrooms|square feet/i.test(t));
        if(k1.length < 3){ t1 = 'Inside'; c1.splice(0, c1.length, ...more.filter(t => !/^new\b|replaced|leveled|reworked/i.test(t)).slice(0, 5)); }   // design pass 11/15: the What's new card already tells the renovation; the back lists the rest of the house under its true name
        else c1.splice(0, c1.length, ...k1.concat(more).slice(0, 6)); } }
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s)), about = keep(f2.concat(f1));
    // the lists: two columns of B16 dash bullets (the accent outlined box on the fold-over, open on the flyer)
    const lists = (x, y, w, rows, rh, fs) => { const cw = (w - 20)/2; return FO.kick(t1, x, y, 'back.updates.title') + FXS.bullets(c1, x, y + 20, cw, rh, 'back.updates', rows, fs).html + FO.kick('Outside', x + cw + 20, y, 'back.outside.title') + FXS.bullets(c2, x + cw + 20, y + 20, cw, rh, 'back.outside', rows, fs).html; };
    const nList = w => Math.max(3, Math.min(5, Math.max(FXS.bullets(c1, 0, 0, (w - 20)/2, 1, 'x', 5, 10.25).n, FXS.bullets(c2, 0, 0, (w - 20)/2, 1, 'x', 5, 10.25).n)));
    let h = '';
    if(!flyer){
      // FOLD-OVER BACK (design pass 11/15): B16's panel down the left carries the street as the two-tone headline and the house room by room;
      // the plan (or a captioned room) at the top right in a box its own shape, the outdoor room under it; B16's paper band crosses the page
      // above the contact band with three cells (the lists and Nearby, thin rules between, as the cover's facts band); the contact band.
      const BB = 512, BE = FO.CARD_Y - 14, TOPB = BB - 18;
      let pw = 300, planB = TOP;
      if(hasPlan){ const TH = Math.min(320, TOPB - 14 - 120 - 25 - 3*13.5 - TOP - 48); /* the plan card adds its note under the drawing (up to 48 pt) */ pw = Math.round(parseFloat(/width:([\d.]+)pt/.exec(FO.planBox(D, 0, TOP, TH, 330).html)[1])); const pc = FO.planBox(D, R0 - pw, TOP, TH, 330); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; planB = pc.bottom; }
      else { const c = FXS.cardFor(D, topId); h += FXS.captioned(D, c, R0 - pw, TOP, pw, 168, 3, 'back.top', {fs: 10.25, lh: 13.5, min: 3}); planB = TOP + 168 + 25 + 3*13.5; }
      const RW = Math.max(pw, 280), RX = R0 - RW, LW = Math.min(R0 - pw, RX) - 24 - L0;
      const py = planB + 14, ph = TOPB - py - 25 - 3*13.5; if(ph < 100) issues.push({slot: 'back.photo1', kind: 'overlap', detail: 'the outdoor photo has under 100 pt under the plan'});
      h += FXS.captioned(D, rowCards[0], RX, py, RW, ph, 3, 'back.photo1', {fs: 10.25, lh: 13.5, min: 3});
      const AH = FO.addrHead((D.listing || {}).address, L0 - 1, TOP - 4, LW, 40, 22, 'back.head'); h += AH.html;
      const ky = AH.y + 14; h += FO.kick('Room by room', L0, ky, 'back.about.title');
      h += FO.full(FO.wu(about, L0, ky + 20, LW, TOPB - ky - 20, 'back.about', 11, 16.2, 'body')).replace('data-slot="back.about"', `data-measures="1,0.95,0.9,0.85" data-malign="left" data-rag="0.7" data-slot="back.about"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
      // the band: three cells
      let b = `<div class="ep-band" style="left:-9pt;top:${BB}pt;width:630pt;height:${BE - BB}pt"></div>`;
      const cwA = 196, cwB = 168, gx = 22, xa = L0, xb = xa + cwA + gx, xc = xb + cwB + gx, cwC = R0 - xc, ry = BB + 18, rows = Math.max(3, Math.min(5, Math.floor((BE - 16 - ry - 20)/19.5)));
      const span = BE - 16 - ry - 20, rhOf = (list, w) => Math.min(26, span/Math.max(3, FXS.bullets(list, 0, 0, w, 1, 'x', rows, 10).n));   // each list spreads its rows over the cell's height: no gap under a list
      b += FO.kick(t1, xa, ry, 'back.updates.title') + FXS.bullets(c1, xa, ry + 20, cwA, rhOf(c1, cwA), 'back.updates', rows, 10).html;
      b += `<div class="ep-cellr" style="left:${xb - gx/2}pt;top:${ry}pt;height:${BE - 16 - ry}pt"></div>` + FO.kick('Outside', xb, ry, 'back.outside.title') + FXS.bullets(c2, xb, ry + 20, cwB, rhOf(c2, cwB), 'back.outside', rows, 10).html;
      b += `<div class="ep-cellr" style="left:${xc - gx/2}pt;top:${ry}pt;height:${BE - 16 - ry}pt"></div>` + nearStack(D, xc, ry, cwC, (BE - 16 - ry - 20)/3, {d: 16});
      h += `<div class="ep-ink">${b}</div>`;
    } else {
      // FLYER BACK: the light paper band across the top carries the street, the house in words and the plan (dark lines on the paper);
      // three captioned rooms on the dark; the lists and Nearby side by side; the contact band
      const TH = Math.min(236, (P.flyerTH || 300) - 10), PB0 = TOP + TH + 12;
      let b = '', pw = 300, bandB = PB0;
      if(hasPlan){ pw = Math.round(parseFloat(/width:([\d.]+)pt/.exec(FO.planBox(D, 0, TOP, TH, 360).html)[1])); const pc = FO.planBox(D, R0 - pw, TOP, TH, 360); b += pc.html.replace('class="card"', 'class="card" data-paper="1"'); issues.push(...pc.issues); window.planIssues = pc.issues; bandB = Math.max(bandB, pc.bottom + 14); }
      else { const c = FXS.cardFor(D, topId); b += FXS.captioned(D, c, R0 - pw, TOP, pw, 180, 3, 'back.top', {fs: 10.5, lh: 13.5, min: 3}); bandB = TOP + 180 + 25 + 3*13.5 + 14; }
      const LW = R0 - pw - 22 - L0, AH = FO.addrHead((D.listing || {}).address, L0 - 1, TOP - 4, LW, 32, 20, 'back.head');
      b += AH.html.replace(/class="ep-hl ac" style="/g, 'class="ep-hl ac" style="color:var(--ep-box-line);');
      const ky = AH.y + 12; b += FO.kick('Room by room', L0, ky, 'back.about.title');
      const span = bandB - 14 - ky - 20, n = Math.max(3, Math.floor(span/15.4)), lh = +(span/n).toFixed(3);
      b += FO.full(FO.wu(about, L0, ky + 20, LW, n*lh + 0.01, 'back.about', 10.75, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-span="${span.toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
      h += `<div class="ep-band" style="left:-9pt;top:-9pt;width:630pt;height:${bandB + 9}pt"></div><div class="ep-ink" style="--fx-seal:var(--ep-paper);--paper:var(--ep-paper)">${b}</div>`;
      const LR = nList(330), LH = Math.max(20 + LR*20, 20 + 3*36), LY = CB - LH, y0 = bandB + 16, n3 = rowCards.length, gap = 10, tw = (R0 - L0 - (n3 - 1)*gap)/n3, PH = Math.max(100, LY - 6 - y0 - 25 - 3*13.5);
      if(y0 + PH + 25 + 3*13.5 > LY - 5) issues.push({slot: 'back.photos', kind: 'overlap', detail: 'the photo row runs into the lists'});
      rowCards.forEach((c, i) => { h += FXS.captioned(D, c, L0 + i*(tw + gap), y0, tw, PH, 3, 'back.photo' + i, {fs: 10.25, lh: 13.5, min: 3}); });
      h += lists(L0, LY, 330, LR, 20, 10.25);
      h += `<div class="ep-vhair" style="left:${L0 + 348}pt;top:${LY}pt;height:${LH}pt"></div>` + nearStack(D, L0 + 366, LY, R0 - L0 - 366, (LH - 20)/3, {d: 16});
    }
    h += FO.contact(D, X0, window.__cardY || FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D);
    return {html: h, issues};
  };

  // after the fill: the fold-over back's outdoor photo gives up height when its caption set more lines than planned, so the caption never
  // reaches the lists box under it (10 pt clear)
  FO.backFix = () => { const c = document.querySelector('.cap .a[data-slot="back.photo1"]'), bx = document.querySelector('[data-role="back-lists"]'); if(!c || !bx) return;
    const k = 0.75, over = (c.getBoundingClientRect().bottom - bx.getBoundingClientRect().top)*k + 10; if(over <= 0) return;
    const ph = document.querySelector('.ph[data-slot-photo="back.photo1"]'), pb = ph && ph.parentElement, lb = document.querySelector('[data-slot="back.photo1.label"]');
    if(pb) pb.style.height = (parseFloat(pb.style.height) - over) + 'pt'; if(lb) lb.parentElement.style.top = (parseFloat(lb.parentElement.style.top) - over) + 'pt'; c.style.top = (parseFloat(c.style.top) - over) + 'pt'; };
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
