/* PlanInk (owner 11/10/2026, captions round 2 review p2; standing rule, every design): the listing's floor plan prints with a
   CLEAR background so the brochure's paper shows through. The plan is never redrawn: its own lines (and an MLS plan's colored
   rooms) stay as the listing has them.
     - line-only plans: an SVG filter turns the plan's white into transparent and its dark lines into one ink color (the
       design's ink on light paper; light lines on a dark field, the readability guard);
     - plans with colored rooms (data.plan.colored = true): kept exactly as given; on light paper they blend in (multiply);
       on a dark field they sit on the design's own background too (owner 11/14/2026: the plan box always defaults to the
       design background; the agent picks a lighter box on the proof if the plan is hard to see, templates/_shared/planbox.js).
   Agents can set the ink in the customizer: data.plan.lineColor = 'auto' (default) | 'dark' | 'light' | any CSS color.
   Use: PlanInk.attr(D, darkField) -> attributes for the plan <img>; PlanInk.panel(D, darkField) -> true when a light panel
   must sit behind the plan; PlanInk.install() once per page (adds the filter definitions). */
(function(){
  const hex = c => { const m = String(c || '').trim().match(/^#?([0-9a-f]{6})$/i); if(m) return m[1];
    const s = String(c || '').match(/^#?([0-9a-f]{3})$/i); return s ? s[1].split('').map(x => x + x).join('') : null; };
  const rgb = h => [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)/255);
  const css = (v, fb) => { const d = document.createElement('div'); d.style.color = v; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove();
    const m = c.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(x => +x/255) : fb; };
  const filters = new Map();
  const PI = window.PlanInk = {};
  const planOf = D => (D && D.plan) || D || {};
  PI.ink = (D, dark) => { const p = planOf(D), want = p.lineColor || 'auto';
    if(want === 'dark' || (want === 'auto' && !dark)) return css(getComputedStyle(document.documentElement).getPropertyValue('--ink') || '#222', [0.13, 0.13, 0.13]);
    if(want === 'light' || want === 'auto') return [0.97, 0.96, 0.93];
    const h = hex(want); return h ? rgb(h) : css(want, [0.13, 0.13, 0.13]); };
  PI.colored = D => !!planOf(D).colored;
  PI.filterId = (D, dark) => { const [r, g, b] = PI.ink(D, dark).map(x => +x.toFixed(3)), id = `planink-${Math.round(r*255)}-${Math.round(g*255)}-${Math.round(b*255)}`;
    if(!filters.has(id)){
      // light ink on a dark field (owner 11/12/2026, captions round 3 p8): hairlines and the small room names print too thin and faint
      // after the inversion, and solid black fills (stair blocks) turn into bright white blocks. The ink gets a gain so the labels read,
      // and wide solid areas (what survives an erode + dilate; lines and letters never do) print at 40% so they stay a fill, not a block.
      // The plan itself is never redrawn: the same pixels, only tinted.
      const lightInk = (r + g + b)/3 > 0.6, k = lightInk ? 1.9 : 1;
      filters.set(id, lightInk
        ? `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  ${-k/3} ${-k/3} ${-k/3} ${k} 0" result="ink"/><feMorphology in="ink" operator="erode" radius="2.5" result="e"/><feMorphology in="e" operator="dilate" radius="3" result="d"/><feColorMatrix in="d" type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 0" result="m"/><feComposite in="ink" in2="m" operator="arithmetic" k1="-0.6" k2="1" k3="0" k4="0"/></filter>`
        : `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  -0.3333 -0.3333 -0.3333 1 0"/></filter>`); }
    return id; };
  PI.style = (D, dark) => PI.colored(D) ? (dark ? '' : 'mix-blend-mode:multiply') : `filter:url(#${PI.filterId(D, dark)})`;
  PI.panel = () => false;   // no automatic light panel (owner 11/14/2026); was: colored-room plan on a dark field (11/13 Q4)
  PI.install = () => { let s = document.getElementById('planink-defs');
    if(!s){ s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.id = 'planink-defs'; s.setAttribute('width', 0); s.setAttribute('height', 0);
      s.style.cssText = 'position:absolute;width:0;height:0'; document.body.appendChild(s); }
    s.innerHTML = [...filters.values()].join(''); };
  // every listing plan image on the page (img[data-plan] / img[data-plan-img]) at once; dark = the plan sits on a dark field
  PI.applyAll = (D, dark) => { document.querySelectorAll('img[data-plan], img[data-plan-img]').forEach(img => { const st = PI.style(D, dark && !PI.panel(D, dark));
      img.style.filter = ''; img.style.mixBlendMode = ''; st.split(';').filter(Boolean).forEach(kv => { const [k, v] = kv.split(':'); img.style.setProperty(k.trim(), v.trim()); }); });
    PI.install(); };
})();
