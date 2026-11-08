/* fxs-09: the write-up measure sets hyphenated words ("three-phase", "two-car") unbreakable, as the page does after layout
   (fxpage.js: a word with a hyphen never breaks at it), so the line counts it picks are the lines the page really sets. */
(function(){
  if(!window.OHL || !OHL.measure) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  OHL.measure = (cls, text, w, lh) => {
    const m = document.createElement('div');
    m.className = cls; m.innerHTML = esc(text).replace(/\S*\w-\w\S*/g, t => `<span style="white-space:nowrap">${t}</span>`);
    m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;height:auto;white-space:normal;overflow:visible`;
    document.body.appendChild(m);
    const r = document.createRange(); r.selectNodeContents(m);
    const rows = [];
    [...r.getClientRects()].filter(q => q.width > .5).forEach(q => { const l = rows.find(x => Math.abs(x.top - q.top) < 4); if(l){ l.l = Math.min(l.l, q.left); l.r = Math.max(l.r, q.right); } else rows.push({top: q.top, l: q.left, r: q.right}); });
    const box = m.getBoundingClientRect().width; m.remove();
    rows.sort((a, b) => a.top - b.top);
    const last = rows[rows.length - 1];
    return {n: rows.length, fill: last && box ? (last.r - last.l)/box : 0};
  };
})();
(function(){
  const STOP = /^(a|an|the|and|of|to|is|are|in|on|with|it|its|has|have|at|as|by|for|from|into|that|this|there|their|up|out|one|two|three)$/;
  const GENERIC = new Set(['house', 'home', 'room', 'rooms', 'living', 'dining', 'floor', 'floors', 'level', 'kitchen', 'bedroom', 'ceilings', 'ceiling', 'high', 'new', 'large', 'wood', 'area', 'space', 'second', 'first', 'third', 'fourth', 'primary', 'suite', 'bath', 'door', 'doors', 'windows', 'window', 'natural', 'light']);
  const toks = s => String(s).toLowerCase().replace(/[^a-z0-9' -]/g, ' ').split(/\s+/).filter(w => w && !STOP.test(w));
  window.__phraseRepeat = sents => {
    const seen = [];
    for(const s of sents){ const t = toks(s), bg = new Set();
      for(let i = 0; i + 1 < t.length; i++){ if(GENERIC.has(t[i]) && GENERIC.has(t[i + 1])) continue; if(GENERIC.has(t[i]) || GENERIC.has(t[i + 1])) { if(!(t[i].length > 4 && t[i + 1].length > 4)) continue; } bg.add(t[i] + ' ' + t[i + 1]); }
      for(const o of seen) for(const b of bg) if(o.has(b)) return b;
      seen.push(bg); }
    return '';
  };
})();
// the write-up pool for every OH page that draws one (email, socials): no drive-time lines; agents' opens lead with what agents tell buyers
(function(){
  if(!window.OHL || !OHL.writeup) return;
  const orig = OHL.writeup, drive = /minutes|miles|short drive|drive away|drive from|are close|is close/i, draw = /gated|roof|garage|deck|pergola|stone|island|corner/i;
  OHL.writeup = function(D, ...a){
    const C = D.companion || {}, P = C.postcard || {};
    if(P.master && !P.__ok){ const kind = (D.openHouse || {}).kind || 'public'; let M = P.master.filter(t => !drive.test(t)); if(kind !== 'public') M = M.filter(t => draw.test(t)).concat(M.filter(t => !draw.test(t))); const key = t => String(t).toLowerCase().replace(/[^a-z0-9' -]/g, ' ').split(/\s+/).filter(w => w && !/^(a|an|the|and|of|to|is|are|in|on|with|it)$/.test(w));
      const keep = []; M.forEach(t => { if(!(window.__phraseRepeat(keep.concat([t])))) keep.push(t); }); M = keep.length ? keep : M;   // no sentence says what an earlier one did
      P.master = M; P.__ok = true; }
    return orig.call(this, D, ...a);
  };
})();
