/* Rooms and Their Connections: single-page helpers (Open House flyer, Just Listed and Just Sold postcards). Loads after connections.js.
   The fold-over never loads this file. Lengths are pt. Everything comes from the data; nothing is invented. */
(function(){
  const CN = window.CN, esc = CN.esc, pt = px => px*72/96;
  CN.setupCards = async function(D){
    const b = D.brand || {};
    if(b.accent) document.documentElement.style.setProperty('--field', b.accent);
    await Promise.all(['500 10pt "Cormorant Garamond"','600 10pt "Cormorant Garamond"','700 10pt "Cormorant Garamond"','400 10pt Karla','500 10pt Karla','600 10pt Karla','700 10pt Karla'].map(f => document.fonts.load(f)));
    if(!window.ContactCard) await new Promise(res => { const s = document.createElement('script'); s.src = '../engine/agentcard.js'; s.onload = s.onerror = res; document.head.appendChild(s); });
  };
  CN.settle = () => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  const ST = {alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',connecticut:'CT',delaware:'DE','district of columbia':'DC',florida:'FL',georgia:'GA',hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD',tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA','west virginia':'WV',wisconsin:'WI',wyoming:'WY'};
  CN.cityST = L => [L.city, ST[String(L.state||'').trim().toLowerCase()] || L.state].filter(Boolean).join(', ');
  CN.placeZip = L => [CN.cityST(L), L.zip].filter(Boolean).join(' ');

  // the page: print postcards add 0.125 in bleed; print flyers keep a white 0.25 in margin; the slate field fills what is left
  CN.frame = function(D, trimW, trimH, inner){
    const mode = D.mode || 'email', P = D.piece || {};
    const bleed = (mode === 'print' && P.print === 'bleed') ? 9 : 0;
    const inset = (mode === 'print' && P.print === 'margin') ? (P.margin || 18) : 0;
    const W = trimW + 2*bleed, H = trimH + 2*bleed;
    return {W, H, bleed, inset, html: `<div class="page spage" data-page="${esc(P.id||'')}" style="width:${W}pt;height:${H}pt;background:${inset ? '#fff' : 'var(--field)'}">
      <div class="field" style="left:${inset}pt;top:${inset}pt;right:${inset}pt;bottom:${inset}pt"></div>
      <div class="sheet" style="left:${bleed}pt;top:${bleed}pt;width:${trimW}pt;height:${trimH}pt">${inner}</div></div>`};
  };

  // ---------- the event ----------
  CN.noRSVP = s => { s = String(s||'').trim(); const ask = /\brsvp|r\.s\.v\.p|please reply|reply by\b/i; if(!ask.test(s)) return s;
    return s.split(/\s*(?:[·;|•]|(?<=[.!?])\s)\s*/).filter(p => p && !ask.test(p)).join('  ·  ').trim(); };
  CN.openHouse = function(D){
    const O = D.openHouse || {}, A = D.agent || {};
    const kinds = {public:'Public Open House', broker:'Broker Open House', realtor:'REALTOR® Open House'};
    let kind = O.kind in kinds ? O.kind : 'public';
    if(kind === 'realtor' && !A.nar) kind = 'broker';
    const r = {kind, label:kinds[kind], long:'', weekday:'', monthDay:'', time:'', note:'', refreshments:''};
    if(kind !== 'public'){ r.note = CN.noRSVP(O.note || O.coop || ''); r.refreshments = String(O.refreshments || '').trim(); }
    const dt = /^\d{4}-\d{2}-\d{2}$/.test(O.date||'') ? new Date(O.date + 'T12:00:00') : null;
    if(dt && !isNaN(dt)){
      const f = o => dt.toLocaleDateString('en-US', o);
      r.weekday = f({weekday:'long'}); r.monthDay = `${f({month:'long'})} ${f({day:'numeric'})}`; r.long = `${r.weekday}, ${r.monthDay}`;
    } else if(O.date){ r.long = String(O.date); }
    const t12 = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s||''); if(!m) return null; let H = +m[1]; const M = +m[2]; const ap = H >= 12 ? 'pm' : 'am'; H = H % 12 || 12; return {txt: M ? `${H}:${String(M).padStart(2,'0')}` : `${H}:00`, ap}; };
    const a = t12(O.start), z = t12(O.end);
    if(O.timeText) r.time = String(O.timeText);
    else if(a && z) r.time = a.ap === z.ap ? `${a.txt} to ${z.txt} ${z.ap}` : `${a.txt} ${a.ap} to ${z.txt} ${z.ap}`;
    else if(a) r.time = `${a.txt} ${a.ap}`;
    return r;
  };
  // broker / REALTOR(R) lines wrap (never shrink): measure what each needs, stack them at x, y, w
  CN.hpt = (cls, text, w) => {
    const m = document.createElement('div');
    m.className = cls; m.textContent = text;
    m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;height:auto;overflow:visible`;
    document.body.appendChild(m); const h = pt(m.getBoundingClientRect().height); m.remove(); return h;
  };
  CN.eventLines = (lines, x, y, w, gap) => {
    let html = '', at = y;
    lines.filter(l => l[0]).forEach(([text, slot, cls]) => {
      const h = Math.ceil(CN.hpt(cls, text, w) * 2) / 2, lh = cls === 'oh-refresh' ? 13.5 : 13.5;
      html += `<div class="abs ${cls}" style="left:${x}pt;top:${at}pt;width:${w}pt;height:${h}pt" data-slot="${slot}" data-lines="${Math.max(1, Math.round((h - (cls === 'oh-refresh' ? 8 : 0)) / lh))}">${esc(text)}</div>`;
      at += h + gap;
    });
    return {html, h: at > y ? at - y - gap : 0};
  };

  // ---------- photos: the whole house stays in frame ----------
  CN.fullHouse = (D, id) => { const p = (D.photos||{})[id] || {}; return p.fullHouse != null ? !!p.fullHouse : /\b(front|rear|back|side) exterior\b|\bfull house\b/i.test(p.tags||''); };
  CN.fitHouse = function(D){
    const issues = [];
    document.querySelectorAll('.ph').forEach(el => {
      const img = el.querySelector('img'), id = el.dataset.photo, p = (D.photos||{})[id] || {};
      if(!img || !p.w || !p.h) return;
      const cw = el.clientWidth, ch = el.clientHeight, s = Math.max(cw/p.w, ch/p.h);
      const vx = Math.min(1, cw/(p.w*s)), vy = Math.min(1, ch/(p.h*s));
      const fx = (p.focusX != null ? p.focusX : 50)/100, fy = (p.focusY != null ? p.focusY : 50)/100;
      let ox = fx, oy = fy; const b = p.box;
      if(b){ ox = (b[0]+b[2])/2; oy = (b[1]+b[3])/2; }
      else if(CN.fullHouse(D, id)){ oy = vy/2; }
      const x0 = Math.min(1-vx, Math.max(0, ox - vx/2)), y0 = Math.min(1-vy, Math.max(0, oy - vy/2));
      img.style.objectPosition = `${vx < 1 ? x0/(1-vx)*100 : 50}% ${vy < 1 ? y0/(1-vy)*100 : 50}%`;
      const tol = 0.004;
      if(b){ if(b[0] < x0 - tol || b[2] > x0 + vx + tol || b[1] < y0 - tol || b[3] > y0 + vy + tol)
        issues.push({slot: el.dataset.slotPhoto || id, kind:'house-cut-off', detail:`the frame shows ${Math.round(vx*100)} x ${Math.round(vy*100)}% of the photo and the house needs ${Math.round((b[2]-b[0])*100)} x ${Math.round((b[3]-b[1])*100)}%`}); }
      else if(CN.fullHouse(D, id) && vy < 0.75) issues.push({slot: el.dataset.slotPhoto || id, kind:'full-house-frame-too-wide', detail:`only ${Math.round(vy*100)}% of the photo's height shows`});
    });
    return issues;
  };

  // ---------- checks ----------
  CN.repeatChecks = () => { const seen = {}, out = [];
    document.querySelectorAll('.ph[data-photo]').forEach(el => { const id = el.dataset.photo; if(id) seen[id] = (seen[id]||0) + 1; });
    Object.entries(seen).filter(([,k]) => k > 1).forEach(([id,k]) => out.push({slot:id, kind:'photo-repeated', times:k}));
    return out; };
  CN.logoTextChecks = () => { const out = [], pad = 3*96/72, rects = [];
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.closest('.logo,.cc') || !el.textContent.trim()) return;
      const rg = document.createRange(); rg.selectNodeContents(el);
      [...rg.getClientRects()].filter(r => r.width > .5 && r.height > .5).forEach(r => rects.push({slot:el.dataset.slot, r})); });
    document.querySelectorAll('.cc img:not(.cc-hs)').forEach(lg => { const q = lg.getBoundingClientRect(); if(!q.width) return;
      const hit = rects.find(({r}) => r.left < q.right + pad && r.right > q.left - pad && r.top < q.bottom + pad && r.bottom > q.top - pad);
      if(hit) out.push({slot:hit.slot, kind:'logo-touches-text'}); });
    return out; };
  CN.bannedChecks = () => { const out = [], banned = /\b(virtually staged|staged)\b|\bqr\b|photo\s*#?\d|\bprice\b|\bmaster\b/i;
    document.querySelectorAll('[data-slot]').forEach(el => { if(el.closest('.cc')) return; const t = el.textContent; if(banned.test(t)) out.push({slot: el.dataset.slot, kind:'banned-word', text: t.trim().slice(0,60)}); });
    return out; };
  CN.checkSingle = (D, extra) => CN.check(D, [...(extra||[]), ...CN.repeatChecks(), ...CN.logoTextChecks(), ...CN.bannedChecks()]);

  // ---------- the contact card ----------
  CN.cardBox = function(D, box, o){
    const A = D.agent || {}, b = D.brand || {}, hs = CN.src(D, A.headshot) || (/^(file|https?|data):/.test(A.headshot || '') ? A.headshot : '');
    return ContactCard.html(box, Object.assign({}, A, {headshot: hs}), Object.assign({}, b, {logo: b.logoOnDark || b.logo}), Object.assign({bottomGap: 0.5, fieldAccent: true}, o||{}));
  };
  CN.fitLine = (el, lo) => { let s = parseFloat(getComputedStyle(el).fontSize)*72/96; while(el.scrollWidth > el.clientWidth + 0.5 && s > lo){ s -= 0.5; el.style.fontSize = s + 'pt'; } };
  CN.fitLines = (el, maxLines, lo) => { let s = parseFloat(getComputedStyle(el).fontSize)*72/96; while((CN.lines(el).n > maxLines || el.scrollWidth > el.clientWidth + .5) && s > lo){ s -= .5; el.style.fontSize = s + 'pt'; } };
  // the rooms strung on a sand line: items [{n, d}] -> html (h: vertical list when v)
  CN.pathHTML = (items, slot, x, y, w, h, v) => `<div class="path${v ? ' v' : ''}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt">${items.map((p, i) =>
    `<div class="nd"><div class="nn" data-slot="${slot}${i}.n" data-lines="1">${esc(p.n)}</div><div class="nz" data-slot="${slot}${i}.d" data-lines="1"${p.d ? '' : ' data-optional="1"'}>${esc(p.d || '')}</div></div>`).join('')}</div>`;
})();
