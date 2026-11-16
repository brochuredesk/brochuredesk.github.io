/* Twilight Frame fold-over and two-sided flyer builders (grown from the FXS-14 builders; the hand is the approved Open House library
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
  // a write-up set ragged (a narrow column: no justified word gaps): the same fill rules, never justified
  FO.rag = s => FO.full(s).replace('data-justify="1"', 'data-justify="1" data-rag="1"');
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
    el.style.lineHeight = lh + 'pt'; el.style.height = (best.n*lh) + 'pt'; el.dataset.lines = best.n; el.style.textAlign = el.dataset.rag ? 'left' : 'justify'; });
  // owner 11/8/2026 (FXS-14 versions review p3-p27, standing rule): every write-up runs at least three full lines at its full width (never narrowed, so no line
  // runs past the rule above it), set ragged with every line 80%+ while its true sentences are picked and the last line 90%+, then justified so every line but
  // the last reaches the edge. Runs before SW.fill on the fold-over and flyer; FO.just3 justifies after the fill; FO.fill3Check reports any block that misses.
  FO.prep3 = () => document.querySelectorAll('[data-s][data-slot]').forEach(el => {
    el.dataset.narrow = '0'; el.dataset.fill = Math.max(0.9, +el.dataset.fill || 0); el.dataset.lfill = Math.max(+el.dataset.lfill || 0, el.dataset.h0 ? 0.8 : !(/\.box\.t\d+$/.test(el.dataset.slot) || el.closest('.cap')) ? 0.75 : parseFloat(el.style.width) < 150 ? 0.8 : 0.84); el.dataset.j3 = '1';   // rows and captions 84% (80% in a narrow column) while picked so the box check holds; floor write-ups their approved 80%; intros 75% el.dataset.j3 = '1';   // a table row: 84% while picked so the box check (80%) holds; a floor write-up keeps its approved 80%
    if(el.dataset.try){ let t = el.dataset.try.split(',').map(Number).filter(n => n >= 3); if(el.dataset.span){ const S = JSON.parse(el.dataset.s).slice(0, +el.dataset.pool || 12).map(x => [].concat(x).sort((p, q) => q.length - p.length)[0]), keep = el.innerHTML;   // a spread write-up: only the counts its sentences can reach
        el.innerHTML = SW.esc(S.join(' ')); const most = SW.lines(el).n; el.innerHTML = keep; const r = t.filter(n => n <= most); t = r.length ? r : t.slice(-1); }
      else if(el.dataset.h0) t = t.slice(0, 2);   // a floor write-up fills its box (its top two counts), never a short block over blank space (owner p21/p27)
      el.dataset.try = (t.length ? t : [3]).join(','); }
    if(el.dataset.rag) el.dataset.lfill = '0.62';   // a ragged column: no line under 62% of the measure, the last line still 90%+
    if(el.closest('.cap')){ el.dataset.min = Math.max(3, +el.dataset.min || 0); } });
  FO.just3 = () => document.querySelectorAll('[data-j3]').forEach(el => { if(el.dataset.rag) return; if(el.textContent.trim() && SW.lines(el).n >= 2) el.style.textAlign = 'justify'; });
  FO.gaps = () => document.querySelectorAll('[data-slot]').forEach(el => { if(getComputedStyle(el).textAlign !== 'justify' || el.querySelector('[data-slot]')) return;
    const sp = parseFloat(getComputedStyle(el).fontSize)*0.28; let worst = 0; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const t = n.textContent; for(let i = 0; i < t.length; i++){ if(t[i] !== ' ') continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const q = r.getBoundingClientRect(); if(q.width > worst && q.height > 0) worst = q.width; } }
    if(worst > sp*3.2) el.style.textAlign = 'left'; });
  FO.fill3Check = () => [...document.querySelectorAll('[data-j3]')].filter(el => el.textContent.trim()).flatMap(el => { const L = SW.lines(el);
    return L.n < 3 ? [{slot: el.dataset.slot, kind: 'writeup-under-3-lines', lines: L.n}] : L.fill < 0.895 ? [{slot: el.dataset.slot, kind: 'writeup-last-line-short', pct: Math.round(L.fill*100)}] : []; });

  // Twilight Frame: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Twilight Frame refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
      const tmax = Math.max(3, Math.min(8, Math.floor((H + 24)/(fs0*1.18)))), counts = []; for(let t = tmax; t >= minl; t--) if(Math.abs(t - Math.max(minl, n0)) <= 1 || els.every(e => e.closest('.cap.side'))) counts.push(t);
      const sizes = []; for(let f = fs0; f <= fs0*1.28 + 1e-6; f += 0.2) sizes.push(+f.toFixed(2)); for(let f = fs0 - 0.2; f >= fs0*0.92 - 1e-6; f -= 0.2) sizes.push(+f.toFixed(2));
      const keep = els.map(e => [e.innerHTML, e.style.fontSize, e.style.lineHeight, e.style.height]);
      let done = false;
      // a row of two photo captions may share its width unevenly (each photo as wide as its caption's true sentences fill)
      const pair = els.length === 2 && els.every(e => e.closest('.cap') && !e.closest('.cap.side')), parts = pair ? els.map(e => { const sl = e.dataset.slot, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), lb = document.querySelector(`[data-slot="${sl}.label"]`); return {e, pb: ph && ph.parentElement, lb: lb && lb.parentElement, x: parseFloat(e.style.left), w: parseFloat(e.style.width)}; }).sort((p, q) => p.x - q.x) : null;
      const split = r => { if(!pair) return; const [A, B] = parts, span = B.x + B.w - A.x, g = B.x - A.x - A.w, wa = (span - g)*r, wb = span - g - wa;
        [[A, A.x, wa], [B, A.x + wa + g, wb]].forEach(([P, x, w]) => { [P.e, P.pb, P.lb].forEach(el => { if(el){ el.style.left = x + 'pt'; el.style.width = w + 'pt'; } }); if(P.lb && P.lb.firstElementChild) P.lb.firstElementChild.style.maxWidth = w + 'pt'; P.e.dataset.w0 = w; P.e.__pfMemo = null; }); };
      const ratios = pair ? [0.5, 0.55, 0.45, 0.6, 0.4, 0.64, 0.36] : [null];
      const side = els.length === 1 && els[0].closest('.cap.side'), spb = side && !els[0].dataset.free ? (() => { const ph = document.querySelector(`.ph[data-slot-photo="${els[0].dataset.slot}"]`); return ph && ph.parentElement; })() : null, pw0 = spb ? (+spb.dataset.pw0 || (spb.dataset.pw0 = parseFloat(spb.style.width))) : 0;
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
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:Archivo;letter-spacing:3.4pt", HW, 24, 13, 5), lh = T.f*1.3, H = 17 + T.n*lh + 9 + 1.2, y = 30 + (270 - 30 - H)/2;
    kk.style.top = y + 'pt'; ti.style.top = (y + 17) + 'pt'; ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = (T.n*lh) + 'pt'; ti.dataset.lines = T.n; ru.style.top = (y + 17 + T.n*lh + 9) + 'pt'; };
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- Poster geometry (pt, panel trim 612 x 792) ----------------
  // P02's margins: 36 pt at the sides, the foot's fine print at 776; text keeps inside X0..X1. No page frame (that is B01's): P02's
  // one frame is the thin offset accent line around the house.
  const X0 = 36, X1 = 576, CW = X1 - X0, FOOT = 766;
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW; FO.FOOT = FOOT;
  FO.frame = () => '';
  // the offset frame of P02 around a photo box (7 pt out, an accent hairline); data-box: the clearance check keeps every letter off it
  FO.ofr = (x, y, w, h, off) => { off = off == null ? 7 : off; return `<div class="po-ofr" data-box="1" style="left:${x - off}pt;top:${y - off}pt;width:${w + 2*off}pt;height:${h + 2*off}pt"></div>`; };
  // P02's headline: Archivo 700 caps, letter spacing -1.6% of the size, every line of a stack at one size, line pitch 0.88 of the size.
  // In a line box as tall as the size, the capitals run from 0.135 to 0.845 of it (Archivo's metrics).
  const HLcss = s => `font-family:Archivo;font-weight:700;letter-spacing:${(-s*0.016).toFixed(2)}pt;font-size:${s}pt`;
  FO.CAPT = 0.135; FO.CAPB = 0.845; FO.PITCH = 0.88;
  const hlMemo = new Map();   // a headline's width scales with its size (the tracking is a share of the size): measured once at 100 pt
  FO.hlW = (t, s) => { const k = String(t).toUpperCase(); if(!hlMemo.has(k)) hlMemo.set(k, FXS.width(k, HLcss(100))); return hlMemo.get(k)*s/100; };
  FO.hlLine = (t, x, y, s, slot, ac, w) => `<div class="po-hl${ac ? ' ac' : ''}" style="left:${x}pt;top:${y}pt;width:${w || CW}pt;height:${s}pt;font-size:${s}pt;line-height:${s}pt;letter-spacing:${(-s*0.016).toFixed(2)}pt" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`;
  // a heading's words in lines of width w at size s (greedy)
  FO.hlSplit = (t, s, w) => { const out = []; let cur = ''; String(t).toUpperCase().split(/\s+/).filter(Boolean).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FO.hlW(tr, s) > w) { out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out; };
  // balanced display breaks: the fewest lines, then the most even, and no line ends on a short word (a, an, the, of, to, up ...)
  const SHORTW = /^(A|AN|THE|OF|TO|UP|IN|ON|AT|IS|AND|OR|WITH|FOR|BY|ITS)$/;
  FO.hlBreaks = (t, s, w, maxL) => { const W = String(t).toUpperCase().split(/\s+/).filter(Boolean); let best = null;
    const rec = (i, lines) => { if(lines.length > maxL) return; if(i === W.length){ const ws = lines.map(l => FO.hlW(l, s)); if(Math.max(...ws) > w) return;
        if(lines.slice(0, -1).some(l => SHORTW.test(l.split(' ').pop().replace(/[,.]/g, '')))) return;
        const sc = lines.length*10000 + (Math.max(...ws) - Math.min(...ws)); if(!best || sc < best.sc) best = {sc, L: lines.slice()}; return; }
      if(lines.length){ const keep = lines[lines.length - 1], cur = keep + ' ' + W[i]; if(FO.hlW(cur, s) <= w){ lines[lines.length - 1] = cur; rec(i + 1, lines); lines[lines.length - 1] = keep; } }
      lines.push(W[i]); rec(i + 1, lines); lines.pop(); };
    rec(0, []); return best && best.L; };
  FO.hlFit = (t, w, max, min, maxL) => { for(let s = max; s >= min; s -= 0.5){ const L = FO.hlBreaks(t, s, w, maxL); if(L){ const ws = L.map(l => FO.hlW(l, s)); if(L.length === 1 || Math.min(...ws) >= 0.42*Math.max(...ws)) return {s, L}; } }
    return {s: min, L: FO.hlSplit(t, min, w)}; };
  // a page heading in P02's hand: the tracked accent caps line, then the title stacked in Archivo caps, its last line in the accent (as the
  // sign-in sheet's "PLEASE / SIGN IN"). Returns {html, y}: y is the capitals' foot of the last line.
  FO.headStack = (kicker, title, slot, y, o) => { o = o || {}; const t = String(title || '').replace(/\.$/, ''), F = FO.hlFit(t, o.w || CW, o.max || 40, o.min || 22, o.lines || 3);
    let h = `<div class="po-wd" style="left:${X0}pt;top:${y}pt;width:${CW}pt" data-slot="${slot}.kicker" data-lines="1">${esc(String(kicker || '').toUpperCase())}</div>`;
    const ty = y + 18 - F.s*FO.CAPT;
    F.L.forEach((l, i) => { h += FO.hlLine(l, X0 - F.s*0.02, ty + i*F.s*FO.PITCH, F.s, i ? `${slot}.title.l${i}` : `${slot}.title`, F.L.length > 1 && i === F.L.length - 1); });
    return {html: h, y: ty + (F.L.length - 1)*F.s*FO.PITCH + F.s*FO.CAPB, s: F.s, n: F.L.length}; };
  // a photo with its name under it in the accent caps line, set left (P02 sets everything left)
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;
  // how many lines a text sets in width w (greedy word wrap, measured)
  FO.wrapN = (t, css, w) => { let n = 1, cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1) { n++; cur = wd; } else cur = tr; }); return n; };
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  FO.fitTitle = (t, fam, w, max, min, maxLines) => { for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w)) return {f, n: L.length, w}; }
    return {f: min, n: FO.wrapLines(t, `${fam};font-size:${min}pt`, w).length, w}; };
  // the standard contact card as P02's foot: agent on the left, the brokerage panel on the right with the one logo, knockout on the dark
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = PO.logoSrc(D); const ko = !(D.brand || {}).logoKnockout && !(D.brand || {}).logoOnDark;
    const pw = 180, lh = Math.min(46, H - 30), s = {/* the half-height card (owner 11/15/2026): agentcard.js `half` values, so the 62 pt block reads like Ivory's */ pad: [5, 10, 4], hsGap: 12, rowGap: 12, panelPad: [5, 8], panelGap: 3, desig: 8.6, label: 8.6, phone: 15, line: 10, office: 9.5, officeLH: 1.18, desigInline: true, name: 20, nameFloor: 15, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 10.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div style="--cc-display:Archivo;--cc-body:Archivo">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: ko ? 'filter:brightness(0) invert(1)' : ''}) + '</div>'; };

  // ---------------- FRONT: the fold-over cover and the flyer front are two different posters (design pass 11/15) ----------------
  const addrParts = L => { const ad = String(L.address || ''), m = /^(\d+[A-Za-z-]*)\s+(.+)$/.exec(ad); return m ? [m[1], m[2]] : [ad, '']; };
  const fitHL = (t, w, max, min) => { for(let s = max; s >= min; s -= 0.5) if(FO.hlW(t, s) <= w) return s; return min; };
  const CAPH = FO.CAPB - FO.CAPT;
  // a tighter crop on the subject house: the whole house (roof, both sides) with a little sky and ground, less neighbor and driveway.
  // data-zoom="z,fx,fy" (set after SW.focus). Returns '' when the frame already holds the house closely or the window cannot reach it.
  FO.heroZoom = (D, id, w, h, zmax) => { const p = (D.photos || {})[id]; if(!p || !p.box || !p.w || !p.h) return ''; const ia = p.w/p.h, ta = w/h, vw0 = Math.min(1, ta/ia), vh0 = Math.min(1, ia/ta), [x0, y0, x1, y1] = p.box, px = 0.04, pt = 0.07, pb = 0.05;
    const z = Math.min(vw0/(x1 - x0 + 2*px), vh0/(y1 - y0 + pt + pb), zmax || 1.7); if(!(z > 1.05)) return '';
    const vw = vw0/z, vh = vh0/z, lo = (1 - vw0)/2, to = (1 - vh0)/2, cl = v => Math.min(1, Math.max(0, v));
    const l = (x0 + x1)/2 - vw/2, t = y0 - pt - Math.max(0, (vh - (y1 - y0 + pt + pb))*0.6);
    const fx = vw0 - vw > 1e-6 ? cl((l - lo)/(vw0 - vw)) : 0.5, fy = vh0 - vh > 1e-6 ? cl((t - to)/(vh0 - vh)) : 0.5, L2 = lo + (vw0 - vw)*fx, T2 = to + (vh0 - vh)*fy;
    if(L2 > x0 - 0.01 || L2 + vw < x1 + 0.01 || T2 > y0 - 0.01 || T2 + vh < y1 + 0.01) return '';
    return ` data-zoom="${z.toFixed(3)},${fx.toFixed(3)},${fy.toFixed(3)}"`; };
  const zoomed = (html, D, id, w, h, zmax) => { const z = FO.heroZoom(D, id, w, h, zmax); return z ? html.replace(`data-photo="${id}"`, `data-photo="${id}"${z}`) : html; };
  FO.zoomed = zoomed;
  // the facts as four equal items: Archivo numerals, the words in the tracked accent caps
  FO.stats = (D, x, y, w, ns) => { ns = ns || 22; const parts = FXS.statItems(D.listing).map(FXS.statParts);
    return `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${ns + 2}pt;display:flex;justify-content:space-between;align-items:baseline">` + parts.map((p, i) => `<div style="white-space:nowrap" data-slot="front.fact.${i}" data-lines="1"><span style="font-family:var(--po-font);font-weight:700;font-size:${ns}pt;line-height:${ns + 2}pt;letter-spacing:-.4pt;color:var(--po-head)">${esc(p.n)}</span><span style="font-family:var(--po-font);font-weight:700;font-size:9pt;line-height:${ns + 2}pt;letter-spacing:2pt;text-transform:uppercase;color:var(--po-accent);margin-left:7pt">${esc(p.l)}</span></div>`).join('') + `</div>`; };
  const placeLines = L => { const pl = String(FXS.placeLine(L) || ''), m = /^(.*?)\s+(\d{5})$/.exec(pl); return [FXS.hood(L), m ? m[1] : pl, m ? m[2] : ''].filter(Boolean).map(x => x.toUpperCase()); };
  const WDcss = 'font-family:Archivo;font-weight:700;font-size:9pt;letter-spacing:2.4pt';
  // THE COVER: the house number as the poster (up to 200 pt, its capitals 2 in tall), the place stacked small beside it, the street name
  // across the full measure in the accent, a heavy rule, the four facts, then the whole house, big, inside P02's thin accent frame
  // (the Open House flyer's and the sign-in sheet's frame). No write-up, no room row, no agent, no brokerage: one focal point.
  FO.cover = (D) => { const L = D.listing, K = (D.sw || {}).front || {}, [l1, l2] = addrParts(L), id = K.hero || 'front', TOPC = 36;
    const PL = placeLines(L), plW = Math.max(...PL.map(x => FXS.width(x, WDcss))) + 4, side = plW <= 150;
    const S1 = fitHL(l1, side ? CW - plW - 16 : CW, 200, 60), w1 = FO.hlW(l1, S1), top1 = side ? TOPC : TOPC + 20;
    let t = FO.hlLine(l1, X0 - S1*0.03, top1 - S1*FO.CAPT, S1, 'address', false, w1 + S1*0.08);
    if(side) PL.forEach((x, i) => { t += `<div class="po-wd" style="left:${X1 - plW}pt;top:${top1 - 2.5 + i*15}pt;width:${plW}pt;font-size:9pt;line-height:12pt;letter-spacing:2.4pt;text-align:right;margin-right:-2.4pt" data-slot="front.place${i ? '.l' + i : ''}" data-lines="1">${esc(x)}</div>`; });
    else t += `<div class="po-wd" style="left:${X0}pt;top:${TOPC - 4}pt;width:${CW}pt" data-slot="front.place" data-lines="1">${esc(PL.join('  ·  '))}</div>`;
    let capB = top1 + S1*CAPH;
    if(l2){ const S2 = fitHL(l2, CW, 124, 28), y2 = capB + Math.max(12, S2*0.16); t += FO.hlLine(l2, X0 - S2*0.03, y2 - S2*FO.CAPT, S2, 'address.l1', true, CW + S2*0.08); capB = y2 + S2*CAPH; }
    const ry = capB + 15, sy = ry + 13;
    t += `<div class="po-heavy" style="left:${X0}pt;top:${ry}pt;width:${CW}pt"></div>` + FO.stats(D, X0, sy, CW, 22);
    const HY = sy + 24 + 20 + 7, PW = CW - 14, HH = FOOT - 7 - HY, PX = X0 + 7;
    const h = FO.ofr(PX, HY, PW, HH) + zoomed(SW.heroHtml(D, id, PX, HY, PW, HH, 'front.house', []), D, id, PW, HH);
    return h + t; };
  // THE FLYER FRONT: the house first, in P02's frame, across the top; under it the number and the street name locked up side by side
  // (number in the paper color, street stacked in the accent, one block as wide as the measure), the heavy rule, the four facts,
  // three rooms named, and the write-up with the accent bar. No agent, no brokerage.
  FO.flyerFront = (D, o) => { const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = o.intro || F.intro || K.summary || [], [l1, l2] = addrParts(L), id = F.hero || K.hero || 'front';
    // Owner 11/16/2026 (book p30): the address a little smaller and tighter (number capitals 64 pt at most, was 104), the house and the
    // rooms bigger, and a longer write-up (four full lines of the listing's own facts, was three).
    const PH = 384, FY = 36 + 7, FH = PH - FY - 7; let h = FO.ofr(X0 + 7, FY, CW - 14, FH) + zoomed(FXS.box(D, id, X0 + 7, FY, CW - 14, FH, 'front.house'), D, id, CW - 14, FH, 1.45), t = '';
    t += `<div class="po-wd" style="left:${X0}pt;top:${PH + 14}pt;width:${CW}pt" data-slot="front.place" data-lines="1">${esc(placeLines(L).join('  ·  '))}</div>`;
    const LT = PH + 34, words = String(l2).toUpperCase().split(/\s+/).filter(Boolean), cuts = words.length > 1 ? words.map((_, i) => i).slice(1) : [];
    let best = null;
    // first choice: the number and the whole street on one line at one size, the lockup spanning the measure (no paper left beside it)
    // the street sized to fill the rest of the measure (never larger than the number), on the number's baseline; its capitals at least 26 pt
    for(let cap = 64; cap >= 48 && !best; cap -= 1){ const S1 = cap/CAPH, w1 = FO.hlW(l1, S1), sw = CW - w1 - 18, S2 = l2 ? fitHL(l2, sw, S1, 10) : 0; if(l2 && S2*CAPH >= 26 && FO.hlW(l2, S2) <= sw) best = {cap, S1, w1, S2, ls: [String(l2)], one: true}; }
    for(let cap = 80; cap >= 44 && !best; cap -= 1){ const S1 = cap/CAPH, w1 = FO.hlW(l1, S1), sw = CW - w1 - 18; if(sw < 60) continue;
      const two = S2 => cuts.map(c => [words.slice(0, c).join(' '), words.slice(c).join(' ')]).filter(ls => ls.every(x => FO.hlW(x, S2) <= sw)).sort((a, b) => Math.abs(FO.hlW(a[0], S2) - FO.hlW(a[1], S2)) - Math.abs(FO.hlW(b[0], S2) - FO.hlW(b[1], S2)))[0];
      const S2 = cap/(FO.PITCH + CAPH), ls = cuts.length ? two(S2) : null;
      if(ls){ const wmax = Math.max(...ls.map(x => FO.hlW(x, S2))); if(wmax >= sw*0.86) best = {cap, S1, w1, S2, ls}; }
      else if(!cuts.length || cap === 44){ const s1 = Math.min(S1, fitHL(l2, sw, S1, 16)); best = {cap, S1, w1, S2: s1, ls: [String(l2)]}; } }
    if(!best){ const cap = 56, S1 = cap/CAPH, w1 = FO.hlW(l1, S1), sw = CW - w1 - 18, S2 = Math.min(cap/(FO.PITCH + CAPH), ...words.map(x => fitHL(x, sw, 60, 14))); best = {cap, S1, w1, S2, ls: words.length > 1 ? [words.slice(0, Math.ceil(words.length/2)).join(' '), words.slice(Math.ceil(words.length/2)).join(' ')] : [String(l2)]}; }
    t += FO.hlLine(l1, X0 - best.S1*0.03, LT - best.S1*FO.CAPT, best.S1, 'address', false, best.w1 + best.S1*0.08);
    { const sx = X0 + best.w1 + 18, n = best.ls.length, blockCap = (n - 1)*best.S2*FO.PITCH + best.S2*CAPH, y0 = LT + best.cap - blockCap;
      best.ls.forEach((x, i) => { if(x) t += FO.hlLine(x, (best.one ? X1 - FO.hlW(x, best.S2) : sx) - best.S2*0.03, y0 + i*best.S2*FO.PITCH - best.S2*FO.CAPT, best.S2, 'address.l' + (i + 1), true, (best.one ? FO.hlW(x, best.S2) : X1 - sx) + best.S2*0.08); }); }
    const ry = LT + best.cap + 12, sy = ry + 11;
    t += `<div class="po-heavy" style="left:${X0}pt;top:${ry}pt;width:${CW}pt"></div>` + FO.stats(D, X0, sy, CW, 21);
    const lh = 19, n = o.lines || 4, wy = FOOT - n*lh, SY = sy + 24 + 14, SH = wy - 16 - 12 - 7 - SY;
    const strip = (o.strip || P.flyerStrip || P.strip || []).slice(0, 3), gap = 12, sw_ = (CW - (strip.length - 1)*gap)/Math.max(1, strip.length);
    strip.forEach((sid, i) => { h += FO.tile(D, sid, X0 + i*(sw_ + gap), SY, sw_, SH, 'front.strip' + i); });
    t += `<div class="po-bar" data-role="front-bar" style="left:${X0}pt;top:${wy + 3}pt;height:${n*lh - 6}pt"></div>`;
    t += FO.full(`<div class="abs po-pq" data-slot="front.summary" data-lines="${n}" data-try="${n}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0 + 14}pt;top:${wy}pt;width:${CW - 14}pt;height:${n*lh}pt;font-size:13pt;line-height:${lh}pt"></div>`);
    return h + t; };
  FO.front = (D, o) => (o && o.cover) ? FO.cover(D, o) : FO.flyerFront(D, o || {});
  // after the fill: the flyer write-up sits on the foot; the strip above it grows down into any room it did not use (no empty band); the bar follows the lines
  FO.frontSnug = () => { const su = document.querySelector('[data-slot="front.summary"]'); if(!su || !su.textContent.trim()) return; const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = FOOT - n*lh;
    su.style.top = top + 'pt'; su.style.height = (n*lh) + 'pt'; const bar = document.querySelector('[data-role="front-bar"]'); if(bar){ bar.style.top = (top + 3) + 'pt'; bar.style.height = (n*lh - 6) + 'pt'; }
    const lbls = [...document.querySelectorAll('[data-slot^="front.strip"][data-slot$=".label"]')]; if(!lbls.length) return; const lb = Math.max(...lbls.map(l => parseFloat(l.parentElement.style.top) + 12)), d = top - 16 - lb; if(d <= 0.5) return;
    lbls.forEach(l => { l.parentElement.style.top = (parseFloat(l.parentElement.style.top) + d) + 'pt'; const ph = document.querySelector(`.ph[data-slot-photo="${l.dataset.slot.replace(/\.label$/, '')}"]`), pb = ph && ph.parentElement; if(pb) pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; }); };

  // ---------------- THE INSIDE SPREAD ----------------
  // One horizon across the fold: on both pages a room bleeds off the top and both sides to the same line (BLEED); under it each page's
  // headline stacked huge over about two thirds of the measure, that room's caption beside it. Left: the kitchen (or the second room)
  // big, beside the paper card with its 36 pt numerals. Right: three rooms, the first widest, baths last and smallest.
  const BLEED = 286, HW = 356;
  const sideCap = (D, c, slot, top, hh) => { const a0 = FXS.augment(D, c), L0 = FXS.leadLabel(a0.lead), cx = X0 + HW + 24, cw = X1 - cx, n = Math.max(3, Math.floor((hh + 12 - 20)/13.5));
    return {n, bottom: top + 20 + n*13.5, html: `<div class="abs" style="left:${cx}pt;top:${top}pt;width:${cw}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${cw}pt">${esc(L0.name.toUpperCase())}</div></div>` +
      `<div class="abs cap side" data-ph-top="${top}" data-ph-h="${hh}"><div class="a" style="position:absolute;left:${cx}pt;top:${top + 20}pt;width:${cw}pt;height:${n*13.5}pt;font-size:10.5pt;line-height:13.5pt" data-free="1" data-slot="${slot}" data-room="${esc(L0.name)}" data-lh="13.5" data-lines="${n}" data-min="3" data-narrow="0" ${FXS.sd(a0.s)}></div></div>`}; };
  // Owner 11/16/2026 (book p29 / p16 rule): the two top rooms meet at the center fold with 0.05 in of paper on each side of it
  // (1/10 in in all), so a slightly off fold still looks clean; the left page's room stops 3.6 pt short of 612, the right's starts at 3.6.
  const FOLD = 3.6;
  const pageTop = (D, c0, R, key, slot0) => { let h = key === 'left' ? FXS.box(D, c0.photo, -9, -9, 621 - FOLD, BLEED + 9, slot0) : FXS.box(D, c0.photo, FOLD, -9, 621 - FOLD, BLEED + 9, slot0);
    // one band on both pages (the rows under it start on one line across the fold): the headline at the largest size that sets in the band
    const BAND = 126; let hd = null; for(let mx = 50; mx >= 24 && !hd; mx -= 1){ const t = FO.headStack(R.kicker || '', R.title || '', key, BLEED + 24, {max: mx, min: Math.min(mx, 24), lines: 3, w: HW}); if(t.y - (BLEED + 24) <= BAND + 0.5 || mx === 24) hd = t; }
    { const sl = BAND - (hd.y - BLEED - 24); if(sl > 6) hd = FO.headStack(R.kicker || '', R.title || '', key, BLEED + 24 + sl/2, {max: hd.s, min: hd.s, lines: 3, w: HW}); }
    h += hd.html.replace(/width:540pt/g, `width:${HW}pt`);
    const sc = sideCap(D, c0, slot0, BLEED + 24, BAND); h += sc.html;
    return {html: h, y: BLEED + 24 + BAND + 24}; };
  // ---------------- the kitchen card's small plans (owner 11/16/2026, book p29) ----------------
  // The listing's own plan image, never redrawn (PlanInk tints its lines to the card's ink, its white goes clear); the room a group of
  // rows describes is lit by a translucent accent box set over it from plan.levels[].roomBoxes (fractions of the image, the room
  // named exactly as the plan labels it). A floor with no roomBoxes cannot light a room, so the card falls back to full-width rows.
  FO.miniLevels = D => { const lv = ((D.plan || {}).levels || []).filter(L => L.kind === 'image' && L.src && (L.roomBoxes || []).length); return lv.length ? lv : null; };
  const rk = t => String(t || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  // which plan rooms a row names: by its label first ("Pantry", "Kitchen and baths"), then the card's own room (the kitchen card)
  FO.miniGroups = (D, LV, box, items) => {
    const all = LV.flatMap((L, li) => L.roomBoxes.map((r, ri) => ({li, ri, k: rk(r.name), name: r.name})));
    const named = (t, said) => { const w = ' ' + rk(t) + ' ' + rk(said) + ' '; let hit = all.filter(r => w.includes(' ' + r.k + ' '));
      if(!hit.length && /\bbaths?\b/.test(w)) hit = all.filter(r => /\bbath$/.test(r.k));
      if(/\bbaths\b/.test(w)) hit = hit.concat(all.filter(r => /\bbath$/.test(r.k) && !hit.includes(r)));
      if(/\bkitchen\b/.test(w) && !hit.some(r => r.k === 'kitchen')) hit = hit.concat(all.filter(r => r.k === 'kitchen'));
      return hit; };
    const home = named(box.kicker || '').filter(r => r.k === 'kitchen');
    const tgt = items.map(it => { let h = named(it.l, ''); if(h.some(r => /\bbath$/.test(r.k)) && /\bboth\b/i.test(JSON.stringify(it.s || [])) && all.filter(r => /\bbath$/.test(r.k)).length !== 2) h = h.filter(r => !/\bbath$/.test(r.k)); if(!h.length) h = home; const li = h.length ? h[0].li : null; h = h.filter(r => r.li === li);
      return {li: li == null ? LV.findIndex(L => L.roomBoxes.some(r => rk(r.name) === 'kitchen')) : li, hi: h.map(r => r.ri), key: (li == null ? 'w' : li) + ':' + h.map(r => r.ri).join(',')}; });
    const out = []; tgt.forEach((t, i) => { const g = out[out.length - 1]; if(g && g.key === t.key) g.to = i; else out.push({from: i, to: i, key: t.key, li: Math.max(0, t.li), hi: t.hi}); });
    return out.map(g => Object.assign(g, {L: LV[g.li], label: ((D.plan || {}).levels || []).length > 1 ? LV[g.li].name : ''})); };
  FO.miniPlan = (D, g, x, y, W, H, slot) => { const L = g.L, lab = g.label ? 12 : 0, a = L.w/L.h; let pw = Math.min(W, (H - lab)*a), ph = pw/a;
    const px = x + (W - pw)/2, py = y + (H - lab - ph)/2;
    const ink = window.PlanInk ? PlanInk.style({plan: {colored: !!(D.plan || {}).colored, lineColor: '#161616'}}, false) : '';
    let h = `<div class="abs" data-mini-plan="${slot}" style="left:${px}pt;top:${py}pt;width:${pw}pt;height:${ph}pt"><img data-mini-plan-img="1" src="${esc(L.src)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;${ink}">`;
    g.hi.forEach(i => { const r = (L.roomBoxes[i] || {}).box; if(!r) return; h += `<div style="position:absolute;left:${r[0]*100}%;top:${r[1]*100}%;width:${r[2]*100}%;height:${r[3]*100}%;background:var(--po-accent);opacity:.55;outline:1pt solid var(--po-main);outline-offset:-0.5pt"></div>`; });
    h += '</div>';
    if(lab) h += `<div class="abs" style="left:${x - 6}pt;top:${py + ph + 3}pt;width:${W + 12}pt;height:10pt;font-family:var(--po-font);font-weight:700;font-size:8pt;line-height:10pt;letter-spacing:.2pt;text-align:center;color:var(--po-paper-ink);white-space:nowrap" data-slot="${slot}.floor" data-lines="1" data-fine="1">${esc(g.label)}</div>`;
    return h; };
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, cs = FO.cards(D, P.left || []), [heroC, kit] = cs;
    const pt = pageTop(D, heroC, I, 'left', 'left.wide'); let h = pt.html; const RY = pt.y;
    window.__leftMissing = !kit;   // the page needs its second captioned photo beside the card (a photo id with no caption copy leaves a hole)
    const WL = 264, BX = X0 + WL + 18, BW = X1 - BX, BY = RY, BH = FOOT - RY, lx = BX + 16, iw = BW - 32, MP = FO.miniLevels(D); let numW = MP ? 80 : 0, tw = iw - numW; const tcss = 'font-family:Archivo;font-weight:400;font-size:10pt';
    if(kit){ let cap = FXS.captioned(D, kit, X0, RY, WL, FOOT - RY - 25 - 3*13.5, 3, 'left.photo0', {fs: 10.5, lh: 13.5, min: 3}); if(kit.photo === 'bar') cap = cap.replace('<div class="ph" data-photo="bar"', '<div class="ph" data-zoom="1.9,0.2,0.75" data-photo="bar"'); h += cap; }
    // the card's items: the fullest true wording of each that sets on one line beside its numeral (none said on the back)
    const items0 = (box.items || []).slice(0, 6), SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat((BXb.inside || {}).items || SFb.inside, (BXb.outside || {}).items || SFb.outside).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const oneLine = it => { const S = (it.s || []).map(x => [].concat(x).filter(a => !SW.grams4(a).some(g => backG.has(g)) && !backT.some(b => SW.sameFact(b, a)))).filter(a => a.length); let best = '';
      const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(t && t.length > best.length && FXS.width(t, tcss) <= tw - 2 && !SW.sameFactIn(t)) best = t; return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
      walk(0, []); return best; };
    // the plan column gives way (down to the old numeral column's 56 pt) before any row loses its one true line
    if(MP){ const want = (tw0 => { const k = tw; tw = tw0; const n = items0.map(oneLine).filter(Boolean).length; tw = k; return n; })(iw - 56);
      for(const w of [80, 72, 64, 56]){ numW = w; tw = iw - w; if(items0.map(oneLine).filter(Boolean).length >= want) break; } }
    const lines1 = items0.map(oneLine), items = items0.filter((_, i) => lines1[i]), itemText = lines1.filter(Boolean), rows = Math.max(1, items.length), HD = 62, rowH = (BH - HD - 8)/rows, ns = Math.max(26, Math.min(36, rowH*0.82));
    let b = `<div class="po-pbox" style="left:${BX}pt;top:${BY}pt;width:${BW}pt;height:${BH}pt"></div>`;
    const hs = FXS.fitSize((box.heading || '').replace(/\.$/, ''), 'font-family:Archivo;font-weight:700', iw, 17, 11);
    b += `<div class="abs fo-kick" style="left:${lx}pt;top:${BY + 15}pt" data-slot="left.box.kicker" data-lines="1">${esc(String(box.kicker || 'The kitchen').toUpperCase())}</div>`;
    b += `<div class="abs fo-sub" style="left:${lx}pt;top:${BY + 30}pt;width:${iw}pt;font-size:${hs}pt;line-height:22pt;color:var(--po-paper-ink)" data-slot="left.box.heading" data-lines="1">${esc((box.heading || '').replace(/\.$/, ''))}</div>`;
    b += `<div class="po-heavy" style="left:${lx}pt;top:${BY + 57}pt;width:${iw}pt;background:var(--po-paper-ink)"></div>`;
    // Owner 11/16/2026 (book p29): no list numerals (they meant nothing). With a plan, the freed column carries the listing's own
    // floor plan, small, beside the rows it belongs to, with the room those rows describe lit in the accent (rows about one room
    // share one plan); the floor named under it on a multi-story home. Without a plan the rows run the card's full width.
    let groups = MP ? FO.miniGroups(D, MP, box, items) : [];
    // a plan beside one short row prints too small to read: groups on one floor then share one plan, every room they name lit
    if(groups.length > 1 && groups.some(g => (g.to - g.from + 1)*rowH < 110) && groups.every(g => g.li === groups[0].li))
      groups = [Object.assign({}, groups[0], {from: 0, to: rows - 1, hi: [...new Set(groups.flatMap(g => g.hi))]})];
    const gEnd = new Set(groups.map(g => g.to));
    items.forEach((it, i) => { const y = BY + HD + 4 + i*rowH;
      if(i < rows - 1) b += `<div class="abs hr" style="left:${gEnd.has(i) || !MP ? lx : lx + numW}pt;top:${y + rowH - 0.5}pt;width:${gEnd.has(i) || !MP ? iw : iw - numW}pt"></div>`;
      b += `<div class="abs fo-li-l" style="left:${lx + numW}pt;top:${y + rowH/2 - 14}pt;width:${tw}pt" data-slot="left.list.l${i}" data-lines="1">${esc(it.l)}</div>`;
      b += `<div class="abs" style="left:${lx + numW}pt;top:${y + rowH/2 - 1}pt;width:${tw}pt;height:15pt;font-family:var(--po-font);font-weight:400;font-size:10pt;line-height:15pt;color:#222;white-space:nowrap;overflow:hidden" data-slot="left.list.t${i}" data-lines="1">${esc(itemText[i])}</div>`; });
    groups.forEach((g, k) => { const y0 = BY + HD + 4 + g.from*rowH + 7, y1 = BY + HD + 4 + (g.to + 1)*rowH - 7; b += FO.miniPlan(D, g, lx, y0, numW - 14, y1 - y0, 'left.list.plan' + k); });
    return h + `<div class="po-ink">${b}</div>`; };
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs = FO.cards(D, P.right || []), [c0, ...more] = cs;
    const pt = pageTop(D, c0, R, 'right', 'right.photo0'); let h = pt.html; const RY = pt.y, clh = 13.5, nL = 3, G = 16, ph = FOOT - RY - 25 - nL*clh;
    const tiles = more.slice(0, 3), fr = tiles.length === 3 ? [0.4, 0.3, 0.3] : tiles.map(() => 1/tiles.length), W = CW - (tiles.length - 1)*G; let x = X0;
    tiles.forEach((c, i) => { const w = W*fr[i]; h += FXS.captioned(D, c, x, RY, w, ph, nL, 'right.photo' + (i + 1), {fs: 10, lh: clh, min: 3}); x += w + G; });
    return h; };
  FO.rightFit = () => {};
  // ---------------- BACK (fold-over) and flyer back ----------------
  // Its own arrangement: the page headline stacked across the top over a heavy rule; two columns under it, the write-up set ragged on
  // the left with a captioned photo, the listing's plan on the right at its own shape straight on the field (no box) with the paper
  // card of lists under it; Nearby as one band of three big numerals across the page (fold-over) or as the paper card's third column
  // in ink (flyer, which carries a three-photo row instead); P02's foot.
  const nearBand = (D, x, y, w) => { const N = (((D.sw || {}).back || {}).nearby || []).slice(0, 3), cw = (w - 96)/Math.max(1, N.length);
    let h = `<div class="po-rule" style="left:${x}pt;top:${y}pt;width:${w}pt"></div>` + `<div class="po-hl" style="left:${x}pt;top:${y + 23}pt;width:92pt;height:20pt;font-size:19pt;line-height:20pt;letter-spacing:-.3pt;color:var(--po-accent)" data-slot="back.near.kicker" data-lines="1">Nearby</div>`;
    N.forEach((n, i) => { const m = /^([\d.,]+)\s*(.*)$/.exec(String(n.dist)), num = m ? m[1] : n.dist, unit = m ? m[2] : '', nx = x + 96 + i*cw;
      h += `<div class="abs" style="left:${nx}pt;top:${y + 13}pt;width:${cw - 8}pt;height:38pt;white-space:nowrap;overflow:hidden" data-slot="back.near${i}" data-lines="1" data-fine="1"><span style="font-family:var(--po-font);font-weight:700;font-size:36pt;line-height:38pt;letter-spacing:-.6pt;color:var(--po-head)">${esc(num)}</span>${unit ? `<span style="font-family:var(--po-font);font-weight:700;font-size:9pt;line-height:38pt;letter-spacing:2pt;text-transform:uppercase;color:var(--po-head);margin-left:7pt">${esc(unit)}</span>` : ''}</div>`;
      // a long place name closes its tracking before its type would shrink under 8.5 pt (reversed type, owner 11/16 PR3)
      const pT = String(n.place || '').toUpperCase(), pls = [2, 1.6, 1.2, 0.8, 0.5, 0.2].find(t => FXS.width(pT, `font-family:Archivo;font-weight:700;font-size:9pt;letter-spacing:${t}pt`) <= cw - 10) ?? 0;
      h += `<div class="abs" style="left:${nx}pt;top:${y + 53}pt;width:${cw - 8}pt;height:12pt;font-family:var(--po-font);font-weight:700;font-size:9pt;line-height:12pt;letter-spacing:${pls}pt;text-transform:uppercase;color:var(--po-accent);white-space:nowrap;overflow:hidden" data-slot="back.near${i}.p" data-lines="1">${esc(n.place)}</div>`; });
    return h; };
  // Nearby in the paper card (flyer): numeral and unit one ink unit on one baseline, the place under it, three locked rows
  const nearInk = (D, x, y, w, rh) => { const N = (((D.sw || {}).back || {}).nearby || []).slice(0, 3);
    return N.map((n, i) => { const m = /^([\d.,]+)\s*(.*)$/.exec(String(n.dist)), num = m ? m[1] : n.dist, unit = m ? m[2] : '', ry = y + i*rh, c = 'color:var(--po-paper-ink)';
      return `<div class="abs" style="left:${x}pt;top:${ry + (rh - 29)/2}pt;width:${w}pt;height:17pt;white-space:nowrap;overflow:hidden" data-slot="back.near${i}" data-lines="1" data-fine="1"><span style="font-family:var(--po-font);font-weight:700;font-size:16pt;line-height:17pt;letter-spacing:-.3pt;${c}">${esc(num)}</span>${unit ? `<span style="font-family:var(--po-font);font-weight:700;font-size:8.5pt;line-height:17pt;letter-spacing:1.6pt;text-transform:uppercase;${c};margin-left:5pt">${esc(unit)}</span>` : ''}</div>` +
        `<div class="abs" style="left:${x}pt;top:${ry + (rh - 29)/2 + 18}pt;width:${w}pt;height:11pt;font-family:var(--po-font);font-weight:600;font-size:8.5pt;line-height:11pt;letter-spacing:1.6pt;text-transform:uppercase;color:#2b2b2b;white-space:nowrap;overflow:hidden" data-slot="back.near${i}.p" data-lines="1">${esc(n.place)}</div>`; }).join(''); };
  // the plan at its own shape, set against the right margin, straight on the field (the plan prints clear with light lines, PlanInk)
  FO.planBox = (D, xr, y, maxH, maxW) => { const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: D.plan.turn ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: !!D.plan.turn, angle: D.plan.turn && D.plan.kind === 'color' ? 270 : undefined}), noteW = FXS.width((D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate. Turned on its side.', 'font-family:Archivo;font-weight:400;font-size:8pt') + 34, cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 30, D.plan.minCard || 0, 240, noteW));
    const pc = FXS.planCard(D, xr - cw, y, cw, maxH); pc.w = cw; pc.html = pc.html.replace('class="card"', 'class="po-plan"'); return pc; };
  FO.CARD_H = 62; FO.CARD_Y = 686;   // P02's foot: a faint rule at 677, the card at 686, the fine print at 756
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:756pt;width:${CW}pt;height:8pt;text-align:left" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    const rowIds = flyer ? (P.flyerBack || []).slice(0, 3) : (P.backRow || ['bath2']), rowCards = FO.cards(D, rowIds);
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const HT = (hasPlan ? (KB.plan || FB.plan) : (KB.noplan || FB.noplan)) || KB.plan || {};
    const hd = FO.headStack(KB.kicker || HT.kicker || 'The house', KB.title || HT.title || 'The house', 'back.head', 32, {max: flyer ? 34 : 40, min: 22, lines: 2});
    let h = hd.html + `<div class="po-heavy" style="left:${X0}pt;top:${hd.y + 13}pt;width:${CW}pt"></div>`;
    const A0 = hd.y + 13 + 2.5 + 16, BOXB = FO.CARD_Y - 14, G = 22;
    const nb = Math.max(Math.min(c1.length, 5), Math.min(c2.length, 5), 3);
    let rw, rBottom;
    if(flyer){
      // two columns, then the three-photo row, then the paper card (two lists and Nearby in ink)
      const need = 16 + 20 + Math.max(nb*20, 3*33) + 12, capH = 25 + 3*13.5, TH = Math.min((P.flyerTH || 300) - 70, BOXB - need - 14 - 114 - capH - 16 - (A0 - 8));
      if(hasPlan){ let pc = FO.planBox(D, X1, A0 - 8, TH, 340); const over = pc.bottom - (A0 - 8 + TH); if(over > 0.5) pc = FO.planBox(D, X1, A0 - 8, TH - over, 340); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; rw = pc.w; rBottom = pc.bottom; }
      else { rw = 268; const c = FXS.cardFor(D, topId), ph = Math.max(96, TH - 30 - capH); h += FXS.captioned(D, c, X1 - rw, A0, rw, ph, 3, 'back.top', {fs: 10.5, lh: 13.5, min: 3}); rBottom = A0 + ph + capH; }
      const aw = CW - rw - G, sp = rBottom - A0, n = Math.floor(sp/16), lh = +(sp/n).toFixed(3);
      h += FO.rag(FO.wu(keep(f2.concat(f1)), X0, A0, aw, n*lh + 0.01, 'back.about', 11, lh, 'body')).replace('data-slot="back.about"', `data-slot="back.about" data-span="${sp.toFixed(2)}"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
      const y0 = rBottom + 16, n3 = rowCards.length, gap = 10, tw = (CW - (n3 - 1)*gap)/n3, PHh = Math.max(110, Math.min(200, BOXB - need - 14 - y0 - capH));
      rowCards.forEach((c, i) => { h += FXS.captioned(D, c, X0 + i*(tw + gap), y0, tw, PHh, 3, 'back.photo' + i, {fs: 10.5, lh: 13.5, min: 3}); });
      const by = y0 + PHh + capH + 14, BH = BOXB - by, ty = by + 15, ly = ty + 20, Wc = [150, 150], Xc = [X0 + 16, X0 + 16 + 150 + 14, X0 + 16 + 300 + 28 + 12], fs = 10.5;
      const cap = Math.max(3, Math.min(5, Math.floor((BOXB - 12 - ly)/19))), b1 = FXS.bullets(c1, Xc[0], 0, Wc[0], 1, 'x', cap, fs).n, b2 = FXS.bullets(c2, Xc[1], 0, Wc[1], 1, 'x', cap, fs).n, rows = Math.max(b1, b2, 3), rh = Math.min(32, (BOXB - 12 - ly)/rows);
      let t = `<div class="po-pbox" style="left:${X0}pt;top:${by}pt;width:${CW}pt;height:${BH}pt"></div>`;
      t += FO.kick(t1, Xc[0], ty, 'back.updates.title') + FXS.bullets(c1, Xc[0], ly, Wc[0], rh, 'back.updates', cap, fs).html;
      t += FO.kick('Outside', Xc[1], ty, 'back.outside.title') + FXS.bullets(c2, Xc[1], ly, Wc[1], rh, 'back.outside', cap, fs).html;
      t += FO.kick('Nearby', Xc[2], ty, 'back.near.kicker') + `<div class="abs vr" style="left:${Xc[2] - 13}pt;top:${by + 14}pt;height:${BH - 28}pt"></div>` + nearInk(D, Xc[2], ly, X1 - 16 - Xc[2], (BOXB - 12 - ly)/3);
      h += `<div class="po-ink">${t}</div>`;
    } else {
      const NBH = 70, colsB = BOXB - NBH - 12, boxNeed = 15 + 20 + nb*21 + 10, capH = 25 + 3*14;
      if(hasPlan){ const pc = FO.planBox(D, X1, A0 - 8, colsB - Math.max(boxNeed, 208) - 14 - A0 + 8, 330); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; rw = pc.w; rBottom = pc.bottom; }
      else { rw = 312; const c = FXS.cardFor(D, topId), ph = colsB - Math.max(boxNeed, 190) - 16 - A0 - capH; h += FXS.captioned(D, c, X1 - rw, A0, rw, ph, 3, 'back.top', {fs: 11, lh: 14, min: 3}); rBottom = A0 + ph + capH; }
      const aw = CW - rw - G, by = rBottom + 16, BH = colsB - by, rx = X1 - rw;
      h += FO.rag(FO.wu(keep(f2.concat(f1)), X0, A0, aw, rBottom - A0, 'back.about', 11.5, 17, 'body')).replace('data-slot="back.about"', `data-slot="back.about"${P.pool ? ` data-pool="${P.pool}"` : ''}`);
      h += FXS.captioned(D, rowCards[0], X0, by, aw, BH - capH, 3, 'back.photo1', {fs: 11, lh: 14, min: 3});
      // the paper card: the two lists stacked in one column, rows spread to the card's foot
      const iw = rw - 32, n1 = FXS.bullets(c1, 0, 0, iw, 1, 'x', 4, 10.5).n, n2 = FXS.bullets(c2, 0, 0, iw, 1, 'x', 4, 10.5).n, rh = Math.min(27, (BH - 13 - 2*19 - 9 - 8)/Math.max(1, n1 + n2));
      let t = `<div class="po-pbox" style="left:${rx}pt;top:${by}pt;width:${rw}pt;height:${BH}pt"></div>`, ty = by + 13;
      t += FO.kick(t1, rx + 16, ty, 'back.updates.title') + FXS.bullets(c1, rx + 16, ty + 19, iw, rh, 'back.updates', 4, 10.5).html; ty += 19 + n1*rh + 9;
      t += FO.kick('Outside', rx + 16, ty, 'back.outside.title') + FXS.bullets(c2, rx + 16, ty + 19, iw, rh, 'back.outside', 4, 10.5).html;
      h += `<div class="po-ink">${t}</div>` + nearBand(D, X0, colsB + 12, CW);
    }
    h += `<div class="po-rule" style="left:${X0}pt;top:${(window.__cardY || FO.CARD_Y) - 9}pt;width:${CW}pt"></div>`;
    h += FO.contact(D, X0, window.__cardY || FO.CARD_Y, CW, FO.CARD_H) + FO.fine(D);
    return {html: h + FO.frame(), issues};
  };
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
    if(window.__leftMissing) out.push({slot: 'left.photo0', kind: 'photo-missing', detail: 'the inside left has no second photo beside its card (sw.plan.left names a photo with no caption copy)'});
    const seen = new Set(); return out.filter(i => { const k = i.slot + i.detail; if(seen.has(k)) return false; seen.add(k); return true; }); };
})();
