/* A labeled-items table (the "what's new" box and its kin: label over a short write-up, in a grid): every row runs the
   same number of full lines as the rest of its table, never one short row (the owner, 11/8/2026, FXS-09 r4 p5.6/p5.8:
   "Kitchen and Bath row has only one line ... make it two full lines so it matches every other row"; carried to every
   design with the same table layout).
   Runs on every render (renderer/render.py). The write-ups are the [data-slot] blocks named *.box.t<N>; the rows of one
   table share the slot prefix and page. A table fails when a row sets fewer lines than the most rows in it, or a row's
   last line is under 75% of the box (a two-line table: every row two full lines).
     TableRows.check() -> [{slot, kind:'box-row-short', detail}]   empty = passes */
(function(){
  function visible(el){ const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; }
  function lines(el){
    const rg = document.createRange(); rg.selectNodeContents(el);
    const L = [];
    for(const q of rg.getClientRects()){ if(q.width < 1 || q.height < 1) continue; const l = L.find(x => Math.abs(x.m - (q.top + q.bottom)/2) < q.height*0.5); if(l){ l.l = Math.min(l.l, q.left); l.r = Math.max(l.r, q.right); } else L.push({m: (q.top + q.bottom)/2, l: q.left, r: q.right}); }
    L.sort((a, b) => a.m - b.m);
    const box = el.getBoundingClientRect(), last = L[L.length - 1];
    return {n: L.length, fill: last ? (last.r - last.l)/box.width : 0};
  }
  function check(){
    const groups = new Map();
    for(const el of document.querySelectorAll('[data-slot]')){
      const m = /^(.*\.box)\.t\d+$/.exec(el.dataset.slot || ''); if(!m || !el.textContent.trim() || !visible(el)) continue;
      const page = el.closest('.page, [data-page], .pg, .panel') || document.body, k = page;
      if(!groups.has(k)) groups.set(k, new Map());
      const g = groups.get(k); if(!g.has(m[1])) g.set(m[1], []); g.get(m[1]).push(el);
    }
    const out = [];
    for(const g of groups.values()) for(const rows of g.values()){
      if(rows.length < 2) continue;
      const ms = rows.map(el => ({el, L: lines(el)})), most = Math.max(...ms.map(x => x.L.n));
      for(const x of ms){
        if(x.L.n < most) out.push({slot: x.el.dataset.slot, kind: 'box-row-short', detail: `${x.L.n} line(s) where the table's rows run ${most}`});
        else if(most >= 2 && x.L.fill < 0.75) out.push({slot: x.el.dataset.slot, kind: 'box-row-short', detail: `last line ${Math.round(x.L.fill*100)}% of the box`});
      }
    }
    return out;
  }
  window.TableRows = {check};
})();
