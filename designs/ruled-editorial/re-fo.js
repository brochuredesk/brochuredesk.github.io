/* Ruled Editorial fold-over and two-sided flyer builders (grown from the FXS-14 builders; the hand is the approved Open House library
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
    if(worst > sp*(el.closest('.cap') ? 4.2 : 3.2)) el.style.textAlign = 'left'; });   // a caption stays justified to its photo's edge unless a gap opens past 4 spaces
  FO.fill3Check = () => [...document.querySelectorAll('[data-j3]')].filter(el => el.textContent.trim()).flatMap(el => { const L = SW.lines(el);
    return L.n < 3 ? [{slot: el.dataset.slot, kind: 'writeup-under-3-lines', lines: L.n}] : L.fill < 0.895 ? [{slot: el.dataset.slot, kind: 'writeup-last-line-short', pct: Math.round(L.fill*100)}] : []; });

  // Ruled Editorial: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Ruled Editorial refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:Epilogue;letter-spacing:3.4pt", HW, 24, 13, 5), lh = T.f*1.3, H = 17 + T.n*lh + 9 + 1.2, y = 30 + (270 - 30 - H)/2;
    kk.style.top = y + 'pt'; ti.style.top = (y + 17) + 'pt'; ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = (T.n*lh) + 'pt'; ti.dataset.lines = T.n; ru.style.top = (y + 17 + T.n*lh + 9) + 'pt'; };
  // after the fill: the cover write-up sits on the frame's foot; the rooms above it grow down into any room it did not use (no empty band)
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = 766 - n*lh;
    const lbls = [...document.querySelectorAll('[data-slot^="front.strip"][data-slot$=".label"]')]; if(!lbls.length) return; const lb = Math.max(...lbls.map(l => parseFloat(l.style.top) + 11)), d = top - 16 - lb; su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt'; if(d <= 0) return;
    lbls.forEach(l => { l.style.top = (parseFloat(l.style.top) + d) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ================= Ruled Editorial geometry and pages (pt, panel trim 612 x 792) =================
  // P01's grid: a 0.5 in margin (text 0.5 in clear of the fold), full-measure 1.2 pt ink rules that divide every page into decks, crisp
  // photos on the margins of that grid. No frame: FO.frame draws nothing (the rules are the structure).
  const M = 36, X0 = M, X1 = 612 - M, CW = X1 - X0, G = 14;
  const FR = [X0, 30, X1, 766];
  FO.FR = FR; FO.X0 = X0; FO.X1 = X1; FO.CW = CW; FO.G = G;
  FO.frame = () => '';
  FO.rule = (x, y, w, slot) => `<div class="re-rule" style="left:${x}pt;top:${y}pt;width:${w}pt"${slot ? ` data-role="${slot}"` : ''}></div>`;
  FO.vrule = (x, y, h) => `<div class="re-rule v" style="left:${x}pt;top:${y}pt;height:${h}pt"></div>`;
  // the huge caps line of P01: Epilogue 600, tracking -0.03em; its width at size s
  const HLCSS = s => `font-family:Epilogue;font-weight:600;letter-spacing:-0.03em;font-size:${s}pt`;
  FO.hlW = (t, s) => FXS.width(String(t).toUpperCase(), HLCSS(s));
  // the largest size (max .. min, 0.5 steps) at which every line fits its measure
  FO.hlSize = (lines, widths, max, min) => { let s = max; while(s > min && lines.some((t, i) => t && FO.hlW(t, s) > widths[i] - 1)) s -= 0.5; return s; };
  const JOINCSS = f => `font-family:Hanken;font-weight:500;font-size:${f}pt`;
  // a phrase as two balanced lines (the join beside the second display line: "You're / invited")
  FO.twoLines = t => { const w = String(t || '').replace(/\.$/, '').split(/\s+/).filter(Boolean); if(w.length < 2) return [w.join(' '), ''];
    let best = null; for(let i = 1; i < w.length; i++){ const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), d = Math.max(FXS.width(a, JOINCSS(12)), FXS.width(b, JOINCSS(12))); if(!best || d < best.d) best = {a, b, d}; } return [best.a, best.b]; };
  // the two display lines of a headline: the split (whole words) that sets the largest; a line never ends on a small word
  const WEAK = /^(a|an|the|and|of|with|to|in|on|at|by|for|from|or|up|is)$/i;
  FO.splitHl = (title, w1, w2, max, min) => { const w = String(title || '').replace(/\.$/, '').toUpperCase().split(/\s+/).filter(Boolean); let best = null;
    for(let i = 1; i < w.length; i++){ if(WEAK.test(w[i - 1])) continue; const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), s = FO.hlSize([a, b], [w1, w2], max, min); if(!best || s > best.s + 0.01 || (Math.abs(s - best.s) < 0.01 && Math.abs(FO.hlW(a, s) - FO.hlW(b, s)) < Math.abs(FO.hlW(best.a, s) - FO.hlW(best.b, s)))) best = {a, b, s}; }
    // a comma is the natural break: taken when it sets within 12% of the best size
    for(let i = 1; i < w.length; i++){ if(!/,$/.test(w[i - 1]) || !best) continue; const a = w.slice(0, i).join(' '), b2 = w.slice(i).join(' '), s = FO.hlSize([a, b2], [w1, w2], max, min); if(s >= best.s*0.8) return {a, b: b2, s}; }
    return best || {a: w.join(' '), b: '', s: FO.hlSize([w.join(' ')], [w1], max, min)}; };
  // THE signature, used structurally on every page: rule / line one flush left / rule / the join (two small lines in the main color)
  // and line two flush right / rule. y is the first rule; s the size; ext: how far the rules run past the margins ({l, r} in pt, so a rule
  // can cross the fold to meet its match on the facing page). Returns {html, y: the last rule's foot}.
  FO.deck = (o) => { const s = o.s, x0 = o.x0 == null ? X0 : o.x0, x1 = o.x1 == null ? X1 : o.x1, rl = x0 - ((o.ext || {}).l || 0), rr = x1 + ((o.ext || {}).r || 0), y = o.y;
    const hl = (t, top, al, slot) => `<div class="re-hl" style="left:${x0 - (al === 'left' ? 0.06*s : 0)}pt;top:${top}pt;width:${x1 - x0 + 0.06*s}pt;height:${0.96*s}pt;font-size:${s}pt;line-height:${0.923*s}pt;text-align:${al}" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`;
    let h = FO.rule(rl, y, rr - rl) + hl(o.l1, y + 0.04*s, 'left', o.slot + '.l1');
    if(o.l2 != null){
      h += FO.rule(rl, y + s, rr - rl) + hl(o.l2, y + s + 0.04*s, 'right', o.slot + '.l2');
      const j = (o.join || []).filter(Boolean); if(j.length){ const top = !!o.joinTop, room = x1 - x0 - FO.hlW(top ? o.l1 : o.l2, s) - 18, jf = Math.min(o.jmax || 15, Math.max(10, s*0.16)); let f = jf; while(f > 9 && j.some(t => FXS.width(t, JOINCSS(f)) > room)) f -= 0.25;
        // joinTop (owner 11/17, Just Listed fronts): the join sits flush right in line one's band, in the room the short first line leaves
        const jh = j.length*f*1.2, jy = (top ? y : y + s) + 0.47*s - jh/2, jx = top ? x1 - Math.max(40, room) : x0;
        if(f >= 9) j.forEach((q, i) => { h += `<div class="re-join" style="left:${jx}pt;top:${jy + i*f*1.2}pt;width:${Math.max(40, room)}pt;height:${f*1.2}pt;font-size:${f}pt;line-height:${f*1.2}pt${top ? ';text-align:right' : ''}" data-slot="${o.slot}.join${i}" data-lines="1">${esc(q)}</div>`; }); }
      h += FO.rule(rl, y + 2*s, rr - rl); return {html: h, y: y + 2*s + 1.2}; }
    h += FO.rule(rl, y + 0.9*s, rr - rl); return {html: h, y: y + 0.9*s + 1.2}; };
  // a one-line deck with the join on the left and the line flush right (the second half of P01's headline on its own)
  FO.deck1 = (o) => { const s = o.s, x0 = o.x0 == null ? X0 : o.x0, x1 = o.x1 == null ? X1 : o.x1, y = o.y;
    let h = FO.rule(x0, y, x1 - x0) + `<div class="re-hl" style="left:${x0}pt;top:${y + 0.04*s}pt;width:${x1 - x0 + 0.06*s}pt;height:${0.96*s}pt;font-size:${s}pt;line-height:${0.923*s}pt;text-align:right" data-slot="${o.slot}" data-lines="1">${esc(String(o.t).toUpperCase())}</div>`;
    const j = (o.join || []).filter(Boolean); if(j.length){ const room = x1 - x0 - FO.hlW(o.t, s) - 18; let f = Math.min(13, Math.max(10, s*0.2)); while(f > 9 && j.some(t => FXS.width(t, JOINCSS(f)) > room)) f -= 0.25;
      const jh = j.length*f*1.2; j.forEach((q, i) => { h += `<div class="re-join" style="left:${x0}pt;top:${y + 0.49*s - jh/2 + i*f*1.2}pt;width:${Math.max(40, room)}pt;height:${f*1.2}pt;font-size:${f}pt;line-height:${f*1.2}pt" data-slot="${o.slot}.join${i}" data-lines="1">${esc(q)}</div>`; }); }
    return {html: h + FO.rule(x0, y + s, x1 - x0), y: y + s + 1.2}; };
  // the facts line of P01: Hanken bold caps justified across the measure, middots between
  FO.factsItems = L => { const it = FXS.statItems(L).filter(x => !/^Built/.test(x)); const yr = L.yearBuilt || L.year; if(yr) it.push('Built ' + yr); return it; };
  // the facts line of P01: Hanken bold caps run across the measure, the facts spread apart with middots between them (each fact kept whole)
  FO.factsLine = (L, x, y, w, slot, max, items) => { const it = (items || FO.factsItems(L)).map(t => String(t).toUpperCase()), t = it.join('  ·  '); let f = max || 10.5; while(f > 8.6 && FXS.width(t, `font-family:Hanken;font-weight:700;letter-spacing:.6pt;font-size:${f}pt`) > w - 24) f -= 0.25;
    const parts = it.flatMap((q, i) => i ? [`<span style="opacity:.55">·</span>`, `<span>${esc(q)}</span>`] : [`<span>${esc(q)}</span>`]).join('');
    return `<div class="re-facts" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${f*1.4}pt;font-size:${f}pt;line-height:${f*1.4}pt;display:flex;justify-content:space-between;text-align:left" data-slot="${slot}" data-lines="1">${parts}</div>`; };
  FO.place = L => [FXS.hood(L), FXS.placeLine(L)].filter(Boolean);
  // a photo tile with its name under it (no caption text)
  FO.tileC = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs fo-tile-l" style="left:${x}pt;top:${y + h + 6}pt;width:${w}pt" data-slot="${slot}.label" data-lines="1">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div>`;
  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  FO.fitTitle = (t, fam, w, max, min, maxLines) => { for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w)) return {f, n: L.length, w}; } return {f: min, n: FO.wrapLines(t, `${fam};font-size:${min}pt`, w).length, w}; };
  // the standard contact card in P01's hand: on the paper, the agent left, the brokerage panel right with the kit's own logo; half height (owner 11/15)
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = RE.logoSrc(D); const pw = 180, lh = Math.min(46, H - 22), s = {name: 18, nameFloor: 15, hsW: Math.round(H*0.8), panelW: pw, inlineLabel: true, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 22, H - 22], tall: [H - 20, H - 20]}};
    return `<div style="--cc-display:Epilogue;--cc-body:Hanken">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5}) + '</div>'; };

  // Design pass 11/15: a dusk exterior of the same house is the hero when the listing has one (photos.<id>.dusk)
  FO.heroId = (D, id) => { const ph = D.photos || {}, sp = SW.space(D, id); if((ph[id] || {}).dusk) return id; const d = Object.keys(ph).find(k => ph[k].dusk && ph[k].fullHouse && SW.space(D, k) === sp); return d || id; };
  FO.isDusk = (D, id) => !!((D.photos || {})[id] || {}).dusk;
  // the tallest frame of width w (from hMax down) that keeps the whole house
  FO.fitH = (D, id, w, hMax, hMin) => { let h = hMax; while(h > hMin && !SW.fits(D, id, w, h)) h -= 4; return h; };

  // ---------------- COVER (fold-over front: no agent, no brokerage) ----------------
  // A magazine cover: P01's masthead set from the street (its name on line one, the number flush right on line two with the place
  // as the join), the facts justified across the measure, the cover line, then the whole house bleeding off three edges.
  FO.front = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, hero = FO.heroId(D, F.hero || K.hero || 'front');
    const ad = String(L.address || ''), m = /^(\S+)\s+(.*)$/.exec(ad) || [ad, '', ad], num = m[1], name = m[2];
    const s = FO.hlSize([name, num], [CW, CW - 150], 112, 40), dk = FO.deck({y: 30, s, l1: name, l2: num, join: FO.place(L), slot: 'front.mast'});
    let t = dk.html, y = dk.y + 9;
    t += FO.factsLine(L, X0, y, CW, 'front.facts', 11); y += 11*1.4 + 8;
    t += FO.rule(X0, y, CW); y += 1.2;
    // the hero: as tall as its whole house allows, bleeding off the sides and the foot; the cover line takes the room above it
    const HB = 801, line0 = String(K.line || '').trim(), hh = FO.fitH(D, hero, 630, HB - y - (line0 ? 46 : 12), 300), HY = HB - hh;
    const line = String(K.line || '').replace(/\.$/, ''), room = HY - 12 - y;
    if(line && room >= 30){ const ls = Math.min(28, FXS.fitSize(line, 'font-family:Epilogue;font-weight:600;letter-spacing:-0.012em', CW, 28, 15), room*0.62);
      t += `<div class="re-street" style="left:${X0}pt;top:${y + (room - ls*1.25)/2}pt;width:${CW}pt;height:${ls*1.25}pt;font-size:${ls}pt;line-height:${ls*1.25}pt" data-slot="front.line" data-lines="1">${esc(line)}</div>`; }
    const h = SW.heroHtml(D, hero, -9, HY, 630, hh, 'front.house', []);
    return h + t;
  };

  // ---------------- FLYER FRONT: its own composition in the same hand ----------------
  // The whole street as one huge caps line between rules (P01's headline set from the address), then two columns: the house (as wide as
  // its whole roof and sides allow) and, beside it, the place over a ruled stack of the facts set as Epilogue numerals; then the rooms
  // row and the write-up between rules.
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hero = FO.heroId(D, F.hero || K.hero || 'front'), ad = String(L.address || '');
    const s = FO.hlSize([ad], [CW], 70, 30), dk = FO.deck({y: 30, s, l1: ad, slot: 'front.mast'});
    let t = dk.html, y0 = dk.y + 12;
    const cw2 = 168, hw = CW - cw2 - G - 12, hh = FO.fitH(D, hero, hw, 360, 200);
    let h = SW.heroHtml(D, hero, X0, y0, hw, hh, 'front.house', []);
    const rx = X1 - cw2, pl = FO.place(L);
    t += FO.vrule(rx - 13, y0, hh);
    t += `<div class="re-place" style="left:${rx}pt;top:${y0 - 1}pt;width:${cw2}pt;height:13pt;font-size:9pt;line-height:13pt" data-slot="front.place" data-lines="1">${esc((pl[0] || '').toUpperCase())}</div>`;
    t += `<div class="re-place" style="left:${rx}pt;top:${y0 + 12}pt;width:${cw2}pt;height:13pt;font-size:9pt;line-height:13pt" data-slot="front.place2" data-lines="1">${esc((pl[1] || '').toUpperCase())}</div>`;
    const items = FO.factsItems(L).map(x => { const m = /^Built (\d{4})$/.exec(x); return m ? {n: m[1], l: 'Built'} : FXS.statParts(x); }), fy0 = y0 + 34, rh = (hh - 34)/Math.max(1, items.length);
    items.forEach((p, i) => { const ry = fy0 + i*rh, ns = Math.min(40, rh*0.62);
      t += FO.rule(rx, ry, cw2).replace('re-rule', i ? 're-hair' : 're-rule');
      t += `<div class="re-num" style="left:${rx}pt;top:${ry + (rh - ns*1.05 - 12)/2}pt;width:${cw2}pt;height:${ns*1.05}pt;font-size:${ns}pt;line-height:${ns*1.05}pt" data-slot="front.fact${i}" data-lines="1">${esc(p.n)}</div>`;
      t += `<div class="re-kick" style="left:${rx}pt;top:${ry + (rh - ns*1.05 - 12)/2 + ns*1.05}pt;width:${cw2}pt" data-slot="front.fact${i}.l" data-lines="1">${esc(p.l)}</div>`; });
    let y = y0 + hh + 12; t += FO.rule(X0, y, CW); y += 13;
    const strip = (o.strip || P.flyerStrip || P.strip || []).filter(id => (D.photos || {})[id]).slice(0, 3), n = Math.max(1, strip.length), sw_ = (CW - (n - 1)*G)/n;
    const wuLines = 4, wlh = 17.5, SH = 766 - y - 24 - 14 - wuLines*wlh - 10;
    strip.forEach((id, i) => { h += FO.tileC(D, id, X0 + i*(sw_ + G), y, sw_, SH, 'front.strip' + i); });
    const wy = y + SH + 24 + 10; t += FO.rule(X0, wy - 8, CW).replace('re-rule', 're-hair');
    t += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${wuLines}" data-try="${wuLines},${wuLines - 1}" data-lh="${wlh}" ${FXS.sd(intro)} style="left:${X0}pt;top:${wy}pt;width:${CW}pt;height:${wuLines*wlh}pt;font-size:11.5pt;line-height:${wlh}pt"></div>`);
    return h + t;
  };
  // hero crops go tighter on the subject house, never under 300 ppi (the pilot's FO.tighten, unchanged)
  FO.tighten = (D, m) => { m = m == null ? 0.05 : m; document.querySelectorAll('.ph[data-photo]').forEach(el => { if(!/^front\.(house|hero)$/.test(el.dataset.slotPhoto || '')) return; const p = (D.photos || {})[el.dataset.photo], img = el.querySelector('img'); if(!p || !p.box || !img || !p.w || !p.h) return;
    const W = p.w, H = p.h, tw = el.clientWidth, th = el.clientHeight, ia = W/H, ta = tw/th, vis = ia > ta ? {w: ta/ia, h: 1} : {w: 1, h: ia/ta};
    const ppi1 = W*vis.w/(tw/96), zmax = ppi1/300;
    const [x0, y0, x1, y1] = p.box, z = Math.min(1.5, zmax, vis.w/((x1 - x0) + 2*m), vis.h/((y1 - y0) + 2*m)); if(!(z > 1.03)) return;
    const op = (img.style.objectPosition || '50% 50%').split(' ').map(v => parseFloat(v)/100), px = isNaN(op[0]) ? .5 : op[0], py = isNaN(op[1]) ? .5 : op[1];
    const place = (c, v, p0) => { const lo = (1 - v)*p0, start = Math.min(Math.max(c - v/(2*z), lo), lo + v - v/z); return (start - lo)/v; };
    const sx = place((x0 + x1)/2, vis.w, px), sy = place((y0 + y1)/2, vis.h, py);
    img.style.cssText = `position:absolute;max-width:none;width:${z*100}%;height:${z*100}%;left:${-sx*z*100}%;top:${-sy*z*100}%;object-fit:cover;object-position:${px*100}% ${py*100}%`; }); };

  // ---------------- INSIDE SPREAD: one horizon ----------------
  // Both pages open with P01's headline deck at one size, the three rules at the same heights running through the fold to meet their
  // match on the facing page (the fold is scored; nothing else crosses it, photos stop 0.5 in short). The eyebrow is the join.
  FO.WW = Math.round((CW - 25)*0.655);
  FO.spread = D => { if(FO._sp) return FO._sp; const K = D.sw || {}, I = K.left || {}, R = K.right || {};
    const jw = k => Math.max(...FO.twoLines(k).map(t => FXS.width(t, JOINCSS(12)))) + 18;
    const a = FO.splitHl(I.title, CW, CW - jw(I.kicker), 60, 30), b = FO.splitHl(R.title, CW, CW - jw(R.kicker), 60, 30), s = Math.min(a.s, b.s);
    return (FO._sp = {s, left: a, right: b}); };
  const kickRep = (kicker, title) => { const words = q => new Set((String(q).toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length > 2 && !['the', 'and', 'with'].includes(w))), kw = [...words(kicker)], tw = words(title); return kw.length > 0 && kw.every(w => tw.has(w) || tw.has(w.replace(/s$/, '')) || tw.has(w + 's')); };
  FO.spreadDeck = (D, side) => { const K = D.sw || {}, S = FO.spread(D), I = K[side] || {}, sp = S[side], join = kickRep(I.kicker, I.title) ? [] : FO.twoLines(I.kicker);
    return FO.deck({y: 30, s: S.s, l1: sp.a, l2: sp.b, join, slot: side + '.title', ext: side === 'left' ? {r: M + 9} : {l: M + 9}}); };

  // ---------------- INSIDE LEFT: the kitchen ----------------
  // The kitchen photo across the full measure with its caption, a rule, then the kitchen card (P01's white event box with the thin ink
  // line: the room's real detail, or the one-story's "What's new" story, one full line a row) beside one more captioned room.
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, cs = FO.cards(D, P.left || []);
    const kid = (P.strip || []).find(id => (D.photos || {})[id] && /kitchen/.test(id)) || (P.strip || []).find(id => (D.photos || {})[id]) || (cs[0] || {}).photo, rowC = cs.filter(c => c.photo !== kid);
    const dk = FO.spreadDeck(D, 'left'); let h = dk.html; const Y = dk.y + 12;
    // the same two columns as the facing page (a column rule at one place on both): the kitchen big in the wide column with its caption,
    // one more room in the narrow column beside it
    const kc = FXS.cardFor(D, kid) || {photo: kid, lead: 'Kitchen.', s: []}, CL = 3, clh = 15.5, PH = 262, ww = FO.WW, nx = X0 + ww + 25, nw = X1 - nx;
    h += FXS.captioned(D, kc, X0, Y, ww, PH, CL, 'left.wide', {fs: 11, lh: clh, min: 3});
    const ry = Y + PH + 25 + CL*clh + 12, side = rowC.length > 1 ? rowC[0] : null, L3 = 5, lh3 = 13;
    h += FO.vrule(X0 + ww + 12, Y, ry - 12 - Y);
    if(side) h += FXS.captioned(D, side, nx, Y, nw, ry - 12 - Y - 25 - L3*lh3, L3, 'left.photo1', {fs: 9.5, lh: lh3, min: 3});
    h += FO.rule(X0, ry, CW);
    // the card: rows on one full line each (the night-fade repeat filter: only what the back's lists print counts as a repeat; a two-word
    // list item repeats only when both its words are in the row; a row never opens on a pronoun)
    const colW = Math.round((CW - G)*0.6), V = colW - 28, tcss = 'font-family:Hanken;font-weight:400;font-size:10.5pt';
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside && BXb.inside.items) || SFb.inside, (BXb.outside && BXb.outside.items) || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const oneLine = it => { const S = (it.s || []).map(x => [].concat(x).filter(a => !SW.grams4(a).some(g => backG.has(g)) && !backT.some(b => SW.sameFact(b, a) && (b.split(/\s+/).length >= 3 || b.toLowerCase().split(/\s+/).every(w => a.toLowerCase().includes(w)))))).filter(a => a.length); let best = '';
      const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(t && !/^(It|Its|They|This|That)\b/.test(t) && t.length > best.length && FXS.width(t, tcss) <= V - 2 && !SW.sameFactIn(t)) best = t; return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
      walk(0, []); return best; };
    const by = ry + 13, BH = 766 - by;
    let rows = (box.items || []).slice(0, 8).map(it => [it, oneLine(it)]).filter(x => x[1] && FXS.width(x[1], tcss) >= 0.72*V);
    const fit = Math.max(3, Math.floor((BH - 58)/36)); rows = rows.slice(0, Math.min(fit, 6));
    let b = `<div class="re-card" style="left:${X0}pt;top:${by}pt;width:${colW}pt;height:${BH}pt"></div>`;
    b += `<div class="abs fo-kick" style="left:${X0 + 14}pt;top:${by + 12}pt" data-slot="left.box.kicker" data-lines="1">${esc(String(box.kicker || 'The kitchen').toUpperCase())}</div>`;
    const hd = String(box.heading || '').replace(/\.$/, ''), hs = hd ? FXS.fitSize(hd, 'font-family:Epilogue;font-weight:600;letter-spacing:-0.012em', V, 17, 11) : 0;
    if(hd) b += `<div class="abs fo-sub" style="left:${X0 + 14}pt;top:${by + 25}pt;width:${V}pt;height:${hs*1.3}pt;font-size:${hs}pt;line-height:${hs*1.3}pt" data-slot="left.box.heading" data-lines="1">${esc(hd)}</div>`;
    const top = by + (hd ? 52 : 34), rH = (by + BH - 8 - top)/Math.max(1, rows.length);
    rows.forEach(([it, txt], i) => { const yy = top + i*rH, c0 = yy + (rH - 11 - 2 - 15)/2;
      b += `<div class="abs hr" style="left:${X0 + 14}pt;top:${yy}pt;width:${V}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${X0 + 14}pt;top:${c0}pt;width:${V}pt" data-slot="left.list.l${i}" data-lines="1">${esc(it.l)}</div>`;
      b += `<div class="abs" style="left:${X0 + 14}pt;top:${c0 + 13}pt;width:${V}pt;height:15pt;font-family:var(--re-font);font-weight:400;font-size:10.5pt;line-height:15pt;color:var(--re-ink);white-space:nowrap;overflow:hidden" data-slot="left.list.t${i}" data-lines="1">${esc(txt)}</div>`; });
    h += b;
    const c1 = rowC.length > 1 ? rowC[1] : rowC[0], rx = X0 + colW + G, rw = X1 - rx;
    if(c1) h += FXS.captioned(D, c1, rx, by, rw, BH - 25 - 3*14, 3, 'left.photo0', {fs: 10.5, lh: 14, min: 3});
    return h;
  };

  // ---------------- INSIDE RIGHT: the bedrooms ----------------
  // Its own arrangement: two columns under the deck, split by a column rule. The wide column holds the lead room big with its caption and
  // a second room under it; the narrow column stacks two upright rooms (baths and closets, which crop well tall).
  FO.right = (D) => { const K = D.sw || {}, P = K.plan || {}, cs = FO.cards(D, P.right || []);
    const dk = FO.spreadDeck(D, 'right'); let h = dk.html; const Y = dk.y + 12;
    const lead = cs[0], rest = cs.slice(1), tall = c => /bath|closet|stair|hall|laundry|powder|shower/.test(c.photo), col = rest.filter(tall).concat(rest.filter(c => !tall(c))).slice(0, 2), under = rest.filter(c => !col.includes(c)).slice(0, 1);
    const ww = FO.WW, nx = X0 + ww + 25, nw = X1 - nx;
    // two caption bands across both columns: the lead room and the upper narrow room share one caption line, the lower pair another
    const gap = 16, lhA = 14.5, lhB = 14, H2 = 190, bTop = 766 - 25 - 3*lhB - H2, H1 = bTop - gap - 25 - 4*lhA - Y, two = !!under[0];
    h += FO.vrule(X0 + ww + 12, Y, (col[1] || two ? bTop - gap/2 : 766) - Y);
    if(lead) h += FXS.captioned(D, lead, X0, Y, ww, two ? H1 : 766 - 25 - 4*lhA - Y, 4, 'right.photo0', {nopair: 1, fs: 10.5, lh: lhA, min: 3});
    if(two) h += FXS.captioned(D, under[0], X0, bTop, ww, H2, 3, 'right.photo3', {fs: 10.5, lh: lhB, min: 3});
    if(col[0]){ const L5 = 6, lh5 = 13, bot = col[1] ? bTop - gap : 766; h += FXS.captioned(D, col[0], nx, Y, nw, bot - 25 - L5*lh5 - Y, L5, 'right.photo1', {nopair: 1, fs: 9.5, lh: lh5, min: 3}); }
    if(col[1]) h += FXS.captioned(D, col[1], nx, bTop, nw, H2, 3, 'right.photo2', {fs: 10.5, lh: lhB, min: 3});
    return h;
  };
  FO.rightFit = () => {}; FO.leftHead = () => {};

  // ---------------- BACK (fold-over) and flyer back ----------------
  // the listing's own plan in a box sized to its drawing (paper ground, the thin ink line of P01's event box)
  FO.planBox = (D, x, y, maxH, maxW) => { const A = D.plan.turn && D.plan.kind === 'color' ? 270 : undefined, rot = !!D.plan.turn, noteW = Math.ceil(FXS.width((D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate.', 'font-family:Hanken;font-size:8pt')) + 34;
    const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: rot ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: rot, angle: A}); let cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 40, D.plan.minCard || 0, noteW, 188));
    for(let hh = maxH; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: cw - 28.8, h: hh}, {allowRotate: rot, angle: A}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')){ if(big.usedW) cw = Math.min(cw, Math.max(Math.ceil(big.usedW) + 40, D.plan.minCard || 0, noteW, 188)); break; } }
    return FXS.planCard(D, x, y, cw, maxH); };
  FO.CARD_H = 62; FO.CARD_Y = 684;   // the half-height contact block (owner 11/15), the fine print under it
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="re-hair" style="left:${X0}pt;top:${FO.CARD_Y + FO.CARD_H + 6}pt;width:${CW}pt;opacity:.6"></div><div class="abs fine" style="left:${X0}pt;top:${FO.CARD_Y + FO.CARD_H + 10}pt;width:${CW}pt;height:9pt" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  // Nearby as P01 sets a date: each distance a big Epilogue numeral with the place in the main color's caps under it, three cells between
  // column hairlines, one deck across the page
  FO.nearBand = (D, x, y, w, hh) => { const N = (((D.sw || {}).back || {}).nearby || []).slice(0, 3), n = Math.max(1, N.length), cw = w/n; let h = '';
    N.forEach((q, i) => { const cx = x + i*cw + (i ? 14 : 0), iw = cw - (i ? 14 : 0) - 10, m = /^([\d.]+)\s*(.*)$/.exec(String(q.dist)) || [0, q.dist, ''], ns = Math.min(30, hh*0.56);
      if(i) h += `<div class="re-vhair" style="left:${x + i*cw}pt;top:${y + 6}pt;height:${hh - 12}pt"></div>`;
      h += `<div class="abs" style="left:${cx}pt;top:${y + (hh - ns*1.05 - 13)/2}pt;width:${iw}pt;height:${ns*1.05}pt;white-space:nowrap;overflow:hidden" data-slot="back.near${i}" data-lines="1" data-fine="1"><span style="font-family:var(--re-display);font-weight:600;font-size:${ns}pt;line-height:${ns*1.05}pt;letter-spacing:-.02em;color:var(--re-ink)">${esc(m[1])}</span><span style="font-family:var(--re-font);font-weight:700;font-size:8.6pt;letter-spacing:1.4pt;text-transform:uppercase;color:var(--re-ink);margin-left:6pt">${esc(m[2] || '')}</span></div>`;
      h += `<div class="re-kick" style="left:${cx}pt;top:${y + (hh - ns*1.05 - 13)/2 + ns*1.05 + 1}pt;width:${iw}pt" data-slot="back.near${i}.p" data-lines="1">${esc(String(q.place).toUpperCase())}</div>`; });
    return h; };
  // a ruled list: kicker over rows divided by hairlines, each row a short ink dash and the item
  FO.list = (title, items, x, y, w, rh, slot, n) => { let h = `<div class="abs fo-kick" style="left:${x}pt;top:${y}pt" data-slot="${slot}.title" data-lines="1">${esc(String(title).toUpperCase())}</div>`;
    const r = FXS.bullets(items, x, y + 16, w, rh, slot, n, 10); return h + r.html; };
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    // the back's rooms: ones no other panel (or the flyer front) shows, never a second view of a space already on the piece; handed out
    // after the plan is placed: a room under a short plan first, then the room over the write-up (fold-over), then the row
    const flyUsed = flyer ? [].concat(P.flyerStrip || P.strip || [], ['front']) : [], usedSp = new Set([...(o.used || [])].concat(flyUsed, topId ? [topId] : []).map(id => SW.space(D, id)));
    const cand = [...new Set(flyer ? [].concat(P.flyerBack || [], P.flyerRow4 || [], P.backRow || [], P.backNoplan || [], P.left || [], P.right || []) : [].concat(P.backRow || [], P.backNoplan || [], P.strip || [], P.left || [], P.right || []))].filter(id => (D.photos || {})[id] && !(D.photos[id] || {}).fullHouse);
    const pool = []; cand.forEach(id => { const sp = SW.space(D, id); if(pool.length < 4 && !usedSp.has(sp)){ pool.push(id); usedSp.add(sp); } });
    // the deck: the back's title as one huge caps line flush right, "Floor by floor" as its join
    const ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, ''), multi = +(D.listing || {}).stories > 1, joinT = multi ? ['Floor by', 'floor'] : ['Room by', 'room'];
    const s1 = FO.hlSize([ht], [CW - 110], 40, 22), dk = FO.deck1({y: 30, s: s1, t: ht, join: joinT, slot: 'back.title'});
    let h = dk.html; const TOP = dk.y + 12;
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    // the lower decks, from the card up: lists and photos (three columns), the Nearby band
    const BOT = FO.CARD_Y - 12, NB = 58; let LD = 196, ly = BOT - LD, ny = ly - 12 - NB, TH = ny - 12 - TOP;
    let top, leftW, underId = null;
    if(hasPlan){ const LV = D.plan.levels || [], narrow = LV.length === 1 && LV[0].h/LV[0].w > 1.3; const pc = FO.planBox(D, X0, TOP, TH - 38, narrow ? 250 : 360); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom; leftW = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc.html)[1]));
      if(TOP + TH - top >= 220 && pool.length){ underId = pool.shift(); const uy = top + 12, uh = TOP + TH - uy - 25 - 3*13.5; h += FXS.captioned(D, FXS.cardFor(D, underId), X0, uy, leftW, uh, 3, 'back.under', {fs: 10, lh: 13.5, min: 3}); top = TOP + TH; }
      else if(TOP + TH - top > 6){ const d = TOP + TH - top; LD += d; ly -= d; ny -= d; TH -= d; } }   // a short plan: the decks under it move up and the photos there grow (never a plan small in a tall box)
    else { leftW = 330; const c = FXS.cardFor(D, topId); h += FXS.captioned(D, c, X0, TOP, leftW, TH - 25 - 3*14, 3, 'back.top', {fs: 10.5, lh: 14, min: 3}); top = TOP + TH; }
    const sideId = !flyer && pool.length >= 2 && (!hasPlan || top - TOP >= 236) ? pool.shift() : null, rowIds = pool.slice(0, 2), rowCards = FO.cards(D, rowIds);
    const used = FO.cards(D, [topId, sideId, underId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    // the write-up beside the plan: a column rule, then the floors as one paragraph that fills the plan's height
    const ax = X0 + leftW + 25, aw = X1 - ax, T0 = TOP, span = (hasPlan ? top : TOP + TH) - T0, n = Math.max(3, Math.floor(span/16)), lh = +(span/n).toFixed(3);
    h += FO.vrule(X0 + leftW + 12, TOP, span);
    const sideOk = sideId && span >= 25 + 3*13.5 + 14 + 3*15.5 + 110;
    if(sideOk){
      // the fold-over back: the column holds one more captioned room over the write-up; after the fill the room takes whatever height the
      // write-up leaves (FO.colStack), so the column always ends on the plan's foot with no gap
      const lhc = 13.5, capH = 25 + 3*lhc, wlh = 15.5, colBot = T0 + span, nMax = Math.max(3, Math.floor((span - capH - 14 - 110)/wlh)), PH0 = span - capH - 14 - nMax*wlh;
      h += FXS.captioned(D, FXS.cardFor(D, sideId), ax, T0, aw, PH0, 3, 'back.side', {fs: 10, lh: lhc, min: 3});
      h += FO.wu(keep(f2.concat(f1)), ax, T0 + PH0 + capH + 14, aw, nMax*wlh + 0.01, 'back.about', 10.5, wlh, 'body').replace('data-slot="back.about"', `data-slot="back.about" data-colbot="${colBot}"${aw < 240 ? ' data-rag="1"' : ''}${P.pool ? ` data-pool="${P.pool}"` : ''}`);
    } else h += FO.full(FO.wu(keep(f2.concat(f1)), ax, T0, aw, n*lh + 0.01, 'back.about', 11, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${aw < 240 ? ' data-rag="1"' : ''} data-span="${(span - 12).toFixed(2)}" data-center="about"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
    h += FO.rule(X0, ny - 6, CW) + FO.nearBand(D, X0, ny, CW, NB) + FO.rule(X0, ly - 6, CW);
    // the lists in the first column, the photos in the other two
    // owner 11/17 (p28): the lists run down to the deck's foot: up to six true items a column (the items that set on one line), the rows
    // sharing the deck's whole height, so no blank band opens under a short list
    const cw3 = (CW - 2*G)/3, one = rowCards.length <= 1, fitsRow = t => FXS.width(t, 'font-family:Hanken;font-weight:400;font-size:10pt') <= cw3 - 14;
    const L1 = c1.filter(fitsRow), L2 = c2.filter(fitsRow); let nA = Math.min(L1.length, one ? 6 : 5), nB = Math.min(L2.length, one ? 6 : 4);
    if(!one) while(nA + nB > 2 && (LD - 12 - 2*16 - 10)/(nA + nB) < 21){ if(nA >= nB) nA--; else nB--; }
    let t;
    if(one){ const rh = Math.min(36, (LD - 12 - 16 - 6)/Math.max(1, nA, nB));
      t = FO.list(t1, L1, X0, ly + 6, cw3, rh, 'back.updates', nA) + FO.list('Outside', L2, X0 + cw3 + G, ly + 6, cw3, rh, 'back.outside', nB) + FO.vrule(X0 + cw3 + G/2, ly + 6, LD - 6);
      if(rowCards[0]) h += FXS.captioned(D, rowCards[0], X0 + 2*(cw3 + G), ly + 6, cw3, LD - 6 - 25 - 3*13.5, 3, 'back.photo0', {fs: 10, lh: 13.5, min: 3});
      h += FO.vrule(X0 + 2*cw3 + 1.5*G, ly + 6, LD - 6); }
    else { const rh = Math.min(36, (LD - 12 - 2*16 - 10)/Math.max(1, nA + nB));
      t = FO.list(t1, L1, X0, ly + 6, cw3, rh, 'back.updates', nA) + FO.list('Outside', L2, X0, ly + 6 + 16 + nA*rh + 10, cw3, rh, 'back.outside', nB);
      const px = X0 + cw3 + G, pw = (X1 - px - G)/2;
      rowCards.forEach((c, i) => { h += FXS.captioned(D, c, px + i*(pw + G), ly + 6, pw, LD - 6 - 25 - 3*13.5, 3, 'back.photo' + i, {fs: 10, lh: 13.5, min: 3}).replace(`data-slot="back.photo${i}" data-room`, `data-slot="back.photo${i}" data-nopair="1" data-room`); });
      h += FO.vrule(X0 + cw3 + G/2, ly + 6, LD - 6); }
    h += t;
    h += FO.contact(D, X0, FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D);
    return {html: h, issues};
  };
  FO.colStack = () => { const el = document.querySelector('[data-colbot]'); if(!el || !el.textContent.trim()) return; const n = SW.lines(el).n, lh = parseFloat(el.style.lineHeight), bot = +el.dataset.colbot, free = bot - (parseFloat(el.style.top) + n*lh); el.style.height = (n*lh) + 'pt'; el.dataset.lines = n; if(free < 0.5) return;
    const ph = document.querySelector('.ph[data-slot-photo="back.side"]'), pb = ph && ph.parentElement, lb = document.querySelector('[data-slot="back.side.label"]'), cp = document.querySelector('.cap .a[data-slot="back.side"]');
    if(pb) pb.style.height = (parseFloat(pb.style.height) + free) + 'pt'; if(lb) lb.parentElement.style.top = (parseFloat(lb.parentElement.style.top) + free) + 'pt'; if(cp) cp.style.top = (parseFloat(cp.style.top) + free) + 'pt'; el.style.top = (parseFloat(el.style.top) + free) + 'pt'; };
  FO.tallStack = () => { const col = document.querySelector('[data-tallcol]'); if(!col) return; const bottom = +col.dataset.tallcol, ps = [...document.querySelectorAll('[data-para]')]; if(ps.length < 2) return;
    const [a, b] = ps, la = parseFloat(a.style.lineHeight), lb = parseFloat(b.style.lineHeight), na = SW.lines(a).n, nb = SW.lines(b).n;
    a.style.height = (na*la) + 'pt'; b.style.top = (parseFloat(a.style.top) + na*la + 9) + 'pt'; b.style.height = (nb*lb) + 'pt';
    const free = bottom - 8 - (parseFloat(b.style.top) + nb*lb); if(free < 1) return;
    const cap = document.querySelector('.cap .a[data-slot="back.photo0"]'), ph = document.querySelector('.ph[data-slot-photo="back.photo0"]'), pb = ph && ph.parentElement, lbl = document.querySelector('[data-slot="back.photo0.label"]');
    if(pb) pb.style.height = (parseFloat(pb.style.height) + free) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + free) + 'pt'; if(cap) cap.style.top = (parseFloat(cap.style.top) + free) + 'pt';
    document.querySelectorAll('[data-tall]').forEach(e => { e.style.top = (parseFloat(e.style.top) + free) + 'pt'; }); };
  // after the fill: a block with data-span spreads the lines it took over that height, so its last line ends where its neighbor's does (owner 11/7, p12)
  FO.span = () => document.querySelectorAll('[data-span]').forEach(el => { const T = +el.dataset.lines, lh = Math.min(+el.dataset.span/T, parseFloat(getComputedStyle(el).fontSize)*0.75*1.75); el.style.lineHeight = lh + 'pt'; el.style.height = (T*lh) + 'pt'; el.style.top = (parseFloat(el.style.top) + (+el.dataset.span - T*lh)/2) + 'pt'; });   // owner 11/16: centered top to bottom in its span
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
