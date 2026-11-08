/* fxs-36 helpers (ported from the swatchbook set's swatchbook.js, FX36 look): data, photos, captions and paragraphs that fill their boxes, logos, print checks, the set's tokens (FXS.tok, read from fxs36.css) and marks (icons, arch).

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
  // two sentences that say the same fact in different words: 60% of the shorter one's content words are in the other (mirrors same_fact() in scripts/fxsets/carousel_copy.py)
  const STOPW = new Set('a an the and of to from with in on at its it is are by for this that one two room its'.split(' '));
  const cw = s => new Set((String(s).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !STOPW.has(w)));
  SW.sameFact = (a, b) => { const A = cw(a), B = cw(b), small = Math.min(A.size, B.size); if(!small) return false; let n = 0; A.forEach(w => { if(B.has(w)) n++; }); return n/small >= (small <= 3 ? 0.5 : 0.6); };
  SW.sentences = txt => String(txt).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
  SW.sameFactIn = txt => { const s = SW.sentences(txt).filter(x => cw(x).size >= 2 && x.split(/\s+/).length >= 3); for(let i = 0; i < s.length; i++) for(let j = i + 1; j < s.length; j++) if(SW.sameFact(s[i], s[j])) return [s[i], s[j]]; return null; };
  // a pool of sentences: no sentence twice, and no sentence that shares a 5-word phrase with an earlier one
  SW.dedupe5 = list => { const out = [], grams = new Set();
    (list || []).forEach(t => { const w = words5(t), gs = []; for(let i = 0; i + 5 <= w.length; i++) gs.push(w.slice(i, i + 5).join(' '));
      if(out.some(u => String(u).toLowerCase().slice(0, 28) === String(t).toLowerCase().slice(0, 28) || SW.sameFact(u, t)) || gs.some(g => grams.has(g))) return;
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
      if(SW.rep5((lead ? lead + ' ' : '') + pick.join(' '))) return;
      for(let i = 0; i < pick.length; i++) for(let j = i + 1; j < pick.length; j++) if(SW.sameFact(pick[i], pick[j])) return;   // never the same fact twice in one box
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
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return; const sf = SW.sameFactIn(el.textContent); if(sf) issues.push({slot: el.dataset.slot, kind: 'same-fact-twice', detail: `"${sf[0].slice(0, 50)}" and "${sf[1].slice(0, 50)}" say the same thing`}); });
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return; const r = SW.rep5(el.textContent); if(r) issues.push({slot: el.dataset.slot, kind: 'repeated-phrase', detail: `"${r}" repeats in one block`}); });
    // the same sentence twice on one page of the piece
    document.querySelectorAll('.panel, .sheet').forEach(pn => { const seenS = new Map();
      pn.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return;
        String(el.textContent).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x.length >= 28).forEach(x => { const k = x.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 48), prev = seenS.get(k);
          if(prev && prev !== el.dataset.slot) issues.push({slot: el.dataset.slot, kind: 'duplicate-sentence', detail: `"${x.slice(0, 60)}" also in ${prev}`}); else seenS.set(k, el.dataset.slot); }); }); });
    issues.push(...SW.faceChecks());
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
    await Promise.all(['300 10pt Montserrat','400 10pt Montserrat','500 10pt Montserrat','600 10pt Montserrat','700 10pt Montserrat','400 10pt "Oswald"','500 10pt "Oswald"','400 10pt "Oswald"','500 10pt "Oswald"','600 10pt "Oswald"','italic 400 10pt "Oswald"'].map(f => document.fonts.load(f)));
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


  // ---------- the set's tokens (fxs36-tokens.css is the one source) and marks ----------
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
    const css = "font-family:'Oswald';font-weight:500;letter-spacing:1.5pt";
    const s = FXS.fitSize(address, css, len, max, min || max*.5);
    return FXS.vt(cx, cy, len, s*1.5, 'vaddr', `font-size:${s}pt`, esc(address), 'data-slot="address" data-lines="1"');
  };
  // the round seal: the house's own neighborhood in Cormorant over a tracked "HOUSTON, TEXAS" line; centered on (cx, cy), diameter d
  FXS.seal = (D, cx, cy, d, slot, o) => { o = o || {};
    const L = D.listing, name = FXS.hood(L) || L.city, sub = (o.sub || `${L.city}, ${L.state}`).toUpperCase();
    const inner = d*.8, css = "font-family:'Oswald';font-weight:500";
    let s = d*.2, one = true;
    const fit = FXS.fitSize(name, css, inner, d*.2, d*.15);
    if(FXS.width(name, `${css};font-size:${fit}pt`) <= inner && fit >= d*.155) s = fit;
    else { one = false; const ws = name.split(/\s+/); s = Math.min(d*.19, ...ws.map(w => FXS.fitSize(w, css, inner, d*.19, 10))); }
    const subS = o.subSize || Math.max(6.5, Math.min(9, d*.055)), track = subS*.25, sub1 = FXS.fitSize(sub, `font-family:Montserrat;font-weight:600;letter-spacing:${track}pt`, inner, subS, 6.5);
    return `<div class="seal" data-slot="${slot || 'seal'}" style="left:${cx - d/2}pt;top:${cy - d/2}pt;width:${d}pt;height:${d}pt"><div class="nm" style="font-size:${s}pt;${one ? '' : `white-space:normal;line-height:1.22;width:${inner}pt`}" data-slot="${slot || 'seal'}.name" data-lines="${one ? 1 : name.split(/\s+/).length}">${esc(name)}</div>${o.noSub ? '' : `<div class="sub" style="font-size:${sub1}pt;letter-spacing:${track}pt;margin-top:${d*.035}pt" data-slot="${slot || 'seal'}.sub" data-lines="1" ${(sub1 < 8 || o.fine) ? 'data-fine="1"' : ''}>${esc(sub)}</div>`}</div>`;
  };
  // the small seal that carries the year built
  FXS.yearSeal = (cx, cy, d, year, slot) => `<div class="seal" style="left:${cx - d/2}pt;top:${cy - d/2}pt;width:${d}pt;height:${d}pt"><div class="k" data-slot="${slot}.k" data-lines="1" data-fine="1">BUILT</div><div class="yr" style="font-size:${d*.3}pt" data-slot="${slot}" data-lines="1">${esc(String(year))}</div></div>`;
  // the stat row texts: beds, baths, square feet, built (four, as FX36)
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
  FXS.statsRow = (items, x, y, w, h, slot, o) => { o = o || {}; return `<div class="stats" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${items.map((t, i) => `<div class="s" data-slot="${slot}.${i}" data-lines="1">${FXS.statHtml(t, o.np, o.lp, o.track, o.one)}</div>`).join('')}</div>`; };
  FXS.label = (t, slot, style) => `<div class="lbl" ${slot ? `data-slot="${slot}" data-lines="1"` : ''} style="${style || ''}">${esc(String(t).toUpperCase())}</div>`;
  // a photo box at (x, y, w, h)
  FXS.box = (D, id, x, y, w, h, slot, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${SW.photo(D, id, `position:absolute;inset:0;${css || ''}`, slot)}</div>`;
  // a logo, sized to a box (the one brokerage logo of a side)
  FXS.logo = (D, x, y, w, h, just) => { const b = D.brand || {}; const src = b.logo; return `<div class="abs logo" data-area="${w*h}" data-maxh="${h}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;justify-content:${just || 'flex-start'}">${src ? `<img src="${esc(src)}" alt="">` : `<span class="word" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span>`}</div>`; };
  // the agent block of a front: name, REALTOR(R), phone, email, left aligned at (x, y)
  FXS.agent = (A, x, y, w, hsSrc) => {
    const tx = x + (hsSrc ? 70 : 0);
    return (hsSrc ? `<div class="abs hsbox" style="left:${x}pt;top:${y + 2}pt;width:62pt;height:62pt"><img src="${esc(hsSrc)}" alt=""></div>` : '') +
      `<div class="abs agentline" style="left:${tx}pt;top:${y}pt;width:${w - (hsSrc ? 70 : 0)}pt"><div class="n" data-slot="agent.name" data-lines="1">${esc(A.name || '')}</div><div class="d" data-slot="agent.desig" data-lines="1" data-fine="1">REALTOR®</div><div class="p" data-slot="agent.phone" data-lines="1">${esc(A.phone || '')}</div><div class="e" data-slot="agent.email" data-lines="1">${esc(A.email || '')}</div>${A.web ? `<div class="e" data-slot="agent.web" data-lines="1">${esc(A.web)}</div>` : ''}</div>`;
  };
  // light words then a bold last word
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
  FXS.captioned = (D, c, x, y, w, ph, lines, slot, o) => { o = o || {}; const L0 = FXS.leadLabel(c.lead), L = (()=>{ let n = L0.name; const wl = t => FXS.width(t.toUpperCase(), 'font-family:Montserrat;font-weight:600;font-size:9pt;letter-spacing:2pt'); if(wl(n) > w) n = n.split(/ and |, /)[0]; return {name: n, size: L0.size}; })(), lh = o.lh || 13.5, fs = o.fs || 10, showSize = L.size && FXS.width(L.name.toUpperCase(), 'font-family:Montserrat;font-weight:600;font-size:9pt;letter-spacing:2pt') + FXS.width(L.size, 'font-family:Montserrat;font-weight:500;font-size:9pt') + 12 <= w;
    return FXS.box(D, c.photo, x, y, w, ph, slot) +
      `<div class="abs" style="left:${x}pt;top:${y + ph + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(L.name.toUpperCase())}</div>${showSize ? `<span style="font:500 9pt/12pt var(--fx-font);color:var(--fx-mute);margin-left:8pt;white-space:nowrap">${esc(L.size)}</span>` : ''}</div>` +
      `<div class="abs cap"><div class="a" style="position:absolute;left:${x}pt;top:${y + ph + 25}pt;width:${w}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-lh="${lh}" data-lines="${lines}" data-narrow="${o.narrow == null ? 10 : o.narrow}" ${sd(c.s)}></div></div>`; };

  // ---------- fxs-36 composition: marks ----------
  // the script address on one line at the biggest size that fits w (Oswald)
  FXS.scriptLine = (text, x, y, w, max, min, slot, o) => { o = o || {};
    const css = "font-family:'Oswald'", s = FXS.fitSize(text, css, w, max, min || max*.55), lh = s*(o.lh || 1.2);
    return {s, lh, html: `<div class="abs script" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${lh}pt;font-size:${s}pt;line-height:${lh}pt;${o.css || ''}" data-slot="${slot}" data-lines="1">${esc(text)}</div>`}; };
  // a tracked caps line (gold or white)
  FXS.capsLine = (text, x, y, w, size, track, color, slot, o) => { o = o || {};
    return `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${size*1.4}pt;font:${o.w || 500} ${size}pt/${size*1.4}pt var(--fx-font);letter-spacing:${track}pt;text-transform:uppercase;color:${color};white-space:nowrap;overflow:hidden;text-align:${o.align || 'left'}" data-slot="${slot}" data-lines="1">${esc(text)}</div>`; };
  // the place line: ZIP and neighborhood, the city once ("HOUSTON, TEXAS 77023 · EAST END")
  FXS.placeText = L => { const hood = FXS.hood(L); return `${L.city}, ${L.state} ${L.zip || ''}`.trim().replace(/\s+/g, ' ') + (hood ? ` · ${hood}` : ''); };
  FXS.tileLabel = l => String(l || '').toUpperCase().replace(/^BEDROOMS?$/, 'BEDS');   // baths read as BD.bathsText says: FULL BATHS, or BATHS only after a ½
  FXS.statHtml = (t, np, lp, track, one) => { const p = FXS.statParts(t);
    return `<span style="font:500 ${np || 20}pt/1.05 var(--fx-display);color:var(--fx-ink)">${esc(p.n)}</span>${p.l ? `<span style="font:600 ${lp || 8}pt/1.2 var(--fx-font);letter-spacing:${track == null ? 2 : track}pt;color:var(--fx-ink);margin-top:4pt;text-align:center;white-space:nowrap">${one ? esc(FXS.tileLabel(p.l)) : esc(FXS.tileLabel(p.l)).replace(/^(FULL) (BATHS?)$/, '$1<br>$2')}</span>` : ''}`; };
  // a column (or row) of red stat tiles: numeral over caps label, w x h each tile
  FXS.tiles = (items, x, y, w, h, gap, slot, o) => { o = o || {}; const n = items.length, th = (h - gap*(n - 1))/n;
    return items.map((t, i) => { const p = FXS.statParts(t), lab = FXS.tileLabel(p.l), ns = Math.max(16, FXS.fitSize(p.n, "font-family:Oswald;font-weight:500", w - 12, Math.min(o.max || 30, th*.46), 16));
      const lab1 = FXS.width(lab, `font-family:Montserrat;font-weight:600;font-size:${o.lab || 8.5}pt;letter-spacing:2pt`) <= w - 10, labH = lab1 ? lab : lab.replace(/^(FULL) (BATHS?)$/, '$1<br>$2'), ls = lab1 ? FXS.fitSize(lab, "font-family:Montserrat;font-weight:600;letter-spacing:2pt", w - 10, o.lab || 8.5, 8) : (o.lab || 8.5);
      return `<div class="tile" style="left:${x}pt;top:${y + i*(th + gap)}pt;width:${w}pt;height:${th}pt"><div class="tn" style="font-size:${ns}pt" data-small="1" data-slot="${slot}.${i}" data-lines="1">${esc(p.n)}</div>${lab ? `<div class="tl" style="font-size:${ls}pt;margin-top:${Math.max(4.5, ns*.2)}pt" data-small="1" data-slot="${slot}.${i}.l" data-lines="${lab1 ? 1 : 2}">${lab1 ? esc(lab) : labH}</div>` : ''}</div>`; }).join(''); };


  // ---------- the cover (also the flyer front): the big red caps address, the place line, the whole house with a column of red stat tiles, headline, write-up, red rule, agent + logo ----------
  // after the fill: the fact line, the rule and the two rooms close up under the write-up's last line and the rooms grow to the foot (no empty band)
  FXS.fixCover = () => { document.querySelectorAll('.panel, .sheet').forEach(face => { const wu = face.querySelector('[data-slot="front.summary"]'), rooms = [...face.querySelectorAll('[data-role="coverroom"]')]; if(!wu || rooms.length < 2) return;
    const k = 96/72, fr = face.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(wu); const rs = [...rg.getClientRects()].filter(q => q.width > .5); if(!rs.length) return;
    let y = (Math.max(...rs.map(q => q.bottom)) - fr.top)/k + 14; const fc = face.querySelector('[data-role="cvfacts"]'), gd = face.querySelector('[data-role="cvgold"]');
    if(fc){ fc.style.top = y + 'pt'; y += 14 + 12; } if(gd){ gd.style.top = y + 'pt'; y += 9; }
    const foot = parseFloat(rooms[0].style.top) + parseFloat(rooms[0].style.height); if(foot - y >= 110) rooms.forEach(r => { r.style.top = y + 'pt'; r.style.height = (foot - y) + 'pt'; }); }); };
  FXS.cover = (D, o) => { o = o || {};
    // owner 11/7 (FXS-24 rules): no agent or brokerage on the cover; the house bleeds left and runs taller, a longer write-up fills, two big rooms to the foot
    const L = D.listing, F = ((D.companion || {}).flyer || {}).front || {}, K = (D.sw || {}).front || {};
    const M = 36, CW = 540, heroId = F.hero || K.hero || 'front', FOOT = 774;
    let h = '';
    const addr = FXS.scriptLine(((SW.data().listing || {}).address) || L.address, M, 14, CW, 63, 40, 'address', {lh: 1.22});
    h += addr.html;
    let y = 14 + addr.lh + 4;
    const hood = FXS.hood(L), city = `${L.city}, ${/^texas$/i.test(L.state) ? 'TEXAS' : L.state} ${L.zip || ''}`.trim();
    h += `<div class="abs" style="left:${M}pt;top:${y}pt;width:${CW}pt;height:26pt;display:flex;align-items:center;gap:13pt;white-space:nowrap"><span data-slot="hood" data-lines="1" style="font:500 19.5pt/1 var(--fx-display);letter-spacing:3.75pt;color:var(--fx-ink)">${esc(String(hood || L.city).toUpperCase())}</span><span style="width:2.25pt;height:16pt;background:var(--fx-accent)"></span><span data-slot="place" data-lines="1" style="font:500 10.5pt/1 var(--fx-font);letter-spacing:2.25pt;color:var(--fx-mute)">${esc(city.toUpperCase())}</span></div>`;
    y += 36;
    const PX = -9, PW = M + 444 - PX, TX = M + 444 + 13.5, TW = M + CW - TX;
    let ph = 336; while(ph > 292 && !SW.fits(D, heroId, PW, ph)) ph -= 4;
    h += FXS.box(D, heroId, PX, y, PW, ph, 'front.house');
    h += FXS.tiles(FXS.statItems(L).slice(0, 4), TX, y, TW, ph, 9.75, 'fact', {max: 30});
    y += ph + 14;
    const head = F.head || (K.cover || {}).head || '';
    if(head){ const hs = FXS.fitSize(head, "font-family:Montserrat;font-weight:600", CW, 21, 15); h += `<div class="abs" style="left:${M}pt;top:${y}pt;width:${CW}pt;height:${hs*1.4}pt;font:600 ${hs}pt/${hs*1.4}pt var(--fx-font);color:var(--fx-ink);white-space:nowrap;overflow:hidden" data-slot="front.head" data-lines="1">${esc(head)}</div>`; y += hs*1.4 + 6; }
    const rooms = FXS.coverRooms(D).slice(0, 2), rowH = rooms.length === 2 ? 128 : 0, rowY = FOOT - rowH;
    const lh = 18.5, FACT = o.noFacts ? 0 : 26, wuBottom = (rowH ? rowY - 14 : FOOT) - FACT, nL = Math.max(3, Math.floor((wuBottom - y)/lh));
    const tr2 = []; for(let t = nL; t >= Math.max(3, nL - 2); t--) tr2.push(t);
    h += `<div class="abs wu" data-slot="front.summary" data-lines="${nL}" data-try="${tr2.join(',')}" data-lh="${lh}" ${sd(o.intro || F.intro || (K.summary) || [])} style="left:${M}pt;top:${y}pt;width:${CW}pt;height:${nL*lh}pt;font-size:12pt;line-height:${lh}pt"></div>`;
    const factY = (rowH ? rowY - 14 : FOOT) - 18;
    if(FACT){ const cv = JSON.stringify(o.intro || F.intro || K.summary || '').toLowerCase(), SF = FXS.sellingFacts(D), key = t => t.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3 && !/with|built|stories|bedrooms|square|feet/.test(w));
      const facts = SF.inside.concat(SF.outside).filter(t => !key(t).some(w => cv.includes(w.replace(/s$/, '')))).sort((p, q) => p.length - q.length);
      const fw = t => FXS.width(t.toUpperCase(), 'font-family:Montserrat;font-weight:600;font-size:8.75pt;letter-spacing:1.75pt') + 18; let used = 0; const keep = []; facts.forEach(t => { if(used + fw(t) <= CW && keep.length < 4){ keep.push(t); used += fw(t); } }); facts.length = 0; keep.forEach(t => facts.push(t));
      if(facts.length) h += `<div class="abs" style="left:${M}pt;top:${factY}pt;width:${CW}pt;height:14pt;display:flex;gap:10pt;align-items:center;white-space:nowrap;overflow:hidden;font:600 8.75pt/14pt var(--fx-font);letter-spacing:1.75pt;text-transform:uppercase;color:var(--fx-ink)" data-slot="front.facts" data-role="cvfacts" data-lines="1">${facts.map(t => esc(t)).join('<i style="width:4pt;height:4pt;background:var(--fx-accent);flex:none"></i>')}</div>`; }
    if(rowH){ h += `<div class="gold" data-role="cvgold" style="left:${M}pt;top:${rowY - 9}pt;width:${CW}pt"></div>`;
      const rw = (CW - 12)/2; rooms.forEach((id, i) => { h += FXS.box(D, id, M + i*(rw + 12), rowY, rw, rowH, 'front.room' + i).replace('<div class="abs"', '<div class="abs" data-role="coverroom"'); }); }
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
    const note = (D.plan.source || 'The listing floor plan, placed as given.') + ' All measurements are approximate.' + ((r.angle === 90 || r.angle === 270) ? ' Turned on its side.' : '');
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

  // room-size tiles: red blocks, the size in condensed numerals (feet only) over the room name
  // size tiles belong to the room in the photo beside them: only that photo's rooms, and a size shows once across the spread
  const ROOMRE = {family: /family|living|great|dining/i, living: /family|living|great|dining/i, great: /family|living|great|dining/i, openplan: /kitchen|dining|family|living|great/i, dining: /dining/i, kitchen: /kitchen/i, bar: /kitchen|bar/i, nook: /nook|kitchen/i,
    primary: /primary.*(bed|suite)|primary$|owner/i, pbath: /primary.*bath|master.*bath/i, game: /game|flex|media/i, bed: /bedroom|bed\b/i, bath: /bath/i, study: /study|office/i, flex: /flex|study|office/i, deck: /deck|patio/i, patio: /patio/i, balcony: /balcony/i, laundry: /laundry/i, closet: /closet/i, foyer: /foyer|entry/i, stair: /stair/i};
  FXS.roomRe = id => { const base = String(id).toLowerCase().replace(/\d+[a-z]?$/, ''); return ROOMRE[base] || ROOMRE[Object.keys(ROOMRE).find(k => base.startsWith(k))]; };
  FXS.sizeUsed = FXS.sizeUsed || new Map();
  FXS.roomSizes = (L, photoId, peek) => { const re = FXS.roomRe(photoId), out = []; if(!re) return out;
    (L.rooms || []).forEach(r => { const m = /^\s*(\d+(?:\.\d+)?)\s*['’′]?\s*[x×]\s*(\d+(?:\.\d+)?)/i.exec(String(r.size || '')); if(!m || !re.test(String(r.name))) return;
      const n = `${m[1]}' x ${m[2]}'`; if((FXS.sizeUsed.has(n) && FXS.sizeUsed.get(n) !== photoId) || out.some(o => o.n === n)) return; out.push({n, l: String(r.name).toUpperCase(), photo: photoId}); });
    if(!peek) out.slice(0, 3).forEach(o => FXS.sizeUsed.set(o.n, photoId)); return out.slice(0, 3); };
  FXS.roomTiles = (rooms, x, y, w, h, gap, slot) => { const n = rooms.length, th = (h - gap*(n - 1))/n;
    return rooms.map((r, i) => { const ns = FXS.fitSize(r.n, "font-family:Oswald;font-weight:500", w - 14, Math.min(24, th*.42), 16), ls = FXS.fitSize(r.l, "font-family:Montserrat;font-weight:600;letter-spacing:1.2pt", w - 12, 8.5, 8);
      return `<div class="tile" data-tile-photo="${esc(r.photo || '')}" style="left:${x}pt;top:${y + i*(th + gap)}pt;width:${w}pt;height:${th}pt"><div class="tn" style="font-size:${ns}pt" data-small="1" data-slot="${slot}.${i}" data-lines="1">${esc(r.n)}</div><div class="tl" style="font-size:${ls}pt;letter-spacing:1.2pt" data-slot="${slot}.${i}.l" data-lines="1">${esc(r.l)}</div></div>`; }).join(''); };
  // the page title: red condensed caps with a heavy underline, the address small and right
  FXS.titleRow = (title, L, slot, y0) => { y0 = y0 == null ? 12 : y0; const M = 36, CW = 540, ts = FXS.fitSize(String(title).toUpperCase(), "font-family:Oswald;font-weight:500;letter-spacing:.7pt", CW - 250, 46, 28), lh = ts*1.2;
    const addr = String(((SW.data().listing || {}).address) || L.address).toUpperCase(), place = `${L.city}, ${/^texas$/i.test(L.state) ? 'TX' : L.state} ${L.zip || ''}`.toUpperCase().trim();
    return {bottom: y0 + lh + 8, html: `<div class="abs script" style="left:${M}pt;top:${y0}pt;width:${CW - 240}pt;height:${lh}pt;font-size:${ts}pt;line-height:${lh}pt;overflow:visible;text-decoration:underline;text-decoration-thickness:3pt;text-underline-offset:6pt" data-slot="${slot}.title" data-lines="1">${esc(String(title).toUpperCase())}</div>
      <div class="abs" style="left:${M + CW - 236}pt;top:${y0 + lh*.28}pt;width:236pt;text-align:right;font:600 9.75pt/13.5pt var(--fx-font);letter-spacing:3pt;color:var(--fx-ink);white-space:nowrap;overflow:hidden" data-slot="address" data-lines="1">${esc(addr)}</div>
      <div class="abs" style="left:${M + CW - 236}pt;top:${y0 + lh*.28 + 17}pt;width:236pt;text-align:right;font:400 9pt/12pt var(--fx-font);letter-spacing:2.25pt;color:var(--fx-mute);white-space:nowrap;overflow:hidden" data-slot="place" data-lines="1">${esc(place)}</div>`}; };

  // ---------- the back (also the flyer back): THE DETAILS, the plan or a room with size tiles, outdoor photos, two red boxes, the agent ----------
  FXS.back = (D, o) => { o = o || {};
    const L = D.listing, A = D.agent || {}, b = D.brand || {}, hasPlan = !!D.plan, M = 36, CW = 540;
    const F = (D.companion || {}).flyer || {}, FB = F.back || {}, KB = (D.sw || {}).back || {};
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    const used = [(((D.sw||{}).front||{}).hero) || 'front'].concat(o.avoid || []);
    const first = (hasPlan ? FB.photos : (FB.photosNoplan || FB.photos)) || [];
    const all = FXS.cards(D, first), issues = [];
    const SF = FXS.sellingFacts(D), near = (FB.nearby || KB.nearby || []).slice(0, 3).map(FXS.nearText);
    const covTxt = JSON.stringify(o.coverText || ''), c1 = SF.inside.filter(t => !(/garage/i.test(t) && /garage/i.test(covTxt))).slice(0, 7);
    const rowsN = hasPlan ? 4 : Math.min(7, Math.max(5, c1.length, Math.min(7, SF.outside.length + near.length)));
    const c2 = SF.outside.slice(0, rowsN - near.length).concat(near);
    const rowH = 18, cardH = 40 + rowsN*rowH + 8, bottomOfCards = 668, cardsTop = bottomOfCards - 12 - cardH;
    const CAPL = hasPlan ? 2 : 3, w3 = (CW - 24)/3, capBlock = 25 + CAPL*12.5;
    const stripPick = (ph, w) => FXS.pick(D, all, 6, {avoid: used, exactAvoid: true, outdoor: true, house: true}).filter(c => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, w, ph));
    let ph = 88, pick = [];
    for(const [n, p0] of [[3, 88], [2, 104], [1, 176]]){ const w = (CW - (n - 1)*12)/n, pk = stripPick(p0, w).slice(0, n); if(pk.length === n){ pick = pk; ph = p0; break; } }
    if(!pick.length){ pick = stripPick(176, CW).slice(0, 1); ph = 176; }
    const nS = Math.max(1, pick.length), wS = (CW - (nS - 1)*12)/nS;
    const hd = FXS.titleRow('The details', L, 'back', 12), yMain = hd.bottom + 8;
    let h = hd.html, mainBottom;
    const aboutBlock = hasPlan ? 0 : 12 + 8 + 3*19.5 + 14;
    let ys = cardsTop - 14 - (ph + capBlock), avail = ys - 14 - yMain;
    let pc = null;
    if(hasPlan){ pc = FXS.planCard(D, M, yMain, CW, Math.max(130, avail - 40)); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; mainBottom = pc.bottom; ph = Math.max(ph, Math.min(150, Math.floor(cardsTop - 14 - capBlock - mainBottom - 14))); }
    else {
      // owner 11/7: the About write-up never runs under the photo strip. When a hero under 150 pt would be all that fits, the hero goes:
      // the write-up takes the top (5 lines) and the outdoor strip grows into the rest
      const noHero = avail - aboutBlock < 150, aLines = noHero ? 5 : 3, aboutH = 12 + 8 + aLines*19.5;
      let hh = Math.max(150, avail - aboutBlock);
      const rest = pick.length ? [] : [], PW = 417, TX = M + PW + 13.5, TW = M + CW - TX;
      const heroCards = noHero ? [] : FXS.cards(D, []).filter(c => !FXS.isHouse(D, c.photo) && !FXS.OUTSIDE.test(c.photo) && !used.includes(c.photo) && !pick.some(x => x.photo === c.photo) && !/bath|closet|laundry/.test(c.photo)).sort((p, q) => FXS.archScore(D, q.photo) - FXS.archScore(D, p.photo));
      const hero = heroCards.find(c => FXS.roomSizes(L, c.photo, true).length) || heroCards[0];
      const rt = hero ? FXS.roomSizes(L, hero.photo) : [], pw0 = rt.length ? PW : CW;
      if(hero){ h += FXS.box(D, hero.photo, M, yMain, pw0, hh, 'back.hero'); }
      if(rt.length) h += FXS.roomTiles(rt, TX, yMain, TW, hh, 9, 'back.room');
      mainBottom = hero ? yMain + hh : yMain - 14 + 4;
      const capS = [].concat(...pick.map(c => [].concat(...(c.s || []).map(x => [].concat(x))))), shownT = JSON.stringify([c1, c2, capS]), aboutS = [].concat(...(FB.floors || []).map(f => f.s)).filter(x => !capS.some(t => [].concat(x).some(a => SW.sameFact(a, t)))).filter(x => !(/garage/i.test(JSON.stringify(x)) && /garage/i.test(shownT))), ay = mainBottom + 14;   // the About write-up never says what a strip caption says
      h += `<div class="abs" style="left:${M}pt;top:${ay}pt;width:${CW}pt;height:${aboutH}pt"><div style="height:12pt;margin-bottom:8pt">${FXS.label('About the house', 'back.about.label')}</div><div class="wu" data-slot="back.about" data-lines="${aLines}" data-try="${noHero ? '5,4' : '3'}" data-lh="19.5" ${sd(aboutS)} style="width:${CW}pt;height:${aLines*19.5}pt;font-size:12pt;line-height:19.5pt"></div></div>`;
      if(noHero) ph = Math.max(ph, Math.floor(cardsTop - 14 - capBlock - (ay + aboutH + 14)));
      window.backHero = hero && hero.photo;
    }
    ys = cardsTop - 14 - (ph + capBlock);
    pick.forEach((c, i) => { h += FXS.captioned(D, c, M + i*(wS + 12), ys, wS, ph, CAPL, 'back.photo' + i, {narrow: 12, fs: 9, lh: 12.5}); });
    // ---- the two red boxes
    const rw = (CW - 14)/2, bx = [M, M + rw + 14], ctop = cardsTop;
    [['Built new and updated', c1, 'back.updates'], ['Outside + close by', c2, 'back.outside']].forEach(([title, list, slot], i) => {
      h += `<div class="card" style="left:${bx[i]}pt;top:${ctop}pt;width:${rw}pt;height:${cardH}pt"></div>`;
      h += `<div class="abs" style="left:${bx[i] + 16}pt;top:${ctop + 14}pt">${FXS.label(title, slot + '.title')}</div>`;
      h += FXS.bullets(list, bx[i] + 16, ctop + 38, rw - 28, rowH, slot, rowsN, 10).html;
    });
    h += ContactCard.html([M, bottomOfCards + 15, CW, 76], Object.assign({}, A, {headshot: hsSrc}), Object.assign({}, b, {logo: b.logo}), {layout: 'panel', size: 'mid', fine: '', bottomGap: 0.5, fieldAccent: true});
    h += `<div class="abs fine" style="left:${M}pt;top:${bottomOfCards + 95}pt;width:${CW}pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">Information deemed reliable but not guaranteed.</div>`;
    return {html: h, issues};
  };

  // kicker label + a one-line title + an intro of whole sentences; returns {html, bottom}
  FXS.pageHead = (kicker, title, intro, slot, lines, y0) => { const M = 36, CW = 540, Y0 = y0 == null ? 30 : y0;
    const ts = FXS.fitSize(String(title).toUpperCase(), "font-family:'Oswald';font-weight:500;letter-spacing:.7pt", CW, 36, 24), lh = 19.5, tr = []; for(let t = lines; t >= 3; t--) tr.push(t);
    const ty = Y0 + 20, iy = ty + ts*1.2 + 8;
    return {html: `<div class="abs" style="left:${M}pt;top:${Y0}pt">${FXS.label(kicker, slot + '.kicker')}</div>
      <div class="abs script" style="left:${M}pt;top:${ty}pt;width:${CW}pt;height:${ts*1.2}pt;font-size:${ts}pt;line-height:${ts*1.2}pt" data-slot="${slot}.title" data-lines="1">${esc(String(title).toUpperCase())}</div>
      <div class="abs wu" data-slot="${slot}.intro" data-lines="${lines}" data-try="${tr.join(',')}" data-lh="${lh}" ${sd(intro)} style="left:${M}pt;top:${iy}pt;width:${CW}pt;height:${lines*lh}pt;font-size:12pt;line-height:${lh}pt"></div>`, bottom: iy + lines*lh}; };


  // ---------- checks added after the fxs-14 review ----------
  // (1) off-page: no text or card runs past the trim, and on a flyer or fold-over panel none sits in the bottom 0.25 in margin
  // (2) no fact twice on one face: any two sentences on one face of a piece that say the same thing (same_fact, short sentences too)
  // (3) no address line ends (or starts) with a hanging separator dot
  // (4) a wide or GBP social never shows two photos of the same room (room_group)
  SW.faceChecks = () => { const out = [];
    // (5) a stat label never reads plain "BATHS" unless the count has a half ("3½"): it is "FULL BATHS" (BD.bathsText)
    document.querySelectorAll('.tile:not([data-tile-photo]), .stats .s').forEach(el => { const t = String(el.textContent).replace(/\s+/g, ' ').trim(); if(/BATHS?$/i.test(t) && !/full/i.test(t) && !/\u00bd|1\/2/.test(t)) out.push({slot: el.querySelector('[data-slot]') ? el.querySelector('[data-slot]').dataset.slot : 'stat', kind: 'baths-label-without-half', detail: `"${t}" must read FULL BATHS (BATHS only after a half bath)`}); });
    // (5b) a stat tile never clips its text: every line of the numeral and the label sits inside the tile (all pieces, the social row included)
    document.querySelectorAll('.tile, .stats .s').forEach(el => { const r = el.getBoundingClientRect(); if(!r.width) return;
      [...el.querySelectorAll('span, div')].forEach(c => { if(!String(c.textContent).trim() || c.children.length && c.querySelector('span, div')) return; const q = c.getBoundingClientRect();
        if(q.top < r.top - .5 || q.bottom > r.bottom + .5 || q.left < r.left - .5 || q.right > r.right + .5) out.push({slot: (c.closest('[data-slot]') || c).dataset.slot || 'stat', kind: 'tile-text-clipped', detail: `"${String(c.textContent).trim()}" runs outside its stat tile`}); }); });
    // (6) a size tile sits beside its own room's photo; no size repeats across the spread
    { const sizes = new Map(); document.querySelectorAll('.tile[data-tile-photo]').forEach(el => { const id = el.dataset.tilePhoto, re = FXS.roomRe && FXS.roomRe(id), lab = (el.querySelector('.tl') || {}).textContent || '', n = (el.querySelector('.tn') || {}).textContent || '';
        if(!re || !re.test(lab)) out.push({slot: 'size-tile', kind: 'size-tile-not-own-room', detail: `${n} ${lab} is not a room in the ${id} photo`});
        if(sizes.has(n)) out.push({slot: 'size-tile', kind: 'size-repeated-on-spread', detail: `${n} shows twice (${sizes.get(n)} and ${lab})`}); else sizes.set(n, lab); }); }
    const faces = [...document.querySelectorAll('.panel')];
    const roots = faces.length ? faces : [...document.querySelectorAll('.sheet, .page')].filter((e, i, a) => !a.some(o => o !== e && o.contains(e)));
    roots.forEach(root => { const rr = root.getBoundingClientRect(), tag = root.dataset.page || root.className, bottomMargin = root.classList.contains('panel') || /flyer/.test((SW.data().piece || {}).id || '') ? 18/.75 : 0;
      const items = [...root.querySelectorAll('[data-slot], .cc, .vt')].filter(el => !el.querySelector('[data-slot]') || el.classList.contains('cc'));
      items.forEach(el => { const r = el.getBoundingClientRect(); if(!r.width || !r.height) return;
        if(r.right > rr.right + 1 || r.bottom > rr.bottom + 1 || r.left < rr.left - 1 || r.top < rr.top - 1) out.push({slot: el.dataset.slot || el.className, kind: 'off-page', detail: `${el.dataset.slot || el.className} runs past the trim of ${tag}`});
        else if(bottomMargin && r.bottom > rr.bottom - bottomMargin + 1) out.push({slot: el.dataset.slot || el.className, kind: 'off-page', detail: `${el.dataset.slot || el.className} sits in the bottom margin of ${tag}`}); });
      const sents = []; items.forEach(el => { if(/agent|broker|fine|logo|\.title|\.kicker/.test(el.dataset.slot || '') || el.classList.contains('cc')) return;
        SW.sentences(el.textContent).filter(x => /[.!?]$/.test(x) && cw(x).size >= 2 && x.split(/\s+/).length >= 3).forEach(x => sents.push([x, el.dataset.slot || el.className])); });
      for(let i = 0; i < sents.length; i++) for(let j = i + 1; j < sents.length; j++) if(sents[i][1] !== sents[j][1] && Math.min(cw(sents[i][0]).size, cw(sents[j][0]).size) >= 3 && SW.sameFact(sents[i][0], sents[j][0])) { out.push({slot: sents[j][1], kind: 'same-fact-on-face', detail: `"${sents[i][0].slice(0, 110)}" (${sents[i][1]}) and "${sents[j][0].slice(0, 110)}" say the same thing`}); i = sents.length; break; } 
      items.forEach(el => { const t = String(el.textContent).trim(); if(/(^|\s)[·•|\-,]$/.test(t) || /^[·•|]\s/.test(t)) out.push({slot: el.dataset.slot || el.className, kind: 'hanging-separator', detail: `"${t.slice(-20)}" ends with a separator`}); });
      const pg = [...root.querySelectorAll('.ph[data-photo]')].map(e => e.dataset.photo), shape = ((SW.data().piece || {}).shape);
      if((shape === 'wide' || shape === 'gbp') && window.FXP && FXP.roomGroup) { const g = {}; pg.forEach(id => { const k = FXP.roomGroup(id); if(g[k] && g[k] !== id) out.push({slot: 'wide.photos', kind: 'wide-same-room', detail: `${id} and ${g[k]} are the same room`}); g[k] = id; }); }
    });
    return out; };

  // a caption pool never repeats a fact that an earlier block on the face already says (any alternative of it): used before fill
  SW.alts = x => [].concat(x);
  SW.dropRepeats = (cards, earlier, minKeep) => { const seen = (earlier || []).slice(); return cards.map(c => { const keep = (c.s || []).filter(x => !SW.alts(x).some(a => seen.some(t => SW.sameFact(a, t)))); const use = keep.length >= (minKeep || 2) ? keep : (c.s || []);
      use.forEach(x => seen.push(SW.alts(x)[0])); return Object.assign({}, c, {s: use}); }); };
  SW.pruneIntro = (list, avoid) => (list || []).map(x => Array.isArray(x) ? x.filter(a => !avoid.some(t => SW.sameFact(a, t))) : x).filter(x => Array.isArray(x) ? x.length : !avoid.some(t => SW.sameFact(x, t)));
  SW.flat = o => { const out = []; const w = v => { if(typeof v === 'string') out.push(v); else if(Array.isArray(v)) v.forEach(w); }; w(o); return out; };

  // pages that run through OHL / FXP (Open House flyer, email, socials): the repeated-phrase and duplicate-sentence checks ride on their brochureCheck
  FXS.repCheck = () => { const out = [], seenS = new Map();
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return;
      const sf = SW.sameFactIn(el.textContent); if(sf) out.push({slot: el.dataset.slot, kind: 'same-fact-twice', detail: `"${sf[0].slice(0, 50)}" and "${sf[1].slice(0, 50)}" say the same thing`});
      const txt = String(el.textContent), r = SW.rep5(txt); if(r) out.push({slot: el.dataset.slot, kind: 'repeated-phrase', detail: `"${r}" repeats in one block`});
      txt.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x.length >= 28).forEach(x => { const k = x.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 48), prev = seenS.get(k);
        if(prev && prev !== el.dataset.slot) out.push({slot: el.dataset.slot, kind: 'duplicate-sentence', detail: `"${x.slice(0, 60)}" also in ${prev}`}); else seenS.set(k, el.dataset.slot); }); });
    return out.concat(SW.faceChecks()); };
  FXS.hookCheck = () => { let bc = null; Object.defineProperty(window, 'brochureCheck', {configurable: true, get: () => bc, set: v => { bc = typeof v === 'function' ? (() => v().concat(FXS.repCheck())) : v; }}); };
  window.SW = SW; window.FXS = SW;
})();
