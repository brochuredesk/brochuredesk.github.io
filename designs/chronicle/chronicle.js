/* Portrait book fold: shared helpers (copied from the Atlas helpers so this set needs nothing from another design) for every piece (data, fonts, photos, captions, small floor plans, the contact card
   and the print checks). */
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
  const rdims = r => { const m = String(r.dims||'').match(/(\d+)['’\"\s]*x\s*(\d+)/); return m ? [+m[1], +m[2]] : [Math.round(r.w), Math.round(r.d)]; };
  const touch = (a, b) => { const T = .7, ox = Math.min(a.x+a.w, b.x+b.w) - Math.max(a.x, b.x), oy = Math.min(a.y+a.d, b.y+b.d) - Math.max(a.y, b.y);
    return (Math.abs(a.x+a.w-b.x) < T || Math.abs(b.x+b.w-a.x) < T) && oy > 1.5 || (Math.abs(a.y+a.d-b.y) < T || Math.abs(b.y+b.d-a.y) < T) && ox > 1.5; };
  AT.matchRoom = (L, title, dims, body) => {
    const rs = L.rooms||[]; title = String(title||'');
    const dm = String(dims||'').match(/(\d+)['’\"\s]*x\s*(\d+)/), want = dm ? [+dm[1], +dm[2]] : null;
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
    if(L.kind === 'image') return `<svg width="${W}pt" height="${H}pt" viewBox="0 0 ${W} ${H}" aria-hidden="true"><image href="${L.src}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid meet"/></svg>`;
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
  AT.places = (D, key) => (((D.copy || {})[key]) || []);

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
