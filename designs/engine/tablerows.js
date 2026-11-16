/* A labeled-items table (the "what's new" box and its kin: label over a short write-up, in a grid): every row runs the
   same number of full lines as the rest of its table, never one short row (the owner, 11/8/2026, FXS-09 r4 p5.6/p5.8:
   "Kitchen and Bath row has only one line ... make it two full lines so it matches every other row"; carried to every
   design with the same table layout).
   Runs on every render (renderer/render.py). The write-ups are the [data-slot] blocks named *.box.t<N>; the rows of one
   table share the slot prefix and page. A table fails when a row sets fewer lines than the most rows in it, or a row's
   last line is under 75% of the box (a two-line table: every row two full lines), or (owner 11/8, FXS-28 kitchen box: "make each
   bullet longer ... so it fills at least 80% of the box width") any line of a row runs under 80% of its full column
   (box-line-short; a narrowed box is measured against its column before narrowing). Every line of a row, set ragged, runs
   80%+ of the column and the last line 90%+ (owner 11/8: write-ups every line 90%+, ideally justified; the justified box
   shows every line but the last edge to edge, so a justified box is measured as set ragged and wide word gaps fail too).
     TableRows.check() -> [{slot, kind:'box-row-short', detail}]   empty = passes */
(function(){
  function visible(el){ const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; }
  function lines(el){
    // justified text is measured as set ragged (its natural lines): justification must never hide a short line as wide word gaps
    const ta = el.style.textAlign; if(getComputedStyle(el).textAlign === 'justify') el.style.textAlign = 'left';
    try { return lines0(el); } finally { el.style.textAlign = ta; }
  }
  function lines0(el){
    const rg = document.createRange(); rg.selectNodeContents(el);
    const L = [];
    for(const q of rg.getClientRects()){ if(q.width < 1 || q.height < 1) continue; const l = L.find(x => Math.abs(x.m - (q.top + q.bottom)/2) < q.height*0.5); if(l){ l.l = Math.min(l.l, q.left); l.r = Math.max(l.r, q.right); } else L.push({m: (q.top + q.bottom)/2, l: q.left, r: q.right}); }
    L.sort((a, b) => a.m - b.m);
    const box = el.getBoundingClientRect(), last = L[L.length - 1];
    // the full column: a box the fitter narrowed (data-w0, in pt) still answers to its own column's width
    const full = el.dataset.w0 ? Math.max(box.width, +el.dataset.w0/0.75) : box.width;
    return {n: L.length, fill: last ? (last.r - last.l)/box.width : 0, min: L.length ? Math.min(...L.map(x => (x.r - x.l)/full)) : 0};
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
        // owner 11/8 (FXS-28 kitchen box p2): every line of every bullet runs at least 80% of its column, left to right
        // owner 11/9 (kitchen box full bullets review p2): a box the owner sent back to its earlier approved wording carries data-owner-kept and is not re-measured
        if(most >= 2 && x.L.n >= 2 && !x.el.dataset.ownerKept && (x.L.min < 0.795 || x.L.fill < 0.895)) out.push({slot: x.el.dataset.slot, kind: 'box-line-short', detail: `shortest line ${Math.round(x.L.min*100)}% (needs 80% set ragged), last line ${Math.round(x.L.fill*100)}% (needs 90%): ${x.el.textContent.trim().slice(0, 120)}${x.el.dataset.diag ? " [fit: " + x.el.dataset.diag + "]" : ""}`});
      }
    }
    return out;
  }
  window.TableRows = {check};
})();
