/* Diagonal fold-over and two-sided flyer builders (engine from the Chevron set; every page layout here is Diagonal's own) (grown from the FXS-14 builders; the hand is the approved Open House library
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

  // Chevron: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Chevron refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
  FO.frontSnug = () => {};   // Diagonal: the flyer front's write-up stays centered in its own room beside the overlapping print (no cover write-up)
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- Chevron geometry (pt, panel trim 612 x 792) ----------------
  // B01's closed frame sits 20 pt in from the sides, 30 from the top and 16 from the foot; text keeps inside X0..X1.
  const FR = [20, 30, 592, 776], X0 = 40, X1 = 572, CW = X1 - X0;
  FO.FR = FR; FO.X0 = X0; FO.X1 = X1; FO.CW = CW;
  FO.frame = () => '';   // Chevron has no frame: the chevron and its echo are the signature
  // the centered heading of B01: accent eyebrow, Sora caps, the short accent rule (returns {html, y} with y under the rule)
  FO.head = (kicker, title, slot, y, o) => { o = o || {}; const ts = FXS.fitSize(String(title).replace(/\.$/, '').toUpperCase(), "font-family:Jost;letter-spacing:3.4pt", CW, o.max || 21, 12);
    let h = `<div class="abs fo-kick c" style="left:${X0}pt;top:${y}pt;width:${CW}pt" data-slot="${slot}.kicker" data-lines="1">${esc(String(kicker).toUpperCase())}</div>`;
    h += `<div class="abs fo-title c" style="left:${X0}pt;top:${y + 17}pt;width:${CW}pt;height:${ts*1.3}pt;font-size:${ts}pt;line-height:${ts*1.3}pt" data-slot="${slot}.title" data-lines="1">${esc(String(title).replace(/\.$/, '').toUpperCase())}</div>`;
    const ry = y + 17 + ts*1.3 + 7; h += `<div class="cd-rule" style="left:${306 - 40}pt;top:${ry}pt;width:80pt"></div>`;
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
  FO.lift = (x, y, w, h) => `<div class="cd-lift" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h || 22}pt"></div>`;
  // the standard contact card as B01's footer: agent on the left, the brokerage panel on the right with the one logo, knockout on the dark
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = CD.logoSrc(D); const ko = !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 180, lh = Math.min(46, H - 30), s = {name: 16.5, nameFloor: 13, line: 8.6, rowGap: 10, phone: 12, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div class="cd-ccw" style="--cc-display:Jost;--cc-body:Jost">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };

  // ---------------- FRONT (fold-over cover and flyer front: no agent, no brokerage) ----------------
  FO.heroId = (D, id) => { const ph = D.photos || {}, sp = SW.space(D, id); if((ph[id] || {}).dusk) return id; const d = Object.keys(ph).find(k => ph[k].dusk && ph[k].fullHouse && SW.space(D, k) === sp); return d || id; };
  FO.isDusk = (D, id) => !!((D.photos || {})[id] || {}).dusk;
  const RHD = 'font-family:Jost';
  // a fact said as the P13 flyer says it: "2 bedrooms", "2 full baths", "1,635 square feet", "Built in 2005"
  FO.factText = t => /^Built/.test(t) ? t : String(t).toLowerCase().replace(/sq ft$/, 'square feet');
  // the band of the main color (P13's foot band), edge to edge with bleed; inner html is set on it (white type, gold caps)
  FO.band = (x, y, w, h, inner, id) => `<div class="cd-bandbg"${id ? ` id="${id}"` : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"></div><div class="cd-band">${inner || ''}</div>`;
  // P13's facts: centered, a short rule between them (the flyer's column beside the house), here as a 2 x 2 grid or one row of numbers
  FO.factGrid = (L, x, y, w, h, slot) => { const it = FXS.statItems(L).map(FO.factText).slice(0, 4), n = it.length, cols = 2, rows = Math.ceil(n/cols), cw = w/cols, rh = h/rows; let t = '';
    const fs = Math.min(...it.map(s => FXS.fitSize(s, `${RHD};font-weight:600`, cw - 16, 17, 10)));
    it.forEach((s, i) => { const c = i % cols, r = Math.floor(i/cols), cx = x + c*cw, cy = y + r*rh;
      t += `<div class="abs" style="left:${cx}pt;top:${cy + (rh - fs*1.3)/2}pt;width:${cw}pt;height:${fs*1.3}pt;${RHD};font-weight:600;font-size:${fs}pt;line-height:${fs*1.3}pt;color:var(--cd-on);text-align:center;white-space:nowrap" data-slot="${slot}.${i}" data-lines="1">${esc(s)}</div>`; });
    for(let r = 1; r < rows; r++) for(let c = 0; c < cols; c++) t += `<div class="cd-dv" style="left:${x + c*cw + cw/2 - 18}pt;top:${y + r*rh}pt;width:36pt"></div>`;
    for(let c = 1; c < cols; c++) t += `<div class="abs" style="left:${x + c*cw}pt;top:${y + rh*0.3}pt;width:1pt;height:${h - rh*0.6}pt;background:var(--cd-accent);opacity:.4"></div>`;
    return t; };
  FO.factRow = (L, x, y, w, h, slot) => { const parts = FXS.statItems(L).map(FXS.statParts).slice(0, 4), n = parts.length, cw = w/n; let t = '';
    const nf = Math.min(...parts.map(p => FXS.fitSize(p.n, `${RHD};font-weight:700`, cw - 12, 30, 16)));
    parts.forEach((p, i) => { const cx = x + i*cw, bh = nf*1.1 + 6 + 11, top = y + (h - bh)/2;
      t += `<div class="abs" style="left:${cx}pt;top:${top}pt;width:${cw}pt;height:${nf*1.1}pt;${RHD};font-weight:700;font-size:${nf}pt;line-height:${nf*1.1}pt;color:var(--cd-accent);text-align:center;white-space:nowrap" data-slot="${slot}.${i}" data-lines="1">${esc(p.n)}</div>`;
      t += `<div class="cd-ml" style="left:${cx}pt;top:${top + nf*1.1 + 6}pt;width:${cw}pt;color:var(--cd-soft)" data-slot="${slot}.${i}.l" data-lines="1">${esc(String(p.l).toUpperCase())}</div>`;
      if(i) t += `<div class="abs" style="left:${cx}pt;top:${y + h*0.2}pt;width:1pt;height:${h*0.6}pt;background:var(--cd-accent);opacity:.45"></div>`; });
    return t; };
  // the overlapping print (P13's inset room): a room in its own mat laid over the lower-right corner of the house photo; data-inset lets
  // CD.insetFix slide it down (never over the house) once the hero's crop is known
  FO.inset = (D, id, x, y, w, h, slot, maxDown, extra) => `<div class="abs cd-inset" data-inset="${slot}" data-maxdown="${maxDown || 0}" style="left:0;top:0;width:0;height:0;z-index:4">${FXS.box(D, id, x, y, w, h, slot, '', 8)}${extra || ''}</div>`;

  // ---------------- Diagonal fronts (11/16) ----------------
  // the facts as the sign-in sheet's numbered squares grown into tiles: each fact a tile of `color` (the main color on the dark bar, the
  // kit's dark on the main field), the number in white 700, its word in accent caps under it; tiles share the width with an 8 pt gutter
  FO.factTiles = (L, x, y, w, h, slot, color, o) => { o = o || {}; const parts = FXS.statItems(L).map(FXS.statParts).slice(0, 4), n = parts.length, g = o.g == null ? 8 : o.g, cw = (w - (n - 1)*g)/n; let t = '';
    const nf = Math.min(o.max || 30, ...parts.map(p => FXS.fitSize(p.n, 'font-family:Jost;font-weight:700', cw - 18, o.max || 30, 15))), lf = Math.min(...parts.map(p => FXS.fitSize(String(p.l).toUpperCase(), 'font-family:Jost;font-weight:600;letter-spacing:2pt', cw - 14, 9.5, 8.6)));
    parts.forEach((p, i) => { const cx = x + i*(cw + g), bh = nf*1.05 + 5 + lf*1.3, top = y + (h - bh)/2;
      t += `<div class="abs" style="left:${cx}pt;top:${y}pt;width:${cw}pt;height:${h}pt;background:${color}"></div>`;
      t += `<div class="abs" style="left:${cx}pt;top:${top}pt;width:${cw}pt;height:${nf*1.05}pt;font-family:Jost;font-weight:700;font-size:${nf}pt;line-height:${nf*1.05}pt;color:#ffffff;text-align:center;white-space:nowrap" data-slot="${slot}.${i}" data-lines="1">${esc(p.n)}</div>`;
      t += `<div class="abs" style="left:${cx}pt;top:${top + nf*1.05 + 5}pt;width:${cw}pt;height:${lf*1.3}pt;font-family:Jost;font-weight:600;font-size:${lf}pt;line-height:${lf*1.3}pt;letter-spacing:2pt;text-transform:uppercase;color:var(--cd-stripe);text-align:center;white-space:nowrap" data-slot="${slot}.${i}.l" data-lines="1">${esc(p.l)}</div>`; });
    return t; };
  // the street as the two-tone headline: the number and the name broken where it sets largest in `rows` lines or fewer, the last line in the
  // accent (the sign-in sheet's PLEASE / SIGN IN); returns the lines and the size
  FO.streetLines = (ad, w, maxH, max, maxRows) => { const parts = String(ad || '').toUpperCase().split(/\s+/), opts = [];
    for(let i = 1; i < parts.length; i++) opts.push([parts.slice(0, i).join(' '), parts.slice(i).join(' ')]);
    if(parts.length >= 3 && (maxRows || 3) >= 3) for(let i = 1; i < parts.length - 1; i++) for(let j = i + 1; j < parts.length; j++) opts.push([parts.slice(0, i).join(' '), parts.slice(i, j).join(' '), parts.slice(j).join(' ')]);
    let best = null; opts.forEach(ls => { let f = max; while(f > 20 && (ls.some(l => FXS.width(l, `font-family:Jost;font-weight:700;letter-spacing:-.5pt;font-size:${f}pt`) > w - 4) || ls.length*f*0.94 > maxH)) f -= 0.5;
      const sc = f + 30*Math.min(1, ls.length*f*0.94/maxH); if(!best || sc > best.sc) best = {ls, f, sc}; });
    return best; };

  // ---------------- Civic Diagonal (P45) shared pieces ----------------
  FO.GAP = 12;   // P45's white channel between the slab's slanted foot and the photos cut on the same slant (and between side-by-side photos)
  // the street in the display face: Jost Light caps, broken into two lines where they set largest, every line spread to the measure w
  FO.wideStreet = (ad, w, maxH, max, min) => { const parts = String(ad || '').toUpperCase().split(/\s+/), opts = [[parts.join(' ')]];
    for(let i = 1; i < parts.length; i++) opts.push([parts.slice(0, i).join(' '), parts.slice(i).join(' ')]);
    let best = null; opts.forEach(ls => { let f = CD.wideFit(ls, w, max, min, 2.5); while(f > min && ls.length*f*1.12 > maxH) f -= 0.5;
      const lo = Math.min(...ls.map(l => l.length))/Math.max(...ls.map(l => l.length)), sc = f*(ls.length === 1 ? 1 : 0.92 + 0.08*lo); if(!best || sc > best.sc) best = {ls, f, sc}; });
    return best; };
  FO.place = L => [FXS.hood(L), FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, '')].filter(Boolean).join('  ·  ').toUpperCase();
  // the sign-in sheet's welcome block on the slab: a gold eyebrow, the line in white tracked caps, the gold short rule, a gold second line
  FO.slabBlock = (eb, main, sub, x, y, w, max, slot) => { const mf = FXS.fitSize(String(main).toUpperCase(), 'font-family:Jost;font-weight:500;letter-spacing:2.4pt', w, max, 14);
    let h = '', yy = y; if(eb){ h += `<div class="cd-place" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:13pt;font-size:9pt;line-height:13pt;letter-spacing:3.6pt" data-slot="${slot}.eyebrow" data-lines="1">${esc(String(eb).toUpperCase())}</div>`; yy += 21; }
    h += `<div class="cd-addr" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${mf*1.2}pt;font-size:${mf}pt;line-height:${mf*1.2}pt;letter-spacing:2.4pt" data-slot="${slot}" data-lines="1">${esc(String(main).toUpperCase())}</div>`; yy += mf*1.2 + 10;
    h += `<div class="cd-grule" style="left:${x}pt;top:${yy}pt;width:36pt"></div>`; yy += 12;
    if(sub){ const sf = FXS.fitSize(String(sub).toUpperCase(), 'font-family:Jost;font-weight:500;letter-spacing:2.6pt', w, 10.5, 8.6); h += `<div class="cd-place" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${sf*1.4}pt;font-size:${sf}pt;line-height:${sf*1.4}pt;letter-spacing:2.6pt" data-slot="${slot}.sub" data-lines="1">${esc(String(sub).toUpperCase())}</div>`; yy += sf*1.4; }
    return {html: h, h: yy - y}; };

  // Civic Diagonal cover (11/16): P45's own sheet turned into a cover. The kit's dark slab holds the top right, its foot on the set's slant;
  // the white channel runs under it, and the house fills the page's width under the channel, its top cut on the same slant (straightened where
  // the cut would reach the house: P45's own "the cut crosses sky only" rule). On the white field at top left, the street as P45's display
  // word: Jost Light caps, every line spread to one measure, the place in the main color, the house's short write-up under it. On the slab,
  // the sign-in sheet's welcome block: the neighborhood in white caps, the gold rule, the city. Under the house, P45's facts with their line
  // icons. No agent, no brokerage.
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), SX = 336, PW = 621 - FO.FG, FZ = 100, B = 792 - FZ;
    let Hh = 470; while(Hh > 300 && !SW.fits(D, hero, PW, Hh)) Hh -= 4;
    const yT = B - Hh, ln = CD.y(621, yT), foot = CD.y(621, yT - FO.GAP);   // ln: the photo's top line; foot: the slab's foot, one channel above it
    let h = CD.cut(D, hero, FO.FG, yT, PW, B - yT, 'front.house', 'top', ln(FO.FG), yT);
    h += CD.field(SX, 621, foot(SX), foot(621), 'above', -9, 'var(--cd-dark)');
    // the slab: the welcome block centered in its square part
    const hood = FXS.hood(L), city = FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, ''), bw = 621 - 30 - (SX + 30);
    const blk = FO.slabBlock('', hood || city, hood ? city : '', SX + 30, 0, bw, 30, 'front.hood'), by = 30 + Math.max(0, (foot(621) - 26 - 30 - blk.h)/2);
    h += `<div class="cd-band">${FO.slabBlock('', hood || city, hood ? city : '', SX + 30, by, bw, 30, 'front.hood').html}</div>`;
    // the white field: the street as the display word, the place, the write-up
    const LW = SX - 26 - X0, top = 40, bot = yT - 16, S = FO.wideStreet(L.address, LW, Math.min(150, (bot - top)*0.55), 62, 24), slh = +(S.f*1.12).toFixed(2);
    let y = top; S.ls.forEach((l, i) => { h += CD.wide(l, X0, y, LW, S.f, slh, 'address' + (i ? '.2' : ''), {max: S.f*0.5}); y += slh; });
    y += 6; const pl = FO.place(L), pf = FXS.fitSize(pl, 'font-family:Jost;font-weight:500;letter-spacing:2.2pt', LW, 10.5, 8.6);
    h += `<div class="cd-place" style="left:${X0}pt;top:${y}pt;width:${LW}pt;height:${pf*1.4}pt;font-size:${pf}pt;line-height:${pf*1.4}pt;letter-spacing:2.2pt" data-slot="front.place" data-lines="1">${esc(pl)}</div>`; y += pf*1.4 + 14;
    { const avail = bot - y, lh = 16, nl = Math.floor(avail/lh);
      if(nl >= 3) h += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="${nl},${nl - 1}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0}pt;top:${y + (avail - nl*lh)/2}pt;width:${LW}pt;height:${nl*lh}pt;font-size:11pt;line-height:${lh}pt"></div>`); }
    // under the house: P45's facts with their icons, three to a row
    const six = CD.factSix(L).filter(f => f[0] !== 'stories'); if(six.length < 5) CD.factSix(L).filter(f => f[0] === 'stories').forEach(f => six.push(f));
    const cols = 3, rows = Math.ceil(six.length/cols), rh = 26, fy = B + (FZ - rows*rh)/2 - 2;
    h += CD.facts(six, X0, fy, CW, cols, rh, 'front.fact', {ic: 18, max: 13.5, g: 14}).html;
    return h;
  };

  // Civic Diagonal flyer front (11/16): its own composition, the cover turned upside down. The house runs across the head of the page
  // from trim to trim, its top straight, its foot cut on the set's slant (straightened where the cut would reach the house). Under the white
  // channel, P45's dark slab rises from the right with its top on the same slant and carries the facts beside their line icons in white;
  // on the white field at left, the street as P45's display word (Light caps spread to the column), the place and the write-up; across the
  // foot, three rooms split by P45's white gaps, their names under them. No agent, no brokerage.
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), strip = (o.strip || (P.cd || {}).flyerStrip || P.flyerStrip || P.strip || []).filter(id => id !== hero).slice(0, 3);
    let HL = 372; while(HL > 300 && !SW.fits(D, hero, 630, HL + 9)) HL -= 4;   // the photo's foot at the left trim
    const ln = CD.y(-9, HL), SX = 352, RT = 646, RB = 742;
    let h = CD.cut(D, hero, -9, -9, 630, HL + 9, 'front.house', 'foot', HL, ln(621));
    // the slab: its top one channel under the photo's foot, down to the rooms
    const st = CD.y(-9, HL + FO.GAP); h += CD.field(SX, 621, st(SX), st(621), 'below', RT - FO.GAP, 'var(--cd-dark)');
    const six = CD.factSix(L), ft = st(SX) + 22, rows = six.length, rh = Math.min(34, (RT - FO.GAP - 22 - ft)/rows), fy = ft + (RT - FO.GAP - 22 - ft - rows*rh)/2;
    h += `<div class="cd-band">${CD.facts(six, SX + 30, fy, 572 - SX - 30, 1, rh, 'front.fact', {ic: 19, max: 14.5}).html}</div>`;
    // the white field: the street, the place, the write-up
    const LW = SX - 24 - X0, top = ln(X0) + FO.GAP + 14, S = FO.wideStreet(L.address, LW, 112, 52, 22), slh = +(S.f*1.12).toFixed(2);
    let y = top; S.ls.forEach((l, i) => { h += CD.wide(l, X0, y, LW, S.f, slh, 'address' + (i ? '.2' : ''), {max: S.f*0.5}); y += slh; });
    y += 4; const pl = FO.place(L), pf = FXS.fitSize(pl, 'font-family:Jost;font-weight:500;letter-spacing:2.2pt', LW, 10.5, 8.6);
    h += `<div class="cd-place" style="left:${X0}pt;top:${y}pt;width:${LW}pt;height:${pf*1.4}pt;font-size:${pf}pt;line-height:${pf*1.4}pt;letter-spacing:2.2pt" data-slot="front.place" data-lines="1">${esc(pl)}</div>`; y += pf*1.4 + 12;
    { const avail = RT - FO.GAP - 4 - y, lh = 16, nl = Math.max(3, Math.floor(avail/lh));
      h += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="${nl},${nl - 1}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0}pt;top:${y + (avail - nl*lh)/2}pt;width:${LW}pt;height:${nl*lh}pt;font-size:11pt;line-height:${lh}pt"></div>`); }
    // the rooms: trim to trim, P45's white gap between them
    const n = strip.length || 1, g = FO.GAP, rw = (630 - (n - 1)*g)/n;
    strip.forEach((id, i) => { const x = -9 + i*(rw + g);
      h += FXS.box(D, id, x, RT, rw, RB - RT, 'front.strip' + i);
      const lx = Math.max(X0, x + 10), lw = Math.min(X1, x + rw - 10) - lx;
      h += `<div class="cd-place" style="left:${lx}pt;top:${RB + 8}pt;width:${lw}pt;height:12pt;font-size:8.6pt;line-height:12pt;letter-spacing:2.2pt;text-align:${i === 0 ? 'left' : i === n - 1 ? 'right' : 'center'}" data-slot="front.strip${i}.label" data-lines="1">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div>`; });
    return h;
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
  // (Sora), sentence case, on two lines at the largest size from `max` down to 30 pt; a short headline takes a narrower measure so it
  // still breaks in two; the short accent rule under it. An eyebrow that only repeats its headline's words is left out. Returns {html, y}.
  FO.HORIZON = 196;   // one horizon across the inside spread: both pages' photos start here, the headlines end on one baseline above it
  FO.head2 = (kicker, title, slot, o) => { o = o || {}; const t = String(title || '').replace(/\.$/, '').replace(/(^| )([AaI]) /g, '$1$2 '), fam = "font-family:Jost;font-weight:500;letter-spacing:-.2pt", x = o.x == null ? X0 : o.x;   // a one-letter word never ends a display line
    const words = q => new Set((String(q).toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length > 2 && !['the', 'and', 'with'].includes(w))), kw = [...words(kicker)], tw = words(title), rep = kw.length > 0 && kw.every(w => tw.has(w) || tw.has(w.replace(/s$/, '')) || tw.has(w + 's'));
    const nl = (ff, ww) => { let n = 1, cur = ''; t.split(' ').forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, `${fam};font-size:${ff}pt`) > ww - 1){ n++; cur = wd; } else cur = tr; }); return n; };
    let f = o.max || 44, w = o.w || 500;
    while(f > 30 && nl(f, w) > 2) f -= 0.5;
    while(nl(f, w) > 2 && w < CW) w += 10;
    const one = FXS.width(t, `${fam};font-size:${f}pt`); if(one <= w - 1){ let ww = one*0.56; while(nl(f, ww) > 2 && ww < w) ww += 4; w = ww; }
    const lh = +(f*1.16).toFixed(2), hb = FO.HORIZON - 27, hy = hb - 2*lh, ky = hy - 17;
    let h = rep || !kicker ? '' : `<div class="abs fo-kick" style="left:${x}pt;top:${ky}pt" data-slot="${slot}.kicker" data-lines="1">${esc(String(kicker).toUpperCase())}</div>`;
    h += `<div class="cd-head" style="left:${x}pt;top:${hy}pt;width:${Math.ceil(w) + 2}pt;height:${2*lh}pt;font-size:${f}pt;line-height:${lh}pt" data-slot="${slot}.title" data-lines="2" data-fine="1">${esc(t)}</div>`;
    // one accent rule across the fold: the same height on both inside pages, running from the text margin through the frame to the fold,
    // where it meets its match on the other page (the frame breaks where the rule passes through it)
    const fold = o.fold || (/^left/.test(slot) ? 'r' : /^right/.test(slot) ? 'l' : ''), rx = fold === 'l' ? -9 : X0, rw = fold === 'r' ? 621 - X0 : fold === 'l' ? X1 + 9 : CW;
    h += `<div class="cd-rule" style="left:${rx}pt;top:${hb + 9}pt;width:${rw}pt;height:1pt"></div>`;
    if(fold) h += `<div class="cd-cut" style="left:${fold === 'r' ? FR[2] - 3 : FR[0] - 3}pt;top:${hb + 8}pt;width:7pt;height:3pt"></div>`;
    return {html: h, y: FO.HORIZON}; };

  // Design pass 11/15: a labeled table in the set's own panel. Every row is one full line: the label in accent caps in a column as wide as
  // the longest label needs (labels never touch values), then the fullest true wording of the row that sets on one line. The type size
  // (10 to 12 pt) and the value column's width are chosen so the most rows fill 86% or more of their line (set ragged: a one-line row justified opens wide word gaps).
  // A row that cannot fill its line is left out while four or more remain (a short row reads as a mistake); kept rows keep their order.
  FO.tableRows = (items0, liw, taken, o) => { o = o || {}; const lcss = 'font-family:Jost;font-weight:500;font-size:8.6pt;letter-spacing:2.2pt', LW0 = o.stack ? 0 : Math.ceil(Math.max(...items0.map(it => FXS.width(String(it.l).toUpperCase(), lcss)))) + 20;
    const ok = a => !taken || !taken(a); let best = null; const MIN = 0.86, opts = o.stack ? (o.Vs || [178, 184, 190, 196, 202, 208, 214]).map(V => [0, V]) : [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60].map(d => [LW0 + d, liw - LW0 - d]);
    for(let f = o.stack ? 10.5 : 10.5; f <= (o.stack ? 13.51 : 12.51); f += 0.25) for(const [LW, V] of opts){ const css = `font-family:Jost;font-weight:400;font-size:${f}pt`;
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
    for(let f = 10.5; f <= 13.51; f += 0.25) for(const V of (o.Vs || [184, 190, 196, 202, 208, 214, 220])){ const css = `font-family:Jost;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== 2 || Lw[0] < 0.8*V || Lw[1] < 0.9*V) return; const sc = (Lw[0] + Lw[1])/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 4), score = n*100 + f*2 - V*0.05;
      if(!best || score > best.score) best = {score, f, V, LW: 0, rows: rows.slice(0, o.maxRows || 4)}; }
    return best; };
  FO.tableStack2 = (T, kicker, heading, x, y, w, hgt, slot) => { const n = Math.max(1, T.rows.length), lx = x + 18, liw = w - 36, hs = heading ? FXS.fitSize(String(heading).replace(/\.$/, ''), "font-family:Jost;font-weight:500", liw, 15, 11) : 0, top = heading ? 56 : 36, rowH = (hgt - top - 9)/n, lh = +(T.f*1.4).toFixed(2);
    let b = `<div class="cd-wbox lt" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 15}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 29}pt;width:${liw}pt;font-size:${hs}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    T.rows.forEach((r, i) => { const ry = y + top + i*rowH, c0 = ry + (rowH - 11 - 3 - 2*lh)/2;
      b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .5}pt;width:${liw}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${c0 + 1}pt;width:${liw}pt;color:var(--cd-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx}pt;top:${c0 + 14}pt;width:${liw + 1}pt;height:${2*lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--cd-font);color:var(--fx-soft);overflow:hidden" data-slot="${slot}.list.t${i}" data-lines="2">${esc(r.t)}</div>`; });
    return `<div class="cd-lt">${b}</div>`; };
  FO.table = (T, kicker, heading, x, y, w, hgt, slot) => { const n = T.rows.length, lx = x + 18, liw = w - 36, top = heading ? 58 : 36, rowH = (hgt - top - 12)/n;
    let b = `<div class="cd-wbox" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 16}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 30}pt;width:${liw}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    T.rows.forEach((r, i) => { const ry = y + top + i*rowH, lh = Math.round(T.f*1.5);
      if(i) b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .4}pt;width:${liw}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${ry + rowH/2 - 5.5}pt;width:${T.LW - 8}pt;color:var(--cd-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx + T.LW}pt;top:${ry + rowH/2 - lh/2}pt;width:${T.V}pt;height:${lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--cd-font);color:var(--fx-soft);white-space:nowrap;overflow:hidden;" data-slot="${slot}.list.t${i}" data-lines="1">${esc(r.t)}</div>`; });
    return b; };
  // the room's card beside its big photo: a narrow panel as tall as the photo, each row its label in accent caps over one full line of true detail; the rows share the height evenly (the box is sized to its content)
  FO.tableStack = (T, kicker, heading, x, y, w, hgt, slot) => { const n = T.rows.length, lx = x + 18, liw = w - 36, hs = heading ? FXS.fitSize(String(heading).replace(/\.$/, ''), "font-family:Jost;font-weight:500", liw, 15, 11) : 0, top = heading ? 56 : 36, rowH = (hgt - top - 9)/n, lh = Math.round(T.f*1.4);
    let b = `<div class="cd-wbox" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 15}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 29}pt;width:${liw}pt;font-size:${hs}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    T.rows.forEach((r, i) => { const ry = y + top + i*rowH, c0 = ry + (rowH - 11 - 3 - lh)/2;
      b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .5}pt;width:${liw}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${c0 + 1}pt;width:${liw}pt;color:var(--cd-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx}pt;top:${c0 + 14}pt;width:${liw}pt;height:${lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--cd-font);color:var(--fx-soft);white-space:nowrap;overflow:hidden;" data-slot="${slot}.list.t${i}" data-lines="1">${esc(r.t)}</div>`; });
    return b; };

  // ---------------- INSIDE SPREAD (Diagonal, 11/16). One line across 17 inches: the set's rising line runs from the left page's outer
  // edge to the right page's outer edge without a break (FO.SY at the left trim, rising CD.S per pt), and each page's best room fills the
  // top of its page above it, its foot cut on the line, the accent stripe riding the cut through the fold (bars and stripes may cross it;
  // the photos stop 0.05 in short of it). Under the line each page steps down from the line by the same amount, so the two headline blocks
  // climb with it: LEFT the kitchen's two-tone headline, its card (P22's white event box) and two captioned rooms; RIGHT the room's
  // two-tone headline, its own write-up as the page's lead, and three rooms in a row.
  // ---------------- INSIDE SPREAD (Civic Diagonal, 11/16). P45's slab runs across the head of the whole spread: one dark mass whose foot
  // rises on the set's slant from the left page's outer edge to the right page's outer edge (it crosses the fold, as bars may), deep on the
  // left page where it holds the kitchen's headline in white caps, tapering to a sliver at the right page's outer edge. The white channel
  // runs under it the whole 17 inches, and the two best rooms (the kitchen left, the room right) fill the pages under the channel, their tops
  // cut on the same slant, each stopping 0.05 in short of the fold; their feet meet one horizon (FO.HB) on both pages. Under the horizon:
  // LEFT the kitchen card in the sign-in sheet's tinted rows; RIGHT the room's eyebrow, its headline in P45's Light caps and its own write-up;
  // both pages close on one locked row of two captioned rooms split by P45's white gap, the rows' tops on one line across the spread.
  FO.SY = 220;   // the slab's foot at the left page's left trim
  FO.spY = X => FO.SY - CD.S*X;   // X in spread pt: 0 .. 1224 (the fold at 612)
  FO.FG = 3.6;   // owner 11/16: photos stop 0.05 in short of the fold
  FO.HB = 400;   // the horizon: both big rooms end here
  FO.topCut = (D, id, slot, left) => { const xa = left ? -9 : FO.FG, xb = left ? 612 - FO.FG : 621, X = x => left ? x : x + 612, ya = FO.spY(X(xa)) + FO.GAP, yb = FO.spY(X(xb)) + FO.GAP, top = Math.min(ya, yb);
    return CD.cut(D, id, xa, top, xb - xa, FO.HB - top, slot, 'top', ya, yb); };
  FO.slabTop = left => left ? CD.field(-9, 621, FO.spY(-9), FO.spY(621), 'above', -9, 'var(--cd-dark)') : CD.field(-9, 621, FO.spY(603), FO.spY(1233), 'above', -9, 'var(--cd-dark)');
  // the right page's text block under the horizon: the room's name, the headline in P45's Light caps (two lines, each spread to the
  // measure), its own write-up; returns {html, bottom}. Built once for its height so both pages' rows can share one top.
  FO.rightHead = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, C = P.cd || {}, ids = C.right ? [C.right].concat(C.rightRow || []) : (P.right || []), top = FO.cards(D, ids)[0];
    const c = FXS.cardFor(D, top.photo) || {}, lab = FXS.leadLabel(c.lead || FO.lead(D, top.photo)), t = String(C.rightTitle || R.title || '').replace(/\.$/, '').toUpperCase(); if(lab.size) (FXS.__sizes = FXS.__sizes || new Set()).add(lab.size);
    const y0 = FO.HB + 16; let h = `<div class="cd-place" style="left:${X0}pt;top:${y0}pt;width:${CW}pt;height:13pt;font-size:9.5pt;line-height:13pt;letter-spacing:3pt" data-slot="right.room" data-lines="1">${esc(String(lab.name || '').toUpperCase())}${lab.size ? `<span data-size="1" style="margin-left:12pt;color:var(--cd-soft);letter-spacing:1.2pt;font-weight:500">${esc(lab.size)}</span>` : ''}</div>`;
    // break the headline in two where both lines set largest at a shared size
    const ws = t.split(/\s+/); let best = null; for(let k = 1; k < ws.length; k++){ const l = [ws.slice(0, k).join(' '), ws.slice(k).join(' ')]; if(/^(A|AN|THE|AND|OF|WITH|I)$/.test(ws[k - 1])) continue; const f = CD.wideFit(l, CW, 30, 20, 2); const sc = f - 2*Math.abs(l[0].length - l[1].length)/Math.max(l[0].length, l[1].length); if(!best || sc > best.sc) best = {l, f, sc}; }
    if(!best) best = {l: [t], f: CD.wideFit([t], CW, 34, 18, 2)};
    const lh = +(best.f*1.12).toFixed(2); let y = y0 + 19; best.l.forEach((l, i) => { h += CD.wide(l, X0, y, CW, best.f, lh, 'right.title' + (i ? '.2' : ''), {max: 9}); y += lh; });
    const c0 = FXS.augment(D, top), wl = 20, nw = 3; y += 8;
    h += `<div class="abs cap"><div class="a" style="position:absolute;left:${X0}pt;top:${y}pt;width:${CW}pt;height:${nw*wl}pt;font-size:15pt;line-height:${wl}pt;color:var(--cd-soft)" data-slot="right.photo0" data-room="${esc(lab.name)}" data-lh="${wl}" data-hbox="${nw*wl}" data-lines="${nw}" data-min="3" data-narrow="0" ${FXS.sd(c0.s)}></div></div>`;
    return {html: h, bottom: y + nw*wl, top}; };
  // a locked row of two captioned rooms, straight tops at y, P45's white gap between them, captions under, closing at the page's foot
  FO.row2 = (D, cards, y, pre, first) => { const g = FO.GAP + 6, w = (CW - g)/2, Lc = 3, clh = 13.5, ph = 766 - y - 25 - Lc*clh;
    return cards.slice(0, 2).map((c, i) => FXS.captioned(D, c, X0 + i*(w + g), y, w, ph, Lc, pre + (i + (first || 0)), {fs: 10, lh: clh, min: 3}).replace(`data-slot="${pre}${i + (first || 0)}" data-room`, `data-slot="${pre}${i + (first || 0)}" data-nopair="1" data-room`)).join(''); };
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, C = P.cd || {};
    const kid = C.left || (P.strip || []).find(id => (D.photos || {})[id]) || 'kitchen', rowC = FO.cards(D, C.leftRow || (P.left || []).filter(id => id !== kid).slice(0, 2));
    let h = FO.slabTop(true) + FO.topCut(D, kid, 'left.wide', true);
    // on the slab: the kitchen's name and size in gold caps, the headline in white tracked caps, two lines, as large as the slab allows
    { const c = FXS.cardFor(D, kid) || {}, lab = FXS.leadLabel(c.lead || FO.lead(D, kid)), t = String(C.leftTitle || I.title || '').replace(/\.$/, '').toUpperCase(), css = 'font-family:Jost;font-weight:500;letter-spacing:1.5pt';
      if(lab.size) (FXS.__sizes = FXS.__sizes || new Set()).add(lab.size);
      const ky = 36; let pick = null;
      for(let f = 34; f >= 22 && !pick; f -= 0.5){ const lh = f*1.1, yb = ky + 22 + 2*lh, xr = (FO.SY - yb - 18)/CD.S, w = Math.min(CW, xr - X0); if(w < 260 || yb > FO.spY(612 - FO.FG) + FO.GAP - 6) continue;
        const ws = t.split(/\s+/); let b2 = null; for(let k = 1; k < ws.length; k++){ const l = [ws.slice(0, k).join(' '), ws.slice(k).join(' ')], mw = Math.max(...l.map(q => FXS.width(q, `${css};font-size:${f}pt`))); if(mw <= w - 2 && !/^(A|AN|THE|AND|OF|WITH)$/.test(ws[k - 1]) && (!b2 || Math.abs(l[0].length - l[1].length) < b2.d)) b2 = {l, d: Math.abs(l[0].length - l[1].length)}; }
        if(b2) pick = {f, lh, l: b2.l}; }
      if(!pick) pick = {f: 22, lh: 24.2, l: CD.twoLines(t, CW, 22, 1.5)};
      let hh = `<div class="cd-place" style="left:${X0}pt;top:${ky}pt;width:${CW}pt;height:13pt;font-size:9.5pt;line-height:13pt;letter-spacing:3pt" data-slot="left.room" data-lines="1">${esc(String(lab.name || FO.lead(D, kid)).toUpperCase())}${lab.size ? `<span data-size="1" style="margin-left:12pt;color:var(--cd-soft-dark);letter-spacing:1.2pt;font-weight:500">${esc(lab.size)}</span>` : ''}</div>`;
      hh += `<div class="cd-two" style="left:${X0}pt;top:${ky + 22}pt;width:${CW}pt;height:${pick.l.length*pick.lh}pt;font-size:${pick.f}pt;line-height:${pick.lh}pt;letter-spacing:1.5pt" data-slot="left.title" data-lines="${pick.l.length}" data-fine="1">${pick.l.map(esc).join('<br>')}</div>`;
      h += `<div class="cd-band">${hh}</div>`; }
    // the kitchen card: the sign-in sheet's tinted rows under a dark rule; four rows in two columns (three on the 1-story's renovation
    // story), each its label in the main color over two full lines of true detail; a row that only repeats what the back's lists print is left out
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const taken = a => /^(It|Its|They|This|That)\b/.test(a) || SW.grams4(a).some(g => backG.has(g)) || backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w))));
    const KX = X0, KW = CW, cw2 = (KW - 36 - 26)/2;
    const T2 = FO.tableRows2((box.items || []).slice(0, 10), taken, {maxRows: 4, Vs: [cw2 - 24, cw2 - 16, cw2 - 8, cw2]});
    const cwW = (KW - 36 - 26)/2, T1 = FO.tableRows((box.items || []).slice(0, 10), cwW, taken, {stack: true, maxRows: 6, Vs: [cwW - 30, cwW - 20, cwW - 10, cwW]}); T1.rows = T1.rows.filter(r => r.fill >= 0.86).slice(0, 6);
    const one = T2.rows.length < 4 && T1.rows.length > T2.rows.length, T = one ? T1 : T2, NL = one ? 1 : 2, NC = 2, CG = 26;
    if(T.rows.length % 2 && T.rows.length > 2) T.rows = T.rows.slice(0, T.rows.length - 1);
    const colW2 = (KW - 36 - (NC - 1)*CG)/NC, rows = T.rows, nr = Math.ceil(rows.length/NC), lh = +(T.f*1.42).toFixed(2), rowH = 13 + NL*lh + 12, BY = FO.HB + 16, BH0 = 14 + nr*rowH, RT = Math.max(BY + BH0, FO.rightHead(D).bottom) + 18, BH = RT - 18 - BY, OY = (BH - BH0)/2; FO._RT = RT;
    let b = `<div class="cd-wb" style="left:${KX}pt;top:${BY}pt;width:${KW}pt;height:${BH}pt"></div>`;
    rows.forEach((r, i) => { const c = i % NC, rr = Math.floor(i/NC), x = KX + 18 + c*(colW2 + CG), y = BY + 13 + OY + rr*rowH;
      if(rr) b += `<div class="abs hr" style="left:${x}pt;top:${y - 7}pt;width:${colW2}pt"></div>`;
      b += `<div class="cd-wl" style="left:${x}pt;top:${y}pt;width:${colW2}pt" data-slot="left.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${x}pt;top:${y + 13}pt;width:${T.V + 1}pt;height:${NL*lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--cd-font);color:var(--cd-soft);overflow:hidden;${NL === 2 ? 'text-align:justify;text-align-last:left' : 'white-space:nowrap'}" data-slot="left.list.t${i}" data-lines="${NL}">${esc(r.t)}</div>`; });
    for(let c = 1; c < NC; c++) if(rows.length > NC - 1) b += `<div class="abs" style="left:${KX + 18 + c*(colW2 + CG) - CG/2 - .5}pt;top:${BY + 14}pt;width:1pt;height:${BH - 26}pt;background:var(--cd-rule)"></div>`;
    h += `<div class="cd-on-wb" style="position:relative;z-index:3">${b}</div>`;
    h += FO.row2(D, rowC, RT, 'left.photo', 0);
    return h;
  };
  FO.right = (D) => { const K = D.sw || {}, P = K.plan || {}, C = P.cd || {};
    const ids = C.right ? [C.right].concat(C.rightRow || []) : (P.right || []), cs = FO.cards(D, ids), rest = cs.slice(1).sort((a, b) => (/bath|closet|laundry|powder/.test(a.photo) ? 1 : 0) - (/bath|closet|laundry|powder/.test(b.photo) ? 1 : 0)).slice(0, 2);
    const hd = FO.rightHead(D);
    let h = FO.slabTop(false) + FO.topCut(D, hd.top.photo, 'right.wide', false) + hd.html;
    h += FO.row2(D, rest, FO._RT || hd.bottom + 18, 'right.photo', 1);
    return h;
  };
  FO.rightFit = () => {}; FO.leftHead = () => {};

  // ---------------- BACK (fold-over) and flyer back (Diagonal, 11/16) ----------------
  // Top: the listing's own plan in a box its own shape (or, with no plan, the big outdoor photo), the write-up beside it at the rest of the
  // width. Middle: the two lists in P22's white event box (or, with no plan, stacked beside a second captioned photo). Foot: the kit's dark
  // rises to meet the page on the set's line, the stripe riding it edge to edge; on the dark, Nearby as the sign-in sheet's numbered squares
  // stepping up the slope (the miles in the square, the place beside it), then the half-height contact card and the fine print.
  // ---------------- BACK (fold-over) and flyer back (Civic Diagonal, 11/16) ----------------
  // The cover's slab turned over: on the back the kit's dark holds the top LEFT (the cover's holds the top right, so the open sheet is
  // bookended by the two slabs), its foot on the set's slant, and carries "Floor by floor": the gold eyebrow, the headline in white caps and
  // the floor write-up in light type. The listing's own plan sits on the white page beside it, top right, in a box its own shape (no plan:
  // the outdoor photo with its caption). Under the white channel the slant continues across the page: on the left the two lists in the
  // sign-in sheet's tinted panel, its top cut on the slant; on the right a captioned photo cut the same way. Then Nearby as the sign-in
  // sheet's numbered rows (the miles in Light numerals), and the half-height contact card on the sign-in sheet's tinted band at the foot.
  FO.planBox = (D, x, y, maxH, maxW) => { const A = D.plan.turn && D.plan.kind === 'color' ? 270 : undefined, rot = !!D.plan.turn, noteW = Math.ceil(FXS.width((D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate.', 'font-family:Jost;font-size:8pt')) + 34;
    const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: rot ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: rot, angle: A}); let cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 40, D.plan.minCard || 0, noteW, 188));
    for(let hh = maxH; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: cw - 28.8, h: hh}, {allowRotate: rot, angle: A}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')){ if(big.usedW) cw = Math.min(cw, Math.max(Math.ceil(big.usedW) + 40, D.plan.minCard || 0, noteW, 188)); break; } }
    return Object.assign(FXS.planCard(D, x, y, cw, maxH), {w: cw}); };
  FO.CARD_H = 62; FO.CARD_Y = 690;
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:${FO.CARD_Y + FO.CARD_H + 6}pt;width:${CW}pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  // Nearby as the sign-in sheet's numbered rows: three columns, the miles in Jost Light numerals in the main color, the unit and the place
  // in tracked caps beside them, a dark rule over the row
  FO.nearRow = (D, y, hgt) => { const N = ((D.sw || {}).back || {}).nearby || [], n = Math.min(3, N.length), g = 18, cw = (CW - (n - 1)*g)/Math.max(1, n); let h = `<div class="abs" style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:1.5pt;background:var(--cd-on)"></div>`;
    N.slice(0, n).forEach((nn, i) => { const cx = X0 + i*(cw + g), m = /^([\d.,]+)\s*(.*)$/.exec(String(nn.dist).trim()) || [0, nn.dist, ''], num = m[1], unit = String(m[2] || '').toUpperCase(), pl = String(nn.place).toUpperCase();
      const nf = 28, nw = FXS.width(num, `font-family:Jost;font-weight:300;font-size:${nf}pt`) + 12, tx = cx + nw + 10, tw = cw - nw - 10, css = 'font-family:Jost;font-weight:500;letter-spacing:1.6pt', mid = y + 1.5 + (hgt - 1.5)/2;
      let pf = FXS.fitSize(pl, css, tw, 11, 8.6), lines = [pl];
      if(FXS.width(pl, `${css};font-size:${pf}pt`) > tw - 2){ const ws = pl.split(' '); let best = null; for(let k = 1; k < ws.length; k++){ const a = ws.slice(0, k).join(' '), b = ws.slice(k).join(' '), f = Math.min(FXS.fitSize(a, css, tw, 11, 8.6), FXS.fitSize(b, css, tw, 11, 8.6)); if(!best || f > best.f) best = {f, l: [a, b]}; } pf = best.f; lines = best.l; }
      const bh = 10 + 2 + lines.length*pf*1.3;
      h += `<div class="cd-num" style="left:${cx}pt;top:${mid - nf*0.62}pt;width:${nw}pt;height:${nf*1.2}pt;font-size:${nf}pt;line-height:${nf*1.2}pt;text-align:left" data-slot="back.near${i}.n" data-lines="1">${esc(num)}</div>`;
      h += `<div class="cd-place" style="left:${tx}pt;top:${mid - bh/2}pt;width:${tw}pt;height:10pt;font-size:8.6pt;line-height:10pt;letter-spacing:2pt;color:var(--cd-accent)" data-slot="back.near${i}.u" data-lines="1">${esc(unit)}</div>`;
      h += `<div class="abs" data-slot="back.near${i}" data-lines="${lines.length}" data-fine="1" style="left:${tx}pt;top:${mid - bh/2 + 12}pt;width:${tw}pt;height:${lines.length*pf*1.3}pt;white-space:nowrap;font-family:Jost;font-weight:500;font-size:${pf}pt;line-height:${pf*1.3}pt;letter-spacing:1.6pt;color:var(--cd-on)">${lines.map(esc).join('<br>')}</div>`;
      if(i) h += `<div class="abs" style="left:${cx - g/2 - .5}pt;top:${y + 12}pt;width:1pt;height:${hgt - 20}pt;background:var(--cd-rule)"></div>`; });
    return {html: h}; };
  // the standard contact card on the sign-in sheet's tinted band (edge to edge): the agent left, the brokerage's paper logo right
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = CD.logoPaper(D);
    const pw = 180, lh = Math.min(46, H - 30), s = {name: 16.5, nameFloor: 13, line: 8.6, rowGap: 10, phone: 12, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div class="cd-ccw" style="--cc-display:Jost;--cc-body:Jost">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true}) + '</div>'; };
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, C = P.cd || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? (C.flyerTop || (P.backNoplan || [])[0]) : (C.backTop || (P.backNoplan || [])[0]);
    const footId = hasPlan ? topId : flyer ? C.flyerFootNoplan : C.backFootNoplan;
    const TOP = 40, R0 = 572, edge = flyer ? 621 : R0;
    let h = '', rx, rw, rBot;
    const LV = hasPlan ? (D.plan.levels || []) : [], tall = hasPlan && (LV.length >= 4 || (LV.length === 1 && LV[0].h/LV[0].w > 1.5));
    // the top right: the plan in its own box (or the outdoor photo with its caption)
    // the room the lists' panel needs under the channel decides how low the slab's foot (and so the plan) may reach
    const BX0 = KB.boxes || {}, SF0 = FXS.sellingFacts(D), n1 = Math.min(4, ((BX0.inside && BX0.inside.items) || SF0.inside).length), n2 = Math.min(4, ((BX0.outside && BX0.outside.items) || SF0.outside).length);
    const RB0 = FO.CARD_Y - 26 - 12 - 48 - 16, listH = 2*19 + 10 + (n1 + n2)*18 + 26, maxBot = SXv => RB0 - listH - FO.GAP - 18 - CD.S*(SXv - X0);
    if(hasPlan){ const mw = tall ? 250 : 300, p0 = FO.planBox(D, 0, TOP, tall ? 300 : 262, mw), TH = Math.min(tall ? 300 : 262, maxBot(R0 - p0.w - 22) - TOP - 36); const p1 = FO.planBox(D, 0, TOP, TH, mw); rx = R0 - p1.w; const pc = FO.planBox(D, rx, TOP, TH, mw); rw = pc.w; h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; rBot = pc.bottom; }
    else { rw = 290; rx = R0 - rw; const c = FXS.cardFor(D, topId), ph = 168; h += FXS.captioned(D, c, rx, TOP, rw, ph, 3, 'back.top', {fs: 10.25, lh: 13.5, min: 3}); rBot = TOP + ph + 25 + 3*13.5; }
    // the slab: from the left bleed to 22 pt short of the plan; its foot on the slant, low enough under the write-up at the slab's right end
    const SX = rx - 22, ax = X0, aw = SX - 24 - ax;
    const kickT = +(D.listing || {}).stories > 1 ? 'Floor by floor' : 'Room by room', ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, '').toUpperCase();
    let hf = 22, hls = []; if(ht){ hls = CD.twoLines(ht, aw - 2, hf, 1.4); while(hf > 15 && hls.length > 2){ hf -= 0.5; hls = CD.twoLines(ht, aw - 2, hf, 1.4); } }
    const hlh = hf*1.14, T0 = TOP + 20 + (ht ? hls.length*hlh + 12 : 0), wBot = Math.max(Math.min(rBot, maxBot(SX)), T0 + 6*15.5), lineAt = CD.y(SX, wBot + 18);   // the slab's foot
    let ln = lineAt; if(ln(edge) < rBot + 2) ln = CD.y(edge, rBot + 2);   // under the plan the channel never touches it
    const nW = Math.floor((ln(SX) - 18 - T0)/15.5), wlh = +((ln(SX) - 18 - T0)/nW).toFixed(3);
    h += CD.field(-9, SX, ln(-9), ln(SX), 'above', -9, 'var(--cd-dark)');
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const used = FO.cards(D, [topId, footId].filter(Boolean));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    let sl = `<div class="cd-place" style="left:${ax}pt;top:${TOP}pt;width:${aw}pt;height:12pt;font-size:9pt;line-height:12pt;letter-spacing:3pt" data-slot="back.about.title" data-lines="1">${esc(kickT.toUpperCase())}</div>`;
    if(ht) sl += `<div class="cd-two" style="left:${ax}pt;top:${TOP + 20}pt;width:${aw + 2}pt;height:${hls.length*hlh}pt;font-size:${hf}pt;line-height:${hlh}pt;letter-spacing:1.4pt" data-slot="back.about.head" data-lines="${hls.length}" data-fine="1">${hls.map(esc).join('<br>')}</div>`;
    sl += FO.full(FO.wu(keep(f2.concat(f1)), ax, T0, aw, nW*wlh + 0.01, 'back.about', 10.5, wlh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${aw < 240 ? ' data-rag="1"' : ''} data-span="${(nW*wlh).toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
    h += `<div class="cd-band">${sl}</div>`;
    // under the channel: the lists' tinted panel (left) and a captioned photo (right), both cut on the slant; then Nearby; then the card
    const NH = 48, NY = FO.CARD_Y - 26 - 12 - NH, RB = NY - 16, g = FO.GAP + 6, LW2 = Math.round(CW*0.5), PX = X0 + LW2 + g, PWd = edge - PX;
    const cut = x => ln(x) + FO.GAP, Lc = 3, clh = 13.5, PB = RB - 25 - Lc*clh;
    h += CD.fieldSvg(-9, X0 + LW2, cut(-9), cut(X0 + LW2), RB, 'var(--cd-tint)');
    { const tx = X0 + 4, tw = LW2 - 22, y0 = cut(X0) + 14, room = RB - 12 - y0; let n1 = Math.min(c1.length, 4), n2 = Math.min(c2.length, 4); while(n1 + n2 > 4 && (room - 2*19 - 10)/(n1 + n2) < 17){ if(n1 >= n2) n1--; else n2--; } const rh = Math.max(17, Math.min(24, (room - 2*19 - 10)/Math.max(1, n1 + n2))), ch = 2*19 + 10 + (n1 + n2)*rh;
      let y = y0 + Math.max(0, (room - ch)/2), t = '';
      t += `<div class="cd-wl" style="left:${tx}pt;top:${y}pt;width:${tw}pt" data-slot="back.updates.title" data-lines="1">${esc(t1.toUpperCase())}</div>` + FXS.bullets(c1, tx, y + 19, tw, rh, 'back.updates', n1, 10.5).html; y += 19 + n1*rh + 10;
      t += `<div class="cd-wl" style="left:${tx}pt;top:${y}pt;width:${tw}pt" data-slot="back.outside.title" data-lines="1">OUTSIDE</div>` + FXS.bullets(c2, tx, y + 19, tw, rh, 'back.outside', n2, 10.5).html;
      h += `<div class="cd-on-wb">${t}</div>`; }
    const fc = FXS.cardFor(D, footId);
    if(fc){ const top = cut(edge); h += `<div class="abs" data-rowcut="${PX},${cut(PX)},${edge},${cut(edge)},top" style="left:0;top:0;width:0;height:0">` + FXS.captioned(D, fc, PX, top, PWd, PB - top, Lc, 'back.photo1', {fs: 10.25, lh: clh, min: 3, tw: R0 - PX}).replace('data-slot="back.photo1" data-room', 'data-slot="back.photo1" data-nopair="1" data-room') + '</div>'; }
    h += FO.nearRow(D, NY, NH).html;
    h += `<div class="cd-tintbg" style="left:-9pt;top:${FO.CARD_Y - 26}pt;width:630pt;height:${801 - FO.CARD_Y + 26}pt"></div>` + FO.contact(D, X0, FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D);
    return {html: h, issues};
  };
  FO.tallStack = () => { const col = document.querySelector('[data-tallcol]'); if(!col) return; const bottom = +col.dataset.tallcol, ps = [...document.querySelectorAll('[data-para]')]; if(!ps.length) return;
    const a = ps[0], la = parseFloat(a.style.lineHeight), na = SW.lines(a).n;
    a.style.height = (na*la) + 'pt';
    const free = bottom - 8 - (parseFloat(a.style.top) + na*la); if(free < 1) return;
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
