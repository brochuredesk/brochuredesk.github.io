/* Shared helpers for every page of this design: data, fonts, photos, captions, the contact card and the print checks. */
(function(){
  const AT = {};
  const HALFSPAN = '<span class="bd-half">½</span>';
  AT.halfy = s => AT.esc(s).replace(/½/g, HALFSPAN);   // escaped text, the ½ at full size
  AT.factBath = L => { const b = BD.bathsText(L), m = b.main.match(/^(\S+) (.+)$/), r = [[m[1], m[2]]]; if(b.half){ const h = b.half.match(/^(\S+) (.+)$/); r.push([h[1], h[2]]); } return r; };
  const esc = AT.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pt = px => px*72/96;
  AT.pt = pt;
  AT.data = () => JSON.parse(document.getElementById('brochure-data').textContent || '{}');

  // the standard contact card (Right panel, templates/_shared/agentcard.js here, /designs/shared/agentcard.js on the site)
  const ME = document.currentScript && document.currentScript.src;
  AT.cardReady = window.ContactCard ? Promise.resolve() : new Promise(res => {
    const add = (rel, next) => { const el = document.createElement('script'); el.src = new URL(rel, ME || location.href).href; el.onload = res; el.onerror = next || res; document.head.appendChild(el); };
    add('../engine/agentcard.js', () => add('../shared/agentcard.js'));
  });

  // ---------- brand ----------
  // The agent's brand color drives the titles, the plan tints and the contact card; the signal red stays the design's own.
  AT.applyBrand = function(b){
    b = b || {};
    const root = document.documentElement.style;
    if(b.accent){ root.setProperty('--accent', b.accent); root.setProperty('--ink', b.accent); }
    if(b.paper) root.setProperty('--paper', b.paper);
    if(b.ink)   root.setProperty('--text', b.ink);
    if(b.muted) root.setProperty('--muted', b.muted);
  };

  // ---------- fonts ----------
  // Every render opens in the design's original fonts. An agent may pick other fonts, but only from the approved list in
  // fonts.json (fonts that keep the originals' width and letter heights). Anything else falls back to the originals.
  AT.fontBase = '../../fonts/pool/';
  AT.applyFonts = async function(D, spec){
    const want = (D.brand && D.brand.fonts) || D.fonts || {};
    const issues = [];
    const roles = {display: '--font-display', body: '--font-body'};
    const loads = [];
    for(const role of Object.keys(roles)){
      const o = spec && spec.originals[role];
      const id = want[role];
      if(!o || !id || id === o.id) continue;
      if(!o.approved.includes(id)){ issues.push({slot:'fonts.'+role, kind:'font-not-approved', detail:id}); continue; }
      const fam = 'at-' + id;
      const have = (spec.weights && spec.weights[id]) || [400,500,600,700];
      for(const w of role === 'display' ? [500,600,700] : [400,600,700]){
        const near = have.reduce((a,b)=> Math.abs(b-w) < Math.abs(a-w) ? b : a);
        const f = new FontFace(fam, `url(${AT.fontBase}${id}-latin-${near}-normal.woff2)`, {weight:String(w)});
        document.fonts.add(f); loads.push(f.load());
      }
      document.documentElement.style.setProperty(roles[role], `'${fam}',Helvetica,Arial,sans-serif`);
    }
    await Promise.all(loads).catch(e => issues.push({slot:'fonts', kind:'font-load-failed', detail:String(e)}));
    const cs = getComputedStyle(document.documentElement);
    await Promise.all(['500 10pt','600 10pt','700 10pt'].flatMap(w => [document.fonts.load(`${w} ${cs.getPropertyValue('--font-display')}`), document.fonts.load(`${w.replace(/^\d+/, m => m==='500' ? '400' : m)} ${cs.getPropertyValue('--font-body')}`)]));
    return issues;
  };

  // ---------- photos ----------
  AT.src = (D, id) => (D.photos && D.photos[id] && D.photos[id].src) || '';
  AT.photo = (D, id, style, slot, cls) => {
    const p = (D.photos||{})[id] || {};
    return `<div class="ph ${cls||''}" data-photo="${esc(id||'')}" data-slot-photo="${esc(slot||'')}" style="${style||''}">${id && p.src ? `<img src="${esc(p.src)}" alt="">` : ''}</div>`;
  };
  // Fit each photo in its box once the box has its size: keep the focal point, and keep a whole house whole (a photo with a
  // house box [x0,y0,x1,y1] in fractions is placed so the box stays inside the frame; if no placement can, say so).
  AT.fitPhotos = function(D){
    const issues = [];
    document.querySelectorAll('.ph').forEach(el => {
      const img = el.querySelector('img'), p = (D.photos||{})[el.dataset.photo] || {};
      if(!img || !p.w || !p.h) return;
      const cw = el.clientWidth, ch = el.clientHeight, s = Math.max(cw/p.w, ch/p.h);
      const vx = Math.min(1, cw/(p.w*s)), vy = Math.min(1, ch/(p.h*s));
      const fx = (p.focusX != null ? p.focusX : 50)/100, fy = (p.focusY != null ? p.focusY : 50)/100;
      let ox = fx, oy = fy;   // center of the window, fractions of the photo
      const b = p.box;
      if(b){ ox = (b[0]+b[2])/2; oy = (b[1]+b[3])/2; }
      const x0 = Math.min(1-vx, Math.max(0, ox - vx/2)), y0 = Math.min(1-vy, Math.max(0, oy - vy/2));
      img.style.objectPosition = `${vx < 1 ? x0/(1-vx)*100 : 50}% ${vy < 1 ? y0/(1-vy)*100 : 50}%`;
      if(b){
        const tol = 0.004;
        if(b[0] < x0 - tol || b[2] > x0 + vx + tol || b[1] < y0 - tol || b[3] > y0 + vy + tol)
          issues.push({slot: el.dataset.slotPhoto || el.dataset.photo, kind:'house-cut-off', detail:`the photo's frame shows ${Math.round(vx*100)} x ${Math.round(vy*100)}% of it and the house needs ${Math.round((b[2]-b[0])*100)} x ${Math.round((b[3]-b[1])*100)}%`});
      }
    });
    return issues;
  };

  // ---------- listing facts ----------
  const n = v => Number(v).toLocaleString('en-US');
  const pl = (k, one, many) => `${n(k)} ${k==1 ? one : many}`;
  AT.stats = L => {
    const s = [];
    if(L.beds) s.push(pl(L.beds, 'Bedroom', 'Bedrooms'));
    if(L.baths){ const b = BD.bathsText(L); s.push(b.main); if(b.half) s.push(b.half); }   // bath wording rule (the owner 11/1)
    if(L.sqft) s.push(`${n(L.sqft)} Square Feet`);
    if(L.yearBuilt || L.year) s.push(`Built in ${L.yearBuilt || L.year}`);
    return s;
  };
  AT.fifth = L => L.lotSize ? L.lotSize : L.stories ? (L.stories == 1 ? 'One Story' : `${L.stories} Stories`) : (L.garage ? `${L.garage}-Car Garage` : '');
  AT.place = L => [L.city, L.state].filter(Boolean).join(', ');
  AT.floodStated = desc => String(desc||'').split(/(?<=[.!?])\s+/).some(s => /\b(never\s+(been\s+)?flooded|(has|have)\s+(not|never)\s+(ever\s+)?(been\s+)?flooded|(hasn|haven)['’]t\s+(ever\s+)?(been\s+)?flooded)\b/i.test(s)
    && !/\b(during|in|from)\s+(hurricane|tropical|harvey|ike|allison|beryl|imelda|the\s+\d{4}|\d{4})\b/i.test(s));

  // ---------- floor plan facts ----------
  // A design built around the plan: it needs a plan that lists rooms (owner 10/28).
  // A level lists rooms either as drawn rooms (L.rooms) or, for the agent's own plan image, by the room names printed on it (L.roomNames).
  const listsRooms = l => l.kind === 'image' && !!l.src;   // the listing's own plan image only; never a drawing from room sizes (owner 11/10/2026)
  AT.planOK = D => !!(D.plan && (D.plan.levels||[]).some(listsRooms));
  AT.levels = D => ((D.plan && D.plan.levels) || []).filter(l => !l.inset && listsRooms(l));
  const footprint = L => L.kind === 'image' ? (L.feet ? L.feet.w*L.feet.d : L.w*L.h) : (L.rooms||[]).filter(r => r.kind !== 'outdoor').reduce((a, r) => a + r.w*r.d, 0);
  // Which small plans carry a floor name (owner 10/28): a one-story: none. Several floors: every one, "First floor" to "Fourth
  // floor". Mostly one story with a small upstairs (that floor under 40% of the main floor): only the upstairs.
  AT.floorLabels = D => {
    const lv = AT.levels(D);
    if(lv.length <= 1) return lv.map(() => '');
    if(lv.length === 2){
      const a = footprint(lv[0]), b = footprint(lv[1]);
      if(b < 0.4*a) return ['', lv[1].name];
      if(a < 0.4*b) return [lv[0].name, ''];
    }
    return lv.map(l => l.name);
  };

  // Which room on a floor does a caption describe? Returns the room's index in L.rooms, or -1 when it can't be said for sure.
  // A caption title matches a room by name ("Primary Bedroom" = "Primary Bedroom"; "Living Room" = "Living"; "Breakfast Nook" = "Nook";
  // "Primary Suite" = "Primary Bedroom"). Where several rooms share the name ("Bedroom 2", "Hall Bath"), the size in the caption
  // ---------- text ----------
  // Lines a block of text actually sets in.
  AT.lines = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
    const qs = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5).sort((a,b)=>a.top-b.top);
    let k = 0, last = -1e9;
    for(const q of qs){ if(q.top - last > lh*0.5){ k++; last = q.top; } }
    return k;
  };
  AT.lineBoxes = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
    const lines = [];
    for(const q of [...r.getClientRects()].filter(q => q.width > .5)){
      const l = lines.find(x => Math.abs(x.top - q.top) < lh*0.5 || (q.top >= x.top - 1 && q.bottom <= x.b + 1));   // a small raised ½ sits inside its line
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
    const cs = getComputedStyle(el), fs0 = parseFloat(cs.fontSize) * 72 / 96, lh0 = cs.lineHeight;
    const W = el.getBoundingClientRect().width;   // px
    el.style.lineHeight = lh0;
    // the type size moves by a tenth of a point at a time (never under 8 pt, never more than half a point either way) and the
    // column narrows a few points (never more than 12%, never a new line) until the last line fills
    for(const d of [0, -.1, .1, -.2, .2, -.3, .3, -.4, .4, -.5, .5]){
      if(fs0 + d < 8) continue;
      el.style.fontSize = (fs0 + d) + 'pt';
      for(let p = 0; p <= Math.floor(W * 0.12); p += 2){
        el.style.maxWidth = p ? (W - p) + 'px' : '';
        const m = read(); if(!m) break;
        if(m.n > base.n) break;
        if(m.n === base.n && m.f >= 0.8) return;
      }
    }
    el.style.maxWidth = ''; el.style.fontSize = '';
  };
  AT.textWidth = el => { const r = document.createRange(); r.selectNodeContents(el); return pt(r.getBoundingClientRect().width); };

  // ---------- contact card ----------
  // The standard Right panel card, with and without a headshot. The card carries the spread's one brokerage logo.
  AT.card = function(D, box, fine){
    const A = D.agent || {}, hs = AT.src(D, A.headshot) || (/^(file|https?|data):/.test(A.headshot || '') ? A.headshot : '');
    return ContactCard.html(box, Object.assign({}, A, {headshot: hs}), D.brand || {}, {layout:'panel', fine: fine || '', bottomGap: 0.5});
  };

  // the narrow card for a back (owner 11/10/2026): the headshot (or stripe) beside the agent's lines stacked, the brokerage on a band below
  AT.cardNarrow = function(D, box, fine, s){
    const A = D.agent || {}, hs = AT.src(D, A.headshot) || (/^(file|https?|data):/.test(A.headshot || '') ? A.headshot : '');
    return ContactCard.html(box, Object.assign({}, A, {headshot: hs}), D.brand || {}, {layout:'band', size:'band', fine: fine || '', bottomGap: 0.5, grow: 0,
      s: Object.assign({name: 21, nameFloor: 15, phone: 15, line: 9, hsW: 72, bandH: 36}, s || {})});
  };

  // ---------- print checks (read by the renderer) ----------
  // justified text never spreads a word gap past about 1.7x the real space width; such a block is set ragged instead
  // (reviewer4 p9/p10 11/12: ~2.3x gaps; runs before every check and before the proofs are shot; pattern: in-sections capfit.js gapsTooWide)
  AT.wordGaps = el => {
    const rg = document.createRange(), rows = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while(w.nextNode()){ const n = w.currentNode, re = /\S+/g; let m; while((m = re.exec(n.textContent))){ rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length); const q = rg.getClientRects()[0]; if(q) rows.push(q); } }
    const lines = []; for(const r of rows){ const l = lines.find(x => Math.abs(x.m - (r.top + r.bottom)/2) < r.height*.5); if(l) l.w.push(r); else lines.push({m: (r.top + r.bottom)/2, w: [r]}); }
    return lines.sort((a, b) => a.m - b.m).map(l => l.w.sort((a, b) => a.left - b.left).slice(1).map((r, i) => r.left - l.w[i].right));
  };
  AT.raggedGuard = (limit = 1.7) => { const out = [];
    document.querySelectorAll('[data-slot]').forEach(el => {
      if(el.querySelector('[data-slot]') || getComputedStyle(el).textAlign !== 'justify') return;
      const j = el.style.textAlign; el.style.textAlign = 'left'; const rag = AT.wordGaps(el).flat().filter(g => g > .3).sort((a, b) => a - b); el.style.textAlign = j;
      if(!rag.length) return; const space = rag[Math.floor(rag.length/2)];
      const g = AT.wordGaps(el).slice(0, -1).flat(); if(!g.length) return;
      const mx = Math.max(...g); if(mx > space*limit){ el.style.textAlign = 'left'; el.style.textAlignLast = 'left'; el.dataset.capragged = '1'; out.push({slot: el.dataset.slot, gap: +(mx/space).toFixed(2)}); } });
    // a row keeps one setting (reviewer5 p10): among multi-line text blocks whose tops line up, if any is set ragged, the justified
    // ones set ragged too
    const blocks = [...document.querySelectorAll('[data-slot]')].filter(el => { if(el.querySelector('[data-slot]') || !el.offsetParent) return false;
      const q = el.getBoundingClientRect(), lh = parseFloat(getComputedStyle(el).lineHeight) || 12; return q.height >= lh*1.5 && el.textContent.trim().length > 40; });
    const just = el => /justify/.test(getComputedStyle(el).textAlign);
    blocks.forEach(el => { if(!just(el)) return; const t = el.getBoundingClientRect().top;
      if(blocks.some(o => o !== el && !just(o) && !o.dataset.rowragged && Math.abs(o.getBoundingClientRect().top - t) < 3)){
        el.style.textAlign = 'left'; el.style.textAlignLast = 'left'; el.dataset.capragged = '1'; el.dataset.rowragged = '1'; out.push({slot: el.dataset.slot, row: 1}); } });
    (window.proofNotes = window.proofNotes || []).push({raggedGuard: out}); return out; };
  AT.check = function(D, extra){
    AT.raggedGuard();
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


  // ================= single pieces: Open House flyers and postcards =================
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
    if(L.baths){ const b = BD.bathsText(L); f.push(b.main.toLowerCase()); if(b.half) f.push(b.half.toLowerCase()); }
    if(L.sqft) f.push(`${n(L.sqft)} sq ft`);
    return f.join('  /  ');
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
  AT.settle = () => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));

  window.AT = AT;
})();
