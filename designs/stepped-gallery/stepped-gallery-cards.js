/* The Stepped Gallery: single-page helpers (Open House flyer and the Just Listed / Just Sold postcards). Loads after stepped-gallery.js
   (it borrows the standard contact card loader from it). The helpers are the Atlas single-page helpers, adapted: place and facts, the open
   house fields, the page frame, whole-house fitting, the single-piece print checks. Nothing here touches the fold-over. Lengths are pt. */
(function(){
  const AT = {};
  const esc = AT.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pt = px => px*72/96;
  AT.pt = pt;
  AT.data = () => JSON.parse(document.getElementById('brochure-data').textContent || '{}');
  AT.cardReady = window.PG ? PG.cardReady : Promise.resolve();
  const n = v => Number(v).toLocaleString('en-US');
  const pl = (k, one, many) => `${n(k)} ${k==1 ? one : many}`;
  AT.src = (D, id) => (D.photos && D.photos[id] && D.photos[id].src) || '';
  AT.photo = (D, id, style, slot, cls) => {
    const p = (D.photos||{})[id] || {};
    return `<div class="ph ${cls||''}" data-photo="${esc(id||'')}" data-slot-photo="${esc(slot||'')}" style="${style||''}">${id && p.src ? `<img src="${esc(p.src)}" alt="">` : ''}</div>`;
  };
  AT.stats = L => {
    const s = [];
    if(L.beds) s.push(pl(L.beds, 'Bedroom', 'Bedrooms'));
    if(L.baths){ const bt = BD.bathsText(L); s.push(bt.main); if(bt.half) s.push(bt.half); }
    if(L.sqft) s.push(`${n(L.sqft)} Square Feet`);
    if(L.yearBuilt || L.year) s.push(`Built in ${L.yearBuilt || L.year}`);
    return s;
  };
  AT.fifth = L => L.lotSize ? L.lotSize : L.stories ? (L.stories == 1 ? 'One Story' : `${L.stories} Stories`) : (L.garage ? `${L.garage}-Car Garage` : '');
  AT.place = L => [L.city, L.state].filter(Boolean).join(', ');
  AT.floodStated = desc => String(desc||'').split(/(?<=[.!?])\s+/).some(s => /\b(never\s+(been\s+)?flooded|(has|have)\s+(not|never)\s+(ever\s+)?(been\s+)?flooded|(hasn|haven)['’]t\s+(ever\s+)?(been\s+)?flooded)\b/i.test(s)
    && !/\b(during|in|from)\s+(hurricane|tropical|harvey|ike|allison|beryl|imelda|the\s+\d{4}|\d{4})\b/i.test(s));
  AT.lines = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const tops = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5).map(q => q.top).sort((a,b)=>a-b);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
    let k = 0, last = -1e9;
    for(const t of tops){ if(t - last > lh*0.5){ k++; last = t; } }
    return k;
  };
  AT.lineBoxes = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
    const lines = [];
    for(const q of [...r.getClientRects()].filter(q => q.width > .5)){
      const l = lines.find(x => Math.abs(x.top - q.top) < lh*0.5);
      if(l){ l.l = Math.min(l.l, q.left); l.r = Math.max(l.r, q.right); l.b = Math.max(l.b, q.bottom); }
      else lines.push({top:q.top, l:q.left, r:q.right, b:q.bottom});
    }
    return lines.sort((a,b)=>a.top-b.top);
  };
  // Typeset a paragraph so its last line runs at least 3/4 of the column: when it comes up short, the column narrows a few
  // points (never more than 9% of its width, never a new line, the type size never changes) until the last line fills.
  AT.balance = el => {
    const read = () => { const ls = AT.lineBoxes(el); if(!ls.length) return null; const last = ls[ls.length-1], w = el.getBoundingClientRect().width; return {n: ls.length, f: (last.r - last.l)/w}; };
    el.style.maxWidth = '';
    el.dataset.w0 = Math.round(pt(el.getBoundingClientRect().width));
    const base = read(); if(!base || base.n < 2 || base.f >= 0.78) return;
    const W = el.getBoundingClientRect().width / (96/72) * (96/72);   // px
    const room = Math.floor(W * 0.09);
    for(let p = 1; p <= room; p++){
      el.style.maxWidth = (W - p) + 'px';
      const m = read(); if(!m) break;
      if(m.n > base.n) break;
      if(m.n === base.n && m.f >= 0.8){ return; }
    }
    el.style.maxWidth = '';
  };
  AT.textWidth = el => { const r = document.createRange(); r.selectNodeContents(el); return pt(r.getBoundingClientRect().width); };
  AT.check = function(D, extra){
    const issues = [...(extra||[])];
    if(window.ContactCard) issues.push(...ContactCard.check(document));
    if(D && D.preview) issues.push({slot:'copy', kind:'preview-text', detail:'rough-draft preview lines; the writer has not run'});
    const sample = /\b(avery morgan|your brokerage|your website|lorem|ipsum|placeholder|tbd|xx+)\b|555[.\-]01\d\d/i;
    const flood = AT.floodStated((D.listing||{}).description);
    const banned = /\b(rebuilt|virtually staged|staged)\b|\bqr\b|photo\s*#?\d/i;
    document.querySelectorAll('[data-slot]').forEach(el => {
      if(el.closest('.cc')) return;   // the contact card runs its own checks
      const name = el.dataset.slot, cs = getComputedStyle(el), txt = el.textContent.trim();
      const size = parseFloat(cs.fontSize)*72/96;
      const oneLine = cs.whiteSpace === 'nowrap';
      const max = +el.dataset.lines || 0;
      const over = oneLine ? el.scrollWidth > el.clientWidth + 1
                 : max ? AT.lines(el) > max || el.scrollWidth > el.clientWidth + 1
                 : el.scrollHeight > el.clientHeight + 1;
      if(over) issues.push({slot:name, kind:'overflow', text:txt.slice(0,80), ...(max && !oneLine ? {lines:AT.lines(el), max} : {})});
      if(size < 8 && !el.dataset.fine) issues.push({slot:name, kind:'type-too-small', size:+size.toFixed(1)});
      if(size < 6) issues.push({slot:name, kind:'fine-print-below-6pt', size:+size.toFixed(1)});
      if(!txt && !el.dataset.optional) issues.push({slot:name, kind:'empty-slot'});
      if(/\$\s?\d/.test(txt)) issues.push({slot:name, kind:'price', text:txt.slice(0,80)});
      if(banned.test(txt)) issues.push({slot:name, kind:'banned-word', text:txt.slice(0,80)});
      if(!flood && /flood/i.test(txt)) issues.push({slot:name, kind:'flood-not-stated', text:txt.slice(0,80)});
      if(!D.sample && sample.test(txt)) issues.push({slot:name, kind:'placeholder', text:txt.slice(0,80)});
    });
    // paragraphs: the last line is at least 3/4 full; a caption runs the same number of lines as its neighbors in the row
    document.querySelectorAll('[data-para]').forEach(el => {
      const lines = AT.lineBoxes(el);
      if(!lines.length) return;
      const box = el.getBoundingClientRect().width, last = lines[lines.length-1];
      if(lines.length < (+el.dataset.min || 2)) issues.push({slot:el.dataset.slot, kind:'paragraph-too-short', lines:lines.length, min:+el.dataset.min || 2});
      else if(lines.length > 1 && (last.r-last.l)/box < 0.73) issues.push({slot:el.dataset.slot, kind:'last-line-short', pct:Math.round((last.r-last.l)/box*100)});
    });
    document.querySelectorAll('.row').forEach(row => {
      const caps = [...row.children].map(it => it.querySelector(':scope > .cap .a')).filter(Boolean);
      if(caps.length < 2) return;
      const ls = caps.map(c => AT.lines(c));
      if(Math.max(...ls) !== Math.min(...ls)) issues.push({slot:caps.map(c=>c.dataset.slot).join(' / '), kind:'captions-uneven', lines:ls});
    });
    document.querySelectorAll('.ph').forEach(el => {
      const img = el.querySelector('img'), slot = el.dataset.slotPhoto || el.dataset.photo || 'photo';
      if(!img){ issues.push({slot, kind:'empty-photo-slot'}); return; }
      if(!img.complete || !img.naturalWidth){ issues.push({slot, kind:'photo-missing', src:img.getAttribute('src')}); return; }
      const wIn = el.clientWidth/96, hIn = el.clientHeight/96;
      const ppi = Math.min(img.naturalWidth/wIn, img.naturalHeight/hIn);   // the renderer's rule: both ways
      if(ppi < 300) issues.push({slot, photo:el.dataset.photo, kind:'photo-under-300ppi', ppi:Math.round(ppi), placedIn:[+wIn.toFixed(2),+hIn.toFixed(2)]});
      const a = el.clientWidth/el.clientHeight;
      if(a > 3.2 || a < 0.55) issues.push({slot, photo:el.dataset.photo, kind:'photo-frame-too-thin', ratio:+a.toFixed(2)});
    });
    if(window.AtlasPlan) issues.push(...AtlasPlan.check());
    return issues;
  };
  AT.placements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));
  // ================= portrait book fold: text fitting =================
  // Every caption and paragraph sets in a whole number of lines, its last line at least 3/4 full, with the type size fixed.
  // fitLines: narrow the column (never below minFrac of its width) until the paragraph sets in exactly N lines with a full last line.
  AT.fitLines = (el, N, minFrac) => {
    el.style.maxWidth = '';
    const W = el.getBoundingClientRect().width, floor = Math.floor(W * (minFrac || 0.74));
    const read = w => { el.style.maxWidth = w + 'px'; const ls = AT.lineBoxes(el); if(!ls.length) return null; const last = ls[ls.length-1];
      return {n: ls.length, f: (last.r - last.l) / w}; };
    let best = null;
    for(let w = Math.floor(W); w >= floor; w -= 1){
      const m = read(w); if(!m) break;
      if(m.n < N) continue;
      if(m.n > N){ if(best) break; else { el.dataset.tfit = m.n > N ? 'long' : ''; } continue; }
      if(!best || m.f > best.f) best = {w, f: m.f};
      if(m.f >= 0.82) break;
    }
    if(best){ el.style.maxWidth = best.w + 'px'; el.dataset.tfit = best.f >= 0.78 ? 'ok' : 'low'; return true; }
    el.style.maxWidth = ''; const ls = AT.lineBoxes(el); el.dataset.tfit = ls.length > N ? 'long' : 'short'; return false;
  };
  // fitBox: a paragraph that runs to the bottom of a box H pt tall: the type size steps up from lo to hi until the text
  // sets in the box's whole lines with a full last line.
  AT.fitBox = (el, H, lo, hi, ratio) => {
    const Hpx = H * 96 / 72; let best = null;
    const LO = 1.27, HI = 1.6, MID = 1.42;
    for(let fs = lo; fs <= hi + 1e-6; fs += 0.25){
      el.style.maxWidth = ''; el.style.fontSize = fs + 'pt'; el.style.lineHeight = (fs * MID).toFixed(2) + 'pt';
      const n = AT.lineBoxes(el).length; if(n < 2) continue;
      const r = Hpx / (n * fs * 96 / 72);
      if(r < LO || r > HI) continue;
      el.style.lineHeight = (fs * r).toFixed(3) + 'pt';
      const ok = AT.fitLines(el, n, 0.86);
      const score = Math.abs(r - MID) + (el.dataset.tfit === 'ok' ? 0 : 0.6);
      if(!best || score < best.score) best = {fs, r, n, score};
    }
    if(best){
      el.style.maxWidth = ''; el.style.fontSize = best.fs + 'pt'; el.style.lineHeight = (best.fs * best.r).toFixed(3) + 'pt';
      AT.fitLines(el, best.n, 0.86); el.dataset.N = best.n;
    } else {
      el.style.maxWidth = ''; el.style.fontSize = lo + 'pt'; el.style.lineHeight = (lo * MID) + 'pt';
      const n = AT.lineBoxes(el).length; el.dataset.tfit = n * lo * MID * 96 / 72 > Hpx ? 'long' : 'short';
      el.style.fontSize = hi + 'pt'; el.style.lineHeight = (hi * MID) + 'pt';
      if(AT.lineBoxes(el).length * hi * MID * 96 / 72 > Hpx) { el.style.fontSize = lo + 'pt'; el.style.lineHeight = (lo * MID) + 'pt'; }
    }
    el.style.height = H + 'pt'; el.dataset.fs = el.style.fontSize;
    return !!best;
  };
  // a row of captions: all set in the same number of lines
  AT.fitRow = (els) => {
    els = els.filter(Boolean); if(!els.length) return;
    els.forEach(e => e.style.maxWidth = '');
    const N = Math.max(...els.map(e => AT.lineBoxes(e).length));
    els.forEach(e => AT.fitLines(e, N));
  };
  AT.fitReport = () => [...document.querySelectorAll('[data-tfit][data-slot]')].filter(e => e.dataset.tfit === 'long' || e.dataset.tfit === 'short' || e.dataset.tfit === 'low')
    .map(e => ({slot: e.dataset.slot, kind: 'text-length-' + e.dataset.tfit, lines: AT.lineBoxes(e).length, chars: e.textContent.trim().length}));
  // lines a block of text needs at a width (pt) and line height (pt), measured off screen
  AT.linesNeeded = (cls, text, w, lh) => {
    const m = document.createElement('div');
    m.className = cls; m.textContent = text;
    m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;height:auto;white-space:normal;overflow:visible;line-height:${lh}pt`;
    document.body.appendChild(m); const k = Math.max(1, Math.round(m.scrollHeight*72/96/lh)); m.remove(); return k;
  };
  // nearby places: name and distance, by name from the places list the sample was built from
  const ST = {alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',connecticut:'CT',delaware:'DE',
    'district of columbia':'DC',florida:'FL',georgia:'GA',hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',
    kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',michigan:'MI',minnesota:'MN',mississippi:'MS',
    missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY',
    'north carolina':'NC','north dakota':'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode island':'RI',
    'south carolina':'SC','south dakota':'SD',tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA',
    'west virginia':'WV',wisconsin:'WI',wyoming:'WY'};
  AT.cityST = L => [L.city, ST[String(L.state||'').trim().toLowerCase()] || L.state].filter(Boolean).join(', ');
  AT.placeZip = L => [AT.cityST(L), L.zip].filter(Boolean).join(' ');
  AT.factsShort = L => {
    const f = [];
    if(L.beds) f.push(`${L.beds} bed${L.beds==1?'':'s'}`);
    if(L.baths){ const bt = BD.bathsText(L); f.push(bt.main.toLowerCase()); if(bt.half) f.push(bt.half.toLowerCase()); }
    if(L.sqft) f.push(`${n(L.sqft)} sq ft`);
    return f.join('  /  ');
  };
  // no RSVP on any open house flyer: each part of a note that asks for one is dropped
  AT.noRSVP = s => { s = String(s||'').trim(); const ask = /\brsvp|r\.s\.v\.p|please reply|reply by\b/i; if(!ask.test(s)) return s;
    return s.split(/\s*(?:[·;|•]|(?<=[.!?])\s)\s*/).filter(p => p && !ask.test(p)).join('  ·  ').trim(); };
  // the event, from data only: label, long date, weekday, month, day, time, and the broker / REALTOR(R) lines
  AT.openHouse = function(D){
    const O = D.openHouse || {}, A = D.agent || {};
    const kinds = {public:'Public Open House', broker:'Broker Open House', realtor:'REALTOR® Open House'};
    let kind = O.kind in kinds ? O.kind : 'public';
    if(kind==='realtor' && !A.nar) kind = 'broker';
    const r = {kind, label:kinds[kind], long:'', weekday:'', monthDay:'', month:'', monthShort:'', day:'', time:'', note:'', refreshments:''};
    if(kind!=='public'){ r.note = AT.noRSVP(O.note||O.coop||''); r.refreshments = String(O.refreshments||'').trim(); }
    const dt = /^\d{4}-\d{2}-\d{2}$/.test(O.date||'') ? new Date(O.date+'T12:00:00') : null;
    if(dt && !isNaN(dt)){
      const f = o => dt.toLocaleDateString('en-US', o);
      r.weekday = f({weekday:'long'}); r.month = f({month:'long'}); r.monthShort = f({month:'short'}); r.day = f({day:'numeric'});
      r.monthDay = `${r.month} ${r.day}`; r.long = `${r.weekday}, ${r.monthDay}`;
    } else if(O.date){ r.long = String(O.date); }
    const t12 = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s||''); if(!m) return null; let H=+m[1]; const M=+m[2]; const ap=H>=12?'pm':'am'; H=H%12||12; return {txt:M?`${H}:${String(M).padStart(2,'0')}`:`${H}:00`, ap}; };
    const a = t12(O.start), z = t12(O.end);
    if(O.timeText) r.time = String(O.timeText);
    else if(a && z) r.time = a.ap===z.ap ? `${a.txt} to ${z.txt} ${z.ap}` : `${a.txt} ${a.ap} to ${z.txt} ${z.ap}`;
    else if(a) r.time = `${a.txt} ${a.ap}`;
    return r;
  };
  // the optional event lines wrap instead of shrinking; measure the lines each needs
  AT.eventLines = (lines, x, y, w, lh, gap, extraStyle) => {
    let h = '', at = y;
    lines.filter(l=>l[0]).forEach(([text, slot, cls])=>{
      const k = AT.linesNeeded(cls, text, w, lh);
      h += `<div class="abs ${cls}" style="left:${x}pt;top:${at}pt;width:${w}pt;height:${k*lh}pt;white-space:normal;${extraStyle||''}" data-slot="${slot}" data-lines="${k}">${esc(text)}</div>`;
      at += k*lh + (gap||0);
    });
    return {html: h, h: at > y ? at - y - (gap||0) : 0};
  };

  // the page frame: email = the paper field at trim size; print flyers = a white margin around the field; print postcards = trim + 0.125 in bleed
  AT.frame = function(D, trimW, trimH, inner){
    const mode = D.mode || 'email';
    const bleed = (mode==='print' && D.piece.print==='bleed') ? 9 : 0;
    const inset = (mode==='print' && D.piece.print==='margin') ? (D.piece.margin||18) : 0;
    const W = trimW + 2*bleed, H = trimH + 2*bleed;
    return {W, H, bleed, inset,
      html: `<div class="page sg" data-page="${esc(D.piece.id)}" style="width:${W}pt;height:${H}pt">
        <div class="field" style="left:${inset}pt;top:${inset}pt;right:${inset}pt;bottom:${inset}pt"></div>
        <div class="sheet" style="left:${bleed}pt;top:${bleed}pt;width:${trimW}pt;height:${trimH}pt">${inner}</div></div>`};
  };

  // photos in a frame: a house box keeps the whole house in frame; a whole-house shot without one is pinned to its top
  // (a roof is never cut). Anything that cannot be framed whole is reported.
  AT.fullHouse = (D, id) => { const p = (D.photos||{})[id] || {}; return p.fullHouse != null ? !!p.fullHouse : /\b(front|rear|back|side) exterior\b|\bfull house\b/i.test(p.tags||''); };
  AT.fitHouse = function(D){
    const issues = [];
    document.querySelectorAll('.ph').forEach(el => {
      const img = el.querySelector('img'), id = el.dataset.photo, p = (D.photos||{})[id] || {};
      if(!img || !p.w || !p.h) return;
      const cw = el.clientWidth, ch = el.clientHeight, s = Math.max(cw/p.w, ch/p.h);
      const vx = Math.min(1, cw/(p.w*s)), vy = Math.min(1, ch/(p.h*s));
      const fx = (p.focusX != null ? p.focusX : 50)/100, fy = (p.focusY != null ? p.focusY : 50)/100;
      let ox = fx, oy = fy; const b = p.box;
      if(b){ ox = (b[0]+b[2])/2; oy = (b[1]+b[3])/2; }
      else if(AT.fullHouse(D, id)){ oy = vy/2; }
      const x0 = Math.min(1-vx, Math.max(0, ox - vx/2)), y0 = Math.min(1-vy, Math.max(0, oy - vy/2));
      img.style.objectPosition = `${vx < 1 ? x0/(1-vx)*100 : 50}% ${vy < 1 ? y0/(1-vy)*100 : 50}%`;
      const tol = 0.004;
      if(b){ if(b[0] < x0 - tol || b[2] > x0 + vx + tol || b[1] < y0 - tol || b[3] > y0 + vy + tol)
        issues.push({slot: el.dataset.slotPhoto || id, kind:'house-cut-off', detail:`the frame shows ${Math.round(vx*100)} x ${Math.round(vy*100)}% of the photo and the house needs ${Math.round((b[2]-b[0])*100)} x ${Math.round((b[3]-b[1])*100)}%`}); }
      else if(AT.fullHouse(D, id) && vy < 0.75) issues.push({slot: el.dataset.slotPhoto || id, kind:'full-house-frame-too-wide', detail:`only ${Math.round(vy*100)}% of the photo's height shows`});
    });
    return issues;
  };

  // a paragraph box that must run to its bottom: its last line ends within one line of the box's bottom edge
  AT.fillChecks = () => {
    const out = [];
    document.querySelectorAll('[data-fillbox]').forEach(el => {
      const ls = AT.lineBoxes(el); if(!ls.length) return;
      const gap = pt(el.getBoundingClientRect().bottom - ls[ls.length-1].b);
      const lh = parseFloat(getComputedStyle(el).lineHeight)*72/96;
      if(gap > lh*0.9 || gap < -1.2) out.push({slot: el.dataset.slot, kind:'paragraph-not-filling-box', lines: ls.length, gapPt:+gap.toFixed(1), boxPt: Math.round(pt(el.getBoundingClientRect().height)), lineHeight: +lh.toFixed(1)});
    });
    return out;
  };
  // no photo twice on one piece
  AT.repeatChecks = () => { const seen = {}, out = [];
    document.querySelectorAll('.ph[data-photo]').forEach(el => { const id = el.dataset.photo; if(id) seen[id] = (seen[id]||0) + 1; });
    Object.entries(seen).filter(([,k]) => k > 1).forEach(([id,k]) => out.push({slot:id, kind:'photo-repeated', times:k}));
    return out; };
  // a brokerage logo never touches text
  AT.logoTextChecks = () => { const out = [], pad = 3*96/72, rects = [];
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.closest('.logo,.cc') || !el.textContent.trim()) return;
      const rg = document.createRange(); rg.selectNodeContents(el);
      [...rg.getClientRects()].filter(r => r.width > .5 && r.height > .5).forEach(r => rects.push({slot:el.dataset.slot, r})); });
    document.querySelectorAll('.logo img').forEach(lg => { const q = lg.getBoundingClientRect(); if(!q.width) return;
      const hit = rects.find(({r}) => r.left < q.right + pad && r.right > q.left - pad && r.top < q.bottom + pad && r.bottom > q.top - pad);
      if(hit) out.push({slot:hit.slot, kind:'logo-touches-text'}); });
    return out; };
  // the print checks of a single piece
  AT.checkSingle = (D, extra) => AT.check(D, [...(extra||[]), ...AT.fillChecks(), ...AT.repeatChecks(), ...AT.logoTextChecks()]);
  // card: any box and preset
  AT.cardBox = function(D, box, o){
    const A = D.agent || {}, hs = AT.src(D, A.headshot) || (/^(file|https?|data):/.test(A.headshot || '') ? A.headshot : '');
    return ContactCard.html(box, Object.assign({}, A, {headshot: hs}), D.brand || {}, Object.assign({bottomGap: 0.5}, o||{}));
  };
  // fit a one-line display line to its width by stepping the size down to a floor (never below)
  AT.fitLine = (el, lo) => { let s = parseFloat(getComputedStyle(el).fontSize)*72/96; while(el.scrollWidth > el.clientWidth + 0.5 && s > lo){ s -= 0.5; el.style.fontSize = s + 'pt'; } };
  AT.fontsReady = async function(D){
    await AT.cardReady;
    await Promise.all(['400 10pt','500 10pt','600 10pt','700 10pt'].map(w => document.fonts.load(`${w} 'Lora'`)).concat(['400 10pt','600 10pt','700 10pt'].map(w => document.fonts.load(`${w} 'Nunito Sans'`))));
    const b = Object.assign({}, D.brand || {}); if(b.logoOnDark) b.logo = b.logoOnDark; D.brand = b;
    return [];
  };
  AT.settle = () => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));


  window.AT = AT;
})();

/* Bath wording (owner 11/1/2026; templates/_shared/baths.js): load it here for every page of this set, and wrap the "½" so it takes the shared full-size style wherever it lands in text. */
(function(){
  if(!window.BD || !BD.bathsText) document.write('<script src="../engine/baths.js"><\/script>');
  const wrap = root => { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), hit = [];
    while(tw.nextNode()){ const t = tw.currentNode; if(t.nodeValue.indexOf('½') >= 0 && !(t.parentNode.closest && t.parentNode.closest('.bd-half,script,style,textarea'))) hit.push(t); }
    hit.forEach(t => { const f = document.createDocumentFragment(); t.nodeValue.split('½').forEach((part, i) => { if(i){ const s = document.createElement('span'); s.className = 'bd-half'; s.textContent = '½'; f.appendChild(s); } f.appendChild(document.createTextNode(part)); }); t.parentNode.replaceChild(f, t); }); };
  const go = () => new MutationObserver(() => wrap(document.body)).observe(document.body, {childList: true, subtree: true});
  if(document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
