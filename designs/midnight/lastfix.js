/* LastFix (owner 11/10/2026: "no last line under 80% anywhere"): after a page is laid out, every write-up or caption whose last line runs
   under 80% of its width gets a small type step up (101% to 112% of its size, the same number of lines, tracking within +-0.02 em) that brings the last line to 80%+
   while the text keeps its box: no overflow, never more lines than the box holds, never under 8 pt. The words never change, and no
   word spacing is opened. A block no step can fix stays as it was (the print check reports it).
     LastFix.run(root, altMap)   root: the page (default document); altMap {slot: [other true wordings]} (data.copy.pc.alts) */
(function(){
  const SKIP = /^(agent|broker|contact|cc|oh)\.|fine|legal|disc|footer|address|^place$|\.place$|fact|stat|kicker|eyebrow|cta|slab\.big|price|logo|qr|pill|chip|tag\d*$|\.name$|title|head|label|size/i;
  const rows = el => { const rg = document.createRange(); rg.selectNodeContents(el); const out = [];
    for(const b of rg.getClientRects()){ if(b.width < .5) continue; const r = out.find(x => Math.abs(x.top - b.top) < b.height*.5);
      if(r){ r.l = Math.min(r.l, b.left); r.r = Math.max(r.r, b.right); } else out.push({top: b.top, l: b.left, r: b.right}); }
    return out.sort((a, b) => a.top - b.top); };
  const fill = el => { const R = rows(el); if(R.length < 2) return {n: R.length, k: 1};
    const cs = getComputedStyle(el), w = el.getBoundingClientRect().width - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    const last = R[R.length - 1]; return {n: R.length, k: (last.r - last.l)/Math.max(1, w)}; };
  const fits = (el, maxN, box) => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1 && (!box || box.scrollHeight <= box.clientHeight + 1);
  window.LastFix = {run(root, altMap, opts){
    root = root || document; altMap = altMap || {}; const T0 = performance.now();
    for(const el of root.querySelectorAll('[data-slot]')){
      if(performance.now() - T0 > 4000) break;
      const slot = el.dataset.slot || ''; if(SKIP.test(slot) || el.querySelector('[data-slot]') || el.closest('.cc, [data-small], [data-fine]')) continue;
      const t = el.textContent.trim(); if(t.split(/\s+/).length < 6 || getComputedStyle(el).whiteSpace === 'nowrap') continue;
      const f0 = fill(el), want = opts && opts.lines ? opts.lines(el) : 0;   // opts.lines(el): the line count a box must reach (a row of tiles)
      if(f0.n < 2 || (f0.k >= .8 && !(want && f0.n !== want) && fits(el, 99, el.closest('.cap, .cbk, .tile, .nbk, .pblock, .steps, .svc')))) continue;   // only a last line under 80% is touched
      const cs = getComputedStyle(el), fs0 = parseFloat(cs.fontSize), ls0 = el.style.letterSpacing, fsS = el.style.fontSize, maxN = want || +el.dataset.lines || f0.n + 1;
      const box = el.closest('.cap, .cbk, .tile, .nbk, .pblock, .steps, .svc'), wantN = n => n <= maxN && n >= (+el.dataset.min || +el.dataset.nmin || 2);
      // data-alts: other true wordings of the same line (the copy's own alternates); the first that sets with a full last line wins
      let alts = []; try { alts = JSON.parse(el.dataset.alts || '[]'); } catch(e) {} alts = alts.concat(altMap[slot] || []);
      const t0 = el.textContent, texts = [t0].concat(alts.filter(x => x && x !== t0));
      let best = null;
      const lh0 = el.style.lineHeight, refit = el.dataset.fillbox && window.NG && NG.fillOne;   // a box that fills to its foot sets each wording afresh
      for(const tx of texts){ el.textContent = tx; el.style.fontSize = fsS; el.style.letterSpacing = ls0; el.style.lineHeight = lh0; if(refit && tx !== t0) NG.fillOne(el);
        const fsT = parseFloat(getComputedStyle(el).fontSize);
        const g = fill(el); if(want && g.n !== want) continue;
        if(g.n >= 2 && g.k >= .82 && g.k <= 1.001 && wantN(g.n) && fits(el, maxN, box)){ best = {sc: 9, fs: fsT, ls: 0, tx, lh: el.style.lineHeight}; break; }
      for(const s of [1, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.10, 1.11, 1.12, .99, .98, .97])   // up first; at most 3% down (a smaller size can leave its box under-full)
        for(const ls of [0, .005, -.005, .01, -.01, .015, -.015, .02, -.02]){
          const fs = fsT*s; if(fs*72/96 < 8 - .01) continue;
          el.style.fontSize = fs + 'px'; el.style.letterSpacing = ls ? ls + 'em' : ls0;
          const f = fill(el); if(f.n !== g.n || !wantN(f.n) || f.k < .82 || f.k > 1.001 || !fits(el, maxN, box)) continue;
          const sc = -Math.abs(s - 1)*10 - (s < 1 ? .5 : 0) - Math.abs(ls)*50 - (f.n !== f0.n ? .3 : 0) + Math.min(f.k, .95);
          if(!best || sc > best.sc) best = {sc, fs, ls, tx, lh: el.style.lineHeight};
        }
        if(best) break; }
      if(best && best.tx !== t0 && /justify/.test(getComputedStyle(el).textAlign)) el.style.textAlign = 'left';   // another wording: set ragged, so no justified gap opens
      if(best){ el.textContent = best.tx; el.style.lineHeight = best.lh; el.style.fontSize = best.fs + 'px'; el.style.letterSpacing = best.ls ? best.ls + 'em' : ls0; el.dataset.lastfix = '1'; }
      else { el.textContent = t0; el.style.fontSize = fsS; el.style.letterSpacing = ls0; el.style.lineHeight = lh0; if(refit) NG.fillOne(el); }
    }
  }};
})();
