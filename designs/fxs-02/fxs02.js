/* fxs-02 helpers (ported from the swatchbook set's swatchbook.js, FX02 look): data, photos, captions and paragraphs that fill their boxes, logos, print checks, the set's tokens (FXS.tok, read from fxs02.css) and marks (icons, arch).

   Captions and paragraphs are written as a lead plus whole sentences (data-s). Each box has a line count; the fill pass
   picks the sentences, in the writer's order, that set in exactly that many lines with the last line at least 3/4 full.
   It never cuts a word or a sentence; when no set of whole sentences fits, the box is reported and goes back to the writer. */
(function(){
  const SW = {};
  const FXS = SW;
  const esc = SW.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pt = px => px*72/96;
  SW.data = () => JSON.parse(document.getElementById('brochure-data').textContent || '{}');

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
      if(p.crop){   // a hand-set crop (fractions x0, y0, x1, y1 of the photo): the frame shows only this part, so a neighbour in the shot stays out of the print
        const [cx0, cy0, cx1, cy1] = p.crop, sc = Math.max(tw/((cx1 - cx0)*W), th/((cy1 - cy0)*H)), iw = W*sc, ih = H*sc;
        const lx = Math.min(0, Math.max(tw - iw, tw/2 - (cx0 + cx1)/2*iw)), ly = Math.min(0, Math.max(th - ih, th/2 - (cy0 + cy1)/2*ih));
        img.style.cssText = `position:absolute;max-width:none;object-fit:fill;width:${iw}px;height:${ih}px;left:${lx}px;top:${ly}px`;
        return;
      }
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
    return {n: lines.length, fill: last ? (last.r-last.l)/box : 0, min: lines.length > 1 ? Math.min(...lines.slice(0, -1).map(l => (l.r - l.l)/box)) : 1};
  };
  SW.textWidth = el => { const r = document.createRange(); r.selectNodeContents(el); return pt(r.getBoundingClientRect().width); };
  const cap1 = t => String(t).replace(/^(\s*)([a-z])/, (m, w, c) => w + c.toUpperCase());   // every caption sentence starts with a capital (owner review r7)
  const html = (lead, sents) => (lead ? `<b>${esc(lead)}</b> ` : '') + esc(sents.map(cap1).join(' '));
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
    for(let m = 1; m < (1 << n); m += (el.dataset.free ? 1 : 2)) walk(m, 0, []);   // data-free: any sentence may lead (photo captions that open with their room name)   // the first sentence always stays: it carries the point of the box
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
  SW.pfN = pfN; SW.capHtml = html;   // for a piece's own refit after layout (fold-over strip, owner review r4)
  // after the fill: a full-width write-up (data-justify) whose sentences end short of its full box (data-h0, pt) takes the smallest bigger type (0.25 pt steps, up to 1.25x)
  // at which a set of its sentences fills the box, every line 80%+ and the last 90%+ set ragged; then it is justified (owner 11/8: full column width, no blank space). Same as FXS-14's FO.grow.
  SW.grow = () => document.querySelectorAll('[data-justify]').forEach(el => { if(!el.textContent.trim() || !el.dataset.h0) return;
    const H = +el.dataset.h0, cs = getComputedStyle(el); if(!el.dataset.fs0) el.dataset.fs0 = parseFloat(cs.fontSize)*0.75; if(!el.dataset.r0) el.dataset.r0 = (parseFloat(cs.lineHeight)*0.75)/el.dataset.fs0 || 1.5;
    const fs0 = +el.dataset.fs0, r = +el.dataset.r0, keep = el.innerHTML; el.style.textAlign = 'left'; el.style.height = 'auto'; let best = null;
    for(let fs = fs0; fs <= fs0*1.25 + 0.01 && !best; fs += 0.25){ el.style.fontSize = fs + 'pt'; el.style.lineHeight = (fs*r) + 'pt';
      const T = Math.floor((H + 0.5)/(fs*r)); if(T < 2) continue;
      for(const t of [T, T - 1]){ if(t*fs*1.7 < H) continue; const b = pfN(el, t); if(b){ best = {fs, n: t, pick: b.pick}; break; } } }
    const lead = el.dataset.lead || '';
    if(!best){ el.style.fontSize = fs0 + 'pt'; el.innerHTML = keep; el.style.lineHeight = (fs0*r) + 'pt'; best = {fs: fs0, n: SW.lines(el).n}; }
    else { el.style.fontSize = best.fs + 'pt'; el.innerHTML = html(lead, best.pick); }
    const lh = Math.min(H/best.n, best.fs*1.7);
    el.style.lineHeight = lh + 'pt'; el.style.height = (best.n*lh) + 'pt'; el.dataset.lines = best.n; if(el.dataset.lh) el.dataset.lh = lh; el.style.textAlign = 'justify'; });
  SW.fill = () => {
    const issues = [];
    document.querySelectorAll('[data-justify]').forEach(e => { e.style.textAlign = 'left'; });   // set ragged while the sentences are picked
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
        if(el.dataset.justify){ if(!el.dataset.h0) el.dataset.h0 = tries[0] * (+el.dataset.lh || 0) || ''; el.style.textAlign = 'justify'; }
      } else settle(el, +el.dataset.lines || 1);
    });
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
      if(h < 85 || w/h > 3.1) issues.push({slot: el.dataset.slotPhoto || el.dataset.photo, kind:'photo-too-thin', detail: `${w.toFixed(0)} x ${h.toFixed(0)} pt`}); });
    // the same photo twice on one page (or a near-duplicate: the same room or view under another number, review r2); a photo in sw.plan.secondView is a second view the owner cleared (11/8/2026: one-yard houses keep a second yard view)
    const famOf = id => { if(SW._rk[id]) return 'rk:' + SW._rk[id]; id = String(id).replace(/(\d)[a-z]$/, '$1'); return /^(deck|pergola|patio|fence|evening|yard)\d*$/.test(id) ? 'outdoor' : /^(entry|walk)\d*$/.test(id) ? 'entry' : /^(front)\d*$/.test(id) ? 'front' : /^(primary|game|terrace|gazebo)\d*$/.test(id) ? id.replace(/\d+$/, '') : id; };   // the same view or room under another number
    document.querySelectorAll('.panel').forEach(pn => {
      const seen = new Map();
      pn.querySelectorAll('.ph[data-photo]').forEach(el => {
        const id = el.dataset.photo; if(!id) return;
        const key = famOf(id), prev = seen.get(key);
        if(prev && prev !== id && !(((D && D.sw && D.sw.plan) || {}).secondView || []).includes(id)) issues.push({slot: el.dataset.slotPhoto || id, kind: 'near-duplicate-photo', detail: `${id} and ${prev} show the same room or view on one page`});
        else if(prev === id) issues.push({slot: el.dataset.slotPhoto || id, kind: 'duplicate-photo', detail: `${id} is on the page twice`});
        seen.set(key, id);
      });
    });
    // no photo number, QR, pin or listing price anywhere on the piece
    if(/\bqr\b|scan for/i.test(document.body.innerText)) issues.push({slot:'piece', kind:'qr-text'});
    if(/natural light fills the room|neutral finishes keep the room light|the range is gas|shopping, restaurants and major highways are all close|best restaurants|power\\s*lines?|neighboring townhomes/i.test(document.body.innerText)) issues.push({slot:'piece', kind:'banned-phrase', detail:'a banned line is on the piece'});   // set-level lint (owner review r7)
    if(window.fxsRepeats) issues.push(...fxsRepeats(document));   // a phrase of 5+ words twice in one caption or paragraph
    if(window.ContactCard) issues.push(...ContactCard.check(document));
    if(window.IvoryPlan) issues.push(...IvoryPlan.check());
    return issues;
  };
  SW.famOf = id => { if(SW._rk[id]) return 'rk:' + SW._rk[id]; id = String(id).replace(/(\d)[a-z]$/, '$1'); return /^(deck|pergola|patio|fence|evening|yard)\d*$/.test(id) ? 'outdoor' : /^(entry|walk)\d*$/.test(id) ? 'entry' : /^(front)\d*$/.test(id) ? 'front' : /^(primary|game|terrace|gazebo)\d*$/.test(id) ? id.replace(/\d+$/, '') : id; };
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
  SW._rk = {};
  SW.setup = async function(D){
    if(+(D.listing || {}).stories > 1) Object.entries(D.photos || {}).forEach(([k, v]) => { if(v && v.roomKey) SW._rk[k] = v.roomKey; });   // the 1-story may show a second view of a room   // physical room per photo (owner review r6)
    await Promise.all(['300 10pt Montserrat','400 10pt Montserrat','500 10pt Montserrat','600 10pt Montserrat','700 10pt Montserrat','800 10pt Montserrat'].map(f => document.fonts.load(f)));
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


  // ---------- the set's tokens (fxs02.css is the one source) and marks ----------
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  FXS.tok = new Proxy({}, {get: (_, k) => ({
    paper: cssVar('--fx-paper'), band: cssVar('--fx-band'), ink: cssVar('--fx-ink'), ink2: cssVar('--fx-ink2'), text: cssVar('--fx-text'),
    textDark: cssVar('--fx-text-dark'), mute: cssVar('--fx-mute'), rule: cssVar('--fx-rule'), onInk: cssVar('--fx-on-ink'),
    onInkSoft: cssVar('--fx-on-ink-soft'), font: 'Montserrat', bandW: parseFloat(cssVar('--fx-band-w')), m: parseFloat(cssVar('--fx-m')),
    ruleW: parseFloat(cssVar('--fx-rule-w')), barW: parseFloat(cssVar('--fx-bar-w'))})[k]});
  // line icons (24 box, round caps): FX02's own five, plus stories and lot in the same hand
  FXS.ICON = {
    bed:'<path d="M3 18v-7h18v7M3 14h18M6 11V8h5v3M13 11V8h5v3"/>',
    bath:'<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/>',
    area:'<path d="M4 4h16v16H4zM4 9h5M15 20v-5h5"/>',
    cal:'<path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"/>',
    pin:'<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    stories:'<path d="M4 11l8-6 8 6M6 9.5V20h12V9.5M6 14.5h12"/>',
    lot:'<path d="M3 4h18v16H3z" stroke-dasharray="2.2 1.8"/><path d="M7.5 14.5l4.5-4 4.5 4M9 13.2V17h6v-3.8"/>',
    garage:'<path d="M3 20V9l9-5 9 5v11M7 20v-7h10v7M7 15.5h10"/>',
    gate:'<path d="M4 20V6M20 20V6M4 8h16M4 14h16M8 8v12M12 8v12M16 8v12"/>'
  };
  FXS.icon = (name, size, color) => `<svg aria-hidden="true" width="${size}pt" height="${size}pt" viewBox="0 0 24 24" fill="none" stroke="${color || FXS.tok.ink2}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block">${FXS.ICON[name]}</svg>`;
  // the arch: the round left end (a half-capsule when the photo is wider than tall)
  FXS.arch = (w, h) => { const r = Math.min(w, h)/2; return `border-radius:${r}pt 0 0 ${r}pt`; };
  FXS.archBox = (w, h) => { const r = Math.min(w, h)/2; return `border-radius:${r}pt 0 0 ${r}pt`; };
  // the listing facts [icon, label, value]: beds, baths, sq ft, built, then stories and lot when the listing has them
  FXS.facts = (L, opts) => {
    const f = [], n = v => Number(v).toLocaleString('en-US');
    if(L.beds) f.push(['bed', 'Beds', String(L.beds)]);
    if(L.baths){   // baths wording: templates/_shared/baths.js (3 Full Baths / 3½ Baths / two or more halves on their own line)
      const b = window.BD && BD.bathNum ? BD.bathNum(L) : {num: String(L.baths), half: ''};
      f.push(['bath', b.label === 'Baths' ? 'Baths' : (+L.baths === 1 ? 'Full bath' : 'Full baths'), String(b.num).replace(/<[^>]*>/g, '')]);
      if(b.half) f.push(['bath', 'Half baths', String(L.halfBaths)]);
    }
    if(L.sqft) f.push(['area', 'Sq ft', n(L.sqft)]);
    const yr = L.yearBuilt || L.year; if(yr) f.push(['cal', 'Built', String(yr)]);
    if(opts && opts.more){
      if(L.stories) f.push(['stories', 'Stories', String(L.stories)]);
      const lot = L.lotAcres ? (L.lotAcres >= 0.5 ? `${L.lotAcres} acres` : `${n(Math.round(L.lotAcres*43560))} sq ft`) : L.lotSqft ? `${n(L.lotSqft)} sq ft` : L.lotSize ? String(L.lotSize).replace(/\s*Sq Ft Lot/i, ' sq ft') : '';
      if(lot) f.push(['lot', 'Lot', lot]);
    }
    return f;
  };
  // the street: light number over heavy caps name (the suffix drops first, then a long street runs two lines)
  FXS.SUF = /\s+(Street|St|Drive|Dr|Lane|Ln|Road|Rd|Avenue|Ave|Boulevard|Blvd|Court|Ct|Circle|Cir|Place|Pl|Way|Trail|Trl|Parkway|Pkwy|Terrace|Ter|Highway|Hwy)\.?$/i;
  FXS.width = (t, css) => { const m = document.createElement('span'); m.style.cssText = `position:absolute;left:-9999pt;visibility:hidden;white-space:nowrap;${css}`; m.textContent = t; document.body.appendChild(m); const w = m.getBoundingClientRect().width*.75; m.remove(); return w; };
  FXS.fitSize = (t, css, w, max, min) => { let s = max; while(s > min && FXS.width(t, `${css};font-size:${s}pt`) > w) s -= .5; return s; };
  FXS.street = (address, w, max) => {
    const parts = (String(address).match(/^\s*(\d+[A-Za-z-]*)\s+(.+)$/) || [null, '', address]);
    const NUM = parts[1], NAME = parts[2].toUpperCase();
    const css = "font-family:Montserrat;font-weight:700;letter-spacing:-.5pt";
    const cands = [NAME]; const ns = NAME.replace(FXS.SUF, ''); if(ns && ns !== NAME) cands.push(ns);
    for(const c of cands){ const s = FXS.fitSize(c, css, w, max, max*.62); if(FXS.width(c, `${css};font-size:${s}pt`) <= w) return {num: NUM, lines: [c], s}; }
    const c = cands[cands.length - 1], ws = c.split(/\s+/); let best = null;
    for(let i = 1; i < ws.length; i++){ const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '), d = Math.max(FXS.width(a, `${css};font-size:20pt`), FXS.width(b, `${css};font-size:20pt`)); if(!best || d < best.d) best = {d, l: [a, b]}; }
    const l = best ? best.l : [c];
    return {num: NUM, lines: l, s: Math.min(max, Math.min(...l.map(t => FXS.fitSize(t, css, w, max, 14))))};
  };
  // the street block as html at (x, y) in width w: number (light) over the name (heavy caps); returns {html, h}
  FXS.streetBlock = (address, x, y, w, max, slot) => {
    const st = FXS.street(address, w, max), ns = Math.min(st.s*.8, 48);
    let yy = y, h = '';
    if(st.num){ h += `<div class="abs ttl" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${ns*1.1}pt;font-size:${ns}pt;line-height:${ns*1.1}pt;color:var(--fx-ink)" data-slot="${slot}.number" data-lines="1">${esc(st.num)}</div>`; yy += ns*1.1; }
    st.lines.forEach(t => { h += `<div class="abs ttl" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${st.s*1.08}pt;font-size:${st.s}pt;line-height:${st.s*1.08}pt;font-weight:700;letter-spacing:-.5pt" data-slot="${slot}" data-lines="1">${esc(t)}</div>`; yy += st.s*1.08; });
    return {html: h, h: yy - y, st};
  };
  // light words then a bold last word: "Two levels, one private deck." -> light + bold
  FXS.lightBold = t => { const w = String(t).trim().split(/\s+/); if(w.length < 2) return `<b>${esc(t)}</b>`; return esc(w.slice(0, -1).join(' ')) + ' <b>' + esc(w[w.length - 1]) + '</b>'; };
  // a facts grid (icon, label, value), two columns, at (x, y) in width w; returns {html, h}
  FXS.factGrid = (facts, x, y, w, rowH, icon, slot) => {
    let h = '';
    facts.forEach(([ic, lab, v], i) => {
      const cx = x + (i % 2)*(w/2), cy = y + Math.floor(i/2)*rowH;
      h += `<div class="abs" style="left:${cx}pt;top:${cy + 2}pt">${FXS.icon(ic, icon)}</div>`;
      h += `<div class="abs fact" style="left:${cx + icon + 9}pt;top:${cy}pt;width:${w/2 - icon - 12}pt;height:${rowH}pt"><div class="fl" data-slot="${slot}.${ic}.label" data-lines="1">${lab}</div><div class="fv" data-slot="${slot}.${ic}" data-lines="1" style="overflow:hidden">${esc(v)}</div></div>`;
    });
    return {html: h, h: Math.ceil(facts.length/2)*rowH};
  };
  // the arch photo: a room photo with the round left end
  FXS.archPhoto = (D, id, x, y, w, h, slot) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${SW.photo(D, id, `position:absolute;inset:0;${FXS.arch(w, h)}`, slot)}</div>`;
  // a logo, sized to a box, left aligned (the one brokerage logo of a side)
  FXS.logo = (D, x, y, w, h, just) => { const b = D.brand || {}; const src = b.logo; return `<div class="abs logo" data-area="${w*h}" data-maxh="${h}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;justify-content:${just || 'flex-start'}">${src ? `<img src="${esc(src)}" alt="">` : `<span class="word" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span>`}</div>`; };

  window.SW = SW; window.FXS = SW;
})();
