/* Garden Serif fold-over and two-sided flyer builders (the fill machinery grown from the FXS-14 builders through the pilot; the hand is
   the approved Open House library flyer P20). Panel coordinates in pt: trim 612 x 792 (the proof page adds a 9 pt bleed; anything that bleeds runs to -9 / 621 / 801).
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
    for(let fs = fs0, gm = +el.dataset.growmax || 1.25; fs <= fs0*gm + 0.01 && !best; fs += 0.25){ el.style.fontSize = fs + 'pt'; el.style.lineHeight = (fs*r) + 'pt';   // the smallest step up that fills the box
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
  const worstGap = el => { let worst = 0; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const t = n.textContent; for(let i = 0; i < t.length; i++){ if(t[i] !== ' ') continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const q = r.getBoundingClientRect(); if(q.width > worst && q.height > 0) worst = q.width; } }
    return worst; };
  // a justified block whose word gaps open past 3.2 spaces: first a quarter-point step in its size (down to -1 pt, up to +0.5 pt) that keeps its
  // line count and its full last line and closes the gaps; only then is it set ragged (Garden Serif, 11/16)
  FO.gaps = () => document.querySelectorAll('[data-slot]').forEach(el => { if(el.dataset.rag){ el.style.textAlign = 'left'; return; }
    if(getComputedStyle(el).textAlign !== 'justify' || el.querySelector('[data-slot]')) return;
    const bad = () => worstGap(el) > parseFloat(getComputedStyle(el).fontSize)*0.28*3.2; if(!bad()) return;
    const f0 = parseFloat(el.style.fontSize) || parseFloat(getComputedStyle(el).fontSize)*0.75, L0 = SW.lines(el);
    for(const d of [-0.25, 0.25, -0.5, 0.5, -0.75, -1]){ el.style.fontSize = (f0 + d) + 'pt'; const L = SW.lines(el); if(L.n === L0.n && L.fill >= Math.min(0.9, L0.fill) && !bad()) return; }
    el.style.fontSize = f0 + 'pt'; el.style.textAlign = 'left'; });
  FO.fill3Check = () => [...document.querySelectorAll('[data-j3]')].filter(el => el.textContent.trim()).flatMap(el => { const L = SW.lines(el);
    return L.n < 3 ? [{slot: el.dataset.slot, kind: 'writeup-under-3-lines', lines: L.n}] : L.fill < 0.895 ? [{slot: el.dataset.slot, kind: 'writeup-last-line-short', pct: Math.round(L.fill*100)}] : []; });

  // Garden Serif: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Garden Serif refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
      const tmax = Math.max(3, Math.min(8, Math.floor((H + 24)/(fs0*1.18)))), counts = []; for(let t = tmax; t >= minl; t--) if(Math.abs(t - Math.max(minl, n0)) <= 1 || els.every(e => e.closest('.cap.side') || e.dataset.sidecap) || (els.length > 1 && els.every(e => e.dataset.nopair))) counts.push(t);   // a locked row (data-nopair) may take any count its box allows
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
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:'Libre Baskerville';font-weight:600;letter-spacing:3.4pt", HW, 24, 13, 5), lh = T.f*1.3, H = 17 + T.n*lh + 9 + 1.2, y = 30 + (270 - 30 - H)/2;
    kk.style.top = y + 'pt'; ti.style.top = (y + 17) + 'pt'; ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = (T.n*lh) + 'pt'; ti.dataset.lines = T.n; ru.style.top = (y + 17 + T.n*lh + 9) + 'pt'; };
  // after the fill: the cover write-up sits on the frame's foot; the rooms above it grow down into any room it did not use (no empty band)
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = 766 - n*lh;
    const lbls = [...document.querySelectorAll('[data-slot^="front.strip"][data-slot$=".label"]')]; if(!lbls.length) return; const lb = Math.max(...lbls.map(l => parseFloat(l.style.top) + 11)), d = top - 16 - lb; su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt'; if(d <= 0) return;
    lbls.forEach(l => { l.style.top = (parseFloat(l.style.top) + d) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---- helpers kept from the pilot engine ----
  // how many lines a text sets in width w (greedy word wrap, measured)
  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  // a heading that wraps: the size (from max down) at which its last line is at least 80% of the box (the last-line rule), else the largest one-line size
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  FO.fitTitle = (t, fam, w, max, min, maxLines) => { for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w)) return {f, n: L.length, w}; }
    for(const k of [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6]) for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w*k); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w*k)) return {f, n: L.length, w: w*k}; }
    return {f: min, n: FO.wrapLines(t, `${fam};font-size:${min}pt`, w).length, w}; };
  // the standard contact card as B01's footer: agent on the left, the brokerage panel on the right with the one logo, knockout on the dark
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = GS.logoSrc(D); const ko = !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 180, lh = Math.min(46, H - 30), s = {name: 18, nameFloor: 15, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div style="--cc-display:'Libre Baskerville';--cc-body:Instrument Sans">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };
  // Design pass 11/15: a dusk exterior of the same house is the hero when the listing has one (photos.<id>.dusk)
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
  // Design pass 11/15: a labeled table in the set's own panel. Every row is one full line: the label in accent caps in a column as wide as
  // the longest label needs (labels never touch values), then the fullest true wording of the row that sets on one line. The type size
  // (10 to 12 pt) and the value column's width are chosen so the most rows fill 86% or more of their line (set ragged: a one-line row justified opens wide word gaps).
  // A row that cannot fill its line is left out while four or more remain (a short row reads as a mistake); kept rows keep their order.
  FO.tableRows = (items0, liw, taken, o) => { o = o || {}; const lcss = 'font-family:Instrument Sans;font-weight:500;font-size:8.6pt;letter-spacing:2.2pt', LW0 = o.stack ? 0 : Math.ceil(Math.max(...items0.map(it => FXS.width(String(it.l).toUpperCase(), lcss)))) + 20;
    const ok = a => !taken || !taken(a); let best = null; const MIN = 0.86, opts = o.stack ? (o.Vs || [178, 184, 190, 196, 202, 208, 214]).map(V => [0, V]) : [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60].map(d => [LW0 + d, liw - LW0 - d]);
    for(let f = o.stack ? 10 : 10.5; f <= (o.stack ? 11.51 : 12.01); f += 0.25) for(const [LW, V] of opts){ const css = `font-family:Instrument Sans;font-weight:400;font-size:${f}pt`;
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
    for(let f = 10; f <= 11.51; f += 0.25) for(const V of (o.Vs || [184, 190, 196, 202, 208, 214, 220])){ const css = `font-family:Instrument Sans;font-weight:400;font-size:${f}pt`;
      const rows = items0.map(it => { const S = (it.s || []).map(x => [].concat(x).filter(ok)).filter(a => a.length); let bt = '', bs = -1;
        const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(!t || /^(It|Its|They|Their|This|That)\b/.test(t) || SW.sameFactIn(t)) return; const Lw = FO.wrapW(t, css, V); if(Lw.length !== 2 || Lw[0] < 0.8*V || Lw[1] < 0.9*V) return; const sc = (Lw[0] + Lw[1])/V; if(sc > bs){ bs = sc; bt = t; } return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
        walk(0, []); return {l: it.l, t: bt}; }).filter(r => r.t);
      const n = Math.min(rows.length, o.maxRows || 4), score = n*100 + f*2 - V*0.05;
      if(!best || score > best.score) best = {score, f, V, LW: 0, rows: rows.slice(0, o.maxRows || 4)}; }
    return best; };
  // each nearby place sits centered top to bottom between its rules (owner 11/7, p6)
  const nearRows = (D, x, y, w, o) => { o = o || {}; const N = ((D.sw || {}).back || {}).nearby || [], top = o.top == null ? 20 : o.top, rh = o.rowH || 28, ds = o.d || 15, ps = o.p || 8.5;
    const pfit = Math.min(...N.slice(0, 3).map(n => { let q = ps; while(q > 8.5 && FXS.width(String(n.dist), `font-family:'Libre Baskerville';font-weight:500;font-size:${ds}pt`) + 9 + FXS.width(String(n.place).toUpperCase(), `font-family:Instrument Sans;font-weight:500;letter-spacing:1.6pt;font-size:${q}pt`) > w - 3) q -= 0.2; return q; }));
    return N.slice(0, 3).map((n, i) => `<div class="fo-near" style="left:${x}pt;top:${y + top + i*rh}pt;width:${w}pt;height:${rh - 0.5}pt" data-slot="back.near${i}" data-lines="1" data-fine="1"><div class="in"><span class="d" style="font-size:${ds}pt">${esc(n.dist)}</span><span class="p" style="font-size:${pfit}pt">${esc(n.place)}</span></div></div>`).join('') + FO.kick('Nearby', x, y, 'back.near.kicker'); };
  // the plan in its box (the design's own dark background; the plan prints clear with light lines, PlanInk). Design pass 11/15: the box is as
  // wide as the drawing needs and no wider (a narrow plan gets a narrow box; the write-up beside it takes the rest)
  FO.planBox = (D, x, y, maxH, maxW) => { const A = D.plan.turn && D.plan.kind === 'color' ? 270 : undefined, rot = !!D.plan.turn, noteW = Math.ceil(FXS.width((D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate.', 'font-family:Instrument Sans;font-size:8pt')) + 34;
    const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: rot ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: rot, angle: A}); let cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 40, D.plan.minCard || 0, noteW, 188));
    // the plan may print smaller than the box allows (its own resolution): the box then follows the drawing, never a small plan in a big box
    for(let hh = maxH; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: cw - 28.8, h: hh}, {allowRotate: rot, angle: A}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')){ if(big.usedW) cw = Math.min(cw, Math.max(Math.ceil(big.usedW) + 40, D.plan.minCard || 0, noteW, 188)); break; } }
    return FXS.planCard(D, x, y, cw, maxH); };
  FO.CARD_H = 62; FO.CARD_Y = 688;   // B01's footer: the card at 694, the fine print at 762, inside the frame
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:756pt;width:${CW}pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };

  // ================= Garden Serif (grown from the approved Open House library flyer P20 and its sign-in sheet) =================
  // The page in the agent's main color; the rail (the piece's words repeated up a thin rule along the outer edge); the display words in
  // Libre Baskerville bold italic capitals, tight; headlines, dates, streets and numerals in Libre italic; Instrument Sans for details and
  // champagne caps for labels; the round room photo ringed in the field, laid over a photo's corner; the sign-in sheet's blush card.
  // A page railed on the left holds its content from 66 to 582 pt (the flyer's own measure); a page railed on the right from 30 to 546.
  const X0 = 66, X1 = 582, CW = X1 - X0, MID = (X0 + X1)/2;
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW; FO.MID = MID;
  FO.frame = () => '';
  const JO = (fs, ls, wt) => `font-family:Instrument Sans;font-weight:${wt || 500};letter-spacing:${ls || 0}pt;font-size:${fs}pt`;
  const LBI = (wt, ls) => `font-family:'Libre Baskerville';font-style:italic;font-weight:${wt || 700}${ls != null ? `;letter-spacing:${ls}pt` : ''}`;
  const CRF = LBI;
  FO.JO = JO; FO.CRF = CRF; FO.LBI = LBI;
  // the rail: the rule at rx, the words (repeated, whole, never cut) centered on tx, turned to read up a left rail and down a right one
  GS.rail = (side, label, o) => { o = o || {}; const y0 = o.y0 == null ? 26 : o.y0, y1 = o.y1 == null ? 766 : o.y1, len = y1 - y0, cy = (y0 + y1)/2;
    const rx = o.rx != null ? o.rx : side === 'left' ? 46 : 566, tx = o.tx != null ? o.tx : side === 'left' ? 30 : 582, fs = o.fs || 8.6, ls = o.ls == null ? 3.4 : o.ls;
    const css = JO(fs, ls, 500), lab = String(label || '').toUpperCase(), sep = ' · ', one = FXS.width(lab, css), unit = FXS.width(lab + sep, css);
    const n = Math.max(1, Math.floor((len - 16 + (unit - one))/unit)), t = Array(n).fill(lab).join(sep);
    return `<div class="gs-rail" style="left:${rx - .5}pt;top:${y0}pt;height:${len}pt"></div><div class="gs-railt" data-rail="1" style="left:${tx - len/2}pt;top:${cy - 7}pt;width:${len}pt;height:14pt;font-size:${fs}pt;letter-spacing:${ls}pt;text-indent:${ls}pt;transform:rotate(${side === 'left' ? -90 : 90}deg)">${esc(t)}</div>`; };
  // the round room photo, ringed in the field color (o.over: the slot of the photo it lies on, so GS.circFix can lift it off a house)
  GS.circ = (D, id, cx, cy, d, slot, o) => { o = o || {}; const ring = o.ring == null ? Math.max(4, d*0.032) : o.ring;
    // o.r: a rounded square instead of the circle (owner 11/17: the flyer front's rooms "squarish with dramatically rounded corners"); o.h: its own height
    const hh = o.h || d, sq = o.r != null ? ` gs-sq" data-r="${o.r}` : '';
    return `<div class="gs-circ${sq}" data-circ="${slot}"${o.over ? ` data-over="${o.over}"` : ''}${o.shrink ? ` data-shrink="${o.shrink}"` : ''} style="left:${(cx - d/2).toFixed(2)}pt;top:${(cy - hh/2).toFixed(2)}pt;width:${d}pt;height:${hh}pt;border:${ring.toFixed(2)}pt solid var(--gs-dark)${o.r != null ? `;border-radius:${o.r}pt` : ''}">${SW.photo(D, id, 'position:absolute;inset:0', slot)}</div>`; };
  // after the crop is set: a round photo laid over a house photo never covers the house (the flyer's rule: the circle sits over sky beside it).
  // It rises in 2 pt steps (as far as o.maxRise) until it clears the house box; else the piece fails circle-over-house.
  GS.circFix = (D) => { const out = [];
    document.querySelectorAll('.gs-circ[data-over]').forEach(c => { const ph = document.querySelector(`.ph[data-slot-photo="${c.dataset.over}"]`); if(!ph) return; const p = (D.photos || {})[ph.dataset.photo], img = ph.querySelector('img'); if(!p || !p.box || !img) return;
      const r = img.getBoundingClientRect(), W = p.w || img.naturalWidth, H = p.h || img.naturalHeight, s = Math.max(r.width/W, r.height/H), dw = W*s, dh = H*s, op = getComputedStyle(img).objectPosition.split(' ').map(v => parseFloat(v)/100);
      const ox = r.left + (r.width - dw)*(isNaN(op[0]) ? .5 : op[0]), oy = r.top + (r.height - dh)*(isNaN(op[1]) ? .5 : op[1]), pr = ph.getBoundingClientRect();
      const hb = {l: Math.max(pr.left, ox + p.box[0]*dw), t: Math.max(pr.top, oy + p.box[1]*dh), r: Math.min(pr.right, ox + p.box[2]*dw), b: Math.min(pr.bottom, oy + p.box[3]*dh)};
      const hit = () => { const q = c.getBoundingClientRect(), R = q.width/2, cx = q.left + R, cy = q.top + R, nx = Math.max(hb.l, Math.min(cx, hb.r)), ny = Math.max(hb.t, Math.min(cy, hb.b)); return (nx - cx)**2 + (ny - cy)**2 < (R + 5)**2; };
      const maxRise = c.dataset.rise != null ? +c.dataset.rise : 60; let k = 0; while(hit() && k*2 < maxRise){ c.style.top = (parseFloat(c.style.top) - 2) + 'pt'; k++; }
      // o.shrink: a circle that still lies on the house grows smaller about its outer corner (down to 60%); one that cannot clear is left out
      if(hit() && c.dataset.shrink){ const d0 = parseFloat(c.style.width), ax = c.dataset.shrink === 'tr' ? parseFloat(c.style.left) + d0 : parseFloat(c.style.left), ay = parseFloat(c.style.top);
        for(let f = 0.96; f >= 0.72 && d0*f >= 88 && hit(); f -= 0.04){ const d = d0*f; c.style.width = c.style.height = d + 'pt'; c.style.left = (c.dataset.shrink === 'tr' ? ax - d : ax) + 'pt'; c.style.top = ay + 'pt'; }
        if(hit()) c.remove(); }
      if(c.isConnected && hit()) out.push({slot: c.dataset.circ, kind: 'circle-over-house', detail: 'the round photo lies on the house'}); });
    return out; };
  // a centered or left line of text
  const cline = (cls, t, x, y, w, fs, lh, slot, extra) => `<div class="abs ${cls}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${lh}pt;font-size:${fs}pt;line-height:${lh}pt;${extra || ''}" data-slot="${slot}" data-lines="1">${esc(t)}</div>`;
  FO.cline = cline;
  // display words broken into lines (max n) at the largest size from max down that fits w: the break that lets the type grow biggest
  FO.icapsLines = (t, w, max, min, n, css) => { css = css || LBI(700, -0.5) + ';text-transform:uppercase'; const words = (/uppercase/.test(css) ? String(t).toUpperCase() : String(t)).split(/\s+/).filter(Boolean); let best = {f: min, lines: [words.join(' ')]};
    const splits = []; if(n >= 1) splits.push([words.join(' ')]); if(n >= 2) for(let i = 1; i < words.length; i++) splits.push([words.slice(0, i).join(' '), words.slice(i).join(' ')]);
    if(n >= 3) for(let i = 1; i < words.length - 1; i++) for(let j = i + 1; j < words.length; j++) splits.push([words.slice(0, i).join(' '), words.slice(i, j).join(' '), words.slice(j).join(' ')]);
    splits.forEach(L => { const f = Math.min(...L.map(l => FXS.fitSize(l, css, w, max, min))); const ok = L.every(l => FXS.width(l, `${css};font-size:${f}pt`) <= w); if(ok && (f > best.f + 0.01 || (Math.abs(f - best.f) < 0.01 && L.length < best.lines.length))) best = {f, lines: L}; });
    return best; };
  // a captioned photo of this set: the photo; under it the caption, the room's name run in in the flyer's bold italic (justified after the fill)
  FO.capT = (D, c, x, y, w, ph, lines, slot, o) => { o = o || {}; c = FXS.augment(D, c); const tx = o.tx == null ? x : o.tx, tw = o.tw == null ? w : o.tw, name = FXS.leadLabel(c.lead).name, lh = o.lh || 13.5, fs = o.fs || 10, gap = o.gap || 8;
    return FXS.box(D, c.photo, x, y, w, ph, slot) +
      `<div class="abs cap"><div class="a" style="position:absolute;left:${tx}pt;top:${y + ph + gap}pt;width:${tw}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-lead="${esc(name ? name + '.' : '')}" data-room="${esc(name)}" data-nopair="1" ${o.fill ? `data-fill="${o.fill}" ` : ''}data-lh="${lh}" data-hbox="${lines*lh}" data-lines="${lines}" data-min="${o.min || 3}" data-narrow="0" ${FXS.sd(c.s)}></div></div>`; };
  // a round room photo with only its name under it, in the champagne caps (flyer front)
  FO.circT = (D, id, cx, cy, d, slot, o) => { o = o || {}; let name = FO.lead(D, id); if(FXS.width(name.toUpperCase(), JO(8.8, 2.6, 600)) > d + 30) name = name.split(/ and |, /)[0];
    const hh = o.h || d, lw = o.h ? d : d + 40;   // o.h: a wider-than-tall rounded photo (owner 11/23, flyer front p4); its label stays inside its own width
    return GS.circ(D, id, cx, cy, d, slot, {ring: 0, r: o.r, h: o.h}) + cline('gs-eyebrow', name.toUpperCase(), cx - lw/2, cy + hh/2 + 9, lw, 8.8, 12, slot + '.label', 'text-align:center;letter-spacing:2.6pt;text-indent:2.6pt'); };
  // the eyebrow and the panel's one display moment: Libre bold italic, sentence case, up to two lines, at (x, y) in width w
  FO.headL = (kicker, title, slot, x, y, w, o) => { o = o || {}; const t = String(title || '').replace(/\.$/, '').replace(/(^| )([AaI]) /g, '$1$2 '), fam = LBI(700, -0.3);
    const words = q => new Set((String(q).toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length > 2 && !['the', 'and', 'with'].includes(w))), kw = [...words(kicker)], tw = words(title), rep = kw.length > 0 && kw.every(w => tw.has(w) || tw.has(w.replace(/s$/, '')) || tw.has(w + 's'));
    let T = FO.fitTitle(t, fam, w, o.max || 38, o.min || 26, o.lines || 2); if(o.lines === 1 && T.n > 1) T = FO.fitTitle(t, fam, w, o.min2 || 28, 22, 2); const lh = +(T.f*1.16).toFixed(2);
    let h = '', yy = y; if(!rep && kicker){ h += cline('gs-eyebrow', String(kicker).toUpperCase(), x, yy, w, 9, 12, slot + '.kicker', o.right ? 'text-align:right' : ''); yy += 20; }
    h += `<div class="gs-head" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${T.n*lh}pt;font-size:${T.f}pt;line-height:${lh}pt${o.right ? ';text-align:right' : ''}" data-slot="${slot}.title" data-lines="${T.n}" data-fine="1">${esc(t)}</div>`;
    return {html: h, y: yy + T.n*lh}; };

  // ---------------- FRONT: the fold-over cover (no agent, no brokerage) ----------------
  // The Open House flyer's own order, grown into the listing's cover: the rail with the street and the neighborhood; the street as the
  // display words, as large as the measure allows; the place in champagne caps; the house wide, the round room photo laid over its
  // top corner (over the sky, never the house); one Libre italic line at the foot.
  FO.COVER = 'corner';   // owner 11/24 (books 2-3 round 2, Q1): cover B, the street on one line, the house full size, one round photo
  // the cover's small rooms: the plan's strip first, then the listing's other room photos, never a photo or a space the fold-over shows elsewhere
  FO.coverRooms = (D, n) => { const P = (D.sw || {}).plan || {}, ph = D.photos || {}, used = new Set([].concat(P.left || [], P.right || [], P.backRow || ['bath2'], D.plan ? [] : [(P.back || [])[0] || (P.backNoplan || [])[0]].filter(Boolean))), usedSp = new Set([...used].map(id => SW.space(D, id)));
    const cand = [].concat(P.strip || [], Object.keys(ph)).filter((id, i, a) => a.indexOf(id) === i && ph[id] && !ph[id].fullHouse && !used.has(id) && !usedSp.has(SW.space(D, id)) && !/^(front|exterior|aerial|street|plan|evening|twilight|dusk)/i.test(id) && !/front|aerial|street/i.test(ph[id].tags || ''));
    const out = [], sp = new Set(); for(const id of cand){ const s = SW.space(D, id); if(sp.has(s)) continue; sp.add(s); out.push(id); if(out.length >= n) break; } return out; };
  // ---------------- owner 11/23 (books 2-3 review p1, p2, Q1): the cover choices, at most ONE round photo each ----------------
  // 'onebr' (p1, the default): the earlier cover (street on two lines, the house full size) with its one round room moved to the photo's
  //   bottom right corner. 'corner' (B, fixed): the street on one line, the house full size right under the place line, one round room
  //   on the photo's bottom right corner (half on the photo). 'arch' (D): the house in a garden arch, a champagne hairline around it, the
  //   facts in champagne caps under it. 'bleed' (E): the house runs off the top and both edges; the street large under it, one round room
  //   on the seam. 'trio' (F): the earlier cover with three rounded-square rooms in a row under the house (no round photos).
  FO.ALT = {};
  const coverBase = (D, o) => { const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {};
    const hood = FXS.hood(L), city = FXS.placeLine(L), hero = FO.heroId(D, F.hero || K.hero || 'front'), place = [hood, city].filter(Boolean).join('  ·  ').toUpperCase();
    const line = String(K.line || '').replace(/\.$/, ''), lines = line ? FO.icapsLines(line, CW, 30, 20, 2, LBI(700, -0.3)) : null, llh = lines ? +(lines.f*1.22).toFixed(2) : 0, foot = lines ? lines.lines.length*llh : 0;
    const tagW = lines ? Math.max(...lines.lines.map(l => FXS.width(l, `${LBI(700, -0.3)};font-size:${lines.f}pt`))) : 0;
    const tag = () => lines ? lines.lines.map((l, i) => `<div class="abs gs-ital" style="left:${X0}pt;top:${766 - foot + i*llh}pt;width:${CW}pt;height:${llh}pt;font-size:${lines.f}pt;line-height:${llh}pt" data-slot="${i ? 'front.line2' : 'front.line'}" data-lines="1">${esc(l)}</div>`).join('') : '';
    const room1 = () => [].concat(P.strip || []).find(id => (D.photos || {})[id]) || FO.coverRooms(D, 1)[0];
    const street = (x, y, w, max, min, n) => { const S = FO.icapsLines(L.address, w, max, min, n), lh = +(S.f*1.0).toFixed(2);
      return {S, lh, h: S.lines.length*lh + 6, html: S.lines.map((l, i) => `<div class="abs gs-icaps" style="left:${x}pt;top:${y + i*lh}pt;width:${w}pt;height:${lh + 6}pt;font-size:${S.f}pt;line-height:${lh + 6}pt" data-slot="${i ? 'address.2' : 'address'}" data-lines="1">${esc(l)}</div>`).join('')}; };
    const placeLine = (x, y, w) => cline('gs-eyebrow', place, x, y, w, Math.min(10.5, FXS.fitSize(place, JO(10.5, 3.6, 600), w - 6, 10.5, 8.6)), 14, 'front.place', 'letter-spacing:3.6pt');
    const fitH = (w, h0, hmin) => { let ph = h0; while(ph > hmin && !SW.fits(D, hero, w, ph)) ph -= 4; return ph; };
    return {L, P, hood, city, hero, place, lines, foot, tagW, tag, room1, street, placeLine, fitH, rail: GS.rail('left', [L.address, hood].filter(Boolean).join(' · '))}; };
  const ring1 = (D, id, cx, cy, d, slot) => GS.circ(D, id, cx, cy, d, slot, {ring: 5});
  // a wide house cannot take the cover's full height (its sides would be cut): the house then sits under the place line and the room it
  // leaves holds the flyer front's facts row (italic numerals over tracked words, white hairlines between), centered in it (fill check)
  const factsRow = (L, x, y, w) => { const items = FXS.statItems(L).filter(q => !/^Built/.test(q)), yr = L.yearBuilt || L.year; if(yr) items.push('Built ' + yr);
    const parts = items.slice(0, 5).map(q => { if(/^Built /.test(q)) return {n: String(yr), l: 'Built'}; const p = FXS.statParts(q); return {n: p.n, l: p.l}; }); if(!parts.length) return '';
    const cw = w/parts.length, FH = 50; let t = '';
    parts.forEach((p, i) => { const xx = x + i*cw; if(i) t += `<div class="gs-vhair" style="left:${xx}pt;top:${y + 4}pt;height:${FH - 8}pt"></div>`;
      const ns = Math.min(24, FXS.fitSize(p.n, LBI(700), cw - 14, 24, 14));
      t += `<div class="gs-num" style="left:${xx}pt;top:${y + 2}pt;width:${cw}pt;height:${ns*1.2}pt;font-size:${ns}pt;line-height:${ns*1.2}pt" data-slot="front.facts${i}" data-lines="1">${esc(p.n)}</div>`;
      t += `<div class="gs-numl" style="left:${xx}pt;top:${y + 4 + ns*1.2}pt;width:${cw}pt;height:12pt" data-slot="front.facts${i}.l" data-lines="1">${esc(String(p.l || '').toUpperCase())}</div>`; });
    return t; };
  const slackFacts = (B, PT, PB, ph, keepX1) => { const gap = PB - PT - ph; if(gap < 70) return null; const y = PT + ph + (gap - 50)/2; return {top: PT, html: factsRow(B.L, X0, y, (keepX1 || X1) - X0)}; };
  // a two-line street whose shorter line runs under 72% of the measure leaves an empty corner (fill check): it then runs on one line when it sets at 34 pt or more
  const streetFull = (B) => { const css = LBI(700, -0.5) + ';text-transform:uppercase', w = (t, f) => FXS.width(String(t).toUpperCase(), `${css};font-size:${f}pt`);
    let St = B.street(X0, 30, CW, 70, 34, 2); if(St.S.lines.length === 2 && Math.min(...St.S.lines.map(l => w(l, St.S.f)))/CW < 0.72){ const S1 = B.street(X0, 30, CW, 70, 34, 1); if(w(S1.S.lines[0], S1.S.f) <= CW) St = S1; } return St; };
  FO.ALT.onebr = (D) => { const B = coverBase(D), St = streetFull(B); let h = B.rail + St.html;
    const sb = 30 + St.h; h += B.placeLine(X0, sb + 10, CW);
    const PT = sb + 34, PB = 766 - B.foot - (B.foot ? 22 : 0), ph = B.fitH(CW, PB - PT, 300), sf = slackFacts(B, PT, PB, ph, X1 - 150), top = sf ? sf.top : PB - ph;
    h += SW.heroHtml(D, B.hero, X0, top, CW, ph, 'front.house', []) + (sf ? sf.html : '');
    const id = B.room1(), d = 150; if(id) h += ring1(D, id, X1 - d/2 + 12, top + ph - d/2 + 14, d, 'front.strip0');   // over the corner, a little past the photo's edges (as the earlier round hung past its top corner)
    return h + B.tag(); };
  FO.ALT.corner = (D) => { const B = coverBase(D); let St = B.street(X0, 30, CW, 70, 28, 1); if(St.S.lines.length > 1 || FXS.width(St.S.lines[0], LBI(700, -0.5) + `;text-transform:uppercase;font-size:${St.S.f}pt`) > CW) St = B.street(X0, 30, CW, 70, 34, 2);
    let h = B.rail + St.html; const sb = 30 + St.h; h += B.placeLine(X0, sb + 10, CW);
    const PT = sb + 34, PB = 766 - B.foot - (B.foot ? 22 : 0), ph = B.fitH(CW, PB - PT, 300), sf = slackFacts(B, PT, PB, ph, X1 - 140), top = sf ? sf.top : PT + (PB - PT - ph)/2;   // full size: the photo takes all the room from the place line to the foot line
    h += SW.heroHtml(D, B.hero, X0, top, CW, ph, 'front.house', []) + (sf ? sf.html : '');
    const id = B.room1(), d = 132; let cy = top + ph; if(X0 + B.tagW + 18 > X1 + 14 - d) cy = Math.min(cy, 766 - B.foot - 10 - d/2);   // half on the photo; lifted clear of a long foot line
    if(id) h += ring1(D, id, X1 + 14 - d/2, cy, d, 'front.strip0');
    return h + B.tag(); };
  FO.ALT.arch = (D) => { const B = coverBase(D), St = streetFull(B); let h = B.rail + St.html; const sb = 30 + St.h; h += B.placeLine(X0, sb + 10, CW);
    const L = B.L, items = FXS.statItems(L).filter(x => !/^Built/.test(x)).slice(0, 4), yr = L.yearBuilt || L.year; if(yr) items.push('Built ' + yr);
    const facts = items.join('   ·   ').toUpperCase(), fs = Math.min(11, FXS.fitSize(facts, JO(11, 3, 600), CW - 4, 11, 8.6)), FH = facts ? 16 : 0;
    const PT = sb + 40, PB = 766 - B.foot - (B.foot ? 20 : 0) - (FH ? FH + 16 : 0), ph = B.fitH(CW - 20, PB - PT, 300), top = PB - ph, rv = Math.min(150, ph*0.34), aw = CW - 20;
    h += `<div class="abs" style="left:${X0}pt;top:${top - 10}pt;width:${CW}pt;height:${ph + 10}pt;border:1pt solid var(--gs-accent);border-bottom:0;border-radius:${CW/2}pt ${CW/2}pt 0 0 / ${rv + 10}pt ${rv + 10}pt 0 0" data-deco="arch"></div>`;   // the champagne hairline, 10 pt outside the arch
    h += SW.heroHtml(D, B.hero, X0 + 10, top, aw, ph, 'front.house', []).replace('<div class="abs" style="', `<div class="abs" style="overflow:hidden;border-radius:${aw/2}pt ${aw/2}pt 0 0 / ${rv}pt ${rv}pt 0 0;`);
    if(facts) h += cline('gs-eyebrow', facts, X0, PB + 14, CW, fs, FH, 'front.facts', 'letter-spacing:3pt;text-align:center;text-indent:3pt');
    return h + B.tag(); };
  FO.ALT.bleed = (D) => { const B = coverBase(D), d = 144, cx = X1 - d/2 + 10, aw = CW;
    let S = FO.icapsLines(B.L.address, aw, 66, 40, 1); if(FXS.width(S.lines[0], LBI(700, -0.5) + `;text-transform:uppercase;font-size:${S.f}pt`) > aw) S = FO.icapsLines(B.L.address, aw, 66, 34, 2);   // one line when it sets at 40 pt or more
    const lh = +(S.f*1.0).toFixed(2), ah = S.lines.length*lh + 6;
    const pl = 766 - B.foot - (B.foot ? 24 : 0) - 14, at = pl - 12 - ah;   // bottom up: the foot line, the place line, the street
    let H = at - 40; while(H < 600 && !SW.fits(D, B.hero, 630, H + 9)) H += 4;
    let h = `<div class="abs" style="left:-9pt;top:-9pt;width:630pt;height:${H + 9}pt">${SW.photo(D, B.hero, 'position:absolute;inset:0', 'front.house')}</div>`;
    { const lab = [B.L.address, B.hood].filter(Boolean).join(' · '), len = 766 - (H + 24); h += GS.rail('left', FXS.width(lab.toUpperCase(), JO(8.6, 3.4, 500)) + 24 <= len ? lab : (B.hood || B.L.address), {y0: H + 24}); }   // a short rail carries the neighborhood alone
    S.lines.forEach((l, i) => { h += `<div class="abs gs-icaps" style="left:${X0}pt;top:${at + i*lh}pt;width:${aw}pt;height:${lh + 6}pt;font-size:${S.f}pt;line-height:${lh + 6}pt" data-slot="${i ? 'address.2' : 'address'}" data-lines="1">${esc(l)}</div>`; });
    h += B.placeLine(X0, pl, aw);
    const id = B.room1(); if(id) h += ring1(D, id, cx, H - d/2 + 28, d, 'front.strip0');   // on the seam: mostly on the house photo's foot (the drive), 28 pt into the field, clear of the street under it
    return h + B.tag(); };
  FO.ALT.trio = (D) => { const B = coverBase(D), St = streetFull(B); let h = B.rail + St.html; const sb = 30 + St.h; h += B.placeLine(X0, sb + 10, CW);
    const rooms = FO.coverRooms(D, 3), n = rooms.length, gx = 16, rw = n ? (CW - (n - 1)*gx)/n : 0, rh = n ? Math.round(rw*0.7) : 0;
    const rb = 766 - B.foot - (B.foot ? 22 : 0) - 21, rt = rb - rh, PT = sb + 34, PB = n ? rt - 14 : rb, ph = B.fitH(CW, PB - PT, 260), top = PB - ph;
    h += SW.heroHtml(D, B.hero, X0, top, CW, ph, 'front.house', []);
    rooms.forEach((id, i) => { h += FO.circT(D, id, X0 + rw/2 + i*(rw + gx), rt + rh/2, rw, 'front.strip' + i, {r: +(rh*0.24).toFixed(1), h: rh}); });   // the flyer front's rounded squares, each named under it
    return h + B.tag(); };
  FO.front = (D, o) => { o = o || {};
    { const st = (D.piece || {}).cover || D.coverStyle || FO.COVER; if(FO.ALT[st]) return FO.ALT[st](D, o); }
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {};
    // owner 11/17: the one big round room over the house's corner took away from the house. The cover's small rooms are now switchable:
    // data.piece.cover (or data.coverStyle) = 'row' (default: small rounds spread along the photo's foot, half on the photo) | 'stack' (stacked
    // down its right edge) | 'corner' (along the foot, gathered at the right corner) | 'one' (the earlier single round over the top corner).
    // Up to three rooms; a fold-over shows each space once, so a house with fewer free spaces gets two.
    const style = (D.piece || {}).cover || D.coverStyle || FO.COVER, many = style !== 'one', rooms = many ? FO.coverRooms(D, 3) : [];
    const hood = FXS.hood(L), city = FXS.placeLine(L), hero = FO.heroId(D, F.hero || K.hero || 'front'), room = many ? null : (o.strip || P.strip || [])[0];
    let h = GS.rail('left', [L.address, hood].filter(Boolean).join(' · '));
    const icss = LBI(700, -0.5) + ';text-transform:uppercase', iw = (t, f) => FXS.width(String(t).toUpperCase(), `${icss};font-size:${f}pt`);
    let S = FO.icapsLines(L.address, CW, 70, 34, 2);
    // with the small rooms (owner 11/17 fill): a short first line ("2219" over "ALDER ROW") leaves an empty corner, so the street runs on one line when it fits
    // (a short last line is kept when two rounds fit beside it; else that one runs on one line too)
    const fitsBeside = S0 => S0.lines.length === 2 && style === 'top' && rooms.length >= 2 && X1 - (X0 + iw(S0.lines[1], S0.f) + 20) + 12 >= 2*(96 + 12);
    if(many && S.lines.length === 2 && (iw(S.lines[0], S.f) < CW*0.6 || (iw(S.lines[1], S.f) < CW*0.7 && !fitsBeside(S)))){ const S1 = FO.icapsLines(L.address, CW, 70, 28, 1); if(iw(S1.lines[0], S1.f) <= CW) S = S1; }
    const slh = +(S.f*1.0).toFixed(2);
    S.lines.forEach((l, i) => { h += `<div class="abs gs-icaps" style="left:${X0}pt;top:${30 + i*slh}pt;width:${CW}pt;height:${slh + 6}pt;font-size:${S.f}pt;line-height:${slh + 6}pt" data-slot="${i ? 'address.2' : 'address'}" data-lines="1">${esc(l)}</div>`; });
    const sb = 30 + S.lines.length*slh + 6, d = room ? 168 : 0, place = [hood, city].filter(Boolean).join('  ·  ').toUpperCase();
    // 'top': where the street's last line is short, the rounds sit in the room beside it, perched on the photo's top edge, right-aligned
    const lastW = iw(S.lines[S.lines.length - 1], S.f), lastTop = 30 + (S.lines.length - 1)*slh, DB = 96, nb0 = style === 'top' ? Math.min(rooms.length, Math.floor((X1 - (X0 + lastW + 20) + 12)/(DB + 12))) : 0;
    const placeW = FXS.width(place, JO(8.6, 3.6, 600)) + 10, beside = nb0 >= Math.min(2, rooms.length) ? [3, 2, 1].find(q => q <= nb0 && CW - (q*DB + (q - 1)*12) - 14 >= placeW) || 0 : 0;
    if(beside) rooms.splice(beside);
    // two rooms: one in each top corner of the photo when the house leaves its corners clear (PAIR); else the two flank the place line (LOCK2)
    const hb = ((D.photos || {})[hero] || {}).box, PAIR = style === 'top' && !beside && rooms.length === 2 && !!hb && (hb[1] >= 0.18 || (hb[0] >= 0.28 && hb[2] <= 0.72)), LOCK2 = style === 'top' && !beside && rooms.length === 2 && !PAIR;
    const pw = CW - (d ? d + 10 : 0) - (beside ? beside*DB + (beside - 1)*12 + 14 : 0), ps = Math.min(10.5, FXS.fitSize(place, JO(10.5, 3.6, 600), pw - 6, 10.5, 8.6));
    if(!LOCK2) h += cline('gs-eyebrow', place, X0, sb + 10, pw, ps, 14, 'front.place', 'letter-spacing:3.6pt');
    const line = String(K.line || '').replace(/\.$/, ''), lines = line ? FO.icapsLines(line, CW, 30, 20, 2, LBI(700, -0.3)) : null, llh = lines ? +(lines.f*1.22).toFixed(2) : 0, foot = lines ? lines.lines.length*llh : 0;
    const dt = style === 'top' && rooms.length ? (beside ? DB : rooms.length > 2 ? 104 : LOCK2 ? 116 : 140) : 0, OVT = 12, HANG = 20, dr = (style === 'row' || style === 'corner') && rooms.length ? (rooms.length > 2 ? 112 : 124) : 0, PT = Math.max(sb + 34, room ? sb + 10 + d*0.42 : 0, dt ? (beside ? Math.max(sb + 34, lastTop + 8 + dt - OVT) : (PAIR ? sb + 34 + HANG : LOCK2 ? sb + 4 + dt - OVT : sb + 34 + dt - OVT)) : 0), PB = 766 - foot - (foot ? 22 : 0) - (dr ? dr/2 + 14 : 0);
    let ph = PB - PT; while(ph > 300 && !SW.fits(D, hero, CW, ph)) ph -= 4;
    const top = PT + (PB - PT - ph)*(LOCK2 ? 0 : dt ? 0.5 : 1);   // the house sits on the foot line; any height it gave up opens above it, under the place line ('top': split above and below)
    h += SW.heroHtml(D, hero, X0, top, CW, ph, 'front.house', []);
    if(room) h += GS.circ(D, room, X1 - d/2 + 12, top + d*0.08, d, 'front.strip0', {over: 'front.house', shrink: 'tr'}).replace('class="gs-circ"', `class="gs-circ" data-rise="${Math.max(0, top - sb - 12 - d*0.42)}"`);
    if(many && rooms.length){ const ring = 5, circ = (id, cx, cy, dd, i) => GS.circ(D, id, cx, cy, dd, 'front.strip' + i, {over: 'front.house', ring}).replace('class="gs-circ"', 'class="gs-circ" data-rise="0"');
      const n = rooms.length;
      if(style === 'top' && beside){ rooms.forEach((id, i) => { h += circ(id, X1 - dt/2 - (n - 1 - i)*(dt + 12), top - dt/2 + OVT, dt, i).replace('data-rise="0"', `data-rise="${OVT + 2}"`); }); }
      else if(style === 'top' && LOCK2){ const cy = top - dt/2 + OVT, mw = CW - 2*dt - 28, ms = Math.min(10.5, FXS.fitSize(place, JO(10.5, 3.6, 600), mw - 6, 10.5, 8.6));
        rooms.forEach((id, i) => { h += circ(id, i ? X1 - dt/2 : X0 + dt/2, cy, dt, i); });
        h += cline('gs-eyebrow', place, X0 + dt + 14, cy - 7, mw, ms, 14, 'front.place', 'letter-spacing:3.6pt;text-align:center;text-indent:3.6pt'); }
      else if(style === 'top' && PAIR){ [[X0 + dt/2 + 12, 'tl'], [X1 - dt/2 - 12, 'tr']].forEach(([cx, sh], i) => { h += circ(rooms[i], cx, top - HANG + dt/2, dt, i).replace('data-rise="0"', `data-rise="${Math.max(0, top - HANG - (sb + 28)).toFixed(1)}"`).replace('class="gs-circ"', `class="gs-circ" data-shrink="${sh}"`); }); }   // two rooms: one in each top corner of the photo, over the sky, a little above its edge
      else if(style === 'top'){ const gap = (CW - n*dt)/n, rise = Math.max(0, Math.min(OVT + 2, top - dt + OVT - (sb + 28))); rooms.forEach((id, i) => { h += circ(id, X0 + gap/2 + dt/2 + i*(dt + gap), top - dt/2 + OVT, dt, i).replace('data-rise="0"', `data-rise="${rise.toFixed(1)}"`); }); }   // lifted off a roof at most up to the place line   // perched along the photo's top edge, spread across it, over the sky (lifted clear of a roof that reaches the top)
      else if(style === 'row'){ const gap = (CW - n*dr)/(n + 1); rooms.forEach((id, i) => { h += circ(id, X0 + gap + dr/2 + i*(dr + gap), top + ph, dr, i); }); }
      else if(style === 'corner'){ let xr = X1 + 14; rooms.slice().reverse().forEach((id, j) => { const dd = dr*(1 - 0.17*j); h += circ(id, xr - dd/2, top + ph, dd, n - 1 - j); xr -= dd + 12; }); }   // graduated: the biggest on the corner
      else { const dd = n > 2 ? 100 : 112, hang = 20, step = (ph - 24)/n; rooms.forEach((id, i) => { h += circ(id, X1 - dd/2 + hang, top + 12 + step*(i + 0.5), dd, i); }); } }
    if(lines) lines.lines.forEach((l, i) => { h += `<div class="abs gs-ital" style="left:${X0}pt;top:${766 - foot + i*llh}pt;width:${CW}pt;height:${llh}pt;font-size:${lines.f}pt;line-height:${llh}pt" data-slot="${i ? 'front.line2' : 'front.line'}" data-lines="1">${esc(l)}</div>`; });
    return h;
  };

  // ---------------- FRONT: the two-sided flyer's front (its own composition in the same hand) ----------------
  // The house bleeding off the top and the outer edge; the street in the bold italic capitals on one line; the facts as the sign-in sheet's
  // italic numerals between the flyer's white hairlines; three rooms as round photos, each named in champagne caps; the write-up at the foot.
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [];
    const hood = FXS.hood(L), city = FXS.placeLine(L), hero = FO.heroId(D, F.hero || K.hero || 'front');
    let h = GS.rail('left', [L.address, hood].filter(Boolean).join(' · '), {y0: 360});
    let HB = 344; while(HB < 400 && !SW.fits(D, hero, 621 - X0, HB + 9)) HB += 4; while(HB > 300 && !SW.fits(D, hero, 621 - X0, HB + 9)) HB -= 4;
    h += SW.heroHtml(D, hero, X0, -9, 621 - X0, HB + 9, 'front.house', []);
    // the rail's rule stops above the photo's foot and the words start under it (the photo breaks the rail)
    const as = FXS.fitSize(String(L.address).toUpperCase(), LBI(700, -0.5) + ';text-transform:uppercase', CW, 46, 26), alh = as*1.08;
    let y = HB + 20, t = '';
    t += `<div class="abs gs-icaps" style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:${alh + 4}pt;font-size:${as}pt;line-height:${alh + 4}pt" data-slot="address" data-lines="1">${esc(L.address)}</div>`; y += alh + 8;
    t += cline('gs-eyebrow', [hood, city].filter(Boolean).join('  ·  ').toUpperCase(), X0, y, CW, 9.6, 13, 'front.city', 'letter-spacing:3.6pt'); y += 13 + 16;
    // the facts: italic numerals in the champagne over tracked words, white hairlines between
    const items = FXS.statItems(L).filter(x => !/^Built/.test(x)); const yr = L.yearBuilt || L.year; if(yr) items.push('Built ' + yr);
    const parts = items.slice(0, 5).map(x => { if(/^Built /.test(x)) return {n: String(yr), l: 'Built'}; const p = FXS.statParts(x); return {n: p.n, l: p.l}; });
    const FH = 50, cw = CW/parts.length;
    parts.forEach((p, i) => { const x = X0 + i*cw;
      if(i) t += `<div class="gs-vhair" style="left:${x}pt;top:${y + 4}pt;height:${FH - 8}pt"></div>`;
      const ns = Math.min(24, FXS.fitSize(p.n, LBI(700), cw - 14, 24, 14));
      t += `<div class="gs-num" style="left:${x}pt;top:${y + 2}pt;width:${cw}pt;height:${ns*1.2}pt;font-size:${ns}pt;line-height:${ns*1.2}pt" data-slot="front.facts${i}" data-lines="1">${esc(p.n)}</div>`;
      t += `<div class="gs-numl" style="left:${x}pt;top:${y + 4 + ns*1.2}pt;width:${cw}pt;height:12pt" data-slot="front.facts${i}.l" data-lines="1">${esc(String(p.l || '').toUpperCase())}</div>`; });
    y += FH + 18;
    // three rooms as round photos, then the write-up to the foot
    const strip = (o.strip || P.flyerStrip || P.strip || []).slice(0, 3), nl = o.lines || 4, lh = 17, fs2 = 11.25, wh = nl*lh, wy = 766 - wh;
    // owner 11/23 (p4): the three rooms cropped larger and wider side to side, the rounded corners kept: they share the column's full width (14 pt
    // gutters) and take the full height between the facts and the write-up
    const ns = Math.max(1, strip.length), room = wy - 14 - y - 21, gx = 14, d = (CW - (ns - 1)*gx)/ns, ht = Math.min(room, Math.round(d*0.9)), cy = y + (room - ht)/2 + ht/2;
    strip.forEach((id, i) => { h += FO.circT(D, id, X0 + d/2 + i*(d + gx), cy, d, 'front.strip' + i, {r: +(Math.min(d, ht)*0.24).toFixed(1), h: ht}); });   // rounded corners (owner 11/17)
    t += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${nl}" data-try="${nl},${nl - 1}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0}pt;top:${wy}pt;width:${CW}pt;height:${wh}pt;font-size:${fs2}pt;line-height:${lh}pt"></div>`);
    return h + t;
  };
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight); su.style.top = (766 - n*lh) + 'pt'; su.style.height = (n*lh) + 'pt'; };
  // owner 11/17 (book 4): the flyer front's street sits centered between the photo's foot and the place line under it, measured on the letters
  FO.addrCenter = () => { const ad = document.querySelector('[data-slot="address"]'), pl = document.querySelector('[data-slot="front.city"]'), ph = document.querySelector('.ph[data-slot-photo="front.house"]'); if(!ad || !pl || !ph) return;
    const cv = FO.__cv || (FO.__cv = document.createElement('canvas').getContext('2d')), ink = el => { let top = Infinity, bot = -Infinity; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let nd; const rg = document.createRange();
      while((nd = w.nextNode())){ const tx = nd.textContent.trim(); if(!tx) continue; const cs = getComputedStyle(nd.parentElement); cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; const mm = cv.measureText(cs.textTransform === 'uppercase' ? tx.toUpperCase() : tx);
        rg.selectNodeContents(nd); [...rg.getClientRects()].filter(q => q.width > 1).forEach(q => { const fh = mm.fontBoundingBoxAscent + mm.fontBoundingBoxDescent, sc = q.height/fh || 1, base = q.top + (q.height - fh*sc)/2 + mm.fontBoundingBoxAscent*sc; top = Math.min(top, base - mm.actualBoundingBoxAscent*sc); bot = Math.max(bot, base + mm.actualBoundingBoxDescent*sc); }); }
      return [top, bot]; };
    const [t0, b0] = ink(ad), pt0 = ink(pl)[0], pb = ph.getBoundingClientRect().bottom; if(!isFinite(t0) || !isFinite(pt0)) return;
    const want = pb + ((pt0 - pb) - (b0 - t0))/2, sc = parseFloat(ad.style.width)/(ad.getBoundingClientRect().width || 1); ad.style.top = (parseFloat(ad.style.top) + (want - t0)*sc) + 'pt'; };

  // ---------------- INSIDE: one spread, mirrored about the fold ----------------
  // The left page is railed on its outer (left) edge, the right page on its outer (right) edge. Both open on the eyebrow and the Libre
  // italic headline on one horizon, beside the round photo that sits over the inner top corner of the page's big photo (left page: the
  // kitchen's top right; right page: the lead room's top left), so the two circles flank the fold. The big photos start on one line.
  // Left: the kitchen big, its caption, its blush card (four rows, two by two). Right: the lead room, its caption, a row of rooms.
  FO.KT = 236; FO.CIRC = 152;
  const kitchenCard = (D, T, kicker, heading, x, y, w, hgt, slot) => { const n = T.rows.length, cols = 2, rowsN = Math.ceil(n/cols), lh = +(T.f*1.42).toFixed(2), rowC = 12 + 5 + 2*lh, cg = 30, cwid = T.V, pad = (w - cols*cwid - cg)/2;
    const hs = heading ? FXS.fitSize(String(heading).replace(/\.$/, ''), LBI(700), w - 2*pad, 18, 13) : 0, top = 18 + 12 + (heading ? 6 + hs*1.2 : 0) + 12, rowH = Math.min(rowC + 16, (hgt - top - 14)/rowsN), y0 = y + top + ((hgt - top - 14) - rowsN*rowH)/2;
    let b = `<div class="gs-card" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hgt}pt"></div>`;
    b += cline('gs-eyebrow', String(kicker || '').toUpperCase(), x + pad, y + 18, w - 2*pad, 8.8, 12, slot + '.box.kicker', 'text-align:center;letter-spacing:3pt;text-indent:3pt');
    if(heading) b += cline('gs-ital', String(heading).replace(/\.$/, ''), x + pad, y + 36, w - 2*pad, hs, +(hs*1.2).toFixed(2), slot + '.box.heading', 'text-align:center');
    b += `<div class="abs" style="left:${x + pad + cwid + cg/2 - .5}pt;top:${y0 + 4}pt;width:1pt;height:${rowsN*rowH - 8}pt;background:var(--gs-box-line)"></div>`;
    T.rows.forEach((r, i) => { const col = i % cols, row = Math.floor(i/cols), rx = x + pad + col*(cwid + cg), ry = y0 + row*rowH, c0 = ry + (rowH - rowC)/2;
      if(row) b += `<div class="abs hr" style="left:${rx}pt;top:${ry - .5}pt;width:${cwid}pt;height:1pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${rx}pt;top:${c0}pt;width:${cwid}pt;color:var(--gs-accent)" data-slot="${slot}.list.l${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${rx}pt;top:${c0 + 17}pt;width:${cwid + 1}pt;height:${2*lh}pt;font-weight:400;font-size:${T.f}pt;line-height:${lh}pt;font-family:var(--gs-font);color:var(--fx-soft);overflow:hidden" data-slot="${slot}.list.t${i}" data-lines="2">${esc(r.t)}</div>`; });
    return `<div class="gs-lt">${b}</div>`; };
  FO.kitchenCardH = (T, heading) => { const lh = T.f*1.42, rowC = 12 + 5 + 2*lh, hs = heading ? 18 : 0; return 18 + 12 + (heading ? 6 + hs*1.2 : 0) + 12 + Math.ceil(T.rows.length/2)*(rowC + 16) + 14; };

  // ---------------- INSIDE LEFT (the living level): the kitchen big under the headline, the round room over its top right, the card ----------------
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, ids = P.left || [], heroC = FXS.cardFor(D, ids[0]), circId = ids[1] || null;
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), cw = t => (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new', 'a', 'the', 'and', 'of', 'with', 'in'].includes(w)).map(stem), says = (b, a) => { const bw = cw(b), aw = new Set(cw(a)); return bw.length > 0 && bw.every(w => aw.has(w)); };
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside || {}).items || SFb.inside, (BXb.outside || {}).items || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    let T = FO.tableRows2((box.items || []).slice(0, 10), a => SW.grams4(a).some(g => backG.has(g)) || backT.some(b => says(b, a)), {maxRows: 4, Vs: [204, 210, 216, 222]});
    if(T.rows.length % 2) T = Object.assign({}, T, {rows: T.rows.slice(0, T.rows.length - 1)});
    // the kitchen's caption says what the card does not: the card's unused rows and the room's own lines, never a fact a shown row says
    const shown = T.rows.map(r => r.t), clash = a => shown.some(b => SW.sameFact(a, b) || SW.sharedPhrase(a, b)), RL = (((D.companion || {}).roomLines || {})[heroC.photo] || {}).all || [];
    const STOP = ['with','that','from','into','over','under','along','beside','kitchen','room'], kOver = (a, b) => { const w = t => new Set((String(t).toLowerCase().match(/[a-z]{4,}/g) || []).filter(x => !STOP.includes(x))), A = w(a), B = w(b); let n = 0; A.forEach(x => { if(B.has(x)) n++; }); return n >= 2; };
    const kS = [].concat(heroC.s || [], (box.items || []).filter(it => !T.rows.some(r => r.l === it.l)).map(it => [].concat(it.s[0])), RL).map(x => [].concat(x).filter(a => !clash(a))).filter(a => a.length).filter((a, i, arr) => !arr.slice(0, i).some(b => SW.sameFact(a[0], b[0]) || kOver(a[0], b[0])));
    const kC = Object.assign({}, heroC, {s: kS, noAugment: true});
    // owner 11/17 (inside spread redesign): the headline on one shorter line, so the kitchen starts high and runs tall; the round room stands at the
    // top of the column beside it, laid over the kitchen's right edge; the captions, in bigger type, fill the column under it
    let h = GS.rail('left', (D.listing || {}).address);
    const hd = FO.headL(I.kicker, I.title, 'left', X0, 30, CW, {max: 36, min: 25, lines: 1}); h += hd.html;
    const KT = hd.y + 20, cardH = FO.kitchenCardH(T, box.heading), cardY = 766 - cardH, PB = cardY - 18, PW = 350, CXc = X0 + PW, SX = CXc + 16, OV = 20, d = X1 - (CXc - OV), SY = KT + (circId ? d + 16 : 0), SH = PB - SY;
    h += FXS.box(D, kC.photo, X0, KT, PW, PB - KT, 'left.wide');
    if(circId){ const cc = FXS.cardFor(D, circId); h += GS.circ(D, circId, X1 - d/2, KT + d/2, d, 'left.circle', {ring: 6}); h += FO.sideCap(D, cc, SX, SY, X1 - SX, SH*0.4, 'left.circle', SH); }
    h += FO.sideCap(D, kC, SX, SY, X1 - SX, circId ? SH*0.6 - 18 : SH, 'left.wide', SH, true);
    h += kitchenCard(D, T, box.kicker || 'The kitchen', box.heading, X0, cardY, CW, cardH, 'left');
    return h;
  };
  // a caption standing in a column beside a photo (the round room's): its room name run in, as many lines as its column holds (top aligned)
  FO.sideCap = (D, c, x, y, w, hh, slot, col, noAug) => { if(!noAug) c = FXS.augment(D, c); const name = FXS.leadLabel(c.lead).name, lh = 16.5, n = Math.max(3, Math.floor(hh/lh)), tr = []; for(let q = n; q >= 3; q--) tr.push(q);
    return `<div class="abs cap"><div class="a" style="position:absolute;left:${x}pt;top:${y}pt;width:${w}pt;height:${n*lh}pt;font-size:11.6pt;line-height:${lh}pt" data-slot="${slot}.side" data-lead="${esc(name ? name + '.' : '')}" data-room="${esc(name)}" data-nopair="1" data-flexh="1" data-lh="${lh}" data-lines="${n}" data-try="${tr.join(',')}" data-min="3" data-narrow="0" data-sidecap="${col || hh}" data-y0="${y}" data-sidex="${x}" ${FXS.sd(c.s)}></div></div>`; };

  // ---------------- INSIDE RIGHT (bedrooms and baths): the lead room under the headline, the round room over its top left, a row ----------------
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs = FO.cards(D, P.right || []);
    const RX0 = 30, RX1 = 546, RW = RX1 - RX0, PW = 350, PX = RX1 - PW, OV = 20, d = PX + OV - RX0;
    let h = GS.rail('right', (D.listing || {}).address);
    const hd = FO.headL(R.kicker || '', R.title || '', 'right', RX0, 30, RW, {max: 36, min: 25, lines: 1}); h += hd.html;
    const KT = hd.y + 20, circC = cs.length >= 3 ? cs[cs.length - 1] : null, rest = cs.slice(1, circC ? cs.length - 1 : 4), n = rest.length, g = 16, L = n > 1 ? 4 : 3, clh = 13.5;
    const RH = n > 2 ? 150 : n === 2 ? 172 : 128, y2 = 766 - L*clh - 8 - RH, PB = y2 - 22, SY = KT + (circC ? d + 16 : 0), SH = PB - SY, SW_ = PX - 16 - RX0;
    h += FXS.box(D, cs[0].photo, PX, KT, PW, PB - KT, 'right.photo0');
    if(circC){ h += GS.circ(D, circC.photo, RX0 + d/2, KT + d/2, d, 'right.circle', {ring: 6}); h += FO.sideCap(D, circC, RX0, SY, SW_, SH*0.46, 'right.circle', SH); }
    h += FO.sideCap(D, cs[0], RX0, SY, SW_, circC ? SH*0.54 - 18 : SH, 'right.photo0', SH);
    const ws = (RW - (n - 1)*g)/Math.max(1, n); let x = RX0;
    if(n === 1){ const pw1 = Math.round(RW*0.6), zh = 766 - y2; h += FXS.box(D, rest[0].photo, RX0, y2, pw1, zh, 'right.photo1') + FO.sideCap(D, rest[0], RX0 + pw1 + 18, y2, RW - pw1 - 18, zh, 'right.photo1', zh); }
    else rest.forEach((c, i) => { h += FO.capT(D, c, x, y2, ws, RH, L, 'right.photo' + (i + 1), {fs: n > 2 ? 9.75 : 10.25, lh: clh, min: 3}); x += ws + g; });
    return h;
  };
  FO.rightFit = () => {}; FO.leftHead = () => {};
  // owner 11/23 (books 2-3 p3: "still too much blank space above Beverage station and above Primary bath. Fill it"): before the column is
  // centered, its captions re-pick their true sentences at the size (up to 1.35x) and line counts that fill the column best; then they are centered
  // each line's width over the box's width, measured on the set words (min: the shortest line but the last; last: the last line)
  FO.lineFill = el => { const W = el.getBoundingClientRect().width, rows = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let nd; const rg = document.createRange();
    while((nd = w.nextNode())){ rg.selectNodeContents(nd); [...rg.getClientRects()].filter(q => q.width > .5).forEach(q => { const r = rows.find(x => Math.abs(x.t - q.top) < q.height*0.5); if(r){ r.l = Math.min(r.l, q.left); r.r = Math.max(r.r, q.right); } else rows.push({t: q.top, l: q.left, r: q.right}); }); }
    rows.sort((a, b) => a.t - b.t); const f = rows.map(r => (r.r - r.l)/W); return {n: rows.length, min: f.length > 1 ? Math.min(...f.slice(0, -1)) : 1, last: f.length ? f[f.length - 1] : 0}; };
  // after sideGrow + sideFit: where the print check's caption measure (captionfill.js) flags a caption in a column it changed, that column
  // goes back to the fill's own setting (captions and round photo), centered again
  FO.sideVerify = () => { const K = FO.__sideKeep || []; if(!K.length) return; const cf = window.CaptionFill; if(!cf){ return; }
    const hits = new Set(cf.check().map(x => x.slot)); let undo = false;
    K.forEach(k => { if(!k.els.some(e => hits.has(e.dataset.slot))) return; undo = true;
      k.els.forEach((e, i) => { const v = k.vals[i]; [e.innerHTML, e.style.fontSize, e.style.lineHeight, e.style.height, e.style.textAlign, e.dataset.lines, e.dataset.y0, e.dataset.sidecap] = v; });
      if(k.circ) { k.circ.style.width = k.circ.style.height = k.cw; k.circ.style.left = k.cl; } });
    if(undo) FO.sideFit(); };
  FO.sideGrow = () => { FO.__sideKeep = []; const G = new Map(); document.querySelectorAll('[data-sidecap]').forEach(el => { if(!el.textContent.trim()) return; const k = el.dataset.sidex + '|' + el.dataset.y0 + '|' + [...document.querySelectorAll('.panel, .sheet')].indexOf(el.closest('.panel, .sheet')); (G.get(k) || G.set(k, []).get(k)).push(el); });
    G.forEach(els => { const hh = +els[0].dataset.sidecap, gap = 16, keep = els.map(e => [e.innerHTML, e.style.fontSize, e.style.lineHeight, e.style.height, e.style.textAlign, e.dataset.lines]);
      { const sd = (els[0].dataset.slot || '').split('.')[0], cc = document.querySelector(`.gs-circ[data-circ="${sd}.circle"]`); FO.__sideKeep.push({els, vals: els.map(e => [e.innerHTML, e.style.fontSize, e.style.lineHeight, e.style.height, e.style.textAlign, e.dataset.lines, e.dataset.y0, e.dataset.sidecap]), circ: cc, cw: cc && cc.style.width, cl: cc && cc.style.left}); }
      const used = () => els.reduce((a, e) => a + SW.lines(e).n*parseFloat(e.style.lineHeight), 0) + gap*(els.length - 1);
      const fs0 = parseFloat(getComputedStyle(els[0]).fontSize)*0.75, r = (parseFloat(getComputedStyle(els[0]).lineHeight)*0.75)/fs0 || 1.42;
      const side = (els[0].dataset.slot || '').split('.')[0], circ = document.querySelector(`.gs-circ[data-circ="${side}.circle"]`), colW = parseFloat(els[0].style.width);
      const need = (e, dW) => { if(!/\.circle\.side$/.test(e.dataset.slot || '') || !circ) return 0.87; const cw = parseFloat(circ.style.width) + (dW || 0), Wm = colW < 0.8*cw ? colW : cw; return 0.87 + 0*Wm; };   // captionfill (sideVerify checks the finished page)'s measure
      let best = {tot: used(), f: fs0, picks: null};
      if(hh - best.tot < fs0*r*0.9) return;   // already within a line of full
      for(let f = fs0; f <= fs0*1.5 + 1e-6; f += 0.25){ const lh = f*r, opts = els.map(e => { const o = []; e.style.fontSize = f + 'pt'; e.style.lineHeight = lh + 'pt'; e.style.textAlign = 'left';
          for(let T = Math.floor((hh - gap*(els.length - 1))/lh) - 3*(els.length - 1); T >= 3; T--){ e.style.height = (T*lh) + 'pt'; const b = SW.pfN(e, T); if(!b) continue; const lead = e.dataset.lead || ''; e.innerHTML = (lead ? `<b>${SW.esc(lead)}</b> ` : '') + b.pick.map(x => SW.esc(x)).join(' ');
            const Ln = FO.lineFill(e), nd = need(e); if(Ln.n === T && Ln.min >= nd && Ln.last >= Math.max(0.9, nd)) o.push({T, pick: b.pick}); } return o; });   // every line 87%+ of the column: 80%+ of the round photo over it (captionfill measures the photo)
        if(opts.some(o => !o.length)) continue;
        const walk = (i, acc, tot) => { if(i === els.length){ tot += gap*(els.length - 1); if(tot <= hh + 0.5 && (tot > best.tot + 0.5 || (Math.abs(tot - best.tot) <= 0.5 && f > best.f))) best = {tot, f, picks: acc.slice()}; return; }
          opts[i].forEach(o => { if(tot + o.T*lh <= hh + 0.5) walk(i + 1, acc.concat([o]), tot + o.T*lh); }); };
        walk(0, [], 0); }
      els.forEach((e, i) => { [e.innerHTML, e.style.fontSize, e.style.lineHeight, e.style.height, e.style.textAlign, e.dataset.lines] = keep[i]; });
      if(!best.picks) return;
      const lh = best.f*r; els.forEach((e, i) => { const P = best.picks[i], lead = e.dataset.lead || ''; e.style.fontSize = best.f + 'pt'; e.style.lineHeight = lh + 'pt'; e.style.height = (P.T*lh) + 'pt';
        e.innerHTML = (lead ? `<b>${SW.esc(lead)}</b> ` : '') + P.pick.map(x => SW.esc(x)).join(' '); if(SW.noteGrams) SW.noteGrams(e, lead + ' ' + P.pick.join(' ')); e.dataset.lines = P.T; e.style.textAlign = keep[i][4];
        if(!okEl(e, P.T)) [e.innerHTML, e.style.fontSize, e.style.lineHeight, e.style.height, e.style.textAlign, e.dataset.lines] = keep[i]; }); });
    // a column the listing's true sentences still cannot fill: its round photo grows (up to 72 pt wider, its outer edge and top kept, further over
    // the big photo's edge) and the captions start that much lower, so no empty band opens between the round photo and the words
    G.forEach(els => { if(!els.some(e => /\.circle\.side$/.test(e.dataset.slot || ''))) return;   // only the column under the round photo
      const side = (els[0].dataset.slot || '').split('.')[0], c = document.querySelector(`.gs-circ[data-circ="${side}.circle"]`); if(!c) return;
      const hh = +els[0].dataset.sidecap, tot = els.reduce((a, e) => a + SW.lines(e).n*parseFloat(e.style.lineHeight), 0) + 16*(els.length - 1), L = hh - tot - 6; if(L < 8) return;
      const colW = parseFloat(els[0].style.width), d0 = parseFloat(c.style.width), ok = g => els.every(e => { if(!/\.circle\.side$/.test(e.dataset.slot || '')) return true; const cw = d0 + g, Wm = colW < 0.8*cw ? colW : cw, q = 0.86*Wm/colW, Ln = FO.lineFill(e); return Ln.min >= q && Ln.last >= q; });
      let g = Math.min(72, L); while(g > 0 && !ok(g)) g -= 2; if(g < 8) return;   // never so wide that a caption line under it measures short against it
      c.style.width = c.style.height = (d0 + g) + 'pt'; if(side === 'left') c.style.left = (parseFloat(c.style.left) - g) + 'pt';
      els.forEach(e => { e.dataset.y0 = +e.dataset.y0 + g; e.dataset.sidecap = hh - g; }); }); };
  // after the fill: a caption in the column beside a photo sits centered top to bottom in that column (owner 11/16: everything centered in its space)
  FO.sideFit = () => { const G = new Map(); document.querySelectorAll('[data-sidecap]').forEach(el => { const k = el.dataset.sidex + '|' + el.dataset.y0 + '|' + [...document.querySelectorAll('.panel, .sheet')].indexOf(el.closest('.panel, .sheet')); (G.get(k) || G.set(k, []).get(k)).push(el); });
    G.forEach(els => { const hh = +els[0].dataset.sidecap, gap = 16; els.forEach(el => { const n = SW.lines(el).n, lh = parseFloat(el.style.lineHeight); el.style.height = (n*lh) + 'pt'; el.dataset.lines = n; el.__h = n*lh; });
      const tot = els.reduce((a, e) => a + e.__h, 0) + gap*(els.length - 1); let y = +els[0].dataset.y0 + Math.max(0, (hh - tot)/2);
      els.forEach(el => { el.style.top = y + 'pt'; y += el.__h + gap; }); }); };

  // ---------------- BACK (fold-over) and flyer back ----------------
  // Railed on the outer edge like every page. At the top the column of words (eyebrow, the Libre italic headline, the floor-by-floor
  // write-up) beside the plan, which sits in a box its own width on the right (no plan: the outdoor photo, captioned); then a row of
  // captioned photos; then the sign-in sheet's blush card as one ruled table of three columns: what is new, outside, nearby; the
  // half-height card and the fine print.
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    const rowIds = flyer ? (P.flyerBack || []).slice(0, 3) : (P.backRow || ['bath2']).slice(0, 3), rowCards = FO.cards(D, rowIds);
    const TOP = 30, CT = FO.CARD_Y - 14, TBH = 104, TBY = CT - TBH, n = Math.max(1, rowCards.length), CL = 3, clh = 13; let RH = flyer ? (n > 2 ? 106 : 118) : (n > 2 ? 112 : 128), RY = TBY - 14 - CL*clh - 8 - RH, ZB = RY - 20, wuB = null;
    let h = GS.rail('left', (D.listing || {}).address), t = '', colX, colW;
    // the plan (its box its own width, on the right) or the outdoor photo
    // owner 11/24 (books 2-3 round 2 p4, p6; a standing rule for every plan with a room sizes table): the plan larger and taller, closer to the
    // top; the table tighter (short ruled rows) and listing every room with its size
    if(hasPlan){ const PM = (D.plan.levels || []).length >= 3 ? 360 : 330, PT = 16, RT = FO.roomTable(D), need = RT.rows.length ? FO.roomTableNeed(RT) : 0;
      let wide = false, tNeed = RT.rows.length ? 10 + FO.RT_KH + Math.ceil(RT.rows.length/2)*FO.RT_RH : 0;
      // owner 11/23 (books 2-3 p5, every flyer back; carried to the fold-over back, same builder): the plan moves up to the top and a table of
      // the listing's room sizes (its facts when it gives none) sits under it, in the plan's own width, down to the photo row
      let pM = Math.max(160, ZB - PT - tNeed), pc0 = FO.planBox(D, X0, PT, pM, PM);
      for(let k = 0; k < 4 && RT.rows.length && pc0.bottom + tNeed > ZB + 0.5 && pM > 160; k++){ pM = Math.max(160, pM - (pc0.bottom + tNeed - ZB)); pc0 = FO.planBox(D, X0, PT, pM, PM); }   // the plan's card can run taller than asked: the table keeps its full rows
      // the room names do not fit two to a row under the plan: the table runs the page's full width in four columns under the plan and the write-up
      if(RT.rows.length && need > Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc0.html)[1])) + 0.5){ wide = true; tNeed = 10 + FO.RT_KH + Math.ceil(RT.rows.length/4)*FO.RT_RH; pM = Math.max(160, ZB - PT - tNeed); pc0 = FO.planBox(D, X0, PT, pM, PM);
        for(let k = 0; k < 4 && pc0.bottom + tNeed > ZB + 0.5 && pM > 160; k++){ pM = Math.max(160, pM - (pc0.bottom + tNeed - ZB)); pc0 = FO.planBox(D, X0, PT, pM, PM); } }
      const pw = Math.round(parseFloat(/width:([\d.]+)pt/.exec(pc0.html)[1])), py = RT.rows.length ? PT : PT + Math.max(0, (ZB - PT - (pc0.bottom - PT))/2), pc = FO.planBox(D, X1 - pw, py, pM, PM);
      h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; colX = X0; colW = X1 - pw - 22 - X0;
      if(RT.rows.length){ const nc = wide ? 4 : 2, tw = wide ? CW : pw, rowsN = Math.ceil(RT.rows.length/nc), tH = FO.RT_KH + rowsN*FO.RT_RH;
        // a plan that cannot grow (its own resolution or width) leaves room: the table's rows take a little, the photo row the rest (never a gap)
        const slack = Math.max(0, ZB - (pc.bottom + 10 + tH)), give = Math.min(slack, 110); RH += give; RY -= give; ZB -= give;
        const tH2 = Math.min(FO.RT_KH + rowsN*(FO.RT_RH + 1.5), ZB - pc.bottom - 10);
        h += FO.roomTableHtml(RT, X1 - tw, pc.bottom + 10, tw, tH2, nc);
        if(wide) wuB = pc.bottom;   // the full-width table: the write-up ends level with the plan's foot
        colX = X0; colW = X1 - pw - 22 - X0; } }
    else { const c = FXS.cardFor(D, topId), pw = 288, tph = ZB - TOP - 8 - 3*13; h += FO.capT(D, c, X1 - pw, TOP, pw, tph, 3, 'back.top', {fs: 10, lh: 13, min: 3}); colX = X0; colW = X1 - pw - 22 - X0; }
    // the row of captioned photos
    { const g = 16, pw = (CW - (n - 1)*g)/n; rowCards.forEach((c, i) => { h += FO.capT(D, c, X0 + i*(pw + g), RY, pw, RH, CL, 'back.photo' + i, {fs: n > 2 ? 9.25 : 10, lh: clh, min: 3}); }); }
    // the column: eyebrow, headline, short champagne rule, the write-up filling to the plan's foot
    const kickT = +(D.listing || {}).stories > 1 ? 'Floor by floor' : 'Room by room', ht = String((hasPlan ? (KB.plan || {}).title : (KB.noplan || {}).title) || '').replace(/\.$/, '');
    const hd = FO.headL(kickT, ht, 'back.about', colX, TOP, colW, {max: 28, min: 20}); t += hd.html;
    t += `<div class="gs-rule" style="left:${colX}pt;top:${hd.y + 10}pt;width:56pt;height:1.2pt"></div>`;
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 5), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 5), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const T0 = hd.y + 24, zb = wuB || ZB, nL = Math.max(3, Math.floor((zb - T0)/15.5)), lhw = +((zb - T0)/nL).toFixed(3);
    t += FO.full(FO.wu(keep(f2.concat(f1)), colX, T0, colW, nL*lhw + 0.01, 'back.about', 10.5, lhw, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-vc="1"${hasPlan ? ' data-growmax="1.45"' : ''} data-span="${(zb - T0).toFixed(2)}" data-pool="${Math.max(P.pool || 16, 18)}"` + (colW < 240 ? ' data-rag="1"' : ''));
    // the blush card: one ruled table of three columns (the sign-in sheet's), champagne labels, white hairlines between
    { const pad = 18, g = 22, w3 = (CW - 2*pad - 2*g)/3, x = i => X0 + pad + i*(w3 + g), ly = TBY + 16, by = ly + 20, rows = 3, rh = (TBH - 16 - 20 - 12)/rows, fs = 9.6;
      let b = `<div class="gs-card" style="left:${X0}pt;top:${TBY}pt;width:${CW}pt;height:${TBH}pt"></div>`;
      [1, 2].forEach(i => { b += `<div class="abs" style="left:${x(i) - g/2 - .5}pt;top:${TBY + 14}pt;width:1pt;height:${TBH - 28}pt;background:var(--gs-box-line)"></div>`; });
      b += FO.kick(t1, x(0), ly, 'back.updates.title') + FXS.bullets(c1, x(0), by, w3, rh, 'back.updates', rows, fs).html;
      b += FO.kick('Outside', x(1), ly, 'back.outside.title') + FXS.bullets(c2, x(1), by, w3, rh, 'back.outside', rows, fs).html;
      b += FO.kick('Nearby', x(2), ly, 'back.near.kicker');
      (KB.nearby || []).slice(0, 3).forEach((nb, i) => { const pl = String(nb.place); let ds = 12.5, ps = 9.6; const wOf = () => FXS.width(String(nb.dist), LBI(700) + `;font-size:${ds}pt`) + 8 + FXS.width(pl, `font-family:Instrument Sans;font-weight:400;font-size:${ps}pt`); while(wOf() > w3 - 2 && ps > 8.6) ps -= 0.2; while(wOf() > w3 - 2 && ds > 10) ds -= 0.5;
        b += `<div class="fo-near" style="left:${x(2)}pt;top:${by + i*rh}pt;width:${w3}pt;height:${rh}pt" data-slot="back.near${i}" data-lines="1" data-fine="1"><div class="in"><span class="d" style="font-size:${ds}pt">${esc(nb.dist)}</span><span class="p" style="font-size:${ps}pt">${esc(pl)}</span></div></div>`; });
      t += `<div class="gs-lt">${b}</div>`; }
    h += `<div class="gs-ink">${t}</div>`;
    h += FO.contact(D, X0, FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D);
    return {html: h, issues};
  };

  // the table under the plan: the listing's rooms with their sizes (by floor on a home of two or more stories); without room sizes, its facts
  FO.roomTable = D => { const L = D.listing || {}, multi = +L.stories > 1, ord = ['First', 'Second', 'Third', 'Fourth'];
    const rooms = (L.rooms || []).filter(r => r && r.name && r.size).map(r => ({l: r.name, v: String(r.size).replace(/\s*x\s*/i, ' × '), lv: +r.level || 0}));
    if(rooms.length >= 3) return {title: 'Room sizes', rows: rooms.sort((a, b) => a.lv - b.lv)};
    const rows = []; if(L.beds) rows.push({l: 'Bedrooms', v: String(L.beds)}); if(L.baths) rows.push({l: 'Baths', v: String(L.baths)}); if(L.sqft) rows.push({l: 'Square feet', v: Number(L.sqft).toLocaleString('en-US')});
    if(L.stories) rows.push({l: 'Stories', v: String(L.stories)}); if(L.yearBuilt) rows.push({l: 'Built', v: String(L.yearBuilt)}); if(L.lotSize) rows.push({l: 'Lot', v: String(L.lotSize).replace(/\s*Lot$/i, '')});
    return {title: 'The facts', rows: rows.length >= 3 ? rows : []}; };
  FO.RT_KH = 16; FO.RT_RH = 16.5;
  FO.roomTableNeed = RT => { let m = 0; RT.rows.forEach(r => { m = Math.max(m, FXS.width(r.l, 'font-family:Instrument Sans;font-weight:500;font-size:8.8pt') + FXS.width(r.v, `${LBI(700)};font-size:${(8.8*1.06).toFixed(2)}pt`) + 10); }); return Math.ceil(2*m + 12); };   // owner 11/24: the tight table (kicker, row)
  FO.roomTableHtml = (RT, x, y, w, hh, nc) => { nc = nc || 2; const n = RT.rows.length, rowsN = Math.ceil(n/nc), kh = FO.RT_KH, rh = Math.min(FO.RT_RH + 1.5, (hh - kh)/rowsN), top = y + Math.max(0, (hh - kh - rowsN*rh)/2), g = 12, cw = (w - (nc - 1)*g)/nc;
    // two columns of rooms (the plan above names the floors), champagne hairlines between rows, the size in the set's italic
    const lab = (r, cx) => { let fs = Math.min(10, rh*0.58); const vw = () => FXS.width(r.v, `${LBI(700)};font-size:${fs*1.06}pt`), lw = () => FXS.width(r.l, `font-family:Instrument Sans;font-weight:500;font-size:${fs}pt`); while(fs > 8.6 && lw() + vw() + 4 > cw) fs -= 0.2; return Math.max(8.6, fs); };
    const fsAll = Math.min(...RT.rows.map(r => lab(r))), lh = fsAll*1.3;
    let b = cline('gs-eyebrow', RT.title.toUpperCase(), x, top, w, 9, 12, 'back.rooms.kicker', 'letter-spacing:3pt');
    for(let k = 0; k <= rowsN; k++) b += `<div class="abs" style="left:${x}pt;top:${top + kh + k*rh}pt;width:${w}pt;height:1pt;background:var(--gs-accent);opacity:.45"></div>`;
    for(let c = 1; c < nc; c++) b += `<div class="abs" style="left:${x + c*(cw + g) - g/2 - .3}pt;top:${top + kh + 4}pt;width:1pt;height:${rowsN*rh - 8}pt;background:var(--gs-accent);opacity:.45"></div>`;
    RT.rows.forEach((r, i) => { const col = Math.floor(i/rowsN), row = i % rowsN, cx = x + col*(cw + g), ty = top + kh + row*rh + (rh - lh)/2, vW = Math.ceil(FXS.width(r.v, `${LBI(700)};font-size:${fsAll*1.06}pt`)) + 2;
      b += `<div class="abs" style="left:${cx}pt;top:${ty}pt;width:${cw - vW - 3}pt;height:${lh}pt;font-family:Instrument Sans;font-weight:500;font-size:${fsAll}pt;line-height:${lh}pt;color:var(--gs-on);white-space:nowrap" data-slot="back.rooms${i}" data-lines="1">${esc(r.l)}</div>`;
      b += `<div class="abs" style="left:${cx + cw - vW}pt;top:${ty}pt;width:${vW}pt;height:${lh}pt;font-family:'Libre Baskerville';font-style:italic;font-weight:700;font-size:${(fsAll*1.06).toFixed(2)}pt;line-height:${lh}pt;color:var(--gs-accent);text-align:right;white-space:nowrap" data-slot="back.rooms${i}.size" data-lines="1">${esc(r.v)}</div>`; });
    return b; };
  FO.tallStack = () => { const col = document.querySelector('[data-tallcol]'); if(!col) return; const bottom = +col.dataset.tallcol, ps = [...document.querySelectorAll('[data-para]')]; if(ps.length < 2) return;
    const [a, b] = ps, la = parseFloat(a.style.lineHeight), lb = parseFloat(b.style.lineHeight), na = SW.lines(a).n, nb = SW.lines(b).n;
    a.style.height = (na*la) + 'pt'; b.style.top = (parseFloat(a.style.top) + na*la + 9) + 'pt'; b.style.height = (nb*lb) + 'pt';
    const free = bottom - 8 - (parseFloat(b.style.top) + nb*lb); if(free < 1) return;
    const cap = document.querySelector('.cap .a[data-slot="back.photo0"]'), ph = document.querySelector('.ph[data-slot-photo="back.photo0"]'), pb = ph && ph.parentElement, lbl = document.querySelector('[data-slot="back.photo0.label"]');
    if(pb) pb.style.height = (parseFloat(pb.style.height) + free) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + free) + 'pt'; if(cap) cap.style.top = (parseFloat(cap.style.top) + free) + 'pt';
    document.querySelectorAll('[data-tall]').forEach(e => { e.style.top = (parseFloat(e.style.top) + free) + 'pt'; }); };
  // after the fill: a block with data-span spreads the lines it took over that height, so its last line ends where its neighbor's does (owner 11/7, p12)
  FO.span = () => document.querySelectorAll('[data-span]').forEach(el => { const T = +el.dataset.lines, lh = Math.min(+el.dataset.span/T, parseFloat(getComputedStyle(el).fontSize)*0.75*1.75); el.style.lineHeight = lh + 'pt'; el.style.height = (T*lh) + 'pt'; el.style.top = (parseFloat(el.style.top) + (el.dataset.vc ? (+el.dataset.span - T*lh)/2 : +el.dataset.span - T*lh)) + 'pt'; });
  // the facts row: no two facts closer than 6 pt (text boxes measured on the letters)
  FO.factsCheck = () => { const out = [], it = [...document.querySelectorAll('.fo-fact')].map(e => { const r = document.createRange(); r.selectNodeContents(e); const qs = [...r.getClientRects()].filter(q => q.width > 1); return {slot: e.dataset.slot, l: Math.min(...qs.map(q => q.left)), r: Math.max(...qs.map(q => q.right)), t: Math.min(...qs.map(q => q.top)), b: Math.max(...qs.map(q => q.bottom))}; }).sort((a, b) => a.l - b.l);
    for(let i = 1; i < it.length; i++){ const a = it[i-1], b = it[i], gap = (b.l - a.r)*0.75, vo = Math.min(a.b, b.b) - Math.max(a.t, b.t); if(vo > 2 && gap < 6) out.push({slot: b.slot, kind: 'facts-collide', detail: `${a.slot} and ${b.slot} are ${gap.toFixed(1)} pt apart (6 pt minimum)`}); }
    return out; };
  // no text may sit under a photo or the agent card (the owner's clearance rule, 11/7): any text box that overlaps one fails
  FO.overlapCheck = () => { const out = [], els = [...document.querySelectorAll('.ph, .fo-acard:not(.abs)')].map(e => ({e, r: e.getBoundingClientRect()})).filter(x => x.r.width > 2 && x.r.height > 2), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement; if(!p || !n.textContent.trim() || p.closest('script, style, .plan-svg, .planwrap, .fo-acard, .logo, .gs-tab')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(q => { if(q.width < 2 || q.height < 2) return;
        els.forEach(({e, r}) => { if(e.contains(p)) return; const ox = Math.min(q.right, r.right) - Math.max(q.left, r.left), oy = Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top);
          if(ox > 1.5 && oy > 3) out.push({slot: (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || 'text', kind: 'text-under-element', detail: `"${n.textContent.trim().slice(0, 28)}" overlaps a ${e.className.split(' ')[0]}`}); }); }); }
    const seen = new Set(); return out.filter(i => { const k = i.slot + i.detail; if(seen.has(k)) return false; seen.add(k); return true; }); };
})();
