/* The Neighborhood Atlas: shared helpers for every piece (data, fonts, photos, captions, small floor plans, the contact card
   and the print checks). The street map lives in atlas-map.js, the full floor plan in atlas-plan.js. */
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
  const listsRooms = l => (l.rooms||[]).length || (l.kind === 'image' && (l.roomNames||[]).length);
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
  // (14 x 13) must pick exactly one. Views ("From the Dining Area", "Kitchen from the Hall") and rooms not on the plan: no match.
  const rkey = s => String(s||'').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\bsuite\b/g, 'bedroom').replace(/\b(dry|wet) bar\b/g, 'bar')
    .replace(/\brooftop\b/g, 'roof').replace(/\bdeck\b/g, 'terrace').replace(/\b(upstairs|downstairs)\b/g, ' ')
    .replace(/\b(the|front|room|area)\b/g, ' ').replace(/\s+/g, ' ').trim();
  const rdims = r => { const m = String(r.dims||'').match(/(\d+)\s*x\s*(\d+)/); return m ? [+m[1], +m[2]] : [Math.round(r.w), Math.round(r.d)]; };
  const touch = (a, b) => { const T = .7, ox = Math.min(a.x+a.w, b.x+b.w) - Math.max(a.x, b.x), oy = Math.min(a.y+a.d, b.y+b.d) - Math.max(a.y, b.y);
    return (Math.abs(a.x+a.w-b.x) < T || Math.abs(b.x+b.w-a.x) < T) && oy > 1.5 || (Math.abs(a.y+a.d-b.y) < T || Math.abs(b.y+b.d-a.y) < T) && ox > 1.5; };
  // The rooms of a floor for matching and tinting: drawn rooms, or for the agent's plan image the boxes (fractions of the image) of the rooms it names
  AT.roomsOf = L => L.kind === 'image' ? (L.roomBoxes||[]).map(b => ({name: b.name, short: b.short, dims: b.dims, x: b.box[0], y: b.box[1], w: b.box[2], d: b.box[3]})) : (L.rooms||[]);
  AT.labeled = L => AT.roomsOf(L).some(r => r.label !== false && r.kind !== 'open');
  AT.matchRoom = (L, title, dims, body) => {
    const rs = AT.roomsOf(L); title = String(title||'');
    const dm = String(dims||'').match(/(\d+)\s*x\s*(\d+)/), want = dm ? [+dm[1], +dm[2]] : null;
    const all = rs.map((r, i) => i), ok = i => rs[i].label !== false;
    const names = i => [rkey(rs[i].name), rs[i].short ? rkey(rs[i].short) : null, /^\w+ bedroom$/.test(rkey(rs[i].name)) ? rkey(rs[i].name).split(' ')[0] : null].filter(Boolean);
    const bySize = (idx, w) => { if(!w) return -1; const f = idx.filter(i => { const d = rdims(rs[i]); return (d[0]===w[0] && d[1]===w[1]) || (d[0]===w[1] && d[1]===w[0]); }); return f.length === 1 ? f[0] : -1; };
    // pass 1: the title names the room
    const core = (t, w) => {
      const pick = idx => { idx = idx.filter(ok); if(idx.length === 1 && !/\d\s*$/.test(t)) return idx[0]; return idx.length ? bySize(idx, w) : -1; };
      const k = rkey(t.replace(/\s+\d+\s*$/, ''));
      const hit = pick(all.filter(i => rkey(rs[i].name) === k || (rs[i].short && rkey(rs[i].short) === k)));
      if(hit >= 0) return hit;
      // a qualified name the plan only has as a plain type ("Primary Bath", "Hall Bath" on a plan of "Bath"s): the size has to pick it
      const type = k.split(' ').pop();
      if(k !== type && w && !all.some(i => rkey(rs[i].name) === k)) return bySize(all.filter(i => ok(i) && rkey(rs[i].name) === type), w);
      return -1;
    };
    // the one room the caption's body names (null if none or several)
    const inBody = () => { const nb = ' ' + rkey(body) + ' '; const h = all.filter(i => ok(i) && names(i).some(n => nb.includes(' ' + n + ' ')));
      return h.length === 1 ? h[0] : -1; };
    const bedrooms = all.filter(i => ok(i) && /bedroom$/.test(rkey(rs[i].name)));
    const owner = q => { q = rkey(q);
      if(/^primary( bedroom)?$/.test(q)) { const p = bedrooms.filter(i => /^primary/.test(rkey(rs[i].name))); return p.length === 1 ? p[0] : -1; }
      if(/^(second|secondary|guest|other)( bedroom)?$/.test(q)) { const o = bedrooms.filter(i => !/^primary/.test(rkey(rs[i].name))); return o.length === 1 ? o[0] : -1; }
      return -1; };
    const adj = (o, type) => all.filter(i => ok(i) && i !== o && rkey(rs[i].name) === type && touch(rs[o], rs[i]));
    const view = /^(.+?)\s+from\b/i.exec(title), view2 = /^(from|under|view)\b/i.test(title);

    let h = -1;
    if(view){ h = core(view[1], null); if(h >= 0) return h; }                       // "Kitchen from the Hall": the Kitchen
    if(!view && !view2){ h = core(title, want); if(h < 0 && /,/.test(title)) h = core(title.split(',')[0], null); if(h >= 0) return h; }
    // pass 2: a view, a detail, or a near-synonym
    if(view || view2){
      h = inBody(); if(h >= 0) return h;                                               // the room the body names
      const m = /^from\s+(?:the\s+)?(.+)$/i.exec(title); if(m){ h = core(m[1], null); if(h >= 0) return h; }   // "From the Dining Area": that room
      return -1;
    }
    const words = title.trim().split(/\s+/), last = words[words.length-1].toLowerCase(), qual = words.slice(0, -1).join(' ').replace(/[\s-]*walk[\s-]*in$/i, '').trim();
    if(/^(shower|tub|vanity|bath)$/.test(last)){                                        // "Primary Shower": that owner's bath
      const o = qual ? owner(qual) : inBody(); if(o < 0) return -1;
      const own = all.filter(i => ok(i) && rkey(rs[i].name) === rkey(qual + ' bath'));
      if(own.length === 1) return own[0];
      const nb = adj(o, 'bath').filter(i => !/^primary/.test(rkey(rs[i].name)) || /^primary/.test(rkey(rs[o].name)));
      return nb.length === 1 ? nb[0] : -1;
    }
    if(last === 'closet'){                                                               // a closet room beside the bedroom, else the bedroom
      let o = qual ? owner(qual) : inBody(); if(o < 0 || !bedrooms.includes(o)) return -1;
      const cl = adj(o, 'closet');
      if(cl.length === 1) return cl[0];
      return all.some(i => rkey(rs[i].name) === 'closet') && cl.length ? -1 : o;
    }
    if(/\b(cooktop|range|island|oven|sink|appliance|pantry|peninsula)\b/i.test(title)){               // kitchen details
      const k = all.filter(i => ok(i) && rkey(rs[i].name) === 'kitchen'); return k.length === 1 ? k[0] : -1;
    }
    return -1;
  };

  // A small plan of one floor, as the listing gives it: room outlines only, no pins or numbers. hi = the index of the room the
  // caption describes: it is tinted in the accent color (owner 10/29); none when it can't be matched or the plan has no room labels.
  AT.miniPlan = (L, W, H, hi) => {
    if(L.kind === 'image'){
      const b = hi != null && hi >= 0 ? (L.roomBoxes||[])[hi] : null, k = Math.min(W/L.w, H/L.h), iw = L.w*k, ih = L.h*k, ox = (W-iw)/2, oy = (H-ih)/2;
      const hl = b ? `<rect x="${(ox + b.box[0]*iw).toFixed(2)}" y="${(oy + b.box[1]*ih).toFixed(2)}" width="${(b.box[2]*iw).toFixed(2)}" height="${(b.box[3]*ih).toFixed(2)}" fill="var(--accent)" fill-opacity=".6" stroke="var(--accent)" stroke-width=".8"/>` : '';
      return `<svg width="${W}pt" height="${H}pt" viewBox="0 0 ${W} ${H}" aria-hidden="true"><image href="${L.src}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid meet"/>${hl}</svg>`;
    }
    const rs = (L.rooms||[]).filter(r => !r.crop || true);
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    rs.forEach(r => { const w = r.crop && r.crop.side==='right' ? Math.min(r.w, r.crop.to) : r.w, d = r.crop && r.crop.side==='bottom' ? Math.min(r.d, r.crop.to) : r.d;
      x0=Math.min(x0,r.x); y0=Math.min(y0,r.y); x1=Math.max(x1,r.x+w); y1=Math.max(y1,r.y+d); });
    const bw = x1-x0, bh = y1-y0, s = Math.min(W/bw, H/bh), w = bw*s, h = bh*s, ox = (W-w)/2, oy = (H-h)/2;
    let g = '';
    rs.forEach(r => {
      const x = ox + (r.x-x0)*s, y = oy + (r.y-y0)*s, rw = r.w*s, rd = r.d*s, out = r.kind === 'outdoor';
      g += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${rw.toFixed(2)}" height="${rd.toFixed(2)}" fill="${out ? 'none' : r.kind==='garage' ? 'rgba(31,58,50,.10)' : 'var(--paper)'}" stroke="var(--ink)" stroke-width="${out ? .4 : .55}"${out ? ' stroke-dasharray="1.4 1"' : ''}/>`;
    });
    if(hi != null && hi >= 0 && rs[hi]){
      const r = rs[hi];
      g += `<rect x="${(ox + (r.x-x0)*s).toFixed(2)}" y="${(oy + (r.y-y0)*s).toFixed(2)}" width="${(r.w*s).toFixed(2)}" height="${(r.d*s).toFixed(2)}" fill="var(--accent)" fill-opacity=".75" stroke="var(--ink)" stroke-width=".8"/>`;
    }
    return `<svg width="${W}pt" height="${H}pt" viewBox="0 0 ${W} ${H}" aria-hidden="true">${g}</svg>`;
  };
  // the small plan's box: wide enough for the plan's shape, never taller than the caption's text beside it
  AT.miniBox = (L, maxW, maxH) => {
    if(L.kind === 'image'){ const a = L.w/L.h, W = Math.min(maxW, maxH*a); return [Math.round(W*10)/10, Math.round(W/a*10)/10]; }
    const rs = L.rooms||[]; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    rs.forEach(r => { x0=Math.min(x0,r.x); y0=Math.min(y0,r.y); x1=Math.max(x1,r.x+r.w); y1=Math.max(y1,r.y+r.d); });
    const a = (x1-x0)/(y1-y0), W = Math.min(maxW, maxH*a), H = W/a;
    return [Math.round(W*10)/10, Math.round(H*10)/10];
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
  AT.card = function(D, box, fine){
    const A = D.agent || {}, hs = AT.src(D, A.headshot) || (/^(file|https?|data):/.test(A.headshot || '') ? A.headshot : '');
    return ContactCard.html(box, Object.assign({}, A, {headshot: hs}), D.brand || {}, {layout:'panel', fine: fine || '', bottomGap: 0.5});
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
    if(window.AtlasPlan) issues.push(...AtlasPlan.check());
    return issues;
  };
  AT.placements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));


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

  // Map Index rows (name, distance) from the listing's map and the copy's index
  AT.mileText = m => { const v = Math.round(m / 1609.34 * 10) / 10; return `${v.toFixed(1)} ${v === 1 ? 'mile' : 'miles'}`; };
  AT.mapIndex = D => {
    const M = D.map || {}, all = [...(M.places||[]), ...(M.far||[])], K = (D.copy||{}).cover || {};
    return (K.index || []).slice(0, 3).map(i => { const p = all.find(q => q.n === i.name); return Object.assign({}, i, {p, miles: p ? AT.mileText(p.m || Math.hypot(p.x, p.y)) : ''}); });
  };
  // the map box: drawn once the page is in the document (call AT.drawMaps after layout). opts.extras: names to label besides the index.
  AT.mapBox = (id, x, y, w, h, extras, nofar, noidx, star) => `<div class="mapbox abs" id="${id}" data-star="${star ? 1 : 0}" data-far="${nofar ? 0 : 1}" data-idx="${noidx ? 0 : 1}" data-extras="${esc(JSON.stringify(extras||[]))}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"></div>`;
  AT.drawMaps = D => {
    const issues = [];
    document.querySelectorAll('.mapbox').forEach(el => {
      const idx = el.dataset.idx === '0' ? [] : AT.mapIndex(D).filter(i => !(el.dataset.far === '0' && i.far));
      issues.push(...AT.drawMap(el, D, {index: idx, mapExtras: JSON.parse(el.dataset.extras || '[]'), star: el.dataset.star === '1', lbl: +el.dataset.lbl || 0, wide: el.dataset.wide === '1'}).map(i => Object.assign(i, {slot: el.id})));
    });
    return issues;
  };
  AT.indexRowsHTML = (D, slot) => AT.mapIndex(D).map((i, k) => `<div class="idx-row">${AT.mapMarker(i.far ? 'far' : i.kind === 'park' ? 'park' : 'place')}<div class="nm" data-slot="${slot}${k}.name" data-lines="1">${esc(i.name)}</div><div class="ds" data-slot="${slot}${k}.dist" data-lines="1">${esc(i.miles)}</div></div>`).join('');

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

  window.AT = AT;
})();

/* Bath wording (owner 11/1/2026; templates/_shared/baths.js): load it here for every page of this design; a ½ in text is set small. */
(function(){ if(!window.BD || !BD.bathPair) document.write('<script src="../engine/baths.js"><\/script><script src="../engine/baths-text.js"><\/script>'); })();
