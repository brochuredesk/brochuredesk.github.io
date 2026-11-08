/* fxs-13 helpers (ported from the swatchbook set's swatchbook.js, FX13 look): data, photos, captions and paragraphs that fill their boxes, logos, print checks, the set's tokens (FXS.tok, read from fxs13.css) and marks (icons, arch).

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
      if(p.zoom){ img.style.transformOrigin = `${(fx*100).toFixed(1)}% ${(fy*100).toFixed(1)}%`; img.style.transform = `scale(${p.zoom})`; }   // a tight crop (the wine bar: fridge and bottles; the bath: the vanity side)
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
    return {n: lines.length, fill: last ? (last.r-last.l)/box : 0, min: lines.length > 1 ? Math.min(...lines.slice(0, -1).map(l => (l.r - l.l)/box)) : 1};
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
      if(SW.rep5((lead ? lead + ' ' : '') + pick.join(' '))) return;
      if(/photo\d/.test(el.dataset.slot || '') && window.FXS && FXS.sharedNouns) for(let a = 0; a < pick.length; a++) for(let b = a + 1; b < pick.length; b++) if(FXS.sharedNouns(pick[a], pick[b]).length >= 2) return;   // a caption never says one noun pair twice
      if(el.dataset.justify && window.FXS && FXS.sameFact) for(let a = 0; a < pick.length; a++) for(let b = a + 1; b < pick.length; b++) if(FXS.sameFact(pick[a], pick[b])) return;   // a justified write-up never says one fact twice
      const est = (lead0 + pick.join(' ').length) / cpl;
      if(est < T - 1.5 || est > T + 0.9) return;
      el.innerHTML = html(lead, pick);
      const L = SW.lines(el);
      if(L.n === T + 1 && (!hi || L.fill < hi.fill)) hi = {fill: L.fill};
      if(L.n === T - 1 && (!lo || L.fill > lo.fill)) lo = {fill: L.fill};
      if(L.n !== T) return;
      if(!near || L.fill > near.fill) near = {pick, fill: L.fill};
      if(L.fill < Math.max(0.76, +el.dataset.fill || 0)) return;   // data-fill: a write-up's own floor (0.9, owner 11/7-11/8)
      if(el.dataset.lfill && L.min < +el.dataset.lfill) return;   // a justified write-up: every line already 80%+ full set ragged, so justifying never opens wide gaps
      const score = (L.fill >= 0.8 ? 1000 : 500) - pick.length * 10 + L.fill + (el.dataset.lfill ? 20*L.min : 0);   // the fewest, fullest sentences that fill the box; the last line well filled
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
  SW.pfN = pfN;
  // after the fill: a full-width justified write-up whose sentences end short of its box takes the smallest bigger type (0.25 pt steps, up to 1.25x) at which a set of
  // its sentences fills the box, every line 80%+ and the last 90%+ set ragged; then it is justified (owner 11/7 bigger type fills, 11/8 no blank space; as FXS-14 FO.grow)
  SW.grow = () => document.querySelectorAll('[data-justify]').forEach(el => { if(!el.textContent.trim()) return;
    const H = +el.dataset.h0 || parseFloat(el.style.height), cs = getComputedStyle(el), fs0 = parseFloat(cs.fontSize)*0.75, r = (parseFloat(cs.lineHeight)*0.75)/fs0 || 1.5;
    const keep = el.innerHTML; el.style.textAlign = 'left'; let best = null;
    for(let fs = fs0; fs <= fs0*1.25 + 0.01 && !best; fs += 0.25){ el.style.fontSize = fs + 'pt'; el.style.lineHeight = (fs*r) + 'pt';
      const T = Math.floor((H + 0.5)/(fs*r)); if(T < 2) continue;
      for(const t of [T, T - 1]){ if(t*fs*r < H - 1.5*fs*r) continue; const b = pfN(el, t); if(b){ best = {fs, n: t, pick: b.pick}; break; } } }
    if(!best){ el.style.fontSize = fs0 + 'pt'; el.style.lineHeight = (fs0*r) + 'pt'; el.innerHTML = keep; }
    else { el.style.fontSize = best.fs + 'pt'; el.innerHTML = (el.dataset.lead ? `<b>${esc(el.dataset.lead)}</b> ` : '') + esc(best.pick.join(' ')); el.style.height = (best.n*best.fs*r) + 'pt'; el.dataset.lines = best.n; }
    el.style.textAlign = 'justify'; });
  const LH = 12.5, CAPPAD = 5;
  SW.fill = () => {
    const issues = [];
    document.querySelectorAll('[data-s]').forEach(e => { e.dataset.fixed = '1'; });
    const caps = [...document.querySelectorAll('.cap .a[data-s]')], rest = [...document.querySelectorAll('[data-s]')].filter(e => !caps.includes(e));
    const settle = (el, T) => {   // T lines: the best set, else the nearest and a report
      const lead = el.dataset.lead || '', b = pfN(el, T);
      if(b){ el.innerHTML = html(lead, b.pick); delete el.dataset.diag; }
      else el.innerHTML = html(lead, el.__near ? el.__near.pick : JSON.parse(el.dataset.s).map(x => [].concat(x)[0]));
      el.dataset.lines = T; return !!b;
    };
    rest.forEach(el => {
      // data-try="5,4,3": the line counts this box may take (most lines first); the first that the whole sentences fill (last line 3/4 full) wins
      const tries = (el.dataset.try || '').split(',').map(Number).filter(Boolean);
      if(tries.length){
        let T = tries.find(t => pfN(el, t));
        if(!T){ let bestT = tries[0], bf = -1; tries.forEach(t => { pfN(el, t); if(el.__near && el.__near.fill > bf){ bf = el.__near.fill; bestT = t; } }); T = bestT; }
        settle(el, T);
        if(el.dataset.lh) el.style.height = (T * +el.dataset.lh) + 'pt';
      } else settle(el, +el.dataset.lines || 1);
    });
    SW.grow();
    // photo captions shrink to what their sentences honestly fill (never padded): the photo takes the room. The captions in one row share a line count when they can.
    const groups = new Map();
    caps.forEach(el => { const g = el.closest('.row') || el; (groups.get(g) || groups.set(g, []).get(g)).push(el); });
    groups.forEach(els => {
      const max = Math.max(...els.map(e => +e.dataset.lines));
      let chosen = null;
      for(let T = max; T >= 2 && !chosen; T--) if(els.every(e => pfN(e, T))) chosen = T;
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
      else if(L.fill < Math.max(0.75, (+el.dataset.fill || 0) - 0.005)) issues.push({slot:el.dataset.slot, kind:'last-line-short', pct:Math.round(L.fill*100), diag: el.dataset.diag || ''});
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
      if(h < 85 || w/h > 3.1 || w < 108) issues.push({slot: el.dataset.slotPhoto || el.dataset.photo, kind:'photo-too-thin', detail: `${w.toFixed(0)} x ${h.toFixed(0)} pt`}); });
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
    return issues;
  };
  SW.famOf = id => { id = String(id).replace(/(\d)[a-z]$/, '$1'); return /^(deck|pergola|patio|fence|evening)\d*$/.test(id) ? 'outdoor' : /^(front)\d*$/.test(id) ? 'front' : /^(primary|game|terrace|gazebo)\d*$/.test(id) ? id.replace(/\d+$/, '') : id; };
  SW.placements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));


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
    if(w2 < 60) return box(x, y, w, h, id, slot);   // the frame is already narrower than 1.3 : 1: no room for the two side photos (they came out with a negative width); the crop check still reports a cut house
    return box(x, y, w1, h, id, slot) + box(x + w1 + gap, y, w2, hh, side[0], slot + '.side0') + box(x + w1 + gap, y + hh + 10, w2, hh, side[1], slot + '.side1');
  };


  // ---------- the set's tokens (fxs13-tokens.css is the one source) and marks ----------
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
  FXS.vt = (cx, cy, len, th, cls, style, inner, attrs) => `<div class="vt ${cls}" ${attrs || ''} style="left:${cx - len/2}pt;top:${cy - th/2}pt;width:${len}pt;height:${th}pt;${style || ''}">${inner}</div>`;
  // the vertical address in the left gutter: the full street address on one line at the biggest size that fits `len`
  FXS.vAddress = (address, cx, cy, len, max, min) => {
    const css = "font-family:'Bodoni Moda';font-weight:500;letter-spacing:1.5pt";
    const s = FXS.fitSize(address, css, len, max, min || max*.5);
    return FXS.vt(cx, cy, len, s*1.5, 'vaddr', `font-size:${s}pt`, esc(address), 'data-slot="address" data-lines="1"');
  };
  // the round seal (owner 11/7): the house's own neighborhood name only, centered both ways on one or two lines at 9 pt or more; no "Houston"; dropped (returns '') when the name cannot fit at 9 pt
  FXS.seal = (D, cx, cy, d, slot, o) => { o = o || {};
    const name = String(FXS.hood(D.listing) || '').trim(); if(!name) return '';
    const inner = d*.78, css = "font-family:'Cormorant Garamond';font-weight:500", MIN = 9, w = (tx, s) => FXS.width(tx, `${css};font-size:${s}pt`);
    const opts = [], s1 = FXS.fitSize(name, css, inner, d*.24, MIN); if(w(name, s1) <= inner) opts.push({lines: [name], s: s1});
    const ws = name.split(/\s+/);
    if(ws.length > 1){ let best = null; for(let k = 1; k < ws.length; k++){ const a2 = ws.slice(0, k).join(' '), b2 = ws.slice(k).join(' '), m = Math.max(w(a2, 12), w(b2, 12)); if(!best || m < best.m) best = {m, lines: [a2, b2]}; }
      const s2 = Math.min(d*.24, ...best.lines.map(tx => FXS.fitSize(tx, css, inner, d*.24, MIN))); if(best.lines.every(tx => w(tx, s2) <= inner) && s2 >= MIN) opts.push({lines: best.lines, s: s2}); }
    if(!opts.length) return '';   // cannot fit at 9 pt: the circle is dropped
    const pickO = opts.sort((p, q) => q.s - p.s)[0], lines = pickO.lines, s = pickO.s;
    return `<div class="seal" data-slot="${slot || 'seal'}" style="left:${cx - d/2}pt;top:${cy - d/2}pt;width:${d}pt;height:${d}pt"><div class="nm" style="font-size:${s}pt;line-height:1.08;text-align:center;width:100%" data-slot="${slot || 'seal'}.name" data-lines="${lines.length}">${lines.map(esc).join('<br>')}</div></div>`;
  };
  // the small seal that carries the year built
  FXS.yearSeal = (cx, cy, d, year, slot) => `<div class="seal" style="left:${cx - d/2}pt;top:${cy - d/2}pt;width:${d}pt;height:${d}pt"><div class="k" data-slot="${slot}.k" data-lines="1" data-fine="1">BUILT</div><div class="yr" style="font-size:${d*.3}pt" data-slot="${slot}" data-lines="1">${esc(String(year))}</div></div>`;
  // the stat row texts: beds, baths, square feet, built (four, as FX13)
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
  FXS.statsRow = (items, x, y, w, h, slot, o) => { o = o || {}; return `<div class="stats tc" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${items.map((t, i) => `<div class="s" data-slot="${slot}.${i}" data-lines="1"><span class="si">${FXS.statHtml(t, o.np, o.lp, o.track)}</span></div>`).join('')}</div>`; };
  FXS.label = (t, slot, style) => `<div class="lbl" ${slot ? `data-slot="${slot}" data-lines="1"` : ''} style="${style || ''}">${esc(String(t).toUpperCase())}</div>`;
  // a photo box at (x, y, w, h)
  FXS.box = (D, id, x, y, w, h, slot, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${SW.photo(D, id, `position:absolute;inset:0;${css || ''}`, slot)}</div>`;
  // a logo, sized to a box (the one brokerage logo of a side)
  FXS.logo = (D, x, y, w, h, just) => { const b = D.brand || {}; const src = b.logo; return `<div class="abs logo" data-area="${w*h}" data-maxh="${h}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;justify-content:${just || 'flex-start'}">${src ? `<img src="${esc(src)}" alt="">` : `<span class="word" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span>`}</div>`; };
  // the agent block of a front: name, REALTOR(R), phone, email, left aligned at (x, y)
  FXS.agent = (A, x, y, w, hsSrc) => {
    const tx = x + (hsSrc ? 70 : 0);
    return (hsSrc ? `<div class="abs hsbox" style="left:${x}pt;top:${y + 2}pt;width:62pt;height:62pt"><img src="${esc(hsSrc)}" alt=""></div>` : '') +
      `<div class="abs agentline" style="left:${tx}pt;top:${y}pt;width:${w - (hsSrc ? 70 : 0)}pt"><div class="n" data-slot="agent.name" data-lines="1">${esc(A.name || '')}</div><div class="d" data-slot="agent.desig" data-lines="1" data-fine="1">REALTOR®</div><div class="p" data-slot="agent.phone" data-lines="1">${esc(A.phone || '')}</div><div class="e" data-slot="agent.email" data-lines="1">${esc(A.email || '')}</div></div>`;
  };
  // light words then a bold last word
  FXS.lightBold = t => esc(t);


  // ---------- photo cards (a photo id, a lead, whole sentences) and the choosing rules ----------
  const LABELS = [[/^front/, 'Front.'], [/^entry/, 'Entry.'], [/^pergola/, 'Pergola.'], [/^deck/, 'Deck.'], [/^patio/, 'Patio.'], [/^evening/, 'Deck at dusk.'], [/^yard2/, 'Covered patio.'], [/^walk/, 'Front door.'], [/^(fence|yard)/, 'Yard.'], [/^terrace/, 'Terrace.'], [/^balcony/, 'Balcony.'], [/^nook/, 'Breakfast nook.'], [/^stair/, 'Stair.'], [/^foyer/, 'Foyer.'], [/^hall/, 'Hall.'], [/^bar/, 'Wine bar.'], [/^wine/, 'Living room.'], [/^kitchen/, 'Kitchen.'], [/^dining/, 'Dining area.'], [/^(family|living|openplan)/, 'Living room.'], [/^primary/, 'Primary suite.'], [/^pbath/, 'Primary bath.'], [/^bath/, 'Bath.'], [/^bed/, 'Bedroom.'], [/^closet/, 'Closet.'], [/^laundry/, 'Laundry.'], [/^game/, 'Game room.'], [/^park/, 'Community park.'], [/^gazebo/, 'Community park.']];
  FXS.labelFor = id => { const ov = ((((SW.data() || {}).sw || {}).v2 || {}).labels || {})[id]; if(ov) return ov + '.'; const m = LABELS.find(([re]) => re.test(id)); return m ? m[1] : (String(id).replace(/\d+[a-z]?$/, '').replace(/^./, c => c.toUpperCase()) + '.'); };
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
  // the card (photo, lead, sentences) written for a photo id: the plan's own cards first, then every card the package carries, then the room notes
  FXS.cardFor = (D, id) => { const K = D.sw || {}, F = (D.companion || {}).flyer || {}, P = ((K.plan || {}).cards || {})[id]; if(P) return P;
    const all = [].concat((K.back||{}).photos||[], (K.back||{}).photosNoplan||[], (F.back||{}).photos||[], (F.back||{}).photosNoplan||[], (K.left||{}).photos||[], [].concat(...(((K.right||{}).rows)||[])), (K.front||{}).row||[], (F.front||{}).row||[]);
    return all.find(c => c && c.photo === id && (c.s || []).length) || FXS.spareCap(D, id); };
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
  FXS.coverRooms = D => { const PC = (((D.sw || {}).plan || {}).cover || []).slice(1).filter(id => (D.photos || {})[id]); if(PC.length >= 2) return PC.slice(0, 2);
    const F = (D.sw || {}).front || {}, ids0 = (F.row || []).map(r => r.photo).filter(id => !FXS.isHouse(D, id)), ids = ids0.filter(id => !/bath|powder|shower|toilet/.test(id)).length >= 2 ? ids0.filter(id => !/bath|powder|shower|toilet/.test(id)) : ids0;
    const top = ids.slice().sort((a, b) => FXS.archScore(D, b) - FXS.archScore(D, a)).slice(0, 2); return ids.filter(i => top.includes(i)); };
  const sd = c => `data-s='${esc(JSON.stringify([].concat(c || []))).replace(/'/g,'&#39;')}'`;
  FXS.sd = sd;
  // a gold caption label from a lead: "Family room, 20' x 16'." -> FAMILY ROOM, then the size small
  FXS.leadLabel = lead => { const t = String(lead || '').replace(/\.$/, ''), i = t.indexOf(','); return i < 0 ? {name: t, size: ''} : {name: t.slice(0, i), size: t.slice(i + 1).trim()}; };
  // a captioned photo: photo, gold label (name, size small), a paragraph of whole sentences (fill pass picks them)
  FXS.captioned = (D, c, x, y, w, ph, lines, slot, o) => { o = o || {}; const L0 = FXS.leadLabel(c.lead), L = (()=>{ let n = L0.name; const wl = t => FXS.width(t.toUpperCase(), 'font-family:Montserrat;font-weight:600;font-size:9pt;letter-spacing:2pt'); if(wl(n) > w) n = n.split(/ and |, /)[0]; return {name: n, size: L0.size}; })(), lh = o.lh || 13.5, fs = o.fs || 10, showSize = L.size && FXS.width(L.name.toUpperCase(), 'font-family:Montserrat;font-weight:600;font-size:9pt;letter-spacing:2pt') + FXS.width(L.size, 'font-family:Montserrat;font-weight:500;font-size:9pt') + 12 <= w;
    return (o.photoRect ? FXS.box(D, c.photo, o.photoRect[0], o.photoRect[1], o.photoRect[2], o.photoRect[3], slot) : FXS.box(D, c.photo, x, y, w, ph, slot)) +
      `<div class="abs" style="left:${x}pt;top:${y + ph + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(L.name.toUpperCase())}</div>${showSize ? `<span style="font:500 9pt/12pt var(--fx-font);color:var(--fx-mute);margin-left:8pt;white-space:nowrap">${esc(L.size)}</span>` : ''}</div>` +
      `<div class="abs cap"><div class="a" style="position:absolute;left:${x}pt;top:${y + ph + 25}pt;width:${w}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-lh="${lh}" data-lines="${lines}" ${o.try ? `data-try="${o.try}"` : ''} data-narrow="${o.narrow == null ? 10 : o.narrow}" ${sd(c.s)}></div></div>`; };

  // ---------- the cover (also the flyer front) ----------
  FXS.cover = (D, o) => { o = o || {};
    const L = D.listing, A = D.agent || {}, F = ((D.companion || {}).flyer || {}).front || {}, K = (D.sw || {}).front || {};
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    const X0 = 90, X1 = 588, CW = X1 - X0, Y0 = o.y0 == null ? 27 : o.y0;
    const rooms = FXS.coverRooms(D).slice(0, 2), heroId = F.hero || K.hero || 'front';
    const heroH = o.heroH || 330, rowY = Y0 + heroH + 9, rowH = o.rowH || 146, gap = 9, rw = (CW - gap)/2;
    let h = '';
    h += FXS.vAddress(L.address, 45, Y0 + 205, 430, 36, 26);
    h += `<div class="vrule" style="left:44.5pt;top:${Y0 + 432}pt;height:50pt"></div>`;
    h += FXS.vt(45, Y0 + 595, 250, 20, 'vplace', '', esc((FXS.placeLine(L)).toUpperCase().replace(/^HOUSTON, TX/, 'HOUSTON, TX')), 'data-slot="place" data-lines="1"');
    h += SW.heroHtml(D, heroId, X0, Y0, CW, heroH, 'front.house', []);
    rooms.forEach((id, i) => { h += FXS.box(D, id, X0 + i*(rw + gap), rowY, rw, rowH, 'front.room' + i); });
    h += FXS.seal(D, X0 + CW/2, rowY + rowH/2, 84, 'front.seal', {noSub: true});
    const wuTop = rowY + rowH + 10, lh = 17.5, maxL = o.lines || 7, tries = []; for(let t = maxL; t >= 3; t--) tries.push(t);
    h += `<div class="abs wu" data-slot="front.summary" data-lines="${maxL}" data-try="${tries.join(',')}" data-lh="${lh}" ${sd(o.intro || F.intro || (K.summary) || [])} style="left:${X0}pt;top:${wuTop}pt;width:${CW}pt;height:${maxL*lh}pt;font-size:13.25pt;line-height:${lh}pt"></div>`;
    const sy = wuTop + maxL*lh + 8;
    h += FXS.statsRow(FXS.statItems(L), X0, sy, CW, 32, 'fact', {np: 19, lp: 8.5});
    const ay = sy + 32 + 12;
    h += FXS.agent(A, X0, ay, 300, hsSrc);
    h += `<div class="vr" style="left:421.5pt;top:${ay + 2}pt;height:${Math.min(72, 765 - ay - 2)}pt"></div>`;
    h += FXS.logo(D, 436, ay + 14, 152, 40);
    return h;
  };



  // ---------- the redesigned cover (also the flyer front), owner 11/7: whole house full width with a strip of four rooms under it, the seal on the seam, the horizontal address, a 3-4 line hook, five facts; no agent, no logo ----------
  FXS.cover2 = (D, o) => { o = o || {};
    const L = D.listing, K = (D.sw || {}).front || {}, X0 = 90, CW = 498, gap = 9, has = id => !!(D.photos || {})[id], heroId = K.hero || 'front';
    const pick = (...c) => [].concat(...c).find(has);
    const V2 = (D.sw || {}).v2 || {};
    let rooms = (V2.cover || []).filter(has);   // the house's own photo plan (sw.v2.cover): each space once across the fold-over
    if(rooms.length < 3) rooms = rooms.concat([pick(['family', 'living', 'family2', 'openplan']), pick(['dining', 'dining2']), pick(['game', 'game2', 'game3'])].filter(id => id && !rooms.includes(id)));
    Object.keys(D.photos || {}).forEach(id => { if(rooms.length < 3 && id !== heroId && !rooms.includes(id) && !FXS.isHouse(D, id) && !/^pv\d|^plan|^hall|toilet|powder|^bath/.test(id)) rooms.push(id); });
    rooms = rooms.slice(0, 3);
    const heroH = 410, hx = X0, hw = 621 - X0, sy = heroH, sh = 96, pw = (CW - (rooms.length - 1)*gap)/rooms.length;
    let h = FXS.gutter(D, 28);
    h += SW.heroHtml(D, heroId, hx, -9, hw, heroH, 'front.house', []);
    rooms.forEach((id, i) => { h += FXS.box(D, id, X0 + i*(pw + gap), sy, pw, sh, 'front.room' + i); });
    h += FXS.seal(D, X0 + CW/2, sy - 4.5, 72, 'front.seal');
    const ay = sy + sh + 24, as = FXS.fitSize(L.address, "font-family:'Bodoni Moda';font-weight:500;letter-spacing:1pt", CW, 32, 22);
    h += `<div class="abs" style="left:${X0}pt;top:${ay}pt;width:${CW}pt;height:${as*1.2}pt;font:500 ${as}pt/${as*1.2}pt var(--fx-display);letter-spacing:1pt;color:var(--fx-ink);white-space:nowrap;overflow:hidden" data-slot="front.address" data-lines="1">${esc(L.address)}</div>`;
    h += `<div class="abs" style="left:${X0}pt;top:${ay + as*1.2 + 6}pt">${FXS.label([FXS.hood(L), FXS.placeLine(L)].filter(Boolean).join(' \u00b7 '), 'front.place')}</div>`;
    // the write-up (owner FXS-13 r3, 11/7): it fills the cover from the place line down to the facts row, which sits at the bottom margin.
    // Whole sentences in the writer's order (the roof sentence last), at the largest type step (never under 12.5 pt) that sets them to fill
    // every line with the last line at least 3/4 full; the line spacing takes up what is left. If no set fills, it goes back to the writer (cover-writeup-short).
    const hy = ay + as*1.2 + 30, FY = 765 - 36, region = FY - 14 - hy, S0 = [].concat(o.intro || K.summary || []).map(x => [].concat(x)), isRoof = a => a.some(tx => /roof/i.test(tx) && /20\d\d/.test(tx));
    const roofA = S0.find(isRoof), body = S0.filter(a => !isRoof(a) && !a.some(tx => /garage/i.test(tx))), seq = roofA ? body.concat([roofA]) : body;
    const cv = document.createElement('canvas').getContext('2d'), wcache = {};
    const wd = (t, fs) => { const k = fs + '|' + t; if(wcache[k] == null){ cv.font = `italic 400 ${fs*4/3}px 'Cormorant Garamond'`; wcache[k] = cv.measureText(t).width*.75; } return wcache[k]; };
    const wrapN = (txt, fs) => { let n = 1, line = ''; txt.split(' ').forEach(w => { const nx = line ? line + ' ' + w : w; if(wd(nx, fs) > CW - 2 && line){ n++; line = w; } else line = nx; }); return {n, fill: wd(line, fs)/CW}; };
    let hook = null;
    for(const fs of [15, 14.5, 14, 13.5, 13, 12.5]) for(let n = Math.floor(region/(fs*1.38)); n >= Math.max(3, Math.ceil(region/(fs*1.62))); n--){
      if(hook) break;
      let best = null;
      const go = (i, parts) => {   // each sentence: left out, or one of its wordings; at least the first and (when there is one) the roof sentence stay
        if(i === seq.length){ if(!parts.length) return; const txt = parts.join(' '), m = wrapN(txt, fs); if(m.n === n && m.fill >= .78 && (!best || parts.length > best.k || (parts.length === best.k && m.fill > best.fill))) best = {txt, k: parts.length, fill: m.fill}; return; }
        seq[i].forEach(alt => { if(!parts.some(q => FXS.sameFact(q, alt))) go(i + 1, parts.concat([alt])); });
        if(i !== 0 && !(roofA && i === seq.length - 1)) go(i + 1, parts);
      };
      go(0, []);
      if(best) hook = {txt: best.txt, fs, n, lh: Math.min(fs*1.62, region/n)};
    }
    if(!hook){ const fs = 12.5, n = Math.floor(region/(fs*1.38)), txt = seq.map(a => a[0]).join(' '); hook = {txt, fs, n: Math.min(n, wrapN(txt, fs).n), lh: fs*1.42}; (window.__coverIssues = window.__coverIssues || []).push({slot: 'front.summary', kind: 'cover-writeup-short', detail: 'the write-up does not fill the cover at 12.5 pt or more; back to the writer for more copy'}); }
    window.__coverText = hook.txt;
    h += `<div class="abs wu" data-slot="front.summary" data-lines="${hook.n}" style="left:${X0}pt;top:${hy}pt;width:${CW}pt;height:${hook.n*hook.lh}pt;font-size:${hook.fs}pt;line-height:${hook.lh}pt">${esc(hook.txt)}</div>`;
    const items = FXS.statItems(L).slice(0, 4); if(L.lotSize) items.push(L.lotSize); else if(L.stories) items.push(`${L.stories} ${Number(L.stories) === 1 ? 'Story' : 'Stories'}`);
    h += FXS.statsRow(items, X0, FY, CW, 36, 'fact', {np: 17.5, lp: 7, track: .7});
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
    const html = `<div class="card" data-plancard="1" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${bottom - y}pt;background:var(--fx-seal)"></div><div class="abs planwrap" style="left:0;top:0;width:612pt;height:792pt;--paper:var(--fx-seal)">${r.html}<div class="plan-legend" style="left:${x + 14}pt;top:${ly}pt">${leg.join('')}</div><div class="plan-disclosure" style="left:${x + 14}pt;width:${w - 28}pt;top:${ly + 14}pt;text-align:left" data-slot="back.plannote" data-lines="1" data-fine="1">${esc(note)}</div></div>`;
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
    const inside = [], outside = [], upd = [], add = (a, t) => { if(t && !a.includes(t)){ a.push(t); if(a === inside && /^(Roof replaced|New roof|Low-E|Insulated exterior|Programmable|Three-phase|New wiring|New plumbing|Fiber cement|New driveway|New floors|New kitchen|New carpet)/.test(t)) upd.push(t); } };
    let m = grab(/roof[^.]{0,60}?(?:replaced|new|redone)[^.]{0,40}?(20\d\d)/i) || grab(/(?:replaced|new)[^.]{0,30}roof[^.]{0,40}?(20\d\d)/i) || grab(/roof[^.]{0,40}(20\d\d)/i);
    if(m) add(inside, `Roof replaced in ${m[1]}`); else if(has(/new roof/i)) add(inside, 'New roof');
    if(has(/low-?e/i)) add(inside, 'Low-E windows');
    if(has(/insulated exterior doors?/i)) add(inside, 'Insulated exterior doors');
    if(has(/programmable thermostat/i)) add(inside, 'Programmable thermostat');
    if(has(/gated front entry/i)) add(outside, 'Gated front entry'); else if(has(/gate opens to the front door|gated entry/i)) add(outside, 'Gate at the front door'); else if(has(/gated (community|building)|gated memorial|is a gated/i)) add(outside, 'Gated community');
    if(has(/\b(two|2)-car garage|garage for two|two cars/i)) add(outside, '2-car garage'); else if(has(/garage/i)) add(outside, 'Attached garage');
    if(has(/three-phase/i)) add(inside, 'Three-phase power');
    if(has(/new wiring/i)) add(inside, has(/breaker box/i) ? 'New wiring and breaker box' : 'New wiring');
    if(has(/new plumbing/i)) add(inside, 'New plumbing');
    if(has(/fiber cement|hardie|hardi/i)) add(inside, 'Fiber cement siding');
    if(has(/floors, trim and paint (are )?(all )?new|new flooring, trim/i)) add(inside, 'New floors, trim and paint');
    if(has(/kitchen and both baths are new|every bath in the house is new/i)) add(inside, 'New kitchen and baths');
    if(has(/new carpet/i) && has(/bedroom/i)) add(inside, 'New carpet in the bedrooms');
    if(has(/new driveway/i)) add(inside, 'New driveway');
    if(has(/tray ceiling/i)) add(inside, 'Tray ceilings');
    else if(has(/high ceilings/i)) add(inside, 'High ceilings');
    if(has(/vaulted ceiling/i)) add(inside, 'Vaulted ceiling');
    if(has(/crown molding/i)) add(inside, 'Crown molding');
    if(has(/wood floors|hardwood|wood-look/i) && !(((D.sw || {}).back || {}).extra || {}).inside?.some(t => /hardwood floors/i.test(t))) add(inside, 'Wood floors');
    if(has(/walk-in closet/i)) add(inside, 'Walk-in closet');
    if(has(/soaking tub/i)) add(inside, 'Soaking tub in the primary bath');
    if(has(/soaring ceilings?/i)) add(inside, 'Soaring ceilings');
    if(has(/french doors/i)) add(inside, 'French doors');
    if(has(/laundry room is (inside|on this floor)/i)) add(inside, 'Laundry room inside the house');
    if(has(/gray carpet runs through every bedroom/i)) add(inside, 'Gray carpet in every bedroom');
    if(has(/skylight/i)) add(inside, 'Skylight in the bath');
    if(has(/pet-friendly/i)) add(inside, 'Pet-friendly community');
    if(has(/hardwood|wood floors/i) && has(/stairs|staircase|stair rail/i)) add(inside, 'Open staircase');
    if(has(/\bdeck\b/i) && has(/pergola/i)){ if(!D.plan) add(outside, 'Wood deck with a pergola'); } else if(has(/\bdeck\b/i)) add(outside, 'Wood deck'); else if(has(/pergola/i)) add(outside, 'Pergola');
    if(has(/fully fenced|fenced yard|fenced backyard|fencing/i)) add(outside, 'Fenced yard');
    if(has(/rooftop patio/i)) add(outside, 'Rooftop patio');
    if(has(/gravel[^.]{0,30}side|side path/i)) add(outside, 'Gravel side path');
    if(has(/double-wide driveway/i)) add(outside, 'Double-wide driveway');
    if(has(/stacked-stone wall/i)) add(outside, 'Stone wall at the entry');
    if(has(/covered patio/i)) add(outside, 'Covered patio'); else if(has(/\bpatio\b/i) && !has(/rooftop patio|roof patio/i)) add(outside, 'Patio');
    if(has(/balcon/i)) add(outside, 'Covered balcony');
    if(has(/balcony (opens )?off the primary|primary suite has a balcony/i)) add(outside, 'Balcony off the primary suite');
    if(has(/stone arch/i)) add(outside, 'Stone arch over the front door');
    if(has(/lanterns/i)) add(outside, 'Lanterns at the door');
    if(has(/brick path/i)) add(outside, 'Brick path through the park');
    if(has(/turf/i)) add(outside, 'Turf backyard');
    if(has(/mature trees/i)) add(outside, 'Mature trees');
    if(has(/community park|gazebo/i)) add(outside, 'Community park with a gazebo');
    const yr = L.yearBuilt || L.year, lot = L.lotSize ? String(L.lotSize).replace(/\s*Sq Ft Lot/i, ' sq ft lot') : '';
    [L.stories ? (L.stories == 1 ? 'One story, no stairs' : `${L.stories} stories`) : '', L.beds ? `${L.beds} bedrooms` : '', L.sqft ? `${Number(L.sqft).toLocaleString('en-US')} square feet` : ''].forEach(t => { if(inside.length < 7) add(inside, t); });
    [lot, L.stories ? (L.stories == 1 ? 'One story, no stairs' : `${L.stories} stories`) : ''].forEach(t => { if(outside.length < 4) add(outside, t); });
    const X = ((D.sw || {}).back || {}).extra || {};
    (X.inside || []).forEach(t => add(inside, t)); (X.outside || []).forEach(t => add(outside, t));
    return {inside, outside, upd};
  };

  // ---------- the back (also the flyer back): four photos or the plan, About, two cards, the agent ----------
  FXS.back = (D, o) => { o = o || {};
    const L = D.listing, A = D.agent || {}, b = D.brand || {}, hasPlan = !!D.plan, X0 = 90, X1 = 588, CW = X1 - X0, gap = 9, rw = (CW - gap)/2;
    const F = (D.companion || {}).flyer || {}, FB = F.back || {}, KB = (D.sw || {}).back || {}, Kleft = (D.sw || {}).left || {};
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    const used = [(((D.sw||{}).front||{}).hero) || 'front'].concat(FXS.coverRooms(D), o.avoid || []);
    const first = (hasPlan ? FB.photos : (FB.photosNoplan || FB.photos)) || [];
    const all = FXS.cards(D, first), PB = (((D.sw || {}).plan || {}).back || []).map(id => FXS.cardFor(D, id)).filter(Boolean);
    const Y0 = 27, bottomOfCards = o.cardsBottom || 664, issues = [];
    let h = '', y = Y0, shown = [];
    const bodyBottomLimit = bottomOfCards;
    // ---- the cards' content
    const box = FB.box || Kleft.box || {};
    const SF = FXS.sellingFacts(D), near = (FB.nearby || KB.nearby || []).slice(0, 4).map(FXS.nearText);
    const useUpd = SF.upd.length >= 6, boxT = useUpd ? 'Updates' : 'Features', covTxt = JSON.stringify(o.coverText || ''), c1 = (useUpd ? SF.upd : SF.inside).filter(t => !(/garage/i.test(t) && /garage/i.test(covTxt))).slice(0, 7);
    const cnt = hasPlan ? FXS.pick(D, all, 4, {avoid: used, exactAvoid: !!o.outdoor, outdoor: !!o.outdoor, house: !!o.outdoor}).filter(c => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, rw, 100)).length : 4;
    const wide3 = hasPlan && (((D.sw || {}).plan || {}).back || []).length === 1 && (D.plan.levels || []).length >= 3;   // a three-floor plan with one photo: plan card, then the photo full width under it
    const rowsN = wide3 ? 5 : Math.max(6, Math.min(7, c1.length, SF.outside.length + near.length));
    const c2 = SF.outside.slice(0, rowsN - near.length).concat(near);
    const rf = arr => { const pl = c1.concat(SF.outside), pc = []; arr.forEach((c, i) => { let n = FXS.refill(D, c, pl, 5); if(n.length < 4) n = FXS.refill(D, c, pc, 5); arr[i] = Object.assign({}, c, {s: n}); const fl = [].concat(...n.map(x => [].concat(x))); pl.push(...fl); pc.push(...fl); }); };
    const rowH = 20, cardH = 36 + rowsN*rowH + 10;
    // ---- top: the plan, or the photo grid
    const photoN = o.photos || (hasPlan ? 2 : 4);
    let cardsTop = bodyBottomLimit - cardH;
    const aboutS = ((((D.sw || {}).plan || {}).about) || [].concat(...(FB.floors || []).map(f => f.s))).slice();
    if(hasPlan && PB.length === 1 && wide3){
      // plan wider than ~75% of the page: no side column. The plan card runs the full width and the photo runs under it (caption and seal on it)
      const pc = FXS.planCard(D, X0, y, CW, Math.max(130, Math.min(250, cardsTop - 250 + 44))); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues;
      const y1 = pc.bottom + 14, nl = 3, ph1 = Math.floor(cardsTop - 14 - y1 - 25 - nl*13.5), pw1 = Math.min(CW, Math.floor(ph1*3.05)), c0 = Object.assign({}, PB[0]);
      shown = [c0]; rf(shown);
      const px1 = X0 + Math.floor((CW - pw1)/2);
      h += FXS.captioned(D, shown[0], px1, y1, pw1, ph1, nl, 'back.photo0', {narrow: 12, try: '3,2'});   // the caption runs exactly the photo's width, from its left edge
      h += FXS.yearSeal(px1 + pw1 - 36, y1 + 36, 62, L.yearBuilt || L.year || '', 'back.seal');
      y = y1 + ph1 + 25 + nl*13.5;
    } else if(hasPlan && PB.length === 1){
      // one photo with a two-floor plan: the plan card is cut to the width the plan needs (66%) and the photo takes the rest of the row
      const planW = Math.round(CW*0.66), pc = FXS.planCard(D, X0, y, planW, Math.max(130, Math.min(268, (o.planMax || (cardsTop - 250)) + 20))); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues;
      const cardH0 = pc.bottom - y, px = X0 + planW + gap, pw = CW - planW - gap, c0 = Object.assign({}, PB[0]);
      shown = [c0]; const nl = 3; rf(shown);
      h += FXS.captioned(D, shown[0], X0, y, CW, cardH0, nl, 'back.photo0', {narrow: 12, photoRect: [px, y, pw, cardH0]});
      h += FXS.yearSeal(px + pw - 36, y + 36, 62, L.yearBuilt || L.year || '', 'back.seal');
      y = pc.bottom + 25 + nl*13.5;
    } else if(hasPlan){
      const pc = FXS.planCard(D, X0, y, CW, Math.max(130, o.planMax || (cardsTop - 250))); h += pc.html; issues.push(...pc.issues); y = pc.bottom + 14;
      window.planIssues = pc.issues;
      const avail = cardsTop - 14 - y, lines = 3, ph = Math.max(70, Math.min(190, avail - 25 - lines*13.5));
      const pick = PB.length >= 1 ? PB.slice(0, 2).map(c => Object.assign({}, c)) : FXS.pick(D, all, 4, {avoid: used, exactAvoid: !!o.outdoor, outdoor: !!o.outdoor, house: !!o.outdoor}).filter(c => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, rw, ph)).slice(0, 2);
      rf(pick); shown = pick.slice(); pick.forEach((c, i) => { h += FXS.captioned(D, c, X0 + i*(rw + gap), y, pick.length === 1 ? Math.min(CW, ph*2.95) : rw, ph, lines, 'back.photo' + i, {narrow: 12}); });
      if(pick.length >= 2) h += FXS.yearSeal(X0 + CW/2, y + 31, 62, L.yearBuilt || L.year || '', 'back.seal');
      else h += FXS.yearSeal(X0 + Math.min(CW, ph*2.95) - 40, y + 40, 66, L.yearBuilt || L.year || '', 'back.seal');
      y += ph + 25 + lines*13.5;
    } else {
      const pick4 = PB.length >= 1 ? PB.slice(0, 2).map(c => Object.assign({}, c)) : FXS.pick(D, all, 6, {avoid: used, exactAvoid: !!o.outdoor, outdoor: !!o.outdoor, house: !!o.outdoor}).filter(c => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, rw, 112));
      const n = pick4.length >= 4 ? 4 : 2, ph = n === 4 ? Math.max(70, Math.min(108, Math.floor((cardsTop - 12 - 88 - 186)/2))) : Math.min(214 + 20, cardsTop - 12 - 88 - 27 - 14 - 25 - 40.5), lines = 3;
      const use = pick4.filter(c => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, rw, ph)).slice(0, n);
      while(!PB.length && use.length < n){ const more = FXS.pick(D, all, 10, {avoid: used.concat(use.map(c => c.photo)), exactAvoid: !!o.outdoor, outdoor: !!o.outdoor, house: !!o.outdoor}).filter(c => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, rw, ph)).filter(c => !use.includes(c) && !use.some(u => SW.famOf(u.photo) === SW.famOf(c.photo))); if(!more.length) break; use.push(more[0]); }
      rf(use); shown = use.slice(); use.forEach((c, i) => { const r = Math.floor(i/2), cx = X0 + (i%2)*(rw + gap), cy = y + r*(ph + 25 + lines*13.5 + 14);
        h += FXS.captioned(D, c, cx, cy, use.length === 1 ? CW : rw, ph, lines, 'back.photo' + i); });
      h += use.length === 1 ? FXS.yearSeal(X0 + CW - 40, y + 40, 66, L.yearBuilt || L.year || '', 'back.seal') : FXS.yearSeal(X0 + CW/2, y + 31, 62, L.yearBuilt || L.year || '', 'back.seal');
      y += Math.ceil(use.length/2)*(ph + 25 + lines*13.5) + (Math.ceil(use.length/2) - 1)*14 + 14;
    }
    // ---- About the house (whole sentences, italic serif), then the two cards
    const nk = x => String(x).toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 40), shownSet = new Set([].concat(...shown.map(c => [].concat(...(c.s || []).map(x => [].concat(x))))).map(nk));
    const capAlts = [].concat(...shown.map(c => [].concat(...(c.s || []).map(x => [].concat(x)))));
    // the box bullets are chosen first: facts no caption says, and (where About shows) facts About does not say; then About drops what the bullets say
    const aboutAll = hasPlan ? [] : [].concat(...aboutS.map(x => [].concat(x))), noGar = t => !(/garage/i.test(t) && /garage/i.test(covTxt));
    const inAbout = t => aboutAll.some(a => FXS.sameFact(t, a)), novelCap = t => !capAlts.some(a => FXS.sameFact(t, a));
    const rank = list => list.filter(noGar).filter(novelCap).map((t, i) => [inAbout(t) ? 1 : 0, i, t]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
    const c1n = rank(useUpd ? SF.upd : SF.inside).slice(0, rowsN);
    const c2n = rank(SF.outside).slice(0, rowsN - near.length).concat(near);
    const chosen = c1n.concat(c2n);
    const aboutKept0 = aboutS.filter(x => ![].concat(x).some(a => shownSet.has(nk(a))) && !(/garage/i.test([].concat(x)[0]) && /garage/i.test(covTxt))), aboutKept1 = aboutKept0.filter(x => ![].concat(x).some(a => capAlts.concat(chosen).some(c => FXS.sameFact(a, c)))), aboutKept = aboutKept1.length >= 4 ? aboutKept1 : aboutKept0;
    if(!hasPlan || (PB.length === 1 && !wide3)){
      const lh = 21, availA = cardsTop - 12 - y - 30, maxL = Math.max(3, Math.min(6, Math.floor(availA/lh))), tr = []; for(let t = maxL; t >= 3; t--) tr.push(t);
      h += `<div class="abs" style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:${cardsTop - 12 - y}pt;display:flex;flex-direction:column;justify-content:center"><div style="flex:none;height:12pt;margin-bottom:8pt">${FXS.label('About the house', 'back.about.label')}</div><div class="wu" data-narrow="0" data-fill="0.9" data-lfill="0.8" data-justify="1" data-h0="${cardsTop - 12 - y - 20 - 4}" data-slot="back.about" data-lines="${maxL}" data-try="${tr.join(',')}" data-lh="${lh}" ${sd(aboutKept.length >= 3 ? aboutKept : aboutS)} style="flex:none;width:${CW}pt;height:${maxL*lh}pt;font-size:14.5pt;line-height:${lh}pt"></div></div>`;
    } else cardsTop = Math.max(y + 8, cardsTop);
    const cw2 = rw, bx = [X0, X0 + rw + gap];
    const padTo = (a, b) => a.concat(b.filter(t => !a.includes(t))).slice(0, rowsN), c2all = SF.outside.slice(0, rowsN - near.length).concat(near);
    [[boxT, padTo(c1n, c1), 'back.updates'], ['Outside and nearby', padTo(c2n.slice(0, c2n.length - near.length).concat(SF.outside.filter(t => !c2n.includes(t))).slice(0, rowsN - near.length).concat(near), c2all), 'back.outside']].forEach(([title, list, slot], i) => {
      h += `<div class="card" style="left:${bx[i]}pt;top:${cardsTop}pt;width:${cw2}pt;height:${cardH}pt"></div>`;
      h += `<div class="abs" style="left:${bx[i] + 16}pt;top:${cardsTop + 12}pt">${FXS.label(title, slot + '.title')}</div>`;
      h += FXS.bullets(list, bx[i] + 18, cardsTop + 34, cw2 - 30, rowH, slot, rowsN, 10.5).html;
    });
    // ---- the vertical address, the gold rule and the place
    h += FXS.vAddress(L.address, 45, Y0 + 205, 430, 30, 24);
    h += `<div class="vrule" style="left:44.5pt;top:${Y0 + 432}pt;height:44pt"></div>`;
    h += FXS.vt(45, Y0 + 585, 240, 20, 'vplace', '', esc(`${FXS.hood(L) ? FXS.hood(L) + ' · ' : ''}${L.city}`.toUpperCase()), 'data-slot="place" data-lines="1"');
    // ---- the standard agent card, then the fine print
    h += `<div class="hr" style="left:${X0}pt;top:${bottomOfCards + 10}pt;width:${CW}pt"></div>`;
    h += ContactCard.html([X0, bottomOfCards + 18, CW, 74], Object.assign({}, A, {headshot: hsSrc}), Object.assign({}, b, {logo: b.logo}), {layout: 'panel', size: 'mid', fine: '', bottomGap: 0.5, fieldAccent: true});
    h += `<div class="abs fine" style="left:${X0}pt;top:${bottomOfCards + 96}pt;width:${CW}pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">Information deemed reliable but not guaranteed.</div>`;
    return {html: h, issues};
  };


  // the left gutter on every inside and back page: the vertical address, the gold rule, the vertical place line
  FXS.gutter = (D, size) => { const L = D.listing, Y0 = 27;
    return FXS.vAddress(((SW.data().listing || {}).address) || L.address, 45, Y0 + 205, 430, size || 30, 24) + `<div class="vrule" style="left:44.5pt;top:${Y0 + 432}pt;height:44pt"></div>` +
      FXS.vt(45, Y0 + 585, 240, 20, 'vplace', '', esc(`${FXS.hood(L) ? FXS.hood(L) + ' · ' : ''}${L.city}`.toUpperCase()), 'data-slot="place" data-lines="1"'); };
  // the strip down the right edge of the inside right page (owner FXS-13 r3): it mirrors the left gutter (big serif line, gold rule, spaced caps line),
  // turned to read top to bottom, with the house's size and rooms instead of the address and place (no repeat of the left gutter)
  FXS.vStrip = (D, cx) => { const L = D.listing, Y0 = 27; cx = cx == null ? 567 : cx;
    const big = L.sqft ? `${Number(L.sqft).toLocaleString('en-US')} Square Feet` : (L.yearBuilt ? `Built in ${L.yearBuilt}` : '');
    const parts = []; if(L.beds) parts.push(`${L.beds} ${L.beds == 1 ? 'Bedroom' : 'Bedrooms'}`);
    if(L.baths) parts.push(L.halfBaths ? `${L.baths}.5 Baths` : `${L.baths} ${L.baths == 1 ? 'Bath' : 'Baths'}`);
    const css = "font-family:'Bodoni Moda';font-weight:500;letter-spacing:1.5pt", s = FXS.fitSize(big, css, 430, 28, 20);
    return FXS.vt(cx, Y0 + 205, 430, s*1.5, 'vaddr vr90', `font-size:${s}pt`, esc(big), 'data-slot="strip.big" data-lines="1"') +
      `<div class="vrule" style="left:${cx - .5}pt;top:${Y0 + 432}pt;height:44pt"></div>` +
      FXS.vt(cx, Y0 + 585, 240, 20, 'vplace vr90', '', esc(parts.join(' · ').toUpperCase()), 'data-slot="strip.small" data-lines="1"'); };

  // the cover write-up must set exactly the lines it was given (no blank line above the facts row)
  FXS.writeupCheck = () => { const out = []; document.querySelectorAll('[data-slot="front.summary"]').forEach(el => { const L = SW.lines(el), want = +el.dataset.lines; if(L.n !== want) out.push({slot: 'front.summary', kind: L.n > want ? 'overflow' : 'cover-writeup-short', detail: `${L.n} lines set, ${want} wanted`}); else if(L.fill < .75) out.push({slot: 'front.summary', kind: 'last-line-short', pct: Math.round(L.fill*100)}); }); return out; };
  // the two-sided flyer back (owner FXS-13 r3, 11/7): many more photos. The plan (or a big photo) with two photos stacked beside it, a strip of three,
  // About the house, the two cards, the agent card. No photo from the front, no photo twice, the whole house on any exterior, no blank space, no QR, no price.
  FXS.flyerBack = (D) => {
    const L = D.listing, A = D.agent || {}, b = D.brand || {}, hasPlan = !!D.plan, X0 = 90, CW = 498, gap = 9, Y0 = 27, issues = [];
    const V2 = (D.sw || {}).v2 || {}, F = (D.companion || {}).flyer || {}, FB = F.back || {}, KB = (D.sw || {}).back || {};
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    const front = [((D.sw || {}).front || {}).hero || 'front'].concat(V2.cover || []);
    const pool = (V2.flyerBack || []).filter(id => (D.photos || {})[id] && !front.includes(id));
    const levels = hasPlan ? ((D.plan || {}).levels || []).length : 0;
    let wide = false, PH = levels >= 3 ? 300 : 236;
    if(hasPlan){ const t = FXS.planCard(D, X0, Y0, Math.round(CW*.6), PH); if(t.bottom - Y0 < 190 || (t.issues || []).some(i => /wont-fit|under-300/.test(i.kind))) wide = true; }   // a wide, short plan (one floor), or one that cannot set in the column, takes the full width   // a wide, short plan (one floor) takes the full width
    const bottomOfCards = 664, rowsN = 6, rowH = 20, cardH = 36 + rowsN*rowH + 10, cardsTop = bottomOfCards - cardH, topEnd = cardsTop - 14;
    const chip = (id, x, y, hh, slot) => `<div class="abs" style="left:${x + 6}pt;top:${y + hh - 20}pt;background:var(--fx-paper);padding:2pt 6pt 1pt;white-space:nowrap">${FXS.label(FXS.labelFor(id).replace(/\.$/, ''), slot, 'text-decoration:none')}</div>`;
    let h = FXS.gutter(D, 30), y = Y0, k = 0;
    const ph = (x, yy, w, hh) => { const id = pool.shift(); if(!id){ issues.push({slot: 'fb.photo' + k, kind: 'empty-photo-slot', detail: 'sw.v2.flyerBack has too few photos'}); return ''; }
      if(FXS.isHouse(D, id) && !SW.fits(D, id, w, hh)) issues.push({slot: 'fb.photo' + k, kind: 'house-cropped', detail: id + ': the whole house does not fit this frame'});
      const sl = 'fb.photo' + (k++); return FXS.box(D, id, x, yy, w, hh, sl) + chip(id, x, yy, hh, sl + '.label'); };
    let showAbout = true;
    if(!wide){
      const bigW = Math.round(CW*.6), sx = X0 + bigW + gap, sw = CW - bigW - gap;
      let Ht = 236;
      if(hasPlan){ const pc = FXS.planCard(D, X0, y, bigW, PH); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; Ht = pc.bottom - y; }
      else h += ph(X0, y, bigW, Ht);
      const sH = (Ht - gap)/2; h += ph(sx, y, sw, sH) + ph(sx, y + sH + gap, sw, sH);
      h += FXS.yearSeal(X0 + CW - 34, y + sH + gap/2, 58, L.yearBuilt || L.year || '', 'fb.seal');
      y += Ht + 12;
    } else {
      const pc = FXS.planCard(D, X0, y, CW, levels >= 3 ? 172 : 200); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; y = pc.bottom + 12;
      // owner FXS-13 r3: many more photos. A row of two, then as many strips of three as fit at 95 pt or taller
      const rest0 = topEnd - y, ns = rest0 - 110 - 12 >= 2*95 + 12 ? 2 : 1, rest = rest0 - 12*ns, h2 = ns === 2 ? Math.max(110, Math.round(rest*.36)) : Math.round(rest*.54), h3 = (rest - h2)/ns, w2 = (CW - gap)/2;
      h += ph(X0, y, w2, h2) + ph(X0 + w2 + gap, y, w2, h2);
      h += FXS.yearSeal(X0 + w2 + gap/2, y + h2/2, 58, L.yearBuilt || L.year || '', 'fb.seal');
      y += h2 + 12; showAbout = false;
      const w3 = (CW - 2*gap)/3; for(let r = 0; r < ns; r++){ for(let i = 0; i < 3; i++) h += ph(X0 + i*(w3 + gap), y, w3, h3); y += h3 + 12; }
    }
    // About the house: whole sentences that the cards do not already say
    const SF = FXS.sellingFacts(D), near = (FB.nearby || KB.nearby || []).slice(0, 4).map(FXS.nearText);
    const useUpd = SF.upd.length >= 6, l1 = (useUpd ? SF.upd : SF.inside).slice(0, rowsN), l2 = SF.outside.slice(0, rowsN - near.length).concat(near);
    if(showAbout){
      const fl = [].concat(...(FB.floors || []).map(f => f.s || [])), ab = ((((D.sw || {}).plan || {}).about) || fl).map(x => [].concat(x)).filter(a => !a.some(t => l1.concat(l2).some(c => FXS.sameFact(t, c))));
      const chars = (ab.length >= 3 ? ab : fl.map(x => [].concat(x))).reduce((a, x) => a + x[0].length + 1, 0);   // about 92 characters a line at 13 pt: never more lines than the sentences can fill
      const alh = 18.5, labH = 20, rest = topEnd - y, n = Math.max(2, Math.min(5, Math.floor((rest - 12 - labH - 100)/alh), Math.floor(chars/92))), w3 = (CW - 2*gap)/3;
      // owner FXS-13 r3: many more photos. Two strips of three when both fit at 95 pt or taller (About is left to the cards), else one strip and About when it fits
      const ns = rest >= 2*90 + 12 && pool.length >= 6 ? 2 : 1; if(ns === 2 || rest - 12 - labH - n*alh < 100) showAbout = false;
      const h3 = showAbout ? rest - 12 - labH - n*alh : (rest - 12*(ns - 1))/ns;
      for(let r = 0; r < ns; r++){ for(let i = 0; i < 3; i++) h += ph(X0 + i*(w3 + gap), y, w3, h3); y += h3 + 12; }
      if(showAbout) h += `<div class="abs" style="left:${X0}pt;top:${y}pt">${FXS.label('About the house', 'fb.about.label')}</div>` +
        `<div class="wu" data-slot="fb.about" data-lines="${n}" data-try="${n}" data-lh="${alh}" ${sd(ab.length >= 3 ? ab : fl)} style="position:absolute;left:${X0}pt;top:${y + labH}pt;width:${CW}pt;height:${n*alh}pt;font-size:13pt;line-height:${alh}pt"></div>`;
    }
    [[useUpd ? 'Updates' : 'Features', l1, 'fb.updates'], ['Outside and nearby', l2, 'fb.outside']].forEach(([title, list, slot], i) => { const cw2 = (CW - gap)/2, bx = X0 + i*(cw2 + gap);
      h += `<div class="card" style="left:${bx}pt;top:${cardsTop}pt;width:${cw2}pt;height:${cardH}pt"></div>`;
      h += `<div class="abs" style="left:${bx + 16}pt;top:${cardsTop + 12}pt">${FXS.label(title, slot + '.title')}</div>`;
      h += FXS.bullets(list, bx + 18, cardsTop + 34, cw2 - 30, rowH, slot, rowsN, 10.5).html; });
    h += `<div class="hr" style="left:${X0}pt;top:${bottomOfCards + 10}pt;width:${CW}pt"></div>`;
    h += ContactCard.html([X0, bottomOfCards + 18, CW, 74], Object.assign({}, A, {headshot: hsSrc}), Object.assign({}, b, {logo: b.logo}), {layout: 'panel', size: 'mid', fine: '', bottomGap: 0.5, fieldAccent: true});
    h += `<div class="abs fine" style="left:${X0}pt;top:${bottomOfCards + 96}pt;width:${CW}pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">Information deemed reliable but not guaranteed.</div>`;
    return {html: h, issues};
  };
  // kicker label + a one-line Cormorant title (fits its width) + an italic intro of whole sentences; returns {html, bottom}
  FXS.pageHead = (kicker, title, intro, slot, lines, x0, minLines) => { const X0 = x0 == null ? 90 : x0, CW = 498, Y0 = 27;
    const ts = FXS.fitSize(title, "font-family:'Cormorant Garamond';font-weight:500", CW, 31, 22), lh = 21, tr = []; for(let t = lines; t >= (minLines || 2); t--) tr.push(t);
    const ty = Y0 + 18, iy = ty + ts*1.2 + 12;
    return {html: `<div class="abs" style="left:${X0}pt;top:${Y0}pt">${FXS.label(kicker, slot + '.kicker')}</div>
      <div class="abs" style="left:${X0}pt;top:${ty}pt;width:${CW}pt;height:${ts*1.2}pt;font:500 ${ts}pt/${ts*1.2}pt var(--fx-serif);color:var(--fx-ink);white-space:nowrap;overflow:hidden" data-slot="${slot}.title" data-lines="1">${esc(title)}</div>
      <div class="abs wu" data-slot="${slot}.intro" data-lines="${lines}" data-try="${tr.join(',')}" data-lh="${lh}" ${sd(intro)} style="left:${X0}pt;top:${iy}pt;width:${CW}pt;height:${lines*lh}pt;font-size:14.5pt;line-height:${lh}pt"></div>`, bottom: iy + lines*lh}; };
  // pages that run through OHL / FXP (Open House flyer, email, socials): the repeated-phrase and duplicate-sentence checks ride on their brochureCheck
  FXS.repCheck = () => { const out = [], seenS = new Map();
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return;
      const txt = String(el.textContent), r = SW.rep5(txt); if(r) out.push({slot: el.dataset.slot, kind: 'repeated-phrase', detail: `"${r}" repeats in one block`});
      txt.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x.length >= 28).forEach(x => { const k = x.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 48), prev = seenS.get(k);
        if(prev && prev !== el.dataset.slot) out.push({slot: el.dataset.slot, kind: 'duplicate-sentence', detail: `"${x.slice(0, 60)}" also in ${prev}`}); else seenS.set(k, el.dataset.slot); }); });
    return out; };
  // values in every table sit centered top to bottom in their cells (owner 11/2/2026): the content box's middle is within 2 px of the cell's middle
  FXS.tableCheck = () => { const out = [];
    document.querySelectorAll('.stats.tc .s, .tcell').forEach(c => { const inner = c.firstElementChild; if(!inner) return; const a = c.getBoundingClientRect(), b = inner.getBoundingClientRect();
      const d = Math.abs((a.top + a.bottom)/2 - (b.top + b.bottom)/2); if(d > 2) out.push({slot: c.dataset.slot || 'table', kind: 'table-value-not-centered', detail: `${d.toFixed(1)} px off the cell's middle`}); });
    return out; };
  // no fact twice on one face (same_fact, mirrored from scripts/fxsets/carousel_copy.py): sentences of 4+ content words across the face's text blocks
  // <samefact>
  const STOP_ = new Set('a an the and of to from with in on at its it is are by for this that one two room'.split(' '));
  // words as the repeat check sees them: hyphens split ("10-foot" -> 10 foot), plurals and feet/foot folded ("ceilings" -> ceiling)
  const cw_ = t => new Set((String(t).toLowerCase().replace(/[-\u2013]/g, ' ').match(/[a-z0-9']+/g) || []).map(w => w === 'feet' ? 'foot' : (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) ? w.slice(0, -1) : w).filter(w => !STOP_.has(w)));
  FXS.sameFact = (a, b) => { const A = cw_(a), B = cw_(b), m = Math.min(A.size, B.size); if(!m) return false; let n = 0; A.forEach(w => { if(B.has(w)) n++; }); return n/m >= (m <= 3 ? .5 : .6); };
  // </samefact>
  // two sentences of one caption that share two or more distinct nouns of 5+ letters ("a pendant light" said twice)
  FXS.sharedNouns = (a, b) => { const w = t => new Set((String(t).toLowerCase().replace(/[-\u2013]/g, ' ').match(/[a-z]{5,}/g) || []).map(x => x.replace(/s$/, '')).filter(x => !STOP_.has(x) && !/^(there|their|sits|stands|which|where|under|other|along|around|about|above|below|beside|across|ceiling|floor|runs|sits|every|three|space)$/.test(x))); const A = w(a), B = w(b), n = []; A.forEach(x => { if(B.has(x)) n.push(x); }); return n; };
  FXS.faceFactCheck = () => { const out = [];
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return; const m = /neighboring townhomes sit below|power lines?/i.exec(el.textContent || ''); if(m) out.push({slot: el.dataset.slot, kind: 'banned-phrase', detail: m[0]}); });
    document.querySelectorAll('.page').forEach(pg => { const seen = [];
      pg.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]') || /^(agent|broker|place|address|fineprint|fact|front\.fact|back\.return|back\.fine|back\.plannote)/.test(el.dataset.slot) || /\.(label|kicker|title|k)$/.test(el.dataset.slot)) return;
        ((ss => { for(let i = 0; i < ss.length; i++) for(let j = i + 1; j < ss.length; j++){ const n = FXS.sharedNouns(ss[i], ss[j]); if(n.length >= 2 && /photo\d/.test(el.dataset.slot)) out.push({slot: el.dataset.slot, kind: 'noun-repeated-in-caption', detail: n.join(' + ') + ' in "' + ss[i].slice(0, 36) + '" and "' + ss[j].slice(0, 36) + '"'}); } })(String(el.textContent).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x.length > 12)), 0);
        String(el.textContent).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => (/[.!?]$/.test(x) || /^back\.(updates|outside)\.\d+$/.test(el.dataset.slot)) && !/miles?\.?$/.test(x) && cw_(x).size >= (/^back\.(updates|outside)\./.test(el.dataset.slot) ? 2 : 3)).forEach(x => { const bl = /^back\.(updates|outside)\.\d+$/.test(el.dataset.slot) || /^back\.(updates|outside)\.\d+$/.test(o_ => 0), hit = seen.find(o => (o.slot !== el.dataset.slot || o.t !== x) && FXS.sameFact(o.t, x) && (!(/^back\.(updates|outside)\./.test(el.dataset.slot) || /^back\.(updates|outside)\./.test(o.slot)) || (cw_(o.t).size <= 2 || cw_(x).size <= 2 ? [...cw_(cw_(o.t).size <= cw_(x).size ? o.t : x)].every(w => cw_(cw_(o.t).size <= cw_(x).size ? x : o.t).has(w)) : true)));
          if(hit) out.push({slot: el.dataset.slot, kind: 'same-fact-on-face', detail: `"${x.slice(0, 50)}" ~ "${hit.t.slice(0, 50)}" (${hit.slot})`}); else seen.push({slot: el.dataset.slot, t: x}); }); }); });
    return out; };
  // drop the pool sentences that say what an already placed sentence says (any wording), as long as at least `keep` sentences remain
  FXS.dropSame = (pool, placed, keep) => { const alts = x => [].concat(x), kept = (pool || []).filter(x => !alts(x).some(a => placed.some(p => FXS.sameFact(a, p)))); return kept.length >= (keep || 2) ? kept : pool; };
  // a caption's sentences minus any that repeat a placed fact; short pools are refilled from the photo's own room notes (never a fact already placed)
  FXS.refill = (D, c, placed, want) => { const alts = x => [].concat(x), mine = [];
    let s = (c.s || []).filter(x => !alts(x).some(a => placed.some(p => FXS.sameFact(a, p))));
    s = s.filter((x, i) => !s.slice(0, i).some(y => alts(y).some(b => alts(x).some(a => FXS.sameFact(a, b)))));
    const R = (((D.companion || {}).roomLines || {})[c.photo] || {}), J = (((D.companion || {}).justListed || {}).captions || {})[c.photo];
    const extra = [].concat(R.all || [], R.long || [], R.short || [], J || []).filter(t => typeof t === 'string' && t.length > 18 && !/^(Natural light fills|Neutral finishes keep|Fresh paint and new light)|power lines?/i.test(t));
    const have = () => placed.concat([].concat(...s.map(alts)));
    for(const t of extra){ if(s.length >= (want || 5)) break; if(!have().some(p => FXS.sameFact(t, p)) && !s.some(x => [].concat(x).some(a => FXS.sharedNouns(a, t).length >= 2))) s.push(t); }
    return s.length >= 1 ? s : c.s; };
  // the drawn floor plan fills at least 70% of its card (union of the drawn plan, labels included, over the card)
  FXS.planFillCheck = () => { const out = [], c = document.querySelector('[data-plancard]'); if(!c) return out; const cr = c.getBoundingClientRect(), wrap = c.parentElement.querySelector('.planwrap'); if(!wrap) return out;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; wrap.querySelectorAll('img, .plan-svg, .plan-level').forEach(e => { const r = e.getBoundingClientRect(); if(r.width < 1 || r.height < 1) return; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); });
    if(x1 < 0) return out; const fill = ((x1 - x0)*(y1 - y0))/(cr.width*cr.height); if(fill < 0.7) out.push({slot: 'back.plan', kind: 'plan-fills-card', detail: `the plan fills ${(fill*100).toFixed(0)}% of its card (70% minimum)`}); return out; };
  FXS.hookCheck = () => { let bc = null; Object.defineProperty(window, 'brochureCheck', {configurable: true, get: () => bc, set: v => { bc = typeof v === 'function' ? (() => v().concat(FXS.repCheck())) : v; }}); };
  window.SW = SW; window.FXS = SW;
})();
