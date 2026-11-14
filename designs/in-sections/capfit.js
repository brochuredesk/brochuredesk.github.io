/* CapFit: text under a photo fills the photo's width (owner 11/8/2026, standing rule, every design and piece).
   After a page is laid out, every caption or write-up set under a photo is fitted so that each line, set ragged, runs 80%+ of the width
   and the last line runs 90%+ where the words allow; it is then justified, so its right edge lines up under the photo. The text never
   changes and the box never narrows: the type steps up a fraction of a point at a time (never more than 12%) at the same line count,
   which keeps the space the design gave it. A caption that no size fills stays left aligned (justifying short lines opens ugly gaps);
   the caption-line-short check then reports it and the sample copy needs a fuller true line.
     CapFit.run(root?)   fits every photo caption on the page; returns [{slot, scale, last, min, ok}]   */
(function(){
  const PT = 96 / 72, SKIP = /logo|headshot|portrait|plan|map|qr|badge|icon|signature/i;
  const LABEL = /(label|name|title|kicker|size|heading|head|lbl|\.q|address|place|addr|headline|location|\.h)$/i;
  const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity !== 0; };
  const skipped = el => { for(let p = el; p && p !== document.body; p = p.parentElement){
    if(SKIP.test(p.className && p.className.baseVal != null ? p.className.baseVal : p.className || '') || SKIP.test((p.dataset && p.dataset.slot) || '')) return true;
    if(p.classList && [...p.classList].some(c => /^cc(-|$)/.test(c))) return true; } return false; };
  const clipRect = el => { const r0 = el.getBoundingClientRect(); let l = r0.left, t = r0.top, rr = r0.right, b = r0.bottom;
    for(let p = el.parentElement; p && p !== document.body; p = p.parentElement){ const cs = getComputedStyle(p); if(!/(hidden|clip)/.test(cs.overflow + cs.overflowX + cs.overflowY)) continue;
      const q = p.getBoundingClientRect(); l = Math.max(l, q.left); t = Math.max(t, q.top); rr = Math.min(rr, q.right); b = Math.min(b, q.bottom); }
    return {left: l, top: t, right: rr, bottom: b, width: Math.max(0, rr - l), height: Math.max(0, b - t)}; };
  function lineBoxes(el){
    const rg = document.createRange(), rs = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while(w.nextNode()){ const n = w.currentNode; if(!n.textContent.trim() || !visible(n.parentElement)) continue;
      const re = /\S+/g; let m; while((m = re.exec(n.textContent))){ rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length); for(const r of rg.getClientRects()) if(r.width > .5 && r.height > .5) rs.push(r); } }
    const lines = []; for(const r of rs){ const m = (r.top + r.bottom) / 2, l = lines.find(x => Math.abs(x.m - m) < r.height * .5); if(l){ l.l = Math.min(l.l, r.left); l.r = Math.max(l.r, r.right); } else lines.push({m, l: r.left, r: r.right}); }
    return lines.sort((a, b) => a.m - b.m);
  }
  function targets(){
    const ph = [];
    const add = (el, src) => { if(!visible(el) || SKIP.test(String(src || '').split(/[\\/]/).pop()) || skipped(el)) return; const r = clipRect(el); if(r.width < 60 * PT || r.height < 45 * PT) return; ph.push({el, r, page: el.closest('.page, [data-page], .pg') || document.body}); };
    for(const im of document.querySelectorAll('img')) add(im, im.getAttribute('src'));
    for(const el of document.querySelectorAll('[style*="background-image"]')){ const bg = getComputedStyle(el).backgroundImage; if(bg && bg !== 'none' && !el.querySelector('img')) add(el, bg); }
    const photos = ph.filter(p => !ph.some(q => q !== p && q.el.contains(p.el)));
    const out = [];
    for(const el of document.querySelectorAll('[data-slot]')){
      if(!visible(el) || el.querySelector('[data-slot]') || skipped(el) || !el.textContent.trim() || photos.some(p => p.el.contains(el))) continue;
      const slot = el.dataset.slot || ''; if(LABEL.test(slot)) continue;
      const r = el.getBoundingClientRect(), c = (r.left + r.right) / 2, page = el.closest('.page, [data-page], .pg') || document.body;
      let best = null;
      for(const p of photos){ if(p.page !== page || !(c > p.r.left && c < p.r.right) || r.width > p.r.width + 14 * PT || r.width < p.r.width * .5 || r.top < p.r.bottom - 2 * PT) continue;
        if(r.top - p.r.bottom > 45 * PT) continue; if(!best || p.r.bottom > best.r.bottom) best = p; }
      if(best) out.push({el, photo: best});
    }
    return out;
  }
  // (11/10/2026: words of three letters count too, so "pot filler" and "gas" are caught: an extra line never repeats what the caption says)
  const STOP = new Set('with that this from have been over under into onto their there which where while along also each both only more most than then them they your your what when will back justside about around beside between behind above below the and has are its for was but not you all can any out off per via one sits room'.split(' '));
  const words = t => new Set((String(t).toLowerCase().match(/[a-z]{3,}/g) || []).filter(w => !STOP.has(w)));
  const shared = (a, b) => { let n = 0; for(const w of a) if(b.has(w)) n++; return n; };
  const sentences = t => String(t).trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
  // sets the caption to `text` at `scale` and reads its lines
  function read(el, text, fs0, s, ls){ if(el.__txt !== text){ el.textContent = text; el.__txt = text; } el.style.fontSize = (fs0 * s) + 'px'; el.style.letterSpacing = (ls || 0) + 'em'; return lineBoxes(el); }
  function score(L, n0, box){
    if(L.length !== n0) return null;
    const f = L.map(x => (x.r - x.l) / box), last = f[f.length - 1], min = Math.min(...f.slice(0, -1));
    if(min < 0.74 || last < 0.8) return null;
    return {last, min, v: (last >= 0.9 && min >= 0.86 ? 1000 : last >= 0.85 && min >= 0.8 ? 600 : 300) + last * 100 + min * 10};
  }
  // word gaps by line: a ragged layout gives the normal space, the justified one the widest gap on any line above the last
  function wordGaps(el){
    const rg = document.createRange(), rows = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while(w.nextNode()){ const n = w.currentNode; const re = /\S+/g; let m; while((m = re.exec(n.textContent))){ rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length); const q = rg.getClientRects()[0]; if(q) rows.push(q); } }
    const lines = []; for(const r of rows){ const l = lines.find(x => Math.abs(x.m - (r.top + r.bottom) / 2) < r.height * .5); if(l) l.w.push(r); else lines.push({m: (r.top + r.bottom) / 2, w: [r]}); }
    return lines.sort((a, b) => a.m - b.m).map(l => l.w.sort((a, b) => a.left - b.left).slice(1).map((r, i) => r.left - l.w[i].right));
  }
  function gapsTooWide(el, maxX){
    const j = el.style.textAlign; el.style.textAlign = 'left'; const rag = wordGaps(el).flat(); el.style.textAlign = j;
    const space = rag.length ? Math.min(...rag) : 0; if(space <= .5) return false;
    const g = wordGaps(el); return g.slice(0, -1).some(l => l.length && Math.max(...l) > space * (maxX || 2.0));
  }
  function fit(el, pool, onPage, forceT){
    if(el.__orig0 != null){ el.textContent = el.__orig0; el.style.fontSize = el.__fs0 + 'px'; el.style.letterSpacing = ''; el.style.textAlign = 'left'; } else { el.__orig0 = el.textContent.trim(); el.__fs0 = parseFloat(getComputedStyle(el).fontSize); }
    const cs = getComputedStyle(el), fs0 = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) || fs0 * 1.4;
    el.style.maxWidth = ''; el.style.textAlign = 'left'; el.style.lineHeight = lh + 'px';
    const orig = el.textContent.trim(); el.__txt = null;
    el.style.fontSize = fs0 + 'px';
    const base = lineBoxes(el); if(base.length < 1) return null;
    const box = el.getBoundingClientRect().width, nB = base.length, lastB = (base[nB - 1].r - base[nB - 1].l) / box, cpl0 = orig.length / (nB - 1 + lastB);
    const cap = el.style.height ? Math.round(el.clientHeight / lh + 0.02) : 0;   // a box the design gave a fixed height (lines): the text fills all of them
    const Ts = forceT ? [forceT] : cap > nB ? [cap, nB] : [nB]; if(nB < 2 && Ts.length < 2) return null;
    let best = null;
    for(const T of Ts){
      const LS = [0, 0.006, -0.006, 0.012, -0.012, 0.02, -0.02, 0.03];   // tracking in em: a hair either way, never visible, but it moves the line breaks
      const tryText = (text, sLo, sHi) => {
        for(let s = sLo; s <= sHi + 1e-9; s += 0.0066) for(const ls of LS){ if(s < 1 && fs0 * s * 0.75 < 8) continue; const sc = score(read(el, text, fs0, s, ls), T, box); if(!sc) continue;
          const v = sc.v - Math.abs(s - 1) * 150 - Math.abs(ls) * 600 - (text === orig ? 0 : 40); if(!best || v > best.v) best = {v, s, ls, text, last: sc.last, min: sc.min}; if(sc.last >= 0.9 && sc.min >= 0.86 && text === orig && ls === 0) return true; }
        return false;
      };
      if(T === nB) tryText(orig, 0.96, 1.12);   // 1: the written caption itself, type from -4% to +12%
      // 2: whole sentences from the caption plus the listing's other true lines about the same photo (a neighbor may not take the same fact)
      if(!best || best.last < 0.9 || best.min < 0.86){
        const own = sentences(orig), ownW = words(orig), extra = (pool || []).filter(x => !own.includes(x) && !/\b(generous(ly)?|spacious|plenty|daylight|natural light|perfect|ideal|boasts?|nestled|stunning)\b/i.test(x) && shared(words(x), ownW) < 2 && !onPage.some(w => shared(words(x), w) >= 4)).slice(0, 8);
        const all = own.concat(extra).slice(0, 10), n = all.length, cands = [], W = all.map(words);
        for(let m = 1; m < (1 << n); m += (own.length ? 2 : 1)){   // the written opening sentence always stays (bit 0): true lines are added after it, never in its place
          let t = '', c = 0; const pick = []; for(let i = 0; i < n; i++) if(m & (1 << i)){ pick.push(i); t += (t ? ' ' : '') + all[i]; c++; }
          if(c > 6 || t === orig) continue;
          let dupe = false; for(let a = 0; a < pick.length && !dupe; a++) for(let b2 = a + 1; b2 < pick.length; b2++) if((pick[b2] >= own.length || pick[a] >= own.length) && shared(W[pick[a]], W[pick[b2]]) >= 2){ dupe = true; break; }
          if(dupe) continue;   // two lines about the same thing in one caption
          const lo = (T - 0.1) * cpl0 / 1.12 * 0.97, hi = (T * cpl0) / 0.96;
          if(t.length < lo || t.length > hi) continue;
          let near = 0; for(const i of pick) if(i < own.length) near++;
          cands.push({t, d: Math.abs(t.length - (T - 0.05) * cpl0) + (own.length - near) * 12 + (pick.length - near) * 6});
        }
        cands.sort((a, b) => a.d - b.d); el.__diag = `T ${T} pool ${(pool||[]).length} extra ${extra.length} cands ${cands.length} nB ${nB} cpl ${Math.round(cpl0)} len ${orig.length}`;
        for(const c of cands.slice(0, 14)){
          const sEst = Math.min(1.12, Math.max(0.94, (T - 0.05) * cpl0 / c.t.length));
          if(tryText(c.t, Math.max(0.94, sEst - 0.03), Math.min(1.12, sEst + 0.03)) && best && best.last >= 0.9) break;
        }
      }
      if(best) break;
    }
    if(!best){ el.textContent = orig; el.__txt = orig; el.style.fontSize = fs0 + 'px'; el.style.letterSpacing = ''; return {slot: el.dataset.slot, scale: 1, ok: false, diag: el.__diag || ''}; }
    el.textContent = best.text; el.style.fontSize = (fs0 * best.s) + 'px'; el.style.letterSpacing = best.ls + 'em'; el.style.textAlign = 'justify'; el.dataset.capfit = '1';
    if(gapsTooWide(el)){ el.style.textAlign = 'left'; el.dataset.capragged = '1'; }   // justifying would spread words past about 2x a normal space: set ragged (owner 11/12; the line-fill checks still apply)
    return {slot: el.dataset.slot, scale: +best.s.toFixed(3), last: +best.last.toFixed(2), min: +best.min.toFixed(2), ok: true, extended: best.text !== orig};
  }
  // extra: {photoId: [true lines]} (the listing's other facts about each photo; D.copy.extra in the sample data)
  window.CapFit = { gapsTooWide, run: extra => {
    const T = targets(), res = [];
    const onPageFor = el => [...document.querySelectorAll('[data-slot]')].filter(e => e !== el && !e.querySelector('[data-slot]') && e.textContent.trim().length > 25).map(e => words(e.textContent));
    const idOf = t => { const ph = t.photo.el.closest('[data-photo]'); return ph && ph.dataset.photo; };
    const pre = new Map(T.map(t => [t, lineBoxes(t.el).length]));
    for(const t of T){ const id = idOf(t); const r = fit(t.el, id && extra ? extra[id] : null, onPageFor(t.el), 0); if(r){ r.id = id; r.t = t; res.push(r); } }
    // captions side by side keep the same number of lines: the shorter ones are refitted to the longest (more true facts, same width)
    const rows = {};
    for(const t of T){ const k = Math.round(t.photo.r.top / 4) + '|' + (t.photo.page.dataset.page || t.photo.page.className || ''); (rows[k] = rows[k] || []).push(t); }
    for(const k in rows){ const g = rows[k].filter(t => pre.get(t) >= 2); if(g.length < 2) continue;
      const ns = g.map(t => lineBoxes(t.el).length), p0 = g.map(t => pre.get(t)), mx = Math.max(...ns);
      if(Math.min(...ns) === mx || Math.min(...p0) !== Math.max(...p0)) continue;   // only rows whose captions matched before the fit and no longer do: the shorter ones take more true facts
      g.forEach((t, i) => { if(ns[i] < mx){ const id = idOf(t); const r = fit(t.el, id && extra ? extra[id] : null, onPageFor(t.el), mx); if(r){ r.id = id; r.row = true; res.push(r); } } }); }
    res.forEach(r => { delete r.t; });
    window.__capFit = res; return res; }, lineBoxes };
})();
