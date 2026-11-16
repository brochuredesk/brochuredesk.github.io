/* Empty space around a logo or an event block (the owner, 11/8/2026, FXS-09 socials p6/p7: a small broker logo sat in empty navy under
   the agent and the "Public Open House, November 7, 1 to 4" block sat low in its space; "blank spaces keep showing up": catch them before
   a book is made). Runs on every render (renderer/render.py), every piece of every design.
   - logo-adrift: a logo with no agent line beside it (one that sits under or apart from the agent) must sit centered in the free space
     around it, side to side and top to bottom, and fill it: the empty height above plus below it is at most 1.3x the logo's height
     (or 6% of the page), and its left and right free space differ by at most 12% of that space.
   - event-adrift: the event (its label, weekday, date and time, and the REALTOR(R) perks under it) sits centered top to bottom in the free space it has: the empty space
     above and below it differ by at most 5% of the page height.
   The free space runs from the element to the nearest thing drawn (text as set, photo, rule, panel) or the page's margin (5%).
     FreeSpace.check() -> [{slot, kind, detail}]   empty = passes */
(function(){
  const vis = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > .5 && r.height > .5 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity !== 0; };
  // a line of text measured to its letters, near enough: the line box less 15% top and bottom (a big serif's line box reaches well past its ink)
  const ink = q => ({left: q.left, right: q.right, top: q.top + q.height*.15, bottom: q.bottom - q.height*.15, width: q.width, height: q.height*.7});
  const textRects = el => { const rg = document.createRange(); rg.selectNodeContents(el); return [...rg.getClientRects()].filter(q => q.width > .5 && q.height > .5).map(ink); };
  const union = rs => rs.length ? {l: Math.min(...rs.map(r => r.left)), t: Math.min(...rs.map(r => r.top)), r: Math.max(...rs.map(r => r.right)), b: Math.max(...rs.map(r => r.bottom))} : null;
  const drawn = img => { const r = img.getBoundingClientRect(), s = getComputedStyle(img), nw = img.naturalWidth, nh = img.naturalHeight;
    if(!nw || !nh || !/contain|scale-down/.test(s.objectFit)) return {l: r.left, t: r.top, r: r.right, b: r.bottom};
    const k = Math.min(r.width/nw, r.height/nh), w = nw*k, h = nh*k; return {l: r.left + (r.width - w)/2, t: r.top + (r.height - h)/2, r: r.left + (r.width + w)/2, b: r.top + (r.height + h)/2}; };
  function boxes(page, P){
    const out = [];
    for(const el of page.querySelectorAll('*')){
      if(!vis(el)) continue;
      const r = el.getBoundingClientRect(); if(r.width*r.height > P.w*P.h*.8) continue;   // a full background
      if(el.tagName === 'IMG'){ out.push(Object.assign(drawn(el), {el})); continue; }
      const s = getComputedStyle(el), bg = s.backgroundColor, painted = (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) || s.backgroundImage !== 'none' || parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderLeftWidth) > 0;
      if(painted) out.push({l: r.left, t: r.top, r: r.right, b: r.bottom, el});
    }
    // every piece of text as set, line by line (a text node's own rectangles: inline spans, line breaks and all)
    const tw = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
    for(let n = tw.nextNode(); n; n = tw.nextNode()){ if(!n.textContent.trim() || !vis(n.parentElement)) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for(const q0 of rg.getClientRects()) if(q0.width > .5 && q0.height > .5){ const q = ink(q0); out.push({l: q.left, t: q.top, r: q.right, b: q.bottom, el: n.parentElement, text: 1}); } }
    return out;
  }
  // the free space around box T: up, down, left, right to the nearest drawn thing that faces it, else the page margin
  function zone(T, all, P, skip){
    const ins = .05*Math.min(P.w, P.h), Z = {t: P.t + ins, b: P.b - ins, l: P.l + ins, r: P.r - ins};
    for(const o of all){ if(skip(o)) continue;
      const hx = o.r > T.l + 1 && o.l < T.r - 1, vy = o.b > T.t + 1 && o.t < T.b - 1;
      if(hx && o.b <= T.t + 1) Z.t = Math.max(Z.t, o.b); if(hx && o.t >= T.b - 1) Z.b = Math.min(Z.b, o.t);
      if(vy && o.r <= T.l + 1) Z.l = Math.max(Z.l, o.r); if(vy && o.l >= T.r - 1) Z.r = Math.min(Z.r, o.l); }
    return Z;
  }
  function check(){
    const out = [], pages = [...document.querySelectorAll('.page, [data-page]')].filter(p => !p.parentElement.closest('.page, [data-page]'));
    for(const page of (pages.length ? pages : [document.body])){
      const pr = page.getBoundingClientRect(), P = {l: pr.left, t: pr.top, r: pr.right, b: pr.bottom, w: pr.width, h: pr.height}, all = boxes(page, P), id = page.dataset.page || '';
      for(const lg of page.querySelectorAll('.logo')){ if(!vis(lg)) continue;
        const img = lg.querySelector('img'), T = img ? drawn(img) : union(textRects(lg)); if(!T) continue;
        const th = T.b - T.t, tw = T.r - T.l; if(th < 6 || th > P.h*.3) continue;
        const inLogo = o => lg.contains(o.el) || o.el.contains(lg);
        // a logo beside the agent's lines is part of that row: not checked here
        const agentRow = all.filter(o => !inLogo(o) && o.text && /^agent\./.test((o.el.closest('[data-slot]') || {dataset: {}}).dataset.slot || '') && o.b > T.t && o.t < T.b);
        if(agentRow.some(o => Math.min(Math.abs(o.l - T.r), Math.abs(T.l - o.r)) < P.w*.3)) continue;
        // the owner's 11/3 row (FX socials): the agent at the left margin, the logo at the right one, its middle inside the agent's
        // lines top to bottom and nothing drawn between them: still that row, however short the agent's lines (11/13 live sweep)
        { const A = union(all.filter(o => !inLogo(o) && o.text && /^agent\./.test((o.el.closest('[data-slot]') || {dataset: {}}).dataset.slot || '')).map(o => ({left: o.l, right: o.r, top: o.t, bottom: o.b}))), cy = (T.t + T.b)/2;
          if(A && agentRow.length && cy > A.t && cy < A.b && (A.r <= T.l ? T.r >= P.r - .08*P.w : A.l >= T.r && T.l <= P.l + .08*P.w)
             && !all.some(o => !inLogo(o) && !(o.text && /^agent\./.test((o.el.closest('[data-slot]') || {dataset: {}}).dataset.slot || '')) && o.r - o.l > 4 && o.b > A.t && o.t < A.b && o.l >= Math.min(A.r, T.r) - 1 && o.r <= Math.max(A.l, T.l) + 1)) continue; }   // a hairline divider between them is part of the row
        // a logo inside a panel or band (a painted box around it) answers to that panel's own layout check
        // (11/13: it still has to sit centered and fill that panel: the free space is measured to the panel's own edges)
        const pan = all.filter(o => !inLogo(o) && !o.text && o.el.tagName !== 'IMG' && o.l <= T.l && o.r >= T.r && o.t <= T.t && o.b >= T.b).sort((a, b) => (a.r - a.l)*(a.b - a.t) - (b.r - b.l)*(b.b - b.t))[0];
        if(pan){
          if(!page.classList.contains('em')){ continue; }   // emails only for now (11/13): the approved flyers' footer logos stay as approved
          const Q = {l: pan.l, t: pan.t, r: pan.r, b: pan.b, w: pan.r - pan.l, h: pan.b - pan.t}; if(Q.w*Q.h > P.w*P.h*.5) continue;   // the page's own background
          const Zq = zone(T, all, Q, o => inLogo(o) || o === pan), tw0 = T.r - T.l, fa = T.t - Zq.t, fb = Zq.b - T.b, fl0 = T.l - Zq.l, fr0 = Zq.r - T.r;
          if(Math.abs(fa - fb) > Math.max(th*.5, 12) && fa + fb > th*.8) out.push({slot: `${id}:logo`, kind: 'logo-adrift', detail: `the logo sits off-center top to bottom inside its panel (${Math.round(fa)} px above, ${Math.round(fb)} px below): center it and fill the panel`});
          else if(Math.abs(fl0 - fr0) > .12*(fl0 + fr0) && fl0 + fr0 > tw0*.5) out.push({slot: `${id}:logo`, kind: 'logo-adrift', detail: `the logo sits off-center side to side inside its panel (${Math.round(fl0)} px left, ${Math.round(fr0)} px right): center it and fill the space`});
          continue; }
        const under = union(all.filter(o => o.text && /^agent\./.test((o.el.closest('[data-slot]') || {dataset: {}}).dataset.slot || '') && o.b <= T.t + 1 && T.t - o.b < P.h*.25 && o.r > T.l && o.l < T.r).map(o => ({left: o.l, right: o.r, top: o.t, bottom: o.b})));   // a logo under the agent's lines centers under them
        const Z = zone(T, all, P, inLogo), fv = (T.t - Z.t) + (Z.b - T.b), fl = T.l - Z.l, fr = Z.r - T.r;
        if(fv > Math.max(th*1.3, P.h*.06)) out.push({slot: `${id}:logo`, kind: 'logo-adrift', detail: `the logo (${Math.round(th)} px tall) has ${Math.round(fv)} px of empty space above and below it: grow it to fill the space and center it`});
        else if(under && Math.abs((T.l + T.r)/2 - (under.l + under.r)/2) > .12*(under.r - under.l)) out.push({slot: `${id}:logo`, kind: 'logo-adrift', detail: `the logo is not centered side to side in its space (its middle ${Math.round((T.l + T.r)/2 - (under.l + under.r)/2)} px off the middle of the agent's lines)`});
      }
      let ev = [...page.querySelectorAll('[data-slot]')].filter(el => /^oh\.(label|weekday|date|time|refreshments|note)$/.test(el.dataset.slot) && vis(el));
      // a label set as the page's heading (far above the date, or other text or a photo between them, e.g. FXS-28 sideways Open House) is not part of the block
      { const lab = ev.filter(e => e.dataset.slot === 'oh.label'), rest = ev.filter(e => e.dataset.slot !== 'oh.label'), L = union(lab.flatMap(textRects)), R = union(rest.flatMap(textRects));
        // or a label set in its own band across the page (Ivory's "Public Open House" bar over a framed date): a heading, not the block
        const band = L && R && all.find(o => !o.text && o.el.tagName !== 'IMG' && o.l <= L.l && o.r >= L.r && o.t <= L.t && o.b >= L.b && o.b <= R.t + 1 && (o.r - o.l) > P.w*.6);
        if(L && R && (band || R.t - L.b > P.h*.15 || all.some(o => !ev.some(e => e.contains(o.el) || o.el === e) && o.t >= L.b - 1 && o.b <= R.t + 1 && o.r > R.l && o.l < R.r))) ev = rest; }
      if(ev.length >= 2){ const rs = ev.flatMap(textRects), T = union(rs);
        // an event set inside its own painted panel or bordered box (Ivory's navy band over the photo, its framed date): centered in that
        // panel, top to bottom, the panel's edges being its space (11/13, as the logo panel rule above)
        const evPan = T && all.filter(o => !o.text && o.el.tagName !== 'IMG' && !ev.some(e => e.contains(o.el)) && o.l <= T.l && o.r >= T.r && o.t <= T.t && o.b >= T.b && (o.r - o.l)*(o.b - o.t) < P.w*P.h*.5)
          .filter(q => !all.some(o => o.text && !ev.some(e => e.contains(o.el) || o.el === e) && o.l >= q.l - 1 && o.r <= q.r + 1 && o.t >= q.t - 1 && o.b <= q.b + 1))   // a panel that holds the event alone
          .sort((a, b) => (a.r - a.l)*(a.b - a.t) - (b.r - b.l)*(b.b - b.t))[0];
        if(T && evPan){ const mine = o => ev.some(e => e.contains(o.el) || o.el === e), Q = {l: evPan.l, t: evPan.t, r: evPan.r, b: evPan.b, w: evPan.r - evPan.l, h: evPan.b - evPan.t};
          const Z = zone(T, all.filter(o => o.l >= Q.l - 1 && o.r <= Q.r + 1 && o.t >= Q.t - 1 && o.b <= Q.b + 1), Q, o => mine(o) || o === evPan), fa = T.t - Z.t, fb = Z.b - T.b;
          if(Math.abs(fa - fb) > P.h*.05) out.push({slot: `${id}:oh.event`, kind: 'event-adrift', detail: `the event block is not centered top to bottom in its panel (${Math.round(fa)} px above, ${Math.round(fb)} px below)`}); }
        else if(T){
          // text set tight against the event in the same column (the address line under the time, FXS-28/FXS-11 wide) is one stack with it:
          // the stack is what has to sit centered (11/13 live sweep); "tight" = a gap under 3% of the page height
          // (only in a column beside one photo or panel that spans the whole stack: there the stack centers on that photo's height)
          const stack = new Set(rs.length ? all.filter(o => ev.some(e => e.contains(o.el) || o.el === e)) : []), T2 = Object.assign({}, T); let added = 0;
          for(let grew = true; grew;){ grew = false;
            for(const o of all) if(o.text && !stack.has(o) && o.r > T2.l && o.l < T2.r && ((o.t >= T2.b - 1 && o.t - T2.b < P.h*.03) || (o.b <= T2.t + 1 && T2.t - o.b < P.h*.03))){
              stack.add(o); T2.t = Math.min(T2.t, o.t); T2.b = Math.max(T2.b, o.b); T2.l = Math.min(T2.l, o.l); T2.r = Math.max(T2.r, o.r); grew = true; added++; } }
          if(added && all.some(o => !o.text && !stack.has(o) && o.t <= T2.t && o.b >= T2.b && (o.r <= T2.l + 1 || o.l >= T2.r - 1) && (o.r - o.l) > P.w*.15)) Object.assign(T, T2);
          else stack.clear();
          const mine = o => stack.has(o) || ev.some(e => e.contains(o.el) || o.el === e), Z = zone(T, all, P, mine);
          // an event in a column beside a photo or panel: its space is that photo's height
          for(const o of all) if(!o.text && !mine(o) && o.t <= T.t && o.b >= T.b && (o.r <= T.l + 1 || o.l >= T.r - 1) && (o.r - o.l) > P.w*.15){ Z.t = Math.max(Z.t, o.t); Z.b = Math.min(Z.b, o.b); }
          const fa = T.t - Z.t, fb = Z.b - T.b;
          if(Math.abs(fa - fb) > P.h*.05) out.push({slot: `${id}:oh.event`, kind: 'event-adrift', detail: `the event block is not centered top to bottom in its space (${Math.round(fa)} px above, ${Math.round(fb)} px below)`}); } }
    }
    return out;
  }
  window.FreeSpace = {check};
})();
