/* templates/_shared/setpieces.js: the single pieces of a design set (the Open House flyer 8.5 x 11 and the Just Listed and
   Just Sold postcards, 6 x 9 and 6 x 11, front and back), shared by the sets built after the four 10/29 sets (Answer Book,
   House in 360, Midnight Residence, Architectural Negative, The Long View, The Map Room, The Room Strips, The Four Windows).
   Each set's own openhouse-a.html, openhouse-b.html and postcard.html lay out the piece in the set's palette, type and grid
   from its style file; this file carries what every piece needs the same way:

     data, facts and the event      SP.data, SP.stats, SP.factPairs, SP.placeZip, SP.openHouse, SP.eventLines
     photos                         SP.photo (a .ph frame), SP.fitPhotos (a house box keeps the whole house in frame)
     text                           SP.lines, SP.lineBoxes, SP.balance, SP.fitLine
     the page                       SP.frame (email = trim; print flyer = white margin; print postcard = trim + bleed)
     the contact card               SP.card (Right panel on flyers; {postcard: true} on postcard backs; agentcard.js)
     the mail side                  SP.mail (the Just Listed library's zones, jllib.js zones(), px x 0.75), SP.mailGuides
     print checks                   SP.check (overflow, type size, empty slots, price, banned words, condition wording,
                                    paragraph fill, caption rows, photos at 300 ppi, house cut off, repeated photos,
                                    logo touching text, anything in a mail zone)
     finishing                      SP.finish (draws the page, fits photos, cards and lines, and hands the renderer
                                    brochureCheck, pieceSize, proofNotes and photoPlacements)

   Rules carried here (docs/context/product.md): no price, no QR, no photo numbers, no "virtually staged", the whole house
   always shows, no blank boxes, a paragraph's last line at least 3/4 full (73% passes: the 2-point tolerance), captions in
   a row of photos run the same number of lines, no copy about the home's condition or repairs (the CopyRules gate), the
   brokerage logo floats and prints once per side (the contact card carries it). Units are pt. */
(function(){
  const SP = {};
  const PT = 96/72, pt = px => px*72/96;
  const esc = SP.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  SP.pt = pt;
  SP.data = () => JSON.parse(document.getElementById('brochure-data').textContent || '{}');

  // the shared contact card (templates/_shared/agentcard.js here, /designs/shared/agentcard.js on the site)
  const ME = document.currentScript && document.currentScript.src;
  SP.cardReady = window.ContactCard ? Promise.resolve() : new Promise(res => {
    const add = (rel, next) => { const el = document.createElement('script'); el.src = new URL(rel, ME || location.href).href; el.onload = res; el.onerror = next || res; document.head.appendChild(el); };
    add('agentcard.js', () => add('../shared/agentcard.js'));
  });

  // the page frame's own few rules (each set's style file sets .page, .abs, .ph and the type)
  { const st = document.createElement('style');
    st.textContent = `.sp-page{position:relative;overflow:hidden;margin:0 auto}
      .sp-page.sp-margin{background:#fff}
      .sp-field{position:absolute;background:var(--paper)}
      .sp-sheet{position:absolute;overflow:visible}   /* bleed art runs past the trim; the page (trim + bleed) clips it */
      .ph{overflow:hidden}.ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
      .sp-mailg{position:absolute}
      .sp-mailg .g{position:absolute;font:600 6pt/1.4 Helvetica,Arial,sans-serif;letter-spacing:.45pt;color:#9a958b;text-transform:uppercase;white-space:nowrap}
      .sp-mailg.stamp{border:.75pt dashed #b9b4aa;text-align:center;padding-top:36pt;font:600 6pt/1.4 Helvetica,Arial,sans-serif;letter-spacing:.45pt;color:#9a958b;text-transform:uppercase;background:rgba(255,255,255,.92)}
      .sp-mailg.addr{background:rgba(255,255,255,.92)}
      .sp-mailg.bar{border:.75pt dashed #c9c5bb;background:rgba(255,255,255,.92)}
      .sp-mailg .al{position:absolute;height:.75pt;background:#d9d5cc}
      .sp-just{text-align:justify;text-align-last:left;hyphens:none}
      @page sp-single{margin:0}
      @media print{html,body{background:none !important}body[data-mode] .page.sp-page{page:sp-single;margin:0 !important;box-shadow:none !important}}`;   /* the set's fold-over page size never applies to a single piece */
    document.head.appendChild(st); }

  SP.ready = async function(D, lib){
    const issues = [];
    if(lib && lib.applyBrand) lib.applyBrand(D.brand);
    if(lib && lib.applyFonts){ try { issues.push(...(await lib.applyFonts(D, D.fontSpec)) || []); } catch(e){} }
    await document.fonts.ready;
    const cs = getComputedStyle(document.documentElement);
    const fams = [cs.getPropertyValue('--font-display'), cs.getPropertyValue('--font-body')].filter(Boolean);
    await Promise.all(fams.flatMap(f => ['400','500','600','700'].map(w => document.fonts.load(`${w} 10pt ${f}`).catch(() => 0))));
    await SP.cardReady;
    SP.agentWording(D);
    return issues;
  };

  // ---------- the agent's own Just Sold wording and years (owner, 10/30/2026, Eight Sets Round 2) ----------
  // agent.justSold = {writeup, bullets[], cta}: the stock wording the agent saved in the Just Sold intake; it replaces the
  // design's suggested write-up (front9/front11), its bullet list (steps, services, steps9, steps11, at the design's own
  // count) and the call to action on every Just Sold card. agent.years: the years in real estate the agent gave.
  // In any Just Sold line "{years}" is that number (a sentence holding it drops when no years were given); a bullet
  // "{experience}" reads "Put my 12 years of experience to work for you", or with no years "Walk you through the process
  // from start to finish"; a bullet "{experience?}" prints only when the agent gave years; "{experience|our line}" is
  // the years line when given, else our line (lists with no room for a fifth bullet). agent.justSold.order: the agent's
  // own order of the list, years line included (any order they like).
  SP.experienceLine = A => +(A || {}).years > 0 ? `Put my ${Math.round(+A.years)} years of experience to work for you` : '';
  SP.agentWording = D => {
    const A = D.agent || {}, js = ((D.copy || {}).pc || {}).js, own = A.justSold || {};
    if(!js || js._agentWording) return;
    const yrs = +A.years > 0 ? String(Math.round(+A.years)) : '';
    const fill = t => !/\{years\}/.test(t) ? t : yrs ? String(t).replace(/\{years\}/g, yrs)
      : String(t).split(/(?<=[.!?])\s+/).filter(s => !/\{years\}/.test(s)).join(' ');
    if(own.writeup && String(own.writeup).trim()) js.front9 = js.front11 = String(own.writeup).trim();
    if(own.cta && String(own.cta).trim()) js.cta = String(own.cta).trim();
    const mine = (own.bullets || []).map(s => String(s).trim()).filter(Boolean);
    for(const k of ['steps', 'services', 'steps9', 'steps11']){
      if(!Array.isArray(js[k])) continue;
      // the agent's list may carry the "{experience?}" years line where they moved it (the proof editor, 11/2): it counts
      // as one more item, so it never pushes a step off the end
      let list = mine.length ? mine.slice(0, js[k].filter(s => s !== '{experience?}').length + (mine.includes('{experience?}') ? 1 : 0)) : js[k];
      // the agent's own order from the editor (owner 10/31): positions in the list as drawn, the years line counted as a
      // step; anything left out keeps its place after the ones given
      const ord = (own.order || []).map(Number).filter((i, j, a) => Number.isInteger(i) && i >= 0 && i < list.length && a.indexOf(i) === j);
      if(ord.length) list = ord.map(i => list[i]).concat(list.filter((_, i) => !ord.includes(i)));
      js[k] = list.map(s => s === '{experience}' ? (SP.experienceLine(A) || 'Walk you through the process from start to finish')
                          : s === '{experience?}' ? SP.experienceLine(A)
                          : /^\{experience\|.+\}$/.test(s) ? (SP.experienceLine(A) || s.slice(12, -1)) : fill(s)).filter(Boolean);
    }
    for(const k of ['front9', 'front11', 'meet9', 'meet11', 'cta']) if(typeof js[k] === 'string') js[k] = fill(js[k]);
    js._agentWording = true;
  };

  // ---------- facts ----------
  const n = v => Number(v).toLocaleString('en-US');
  const pl = (k, one, many) => `${n(k)} ${k==1 ? one : many}`;
  // the listing's facts as label lines ("3 Bedrooms", "2 Full Baths", "1,385 Square Feet", "Built in 1940")
  // o.lot (owner 10/30, Book 5): add the lot size when the listing gives one ("5,000 Sq Ft Lot")
  SP.lotText = L => { const v = String(L.lotSize || '').trim(); if(!v) return ''; return /lot/i.test(v) ? v : (/^[\d,.]+$/.test(v) ? `${v} Sq Ft Lot` : `${v} Lot`); };
  SP.stats = (L, o) => {
    const s = [];
    if(L.beds) s.push(pl(L.beds, 'Bedroom', 'Bedrooms'));
    if(L.baths) s.push(pl(L.baths, 'Full Bath', 'Full Baths') + (L.halfBaths ? ` + ${L.halfBaths} Half` : ''));
    if(L.sqft) s.push(`${n(L.sqft)} Square Feet`);
    if(L.yearBuilt || L.year) s.push(`Built in ${L.yearBuilt || L.year}`);
    if(o && o.lot && SP.lotText(L)) s.push(SP.lotText(L));
    return s;
  };
  // the same facts as number + label pairs for a facts row: [['3','Bedrooms'], ['2','Full Baths'], ...]; up to six
  SP.factPairs = (L, max, o) => {
    const s = [];
    if(L.beds) s.push([n(L.beds), L.beds==1 ? 'Bedroom' : 'Bedrooms']);
    if(L.baths) s.push([n(L.baths), L.baths==1 ? 'Full Bath' : 'Full Baths']);
    if(L.halfBaths) s.push([n(L.halfBaths), L.halfBaths==1 ? 'Half Bath' : 'Half Baths']);
    if(L.sqft) s.push([n(L.sqft), 'Square Feet']);
    if(L.yearBuilt || L.year) s.push([String(L.yearBuilt || L.year), 'Year Built']);
    if(L.stories) s.push([String(L.stories), L.stories==1 ? 'Story' : 'Stories']);
    if(o && o.lot && SP.lotText(L)){ const m = SP.lotText(L).match(/^([\d,.]+)\s*(.*)$/); s.splice(Math.min(s.length, (max || 6) - 1), 0, m ? [m[1], m[2]] : [SP.lotText(L), '']); }
    return s.slice(0, max || 6);
  };
  const ST = {texas:'TX', louisiana:'LA', oklahoma:'OK', 'new mexico':'NM', arkansas:'AR'};
  SP.cityST = L => [L.city, ST[String(L.state||'').trim().toLowerCase()] || L.state].filter(Boolean).join(', ');
  SP.placeZip = L => [SP.cityST(L), L.zip].filter(Boolean).join(' ');
  SP.floodStated = desc => String(desc||'').split(/(?<=[.!?])\s+/).some(s => /\b(never\s+(been\s+)?flooded|(has|have)\s+(not|never)\s+(ever\s+)?(been\s+)?flooded|(hasn|haven)['’]t\s+(ever\s+)?(been\s+)?flooded)\b/i.test(s)
    && !/\b(during|in|from)\s+(hurricane|tropical|harvey|ike|allison|beryl|imelda|the\s+\d{4}|\d{4})\b/i.test(s));

  // ---------- the event (Open House flyer standard, templates/_shared/ohstandard.js) ----------
  // no RSVP on any open house flyer: each part of a note that asks for one is dropped
  SP.noRSVP = s => { s = String(s||'').trim(); const ask = /\brsvp|r\.s\.v\.p|please reply|reply by\b/i; if(!ask.test(s)) return s;
    return s.split(/\s*(?:[·;|•]|(?<=[.!?])\s)\s*/).filter(p => p && !ask.test(p)).join('  ·  ').trim(); };
  SP.openHouse = function(D){
    const O = D.openHouse || {}, A = D.agent || {};
    const kinds = {public:'Public Open House', broker:'Broker Open House', realtor:'REALTOR® Open House'};
    let kind = O.kind in kinds ? O.kind : 'public';
    if(kind==='realtor' && !A.nar) kind = 'broker';
    const r = {kind, label:kinds[kind], long:'', weekday:'', monthDay:'', month:'', monthShort:'', day:'', time:'', note:'', refreshments:''};
    if(kind!=='public'){ r.note = SP.noRSVP(O.note||O.coop||''); r.refreshments = String(O.refreshments||'').trim(); }
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
  // the optional event lines wrap instead of shrinking: measure each, stack them
  SP.linesNeeded = (cls, text, w, lh, style) => {
    const m = document.createElement('div');
    m.className = cls; m.textContent = text;
    m.style.cssText = `${style||''};position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;height:auto;white-space:normal;overflow:visible`;
    document.body.appendChild(m); const k = Math.max(1, Math.round(m.scrollHeight*72/96/lh)); m.remove(); return k;
  };
  SP.eventLines = (lines, x, y, w, lh, gap, style) => {
    let h = '', at = y;
    lines.filter(l => l[0]).forEach(([text, slot, cls]) => {
      const k = SP.linesNeeded(cls, text, w, lh, style);
      h += `<div class="abs ${cls}" style="left:${x}pt;top:${at}pt;width:${w}pt;height:${k*lh}pt;line-height:${lh}pt;white-space:normal;${style||''}" data-slot="${slot}" data-lines="${k}">${esc(text)}</div>`;
      at += k*lh + (gap||0);
    });
    return {html: h, h: at > y ? at - y - (gap||0) : 0};
  };

  // ---------- photos ----------
  SP.src = (D, id) => (D.photos && D.photos[id] && D.photos[id].src) || '';
  SP.photo = (D, id, x, y, w, h, slot, extra, cls) =>
    `<div class="ph abs ${cls||''}" data-photo="${esc(id||'')}" data-slot-photo="${esc(slot||id||'')}" style="left:${(+x).toFixed(2)}pt;top:${(+y).toFixed(2)}pt;width:${(+w).toFixed(2)}pt;height:${(+h).toFixed(2)}pt;${extra||''}">${id && SP.src(D,id) ? `<img src="${esc(SP.src(D,id))}" alt="">` : ''}</div>`;
  SP.fullHouse = (D, id) => { const p = (D.photos||{})[id] || {}; return p.fullHouse != null ? !!p.fullHouse : /\b(front|rear|back|side) exterior\b|\bfull house\b/i.test(p.tags||''); };
  // keep the focal point; a photo with a house box keeps the box in frame (a roof is never cut), else it is reported
  SP.fitPhotos = function(D){
    const issues = [];
    document.querySelectorAll('.ph').forEach(el => {
      const img = el.querySelector('img'), id = el.dataset.photo, p = (D.photos||{})[id] || {};
      if(!img || !p.w || !p.h) return;
      const cw = el.clientWidth, ch = el.clientHeight, s = Math.max(cw/p.w, ch/p.h);
      const vx = Math.min(1, cw/(p.w*s)), vy = Math.min(1, ch/(p.h*s));
      const fx = (p.focusX != null ? p.focusX : 50)/100, fy = (p.focusY != null ? p.focusY : 50)/100;
      let ox = fx, oy = fy; const b = p.box;
      if(b){ ox = (b[0]+b[2])/2; oy = (b[1]+b[3])/2; }
      else if(SP.fullHouse(D, id)) oy = vy/2;
      const x0 = Math.min(1-vx, Math.max(0, ox - vx/2)), y0 = Math.min(1-vy, Math.max(0, oy - vy/2));
      img.style.objectPosition = `${vx < 1 ? x0/(1-vx)*100 : 50}% ${vy < 1 ? y0/(1-vy)*100 : 50}%`;
      const tol = 0.004;
      if(b){ if(b[0] < x0 - tol || b[2] > x0 + vx + tol || b[1] < y0 - tol || b[3] > y0 + vy + tol)
        issues.push({slot: el.dataset.slotPhoto || id, kind:'house-cut-off', detail:`the frame shows ${Math.round(vx*100)} x ${Math.round(vy*100)}% of the photo and the house needs ${Math.round((b[2]-b[0])*100)} x ${Math.round((b[3]-b[1])*100)}%`}); }
      else if(SP.fullHouse(D, id) && vy < 0.75) issues.push({slot: el.dataset.slotPhoto || id, kind:'full-house-frame-too-wide', detail:`only ${Math.round(vy*100)}% of the photo's height shows`});
    });
    return issues;
  };
  // the widest frame (w/h) that still shows the house box whole at a given height: w <= h * aspect of the visible window
  SP.houseRatio = (D, id) => { const p = (D.photos||{})[id] || {}; return p.w && p.h ? p.w/p.h : 1.5; };

  // ---------- text ----------
  SP.lines = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const tops = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5).map(q => q.top).sort((a,b)=>a-b);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
    let k = 0, last = -1e9;
    for(const t of tops){ if(t - last > lh*0.5){ k++; last = t; } }
    return k;
  };
  SP.lineBoxes = el => {
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
  // a paragraph's last line runs at least 3/4 of the column: the column narrows a few points (never more than 9%, never a
  // new line, the type size never changes) until it does. Justified text (.sp-just) is left as set.
  SP.balance = el => {
    if(el.classList.contains('sp-just')) return;
    const read = () => { const ls = SP.lineBoxes(el); if(!ls.length) return null; const last = ls[ls.length-1], w = el.getBoundingClientRect().width; return {n: ls.length, f: (last.r - last.l)/w}; };
    el.style.maxWidth = '';
    const base = read(); if(!base || base.n < 2 || base.f >= 0.78) return;
    const W = el.getBoundingClientRect().width, room = Math.floor(W*0.09);
    for(let p = 1; p <= room; p++){
      el.style.maxWidth = (W - p) + 'px';
      const m = read(); if(!m) break;
      if(m.n > base.n) break;
      if(m.n === base.n && m.f >= 0.8) return;
    }
    el.style.maxWidth = '';
  };
  // a one-line display line steps down to a floor to fit its width (never below)
  SP.fitLine = (el, lo) => { if(!el) return; let s = parseFloat(getComputedStyle(el).fontSize)*72/96; if(!el.dataset.size0) el.dataset.size0 = s; while(el.scrollWidth > el.clientWidth + 0.5 && s > lo){ s -= 0.5; el.style.fontSize = s + 'pt'; } };
  // a bullet list in a fixed box (data-fitlist="<floor pt>"): when the items don't all fit (the agent's years line as a fifth
  // step, a reordered list), first the line spacing closes to 1.15, then the type steps down by 0.25 pt to the floor; it
  // never hides a line (owner 10/31: MAP-JS back cut the years line off). A list that fits is left exactly as drawn.
  SP.fitList = (el, lo) => {
    if(!el) return; const items = [...el.children], cs = getComputedStyle((items[0] && items[0].querySelector('[data-slot]')) || items[0] || el);
    let f = parseFloat(cs.fontSize)*72/96, lh = parseFloat(cs.lineHeight)*72/96;
    const set = () => items.forEach(i => [i, ...i.querySelectorAll('[data-slot]')].forEach(e => { e.style.fontSize = f + 'pt'; e.style.lineHeight = lh + 'pt'; }));
    const need = () => items.reduce((a, i) => a + i.getBoundingClientRect().height, 0)*72/96 > el.clientHeight*72/96 + 0.5;
    const max = +el.dataset.fitmax || 0;   // data-fitmax: the box may first grow to this height (pt), when there's room under it
    if(max && need()){ const want = items.reduce((a, i) => a + i.getBoundingClientRect().height, 0)*72/96 + 2*(items.length - 1); el.style.height = Math.min(max, want) + 'pt'; }
    while(need() && lh > f*1.15 + 0.01){ lh = Math.max(f*1.15, lh - 0.25); set(); }
    while(need() && f > lo){ f = Math.max(lo, f - 0.25); lh = f*1.15; set(); }
  };

  // ---------- long street names (owner, 10/31/2026, all designs) ----------
  // The street keeps about its design size (AddressFit.check flags more than 10% shrink). When it has to stack onto two
  // lines, the table under it gives up rows to make room: "Built in" first, then the lot size, then from the bottom,
  // never fewer than three. SP.trimRows(list, fits): drop rows until fits() is true; returns the rows dropped.
  SP.afterAddress = f => (window.afterAddressFit = window.afterAddressFit || []).push(f);
  SP.lineCount = el => { const ls = SP.lineBoxes(el); return ls.length; };
  SP.trimRows = (list, fits, min) => {
    const cut = []; min = min || 3;
    const order = () => { const rows = [...list.children].filter(r => r.style.display !== 'none');
      return rows.find(r => /^Built in\b/.test(r.textContent.trim())) || rows.find(r => /\blot\b|acre/i.test(r.textContent)) || rows[rows.length - 1]; };
    while(!fits() && [...list.children].filter(r => r.style.display !== 'none').length > min){ const r = order(); r.style.display = 'none'; cut.push(r.textContent.trim()); }
    return cut;
  };

  // ---------- the page ----------
  // email = the field at trim size; print flyers = a white margin around the field; print postcards = trim + 0.125 in bleed
  SP.frame = function(D, trimW, trimH, inner){
    const mode = D.mode || 'email', piece = D.piece || {};
    const bleed = (mode==='print' && piece.print==='bleed') ? 9 : 0;
    const inset = (mode==='print' && piece.print==='margin') ? (piece.margin||18) : 0;
    const W = trimW + 2*bleed, H = trimH + 2*bleed;
    return {W, H, bleed, inset,
      html: `<div class="page sp-page${inset ? ' sp-margin' : ''}" data-page="${esc(piece.id||'')}" style="width:${W}pt;height:${H}pt;background:${inset ? '#fff' : 'var(--paper)'}">
        <div class="sp-field" style="left:${inset}pt;top:${inset}pt;right:${inset}pt;bottom:${inset}pt"></div>
        <div class="sp-sheet" style="left:${bleed}pt;top:${bleed}pt;width:${trimW}pt;height:${trimH}pt">${inner}</div></div>`};
  };

  // ---------- the contact card ----------
  SP.headshot = D => { const A = D.agent || {}; return SP.src(D, A.headshot) || (/^(file|https?|data):/.test(A.headshot || '') ? A.headshot : ''); };
  SP.card = (D, box, o) => ContactCard.html(box, Object.assign({}, D.agent || {}, {headshot: SP.headshot(D)}), D.brand || {}, Object.assign({bottomGap: 0.5}, o || {}));
  // the postcard card on a back: full width under the address block, above the barcode strip, at the sizes that fit the
  // 80 pt between them (Swatchbook's, approved 10/29); o.s overrides, o.dark = the set's field is dark
  SP.postCard = (D, Z, W, o) => { o = o || {};
    if(o.dark) D = SP.onDark(D);
    const s = Object.assign({inlineLabel: true, desigInline: true, pad: [8, 16, 7], hsGap: 14, hsW: 78, name: 27, nameFloor: 18, phone: 17, label: 8.5, line: 10, rowGap: 16,
      panelW: 176, panelPad: [6, 10], panelGap: 4, office: 9.5, officeLH: 1.2, logo: {wide: [118, 28], square: [32, 32], tall: [36, 36]}}, o.s || {});
    return SP.card(D, [o.x || 24, Z.cardY, W - 2*(o.x || 24), Z.cardH], Object.assign({postcard: true, fine: '', grow: 0, fieldAccent: true, s},
      D.brand && D.brand._knock ? {logoStyle: 'filter:brightness(0) invert(1)'} : {})); };
  // the brokerage logo for a dark field: the brand's on-dark version, else its white knockout, else the logo knocked out white
  SP.onDark = D => { const b = Object.assign({}, D.brand || {});
    if(b.logoOnDark) b.logo = b.logoOnDark; else if(b.logoKnockout) b.logo = b.logoKnockout; else if(b.logo) b._knock = true;
    return Object.assign({}, D, {brand: b}); };

  // ---------- the whole-card back (owner 11/7/2026) ----------
  // Every postcard back carries the set's design across the whole card, mail side included; only the postage box, the
  // address block and the barcode strip stay clear, on a light tint. SP.backField lays the set's field full bleed (with
  // its motif on top, all under the content); SP.mailTint lays the light tint under the three mail zones, as tabs off the
  // right edge (postage off the top too, barcode off the bottom). Both are data-under: the mail-zone check skips them.
  SP.backField = (W, H, bg, motif) => `<div class="abs sp-bfield" data-under="1" style="left:-9pt;top:-9pt;width:${W + 18}pt;height:${H + 18}pt;background:${bg};overflow:hidden">${motif || ''}</div>`;
  SP.mailTint = (Z, W, H, o) => { o = o || {}; const t = o.color || '#f7f5f0', p = o.pad == null ? 6 : o.pad, r = o.radius || 0, ed = o.edge || '';
    const [zP, zA, zB] = [Z.zP, Z.zA, Z.zB], box = (x, y, x2, y2, rad) => `<div class="abs sp-tint" data-under="1" style="left:${x}pt;top:${y}pt;width:${x2 - x}pt;height:${y2 - y}pt;background:${t};${rad}${ed}"></div>`;
    return box(zP[0] - p, -9, W + 9, zP[1] + zP[3] + p, r ? `border-bottom-left-radius:${r}pt;` : '')
      + box(zA[0] - p, zA[1] - Math.min(p, 1), W + 9, zA[1] + zA[3] + Math.min(p, 4), r ? `border-top-left-radius:${r}pt;border-bottom-left-radius:${r}pt;` : '')
      + box(zB[0] - p, zB[1] - Math.min(p, 2), W + 9, H + 9, r ? `border-top-left-radius:${r}pt;` : ''); };

  // ---------- the mail side ----------
  // The Just Listed library's zones (jllib.js zones(), px x 0.75), as [x, y, w, h] in pt on the trim: postage top right,
  // the address block under it, the barcode strip along the bottom right. The card's spot: full width under the address
  // block and above the barcode strip. The fine print sits bottom-left beside the barcode strip.
  SP.mail = W => {
    const zP = [W - 96, 12, 84, 98.25], zA = [W - 243, 187.5, 240, 112.5], zB = [W - 342, 387, 342, 45];
    return {zP, zA, zB, cardY: zA[1] + zA[3] + 5, cardH: 80, fineX: 24, fineW: zB[0] - 10 - 24, fineY: 420 - 22.5};
  };
  // the approved Just Listed and Just Sold disclaimer (10/25/2026): always two lines, at the largest size that fits (8 pt
  // down to 6), bottom left beside the barcode strip (data-fit steps it down)
  SP.fine = (D, x, y, w, color) =>
    `<div class="abs sp-fine" style="left:${x}pt;top:${y}pt;width:${w}pt;height:24pt;font-size:8pt;line-height:1.25;color:${color||'var(--text)'};white-space:nowrap;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end" data-slot="fineprint" data-fine="1" data-fit="6"><div>Information deemed reliable but not guaranteed.</div><div>Not intended to solicit property listed with a broker.</div></div>`;
  // drawn as guides on proofs (white, so the design under them reads as kept clear); nothing in print
  SP.mailGuides = (D, Z) => {
    window.mailZones = {postage: Z.zP, address: Z.zA, barcode: Z.zB};
    if((D.mode || 'email') === 'print') return '';
    const V = D.mailVendor || {}, [zP, zA, zB] = [Z.zP, Z.zA, Z.zB];
    return `<div class="sp-mailg stamp" data-z="1" style="left:${zP[0]}pt;top:${zP[1]}pt;width:${zP[2]}pt;height:${zP[3]}pt">Postage<br><span style="text-transform:none">mail vendor</span></div>
      <div class="sp-mailg addr" data-z="1" style="left:${zA[0]}pt;top:${zA[1]}pt;width:${zA[2]}pt;height:${zA[3]}pt">${[0,1,2,3].map(i => `<div class="al" style="left:22pt;right:22pt;top:${24 + i*17.25}pt"></div>`).join('')}<div class="g" style="left:22pt;top:97pt">${esc(V.name ? 'Address block · ' + V.name : 'Address block · mail vendor')}</div></div>
      <div class="sp-mailg bar" data-z="1" style="left:${zB[0]}pt;top:${zB[1]}pt;width:${zB[2]}pt;height:${zB[3]}pt"><div class="g" style="left:10pt;top:17pt">Barcode strip · keep clear</div></div>`;
  };
  // the return address: the brokerage over its street lines
  SP.returnLines = D => { const b = D.brand || {}; return [b.brokerage || ''].concat([].concat(b.returnAddress || b.address || []).flatMap(a => String(a).split('\n')).map(s => s.trim()).filter(Boolean).slice(0, 2)).filter(Boolean); };

  // ---------- print checks ----------
  // the CopyRules gate (templates/_shared/copyrules.js, pipeline/copycheck.py): nothing about the home's condition or repairs
  SP.CONDITION = /\b(after (closing|close|move[- ]in|you move in)|roofers?|electricians?|plumbers?|handyman|repair(s|ed|ing)?|fixer[- ]upper|needs? (some |a little )?(work|tlc|updating|love)|tlc|as[- ]is|deferred maintenance|(?<!air[- ])condition(?!(ed|ing|er))|well[- ](maintained|kept|cared for)|meticulously maintained|immaculate|pristine|like[- ]new|move[- ]in ready|turn[- ]?key|ready to move in|nothing to (do|fix)|no work (needed|to do)|(big|major|heavy)[- ](ticket )?(work|items|jobs|projects)|work (is |was )?(already )?done)\b/i;
  // "no pressure" and pushy lines never print (voice.md); Just Sold never carries the free-estimate offers
  SP.PUSHY = /\bno[- ]pressure\b|\bno[- ]obligation\b|\bact (now|fast)\b|\bdon['’]t (wait|miss)\b|\bfree (home )?(value )?(estimate|evaluation)\b|\bfor sale\b/i;
  SP.check = function(D, extra){
    const issues = [...(extra||[])];
    if(window.ContactCard) issues.push(...ContactCard.check(document));
    if(D && D.preview) issues.push({slot:'copy', kind:'preview-text', detail:'rough-draft preview lines; the writer has not run'});
    const sample = /\b(avery morgan|your brokerage|your website|lorem|ipsum|placeholder|tbd|xx+)\b|555[.\-]01\d\d/i;
    const flood = SP.floodStated((D.listing||{}).description);
    const banned = /\b(rebuilt|virtually staged|staged)\b|\bqr\b|photo\s*#?\d/i;
    document.querySelectorAll('[data-slot]').forEach(el => {
      if(el.closest('.cc')) return;   // the contact card runs its own checks
      const name = el.dataset.slot, cs = getComputedStyle(el), txt = el.textContent.trim();
      const size = parseFloat(cs.fontSize)*72/96, oneLine = cs.whiteSpace === 'nowrap', max = +el.dataset.lines || 0;
      const over = oneLine ? el.scrollWidth > el.clientWidth + 1
                 : max ? SP.lines(el) > max || el.scrollWidth > el.clientWidth + 1
                 : el.scrollHeight > el.clientHeight + 1;
      if(over) issues.push({slot:name, kind:'overflow', text:txt.slice(0,80), ...(max && !oneLine ? {lines:SP.lines(el), max} : {})});
      // hidden by a box around it (a list with overflow hidden): the words are there but don't print (MAP-JS back, 10/31)
      if(!over) for(let p = el.parentElement; p && !p.classList.contains('sp-sheet'); p = p.parentElement){
        if(getComputedStyle(p).overflow === 'visible' || p.classList.contains('ph')) continue;
        const r = el.getBoundingClientRect(), q = p.getBoundingClientRect();
        if(r.bottom > q.bottom + 1 || r.right > q.right + 1){ issues.push({slot:name, kind:'clipped', text:txt.slice(0,80)}); }
        break;
      }
      if(size < 8 && !el.dataset.fine) issues.push({slot:name, kind:'type-too-small', size:+size.toFixed(1)});
      if(size < 6) issues.push({slot:name, kind:'fine-print-below-6pt', size:+size.toFixed(1)});
      if(!txt && !el.dataset.optional) issues.push({slot:name, kind:'empty-slot'});
      if(/\$\s?\d/.test(txt)) issues.push({slot:name, kind:'price', text:txt.slice(0,80)});
      if(banned.test(txt)) issues.push({slot:name, kind:'banned-word', text:txt.slice(0,80)});
      if(!el.dataset.fine && !el.querySelector('[data-slot]')){
        const m = txt.match(SP.CONDITION); if(m) issues.push({slot:name, kind:'banned-phrase', rule:'condition', text:m[0]});
        const q = txt.match(SP.PUSHY); if(q) issues.push({slot:name, kind:'banned-phrase', rule:'pushy', text:q[0]});
      }
      if(!flood && /flood/i.test(txt)) issues.push({slot:name, kind:'flood-not-stated', text:txt.slice(0,80)});
      if(!D.sample && sample.test(txt)) issues.push({slot:name, kind:'placeholder', text:txt.slice(0,80)});
    });
    // text printing over other text (a street that stacks onto two lines over the facts under it, owner 10/31): the line
    // boxes of any two text boxes may not cross
    const leaves = [...document.querySelectorAll('[data-slot]')].filter(el => !el.querySelector('[data-slot]') && el.textContent.trim() && el.getClientRects().length);
    // each line's ink core (its middle, about the x-height to cap height, not the leading), so tight spacing isn't a hit
    const rects = leaves.map(el => { const r = document.createRange(); r.selectNodeContents(el); const fs = parseFloat(getComputedStyle(el).fontSize);
      return [...r.getClientRects()].filter(q => q.width > 1 && q.height > 1).map(q => { const m = (q.top + q.bottom)/2; return {left: q.left, right: q.right, top: m - fs*0.3, bottom: m + fs*0.3}; }); });
    for(let i = 0; i < leaves.length; i++) for(let j = i + 1; j < leaves.length; j++){
      const hit = rects[i].some(a => rects[j].some(b => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5));
      if(hit) issues.push({slot: leaves[i].dataset.slot + ' / ' + leaves[j].dataset.slot, kind: 'text-overlap'});
    }
    // paragraphs: enough lines, the last at least 3/4 full (73% passes)
    document.querySelectorAll('[data-para]').forEach(el => {
      const lines = SP.lineBoxes(el); if(!lines.length) return;
      const box = el.getBoundingClientRect().width, last = lines[lines.length-1], min = +el.dataset.min || 2;
      if(lines.length < min) issues.push({slot:el.dataset.slot, kind:'paragraph-too-short', lines:lines.length, min});
      else if(lines.length > 1 && (last.r-last.l)/box < 0.73) issues.push({slot:el.dataset.slot, kind:'last-line-short', pct:Math.round((last.r-last.l)/box*100)});
    });
    // a box that must run to its bottom: its last line ends within one line of the box's bottom edge
    document.querySelectorAll('[data-fillbox]').forEach(el => {
      const ls = SP.lineBoxes(el); if(!ls.length) return;
      const gap = pt(el.getBoundingClientRect().bottom - ls[ls.length-1].b), lh = parseFloat(getComputedStyle(el).lineHeight)*72/96;
      if(gap > lh*0.9 || gap < -1.2) issues.push({slot: el.dataset.slot, kind:'paragraph-not-filling-box', lines: ls.length, gapPt:+gap.toFixed(1)});
    });
    // captions in one row of photos (data-row) run the same number of lines, three or more, at 9 to 9.5 pt
    const rows = {};
    document.querySelectorAll('[data-cap]').forEach(el => (rows[el.dataset.row || el.dataset.slot] = rows[el.dataset.row || el.dataset.slot] || []).push(el));
    Object.entries(rows).forEach(([row, caps]) => {
      const ls = caps.map(c => SP.lines(c));
      if(caps.length > 1 && Math.max(...ls) !== Math.min(...ls)) issues.push({slot: caps.map(c => c.dataset.slot).join(' / '), kind:'captions-uneven', lines: ls});
      caps.forEach((c, i) => {
        const size = parseFloat(getComputedStyle(c).fontSize)*72/96;
        if(c.dataset.cap !== 'short' && ls[i] < 3) issues.push({slot: c.dataset.slot, kind:'caption-under-3-lines', lines: ls[i]});
        if(ls[i] > 9) issues.push({slot: c.dataset.slot, kind:'caption-over-9-lines', lines: ls[i]});
        if(size < 9 - .01 || size > 9.5 + .01) issues.push({slot: c.dataset.slot, kind:'caption-size', size:+size.toFixed(2)});
      });
    });
    // photos: present, 300 ppi at print size both ways, not a sliver
    document.querySelectorAll('.ph').forEach(el => {
      const img = el.querySelector('img'), slot = el.dataset.slotPhoto || el.dataset.photo || 'photo';
      if(!img){ issues.push({slot, kind:'empty-photo-slot'}); return; }
      if(!img.complete || !img.naturalWidth){ issues.push({slot, kind:'photo-missing', src:img.getAttribute('src')}); return; }
      const wIn = el.clientWidth/96, hIn = el.clientHeight/96, ppi = Math.min(img.naturalWidth/wIn, img.naturalHeight/hIn);
      if(ppi < 300) issues.push({slot, photo:el.dataset.photo, kind:'photo-under-300ppi', ppi:Math.round(ppi), placedIn:[+wIn.toFixed(2),+hIn.toFixed(2)]});
      const a = el.clientWidth/el.clientHeight;
      if(a > 3.2 || a < 0.5) issues.push({slot, photo:el.dataset.photo, kind:'photo-frame-too-thin', ratio:+a.toFixed(2)});
    });
    // no photo twice on one piece
    const seen = {}; document.querySelectorAll('.ph[data-photo]').forEach(el => { const id = el.dataset.photo; if(id) seen[id] = (seen[id]||0) + 1; });
    Object.entries(seen).filter(([,k]) => k > 1).forEach(([id,k]) => issues.push({slot:id, kind:'photo-repeated', times:k}));
    // photos sit 8 to 12 pt apart where two face each other (data-gap groups them; measured, not trusted)
    document.querySelectorAll('[data-gapcheck]').forEach(g => {
      const ps = [...g.querySelectorAll(':scope > .ph, .ph')].map(e => e.getBoundingClientRect());
      ps.forEach((a, i) => ps.forEach((b, j) => { if(j <= i) return;
        const hx = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 4 ? pt(Math.max(b.left - a.right, a.left - b.right)) : null;
        const vy = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 4 ? pt(Math.max(b.top - a.bottom, a.top - b.bottom)) : null;
        [hx, vy].forEach(gp => { if(gp != null && gp > -0.5 && gp < 30 && (gp < 7.9 || gp > 12.1)) issues.push({slot: g.dataset.gapcheck, kind:'photo-gap', gapPt:+gp.toFixed(1)}); });
      })); });
    // a brokerage logo never touches text
    { const pad = 3*PT, rects = [];
      document.querySelectorAll('[data-slot]').forEach(el => { if(el.closest('.cc') || !el.textContent.trim()) return;
        const rg = document.createRange(); rg.selectNodeContents(el);
        [...rg.getClientRects()].filter(r => r.width > .5 && r.height > .5).forEach(r => rects.push({slot:el.dataset.slot, r})); });
      document.querySelectorAll('.logo img, .cc img').forEach(lg => { if(lg.closest('.cc-hs, .cc-photo')) return; const q = lg.getBoundingClientRect(); if(!q.width) return;
        const hit = rects.find(({r}) => r.left < q.right + pad && r.right > q.left - pad && r.top < q.bottom + pad && r.bottom > q.top - pad);
        if(hit) issues.push({slot:hit.slot, kind:'logo-touches-text'}); }); }
    // the mail side: nothing prints in the postage box, the address block or the barcode strip
    if(window.mailZones){
      const sh = document.querySelector('.sp-sheet').getBoundingClientRect(), P = r => ({l:(r.left - sh.left)/PT, r:(r.right - sh.left)/PT, t:(r.top - sh.top)/PT, b:(r.bottom - sh.top)/PT});
      const hit = (q, z) => q.l < z[0] + z[2] - .5 && q.r > z[0] + .5 && q.t < z[1] + z[3] - .5 && q.b > z[1] + .5;
      [...document.querySelectorAll('.sp-sheet *')].filter(e => !e.closest('[data-z]') && !e.closest('[data-contactcard]') && !e.closest('[data-under]')).forEach(e => {
        const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()), blk = e.matches('.ph,[data-blk],img');
        if(!own && !blk) return;
        let rects = [];
        if(own){ const rg = document.createRange(); rg.selectNodeContents(e); rects = [...rg.getClientRects()].filter(q => q.width > .5 && q.height > .5); } else rects = [e.getBoundingClientRect()];
        rects.forEach(q => { for(const k in window.mailZones) if(hit(P(q), window.mailZones[k])) issues.push({kind: own ? 'text-in-mail-zone' : 'image-in-mail-zone', slot:k, text:(e.textContent||'').trim().slice(0, 24)}); });
      });
      const cc = document.querySelector('[data-contactcard]');
      if(cc){ const r = P(cc.getBoundingClientRect()); for(const k in window.mailZones) if(hit(r, window.mailZones[k])) issues.push({kind:'card-in-mail-zone', slot:k}); }
    }
    return issues;
  };
  SP.placements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));

  // ---------- finishing ----------
  // draw the page, then fit what has to be measured: display lines (data-fit="floor"), photos, the contact card, paragraphs
  SP.finish = async function(D, trimW, trimH, inner, issues, after){
    const f = SP.frame(D, trimW, trimH, inner);
    document.getElementById('pages').innerHTML = f.html;
    window.pieceSize = {W: f.W, H: f.H, bleed: f.bleed};
    await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    document.querySelectorAll('[data-fit]').forEach(el => SP.fitLine(el, +el.dataset.fit));
    document.querySelectorAll('[data-fitlist]').forEach(el => SP.fitList(el, +el.dataset.fitlist || 8));
    issues.push(...SP.fitPhotos(D));
    if(window.ContactCard) ContactCard.fit(document);
    if(after) await after();
    document.querySelectorAll('[data-para]:not([data-nobal])').forEach(el => SP.balance(el));
    window.proofNotes = [{paragraphs: [...document.querySelectorAll('[data-para],[data-cap]')].map(el => { const ls = SP.lineBoxes(el), w = el.getBoundingClientRect().width, last = ls[ls.length-1];
      return {slot: el.dataset.slot, lines: ls.length, last: last ? Math.round((last.r - last.l)/w*100) : 0, chars: el.textContent.trim().length, wPt: Math.round(pt(w))}; })}];
    window.photoPlacements = SP.placements;
    // D.debugLines (the build script's "lines" command only): every paragraph's lines and last-line fill, reported as checks
    window.brochureCheck = () => SP.check(D, issues).concat(D.debugLines ? window.proofNotes[0].paragraphs.map(q => Object.assign({kind: 'info-lines'}, q)) : []);
  };

  window.SP = SP;
})();
