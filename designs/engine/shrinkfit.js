/* Text shrinks to fit (the owner, 10/29/2026, every piece of every design; replaces "never shrink type to fit"), and all text
   grows back up to 10 pt when it doesn't fill its box (10/30/2026: the size moves both ways to fill the space).
   Runs on every render (renderer/render.py load(), after the template lays out, before its checks; never during a
   build script's copy-fit pass). Any text box ([data-slot]) that overflows its box or runs past its line count
   (data-lines) steps down 0.25 pt at a time until it fits, never below 8 pt (6 pt for fine print, data-fine). Line
   height is kept, so a box's lines stay where the design drew them. Text that still doesn't fit at the floor stays
   at the floor; the template's overflow check then flags it and it goes back to the writer.
   Grow: every other text box drawn under 10 pt steps up 0.25 pt at a time while it still fits, to 10 pt at most and never
   past its line spacing / 1.15. A box never grows taller or wider than it was drawn, so nothing around it moves. Boxes
   at the same size that sit side by side (a row of captions, two columns), share a list or play the same part on each
   panel grow together and keep their line counts, so a caption row stays matched. Fine print, the contact card (its own sizing and the TREC broker-name check) and boxes with
   their own inline sizes inside stay as drawn. Numbers come from config/copy-rules.json typeSize (render.py passes them in).
     ShrinkFit.run(cfg) -> [{slot, from, to, fits, grew?}]   (also kept in ShrinkFit.done for the render report) */
(function(){
  const PT = 72 / 96;
  const CARD = /^(agent|broker|contact|cc)([._-]|$)/i;
  const capped = el => !!(el.dataset.cap && window.SP && SP.check);
  function growable(el){
    if(el.dataset.fine || el.dataset.fixed || CARD.test(el.dataset.slot || '')) return false;
    for(let p = el; p && p !== document.body; p = p.parentElement)
      if(p.classList && [...p.classList].some(c => /^cc(-|$)/.test(c) || c === 'agentcard' || c === 'contact-card')) return false;
    return !el.querySelector('[style*="font-size"]');
  }
  function lines(el){
    const r = document.createRange(); r.selectNodeContents(el);
    const tops = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5).map(q => q.top).sort((a, b) => a - b);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.2;
    let k = 0, last = -1e9; for(const t of tops){ if(t - last > lh * 0.5){ k++; last = t; } } return k;
  }
  function over(el){
    const cs = getComputedStyle(el), max = +el.dataset.lines || 0;
    if(cs.whiteSpace === 'nowrap') return el.scrollWidth > el.clientWidth + 1;
    if(max) return lines(el) > max || el.scrollWidth > el.clientWidth + 1;
    return el.scrollHeight > el.clientHeight + 1;
  }
  function run(cfg){
    const T = Object.assign({floor: 8, fineFloor: 6, growTo: 10, step: 0.25, minLeading: 1.15}, cfg || {}), STEP = T.step;
    const done = [], grow = [];
    for(const el of document.querySelectorAll('[data-slot]')){
      if(el.tagName === 'IMG' || el.querySelector('[data-slot]') || !el.textContent.trim()) continue;
      if(!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
      if(!el.clientWidth) continue;
      const cs = getComputedStyle(el), from = parseFloat(cs.fontSize) * PT;
      if(!over(el)){
        if(T.growTo && from < (capped(el) ? 9.5 : T.growTo) - 1e-6 && growable(el)) grow.push({el, from, cs});
        continue;
      }
      const floor = el.dataset.fine ? T.fineFloor : T.floor;
      if(!el.dataset.size0) el.dataset.size0 = from;   // the design size, for AddressFit.check
      if(from <= floor) continue;
      const lh = cs.lineHeight; if(lh !== 'normal') el.style.lineHeight = lh;   // keep the drawn line spacing
      let fs = from;
      while(over(el) && fs - STEP >= floor - 1e-6){ fs = Math.round((fs - STEP) * 100) / 100; el.style.fontSize = fs + 'pt'; }
      done.push({slot: el.dataset.slot, from: +from.toFixed(2), to: fs, fits: !over(el)});
    }
    // grow back toward 10 pt (owner 10/30). Boxes at the same drawn size grow together when they sit side by side (same page,
    // tops within 3 pt), share a parent (list items) or play the same part (the same slot name on every panel, e.g. each
    // panel's kicker), so matching text never ends up at different sizes
    const role = el => (el.dataset.slot || '').replace(/\d+/g, '').split('.').slice(1).join('.');
    const groups = [];
    for(const g of grow){
      g.page = g.el.closest('.page, [data-page], .pg') || document.body; g.top = g.el.getBoundingClientRect().top * PT; g.role = role(g.el);
      const hit = groups.find(G => Math.abs(G.from - g.from) < .01 && G.items.some(o =>
        (o.page === g.page && Math.abs(o.top - g.top) <= 3) || (g.el.tagName === 'LI' && o.el.parentElement === g.el.parentElement) || (g.role && o.role === g.role)));
      if(hit) hit.items.push(g); else groups.push({from: g.from, items: [g]});
    }
    for(const {from, items} of groups){
      const many = items.length > 1;
      for(const g of items){
        g.keep = [g.el.style.fontSize, g.el.style.lineHeight];
        g.h = g.el.offsetHeight; g.w = g.el.offsetWidth; g.n = lines(g.el);
        if(g.cs.lineHeight !== 'normal') g.el.style.lineHeight = g.cs.lineHeight;   // keep the drawn line spacing
      }
      // photo captions (data-cap) on pages with the set pieces' caption check keep to its 9 to 9.5 pt range while they grow
      // (11/3); pages without that check grow as before, so approved pieces don't change
      const cap = Math.min(T.growTo, ...items.map(g => g.cs.lineHeight === 'normal' ? T.growTo : parseFloat(g.cs.lineHeight) * PT / T.minLeading),
        ...items.filter(g => capped(g.el)).map(() => 9.5));
      const bad = g => over(g.el) || g.el.offsetHeight > g.h + .5 || g.el.offsetWidth > g.w + .5 || (g.el.clientHeight && g.el.scrollHeight > g.el.clientHeight + 1) || (many && lines(g.el) !== g.n);
      let fs = from;
      while(fs + STEP <= cap + 1e-6){
        const next = Math.round((fs + STEP) * 100) / 100;
        items.forEach(g => g.el.style.fontSize = next + 'pt');
        if(items.some(bad)){ items.forEach(g => g.el.style.fontSize = fs + 'pt'); break; }
        fs = next;
      }
      for(const g of items){
        if(fs > from + 1e-6) done.push({slot: g.el.dataset.slot, from: +from.toFixed(2), to: fs, fits: true, grew: true});
        else [g.el.style.fontSize, g.el.style.lineHeight] = g.keep;
      }
    }
    ShrinkFit.done = done;
    return done;
  }
  window.ShrinkFit = {run, done: []};
})();
