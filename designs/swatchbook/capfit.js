/* Caption fill (owner 11/8/2026): a caption set under a photo runs every line at least 80% of the photo's width, the last line too
   (ideally 90%). Same lines, same box. Copy is never shortened. In order:
     1. the type steps up (at most 12%) and, as a last resort, tracking opens a hair (at most .025em), until every line reaches 80%+;
     2. a caption that carries extra true sentences (data-x, a JSON list) may take some of them in place of others: whole sentences
        that fill the same number of lines honestly (the first sentence always stays);
     then the caption is justified. A caption that cannot fill stays as it was (left aligned) and the check reports it.
     CapFit.run(elements, refWidth)   refWidth(el): the width the lines are measured against (default: the element's own width; a caption
     inside a padded block measures against the photo above it) */
(function(){
  const lineStats = el => {
    const rg = document.createRange(), rs = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while(w.nextNode()){ const n = w.currentNode, re = /\S+/g; let m;
      while((m = re.exec(n.textContent))){ rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length); for(const r of rg.getClientRects()) if(r.width > .5 && r.height > .5) rs.push(r); } }
    const lines = [];
    for(const r of rs){ const mid = (r.top + r.bottom) / 2, l = lines.find(x => Math.abs(x.m - mid) < r.height * .5);
      if(l){ l.l = Math.min(l.l, r.left); l.r = Math.max(l.r, r.right); l.n++; } else lines.push({m: mid, l: r.left, r: r.right, n: 1}); }
    return lines.sort((a, b) => a.m - b.m);
  };
  const SIZES = [1, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.10, 1.11, 1.12], TRACK = [0, .005, .01, .015, .02, .025], WORD = [0];   // no extra word spacing: big word gaps are out (owner 11/10, rule 8)
  // accepted: the last line 80%+ and every other line 68%+ (they are justified out to the full width); score: the last line's fill, a bonus when every other line is 80%+ too
  // owner 11/10 (rule 8): justified only while the word gaps stay small (under ~2.5x a space, as printchecks word-gap-wide measures them)
  const acc = e => { const L = e.pcts, last = L[L.length - 1], inner = Math.min(...L.slice(0, -1)); return last >= .8 && inner >= .8 && (e.gap || 1) <= 2.5 ? last + (inner >= .93 ? .3 : inner * .3) : 0; };
  const words = t => new Set((String(t).toLowerCase().match(/[a-z]{5,}/g) || []).map(w => w.replace(/s$/, '')));
  const sents = t => (String(t).match(/(?:[^.!?]|\.(?=\d))+[.!?]+["”’)]*|(?:[^.!?]|\.(?=\d))+$/g) || []).map(x => x.trim()).filter(Boolean);
  const CTX = document.createElement('canvas').getContext('2d');
  window.CapFit = {run(els, refWidth){
    // two passes: a caption that grows can move its column's width, so the second pass settles every caption against the final layout
    els = [...els]; const T0 = performance.now(), late = () => performance.now() - T0 > 9000;   // a time budget: the render waits 30 s for the page
    for(const pass of [1, 2]) for(const el of els){
      if(pass === 2 && el.dataset.capfit === 'none' && el.dataset.capw == el.clientWidth) continue;
      if(pass === 2 && el.dataset.capfit && el.dataset.capfit !== 'none' && el.dataset.capw == el.clientWidth) continue;
      if(el.dataset.caporig === undefined){ el.dataset.caporig = el.innerHTML; el.dataset.capst = JSON.stringify([el.style.maxWidth, el.style.fontSize, el.style.letterSpacing, el.style.textAlign]); }
      else { const st = JSON.parse(el.dataset.capst); el.innerHTML = el.dataset.caporig; [el.style.maxWidth, el.style.fontSize, el.style.letterSpacing, el.style.textAlign] = st; el.style.wordSpacing = ''; }
      const ref = () => (refWidth ? refWidth(el) : el.clientWidth);
      const keep = {mw: el.style.maxWidth, fs: el.style.fontSize, ls: el.style.letterSpacing, ta: el.style.textAlign, html: el.innerHTML};
      el.style.maxWidth = ''; if(!el.clientWidth) continue;
      const fs0 = parseFloat(getComputedStyle(el).fontSize); el.style.textAlign = 'left';
      // gap: the widest word gap once a line above the last is justified out to the width, in normal spaces (measured like printchecks word-gap-wide)
      const ev = () => { const L = lineStats(el), W = ref(), cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
        CTX.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`; const sp = CTX.measureText(' ').width + (parseFloat(cs.letterSpacing) || 0);
        const gap = Math.max(1, ...L.slice(0, -1).map(x => { if(x.n < 2) return 9; const g = sp + (el.getBoundingClientRect().left + W - x.r) / (x.n - 1); return (g / sp > 2.5 && g - sp > .42 * fs) ? g / sp : Math.min(g / sp, 2.4); }));
        return {n: L.length, pcts: L.map(x => (x.r - x.l) / W), gap, over: el.scrollHeight > el.clientHeight + 1}; };
      const base = ev(); if(base.n < 2){ el.style.maxWidth = keep.mw; el.style.textAlign = keep.ta; continue; }
      const search = () => { let best = null;
        outer: for(const wd of WORD) for(const t of TRACK) for(const s of SIZES){
          if(late() || (best && best.mn >= 1.18)) break outer;
          el.style.fontSize = (fs0 * s) + 'px'; el.style.letterSpacing = t ? t + 'em' : ''; el.style.wordSpacing = wd ? wd + 'em' : '';
          const e = ev(); if(e.n !== base.n || e.over) continue;
          const mn = acc(e); if(!mn) continue;
          const score = mn * 100 - (s - 1) * 40 - t * 2000 - wd * 300;
          if(!best || score > best.score) best = {score, s, t, wd, mn};
        } return best; };
      let best = search(), via = 'size';
      if(!best && el.dataset.x && !late()){
        // whole sentences, same line count
        let extra = []; try { extra = JSON.parse(el.dataset.x); } catch(e) {}
        const orig = sents(el.textContent), pool = orig.concat(extra.filter(x => !orig.includes(x))).slice(0, 11);
        el.style.fontSize = ''; el.style.letterSpacing = ''; el.style.wordSpacing = '';
        el.textContent = pool.join(' ');
        const A = lineStats(el), allLen = pool.join(' ').length, lastW = A.length ? (A[A.length-1].r - A[A.length-1].l) / el.clientWidth : 1;
        // the first sentence stays, unless the caption is one long sentence
        const ow = words(orig.join(' ')); const cpl = allLen / Math.max(.5, A.length - 1 + lastW), cand = [], k = pool.length;
        for(let m = 1; m < (1 << k); m += (orig.length > 1 ? 2 : 1)){ const pick = []; for(let i = 0; i < k; i++) if(m >> i & 1) pick.push(pool[i]);
          const len = pick.join(' ').length / cpl; if(len < base.n - 1 + .8 || len > base.n - 1 + 1.02) continue;
          if(pick.join(' ').length < orig.join(' ').length) continue;   // never shorter than the caption it replaces (owner 11/10/2026)
          cand.push({pick, kept: pick.filter(p => orig.includes(p)).length, len, cover: [...ow].filter(w => words(pick.join(' ')).has(w)).length / Math.max(1, ow.size)}); }
        cand.sort((a, b) => b.kept - a.kept || b.cover - a.cover || Math.abs(a.len - base.n + .1) - Math.abs(b.len - base.n + .1));
        let found = null;
        for(const sc of [1, 1.04, 1.08, 1.12]){ el.style.fontSize = (fs0 * sc) + 'px';
          for(const c of cand.slice(0, 60)){ if(late()) break; el.textContent = c.pick.join(' '); const e = ev(); if(e.n !== base.n || e.over) continue;
            const mn = acc(e); if(mn && (!found || mn > found.mn + .04)){ found = {pick: c.pick, mn, sc}; if(mn >= 1.15) break; } }
          if(found) break; }
        if(found){ el.textContent = found.pick.join(' '); best = {s: found.sc, t: 0, mn: Math.min(1, found.mn)}; via = 'sentences'; }
        else el.innerHTML = keep.html;
      }
      if(best){ el.style.fontSize = (fs0 * best.s) + 'px'; el.style.letterSpacing = best.t ? best.t + 'em' : ''; el.style.wordSpacing = best.wd ? best.wd + 'em' : ''; el.style.textAlign = 'justify'; el.dataset.fixed = '1'; el.dataset.capfit = via + '/' + best.s + '/' + best.t + '/' + Math.round(best.mn * 100); }
      else { el.style.maxWidth = keep.mw; el.style.fontSize = keep.fs; el.style.letterSpacing = keep.ls; el.style.wordSpacing = ''; el.style.textAlign = keep.ta; el.dataset.capfit = 'none'; }
      el.dataset.capw = el.clientWidth;
    }
  }};
})();
