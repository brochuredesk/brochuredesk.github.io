/* The Neighborhood Atlas street map.
   Draws a real street map from OpenStreetMap data (data.map: streets, parks and water around the listing in local meters,
   x east and y south, the listing at 0,0; built once per listing by scripts/r2/atlas_map.py) into a box of any size.
   North is up. Streets, parks and water are drawn in the design's colors; the named places are labeled at 8 pt:
   the three in the Map Index with their address and distance, a few more with their name, and a place that falls off the
   map (Downtown) is shown as an arrow at the edge pointing the way, the way the index lists it.
   (c) OpenStreetMap contributors, ODbL; the piece credits it under the map. */
(function(){
  const AT = window.AT || (window.AT = {});
  const MILE = 1609.34;   // map labels are 8 pt on print; an email map passes C.lbl
  const SVGNS = 'http://www.w3.org/2000/svg';

  // streets by class: [casing width, fill width] in pt, drawing order
  const CLS = {residential:[3.9, 2.7], unclassified:[3.9, 2.7], tertiary:[4.8, 3.6], secondary:[5.8, 4.5], primary:[7.0, 5.6], trunk:[7.6, 6.2], motorway:[8.4, 7.0]};
  const ORDER = ['residential','unclassified','tertiary','secondary','primary','trunk','motorway'];
  const RANK = {motorway:6, trunk:6, primary:5, secondary:4, tertiary:3, residential:2, unclassified:2};

  AT.mapMarker = (kind, size) => {
    const s = size || 10, c = s/2;
    if(kind === 'park') return `<svg class="mk" width="${s}pt" height="${s}pt" viewBox="0 0 ${s} ${s}"><rect x=".5" y=".5" width="${s-1}" height="${s-1}" fill="#cfdcc2" stroke="#1f3a32" stroke-width=".8"/><circle cx="${c}" cy="${c}" r="1.7" fill="#1f3a32"/></svg>`;
    if(kind === 'far') return `<svg class="mk" width="${s}pt" height="${s}pt" viewBox="0 0 ${s} ${s}"><path d="M1.5 ${s-1.5} L${s-2} 2 M${s-5} 1.8 L${s-1.8} 1.8 L${s-1.8} ${s-5}" fill="none" stroke="#b4442b" stroke-width="1.5" stroke-linecap="square"/></svg>`;
    return `<svg class="mk" width="${s}pt" height="${s}pt" viewBox="0 0 ${s} ${s}"><circle cx="${c}" cy="${c}" r="${c-.8}" fill="#f1eee6" stroke="#b4442b" stroke-width="1.5"/></svg>`;
  };

  AT.drawMap = function(el, D, C){
    const M = D.map, issues = [];
    const LBL = C.lbl || 8, F = C.lbl ? 4/3 : 1;   // email maps (C.lbl) draw their text at 12.5 pt; F keeps the text's computed size honest (an SVG user unit is a pt, a CSS size is a px)
    const tx = (x, y, extra, inner) => F === 1 ? `<text x="${x}" y="${y}" ${extra}>${inner}</text>` : `<text x="0" y="0" transform="translate(${x} ${y}) scale(${1/F})" font-size="${LBL*F}" ${extra}>${inner}</text>`;
    if(!M) return [{slot:'cover.map', kind:'map-missing'}];
    const W = AT.pt(el.clientWidth), H = AT.pt(el.clientHeight);
    const fam = getComputedStyle(document.documentElement).getPropertyValue('--font-body');
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `600 ${LBL*96/72}px ${fam}`;
    const tw = (s, bold) => { ctx.font = `${bold ? 700 : 600} ${LBL*96/72}px ${fam}`; return ctx.measureText(s).width*72/96; };

    const all = [...(M.places||[]), ...(M.far||[])];
    const find = n => all.find(p => p.n === n);
    const idx = (C.index||[]).map(i => Object.assign({}, i, {p: find(i.name)})).filter(i => i.p);
    const extras = (C.mapExtras||[]).map(n => ({name:n, p: find(n)})).filter(i => i.p && !idx.some(j => j.name === i.name));
    const near = [...idx.filter(i => !i.far), ...extras];
    const far = idx.filter(i => i.far);

    // scale and center: the listing and every labeled place inside the box, with room for the labels
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    near.forEach(i => { x0 = Math.min(x0, i.p.x); x1 = Math.max(x1, i.p.x); y0 = Math.min(y0, i.p.y); y1 = Math.max(y1, i.p.y); });
    const padX = 62, padB = 26, padT = far.length ? 46 : 26;   // room above the listing for a far arrow and its label
    let k = Math.min((W - 2*padX) / Math.max(1, x1 - x0), (H - padT - padB) / Math.max(1, y1 - y0));
    k = Math.max(W/2800, Math.min(W/1150, k));
    // zoomed out (owner 11/2): about a mile and a half across the long side and at least 1,400 m across the short one (a thin
    // strip shows the blocks around it too), never past the street data (about 2 km each way)
    if(C.wide) k = Math.max(W/4000, Math.min(k, Math.max(W, H)/2600, Math.min(W, H)/1400));
    // the labeled places sit centered in the room the pads leave
    const offX = W/2 - ((x0 + x1)/2)*k, offY = padT + ((H - padT - padB) - (y1 - y0)*k)/2 - y0*k;
    const X = x => offX + x*k, Y = y => offY + y*k;
    const inView = (px, py, m) => px > m && px < W - m && py > m && py < H - m;

    const pathOf = pts => 'M' + pts.map(p => `${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('L');
    let svg = `<defs><clipPath id="mclip"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#mclip)">`;
    svg += `<rect width="${W}" height="${H}" fill="var(--land)"/>`;
    (M.areas||[]).forEach(a => {
      if(a.line) svg += `<path d="${pathOf(a.p)}" fill="none" stroke="#bccfd3" stroke-width="${Math.max(3, 18*k)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      else svg += `<path d="${pathOf(a.p)}Z" fill="${a.k === 'water' ? '#bccfd3' : '#cfdcc2'}"/>`;
    });
    // streets: casings first, then the white streets over them, minor to major
    const near2 = ORDER.map(c => (M.ways||[]).filter(w => w.c === c));
    near2.forEach((ws, i) => { const c = ORDER[i]; if(!ws.length) return;
      svg += `<path d="${ws.map(w => pathOf(w.p)).join('')}" fill="none" stroke="#bdb8a8" stroke-width="${CLS[c][0]}" stroke-linecap="round" stroke-linejoin="round"/>`; });
    near2.forEach((ws, i) => { const c = ORDER[i]; if(!ws.length) return;
      svg += `<path d="${ws.map(w => pathOf(w.p)).join('')}" fill="none" stroke="#fbfaf5" stroke-width="${CLS[c][1]}" stroke-linecap="round" stroke-linejoin="round"/>`; });

    const halo = `stroke="#f6f3ea" stroke-width="${2.6*F}" stroke-linejoin="round" paint-order="stroke"`;
    const qm = MILE/4*k;
    // the scale bar goes bottom left, bottom right or bottom center, wherever it leaves the labels clear
    const SCALE = {bl: [10, H - 10], br: [W - 20 - qm - 78, H - 10], bc: [W/2 - qm/2 - 40, H - 10]};
    const layout = pos => {
      const scaleRect = [SCALE[pos][0] - 4, H - 27, qm + 82, 24];
      let defs = '';
      // ---- labels: places first, then street names where they fit ----
      const rects = [];   // label boxes placed so far [x, y, w, h]
      const iss = [];
      rects.push(scaleRect, [W - 30, 3, 28, 34]);   // the scale bar and the north arrow keep their corners
      const hit = r => rects.some(q => r[0] < q[0]+q[2]+1.5 && r[0]+r[2] > q[0]-1.5 && r[1] < q[1]+q[3]+1 && r[1]+r[3] > q[1]-1);
      const halo = `stroke="#f6f3ea" stroke-width="${2.6*F}" stroke-linejoin="round" paint-order="stroke"`;
      let marks = '', texts = '';
      const lineH = LBL + 1.4;
      // the listing: a pin with its address; Open House maps (C.star) get a big star and the address in a filled label so the house is never lost
      const px0 = X(0), py0 = Y(0); let addr = (D.listing||{}).address || '';
      if(C.star && !C.lbl) addr = addr.replace(/\s+Street(?=\s*(,|$|\s+(Unit|Apt|#|Suite)\b))/i, '').trim();   // print: no "Street" (The owner 10/30)
      if(C.star){
        const R1 = 13, R0 = 5.6, sp = []; for(let i = 0; i < 10; i++){ const r = i % 2 ? R0 : R1, a = -Math.PI/2 + i*Math.PI/5; sp.push(`${(Math.cos(a)*r).toFixed(1)} ${(Math.sin(a)*r).toFixed(1)}`); }
        marks += `<g transform="translate(${px0.toFixed(1)} ${py0.toFixed(1)})"><path d="M${sp.join('L')}Z" fill="#b4442b" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M${sp.join('L')}Z" fill="none" stroke="#1f3a32" stroke-width=".6" stroke-linejoin="round" transform="scale(1.12)"/></g>`;
        const AF = C.lbl ? LBL + 1.5 : 10; ctx.font = `700 ${AF*96/72}px ${fam}`; const aw2 = ctx.measureText(addr).width*72/96, bw = aw2 + 12, bh = AF + 6;
        const sides = [[px0 + 15, py0 - bh/2], [px0 - bw - 15, py0 - bh/2], [px0 - bw/2, py0 - 15 - bh - 1], [px0 - bw/2, py0 + 16]];
        const ok = o => o[0] > 3 && o[0] + bw < W - 3 && o[1] > 2 && o[1] + bh < H - 2;
        const ps2 = sides.find(o => ok(o) && !hit([o[0], o[1], bw, bh])) || sides.find(ok) || sides[0];
        rects.push([px0 - 15, py0 - 15, 30, 30], [ps2[0], ps2[1], bw, bh]);
        texts += `<rect x="${ps2[0].toFixed(1)}" y="${ps2[1].toFixed(1)}" width="${bw.toFixed(1)}" height="${bh}" rx="2" fill="#1f3a32" stroke="#fff" stroke-width="1"/>` + (F === 1 ? `<text x="${(ps2[0] + bw/2).toFixed(1)}" y="${(ps2[1] + bh/2 + 3.5).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${AT.esc(addr)}</text>` : `<text x="0" y="0" transform="translate(${(ps2[0] + bw/2).toFixed(1)} ${(ps2[1] + bh/2 + AF*0.35).toFixed(1)}) scale(${1/F})" text-anchor="middle" font-size="${AF*F}" font-weight="700" fill="#fff">${AT.esc(addr)}</text>`);
      } else {
      marks += `<g transform="translate(${px0.toFixed(1)} ${py0.toFixed(1)})"><path d="M0 0C-4 -6.5 -6 -9.5 -6 -12.5a6 6 0 1 1 12 0C6 -9.5 4 -6.5 0 0Z" fill="#b4442b" stroke="#f6f3ea" stroke-width=".9"/><circle cx="0" cy="-12.5" r="2.3" fill="#f6f3ea"/></g>`;
      const aw = tw(addr, true);
      const pinSides = [[px0 - aw - 9, py0 - 17], [px0 + 8, py0 - 17], [px0 + 8, py0 - 5], [px0 - aw - 9, py0 - 5]];
      let ps = pinSides.find(r => r[0] > 3 && r[0] + aw < W - 3 && r[1] > 2 && r[1] + lineH < H - 2) || pinSides[0];
      rects.push([px0 - 6, py0 - 19, 12, 19], [ps[0], ps[1], aw, lineH]);
      texts += tx(ps[0].toFixed(1), (ps[1] + LBL - 0.8).toFixed(1), `font-weight="700" ${halo}`, AT.esc(addr));
      }

      const placeLabel = (i, sub, soft) => {
        const p = i.p, mx = X(p.x), my = Y(p.y);
        if(soft && hit([mx - 6, my - 6, 12, 12])) return;
        const l1 = i.name, l2 = sub || '';
        const w = Math.max(tw(l1, true), l2 ? tw(l2) : 0), h = l2 ? 2*lineH : lineH;
        const opts = [[mx + 7, my - h/2], [mx - w - 7, my - h/2], [mx - w/2, my - h - 5], [mx - w/2, my + 5], [mx + 7, my - h - 2], [mx - w - 7, my - h - 2], [mx + 7, my + 1], [mx - w - 7, my + 1]];
        let r = opts.find(o => o[0] > 2 && o[0] + w < W - 2 && o[1] > 2 && o[1] + h < H - 2 && !hit([o[0], o[1], w, h]));
        if(!r && soft) return;   // an extra place only where it is clear of everything
        if(!r){ r = opts.find(o => o[0] > 2 && o[0] + w < W - 2 && o[1] > 2 && o[1] + h < H - 2); iss.push({slot:'cover.map', kind:'map-label-overlap', detail:i.name}); }
        if(!r) return iss.push({slot:'cover.map', kind:'map-label-outside', detail:i.name});
        rects.push([mx - 5, my - 5, 10, 10], [r[0], r[1], w, h]);
        const park = (p.k === 'park' || p.k === 'garden');
        marks += park ? `<rect x="${(mx-3.6).toFixed(1)}" y="${(my-3.6).toFixed(1)}" width="7.2" height="7.2" fill="#cfdcc2" stroke="#1f3a32" stroke-width=".8"/><circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="1.3" fill="#1f3a32"/>`
          : `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="3.3" fill="#f6f3ea" stroke="#b4442b" stroke-width="1.5"/>`;
        texts += tx(r[0].toFixed(1), (r[1] + LBL - 0.8).toFixed(1), `font-weight="700" ${halo}`, AT.esc(l1));
        if(l2) texts += tx(r[0].toFixed(1), (r[1] + lineH + LBL - 0.8).toFixed(1), `font-weight="600" fill="#b4442b" ${halo}`, AT.esc(l2));
      };

      // places beyond the map: an arrow at the edge in their direction, with name and distance
      far.forEach(i => {
        const dx = i.p.x, dy = i.p.y, m = Math.hypot(dx, dy) || 1;
        let t = 1e9; const bx = px0, by = py0, ux = dx/m, uy = dy/m, mg = 15;
        if(ux > 0) t = Math.min(t, (W - mg - bx)/ux); if(ux < 0) t = Math.min(t, (mg - bx)/ux);
        if(uy > 0) t = Math.min(t, (H - mg - by)/uy); if(uy < 0) t = Math.min(t, (mg - by)/uy);
        const ang = Math.atan2(uy, ux)*180/Math.PI; let ax = bx + ux*t, ay = by + uy*t;
        if(ax > W - 36 && ay < 50) ay = 54;   // the arrow keeps clear of the north arrow in the corner
        const l1 = i.name, l2 = i.miles || '', w = Math.max(tw(l1, true), tw(l2)), h = 2*lineH;
        const opts = ux < 0 ? [[ax + 11, ay - h/2], [ax + 11, ay + 2], [ax + 11, ay - h - 2]] : [[ax - w - 11, ay - h/2], [ax - w - 11, ay + 2], [ax - w - 11, ay - h - 2]];
        const ext = [0, -h - 3, h + 3, -2*h - 6, 2*h + 6].flatMap(dv => opts.map(o => [o[0], o[1] + dv]));   // the label slides along the edge until it is clear of the others
        const r = ext.map(o => [Math.min(W - w - 3, Math.max(3, o[0])), Math.min(H - h - 2, Math.max(2, o[1]))]).find(o => !hit([o[0], o[1], w, h])) || opts[0];
        rects.push([ax - 8, ay - 8, 16, 16], [r[0], r[1], w, h]);
        marks += `<g transform="translate(${ax.toFixed(1)} ${ay.toFixed(1)}) rotate(${ang.toFixed(0)})"><path d="M-5 0H5M1 -4L5.5 0L1 4" fill="none" stroke="#b4442b" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></g>`;
        texts += tx(r[0].toFixed(1), (r[1] + LBL - 0.8).toFixed(1), `font-weight="700" ${halo}`, AT.esc(l1)) + tx(r[0].toFixed(1), (r[1] + lineH + LBL - 0.8).toFixed(1), `font-weight="600" fill="#b4442b" ${halo}`, AT.esc(l2));
      });

      idx.filter(i => !i.far).forEach(i => placeLabel(i, [i.p.addr, i.miles].filter(Boolean).join(' · ')));
      extras.forEach(i => placeLabel(i, '', C.wide));   // zoomed out, the copy's extras are named where they are clear (more places come next)
      // zoomed out: more of the neighborhood named, nearest first, taking turns by kind (parks, groceries, schools, sights, coffee, food);
      // only real names (the map data has entries like "vacant")
      if(C.wide){
        const taken = new Set([...idx, ...extras].map(i => i.p.n)), KIND = {park: 0, garden: 0, supermarket: 1, school: 2, museum: 3, zoo: 3, attraction: 3, golf_course: 3, cafe: 4, restaurant: 5};
        const groups = [];
        (M.places||[]).filter(p => !taken.has(p.n) && /^[A-Z0-9]/.test(p.n || '') && inView(X(p.x), Y(p.y), 18)).sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y))
          .forEach(p => { const g = KIND[p.k] ?? 5; (groups[g] = groups[g] || []).push(p); });
        const order = []; for(let r = 0; groups.some(g => g && g[r]); r++) groups.forEach(g => g && g[r] && order.push(g[r]));
        const most = Math.min(10, Math.max(3, Math.round(W*H/6500)));
        let n0 = 0;
        for(const p of order){ if(n0 >= most) break; const before = rects.length; placeLabel({name: p.n, p}, '', true); if(rects.length > before) n0++; }
      }

      // street names: the longest run of each street inside the map, longest and biggest first, clear of the place labels
      const byName = {};
      (M.ways||[]).forEach(w => { if(!w.n || !RANK[w.c]) return; (byName[w.n] = byName[w.n] || []).push(w); });
      const cands = [];
      Object.keys(byName).forEach(nm => {
        const need = tw(nm, false) + 10;
        let best = null;
        byName[nm].forEach(w => {
          let pts = w.p.map(p => [X(p[0]), Y(p[1])]);
          if(pts[0][0] > pts[pts.length-1][0] || (Math.abs(pts[0][0] - pts[pts.length-1][0]) < 2 && pts[0][1] < pts[pts.length-1][1])) pts = pts.reverse();
          // sub-runs inside the map
          let run = [];
          const flush = () => { if(run.length > 1){ let L = 0; for(let i = 1; i < run.length; i++) L += Math.hypot(run[i][0]-run[i-1][0], run[i][1]-run[i-1][1]);
            if(L >= need && (!best || L > best.L)) best = {L, pts: run, c: w.c}; } run = []; };
          pts.forEach(q => { if(inView(q[0], q[1], 7)) run.push(q); else flush(); }); flush();
        });
        if(best) cands.push(Object.assign(best, {nm, need}));
      });
      cands.sort((a, b) => (RANK[b.c] - RANK[a.c]) || (b.L - a.L));
      let nlab = 0;
      for(const c of cands){
        if(nlab >= Math.max(5, Math.round(W/70))) break;
        // cut the run to the stretch the text needs, centered
        const pts = c.pts; let L = 0; const seg = [0];
        for(let i = 1; i < pts.length; i++){ L += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); seg.push(L); }
        const mid = L/2, a0 = mid - c.need/2, a1 = mid + c.need/2;
        const at = d => { for(let i = 1; i < pts.length; i++) if(seg[i] >= d){ const t = (d - seg[i-1])/Math.max(1e-6, seg[i]-seg[i-1]); return [pts[i-1][0] + (pts[i][0]-pts[i-1][0])*t, pts[i-1][1] + (pts[i][1]-pts[i-1][1])*t]; } return pts[pts.length-1]; };
        const sub = [at(a0)]; for(let i = 1; i < pts.length - 1; i++) if(seg[i] > a0 && seg[i] < a1) sub.push(pts[i]); sub.push(at(a1));
        const xs = sub.map(q => q[0]), ys = sub.map(q => q[1]);
        const r = [Math.min(...xs) - 1, Math.min(...ys) - LBL/2 - 1, Math.max(...xs) - Math.min(...xs) + 2, Math.max(...ys) - Math.min(...ys) + LBL + 2];
        if(hit(r)) continue;
        // a street running close to upright reads upward on its path; keep letters upright
        rects.push(r); nlab++;
        defs += `<path id="sl${nlab}" d="M${sub.map(q => `${(q[0]*F).toFixed(1)} ${(q[1]*F).toFixed(1)}`).join('L')}" fill="none"/>`;
        texts += F === 1 ? `<text font-weight="600" dy="${(LBL*0.34).toFixed(2)}" ${halo}><textPath href="#sl${nlab}" startOffset="50%" text-anchor="middle">${AT.esc(c.nm)}</textPath></text>`
          : `<text transform="scale(${1/F})" font-size="${LBL*F}" font-weight="600" dy="${(LBL*0.34*F).toFixed(2)}" ${halo}><textPath href="#sl${nlab}" startOffset="50%" text-anchor="middle">${AT.esc(c.nm)}</textPath></text>`;
      }


      return {marks, texts, defs, iss, pos};
    };
    let L1 = null;
    for(const pos of ['bl', 'br', 'bc']){ const r = layout(pos); if(!L1 || r.iss.length < L1.iss.length) L1 = r; if(!r.iss.length) break; }
    const {marks, texts, defs} = L1; issues.push(...L1.iss);
    // north arrow and scale bar
    const nx = W - 16, ny = 17;
    let furn = `<circle cx="${nx}" cy="${ny}" r="9.5" fill="#f6f3ea" stroke="#1f3a32" stroke-width=".7"/><path d="M${nx} ${ny-6.5} L${nx+3.2} ${ny+3.4} L${nx} ${ny+1.4} L${nx-3.2} ${ny+3.4}Z" fill="#1f3a32"/>`
      + tx(nx, ny + 17, `text-anchor="middle" font-weight="700" ${halo}`, 'N');
    const sx = SCALE[L1.pos][0], sy = SCALE[L1.pos][1];
    furn += `<g><path d="M${sx} ${sy-4}V${sy}H${sx+qm}V${sy-4}" fill="none" stroke="#1f3a32" stroke-width="1"/><rect x="${sx}" y="${sy-2}" width="${qm/2}" height="2" fill="#1f3a32"/>`
      + tx(sx + qm + 5, sy - 0.5, `font-weight="600" ${halo}`, 'Quarter mile') + `</g>`;
    el.innerHTML = '';
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('width', W + 'pt'); s.setAttribute('height', H + 'pt'); s.setAttribute('viewBox', `0 0 ${W} ${H}`);
    s.setAttribute('font-family', fam); s.setAttribute('font-size', LBL*F); s.setAttribute('fill', '#1f3a32');
    s.innerHTML = svg.replace('</defs>', defs + '</defs>') + marks + texts + furn + '</g>';
    el.appendChild(s);
    el.dataset.scale = k.toFixed(3);
    return issues;
  };
})();
