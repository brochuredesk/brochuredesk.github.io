/* Angle fold-over and two-sided flyer builders (the Twilight Frame pilot's engine and fill passes, the layouts drawn new in the hand of the
   approved Open House library flyer P17 Angle). Panel coordinates in pt: trim 612 x 792 (the proof page adds a 9 pt bleed; anything that
   bleeds runs to -9 / 621 / 801). After the fill: FO.refit sets any block, caption row or table that still misses the fill rules again;
   FO.capSnug / frontSnug / sideGrow / sideCenter close the room a block did not use; AN.applyShapes cuts every slanted edge last. */
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
  FO.just3 = () => document.querySelectorAll('[data-j3]:not([data-ragged])').forEach(el => { if(el.textContent.trim() && SW.lines(el).n >= 2) el.style.textAlign = 'justify'; });
  FO.gaps = () => document.querySelectorAll('[data-slot]').forEach(el => { if(getComputedStyle(el).textAlign !== 'justify' || el.querySelector('[data-slot]')) return;
    const sp = parseFloat(getComputedStyle(el).fontSize)*0.28; let worst = 0; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const t = n.textContent; for(let i = 0; i < t.length; i++){ if(t[i] !== ' ') continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const q = r.getBoundingClientRect(); if(q.width > worst && q.height > 0) worst = q.width; } }
    if(worst > sp*3.2) el.style.textAlign = 'left'; });
  FO.fill3Check = () => [...document.querySelectorAll('[data-j3]')].filter(el => el.textContent.trim()).flatMap(el => { const L = SW.lines(el);
    return L.n < 3 ? [{slot: el.dataset.slot, kind: 'writeup-under-3-lines', lines: L.n}] : L.fill < 0.895 ? [{slot: el.dataset.slot, kind: 'writeup-last-line-short', pct: Math.round(L.fill*100)}] : []; });

  // Angle: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Angle refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
      // a row of two or three photo captions may share its width unevenly (each photo as wide as its caption's true sentences fill; one locked row, same gutters)
      const pair = (els.length === 2 || els.length === 3) && els.every(e => e.closest('.cap') && !e.closest('.cap.side')), parts = pair ? els.map(e => { const sl = e.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), lb = document.querySelector(`[data-slot="${sl}.label"]`); return {e, pb: ph && ph.parentElement, lb: lb && lb.parentElement, x: parseFloat(e.style.left), w: parseFloat(e.style.width)}; }).sort((p, q) => p.x - q.x) : null;
      const split = r => { if(!pair) return; const n = parts.length, A = parts[0], Z = parts[n - 1], span = Z.x + Z.w - A.x, g = parts[1].x - A.x - A.w, ws = (Array.isArray(r) ? r : [r, 1 - r]).map(k => (span - g*(n - 1))*k); let x = A.x;
        parts.forEach((P, i) => { const w = ws[i]; [P.e, P.pb, P.lb].forEach(el => { if(el){ el.style.left = x + 'pt'; el.style.width = w + 'pt'; } }); if(P.lb && P.lb.firstElementChild) P.lb.firstElementChild.style.maxWidth = w + 'pt'; P.e.dataset.w0 = w; P.e.__pfMemo = null; x += w + g; }); };
      const T3 = []; if(pair && parts.length === 3){ const opts = [1/3, 0.29, 0.38, 0.25, 0.42]; opts.forEach(a => opts.forEach(b => { const c = 1 - a - b; if(c >= 0.24 && c <= 0.43) T3.push([a, b, c]); })); }
      const ratios = pair ? (parts.length === 3 ? T3 : [0.5, 0.55, 0.45, 0.6, 0.4, 0.64, 0.36]) : [null];
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
      if(!done && pair) split(parts.length === 3 ? [1/3, 1/3, 1/3] : 0.5);
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
  // a side caption marked data-bottom: its label at the photo's top, its text ending on the photo's foot
  FO.sideBottom = () => document.querySelectorAll('.cap.side[data-bottom]').forEach(c => { const a = c.querySelector('.a'); if(!a) return; const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight); a.style.height = (n*lh) + 'pt'; a.style.top = (+c.dataset.phTop + +c.dataset.phH - n*lh) + 'pt'; });
  FO.sideCenter = () => document.querySelectorAll('.cap.side:not([data-top])').forEach(c => { const a = c.querySelector('.a'), lbl = a && document.querySelector(`[data-slot="${a.dataset.slot}.label"]`); if(!a || !lbl) return;
    const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight), hh = 20 + n*lh, top = +c.dataset.phTop + (+c.dataset.phH - hh)/2; a.style.height = (n*lh) + 'pt'; lbl.parentElement.style.top = top + 'pt'; a.style.top = (top + 20) + 'pt'; });
  // ---------------- Angle marks (pt, panel trim 612 x 792; anything that bleeds runs to -9 / 621 / 801) ----------------
  // Text keeps 36 pt from every trim (0.5 in from the fold on the inside and outside spreads).
  const X0 = 36, X1 = 576, CW = X1 - X0, SK = Math.tan(14*Math.PI/180);
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW; FO.SK = SK;
  // Where the whole house sits in a w x h frame once SW.focus has cropped it (fractions of the frame), or null for a room photo
  AN.houseIn = (D, id, w, h, anchor) => { const p = (D.photos || {})[id]; if(!p || !p.box || !p.w || !p.h) return null;
    const ia = p.w/p.h, ta = w/h, vis = ia > ta ? {w: ta/ia, h: 1} : {w: 1, h: ia/ta}, [x0, y0, x1, y1] = p.box;
    const place = (lo, hi, v) => { const c = (lo + hi)/2, off = Math.min(1 - v, Math.max(0, c - v/2)); return v >= 1 ? 0.5 : off/(1 - v); };
    let fx = (p.focusX != null ? p.focusX : 50)/100, fy = (p.focusY != null ? p.focusY : 50)/100;
    if(vis.w < 1) fx = place(x0, x1, vis.w); if(vis.h < 1) fy = place(y0, y1, vis.h);
    if(vis.h < 1 && anchor === 'top'){ const off = Math.min(1 - vis.h, Math.max(0, y0 - 0.04)); if(y1 <= off + vis.h - .01) fy = off/(1 - vis.h); }
    const ox = (1 - vis.w)*fx, oy = (1 - vis.h)*fy; return {l: (x0 - ox)/vis.w, r: (x1 - ox)/vis.w, t: (y0 - oy)/vis.h, b: (y1 - oy)/vis.h}; };
  // The deepest slant a cut may take on this photo without touching the house (pt; a room photo takes any): m = clearance in pt
  AN.maxCut = (D, id, w, h, kind, anchor, m) => { m = m == null ? 8 : m; const b = AN.houseIn(D, id, w, h, anchor); if(!b) return 999;
    if(kind === 'bottom') return Math.max(0, (h - b.b*h - m)/Math.max(.01, b.r));
    if(kind === 'top') return Math.max(0, (b.t*h - m)/Math.max(.01, 1 - b.l));
    if(kind === 'left') return Math.max(0, (b.l*w - m)/Math.max(.01, 1 - b.t));
    if(kind === 'right') return Math.max(0, (w - b.r*w - m)/Math.max(.01, b.b));
    return 999; };
  // The shapes, in pt of the element's own box (v = the slant's depth, t = a stripe's thickness):
  //   bottom: the foot rises to the right; top: the head rises to the right; left / right: that side leans like the tags (top to the right);
  //   par: a parallelogram on the tags' lean; slab: a stripe of thickness t whose edges rise to the right by v.
  AN.pts = (kind, w, h, v, t) => ({bottom: [[0, 0], [w, 0], [w, h - v], [0, h]], top: [[0, v], [w, 0], [w, h], [0, h]], left: [[v, 0], [w, 0], [w, h], [0, h]],
    right: [[0, 0], [w, 0], [w - v, h], [0, h]], par: [[v, 0], [w, 0], [w - v, h], [0, h]], vslab: [[v, 0], [v + t, 0], [t, h], [0, h]], slab: [[0, v], [w, 0], [w, t], [0, v + t]]})[kind] || [[0, 0], [w, 0], [w, h], [0, h]];
  const elPt = el => { const r = el.getBoundingClientRect(); return {w: r.width*.75, h: r.height*.75}; };
  AN.applyShapes = () => document.querySelectorAll('[data-shape]').forEach(el => { const {w, h} = elPt(el), [v, t] = String(el.dataset.sv || '0').split(',').map(Number);
    if(el.dataset.slope){ const yr = v - (+el.dataset.slope)*w; el.style.clipPath = `polygon(0pt ${v.toFixed(2)}pt,${w.toFixed(2)}pt ${yr.toFixed(2)}pt,${w.toFixed(2)}pt ${h.toFixed(2)}pt,0pt ${h.toFixed(2)}pt)`; return; }
    const vv = el.dataset.shape === 'par' && el.dataset.lean ? Math.min(+el.dataset.lean*h, 22) : v;
    el.style.clipPath = 'polygon(' + AN.pts(el.dataset.shape, w, h, vv, t).map(([x, y]) => `${x.toFixed(2)}pt ${y.toFixed(2)}pt`).join(',') + ')'; });
  // a photo in a shaped box: SW.photo's .ph carries the shape (the box itself stays a plain rectangle for the layout passes)
  AN.shaped = (html, kind, v, t, anchor) => html.replace('<div class="ph"', `<div class="ph" data-shape="${kind}" data-sv="${v}${t != null ? ',' + t : ''}"${anchor ? ` data-anchor="${anchor}"` : ''}`);
  AN.photo = (D, id, x, y, w, h, slot, kind, v, anchor) => AN.shaped(FXS.box(D, id, x, y, w, h, slot), kind, v, null, anchor);
  // the accent stripe along a slant: from (x, y) at the left, rising v over w, t thick (it hangs under the line)
  AN.stripe = (x, y, w, v, t, cls) => `<div class="${cls || 'an-stripe'}" data-shape="slab" data-sv="${v},${t}" style="left:${x}pt;top:${y - v}pt;width:${w}pt;height:${v + t}pt"></div>`;
  // the leaning accent tag (P17's sign-in tag): its words upright, its two slanted sides registered for the clearance check
  AN.tag = (t, x, y, slot, o) => { o = o || {}; const fs = o.fs || 10, hh = o.h || 22, track = o.track == null ? 2.2 : o.track, tx = String(t).toUpperCase(), tw = FXS.width(tx, `font-family:Outfit;font-weight:600;font-size:${fs}pt;letter-spacing:${track}pt`), pad = o.pad || 12, w = Math.ceil(tw + 2*pad + 2), d = hh*SK/2;
    const edges = [[x + d, y, x - d, y + hh], [x + w + d, y, x + w - d, y + hh]].map(a => a.map(n => n.toFixed(2)).join(' ')).join(';');
    return {w, h: hh, html: `<div class="an-tag" data-edges="${edges}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hh}pt;padding-left:${pad}pt"><span style="font-size:${fs}pt;letter-spacing:${track}pt;width:${w - pad}pt" data-slot="${slot}" data-lines="1">${esc(tx)}</span></div>`}; };
  // P17's ribbon: a band laid along a slanted cut (below it, gap g), rising to the right, running off the right edge; words parallel to it
  AN.ribbon = (t, x, yCut, ang, hh, slot, o) => { o = o || {}; const g = o.gap == null ? 3 : o.gap, c = Math.cos(ang), s = Math.sin(ang), len = (630 - (x + 9))/c + 30, y = yCut + g/c, pad = o.pad || 20;
    const fs = FXS.fitSize(String(t).toUpperCase(), `font-family:Outfit;font-weight:600;letter-spacing:2.2pt`, (o.room || (590 - x))/c - pad - 4, o.max || 12, 8.5);
    const p = (dx, dy) => [x + dx*c + dy*s, y - dx*s + dy*c], e = [[p(0, 0), p(len, 0)], [p(0, hh), p(len, hh)], [p(0, 0), p(0, hh)]].map(([a, b]) => [a[0], a[1], b[0], b[1]].map(n => n.toFixed(2)).join(' ')).join(';');
    return `<div class="an-rib" data-ribbon="1" data-edges="${e}" style="left:${x}pt;top:${y}pt;width:${len}pt;height:${hh}pt;transform:rotate(${(-ang*180/Math.PI).toFixed(3)}deg);padding-left:${pad}pt"><span style="font-size:${fs}pt;letter-spacing:2.2pt;width:${((o.room || (590 - x))/c - pad).toFixed(1)}pt" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</span></div>`; };
  // a tag laid ON a slanted cut (P17's ribbon, cut short): its foot on the line at (x, yLine), rising at angle ang; its words parallel to it.
  // Registered like the ribbon (data-edges for the clearance check, data-ribbon so its own words are not tested against its own edges).
  AN.rtag = (t, x, yLine, ang, hh, slot, o) => { o = o || {}; const fs = o.fs || 10, pad = o.pad || 14, tx = String(t).toUpperCase(), tw = FXS.width(tx, `font-family:Outfit;font-weight:600;font-size:${fs}pt;letter-spacing:2.2pt`), w = Math.ceil(tw + 2*pad), c = Math.cos(ang), sn = Math.sin(ang);
    const P = (dx, dy) => [x - hh*sn + dx*c + dy*sn, yLine - dx*sn - hh*c + dy*c], cs = [P(0, 0), P(w, 0), P(w, hh), P(0, hh)], e = [0, 1, 2, 3].map(i => [cs[i], cs[(i + 1) % 4]]).map(([a, b]) => [a[0], a[1], b[0], b[1]].map(n => n.toFixed(2)).join(' ')).join(';');
    const L = cs[0];
    return `<div class="an-rib" data-ribbon="1" data-edges="${e}" style="left:${L[0].toFixed(2)}pt;top:${L[1].toFixed(2)}pt;width:${w}pt;height:${hh}pt;transform:rotate(${(-ang*180/Math.PI).toFixed(3)}deg);padding-left:${pad}pt"><span style="font-size:${fs}pt;letter-spacing:2.2pt;width:${w - pad}pt" data-slot="${slot}" data-lines="1">${esc(tx)}</span></div>`; };
  FO.kick = (t, x, y, slot) => `<div class="abs fo-kick" style="left:${x}pt;top:${y}pt" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`;
  // a write-up with P17's accent bar beside it (the bar runs the lines' height; FO.barFit sets it after the fill)
  FO.bar = (x, y, hh, slot) => `<div class="an-bar" data-bar-for="${slot}" style="left:${x}pt;top:${y + 3}pt;height:${Math.max(6, hh - 6)}pt"></div>`;
  FO.barFit = () => document.querySelectorAll('[data-bar-for]').forEach(b => { const el = document.querySelector(`[data-slot="${b.dataset.barFor}"]`); if(!el || !el.textContent.trim()){ b.remove(); return; }
    const n = SW.lines(el).n, lh = parseFloat(el.style.lineHeight) || parseFloat(getComputedStyle(el).lineHeight)*0.75, f = b.offsetParent ? b.offsetParent.getBoundingClientRect().top : 0, top = (el.getBoundingClientRect().top - f)*0.75; b.style.top = (top + lh*0.18) + 'pt'; b.style.height = (n*lh - lh*0.3) + 'pt'; });
  // a title in the condensed caps that may wrap (up to maxLines), at the largest size from max down whose last line runs 80%+ of the measure
  FO.fitTitle = (t, fam, w, max, min, maxLines) => { for(let f = max; f >= min; f -= 0.5){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.78*Math.max(...L))) return {f, n: L.length, w, lw: Math.max(...L), ok: true}; }
    return {f: min, n: FO.wrapLines(t, `${fam};font-size:${min}pt`, w).length, w, lw: w}; };
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/ +/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  const COND = "font-family:'Asap Condensed';font-weight:700;letter-spacing:.4pt;text-transform:uppercase";
  FO.nb1 = t => String(t).replace(/(^|\s)([A-Za-z]) /g, '$1$2\u00a0');
  FO.titleHtml = (t, x, y, w, slot, T) => `<div class="abs fo-title" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${T.n*T.f*1.02}pt;font-size:${T.f}pt;line-height:${T.f*1.02}pt;white-space:normal" data-slot="${slot}" data-lines="${T.n}">${esc(String(t).replace(/\.$/, '').toUpperCase())}</div>`;
  // a photo tile on the tags' lean with its name under it, in the accent caps
  FO.tileP = (D, id, x, y, w, h, slot) => AN.shaped(FXS.box(D, id, x, y, w, h, slot), 'par', 0).replace('data-shape="par"', 'data-shape="par" data-lean="' + (SK*0.5).toFixed(4) + '"') +
    `<div class="abs fo-tile-l" style="left:${x}pt;top:${y + h + 7}pt;width:${w - 12}pt" data-slot="${slot}.label" data-lines="1">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div>`;
  // the standard contact card on the leaning dark foot band: agent on the left, the brokerage panel on the right with the one logo, knockout
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = AN.logoSrc(D); const ko = !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 180, lh = Math.min(46, H - 30), s = {name: 20, nameFloor: 15, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div style="--cc-display:'Asap Condensed';--cc-body:Outfit">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };
  // the foot band (P17's sign-in foot): the brand's dark, its top edge rising to the right, the accent stripe along it; y = its top at the left
  FO.footBand = (y, v) => `<div class="an-band" data-shape="top" data-sv="${v}" style="left:-9pt;top:${y - v}pt;width:630pt;height:${801 - (y - v)}pt"></div>` + AN.stripe(-9, y - 6, 630, v, 6);

  // ---------------- the spread's one slant (the inside spread lines up across the fold: one horizon) ----------------
  // the inside left's kitchen photo is cut on it, its accent stripe runs on across the fold, and the inside right hangs its photos from it
  FO.SL = {yB: 276, v: 52, yB2: 556};   // the slant at the inside left's left trim (y) and its rise over the 630 pt bleed width
  FO.slantY = (page, x) => { const s = FO.SL.v/630; return page === 'left' ? FO.SL.yB - s*(x + 9) : FO.SL.yB - s*(612 + 9) - s*x; };
  FO.slantY2 = (page, x) => FO.slantY(page, x) - FO.SL.yB + FO.SL.yB2;   // the second horizon (the dark band's head), parallel, also across the fold

  // ---------------- FRONT: the fold-over cover (no agent, no brokerage) ----------------
  // A sandwich of two parallel slants: the whole house across the top, its foot cut through the lawn with P17's ribbon carrying the place;
  // the street at poster scale and the facts as big numerals; the write-up beside the accent bar; one room filling the foot of the page
  // edge to edge, its head cut on the same slant with the stripe along it.
  FO.front = (D, o) => { o = o || {}; if(o.flyer) return FO.flyerFront(D, o);
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = F.hero || K.hero || 'front', FW = 612, PX = 9;   // the cover's photos hold 1/8 in off the fold (x = 0 is the fold on the outside spread)
    let FH = 350, v = 0;
    for(const fh of [350, 364, 378]){ const r = AN.maxCut(D, hero, FW, fh, 'bottom', 'top', 8); if(r >= 30){ FH = fh; v = Math.min(60, r); break; } }
    const yB = -9 + FH, ang = Math.atan2(v, FW);
    let h = AN.photo(D, hero, PX, -9, FW, FH, 'front.house', 'bottom', v.toFixed(2), 'top');
    const hood = FXS.hood(L), place = [hood, FXS.placeLine(L)].filter(Boolean).join('  ·  ');
    let t = v ? AN.ribbon(place, 250, yB - v*(250 - PX)/FW, ang, 30, 'front.place', {max: 11.5}) : AN.tag(place, X0, yB + 12, 'front.place').html;
    const ad = String(L.address || ''), ya = yB + (v ? 14 : 42), as = FXS.fitSize(ad.toUpperCase(), COND, CW + 4, 66, 34);
    t += `<div class="abs fo-addr an-street" data-slot="address" data-lines="1" style="left:${X0 - 2}pt;top:${ya}pt;width:${CW + 6}pt;height:${as*1.06}pt;font-size:${as}pt;line-height:${as*1.06}pt">${esc(ad)}</div>`;
    const fy = ya + as*1.06 + 4; t += FO.factsRow(L, X0, fy, CW, 26);
    // the room at the foot: its head on the hero's slant (rising to the right), the stripe along it, its name on the field above its low end
    const band = FO.coverRoom(D), s = v ? v/FW : 52/630, n = o.lines || 3, lh = 18.5, wy = fy + 30 + 16, wb = wy + n*lh;
    const yL = Math.ceil(wb + 10 + s*(X1 - PX)), bv = s*FW;   // the band's head clears the write-up's last line at its right end
    t += FO.bar(X0, wy, n*lh, 'front.summary');
    t += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${n}" data-try="${n}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0 + 16}pt;top:${wy}pt;width:${CW - 16}pt;height:${n*lh}pt;font-size:12.25pt;line-height:${lh}pt"></div>`);
    if(band){ h += AN.photo(D, band, PX, yL - bv, FW, 801 - (yL - bv), 'front.room', 'top', bv.toFixed(2)) + AN.stripe(PX, yL - 7, FW, bv, 7);
      // the room's name on a tag laid on the cut: its foot on the stripe, leaning with it (P17's ribbon, short)
      t += AN.rtag(FO.lead(D, band).split(/ and |, /)[0], X0, yL - 7 - s*(X0 - PX), Math.atan2(bv, FW), 22, 'front.room.label', {fs: 9.5}); }
    return h + t;
  };
  // the cover's room: the strip's best room that no other panel of the fold-over shows (and not the kitchen, which leads the inside)
  FO.coverRoom = D => { const P = (D.sw || {}).plan || {}; if(P.coverRoom && (D.photos || {})[P.coverRoom]) return P.coverRoom; const used = new Set([].concat(P.left || [], P.right || [], D.plan ? [] : [(P.back || [])[0] || (P.backNoplan || [])[0]], P.backRow || ['bath2'], [FO.kitchenId(D)]).filter(Boolean));
    const usedSp = new Set([...used].map(id => SW.space(D, id))); const c = (P.strip || []).filter(id => !used.has(id) && !usedSp.has(SW.space(D, id)) && (D.photos || {})[id]);
    return c.find(id => !/yard|patio|deck|terrace|balcony|gazebo/.test(id)) || c[0] || null; };
  FO.kitchenId = D => { const P = (D.sw || {}).plan || {}; return (P.strip || []).find(id => /^kitchen/.test(id)) || Object.keys(D.photos || {}).find(id => /^kitchen/.test(id)); };
  // the facts as big condensed numerals, accent caps words, leaning hairlines between
  FO.factsRow = (L, x, y, w, nf0) => { const items = FXS.statItems(L).map(q => FXS.statParts(q)).map(p => ({n: p.n, l: String(p.l).replace(/^Bedrooms?$/i, L.beds == 1 ? 'Bed' : 'Beds')})), lf = 9, gap = 26;
    const wOf = (p, nf) => FXS.width(p.n, `font-family:'Asap Condensed';font-weight:700;font-size:${nf}pt`) + 6 + FXS.width(p.l.toUpperCase(), `font-family:Outfit;font-weight:600;font-size:${lf}pt;letter-spacing:1.8pt`) + 2;
    let nf = nf0; while(nf > 16 && items.reduce((a, p) => a + wOf(p, nf), 0) + gap*(items.length - 1) > w) nf -= 0.5;
    let xx = x, t = ''; items.forEach((p, i) => { const ww = wOf(p, nf);
      t += `<div class="abs fo-fact" style="left:${xx}pt;top:${y}pt;width:${ww + 2}pt;height:30pt;white-space:nowrap;display:flex;align-items:baseline" data-slot="front.fact${i}" data-lines="1"><span class="fo-fn" style="font-size:${nf}pt;line-height:30pt">${esc(p.n)}</span><span class="fo-fl" style="font-size:${lf}pt;margin-left:6pt">${esc(p.l.toUpperCase())}</span></div>`;
      xx += ww + gap; if(i < items.length - 1) t += `<div class="abs" style="left:${xx - gap/2}pt;top:${y + 4}pt;width:1.2pt;height:24pt;background:var(--an-accent);transform:skewX(-14deg)"></div>`; });
    return t; };
  // after the fill: the cover's write-up keeps its place (the room band was cut to clear it); nothing moves
  FO.frontSnug = () => {};

  // ---------------- FLYER FRONT: a different piece from the cover ----------------
  // The house as large as it stands whole, its foot on the slant with the stripe; under it two columns: the place on its tag and the street
  // stacked at poster scale (number over name) | the facts stacked as big numerals beside a leaning accent rule (P17's second version); the
  // write-up across the foot. No room photos (the back carries them), no agent, no brokerage.
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, intro = F.intro || K.summary || [], hero = F.hero || K.hero || 'front', FW = 630;
    // A big photo wedge: the house across the top, its foot cut on a steep slant (the tags' 14 deg where the house allows it), the accent stripe
    // along the cut; the street laid DOWN the slant in poster-scale condensed type with the place under it; under the wedge the facts stacked as
    // big numerals beside a leaning accent rule on the right, the write-up on the left. A different piece from the cover (no room band, no ribbon).
    const ad = String(L.address || ''), hood = FXS.hood(L), place = [hood, FXS.placeLine(L)].filter(Boolean).join('  ·  ');
    const items = FXS.statItems(L).map(q => FXS.statParts(q)).map(p => ({n: p.n, l: String(p.l).replace(/^Bedrooms?$/i, L.beds == 1 ? 'Bed' : 'Beds')})), rh = 31, RX = 388;
    let best = null;
    for(let FH = 640; FH >= 470 && !best; FH -= 10){ if(!SW.fits(D, hero, FW, FH)) continue; const r = AN.maxCut(D, hero, FW, FH, 'bottom', 'top', 8); if(r < 70) continue;
      const v = Math.min(157, r), yB = -9 + FH, ang = Math.atan2(v, FW), cut = x => yB - v*(x + 9)/FW, c = Math.cos(ang);
      const as = FXS.fitSize(ad.toUpperCase(), COND, (X1 - X0 - 20)/c, 76, 40), ah = as*1.04, bandH = 9 + 12 + ah + 4 + 14;
      const wTop = cut(X0) + bandH + 18, n = Math.min(6, Math.floor((768 - wTop)/18)), sTop = cut(RX) + bandH + 16;
      if(n >= 3 && sTop + items.length*rh <= 768) best = {FH, v, yB, ang, cut, as, ah, bandH, wTop, n, sTop}; }
    if(!best){ const FH = 470, v = Math.max(0, Math.min(157, AN.maxCut(D, hero, FW, FH, 'bottom', 'top', 8))), yB = -9 + FH, ang = Math.atan2(v, FW), cut = x => yB - v*(x + 9)/FW, as = 44, ah = as*1.04, bandH = 9 + 12 + ah + 18;
      best = {FH, v, yB, ang, cut, as, ah, bandH, wTop: cut(X0) + bandH + 18, n: 3, sTop: cut(RX) + bandH + 16}; }
    const {FH, v, yB, ang, cut, as, ah, bandH, wTop, n, sTop} = best, c = Math.cos(ang), sn = Math.sin(ang);
    let h = AN.photo(D, hero, -9, -9, FW, FH, 'front.house', 'bottom', v.toFixed(2), 'top') + AN.stripe(-9, yB, FW, v, 9);
    // the street down the slant: its top-left 12 pt under the stripe at X0, turned to the cut's angle (registered as a ribbon for the checks)
    const rot = (x, y, w, hh, html, slot, css) => `<div class="abs" data-ribbon="1" style="left:${x.toFixed(2)}pt;top:${y.toFixed(2)}pt;width:${w.toFixed(1)}pt;height:${hh.toFixed(2)}pt;transform-origin:0 0;transform:rotate(${(-ang*180/Math.PI).toFixed(3)}deg)"><span style="display:block;width:${w.toFixed(1)}pt;${css}" data-slot="${slot}" data-lines="1">${html}</span></div>`;
    const ax = X0 - 2, ay = cut(X0) + 9 + 12;
    h += rot(ax, ay, (X1 - X0 + 4)/c, ah, esc(ad), 'address', `font:700 ${as}pt/${ah}pt var(--an-cond);color:var(--an-on);white-space:nowrap;letter-spacing:.4pt`);
    const py = ay + (ah + 4)*c, px = X0 + (ah + 4)*sn;
    h += rot(px, py, (X1 - px)/c, 14, esc(place), 'front.place', `font:600 10pt/14pt var(--an-font);letter-spacing:2.2pt;text-transform:uppercase;color:var(--an-accent);white-space:nowrap`);
    // the facts stacked on the right, numerals right-aligned against a leaning accent rule (P17's second version)
    const fh = items.length*rh, fy = sTop + Math.max(0, (768 - sTop - fh)/2);
    h += `<div class="abs" style="left:${RX}pt;top:${fy + 2}pt;width:1.6pt;height:${fh - 4}pt;background:var(--an-accent);transform:skewX(-14deg)"></div>`;
    items.forEach((p, i) => { h += `<div class="abs fo-fact" style="left:${RX + 16}pt;top:${fy + i*rh}pt;width:${X1 - RX - 16}pt;height:${rh}pt;white-space:nowrap;display:flex;align-items:baseline" data-slot="front.fact${i}" data-lines="1"><span class="fo-fn" style="font-size:28pt;line-height:${rh}pt;min-width:66pt;text-align:right">${esc(p.n)}</span><span class="fo-fl" style="font-size:9.5pt;margin-left:9pt">${esc(p.l.toUpperCase())}</span></div>`; });
    // the write-up on the left, its foot on the facts' foot
    const lh = 18, wy = wTop + Math.max(0, (768 - wTop - n*lh)/2), ww = RX - 26 - (X0 + 16);
    h += FO.bar(X0, wy, n*lh, 'front.summary') + FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${n}" data-try="${n},${n - 1}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0 + 16}pt;top:${wy}pt;width:${ww}pt;height:${n*lh}pt;font-size:12pt;line-height:${lh}pt"></div>`);
    return h; };

  // ---------------- INSIDE LEFT: the kitchen ----------------
  // The kitchen big, edge to edge across the top (stopping 0.25 in short of the fold), its foot cut on the spread's slant; the accent stripe
  // runs on across the fold. Under it the kitchen's card: its tag and heading in tall condensed caps, then its items in two columns, each a
  // leaning accent mark, the label and one full line, on the brand's dark panel. Two captioned rooms of the same level close the page.
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, kid = FO.kitchenId(D), cs = FO.cards(D, P.left || []).filter(c => c.photo !== kid && SW.space(D, c.photo) !== SW.space(D, kid));
    const yB = FO.SL.yB, v = FO.SL.v, s = v/630, PWk = 603;   // the photo stops at x = 594 (0.25 in short of the fold)
    let h = AN.photo(D, kid, -9, -9, PWk, yB + 9, 'left.kitchen', 'bottom', (v*PWk/630).toFixed(2)) + AN.stripe(-9, yB, 630, v, 7);
    const tg = AN.tag(box.kicker || 'The kitchen', X0 + 3, yB + 22, 'left.kicker', {h: 24}); h += tg.html;
    const tt = FO.nb1(String(box.heading || I.title || '').replace(/\.$/, '').toUpperCase()), tx = X0 + tg.w + 20, TT = FO.fitTitle(tt, COND, X1 - tx, 34, 20, 1), ty = yB + 22 + 12 - TT.f*0.53;
    h += FO.titleHtml(tt, tx, ty, X1 - tx, 'left.title', TT);
    // the kitchen photo's own caption, three full lines at the full measure under the heading
    const kc = FXS.augment(D, FXS.cardFor(D, kid) || {photo: kid, lead: 'Kitchen.', s: []}), cy = yB + 60, klh = 16;
    h += `<div class="abs cap">` + (`<div class="a" data-capfit="${3*klh}" style="position:absolute;left:${X0}pt;top:${cy}pt;width:${CW}pt;height:${3*klh}pt;font-size:10.5pt;line-height:14pt" data-slot="left.kitchen" data-room="Kitchen" data-lh="14" data-lines="3" data-min="3" data-narrow="0" ${FXS.sd(kc.s)}></div>`) + `</div>`;
    // the card: two columns of items on the field, a leaning accent mark, the label and one full line each, hairlines between the rows
    const items0 = (box.items || []).slice(0, 6), CWc = (CW - 24)/2, tcss = 'font-family:Outfit;font-weight:400;font-size:10.25pt';
    const oneLine = it => { const S = (it.s || []).map(x => [].concat(x)).filter(a => a.length); let best = '';
      const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(t && t.length > best.length && FXS.width(t, tcss) <= CWc - 14 && !SW.sameFactIn(t)) best = t; return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
      walk(0, []); return best; };
    const lines1 = items0.map(oneLine), items = items0.filter((_, i) => lines1[i]), itemText = lines1.filter(Boolean), rows = Math.ceil(items.length/2), RH = 34;
    const BY = cy + 3*klh + 10;
    items.forEach((it, i) => { const c = i % 2, r = Math.floor(i/2), x = X0 + c*(CWc + 24), y = BY + r*RH;
      if(r < rows - 1) h += `<div class="abs hr" style="left:${x}pt;top:${y + RH - 4}pt;width:${CWc}pt"></div>`;
      h += `<div class="abs" style="left:${x}pt;top:${y + 2}pt;width:4pt;height:10pt;background:var(--an-tag);transform:skewX(-14deg)"></div>`;
      h += `<div class="abs fo-li-l" style="left:${x + 12}pt;top:${y}pt;width:${CWc - 12}pt;color:var(--an-accent)" data-slot="left.list.l${i}" data-lines="1">${esc(it.l)}</div>`;
      h += `<div class="abs" style="left:${x + 12}pt;top:${y + 13}pt;width:${CWc - 12}pt;height:16pt;font:400 10.25pt/16pt var(--an-font);color:var(--fx-on);white-space:nowrap;overflow:hidden" data-slot="left.list.t${i}" data-lines="1">${esc(itemText[i])}</div>`; });
    // the spread's second horizon: the brand's dark band, its head on the slant with the stripe along it, crossing the fold to the right page
    const y2 = x => FO.slantY2('left', x), ytop = x => y2(x) + 14;
    h += `<div class="an-band" data-shape="top" data-sv="${v}" style="left:-9pt;top:${y2(621)}pt;width:630pt;height:${801 - y2(621)}pt"></div>` + AN.stripe(-9, y2(-9) - 6, 630, v, 6);
    let t = '';
    if(cs.length >= 2){ const W2 = (CW - 16)/2, clh = 14, bot = 766 - 25 - 3*clh;
      cs.slice(0, 2).forEach((c, i) => { const x = X0 + i*(W2 + 16), top = ytop(x + W2); t += FO.slantTop(FXS.captioned(D, c, x, top, W2, bot - top, 3, 'left.photo' + i, {fs: 10.75, lh: clh, min: 3}), s, W2); }); }
    else if(cs.length){ const pw = 318, top = ytop(X0 + pw), ph = 766 - top; t += FO.slantTop(FXS.box(D, cs[0].photo, X0, top, pw, ph, 'left.photo0'), s, pw);
      const c = FXS.augment(D, cs[0]), cx = X0 + pw + 18, cw2 = X1 - cx, L0 = FXS.leadLabel(c.lead), ly = ytop(cx) + 2, n = Math.max(3, Math.floor((766 - ly - 22)/15));
      t += `<div class="abs" style="left:${cx}pt;top:${ly}pt;width:${cw2}pt;white-space:nowrap"><div class="lbl" data-slot="left.photo0.label" data-lines="1" style="max-width:${cw2}pt">${esc(L0.name.toUpperCase())}</div></div>`;
      t += `<div class="abs cap side" data-top="1" data-ph-top="${ly}" data-ph-h="${766 - ly}"><div class="a" style="position:absolute;left:${cx}pt;top:${ly + 20}pt;width:${cw2}pt;height:${n*15}pt;font-size:11pt;line-height:15pt" data-slot="left.photo0" data-room="${esc(L0.name)}" data-lh="15" data-lines="${n}" data-min="3" data-narrow="0" ${FXS.sd(c.s)}></div></div>`; }
    h += `<div class="an-deepc">${t}</div>`;
    return h;
  };
  // a photo box whose top is cut on the spread's slant (its right end the higher, s = rise per pt); the box itself stays a rectangle
  FO.slantTop = (html, s, w) => html.replace('<div class="ph"', `<div class="ph" data-shape="top" data-sv="${(s*w).toFixed(2)}" data-slope="${s.toFixed(5)}"`);
  // after the fill: a caption standing beside its photo takes the largest type (up to 15 pt) at which its true sentences fill at least 55% of the
  // photo's height in full lines (every line 80%+, the last 90%+): the column beside the photo reads as the room's story, never a dead strip
  FO.sideGrow = () => document.querySelectorAll('.cap.side .a[data-s]').forEach(el => { if(!SW.pfN || !el.textContent.trim()) return;
    const H = +el.closest('.cap.side').dataset.phH - 22, fs0 = parseFloat(getComputedStyle(el).fontSize)*0.75, keep = [el.innerHTML, el.style.fontSize, el.style.lineHeight, el.style.height]; let best = null;
    const mx = +(el.closest('.cap.side').dataset.maxfs || 15); for(let fs = Math.min(mx, fs0 + (mx - 11)); fs >= fs0 - 1e-6 && !best; fs -= 0.25){ const lh = fs*1.38, T = Math.floor(H/lh); el.style.fontSize = fs + 'pt'; el.style.lineHeight = lh + 'pt'; el.style.height = 'auto';
      for(let t = T; t >= 3 && t*lh >= 0.55*H; t--){ const b = SW.pfN(el, t); if(!b) continue; el.innerHTML = b.pick.map(x => SW.esc(x)).join(' '); const L = SW.lines(el); if(L.n === t && L.fill >= 0.9 && L.min >= 0.8){ best = {fs, lh, t, pick: b.pick}; break; } } }
    if(!best){ [el.innerHTML, el.style.fontSize, el.style.lineHeight, el.style.height] = keep; return; }
    el.style.fontSize = best.fs + 'pt'; el.style.lineHeight = best.lh + 'pt'; el.style.height = (best.t*best.lh) + 'pt'; el.dataset.lines = best.t; el.dataset.lh = best.lh; SW.noteGrams(el, best.pick.join(' ')); el.style.textAlign = 'left'; });
  FO.leftHead = () => {};
  // a full-measure caption under a full-bleed photo: three full lines at the largest type (12 pt down to 10.5) its true sentences fill, then justified
  FO.capFit = () => document.querySelectorAll('[data-capfit]').forEach(el => { const H = +el.dataset.capfit; FO.growCol(el, H, 12); const L = SW.lines(el), lh = parseFloat(el.style.lineHeight);
    el.style.top = (parseFloat(el.style.top) + Math.max(0, (H - L.n*lh)/2)) + 'pt'; if(L.n >= 2) el.style.textAlign = 'justify'; });
  // a ragged column of whole sentences that sets fewer lines than its height takes the largest type (to maxFs) at which its true sentences fill 85%+ of it
  FO.growCol = (el, H, maxFs) => { if(!SW.pfN || !el || !el.textContent.trim()) return; const fs0 = parseFloat(getComputedStyle(el).fontSize)*0.75, keep = [el.innerHTML, el.style.fontSize, el.style.lineHeight, el.style.height]; let best = null;
    for(let fs = maxFs; fs >= fs0 - 1e-6 && !best; fs -= 0.25){ const lh = fs*1.36, T = Math.floor(H/lh); el.style.fontSize = fs + 'pt'; el.style.lineHeight = lh + 'pt'; el.style.height = 'auto';
      for(let t = T; t >= 3 && t*lh >= 0.85*H; t--){ const b = SW.pfN(el, t); if(!b) continue; el.innerHTML = b.pick.map(x => SW.esc(x)).join(' '); const L = SW.lines(el); if(L.n === t && L.fill >= 0.9 && L.min >= 0.8){ best = {fs, lh, t, pick: b.pick}; break; } } }
    if(!best){ [el.innerHTML, el.style.fontSize, el.style.lineHeight, el.style.height] = keep; return; }
    el.style.fontSize = best.fs + 'pt'; el.style.lineHeight = best.lh + 'pt'; el.style.height = (best.t*best.lh) + 'pt'; el.dataset.lines = best.t; SW.noteGrams(el, best.pick.join(' ')); };

  // ---------------- INSIDE RIGHT: bedrooms and baths ----------------
  // The spread's slant comes across the fold as the accent stripe and divides the page: above it the kicker's tag and the title at display
  // size; below it the best bedroom wide, its head on the slant, its story standing beside it; three rooms in one locked row at the foot.
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs = FO.cards(D, P.right || []), v = FO.SL.v, s = v/630, st = 7, yAt = x => FO.slantY('right', x);
    let h = AN.tag(R.kicker || '', X0 + 3, 36, 'right.kicker').html;
    const tt = FO.nb1(String(R.title || '').replace(/\.$/, '').toUpperCase()), ty = 68;
    let TT = null; for(let f = 50; f >= 22 && !TT; f -= 1){ for(const nl of [2, 1]){ for(const k of [0.55, 0.62, 0.7, 0.8, 0.9, 1]){ const T = FO.fitTitle(tt, COND, CW*k, f, f, nl); if(!T.ok || T.n !== nl) continue; if(ty + T.n*T.f*1.02 + 12 <= yAt(X0 + T.lw)){ TT = T; break; } } if(TT) break; } }
    if(!TT) TT = FO.fitTitle(tt, COND, CW, 22, 18, 2);
    h += FO.titleHtml(tt, X0, ty, Math.min(CW, Math.ceil(TT.lw) + 3), 'right.title', TT);
    h += AN.stripe(-9, yAt(-9), 630, v, st);
    const [c0, ...rest] = cs, row = rest.slice(0, 3), n = row.length, gapR = 14, W = (CW - (n - 1)*gapR)/n, L1 = 3, clh1 = 13.5;
    // the second horizon: the dark band from the left page comes across the fold, its head on the slant with the stripe; the row of rooms hangs from it
    const y2 = x => FO.slantY2('right', x), CS = 156, PW = CW - 18 - CS, vp = s*PW;
    const Yl = yAt(X0) + st, P0 = Math.floor(y2(X0 + PW) - 10 - Yl);
    h += `<div class="an-band" data-shape="top" data-sv="${v}" style="left:-9pt;top:${y2(621)}pt;width:630pt;height:${801 - y2(621)}pt"></div>` + AN.stripe(-9, y2(-9) - 6, 630, v, 6);
    h += AN.photo(D, c0.photo, X0, Yl - vp, PW, P0 + vp, 'right.photo0', 'top', vp.toFixed(2)).replace('data-shape="top"', `data-shape="top" data-slope="${s.toFixed(5)}"`);
    { const c = FXS.augment(D, c0), cx = X0 + PW + 18, L0 = FXS.leadLabel(c.lead), lh = 14.5, top = yAt(cx + CS) + st + 10, bot = y2(X1) - 12, nl = Math.max(3, Math.floor((bot - Yl - 20)/lh));
      h += `<div class="abs" style="left:${cx}pt;top:${Yl}pt;width:${CS}pt;white-space:nowrap"><div class="lbl" data-slot="right.photo0.label" data-lines="1" style="max-width:${CS}pt">${esc(L0.name.toUpperCase())}</div></div>`;
      h += `<div class="abs cap side" data-ph-top="${Math.max(top, Yl - vp + 6)}" data-ph-h="${bot - Math.max(top, Yl - vp + 6)}"><div class="a" style="position:absolute;left:${cx}pt;top:${Yl + 20}pt;width:${CS}pt;height:${nl*lh}pt;font-size:10.75pt;line-height:${lh}pt" data-slot="right.photo0" data-room="${esc(L0.name)}" data-lh="${lh}" data-lines="${nl}" data-min="3" data-narrow="0" ${FXS.sd(c.s)}></div></div>`; }
    let t = ''; const bot1 = 766 - 25 - L1*clh1;
    row.forEach((c, i) => { const x = X0 + i*(W + gapR), top = y2(x + W) + 14; t += FO.slantTop(FXS.captioned(D, c, x, top, W, bot1 - top, L1, 'right.photo' + (i + 1), {fs: 10, lh: clh1, min: 3}), s, W); });
    h += `<div class="an-deepc">${t}</div>`;
    return h;
  };
  FO.rightFit = () => {};
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- BACK (fold-over) and flyer back ----------------
  // the plan in its box (the design's own background; the plan prints clear with light lines, PlanInk): as wide as the drawing needs
  FO.planBox = (D, x, y, maxH, maxW) => { const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: D.plan.turn ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: !!D.plan.turn, angle: D.plan.turn && D.plan.kind === 'color' ? 270 : undefined}), cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 44, D.plan.minCard || 0, 150)); return FXS.planCard(D, x, y, cw, maxH); };
  // Nearby: each distance on a leaning accent tab (P17's numeral tab), the place in caps beside it, a hairline under each row
  const nearTabs = (D, x, y, w, o) => { o = o || {}; const N = ((D.sw || {}).back || {}).nearby || [], top = o.top == null ? 22 : o.top, rh = o.rowH || 30, ds = o.d || 15, ps = o.p || 8.5;
    return N.slice(0, 3).map((n, i) => `<div class="fo-near" style="left:${x}pt;top:${y + top + i*rh}pt;width:${w}pt;height:${rh - 0.5}pt" data-slot="back.near${i}" data-lines="1" data-fine="1"><div class="in"><span class="d an-ntab" style="font-size:${ds}pt"><span>${esc(n.dist)}</span></span><span class="p" style="font-size:${ps}pt">${esc(n.place)}</span></div></div>`).join('') + FO.kick('Nearby', x, y, 'back.near.kicker'); };
  FO.CARD_H = 62; FO.CARD_Y = 692;
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:759pt;width:${CW}pt;height:8pt;color:var(--an-on-deep);opacity:.75" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  const listsOf = (D, used) => { const K = D.sw || {}, KB = K.back || {}, BX = KB.boxes || {}, SF = FXS.sellingFacts(D);
    return {c1: ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2: ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1: (BX.inside && BX.inside.title) || 'New and updated'}; };
  const keepFor = (c1, c2, used) => { const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    return list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; }; };
  const floorsOf = D => { const FB = ((D.companion || {}).flyer || {}).back || {}, floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2; return [].concat(...floors.filter(isTop).map(f => f.s)).concat([].concat(...floors.filter(f => !isTop(f)).map(f => f.s))); };

  // FOLD-OVER BACK: the listing's own plan first, centered at its own width under its tag (no plan: the outdoor room wide with its story
  // beside it); under it the write-up beside the accent bar and Nearby on its leaning tabs side by side; then the set's one big move on the
  // outside spread, the dark band leaning up from the foot with the stripe along its edge, carrying a captioned outdoor room, the two lists
  // stacked beside it, the agent's card (the one logo of the outside spread) and the fine print.
  FO.backOut = D => { const P = (D.sw || {}).plan || {}, out = /yard|patio|deck|terrace|balcony|pergola|evening/; return P.backOut || [].concat(P.backNoplan || [], P.back || [], P.strip || []).find(id => out.test(id) && (D.photos || {})[id]) || (P.backNoplan || [])[0]; };
  // FOLD-OVER BACK (the design pass): the outdoor room across the top edge to edge, its foot cut on the slant with the stripe and its name on a tag
  // hung from the cut, its caption at the full measure; then the listing's own plan, boxed to its own shape and as large as the zone allows, with
  // the write-up standing beside it (no plan: a second room, captioned, beside the write-up); then the dark band leaning up from the foot
  // carrying three columns (new and updated | outside | Nearby on leaning distance tabs), the agent's card and the fine print.
  FO.back = (D, o) => { o = o || {}; if(o.flyer) return FO.flyerBack(D, o);
    const K = D.sw || {}, hasPlan = !!D.plan, P = K.plan || {}, issues = [], oid = FO.backOut(D), FW = 612, v = 39, s = v/FW, Hf = 214, yF = x => Hf - s*(x + 9);   // 1/8 in short of the fold (x = 612)
    let h = AN.photo(D, oid, -9, -9, FW, Hf + 9, 'back.out', 'bottom', v.toFixed(2)) + AN.stripe(-9, Hf, FW, v, 7);
    const oc = FXS.augment(D, FXS.cardFor(D, oid) || {photo: oid, lead: FXS.labelFor(oid), s: []}), ang = Math.atan2(v, FW), th = 22, sb = x => yF(x) + 7;
    h += AN.rtag(FXS.leadLabel(oc.lead).name, X0 + th*Math.sin(ang), sb(X0) + th*Math.cos(ang), ang, th, 'back.out.label', {fs: 9.5});
    const cy = sb(X0) + th + 9, clh = 16;
    h += `<div class="abs cap">` + (`<div class="a" data-capfit="${3*clh}" style="position:absolute;left:${X0}pt;top:${cy}pt;width:${CW}pt;height:${3*clh}pt;font-size:10.5pt;line-height:14pt" data-slot="back.out" data-room="${esc(FXS.leadLabel(oc.lead).name)}" data-lh="14" data-lines="3" data-min="3" data-narrow="0" ${FXS.sd(oc.s)}></div>`) + `</div>`;
    const {c1, c2, t1} = listsOf(D);
    // the band first (its height sets the zone above it): three columns, rows 19 pt
    const CARDY = FO.CARD_Y, nb = Math.max(3, Math.min(5, Math.max(c1.length, c2.length))), RHb = 19, by = CARDY - 16 - (18 + nb*RHb) - 22, V = 16;
    const z0 = cy + 3*clh + 16, z1 = by - V - 14, ZH = z1 - z0;
    let used = [];
    if(hasPlan){ const pc0 = FO.planBox(D, 0, 0, ZH, CW - 226), pw0 = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc0.html)[1])), ph0 = pc0.bottom, pc = FO.planBox(D, X0, z0 + Math.max(0, (ZH - ph0)/2), ZH, CW - 226);
      h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues;
      const ax = X0 + pw0 + 20 + 16, aw = X1 - ax, nl = Math.max(3, Math.floor(ZH/16.5)), lh = +(ZH/nl).toFixed(3);
      used = [oc];
      h += FO.bar(ax - 16, z0, nl*lh, 'back.about') + (aw >= 300 ? FO.full : (x => x.replace('data-slot=', 'data-ragged="1" data-slot=')))(FO.wu(keepFor(c1, c2, used)(floorsOf(D)), ax, z0, aw, nl*lh + 0.01, 'back.about', 11, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-span="${ZH.toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`); }
    else { const sid = P.backSecond || ((P.backNoplan || [])[1]), c = FXS.augment(D, FXS.cardFor(D, sid) || {photo: sid, lead: FXS.labelFor(sid), s: []}), pw = 262, plh = 13.5, ph = ZH - 25 - 3*plh;
      h += FXS.captioned(D, c, X0, z0, pw, ph, 3, 'back.photo1', {fs: 10.25, lh: plh, min: 3});
      used = [oc, c];
      const ax = X0 + pw + 20 + 16, aw = X1 - ax, nl = Math.max(3, Math.floor(ZH/16.5)), lh = +(ZH/nl).toFixed(3);
      h += FO.bar(ax - 16, z0, nl*lh, 'back.about') + FO.wu(keepFor(c1, c2, used)(floorsOf(D)), ax, z0, aw, nl*lh + 0.01, 'back.about', 11, lh, 'body').replace('data-slot="back.about"', `data-slot="back.about" data-ragged="1" data-span="${ZH.toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`); }
    h += FO.footBand(by, V);
    const ty = by + 14, ly = ty + 18, W3 = [156, 146], X3 = [X0, X0 + 156 + 16, X0 + 156 + 16 + 146 + 16], fs = 10.25;
    let t = FO.kick(t1, X3[0], ty, 'back.updates.title') + FXS.bullets(c1, X3[0], ly, W3[0], RHb, 'back.updates', nb, fs).html;
    t += FO.kick('Outside', X3[1], ty, 'back.outside.title') + FXS.bullets(c2, X3[1], ly, W3[1], RHb, 'back.outside', nb, fs).html;
    t += nearTabs(D, X3[2], ty, X1 - X3[2], {top: ly - ty, rowH: Math.max(24, nb*RHb/3), d: 13.5, p: 8.5});
    h += `<div class="an-deepc">${t}</div>` + FO.contact(D, X0, CARDY, CW, FO.CARD_H) + FO.fine(D);
    return {html: h, issues};
  };

  // FLYER BACK: three captioned rooms first, across the top; then the listing's own plan beside "The house" (no plan: the write-up at full
  // measure); then the dark band leaning up from the foot with the lists and Nearby in three columns, the card and the fine print.
  FO.flyerBack = (D, o) => { const K = D.sw || {}, KB = K.back || {}, hasPlan = !!D.plan, P = K.plan || {}, issues = [];
    const rowIds = (P.flyerBack || []).slice(0, 3), rowCards = FO.cards(D, rowIds), n = rowCards.length, gap = 12, tw = (CW - (n - 1)*gap)/n, TOP = 30, PH = hasPlan && (D.plan.levels || []).length >= 4 ? 118 : 150;
    let h = '';
    rowCards.forEach((c, i) => { h += FXS.captioned(D, c, X0 + i*(tw + gap), TOP, tw, PH, 3, 'back.photo' + i, {fs: 10.25, lh: 13.5, min: 3}); });
    let top = TOP + PH + 25 + 3*13.5 + 6;
    const {c1, c2, t1} = listsOf(D), keep = keepFor(c1, c2, rowCards);
    const nb = Math.max(Math.min(c1.length, 5), Math.min(c2.length, 5), 3), listH = 20 + 18 + nb*19 + 8, by = FO.CARD_Y - 16 - listH - 22, zb = by - 30;
    const wide = hasPlan && (D.plan.levels || []).length >= 4;
    const FBk = ((D.companion || {}).flyer || {}).back || {};

    if(wide){ const pc = FXS.planCard(D, X0, top, CW, 136); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues;
      const ty0 = pc.bottom + 14, span = zb - ty0, nl = Math.max(2, Math.floor(span/17)), lh = +(span/nl).toFixed(3);
      h += FO.bar(X0, ty0, nl*lh, 'back.about') + FO.full(FO.wu(keep(floorsOf(D)), X0 + 16, ty0, CW - 16, nl*lh + 0.01, 'back.about', 11.25, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-span="${span.toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`); }
    else if(hasPlan){ const TH = zb - top - 36, pc0 = FO.planBox(D, 0, 0, TH, 330), pw0 = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc0.html)[1])), ph0 = pc0.bottom, pc = FO.planBox(D, X1 - pw0, top, TH, 330);
      h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues;
      { const hw = X1 - pw0 - 20 - X0, ht = String(FBk.heading || 'About this home').replace(/\.$/, ''), hs = FXS.fitSize(ht.toUpperCase(), "font-family:'Asap Condensed';font-weight:700;letter-spacing:.4pt", hw, 17, 12);
        h += `<div class="abs fo-sub" style="left:${X0}pt;top:${top}pt;width:${hw}pt;font-size:${hs}pt;line-height:20pt" data-slot="back.about.title" data-lines="1">${esc(ht)}</div>`; }
      const ax = X0 + 16, aw = X1 - pw0 - 20 - ax, span = zb - top - 30, nl = Math.max(3, Math.floor(span/16)), lh = +(span/nl).toFixed(3);
      h += FO.bar(X0, top + 30, nl*lh, 'back.about') + (aw >= 300 ? FO.full : (x => x.replace('data-slot=', 'data-ragged="1" data-slot=')))(FO.wu(keep(floorsOf(D)), ax, top + 30, aw, nl*lh + 0.01, 'back.about', 11, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-span="${span.toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
    } else { const tid = (P.backNoplan || [])[0], c = FXS.augment(D, FXS.cardFor(D, tid)), y = top + 6, ph = zb - y, pw = 330, cx = X0 + pw + 18, cw2 = X1 - cx, L0 = FXS.leadLabel(c.lead), nl = Math.max(3, Math.floor((ph - 22)/15));
      h += FXS.box(D, tid, X0, y, pw, ph, 'back.top');
      h += `<div class="abs" style="left:${cx}pt;top:${y}pt;width:${cw2}pt;white-space:nowrap"><div class="lbl" data-slot="back.top.label" data-lines="1" style="max-width:${cw2}pt">${esc(L0.name.toUpperCase())}</div></div>`;
      h += `<div class="abs cap side" data-top="1" data-bottom="1" data-maxfs="19.5" data-ph-top="${y}" data-ph-h="${ph}"><div class="a" style="position:absolute;left:${cx}pt;top:${y + 20}pt;width:${cw2}pt;height:${nl*15}pt;font-size:11pt;line-height:15pt" data-slot="back.top" data-room="${esc(L0.name)}" data-lh="15" data-lines="${nl}" data-min="3" data-narrow="0" ${FXS.sd(c.s)}></div></div>`; }
    h += FO.footBand(by, 16);
    const ty = by + 18, ly = ty + 18, W = [156, 150], X = [X0, X0 + 156 + 16, X0 + 156 + 16 + 150 + 18], fs = 10.25, cap = Math.max(3, Math.min(5, Math.floor((FO.CARD_Y - 16 - ly)/19)));
    const b1 = FXS.bullets(c1, X[0], 0, W[0], 1, 'x', cap, fs).n, rh = Math.min(24, (FO.CARD_Y - 16 - ly)/Math.max(3, b1, FXS.bullets(c2, X[1], 0, W[1], 1, 'x', cap, fs).n));
    let t = FO.kick(t1, X[0], ty, 'back.updates.title') + FXS.bullets(c1, X[0], ly, W[0], rh, 'back.updates', cap, fs).html;
    t += FO.kick('Outside', X[1], ty, 'back.outside.title') + FXS.bullets(c2, X[1], ly, W[1], rh, 'back.outside', cap, fs).html;
    t += nearTabs(D, X[2], ty, X1 - X[2], {top: ly - ty, rowH: Math.max(26, b1*rh/3), d: 13.5, p: 8.5});
    h += `<div class="an-deepc">${t}</div>` + FO.contact(D, X0, FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D);
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
        els.forEach(({e, r}) => { if(e.contains(p) || p.closest('[data-ribbon]')) return; if(e.dataset.shape){ const P = AN.poly(e), inP = ([x, y]) => { let ins = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, yi] = P[i], [xj, yj] = P[j]; if(((yi > y) !== (yj > y)) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) ins = !ins; } return ins; }, hh = q.height*.7, tp = q.top + (q.height - hh)/2; if(![0, .5, 1].some(fx => [0, .5, 1].some(fy => inP([q.left + fx*q.width, tp + fy*hh])))) return; } const ox = Math.min(q.right, r.right) - Math.max(q.left, r.left), oy = Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top);
          if(ox > 1.5 && oy > 3) out.push({slot: (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || 'text', kind: 'text-under-element', detail: `"${n.textContent.trim().slice(0, 28)}" overlaps a ${e.className.split(' ')[0]}`}); }); }); }
    const seen = new Set(); return out.filter(i => { const k = i.slot + i.detail; if(seen.has(k)) return false; seen.add(k); return true; }); };
  // ---------------- Angle checks ----------------
  // the polygon of a shaped element in client px, and every slanted edge on the page (shapes, tags, ribbons) as client-px segments
  AN.poly = el => { const r = el.getBoundingClientRect(), w = r.width*.75, h = r.height*.75, [v, t] = String(el.dataset.sv || '0').split(',').map(Number), vv = el.dataset.shape === 'par' && el.dataset.lean ? Math.min(+el.dataset.lean*h, 22) : v;
    if(el.dataset.slope) return [[0, v], [w, v - (+el.dataset.slope)*w], [w, h], [0, h]].map(([x, y]) => [r.left + x/.75, r.top + y/.75]);
    return AN.pts(el.dataset.shape, w, h, vv, t).map(([x, y]) => [r.left + x/.75, r.top + y/.75]); };
  AN.edges = () => { const out = [];
    document.querySelectorAll('[data-shape]').forEach(el => { if(!el.getClientRects().length) return; const P = AN.poly(el); P.forEach((a, i) => { const b = P[(i + 1) % P.length]; if(Math.abs(a[0] - b[0]) > .5 && Math.abs(a[1] - b[1]) > .5) out.push({a, b, el}); }); });
    document.querySelectorAll('[data-edges]').forEach(el => { const f = el.closest('.panel, .sheet'); if(!f) return; const fr = f.getBoundingClientRect();
      el.dataset.edges.split(';').forEach(s => { const [x1, y1, x2, y2] = s.trim().split(/\s+/).map(Number); out.push({a: [fr.left + x1/.75, fr.top + y1/.75], b: [fr.left + x2/.75, fr.top + y2/.75], el}); }); });
    return out; };
  const segRect = (a, b, q) => { const inR = p => p[0] >= q.left && p[0] <= q.right && p[1] >= q.top && p[1] <= q.bottom; if(inR(a) || inR(b)) return 0;
    const ps = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx*dx + dy*dy, t = Math.max(0, Math.min(1, ((p[0] - a[0])*dx + (p[1] - a[1])*dy)/L)), x = a[0] + t*dx - p[0], y = a[1] + t*dy - p[1]; return Math.sqrt(x*x + y*y); };
    const cr = [[q.left, q.top], [q.right, q.top], [q.right, q.bottom], [q.left, q.bottom]], cross = (p1, p2, p3, p4) => { const d = (x, y, z) => (z[0] - x[0])*(y[1] - x[1]) - (z[1] - x[1])*(y[0] - x[0]); const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4); return d1*d2 < 0 && d3*d4 < 0; };
    for(let i = 0; i < 4; i++) if(cross(a, b, cr[i], cr[(i + 1) % 4])) return 0;
    return Math.min(...cr.map(c => ps(c, a, b)), ...[a, b].map(p => Math.hypot(Math.max(q.left - p[0], 0, p[0] - q.right), Math.max(q.top - p[1], 0, p[1] - q.bottom)))); };
  const textRects = () => { const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement; if(!p || !n.textContent.trim() || p.closest('script, style, .plan-svg, .planwrap, .mg')) continue; if(getComputedStyle(p).visibility === 'hidden') continue;
      const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(q => { if(q.width > 1 && q.height > 1){ const hh = q.height*.7, tp = q.top + (q.height - hh)/2; out.push({q: {left: q.left, right: q.right, top: tp, bottom: tp + hh}, p, t: n.textContent.trim().slice(0, 30)}); } }); }
    return out; };
  // the owner's rule for this set: no slant (photo cut, stripe, band edge, tag or ribbon side) comes within 4 pt of any letter
  AN.angleIssues = () => { const E = AN.edges(), T = textRects(), out = [], seen = new Set();
    E.forEach(({a, b, el}) => T.forEach(({q, p, t}) => { if(el.contains(p) || p.closest('[data-ribbon]')) return; const d = segRect(a, b, q)*.75; if(d < 4){ const k = t + '|' + Math.round(a[1]); if(seen.has(k)) return; seen.add(k);
      out.push({slot: (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || 'text', kind: 'line-hits-text', detail: `a slanted ${String(el.className).split(' ')[0] || 'edge'} edge is ${d.toFixed(1)} pt from "${t}" (4 pt minimum)`}); } })); return out; };
  // the whole house stays inside every slanted cut (measured on the crop SW.focus set)
  AN.houseIssues = D => { const out = []; document.querySelectorAll('.ph[data-shape][data-photo]').forEach(el => { const p = (D.photos || {})[el.dataset.photo], img = el.querySelector('img'); if(!p || !p.box || !img) return;
    const r = el.getBoundingClientRect(), W = p.w, H = p.h, ia = W/H, ta = r.width/r.height, vis = ia > ta ? {w: ta/ia, h: 1} : {w: 1, h: ia/ta}, [fx, fy] = (img.style.objectPosition || '50% 50%').split(' ').map(x => parseFloat(x)/100), ox = (1 - vis.w)*fx, oy = (1 - vis.h)*fy, [x0, y0, x1, y1] = p.box;
    const fr = (x, y) => [r.left + (x - ox)/vis.w*r.width, r.top + (y - oy)/vis.h*r.height], P = AN.poly(el), m = 2/.75;
    const inP = ([x, y]) => { let ins = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, yi] = P[i], [xj, yj] = P[j]; if(((yi > y) !== (yj > y)) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) ins = !ins; } return ins; };
    const c = [fr(x0, y0), fr(x1, y0), fr(x1, y1), fr(x0, y1)], cc = [[c[0][0] + m, c[0][1] + m], [c[1][0] - m, c[1][1] + m], [c[2][0] - m, c[2][1] - m], [c[3][0] + m, c[3][1] - m]];
    if(!cc.every(inP)) out.push({slot: el.dataset.slotPhoto || el.dataset.photo, kind: 'house-cut-by-angle', detail: 'a slanted cut crosses the house'}); }); return out; };
  AN.checks = D => [...AN.angleIssues(), ...AN.houseIssues(D)];
})();
