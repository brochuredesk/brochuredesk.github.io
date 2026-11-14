/* PlanBox: the floor plan box's background (owner 11/13/2026, standing rule, every design that shows a plan).
   The box behind the floor plan defaults to the design's own background: the listing's plan prints with a clear
   background (PlanInk), so the design's paper shows through and nothing here runs. The agent can click the plan on
   the proof and pick another color when the plan is hard to see (too dark or too light); that color is
   data.colors.planBox, and this paints it:
     PlanBox.apply(color)  paint the box behind every floor plan on the page; returns [{box, color}] or [] (no plan,
                           or no color)
   How: the plan's own drawings (img[data-plan], img[data-plan-img], the design's plan elements) are grouped by the
   panel that holds them: the largest box around them that holds no photo and is under half the page. A panel bigger
   than the drawings takes the color; drawings with no panel of their own get a box of the color behind them, a
   little larger than the drawings. On the new color the plan's lines are re-inked light or dark for contrast (the plan
   itself is never redrawn: the same pixels, only tinted), and any text in the box that would read under 4.5:1 flips to
   the darker or lighter of the design's own inks. A colored-room plan keeps its colors. Layout never moves. */
(function(){
  const PLAN = 'img[data-plan], img[data-plan-img], [data-plan-preview], .plan-svg, .plan-color, .planwrap svg, .boardvars svg, svg.plan, .plan.lv';
  const rgbOf = c => { if(!c) return null;
    if(c[0] === '#'){ let h = c.slice(1); if(h.length === 3) h = h.split('').map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
    const m = String(c).match(/rgba?\(([^)]+)\)/); if(!m) return null; const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return p.length > 3 && p[3] === 0 ? null : p.slice(0, 3); };
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const isPlan = n => n.matches && n.matches(PLAN);
  const inPlan = n => !!(n.closest && n.closest(PLAN));
  // a photo: an <img>, <image> or background-image that isn't part of the plan (logos count: a panel never takes them in)
  const hasPhoto = n => [...n.querySelectorAll('img, image, [style*="background-image"]')].some(e => !inPlan(e) && !isPlan(e)
    && (e.tagName.toLowerCase() !== 'img' || e.getBoundingClientRect().width > 4) && (!/background-image/.test(e.getAttribute('style') || '') || /url\(/.test(getComputedStyle(e).backgroundImage)));
  const area = r => r.width * r.height;
  function panelOf(el, A){
    let best = el, cur = el.parentElement;
    while(cur && cur !== document.body && cur !== document.documentElement){
      if(area(cur.getBoundingClientRect()) > 0.5 * A || hasPhoto(cur)) break;
      best = cur; cur = cur.parentElement;
    }
    return best;
  }
  const union = rs => rs.reduce((u, r) => ({left: Math.min(u.left, r.left), top: Math.min(u.top, r.top), right: Math.max(u.right, r.right), bottom: Math.max(u.bottom, r.bottom)}),
    {left: 1e9, top: 1e9, right: -1e9, bottom: -1e9});
  const inks = () => { const s = getComputedStyle(document.documentElement), o = [];
    ['--ink', '--paper', '--bg', '--cream', '--navy', '--muted'].forEach(v => { const c = rgbOf(s.getPropertyValue(v).trim()); if(c) o.push(c); });
    return o.concat([[34, 34, 34], [248, 246, 240]]); };
  const PB = window.PlanBox = {SEL: PLAN};
  // the design's own color behind the plan (the "standard" the agent goes back to): the first painted box under it
  PB.under = () => { const p = document.querySelector(PLAN); let e = p && p.parentElement;
    while(e){ const c = rgbOf(getComputedStyle(e).backgroundColor); if(c) return '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); e = e.parentElement; }
    return '#ffffff'; };
  PB.apply = color => {
    const bg = rgbOf(color); if(!bg) return [];
    const A = area(document.body.getBoundingClientRect()) || (innerWidth * innerHeight);
    const plans = [...document.querySelectorAll(PLAN)].filter(e => !(e.parentElement && e.parentElement.closest(PLAN)) && area(e.getBoundingClientRect()) > 16);
    if(!plans.length) return [];
    const groups = new Map();
    plans.forEach(p => { const k = panelOf(p, A); const g = groups.get(k) || []; g.push(p); groups.set(k, g); });
    // drawings whose panel is only themselves share one backing box per parent (the floors of one plan)
    const merged = new Map();
    for(const [k, g] of groups){
      const kr = k.getBoundingClientRect(), u = union(g.map(p => p.getBoundingClientRect()));
      const own = g.length === 1 && g[0] === k || (kr.width - (u.right - u.left) < 12 && kr.height - (u.bottom - u.top) < 12);
      const key = own ? (k.offsetParent || k.parentElement) : k;
      const m = merged.get(key) || {own, plans: []}; m.plans.push(...g); merged.set(key, m);
    }
    const out = [], dark = lum(bg) < 0.4, css = `rgb(${bg.join(', ')})`;
    for(const [key, m] of merged){
      let box = key;
      if(m.own){
        // the drawings plus their floor names; the design's own plan frame when it draws one around them (a bordered or
        // filled box with no photo in it), else a box a little larger than the drawings
        const host = key, hr = host.getBoundingClientRect(), pad = 8, first = m.plans[0];
        const u0 = union(m.plans.map(p => p.getBoundingClientRect()));
        const near = r => r.left > u0.left - 60 && r.right < u0.right + 60 && r.top > u0.top - 30 && r.bottom < u0.bottom + 30;
        const names = [...document.querySelectorAll('.plan-level, [data-slot^="plan.level"]')].filter(e => !m.plans.includes(e) && near(e.getBoundingClientRect()));
        const u1 = union(m.plans.concat(names).map(p => p.getBoundingClientRect())), u = Object.assign({}, u1, {left: u0.left, right: u0.right});   // name boxes run wider than their text
        const photos = [...document.querySelectorAll('img, image')].filter(e => !inPlan(e) && !isPlan(e)).map(e => e.getBoundingClientRect()).filter(r => r.width > 4);
        const hits = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
        const frame = [...document.body.querySelectorAll('*')].filter(e => { if(m.plans.includes(e) || e.closest(PLAN) || e.contains(first)) return false;
            const r = e.getBoundingClientRect(), s = getComputedStyle(e);
            if(!(r.left <= u.left + 2 && r.top <= u.top + 2 && r.right >= u.right - 2 && r.bottom >= u.bottom - 2) || area(r) > 0.5 * A) return false;
            const lined = ['Top', 'Right', 'Bottom', 'Left'].some(k => parseFloat(s['border' + k + 'Width']) > 0 && s['border' + k + 'Style'] !== 'none');
            return (lined || rgbOf(s.backgroundColor)) && !photos.some(p => hits(p, r)); })
          .sort((a, b) => area(a.getBoundingClientRect()) - area(b.getBoundingClientRect()))[0];
        if(frame && (frame.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING)){ box = frame; }   // drawn before the plan: paint it
        else {
          const t = frame ? frame.getBoundingClientRect() : {left: u.left - pad, top: u.top - pad, right: u.right + pad, bottom: u.bottom + pad};
          const sx = host.offsetWidth ? hr.width / host.offsetWidth : 1, sy = host.offsetHeight ? hr.height / host.offsetHeight : 1;
          box = document.createElement('div'); box.className = 'planbox-paint'; box.dataset.planBox = '1';
          Object.assign(box.style, {position: 'absolute', left: ((t.left - hr.left) / sx - host.clientLeft) + 'px', top: ((t.top - hr.top) / sy - host.clientTop) + 'px',
            width: ((t.right - t.left) / sx) + 'px', height: ((t.bottom - t.top) / sy) + 'px', pointerEvents: 'none'});
          if(getComputedStyle(host).position === 'static') host.style.position = 'relative';
          // just under the plan (and under a frame drawn after it), so nothing drawn before it is covered
          const before = [...host.children].find(c => c === first || c.contains(first)) || host.firstChild;
          host.insertBefore(box, before);
        }
        m.frame = frame;
      }
      box.style.backgroundColor = css; box.dataset.planBoxColor = color;
      // the plan's own lines: re-inked for the new color (PlanInk), never redrawn; colored rooms keep their colors
      m.plans.forEach(p => [p].concat([...p.querySelectorAll('img')]).forEach(img => {
        if(img.tagName.toLowerCase() !== 'img' || !window.PlanInk) return;
        const f = img.style.filter || getComputedStyle(img).filter || '';
        // a colored-room plan (blend or panel) stays exactly as the listing gives it; the rough draft's stand-in plan inks like a line plan
        if(!/planink-/.test(f) && !img.closest('[data-plan-preview]')) return;
        const ink = inks().sort((a, b) => ratio(b, bg) - ratio(a, bg))[0], hex = '#' + ink.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
        const st = PlanInk.style({lineColor: hex}, dark);
        img.style.filter = ''; st.split(';').filter(Boolean).forEach(kv => { const [a, b] = kv.split(':'); img.style.setProperty(a.trim(), b.trim()); });
      }));
      // a plan drawn as a mask filled with the design's ink (the rough draft's stand-in): the fill takes the ink that reads best
      const best = '#' + inks().sort((a, b) => ratio(b, bg) - ratio(a, bg))[0].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
      m.plans.forEach(p => [p].concat([...p.querySelectorAll('*')]).forEach(e => { const s = getComputedStyle(e);
        if((s.webkitMaskImage || s.maskImage || 'none') !== 'none' && rgbOf(s.backgroundColor)) e.style.background = best; }));
      out.push({box: box.className || box.tagName.toLowerCase(), color});
    }
    if(window.PlanInk) PlanInk.install();
    // text sitting in a painted box: flip anything under 4.5:1 to the design's ink that reads best on the new color
    const boxes = [...document.querySelectorAll('[data-plan-box-color]')].map(b => b.getBoundingClientRect());
    const K = inks();
    document.querySelectorAll('body *').forEach(e => {
      if(![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
      const r = e.getBoundingClientRect(); if(!r.width) return;
      const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
      if(!boxes.some(b => cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom)) return;
      const c = rgbOf(getComputedStyle(e).color); if(!c || ratio(c, bg) >= 4.5) return;
      const best = K.slice().sort((a, b) => ratio(b, bg) - ratio(a, bg))[0]; e.style.color = `rgb(${best.join(', ')})`;
    });
    return out;
  };
})();
