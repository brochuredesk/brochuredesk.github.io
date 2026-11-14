/* Outside First: helpers shared by the fold-over (data, photos, captions, plan placement, the contact card loader
   and the print checks). Lengths are pt. */
(function(){
  const OF = {};
  const esc = OF.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pt = px => px*72/96;
  OF.data = () => JSON.parse(document.getElementById('brochure-data').textContent || '{}');

  // the standard contact card (templates/_shared/agentcard.js here, /designs/shared/agentcard.js on the site)
  const ME = document.currentScript && document.currentScript.src;
  OF.cardReady = window.ContactCard ? Promise.resolve() : new Promise(res => {
    const add = (rel, next) => { const el = document.createElement('script'); el.src = new URL(rel, ME || location.href).href; el.onload = res; el.onerror = next || res; document.head.appendChild(el); };
    add('../engine/agentcard.js', () => add('../shared/agentcard.js'));
  });

  // ---------- photos ----------
  OF.src = (D, id) => (D.photos && D.photos[id] && D.photos[id].src) || '';
  OF.fullHouse = (D, id) => {
    const p = (D.photos||{})[id] || {};
    if(p.fullHouse != null) return !!p.fullHouse;
    return /\b(front|rear|back|side) exterior\b|\bfull house\b/i.test(p.tags||'');
  };
  // a whole-house shot is pinned to its top edge: whatever height it loses comes off the ground, never the roof
  OF.pos = (D, id) => {
    const p = (D.photos||{})[id] || {};
    const fx = p.focusX != null ? p.focusX : 50;
    if(p.focusY != null) return `${fx}% ${p.focusY}%`;
    return OF.fullHouse(D, id) ? `${fx}% 0%` : `${fx}% 50%`;
  };
  OF.photo = (D, id, x, y, w, h, extra) =>
    `<div class="ph abs" data-photo="${esc(id||'')}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${extra||''}">${id && OF.src(D,id) ? `<img src="${esc(OF.src(D,id))}" style="object-position:${OF.pos(D,id)}" alt="">` : ''}</div>`;
  window.photoPlacements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));

  // ---------- captions: NAME  detail, then lines of text ----------
  OF.txt = x => Array.isArray(x) ? (OF.fitMode ? x[0] : x.join(' ')) : (x == null ? '' : x);
  OF.capH = lines => 12 + lines*11;
  // lines a caption's text sets in at width w pt (8.5 / 11 pt body face), measured in the page
  OF.need = (text, w) => {
    const m = document.createElement('div');
    m.className = 'cap'; m.innerHTML = '<div class="tx"></div>'; const tx = m.firstChild; tx.textContent = OF.txt(text);
    m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt`; tx.style.height = 'auto';
    document.body.appendChild(m); const k = Math.max(1, Math.round(tx.getBoundingClientRect().height*72/96/11)); m.remove(); return k;
  };
  // o: {lines (box lines; measured when left out), min, max (what the fit pass may choose), pref}
  OF.cap = (c, slot, x, y, w, o) => {
    c = c || {}; o = o || {};
    const lines = o.lines || OF.need(c.text, w), mn = o.min || lines, mx = o.max || lines;
    return `<div class="cap abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${12 + lines*11}pt">
      <div class="nm" data-slot="${slot}.name" data-lines="1"><b style="font-weight:700">${esc(c.name)}</b>${c.tag ? `<span>${esc(c.tag)}</span>` : ''}</div>
      <div class="tx" data-slot="${slot}.text" data-lines="${lines}" data-nmin="${mn}" data-nmax="${mx}" data-cap="1"${c.id && (c.pool || OF.pool(c.id)) && !OF.fitMode ? ` data-pool='${esc(JSON.stringify(c.pool || OF.pool(c.id))).replace(/'/g, '&#39;')}'` : ''}${c.keep && !OF.fitMode ? ` data-keep='${esc(JSON.stringify(c.keep)).replace(/'/g, '&#39;')}'` : ''} style="height:${lines*11}pt">${esc(/^(back|front)\./.test(slot) ? OF.noRepeat(String(OF.txt(c.text)).match(/[^.!?]+[.!?]+["”’)]*|[^.!?]+$/g) || []).map(x => x.trim()).join(' ') : OF.txt(c.text))}</div></div>`;   // covers and backs: never a repeated line (owner 11/10, rule 7)
  };
  OF.kick = (t, slot, x, y, w) => `<div class="abs kick" style="left:${x}pt;top:${y}pt;width:${w||600}pt;height:10pt" data-slot="${slot}" data-lines="1">${esc(t)}</div>`;
  OF.title = (t, slot, x, y, w) => `<div class="abs title one" style="left:${x}pt;top:${y}pt;width:${w||744}pt;height:32pt" data-slot="${slot}" data-lines="1">${esc(t)}</div>`;
  OF.rule = (x, y, w) => `<div class="rule" style="left:${x}pt;top:${y}pt;width:${w}pt"></div>`;
  OF.logo = (D, x, y, w, h, align) => {
    const b = D.brand || {};
    return `<div class="logo" data-maxh="${h}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;justify-content:${align||'flex-end'}">${b.logo ? `<img src="${esc(b.logo)}" alt="" data-slot="broker.logo">` : `<span style="font:700 ${h*0.6}pt/1 var(--font-display);white-space:nowrap" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span>`}</div>`;
  };
  // a logo keeps its true shape inside its box
  OF.fitLogos = () => document.querySelectorAll('.logo img').forEach(img => {
    const box = img.parentElement, a = img.naturalWidth/img.naturalHeight || 3;
    const W = pt(box.clientWidth), H = pt(box.clientHeight);
    let h = Math.min(H, W/a); img.style.height = h+'pt'; img.style.width = (h*a)+'pt';
  });

  // ---------- facts ----------
  const n = v => Number(v).toLocaleString('en-US');
  OF.stats = L => {
    const s = [];
    if(L.beds) s.push(`${L.beds} Bedroom${L.beds==1?'':'s'}`);
    if(L.baths){ const bt = BD.bathsText(L); s.push(bt.main); if(bt.half) s.push(bt.half); }
    if(L.sqft) s.push(`${n(L.sqft)} Square Feet`);
    if(L.yearBuilt || L.year) s.push(`Built in ${L.yearBuilt || L.year}`);
    return s;
  };
  OF.place = L => [L.city, L.state].filter(Boolean).join(', ');
  OF.floodStated = desc => String(desc||'').split(/(?<=[.!?])\s+/).some(s => /\b(never\s+(been\s+)?flooded|(has|have)\s+(not|never)\s+(ever\s+)?(been\s+)?flooded)\b/i.test(s));

  // ---------- floor plan: the agent's own drawing, placed as given ----------
  // plan.levels: [{name, src, w, h}] (px of the cut, clear-background image); every level at one scale (px per foot is
  // the same on one plan). One level: no label. Two or more: labeled by floor ("First floor"). The drawing turns a
  // quarter turn clockwise when that prints it a third larger or more (never redrawn, never recolored).
  OF.plan = (D, box) => {
    const P = D.plan; if(!P || !P.levels || !P.levels.length) return {html:'', issues:[], used:null};
    const lv = P.levels.map(l => Object.assign({}, l, {src: l.src || OF.src(D, l.photo)})), GAP = 26, LAB = lv.length > 1 ? 14 : 0, issues = [];
    const layout = (ang, cols) => {
      const side = ang === 90, sz = lv.map(l => side ? {w:l.h, h:l.w} : {w:l.w, h:l.h}), rows = Math.ceil(lv.length/cols);
      const grid = [...Array(rows)].map((_, r) => lv.map((l, i) => i).filter(i => Math.floor(i/cols) === r));
      const colW = [...Array(cols)].map((_, c) => Math.max(...grid.map(g => g[c] !== undefined ? sz[g[c]].w : 0)));
      const rowH = grid.map(g => Math.max(...g.map(i => sz[i].h)));
      const s = Math.min((box.w - GAP*(cols-1)) / colW.reduce((a,b)=>a+b,0), (box.h - (LAB+4)*rows - GAP*0.6*(rows-1)) / rowH.reduce((a,b)=>a+b,0));
      return {ang, cols, rows, sz, grid, colW, rowH, s, area: sz.reduce((a,z)=>a + z.w*z.h*s*s, 0)};
    };
    let best = null;
    for(const cols of lv.length === 4 ? [4, 2] : [lv.length]){
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
  OF.lines = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const tops = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5).map(q => q.top).sort((a,b)=>a-b);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
    let k = 0, last = -1e9; for(const t of tops){ if(t - last > lh*0.5){ k++; last = t; } } return k;
  };
  OF.textWidth = el => { const r = document.createRange(); r.selectNodeContents(el); return pt(r.getBoundingClientRect().width); };
  OF.lineFill = el => {   // [number of lines, last line width / box width]
    const r = document.createRange(); r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter(q => q.width > .5);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12, lines = [];
    for(const q of rects){ const l = lines.find(x => Math.abs(x.top - q.top) < lh*0.5); if(l){ l.l = Math.min(l.l,q.left); l.r = Math.max(l.r,q.right); } else lines.push({top:q.top,l:q.left,r:q.right}); }
    lines.sort((a,b)=>a.top-b.top);
    const last = lines[lines.length-1]; return [lines.length, last ? (last.r-last.l)/el.getBoundingClientRect().width : 0];
  };
  OF.check = function(D, extra){
    const issues = [...(extra||[])];
    const banned = /\b(rebuilt|virtually staged|qr code|lorem|ipsum|placeholder|tbd)\b/i;
    const flood = OF.floodStated((D.listing||{}).description);
    document.querySelectorAll('[data-slot]').forEach(el=>{
      const name = el.dataset.slot, cs = getComputedStyle(el), txt = el.textContent.trim();
      if(!el.offsetParent && cs.position !== 'fixed' && !el.closest('.panel')) return;
      const size = parseFloat(cs.fontSize)*72/96, max = +el.dataset.lines || 0, oneLine = cs.whiteSpace === 'nowrap';
      const over = oneLine ? el.scrollWidth > el.clientWidth + 1 : max ? OF.lines(el) > max || el.scrollWidth > el.clientWidth + 1 : el.scrollHeight > el.clientHeight + 1;
      if(over) issues.push({slot:name, kind:'overflow', text:txt.slice(0,80), ...(max && !oneLine ? {lines:OF.lines(el), max} : {})});
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
      const mn = +el.dataset.nmin || +el.dataset.lines, mx = +el.dataset.nmax || +el.dataset.lines, [k, fill] = OF.lineFill(el);
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
  window.CapFit = window.CapFit || function(els){
    const stat = el => { const r = document.createRange(); r.selectNodeContents(el); const box = el.getBoundingClientRect(), lh = parseFloat(getComputedStyle(el).lineHeight) || 12, rows = [];
      for(const q of r.getClientRects()){ if(q.width < .5 || q.height < .5) continue; const l = rows.find(x => Math.abs(x.top - q.top) < lh*.5); if(l) l.r = Math.max(l.r, q.right); else rows.push({top: q.top, r: q.right}); }
      return {n: rows.length, min: rows.length ? Math.min(...rows.map(x => (x.r - box.left)/box.width)) : 0}; };
    // the widest justified word gap over a normal space (the printchecks measure): a pick whose gaps run past 2x is passed over for one that sets tighter (owner 11/10 round 2: never spread words)
    const gapRatio = el => { const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize) || 10, c = document.createElement('canvas').getContext('2d'); c.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
      const normal = c.measureText(' ').width + (parseFloat(cs.wordSpacing) || 0) + (parseFloat(cs.letterSpacing) || 0), by = {}, tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), rg = document.createRange();
      for(let n = tw.nextNode(); n; n = tw.nextNode()){ const t = n.textContent; for(let i = 0; i < t.length; i++){ if(t[i] !== ' ') continue; rg.setStart(n, i); rg.setEnd(n, i + 1); const q = rg.getBoundingClientRect(); if(q.width > 0) (by[Math.round(q.top)] = by[Math.round(q.top)] || []).push(q.width); } }
      const ks = Object.keys(by).map(Number).sort((a, b) => a - b).slice(0, -1); let w = 0; for(const k of ks) w = Math.max(w, ...by[k]); return w / normal; };
    const tight = el => { const ta = el.style.textAlign; el.style.textAlign = 'justify'; const g = gapRatio(el); el.style.textAlign = ta; return g <= 2.0; };
    for(const el of els){
      let pool; try { pool = JSON.parse(el.dataset.pool || '[]'); } catch(e){ continue; }
      pool = (/^(back|front)\./.test(el.dataset.slot || '') ? OF.noRepeat(pool.filter(Boolean)) : pool.filter(Boolean)).slice(0, 10); const n = +el.dataset.fitn || +el.dataset.lines || 0;
      if(!pool.length || !n) continue;
      const t0 = el.textContent, fs0 = parseFloat(getComputedStyle(el).fontSize), k = pool.length;
      let keepMask = 0; try { (JSON.parse(el.dataset.keep || '[]')).forEach(x => { const i = pool.indexOf(x); if(i >= 0) keepMask |= 1 << i; }); } catch(e){}
      // never shorter (owner 11/10): no pick may hold less text than the caption's own copy
      const minLen = +el.dataset.minlen || t0.trim().length;
      el.style.fontSize = ''; el.textContent = pool.join(' ');
      const s0 = stat(el), all = pool.join(' ').length, cpl0 = all/Math.max(.5, s0.n - 1 + Math.max(.3, s0.min));
      let got = null, ok80 = null;
      for(const pass of [0, 1]){ if(got || ok80) break;   // the written lead first, then a pool set without it
      for(const need of [1, 0]){ if(got || ok80) break;   // a tight set first (word gaps under 2x), then any set that fills
      for(const z of [1, 1.03, 1.06, 1.09, 1.12]){
        el.style.fontSize = (fs0*z) + 'px';
        const cpl = cpl0/z, cands = [];
        for(let m = 1; m < (1 << k); m++){
          if((m & keepMask) !== keepMask) continue;   // a caption's own pool lists the sentences it must keep (data-keep): a pick is always a superset
          if(!pass && !(m & 1)) continue;   // first pass: the first line (the existing lead) stays
          const pick = pool.filter((_, i) => m >> i & 1), len = pick.join(' ').length;
          if(len < minLen) continue;
          if(keepMask ? (len >= cpl*(n - 1 + .5) && len <= cpl*(n + .3)) : (len >= cpl*(n - 1 + .8) && len <= cpl*(n + .05))) cands.push({pick, d: Math.abs(len - cpl*(n - .06))});
        }
        cands.sort((a, b) => a.d - b.d);
        for(const c of cands.slice(0, 160)){
          el.textContent = c.pick.join(' '); const s = stat(el);
          if(s.n !== n) continue;
          if(s.min >= .9 && (!need || tight(el))){ got = c; break; }
          if(s.min >= .8 && !ok80 && (!need || tight(el))) ok80 = c;
        }
        if(got) break;
        if(ok80){ got = ok80; break; }
      }
      }
      }
      if(got){ el.textContent = got.pick.join(' '); el.style.textAlign = 'justify'; el.dataset.capfit = 'ok';
        // a pick that fills only with justified gaps past 2.6x a normal space sets ragged instead (owner, round 3: wide gaps set ragged;
        // its ragged lines already passed the 80%/90% fill above)
        if(gapRatio(el) > 2.6){ el.style.textAlign = 'left'; el.dataset.ragged = '1'; } }
      else { el.textContent = t0; el.style.fontSize = ''; el.style.textAlign = ''; el.dataset.capfit = 'no'; }
    }
  };


  // the true lines about a photo (companion.capPool: the existing lines first, then more) become optional sentences of its caption (owner 11/8: text under a photo fills its width)
  OF.extendPools = D => { const P = (D.companion || {}).capPool || {}; if(!Object.keys(P).length) return D;
    const split = t => String(t).match(/[^.!?]+[.!?]+["”’)]*|[^.!?]+$/g) || [];
    const walk = o => { if(Array.isArray(o)) o.forEach(walk); else if(o && typeof o === 'object'){
      if(o.id && typeof o.text === 'string' && P[o.id] && !o.__ext){ const e = split(o.text).length; o.__min = o.text.trim().length; o.text = P[o.id].slice(0, Math.max(e, 0) + 3).join(' '); o.__ext = 1; }
      Object.values(o).forEach(walk); } };
    walk(D.copy || {}); return D; };
  // owner 11/10 (rule 7): no phrase repeats inside a caption: a sentence that shares two content words side by side (small words
  // skipped), three content words, or its opening two words with an earlier one is left out (flyer captions; inside panels as approved)
  OF.cwords = t => (String(t).toLowerCase().match(/[a-z0-9']+/g) || []).filter(x => /\d/.test(x) || (x.length >= 4 && !/^(with|from|that|this|they|there|their|into|onto|over|under|along|beside|each|just|also|have|sits|runs|room|rooms|floor|house|home)$/.test(x)));
  OF.noRepeat = arr => { const out = [], pairs = new Set(), kept = [], opens = new Set();
    arr.forEach(x => { const v = Array.isArray(x) ? x[0] : x, w = OF.cwords(v), p = []; for(let i = 0; i + 1 < w.length; i++) p.push(w[i] + ' ' + w[i + 1]);
      const o = (String(v).toLowerCase().match(/[a-z0-9']+/g) || []).slice(0, 2).join(' '), c = new Set(w.filter(z => !/^(deck|yard)$/.test(z)).map(z => /\d/.test(z) ? z : z.slice(0, 4)));   // word stems: fence / fenced / fencing
      if(opens.has(o) || p.some(q => pairs.has(q)) || kept.some(k => { const sh = [...c].filter(z => k.has(z)); return sh.length >= 2; })) return;
      out.push(x); p.forEach(q => pairs.add(q)); kept.push(c); opens.add(o); });
    return out; };
  OF.pool = id => ((((OF.data().companion || {}).capPool) || {})[id]) || null;
  window.OF = OF;
})();

/* Bath wording (owner 11/1/2026; templates/_shared/baths.js): load it here for every page of this design; a ½ in text is set small. */
(function(){ if(!window.BD || !BD.bathPair) document.write('<script src="../engine/baths.js"><\/script><script src="../engine/baths-text.js"><\/script>'); })();
