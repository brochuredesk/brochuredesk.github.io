/* Tall Column fold-over and two-sided flyer builders (grown from the FXS-14 builders; the hand is the approved Open House library
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
    for(let fs = fs0; fs <= fs0*(el.dataset.center ? 1.45 : 1.25) + 0.01 && !best; fs += 0.25){ el.style.fontSize = fs + 'pt'; el.style.lineHeight = (fs*r) + 'pt';   // the smallest step up that fills the box
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

  // Tall Column: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Tall Column refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
      const ratios = pair ? [0.5, 0.55, 0.45, 0.6, 0.4] : [null];   // Tall Column: no frame narrower than 40% of its pair (a portrait slot past 2.5x its photo's shape)
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
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:'Tenor Sans';letter-spacing:3.4pt", HW, 24, 13, 5), lh = T.f*1.3, H = 17 + T.n*lh + 9 + 1.2, y = 30 + (270 - 30 - H)/2;
    kk.style.top = y + 'pt'; ti.style.top = (y + 17) + 'pt'; ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = (T.n*lh) + 'pt'; ti.dataset.lines = T.n; ru.style.top = (y + 17 + T.n*lh + 9) + 'pt'; };
  // after the fill: the cover write-up sits on the frame's foot; the rooms above it grow down into any room it did not use (no empty band)
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = 766 - n*lh;
    const lbls = [...document.querySelectorAll('[data-slot^="front.strip"][data-slot$=".label"]')]; if(!lbls.length) return; const lb = Math.max(...lbls.map(l => parseFloat(l.style.top) + 11)), d = top - 16 - lb; su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt'; if(d <= 0) return;
    lbls.forEach(l => { l.style.top = (parseFloat(l.style.top) + d) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- Tall Column geometry (pt, panel trim 612 x 792) ----------------
  // P26: the column runs the full height of the face (trim to trim, into the bleed); the gallery hangs its photos 10 pt in from the
  // trim with 10 pt white gutters; the words sit in the column 26 pt or more in from its edges.
  const G = 10, M = 10, X0 = 30, X1 = 582, CW = X1 - X0;
  FO.G = G; FO.M = M; FO.X0 = X0; FO.X1 = X1; FO.CW = CW;
  FO.frame = () => '';
  const ASAP = "font-family:'Asap Condensed';font-weight:700";
  FO.col = (x0, x1, y0, y1, cls) => { y0 = y0 == null ? -9 : y0; y1 = y1 == null ? 801 : y1; return `<div class="tc-col ${cls || ''}" style="left:${x0}pt;top:${y0}pt;width:${x1 - x0}pt;height:${y1 - y0}pt"></div>`; };
  FO.rule = (x, y, w, cls) => `<div class="tc-rule ${cls || ''}" style="left:${x}pt;top:${y}pt;width:${w}pt"></div>`;
  FO.eye = (t, x, y, w, slot, o) => { o = o || {}; const fs = o.fs || 11, tr = o.tr == null ? 3 : o.tr; return `<div class="tc-eye ${o.cls || ''}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${fs*1.3}pt;font-size:${fs}pt;line-height:${fs*1.3}pt;letter-spacing:${tr}pt;text-align:${o.al || 'left'}" data-slot="${slot}" data-lines="1">${esc(String(t || '').toUpperCase())}</div>`; };
  FO.tw = (t, f) => FXS.width(String(t).toUpperCase(), `${ASAP};font-size:${f}pt`);
  FO.capsFit = (t, w, max, min) => { let f = max; while(f > min && FO.tw(t, f) > w) f -= 0.5; return f; };
  // the tall capitals as one line (a status word, a street line): flush left, line box = size (no clipped letters)
  FO.tall = (t, x, y, w, f, slot, o) => { o = o || {}; return `<div class="tc-tall ${o.cls || ''}" style="left:${x - f*0.04}pt;top:${y}pt;width:${w + f*0.08}pt;height:${f}pt;font-size:${f}pt;line-height:${f}pt;text-align:${o.al || 'left'};${o.css || ''}" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`; };
  const LH = 0.97;   // the stacked lines sit this close (P26: 66 pt type on 62-64 pt steps)
  // the street as P26 stacks its event words: the number on its own line, then each word of the street on its own line, every line as
  // large as the column allows (no line larger than the number), so the stack is flush left and the right edge breathes
  FO.streetLines = a => { const w = String(a || '').trim().split(/\s+/); if(w.length <= 1) return w; const num = /^\d/.test(w[0]) ? [w[0]] : []; const rest = num.length ? w.slice(1) : w;
    const out = []; rest.forEach(x => { if(out.length && (x.length <= 2 || out[out.length - 1].length <= 2)) out[out.length - 1] += ' ' + x; else out.push(x); }); return num.concat(out); };
  FO.stack = (lines, x, y, w, max, min, slot, o) => { o = o || {}; const f0 = Math.min(max, FO.capsFit(lines[0], w, max, min)); let yy = y, h = '';
    const sizes = lines.map((t, i) => i === 0 ? f0 : Math.min(o.flat ? f0 : (o.cap || f0*1.0), FO.capsFit(t, w, max, min)));
    if(o.scale){ const tot = sizes.reduce((n, f) => n + f*LH, 0); if(tot > o.scale){ const k = o.scale/tot; sizes.forEach((f, i) => sizes[i] = Math.max(min, Math.floor(f*k*2)/2)); } }
    lines.forEach((t, i) => { const f = sizes[i]; h += FO.tall(t, x, yy, w, f, slot + (i ? i : ''), {cls: o.cls}); yy += f*LH; });
    return {html: h, h: yy - y, sizes}; };
  // a headline in the tall capitals: one size for every line (the largest that sets the words in w, at most `lines` lines and hMax
  // tall); no one-letter word ends a line (owner/LIB 15)
  FO.tallWrap = (t, w, hMax, max, min, lines) => { const words = String(t || '').replace(/\.$/, '').toUpperCase().split(/\s+/).filter(Boolean);
    const wrap = f => { const L = []; let cur = ''; words.forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FO.tw(tr, f) > w){ L.push(cur); cur = wd; } else cur = tr; }); if(cur) L.push(cur);
      for(let i = 0; i < L.length - 1; i++){ const m = / ([A-Z&])$/.exec(L[i]); if(m){ L[i] = L[i].slice(0, -2); L[i + 1] = m[1] + ' ' + L[i + 1]; } }   // a one-letter word moves down to the next line
      return L; };
    let last = null;
    for(let f = max; f >= min; f -= 0.5){ const L = wrap(f); last = {f, lines: L}; if(L.some(l => FO.tw(l, f) > w + 0.5) || L.length > lines || L.length*f*LH > hMax) continue;
      if(L.slice(0, -1).some(l => / [A-Z&]$/.test(l))) continue; return {f, lines: L}; }
    return last; };
  FO.headStack = (t, x, w, yBottom, hMax, slot, o) => { o = o || {}; const T = FO.tallWrap(t, w, hMax, o.max || 64, o.min || 26, o.lines || 6), H = T.lines.length*T.f*LH; let h = '', y = yBottom - H;
    T.lines.forEach((l, i) => { h += `<div class="tc-tall" style="left:${x - T.f*0.04}pt;top:${y + i*T.f*LH}pt;width:${w + T.f*0.08}pt;height:${T.f}pt;font-size:${T.f}pt;line-height:${T.f}pt" data-slot="${slot}${i ? '.' + i : ''}" data-lines="1" data-fine="1">${esc(l)}</div>`; });
    return {html: h, top: y, f: T.f, n: T.lines.length}; };
  // facts on the flyer's icon discs (bed, bath, square feet, year built)
  const ICON = {
    bed: '<svg viewBox="0 0 24 24"><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/></svg>',
    bath: '<svg viewBox="0 0 24 24"><path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 12V5a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/></svg>',
    area: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 9h5M15 4v5M9 20v-5M20 15h-5"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>'};
  FO.icon = (n, s) => ICON[n].replace('<svg', `<svg style="width:${s}pt;height:${s}pt;stroke:currentColor;fill:none;stroke-width:1.6;display:block"`);
  FO.factCells = (L, o) => { o = o || {}; const n = v => Number(v).toLocaleString('en-US'), f = [];
    if(L.beds) f.push(['bed', `${L.beds} ${L.beds == 1 ? 'Bedroom' : 'Bedrooms'}`]);
    if(L.baths) f.push(['bath', window.BD && BD.bathsText ? BD.bathsText(L).main : `${L.baths} Full Baths`]);
    if(L.sqft) f.push(['area', `${n(L.sqft)} Square feet`]);
    const yr = L.yearBuilt || L.year; if(yr && !o.noYear) f.push(['cal', `Built in ${yr}`]);
    return f; };
  FO.facts = (D, x, y, w, o) => { o = o || {}; const d = o.d || 26, rh = o.rh || 31, fs = o.fs || 10.5, cells = FO.factCells(D.listing || {}, o), slot = o.slot || 'front.fact';
    const tr0 = o.tr == null ? 1.2 : o.tr, fsr = t => Math.min(fs, FXS.fitSize(String(t).toUpperCase(), `font-family:Barlow;font-weight:600;letter-spacing:${tr0}pt`, w - d - 14, fs, 8.6));
    const h = cells.map(([ic, t], i) => `<div class="tc-fact ${o.cls || ''}" style="left:${x}pt;top:${y + i*rh}pt;width:${w}pt;height:${d}pt"><div class="ic" style="width:${d}pt;height:${d}pt">${FO.icon(ic, d*0.56)}</div><span style="font-size:${fsr(t)}pt;line-height:${fs*1.3}pt;letter-spacing:${o.tr == null ? 1.2 : o.tr}pt" data-slot="${slot}.${i}" data-lines="1">${esc(t)}</span></div>`).join('');
    return {html: h, h: cells.length ? (cells.length - 1)*rh + d : 0, n: cells.length}; };
  FO.tileC = (D, id, x, y, w, h, slot) => FXS.box(D, id, x, y, w, h, slot);
  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  // the standard contact card on the plinth (the solid main base): white type, the knockout logo, the one logo of the outside spread
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = TC.logoOnMain(D);
    const pw = 190, lh = Math.min(42, H - 22), s = {name: 19, nameFloor: 15, hsW: Math.round(H*0.78), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 24, lh], square: [H - 26, H - 26], tall: [H - 24, H - 24]}};
    return `<div class="tc-plcard" style="--cc-display:'Asap Condensed';--cc-body:Barlow;--cc-paper:transparent;--cc-ink:var(--tc-on-main);--cc-muted:var(--tc-on-main);--cc-accent:var(--tc-on-main);--cc-line:rgba(255,255,255,.55)">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true}) + '</div>'; };
  FO.CARD_H = 62; FO.PLINTH = 668;   // the plinth's top (fold-over and flyer backs); the half-height card centered in it with the fine print
  FO.plinth = (D, o) => { o = o || {}; const y = o.y || FO.PLINTH, blk = FO.CARD_H + 9 + 8, top = y + (782 - y - blk)/2;
    return `<div class="tc-plinth" style="left:-9pt;top:${y}pt;width:630pt;height:${801 - y}pt"></div>` + FO.contact(D, X0, top, CW, FO.CARD_H) + FO.fine(D, top + FO.CARD_H + 9); };
  FO.fine = (D, y) => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:8pt;text-align:center;color:var(--tc-on-main);opacity:.85" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };

  FO.heroId = (D, id) => { const ph = D.photos || {}, sp = SW.space(D, id); if((ph[id] || {}).dusk) return id; const d = Object.keys(ph).find(k => ph[k].dusk && ph[k].fullHouse && SW.space(D, k) === sp); return d || id; };
  FO.isDusk = (D, id) => !!((D.photos || {})[id] || {}).dusk;
  // a hero whose photo leans (an obstruction on one side, photos.<id>.lean: the 3-story's tree) hangs narrower, cropped away from the
  // obstruction with the whole house kept; one room fills the rest of the row beside it
  FO.hang = (D, hero, x, y, w, h, side, slot) => { const p = (D.photos || {})[hero] || {};
    if(true || !p.lean || !side || !side.length) return {html: FXS.box(D, hero, x, y, w, h, slot || 'front.house'), used: 0};
    const w1 = Math.round(Math.min(w*0.64, h*1.02)), sw = w - w1 - G;
    return {html: FXS.box(D, hero, x, y, w1, h, slot || 'front.house') + FXS.box(D, side[0], x + w1 + G, y, sw, h, (slot || 'front.house').replace(/\.\w+$/, '') + '.side0'), used: 1}; };
  // the hero frame's height: as tall as `max` while the whole house fits the frame
  FO.heroH = (D, id, w, max, min) => { let hh = max; while(hh > min && !SW.fits(D, id, w, hh)) hh -= 4; return hh; };

  // ---------------- FRONT (fold-over cover: no agent, no brokerage) ----------------
  // The Open House flyer's own order, grown to a cover: THE COLUMN on the left, the full height of the page (on the outside spread it
  // meets the back's column at the fold), holding the neighborhood, the street stacked in the tall capitals (the number large, each word
  // of the street on its own line), P26's 2 pt rule, the city, the facts on their icon discs and the cover's write-up; at right the
  // vertical gallery, square-cut 10 pt in from the trim: the whole house, then two rooms.
  FO.COVER_COL = 226;
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {};
    const hood = FXS.hood(L), city = FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, ''), hero = FO.heroId(D, F.hero || K.hero || 'front');
    const CR = FO.COVER_COL, tx = 36, tw = CR - tx - 20, gx = CR + G, gw = 612 - M - gx;
    let h = FO.col(-9, CR);
    // the gallery: the house, then the rooms, one column of photos from the top to the foot
    const rooms = (o.strip || P.strip || []).filter(id => id !== hero).slice(0, 3), lean = !!((D.photos || {})[hero] || {}).lean;
    const hh = FO.heroH(D, hero, gw, Math.round(gw/1.42), 200), n = Math.max(1, Math.min(lean ? 3 : 2, rooms.length)), hg = FO.hang(D, hero, gx, M, gw, hh, lean ? rooms.slice(0, 1) : null);
    h += hg.html; const rest = rooms.slice(hg.used, hg.used + 2), ry0 = M + hh + G, rh = (792 - M - ry0 - (rest.length - 1)*G)/Math.max(1, rest.length);
    rest.forEach((id, i) => { h += FXS.box(D, id, gx, ry0 + i*(rh + G), gw, rh, 'front.strip' + i); });
    // the column's words, from the top: the neighborhood, the street stack, the rule, the city, the facts; the write-up fills the foot
    let y = 40, g = '';
    const grp = (k, html) => `<div class="tc-cg" data-cg="front" data-gi="${k}">${html}</div>`;
    if(hood){ g += FO.eye(hood, tx, y, tw, 'front.place', {fs: 11, tr: 3}); y += 24; }
    const st = FO.stack(FO.streetLines(L.address), tx, y, tw, 120, 30, 'address', {scale: 330}); g += st.html; y += st.h + 12;
    g += FO.rule(tx, y, tw); y += 14;
    g += `<div class="tc-place" style="left:${tx}pt;top:${y}pt;width:${tw}pt" data-slot="front.city" data-lines="1">${esc(city.toUpperCase())}</div>`; y += 30; h += grp(0, g);
    const fc = FO.facts(D, tx, y, tw, {d: 40, rh: 54, fs: 13.5}); h += grp(1, fc.html); y += fc.h + 24;
    const intro = [].concat(F.intro || [], K.summary || []).filter((x, i, a) => a.findIndex(y => JSON.stringify(y) === JSON.stringify(x)) === i), lh = 19.5, room = 766 - y, nl = Math.max(3, Math.floor(room/lh));
    if(intro.length && room >= 3*lh) h += grp(2, FO.flex(FO.wu(intro, tx, y, tw, nl*lh, 'front.summary', 14, lh, 'wu')).replace('data-slot="front.summary"', `data-slot="front.summary" data-rag="1" data-cgend="766"`));
    return h;
  };

  // ---------------- FLYER FRONT (two-sided flyer; no agent, no brokerage): its own composition in the same hand ----------------
  // The house leads across the whole top, laid over THE COLUMN, which runs on down the left side of the page: under the house the column
  // holds the street stacked in the tall capitals, the rule, the place, the facts on their discs; the gallery beside it hangs two rooms.
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {};
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), hood = FXS.hood(L), city = FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, '');
    const CR = 262, tx = 30, tw = CR - tx - 22, lean = !!((D.photos || {})[hero] || {}).lean;
    const strip = (o.strip || P.flyerStrip || P.strip || []).filter(id => id !== hero).slice(0, 3);
    let h = FO.col(-9, CR);
    const hw = 612 - 2*M, hh = FO.heroH(D, hero, hw, 340, 240), hg = FO.hang(D, hero, M, M, hw, hh, lean ? strip.slice(0, 1) : null);
    h += hg.html;
    const y0 = M + hh + G, gx = CR + G, gw = 612 - M - gx, rest = strip.slice(hg.used, hg.used + 2), rh = (792 - M - y0 - (rest.length - 1)*G)/Math.max(1, rest.length);
    rest.forEach((id, i) => { h += FXS.box(D, id, gx, y0 + i*(rh + G), gw, rh, 'front.strip' + i); });
    let y = y0 + 22;
    const place = [hood, city].filter(Boolean).join('  ·  ');
    const lines = FO.streetLines(L.address), fcH = FO.factCells(L).length*31 - 5, room = 770 - y - 26 - 14 - 16 - 22 - fcH;
    h += FO.eye(hood || city, tx, y, tw, 'front.place', {fs: 10.5, tr: 2.6}); y += 26;
    const st = FO.stack(lines, tx, y, tw, 92, 28, 'address', {scale: room}); h += st.html; y += st.h + 10;
    h += FO.rule(tx, y, tw); y += 14;
    if(hood) h += `<div class="tc-place" style="left:${tx}pt;top:${y}pt;width:${tw}pt;font-size:11pt" data-slot="front.city" data-lines="1">${esc(city.toUpperCase())}</div>`;
    y += hood ? 26 : 0;
    const free = 770 - y - fcH, fc = FO.facts(D, tx, y + Math.max(0, free/2), tw, {d: 26, rh: 31, fs: 10.5}); h += fc.html;
    return h;
  };
  // Design pass 11/15: hero crops go tighter on the subject house, never under 300 ppi (photos.<id>.w/h are the photo's own pixels)
  FO.tighten = (D, m) => { m = m == null ? 0.05 : m; document.querySelectorAll('.ph[data-photo]').forEach(el => { if(!/^front\.(house|hero)$/.test(el.dataset.slotPhoto || '')) return; const p = (D.photos || {})[el.dataset.photo], img = el.querySelector('img'); if(!p || !p.box || !img || !p.w || !p.h) return;
    const W = p.w, H = p.h, tw = el.clientWidth, th = el.clientHeight, ia = W/H, ta = tw/th, vis = ia > ta ? {w: ta/ia, h: 1} : {w: 1, h: ia/ta};
    const ppi1 = W*vis.w/(tw/96), zmax = ppi1/300;
    const [x0, y0, x1, y1] = p.box, z = Math.min(1.5, zmax, vis.w/((x1 - x0) + 2*m), vis.h/((y1 - y0) + 2*m)); if(!(z > 1.03)) return;
    const op = (img.style.objectPosition || '50% 50%').split(' ').map(v => parseFloat(v)/100), px = isNaN(op[0]) ? .5 : op[0], py = isNaN(op[1]) ? .5 : op[1];
    const place = (c, v, p0) => { const lo = (1 - v)*p0, start = Math.min(Math.max(c - v/(2*z), lo), lo + v - v/z); return (start - lo)/v; };
    const sx = place((x0 + x1)/2, vis.w, px), sy = place((y0 + y1)/2, vis.h, py);
    img.style.cssText = `position:absolute;max-width:none;width:${z*100}%;height:${z*100}%;left:${-sx*z*100}%;top:${-sy*z*100}%;object-fit:cover;object-position:${px*100}% ${py*100}%`; }); };

  // ---------------- labeled-items card (the kitchen / "What's new" card) ----------------
  // Each row is its label over N full lines (every line 80%+ of the measure, the last 90%+, house fill rules); the wording, the type size
  // and the measure are chosen so every kept row fills; all rows take the same line count (3, else 2).
  FO.wrapW = (t, css, V) => { const out = []; let cur = ''; String(t).split(' ').forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > V - 0.5){ out.push(FXS.width(cur, css)); cur = wd; } else cur = tr; }); if(cur) out.push(FXS.width(cur, css)); return out; };
  FO.tableRowsN = (items0, taken, o) => { o = o || {}; const ok = a => !taken || !taken(a); let best = null;
    for(const NL of (o.lines || [3, 2])) for(let f = (o.fmin || 10); f <= (o.fmax || 11.5) + 0.01; f += 0.25) for(const V of (o.Vs || [150, 156, 162])){ const css = `font-family:Barlow;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== NL || Lw.slice(0, -1).some(q => q < 0.8*V) || Lw[Lw.length - 1] < 0.9*V) return; const sc = Lw.reduce((n, q) => n + q, 0)/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 5), score = Math.min(n, 4)*100 + n*10 + NL*30 + f*6 + V*0.04;
      if(!best || score > best.score) best = {score, f, V, NL, LW: 0, rows: rows.slice(0, o.maxRows || 5)}; }
    return best; };
  // the card: P26's event box (white, the 1.2 pt main line), its kicker and heading, the rows spread evenly between hairlines
  FO.tableCard = (T, kicker, heading, x, y, w, hgt, slot) => { const n = Math.max(1, T.rows.length), lx = x + (w - T.V)/2, liw = T.V, lh = +(T.f*1.42).toFixed(2), blk0 = 12 + 3 + T.NL*lh;
    // the heading takes the room the rows do not need (up to three lines of the tall capitals), so the rows keep a close, even rhythm
    const spare = hgt - 38 - 18 - 22 - n*blk0 - (n - 1)*30, HT = heading ? FO.tallWrap(String(heading), liw, Math.max(15, Math.min(96, spare)), 26, 13, 3) : null, hs = HT ? HT.f : 0, hl = HT ? HT.lines : [], top = heading ? 38 + hl.length*hs*LH + 18 : 44;
    let b = `<div class="tc-box" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 20}pt;width:${liw}pt;color:var(--tc-main-ink)" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    hl.forEach((l, i) => { b += `<div class="abs tc-tall" style="left:${lx}pt;top:${y + 38 + i*hs*LH}pt;width:${liw}pt;height:${hs}pt;font-size:${hs}pt;line-height:${hs}pt" data-slot="${slot}.box.heading${i ? '.' + i : ''}" data-lines="1">${esc(l)}</div>`; });
    const blk = 12 + 3 + T.NL*lh, gapR = n > 1 ? (hgt - top - 22 - n*blk)/(n - 1) : 0;
    T.rows.forEach((r, i) => { const c0 = y + top + i*(blk + gapR);
      if(i) b += `<div class="abs hr" style="left:${lx}pt;top:${c0 - gapR/2 - .5}pt;width:${liw}pt;background:var(--tc-line)"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${c0}pt;width:${liw}pt" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx}pt;top:${c0 + 15}pt;width:${liw + 1}pt;height:${T.NL*lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--tc-font);color:var(--tc-text);overflow:hidden;text-align:justify;text-align-last:left" data-slot="${slot}.list.t${i}" data-lines="${T.NL}">${esc(r.t)}</div>`; });
    return `<div class="tc-lt">${b}</div>`; };

  // ---------------- INSIDE SPREAD: two columns frame the spread ----------------
  // THE COLUMN stands at the outer edge of each inside page (left page: its left edge; right page: its right edge), so the open spread
  // reads as one room between two columns. Each column carries its page's kicker and headline in the tall capitals, bottom-aligned on
  // P26's 2 pt rule at one horizon (the same height on both pages); the photos hang in the gallery toward the fold, held 10 pt off it:
  // a captioned pair at the top, the page's lead photo large at the foot (the kitchen on the left, the lead bedroom on the right), so
  // the two lead photos and their captions sit level across the fold.
  FO.HORIZON = 300; FO.IN_COL = 246;
  FO.split2 = (D, cs, W) => { if(cs.length !== 2) return [W]; return [(W - G)/2, (W - G)/2]; };
  const inHead = (kicker, title, slot, x, w) => { const RY = FO.HORIZON, kH = kicker ? 24 : 0, T = FO.tallWrap(title, w, RY - 16 - 46 - kH, 62, 28, 6), H = kH + T.lines.length*T.f*LH, off = Math.max(0, (RY - 16 - 30 - H)/2);   // the block centered between the top margin and the rule
    const hd = FO.headStack(title, x, w, RY - 16 - off, RY - 16 - 46 - kH, slot + '.title', {max: T.f, min: T.f, lines: 6});
    let h = hd.html; if(kicker) h += FO.eye(kicker, x, hd.top - kH, w, slot + '.kicker', {fs: 10.5, tr: 2.8});
    h += FO.rule(x, RY, w); return h; };
  // the gallery of an inside page: a pair of captioned photos at the top, the lead photo large under them; text keeps 36 pt off the fold
  const inGallery = (D, lead, pair, gx, gw, fold, slot, labelOnly) => { let h = ''; const PL = 3, PLH = 13.5, pw = pair.length > 1 ? (gw - G)/2 : gw, LL = 3, LLH = 14.5, capT = 25;
    const leadH = 428, ly = 792 - M - (capT + LL*LLH) - leadH, ph = ly - 12 - (capT + PL*PLH) - M;
    const tx = (x, w) => fold === 'r' ? [x, Math.min(x + w, 612 - 36) - x] : [Math.max(x, 36), x + w - Math.max(x, 36)];
    pair.forEach((c, i) => { const x = gx + i*(pw + G), [cx, cw] = tx(x, pw); h += FXS.captioned(D, c, x, M, pw, ph, PL, `${slot}.photo${i + 1}`, {fs: 9.6, lh: PLH, min: 3, tx: cx, tw: cw}); });
    if(lead && labelOnly){ const [cx, cw] = tx(gx, gw), L0 = FXS.leadLabel(lead.lead), H2 = 792 - M - 18 - ly;   // the kitchen beside its card: the card says what the kitchen has, so the photo carries only its name (and the plan's size)
      h += FXS.box(D, lead.photo, gx, ly, gw, H2, `${slot}.wide`) + `<div class="abs" style="left:${cx}pt;top:${ly + H2 + 5}pt;width:${cw}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.wide.label" data-lines="1">${esc(L0.name.toUpperCase())}</div>${L0.size ? `<div class="lbl sz" data-size="1">${esc(L0.size)}</div>` : ''}</div>`; }
    else if(lead){ const [cx, cw] = tx(gx, gw); h += FXS.captioned(D, lead, gx, ly, gw, leadH, LL, `${slot}.photo0`, {fs: 10.5, lh: LLH, min: 3, tx: cx, tw: cw}); }
    return h; };
  // INSIDE LEFT (the living level): the column at the left edge, the kitchen's card in it beside the kitchen, large at the gallery's foot
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, ids = P.left || [], heroC = FXS.cardFor(D, ids[0]), rowC = FO.cards(D, ids.slice(1, 3));
    const CR = FO.IN_COL, tx = 28, tw = CR - tx - 18; let h = FO.col(-9, CR) + inHead(I.kicker, I.title, 'left', tx, tw);
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    // night-fade fix: a row is dropped only for a fact the back's lists really print; a two-word list item repeats only when both its
    // words are in the row; a row never opens on a pronoun
    const taken = a => SW.grams4(a).some(g => backG.has(g)) || backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w)))) || /^(It|Its|They|This|That)\b/.test(a);
    const cx = 16, cw = CR - cx - 12, T = FO.tableRowsN((box.items || []).slice(0, 10), taken, {maxRows: 4, lines: [3, 2], fmin: 9.5, fmax: 13, Vs: [108, 114, 120, 126, 132, 138, 144, 150, 156, 162, 168, 174].filter(v => v <= cw - 28)});
    const cy = FO.HORIZON + 18; h += FO.tableCard(T, box.kicker || 'The kitchen', box.heading, cx, cy, cw, 776 - cy, 'left');
    const usedL = new Set(T.rows.map(r => r.l)), spare = (box.items || []).filter(it => !usedL.has(it.l)).flatMap(it => (it.s || []).map(x => [].concat(x).filter(a => !taken(a))).filter(a => a.length));
    const heroK = heroC ? Object.assign({}, heroC, {s: [].concat(heroC.s || [], spare)}) : heroC;
    h += inGallery(D, heroK, rowC, CR + G, 612 - 36 - CR - G, 'r', 'left', true);   // the gallery stops 0.5 in short of the fold, so captions run the photos' full width
    return h;
  };
  // INSIDE RIGHT (bedrooms and baths): the column at the right edge; the page's intro in it under the headline, the bath small at its foot
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs = FO.cards(D, P.right || []);
    const CL = 612 - FO.IN_COL, tx = CL + 18, tw = 612 - 28 - tx; let h = FO.col(CL, 621) + inHead(R.kicker || '', R.title || '', 'right', tx, tw);
    const lead = cs[0], pair = cs.length === 3 ? cs.slice(1, 2) : cs.slice(1, 3), small = cs.length === 3 ? cs[2] : cs[3];
    h += inGallery(D, lead, pair, 36, CL - G - 36, 'l', 'right', true);
    // the lead bedroom's own write-up stands in the column beside it, level with the photo's top; the bath hangs small at the column's foot
    const ly = 792 - M - (25 + 3*14.5) - 428, y0 = Math.max(FO.HORIZON + 24, ly), sh = 170, LL = 3, LLH = 13, sy = 776 - (25 + LL*LLH) - sh;
    if(small) h += FXS.captioned(D, small, tx - 1, sy, tw + 2, sh, LL, 'right.photo3', {fs: 9.6, lh: LLH, min: 3});
    if(lead){ const c0 = FXS.augment(D, lead), RL = ((D.companion || {}).roomLines || {})[lead.photo] || {}, extra = (RL.all || []).filter(t => !/^(It|Its|Fresh paint)\b/.test(t) && /\b(is|are|was|has|have|runs?|fits?|opens?|hangs?|lines?|fills?|covers?|frames?|faces?|looks?|keeps?|rises?|steps?|tops?|brings?|leads?|takes?)\b/i.test(t) && !(c0.s || []).some(x => [].concat(x).some(a => SW.sameFact(a, t)))), c = Object.assign({}, c0, {s: [].concat(c0.s || [], extra)}), lh = 17.5, room = (small ? sy - 20 : 766) - y0, n = Math.max(3, Math.floor(room/lh));
      h += FO.flex(`<div class="abs wu" data-slot="right.lead" data-lines="${n}" data-try="${Array.from({length: n - 2}, (_, i) => n - i).join(',')}" data-lh="${lh}" ${FXS.sd(c.s)} style="left:${tx}pt;top:${y0}pt;width:${tw}pt;height:${n*lh}pt;font-size:12.5pt;line-height:${lh}pt"></div>`).replace('data-slot="right.lead"', 'data-slot="right.lead" data-rag="1" data-room="' + esc(FXS.leadLabel(lead.lead).name) + '"'); }
    return h;
  };
  FO.flex = s => s.replace('data-slot=', 'data-narrow="0" data-fill="0.9" data-lfill="0.8" data-slot=');
  // after the fill: the column's photo grows up (to 240 pt) into the room the lead's write-up did not use; what is left is shared above and below the write-up
  FO.rightCol = () => { const it = document.querySelector('[data-slot="right.lead"]'), ph = document.querySelector('.ph[data-slot-photo="right.photo3"]'); if(!it) return;
    const lh = parseFloat(it.style.lineHeight), n = SW.lines(it).n; it.style.height = (n*lh) + 'pt'; const top = parseFloat(it.style.top), end = ph ? parseFloat(ph.parentElement.style.top) - 20 : 766, free = end - (top + n*lh); if(free < 1) return;
    let rest = free; if(ph){ const pb = ph.parentElement, g = Math.min(free, 240 - parseFloat(pb.style.height)); if(g > 0){ pb.style.top = (parseFloat(pb.style.top) - g) + 'pt'; pb.style.height = (parseFloat(pb.style.height) + g) + 'pt'; rest -= g; } }
    if(rest > 1) it.style.top = (top + rest/2) + 'pt'; };
  // after the fill: a room's size tag that no longer fits beside its name (a pair re-shared its width) is left off
  FO.szFit = () => document.querySelectorAll('.lbl.sz').forEach(z => { const p = z.parentElement, lb = p.querySelector('.lbl:not(.sz)'); if(!lb) return; const r = p.getBoundingClientRect(), a = lb.getBoundingClientRect(), b = z.getBoundingClientRect(); if(b.right > r.right + 0.5 || b.left < a.right + 4) z.remove(); });
  // the plinth card's divider lines: reversed on the main color, so 1.4 pt (press rule: reversed hairlines 1 pt or more)
  FO.cardLines = () => document.querySelectorAll('.tc-plcard, .tc-plcard *').forEach(e => { const cs = getComputedStyle(e); ['Left', 'Top', 'Right', 'Bottom'].forEach(sd => { if(cs['border' + sd + 'Style'] !== 'none' && parseFloat(cs['border' + sd + 'Width']) > 0 && parseFloat(cs['border' + sd + 'Width']) < 1.8) e.style['border' + sd + 'Width'] = '1.6pt'; }); });
  FO.rightFit = () => {}; FO.leftHead = () => {};
  // after the fill: a column's groups (data-cg) spread top to bottom: the first keeps its top, the last write-up ends on its foot
  // (data-cgend), the groups between sit at equal gaps, so the column has no empty band at one end (owner 11/16: centered in its space)
  FO.colJustify = () => { const cols = new Map(); document.querySelectorAll('.tc-cg[data-cg]').forEach(g => { (cols.get(g.dataset.cg) || cols.set(g.dataset.cg, []).get(g.dataset.cg)).push(g); });
    cols.forEach(gs => { gs.sort((a, b) => a.dataset.gi - b.dataset.gi); const face = gs[0].closest('.panel, .sheet'); if(!face) return; const F = face.getBoundingClientRect();
      const box = g => { const rs = [...g.querySelectorAll('*')].filter(e => e.children.length === 0 || e.dataset.slot).map(e => e.getBoundingClientRect()).filter(r => r.height > 0); return [Math.min(...rs.map(r => r.top)), Math.max(...rs.map(r => r.bottom))].map(v => (v - F.top)*0.75); };
      const last = gs[gs.length - 1], wu = last.querySelector('[data-cgend]');
      if(wu){ const n = SW.lines(wu).n, lh = parseFloat(wu.style.lineHeight); wu.style.height = (n*lh) + 'pt'; wu.style.top = (+wu.dataset.cgend - n*lh) + 'pt'; }
      const B = gs.map(box), first = B[0][0], end = B[B.length - 1][1], sum = B.reduce((t, b) => t + b[1] - b[0], 0), gap = (end - first - sum)/(gs.length - 1); if(!(gap > 0)) return;
      let y = first; gs.forEach((g, i) => { const d = y - B[i][0]; if(Math.abs(d) > .1) [...g.children].forEach(e => { if(e.style.top) e.style.top = (parseFloat(e.style.top) + d) + 'pt'; }); y += B[i][1] - B[i][0] + gap; }); }); };

  // ---------------- BACK (fold-over) and flyer back ----------------
  // the plan in its box (the paper's own white; the plan prints clear, dark lines, PlanInk): as wide as the drawing needs and no wider
  FO.planBox = (D, x, y, maxH, maxW) => { const A = D.plan.turn && D.plan.kind === 'color' ? 270 : undefined, rot = !!D.plan.turn, noteW = Math.ceil(FXS.width((D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate.', 'font-family:Barlow;font-size:8pt')) + 34;
    const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: rot ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: rot, angle: A}); let cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 40, D.plan.minCard || 0, noteW, 188));
    for(let hh = maxH; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: cw - 28.8, h: hh}, {allowRotate: rot, angle: A}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')){ if(big.usedW) cw = Math.min(cw, Math.max(Math.ceil(big.usedW) + 40, D.plan.minCard || 0, noteW, 188)); break; } }
    return FXS.planCard(D, x, y, cw, maxH); };
  // the column's lists: each item on a small main disc, one line each
  const colList = (title, items, x, y, w, slot, max, fs, rh) => { const b = FXS.bullets(items, x, y + 20, w, rh, slot, max, fs); return {html: FO.eye(title, x, y, w, slot + '.title', {fs: 9.5, tr: 2.6, cls: 'main'}) + b.html, h: 20 + b.n*rh, n: b.n}; };
  // Nearby in the column: each distance in the tall capitals over its place in tracked caps
  const colNear = (D, x, y, w, cell) => { const N = (((D.sw || {}).back || {}).nearby || []).slice(0, 3); let h = FO.eye('Nearby', x, y, w, 'back.near.kicker', {fs: 9.5, tr: 2.6, cls: 'main'}), yy = y + 22;
    N.forEach((p, i) => { const ds = Math.min(30, FO.capsFit(p.dist, w, 30, 18)), pl = String(p.place).toUpperCase(), ps = Math.max(8.6, FXS.fitSize(pl, "font-family:Barlow;font-weight:600;letter-spacing:1.4pt", w, 10, 8.6));
      h += `<div class="fo-near-d" style="left:${x - ds*0.04}pt;top:${yy}pt;width:${w}pt;height:${ds}pt;font-size:${ds}pt" data-slot="back.near${i}" data-lines="1" data-fine="1">${esc(String(p.dist).toUpperCase())}</div>`;
      h += `<div class="fo-near-p" style="left:${x}pt;top:${yy + ds + 3}pt;width:${w}pt;height:${ps*1.3}pt;font-size:${ps}pt;line-height:${ps*1.3}pt" data-slot="back.near${i}.p" data-lines="1" data-fine="1">${esc(pl)}</div>`; yy += cell; });
    return {html: h, h: 22 + N.length*cell}; };
  // Tall Column back (fold-over and flyer): THE COLUMN beside the gallery (fold-over: at the fold edge, where it meets the cover's column
  // across the spine; flyer: at the left edge, as on the Open House flyer) holding the kicker, the headline in the tall capitals, the rule,
  // Nearby and the two lists; the gallery holds the listing's plan in a box its own shape (or the big outdoor photo) with the floors'
  // write-up under it and a captioned pair; the plinth (the solid main base) carries the half-height card and the fine print.
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [];
    const right = !flyer, CW0 = 236, CL = right ? 612 - CW0 : -9, CRr = right ? 621 : CW0, tx = right ? CL + 20 : 30, tw = right ? 612 - 38 - tx : CW0 - 20 - tx;
    const gx = right ? M : CW0 + G, gx1 = right ? CL - G : 612 - M, gw = gx1 - gx, PT = FO.PLINTH;
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    const rowIds = flyer ? (P.flyerBack || []).slice(0, 2) : (P.backRow || ['bath2']).slice(0, 2), rowCards = FO.cards(D, rowIds);
    let h = FO.col(CL, CRr, -9, PT) + FO.plinth(D);
    // the column: kicker, headline, rule; Nearby; the two lists, spread evenly down to the plinth
    const kickT = +(D.listing || {}).stories > 1 ? 'Floor by floor' : 'Room by room', ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, '');
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 5), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 5), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    // the column's four groups (head on its rule, Nearby, the two lists) at equal gaps, the top and foot margins the same (centered)
    const fs = 10, rh = 19, l1 = colList(t1, c1, tx, 0, tw, 'back.updates', 5, fs, rh), l2 = colList('Outside', c2, tx, 0, tw, 'back.outside', 5, fs, rh), cell = 50;
    const nearH = 22 + Math.min(3, ((KB.nearby) || []).length)*cell, T0 = FO.tallWrap(ht || kickT, tw, 200, 54, 24, 5), headH = 24 + T0.lines.length*T0.f*LH + 14 + 2;
    const gap = Math.max(14, (PT - headH - nearH - l1.h - l2.h)/5); let y = gap;
    const hd = FO.headStack(ht || kickT, tx, tw, y + headH - 16, 200, 'back.about.head', {max: T0.f, min: T0.f, lines: 5});
    h += FO.eye(kickT, tx, hd.top - 24, tw, 'back.about.title', {fs: 10.5, tr: 2.8}) + hd.html + FO.rule(tx, y + headH - 2, tw); y += headH + gap;
    const nr = colNear(D, tx, y, tw, cell); h += nr.html; y += nr.h + gap;
    h += colList(t1, c1, tx, y, tw, 'back.updates', 5, fs, rh).html; y += l1.h + gap;
    h += colList('Outside', c2, tx, y, tw, 'back.outside', 5, fs, rh).html;
    // the gallery: the plan (or the big outdoor photo), the write-up, a captioned pair
    const tx0 = right ? Math.max(gx, 28) : gx, tw0 = right ? gx1 - tx0 : Math.min(gx1, 612 - 28) - gx;
    const PLL = 3, PLH = 13.5, capH = 25 + PLL*PLH, rc = rowCards.slice(0, 2), pw = rc.length > 1 ? (gw - G)/2 : gw, rowPH = 150, rowY = PT - 14 - capH - rowPH;
    let top;
    if(hasPlan){ const LV = D.plan.levels || [], tall = LV.length >= 4 || (LV.length === 1 && LV[0].h/LV[0].w > 1.5), TH = tall ? rowY - 18 - M - 8 - 36 : 300;
      let pc = FO.planBox(D, gx, M + 8, TH, gw); if(tall && Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])) >= gw - 150) pc = FO.planBox(D, gx, M + 8, rowY - 18 - M - 8 - 36 - 4*15.5 - 16, gw); const bw = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])), narrow = bw < gw - 150, dx = narrow ? 0 : (gw - bw)/2; window.__planW = bw;
      h += dx > 1 ? pc.html.replace(/left:([\d.]+)pt/g, (m0, v) => `left:${(+v + dx).toFixed(2)}pt`) : pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom + 16; if(narrow) top = Math.max(top, rowY - 2); }
    else { const c = FXS.cardFor(D, topId), ph0 = 230; h += FXS.captioned(D, c, gx, M, gw, ph0, 3, 'back.top', {fs: 10.5, lh: 14, min: 3, tx: tx0, tw: tw0}); top = M + ph0 + 25 + 3*14 + 16; }
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds)), stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    let wy = top, wroom = rowY - 18 - wy, lh = 15.5, wx = tx0, ww = tw0;
    if(hasPlan && window.__planW && window.__planW < gw - 150){ wx = gx + window.__planW + 16; ww = (right ? gx1 : Math.min(gx1, 612 - 28)) - wx; wy = M + 8; wroom = top - 16 - wy; }
    if(wroom >= 3*lh){ const n = Math.floor(wroom/lh); h += FO.full(FO.wu(keep(f2.concat(f1)), wx, wy, ww, n*lh + 0.01, 'back.about', 11, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-center="1" data-span="${wroom.toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`); }
    else issues.push({slot: 'back.about', kind: 'back-writeup-no-room', detail: `${Math.round(wroom)} pt between the plan and the photos`});
    rc.forEach((c, i) => { const x = gx + i*(pw + G), cx = right ? Math.max(x, 28) : x, cw = right ? x + pw - cx : Math.min(x + pw, 612 - 28) - x; h += FXS.captioned(D, c, x, rowY, pw, rowPH, PLL, 'back.photo' + i, {fs: 9.8, lh: PLH, min: 3, tx: cx, tw: cw}); });
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
  FO.span = () => document.querySelectorAll('[data-span]').forEach(el => { const T = +el.dataset.lines, lh = Math.min(+el.dataset.span/T, parseFloat(getComputedStyle(el).fontSize)*0.75*1.75); el.style.lineHeight = lh + 'pt'; el.style.height = (T*lh) + 'pt'; el.style.top = (parseFloat(el.style.top) + (+el.dataset.span - T*lh)*(el.dataset.center ? 0.5 : 1)) + 'pt'; });   // data-center: a write-up beside the plan sits centered on it (owner 11/16)
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
