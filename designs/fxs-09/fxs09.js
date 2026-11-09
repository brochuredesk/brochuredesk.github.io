/* fxs-09 helpers (ported from the swatchbook set's swatchbook.js, FX09 look): data, photos, captions and paragraphs that fill their boxes, logos, print checks, the set's tokens (FXS.tok, read from fxs09.css) and marks (icons, arch).

   Captions and paragraphs are written as a lead plus whole sentences (data-s). Each box has a line count; the fill pass
   picks the sentences, in the writer's order, that set in exactly that many lines with the last line at least 3/4 full.
   It never cuts a word or a sentence; when no set of whole sentences fits, the box is reported and goes back to the writer. */
(function(){
  const SW = {};
  const FXS = SW;
  const esc = SW.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pt = px => px*72/96;
  SW.data = () => JSON.parse(document.getElementById('brochure-data').textContent || '{}');


  // ---------- one phrase, once: no two sentences of one caption or paragraph say the same thing ----------
  // content words only (articles and links dropped); a pair of neighbouring content words that two sentences share, or a 5-word run that
  // repeats, is a repeat ("island with a raised breakfast bar" / "the island has a raised breakfast bar"). Generic pairs ("living room") do not count.
  const STOP = /^(a|an|the|and|of|to|is|are|in|on|with|it|its|has|have|at|as|by|for|from|into|that|this|there|their|up|out|one|two|three)$/;
  const GENERIC = new Set(['house', 'home', 'room', 'rooms', 'living', 'dining', 'floor', 'floors', 'level', 'kitchen', 'bedroom', 'ceilings', 'ceiling', 'high', 'new', 'large', 'wood', 'area', 'space', 'second', 'first', 'third', 'fourth', 'primary', 'suite', 'bath', 'door', 'doors', 'windows', 'window', 'natural', 'light']);
  const toks = s => String(s).toLowerCase().replace(/[^a-z0-9' -]/g, ' ').split(/\s+/).filter(w => w && !STOP.test(w));
  SW.usedS = new Set(); SW.usedList = []; SW.norm = s => toks(s).join(' ');
  const SF_STOP = new Set('a an the and of to from with in on at its it is are by for this that one two room'.split(' '));
  const sfw = s => new Set((String(s).toLowerCase().match(/[a-z0-9'-]+/g) || []).filter(w => !SF_STOP.has(w)));
  // the same fact in other words (as scripts/fxsets/carousel_copy.py same_fact): 60% of the shorter sentence's content words are in the other
  SW.sameFact = (a, b) => { const x = sfw(a), y = sfw(b), small = Math.min(x.size, y.size); if(small < 3) return false; let c = 0; x.forEach(w => { if(y.has(w)) c++; }); return c/small >= 0.6; };
  SW.phraseRepeat = sents => {
    const seen = [];
    for(const s of sents){ const t = toks(s), bg = new Set();
      for(let i = 0; i + 1 < t.length; i++){ if(GENERIC.has(t[i]) && GENERIC.has(t[i + 1])) continue; if(GENERIC.has(t[i]) || GENERIC.has(t[i + 1])) { if(!(t[i].length > 4 && t[i + 1].length > 4)) continue; } bg.add(t[i] + ' ' + t[i + 1]); }
      for(const o of seen) for(const b of bg) if(o.has(b)) return b;
      seen.push(bg); }
    return '';
  };

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
      // owner 11/7/2026: an exterior crop never cuts off the roof or the sides of the house, on every design. A whole-house photo must carry its house outline (box) so the crop can be checked.
      if((p.fullHouse || /^front/.test(el.dataset.photo)) && !p.box && !p.crop) issues.push({slot: el.dataset.slotPhoto || el.dataset.photo, kind: 'house-box-missing', detail: `${el.dataset.photo} shows the whole house but has no house outline, so its crop cannot be checked`});
      const W = p.w || img.naturalWidth, H = p.h || img.naturalHeight; if(!W || !H) return;
      const tw = el.clientWidth, th = el.clientHeight, ia = W/H, ta = tw/th;
      if(p.crop){   // p.crop = [x0, y0, x1, y1] (fractions of the photo): the frame shows only inside it (a parked truck, a toilet), as large as the frame allows
        const [cx0, cy0, cx1, cy1] = p.crop; let wv = cx1 - cx0, hv = cy1 - cy0; const ca = (wv*W)/(hv*H);
        if(ta > ca) hv = wv*W/(ta*H); else wv = hv*H*ta/W;
        const hcx = p.box ? (p.box[0] + p.box[2])/2 : (cx0 + cx1)/2;
        const x0 = Math.min(cx1 - wv, Math.max(cx0, hcx - wv/2)), y0 = Math.min(cy1 - hv, Math.max(cy0, (cy0 + cy1)/2 - hv/2));
        img.style.cssText = `position:absolute;max-width:none;object-fit:fill;width:${(tw/wv).toFixed(2)}px;height:${(th/hv).toFixed(2)}px;left:${(-x0*tw/wv).toFixed(2)}px;top:${(-y0*th/hv).toFixed(2)}px`;
        return;
      }
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
      if(p.zoom){ img.style.transformOrigin = `${(fx*100).toFixed(1)}% ${(fy*100).toFixed(1)}%`; img.style.transform = `scale(${p.zoom})`; }   // a tighter crop (still at least 300 ppi)
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
  const html = (lead, sents) => (lead ? `<b>${esc(lead).replace(/(\d+['\u2032] x \d+['\u2032])/g, '<span style="white-space:nowrap">$1</span>')}</b> ` : '') + esc(sents.join(' '));   // a size never breaks across lines
  // The sets of whole sentences (the first always stays) that set in exactly T lines with the last line 3/4 full or more.
  // Returns {pick, fill} (fewest sentences first), or null with el.dataset.diag saying how close the pool came.
  const pickFor = (el, T) => {
    // each sentence is a string, or a list of ways to say the same fact at different lengths (only one is ever used)
    if(el.dataset.justify) el.style.textAlign = 'left';   // measured ragged; settle justifies the pick
    const S = JSON.parse(el.dataset.s).map(x => [].concat(x)), lead = el.dataset.lead || '', n = Math.min(S.length, 12);
    let best = null, near = null, hi = null, lo = null;
    const full = S.map(a => a[0]);
    el.innerHTML = html(lead, full); const A = SW.lines(el), allLen = (lead ? lead.length + 1 : 0) + full.join(' ').length, cpl = allLen / Math.max(.5, A.n - 1 + A.fill);
    const lead0 = lead ? lead.length + 1 : 0;
    const KEYN = /\b(gas|granite|island|breakfast|pergola|garage|tray|tile|tub|soaking|stainless|marble|quartz|fireplace|pantry|balcony|skylight|shaker|cherry|pendant|vaulted|beam|patio|porch|stucco|pool|elevator|rooftop|fan|crown|arched|french|carpet|hardwood|cabinets|backsplash|windows)\b/gi;
    const dupKey = pick => { const seen = new Set(); for(const s of pick){ const mine = new Set((String(s).toLowerCase().match(KEYN) || []).map(w => w === 'cabinets' ? 'cabinet' : w)); for(const w of mine){ if(seen.has(w)) return true; } mine.forEach(w => seen.add(w)); } return false; };
    const test = (pick, ix) => {
      const est = (lead0 + pick.join(' ').length) / cpl;
      if(est < T - 1.5 || est > T + (el.dataset.linefill ? 1.8 : 0.9)) return;
      el.innerHTML = html(lead, pick);
      const L = SW.lines(el);
      if(L.n === T + 1 && (!hi || L.fill < hi.fill)) hi = {fill: L.fill};
      if(L.n === T - 1 && (!lo || L.fill > lo.fill)) lo = {fill: L.fill};
      if(L.n !== T) return;
      if(!near || L.fill > near.fill) near = {pick, fill: L.fill};
      if(el.dataset.reach){ const rg = document.createRange(); rg.selectNodeContents(el); const rr = Math.max(...[...rg.getClientRects()].filter(q => q.width > 1).map(q => q.right)); if(+el.dataset.w0 - (rr - el.getBoundingClientRect().left)*.75 > +el.dataset.reach) return; }   // data-reach: the longest line ends within this many pt of the box's full width
      if(L.fill < Math.max(0.76, +el.dataset.fill || 0)) return;   // data-fill: a write-up's own floor for its last line (0.9, owner 11/7-11/8)
      if(el.dataset.linefill && (L.min < +el.dataset.linefill || L.fill < +(el.dataset.lastfill || 0.795))) return;   // owner 11/8: box bullets, every natural line 80%+ and the last line 90%+ (then justified)
      if(el.dataset.lfill && L.min < +el.dataset.lfill) return;   // a justified write-up: every line already 80%+ full set ragged, so justifying never opens wide gaps
      const rank = ((dupKey(pick) || SW.phraseRepeat(pick)) ? 3000 : 0) + (pick.some(s => SW.usedList.some(u => SW.sameFact(s, u))) ? 1500 : 0);   // a repeated phrase is the last resort, a sentence already used on the piece the next to last
      const score = (L.fill >= 0.8 ? 1000 : 500) - pick.length * 10 + L.fill - rank - (ix || []).reduce((a, b) => a + b, 0) * 0.25 + (el.dataset.lfill ? 20*L.min : 0);   // earlier sentences first: the pool is written most important first   // the fewest, fullest sentences that fill the box; the last line well filled
      if(!best || score > best.score) best = {score, pick, fill: L.fill};
    };
    const walk = (m, i, acc, ix) => {
      if(i === n){ test(acc, ix); return; }
      if(!(m >> i & 1)){ walk(m, i + 1, acc, ix); return; }
      for(const alt of S[i]) walk(m, i + 1, acc.concat(alt), ix.concat(i));
    };
    for(let m = 1; m < (1 << n); m += 2) walk(m, 0, [], []);   // the first sentence always stays: it carries the point of the box
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
  const LH = 12.5, CAPPAD = 5;
  SW.fill = () => {
    document.querySelectorAll("[data-justify]").forEach(e => { e.style.textAlign = "left"; });   // a second fill pass measures ragged lines
    const issues = [];
    const caps = [...document.querySelectorAll('.cap .a[data-s]')], rest = [...document.querySelectorAll('[data-s]')].filter(e => !caps.includes(e));
    const settle = (el, T) => {   // T lines: the best set, else the nearest and a report
      const lead = el.dataset.lead || '', b = pfN(el, T);
      if(el.__picked){ el.__picked.forEach(s => { const i = SW.usedList.indexOf(s); if(i >= 0) SW.usedList.splice(i, 1); }); el.__picked = null; }   // a refill forgets this box's own earlier pick
      if(b){ el.innerHTML = html(lead, b.pick); delete el.dataset.diag; el.__picked = b.pick.slice(); b.pick.forEach(s => { SW.usedS.add(SW.norm(s)); SW.usedList.push(s); }); }
      else el.innerHTML = html(lead, el.__near ? el.__near.pick : JSON.parse(el.dataset.s).map(x => [].concat(x)[0]));
      if(el.dataset.justify) el.style.textAlign = 'justify';
      el.dataset.lines = T; return !!b;
    };
    const one = el => {
      // data-try="5,4,3": the line counts this box may take (most lines first); the first that the whole sentences fill (last line 3/4 full) wins
      const tries = (el.dataset.try || '').split(',').map(Number).filter(Boolean);
      if(el.dataset.lastladder){   // owner 11/8: the last line reaches as far as the pool allows without repeating a phrase
        const lad = el.dataset.lastladder.split(',').map(Number); let ok = false;
        for(const lf of lad){ el.dataset.lastfill = lf; for(const t of tries){ const b = pfN(el, t); if(b && b.score > 0){ ok = true; break; } } if(ok) break; }
      }
      if(tries.length){
        let T = tries.find(t => pfN(el, t));
        if(!T){ let bestT = tries[0], bf = -1; tries.forEach(t => { pfN(el, t); if(el.__near && el.__near.fill > bf){ bf = el.__near.fill; bestT = t; } }); T = bestT; }
        settle(el, T);
        if(el.dataset.lh) el.style.height = (T * +el.dataset.lh) + 'pt';
      } else settle(el, +el.dataset.lines || 1);
    };
    SW.refill = one;   // refit one box (its data-try, width and type may have changed)
    rest.forEach(one);
    document.querySelectorAll('[data-justify]').forEach(e => { e.style.textAlign = 'justify'; });   // owner 11/8 (write-ups every line 90%+, ideally justified): fitted ragged, then justified
    // photo captions shrink to what their sentences honestly fill (never padded): the photo takes the room. The captions in one row share a line count when they can.
    const groups = new Map();
    caps.forEach(el => { const g = el.dataset.row ? 'row:' + el.dataset.row : (el.closest('.row') || el); (groups.get(g) || groups.set(g, []).get(g)).push(el); });
    // owner 11/8/2026 (standing rule, every design): a caption under a photo keeps the photo's full width (never narrowed); every line, set
    // ragged, runs 80%+ of that width (the last line too), then the caption is justified so its right edge lines up under the photo. When the
    // sentences can't fill the lines at the set size the type grows (up to +12%, same line count). Never shortened, never empty space under a photo.
    const fillGroup = els => {
      const max = Math.max(...els.map(e => +e.dataset.lines)), lo = els.some(e => e.dataset.exact || e.dataset.min) ? 3 : 2;
      const base = els.map(e => { const cur = parseFloat(e.style.fontSize) || parseFloat(getComputedStyle(e).fontSize) * .75; return (e.dataset.grownTo && Math.abs(cur - +e.dataset.grownTo) < .01) ? +e.dataset.grownFrom : cur; });
      els.forEach((e, i) => { e.dataset.narrow = '0'; e.dataset.linefill = '0.8'; e.dataset.lastfill = '0.8'; e.style.width = ''; delete e.dataset.w0; e.style.textAlign = 'left'; e.dataset.grownFrom = base[i]; });
      const grow = k => els.forEach((e, i) => { e.style.fontSize = (base[i] * k) + 'pt'; e.dataset.grownTo = base[i] * k; delete e.dataset.w0; e.style.width = ''; });
      const ladder = els.some(e => e.dataset.reachMax) ? [els[0].dataset.reachMax || '9', '16', null] : [null];   // captions that must reach the photo's edge try the tight reach first, then relax
      const choose = (T0, T1) => { for(const rv of ladder){ els.forEach(e => { if(rv == null) delete e.dataset.reach; else e.dataset.reach = rv; }); for(let T = T0; T >= T1; T--) if(els.every(e => pfN(e, T))) return T; } return null; };
      let chosen = null;
      for(const k of [1, 1.03, 1.06, 1.09, 1.12]){ grow(k); chosen = choose(max, max); if(chosen) break; }
      if(!chosen){ grow(1); chosen = choose(max - 1, lo); }
      if(!chosen) grow(1);
      els.forEach(e => {
        const lead = e.dataset.lead || '';
        let T = chosen;
        if(!T){   // no common count: this one alone, at the count it fills best (or comes closest to)
          let bestNear = null;
          for(let t = max; t >= lo && !T; t--){ if(pfN(e, t)) T = t; else if(e.__near && (!bestNear || e.__near.fill > bestNear.fill)) bestNear = {t, fill: e.__near.fill}; }
          if(!T) T = bestNear ? bestNear.t : lo;
        }
        settle(e, T); e.style.textAlign = 'justify';
      });
      const h = Math.max(...els.map(e => +e.dataset.lines));
      const slack = els.some(e => e.dataset.exact || e.dataset.slack) ? 3 : 0;   // inside captions get 3 pt of slack so a serif lead never clips a line
      els.forEach(e => { const lh = +e.dataset.lh || LH; e.style.height = (+e.dataset.lines * lh + slack) + 'pt'; });
      const lh0 = +els[0].dataset.lh || LH;
      els.forEach(e => { e.parentElement.style.height = (CAPPAD + h * lh0 + slack) + 'pt'; });
    };
    SW.fillGroup = fillGroup; groups.forEach(fillGroup);
    return issues;
  };

  // ---------- logos ----------
  // the floors column fills its height (owner 11/7/2026: no blank space; a back that has its tables and still has room takes bigger type):
  // the largest type, then the most lines, at which every floor's whole sentences fill their lines and the column still fits; what is left (under a line) spreads between the sections
  SW.fillColumns = () => document.querySelectorAll('.floorscol').forEach(col => {
    const bodies = [...col.querySelectorAll('.body[data-slot*=".sec"]')]; if(!bodies.length) return;
    const room = () => { const r = col.getBoundingClientRect(), kids = [...col.children]; return (r.bottom - Math.max(...kids.map(k => k.getBoundingClientRect().bottom)))*.75; };
    const r0 = room(); if(r0 > -4 && r0 < 40 && !bodies.some(b => b.dataset.fill && !b.__picked)) return;   // already full; an overflowing column is refit too
    const n0 = bodies.reduce((n, b) => n + b.textContent.length, 0);
    const keep = bodies.map(b => ({fs: b.style.fontSize, lh: b.style.lineHeight, dlh: b.dataset.lh, tr: b.dataset.try}));
    const forget = () => bodies.forEach(b => { (b.__picked || []).forEach(x => { const i = SW.usedList.indexOf(x); if(i >= 0) SW.usedList.splice(i, 1); }); b.__picked = null; });   // every try starts from the same state, so the setting measured is the setting kept
    const apply = (fs, L) => { forget(); bodies.forEach(b => { const lh = +(fs*1.55).toFixed(1); b.style.fontSize = fs + 'pt'; b.style.lineHeight = lh + 'pt'; b.dataset.lh = lh;
      const tr = []; for(let t = L; t >= 2; t--) tr.push(t); b.dataset.try = tr.join(','); delete b.dataset.w0; delete b.dataset.diag; b.style.width = ''; b.style.height = ''; SW.refill(b); }); };
    const fits = () => room() >= 0 && bodies.every(b => b.scrollHeight <= b.clientHeight + 2 && (!b.dataset.fill || b.__picked));   // a write-up with its own floor (data-fill) counts only when a set of sentences met it   // the column fits and no write-up spills out of its own box
    const fs0 = parseFloat(getComputedStyle(bodies[0]).fontSize)*.75, FSL = bodies.some(b => b.dataset.fill) ? (() => { const a = []; for(let f = fs0*1.25; f >= fs0 - 0.01; f -= 0.25) a.push(+f.toFixed(2)); return a; })() : [12.5, 12, 11.5, 11, 10.5];   // data-fill columns: 0.25 pt steps from 1.25x down to the set type (owner 11/8: bigger type, never a shorter line)
    let done = false;
    // longer write-ups and bigger type together: the biggest type whose write-ups run at least 15% longer than before the fill (with a facts table: nearly the most text that fits), then the most text
    const tryAll = () => { const ok = []; for(const fs of FSL) for(let L = 9; L >= 2; L--){ apply(fs, L); if(!fits()) continue; ok.push({fs, L, n: bodies.reduce((n, b) => n + b.textContent.length, 0)}); break; }
      const mx = Math.max(0, ...ok.map(o => o.n)), best = ok.filter(o => o.n >= (col.querySelector(".facts") ? .97*mx : Math.min(mx, 1.15*n0))).sort((a, b) => b.fs - a.fs || b.n - a.n)[0];
      if(best){ apply(best.fs, best.L); done = true; } };
    tryAll();
    const ft = col.querySelector('.facts'); if(!done && ft){ ft.parentElement.style.display = 'none'; ft.parentElement.previousElementSibling.style.display = 'none'; tryAll(); }   // the table goes only when the write-ups cannot fit beside it
    if(done && !fits()) done = false;
    if(!done){ forget(); bodies.forEach((b, i) => { const k = keep[i]; b.style.fontSize = k.fs; b.style.lineHeight = k.lh; b.dataset.lh = k.dlh; b.dataset.try = k.tr; delete b.dataset.w0; b.style.width = ''; b.style.height = ''; SW.refill(b); }); }
    col.style.justifyContent = 'space-between'; col.querySelectorAll(':scope > .hr').forEach(h => { h.style.margin = '10pt 0'; });
  });
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
    // text printing over other text, and text cut off by a box around it (11/7: "jordanreyes.com" printed on "Thinking about selling?" and nothing flagged it,
    // because this check had no text-overlap pass at all). Each text line's box, less 12% of the type size top and bottom, may not cross another slot's.
    { const leaves = [...document.querySelectorAll('[data-slot]')].filter(el => !el.querySelector('[data-slot]') && el.textContent.trim() && el.getClientRects().length && !el.closest('.cc'));
      const boxes = leaves.map(el => { const r = document.createRange(); r.selectNodeContents(el); const fs = parseFloat(getComputedStyle(el).fontSize);
        return [...r.getClientRects()].filter(q => q.width > 1 && q.height > 1).map(q => ({left: q.left, right: q.right, top: q.top + fs*0.12, bottom: q.bottom - fs*0.12})); });
      for(let i = 0; i < leaves.length; i++) for(let j = i + 1; j < leaves.length; j++){
        const hit = boxes[i].some(a => boxes[j].some(b => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5));
        if(hit && !(/^front\.status2?$/.test(leaves[i].dataset.slot) && /^front\.status2?$/.test(leaves[j].dataset.slot))) issues.push({slot: leaves[i].dataset.slot + ' / ' + leaves[j].dataset.slot, kind: 'text-overlap'}); }   // the Just / Sold lockup is stacked on purpose
      leaves.forEach(el => { for(let p = el.parentElement; p && p !== document.body; p = p.parentElement){
        const o = getComputedStyle(p).overflow; if(o === 'visible' || p.classList.contains('ph')) continue;
        const r = el.getBoundingClientRect(), q = p.getBoundingClientRect();
        if(r.bottom > q.bottom + 1 || r.right > q.right + 1) issues.push({slot: el.dataset.slot, kind: 'clipped', text: el.textContent.trim().slice(0, 80)});
        break; } }); }
    document.querySelectorAll('[data-s][data-slot]').forEach(el=>{
      if(+el.dataset.lines < 2 || !el.textContent.trim()) return;
      const L = SW.lines(el);
      if(L.n < +el.dataset.lines) issues.push({slot:el.dataset.slot, kind:'caption-short', lines:L.n, want:+el.dataset.lines, diag: el.dataset.diag || ''});
      else if(L.fill < Math.max(0.75, (+el.dataset.fill || 0) - 0.005)) issues.push({slot:el.dataset.slot, kind:'last-line-short', pct:Math.round(L.fill*100), diag: el.dataset.diag || ''});
    });
    document.querySelectorAll('.ph[data-photo]').forEach(el => { const p = (D.photos || {})[el.dataset.photo]; if(!p || !p.w || !p.h) return; const wi = el.clientWidth/96, hi = el.clientHeight/96, z = p.zoom || 1, ppi = Math.round(Math.min(p.w/wi, p.h/hi)/z); (window.__ppi = window.__ppi || []).push({slot: el.dataset.slotPhoto || el.dataset.photo, photo: el.dataset.photo, ppi}); });   // native ppi is information only: the renderer enlarges to 300 ppi at the largest placement
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
        const views = ((D.sw || {}).views || []).some(g => g.includes(id) && g.includes(prev));   // sw.views: photos that show different parts of one outdoor space (owner 11/7/2026: several photos, each with its own description)
        if(prev && prev !== id && !views) issues.push({slot: el.dataset.slotPhoto || id, kind: 'near-duplicate-photo', detail: `${id} and ${prev} show the same room or view on one page`});
        else if(prev === id) issues.push({slot: el.dataset.slotPhoto || id, kind: 'duplicate-photo', detail: `${id} is on the page twice`});
        seen.set(key, id);
      });
    });
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]') || !el.getClientRects().length) return; const t = el.textContent.trim(); if(t.split(/\s+/).length < 8) return;
      const hit = SW.phraseRepeat(t.split(/(?<=[.!?])\s+/)); if(hit) issues.push({slot: el.dataset.slot, kind: 'repeated-phrase', detail: `"${hit}" is said twice in this caption or paragraph`}); });
    // the same sentence (or the same fact said again) never appears twice in one piece
    { const seenS = [];
      // the photo captions of the piece (the lead - the room name and size - is not a sentence): no two say the same fact
      document.querySelectorAll('[data-slot]').forEach(el => { if(el.querySelector('[data-slot]') || !el.getClientRects().length || !/(^|\.)(photo\d*|hero)$/.test(el.dataset.slot || '') || !el.closest('.cap, .a, [data-s]')) return;
        let t = el.textContent.trim(); const lead = el.dataset.lead || ''; if(lead && t.startsWith(lead)) t = t.slice(lead.length).trim(); if(t.split(/\s+/).length < 5) return;
        t.split(/(?<=[.!?])\s+/).forEach(s => { if(s.split(/\s+/).length < 4) return;
          const hit = seenS.find(o => o.slot !== el.dataset.slot && SW.sameFact(o.s, s));
          if(hit) issues.push({slot: el.dataset.slot, kind: 'repeated-sentence', detail: `"${s.slice(0, 60)}" says what "${hit.s.slice(0, 40)}" already said on this piece`});
          seenS.push({s, slot: el.dataset.slot}); }); }); }
    // no photo number, QR, pin or listing price anywhere on the piece
    if(/\bqr\b|scan for/i.test(document.body.innerText)) issues.push({slot:'piece', kind:'qr-text'});
    if(/\bsamples?\b|stand-?in|standing in/i.test(document.body.innerText)) issues.push({slot:'piece', kind:'sample-text', detail:'the word sample or stand-in prints on the piece'});
    if(window.ContactCard) issues.push(...ContactCard.check(document));
    if(window.IvoryPlan) issues.push(...IvoryPlan.check());
    return issues;
  };
  // the physical space of a photo (scripts/fxsets/spaces.py, same table): two views of one space count as one room
  const SPACES = {'1': {'backyard': ['patio', 'yard'], 'front': ['front', 'front2'], 'kitchen': ['kitchen', 'kitchen2'], 'living': ['living', 'openplan'], 'primarybath': ['bath', 'shower']}, '2': {'backyard': ['deck', 'patio', 'pergola', 'evening', 'fence'], 'front': ['front', 'front2'], 'living': ['family', 'family2', 'wine'], 'dining': ['dining', 'dining2'], 'game': ['game', 'game2', 'game3'], 'primary': ['primary', 'primary2'], 'primarybath': ['pbath', 'pbath2'], 'bed2': ['bed2', 'bed2b'], 'kitchen': ['kitchen', 'kitchen2'], 'entry': ['foyer', 'stair']}, '3': {'balcony': ['balcony', 'balcony2'], 'sidewalk': ['entry', 'walk'], 'backyard': ['yard', 'yard2'], 'kitchen': ['kitchen', 'kitchen2', 'kitchen3'], 'living': ['family', 'openplan', 'ceiling'], 'primary': ['primary', 'primary2'], 'primarybath': ['pbath', 'pbath2'], 'game': ['game', 'game2']}, '4': {'rooftop': ['terrace', 'terrace2', 'skyline'], 'park': ['park', 'gazebo'], 'living': ['living', 'living2', 'living3', 'living4'], 'kitchen': ['kitchen', 'kitchen2'], 'primary': ['primary', 'primary2'], 'primarybath': ['pbath', 'pbath2'], 'bed2': ['bed2', 'bed2b'], 'bath2': ['bath2', 'bath2b']}};
  SW.famOf = id => { id = String(id); const st = ((SW.data() || {}).listing || {}).stories, tb = SPACES[st] || {};
    for(const k in tb) if(tb[k].includes(id)) return k;
    id = id.replace(/(\d)[a-z]$/, '$1'); return /^(deck|pergola|patio|fence|evening)\d*$/.test(id) ? 'outdoor' : /^(front)\d*$/.test(id) ? 'front' : /^(primary|game|terrace|gazebo)\d*$/.test(id) ? id.replace(/\d+$/, '') : id.replace(/(\d+b?|b)$/, ''); };
  SW.placements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));


  // ---------- single pieces (Open House flyers, postcards) ----------
  // The page: print adds 0.125 in bleed on postcards, and a white 0.25 in margin on flyers (home printers): the sheet is clipped
  // to the margin, so the gray band and every photo stop 0.25 in from the paper's edge there.
  SW.frame = function(D, trimW, trimH, inner, cls){
    const mode = D.mode || 'email', P = D.piece || {};
    const bleed = (mode === 'print' && P.print === 'bleed') ? 9 : 0;
    const inset = (mode === 'print' && P.print === 'margin') ? (P.margin || 18) : 0;
    const W = trimW + 2*bleed, H = trimH + 2*bleed;
    return {W, H, bleed, inset, html: `<div class="page spage ${cls||''}" data-page="${esc(P.id||'')}" style="width:${W}pt;height:${H}pt;background:var(--fx-paper)">
      <div class="sheet abs panel" style="left:${bleed}pt;top:${bleed}pt;width:${trimW}pt;height:${trimH}pt;${inset ? `clip-path:inset(${inset}pt)` : ''}">${inner}</div></div>`};
  };
  SW.setup = async function(D){
    await Promise.all(['400 10pt "DM Sans"','500 10pt "DM Sans"','600 10pt "DM Sans"','700 10pt "DM Sans"','400 10pt "DM Serif Display"','italic 400 10pt "DM Serif Display"'].map(f => document.fonts.load(f)));
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
    let ia = p.w/p.h, ta = w/h, [x0, y0, x1, y1] = p.box;
    if(p.crop){ const [cx0, cy0, cx1, cy1] = p.crop, cw = cx1 - cx0, ch = cy1 - cy0; ia = (cw*p.w)/(ch*p.h); [x0, y0, x1, y1] = [(Math.max(x0, cx0) - cx0)/cw, (Math.max(y0, cy0) - cy0)/ch, (Math.min(x1, cx1) - cx0)/cw, (Math.min(y1, cy1) - cy0)/ch]; }   // the house inside the crop
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


  // ---------- the set's tokens (fxs09.css is the one source) and marks ----------
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  FXS.tok = new Proxy({}, {get: (_, k) => ({
    paper: cssVar('--fx-paper'), band: cssVar('--fx-band'), ink: cssVar('--fx-ink'), ink2: cssVar('--fx-ink2'), text: cssVar('--fx-text'),
    textDark: cssVar('--fx-text-dark'), mute: cssVar('--fx-mute'), rule: cssVar('--fx-rule'), onInk: cssVar('--fx-on-ink'),
    onInkSoft: cssVar('--fx-on-ink-soft'), font: 'DM Sans', serif: 'DM Serif Display', copper: cssVar('--fx-copper'), navy: cssVar('--fx-navy'), cream: cssVar('--fx-cream'), slate: cssVar('--fx-slate'), boxBg: cssVar('--fx-box-bg'), m: parseFloat(cssVar('--fx-m')),
    ruleW: parseFloat(cssVar('--fx-rule-w')), barW: parseFloat(cssVar('--fx-bar-w'))})[k]});
  // line icons (24 box, round caps): FX09's own five, plus stories and lot in the same hand
  FXS.ICON = {
    bed:'<path d="M3 18v-7h18v7M3 14h18M6 11V8h5v3M13 11V8h5v3"/>',
    bath:'<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/>',
    area:'<path d="M4 4h16v16H4zM4 9h5M15 20v-5h5"/>',
    cal:'<path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"/>',
    pin:'<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    stories:'<path d="M4 11l8-6 8 6M6 9.5V20h12V9.5M6 14.5h12"/>',
    lot:'<path d="M3 4h18v16H3z" stroke-dasharray="2.2 1.8"/><path d="M7.5 14.5l4.5-4 4.5 4M9 13.2V17h6v-3.8"/>'
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
    // FX09: the whole address on one line in the serif, mixed case; a long one steps down, then runs two lines
    const A = String(address || '').trim().replace(/\s+/g, ' ');
    const css = "font-family:'DM Serif Display';font-weight:400;letter-spacing:-.5pt";
    const s1 = FXS.fitSize(A, css, w, max, max*.7);
    if(FXS.width(A, `${css};font-size:${s1}pt`) <= w) return {num: '', lines: [A], s: s1};
    const ws = A.split(' '); let best = null;
    for(let i = 1; i < ws.length; i++){ const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '), d = Math.max(FXS.width(a, `${css};font-size:20pt`), FXS.width(b, `${css};font-size:20pt`)); if(!best || d < best.d) best = {d, l: [a, b]}; }
    const l = best ? best.l : [A];
    return {num: '', lines: l, s: Math.min(max, Math.min(...l.map(t => FXS.fitSize(t, css, w, max, 14))))};
  };
  // the street block as html at (x, y) in width w: the address in the serif; returns {html, h}
  FXS.streetBlock = (address, x, y, w, max, slot, color) => {
    const st = FXS.street(address, w, max); let yy = y, h = '';
    st.lines.forEach(t => { h += `<div class="abs ttl" style="left:${x}pt;top:${yy}pt;width:${w}pt;height:${st.s*1.1}pt;font-size:${st.s}pt;line-height:${st.s*1.1}pt;${color ? 'color:' + color : ''}" data-slot="${slot}" data-lines="1">${esc(t)}</div>`; yy += st.s*1.1; });
    return {html: h, h: yy - y, st};
  };
  // light words then a bold last word: "Two levels, one private deck." -> light + bold
  FXS.lightBold = t => esc(String(t).trim());

  // ---------- FX09's own marks: the kicker row and the big-numerals stat row ----------
  const STORY_WORD = {1: 'One story', 2: 'Two stories', 3: 'Three stories', 4: 'Four stories', 5: 'Five stories'};
  // kicker row: the neighborhood in copper at the left, the stories and county in slate at the right, one hairline under both
  FXS.kicker = (L, x, y, w, slot, rule) => {
    const H0 = window.FX09HEAD ? window.FX09HEAD(SW.data()) : {left: String(L.neighborhood || '').toUpperCase(), right: ''};
    let h = `<div class="kick" style="left:${x}pt;top:${y}pt;width:${w*.5}pt;height:12pt;color:var(--fx-ink2)" data-slot="${slot}.left" data-lines="1">${esc(H0.left)}</div>`;
    let rtr = 3;   // a long right-hand pair tightens its tracking so it never runs into the neighborhood
    if(H0.right){ const wl = FXS.width(H0.left, `font:700 9pt 'DM Sans';letter-spacing:3.75pt;text-transform:uppercase`), wr = t => FXS.width(H0.right, `font:500 9pt 'DM Sans';letter-spacing:${t}pt;text-transform:uppercase`); while(rtr > 1 && wl + wr(rtr) + 24 > w) rtr -= .25; }
    if(H0.right) h += `<div class="kick" style="left:${x + w*.4}pt;top:${y}pt;width:${w*.6}pt;height:12pt;color:var(--fx-text);font-weight:500;text-align:right;letter-spacing:${rtr}pt" data-slot="${slot}.right" data-lines="1">${esc(H0.right)}</div>`;
    if(rule !== false) h += `<div class="hr" style="left:${x}pt;top:${y + 16}pt;width:${w}pt"></div>`;
    return h;
  };
  // the four stats: [value, label]; the listing's own numbers, nothing invented
  FXS.statItems = (L, five) => {
    const out = [], n = v => Number(v).toLocaleString('en-US');
    if(L.beds) out.push([String(L.beds), 'Bedrooms']);
    if(L.baths){ const b = window.BD && BD.bathNum ? BD.bathNum(L) : {num: String(L.baths), label: ''}; out.push([String(b.num).replace(/<[^>]*>/g, ''), b.label === 'Baths' ? 'Baths' : (+L.baths === 1 ? 'Full bath' : 'Full baths')]); }
    if(L.sqft) out.push([n(L.sqft), 'Square feet']);
    const yr = L.yearBuilt || L.year; if(yr) out.push([String(yr), 'Year built']);
    const lot = String(L.lotSize || '').match(/^([\d,\.]+)\s*(sq ft|acres?)/i); if(lot) out.push([lot[1], lot[2].toLowerCase().startsWith('acre') ? 'Acres' : 'Lot sq ft']);
    return out.slice(0, five ? 5 : 4);
  };
  // the row across width w at (x, y): equal columns, a hairline before every column but the first; returns {html, h}
  FXS.statRow = (items, x, y, w, slot, o) => {
    o = o || {}; const cw = w/items.length, vs = o.size || 33, lh = vs*1.09;
    let h = '';
    items.forEach(([v, l], i) => {
      const cx = x + i*cw;
      h += `<div class="stat" style="left:${cx}pt;top:${y}pt;width:${cw}pt"><div class="sv" style="font-size:${vs}pt;line-height:${lh}pt" data-slot="${slot}.${i}" data-lines="1">${esc(v)}</div><div class="sl" style="${o.lbl ? `font-size:${o.lbl}pt;letter-spacing:${o.track || 2.25}pt` : ''}" data-slot="${slot}.${i}.label" data-lines="1">${esc(l)}</div></div>`;
      if(i) h += `<div class="vr" style="left:${cx}pt;top:${y + 3}pt;height:${lh + 21}pt;background:var(--fx-copper)"></div>`;
    });
    return {html: h, h: lh + 3 + 12};
  };
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
  FXS.logo = (D, x, y, w, h, just, dark) => { const b = D.brand || {}; const src = dark ? (b.logoOnDark || b.logo) : b.logo; return `<div class="abs logo" data-area="${w*h}" data-maxh="${h}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;justify-content:${just || 'flex-start'}">${src ? `<img src="${esc(src)}" alt="">` : `<span class="word" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span>`}</div>`; };

  FXS.coverPhotos = (D, F) => {
    const isHouse = id => !!((D.photos || {})[id] || {}).fullHouse;
    const heroId = F.hero || 'front', row = F.row || [];
    const archScore = id => { const p = (D.photos||{})[id] || {}; if(p.fullHouse) return -9; const k = /^(family|living|great|open)/.test(id) ? 3 : /^(dining|primary)(?!.*bath)/.test(id) ? 2 : /kitchen|bar|bath/.test(id) ? 0 : 1; return k*10 + (p.w && p.h ? Math.min(p.w/p.h, 1.6) : 1); };
    // never a toilet-forward bath on a front: no bath photo at all (owner rule)
    const BATHY = /^(powder|hallbath|bath\d?[a-z]?|pbath\d?|shower)$/;
    if(D.sw && D.sw.plan && D.sw.plan.cover) return {heroId: D.sw.plan.cover[0], sides: D.sw.plan.cover.slice(1)};   // the photo plan decides
    let sides = row.map(r => r.photo).filter(p => p && p !== heroId && !isHouse(p) && !BATHY.test(p)).sort((a, b) => archScore(b) - archScore(a)).filter((p, i, arr) => arr.findIndex(o => SW.famOf(o) === SW.famOf(p)) === i);
    if(sides.length < 2){   // a house whose row holds baths: the kitchen, the living room or the primary suite instead
      const extra = Object.keys(D.photos || {}).filter(id => !isHouse(id) && !BATHY.test(id) && !/^pv\d|^plan|^front/.test(id) && !/^(deck|patio|yard|fence|pergola|evening|terrace|balcony|skyline|park|gazebo|alley|walk|entry)/.test(id)).sort((a, b) => archScore(b) - archScore(a));
      extra.forEach(id => { if(sides.length < 2 && !sides.some(o => SW.famOf(o) === SW.famOf(id))) sides.push(id); });
    }
    sides = sides.slice(0, 2);
    return {heroId, sides};
  };
  // ---------- the cover (fold-over front, flyer front): everything large, spread to the margins, no agent contact (owner r1, 11/3) ----------
  // F: {hero, row, summary (sentence pool), tags}. Returns the html of one 612 x 792 navy panel.
  FXS.cover = (D, F, summary) => {
    const L = D.listing, X0 = 22, CW = 568, X1 = 590, GU = 8.6;
    const {heroId} = FXS.coverPhotos(D, F);
    let h = `<div class="bg-paper"></div>`;
    h += FXS.kicker(L, X0, 26, CW, 'kicker');
    const sb = FXS.streetBlock(L.address, X0, 52, CW, 64, 'address'); h += sb.html;
    let y = 52 + sb.h + 1;
    h += `<div class="abs ttl ital" style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:30pt;font-size:24pt;line-height:30pt;font-style:italic;color:var(--fx-ink2)" data-slot="place" data-lines="1">${esc(L.city)}, ${esc(L.state || 'Texas')}</div>`;
    y += 33; h += `<div class="hr" style="left:${X0}pt;top:${y}pt;width:${CW}pt;background:var(--fx-copper)"></div>`; y += 10;
    // sizes from the bottom: the write-up (7 to 8 lines) and the facts line set the photo height
    const lh = 18, nL = 7, VS = 19, SRH = VS*1.09 + 3 + 12, bottom = 770, wuH = nL*lh, wuTop = bottom - wuH, statY = wuTop - 16 - SRH, hrY = statY - 12;
    let HH = hrY - 12 - y; const HW = CW;
    h += FXS.heroHtml(D, heroId, X0, y, HW, HH, 'front.house', []);
    h += `<div class="hr" style="left:${X0}pt;top:${hrY}pt;width:${CW}pt;background:var(--fx-copper)"></div>`;
    h += FXS.statRow(FXS.statItems(L, true), X0, statY, CW, 'stat', {size: VS, lbl: 8, track: 2}).html;
    h += `<div class="bar" data-bar-for="front.summary" style="left:${X0}pt;top:${wuTop + 2}pt;height:${wuH - 4}pt"></div>`;
    const sd = c => `data-s='${esc(JSON.stringify([].concat(c || []))).replace(/'/g,'&#39;')}'`;
    h += `<div class="abs body" data-slot="front.summary" data-lines="${nL}" data-try="${nL}" data-narrow="0" data-linefill="0.8" data-lastfill="0.96" data-lastladder="0.96,0.92,0.88,0.84" data-justify="1" data-lh="${lh}" ${sd((summary || []).filter((t, i) => !i || !/car garage/i.test([].concat(t)[0])))} style="left:${X0 + 14}pt;top:${wuTop}pt;width:${CW - 14}pt;height:${wuH}pt;font-size:12.5pt;line-height:${lh}pt;color:var(--fx-ink)"></div>`;
    return h;
  };

  window.SW = SW; window.FXS = SW;
})();
