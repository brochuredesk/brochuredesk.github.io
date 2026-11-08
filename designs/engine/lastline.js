/* Every piece of text that wraps has its last line at least 3/4 full. The owner, 10/30/2026, standing rule 1 (write-ups),
   widened 11/2/2026 to everything: "whenever text runs to a second, third or later line, the last line must be at least
   three-quarters full" (paragraphs, bullets, captions). Runs on every render (renderer/render.py, beside FactRepeat).
   A text block is a [data-slot] element with no [data-slot] inside it that wraps to 2 lines or more. What an agent types
   into the event box (oh.refreshments, oh.note), fact rows, addresses and fine print are not checked. The last line's
   width is measured against the box's own width (or the longest line, for centered text set narrower than its box).
     LastLine.check() -> [{slot, kind: 'last-line-short', detail}]   empty = passes
   A failing block goes back to the writer (renderer back_to_writer) to add or cut a few words; the renderer never pads
   copy. Base file: oh-email-r3-10-31 (10/30 write-up rule); merge keeps this wider version. */
(function(){
  const MIN = 0.75;
  const SKIP = /^(oh\.(refreshments|note|label|date|time|day)|fine|disclaimer|address|place|fact|.*\.(facts|stats))/;
  const lines = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const rows = [];
    [...r.getClientRects()].forEach(b => {
      if(b.width < .5) return;
      // same line when the boxes overlap by over half the shorter one: a smaller run set on the same baseline (a room size
      // beside its name, 11/3) starts lower but is still that line; wrapped lines don't overlap that much
      const row = rows.find(x => Math.min(x.bottom, b.bottom) - Math.max(x.top, b.top) > Math.min(x.bottom - x.top, b.height)*.5);
      if(row){ row.left = Math.min(row.left, b.left); row.right = Math.max(row.right, b.right); row.top = Math.min(row.top, b.top); row.bottom = Math.max(row.bottom, b.bottom); }
      else rows.push({top: b.top, bottom: b.bottom, left: b.left, right: b.right});
    });
    return rows.sort((a, b) => a.top - b.top);
  };
  function check(){
    const out = [];
    document.querySelectorAll('[data-slot]').forEach(el => {
      const slot = el.dataset.slot || '';
      if(SKIP.test(slot) || el.querySelector('[data-slot]') || el.closest('.cc') || el.closest('[data-small],[data-fine]')) return;
      const t = (el.textContent || '').trim();
      if(t.split(/\s+/).length < 3) return;
      const cs = getComputedStyle(el);
      if(cs.visibility === 'hidden' || cs.display === 'none') return;
      const rows = lines(el);
      if(rows.length < 2) return;
      const box = el.getBoundingClientRect(), pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0;
      const full = Math.max(box.width - pl - pr, 1), widest = Math.max(...rows.map(r => r.right - r.left));
      const ref = /center/.test(cs.textAlign) ? Math.min(full, widest) : full;
      const last = rows[rows.length - 1], k = (last.right - last.left)/ref;
      if(k < MIN - .005) out.push({slot, kind: 'last-line-short', detail: `last line is ${Math.round(k*100)}% full (75% minimum): "${t.split(/\s+/).slice(-4).join(' ')}"`});
    });
    return out;
  }
  window.LastLine = {check, MIN};
})();
