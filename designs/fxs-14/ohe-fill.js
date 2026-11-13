/* Open House email write-up (owner's standing rule 11/8): at least as many lines as before, every line 90%+ of the column, justified
   (the last line too), word gaps never past 1.7x a normal space. Picks the sentences from the listing's own pool and the type size
   (never smaller than the base) that satisfy it; wraps the way the browser does (greedy). Needs the page's fonts loaded. */
window.OHEF = (function(){
  const BAN = /\b(?:daylight|generous(ly)?|no[\s-]+pressure|no[\s-]+obligation|free (home )?(value )?(estimate|evaluation)s?|rebuil(t|d)|master (bed(room)?|suite|bath|closet)s?|virtual(ly)?[\s-]+stag(ed|ing))\b/i;
  const cv = document.createElement('canvas').getContext('2d'), PT = 96/72;
  const pool = D => { const C = D.companion || {}; const m = ((C.postcard || {}).master || []).length ? C.postcard.master : String((C.listing || {}).body || '').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/); return m.map(t => String(t).trim()).filter(Boolean).filter(t => !BAN.test(t)); };
  const cache = new Map();
  const mw = (x, size) => { const k = size + '|' + x; let v = cache.get(k); if(v == null){ cv.font = `400 ${size*PT}px Montserrat`; v = cv.measureText(x).width; cache.set(k, v); } return v; };
  function wrap(text, size, w){
    const sp = mw(' ', size), W = w*PT, toks = [];
    text.split(/\s+/).forEach(x => [x].forEach((q, i) => toks.push({q, w: mw(q, size), glue: i > 0})));   // a hyphen is a break point with no space
    const rows = []; let cur = [], cw = 0;
    const push = () => { const spaces = cur.filter((t, j) => j > 0 && !t.glue).length; rows.push({sp: spaces, w: cw, ink: cur.reduce((a, t) => a + t.w, 0)}); };
    toks.forEach(t => { const nw = cur.length ? cw + (t.glue ? 0 : sp) + t.w : t.w; if(cur.length && nw > W){ push(); cur = [t]; cw = t.w; } else { cur.push(t); cw = nw; } });
    if(cur.length) push();
    return rows.map(r => ({fill: r.w/W, gap: r.sp > 0 ? (W - r.ink)/(r.sp*sp) : 99}));
  }
  // D: page data; w: column pt; base: base type pt; lh: base line height pt; minLines: never fewer lines than this
  // the exact lines as the browser sets them (justified): per line the fill and the word gap
  function domRows(text, size, lh, w){
    const m = document.createElement('div'); m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;font:400 ${size}pt/${lh}pt Montserrat;text-align:justify;text-align-last:justify`;
    m.textContent = text; document.body.appendChild(m);
    const tn = m.firstChild, rg = document.createRange(), re = /\S+/g, rows = []; let q;
    cv.font = `400 ${size*PT}px Montserrat`; const sp = cv.measureText(' ').width, W = m.getBoundingClientRect().width;
    while((q = re.exec(text))){ rg.setStart(tn, q.index); rg.setEnd(tn, q.index + q[0].length); const r = rg.getClientRects()[0]; if(!r) continue;
      const l = rows.find(x => Math.abs(x.top - r.top) < 3); if(l){ l.n++; l.ink += r.width; l.l = Math.min(l.l, r.left); l.r = Math.max(l.r, r.right); } else rows.push({top: r.top, n: 1, ink: r.width, l: r.left, r: r.right}); }
    m.remove();
    // a justified line's words already span the box: judge by the natural (unjustified) width: ink + (n-1) normal spaces
    return rows.map(r => ({fill: (r.ink + (r.n - 1)*sp)/W, gap: r.n > 1 ? (W - r.ink)/((r.n - 1)*sp) : 99}));
  }
  function write(D, w, base, lh, minLines, maxLines){
    const P = pool(D), cands = [];
    for(const [k0, step, span] of [[14, .25, 3], [11, .05, 5]]){
      const k = Math.min(P.length, k0);
      for(let s = base; s <= base + span + .01; s += step) for(let mask = 1; mask < (1 << k); mask++){
        const text = P.filter((_, i) => i < k && mask & (1 << i)).join(' '), rows = wrap(text, s, w);
        if(rows.length < minLines || rows.length > maxLines) continue;
        const worst = Math.max(...rows.map(r => r.gap)), low = Math.min(...rows.map(r => r.fill));
        if(worst <= 1.7 && low >= .9) cands.push({text, size: s, score: -worst*1000 + rows.length*10 + s});
      }
    }
    cands.sort((a, b) => b.score - a.score);
    let best = null;
    for(const c of cands.slice(0, 120)){
      const lhs = lh*c.size/base, rows = domRows(c.text, c.size, lhs, w);
      if(rows.length < minLines || rows.length > maxLines) continue;
      const worst = Math.max(...rows.map(r => r.gap)), low = Math.min(...rows.map(r => r.fill));
      if(!best || worst < best.worst) best = {text: c.text, n: rows.length, size: c.size, lh: lhs, ok: worst <= 1.7 && low >= .9, worst, low};
      if(best.ok) break;
    }
    return best || {text: '', n: 0, size: base, lh, ok: false, worst: 99, low: 0};
  }
  return {write};
})();
