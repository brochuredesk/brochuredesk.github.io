/* Built-In Details: single-page helpers for the Open House flyer and the Just Listed / Just Sold postcards.
   Load after built-ins.js. Same helpers the Neighborhood Atlas uses for its single pages (open house event, whole-house photo
   fitting, the contact card box, the single-page print checks), plus growText: a paragraph box under 10 pt grows back while it fits. */
(function(){
  const AT = window.AT, esc = AT.esc, pt = AT.pt;
  const n = v => Number(v).toLocaleString('en-US');

  // ================= single pieces: Open House flyers and postcards =================
  // (the Open House flyer standard and the postcard sizes; see templates/_shared/ohstandard.js and docs/context/product.md)
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
  AT.linesNeeded = (cls, text, w, lh) => {
    const m = document.createElement('div');
    m.className = cls; m.textContent = text;
    m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;height:auto;white-space:normal;overflow:visible`;
    document.body.appendChild(m); const k = Math.max(1, Math.round(m.scrollHeight*72/96/lh)); m.remove(); return k;
  };
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
    AT.applyBrand(D.brand);
    let spec = D.fontSpec;
    if(!spec){ try { spec = await fetch('fonts.json').then(r => r.json()); } catch(e) { spec = null; } }
    const iss = await AT.applyFonts(D, spec);
    await AT.cardReady;
    return iss;
  };
  AT.settle = () => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  // a text box set smaller than 10 pt steps its type back up (half a point at a time) while the paragraph keeps its line count
  // and stays inside the box; the cap is 10 pt (12 pt when o.max says so)
  AT.growText = (el, o) => { o = o || {}; const cap = o.max || 10; let s = parseFloat(getComputedStyle(el).fontSize)*72/96;
    const lh0 = parseFloat(getComputedStyle(el).lineHeight)*72/96, ratio = lh0/s, k0 = AT.lines(el);
    while(s + .5 <= cap + .01){
      const prev = [el.style.fontSize, el.style.lineHeight];
      el.style.fontSize = (s + .5) + 'pt'; el.style.lineHeight = ((s + .5)*ratio) + 'pt';
      const over = o.fixedLines ? AT.lines(el) !== k0 : (el.scrollHeight > el.clientHeight + 1 || AT.lines(el) > k0 + (o.extra || 0));
      if(over || el.scrollWidth > el.clientWidth + 1){ el.style.fontSize = prev[0]; el.style.lineHeight = prev[1]; break; }
      s += .5; }
    return s; };
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
