/* Formal Invitation fold-over and two-sided flyer builders (grown from the FXS-14 builders; the hand is the approved Open House library
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
  FO.gaps = () => document.querySelectorAll('[data-slot]').forEach(el => { if(getComputedStyle(el).textAlign !== 'justify' || el.querySelector('[data-slot]')) return;
    const sp = parseFloat(getComputedStyle(el).fontSize)*0.28; let worst = 0; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const t = n.textContent; for(let i = 0; i < t.length; i++){ if(t[i] !== ' ') continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const q = r.getBoundingClientRect(); if(q.width > worst && q.height > 0) worst = q.width; } }
    if(worst > sp*3.2) el.style.textAlign = 'left'; });
  FO.fill3Check = () => [...document.querySelectorAll('[data-j3]')].filter(el => el.textContent.trim()).flatMap(el => { const L = SW.lines(el);
    return L.n < 3 ? [{slot: el.dataset.slot, kind: 'writeup-under-3-lines', lines: L.n}] : L.fill < 0.895 ? [{slot: el.dataset.slot, kind: 'writeup-last-line-short', pct: Math.round(L.fill*100)}] : []; });

  // Formal Invitation: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Formal Invitation refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
  // (three lines or more, every line 80%+ set ragged, the last 90%+, rows of one table or one photo row on one line count) is set again
  // as a group: the line counts it may take x type sizes from its own size up a quarter (0.25 pt steps) and down 8%, at its own height
  // (the leading follows), until every member's true sentences fill. Nothing is cut or narrowed; only whole sentences, only real copy.
  const okEl = (el, T) => { const L = SW.lines(el); return L.n === T && L.fill >= 0.895 && (L.n < 2 || L.min >= 0.8) && !SW.sameFactIn(el.textContent) && !SW.rep5(el.textContent); };
  FO.refit = () => { const G = new Map();
    document.querySelectorAll('[data-s][data-slot]').forEach(el => { if(!el.getClientRects().length || el.dataset.nofit) return;
      const tb = /^(.*\.box)\.t\d+$/.exec(el.dataset.slot || ''), cap = el.closest('.cap'), face = el.closest('.panel, .sheet');
      const key = tb ? 'tb:' + tb[1] : cap ? 'cap:' + [...document.querySelectorAll('.panel, .sheet')].indexOf(face) + ':' + Math.round(parseFloat(el.style.top)) : 'el:' + el.dataset.slot;
      (G.get(key) || G.set(key, []).get(key)).push(el); });
    [...G.values()].sort((a, b) => (b[0].closest('.cap') ? 1 : 0) - (a[0].closest('.cap') ? 1 : 0)).forEach(els => { const n0 = Math.max(...els.map(e => SW.lines(e).n));   // photo captions first: their pools are the thinnest
      const minl = +els[0].dataset.minl || 3;
      const clash = els.some(e => { if(!e.closest('.cap')) return false; const face = e.closest('.panel, .sheet'), mine = SW.sentences(e.textContent, e.dataset.lead || ''); return [...(face ? face.querySelectorAll('.cap .a[data-slot]') : [])].some(o => o !== e && SW.sentences(o.textContent, '').some(x => mine.some(y => SW.sameFact(x, y)))); });
      if(n0 >= minl && !clash && els.every(e => okEl(e, n0))) return;
      const H = Math.min(...els.map(e => +e.dataset.hfit || (e.dataset.hfit = parseFloat(e.style.height) || e.getBoundingClientRect().height*0.75)));
      const fs0 = +els[0].dataset.fs0 || (els[0].dataset.fs0 = parseFloat(getComputedStyle(els[0]).fontSize)*0.75);
      const tmax = Math.max(3, Math.min(+els[0].dataset.maxl || 8, Math.floor((H + 24)/(fs0*1.18)))), counts = []; for(let t = tmax; t >= minl; t--) if(Math.abs(t - Math.max(minl, n0)) <= 1 || els.every(e => e.closest('.cap.side'))) counts.push(t);
      const fst = +els[0].dataset.fstep || 0.2, sizes = []; for(let f = fs0; f <= fs0*1.28 + 1e-6; f += fst) sizes.push(+f.toFixed(2)); for(let f = fs0 - fst; f >= fs0*0.92 - 1e-6; f -= fst) sizes.push(+f.toFixed(2));
      const keep = els.map(e => [e.innerHTML, e.style.fontSize, e.style.lineHeight, e.style.height]);
      let done = false;
      // a row of two photo captions may share its width unevenly (each photo as wide as its caption's true sentences fill)
      const pair = els.length === 2 && els.every(e => e.closest('.cap') && !e.closest('.cap.side')), parts = pair ? els.map(e => { const sl = e.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), lb = document.querySelector(`[data-slot="${sl}.label"]`); return {e, pb: ph && ph.parentElement, lb: lb && lb.parentElement, x: parseFloat(e.style.left), w: parseFloat(e.style.width)}; }).sort((p, q) => p.x - q.x) : null;
      const split = r => { if(!pair) return; const [A, B] = parts, span = B.x + B.w - A.x, g = B.x - A.x - A.w, wa = (span - g)*r, wb = span - g - wa;
        [[A, A.x, wa], [B, A.x + wa + g, wb]].forEach(([P, x, w]) => { [P.e, P.pb, P.lb].forEach(el => { if(el){ el.style.left = x + 'pt'; el.style.width = w + 'pt'; } }); if(P.lb && P.lb.firstElementChild) P.lb.firstElementChild.style.maxWidth = w + 'pt'; P.e.dataset.w0 = w; P.e.__pfMemo = null; }); };
      const ratios = pair ? [0.5, 0.55, 0.45, 0.6, 0.4, 0.64, 0.36] : [null];
      const side = els.length === 1 && els[0].closest('.cap.side'), spb = side ? (() => { const ph = document.querySelector(`.ph[data-slot-photo="${els[0].dataset.slot}"]`); return ph && ph.parentElement; })() : null, pw0 = spb ? (+spb.dataset.pw0 || (spb.dataset.pw0 = parseFloat(spb.style.width))) : 0;
      const shrink = els.length === 1 && els[0].dataset.shrinkphoto, sp = shrink ? (() => { const e = els[0], sl = e.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), lb = document.querySelector(`[data-slot="${sl}.label"]`); return {pb: ph && ph.parentElement, lb: lb && lb.parentElement}; })() : null;
      const ms = side ? (els[0].dataset.fixphoto ? [1, 0.94, 0.88] : [1, 0.88, 0.76, 1.15, 1.3]) : shrink ? [1, 0.93, 0.86, 0.8, 0.74, 0.68] : (els[0].dataset.measures || '1').split(',').map(Number), w0 = +els[0].dataset.wfit || (els[0].dataset.wfit = parseFloat(els[0].style.width)), x0 = +els[0].dataset.xfit || (els[0].dataset.xfit = parseFloat(els[0].style.left));
      const flex = els.every(e => e.closest('.cap') || e.dataset.flexh);   // a caption beside its photo: as many lines as it fills, top aligned
      // a caption under its photo may take up to 24 pt from the photo's foot when a bigger size needs the room (the label and caption move up with it)
      const capParts = els.map(e => { const sl = e.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), lb = document.querySelector(`[data-slot="${sl}.label"]`); return {e, pb: !e.closest('.cap.side') && ph && ph.parentElement, lb: lb && lb.parentElement}; });
      capParts.forEach(c => { c.ph0 = c.pb ? parseFloat(c.pb.style.height) : 0; c.lt0 = c.lb ? parseFloat(c.lb.style.top) : 0; c.et0 = parseFloat(c.e.style.top); });
      const lift = d => capParts.forEach(c => { if(!c.pb) return; c.pb.style.height = (c.ph0 - d) + 'pt'; if(c.lb) c.lb.style.top = (c.lt0 - d) + 'pt'; c.e.style.top = (c.et0 - d) + 'pt'; });
      for(const rr of ratios){ if(done) break; if(rr != null) split(rr);
      for(const m of ms){ if(ms.length > 1) els.forEach(e => { e.style.width = (w0*m) + 'pt'; e.style.left = (side ? (e.dataset.fixphoto ? x0 : x0 + w0*(1 - m)) : e.dataset.malign === 'left' || shrink ? x0 : x0 + w0*(1 - m)/2) + 'pt'; if(side && spb && !e.dataset.fixphoto){ spb.style.width = (pw0 + w0*(1 - m)) + 'pt'; const lb = document.querySelector(`[data-slot="${e.dataset.slot}.label"]`); if(lb) lb.parentElement.style.left = e.style.left; } e.dataset.w0 = w0*m; e.__pfMemo = null; if(shrink){ [sp.pb, sp.lb].forEach(q => { if(q) q.style.width = (w0*m) + 'pt'; }); if(sp.lb && sp.lb.firstElementChild) sp.lb.firstElementChild.style.maxWidth = (w0*m) + 'pt'; } });
      for(const f of sizes){ for(const T of counts){ const lh = flex ? f*1.32 : H/T; if(!flex && (lh < f*1.2 || lh > f*1.75)) continue; const over = flex ? T*lh - H : 0; if(over > 24.5 || (over > 0.5 && capParts.some(c => !c.pb || isNaN(c.et0) || (c.ph0 - over) < parseFloat(c.pb.style.width)/2.7))) continue; lift(Math.max(0, over));
          const picks = els.map(e => { e.style.fontSize = f + 'pt'; e.style.lineHeight = lh + 'pt'; e.style.height = (flex ? T*lh : H) + 'pt'; e.style.textAlign = 'left'; const b = SW.pfN(e, T); if(b){ const lead = e.dataset.lead || ''; e.innerHTML = (lead ? `<b>${SW.esc(lead)}</b> ` : '') + b.pick.map(x => SW.esc(x)).join(' '); } return b; });   // each member set as soon as it is picked, so the next one sees it
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
    rows.forEach(els => { if(els.some(e => e.closest('.cap.side'))) return; const lh = parseFloat(els[0].style.lineHeight) || +els[0].dataset.lh || 13, box = +els[0].dataset.hfit || parseFloat(els[0].style.height), n = Math.max(...els.map(e => SW.lines(e).n)); if(!(n >= 1) || n*lh >= box - 0.5) return; const d = box - n*lh;
      els.forEach(el => { const sl = el.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), pb = ph && ph.parentElement, lbl = document.querySelector(`[data-slot="${sl}.label"]`);
        if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + d) + 'pt';
        el.style.top = (parseFloat(el.style.top) + d) + 'pt'; el.style.height = (n*lh) + 'pt'; el.dataset.lines = n; }); }); };
  FO.sideCenter = () => document.querySelectorAll('.cap.side').forEach(c => { const a = c.querySelector('.a'), lbl = a && document.querySelector(`[data-slot="${a.dataset.slot}.label"]`); if(!a || !lbl) return;
    const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight), hh = 20 + n*lh, top = +c.dataset.phTop + (+c.dataset.phH - hh)/2; a.style.height = (n*lh) + 'pt'; lbl.parentElement.style.top = top + 'pt'; a.style.top = (top + 20) + 'pt'; });
  // after the fill: an inside-left intro whose true sentences are all said elsewhere on the piece (it cannot set three full lines) is left out;
  // the heading column then sets its title larger and sits centered beside the room photo
  FO.leftHead = () => { const it = document.querySelector('[data-slot="left.intro"]'), ti = document.querySelector('[data-slot="left.title"]'), kk = document.querySelector('[data-slot="left.kicker"]'), ru = document.querySelector('[data-role="left-rule"]');
    if(!it || !ti || !kk || !ru) return; const L = SW.lines(it); if(it.textContent.trim() && L.n >= 3 && L.fill >= 0.895) return;
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:'EB Garamond';font-weight:500", HW, 44, 24, 4), lh = T.f*1.1;
    ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = 'auto';
    const n = Math.max(1, Math.round(ti.getBoundingClientRect().height*0.75/lh)), H = 17 + n*lh + 12 + 4.2, y = 0 + (270 - H)/2;   // the heading group centered top to bottom in the panel
    kk.style.top = y + 'pt'; ti.style.top = (y + 17) + 'pt'; ti.style.height = (n*lh) + 'pt'; ti.dataset.lines = n; ru.style.top = (y + 17 + n*lh + 12) + 'pt'; };
  // after the fill: the cover write-up sits on the frame's foot; the rooms above it grow down into any room it did not use (no empty band)
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = FO.SUMB - n*lh;
    const lbls = [...document.querySelectorAll('[data-slot^="front.strip"][data-slot$=".label"]')]; if(!lbls.length) return; const lb = Math.max(...lbls.map(l => parseFloat(l.style.top) + 11)), d = top - 16 - lb; su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt'; if(d <= 0) return;
    lbls.forEach(l => { l.style.top = (parseFloat(l.style.top) + d) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- Formal Invitation geometry (pt, panel trim 612 x 792): the design pass of 11/15 ----------------
  // The set is an engraved invitation: everything centered and symmetrical, lines set to matching widths, the gold double hairline under
  // every display line, and the white card with a hairline set inside its edge (B03's sign-in card) as the structure of every piece:
  // the address card on the cover, the menu card beside the kitchen, the lists card on the back, the status card on Just Sold.
  const X0 = 44, X1 = 568, CW = X1 - X0;
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW;
  FO.frame = () => '';   // no foot band: a band under half an inch reads as a printing slip (production note 7)
  const GAR = "font-family:'EB Garamond';font-weight:500", JOS = "font-family:'Josefin Sans';font-weight:600";
  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  // a centered display line: on one line at the largest size down to `one`, else broken in two balanced lines (the second at least 78% of
  // the first, never a one-letter word at a line's end), else one line at whatever size fits. Returns {f, n, html}
  FO.fitTitle = (t, fam, w, max, min, maxLines, one) => { t = String(t); const W = (s, f) => FXS.width(s, `${fam};font-size:${f}pt`), ws = t.split(/\s+/);
    for(let f = max; f >= (one || max*0.8); f -= 0.25) if(W(t, f) <= w) return {f, n: 1, w, html: esc(t)};
    if(maxLines >= 2) for(let f = max; f >= min; f -= 0.25){ let best = null;
      for(let i = 1; i < ws.length; i++){ const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '), wa = W(a, f), wb = W(b, f); if(wa > w || wb > w || ws[i - 1].length < 2) continue; const r = Math.min(wa, wb)/Math.max(wa, wb); if(r >= 0.76 && (!best || r > best.r)) best = {r, a, b}; }
      if(best) return {f, n: 2, w, html: esc(best.a) + '<br>' + esc(best.b)}; }
    for(let f = max; f >= 9; f -= 0.25) if(W(t, f) <= w) return {f, n: 1, w, html: esc(t)};
    return {f: min, n: 1, w, html: esc(t)}; };
  // a photo tile with its name centered under it in tracked caps
  FO.tileC = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs fo-tile-l" style="left:${x}pt;top:${y + h + 8}pt;width:${w}pt" data-slot="${slot}.label" data-lines="1">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div>`;
  // the standard contact card as B03's foot: agent on the left, the brokerage panel on the right with the one logo, knockout on the main color
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = FI.logoSrc(D); const ko = !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 180, lh = Math.min(46, H - 30), s = {name: 19, nameFloor: 15, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div style="--cc-display:'EB Garamond';--cc-body:'Josefin Sans'">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };

  // ---- the hero crop (lesson 13): tighter on the subject house. data-tight="x0,y0,x1,y1,zmax,align": the house box (data.photos[id].box)
  // is scaled up (never past zmax x the cover scale) until it fills the region x0..x1, y0..y1 of its frame (pt from the frame's corner),
  // centered left to right, standing on the region's foot (align b) or centered (c). The whole roof and both sides always stay inside.
  // pad: air kept over the roof and beside the walls when the house is scaled up (the scale-up stops that far short of the region's edge)
  FO.tightOf = (p, FW, FH, x0, y0, x1, y1, zmax, pad) => { const [bx0, by0, bx1, by1] = p.box, k0 = Math.max(FW/p.w, FH/p.h), fit = q => Math.min((x1 - x0 - 2*q)/((bx1 - bx0)*p.w), (y1 - y0 - q)/((by1 - by0)*p.h)), kf = fit(0);
    return {k0, kf, k: Math.max(k0, Math.min(fit(pad || 0), k0*(zmax || 1.5))), ok: kf >= k0*0.998}; };
  FO.tightAttr = (x0, y0, x1, y1, zmax, align, pad) => `data-tight="${[x0, y0, x1, y1, zmax || 1.5, align || 'b', pad == null ? 16 : pad].join(',')}"`;
  FO.withTight = (html, attr) => html.replace('<div class="ph"', `<div class="ph" ${attr}`);
  FO.tight = D => { const issues = [];
    document.querySelectorAll('.ph[data-tight]').forEach(el => { const p = (D.photos || {})[el.dataset.photo], img = el.querySelector('img'); if(!p || !img || !p.box || !p.w || !p.h) return;
      const a = el.dataset.tight.split(','), [x0, y0, x1, y1, zmax] = a.slice(0, 5).map(Number), al = a[5] || 'b', FW = el.clientWidth*0.75, FH = el.clientHeight*0.75, T = FO.tightOf(p, FW, FH, x0, y0, x1, y1, zmax, +a[6] || 0), k = T.k, [bx0, by0, bx1, by1] = p.box;
      const iw = p.w*k, ih = p.h*k; let ox = (x0 + x1)/2 - (bx0 + bx1)/2*iw, oy = al === 'c' ? (y0 + y1)/2 - (by0 + by1)/2*ih : y1 - by1*ih;
      ox = Math.min(0, Math.max(FW - iw, ox)); oy = Math.min(0, Math.max(FH - ih, oy));
      if(ox + bx0*iw < x0 - 1 || ox + bx1*iw > x1 + 1 || oy + by0*ih < y0 - 1 || oy + by1*ih > y1 + 1) issues.push({slot: el.dataset.slotPhoto || el.dataset.photo, kind: 'house-cropped', detail: 'the whole house does not fit the clear part of this photo box'});
      img.style.cssText = `position:absolute;max-width:none;inset:auto;left:${ox}pt;top:${oy}pt;width:${iw}pt;height:${ih}pt;object-fit:fill`; });
    return issues; };

  // ---- the invitation lines: the place in a tracked eyebrow, the street in EB Garamond as big as its line allows, the gold double
  // hairline, the facts in tracked caps; centered on cx. on: 'main' (white on the main color) or 'card' (the main color on white) ----
  FO.facts = L => { const items = FXS.statItems(L).filter(x => !/^Built/.test(x)); const yr = L.yearBuilt || L.year; if(yr) items.push('Built ' + yr); return items.join('  ·  ').toUpperCase(); };
  FO.invite = (D, x, y, w, o) => { const L = D.listing, on = o.on === 'main', ink = on ? 'var(--fi-on)' : 'var(--fi-ink)', acc = on ? 'var(--fi-acc)' : 'var(--fi-accp)';
    const place = [FXS.hood(L), FXS.placeLine(L)].filter(Boolean).join('  ·  ').toUpperCase(), ad = String(L.address || ''), as = FXS.fitSize(ad, GAR, w, o.max || 58, o.min || 36), sh = as*1.1;
    const fx = FO.facts(L), fs = FXS.fitSize(fx, JOS + ';letter-spacing:2.2pt', w, 10.5, 8.5);
    let t = `<div class="abs fi-eyebrow" style="left:${x}pt;top:${y}pt;width:${w}pt;text-align:center;color:${acc}" data-slot="front.place" data-lines="1">${esc(place)}</div>`;
    t += `<div class="abs fo-addr" data-slot="address" data-lines="1" style="left:${x}pt;top:${y + 17}pt;width:${w}pt;height:${sh}pt;font-size:${as}pt;line-height:${sh}pt;color:${ink}">${esc(ad)}</div>`;
    t += FI.dbl(x + w/2, y + 17 + sh + 7, 132, 'main');
    t += `<div class="abs fo-facts" style="left:${x}pt;top:${y + 17 + sh + 21}pt;width:${w}pt;height:16pt;font-size:${fs}pt;line-height:16pt;letter-spacing:2.2pt;color:${on ? acc : ink}" data-slot="front.facts" data-lines="1">${esc(fx)}</div>`;
    return {html: t, h: 17 + sh + 21 + 16}; };
  FO.inviteH = (D, w, o) => { o = o || {}; const as = FXS.fitSize(String(D.listing.address || ''), GAR, w, o.max || 58, o.min || 36); return 17 + as*1.1 + 21 + 16; };

  // ---------------- COVER (fold-over front: no agent, no brokerage) ----------------
  // The whole house about 5.5 in tall, cropped to the subject; the address on the white card with its inset hairline, laid over the
  // photo's foot; under it two rooms, one large and one small, named in tracked caps. Nothing else: an invitation's cover is quiet.
  FO.cover = (D) => { const K = (D.sw || {}).front || {}, P = (D.sw || {}).plan || {}, hid = (P.cover || [])[0] || K.hero || 'front', p = (D.photos || {})[hid] || {};
    const CX = 62, CWd = 488, IW = CWd - 64, IH = FO.inviteH(D, IW, {max: 60, min: 40}), CH = 26 + IH + 24, OV = 62;
    let CT = 334; if(p.box && p.w && p.h) while(CT < 400 && !FO.tightOf(p, 630, CT + OV + 9, 22, 12, 608, CT + 9 - 8, 1).ok) CT += 6;
    const HB = CT + OV;
    let h = FO.withTight(SW.heroHtml(D, hid, -9, -9, 630, HB + 9, 'front.house', []), FO.tightAttr(22, 12, 608, CT + 9 - 8, 1.45, 'b'));
    h += FI.card(CX, CT, CWd, CH) + `<div class="fi-ink" data-oncard="1">${FO.invite(D, CX + 32, CT + 26, IW, {on: 'card', max: 60, min: 40}).html}</div>`;
    const pair = (P.coverPair || P.strip || []).slice(0, 2), PY = CT + CH + 22, PH = 768 - 19 - PY, g = 12, wL = Math.round((CW - g)*0.645), wS = CW - g - wL;
    if(pair[0]) h += FO.tileC(D, pair[0], X0, PY, wL, PH, 'front.pair0');
    if(pair[1]) h += FO.tileC(D, pair[1], X0 + wL + g, PY, wS, PH, 'front.pair1');
    return h; };

  // ---------------- FLYER FRONT (its own piece, not the cover): the invitation block across the head of the sheet in the main color,
  // the whole house under it edge to edge, then on the paper a centered display line over the double hairline, the write-up at the
  // full measure, and two rooms of one size. No agent, no brokerage. ----------------
  FO.flyerFront = (D) => { const K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, hid = F.hero || K.hero || 'front', p = (D.photos || {})[hid] || {};
    const fitsH = HH => !(p.box && p.w && p.h) || FO.tightOf(p, 630, HH, 36, 6, 594, HH - 5, 1).ok, tall = !fitsH(300);   // a tall house: a taller photo, the street a size down, three lines of write-up
    const io = {on: 'main', max: tall ? 44 : 54, min: 34}, IH = FO.inviteH(D, CW, io), BB = (tall ? 30 : 36) + IH + (tall ? 18 : 22);
    let h = FI.band(-9, 621, -9, BB + 9, {top: false}) + `<div class="fi-on">${FO.invite(D, X0, tall ? 30 : 36, CW, io).html}</div>`;
    const HY = BB + 5; let HH = 262; while(HH < 352 && !fitsH(HH)) HH += 4;
    h += FO.withTight(SW.heroHtml(D, hid, -9, HY, 630, HH, 'front.house', []), FO.tightAttr(36, 6, 594, HH - 5, 1.4, 'b'));
    const hy = HY + HH + (tall ? 11 : 16), head = String(F.head || '').replace(/\.$/, ''), hs = head ? FXS.fitSize(head, GAR, CW, tall ? 25 : 28, 20) : 0;
    let wy = hy;
    if(head){ h += `<div class="abs fi-serif" style="left:${X0}pt;top:${hy}pt;width:${CW}pt;height:${hs*1.2}pt;font-size:${hs}pt;line-height:${hs*1.2}pt;text-align:center" data-slot="front.head" data-lines="1">${esc(head)}</div>` + FI.dbl(306, hy + hs*1.2 + 3, 110, 'main'); wy = hy + hs*1.2 + 3 + 4 + (tall ? 9 : 12); }
    const n = tall ? 3 : 4, lh = 17, pair = (P.flyerPair || P.coverPair || P.flyerStrip || P.strip || []).slice(0, 2), PY = wy + n*lh + (tall ? 12 : 16), PH = 750 - 19 - PY, g = 14, w2 = (CW - g)/2;
    h += FO.full(`<div class="abs wu" data-slot="front.summary" data-lines="${n}" data-try="${n},3" data-lh="${lh}" ${FXS.sd(F.intro || K.summary || [])} style="left:${X0}pt;top:${wy}pt;width:${CW}pt;height:${n*lh}pt;font-size:12pt;line-height:${lh}pt"></div>`);
    pair.forEach((id, i) => { h += FO.tileC(D, id, X0 + i*(w2 + g), PY, w2, PH, 'front.pair' + i); });
    return h; };
  // after the fill: a flyer write-up that set fewer lines than planned hands the room to the two photos under it (they grow upward)
  FO.flyerSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const bottom = parseFloat(su.style.top) + parseFloat(su.style.height);
    [0, 1].forEach(i => { const ph = document.querySelector(`.ph[data-slot-photo="front.pair${i}"]`), pb = ph && ph.parentElement; if(!pb) return; const top = parseFloat(pb.style.top), d = top - (bottom + 16); if(d < 1) return; pb.style.top = (top - d) + 'pt'; pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };

  // ---------------- THE INSIDE SPREAD: one horizon across the fold ----------------
  // Both pages share one head band (it runs through the fold and meets itself), one row of large pictures (the kitchen on the left and
  // the dominant room on the right bleed into the fold and meet there, same top, same foot) and one row of two captioned rooms each.
  // Outside the pictures: the white menu card on the left page, the main-color caption panel bleeding off the right page.
  FO.SP = {BB: 112, R1: 135, R1H: 335};
  // Owner 11/16/2026 (book p16): where photos meet at the center fold, each stops 0.05 in (3.6 pt) short of it, a 1/10 in gap in all,
  // so a fold that lands a little off still looks clean. The head band and its strip still run across the fold.
  FO.FOLD = 3.6;
  FO.spreadHead = (kicker, title, slot) => { const tt = String(title || '').replace(/\.$/, ''), ts = FXS.fitSize(tt, GAR, CW, 36, 24), G = 16 + ts*1.2 + 4 + 4, y = (FO.SP.BB - G)/2 + 2;
    let hd = `<div class="abs fo-kick c" style="left:${X0}pt;top:${y}pt;width:${CW}pt" data-slot="${slot}.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    hd += `<div class="abs fo-title c" style="left:${X0}pt;top:${y + 16}pt;width:${CW}pt;height:${ts*1.2}pt;font-size:${ts}pt;line-height:${ts*1.2}pt;text-transform:none;letter-spacing:0;font-weight:500" data-slot="${slot}.title" data-lines="1">${esc(tt)}</div>`;
    hd += FI.dbl(306, y + 16 + ts*1.2 + 4, 120, 'main');
    return `<div class="fi-band" style="left:-9pt;top:-9pt;width:630pt;height:${FO.SP.BB + 9}pt"></div><div class="fi-strip" style="left:-9pt;top:${FO.SP.BB}pt;width:630pt;height:5pt"></div><div class="fi-on">${hd}</div>`; };
  const row2 = (D, cards, side, zoom) => { const RY = FO.SP.R1 + FO.SP.R1H + 22, g = 16, w2 = (CW - g)/2, clh = 14.5, rph = 764 - RY - 25 - 4*clh; let h = '';
    cards.slice(0, 2).forEach((c, i) => { let cap = FXS.captioned(D, c, X0 + i*(w2 + g), RY, w2, rph, 4, side + '.photo' + (i + (side === 'right' ? 1 : 0)), {fs: 11.5, lh: clh, min: 3}).replace(' data-room=', ' data-foot="764" data-room='); if(zoom && zoom[c.photo]) cap = cap.replace(`<div class="ph" data-photo="${c.photo}"`, `<div class="ph" data-zoom="${zoom[c.photo]}" data-photo="${c.photo}"`); h += cap; });
    return h; };

  // INSIDE LEFT: the menu card (the kitchen's own list, or the one-story's renovation list) set as a menu, every line centered, and the
  // kitchen large beside it, bleeding into the fold; under them two captioned rooms.
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, ids = P.left || [], kid = ids[0], rest = FO.cards(D, ids.slice(1));
    const {R1, R1H} = FO.SP, CWd = 212, PX = X0 + CWd + 16;
    let h = FO.spreadHead(I.kicker, I.title, 'left');
    h += FXS.box(D, kid, PX, R1, 612 - FO.FOLD - PX, R1H, 'left.wide');   // stops 0.05 in short of the fold (owner 11/16/2026, book p16)
    const items0 = (box.items || []).slice(0, 8), tw = CWd - 30, tcss = GAR + ';font-size:11.75pt';
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside || {}).items || SFb.inside, (BXb.outside || {}).items || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const oneLine = it => { const S = (it.s || []).map(x => [].concat(x).filter(a => !SW.grams4(a).some(g => backG.has(g)) && !backT.some(b => SW.sameFact(b, a)))).filter(a => a.length); let best = '';
      const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(t && t.length > best.length && FXS.width(t, tcss) <= tw && !SW.sameFactIn(t)) best = t; return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
      walk(0, []); return best; };
    const lines1 = items0.map(oneLine), items = items0.filter((_, i) => lines1[i]).slice(0, 6), itemText = lines1.filter(Boolean).slice(0, 6);
    let b = FI.card(X0, R1, CWd, R1H);
    const hd = String(box.heading || '').replace(/\.$/, ''), HT = FO.fitTitle(hd, GAR, tw, 21, 16, 2, 17), hlh = HT.f*1.16;
    b += `<div class="abs fo-kick c" style="left:${X0}pt;top:${R1 + 26}pt;width:${CWd}pt;color:var(--fi-accp)" data-slot="left.box.kicker" data-lines="1">${esc(String(box.kicker || 'The kitchen').toUpperCase())}</div>`;
    b += `<div class="abs fo-sub" style="left:${X0 + 15}pt;top:${R1 + 43}pt;width:${tw}pt;height:${HT.n*hlh}pt;font-size:${HT.f}pt;line-height:${hlh}pt;text-align:center;white-space:normal" data-slot="left.box.heading" data-lines="${HT.n}">${HT.html}</div>`;
    const ry = R1 + 43 + HT.n*hlh + 9; b += FI.dbl(X0 + CWd/2, ry, 64, 'main');
    const top = ry + 4 + 12, bot = R1 + R1H - 20, per = Math.min(46, (bot - top)/Math.max(1, items.length)), off = top + ((bot - top) - per*items.length)/2;
    items.forEach((it, i) => { const y = off + i*per + (per - 27)/2;
      b += `<div class="abs fo-li-l" style="left:${X0 + 15}pt;top:${y}pt;width:${tw}pt;text-align:center" data-slot="left.list.l${i}" data-lines="1">${esc(it.l)}</div>`;
      b += `<div class="abs" style="left:${X0 + 15}pt;top:${y + 11.5}pt;width:${tw}pt;height:15.5pt;font:500 11.75pt/15.5pt var(--fi-cap);color:#1f242c;white-space:nowrap;overflow:hidden;text-align:center" data-slot="left.list.t${i}" data-lines="1">${esc(itemText[i])}</div>`; });
    h += `<div class="fi-ink">${b}</div>`;
    h += row2(D, rest, 'left', /^2-/.test(String(D.version || '')) ? {bar: '1.5,0.08,0.86'} : null);
    return h; };

  // INSIDE RIGHT: the dominant room bleeding into the fold (it meets the kitchen there) and, bleeding off the page's outer edge, the
  // narrow main-color panel: the room's name as a display line over the double hairline, then its caption, centered, top to bottom.
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs = FO.cards(D, P.right || []);
    const {R1, R1H} = FO.SP, PX1 = 372, cx = PX1 + 5 + 22, cw2 = 590 - cx;
    let h = FO.spreadHead(R.kicker, R.title, 'right');
    if(cs[0]){ const c = FXS.augment(D, cs[0]), L0 = FXS.leadLabel(c.lead), fs = 14, lh = 19.5, n = 10, NT = FO.fitTitle(L0.name, GAR, cw2, 30, 21, 2, 24), nlh = NT.f*1.12;
      h += FXS.box(D, c.photo, FO.FOLD, R1, PX1 - FO.FOLD, R1H, 'right.photo0');   // starts 0.05 in past the fold
      h += `<div class="fi-band" style="left:${PX1 + 5}pt;top:${R1}pt;width:${621 - PX1 - 5}pt;height:${R1H}pt"></div><div class="fi-strip" style="left:${PX1}pt;top:${R1}pt;width:5pt;height:${R1H}pt"></div>`;
      h += `<div class="fi-on"><div class="abs fo-sub" style="left:${cx}pt;top:${R1 + 30}pt;width:${cw2}pt;height:${NT.n*nlh}pt;font-size:${NT.f}pt;line-height:${nlh}pt;text-align:center;white-space:normal;color:var(--fi-on)" data-slot="right.photo0.label" data-lines="${NT.n}">${NT.html}</div>`;
      h += `<div class="fi-dbl" data-rule-for="right.photo0" style="left:${cx + cw2/2 - 35}pt;top:${R1 + 30 + NT.n*nlh + 10}pt;width:70pt;border-color:var(--fi-acc)"></div>`;
      h += `<div class="abs cap side" data-panel="1" data-cx="${cx}" data-cw="${cw2}" data-ph-top="${R1}" data-ph-h="${R1H}"><div class="a" style="position:absolute;left:${cx}pt;top:${R1 + 80}pt;width:${cw2}pt;height:${n*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="right.photo0" data-room="${esc(L0.name)}" data-lh="${lh}" data-lines="${n}" data-min="4" data-maxl="10" data-fstep="0.5" data-narrow="0" data-fixphoto="1" data-center="1" ${FXS.sd(c.s)}></div></div></div>`; }
    h += row2(D, cs.slice(1), 'right');
    return h; };
  // after the fill: the panel's name, hairline and caption sit centered top to bottom in the panel; the caption is set centered, ragged
  FO.panelCenter = () => document.querySelectorAll('[data-panel]').forEach(c => { const a = c.querySelector('.a'), t = a && document.querySelector(`[data-slot="${a.dataset.slot}.label"]`), r = a && document.querySelector(`[data-rule-for="${a.dataset.slot}"]`); if(!a || !t || !r) return;
    const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight), th = parseFloat(t.style.height), H = th + 11 + 4 + 15 + n*lh, top = +c.dataset.phTop + (+c.dataset.phH - H)/2;
    t.style.top = top + 'pt'; r.style.top = (top + th + 11) + 'pt'; a.style.top = (top + th + 30) + 'pt'; a.style.height = (n*lh) + 'pt'; a.style.left = (+c.dataset.cx + (+c.dataset.cw - parseFloat(a.style.width))/2) + 'pt'; a.style.textAlign = 'center'; });
  // after the fill: a row of captions marked data-foot ends on that line: its photos grow down (labels and captions move with them) by whatever the captions did not use
  FO.capFoot = () => { const rows = new Map(); document.querySelectorAll('.cap .a[data-foot]').forEach(el => { const k = el.dataset.foot + '|' + Math.round(parseFloat(el.style.top)); (rows.get(k) || rows.set(k, []).get(k)).push(el); });
    rows.forEach(els => { const d = Math.min(...els.map(el => +el.dataset.foot - (parseFloat(el.style.top) + SW.lines(el).n*parseFloat(el.style.lineHeight)))); if(Math.abs(d) < 0.5 || d < -30) return;
      els.forEach(el => { const sl = el.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), pb = ph && ph.parentElement, lbl = document.querySelector(`[data-slot="${sl}.label"]`);
        if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; if(lbl) lbl.parentElement.style.top = (parseFloat(lbl.parentElement.style.top) + d) + 'pt'; el.style.top = (parseFloat(el.style.top) + d) + 'pt'; }); }); };
  FO.centered = () => document.querySelectorAll('[data-center]').forEach(el => { el.style.textAlign = 'center'; });

  // ---------------- BACK (fold-over) and flyer back ----------------
  // Its own arrangement: the write-up on the left under a centered heading, the listing's plan on the right in a box cut to the plan's
  // own shape (a plan of four floors runs the full measure instead, the write-up under it); then the lists on the white card and a
  // captioned photo (three on the flyer); Nearby once, low, in one centered row right over the foot; the foot band with the agent card.
  FO.planBox = (D, x1, y, maxH, maxW, minW) => { const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: D.plan.turn ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: !!D.plan.turn, angle: D.plan.turn && D.plan.kind === 'color' ? 270 : undefined}), cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 44, D.plan.minCard || 0, minW || 200)); const pc = FXS.planCard(D, x1 - cw, y, cw, maxH); pc.w = cw; pc.natural = Math.ceil(r0.usedW || 300) + 44; return pc; };
  // the half-height contact block (owner 11/15/2026, every fold-over back): the agent card 58 pt tall (about Ivory's) at 708, its foot
  // 0.36 in over the trim (the footer check wants 0.35); the main-color band from 700 to the bleed; everything above grows into the freed space
  FO.CARD_H = 58; FO.FOOT = 684;   // the band 16 pt taller (was 700) so the card sits centered in it with 0.35 in under it (owner 11/16 centering + footer rules)
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:${FO.FOOT - 13}pt;width:${CW}pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  // Nearby: one centered row of three, low on the page (each place: its Roman numeral and distance in Garamond, the name in tracked caps under it)
  FO.nearRow = (D, x, y, w) => { const N = (((D.sw || {}).back || {}).nearby || []).slice(0, 3); if(!N.length) return ''; const cw = w/N.length;
    let h = FI.dbl(x + w/2, y, w, 'main') + `<div class="abs fo-kick c" style="left:${x + w/2 - 46}pt;top:${y - 4}pt;width:92pt;background:var(--fx-paper);color:var(--fi-ink)" data-slot="back.near.kicker" data-lines="1">NEARBY</div>`;
    N.forEach((n, i) => { const ps = FXS.fitSize(String(n.place).toUpperCase(), JOS + ';letter-spacing:1.4pt', cw - 16, 8.8, 8);
      h += `<div class="abs fo-nearc" style="left:${x + i*cw}pt;top:${y + 13}pt;width:${cw}pt;height:36pt" data-slot="back.near${i}" data-lines="2" data-fine="1"><div class="d"><span class="rn">${['I', 'II', 'III'][i]}</span>${esc(n.dist)}</div><div class="p" style="font-size:${ps}pt">${esc(n.place)}</div></div>`;
      if(i) h += `<div class="abs" style="left:${x + i*cw}pt;top:${y + 17}pt;width:.75pt;height:28pt;background:var(--fi-rule)"></div>`; });
    return h; };
  FO.NEARH = 50;
  // a centered list on the card: its title in the tracked eyebrow, each item on its own centered line
  FO.listC = (title, items, x, y, w, rowH, slot, max, fs) => { const out = []; items.forEach(t => { if(out.length < max && FXS.width(t, `${GAR};font-size:${fs}pt`) <= w - 8) out.push(t); });
    let h = `<div class="abs fo-kick c" style="left:${x}pt;top:${y}pt;width:${w}pt;color:var(--fi-accp);letter-spacing:${Math.min(3.6, Math.max(1.4, (w - 18 - FXS.width(String(title).toUpperCase(), JOS + ';font-size:8.8pt'))/Math.max(1, String(title).length)))}pt" data-slot="${slot}.title" data-lines="1">${esc(String(title).toUpperCase())}</div>`;
    out.forEach((t, i) => { h += `<div class="bul c" data-slot="${slot}.${i}" data-lines="1" style="left:${x}pt;top:${y + 17 + i*rowH}pt;width:${w}pt;height:${rowH}pt;font-size:${fs}pt">${esc(t)}</div>`; });
    return {html: h, n: out.length, h: 17 + out.length*rowH}; };
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    const rowIds = flyer ? (P.flyerBack || []).slice(0, 3) : (P.backRow || ['bath2']), rowCards = FO.cards(D, rowIds);
    const L0 = 40, R0 = 572, TOP = 40, NY = FO.FOOT - 22 - FO.NEARH, BEND = NY - 16;   // Nearby's top; the foot of the row over it
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s)), about = keep(f2.concat(f1));
    // the heading (the back's one display line: what this house is, never "The house") centered over its column on one line or two balanced
    // ones, the double hairline, the write-up running to a given foot (or n lines long)
    const BT = String(KB.title || 'The house').replace(/\.$/, '');
    const head = (x, w, y) => { const T = FO.fitTitle(BT, GAR, w, 30, 19, 2, 23), lh = T.f*1.14;
      return {h: T.n*lh + 5 + 4 + 14, html: `<div class="abs fi-serif" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${T.n*lh}pt;font-size:${T.f}pt;line-height:${lh}pt;text-align:center;white-space:normal" data-about-head="1" data-slot="back.about.title" data-lines="${T.n}">${T.html}</div>` + FI.dbl(x + w/2, y + T.n*lh + 5, 96, 'main').replace('class="fi-dbl"', 'class="fi-dbl" data-about-head="1"')}; };
    const wuSpan = (x, w, y0, y1, fs, lhT) => { const n = Math.max(3, Math.round((y1 - y0)/lhT)), lh = +((y1 - y0)/n).toFixed(3);
      return FO.full(FO.wu(about, x, y0, w, n*lh + 0.01, 'back.about', fs, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-span="${(y1 - y0).toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`); };
    const aboutBlock = (x, w, y0, y1, nLines) => { const hd = head(x, w, y0 - 4), ys = y0 - 4 + hd.h, lhT = flyer ? 16 : 17.5; if(nLines) y1 = ys + nLines*lhT; return {html: hd.html + wuSpan(x, w, ys, y1, flyer ? 11.5 : 12.25, lhT), bottom: y1}; };
    const pcap = (c, x, w, y, ph, slot, lines) => FXS.captioned(D, c, x, y, w, ph, lines || 3, slot, {fs: 11, lh: 14, min: 3});
    // row A: the plan in a box cut to its shape, set right (or, without a plan, the large outdoor photo and its caption). Beside it:
    //   side  a plan no wider than 300 pt: the heading and write-up
    //   card  a wider plan: the lists on a tall white card (the menu card's twin)
    //   full  (fold-over) a plan of four floors: nothing; it runs the full measure
    let h = '', t = '', aBot, rx, rw, mode = 'side';
    if(hasPlan){ let pc = FO.planBox(D, R0, TOP, flyer ? 202 : 296, 300, 200);
      if(pc.natural > 300){ mode = (!flyer && pc.natural > 600) ? 'full' : 'card'; pc = mode === 'full' ? FO.planBox(D, R0, TOP, 228, R0 - L0, R0 - L0) : FO.planBox(D, R0, TOP, flyer ? 226 : 318, 350, 300); }
      h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; aBot = pc.bottom; rw = pc.w; rx = R0 - rw; }
    else { rw = 300; rx = R0 - rw; const ph = flyer ? 158 : 236, c = FXS.cardFor(D, topId); h += pcap(c, rx, rw, TOP, ph, 'back.top'); aBot = TOP + ph + 25 + 3*14; }
    const lw = rx - 20 - L0, y0 = aBot + 20, BH = BEND - y0;
    if(mode === 'side') h += aboutBlock(L0, lw, TOP, aBot).html;
    if(mode === 'card') t += FO.backCard(t1, c1, c2, L0, TOP, lw, aBot - TOP);
    if(flyer){
      // the flyer: three captioned rooms in one row; over them the write-up across the measure (card mode), under them the lists card (side mode)
      const n = rowCards.length, gap = 12, tw = (R0 - L0 - (n - 1)*gap)/n; let py = y0, pb = BEND;
      if(mode === 'card'){ const ab = aboutBlock(L0, R0 - L0, y0, 0, 3); h += ab.html; py = ab.bottom + 16; }
      else { const nb = Math.max(Math.min(c1.length, 4), Math.min(c2.length, 4), 3), CH = 15 + 17 + nb*18 + 13, CY = BEND - CH, cw2 = (R0 - L0 - 40)/2; pb = CY - 16;
        t += FI.card(L0, CY, R0 - L0, CH) + FO.listC(t1, c1, L0 + 16, CY + 15, cw2, 18, 'back.updates', 4, 12).html + FO.listC('Outside', c2, L0 + 24 + cw2, CY + 15, cw2, 18, 'back.outside', 4, 12).html;
        t += `<div class="abs" style="left:${(L0 + R0)/2}pt;top:${CY + 16}pt;width:.75pt;height:${CH - 32}pt;background:var(--fi-rule)"></div>`; }
      rowCards.forEach((c, i) => { h += FXS.captioned(D, c, L0 + i*(tw + gap), py, tw, pb - py - 25 - 3*13.5, 3, 'back.photo' + i, {fs: 10.5, lh: 13.5, min: 3}); });
    } else if(mode === 'side'){   // under the write-up the lists card, under the plan (or the large photo) the captioned photo
      t += FO.backCard(t1, c1, c2, L0, y0, lw, BH); h += pcap(rowCards[0], rx, rw, y0, BH - 25 - 3*14, 'back.photo1');
    } else {   // the write-up wide on the left, the captioned photo right; a plan of four floors: the lists card across the measure under them
      const pw = 206, px = R0 - pw, ww = px - 22 - L0; let yb = BEND;
      if(mode === 'full'){ const nb = Math.max(Math.min(c1.length, 3), Math.min(c2.length, 3), 2), CH = 15 + 17 + nb*18 + 13, CY = BEND - CH, cw2 = (R0 - L0 - 40)/2; yb = CY - 16;
        t += FI.card(L0, CY, R0 - L0, CH) + FO.listC(t1, c1, L0 + 16, CY + 15, cw2, 18, 'back.updates', 3, 12).html + FO.listC('Outside', c2, L0 + 24 + cw2, CY + 15, cw2, 18, 'back.outside', 3, 12).html;
        t += `<div class="abs" style="left:${(L0 + R0)/2}pt;top:${CY + 16}pt;width:.75pt;height:${CH - 32}pt;background:var(--fi-rule)"></div>`; }
      h += aboutBlock(L0, ww, y0, yb).html + pcap(rowCards[0], px, pw, y0, yb - y0 - 25 - (mode === 'full' ? 3 : 4)*14, 'back.photo1', mode === 'full' ? 3 : 4);
    }
    h += `<div class="fi-ink">${t}</div>`;
    h += FO.nearRow(D, X0, NY, CW) + FO.fine(D);
    h += FI.band(-9, 621, FO.FOOT, 801 - FO.FOOT, {bottom: false, top: false});   // the foot as the approved Open House flyer sets it: the main-color band straight on the paper, no strip (strips edge the invitation band only)
    h += `<div class="fi-on">` + FO.contact(D, X0, FO.FOOT + 24, CW, FO.CARD_H)   /* centered top to bottom in the foot band, its foot 0.36 in above the trim */ + '</div>';
    return {html: h, issues};
  };
  // the lists card of the fold-over back: two centered lists, one over the other, a short double hairline between them
  FO.backCard = (t1, c1, c2, x, y, w, H) => { if(w >= 270){   // a wide card: the two lists side by side, a hairline between them
      const cw2 = (w - 40)/2, fs = 11.75, cap = Math.max(2, Math.min(5, Math.floor((H - 30 - 17)/17))), n = Math.max(Math.min(c1.length, cap), Math.min(c2.length, cap)), rh = Math.min(24, (H - 30 - 17)/n), top = y + (H - 17 - n*rh)/2 - 1;
      return FI.card(x, y, w, H) + FO.listC(t1, c1, x + 14, top, cw2, rh, 'back.updates', cap, fs).html + FO.listC('Outside', c2, x + 26 + cw2, top, cw2, rh, 'back.outside', cap, fs).html + `<div class="abs" style="left:${x + w/2}pt;top:${y + 16}pt;width:.75pt;height:${H - 32}pt;background:var(--fi-rule)"></div>`; }
    const fs = 12.25, cap = Math.max(2, Math.min(5, Math.floor((H - 30 - 34 - 22)/2/19))), n1 = Math.min(c1.length, cap), n2 = Math.min(c2.length, cap), rh = Math.min(25, (H - 30 - 34 - 24)/(n1 + n2));
    const hh = 17 + n1*rh + 24 + 17 + n2*rh, top = y + (H - hh)/2, A = FO.listC(t1, c1, x + 12, top, w - 24, rh, 'back.updates', cap, fs), B = FO.listC('Outside', c2, x + 12, top + 17 + A.n*rh + 24, w - 24, rh, 'back.outside', cap, fs);
    return FI.card(x, y, w, H) + A.html + FI.dbl(x + w/2, top + 17 + A.n*rh + 9, 48, 'main') + B.html; };
  // after the fill: a block with data-span spreads the lines it took over that height, so its last line ends where its neighbor's does (owner 11/7, p12)
  // (design pass) a write-up whose true sentences end short of that height even at open leading: the heading, its hairline and the write-up
  // sit centered top to bottom in the column as one block (an invitation's centered block), never a hole between the heading and its text
  FO.span = () => document.querySelectorAll('[data-span]').forEach(el => { const T = +el.dataset.lines, lh = Math.min(+el.dataset.span/T, parseFloat(getComputedStyle(el).fontSize)*0.75*1.6), slack = +el.dataset.span - T*lh; el.style.lineHeight = lh + 'pt'; el.style.height = (T*lh) + 'pt';
    if(slack > 4 && el.dataset.slot === 'back.about'){ const face = el.closest('.panel, .sheet') || document; el.style.top = (parseFloat(el.style.top) + slack/2) + 'pt'; face.querySelectorAll('[data-about-head]').forEach(h => { h.style.top = (parseFloat(h.style.top) + slack/2) + 'pt'; }); }
    else el.style.top = (parseFloat(el.style.top) + slack) + 'pt'; });
  // the facts row: no two facts closer than 6 pt (text boxes measured on the letters)
  FO.factsCheck = () => { const out = [], it = [...document.querySelectorAll('.fo-fact')].map(e => { const r = document.createRange(); r.selectNodeContents(e); const qs = [...r.getClientRects()].filter(q => q.width > 1); return {slot: e.dataset.slot, l: Math.min(...qs.map(q => q.left)), r: Math.max(...qs.map(q => q.right)), t: Math.min(...qs.map(q => q.top)), b: Math.max(...qs.map(q => q.bottom))}; }).sort((a, b) => a.l - b.l);
    for(let i = 1; i < it.length; i++){ const a = it[i-1], b = it[i], gap = (b.l - a.r)*0.75, vo = Math.min(a.b, b.b) - Math.max(a.t, b.t); if(vo > 2 && gap < 6) out.push({slot: b.slot, kind: 'facts-collide', detail: `${a.slot} and ${b.slot} are ${gap.toFixed(1)} pt apart (6 pt minimum)`}); }
    return out; };
  // no text may sit under a photo or the agent card (the owner's clearance rule, 11/7): any text box that overlaps one fails
  FO.overlapCheck = () => { const out = [], els = [...document.querySelectorAll('.ph, .fo-acard:not(.abs)')].map(e => ({e, r: e.getBoundingClientRect()})).filter(x => x.r.width > 2 && x.r.height > 2), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement; if(!p || !n.textContent.trim() || p.closest('script, style, .plan-svg, .planwrap, .fo-acard, .logo, [data-oncard]')) continue;   // type on the white card laid over a photo's foot is on the card, not on the photo
      const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(q => { if(q.width < 2 || q.height < 2) return;
        els.forEach(({e, r}) => { if(e.contains(p)) return; const ox = Math.min(q.right, r.right) - Math.max(q.left, r.left), oy = Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top);
          if(ox > 1.5 && oy > 3) out.push({slot: (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || 'text', kind: 'text-under-element', detail: `"${n.textContent.trim().slice(0, 28)}" overlaps a ${e.className.split(' ')[0]}`}); }); }); }
    const seen = new Set(); return out.filter(i => { const k = i.slot + i.detail; if(seen.has(k)) return false; seen.add(k); return true; }); };
})();
