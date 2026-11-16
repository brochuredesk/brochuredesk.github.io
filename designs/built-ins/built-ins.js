/* Shared helpers for every piece (data, fonts, photos, captions, the contact card
   and the print checks). The full floor plan lives in plan.js. */
(function(){
  const AT = {};
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
    if(b.accent){ root.setProperty('--accent', b.accent); root.setProperty('--cc-accent', b.accent); }   // the card and plan tints; the design keeps its own palette
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
    if(L.baths){ const bt = BD.bathsText(L); s.push(bt.main); if(bt.half) s.push(bt.half); }
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
  const listsRooms = l => (l.rooms||[]).length || (l.kind === 'image' && !!l.src);   // the listing's own plan image always counts (owner 11/10/2026)
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

  // ---------- text ----------
  // Lines a block of text actually sets in.
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

  // ---------- contact card ----------
  // The standard Right panel card, with and without a headshot. The card carries the spread's one brokerage logo.
  AT.card = function(D, box, fine, o){
    const A = D.agent || {}, hs = AT.src(D, A.headshot) || (/^(file|https?|data):/.test(A.headshot || '') ? A.headshot : '');
    return ContactCard.html(box, Object.assign({}, A, {headshot: hs}), D.brand || {}, Object.assign({layout:'panel', fine: fine || '', bottomGap: 0.5}, !o && box[3] <= 80 ? {size: 'half', grow: 0, s: {panelW: 160}} : {}, o || {}));   // a box 80 pt or shorter is the half-height card (owner 11/15/2026); the back's own short-card settings win
  };

  // ---------- print checks (read by the renderer) ----------
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
    if(window.PlanDraw) issues.push(...PlanDraw.check());
    return issues;
  };
  AT.placements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));


  // ---------- floor-name labels under a plan never run into each other (a narrow level's name is wider than its drawing) ----------
  AT.fixPlanLabels = () => {
    const ls = [...document.querySelectorAll('.plan-level')].filter(e => /plan\.level/.test(e.dataset.slot || ''));
    ls.forEach(e => { e.dataset.fixed = '1'; });   // the renderer's type pass leaves them at the size set here
    const ink = e => { const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect(); };
    const clash = () => ls.some((a, i) => ls.some((b, j) => j > i && Math.abs(ink(a).top - ink(b).top) < 6 && ink(a).left < ink(b).right + 6 && ink(b).left < ink(a).right + 6));
    for(const [fs, sp] of [[9, 1.5], [9, 1], [8.5, .8], [8, .6], [8, .3], [8, 0]]){ if(!clash()) break; ls.forEach(e => { e.style.fontSize = fs + 'pt'; e.style.letterSpacing = sp + 'pt'; }); }
  };

  // ---------- postcard and Open House copy ----------
  // data.copy.pc when the writer gave it; otherwise built from the fold-over's own true copy (the house write-up and the rooms' captions),
  // so a postcard or Open House flyer never prints an empty write-up or caption (owner 11/10/2026, rule 6). The Just Sold seller lines are
  // the company's standing seller copy, not about the house.
  AT.pcCopy = D => {
    const C = D.copy || {};
    if(C.pc && (C.pc.jl || C.pc.oh || C.pc.js)) return C.pc;
    const P = D.photos || {}, has = id => id && P[id] && P[id].src;
    const SP = t => (String(t || '').match(/(?:[^.!?]|\.(?=\d))+[.!?]+["”’)]*|(?:[^.!?]|\.(?=\d))+$/g) || []).map(x => x.trim()).filter(Boolean);
    const L = C.left || {}, R = C.right || {}, B = C.back || {};
    const items = [...((C.cover || {}).items || []), L.big, ...(L.pair || []), L.strip, ...(R.items || []), ...(B.pair || []), B.big].filter(i => i && has(i.photo) && (i.body || i.s));
    const hero = (C.cover || {}).photo || Object.keys(P)[0], seen = new Set([hero]), uniq = items.filter(i => !seen.has(i.photo) && seen.add(i.photo));
    // a short caption: the lead sentence(s) up to about 110 characters; the rest of its true lines go to x for the caption fitter
    const capOf = (it, max) => { const ss = SP(it.body || it.s), pool = ss.concat(it.x || []), a = [];
      for(const t of pool){ if(!a.length || (a.join(' ') + ' ' + t).length <= max) a.push(t); }
      let t = a.join(' ');
      if(t.length > max + 30){ const m = [...t.matchAll(/, (?:with|under|beside|over|set|just|where|which|by|and) /g)].filter(q => q.index >= 50 && q.index <= max).pop(); if(m) t = t.slice(0, m.index) + '.'; }
      return {photo: it.photo, title: it.title, dims: it.dims || null, text: t, text11: t, x: pool.filter(q => !a.includes(q))}; };
    const caps = uniq.map(i => capOf(i, 110)), rooms = caps.filter(c => c.dims), others = caps.filter(c => !c.dims);
    const front3 = [...rooms, ...others].slice(0, 3), rest = caps.filter(c => !front3.includes(c));
    const outside = B.big && has(B.big.photo) ? caps.find(c => c.photo === B.big.photo) : null;
    const back4 = rest.filter(c => c !== outside).slice(0, 4), house = (C.cover || {}).house || (D.listing || {}).description || '';
    const back = [...rest.filter(c => c !== outside && c.dims), ...rest.filter(c => c !== outside && !c.dims)].slice(0, 4);
    const js = {servicesLabel: 'What I do for sellers', meetLabel: 'When we meet', call: 'Call or text me anytime.', kicker: 'To the neighbors',
      services: ['A walk through your home, room by room.', 'Recent sales on your street and nearby.', 'A written estimate of what your home could sell for.', 'A brochure, flyers and postcards made for your home.'],
      services11: ['A walk through your home.', 'Recent sales near you.', 'A written home estimate.', 'A brochure for your home.', 'Flyers and postcards.', 'Each step in plain words.'],
      meet9: 'We can meet at your house, whenever works for you. I\u2019ll walk through every room, hear what you\u2019re hoping for and how soon you\u2019d like to move, then lay out the steps from there. You decide what happens next, and there\u2019s no rush.',
      meet11: 'We can meet at your house, whenever works for you. I\u2019ll walk through every room, hear what you\u2019re hoping for and how soon you\u2019d like to move, then lay out the steps from there. Bring your questions and I\u2019ll bring the numbers, and we can go as slowly or as quickly as you like. You decide what happens next.',
      slab: {big: 'Let\u2019s meet', sub: 'Any day that suits you, at your kitchen table.'}, hero, photos: front3.slice(0, 2).map(c => c.photo),
      front9: `${(D.listing || {}).address || 'The house down the street'} has a new owner. If you have thought about selling, I\u2019d be glad to walk through your home with you and pull the recent sales on your street and nearby, house by house. You set the timing, and I\u2019ll answer every question along the way. Call or text me whenever it suits you, and we\u2019ll find a time.`,
      front11: `${(D.listing || {}).address || 'The house down the street'} has a new owner. If you have thought about selling, I\u2019d be glad to walk through your home with you and pull the recent sales on your street and nearby, house by house. You set the timing, and I\u2019ll answer every question along the way. Call or text me whenever it suits you, and we\u2019ll find a time that works for you. Questions before we meet are always welcome, big or small.`};
    return {fromFoldover: true, oh: {photos: [hero], rows: front3},
      jl: {aboutLabel: 'The house', slab: {big: 'Come see it', sub: 'Call or text me to set up a showing.'}, hero, front: front3, back: back.length >= 3 ? back : back4, right: outside || rest[4] || null, about9: house, about11: house},
      js, fineprint: 'Information deemed reliable but not guaranteed.'};
  };

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
