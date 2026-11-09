/* fxs-14 helpers (ported from the swatchbook set's swatchbook.js, FX14 look): data, photos, captions and paragraphs that fill their boxes, logos, print checks, the set's tokens (FXS.tok, read from fxs14.css) and marks (icons, arch).

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
  // mirrors scripts/fxsets/spaces.py: the physical space of every sample photo; a fold-over (all four panels) and a flyer (both sides) show each space once
  SW.SPACES = {'1-story': {backyard: ['patio', 'yard'], front: ['front', 'front2'], kitchen: ['kitchen', 'kitchen2'], living: ['living', 'openplan'], primarybath: ['bath', 'shower']},
    '2-story': {backyard: ['deck', 'patio', 'pergola', 'evening', 'fence'], front: ['front', 'front2'], living: ['family', 'family2', 'wine'], dining: ['dining', 'dining2'], game: ['game', 'game2', 'game3'], primary: ['primary', 'primary2'], primarybath: ['pbath', 'pbath2'], bed2: ['bed2', 'bed2b'], kitchen: ['kitchen', 'kitchen2'], entry: ['foyer', 'stair']},
    '3-story': {balcony: ['balcony', 'balcony2'], sidewalk: ['entry', 'walk'], backyard: ['yard', 'yard2'], kitchen: ['kitchen', 'kitchen2', 'kitchen3'], living: ['family', 'openplan', 'ceiling'], primary: ['primary', 'primary2'], primarybath: ['pbath', 'pbath2'], game: ['game', 'game2']},
    '4-story': {rooftop: ['terrace', 'terrace2', 'skyline'], park: ['park', 'gazebo'], living: ['living', 'living2', 'living3', 'living4'], kitchen: ['kitchen', 'kitchen2'], primary: ['primary', 'primary2'], primarybath: ['pbath', 'pbath2'], bed2: ['bed2', 'bed2b'], bath2: ['bath2', 'bath2b']}};
  SW.space = (D, id) => { const st = (String(D.version || '').match(/^\d-story/) || ['2-story'])[0], m = SW.SPACES[st] || {}; for(const k in m) if(m[k].includes(id)) return k; return String(id).replace(/(?<=\d)b$/, ''); };
  SW.spaceRepeats = (D, ids) => { const seen = {}; ids.forEach(p => { (seen[SW.space(D, p)] = seen[SW.space(D, p)] || []).push(p); }); const al = ((D.sw || {}).plan || {}).allow || []; return Object.entries(seen).map(([k, ps]) => [k, ps.filter(p => !al.some(([a, b]) => b === p && ps.includes(a)))]).filter(([, ps]) => ps.length > 1); };   // the 1-story plan lists its allowed second views
  // mirrors carousel_copy.same_fact(): two sentences are one fact when 60% of the shorter one's content words are in the other
  const STOPW = new Set('a an the and of to from with in on at its it is are by for this that one two room its'.split(' '));
  const cwords = t => new Set((String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !STOPW.has(w)));
  SW.sameFact = (a, b) => { const wa = cwords(a), wb = cwords(b), small = Math.min(wa.size, wb.size); if(!small) return false; let n = 0; wa.forEach(w => { if(wb.has(w)) n++; }); return n/small >= (small <= 3 ? .5 : .6); };   // exactly scripts/fxsets/carousel_copy.py same_fact
  // inside one caption or paragraph a noun phrase is not said twice either ('granite counters ... granite counters')
  const bigrams = t => { const w = [...cwords(t)], s = new Set(); String(t).toLowerCase().match(/[a-z0-9'-]+/g)?.filter(x => !STOPW.has(x)).forEach((x, q, arr) => { if(q) s.add(arr[q - 1] + ' ' + x); }); return s; };
  SW.sharedPhrase = (a, b) => { const A = bigrams(a), B = bigrams(b); for(const x of A) if(B.has(x)) return true; return false; };
  // the first pair of sentences in a text that are one fact in different words ('' when none); a label of one or two words never counts
  SW.sentences = (t, lead) => { let s = String(t).trim(); if(lead && s.startsWith(lead)) s = s.slice(lead.length).trim(); const out = s.split(/(?<=[.!?])\s+|\s+·\s+/).map(x => x.trim()).filter(x => cwords(x).size >= 1); if(!lead && out.length > 1 && cwords(out[0]).size <= 2) out.shift();   /* a bare room label ('Living area.') is not a fact */ return out; };
  SW.sameFactIn = (t, lead) => { const ss = SW.sentences(t, lead); for(let i = 0; i < ss.length; i++) for(let k = i + 1; k < ss.length; k++) if(SW.sameFact(ss[i], ss[k]) || SW.sharedPhrase(ss[i], ss[k])) return ss[i] + ' / ' + ss[k]; return ''; };
  // a pool of sentences: no sentence twice, and no sentence that shares a 5-word phrase with an earlier one
  SW.dedupe5 = list => { const out = [], grams = new Set();
    (list || []).forEach(t => { const w = words5(t), gs = []; for(let i = 0; i + 5 <= w.length; i++) gs.push(w.slice(i, i + 5).join(' '));
      if(out.some(u => String(u).toLowerCase().slice(0, 28) === String(t).toLowerCase().slice(0, 28) || SW.sameFact(u, t) || SW.sharedPhrase(u, t)) || gs.some(g => grams.has(g))) return;
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
    const last = lines[lines.length-1], right = el.getBoundingClientRect().right;
    return {n: lines.length, fill: last ? (last.r-last.l)/box : 0, min: lines.length > 1 ? Math.min(...lines.slice(0, -1).map(l => (l.r - l.l)/box)) : 1, gap: lines.length > 1 ? (right - Math.max(...lines.slice(0, -1).map(l => l.r)))*0.75 : 0};   // gap: how far (pt) the longest full line stops short of the box edge
  };
  SW.textWidth = el => { const r = document.createRange(); r.selectNodeContents(el); return pt(r.getBoundingClientRect().width); };
  const html = (lead, sents) => (lead ? `<b>${esc(lead)}</b> ` : '') + esc(sents.join(' '));
  // The sets of whole sentences (the first always stays) that set in exactly T lines with the last line 3/4 full or more.
  // Returns {pick, fill} (fewest sentences first), or null with el.dataset.diag saying how close the pool came.
  // a room size (16' x 12') only ever stands beside its own photo, once on the spread; and no filler line
  SW.SIZE = /\d+'(?:\s*\d+")?\s*x\s*\d+'(?:\s*\d+")?/g;
  SW.FILLER = /natural light fills|neutral finishes keep|fresh paint and new light/i;
  const hasSize = a => { SW.SIZE.lastIndex = 0; return SW.SIZE.test(a); };
  // a fact printed as a fact (beds, baths, square feet, stories, garage spaces) is never said again in a paragraph on the same piece, nor in a second paragraph
  const FACTS = new Map();   // face -> Set of facts already stated
  const factsOf = a => (window.FactRepeat ? FactRepeat.facts(a) : []);
  const factSet = el => { const f = document.body; if(!FACTS.has(f)){ const s = new Set(); f.querySelectorAll('[data-slot]').forEach(e => { if(e.dataset.s != null || e.querySelector('[data-s]')) return; (window.FactRepeat ? FactRepeat.facts(e.textContent, {shown: true}) : []).forEach(x => s.add(x)); }); FACTS.set(f, s); } return FACTS.get(f); };
  // a caption is about its own room: the game room never talks about the laundry closet or the stair
  SW.roomBan = (room, a) => { const r = String(room || '').toLowerCase(); if(/laundry|utility/.test(r)) return false;
    if(/laundry|washer|dryer/i.test(a)) return true;
    if(/game/.test(r) && /closet/i.test(a)) return true;
    return false; };
  // a caption is about its own room: the game room never talks about the laundry closet or the stair
  SW.roomBan = (room, a) => { const r = String(room || '').toLowerCase(); if(/laundry|utility/.test(r)) return false;
    if(/laundry|washer|dryer/i.test(a)) return true;
    if(/game/.test(r) && /closet|stair/i.test(a)) return true;
    return false; };
  const PLACED = new Map();   // face -> [{el, s}]: the sentences already set, so no block says the same fact again
  const faceOf = el => el.closest('.panel, .sheet') || document.body;
  const isCap = el => !!el.dataset.lead || !!el.closest('.cap');
  const banned = (el, a) => isCap(el) && (PLACED.get(faceOf(el)) || []).some(p => p.el !== el && (p.box ? p.s === a : SW.sameFact(p.s, a)));   // a box's facts too (the caption-repeats-box check, 11/8)   // photo captions only: no two captions on a face say one fact
  const pickFor = (el, T) => {
    // each sentence is a string, or a list of ways to say the same fact at different lengths (only one is ever used)
    let S = JSON.parse(el.dataset.s).map(x => [].concat(x)); const S0 = S; const FS = factSet(el); S = S.map(alts => alts.filter(a => !banned(el, a) && !hasSize(a) && !SW.FILLER.test(a) && !SW.roomBan(el.dataset.lead || el.dataset.room, a) && !factsOf(a).some(x => FS.has(x)))).filter(alts => alts.length); if(!S.length) S = S0;
    const lead = el.dataset.lead || '', n = Math.min(S.length, +el.dataset.pool || 12);   // data-pool: a long write-up may draw on more sentences (FXS-14 3- and 4-story flyer backs)
    let best = null, near = null, hi = null, lo = null, tries = 0;
    const full = S.map(a => a[0]);
    el.innerHTML = html(lead, full); const A = SW.lines(el), allLen = (lead ? lead.length + 1 : 0) + full.join(' ').length, cpl = allLen / Math.max(.5, A.n - 1 + A.fill);
    const lead0 = lead ? lead.length + 1 : 0;
    const test = pick => {
      const est = (lead0 + pick.join(' ').length) / cpl;   // the cheap length test first (same result, far faster on big pools)
      if(est < T - 1.5 || est > T + 0.9) return;
      if(SW.rep5((lead ? lead + ' ' : '') + pick.join(' ')) || SW.sameFactIn(pick.join(' '))) return;
      if(++tries > SW.PICK_BUDGET && best) return;   // and a hard stop when nothing fills (keeps a page under the renderer's 30 s)   // a big pool: once a set fills the box, stop laying out more after the budget (keeps a page under the renderer's 30 s)
      el.innerHTML = html(lead, pick);
      const L = SW.lines(el);
      if(L.n === T + 1 && (!hi || L.fill < hi.fill)) hi = {fill: L.fill};
      if(L.n === T - 1 && (!lo || L.fill > lo.fill)) lo = {fill: L.fill};
      if(L.n !== T) return;
      if(!near || L.fill > near.fill) near = {pick, fill: L.fill};
      if(L.fill < Math.max(0.76, +el.dataset.fill || 0)) return;   // data-fill: a write-up's own floor (0.9, owner 11/7-11/8)
      if(isCap(el) && L.gap > 5.5) return;
      if(el.dataset.lfill && L.min < +el.dataset.lfill) return;   // a justified write-up: every line already 80%+ full set ragged, so justifying never opens wide gaps   // a photo's description runs out to the photo's right edge (ragged right, never justified)
      const score = (L.fill >= 0.8 ? 1000 : 500) - pick.length * 10 + L.fill + (el.dataset.lfill ? 20*L.min : 0);   // the fewest, fullest sentences that fill the box; the last line well filled
      if(!best || score > best.score) best = {score, pick, fill: L.fill};
    };
    let leaves = 0, stop = false;
    const walk = (m, i, acc) => {
      if(stop) return;
      if(i === n){ if(++leaves > 3000000) stop = true; test(acc); return; }   // a big pool: a hard cap on sets looked at, so a page stays under the renderer's 30 s
      if(!(m >> i & 1)){ walk(m, i + 1, acc); return; }
      for(const alt of S[i]) walk(m, i + 1, acc.concat(alt));
    };
    for(let m = 1; m < (1 << n); m += 2) walk(m, 0, []);   // the first sentence always stays: it carries the point of the box
    if(!best && n > 1) for(let m = 2; m < (1 << n); m += 2) walk(m, 0, []);   // no set with it fills the box: the others are tried without it (a caption is about its photo, whichever true sentence leads)
    if(best) return best;
    el.dataset.diag = `best ${T} lines: ${near ? Math.round(near.fill*100) + '%' : 'none'}` + (hi ? `; ${T+1} lines min ${Math.round(hi.fill*100)}%` : '') + (lo ? `; ${T-1} lines max ${Math.round(lo.fill*100)}%` : '');
    el.__near = near;
    return null;
  };
  // Same as pickFor, and when the box's whole sentences cannot fill T lines at its width, the box narrows (6 pt steps, up to data-narrow steps, 8 by default;
  // text is left aligned, so a slightly shorter line is invisible) until a set of whole sentences does. Returns null (width restored) when none does.
  const pfN = (el, T) => {
    if(el.__pfMemo && el.__pfMemo.key === T + '|' + el.style.fontSize + '|' + el.style.width){ const m = el.__pfMemo; el.__pfMemo = null; return m.b; }   // settle right after the same search (SW.fill): reuse it
    const r = pfN0(el, T); el.__pfMemo = {key: T + '|' + el.style.fontSize + '|' + el.style.width, b: r}; return r; };
  const pfN0 = (el, T) => {
    if(el.dataset.w0 == null) el.dataset.w0 = el.getBoundingClientRect().width*.75;
    const base = +el.dataset.w0, maxK = el.dataset.narrow != null ? +el.dataset.narrow : 8;
    for(let k = 0; k <= maxK; k++){ el.style.width = (base - k*(+el.dataset.nstep || 6)) + 'pt'; const b = pickFor(el, T); if(b) return b; }
    el.style.width = base + 'pt'; return maxK === 0 ? null : pickFor(el, T);   // no narrowing allowed: the one search already ran
  };
  SW.PICK_BUDGET = 1500;
  SW.pfN = pfN;   // FO.grow re-picks a write-up's sentences at a bigger size (fxs14-fo.js)
  const LH = 12.5, CAPPAD = 5;
  SW.resetFill = () => { PLACED.clear(); FACTS.clear(); };
  SW.fill = () => {
    const issues = [];
    document.querySelectorAll('[data-s]').forEach(e => { e.dataset.fixed = '1'; });
    const caps = [...document.querySelectorAll('.cap .a[data-s]')], rest = [...document.querySelectorAll('[data-s]')].filter(e => !caps.includes(e));
    const settle = (el, T) => {   // T lines: the best set, else the nearest and a report
      const lead = el.dataset.lead || '', b = pfN(el, T); el.__pfMemo = null;
      if(b){ el.innerHTML = html(lead, b.pick); delete el.dataset.diag; factsOf(b.pick.join(' ')).forEach(x => factSet(el).add(x));
      { const pl = PLACED.get(faceOf(el)) || []; pl.push(...b.pick.map(s => ({el, s, box: !isCap(el)}))); PLACED.set(faceOf(el), pl); } }   // every filled block (the boxes too) counts: a photo caption never repeats a fact the face already says
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
        if(el.dataset.justify) el.style.textAlign = 'justify';
      } else settle(el, +el.dataset.lines || 1);
    });
    // a labeled-items table (*.box.t<N>): every row runs as many full lines as the rest of its table (owner 11/8/2026, FXS-09 r4; check: _shared/tablerows.js).
    // Only a short row is touched: it re-picks its true sentences at the table's count, narrowing in finer 2 pt steps; rows that already match stay as they are.
    { const T = new Map(); rest.forEach(el => { const m = /^(.*\.box)\.t\d+$/.exec(el.dataset.slot || ''); if(m && el.dataset.try) (T.get(m[1]) || T.set(m[1], []).get(m[1])).push(el); });
      T.forEach(rows => { if(rows.length < 2) return; const most = Math.max(...rows.map(e => SW.lines(e).n));
        rows.filter(e => SW.lines(e).n < most).forEach(e => { const n0 = e.dataset.narrow, s0 = e.dataset.nstep;
          e.dataset.nstep = 2; e.dataset.narrow = e.dataset.j3 ? 0 : Math.round((+e.dataset.w0 || 0) * 0.45 / 2);   // a full-width write-up (FO.prep3) never narrows   // the row may narrow to 55% of its column (ragged right, so a narrower row still reads as part of the grid)
          if(pfN(e, most)){ settle(e, most); if(e.dataset.lh) e.style.height = (most * +e.dataset.lh) + 'pt'; }
          else { e.dataset.narrow = n0; if(s0 == null) delete e.dataset.nstep; else e.dataset.nstep = s0; settle(e, +e.dataset.lines); } }); }); }
    // photo captions shrink to what their sentences honestly fill (never padded): the photo takes the room. The captions in one row share a line count when they can.
    const groups = new Map();
    const faces = [...document.querySelectorAll('.panel, .sheet')];
    caps.forEach(el => { const g = el.closest('.row') || (faces.indexOf(faceOf(el)) + '|' + Math.round(el.getBoundingClientRect().top/8)); (groups.get(g) || groups.set(g, []).get(g)).push(el); });
    groups.forEach(els => {
      const max = Math.max(...els.map(e => +e.dataset.lines));
      let chosen = null;
      const mn = Math.max(...els.map(e => +e.dataset.min || 2));
      for(let T = max; T >= mn && !chosen; T--) if(els.every(e => pfN(e, T))) chosen = T;
      els.forEach(e => {
        const lead = e.dataset.lead || '';
        let T = chosen;
        if(!T){   // no common count: this one alone, at the count it fills best (or comes closest to)
          let bestNear = null;
          for(let t = max; t >= (+e.dataset.min || 2) && !T; t--){ if(pfN(e, t)) T = t; else if(e.__near && (!bestNear || e.__near.fill > bestNear.fill)) bestNear = {t, fill: e.__near.fill}; }
          if(!T) T = bestNear ? bestNear.t : (+e.dataset.min || 2);
        }
        settle(e, T);
      });
      const h = Math.max(...els.map(e => +e.dataset.lines));
      els.forEach(e => { const lh = +e.dataset.lh || LH; e.style.height = (+e.dataset.lines * lh) + 'pt'; });
      // a caption set a little narrower than its photo: the photo takes the caption's width, so the text runs out to the photo's right edge
      els.forEach(e => { const ph = document.querySelector('.ph[data-slot-photo="' + e.dataset.slot + '"]'); if(!ph || !e.style.width) return; const pb = ph.getBoundingClientRect(), eb = e.getBoundingClientRect();
        if(eb.top >= pb.bottom - 1 && Math.abs(eb.left - pb.left) < 2 && eb.width < pb.width - .5) ph.parentElement.style.width = e.style.width; });
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
    // the same photo twice on one page (or a near-duplicate: the same room or view under another number, review r2)
    const famOf = SW.famOf;
    document.querySelectorAll('.panel').forEach(pn => {
      const seen = new Map();
      pn.querySelectorAll('.ph[data-photo]').forEach(el => {
        const id = el.dataset.photo; if(!id) return;
        const key = famOf(id), prev = seen.get(key);
        if(prev && prev !== id && key === 'outdoor' && /^back\./.test(el.dataset.slotPhoto || '')){ /* the back is outdoor photos only: the deck and the deck at dusk are two views */ }
        else if(prev && prev !== id) issues.push({slot: el.dataset.slotPhoto || id, kind: 'near-duplicate-photo', detail: `${id} and ${prev} show the same room or view on one page`});
        else if(prev === id) issues.push({slot: el.dataset.slotPhoto || id, kind: 'duplicate-photo', detail: `${id} is on the page twice`});
        seen.set(key, id);
      });
    });
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return; const r = SW.rep5(el.textContent); if(r) issues.push({slot: el.dataset.slot, kind: 'repeated-phrase', detail: `"${r}" repeats in one block`}); const sf = el.dataset.fine ? '' : SW.sameFactIn(el.textContent, el.dataset.lead); if(sf) issues.push({slot: el.dataset.slot, kind: 'same-fact-twice', detail: sf.slice(0, 120)}); });
    // across the face: no two sentences in different captions, paragraphs, bullets or tag lines say one fact
    document.querySelectorAll('.panel, .sheet').forEach(pn => { const all = [];
      pn.querySelectorAll('[data-lead][data-s][data-slot], .cap .a[data-s][data-slot], [data-slot="front.summary"], [data-slot="front.tags"], [data-slot="front.more"], [data-slot^="front.hl."]').forEach(el => { if(!el.getClientRects().length) return; SW.sentences(el.textContent, el.dataset.lead).forEach(s => all.push({slot: el.dataset.slot, s})); });
      const seen = new Set(); for(let i = 0; i < all.length; i++) for(let k = i + 1; k < all.length; k++) if(all[i].slot !== all[k].slot && SW.sameFact(all[i].s, all[k].s)){ const key = all[i].slot + '|' + all[k].slot; if(seen.has(key)) continue; seen.add(key); issues.push({slot: all[k].slot, kind: 'same-fact-on-face', detail: `"${all[i].s.slice(0, 50)}" (${all[i].slot}) / "${all[k].s.slice(0, 50)}"`}); } });
    // the same sentence twice on one page of the piece
    document.querySelectorAll('.panel, .sheet').forEach(pn => { const seenS = new Map();
      pn.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return;
        String(el.textContent).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x.length >= 28).forEach(x => { const k = x.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 48), prev = seenS.get(k);
          if(prev && prev !== el.dataset.slot) issues.push({slot: el.dataset.slot, kind: 'duplicate-sentence', detail: `"${x.slice(0, 60)}" also in ${prev}`}); else seenS.set(k, el.dataset.slot); }); }); });
    // the agent footer (card, name, phone, fine print) sits inside the bottom margin of every panel: 0.35 in clear of the trim, never cut off
    document.querySelectorAll('.panel').forEach(pn => { const pr = pn.getBoundingClientRect(), lim = pr.bottom - 25.2*96/72; if(Math.abs(pr.height*72/96 - 792) > 2) return;
      pn.querySelectorAll('.cc, [data-slot^="agent."], [data-slot="fineprint"]').forEach(el => { if(!el.getClientRects().length) return; const r = el.getBoundingClientRect();
        if(r.bottom > lim + .5) issues.push({slot: el.dataset.slot || 'agent-card', kind: 'footer-off-page', detail: `bottom is ${((pr.bottom - r.bottom)*72/96/72).toFixed(2)} in above the trim (0.35 in needed)`}); }); });
    issues.push(...SW.sizeIssues(), ...SW.bathIssues(), ...SW.rowIssues(), ...SW.clearIssues(), ...SW.edgeIssues(), ...SW.inkIssues());
    // no photo number, QR, pin or listing price anywhere on the piece
    if(/\bqr\b|scan for/i.test(document.body.innerText)) issues.push({slot:'piece', kind:'qr-text'});
    if(window.ContactCard) issues.push(...ContactCard.check(document));
    if(window.IvoryPlan) issues.push(...IvoryPlan.check());
    return issues;
  };
  // one room whichever number it has (the fold-over's inside pages hold one photo per room): the outdoor shots are one room, pbath and shower one, family and living one, kitchen and bar one; bedroom 2 and bedroom 3 are two rooms
  // one physical space (scripts/fxsets/spaces.py): the checks for the same room or view on one page read the same table
  SW.famOf = id => SW.space(SW.data(), String(id));
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
    await Promise.all(['400 10pt Montserrat','500 10pt Montserrat','600 10pt Montserrat','700 10pt Montserrat','400 10pt "Pinyon Script"','400 10pt "Libre Baskerville"','700 10pt "Libre Baskerville"'].map(f => document.fonts.load(f)));
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


  // ---------- the set's tokens (fxs14-tokens.css is the one source) and marks ----------
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
  // the round seal: the house's own neighborhood in Cormorant over a tracked "HOUSTON, TEXAS" line; centered on (cx, cy), diameter d
  FXS.seal = (D, cx, cy, d, slot, o) => { o = o || {};
    const L = D.listing, name = FXS.hood(L) || L.city, sub = (o.sub || `${L.city}, ${L.state}`).toUpperCase();
    const inner = d*.8, css = "font-family:'Cormorant Garamond';font-weight:500";
    let s = d*.2, one = true;
    const fit = FXS.fitSize(name, css, inner, d*.2, d*.15);
    if(FXS.width(name, `${css};font-size:${fit}pt`) <= inner && fit >= d*.155) s = fit;
    else { one = false; const ws = name.split(/\s+/); s = Math.min(d*.19, ...ws.map(w => FXS.fitSize(w, css, inner, d*.19, 10))); }
    const subS = o.subSize || Math.max(6.5, Math.min(9, d*.055)), track = subS*.25, sub1 = FXS.fitSize(sub, `font-family:Montserrat;font-weight:600;letter-spacing:${track}pt`, inner, subS, 6.5);
    return `<div class="seal" data-slot="${slot || 'seal'}" style="left:${cx - d/2}pt;top:${cy - d/2}pt;width:${d}pt;height:${d}pt"><div class="nm" style="font-size:${s}pt;${one ? '' : `white-space:normal;line-height:1.22;width:${inner}pt`}" data-slot="${slot || 'seal'}.name" data-lines="${one ? 1 : name.split(/\s+/).length}">${esc(name)}</div>${o.noSub ? '' : `<div class="sub" style="font-size:${sub1}pt;letter-spacing:${track}pt;margin-top:${d*.035}pt" data-slot="${slot || 'seal'}.sub" data-lines="1" ${(sub1 < 8 || o.fine) ? 'data-fine="1"' : ''}>${esc(sub)}</div>`}</div>`;
  };
  // the small seal that carries the year built
  FXS.yearSeal = (cx, cy, d, year, slot) => `<div class="seal" style="left:${cx - d/2}pt;top:${cy - d/2}pt;width:${d}pt;height:${d}pt"><div class="k" data-slot="${slot}.k" data-lines="1" data-fine="1">BUILT</div><div class="yr" style="font-size:${d*.3}pt" data-slot="${slot}" data-lines="1">${esc(String(year))}</div></div>`;
  // the stat row texts: beds, baths, square feet, built (four, as FX14)
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
  FXS.statHtml = (t, np, lp, track, onWhite) => { const p = FXS.statParts(t), c1 = onWhite ? 'var(--fx-ink)' : 'var(--fx-on)', c2 = onWhite ? 'var(--fx-text)' : 'var(--fx-soft)';
    return `<span style="font:400 ${np || 18}pt/1 var(--fx-serif);color:${c1}">${esc(p.n)}</span>${p.l ? `<span style="font:600 ${lp || 8.5}pt/1 var(--fx-font);letter-spacing:${track == null ? 1.5 : track}pt;text-transform:uppercase;color:${c2};margin-left:${(lp || 8.5)*.7}pt">${esc(p.l)}</span>` : ''}`; };
  FXS.statsRow = (items, x, y, w, h, slot, o) => { o = o || {}; return `<div class="stats" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${items.map((t, i) => `<div class="s" data-slot="${slot}.${i}" data-lines="1">${FXS.statHtml(t, o.np, o.lp, o.track)}</div>`).join('')}</div>`; };
  FXS.label = (t, slot, style) => `<div class="lbl" ${slot ? `data-slot="${slot}" data-lines="1"` : ''} style="${style || ''}">${esc(String(t).toUpperCase())}</div>`;
  // a photo box at (x, y, w, h)
  FXS.box = (D, id, x, y, w, h, slot, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${SW.photo(D, id, `position:absolute;inset:0;${css || ''}`, slot)}</div>`;
  // a logo, sized to a box (the one brokerage logo of a side)
  FXS.logo = (D, x, y, w, h, just) => { const b = D.brand || {}; const src = b.logo; return `<div class="abs logo" data-area="${w*h}" data-maxh="${h}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;justify-content:${just || 'flex-start'}">${src ? `<img src="${esc(src)}" alt="">` : `<span class="word" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span>`}</div>`; };
  FXS.logoW = (D, x, y, w, h, just) => FXS.logo(D, x, y, w, h, just).replace('class="abs logo"', 'class="abs logo w"');
  // the agent block of a front: name, REALTOR(R), phone, email, left aligned at (x, y)
  FXS.agent = (A, x, y, w, hsSrc) => {
    const tx = x + (hsSrc ? 70 : 0);
    return (hsSrc ? `<div class="abs hsbox" style="left:${x}pt;top:${y + 2}pt;width:62pt;height:62pt"><img src="${esc(hsSrc)}" alt=""></div>` : '') +
      `<div class="abs agentline" style="left:${tx}pt;top:${y}pt;width:${w - (hsSrc ? 70 : 0)}pt"><div class="n" data-slot="agent.name" data-lines="1">${esc(A.name || '')}</div><div class="d" data-slot="agent.desig" data-lines="1" data-fine="1">REALTOR®</div><div class="p" data-slot="agent.phone" data-lines="1">${esc(A.phone || '')}</div><div class="e" data-slot="agent.email" data-lines="1">${esc(A.email || '')}</div></div>`;
  };
  // light words then a bold last word
  FXS.lightBold = t => esc(t);


  // ---------- photo cards (a photo id, a lead, whole sentences) and the choosing rules ----------
  const LABELS = [[/^front/, 'Front.'], [/^entry/, 'Entry.'], [/^pergola/, 'Pergola.'], [/^deck/, 'Deck.'], [/^patio/, 'Patio.'], [/^evening/, 'Deck at dusk.'], [/^(fence|yard)/, 'Yard.'], [/^terrace/, 'Terrace.'], [/^balcony/, 'Balcony.'], [/^nook/, 'Breakfast nook.'], [/^stair/, 'Stair.'], [/^foyer/, 'Foyer.'], [/^hall/, 'Hall.'], [/^bar/, 'Bar.'], [/^wine/, 'Living room.'], [/^kitchen/, 'Kitchen.'], [/^dining/, 'Dining area.'], [/^(family|living|openplan)/, 'Living room.'], [/^primary/, 'Primary suite.'], [/^pbath/, 'Primary bath.'], [/^bath/, 'Bath.'], [/^bed/, 'Bedroom.'], [/^closet/, 'Closet.'], [/^laundry/, 'Laundry.'], [/^game/, 'Game room.'], [/^park/, 'Community park.'], [/^gazebo/, 'Community park.']];
  FXS.labelFor = id => { const m = LABELS.find(([re]) => re.test(id)); return m ? m[1] : (String(id).replace(/\d+[a-z]?$/, '').replace(/^./, c => c.toUpperCase()) + '.'); };
  FXS.OUTSIDE = /^(front|entry|gazebo|park|alley|skyline|walk|yard|terrace|balcony|deck|patio|pergola|fence|evening|garage|street)/;
  FXS.isHouse = (D, id) => !!((D.photos || {})[id] || {}).fullHouse;
  FXS.spareCap = (D, id) => { const C = D.companion || {}, J = (C.justListed || {}).captions || {}, R = (C.roomLines || {})[id] || {}, lead = FXS.labelFor(id);
    const car = ((C.carousel || {})[id] || []).map(t => String(t).replace(/^[^.]+\.\s*/, ''));   // the carousel's lines about this very photo, without their room name
    const raw = [J[id]].concat(R.all || [R.long || R.short], car).filter(Boolean).map(t => String(t).trim());
    const s = raw.filter((t, i, a) => a.indexOf(t) === i && !SW.roomBan(lead, t) && !(SW.FILLER && SW.FILLER.test(t)));   // sentences about this photo's room only
    return s.length ? {photo: id, lead, s} : null; };
  // every captioned photo the package wrote, first the ones in `first`, then the rest
  FXS.cards = (D, first) => {
    const K = D.sw || {}, F = (D.companion || {}).flyer || {}, out = [], seen = new Set();
    const add = c => { if(c && c.photo && (D.photos || {})[c.photo] && !seen.has(c.photo) && (c.s || []).length){ seen.add(c.photo); out.push(c); } };
    (first || []).forEach(add);
    [].concat((K.back||{}).photos||[], (K.back||{}).photosNoplan||[], (F.back||{}).photos||[], (F.back||{}).photosNoplan||[], (K.left||{}).photos||[], [].concat(...(((K.right||{}).rows)||[])), (K.front||{}).row||[], (F.front||{}).row||[]).forEach(add);
    Object.keys(D.photos || {}).forEach(id => add(FXS.spareCap(D, id)));
    return out;
  };
  // the photo plan (data.sw.plan, out/fxsets/fxs-14/photo-plan.md): a card for one photo id, its lead renamed when the plan says so
  FXS.cardFor = (D, id) => { const P = ((D.sw || {}).plan) || {}; let c = (P.cards || {})[id] ? Object.assign({photo: id, lead: FXS.labelFor(id)}, P.cards[id]) : FXS.cards(D, []).find(x => x.photo === id); if(c && (P.leads || {})[id]) c = Object.assign({}, c, {lead: P.leads[id]}); return c; };
  FXS.planIds = (D, key) => { const P = ((D.sw || {}).plan) || {}; return P[key] || null; };
  // n cards, never the same room or view twice, none of the `avoid` ids; outdoor: only exterior, outdoor or community photos
  FXS.pick = (D, cards, n, o) => { o = o || {}; const avoid = new Set(o.avoid || []), out = [];
    cards.forEach(c => { const id = c.photo, p = (D.photos || {})[id] || {};
      if(out.length >= n || avoid.has(id) || /^pv\d|^plan/.test(id) || (o.noHouse !== false && p.fullHouse && !o.house)) return;
      if(o.outdoor && (!FXS.OUTSIDE.test(id) || /^(skyline|alley)/.test(id))) return;
      if(o.indoor && FXS.OUTSIDE.test(id)) return;
      const sp = x => SW.space(D, x); if(out.some(x => sp(x.photo) === sp(id)) || [...avoid].some(a => sp(a) === sp(id))) return;   // one physical space once
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
  // more true sentences about the very same photo (its room notes, the carousel lines, the Just Listed caption), after the ones the card already has: a bigger pool lets a caption fill its width and its lines
  FXS.augment = (D, c) => { const C = D.companion || {}, id = c.photo, J = ((C.justListed || {}).captions || {})[id], R = (C.roomLines || {})[id] || {}, car = ((C.carousel || {})[id] || []).map(t => String(t).replace(/^[^.]+\.\s*/, '')), room = FXS.leadLabel(c.lead).name;
    const have = [].concat(...(c.s || []).map(x => [].concat(x))), extra = [];
    [J].concat(R.all || [R.long || R.short], car).filter(Boolean).forEach(t => { t = String(t).trim(); if(!t || SW.roomBan(room, t) || SW.FILLER.test(t) || SW.sentences(t, '').length && have.concat(extra).some(h => h === t || SW.sameFact(h, t))) return; extra.push(t); });
    // a shorter wording of the same fact (the sentence up to its last trailing clause), so a caption can land on its lines at the photo's full width
    const shorter = t => { const STOP = /\b(and|with|or|a|an|the|of|to|in|on|at|by|for|from|into|over)\.?$/i; let best = ''; [', ', ' with ', ' under ', ' beside '].forEach(sep => { const i = t.lastIndexOf(sep); if(i >= 22){ const u = t.slice(0, i).replace(/[,;]$/, '') + '.'; if(!STOP.test(u.slice(0, -1)) && u.length > best.length) best = u; } }); return best; };
    const alt = x => { const l = [].concat(x), f = l[0]; if(typeof f !== 'string' || l.length >= 3) return x; const sh = shorter(f); return sh && !l.includes(sh) ? l.concat(sh) : x; };
    const out = (c.s || []).concat(c.noAugment ? [] : extra).map(alt);   // noAugment: the plan's own sentences only (a caption that must not repeat a box or another caption)
    return Object.assign({}, c, {s: out}); };
  // a photo with its caption beside it (an odd slot, or a lone photo): the label and the text run from the photo's right edge to the margin
  FXS.captionSide = (D, c, x, y, pw, ph, slot, o) => { o = o || {}; c = FXS.augment(D, c); const lh = o.lh || 13.5, L0 = FXS.leadLabel(c.lead), cx1 = x + pw + 18, cw1 = 540 + 45 - cx1, n = Math.max(3, Math.floor((ph - 24)/lh));
    return FXS.box(D, c.photo, x, y, pw, ph, slot) + `<div class="abs" style="left:${cx1}pt;top:${y}pt;width:${cw1}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${cw1}pt">${esc(L0.name.toUpperCase())}</div></div>` +
      `<div class="abs cap"><div class="a" style="position:absolute;left:${cx1}pt;top:${y + 22}pt;width:${cw1}pt;height:${n*lh}pt;font-size:9.5pt;line-height:${lh}pt" data-slot="${slot}" data-room="${esc(L0.name)}" data-lh="${lh}" data-lines="${n}" data-min="${o.min || 3}" data-narrow="0" ${FXS.sd(c.s)}></div></div>`; };
  FXS.captioned = (D, c, x, y, w, ph, lines, slot, o) => { o = o || {}; c = FXS.augment(D, c); const L0 = FXS.leadLabel(c.lead), L = (()=>{ let n = L0.name; const wl = t => FXS.width(t.toUpperCase(), 'font-family:Montserrat;font-weight:600;font-size:9pt;letter-spacing:2pt'); if(wl(n) > w) n = n.split(/ and |, /)[0]; return {name: n, size: L0.size}; })(), lh = o.lh || 13.5, fs = o.fs || 10, showSize = L.size && !(FXS.__sizes = FXS.__sizes || new Set()).has(L.size) && FXS.width(L.name.toUpperCase(), 'font-family:Montserrat;font-weight:600;font-size:9pt;letter-spacing:2pt') + FXS.width(L.size, 'font-family:Montserrat;font-weight:500;font-size:9pt') + 12 <= w;
    return FXS.box(D, c.photo, x, y, w, ph, slot) +
      `<div class="abs" style="left:${x}pt;top:${y + ph + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(L.name.toUpperCase())}</div>${showSize ? (FXS.__sizes.add(L.size), `<span data-size="1" style="font:500 9pt/12pt var(--fx-font);color:var(--fx-soft);margin-left:8pt;white-space:nowrap">${esc(L.size)}</span>`) : ''}</div>` +
      `<div class="abs cap"><div class="a" style="position:absolute;left:${x}pt;top:${y + ph + 25}pt;width:${w}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-room="${esc(L.name)}" data-lh="${lh}" data-lines="${lines}" data-min="${o.min || 3}" data-narrow="0" ${sd(c.s)}></div></div>`; };

  // ---------- FX14 composition: the white frame, the taupe block, the script address ----------
  // the taupe block: from (x, y) to the right and bottom bleed of the panel
  FXS.taupe = (x, y, rm) => `<div class="taupe" style="left:${x}pt;top:${y}pt;right:${rm == null ? -9 : rm}pt;bottom:-9pt"></div>`;
  FXS.street = a => String(a || '').replace(FXS.SUF, '').trim();
  // the big script address, white, on one line at the biggest size that fits w
  FXS.scriptLine = (t, x, y, w, max, min, slot, cls) => { const s = FXS.fitSize(t, "font-family:'Pinyon Script'", w, max, min || max*.5);
    return `<div class="script ${cls || ''}" data-slot="${slot}" data-lines="1" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${s*1.25}pt;font-size:${s}pt">${esc(t)}</div>`; };
  // a stat as a Baskerville numeral (18 pt) with its small caps word
  FXS.stat3 = (L) => { const items = FXS.statItems(L).slice(0, 3); return items.map(t => FXS.statParts(t)); };
  FXS.statLines = (parts, x, y, pitch, slot) => parts.map((p, i) => `<div class="abs stat" data-slot="${slot}.${i}" data-lines="1" style="left:${x}pt;top:${y + i*pitch}pt;height:${pitch}pt"><span class="n">${esc(p.n)}</span><span class="l">${esc(p.l)}</span></div>`).join('');
  // the cover's real-selling-fact tags
  FXS.tagFacts = D => { const SF = FXS.sellingFacts(D), pri = /garage|fenced|deck|pergola|gated|roof|patio|pool|balcon|turf/i, all = SF.outside.concat(SF.inside), pick = all.filter(t => pri.test(t));
    return {tags: pick.concat(all.filter(t => !pick.includes(t))).filter(t => !/^Built in|story|bedrooms|square feet|sq ft/i.test(t))}; };
  // the white agent card of a cover: name, REALTOR(R), phone, email, the one logo; a headshot rides the card's top edge
  FXS.agentCard = (D, x, y, w, h) => { const A = D.agent || {}, b = D.brand || {}, hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '', hs = !!hsSrc;
    const ns = FXS.fitSize(A.name || '', "font-family:'Libre Baskerville'", w - 24, 25, 16);
    const top = hs ? 44 : 20, logoH = 40;
    let o = `<div class="acard" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"></div>`;
    if(hs) o += `<div class="abs hsbox" style="left:${x + w/2 - 32}pt;top:${y - 26}pt;width:64pt;height:64pt;border-radius:50%;border:3pt solid var(--fx-card)"><img src="${esc(hsSrc)}" alt=""></div>`;
    o += `<div class="abs" style="left:${x}pt;top:${y + top}pt;width:${w}pt;text-align:center;color:var(--fx-ink)"><div class="acard-t" style="position:relative;background:none"><div class="n" style="font:400 ${ns}pt/${ns*1.15}pt var(--fx-serif);color:var(--fx-ink);white-space:nowrap" data-slot="agent.name" data-lines="1">${esc(A.name || '')}</div><div class="d" style="font:600 9.5pt/12pt var(--fx-font);letter-spacing:3pt;color:var(--fx-mute);margin-top:3pt" data-slot="agent.desig" data-lines="1" data-fine="1">REALTOR®</div><div class="p" style="font:600 21pt/26pt var(--fx-font);color:var(--fx-ink);margin-top:6pt;white-space:nowrap" data-slot="agent.phone" data-lines="1">${esc(A.phone || '')}</div><div class="e" style="font:400 12.5pt/16pt var(--fx-font);color:var(--fx-ink);white-space:nowrap" data-slot="agent.email" data-lines="1">${esc(A.email || '')}</div></div></div>`;
    o += FXS.logo(D, x + 18, y + h - logoH - 12, w - 36, logoH, 'center');
    return o; };

  // ---------- the cover (also the flyer front) ----------
  FXS.cover = (D, o) => { o = o || {};
    const L = D.listing, A = D.agent || {}, F = ((D.companion || {}).flyer || {}).front || {}, K = (D.sw || {}).front || {};
    const heroId = F.hero || K.hero || 'front', heroH = o.heroH || 372, ty = 18 + heroH;
    const X0 = 45;
    let h = FXS.taupe(18, ty);
    h += SW.heroHtml(D, heroId, 18, 18, 558, heroH, 'front.house', []);
    const st = FXS.street(L.address), as = FXS.fitSize(st, "font-family:'Pinyon Script'", 380, 75, 50);
    h += FXS.scriptLine(st, X0 - 6, ty + 2, 380, 75, 50, 'address');
    h += `<div class="abs" style="left:395pt;top:${ty + 44}pt;width:190pt;text-align:right;font:600 9.75pt/16.5pt var(--fx-font);letter-spacing:3pt;color:var(--fx-on);white-space:nowrap" data-slot="built" data-lines="1">BUILT IN ${esc(String(L.yearBuilt || L.year || ''))}</div>`;
    const by = ty + 112, hood = FXS.hood(L) || L.city;
    h += `<div class="abs" style="left:${X0}pt;top:${by}pt;width:225pt;font:700 19.5pt/25pt var(--fx-font);color:var(--fx-on);white-space:nowrap" data-slot="front.place" data-lines="2">${esc(hood)}<br>${esc(FXS.placeLine(L))}</div>`;
    h += `<div class="abs" style="left:279pt;top:${by + 2}pt;width:1.5pt;height:63pt;background:rgba(255,255,255,.85)"></div>`;
    h += FXS.statLines(FXS.stat3(L), 297, by - 1, 22, 'fact');
    const wy = ty + 204, lh = 17, maxL = o.lines || 5, tries = []; for(let t = maxL; t >= 3; t--) tries.push(t);
    h += `<div class="abs wu" data-slot="front.summary" data-lines="${maxL}" data-try="${tries.join(',')}" data-lh="${lh}" ${FXS.sd(o.intro || F.intro || K.summary || [])} style="left:${X0}pt;top:${wy}pt;width:279pt;height:${maxL*lh}pt;font-size:11pt;line-height:${lh}pt"></div>`;
    const introTxt = JSON.stringify(o.intro || F.intro || K.summary || []).toLowerCase(), noun = /garage|fenc|deck|pergola|gated|roof|patio|pool|balcon|turf|porch|window|floor|ceiling/;
    const introAll = [].concat(...[].concat(o.intro || F.intro || K.summary || []).map(x => [].concat(x)));
    let tg0 = FXS.tagFacts(D).tags.filter(t => { const n = noun.exec(t.toLowerCase()); return !(n && introTxt.includes(n[0])) && !introAll.some(s => SW.sameFact(t, s)); }); tg0 = tg0.filter((t, i, arr) => !arr.slice(0, i).some(u => SW.sameFact(t, u))); if(tg0.length < 2) tg0 = FXS.tagFacts(D).tags;
    const tg = tg0.slice(), ry = wy + maxL*lh + 8;
    const fitList = (css, join, up) => { const out = []; while(tg.length){ const t = out.concat(tg[0]).join(join); if(FXS.width(up ? t.toUpperCase() : t, css) > 276) break; out.push(tg.shift()); } return out; };
    const l1 = fitList("font-family:Montserrat;font-weight:600;font-size:9.75pt;letter-spacing:2pt", ' · ', true), l2 = fitList("font-family:Montserrat;font-weight:400;font-size:9.75pt", ' · ', false);
    h += `<div class="hr" style="left:${X0}pt;top:${ry}pt;width:279pt"></div>`;
    h += `<div class="abs" style="left:${X0}pt;top:${ry + 10}pt;width:279pt;font:600 9.75pt/15pt var(--fx-font);letter-spacing:2pt;color:var(--fx-on);white-space:nowrap;overflow:hidden" data-slot="front.tags" data-lines="1">${esc(l1.join(' · ').toUpperCase())}</div>`;
    if(l2.length) h += `<div class="abs" style="left:${X0}pt;top:${ry + 28}pt;width:279pt;font:400 9.75pt/15pt var(--fx-font);color:var(--fx-soft);white-space:nowrap;overflow:hidden" data-slot="front.more" data-lines="1">${esc(l2.join(' · '))}</div>`;
    h += FXS.agentCard(D, 351, 582, 243, 192);
    return h;
  };


  // ---------- the plan card (IvoryPlan) at (x, y, w): returns {html, bottom, issues} ----------
  FXS.planCard = (D, x, y, w, maxH) => {
    const iw = w - 28.8, A = D.plan.turn && D.plan.kind === 'color' ? 270 : undefined, planRot = D.plan.turn || (() => { const r0 = IvoryPlan.draw(D.plan, {x: x + 14.4, y: 0, w: iw, h: 250}, {allowRotate: false}); return (r0.issues || []).some(i => /label-wont-fit/.test(i.kind)); })();
    const fit = mh => { for(let hh = mh; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: x + 14.4, y: 0, w: iw, h: hh}, {allowRotate: planRot, angle: A}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')) return Math.min(hh, Math.ceil(big.usedH || hh) + 6); } return 200; };
    const ph = fit(maxH), r = IvoryPlan.draw(D.plan, {x: x + 14.4, y: y + 8, w: iw, h: ph - 4}, {allowRotate: planRot, angle: A});
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
    if(has(/gated front entry/i)) add(inside, 'Gated front entry'); else if(has(/gate (?:opening |opens )?(?:to|at) the front door|gate opens to the front door/i)) add(inside, 'Gate at the front door'); else if(has(/gated/i)) add(inside, 'Gated community');
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
    else if(has(/covered patio/i)) add(outside, 'Covered patio'); else if(has(/\bpatio\b/i)) add(outside, 'Patio');
    if(has(/balcon/i)) add(outside, 'Covered balcony');
    if(has(/turf/i)) add(outside, 'Turf backyard');
    if(has(/mature trees/i)) add(outside, 'Mature trees');
    if(has(/community park|gazebo/i)) add(outside, 'Community park with a gazebo');
    const yr = L.yearBuilt || L.year, lot = L.lotSize ? String(L.lotSize).replace(/\s*Sq Ft Lot/i, ' sq ft lot') : '';
    [yr ? `Built in ${yr}` : '', L.stories ? (L.stories == 1 ? 'One story, no stairs' : `${L.stories} stories`) : '', L.beds ? `${L.beds} bedrooms` : '', L.sqft ? `${Number(L.sqft).toLocaleString('en-US')} square feet` : ''].forEach(t => { if(inside.length < 5) add(inside, t); });
    [lot, L.stories ? (L.stories == 1 ? 'One story, no stairs' : `${L.stories} stories`) : ''].forEach(t => { if(outside.length < 2 + 0) add(outside, t); });
    return {inside, outside};
  };

  // ---------- the back
  // (see below)
  // ---------- the back (also the flyer back): a wide photo or the plan, three captioned photos, The house, two boxes, the agent ----------
  FXS.noteBox = (title, list, x, y, w, rows, slot, rowH) => { rowH = rowH || 15.75; const hh = 34 + rows*rowH + 8;
    return {h: hh, html: `<div class="card" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hh}pt"></div><div class="abs" style="left:${x + 18}pt;top:${y + 12}pt">${FXS.label(title, slot + '.title')}</div>` + FXS.bullets(list, x + 20, y + 34, w - 36, rowH, slot, rows, 10.5).html}; };
  FXS.back = (D, o) => { o = o || {};
    const L = D.listing, A = D.agent || {}, b = D.brand || {}, hasPlan = !!D.plan, X0 = 45, CW = 540, gap = 9, rw = (CW - 2*gap)/3;
    const F = (D.companion || {}).flyer || {}, FB = F.back || {}, KB = (D.sw || {}).back || {}, Kleft = (D.sw || {}).left || {};
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    const used = [(((D.sw||{}).front||{}).hero) || 'front'].concat(o.avoid || []);
    const first = (hasPlan ? FB.photos : (FB.photosNoplan || FB.photos)) || [];
    const all = FXS.cards(D, first), issues = [];
    const outdoor = !!o.outdoor, popt = {avoid: used, exactAvoid: outdoor, outdoor, house: outdoor};
    const SF = FXS.sellingFacts(D), near = (FB.nearby || KB.nearby || []).slice(0, 3).map(FXS.nearText);
    const box = FB.box || Kleft.box || {};
    const covTxt = JSON.stringify(o.coverText || ''), c1 = SF.inside.filter(t => !(/garage/i.test(t) && /garage/i.test(covTxt)) && !/^Built in|story|bedrooms|square feet/i.test(t));
    const rowsN = 5;
    const BX = KB.boxes || {};
    const c1b = (BX.inside && BX.inside.items ? BX.inside.items.filter(t => !(/garage/i.test(t) && /garage/i.test(covTxt))) : c1).slice(0, 7), c2all = (BX.outside && BX.outside.items ? BX.outside.items.slice() : SF.outside.filter(t => !/lot$/i.test(t))).concat(near), box1Title = (BX.inside && BX.inside.title) || 'New and updated';
    // the top: the plan on a white card, or one wide photo (the kitchen on a flyer, an outdoor photo on a fold-over)
    let h = '', wideId = null;
    const PBids = (D.sw && D.sw.plan) ? ((hasPlan ? D.sw.plan.back : (D.sw.plan.backNoplan || D.sw.plan.back)) || []) : null;
    const pool = PBids ? PBids.map(id => FXS.cardFor(D, id)).filter(Boolean) : FXS.pick(D, all, 12, Object.assign({}, popt, {noHouse: !outdoor}));
    let cand = pool.slice(), wide = null;
    if(!hasPlan){ wide = cand.find(c => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, 576, 200)) || cand[0]; cand = cand.filter(c => c !== wide); }
    let picks = [];
    { const ph0 = hasPlan ? 88 : 97.5; for(let n = Math.min(3, cand.length); n >= 1; n--){ const w = (CW - (n - 1)*gap)/n, ok = cand.filter(c => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, w, ph0)); if(ok.length >= n){ picks = ok.slice(0, n); break; } if(n === 1) picks = ok.slice(0, 1); } }
    let nP = picks.length;
    const extra = 0;
    let TH = 200 + extra, noRow = false;
    if(hasPlan){
      let pMax = 180 + extra, pc = FXS.planCard(D, 18, 18, 576, pMax);
      while(pc.issues.some(i => /label-wont-fit/.test(i.kind)) && pMax < 270){ pMax += 30; noRow = true; pc = FXS.planCard(D, 18, 18, 576, pMax); }   // a plan whose labels need the room gets it, and the photo row gives way
      if(noRow){ picks = []; nP = 0; }
      h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues; TH = pc.bottom - 18;
    } else { wideId = wide.photo; h += SW.heroHtml(D, wideId, 18, 18, 576, TH, 'back.wide', []); }
    const ty0 = 18 + TH;
    h = FXS.taupe(18, ty0, 18) + h;   // equal 0.25 in margins left and right; it bleeds off the bottom
    const rw2 = nP > 1 ? (CW - (nP - 1)*gap)/nP : (nP === 1 ? 283 : CW), ph = hasPlan ? (nP <= 2 ? 92 : 86) : 97.5, lines = 3, lh = 13.5, ry = ty0 + 13;
    let rowEnd = nP ? ry + ph + 25 + lines*lh : ty0 + 0;
    if(nP === 1){   // one photo: the caption runs beside it, so the row is never half empty
      h += FXS.captionSide(D, picks[0], X0, ry, 283, 146, 'back.photo0', {lh});
      rowEnd = ry + 146 + 17;
    } else picks.forEach((c, i) => { h += FXS.captioned(D, c, X0 + i*(rw2 + gap), ry, rw2, ph, lines, 'back.photo' + i, {narrow: 12, lh, fs: 9.5}); });
    const rowH = (noRow || nP === 0) ? 19 : 15.75;
    // the left column ("The house") and the two boxes on the right end on one baseline
    const bx = 322, bw = 263, yLow = rowEnd + 16, avail = Math.floor(((o.cardsBottom || 667) - yLow - 10 - 84)/(2*rowH)), rows1 = Math.max(Math.min(5, c1b.length), Math.min(7, c1b.length, avail)), rows2 = Math.max(5, Math.min(7, c2all.length, avail));
    const b1 = FXS.noteBox(box1Title, c1b, bx, yLow, bw, rows1, 'back.updates', rowH), b2 = FXS.noteBox('Outside and nearby', c2all.slice(0, rows2), bx, yLow + 0, bw, rows2, 'back.outside', rowH);
    const bottom = yLow + b1.h + 10 + b2.h;
    h += FXS.noteBox(box1Title, c1b, bx, yLow, bw, rows1, 'back.updates', rowH).html;
    h += FXS.noteBox('Outside and nearby', c2all, bx, yLow + b1.h + 10, bw, rows2, 'back.outside', rowH).html;
    const nk = x => String(x).toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 40), shownSet = new Set([].concat(...picks.map(c => [].concat(...(c.s || []).map(x => [].concat(x))))).map(nk));
    const aboutS = [].concat(...(FB.floors || []).map(f => f.s)), aboutKept = aboutS.filter(x => ![].concat(x).some(a => shownSet.has(nk(a))));
    const ll = 16.5, headH = 44, availA = bottom - yLow - headH, maxL = Math.max(3, Math.min(10, Math.floor(availA/ll))), tr = []; for(let t = maxL; t >= 3; t--) tr.push(t);
    h += `<div class="script uline-wrap" style="left:${X0}pt;top:${yLow - 4}pt;font-size:40pt;height:50pt"><span class="uline" data-slot="back.about.title" data-lines="1">The house</span></div>`;
    h += `<div class="abs body" data-slot="back.about" data-lines="${maxL}" data-try="${tr.join(',')}" data-lh="${ll}" data-narrow="10" ${FXS.sd(aboutKept.length >= 3 ? aboutKept : aboutS)} style="left:${X0}pt;top:${yLow + headH}pt;width:262pt;height:${maxL*ll}pt"></div>`;
    // the standard agent card on taupe, then the fine print
    const ay = 681;   // the card and the fine print end 0.35 in above the trim (759 + 8 = 767 of 792)
    h += `<div style="--cc-paper:var(--fx-taupe);--cc-ink:#fff;--cc-muted:#f4efe9;--cc-accent:#f4efe9;--cc-line:rgba(255,255,255,.45)">` + ContactCard.html([X0, ay, CW, 74], Object.assign({}, A, {headshot: hsSrc}), Object.assign({}, b, {logo: b.logo}), {layout: 'panel', size: 'mid', fine: '', bottomGap: 0.5, fieldAccent: true, logoStyle: 'filter:brightness(0) invert(1)'}) + '</div>';
    h += `<div class="abs fine" style="left:${X0}pt;top:${ay + 78}pt;width:${CW}pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">Information deemed reliable but not guaranteed.</div>`;
    h += `<div class="abs fine" data-ybottom="${ay + 86}" style="display:none"></div>`;
    return {html: h, issues, bottom: ay + 86};
  };

  // inside pages: kicker label, a Pinyon title, an intro of whole sentences; returns {html, bottom}
  FXS.pageHead = (kicker, title, intro, slot, lines, y0, o) => { o = o || {}; const X0 = 45, CW = 540, Y0 = y0 == null ? 232 : y0;
    const t = String(title || '').replace(/\.$/, ''), ts = FXS.fitSize(t, "font-family:'Pinyon Script'", CW, o.ts || 42, 28), lh = 17, tr = []; for(let q = lines; q >= 2; q--) tr.push(q);
    const ty = Y0 + 18, iy = ty + ts*1.15 + 6;
    return {html: `<div class="abs" style="left:${X0}pt;top:${Y0}pt">${FXS.label(kicker, slot + '.kicker')}</div>
      <div class="script" style="left:${X0}pt;top:${ty}pt;width:${CW}pt;height:${ts*1.25}pt;font-size:${ts}pt;line-height:${ts*1.15}pt" data-slot="${slot}.title" data-lines="1">${esc(t)}</div>
      <div class="abs wu" data-slot="${slot}.intro" data-lines="${lines}" data-try="${tr.join(',')}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0}pt;top:${iy}pt;width:${CW}pt;height:${lines*lh}pt;font-size:11pt;line-height:${lh}pt"></div>`, bottom: iy + lines*lh}; };

  // checks shared by every page: sizes beside their photo only (once on the spread), bath labels, captions in a row on one line count
  SW.sizeIssues = () => { const out = [], seen = new Map(), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement; if(!p || p.closest('.plan-room, .plan-svg, .plan-legend, .planwrap, script, style')) continue;
      const m = n.textContent.match(SW.SIZE); if(!m) continue;
      m.forEach(t => { const ok = p.closest('[data-size], .cap .a b'); const k = t.replace(/\s+/g, ''); if(!ok) out.push({slot: (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || 'text', kind: 'size-away-from-photo', detail: `${t} is not beside its photo`}); else if(seen.has(k)) out.push({slot: (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || 'text', kind: 'size-repeats', detail: `${t} appears twice on the spread`}); else seen.set(k, 1); }); }
    return out; };
  SW.bathIssues = () => { const out = [], t = document.body.innerText || ''; const re = /(\d[\d,]*)\s+baths?\b/gi; let m; while((m = re.exec(t))) out.push({slot: 'baths', kind: 'plain-baths', detail: `"${m[0]}" must read "Full Baths" (or "Baths" only after a ½): run the label through _shared/baths.js`}); return out; };
  SW.rowIssues = () => { const rows = new Map(), faces = [...document.querySelectorAll('.panel, .sheet')]; document.querySelectorAll('.cap .a[data-s][data-slot]').forEach(el => { if(!el.getClientRects().length) return; const f = el.closest('.panel, .sheet'), k = faces.indexOf(f) + '|' + Math.round(el.getBoundingClientRect().top/8); (rows.get(k) || rows.set(k, []).get(k)).push(el); });
    const out = []; rows.forEach(els => { if(els.length < 2) return; const ns = els.map(e => SW.lines(e).n); if(new Set(ns).size > 1) out.push({slot: els[0].dataset.slot, kind: 'captions-uneven', detail: `captions in one row run ${ns.join(', ')} lines`}); }); return out; };
  // a photo's description runs out to the photo's right edge: every full line of a caption set under its photo reaches within 6 pt of the photo's right edge
  SW.edgeIssues = () => { const out = [];
    document.querySelectorAll('.cap .a[data-slot]').forEach(el => { const ph = document.querySelector('.ph[data-slot-photo="' + el.dataset.slot + '"]'); if(!ph || !el.getClientRects().length) return; const pr = ph.getBoundingClientRect(), er = el.getBoundingClientRect(); if(er.top < pr.bottom - 1 || Math.abs(er.left - pr.left) > 2) return;
      const rg = document.createRange(); rg.selectNodeContents(el); const rows = []; [...rg.getClientRects()].filter(q => q.width > 1).forEach(q => { const r = rows.find(x => Math.abs(x.top - q.top) < q.height*.5); if(r) r.right = Math.max(r.right, q.right); else rows.push({top: q.top, right: q.right}); });
      rows.sort((a, b) => a.top - b.top); if(rows.length < 2) return; const gap = (pr.right - Math.max(...rows.slice(0, -1).map(r => r.right)))*72/96;
      if(gap > 6.2) out.push({slot: el.dataset.slot, kind: 'caption-short-of-photo-edge', detail: `the caption stops ${gap.toFixed(0)} pt short of the photo's right edge (6 pt at most)`}); });
    return out; };
  // no rule, line or box edge touches or runs through any text (the owner's 11/2 clearance rule)
  SW.clearIssues = () => { const out = [], rules = [], infl = 1.5;
    document.querySelectorAll('.hr, .vr').forEach(e => { const r = e.getBoundingClientRect(); if(r.width > 0 && r.height > 0) rules.push({r, e}); });
    document.querySelectorAll('.card, [data-box]').forEach(e => { const r = e.getBoundingClientRect(); if(r.width < 2 || r.height < 2) return; const t = 1.2;
      [[r.left, r.top, r.right, r.top + t], [r.left, r.bottom - t, r.right, r.bottom], [r.left, r.top, r.left + t, r.bottom], [r.right - t, r.top, r.right, r.bottom]].forEach(([l, tp, rt, b]) => rules.push({r: {left: l, top: tp, right: rt, bottom: b}, e})); });
    const texts = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement; if(!p || !n.textContent.trim() || p.closest('script, style, .plan-svg, .planwrap')) continue; const cs = getComputedStyle(p); if(cs.visibility === 'hidden') continue;
      const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(q => { if(q.width > 1 && q.height > 1) texts.push({q, p, t: n.textContent.trim().slice(0, 30)}); }); }
    const seen = new Set();
    rules.forEach(({r, e}) => texts.forEach(({q, p, t}) => { if(p.closest('[data-bg]')) return;
      // a text rect is the line box (taller than the letters): shrink it to the letters (about 70% of its height, centered) before the test
      const h = q.height*.7, tp = q.top + (q.height - h)/2, bt = tp + h;
      if(q.left < r.right + infl && q.right > r.left - infl && tp < r.bottom + infl && bt > r.top - infl){ const key = t + '|' + (e.className || '') + Math.round(r.top); if(seen.has(key)) return; seen.add(key); out.push({slot: (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || 'text', kind: 'line-hits-text', detail: `a ${e.className.split(' ')[0] || 'rule'} touches "${t}"`}); } }));
    return out; };
  // no letter is cut off (owner 11/7/2026, FXS-14 review: the cut-off J): every letter's ink (the glyph as drawn, script swashes and descenders
  // included, measured with the canvas text metrics) stays inside every box that clips it (overflow hidden) and inside the page
  SW.inkBox = (ch, font) => { const cv = SW._inkCv || (SW._inkCv = document.createElement('canvas').getContext('2d')); cv.font = font; const m = cv.measureText(ch), f = cv.measureText('Hg');
    return {l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent, fa: f.fontBoundingBoxAscent, fd: f.fontBoundingBoxDescent}; };
  // how far a word's first letter reaches left of its box (pt), e.g. the J of "Just" in Pinyon Script: used to keep a swash inside its box
  SW.inkLeft = (word, family, sizePt) => Math.max(0, SW.inkBox(String(word)[0], `400 ${sizePt}pt ${family}`).l*72/96);
  // how far a word's last letter reaches right of its advance (pt), e.g. the d of "Listed" in Pinyon Script
  SW.inkRight = (word, family, sizePt) => { const ch = String(word).slice(-1), k = SW.inkBox(ch, `400 ${sizePt}pt ${family}`), cv = SW._inkCv; return Math.max(0, (k.r - cv.measureText(ch).width)*72/96); };
  // every letter whose ink crosses the edge of a box that clips it: {el (the clipping box), slot, ch, side, pt, text}. Text that sits wholly outside its
  // clipping box (hidden on purpose) is not a cut letter.
  SW.inkCuts = () => { const out = [], tol = .5, w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), rg = document.createRange();
    for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement, t = n.textContent; if(!p || !t.trim() || p.closest('script, style, svg, [aria-hidden="true"]')) continue;
      const cs = getComputedStyle(p); if(cs.visibility === 'hidden' || +cs.opacity === 0 || !p.getClientRects().length) continue;
      const clips = []; for(let a = p; a && a !== document.documentElement; a = a.parentElement){ const c = getComputedStyle(a); if(c.overflowX !== 'visible' || c.overflowY !== 'visible'){ const r = a.getBoundingClientRect(); clips.push({el: a, l: r.left + parseFloat(c.borderLeftWidth), r: r.right - parseFloat(c.borderRightWidth), t: r.top + parseFloat(c.borderTopWidth), b: r.bottom - parseFloat(c.borderBottomWidth), x: c.overflowX !== 'visible', y: c.overflowY !== 'visible'}); } }
      if(!clips.length) continue;
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, up = cs.textTransform === 'uppercase', slot = (p.closest('[data-slot]') || {dataset: {}}).dataset.slot || p.className || 'text';
      for(let i = 0; i < t.length; i++){ let ch = t[i]; if(!ch.trim()) continue; if(up) ch = ch.toUpperCase();
        rg.setStart(n, i); rg.setEnd(n, i + 1); const r = rg.getClientRects()[0]; if(!r || r.width < .1) continue;
        const k = SW.inkBox(ch, font), sc = r.height/((k.fa + k.fd) || r.height), base = r.top + k.fa*sc;
        const ink = {l: r.left - k.l*sc, r: r.left + k.r*sc, t: base - k.a*sc, b: base + k.d*sc};
        for(const c of clips){ if(ink.r <= c.l || ink.l >= c.r || ink.b <= c.t || ink.t >= c.b) break;   // wholly outside: hidden on purpose
          const cut = []; if(c.x && ink.l < c.l - tol) cut.push(['left', c.l - ink.l]); if(c.x && ink.r > c.r + tol) cut.push(['right', ink.r - c.r]); if(c.y && ink.t < c.t - tol) cut.push(['top', c.t - ink.t]); if(c.y && ink.b > c.b + tol) cut.push(['bottom', ink.b - c.b]);
          cut.forEach(([side, px]) => out.push({el: c.el, slot, ch, i, side, pt: px*72/96, text: t.trim().slice(0, 40)}));
          if(cut.length) break; } } }
    return out; };
  // a text box whose words fit (no real overflow) but whose letters reach past its edge (a script swash, the hook of a J, a descender) stops clipping;
  // a photo box, a box holding an image and the page itself keep clipping, so a cut there stays an issue
  SW.unclipInk = () => { const done = new Set();
    for(let pass = 0; pass < 3; pass++){ const cuts = SW.inkCuts(); let changed = false;
      cuts.forEach(({el}) => { if(done.has(el) || el.matches('.page, [data-page], .photo, .ph, .panel, .sheet') || getComputedStyle(el).backgroundImage !== 'none') return;
        { const er = el.getBoundingClientRect(); if([...el.querySelectorAll('img, svg, canvas, video, .photo, .ph')].some(m => { const r = m.getBoundingClientRect(); return r.width > 0 && (r.left < er.left - .5 || r.right > er.right + .5 || r.top < er.top - .5 || r.bottom > er.bottom + .5); })) return; }   // a photo that would spill keeps the clip
        // real overflow (a hidden word or a hidden line) keeps the clip and stays an issue; a line box a few points taller than its box is not a hidden line
        const c = getComputedStyle(el), lh = parseFloat(c.lineHeight) || parseFloat(c.fontSize)*1.2;
        if(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + lh*.5) return;
        el.style.overflow = 'visible'; el.dataset.inkVisible = '1'; done.add(el); changed = true; });
      if(!changed) break; }
    return done.size; };
  SW.inkIssues = () => { SW.unclipInk(); const out = [], seen = new Set();
    SW.inkCuts().forEach(c => { const key = c.slot + '|' + c.i + '|' + c.side; if(seen.has(key)) return; seen.add(key); const e = c.el; out.push({slot: c.slot, kind: 'letter-clipped', detail: `"${c.ch}" in "${c.text}" is cut off at the ${c.side} by ${c.pt.toFixed(1)} pt`, box: `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}[${e.dataset.slot || ''}] scroll ${e.scrollWidth}x${e.scrollHeight} client ${e.clientWidth}x${e.clientHeight}`}); });
    return out; };
  // how far a line's ink reaches below its line box (pt; negative = stays inside), for a box with line-height lhPt: lets a layout leave room for
  // a swash (owner 11/8/2026, FXS-14 p19, p23, p25.1: the J of "Just Listed" ran into the address; the check is templates/_shared/headtouch.js)
  SW.inkBelow = (text, family, sizePt, lhPt) => { const cv = SW._inkCv || (SW._inkCv = document.createElement('canvas').getContext('2d')); cv.font = `400 ${sizePt}pt ${family}`;
    const m = cv.measureText(text), f = cv.measureText('Hg'), lh = (lhPt || sizePt)*96/72, base = (lh - (f.fontBoundingBoxAscent + f.fontBoundingBoxDescent))/2 + f.fontBoundingBoxAscent;
    return (base + m.actualBoundingBoxDescent - lh)*72/96; };
  // pages that run through OHL / FXP (Open House flyer, email, socials): the repeated-phrase and duplicate-sentence checks ride on their brochureCheck
  // inside left: a photo caption never says a fact the kitchen box on the same face says
  FXS.leftBoxCheck = () => { const out = [], cells = [...document.querySelectorAll('[data-slot^="left.box.t"]')].flatMap(e => String(e.textContent).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean));
    document.querySelectorAll('.cap .a[data-slot^="left.photo"]').forEach(el => { String(el.textContent).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean).forEach(x => { const hit = cells.find(c => SW.sameFact(x, c)); if(hit) out.push({slot: el.dataset.slot, kind: 'caption-repeats-box', detail: `"${x.slice(0, 60)}" is in the kitchen box: "${hit.slice(0, 60)}"`}); }); });
    return out; };
  // the back (fold-over and flyer): "The house" text and the box bullets never say one fact
  FXS.backTextBox = () => { const out = [];
    { const ab = document.querySelector('[data-slot="back.about"]'), bl = [...document.querySelectorAll('.bul[data-slot^="back."]')];
      if(ab && bl.length){ const ss = String(ab.textContent).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
        bl.forEach(b => { const t = b.textContent.trim(), hit = ss.find(x => { const st = w => w.replace(/^hardwood$/, 'wood').replace(/s$/, ''), bw = [...cwords(t)].filter(w => w !== 'new').map(st), xw = new Set([...cwords(x)].map(st)); return bw.length > 0 && bw.every(w => xw.has(w)); }); if(hit) out.push({slot: b.dataset.slot, kind: 'text-repeats-box', detail: `"${t}" is also said in the text: "${hit.slice(0, 70)}"`}); }); } }
    return out; };
  FXS.repCheck = () => { const out = [...SW.sizeIssues(), ...SW.bathIssues(), ...SW.clearIssues(), ...SW.inkIssues()], seenS = new Map();
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return;
      const txt = String(el.textContent), r = SW.rep5(txt); if(r) out.push({slot: el.dataset.slot, kind: 'repeated-phrase', detail: `"${r}" repeats in one block`}); const sf = SW.sameFactIn(txt); if(sf) out.push({slot: el.dataset.slot, kind: 'same-fact-twice', detail: sf.slice(0, 120)});
      txt.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x.length >= 28).forEach(x => { const k = x.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 48), prev = seenS.get(k);
        if(prev && prev !== el.dataset.slot) out.push({slot: el.dataset.slot, kind: 'duplicate-sentence', detail: `"${x.slice(0, 60)}" also in ${prev}`}); else seenS.set(k, el.dataset.slot); }); });
    out.push(...FXS.backTextBox());
    return out; };
  FXS.hookCheck = () => { let bc = null; Object.defineProperty(window, 'brochureCheck', {configurable: true, get: () => bc, set: v => { bc = typeof v === 'function' ? (() => v().concat(FXS.repCheck())) : v; }}); };
  window.SW = SW; window.FXS = SW;
})();
