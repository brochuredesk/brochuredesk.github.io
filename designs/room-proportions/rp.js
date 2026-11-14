/* RP design: shared helpers for every piece.
   Brand, captions, the contact card and the print checks live here so all pieces behave the same. */
(function(){
  const RP = {};
  // the standard contact card (Right panel, 10/25/2026): templates/_shared/agentcard.js here, /designs/shared/agentcard.js on the site
  const ME = document.currentScript && document.currentScript.src;
  RP.cardReady = window.ContactCard ? Promise.resolve() : new Promise(res => {
    const add = (rel, next) => { const el = document.createElement('script'); el.src = new URL(rel, ME || location.href).href; el.onload = res; el.onerror = next || res; document.head.appendChild(el); };
    add('../engine/agentcard.js', () => add('../shared/agentcard.js'));
  });

  RP.data = function(){
    const D = JSON.parse(document.getElementById('brochure-data').textContent || '{}');
    // Room Proportions prints on white (owner 10/29/2026): the brand's paper color never replaces it
    if(D.brand) D.brand.paper = '#ffffff';
    return D;
  };

  // Brand comes from the agent's profile. The accent is the agent's brand color.
  RP.applyBrand = function(b){
    b = b || {};
    const root = document.documentElement.style;
    if(b.accent) root.setProperty('--accent', b.accent);
    if(b.ink)    root.setProperty('--ink',    b.ink);
    if(b.muted)  root.setProperty('--muted',  b.muted);
    if(b.fontDisplay) root.setProperty('--font-display', b.fontDisplay);
    if(b.fontBody)    root.setProperty('--font-body',    b.fontBody);
    if(b.fontFaces){ const s=document.createElement('style'); s.textContent=b.fontFaces; document.head.appendChild(s); }
  };

  RP.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const esc = RP.esc;

  RP.src = (D, id) => (D.photos && D.photos[id] && D.photos[id].src) || '';

  // A full-house shot (front, back or side of the whole house) never loses its roof: frames may crop the sides,
  // never the top, so the photo is pinned to its top edge and any height it has to lose comes off the ground.
  RP.fullHouse = (D, id) => {
    const p = (D.photos||{})[id] || {};
    if(p.fullHouse != null) return !!p.fullHouse;
    return /\b(front|rear|back|side) exterior\b|\bfull house\b/i.test(p.tags||'');
  };
  RP.fit = (D, id) => {
    if(!id) return '';
    const p = (D.photos||{})[id] || {};
    const fx = p.focusX != null ? p.focusX : 50;
    if(RP.fullHouse(D, id)) return `object-position:${fx}% 0%`;
    if(p.focusY != null || p.focusX != null) return `object-position:${fx}% ${p.focusY != null ? p.focusY : 50}%`;
    return '';
  };
  // Where each photo prints and how big (inches), so the renderer can enlarge any that would print under 300 ppi.
  window.photoPlacements = () => [...document.querySelectorAll('.photo img')].map(img => {
    const el = img.parentElement; return {src: img.getAttribute('src'), w: el.clientWidth/96, h: el.clientHeight/96};
  });

  RP.photo = (D, cls, id, style) =>
    `<div class="photo ${cls||''}" data-photo="${esc(id)}"${RP.fullHouse(D,id)?' data-fullhouse="1"':''} style="${style||''}">${id && RP.src(D,id) ? `<img src="${esc(RP.src(D,id))}" alt="" style="${RP.fit(D,id)}">` : ''}</div>`;

  // Which of the 8 property type versions this listing gets (template readiness standard, section 8).
  // Story count from the listing data (or the plan's level count); plan = a redrawn plan with at least one level.
  RP.version = D => {
    const L = D.listing || {};
    const real = !!(D.plan && D.plan.levels && D.plan.levels.length);
    // the rough-draft preview's simple plan (D.planPreview, one image per floor) picks the plan version too
    const pre = !real && !!(D.planPreview && D.planPreview.length), plan = real || pre;
    const levels = real ? D.plan.levels.filter(l=>!l.garageApartment && !l.roof).length : pre ? D.planPreview.length : 0;
    const stories = Math.max(1, Math.min(4, Math.round(+L.stories || levels || 1)));
    return {stories, plan, id: `${stories}-story-${plan ? 'plan' : 'noplan'}`};
  };

  // The appraisal district that the size facts come from, named by county.
  const DISTRICTS = {harris:'HCAD', galveston:'GCAD', brazoria:'BCAD', 'fort bend':'FBCAD', montgomery:'MCAD',
                     chambers:'CCAD', waller:'WCAD', liberty:'LCAD', bexar:'BCAD', travis:'TCAD', dallas:'DCAD', tarrant:'TAD'};
  RP.district = L => L.district || DISTRICTS[String(L.county||'').toLowerCase().replace(/ county$/,'')] || '';

  // Logo, or the brokerage name set in type when there is no logo file.
  RP.logo = (b, cls, style) =>
    `<div class="logo ${cls||''}" style="${style||''}">${b && b.logo ? `<img src="${esc(b.logo)}" alt="">` : `<span class="text">${esc((b && b.brokerage)||'')}</span>`}</div>`;

  const cap1 = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  // Caption = bold room name + one short detail line. Written captions win; otherwise both come
  // from the photo's tags (first tag = room name, the next tags = the detail line).
  RP.caption = function(D, id){
    const p = (D.photos||{})[id] || {};
    if(p.caption && p.caption.name) return {name: p.caption.name, detail: p.caption.detail || ''};
    const tags = String(p.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
    const name = cap1(tags[0] || '');
    let detail = '';
    for(const t of tags.slice(1)){
      const next = detail ? detail + ', ' + t : t;
      if(next.length > 34) break;
      detail = next;
    }
    return {name, detail: cap1(detail)};
  };

  RP.captionHTML = (D, id, x, y, w, slot) => {
    const c = RP.caption(D, id);
    // an untagged photo before the package is written: faint lines, never an empty gap
    if(!c.name && D.copyPending) return RP.ghost(x, y, w*0.55, 1, 10.5) + RP.ghost(x, y+11, w*0.8, 1, 10);
    return `<div class="abs cap-name" style="left:${x}pt;top:${y}pt;width:${w}pt;height:10.5pt" data-slot="${slot}.name" data-lines="1">${esc(c.name)}</div>`
         + `<div class="abs cap-detail" style="left:${x}pt;top:${y+11}pt;width:${w}pt;height:10pt" data-slot="${slot}.detail" data-lines="1">${esc(c.detail)}</div>`;
  };

  // Faint lines in place of copy that hasn't been written yet.
  // The open house flyers' optional lines (special notes, refreshments) wrap instead of shrinking. eventLines measures
  // how many lines each needs at its own size in a column w pt wide and returns the HTML plus the height used.
  // lines: [[text, slot, cls], ...] (empty texts skipped); each block gets data-lines = the lines it needs, so the
  // print checks still catch anything that runs past them.
  RP.linesNeeded = (cls, text, w, lh) => {
    const m = document.createElement('div');
    m.className = cls; m.textContent = text;
    m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;height:auto;white-space:normal;overflow:visible`;
    document.body.appendChild(m); const n = Math.max(1, Math.round(m.scrollHeight*72/96/lh)); m.remove(); return n;
  };
  RP.eventLines = (lines, x, y, w, lh, gap, extraStyle) => {
    let h = '', at = y;
    lines.filter(l=>l[0]).forEach(([text, slot, cls])=>{
      const n = RP.linesNeeded(cls, text, w, lh);
      h += `<div class="abs ${cls}" style="left:${x}pt;top:${at}pt;width:${w}pt;height:${n*lh}pt;white-space:normal;${extraStyle||''}" data-slot="${slot}" data-lines="${n}">${RP.esc(text)}</div>`;
      at += n*lh + (gap||0);
    });
    return {html: h, h: at > y ? at - y - (gap||0) : 0};
  };

  RP.ghost = (x, y, w, lines, lh) => {
    let h = '';
    const widths = [100, 96, 99, 92, 97, 88, 95, 100, 90, 62];
    for(let i=0;i<lines;i++){ const last = i===lines-1; h += `<i style="width:${last?58:widths[i%widths.length]}%;margin-top:${i?(lh-3.2):(lh-3.2)/2}pt"></i>`; }
    return `<div class="ghost" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${lines*lh}pt">${h}</div>`;
  };

  // Body text, or faint lines when the copy is still pending.
  RP.text = (D, text, x, y, w, lines, lh, size, slot) => {
    if(D.copyPending || !text) return RP.ghost(x, y, w, lines, lh);
    return `<div class="abs body" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${lines*lh}pt;font-size:${size}pt;line-height:${lh}pt" data-slot="${slot}" data-lines="${lines}">${esc(text)}</div>`;
  };

  RP.facts = L => {
    const f = [];
    if(L.beds) f.push(`${L.beds} bedroom${L.beds==1?'':'s'}`);
    if(L.baths){ const bt = BD.bathsText(L); f.push(bt.main.toLowerCase()); if(bt.half) f.push(bt.half.toLowerCase()); }
    if(L.sqft) f.push(`${Number(L.sqft).toLocaleString('en-US')} square feet`);
    return f;
  };
  RP.factsShort = L => {
    const f = [];
    if(L.beds) f.push(`${L.beds} bed${L.beds==1?'':'s'}`);
    if(L.baths){ const bt = BD.bathsText(L); f.push(bt.main.toLowerCase()); if(bt.half) f.push(bt.half.toLowerCase()); }
    if(L.sqft) f.push(`${Number(L.sqft).toLocaleString('en-US')} sq ft`);
    return f.join('  /  ');
  };
  const ST = {alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',connecticut:'CT',delaware:'DE',
    'district of columbia':'DC',florida:'FL',georgia:'GA',hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',
    kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',michigan:'MI',minnesota:'MN',mississippi:'MS',
    missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY',
    'north carolina':'NC','north dakota':'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode island':'RI',
    'south carolina':'SC','south dakota':'SD',tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA',
    'west virginia':'WV',wisconsin:'WI',wyoming:'WY'};
  // "Houston, TX": city and two-letter state (Open House v5 city line, 10/25/2026)
  RP.cityST = L => [L.city, ST[String(L.state||'').trim().toLowerCase()] || L.state].filter(Boolean).join(', ');
  RP.place = L => [L.city, L.state].filter(Boolean).join(', ');   // the approved place line: city and state (owner 10/21/2026); a design choice, not a rule (neighborhood names allowed on every piece, owner 10/28/2026)
  // Open House flyers only: city, state and ZIP under the street so people can find the house, "Houston, TX 77023" (owner 10/27/2026)
  RP.placeZip = L => [RP.cityST(L), L.zip].filter(Boolean).join(' ');

  // Photos for the companion pieces: written order if given, else listing order (exterior first).
  RP.photoOrder = function(D){
    const P = D.photos || {};
    const ids = (D.companion && D.companion.photos) || Object.keys(P).filter(id => !/floor ?plan/i.test(P[id].tags||''));
    return ids.filter(id => RP.src(D, id));
  };

  /* Contact card for the companion pieces: the standard Right panel card (templates/_shared/agentcard.js, 10/25/2026).
     opts: x, y, w, h (pt), layout ('panel' / 'band'; default by width), grow (pt it may grow upward), s (size overrides).
     The card carries the piece's one brokerage logo. */
  RP.card = function(D, o){
    const A = D.agent || {}, hs = RP.src(D, A.headshot) || (/^(file|https?|data):/.test(A.headshot || '') ? A.headshot : '');
    return ContactCard.html([o.x, o.y, o.w, o.h], Object.assign({}, A, {headshot: hs}), D.brand || {}, {layout: o.layout, size: o.size, grow: o.grow || 0, s: o.s, bottomGap: 0.5, bandTint: !!o.bandTint});
  };

  // Lay out every contact card (the card's own fitting); the print checks read the cards at check time (RP.check)
  RP.layoutCards = function(){ ContactCard.fit(document); return []; };


  // MLS room sizes for a postcard back: living spaces, kitchen, primary, then the other bedrooms (numbered), at most n rows
  RP.roomRows = (L, n) => {
    const rs = (L.rooms || []).filter(r => r && r.name && r.size && !/bath|closet|utility|laundry|garage|covered|porch|patio|structure/i.test(r.name));
    const rank = r => /living|family|great|game|media/i.test(r.name) ? 0 : /kitchen/i.test(r.name) ? 1 : /primary|master/i.test(r.name) ? 2 : /^bed/i.test(r.name) ? 3 : /dining/i.test(r.name) ? 4 : 5;
    let bed = 1;
    const out = rs.map((r, i) => ({r, i})).sort((a, c) => rank(a.r) - rank(c.r) || a.i - c.i).map(({r}) => {
      let nm = r.name.replace(/^Living$/i, 'Living room').replace(/^Primary Bedroom$/i, 'Primary bedroom');
      if(/^bedroom$/i.test(r.name)){ bed += 1; nm = 'Bedroom ' + bed; }
      return [nm, r.size]; });
    return out.slice(0, n);
  };

  /* Footer print checks (owner, 10/25/2026, every footer on every piece):
     1. The agent's contact info never touches the bottom line: every line's box ends at least 0.5 pt above the card's
        bottom edge (its rule); a line running onto the edge fails, and the card keeps at least 4 pt above the trim (the field edge on flyers).
     2. The brokerage logo and contact are centered in their own space (the panel or band), within 1.5 pt,
        whatever the agent's name. */
  RP.footerChecks = function(){
    const issues = [], PT = 96/72;
    document.querySelectorAll('.cc[data-contactcard]').forEach(card => {
      const k = card.getBoundingClientRect().height / card.offsetHeight || 1, r = card.getBoundingClientRect();
      const toPt = px => px / k / PT;
      const vis = e => !!(e.offsetParent || e.getClientRects().length);
      let low = -1e9;
      card.querySelectorAll('.cc-agent *, .cc-panel *').forEach(e => {
        if(!vis(e) || ![...e.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())) return;
        const rg = document.createRange(); rg.selectNodeContents(e);
        [...rg.getClientRects()].forEach(q => { if(q.width) low = Math.max(low, q.bottom); }); });
      const gap = toPt(r.bottom - low);
      if(low > -1e9 && gap < 0.5) issues.push({slot:'contact-card', kind:'footer-touches-bottom-line', gapPt:+gap.toFixed(2), detail:'contact text runs onto the card bottom'});
      const sheet = card.closest('.sheet') || card.closest('.page');
      if(sheet){ const sr = sheet.getBoundingClientRect(), field = document.querySelector('.field');
        const edge = (document.body.dataset.mode === 'print' && field && field.getBoundingClientRect().bottom < sr.bottom) ? field.getBoundingClientRect().bottom : sr.bottom;
        const g2 = toPt(edge - r.bottom);
        if(g2 < 4) issues.push({slot:'contact-card', kind:'footer-too-close-to-edge', gapPt:+g2.toFixed(1)}); }
      const panel = card.querySelector('.cc-panel');
      if(panel && vis(panel)){
        const pr = panel.getBoundingClientRect(), kids = [...panel.children].filter(vis);
        if(kids.length){
          const bx = kids.map(e => e.getBoundingClientRect());
          // content box: the logo image's drawn box and each office line's text, not their full-width containers
          const parts = [];
          panel.querySelectorAll('img, .cc-office, .cc-lock, .cc-brkname').forEach(e => { if(!vis(e)) return;
            if(e.tagName === 'IMG'){ parts.push(e.getBoundingClientRect()); return; }
            const rg = document.createRange(); rg.selectNodeContents(e); [...rg.getClientRects()].forEach(q => q.width && parts.push(q)); });
          const L = Math.min(...parts.map(q => q.left)), R = Math.max(...parts.map(q => q.right));
          const T = Math.min(...bx.map(q => q.top)), B = Math.max(...bx.map(q => q.bottom));
          const dx = toPt(((L - pr.left) - (pr.right - R)) / 2), dy = toPt(((T - pr.top) - (pr.bottom - B)) / 2);
          if(card.dataset.post !== '1' && (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5)) issues.push({slot:'contact-card', kind:'brokerage-not-centered', dxPt:+dx.toFixed(1), dyPt:+dy.toFixed(1)});
        } }
    });
    return issues;
  };

  // Print checks, read by the renderer: overflow per slot, type under 8 pt (6 pt for fine print),
  // photos under 300 ppi at print size, empty or missing photos.
  RP.check = function(extra){
    const issues = [...(extra||[]), ...RP.fontIssues, ...(window.ContactCard ? ContactCard.check(document) : []), ...RP.footerChecks()];
    // rough-draft preview text and the preview plan never reach a paid or downloaded piece (10/25/2026)
    const PD = RP.data() || {};
    if(PD.preview) issues.push({slot:'copy', kind:'preview-text', detail:'rough-draft preview lines; the writer has not run'});
    if(PD.planPreview && PD.planPreview.length) issues.push({slot:'plan', kind:'preview-plan', detail:'simple preview plan; the redraw has not run'});
    document.querySelectorAll('[data-slot]').forEach(el=>{
      const name = el.dataset.slot, cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize)*72/96;
      const oneLine = cs.whiteSpace === 'nowrap';
      if(oneLine ? el.scrollWidth > el.clientWidth + 1 : el.scrollHeight > el.clientHeight + 1)
        issues.push({slot:name, kind:'overflow', text:el.textContent.slice(0,80)});
      if(size < 8 && !el.dataset.fine) issues.push({slot:name, kind:'type-too-small', size:+size.toFixed(1)});
      if(size < 6) issues.push({slot:name, kind:'fine-print-below-6pt', size:+size.toFixed(1)});
      // fill target (10/21/2026): a text block with data-fill="n" needs at least n lines, and when it stops at
      // exactly n the last line runs at least 75% of the width (owner 10/26: every box filled, last line at least 3/4). Short copy comes back to the writer to be filled out.
      const need = +el.dataset.fill || 0;
      if(need && el.textContent.trim()){
        const rg = document.createRange(); rg.selectNodeContents(el);
        const rows = []; [...rg.getClientRects()].forEach(r=>{ const row = rows.find(x=>Math.abs(x.top - r.top) < 2); if(row) row.right = Math.max(row.right, r.right); else rows.push({top:r.top, left:r.left, right:r.right}); });
        const box = el.getBoundingClientRect(), last = rows[rows.length-1];
        const lastFill = last ? (last.right - box.left) / box.width : 0;
        if(rows.length < need || (rows.length === need && lastFill < 0.75))
          issues.push({slot:name, kind:'underfilled', lines:rows.length, need, lastLine:Math.round(lastFill*100)+'%', detail:`write it out to ${need} full lines`});
      }
    });
    // a brokerage logo never touches text (owner 10/26: the inside-top header logo ran into a long title). The drawn
    // logo (image, or the typeset name) needs 3 pt clear of every line of text outside its own box.
    const pad = 3*96/72, textRects = [];
    document.querySelectorAll('[data-slot]').forEach(el=>{ if(el.closest('.logo') || !el.textContent.trim()) return;
      const rg = document.createRange(); rg.selectNodeContents(el);
      [...rg.getClientRects()].filter(r=>r.width > .5 && r.height > .5).forEach(r=>textRects.push({slot:el.dataset.slot, r})); });
    document.querySelectorAll('.logo img, .logo .text').forEach(lg=>{ if(lg.closest('.card,[data-card]')) return;
      const q = lg.getBoundingClientRect(); if(!q.width) return;
      const hit = textRects.find(({r})=> r.left < q.right + pad && r.right > q.left - pad && r.top < q.bottom + pad && r.bottom > q.top - pad);
      if(hit) issues.push({slot:hit.slot, kind:'logo-touches-text', detail:'the brokerage logo runs into this text'}); });
    // no photo twice in one piece unless the listing is short on photos
    const D = RP.data(), seen = {};
    document.querySelectorAll('.photo[data-photo]').forEach(el=>{ const id = el.dataset.photo; if(id) seen[id] = (seen[id]||0) + 1; });
    if(!D.allowRepeats) Object.entries(seen).filter(([,n])=>n>1).forEach(([id,n])=>issues.push({slot:id, kind:'photo-repeated', times:n}));
    document.querySelectorAll('.photo').forEach(el=>{
      const img = el.querySelector('img');
      if(!img){ issues.push({slot:el.dataset.photo||'photo', kind:'empty-photo-slot'}); return; }
      if(!img.complete || !img.naturalWidth){ issues.push({slot:img.getAttribute('src'), kind:'photo-missing'}); return; }
      const wIn = el.clientWidth/96, hIn = el.clientHeight/96;
      const ppi = Math.min(img.naturalWidth/wIn, img.naturalHeight/hIn);
      if(ppi < 300) issues.push({slot:el.dataset.photo, kind:'photo-under-300ppi', ppi:Math.round(ppi), placedIn:[+wIn.toFixed(2),+hIn.toFixed(2)]});
      // the photo tagger marks full-house shots whose roof is already cut in the original; those never go in a frame
      const meta = (D.photos||{})[el.dataset.photo] || {};
      if(meta.roofCut) issues.push({slot:el.dataset.photo, kind:'roof-cut-in-original', detail:'pick a photo that shows the whole roof, or ask the agent for one'});
      // roofline: a full-house shot is pinned to its top; flag it when the frame is so much wider than the photo
      // that more than a quarter of the height comes off (the house itself, not just ground, would be cut)
      if(el.dataset.box === '0') issues.push({slot:el.dataset.photo, kind:'house-box-cut', detail:'the whole house does not fit this frame'});
      if(el.dataset.fullhouse && !el.dataset.box){
        const fr = el.clientWidth/el.clientHeight, ir = img.naturalWidth/img.naturalHeight;
        const lost = fr > ir ? 1 - ir/fr : 0;
        if(lost > 0.25) issues.push({slot:el.dataset.photo, kind:'full-house-frame-too-wide', heightCropped:Math.round(lost*100)+'%'});
      }
    });
    return issues;
  };

  // Page frame for single-page pieces.
  //   email: the paper field runs edge to edge at trim size
  //   print (flyers): same page size, white margin around the paper field
  //   print (postcards): trim + bleed on every edge, TrimBox set by the renderer
  RP.frame = function(D, trimW, trimH, inner){
    const mode = D.mode || 'email';
    const bleed = (mode==='print' && D.piece.print==='bleed') ? 9 : 0;
    const inset = (mode==='print' && D.piece.print==='margin') ? (D.piece.margin||18) : 0;
    const W = trimW + 2*bleed, H = trimH + 2*bleed;
    document.documentElement.style.setProperty('--inset', inset+'pt');
    return { W, H, bleed, inset,
      html: `<div class="page" data-page="${esc(D.piece.id)}" style="width:${W}pt;height:${H}pt">
        <div class="field" style="left:${inset}pt;top:${inset}pt;right:${inset}pt;bottom:${inset}pt"></div>
        <div class="sheet" style="left:${bleed}pt;top:${bleed}pt;width:${trimW}pt;height:${trimH}pt">${inner}</div>
      </div>` };
  };

  // A rule that runs the full width of the paper field (into the bleed on postcards).
  RP.fullRule = (D, trimW, y) => {
    const mode = D.mode || 'email';
    const bleed = (mode==='print' && D.piece.print==='bleed') ? 9 : 0;
    const inset = (mode==='print' && D.piece.print==='margin') ? (D.piece.margin||18) : 0;
    return `<div class="rule" style="left:${inset-bleed}pt;width:${trimW-2*inset+2*bleed}pt;top:${y}pt"></div>`;
  };

  // Build the page only after the design's fonts are loaded, so every measurement (contact card columns,
  // long addresses, plan labels) uses the real type. The renderer waits for window.brochureCheck.
  // An agent's font picks (brand.fonts: {display, body}, pool ids) are applied first, but only fonts on RP's approved
  // list (fonts.json, built by scripts/approve_fonts.py); anything else keeps the original and is listed in the checks.
  RP.fontBase = '../../fonts/pool/';
  RP.fontIssues = [];
  RP.applyFonts = async function(D, spec){
    const want = (D.brand && D.brand.fonts) || {}, issues = [];
    const roles = {display: ['--font-display', 'Georgia,serif'], body: ['--font-body', 'Helvetica,Arial,sans-serif']};
    for(const role of Object.keys(roles)){
      const o = spec && spec.originals && spec.originals[role], id = want[role];
      if(!id || (o && id === o.id)) continue;
      if(!o || !(o.approved || []).includes(id)){ issues.push({slot:'fonts.'+role, kind:'font-not-approved', detail:id}); continue; }
      const fam = 'iv-' + id, have = (spec.weights && spec.weights[id]) || [400,500,600,700];
      const faces = (o.weightsNeeded || [o.weight]).map(w => {
        const near = have.reduce((a,b) => Math.abs(b-w) < Math.abs(a-w) ? b : a);
        const f = new FontFace(fam, `url(${RP.fontBase}${id}-latin-${near}-normal.woff2)`, {weight:String(w)});
        document.fonts.add(f); return f.load();
      });
      try { await Promise.all(faces); document.documentElement.style.setProperty(roles[role][0], `'${fam}',${roles[role][1]}`); }
      catch(e){ issues.push({slot:'fonts.'+role, kind:'font-load-failed', detail:id}); }
    }
    return issues;
  };

  RP.whenFonts = fn => {
    const D = RP.data();
    const spec = D.fontSpec ? Promise.resolve(D.fontSpec) : fetch('fonts.json').then(r => r.json()).catch(() => null);
    window.brochureReady = spec.then(s => RP.applyFonts(D, s)).then(issues => {
      RP.fontIssues = issues;
      const cs = getComputedStyle(document.documentElement), d = cs.getPropertyValue('--font-display'), b = cs.getPropertyValue('--font-body');
      return Promise.all([`400 10pt ${d}`, `400 10pt ${b}`, `600 10pt ${b}`, `700 10pt ${b}`].map(f => document.fonts.load(f)).concat(RP.cardReady));
    }).then(fn, fn);
  };

  // Logo shape: square and tall logos get a taller box than wide lockups so all shapes read at a similar size.
  // Each piece's CSS sets the box per shape ([data-shape=square|tall]); wide logos keep the default box.
  RP.shapeLogos = () => document.querySelectorAll('.logo img').forEach(img => {
    const set = () => { const r = img.naturalWidth / img.naturalHeight; if(r) img.parentElement.dataset.shape = r < 0.85 ? 'tall' : r < 1.6 ? 'square' : 'wide'; };
    if(img.complete) set(); else img.addEventListener('load', set);
  });

  /* Open house fields for the open house flyers. Everything comes from data: nothing is invented.
       label    Public / Broker / REALTOR(R) Open House (REALTOR(R) only for NAR members, else Broker)
       long     "Saturday, November 7"       weekday "Saturday"   monthDay "November 7"
       month    "November"  monthShort "Nov"  day "7"  (empty when the date isn't an ISO date; long then shows the raw text)
       time     "1:00 to 4:00 pm" (or openHouse.timeText as written)
       note          openHouse.note (special notes: door prize, co-op terms), agent-entered; never an RSVP line (owner
                     10/27/2026): any part of the note that asks for an RSVP is dropped
       refreshments  openHouse.refreshments, agent-entered
       Both lines show only on broker and REALTOR(R) opens and only when filled; a public open house shows date and time only.
       (openHouse.coop from the 10/19 drafts is read as the note when no note is set.)  */
  // no RSVP on any open house flyer (owner 10/27/2026): drop each part of a note (split at · ; | or a sentence end) that asks for one
  RP.noRSVP = s => { s = String(s||'').trim(); const ask = /\brsvp|r\.s\.v\.p|please reply|reply by\b/i; if(!ask.test(s)) return s;
    return s.split(/\s*(?:[·;|•]|(?<=[.!?])\s)\s*/).filter(p => p && !ask.test(p)).join('  ·  ').trim(); };
  RP.openHouse = function(D){
    const O = D.openHouse || {}, A = D.agent || {};
    const kinds = {public:'Public Open House', broker:'Broker Open House', realtor:'REALTOR® Open House'};
    let kind = O.kind in kinds ? O.kind : 'public';
    if(kind==='realtor' && !A.nar) kind = 'broker';
    const r = {kind, label:kinds[kind], long:'', weekday:'', monthDay:'', month:'', monthShort:'', day:'', time:'', note:'', refreshments:''};
    if(kind!=='public'){ r.note = RP.noRSVP(O.note||O.coop||''); r.refreshments = String(O.refreshments||'').trim(); }
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


  /* ------------------------------------------------------------------------------------------------------------
     Room Proportions helpers (rooms, photo frames cut to each room's shape, scale boxes, text fitting)
     ------------------------------------------------------------------------------------------------------------ */
  const PTPX = 96/72;
  RP.pt = px => px*72/96;
  RP.size = s => { const m = /(\d+(?:\.\d+)?)\s*(?:'|ft)?\s*[x×]\s*(\d+(?:\.\d+)?)/i.exec(String(s||'')); return m ? [+m[1], +m[2]] : null; };
  RP.dimsText = (w, d) => `${Math.round(w)}' x ${Math.round(d)}'`;

  // What each listing photo shows, read from its tags (first tag names the room): kind, a priority (lower = bigger and earlier),
  // the room it belongs to in the listing's room list, and the room's width and depth in feet when the listing gives them.
  RP.PRIORITY = {living:0, kitchen:0, dining:0, breakfast:0.5, study:1, entry:1.2, primary:1, pbath:2, bed:3, bath:3.5, closet:4, shower:4, hall:4.5, outdoor:6, front:-1, other:7};
  RP.kindOf = tags => {
    const t = String(tags||'').toLowerCase(), first = t.split(',')[0].trim();
    if(/^(front|street) (exterior|view)|^front exterior|^street view/.test(first)) return 'front';
    if(/primary bath/.test(first)) return 'pbath';
    if(/primary (bedroom|suite)/.test(first)) return 'primary';
    if(/primary (closet|shower)|^closet|^shower/.test(first)) return /shower/.test(first) ? 'shower' : 'closet';
    if(/(first|second|third|fourth) floor bedroom|^bedroom/.test(first)) return 'bed';
    if(/bath|powder/.test(first)) return 'bath';
    if(/living|family|great room/.test(first)) return 'living';
    if(/kitchen/.test(first)) return 'kitchen';
    if(/dining|dry bar/.test(first)) return 'dining';
    if(/breakfast|nook/.test(first)) return 'breakfast';
    if(/study|office/.test(first)) return 'study';
    if(/entry|foyer|front door/.test(first)) return 'entry';
    if(/hall|stair|laundry|utility/.test(first)) return 'hall';
    if(/patio|yard|terrace|balcony|outdoor|garage|pool|deck|side yard|aerial|skyline|court|walk|exterior|rear/.test(first)) return 'outdoor';
    return 'other';
  };
  RP.rooms = D => {
    const L = D.listing || {}, rooms = (L.rooms || []).map(r => Object.assign({sz: RP.size(r.size)}, r));
    const find = (rx, nth) => { const m = rooms.filter(r => rx.test(r.name) && r.sz); return m[Math.min(nth||0, m.length-1)] || null; };
    let bedN = 0; const used = new Set();
    const out = [];
    Object.keys(D.photos || {}).forEach((id, order) => {
      const p = D.photos[id]; if(!p || !p.src || /floor ?plan/i.test(p.tags||'')) return;
      const kind = p.kind || RP.kindOf(p.tags);
      let room = null;
      if(kind === 'living') room = find(/living|family|great/i);
      else if(kind === 'kitchen') room = find(/kitchen/i);
      else if(kind === 'dining') room = find(/dining/i);
      else if(kind === 'breakfast') room = find(/breakfast|nook/i);
      else if(kind === 'study') room = find(/study|office/i);
      else if(kind === 'entry') room = find(/entry|foyer/i);
      else if(kind === 'primary') room = find(/primary (bed|suite)|master (bed|suite)/i);
      else if(kind === 'pbath') room = find(/primary bath|master bath/i);
      else if(kind === 'bed'){ room = find(/^bedroom/i, bedN); bedN++; }
      else if(kind === 'bath') room = find(/^(hall|full)? ?bath/i);
      else if(kind === 'outdoor' && /patio|covered|pergola|terrace/i.test(p.tags || '') && !/side yard/i.test(p.tags || '')) room = find(/covered|patio|porch|deck|terrace/i);
      if(room && used.has(room)) room = null; if(room) used.add(room);
      const pr = RP.PRIORITY[kind] != null ? RP.PRIORITY[kind] : 7;
      out.push({id, kind, order, pr, room, sz: p.room || (room && room.sz) || null, ratio: p.ratio || (room && room.sz ? room.sz[0]/room.sz[1] : null)});
    });
    return out;
  };

  // Frame ratio for a room: its real width over depth (a deeper-than-wide room gets a portrait frame), held to a usable range.
  RP.frameRatio = (item, dflt) => { const r = item.ratio || dflt || 1.33; return Math.max(0.78, Math.min(1.7, r)); };

  // A frame never crops the house: pin to the top for a full-house shot and, when the photo carries the house's box
  // (fractions of the image: x0, y0, x1, y1), slide the visible window so the whole box stays inside it. Run after layout.
  RP.fitFrames = () => document.querySelectorAll('.photo[data-photo] img').forEach(img => {
    const el = img.parentElement, D = RP.data(), p = (D.photos||{})[el.dataset.photo] || {};
    const w = img.naturalWidth, h = img.naturalHeight; if(!w || !h || !el.clientWidth) return;
    const fr = el.clientWidth / el.clientHeight, ir = w / h;
    const box = p.box; if(!box && !p.fullHouse) return;
    let px = p.focusX != null ? p.focusX : 50, py = RP.fullHouse(D, el.dataset.photo) ? 0 : 50;
    if(box){
      const vis = fr > ir ? [1, ir/fr] : [fr/ir, 1];   // visible fraction of the image across and down
      const pos = (lo, hi, v) => { if(v >= 1) return 50; const room = 1 - v; let t = Math.min(room, Math.max(0, (lo + hi)/2 - v/2));
        const fit = t <= lo + 1e-6 && t + v >= hi - 1e-6; return fit ? t/room*100 : null; };
      const gx = pos(box[0], box[2], vis[0]), gy = pos(box[1], box[3], vis[1]);
      if(gx == null || gy == null) el.dataset.box = '0'; else { px = gx; py = gy; el.dataset.box = '1'; }
    }
    img.style.objectPosition = `${px}% ${py}%`;
  });

  // A photo laid out by flex or a fixed frame (not absolutely placed): same markup as RP.photo, positioned by the caller.
  RP.pframe = (D, id, style, cls) =>
    `<div class="photo ${cls||''}" data-photo="${esc(id)}"${RP.fullHouse(D,id)?' data-fullhouse="1"':''} style="${style||''}">${id && RP.src(D,id) ? `<img src="${esc(RP.src(D,id))}" alt="" style="${RP.fit(D,id)}">` : ''}</div>`;

  // Height in pt of a block of html set at width w pt (measured off-screen).
  RP.measure = (html, w) => {
    const m = document.createElement('div'); m.style.cssText = `position:absolute;left:-9999pt;top:0;width:${w}pt;visibility:hidden`; m.innerHTML = html;
    document.body.appendChild(m); const h = m.offsetHeight * 72 / 96; m.remove(); return Math.ceil(h * 100) / 100;
  };
  // lines a block of text sets in
  RP.lineCount = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const tops = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5).map(q => q.top).sort((a,b)=>a-b);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12; let n = 0, last = -1e9;
    for(const t of tops) if(t - last > lh*0.5){ n++; last = t; }
    return n;
  };
  RP.lastFill = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter(q => q.width > .5), box = el.getBoundingClientRect();
    if(!rects.length) return 0;
    const bot = Math.max(...rects.map(q => q.top)); const last = rects.filter(q => Math.abs(q.top - bot) < 3);
    return (Math.max(...last.map(q => q.right)) - box.left) / box.width;
  };
  // the shortest line of the box (every line, set ragged), as a share of the box width: the lines under a photo must all run 80%+ (owner 11/8)
  RP.minLine = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5), box = el.getBoundingClientRect();
    if(!rects.length) return 0;
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12, lines = [];
    for(const q of rects){ const l = lines.find(x => Math.abs(x.top - q.top) < lh*0.5); if(l) l.r = Math.max(l.r, q.right); else lines.push({top: q.top, r: q.right}); }
    return Math.min(...lines.map(l => (l.r - box.left) / box.width));
  };
  // Fill a text box with the writer's master sentences: the longest ordered subset that sets in exactly n lines with the last
  // line at least 3/4 full (the renderer never cuts copy; a box nothing fits comes back to the writer).

  // justified lines whose word gaps would open past ~2.6 spaces set ragged instead (owner 11/10: never spread words)
  const gapsTooWide = el => {
    const box = el.getBoundingClientRect(); if(!box.width) return false;
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12, fs = parseFloat(getComputedStyle(el).fontSize) || 10, rows = [];
    const prev = el.style.textAlign; el.style.textAlign = 'left';
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), rg = document.createRange();
    for(let nd = tw.nextNode(); nd; nd = tw.nextNode()){ const re = /\S+/g; let m; while((m = re.exec(nd.textContent))){ rg.setStart(nd, m.index); rg.setEnd(nd, m.index + m[0].length);
      for(const q of rg.getClientRects()){ if(q.width < .5) continue; const w = rows.find(x => Math.abs(x.t - q.top) < lh*.5); if(w){ w.r = Math.max(w.r, q.right); w.n++; } else rows.push({t: q.top, r: q.right, n: 1}); } } }
    el.style.textAlign = prev;
    if(rows.length < 2) return false;
    // each justified line's own gap (its slack over its own word count) against a normal space: past about 2x, the block sets ragged (owner 11/10 round 2: never wider than the Before)
    // the normal space is measured in the box's own type (the space glyph plus letter and word spacing, as the print check measures it; owner 11/12)
    const cs = getComputedStyle(el), cv = RP._cv || (RP._cv = document.createElement('canvas').getContext('2d'));
    cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const sp = cv.measureText(' ').width + (parseFloat(cs.wordSpacing) || 0) + (parseFloat(cs.letterSpacing) || 0) || fs*0.26;
    return rows.slice(0, -1).some(x => x.n > 1 && (box.right - x.r) / (x.n - 1) + sp > sp*2);
  };
  RP.fillText = (el, sents, n) => {
    sents = sents.filter(Boolean);
    el.style.fontSize = ''; el.style.textAlign = '';
    const base = parseFloat(getComputedStyle(el).fontSize) * 0.75;
    // the type may flex a little (up to 1 pt larger, 0.6 pt smaller, never under 8 pt) so a box lands on a full last line
    const sizes = [0, .15, .3, .45, .6, .75, .9, 1.05, 1.2, -.15, -.3, -.45, -.6].map(d => +(base + d).toFixed(2)).filter(z => z >= 8.0 && z <= base * 1.12 + .01);   // up to 12% larger (owner 11/8)
    // a box marked data-lhguard keeps its type inside its leading (size x guard <= line height), so no line runs past the box
    if(+el.dataset.fixsize){ sizes.length = 0; sizes.push(+el.dataset.fixsize); }   // a row of captions sets at one size (owner 11/12, capfill3 review p18)
    const guard = +el.dataset.lhguard || 0, lhPt = parseFloat(getComputedStyle(el).lineHeight) * 0.75;
    if(guard && lhPt){ const keep = sizes.filter(z => z * guard <= lhPt); sizes.length = 0; sizes.push(...(keep.length ? keep : [Math.max(8, +(lhPt/guard).toFixed(2))])); }
    const subsets = [];
    for(let m = (1 << sents.length) - 1; m > 0; m--) subsets.push(sents.filter((_, i) => m >> i & 1));
    subsets.sort((a, b) => b.join(' ').length - a.join(' ').length);
    let best = null, ok80 = null, ok75 = null;
    // the longest run of sentences first, at any of the sizes (owner 11/10/2026: never drop a sentence a size step would keep)
    for(const s of subsets){
      for(const z of sizes){
        el.style.fontSize = z + 'pt';
        el.textContent = s.join(' ');
        const k = RP.lineCount(el);
        if(k > n) continue;
        const fill = Math.min(RP.lastFill(el), RP.minLine(el));   // every line, not only the last
        if(k === n && fill >= 0.9){ el.style.textAlign = 'justify'; if(gapsTooWide(el)) el.style.textAlign = 'left'; return true; }   // owner 11/8: text under a photo runs the photo's width, last line 90%+ if it can
        if(k === n && fill >= 0.8 && !ok80) ok80 = {s, z};
        if(k === n && fill >= 0.75 && RP.lastFill(el) >= 0.8 && !ok75) ok75 = {s, z};   // the last line always reaches 80% (owner 11/10)
        const score = (k === n ? 1 : 0) * 10 + fill - Math.abs(n - k) * 2 - Math.abs(z - base) * 0.1;
        if(!best || score > best.score) best = {s, score, z};
      }
      if(ok80) break;   // a longer run that sets at 80%+ beats a shorter one at 90%
    }
    if(ok80){ el.style.fontSize = ok80.z + 'pt'; el.textContent = ok80.s.join(' '); el.style.textAlign = 'justify'; if(gapsTooWide(el)) el.style.textAlign = 'left'; return true; }
    if(ok75){ el.style.fontSize = ok75.z + 'pt'; el.textContent = ok75.s.join(' '); return true; }
    if(best){ el.style.fontSize = best.z + 'pt'; el.textContent = best.s.join(' '); }
    return false;
  };
  // The most lines (nMax down to 2) that every caption can fill exactly with its last line 3/4 full, at the width each will have.
  RP.bestN = (pairs, nMax, big) => {
    const probe = document.createElement('div'); probe.className = 'cap' + (big ? ' big' : '');
    const b = document.createElement('div'); b.className = 'b'; probe.appendChild(b);
    probe.style.cssText = 'position:absolute;left:-9999pt;top:0;visibility:hidden'; document.body.appendChild(probe);
    let best = 2;
    for(let n = nMax; n >= 2; n--){ if(pairs.every(q => { probe.style.width = q.w + 'pt'; return RP.fillText(b, q.s, n); })){ best = n; break; } }
    probe.remove(); return best;
  };
  // Try n lines, then fewer down to nMin; the box keeps the count it filled.
  RP.fillBest = (el, sents, nMax, nMin) => {
    for(let n = nMax; n >= (nMin || nMax); n--){
      if(RP.fillText(el, sents, n)){ el.dataset.fill = n; el.dataset.lines = n; if(n < nMax) el.style.height = 'auto'; return true; }
    }
    RP.fillText(el, sents, nMax); return false;
  };
  // no phrase twice on one piece (owner 11/10/2026, rule 7): a sentence that repeats four words in a row already printed on the
  // piece is left out of a box's pool, but only when the box still fills without it (its other true lines)
  RP.fillAll = () => {
    const SW = new Set('a an the and of to in on with at by its it is are or for from this that as up'.split(' '));
    const sh = t => { const w = String(t).toLowerCase().match(/[a-z0-9']+/g) || [], o = []; for(let i = 0; i + 4 <= w.length; i++){ const g = w.slice(i, i + 4); if(g.filter(x => !SW.has(x)).length >= 2) o.push(g.join(' ')); } return o; };
    const seen = new Set();
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.dataset.sents || el.querySelector('[data-slot]')) return; sh(el.textContent).forEach(g => seen.add(g)); });
    document.querySelectorAll('[data-sents]').forEach(el => {
      let s; try { s = JSON.parse(el.dataset.sents); } catch(e){ return; }
      const n = +el.dataset.fill || +el.dataset.lines || 3, mn = +el.dataset.fillmin || n;
      const keep = s.filter(x => !sh([].concat(x)[0]).some(g => seen.has(g)));
      el._pool = s;
      if(keep.length && keep.length < s.length && RP.fillBest(el, keep, n, mn)) el._pool = keep; else RP.fillBest(el, s, n, mn);
      sh(el.textContent).forEach(g => seen.add(g));
    });
    // captions side by side set at one type size (owner 11/12, capfill3 review p18: two sizes in one row): the largest size
    // from the row's own sizes at which every caption of the row still fills its lines, else the row stays as it was
    const rows = new Map(); RP._eq = RP._eq || 0;
    document.querySelectorAll('.cap .b[data-sents]').forEach(el => { const c = el.closest('.cap'); if(!c || !el._pool) return; const par = c.parentElement; if(!par._eqid) par._eqid = ++RP._eq; const k = Math.round(c.offsetTop/3) + '|' + par._eqid; (rows.get(k) || rows.set(k, []).get(k)).push(el); });
    // a size change must not bring a phrase that already prints elsewhere on the piece (or in a neighbor caption) back
    const repeats = g => { const others = new Set(); document.querySelectorAll('[data-slot]').forEach(el => { if(g.includes(el) || el.querySelector('[data-slot]')) return; sh(el.textContent).forEach(x => others.add(x)); });
      const own = new Set(); return g.some(e => sh(e.textContent).some(x => { if(others.has(x) || own.has(x)) return true; return false; }) || (sh(e.textContent).forEach(x => own.add(x)), false)); };
    rows.forEach(g => {
      if(g.length < 2) return;
      const zs = g.map(e => parseFloat(getComputedStyle(e).fontSize)*.75);
      if(Math.max(...zs) - Math.min(...zs) < .06) return;
      const keepState = g.map(e => ({e, z: e.style.fontSize, t: e.textContent, a: e.style.textAlign, h: e.style.height, d: e.dataset.lines}));
      const hi = Math.max(...zs), cands = []; for(let z = hi; z >= 8 - 1e-6; z -= .1) cands.push(+z.toFixed(2));
      for(const z of cands){
        g.forEach(e => { e.dataset.fixsize = z; });
        if(g.every(e => { const n = +e.dataset.fill || +e.dataset.lines || 3; return RP.fillText(e, e._pool, n); }) && !repeats(g)){ g.forEach(e => { e.style.fontSize = z + 'pt'; }); return; } }
      g.forEach(e => { delete e.dataset.fixsize; });
      keepState.forEach(k => { k.e.style.fontSize = k.z; k.e.textContent = k.t; k.e.style.textAlign = k.a; k.e.style.height = k.h; k.e.dataset.lines = k.d; });
    });
    // a row of captions keeps one text setting (reviewer6 p17): if any caption in the row is set ragged, the justified ones set ragged too
    rows.forEach(g => { if(g.length < 2) return; const just = e => /justify/.test(getComputedStyle(e).textAlign);
      if(g.some(e => !just(e)) && g.some(just)) g.forEach(e => { e.style.textAlign = 'left'; e.style.textAlignLast = 'left'; }); });
    // a room name and its size that run past a narrow frame tighten (to 8 pt at least) instead of being cut off
    document.querySelectorAll('.cap .t').forEach(t => { let z = parseFloat(getComputedStyle(t).fontSize)*.75; const i = t.querySelector('i');
      if(t.scrollWidth > t.clientWidth + .5 && i) i.style.marginLeft = '3pt';
      while(t.scrollWidth > t.clientWidth + .5 && z > 8){ z -= .2; t.style.fontSize = z + 'pt'; if(i) i.style.fontSize = z + 'pt'; }
      // still too wide at 8 pt: the size goes on its own line under the name (the caption below moves down one line)
      if(t.scrollWidth > t.clientWidth + .5 && i){ t.style.whiteSpace = 'normal'; t.style.height = 'auto'; i.style.display = 'block'; i.style.marginLeft = '0'; } });
  };

  // The fact bar's values (five at most): beds, baths, living area, built, then lot or stories.
  RP.stats = L => {
    const n = v => Number(v).toLocaleString('en-US'), o = [];
    if(L.beds) o.push(`${L.beds} Bedroom${L.beds == 1 ? '' : 's'}`);
    if(L.baths){ const bt = BD.bathsText(L); o.push(bt.main); if(bt.half) o.push(bt.half); }
    if(L.sqft) o.push(`${n(L.sqft)} Square Feet`);
    if(L.yearBuilt) o.push(`Built in ${L.yearBuilt}`);
    if(o.length < 5){ if(L.lotSize) o.push(L.lotSize); else if(L.stories) o.push(L.stories == 1 ? 'One Story' : `${['','','Two','Three','Four'][L.stories] || L.stories} Stories`); }
    return o.slice(0, 5);
  };

  // Captions placed by the single pieces (flyers, postcard): room name and size, then the writer's sentences filled to n lines.
  RP.T = (D, id) => (((D.copy || {}).rp || {}).text || {})[id] || {t: '', s: []};
  RP.byId = D => Object.fromEntries(RP.rooms(D).map(i => [i.id, i]));
  RP.capH = (n, big) => (big ? 13 : 11.4) + 1.5 + n*(big ? 12.4 : 11.2);
  RP.capAbs = (D, id, x, y, w, n, o) => {
    o = o || {}; const t = RP.T(D, id), it = (o.byId || RP.byId(D))[id], dm = it && it.sz ? RP.dimsText(it.sz[0], it.sz[1]) : '', lh = o.big ? 12.4 : 11.2;
    return `<div class="abs cap${o.big ? ' big' : ''}" style="left:${x}pt;top:${y}pt;width:${w}pt">`
      + `<div class="t" data-slot="cap.${id}.t" data-lines="1">${esc(t.t)}${dm ? `<i${o.stack ? ' style="display:block;margin:0"' : ''}>${esc(dm)}</i>` : ''}</div>`
      + `<div class="b" data-slot="cap.${id}.b" data-lines="${n}" data-fill="${n}" data-sents="${esc(JSON.stringify(t.s))}" style="height:${n*lh}pt"></div></div>`;
  };
  // The sentence a flyer or postcard fills a text box from: the writer's master sentences for the piece.
  RP.sentBox = (slot, x, y, w, n, lh, size, sents, extra) => `<div class="abs body" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*lh + 1.5}pt;font-size:${size}pt;line-height:${lh}pt;${extra||''}" data-slot="${slot}" data-lines="${n}" data-fill="${n}" data-sents="${esc(JSON.stringify(sents))}"></div>`;
  RP.emptyChecks = () => [...document.querySelectorAll('[data-sents]')].filter(el => !el.textContent.trim()).map(el => ({slot: el.dataset.slot, kind: 'empty-slot'}));

  // Scale boxes: rooms drawn true to scale with their sizes, labels above each box. ft per inch picked so the row fits.
  // Returns {html, ftPerIn, count, w, h}. Box list: living rooms first, then the primary, the bedrooms, then outdoor rooms.
  RP.scaleBoxes = (D, W, H, maxN, rows, fixed) => {
    // rows 2: the same rooms at one scale in two rows (a tall strip), so the boxes print larger
    if(rows === 2){
      const n = RP.scaleBoxes(D, W, 84, maxN).count; if(n < 4) return RP.scaleBoxes(D, W, H, maxN);
      for(const fpi of [6, 8, 10, 12, 16, 20, 24, 30, 36, 48]){
        const s = 72 / fpi, half = Math.ceil(n/2);
        const a = RP.scaleBoxes(D, W, H/2, n, 0, {fpi, skip: 0, take: half}), b = RP.scaleBoxes(D, W, H/2, n, 0, {fpi, skip: half, take: n - half});
        if(a.count === half && b.count === n - half)
          return {html: `<div class="abs" style="left:0;top:0;width:${W}pt;height:${H/2}pt">${a.html}</div><div class="abs" style="left:0;top:${H/2}pt;width:${W}pt;height:${H/2}pt">${b.html}</div>`, ftPerIn: fpi, count: n, w: Math.max(a.w, b.w), h: H, scale: s};
      }
      return RP.scaleBoxes(D, W, H, maxN);
    }
    const fix = fixed || null;
    const L = D.listing || {}, rooms = (L.rooms || []).map(r => Object.assign({sz: RP.size(r.size)}, r)).filter(r => r.sz && !/bath|closet|utility|laundry|hall|entry/i.test(r.name));
    const rank = r => /living|family|great/i.test(r.name) ? 0 : /primary|master/i.test(r.name) ? 1 : /kitchen/i.test(r.name) ? 2 : /dining/i.test(r.name) ? 3 : /^bed/i.test(r.name) ? 4 : /study|office|flex/i.test(r.name) ? 5 : /breakfast|nook/i.test(r.name) ? 6 : 8;
    const lab = r => r.name.replace(/^Living$/i, 'Living Room').replace(/^Breakfast$/i, 'Breakfast Nook').replace(/^Covered Structure$/i, 'Covered Structure');
    let bedN = 1;
    let list = rooms.map((r, i) => {
      let name = lab(r); if(/^bedroom$/i.test(r.name)){ bedN++; name = 'Bedroom ' + bedN; }
      return {name, w: r.sz[0], d: r.sz[1], out: /covered|patio|porch|deck|terrace/i.test(r.name), i, rk: rank(r)};
    }).sort((a, b) => a.rk - b.rk || a.i - b.i).slice(0, maxN || 7);
    list = list.sort((a, b) => b.w*b.d - a.w*a.d);
    if(fix) list = list.slice(fix.skip, fix.skip + fix.take);
    const est = (t, w) => t.length * w * 0.52;
    for(const fpi of fix ? [fix.fpi] : [8, 10, 12, 16, 20, 24, 30, 36, 48]){
      const s = 72 / fpi, gap = 16;
      for(let n = list.length; n >= (fix ? list.length : Math.min(3, list.length)); n--){
        const sub = list.slice(0, n), it = sub.map(r => ({r, bw: r.w*s, bh: r.d*s, lw: Math.max(est(r.name, 8.2), est(RP.dimsText(r.w, r.d), 8.2)) + 2}));
        const tot = it.reduce((a, x) => a + Math.max(x.bw, x.lw), 0) + gap*(n - 1), tall = Math.max(...it.map(x => x.bh)) + 22;
        if(tot <= W && tall <= H){
          const g2 = n > 1 ? Math.min(46, gap + (W - tot) / (n - 1)) : gap, tot2 = tot - gap*(n - 1) + g2*(n - 1);
          let x = Math.max(0, (W - tot2) / 2), html = '', rects = '';
          const baseY = H;   // boxes sit on a common baseline at the bottom of the area
          // the boxes are a drawing (one SVG, the room outlines to scale); each label sits over its own box
          const hatch = `<pattern id="sbh" patternUnits="userSpaceOnUse" width="3.4" height="3.4" patternTransform="rotate(45)"><rect width="3.4" height="3.4" fill="#fff"/><rect width=".6" height="3.4" fill="rgba(22,37,43,.14)"/></pattern>`;
          it.forEach(q => {
            const cw = Math.max(q.bw, q.lw);
            const by = baseY - q.bh;
            html += `<div class="sbl" style="left:${x}pt;top:${by - 21}pt;width:${cw}pt;height:19.2pt" data-slot="scale.${esc(q.r.name)}">${esc(q.r.name)}<span>${esc(RP.dimsText(q.r.w, q.r.d))}</span></div>`;
            const fill = q.r.out ? 'url(#sbh)' : (q.r.name.startsWith('Primary') ? 'color-mix(in srgb, var(--accent) 14%, #fff)' : 'rgba(255,255,255,.7)');
            rects += `<rect x="${(x + .45).toFixed(2)}" y="${(by + .45).toFixed(2)}" width="${(q.bw - .9).toFixed(2)}" height="${(q.bh - .9).toFixed(2)}" style="fill:${fill};stroke:var(--ink);stroke-width:.9"/>`;
            x += cw + g2;
          });
          html = `<svg class="sbsvg" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0;width:${W}pt;height:${H}pt;overflow:visible"><defs>${hatch}</defs>${rects}</svg>` + html;
          return {html, ftPerIn: fpi, count: n, w: tot, h: tall, scale: s};
        }
      }
    }
    return {html: '', ftPerIn: 0, count: 0, w: 0, h: 0, scale: 0};
  };

  window.RP = RP;
})();

/* Bath wording (owner 11/1/2026; templates/_shared/baths.js): load it here for every page of this design; a ½ in text is set small. */
(function(){ if(!window.BD || !BD.bathPair) document.write('<script src="../engine/baths.js"><\/script><script src="../engine/baths-text.js"><\/script>'); })();
