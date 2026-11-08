/* fxs-24 helpers (ported from the swatchbook set's swatchbook.js, FX24 look): data, photos, captions and paragraphs that fill their boxes, logos, print checks, the set's tokens (FXS.tok, read from fxs24.css) and marks (icons, arch).

   Captions and paragraphs are written as a lead plus whole sentences (data-s). Each box has a line count; the fill pass
   picks the sentences, in the writer's order, that set in exactly that many lines with the last line at least 3/4 full.
   It never cuts a word or a sentence; when no set of whole sentences fits, the box is reported and goes back to the writer. */
(function(){
  const SW = {};
  const FXS = SW;
  const esc = SW.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pt = px => px*72/96;
  SW.data = () => JSON.parse(document.getElementById('brochure-data').textContent || '{}');
  // a phrase of 5 or more words never repeats inside one caption or paragraph
  const words5 = t => String(t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
  SW.rep5 = t => { const w = words5(t), seen = new Set(); for(let i = 0; i + 5 <= w.length; i++){ const k = w.slice(i, i + 5).join(' '); if(seen.has(k)) return k; seen.add(k); } return ''; };
  // a pool of sentences: no sentence twice, and no sentence that shares a 5-word phrase with an earlier one
  SW.dedupe5 = list => { const out = [], grams = new Set();
    (list || []).forEach(t => { const w = words5(t), gs = []; for(let i = 0; i + 5 <= w.length; i++) gs.push(w.slice(i, i + 5).join(' '));
      if(out.some(u => String(u).toLowerCase().slice(0, 28) === String(t).toLowerCase().slice(0, 28)) || gs.some(g => grams.has(g))) return;
      out.push(t); gs.forEach(g => grams.add(g)); });
    return out; };

  // ---------- photos ----------
  SW.src = (D, id) => (D.photos && D.photos[id] && D.photos[id].src) || '';
  SW.photo = (D, id, style, slot) => {
    const p = (D.photos||{})[id] || {};
    return `<div class="ph" data-photo="${esc(id||'')}" data-slot-photo="${esc(slot||'')}" style="${style||''}">${id && p.src ? `<img src="${esc(p.src)}" alt="">` : ''}</div>`;
  };
  // After layout: set each photo's crop from where the photo's subject sits. A photo with a house box (fractions of the
  // photo) is cropped so the whole house stays inside; the check reports it when it cannot.
  SW.focus = (D) => {
    const issues = [];
    document.querySelectorAll('.ph[data-photo]').forEach(el => {
      const p = (D.photos||{})[el.dataset.photo], img = el.querySelector('img');
      if(!p || !img) return;
      const W = p.w || img.naturalWidth, H = p.h || img.naturalHeight; if(!W || !H) return;
      const tw = el.clientWidth, th = el.clientHeight, ia = W/H, ta = tw/th;
      let fx = (p.focusX != null ? p.focusX : 50)/100, fy = (p.focusY != null ? p.focusY : 50)/100;
      const vis = ia > ta ? {w: ta/ia, h: 1} : {w: 1, h: ia/ta};   // visible share of the photo, each way
      if(p.box){
        const [x0, y0, x1, y1] = p.box;
        const place = (lo, hi, v, f) => { const c = (lo+hi)/2; const off = Math.min(1-v, Math.max(0, c - v/2)); return v >= 1 ? 0.5 : off/(1-v); };
        if(vis.w < 1) fx = place(x0, x1, vis.w, fx);
        if(vis.h < 1) fy = place(y0, y1, vis.h, fy);
        const offx = (1-vis.w)*fx, offy = (1-vis.h)*fy;
        if(x0 < offx - .002 || x1 > offx + vis.w + .002 || y0 < offy - .002 || y1 > offy + vis.h + .002)
          issues.push({slot: el.dataset.slotPhoto || el.dataset.photo, kind:'house-cropped', detail:'the whole house does not fit this photo box'});
      }
      img.style.objectPosition = `${(fx*100).toFixed(1)}% ${(fy*100).toFixed(1)}%`;
    });
    return issues;
  };

  // ---------- text that fills its box ----------
  // lines a block of text sets in, and the share of the last line that is filled
  SW.lines = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
    const lines = [];
    for(const q of rects){ const l = lines.find(x => Math.abs(x.top - q.top) < lh*0.5); if(l){ l.l = Math.min(l.l,q.left); l.r = Math.max(l.r,q.right); } else lines.push({top:q.top,l:q.left,r:q.right}); }
    lines.sort((a,b)=>a.top-b.top);
    const box = el.getBoundingClientRect().width;
    const last = lines[lines.length-1];
    return {n: lines.length, fill: last ? (last.r-last.l)/box : 0};
  };
  SW.textWidth = el => { const r = document.createRange(); r.selectNodeContents(el); return pt(r.getBoundingClientRect().width); };
  const html = (lead, sents) => (lead ? `<b>${esc(lead)}</b> ` : '') + esc(sents.join(' '));
  // The sets of whole sentences (the first always stays) that set in exactly T lines with the last line 3/4 full or more.
  // Returns {pick, fill} (fewest sentences first), or null with el.dataset.diag saying how close the pool came.
  const pickFor = (el, T) => {
    // each sentence is a string, or a list of ways to say the same fact at different lengths (only one is ever used)
    const S = JSON.parse(el.dataset.s).map(x => [].concat(x)), lead = el.dataset.lead || '', n = Math.min(S.length, 12);
    let best = null, near = null, hi = null, lo = null;
    const full = S.map(a => a[0]);
    el.innerHTML = html(lead, full); const A = SW.lines(el), allLen = (lead ? lead.length + 1 : 0) + full.join(' ').length, cpl = allLen / Math.max(.5, A.n - 1 + A.fill);
    const lead0 = lead ? lead.length + 1 : 0;
    const test = pick => {
      for(let i = 0; i < pick.length; i++) for(let j = i + 1; j < pick.length; j++) if(FXS.sameFact3(pick[i], pick[j])) return;   // never one fact twice in different words
      { const face = el.closest('.panel, .sheet'), usedF = (!el.__ignoreFace && face && face.__used) || []; if(usedF.length) for(const p of pick) if(usedF.some(u => FXS.sameFact3(u, p))) return; }   // nor on one face (the sentences already set on it)
      if(SW.rep5((lead ? lead + ' ' : '') + pick.join(' '))) return;
      const est = (lead0 + pick.join(' ').length) / cpl;
      if(est < T - 1.5 || est > T + 0.9) return;
      el.innerHTML = html(lead, pick);
      const L = SW.lines(el);
      if(L.n === T + 1 && (!hi || L.fill < hi.fill)) hi = {fill: L.fill};
      if(L.n === T - 1 && (!lo || L.fill > lo.fill)) lo = {fill: L.fill};
      if(L.n !== T) return;
      if(!near || L.fill > near.fill) near = {pick, fill: L.fill};
      if(L.fill < 0.76) return;
      const score = (L.fill >= (+el.dataset.minfill || 0.8) ? 1000 : 500) - pick.length * 10 + L.fill;   // data-minfill (owner 11/7): a last line at 90% of the width wins whenever the sentences allow it   // the fewest, fullest sentences that fill the box; the last line well filled
      if(!best || score > best.score) best = {score, pick, fill: L.fill};
    };
    const walk = (m, i, acc) => {
      if(i === n){ test(acc); return; }
      if(!(m >> i & 1)){ walk(m, i + 1, acc); return; }
      for(const alt of S[i]) walk(m, i + 1, acc.concat(alt));
    };
    for(let m = 1; m < (1 << n); m += 2) walk(m, 0, []);   // the first sentence always stays: it carries the point of the box
    if(best) return best;
    el.dataset.diag = `best ${T} lines: ${near ? Math.round(near.fill*100) + '%' : 'none'}` + (hi ? `; ${T+1} lines min ${Math.round(hi.fill*100)}%` : '') + (lo ? `; ${T-1} lines max ${Math.round(lo.fill*100)}%` : '');
    el.__near = near;
    return null;
  };
  // Same as pickFor, and when the box's whole sentences cannot fill T lines at its width, the box narrows (6 pt steps, up to data-narrow steps, 8 by default;
  // text is left aligned, so a slightly shorter line is invisible) until a set of whole sentences does. Returns null (width restored) when none does.
  const pfN = (el, T) => {
    if(el.dataset.w0 == null) el.dataset.w0 = el.getBoundingClientRect().width*.75;
    const base = +el.dataset.w0, maxK = el.dataset.narrow != null ? +el.dataset.narrow : 8;
    for(let k = 0; k <= maxK; k++){ el.style.width = (base - k*(+el.dataset.nstep || 6)) + 'pt'; const b = pickFor(el, T); if(b) return b; }
    el.style.width = base + 'pt'; return pickFor(el, T);
  };
  const LH = 12.5, CAPPAD = 5;
  SW.fill = () => {
    // owner 11/8 (write-ups fill to 90%): the back's write-up keeps its full column, justified, and prefers a last line at 90% or more
    document.querySelectorAll('[data-slot="back.about"]').forEach(e => { e.dataset.minfill = e.dataset.minfill || '0.9'; e.style.textAlign = 'justify'; });
    const issues = [];
    document.querySelectorAll('[data-s]').forEach(e => { e.dataset.fixed = '1'; });
    const caps = [...document.querySelectorAll('.cap .a[data-s]')], rest = [...document.querySelectorAll('[data-s]')].filter(e => !caps.includes(e));
    const settle = (el, T) => {   // T lines: the best set, else the nearest and a report
      const lead = el.dataset.lead || ''; let b = pfN(el, T); if(!b && !el.__ignoreFace){ el.__ignoreFace = true; b = pfN(el, T); }   // a face that cannot avoid a repeat sets the sentences anyway (the face check then reports it)
      if(b){ el.innerHTML = html(lead, b.pick); delete el.dataset.diag; }
      else el.innerHTML = html(lead, el.__near ? el.__near.pick : JSON.parse(el.dataset.s).map(x => [].concat(x)[0]));
      { const face = el.closest('.panel, .sheet'); if(face) face.__used = (face.__used || []).concat(String(el.textContent).split(/(?<=[.!?])\s+/).filter(Boolean)); }
      el.dataset.lines = T; return !!b;
    };
    rest.forEach(el => {
      // data-try="5,4,3": the line counts this box may take (most lines first); the first that the whole sentences fill (last line 3/4 full) wins
      const tries = (el.dataset.try || '').split(',').map(Number).filter(Boolean);
      if(tries.length){
        let T = tries.find(t => pfN(el, t));
        if(!T){ el.__ignoreFace = true; T = tries.find(t => pfN(el, t)); }
        if(!T){ let bestT = tries[0], bf = -1; tries.forEach(t => { pfN(el, t); if(el.__near && el.__near.fill > bf){ bf = el.__near.fill; bestT = t; } }); T = bestT; }
        settle(el, T);
        if(el.dataset.lh) el.style.height = (T * +el.dataset.lh) + 'pt';
      } else settle(el, +el.dataset.lines || 1);
    });
    // photo captions shrink to what their sentences honestly fill (never padded): the photo takes the room. The captions in one row share a line count when they can.
    const groups = new Map();
    caps.forEach(el => { const g = el.dataset.row ? 'row:' + el.dataset.row : (el.closest('.row') || el); (groups.get(g) || groups.set(g, []).get(g)).push(el); });
    groups.forEach(els => {
      const max = Math.max(...els.map(e => +e.dataset.lines));
      let chosen = null;
      for(let T = max; T >= 2 && !chosen; T--) if(els.every(e => pfN(e, T))) chosen = T;
      if(!chosen){ els.forEach(e => { e.__ignoreFace = true; }); for(let T = max; T >= 2 && !chosen; T--) if(els.every(e => pfN(e, T))) chosen = T; }
      els.forEach(e => {
        const lead = e.dataset.lead || '';
        let T = chosen;
        if(!T){   // no common count: this one alone, at the count it fills best (or comes closest to)
          let bestNear = null;
          for(let t = max; t >= 2 && !T; t--){ if(pfN(e, t)) T = t; else if(e.__near && (!bestNear || e.__near.fill > bestNear.fill)) bestNear = {t, fill: e.__near.fill}; }
          if(!T) T = bestNear ? bestNear.t : 2;
        }
        settle(e, T);
      });
      const h = Math.max(...els.map(e => +e.dataset.lines));
      els.forEach(e => { const lh = +e.dataset.lh || LH; e.style.height = (+e.dataset.lines * lh) + 'pt'; });
      const lh0 = +els[0].dataset.lh || LH;
      els.forEach(e => { e.parentElement.style.height = (CAPPAD + h * lh0) + 'pt'; });
    });
    return issues;
  };

  // ---------- logos ----------
  SW.fitLogos = () => document.querySelectorAll('.logo[data-area] img').forEach(img => {
    const box = img.parentElement, a = img.naturalWidth / img.naturalHeight || 1;
    const maxW = pt(box.clientWidth) || 170;
    let h = Math.min(+box.dataset.maxh, Math.sqrt(+box.dataset.area / a));
    if(h * a > maxW) h = maxW / a;
    img.style.height = h + 'pt'; img.style.width = (h * a) + 'pt'; img.style.maxWidth = 'none'; img.style.maxHeight = 'none';
  });

  // ---------- listing facts ----------
  const n = v => Number(v).toLocaleString('en-US');
  const pl = (k, one, many) => `${n(k)} ${k==1 ? one : many}`;
  SW.stats = L => {
    const s = [];
    if(L.beds) s.push(pl(L.beds, 'Bedroom', 'Bedrooms'));
    if(L.baths) s.push(L.halfBaths ? `${L.baths} Full & ${L.halfBaths} Half Baths` : pl(L.baths, 'Full Bath', 'Full Baths'));
    if(L.sqft) s.push(`${n(L.sqft)} Square Feet`);
    if(L.yearBuilt) s.push(`Built in ${L.yearBuilt}`);
    s.push(L.stories == 1 ? (L.lotSize ? L.lotSize.replace(/^([\d,]+) Sq Ft Lot$/, '$1 Sq Ft Lot') : 'One Story') : `${L.stories} Stories`);
    return s;
  };

  // ---------- print checks ----------
  // Overflow per slot, type under 8 pt (6 pt for fine print), photos under 300 ppi at print size, empty slots, prices,
  // captions whose last line is under 3/4 full, sample text on a real agent's piece.
  SW.check = function(D, extra){
    const issues = [...(extra||[])];
    if(D && D.preview) issues.push({slot:'copy', kind:'preview-text', detail:'rough-draft preview lines; the writer has not run'});
    const sample = /\b(avery morgan|any brokerage|your brokerage|your website|lorem|ipsum|placeholder|tbd|xx+)\b|555[.\-]01\d\d/i;
    document.querySelectorAll('[data-slot]').forEach(el=>{
      const name = el.dataset.slot, cs = getComputedStyle(el), txt = el.textContent.trim();
      if(!el.getClientRects().length) return;
      const size = parseFloat(cs.fontSize)*72/96;
      const oneLine = cs.whiteSpace === 'nowrap';
      const max = +el.dataset.lines || 0;
      const over = oneLine ? el.scrollWidth > el.clientWidth + 1
                 : max ? SW.lines(el).n > max || el.scrollWidth > el.clientWidth + 1
                 : el.scrollHeight > el.clientHeight + 1;
      if(over) issues.push({slot:name, kind:'overflow', text:txt.slice(0,80), ...(max && !oneLine ? {lines:SW.lines(el).n, max} : {})});
      if(size < 8 && !el.dataset.fine) issues.push({slot:name, kind:'type-too-small', size:+size.toFixed(1)});
      if(size < 6) issues.push({slot:name, kind:'fine-print-below-6pt', size:+size.toFixed(1)});
      if(!txt && !el.dataset.optional && el.tagName !== 'IMG') issues.push({slot:name, kind:'empty-slot'});
      if(/\$\s?\d/.test(txt)) issues.push({slot:name, kind:'price', text:txt.slice(0,80)});
      if(!D.sample && sample.test(txt)) issues.push({slot:name, kind:'placeholder', text:txt.slice(0,80)});
    });
    document.querySelectorAll('[data-s][data-slot]').forEach(el=>{
      if(+el.dataset.lines < 2 || !el.textContent.trim()) return;
      const L = SW.lines(el);
      if(L.n < +el.dataset.lines) issues.push({slot:el.dataset.slot, kind:'caption-short', lines:L.n, want:+el.dataset.lines, diag: el.dataset.diag || ''});
      else if(L.fill < 0.75) issues.push({slot:el.dataset.slot, kind:'last-line-short', pct:Math.round(L.fill*100), diag: el.dataset.diag || ''});
    });
    document.querySelectorAll('.ph').forEach(el=>{
      const img = el.querySelector('img'), slot = el.dataset.slotPhoto || el.dataset.photo || 'photo';
      if(!img){ issues.push({slot, kind:'empty-photo-slot'}); return; }
      if(!img.complete || !img.naturalWidth){ issues.push({slot, kind:'photo-missing', src:img.getAttribute('src')}); return; }
      const wIn = el.clientWidth/96, hIn = el.clientHeight/96;
      const ppi = Math.min(img.naturalWidth/wIn, img.naturalHeight/hIn);
      if(ppi < 300) issues.push({slot, photo:el.dataset.photo, kind:'photo-under-300ppi', ppi:Math.round(ppi), placedIn:[+wIn.toFixed(2),+hIn.toFixed(2)]});
    });
    document.querySelectorAll('.ph').forEach(el => { const h = el.clientHeight*72/96, w = el.clientWidth*72/96;
      if(h < 85 || w/h > 3.1) issues.push({slot: el.dataset.slotPhoto || el.dataset.photo, kind:'photo-too-thin', detail: `${w.toFixed(0)} x ${h.toFixed(0)} pt`}); });
    // the same photo twice on one page (or a near-duplicate: the same room or view under another number, review r2)
    const famOf = id => { id = String(id).replace(/(\d)[a-z]$/, '$1'); return /^(deck|pergola|patio|fence|evening)\d*$/.test(id) ? 'outdoor' : /^(front)\d*$/.test(id) ? 'front' : /^(primary|game|terrace|gazebo)\d*$/.test(id) ? id.replace(/\d+$/, '') : id; };   // the same view or room under another number
    document.querySelectorAll('.panel').forEach(pn => {
      const seen = new Map();
      pn.querySelectorAll('.ph[data-photo]').forEach(el => {
        const id = el.dataset.photo; if(!id) return;
        const key = famOf(id), prev = seen.get(key);
        if(prev && prev !== id) issues.push({slot: el.dataset.slotPhoto || id, kind: 'near-duplicate-photo', detail: `${id} and ${prev} show the same room or view on one page`});
        else if(prev === id) issues.push({slot: el.dataset.slotPhoto || id, kind: 'duplicate-photo', detail: `${id} is on the page twice`});
        seen.set(key, id);
      });
    });
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return; const r = SW.rep5(el.textContent); if(r) issues.push({slot: el.dataset.slot, kind: 'repeated-phrase', detail: `"${r}" repeats in one block`}); });
    // the same sentence twice on one page of the piece
    document.querySelectorAll('.panel, .sheet').forEach(pn => { const seenS = new Map();
      pn.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return;
        String(el.textContent).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x.length >= 28).forEach(x => { const k = x.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 48), prev = seenS.get(k);
          if(prev && prev !== el.dataset.slot) issues.push({slot: el.dataset.slot, kind: 'duplicate-sentence', detail: `"${x.slice(0, 60)}" also in ${prev}`}); else seenS.set(k, el.dataset.slot); }); }); });
    // no photo number, QR, pin or listing price anywhere on the piece
    if(/\bqr\b|scan for/i.test(document.body.innerText)) issues.push({slot:'piece', kind:'qr-text'});
    if(window.ContactCard) issues.push(...ContactCard.check(document));
    if(window.IvoryPlan) issues.push(...IvoryPlan.check());
    issues.push(...FXS.underCheck(), ...FXS.rowCheck(), ...FXS.factCheck(), ...FXS.edgeCheck(), ...FXS.faceCheck(), ...FXS.pending);
    return issues;
  };
  SW.famOf = id => { id = String(id).replace(/(\d)[a-z]$/, '$1'); return /^(deck|pergola|patio|fence|evening)\d*$/.test(id) ? 'outdoor' : /^(front)\d*$/.test(id) ? 'front' : /^(primary|game|terrace|gazebo)\d*$/.test(id) ? id.replace(/\d+$/, '') : id; };
  SW.placements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));



  // ---------- checks added in review round 1 ----------
  // text hidden under an element drawn after it (a footer bar, a card, a photo): the write-up that slid under the blue footer
  FXS.underCheck = () => { const out = [], pt = v => v*72/96;
    const covers = [...document.querySelectorAll('.bar, .bluecard, .card, .photo, .ph, .hbar, [aria-hidden="true"].abs')].filter(e => e.getClientRects().length && e.getBoundingClientRect().width > 4);
    [...document.querySelectorAll('[data-slot]')].filter(e => e.textContent.trim() && e.getClientRects().length && !e.querySelector('[data-slot]')).forEach(t => {
      const rg = document.createRange(); rg.selectNodeContents(t); const rs = [...rg.getClientRects()].filter(q => q.width > 1 && q.height > 1); if(!rs.length) return;
      for(const c of covers){ if(c === t || c.contains(t) || t.contains(c)) continue; if(!(t.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        const cr = c.getBoundingClientRect(), cs = getComputedStyle(c); if(cs.visibility === 'hidden' || cs.opacity === '0') continue;
        const hit = rs.find(q => q.left < cr.right - 1 && q.right > cr.left + 1 && q.top < cr.bottom - 1 && q.bottom > cr.top + 1);
        if(hit){ out.push({slot: t.dataset.slot, kind: 'text-under-later-element', detail: `text runs under an element drawn after it (${c.className || c.tagName})`}); break; } } });
    return out; };
  // mirrors of scripts/fxsets/carousel_copy.py: room_group() and same_fact() (one rule for every set)
  const ROOM_GROUPS = [['outdoor', ['deck', 'patio', 'evening', 'yard', 'pergola', 'porch', 'balcony', 'terrace', 'rooftop', 'front', 'exterior', 'park']], ['living', ['family', 'living', 'openplan', 'great']], ['kitchen', ['kitchen', 'bar', 'nook', 'pantry']], ['primarybath', ['pbath', 'shower']]];
  FXS.roomGroup = id => { const base = String(id).toLowerCase().replace(/\d+$/, ''); for(const [g, ks] of ROOM_GROUPS) if(ks.some(k => base.startsWith(k))) return g; return base; };
  const STOPW = new Set('a an the and of to from with in on at its it is are by for this that one two room its'.split(' '));
  const cw5 = t => new Set((String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !STOPW.has(w)));
  FXS.subset = (r, s) => { const a = cw5(r), b = cw5(s); let n = 0; a.forEach(w => { if(b.has(w)) n++; }); return a.size > 0 && n === a.size; };   // a fact row whose every word is in the sentence: the sentence says the row again
  FXS.avoid = [];
  FXS.noFacts = list => { const L = [].concat(list || []), kept = L.filter(x => ![].concat(x).some(a => FXS.avoid.some(r => FXS.subset(r, a)))); return kept.length >= 2 ? kept : L; };   // sentences that repeat a fact row on the same face drop out (never below two)
  FXS.sameFact3 = (a, b) => cw5(a).size >= 3 && cw5(b).size >= 3 && FXS.sameFact(a, b);
  FXS.sameFact = (a, b) => { const wa = cw5(a), wb = cw5(b), small = Math.min(wa.size, wb.size); if(!small) return false; let n = 0; wa.forEach(w => { if(wb.has(w)) n++; }); return n/small >= (small <= 3 ? 0.5 : 0.6); };
  // no caption or paragraph holds two sentences that say the same fact (sentences with fewer than 3 content words, the room-name leads, are not compared)
  FXS.factCheck = () => { const out = [];
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]') || !el.getClientRects().length) return;
      const ss = String(el.textContent).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => cw5(x).size >= 3);
      for(let i = 0; i < ss.length; i++) for(let j = i + 1; j < ss.length; j++) if(FXS.sameFact3(ss[i], ss[j])){ out.push({slot: el.dataset.slot, kind: 'same-fact-twice', detail: `"${ss[i].slice(0, 50)}" and "${ss[j].slice(0, 50)}" say the same fact`}); return; } });
    return out; };
  // captions side by side (the same top) run the same number of lines
  FXS.rowCheck = () => { const out = [], els = [...document.querySelectorAll('.cap .a[data-slot]')].filter(e => e.getClientRects().length && e.textContent.trim()), rows = [];
    els.forEach(e => { const top = Math.round(e.getBoundingClientRect().top/4); (rows.find(r => r.top === top) || (rows.push({top, els: []}), rows[rows.length - 1])).els.push(e); });
    document.querySelectorAll('[data-full]').forEach(e => { if(e.textContent.trim().toLowerCase() !== e.dataset.full.trim().toLowerCase()) out.push({slot: e.dataset.slot, kind: 'strip-label-mismatch', detail: `"${e.textContent.trim()}" is not the room name "${e.dataset.full}"`}); });
    rows.forEach(r => { if(r.els.length < 2) return; const ns = r.els.map(e => SW.lines(e).n); if(new Set(ns).size > 1) out.push({slot: r.els.map(e => e.dataset.slot).join(' | '), kind: 'caption-row-line-mismatch', detail: `captions side by side run ${ns.join(', ')} lines; they must match`}); });
    return out; };

  // text past the trim or the safe margin, text clipped by its own box, and a hanging separator at the end of a line (the off-page check)
  FXS.edgeCheck = () => { const out = [], P = (SW.data().piece || {}), pt = v => v*72/96;
    const inset = (P.kind === 'email' || P.kind === 'oh-social' || P.moment) ? 1 : P.card ? 9 : 18;   // flyers, Open House flyers and fold-over panels keep 0.25 in; postcards 0.125 in; socials and the email just the page
    const box = el => el.closest('.sheet') || el.closest('.panel') || el.closest('.page');
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {acceptNode: n => n.nodeValue.trim() && !/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName) && n.parentNode.getClientRects().length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT});
    const seen = new Set();
    for(let n = w.nextNode(); n; n = w.nextNode()){ const el = n.parentNode, b = box(el); if(!b) continue; const br = b.getBoundingClientRect();
      const rg = document.createRange(); rg.selectNodeContents(n);
      for(const q of rg.getClientRects()){ if(q.width < 1) continue;
        if(pt(q.right - br.left) > pt(br.width) - inset + .5 || pt(q.left - br.left) < inset - .5 - (inset > 1 ? 0 : 1) || pt(q.bottom - br.top) > pt(br.height) - inset + .5 || pt(q.top - br.top) < inset - .5 - (inset > 1 ? 0 : 1)){
          const slot = (el.closest('[data-slot]') || el).dataset.slot || el.className || el.tagName; if(!seen.has(slot)){ seen.add(slot); out.push({slot, kind: 'off-page', detail: `"${n.nodeValue.trim().slice(0, 40)}" runs past the ${inset > 1 ? 'safe margin' : 'page edge'}`}); } break; } } }
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]') || !el.getClientRects().length) return; const t = el.textContent.trim();
      if(/[·•|,;:–—-]$/.test(t) && !/^[\d.,:-]+$/.test(t)) out.push({slot: el.dataset.slot, kind: 'hanging-separator', detail: `"${t.slice(-24)}" ends on a separator`});
      const cs = getComputedStyle(el); if(t && (cs.overflow === 'hidden' || cs.overflowY === 'hidden') && !el.closest('.logo') && (el.scrollHeight > el.clientHeight + 6 && cs.whiteSpace !== 'nowrap')) out.push({slot: el.dataset.slot, kind: 'text-clipped', detail: 'the text is taller than its box'}); });
    return out; };
  // no fact twice on one face: sentences and fact rows of a face are compared across boxes (same_fact(), as in scripts/fxsets/carousel_copy.py)
  FXS.faceCheck = () => { const out = [], skip = /^(place|address|agent|broker|fineprint|strip|moment|oh\.|front\.status|front\.place|front\.address|sold\.head|cta|caption$|back\.glance|.*(title|kicker|label\d*|heading)$)/, rowSlot = /^(fact|sell|back\.(updates|outside|nearby))\./;
    document.querySelectorAll('.panel, .sheet, .page').forEach(face => { if(!face.classList.contains('panel') && !face.classList.contains('sheet') && face.querySelector('.sheet, .panel')) return;
      if(!face.querySelector('[data-slot^="fact."], [data-slot^="front.fact"], [data-slot^="sell."], [data-slot^="back.updates"]')) return;   // faces with a fact list or sidebar
      const units = [];
      face.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]') || !el.getClientRects().length || skip.test(el.dataset.slot) || el.querySelector('b') && /^(fact|front\.fact)/.test(el.dataset.slot)) return;
        const row = rowSlot.test(el.dataset.slot);
        String(el.textContent).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => cw5(x).size >= (row ? 2 : 3)).forEach(x => units.push({slot: el.dataset.slot, x, row})); });
      const subset = (r, s) => { const a = cw5(r), b = cw5(s); let n = 0; a.forEach(w => { if(b.has(w)) n++; }); return a.size > 0 && n === a.size; };
      for(let i = 0; i < units.length; i++) for(let j = i + 1; j < units.length; j++){ const u = units[i], v = units[j]; let hit = false;
        if(u.row && v.row) hit = false; else if(u.row) hit = subset(u.x, v.x); else if(v.row) hit = subset(v.x, u.x); else hit = FXS.sameFact(u.x, v.x);
        if(hit) out.push({slot: u.slot, kind: 'same-fact-on-face', detail: `"${u.x.slice(0, 40)}" and "${v.x.slice(0, 40)}" (${v.slot}) say the same fact`}); } });
    return out.slice(0, 8); };
  FXS.pending = [];

  // ---------- single pieces (Open House flyers, postcards) ----------
  // The page: print adds 0.125 in bleed on postcards, and a white 0.25 in margin on flyers (home printers): the sheet is clipped
  // to the margin, so the gray band and every photo stop 0.25 in from the paper's edge there.
  SW.frame = function(D, trimW, trimH, inner){
    const mode = D.mode || 'email', P = D.piece || {};
    const bleed = (mode === 'print' && P.print === 'bleed') ? 9 : 0;
    const inset = (mode === 'print' && P.print === 'margin') ? (P.margin || 18) : 0;
    const W = trimW + 2*bleed, H = trimH + 2*bleed;
    return {W, H, bleed, inset, html: `<div class="page spage" data-page="${esc(P.id||'')}" style="width:${W}pt;height:${H}pt;background:var(--fx-paper)">
      <div class="sheet abs panel" style="left:${bleed}pt;top:${bleed}pt;width:${trimW}pt;height:${trimH}pt;${inset ? `clip-path:inset(${inset}pt)` : ''}">${inner}</div></div>`};
  };
  SW.setup = async function(D){
    await Promise.all(['400 10pt Montserrat','500 10pt Montserrat','600 10pt Montserrat','700 10pt Montserrat','500 10pt "Bodoni Moda"','400 10pt "Cormorant Garamond"','500 10pt "Cormorant Garamond"','600 10pt "Cormorant Garamond"','italic 400 10pt "Cormorant Garamond"'].map(f => document.fonts.load(f)));
  };
  SW.place = L => [L.city, [L.state, L.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  // a paragraph box: whole sentences that fill exactly `lines` lines (fill pass); lead optional
  SW.para = (c, slot, lines, cls, style, lh) => `<div class="${cls||''}" data-slot="${slot}" data-lines="${lines}" data-lead="${esc(c.lead||'')}" data-s='${esc(JSON.stringify([].concat(c.s || c))).replace(/'/g,'&#39;')}' style="height:${lines*(lh||14)}pt;line-height:${lh||14}pt;${style||''}"></div>`;
  // Open house fields. Everything comes from data: nothing is invented. A public open house shows date and time only;
  // broker and REALTOR(R) opens may carry refreshments and a note, and no RSVP wording ever prints (rule of 10/27/2026).
  SW.noRSVP = s => { s = String(s||'').trim(); const ask = /\brsvp|r\.s\.v\.p|please reply|reply by\b/i; if(!ask.test(s)) return s;
    return s.split(/\s*(?:[·;|•]|(?<=[.!?])\s)\s*/).filter(p => p && !ask.test(p)).join('  ·  ').trim(); };
  SW.openHouse = function(D){
    const O = D.openHouse || {}, A = D.agent || {};
    const kinds = {public:'Public Open House', broker:'Broker Open House', realtor:'REALTOR® Open House'};
    let kind = O.kind in kinds ? O.kind : 'public';
    if(kind === 'realtor' && !A.nar) kind = 'broker';
    const r = {kind, label:kinds[kind], long:'', weekday:'', monthDay:'', month:'', monthShort:'', day:'', time:'', note:'', refreshments:''};
    if(kind !== 'public'){ r.note = SW.noRSVP(O.note || O.coop || ''); r.refreshments = String(O.refreshments || '').trim(); }
    const dt = /^\d{4}-\d{2}-\d{2}$/.test(O.date||'') ? new Date(O.date + 'T12:00:00') : null;
    if(dt && !isNaN(dt)){
      const f = o => dt.toLocaleDateString('en-US', o);
      r.weekday = f({weekday:'long'}); r.month = f({month:'long'}); r.monthShort = f({month:'short'}); r.day = f({day:'numeric'});
      r.monthDay = `${r.month} ${r.day}`; r.long = `${r.weekday}, ${r.monthDay}`;
    } else if(O.date){ r.long = String(O.date); }
    const t12 = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s||''); if(!m) return null; let H = +m[1]; const M = +m[2]; const ap = H >= 12 ? 'pm' : 'am'; H = H % 12 || 12; return {txt: M ? `${H}:${String(M).padStart(2,'0')}` : `${H}:00`, ap}; };
    const a = t12(O.start), z = t12(O.end);
    if(O.timeText) r.time = String(O.timeText);
    else if(a && z) r.time = a.ap === z.ap ? `${a.txt} to ${z.txt} ${z.ap}` : `${a.txt} ${a.ap} to ${z.txt} ${z.ap}`;
    else if(a) r.time = `${a.txt} ${a.ap}`;
    return r;
  };


  // Does the whole house (photo.box, fractions) stay inside a w x h frame when the photo covers it? (a photo with no box always does)
  SW.fits = (D, id, w, h) => {
    const p = (D.photos||{})[id]; if(!p || !p.box || !p.w || !p.h) return true;
    const ia = p.w/p.h, ta = w/h, [x0, y0, x1, y1] = p.box;
    return ta >= ia ? (ia/ta >= (y1 - y0) - .002) : (ta/ia >= (x1 - x0) - .002);
  };
  // The hero frame: the whole house across w x h. A tall, narrow house that would be cut in a frame that wide takes a narrower
  // frame (1.3 : 1) and two interiors (side: two photo ids) stacked beside it, so the house is never cut.
  SW.heroHtml = (D, id, x, y, w, h, slot, side) => {
    const box = (px, py, pw, ph, pid, sl) => `<div class="abs" style="left:${px}pt;top:${py}pt;width:${pw}pt;height:${ph}pt">${SW.photo(D, pid, 'position:absolute;inset:0', sl)}</div>`;
    if(!side || !side.length || SW.fits(D, id, w, h)) return box(x, y, w, h, id, slot);
    const w1 = Math.round(h*1.3), gap = 12, w2 = w - w1 - gap, hh = (h - 10)/2;
    return box(x, y, w1, h, id, slot) + box(x + w1 + gap, y, w2, hh, side[0], slot + '.side0') + box(x + w1 + gap, y + hh + 10, w2, hh, side[1], slot + '.side1');
  };


  // ---------- the set's tokens (fxs24-tokens.css is the one source) and marks ----------
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  FXS.tok = new Proxy({}, {get: (_, k) => ({
    paper: cssVar('--fx-paper'), card: cssVar('--fx-card'), seal: cssVar('--fx-seal'), ink: cssVar('--fx-ink'), text: cssVar('--fx-text'),
    mute: cssVar('--fx-mute'), accent: cssVar('--fx-accent'), rule: cssVar('--fx-rule'), onInk: cssVar('--fx-on-ink')})[k]});
  FXS.SUF = /\s+(Street|St|Drive|Dr|Lane|Ln|Road|Rd|Avenue|Ave|Boulevard|Blvd|Court|Ct|Circle|Cir|Place|Pl|Way|Trail|Trl|Parkway|Pkwy|Terrace|Ter|Highway|Hwy)\.?$/i;
  FXS.width = (t, css) => { const m = document.createElement('span'); m.style.cssText = `position:absolute;left:-9999pt;visibility:hidden;white-space:nowrap;${css}`; m.textContent = t; document.body.appendChild(m); const w = m.getBoundingClientRect().width*.75; m.remove(); return w; };
  FXS.fitSize = (t, css, w, max, min) => { let s = max; while(s > min && FXS.width(t, `${css};font-size:${s}pt`) > w) s -= .5; return s; };
  FXS.placeLine = L => `${L.city}, ${/^texas$/i.test(L.state) ? 'TX' : L.state} ${L.zip || ''}`.trim();
  FXS.hood = L => String(L.neighborhood || ((SW.data().listing || {}).neighborhood) || '').trim();   // the page loader (OHL.start) blanks D.listing.neighborhood, so the raw data is read too
  // text turned a quarter turn (reading upward), centered on (cx, cy), `len` long and `th` thick
  FXS.statItems = L => {
    const n = v => Number(v).toLocaleString('en-US'), t = [];
    if(L.beds) t.push(`${L.beds} ${L.beds == 1 ? 'Bedroom' : 'Bedrooms'}`);
    if(L.baths){ const b = window.BD && BD.bathsText ? BD.bathsText(L).main : `${L.baths} Full Baths`; t.push(b); }
    if(L.sqft) t.push(`${n(L.sqft)} Sq Ft`);
    const yr = L.yearBuilt || L.year; if(yr) t.push(`Built in ${yr}`);
    return t;
  };
  // a stat as a big Cormorant numeral (16 pt or more) with its small caps label: "3 BEDROOMS", "1,385 SQ FT", "1940 BUILT"
  FXS.statParts = t => { t = String(t); let m = /^Built in (\d{4})$/i.exec(t); if(m) return {n: m[1], l: 'Built'};
    m = /^([\d,]+(?:\.\d+)?(?:½)?)\s+(.*)$/.exec(t); return m ? {n: m[1], l: m[2]} : {n: t, l: ''}; };
  FXS.statHtml = (t, np, lp, track) => { const p = FXS.statParts(t);
    return `<span style="font:500 ${np || 18}pt/1 var(--fx-display);color:var(--fx-ink)">${esc(p.n)}</span>${p.l ? `<span style="font:600 ${lp || 8.5}pt/1 var(--fx-font);letter-spacing:${track == null ? 1.5 : track}pt;text-transform:uppercase;color:var(--fx-text);margin-left:${(lp || 8.5)*.6}pt">${esc(p.l)}</span>` : ''}`; };
  FXS.statsRow = (items, x, y, w, h, slot, o) => { o = o || {}; return `<div class="stats" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${items.map((t, i) => `<div class="s" data-slot="${slot}.${i}" data-lines="1">${FXS.statHtml(t, o.np, o.lp, o.track)}</div>`).join('')}</div>`; };
  FXS.label = (t, slot, style) => `<div class="lbl" ${slot ? `data-slot="${slot}" data-lines="1"` : ''} style="${style || ''}">${esc(String(t).toUpperCase())}</div>`;
  // a photo box at (x, y, w, h)
  FXS.box = (D, id, x, y, w, h, slot, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${SW.photo(D, id, `position:absolute;inset:0;${css || ''}`, slot)}</div>`;
  // a logo, sized to a box (the one brokerage logo of a side)
  FXS.logo = (D, x, y, w, h, just) => { const b = D.brand || {}; const src = b.logo; return `<div class="abs logo" data-area="${w*h}" data-maxh="${h}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;justify-content:${just || 'flex-start'}">${src ? `<img src="${esc(src)}" alt="">` : `<span class="word" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span>`}</div>`; };
  // the agent block of a front: name, REALTOR(R), phone, email, left aligned at (x, y)
  FXS.lightBold = t => esc(t);


  // ---------- photo cards (a photo id, a lead, whole sentences) and the choosing rules ----------
  const LABELS = [[/^front/, 'Front.'], [/^entry/, 'Entry.'], [/^pergola/, 'Pergola.'], [/^deck/, 'Deck.'], [/^patio/, 'Patio.'], [/^evening/, 'Deck at dusk.'], [/^(fence|yard)/, 'Yard.'], [/^terrace/, 'Terrace.'], [/^balcony/, 'Balcony.'], [/^nook/, 'Breakfast nook.'], [/^stair/, 'Stair.'], [/^foyer/, 'Foyer.'], [/^hall/, 'Hall.'], [/^bar/, 'Bar.'], [/^wine/, 'Living room.'], [/^kitchen/, 'Kitchen.'], [/^dining/, 'Dining area.'], [/^(family|living|openplan)/, 'Living room.'], [/^primary/, 'Primary suite.'], [/^pbath/, 'Primary bath.'], [/^bath/, 'Bath.'], [/^bed/, 'Bedroom.'], [/^closet/, 'Closet.'], [/^laundry/, 'Laundry.'], [/^game/, 'Game room.'], [/^park/, 'Community park.'], [/^gazebo/, 'Community park.']];
  FXS.labelFor = id => { const m = LABELS.find(([re]) => re.test(id)); return m ? m[1] : (String(id).replace(/\d+[a-z]?$/, '').replace(/^./, c => c.toUpperCase()) + '.'); };
  FXS.OUTSIDE = /^(front|entry|gazebo|park|alley|skyline|walk|yard|terrace|balcony|deck|patio|pergola|fence|evening|garage|street)/;
  FXS.isHouse = (D, id) => !!((D.photos || {})[id] || {}).fullHouse;
  FXS.spareCap = (D, id) => { const J = ((D.companion||{}).justListed||{}).captions||{}, R = ((D.companion||{}).roomLines||{})[id]||{}; const s = (R.all && R.all.length > 2) ? R.all : [J[id], R.long || R.short].filter(Boolean); return s.length ? {photo: id, lead: FXS.labelFor(id), s} : null; };
  // every captioned photo the package wrote, first the ones in `first`, then the rest
  FXS.cards = (D, first) => {
    const K = D.sw || {}, F = (D.companion || {}).flyer || {}, out = [], seen = new Set();
    const add = c => { if(c && c.photo && (D.photos || {})[c.photo] && !seen.has(c.photo) && (c.s || []).length){ seen.add(c.photo); out.push(c); } };
    (first || []).forEach(add);
    [].concat((K.back||{}).photos||[], (K.back||{}).photosNoplan||[], (F.back||{}).photos||[], (F.back||{}).photosNoplan||[], (K.left||{}).photos||[], [].concat(...(((K.right||{}).rows)||[])), (K.front||{}).row||[], (F.front||{}).row||[]).forEach(add);
    Object.keys(D.photos || {}).forEach(id => add(FXS.spareCap(D, id)));
    return out;
  };
  // n cards, never the same room or view twice, none of the `avoid` ids; outdoor: only exterior, outdoor or community photos
  FXS.pick = (D, cards, n, o) => { o = o || {}; const avoid = new Set(o.avoid || []), out = [];
    cards.forEach(c => { const id = c.photo, p = (D.photos || {})[id] || {};
      if(out.length >= n || avoid.has(id) || /^pv\d|^plan/.test(id) || (o.noHouse !== false && p.fullHouse && !o.house)) return;
      if(o.outdoor && (!FXS.OUTSIDE.test(id) || /^(skyline|alley)/.test(id))) return;
      if(o.indoor && FXS.OUTSIDE.test(id)) return;
      const base = x => String(x).replace(/\d+[a-z]?$/, ''); if(out.some(x => SW.famOf(x.photo) === SW.famOf(id) || base(x.photo) === base(id)) || (!o.exactAvoid && [...avoid].some(a => SW.famOf(a) === SW.famOf(id)))) return;
      out.push(c); });
    return out; };
  // the cover's two rooms: the widest living spaces from the front row
  FXS.archScore = (D, id) => { const p = (D.photos||{})[id] || {}; if(p.fullHouse) return -9; const k = /^(family|living|great|open)/.test(id) ? 3 : /^(dining|primary)(?!.*bath)/.test(id) ? 2 : /kitchen|bar/.test(id) ? 1.5 : /bath/.test(id) ? 0 : 1; return k*10 + (p.w && p.h ? Math.min(p.w/p.h, 1.6) : 1); };
  FXS.coverRooms = D => { const F = (D.sw || {}).front || {}, ids = (F.row || []).map(r => r.photo).filter(id => !FXS.isHouse(D, id));
    const top = ids.slice().sort((a, b) => FXS.archScore(D, b) - FXS.archScore(D, a)).slice(0, 2); return ids.filter(i => top.includes(i)); };
  const sd = c => `data-s='${esc(JSON.stringify([].concat(c || []))).replace(/'/g,'&#39;')}'`;
  FXS.sd = sd;
  // a gold caption label from a lead: "Family room, 20' x 16'." -> FAMILY ROOM, then the size small
  FXS.leadLabel = lead => { const t = String(lead || '').replace(/\.$/, ''), i = t.indexOf(','); return i < 0 ? {name: t, size: ''} : {name: t.slice(0, i), size: t.slice(i + 1).trim()}; };
  // a captioned photo: photo, gold label (name, size small), a paragraph of whole sentences (fill pass picks them)
  // ---------- FX24 marks: header bar, blue fact list, strip, agent footer ----------
  FXS.addr = L => String(((SW.data().listing || {}).address) || L.address || '');
  FXS.placeCaps = L => { const st = /^(texas|tx)$/i.test(L.state) ? 'Texas' : L.state; return `${L.city}, ${st} ${L.zip || ''}`.trim().toUpperCase(); };
  FXS.caps = (w, track, size) => `font-family:Montserrat;font-weight:${w};letter-spacing:${track}`;
  // the header bar: the bar (it may bleed), and the street in tracked bold caps centered in [tx, tx + tw], inside the visible band [vy, vy + vh]
  FXS.header = (L, o) => {
    const t = FXS.addr(L).toUpperCase(), tr = o.track || '.2em', css = `font-family:Montserrat;font-weight:700;letter-spacing:${tr}`;
    const s = FXS.fitSize(t, css, o.tw - (o.pad == null ? 36 : o.pad), o.max, o.min), th = Math.ceil(s*1.45);
    return `<div class="bar" style="left:${o.x}pt;top:${o.y}pt;width:${o.w}pt;height:${o.h}pt"></div>` +
      `<div class="hbar" style="left:${o.tx}pt;top:${o.vy + (o.vh - th)/2}pt;width:${o.tw}pt;height:${th}pt;font-size:${s}pt;line-height:${th}pt;letter-spacing:${tr};padding-left:${tr}" data-slot="${o.slot || 'address'}" data-lines="1">${esc(t)}</div>`;
  };
  // the blue fact list: rows of [numeral] CAPS LABEL between hairlines, filling (x, y, w, h)
  FXS.factRows = (items, x, y, w, h, slot, o) => { o = o || {};
    const n = items.length, padY = o.padY == null ? 6 : o.padY, pitch = (h - 2*padY)/n; let out = '';
    items.forEach((it, i) => { const ty = y + padY + i*pitch;
      out += `<div class="frow" style="left:${x}pt;top:${ty}pt;width:${w}pt;height:${pitch}pt;align-items:center;${o.fs ? `font-size:${o.fs}pt;` : ''}" data-slot="${slot}.${i}" data-lines="1"><span style="display:flex;align-items:baseline">${it.n != null ? `<b${o.np ? ` style="font-size:${o.np}pt"` : ''}>${esc(it.n)}</b>` : ''}${esc(it.l)}</span></div>`;
      if(i) out += `<div class="hr on" style="left:${x}pt;top:${ty}pt;width:${w - (o.rpad == null ? 4 : o.rpad)}pt"></div>`; });
    return out; };
  FXS.statRows = L => FXS.statItems(L).map(FXS.statParts).map(p => ({n: p.n, l: String(p.l).toUpperCase()}));
  // the house's real selling facts as caps rows that set on one line in w (never a box label)
  FXS.sellingRows = (D, w, max) => { const SF = FXS.sellingFacts(D), css = 'font-family:Montserrat;font-weight:500;font-size:9.75pt;letter-spacing:.07em';
    const out = []; [].concat(SF.inside, SF.outside).forEach(t => { t = String(t); if(/^built in|bedrooms$|square feet$|garage/i.test(t)) return; const u = t.toUpperCase();
      if(!out.some(o => o.l === u) && FXS.width(u, css) <= w) out.push({l: u}); });
    return out.slice(0, max); };
  // the photo strip: n rooms across (x, y, w, h) with the room's name in tracked blue caps under each
  FXS.strip = (D, cards, x, y, w, h, gap, slot) => { const n = cards.length, pw = (w - (n - 1)*gap)/n; let out = '';
    cards.forEach((c, i) => { const px = x + i*(pw + gap); let nm = FXS.leadLabel(c.lead).name.toUpperCase();
      const full = nm; let fs = 9.75, trk = 1.2; while(FXS.width(nm, `font-family:Montserrat;font-weight:600;font-size:${fs}pt;letter-spacing:${trk}pt`) > pw - 1 && (trk > .2 || fs > 8.5)){ if(trk > .2) trk = Math.max(.2, trk - .2); else fs -= .25; }
      if(FXS.width(nm, `font-family:Montserrat;font-weight:600;font-size:${fs}pt;letter-spacing:${trk}pt`) > pw - 1) FXS.pending.push({slot: slot + '.label' + i, kind: 'strip-label-truncated', detail: `${full} does not fit its column`});
      out += FXS.box(D, c.photo, px, y, pw, h, `${slot}.photo${i}`) + `<div class="abs sl" style="left:${px}pt;top:${y + h + 7}pt;width:${pw}pt;height:14pt;font-size:${fs}pt;letter-spacing:${trk}pt" data-slot="${slot}.label${i}" data-lines="1" data-room="${esc(c.photo)}" data-full="${esc(full)}">${esc(nm)}</div>`; });
    return out; };
  // the four rooms on the cover strip: a living space, the kitchen, the primary bedroom, then one more room (never an outdoor photo: those go on the back)
  FXS.rank = id => /^(family|living|great|open)/.test(id) ? 0 : /^kitchen/.test(id) ? 1 : /^primary(?!.*bath)|^bed/.test(id) ? 2 : 3;
  FXS.coverRooms = (D, avoid) => { avoid = avoid || FXS.coverAvoid || []; const K = (D.sw || {}).front || {}, F = ((D.companion || {}).flyer || {}).front || {}, hero = F.hero || K.hero || 'front'; const clash = id => avoid.some(a => a === id || SW.famOf(a) === SW.famOf(id));
    const cards = FXS.cards(D, [].concat(F.row || [], K.row || [])).filter(c => !FXS.isHouse(D, c.photo) && !FXS.OUTSIDE.test(c.photo) && !/^(stair|foyer|hall|closet|laundry)/.test(c.photo) && c.photo !== hero && !clash(c.photo));
    const out = []; [0, 1, 2, 3].forEach(r => { const c = cards.find(c => FXS.rank(c.photo) === r && !out.includes(c.photo) && !out.some(o => SW.famOf(o) === SW.famOf(c.photo) || o.replace(/\d+[a-z]?$/, '') === c.photo.replace(/\d+[a-z]?$/, ''))); if(c) out.push(c.photo); });
    cards.forEach(c => { if(out.length < 4 && !out.includes(c.photo) && !out.some(o => SW.famOf(o) === SW.famOf(c.photo) || o.replace(/\d+[a-z]?$/, '') === c.photo.replace(/\d+[a-z]?$/, ''))) out.push(c.photo); });
    return out.slice(0, 4); };
  // a logo for a blue field: the agent's dark-field logo, else the logo turned white
  FXS.logoOn = (D, x, y, w, h, just) => { const b = D.brand || {}, src = b.logoOnDark || b.logoKnockout || b.logo, ko = !(b.logoOnDark || b.logoKnockout);
    return `<div class="abs logo" data-area="${w*h}" data-maxh="${h}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;justify-content:${just || 'flex-start'}">${src ? `<img src="${esc(src)}" alt="" ${ko ? 'style="filter:brightness(0) invert(1)"' : ''}>` : `<span class="word" style="color:#fff" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span>`}</div>`; };
  // the agent on blue: name, REALTOR(R), CELL phone, email; a headshot at the left when there is one
  FXS.agentOn = (A, x, y, w, hsSrc, o) => { o = o || {}; const tx = x + (hsSrc ? (o.hs || 66) + 10 : 0);
    return (hsSrc ? `<div class="abs hsbox" style="left:${x}pt;top:${y + 2}pt;width:${o.hs || 66}pt;height:${o.hs || 66}pt"><img src="${esc(hsSrc)}" alt=""></div>` : '') +
      `<div class="abs agentline" style="left:${tx}pt;top:${y}pt;width:${w - (hsSrc ? (o.hs || 66) + 10 : 0)}pt"><div class="n" data-slot="agent.name" data-lines="1">${esc(A.name || '')}</div><div class="d" data-slot="agent.desig" data-lines="1" data-fine="1">REALTOR®</div><div class="p" data-slot="agent.phone" data-lines="1"><i>CELL</i>${esc(A.phone || '')}</div>${o.noEmail ? '' : `<div class="e" data-slot="agent.email" data-lines="1">${esc(A.email || '')}</div>`}</div>`; };
  // the footer bar (blue, bleeding off the bottom and both sides)
  FXS.footBar = (y, W, H, w) => `<div class="bar" style="left:-9pt;top:${y}pt;width:${(w || W || 612) + 9 + (W ? 9 : 9)}pt;height:${(H || 792) - y + 9}pt"></div>`;
  // a captioned photo: photo, the room's name in bold ink (its size small), a paragraph of whole sentences (the fill pass picks them)
  FXS.captioned = (D, c, x, y, w, ph, lines, slot, o) => { o = o || {}; const L0 = FXS.leadLabel(c.lead), lh = o.lh || 13.5, fs = o.fs || 10;
    const nmCss = 'font-family:Montserrat;font-weight:600;font-size:10.5pt'; let name = L0.name + (o.period ? '.' : ''); if(FXS.width(name, nmCss) > w) name = name.split(/ and |, /)[0] + (o.period ? '.' : '');
    const showSize = !o.period && L0.size && FXS.width(name, nmCss) + FXS.width(L0.size, 'font-family:Montserrat;font-weight:500;font-size:9pt') + 12 <= w;
    return FXS.box(D, c.photo, x, y, w, ph, slot) +
      `<div class="abs cname" style="left:${x}pt;top:${y + ph + 6}pt;width:${w}pt;height:14pt" data-slot="${slot}.label" data-lines="1">${esc(name)}${showSize ? `<i>${esc(L0.size)}</i>` : ''}</div>` +
      `<div class="abs cap"><div class="a" style="position:absolute;left:${x}pt;top:${y + ph + 24}pt;width:${w}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" ${o.row ? `data-row="${o.row}"` : ''} data-lh="${lh}" data-lines="${lines}" data-narrow="${o.narrow == null ? 10 : o.narrow}" ${sd(FXS.noFacts(c.s))}></div></div>`; };

  // ---------- the cover (also the flyer front): the FX24 front ----------
  FXS.cover = (D, o) => { o = o || {};
    const L = D.listing, A = D.agent || {}, F = ((D.companion || {}).flyer || {}).front || {}, K = (D.sw || {}).front || {};
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    const X0 = 36, CW = 540, heroId = F.hero || K.hero || 'front', hood = FXS.hood(L);
    // owner 11/7 (FXS-24 review): no agent or brokerage on the cover; the house runs the full width and taller, the facts sit in a blue band
    // under it, a longer write-up fills, and bigger rooms run to the foot
    const HY = 78, FOOT = 774;
    let HH = 336; while(HH > 300 && !SW.fits(D, heroId, 630, HH)) HH -= 4;
    let h = '';
    h += FXS.header(L, {x: -9, y: -9, w: 630, h: 87, tx: 0, tw: 612, vy: 0, vh: 78, max: 30, min: 18});
    h += SW.heroHtml(D, heroId, -9, HY, 630, HH, 'front.house', []);
    let y = HY + HH;
    const st = FXS.statRows(L).slice(0, 4), BH = 56, cw = CW/st.length;
    h += `<div class="bluecard" style="left:-9pt;top:${y}pt;width:630pt;height:${BH}pt"></div>`;
    st.forEach((r, i) => { h += `<div class="abs" style="left:${X0 + i*cw}pt;top:${y + 10}pt;width:${cw}pt;height:${BH - 20}pt;text-align:center;color:#fff;white-space:nowrap" data-slot="fact.${i}" data-lines="2"><div style="font:700 19pt/22pt var(--fx-font)">${esc(r.n)}</div><div style="font:600 8.5pt/12pt var(--fx-font);letter-spacing:.2em">${esc(r.l)}</div></div>`;
      if(i) h += `<div class="abs" style="left:${X0 + i*cw}pt;top:${y + 12}pt;width:.75pt;height:${BH - 24}pt;background:rgba(255,255,255,.45)"></div>`; });
    y += BH + 14;
    if(hood){ h += `<div class="abs" style="left:18pt;top:${y}pt;width:576pt;height:22pt;font:700 16.5pt/22pt var(--fx-font);letter-spacing:.34em;padding-left:.34em;color:var(--fx-ink);text-align:center;white-space:nowrap;overflow:hidden;text-transform:uppercase" data-slot="place.hood" data-lines="1">${esc(hood)}</div>`; y += 26; }
    h += `<div class="abs" style="left:18pt;top:${y}pt;width:576pt;height:15pt;font:500 11.25pt/15pt var(--fx-font);letter-spacing:.34em;padding-left:.34em;color:var(--fx-blue);text-align:center;white-space:nowrap;overflow:hidden" data-slot="place" data-lines="1">${esc(FXS.placeCaps(L))}</div>`;
    y += 15 + 10;
    h += `<div class="brule" style="left:${X0}pt;top:${y}pt;width:${CW}pt"></div>`;
    y += 12;
    // the rooms: three across, to the foot (names under them)
    const ids = FXS.coverRooms(D, o.avoid).slice(0, 3), cards = ids.map(id => FXS.cards(D, []).find(c => c.photo === id)).filter(Boolean);
    const SH = 118, sy = FOOT - 21 - SH;
    const lh = 17.25, nL = Math.max(3, Math.floor((sy - 12 - y)/lh)), tries = []; for(let t = nL; t >= Math.max(3, nL - 2); t--) tries.push(t);
    h += `<div class="abs wu" data-slot="front.summary" data-lines="${nL}" data-try="${tries.join(',')}" data-lh="${lh}" ${sd(o.intro || F.intro || K.summary || [])} style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:${nL*lh}pt"></div>`;
    h += FXS.strip(D, cards, X0, sy, CW, SH, 9, 'front');
    return h;
  };
  // ---------- the plan card (IvoryPlan) at (x, y, w): returns {html, bottom, issues} ----------
  FXS.planCard = (D, x, y, w, maxH) => {
    const iw = w - 28.8, planRot = (() => { const r0 = IvoryPlan.draw(D.plan, {x: x + 14.4, y: 0, w: iw, h: 250}, {allowRotate: false}); return (r0.issues || []).some(i => /label-wont-fit/.test(i.kind)); })();
    const fit = mh => { for(let hh = mh; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: x + 14.4, y: 0, w: iw, h: hh}, {allowRotate: planRot}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')) return Math.min(hh, Math.ceil(big.usedH || hh) + 6); } return 200; };
    const ph = fit(maxH), r = IvoryPlan.draw(D.plan, {x: x + 14.4, y: y + 8, w: iw, h: ph - 4}, {allowRotate: planRot});
    const zs = IvoryPlan.zonesOf(D.plan);
    const leg = Object.entries(IvoryPlan.ZONES).filter(([k]) => zs.includes(k)).map(([k, z]) => `<span><i style="background:color-mix(in srgb, ${z.fill} ${Math.round(z.op*100)}%, var(--fx-paper))"></i>${z.label}</span>`);
    if(zs.includes('outdoor')) leg.push(`<span><i style="background:repeating-linear-gradient(45deg, color-mix(in srgb, var(--accent) 35%, var(--fx-paper)) 0 .6pt, var(--fx-paper) .6pt 2.8pt)"></i>Outdoor</span>`);
    const note = (D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate.' + ((r.angle === 90 || r.angle === 270) ? ' Turned on its side.' : '');
    const ly = y + ph + 6, bottom = ly + 30;
    const html = `<div class="card" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${bottom - y}pt;background:var(--fx-seal)"></div><div class="abs planwrap" style="left:0;top:0;width:612pt;height:792pt;--paper:var(--fx-seal)">${r.html}<div class="plan-legend" style="left:${x + 14}pt;top:${ly}pt">${leg.join('')}</div><div class="plan-disclosure" style="left:${x + 14}pt;width:${w - 28}pt;top:${ly + 14}pt;text-align:left" data-slot="back.plannote" data-lines="1" data-fine="1">${esc(note)}</div></div>`;
    return {html, bottom, issues: r.issues || []};
  };

  // a bullet list inside a card: the shortest way each item can be said, one line each
  FXS.bullets = (items, x, y, w, rowH, slot, max, fs) => { let h = ''; const out = [];
    items.forEach(t => { if(out.length < max && FXS.width(t, `font-family:Montserrat;font-weight:400;font-size:${fs}pt`) <= w - 14) out.push(t); });
    out.forEach((t, i) => { h += `<div class="bul" data-slot="${slot}.${i}" data-lines="1" style="left:${x}pt;top:${y + i*rowH}pt;width:${w}pt;height:${rowH}pt;font-size:${fs}pt">${esc(t)}</div>`; });
    return {html: h, n: out.length}; };
  FXS.shortest = a => [].concat(a).slice().sort((p, q) => p.length - q.length)[0].replace(/\.$/, '');
  FXS.nearText = n => { const d = String(n.dist), p = String(n.place); return /^\d|mile|min/i.test(d) ? `${p}, ${d}` : `${d} ${p.toLowerCase()}`; };

  // real selling facts for the back's two boxes, read from the package's own sentences (never a box label like CABINETS)
  FXS.sellingFacts = D => {
    const strs = []; const walk = (o, k) => { if(k === 'nearby') return; if(typeof o === 'string') strs.push(o); else if(Array.isArray(o)) o.forEach(v => walk(v, k)); else if(o && typeof o === 'object') Object.keys(o).forEach(kk => walk(o[kk], kk)); };
    walk(D.sw || {}); walk(D.companion || {});
    const T = strs.join(' \n ');
    const L = D.listing, has = re => re.test(T), grab = re => { const m = re.exec(T); return m ? m : null; };
    const inside = [], outside = [], add = (a, t) => { if(t && !a.includes(t)) a.push(t); };
    let m = grab(/roof[^.]{0,60}?(?:replaced|new|redone)[^.]{0,40}?(20\d\d)/i) || grab(/(?:replaced|new)[^.]{0,30}roof[^.]{0,40}?(20\d\d)/i) || grab(/roof[^.]{0,40}(20\d\d)/i);
    if(m) add(inside, `Roof replaced in ${m[1]}`); else if(has(/new roof/i)) add(inside, 'New roof');
    if(has(/low-?e/i)) add(inside, 'Low-E windows');
    if(has(/insulated exterior doors?/i)) add(inside, 'Insulated exterior doors');
    if(has(/programmable thermostat/i)) add(inside, 'Programmable thermostat');
    if(has(/gated front entry/i)) add(inside, 'Gated front entry'); else if(has(/gated/i)) add(inside, 'Gated community');
    if(has(/\b(two|2)-car garage|garage for two|two cars/i)) add(inside, '2-car garage'); else if(has(/garage/i)) add(inside, 'Attached garage');
    if(has(/three-phase/i)) add(inside, 'Three-phase power');
    if(has(/new wiring/i)) add(inside, has(/breaker box/i) ? 'New wiring and breaker box' : 'New wiring');
    if(has(/new plumbing/i)) add(inside, 'New plumbing');
    if(has(/fiber cement|hardie|hardi/i)) add(inside, 'Fiber cement siding');
    if(has(/new driveway/i)) add(inside, 'New driveway');
    if(has(/tray ceiling/i)) add(inside, 'Tray ceilings');
    else if(has(/high ceilings/i)) add(inside, 'High ceilings');
    if(has(/vaulted ceiling/i)) add(inside, 'Vaulted ceiling');
    if(has(/crown molding/i)) add(inside, 'Crown molding');
    if(has(/wood floors|hardwood|wood-look/i)) add(inside, 'Wood floors');
    if(has(/walk-in closet/i)) add(inside, 'Walk-in closet');
    if(has(/pet-friendly/i)) add(inside, 'Pet-friendly community');
    if(has(/hardwood|wood floors/i) && has(/stairs|staircase|stair rail/i)) add(inside, 'Open staircase');
    if(has(/\bdeck\b/i) && has(/pergola/i)) add(outside, 'Wood deck with a pergola'); else if(has(/\bdeck\b/i)) add(outside, 'Wood deck'); else if(has(/pergola/i)) add(outside, 'Pergola');
    if(has(/fully fenced|fenced yard|fenced backyard|fencing/i)) add(outside, 'Fenced yard');
    if(has(/rooftop patio/i)) add(outside, 'Rooftop patio');
    if(has(/covered patio/i)) add(outside, 'Covered patio'); else if(has(/\bpatio\b/i)) add(outside, 'Patio');
    if(has(/balcon/i)) add(outside, 'Covered balcony');
    if(has(/turf/i)) add(outside, 'Turf backyard');
    if(has(/mature trees/i)) add(outside, 'Mature trees');
    if(has(/community park|gazebo/i)) add(outside, 'Community park with a gazebo');
    const yr = L.yearBuilt || L.year, lot = L.lotSize ? String(L.lotSize).replace(/\s*Sq Ft Lot/i, ' sq ft lot') : '';
    [yr ? `Built in ${yr}` : '', L.stories ? (L.stories == 1 ? 'One story, no stairs' : `${L.stories} stories`) : '', L.beds ? `${L.beds} bedrooms` : '', L.sqft ? `${Number(L.sqft).toLocaleString('en-US')} square feet` : ''].forEach(t => { if(inside.length < 5) add(inside, t); });
    [lot, L.stories ? (L.stories == 1 ? 'One story, no stairs' : `${L.stories} stories`) : ''].forEach(t => { if(outside.length < 2 + 0) add(outside, t); });
    return {inside, outside};
  };

  // ---------- the back (also the flyer back): the FX24 back ----------
  FXS.innerBar = (L, vh) => FXS.header(L, {x: -9, y: -9, w: 630, h: (vh || 62) + 9, tx: 0, tw: 612, vy: 0, vh: vh || 62, max: 19.5, min: 13});
  FXS.back = (D, o) => { o = o || {};
    const L = D.listing, A = D.agent || {}, b = D.brand || {}, hasPlan = !!D.plan, LX = 36, LW = 390, gap = 9, rw = (LW - gap)/2;
    const F = (D.companion || {}).flyer || {}, FB = F.back || {}, KB = (D.sw || {}).back || {}, Kleft = (D.sw || {}).left || {};
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    const used = [(((D.sw||{}).front||{}).hero) || 'front'].concat(o.coverIds || FXS.coverRooms(D), o.avoid || []);
    const first = (hasPlan ? FB.photos : (FB.photosNoplan || FB.photos)) || [];
    const all = FXS.cards(D, first), issues = [], bottom = 664;
    let h = '';
    // header: the street over the blue bar, the place in the deeper cell at the right
    h += FXS.header(L, {x: -9, y: -9, w: 630, h: 71, tx: 0, tw: 444, vy: 0, vh: 62, max: 19.5, min: 12, track: '.25em'});
    h += `<div class="bar deep" style="left:444pt;top:-9pt;width:177pt;height:71pt"></div>`;
    const cell = (FXS.hood(L) || L.city).toUpperCase();
    h += `<div class="abs" style="left:444pt;top:21pt;width:168pt;height:20pt;font:600 9.75pt/20pt var(--fx-font);letter-spacing:.2em;padding-left:.2em;color:#fff;text-align:center;white-space:nowrap;overflow:hidden" data-slot="place" data-lines="1">${esc(cell)}</div>`;
    h += `<div class="bluecard" style="left:444pt;top:62pt;width:177pt;height:603pt"></div>`;
    // ---- the sidebar: new and updated, outside, nearby
    const SF = FXS.sellingFacts(D), near = (FB.nearby || KB.nearby || []).slice(0, 3);
    const covTxt = JSON.stringify(o.coverText || '');
    const upd = SF.inside.filter(t => !(/garage/i.test(t) && /garage/i.test(covTxt))).slice(0, 7), outs = SF.outside.slice(0, 3);
    const gl = []; { const n = v => Number(v).toLocaleString('en-US'), bt = window.BD && BD.bathsText ? BD.bathsText(L).main : `${L.baths} Full Baths`;
      if(L.beds) gl.push(`${L.beds} ${L.beds == 1 ? 'Bed' : 'Beds'}${L.baths ? ', ' + bt : ''}`); const yr = L.yearBuilt || L.year; if(L.sqft) gl.push(`${n(L.sqft)} sq ft${yr ? ', built ' + yr : ''}`);
      gl.push(L.stories == 1 ? 'One story, no stairs' : L.stories ? `${L.stories} stories` : (L.lotSize ? String(L.lotSize).replace(/\s*Sq Ft Lot/i, ' sq ft lot') : '')); }
    const secs = [gl.filter(Boolean).length ? ['At a glance', gl.filter(Boolean), 'back.glance'] : null, ['New and updated', upd, 'back.updates'], outs.length ? ['Outside', outs, 'back.outside'] : null, near.length ? ['Nearby', near, 'back.nearby'] : null].filter(Boolean);
    // title case so no item wraps; "and" becomes "&" and the nearby distances read "mi"
    const small = /^(a|an|and|at|for|in|of|on|or|the|to|with)$/i;
    const tc = t => String(t).replace(/\s+and\s+/gi, ' & ').toLowerCase().replace(/(^|[\s,(])([a-z][a-z'’]*)/g, (m0, pre, w, i) => pre + (i > 0 && small.test(w) ? w : w[0].toUpperCase() + w.slice(1))).replace(/-([a-z])\b/g, (m0, c) => '-' + c.toUpperCase()).replace(/\bMi\b/g, 'mi');
    const SBX = 458, SBW = 134, rcss = fs => `font-family:Montserrat;font-weight:500;letter-spacing:.01em;font-size:${fs}pt`;
    secs.forEach(sc => { sc[1] = sc[1].map(t => (t && t.place) ? {l: tc(t.place), r: String(t.dist).replace(/\s*miles?$/i, ' mi')} : {l: tc(t)}); });
    const fitW = (it, fs) => FXS.width(it.l, rcss(fs)) + (it.r ? FXS.width(it.r, rcss(fs)) + 12 : 0);
    secs.forEach(sc => { sc[1].forEach(it => { if(fitW(it, 10) > SBW){ it.l = it.l.replace(/ Houston$/, '').replace(/ Exterior/, '').replace(/ Collection$/, ''); } }); });
    secs.forEach(sc => { sc[1].forEach(it => { if(fitW(it, 9.5) > SBW) it.l = it.l.replace(/ Park$/, ''); }); });
    let rowFs = 10; while(rowFs > 8.5 && secs.some(sc => sc[1].some(it => fitW(it, rowFs) > SBW))) rowFs -= .25;
    const nRows = secs.reduce((t, s) => t + s[1].length, 0), SB_TOP = 86, SB_BOT = 655, labelH = 12 + 6, ROWH = 14.5, TOPGAP = 13;
    const fixed = secs.length*labelH + nRows*ROWH, space = SB_BOT - SB_TOP;
    let rowGap = 7, secGap = 0; const calc = () => { secGap = secs.length > 1 ? (space - fixed - (nRows - secs.length)*rowGap)/(secs.length - 1) : 0; }; calc();
    while(secGap > 34 && rowGap < 16){ rowGap += 1; calc(); }
    secGap = Math.max(secGap, TOPGAP);   // about 0.18 in above each group head, about 0.08 in below it
    let sy = SB_TOP;
    secs.forEach(([title, list, slot], si) => {
      h += `<div class="abs" style="left:${SBX}pt;top:${sy}pt">${FXS.label(title, slot + '.title').replace('class="lbl"', 'class="lbl on"')}</div>`; sy += labelH;
      list.forEach((it, i) => { h += `<div class="fnote" style="left:${SBX}pt;top:${sy}pt;width:${SBW}pt;height:${ROWH}pt;display:flex;justify-content:space-between;white-space:nowrap;text-transform:none;letter-spacing:.01em;font-size:${rowFs}pt;line-height:${ROWH}pt" data-slot="${slot}.${i}" data-lines="1"><span>${esc(it.l)}</span>${it.r ? `<span>${esc(it.r)}</span>` : ''}</div>`; sy += ROWH + (i < list.length - 1 ? rowGap : 0); });
      sy += secGap;
    });
    FXS.avoid = upd.concat(outs).map(t => String(t));
    // ---- the left column
    const aboutS = [].concat(...(FB.floors || []).map(f => f.s));
    const nk = x => String(x).toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 40);
    let shown = [];
    const shownSet = list => new Set([].concat(...list.map(c => [].concat(...(c.s || []).map(z => [].concat(z))))).map(nk));
    if(hasPlan){
      const pc = FXS.planCard(D, LX, 76, LW, Math.max(130, o.planMax || 300)); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues;
      const y = pc.bottom + 14, aboutBlock = 12 + 7 + 3*16.5 + 14, ph = Math.max(70, Math.min(175, bottom - y - aboutBlock - 25 - 3*13.5));
      const pick = FXS.pick(D, all, 4, {avoid: used, exactAvoid: !!o.outdoor, outdoor: !!o.outdoor, house: !!o.outdoor}).filter(c => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, rw, ph)).slice(0, 2);
      shown = pick.slice();
      pick.forEach((c, i) => { h += FXS.captioned(D, c, LX + i*(rw + gap), y, pick.length === 1 ? Math.min(LW, ph*2.5) : rw, ph, 3, 'back.photo' + i, {narrow: 12, period: !!o.outdoor, row: 'back.r0'}); });
      const ay = y + ph + 25 + 3*13.5 + 14, kept = FXS.noFacts(aboutS.filter(x => ![].concat(x).some(a => shownSet(shown).has(nk(a)))));
      h += `<div class="abs" style="left:${LX}pt;top:${ay}pt">${FXS.label('The house', 'back.about.label')}</div><div class="abs body" data-slot="back.about" data-lines="3" data-try="3,4" data-lh="16.5" ${sd(kept.length >= 3 ? kept : aboutS)} style="left:${LX}pt;top:${ay + 19}pt;width:${LW}pt;height:${3*16.5}pt;font-size:10.5pt;line-height:16.5pt"></div>`;
    } else {
      const aboutLines = 4, rowsTop0 = 82 + 19 + aboutLines*16.5 + 16;
      const pick = FXS.pick(D, all, 6, {avoid: used, exactAvoid: !!o.outdoor, outdoor: !!o.outdoor, house: !!o.outdoor});
      const ph0 = Math.floor((bottom - rowsTop0 - 14 - 2*(24 + 3*13.5))/2);
      const use = pick.filter(c => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, rw, Math.min(ph0, 150))).slice(0, 4);
      const phS = Math.floor((bottom - rowsTop0 - 14 - 2*(24 + 3*13.5))/2), useS = pick.filter(c => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, LW, phS));
      const stacked = use.length < 4 && useS.length >= 2, n = stacked ? 2 : use.length >= 4 ? 4 : use.length >= 2 ? 2 : use.length;
      shown = (stacked ? useS : use).slice(0, n);
      if(stacked){   // two photos, one over the other, the width of the column: the page is filled
        shown.forEach((c, i) => { h += FXS.captioned(D, c, LX, rowsTop0 + i*(phS + 24 + 3*13.5 + 14), LW, phS, 3, 'back.photo' + i, {narrow: 12, period: !!o.outdoor}); });
      } else {
        const ph = n === 4 ? Math.min(150, ph0) : Math.min(n === 1 ? 250 : 215, bottom - rowsTop0 - 24 - 3*13.5), pad = n === 4 ? Math.max(0, (bottom - rowsTop0 - 14 - 2*(ph + 24 + 3*13.5))/3) : 0;
        shown.forEach((c, i) => { const r = Math.floor(i/2), cx = LX + (i%2)*(rw + gap), cy = rowsTop0 + pad + r*(ph + 24 + 3*13.5 + 14 + pad);
          h += FXS.captioned(D, c, cx, cy, n === 1 ? LW : rw, ph, 3, 'back.photo' + i, {narrow: 12, period: !!o.outdoor, row: 'back.r' + r}); });
      }
      const kept = FXS.noFacts(aboutS.filter(x => ![].concat(x).some(a => shownSet(shown).has(nk(a)))));
      h += `<div class="abs" style="left:${LX}pt;top:82pt">${FXS.label('The house', 'back.about.label')}</div><div class="abs body" data-slot="back.about" data-lines="${aboutLines}" data-try="4,5,3" data-lh="16.5" ${sd(kept.length >= 3 ? kept : aboutS)} style="left:${LX}pt;top:101pt;width:${LW}pt;height:${aboutLines*16.5}pt;font-size:10.5pt;line-height:16.5pt"></div>`;
    }
    // ---- the standard agent card, then the fine print
    // owner 11/7 (fold-over review p2, p5): the contact block sits centered up and down between the blue column's foot (665) and the page bottom (792); the fine print right under it
    h += ContactCard.html([36, 690, 540, 74], Object.assign({}, A, {headshot: hsSrc}), Object.assign({}, b, {logo: b.logo}), {layout: 'panel', size: 'mid', fine: '', bottomGap: 0.5, fieldAccent: true});
    h += `<div class="abs fine" style="left:36pt;top:765pt;width:540pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">Information deemed reliable but not guaranteed.</div>`;
    FXS.avoid = [];
    return {html: h, issues};
  };
  const FXP_lines = (t, css, w) => { const m = document.createElement('div'); m.style.cssText = `position:absolute;left:-9999pt;visibility:hidden;width:${w}pt;white-space:normal;${css}`; m.textContent = t; document.body.appendChild(m);
    const r = document.createRange(); r.selectNodeContents(m); const tops = new Set([...r.getClientRects()].filter(q => q.width > .5).map(q => Math.round(q.top))); m.remove(); return Math.max(1, tops.size); };

  // the header and footer on the inside pages
  FXS.pageHead = (kicker, title, intro, slot, lines) => { const X0 = 36, CW = 540;
    const ts = FXS.fitSize(title, "font-family:Montserrat;font-weight:700", CW, 24, 17), lh = 17.25, tr = []; for(let t = lines; t >= 2; t--) tr.push(t);
    const ky = 76, ty = ky + 18, iy = ty + ts*1.25 + 6;
    return {html: FXS.innerBar(SW.data().listing, 62) + `<div class="abs" style="left:${X0}pt;top:${ky}pt">${FXS.label(kicker, slot + '.kicker')}</div>
      <div class="abs" style="left:${X0}pt;top:${ty}pt;width:${CW}pt;height:${ts*1.25}pt;font:700 ${ts}pt/${ts*1.25}pt var(--fx-font);color:var(--fx-ink);white-space:nowrap;overflow:hidden" data-slot="${slot}.title" data-lines="1">${esc(title)}</div>
      <div class="abs wu" data-slot="${slot}.intro" data-lines="${lines}" data-narrow="16" data-try="${tr.join(',')}" data-lh="${lh}" ${sd(intro)} style="left:${X0}pt;top:${iy}pt;width:${CW}pt;height:${lines*lh}pt"></div>`, bottom: iy + lines*lh}; };
  FXS.repCheck = () => { const out = [...FXS.underCheck(), ...FXS.factCheck(), ...FXS.edgeCheck(), ...FXS.faceCheck(), ...FXS.pending], seenS = new Map();
    { const D0 = SW.data(), O = D0.openHouse || {}, txt = document.body.innerText.replace(/\s+/g, ' ').toLowerCase(); const has = t => txt.includes(String(t).replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 14));
      if(O.kind && O.kind !== 'public') [['refreshments', O.refreshments], ['note', O.note]].forEach(([k, t]) => { if(t && String(SW.noRSVP(t)).trim() && !has(SW.noRSVP(t))) out.push({slot: 'oh.' + k, kind: 'perk-dropped', detail: 'a REALTOR\u00ae perk line is missing from the piece'}); }); }
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return;
      const txt = String(el.textContent), r = SW.rep5(txt); if(r) out.push({slot: el.dataset.slot, kind: 'repeated-phrase', detail: `"${r}" repeats in one block`});
      txt.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x.length >= 28).forEach(x => { const k = x.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 48), prev = seenS.get(k);
        if(prev && prev !== el.dataset.slot) out.push({slot: el.dataset.slot, kind: 'duplicate-sentence', detail: `"${x.slice(0, 60)}" also in ${prev}`}); else seenS.set(k, el.dataset.slot); }); });
    return out; };
  FXS.hookCheck = () => { let bc = null; Object.defineProperty(window, 'brochureCheck', {configurable: true, get: () => bc, set: v => { bc = typeof v === 'function' ? (() => v().concat(FXS.repCheck())) : v; }}); };
  window.SW = SW; window.FXS = SW;
})();

