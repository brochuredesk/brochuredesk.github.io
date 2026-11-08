/* templates/_shared/readsize.js: how big a social's or email's text looks where people see it (The owner, 10/30/2026: "social
   text looks tiny even on a big screen"). The renderer adds this to every social and email render.

   A social is a picture: Instagram, Facebook and X shrink it to the width of the feed. So a 1600 px X image with 30 px
   type shows that type at 6 px on a phone. ReadSize turns every line's size in the image into the size people see in
   each place, and flags anything under the floor:
     phone feed / story   the image's width on a 393 pt-wide phone (X and Google Business sit narrower, see SHOWN)
     desktop feed         the feed column on a laptop
   Floors in screen px (CSS px): 16 for the event line (date, time) and the address, 12 for everything else a reader
   needs (what's served, notes, the agent's phone and name), 10 for small print (the brokerage's tagline, place line).
     ReadSize.measure(imgW, shape) -> [{slot, role, px (in the image), phone, desktop, text}]
     ReadSize.check(imgW, shape)   -> [{slot, kind: 'text-small-phone', detail}] */
(function(){
  // how wide each shape shows, in screen px: [phone feed, desktop feed]
  const SHOWN = {post: [393, 470], slide: [393, 470], square: [393, 500], pin: [393, 500], story: [393, 393],
    wide: [330, 506], gbp: [360, 400], email: [360, 600]};
  // the owner OK'd these floors 10/30 late evening (READ-1) and turned the check on for every social and email.
  // fine: an email's one fine-print line (10 pt in the file, about 8 px on a phone; the report's "fine print excepted")
  const FLOOR = {event: 16, address: 16, body: 12, small: 10, fine: 8};
  const role = el => {
    const s = (el.closest('[data-slot]') || {}).dataset ? el.closest('[data-slot]').dataset.slot : '';
    if(/^oh\.(date|time|day|label)$|^moment$/.test(s)) return ['event', s];
    if(el.closest('[data-fine]')) return ['fine', s];
    if(/^address$/.test(s)) return ['address', s];
    if(el.closest('.cc')){
      const t = (el.className && String(el.className)) || '';
      return [/tag|office|fine|lic|est|desig|cc-lab/i.test(t + ' ' + (el.parentElement.className || '')) ? 'small' : 'body', 'card'];
    }
    if(/^place$/.test(s) || el.closest('[data-small]')) return ['small', s];
    return ['body', s || el.tagName.toLowerCase()];
  };
  const RS = {};
  RS.measure = (imgW, shape) => {
    const page = document.querySelector('.page'); if(!page) return [];
    const k = imgW / page.getBoundingClientRect().width;   // image px per CSS px
    const [ph, dk] = SHOWN[shape] || SHOWN.post, out = [];
    const walk = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    for(let n = walk.nextNode(); n; n = walk.nextNode()){
      const el = n.parentElement, t = n.textContent.trim();
      if(!t || seen.has(el)) continue;
      seen.add(el);
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if(r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      const px = parseFloat(cs.fontSize) * k, [rl, slot] = role(el);
      out.push({slot, role: rl, px: +px.toFixed(1), phone: +(px*ph/imgW).toFixed(1), desktop: +(px*dk/imgW).toFixed(1), text: t.slice(0, 40)});
    }
    return out;
  };
  RS.check = (imgW, shape) => RS.measure(imgW, shape).filter(m => m.phone < FLOOR[m.role] - .05)
    .map(m => ({slot: m.slot, kind: 'text-small-phone', detail: `"${m.text}" shows at ${m.phone} px on a phone (${FLOOR[m.role]} px minimum for ${m.role})`}));
  // Text too close to a border (The owner 10/31, Round 3: wide and Google Business text ran past the frame; square event text
  // sat off center in its white box). Measured on the letters themselves (text ranges), not the boxes:
  //   text-past-border  a line within 1.5% of the image width of the frame line (data-frame), or of the image edge
  //   box-off-center    centered text in a social's event box (data-box="oh.box") whose left and right air differ by
  //                     more than 4% of the box width
  RS.edges = () => {
    const page = document.querySelector('.page'); if(!page) return [];
    const P = page.getBoundingClientRect(), m = P.width*.015, out = [];
    const fr = page.querySelector('[data-frame]'), F = fr ? fr.getBoundingClientRect() : null;
    const ink = el => { const rg = document.createRange(), R = {l: 1e9, r: -1e9, t: 1e9, b: -1e9};
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for(let n = walk.nextNode(); n; n = walk.nextNode()){ if(!n.textContent.trim()) continue; rg.selectNodeContents(n);
        for(const q of rg.getClientRects()){ if(q.width < .5) continue; R.l = Math.min(R.l, q.left); R.r = Math.max(R.r, q.right); R.t = Math.min(R.t, q.top); R.b = Math.max(R.b, q.bottom); } }
      return R.r > R.l ? R : null; };
    const slots = [...page.querySelectorAll('[data-slot]')].filter(el => !el.parentElement.closest('[data-slot]'));
    const S = slots.map(el => [el, ink(el)]).filter(x => x[1]);
    for(const [el, R] of S){
      const cs = getComputedStyle(el); if(cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      // the frame counts only for text inside it (a line set over the frame's band on purpose is caught by the edge)
      const B = F && R.l >= F.left - m && R.r <= F.right + m && R.t >= F.top - m && R.b <= F.bottom + m ? F : P;
      // vertical: font boxes carry their own air, so only the side edges and a clear crossing count top and bottom
      const gaps = {left: R.l - B.left, right: B.right - R.r, top: R.t + (R.b - R.t)*.15 - B.top, bottom: B.bottom - (R.b - (R.b - R.t)*.15)};
      const bad = Object.entries(gaps).filter(([, g]) => g < m);
      if(bad.length) out.push({slot: el.dataset.slot, kind: 'text-past-border',
        detail: `"${el.textContent.trim().slice(0, 30)}" ${bad.map(([s, g]) => `${(g/P.width*100).toFixed(1)}% from the ${B === F ? 'frame' : 'edge'} (${s})`).join(', ')}`});
    }
    for(const bx of page.querySelectorAll('[data-box="oh.box"]')){
      // a box the reader can't see (white on a white page, no line) has no sides to touch
      const bs = getComputedStyle(bx), seen = bs.backgroundColor !== getComputedStyle(page).backgroundColor || parseFloat(bs.borderLeftWidth) > 0;
      if(!seen) continue;
      const Q = bx.getBoundingClientRect(), ins = S.filter(([el, R]) => getComputedStyle(el).textAlign === 'center' &&
        (R.l + R.r)/2 > Q.left && (R.l + R.r)/2 < Q.right && (R.t + R.b)/2 > Q.top && (R.t + R.b)/2 < Q.bottom);
      if(!ins.length) continue;
      const l = Math.min(...ins.map(x => x[1].l)), r = Math.max(...ins.map(x => x[1].r));
      // centered lines: each line's own air, so a long line can't hide a short one off to the side
      for(const [el, R] of ins){ const d = (R.l - Q.left) - (Q.right - R.r);
        if(Math.abs(d) > Q.width*.04) out.push({slot: el.dataset.slot, kind: 'box-off-center', detail: `"${el.textContent.trim().slice(0, 30)}" ${(d/2/Q.width*100).toFixed(1)}% to the ${d > 0 ? 'right' : 'left'} of the box's center`}); }
      if(l < Q.left + Q.width*.02 || r > Q.right - Q.width*.02) out.push({slot: 'oh.box', kind: 'text-past-border', detail: 'event text touches its box\'s side'});
    }
    return out;
  };
  RS.SHOWN = SHOWN; RS.FLOOR = FLOOR;
  window.ReadSize = RS;
})();
