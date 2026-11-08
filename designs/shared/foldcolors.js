/* FoldColors: the agent's two fold-over colors (owner 11/7/2026, standing rule, every design set).
   On every fold-over the agent can change
     colors.page     the main background of the fold-over
     colors.planBox  the background of the box behind the floor plan
   Both default to the set's own colors (pieces.json, the fold-over piece's "colors"), so a package that leaves them
   out, or sets them to the defaults, draws exactly as approved. Nothing here needs re-approval.

     FoldColors.apply(colors, cfg)   recolor the drawn fold-over; returns what changed
       colors  {page, planBox} (hex, from the package data; either may be missing)
       cfg     the set's defaults from pieces.json:
               {page: '#hex' (the .page background),
                planBox: '#hex' | null (null: the plan sits on the page, no box of its own; it follows colors.page),
                plan: 'selector' (the plan drawings: svg or img), box: 'selector' (optional; else found by geometry)}
     FoldColors.check()              after apply: text on a changed background that still reads under 4.5:1
                                     (3:1 for marked fine print) -> [{kind: 'color-contrast', ...}]; empty when nothing changed

   How: every background, fill, stroke, border and gradient stop in the old color (any alpha) takes the new color, at the
   same alpha. The plan box goes first (its region), then the page (everything else). Then every text and every thin rule
   or plan line that now sits on a changed background is checked: under 4.5:1 (text) or 1.6:1 (rules) it flips to the
   set's own dark or light ink, whichever reads better (black or white as a last resort). Photos and anything on a
   background that didn't change are left alone. Layout never moves. */
(function(){
  const rgbOf = c => {
    if(!c) return null;
    if(c[0] === '#'){
      let h = c.slice(1); if(h.length === 3) h = h.split('').map(x => x + x).join('');
      return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).concat(1);
    }
    const m = c.match(/rgba?\(([^)]+)\)/); if(!m) return null;
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const same = (a, b) => a && b && Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1 && Math.abs(a[2] - b[2]) <= 1;
  const css = (rgb, a) => a >= 1 ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${+a.toFixed(3)})`;
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const over = (fg, bg) => fg[3] >= 1 ? fg : [0, 1, 2].map(i => Math.round(fg[i] * fg[3] + bg[i] * (1 - fg[3]))).concat(1);   // fg composited on bg

  const PROPS = ['background-color', 'fill', 'stroke', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'stop-color'];
  const STATE = {changed: new Map(), checks: []};   // element -> new backdrop color [r,g,b,1]

  const pages = () => [...document.querySelectorAll('.page')];
  const all = () => pages().flatMap(p => [p, ...p.querySelectorAll('*')]);
  // an element's box; inside <defs> (patterns, gradients) the owning svg's
  const rect = e => { const d = e.closest && e.closest('defs'); return (d ? d.ownerSVGElement || d.closest('svg') : e).getBoundingClientRect(); };
  const inside = (r, R) => { const x = r.left + r.width / 2, y = r.top + r.height / 2; return x >= R.left && x <= R.right && y >= R.top && y <= R.bottom; };

  // swap one color for another on one element, keeping each property's own alpha; true when anything changed
  function swap(e, from, to){
    const s = getComputedStyle(e); let hit = false;
    for(const p of PROPS){
      if(p.startsWith('border') && parseFloat(s.getPropertyValue(p.replace('color', 'width'))) === 0) continue;
      const c = rgbOf(s.getPropertyValue(p));
      if(c && c[3] > 0 && same(c, from)){ e.style.setProperty(p, css(to, c[3]), 'important'); hit = true; }
    }
    const img = s.backgroundImage;
    if(img && img !== 'none' && /gradient/.test(img)){
      const out = img.replace(/rgba?\([^)]+\)/g, m => { const c = rgbOf(m); return same(c, from) ? (hit = true, css(to, c[3])) : m; });
      if(out !== img) e.style.setProperty('background-image', out, 'important');
    }
    return hit;
  }

  // the plan regions. A set with a box (cfg.box): each box that holds a plan drawing (cfg.plan). A set without one:
  // each drawing itself, which takes a quiet backing in the plan color when the agent picks one
  function regions(cfg){
    if(!cfg.plan) return [];
    const draws = [...document.querySelectorAll(cfg.plan)].filter(d => { const r = d.getBoundingClientRect(); return r.width > 40 && r.height > 30 && d.closest('.page'); });
    const R = e => { const r = e.getBoundingClientRect(); return {left: r.left - .5, top: r.top - .5, right: r.right + .5, bottom: r.bottom + .5}; };
    if(!cfg.box) return draws.filter(d => !draws.some(o => o !== d && o.contains(d))).map(d => ({page: d.closest('.page'), box: null, draw: [d], R: R(d)}));
    return [...document.querySelectorAll(cfg.box)].map(b => ({page: b.closest('.page'), box: b, draw: draws.filter(d => b.contains(d) || inside(d.getBoundingClientRect(), b.getBoundingClientRect())), R: R(b)}))
      .filter(g => g.page && g.draw.length);
  }
  // plan art drawn as a picture (the agent's own plan): it can't be recolored, and inverting it turns solid room fills
  // black. So when its backdrop crosses from light to dark, or back, the picture keeps a small card in the box's
  // standard color behind it, and reads exactly as approved
  function flipArt(g, from, to){
    if((lum(from) > .18) === (lum(to) > .18)) return;
    for(const d of g.draw) for(const im of [d, ...d.querySelectorAll('img, image')].filter(x => /^img$/i.test(x.tagName))){
      im.style.setProperty('background-color', css(from, 1), 'important');
      im.style.setProperty('box-shadow', `0 0 0 5pt ${css(from, 1)}`, 'important');
      STATE.changed.set(im, from);
    }
    for(const d of g.draw) d.querySelectorAll('[style*="mask"]').forEach(m => {   // tinted art: a mask over the ink
      const c = rgbOf(getComputedStyle(m).backgroundColor); if(c && ratio(c, to) < 3) m.style.setProperty('background-color', css(lum(to) > .18 ? [17, 17, 17] : [255, 255, 255], 1), 'important'); });
  }

  function apply(colors, cfg){
    STATE.changed = new Map(); STATE.checks = [];
    colors = colors || {}; cfg = cfg || {};
    const page0 = rgbOf(cfg.page), box0 = rgbOf(cfg.planBox) || page0;
    const page1 = rgbOf(colors.page) || page0;
    // a set with no plan box of its own: the plan area follows the page unless the agent picks a plan color
    const box1 = rgbOf(colors.planBox) || (cfg.planBox ? box0 : page1);
    const doPage = page0 && !same(page0, page1), doBox = box0 && !same(box0, box1);
    const done = [];
    if(!doPage && !doBox) return done;
    const els = all(), taken = new Set();
    if(doBox) for(const g of regions(cfg)){
      const inR = els.filter(e => g.page.contains(e) && (e === g.box || g.draw.some(d => d.contains(e)) || inside(rect(e), g.R)) && !(e !== g.box && e.contains(g.box || g.draw[0])));
      for(const e of inR){ taken.add(e); if(swap(e, box0, box1)){ STATE.changed.set(e, box1); done.push('planBox'); } }
      if(!g.box && colors.planBox && !same(box1, page1)) for(const d of g.draw){   // no box of its own: a quiet backing under the drawing
        d.style.setProperty('background-color', css(box1, 1), 'important');
        d.style.setProperty('box-shadow', `0 0 0 6pt ${css(box1, 1)}`, 'important');
        STATE.changed.set(d, box1); done.push('planBox');
      }
      flipArt(g, box0, box1);
    }
    if(doPage) for(const e of els){
      if(taken.has(e)) continue;
      if(swap(e, page0, page1)){ STATE.changed.set(e, page1); done.push('page'); }
    }
    contrast(cfg);
    return [...new Set(done)];
  }

  // the backdrop a thing sits on: among the opaque things whose box holds its center, the last one painted before it
  // (an ancestor, or anything earlier in the document); null when that is a photo
  function backdrop(e, pool){
    const r = e.getBoundingClientRect(); let best = null;
    for(const b of pool){
      if(b === e || e.contains(b)) continue;
      if(!(b.contains(e) || (b.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING))) continue;
      if(!inside(r, b.getBoundingClientRect())) continue;
      if(!best || best.contains(b) || (!b.contains(best) && (best.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING))) best = b;
    }
    return best;
  }
  const opaque = e => {
    if(e.tagName === 'IMG' || e.tagName === 'image' || e.tagName === 'VIDEO' || e.tagName === 'CANVAS') return true;
    const s = getComputedStyle(e); if(s.display === 'none' || s.visibility === 'hidden') return false;
    if(s.backgroundImage && s.backgroundImage.includes('url(')) return true;
    const c = rgbOf(e instanceof SVGElement ? (/^(rect|path|polygon|circle|ellipse)$/.test(e.tagName) ? s.fill : null) : s.backgroundColor);
    return !!(c && c[3] >= .5);
  };
  const colorOf = b => { if(!b) return null; if(STATE.changed.has(b)) return STATE.changed.get(b);
    const s = getComputedStyle(b); const c = rgbOf(b instanceof SVGElement ? s.fill : s.backgroundColor); return c && c[3] >= .5 ? c : null; };

  function inks(){
    const seen = new Map();
    for(const e of all()){
      if(![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const c = rgbOf(getComputedStyle(e).color); if(c && c[3] >= .9) seen.set(c.slice(0, 3).join(','), c);
    }
    const list = [...seen.values()].sort((a, b) => lum(a) - lum(b));
    return {dark: list[0] && lum(list[0]) < .2 ? list[0] : [17, 17, 17, 1], light: list.length && lum(list[list.length - 1]) > .6 ? list[list.length - 1] : [255, 255, 255, 1]};
  }
  const pick = (bg, ink) => { const a = ratio(ink.dark, bg), b = ratio(ink.light, bg); const c = a >= b ? ink.dark : ink.light;
    return ratio(c, bg) >= 4.5 ? c : (ratio([0, 0, 0], bg) >= ratio([255, 255, 255], bg) ? [0, 0, 0, 1] : [255, 255, 255, 1]); };

  function contrast(cfg){
    if(!STATE.changed.size) return;
    const els = all(), pool = els.filter(opaque), ink = inks(), changed = [...STATE.changed.keys()];
    const near = e => { const r = e.getBoundingClientRect(); return changed.some(c => inside(r, c.getBoundingClientRect())); };
    for(const e of els){
      const s = getComputedStyle(e);
      if(s.display === 'none' || s.visibility === 'hidden' || !near(e)) continue;
      const text = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      const svgLine = e instanceof SVGElement && /^(line|polyline|path|rect|polygon|circle|ellipse)$/.test(e.tagName) && s.stroke && s.stroke !== 'none';
      const thin = !(e instanceof SVGElement) && (() => { const r = e.getBoundingClientRect(); return (r.height <= 3 || r.width <= 3) && rgbOf(s.backgroundColor) && rgbOf(s.backgroundColor)[3] > 0; })();
      const borders = !(e instanceof SVGElement) && ['top', 'right', 'bottom', 'left'].filter(k => parseFloat(s[`border-${k}-width`] || s.getPropertyValue(`border-${k}-width`)) > 0);
      if(!text && !svgLine && !thin && !(borders && borders.length)) continue;
      const b = backdrop(e, pool); if(!b || !STATE.changed.has(b)) continue;
      if(b.tagName === 'IMG' || b.tagName === 'image') continue;
      const bg = STATE.changed.get(b);
      if(text){
        const fill = e instanceof SVGElement ? 'fill' : 'color', c = rgbOf(s.getPropertyValue(fill));
        if(c){ const need = isFine(e) ? 3 : 4.5;
          if(ratio(over(c, bg), bg) < need){ const n = pick(bg, ink); e.style.setProperty(fill, css(n, c[3] < 1 ? Math.max(c[3], .85) : 1), 'important'); } }
      }
      const rule = (p) => { const c = rgbOf(s.getPropertyValue(p)); if(c && c[3] > 0 && ratio(over(c, bg), bg) < 1.6){ const n = pick(bg, ink); e.style.setProperty(p, css(n, Math.max(c[3], .5)), 'important'); } };
      if(svgLine) rule('stroke');
      if(thin) rule('background-color');
      if(borders) for(const k of borders) if(!(e === b)) rule(`border-${k}-color`);
    }
  }
  const isFine = e => !!(e.closest('[data-fine]'));   // marked fine print: 3:1; every other text 4.5:1, as the sets' own checks ask

  function check(){
    const out = [];
    if(!STATE.changed.size) return out;
    const els = all(), pool = els.filter(opaque);
    for(const e of els){
      if(![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const s = getComputedStyle(e); if(s.display === 'none' || s.visibility === 'hidden') continue;
      const b = backdrop(e, pool); if(!b || !STATE.changed.has(b)) continue;
      const bg = STATE.changed.get(b), c = rgbOf(e instanceof SVGElement ? s.fill : s.color); if(!c) continue;
      const r = ratio(over(c, bg), bg), need = isFine(e) ? 3 : 4.5;
      if(r < need) out.push({kind: 'color-contrast', page: (e.closest('.page') || {}).dataset?.page, slot: e.closest('[data-slot]')?.dataset.slot || null,
        text: e.textContent.trim().slice(0, 40), ratio: +r.toFixed(2), need});
    }
    return out;
  }

  window.FoldColors = {apply, check, _rgb: rgbOf, _ratio: ratio};
})();
