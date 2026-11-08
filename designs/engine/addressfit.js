/* Street address lines (owner, 10/30/2026, Eight Sets Changes Round 2 Q4), every piece of every design. Runs on every
   render (renderer/render.py load(), after the template lays out, before ShrinkFit). For each address box
   ([data-slot] ending in "address" or "addr") whose text doesn't fit on one line (it wraps, or a one-line box runs past
   its width): drop the street suffix (Street, Road, Avenue, Drive...) when that puts the address on one line. If it
   still needs two lines, keep the suffix and never leave one word alone on the last line (the last two words are tied).
   Plain-text boxes only; a box with markup inside is left as drawn.
     AddressFit.run() -> [{slot, from, to, how}]   (also kept in AddressFit.done for the render report) */
(function(){
  // suffixes that tell streets apart stay (owner 10/29, two-sided flyers, every design): Circle, Court, Lane, Place, Way
  const SUFFIX = new Set(('street st road rd avenue ave av drive dr boulevard blvd '
    + 'terrace ter trail trl parkway pkwy loop square sq path crossing xing cove cv point pt run row walk alley').split(' '));
  function lines(el){
    const r = document.createRange(); r.selectNodeContents(el);
    const tops = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5).map(q => q.top).sort((a, b) => a - b);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.2;
    let k = 0, last = -1e9; for(const t of tops){ if(t - last > lh * 0.5){ k++; last = t; } } return k;
  }
  const oneLine = el => getComputedStyle(el).whiteSpace === 'nowrap' ? el.scrollWidth <= el.clientWidth + 1 : lines(el) <= 1;
  // "1915 Fairhaven Street" -> "1915 Fairhaven"; "1110 Autrey St A, Houston, TX" -> "1110 Autrey A, Houston, TX"
  function drop(text){
    const cut = text.indexOf(','), street = cut < 0 ? text : text.slice(0, cut), rest = cut < 0 ? '' : text.slice(cut);
    const w = street.trim().split(/\s+/);
    for(let i = w.length - 1; i >= 2; i--){          // a number and a name stay in front of the suffix
      const tail = w.slice(i + 1).join(' ');
      if(tail && !/^(#\s?\w+|(apt|unit|ste|suite|bldg)\.?\s*\w+|[a-z0-9]{1,4})$/i.test(tail)) break;   // only a unit may follow
      if(SUFFIX.has(w[i].toLowerCase().replace(/\.$/, ''))) return w.slice(0, i).concat(w.slice(i + 1)).join(' ') + rest;
    }
    return null;
  }
  // the last word sits on a line of its own: its top is below the word before it
  function lonely(el){
    const node = el.firstChild, t = node && node.nodeValue || '', b = t.trimEnd().lastIndexOf(' ');
    if(b < 1) return false;
    const a = t.slice(0, b).trimEnd().lastIndexOf(' ') + 1, r = document.createRange();
    const top = (s, e) => { r.setStart(node, s); r.setEnd(node, e); return r.getBoundingClientRect().top; };
    return top(b + 1, t.trimEnd().length) - top(a, b) > 1;
  }
  function run(){
    const done = [];
    for(const el of document.querySelectorAll('[data-slot]')){
      if(!/(^|\.)(address|addr)$/.test(el.dataset.slot) || el.children.length || !el.textContent.trim()) continue;
      if(!el.clientWidth) continue;
      // a line the template already stepped down (data-fit) goes back to its design size first: dropping the suffix
      // comes before shrinking (owner 10/31), and a shrink comes back only if the shorter street still doesn't fit
      const s0 = +el.dataset.size0, cur = parseFloat(getComputedStyle(el).fontSize) * 72 / 96, shrunk = s0 && cur < s0 - 0.01;
      if(shrunk) el.style.fontSize = s0 + 'pt';
      if(oneLine(el)) continue;
      const from = el.textContent, short = drop(from.trim());
      if(short){ el.textContent = short; if(oneLine(el)){ done.push({slot: el.dataset.slot, from, to: short, how: 'suffix dropped'}); continue; } el.textContent = from; }
      if(shrunk){ el.style.fontSize = cur + 'pt'; }
      if(getComputedStyle(el).whiteSpace === 'nowrap' || lines(el) < 2) continue;
      const w = from.trim().split(' ');
      if(w.length < 3 || !lonely(el)) continue;
      const tied = w.slice(0, -1).join(' ') + ' ' + w[w.length - 1];   // the last two words travel together
      el.textContent = tied;
      done.push({slot: el.dataset.slot, from, to: tied.replace(' ', ' / '), how: 'last two words kept together'});
    }
    // a design's stacked layout (owner 10/31): when the street ends on two lines the design moves what's under it down
    // and trims its table to make room (window.afterAddressFit, set by the template; SP.trimRows)
    for(const f of window.afterAddressFit || []) try { f(done); } catch(e){ done.push({slot: 'address', how: 'stack hook failed: ' + e.message}); }
    AddressFit.done = done;
    return done;
  }
  // Long street names (owner, 10/31/2026, every design): the street keeps about its design size. Shrinking it more than
  // 10% to fit is a print problem: the piece falls back to its stacked layout (the street on two lines, the table under it
  // trimmed to make room; see stack below) instead.
  const SHRINK_MAX = 0.10;
  function check(){
    const out = [];
    for(const el of document.querySelectorAll('[data-slot]')){
      if(!/(^|\.)(address|addr|street)$/.test(el.dataset.slot) || !el.textContent.trim() || !el.clientWidth) continue;
      const size = parseFloat(getComputedStyle(el).fontSize) * 72 / 96, design = +el.dataset.size0 || size;
      if(size < design * (1 - SHRINK_MAX) - 0.01)
        out.push({slot: el.dataset.slot, kind: 'address-shrunk', size: +size.toFixed(2), design: +design.toFixed(2), text: el.textContent.trim().slice(0, 60)});
    }
    return out;
  }
  window.AddressFit = {run, drop, check, done: []};
})();
