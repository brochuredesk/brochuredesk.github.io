/* fxs-28 helpers (ported from the swatchbook set's swatchbook.js, FX28 look): data, photos, captions and paragraphs that fill their boxes, logos, print checks, the set's tokens (FXS.tok, read from fxs28.css) and marks (icons, arch).

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
  SW.sameFact = (a, b) => { const A = cw(a), B = cw(b), small = Math.min(A.size, B.size); if(!small) return false; let n = 0; A.forEach(w => { if(B.has(w)) n++; }); return n/small >= (small <= 3 ? 0.5 : 0.6); };
  // a two-word phrase of content words that repeats inside one caption ("covered structure ... covered structure")
  SW.bigramRep = t => { const w = (String(t).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(x => !STOPW.has(x)), seen = new Set(); for(let i = 0; i + 1 < w.length; i++){ const g = w[i] + ' ' + w[i + 1]; if(seen.has(g)) return g; seen.add(g); } return ''; };
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
  const faceUsed = new Map();
  const usedElsewhere = el => { const f = el.closest('.panel, .sheet'); return f && faceUsed.get(f) ? [].concat(...faceUsed.get(f).filter(r => r.el !== el).map(r => r.s)) : []; };
  const noteUsed = el => { const f = el.closest('.panel, .sheet'); if(!f) return; const arr = faceUsed.get(f) || faceUsed.set(f, []).get(f); const i = arr.findIndex(r => r.el === el); const rec = {el, s: SW.sentences(el.textContent).concat(el.dataset.lead ? [] : [])}; if(i >= 0) arr[i] = rec; else arr.push(rec); };
  const pickFor = (el, T) => {
    // each sentence is a string, or a list of ways to say the same fact at different lengths (only one is ever used)
    const S = JSON.parse(el.dataset.s).map(x => [].concat(x)), lead = el.dataset.lead || '', n = Math.min(S.length, el.dataset.anyfirst ? 10 : 12);   // captions: 10 lines in play keeps a page's fit within the renderer's time
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
      // nor the same fact as another box on the same face (the first pass; a pool with no other way to say it falls back to a second pass, and the face check reports it)
      if(!SW.__allow && usedElsewhere(el).some(u => pick.some(s => SW.sameFact(s, u)))) return;
      if(!SW.__allow && el.closest('.cap') && SW.bigramRep((lead ? lead + ' ' : '') + pick.join(' '))) return;   // no two-word phrase twice in one caption
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
  const pfN = (el, T) => { for(const allow of [false, true]){ SW.__allow = allow; const r = pfN0(el, T); if(r){ SW.__allow = false; return r; } } SW.__allow = false; return null; };
  const pfN0 = (el, T) => {
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
    document.querySelectorAll('.bul, .rs').forEach(noteUsed);   // bullets are printed as written: the captions and paragraphs on the face avoid saying them again
    document.querySelectorAll('[data-s]').forEach(e => { e.dataset.fixed = '1'; });
    const caps = [...document.querySelectorAll('.cap .a[data-s]')], rest = [...document.querySelectorAll('[data-s]')].filter(e => !caps.includes(e));
    const settle = (el, T) => {   // T lines: the best set, else the nearest and a report
      const lead = el.dataset.lead || '', b = pfN(el, T);
      if(b){ el.innerHTML = html(lead, b.pick); delete el.dataset.diag; }
      else el.innerHTML = html(lead, el.__near ? el.__near.pick : JSON.parse(el.dataset.s).map(x => [].concat(x)[0]));
      el.dataset.lines = T; el.dataset.done = '1'; noteUsed(el); return !!b;
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
    rest.forEach(fitRest);   // intros, write-ups and the box bullets first, as approved; the captions then step around their facts   // owner 11/8: the captions fit next, then the box bullets (their many phrasings step around the captions' facts)
    // the captions in one row share a line count and size
    const soldNote = (() => { let card = ''; try { card = ((JSON.parse(document.getElementById('brochure-data').textContent || '{}').piece) || {}).card || ''; } catch(e){} return e => card === 'sold' && e.dataset.slot === 'front.hero'; })();   // the Just Sold note keeps its opening line ("I just helped sell...")
    const groups = new Map();
    caps.forEach(el => { const f = el.closest('.panel, .sheet'), g = el.dataset.row ? (el.dataset.row + '|' + [...document.querySelectorAll('.panel, .sheet')].indexOf(f)) : (el.closest('.row') || el); (groups.get(g) || groups.set(g, []).get(g)).push(el); });
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
      if(!chosen && max >= 3){   // owner 11/8 ("as many lines as the space needs ... the font size can go up to fill it"): last resort, one line fewer, bigger type, same space
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
    issues.push(...FXS.faceChecks('.panel, .sheet', {margin: (D.piece || {}).print === 'margin'}));
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
    await Promise.all(['300 10pt Montserrat','400 10pt Montserrat','500 10pt Montserrat','600 10pt Montserrat','700 10pt Montserrat','400 10pt Oswald','500 10pt Oswald','600 10pt Oswald','700 10pt Oswald'].map(f => document.fonts.load(f)));
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


  // ---------- the set's tokens (fxs28-tokens.css is the one source) and marks ----------
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  FXS.tok = new Proxy({}, {get: (_, k) => ({
    paper: cssVar('--fx-paper'), card: cssVar('--fx-card'), seal: cssVar('--fx-seal'), ink: cssVar('--fx-ink'), text: cssVar('--fx-text'),
    mute: cssVar('--fx-mute'), accent: cssVar('--fx-accent'), rule: cssVar('--fx-rule'), onInk: cssVar('--fx-on-ink'), spine: cssVar('--fx-spine'), onSpine: cssVar('--fx-on-spine')})[k]});
  FXS.SUF = /\s+(Street|St|Drive|Dr|Lane|Ln|Road|Rd|Avenue|Ave|Boulevard|Blvd|Court|Ct|Circle|Cir|Place|Pl|Way|Trail|Trl|Parkway|Pkwy|Terrace|Ter|Highway|Hwy)\.?$/i;
  FXS.width = (t, css) => { const m = document.createElement('span'); m.style.cssText = `position:absolute;left:-9999pt;visibility:hidden;white-space:nowrap;${css}`; m.textContent = t; document.body.appendChild(m); const w = m.getBoundingClientRect().width*.75; m.remove(); return w; };
  FXS.fitSize = (t, css, w, max, min) => { let s = max; while(s > min && FXS.width(t, `${css};font-size:${s}pt`) > w) s -= .5; return s; };
  FXS.placeLine = L => `${L.city}, ${L.state} ${L.zip || ''}`.trim().replace(/\s+/g, ' ');
  FXS.hood = L => String(L.neighborhood || ((SW.data().listing || {}).neighborhood) || '').trim();   // the page loader (OHL.start) blanks D.listing.neighborhood, so the raw data is read too
  FXS.rawAddr = L => String(((SW.data().listing || {}).address) || L.address || '');
  // the street name without its number and suffix ("2614 Calder Street" -> "Calder"), for the inside spines
  FXS.streetOnly = a => String(a).replace(/^\d+\s+/, '').replace(FXS.SUF, '');

  // ---------- the spine: the set's mark. A forest green band down the left edge that bleeds off the top, left and bottom, the street name
  // set up its length in Oswald caps, the neighborhood small and tracked above it ----------
  FXS.vt = (cx, cy, len, th, cls, style, inner, attrs) => `<div class="vt ${cls}" ${attrs || ''} style="left:${cx - th/2}pt;top:${cy - len/2}pt;width:${th}pt;height:${len}pt;${style || ''}">${inner}</div>`;
  FXS.spine = (D, w, o) => { o = o || {};
    const L = D.listing, text = String(o.text != null ? o.text : FXS.rawAddr(L)).toUpperCase(), hood = o.hood === false ? '' : (o.hood || FXS.hood(L)).toUpperCase();
    const cx = w/2, bot = o.bottom == null ? 770 : o.bottom, H = o.H || 792, hs = o.hoodSize || 9.5;
    const hl = hood ? FXS.width(hood, `font-family:Montserrat;font-weight:500;letter-spacing:.4em;font-size:${hs}pt`) + 4 : 0;
    const top = Math.max(o.top == null ? 250 : o.top, hood ? 28 + hl + 28 : 0), len = bot - top;
    const css = "font-family:Oswald;font-weight:700;letter-spacing:.08em", s = FXS.fitSize(text, css, len, o.max || 45, o.min || 22);
    let h = `<div class="abs" data-role="spine" style="left:-9pt;top:-9pt;width:${w + 9}pt;height:${H + 18}pt;background:var(--fx-spine)"></div>`;
    if(hood) h += FXS.vt(cx, 28 + hl/2, hl, hs*1.6, 'vhood', `font-size:${hs}pt`, esc(hood), 'data-slot="spine.hood" data-small="1" data-lines="1"');
    h += FXS.vt(cx, (top + bot)/2, len, s*1.5, 'vaddr', `font-size:${s}pt`, esc(text), `data-slot="${o.slot || 'spine.address'}" data-lines="1"`);
    return {html: h, size: s}; };

  // ---------- facts as the set's green tiles ----------
  FXS.statItems = L => {
    const n = v => Number(v).toLocaleString('en-US'), t = [];
    if(L.beds) t.push(`${L.beds} ${L.beds == 1 ? 'Bedroom' : 'Bedrooms'}`);
    if(L.baths){ const b = window.BD && BD.bathsText ? BD.bathsText(L).main : `${L.baths} Full Baths`; t.push(b); }
    if(L.sqft) t.push(`${n(L.sqft)} Square Feet`);
    const yr = L.yearBuilt || L.year; if(yr) t.push(`Built in ${yr}`);
    return t;
  };
  FXS.statParts = t => { t = String(t); let m = /^Built in (\d{4})$/i.exec(t); if(m) return {n: m[1], l: 'Year Built'};
    m = /^([\d,]+(?:\.\d+)?(?:½)?)\s+(.*)$/.exec(t); return m ? {n: m[1], l: m[2]} : {n: t, l: ''}; };
  // one tile: the numeral (Oswald, 16 pt or more) over its tracked caps label, white on the green
  FXS.tile = (t, slot, np, lp, track, style) => { const p = FXS.statParts(t);
    return `<div class="tile" data-slot="${slot}" data-small="1" data-lines="2" style="${style || ''}"><span class="tn" style="font-size:${np}pt">${esc(p.n)}</span>${p.l ? `<span class="tl" style="font-size:${lp}pt;letter-spacing:${track == null ? 1.6 : track}pt">${esc(p.l)}</span>` : ''}</div>`; };
  // one fact as a row tile (numeral and label side by side), for narrow columns
  FXS.tileRow = (t, slot, np, lp, track, style) => { const p = FXS.statParts(t);
    return `<div class="tile row" data-slot="${slot}" data-small="1" data-lines="1" style="${style || ''}"><span class="tn" style="font-size:${np}pt">${esc(p.n)}</span>${p.l ? `<span class="tl" style="font-size:${lp}pt;letter-spacing:${track == null ? 1.6 : track}pt">${esc(p.l)}</span>` : ''}</div>`; };
  FXS.statsRow = (items, x, y, w, h, slot, o) => { o = o || {};
    return `<div class="stats" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;gap:${o.gap == null ? 10.5 : o.gap}pt">${items.map((t, i) => FXS.tile(t, `${slot}.${i}`, o.np || 26, o.lp || 8, o.track)).join('')}</div>`; };
  // a stat inline on cream (green numeral, small caps label)
  FXS.statHtml = (t, np, lp, track) => { const p = FXS.statParts(t);
    return `<span style="font:600 ${np || 20}pt/1 var(--fx-display);color:var(--fx-ink)">${esc(p.n)}</span>${p.l ? `<span style="font:500 ${lp || 8}pt/1 var(--fx-font);letter-spacing:${track == null ? 1.6 : track}pt;text-transform:uppercase;color:var(--fx-text);margin-left:${(lp || 8)*.8}pt">${esc(p.l)}</span>` : ''}`; };
  FXS.label = (t, slot, style) => `<div class="lbl" ${slot ? `data-slot="${slot}" data-lines="1"` : ''} style="${style || ''}">${esc(String(t).toUpperCase())}</div>`;
  // a photo box at (x, y, w, h)
  FXS.box = (D, id, x, y, w, h, slot, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${SW.photo(D, id, `position:absolute;inset:0;${css || ''}`, slot)}</div>`;
  // a logo, sized to a box (the one brokerage logo of a side)
  FXS.logo = (D, x, y, w, h, just) => { const b = D.brand || {}; const src = b.logo; return `<div class="abs logo" data-area="${w*h}" data-maxh="${h}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;justify-content:${just || 'flex-start'}">${src ? `<img src="${esc(src)}" alt="">` : `<span class="word" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span>`}</div>`; };
  // the agent block of a front: "Name, REALTOR®", phone, email, left aligned at (x, y); the headshot (68 x 78 pt) sits left of the text
  FXS.agent = (A, x, y, w, hsSrc, o) => { o = o || {};
    const hw = hsSrc ? 68 : 0, tx = x + (hsSrc ? hw + 13 : 0), nm = `${A.name || ''}${A.nar || /realtor/i.test(A.designation || '') ? ', REALTOR®' : ''}`;
    const ns = FXS.fitSize(nm, "font-family:Montserrat;font-weight:600", w - (tx - x), o.name || 22.5, 15);
    return (hsSrc ? `<div class="abs hsbox" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:78pt"><img src="${esc(hsSrc)}" alt=""></div>` : '') +
      `<div class="abs agentline" style="left:${tx}pt;top:${y - 2}pt;width:${w - (tx - x)}pt"><div class="n" style="font-size:${ns}pt;line-height:${ns*1.25}pt" data-slot="agent.name" data-lines="1">${esc(nm)}</div><div class="p" style="margin-top:3pt" data-slot="agent.phone" data-lines="1">${esc(A.phone || '')}</div><div class="e" data-slot="agent.email" data-lines="1">${esc(A.email || '')}</div></div>`;
  };
  FXS.lightBold = t => esc(t);
  // the address in the set's horizontal line: Oswald caps at the biggest size that fits w
  FXS.addrCss = "font-family:Oswald;font-weight:600;letter-spacing:1.5pt;text-transform:uppercase";
  FXS.scriptLine = (text, x, y, w, max, min, slot, o) => { o = o || {};
    const s = FXS.fitSize(text, FXS.addrCss, w, max, min || max*.55), lh = s*(o.lh || 1.15);
    return {s, lh, html: `<div class="abs script" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${lh}pt;font-size:${s}pt;line-height:${lh}pt;${o.css || ''}" data-slot="${slot}" data-lines="1">${esc(text)}</div>`}; };
  // a tracked caps line
  FXS.capsLine = (text, x, y, w, size, track, color, slot, o) => { o = o || {};
    return `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${size*1.4}pt;font:${o.w || 500} ${size}pt/${size*1.4}pt var(--fx-font);letter-spacing:${track}pt;${o.nocaps ? '' : 'text-transform:uppercase;'}color:${color};white-space:nowrap;overflow:hidden;text-align:${o.align || 'left'}" data-slot="${slot}" data-lines="1">${esc(text)}</div>`; };
  // the place under the address, as the source sets it: "Houston, Texas 77023", tracked (the neighborhood is in the spine; the city is named once)
  FXS.placeText = L => FXS.placeLine(L);
  FXS.placeRow = (L, x, y, w, size, slot) => FXS.capsLine(FXS.placeText(L), x, y, w, size || 11, (size || 11)*.2, 'var(--fx-text)', slot || 'place', {nocaps: true});
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
      `<div class="abs" style="left:${x}pt;top:${y + ph + 7}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(L.name.toUpperCase())}</div>${showSize ? `<span data-size="1" style="font:500 9pt/12pt var(--fx-font);color:var(--fx-mute);margin-left:8pt;white-space:nowrap">${esc(L.size)}</span>` : ''}</div>` +
      `<div class="abs cap"><div class="a" style="position:absolute;left:${x}pt;top:${y + ph + 25}pt;width:${w}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-row="${o.row || slot}" data-lh="${lh}" data-lines="${lines}" data-narrow="${o.narrow == null ? 10 : o.narrow}" ${sd(FXS.capPool(D, c))}></div></div>`; };

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
    const html = `<div class="card" data-role="plancard" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${bottom - y}pt;background:var(--fx-seal)"></div><div class="abs planwrap" style="left:0;top:0;width:612pt;height:792pt;--paper:var(--fx-seal)">${r.html}<div class="plan-legend" style="left:${x + 14}pt;top:${ly}pt">${leg.join('')}</div><div class="plan-disclosure" style="left:${x + 14}pt;width:${w - 28}pt;top:${ly + 14}pt;text-align:left" data-slot="back.plannote" data-lines="1" data-fine="1">${esc(note)}</div></div>`;
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
    if(has(/gated front entry/i)) add(inside, 'Gated front entry'); else if(has(/gated/i)) add(inside, 'Gated entry');
    if(has(/\b(two|2)-car garage|garage for two|two cars/i)) add(inside, '2-car garage'); else if(has(/garage/i)) add(inside, 'Attached garage');
    if(has(/three-phase/i)) add(inside, 'Three-phase power');
    if(has(/new wiring/i)) add(inside, has(/breaker box/i) ? 'New wiring and breaker box' : 'New wiring');
    if(has(/new plumbing/i)) add(inside, 'New plumbing');
    if(has(/fiber cement|hardie|hardi/i)) add(inside, 'Fiber cement siding');
    if(has(/new driveway/i)) add(inside, 'New driveway');
    if(has(/tray ceiling/i)) add(inside, 'Tray ceilings');
    else if(has(/high ceilings/i)) add(inside, 'High ceilings');
    else if(has(/soaring ceilings|tall ceilings|10-foot ceilings/i)) add(inside, 'Tall ceilings');
    if(has(/vaulted ceiling/i)) add(inside, 'Vaulted ceiling');
    if(has(/crown molding/i)) add(inside, 'Crown molding');
    if(has(/wood floors|hardwood|wood-look/i)) add(inside, 'Wood floors');
    if(has(/walk-in closet/i)) add(inside, 'Walk-in closet');
    if(has(/pet-friendly/i)) add(inside, 'Pet-friendly amenities');
    if(has(/hardwood|wood floors/i) && has(/stairs|staircase|stair rail/i)) add(inside, 'Open staircase');
    if(has(/\bdeck\b/i) && has(/pergola/i)) add(outside, 'Wood deck with a pergola'); else if(has(/\bdeck\b/i)) add(outside, 'Wood deck'); else if(has(/pergola/i)) add(outside, 'Pergola');
    if(has(/fully fenced|fenced yard|fenced backyard|fencing/i)) add(outside, 'Fully fenced');
    if(has(/rooftop patio/i)) add(outside, 'Rooftop patio');
    if(has(/covered patio/i)) add(outside, 'Covered patio'); else if(has(/\bpatio\b/i)) add(outside, 'Patio');
    if(has(/balcon/i)) add(outside, 'Balcony upstairs');
    if(has(/turf/i)) add(outside, 'No-mow backyard');
    if(has(/mature trees/i)) add(outside, 'Mature trees');
    if(has(/community park|gazebo/i)) add(outside, 'Community park with a gazebo');
    const yr = L.yearBuilt || L.year, lot = L.lotSize ? String(L.lotSize).replace(/\s*Sq Ft Lot/i, ' sq ft lot') : '';
    [yr ? `Built in ${yr}` : '', L.stories ? (L.stories == 1 ? 'One story, no stairs' : `${L.stories} stories`) : '', L.beds ? `${L.beds} bedrooms` : '', L.sqft ? `${Number(L.sqft).toLocaleString('en-US')} square feet` : ''].forEach(t => { if(inside.length < 5) add(inside, t); });
    [lot, L.stories ? (L.stories == 1 ? 'One story, no stairs' : `${L.stories} stories`) : ''].forEach(t => { if(outside.length < 2 + 0) add(outside, t); });
    return {inside, outside};
  };


  // ---------- the cover (also the flyer front): the spine, the whole house, the horizontal address, four tiles, write-up, two rooms, agent and the one logo ----------
  FXS.cover = (D, o) => { o = o || {};
    // owner 11/7 (FXS-24 rules): no agent or brokerage on the cover; a bigger house that bleeds top and right, a longer write-up that fills, two big rooms to the foot
    const L = D.listing, F = ((D.companion || {}).flyer || {}).front || {}, K = (D.sw || {}).front || {};
    const SPW = 102, X0 = 120, X1 = 594, CW = X1 - X0, heroId = F.hero || K.hero || 'front', HW = 621 - X0, FOOT = 774;
    let hh = 330; while(hh < 372 && !SW.fits(D, heroId, HW, hh + 9)) hh += 4;
    const fitsAll = SW.fits(D, heroId, HW, hh + 9), sideIds = FXS.coverRooms(D).slice(0, 2);
    if(!fitsAll) hh = 312;
    let h = FXS.spine(D, SPW).html;
    h += '<div data-bleed="1">' + (fitsAll ? FXS.box(D, heroId, X0, -9, HW, hh + 9, 'front.house') : SW.heroHtml(D, heroId, X0, -9, HW, hh + 9, 'front.house', sideIds)) + '</div>';
    let y = hh + 16;
    const ad = FXS.scriptLine(FXS.rawAddr(L), X0, y, CW, 31.5, 20, 'address', {lh: 1.15}); h += ad.html; y += ad.lh + 1;
    h += FXS.placeRow(L, X0, y, CW, 11, 'place'); y += 11*1.4 + 9;
    h += FXS.statsRow(FXS.statItems(L).slice(0, 4), X0, y, CW, 72, 'fact', {np: 33, lp: 9, track: 2}); y += 72 + 13;
    const rowH = fitsAll ? 150 : 0, rowY = FOOT - rowH, lh = 17.5, wuBottom = (rowH ? rowY - 12 : FOOT);
    const nL = Math.max(4, Math.floor((wuBottom - y)/lh)), tr = []; for(let t = nL; t >= Math.max(4, nL - 2); t--) tr.push(t);
    h += `<div class="abs wu" data-slot="front.summary" data-lines="${nL}" data-try="${tr.join(',')}" data-lh="${lh}" ${sd(o.intro || F.intro || (K.summary) || [])} style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:${nL*lh}pt;font-size:11.5pt;line-height:${lh}pt"></div>`;
    y += nL*lh + 12;
    if(rowH){ const rw = (CW - 10.5)/2, ry = Math.max(y, rowY), rh = FOOT - ry;
      sideIds.forEach((id, i) => { h += FXS.box(D, id, X0 + i*(rw + 10.5), ry, rw, rh, 'front.room' + i).replace('<div class="abs"', '<div class="abs" data-role="coverroom"'); }); }
    h += `<div class="abs" data-role="coverrule" style="left:${X0}pt;top:${FOOT + 14}pt;width:${CW}pt;height:0"></div>`;
    return h;
  };

  // ---------- the back (also the flyer back): the street name up the spine, the address, outdoor photos with labels and captions, four small tiles,
  // About the house (or the plan), the green ROOM SIZES box beside OUTSIDE and LOCATION, the standard agent card ----------
  FXS.back = (D, o) => { o = o || {};
    const L = D.listing, A = D.agent || {}, b = D.brand || {}, hasPlan = !!D.plan, M = 108, X1 = 585, CW = X1 - M;
    const F = (D.companion || {}).flyer || {}, FB = F.back || {}, KB = (D.sw || {}).back || {};
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot) || '';
    const hard = [(((D.sw||{}).front||{}).hero) || 'front'].concat(FXS.coverRooms(D), o.avoidHard || []), used = hard.concat(o.avoid || []);
    const first = (hasPlan ? FB.photos : (FB.photosNoplan || FB.photos)) || [];
    const all = FXS.cards(D, first), issues = [];
    const spineText = 'INSIDE ' + (String(FXS.rawAddr(L)).match(/^\d+/) || [''])[0] + ' ' + FXS.streetOnly(FXS.rawAddr(L)).toUpperCase();
    let h = FXS.spine(D, 84, {text: spineText.trim(), max: 37.5, min: 22, top: 270}).html;
    // ---- the lower block: ROOM SIZES (green box) left, OUTSIDE and LOCATION right, both ending on one baseline at 676
    const ctxTxt = hasPlan ? '' : JSON.stringify([].concat(...(FB.floors || []).map(f => f.s))),   /* only this face's own write-up counts: the back may repeat a fact from the cover */ KEYN = /garage|roof|deck|pergola|patio|balcon|gated|island|closet|fenced|yard|fireplace|pool/i;
    const SF = FXS.sellingFacts(D), near = (FB.nearby || KB.nearby || []).slice(0, 3).map(FXS.nearText);
    const said = []; const addPool = x => [].concat(x || []).forEach(v => [].concat(v).forEach(t => said.push(String(t))));
    all.slice(0, 12).forEach(c => addPool(c.s)); [].concat(...(FB.floors || []).map(f => f.s)).forEach(addPool);
    const statLike = t => /^(Built in|\d+ bedrooms|[\d,]+ square feet|One story|\d+ stories)/i.test(t);
    const coverTxt = JSON.stringify(o.coverText || '');   // only the shared piece-wide repeat check (the garage count) still looks at the cover
    const fresh0 = t => !(KEYN.exec(t) && new RegExp(KEYN.exec(t)[0], 'i').test(ctxTxt));   // the captions and the write-up are filled after the bullets and steer around them (see SW.fill)
    const fresh = t => fresh0(t) && !(/garage/i.test(t) && /garage/i.test(coverTxt));
    // OUTSIDE holds outside facts only (deck, pergola, yard, trees, garage, lot...); NEW AND UPDATED holds the real updates and features of the house (roof, windows, doors, wiring, crown molding...).
    // Same-face rule only: the back may say what the cover says, but a caption or the write-up on this face is not repeated by a bullet (the fill pass steers the captions around the bullets).
    const OUTRE = /deck|pergola|patio|fenc|yard|trees|turf|balcon|garage|gated|park|gazebo|rooftop|driveway|lot\b/i, UPD = /roof|low-?e|insulated|thermostat|wiring|breaker|plumbing|siding|three-phase|\bnew\b|replaced/i;
    const all2 = SF.outside.concat(SF.inside).filter((t, i, a) => a.indexOf(t) === i && !statLike(t));
    const bsame = (x, y) => { const A = [...cw(x)], B = cw(y); return A.length > 0 && A.length <= B.size && A.every(w => B.has(w)); };   // parallel bullets ("New roof", "New plumbing") are different facts; one that holds all of another's words is the same fact
    const dd = (list, seen) => list.filter(t => { if(seen.some(u => bsame(t, u) || bsame(u, t))) return false; seen.push(t); return true; });
    const unsaid = t => !said.some(s => SW.sameFact(t, s));
    // the outdoor photos on this strip speak for their own subject: a bullet about the same thing would repeat the caption on the same face
    const pre = all.map(c => c.photo).filter(id => FXS.OUTSIDE.test(id) && !hard.includes(id)).join(' '), BAN = [];
    if(/deck|pergola|patio|evening|terrace|gazebo|park/.test(pre)) BAN.push('deck|pergola|patio|terrace|gazebo|park');
    if(/yard|fence/.test(pre)) BAN.push('yard|fenc|turf|mow|driveway');
    if(/balcon/.test(pre)) BAN.push('balcon');
    const banRe = BAN.length ? new RegExp(BAN.join('|'), 'i') : null, allowB = t => !banRe || !banRe.test(t);
    const lotT = D.listing.lotSize ? String(D.listing.lotSize).replace(/\s*Sq Ft Lot/i, ' sq ft lot') : '';
    let outs = dd(all2.filter(t => OUTRE.test(t) && fresh(t) && allowB(t) && unsaid(t)), []);
    if(lotT && outs.length < 4 && !outs.includes(lotT)) outs.push(lotT);
    if(outs.length < 3) outs = outs.concat(all2.filter(t => OUTRE.test(t) && fresh(t) && !outs.includes(t) && allowB(t)), all2.filter(t => OUTRE.test(t) && fresh(t) && !outs.includes(t))).filter((t, i, ar) => ar.indexOf(t) === i);
    outs = outs.slice(0, hasPlan ? 3 : 4);
    const inner = dd(all2.filter(t => !OUTRE.test(t) && fresh(t)), outs.slice()), upd = inner.filter(t => UPD.test(t)), feat = inner.filter(t => !UPD.test(t));
    let roomT = upd.concat(feat);
    if(roomT.length < 5) roomT = roomT.concat(dd(all2.filter(t => !OUTRE.test(t) && !roomT.includes(t) && !(/garage/i.test(t) && /garage/i.test(coverTxt))), roomT.concat(outs)));
    const rooms = roomT.slice(0, hasPlan ? 5 : 6).map(t => ({n: t, s: ''})), boxTitle = upd.length >= 5 ? 'NEW AND UPDATED' : 'UPDATES AND FEATURES';
    const rowsL = Math.max(5, rooms.length), nOut = outs.length, nRows = nOut + near.length, lab = hasPlan ? 22 : 26;
    const boxH = Math.max((hasPlan ? 44 : 48) + rowsL*(hasPlan ? 16 : 17), lab*2 + 6 + nRows*(hasPlan ? 12.5 : 14.5)), boxTop = 661 - boxH, rowH = (boxH - 44 - 6)/rowsL, pitch = (boxH - 2*lab - 6)/nRows;
    const colW = (CW - 14)/2, bx = M, rx = M + colW + 14;
    h += `<div class="abs" data-role="updbox" style="left:${bx}pt;top:${boxTop}pt;width:${colW}pt;height:${boxH}pt;background:var(--fx-spine)"></div>`;
    h += `<div class="abs lbl onspine" style="left:${bx + 16}pt;top:${boxTop + 12}pt" data-slot="back.sizes.title" data-lines="1">${boxTitle}</div>`;
    rooms.forEach((r, i) => { const yy = boxTop + 40 + i*rowH;
      h += `<div class="abs rs" style="left:${bx + 16}pt;top:${yy}pt;width:${colW - 32}pt;height:${rowH}pt" data-slot="back.sizes.${i}" data-lines="1"><span>${esc(r.n)}</span></div>`; });
    // right: OUTSIDE (3 or 4 real facts) then LOCATION (three real places with distances); the last row ends on the box's baseline
    let ry = boxTop;
    h += `<div class="abs lbl" style="left:${rx}pt;top:${ry}pt" data-slot="back.outside.title" data-lines="1">OUTSIDE</div>`; ry += lab;
    outs.forEach((t, i) => { h += `<div class="bul" data-slot="back.outside.${i}" data-lines="1" style="left:${rx}pt;top:${ry + i*pitch}pt;width:${colW}pt;height:${pitch}pt;font-size:10pt">${esc(t)}</div>`; }); ry += nOut*pitch + 6;
    h += `<div class="abs lbl" style="left:${rx}pt;top:${ry}pt" data-slot="back.location.title" data-lines="1">LOCATION</div>`; ry += lab;
    near.forEach((t, i) => { h += `<div class="bul" data-slot="back.location.${i}" data-lines="1" style="left:${rx}pt;top:${ry + i*pitch}pt;width:${colW}pt;height:${pitch}pt;font-size:10pt">${esc(t)}</div>`; });
    // ---- the top: address, place, then the outdoor photos
    const ad = FXS.scriptLine(FXS.rawAddr(L), M, 18, CW, 27, 20, 'address', {lh: 1.15}); h += ad.html;
    h += FXS.placeRow(L, M, 18 + ad.lh, CW, 9.75, 'place');
    let y = 18 + ad.lh + 9.75*1.4 + 10;
    const capLines = 3, capLH = 13, labH = 18, capBlock = labH + capLines*capLH + 4;
    const stripPick = ph => { const ok = c => !FXS.isHouse(D, c.photo) || SW.fits(D, c.photo, 152, ph);
      let p1 = FXS.pick(D, all, 6, {avoid: used, exactAvoid: true, outdoor: true, house: true}).filter(ok);
      // nothing outdoor left that the inside pages have not used: take the next best outdoor photos (only the cover's photos stay off the back)
      if(p1.length < 3){ const more = FXS.pick(D, all, 6, {avoid: hard.concat(p1.map(c => c.photo)), outdoor: true, house: true}).filter(ok); p1 = p1.concat(more.filter(c => !p1.some(x => x.photo === c.photo))); }
      return p1; };
    // the tiles row (small), About or the plan under it
    const tilesH = hasPlan ? 0 : 50, aboutLines = 4, aboutH = 22 + aboutLines*19, below = hasPlan ? 0 : aboutH + 14;
    let ph = hasPlan ? 90 : Math.max(112, Math.min(190, Math.round(boxTop - 14 - (y + capBlock + 12 + tilesH + 12 + below))));
    let pick = stripPick(ph).slice(0, 3); if(pick.length < 2) pick = stripPick(ph);
    const n = Math.max(1, Math.min(3, pick.length)); pick = pick.slice(0, n);
    const gap = 10.5, pw = (CW - gap*(n - 1))/n;
    // plan back: the strip gives its spare height to the photos, the plan card takes the rest above the boxes
    let pcT = null;
    if(hasPlan){ const y0 = y + ph + capBlock + 16; pcT = FXS.planCard(D, M, y0, CW, Math.max(130, boxTop - 14 - y0 - 38)); const slack = boxTop - 14 - pcT.bottom; ph = Math.min(170, ph + Math.max(0, Math.round(slack)));
      const y1 = y + ph + capBlock + 16; pcT = FXS.planCard(D, M, y1, CW, Math.max(130, boxTop - 14 - y1 - 38)); }   // placed again under the final photo height: never over a caption
    pick.forEach((c, i) => { const x = M + i*(pw + gap), L0 = FXS.leadLabel(c.lead);
      h += FXS.box(D, c.photo, x, y, pw, ph, 'back.photo' + i);
      h += `<div class="abs" style="left:${x}pt;top:${y + ph + 6}pt;width:${pw}pt;white-space:nowrap"><div class="lbl" data-slot="back.photo${i}.label" data-lines="1" style="max-width:${pw}pt;font-size:10pt">${esc(L0.name.toUpperCase())}</div></div>`;
      h += `<div class="abs cap"><div class="a" style="position:absolute;left:${x}pt;top:${y + ph + labH + 6}pt;width:${pw}pt;height:${capLines*capLH}pt;font-size:9.25pt;line-height:${capLH}pt"  data-slot="back.photo${i}" data-row="back" data-lh="${capLH}" data-lines="${capLines}" data-narrow="12" ${sd(c.s)}></div></div>`; });
    y += ph + capBlock + 8;
    if(!hasPlan){ h += FXS.statsRow(FXS.statItems(L).slice(0, 4), M, y, CW, tilesH, 'back.fact', {np: 22, lp: 8, track: 1.6}); y += tilesH + 12; }
    const nk = x => String(x).toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 40), shownSet = new Set([].concat(...pick.map(c => [].concat(...(c.s || []).map(x => [].concat(x))))).map(nk));
    if(hasPlan){ h += pcT.html; issues.push(...pcT.issues); window.planIssues = pcT.issues; }
    else {
      const aboutS = [].concat(...(FB.floors || []).map(f => f.s)), aboutKept = aboutS.filter(x => ![].concat(x).some(a => shownSet.has(nk(a))));
      const free = boxTop - 12 - y, lh = 19, maxL = Math.max(3, Math.min(6, Math.floor((free - 26)/lh))), tr = []; for(let t = maxL; t >= 3; t--) tr.push(t);
      h += `<div class="abs" style="left:${M}pt;top:${y}pt;width:${CW}pt;height:${free}pt;display:flex;flex-direction:column;justify-content:center"><div style="flex:none;height:14pt;margin-bottom:8pt">${FXS.label('About the house', 'back.about.label')}</div><div class="wu" data-slot="back.about" data-lines="${maxL}" data-try="${tr.join(',')}" data-lh="${lh}" ${sd(aboutKept.length >= 3 ? aboutKept : aboutS)} style="flex:none;width:${CW}pt;height:${maxL*lh}pt;font-size:11.25pt;line-height:${lh}pt"></div></div>`;
    }
    // ---- the standard agent card under a bar, then the fine print; everything ends above the 18 pt bottom margin
    h += ContactCard.html([M - 8, 684, CW + 8, 78], Object.assign({}, A, {headshot: hsSrc}, hsSrc ? {web: ''} : {}), Object.assign({}, b, {logo: b.logo}), {layout: 'panel', size: 'mid', fine: '', bottomGap: 0.5, fieldAccent: true, s: hsSrc ? {hsW: 56, hsGap: 12, panelW: 150, name: 21, nameFloor: 15, phone: 15} : {}});
    h += `<div class="abs fine" style="left:${M}pt;top:765pt;width:${CW}pt;height:8pt;text-align:center" data-slot="fineprint" data-lines="1" data-fine="1">Information deemed reliable but not guaranteed.</div>`;
    return {html: h, issues};
  };

  // kicker label + a one-line Oswald title (fits its width) + an intro of whole sentences; returns {html, bottom}. x0/cw: the page's content column
  FXS.pageHead = (kicker, title, intro, slot, lines, y0, x0, cw) => { const M = x0 == null ? 108 : x0, CW = cw == null ? 477 : cw, Y0 = y0 == null ? 24 : y0;
    const ts = FXS.fitSize(String(title).toUpperCase(), "font-family:Oswald;font-weight:600;letter-spacing:1.2pt", CW, 26, 17), lh = 19, tr = []; for(let t = lines; t >= 3; t--) tr.push(t);
    const ty = Y0 + 20, iy = ty + ts*1.25 + 6;
    return {html: `<div class="abs" style="left:${M}pt;top:${Y0}pt">${FXS.label(kicker, slot + '.kicker')}</div>
      <div class="abs ttl2" style="left:${M}pt;top:${ty}pt;width:${CW}pt;height:${ts*1.25}pt;font-size:${ts}pt;line-height:${ts*1.25}pt" data-slot="${slot}.title" data-lines="1">${esc(String(title).toUpperCase())}</div>
      <div class="abs wu" data-slot="${slot}.intro" data-lines="${lines}" data-try="${tr.join(',')}" data-lh="${lh}" ${sd(intro)} style="left:${M}pt;top:${iy}pt;width:${CW}pt;height:${lines*lh}pt;font-size:11.25pt;line-height:${lh}pt"></div>`, bottom: iy + lines*lh}; };


  // ---------- face checks (every piece type runs these) ----------
  // 1. nothing runs past the trim or the bottom margin (fold-over and flyer faces keep 18 pt; postcards, emails and socials the trim itself). Only the spine, the page paper and the mail panels bleed.
  // 2. no fact twice on one face: any two pieces of copy on a face (a caption, a bullet, the write-up) that say the same thing (same_fact, which also catches short sentences)
  // 3. no hanging separator dot at the end or start of a line of text
  const PROSE_SKIP = /(\.label|\.kicker|\.title|\.sizes\.|\.outside\.title|\.location\.\d)|^(address|place|front\.address|front\.place|spine|fact|back\.fact|agent|oh\.|moment|fineprint|back\.fine|broker|cta|caption$|sold\.|addr|kicker|left\.box\.kicker|back\.sizes|back\.outside\.title|back\.location\.title|back\.about\.label|back\.status)/;
  const FILLER = /natural light (fills|floods|pours|streams)|(fills|floods|bathed in) the (room|space) with (natural )?light|bright and airy|plenty of natural light|a (warm|inviting) (and|atmosphere)|perfect for (entertaining|relaxing)/i;
  FXS.faceChecks = (faceSel, o) => { o = o || {}; const out = [], k = 96/72;
    document.querySelectorAll(faceSel).forEach(face => {
      if(face.matches('.page') && face.querySelector('.sheet, .panel')) return;
      const fr = face.getBoundingClientRect(), bm = (o.bottom != null ? o.bottom : face.matches('.sheet') ? (o.margin ? 18 : 0) : face.matches('.panel') ? 18 : 0)*k;
      face.querySelectorAll('[data-slot], .ph, .cc, .logo, .card, .tile, .stats, img').forEach(el => {
        if(el.closest('[data-role="spine"], .mail-panel, .mg, .bg-paper, [data-bleed]') || el.matches('[data-role="spine"], .mail-panel, .mg, .bg-paper')) return;
        if(!el.getClientRects().length) return; const r = el.getBoundingClientRect(); if(r.width < 1 || r.height < 1) return;
        if(r.right > fr.right + 1.5 || r.bottom > fr.bottom - bm + 1.5 || r.left < fr.left - 1.5 || r.top < fr.top - 1.5 || (o.bleedOk && false))
          out.push({slot: el.dataset.slot || el.className || el.tagName, kind: 'off-page', detail: `runs past the ${r.bottom > fr.bottom - bm + 1.5 ? (bm ? 'bottom margin' : 'trim (bottom)') : 'trim edge'} (bottom ${((r.bottom - fr.top)/k).toFixed(1)} pt of ${((fr.height)/k).toFixed(0)}, right ${((r.right - fr.left)/k).toFixed(1)} of ${(fr.width/k).toFixed(0)})`}); });
      // a row of captioned photos never has an empty slot: each row runs the full 477 pt column (fold-over and flyer faces)
      if(!document.querySelector('.mail-panel')){ const rowsP = {}; face.querySelectorAll('.ph[data-slot-photo]').forEach(el => { if(!/^(left|right|back)\.photo\d+$/.test(el.dataset.slotPhoto || '')) return; const r = el.getBoundingClientRect(); (rowsP[Math.round(r.top/4)] = rowsP[Math.round(r.top/4)] || []).push(r); });
        Object.values(rowsP).forEach(rs => { const span = (Math.max(...rs.map(r => r.right)) - Math.min(...rs.map(r => r.left)))/k; if(span < 477*.97) out.push({slot: 'photo-row', kind: 'row-empty-slot', detail: `a photo row is ${span.toFixed(0)} pt wide of 477 pt: a slot is empty`}); }); }
      // the cover: the two rooms start no more than 0.25 in (+0.1) under the write-up, so no band of cream opens between them
      { const wu = face.querySelector('[data-slot="front.summary"]'), rm = face.querySelector('[data-role="coverroom"]'); if(wu && rm){ const gap = (rm.getBoundingClientRect().top - wu.getBoundingClientRect().bottom)/k; if(gap > 26) out.push({slot: 'front.summary', kind: 'cover-gap', detail: `${(gap/72).toFixed(2)} in of empty cream between the write-up and the photos`}); } }
      // the plan card never touches a caption: it starts at least 0.15 in (10.8 pt) under the last line of the photo captions above it
      { const pc = face.querySelector('[data-role="plancard"]'); if(pc){ const caps = [...face.querySelectorAll('[data-slot^="back.photo"][data-lines]')].filter(e => e.textContent.trim() && !/label/.test(e.dataset.slot)); if(caps.length){
        const lastBottom = Math.max(...caps.map(e => { const r = document.createRange(); r.selectNodeContents(e); return Math.max(...[...r.getClientRects()].filter(q => q.width > .5).map(q => q.bottom)); })), gap = (pc.getBoundingClientRect().top - lastBottom)/k;
        if(gap < 10.8) out.push({slot: 'back.plan', kind: 'plan-covers-caption', detail: `the plan card starts ${gap.toFixed(1)} pt under the last caption line; 0.15 in (10.8 pt) needed`}); } } }
      // the green box never sits on the agent card: at least 0.15 in (10.8 pt) between them
      { const bx2 = face.querySelector('[data-role="updbox"]'), cc = face.querySelector('.cc'); if(bx2 && cc){ const gap = (cc.getBoundingClientRect().top - bx2.getBoundingClientRect().bottom)/k; if(gap < 10.8) out.push({slot: 'back.sizes', kind: 'box-touches-card', detail: `the green box is ${gap.toFixed(1)} pt above the agent card; 0.15 in (10.8 pt) needed`}); } }
      // no two-word phrase repeats inside one photo caption ("covered structure ... covered structure")
      face.querySelectorAll('.cap .a[data-slot]').forEach(el => { if(el.dataset.slot === 'front.hero') return; const w = (String(el.textContent).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(x => !STOPW.has(x)), seen2 = new Set(); for(let i = 0; i + 1 < w.length; i++){ const g = w[i] + ' ' + w[i + 1]; if(seen2.has(g)){ out.push({slot: el.dataset.slot, kind: 'repeated-noun', detail: `"${g}" is said twice in this caption`}); break; } seen2.add(g); } });
      // the green box is full: its rows reach at least 85% of the box's height (5 or more real updates or features)
      { const bx = face.querySelector('[data-role="updbox"]'); if(bx){ const rs = [...face.querySelectorAll('.rs')], br = bx.getBoundingClientRect(); const last = rs.length ? Math.max(...rs.map(e => e.getBoundingClientRect().bottom)) : br.top; const fill = (last - br.top)/br.height; if(rs.length < 5 || fill < .85) out.push({slot: 'back.sizes', kind: 'box-underfilled', detail: `the green box holds ${rs.length} rows and fills ${Math.round(fill*100)}% of its height; 5 or more real updates, 85% needed`}); } }
      // OUTSIDE on the back carries 3 or 4 real facts
      { const nb = face.querySelectorAll('[data-slot^="back.outside."]:not([data-slot$=".title"])').length; if(face.querySelector('[data-slot="back.outside.title"]') && nb < 3) out.push({slot: 'back.outside', kind: 'outside-short', detail: `OUTSIDE has ${nb} bullet${nb === 1 ? '' : 's'}; 3 or 4 real facts needed`}); }
      // every bath label reads FULL BATHS (or BATHS only after a half bath: "3½ BATHS"), the way _shared/baths.js writes it
      face.querySelectorAll('.tile, [data-slot^="fact"], [data-slot*=".fact."]').forEach(el => { const t = String(el.textContent).replace(/\s+/g, ' ').trim(); if(/bath/i.test(t) && !/full/i.test(t) && !/\u00bd/.test(t) && !/half/i.test(t)) out.push({slot: el.dataset.slot, kind: 'bath-label', detail: `"${t}" must read FULL BATHS (baths.js)`}); });
      // a room size is printed only beside that room's photo (the size span of a caption, or inside a caption): nowhere else, and never on a stat or a list
      face.querySelectorAll('*').forEach(el => { if(el.children.length || el.closest('.plan-room, .planwrap, svg, .cap, [data-size]') || el.hasAttribute('data-size')) return; const t = String(el.textContent);
        if(/\d+['\u2019]\s*x\s*\d+['\u2019]?/.test(t) || /\d+\s*x\s*\d+\s*(ft|feet)/i.test(t)) out.push({slot: el.dataset.slot || el.className, kind: 'size-not-by-photo', detail: `"${t.trim().slice(0, 40)}" is a room size with no photo of that room beside it`}); });
      // captions side by side run the same number of lines, with no filler
      const rows = {}; face.querySelectorAll('[data-row][data-slot]').forEach(el => { if(!el.textContent.trim()) return; (rows[el.dataset.row] = rows[el.dataset.row] || []).push(el); });
      Object.values(rows).forEach(els => { if(els.length < 2) return; const ns = els.map(e => SW.lines(e).n); if(new Set(ns).size > 1) out.push({slot: els[0].dataset.row, kind: 'row-lines-uneven', detail: `captions in one row run ${ns.join(' / ')} lines`}); });
      face.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return; if(FILLER.test(el.textContent)) out.push({slot: el.dataset.slot, kind: 'filler', detail: `"${String(el.textContent).trim().slice(0, 50)}" says nothing the photo shows`}); });
      // same fact on one face
      const items = []; face.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]') || PROSE_SKIP.test(el.dataset.slot || '')) return;
        const t = String(el.textContent).replace(/\s+/g, ' ').trim(); if(t.length < (el.classList.contains('bul') ? 6 : 10)) return;
        SW.sentences(t).forEach(s => { if(cw(s).size >= (el.classList.contains('bul') ? 2 : 3)) items.push({slot: el.dataset.slot, s}); }); });
      const hit = new Set();
      for(let i = 0; i < items.length; i++) for(let j2 = i + 1; j2 < items.length; j2++){ const a = items[i], b = items[j2]; if(a.slot === b.slot) continue;
        const isB = e => /^back\.(outside|location)\./.test(e.slot) || /^back\.sizes\./.test(e.slot), bw = x => [...cw(x)];
        const rep = (isB(a) !== isB(b)) ? (() => { const bl = isB(a) ? a : b, pr = isB(a) ? b : a, W = bw(bl.s), P = cw(pr.s); return W.length >= 2 && W.every(w => P.has(w)); })() : (isB(a) && isB(b) ? ([...cw(a.s)].every(w => cw(b.s).has(w)) || [...cw(b.s)].every(w => cw(a.s).has(w))) : SW.sameFact(a.s, b.s));   // a bullet repeats a sentence only when the sentence holds every word of it
        if(rep && !hit.has(a.slot + '|' + b.slot)){ hit.add(a.slot + '|' + b.slot); out.push({slot: b.slot, kind: 'same-fact-on-face', detail: `"${a.s.slice(0, 50)}" (${a.slot}) and "${b.s.slice(0, 50)}" say the same thing`}); } }
      face.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return; const t = String(el.textContent).trim();
        if(/(^|\s)[\u00b7\u2022|\u2013\u2014-]\s*$/.test(t) || /^\s*[\u00b7\u2022|]/.test(t)) out.push({slot: el.dataset.slot, kind: 'hanging-separator', detail: `"${t.slice(-30)}" ends or starts on a separator`}); });
    });
    return out; };

  // After the fill pass the write-up has its real height: the two cover rooms start 0.25 in (18 pt) under it and run down to the agent rule, so no cream gap opens above them
  FXS.fixCover = () => { document.querySelectorAll('.panel, .sheet').forEach(face => { const wu = face.querySelector('[data-slot="front.summary"]'), rooms = [...face.querySelectorAll('[data-role="coverroom"]')], rule = face.querySelector('[data-role="coverrule"]'); if(!wu || !rooms.length || !rule) return;
    const fr = face.getBoundingClientRect(), k = 96/72, bottom = (wu.getBoundingClientRect().bottom - fr.top)/k, ruleTop = (rule.getBoundingClientRect().top - fr.top)/k, top = bottom + 18, h = ruleTop - 14 - top;
    if(h >= 90) rooms.forEach(r => { r.style.top = top + 'pt'; r.style.height = h + 'pt'; }); }); };
  // pages that run through OHL / FXP (Open House flyer, email, socials): the repeated-phrase and duplicate-sentence checks ride on their brochureCheck
  FXS.repCheck = () => { const out = [], seenS = new Map();
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]')) return;
      const sf = SW.sameFactIn(el.textContent); if(sf) out.push({slot: el.dataset.slot, kind: 'same-fact-twice', detail: `"${sf[0].slice(0, 50)}" and "${sf[1].slice(0, 50)}" say the same thing`});
      const txt = String(el.textContent), r = SW.rep5(txt); if(r) out.push({slot: el.dataset.slot, kind: 'repeated-phrase', detail: `"${r}" repeats in one block`});
      txt.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x.length >= 28).forEach(x => { const k = x.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 48), prev = seenS.get(k);
        if(prev && prev !== el.dataset.slot) out.push({slot: el.dataset.slot, kind: 'duplicate-sentence', detail: `"${x.slice(0, 60)}" also in ${prev}`}); else seenS.set(k, el.dataset.slot); }); });
    out.push(...FXS.faceChecks('.page, .sheet'));
    FXS.extra.forEach(fn => out.push(...fn()));
    return out; };
  // Open House pages (flyer, email): the label sits on one line, every REALTOR(R) perk the agent entered is printed, the spine header is there
  FXS.extra = [];
  FXS.ohChecks = () => { const out = [], D = SW.data(), E = SW.openHouse(D), q = s => document.querySelector(s);
    const lab = q('[data-slot="oh.label"]'); if(lab && SW.lines(lab).n > 1) out.push({slot: 'oh.label', kind: 'label-wraps', detail: 'the open house label does not set on one line'});
    if(E.kind !== 'public') [[E.refreshments, 'oh.refreshments'], [E.note, 'oh.note']].forEach(([v, sl]) => { if(v && !q(`[data-slot="${sl}"]`)) out.push({slot: sl, kind: 'perk-dropped', detail: `the REALTOR\u00ae perk "${String(v).slice(0, 40)}" is missing`}); });
    if(!q('[data-role="spine"]')) out.push({slot: 'spine', kind: 'header-missing', detail: 'the green spine header is missing'});
    return out; };
  FXS.hookCheck = () => { let bc = null; Object.defineProperty(window, 'brochureCheck', {configurable: true, get: () => bc, set: v => { bc = typeof v === 'function' ? (() => v().concat(FXS.repCheck())) : v; }}); };
  window.SW = SW; window.FXS = SW;
})();
