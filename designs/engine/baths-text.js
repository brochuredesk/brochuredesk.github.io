/* Bath wording in text (owner 11/1/2026 standing rule; _shared/baths.js is the rule). Loaded after baths.js by every design library.
   BD.bathPair(L) -> [number, label, extra line or ''] as plain text, for pieces that show the number over a label.
   The ½ is set at the row's own size (owner 11/1/2026, Round 4), so there is no wrapper any more. */
(function(){
  const BD = window.BD = window.BD || {};
  if(BD.bathsText) BD.bathPair = L => { const t = BD.bathsText(L), i = t.main.indexOf(' '); return [t.main.slice(0, i), t.main.slice(i + 1), t.half]; };
  // BD.bathCells(L) -> [[number, label], ...] for value/label cells: the baths cell, then a Half Baths cell when there are two or more
  if(BD.bathPair) BD.bathCells = L => { const p = BD.bathPair(L), c = [[p[0], p[1]]]; if(p[2]) c.push([p[2].split(' ')[0], p[2].split(' ').slice(1).join(' ')]); return c; };
})();
