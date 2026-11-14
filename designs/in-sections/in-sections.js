/* Portrait book-fold helpers (data, photos, captions, plan placement, contact card loader, print checks).
   One 11 x 17 sheet folded into four upright 8.5 x 11 pages (612 x 792 pt panels, 9 pt bleed). Lengths are pt. */
(function(){
  const PG = {};
  const esc = PG.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pt = px => px*72/96;
  PG.pt = pt;
  PG.data = () => JSON.parse(document.getElementById('brochure-data').textContent || '{}');
  PG.cfg = {lh: 13, nm: 15, lead: {lh: 15, nm: 20}};

  // the standard contact card (templates/_shared/agentcard.js here, /designs/shared/agentcard.js on the site)
  const ME = document.currentScript && document.currentScript.src;
  PG.cardReady = window.ContactCard ? Promise.resolve() : new Promise(res => {
    const add = (rel, next) => { const el = document.createElement('script'); el.src = new URL(rel, ME || location.href).href; el.onload = res; el.onerror = next || res; document.head.appendChild(el); };
    add('../engine/agentcard.js', () => add('../shared/agentcard.js'));
  });

  // ---------- photos ----------
  PG.src = (D, id) => (D.photos && D.photos[id] && D.photos[id].src) || '';
  PG.photo = (D, id, x, y, w, h, extra) =>
    `<div class="ph abs" data-photo="${esc(id||'')}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${extra||''}">${id && PG.src(D,id) ? `<img src="${esc(PG.src(D,id))}" alt="">` : ''}</div>`;
  // Fit each photo in its frame: keep the focal point, and keep a whole house whole (a house box [x0,y0,x1,y1] in fractions
  // stays inside the frame; if no placement can, say so).
  PG.fitPhotos = function(D){
    const issues = [];
    document.querySelectorAll('.ph').forEach(el => {
      const img = el.querySelector('img'), p = (D.photos||{})[el.dataset.photo] || {};
      if(!img || !p.w || !p.h) return;
      const cw = el.clientWidth, ch = el.clientHeight, s = Math.max(cw/p.w, ch/p.h);
      const vx = Math.min(1, cw/(p.w*s)), vy = Math.min(1, ch/(p.h*s));
      const fx = (p.focusX != null ? p.focusX : 50)/100, fy = (p.focusY != null ? p.focusY : 50)/100;
      let ox = fx, oy = fy; const b = p.box;
      if(b){ ox = (b[0]+b[2])/2; oy = (b[1]+b[3])/2; }
      else if(p.fullHouse || /\b(front|rear|back|side) exterior\b/i.test(p.tags||'')){ oy = vy/2; }
      const x0 = Math.min(1-vx, Math.max(0, ox - vx/2)), y0 = Math.min(1-vy, Math.max(0, oy - vy/2));
      img.style.objectPosition = `${vx < 1 ? x0/(1-vx)*100 : 50}% ${vy < 1 ? y0/(1-vy)*100 : 50}%`;
      if(b){ const tol = 0.004;
        if(b[0] < x0 - tol || b[2] > x0 + vx + tol || b[1] < y0 - tol || b[3] > y0 + vy + tol)
          issues.push({slot: el.dataset.photo, kind:'house-cut-off', detail:`frame shows ${Math.round(vx*100)} x ${Math.round(vy*100)}% of the photo, the house needs ${Math.round((b[2]-b[0])*100)} x ${Math.round((b[3]-b[1])*100)}%`});
      }
    });
    return issues;
  };
  window.photoPlacements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));

  // ---------- captions: NAME  detail, then lines of text ----------
  PG.txt = x => Array.isArray(x) ? (PG.fitMode ? x[0] : x.join(' ')) : (x == null ? '' : x);
  const K = kind => kind === 'l' ? PG.cfg.lead : PG.cfg;
  PG.capH = (lines, kind) => { const k = K(kind); return k.nm + 2 + lines*k.lh; };
  PG.need = (text, w, kind) => {
    const k = K(kind), m = document.createElement('div');
    m.className = 'cap ' + (kind === 'l' ? 'lead' : ''); m.innerHTML = '<div class="tx"></div>'; const tx = m.firstChild; tx.textContent = PG.txt(text);
    m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt`; tx.style.height = 'auto';
    document.body.appendChild(m); const n = Math.max(1, Math.round(tx.getBoundingClientRect().height*72/96/k.lh)); m.remove(); return n;
  };
  // o: {lines, kind}
  PG.cap = (c, slot, x, y, w, o) => {
    c = c || {}; o = o || {};
    const kind = o.kind || 'd', k = K(kind), lines = o.lines || PG.need(c.text, w, kind);
    return `<div class="cap ${kind === 'l' ? 'lead' : ''} abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${PG.capH(lines, kind)}pt">
      <div class="nm" data-slot="${slot}.name" data-lines="1"><b>${esc(c.name)}</b>${c.tag ? `<span>${esc(c.tag)}</span>` : ''}</div>
      <div class="tx" data-slot="${slot}.text" data-lines="${lines}" data-nmin="${o.min || lines}" data-nmax="${o.max || lines}" data-cap="1" data-w="${w}" style="height:${lines*k.lh}pt">${esc(PG.txt(c.text))}</div></div>`;
  };
  // lines a caption sets in: copy.lines[slot], else the default
  PG.lines = (D, slot, dflt) => ((D.copy||{}).lines || {})[slot] || dflt;
  PG.kick = (t, slot, x, y, w) => `<div class="abs kick" style="left:${x}pt;top:${y}pt;width:${w||554}pt;height:10pt" data-slot="${slot}" data-lines="1">${esc(t)}</div>`;
  PG.rule = (x, y, w, cls) => `<div class="rule ${cls||''}" style="left:${x}pt;top:${y}pt;width:${w}pt"></div>`;
  // a paragraph box: exactly n lines (data-cap lets the copy fit pick the sentences), last line at least 3/4 full
  PG.para = (text, slot, x, y, w, n, lh, cls, fs) => `<div class="abs ${cls||'body'}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*lh}pt;line-height:${lh}pt;${fs ? `font-size:${fs}pt;` : ''}" data-slot="${slot}" data-lines="${n}" data-nmin="${n}" data-nmax="${n}" data-cap="1" data-w="${w}">${esc(PG.txt(text))}</div>`;
  PG.logo = (D, x, y, w, h, align) => {
    const b = D.brand || {};
    return `<div class="logo" data-maxh="${h}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;justify-content:${align||'flex-end'}">${b.logo ? `<img src="${esc(b.logo)}" alt="" data-slot="broker.logo">` : `<span style="font:700 ${h*0.6}pt/1 var(--font-display);white-space:nowrap" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span>`}</div>`;
  };
  PG.fitLogos = () => document.querySelectorAll('.logo img').forEach(img => {
    const box = img.parentElement, a = img.naturalWidth/img.naturalHeight || 3;
    const W = pt(box.clientWidth), H = pt(box.clientHeight);
    let h = Math.min(H, W/a); img.style.height = h+'pt'; img.style.width = (h*a)+'pt';
  });
  // places around the house: rows of name and distance
  PG.places = (list, slot, x, y, w, rowH, cls) => `<div class="abs places ${cls||''}" style="left:${x}pt;top:${y}pt;width:${w}pt">${(list||[]).map((p, i) => `<div class="r" style="height:${rowH}pt"><div class="p" data-slot="${slot}${i}.p" data-lines="1">${esc(p.p)}</div><div class="d" data-slot="${slot}${i}.d" data-lines="1">${esc(p.d)}${p.u ? ` ${esc(p.u)}` : ''}</div></div>`).join('')}</div>`;


  // a paragraph measured off the page: {lines, last (the last line's share of the width)}
  PG.measure = (text, w, fs, lh) => {
    let ms = PG._ms; if(!ms){ ms = PG._ms = document.createElement('div'); ms.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:normal;font-family:var(--font-body);font-weight:400'; document.body.appendChild(ms); }
    ms.style.width = w + 'pt'; ms.style.fontSize = fs + 'pt'; ms.style.lineHeight = lh + 'pt'; ms.textContent = text;
    const rg = document.createRange(); rg.selectNodeContents(ms); const rows = [];
    [...rg.getClientRects()].filter(r => r.width > .5).forEach(r => { const row = rows.find(x => Math.abs(x.top - r.top) < lh*.5); if(row) row.right = Math.max(row.right, r.right); else rows.push({top: r.top, right: r.right}); });
    const box = ms.getBoundingClientRect(), last = rows.length ? rows[rows.length - 1] : null;
    // the widest word gap justifying would open on a line above the last, in normal spaces (word-gap-wide fails past 3.5)
    let gap = 1; if(rows.length > 1){ const node = ms.firstChild, re = /\S+/g, r2 = document.createRange(), cnt = rows.map(() => 0); let m;
      while(node && (m = re.exec(node.nodeValue))){ r2.setStart(node, m.index); r2.setEnd(node, m.index + m[0].length); const q = r2.getBoundingClientRect(); if(q.width <= .5) continue;
        const k = rows.findIndex(x => Math.abs(x.top - q.top) < lh*.5*96/72 + 2); if(k >= 0) cnt[k]++; }
      const sp = fs*0.26*96/72; rows.slice(0, -1).forEach((r, i) => { if(cnt[i] > 1) gap = Math.max(gap, (sp + (box.width - (r.right - box.left))/(cnt[i] - 1))/sp); }); }
    return {lines: rows.length, last: last && box.width ? Math.min(1, (last.right - box.left)/box.width) : 0, gap};
  };
  // a write-up set to fill its width (owner 11/9 p35, rules 5 and 8): the whole text, never shorter; the type moves between fsLo and fsHi
  // until the last line runs 90%+ of the width (then every line is justified to the edge), at most maxLines lines. Prefers type near fsT.
  PG.fitPara = (text, w, o) => { o = o || {}; const lr = o.lr || 1.42, lo = o.fsLo || 10, hi = o.fsHi || 12.5, T = o.fsT || hi, ml = o.maxLines || 99, mh = o.maxH || 1e9; let best = null;
    for(let fs = lo; fs <= hi + 1e-6; fs += 0.125){ const lh = Math.round(fs*lr*4)/4, m = PG.measure(text, w, fs, lh); if(m.lines > ml || m.lines*lh > mh || !m.lines) continue;
      const sc = (m.last >= .9 ? 2 : m.last >= .82 ? 1.6 : -2) + (m.gap <= 3.2 ? 1 : 0) + m.last - Math.abs(fs - T)/3; if(!best || sc > best.sc) best = {sc, fs, lh, lines: m.lines, last: m.last, gap: m.gap}; }
    return best; };
  // a fitted paragraph box: justified, the last line run to the edge too when it is 90%+ full
  PG.paraFit = (text, slot, x, y, w, f, cls) => `<div class="abs ${cls||'body'}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${f.lines*f.lh}pt;font-size:${f.fs}pt;line-height:${f.lh}pt;text-align:justify;text-align-last:${f.last >= .9 ? 'justify' : 'left'}" data-slot="${slot}" data-lines="${f.lines}" data-para="1" data-pf="${f.fs}">${esc(text)}</div>`;
  // CapFit (the shared caption fitter) treats a write-up near a photo as that photo's caption; a fitted paragraph keeps its own fit
  PG.keepFits = () => document.querySelectorAll('[data-pf]').forEach(el => { if(el.__pfText == null) return; el.textContent = el.__pfText; el.style.fontSize = el.dataset.pf + 'pt'; el.style.letterSpacing = ''; el.style.textAlign = 'justify'; el.style.textAlignLast = el.__pfLast; if(window.CapFit && CapFit.gapsTooWide(el)){ el.style.textAlign = 'left'; el.style.textAlignLast = 'left'; } });
  PG.markFits = () => document.querySelectorAll('[data-pf]').forEach(el => { el.__pfText = el.textContent; el.__pfLast = el.style.textAlignLast; });

  // a caption's small detail drops out when name and detail do not fit one line
  PG.fitTags = () => document.querySelectorAll('.cap .nm').forEach(el => { if(el.scrollWidth > el.clientWidth + 1){ const sp = el.querySelector('span'); if(sp) sp.style.display = 'none'; } });
  // the floor-by-floor room list with real writing (the back's no-plan fill): blocks [{label, rooms [[name, size]], text}]
  // (owner 11/9, rules 5 and 8: each floor's write-up keeps its whole text, justified, its last line 90%+ where the type allows; one
  // type size for every floor, the largest that fits the column, so the write-ups fill the height instead of leaving gaps between floors)
  PG.roomList = (D, blocks, slot, x, y, w, h) => {
    blocks = blocks || []; let rowH = 15; const headH = 20, txt = blocks.map(b => PG.txt(b.text)), nRows = blocks.reduce((a, b) => a + b.rooms.length, 0);
    const fixed = blocks.reduce((a, b) => a + headH + b.rooms.length*rowH + 6, 0) + 10*Math.max(0, blocks.length - 1);
    // each floor's write-up takes the type (9.5 to 12.5 pt, near a common size) that fills its last line; the common size steps down
    // until all of them fit the column
    let fits = null;
    for(let T = 11.5; T >= 9.25 - 1e-6; T -= 0.25){ const fl = txt.map(t => PG.fitPara(t, w, {fsLo: Math.max(9, T - 1), fsHi: Math.min(12.5, T + 1), fsT: T, lr: 1.4}));
      if(fl.some(f => !f)) continue; const used = fixed + fl.reduce((a, f) => a + f.lines*f.lh, 0);
      if(used > h) continue; const ok = fl.every(f => f.last >= .85); if(!fits || (ok && !fits.ok)) fits = {fl, used, ok}; if(ok) break; }
    if(!fits){ const fl = txt.map(t => PG.fitPara(t, w, {fsLo: 8.5, fsHi: 9.5, lr: 1.36})); fits = {fl, used: fixed + fl.reduce((a, f) => a + (f ? f.lines*f.lh : 0), 0), ok: false}; }
    // the height left over goes first to taller room rows (up to 23 pt), then to the space between the floors
    if(nRows && h > fits.used){ const add = Math.min(8, (h - fits.used)*0.7/nRows); rowH += add; fits.used += add*nRows; }
    const gap = blocks.length > 1 ? Math.max(10, (h - fits.used + 10*(blocks.length - 1))/(blocks.length - 1)) : 0; let yy = y, out = '';
    blocks.forEach((b, i) => {
      out += `<div class="abs rl-h" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${headH - 4}pt" data-slot="${slot}${i}.head" data-lines="1">${esc(b.label)}</div>`; yy += headH;
      b.rooms.forEach((r, k) => { out += `<div class="abs rl-r" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${rowH}pt;line-height:${rowH + 1}pt;font-size:${rowH > 18 ? 10.5 : 9.5}pt"><span data-slot="${slot}${i}.r${k}.n" data-lines="1">${esc(r[0])}</span><i data-slot="${slot}${i}.r${k}.s" data-lines="1" data-optional="1">${esc(r[1] || '')}</i></div>`; yy += rowH; });
      yy += 6; const f = fits.fl[i]; if(f){ out += PG.paraFit(txt[i], `${slot}${i}`, x, yy, w, f); yy += f.lines*f.lh; } yy += gap;
    });
    return {html: out, over: fits.used > h + 1, used: fits.used};
  };


  // A paragraph whose last line comes up short is set on a slightly narrower column (never more than 14% of its width, never a new
  // line) until the last line is nearly full.
  PG.balance = el => {
    el.style.maxWidth = ''; const w0 = el.getBoundingClientRect().width; let [k, f] = PG.lineFill(el);
    if(k < 2 || f >= 0.78) return;
    for(let p = 2; p <= Math.floor(w0*0.14); p += 2){
      el.style.maxWidth = (w0 - p) + 'px'; const [k2, f2] = PG.lineFill(el);
      if(k2 > k){ el.style.maxWidth = (w0 - p + 2) + 'px'; return; }
      if(f2 >= 0.8) return;
    }
    el.style.maxWidth = '';
  };

  // ---------- facts ----------
  const n = v => Number(v).toLocaleString('en-US');
  // [big, small label] per fact
  PG.facts = L => {
    const f = [];
    if(L.beds) f.push([L.beds, `Bedroom${L.beds == 1 ? '' : 's'}`]);
    if(L.baths){ const bt = BD.bathsText(L), m = bt.main.match(/^(\S+) (.*)$/); f.push([m[1], m[2]]); if(bt.half) f.push([L.halfBaths, 'Half Baths']); }
    if(L.sqft) f.push([n(L.sqft), 'Sq Ft']);
    if(L.yearBuilt || L.year) f.push([L.yearBuilt || L.year, 'Year Built']);
    else if(L.stories) f.push([L.stories, +L.stories === 1 ? 'Story' : 'Stories']);
    return f;
  };
  PG.floodStated = desc => String(desc||'').split(/(?<=[.!?])\s+/).some(s => /\b(never\s+(been\s+)?flooded|(has|have)\s+(not|never)\s+(ever\s+)?(been\s+)?flooded)\b/i.test(s));

  // ---------- floor plan: the agent's own drawing, placed as given ----------
  // plan.levels: [{name, photo, w, h}] (px of a clear-background cut). Every level at one scale. One level: no label; two or
  // more: labeled by floor. The drawing turns a quarter turn when that prints it a third larger or more (never redrawn).
  PG.planOK = D => !!(D.plan && (D.plan.levels || []).some(l => l.kind === 'image' && l.src));
  PG.plan = (D, box) => {
    // (owner 11/10/2026: only the listing's own plan image is ever placed; a level that is not one draws nothing)
    const P = D.plan, lv0 = ((P && P.levels) || []).filter(l => l.kind === 'image' && l.src); if(!lv0.length) return {html:'', issues:[], used:null};
    const lv = lv0.map(l => Object.assign({}, l)), GAP = 22, LAB = lv.length > 1 ? 14 : 0, issues = [];
    const layout = (ang, cols) => {
      const side = ang === 90, sz = lv.map(l => side ? {w:l.h, h:l.w} : {w:l.w, h:l.h}), rows = Math.ceil(lv.length/cols);
      const grid = [...Array(rows)].map((_, r) => lv.map((l, i) => i).filter(i => Math.floor(i/cols) === r));
      const colW = [...Array(cols)].map((_, c) => Math.max(...grid.map(g => g[c] !== undefined ? sz[g[c]].w : 0)));
      const rowH = grid.map(g => Math.max(...g.map(i => sz[i].h)));
      const s = Math.min((box.w - GAP*(cols-1)) / colW.reduce((a,b)=>a+b,0), (box.h - (LAB+4)*rows - GAP*0.6*(rows-1)) / rowH.reduce((a,b)=>a+b,0));
      return {ang, cols, rows, sz, grid, colW, rowH, s, area: sz.reduce((a,z)=>a + z.w*z.h*s*s, 0)};
    };
    let best = null;
    for(const cols of [...Array(lv.length)].map((_, i) => i + 1)){
      const up = layout(0, cols), tu = layout(90, cols);
      const pick = tu.area >= up.area*1.33 ? tu : up;
      if(!best || pick.area > best.area) best = pick;
    }
    const A = best, gridW = A.colW.reduce((a,b)=>a+b,0)*A.s + GAP*(A.cols-1), gridH = A.rowH.reduce((a,b)=>a+b,0)*A.s + (LAB+4)*A.rows + GAP*0.6*(A.rows-1);
    const x0 = box.x + (box.w - gridW)/2, y0 = box.y + (box.h - gridH)/2;
    let html = '';
    A.grid.forEach((g, r) => g.forEach((i, c) => {
      const l = lv[i], w = A.sz[i].w*A.s, h = A.sz[i].h*A.s;
      const cx = x0 + A.colW.slice(0,c).reduce((a,b)=>a+b,0)*A.s + GAP*c + (A.colW[c]*A.s - w)/2;
      const cy = y0 + A.rowH.slice(0,r).reduce((a,b)=>a+b,0)*A.s + ((LAB+4) + GAP*0.6)*r + (LAB+4);
      const uw = l.w*A.s, uh = l.h*A.s, ppi = l.w / (uw/72);
      if(ppi < 300) issues.push({slot:`plan.${i}`, kind:'plan-under-300ppi', ppi:Math.round(ppi)});
      if(LAB) html += `<div class="plan flr" style="left:${cx - 20}pt;top:${cy - LAB - 4}pt;width:${w+40}pt;height:10pt" data-slot="plan.floor${i}" data-lines="1">${esc(l.name)}</div>`;
      html += `<div class="plan lv" style="left:${cx}pt;top:${cy}pt;width:${w}pt;height:${h}pt"><div class="in" style="left:${(w-uw)/2}pt;top:${(h-uh)/2}pt;width:${uw}pt;height:${uh}pt;${A.ang===90?'transform:rotate(90deg);':''}"><img src="${esc(l.src)}" alt="" data-plan="1"></div></div>`;
    }));
    return {html, issues, used:{x:x0, y:y0, w:gridW, h:gridH, ang:A.ang}};
  };

  // ---------- print checks ----------
  PG.lines2 = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const tops = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5).map(q => q.top).sort((a,b)=>a-b);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
    let k = 0, last = -1e9; for(const t of tops){ if(t - last > lh*0.5){ k++; last = t; } } return k;
  };
  PG.textWidth = el => { const r = document.createRange(); r.selectNodeContents(el); return pt(r.getBoundingClientRect().width); };
  PG.lineFill = el => {   // [number of lines, last line width / box width]
    const r = document.createRange(); r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter(q => q.width > .5);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12, lines = [];
    for(const q of rects){ const l = lines.find(x => Math.abs(x.top - q.top) < lh*0.5); if(l){ l.l = Math.min(l.l,q.left); l.r = Math.max(l.r,q.right); } else lines.push({top:q.top,l:q.left,r:q.right}); }
    lines.sort((a,b)=>a.top-b.top);
    const last = lines[lines.length-1]; return [lines.length, last ? (last.r-last.l)/el.getBoundingClientRect().width : 0];
  };
  PG.check = function(D, extra){
    const issues = [...(extra||[])];
    const banned = /\b(rebuilt|virtually staged|qr code|lorem|ipsum|placeholder|tbd|hcad)\b/i;
    const flood = PG.floodStated((D.listing||{}).description);
    document.querySelectorAll('[data-slot]').forEach(el=>{
      const name = el.dataset.slot, cs = getComputedStyle(el), txt = el.textContent.trim();
      if(el.closest('.cc')) return;
      if(!el.offsetParent && cs.position !== 'fixed' && !el.closest('.panel')) return;
      const size = parseFloat(cs.fontSize)*72/96, max = +el.dataset.lines || 0, oneLine = cs.whiteSpace === 'nowrap';
      const over = oneLine ? el.scrollWidth > el.clientWidth + 1 : max ? PG.lines2(el) > max || el.scrollWidth > el.clientWidth + 1 : el.scrollHeight > el.clientHeight + 1;
      if(over) issues.push({slot:name, kind:'overflow', text:txt.slice(0,80), ...(max && !oneLine ? {lines:PG.lines2(el), max} : {})});
      if(size < 8 - .05 && !el.dataset.fine) issues.push({slot:name, kind:'type-too-small', size:+size.toFixed(1)});
      if(size < 6 - .05) issues.push({slot:name, kind:'fine-print-below-6pt', size:+size.toFixed(1)});
      if(!txt && !el.dataset.optional && el.tagName !== 'IMG') issues.push({slot:name, kind:'empty-slot'});
      if(/\$\s?\d/.test(txt)) issues.push({slot:name, kind:'price', text:txt.slice(0,80)});
      if(!flood && /flood/i.test(txt)) issues.push({slot:name, kind:'flood-not-stated', text:txt.slice(0,80)});
      if(!D.sample && /\b(avery morgan|any brokerage|your brokerage|your website)\b/i.test(txt)) issues.push({slot:name, kind:'placeholder', text:txt.slice(0,80)});
      const bm = txt.match(banned); if(bm) issues.push({slot:name, kind:'banned-phrase', text:bm[0]});
    });
    // paragraphs and captions: the box is filled, the last line at least 3/4 full
    document.querySelectorAll('[data-cap]').forEach(el=>{
      if(!el.textContent.trim()) return;
      const mn = +el.dataset.nmin || +el.dataset.lines, mx = +el.dataset.nmax || +el.dataset.lines, [k, fill] = PG.lineFill(el);
      if(k < mn || k > mx) issues.push({slot:el.dataset.slot, kind:'box-not-full', lines:k, wanted:mn === mx ? mn : mn + '-' + mx});
      else if(k >= 2 && fill < 0.75) issues.push({slot:el.dataset.slot, kind:'last-line-short', pct:Math.round(fill*100)});
    });
    document.querySelectorAll('.ph').forEach(el=>{
      const img = el.querySelector('img'), slot = el.dataset.photo || 'photo';
      if(!img){ issues.push({slot, kind:'empty-photo-slot'}); return; }
      if(!img.complete || !img.naturalWidth){ issues.push({slot, kind:'photo-missing', src:img.getAttribute('src')}); return; }
      const wIn = el.clientWidth/96, hIn = el.clientHeight/96, ppi = Math.min(img.naturalWidth/wIn, img.naturalHeight/hIn);
      if(ppi < 300) issues.push({slot, photo:el.dataset.photo, kind:'photo-under-300ppi', ppi:Math.round(ppi), placedIn:[+wIn.toFixed(2),+hIn.toFixed(2)]});
      const a = el.clientWidth/el.clientHeight; if(a > 3.2 || a < 0.5) issues.push({slot, photo:el.dataset.photo, kind:'photo-frame-too-thin', ratio:+a.toFixed(2)});
    });
    const seen = {}; document.querySelectorAll('.ph[data-photo]').forEach(el => { const id = el.dataset.photo; if(id){ if(seen[id]) issues.push({slot:id, kind:'photo-twice'}); seen[id] = 1; } });
    // logos: one per open spread (outside: the contact card's; inside: none or one)
    const pages = {}; document.querySelectorAll('.page').forEach(pg => pages[pg.dataset.page] = pg);
    const cnt = names => names.reduce((a, nm) => a + (pages[nm] ? [...pages[nm].querySelectorAll('.logo img, .logo [data-slot="broker.name"], .cc-logo img, .cc-brkname')].filter(e => e.offsetParent).length : 0), 0);
    const spread = (names, label, ok) => { if(names.some(nm => pages[nm])){ const k = cnt(names); if(!ok.includes(k)) issues.push({slot:'logo', kind:'logo-count', spread:label, found:k, want:ok.join(' or ')}); } };
    spread(['front','back','outside'], 'outside', [1]); spread(['left','right','inside'], 'inside', [0, 1]);
    if(window.ContactCard) issues.push(...ContactCard.check(document));
    return issues;
  };
  window.PG = PG;
})();

/* Bath wording (owner 11/1/2026; templates/_shared/baths.js): load it here for every page of this set, and wrap the "½" so it takes the shared full-size style wherever it lands in text. */
(function(){
  if(!window.BD || !BD.bathsText) document.write('<script src="../engine/baths.js"><\/script>');
  const wrap = root => { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), hit = [];
    while(tw.nextNode()){ const t = tw.currentNode; if(t.nodeValue.indexOf('½') >= 0 && !(t.parentNode.closest && t.parentNode.closest('.bd-half,script,style,textarea'))) hit.push(t); }
    hit.forEach(t => { const f = document.createDocumentFragment(); t.nodeValue.split('½').forEach((part, i) => { if(i){ const s = document.createElement('span'); s.className = 'bd-half'; s.textContent = '½'; f.appendChild(s); } f.appendChild(document.createTextNode(part)); }); t.parentNode.replaceChild(f, t); }); };
  const go = () => new MutationObserver(() => wrap(document.body)).observe(document.body, {childList: true, subtree: true});
  if(document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
