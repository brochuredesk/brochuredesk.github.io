/* No empty photo frames (CLAUDE.md quality bar: nothing ships with a missing photo). Runs on every render (renderer/render.py,
   beside FactRepeat): a piece whose photo, headshot or logo failed to load fails its checks instead of printing a blank frame.
   Looks at every visible <img> on the piece (an <img> with no src, or one the browser could not load) and every element
   that paints a url() background (announce photos are backgrounds; each url is loaded once to see if it comes in).
   The renderer keeps one photo-missing per photo (a design's own check may report the same one).
   Anything smaller than 12 x 12 px, hidden, or fully transparent is not a frame. Reads only: nothing on the page changes.
     await PhotoFrame.check() -> [{slot, kind: 'photo-missing', src, detail}]   empty = passes */
(function(){
  const MIN = 12;
  const shown = el => {
    const b = el.getBoundingClientRect();
    if(b.width < MIN || b.height < MIN) return false;
    for(let e = el; e && e.nodeType === 1; e = e.parentElement){
      const cs = getComputedStyle(e);
      if(cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    }
    return true;
  };
  const name = el => el.dataset.photo || el.dataset.slot || (el.closest('[data-slot]') || {dataset: {}}).dataset.slot || el.getAttribute('class') || el.tagName.toLowerCase();
  const short = s => s.length > 70 ? '…' + s.slice(-60) : s;
  const loads = src => new Promise(ok => {
    const im = new Image(), t = setTimeout(() => ok(false), 8000);
    im.onload = () => { clearTimeout(t); ok(im.naturalWidth > 0); };
    im.onerror = () => { clearTimeout(t); ok(false); };
    im.src = src;
  });
  async function check(){
    const out = [];
    for(const im of document.querySelectorAll('img')){
      if(!shown(im)) continue;
      const src = im.getAttribute('src') || '';
      let ok = !!src.trim();
      if(ok && !(im.complete && im.naturalWidth > 0)) ok = im.complete ? false : await loads(im.currentSrc || im.src);
      if(!ok) out.push({slot: name(im), kind: 'photo-missing', src, detail: src.trim() ? `photo did not load: ${short(src)}` : 'photo frame has no photo'});
    }
    const seen = new Map();
    for(const el of document.querySelectorAll('*')){
      if(el.tagName === 'IMG') continue;
      const bg = getComputedStyle(el).backgroundImage;
      if(!bg || bg === 'none' || bg.indexOf('url(') < 0 || !shown(el)) continue;
      for(const m of bg.matchAll(/url\(["']?(.*?)["']?\)/g)){
        const src = m[1];
        if(!seen.has(src)) seen.set(src, loads(src));
        if(!(await seen.get(src))) out.push({slot: name(el), kind: 'photo-missing', src, detail: `photo did not load: ${short(src)}`});
      }
    }
    return out;
  }
  window.PhotoFrame = {check};
})();
