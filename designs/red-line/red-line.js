/* The Red Line: helpers shared by the fold-over (data, photos, captions, plan placement, the contact card loader
   and the print checks). Lengths are pt. */
(function(){
  const RL = {};
  const esc = RL.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pt = px => px*72/96;
  RL.data = () => JSON.parse(document.getElementById('brochure-data').textContent || '{}');

  // the standard contact card (templates/_shared/agentcard.js here, /designs/shared/agentcard.js on the site)
  const ME = document.currentScript && document.currentScript.src;
  RL.cardReady = window.ContactCard ? Promise.resolve() : new Promise(res => {
    const add = (rel, next) => { const el = document.createElement('script'); el.src = new URL(rel, ME || location.href).href; el.onload = res; el.onerror = next || res; document.head.appendChild(el); };
    add('../engine/agentcard.js', () => add('../shared/agentcard.js'));
  });

  // ---------- photos ----------
  RL.src = (D, id) => (D.photos && D.photos[id] && D.photos[id].src) || '';
  RL.fullHouse = (D, id) => {
    const p = (D.photos||{})[id] || {};
    if(p.fullHouse != null) return !!p.fullHouse;
    return /\b(front|rear|back|side) exterior\b|\bfull house\b/i.test(p.tags||'');
  };
  // a whole-house shot is pinned to its top edge: whatever height it loses comes off the ground, never the roof
  RL.pos = (D, id) => {
    const p = (D.photos||{})[id] || {};
    const fx = p.focusX != null ? p.focusX : 50;
    if(p.focusY != null) return `${fx}% ${p.focusY}%`;
    return RL.fullHouse(D, id) ? `${fx}% 0%` : `${fx}% 50%`;
  };
  RL.photo = (D, id, x, y, w, h, extra) =>
    `<div class="ph abs" data-photo="${esc(id||'')}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${extra||''}">${id && RL.src(D,id) ? `<img src="${esc(RL.src(D,id))}" style="object-position:${RL.pos(D,id)}" alt="">` : ''}</div>`;
  window.photoPlacements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));

  // ---------- captions: NAME  detail, then lines of text ----------
  RL.txt = x => Array.isArray(x) ? (RL.fitMode ? x[0] : x.join(' ')) : (x == null ? '' : x);
  RL.capH = (lines, big) => (big ? 19 : 14) + lines*11;
  // lines a caption's text sets in at width w pt (8.5 / 11 pt body face), measured in the page
  RL.need = (text, w) => {
    const m = document.createElement('div');
    m.className = 'cap'; m.innerHTML = '<div class="tx"></div>'; const tx = m.firstChild; tx.textContent = RL.txt(text);
    m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt`; tx.style.height = 'auto';
    document.body.appendChild(m); const k = Math.max(1, Math.round(tx.getBoundingClientRect().height*72/96/11)); m.remove(); return k;
  };
  // o: {lines (box lines), min, max (what the fit pass may choose), big (a lead: larger title)}
  RL.cap = (c, slot, x, y, w, o) => {
    c = c || {}; o = o || {};
    const lines = o.lines || RL.need(c.text, w), mn = o.min || lines, mx = o.max || lines, nh = o.big ? 19 : 14;
    return `<div class="cap abs${o.big ? ' big' : ''}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${nh + lines*11}pt">
      <div class="nm" data-slot="${slot}.name" data-lines="1" style="height:${nh}pt"><b>${esc(c.name)}</b>${c.tag ? `<span>${esc(c.tag)}</span>` : ''}</div>
      <div class="tx" data-slot="${slot}.text" data-lines="${lines}" data-nmin="${mn}" data-nmax="${mx}" data-cap="1"${c.id && (c.pool || RL.pool(c.id)) && !RL.fitMode ? ` data-pool='${esc(JSON.stringify(c.pool || RL.pool(c.id))).replace(/'/g, '&#39;')}'` : ''}${c.keep && !RL.fitMode ? ` data-keep='${esc(JSON.stringify(c.keep)).replace(/'/g, '&#39;')}'` : ''} style="height:${lines*11}pt">${esc(RL.txt(c.text))}</div></div>`;
  };
  RL.kick = (t, slot, x, y, w) => `<div class="abs kick" style="left:${x}pt;top:${y}pt;width:${w||600}pt;height:11pt" data-slot="${slot}" data-lines="1">${esc(t)}</div>`;
  RL.title = (t, slot, x, y, w) => `<div class="abs title one" style="left:${x}pt;top:${y}pt;width:${w||744}pt;height:32pt" data-slot="${slot}" data-lines="1">${esc(t)}</div>`;
  RL.rule = (x, y, w) => `<div class="rule" style="left:${x}pt;top:${y}pt;width:${w}pt"></div>`;
  RL.logo = (D, x, y, w, h, align) => {
    const b = D.brand || {};
    return `<div class="logo" data-maxh="${h}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;justify-content:${align||'flex-end'}">${b.logo ? `<img src="${esc(b.logo)}" alt="" data-slot="broker.logo">` : `<span style="font:700 ${h*0.6}pt/1 var(--font-display);white-space:nowrap" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span>`}</div>`;
  };
  // a logo keeps its true shape inside its box
  RL.fitLogos = () => document.querySelectorAll('.logo img').forEach(img => {
    const box = img.parentElement, a = img.naturalWidth/img.naturalHeight || 3;
    const W = pt(box.clientWidth), H = pt(box.clientHeight);
    let h = Math.min(H, W/a); img.style.height = h+'pt'; img.style.width = (h*a)+'pt';
  });

  // ---------- facts ----------
  const n = v => Number(v).toLocaleString('en-US');
  RL.facts = L => {   // the cover's four-fact row: {v, l}
    const s = [];
    if(L.beds) s.push({v: String(L.beds), l: L.beds == 1 ? 'Bedroom' : 'Bedrooms'});
    if(L.baths) BD.bathCells(L).forEach(c => s.push({v: c[0], l: c[1]}));
    if(L.sqft) s.push({v: n(L.sqft), l: 'Square feet'});
    if(L.yearBuilt || L.year) s.push({v: String(L.yearBuilt || L.year), l: 'Year built'});
    else if(L.stories) s.push({v: String(L.stories), l: +L.stories == 1 ? 'Story' : 'Stories'});
    return s;
  };
  RL.place = L => [L.city, L.state].filter(Boolean).join(', ');
  RL.floodStated = desc => String(desc||'').split(/(?<=[.!?])\s+/).some(s => /\b(never\s+(been\s+)?flooded|(has|have)\s+(not|never)\s+(ever\s+)?(been\s+)?flooded)\b/i.test(s));

  // ---------- floor plan: the agent's own drawing, placed as given ----------
  // plan.levels: [{name, src, w, h}] (px of the cut, clear-background image); every level at one scale (px per foot is
  // the same on one plan). One level: no label. Two or more: labeled by floor ("First floor"). The drawing turns a
  // quarter turn clockwise when that prints it a third larger or more (never redrawn, never recolored).
  RL.plan = (D, box) => {
    const P = D.plan; if(!P || !P.levels || !P.levels.length) return {html:'', issues:[], used:null};
    const lv = P.levels.map(l => Object.assign({}, l, {src: l.src || RL.src(D, l.photo)})), GAP = 26, LAB = lv.length > 1 ? 14 : 0, issues = [];
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
      const cy = y0 + A.rowH.slice(0,r).reduce((a,b)=>a+b,0)*A.s + ((LAB+4) + GAP*0.6)*r + (LAB+4) ;
      const uw = l.w*A.s, uh = l.h*A.s, ppi = l.w / (uw/72);
      if(ppi < 300) issues.push({slot:`plan.${i}`, kind:'plan-under-300ppi', ppi:Math.round(ppi)});
      if(LAB) html += `<div class="plan flr" style="left:${cx - 20}pt;top:${cy - LAB - 4}pt;width:${w+40}pt;height:10pt" data-slot="plan.floor${i}" data-lines="1">${esc(l.name)}</div>`;
      html += `<div class="plan lv" style="left:${cx}pt;top:${cy}pt;width:${w}pt;height:${h}pt"><div class="in" style="left:${(w-uw)/2}pt;top:${(h-uh)/2}pt;width:${uw}pt;height:${uh}pt;${A.ang===90?'transform:rotate(90deg);':''}"><img src="${esc(l.src)}" alt="" data-plan="1"></div></div>`;
    }));
    return {html, issues, used:{x:x0, y:y0, w:gridW, h:gridH, ang:A.ang}};
  };

  // ---------- print checks ----------
  RL.lines = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const tops = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5).map(q => q.top).sort((a,b)=>a-b);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
    let k = 0, last = -1e9; for(const t of tops){ if(t - last > lh*0.5){ k++; last = t; } } return k;
  };
  RL.textWidth = el => { const r = document.createRange(); r.selectNodeContents(el); return pt(r.getBoundingClientRect().width); };
  RL.lineFill = el => {   // [number of lines, last line width / box width]
    const r = document.createRange(); r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter(q => q.width > .5);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12, lines = [];
    for(const q of rects){ const l = lines.find(x => Math.abs(x.top - q.top) < lh*0.5); if(l){ l.l = Math.min(l.l,q.left); l.r = Math.max(l.r,q.right); } else lines.push({top:q.top,l:q.left,r:q.right}); }
    lines.sort((a,b)=>a.top-b.top);
    const last = lines[lines.length-1]; return [lines.length, last ? (last.r-last.l)/el.getBoundingClientRect().width : 0];
  };
  RL.check = function(D, extra){
    const issues = [...(extra||[])];
    const banned = /\b(rebuilt|virtually staged|qr code|lorem|ipsum|placeholder|tbd)\b/i;
    const flood = RL.floodStated((D.listing||{}).description);
    document.querySelectorAll('[data-slot]').forEach(el=>{
      const name = el.dataset.slot, cs = getComputedStyle(el), txt = el.textContent.trim();
      if(!el.offsetParent && cs.position !== 'fixed' && !el.closest('.panel')) return;
      const size = parseFloat(cs.fontSize)*72/96, max = +el.dataset.lines || 0, oneLine = cs.whiteSpace === 'nowrap';
      const over = oneLine ? el.scrollWidth > el.clientWidth + 1 : max ? RL.lines(el) > max || el.scrollWidth > el.clientWidth + 1 : el.scrollHeight > el.clientHeight + 1;
      if(over) issues.push({slot:name, kind:'overflow', text:txt.slice(0,80), ...(max && !oneLine ? {lines:RL.lines(el), max} : {})});
      if(size < 8 - .05 && !el.dataset.fine) issues.push({slot:name, kind:'type-too-small', size:+size.toFixed(1)});
      if(!txt && !el.dataset.optional && el.tagName !== 'IMG') issues.push({slot:name, kind:'empty-slot'});
      if(/\$\s?\d/.test(txt)) issues.push({slot:name, kind:'price', text:txt.slice(0,80)});
      if(!flood && /flood/i.test(txt)) issues.push({slot:name, kind:'flood-not-stated', text:txt.slice(0,80)});
      if(!D.sample && /\b(avery morgan|any brokerage|your brokerage|your website)\b/i.test(txt)) issues.push({slot:name, kind:'placeholder', text:txt.slice(0,80)});
      const bm = txt.match(banned); if(bm) issues.push({slot:name, kind:'banned-phrase', text:bm[0]});
    });
    // paragraphs and captions: the box is filled, the last line at least 3/4 full
    document.querySelectorAll('[data-cap]').forEach(el=>{
      if(!el.textContent.trim()) return;
      const mn = +el.dataset.nmin || +el.dataset.lines, mx = +el.dataset.nmax || +el.dataset.lines, [k, fill] = RL.lineFill(el);
      if(k < mn || k > mx) issues.push({slot:el.dataset.slot, kind:'box-not-full', lines:k, wanted:mn === mx ? mn : mn + '-' + mx});
      else if(k >= 2 && fill < 0.75) issues.push({slot:el.dataset.slot, kind:'last-line-short', pct:Math.round(fill*100)});
    });
    document.querySelectorAll('.ph').forEach(el=>{
      const img = el.querySelector('img'), slot = el.dataset.photo || 'photo';
      if(!img){ issues.push({slot, kind:'empty-photo-slot'}); return; }
      if(!img.complete || !img.naturalWidth){ issues.push({slot, kind:'photo-missing', src:img.getAttribute('src')}); return; }
      const wIn = el.clientWidth/96, hIn = el.clientHeight/96, ppi = Math.min(img.naturalWidth/wIn, img.naturalHeight/hIn);
      if(ppi < 300) issues.push({slot, photo:el.dataset.photo, kind:'photo-under-300ppi', ppi:Math.round(ppi), placedIn:[+wIn.toFixed(2),+hIn.toFixed(2)]});
    });
    // a photo never prints twice on one piece
    const seen = {}; document.querySelectorAll('.ph[data-photo]').forEach(el => { const id = el.dataset.photo; if(id){ if(seen[id]) issues.push({slot:id, kind:'photo-twice'}); seen[id] = 1; } });
    // logos: one per open spread (outside: the cover's; inside: the upper right of the top panel only)
    const logos = pg => pg.querySelectorAll('.logo img, .logo [data-slot="broker.name"], .cc-logo img, .cc-brkname, .cc-lock').length;
    const pages = {}; document.querySelectorAll('.page').forEach(pg => pages[pg.dataset.page] = pg);
    const spread = (names, label) => { const k = names.reduce((a, n) => a + (pages[n] ? [...pages[n].querySelectorAll('.logo img, .logo [data-slot="broker.name"], .cc-logo img, .cc-brkname')].filter(e => e.offsetParent).length : 0), 0);
      if(names.some(n => pages[n]) && k !== 1) issues.push({slot:'logo', kind:'logo-count', spread:label, found:k, want:1}); };
    spread(['front','back','outside'], 'outside'); spread(['top','bottom','inside'], 'inside');
    if(window.ContactCard) issues.push(...ContactCard.check(document));
    if(window.AgentCard) issues.push(...AgentCard.trec(document, [...document.querySelectorAll('.logo img')]));
    return issues;
  };
  // ---------- text under a photo fills the photo's width (owner 11/8/2026) ----------
  // A caption with a data-pool (true lines about its photo, the existing ones first) is re-set from that pool: the sentences that set in exactly
  // its box's lines with every line (set ragged) at least 90% of the width, else 80%; type up to 12% larger when that is what it takes; then justified.
  // A caption that cannot fill keeps its text, left aligned. Never shortened to meet the rule: it only gets fuller or larger.
  // owner 11/10/2026 (round 2): a small justification stretch is fine, big word gaps are not. A justified box whose lines would
  // open gaps over maxX normal spaces is set ragged instead (the fill comes from true lines and type size, never spread words).
  // owner 11/10/2026: no last line under 80% anywhere. A write-up whose last line falls short takes the type size (97% to 112%
  // of its own, in 1% steps) at which it still fits its box and its last line runs 82%+; if none does, it keeps its size.
  window.LastFit = window.LastFit || function(els, min){
    min = min || .82;
    const last = el => { const r = document.createRange(); r.selectNodeContents(el); const q = [...r.getClientRects()].filter(x => x.width > .5 && x.height > .5);
      if(!q.length) return 1; const bx = el.getBoundingClientRect(), t = Math.max(...q.map(x => x.top)), lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
      const rows = new Set(q.map(x => Math.round(x.top/(lh*.5)))).size; if(rows < 2) return 1;
      return (Math.max(...q.filter(x => Math.abs(x.top - t) < lh*.5).map(x => x.right)) - bx.left)/bx.width; };
    for(const el of els){ if(!el || !el.textContent.trim() || last(el) >= min) continue;
      const cs = getComputedStyle(el), fs0 = parseFloat(cs.fontSize), lr = (parseFloat(cs.lineHeight) || fs0*1.3)/fs0, keepF = el.style.fontSize, keepL = el.style.lineHeight;
      const hb = el.clientHeight, fixedH = !!el.style.height && el.style.height !== 'auto';
      let ok = false;
      for(const z of [1.01, 1.02, .99, 1.03, .98, 1.04, .97, 1.05, 1.06, 1.07, 1.08, 1.09, 1.1, 1.11, 1.12]){
        el.style.fontSize = (fs0*z) + 'px'; el.style.lineHeight = (fs0*z*lr) + 'px';
        for(const t of [0, .1, -.1, .2]){ el.style.letterSpacing = t ? t + 'px' : '';
          if(fixedH && el.scrollHeight > hb + 1) continue;
          if(last(el) >= min){ ok = true; break; } }
        if(ok) break; }
      if(!ok){ el.style.fontSize = keepF; el.style.lineHeight = keepL; el.style.letterSpacing = ''; } }
    if(window.NoWideGaps) NoWideGaps([...els].filter(Boolean));   // a new size never re-opens wide gaps (owner 11/12)
  };
  // the width of a normal word space in this box's type (as the print check measures it: the space glyph plus letter and word spacing)
  RL.spaceW = el => { const cs = getComputedStyle(el), c = RL._cv || (RL._cv = document.createElement('canvas').getContext('2d'));
    c.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; return c.measureText(' ').width + (parseFloat(cs.wordSpacing) || 0) + (parseFloat(cs.letterSpacing) || 0); };
  // owner 11/12: never spread words. Each justified line's own gap (its slack over its word count, plus a normal space) against the
  // real space of its type: past 1.6x, the block sets ragged (the fitters' line-fill rules are measured ragged, so they still hold).
  window.NoWideGaps = window.NoWideGaps || function(els, maxX){
    maxX = maxX || 1.6;   // reviewer5 p15: ~2x still read loose; past 1.6x the block sets ragged
    for(const el of els){ if(getComputedStyle(el).textAlign !== 'justify') continue;
      const keep = el.style.textAlign; el.style.textAlign = 'left';
      const box = el.getBoundingClientRect(), fs = parseFloat(getComputedStyle(el).fontSize) || 12, sp = RL.spaceW(el) || fs*.26, r = document.createRange(), lines = [];
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for(let n = tw.nextNode(); n; n = tw.nextNode()){ const re = /\S+/g; let m;
        while((m = re.exec(n.textContent))){ r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const q = r.getBoundingClientRect();
          let L = lines.find(l => Math.abs(l.t - q.top) < fs*.5); if(!L){ L = {t: q.top, n: 0, r: 0}; lines.push(L); } L.n++; L.r = Math.max(L.r, q.right); } }
      lines.sort((a, b) => a.t - b.t);
      const bad = lines.slice(0, -1).some(L => L.n > 1 && (box.right - L.r)/(L.n - 1) + sp > maxX*sp);
      el.style.textAlign = bad ? 'left' : (keep || 'justify'); if(bad) el.dataset.ragged = '1'; }
  };
  window.CapFit = window.CapFit || function(els){
    const stat = el => { const r = document.createRange(); r.selectNodeContents(el); const box = el.getBoundingClientRect(), lh = parseFloat(getComputedStyle(el).lineHeight) || 12, rows = [];
      for(const q of r.getClientRects()){ if(q.width < .5 || q.height < .5) continue; const l = rows.find(x => Math.abs(x.top - q.top) < lh*.5); if(l) l.r = Math.max(l.r, q.right); else rows.push({top: q.top, r: q.right}); }
      return {n: rows.length, min: rows.length ? Math.min(...rows.map(x => (x.r - box.left)/box.width)) : 0}; };
    const fitEl = (el, useKeep) => {
      let pool; try { pool = JSON.parse(el.dataset.pool || '[]'); } catch(e){ return; }
      pool = pool.filter(Boolean).slice(0, 10); const n = +el.dataset.fitn || +el.dataset.lines || 0, minl = +el.dataset.minlen || 0;   // data-minlen: never shorter than the writer's caption (owner 11/10)
      if(!pool.length || !n) return;
      const t0 = el.textContent, fs0 = parseFloat(getComputedStyle(el).fontSize), k = pool.length;
      let keepMask = 0; try { if(useKeep) (JSON.parse(el.dataset.keep || '[]')).forEach(x => { const i = pool.indexOf(x); if(i >= 0) keepMask |= 1 << i; }); } catch(e){}
      el.style.fontSize = ''; el.textContent = pool.join(' ');
      const s0 = stat(el), all = pool.join(' ').length, cpl0 = all/Math.max(.5, s0.n - 1 + Math.max(.3, s0.min));
      let got = null, ok80 = null;
      for(const pass of [0, 1]){ if(got || ok80) break;
      for(const z of [1, 1.03, 1.06, 1.09, 1.12]){
        el.style.fontSize = (fs0*z) + 'px';
        const cpl = cpl0/z, cands = [];
        for(let m = 1; m < (1 << k); m++){
          if((m & keepMask) !== keepMask) continue;   // a caption's own pool lists the sentences it must keep (data-keep): a pick is always a superset
          if(!pass && !(m & 1)) continue;   // first pass: the first line (the existing lead) stays
          const pick = pool.filter((_, i) => m >> i & 1), len = pick.join(' ').length;
          if(len < minl) continue;
          if(keepMask ? (len >= cpl*(n - 1 + .5) && len <= cpl*(n + .3)) : (len >= cpl*(n - 1 + .8) && len <= cpl*(n + .05))) cands.push({pick, d: Math.abs(len - cpl*(n - .06))});
        }
        cands.sort((a, b) => a.d - b.d);
        for(const c of cands.slice(0, 160)){
          el.textContent = c.pick.join(' '); const s = stat(el);
          if(s.n !== n) continue;
          if(s.min >= .9){ got = c; break; }
          if(s.min >= .8 && !ok80) ok80 = c;
        }
        if(got) break;
        if(ok80){ got = ok80; break; }
      }
      }
      if(got){ el.textContent = got.pick.join(' '); el.style.textAlign = 'justify'; el.dataset.capfit = 'ok'; NoWideGaps([el]); }
      else { el.textContent = t0; el.style.fontSize = ''; el.style.textAlign = ''; el.dataset.capfit = 'no'; }
    };
    // a caption's own keep list (the sentences it must hold) applies where the box can hold them; where it cannot, the pool is set freely
    for(const el of els){ fitEl(el, true); if(el.dataset.keep && el.dataset.capfit !== 'ok') fitEl(el, false); }
  };

  RL.pool = id => ((((RL.data().companion || {}).capPool) || {})[id]) || null;
  window.RL = RL;
})();

/* Bath wording (owner 11/1/2026; templates/_shared/baths.js): load it here for every page of this design; a ½ in text is set small. */
(function(){ if(!window.BD || !BD.bathPair) document.write('<script src="../engine/baths.js"><\/script><script src="../engine/baths-text.js"><\/script>'); })();
