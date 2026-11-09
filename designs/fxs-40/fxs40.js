/* fxs-40 helpers (ported from the swatchbook set's swatchbook.js, FX40 look): data, photos, captions and paragraphs that fill their boxes, logos, print checks, the set's tokens (FXS.tok, read from fxs40.css) and marks (icons, arch).

   Captions and paragraphs are written as a lead plus whole sentences (data-s). Each box has a line count; the fill pass
   picks the sentences, in the writer's order, that set in exactly that many lines with the last line at least 3/4 full.
   It never cuts a word or a sentence; when no set of whole sentences fits, the box is reported and goes back to the writer. */
(function(){
  const SW = {};
  const FXS = SW;
  const esc = SW.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pt = px => px*72/96;
  // Live orders name photos p0, p1... with the photo tagger's role and tags (order/agent.js dataFor). This template picks and
  // labels photos by their room name (kitchen, deck, front...), so each p-photo gets a room name from its role or tags, and every
  // reference to it in the copy follows. Sample data (room names already) passes through unchanged. Same result on every call.
  SW.normPhotos = D => {
    const P = D.photos || {}, ids = Object.keys(P).filter(id => /^p\d+$/.test(id)).sort((a, b) => +a.slice(1) - +b.slice(1));
    if(!ids.length) return D;
    const ROLE = {front: 'front', side: 'walk', back: 'yard', street: 'street', aerial: 'skyline', living: 'living', family: 'family', kitchen: 'kitchen', dining: 'dining',
      nook: 'nook', primary: 'primary', bedroom: 'bed', bath: 'bath', office: 'flex', entry: 'foyer', stairs: 'stair', laundry: 'laundry', garage: 'garage', patio: 'patio',
      pool: 'patio', yard: 'yard', view: 'skyline', amenity: 'park', floorplan: 'plan', other: 'room'};
    const TAG = [[/primary (bath|shower)|ensuite|master bath/, 'pbath'], [/half bath|powder/, 'powder'], [/bath|shower/, 'bath'], [/kitchen/, 'kitchen'], [/breakfast|nook/, 'nook'],
      [/dining/, 'dining'], [/family/, 'family'], [/living/, 'living'], [/game|media/, 'game'], [/primary|master/, 'primary'], [/bed/, 'bed'], [/office|study|flex/, 'flex'],
      [/laundry|utility/, 'laundry'], [/closet/, 'closet'], [/stair/, 'stair'], [/foyer|entry/, 'foyer'], [/balcon/, 'balcony'], [/deck/, 'deck'], [/pergola/, 'pergola'],
      [/patio|porch|pool/, 'patio'], [/yard|lawn/, 'yard'], [/garage/, 'garage'], [/park|community|amenit/, 'park'], [/front|exterior|street|curb/, 'front']];
    const used = new Set(Object.keys(P).filter(id => !/^p\d+$/.test(id))), map = {};
    ids.forEach(id => { const p = P[id] || {}, t = (String(p.role || '') + ' ' + String(p.tags || '') + ' ' + String(p.room || '')).toLowerCase();
      const base = (p.house || p.fullHouse) ? 'front' : (p.role === 'bath' && /primary|ensuite|master/.test(t)) ? 'pbath' : (p.role === 'primary' && /bath|shower/.test(t)) ? 'pbath'
        : ROLE[p.role] || (TAG.find(([re]) => re.test(t)) || [0, 'room'])[1];
      let n = base, k = 2; while(used.has(n)) n = base + k++; used.add(n); map[id] = n; });
    const re = v => typeof v === 'string' ? (map[v] || v) : Array.isArray(v) ? v.map(re) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, re(x)])) : v;
    const NP = {}; Object.entries(P).forEach(([id, v]) => { NP[map[id] || id] = v; });
    const out = re(Object.assign({}, D, {photos: null})); out.photos = NP; return out;
  };
  SW.data = () => SW.normPhotos(JSON.parse(document.getElementById('brochure-data').textContent || '{}'));
  // a phrase of 5 or more words never repeats inside one caption or paragraph
  const words5 = t => String(t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
  SW.rep5 = t => { const w = words5(t), seen = new Set(); for(let i = 0; i + 5 <= w.length; i++){ const k = w.slice(i, i + 5).join(' '); if(seen.has(k)) return k; seen.add(k); } return ''; };
  // two sentences that say the same fact in different words: 60% of the shorter one's content words are in the other (mirrors same_fact() in scripts/fxsets/carousel_copy.py)
  const STOPW = new Set('a an the and of to from with in on at its it is are by for this that one two room its'.split(' '));
  const cw = s => new Set((String(s).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !STOPW.has(w)));
  SW.sameFact = (a, b) => { const A = cw(a), B = cw(b), small = Math.min(A.size, B.size); if(!small) return false; let n = 0; A.forEach(w => { if(B.has(w)) n++; }); return n/small >= 0.6; };
  SW.sentences = txt => String(txt).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
  SW.sameFactIn = txt => { const s = SW.sentences(txt).filter(x => cw(x).size >= 3); for(let i = 0; i < s.length; i++) for(let j = i + 1; j < s.length; j++) if(SW.sameFact(s[i], s[j])) return [s[i], s[j]]; return null; };
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
    return {n: lines.length, fill: last ? (last.r-last.l)/box : 0, min: lines.length ? Math.min(...lines.map(x => (x.r-x.l)/box)) : 0};   // min: the shortest line (owner 11/8: kitchen-box bullets, every line 80%+)
  };
  SW.textWidth = el => { const r = document.createRange(); r.selectNodeContents(el); return pt(r.getBoundingClientRect().width); };
  const html = (lead, sents) => (lead ? `<b>${esc(lead)}</b> ` : '') + esc(sents.join(' '));
  // The sets of whole sentences (the first always stays) that set in exactly T lines with the last line 3/4 full or more.
  // Returns {pick, fill} (fewest sentences first), or null with el.dataset.diag saying how close the pool came.
  const pickFor = (el, T) => {
    // each sentence is a string, or a list of ways to say the same fact at different lengths (only one is ever used)
    const S0 = JSON.parse(el.dataset.s).map(x => [].concat(x)), EX = SW.__excl && SW.__excl.get(el.dataset.slot) ? [...SW.__excl.get(el.dataset.slot)] : [], S1 = EX.length ? S0.map(a => a.filter(t => !EX.some(e => e === t || SW.sameFactShort(e, t)))).filter(a => a.length) : S0, S = S1.length ? S1 : S0, lead = el.dataset.lead || '', n = Math.min(S.length, el.dataset.anyfirst ? 10 : 12);   // captions: 10 lines in play keeps a page's fit within the renderer's time
    let best = null, near = null, hi = null, lo = null;
    const SF = SW.sameFact || FXS.sameFact, cwN = x => (String(x).toLowerCase().match(/[a-z0-9'-]{3,}/g) || []).length;
    const faceS = (!el.__ignoreFace && SF && el.dataset.anyfirst) ? (() => { const f = el.closest('.panel, .sheet'); if(!f) return null; const out = [];
      f.querySelectorAll('[data-slot]').forEach(o => { if(o === el || (o.closest('.cap') && !o.dataset.done) || o.querySelector('[data-slot]') || /(label|kicker|title|heading)$/.test(o.dataset.slot || '')) return; String(o.textContent).split(/(?<=[.!?])\s+/).forEach(x => { if(cwN(x) >= 3) out.push(x); }); });
      return out; })() : null;
    const full = S.map(a => a[0]);
    el.innerHTML = html(lead, full); const A = SW.lines(el), allLen = (lead ? lead.length + 1 : 0) + full.join(' ').length, cpl = allLen / Math.max(.5, A.n - 1 + A.fill);
    const lead0 = lead ? lead.length + 1 : 0;
    const test = pick => {
      if(faceS && pick.some(x => faceS.some(u => SF(u, x)))) return;   // owner 11/8: a caption or box line never says what the page already says (the same rule as the same-fact-on-face check)
      if(SW.rep5((lead ? lead + ' ' : '') + pick.join(' '))) return;
      for(let i = 0; i < pick.length; i++) for(let j = i + 1; j < pick.length; j++) if(SW.sameFact(pick[i], pick[j])) return;   // never the same fact twice in one box
      const est = (lead0 + pick.join(' ').length) / cpl;
      if(est < T - 1.5 || est > T + (el.dataset.linefill ? 1.8 : 0.9)) return;   // box bullets (every line 80%+): a wider screen, the estimate runs short on narrow columns
      el.innerHTML = html(lead, pick);
      const L = SW.lines(el);
      if(L.n === T + 1 && (!hi || L.fill < hi.fill)) hi = {fill: L.fill};
      if(L.n === T - 1 && (!lo || L.fill > lo.fill)) lo = {fill: L.fill};
      if(L.n !== T) return;
      if(!near || L.fill > near.fill) near = {pick, fill: L.fill};
      if(L.fill < 0.76) return;
      if(el.dataset.linefill && (L.min < +el.dataset.linefill || L.fill < +(el.dataset.lastfill || 0.795))) return;   // owner 11/8: box bullets, every natural line 80%+ and the last line 90%+ (then justified)   // owner 11/8 (FXS-28 kitchen box): every line of a box bullet runs at least 80% of its column
      const score = (L.fill >= (+el.dataset.minfill || 0.8) ? 1000 : 500) - pick.length * 10 + L.fill;   // data-minfill (owner 11/7): a last line at 90% of the width wins whenever the sentences allow it   // the fewest, fullest sentences that fill the box; the last line well filled
      if(!best || score > best.score) best = {score, pick, fill: L.fill};
    };
    const walk = (m, i, acc) => {
      if(i === n){ test(acc); return; }
      if(!(m >> i & 1)){ walk(m, i + 1, acc); return; }
      for(const alt of S[i]) walk(m, i + 1, acc.concat(alt));
    };
    for(let m = 1; m < (1 << n); m += (el.dataset.anyfirst ? 1 : 2)) walk(m, 0, []);   // a photo caption may lead with any of its true lines (owner 11/8: captions fill); other boxes keep their first sentence   // the first sentence always stays: it carries the point of the box
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
    document.querySelectorAll('[data-justify]').forEach(e => { e.style.textAlign = 'left'; });   // box bullets fit ragged on every pass (justified again at the end)
    // owner 11/8 (write-ups fill to 90%): the back's write-up keeps its full column, justified, and prefers a last line at 90% or more
    document.querySelectorAll('[data-slot="back.about"]').forEach(e => { e.dataset.minfill = e.dataset.minfill || '0.9'; e.style.textAlign = 'justify'; });
    const issues = [];
    document.querySelectorAll('[data-s]').forEach(e => { e.dataset.fixed = '1'; });
    const caps = [...document.querySelectorAll('.cap .a[data-s]')], rest = [...document.querySelectorAll('[data-s]')].filter(e => !caps.includes(e));
    const settle = (el, T) => {   // T lines: the best set, else the nearest and a report
      const lead = el.dataset.lead || '', b = pfN(el, T);
      if(b){ el.innerHTML = html(lead, b.pick); delete el.dataset.diag; }
      else el.innerHTML = html(lead, el.__near ? el.__near.pick : JSON.parse(el.dataset.s).map(x => [].concat(x)[0]));
      el.dataset.lines = T; el.dataset.done = '1'; return !!b;
    };
    const fitRest = el => {
      // data-try="5,4,3": the line counts this box may take (most lines first); the first that the whole sentences fill (last line 3/4 full) wins
      const tries = (el.dataset.try || '').split(',').map(Number).filter(Boolean);
      if(tries.length){
        let T = tries.find(t => pfN(el, t));
        if(!T){ let bestT = tries[0], bf = -1; tries.forEach(t => { pfN(el, t); if(el.__near && el.__near.fill > bf){ bf = el.__near.fill; bestT = t; } }); T = bestT; }
        settle(el, T);
        if(el.dataset.lh) el.style.height = (T * +el.dataset.lh) + 'pt';
      } else settle(el, +el.dataset.lines || 1);
    };
    const isBox = e => /\.box\./.test(e.dataset.slot || '') || e.classList.contains('bul');
    rest.filter(e => !isBox(e)).forEach(fitRest);   // owner 11/9 (kitchen box full bullets p4): intros first, then the captions (three full lines, never shorter than approved), then the box bullets step around the captions' facts (was: intros, write-ups and the box bullets first; the captions then step around their facts   // owner 11/8: the captions fit next, then the box bullets (their many phrasings step around the captions' facts)
    // the captions in one row share a line count and size
    const soldNote = (() => { let card = ''; try { card = ((JSON.parse(document.getElementById('brochure-data').textContent || '{}').piece) || {}).card || ''; } catch(e){} return e => card === 'sold' && e.dataset.slot === 'front.hero'; })();   // the Just Sold note keeps its opening line ("I just helped sell...")
    const groups = new Map();
    caps.forEach(el => { const g = el.closest('.row') || ('t' + (el.closest('.panel, .sheet, .page') || document.body).dataset.page + Math.round(el.getBoundingClientRect().top/6)); (groups.get(g) || groups.set(g, []).get(g)).push(el); });
    // owner 11/8/2026 (kitchen box full bullets review p2/p3, standing rule for every design): the caption under a photo fills the space
    // under it. It keeps the photo's full width (never narrowed); every line, set ragged, runs 80%+ of that width (the last line 90% when
    // the sentences allow), then it is justified, so its right edge lines up under the photo. When the sentences can't fill the space's lines
    // at the set size, the type grows (fewer, bigger lines in the same space). Never a shorter caption and never empty space under a photo.
    groups.forEach(els => {
      const max = Math.max(...els.map(e => +e.dataset.lines)), lh0 = +els[0].dataset.lh || LH, space = max * lh0;
      const fs0 = els.map(e => parseFloat(e.style.fontSize) || 10);
      els.forEach(e => { if(!soldNote(e)) e.dataset.anyfirst = '1'; e.dataset.narrow = '0'; e.dataset.linefill = '0.8'; e.dataset.lastfill = '0.8'; e.dataset.minfill = '0.9'; e.style.textAlign = 'left'; });
      const size = (k, T, only) => els.forEach((e, i) => { if(only && e !== only) return; const lh = space / T; e.style.fontSize = Math.min(fs0[i] * 1.32, fs0[i] * k) + 'pt'; e.style.lineHeight = lh + 'pt'; e.style.height = space + 'pt'; e.dataset.lh = lh; e.dataset.lines = T; });
      const tries = [1, 1.03, .97, 1.06, 1.09, 1.12].map(k => [max, k]).filter(([T, k]) => fs0.every(f => f * k >= 8.5));   // the space's own lines; the type may grow up to 12% (a bigger jump with fewer lines looked oversized)
      let chosen = null;   // a fact already on the page never repeats in a caption (same-fact-on-face)
      for(const [T, k] of tries){ size(k, T); if(els.every(e => pfN(e, T))){ chosen = [T, k]; break; } }
      const keepLines = els.some(e => /^left\.photo/.test(e.dataset.slot || ''));   // owner 11/9 (kitchen box full bullets p4): never shorter than the approved caption: the inside-left captions keep their three lines
      if(!chosen && max >= 3 && !keepLines){   // owner 11/8 ("as many lines as the space needs ... the font size can go up to fill it"): last resort, one line fewer, bigger type, same space
        const T1 = max - 1, kMax = Math.min(1.25, max / T1);
        for(const k of [kMax, kMax * .97, kMax * .94]){ size(k, T1); if(els.every(e => pfN(e, T1))){ chosen = [T1, k]; break; } }
      }
      if(chosen){ size(chosen[1], chosen[0]); els.forEach(e => { const b = pfN(e, chosen[0]); if(b) e.dataset.filled = '1';   // a neighbor set first may have taken a fact: then this one's closest set, never a repeat
          if(b) settle(e, chosen[0]); else { const pick = e.__near ? e.__near.pick : [JSON.parse(e.dataset.s).map(x => [].concat(x)[0])[0]]; e.innerHTML = html(e.dataset.lead || '', pick); e.dataset.lines = chosen[0]; e.dataset.done = '1'; const face = e.closest('.panel, .sheet'); if(face) face.__used = (face.__used || []).concat(pick); } }); }
      else els.forEach(e => {   // none fills together: each alone at the size it fills (or comes closest) on; the caption-line-short check reports a miss
        let best = null;
        for(const [T, k] of tries){ size(k, T, e); e.__near = null; if(pfN(e, T)){ best = {T, k, fill: 2}; break; } if(e.__near && (!best || e.__near.fill > best.fill)) best = {T, k, fill: e.__near.fill, pick: e.__near.pick}; }
        best = best || {T: max, k: 1};
        size(best.k, best.T, e);
        if(best.fill === 2){ settle(e, best.T); e.dataset.filled = '1'; }
        else if(best.pick){ e.innerHTML = html(e.dataset.lead || '', best.pick); e.dataset.lines = best.T; e.dataset.done = '1'; const face = e.closest('.panel, .sheet'); if(face) face.__used = (face.__used || []).concat(best.pick); }   // the closest set, never one that repeats the page
        else {   // nothing sets in the space: the whole sentences, in order, that fit (never an overflow)
          const S = JSON.parse(e.dataset.s).map(x => [].concat(x)[0]), lead = e.dataset.lead || '', pick = [];
          for(const x of S){ e.innerHTML = html(lead, pick.concat(x)); if(SW.lines(e).n <= best.T) pick.push(x); }
          e.innerHTML = html(lead, pick.length ? pick : [S[0]]); e.dataset.lines = best.T;
        }
      });
      els.forEach(e => { e.dataset.done = '1'; e.style.textAlign = e.dataset.filled ? 'justify' : 'left';   /* a caption that could not fill stays ragged: justifying short lines opens wide word gaps */ e.parentElement.style.height = (CAPPAD + space) + 'pt'; });
    });
    rest.filter(isBox).forEach(fitRest);
    document.querySelectorAll('[data-justify]').forEach(e => { e.style.textAlign = 'justify'; });   // owner 11/8 (write-ups every line 90%+, ideally justified): fitted ragged, then justified
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
    await Promise.all(['300 10pt Montserrat','400 10pt Montserrat','500 10pt Montserrat','600 10pt Montserrat','700 10pt Montserrat','400 10pt "Great Vibes"','400 10pt Oswald','500 10pt Oswald','600 10pt Oswald','700 10pt Oswald'].map(f => document.fonts.load(f)));
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


  // ---------- the set's tokens (fxs40-tokens.css is the one source) and marks ----------
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
  // the stat row texts: beds, baths, square feet, built (four, as FX40)
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
  // owner 11/8/2026 (captions fill the space under their photo): a caption's sentences, then the listing's other true lines about the same room
  // (companion.roomLines[photo].all), so the fitter has enough whole sentences to fill every line; at most 9, no fact twice
  FXS.capPool = (D, c) => { const own = [].concat(c.s || []), R = (((D.companion || {}).roomLines || {})[c.photo] || {}).all || [], key = x => String([].concat(x)[0]).toLowerCase().replace(/[^a-z ]/g, '').slice(0, 24);
    const STOP = /^(the|and|with|from|into|that|this|room|one|its|has|have|sits|runs|over|under|along|each|both|wall|walls)$/, cw = x => new Set(String(x).toLowerCase().match(/[a-z]{4,}/g) || []), near = (a, b) => { const A = cw(a); let k = 0; cw(b).forEach(w => { if(A.has(w) && !STOP.test(w)) k++; }); return k >= 2; };
    const seen = new Set(own.map(key)), out = own.slice(); R.forEach(r => { if(out.length < 10 && !seen.has(key(r)) && !out.some(o => [].concat(o).some(a => near(a, r) || (FXS.sameFact3 && FXS.sameFact3(a, r))))){ seen.add(key(r)); out.push(r); } }); return out; };   // a line that shares two content words with one already in ("tall windows") is the same fact
  FXS.captioned = (D, c, x, y, w, ph, lines, slot, o) => { o = o || {}; const L0 = FXS.leadLabel(c.lead), L = (()=>{ let n = L0.name; const wl = t => FXS.width(t.toUpperCase(), 'font-family:Montserrat;font-weight:600;font-size:9pt;letter-spacing:2pt'); if(wl(n) > w) n = n.split(/ and |, /)[0]; return {name: n, size: L0.size}; })(), lh = o.lh || 13.5, fs = o.fs || 10, showSize = L.size && FXS.width(L.name.toUpperCase(), 'font-family:Montserrat;font-weight:600;font-size:9pt;letter-spacing:2pt') + FXS.width(L.size, 'font-family:Montserrat;font-weight:500;font-size:9pt') + 12 <= w;
    return FXS.box(D, c.photo, x, y, w, ph, slot) +
      `<div class="abs" style="left:${x}pt;top:${y + ph + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(L.name.toUpperCase())}</div>${showSize ? `<span class="rsize" data-size-for="${slot}" style="font:500 9pt/12pt var(--fx-font);color:var(--fx-mute);margin-left:8pt;white-space:nowrap">${esc(L.size)}</span>` : ''}</div>` +
      `<div class="abs cap"><div class="a" style="position:absolute;left:${x}pt;top:${y + ph + 25}pt;width:${w}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-lh="${lh}" data-lines="${lines}" data-narrow="${o.narrow == null ? 10 : o.narrow}" ${sd(FXS.capPool(D, c))}></div></div>`; };

  // ---------- fxs-40 composition: marks ----------
  // the script address on one line at the biggest size that fits w (Pinyon Script)
  FXS.scriptLine = (text, x, y, w, max, min, slot, o) => { o = o || {};
    const css = "font-family:'Pinyon Script'", s = FXS.fitSize(text, css, w, max, min || max*.55), lh = s*(o.lh || 1.2);
    return {s, lh, html: `<div class="abs script" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${lh}pt;font-size:${s}pt;line-height:${lh}pt;${o.css || ''}" data-slot="${slot}" data-lines="1">${esc(text)}</div>`}; };
  // a tracked caps line (gold or white)
  FXS.capsLine = (text, x, y, w, size, track, color, slot, o) => { o = o || {};
    return `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${size*1.4}pt;font:${o.w || 500} ${size}pt/${size*1.4}pt var(--fx-font);letter-spacing:${track}pt;text-transform:uppercase;color:${color};white-space:nowrap;overflow:hidden;text-align:${o.align || 'left'}" data-slot="${slot}" data-lines="1">${esc(text)}</div>`; };
  // the place line: ZIP and neighborhood, the city once ("HOUSTON, TEXAS 77023 · EAST END")
  FXS.placeText = L => { const hood = FXS.hood(L); return `${L.city}, ${L.state} ${L.zip || ''}`.trim().replace(/\s+/g, ' ') + (hood ? ` · ${hood}` : ''); };
  FXS.statHtml = (t, np, lp, track) => { const p = FXS.statParts(t);
    return `<span style="font:500 ${np || 20}pt/1 var(--fx-display);color:var(--fx-ink)">${esc(p.n)}</span>${p.l ? `<span style="font:500 ${lp || 8}pt/1 var(--fx-font);letter-spacing:${track == null ? 2 : track}pt;text-transform:uppercase;color:var(--fx-accent);margin-left:${(lp || 8)*.8}pt">${esc(p.l)}</span>` : ''}`; };

  // ---------- FX40 marks: icons, the pale blue badge, the icon facts, the script agent block ----------
  FXS.SUF = /\s+(Street|St|Drive|Dr|Lane|Ln|Road|Rd|Avenue|Ave|Boulevard|Blvd|Court|Ct|Circle|Cir|Place|Pl|Way|Trail|Trl|Parkway|Pkwy|Terrace|Ter|Highway|Hwy|Row|Square|Loop)\.?$/i;
  const ICONS = {bed: 'M3 19v-9M21 19v-5a2 2 0 0 0-2-2H3M3 16h18M6.5 12V9.5h5V12', bath: 'M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2', sqft: 'M4 4h16v16H4zM4 9h5M15 20v-5h5', built: 'M4 6h16v14H4zM4 11h16M8 3v4M16 3v4'};
  FXS.iconKind = t => /bed/i.test(t) ? 'bed' : /bath/i.test(t) ? 'bath' : /sq/i.test(t) ? 'sqft' : 'built';
  FXS.icon = (k, pt, color) => `<svg class="ico" aria-hidden="true" width="${pt}pt" height="${pt}pt" viewBox="0 0 24 24" fill="none" stroke="${color || 'var(--fx-ink)'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[k]}"/></svg>`;
  // the icon facts: icon, the numeral (Oswald, 16 pt or more) and its small caps label, centered in a column
  FXS.iconCol = (items, x, y, w, pitch, slot, o) => { o = o || {}; const ip = o.icon || 33, np = o.np || 20, lp = o.lp || 8.4;
    return items.map((t, i) => { const p = FXS.statParts(t);
      return `<div class="icof" style="left:${x + (o.h ? i*w : 0)}pt;top:${y + (o.h ? 0 : i*pitch)}pt;width:${w}pt">${FXS.icon(FXS.iconKind(t), ip)}<div data-slot="${slot}.${i}" data-lines="1" style="font:500 ${np}pt/${np*1.2}pt var(--fx-display);color:var(--fx-ink);margin-top:3pt;white-space:nowrap;overflow:hidden">${esc(p.n)}</div>${p.l ? `<div class="t" data-small="1" data-slot="${slot}.${i}.l" data-lines="1" style="font-size:${lp}pt;line-height:${lp*1.2}pt;margin-top:3pt">${esc(p.l)}</div>` : ''}</div>`; }).join(''); };
  FXS.statHtml = (t, np, lp, track) => { const p = FXS.statParts(t);
    return `<span style="font:500 ${np || 20}pt/1 var(--fx-display);color:var(--fx-ink)">${esc(p.n)}</span>${p.l ? `<span style="font:600 ${lp || 8}pt/1 var(--fx-font);letter-spacing:${track == null ? 1.6 : track}pt;text-transform:uppercase;color:var(--fx-ink);margin-left:${(lp || 8)*.8}pt">${esc(p.l)}</span>` : ''}`; };
  FXS.addrParts = D => { const raw = ((SW.data().listing || {}).address) || D.listing.address, sm = FXS.SUF.exec(raw), base = sm ? raw.slice(0, sm.index) : raw, m = /^(\d[\d-]*)\s+(.+)$/.exec(base);
    return {raw, num: m ? m[1] : '', name: m ? m[2] : base, suffix: sm ? sm[1] : ''}; };
  // the pale blue circle badge: the neighborhood in tracked caps over the number and street name in Oswald, the street type under them. Centered on (cx, cy), diameter d (pt).
  FXS.badge = (D, cx, cy, d, o) => { o = o || {}; const L = D.listing, P = FXS.addrParts(D), hood = String(FXS.hood(L) || L.city).toUpperCase(), css = "font-family:Oswald;font-weight:500;letter-spacing:.7pt";
    const inner = d*.8; let s = o.size || d*.2875;
    [P.num, P.name.toUpperCase()].filter(Boolean).forEach(t => { s = Math.min(s, FXS.fitSize(t, css, inner, s, d*.1)); });
    let hs = Math.max(o.minSmall || 8.5, d*.053); while(hs > (o.minSmall || 8.5) && FXS.width(hood, `font-family:Montserrat;font-weight:600;font-size:${hs}pt;letter-spacing:${hs*.1}pt`) > d*.5) hs -= .25; const hcss = t => `font-family:Montserrat;font-weight:600;font-size:${hs}pt;letter-spacing:${hs*.35}pt`;
    let htr = hs*.35; if(FXS.width(hood, hcss()) > d*.5){ htr = hs*.1; }
    const noHood = FXS.width(hood, `font-family:Montserrat;font-weight:600;font-size:${hs}pt;letter-spacing:${hs*.1}pt`) > d*.62;
    const lines = (P.num ? 1 : 0) + 1, ha = s*.98*lines, g1 = d*.055, sufS = Math.max(o.minSmall || 8.5, d*.047), total = (noHood ? 0 : hs*1.25 + g1) + ha + (P.suffix ? d*.03 + sufS*1.3 : 0), top = (d - total)/2;
    const ttl = P.num ? `${esc(P.num)}<br>${esc(P.name.toUpperCase())}` : esc(P.name.toUpperCase());
    const html = `<div class="badge" data-badge="1" style="left:${cx - d/2}pt;top:${cy - d/2}pt;width:${d}pt;height:${d}pt;${o.dark ? 'background:var(--fx-ink);color:#fff' : ''}">
      ${noHood ? '' : `<div class="k" data-small="1" data-slot="badge.place" data-lines="1" style="${o.dark ? 'color:#fff;' : ''}top:${top}pt;font-size:${hs}pt;line-height:${hs*1.25}pt;letter-spacing:${htr}pt;padding-left:${htr}pt">${esc(hood)}</div>`}
      <div class="a" data-slot="address" data-lines="${lines}" style="${o.dark ? 'color:#fff;' : ''}top:${top + (noHood ? 0 : hs*1.25 + g1)}pt;height:${ha}pt;font-size:${s}pt;line-height:.98;white-space:nowrap">${ttl}</div>
      ${P.suffix ? `<div class="k" data-small="1" data-slot="badge.suffix" data-lines="1" style="${o.dark ? 'color:#fff;' : ''}top:${top + (noHood ? 0 : hs*1.25 + g1) + ha + d*.03}pt;font-size:${sufS}pt;line-height:${sufS*1.3}pt;letter-spacing:${sufS*.33}pt;padding-left:${sufS*.33}pt;font-weight:600">${esc(P.suffix.toUpperCase())}</div>` : ''}</div>`;
    return {html, s, noHood}; };
  // text that sets in one line at the biggest size that fits (Montserrat 600 for the agent name; owner 11/7: never script)
  FXS.scriptLine = (text, x, y, w, max, min, slot, o) => { o = o || {};
    // owner 11/7: the agent name sets in Montserrat 600, never script; sizes given for the old script scale by .8 to about the same visual size
    const css = "font-family:Montserrat;font-weight:600", s = FXS.fitSize(text, css, w, max*.8, (min || max*.55)*.8), lh = s*(o.lh || 1.14);
    return {s, lh, html: `<div class="abs script" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${lh}pt;font-size:${s}pt;line-height:${lh}pt;${o.css || ''}" data-slot="${slot}" data-lines="1">${esc(text)}</div>`}; };
  FXS.capsLine = (text, x, y, w, size, track, color, slot, o) => { o = o || {};
    return `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${size*1.4}pt;font:${o.w || 600} ${size}pt/${size*1.4}pt ${o.font || 'var(--fx-font)'};letter-spacing:${track}pt;text-transform:uppercase;color:${color};white-space:nowrap;overflow:hidden;text-align:${o.align || 'left'}" data-slot="${slot}" data-lines="1">${esc(text)}</div>`; };
  FXS.placeText = L => `${L.city}, ${/^texas$/i.test(L.state) ? 'TX' : L.state} ${L.zip || ''}`.trim();
  // the agent block, left aligned at (x, y): the script name, REALTOR(R), the phone big and plain (never script), the email
  FXS.agent = (A, x, y, w, hsSrc, o) => { o = o || {}; const hs = hsSrc ? (o.hs || 62) : 0, tx = x + (hs ? hs + 12 : 0), tw = w - (hs ? hs + 12 : 0), ns = o.name || 52.5;
    const nm = FXS.scriptLine(A.name || '', tx, y, tw, ns, 30, 'agent.name', {lh: 1.14}), yy = y + nm.lh + (o.gap == null ? 8 : o.gap), ps = o.phone || 21;
    return (hs ? `<div class="abs hsbox" style="left:${x}pt;top:${y + 6}pt;width:${hs}pt;height:${hs*1.2}pt"><img src="${esc(hsSrc)}" alt=""></div>` : '') + nm.html +
      `<div class="abs" style="left:${tx + 2}pt;top:${yy}pt;width:${tw}pt;font:600 9.75pt/12pt var(--fx-font);letter-spacing:3pt;color:var(--fx-mute)" data-slot="agent.desig" data-lines="1">REALTOR®</div>` +
      `<div class="abs" style="left:${tx + 2}pt;top:${yy + 16}pt;width:${tw}pt;height:${ps*1.25}pt;white-space:nowrap;display:flex;align-items:baseline"><span style="font:600 8.25pt/1 var(--fx-font);letter-spacing:1.5pt;color:var(--fx-mute);margin-right:7pt">CELL</span><span data-slot="agent.phone" data-lines="1" style="font:600 ${ps}pt/${ps*1.25}pt var(--fx-font);color:var(--fx-ink);letter-spacing:.3pt">${esc(A.phone || '')}</span></div>` +
      `<div class="abs" style="left:${tx + 2}pt;top:${yy + 16 + ps*1.25 + 2}pt;width:${tw}pt;font:400 12.75pt/16.5pt var(--fx-font);color:var(--fx-mute);white-space:nowrap;overflow:hidden" data-slot="agent.email" data-lines="1">${esc(A.email || '')}</div>`; };
  // where the whole house ends on the page (y, pt) when the photo covers the box (x, y, w, h)
  FXS.houseBottom = (D, id, x, y, w, h) => { const p = (D.photos || {})[id] || {}; if(!p.box || !p.w || !p.h) return y + h*.75; const [x0, y0, x1, y1] = p.box, ia = p.w/p.h, ta = w/h, vh = ia > ta ? 1 : ia/ta;
    const off = vh >= 1 ? 0 : Math.min(1 - vh, Math.max(0, (y0 + y1)/2 - vh/2)); return y + ((y1 - off)/vh)*h; };
  FXS.coverRooms = () => [];

  // ---------- the cover (also the flyer front): the house top left, the icon facts down the right, the badge over the photo's lower edge, write-up, script name ----------
  FXS.cover = (D, o) => { o = o || {};
    const L = D.listing, A = D.agent || {}, F = ((D.companion || {}).flyer || {}).front || {}, K = (D.sw || {}).front || {};
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    const M = 36, heroId = F.hero || K.hero || 'front', HW = 504;
    let hh = 427.5; while(hh < 468 && !SW.fits(D, heroId, HW, hh + 9)) hh += 4;
    let h = FXS.box(D, heroId, -9, -9, HW, hh + 9, 'front.house');
    const hb = FXS.houseBottom(D, heroId, -9, -9, HW, hh + 9), d = 240, bt = Math.max(hh - 97, hb + 4), cx = 411;
    h += FXS.iconCol(FXS.statItems(L).slice(0, 4), 512, 24, 82, 80, 'fact');
    h += FXS.badge(D, cx, bt + d/2, d).html;
    // owner 11/7 (FXS-24 rules): no agent or brokerage on the cover; the write-up runs the full left column down to the blue band, a room photo fills the space under the seal
    const bandY = 738, lh = 19.5, wuY = Math.max(hh + 19.5, 447), wuEnd = bandY - 14, nL = Math.max(3, Math.floor((wuEnd - wuY)/lh)), tr = []; for(let t = nL; t >= Math.max(3, nL - 3); t--) tr.push(t);
    const introPool = (o.intro || F.intro || K.summary || []), poolTxt = JSON.stringify(introPool).toLowerCase(), tagsAll = (K.tags || F.tags || []).filter(tg => !String(tg).toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 4 && !/^(new|with|ceilings|floors)$/.test(w)).some(w => poolTxt.includes(w)));
    h += `<div class="abs wu" data-slot="front.summary" data-lines="${nL}" data-try="${tr.join(',')}" data-lh="${lh}" data-narrow="5" ${sd(introPool)} style="left:${M}pt;top:${wuY}pt;width:238pt;height:${nL*lh}pt;font-size:12pt;line-height:${lh}pt"></div>`;
    { const ry = bt + d + 16, rx = 292, rw = 576 - rx, rh = wuEnd - ry, rk = x => String(x).replace(/\d+[a-z]?$/, ''), rightK = new Set([].concat(...((((D.sw || {}).right || {}).rows) || [])).map(c => rk(c.photo))), room = ((K.row || []).map(r => r.photo).concat(Object.keys(D.photos || {}))).find(id => id !== heroId && !FXS.isHouse(D, id) && !(FXS.OUTSIDE && FXS.OUTSIDE.test(id)) && !rightK.has(rk(id)) && /family|living|kitchen|primary|dining|game|bed/.test(id)); if(room && rh >= 96) h += FXS.box(D, room, rx, ry, rw, rh, 'front.room0'); }
    const tags = tagsAll.length >= 2 ? tagsAll : [];
    h += `<div class="bluebar" style="left:-9pt;top:${bandY}pt;width:630pt;height:63pt"></div>`;
    if(tags.length) h += FXS.capsLine(tags.slice(0, 4).join('  ·  '), M, bandY + 5, 540, 8.4, 2.2, 'var(--fx-ink)', 'front.tags', {align: 'center'});
    h += FXS.capsLine(FXS.placeText(L), M, bandY + (tags.length ? 19 : 14), 540, 12, 4.5, 'var(--fx-ink)', 'place', {align: 'center', w: 500, font: 'var(--fx-display)'});
    return h;
  };

  // ---------- the plan card (IvoryPlan) at (x, y, w): returns {html, bottom, issues} ----------
  FXS.planCard = (D, x, y, w, maxH, fillTo) => {   // fillTo (owner 11/7, no blank space): the card runs down to fillTo, the plan centered in it
    const iw = w - 28.8, planRot = (() => { const r0 = IvoryPlan.draw(D.plan, {x: x + 14.4, y: 0, w: iw, h: 250}, {allowRotate: false}); return (r0.issues || []).some(i => /label-wont-fit/.test(i.kind)); })();
    const fit = mh => { for(let hh = mh; hh >= 130; hh -= 6){ const big = IvoryPlan.draw(D.plan, {x: x + 14.4, y: 0, w: iw, h: hh}, {allowRotate: planRot}); if(!(big.issues || []).some(i => i.kind === 'plan-under-300ppi')) return Math.min(hh, Math.ceil(big.usedH || hh) + 6); } return 200; };
    const ph = fit(maxH), ext = fillTo ? Math.max(0, fillTo - (y + ph + 36)) : 0, y0 = y + ext/2, r = IvoryPlan.draw(D.plan, {x: x + 14.4, y: y0 + 8, w: iw, h: ph - 4}, {allowRotate: planRot});
    const zs = IvoryPlan.zonesOf(D.plan);
    const leg = Object.entries(IvoryPlan.ZONES).filter(([k]) => zs.includes(k)).map(([k, z]) => `<span><i style="background:color-mix(in srgb, ${z.fill} ${Math.round(z.op*100)}%, var(--fx-paper))"></i>${z.label}</span>`);
    if(zs.includes('outdoor')) leg.push(`<span><i style="background:repeating-linear-gradient(45deg, color-mix(in srgb, var(--accent) 35%, var(--fx-paper)) 0 .6pt, var(--fx-paper) .6pt 2.8pt)"></i>Outdoor</span>`);
    const note = (D.plan.source || 'The listing floor plan, placed as given.') + ' Sizes are approximate.' + ((r.angle === 90 || r.angle === 270) ? ' Turned on its side.' : '');
    const ly = y0 + ph + 6, bottom = ly + 30 + ext/2;
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
    if(has(/soaring ceilings/i)) add(inside, 'Soaring ceilings');
    if(has(/quartz/i) && has(/island/i)) add(inside, 'Quartz-top island');
    if(has(/soaking tub/i)) add(inside, 'Soaking tub');
    if(has(/arched windows/i)) add(inside, 'Arched windows');
    if(has(/\bdeck\b/i) && has(/pergola/i)) add(outside, 'Wood deck with a pergola'); else if(has(/\bdeck\b/i)) add(outside, 'Wood deck'); else if(has(/pergola/i)) add(outside, 'Pergola');
    if(has(/fully fenced|fenced yard|fenced backyard|fencing/i)) add(outside, 'Fenced yard');
    if(has(/rooftop patio/i)) add(outside, 'Rooftop patio');
    else if(has(/covered patio/i)) add(outside, 'Covered patio'); else if(has(/\bpatio\b/i)) add(outside, 'Patio');
    if(has(/second-floor balcony/i)) add(outside, 'Second-floor balcony'); else if(has(/balcon/i)) add(outside, 'Balcony');
    if(has(/turf/i)) add(outside, 'Turf backyard');
    if(has(/mature trees/i)) add(outside, 'Mature trees');
    if(has(/community park|gazebo/i)) add(outside, 'Community park with a gazebo');
    const yr = L.yearBuilt || L.year, lot = L.lotSize ? String(L.lotSize).replace(/\s*Sq Ft Lot/i, ' sq ft lot') : '';
    [L.stories ? (L.stories == 1 ? 'One story, no stairs' : `${L.stories} stories`) : ''].forEach(t => { if(inside.length < 7) add(inside, t); });
    [lot, L.stories ? (L.stories == 1 ? 'One story, no stairs' : `${L.stories} stories`) : ''].forEach(t => { if(outside.length < 3) add(outside, t); });
    return {inside, outside};
  };

  // ---------- the back (also the flyer back): outdoor photo, the "THE DETAILS" badge, About the house, the plan or a second outdoor photo, two thin boxes, the agent ----------
  FXS.back = (D, o) => { o = o || {};
    const L = D.listing, A = D.agent || {}, b = D.brand || {}, hasPlan = !!D.plan, M = 36;
    const F = (D.companion || {}).flyer || {}, FB = F.back || {}, KB = (D.sw || {}).back || {};
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    const used = [(((D.sw||{}).front||{}).hero) || 'front'].concat(o.avoid || []);
    const first = (hasPlan ? FB.photos : (FB.photosNoplan || FB.photos)) || [];
    const all = FXS.cards(D, first), issues = [];
    const SF = FXS.sellingFacts(D), nearRaw = (FB.nearby || KB.nearby || []).slice(0, 3), near = nearRaw.map(FXS.nearText);
    if((D.piece || {}).__break === 'few-bullets') SF.inside = SF.inside.slice(0, 3);
    issues.push(...SW.nearbyCheck(nearRaw));
    const covTxt = JSON.stringify(o.coverText || ''), c1x = SF.inside.filter(t => !(/garage/i.test(t) && /garage/i.test(covTxt)));
    const tallPlan = hasPlan && ((D.plan || {}).levels || []).length >= 3;   // three or four floors: the plan gets the full width under the boxes
    const maxRows = tallPlan ? 5 : 7, c1 = c1x.slice(0, maxRows), c2 = SF.outside.slice(0, Math.max(0, maxRows - near.length)).concat(near);
    const rowsN = Math.max(5, c1.length, c2.length);
    const bottom = 660, cx0 = 372, rx = 387, rw = 207, P0w = cx0 + 9; let P0h = 224;
    const fits = (c, w, h) => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, w, h);
    let pool = FXS.pick(D, all, 6, {avoid: used, exactAvoid: true, outdoor: true, house: true});
    const p0 = pool.find(c => fits(c, P0w, P0h)) || pool[0]; pool = pool.filter(c => c !== p0);
    const leftW = 324, leftH = 200, rightH = 130;
    const bulletTxt = c1.concat(c2), pools = x => [].concat(x), dupOf = t => bulletTxt.some(bt => SW.sameFactShort(bt, t));
    const stripCard = c => { if(!c) return c; const kept = (c.s || []).filter(x => !pools(x).some(dupOf)); return kept.length >= 2 ? Object.assign({}, c, {s: kept}) : c; };
    let pl = pool.find(c => !hasPlan && fits(c, leftW, leftH)); if(pl) pool = pool.filter(c => c !== pl); pl = stripCard(pl);
    let pr = pool.find(c => fits(c, rw, rightH));
    // owner 11/7: no empty band under the two boxes: when the set's back list has no third outdoor photo, any unused outdoor or community photo of the listing fills the slot
    if(!pr){ const near = /deck|pergola|patio|fence|evening|dusk|twilight|night/, onPage = [p0, pl].filter(Boolean).map(c => c.photo), clash = id => onPage.some(o => o.replace(/\d+[a-z]?$/, '') === id.replace(/\d+[a-z]?$/, '') || (near.test(o) && near.test(id)));
      pr = FXS.cards(D, []).filter(c => FXS.OUTSIDE.test(c.photo) && !FXS.isHouse(D, c.photo) && !used.includes(c.photo) && !clash(c.photo)).sort((p, q) => FXS.archScore(D, q.photo) - FXS.archScore(D, p.photo))[0]; }
    pr = stripCard(pr);
    const bigTop = !hasPlan && !pl && p0 && fits(p0, P0w, 409); if(bigTop) P0h = 409;   // no second outdoor photo: the top photo takes the room
    let h = `<div class="bluebar" style="left:${cx0}pt;top:-9pt;width:${621 - cx0}pt;height:${(tallPlan ? 372 : bottom) + 9}pt"></div>`;
    if(p0) h += FXS.box(D, p0.photo, -9, -9, P0w, P0h, 'back.photo0');
    const bd = 150, bcx = cx0 - bd/2, bcy = P0h - 9 + 9;
    h += `<div class="badge" style="left:${bcx - bd/2}pt;top:${bcy - bd/2}pt;width:${bd}pt;height:${bd}pt;background:var(--fx-ink)"><div class="a" data-slot="details.title" data-lines="2" style="top:${(bd - 2*32)/2}pt;font-size:32pt;line-height:32pt;color:#fff;font-weight:500;white-space:nowrap">THE<br>DETAILS</div></div>`;
    // the lead label over the left column (a bold label opens each photo caption: "Front.")
    const L0 = p0 ? FXS.leadLabel(p0.lead) : {name: ''};
    // About the house: narrow beside the badge
    const aboutY = P0h - 9 + 16;
    const aboutS = [].concat(...(FB.floors || []).map(f => f.s));
    const nk = x => String(x).toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 40), shownSet = new Set([p0, pl, pr].filter(Boolean).flatMap(c => [].concat(...(c.s || []).map(x => [].concat(x)))).map(nk));
    const SZ0 = /\d+['\u2019]\s*(?:\d+["\u201d]?\s*)?x\s*\d+['\u2019]/, aboutKept = aboutS.filter(x => ![].concat(x).some(a => shownSet.has(nk(a)) || dupOf(a) || SZ0.test(a)));
    // owner 11/7 (fold-over review p20): the About write-up runs the whole left column and wraps around the blue THE DETAILS dot on its right
    // (a float with a circular shape-outside), and fills its space: the line count follows how much real copy there is
    const aPool0 = aboutKept.length >= 3 ? aboutKept : aboutS, shownG = /garage/i.test(JSON.stringify([c1, c2, [p0, pl, pr].filter(Boolean).map(c => c.s), ((D.companion || {}).flyer || {}).front || {}, (D.sw || {}).front || {}])), /* the cover and the back are one outside spread: the garage is said once */ aPool = aPool0.filter(x => !(shownG && /garage/i.test(JSON.stringify(x)))), alh = 17, aw = leftW, afs = 11;
    const aTop = aboutY + 26, dotR = bd/2 + 7, fw = Math.max(0, M + aw - (bcx - dotR)), fh = Math.max(0, bcy + dotR - aTop);
    const aChars = FXS.width(aPool.map(x => [].concat(x).slice(-1)[0]).join(' '), `font-family:Montserrat;font-weight:300;font-size:${afs}pt`), aEst = Math.floor(aChars/(aw - 12) + (fw && fh ? (fh/alh)*(fw/aw) : 0));
    const aLines = Math.max(4, Math.min(hasPlan ? 6 : bigTop ? 11 : 9, aEst)),   // with a plan, the write-up never takes the plan's room (it keeps the 11/2 plan height)
     aDummy = 0, aTry = []; for(let t = aLines; t >= Math.max(3, aLines - 3); t--) aTry.push(t);
    h += `<div class="abs" style="left:${M}pt;top:${aboutY}pt">${FXS.label('About the house', 'back.about.label')}</div>`;
    h += `<div class="abs body wrapdot" data-slot="back.about" data-lines="${aLines}" data-try="${aTry.join(',')}" data-lh="${alh}" data-narrow="3" ${sd(aPool)} style="left:${M}pt;top:${aTop}pt;width:${aw}pt;height:${aLines*alh}pt;font-size:${afs}pt;line-height:${alh}pt;--fw:${fw}pt;--fh:${fh}pt;--dr:${dotR}pt;--dx:${bcx - (M + aw - fw)}pt;--dy:${bcy - aTop}pt"></div>`;
    const leftTop = aboutY + 26 + aLines*alh + 14;
    if(hasPlan){
      const pc = tallPlan ? FXS.planCard(D, M, Math.max(leftTop, 380), 540, Math.max(130, bottom - Math.max(leftTop, 380) - 36)) : FXS.planCard(D, M, leftTop, leftW, Math.max(130, bottom - leftTop - 36), bottom); h += pc.html; issues.push(...pc.issues); window.planIssues = pc.issues;
    } else if(pl){
      const ph = Math.max(110, bottom - leftTop - 25 - 3*13.5 - 2);
      h += FXS.captioned(D, pl, M, leftTop, leftW, ph, 3, 'back.photo1', {narrow: 12, fs: 10, lh: 13.5});
    }
    // the two thin boxes in the pale blue column
    const rowsH = r => 48 + r*r_;
    let r_ = 21, boxTop = 24;
    const ph2 = pr ? rightH : 0, capBlock = pr ? 25 + 3*12.5 + 14 : 0;
    const availBoxes = (tallPlan ? 340 : bottom) - boxTop - 14 - (pr && !tallPlan ? rightH + capBlock : 0);
    r_ = Math.max(18, Math.min(pr || tallPlan ? 30 : 38, (availBoxes/2 - 48)/rowsN));   // no photo under the boxes: they grow to the column foot (owner 11/7, no empty band)
    const cardH = 48 + rowsN*r_;
    [['Highlights', c1, 'back.updates'], ['Outside and nearby', c2, 'back.outside']].forEach(([title, list, slot], i) => {
      const y = boxTop + i*(cardH + 14);
      h += `<div class="card" style="left:${rx}pt;top:${y}pt;width:${rw}pt;height:${cardH}pt"></div>`;
      h += `<div class="abs" style="left:${rx + 16}pt;top:${y + 12}pt">${FXS.label(title, slot + '.title')}</div>`;
      const want = Math.min(rowsN, list.length), BFS = [11.5, 11.25, 11, 10.75, 10.5, 10.25, 10].find(f => FXS.bullets(list, 0, 0, rw - 28, 20, slot, rowsN, f).n >= want) || 10, n0 = FXS.bullets(list, 0, 0, rw - 28, 20, slot, rowsN, BFS).n, rh_ = (cardH - 48)/Math.max(1, n0), bl = FXS.bullets(list, rx + 16, y + 40, rw - 28, rh_, slot, rowsN, BFS); /* owner 11/7 (p20): bigger type in the white boxes */ h += bl.html;   // each box spaces its own bullets to fill the shared box height
      if(bl.n < 5 || bl.n > 7) issues.push({slot, kind: 'box-bullets-out-of-range', detail: `${title} holds ${bl.n} bullets; 5 to 7 are required`});
    });
    if(pr && !tallPlan){ const y = boxTop + 2*(cardH + 14), ph = Math.max(95, bottom - y - capBlock + 14 - 14 + 0);
      h += FXS.captioned(D, pr, rx, y, rw, Math.min(ph, bottom - y - 25 - 3*12.5), 3, 'back.photo2', {narrow: 12, fs: 9, lh: 12.5}); }
    // box topics never repeat an inside box
    issues.push(...FXS.boxTopicCheck(D, ['Highlights', 'Outside and nearby']));
    // the standard agent card, then the fine print
    // owner 11/7 (p20): the contact block sits centered up and down between the boxes' foot (660) and the page bottom; the fine print right under it
    h += ContactCard.html([M, 690, 540, 74], Object.assign({}, A, {headshot: hsSrc}), Object.assign({}, b, {logo: b.logo}), {layout: 'panel', size: 'mid', fine: '', bottomGap: 0.5, fieldAccent: true});
    h += `<div class="abs fine" style="left:${M}pt;top:765pt;width:540pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">Information deemed reliable but not guaranteed.</div>`;
    return {html: h, issues};
  };
  // a back box never repeats a topic the inside pages already cover (compares the back titles with the inside box's kicker and heading)
  FXS.boxTopicCheck = (D, titles) => { const B = ((D.sw || {}).left || {}).box || {}, stop = new Set('the a an and of to in new whats what is made for big work done'.split(' ')), w = t => (String(t).toLowerCase().match(/[a-z]+/g) || []).filter(x => !stop.has(x) && x.length > 3);
    const inside = new Set(w((B.kicker || '') + ' ' + (B.l || ''))), out = [];
    titles.forEach(t => { if(String(t).toLowerCase() === String(B.kicker || '').toLowerCase() || w(t).some(x => inside.has(x))) out.push({slot: 'back.box', kind: 'box-topic-repeats-inside', detail: `"${t}" repeats the inside box "${B.kicker}"`}); });
    return out; };

  // a slate circle carrying a short title in Oswald caps (the FX40 "THE DETAILS" mark), centered on (cx, cy)
  FXS.titleBadge = (text, cx, cy, d, slot, fixed) => { const w = String(text).toUpperCase().replace(/[.'’]/g, '').split(/\s+/).filter(Boolean), n = w.length > 4 ? 3 : w.length > 1 ? 2 : 1, per = Math.ceil(w.length/n), ls = []; for(let i = 0; i < w.length; i += per) ls.push(w.slice(i, i + per).join(' '));
    const css = "font-family:Oswald;font-weight:500;letter-spacing:.8pt", s = fixed ? d*.165 : Math.min(...ls.map(t => FXS.fitSize(t, css, d*.74, d*.2, 11))), lh = s*1.05;
    return `<div class="badge" style="left:${cx - d/2}pt;top:${cy - d/2}pt;width:${d}pt;height:${d}pt;background:var(--fx-ink)"><div class="a" data-slot="${slot}" data-lines="${ls.length}" style="top:${(d - ls.length*lh)/2}pt;font-size:${s}pt;line-height:${lh}pt;letter-spacing:.8pt;color:#fff;font-weight:500">${ls.map(esc).join('<br>')}</div></div>`; };
  SW.dedupPool = (pool, others) => { const kept = (pool || []).filter(x => ![].concat(x).some(a => (others || []).some(o2 => SW.sameFactShort(o2, a)))); return kept.length >= 3 ? kept : pool; };
  // a carousel badge label: short, so every badge sets at one size ("FAMILY + DINING", "GUEST BATH")
  FXS.roomLabel = n => { let t = String(n).replace(/\.$/, '').trim().replace(/\s+and\s+/i, ' + ').replace(/^downstairs bedroom$/i, 'Bedroom').replace(/^downstairs bath$/i, 'Guest bath').replace(/^family room \+ dining( area)?$/i, 'Family + dining').replace(/^kitchen \+ dining.*$/i, 'Kitchen + dining'); const w = t.split(/\s+/); return w.length > 3 ? w.slice(0, 2).join(' ') : t; };
  // kicker label + a one-line Oswald title (fits its width) + an intro of whole sentences; returns {html, bottom}
  FXS.pageHead = (kicker, title, intro, slot, lines, y0, o) => { o = o || {}; const M = o.x == null ? 36 : o.x, CW = o.w || 540, Y0 = y0 == null ? 30 : y0;
    const ts = FXS.fitSize(title, "font-family:Oswald;font-weight:500;letter-spacing:.4pt", o.tw || CW, 26, 19), lh = 19.5, tr = []; for(let t = lines; t >= 3; t--) tr.push(t);
    const ty = Y0 + (kicker ? 24 : 0), iy = ty + ts*1.25 + 8;
    return {html: `${kicker ? `<div class="abs" style="left:${M}pt;top:${Y0}pt">${FXS.label(kicker, slot + '.kicker')}</div>` : ''}
      <div class="abs ttl" style="left:${M}pt;top:${ty}pt;width:${o.tw || CW}pt;height:${ts*1.25}pt;font-size:${ts}pt;line-height:${ts*1.25}pt;letter-spacing:.4pt" data-slot="${slot}.title" data-lines="1">${esc(title)}</div>
      <div class="abs wu${o.wrap ? ' wrapc' : ''}" data-slot="${slot}.intro" data-lines="${lines}" data-try="${tr.join(',')}" data-lh="${lh}" ${sd(intro)} ${o.wrap ? 'data-linefill="0.6" data-lastfill="0.85" data-minfill="0.9" data-justify="1" data-narrow="0"' : o.fill ? 'data-linefill="0.6" data-lastfill="0.8" data-minfill="0.9" data-justify="1"' : ''} style="left:${M}pt;top:${iy}pt;width:${CW}pt;height:${lines*lh}pt;font-size:12pt;line-height:${lh}pt${o.wrap ? (() => { const W = o.wrap, fw = M + CW - (W.cx - W.r) + (W.m || 10), fh = Math.max(0, W.cy + W.r + (W.m || 10) - iy); return `;--fw:${fw}pt;--fh:${fh}pt;--fr:${W.r + (W.m || 10)}pt;--fx:${fw - (M + CW - W.cx)}pt;--fy:${W.cy - iy}pt`; })() : ''}"></div>`, bottom: iy + lines*lh}; };
  // owner 11/9 (kitchen box full bullets p4): an intro beside a title circle wraps around it: the lines beside the circle stop at its edge, the rest run the full column
  if(!document.getElementById('fx-wrapc')){ const st = document.createElement('style'); st.id = 'fx-wrapc'; st.textContent = '.wu.wrapc::before{content:"";float:right;width:var(--fw);height:var(--fh);shape-outside:circle(var(--fr) at var(--fx) var(--fy))}'; document.head.appendChild(st); }


  // pages that run through OHL / FXP (Open House flyer, email, socials): the repeated-phrase and duplicate-sentence checks ride on their brochureCheck
  FXS.repCheck = () => { const out = [], seenS = new Map();
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return;
      const sf = SW.sameFactIn(el.textContent); if(sf) out.push({slot: el.dataset.slot, kind: 'same-fact-twice', detail: `"${sf[0].slice(0, 50)}" and "${sf[1].slice(0, 50)}" say the same thing`});
      const txt = String(el.textContent), r = SW.rep5(txt); if(r) out.push({slot: el.dataset.slot, kind: 'repeated-phrase', detail: `"${r}" repeats in one block`});
      txt.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x.length >= 28).forEach(x => { const k = x.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 48), prev = seenS.get(k);
        if(prev && prev !== el.dataset.slot) out.push({slot: el.dataset.slot, kind: 'duplicate-sentence', detail: `"${x.slice(0, 60)}" also in ${prev}`}); else seenS.set(k, el.dataset.slot); }); });
    return out; };
  FXS.hookCheck = () => { let bc = null; Object.defineProperty(window, 'brochureCheck', {configurable: true, get: () => bc, set: v => { bc = typeof v === 'function' ? (() => v().concat(FXS.repCheck(), FXS.ohCheck())) : v; }}); };


  // a fact that two blocks on one face both say is dropped from the block that can say something else (its caption or write-up refills without it)
  const __fillOnce = SW.fill;
  SW.fill = () => { SW.__excl = new Map(); let iss = __fillOnce();
    for(let it = 0; it < 6; it++){ const found = SW.factPairs(); if(!found.length) break; found.forEach(f => { if(!SW.__excl.has(f.slot)) SW.__excl.set(f.slot, new Set()); SW.__excl.get(f.slot).add(f.x); }); iss = __fillOnce(); }
    return iss; };
  SW.factPairs = () => { const drop = [];
    FACES().forEach(pn => { const items = [];
      pn.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]') || /(\.label|\.title|\.kicker)$/.test(el.dataset.slot) || /^(agent|broker|fineprint|back\.fine|back\.return|plan|fact|front\.fact|oh\.|address|place|front\.place|front\.address|badge|moment|front\.status|back\.status|room\.|details|left\.badge)/.test(el.dataset.slot)) return;
        SW.sentences(el.textContent).filter(x => cwg(x).size >= 2).forEach(x => items.push({el, slot: el.dataset.slot, x})); });
      for(let i = 0; i < items.length; i++) for(let k = i + 1; k < items.length; k++){ const a = items[i], b = items[k]; if(a.slot === b.slot || !SW.sameFactShort(a.x, b.x)) continue;
        const cap = it => it.el.hasAttribute('data-s') && /photo|outside|updates/.test(it.slot), pick = cap(b) ? b : cap(a) ? a : (/box\.t/.test(a.slot) && /box\.t/.test(b.slot) && b.el.hasAttribute('data-s')) ? b : null; if(pick && !drop.some(d0 => d0.slot === pick.slot && d0.x === pick.x)) drop.push({slot: pick.slot, x: pick.x}); } });
    return drop; };

  // ---------- fxs-40 checks (each is proven to fail when broken: out/fxsets/fxs-40/proof.py) ----------
  const toPt = v => v*72/96;
  const FACES = () => { const a = document.querySelectorAll('.panel, .sheet'); return a.length ? a : document.querySelectorAll('.page'); };
  const sepEnd = /(^\s*[·•|\-–—,;]\s)|(\s[·•|\-–—,;]\s*$)/;
  // 1. nothing runs past the trim or the bottom margin (text, cards, the agent card); margin 18 pt on letter pieces and fold-over panels, 9 pt on postcards
  SW.offPage = (margin) => { const out = [];
    FACES().forEach(pn => { const pr = pn.getBoundingClientRect(), W = toPt(pr.width), H = toPt(pr.height); if(W < 100) return;
      pn.querySelectorAll('[data-slot], .cc, .card, .plan-svg').forEach(el => { if(el.closest('.ph, .bluebar, .mg') || !el.getClientRects().length) return; const r = el.getBoundingClientRect(); if(r.width < 1 || r.height < 1) return;
        const l = toPt(r.left - pr.left), t = toPt(r.top - pr.top), rr = toPt(r.right - pr.left), b = toPt(r.bottom - pr.top);
        if(rr > W - margin + .6 || b > H - margin + .6 || l < margin - .6 || t < margin - .6) out.push({slot: el.dataset.slot || el.className, kind: 'off-page', detail: `runs to ${rr.toFixed(0)} x ${b.toFixed(0)} pt on a ${W.toFixed(0)} x ${H.toFixed(0)} pt page (margin ${margin} pt)`}); }); });
    return out; };
  // 2. no fact twice on one face (two different blocks that say the same thing; mirrors same_fact() in scripts/fxsets/carousel_copy.py, short sentences included)
  const GEN = new Set(['new', 'updated', 'replaced', 'all', 'has', 'have', 'sits', 'sit', 'runs', 'run', 'miles', 'mile', 'park', 'wall', 'walls', 'room', 'rooms', 'floor', 'floors', 'second', 'first', 'third', 'ground', 'level', 'front', 'back', 'primary', 'suite', 'bedroom', 'bedrooms', 'bath', 'family', 'dining', 'area', 'kitchen', 'house', 'home', 'door', 'windows', 'window']); const cwg = s => new Set([...cw(s)].filter(w => !GEN.has(w)));
  SW.sameFactShort = (a, b) => { const A = cwg(a), B = cwg(b), small = Math.min(A.size, B.size); if(!small) return false; let n = 0; A.forEach(w => { if(B.has(w)) n++; }); return n/small >= (small <= 3 ? .5 : .6) && (n >= 2 || small >= 4); };
  SW.factTwice = () => { const out = [];
    FACES().forEach(pn => { const items = [];
      pn.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]') || /(\.label|\.title|\.kicker)$/.test(el.dataset.slot) || /^(agent|broker|fineprint|back\.fine|back\.return|plan|fact|front\.fact|oh\.|address|place|front\.place|front\.address|badge|moment|front\.status|back\.status|room\.|details|left\.badge)/.test(el.dataset.slot)) return;
        SW.sentences(el.textContent).filter(x => cw(x).size >= 2).forEach(x => items.push({slot: el.dataset.slot, x})); });
      for(let i = 0; i < items.length; i++) for(let j2 = i + 1; j2 < items.length; j2++){ const a = items[i], b = items[j2]; if(a.slot === b.slot) continue; const A = cwg(a.x), B = cwg(b.x); if(Math.min(A.size, B.size) < 2) continue;
        if(SW.sameFactShort(a.x, b.x)) out.push({slot: a.slot, kind: 'same-fact-on-face', detail: `"${a.x.slice(0, 50)}" (${a.slot}) and "${b.x.slice(0, 50)}" (${b.slot}) say the same thing`}); } });
    return out.slice(0, 6); };
  // 3. stat numerals are 16 pt or more; stats come in threes or fours
  SW.numerals = () => { const out = []; document.querySelectorAll('[data-slot]').forEach(el => { if(!/(^|\.)fact\.\d+$/.test(el.dataset.slot)) return; const t = el.querySelector('span') || el, n = toPt(parseFloat(getComputedStyle(t).fontSize)); if(n < 15.95) out.push({slot: el.dataset.slot, kind: 'numeral-under-16pt', detail: `${n.toFixed(1)} pt`}); }); return out; };
  // 4. a pale blue band over 0.5 in carries text or a box
  SW.emptyBands = () => { const out = []; document.querySelectorAll('.bluebar').forEach(b => { const r = b.getBoundingClientRect(); if(toPt(r.height) < 36 || toPt(r.width) < 36) return;
    const pn = b.closest('.panel, .sheet, .page') || document.body; const has = [...pn.querySelectorAll('[data-slot], .card, .ph, .badge')].some(e => { if(e === b) return false; const q = e.getBoundingClientRect(); return q.width > 1 && q.left < r.right - 2 && q.right > r.left + 2 && q.top < r.bottom - 2 && q.bottom > r.top + 2; });
    if(!has) out.push({slot: 'band', kind: 'band-empty', detail: `${toPt(r.width).toFixed(0)} x ${toPt(r.height).toFixed(0)} pt of empty blue`}); }); return out; };
  // 5. a hanging separator dot or dash at the end of an address, place or tag line
  SW.separators = () => { const out = []; document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return; const t = el.textContent.replace(/\s+/g, ' ').trim(); if(t.length > 3 && /^(address|place|front\.place|front\.tags|front\.address|addr\.line|badge)/.test(el.dataset.slot) && sepEnd.test(t)) out.push({slot: el.dataset.slot, kind: 'hanging-separator', detail: `"${t.slice(0, 40)}"`}); }); return out; };
  // 6. back photo slots carry a label (a bold label opens each caption: "Front.")
  SW.labels = () => { const out = []; document.querySelectorAll('.ph[data-slot-photo^="back.photo"], .ph[data-slot-photo^="left.photo"], .ph[data-slot-photo^="right.photo"]').forEach(el => { const s = el.dataset.slotPhoto; if(!document.querySelector(`[data-slot="${s}"]`)) return; const lb = document.querySelector(`[data-slot="${s}.label"]`), cap = document.querySelector(`[data-slot="${s}"]`); if(cap && (cap.dataset.lead || '').trim() && !lb) return; if(!lb || !lb.textContent.trim()) out.push({slot: s, kind: 'label-missing', detail: 'the photo has no label opening its caption'}); else if(lb.scrollHeight > lb.clientHeight + 2 && lb.getClientRects()[0].height > 18) out.push({slot: s, kind: 'label-wraps', detail: 'the label does not set on one line'}); }); return out; };
  // 7. the city appears once in a header on a face
  SW.cityOnce = (city) => { const out = []; FACES().forEach(pn => { let n = 0; pn.querySelectorAll('[data-slot]').forEach(el => { if(/^(place|front\.place|front\.tags)$/.test(el.dataset.slot) && el.textContent.toUpperCase().includes(String(city).toUpperCase())) n++; });
    if(n > 1) out.push({slot: 'place', kind: 'city-twice', detail: `${city} appears ${n} times in headers on one face`}); }); return out; };
  // 8. Nearby: three real places with a distance each
  SW.nearbyCheck = (near) => { const bad = (near || []).filter(n => !/^\d+(\.\d+)?\s+miles?$/i.test(String(n.dist || '')) || !n.place); return (near || []).length === 3 && !bad.length ? [] : [{slot: 'back.outside', kind: 'nearby-not-three', detail: `${(near || []).length} places, ${bad.length} without a real distance`}]; };

  // Open House pieces (flyer, email, socials): both REALTOR(R) perk lines stay, the day sits over the date's left edge, the label and the time each set on one line
  FXS.ohCheck = () => { const D = SW.data(), O = D.openHouse || {}, out = [], txt = document.body.innerText.replace(/\s+/g, ' ').toLowerCase(), P = D.piece || {};
    if(O.kind === 'realtor' && P.shape !== 'slide' && !(P.photo) && !P.moment) [[O.refreshments, 'oh.refreshments'], [O.note, 'oh.note']].forEach(([v, s]) => { if(v && !document.querySelector(`[data-slot="${s}"]`)) out.push({slot: s, kind: 'perk-dropped', detail: `"${String(v).slice(0, 40)}" is missing from the REALTOR® piece`}); });
    const wk = document.querySelector('[data-slot="oh.weekday"]'), dt = document.querySelector('[data-slot="oh.date"]');
    if(wk && dt){ const a = wk.getBoundingClientRect(), b = dt.getBoundingClientRect(); if(Math.abs(a.left - b.left) > 6 || a.bottom > b.top + 4 + b.height*.3 || a.top > b.top) out.push({slot: 'oh.weekday', kind: 'day-kicker-off-date', detail: 'the day does not sit directly above the date, on its left edge'}); }
    ['oh.label', 'oh.time'].forEach(s => { document.querySelectorAll(`[data-slot="${s}"]`).forEach(el => { if(s === 'oh.label' && !/realtor/i.test(el.textContent)) return; const fs = parseFloat(getComputedStyle(el).fontSize), r = el.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(el); const tops = new Set([...rg.getClientRects()].filter(q => q.width > 1).map(q => Math.round(q.top/ (fs*.5)))); if(tops.size > 1) out.push({slot: s, kind: s === 'oh.time' ? 'time-wraps' : 'label-wraps', detail: 'does not set on one line'}); }); });
    out.push(...SW.factTwice(), ...SW.numerals(), ...SW.emptyBands(), ...SW.separators(), ...SW.cityOnce(D.listing.city), ...SW.bathLabels(), ...SW.phoneCheck(), ...SW.glyphBox(), ...SW.emptyField(), ...SW.badgeSize());
    return out; };
  SW.backPhoto = () => (document.querySelector('[data-slot="back.about"]') && !document.querySelector('.ph[data-slot-photo="back.photo0"]')) ? [{slot: 'back.photo0', kind: 'back-photo-missing', detail: 'the back has no outdoor photo at the top'}] : [];
  SW.interiorOnBack = () => { const out = []; if(document.querySelector('.mail-panel')) return out; document.querySelectorAll('.ph[data-slot-photo^="back.photo"]').forEach(el => { if(!FXS.OUTSIDE.test(el.dataset.photo || '')) out.push({slot: el.dataset.slotPhoto, kind: 'interior-photo-on-outside-page', detail: `${el.dataset.photo} is not an exterior, outdoor or community photo`}); }); return out; };

  // ---------- the fxs-36 review checks ----------
  // every bath label goes through _shared/baths.js: "FULL BATHS", or "BATHS" only after a half bath; a plain "BATHS" fails
  SW.bathLabels = () => { const out = []; document.querySelectorAll('[data-slot], .t, .icof div').forEach(el => { if(el.children.length > 1) return; const t = el.textContent.replace(/\s+/g, ' ').trim();
      if(/^(?:[\d.,]+\s*)?baths?$/i.test(t) && !/½\s*baths?$/i.test(t)) { const prev = (el.previousElementSibling || {}).textContent || ''; if(!/½/.test(prev)) out.push({slot: el.dataset.slot || 'bath', kind: 'plain-baths', detail: `"${t}" does not come from baths.js (FULL BATHS)`}); } });
    if(window.BD && BD.bathsText){ const L = SW.data().listing || {}, want = BD.bathsText(L).main; const txt = document.body.innerText; if(/\bFull Baths\b/i.test(txt) === false && /\bbaths?\b/i.test(want) && /\d+\s+baths?\b/i.test(txt)) out.push({slot: 'bath', kind: 'plain-baths', detail: `the page prints a bath count that is not "${want}"`}); }
    return out; };
  // a room size sits only beside a photo of that room, and no size repeats across the spread
  SW.sizes = () => { const out = [], seen = new Map(), SZ = /\d+['’]\s*(?:\d+["”]?\s*)?x\s*\d+['’](?:\s*\d+["”]?)?/g;
    document.querySelectorAll('.rsize').forEach(el => { const f = el.dataset.sizeFor; if(!f || !document.querySelector(`.ph[data-slot-photo="${f}"]`)) out.push({slot: f || 'size', kind: 'size-not-beside-photo', detail: `"${el.textContent.trim()}" has no photo of its room beside it`}); });
    document.querySelectorAll('[data-slot], .rsize').forEach(el => { if(el.querySelector('[data-slot]') || el.closest('.plan-svg, .planwrap')) return; (el.textContent.match(SZ) || []).forEach(m => { const k = m.replace(/\s+/g, '').toLowerCase(), prev = seen.get(k); if(prev && prev !== el) out.push({slot: el.dataset.slot || el.dataset.sizeFor || 'size', kind: 'size-repeats', detail: `${m} appears more than once on the spread`}); seen.set(k, el); }); });
    return out; };
  // captions side by side run the same number of lines, and none is filler
  SW.rowLines = () => { const out = [], caps = [...document.querySelectorAll('[data-s][data-slot]')].filter(e => e.getClientRects().length && /photo/.test(e.dataset.slot)), rows = [];
    caps.forEach(e => { const pg = e.closest('.panel, .sheet, .page'), top = Math.round(e.getBoundingClientRect().top/6); const r = rows.find(x => x.pg === pg && x.top === top); (r || rows[rows.push({pg, top, els: []}) - 1]).els.push(e); });
    rows.forEach(r => { if(r.els.length < 2) return; const ns = r.els.map(e => SW.lines(e).n); if(new Set(ns).size > 1) out.push({slot: r.els[0].dataset.slot, kind: 'row-lines-uneven', detail: `captions side by side run ${ns.join(' and ')} lines`}); });
    const FILL = /natural light fills the room|fills the (?:room|space) with (?:natural )?light|bright and airy|plenty of natural light|warm and inviting|a welcoming space/i;
    document.querySelectorAll('[data-slot]').forEach(e => { if(e.querySelector('[data-slot]')) return; if(FILL.test(e.textContent)) out.push({slot: e.dataset.slot, kind: 'filler-caption', detail: `"${e.textContent.trim().slice(0, 50)}" is filler`}); });
    return out; };

  // ---------- fxs-40 review round 1 checks ----------
  // 1. the phone is plain sans, semibold or bold, dark, and out-reads the script name; sizes: about 52 px at 1080 on socials, about 20 pt on the Just Listed postcard front
  SW.phoneCheck = () => { const out = [], D = SW.data(), P = D.piece || {}, ph = document.querySelector('[data-slot="agent.phone"]'); if(!ph || !ph.getClientRects().length) return out;
    const cs = getComputedStyle(ph), fs = toPt(parseFloat(cs.fontSize)), rgb = (cs.color.match(/\d+/g) || [0, 0, 0]).map(Number), lum = .299*rgb[0] + .587*rgb[1] + .114*rgb[2];
    if(/great vibes|pinyon|script/i.test(cs.fontFamily)) out.push({slot: 'agent.phone', kind: 'phone-script', detail: 'the phone is set in script'});
    if(+cs.fontWeight < 600) out.push({slot: 'agent.phone', kind: 'phone-light', detail: `weight ${cs.fontWeight}; the phone is semibold or bold`});
    const onDark = P.side === 'back' && !!P.card; if(onDark ? lum < 190 : lum > 110) out.push({slot: 'agent.phone', kind: 'phone-light', detail: onDark ? 'the phone is not light on the dark back field' : 'the phone is not dark navy'});
    let need = 0; const px = P.px ? P.px[0] : 0;
    if(px && /^(post|story|square|pin|slide)$/.test(P.shape)) need = 50*(px/1080)*.375;      // image px to pt at K = .375
    else if(P.side === 'front' && P.card === 'listed') need = 19.5;
    if(need && fs < need - .25) out.push({slot: 'agent.phone', kind: 'phone-small', detail: `${fs.toFixed(1)} pt; at least ${need.toFixed(1)} pt on this piece`});
    const nm = document.querySelector('[data-slot="agent.name"]'); if(need && nm){ const nf = toPt(parseFloat(getComputedStyle(nm).fontSize)); if(fs < nf*.8) out.push({slot: 'agent.phone', kind: 'phone-small', detail: `the phone (${fs.toFixed(1)} pt) does not out-read the script name (${nf.toFixed(1)} pt)`}); }
    return out; };
  // 2. the script name's swashes are not clipped: the glyph box (ink) stays inside the box that holds it
  SW.glyphBox = () => { const out = [], c = (SW.glyphBox.c || (SW.glyphBox.c = document.createElement('canvas').getContext('2d')));
    document.querySelectorAll('.script, .cc-name, [data-slot="agent.name"]').forEach(el => { const cs = getComputedStyle(el); if(!/great vibes/i.test(cs.fontFamily) || !el.getClientRects().length) return; const t = el.textContent.trim(); if(!t) return;
      c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; const m = c.measureText(t), r = el.getBoundingClientRect(), org = r.left + parseFloat(cs.paddingLeft || 0) + parseFloat(cs.borderLeftWidth || 0), inkL = org - m.actualBoundingBoxLeft, inkR = org + m.actualBoundingBoxRight, inkT = r.top, inkB = r.bottom;
      for(let e = el; e && e !== document.body; e = e.parentElement){ const s = getComputedStyle(e); if(s.overflowX === 'visible' && s.overflowY === 'visible') continue; const q = e.getBoundingClientRect();
        if(inkL < q.left - .5 || inkR > q.right + .5){ out.push({slot: el.dataset.slot || 'agent.name', kind: 'glyph-clipped', detail: `the name's swash runs ${Math.max(q.left - inkL, inkR - q.right).toFixed(1)} px past the box that clips it`}); break; } } });
    return out; };
  // 3. a key word repeated in neighboring list items ("Rooftop patio", then "Patio")
  SW.neighborRepeat = () => { const out = [], SKIP = new Set(['wood', 'covered', 'open', 'fenced', 'mature', 'gated', 'community', 'high', 'tray', 'walk-in', 'pet-friendly', 'park', 'miles', 'with', 'floors', 'built']);
    const lists = new Map(); document.querySelectorAll('.bul[data-slot]').forEach(e => { const k = e.dataset.slot.replace(/\.\d+$/, ''); (lists.get(k) || lists.set(k, []).get(k)).push(e); });
    lists.forEach(els => { for(let i = 1; i < els.length; i++){ const a = new Set((els[i - 1].textContent.toLowerCase().match(/[a-z][a-z-]{3,}/g) || []).filter(w => !SKIP.has(w))), b = (els[i].textContent.toLowerCase().match(/[a-z][a-z-]{3,}/g) || []).filter(w => !SKIP.has(w) && a.has(w));
      if(b.length) out.push({slot: els[i].dataset.slot, kind: 'neighbor-repeat', detail: `"${b[0]}" is in "${els[i - 1].textContent.trim()}" and "${els[i].textContent.trim()}"`}); } }); return out; };
  // 4. a box ends where its content ends: no empty stretch over 0.4 in under the last bullet
  SW.boxFill = () => { const out = []; document.querySelectorAll('.card').forEach(cd => { const r = cd.getBoundingClientRect(), bs = [...document.querySelectorAll('.bul')].filter(b => { const q = b.getBoundingClientRect(); return q.left >= r.left - 1 && q.right <= r.right + 1 && q.top >= r.top - 1 && q.bottom <= r.bottom + 1; });
    if(bs.length < 2) return; const last = Math.max(...bs.map(b => b.getBoundingClientRect().bottom)); if(toPt(r.bottom - last) > 30) out.push({slot: bs[0].dataset.slot || 'box', kind: 'box-empty-bottom', detail: `${toPt(r.bottom - last).toFixed(0)} pt empty under the last bullet`}); }); return out; };
  // 5. no empty field over 60 px (at 1080) on a social: the page, and each half of a side-by-side piece, has no band of the page that holds neither text nor a photo
  SW.emptyField = () => { const out = [], D = SW.data(), P = D.piece || {}; if(!P.px) return out; const pg = document.querySelector('.page'); if(!pg) return out; const pr = pg.getBoundingClientRect(), sc = pr.width/1080, lim = 80*sc;   // no empty field over about 60 px at 1080 (80 allowed where a wide one-story house cannot grow the photo further)   // 60 px at a 1080 wide feed image: the same share of the width on every format
    const items = [...pg.querySelectorAll('[data-slot], img, .card, .badge, .photo, .logo, [aria-hidden="true"]')].filter(e => e.getClientRects().length && !e.closest('.bluebar')).map(e => ({q: e.getBoundingClientRect(), hid: e.getAttribute('aria-hidden') === 'true'})).filter(o => o.q.width > 2 && o.q.height > 2 && !(o.q.width > pr.width*.97 && o.q.height > pr.height*.97) && (!o.hid || o.q.height <= 100*sc || o.q.width <= 12*sc)).map(o => o.q);   // a thin band or rule counts; a large pale panel does not
    const scan = (x0, x1, name) => { const iv = items.filter(q => q.right > x0 + 2 && q.left < x1 - 2).map(q => [q.top - pr.top, q.bottom - pr.top]).sort((a, b) => a[0] - b[0]); let cur = 0, worst = 0, at = 0;
      iv.forEach(([t, b]) => { if(t - cur > worst){ worst = t - cur; at = cur; } cur = Math.max(cur, b); }); if(pr.height - cur > worst){ worst = pr.height - cur; at = cur; }
      if(worst > lim) out.push({slot: name, kind: 'empty-field', detail: `${Math.round(worst/sc)} px (at 1080) empty from y ${Math.round(at/sc)}`}); };
    scan(0, pr.width, 'page'); if(/^(wide|gbp|square)$/.test(P.shape)){ const hw = Math.min(...[...pg.querySelectorAll('.photo')].map(e => e.getBoundingClientRect().right).filter(v => v > pr.left + 40)) || pr.width/2; scan(pr.left, hw, 'left column'); scan(hw, pr.right, 'right column'); }
    return out; };
  // 6. every carousel badge label sets at one size (never shrunk to fit)
  SW.badgeSize = () => { const out = []; document.querySelectorAll('[data-slot="room.badge"]').forEach(el => { const b = el.closest('.badge'); if(!b) return; const fs = toPt(parseFloat(getComputedStyle(el).fontSize)), w = toPt(b.getBoundingClientRect().width); if(fs < w*.15) out.push({slot: 'room.badge', kind: 'badge-text-shrunk', detail: `"${el.textContent.trim()}" is ${fs.toFixed(1)} pt in a ${w.toFixed(0)} pt badge (one size, ${(w*.17).toFixed(1)} pt)`}); }); return out; };
  const __check = SW.check;
  SW.check = function(D, extra){ const P = D.piece || {}, margin = P.print === 'bleed' ? 9 : 18; const out = __check(D, extra);
    out.push(...SW.offPage(margin), ...SW.factTwice(), ...SW.numerals(), ...SW.emptyBands(), ...SW.separators(), ...SW.labels(), ...SW.cityOnce(D.listing.city), ...SW.interiorOnBack(), ...SW.backPhoto(), ...SW.phoneCheck(), ...SW.glyphBox(), ...SW.neighborRepeat(), ...SW.boxFill(), ...SW.bathLabels(), ...SW.sizes(), ...SW.rowLines());
    return out; };
  window.SW = SW; window.FXS = SW;
})();
