/* Arc fold-over and two-sided flyer builders (engine from the Chevron set; every page layout here is Arc's own) (grown from the FXS-14 builders; the hand is the approved Open House library
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
  FO.frontSnug = () => {};   // Arc: the flyer front's write-up stays centered in its own room beside the overlapping print (no cover write-up)
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
    const ry = y + 17 + ts*1.3 + 7; h += `<div class="ar-rule" style="left:${306 - 40}pt;top:${ry}pt;width:80pt"></div>`;
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
  FO.lift = (x, y, w, h) => `<div class="ar-lift" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h || 22}pt"></div>`;
  // the standard contact card as B01's footer: agent on the left, the brokerage panel on the right with the one logo, knockout on the dark
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = AR.logoSrc(D); const ko = !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 180, lh = Math.min(46, H - 30), s = {name: 16.5, nameFloor: 13, line: 8.6, rowGap: 10, phone: 12, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div class="ar-ccw" style="--cc-display:Jost;--cc-body:Jost">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };

  // ---------------- FRONT (fold-over cover and flyer front: no agent, no brokerage) ----------------
  FO.heroId = (D, id) => { const ph = D.photos || {}, sp = SW.space(D, id); if((ph[id] || {}).dusk) return id; const d = Object.keys(ph).find(k => ph[k].dusk && ph[k].fullHouse && SW.space(D, k) === sp); return d || id; };
  FO.isDusk = (D, id) => !!((D.photos || {})[id] || {}).dusk;
  const RHD = 'font-family:Jost';
  // a fact said as the P13 flyer says it: "2 bedrooms", "2 full baths", "1,635 square feet", "Built in 2005"
  FO.factText = t => /^Built/.test(t) ? t : String(t).toLowerCase().replace(/sq ft$/, 'square feet');
  // the band of the main color (P13's foot band), edge to edge with bleed; inner html is set on it (white type, gold caps)
  FO.band = (x, y, w, h, inner, id) => `<div class="ar-bandbg"${id ? ` id="${id}"` : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"></div><div class="ar-band">${inner || ''}</div>`;
  // P13's facts: centered, a short rule between them (the flyer's column beside the house), here as a 2 x 2 grid or one row of numbers
  FO.factGrid = (L, x, y, w, h, slot) => { const it = FXS.statItems(L).map(FO.factText).slice(0, 4), n = it.length, cols = 2, rows = Math.ceil(n/cols), cw = w/cols, rh = h/rows; let t = '';
    const fs = Math.min(...it.map(s => FXS.fitSize(s, `${RHD};font-weight:600`, cw - 16, 17, 10)));
    it.forEach((s, i) => { const c = i % cols, r = Math.floor(i/cols), cx = x + c*cw, cy = y + r*rh;
      t += `<div class="abs" style="left:${cx}pt;top:${cy + (rh - fs*1.3)/2}pt;width:${cw}pt;height:${fs*1.3}pt;${RHD};font-weight:600;font-size:${fs}pt;line-height:${fs*1.3}pt;color:var(--ar-on);text-align:center;white-space:nowrap" data-slot="${slot}.${i}" data-lines="1">${esc(s)}</div>`; });
    for(let r = 1; r < rows; r++) for(let c = 0; c < cols; c++) t += `<div class="ar-dv" style="left:${x + c*cw + cw/2 - 18}pt;top:${y + r*rh}pt;width:36pt"></div>`;
    for(let c = 1; c < cols; c++) t += `<div class="abs" style="left:${x + c*cw}pt;top:${y + rh*0.3}pt;width:1pt;height:${h - rh*0.6}pt;background:var(--ar-accent);opacity:.4"></div>`;
    return t; };
  FO.factRow = (L, x, y, w, h, slot) => { const parts = FXS.statItems(L).map(FXS.statParts).slice(0, 4), n = parts.length, cw = w/n; let t = '';
    const nf = Math.min(...parts.map(p => FXS.fitSize(p.n, `${RHD};font-weight:700`, cw - 12, 30, 16)));
    parts.forEach((p, i) => { const cx = x + i*cw, bh = nf*1.1 + 6 + 11, top = y + (h - bh)/2;
      t += `<div class="abs" style="left:${cx}pt;top:${top}pt;width:${cw}pt;height:${nf*1.1}pt;${RHD};font-weight:700;font-size:${nf}pt;line-height:${nf*1.1}pt;color:var(--ar-accent);text-align:center;white-space:nowrap" data-slot="${slot}.${i}" data-lines="1">${esc(p.n)}</div>`;
      t += `<div class="ar-ml" style="left:${cx}pt;top:${top + nf*1.1 + 6}pt;width:${cw}pt;color:var(--ar-soft)" data-slot="${slot}.${i}.l" data-lines="1">${esc(String(p.l).toUpperCase())}</div>`;
      if(i) t += `<div class="abs" style="left:${cx}pt;top:${y + h*0.2}pt;width:1pt;height:${h*0.6}pt;background:var(--ar-accent);opacity:.45"></div>`; });
    return t; };
  // the overlapping print (P13's inset room): a room in its own mat laid over the lower-right corner of the house photo; data-inset lets
  // AR.insetFix slide it down (never over the house) once the hero's crop is known
  FO.inset = (D, id, x, y, w, h, slot, maxDown, extra) => `<div class="abs ar-inset" data-inset="${slot}" data-maxdown="${maxDown || 0}" style="left:0;top:0;width:0;height:0;z-index:4">${FXS.box(D, id, x, y, w, h, slot, '', 8)}${extra || ''}</div>`;

  // ---------------- Arc fronts (11/16) ----------------
  // P49's HOME row: the ruled row with the label cell, each fact a cell: the number in Spectral 600 of the main color, its word in Spectral
  // (the flyer's "2 beds · 2 full baths"), short vertical rules between; "built 2005" for the year
  FO.homeCells = (L, w, max) => { const parts = FXS.statItems(L).map(FXS.statParts).slice(0, 4), cw = w/Math.max(1, parts.length);
    const txt = p => /^built$/i.test(p.l) ? ['built ', p.n, ''] : ['', p.n, ' ' + String(p.l).toLowerCase()];
    const f = Math.min(...parts.map(p => FXS.fitSize(txt(p).join(''), 'font-family:Spectral;font-weight:500', cw - 14, max || 17, 11)));
    return parts.map((p, i) => { const [a, n, b] = txt(p); return {html: `<div class="ar-sp" style="position:relative;font-size:${f}pt;line-height:${f*1.3}pt;text-align:center" data-slot="front.fact.${i}" data-lines="1">${esc(a)}<b>${esc(n)}</b>${esc(b)}</div>`}; }); };
  FO.home = (L, x, y, w, h, o) => { o = o || {}; const lw = o.lw == null ? 84 : o.lw; return AR.ruled(x, y, w, h, o.label == null ? 'Home' : o.label, FO.homeCells(L, w - lw - 6, o.max), {lw, ls: o.ls}); };
  // the hero across the top with P49's arc for its foot: full height (yb) at the right, rising to ya at the left; the accent hairline
  // echoes it 9 pt below, trim to trim. The frame keeps the whole house (taller when the house needs it, never past maxH).
  FO.heroArc = (D, hero, y, yb, rise, slot, o) => { o = o || {}; const x0 = o.x0 == null ? -9 : o.x0, x1 = o.x1 == null ? 621 : o.x1, w = x1 - x0; let H = yb - y; while(H < (o.maxH || H + 60) && !SW.fits(D, hero, w, H*0.94)) H += 4;   // the house ends clear of the arc's low end
    const YB = y + H, YA = YB - rise, eid = 'ec-' + slot.replace(/\W/g, '');
    return {html: AR.cut(D, hero, x0, y, w, H, slot, YA, YB, {echo: eid}) + AR.echo(x0, YA, x1, YB, 9, 1.6, eid, false, -9, 621), ya: YA, yb: YB}; };

  // Arc cover (11/16): the P49 flyer grown into a cover. The house across the top, bleeding off three edges, its foot the swept arc with the
  // accent hairline echoing it. Under the arc, the street in P49's tall Spectral caps in the main color (the flyer's OPEN HOUSE), two lines
  // as large as the room allows; beside it, flush right, the neighborhood and the city (the flyer's address block). The HOME row (P49's ruled
  // WHEN row: beds, baths, size, year). The main-color block across the foot with its one rounded corner holds the cover's write-up in white.
  // No agent, no brokerage.
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, intro = o.intro || K.summary || F.intro || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), HA = FO.heroArc(D, hero, -9, 452, 92, 'front.house', {maxH: 500, x0: FO.FG});
    let h = HA.html;
    const BT = 690, RH = 50, RY = BT - 24 - RH;
    // the street: two lines broken where it sets largest, the full measure; P49's tall Spectral caps in the main color
    const ad = String(L.address || '').toUpperCase(), ws = ad.split(/\s+/), zt = HA.yb + 24, zh = RY - 14 - zt, colW = CW;
    let best = null; for(let i = 1; i < ws.length; i++){ const ls = [ws.slice(0, i).join(' '), ws.slice(i).join(' ')]; let f = 120; while(f > 30 && (ls.some(l => FXS.width(l, `font-family:Spectral;font-weight:400;letter-spacing:-.5pt;font-size:${f}pt`) > colW) || 2*f*0.9 > zh)) f -= 0.5; if(!best || f > best.f) best = {ls, f}; }
    const lh = +(best.f*0.9).toFixed(2), sy = zt + (zh - 2*lh)/2;
    h += AR.caps(best.ls, X0 - 3, sy, colW + 6, best.f, lh, 'address');
    h += FO.home(L, X0, RY, CW, RH);
    // the block: the neighborhood in the tall caps in white, the city in tracked caps beside it, centered top to bottom above the trim
    const hood = (FXS.hood(L) || '').toUpperCase(), city = FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, '').toUpperCase(), cf = FXS.fitSize(city, 'font-family:Jost;font-weight:500;letter-spacing:2.4pt', 200, 12, 9), cwid = FXS.width(city, `font-family:Jost;font-weight:500;letter-spacing:2.4pt;font-size:${cf}pt`) + 8;
    const hf = hood ? FXS.fitSize(hood, 'font-family:Spectral;font-weight:400;letter-spacing:-.3pt', CW - cwid - 30, 46, 20) : 0, mid = BT + (792 - BT)/2;
    let b = hood ? AR.caps([hood], X0 - 2, mid - hf*0.5, CW - cwid - 26, hf, hf, 'front.hood', {color: 'var(--ar-on-main)'}) : '';
    b += `<div class="ar-pl" style="left:${hood ? X1 - cwid : X0}pt;top:${mid - cf*0.7}pt;width:${hood ? cwid : CW}pt;height:${cf*1.4}pt;font-size:${cf}pt;line-height:${cf*1.4}pt;letter-spacing:2.4pt;color:var(--ar-gold);text-align:${hood ? 'right' : 'left'}" data-slot="front.place" data-lines="1">${esc(city)}</div>`;
    h += AR.block(-9, BT, 630, 801 - BT, 46, b, 'ar-cover-blk');
    return h;
  };

  // Arc flyer front (11/16): its own composition, the cover's order turned. At the head on the paper: the place in tracked caps and the street
  // on one line in the tall Spectral caps. The house under it, straight across the top and bleeding off both sides, its foot the arc with its
  // echo. Under the arc the HOME row. Then the main-color block, rounded at its top right, runs to the foot: two rooms on it with their names
  // in the accent caps, and the write-up in white beside them. No agent, no brokerage.
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), strip = (o.strip || (P.ar || {}).flyerStrip || P.flyerStrip || P.strip || []).filter(id => id !== hero).slice(0, 2);
    const hood = FXS.hood(L), place = [hood, FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, '')].filter(Boolean).join('  ·  ').toUpperCase(), ad = String(L.address || '').toUpperCase();
    const pf = FXS.fitSize(place, 'font-family:Jost;font-weight:500;letter-spacing:2.2pt', CW, 11, 8.6), as = FXS.fitSize(ad, 'font-family:Spectral;font-weight:400;letter-spacing:-.5pt', CW + 4, 66, 30);
    let h = `<div class="ar-pl" style="left:${X0}pt;top:30pt;width:${CW}pt;height:${pf*1.4}pt;font-size:${pf}pt;line-height:${pf*1.4}pt;letter-spacing:2.2pt;color:var(--ar-accent);font-weight:600" data-slot="front.place" data-lines="1">${esc(place)}</div>`;
    const sy = 30 + pf*1.4 + 4; h += AR.caps([ad], X0 - 3, sy, CW + 6, as, as*0.98, 'address');
    const HY = Math.round(sy + as*1.22 + 6), HA = FO.heroArc(D, hero, HY, HY + 318, 64, 'front.house', {maxH: 410});
    h += HA.html;
    const RY = HA.yb + 26, RH = 46; h += FO.home(L, X0, RY, CW, RH);
    const BT = RY + RH + 22; let b = '';
    // two rooms on the block, their names under them in the accent caps; the write-up beside them in white, centered top to bottom
    const PW = 150, g = 14, PY = BT + 24, PH = 766 - 22 - PY - 6;
    strip.forEach((id, i) => { const x = X0 + i*(PW + g); b += FXS.box(D, id, x, PY, PW, PH, 'front.strip' + i) + `<div class="ar-pl" style="left:${x}pt;top:${PY + PH + 8}pt;width:${PW}pt;height:12pt;font-size:8.6pt;line-height:12pt;letter-spacing:2pt;color:var(--ar-gold);font-weight:600" data-slot="front.strip${i}.label" data-lines="1">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div>`; });
    const wx = X0 + strip.length*(PW + g) + 8, ww = X1 - wx, top = BT + 22, avail = 772 - top, lhw = 16, nl = Math.max(3, Math.floor(avail/lhw));
    b += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="${nl},${nl - 1},${nl - 2}" data-lh="${lhw}" ${FXS.sd(intro)} style="left:${wx}pt;top:${top + (avail - nl*lhw)/2}pt;width:${ww}pt;height:${nl*lhw}pt;font-size:11pt;line-height:${lhw}pt;color:var(--ar-on-main)"></div>`);
    h += AR.block(-9, BT, 630, 801 - BT, 46, b, 'ar-ff-blk');
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
    h += `<div class="ar-head" style="left:${x}pt;top:${hy}pt;width:${Math.ceil(w) + 2}pt;height:${2*lh}pt;font-size:${f}pt;line-height:${lh}pt" data-slot="${slot}.title" data-lines="2" data-fine="1">${esc(t)}</div>`;
    // one accent rule across the fold: the same height on both inside pages, running from the text margin through the frame to the fold,
    // where it meets its match on the other page (the frame breaks where the rule passes through it)
    const fold = o.fold || (/^left/.test(slot) ? 'r' : /^right/.test(slot) ? 'l' : ''), rx = fold === 'l' ? -9 : X0, rw = fold === 'r' ? 621 - X0 : fold === 'l' ? X1 + 9 : CW;
    h += `<div class="ar-rule" style="left:${rx}pt;top:${hb + 9}pt;width:${rw}pt;height:1pt"></div>`;
    if(fold) h += `<div class="ar-cut" style="left:${fold === 'r' ? FR[2] - 3 : FR[0] - 3}pt;top:${hb + 8}pt;width:7pt;height:3pt"></div>`;
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
    let b = `<div class="ar-wbox lt" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 15}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 29}pt;width:${liw}pt;font-size:${hs}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    T.rows.forEach((r, i) => { const ry = y + top + i*rowH, c0 = ry + (rowH - 11 - 3 - 2*lh)/2;
      b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .5}pt;width:${liw}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${c0 + 1}pt;width:${liw}pt;color:var(--ar-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx}pt;top:${c0 + 14}pt;width:${liw + 1}pt;height:${2*lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--ar-font);color:var(--fx-soft);overflow:hidden" data-slot="${slot}.list.t${i}" data-lines="2">${esc(r.t)}</div>`; });
    return `<div class="ar-lt">${b}</div>`; };
  FO.table = (T, kicker, heading, x, y, w, hgt, slot) => { const n = T.rows.length, lx = x + 18, liw = w - 36, top = heading ? 58 : 36, rowH = (hgt - top - 12)/n;
    let b = `<div class="ar-wbox" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 16}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 30}pt;width:${liw}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    T.rows.forEach((r, i) => { const ry = y + top + i*rowH, lh = Math.round(T.f*1.5);
      if(i) b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .4}pt;width:${liw}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${ry + rowH/2 - 5.5}pt;width:${T.LW - 8}pt;color:var(--ar-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx + T.LW}pt;top:${ry + rowH/2 - lh/2}pt;width:${T.V}pt;height:${lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--ar-font);color:var(--fx-soft);white-space:nowrap;overflow:hidden;" data-slot="${slot}.list.t${i}" data-lines="1">${esc(r.t)}</div>`; });
    return b; };
  // the room's card beside its big photo: a narrow panel as tall as the photo, each row its label in accent caps over one full line of true detail; the rows share the height evenly (the box is sized to its content)
  FO.tableStack = (T, kicker, heading, x, y, w, hgt, slot) => { const n = T.rows.length, lx = x + 18, liw = w - 36, hs = heading ? FXS.fitSize(String(heading).replace(/\.$/, ''), "font-family:Jost;font-weight:500", liw, 15, 11) : 0, top = heading ? 56 : 36, rowH = (hgt - top - 9)/n, lh = Math.round(T.f*1.4);
    let b = `<div class="ar-wbox" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 15}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 29}pt;width:${liw}pt;font-size:${hs}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    T.rows.forEach((r, i) => { const ry = y + top + i*rowH, c0 = ry + (rowH - 11 - 3 - lh)/2;
      b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .5}pt;width:${liw}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${c0 + 1}pt;width:${liw}pt;color:var(--ar-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx}pt;top:${c0 + 14}pt;width:${liw}pt;height:${lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--ar-font);color:var(--fx-soft);white-space:nowrap;overflow:hidden;" data-slot="${slot}.list.t${i}" data-lines="1">${esc(r.t)}</div>`; });
    return b; };

  // ---------------- INSIDE SPREAD (Arc, 11/16). One line across 17 inches: the set's rising line runs from the left page's outer
  // edge to the right page's outer edge without a break (FO.SY at the left trim, rising AR.S per pt), and each page's best room fills the
  // top of its page above it, its foot cut on the line, the accent stripe riding the cut through the fold (bars and stripes may cross it;
  // the photos stop 0.05 in short of it). Under the line each page steps down from the line by the same amount, so the two headline blocks
  // climb with it: LEFT the kitchen's two-tone headline, its card (P22's white event box) and two captioned rooms; RIGHT the room's
  // two-tone headline, its own write-up as the page's lead, and three rooms in a row.
  // ---------------- INSIDE SPREAD (Arc, 11/16) ----------------
  // The sign-in sheet's corner turned into a spread: on each page the room photo hangs from the top edge beside a column holding the
  // page's headline, its foot P49's arc. The two arcs are one curve across the fold: each is lowest at the fold and rises toward the
  // outer column, so the two photos meet over the crease as one dipping sweep (each stops 0.05 in short of the fold), and the accent
  // echo runs unbroken from the left page's text margin across the fold to the right page's. Under it the pages differ: LEFT the kitchen's
  // card as P49's ruled rows in the white box, then the main-color block (its rounded corner at the fold) with two rooms in white type;
  // RIGHT the room's own write-up in the white box, then a ladder of rooms (the sign-in sheet's ruled rows: photo, rule, name and caption).
  FO.FG = 3.6;                // owner 11/16: photos stop 0.05 in short of the fold
  FO.CX = 262;                // the photo's outer edge (left page; mirrored on the right: 612 - 262 = 350)
  FO.AY = 290; FO.AB = 362;   // the arc's height at the outer column and at the fold
  FO.armPhoto = (D, id, slot, left) => { const eid = 'ec-' + (left ? 'l' : 'r');
    if(left) return AR.cut(D, id, FO.CX, -9, 612 - FO.FG - FO.CX, FO.AB + 9, slot, FO.AY, FO.AB, {echo: eid}) + AR.echo(FO.CX, FO.AY, 612 - FO.FG, FO.AB, 9, 1.6, eid, false, X0, 612);
    const xr = 612 - FO.CX; return AR.cut(D, id, FO.FG, -9, xr - FO.FG, FO.AB + 9, slot, FO.AB, FO.AY, {echo: eid, m: true}) + AR.echo(FO.FG, FO.AB, xr, FO.AY, 9, 1.6, eid, true, 0, X1); };
  // the headline column: the room in the main-color caps with the plan's size beside it, then the Spectral headline (sentence case, the
  // main color) as large as five lines in the column allow, the block centered top to bottom between the top margin and the echo
  FO.colHead = (D, id, title, slot, x, w, al) => { const c = FXS.cardFor(D, id) || {}, lab = FXS.leadLabel(c.lead || FO.lead(D, id)), t = String(title || '').replace(/\.$/, '').replace(/(^| )([AaI]) /g, '$1$2 ');
    const fam = 'font-family:Spectral;font-weight:500;letter-spacing:-.3pt'; let f = 40, L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w);
    while(f > 24 && (L.length > 5 || L.length*f*1.08 > 210)) { f -= 0.5; L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); }
    const lh = +(f*1.08).toFixed(2), n = L.length, room = String(lab.name || FO.lead(D, id)).toUpperCase(), kf = FXS.fitSize(room, 'font-family:Jost;font-weight:600;letter-spacing:2.2pt', w, 9.5, 8.6), bh = kf*1.4 + (lab.size ? kf*1.4 + 2 : 0) + 10 + n*lh, y = 30 + (FO.AY - 22 - 30 - bh)/2;
    if(lab.size) (FXS.__sizes = FXS.__sizes || new Set()).add(lab.size);
    let h = `<div class="ar-pl" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${kf*1.4}pt;font-size:${kf}pt;line-height:${kf*1.4}pt;letter-spacing:2.2pt;color:var(--ar-accent);font-weight:600;text-align:${al}" data-slot="${slot}.room" data-lines="1">${esc(room)}</div>`;
    if(lab.size) h += `<div class="ar-pl" style="left:${x}pt;top:${y + kf*1.4 + 2}pt;width:${w}pt;height:${kf*1.4}pt;font-size:${kf}pt;line-height:${kf*1.4}pt;letter-spacing:1pt;text-align:${al}" data-size="1">${esc(lab.size)}</div>`;
    h += `<div class="abs ar-ph" style="left:${x}pt;top:${y + bh - n*lh}pt;width:${w + 2}pt;height:${n*lh}pt;font-size:${f}pt;line-height:${lh}pt;text-align:${al}" data-slot="${slot}.title" data-lines="${n}" data-fine="1">${esc(t)}</div>`;
    return h; };
  // the kitchen card: P49's white box with its thin accent line, the rows ruled as the flyer's WHEN row (label cell in the main-color caps,
  // a short vertical rule, the row's true detail on two full lines; one line each when two cannot fill). A row that only repeats what the
  // back's lists print is left out (Night Fade's filter).
  FO.ledger = (D, items, x, y, w, maxRows, slot, head) => { const K = D.sw || {}, SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const taken0 = a => /^(It|Its|They|This|That)\b/.test(a) || SW.grams4(a).some(g => backG.has(g)) || backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w))));
    // a fact is said once: a row never repeats what the page's headline names (its distinctive words)
    const ws = t => new Set((String(t).toLowerCase().match(/[a-z-]+/g) || []).map(w => w.replace(/s$/, '')).filter(w => w.length > 3 && !['kitchen', 'that', 'with', 'from', 'this', 'into', 'open', 'opens', 'there', 'their'].includes(w))), hw = [...ws(head || '')];
    const taken = a => taken0(a) || hw.some(w => ws(a).has(w));
    // the one-story's renovation story (five or six true rows): two columns of ruled cells, each its label over two full lines, so every row shows
    if(items.length >= 5){ const cw2 = (w - 36 - 26)/2, G = Array.from({length: 26}, (_, i) => cw2 - 2*i).map(V => FO.tableRows2(items.slice(0, 10), taken, {maxRows: 6, Vs: [V]})).reduce((a, b2) => { const sc = g => (g.rows.length - g.rows.length % 2)*10 + (g.rows.some(r => r.l === items[0].l) ? 5 : 0) + (g.rows.length % 2 ? 0 : 1); return !a || sc(b2) > sc(a) ? b2 : a; }, null);
      if(G.rows.length >= 4){ if(G.rows.length % 2) G.rows = G.rows.slice(0, G.rows.length - 1); const lh = +(G.f*1.42).toFixed(2), rowH = 14 + 2*lh + 16, nr = Math.ceil(G.rows.length/2), BH = 8 + nr*rowH + 4;
        let b = `<div class="ar-wb" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${BH}pt"></div><div class="ar-vrl" style="left:${x + 18 + cw2 + 12.5}pt;top:${y + 14}pt;height:${BH - 28}pt;opacity:.3"></div>`;
        G.rows.forEach((r, i) => { const c = i % 2, rr = Math.floor(i/2), cx = x + 18 + c*(cw2 + 26), cy = y + 8 + rr*rowH, top = cy + (rowH - 14 - 2*lh)/2;
          if(rr) b += `<div class="ar-rl" style="left:${cx}pt;top:${cy - .5}pt;width:${cw2}pt;opacity:.22"></div>`;
          b += `<div class="ar-wl" style="left:${cx}pt;top:${top}pt;width:${cw2}pt;font-weight:600;font-size:9pt;letter-spacing:1.8pt" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
          b += `<div class="abs" style="left:${cx}pt;top:${top + 14}pt;width:${G.V + 1}pt;height:${2*lh}pt;font-weight:400;font-size:${G.f}pt;line-height:${lh}pt;font-family:Jost;color:#2a2a2a;overflow:hidden;text-align:justify;text-align-last:left" data-slot="${slot}.list.t${i}" data-lines="2">${esc(r.t)}</div>`; });
        return {html: `<div class="ar-on-wb" style="position:relative;z-index:3">${b}</div>`, h: BH}; } }
    const lcss = 'font-family:Jost;font-weight:600;font-size:9pt;letter-spacing:1.8pt', LW = Math.min(130, Math.ceil(Math.max(...items.map(it => FXS.width(String(it.l).toUpperCase(), lcss)))) + 26), V = w - 36 - LW - 14;
    const T2 = FO.tableRows2(items.slice(0, 10), taken, {maxRows, Vs: [V - 24, V - 12, V]}), T1 = FO.tableRows(items.slice(0, 10), V, taken, {stack: true, maxRows: maxRows + 1, Vs: [V - 20, V - 10, V]}); T1.rows = T1.rows.filter(r => r.fill >= 0.86);
    const two = T2.rows.length >= Math.min(3, maxRows) || T2.rows.length >= T1.rows.length, T = two ? T2 : T1, NL = two ? 2 : 1, lh = +(T.f*1.42).toFixed(2), rowH = NL*lh + 20, n = T.rows.length, BH = n*rowH + 12;
    let b = `<div class="ar-wb" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${BH}pt"></div>`;
    T.rows.forEach((r, i) => { const ry = y + 6 + i*rowH, tx = x + 18 + LW + 14;
      if(i) b += `<div class="ar-rl" style="left:${x + 18}pt;top:${ry - .5}pt;width:${w - 36}pt;opacity:.22"></div>`;
      b += `<div class="ar-wl" style="left:${x + 18}pt;top:${ry + (rowH - 11)/2}pt;width:${LW - 8}pt;font-weight:600;font-size:9pt;letter-spacing:1.8pt" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="ar-vrl" style="left:${x + 18 + LW}pt;top:${ry + 9}pt;height:${rowH - 18}pt;opacity:.3"></div>`;
      b += `<div class="abs" style="left:${tx}pt;top:${ry + (rowH - NL*lh)/2}pt;width:${T.V + 1}pt;height:${NL*lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:Jost;color:#2a2a2a;overflow:hidden;${NL === 2 ? 'text-align:justify;text-align-last:left' : 'white-space:nowrap'}" data-slot="${slot}.list.t${i}" data-lines="${NL}">${esc(r.t)}</div>`; });
    return {html: `<div class="ar-on-wb" style="position:relative;z-index:3">${b}</div>`, h: BH}; };
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, C = P.ar || {};
    const kid = C.left || (P.strip || []).find(id => (D.photos || {})[id]) || 'kitchen', rowC = FO.cards(D, C.leftRow || (P.left || []).filter(id => id !== kid).slice(0, 2));
    let h = FO.armPhoto(D, kid, 'left.wide', true) + FO.colHead(D, kid, C.leftTitle || I.title, 'left', X0, FO.CX - 18 - X0, 'left');
    const CY = FO.AB + 9 + 22, L = FO.ledger(D, box.items || [], X0, CY, CW, 3, 'left', C.leftTitle || I.title); h += L.html;
    // the block: the kit's main color from under the card to the foot, its one rounded corner at the fold; two captioned rooms in white
    const BT = CY + L.h + 22, n = Math.max(1, rowC.length), g = 22, W2 = (CW - (n - 1)*g)/n, clh = 13.5, Lc = 3, PY = BT + 22, RH = 772 - PY - 25 - Lc*clh;
    let b = ''; rowC.forEach((c, i) => { b += FXS.captioned(D, c, X0 + i*(W2 + g), PY, W2, RH, Lc, 'left.photo' + i, {fs: 10, lh: clh, min: 3, gap: 0}).replace(`data-slot="left.photo${i}" data-room`, `data-slot="left.photo${i}" data-nopair="1" data-room`); });
    h += AR.block(-9, BT, 621, 801 - BT, 46, b, 'ar-left-blk');
    return h; };
  // a ladder row: the photo at the left, a short vertical rule, the room's name and its caption beside it (sized after the fill, centered on
  // the photo); rules above and below as the sign-in sheet's rows
  FO.rung = (D, c, x, y, pw, ph, tw, slot, o) => { o = o || {}; c = FXS.augment(D, c); const lh = o.lh || 14, L0 = FXS.leadLabel(c.lead), cx = x + pw + 28, n = Math.max(3, Math.floor((ph - 22)/lh));
    return FXS.box(D, c.photo, x, y, pw, ph, slot) + `<div class="ar-vrl" style="left:${x + pw + 14}pt;top:${y + 10}pt;height:${ph - 20}pt;opacity:.3"></div>`
      + `<div class="abs" style="left:${cx}pt;top:${y}pt;width:${tw}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${tw}pt">${esc(L0.name.toUpperCase())}</div>${L0.size && !(FXS.__sizes = FXS.__sizes || new Set()).has(L0.size) ? (FXS.__sizes.add(L0.size), `<div class="lbl sz" data-size="1">${esc(L0.size)}</div>`) : ''}</div>`
      + `<div class="abs cap side" data-ph-top="${y}" data-ph-h="${ph}"><div class="a" style="position:absolute;left:${cx}pt;top:${y + 20}pt;width:${tw}pt;height:${n*lh}pt;font-size:${o.fs || 10.5}pt;line-height:${lh}pt" data-slot="${slot}" data-room="${esc(L0.name)}" data-lh="${lh}" data-lines="${n}" data-min="3" data-narrow="0" ${FXS.sd(c.s)}></div></div>`; };
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, C = P.ar || {};
    const ids = C.right ? [C.right].concat(C.rightRow || []) : (P.right || []), cs = FO.cards(D, ids), top = cs[0], rest = cs.slice(1).sort((a, b) => (/bath|closet|laundry|powder/.test(a.photo) ? 1 : 0) - (/bath|closet|laundry|powder/.test(b.photo) ? 1 : 0)).slice(0, 2);
    const xr = 612 - FO.CX; let h = FO.armPhoto(D, top.photo, 'right.wide', false) + FO.colHead(D, top.photo, C.rightTitle || R.title, 'right', xr + 18, X1 - xr - 18, 'right');
    // the room's own write-up in P49's white box, set large as the page's lead, centered top to bottom in the box
    const c0 = FXS.augment(D, top), nw = 3, by = FO.AB + 9 + 22, all = (c0.s || []).map(x => [].concat(x).slice().sort((p, q) => q.length - p.length)[0]).join(' '), wt = FXS.width(all, 'font-family:Jost;font-weight:400;font-size:13.5pt'),
      fsL = Math.max(12, Math.min(17.5, +(13.5*2.9*(CW - 40)/Math.max(1, wt)).toFixed(2))), wl = +(fsL*1.42).toFixed(2), bh = nw*wl + 30;   // a short pool sets larger, so the lead still runs three full lines
    h += `<div class="ar-wb" style="left:${X0}pt;top:${by}pt;width:${CW}pt;height:${bh}pt"></div><div class="abs cap ar-on-wb"><div class="a" style="position:absolute;left:${X0 + 20}pt;top:${by + 15}pt;width:${CW - 40}pt;height:${nw*wl}pt;font-size:${fsL}pt;line-height:${wl}pt;color:#2a2a2a" data-slot="right.photo0" data-room="${esc(FXS.leadLabel(top.lead).name)}" data-lh="${wl}" data-hbox="${nw*wl}" data-lines="${nw}" data-min="3" data-narrow="0" ${FXS.sd(c0.s)}></div></div>`;
    // the ladder: one or two rungs from under the box to the foot, ruled above, between and below
    const y0 = by + bh + 22, n = Math.max(1, rest.length), RG = 14, rh = (766 - RG - y0 - (n - 1)*RG*2)/n, pw = 250;
    h += `<div class="ar-rl" style="left:${X0}pt;top:${y0 - RG/2 - 4}pt;width:${CW}pt"></div>`;
    rest.forEach((c, i) => { const y = y0 + i*(rh + 2*RG); h += FO.rung(D, c, X0, y, pw, rh, X1 - (X0 + pw + 28), 'right.photo' + (i + 1), {fs: 10.5, lh: 14.5});
      h += `<div class="ar-rl" style="left:${X0}pt;top:${y + rh + RG}pt;width:${CW}pt"></div>`; });
    return h; };
  FO.rightFit = () => {}; FO.leftHead = () => {};
  // after the fill: a ladder rung whose caption the refit narrowed keeps its name and its short rule lined up with the caption
  FO.rungFix = () => document.querySelectorAll('.cap.side .a[data-slot]').forEach(a => { const sl = a.dataset.slot, lb = document.querySelector(`[data-slot="${sl}.label"]`), ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), x = parseFloat(a.style.left);
    if(lb) lb.parentElement.style.left = x + 'pt'; const pb = ph && ph.parentElement, v = pb && pb.nextElementSibling; if(v && v.classList.contains('ar-vrl')) v.style.left = (x - 14) + 'pt';
    if(pb){ pb.style.width = (x - 28 - parseFloat(pb.style.left)) + 'pt'; } });

  // ---------------- BACK (fold-over) and flyer back (Arc, 11/16) ----------------
  // Top: the listing's own plan in a box its own shape (or, with no plan, the big outdoor photo), the write-up beside it at the rest of the
  // width. Middle: the two lists in P22's white event box (or, with no plan, stacked beside a second captioned photo). Foot: the kit's dark
  // rises to meet the page on the set's line, the stripe riding it edge to edge; on the dark, Nearby as the sign-in sheet's numbered squares
  // stepping up the slope (the miles in the square, the place beside it), then the half-height contact card and the fine print.
  FO.planBox = (D, x, y, maxH, maxW) => { const A = D.plan.turn && D.plan.kind === 'color' ? 270 : undefined, rot = !!D.plan.turn, noteW = Math.ceil(FXS.width((D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate.', 'font-family:Jost;font-size:8pt')) + 34;
    const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: rot ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: rot, angle: A}); let cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 40, D.plan.minCard || 0, noteW, 188));
    for(let hh = maxH; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: cw - 28.8, h: hh}, {allowRotate: rot, angle: A}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')){ if(big.usedW) cw = Math.min(cw, Math.max(Math.ceil(big.usedW) + 40, D.plan.minCard || 0, noteW, 188)); break; } }
    return FXS.planCard(D, x, y, cw, maxH); };
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:758pt;width:${CW}pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  // ---------------- BACK (fold-over) and flyer back (Arc, 11/16) ----------------
  // The back is the P49 flyer's own order: an outdoor photo across the top with the arc for its foot (left out when a tall plan needs the
  // height), the floor-by-floor write-up beside the listing's own plan (the plan at the right, in a box its own shape; with no plan a second
  // captioned photo there), the NEARBY row ruled exactly as the flyer's WHEN row, the two lists in P49's white box with its accent line, and
  // the main-color block with its one rounded corner across the foot carrying the half-height contact card and the fine print.
  FO.NB = 58;   // the Nearby row's height
  FO.nearRow = (D, y) => { const N = ((D.sw || {}).back || {}).nearby || [], n = Math.min(3, N.length), lw = 96, cw = (CW - lw - 6)/Math.max(1, n);
    const cells = N.slice(0, n).map((nn, i) => { const m = /^([\d.,]+)\s*(.*)$/.exec(String(nn.dist).trim()) || [0, nn.dist, ''], num = m[1], unit = String(m[2] || ''), pl = String(nn.place).toUpperCase();
      const pf = FXS.fitSize(pl, 'font-family:Jost;font-weight:500;letter-spacing:1.4pt', cw - 14, 9, 8), df = FXS.fitSize(`${num} ${unit}`, 'font-family:Spectral;font-weight:500', cw - 14, 17, 12);
      return {html: `<div class="ar-sp" style="position:relative;font-size:${df}pt;line-height:${df*1.2}pt;text-align:center" data-slot="back.near${i}.d" data-lines="1"><b>${esc(num)}</b> ${esc(unit)}</div><div class="ar-pl" style="position:relative;font-size:${pf}pt;line-height:${pf*1.35}pt;letter-spacing:1.4pt;text-align:center;margin-top:2pt" data-slot="back.near${i}" data-lines="1" data-fine="1">${esc(pl)}</div>`}; });
    return {html: AR.ruled(X0, y, CW, FO.NB, 'Nearby', cells, {lw, ls: 12, lslot: 'back.near.label'}), y: y + FO.NB}; };
  FO.CARD_H = 62; FO.CARD_Y = 694; FO.BLK = 676;
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, C = P.ar || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? (C.flyerTop || (P.backNoplan || [])[0]) : (C.backTop || (P.backNoplan || [])[0]);
    const footId = hasPlan ? null : flyer ? C.flyerFootNoplan : C.backFootNoplan;
    const L0 = X0, R0 = X1; let h = '';
    const LV = hasPlan ? (D.plan.levels || []) : [], tall = hasPlan && (LV.length >= 4 || (LV.length === 1 && LV[0].h/LV[0].w > 1.5));
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    // the foot first: the lists' white box sits on the block, the Nearby row on the box
    const nr = Math.max(Math.min(c1.length, 4), Math.min(c2.length, 4), 2), rh = 21, LBH = 14 + 18 + nr*rh + 10, LBY = FO.BLK - 20 - LBH, NY = LBY - 18 - FO.NB;
    // the top: the outdoor photo with the arc (none over a tall plan)
    let y0 = 34, HA = null;
    if(!tall && topId){ HA = FO.heroArc(D, topId, -9, hasPlan ? 200 : 212, hasPlan ? 40 : 46, 'back.top', {maxH: hasPlan ? 230 : 300, x1: flyer ? 621 : 612 - FO.FG}); h += HA.html; y0 = HA.yb + 9 + 22; }
    const zoneH = NY - 20 - y0;
    let rightW, rightHtml = '';
    if(hasPlan){ const p0 = FO.planBox(D, 0, y0, zoneH - 34, tall ? 300 : 340), pw = Math.round(parseFloat(/width:([\d.]+)pt/.exec(p0.html)[1])), dy = Math.max(0, (zoneH - (p0.bottom - y0))/2), pc = FO.planBox(D, R0 - pw, y0 + dy, zoneH - 34, tall ? 300 : 340);
      rightHtml = pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; rightW = pw; }
    else { rightW = 236; const c = FXS.cardFor(D, footId); if(c) rightHtml = FXS.captioned(D, c, R0 - rightW, y0, rightW, zoneH - 25 - 3*14, 3, 'back.photo1', {fs: 10.5, lh: 14, min: 3, gap: 0}); }
    h += rightHtml;
    // the write-up column: the kicker, the Spectral headline in the main color, the write-up to the foot of the zone
    const ax = L0, aw = R0 - rightW - 24 - ax;
    const used = FO.cards(D, [topId, footId].filter(Boolean));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    // a fact is said once per piece: on the fold-over the floor-by-floor write-up leaves out a sentence that shares two telling words with the
    // inside spread's kitchen card or the inside photos' captions (granite, stainless, soaking tub...); the inside says those
    const IN = flyer ? [] : (() => { const L = K.left || {}, R = K.right || {}, Pa = P.ar || {}, ids = [Pa.left, ...(Pa.leftRow || []), Pa.right, ...(Pa.rightRow || [])].filter(Boolean);
      return [].concat(...((L.box || {}).items || []).map(it => [].concat(...(it.s || []).map(x => [].concat(x)))), ...ids.map(id => [].concat(...((FXS.cardFor(D, id) || {}).s || []).map(x => [].concat(x))))).map(String); })();
    const tw = t => new Set((String(t).toLowerCase().match(/[a-z0-9-]+/g) || []).map(w => w.replace(/s$/, '')).filter(w => w.length > 4 && !['there', 'their', 'which', 'house', 'floor', 'level', 'other', 'about', 'along', 'right', 'first', 'second', 'third', 'fourth', 'living', 'between', 'beside', 'behind', 'kitchen', 'bedroom', 'room'].includes(w)));
    const INW = IN.map(tw), saidIn = a => { const A = tw(a); return INW.some(B => { let n = 0; A.forEach(w => { if(B.has(w)) n++; }); return n >= 2; }); };
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && ![].concat(x).every(saidIn) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))).map(x => Array.isArray(x) ? (x.filter(a => !saidIn(a)).length ? x.filter(a => !saidIn(a)) : x) : x);
      const chars = a => a.reduce((n, x) => n + Math.max(...[].concat(x).map(t => String(t).length)), 0), cap = (keep.cap || 0)*1.05;
      return k.length >= 3 && chars(k) >= cap ? k : k.concat(list.filter(x => !k.some(y => JSON.stringify(y) === JSON.stringify(x)) && ![].concat(x).some(saysBox))); };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const kickT = +(D.listing || {}).stories > 1 ? 'Floor by floor' : 'Room by room';
    const ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, ''), fam = 'font-family:Spectral;font-weight:500;letter-spacing:-.3pt';
    let hf = 30, hls = ht ? FO.wrapLines(ht, `${fam};font-size:${hf}pt`, aw) : []; while(ht && hf > 18 && hls.length > 2){ hf -= 0.5; hls = FO.wrapLines(ht, `${fam};font-size:${hf}pt`, aw); }
    const hlh = +(hf*1.1).toFixed(2), hh = ht ? hls.length*hlh + 12 : 0;
    h += `<div class="ar-pl" style="left:${ax}pt;top:${y0}pt;width:${aw}pt;height:13pt;font-size:9pt;line-height:13pt;letter-spacing:2.2pt;color:var(--ar-accent);font-weight:600" data-slot="back.about.title" data-lines="1">${esc(kickT.toUpperCase())}</div>`;
    if(ht) h += `<div class="abs ar-ph" style="left:${ax}pt;top:${y0 + 19}pt;width:${aw + 2}pt;height:${hls.length*hlh}pt;font-size:${hf}pt;line-height:${hlh}pt" data-slot="back.about.head" data-lines="${hls.length}" data-fine="1">${esc(ht)}</div>`;
    { const T0 = y0 + 19 + hh, bot = NY - 20, n = Math.max(3, Math.floor((bot - T0)/16)), lh = +((bot - T0)/n).toFixed(3); keep.cap = n*aw/5.1;
      h += FO.full(FO.wu(keep(f2.concat(f1)), ax, T0, aw, n*lh + 0.01, 'back.about', 10.75, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${aw < 240 ? ' data-rag="1"' : ''} data-span="${(bot - T0).toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`); }
    h += FO.nearRow(D, NY).html;
    // the lists: P49's white box with its accent line, two columns
    { const cw = (CW - 36 - 24)/2; let t = `<div class="ar-wb" style="left:${L0}pt;top:${LBY}pt;width:${CW}pt;height:${LBH}pt"></div><div class="ar-vrl" style="left:305.5pt;top:${LBY + 14}pt;height:${LBH - 28}pt;opacity:.25"></div>`;
      t += `<div class="ar-wl" style="left:${L0 + 18}pt;top:${LBY + 14}pt;width:${cw}pt;font-weight:600" data-slot="back.updates.title" data-lines="1">${esc(t1.toUpperCase())}</div>` + FXS.bullets(c1, L0 + 18, LBY + 32, cw, rh, 'back.updates', 4, 10).html;
      t += `<div class="ar-wl" style="left:${L0 + 18 + cw + 24}pt;top:${LBY + 14}pt;width:${cw}pt;font-weight:600" data-slot="back.outside.title" data-lines="1">OUTSIDE</div>` + FXS.bullets(c2, L0 + 18 + cw + 24, LBY + 32, cw, rh, 'back.outside', 4, 10).html;
      h += `<div class="ar-on-wb">${t}</div>`; }
    h += AR.block(-9, FO.BLK, 630, 801 - FO.BLK, 46, FO.contact(D, X0, FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D), 'ar-backblk');
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
