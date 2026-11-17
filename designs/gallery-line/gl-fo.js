/* Gallery Line fold-over and two-sided flyer builders (the engine grown from the FXS-14 builders by the Twilight Frame pilot; the look is
   the approved Open House library flyer B02). Panel coordinates in pt: trim 612 x 792 (the proof page adds a 9 pt bleed; the field runs to
   -9 / 621 / 801). After the fill: FO.refit sets any block, caption row or table that still misses the fill rules again (type size, line
   count, caption widths, at its own height); FO.capSnug / frontSnug / footSnug / sideCenter close the room a block did not use. */
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
  FO.grow = () => document.querySelectorAll('[data-justify]').forEach(el => { if(!el.textContent.trim() || !SW.pfN) return; const t0 = performance.now(); try { FO.grow1(el); } finally { (window.__tm || {})['grow:' + el.dataset.slot] = performance.now() - t0; } });
  FO.grow1 = el => {
    const H = el.dataset.span ? +el.dataset.span : +(el.dataset.h0 || parseFloat(el.style.height)), cs = getComputedStyle(el), fs0 = parseFloat(cs.fontSize)*0.75, r = (parseFloat(cs.lineHeight)*0.75)/fs0 || 1.5;
    const keep = el.innerHTML; el.style.textAlign = 'left'; el.style.height = 'auto'; let best = null;
    for(let fs = fs0; fs <= fs0*(+el.dataset.gmax || 1.25) + 0.01 && !best; fs += 0.25){ el.style.fontSize = fs + 'pt'; el.style.lineHeight = (fs*r) + 'pt';   // the smallest step up that fills the box
      const T = Math.floor((H + 0.5)/(fs*r)); if(T < 2) continue;
      if(fs === fs0 && !el.dataset.diag){ const n0 = SW.lines(el).n; if((n0 === T || n0 === T - 1) && n0*fs*1.7 >= H){ best = {fs, n: n0, pick: null}; break; } }   // the fill already filled it at this size: same answer, no second search
      for(const t of [T, T - 1]){ if(t*fs*1.7 < H) continue; const b = SW.pfN(el, t); if(b){ best = {fs, n: t, pick: b.pick}; break; } } }
    if(!best){ el.style.fontSize = fs0 + 'pt'; el.innerHTML = keep; el.style.lineHeight = (fs0*r) + 'pt'; best = {fs: fs0, n: SW.lines(el).n}; }
    else if(best.pick){ el.style.fontSize = best.fs + 'pt'; el.innerHTML = best.pick.map(x => x.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))).join(' '); SW.noteGrams(el, best.pick.join(' ')); }
    const lh = el.dataset.span ? best.fs*r : Math.min(H/best.n, best.fs*1.7);
    el.style.lineHeight = lh + 'pt'; el.style.height = (best.n*lh) + 'pt'; el.dataset.lines = best.n; el.style.textAlign = 'justify'; };
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
    if(worst > sp*3.2) el.style.textAlign = 'left'; });
  FO.fill3Check = () => [...document.querySelectorAll('[data-j3]')].filter(el => el.textContent.trim()).flatMap(el => { const L = SW.lines(el);
    return L.n < 3 ? [{slot: el.dataset.slot, kind: 'writeup-under-3-lines', lines: L.n}] : L.fill < 0.895 ? [{slot: el.dataset.slot, kind: 'writeup-last-line-short', pct: Math.round(L.fill*100)}] : []; });

  // Gallery Line: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Gallery Line refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
      const pair = els.length === 2 && els.every(e => e.closest('.cap') && !e.closest('.cap.side')), parts = pair ? els.map(e => { const sl = e.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), lb = document.querySelector(`[data-slot="${sl}.label"]`); return {e, pb: ph && ph.parentElement, lb: lb && lb.parentElement, x: parseFloat(e.style.left), w: parseFloat(e.style.width)}; }).sort((p, q) => p.x - q.x) : null;
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
          const picks = els.map(e => { e.style.fontSize = f + 'pt'; e.style.lineHeight = lh + 'pt'; e.style.height = (flex ? T*lh : H) + 'pt'; e.style.textAlign = 'left'; const b = SW.pfN(e, T); if(b){ const lead = e.dataset.lead || ''; e.innerHTML = (lead ? `<b>${SW.esc(lead)}</b> ` : '') + b.pick.map(x => SW.esc(x)).join(' '); } return b; });   // each member set as soon as it is picked, so the next one sees it
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
    rows.forEach(els => { if(els.some(e => e.closest('.cap.side'))) return; const lh = parseFloat(els[0].style.lineHeight) || +els[0].dataset.lh || 13, box = +els[0].dataset.hfit || parseFloat(els[0].style.height), n = Math.max(...els.map(e => SW.lines(e).n)); if(!(n >= 1) || n*lh >= box - 0.5) return; const d = box - n*lh;
      els.forEach(el => { const sl = el.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), pb = ph && ph.parentElement, lbl = document.querySelector(`[data-slot="${sl}.label"]`);
        if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + d) + 'pt';
        el.style.top = (parseFloat(el.style.top) + d) + 'pt'; el.style.height = (n*lh) + 'pt'; el.dataset.lines = n; }); }); };
  FO.sideCenter = () => document.querySelectorAll('.cap.side').forEach(c => { const a = c.querySelector('.a'), lbl = a && document.querySelector(`[data-slot="${a.dataset.slot}.label"]`); if(!a || !lbl) return;
    const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight), hh = 20 + n*lh, top = +c.dataset.phTop + (+c.dataset.phH - hh)/2; a.style.height = (n*lh) + 'pt'; lbl.parentElement.style.top = top + 'pt'; a.style.top = (top + 20) + 'pt'; });
  // after the fill: an inside-left intro whose true sentences are all said elsewhere on the piece (it cannot set three full lines) is left out;
  // the heading column then sets its title larger and sits centered beside the room photo
  FO.leftHead = () => { const it = document.querySelector('[data-slot="left.intro"]'), ti = document.querySelector('[data-slot="left.title"]'), kk = document.querySelector('[data-slot="left.kicker"]'), ru = document.querySelector('[data-role="left-rule"]');
    if(!it || !ti || !kk || !ru) return; const L = SW.lines(it); if(it.textContent.trim() && L.n >= 3 && L.fill >= 0.895) return;
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:Spectral;font-weight:500;letter-spacing:3pt", HW, 24, 13, 5), lh = T.f*1.3, H = 18 + T.n*lh + 8 + 1.2, y = 36 + (FO.LFY - 14 - 36 - H)/2;
    kk.style.top = y + 'pt'; ti.style.top = (y + 18) + 'pt'; ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = (T.n*lh) + 'pt'; ti.dataset.lines = T.n; ru.style.top = (y + 18 + T.n*lh + 8) + 'pt'; };
  // after the fill: the cover write-up sits on the frame's foot; the rooms above it grow down into any room it did not use (no empty band)
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = FO.BOT + 4 - n*lh;
    const lbls = [...document.querySelectorAll('[data-slot^="front.strip"][data-slot$=".label"]')]; if(!lbls.length) return; const lb = Math.max(...lbls.map(l => parseFloat(l.style.top) + 11)), d = top - 16 - lb; su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt'; if(d <= 0) return;
    lbls.forEach(l => { l.style.top = (parseFloat(l.style.top) + d) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- Gallery Line geometry (pt, panel trim 612 x 792) ----------------
  // B02's margins: 36 pt each side; the inside panels stop 32 pt over the foot. No frame: the field of the main color, its accent
  // seam and the photo hung across the seam carry the design.
  const X0 = 36, X1 = 576, CW = X1 - X0, BOT = 760;
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW; FO.BOT = BOT;
  FO.frame = () => '';
  const CAPS = "font-family:Spectral;font-weight:500;letter-spacing:3pt";
  // B02's centered heading: the tracked Jost eyebrow, the title in wide Spectral capitals, a short accent rule (returns {html, y} with y under the rule)
  FO.head = (kicker, title, slot, y, o) => { o = o || {}; const T = String(title).replace(/\.$/, '').toUpperCase(), ts = FXS.fitSize(T, CAPS, CW, o.max || 22, 12);
    let h = `<div class="abs fo-kick c" style="left:${X0}pt;top:${y}pt;width:${CW}pt" data-slot="${slot}.kicker" data-lines="1">${esc(String(kicker).toUpperCase())}</div>`;
    h += `<div class="abs fo-title c" style="left:${X0}pt;top:${y + 16}pt;width:${CW}pt;height:${ts*1.3}pt;font-size:${ts}pt;line-height:${ts*1.3}pt" data-slot="${slot}.title" data-lines="1">${esc(T)}</div>`;
    const ry = y + 16 + ts*1.3 + 7; h += `<div class="gl-rule" style="left:${306 - 30}pt;top:${ry}pt;width:60pt"></div>`;
    return {html: h, y: ry + 1.2}; };
  // a photo tile with its name under it, set flush left in tracked caps (the field's accent)
  FO.tileC = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs fo-tile-l" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt" data-slot="${slot}.label" data-lines="1">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div>`;
  // how many lines a text sets in width w (greedy word wrap, measured)
  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  FO.fitTitle = (t, fam, w, max, min, maxLines) => { for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w)) return {f, n: L.length, w}; }
    for(const k of [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6]) for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w*k); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w*k)) return {f, n: L.length, w: w*k}; }
    return {f: min, n: FO.wrapLines(t, `${fam};font-size:${min}pt`, w).length, w}; };
  FO.lift = () => '';
  // the standard contact card on the field (B02's agent card on the main color): agent on the left, the brokerage panel on the right with the one logo
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = GL.logoSrc(D); const ko = GL.k.light && !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 180, lh = Math.min(46, H - 30), s = {label: 8.6, name: 18, nameFloor: 15, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div style="--cc-display:Spectral;--cc-body:Jost">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };

  // ---------------- FRONT. The fold-over cover and the flyer front are two different pieces.
  // COVER: the place in tracked Jost at the top of the paper; the whole house hung large across the seam (the one focal point);
  // on the field under it the street in wide Spectral capitals as the picture's title, B02's facts (a Spectral figure over a
  // tracked key, hairlines between), the write-up. No thumbnails, no agent, no brokerage.
  // FLYER FRONT: the street in wide capitals and the place on the paper; a gallery hang across the seam (the whole house large
  // at left, two rooms stacked at its right, each named); the facts and the write-up on the field.
  const facts = (L, y) => { const items = FXS.statItems(L), n = items.length, fw = CW/Math.max(1, n); let f = '';
    items.forEach((it, i) => { const p = FXS.statParts(it), ks = FXS.fitSize(p.l.toUpperCase(), "font-family:Jost;font-weight:500;letter-spacing:1.8pt", fw - 16, 8.8, 8.6);
      f += `<div class="fo-fact" style="left:${X0 + i*fw}pt;top:${y}pt;width:${fw}pt" data-slot="front.fact${i}" data-role="fact"><div class="v" data-slot="front.fact${i}.v" data-lines="1">${esc(p.n)}</div><div class="k" style="font-size:${ks}pt" data-slot="front.fact${i}.k" data-lines="1">${esc(p.l)}</div></div>`;
      if(i) f += `<div class="gl-vhair" data-role="fact" style="left:${X0 + i*fw}pt;top:${y + 3}pt;height:32pt"></div>`; }); return f; };
  const summary = (intro, y, n, lh) => FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${n}" data-try="${Array.from({length: n - 2}, (_, i) => n - i).join(',')}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:${n*lh}pt;font-size:${(lh/1.55).toFixed(2)}pt;line-height:${lh}pt"></div>`);
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hood = FXS.hood(L), place = [hood, FXS.placeLine(L)].filter(Boolean).join('  ·  '), hero = F.hero || K.hero || 'front', ad = String(L.address || '');
    const ps = FXS.fitSize(place.toUpperCase(), "font-family:Jost;font-weight:500;letter-spacing:4.2pt", CW, 11, 8.6);
    if(!o.flyer){
      // DESIGN PASS (11/15): the house hung as large as its whole roof and sides allow (up to three quarters of the panel), the gallery
      // line crossing behind it; under it the street as the picture's title at twice its old size: the house number tracked in the accent,
      // the street name in wide Spectral capitals across the full measure; B02's facts under a short accent rule. A write-up only where a wide
      // house leaves room for three full lines.
      let t = `<div class="abs fo-place" style="left:${X0}pt;top:26pt;width:${CW}pt;height:14pt;font-size:${ps}pt;line-height:14pt" data-slot="front.place" data-lines="1">${esc(place)}</div>`;
      const m = /^(\d+[A-Za-z-]*)\s+(.+)$/.exec(ad), num = m ? m[1] : '', st = (m ? m[2] : ad).toUpperCase();
      const SCS = "font-family:Spectral;font-weight:500;letter-spacing:5pt", s2 = FXS.fitSize(st, SCS, CW, 84, 30); let s1 = Math.round(Math.min(40, Math.max(26, s2*0.5)));
      let blk = (num ? s1*1.12 + 2 : 0) + s2*1.04 + 16 + 38; const HY = 50;
      let HH = Math.min(600, BOT - blk - 26 - HY); while(HH > 300 && !SW.fits(D, hero, CW, HH)) HH -= 4;
      let h = GL.field(HY + Math.round(HH*0.56)) + SW.heroHtml(D, hero, X0, HY, CW, HH, 'front.house', []);
      let free = BOT - (HY + HH + 22 + blk); const lh = 19, n = free >= 3*lh + 22 ? Math.min(4, Math.floor((free - 22)/lh)) : 0;
      // a wide house that stops short of the foot: the house number takes the spare room (up to 52 pt), never an empty band
      if(!n && num && free > 8){ const add = Math.min(free*0.75, (56 - s1)*1.12); s1 += add/1.12; blk += add; free -= add; }
      const ay = HY + HH + (n ? 22 : 16 + Math.max(0, free + 6)*0.4);
      let f = `<div class="abs" data-role="title" style="left:${X0}pt;top:${ay}pt;width:${CW}pt;height:${blk - 54}pt">`;
      if(num) f += `<div class="fo-addr" data-slot="address.num" data-lines="1" style="position:absolute;left:0;top:0;width:${CW}pt;height:${s1*1.12}pt;font-size:${s1}pt;line-height:${s1*1.12}pt;letter-spacing:10pt;text-indent:10pt;color:var(--gl-acc)">${esc(num)}</div>`;
      f += `<div class="fo-addr" data-slot="address" data-lines="1" style="position:absolute;left:0;top:${num ? s1*1.12 + 2 : 0}pt;width:${CW}pt;height:${s2*1.04}pt;font-size:${s2}pt;line-height:${s2*1.04}pt;letter-spacing:5pt;text-indent:5pt;color:var(--gl-on)">${esc(st)}</div></div>`;
      const fy = ay + blk - 38 + (n ? 0 : Math.max(0, free + 6)*0.3); f += `<div class="abs" data-role="fact" style="left:${306 - 24}pt;top:${fy - 12}pt;width:48pt;height:1.4pt;background:var(--gl-acc)"></div>` + facts(L, fy);
      if(n) f += summary(intro, BOT + 4 - n*lh, n, lh);
      return h + t + `<div class="gl-on">${f}</div>`;
    }
    // the flyer front
    let t = '';
    const as = FXS.fitSize(ad.toUpperCase(), "font-family:Spectral;font-weight:500;letter-spacing:4pt", CW, 36, 22);
    t += `<div class="abs fo-addr" data-slot="address" data-lines="1" style="left:${X0}pt;top:${34 + (36 - as)*0.55}pt;width:${CW}pt;height:${as*1.25}pt;font-size:${as}pt;line-height:${as*1.25}pt">${esc(ad)}</div>`;
    t += `<div class="abs fo-place" style="left:${X0}pt;top:86pt;width:${CW}pt;height:14pt;font-size:${ps}pt;line-height:14pt" data-slot="front.place" data-lines="1">${esc(place)}</div>`;
    const HY = 114, HH = o.heroH || 360, rooms = (o.strip || P.strip || []).filter(id => (D.photos || {})[id]).slice(0, 2);
    let w1 = Math.round(CW*0.64); while(w1 < CW && !SW.fits(D, hero, w1, HH)) w1 += 8;
    const side = rooms.length === 2 && w1 <= CW - 150, W1 = side ? w1 : CW, w2 = CW - W1 - 12, th = (HH - 12 - 2*18)/2 + 18 - 18;
    let h = '', f = '';
    if(side){ const tH = (HH - 12 - 18)/2; h += GL.field(HY + Math.round(tH*0.62));
      h += SW.heroHtml(D, hero, X0, HY, W1, HH, 'front.house', []);
      rooms.forEach((id, i) => { const y = HY + i*(tH + 18 + 12), sl = 'front.strip' + i; f += FXS.box(D, id, X0 + W1 + 12, y, w2, tH, sl) + `<div class="abs fo-tile-l" style="left:${X0 + W1 + 12}pt;top:${y + tH + 5}pt;width:${w2}pt" data-slot="${sl}.label" data-lines="1">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div>`; }); }
    else { h += GL.field(HY + Math.round(HH*0.5)) + SW.heroHtml(D, hero, X0, HY, CW, HH, 'front.house', []); }
    const fy = HY + HH + (side ? 24 : 16); f += facts(L, fy);
    let wy = fy + 38 + 20; const lh = 19, n = 3;
    if(!side){ // a house too wide for the hang: three rooms in a row under the facts instead, named, growing into any room left (coverSnug)
      const st = (o.strip || P.strip || []).filter(id => (D.photos || {})[id]).slice(0, 3), g = 12, tw = (CW - (st.length - 1)*g)/Math.max(1, st.length), th = 70;
      st.forEach((id, i) => { const sl = 'front.strip' + i, x = X0 + i*(tw + g); f += FXS.box(D, id, x, wy - 4, tw, th, sl) + `<div class="abs fo-tile-l" data-role="tile" style="left:${x}pt;top:${wy - 4 + th + 5}pt;width:${tw}pt" data-slot="${sl}.label" data-lines="1">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div>`; });
      if(st.length) wy += th + 5 + 11 + 16; }
    f += summary(intro, wy, n, lh);
    return h + t + `<div class="gl-on">${f}</div>`;
  };
  // after the fill: the write-up ends on the foot; the room it did not use goes to the cover house (taller, while the whole house
  // still shows) or, failing that, is split evenly above and below the title and facts (no empty band)
  FO.coverSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return;
    const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = BOT + 4 - n*lh; su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt';
    const tl = [...document.querySelectorAll('[data-role="tile"]')];
    if(tl.length){ const lb = Math.max(...tl.map(l => parseFloat(l.style.top) + 11)), d0 = top - 16 - lb; if(d0 > 0) tl.forEach(l => { l.style.top = (parseFloat(l.style.top) + d0) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d0) + 'pt'; }); return; }
    const fx = [...document.querySelectorAll('[data-role="fact"]')], fb = Math.max(...fx.map(e => parseFloat(e.style.top) + 38)), d = top - 22 - fb; if(d < 1) return;
    const hp = document.querySelector('.ph[data-slot-photo="front.house"]'), hb = hp && hp.parentElement, D = SW.data();
    let g = 0; if(hb){ const w = parseFloat(hb.style.width), h0 = parseFloat(hb.style.height); for(let k = Math.floor(d); k >= 0; k--) if(SW.fits(D, hp.dataset.photo, w, h0 + k)){ g = k; break; } hb.style.height = (h0 + g) + 'pt';
      // the flyer's gallery hang: the two rooms beside the house grow with it, each by half, their names moving with them
      [0, 1].forEach(i => { const ph = document.querySelector(`.ph[data-slot-photo="front.strip${i}"]`), bx = ph && ph.parentElement, lb = document.querySelector(`[data-slot="front.strip${i}.label"]`); if(!bx) return;
        bx.style.top = (parseFloat(bx.style.top) + i*g/2) + 'pt'; bx.style.height = (parseFloat(bx.style.height) + g/2) + 'pt'; if(lb) lb.style.top = (parseFloat(lb.style.top) + (i + 1)*g/2) + 'pt'; }); }
    const rest = d - g, up = g + rest/2;
    [...fx, document.querySelector('[data-role="title"]')].filter(Boolean).forEach(e => { e.style.top = (parseFloat(e.style.top) + up) + 'pt'; }); };
  // ---------------- the panel headline: one display moment per panel (owner's outside-review lesson 3): the tracked Jost eyebrow,
  // then the headline in Spectral at 30 pt or more on one line (two only when it must), centered on the paper ----------------
  const DISP = "font-family:Spectral;font-weight:500;letter-spacing:.2pt";
  FO.display = (kicker, title, slot, y) => { const T = String(title).replace(/\.$/, ''); let fs = FXS.fitSize(T, DISP, CW, 36, 30), n = 1;
    if(FXS.width(T, `${DISP};font-size:${fs}pt`) > CW){ const R = FO.fitTitle(T, DISP, CW, 32, 26, 2); fs = R.f; n = R.n; }
    const lh = fs*1.16;
    let h = `<div class="abs fo-kick c" style="left:${X0}pt;top:${y}pt;width:${CW}pt" data-slot="${slot}.kicker" data-lines="1">${esc(String(kicker).toUpperCase())}</div>`;
    h += `<div class="abs fo-disp" style="left:${X0}pt;top:${y + 15}pt;width:${CW}pt;height:${n*lh}pt;font-size:${fs}pt;line-height:${lh}pt;white-space:${n > 1 ? 'normal' : 'nowrap'}" data-slot="${slot}.title" data-lines="${n}">${esc(T)}</div>`;
    return {html: h, y: y + 15 + n*lh}; };
  // B02's wall label under a hung photo: the room's name (and size) in a narrow column at the left, the caption beside it running to the photo's right edge
  FO.hang = (D, c, x, y, w, ph, lines, slot, o) => { o = o || {}; c = FXS.augment(D, c); const L0 = FXS.leadLabel(c.lead), lh = o.lh || 16, fs = o.fs || 12.25;
    // owner 11/16 (Book 3 p3): the write-up starts about 55% closer to its room name: the label column is as wide as the name (or its size
    // line) plus a 26-30 pt gutter (it was about 66 pt), never the old fixed 150 pt; the write-up still runs to the photo's right edge and takes the extra width in words
    const lw = o.lw || Math.max(60, Math.ceil(Math.max(FXS.width(L0.name.toUpperCase(), 'font-family:Jost;font-weight:600;font-size:8.6pt;letter-spacing:2.4pt'), L0.size ? FXS.width(L0.size, 'font-family:Spectral;font-weight:500;font-size:13pt') : 0, 36))), gut = Math.max(26, Math.ceil(w*0.205) - lw), cx = x + lw + gut, cw = w - lw - gut;   // the write-up stays a column (under 80% of the photo), measured on its own width
    return FXS.box(D, c.photo, x, y, w, ph, slot) +
      `<div class="abs" style="left:${x}pt;top:${y + ph + 12}pt;width:${lw}pt"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${lw}pt;display:block">${esc(L0.name.toUpperCase())}</div>${L0.size ? `<div style="font:500 13pt/17pt var(--gl-serif);color:var(--fx-on);margin-top:2pt;white-space:nowrap" data-size="1">${esc(L0.size)}</div>` : ''}<div class="gl-rule" style="position:relative;width:36pt;margin-top:8pt"></div></div>` +
      `<div class="abs cap"><div class="a" style="position:absolute;left:${cx}pt;top:${y + ph + 12}pt;width:${cw}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-room="${esc(L0.name)}" data-lh="${lh}" data-lines="${lines}" data-min="3" data-narrow="0" ${FXS.sd(c.s)}></div></div>`; };

  // ---------------- INSIDE LEFT: the display headline on the paper, the widest room hung across the inside horizon (FO.FY, the same
  // seam line as the right panel, so the spread reads as one wall across the fold), then on the field the kitchen big at the left
  // and its card beside it: a panel of the paper (the sign-in sheet's table) where each item is a tracked label over its line. ----------------
  FO.FY = 300;
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, cs = FO.cards(D, P.left || []), heroC = cs[0];
    const kit = P.kitchen || (P.strip || []).concat(Object.keys(D.photos || {})).find(id => /^kitchen/.test(id) && (D.photos || {})[id]);
    const hd = FO.display(I.kicker || '', I.title || '', 'left', 34), PY = hd.y + 14;
    const CWc = 256, cx = X1 - CWc, ci = cx + 16, ciw = CWc - 32, tcss = 'font-family:Jost;font-weight:400;font-size:10.5pt';
    const items0 = (box.items || []).slice(0, 8);
    // the card never repeats what the back's two lists print (the lists as they will set: the explicit box items, else the selling facts)
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, l1 = ((BXb.inside || {}).items || SFb.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 5), l2 = ((BXb.outside || {}).items || SFb.outside).slice(0, 5);
    const backG = new Set([].concat(l1, l2).flatMap(t => SW.grams4(t))), backT = [].concat(l1, l2).map(String);
    const oneLine = it => { const S = (it.s || []).map(x => [].concat(x).filter(a => !SW.grams4(a).some(g => backG.has(g)) && !backT.some(b => SW.sameFact(b, a)))).filter(a => a.length); let best = '';
      const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(t && t.length > best.length && !SW.sameFactIn(t)){ const W = FO.wrapLines(t, tcss, ciw); if(W.length === 1 || (W.length === 2 && W[1] >= 0.8*ciw)) best = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
      walk(0, []); return best; };
    const vals = items0.map(oneLine), items = items0.filter((_, i) => vals[i]), itemText = vals.filter(Boolean), nl = itemText.map(t => FO.wrapN(t, tcss, ciw));
    const hd0 = String(box.heading || '').replace(/\.$/, ''), HT = hd0 ? FO.fitTitle(hd0, "font-family:Spectral;font-weight:500", ciw, 18, 14, 2) : {f: 0, n: 0}, hlh = HT.f*1.2;
    const head = 16 + 14 + (HT.n ? HT.n*hlh + 6 : 0) + 8, rows0 = nl.reduce((a, n) => a + 13 + n*15 + 9, 0), need = head + rows0 + 6;
    // DESIGN PASS (11/15): the widest room hung across the inside horizon with its museum wall label (name, size, accent rule, caption)
    // like the bedroom on the right page; under it the kitchen photo with its own three-line caption beside the paper card. Both pages
    // share one hero height and one lower horizon (FO.__hp / FO.__ry), so the spread reads as one gallery wall across the fold.
    const HL = 3, wlh = 15.5, KL = 3, klh = 14;
    const minLow = Math.max(need, 250), HP = Math.max(220, Math.min(272, BOT - minLow - 18 - (12 + HL*wlh) - PY)), RY = PY + HP + 12 + HL*wlh + 18, lowH = BOT - RY;
    FO.__hp = HP; FO.__py = PY;
    const padR = Math.max(0, (lowH - need)/Math.max(1, items.length)), lowTop = RY;
    let h = hd.html + GL.field(FO.FY) + `<div class="gl-on">${FO.hang(D, heroC, X0, PY, CW, HP, HL, 'left.wide', {lh: wlh, fs: 11.75})}</div>`;
    let r = '', b = '';
    if(kit){ const kw = cx - 16 - X0, kph = lowH - 25 - KL*klh, kc = FO.cards(D, [kit])[0] || {photo: kit, lead: 'Kitchen.', s: []}; r += FXS.captioned(D, kc, X0, lowTop, kw, kph, KL, 'left.kitchen', {fs: 10.5, lh: klh, min: 3}); }
    b += `<div class="gl-wbox" style="left:${cx}pt;top:${lowTop}pt;width:${CWc}pt;height:${lowH}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${ci}pt;top:${lowTop + 16}pt" data-slot="left.box.kicker" data-lines="1">${esc(String(box.kicker || 'The kitchen').toUpperCase())}</div>`;
    if(HT.n) b += `<div class="abs fo-sub" style="left:${ci}pt;top:${lowTop + 31}pt;width:${ciw}pt;height:${HT.n*hlh}pt;font-size:${HT.f}pt;line-height:${hlh}pt;white-space:normal;color:#161616" data-slot="left.box.heading" data-lines="${HT.n}">${esc(hd0)}</div>`;
    let y = lowTop + head;
    items.forEach((it, i) => { const rh = 13 + nl[i]*15 + 9 + padR;
      b += `<div class="abs fo-li-l" style="left:${ci}pt;top:${y + padR/2}pt;width:${ciw}pt" data-slot="left.list.l${i}" data-lines="1">${esc(it.l)}</div>`;
      b += `<div class="abs" style="left:${ci}pt;top:${y + padR/2 + 13}pt;width:${ciw}pt;height:${nl[i]*15}pt;font:400 10.5pt/15pt var(--gl-font);color:#222;overflow:hidden" data-slot="left.list.t${i}" data-lines="${nl[i]}">${esc(itemText[i])}</div>`;
      if(i < items.length - 1) b += `<div class="abs hr" style="left:${ci}pt;top:${y + rh - 4}pt;width:${ciw}pt"></div>`; y += rh; });
    return h + `<div class="gl-on">${r}</div><div class="gl-ink">${b}</div>`;
  };
  // ---------------- INSIDE RIGHT (bedrooms and baths): the display headline, the best room hung across the seam with its wall label,
  // then the other three rooms smaller in one locked row on the field ----------------
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs = FO.cards(D, P.right || []);
    // DESIGN PASS (11/15): the best bedroom hung across the seam with its wall label at the left page's height (one horizon across the fold),
    // then TWO rooms side by side on the field (not the shared big-photo-over-a-row-of-three skeleton), each half the dominant photo or less.
    const hd = FO.display(R.kicker || '', R.title || '', 'right', 34), Y0 = Math.max(hd.y + 14, FO.__py || 0), HL = 3, hlh = 15.5, FY = FO.FY;
    const HP = (FO.__hp || 268) - (Y0 - (FO.__py || Y0));
    let r = FO.hang(D, cs[0], X0, Y0, CW, HP, HL, 'right.photo0', {lh: hlh, fs: 11.75});
    const RY = Y0 + HP + 12 + HL*hlh + 18, n = Math.min(2, cs.length - 1), G = 18, W = (CW - (n - 1)*G)/n, clh = 14, NL = 3, PH = BOT - RY - 25 - NL*clh;
    cs.slice(1, 1 + n).forEach((c, i) => { r += FXS.captioned(D, c, X0 + i*(W + G), RY, W, PH, NL, 'right.photo' + (i + 1), {fs: 10.5, lh: clh, min: 3}); });
    return hd.html + GL.field(FY) + `<div class="gl-on">${r}</div>`;
  };
  // after the fill: an inside-right intro that sets fewer than three lines hands its freed room to the top row of photos
  FO.rightFit = () => { const el = document.querySelector('[data-slot="right.intro"]'); if(!el || !el.textContent.trim()) return; const n = SW.lines(el).n; if(n >= 3) return;
    const d = (3 - n)*(+el.dataset.lh || 15.5); ['right.photo0', 'right.photo1'].forEach(sl => { const ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), box = ph && ph.parentElement; if(!box) return;
      box.style.top = (parseFloat(box.style.top) - d) + 'pt'; box.style.height = (parseFloat(box.style.height) + d) + 'pt'; }); };

  // after the fill: top-row captions on the inside right that set fewer than their four lines: both photos grow down by the unused lines
  FO.rightCapFit = () => { const caps = ['right.photo0', 'right.photo1'].map(sl => document.querySelector(`.cap .a[data-slot="${sl}"]`)).filter(Boolean), nx = document.querySelector('.ph[data-slot-photo="right.photo2"]'); if(!caps.length || !nx) return;
    const n = Math.max(...caps.map(c => SW.lines(c).n)), lh = parseFloat(caps[0].style.lineHeight) || 14.5, end = Math.max(...caps.map(c => parseFloat(c.style.top))) + n*lh, d = parseFloat(nx.parentElement.style.top) - 12 - end; if(d < 0.5) return;
    ['right.photo0', 'right.photo1'].forEach(sl => { const ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), bx = ph && ph.parentElement, lbl = document.querySelector(`[data-slot="${sl}.label"]`), cap = document.querySelector(`.cap .a[data-slot="${sl}"]`);
      if(bx) bx.style.height = (parseFloat(bx.style.height) + d) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + d) + 'pt'; if(cap){ cap.style.top = (parseFloat(cap.style.top) + d) + 'pt'; cap.style.height = (n*lh) + 'pt'; } }); };
  // after the fill: the lowest caption row of a panel ends on the panel's foot: its photos grow down by the room the captions did not use
  FO.footSnug = (prefix, foot, all) => { const caps = [...document.querySelectorAll(`.cap .a[data-slot^="${prefix}"]`)].filter(c => all || !/photo0$/.test(c.dataset.slot)); if(!caps.length) return;
    const end = Math.max(...caps.map(c => parseFloat(c.style.top) + SW.lines(c).n*(parseFloat(c.style.lineHeight) || +c.dataset.lh))), d = (foot || FO.BOT) - end; if(d < 0.5) return;
    caps.forEach(c => { const sl = c.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), bx = ph && ph.parentElement, lbl = document.querySelector(`[data-slot="${sl}.label"]`);
      if(bx) bx.style.height = (parseFloat(bx.style.height) + d) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + d) + 'pt'; c.style.top = (parseFloat(c.style.top) + d) + 'pt'; }); };
  // ---------------- BACK (fold-over) and flyer back ----------------
  // on the paper: the listing's own plan as given (dark lines, clear background) or the top photo, and the house write-up beside it;
  // on the field: the extra photo with Nearby beside it (fold-over) or three captioned rooms (flyer), B02's white box with the two
  // lists, the agent card and the fine print.
  const nearRows = (D, x, y, w, o) => { o = o || {}; const N = ((D.sw || {}).back || {}).nearby || [], top = o.top == null ? 20 : o.top, rh = o.rowH || 28, ds = o.d || 15, ps = o.p || 8.5;
    if(o.stack) return N.slice(0, 3).map((n, i) => `<div class="fo-near st" style="left:${x}pt;top:${y + top + i*rh}pt;width:${w}pt;height:${rh - 0.75}pt" data-slot="back.near${i}" data-lines="2" data-fine="1"><div class="in"><span class="d" style="font-size:${ds}pt">${esc(n.dist)}</span><span class="p" style="font-size:${ps}pt">${esc(n.place)}</span></div></div>`).join('') + FO.kick('Nearby', x, y, 'back.near.kicker');
    return N.slice(0, 3).map((n, i) => `<div class="fo-near" style="left:${x}pt;top:${y + top + i*rh}pt;width:${w}pt;height:${rh - 0.5}pt" data-slot="back.near${i}" data-lines="1" data-fine="1"><div class="in"><span class="d" style="font-size:${ds}pt">${esc(n.dist)}</span><span class="p" style="font-size:${ps}pt">${esc(n.place)}</span></div></div>`).join('') + FO.kick('Nearby', x, y, 'back.near.kicker'); };
  FO.planBox = (D, x, y, maxH, maxW) => { const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: D.plan.turn ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: !!D.plan.turn, angle: D.plan.turn && D.plan.kind === 'color' ? 270 : undefined}), cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 44, D.plan.minCard || 0, 220)); return FXS.planCard(D, x, y, cw, maxH); };
  FO.CARD_H = 62; FO.CARD_Y = 684;   // the agent card on the field, the fine print under it
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:756pt;width:${CW}pt;height:10pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  // after the fill: the deck's wall label takes the largest type (10.5 to 13.5 pt) at which its true sentences fill the column beside the photo
  FO.deckFit = () => { const el = document.querySelector('.cap .a[data-slot="back.deck"]'); if(!el || !el.textContent.trim()) return; const H = +el.dataset.hmax, keep = [el.innerHTML, el.style.fontSize, el.style.lineHeight, el.style.height];
    const fill = () => SW.lines(el).n*parseFloat(el.style.lineHeight)/H; if(fill() >= 0.9) return;
    for(let f = 13.5; f >= 10.5; f -= 0.25){ const lh = f*1.4, T = Math.floor(H/lh); if(T < 3 || T*lh < 0.9*H) continue; el.style.fontSize = f + 'pt'; el.style.lineHeight = lh + 'pt'; el.style.height = (T*lh) + 'pt'; el.__pfMemo = null;
      const b = SW.pfN(el, T); if(b){ el.innerHTML = b.pick.map(x => SW.esc(x)).join(' '); SW.noteGrams(el, b.pick.join(' ')); el.dataset.lines = T; return; } }
    [el.innerHTML, el.style.fontSize, el.style.lineHeight, el.style.height] = keep; };
  // ---------------- DESIGN PASS (11/15): the fold-over back, its own page (the flyer back keeps plan + Nearby + three rooms) ----------------
  // On the paper: the listing's own plan, centered and as large as the paper zone holds (its box to the plan's own shape); with no plan,
  // "The house" write-up there (beside a captioned photo when the listing has one). Then the backyard or deck photo hung across the gallery
  // line with its museum wall label beside it on the field; Nearby as one row of large Spectral figures; the two lists open in ruled columns;
  // the half-height agent card; the fine print.
  FO.backFold = (D) => { const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, issues = [];
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 5), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 5), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const nop = P.backNoplan || [], deckId = P.backDeck || nop[0], topId = null;
    const rows = Math.max(Math.min(c1.length, 5), Math.min(c2.length, 5), 3), rh = 20, LH = 22 + rows*rh, LT = FO.CARD_Y - 18 - LH;
    const NY = LT - 16 - 44, DB = NY - 18, DHt = 178, DT = DB - DHt, FY = DT + 46, TOP = 30, TH = DT - 8 - TOP;
    let h = '';
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const deckC = deckId ? FO.cards(D, [deckId])[0] : null, used = FO.cards(D, [deckId, ...(P.backPaper || []), P.kitchen, (P.left || [])[0], ...(P.right || []).slice(0, 3)].filter(Boolean));   // the paper write-up never repeats a fact an inside caption says
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    if(hasPlan){ const pr = FO.planBox(D, X0, TOP, TH - 36, CW), pw = parseFloat(/width:([\d.]+)pt/.exec(pr.html)[1]), ph = pr.bottom - TOP, aw = CW - pw - 26;
      // a plan its own pixels keep small (300 ppi) leaves the paper wide: a captioned room takes the rest of the paper beside it
      const sideId = (P.backPaper || [])[0];
      if(aw >= 200 && sideId && (D.photos || {})[sideId]){ const pc = FO.planBox(D, X0, TOP + Math.max(0, (TH - ph)/2), TH - 36, CW), ax = X0 + pw + 26; h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues;
        h += FXS.captioned(D, FXS.cardFor(D, sideId), ax, TOP, aw, TH - 25 - 3*14, 3, 'back.top0', {fs: 10.5, lh: 14, min: 3}); }
      else { const x = Math.round(306 - pw/2), pc = FO.planBox(D, x, TOP + Math.max(0, (TH - ph)/2), TH - 36, CW); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; } }
    else { // no plan: the paper holds two more rooms, each with its own description (owner: a back with no plan uses several captioned photos)
      const ids = (P.backPaper || nop.slice(1, 3)).filter(id => (D.photos || {})[id]).slice(0, 2), g = 18, tw = (CW - (ids.length - 1)*g)/Math.max(1, ids.length), ph = TH - 25 - 3*14;
      ids.forEach((id, i) => { h += FXS.captioned(D, FXS.cardFor(D, id), X0 + i*(tw + g), TOP, tw, ph, 3, 'back.top' + i, {fs: 10.5, lh: 14, min: 3}); }); }
    h += GL.field(FY);
    let r = '';
    if(deckC){ const dw = 316, lx = X0 + dw + 22, lw = X1 - lx, ly = FY + 14, clh = 14.5, L0 = FXS.leadLabel(FXS.augment(D, deckC).lead), n = Math.max(3, Math.floor((DB - ly)/clh));
      r += FXS.box(D, deckC.photo, X0, DT, dw, DHt, 'back.deck');
      // the wall label split by the gallery line: the room's name on the paper just over the line, its caption on the field under it
      h += `<div class="abs" style="left:${lx}pt;top:${DT + 1}pt;width:${lw}pt"><div class="lbl" data-slot="back.deck.name" data-lines="1" style="max-width:${lw}pt;display:block;font-size:11pt;letter-spacing:3.2pt">${esc(L0.name.toUpperCase())}</div></div>`;
      r += `<div class="abs cap side"><div class="a" style="position:absolute;left:${lx}pt;top:${ly}pt;width:${lw}pt;height:${n*clh}pt;font-size:10.5pt;line-height:${clh}pt" data-slot="back.deck" data-hmax="${DB - ly}" data-room="${esc(L0.name)}" data-lh="${clh}" data-lines="${n}" data-min="3" data-narrow="0" ${FXS.sd(FXS.augment(D, deckC).s)}></div></div>`; }
    // Nearby: one row of three, a large Spectral figure over its tracked place, hairlines between
    const N = (KB.nearby || []).slice(0, 3), nw = CW/Math.max(1, N.length);
    r += `<div class="gl-hair" style="left:${X0}pt;top:${NY - 10}pt;width:${CW}pt"></div>` + FO.kick('Nearby', X0, NY - 2, 'back.near.kicker').replace('class="abs fo-kick"', 'class="abs fo-kick" data-near="1"');
    N.forEach((nb, i) => { const x = X0 + 74 + i*((CW - 74)/N.length), w = (CW - 74)/N.length, pt = String(nb.place).toUpperCase(); let tr = 1.6; while(tr > 0.4 && FXS.width(pt, `font-family:Jost;font-weight:500;font-size:8.6pt;letter-spacing:${tr}pt`) > w - 22) tr -= 0.2;
      if(i) r += `<div class="gl-vhair" style="left:${x - 12}pt;top:${NY}pt;height:40pt"></div>`;
      r += `<div class="abs" style="left:${x}pt;top:${NY - 4}pt;width:${w - 20}pt"><div data-slot="back.near${i}" data-lines="1" style="font:500 24pt/26pt var(--gl-serif);color:var(--gl-on);white-space:nowrap;overflow:hidden">${esc(nb.dist)}</div><div data-slot="back.near${i}.p" data-lines="1" style="font:500 8.6pt/11pt var(--gl-font);letter-spacing:${tr.toFixed(1)}pt;text-transform:uppercase;color:var(--gl-soft-on);white-space:nowrap;overflow:hidden;margin-top:4pt">${esc(nb.place)}</div></div>`; });
    const cw2 = (CW - 28)/2;
    let ls = `<div class="gl-hair" style="left:${X0}pt;top:-1pt;width:${CW}pt"></div>`;
    ls += FO.kick(t1, X0, 10, 'back.updates.title') + FXS.bullets(c1, X0, 30, cw2, rh, 'back.updates', 5, 10.5).html;
    ls += FO.kick('Outside', X0 + cw2 + 28, 10, 'back.outside.title') + FXS.bullets(c2, X0 + cw2 + 28, 30, cw2, rh, 'back.outside', 5, 10.5).html;
    r += `<div class="abs" data-role="lists" data-lt="${LT}" data-lh="${LH}" style="left:0;top:${LT}pt;width:612pt;height:${LH}pt">${ls}</div>`;
    h += `<div class="gl-on">${r}` + FO.contact(D, X0, FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D) + `</div>`;
    return {html: h, issues};
  };
  // owner 11/16 (Book 3 p5, "the nearby section looks thin"): beside the plan on the paper, the listing's rooms floor by floor, each a ruled
  // row (the room's name, its size in Spectral at the right), then Nearby as a smaller block: a Spectral distance and its tracked place on
  // one ruled line. Rows open up (13.5 to 19 pt) to fill the plan's height; the block is centered beside the plan.
  FO.roomCol = (D, RL, x, y, w, H) => { const N = (((D.sw || {}).back || {}).nearby || []), n = RL.reduce((a, f) => a + f.rooms.length, 0);
    // Nearby always prints (an After never loses what its Before had): three places, else two; rows tighten (19 pt down to 12) before a place drops
    let rh = 0, nn = Math.min(3, N.length), KH = 17, GG = 12;
    const fixedOf = (q, kh, gg) => RL.length*kh + (RL.length - 1)*gg + (q ? gg + 4 + kh : 0);
    for(const [kh, gg] of [[17, 12], [15, 8]]){ for(let q = Math.min(3, N.length); q >= Math.min(2, N.length) && !rh; q--){ for(let r = 19; r >= 12; r -= 0.25) if(fixedOf(q, kh, gg) + (n + q)*r <= H){ rh = r; nn = q; KH = kh; GG = gg; break; } } if(rh) break; }
    if(!rh){ KH = 15; GG = 8; nn = Math.min(2, N.length); rh = (H - fixedOf(nn, KH, GG))/(n + nn); }
    const fs = Math.max(8.2, Math.min(10.5, rh*0.68)), sz = Math.max(8.8, Math.min(12, rh*0.76)), tot = fixedOf(nn, KH, GG) + (n + nn)*rh;
    let yy = y + Math.max(0, (H - tot)/2), o = '';
    const row = (a, b, slot, big) => `<div class="abs" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${rh}pt;display:flex;align-items:center;justify-content:space-between;gap:8pt;white-space:nowrap;border-bottom:1pt solid rgba(0,0,0,.15);box-sizing:border-box" data-slot="${slot}" data-lines="1">${a}${b}</div>`;
    RL.forEach((f, fi) => { if(fi) yy += GG; o += FO.kick(f.floor, x, yy, 'back.rooms.f' + fi); yy += KH;
      f.rooms.forEach((r, ri) => { o += row(`<span style="font:500 ${fs}pt/1 var(--gl-font);color:#222;overflow:hidden;text-overflow:clip">${esc(r[0])}</span>`, `<span style="font:500 ${sz}pt/1 var(--gl-serif);color:var(--gl-ink);flex:none">${esc(r[1])}</span>`, `back.rooms.f${fi}.${ri}`); yy += rh; }); });
    if(nn){ yy += GG + 4; o += FO.kick('Nearby', x, yy, 'back.near.kicker'); yy += KH;
      N.slice(0, nn).forEach((nb, i) => { o += row(`<span style="font:500 ${Math.max(8.2, fs*0.86)}pt/1 var(--gl-font);letter-spacing:${rh < 14 ? 0.8 : 1.4}pt;text-transform:uppercase;color:#222;overflow:hidden">${esc(nb.place)}</span>`, `<span style="font:500 ${sz}pt/1 var(--gl-serif);color:var(--gl-ink);flex:none">${esc(nb.dist)}</span>`, 'back.near' + i); yy += rh; }); }
    return `<div class="gl-ink room-list">${o}</div>`; };
  FO.back = (D, o) => { o = o || {}; if(!o.flyer) return FO.backFold(D); const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [];
    // BACK: the paper holds the listing's own plan (its box as wide as the drawing) or a captioned photo, with Nearby beside it as large
    // Spectral figures; the field holds the house write-up across the full measure (fold-over; with no plan a second captioned photo
    // beside it) or three captioned rooms (flyer), then the two lists set open on the field in ruled columns, the agent card, the fine print.
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    const rowIds = flyer ? (P.flyerBack || []).slice(0, 3) : [P.backB || (P.backRow || [])[0]].filter(Boolean), rowCards = FO.cards(D, rowIds);
    const L0 = X0, R0 = X1, TOP = 36;
    let h = '', top, leftW;
    const BX0 = KB.boxes || {}, SF0 = FXS.sellingFacts(D), n1 = ((BX0.inside && BX0.inside.items) || SF0.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 5).length, n2 = ((BX0.outside && BX0.outside.items) || SF0.outside).slice(0, 5).length, LT0 = FO.CARD_Y - 20 - (22 + Math.max(n1, n2, 3)*22);
    const TH = flyer ? Math.min((P.flyerTH || 300) - 10, LT0 - 18 - 67.5 - 112 - 32 - TOP - 36) : 282;
    if(hasPlan){ const pc = FO.planBox(D, L0, TOP, TH, 336); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom; leftW = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])); }
    else { leftW = 330; const c = FXS.cardFor(D, topId); h += FXS.captioned(D, c, L0, TOP, leftW, 200, 3, 'back.top', {fs: 11, lh: 14, min: 3}); top = TOP + 200 + 25 + 3*14; }
    const nx = L0 + leftW + 26, nw = R0 - nx, nh = 22 + 3*46;
    if(flyer && (K.roomLists || []).length) h += FO.roomCol(D, K.roomLists, nx, TOP, nw, top - TOP);   // owner 11/16 (Book 3 p5): the rooms floor by floor with their sizes, Nearby smaller under them
    else h += nearRows(D, nx, TOP + Math.max(0, (top - TOP - nh)/2), nw, {rowH: 46, d: 24, p: 8.6, stack: true, top: 22});
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 5), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 5), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const FY = top + 10, y0 = FY + 22;
    h += GL.field(FY);
    const rows = Math.max(Math.min(c1.length, 5), Math.min(c2.length, 5), 3), LH = 22 + rows*22, LT = FO.CARD_Y - 20 - LH;
    let r = '';
    if(flyer){
      const n = rowCards.length, gap = 12, tw = (R0 - L0 - (n - 1)*gap)/n, PH = Math.max(104, LT - 18 - y0 - 25 - 3*13.5); window.__LT = LT;
      rowCards.forEach((c, i) => { r += FXS.captioned(D, c, L0 + i*(tw + gap), y0, tw, PH, 3, 'back.photo' + i, {fs: 10.5, lh: 13.5, min: 3}); });
    } else if(hasPlan || !rowCards.length){
      const H = LT - 18 - y0;
      r += FO.kick('The house', L0, y0, 'back.about.title') + FO.full(FO.wu(keep(f2.concat(f1)), L0, y0 + 20, CW, H - 20, 'back.about', 13.5, 20, 'body')).replace('data-slot="back.about"', `data-gmax="1.12" data-slot="back.about"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
    } else {
      const pw = 262, ph = LT - 18 - y0 - 25 - 3*14, ax = L0 + pw + 22, aw = R0 - ax;
      r += FXS.captioned(D, rowCards[0], L0, y0, pw, ph, 3, 'back.photo1', {fs: 11, lh: 14, min: 3}).replace('data-slot="back.photo1" data-room', 'data-slot="back.photo1" data-shrinkphoto="1" data-room');
      r += FO.kick('The house', ax, y0, 'back.about.title') + FO.full(FO.wu(keep(f2.concat(f1)), ax, y0 + 20, aw, LT - 18 - y0 - 20, 'back.about', 12.5, 18.5, 'body')).replace('data-slot="back.about"', `data-gmax="1.1" data-slot="back.about" data-pool="${P.pool || 8}"`);
    }
    // the two lists, open on the field: tracked heads, dash lines over 1 pt rules
    const cw2 = (CW - 28)/2, rh = 22;
    let ls = `<div class="gl-hair" style="left:${L0}pt;top:-1pt;width:${CW}pt"></div>`;
    ls += FO.kick(t1, L0, 10, 'back.updates.title') + FXS.bullets(c1, L0, 30, cw2, rh, 'back.updates', 5, 10.5).html;
    ls += FO.kick('Outside', L0 + cw2 + 28, 10, 'back.outside.title') + FXS.bullets(c2, L0 + cw2 + 28, 30, cw2, rh, 'back.outside', 5, 10.5).html;
    r += `<div class="abs" data-role="lists" data-lt="${LT}" data-lh="${LH}" style="left:0;top:${LT}pt;width:612pt;height:${LH}pt">${ls}</div>`;
    h += `<div class="gl-on">${r}` + FO.contact(D, X0, window.__cardY || FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D) + `</div>`;
    return {html: h, issues};
  };
  // after the fill: the house write-up on the back set fewer lines than its box: the lists move up under it and their rows open out
  // to keep their foot (no empty band between the write-up and the lists)
  FO.backSnug = () => { const ab = document.querySelector('[data-slot="back.about"]'), L = document.querySelector('[data-role="lists"]'); if(!ab || !L || !ab.textContent.trim() || ab.dataset.nosnug) return;
    if(parseFloat(ab.style.left) > FO.X0 + 1) return;   // the write-up beside a photo: its photo fills that height
    const end = parseFloat(ab.style.top) + SW.lines(ab).n*parseFloat(ab.style.lineHeight), lt = +L.dataset.lt, lh = +L.dataset.lh, nt = end + 22; if(nt > lt - 2) return;
    const H2 = lt + lh - nt, k = H2/lh; L.style.top = nt + 'pt'; L.style.height = H2 + 'pt';
    [...L.children].forEach(e => { const t = parseFloat(e.style.top); if(t > 0) e.style.top = (t*k) + 'pt'; }); };
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
