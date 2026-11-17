/* Luncheon Band fold-over and two-sided flyer builders (grown from the FXS-14 builders; the hand is the approved Open House library
   flyer B10). Panel coordinates in pt: trim 612 x 792 (the proof page adds a 9 pt bleed; anything that bleeds runs to -9 / 621 / 801).
   B10's closed frame sits at 20/30/592/776 on every panel, drawn last. After the fill: FO.refit sets any block, caption row or table
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

  // Luncheon Band: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Luncheon Band refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:PlexCond;letter-spacing:3.4pt", HW, 24, 13, 5), lh = T.f*1.3, H = 17 + T.n*lh + 9 + 1.2, y = 30 + (270 - 30 - H)/2;
    kk.style.top = y + 'pt'; ti.style.top = (y + 17) + 'pt'; ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = (T.n*lh) + 'pt'; ti.dataset.lines = T.n; ru.style.top = (y + 17 + T.n*lh + 9) + 'pt'; };
  // after the fill: the cover write-up sits on the frame's foot; the rooms above it grow down into any room it did not use (no empty band)
  FO.frontSnug = () => {}; FO.frontSnugOld = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = 766 - n*lh;
    const lbls = [...document.querySelectorAll('[data-slot^="front.strip"][data-slot$=".label"]')]; if(!lbls.length) return; const lb = Math.max(...lbls.map(l => parseFloat(l.style.top) + 11)), d = top - 16 - lb; su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt'; if(d <= 0) return;
    lbls.forEach(l => { l.style.top = (parseFloat(l.style.top) + d) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // how many lines a text sets in width w (greedy word wrap, measured)
  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  // a heading that wraps: the size (from max down) at which its last line is at least 80% of the box (the last-line rule), else the largest one-line size
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  FO.fitTitle = (t, fam, w, max, min, maxLines) => { for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w)) return {f, n: L.length, w}; }
    for(const k of [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6]) for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w*k); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w*k)) return {f, n: L.length, w: w*k}; }
    return {f: min, n: FO.wrapLines(t, `${fam};font-size:${min}pt`, w).length, w}; };
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
  FO.tableRows = (items0, liw, taken, o) => { o = o || {}; const lcss = 'font-family:Franklin;font-weight:500;font-size:8.6pt;letter-spacing:2.2pt', LW0 = o.stack ? 0 : Math.ceil(Math.max(...items0.map(it => FXS.width(String(it.l).toUpperCase(), lcss)))) + 20;
    const ok = a => !taken || !taken(a); let best = null; const MIN = 0.86, opts = o.stack ? (o.Vs || [178, 184, 190, 196, 202, 208, 214]).map(V => [0, V]) : [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60].map(d => [LW0 + d, liw - LW0 - d]);
    for(let f = o.stack ? 10 : 10.5; f <= (o.stack ? 11.51 : 12.01); f += 0.25) for(const [LW, V] of opts){ const css = `font-family:Franklin;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bw = 0;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const w = FXS.width(t, css); if(w <= V - 2 && w > bw){ bw = w; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt, fill: bw/V}; }).filter(r => r.t);
      const full = Math.min(rows.filter(r => r.fill >= MIN).length, o.maxRows || 99), score = full*100 + (LW === LW0 ? 3 : 0) + f - (o.stack ? V*0.04 : rows.filter(r => r.fill < MIN).length*2) + Math.min(...rows.map(r => r.fill).concat(1))*10;
      if(!best || score > best.score) best = {score, f, LW, V, rows}; }
    let rows = best.rows; const good = rows.filter(r => r.fill >= MIN);
    if(good.length >= 4) rows = good; else { const keep = rows.slice().sort((a, b) => b.fill - a.fill).slice(0, Math.max(4, good.length)); rows = rows.filter(r => keep.includes(r)); }
    return Object.assign(best, {rows: rows.slice(0, o.maxRows || 99)}); };
  // Design pass 11/15 (second review): the card beside the kitchen is the fold-over's one light moment (B10's white card), four rows of real
  // detail. Each row is its label over TWO full lines (the first 80%+ of the measure, the last 90%+, by the house fill rules): the
  // wording, the type size (10 to 11.5 pt) and the measure are chosen so every kept row fills; a row that cannot is left out.
  FO.wrapW = (t, css, V) => { const out = []; let cur = ''; String(t).split(' ').forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > V - 0.5){ out.push(FXS.width(cur, css)); cur = wd; } else cur = tr; }); if(cur) out.push(FXS.width(cur, css)); return out; };
  FO.tableRows2 = (items0, taken, o) => { o = o || {}; const ok = a => !taken || !taken(a); let best = null;
    for(let f = 10; f <= 11.51; f += 0.25) for(const V of (o.Vs || [184, 190, 196, 202, 208, 214, 220])){ const css = `font-family:Franklin;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t) || /^(It|Its|They|This|That)\b/.test(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== 2 || Lw[0] < 0.8*V || Lw[1] < 0.9*V) return; const sc = (Lw[0] + Lw[1])/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 4), score = n*100 + f*2 - V*0.05;
      if(!best || score > best.score) best = {score, f, V, LW: 0, rows: rows.slice(0, o.maxRows || 4)}; }
    return best; };
  // ================= Luncheon Band layouts (B10): the kit's paper, one band per page, B10's boxes under it =================
  // Geometry (pt, panel trim 612 x 792): B10's 36 pt margin; photos sit INSIDE the margin (square cut, never bleeding); the band is the
  // one thing that runs edge to edge (it bleeds to -9 / 621, and across the fold on the inside spread). Under the band B10's two boxes:
  // the white box with the main-color line on the left, a 25% hairline at x 324, the text column on the right. B10's foot: a hairline
  // at 696, the contact card, the fine print.
  const M = 36, X0 = M, X1 = 612 - M, CW = X1 - X0, CX = 324, AX = CX + 18, AW = X1 - AX;
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW; FO.FR = [0, 0, 612, 792];
  FO.frame = () => '';
  FO.heroId = (D, id) => { const ph = D.photos || {}, sp = SW.space(D, id); if((ph[id] || {}).dusk) return id; const d = Object.keys(ph).find(k => ph[k].dusk && ph[k].fullHouse && SW.space(D, k) === sp); return d || id; };
  FO.isDusk = (D, id) => !!((D.photos || {})[id] || {}).dusk;
  FO.tileC = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 6}pt;width:${w}pt;white-space:nowrap"><div class="lbl lb-tl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;
  const BOLD = 'font-family:PlexCond;font-weight:700;letter-spacing:.3pt', REG = 'font-family:PlexCond;font-weight:400;letter-spacing:.3pt';
  // the band: dark, edge to edge (x -9 .. 621 on a panel; `o.x0/o.x1` for a card)
  FO.band = (y, h, o) => { o = o || {}; return `<div class="lb-band" data-band="1" style="left:${o.x0 == null ? -9 : o.x0}pt;top:${y}pt;width:${(o.x1 == null ? 621 : o.x1) - (o.x0 == null ? -9 : o.x0)}pt;height:${h}pt"></div>`; };
  // B10's two-weight title: parts [[text, accent?], ...] in caps, the largest size (max .. min) at which the line fits w. Returns {f, w} (measured width)
  FO.twoW = (parts, f) => parts.reduce((n, [t, ac], i) => n + FXS.width((i ? ' ' : '') + String(t).toUpperCase(), `${ac ? REG : BOLD};font-size:${f}pt`), 0);
  FO.twoFit = (parts, w, max, min) => { let f = max; while(f > min && FO.twoW(parts, f) > w - 2) f -= 0.5; return f; };
  FO.twoHtml = (parts, x, y, w, f, slot, al) => `<div class="lb-bt${al === 'c' ? ' c' : ''}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${f*1.18}pt;font-size:${f}pt;line-height:${f*1.18}pt;${al === 'r' ? 'text-align:right' : ''}" data-slot="${slot}" data-lines="1">${parts.map(([t, ac], i) => (i ? ' ' : '') + (ac ? `<span class="ac">${esc(String(t))}</span>` : esc(String(t)))).join('')}</div>`;
  // B10's "At a glance": line icons, Plex Condensed values, tracked labels, hairlines between the cells
  FO.glance = (L, x, y, w, h, slot, o) => { o = o || {}; const fl = LB.facts(L, {built: o.built !== false}), cw = w/Math.max(1, fl.length), vs = o.vs || 20;
    let s = ''; fl.forEach(([ic, v, k], i) => { s += `<div class="lb-fact" style="left:${x + i*cw}pt;top:${y + (h - 62 - (vs - 20))/2}pt;width:${cw}pt;height:${62 + vs - 20}pt">${LB.ICON[ic] || ''}<div class="v" style="font-size:${vs}pt;line-height:${vs*1.2}pt" data-slot="${slot}.f${i}" data-lines="1">${esc(String(v))}</div><div class="l" data-slot="${slot}.f${i}.k" data-lines="1"${fl.length > 4 || o.short ? ' style="letter-spacing:.3pt"' : ''}>${esc(o.short ? k.replace(/^Square feet$/, 'Sq ft') : k)}</div></div>`;
      if(i) s += `<div class="lb-vr" style="left:${x + i*cw}pt;top:${y + 8}pt;height:${h - 16}pt"></div>`; });
    return s; };
  // a 2 x 2 (or 2 x 3) glance grid for a box
  FO.glanceGrid = (L, x, y, w, h, slot) => { const fl = LB.facts(L, {built: true}), cols = 2, rows = Math.ceil(fl.length/cols), cw = w/cols, rh = h/rows; let s = '';
    fl.forEach(([ic, v, k], i) => { const c = i % cols, r = Math.floor(i/cols); s += `<div class="lb-fact" style="left:${x + c*cw}pt;top:${y + r*rh + (rh - 62)/2}pt;width:${cw}pt;height:62pt">${LB.ICON[ic] || ''}<div class="v" data-slot="${slot}.f${i}" data-lines="1">${esc(String(v))}</div><div class="l" data-slot="${slot}.f${i}.k" data-lines="1">${esc(k)}</div></div>`; });
    for(let r = 1; r < rows; r++) s += `<div class="lb-hr" style="left:${x + 14}pt;top:${y + r*rh}pt;width:${w - 28}pt"></div>`;
    s += `<div class="lb-vr" style="left:${x + cw}pt;top:${y + 10}pt;height:${h - 20}pt"></div>`;
    return s; };
  FO.place = L => FXS.placeLine(L).replace(/^([^,]+), TX/, '$1, Texas');
  FO.factsLine = L => { const items = FXS.statItems(L).filter(x => !/^Built/.test(x)); const yr = L.yearBuilt || L.year; if(yr) items.push('Built ' + yr); return items; };

  // ---------------- COVER: B10's own order, grown. The whole house inside the margin; the band under it with the street as large as it
  // goes (the neighborhood the band's light word), the place and the one line; under the band "At a glance" across the page. ----------------
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, hero = FO.heroId(D, F.hero || K.hero || 'front');
    const hood = FXS.hood(L), st = String(L.address || ''), BY = 492, BH = 160;
    let h = SW.heroHtml(D, hero, X0, M, CW, BY - 18 - M, 'front.house', []);
    h += FO.band(BY, BH);
    let parts = hood ? [[st, 0], [hood, 1]] : [[st, 0]], f = FO.twoFit(parts, 560, 60, 30);
    if(hood && f < 46){ parts = [[st, 0]]; f = FO.twoFit(parts, 560, 60, 30); }
    const pl = (parts.length < 2 && hood ? hood + '  ·  ' : '') + FO.place(L), ps = FXS.fitSize(pl, REG, 540, 22, 15);
    const line = String(K.line || '').replace(/\.$/, '') + (K.line ? '.' : ''), lfs = line ? FXS.fitSize(line, 'font-family:Franklin;font-weight:600', 540, 12, 9.5) : 0;
    const blockH = f*1.18 + 4 + ps*1.25 + (line ? 10 + lfs*1.3 : 0), ty = BY + (BH - blockH)/2;
    h += FO.twoHtml(parts, 26, ty, 560, f, 'address', 'c');
    h += `<div class="lb-b3" style="left:${X0}pt;top:${ty + f*1.18 + 4}pt;width:${CW}pt;height:${ps*1.25}pt;font-size:${ps}pt;line-height:${ps*1.25}pt;text-align:center" data-slot="front.place" data-lines="1">${esc(pl)}</div>`;
    if(line) h += `<div class="lb-b4" style="left:${X0}pt;top:${ty + f*1.18 + 4 + ps*1.25 + 10}pt;width:${CW}pt;height:${lfs*1.3}pt;font-size:${lfs}pt;line-height:${lfs*1.3}pt;text-align:center" data-slot="front.line" data-lines="1">${esc(line)}</div>`;
    const gy = BY + BH + 16;
    h += `<div class="lb-k" style="left:${X0}pt;top:${gy}pt;width:${CW}pt;text-align:center" data-slot="front.glance.k" data-lines="1">At a glance</div>`;
    h += FO.glance(L, X0, gy + 14, CW, 756 - gy - 14, 'front.glance', {vs: 30});
    return h;
  };

  // ---------------- FLYER FRONT: its own composition in the same hand. The band at the head of the page (bleeding off the top) with the
  // street at poster size; the house under it; three rooms; then B10's two boxes: "At a glance" in the white box, the write-up beside it. --
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), hood = FXS.hood(L), st = String(L.address || ''), BH = 146;
    let h = FO.band(-9, BH + 9);
    const f = FO.twoFit([[st, 0]], CW, 66, 34), pl = [hood, FO.place(L)].filter(Boolean).join('  ·  '), ps = FXS.fitSize(pl, REG, CW, 22, 14), bh = f*1.18 + 2 + ps*1.25, ty = (BH - bh)/2 + 2;
    h += FO.twoHtml([[st, 0]], X0, ty, CW, f, 'address', 'c');
    h += `<div class="lb-b3" style="left:${X0}pt;top:${ty + f*1.18 + 2}pt;width:${CW}pt;height:${ps*1.25}pt;font-size:${ps}pt;line-height:${ps*1.25}pt;text-align:center" data-slot="front.place" data-lines="1">${esc(pl)}</div>`;
    const HY = BH + 16; let HH = 262; while(HH < 330 && !SW.fits(D, hero, CW, HH)) HH += 4; h += SW.heroHtml(D, hero, X0, HY, CW, HH, 'front.house', []);
    const by = HY + HH + 18, bh2 = Math.max(128, 186 - (HH - 262));
    h += `<div class="lb-box" data-gbox="front.glance" style="left:${X0}pt;top:${by}pt;width:270pt;height:${bh2}pt"></div>`;
    h += `<div class="lb-k" style="left:${X0 + 14}pt;top:${by + 11}pt;width:242pt" data-slot="front.glance.k" data-lines="1">At a glance</div>`;
    h += bh2 >= 170 ? FO.glanceGrid(L, X0, by + 24, 270, bh2 - 28, 'front.glance') : FO.glance(L, X0 + 4, by + 22, 262, bh2 - 24, 'front.glance', {vs: 18, short: true});
    h += `<div class="lb-vr" style="left:${CX}pt;top:${by}pt;height:${bh2}pt"></div>`;
    h += `<div class="lb-k" style="left:${AX}pt;top:${by + 2}pt;width:${AW}pt" data-slot="front.about.k" data-lines="1">About the home</div>`;
    const wy = by + 20, avail = by + bh2 - wy, lh = 17.5, nl = Math.floor(avail/lh);
    h += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="${[0, 1, 2, 3, 4].map(d => nl - d).join(',')}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${AX}pt;top:${wy}pt;width:${AW}pt;height:${nl*lh}pt;font-size:12pt;line-height:${lh}pt"></div>`).replace('data-slot="front.summary"', `data-slot="front.summary" data-span="${avail.toFixed(2)}"`);
    // three rooms along the foot, each named in the label caps (the sign-in sheet's small photo, three times)
    const strip = (o.strip || P.flyerStrip || P.strip || []).slice(0, 3), g = 14, sw_ = (CW - (strip.length - 1)*g)/Math.max(1, strip.length), SY = by + bh2 + 18, SH = 758 - SY;
    strip.forEach((id, i) => { h += FO.tileC(D, id, X0 + i*(sw_ + g), SY, sw_, SH, 'front.strip' + i); });
    return h;
  };

  // ---------------- THE INSIDE SPREAD: one band across the fold. Both pages: the lead room inside the margin at the top; the band at the same
  // height on both pages, bleeding into the fold so it reads as one band across the spread; each half carries its page's label (the band's
  // light word) and title (bold caps, 30 pt and up, two lines at most). Under the band B10's two boxes. ----------------
  FO.BAND_Y = 352; FO.BAND_H = 140; FO.LOW = FO.BAND_Y + FO.BAND_H + 18;
  FO.spreadHead = (kicker, title, slot) => { const t = String(title || '').replace(/\.$/, '').toUpperCase().replace(/(^| )([AI]) /g, '$1$2 '), fam = BOLD;
    const words = q => new Set((String(q).toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length > 2 && !['the', 'and', 'with'].includes(w))), kw = [...words(kicker)], tw = words(title), rep = kw.length > 0 && kw.every(w => tw.has(w) || tw.has(w.replace(/s$/, '')) || tw.has(w + 's'));
    const T = FO.fitTitle(t, fam, CW, 44, 30, 2), lh = T.f*1.08, kh = rep || !kicker ? 0 : 20, bh = kh + T.n*lh, y = FO.BAND_Y + (FO.BAND_H - bh)/2 + 2;
    let h = kh ? `<div class="abs lb-k" style="left:${X0}pt;top:${y}pt;width:${CW}pt;text-align:center;color:var(--lb-acc-dark)" data-slot="${slot}.kicker" data-lines="1">${esc(String(kicker))}</div>` : '';
    h += `<div class="lb-bt c" style="left:${X0 + (CW - T.w)/2}pt;top:${y + kh}pt;width:${T.w}pt;height:${T.n*lh}pt;font-size:${T.f}pt;line-height:${lh}pt;white-space:normal" data-slot="${slot}.title" data-lines="${T.n}" data-fine="1">${esc(t)}</div>`;
    return h; };
  FO.lowBox = (kicker, heading, x, y, w, hgt, slot) => { const hs = heading ? FXS.fitSize(String(heading).replace(/\.$/, ''), "font-family:PlexCond;font-weight:700", w - 28, 17, 10) : 0;
    let b = `<div class="lb-box" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    if(kicker) b += `<div class="abs lb-k" style="left:${x + 14}pt;top:${y + 11}pt;width:${w - 28}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || ''))}</div>`;
    if(heading) b += `<div class="lb-st" style="left:${x + 14}pt;top:${y + 25}pt;width:${w - 28}pt;height:${hs*1.25}pt;font-size:${hs}pt;line-height:${hs*1.25}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    return {html: b, top: y + (heading ? 31 + hs*1.25 : 30)}; };

  // INSIDE LEFT: the kitchen at the top; under the band the kitchen card (B10's white box: its label, a heading, four rows of real detail,
  // each its label over two full lines) and, past the hairline, the room the title names, captioned
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, ids = P.left || [], heroC = FXS.cardFor(D, ids[0]);
    const sideId = P.leftSide || ids[2] || ids[1], sideC = FXS.cardFor(D, sideId);
    let h = FXS.box(D, heroC.photo, X0, M, CW, FO.BAND_Y - 16 - M, 'left.wide');
    const L0 = FXS.leadLabel(heroC.lead);
    h += FO.band(FO.BAND_Y, FO.BAND_H, {x1: 621}) + FO.spreadHead(I.kicker, I.title, 'left');
    // the kitchen card's rows: a row is dropped only for a fact the back's lists really print; a two-word list item repeats only when both its words are in the row (Night Fade fix)
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside || {}).items || SFb.inside, (BXb.outside || {}).items || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const taken = a => SW.grams4(a).some(g => backG.has(g)) || backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w))));
    const y0 = FO.LOW, hb = 776 - y0, bw = CX - 18 - X0;
    const T = FO.tableRows2((box.items || []).slice(0, 10), taken, {maxRows: 4, Vs: [206, 212, 218, 224, 230, bw - 28]});
    const lb = FO.lowBox(box.kicker || L0.name, box.heading, X0, y0, bw, hb, 'left'); h += lb.html;
    const n = Math.max(1, T.rows.length), rowH = (y0 + hb - 8 - lb.top)/n, lh = +(T.f*1.4).toFixed(2);
    T.rows.forEach((r, i) => { const ry = lb.top + i*rowH, c0 = ry + (rowH - 13 - 2*lh)/2;
      h += `<div class="lb-hr" style="left:${X0 + 14}pt;top:${ry}pt;width:${bw - 28}pt"></div>`;
      h += `<div class="abs fo-li-l" style="left:${X0 + 14}pt;top:${c0 + 2}pt;width:${bw - 28}pt" data-slot="left.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      h += `<div class="abs fo-li-t" style="left:${X0 + 14}pt;top:${c0 + 15}pt;width:${T.V + 1}pt;height:${2*lh}pt;font-size:${T.f}pt;line-height:${lh}pt;white-space:normal" data-slot="left.list.t${i}" data-lines="2">${esc(r.t)}</div>`; });
    h += `<div class="lb-vr" style="left:${CX}pt;top:${y0}pt;height:${hb}pt"></div>`;
    if(sideC){ const L2 = 6, lh2 = 13.5, ph = hb - 25 - L2*lh2; h += FXS.captioned(D, sideC, AX, y0, AW, ph, L2, 'left.photo0', {fs: 10, lh: lh2, min: 3}).replace('data-slot="left.photo0" data-room', 'data-slot="left.photo0" data-nopair="1" data-room'); }
    return h;
  };

  // INSIDE RIGHT: the lead bedroom at the top; under the band its write-up in the left column (the room's label, the size, whole sentences),
  // and past the hairline a second room, captioned
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs = FO.cards(D, P.right || []), lead = cs[0], rest = cs.slice(1), side = rest.find(c => c.photo === P.rightSide) || rest[0], tile = rest.find(c => c !== side);
    let h = FXS.box(D, lead.photo, X0, M, CW, FO.BAND_Y - 16 - M, 'right.wide');
    h += FO.band(FO.BAND_Y, FO.BAND_H, {x0: -9}) + FO.spreadHead(R.kicker || '', R.title || '', 'right');
    const y0 = FO.LOW, hb = 776 - y0, bw = CX - 18 - X0, L0 = FXS.leadLabel(lead.lead);
    h += `<div class="abs" style="left:${X0}pt;top:${y0 + 2}pt;width:${bw}pt;white-space:nowrap"><div class="lbl" data-slot="right.wide.label" data-lines="1">${esc(L0.name.toUpperCase())}</div>${L0.size ? `<div class="lbl sz" data-size="1">${esc(L0.size)}</div>` : ''}</div>`;
    // the lead room's write-up (six lines at most); under it a third room, named, that takes whatever the write-up leaves (FO.rightSnug)
    const c = FXS.augment(D, lead), pool = (c.s || []).concat((R.intro || [])), wy = y0 + 20, lh = 15.5, nl = tile ? 6 : Math.floor((776 - wy)/lh);
    h += FO.full(`<div class="abs wu" data-slot="right.about" data-lines="${nl}" data-try="${[0, 1, 2, 3].map(d => nl - d).filter(x => x >= 3).join(',')}" data-lh="${lh}" ${FXS.sd(pool)} style="left:${X0}pt;top:${wy}pt;width:${bw}pt;height:${nl*lh}pt;font-size:11pt;line-height:${lh}pt"></div>`);
    if(tile){ const ty = wy + nl*lh + 14, th = 776 - 17 - ty; h += `<div data-under="right.about" data-gap="14">` + FO.tileC(D, tile.photo, X0, ty, bw, th, 'right.photo2') + `</div>`; }
    h += `<div class="lb-vr" style="left:${CX}pt;top:${y0}pt;height:${hb}pt"></div>`;
    if(side){ const L2 = 6, lh2 = 13.5, ph = hb - 25 - L2*lh2; h += FXS.captioned(D, side, AX, y0, AW, ph, L2, 'right.photo1', {fs: 10, lh: lh2, min: 3}).replace('data-slot="right.photo1" data-room', 'data-slot="right.photo1" data-nopair="1" data-room'); }
    return h;
  };
  // after the fill: a photo that sits under a write-up (data-under) starts just under the write-up's last line and grows up into the room it left
  FO.rightSnug = () => document.querySelectorAll('[data-under]').forEach(w => { const el = document.querySelector(`[data-slot="${w.dataset.under}"]`); if(!el) return;
    const n = SW.lines(el).n, lh = parseFloat(el.style.lineHeight), top = parseFloat(el.style.top), bottom = top + n*lh, ph = w.querySelector('.ph'), pb = ph && ph.parentElement; if(!pb) return;
    el.style.height = (n*lh) + 'pt'; const nt = bottom + (+w.dataset.gap || 14), d = parseFloat(pb.style.top) - nt; if(Math.abs(d) < .5) return;
    pb.style.top = nt + 'pt'; pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; });
  FO.rightFit = () => {}; FO.leftHead = () => {};

  // ---------------- BACK (fold-over) and flyer back: the headline over the page; the plan in a box its own shape (or the big outdoor photo)
  // with the write-up past B10's hairline; the band across the page carrying the three real distances (B10's facts cells, reversed); under
  // it the white box with the two lists and, past the hairline, a captioned room; B10's foot. ----------------
  FO.CARD_H = 62; FO.CARD_Y = 690;
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:758pt;width:${CW}pt;height:8pt" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = LB.logoSrc(D); const pw = 180, lh = Math.min(46, H - 18), s = {name: 18, nameFloor: 15, hsW: Math.round(H*0.82), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 10, lh], square: [H - 20, H - 20], tall: [H - 20, H - 20]}};
    return `<div style="--cc-display:PlexCond;--cc-body:Franklin">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: false}) + '</div>'; };
  FO.nearBand = (D, y, h, x0, x1) => { const N = ((D.sw || {}).back || {}).nearby || [], n = Math.min(3, N.length), w = (x1 - x0)/Math.max(1, n); let s = '';
    N.slice(0, n).forEach((nb, i) => { const ps = Math.min(13, FXS.fitSize(String(nb.place).toUpperCase(), 'font-family:PlexCond;font-weight:400;letter-spacing:.6pt', w - 16, 13, 9));
      s += `<div class="fo-near" style="left:${x0 + i*w}pt;top:${y}pt;width:${w}pt;height:${h}pt" data-slot="back.near${i}" data-lines="1" data-fine="1"><span class="d">${esc(nb.dist)}</span><span class="p" style="font-size:${ps}pt">${esc(nb.place)}</span></div>`;
      if(i) s += `<div class="lb-vr" style="left:${x0 + i*w}pt;top:${y + 14}pt;height:${h - 28}pt;background:rgba(255,255,255,.4);width:1pt"></div>`; });
    return s; };
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    const wide = id => { const p = (D.photos || {})[id] || {}; return !p.w || p.w/p.h >= 1.2; };   // a portrait photo never goes in the short row frame
    const rowIds = (flyer ? (P.flyerBack || []) : (P.backRow || ['bath2'])).filter(wide).slice(0, 1), rowCards = FO.cards(D, rowIds);
    const LV = hasPlan ? (D.plan.levels || []) : [], tall = hasPlan && (LV.length >= 4 || (LV.length === 1 && LV[0].h/LV[0].w > 1.5));
    const kickT = +(D.listing || {}).stories > 1 ? 'Floor by floor' : 'Room by room';
    const ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, '').toUpperCase(), hf = ht ? FXS.fitSize(ht, BOLD, CW, 38, 24) : 0;
    let h = `<div class="abs lb-k" style="left:${X0}pt;top:${M}pt;width:${CW}pt" data-slot="back.about.kicker" data-lines="1">${esc(kickT)}</div>`;
    if(ht) h += `<div class="fo-head" style="left:${X0}pt;top:${M + 13}pt;width:${CW}pt;height:${hf*1.15}pt;font-size:${hf}pt;line-height:${hf*1.15}pt;white-space:nowrap" data-slot="back.about.head" data-lines="1">${esc(ht)}</div>`;
    const TOP = M + 13 + (ht ? hf*1.15 : 0) + 14;
    h += `<div class="lb-hr ink" style="left:${X0}pt;top:${TOP - 7}pt;width:${CW}pt"></div>`;
    const BAND_Y = tall ? 572 : 420, BAND_H = tall ? 88 : 76, ZB = BAND_Y - 18;
    let leftW;
    if(hasPlan){ const pc = FO.planBox(D, X0 - 14, TOP + 4, ZB - TOP - 4 - 36, tall ? 300 : 352); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; leftW = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])) - 14; }
    else { leftW = 300; const c = FXS.cardFor(D, topId), ph = ZB - TOP - 4 - 25 - 4*13.5; h += FXS.captioned(D, c, X0, TOP + 4, leftW, ph, 4, 'back.top', {fs: 10, lh: 13.5, min: 3}); }
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const vx = X0 + leftW + 16, ax = vx + 18, aw = X1 - ax;
    h += `<div class="lb-vr" style="left:${vx}pt;top:${TOP}pt;height:${ZB - TOP}pt"></div>`;
    // tall plans: the lists move up beside the plan, under the write-up; the room photo is left out
    const listsBeside = tall, lb0 = listsBeside ? 196 : 0, wT = TOP + 2, wB = ZB - (listsBeside ? lb0 + 14 : 0), n = Math.floor((wB - wT)/15.5), lh = +((wB - wT)/n).toFixed(3);
    h += FO.full(FO.wu(keep(f2.concat(f1)), ax, wT, aw, n*lh + 0.01, 'back.about', 10.5, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${aw < 240 ? ' data-rag="1"' : ''} data-span="${(wB - wT).toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
    h += FO.band(BAND_Y, BAND_H) + FO.nearBand(D, BAND_Y, BAND_H, X0, X1);
    const lists = (x, y, w, hh) => { const lb = FO.lowBox('', '', x, y, w, hh, 'back'); let t = lb.html; const cw = (w - 42)/2, X = [x + 14, x + 14 + cw + 14], ly = y + 30, cap = Math.max(3, Math.min(5, Math.floor((y + hh - 8 - ly)/19))), fs = 10;
      const b1 = FXS.bullets(c1, X[0], 0, cw, 1, 'x', cap, fs).n, b2 = FXS.bullets(c2, X[1], 0, cw, 1, 'x', cap, fs).n, rows = Math.max(b1, b2, 3), rh = (y + hh - 10 - ly)/rows;
      t += `<div class="abs lb-k" style="left:${X[0]}pt;top:${y + 12}pt;width:${cw}pt" data-slot="back.updates.title" data-lines="1">${esc(t1)}</div>` + FXS.bullets(c1, X[0], ly, cw, rh, 'back.updates', cap, fs).html;
      t += `<div class="abs lb-k" style="left:${X[1]}pt;top:${y + 12}pt;width:${cw}pt" data-slot="back.outside.title" data-lines="1">Outside</div>` + FXS.bullets(c2, X[1], ly, cw, rh, 'back.outside', cap, fs).html;
      return t + `<div class="lb-vr" style="left:${x + 14 + cw + 6}pt;top:${y + 12}pt;height:${hh - 24}pt"></div>`; };
    const LY = BAND_Y + BAND_H + 16, LB2 = 668;
    if(listsBeside){ h += lists(ax - 4, wB + 14, X1 - ax + 4, lb0); }
    else {
      const rc = rowCards[0], bw = rc ? 300 : CW; h += lists(X0, LY, bw, LB2 - LY);
      if(rc){ const px = X0 + bw + 34, pw = X1 - px, L2 = 3, ph = LB2 - LY - 25 - L2*13; h += `<div class="lb-vr" style="left:${X0 + bw + 17}pt;top:${LY}pt;height:${LB2 - LY}pt"></div>` + FXS.captioned(D, rc, px, LY, pw, ph, L2, 'back.photo0', {fs: 9.75, lh: 13, min: 3}).replace('data-slot="back.photo0" data-room', 'data-slot="back.photo0" data-nopair="1" data-room'); }
    }
    h += `<div class="lb-hr" style="left:${X0}pt;top:682pt;width:${CW}pt"></div>`;
    h += FO.contact(D, X0, FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D);
    return {html: h, issues};
  };
  // ---------------- BACK (fold-over) and flyer back ----------------
  // the plan in its box (the design's own dark background; the plan prints clear with light lines, PlanInk). Design pass 11/15: the box is as
  // wide as the drawing needs and no wider (a narrow plan gets a narrow box; the write-up beside it takes the rest)
  FO.planBox = (D, x, y, maxH, maxW) => { const A = D.plan.turn && D.plan.kind === 'color' ? 270 : undefined, rot = !!D.plan.turn, noteW = Math.ceil(FXS.width((D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate.', 'font-family:Franklin;font-size:8pt')) + 34;
    const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: rot ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: rot, angle: A}); let cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 40, D.plan.minCard || 0, noteW, 188));
    // the plan may print smaller than the box allows (its own resolution): the box then follows the drawing, never a small plan in a big box
    for(let hh = maxH; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: cw - 28.8, h: hh}, {allowRotate: rot, angle: A}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')){ if(big.usedW) cw = Math.min(cw, Math.max(Math.ceil(big.usedW) + 40, D.plan.minCard || 0, noteW, 188)); break; } }
    return FXS.planCard(D, x, y, cw, maxH); };
  // owner 11/16: what sits in a box is centered top to bottom in it (the box carries data-gbox = the slot prefix of its contents)
  FO.centerBoxes = () => document.querySelectorAll('[data-gbox]').forEach(bx => { const pre = bx.dataset.gbox, els = [...document.querySelectorAll(`[data-slot^="${pre}"]`)].filter(e => !e.parentElement.closest(`[data-slot^="${pre}"]`)); if(!els.length) return;
    const tops = els.map(e => { let t = e; while(t.parentElement && t.parentElement.classList.contains('abs') === false && !t.style.top) t = t.parentElement; return t; });
    const rg = document.createRange(), ink = els.map(e => { rg.selectNodeContents(e); return rg.getBoundingClientRect(); }).filter(r => r.height > 0), b = bx.getBoundingClientRect(); if(!ink.length) return;
    const t0 = Math.min(...ink.map(r => r.top)), t1 = Math.max(...ink.map(r => r.bottom)), d = (((b.bottom - t1) - (t0 - b.top))/2)*0.75; if(Math.abs(d) < .75) return;
    const movers = new Set(els.map(e => { let t = e; while(t && !(t.style && t.style.top) && t.parentElement) t = t.parentElement; return t; }));
    movers.forEach(m => { m.style.top = (parseFloat(m.style.top) + d) + 'pt'; }); });
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
})();
