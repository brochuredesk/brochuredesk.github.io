/* Photo Grid fold-over and two-sided flyer builders. The fill, refit and snug passes are the pilot's (Twilight Frame, grown from the
   FXS-14 builders); every page structure here is Photo Grid's own. Panel coordinates in pt: trim 612 x 792. The page is a locked grid
   of tiles 24 pt in from the trim with 10 pt gutters (the approved Open House library flyer B14): photo tiles, main-color tiles with
   IBM Plex Sans Condensed caps, a dark tile for numerals, white cells with a thin main-color line for prints with captions and lists.
   Font properties are always written one by one (an inline `font:` shorthand with var() is dropped when ShrinkFit resizes the element). */
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
    if(el.closest('.cap')){ el.dataset.min = Math.max(3, +el.dataset.min || 0); } });
  FO.just3 = () => document.querySelectorAll('[data-j3]').forEach(el => { if(el.dataset.rag) return; if(el.textContent.trim() && SW.lines(el).n >= 2) el.style.textAlign = 'justify'; });
  FO.gaps = () => document.querySelectorAll('[data-slot]').forEach(el => { if(getComputedStyle(el).textAlign !== 'justify' || el.querySelector('[data-slot]')) return;
    const sp = parseFloat(getComputedStyle(el).fontSize)*0.28; let worst = 0; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const t = n.textContent; for(let i = 0; i < t.length; i++){ if(t[i] !== ' ') continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const q = r.getBoundingClientRect(); if(q.width > worst && q.height > 0) worst = q.width; } }
    if(worst > sp*3.2) el.style.textAlign = 'left'; });
  FO.fill3Check = () => [...document.querySelectorAll('[data-j3]')].filter(el => el.textContent.trim()).flatMap(el => { const L = SW.lines(el);
    return L.n < 3 ? [{slot: el.dataset.slot, kind: 'writeup-under-3-lines', lines: L.n}] : L.fill < 0.895 ? [{slot: el.dataset.slot, kind: 'writeup-last-line-short', pct: Math.round(L.fill*100)}] : []; });

  // Photo Grid: a labeled-items table (*.box.t<N>) is set as one: the line count and type size at which EVERY row's true sentences
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

  // Photo Grid refit (after SW.fill and the table pass): any block, caption row or labeled table that still misses the fill rules
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
    it.remove(); const HW = +ti.dataset.hw || parseFloat(ti.style.width), T = FO.fitTitle(ti.textContent, "font-family:Manrope", HW, 24, 13, 5), lh = T.f*1.3, H = 17 + T.n*lh + 9 + 1.2, y = 30 + (270 - 30 - H)/2;
    kk.style.top = y + 'pt'; ti.style.top = (y + 17) + 'pt'; ti.style.fontSize = T.f + 'pt'; ti.style.width = T.w + 'pt'; ti.style.lineHeight = lh + 'pt'; ti.style.height = (T.n*lh) + 'pt'; ti.dataset.lines = T.n; ru.style.top = (y + 17 + T.n*lh + 9) + 'pt'; };
  // a photo with its name under it (no caption text): a strip or row tile
  FO.tile = (D, id, x, y, w, h, slot) => `${FXS.box(D, id, x, y, w, h, slot)}<div class="abs" style="left:${x}pt;top:${y + h + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`;

  // ---------------- Photo Grid geometry (pt, panel trim 612 x 792) ----------------
  // B14's grid: 24 pt margins, 10 pt gutters, every block a tile. Text sits 16-18 pt inside its tile (40 pt and more from the trim
  // and the fold). Nothing bleeds: a tile at the fold stops 24 pt short of it, so the two pages of a spread keep one paper gutter.
  const X0 = 24, X1 = 588, CW = X1 - X0, Y0 = 24, Y1 = 768, G = 10, PAD = 18, CP = 0;   // design pass: prints are bare photo tiles (no cell, no inset), the caption set on the paper under them
  FO.X0 = X0; FO.X1 = X1; FO.CW = CW; FO.Y0 = Y0; FO.Y1 = Y1; FO.G = G;
  FO.frame = () => '';
  FO.zoom = (D, h) => { const Z = ((D.sw || {}).plan || {}).zoom || {}; Object.keys(Z).forEach(id => { h = h.split(`<div class="ph" data-photo="${id}"`).join(`<div class="ph" data-zoom="${Z[id].join(',')}" data-photo="${id}"`); }); return h; };
  const tileH = (cls, x, y, w, h, extra) => `<div class="pg-t ${cls}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt" ${extra || ''}></div>`;
  FO.tileH = tileH;
  // the display face: IBM Plex Sans Condensed 700 caps. In a line box as tall as the size the capitals run from 0.177 to 0.875 of it.
  const HLcss = s => `font-family:'Plex Condensed';font-weight:700;letter-spacing:.2pt;font-size:${s}pt`;
  FO.CAPT = 0.177; FO.CAPB = 0.875; FO.PITCH = 0.9;
  FO.hlW = (t, s) => FXS.width(String(t).toUpperCase(), HLcss(s));
  FO.hlLine = (t, x, y, s, slot, cls, w) => `<div class="pg-hl ${cls || ''}" style="left:${x}pt;top:${y}pt;width:${w || CW}pt;height:${s}pt;font-size:${s}pt;line-height:${s}pt" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`;
  // a heading's words in n lines, balanced: the split whose widest line is narrowest; a line never ends on a one-letter word or on a
  // short joining word (a, the, and, of, is, up...), which starts the next line instead
  const WEAK = /^(.|AN|OF|TO|IN|ON|AT|IS|UP|THE|AND|WITH|FOR)$/;
  FO.hlBal = (t, n) => { const ws = String(t).toUpperCase().split(/\s+/).filter(Boolean); if(n <= 1 || ws.length <= 1) return [ws.join(' ')]; n = Math.min(n, ws.length);
    let best = null; const rec = (i, left, acc) => { if(left === 1){ const L = acc.concat([ws.slice(i).join(' ')]); let pen = 0; L.slice(0, -1).forEach(l => { const w = l.split(' '); if(WEAK.test(w[w.length - 1]) && w.length > 0) pen += 0.25; });
          const wd = L.map(l => FO.hlW(l, 20)), sc = Math.max(...wd)*(1 + pen) + (Math.min(...wd) < 0.42*Math.max(...wd) ? 40 : 0); if(!best || sc < best.sc) best = {sc, L}; return; }
      for(let k = i + 1; k <= ws.length - (left - 1); k++) rec(k, left - 1, acc.concat([ws.slice(i, k).join(' ')])); };
    rec(0, n, []); return best.L; };
  FO.hlSplit = (t, s, w) => { for(let n = 1; n <= 6; n++){ const L = FO.hlBal(t, n); if(L.every(l => FO.hlW(l, s) <= w)) return L; } return FO.hlBal(t, 6); };
  // the largest size (max down to min) at which the heading sets in at most maxL balanced lines, none wider than w
  FO.hlFit = (t, w, max, min, maxL) => { const C = []; for(let n = 1; n <= maxL; n++){ const L = FO.hlBal(t, n); if(L.length < n) break; const wd = Math.max(...L.map(l => FO.hlW(l, 100))); C.push({s: Math.min(max, Math.floor(w/wd*100*2)/2), L}); }
    const top = Math.max(...C.map(c => c.s)), best = C.find(c => c.s >= Math.max(Math.min(30, top), 0.84*top)) || C[C.length - 1];   // the fewest lines that keep the size within a sixth of the largest
    if(best.s < min) best.s = min; return best; };
  // lines stacked from the capitals' top at y; returns the html and the capitals' foot of the last line
  FO.stack = (L, x, y, s, slot, cls, w) => { const ty = y - s*FO.CAPT; return {html: L.map((l, i) => FO.hlLine(l, x, ty + i*s*FO.PITCH, s, i ? `${slot}.l${i}` : slot, cls, w)).join(''), y: ty + (L.length - 1)*s*FO.PITCH + s*FO.CAPB}; };
  FO.eb = (t, x, y, w, slot, cls, extra) => `<div class="pg-eb ${cls || ''}" style="left:${x}pt;top:${y}pt;width:${w}pt;${extra || ''}" data-slot="${slot}" data-lines="1">${esc(String(t).toUpperCase())}</div>`;
  FO.bar = (x, y, cls) => `<div class="pg-bar" style="left:${x}pt;top:${y}pt;background:var(${cls || '--pg-on-main'})"></div>`;
  FO.wrapLines = (t, css, w) => { const out = []; let cur = ''; String(t).split(/\s+/).forEach(wd => { const tr = cur ? cur + ' ' + wd : wd; if(cur && FXS.width(tr, css) > w - 1){ out.push(cur); cur = wd; } else cur = tr; }); if(cur) out.push(cur); return out.map(l => FXS.width(l, css)); };
  FO.fitTitle = (t, fam, w, max, min, maxLines) => { for(let f = max; f >= min; f -= 0.25){ const L = FO.wrapLines(t, `${fam};font-size:${f}pt`, w); if(L.length <= maxLines && (L.length === 1 || L[L.length - 1] >= 0.8*w)) return {f, n: L.length, w}; }
    return {f: min, n: FO.wrapLines(t, `${fam};font-size:${min}pt`, w).length, w}; };

  // a print: a white cell with the thin main-color line, the photo set 8 pt inside it, its name and its caption under the photo at the
  // photo's own width. The cell is drawn again after the fill (FO.cellsFit) when a row of two shares its width unevenly.
  FO.print = (D, c, x, y, w, h, lines, slot, o) => { o = o || {}; const lh = o.lh || 13.5, cp = o.cell ? 8 : CP, ph = h - cp - 5 - 25 - lines*lh;
    return tileH(o.cell ? 'cell' : 'bare', x, y, w, h, `data-cellfor="${slot}" data-cp="${cp}"`) + FXS.captioned(D, c, x + cp, y + cp, w - 2*cp, ph, lines, slot, Object.assign({fs: 10, lh, min: 3}, o)); };
  // a print with its name only (the cover's rooms)
  FO.printName = (D, id, x, y, w, h, slot) => { const ph = h - 2*CP - 21;
    return tileH('bare', x, y, w, h) + FXS.box(D, id, x + CP, y + CP, w - 2*CP, ph, slot) + `<div class="abs" style="left:${x + CP}pt;top:${y + CP + ph + 7}pt;width:${w - 2*CP}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w - 2*CP}pt">${esc(FO.lead(D, id).split(/ and |, /)[0].toUpperCase())}</div></div>`; };
  FO.cellsFit = () => document.querySelectorAll('.pg-t[data-cellfor]').forEach(t => { const sl = t.dataset.cellfor, ph = document.querySelector(`.ph[data-slot-photo="${sl}"]`), pb = ph && ph.parentElement, a = document.querySelector(`.cap .a[data-slot="${sl}"]`), lb = document.querySelector(`[data-slot="${sl}.label"]`); if(!pb) return;
    const cp = +(t.dataset.cp || CP); t.style.left = (parseFloat(pb.style.left) - cp) + 'pt'; t.style.width = (parseFloat(pb.style.width) + 2*cp) + 'pt';
    // the caption's last line sits 5 pt over the cell's foot: the photo takes any room the caption did not use
    if(a){ const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight), d = parseFloat(t.style.top) + parseFloat(t.style.height) - 5 - (parseFloat(a.style.top) + n*lh);
      if(Math.abs(d) > 0.4 && parseFloat(pb.style.height) + d > 60){ pb.style.height = (parseFloat(pb.style.height) + d) + 'pt'; if(lb) lb.parentElement.style.top = (parseFloat(lb.parentElement.style.top) + d) + 'pt'; a.style.top = (parseFloat(a.style.top) + d) + 'pt'; a.style.height = (n*lh) + 'pt'; } } });
  // the subject house a little closer (owner lesson 13: whole roof, both sides, less driveway and less of the neighbors): the photo is
  // enlarged about its house box, never past the box, at most 1.3x
  FO.tight = D => document.querySelectorAll('.ph[data-tight]').forEach(el => { const p = (D.photos || {})[el.dataset.photo], im = el.querySelector('img'); if(!p || !p.box || !im) return;
    const W = p.w || im.naturalWidth, H = p.h || im.naturalHeight, tw = el.clientWidth, th = el.clientHeight, s = Math.max(tw/W, th/H), [x0, y0, x1, y1] = p.box;
    const z = Math.max(1, Math.min(1.3, 96/(300*s), 0.9*tw/((x1 - x0)*W*s), 0.88*th/((y1 - y0)*H*s))); if(z < 1.02) return;   // never past the photo's OWN pixels at 300 ppi (the renderer's enlarged copy does not count)
    const iw = W*s*z, ih = H*s*z, cx = (x0 + x1)/2*iw, cy = (y0 + y1)/2*ih, left = Math.min(0, Math.max(tw - iw, tw/2 - cx)), top = Math.min(0, Math.max(th - ih, th*0.52 - cy));
    im.style.cssText = `position:absolute;max-width:none;width:${iw}px;height:${ih}px;left:${left}px;top:${top}px;object-fit:fill`; });
  // a photo shown larger than its frame (a tightened hero, a data-zoom tile) is measured on the listing photo's own pixels at the size it prints
  FO.zoomCap = (D, el, z) => { const p = (D.photos || {})[el.dataset.photo] || {}, W = p.w, H = p.h; if(!W || !H) return z; const s = Math.max(el.clientWidth/W, el.clientHeight/H); return Math.max(1, Math.min(z, 96/(300*s))); };
  FO.ppiCheck = D => [...document.querySelectorAll('.ph img')].flatMap(im => { const el = im.parentElement, p = (D.photos || {})[el.dataset.photo] || {}; if(!p.w || im.clientWidth <= el.clientWidth + 1 && im.clientHeight <= el.clientHeight + 1) return [];
    const ppi = Math.min(p.w/(im.clientWidth/96), p.h/(im.clientHeight/96)); return ppi < 299.5 ? [{slot: el.dataset.slotPhoto || el.dataset.photo, kind: 'hero-enlarged-under-300ppi', ppi: Math.round(ppi)}] : []; });
  const tight = h => h.replace('<div class="ph"', '<div class="ph" data-tight="1"');

  // the facts as rows of big numerals with their labels (reversed on a main or dark tile), a 1 pt rule over each row
  const statRows = (parts, x, y, w, rowH, slot, o) => { o = o || {}; const ns = o.n || Math.min(28, rowH*0.74), ls = o.l || 9;
    return parts.map((p, i) => { const ry = y + i*rowH;
      return (i || !o.noFirst ? `<div class="abs" style="left:${x}pt;top:${ry}pt;width:${w}pt;height:1pt;background:var(--pg-rule-on)"></div>` : '') +
        `<div class="abs" style="left:${x}pt;top:${ry + 1}pt;width:${w}pt;height:${rowH - 1}pt;display:flex;align-items:center;justify-content:space-between;white-space:nowrap" data-slot="${slot}.${i}" data-lines="1"><span style="font-family:var(--pg-cond);font-weight:700;font-size:${ns}pt;line-height:${rowH - 1}pt;color:var(${o.acc || '--pg-acc-main'})">${p.n}</span><span style="font-family:var(--pg-font);font-weight:700;font-size:${ls}pt;line-height:${rowH - 1}pt;letter-spacing:2pt;text-transform:uppercase;color:var(${o.on || '--pg-on-main'})">${esc(p.l)}</span></div>`; }).join(''); };
  const factParts = L => { const n = v => Number(v).toLocaleString('en-US'), out = [], bn = window.BD && BD.bathNum ? BD.bathNum(L) : {num: L.baths, label: 'Full Baths', half: ''};
    if(L.beds) out.push({n: String(L.beds), l: L.beds == 1 ? 'Bedroom' : 'Bedrooms'});
    if(L.baths) out.push({n: bn.num, l: bn.label});
    if(bn.half) out.push({n: bn.half.split(' ')[0], l: bn.half.split(' ').slice(1).join(' ')});
    if(L.sqft) out.push({n: n(L.sqft), l: 'Square feet'});
    const yr = L.yearBuilt || L.year; if(yr) out.push({n: String(yr), l: 'Built'});
    return out; };
  FO.factParts = factParts;
  const addrParts = L => { const ad = String(L.address || ''), m = /^(\d+[A-Za-z-]*)\s+(.+)$/.exec(ad); return m ? [m[1], m[2]] : [ad, '']; };

  // the standard contact card in a white cell: agent on the left, the brokerage panel on the right with the one logo
  FO.contact = (D, x, y, w, H) => { const A = D.agent || {}, b = Object.assign({}, D.brand || {}), hsSrc = A.headshot && ((D.photos || {})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    b.logo = PG.logoSrc(D);
    const pw = 180, lh = Math.min(46, H - 30), s = {name: 18, nameFloor: 15, hsW: Math.round(H*0.74), panelW: pw, inlineLabel: H < 72, wrap: false, lock: 9.5, logo: {wide: [pw - 20, lh], square: [H - 34, H - 34], tall: [H - 32, H - 32]}};
    return `<div style="--cc-display:'Plex Condensed';--cc-body:Manrope">` + ContactCard.html([x, y, w, H], Object.assign({}, A, {headshot: hsSrc}), b, {layout: 'panel', size: 'short', s, grow: 6, floor: 8.6, fine: '', bottomGap: 0.5, fieldAccent: true}) + '</div>'; };

  // ---------------- FRONT (the fold-over cover; no agent, no brokerage) ----------------
  // B14 grown into a cover: the whole house as one 3:2 tile across the top; under it the flyer's tall main-color tile, here carrying the
  // street (the number as large as the tile allows, the street name under it) and the facts as rows of numerals; beside it one room as
  // a print and the write-up reversed on the dark tile.
  FO.front = (D, o) => { o = o || {};
    // Design pass 11/15: one lead (the house, taller), the nameplate as the cover's one display moment (the street number about 1.5x the
    // first build, the facts set small in one quiet row at its foot), one room as a tall bare tile beside it. The write-up is off the cover.
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {};
    const HH = 404, TY = Y0 + HH + G, TW = 344, TH = Y1 - TY, ex = X0 + PAD, ew = TW - 2*PAD;
    let h = tight(FXS.box(D, F.hero || K.hero || 'front', X0, Y0, CW, HH, 'front.house')), t = tileH('main', X0, TY, TW, TH);
    const hood = FXS.hood(L), pl = FXS.placeLine(L); let y = TY + PAD;
    if(hood){ t += FO.eb(hood, ex, y, ew, 'front.hood', 'acc-main'); y += 13; }
    t += FO.eb(pl, ex, y, ew, 'front.place', hood ? 'on-main' : 'acc-main'); y += 12 + 16;
    const [num, name] = addrParts(L), parts = factParts(L).map(p => ({n: p.n, l: /square/i.test(p.l) ? 'Sq ft' : p.l})), foot = TY + TH - PAD;
    // the facts: one row of small numerals when they fit, else two rows
    const fcss = "font-family:Manrope;font-weight:700;letter-spacing:1.6pt;font-size:8.6pt", ncss = "font-family:'Plex Condensed';font-weight:700;font-size:24pt";
    const colW = p => Math.max(FXS.width(String(p.n).replace(/<[^>]+>/g, ''), ncss), FXS.width(p.l.toUpperCase(), fcss));
    const one = parts.reduce((a, p) => a + colW(p), 0) + (parts.length - 1)*16 <= ew, cols = one ? parts.length : Math.ceil(parts.length/2), rowsN = Math.ceil(parts.length/cols), FRH = 44, fy = foot - rowsN*FRH;
    let S1 = 60, F2 = {s: 28, L: [name]};
    for(let s = 172; s >= 60; s -= 2){ if(FO.hlW(num, s) > ew) continue; const f2 = !name ? {s: 0, L: []} : (() => { const a = FO.hlFit(name, ew, Math.min(58, s*0.4), 26, 1); return a.s >= 34 ? a : FO.hlFit(name, ew, Math.min(54, s*0.4), 26, 2); })();
      const nb = y + s*(FO.CAPB - FO.CAPT), sb = name ? nb + 14 + (f2.L.length - 1)*f2.s*FO.PITCH + f2.s*(FO.CAPB - FO.CAPT) : nb;
      if(sb + 30 <= fy || s === 60){ S1 = s; F2 = f2; break; } }
    const a = FO.stack([num], ex - S1*0.035, y, S1, 'address', 'on-main', ew + 30); t += a.html;
    let by = a.y;
    if(name){ const b = FO.stack(F2.L, ex - F2.s*0.02, a.y + 14, F2.s, 'address.name', 'on-main', ew + 20); t += b.html; by = b.y; }
    t += FO.bar(ex, by + 15);
    const cw = ew/cols;
    parts.forEach((p, i) => { const c = i % cols, r = Math.floor(i/cols), fx = ex + c*cw, ry = fy + r*FRH;
      if(c === 0) t += `<div class="abs" style="left:${ex}pt;top:${ry}pt;width:${ew}pt;height:1pt;background:var(--pg-rule-on)"></div>`;
      t += `<div class="abs" style="left:${fx}pt;top:${ry + 6}pt;width:${cw - 4}pt;height:${FRH - 6}pt;white-space:nowrap" data-slot="front.fact.${i}" data-lines="1"><div style="font-family:var(--pg-cond);font-weight:700;font-size:24pt;line-height:24pt;color:var(--pg-acc-main)">${p.n}</div><div style="font-family:var(--pg-font);font-weight:700;font-size:8.6pt;line-height:11pt;letter-spacing:1.6pt;text-transform:uppercase;color:var(--pg-on-main)">${esc(p.l)}</div></div>`; });
    // one room beside the nameplate, a tall bare tile with its name under it
    const RX = X0 + TW + G, RW = X1 - RX, room = (P.coverRoom || (P.strip || []).find(id => !/^kitchen/.test(id)));
    if(room){ const ph = TH - 21; h += FXS.box(D, room, RX, TY, RW, ph, 'front.room') + `<div class="abs" style="left:${RX}pt;top:${TY + ph + 8}pt;width:${RW}pt;white-space:nowrap"><div class="lbl" data-slot="front.room.label" data-lines="1" style="max-width:${RW}pt">${esc(FO.lead(D, room).split(/ and |, /)[0].toUpperCase())}</div></div>`; }
    else t = t.replace(`width:${TW}pt;height:${TH}pt`, `width:${CW}pt;height:${TH}pt`);
    return h + t;
  };
  // after the fill: the flyer front's foot row is as tall as its write-up needs; the house above it takes the rest (no empty band in the cell)
  FO.frontSnug = () => { const cell = document.querySelector('[data-role="ff-cell"]'), su = document.querySelector('[data-slot="front.summary"]'), hero = document.querySelector('[data-role="ff-hero"]'); if(!cell || !su || !hero) return;
    const n = SW.lines(su).n, lh = parseFloat(su.style.lineHeight), top = parseFloat(cell.style.top), need = parseFloat(su.style.top) - top + n*lh + 13, d = Math.min(40, parseFloat(cell.style.height) - need); if(d < 2) return;
    const mv = (el, dt, dh) => { if(!el) return; if(dt) el.style.top = (parseFloat(el.style.top) + dt) + 'pt'; if(dh) el.style.height = (parseFloat(el.style.height) + dh) + 'pt'; };
    mv(cell, d, -d); mv(su, d, 0); mv(document.querySelector('[data-role="ff-head"]'), d, 0); mv(hero.parentElement, 0, d);
    const pr = document.querySelector('[data-role="ff-print"]'); if(pr){ const [tile, box, lab] = pr.children; mv(tile, d, -d); mv(box, d, -d); mv(lab, 0, 0); } };

  // ---------------- FLYER FRONT (its own piece, not the cover: no agent, no brokerage) ----------------
  // The street on one main-color band tile across the top with the facts on the dark tile beside it; the whole house as the 3:2 tile
  // under them; at the foot the write-up in a white cell under the listing's own headline, and one room as a print.
  FO.flyerFront = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, P = (D.sw || {}).plan || {}, intro = F.intro || K.summary || [];
    const SW_ = 176, BW = CW - SW_ - G, BH = 142, ex = X0 + PAD, ew = BW - 2*PAD;
    let t = tileH('main', X0, Y0, BW, BH) + tileH('dark', X0 + BW + G, Y0, SW_, BH);
    const place = [FXS.hood(L), FXS.placeLine(L)].filter(Boolean).join('  ·  ');
    const room = BH - 2*PAD - 12 - 12, cap = FO.CAPB - FO.CAPT; let A = null;
    { const one = FO.hlFit(L.address, ew, Math.min(78, room/cap), 30, 1), [num, name] = addrParts(L), two = name ? (() => { for(let s = Math.min(70, room/(cap + FO.PITCH)); s >= 30; s -= 0.5) if(FO.hlW(num, s) <= ew && FO.hlW(name, s) <= ew) return {s, L: [num, name]}; return null; })() : null;
      A = two && two.s*1.0 > one.s*1.35 ? two : one; }
    // the eyebrow and the address center together in the tile, top to bottom (owner 11/16: the same space over the place line as under
    // the street); a one-line street no longer leaves the eyebrow pinned to the top with the room under the address
    const ah = (A.L.length - 1)*A.s*FO.PITCH + A.s*cap, sh = Math.max(0, (room - ah)/2), ay = Y0 + PAD + 12 + 12 + sh;
    t += FO.eb(place, ex, Y0 + PAD + sh, ew, 'front.place', 'acc-main');
    t += FO.stack(A.L, ex - A.s*0.02, ay, A.s, 'address', 'on-main', ew + 20).html;
    const parts = factParts(L), sx = X0 + BW + G + 14, sw_ = SW_ - 28, rh = (BH - 20)/parts.length;
    t += statRows(parts, sx, Y0 + 10, sw_, rh, 'front.fact', {acc: '--pg-acc-dark', on: '--pg-on-dark', n: Math.min(22, rh*0.72), l: 8.5, noFirst: true});
    const HY = Y0 + BH + G, HH = 376;
    let h = tight(FXS.box(D, F.hero || K.hero || 'front', X0, HY, CW, HH, 'front.house'));
    // the foot: the write-up in a white cell, one room as a print
    const FY = HY + HH + G, FH = Y1 - FY, PW = 196, WW = CW - PW - G, lh = 16.5, head = String(F.head || '').replace(/\.$/, ''), ty = FY + 14 + (head ? 18 : 0), nL = Math.floor((FH - (ty - FY) - 12)/lh);
    const room1 = P.flyerRoom || (P.flyerStrip || P.strip || []).find(id => !/^kitchen/.test(id));
    t += tileH('cell', X0, FY, WW, FH, 'data-role="ff-cell"');
    if(head) t += `<div class="abs fo-kick" data-role="ff-head" style="left:${X0 + 16}pt;top:${FY + 14}pt" data-slot="front.head" data-lines="1">${esc(head.toUpperCase())}</div>`;
    t += FO.full(`<div class="abs body" data-slot="front.summary" data-lines="${nL}" data-try="${nL},${nL - 1}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0 + 16}pt;top:${ty}pt;width:${WW - 32}pt;height:${nL*lh}pt;font-size:11pt;line-height:${lh}pt"></div>`);
    if(room1) h += `<div data-role="ff-print">${FO.printName(D, room1, X0 + WW + G, FY, PW, FH, 'front.room')}</div>`;
    return h.replace('data-slot-photo="front.house"', 'data-slot-photo="front.house" data-role="ff-hero"') + t;
  };

  // ---------------- the inside spread: one grid across both pages ----------------
  // Design pass 11/15 ("busy and boxy": fewer boxes, one photo leads each page). Three rows on shared horizons across the fold:
  // A (title tile on the outer edge, a room at the fold), B (each page's lead photo the full width of the page, the kitchen meeting the
  // primary bedroom at the fold), C (the sign-in sheet's numbered card or the dark write-up on the outer edge, one bare print at the fold).
  const R1 = [Y0, 264], R2 = [274, 554], R3 = [564, Y1], TW_ = 208, KW = 354;
  // the title tile: the tracked line, the title stacked in Plex Condensed caps, the bar, then the lead room's name and caption reversed
  FO.titleTile = (D, x, y, w, h, kicker, title, slot, c) => { const tx = x + PAD, tw = w - 2*PAD; let t = tileH('main', x, y, w, h);
    t += FO.eb(kicker || '', tx, y + PAD, tw, `${slot}.kicker`, 'acc-main');
    const a = c ? FXS.augment(D, c) : null, L0 = a ? FXS.leadLabel(a.lead) : null, clh = 13.5, minCap = a ? 12 + 6 + 3*clh : 0, ttl = String(title || '').replace(/\.$/, '');
    let F = null; for(let mx = 40; mx >= 26 && !F; mx -= 2){ const f = FO.hlFit(ttl, tw, mx, Math.min(mx, 26), 4), hh = (f.L.length - 1)*f.s*FO.PITCH + f.s*(FO.CAPB - FO.CAPT); if(PAD + 12 + 10 + hh + 12 + 3 + 12 + minCap + PAD - 4 <= h || mx === 26) F = f; }
    const st = FO.stack(F.L, tx - F.s*0.02, y + PAD + 22, F.s, `${slot}.title`, 'on-main', tw + 16); t += st.html;
    t += FO.bar(tx, st.y + 12).replace('class="pg-bar"', `class="pg-bar" data-tilebar="${slot}.lead"`);
    if(a){ const top = st.y + 12 + 3 + 13, n = Math.max(3, Math.floor((y + h - PAD + 4 - top - 18)/clh)), ct = y + h - PAD + 4 - n*clh;
      t += `<div class="abs" style="left:${tx}pt;top:${ct - 18}pt;width:${tw}pt;white-space:nowrap"><div class="lbl" style="color:var(--pg-acc-main);max-width:${tw}pt" data-slot="${slot}.lead.label" data-lines="1">${esc(L0.name.toUpperCase())}</div></div>`;
      t += `<div class="abs cap rev"><div class="a" style="position:absolute;left:${tx}pt;top:${ct}pt;width:${tw}pt;height:${n*clh}pt;font-size:10pt;line-height:${clh}pt" data-slot="${slot}.lead" data-measures="1,0.95,0.9" data-malign="left" data-tilebot="${y + h - PAD + 4}" data-room="${esc(L0.name)}" data-lh="${clh}" data-lines="${n}" data-min="3" data-narrow="0" data-rag="1" ${FXS.sd(a.s)}></div></div>`; }
    return t; };

  // after the fill: a title tile's caption sits on the tile's foot with its name over it; when that opens more than a line of room
  // under the title, the short rule moves down to sit over the name (head at the top, the room's note at the foot, one rule between)
  FO.tileSnug = () => document.querySelectorAll('.cap.rev .a[data-tilebot]').forEach(a => { const n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight), top = +a.dataset.tilebot - n*lh, lb = document.querySelector(`[data-slot="${a.dataset.slot}.label"]`), bar = document.querySelector(`[data-tilebar="${a.dataset.slot}"]`);
    a.style.top = top + 'pt'; a.style.height = (n*lh) + 'pt'; if(lb) lb.parentElement.style.top = (top - 18) + 'pt';
    if(bar && top - 18 - parseFloat(bar.style.top) > 30) bar.style.top = (top - 18 - 11) + 'pt'; });

  // INSIDE LEFT: the title tile and the lead room (A), the kitchen across the page (B), its numbered card and one print (C)
  FO.left = (D) => { const K = D.sw || {}, I = K.left || {}, box = I.box || {}, P = K.plan || {}, ids = P.pgLeft || P.left || [], lead = FXS.cardFor(D, ids[0]), kid = P.pgKitchen || 'kitchen', small = FO.cards(D, ids.slice(1, 2));
    let h = FO.titleTile(D, X0, R1[0], TW_, R1[1] - R1[0], I.kicker, I.title, 'left', lead);
    h += FXS.box(D, lead.photo, X0 + TW_ + G, R1[0], CW - TW_ - G, R1[1] - R1[0], 'left.wide');
    h += FXS.box(D, kid, X0, R2[0], CW, R2[1] - R2[0], 'left.kitchen');
    h += FO.spec(D, X0, R3[0], KW, R3[1] - R3[0], box);
    if(small[0]) h += FO.print(D, small[0], X0 + KW + G, R3[0], CW - KW - G, R3[1] - R3[0], 3, 'left.photo0');
    return FO.zoom(D, h); };
  // the kitchen / what's-new card: the sign-in sheet in small. A main-color label band (the tracked line and the heading reversed), then
  // numbered rows on one line each, as the sign-in sheet's columns: the square chip, the label in Plex caps, the fullest true wording that fits.
  FO.spec = (D, x, y, w, h, box) => { const K = D.sw || {}, HB = 44, lx = x + 12, iw = w - 24, numW = 24, tcss = 'font-family:Manrope;font-weight:500;font-size:9.5pt', lcss = "font-family:'Plex Condensed';font-weight:700;font-size:9.5pt;letter-spacing:1.1pt";
    const all = (box.items || []).slice(0, 8), LW = Math.min(96, Math.max(...all.map(it => FXS.width(String(it.l).toUpperCase(), lcss))) + 10), tw = iw - numW - LW;
    const SFb = FXS.sellingFacts(D), BXb = ((K.back || {}).boxes) || {}, backT = [].concat(((BXb.inside || {}).items || SFb.inside).slice(0, 5), ((BXb.outside || {}).items || SFb.outside).slice(0, 5)).map(String), backG = new Set(backT.flatMap(t => SW.grams4(t)));
    const oneLine = it => { const S = (it.s || []).map(x => [].concat(x).filter(a => !SW.grams4(a).some(g => backG.has(g)) && !backT.some(b => SW.sameFact(b, a)))).filter(a => a.length); let best = '';
      const walk = (i, acc) => { if(i === S.length){ const t = acc.join(' '); if(t && t.length > best.length && FXS.width(t, tcss) <= tw - 2 && !SW.sameFactIn(t)) best = t; return; } walk(i + 1, acc); S[i].forEach(a => walk(i + 1, acc.concat(a))); };
      walk(0, []); return best; };
    const lines0 = all.map(oneLine), items = all.filter((_, i) => lines0[i]).slice(0, 7), text = lines0.filter(Boolean).slice(0, 7), rows = items.length, rowH = (h - HB - 4)/Math.max(1, rows);
    let b = tileH('cell', x, y, w, h) + tileH('band', x, y, w, HB);
    const hd = (box.heading || '').replace(/\.$/, ''), hs = FXS.fitSize(hd.toUpperCase(), "font-family:'Plex Condensed';font-weight:700;letter-spacing:.3pt", iw, 16, 11);
    b += FO.eb(box.kicker || 'The kitchen', lx, y + 7, iw, 'left.box.kicker', 'acc-main');
    b += `<div class="abs fo-sub on-main" style="left:${lx}pt;top:${y + 20}pt;width:${iw}pt;font-size:${hs}pt;line-height:19pt" data-slot="left.box.heading" data-lines="1">${esc(hd)}</div>`;
    items.forEach((it, i) => { const ry = y + HB + 2 + i*rowH, mid = ry + rowH/2;
      if(i % 2 === 1) b += `<div class="abs" style="left:${x + 1}pt;top:${ry}pt;width:${w - 2}pt;height:${rowH}pt;background:var(--pg-tint)"></div>`;
      b += `<div class="pg-chip" style="left:${lx}pt;top:${mid - 8}pt;width:16pt;height:16pt;font-size:10pt;line-height:16pt" data-slot="left.list.n${i}" data-lines="1">${i + 1}</div>`;
      b += `<div class="abs fo-li-l" style="left:${lx + numW}pt;top:${mid - 6.5}pt;width:${LW - 6}pt;line-height:13pt" data-slot="left.list.l${i}" data-lines="1">${esc(it.l)}</div>`;
      b += `<div class="fo-li-t" style="left:${lx + numW + LW}pt;top:${mid - 6.5}pt;width:${tw}pt;height:13pt" data-slot="left.list.t${i}" data-lines="1">${esc(text[i])}</div>`; });
    return b; };

  // INSIDE RIGHT, mirroring the left page: a room at the fold with its caption in the title tile (A), the lead bedroom across the page (B),
  // and under it its own caption on the dark tile (the page's second voice) beside one small print, baths last and small (C)
  FO.right = (D) => { const K = D.sw || {}, R = K.right || {}, P = K.plan || {}, cs = FO.cards(D, P.pgRight || P.right || []), c0 = cs[0], cA = cs[2] || cs[1], cC = cs[2] ? cs[1] : cs[3];
    const LW = CW - TW_ - G;
    let h = '';
    if(cA){ h += FXS.box(D, cA.photo, X0, R1[0], LW, R1[1] - R1[0], 'right.photo1'); h += FO.titleTile(D, X0 + LW + G, R1[0], TW_, R1[1] - R1[0], R.kicker, R.title, 'right', cA); }
    else h += FO.titleTile(D, X0, R1[0], CW, R1[1] - R1[0], R.kicker, R.title, 'right', null);
    h += FXS.box(D, c0.photo, X0, R2[0], CW, R2[1] - R2[0], 'right.wide');
    const PW = CW - KW - G, wx = X0 + PW + G, top = R3[0];
    if(cC) h += FO.print(D, cC, X0, top, PW, R3[1] - top, 3, 'right.photo2');
    h += FO.capTile(D, cC ? wx : X0, top, cC ? KW : CW, R3[1] - top, c0, 'right.hero');
    return FO.zoom(D, h); };
  // a photo's caption on the dark tile right under it: its name in the accent, the caption in larger reversed type, the block centered
  FO.capTile = (D, x, y, w, hh, c, slot) => { const a = FXS.augment(D, c), L0 = FXS.leadLabel(a.lead), tx = x + PAD, tw = w - 2*PAD, lh = 17, n = Math.max(3, Math.floor((hh - 2*PAD - 20)/lh));
    return tileH('dark', x, y, w, hh) + `<div class="abs" style="left:${tx}pt;top:${y + PAD}pt;width:${tw}pt;white-space:nowrap"><div class="lbl" style="color:var(--pg-acc-dark);max-width:${tw}pt" data-slot="${slot}.label" data-lines="1">${esc(L0.name.toUpperCase())}</div></div>` +
      `<div class="abs cap rev"><div class="a" style="position:absolute;left:${tx}pt;top:${y + PAD + 20}pt;width:${tw}pt;height:${n*lh}pt;font-size:12pt;line-height:${lh}pt" data-slot="${slot}" data-measures="1,0.95,0.9,0.85" data-malign="left" data-tilemid="${y},${hh}" data-room="${esc(L0.name)}" data-lh="${lh}" data-lines="${n}" data-min="3" data-narrow="0" data-rag="1" ${FXS.sd(a.s)}></div></div>`; };
  FO.capMid = () => document.querySelectorAll('.cap.rev .a[data-tilemid]').forEach(a => { const [y, hh] = a.dataset.tilemid.split(',').map(Number), n = SW.lines(a).n, lh = parseFloat(a.style.lineHeight), blk = 20 + n*lh, t = y + (hh - blk)/2, lb = document.querySelector(`[data-slot="${a.dataset.slot}.label"]`);
    a.style.height = (n*lh) + 'pt'; a.style.top = (t + 20) + 'pt'; if(lb) lb.parentElement.style.top = t + 'pt'; });
  FO.rightFit = () => {};

  // ---------------- BACK (fold-over) and flyer back ----------------
  // Nearby as ONE dark strip across the page (design pass: one tile, not four): the tracked label, then each place as a big accent numeral,
  // its unit and the place in Plex caps, a 1 pt reversed rule between places
  const nearStrip = (D, x, y, w, hh) => { const N = (((D.sw || {}).back || {}).nearby || []).slice(0, 3); if(!N.length) return ''; const lw = 92, cw = (w - lw - 14)/N.length;
    let t = tileH('dark', x, y, w, hh) + `<div class="abs" style="left:${x + 16}pt;top:${y + (hh - 20)/2}pt;width:${lw - 16}pt;height:20pt;font-family:var(--pg-cond);font-weight:700;font-size:16pt;line-height:20pt;letter-spacing:.6pt;text-transform:uppercase;color:var(--pg-acc-dark);white-space:nowrap" data-slot="back.near.kicker" data-lines="1">Nearby</div>`;
    N.forEach((n, i) => { const tx = x + lw + i*cw, m = /^([\d.,]+)\s*(.*)$/.exec(String(n.dist)), num = m ? m[1] : n.dist, unit = m ? m[2] : '', ps = FXS.fitSize(String(n.place).toUpperCase(), "font-family:'Plex Condensed';font-weight:700;letter-spacing:1pt", cw - 24, 10.5, 8.5);
      t += `<div class="abs" style="left:${tx}pt;top:${y + 12}pt;width:1pt;height:${hh - 24}pt;background:var(--pg-rule-on)"></div><div class="fo-near" style="left:${tx + 14}pt;top:${y + (hh - 40)/2}pt;width:${cw - 22}pt;height:40pt" data-slot="back.near${i}" data-lines="1" data-fine="1"><div style="display:flex;align-items:baseline;gap:6pt;height:24pt"><span class="d" style="font-size:24pt">${esc(num)}</span>${unit ? `<span class="u" style="font-size:8.5pt;line-height:24pt">${esc(unit)}</span>` : ''}</div><div class="p" style="font-size:${ps}pt;line-height:14pt;margin-top:2pt">${esc(n.place)}</div></div>`; });
    return t; };
  // Nearby as one dark tile of rows (the flyer back). Owner 11/16 (Book 3 p18): five or six places, bigger, filling the column; the
  // flyer's own list (companion.flyer.pgBack.nearby, real distances) leads, the back's three are the fallback. Rows share the
  // height; numeral and place grow with the row (numeral up to 34 pt, place up to 15 pt, fitted to the width).
  const nearCol = (D, x, y, w, hh) => { const PB = (((D.companion || {}).flyer || {}).pgBack || {}).nearby, N = (PB && PB.length ? PB : (((D.sw || {}).back || {}).nearby || [])).slice(0, 6);
    let t = tileH('dark', x, y, w, hh) + FO.eb('Nearby', x + 14, y + 14, w - 28, 'back.near.kicker', 'acc-dark'); const top = y + 36, rh = (y + hh - 6 - top)/Math.max(1, N.length);
    const ds = Math.max(24, Math.min(34, Math.floor(rh*0.6))), dw = Math.ceil(Math.max(...N.map(n => FXS.width(String(n.dist).replace(/\s.*$/, ''), `font-family:var(--pg-cond);font-weight:700;font-size:${ds}pt`)), ds) + 4), us = ds >= 30 ? 9.5 : 8.5, maxP = ds >= 30 ? 15 : 12;
    N.forEach((n, i) => { const ry = top + i*rh, m = /^([\d.,]+)\s*(.*)$/.exec(String(n.dist)), num = m ? m[1] : n.dist, unit = m ? m[2] : '', ps = FXS.fitSize(String(n.place).toUpperCase(), "font-family:'Plex Condensed';font-weight:700;letter-spacing:1pt", w - 28 - dw - 18, maxP, 8.5);
      t += `<div class="abs" style="left:${x + 14}pt;top:${ry}pt;width:${w - 28}pt;height:1pt;background:var(--pg-rule-on)"></div><div class="fo-near" style="left:${x + 14}pt;top:${ry + 1}pt;width:${w - 28}pt;height:${rh - 1}pt;display:flex;align-items:center;gap:10pt" data-slot="back.near${i}" data-lines="1" data-fine="1"><span class="d" style="font-size:${ds}pt;width:${dw}pt;flex:none">${esc(num)}</span><span style="display:flex;flex-direction:column;gap:2pt">${unit ? `<span class="u" style="font-size:${us}pt;line-height:${us + 2}pt">${esc(unit)}</span>` : ''}<span class="p" style="font-size:${ps}pt;line-height:${ps + 2}pt">${esc(n.place)}</span></span></div>`; });
    return t; };
  // after the fonts load: a place name that still runs past its row steps down (never under 8.5 pt); flyer back only
  FO.nearFit = () => { document.querySelectorAll('.fo-near').forEach(r => { const p = r.querySelector('.p'); if(!p) return; let fs = parseFloat(p.style.fontSize); while(r.scrollWidth > r.clientWidth + 0.5 && fs > 8.5){ fs -= 0.25; p.style.fontSize = fs + 'pt'; p.style.lineHeight = (fs + 2) + 'pt'; } });
  // then every place in the column takes the smallest of those sizes, so the names read as one list
  { const ps = [...document.querySelectorAll('.fo-near .p')]; if(ps.length > 1){ const m = Math.min(...ps.map(p => parseFloat(p.style.fontSize))); ps.forEach(p => { p.style.fontSize = m + 'pt'; p.style.lineHeight = (m + 2) + 'pt'; }); } } };
  // a list in a white cell under the sign-in sheet's main-color label band
  const listCell = (title, items, x, y, w, hh, slot, cap) => { const BH = 22, probe = FXS.bullets(items, x + 12, 0, w - 24, 1, 'x', cap, 10), n = probe.n, rh = n > 1 ? Math.min(26, (hh - BH - 12 - 14)/(n - 1)) : 14, by = y + BH + 6 - (rh - 14)/2 + (n > 1 ? (hh - BH - 12 - 14 - (n - 1)*rh)/2 : 0);
    return {n, html: tileH('cell', x, y, w, hh) + tileH('band', x, y, w, BH) + `<div class="abs" style="left:${x + 12}pt;top:${y + 5}pt;width:${w - 24}pt;height:12pt;font-family:var(--pg-cond);font-weight:700;font-size:10pt;line-height:12pt;letter-spacing:1.2pt;text-transform:uppercase;color:var(--pg-on-main);white-space:nowrap;overflow:hidden" data-slot="${slot}.title" data-lines="1">${esc(title)}</div>` + FXS.bullets(items, x + 12, by, w - 24, rh, slot, cap, 10).html}; };
  // the plan in its white cell, the cell as wide as the drawing needs (the plan prints clear, its lines in the brand's dark color)
  FO.planBox = (D, x, y, maxH, maxW) => { const r0 = IvoryPlan.draw(D.plan, {x: 0, y: 0, w: D.plan.turn ? maxW - 44 : 900, h: maxH - 34}, {allowRotate: !!D.plan.turn, angle: D.plan.turn && D.plan.kind === 'color' ? 270 : undefined}), cw = Math.min(maxW, Math.max(Math.ceil((r0.usedW || 300)) + 44, D.plan.minCard || 0, 240)); return Object.assign(FXS.planCard(D, x, y, cw, maxH), {w: cw}); };
  FO.CARD_H = 60; FO.CARD_Y = 680;
  FO.fine = D => { const A = D.agent || {}, b = D.brand || {}, C = D.companion || {};
    return `<div class="abs fine" style="left:${X0}pt;top:755pt;width:${CW}pt;height:8pt;text-align:left" data-slot="fineprint" data-lines="1" data-fine="1">${esc([[A.designation, b.brokerage].filter(Boolean).join(', '), C.fineprint || 'Information deemed reliable but not guaranteed.'].filter(Boolean).join('  ·  '))}</div>`; };
  // the back's write-up on a main-color tile: the tracked line, the headline (it names what the write-up walks through), the bar, the text set ragged
  const aboutTile = (D, x, y, w, hh, hd, list, pool) => { const tx = x + PAD, tw = w - 2*PAD, ttl = String(hd.title || 'Floor by floor').replace(/\.$/, '');
    let h = tileH('main', x, y, w, hh) + FO.eb(hd.kicker || '', tx, y + PAD, tw, 'back.about.kicker', 'acc-main');
    const F = FO.hlFit(ttl, tw, 34, 22, 3), st = FO.stack(F.L, tx - F.s*0.02, y + PAD + 22, F.s, 'back.about.title', 'on-main', tw + 16); h += st.html + FO.bar(tx, st.y + 11);
    const y1 = st.y + 11 + 3 + 13, room = y + hh - PAD + 3 - y1, n = Math.floor(room/16), lh = +(room/n).toFixed(3);
    return h + FO.full(FO.wu(list, tx, y1, tw, n*lh + 0.01, 'back.about', 10.8, lh, 'rev-body')).replace('data-slot="back.about"', `data-slot="back.about" data-rag="1" data-span="${room.toFixed(2)}"${pool}`); };
  // Design pass 11/15: the fold-over back and the flyer back are two pages now.
  //   FOLD-OVER BACK  plan cell | write-up tile; Nearby as one dark strip; the outdoor print big beside ONE list cell (two banded lists); the contact.
  //   FLYER BACK      write-up tile | plan cell (mirrored); a row of two prints with Nearby as a dark column; no list cells; the contact.
  FO.back = (D, o) => { o = o || {}; const K = D.sw || {}, KB = K.back || {}, FB = ((D.companion || {}).flyer || {}).back || {}, hasPlan = !!D.plan, P = K.plan || {}, flyer = !!o.flyer, issues = [];
    const topId = flyer ? P.flyerTop : (P.back || [])[0] || (P.backNoplan || [])[0];
    const rowIds = flyer ? (P.pgFlyerBack || P.flyerBack || []).slice(0, 2) : (P.pgBackRow || P.backRow || ['bath2']).slice(0, 1), rowCards = FO.cards(D, rowIds);
    const TOP = Y0, CY = FO.CARD_Y, BOT = CY - 7 - G;
    const BX = KB.boxes || {}, SF = FXS.sellingFacts(D), c1 = ((BX.inside && BX.inside.items) || SF.inside.filter(t => !/^Built in|story|bedrooms|square feet/i.test(t))).slice(0, 6), c2 = ((BX.outside && BX.outside.items) || SF.outside).slice(0, 6), t1 = (BX.inside && BX.inside.title) || 'New and updated';
    const used = FO.cards(D, [topId].filter(Boolean).concat(rowIds));
    const stem = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), saysBox = a => [...c1, ...c2].some(t => { const bw = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !['new','a','the','and','of','with'].includes(w)).map(stem), xw = new Set((String(a).toLowerCase().match(/[a-z0-9'-]+/g) || []).map(stem)); return bw.length > 0 && bw.every(w => xw.has(w)); });
    const keep = list => { const k = list.filter(x => ![].concat(x).some(saysBox) && !used.some(c => (c.s || []).some(s => [].concat(s).some(b => [].concat(x).some(a => SW.sameFact(a, b)))))); return k.length >= 3 ? k : list; };
    const floors = FB.floors || [], isTop = f => f.top != null ? !!f.top : f.level === 2, f2 = [].concat(...floors.filter(isTop).map(f => f.s)), f1 = [].concat(...floors.filter(f => !isTop(f)).map(f => f.s));
    const hd = KB.pgHead || (hasPlan ? KB.plan : KB.noplan) || {}, pool = P.pool ? ` data-pool="${P.pool}"` : '', list = keep(f2.concat(f1));
    const TH = flyer ? 300 : 282;
    let h = '', top;
    // row 1: the plan (or the outdoor print) and the write-up tile; a plan too wide and short for that goes across the page with the tile under it
    let pc = hasPlan ? FO.planBox(D, 0, TOP, TH, 340) : null;
    if(pc && pc.bottom - TOP < 226){ pc = FXS.planCard(D, X0, TOP, CW, flyer ? 210 : 236); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues;
      const ay = pc.bottom + G, AH = flyer ? 120 : 126, hw = 196, tx = X0 + PAD, bx = tx + hw + 18, bw = X1 - PAD - bx;
      h += tileH('main', X0, ay, CW, AH) + FO.eb(hd.kicker || '', tx, ay + PAD - 2, hw, 'back.about.kicker', 'acc-main');
      const F = FO.hlFit(String(hd.title || 'Floor by floor').replace(/\.$/, ''), hw, 30, 20, 3), st = FO.stack(F.L, tx - F.s*0.02, ay + PAD + 18, F.s, 'back.about.title', 'on-main', hw + 16); h += st.html;
      const room = AH - 2*PAD + 6, n = Math.floor(room/15.5), lh = +(room/n).toFixed(3);
      h += FO.full(FO.wu(list, bx, ay + PAD - 3, bw, n*lh + 0.01, 'back.about', 10.8, lh, 'rev-body')).replace('data-slot="back.about"', `data-slot="back.about" data-span="${room.toFixed(2)}"${pool}`);
      top = ay + AH; }
    else { const leftW = pc ? pc.w : 330, px = flyer ? X1 - leftW : X0, ax = flyer ? X0 : X0 + leftW + G, aw = CW - leftW - G;
      if(pc){ pc = FO.planBox(D, px, TOP, TH, 340); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; top = pc.bottom; }
      else { const c = FXS.cardFor(D, topId); h += FO.print(D, c, px, TOP, leftW, TH, 3, 'back.top', {fs: 10.5, lh: 14}); top = TOP + TH; }
      h += aboutTile(D, ax, TOP, aw, top - TOP, hd, list, pool); }
    const y0 = top + G;
    if(flyer){
      // two prints in one locked row with Nearby as a dark column at the outer edge
      const NW = 200, n = rowCards.length, pw = (CW - NW - G - (n - 1)*G)/Math.max(1, n), RH0 = BOT - y0, PH0 = Math.min(RH0, Math.round(pw*0.95) + 72), LH = RH0 - PH0 - G >= 100 ? RH0 - PH0 - G : 0, PH = LH ? PH0 : RH0;
      rowCards.forEach((c, i) => { h += FO.print(D, c, X0 + i*(pw + G), y0, pw, PH, 3, 'back.photo' + i, {fs: 10.5, lh: 14}); });
      // a short plan row leaves height the prints cannot use without a sliver crop: the two lists go under them, side by side
      if(LH){ const lw2 = (CW - NW - 2*G)/2, ly = y0 + PH + G; h += listCell(t1, c1, X0, ly, lw2, LH, 'back.updates', 4).html + listCell('Outside', c2, X0 + lw2 + G, ly, lw2, LH, 'back.outside', 4).html; }
      h += nearCol(D, X1 - NW, y0, NW, RH0);
    } else {
      const NH = 56; h += nearStrip(D, X0, y0, CW, NH);
      const ry = y0 + NH + G, RH = BOT - ry, pw = 318, lx = X0 + pw + G, lw = X1 - lx;
      h += FO.print(D, rowCards[0], X0, ry, pw, RH, 3, 'back.photo1', {fs: 10.5, lh: 14});
      const pa = FXS.bullets(c1, 0, 0, lw - 24, 1, 'x', 5, 10).n, pb = FXS.bullets(c2, 0, 0, lw - 24, 1, 'x', 5, 10).n, each = (RH - 2*30)/(pa + pb), ha = Math.round(30 + pa*each), hb = RH - ha;
      h += listCell(t1, c1, lx, ry, lw, ha, 'back.updates', 5).html + listCell('Outside', c2, lx, ry + ha, lw, hb, 'back.outside', 5).html;
    }
    h += tileH('cell', X0, CY - 7, CW, FO.CARD_H + 14);
    h += FO.contact(D, X0 + 8, CY, CW - 16, FO.CARD_H) + FO.fine(D);
    return {html: h, issues};
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
    const seen = new Set(); return out.filter(i => { const k = i.slot + i.detail; if(seen.has(k)) return false; seen.add(k); return true; }); };
})();
