/* Black Rules fold-over and two-sided flyer builders (engine from the Chevron set; every page layout here is Black Rules's own) (grown from the FXS-14 builders; the hand is the approved Open House library
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
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:Libre Franklin;letter-spacing:3.4pt", HW, 24, 13, 5), lh = T.f*1.3, H = 17 + T.n*lh + 9 + 1.2, y = 30 + (270 - 30 - H)/2;
    kk.style.top = y + 'pt'; ti.style.top = (y + 17) + 'pt'; ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = (T.n*lh) + 'pt'; ti.dataset.lines = T.n; ru.style.top = (y + 17 + T.n*lh + 9) + 'pt'; };
  // after the fill: the cover write-up sits on the frame's foot; the rooms above it grow down into any room it did not use (no empty band)
  FO.frontSnug = () => {};   // Black Rules: the flyer front's write-up stays centered in its own room beside the overlapping print (no cover write-up)
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- Chevron geometry (pt, panel trim 612 x 792) ----------------
  // B01's closed frame sits 20 pt in from the sides, 30 from the top and 16 from the foot; text keeps inside X0..X1.
  const FR = [20, 30, 592, 776], X0 = 36, X1 = 576, CW = X1 - X0;
  FO.FR = FR; FO.X0 = X0; FO.X1 = X1; FO.CW = CW;
  FO.frame = () => '';   // Chevron has no frame: the chevron and its echo are the signature
  // the centered heading of B01: accent eyebrow, Sora caps, the short accent rule (returns {html, y} with y under the rule)
  FO.head = (kicker, title, slot, y, o) => { o = o || {}; const ts = FXS.fitSize(String(title).replace(/\.$/, '').toUpperCase(), "font-family:Libre Franklin;letter-spacing:3.4pt", CW, o.max || 21, 12);
    let h = `<div class="abs fo-kick c" style="left:${X0}pt;top:${y}pt;width:${CW}pt" data-slot="${slot}.kicker" data-lines="1">${esc(String(kicker).toUpperCase())}</div>`;
    h += `<div class="abs fo-title c" style="left:${X0}pt;top:${y + 17}pt;width:${CW}pt;height:${ts*1.3}pt;font-size:${ts}pt;line-height:${ts*1.3}pt" data-slot="${slot}.title" data-lines="1">${esc(String(title).replace(/\.$/, '').toUpperCase())}</div>`;
    const ry = y + 17 + ts*1.3 + 7; h += `<div class="br-rule" style="left:${306 - 40}pt;top:${ry}pt;width:80pt"></div>`;
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
  FO.lift = (x, y, w, h) => `<div class="br-lift" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h || 22}pt"></div>`;
  // the standard contact card as B01's footer: agent on the left, the brokerage panel on the right with the one logo, knockout on the dark
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = BR.logoSrc(D); const ko = !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 180, lh = Math.min(46, H - 30), s = {name: 16.5, nameFloor: 13, line: 8.6, rowGap: 10, phone: 12, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div class="br-ccw" style="--cc-display:Libre Franklin;--cc-body:Libre Franklin">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };


  FO.heroId = (D, id) => { const ph = D.photos || {}, sp = SW.space(D, id); if((ph[id] || {}).dusk) return id; const d = Object.keys(ph).find(k => ph[k].dusk && ph[k].fullHouse && SW.space(D, k) === sp); return d || id; };
  FO.isDusk = (D, id) => !!((D.photos || {})[id] || {}).dusk;
  FO.factText = t => /^Built/.test(t) ? t : String(t).toLowerCase().replace(/sq ft$/, 'square feet');
  // ================= Black Rules (P39): the marks =================
  // THE RULES. A 5 pt bar opens every face, 2 pt rules divide its bands, a 4 pt bar closes it; all in the kit's dark, all on one measure.
  // Rules never cross a photo: they run between bands, and a photo always sits between two of them.
  const RHD = "font-family:'Red Hat Display';font-weight:700", LF = "font-family:'Libre Franklin'";
  FO.bar = (x, y, w, h) => `<div class="br-bar" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h || 5}pt"></div>`;
  FO.r2 = (x, y, w) => `<div class="br-r2" style="left:${x}pt;top:${y}pt;width:${w}pt"></div>`;
  FO.r1 = (x, y, w) => `<div class="br-r1" style="left:${x}pt;top:${y}pt;width:${w}pt"></div>`;
  FO.v1 = (x, y, h) => `<div class="br-v1" style="left:${x}pt;top:${y}pt;height:${h}pt"></div>`;
  // THE DISPLAY LINE: Red Hat Display 700 caps, tracked about a tenth of its size (P39 sets 52 pt with 6 pt), centered; one line, the largest
  // size from max down that fits w. Returns {html, h, fs}.
  FO.track = f => +(f*0.11).toFixed(2);
  FO.dispFit = (t, w, max, min, tr) => { tr = tr == null ? 0.11 : tr; let f = max; const T = String(t).toUpperCase(); while(f > min && FXS.width(T, `${RHD};letter-spacing:${(f*tr).toFixed(2)}pt;font-size:${f}pt`) + f*tr > w - 4) f -= 0.5; return f; };
  FO.disp = (t, x, y, w, max, min, slot, o) => { o = o || {}; const tr = o.tr == null ? 0.11 : o.tr, f = FO.dispFit(t, w, max, min, tr), ls = +(f*tr).toFixed(2), lh = +(f*(o.lh || 1.1)).toFixed(2);
    return {fs: f, h: lh, html: `<div class="br-disp" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${lh}pt;font-size:${f}pt;line-height:${lh}pt;letter-spacing:${ls}pt;text-indent:${ls}pt;text-align:${o.al || 'center'};${o.css || ''}" data-slot="${slot}" data-lines="1">${esc(String(t))}</div>`}; };
  // THE SPLIT LINE (P39's date | time): one fact flush left in Libre Franklin 700, its partner flush right in the main color, centered
  // top to bottom in its band. Caps tracked when o.caps. The two never come closer than 18 pt (the right one gives way first).
  FO.split = (l, r, x, y, w, h, slot, o) => { o = o || {}; const cap = o.caps !== false, ls = cap ? 1.6 : 0, css = `${LF};font-weight:700;letter-spacing:${ls}pt${cap ? ';text-transform:uppercase' : ''}`;
    let fs = o.fs || 12; const Lt = cap ? String(l || '').toUpperCase() : String(l || ''), Rt = cap ? String(r || '').toUpperCase() : String(r || '');
    while(fs > 8.6 && FXS.width(Lt, `${css};font-size:${fs}pt${o.lfont ? `;font-family:${o.lfont}` : ''}`) + (Rt ? FXS.width(Rt, `${css};font-size:${fs}pt`) + 18 : 0) > w) fs -= 0.25;
    const lh = fs*1.3, ty = y + (h - lh)/2, cls = cap ? ' br-caps' : '';
    return (Lt ? `<div class="br-sl${cls}" style="${o.lfont ? `font-family:${o.lfont};` : ''}left:${x}pt;top:${ty}pt;width:${w}pt;height:${lh}pt;font-size:${fs}pt;line-height:${lh}pt;letter-spacing:${ls}pt" data-slot="${slot}.l" data-lines="1">${esc(Lt)}</div>` : '')
      + (Rt ? `<div class="br-sr${cls}" style="left:${x}pt;top:${ty}pt;width:${w}pt;height:${lh}pt;font-size:${fs}pt;line-height:${lh}pt;letter-spacing:${ls}pt" data-slot="${slot}.r" data-lines="1">${esc(Rt)}</div>` : ''); };
  // a label (Libre Franklin 700 caps, main color)
  FO.k = (t, x, y, w, slot, al) => `<div class="br-k" style="left:${x}pt;top:${y}pt;width:${w}pt;text-align:${al || 'left'}" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`;
  FO.placeTxt = L => [FXS.hood(L), FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, '')].filter(Boolean).join('  ·  ');
  FO.city = L => FXS.placeLine(L).replace(/\s+\d{5}(-\d{4})?$/, '');
  // THE HEADER of a face, P39's head grown: 5 pt bar, the display line, a 2 pt rule, the split line, a 2 pt rule. Returns {html, y} (y under the last rule).
  FO.header = (disp, l, r, x, y, w, o) => { o = o || {}; let h = FO.bar(o.bx == null ? x : o.bx, y, o.bw || w, 5); y += 5 + (o.g1 || 9);
    const d = FO.disp(disp, x, y, w, o.max || 60, o.min || 26, o.slot || 'address'); h += d.html; y += d.h + (o.g2 || 6);
    h += FO.r2(o.bx == null ? x : o.bx, y, o.bw || w); y += 2;
    const sh = o.sh || 30; h += FO.split(l, r, x, y, w, sh, o.sslot || 'front.split', {fs: o.sfs || 12.5}); y += sh;
    h += FO.r2(o.bx == null ? x : o.bx, y, o.bw || w); return {html: h, y: y + 2, fs: d.fs}; };
  // THE TILES: the sign-in sheet's dark squares with white figures; here a row of cells on 8 pt gutters, a figure over its unit in caps
  FO.tiles = (parts, x, y, w, h, slot, o) => { o = o || {}; const n = parts.length, g = o.g == null ? 8 : o.g, cw = (w - (n - 1)*g)/Math.max(1, n);
    const nf = Math.min(...parts.map(p => FXS.fitSize(String(p.n), RHD, cw - 16, o.max || 26, 12))), uf = Math.max(8.6, Math.min(...parts.map(p => FXS.fitSize(String(p.l).toUpperCase(), `${LF};font-weight:700;letter-spacing:1.2pt`, cw - 12, o.umax || 9, 8.6))));
    return parts.map((p, i) => `<div class="br-tile" style="left:${x + i*(cw + g)}pt;top:${y}pt;width:${cw}pt;height:${h}pt;gap:${Math.max(4, h*0.08)}pt"><div class="n" style="font-size:${nf}pt" data-slot="${slot}.${i}" data-lines="1">${esc(p.n)}</div><div class="u" style="font-size:${uf}pt" data-slot="${slot}.${i}.l" data-lines="1">${esc(String(p.l).toUpperCase())}</div></div>`).join(''); };
  // the tallest frame (from hmax down to hmin) of width w that still shows the whole house
  FO.fitH = (D, id, w, hmax, hmin) => { let h = Math.round(hmax); while(h > hmin && !SW.fits(D, id, w, h)) h -= 4; return h; };
  // the width nearest w0 (between lo and hi) at which a frame h tall still shows the whole house
  FO.fitW = (D, id, w0, h, lo, hi) => { for(let d = 0; d <= Math.max(w0 - lo, hi - w0); d += 4){ if(w0 + d <= hi && SW.fits(D, id, w0 + d, h)) return w0 + d; if(w0 - d >= lo && SW.fits(D, id, w0 - d, h)) return w0 - d; } return w0; };
  FO.factParts = L => FXS.statItems(L).map(FXS.statParts).slice(0, 4);

  // ---------------- COVER (no agent, no brokerage) ----------------
  // The Open House flyer's head turned into a cover: the 5 pt bar, the street as the one display line (P39's OPEN HOUSE, as large as the
  // measure allows), a 2 pt rule, the split line (neighborhood | city), a 2 pt rule; then the whole house across the full measure, a 2 pt
  // rule, the write-up centered, the 4 pt bar that closes the page.
  FO.M = 36; FO.FOOT = 757; FO.SLABPAD = 5.5;
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, intro = o.intro || K.summary || F.intro || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front');
    const hd = FO.header(L.address || '', FXS.hood(L) || FO.city(L), FXS.hood(L) ? FO.city(L) : '', X0, 30, CW, {max: 66, min: 30, sh: 32, sfs: 13});
    let h = hd.html; const PT = hd.y + 8, lh = 18, n = 3, wuH = n*lh, PB = FO.FOOT + 4 - 2*FO.SLABPAD - wuH - 8;
    // the whole house as large as its own shape allows across the measure; two rooms in a locked row under it take the rest
    const ids = ((((D.sw || {}).plan || {}).br || {}).cover || []).filter(id => id !== hero).slice(0, 2), lab = 18, minRow = ids.length ? 118 : 0;
    const HH = FO.fitH(D, hero, CW, Math.min(Math.round(CW/1.38), PB - PT - (minRow ? minRow + 8 + lab : 0)), 250);
    h += FXS.box(D, hero, X0, PT, CW, HH, 'front.house', '', 0);
    if(ids.length){ const g = 8, tw = (CW - (ids.length - 1)*g)/ids.length, ty = PT + HH + g, th = PB - lab - ty; ids.forEach((id, i) => { h += FO.tileC(D, id, X0 + i*(tw + g), ty, tw, th, 'front.strip' + i); }); }
    // the cover's one slab: the closing bar grown into a field of the kit's dark under the photos, the write-up reversed in it, centered
    const ry = PB + 8, SB = FO.FOOT + 4; h += `<div class="br-slab" style="left:${X0}pt;top:${ry}pt;width:${CW}pt;height:${SB - ry}pt"></div>`;
    const wy = ry + (SB - ry - wuH)/2;
    h += `<div class="br-onslab">` + FO.full(FO.wu(intro, X0 + 24, wy, CW - 48, n*lh + 0.01, 'front.summary', 12, lh, 'wu br-c')).replace('data-slot="front.summary"', 'data-slot="front.summary" data-measures="1,.95,.9,.85,.8,.75"') + `</div>`;
    return h;
  };

  // ---------------- FLYER FRONT, its own composition: the photo grid first, the head under it ----------------
  // P39's strongly aligned grid on 8 pt gutters (the whole house across the measure, two rooms in a locked row under it), then the
  // street as the display line between 2 pt rules with the split line, the facts on the sign-in sheet's dark tiles, the write-up,
  // the 4 pt bar. No agent, no brokerage.
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), strip = (o.strip || (P.br || {}).flyerStrip || P.flyerStrip || P.strip || []).filter(id => id !== hero).slice(0, 2);
    let h = FO.bar(X0, 30, CW, 5);
    // from the foot up: the closing bar, the write-up, the tiles, the head
    const lh = 16.5, n = 3, wy = FO.FOOT - 10 - n*lh, TH = 54, ty = wy - 12 - TH;
    const ad = String(L.address || ''), df = FO.dispFit(ad, CW, 44, 24), dh = df*1.1, sh = 28;
    const r3 = ty - 10, r2y = r3 - 2 - sh, dy = r2y - 6 - dh, r1y = dy - 8;
    const PT = 44, avail = r1y - 10 - PT, lab = 18, HH = FO.fitH(D, hero, CW, avail - 8 - 120 - lab, 220), rowH = avail - 8 - lab - HH;
    h += FXS.box(D, hero, X0, PT, CW, HH, 'front.house', '', 0);
    const g = 8, sw_ = (CW - (strip.length - 1)*g)/Math.max(1, strip.length);
    strip.forEach((id, i) => { h += FO.tileC(D, id, X0 + i*(sw_ + g), PT + HH + g, sw_, rowH, 'front.strip' + i); });
    h += FO.r2(X0, r1y, CW) + FO.disp(ad, X0, dy, CW, 44, 24, 'address').html + FO.r2(X0, r2y, CW);
    h += FO.split(FXS.hood(L) || FO.city(L), FXS.hood(L) ? FO.city(L) : '', X0, r2y + 2, CW, sh, 'front.split', {fs: 12});
    h += FO.r2(X0, r3, CW);
    h += FO.tiles(FO.factParts(L), X0, ty, CW, TH, 'front.fact', {max: 24});
    h += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${n}" data-try="${n},${n - 1}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0}pt;top:${wy}pt;width:${CW}pt;height:${n*lh}pt;font-size:11pt;line-height:${lh}pt"></div>`);
    h += FO.bar(X0, FO.FOOT, CW, 4);
    return h;
  };
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
  FO.tableRows = (items0, liw, taken, o) => { o = o || {}; const lcss = 'font-family:Libre Franklin;font-weight:500;font-size:8.6pt;letter-spacing:2.2pt', LW0 = o.stack ? 0 : Math.ceil(Math.max(...items0.map(it => FXS.width(String(it.l).toUpperCase(), lcss)))) + 20;
    const ok = a => !taken || !taken(a); let best = null; const MIN = 0.86, opts = o.stack ? (o.Vs || [178, 184, 190, 196, 202, 208, 214]).map(V => [0, V]) : [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60].map(d => [LW0 + d, liw - LW0 - d]);
    for(let f = o.stack ? 10.5 : 10.5; f <= (o.stack ? 13.51 : 12.51); f += 0.25) for(const [LW, V] of opts){ const css = `font-family:Libre Franklin;font-weight:400;font-size:${f}pt`;
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
    for(let f = 10.5; f <= 13.51; f += 0.25) for(const V of (o.Vs || [184, 190, 196, 202, 208, 214, 220])){ const css = `font-family:Libre Franklin;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== 2 || Lw[0] < 0.8*V || Lw[1] < 0.9*V) return; const sc = (Lw[0] + Lw[1])/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 4), score = n*100 + f*2 - V*0.05;
      if(!best || score > best.score) best = {score, f, V, LW: 0, rows: rows.slice(0, o.maxRows || 4)}; }
    return best; };
  // Black Rules: a card row is its label over two or three full lines (every line but the last 80%+ of the measure, the last 90%+)
  FO.tableRowsN = (items0, taken, o) => { o = o || {}; const ok = a => !taken || !taken(a); let best = null;
    for(let f = 10; f <= 11.51; f += 0.25) for(const V of (o.Vs || [196, 202, 208])){ const css = `font-family:Libre Franklin;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1, bn = 0;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || SW.sameFactIn(t)) return; const Lw = FO.wrapW(t, css, V), n = Lw.length; if(n < 2 || n > 3 || Lw.slice(0, -1).some(x => x < 0.8*V) || Lw[n - 1] < 0.9*V) return; const sc = Lw.reduce((a, b) => a + b, 0)/V; if(sc > bs){ bs = sc; bt = t; bn = n; } return; } if(acc.length < 3) S[i].forEach(a => walk(i + 1, acc.concat(a))); walk(i + 1, acc); };
        walk(0, []); return {l: it.l, t: bt, n: bn}; }).filter(r => r.t);
      const kept = rows.slice(0, o.maxRows || 4), lines = kept.reduce((a, r) => a + r.n, 0), score = kept.length*100 + lines*8 + f*2 - V*0.03;
      if(!best || score > best.score) best = {score, f, V, LW: 0, rows: kept}; }
    return best; };
  FO.tableStack2 = (T, kicker, heading, x, y, w, hgt, slot) => { const n = Math.max(1, T.rows.length), lx = x + 18, liw = w - 36, hs = heading ? FXS.fitSize(String(heading).replace(/\.$/, ''), "font-family:Libre Franklin;font-weight:500", liw, 15, 11) : 0, top = heading ? 56 : 36, rowH = (hgt - top - 9)/n, lh = +(T.f*1.4).toFixed(2);
    let b = `<div class="br-wbox lt" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 15}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 29}pt;width:${liw}pt;font-size:${hs}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    T.rows.forEach((r, i) => { const ry = y + top + i*rowH, c0 = ry + (rowH - 11 - 3 - 2*lh)/2;
      b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .5}pt;width:${liw}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${c0 + 1}pt;width:${liw}pt;color:var(--br-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx}pt;top:${c0 + 14}pt;width:${liw + 1}pt;height:${2*lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--br-font);color:var(--fx-soft);overflow:hidden" data-slot="${slot}.list.t${i}" data-lines="2">${esc(r.t)}</div>`; });
    return `<div class="br-lt">${b}</div>`; };
  FO.table = (T, kicker, heading, x, y, w, hgt, slot) => { const n = T.rows.length, lx = x + 18, liw = w - 36, top = heading ? 58 : 36, rowH = (hgt - top - 12)/n;
    let b = `<div class="br-wbox" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 16}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 30}pt;width:${liw}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    T.rows.forEach((r, i) => { const ry = y + top + i*rowH, lh = Math.round(T.f*1.5);
      if(i) b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .4}pt;width:${liw}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${ry + rowH/2 - 5.5}pt;width:${T.LW - 8}pt;color:var(--br-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx + T.LW}pt;top:${ry + rowH/2 - lh/2}pt;width:${T.V}pt;height:${lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--br-font);color:var(--fx-soft);white-space:nowrap;overflow:hidden;" data-slot="${slot}.list.t${i}" data-lines="1">${esc(r.t)}</div>`; });
    return b; };
  // the room's card beside its big photo: a narrow panel as tall as the photo, each row its label in accent caps over one full line of true detail; the rows share the height evenly (the box is sized to its content)
  FO.tableStack = (T, kicker, heading, x, y, w, hgt, slot) => { const n = T.rows.length, lx = x + 18, liw = w - 36, hs = heading ? FXS.fitSize(String(heading).replace(/\.$/, ''), "font-family:Libre Franklin;font-weight:500", liw, 15, 11) : 0, top = heading ? 56 : 36, rowH = (hgt - top - 9)/n, lh = Math.round(T.f*1.4);
    let b = `<div class="br-wbox" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${y + 15}pt" data-slot="${slot}.box.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    if(heading) b += `<div class="abs fo-sub" style="left:${lx}pt;top:${y + 29}pt;width:${liw}pt;font-size:${hs}pt" data-slot="${slot}.box.heading" data-lines="1">${esc(String(heading).replace(/\.$/, ''))}</div>`;
    T.rows.forEach((r, i) => { const ry = y + top + i*rowH, c0 = ry + (rowH - 11 - 3 - lh)/2;
      b += `<div class="abs hr" style="left:${lx}pt;top:${ry - .5}pt;width:${liw}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx}pt;top:${c0 + 1}pt;width:${liw}pt;color:var(--br-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${lx}pt;top:${c0 + 14}pt;width:${liw}pt;height:${lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--br-font);color:var(--fx-soft);white-space:nowrap;overflow:hidden;" data-slot="${slot}.list.t${i}" data-lines="1">${esc(r.t)}</div>`; });
    return b; };

  // ---------------- INSIDE SPREAD (Black Rules, 11/16). The open brochure is ONE window: each page carries the full frame, so opened flat
  // the two fold rails meet as one 40 pt mullion down the fold and the outer rails close the window round both pages. One horizon: each
  // page's best room runs at the same height and breaks the OUTER frame (left page off the left trim, right page off the right trim); on the

  // ---------------- INSIDE SPREAD (Black Rules). The open brochure reads as one ruled sheet: the 5 pt bar runs across both pages and through
  // the fold, the 2 pt rule under the headlines (the horizon) and the 2 pt rule over the caption row run through the fold at the same heights,
  // the 4 pt bar closes both pages at one height. Between them each page is P39's grid on 8 pt gutters, every photo on the measure and
  // held 36 pt off the fold (only the bars and rules cross it).
  // LEFT: the kitchen two thirds wide with its card beside it as the sign-in sheet's ruled table (label over two full lines, hairlines
  // between rows, 2 pt rules top and foot), then two captioned rooms in a locked row with a column rule between the captions.
  // RIGHT: the best room across the full measure, its own write-up set large under it, then two captioned rooms the same way.
  FO.HZ = 150; FO.ROW = 480;
  // the page's head: the room named in the label, then the headline in Red Hat Display caps (one or two lines, 30 pt and up), centered
  FO.headB = (D, id, title, slot) => { const c = FXS.cardFor(D, id) || {}, lab = FXS.leadLabel(c.lead || FO.lead(D, id)), t = String(title || '').replace(/\.$/, '').replace(/(^| )([AaI]) /g, '$1$2 ').toUpperCase();
    const w = CW - 16, fam = `${RHD};letter-spacing:.6pt`; let f = 40; const nl = ff => FO.wrapLines(t, `${fam};font-size:${ff}pt`, w).length;
    while(f > 26 && (nl(f) > 2 || 2*f*1.06 > FO.HZ - 46 - 26)) f -= 0.5;
    const lines = nl(f), lh = +(f*1.06).toFixed(2), bh = 11 + 8 + lines*lh, y0 = 35 + (FO.HZ - 10 - 35 - bh)/2;
    return FO.k(lab.name || FO.lead(D, id), X0, y0, CW, slot + '.room', 'center')
      + `<div class="br-head" style="left:${X0 + 8}pt;top:${y0 + 19}pt;width:${w}pt;height:${lines*lh}pt;font-size:${f}pt;line-height:${lh}pt;text-wrap:balance" data-slot="${slot}.title" data-lines="${lines}" data-fine="1">${esc(t)}</div>`; };
  // the spread's rules: s = 'l' (left page: run on to the fold) or 'r' (right page: run in from the fold)
  FO.spreadRules = s => { const x = s === 'l' ? X0 : -9, w = s === 'l' ? 621 - X0 : X1 + 9;
    return FO.bar(x, 30, w, 5) + FO.r2(x, FO.HZ - 10, w) + FO.r2(x, FO.ROW, w) + FO.bar(x, FO.FOOT, w, 4); };
  // a locked row of two captioned rooms between the ROW rule and the closing bar, a column rule between the captions
  FO.row2 = (D, cs, slot0) => { const n = Math.max(1, cs.length), g = 24, W2 = (CW - (n - 1)*g)/n, y2 = FO.ROW + 12, clh = 14.5, Lc = 3, RH = FO.FOOT - 12 - y2 - 25 - Lc*clh; let h = '';
    cs.forEach((c, i) => { h += FXS.captioned(D, c, X0 + i*(W2 + g), y2, W2, RH, Lc, slot0 + i, {fs: 10.5, lh: clh, min: 3}).replace(`data-slot="${slot0}${i}" data-room`, `data-slot="${slot0}${i}" data-nopair="1" data-room`); });
    for(let i = 1; i < n; i++) h += FO.v1(X0 + i*(W2 + g) - g/2, y2 + RH + 6, FO.FOOT - 10 - (y2 + RH + 6));
    return h; };
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, C = P.br || {};
    const kid = C.left || (P.strip || []).find(id => (D.photos || {})[id]) || 'kitchen', rowC = FO.cards(D, C.leftRow || (P.left || []).filter(id => id !== kid).slice(0, 2));
    let h = FO.spreadRules('l') + FO.headB(D, kid, C.leftTitle || I.title, 'left');
    // the kitchen card: a row that only repeats what the back's lists print is left out (Night Fade's filter)
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), cwd = t => (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new', 'a', 'the', 'and', 'of', 'with', 'in'].includes(w)).map(stem), says = (b, a) => { const bw = cwd(b), aw = new Set(cwd(a)); return bw.length > 0 && bw.every(w => aw.has(w)); };
    const taken = a => /^(It|Its|They|This|That)\b/.test(a) || SW.grams4(a).some(g => backG.has(g)) || backT.some(b => says(b, a));
    const T = FO.tableRowsN((box.items || []).slice(0, 10), taken, {maxRows: 4, Vs: [184, 190, 196, 202, 208, 214, 220, 226]}), cw = T.V, cx = X1 - cw, PW = cx - 14 - X0, PY = FO.HZ, PH = FO.ROW - 12 - 20 - PY;
    h += FXS.box(D, kid, X0, PY, PW, PH, 'left.wide', '', 0);
    h += `<div class="abs" style="left:${X0}pt;top:${PY + PH + 6}pt;width:${PW}pt;white-space:nowrap"><div class="lbl" data-slot="left.wide.label" data-lines="1">${esc(FXS.leadLabel((FXS.cardFor(D, kid) || {}).lead || 'Kitchen').name.toUpperCase())}</div></div>`;
    // the card: the sign-in sheet's ruled table, as tall as the kitchen photo; each row its label over two full lines, centered in the row
    const top = 26, lh = +(T.f*1.42).toFixed(2), tot = T.rows.reduce((a, r) => a + 15 + r.n*lh, 0), gap = (PH - top - 2 - tot)/Math.max(1, T.rows.length);
    let b = FO.bar(cx, PY, cw, 4) + FO.k(box.kicker || 'The kitchen', cx, PY + 10, cw, 'left.box.kicker'), ry = PY + top;
    T.rows.forEach((r, i) => { const rh = 15 + r.n*lh + gap, c0 = ry + gap/2;
      b += FO.r1(cx, ry, cw);
      b += `<div class="abs fo-li-l" style="left:${cx}pt;top:${c0}pt;width:${cw}pt;color:var(--br-accent)" data-slot="left.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${cx}pt;top:${c0 + 15}pt;width:${cw + 1}pt;height:${r.n*lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--br-font);color:#1f1f1f;overflow:hidden;text-align:justify;text-align-last:left" data-slot="left.list.t${i}" data-lines="${r.n}">${esc(r.t)}</div>`; ry += rh; });
    h += b + FO.r2(cx, PY + PH - 2, cw);
    h += FO.row2(D, rowC, 'left.photo');
    return h;
  };
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, C = P.br || {};
    const ids = C.right ? [C.right].concat(C.rightRow || []) : (P.right || []), cs = FO.cards(D, ids), top = cs[0], rest = cs.slice(1, 3);
    let h = FO.spreadRules('r') + FO.headB(D, top.photo, C.rightTitle || R.title, 'right');
    const wl = 20, nw = 3, PH = FO.ROW - 12 - nw*wl - 12 - FO.HZ;
    h += FXS.box(D, top.photo, X0, FO.HZ, CW, PH, 'right.wide', '', 0);
    const c0 = FXS.augment(D, top), wy = FO.HZ + PH + 10;   // the room's own write-up set large, as the page's lead
    h += `<div class="abs cap"><div class="a" style="position:absolute;left:${X0}pt;top:${wy}pt;width:${CW}pt;height:${nw*wl}pt;font-size:13.5pt;line-height:${wl}pt;color:#1f1f1f" data-slot="right.photo0" data-room="${esc(FXS.leadLabel(top.lead).name)}" data-lh="${wl}" data-hbox="${nw*wl}" data-lines="${nw}" data-min="3" data-narrow="0" ${FXS.sd(c0.s)}></div></div>`;
    h += FO.row2(D, rest, 'right.photo').replace(/right\.photo(\d)/g, (m, d) => 'right.photo' + (+d + 1));
    return h;
  };
  FO.rightFit = () => {}; FO.leftHead = () => {};

  // ---------------- BACK (fold-over) and flyer back ----------------
  // The 5 pt bar; the listing's own plan in a box its own shape with "Floor by floor" and the write-up beside it (no plan: the big outdoor
  // photo and its write-up); the lists as two ruled columns (2 pt rules top and foot, hairline rows, a column rule); Nearby on the
  // back's one slab: the kit's dark across the measure, the distances as big white figures; the 4 pt bar; the half-height contact card;
  // the fine print.
  FO.NB = 64;
  FO.nearSlab = (D, y, x0, w) => { const N = ((D.sw || {}).back || {}).nearby || [], n = Math.min(3, N.length), g = 8, cw = (w - (n - 1)*g)/Math.max(1, n); let h = '';
    N.slice(0, n).forEach((nn, i) => { const cx = x0 + i*(cw + g), m = /^([\d.,]+)\s*(.*)$/.exec(String(nn.dist).trim()) || [0, nn.dist, ''], num = m[1], unit = String(m[2] || '').toUpperCase(), pl = String(nn.place).toUpperCase();
      const pf = FXS.fitSize(pl, `${LF};font-weight:700;letter-spacing:1.4pt`, cw - 20, 9.5, 8.6), nf = 26, uw = FXS.width(unit, `${LF};font-weight:700;letter-spacing:1.2pt;font-size:8.6pt`), nw = FXS.width(num, `${RHD};font-size:${nf}pt`), bw = nw + 6 + uw, top = y + (FO.NB - nf*1.0 - 6 - 12)/2;
      h += `<div class="br-slab" style="left:${cx}pt;top:${y}pt;width:${cw}pt;height:${FO.NB}pt"></div>`;
      h += `<div class="abs" style="left:${cx + (cw - bw)/2}pt;top:${top}pt;width:${bw + 2}pt;height:${nf}pt;white-space:nowrap;line-height:${nf}pt"><span style="${RHD};font-size:${nf}pt;color:#fff" data-slot="back.near${i}" data-lines="1">${esc(num)}</span><span style="${LF};font-weight:700;font-size:8.6pt;letter-spacing:1.2pt;color:#fff;margin-left:6pt">${esc(unit)}</span></div>`
        + `<div class="br-ml" style="left:${cx}pt;top:${top + nf + 6}pt;width:${cw}pt;height:12pt;font-size:${pf}pt;line-height:12pt;letter-spacing:1.4pt;color:#fff" data-slot="back.near${i}.p" data-lines="1">${esc(pl)}</div>`; });
    return {html: h, y: y + FO.NB}; };
  FO.planBox = (D, x, y, maxH, maxW) => { const A = D.plan.turn && D.plan.kind === 'color' ? 270 : undefined, rot = !!D.plan.turn, noteW = Math.ceil(FXS.width((D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate.', 'font-family:Libre Franklin;font-size:8pt')) + 34;
    const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: rot ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: rot, angle: A}); let cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 40, D.plan.minCard || 0, noteW, 188));
    for(let hh = maxH; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: cw - 28.8, h: hh}, {allowRotate: rot, angle: A}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')){ if(big.usedW) cw = Math.min(cw, Math.max(Math.ceil(big.usedW) + 40, D.plan.minCard || 0, noteW, 188)); break; } }
    return FXS.planCard(D, x, y, cw, maxH); };
  FO.CARD_H = 62;
  // the standard contact card on the white paper (P39's foot: the agent at left, the brokerage at right), the logo as given
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = BR.logoPaper(D);
    const pw = 180, lh = Math.min(46, H - 30), s = {name: 17, nameFloor: 13, line: 8.6, rowGap: 10, phone: 12, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div class="br-ccw" style="--cc-display:'Red Hat Display';--cc-body:'Libre Franklin'">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true}) + '</div>'; };
  FO.fine = (D, x, y, w) => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${x}pt;top:${y}pt;width:${w}pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, C = P.br || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? (C.flyerTop || (P.backNoplan || [])[0]) : (C.backTop || (P.backNoplan || [])[0]);
    const footId = hasPlan ? topId : flyer ? C.flyerFootNoplan : C.backFootNoplan;
    const L0 = X0, R0 = X1, CWb = R0 - L0, TOP = 48, fineY = 756, CARD_Y = fineY - 8 - FO.CARD_H, BAR4 = CARD_Y - 12;
    let h = FO.bar(L0, 30, CWb, 5), top, leftW;
    const LV = hasPlan ? (D.plan.levels || []) : [], tall = hasPlan && (LV.length >= 4 || (LV.length === 1 && LV[0].h/LV[0].w > 1.5));
    const BT = BAR4 - 10 - FO.NB;   // the Nearby slab
    const TH = tall ? BT - 14 - (14 + 4*22 + 14) - 14 - TOP - 30 : BT - 14 - 190 - 14 - TOP - 30;
    if(hasPlan){ const pc = FO.planBox(D, L0, TOP, TH, tall ? 290 : 340); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom; leftW = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1])); }
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    if(!hasPlan){ const tph = 250; leftW = 290; const c = FXS.cardFor(D, topId); h += FXS.captioned(D, c, L0, TOP, leftW, tph, 3, 'back.top', {fs: 10.5, lh: 14, min: 3}); top = TOP + tph + 25 + 3*14; }
    const used = FO.cards(D, [topId, footId].filter(Boolean));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s)), ax = L0 + leftW + 22, aw = R0 - ax;
    const kickT = +(D.listing || {}).stories > 1 ? 'Floor by floor' : 'Room by room';
    const hfam = `${RHD};letter-spacing:.5pt;text-transform:uppercase`, ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, '').toUpperCase(), HT = ht ? FO.fitTitle(ht, hfam, aw - 2, 24, 15, 2) : {f: 0, w: aw}, hf = Math.min(24, HT.f), HL = ht ? FO.wrapLines(ht, `${hfam};font-size:${hf}pt`, HT.w) : [], hn = HL.length, HW = HL.length ? Math.max(...HL) : aw, hlh = hf*1.1, hh = ht ? hn*hlh + 16 : 0;
    const head = y => FO.k(kickT, ax, y, aw, 'back.about.title') + (ht ? `<div class="br-head" data-tall="1" style="left:${ax}pt;top:${y + 17}pt;width:${Math.ceil(HW) + 3}pt;height:${hn*hlh}pt;font-size:${hf}pt;line-height:${hlh}pt;text-align:left;letter-spacing:.5pt" data-slot="back.about.head" data-lines="${hn}">${esc(ht)}</div>` : '');
    if(tall){
      const c0 = FXS.cardFor(D, footId || topId), PHt = 112, lh = 15, yE = TOP + PHt + 25 + 3*13.5 + 14, T0 = yE + 18 + hh, Rr = top - T0 - 9, N = Math.max(6, Math.floor(Rr/lh));
      if(c0) h += FXS.captioned(D, c0, ax, TOP, aw, PHt, 3, 'back.photo0', {fs: 10.25, lh: 13.5, min: 3});
      h += head(yE).replace('class="br-k"', 'class="br-k" data-tall="1"');
      const para = (list, y, n, slot) => FO.wu(list, ax, y, aw, n*lh + 0.01, slot, 10.5, lh, 'body').replace(`data-slot="${slot}"`, `data-slot="${slot}" data-narrow="0" data-fill="0.9" data-lfill="0.8" data-rag="1" data-tall="1" data-para="1"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
      h += para(keep(f2.concat(f1)), T0, N, 'back.about');
      h += `<div data-tallcol="${top}" style="display:none"></div>`;
    } else {
      const T0 = TOP + 20 + hh, n = Math.floor((top - T0)/16), lh = +((top - T0)/n).toFixed(3);
      h += head(TOP + 2) + FO.full(FO.wu(keep(f2.concat(f1)), ax, T0, aw, n*lh + 0.01, 'back.about', 10.75, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${aw < 240 ? ' data-rag="1"' : ''} data-span="${(top - T0).toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
    }
    const BOXB = BT - 14, footC = !tall && footId ? FXS.cardFor(D, footId) : null;
    // the lists: the sign-in sheet's ruled columns (2 pt rules top and foot, a dark square and a hairline on every row)
    if(footC){   // no plan: the two lists stacked, the second captioned photo beside them, one height
      const by = top + 18, BH = BOXB - by, PW = 228, BW = R0 - L0 - PW - 22, cw = BW; let t = FO.r2(L0, by, BW) + FO.r2(L0, BOXB - 2, BW);
      const n1 = Math.min(c1.length, 4), n2 = Math.min(c2.length, 4), rh = Math.min(24, (BH - 26 - 2*19 - 12)/(n1 + n2)), ch = 18 + n1*rh + 12 + 18 + n2*rh; let y = by + Math.max(12, (BH - ch)/2);
      t += `<div class="br-wl" style="left:${L0}pt;top:${y}pt;width:${cw}pt" data-slot="back.updates.title" data-lines="1">${esc(t1.toUpperCase())}</div>` + FXS.bullets(c1, L0, y + 18, cw, rh, 'back.updates', n1, 10).html; y += 18 + n1*rh + 12;
      t += `<div class="br-wl" style="left:${L0}pt;top:${y}pt;width:${cw}pt" data-slot="back.outside.title" data-lines="1">OUTSIDE</div>` + FXS.bullets(c2, L0, y + 18, cw, rh, 'back.outside', n2, 10).html;
      h += t + FXS.captioned(D, footC, R0 - PW, by, PW, BH - 25 - 3*14, 3, 'back.photo1', {fs: 10.75, lh: 14, min: 3});
    } else {   // the two lists side by side across the measure, a column rule between them
      const g = 28, cw = (CWb - g)/2, nr = Math.max(Math.min(c1.length, 4), Math.min(c2.length, 4), 2), rh = 22, BH = 12 + 19 + nr*rh + 10, by = BOXB - BH;
      let t = FO.r2(L0, by, CWb) + FO.r2(L0, BOXB - 2, CWb) + FO.v1(L0 + cw + g/2, by + 12, BH - 22);
      t += `<div class="br-wl" style="left:${L0}pt;top:${by + 12}pt;width:${cw}pt" data-slot="back.updates.title" data-lines="1">${esc(t1.toUpperCase())}</div>` + FXS.bullets(c1, L0, by + 31, cw, rh, 'back.updates', 4, 10).html;
      t += `<div class="br-wl" style="left:${L0 + cw + g}pt;top:${by + 12}pt;width:${cw}pt" data-slot="back.outside.title" data-lines="1">OUTSIDE</div>` + FXS.bullets(c2, L0 + cw + g, by + 31, cw, rh, 'back.outside', 4, 10).html;
      h += t;
    }
    h += FO.nearSlab(D, BT, L0, CWb).html;
    h += FO.bar(L0, BAR4, CWb, 4) + FO.contact(D, L0, CARD_Y, CWb, FO.CARD_H) + FO.fine(D, L0, fineY, CWb);
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
