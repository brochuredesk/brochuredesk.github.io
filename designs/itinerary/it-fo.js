/* Itinerary fold-over and two-sided flyer builders (grown from the FXS-14 builders; the hand is the approved Open House library
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
  FO.gaps = () => document.querySelectorAll('[data-slot]').forEach(el => { if(el.dataset.rag){ el.style.textAlign = 'left'; return; }   /* a body paragraph in a narrow column is set ragged (justified, its word gaps open) */
    if(getComputedStyle(el).textAlign !== 'justify' || el.querySelector('[data-slot]')) return;
    const sp = parseFloat(getComputedStyle(el).fontSize)*0.28; let worst = 0; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const t = n.textContent; for(let i = 0; i < t.length; i++){ if(t[i] !== ' ') continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const q = r.getBoundingClientRect(); if(q.width > worst && q.height > 0) worst = q.width; } }
    if(worst > sp*3.2) el.style.textAlign = 'left'; });
  FO.fill3Check = () => [...document.querySelectorAll('[data-j3]')].filter(el => el.textContent.trim()).flatMap(el => { const L = SW.lines(el);
    return L.n < 3 ? [{slot: el.dataset.slot, kind: 'writeup-under-3-lines', lines: L.n}] : L.fill < 0.895 ? [{slot: el.dataset.slot, kind: 'writeup-last-line-short', pct: Math.round(L.fill*100)}] : []; });

  // Itinerary: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Itinerary refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
      const tmax = Math.max(3, Math.min(8, Math.floor((H + 24)/(fs0*1.18)))), counts = []; for(let t = tmax; t >= minl; t--) if(Math.abs(t - Math.max(minl, n0)) <= 1 || els.every(e => e.closest('.cap.side')) || (els.length > 1 && els.every(e => e.dataset.nopair))) counts.push(t);   // a locked row (data-nopair) may take any count its box allows
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
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:Montserrat;letter-spacing:3.4pt", HW, 24, 13, 5), lh = T.f*1.3, H = 17 + T.n*lh + 9 + 1.2, y = 30 + (270 - 30 - H)/2;
    kk.style.top = y + 'pt'; ti.style.top = (y + 17) + 'pt'; ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = (T.n*lh) + 'pt'; ti.dataset.lines = T.n; ru.style.top = (y + 17 + T.n*lh + 9) + 'pt'; };
  // after the fill: the cover write-up sits on the frame's foot; the rooms above it grow down into any room it did not use (no empty band)
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = 766 - n*lh;
    const lbls = [...document.querySelectorAll('[data-slot^="front.strip"][data-slot$=".label"]')]; if(!lbls.length) return; const lb = Math.max(...lbls.map(l => parseFloat(l.style.top) + 11)), d = top - 16 - lb; su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt'; if(d <= 0) return;
    lbls.forEach(l => { l.style.top = (parseFloat(l.style.top) + d) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- Itinerary geometry (pt, panel trim 612 x 792) ----------------
  // B01's closed frame sits 20 pt in from the sides, 30 from the top and 16 from the foot; text keeps inside X0..X1.
  const FR = [20, 30, 592, 776], X0 = 36, X1 = 576, CW = X1 - X0;
  FO.FR = FR; FO.X0 = X0; FO.X1 = X1; FO.CW = CW;
  FO.frame = () => IT.frame(FR[0], FR[1], FR[2], FR[3], 1.2);
  // the centered heading of B01: accent eyebrow, Tenor Sans caps, the short accent rule (returns {html, y} with y under the rule)
  FO.head = (kicker, title, slot, y, o) => { o = o || {}; const ts = FXS.fitSize(String(title).replace(/\.$/, '').toUpperCase(), "font-family:Montserrat;letter-spacing:3.4pt", CW, o.max || 21, 12);
    let h = `<div class="abs fo-kick c" style="left:${X0}pt;top:${y}pt;width:${CW}pt" data-slot="${slot}.kicker" data-lines="1">${esc(String(kicker).toUpperCase())}</div>`;
    h += `<div class="abs fo-title c" style="left:${X0}pt;top:${y + 17}pt;width:${CW}pt;height:${ts*1.3}pt;font-size:${ts}pt;line-height:${ts*1.3}pt" data-slot="${slot}.title" data-lines="1">${esc(String(title).replace(/\.$/, '').toUpperCase())}</div>`;
    const ry = y + 17 + ts*1.3 + 7; h += `<div class="it-rule" style="left:${306 - 40}pt;top:${ry}pt;width:80pt"></div>`;
    return {html: h, y: ry + 1.2}; };
  // a photo tile with its name centered under it in the accent caps
  FO.tileC = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs fo-tile-l" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt" data-slot="${slot}.label" data-lines="1">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div>`;
  // how many lines a text sets in width w (greedy word wrap, measured)
  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  // a heading that wraps: the size (from max down) at which its last line is at least 80% of the box (the last-line rule), else the largest one-line size
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  FO.fitTitle = (t, fam, w, max, min, maxLines) => { for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w)) return {f, n: L.length, w}; }
    for(const k of [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6]) for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w*k); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w*k)) return {f, n: L.length, w: w*k}; }
    return {f: min, n: FO.wrapLines(t, `${fam};font-size:${min}pt`, w).length, w}; };
  // the soft lift of the dark field into a photo's top edge (B01: never down to the roof)
  FO.lift = (x, y, w, h) => `<div class="it-lift" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h || 22}pt"></div>`;
  // the standard contact card as B01's footer: agent on the left, the brokerage panel on the right with the one logo, knockout on the dark
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = IT.logoSrc(D); const ko = !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 180, lh = Math.min(46, H - 30), s = {name: 18, nameFloor: 15, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div style="--cc-display:Montserrat;--cc-body:Montserrat">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };

  // ---------------- FRONT (fold-over cover and flyer front: no agent, no brokerage) ----------------
  // B01's order, grown: the place in the accent eyebrow, the street in Spectral, the accent rule, the facts in accent caps,
  // the whole house edge to edge (the frame stops short of it and resumes past it; a dusk glow where the field meets it),
  // three rooms named in the accent caps, the write-up.
  // Design pass 11/15: a dusk exterior of the same house is the hero when the listing has one (photos.<id>.dusk)
  FO.heroId = (D, id) => { const ph = D.photos || {}, sp = SW.space(D, id); if((ph[id] || {}).dusk) return id; const d = Object.keys(ph).find(k => ph[k].dusk && ph[k].fullHouse && SW.space(D, k) === sp); return d || id; };
  FO.isDusk = (D, id) => !!((D.photos || {})[id] || {}).dusk;
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {};
    const hood = FXS.hood(L), place = [hood, FXS.placeLine(L)].filter(Boolean).join('  ·  '), hero = FO.heroId(D, F.hero || K.hero || 'front');
    let t = `<div class="abs it-eyebrow" style="left:${X0}pt;top:50pt;width:${CW}pt;text-align:center" data-slot="front.place" data-lines="1">${esc(place.toUpperCase())}</div>`;
    const ad = String(L.address || ''), as = FXS.fitSize(ad, "font-family:'Playfair Display';font-weight:500", CW, 46, 30);
    t += `<div class="abs fo-addr" data-slot="address" data-lines="1" style="left:${X0}pt;top:${64 + (46 - as)*0.6}pt;width:${CW}pt;height:${as*1.2}pt;font-size:${as}pt;line-height:${as*1.2}pt">${esc(ad)}</div>`;
    t += `<div class="it-rule" style="left:256pt;top:123pt;width:100pt;height:1.4pt"></div>`;
    const items = FXS.statItems(L).filter(x => !/^Built/.test(x)); const yr = L.yearBuilt || L.year; if(yr) items.push('Built ' + yr);
    const fx = items.join('  ·  ').toUpperCase(), fs = FXS.fitSize(fx, "font-family:Montserrat;font-weight:600;letter-spacing:2.6pt", CW, 13, 9);
    t += `<div class="abs fo-facts" style="left:${X0}pt;top:133pt;width:${CW}pt;height:18pt;font-size:${fs}pt;line-height:18pt" data-slot="front.facts" data-lines="1">${esc(fx)}</div>`;
    const HY = 176, HH = o.heroH || 348;
    let h = SW.heroHtml(D, hero, -9, HY, 630, HH, 'front.house', []) + IT.glow('top', -9, HY, 630, {dusk: FO.isDusk(D, hero)});
    // one large serif line (the paragraph diluted the hero; its facts are inside and on the back), and the rooms larger above it
    const line = String(K.line || '').replace(/\.$/, ''), ls = line ? FXS.fitSize(line, "font-family:'Playfair Display';font-weight:500", CW, 23, 15) : 0, ly = 766 - ls*1.3 - 1;
    if(line) t += `<div class="abs" style="left:${X0}pt;top:${ly}pt;width:${CW}pt;height:${ls*1.3}pt;font-weight:500;font-size:${ls}pt;line-height:${ls*1.3}pt;font-family:var(--it-serif);color:var(--it-on);text-align:center;white-space:nowrap" data-slot="front.line" data-lines="1">${esc(line)}</div>`;
    const strip = (o.strip || P.strip || []).slice(0, 3), gap = 12, sw_ = (CW - (strip.length - 1)*gap)/Math.max(1, strip.length), SY = HY + HH + 14, SH = (line ? ly - 15 : 762) - 19 - SY;
    strip.forEach((id, i) => { h += FO.tileC(D, id, X0 + i*(sw_ + gap), SY, sw_, SH, 'front.strip' + i); });
    return h + t + FO.frame();
  };

  // Design pass 11/15: the two-sided flyer's front is its own composition in the same hand as the fold-over cover (one thread, two
  // compositions). Photo first: the whole house bleeds off the top and both sides, the frame runs behind it and resumes below (the set's
  // signature); then the street flush left in Spectral under the place, the facts stacked flush right; three rooms; the write-up.
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const HY = -9, HH = 429, hero = FO.heroId(D, F.hero || K.hero || 'front');
    let h = SW.heroHtml(D, hero, -9, HY, 630, HH, 'front.house', []) + IT.glow('bottom', -9, HY + HH, 630, {g: 22, d: 30, dusk: FO.isDusk(D, hero)});
    const items = FXS.statItems(L).filter(x => !/^Built/.test(x)); const yr = L.yearBuilt || L.year; if(yr) items.push('Built ' + yr);
    const fcss = 'font-family:Montserrat;font-weight:600;letter-spacing:2.4pt;font-size:10.5pt', fw = Math.ceil(Math.max(...items.map(t => FXS.width(t.toUpperCase(), fcss)))) + 4, ly = HY + HH + 16, n = items.length, flh = Math.min(17, 66/n);
    let t = ''; items.forEach((it, i) => { t += `<div class="abs fo-facts" style="left:${X1 - fw}pt;top:${ly + 2 + i*flh}pt;width:${fw}pt;height:${flh}pt;font-size:10.5pt;line-height:${flh}pt;letter-spacing:2.4pt;text-align:right" data-slot="front.facts${i}" data-lines="1">${esc(it.toUpperCase())}</div>`; });
    t += `<div class="it-vhair" style="left:${X1 - fw - 16}pt;top:${ly + 4}pt;height:${n*flh - 4}pt"></div>`;
    const aw = X1 - fw - 32 - X0, hood = FXS.hood(L), place = [hood, FXS.placeLine(L)].filter(Boolean).join('  ·  '), ad = String(L.address || ''), as = FXS.fitSize(ad, "font-family:'Playfair Display';font-weight:500", aw, 40, 24);
    t += `<div class="abs it-eyebrow" style="left:${X0}pt;top:${ly}pt;width:${aw}pt" data-slot="front.place" data-lines="1">${esc(place.toUpperCase())}</div>`;
    t += `<div class="abs fo-addr" data-slot="address" data-lines="1" style="left:${X0}pt;top:${ly + 14 + (40 - as)*0.5}pt;width:${aw}pt;height:${as*1.2}pt;font-size:${as}pt;line-height:${as*1.2}pt;text-align:left">${esc(ad)}</div>`;
    t += `<div class="it-rule" style="left:${X0}pt;top:${ly + 68}pt;width:100pt;height:1.4pt"></div>`;
    const strip = (o.strip || P.flyerStrip || P.strip || []).slice(0, 3), gap = 12, sw_ = (CW - (strip.length - 1)*gap)/Math.max(1, strip.length), SY = ly + 84, SH = strip.length < 3 ? 110 : 96;
    strip.forEach((id, i) => { h += FO.tileC(D, id, X0 + i*(sw_ + gap), SY, sw_, SH, 'front.strip' + i); });
    { const wy = SY + SH + 28, avail = 768 - wy, nl = o.lines || 4, lh = Math.min(avail/nl, 19), fs2 = Math.min(12, +(lh/1.5).toFixed(2));
      t += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="${nl},${nl - 1}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0}pt;top:${wy + (avail - nl*lh)/2}pt;width:${CW}pt;height:${nl*lh}pt;font-size:${fs2}pt;line-height:${lh}pt"></div>`); }
    return h + t + FO.frame();
  };
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

  // Design pass 11/15: the one display moment of an inside panel. The accent eyebrow (tracked caps), then the headline in the address face
  // (Spectral), sentence case, on two lines at the largest size from `max` down to 30 pt; a short headline takes a narrower measure so it
  // still breaks in two; the short accent rule under it. An eyebrow that only repeats its headline's words is left out. Returns {html, y}.
  FO.HORIZON = 196;   // one horizon across the inside spread: both pages' photos start here, the headlines end on one baseline above it
  FO.head2 = (kicker, title, slot, o) => { o = o || {}; const t = String(title || '').replace(/\.$/, '').replace(/(^| )([AaI]) /g, '$1$2 '), fam = "font-family:'Playfair Display';font-weight:500;letter-spacing:-.2pt", x = o.x == null ? X0 : o.x;   // a one-letter word never ends a display line
    const words = q => new Set((String(q).toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length > 2 && !['the', 'and', 'with'].includes(w))), kw = [...words(kicker)], tw = words(title), rep = kw.length > 0 && kw.every(w => tw.has(w) || tw.has(w.replace(/s$/, '')) || tw.has(w + 's'));
    const nl = (ff, ww) => { let n = 1, cur = ''; t.split(' ').forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, `${fam};font-size:${ff}pt`) > ww - 1){ n++; cur = wd; } else cur = tr; }); return n; };
    let f = o.max || 44, w = o.w || 500;
    while(f > 30 && nl(f, w) > 2) f -= 0.5;
    while(nl(f, w) > 2 && w < CW) w += 10;
    const one = FXS.width(t, `${fam};font-size:${f}pt`); if(one <= w - 1){ let ww = one*0.56; while(nl(f, ww) > 2 && ww < w) ww += 4; w = ww; }
    const lh = +(f*1.16).toFixed(2), hb = FO.HORIZON - 27, hy = hb - 2*lh, ky = hy - 17;
    let h = rep || !kicker ? '' : `<div class="abs fo-kick" style="left:${x}pt;top:${ky}pt" data-slot="${slot}.kicker" data-lines="1">${esc(String(kicker).toUpperCase())}</div>`;
    h += `<div class="it-head" style="left:${x}pt;top:${hy}pt;width:${Math.ceil(w) + 2}pt;height:${2*lh}pt;font-size:${f}pt;line-height:${lh}pt" data-slot="${slot}.title" data-lines="2" data-fine="1">${esc(t)}</div>`;
    // one accent rule across the fold: the same height on both inside pages, running from the text margin through the frame to the fold,
    // where it meets its match on the other page (the frame breaks where the rule passes through it)
    const fold = o.fold || (/^left/.test(slot) ? 'r' : /^right/.test(slot) ? 'l' : ''), rx = fold === 'l' ? -9 : X0, rw = fold === 'r' ? 621 - X0 : fold === 'l' ? X1 + 9 : CW;
    h += `<div class="it-rule" style="left:${rx}pt;top:${hb + 9}pt;width:${rw}pt;height:1pt"></div>`;
    if(fold) h += `<div class="it-cut" style="left:${fold === 'r' ? FR[2] - 3 : FR[0] - 3}pt;top:${hb + 8}pt;width:7pt;height:3pt"></div>`;
    return {html: h, y: FO.HORIZON}; };

  // Design pass 11/15: a labeled table in the set's own panel. Every row is one full line: the label in accent caps in a column as wide as
  // the longest label needs (labels never touch values), then the fullest true wording of the row that sets on one line. The type size
  // (10 to 12 pt) and the value column's width are chosen so the most rows fill 86% or more of their line (set ragged: a one-line row justified opens wide word gaps).
  // A row that cannot fill its line is left out while four or more remain (a short row reads as a mistake); kept rows keep their order.
  FO.tableRows = (items0, liw, taken, o) => { o = o || {}; const lcss = 'font-family:Montserrat;font-weight:500;font-size:8.6pt;letter-spacing:2.2pt', LW0 = o.stack ? 0 : Math.ceil(Math.max(...items0.map(it => FXS.width(String(it.l).toUpperCase(), lcss)))) + 20;
    const ok = a => !taken || !taken(a); let best = null; const MIN = 0.86, opts = o.stack ? (o.Vs || [178, 184, 190, 196, 202, 208, 214]).map(V => [0, V]) : [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60].map(d => [LW0 + d, liw - LW0 - d]);
    for(let f = o.stack ? 10 : 10.5; f <= (o.stack ? 11.51 : 12.01); f += 0.25) for(const [LW, V] of opts){ const css = `font-family:Montserrat;font-weight:400;font-size:${f}pt`;
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
    for(let f = 10; f <= 11.51; f += 0.25) for(const V of (o.Vs || [184, 190, 196, 202, 208, 214, 220])){ const css = `font-family:Montserrat;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== 2 || Lw[0] < 0.8*V || Lw[1] < 0.9*V) return; const sc = (Lw[0] + Lw[1])/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 4), score = n*100 + f*2 - V*0.05;
      if(!best || score > best.score) best = {score, f, V, LW: 0, rows: rows.slice(0, o.maxRows || 4)}; }
    return best; };
  FO.tableStack2 = (T, kicker, heading, x, y, w, hgt, slot) => { const n = Math.max(1, T.rows.length), lx = x + 18, liw = w - 36, hs = heading ? FXS.fitSize(String(heading).replace(/\.$/, ''), "font-family:'Playfair Display';font-weight:500", liw, 15, 11) : 0, top = heading ? 56 : 36, rowH = (hgt - top - 9)/n, lh = +(T.f*1.4).toFixed(2);
    let b = `<div class="it-wbox lt" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 15}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 29}pt;width:${liw}pt;font-size:${hs}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    T.rows.forEach((r, i) => { const ry = y + top + i*rowH, c0 = ry + (rowH - 11 - 3 - 2*lh)/2;
      b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .5}pt;width:${liw}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${c0 + 1}pt;width:${liw}pt;color:var(--it-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx}pt;top:${c0 + 14}pt;width:${liw + 1}pt;height:${2*lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--it-font);color:var(--fx-soft);overflow:hidden" data-slot="${slot}.list.t${i}" data-lines="2">${esc(r.t)}</div>`; });
    return `<div class="it-lt">${b}</div>`; };
  FO.table = (T, kicker, heading, x, y, w, hgt, slot) => { const n = T.rows.length, lx = x + 18, liw = w - 36, top = heading ? 58 : 36, rowH = (hgt - top - 12)/n;
    let b = `<div class="it-wbox" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 16}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 30}pt;width:${liw}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    T.rows.forEach((r, i) => { const ry = y + top + i*rowH, lh = Math.round(T.f*1.5);
      if(i) b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .4}pt;width:${liw}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${ry + rowH/2 - 5.5}pt;width:${T.LW - 8}pt;color:var(--it-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx + T.LW}pt;top:${ry + rowH/2 - lh/2}pt;width:${T.V}pt;height:${lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--it-font);color:var(--fx-soft);white-space:nowrap;overflow:hidden;" data-slot="${slot}.list.t${i}" data-lines="1">${esc(r.t)}</div>`; });
    return b; };
  // the room's card beside its big photo: a narrow panel as tall as the photo, each row its label in accent caps over one full line of true detail; the rows share the height evenly (the box is sized to its content)
  FO.tableStack = (T, kicker, heading, x, y, w, hgt, slot) => { const n = T.rows.length, lx = x + 18, liw = w - 36, hs = heading ? FXS.fitSize(String(heading).replace(/\.$/, ''), "font-family:'Playfair Display';font-weight:500", liw, 15, 11) : 0, top = heading ? 56 : 36, rowH = (hgt - top - 9)/n, lh = Math.round(T.f*1.4);
    let b = `<div class="it-wbox" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 15}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 29}pt;width:${liw}pt;font-size:${hs}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    T.rows.forEach((r, i) => { const ry = y + top + i*rowH, c0 = ry + (rowH - 11 - 3 - lh)/2;
      b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .5}pt;width:${liw}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${c0 + 1}pt;width:${liw}pt;color:var(--it-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx}pt;top:${c0 + 14}pt;width:${liw}pt;height:${lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--it-font);color:var(--fx-soft);white-space:nowrap;overflow:hidden;" data-slot="${slot}.list.t${i}" data-lines="1">${esc(r.t)}</div>`; });
    return b; };

  // ---------------- INSIDE LEFT (the living level). Design pass 11/15: the eyebrow and the two-line Spectral headline; the kitchen big,
  // bleeding off the outer edge (it breaks the frame), with its card beside it at the same height (the room's facts, or the house's
  // "What's new" story, one full line a row); under them a locked row of two captioned rooms. ----------------
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, ids = P.left || [], heroC = FXS.cardFor(D, ids[0]), rowC = FO.cards(D, ids.slice(1, 3));
    const hd = FO.head2(I.kicker, I.title, 'left'), Y0 = hd.y; let h = hd.html;
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), cw = t => (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new', 'a', 'the', 'and', 'of', 'with', 'in'].includes(w)).map(stem), says = (b, a) => { const bw = cw(b), aw = new Set(cw(a)); return bw.length > 0 && bw.every(w => aw.has(w)); };   // a row repeats a back-panel bullet only when it says all of that bullet's words
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside || {}).items || SFb.inside, (BXb.outside || {}).items || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const PH = 282, L = 4, clh = 14, T = FO.tableRows2((box.items || []).slice(0, 10), a => SW.grams4(a).some(g => backG.has(g)) || backT.some(b => says(b, a)), {maxRows: 4});
    const cardW = T.V + 36, g = 12, HR = X1 - cardW - g, L0 = FXS.leadLabel(heroC.lead);
    h += FXS.box(D, heroC.photo, -9, Y0, HR + 9, PH, 'left.wide');
    const y2 = Y0 + PH + 46;   // the kitchen's label hangs 5 pt under its photo; the row starts well clear of it, so the label reads as the kitchen's, not the row's
    h += `<div class="it-cut" style="left:-9pt;top:${Y0 + PH}pt;width:${HR + 9}pt;height:${y2 - Y0 - PH - 8}pt"></div>`;   // the label belongs to the photo: tight under it, inside its width, and the frame does not restart beside it
    h += `<div class="abs" style="left:${X0}pt;top:${Y0 + PH + 5}pt;width:${HR - X0}pt;white-space:nowrap"><div class="lbl" data-slot="left.wide.label" data-lines="1">${esc(L0.name.toUpperCase())}</div>${L0.size ? `<div class="lbl sz" data-size="1">${esc(L0.size)}</div>` : ''}</div>`;
    h += FO.tableStack2(T, box.kicker || 'The kitchen', box.heading, HR + g, Y0, cardW, PH, 'left');
    const n = Math.max(1, rowC.length), W2 = (CW - (n - 1)*14)/n, RH = 766 - y2 - 25 - L*clh;
    rowC.forEach((c, i) => { h += FXS.captioned(D, c, X0 + i*(W2 + 14), y2, W2, RH, L, 'left.photo' + i, {fs: 11, lh: clh, min: 3}).replace(`data-slot="left.photo${i}" data-room`, `data-slot="left.photo${i}" data-nopair="1" data-room`); });
    return h + FO.frame();
  };

  // ---------------- INSIDE RIGHT (bedrooms and baths). Design pass 11/15: no more four equal photos. The eyebrow and the two-line headline;
  // one dominant photo (the best room) bleeding off the outer edge with its write-up under it at full width; then a locked row of
  // smaller captioned photos on matching gutters (baths and empty rooms go here, last and small). ----------------
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs = FO.cards(D, P.right || []);
    const hd = FO.head2(R.kicker || '', R.title || '', 'right'), Y0 = hd.y; let h = hd.html;
    const rest = cs.slice(1, 4), L1 = 3, lh1 = 15.5, L2 = 5, lh2 = 13, g = 13, tw = (CW - (rest.length - 1)*g)/Math.max(1, rest.length), gapR = 16;
    const avail = 766 - Y0 - (25 + L1*lh1) - gapR - (25 + L2*lh2), DH = Math.round(avail*(rest.length > 2 ? 0.63 : 0.58)), RH = avail - DH;
    h += FXS.captioned(D, cs[0], X0, Y0, 621 - X0, DH, L1, 'right.photo0', {fs: 11.5, lh: lh1, min: 3, tw: CW});
    const y2 = Y0 + DH + 25 + L1*lh1 + gapR;
    rest.forEach((c, i) => { h += FXS.captioned(D, c, X0 + i*(tw + g), y2, tw, RH, L2, 'right.photo' + (i + 1), {fs: 10, lh: lh2, min: 3}).replace(`data-slot="right.photo${i + 1}" data-room`, `data-slot="right.photo${i + 1}" data-nopair="1" data-room`); });
    return h + FO.frame();
  };
  FO.rightFit = () => {}; FO.leftHead = () => {};
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'), col = document.querySelector('[data-sumcol]'); if(!su || !col || !su.textContent.trim()) return; const [t0, t1] = col.dataset.sumcol.split('|').map(Number), n = SW.lines(su).n, lh = Math.min(22, (t1 - t0)/n); su.style.lineHeight = lh + 'pt'; su.style.height = (n*lh) + 'pt'; };

  // ---------------- BACK (fold-over) and flyer back ----------------
  // each nearby place sits centered top to bottom between its rules (owner 11/7, p6)
  const nearRows = (D, x, y, w, o) => { o = o || {}; const N = ((D.sw || {}).back || {}).nearby || [], top = o.top == null ? 20 : o.top, rh = o.rowH || 28, ds = o.d || 15, ps = o.p || 8.5;
    const pfit = Math.min(...N.slice(0, 3).map(n => { let q = ps; while(q > 8.5 && FXS.width(String(n.dist), `font-family:'Playfair Display';font-weight:500;font-size:${ds}pt`) + 9 + FXS.width(String(n.place).toUpperCase(), `font-family:Montserrat;font-weight:500;letter-spacing:1.6pt;font-size:${q}pt`) > w - 3) q -= 0.2; return q; }));
    return N.slice(0, 3).map((n, i) => `<div class="fo-near" style="left:${x}pt;top:${y + top + i*rh}pt;width:${w}pt;height:${rh - 0.5}pt" data-slot="back.near${i}" data-lines="1" data-fine="1"><div class="in"><span class="d" style="font-size:${ds}pt">${esc(n.dist)}</span><span class="p" style="font-size:${pfit}pt">${esc(n.place)}</span></div></div>`).join('') + FO.kick('Nearby', x, y, 'back.near.kicker'); };
  // the plan in its box (the design's own dark background; the plan prints clear with light lines, PlanInk). Design pass 11/15: the box is as
  // wide as the drawing needs and no wider (a narrow plan gets a narrow box; the write-up beside it takes the rest)
  FO.planBox = (D, x, y, maxH, maxW) => { const A = D.plan.turn && D.plan.kind === 'color' ? 270 : undefined, rot = !!D.plan.turn, noteW = Math.ceil(FXS.width((D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate.', 'font-family:Montserrat;font-size:8pt')) + 34;
    const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: rot ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: rot, angle: A}); let cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 40, D.plan.minCard || 0, noteW, 188));
    // the plan may print smaller than the box allows (its own resolution): the box then follows the drawing, never a small plan in a big box
    for(let hh = maxH; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: cw - 28.8, h: hh}, {allowRotate: rot, angle: A}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')){ if(big.usedW) cw = Math.min(cw, Math.max(Math.ceil(big.usedW) + 40, D.plan.minCard || 0, noteW, 188)); break; } }
    return FXS.planCard(D, x, y, cw, maxH); };
  FO.CARD_H = 62; FO.CARD_Y = 688;   // B01's footer: the card at 694, the fine print at 762, inside the frame
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:756pt;width:${CW}pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  // Design pass 11/15: the fold-over back follows the flyer back. The plan in a box its own width (or the big outdoor photo) with "The house"
  // beside it at the rest of the width; a locked row of captioned photos; the set's panel with the two lists and Nearby (low, on this side
  // only, nothing empty under it); B01's footer card. The internal plan note ("the living room on the plan") is gone.
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    const rowIds = flyer ? (P.flyerBack || []).slice(0, 3) : (P.backRow || ['bath2']).slice(0, 3), rowCards = FO.cards(D, rowIds);
    const L0 = 40, R0 = 572, TOP = 46;   // inside the frame
    let h = '', top, leftW;
    const LV = hasPlan ? (D.plan.levels || []) : [], tall = hasPlan && (LV.length >= 4 || (LV.length === 1 && LV[0].h/LV[0].w > 1.5));
    const TH = tall ? 464 : flyer ? (P.flyerTH || 300) - 10 : (P.backTH || 282);
    if(hasPlan){ const pc = FO.planBox(D, L0, TOP, TH, tall ? 300 : flyer ? 360 : 340); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom; leftW = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])); }
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    if(!hasPlan){   // the big outdoor photo: as tall as leaves the row under it a full-size photo
      const nb0 = Math.max(Math.min(c1.length, 5), Math.min(c2.length, 5), 3), room = FO.CARD_Y - 14 - (16 + 20 + nb0*22 + 12) - 14 - (25 + 3*13.5) - 18 - (25 + 3*14) - TOP, tph = Math.max(150, Math.min(214, room - 122));
      leftW = Math.round(336*Math.max(0.86, tph/214)); const c = FXS.cardFor(D, topId); h += FXS.captioned(D, c, L0, TOP, leftW, tph, 3, 'back.top', {fs: 11, lh: 14, min: 3}); top = TOP + tph + 25 + 3*14; }
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s)), ax = L0 + leftW + 20, aw = R0 - ax;
    const BOXB = FO.CARD_Y - 14, kickT = +(D.listing || {}).stories > 1 ? 'Floor by floor' : 'Room by room';
    const ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, ''), hf = ht ? FXS.fitSize(ht, "font-family:'Playfair Display';font-weight:500", aw - 2, 18, 12) : 0, hlh = hf*1.25, hh = ht ? hlh + 8 : 0;
    const head = y => FO.kick(kickT, ax, y, 'back.about.title') + (ht ? `<div class="abs" data-tall="1" style="left:${ax}pt;top:${y + 16}pt;width:${aw}pt;height:${hlh}pt;font-weight:500;font-size:${hf}pt;line-height:${hlh}pt;font-family:var(--it-serif);color:var(--it-on);white-space:nowrap" data-slot="back.about.head" data-lines="1">${esc(ht)}</div>` : '');
    let rowEnd;
    if(tall){
      // the plan runs the height of the page's upper part at its own shape; beside it one captioned photo, then the write-up as two short
      // paragraphs set ragged (no rivers); the photo takes up whatever the paragraphs leave (FO.tallStack)
      const c0 = rowCards[0], PHt = 118, lh = 15.5, yE = TOP + PHt + 25 + 3*13.5 + 14, T0 = yE + 18 + hh, R = top - T0 - 9, N = Math.max(6, Math.floor(R/lh)), n1 = Math.ceil(N/2), n2 = N - n1;
      if(c0) h += FXS.captioned(D, c0, ax, TOP, aw, PHt, 3, 'back.photo0', {fs: 10.5, lh: 13.5, min: 3});
      h += head(yE).replace('class="abs fo-kick"', 'class="abs fo-kick" data-tall="1"');
      const para = (list, y, n, slot) => FO.wu(list, ax, y, aw, n*lh + 0.01, slot, 11, lh, 'body').replace(`data-slot="${slot}"`, `data-slot="${slot}" data-narrow="0" data-fill="0.9" data-lfill="0.8" data-rag="1" data-tall="1" data-para="1"${P.pool ? ` data-pool="${P.pool}"` : ''}`);   // any line count from n down to three: the photo above takes what a shorter paragraph leaves
      h += para(keep(f2), T0, n1, 'back.about') + para(keep(f1), T0 + n1*lh + 9, n2, 'back.about2');
      h += `<div data-tallcol="${top}" style="display:none"></div>`;
      rowEnd = top;
    } else {
      const T0 = TOP + 20 + hh, n = Math.floor((top - T0)/16), lh = +((top - T0)/n).toFixed(3);
      h += head(TOP + 2) + FO.full(FO.wu(((k => { const a = k.filter(x => f2.includes(x)), b = k.filter(x => !f2.includes(x)); return a.slice(0, 7).concat(b.slice(0, 7)); })(keep(f2.concat(f1)))), ax, T0, aw, n*lh + 0.01, 'back.about', 11, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${aw < 240 ? ' data-rag="1"' : ''} data-span="${(top - T0).toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
      const y0 = top + 18, n2 = rowCards.length, gap = 12, tw = (R0 - L0 - (n2 - 1)*gap)/n2, nb = Math.max(Math.min(c1.length, 5), Math.min(c2.length, 5), 3), need = 16 + 20 + nb*22 + 12, PH = Math.max(104, Math.min(n2 > 2 ? 214 : 190, BOXB - need - 14 - y0 - 25 - 3*13.5));
      rowCards.forEach((c, i) => { h += FXS.captioned(D, c, L0 + i*(tw + gap), y0, tw, PH, 3, 'back.photo' + i, {fs: 10.5, lh: 13.5, min: 3}); });
      rowEnd = y0 + PH + 25 + 3*13.5;
    }
    const by = rowEnd + 14, BH = BOXB - by;
    let t = `<div class="it-wbox${flyer ? ' lt' : ''}" style="left:${L0}pt;top:${by}pt;width:${R0 - L0}pt;height:${BH}pt"></div>`;
    { const ty = by + 16, ly = ty + 20, W = [150, 112], X = [L0 + 18, L0 + 18 + 150 + 12, L0 + 18 + 150 + 12 + 112 + 14], fs = 10;
      const cap = Math.max(3, Math.min(5, Math.floor((BOXB - 14 - ly)/19))), b1 = FXS.bullets(c1, X[0], 0, W[0], 1, 'x', cap, fs).n, b2 = FXS.bullets(c2, X[1], 0, W[1], 1, 'x', cap, fs).n, rows = Math.max(b1, b2, 3), rh = Math.min(30, (BOXB - 14 - ly)/rows);
      t += FO.kick(t1, X[0], ty, 'back.updates.title') + FXS.bullets(c1, X[0], ly, W[0], rh, 'back.updates', cap, fs).html;
      t += FO.kick('Outside', X[1], ty, 'back.outside.title') + FXS.bullets(c2, X[1], ly, W[1], rh, 'back.outside', cap, fs).html;
      t += nearRows(D, X[2], ty, R0 - 16 - X[2], {top: ly - ty, rowH: rows*rh/3, d: 14, p: 8.6}); }
    h += `<div class="${flyer ? 'it-lt' : 'it-ink'}">${t}</div>`;
    h += FO.contact(D, X0, window.__cardY || FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D);
    return {html: h + FO.frame(), issues};
  };
  FO.tallStack = () => { const col = document.querySelector('[data-tallcol]'); if(!col) return; const bottom = +col.dataset.tallcol, ps = [...document.querySelectorAll('[data-para]')]; if(ps.length < 2) return;
    const [a, b] = ps, la = parseFloat(a.style.lineHeight), lb = parseFloat(b.style.lineHeight), na = SW.lines(a).n, nb = SW.lines(b).n;
    a.style.height = (na*la) + 'pt'; b.style.top = (parseFloat(a.style.top) + na*la + 9) + 'pt'; b.style.height = (nb*lb) + 'pt';
    const free = bottom - 8 - (parseFloat(b.style.top) + nb*lb); if(free < 1) return;
    const cap = document.querySelector('.cap .a[data-slot="back.photo0"]'), ph = document.querySelector('.ph[data-slot-photo="back.photo0"]'), pb = ph && ph.parentElement, lbl = document.querySelector('[data-slot="back.photo0.label"]');
    if(pb) pb.style.height = (parseFloat(pb.style.height) + free) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + free) + 'pt'; if(cap) cap.style.top = (parseFloat(cap.style.top) + free) + 'pt';
    document.querySelectorAll('[data-tall]').forEach(e => { e.style.top = (parseFloat(e.style.top) + free) + 'pt'; }); };
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

  // =====================================================================================================================================
  // ITINERARY layouts (B47). The thread: the light main-color tint paper; the main-color title bar run in from the trim edge with its 3 pt
  // accent line on top and the words in Montserrat 800 caps; the ruled itinerary table (tracked caps labels in the main color left of one
  // vertical hairline, values right, hairlines between rows, values in Playfair); numbered stops in Playfair (the sign-in sheet's row
  // numbers): the cover lists the tour, the inside numbers every room on its photo and in the table; photos square, the rooms in a column
  // that bleeds off the outer edge (the flyer's own column); one white box with a thin accent edge. Every page layout below is new.
  // =====================================================================================================================================
  const BARF = "font-family:Montserrat;font-weight:800;letter-spacing:1.4pt";
  FO.bar = (x, y, w, h, extra) => `<div class="it-bar" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${extra || ''}"></div>`;
  // the bar's words: uppercase, the largest size (max..min) at which they set in maxLines lines in w; the last line of two never under 45% of the first
  FO.barFit = (t, w, max, min, maxLines) => { const T = String(t || '').replace(/\.$/, '').toUpperCase();
    for(let f = max; f >= min; f -= 0.5){ const L = FO.wrapLines(T, `${BARF};font-size:${f}pt`, w), S = FO.splitLines(T, `${BARF};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || (L[L.length - 1] >= 0.4*Math.max(...L) && S[S.length - 1].split(' ').length >= 2))) return {f, n: L.length, T}; }
    return {f: min, n: FO.wrapLines(T, `${BARF};font-size:${min}pt`, w).length, T}; };
  FO.balW = (fit, w) => { if(fit.n < 2) return w; let lo = w*0.4, hi = w; for(let k = 0; k < 18; k++){ const m = (lo + hi)/2; if(FO.wrapLines(fit.T, `${BARF};font-size:${fit.f}pt`, m).length <= fit.n) hi = m; else lo = m; } return Math.min(w, Math.ceil(hi) + 10); };
  FO.barText = (fit, x, y, w, slot) => (w = FO.balW(fit, w), `<div class="it-bar-t" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${fit.n*fit.f*1.08}pt;font-size:${fit.f}pt;line-height:${fit.f*1.08}pt;white-space:${fit.n < 2 ? 'nowrap' : 'normal'}" data-slot="${slot}" data-lines="${fit.n}">${esc(fit.T)}</div>`);
  FO.tag = (t, x, y, w, slot, al) => `<div class="it-tag" style="left:${x}pt;top:${y}pt;width:${w}pt${al ? ';text-align:' + al : ''}" data-slot="${slot}" data-lines="1">${esc(String(t || '').toUpperCase())}</div>`;
  FO.splitLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out; };
  // a rail label: one line, or (a long label in the narrow rail) one element per line, so no line counts as a short paragraph line
  FO.lab = (t, x, y, w, slot, lines) => { const T = String(t || '').toUpperCase(), L = lines > 1 ? FO.splitLines(T, 'font-family:Montserrat;font-weight:700;font-size:8.6pt;letter-spacing:2.8pt', w) : [T];
    return L.map((ln, i) => `<div class="it-lab" style="left:${x}pt;top:${y + i*12}pt;width:${w}pt" data-slot="${slot}${i ? '.' + (i + 1) : ''}" data-lines="1">${esc(ln)}</div>`).join(''); };
  FO.hr = (x, y, w) => `<div class="it-hr" style="left:${x}pt;top:${y}pt;width:${w}pt"></div>`;
  FO.vr = (x, y, h) => `<div class="it-vr" style="left:${x}pt;top:${y}pt;height:${h}pt"></div>`;
  FO.num = (n, x, y, fs, slot) => `<div class="it-num" style="left:${x}pt;top:${y}pt;font-size:${fs}pt" data-slot="${slot}" data-lines="1" data-fine="1">${esc(n)}</div>`;
  FO.nn = i => String(i).padStart(2, '0');
  // a stop number set in the photo's lower outer corner (inside the photo box, so it is the photo's own mark)
  FO.stopTag = (html, n, side, s) => { s = s || 26; const tag = `<div class="it-stop" style="${side === 'l' ? 'left' : 'right'}:0;bottom:0;width:${s}pt;height:${s}pt;font-size:${s*0.5}pt" data-slot="stop.${n}" data-lines="1" data-fine="1">${esc(n)}</div>`;
    return html.replace(/(<div class="ph"[^>]*>)/, `$1${tag}`); };
  FO.photoAt = (D, id, x, y, w, h, slot, n, side) => { let p = FXS.box(D, id, x, y, w, h, slot); return n ? FO.stopTag(p, n, side) : p; };
  FO.roomName = (D, id) => FO.lead(D, id).split(/ and |, /)[0];
  // the tour order: the inside left (the kitchen, then its column) and the inside right (the lead room, then its column)
  FO.tour = D => { const P = (D.sw || {}).plan || {}, l = (P.left || []).slice(0, 3), r = (P.right || []).slice(0, 4); return l.concat(r).filter(id => (D.photos || {})[id]); };
  // a table row about one photo: the room's name (and the plan's size, once on the piece) on the first line, then its write-up, whole
  // sentences of the room's own pool, three lines or more at 90%+ (filled by the engine); the photo's stop number sits in the rail
  FO.entry = (D, c, rx, vx, y, vw, lines, slot, num, o) => { o = o || {}; c = FXS.augment(D, c); const L0 = FXS.leadLabel(c.lead), lh = o.lh || 14.5, fs = o.fs || 10.5;
    let nm = L0.name; const lw = t => FXS.width(t.toUpperCase(), 'font-family:Montserrat;font-weight:700;font-size:8.6pt;letter-spacing:2.4pt'); if(lw(nm) > vw) nm = nm.split(/ and |, /)[0];
    const showSize = L0.size && !(FXS.__sizes = FXS.__sizes || new Set()).has(L0.size) && lw(nm) + FXS.width(L0.size, 'font-family:Montserrat;font-weight:500;font-size:8.6pt;letter-spacing:1pt') + 14 <= vw;
    let h = num ? FO.num(num, rx, y - 3, o.ns || 24, slot + '.num') : '';
    h += `<div class="abs" style="left:${vx}pt;top:${y}pt;width:${vw}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${vw}pt">${esc(nm.toUpperCase())}</div>${showSize ? (FXS.__sizes.add(L0.size), `<div class="lbl sz" data-size="1">${esc(L0.size)}</div>`) : ''}</div>`;
    h += `<div class="abs cap"><div class="a" style="position:absolute;left:${vx}pt;top:${y + 17}pt;width:${vw}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-room="${esc(nm)}" data-lh="${lh}" data-hbox="${lines*lh}" data-lines="${lines}" data-min="3" data-narrow="0" data-nopair="1" ${FXS.sd(c.s)}></div></div>`;
    return h; };
  // the kitchen / "What's new" card as itinerary rows: each row its label in the rail, its value one or two full lines (one line 86%+;
  // two lines: the first 80%+, the last 90%+). One type size and measure for the whole card; a row that cannot fill is left out.
  // Repeat filter (ported from Night Fade): a row is dropped only for a fact the back's printed lists really say (a two-word item repeats
  // only when both its words are in the row), and a row never opens on a pronoun.
  FO.railRows = (items0, taken, Vs, o) => { o = o || {}; const ok = a => !taken || !taken(a); let best = null;
    for(let f = 10; f <= 13.51; f += 0.5) for(const V of Vs) for(const n of (o.ns || [1, 2])){ const css = `font-family:Montserrat;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t) || /^(It|Its|They|This|That)\b/.test(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== n) return; if(n === 1 ? Lw[0] < 0.86*V : (Lw[0] < 0.8*V || Lw[n - 1] < 0.9*V)) return; const sc = Lw.reduce((a, b) => a + b, 0)/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const k0 = Math.min(rows.length, o.maxRows || 4), k = o.maxH ? Math.min(k0, Math.floor(o.maxH/(n*f*1.42 + 12))) : k0, score = k*100 - Math.abs(f - 11.5)*3 + (n === 2 ? 2 : 0) + V*0.03;
      if(!best || score > best.score) best = {score, f, V, n, rows: rows.slice(0, k)}; }
    return best; };
  FO.kitchenTaken = D => { const K = D.sw || {}, SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    return a => SW.grams4(a).some(g => backG.has(g)) || backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w)))); };
  FO.railTable = (T, rx, vx, y, vw, rowH, slot) => { const lh = +(T.f*1.42).toFixed(2), lw = vx - rx - 8; let h = '', ry = y;
    T.rows.forEach((r, i) => { const ln = FO.wrapLines(String(r.l).toUpperCase(), 'font-family:Montserrat;font-weight:700;font-size:8.6pt;letter-spacing:0.7pt', lw).length, rh = Math.max(rowH, ln*11 + 10, T.n*lh + 8), ty = ry + (rh - T.n*lh)/2;
      FO.splitLines(String(r.l).toUpperCase(), 'font-family:Montserrat;font-weight:700;font-size:8.6pt;letter-spacing:0.7pt', lw).forEach((t, q) => { h += `<div class="abs fo-li-l" style="left:${rx}pt;top:${ry + (rh - ln*11)/2 + q*11}pt;width:${lw}pt" data-slot="${slot}.list.l${i}${q ? '.' + (q + 1) : ''}" data-lines="1">${esc(t)}</div>`; });
      h += `<div class="abs fo-li-t" style="left:${vx}pt;top:${ty}pt;width:${T.V + 1}pt;height:${T.n*lh}pt;font-size:${T.f}pt;line-height:${lh}pt;white-space:normal" data-slot="${slot}.list.t${i}" data-lines="${T.n}">${esc(r.t)}</div>`;
      ry += rh; h += FO.hr(rx, ry, vx + vw - rx); });
    FO.__rtH = ry - y; return h; };
  // the inside spread's one title bar: across both pages at one height (the taller of the two titles sets it), the eyebrow as the accent tag
  FO.SPREAD = D => { if(FO.__sp) return FO.__sp; const K = D.sw || {}, I = K.left || {}, R = K.right || {}, w = 540;
    let f = 32; for(; f >= 24; f -= 0.5){ const a = FO.barFit(I.title, w, f, f, 2), b = FO.barFit(R.title, w, f, f, 2); if(a.n <= 2 && b.n <= 2) break; }
    const a = FO.barFit(I.title, w, f, f, 2), b = FO.barFit(R.title, w, f, f, 2), n = Math.max(a.n, b.n), BY = 30, BH = 15 + 13 + 6 + n*f*1.08 + 15;
    return FO.__sp = {f, n, a, b, BY, BH, Y0: BY + BH + 16}; };
  FO.spreadBar = (D, side) => { const S = FO.SPREAD(D), K = D.sw || {}, I = side === 'l' ? K.left || {} : K.right || {}, fit = side === 'l' ? S.a : S.b, slot = side === 'l' ? 'left' : 'right';
    let h = FO.bar(-9, S.BY, 630, S.BH);
    if(I.kicker) h += FO.tag(I.kicker, X0, S.BY + 15, 400, slot + '.kicker');
    h += FO.barText(fit, X0, S.BY + 15 + 13 + 6 + (S.n - fit.n)*S.f*1.08/2, 556, slot + '.title');
    return h; };

  // ---------------- COVER: the house edge to edge, the street in the bar, the itinerary table at full width ending in the tour ----------------
  FO.front = (D, o) => { o = o || {}; FO.__sp = null;
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, hero = FO.heroId(D, F.hero || K.hero || 'front');
    const HB = 440, ad = String(L.address || ''), fit = FO.barFit(ad, 540, 46, 30, 1), BH = 15 + fit.f*1.08 + 17, TY = HB + BH + 6, RX = X0, CXr = 120, VX = 132, VW = X1 - VX;
    let h = SW.heroHtml(D, hero, -9, -9, 630, HB + 9, 'front.house', []);
    h += FO.bar(-9, HB, 630, BH) + FO.barText(fit, RX, HB + 16, 556, 'address');
    const hood = FXS.hood(L), items = FXS.statItems(L).filter(x => !/^Built/.test(x)).map(x => x.replace(/ Sq Ft$/, ' sq ft').replace(/ Bedrooms?$/, m => m.toLowerCase()).replace(/ Full Baths?$| Baths?$| Half Baths?$/, m => m.toLowerCase())), yr = L.yearBuilt || L.year;
    const tour = FO.tour(D).map((id, i) => [FO.nn(i + 1), FO.roomName(D, id)]);
    const rows = [], foot = 766;
    rows.push({l: 'Where', h: 64, html: y => `<div class="it-adr" style="left:${VX}pt;top:${y + 4}pt;width:${VW}pt;height:34pt;font-size:${FXS.fitSize(hood || FXS.placeLine(L), "font-family:'Playfair Display';font-weight:700", VW, 27, 18)}pt;line-height:34pt" data-slot="front.place" data-lines="1">${esc(hood || FXS.placeLine(L))}</div>` + (hood ? `<div class="it-plc" style="left:${VX}pt;top:${y + 40}pt;width:${VW}pt;height:16pt;font-size:11pt;line-height:16pt" data-slot="front.city" data-lines="1">${esc(FXS.placeLine(L))}</div>` : '')});
    const ft = items.join('  ·  '), fs = FXS.fitSize(ft, "font-family:'Playfair Display';font-weight:600", VW, 22, 14);
    rows.push({l: 'The home', h: 42, html: y => `<div class="it-val" style="left:${VX}pt;top:${y + 6}pt;width:${VW}pt;height:30pt;font-size:${fs}pt;line-height:30pt" data-slot="front.facts" data-lines="1">${esc(ft)}</div>`});
    if(yr) rows.push({l: 'Built', h: 42, html: y => `<div class="it-val" style="left:${VX}pt;top:${y + 6}pt;width:${VW}pt;height:30pt;font-size:${fs}pt;line-height:30pt" data-slot="front.built" data-lines="1">${esc(yr)}</div>`});
    // the tour: every numbered stop inside, in order, as the itinerary's last row
    const nc = tour.length > 6 || tour.some(t => FXS.width(t[1].toUpperCase(), "font-family:Montserrat;font-weight:700;font-size:9pt;letter-spacing:1.6pt") > VW/3 - 34) ? 2 : 3, nr = Math.ceil(tour.length/nc), cwT = VW/nc;
    rows.push({l: 'Inside', h: 14 + nr*24, html: y => tour.map((t, i) => { const c = Math.floor(i/nr), r = i % nr; return `<div class="abs" style="left:${VX + c*cwT}pt;top:${y + 7 + r*24}pt;width:${cwT - 8}pt;height:24pt;white-space:nowrap;overflow:hidden" data-slot="front.tour${i}" data-lines="1"><span style="font-family:var(--it-serif);font-weight:600;font-size:15pt;line-height:24pt;color:var(--it-mop);display:inline-block;width:28pt">${esc(t[0])}</span><span style="font-family:var(--it-font);font-weight:700;font-size:9pt;line-height:24pt;letter-spacing:1.6pt;color:var(--it-ink);text-transform:uppercase">${esc(t[1])}</span></div>`; }).join('')});
    const need = rows.reduce((a, r) => a + r.h, 0), extra = Math.max(0, (foot - TY - need)/rows.length); let y = TY, t = '';
    rows.forEach((r, i) => { const rh = r.h + extra, cy = y + extra/2; t += FO.lab(r.l, RX, cy + 10, CXr - RX - 6, 'front.lab' + i) + r.html(cy); y += rh; if(i < rows.length - 1) t += FO.hr(RX, y, X1 - RX); });
    t += FO.vr(CXr, TY + 4, y - TY - 8);
    return h + t;
  };

  // ---------------- FLYER FRONT: the Open House flyer's own skeleton as a listing piece: the house across the top; the street in the bar from
  // the trim edge, the ruled table (where, the home, size and year, the write-up); the column of three rooms bleeding off the right edge ----------------
  FO.flyerFront = (D, o) => { o = o || {}; FO.__sp = null;
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), HB = 330, Z = HB + 8, RXc = 424, RX = X0, CXr = 112, VX = 124, VW = RXc - 14 - VX;
    let h = SW.heroHtml(D, hero, -9, -9, 630, HB + 9, 'front.house', []);
    const strip = (o.strip || P.flyerStrip || P.strip || []).slice(0, 3), n = Math.max(1, strip.length), g = 8, LBL = 20, th = (766 - Z - (n - 1)*g)/n;
    strip.forEach((id, i) => { const y = Z + i*(th + g); h += FO.photoAt(D, id, RXc, y, 621 - RXc, th - LBL, 'front.strip' + i, FO.nn(i + 1), 'l') + `<div class="abs fo-tile-l" style="left:${RXc}pt;top:${y + th - LBL + 6}pt;width:${X1 - RXc}pt" data-slot="front.strip${i}.label" data-lines="1">${esc(FO.roomName(D, id).toUpperCase())}</div>`; });
    const ad = String(L.address || ''), fit = FO.barFit(ad, RXc - 14 - RX - 14, 34, 24, 2), BH = 14 + fit.n*fit.f*1.08 + 16;
    let t = FO.bar(-9, Z, RXc - 6 + 9, BH) + FO.barText(fit, RX, Z + 15, RXc - 14 - RX, 'address');
    let y = Z + BH + 4; const top = y;
    const hood = FXS.hood(L), items = FXS.statItems(L).filter(x => !/^Built|Sq Ft/.test(x)).map(x => x.toLowerCase()), sq = L.sqft ? Number(L.sqft).toLocaleString('en-US') + ' sq ft' : '', yr = L.yearBuilt || L.year, sz = [sq, yr ? 'built ' + yr : ''].filter(Boolean).join('  ·  ');
    // the write-up takes as many lines as its true sentences can fill; the rows above share whatever room is left (no gap under anything)
    const lh = 17, pool = (intro || []).map(x => [].concat(x).sort((p, q) => q.length - p.length)[0]), M = Math.floor(FXS.width(pool.join(' '), 'font-family:Montserrat;font-weight:400;font-size:11.5pt')/(VW*0.97));
    const base = [64, 40].concat(sz ? [40] : []), avail0 = 766 - 12 - (y + base.reduce((p, q) => p + q, 0)) - 9, nl = Math.max(3, Math.min(Math.floor(avail0/lh), M - 1)), ex = (avail0 - nl*lh)/base.length, tr = []; for(let q = nl; q >= Math.max(3, nl - 2); q--) tr.push(q);
    const row = (lab, html, hh, i) => { hh += ex; const cy = y + ex/2; const r = FO.lab(lab, RX, cy + 12, CXr - RX - 6, 'front.lab' + i) + html(cy); y += hh; return r + FO.hr(RX, y, RXc - 14 - RX); };
    t += row('Where', yy => `<div class="it-adr" style="left:${VX}pt;top:${yy + 4}pt;width:${VW}pt;height:34pt;font-size:${FXS.fitSize(hood || FXS.placeLine(L), "font-family:'Playfair Display';font-weight:700", VW, 26, 18)}pt;line-height:34pt" data-slot="front.place" data-lines="1">${esc(hood || FXS.placeLine(L))}</div>` + (hood ? `<div class="it-plc" style="left:${VX}pt;top:${yy + 39}pt;width:${VW}pt;height:16pt;font-size:10.5pt;line-height:16pt" data-slot="front.city" data-lines="1">${esc(FXS.placeLine(L))}</div>` : ''), 64, 0);
    const fs = FXS.fitSize(items.join('  ·  '), "font-family:'Playfair Display';font-weight:600", VW, 21, 14);
    t += row('The home', yy => `<div class="it-val" style="left:${VX}pt;top:${yy + 6}pt;width:${VW}pt;height:28pt;font-size:${fs}pt;line-height:28pt" data-slot="front.facts" data-lines="1">${esc(items.join('  ·  '))}</div>`, 40, 1);
    if(sz) t += row('Size', yy => `<div class="it-val" style="left:${VX}pt;top:${yy + 6}pt;width:${VW}pt;height:28pt;font-size:${fs}pt;line-height:28pt" data-slot="front.size" data-lines="1">${esc(sz)}</div>`, 40, 2);
    t += FO.lab('About', RX, y + 13, CXr - RX - 6, 'front.lab3');
    t += `<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="${tr.join(',')}" data-lh="${lh}" data-rag="1" ${FXS.sd(intro)} style="left:${VX}pt;top:${y + 10}pt;width:${VW}pt;height:${nl*lh}pt;font-size:11.5pt;line-height:${lh}pt"></div>`;
    t += `<div data-sumcol="${y + 10}|${766}" style="display:none"></div>`;
    t += FO.vr(CXr, top + 4, 766 - top - 4);
    return h + t;
  };

  // ---------------- INSIDE LEFT: the bar across the spread; the kitchen big at the fold side with its card as itinerary rows under it
  // (rail labels, one vertical hairline); stops 02 and 03 in a column of two tall photos bleeding off the outer (left) edge, each written
  // up as a numbered row of the table ----------------
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, ids = (P.left || []).slice(0, 3), cs = FO.cards(D, ids), S = FO.SPREAD(D);
    let h = FO.spreadBar(D, 'l'); const Y0 = S.Y0, CW0 = 186, MX = 204, MR = 594, RX = MX, CXr = MX + 62, VX = CXr + 12, VW = MR - VX, foot = 766;
    // the column: the two smaller stops, bleeding off the left edge and the foot
    const col = cs.slice(1, 3), g = 8, chh = (801 - Y0 - (col.length - 1)*g)/Math.max(1, col.length);
    col.forEach((c, i) => { h += FO.photoAt(D, c.photo, -9, Y0 + i*(chh + g), CW0 + 9, chh, 'left.col' + i, FO.nn(i + 2), 'r'); });
    const k = cs[0], PH = 248;
    h += FO.photoAt(D, k.photo, MX, Y0, MR - MX, PH, 'left.wide', '01', 'l');
    // the card: its heading row, then the rows
    let y = Y0 + PH + 12; const top = y;
    h += FO.num('01', RX, y + 1, 26, 'left.box.num');
    h += `<div class="abs fo-kick" style="left:${VX}pt;top:${y + 1}pt" data-slot="left.box.kicker" data-lines="1">${esc(String(box.kicker || 'The kitchen').toUpperCase())}</div>`;
    if(box.heading) h += `<div class="abs fo-sub" style="left:${VX}pt;top:${y + 15}pt;width:${VW}pt;font-size:${FXS.fitSize(String(box.heading).replace(/\.$/, ''), "font-family:'Playfair Display';font-weight:600", VW, 19, 13)}pt;line-height:24pt" data-slot="left.box.heading" data-lines="1">${esc(String(box.heading).replace(/\.$/, ''))}</div>`;
    y += 46; h += FO.hr(RX, y, MR - RX);
    const n2 = col.length, entH = 17 + 3*14.5 + 16, T = FO.railRows((box.items || []).slice(0, 10), FO.kitchenTaken(D), [0.8, 0.84, 0.88, 0.92, 0.96, 1].map(q => Math.round(VW*q)), {maxRows: 4, maxH: 766 - y - n2*entH - 8}), rowsAvail = foot - y - n2*entH - 6, rowH = Math.max(T.n === 2 ? 44 : 28, Math.min(T.n === 2 ? 54 : 36, rowsAvail/Math.max(1, T.rows.length)));
    h += FO.railTable(T, RX, VX, y, VW, rowH, 'left'); y += FO.__rtH;
    const left = foot - y - 10, eh = left/Math.max(1, n2), ln = Math.max(3, Math.min(6, Math.floor((eh - 17 - 12)/14.5)));
    col.forEach((c, i) => { const ey = y + 12 + i*eh; h += FO.entry(D, c, RX, VX, ey, VW, ln, 'left.photo' + i, FO.nn(i + 2)); if(i < n2 - 1) h += FO.hr(RX, y + 12 + (i + 1)*eh - 7, MR - RX); });
    h += FO.vr(CXr, top, foot - top);
    return h;
  };

  // ---------------- INSIDE RIGHT: the bar continues; the lead room big at the fold side, written up as stop 04 under it; stops 05 to 07 in the
  // column of three photos bleeding off the outer (right) edge, each a numbered row of the table (baths and small rooms last) ----------------
  FO.right = (D) => { const K = D.sw || {}, P = K.plan || {}, cs = FO.cards(D, (P.right || []).slice(0, 4)), S = FO.SPREAD(D), nL = Math.min(3, ((P.left || []).length));
    let h = FO.spreadBar(D, 'r'); const Y0 = S.Y0, MX = 18, MR = 408, CX0 = 426, RX = MX, CXr = MX + 84, VX = CXr + 12, VW = MR - VX, foot = 766;
    const col = cs.slice(1, 4), g = 8, chh = (801 - Y0 - (col.length - 1)*g)/Math.max(1, col.length);
    col.forEach((c, i) => { h += FO.photoAt(D, c.photo, CX0, Y0 + i*(chh + g), 621 - CX0, chh, 'right.col' + i, FO.nn(nL + 2 + i), 'l'); });
    const PH = 248; h += FO.photoAt(D, cs[0].photo, MX, Y0, MR - MX, PH, 'right.wide', FO.nn(nL + 1), 'r');
    let y = Y0 + PH + 12; const top = y, ents = [cs[0]].concat(col), eh = (foot - y)/ents.length;
    ents.forEach((c, i) => { const ln = Math.max(3, Math.min(i ? 5 : 6, Math.floor((eh - 17 - 12)/14.5))); h += FO.entry(D, c, RX, VX, y + i*eh + (i ? 10 : 2), VW, ln, 'right.photo' + i, FO.nn(nL + 1 + i)); if(i < ents.length - 1) h += FO.hr(RX, y + (i + 1)*eh + 2, MR - RX); });
    h += FO.vr(CXr, top, foot - top);
    return h;
  };

  // ---------------- BACK (fold-over) and flyer back: the whole page is one itinerary. The bar from the trim edge (the back's title, the
  // floors tag); then ruled rows: the plan with the floors written up beside it (or the outdoor photo with the house written up); the row
  // of captioned rooms; the lists; Nearby with the distances set large in Playfair; the half-height contact card and the fine print ----------------
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = IT.logoSrc(D); const pw = 180, lh = Math.min(46, H - 30), s = {name: 18, nameFloor: 15, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div style="--cc-display:'Playfair Display';--cc-body:Montserrat">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true}) + '</div>'; };
  FO.back = (D, o) => { o = o || {}; FO.__sp = null; FO.__npM = 99; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [];
    const RX = X0, CXr = 112, VX = 124, R1 = X1, VW = R1 - VX;
    const ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, ''), tagT = +(D.listing || {}).stories > 1 ? 'Floor by floor' : 'Room by room';
    const fit = FO.barFit(ht || tagT, 540, 30, 22, 2), BY = 30, BH = 15 + 13 + 6 + fit.n*fit.f*1.08 + 15;
    let h = FO.bar(-9, BY, 630, BH) + (ht ? FO.tag(tagT, RX, BY + 15, 400, 'back.about.title') : '') + FO.barText(fit, RX, BY + 34, 556, 'back.about.head');
    const Y0 = BY + BH + 14;
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    const rowIds = flyer ? (P.flyerBack || []).slice(0, 3) : (P.backRow || ['bath2']).slice(0, 3), rowCards = FO.cards(D, rowIds);
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const LV = hasPlan ? (D.plan.levels || []) : [], tall = hasPlan && (LV.length >= 4 || (LV.length === 1 && LV[0].h/LV[0].w > 1.5));
    const CARD_Y = 688, nb = Math.max(Math.min(c1.length, 5), Math.min(c2.length, 5), 3), listH = 30 + nb*19 + 6, nearH = 58, rowCapH = 25 + 3*13.5;
    // the lists and Nearby: ruled rows at the foot of the table (the back's lists side by side in the value column)
    const listsY = CARD_Y - 14 - nearH - listH, nearY = listsY + listH;
    let used = FO.cards(D, [topId].filter(Boolean).concat(hasPlan && (D.plan.levels || []).length >= 3 ? [] : rowIds)), aTop = Y0, aBot, leftW, ax;
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    // three floors or more: the plan runs the full width of the value column, the floors' write-up under it, no photo row (the plan is the page)
    const wide = hasPlan && LV.length >= 3, PHmin = 100, aMax = wide || !hasPlan ? listsY - 16 - 4*15.5 - 12 - Y0 : listsY - 12 - rowCapH - PHmin - 16 - Y0;
    if(hasPlan){ const pc = FO.planBox(D, VX - 12, Y0, aMax - 36, wide ? R1 - VX + 12 : 330); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; aBot = pc.bottom; leftW = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])); ax = wide ? VX : VX - 12 + leftW + 18;
      h += FO.lab('The plan', RX, Y0 + 2, CXr - RX - 6, 'back.plan.lab'); }
    else { const cs = [FXS.cardFor(D, topId)].concat(rowCards).filter(Boolean).slice(0, 3), n3 = cs.length, gap = 10, tw = (R1 - VX - (n3 - 1)*gap)/n3, ph0 = Math.round(tw*0.72);
      // the write-up under the photos takes the lines its true sentences can fill; the photos take the rest of the height
      const pool = keep(f2.concat(f1)).map(x => [].concat(x).sort((p, q) => q.length - p.length)[0]), M = Math.floor(FXS.width(pool.join(' '), 'font-family:Montserrat;font-weight:400;font-size:10.5pt')/((R1 - VX)*0.97)) - 5, spanMax = listsY - 16 - (Y0 + ph0 + rowCapH + 12), aboutH = Math.max(3*15.5, Math.min(spanMax, M*15.5)), _m = (FO.__npM = Math.max(3, M)), ph = Math.min(Math.round(tw*1.05), ph0 + spanMax - aboutH);
      cs.forEach((c, i) => { h += FXS.captioned(D, c, VX + i*(tw + gap), Y0, tw, ph, 3, i ? 'back.photo' + (i - 1) : 'back.top', {fs: 10, lh: 13.5, min: 3}); });
      h += FO.lab('Around the house', RX, Y0 + 2, CXr - RX - 6, 'back.top.lab', 2) + `<div data-npsnug="${cs.map((c, i) => i ? 'back.photo' + (i - 1) : 'back.top').join(',')}" style="display:none"></div>`; aBot = Y0 + ph + rowCapH; ax = VX; }
    let rowY;
    if(wide || !hasPlan){ const T0 = aBot + 12, span = listsY - 16 - T0, n = Math.max(3, Math.min(Math.floor(span/15.5), hasPlan ? 99 : FO.__npM)), lh = +(span/n).toFixed(3);
      h += FO.hr(RX, T0 - 6, R1 - RX) + FO.lab(tagT, RX, T0 + 2, CXr - RX - 6, 'back.floors.lab', 2);
      h += (hasPlan ? FO.full : (x => x))(FO.wu(((k => { const a = k.filter(x => f2.includes(x)), b = k.filter(x => !f2.includes(x)); return a.slice(0, 7).concat(b.slice(0, 7)); })(keep(f2.concat(f1)))), VX, T0, R1 - VX, n*lh + 0.01, 'back.about', 10.5, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-span="${span.toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`); }
    else { const aw = R1 - ax, T0 = Y0, span = Math.max(aBot, Y0 + 120) - T0, n = Math.floor(span/15.5), lh = +(span/n).toFixed(3);
      h += FO.full(FO.wu(((k => { const a = k.filter(x => f2.includes(x)), b = k.filter(x => !f2.includes(x)); return a.slice(0, 7).concat(b.slice(0, 7)); })(keep(f2.concat(f1)))), ax, T0, aw, n*lh + 0.01, 'back.about', 10.5, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${aw < 240 ? ' data-rag="1"' : ''} data-span="${span.toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`); rowY = T0 + span + 16;
      h += FO.hr(RX, rowY - 8, R1 - RX);
      const n2 = rowCards.length, gap = 10, tw = (R1 - VX - (n2 - 1)*gap)/n2, PH = listsY - 12 - rowCapH - rowY;
      rowCards.forEach((c, i) => { h += FXS.captioned(D, c, VX + i*(tw + gap), rowY, tw, PH, 3, 'back.photo' + i, {fs: 10, lh: 13.5, min: 3}); });
      h += FO.lab('More rooms', RX, rowY + 2, CXr - RX - 6, 'back.row.lab', 2); }
    h += FO.hr(RX, listsY - 4, R1 - RX);
    { const W2 = (VW - 20)/2, ly = listsY + 6, rh = Math.min(19, (listH - 14)/nb), fs = 10;
      h += FO.lab('Features', RX, ly + 1, CXr - RX - 6, 'back.lists.lab');
      h += FO.lab(t1, VX, ly + 1, W2, 'back.updates.title') + FXS.bullets(c1, VX, ly + 16, W2, rh, 'back.updates', 5, fs).html;
      h += FO.lab('Outside', VX + W2 + 20, ly + 1, W2, 'back.outside.title') + FXS.bullets(c2, VX + W2 + 20, ly + 16, W2, rh, 'back.outside', 5, fs).html; }
    h += FO.hr(RX, nearY, R1 - RX);
    { const N = (KB.nearby || []).slice(0, 3), cw = VW/Math.max(1, N.length);
      h += FO.lab('Nearby', RX, nearY + 14, CXr - RX - 6, 'back.near.kicker');
      N.forEach((nn, i) => { const x = VX + i*cw, d = String(nn.dist), ds = FXS.fitSize(d, "font-family:'Playfair Display';font-weight:600", cw - 14, 22, 14);
        h += `<div class="it-val" style="left:${x}pt;top:${nearY + 6}pt;width:${cw - 10}pt;height:28pt;font-size:${ds}pt;line-height:28pt" data-slot="back.near${i}" data-lines="1">${esc(d)}</div>`;
        h += `<div class="abs fo-near-p it-lab" style="left:${x}pt;top:${nearY + 35}pt;width:${cw - 10}pt;font-size:8.6pt;letter-spacing:${FXS.width(String(nn.place).toUpperCase(), 'font-family:Montserrat;font-weight:700;letter-spacing:2.8pt;font-size:8.6pt') <= cw - 14 ? 2.8 : FXS.width(String(nn.place).toUpperCase(), 'font-family:Montserrat;font-weight:700;letter-spacing:1.6pt;font-size:8.6pt') <= cw - 14 ? 1.6 : 0.6}pt" data-slot="back.near${i}.p" data-lines="1">${esc(nn.place)}</div>`;
        if(i) h += FO.vr(x - 8, nearY + 8, nearH - 16); }); }
    h += FO.vr(CXr, Y0, CARD_Y - 14 - Y0);
    h += FO.hr(RX, CARD_Y - 10, R1 - RX);
    h += FO.contact(D, X0, CARD_Y, CW, FO.CARD_H) + FO.fine(D);
    return {html: h, issues};
  };
})();

// Itinerary: a no-plan back's write-up that set fewer lines than its room hands the room to the photos above it (they grow, their labels
// and captions move down with them), so no band opens between the captions and the write-up
(function(){ const T0 = FO.tallStack; FO.tallStack = () => { T0(); const mk = document.querySelector('[data-npsnug]'), ab = document.querySelector('[data-slot="back.about"]'); if(!mk || !ab || !ab.textContent.trim()) return;
  const caps = mk.dataset.npsnug.split(',').map(sl => document.querySelector(`.cap .a[data-slot="${sl}"]`)).filter(Boolean); if(!caps.length) return;
  const capB = Math.max(...caps.map(c => parseFloat(c.style.top) + parseFloat(c.style.height))), free = parseFloat(ab.style.top) - 14 - capB; if(free < 2) return;
  caps.forEach(c => { const sl = c.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), pb = ph && ph.parentElement, lb = document.querySelector(`[data-slot="${sl}.label"]`);
    if(pb) pb.style.height = (parseFloat(pb.style.height) + free) + 'pt'; if(lb) lb.parentElement.style.top = (parseFloat(lb.parentElement.style.top) + free) + 'pt'; c.style.top = (parseFloat(c.style.top) + free) + 'pt'; });
  document.querySelectorAll('.it-hr').forEach(h => { const t = parseFloat(h.style.top); if(Math.abs(t - (capB + 6)) < 8) h.style.top = (t + free) + 'pt'; }); }; })();
