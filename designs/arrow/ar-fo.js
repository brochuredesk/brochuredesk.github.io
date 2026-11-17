/* Arrow fold-over and two-sided flyer builders (grown from the FXS-14 builders; the hand is the approved Open House library
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

  // Arrow: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Arrow refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:Jost;letter-spacing:3.4pt", HW, 24, 13, 5), lh = T.f*1.3, H = 17 + T.n*lh + 9 + 1.2, y = 30 + (270 - 30 - H)/2;
    kk.style.top = y + 'pt'; ti.style.top = (y + 17) + 'pt'; ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = (T.n*lh) + 'pt'; ti.dataset.lines = T.n; ru.style.top = (y + 17 + T.n*lh + 9) + 'pt'; };
  // after the fill: the cover write-up sits on the frame's foot; the rooms above it grow down into any room it did not use (no empty band)
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = 766 - n*lh;
    const lbls = [...document.querySelectorAll('[data-slot^="front.strip"][data-slot$=".label"]')]; if(!lbls.length) return; const lb = Math.max(...lbls.map(l => parseFloat(l.style.top) + 11)), d = top - 16 - lb; su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt'; if(d <= 0) return;
    lbls.forEach(l => { l.style.top = (parseFloat(l.style.top) + d) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  // a heading that wraps: the size (from max down) at which its last line is at least 80% of the box (the last-line rule), else the largest one-line size
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  FO.fitTitle = (t, fam, w, max, min, maxLines) => { for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w)) return {f, n: L.length, w}; }
    for(const k of [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6]) for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w*k); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w*k)) return {f, n: L.length, w: w*k}; }
    return {f: min, n: FO.wrapLines(t, `${fam};font-size:${min}pt`, w).length, w}; };
  // the standard contact card as B01's footer: agent on the left, the brokerage panel on the right with the one logo, knockout on the dark
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = AR.logoSrc(D); const ko = !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 150, lh = Math.min(46, H - 30), s = {name: 18, nameFloor: 15, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div style="--cc-display:Jost;--cc-body:Jost">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };
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
  FO.wrapW = (t, css, V) => { const out = []; let cur = ''; String(t).split(' ').forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > V - 0.5){ out.push(FXS.width(cur, css)); cur = wd; } else cur = tr; }); if(cur) out.push(FXS.width(cur, css)); return out; };
  FO.tableRows2 = (items0, taken, o) => { o = o || {}; const ok = a => !taken || !taken(a); let best = null;
    for(let f = 10; f <= 11.51; f += 0.25) for(const V of (o.Vs || [184, 190, 196, 202, 208, 214, 220])){ const css = `font-family:Jost;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== 2 || Lw[0] < 0.8*V || Lw[1] < 0.9*V) return; const sc = (Lw[0] + Lw[1])/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 4), score = n*100 + f*2 - V*0.05;
      if(!best || score > best.score) best = {score, f, V, LW: 0, rows: rows.slice(0, o.maxRows || 4)}; }
    return best; };
  // the plan in its box (the design's own dark background; the plan prints clear with light lines, PlanInk). Design pass 11/15: the box is as
  // wide as the drawing needs and no wider (a narrow plan gets a narrow box; the write-up beside it takes the rest)
  FO.planBox = (D, x, y, maxH, maxW) => { const A = D.plan.turn && D.plan.kind === 'color' ? 270 : undefined, rot = !!D.plan.turn, noteW = Math.ceil(FXS.width((D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate.', 'font-family:Jost;font-size:8pt')) + 34;
    const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: rot ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: rot, angle: A}); let cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 40, D.plan.minCard || 0, noteW, 188));
    // the plan may print smaller than the box allows (its own resolution): the box then follows the drawing, never a small plan in a big box
    for(let hh = maxH; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: cw - 28.8, h: hh}, {allowRotate: rot, angle: A}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')){ if(big.usedW) cw = Math.min(cw, Math.max(Math.ceil(big.usedW) + 40, D.plan.minCard || 0, noteW, 188)); break; } }
    return FXS.planCard(D, x, y, cw, maxH); };
  FO.CARD_H = 62; FO.CARD_Y = 688;   // B01's footer: the card at 694, the fine print at 762, inside the frame
  FO.fine = (D, x, w) => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {}; x = x == null ? 60 : x; w = w || 516;
    return `<div class="abs fine" style="left:${x}pt;top:758pt;width:${w}pt;height:9pt" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  // ================= Arrow: the set's own marks and page structures (everything below is new for this set) =================
  // The thread (read from the approved B46A flyer, sign-in sheet and feedback card): the brand's dark field; the main-color side tab
  // with the place set upright; the house in a right-pointing arrow (a shallow point, a notched tail) with the same arrow drawn again in
  // the accent 12 pt behind it; the main-color pointer tags (the sign-in sheet's numbered rows) for names, numbers and distances; Jost
  // throughout, 600 caps for the display line; accent caps for the place; a 1 pt hairline between two columns; the white box with the
  // 1.2 pt accent edge (the flyer's event box) once per piece.
  const X0 = 60, X1 = 576, CW = X1 - X0;
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW;
  FO.frame = () => '';
  const PLACE = L => FXS.placeLine(L);
  // the side tab: a band of the main color from top to foot, the place set upright in it (B46A's tab)
  AR.tab = (x, w, text, slot, o) => { o = o || {}; const y0 = o.y0 == null ? -9 : o.y0, y1 = o.y1 == null ? 801 : o.y1, cx = o.cx == null ? x + w/2 : o.cx, cy = o.cy == null ? (y0 + y1)/2 : o.cy, len = o.len || 700, fs = o.fs || 9;
    return `<div class="ar-tab" style="left:${x}pt;top:${y0}pt;width:${w}pt;height:${y1 - y0}pt"></div>` + (text ? `<div class="ar-tabt" style="left:${cx - len/2}pt;top:${cy - 8}pt;width:${len}pt;font-size:${fs}pt;letter-spacing:${o.ls || 4}pt" data-slot="${slot}" data-lines="1">${esc(String(text).toUpperCase())}</div>` : ''); };
  // the arrow: points (pt) of a w x h frame whose point and notch are d deep
  AR.pts = (w, h, d) => [[0, 0], [w - d, 0], [w, h/2], [w - d, h], [0, h], [d, h/2]];
  // where the house sits in a w x h frame (fractions of the frame), cropped the way SW.focus will crop it
  AR.houseIn = (D, id, w, h) => { const p = (D.photos || {})[id]; if(!p || !p.box || !p.w || !p.h) return null; const [x0, y0, x1, y1] = p.box, ia = p.w/p.h, ta = w/h, vis = ia > ta ? {w: ta/ia, h: 1} : {w: 1, h: ia/ta};
    const place = (lo, hi, v) => v >= 1 ? 0 : Math.min(1 - v, Math.max(0, (lo + hi)/2 - v/2)); let ox = place(x0, x1, vis.w); if(p.lean === 'left' && vis.w < 1) ox = Math.max(0, Math.min(x0, x1 + .02 - vis.w)); const oy = place(y0, y1, vis.h);
    return [(x0 - ox)/vis.w, (y0 - oy)/vis.h, (x1 - ox)/vis.w, (y1 - oy)/vis.h]; };
  // the photo in the arrow, its accent echo 12 pt behind (right and down). The point and the notch never cut the house: the depth steps
  // down until the house box clears them, and a house that fills its frame keeps square corners (B46A: "the shape is used only when the
  // house box proves the point misses the house").
  AR.arrow = (D, id, x, y, w, h, slot, o) => { o = o || {}; const hb = o.house === false ? null : AR.houseIn(D, id, w, h); let d = o.d == null ? Math.min(60, Math.round(w*0.1)) : o.d;
    if(hb){ const ok = dd => hb[0]*w >= dd*0.75 + 2 && hb[2]*w <= w - dd*0.75 - 2; const k = [1, .8, .6, .45].map(f => Math.round(d*f)).find(ok); d = k == null ? 0 : k; }
    const P = AR.pts(w, h, d), poly = P.map(([a, b]) => `${(a/w*100).toFixed(3)}% ${(b/h*100).toFixed(3)}%`).join(','), ex = o.ex == null ? 12 : o.ex, ey = o.ey == null ? 12 : o.ey, sw = o.sw || 2;
    const echo = o.echo === false ? '' : `<svg class="ar-echo" style="left:${x + ex - 3}pt;top:${y + ey - 3}pt;width:${w + 6}pt;height:${h + 6}pt" viewBox="-3 -3 ${w + 6} ${h + 6}"><polygon points="${P.map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--ar-accent)" stroke-width="${sw}"/></svg>`;
    return echo + `<div class="abs ar-arw" data-depth="${d}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;clip-path:polygon(${poly})">${SW.photo(D, id, 'position:absolute;inset:0', slot)}</div>`; };
  // the pointer tag: the main color, pointing right, white caps (the sign-in sheet's row numbers)
  AR.tagW = (text, fs, ls) => Math.ceil(FXS.width(String(text).toUpperCase(), `font-family:Jost;font-weight:600;font-size:${fs}pt;letter-spacing:${ls}pt`));
  AR.tag = (x, y, text, o) => { o = o || {}; const fs = o.fs || 8.6, ls = o.ls == null ? 1.8 : o.ls, h = o.h || Math.round(fs*1.8), pt = Math.round(h*0.42), pl = o.pl || 8, w = o.w || AR.tagW(text, fs, ls) + pl + pt + 6;
    return {w, h, html: `<div class="ar-tag" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;padding-left:${pl}pt;clip-path:polygon(0 0,${w - pt}pt 0,${w}pt 50%,${w - pt}pt 100%,0 100%);font-weight:600;font-size:${fs}pt;line-height:${h}pt;letter-spacing:${ls}pt;text-transform:uppercase"${o.slot ? ` data-slot="${o.slot}" data-lines="1"` : ''}>${o.html || esc(String(text))}</div>`}; };
  // a photo's name on its pointer tag with the plan's size beside it (once per size on a piece)
  FO.nameTag = (D, c, x, y, w, slot) => { const L0 = FXS.leadLabel(c.lead); let n = L0.name || FXS.leadLabel(FXS.labelFor(c.photo)).name;   // a live order's card may have no lead: the room's own name if(AR.tagW(n, 8.6, 1.8) + 30 > w) n = n.split(/ and |, /)[0];
    const t = AR.tag(x, y, n, {slot: slot + '.label'}), sz = L0.size && !(FXS.__sizes = FXS.__sizes || new Set()).has(L0.size) && t.w + 10 + FXS.width(L0.size, 'font-family:Jost;font-weight:500;font-size:9pt') <= w;
    if(sz) FXS.__sizes.add(L0.size);
    return t.html + (sz ? `<div class="abs" style="left:${x + t.w + 7}pt;top:${y}pt;height:${t.h}pt;line-height:${t.h}pt;font-weight:500;font-size:9pt;font-family:Jost;color:var(--fx-soft);white-space:nowrap" data-size="1">${esc(L0.size)}</div>` : ''); };
  // a captioned photo: the photo, its name tag under it, three or more full lines of true detail
  FO.capd = (D, c, x, y, w, ph, lines, slot, o) => { o = o || {}; c = FXS.augment(D, c); const lh = o.lh || 13.5, fs = o.fs || 10.5;
    return FXS.box(D, c.photo, x, y, w, ph, slot) + `<div class="abs" style="left:${x}pt;top:${y + ph + 6}pt;width:${w}pt;height:16pt">${FO.nameTag(D, c, 0, 0, w, slot)}</div>` +
      `<div class="abs cap"><div class="a" style="position:absolute;left:${x}pt;top:${y + ph + 27}pt;width:${w}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-room="${esc(FXS.leadLabel(c.lead).name)}" data-lh="${lh}" data-hbox="${lines*lh}" data-lines="${lines}" data-min="3" data-narrow="0" data-nopair="1" ${FXS.sd(c.s)}></div></div>`; };
  FO.CAPH = (lines, lh) => 27 + lines*(lh || 13.5);
  // the caption of an arrow photo: its own block (never lifts the arrow), name tag then three or more full lines
  FO.heroCap = (D, c, x, y, w, lines, slot, o) => { o = o || {}; c = FXS.augment(D, c); const lh = o.lh || 15, fs = o.fs || 11.5;
    const wu = `<div class="abs wu" style="left:${x}pt;top:${y + 23}pt;width:${w}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-room="${esc(FXS.leadLabel(c.lead).name)}" data-lh="${lh}" data-hbox="${lines*lh}" data-lines="${lines}" data-try="${lines},${lines - 1}" data-narrow="0" ${FXS.sd(c.s)}></div>`; return FO.nameTag(D, c, x, y, w, slot) + (o.full ? FO.full(wu) : wu); };
  // the display line: Jost 600 caps, lightly tracked, up to n lines, the largest size from max down that fits; a one-letter word never ends a line
  const wrapSp = (t, css, w) => { const out = []; let cur = ''; String(t).split(' ').forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 5){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  FO.capsHead = (t, x, y, w, maxL, max, min, slot, o) => { o = o || {}; const T = String(t || '').replace(/\.$/, '').replace(/(^| )([AaI]) /g, '$1$2\u00a0').replace(/(\w)-(\w)/g, '$1\u2011$2').toUpperCase(), css = 'font-family:Jost;font-weight:600;letter-spacing:1.5pt';
    let pick = null;
    const ks = []; for(let q = 1; q >= 0.5; q -= 0.03) ks.push(q); let fb = null;
    for(let f = max; f >= min && !pick; f -= 0.5) for(const k of ks){ const ww = w*k, L = wrapSp(T, `${css};font-size:${f}pt`, ww); if(L.length > maxL || (o.room && L.length*f*1.06 > o.room)) continue; if(L.length === 1 || L[L.length - 1] >= 0.8*ww){ pick = {f, L, ww}; break; } const r = L[L.length - 1]/Math.max(...L); if(!fb || r > fb.r + 0.05) fb = {f, L, ww: Math.max(...L) + 1, r}; }
    if(!pick) pick = fb || (() => { const f = min, L = wrapSp(T, `${css};font-size:${f}pt`, w); return {f, L, ww: w}; })();
    const {f, L, ww} = pick, lh = +(f*1.06).toFixed(2);
    return {f, n: L.length, h: L.length*lh, html: `<div class="ar-head" style="left:${x}pt;top:${y}pt;width:${Math.ceil(ww) + 2}pt;height:${L.length*lh + 2}pt;font-size:${f}pt;line-height:${lh}pt;white-space:normal" data-slot="${slot}" data-lines="${L.length}" data-wmax="${w}">${esc(T)}</div>`}; };
  FO.factsText = L => { const items = FXS.statItems(L).filter(x => !/^Built/.test(x)); const yr = L.yearBuilt || L.year; if(yr) items.push('Built ' + yr); return items.join('  ·  '); };
  FO.placeText = L => [FXS.hood(L), PLACE(L)].filter(Boolean).join('  ·  ');

  // ---------------- FRONT: the fold-over cover (no agent, no brokerage) ----------------
  // The cover's left edge is the fold: the tab sits on it as a spine and runs on round to the back. The house in a big arrow pointing
  // into the page; the street as the one oversized line; the place and the facts; then three rooms in a chain of smaller arrows, each
  // point nesting in the next one's notch (the arrow carried through the house).
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, hero = FO.heroId(D, F.hero || K.hero || 'front');
    let h = AR.tab(-9, 39, PLACE(L), 'front.tab', {cx: 15});
    const AX = 66, AW = 522, AY = 34, AH = o.heroH || P.arCoverH || 384;
    h += AR.arrow(D, hero, AX, AY, AW, AH, 'front.house');
    let y = AY + AH + 32;
    const ad = String(L.address || ''), as = FXS.fitSize(ad, 'font-family:Jost;font-weight:600', X1 - AX, 64, 34);
    h += `<div class="ar-addr" data-slot="address" data-lines="1" style="left:${AX}pt;top:${y}pt;width:${X1 - AX}pt;height:${as*1.12}pt;font-size:${as}pt;line-height:${as*1.12}pt">${esc(ad)}</div>`; y += as*1.12 + 6;
    const pl = FO.placeText(L).toUpperCase(), ps = FXS.fitSize(pl, 'font-family:Jost;font-weight:600;letter-spacing:1.6pt', X1 - AX, 14, 9);
    h += `<div class="ar-caps" style="left:${AX}pt;top:${y}pt;width:${X1 - AX}pt;height:18pt;font-size:${ps}pt;line-height:18pt;letter-spacing:1.6pt" data-slot="front.place" data-lines="1">${esc(pl)}</div>`; y += 22;
    const fx = FO.factsText(L), fs = FXS.fitSize(fx, 'font-family:Jost;font-weight:500', X1 - AX, 13.5, 10);
    h += `<div class="ar-facts" style="left:${AX}pt;top:${y}pt;width:${X1 - AX}pt;height:18pt;font-size:${fs}pt;line-height:18pt" data-slot="front.facts" data-lines="1">${esc(fx)}</div>`; y += 18;
    const ids = (P.arCover || P.strip || []).filter(id => (D.photos || {})[id]).slice(0, 3), n = ids.length, dd = 24, g = 8, CX0 = AX, CX1 = 588, CY = y + 20, TH = 23, CH = 768 - TH - 6 - CY;
    const tw = (CX1 - CX0 + (n - 1)*(dd - g))/Math.max(1, n);
    ids.forEach((id, i) => { const x = CX0 + i*(tw - dd + g), c = FXS.cardFor(D, id) || {photo: id, lead: FXS.labelFor(id)};
      h += AR.arrow(D, id, x, CY, tw, CH, 'front.strip' + i, {house: false, d: dd, echo: false}) + FO.nameTag(D, c, x + (i ? dd*0.6 : 0), CY + CH + 6, tw - dd, 'front.strip' + i); });
    return h; };

  // ---------------- the two-sided flyer's front: its own composition in the same hand ----------------
  // The type comes first (B46A's sign-in sheet sets its words beside the arrow): the street large over the place and the facts, then
  // the house in the arrow across the page with its echo, then the flyer's two columns split by the hairline: the write-up on the left,
  // two rooms stacked on the right. The tab runs down the left edge with the place (inside the 18 pt print margin).
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [], hero = FO.heroId(D, F.hero || K.hero || 'front');
    let h = AR.tab(-9, 65, PLACE(L), 'front.tab', {cx: 28});
    const TX = 78, TR = 576, TW = TR - TX;
    const ad = String(L.address || ''), as = FXS.fitSize(ad, 'font-family:Jost;font-weight:600', TW, 50, 30);
    h += `<div class="ar-addr" data-slot="address" data-lines="1" style="left:${TX}pt;top:32pt;width:${TW}pt;height:${as*1.12}pt;font-size:${as}pt;line-height:${as*1.12}pt">${esc(ad)}</div>`;
    let y = 32 + as*1.12 + 4;
    const pl = FO.placeText(L).toUpperCase(), ps = FXS.fitSize(pl, 'font-family:Jost;font-weight:600;letter-spacing:1.6pt', TW*0.56, 12, 8.6), fx = FO.factsText(L), fs = FXS.fitSize(fx, 'font-family:Jost;font-weight:500', TW*0.44 - 14, 12, 9);
    h += `<div class="ar-caps" style="left:${TX}pt;top:${y}pt;width:${TW*0.56}pt;height:17pt;font-size:${ps}pt;line-height:17pt;letter-spacing:1.6pt" data-slot="front.place" data-lines="1">${esc(pl)}</div>`;
    h += `<div class="ar-facts" style="left:${TX + TW*0.56 + 14}pt;top:${y}pt;width:${TW*0.44 - 14}pt;height:17pt;font-size:${fs}pt;line-height:17pt;text-align:right" data-slot="front.facts" data-lines="1">${esc(fx)}</div>`;
    y += 30;
    const AH = P.arFlyerH || 332; h += AR.arrow(D, hero, TX, y, 492, AH, 'front.house');
    const CY = y + AH + 34, vx = 346, LW = vx - 20 - TX, RX = vx + 20, RW = TR - RX;
    h += `<div class="ar-vhair" style="left:${vx}pt;top:${CY + 2}pt;height:${770 - CY - 2}pt"></div>`;
    // the write-up: the left column, down to the foot (it fills; FO.grow takes bigger type when it can)
    const lh = 20, nl = Math.floor((770 - CY)/lh);
    h += (`<div class="abs wu" data-narrow="0" data-fill="0.9" data-lfill="0.8" data-justify="1" data-slot="front.summary" data-lines="${nl}" data-try="${nl},${nl - 1},${nl - 2},${nl - 3}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${TX}pt;top:${CY}pt;width:${LW}pt;height:${nl*lh}pt;font-size:13.25pt;line-height:${lh}pt"></div>`).replace('data-slot="front.summary"', `data-slot="front.summary" data-rag="1" data-span="${(770 - CY).toFixed(2)}"`);
    // two rooms stacked on the right, each on its name tag
    const ids = (P.arFlyerRooms || P.flyerStrip || P.strip || []).filter(id => (D.photos || {})[id]).slice(0, 2), TH = 23, rh = (770 - CY - ids.length*(TH + 6) - (ids.length - 1)*12)/Math.max(1, ids.length);
    ids.forEach((id, i) => { const yy = CY + i*(rh + TH + 6 + 12), c = FXS.cardFor(D, id) || {photo: id, lead: FXS.labelFor(id)}; h += FXS.box(D, id, RX, yy, RW, rh, 'front.strip' + i) + FO.nameTag(D, c, RX, yy + rh + 6, RW, 'front.strip' + i); });
    return h; };

  // ---------------- INSIDE SPREAD: one horizon, one arrow across the fold ----------------
  // Both pages open on a big arrow at the same top and height; the left page's point stops 21 pt short of the fold and the right
  // page's notch starts 21 pt past it, so the two read as one pointer running through the spread. Under the arrows the flyer's two
  // columns split by the hairline, mirrored: the headline column on each page's outer side, the photo stack on the inner side.
  FO.SY = 34; FO.SH = 322; FO.CY = FO.SY + FO.SH + 34;
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, A = P.arLeft || {}, L = D.listing;
    const kid = A.hero || (P.strip || [])[0], kc = FXS.cardFor(D, kid) || {photo: kid, lead: 'Kitchen.'}, stack = FO.cards(D, A.stack || (P.left || []).slice(0, 2)).slice(0, 2);
    let h = AR.tab(-9, 39, PLACE(L), 'left.tab', {cx: 15});
    h += AR.arrow(D, kid, 60, FO.SY, 531, FO.SH, 'left.wide', {house: false, d: 52});
    const CY = FO.CY, vx = 325, LX = 60, LW = vx - 19 - LX, RX = vx + 19, RW = X1 - RX;
    h += `<div class="ar-vhair" style="left:${vx}pt;top:${CY + 2}pt;height:${766 - CY - 2}pt"></div>`;
    // the kitchen card: its rows first (they decide its height), then the headline takes the room above it
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), cw = t => (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new', 'a', 'the', 'and', 'of', 'with', 'in'].includes(w)).map(stem), says = (b, a) => { const bw = cw(b), aw = new Set(cw(a)); return bw.length > 0 && bw.every(w => aw.has(w)); };
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside || {}).items || SFb.inside, (BXb.outside || {}).items || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const taken = a => /^(It|Its|They|This|That)\b/.test(a) || SW.grams4(a).some(g => backG.has(g)) || backT.some(b => says(b, a));
    const liw = LW - 30, T = FO.tableRowsN((box.items || []).slice(0, 10), taken, {Vs: [liw - 24, liw - 16, liw - 8, liw], lines: [1, 2, 3], maxRows: 6});
    const tag = FXS.leadLabel(kc.lead), head = String(box.heading || '').replace(/\.$/, ''), rows = T ? T.rows : [], rl = T ? T.lh : 15;
    const rowH = r => 11 + r.n*rl + 9; while(rows.length > 3 && 16 + 21 + (head ? 22 : 0) + 23 + rows.reduce((s, r) => s + rowH(r), 0) > 766 - CY - 84) rows.pop();   // the headline keeps two big lines
    const cardH = 16 + 21 + (head ? 22 : 0) + (box.kicker && !/kitchen/i.test(box.kicker) ? 15 : 0) + 8 + rows.reduce((s, r) => s + rowH(r), 0) + 4;
    const room = 766 - CY - cardH - 16, kk = I.kicker ? 18 : 0, hd = FO.capsHead(I.title, LX, CY + kk, LW, 5, 50, 22, 'left.title', {room: room - kk});
    if(I.kicker) h += FO.kick(I.kicker, LX, CY, 'left.kicker');
    h += hd.html;
    const cy = 766 - cardH, ty0 = Math.min(cy, CY + kk + hd.h + 16), extra = cy - ty0;   // the card starts under the headline; any room left opens its rows evenly
    h += FO.card(T, kc, head, LX, ty0, LW, cardH + extra, 'left', D, box.kicker);
    // the photo stack: two rooms, each on its name tag with three full lines
    const n = Math.max(1, stack.length), gap = 16, cap = FO.CAPH(3), ph = (766 - CY - (n - 1)*gap - n*cap)/n;
    stack.forEach((c, i) => { h += FO.capd(D, c, RX, CY + i*(ph + cap + gap), RW, ph, 3, 'left.photo' + i); });
    return h; };
  // the kitchen card: B46A's white event box with its accent edge; the kitchen's tag at its head, the heading beside it, then rows
  FO.card = (T, kc, head, x, y, w, hgt, slot, D, kick) => { const lx = x + 15, liw = w - 30, rows = T ? T.rows : [], rl = T ? T.lh : 15, fs = T ? T.f : 10.5;
    let b = `<div class="ar-wbox lt" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    const L0 = FXS.leadLabel(kc.lead), t = AR.tag(lx, y + 15, L0.name, {slot: slot + '.box.kicker'}); b += t.html;
    if(L0.size){ b += `<div class="abs" style="left:${lx + t.w + 7}pt;top:${y + 15}pt;height:${t.h}pt;line-height:${t.h}pt;font-weight:500;font-size:9pt;font-family:Jost;color:#3b3b3b;white-space:nowrap" data-size="1">${esc(L0.size)}</div>`; (FXS.__sizes = FXS.__sizes || new Set()).add(L0.size); }
    let yy = y + 15 + t.h + 8;
    if(kick && !/kitchen/i.test(kick)){ b += `<div class="abs fo-kick" style="left:${lx}pt;top:${yy}pt;color:var(--ar-main-on-paper)" data-slot="${slot}.box.k2" data-lines="1">${esc(String(kick).toUpperCase())}</div>`; yy += 15; }
    if(head){ const hs = FXS.fitSize(head, 'font-family:Jost;font-weight:600', liw, 15, 11); b += `<div class="abs fo-sub" style="left:${lx}pt;top:${yy}pt;width:${liw}pt;height:20pt;font-size:${hs}pt;line-height:20pt;color:#161616" data-slot="${slot}.box.heading" data-lines="1">${esc(head)}</div>`; yy += 22; }
    const body = y + hgt - 6 - yy, used = rows.reduce((s, r) => s + 11 + r.n*rl + 9, 0), lines = rows.reduce((s, r) => s + r.n, 0), extra = Math.max(0, body - used);
    const rl2 = rows.length ? Math.min(rl + fs*0.22, rl + extra*0.45/Math.max(1, lines)) : rl, gapX = rows.length ? Math.max(0, (body - rows.reduce((s, r) => s + 11 + r.n*rl2 + 9, 0))/rows.length) : 0;
    const V = T ? T.V : liw;
    rows.forEach((r, i) => { const rh = 11 + r.n*rl2 + 9 + gapX, c0 = yy + 6 + gapX/2;
      if(i) b += `<div class="abs hr" style="left:${lx}pt;top:${yy}pt;width:${liw}pt;background:rgba(0,0,0,.2)"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${c0}pt;width:${liw}pt;color:var(--ar-main-on-paper)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx}pt;top:${c0 + 13}pt;width:${(r.V || V) + 0.5}pt;height:${r.n*rl2}pt;font-weight:400;font-size:${fs}pt;line-height:${rl2}pt;font-family:Jost;color:#2c2c2c;overflow:hidden" data-slot="${slot}.list.t${i}" data-lines="${r.n}">${esc(r.t)}</div>`;
      yy += rh; });
    return `<div class="ar-lt">${b}</div>`; };
  // the card's rows: each row the fullest true wording that sets in 2 (or 3) full lines (every line 80%+, the last 90%+)
  FO.tableRowsN = (items0, taken, o) => { o = o || {}; const ok = a => !taken || !taken(a); let best = null; const Vmax = Math.max(...(o.Vs || [200])), Vs = []; for(let q = 1; q >= 0.7; q -= 0.03) Vs.push(Vmax*q);
    // each row: its fullest true wording on 1 to 3 full lines (every line 82%+, the last 88%+ of the row's own measure); the measure is the
    // card's text width when a wording fills it, else a little narrower (set ragged, the card reads as a list)
    for(let f = 10.25; f <= 11.51; f += 0.25){ const css = `font-family:Jost;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1, bn = 0, bV = 0;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t) || /^(It|Its|They|This|That)\b/.test(t)) return; for(const V of Vs){ const Lw = FO.wrapW(t, css, V); if(!(o.lines || [2]).includes(Lw.length) || Lw.slice(0, -1).some(q => q < 0.82*V) || Lw[Lw.length - 1] < (Lw.length === 1 ? 0.88 : 0.9)*V) continue; const sc = Lw.reduce((s, q) => s + q, 0) + V*0.5; if(sc > bs){ bs = sc; bt = t; bn = Lw.length; bV = V; } break; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt, n: bn, V: bV}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 4), score = n*100 + f*2;
      if(!best || score > best.score) best = {score, f, V: Vmax, lh: +(f*1.42).toFixed(2), rows: rows.slice(0, o.maxRows || 4)}; }
    return best; };
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, A = P.arRight || {};
    const cs0 = FO.cards(D, A.hero ? [A.hero].concat(A.stack || []) : (P.right || [])), hc = cs0[0], stack = cs0.slice(1, 3);
    let h = AR.arrow(D, hc.photo, 21, FO.SY, 537, FO.SH, 'right.wide', {house: false, d: 52});
    const CY = FO.CY, vx = 287, LX = 36, LW = vx - 19 - LX, RX = vx + 19, RW = 552 - RX;
    h += `<div class="ar-vhair" style="left:${vx}pt;top:${CY + 2}pt;height:${766 - CY - 2}pt"></div>`;
    const n = Math.max(1, stack.length), gap = 16, cap = FO.CAPH(3), ph = (766 - CY - (n - 1)*gap - n*cap)/n;
    stack.forEach((c, i) => { h += FO.capd(D, c, LX, CY + i*(ph + cap + gap), LW, ph, 3, 'right.photo' + (i + 1)); });
    // the outer column: eyebrow, the headline, the big room's name and its caption, then the page's write-up to the foot
    const kk = R.kicker ? 18 : 0; if(R.kicker) h += FO.kick(R.kicker, RX, CY, 'right.kicker');
    const capL = 6, clh = 17.5, capH = 23 + capL*clh, hd = FO.capsHead(R.title, RX, CY + kk, RW, 4, 44, 22, 'right.title', {room: 766 - CY - kk - 18 - capH}); h += hd.html;
    const y = 766 - capH;
    h += `<div data-rsnug="${CY + kk}|${RX}|${RW}" data-title="${esc(R.title || '')}" style="display:none"></div>`;
    const hc2 = Object.assign({}, FXS.augment(D, hc), {noAugment: true}); hc2.s = [].concat(hc2.s || [], (R.intro || []).filter(x => !/^(It|Its|They|This)\b/.test([].concat(x)[0])));   // the room's own sentences first, then the page's
    h += FO.heroCap(D, hc2, RX, y, RW, capL, 'right.photo0', {lh: clh, fs: 12}).replace(/data-try="[^"]*"/, `data-try="7,6,5,4,3"`).replace('data-slot="right.photo0"', 'data-slot="right.photo0" data-rag="1"');
    return h; };
  FO.rightFit = () => {}; FO.leftHead = () => {};
  // after the fill: the big room's caption sets the lines its true sentences fill; it sits on the foot and the headline takes the room above
  FO.rightSnug = () => { const m = document.querySelector('[data-rsnug]'), cap = document.querySelector('[data-slot="right.photo0"]'), ti = document.querySelector('[data-slot="right.title"]'); if(!m || !cap || !ti) return;
    const [top, x, w] = m.dataset.rsnug.split('|').map(Number), n = SW.lines(cap).n, lh = parseFloat(cap.style.lineHeight), ch = n*lh, cy = 766 - ch;
    const tg = [...document.querySelectorAll('[data-slot="right.photo0.label"]')], sz = document.querySelectorAll('[data-size]'), d = cy - parseFloat(cap.style.top);
    cap.style.top = cy + 'pt'; cap.style.height = ch + 'pt'; cap.dataset.lines = n; tg.forEach(e => { e.style.top = (parseFloat(e.style.top) + d) + 'pt'; const nx = e.nextElementSibling; if(nx && nx.dataset.size) nx.style.top = (parseFloat(nx.style.top) + d) + 'pt'; });
    const room = cy - 23 - 18 - top, H = FO.capsHead(m.dataset.title, x, top, w, 6, 64, 22, 'right.title', {room}); const tmp = document.createElement('div'); tmp.innerHTML = H.html; const nt = tmp.firstElementChild;
    nt.dataset.room = room; nt.dataset.fmax = 64; ti.replaceWith(nt); };

  // ---------------- BACK (fold-over) and flyer back ----------------
  // Nearby: three pointer tags in a chain across the page, each with the real distance large and the place beside it
  const nearChain = (D, x, y, w, slot) => { const N = ((D.sw || {}).back || {}).nearby || [], n = Math.min(3, N.length); if(!n) return {html: '', h: 0};
    const g = 6, tw = (w - (n - 1)*g)/n, H = 42, pt = 15; let h = '';
    N.slice(0, n).forEach((nb, i) => { const xx = x + i*(tw + g), notch = i ? `,${pt}pt 50%` : '', pl = (i ? pt : 0) + 11, inner = tw - pl - pt - 6;
      let ps = 8.6, ls = 1.6; while(ls > 0.4 && FXS.width(String(nb.place).toUpperCase(), `font-family:Jost;font-weight:600;font-size:${ps}pt;letter-spacing:${ls}pt`) > inner) ls -= 0.2;
      h += `<div class="ar-tag" style="left:${xx}pt;top:${y}pt;width:${tw}pt;height:${H}pt;padding-left:${pl}pt;clip-path:polygon(0 0,${tw - pt}pt 0,${tw}pt 50%,${tw - pt}pt 100%,0 100%${notch});flex-direction:column;align-items:flex-start;justify-content:center" data-slot="${slot}${i}" data-lines="2" data-fine="1"><span style="font-weight:600;font-size:15pt;line-height:17pt">${esc(nb.dist)}</span><span style="font-weight:600;font-size:${ps}pt;line-height:11pt;letter-spacing:${ls}pt;text-transform:uppercase">${esc(nb.place)}</span></div>`; });
    return {html: FO.kick('Nearby', x, y - 18, slot + '.kicker') + h, h: H + 18}; };
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [], L = D.listing, A = P.arBack || {};
    const topId = flyer ? (A.flyerTop || P.flyerTop) : (A.top || (P.back || [])[0] || (P.backNoplan || [])[0]);
    const rowId = flyer ? (A.flyerRow || (P.flyerBack || [])[0]) : (A.row || (P.backRow || [])[0]), rowC = rowId ? FXS.cardFor(D, rowId) : null;
    // the fold-over back carries the spine on its right edge (the fold: the cover's tab runs round it); the flyer back has the tab on its left
    const L0 = flyer ? 78 : 40, R0 = flyer ? 576 : 546; let h = flyer ? AR.tab(-9, 65, PLACE(L), 'back.tab', {cx: 28}) : AR.tab(582, 39, '', 'back.tab');
    const TOP = 34, kickT = +(L.stories || 1) > 1 ? 'Floor by floor' : 'Room by room';
    const ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, '');
    const hd = FO.capsHead(ht, L0, TOP, R0 - L0, 1, 32, 16, 'back.about.head'); h += hd.html;
    const AY = TOP + hd.h + 18;
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const used = FO.cards(D, [topId, rowId].filter(Boolean));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const CARD = FO.CARD_Y, NY = CARD - 22 - 42;   // the Nearby chain sits on the card
    const near = nearChain(D, L0, NY, R0 - L0, 'back.near'); h += near.html;
    const BB = NY - 18 - 22;   // zone B ends above the Nearby kicker
    const LV = hasPlan ? (D.plan.levels || []) : [], tall = hasPlan && (LV.length >= 4 || (LV.length === 1 && LV[0].h/LV[0].w > 1.5));
    let aEnd;
    if(hasPlan){
      const nb = Math.max(Math.min(c1.length, 5), Math.min(c2.length, 5), 3), needB = tall || !rowC ? 20 + nb*21 + (flyer ? 28 : 0) : 0, TH = Math.min(tall ? (P.arBackTH || 372) : (P.arBackTH || (flyer ? 286 : 290)), BB - 22 - needB - 36 - AY), pc = FO.planBox(D, L0, AY, TH, tall ? 290 : 318); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues;
      const pw = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])), ax = L0 + pw + 22, aw = R0 - ax; aEnd = pc.bottom;
      if(tall && rowC){   // a tall plan: the write-up and the photo share the column beside it
        const ph = 120, wy = AY + ph + FO.CAPH(3) + 14, n = Math.floor((aEnd - wy)/15.5);
        h += FO.capd(D, rowC, ax, AY, aw, ph, 3, 'back.photo0');
        h += FO.full(FO.wu(keep(f2.concat(f1)), ax, wy, aw, n*15.5 + 0.01, 'back.about', 11, 15.5, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-rag="1" data-span="${(aEnd - wy).toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
      } else {
        const n = Math.floor((aEnd - AY)/16), lh = +((aEnd - AY)/n).toFixed(3);
        h += FO.full(FO.wu(keep(f2.concat(f1)), ax, AY, aw, n*lh + 0.01, 'back.about', 11, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${aw < 240 ? ' data-rag="1"' : ''} data-span="${(aEnd - AY).toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
      }
    } else {   // the big outdoor photo in the arrow, its caption under it at full width
      const c = FXS.cardFor(D, topId), AH = P.arBackAH || 250, aw = Math.round((R0 - L0)*0.62), cx = L0 + aw + 28, cw2 = R0 - cx, clh = 15, nl = Math.floor((AH - 23)/clh);
      h += AR.arrow(D, topId, L0, AY, aw, AH, 'back.top', {d: 40});
      h += `<div data-csnug="${AY}|${AH}" style="display:none"></div>` + FO.heroCap(D, c, cx, AY, cw2, nl, 'back.topcap', {lh: clh, fs: 11}).replace(/data-try="[^"]*"/, `data-try="${Array.from({length: Math.max(1, nl - 2)}, (_, i) => nl - i).join(',')}"`).replace('data-slot="back.topcap"', 'data-slot="back.topcap" data-rag="1"'); aEnd = AY + AH + 12;
    }
    // zone B: the flyer's two columns, split by the hairline: a captioned room on the left, the two lists on the right
    const ZB = aEnd + 22, vx = Math.round((L0 + R0)/2) - 8, lw = vx - 18 - L0, rx = vx + 18, rw = R0 - rx;
    const lists = (x, y, w, H, sideBySide) => { let t = ''; const fs = 10.5, cap = 5;
      if(sideBySide){ const w1 = (w - 20)/2, rows = Math.max(Math.min(c1.length, cap), Math.min(c2.length, cap), 3), rh = Math.min(24, (H - 20)/rows);
        t += FO.kick(t1, x, y, 'back.updates.title') + FXS.bullets(c1, x, y + 20, w1, rh, 'back.updates', cap, fs).html + FO.kick('Outside', x + w1 + 20, y, 'back.outside.title') + FXS.bullets(c2, x + w1 + 20, y + 20, w1, rh, 'back.outside', cap, fs).html; return t; }
      const n1 = FXS.bullets(c1, x, 0, w, 1, 'x', cap, fs).n, n2 = FXS.bullets(c2, x, 0, w, 1, 'x', cap, fs).n, rh = Math.min(26, (H - 2*20 - 14)/Math.max(1, n1 + n2));
      t += FO.kick(t1, x, y, 'back.updates.title') + FXS.bullets(c1, x, y + 20, w, rh, 'back.updates', cap, fs).html;
      const y2 = y + 20 + n1*rh + 14; t += FO.kick('Outside', x, y2, 'back.outside.title') + FXS.bullets(c2, x, y2 + 20, w, rh, 'back.outside', cap, fs).html; return t; };
    let t = '';
    if(tall || !rowC){ t += lists(L0 + (flyer ? 16 : 0), ZB + (flyer ? 14 : 0), R0 - L0 - (flyer ? 32 : 0), BB - ZB - (flyer ? 28 : 0), true); if(flyer) t = `<div class="ar-wbox lt" style="left:${L0}pt;top:${ZB}pt;width:${R0 - L0}pt;height:${BB - ZB}pt"></div>` + t; }
    else {
      const ph = BB - ZB - FO.CAPH(3); h += FO.capd(D, rowC, L0, ZB, lw, ph, 3, 'back.photo0');
      h += `<div class="ar-vhair" style="left:${vx}pt;top:${ZB + 2}pt;height:${BB - ZB - 2}pt"></div>`;
      if(flyer) t += `<div class="ar-wbox lt" style="left:${rx}pt;top:${ZB}pt;width:${rw}pt;height:${BB - ZB}pt"></div>` + lists(rx + 16, ZB + 14, rw - 32, BB - ZB - 28);
      else t += lists(rx, ZB, rw, BB - ZB);
    }
    h += `<div data-lists="${ZB}|${BB}" style="display:none"></div>` + (flyer ? `<div class="ar-lt">${t}</div>` : t);
    h += `<div class="ar-hair" style="left:${L0}pt;top:${CARD - 11}pt;width:${R0 - L0}pt"></div>`;
    h += FO.contact(D, L0, CARD, R0 - L0, FO.CARD_H) + FO.fine(D, L0, R0 - L0);
    return {html: h, issues};
  };
  // after layout: every multi-line display line is set again on the page's own measure (the real line breaks, not an estimate): the largest
  // size and measure at which it keeps inside its planned height and its last line runs 80%+ of its widest; the box closes to that line
  FO.headFix = () => document.querySelectorAll('.ar-head[data-slot]').forEach(el => { const fs1 = el.style.fontSize, lh1 = el.style.lineHeight, w1 = el.style.width, H0 = +el.dataset.room || parseFloat(el.style.height), W0 = +el.dataset.wmax || parseFloat(el.style.width), f0 = +el.dataset.fmax || parseFloat(el.style.fontSize); if(!(+el.dataset.lines > 1) && el.textContent.length < 18) return;
    const rows = () => { const r = document.createRange(); r.selectNodeContents(el); const R = []; [...r.getClientRects()].forEach(b => { if(b.width < .5) return; const x = R.find(q => Math.abs(q.t - b.top) < b.height*.5); if(x){ x.l = Math.min(x.l, b.left); x.r = Math.max(x.r, b.right); } else R.push({t: b.top, l: b.left, r: b.right}); }); return R.sort((a, b) => a.t - b.t); };
    let best = null, fb = null;
    for(let f = f0; f >= f0*0.5 && !best; f -= 0.5){ const lh = f*1.06; el.style.fontSize = f + 'pt'; el.style.lineHeight = lh + 'pt';
      for(let k = 1; k >= 0.5; k -= 0.025){ el.style.width = (W0*k) + 'pt'; const R = rows(); if(R.length*lh > H0 + 2) continue; const wd = Math.max(...R.map(q => q.r - q.l)); if(wd*0.75 > W0*k + 1 || wd*0.75 > W0 + 1) continue;   /* a word wider than the measure overflows: not a fit */ const rr = (R[R.length - 1].r - R[R.length - 1].l)/wd; if(R.length === 1 || rr >= 0.8){ best = {f, lh, w: wd*0.75 + 1.5, n: R.length}; break; } if(rr >= 0.76 && (!fb || f > fb.f)) fb = {f, lh, w: wd*0.75 + 1.5, n: R.length}; } }
    best = best || fb;
    if(!best){ el.style.fontSize = fs1; el.style.lineHeight = lh1; el.style.width = w1; return; }
    el.style.fontSize = best.f + 'pt'; el.style.lineHeight = best.lh + 'pt'; el.style.width = best.w + 'pt'; el.style.height = (best.n*best.lh + 2) + 'pt'; el.dataset.lines = best.n; });
  FO.leftCenter = () => { [['left', () => { const c = document.querySelector('.ar-lt .ar-wbox.lt'); return c && c.closest('.panel') && parseFloat(c.style.top) - 14; }], ['right', () => { const t = document.querySelector('[data-slot="right.photo0.label"]'); return t && parseFloat(t.style.top) - 16; }]].forEach(([p, fb]) => { const ti = document.querySelector(`[data-slot="${p}.title"]`), kk = document.querySelector(`[data-slot="${p}.kicker"]`), bot = fb(); if(!ti || !bot) return;
    const top0 = kk ? parseFloat(kk.style.top) : parseFloat(ti.style.top), hh = (parseFloat(ti.style.top) - top0) + parseFloat(ti.style.height), d = Math.max(0, (bot - top0 - hh)/2);
    if(kk) kk.style.top = (parseFloat(kk.style.top) + d) + 'pt'; ti.style.top = (parseFloat(ti.style.top) + d) + 'pt'; }); };
  // after the fill: the caption beside the no-plan back's arrow sits centered on the photo
  FO.capCenter = () => { const m = document.querySelector('[data-csnug]'), cap = document.querySelector('[data-slot="back.topcap"]'); if(!m || !cap) return; const [ay, ah] = m.dataset.csnug.split('|').map(Number), n = SW.lines(cap).n, lh = parseFloat(cap.style.lineHeight), hh = 23 + n*lh, y0 = ay + (ah - hh)/2;
    cap.style.top = (y0 + 23) + 'pt'; cap.style.height = (n*lh) + 'pt'; cap.dataset.lines = n; document.querySelectorAll('[data-slot="back.topcap.label"]').forEach(e => { e.style.top = y0 + 'pt'; const nx = e.nextElementSibling; if(nx && nx.dataset.size) nx.style.top = y0 + 'pt'; }); };
  // after the fill (owner 11/16, everything centered in its space): the two lists sit centered top to bottom in their zone (or white box)
  FO.listCenter = () => { const m = document.querySelector('[data-lists]'); if(!m) return; const [z0, z1] = m.dataset.lists.split('|').map(Number);
    const els = [...document.querySelectorAll('[data-slot^="back.updates"], [data-slot^="back.outside"]')]; if(!els.length) return; const box = document.querySelector('[data-lists] ~ .ar-lt .ar-wbox.lt, .ar-lt .ar-wbox.lt[data-lbox]');
    const top = Math.min(...els.map(e => parseFloat(e.style.top))), bot = Math.max(...els.map(e => parseFloat(e.style.top) + (parseFloat(e.style.height) || 12))), d = (z0 + z1)/2 - (top + bot)/2;
    if(Math.abs(d) > 0.5) els.forEach(e => { e.style.top = (parseFloat(e.style.top) + d) + 'pt'; }); };
  FO.tallStack = () => { const col = document.querySelector('[data-tallcol]'); if(!col) return; const bottom = +col.dataset.tallcol, ps = [...document.querySelectorAll('[data-para]')]; if(ps.length < 2) return;
    const [a, b] = ps, la = parseFloat(a.style.lineHeight), lb = parseFloat(b.style.lineHeight), na = SW.lines(a).n, nb = SW.lines(b).n;
    a.style.height = (na*la) + 'pt'; b.style.top = (parseFloat(a.style.top) + na*la + 9) + 'pt'; b.style.height = (nb*lb) + 'pt';
    const free = bottom - 8 - (parseFloat(b.style.top) + nb*lb); if(free < 1) return;
    const cap = document.querySelector('.cap .a[data-slot="back.photo0"]'), ph = document.querySelector('.ph[data-slot-photo="back.photo0"]'), pb = ph && ph.parentElement, lbl = document.querySelector('[data-slot="back.photo0.label"]');
    if(pb) pb.style.height = (parseFloat(pb.style.height) + free) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + free) + 'pt'; if(cap) cap.style.top = (parseFloat(cap.style.top) + free) + 'pt';
    document.querySelectorAll('[data-tall]').forEach(e => { e.style.top = (parseFloat(e.style.top) + free) + 'pt'; }); };
  // after the fill: a block with data-span spreads the lines it took over that height, so its last line ends where its neighbor's does (owner 11/7, p12)
  FO.span = () => document.querySelectorAll('[data-span]').forEach(el => { const T = +el.dataset.lines, lh = Math.min(+el.dataset.span/T, parseFloat(getComputedStyle(el).fontSize)*0.75*1.75); el.style.lineHeight = lh + 'pt'; el.style.height = (T*lh) + 'pt'; el.style.top = (parseFloat(el.style.top) + (+el.dataset.span - T*lh)/2) + 'pt'; });   // Arrow (owner 11/16): centered in its room, never pinned
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
