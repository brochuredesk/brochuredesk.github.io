/* fxs-11: the write-up measure sets hyphenated words ("three-phase", "two-car") unbreakable, as the page does after layout
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
// the write-up pool for every OH page that draws one (email, socials): no drive-time lines; agents' opens lead with what agents tell buyers
(function(){
  if(!window.OHL || !OHL.writeup) return;
  const orig = OHL.writeup, drive = /minutes|miles|short drive|drive away|drive from|are close|is close/i, draw = /gated|roof|garage|deck|pergola|stone|island|corner/i;
  OHL.writeup = function(D, ...a){
    const C = D.companion || {}, P = C.postcard || {};
    if(P.master && !P.__ok){ const kind = (D.openHouse || {}).kind || 'public'; let M = P.master.filter(t => !drive.test(t)); if(kind !== 'public') M = M.filter(t => draw.test(t)).concat(M.filter(t => !draw.test(t))); P.master = M; P.__ok = true; }
    return orig.call(this, D, ...a);
  };
})();
