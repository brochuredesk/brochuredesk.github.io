/* Outside First: helpers for the single-page pieces (Open House flyers and the four postcard layouts).
   Loads after outside-first.js and builds on it (OF.data, OF.photo, OF.cap, OF.check, the contact card loader).
   Lengths are pt (1/72 in). Nothing here shrinks type to make text fit: paragraphs choose the sentences that
   fill their box, and a long address steps down only as far as its floor. */
(function(){
  const OFC = {};
  const esc = OF.esc;
  const PX = 96 / 72;

  // ---------- page frame ----------
  // email: the cream field runs edge to edge at trim size. print flyers: a white margin around the field.
  // print postcards: trim plus 0.125 in bleed on every edge (TrimBox set by the renderer).
  OFC.metrics = D => {
    const mode = D.mode || 'email', pc = D.piece || {};
    return {bleed: (mode === 'print' && pc.print === 'bleed') ? 9 : 0, inset: (mode === 'print' && pc.print === 'margin') ? (pc.margin || 18) : 0};
  };
  OFC.frame = (D, W, H, inner) => {
    const m = OFC.metrics(D), PW = W + 2*m.bleed, PH = H + 2*m.bleed;
    window.pieceSize = {W: PW, H: PH, bleed: m.bleed};
    return `<div class="page" data-page="${esc((D.piece||{}).id)}" style="width:${PW}pt;height:${PH}pt;margin:0;background:${m.inset ? '#fff' : 'var(--paper)'}">` +
      `<div class="abs" style="left:${m.inset}pt;top:${m.inset}pt;right:${m.inset}pt;bottom:${m.inset}pt;background:var(--paper)"></div>` +
      `<div class="abs sheet" style="left:${m.bleed}pt;top:${m.bleed}pt;width:${W}pt;height:${H}pt">${inner}</div></div>`;
  };

  // ---------- open house fields (nothing invented: all from data.openHouse) ----------
  OFC.noRSVP = s => { s = String(s||'').trim(); const ask = /\brsvp|r\.s\.v\.p|please reply|reply by\b/i; if(!ask.test(s)) return s;
    return s.split(/\s*(?:[·;|•]|(?<=[.!?])\s)\s*/).filter(p => p && !ask.test(p)).join('  ·  ').trim(); };
  OFC.openHouse = D => {
    const O = D.openHouse || {}, A = D.agent || {};
    const kinds = {public: 'Public Open House', broker: 'Broker Open House', realtor: 'REALTOR® Open House'};
    let kind = O.kind in kinds ? O.kind : 'public';
    if(kind === 'realtor' && !A.nar) kind = 'broker';
    const r = {kind, label: kinds[kind], long: '', weekday: '', monthDay: '', month: '', day: '', time: '', note: '', refreshments: ''};
    if(kind !== 'public'){ r.note = OFC.noRSVP(O.note || O.coop || ''); r.refreshments = String(O.refreshments || '').trim(); }
    const dt = /^\d{4}-\d{2}-\d{2}$/.test(O.date || '') ? new Date(O.date + 'T12:00:00') : null;
    if(dt && !isNaN(dt)){
      const f = o => dt.toLocaleDateString('en-US', o);
      r.weekday = f({weekday: 'long'}); r.month = f({month: 'long'}); r.day = f({day: 'numeric'}); r.monthDay = `${r.month} ${r.day}`; r.long = `${r.weekday}, ${r.monthDay}`;
    } else if(O.date){ r.long = String(O.date); }
    const t12 = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); if(!m) return null; let H = +m[1]; const M = +m[2]; const ap = H >= 12 ? 'pm' : 'am'; H = H % 12 || 12; return {txt: M ? `${H}:${String(M).padStart(2, '0')}` : `${H}:00`, ap}; };
    const a = t12(O.start), z = t12(O.end);
    if(O.timeText) r.time = String(O.timeText);
    else if(a && z) r.time = a.ap === z.ap ? `${a.txt} to ${z.txt} ${z.ap}` : `${a.txt} ${a.ap} to ${z.txt} ${z.ap}`;
    else if(a) r.time = `${a.txt} ${a.ap}`;
    return r;
  };

  // ---------- place and facts ----------
  const ST = {alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',connecticut:'CT',delaware:'DE',florida:'FL',georgia:'GA',
    hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',
    michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV','new hampshire':'NH','new jersey':'NJ',
    'new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA',
    'rhode island':'RI','south carolina':'SC','south dakota':'SD',tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA',
    'west virginia':'WV',wisconsin:'WI',wyoming:'WY'};
  OFC.cityST = L => [L.city, ST[String(L.state || '').trim().toLowerCase()] || L.state].filter(Boolean).join(', ');
  OFC.placeZip = L => [OFC.cityST(L), L.zip].filter(Boolean).join(' ');
  const num = v => Number(v).toLocaleString('en-US');
  OFC.factsLine = L => {
    const f = [];
    if(L.beds) f.push(`${L.beds} Bedroom${L.beds == 1 ? '' : 's'}`);
    if(L.baths){ const bt = BD.bathsText(L); f.push(bt.main); if(bt.half) f.push(bt.half); }
    if(L.sqft) f.push(`${num(L.sqft)} Square Feet`);
    return f.join('  ·  ');
  };
  // rows for the postcard front's key-facts table: [label, value]
  OFC.specRows = L => {
    const r = [];
    if(L.beds) r.push(['Bedrooms', String(L.beds)]);
    if(L.baths) BD.bathCells(L).forEach(c => r.push([c[1], c[0]]));
    if(L.sqft) r.push(['Living area', `${num(L.sqft)} sq ft`]);
    const lot = String(L.lotSize || '').replace(/\s*lot$/i, '').replace(/Sq Ft/i, 'sq ft');
    if(lot && r.length < 5) r.push(['Lot', lot]);
    else if(+L.stories > 1 && r.length < 5) r.push(['Stories', String(L.stories)]);
    return r.slice(0, 4);
  };
  OFC.short = L => String(L.address || '').replace(/\s+(street|st\.?|avenue|ave\.?|drive|dr\.?|road|rd\.?|lane|ln\.?|boulevard|blvd\.?|court|ct\.?|way|place|pl\.?)$/i, '');

  // ---------- measuring ----------
  // lines a text sets in at width w with the given inline font styling
  OFC.linesFor = (style, text, w, lh) => {
    const m = document.createElement('div');
    m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;height:auto;white-space:normal;overflow:visible;${style}`;
    m.textContent = text; document.body.appendChild(m);
    const n = Math.max(1, Math.round(m.getBoundingClientRect().height / PX / lh)); m.remove(); return n;
  };
  // the optional event lines: each wraps (never shrinks) and reports its line count
  OFC.eventLines = (lines, x, y, w, lh, gap, align) => {
    let h = '', at = y;
    lines.filter(l => l[0]).forEach(([text, slot, cls]) => {
      const st = cls === 'strong' ? `font:700 11.5pt/${lh}pt var(--font-body);letter-spacing:.2pt` : `font:600 11.5pt/${lh}pt var(--font-body);letter-spacing:.2pt`;
      const n = OFC.linesFor(st, text, w, lh);
      h += `<div class="abs ev-line ${cls}" style="left:${x}pt;top:${at}pt;width:${w}pt;height:${n*lh}pt;text-align:${align || 'center'};white-space:normal;${st.replace('letter-spacing:.2pt', '')}" data-slot="${slot}" data-lines="${n}">${esc(text)}</div>`;
      at += n*lh + (gap || 0);
    });
    return {html: h, h: at > y ? at - y - (gap || 0) : 0};
  };

  // ---------- paragraphs that fill their box ----------
  // beats: sentences (true, in reading order); the first is kept. Any beat may be an array of alternatives (short, long).
  // The fit picks the combination that sets in exactly n lines with the last line at least 77% full.
  const pending = [];
  OFC.para = (slot, beats, x, y, w, n, fs, lh, style) => {
    pending.push({slot, beats});
    return `<div class="abs body" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*lh}pt;font-size:${fs}pt;line-height:${lh}pt;${style || ''}" data-slot="${slot}" data-lines="${n}" data-cap="1" data-nmin="${n}" data-nmax="${n}"></div>`;
  };
  OFC.cap = (c, slot, x, y, w, n, beats) => {
    pending.push({slot: slot + '.text', beats: beats || c.text, min: c.__min || 0});
    return `<div class="cap abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${12 + n*11}pt">
      <div class="nm" data-slot="${slot}.name" data-lines="1"><b style="font-weight:700">${esc(c.name)}</b>${c.tag ? `<span>${esc(c.tag)}</span>` : ''}</div>
      <div class="tx" data-slot="${slot}.text" data-lines="${n}" data-cap="1" data-nmin="${n}" data-nmax="${n}" style="height:${n*11}pt"></div></div>`;
  };
  // every line of the box (set ragged) as a share of the box width: text under a photo runs the photo's width (owner 11/8/2026)
  OFC.minLine = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5), box = el.getBoundingClientRect();
    if(!rects.length) return 0;
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12, lines = [];
    for(const q of rects){ const l = lines.find(x => Math.abs(x.top - q.top) < lh*0.5); if(l) l.r = Math.max(l.r, q.right); else lines.push({top: q.top, r: q.right}); }
    return Math.min(...lines.map(l => (l.r - box.left) / box.width));
  };
  // the search: every combination of the optional beats at n lines; best = every line 80-100% full (the last 90% when it can)
  const search = (el, beats, n, min) => {
    const lo = 0.8, O = [].concat(beats).map((b, i) => { const v = [].concat(b); return i === 0 ? v : [null, ...v]; });
    const idx = O.map(() => 0); let best = null, near = null; const seen = [];
    for(;;){
      const t = idx.map((k, i) => O[i][k]).filter(Boolean).join(' ');
      el.textContent = t; const [k, fill0] = OF.lineFill(el), fill = Math.min(fill0, OFC.minLine(el)); seen.push([t.length, k, fill]);
      if(k === n && t.length >= (min || 0)){
        if(fill >= lo && fill <= 1){ const sc = fill - 0.3*Math.abs(fill - 0.9) + 0.0005*t.length; if(!best || sc > best.sc) best = {t, sc, fill}; }
        if(!near || fill > near.fill) near = {t, fill};
      }
      let j = O.length - 1; while(j >= 0 && ++idx[j] === O[j].length){ idx[j] = 0; j--; } if(j < 0) break;
    }
    return {best, near, seen, O};
  };
  // which of the candidate line counts the copy can fill (first in the list that fits wins); measured in a hidden box of the
  // same width and type, so a layout can size its photos to the copy before anything is placed
  OFC.pickN = (beats, w, style, ns, min) => {
    const m = document.createElement('div');
    m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;height:auto;${style}`;
    document.body.appendChild(m); let pick = null;
    for(const n of ns){ if(search(m, beats, n, min).best){ pick = n; break; } }
    m.remove(); return pick;
  };
  OFC.fillAll = () => {
    for(const p of pending){
      const el = document.querySelector(`[data-slot="${p.slot}"]`); if(!el) continue;
      const n = +el.dataset.lines, {best, near, seen, O} = search(el, p.beats, n, p.min);
      // no fit at all: the beats in reading order until the text is at least as long as its own copy (never shorter)
      const inOrder = () => { const t = []; for(const o of O){ const v = o[o.length - 1]; if(v) t.push(v); if(t.join(' ').length >= (p.min || 0) && t.length > 1) break; } return t.join(' '); };
      el.textContent = best ? best.t : near ? near.t : (p.min ? inOrder() : O.map(o => o[0]).join(' '));
      el.style.textAlign = best && !el.dataset.ragged && best.fill >= .88 ? 'justify' : '';   // justified only when the lines are near full already (owner 11/10: no wide gaps)   // data-ragged: a short note keeps its word spacing (owner 11/10: no wide gaps)
      if(!best){ el.dataset.nofit = '1';
        const multi = seen.filter(x => x[1] > 1), cpl = multi.reduce((a, x) => a + x[0] / (x[1] - 1 + x[2]), 0) / Math.max(1, multi.length);
        el.dataset.diag = `n=${n} cpl~${Math.round(cpl)} want ${Math.round(cpl*(n - 1 + .8))}-${Math.round(cpl*n*.98)} chars; have ` + [...new Set(seen.filter(x => x[1] >= n - 1 && x[1] <= n + 1).map(x => x[0] + '/' + x[1] + '/' + x[2].toFixed(2)))].sort((a, b) => parseInt(a) - parseInt(b)).join(' '); }
    }
    pending.length = 0;
  };
  // an address steps down to its floor (never below), then the check reports an overflow
  OFC.fitWidth = (sel, floor) => document.querySelectorAll(sel).forEach(el => {
    let s = parseFloat(getComputedStyle(el).fontSize) * 72 / 96;
    while(el.scrollWidth > el.clientWidth + .5 && s > floor){ s -= .5; el.style.fontSize = s + 'pt'; }
  });

  // ---------- photos ----------
  // a photo with a house box (data.photos[id].box = [x0, y0, x1, y1], fractions of the photo) is checked: the whole box stays in frame
  OFC.photo = (D, id, x, y, w, h, extra) => OF.photo(D, id, x, y, w, h, extra);
  OFC.houseIssues = D => {
    const out = [];
    document.querySelectorAll('.ph[data-photo]').forEach(el => {
      const id = el.dataset.photo, p = (D.photos || {})[id] || {}, img = el.querySelector('img');
      if(!p.box || !img || !img.naturalWidth) return;
      const w = el.clientWidth, h = el.clientHeight, nw = img.naturalWidth, nh = img.naturalHeight, s = Math.max(w/nw, h/nh), dw = nw*s, dh = nh*s;
      const pos = (img.style.objectPosition || '50% 50%').split(/\s+/).map(v => parseFloat(v) / 100), ox = (w - dw)*pos[0], oy = (h - dh)*(pos[1] == null ? .5 : pos[1]);
      const vis = [-ox/dw, -oy/dh, (-ox + w)/dw, (-oy + h)/dh], b = p.box, t = .004;
      if(b[0] < vis[0] - t || b[1] < vis[1] - t || b[2] > vis[2] + t || b[3] > vis[3] + t)
        out.push({slot: id, kind: 'house-cropped', detail: `the whole house must stay in frame; visible ${vis.map(v => v.toFixed(2)).join(',')} vs house ${b.join(',')}`});
    });
    return out;
  };

  // ---------- contact card ----------
  OFC.headshot = D => { const A = D.agent || {}; return (D.photos || {})[A.headshot] ? D.photos[A.headshot].src : (A.headshot || ''); };
  OFC.card = (D, box, opts) => ContactCard.html(box, Object.assign({}, D.agent || {}, {headshot: OFC.headshot(D)}), D.brand || {}, Object.assign({bottomGap: .5}, opts || {}));

  // ---------- print checks ----------
  // everything in OF.check, plus: one brokerage logo on each page, the house in frame, a paragraph that found no fit
  OFC.check = (D, extra) => {
    // owner 10/29: a last line within 2 points of the 75% target (73% and up) is not flagged
    const issues = OF.check(D, extra).filter(i => !(i.kind === 'last-line-short' && i.pct >= 73));
    document.querySelectorAll('.page').forEach(pg => {
      const k = [...pg.querySelectorAll('.logo img, .logo [data-slot="broker.name"], .cc-logo img, .cc-brkname')].filter(e => e.offsetParent).length;
      const want = OFC.logoWant == null ? 1 : OFC.logoWant;   // the flyer front carries no logo (owner 11/10/2026)
      if(k !== want) issues.push({slot: 'logo', kind: 'logo-count', found: k, want});
    });
    issues.push(...OFC.houseIssues(D));
    document.querySelectorAll('[data-nofit]').forEach(el => issues.push({slot: el.dataset.slot, kind: 'copy-does-not-fit', detail: el.dataset.diag || 'no combination fits'}));
    return issues;
  };

  // ---------- boot ----------
  OFC.boot = async (D, build) => {
    if(!D.listing){ document.getElementById('pages').innerHTML = '<p style="padding:20pt">No data injected.</p>'; return; }
    await OF.cardReady;
    if((D.brand || {}).accent) document.documentElement.style.setProperty('--accent', D.brand.accent);
    await Promise.all(['700 10pt', '400 10pt', '600 10pt'].flatMap(w => [document.fonts.load(`${w} 'Space Grotesk'`), document.fonts.load(`${w} 'Source Sans 3'`)]));
    const r = build();
    if(r.logos != null) OFC.logoWant = r.logos;
    document.getElementById('pages').innerHTML = r.html;
    await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(res => { i.onload = i.onerror = res; })));
    OF.fitLogos();
    if(r.after) r.after();
    OFC.fillAll();
    ContactCard.fit(document);
    window.brochureCheck = () => OFC.check(D, r.issues || []);
  };

  window.OFC = OFC;
})();

/* Bath wording (owner 11/1/2026; templates/_shared/baths.js): load it here for every page of this design; a ½ in text is set small. */
(function(){ if(!window.BD || !BD.bathPair) document.write('<script src="../engine/baths.js"><\/script><script src="../engine/baths-text.js"><\/script>'); })();
