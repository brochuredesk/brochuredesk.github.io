/* Warm Collage fold-over and two-sided flyer builders (grown from the FXS-14 builders; the hand is the approved Open House library
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

  // Warm Collage: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Warm Collage refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:Bitter;letter-spacing:3.4pt", HW, 24, 13, 5), lh = T.f*1.3, H = 17 + T.n*lh + 9 + 1.2, y = 30 + (270 - 30 - H)/2;
    kk.style.top = y + 'pt'; ti.style.top = (y + 17) + 'pt'; ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = (T.n*lh) + 'pt'; ti.dataset.lines = T.n; ru.style.top = (y + 17 + T.n*lh + 9) + 'pt'; };
  // after the fill: the cover write-up sits on the frame's foot; the rooms above it grow down into any room it did not use (no empty band)
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = 766 - n*lh;
    const lbls = [...document.querySelectorAll('[data-slot^="front.strip"][data-slot$=".label"]')]; if(!lbls.length) return; const lb = Math.max(...lbls.map(l => parseFloat(l.style.top) + 11)), d = top - 16 - lb; su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt'; if(d <= 0) return;
    lbls.forEach(l => { l.style.top = (parseFloat(l.style.top) + d) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  FO.fitTitle = (t, fam, w, max, min, maxLines) => { for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w)) return {f, n: L.length, w}; }
    for(const k of [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6]) for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w*k); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w*k)) return {f, n: L.length, w: w*k}; }
    return {f: min, n: FO.wrapLines(t, `${fam};font-size:${min}pt`, w).length, w}; };
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = WC.logoSrc(D); const ko = !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 180, lh = Math.min(46, H - 30), s = {name: 18, nameFloor: 15, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div style="--cc-display:Bitter;--cc-body:Schibsted Grotesk">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };
  FO.tighten = (D, m) => { m = m == null ? 0.05 : m; document.querySelectorAll('.ph[data-photo]').forEach(el => { if(!/^front\.(house|hero)$/.test(el.dataset.slotPhoto || '')) return; const p = (D.photos || {})[el.dataset.photo], img = el.querySelector('img'); if(!p || !p.box || !img || !p.w || !p.h) return;
    const W = p.w, H = p.h, tw = el.clientWidth, th = el.clientHeight, ia = W/H, ta = tw/th, vis = ia > ta ? {w: ta/ia, h: 1} : {w: 1, h: ia/ta};
    const ppi1 = W*vis.w/(tw/96), zmax = ppi1/300;   // the photo's own resolution in this frame before any enlargement; the most it may be enlarged
    const [x0, y0, x1, y1] = p.box, z = Math.min(1.5, zmax, vis.w/((x1 - x0) + 2*m), vis.h/((y1 - y0) + 2*m)); if(!(z > 1.03)) return;
    const op = (img.style.objectPosition || '50% 50%').split(' ').map(v => parseFloat(v)/100), px = isNaN(op[0]) ? .5 : op[0], py = isNaN(op[1]) ? .5 : op[1];
    const place = (c, v, p0) => { const lo = (1 - v)*p0, start = Math.min(Math.max(c - v/(2*z), lo), lo + v - v/z); return (start - lo)/v; };   // where the enlarged window starts inside the crop (0 .. 1 - 1/z)
    const sx = place((x0 + x1)/2, vis.w, px), sy = place((y0 + y1)/2, vis.h, py);
    img.style.cssText = `position:absolute;max-width:none;width:${z*100}%;height:${z*100}%;left:${-sx*z*100}%;top:${-sy*z*100}%;object-fit:cover;object-position:${px*100}% ${py*100}%`; }); };
  FO.tableRows = (items0, liw, taken, o) => { o = o || {}; const lcss = 'font-family:Schibsted Grotesk;font-weight:500;font-size:8.6pt;letter-spacing:2.2pt', LW0 = o.stack ? 0 : Math.ceil(Math.max(...items0.map(it => FXS.width(String(it.l).toUpperCase(), lcss)))) + 20;
    const ok = a => !taken || !taken(a); let best = null; const MIN = 0.86, opts = o.stack ? (o.Vs || [178, 184, 190, 196, 202, 208, 214]).map(V => [0, V]) : [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60].map(d => [LW0 + d, liw - LW0 - d]);
    for(let f = o.stack ? 10 : 10.5; f <= (o.stack ? 11.51 : 12.01); f += 0.25) for(const [LW, V] of opts){ const css = `font-family:Schibsted Grotesk;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bw = 0;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const w = FXS.width(t, css); if(w <= V - 2 && w > bw){ bw = w; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt, fill: bw/V}; }).filter(r => r.t);
      const full = Math.min(rows.filter(r => r.fill >= MIN).length, o.maxRows || 99), score = full*100 + (LW === LW0 ? 3 : 0) + f - (o.stack ? V*0.04 : rows.filter(r => r.fill < MIN).length*2) + Math.min(...rows.map(r => r.fill).concat(1))*10;
      if(!best || score > best.score) best = {score, f, LW, V, rows}; }
    let rows = best.rows; const good = rows.filter(r => r.fill >= MIN);
    if(good.length >= 4) rows = good; else { const keep = rows.slice().sort((a, b) => b.fill - a.fill).slice(0, Math.max(4, good.length)); rows = rows.filter(r => keep.includes(r)); }
    return Object.assign(best, {rows: rows.slice(0, o.maxRows || 99)}); };
  FO.wrapW = (t, css, V) => { const out = []; let cur = ''; String(t).split(' ').forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > V - 0.5){ out.push(FXS.width(cur, css)); cur = wd; } else cur = tr; }); if(cur) out.push(FXS.width(cur, css)); return out; };
  // the kitchen / "What's new" card rows, Warm Collage: each row its label over ONE or TWO full lines of true detail (one line 86%+ of the
  // measure; two lines: the first 80%+, the last 90%+), the wording, the type size (10 to 11.5 pt) and the measure chosen so the most rows fill
  // and the rows fit the card's height; a row never opens on a pronoun; up to six rows
  FO.tableRowsFlex = (items0, taken, o) => { o = o || {}; const ok = a => !taken || !taken(a); let best = null;
    for(let f = 10; f <= 11.51; f += 0.25) for(const V of (o.Vs || [196, 204, 212, 220, 228, 236])){ const css = `font-family:Schibsted Grotesk;font-weight:400;font-size:${f}pt`, lh = +(f*1.4).toFixed(2);
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1, bn = 0;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t) || /^(It|Its|They|This|That)\b/.test(t)) return; const Lw = FO.wrapW(t, css, V);
            const good = Lw.length === 1 ? Lw[0] >= 0.86*V : Lw.length === 2 ? Lw[0] >= 0.8*V && Lw[1] >= 0.9*V : false; if(!good) return; const sc = Lw.length*2 + Lw[Lw.length - 1]/V; if(sc > bs){ bs = sc; bt = t; bn = Lw.length; } return; }
          walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt, n: bn}; }).filter(r => r.t);
      let kept = rows.slice(0, o.maxRows || 6); const need = r => 13 + r.n*lh + 9; while(kept.length > 3 && kept.reduce((a, r) => a + need(r), 0) > (o.room || 1e9)) kept = kept.slice(0, -1);
      const used = kept.reduce((a, r) => a + need(r), 0), score = kept.length*100 + f*3 - V*0.04 - Math.max(0, (o.room || 0) - used)*0.05;
      if(kept.reduce((a, r) => a + need(r), 0) <= (o.room || 1e9) && (!best || score > best.score)) best = {score, f, V, lh, rows: kept}; }
    return best || {f: 10, V: 220, lh: 14, rows: []}; };
  FO.tableRows2 = (items0, taken, o) => { o = o || {}; const ok = a => !taken || !taken(a); let best = null;
    for(let f = 10; f <= 11.51; f += 0.25) for(const V of (o.Vs || [184, 190, 196, 202, 208, 214, 220])){ const css = `font-family:Schibsted Grotesk;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t) || /^(It|Its|They|This|That)\b/.test(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== 2 || Lw[0] < 0.8*V || Lw[1] < 0.9*V) return; const sc = (Lw[0] + Lw[1])/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 4), score = n*100 + f*2 - V*0.05;
      if(!best || score > best.score) best = {score, f, V, LW: 0, rows: rows.slice(0, o.maxRows || 4)}; }
    return best; };
  // ---------------- Warm Collage geometry (pt, panel trim 612 x 792) ----------------
  // P06's grid: a 26 pt mat round the collage and 8 pt of mat between tiles. Every tile is a photo, a main or dark block, the accent
  // anchor inside a main block, or the white panel. Type sits only on blocks, panels and the mat, never on a photo (a room's name rides
  // a small main-color tab on its photo's foot: the tab is a block).
  const M = 26, G = 8, X0 = 26, X1 = 586, CW = X1 - X0, FOOT = 766;
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW; FO.G = G; FO.FR = [X0, M, X1, FOOT];
  FO.frame = () => '';
  const DCSS = 'font-family:Bitter;font-weight:700';
  // a room's name on a main-color tab set on its photo's foot (x, bottom y); the size small beside it
  FO.tab = (D, id, slot, x, yb, maxW, lead) => { const L0 = FXS.leadLabel(lead || (FXS.cardFor(D, id) || {}).lead || FO.lead(D, id)); let nm = String(L0.name || FO.lead(D, id)).toUpperCase();
    const w = t => FXS.width(t, 'font-family:Schibsted Grotesk;font-weight:700;font-size:8.6pt;letter-spacing:1.8pt'); if(w(nm) + 18 > (maxW || 300)) nm = nm.split(/ AND |, /)[0];
    const sz = L0.size && w(nm) + FXS.width(L0.size, 'font-family:Schibsted Grotesk;font-weight:500;font-size:8.6pt') + 34 <= (maxW || 300) ? L0.size : '';
    return `<div class="abs wc-onm" data-tab="1" style="left:${x}pt;top:${yb - 19}pt;height:19pt;background:var(--wc-main);padding:0 9pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="line-height:19pt">${esc(nm)}</div>${sz ? `<div class="lbl sz" data-size="1" style="line-height:19pt;color:var(--wc-soft-main)">${esc(sz)}</div>` : ''}</div>`; };
  // a photo tile with its name on a tab
  FO.tileT = (D, id, x, y, w, h, slot) => FXS.box(D, id, x, y, w, h, slot) + FO.tab(D, id, slot, x, y + h, w);
  // the facts line in the anchor: tracked caps on the accent, as large as its width allows (8.6 to 13 pt)
  FO.factsText = L => { const items = FXS.statItems(L).filter(x => !/^Built/.test(x)); const yr = L.yearBuilt || L.year; if(yr) items.push('Built ' + yr); return items.join('  ·  ').toUpperCase(); };
  FO.anchorFacts = (L, x, y, w, h, slot, max) => { const fx = FO.factsText(L); let ls = 1.6, fs = FXS.fitSize(fx, `font-family:Schibsted Grotesk;font-weight:600;letter-spacing:${ls}pt`, w - 28, max || 13, 8.6);
    if(FXS.width(fx, `font-family:Schibsted Grotesk;font-weight:600;letter-spacing:${ls}pt;font-size:${fs}pt`) > w - 28){ ls = 0.6; fs = FXS.fitSize(fx, `font-family:Schibsted Grotesk;font-weight:600;letter-spacing:${ls}pt`, w - 28, max || 13, 8.6); }
    return WC.anchor(x, y, w, h) + `<div class="abs fo-facts" style="left:${x + 14}pt;top:${y + (h - fs*1.3)/2}pt;width:${w - 28}pt;height:${fs*1.3}pt;font-size:${fs}pt;line-height:${fs*1.3}pt;letter-spacing:${ls}pt;color:var(--wc-on-accent);text-align:center" data-slot="${slot}" data-lines="1">${esc(fx)}</div>`; };
  // the street as the poster: the house number huge in Bitter, the street name in caps stacked beside it (one or two lines), both inside (x, y, w, hh)
  FO.poster = (L, x, y, w, hh, o) => { o = o || {}; const ad = String(L.address || ''), m = /^(\d+[A-Za-z]?)\s+(.*)$/.exec(ad), num = m ? m[1] : '', name = (m ? m[2] : ad).toUpperCase();
    const nsMax = Math.min(o.max || 112, hh/0.78), ncss = DCSS + ';letter-spacing:-2pt', ns = num ? FXS.fitSize(num, ncss, w*0.52, nsMax, 40) : 0, nw = num ? FXS.width(num, `${ncss};font-size:${ns}pt`) : 0;
    const cap = ns*0.72, sx = x + (num ? nw + Math.max(14, ns*0.16) : 0), sw = x + w - sx;
    let lines = [name], nf = FXS.fitSize(name, DCSS + ';letter-spacing:.4pt', sw, Math.min(o.nameMax || 46, cap*0.62), 14);
    const ws = name.split(' '); if(ws.length > 1){ for(let k = 1; k < ws.length; k++){ const a = ws.slice(0, k).join(' '), b = ws.slice(k).join(' '), f2 = Math.min(FXS.fitSize(a, DCSS + ';letter-spacing:.4pt', sw, Math.min(o.nameMax || 46, cap*0.5), 14), FXS.fitSize(b, DCSS + ';letter-spacing:.4pt', sw, Math.min(o.nameMax || 46, cap*0.5), 14)); if(f2 > nf*1.15){ lines = [a, b]; nf = f2; } } }
    const top = y + (hh - ns*0.78)/2 - ns*0.17;   // the number's cap height centered in the box (Bitter: caps about 0.71 em, set 0.17 em under the line top)
    let h = num ? `<div class="wc-num" style="left:${x}pt;top:${top}pt;height:${ns}pt;font-size:${ns}pt;letter-spacing:-2pt" data-slot="address.number" data-lines="1">${esc(num)}</div>` : '';
    const capTop = top + ns*0.17, capBot = capTop + ns*0.71, lh = nf*1.02, blockH = lines.length*lh, ny = num ? capBot - blockH + nf*0.22 : y + (hh - blockH)/2;
    h += `<div class="wc-disp" style="left:${sx}pt;top:${ny}pt;width:${sw}pt;height:${blockH}pt;font-size:${nf}pt;line-height:${lh}pt;letter-spacing:.4pt;white-space:pre" data-slot="address" data-lines="${lines.length}">${esc(lines.join('\n'))}</div>`;
    return {html: h, ns, nf}; };

  // ---------------- FRONT: the fold-over cover. Three tiers, color / house / color: the main block with the street as a poster (the house
  // number huge, the street name stacked beside it) and the accent anchor holding the facts at its foot; the whole house across the page;
  // the dark block with the write-up. No agent, no brokerage. ----------------
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {};
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), place = [FXS.hood(L), FXS.placeLine(L)].filter(Boolean).join('  ·  ').toUpperCase();
    const AY = M, AH = 216; let h = WC.block(X0, AY, CW, AH, 'main'), t = '<div class="wc-onm">';
    t += `<div class="wc-sub" style="left:${X0 + 22}pt;top:${AY + 20}pt;width:${CW - 44}pt;height:12pt;font-size:9.5pt;line-height:12pt" data-slot="front.place" data-lines="1">${esc(place)}</div>`;
    t += FO.poster(L, X0 + 22, AY + 40, CW - 44, 112).html + '</div>';
    t += FO.anchorFacts(L, X0 + 14, AY + AH - 14 - 40, CW - 28, 40, 'front.facts', 13);
    const DB = 140, DY = FOOT - DB, HY = AY + AH + G, HH = DY - G - HY;
    h += SW.heroHtml(D, hero, X0, HY, CW, HH, 'front.house', []);
    h += WC.block(X0, DY, CW, DB, 'dark');
    const lh = 22, n = Math.floor((DB - 30)/lh);
    t += `<div class="wc-ond">` + FO.flex(`<div class="abs wu" data-slot="front.summary" data-lines="${n}" data-try="${n},${n - 1},${n - 2}" data-lh="${lh}" ${FXS.sd(o.intro || K.summary || [])} style="left:${X0 + 24}pt;top:${DY + (DB - n*lh)/2}pt;width:${CW - 48}pt;height:${n*lh}pt;font-size:15pt;line-height:${lh}pt;color:var(--wc-soft-dark)"></div>`).replace('data-slot=', 'data-growbox="12,17" data-gcov="0.6" data-vc="' + (DY + 16) + ',' + (DB - 32) + '" data-slot=') + '</div>';
    return h + t;
  };

  // ---------------- FLYER FRONT: its own composition in the same hand. The whole house large across the top; under it a checkerboard of
  // two rows: color blocks on the left (the main block with the street and the anchor with the facts; the dark block with the write-up),
  // rooms on the right, each on its tab. ----------------
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), HY = M, HH = 392, BW = 368, RX = X0 + BW + G, RW = X1 - RX;
    let h = SW.heroHtml(D, hero, X0, HY, CW, HH, 'front.house', []), t = '';
    const r1 = HY + HH + G, h1 = 176, r2 = r1 + h1 + G, h2 = FOOT - r2;
    const strip = (o.strip || P.flyerStrip || P.strip || []).filter(id => (D.photos || {})[id]).slice(0, 2);
    h += WC.block(X0, r1, BW, h1, 'main');
    const place = [FXS.hood(L), FXS.placeLine(L)].filter(Boolean).join('  ·  ').toUpperCase(), ad = String(L.address || ''), as = FXS.fitSize(ad, DCSS, BW - 44, 36, 18);
    const ah0 = 50, gH = 12 + 10 + as*1.2, gy = r1 + (h1 - 14 - ah0 - gH)/2 + 2, ay = gy + 22;
    t += `<div class="wc-onm"><div class="wc-sub" style="left:${X0 + 22}pt;top:${gy}pt;width:${BW - 44}pt;height:12pt;font-size:9pt;line-height:12pt" data-slot="front.place" data-lines="1">${esc(place)}</div>`;
    t += `<div class="wc-st" style="left:${X0 + 22}pt;top:${ay}pt;width:${BW - 44}pt;height:${as*1.2}pt;font-size:${as}pt;line-height:${as*1.2}pt" data-slot="address" data-lines="1">${esc(ad)}</div></div>`;
    const ah = 50; t += FO.anchorFacts(L, X0 + 14, r1 + h1 - 14 - ah, BW - 28, ah, 'front.facts', 11.5);
    h += WC.block(X0, r2, BW, h2, 'dark');
    { const lh = 18.5, n = Math.floor((h2 - 30)/lh);
      t += `<div class="wc-ond">` + FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${n}" data-try="${n},${n - 1}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0 + 22}pt;top:${r2 + (h2 - n*lh)/2}pt;width:${BW - 44}pt;height:${n*lh}pt;font-size:12pt;line-height:${lh}pt;color:var(--wc-soft-dark)"></div>`).replace('data-slot=', 'data-vc="' + r2 + ',' + h2 + '" data-slot=') + '</div>'; }
    strip.forEach((id, i) => { h += FO.tileT(D, id, RX, i ? r2 : r1, RW, i ? h2 : h1, 'front.strip' + i); });
    return h + t;
  };
  // after the fill: a write-up set inside a block (data-vc="top,height") sits centered top to bottom in it
  // how many lines a pool of sentences can fill at most (all of them, longest wordings) at width w, capped at nmax: a block is planned at
  // what its true copy can fill, then centered in its tile (data-vc), never left with an empty foot
  FO.nfit = (list, css, w, nmax) => { const all = (list || []).map(x => [].concat(x).sort((a, b) => b.length - a.length)[0]).join(' '); return Math.max(3, Math.min(nmax, FO.wrapN(all, css, w))); };
  FO.vcenter = () => document.querySelectorAll('[data-vc]').forEach(el => { if(!el.textContent.trim()) return; const [y, hh] = el.dataset.vc.split(',').map(Number), n = SW.lines(el).n, lh = parseFloat(el.style.lineHeight), H = n*lh; el.style.height = H + 'pt'; el.dataset.lines = n; el.style.top = (y + (hh - H)/2) + 'pt'; });
  // a write-up that may set any line count from its planned count down to three (all whole sentences, every line 80%+, the last 90%+), then centered in its block
  // after the fill: a write-up in a block (data-growbox="min,max") takes the LARGEST type at which its true sentences fill the block top to
  // bottom (lines x leading at least 82% of the block), every line 80%+ and the last 90%+; then it is centered (FO.vcenter)
  FO.growBox = () => document.querySelectorAll('[data-growbox]').forEach(el => { if(!SW.pfN) return; const [mn, mx] = el.dataset.growbox.split(',').map(Number), [y, H] = el.dataset.vc.split(',').map(Number), cov = +(el.dataset.gcov || 0.82), gmin = +(el.dataset.gmin || 3), keep = [el.innerHTML, el.style.fontSize, el.style.lineHeight, el.style.height];
    for(let fs = mx; fs >= mn - 1e-6; fs -= 0.25){ const lh = +(fs*1.45).toFixed(2), T = Math.floor((H + 0.5)/lh); if(T < gmin) continue; el.style.fontSize = fs + 'pt'; el.style.lineHeight = lh + 'pt'; el.style.height = 'auto'; el.style.textAlign = 'left'; el.__pfMemo = null;
      for(let t = T; t >= gmin; t--){ if(t*lh < H*cov) break; const b = SW.pfN(el, t); if(b){ el.innerHTML = b.pick.map(x => SW.esc(x)).join(' '); SW.noteGrams(el, b.pick.join(' ')); el.style.height = (t*lh) + 'pt'; el.dataset.lines = t; el.dataset.lh = lh; return; } } }
    [el.innerHTML, el.style.fontSize, el.style.lineHeight, el.style.height] = keep; });
  // after vcenter: a block's heading and its write-up centered together top to bottom in the block (data-vgroup="headingSlot,top,height")
  FO.vgroup = () => document.querySelectorAll('[data-vgroup]').forEach(el => { if(!el.textContent.trim()) return; const [sl, y, H] = el.dataset.vgroup.split(','), hd = document.querySelector(`[data-slot="${sl}"]`); if(!hd) return;
    const hh = parseFloat(hd.style.height), th = parseFloat(el.style.height), gap = 14, top = +y + (+H - (hh + gap + th))/2; hd.style.top = top + 'pt'; el.style.top = (top + hh + gap) + 'pt'; });
  FO.flex = s => s.replace('data-slot=', 'data-narrow="0" data-fill="0.9" data-lfill="0.8" data-slot=');

  FO.heroId = (D, id) => { const ph = D.photos || {}, sp = SW.space(D, id); if((ph[id] || {}).dusk) return id; const d = Object.keys(ph).find(k => ph[k].dusk && ph[k].fullHouse && SW.space(D, k) === sp); return d || id; };
  FO.isDusk = (D, id) => !!((D.photos || {})[id] || {}).dusk;

  // ---------------- INSIDE SPREAD: one main-color band across the top of both pages, crossing the fold on purpose (each half bleeds into
  // the fold and meets its match). The spread's headline runs across it in Bitter 700 caps, the first half ending 0.5 in short of the fold,
  // the second starting 0.5 in past it, one size and one baseline; every photo below starts on one horizon. ----------------
  FO.spreadHalves = D => { const K = D.sw || {}, S = K.spread || {}, t = S.title || [(K.left || {}).title, (K.right || {}).title].join('|'); return String(t).split('|').map(x => x.trim().replace(/[.,]$/, '')); };
  FO.spreadSize = D => { if(FO.__ss) return FO.__ss; const hv = FO.spreadHalves(D), W = 576 - (X0 + 20), one = Math.min(...hv.map(t => FXS.fitSize(t.toUpperCase(), DCSS, W, 38, 16)));
    if(one >= 25) return (FO.__ss = {f: one, n: 1}); const f = Math.min(...hv.map(t => FO.fitTitle(t.toUpperCase(), DCSS, W, 34, 18, 2).f)); return (FO.__ss = {f, n: 2}); };
  FO.band = (D, side, kicker, slot) => { const S = FO.spreadSize(D), t = FO.spreadHalves(D)[side === 'left' ? 0 : 1] || '', lh = S.f*1.04, BH = 22 + 12 + 10 + S.n*lh + 20;
    const bx = side === 'left' ? X0 : -9, bw = side === 'left' ? 621 - X0 : X1 + 9, tx = side === 'left' ? X0 + 20 : 36, tw = 576 - (X0 + 20), al = side === 'left' ? 'right' : 'left';
    let h = WC.block(bx, M, bw, BH, 'main') + '<div class="wc-onm">';
    if(kicker) h += `<div class="wc-k" style="left:${tx}pt;top:${M + 20}pt;width:${tw}pt;text-align:${al}" data-slot="${slot}.kicker" data-lines="1">${esc(String(kicker).toUpperCase())}</div>`;
    h += `<div class="wc-disp" style="left:${tx}pt;top:${M + 42}pt;width:${tw}pt;height:${S.n*lh}pt;font-size:${S.f}pt;line-height:${lh}pt;text-align:${al};white-space:normal" data-slot="${slot}.title" data-lines="${S.n}" data-fine="1">${esc(t.toUpperCase())}</div></div>`;
    return {html: h, y: M + BH + G}; };

  // the kitchen card: the set's white writing panel with the accent line, its kicker and heading, then each row its label over two full
  // lines of true detail (the house fill rules); the rows share the height evenly
  FO.tableStack2 = (T, kicker, heading, x, y, w, hgt, slot) => { const lx = x + 18, liw = w - 36, hs = heading ? FXS.fitSize(String(heading).replace(/\.$/, ''), DCSS, liw, 16, 11) : 0, top = heading ? 58 : 38, lh = T.lh || +(T.f*1.4).toFixed(2);
    const need = r => 13 + (r.n || 2)*lh + 9, sum = T.rows.reduce((a, r) => a + need(r), 0), gap = Math.max(0, (hgt - top - 8 - sum)/Math.max(1, T.rows.length));
    let b = WC.panel(x, y, w, hgt);
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 16}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 31}pt;width:${liw}pt;font-size:${hs}pt;line-height:${hs*1.25}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    let ry = y + top;
    T.rows.forEach((r, i) => { const n = r.n || 2, c0 = ry + (gap + 9)/2 - 1;
      if(i) b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .5}pt;width:${liw}pt"></div>`;
      b += `<div class="wc-sq" style="left:${lx}pt;top:${c0 + 3.5}pt;width:5pt;height:5pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx + 11}pt;top:${c0 + 1}pt;width:${liw - 11}pt" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx}pt;top:${c0 + 14}pt;width:${liw + 1}pt;height:${n*lh}pt;font-family:var(--wc-font);font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;color:var(--fx-soft);overflow:hidden" data-slot="${slot}.list.t${i}" data-lines="${n}">${esc(r.t)}</div>`;
      ry += need(r) + gap; });
    return `<div class="wc-lt">${b}</div>`; };

  // ---------------- INSIDE LEFT (the living level): under the band the kitchen big, on its tab, with its card beside it at the same
  // height (the kitchen's facts; on the one-story the house's "What's new" story); then a locked row of captioned rooms. ----------------
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, cs = FO.cards(D, P.left || []);
    const kid = (P.strip || []).find(id => (D.photos || {})[id]) || (cs[0] || {}).photo, rowC = cs.filter(c => c.photo !== kid).slice(0, 3);
    const B = FO.band(D, 'left', I.kicker, 'left'), Y0 = B.y; let h = B.html;
    // the card's rows never repeat what the back's lists print (Night Fade's filter: a two-word list item repeats only when both its words are in the row)
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const taken = a => SW.grams4(a).some(g => backG.has(g)) || backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w))));
    const PH = FO.ROWH, top0 = box.heading ? 58 : 38, T = FO.tableRowsFlex((box.items || []).slice(0, 10), taken, {maxRows: 6, room: PH - top0 - 8}), cardW = T.V + 36, HR = CW - cardW - G;
    h += FXS.box(D, kid, X0, Y0, HR, PH, 'left.wide') + FO.tab(D, kid, 'left.wide', X0, Y0 + PH, HR);
    h += FO.tableStack2(T, box.kicker || 'The kitchen', box.heading, X0 + HR + G, Y0, cardW, PH, 'left');
    const y2 = Y0 + PH + G, n = Math.max(1, rowC.length), W2 = (CW - (n - 1)*G)/n, L = 3, clh = 13.5, RH = FOOT - y2 - 25 - L*clh;
    rowC.forEach((c, i) => { h += FXS.captioned(D, c, X0 + i*(W2 + G), y2, W2, RH, L, 'left.photo' + i, {fs: 10.25, lh: clh, min: 3}).replace(`data-slot="left.photo${i}" data-room`, `data-slot="left.photo${i}" data-nopair="1" data-room`); });
    return h;
  };

  // ---------------- INSIDE RIGHT (bedrooms and baths), its own arrangement: under the band the dark block meets the fold with the best
  // room's name and its write-up, the room itself beside it out to the page edge (block and photo one tile height); then a locked row of
  // the other rooms, baths and empty rooms last and small. ----------------
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs0 = FO.cards(D, P.right || []);
    const score = c => /closet|wic|pbath|bath|laundry|hall/i.test(c.photo) ? 0 : /^primary\d*$|suite/i.test(c.photo) ? 3 : /bed|game|living|family|media/i.test(c.photo) ? 2 : 1;
    const top = cs0.slice(0, 4).map((c, i) => [score(c), -i, c]).sort((a, b) => b[0] - a[0] || b[1] - a[1])[0], cs = top ? [top[2]].concat(cs0.filter(c => c !== top[2])) : cs0;
    const B = FO.band(D, 'right', R.kicker, 'right'), Y0 = B.y; let h = B.html;
    const DH = FO.ROWH, BW = 226, PX = X0 + BW + G;
    if(cs[0]){ const c = FXS.augment(D, cs[0]), L0 = FXS.leadLabel(c.lead);
      h += WC.block(X0, Y0, BW, DH, 'dark') + FXS.box(D, c.photo, PX, Y0, X1 - PX, DH, 'right.photo0');
      // the room's name is the block's display line (Bitter 700 caps, up to two lines), its plan size under it, then its write-up
      const nm = L0.name.toUpperCase(), NT = FO.fitTitle(nm, DCSS, BW - 36, 30, 16, 2), nlh = NT.f*1.04;
      h += `<div class="wc-ond"><div class="wc-disp" style="left:${X0 + 18}pt;top:${Y0 + 20}pt;width:${NT.w}pt;height:${NT.n*nlh}pt;font-size:${NT.f}pt;line-height:${nlh}pt;white-space:normal" data-slot="right.photo0.label" data-lines="${NT.n}">${esc(nm)}</div>`;
      let wy = Y0 + 20 + NT.n*nlh + 8;
      wy += 10; const lh = 17;
      const pool = []; (c.s || []).concat(R.intro || []).forEach(x => { const alts = [].concat(x).filter(a => !pool.some(q => [].concat(q).some(b => SW.sameFact(a, b) || SW.sharedPhrase(a, b)))); if(alts.length) pool.push(alts); });   // a fact once in the pool (the card and its room notes say the tray ceiling twice)
      const n = Math.floor((Y0 + DH - 16 - wy)/lh);
      h += FO.flex(FO.wu(pool, X0 + 18, wy, BW - 36, n*lh + 0.01, 'right.lead', 11.5, lh, 'wu')).replace('data-slot="right.lead"', `data-vgroup="right.photo0.label,${Y0},${DH}" data-growbox="11,17" data-vc="${wy},${Y0 + DH - 16 - wy}" data-room="${esc(L0.name)}" data-slot="right.lead"`) + '</div>'; }
    const rest = cs.slice(1, 4), y2 = Y0 + DH + G, n = Math.max(1, rest.length), W2 = (CW - (n - 1)*G)/n, L = 3, clh = 13.5, RH = FOOT - y2 - 25 - L*clh;
    rest.forEach((c, i) => { h += FXS.captioned(D, c, X0 + i*(W2 + G), y2, W2, RH, L, 'right.photo' + (i + 1), {fs: 10.25, lh: clh, min: 3}).replace(`data-slot="right.photo${i + 1}" data-room`, `data-slot="right.photo${i + 1}" data-nopair="1" data-room`); });
    return h;
  };
  FO.ROWH = 312;   // the big tile's height on both inside pages: one horizon for the rows under them
  FO.rightFit = () => {}; FO.leftHead = () => {};

  // ---------------- BACK (fold-over) and flyer back ----------------
  // Nearby as three accent anchor tiles across the page: the distance in Bitter numerals over the place in tracked caps
  FO.nearRow = (D, x, y, w, hh) => { const N = (((D.sw || {}).back || {}).nearby || []).slice(0, 3), n = Math.max(1, N.length), tw = (w - (n - 1)*G)/n;
    return N.map((nb, i) => { const ps = FXS.fitSize(String(nb.place).toUpperCase(), 'font-family:Schibsted Grotesk;font-weight:700;letter-spacing:1.4pt', tw - 26, 9.5, 8.6), ds = Math.min(hh*0.42, 22);
      return `<div class="fo-near" style="left:${x + i*(tw + G)}pt;top:${y}pt;width:${tw}pt;height:${hh}pt;padding:0 13pt"><span class="d" style="font-size:${ds}pt" data-slot="back.near${i}.d" data-lines="1" data-fine="1">${esc(nb.dist)}</span><span class="p" style="font-size:${ps}pt" data-slot="back.near${i}" data-lines="1" data-fine="1">${esc(nb.place)}</span></div>`; }).join(''); };
  FO.planBox = (D, x, y, maxH, maxW) => { const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: D.plan.turn ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: !!D.plan.turn, angle: D.plan.turn && D.plan.kind === 'color' ? 270 : undefined}), cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 44, D.plan.minCard || 0, 236)); return FXS.planCard(D, x, y, cw, maxH); };
  FO.CARD_H = 62; FO.CARD_Y = 692;
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:${FOOT - 9}pt;width:${CW}pt;height:9pt;text-align:left" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  // The plan in its box (the mat, the accent line) at its own shape, or with no plan the outdoor photo and its caption; beside it the main
  // block with the house's heading and the floors in white; the Nearby anchors across the page; a captioned photo beside the white panel with
  // the two lists (fold-over) or a row of captioned rooms over the panel (flyer); the contact card on the mat.
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [], L = D.listing || {};
    const topId = flyer ? P.flyerTop || (P.backNoplan || [])[0] : (P.back || [])[0] || (P.backNoplan || [])[0];
    const usedIn = new Set([].concat(P.left || [], P.right || [], [topId, (P.strip || [])[0]])), freeRow = (P.strip || []).slice(1).filter(id => (D.photos || {})[id] && !usedIn.has(id) && FXS.cardFor(D, id));
    const rowIds = flyer ? (P.flyerBack || []).slice(0, 3) : (hasPlan && (P.backNoplan || [])[0] ? [P.backNoplan[0]] : (P.backRowNoplan || (freeRow.length ? [freeRow[0]] : P.backRow) || ['bath2'])), rowCards = FO.cards(D, rowIds);
    const TOP = M; let h = '', top, leftW, wide = false;
    let TH = flyer ? 250 : 300;
    if(hasPlan && !D.plan.turn){ const nw = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: 900, h: TH - 34}, {allowRotate: false}).usedW || 999; if(nw < 190) TH = flyer ? 258 : 340; }
    const THW = flyer ? 190 : 236, natW = hasPlan && !D.plan.turn ? (IvoryPlan.draw(D.plan, {x: 0, y: 0, w: 900, h: THW - 34}, {allowRotate: false}).usedW || 0) : 0; wide = natW + 44 >= 400;
    if(wide){ const pc = FXS.planCard(D, X0, TOP, CW, THW); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom; leftW = CW; }
    else if(hasPlan){ const pc = FO.planBox(D, X0, TOP, TH, flyer ? 330 : 320); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom; leftW = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])); }
    else { leftW = 318; const c = FXS.cardFor(D, topId), tph = flyer ? 196 : 224; h += FXS.captioned(D, c, X0, TOP, leftW, tph, 3, 'back.top', {fs: 10.5, lh: 14, min: 3}); top = TOP + tph + 25 + 3*14; }
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const kickT = +(L.stories) > 1 ? 'Floor by floor' : 'Room by room', ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, '');
    // the main block: beside the plan or photo, or (a plan of many floors across the page) under it
    let bx, by, bw, bh;
    if(wide){ bx = X0; by = top + G; bw = CW; bh = flyer ? 104 : 132; top = by + bh; } else { bx = X0 + leftW + G; by = TOP; bw = X1 - bx; bh = top - TOP; }
    h += WC.block(bx, by, bw, bh, 'main');
    let t = '<div class="wc-onm">';
    if(wide){ const hw = 196, hs = ht ? FO.fitTitle(ht.toUpperCase(), DCSS, hw - 20, 24, 13, 3) : null, tx = bx + hw + 14, tw = bx + bw - 20 - tx, lh = 15.5, n = Math.floor((bh - 32)/lh);
      t += FO.kick(kickT, bx + 20, by + 18, 'back.about.title').replace('fo-kick', 'fo-kick wc-k');
      if(hs) t += `<div class="wc-disp" style="left:${bx + 20}pt;top:${by + 36}pt;width:${hs.w}pt;height:${hs.n*hs.f*1.08}pt;font-size:${hs.f}pt;line-height:${hs.f*1.08}pt;white-space:normal" data-slot="back.about.head" data-lines="${hs.n}">${esc(ht.toUpperCase())}</div>`;
      t += FO.full(FO.wu(keep(f2.concat(f1)), tx, by + (bh - n*lh)/2, tw, n*lh + 0.01, 'back.about', 10.5, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
    } else { const iw = bw - 36, hs = ht ? FO.fitTitle(ht.toUpperCase(), DCSS, iw, 22, 12, 3) : null, hh = hs ? hs.n*hs.f*1.08 : 0;
      t += FO.kick(kickT, bx + 18, by + 18, 'back.about.title').replace('fo-kick', 'fo-kick wc-k');
      if(hs) t += `<div class="wc-disp" style="left:${bx + 18}pt;top:${by + 35}pt;width:${hs.w}pt;height:${hh}pt;font-size:${hs.f}pt;line-height:${hs.f*1.08}pt;white-space:normal" data-slot="back.about.head" data-lines="${hs.n}">${esc(ht.toUpperCase())}</div>`;
      const wy = by + 35 + hh + 12, R = by + bh - 14 - wy, fs = R > 200 ? 12 : 10.75, n = Math.max(3, Math.floor(R/(fs*1.5))), lh = +(fs*1.5).toFixed(2);
      t += FO.full(FO.wu(keep(f2.concat(f1)), bx + 18, wy + (R - n*lh)/2, iw, n*lh + 0.01, 'back.about', fs, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${iw < 230 ? ' data-rag="1"' : ''} data-vc="${wy},${R}"${P.pool ? ` data-pool="${P.pool}"` : ''}`); }
    h += t + '</div>';
    const NH = flyer ? 50 : 56, ny = top + G; h += FO.nearRow(D, X0, ny, CW, NH);
    const y1 = ny + NH + G, BOXB = FO.CARD_Y - 12;
    const panel = (x, y, w, hh, colsN) => { let p = `<div class="wc-lt">${WC.panel(x, y, w, hh)}`; const ix = x + 18, iw = w - 36;
      if(colsN === 2){ const cw2 = (iw - 22)/2, ly0 = y + 15 + 18, cap = Math.max(2, Math.min(5, Math.floor((y + hh - 10 - ly0)/19))), rws = Math.max(Math.min(c1.length, cap), Math.min(c2.length, cap), 2), rh = Math.min(26, (y + hh - 10 - ly0)/rws), ty = y + (hh - 18 - rws*rh)/2, ly = ty + 18;   // the lists sit centered top to bottom in the panel
        p += FO.kick(t1, ix, ty, 'back.updates.title') + FXS.bullets(c1, ix, ly, cw2, rh, 'back.updates', cap, 10.5).html;
        p += FO.kick('Outside', ix + cw2 + 22, ty, 'back.outside.title') + FXS.bullets(c2, ix + cw2 + 22, ly, cw2, rh, 'back.outside', cap, 10.5).html;
      } else { const n1 = FXS.bullets(c1, ix, 0, iw, 1, 'x', 5, 10.5).n, n2 = FXS.bullets(c2, ix, 0, iw, 1, 'x', 5, 10.5).n, free = hh - 15 - 18 - 12 - 18 - 10; let a = Math.min(n1, 5), b2 = Math.min(n2, 5); while((a + b2)*19 > free && a + b2 > 4){ if(a >= b2) a--; else b2--; }
        const rh = Math.min(26, free/Math.max(1, a + b2)), ty = y + (hh - (18 + a*rh + 12 + 18 + b2*rh))/2;
        p += FO.kick(t1, ix, ty, 'back.updates.title') + FXS.bullets(c1, ix, ty + 18, iw, rh, 'back.updates', a, 10.5).html;
        const ty2 = ty + 18 + a*rh + 12; p += FO.kick('Outside', ix, ty2, 'back.outside.title') + FXS.bullets(c2, ix, ty2 + 18, iw, rh, 'back.outside', b2, 10.5).html; }
      return p + '</div>'; };
    if(flyer){
      const n = rowCards.length, tw = (CW - (n - 1)*G)/n, nb = Math.max(Math.min(c1.length, 4), Math.min(c2.length, 4), 2), need = 15 + 18 + nb*19 + 10, PH = Math.max(96, Math.min(200, BOXB - need - G - y1 - 25 - 3*13.5));
      rowCards.forEach((c, i) => { h += FXS.captioned(D, c, X0 + i*(tw + G), y1, tw, PH, 3, 'back.photo' + i, {fs: 10.25, lh: 13.5, min: 3}).replace(`data-slot="back.photo${i}" data-room`, `data-slot="back.photo${i}" data-nopair="1" data-room`); });
      const py = y1 + PH + 25 + 3*13.5 + G; h += panel(X0, py, CW, BOXB - py, 2);
    } else {
      const bh2 = BOXB - y1, ph = bh2 - 25 - 3*14, pw = Math.max(200, Math.min(250, Math.round(ph*1.5)));
      h += FXS.captioned(D, rowCards[0], X0, y1, pw, ph, 3, 'back.photo1', {fs: 10.5, lh: 14, min: 3}).replace('data-slot="back.photo1" data-room', 'data-slot="back.photo1" data-shrinkphoto="1" data-room');
      { const pwid = X1 - X0 - pw - G, cw2 = (pwid - 36 - 22)/2, fits = l => FXS.bullets(l, 0, 0, cw2, 1, 'x', 9, 10.5).n === Math.min(l.length, 9); h += panel(X0 + pw + G, y1, pwid, bh2, pwid >= 300 && fits(c1) && fits(c2) ? 2 : 1); }
    }
    h += FO.contact(D, X0, window.__cardY || FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D);
    return {html: h, issues};
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
    for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement; if(!p || !n.textContent.trim() || p.closest('script, style, .plan-svg, .planwrap, .fo-acard, .logo, [data-tab]')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(q => { if(q.width < 2 || q.height < 2) return;
        els.forEach(({e, r}) => { if(e.contains(p)) return; const ox = Math.min(q.right, r.right) - Math.max(q.left, r.left), oy = Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top);
          if(ox > 1.5 && oy > 3) out.push({slot: (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || 'text', kind: 'text-under-element', detail: `"${n.textContent.trim().slice(0, 28)}" overlaps a ${e.className.split(' ')[0]}`}); }); }); }
    const seen = new Set(); return out.filter(i => { const k = i.slot + i.detail; if(seen.has(k)) return false; seen.add(k); return true; }); };
})();
