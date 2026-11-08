/* templates/_shared/setpage.js: the shared base under each set's OWN email and social pages (owner 11/2/2026, Full Lineup
   review Q2: "give each set its own social and email layouts in its flyer's style"; the shared socialset.js / ohemail.js
   layout made every set look the same). Copied from templates/fx-extras/fxpage.js (the FX extras, owner 11/1/2026,
   worktree fx-oh-socials-b4c882), names generalized (FXP -> SP); behavior the same, plus three small additions marked
   "added 11/2" (SP.adapt, SP.roomName, the layout helpers at the end). Each set draws its own layouts
   (templates/<set>/<set>-email.html, <set>-social.html); this file only loads the data, the fonts and the checks, and
   holds the rules every page shares. No AI: every word comes from the listing data and the package's existing copy.

   What a page is asked to draw (D.piece):
     email                       D.piece.kind 'email': 450 pt wide (600 px, rendered at 2x), as tall as the design needs
     Open House social           D.piece.kind 'oh-social', D.piece.shape post | story | square | pin | wide | gbp | slide
     Just Listed / Just Sold     D.piece.moment 'jl' | 'js', same shapes
   SP.kind(D) -> 'email' | 'oh' | 'jl' | 'js'.  Socials are laid out in pt at K = 0.375 pt per image pixel.

   Carousels (owner 11/1, every Just Listed, Just Sold and Open House social): the post is the cover, then one slide per
   listing photo for Just Listed and Open House (up to Instagram's 20 images), each with about two lines on that room from
   the package's copy (SP.caption); Just Sold: two photos only, each with "Just Sold" and a short line from the Just Sold
   copy (SP.soldLine). D.piece.photo is the slide's photo. window.SocialSlides(D, moment) gives the renderer the list.

   Phone sizes: SP.floor(shape) gives the smallest type in pt for each role on that shape (the text-small-phone check,
   templates/_shared/readsize.js): event (date, time, label, moment word, address), body, small, fine. Mark text with
   data-slot (oh.label, oh.date, oh.time, oh.refreshments, oh.note, address, place, moment, ...) and small print with
   data-small or data-fine so the checks read it right.

     SP.start(fonts, build)   build(D) -> {W, H, html}  (html is the whole .page div)
   Copy: a package with D.companion (the real pipeline) is read as it is; the lineup samples carry their copy as
   D.copy.pc instead, and SP.adapt (added 11/2) builds the same D.companion shape from it, so every page reads one way.

   HOW A SET PAGE IS BUILT: see the how-to at the top of scripts/lineup/own_socials.py. */
(function(){
  const esc = s => Ivory.esc(s);
  const SP = {K: .375};
  SP.kind = D => (D.piece || {}).kind === 'email' ? 'email' : (D.piece || {}).kind === 'oh-social' ? 'oh' : (D.piece || {}).moment || 'jl';
  SP.shape = D => SP.kind(D) === 'email' ? 'email' : D.piece.shape;
  SP.size = D => SP.kind(D) === 'email' ? {W: 450, H: 0} : {W: D.piece.px[0]*SP.K, H: D.piece.px[1]*SP.K};

  // the smallest type (pt) per role, from the phone floors (16 / 12 / 10 / 8 screen px) and how wide each shape shows
  SP.floor = shape => {
    if(shape === 'email') return {event: 20, body: 15, small: 12.5, fine: 10};
    const px = {post: 1080, slide: 1080, story: 1080, square: 1080, pin: 1000, wide: 1600, gbp: 1200}[shape] || 1080;
    const f = px/({wide: 330, gbp: 360}[shape] || 393)*SP.K*1.03, r = v => Math.ceil(v*f*2)/2;
    return {event: r(16), body: r(12), small: r(10), fine: r(8)};
  };

  // condition claims stay off socials and emails (as socialset.js)
  // added 11/2 (copy sweep): vague time and distance ("minutes from", "short drive", "close by", "nearby") with no number, and the banned list from the flyer brief.
  // A sentence that carries one is never used by SP.sentences, SP.allSentences (so SP.lead, SP.pool and caption fallbacks), SP.caption or SP.soldLine.
  SP.VAGUE = /\b(minutes (away|from)|a few minutes|few minutes|short (drive|walk|ride)|close by|nearby|steps away|moments away|within easy reach|natural light|daylight|brighten(s|ed)?|set the tone|abundant|year-round comfort|ways to unwind|adds privacy|space to entertain|generous|spacious|boasts?|nestled|perfect for|soaring|glows?|carry through the space)\b/i;
  SP.CONDITION = /\b(flood|flooded|flooding|foundation|repair|repaired|as[- ]is|inspect|damage|leak|mold|termite|never\s+\w+ed\b|rebuil|structural|settl)/i;

  // about two lines on a room, from the package's own copy: the photo's caption, then the room line if it adds something
  SP.caption = (D, id) => {
    const C = D.companion || {}, J = C.justListed || {}, R = (C.roomLines || {})[id] || {}, P = (D.photos || {})[id] || {};
    const parts = [(J.captions || {})[id], R.long || R.short].filter(Boolean).map(t => String(t).trim().replace(/\.?$/, '.'));
    const out = [];
    parts.forEach(t => { if(!SP.CONDITION.test(t) && !out.some(o => o.toLowerCase().slice(0, 20) === t.toLowerCase().slice(0, 20))) out.push(t); });
    return out.length ? out : [SP.roomName(D, id)].filter(Boolean);   // added 11/2: no copy for that photo, the room's own name (listing data), capitalized
  };
  // the room's name, for a small tag where a design wants one
  SP.room = (D, id) => String(((D.photos || {})[id] || {}).room || ((D.photos || {})[id] || {}).tags || '').split(',')[0];

  // Just Sold: the short "let me help you" line, from the Just Sold copy (no new wording)
  SP.soldLine = D => {
    const S = (D.companion || {}).justSold || {};
    return {head: S.ctaHead || 'Thinking about selling?', line: S.ctaNext || S.ctaShort || ''};
  };

  // the carousel after the post: every listing photo but the cover's (Just Listed, Open House), or two (Just Sold)
  SP.slides = (D, moment) => {
    const hero = OHL.hero(D, 'straight'), ids = OHL.photos(D);
    if(moment === 'js') return [hero, ids.find(id => id !== hero && !Ivory.fullHouse(D, id))].filter(Boolean);
    return ids.filter(id => id !== hero).slice(0, 19);
  };
  window.SocialSlides = (D, moment) => SP.slides(D, moment);

  // measuring text as drawn (letter-spacing and capitals count), in pt
  SP.width = (t, css) => { const m = document.createElement('span'); m.style.cssText = `position:absolute;left:-9999pt;visibility:hidden;white-space:nowrap;${css}`; m.textContent = t; document.body.appendChild(m); const w = m.getBoundingClientRect().width*.75; m.remove(); return w; };
  SP.lines = (t, css, w) => { const m = document.createElement('div'); m.style.cssText = `position:absolute;left:-9999pt;visibility:hidden;width:${w}pt;${css}`; m.textContent = t; document.body.appendChild(m);
    const r = document.createRange(); r.selectNodeContents(m); const tops = new Set([...r.getClientRects()].filter(q => q.width > .5).map(q => Math.round(q.top))); m.remove(); return tops.size; };
  // the largest size from max down to min at which t fits w on one line (css without font-size)
  SP.fitSize = (t, css, w, max, min) => { let s = max; while(s > min && SP.width(t, `${css};font-size:${s}pt`) > w) s -= .5; return s; };

  SP.start = (fonts, build) => {
    const D = SP.adapt(Ivory.data()); window.__spShape = (D.piece || {}).kind === 'email' ? 'email' : (D.piece || {}).shape;
    if(!D.listing){ document.getElementById('pages').innerHTML = '<p style="padding:20pt">No data injected.</p>'; return; }
    D.listing.neighborhood = '';
    OHL.useData(D); window.__spPool = SP.sentences(D);
    window.brochureReady = Promise.all([...fonts.map(f => document.fonts.load(f).catch(() => 0)), OHL.cardReady]).catch(() => {}).then(() => {
      OHL.applyBrand(D);
      const f = build(D);
      document.getElementById('pages').innerHTML = f.html;
      // words with a hyphen never break at it ("Co-op" read as "Co-/op" on the reviewers' sheets, 11/2): visible text only.
      // The word goes in a nowrap span, characters unchanged, so the agent's text stays exactly as typed (and copies right)
      const tw = document.createTreeWalker(document.getElementById('pages'), NodeFilter.SHOW_TEXT, {acceptNode: n => /^(STYLE|SCRIPT)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
      const hy = []; for(let n = tw.nextNode(); n; n = tw.nextNode()) if(/\w-\w/.test(n.nodeValue)) hy.push(n);
      hy.forEach(n => {
        const frag = document.createDocumentFragment();
        n.nodeValue.split(/(\S*\w-\w\S*)/).forEach((t, i) => { if(!t) return;
          if(i % 2){ const s = document.createElement('span'); s.style.whiteSpace = 'nowrap'; s.textContent = t; frag.appendChild(s); } else frag.appendChild(document.createTextNode(t)); });
        n.parentNode.replaceChild(frag, n);
      });
      Ivory.shapeLogos();
      OHL.fitAll();
      const imgs = [...document.querySelectorAll('.cc img, .photo img, .logo img')].map(i => i.complete ? 0 : new Promise(r => { i.addEventListener('load', r, {once: true}); i.addEventListener('error', r, {once: true}); }));
      return Promise.all(imgs).then(OHL.cardFonts).then(() => document.fonts.ready).then(() => {
        const card = OHL.fitCards();
        SP.settle();
        if(f.after) f.after();
        window.pieceSize = {W: f.W, H: f.H, bleed: 0};
        window.brochureCheck = () => {
          const out = OHL.check(card.concat(f.issues || []).concat(SP.kind(D) === 'email' && window.OHEmail ? OHEmail.check(D) : []));
          const text = document.querySelector('.page').innerText;
          if(/\$\s?\d/.test(text)) out.push({slot: 'page', kind: 'price', detail: 'a dollar amount is on the graphic'});
          if(/\bphoto\s*#?\s*\d+/i.test(text)) out.push({slot: 'page', kind: 'photo-number', detail: 'a photo number is on the graphic'});
          if(/virtual(ly)?\s+stag/i.test(text)) out.push({slot: 'page', kind: 'staging', detail: '"virtually staged" is on the graphic'});
          if(/\bfor\s+sale\b/i.test(text)) out.push({slot: 'page', kind: 'for-sale', detail: '"For Sale" is on the graphic'});
          if(SP.kind(D) !== 'js' && /\bsold\b/i.test(text)) out.push({slot: 'page', kind: 'sold-on-for-sale', detail: '"Sold" on a for-sale piece'});
          if(SP.kind(D) !== 'email' && SP.CONDITION.test(text)) out.push({slot: 'page', kind: 'condition', detail: 'a condition claim is on the graphic'});
          const b = D.brand || {}, lg = [b.logo, b.logoOnDark, b.logoKnockout].filter(Boolean).map(u => new URL(u, document.baseURI).href);
          if([...document.querySelectorAll('img')].filter(i => lg.includes(i.src)).length > 1) out.push({slot: 'brand.logo', kind: 'logo-count', detail: 'more than one logo'});
          return out;
        };
      });
    });
  };

  // ---- added 11/2 (Full Lineup Q2) ------------------------------------------------------------------------------------
  // a room's name from the photo tags ("family room, tray ceiling" -> "Family Room"), listing data only
  SP.roomName = (D, id) => String(((D.photos || {})[id] || {}).room || ((D.photos || {})[id] || {}).tags || '').split(',')[0].trim()
    .replace(/\b[a-z]/g, c => c.toUpperCase());
  // the lineup samples hold their copy as D.copy.pc (sets8 data); build the D.companion shape every page reads. Nothing is
  // written: sentences, captions and the Just Sold line are the package's own words, split and renamed.
  SP.adapt = D => {
    const pc = (D.copy || {}).pc;
    if(D.companion || !pc) return D;
    const jl = pc.jl || {}, js = pc.js || {}, caps = {}, split = t => String(t || '').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/).filter(Boolean);
    [].concat(jl.back || [], ((pc.oh || {}).b || {}).caps || [], ((pc.oh || {}).a || {}).caps || []).forEach(c => { if(c && c.id && c.a && !caps[c.id]) caps[c.id] = c.a; });
    const master = []; [jl.front11, jl.about11].forEach(t => split(t).forEach(x => { if(!master.includes(x)) master.push(x); }));
    const ss = split(js.call).concat(split(js.cta)), head = ss.find(t => /\?$/.test(t)) || ss[0] || '';   // the question ("Thinking about selling?") leads; the slab line ("Yours could be next.") follows
    D.companion = {postcard: {master}, justListed: {captions: caps},
      justSold: {ctaHead: head, ctaNext: (js.slab || {}).big || ss.find(t => t !== head) || '', ctaShort: ss.find(t => t !== head) || ''},
      fineprint: 'Information deemed reliable but not guaranteed.'};
    return D;
  };
  // line count of a paragraph as it will really wrap here: a word with a hyphen is kept whole (nowrap) exactly as SP.start does to the page
  SP.linesNW = (t, css, w) => { const m = document.createElement('div'); m.style.cssText = `position:absolute;left:-9999pt;visibility:hidden;width:${w}pt;${css}`;
    m.innerHTML = String(t).split(/(\S*\w-\w\S*)/).map((x, i) => i % 2 ? `<span style="white-space:nowrap">${Ivory.esc(x)}</span>` : Ivory.esc(x)).join('');
    document.body.appendChild(m); const r = document.createRange(); r.selectNodeContents(m); const tops = new Set([...r.getClientRects()].filter(q => q.width > .5).map(q => Math.round(q.top))); m.remove(); return tops.size; };
  // settle: measure the paragraphs as they really sit on the page and, when a last line is under 3/4 of the box, narrow the box (keeping its center)
  // a step at a time while the line count does not grow. The measuring helpers above are the first guess; this is the page's own truth.
  SP.settle = () => document.querySelectorAll('[data-slot="listing.body"],[data-slot="slide.caption"],[data-slot="sold.line"],[data-slot="sold.head"]').forEach(el => {
    const ctr = getComputedStyle(el).textAlign === 'center';   // a left-aligned block keeps its left edge when it narrows
    const rows = () => { const r = document.createRange(); r.selectNodeContents(el); const out = [];
      [...r.getClientRects()].filter(q => q.width > .5).forEach(q => { const l = out.find(x => Math.abs(x.top - q.top) < 3); if(l){ l.l = Math.min(l.l, q.left); l.r = Math.max(l.r, q.right); } else out.push({top: q.top, l: q.left, r: q.right}); });
      out.sort((a, b) => a.top - b.top); const last = out[out.length - 1], bw = el.getBoundingClientRect().width; return {n: out.length, fill: last ? (last.r - last.l)/bw : 1}; };
    let m = rows(); const n0 = m.n, w0 = parseFloat(el.style.width), left0 = parseFloat(el.style.left) || 0;
    if(m.fill >= .8 || !w0) return;
    for(let f = .98; f >= .6; f -= .02){ el.style.width = (w0*f) + 'pt'; el.style.left = (left0 + (ctr ? w0*(1 - f)/2 : 0)) + 'pt'; m = rows(); if(m.n === n0 && m.fill >= .8) return; if(m.n > n0) break; }
    el.style.width = w0 + 'pt'; el.style.left = left0 + 'pt';
    // no width does it: try other sizes (never under the shape's body floor), same box, no more lines than it was drawn for
    const fs0 = parseFloat(getComputedStyle(el).fontSize)*.75, fl = SP.floor(window.__spShape || 'post').body;
    const ds = []; for(let d = .25; d <= 6; d += .25) ds.push(d, -d);
    for(const d of ds){ const fs = fs0 + d; if(fs < fl) continue; el.style.fontSize = fs + 'pt'; m = rows(); if(m.n <= n0 && m.fill >= .8) return;
      for(let f = .96; f >= .76; f -= .04){ el.style.width = (w0*f) + 'pt'; el.style.left = (left0 + (ctr ? w0*(1 - f)/2 : 0)) + 'pt'; m = rows(); if(m.n <= n0 && m.fill >= .8) return; }
      el.style.width = w0 + 'pt'; el.style.left = left0 + 'pt'; }
    el.style.fontSize = fs0 + 'pt';
    // last resort for a write-up: fewer of the writer's own sentences (the first always stays), same box
    if(el.dataset.slot === 'listing.body' && window.__spPool){ const cur = el.textContent, pool = window.__spPool;
      for(let k = pool.length; k >= 1; k--){ const t = pool.slice(0, k).join(' '); if(t === cur) continue;
        el.innerHTML = t.split(/(\S*\w-\w\S*)/).map((x, i) => i % 2 ? `<span style="white-space:nowrap">${Ivory.esc(x)}</span>` : Ivory.esc(x)).join(''); m = rows();
        if(m.n <= n0 && m.fill >= .8) return; }
      el.textContent = cur; }
  });
  SP.r1 = v => Math.round(v*2)/2;
  // an absolutely placed one-line text box and a plain rectangle (pt)
  SP.T = (css, txt, x, y, w, h, attrs, cls) => `<div class="t ${cls || ''}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;line-height:${h}pt;${css}" ${attrs || ''}>${txt}</div>`;
  SP.rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css || ''}"></div>`;
  // a whole-house photo's frame: trimmed by its house box; a photo with no house box or no size on file gets a plain frame in
  // its own shape (never blank, never a sliver)
  SP.heroFrame = (D, id, fw, maxH, capTall) => { const r = OHL.fitHero(D, id, fw, maxH, capTall), p = (D.photos || {})[id] || {};
    if(r.w >= fw*.5 || p.house) return r;
    const ar = (p.w && p.h) ? p.w/p.h : 1.5, w = Math.min(fw, maxH*ar); return {w: Math.round(w), h: Math.round(w/ar)}; };
  // a paragraph's line count and how full its last line is (text-align as given in css)
  const PM_ = new Map();
  SP.para = (text, css, w) => { const key = text + '|' + css + '|' + w.toFixed(2); if(PM_.has(key)) return PM_.get(key);
    const m = document.createElement('div'); m.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;white-space:normal;${css}`;
    m.innerHTML = String(text).split(/(\S*\w-\w\S*)/).map((x, i) => i % 2 ? `<span style="white-space:nowrap">${Ivory.esc(x)}</span>` : Ivory.esc(x)).join('');   // hyphenated words stay whole, as SP.start leaves them on the page
    document.body.appendChild(m);
    const r = document.createRange(); r.selectNodeContents(m); const rows = [];
    [...r.getClientRects()].filter(q => q.width > .5).forEach(q => { const l = rows.find(x => Math.abs(x.top - q.top) < 3); if(l){ l.l = Math.min(l.l, q.left); l.r = Math.max(l.r, q.right); } else rows.push({top: q.top, l: q.left, r: q.right}); });
    rows.sort((a, b) => a.top - b.top); const last = rows[rows.length - 1], box = m.getBoundingClientRect().width; m.remove();
    const res = {n: rows.length, fill: last && box ? (last.r - last.l)/box : 0}; PM_.set(key, res); return res; };
  // the fullest paragraph from a pool of sentences (the first always in when `first`, in order): most lines up to maxN, last line
  // at least 3/4 full, narrowing the column a little (to 80%) when no pick fills. Returns {text, n, fill, w}; null when none fits
  SP.fillText = (pool, css, w, maxN, first, minF) => {
    const k = Math.min(pool.length, 6); let best = null;
    for(const f of [1, .96, .92, .88, .84, .8, .76, .72, .68, .64, .6].filter(f => f >= (minF || .8))){
      for(let mask = 1; mask < (1 << k); mask += first ? 2 : 1){
        const pick = pool.filter((_, i) => i < k && mask & (1 << i)), text = pick.join(' '), m = SP.para(text, css, w*f);
        if(m.n > maxN) continue;
        const score = (m.fill >= .8 ? 1000 : 0) + m.n*100 + m.fill*10 + pick.length;
        if(!best || score > best.score) best = {text, n: m.n, fill: m.fill, w: w*f, score};
      }
      if(best && best.fill >= .8) break;
    }
    return best;
  };
  // the write-up sentences for Just Listed and the email: the postcard pool, no condition claims
  SP.sentences = D => { const C = D.companion || {};
    return (((C.postcard || {}).master || []).length ? C.postcard.master : String((C.listing || {}).body || '').split(/(?<=[.!?])\s+(?=[A-Z0-9])/))
      .map(t => String(t).trim()).filter(Boolean).filter(t => !SP.CONDITION.test(t) && !SP.VAGUE.test(t)); };
  // the listing's facts as [label, value (text), key], baths as BD.baths says (a lone half bath is a full-size ½); each only when the listing has it
  SP.facts = D => { const L = D.listing, n = v => Number(v).toLocaleString('en-US'), f = [];
    if(L.beds) f.push(['Bedrooms', String(L.beds), 'bed']);
    if(L.baths){ const b = window.BD && BD.bathNum ? BD.bathNum(L) : {num: String(L.baths), label: 'Full Baths'}; f.push([b.label, b.num, 'bath']); }
    if(L.sqft) f.push(['Square Feet', n(L.sqft), 'area']);
    const yr = L.yearBuilt || L.year; if(yr) f.push(['Built In', String(yr), 'year']);
    return f; };

  // ---- added 11/2, designer and marketing reviews (S1-S4): the lead sentence, slide captions, the Just Sold fact line, title case ------------------
  // S4: title case for captions and labels: short words stay lowercase ("Pergola at Dusk"), the first and last word are always capitalized
  const SMALL = /^(a|an|and|as|at|but|by|for|in|nor|of|on|or|the|to|vs|via|with|per)$/i;
  SP.title = t => { const w = String(t || '').trim().split(/\s+/).filter(Boolean);
    return w.map((x, i) => { const lo = x.toLowerCase(); if(i && i < w.length - 1 && SMALL.test(lo)) return lo; return lo.replace(/(^|[-\/(])([a-z])/g, (m, a, b) => a + b.toUpperCase()); }).join(' '); };
  SP.roomName = (D, id) => SP.title(String(((D.photos || {})[id] || {}).room || ((D.photos || {})[id] || {}).tags || '').split(',')[0]);
  // every sentence of the package's own copy for this listing (listing description, Just Listed, Open House), no repeats
  SP.allSentences = D => { const pc = (D.copy || {}).pc || {}, jl = pc.jl || {}, oh = pc.oh || {}, out = [], split = t => String(t || '').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/).filter(Boolean);
    const C = D.companion || {};
    [(C.postcard || {}).master && C.postcard.master.join(' '), (C.listing || {}).body, jl.front11, jl.about11, (oh.a || {}).text, (oh.b || {}).text, D.listing.description, ...(((oh.a || {}).bullets) || [])].forEach(t => split(t).forEach(x => { if(!out.includes(x) && !SP.VAGUE.test(x)) out.push(x); }));
    return out; };
  // S1: the strongest sentence for a post or email lead, never the facade. Skips sentences about the front (stone, stucco, facade, garage door,
  // "faces the drive"); prefers the outdoor or kitchen draw, then the living level, a ceiling or floor feature, then the location.
  SP.FRONT = /\b(stone|stucco|fa[cç]ade|garage door|faces the|front door|curb|brick front|siding|exterior)\b/i;
  SP.lead = D => {
    const sc = t => { let v = 1;
      if(/\b(deck|pergola|patio|yard|outdoor|pool|porch|garden)\b/i.test(t)) v = 5;
      else if(/\b(kitchen|island|cooktop|range|granite|marble)\b/i.test(t)) v = 4.5;
      else if(/\b(upstairs|living level|family room|dining|open floor|primary suite|game room|stair)\b/i.test(t)) v = 4;
      else if(/\b(ceiling|beams|wood floors|floors|crown molding|windows|fireplace)\b/i.test(t)) v = 3;
      else if(/\b(gated|neighborhood|minutes|near|park|downtown|rice military|heights|bellaire|montrose)\b/i.test(t)) v = 3;
      const n = t.length; return v*10 - (n > 120 ? (n - 120)/3 : 0) - (n < 60 ? 6 : 0); };   // a post's lead is short: about two lines
    const pool = SP.allSentences(D).filter(t => !SP.FRONT.test(t) && !SP.CONDITION.test(t) && !/^\s*(come see|see)\b/i.test(t) && t.length >= 40);
    if(!pool.length) return '';
    return pool.map(t => [sc(t), t]).sort((a, b) => b[0] - a[0])[0][1]; };
  // the write-up pool for a post or email: the lead first, then the rest (no sentence about the front, none repeated)
  SP.pool = D => { const lead = SP.lead(D), rest = SP.sentences(D).filter(t => !SP.FRONT.test(t) && t !== lead); return (lead ? [lead] : []).concat(rest); };
  // S2: a slide caption for any photo. The photo's own copy first; else the sentences of the package's copy that name that room; else the room's
  // own listing tags as a short line. Never nothing, so no slide shows a room name alone.
  const CAP0 = SP.caption;
  SP.caption = (D, id) => {
    const got = CAP0(D, id).filter(t => !SP.VAGUE.test(t)), nm = SP.roomName(D, id), P = (D.photos || {})[id] || {};
    const alone = !got.length || (got.length === 1 && got[0].replace(/\.$/, '').toLowerCase() === nm.toLowerCase()) || (got.length === 1 && got[0] === SP.roomName(D, id));
    if(!alone) return got;
    const room = nm.toLowerCase(), keys = {kitchen: /kitchen|cabinet|counter|range|island/i, 'primary bedroom': /primary (bedroom|suite)|suite/i, 'primary bath': /primary bath|soaking tub|shower/i, bath: /\bbath/i, bedroom: /bedroom/i, 'game room': /game room/i, 'family room': /family room|living/i,
      dining: /dining/i, 'dining area': /dining/i, deck: /\bdeck\b/i, pergola: /pergola/i, entry: /entry|foyer/i, stairs: /stair|balust|tread/i, stair: /stair|balust|tread/i, laundry: /laundry/i, office: /office|study/i, living: /living|family room/i, patio: /patio/i, yard: /yard|fence/i};
    const key = Object.keys(keys).find(k => room.includes(k)), re = key ? keys[key] : room.split(' ').filter(w => w.length > 3)[0] ? new RegExp('\\b' + room.split(' ').filter(w => w.length > 3)[0] + '\\b', 'i') : null;
    let hit = re ? SP.allSentences(D).filter(t => re.test(t) && !SP.CONDITION.test(t) && !SP.VAGUE.test(t)).slice(0, 2) : [];
    // added 11/2 (Round 3): the primary bedroom's slide is about the primary suite, never the first-floor bedroom the keyword also catches
    if(key === 'family room'){ const fr2 = SP.allSentences(D).filter(t => /family room/i.test(t) && !/primary/i.test(t) && !SP.CONDITION.test(t) && !SP.VAGUE.test(t)).slice(0, 2); hit = fr2.length ? fr2 : hit.filter(t => !/primary/i.test(t)); }   // added 11/2 (Round 3): a Family Room slide is never about the primary
    if(key === 'primary bedroom'){ hit = SP.allSentences(D).filter(t => re.test(t) && !/first[- ]floor|downstairs|different floors|apart from/i.test(t) && !SP.CONDITION.test(t) && !SP.VAGUE.test(t)).slice(0, 2);
      if(!hit.length){ const bk = ((((D.copy || {}).pc || {}).jl || {}).back || []).find(e => /^primary( bedroom| suite)?$/i.test(String(e.t || '').trim())); if(bk && bk.a) hit = [String(bk.a).trim()];
        else { const oc = (((((D.copy || {}).pc || {}).oh || {}).b || {}).caps || []).find(e => /primary/i.test(e.q || e.t || e.id || '') && !/bath/i.test(e.q || e.t || e.id || '')); if(oc && oc.a) hit = [String(oc.a).trim()]; } } }
    if(hit.length) return hit;
    const tags = String(P.tags || '').split(',').map(x => x.trim()).filter(Boolean).slice(1);
    const line = tags.length ? tags.join(', ').replace(/^./, c => c.toUpperCase()) + '.' : '';
    return line ? [line] : got; };
  // S3: the Just Sold line is a sold fact: where, what kind of house, its strongest feature, from the listing and the package's own copy.
  // Sales filler ("Yours could be next", "Thinking about selling?", "Call today to schedule a private home consultation", ...) is rejected.
  SP.SOLD_REJECT = /\b(yours could|could be next|next to sell|thinking about selling|thinking of selling|let.?s talk|call (today|or text|me)|private home consultation|schedule|consultation|your home|your house|worth|market)\b/i;
  SP.soldLine = D => {
    const L = D.listing, C = D.companion || {}, S = C.justSold || {};
    const ok = t => t && !SP.SOLD_REJECT.test(t) && !SP.CONDITION.test(t) && !SP.VAGUE.test(t);
    const desc = String(L.description || '').trim().replace(/\.$/, '');
    if(ok(desc)){
      const m = desc.match(/^(.*?)\s+(?:with|and)\s+(.*)$/i);
      if(m && m[1].length >= 12) return {head: m[1].replace(/^./, c => c.toUpperCase()), line: m[2].replace(/^./, c => c.toUpperCase()) + '.'};
      return {head: '', line: desc + '.'};
    }
    const lead = SP.lead(D); if(ok(lead)) return {head: '', line: lead};
    const kind = [L.beds && `${L.beds}-bedroom`, L.stories && `${L.stories}-story`].filter(Boolean).join(', ');
    return {head: kind ? `A ${kind} home in ${L.city || 'Houston'}` : '', line: ''}; };
  // The standard agent contact block (owner 11/2/2026: the same on every piece, never customized per design). One structure:
  // a bar, optional round headshot, agent name, REALTOR(R), CALL / TEXT and phone, then email and web when the shape allows,
  // and the one brokerage logo (right of the text when the block is wide enough, else under it). A set passes only colors and fonts.
  // o: w (pt, required); k (scale, default 1); ink, sub, bar (colors); disp, body, label (CSS font-family stacks);
  //    dw (name weight, default 600); fb, fs (smallest body / small sizes); nameMax (pt at k=1); tone ('light'|'dark'|'knockout' logo);
  //    logoMaxH; barW (default 3); headshot (true: use D.agent.headshot); email, web (true to show); tight; logo:false to omit.
  // Returns {h, w, bad, draw(x, y)}; h includes the logo row when stacked.
  SP.contact = (D, o) => {
    const A = D.agent || {}, r1 = SP.r1, wd = SP.width, fit = SP.fitSize, T = SP.T, esc = Ivory.esc, k = o.k || 1, w = o.w;
    const FB = o.fb || 8, FS = o.fs || 6.5, ink = o.ink || '#111', sub = o.sub || '#555', bar = o.bar || ink, tight = !!o.tight;
    const ncss = `font-weight:${o.dw || 600};font-family:${o.disp || 'inherit'}`, bcss = `font-family:${o.body || 'inherit'}`, lcss = `font-weight:700;font-family:${o.label || o.body || 'inherit'};letter-spacing:.14em;text-transform:uppercase`;
    const barW = o.barW == null ? 3 : o.barW, hsd = o.headshot && A.headshot ? r1(Math.min(w*.2, 54)) : 0;
    const showLogo = o.logo !== false && !!(D.brand || {}).logo, wide = w >= 300;
    const logoW = showLogo ? (wide ? r1(Math.min(w*.3, 120*k)) : r1(Math.min(w*.5, 110*k))) : 0, logoH = showLogo ? r1(Math.min(o.logoMaxH || 44, logoW*.36)) : 0;
    const tx = barW + 8 + (hsd ? hsd + 8 : 0), tw = w - tx - (showLogo && wide ? logoW + 10 : 0);
    const nS = fit(A.name || '', ncss, tw, r1(Math.max(FB*1.45, (o.nameMax || 22)*k)), FB), nH = r1(nS*(tight ? 1.12 : 1.22));
    const nar = A.nar || /realtor/i.test(A.designation || ''), dS = Math.max(FS, r1(10*k)), dH = r1(dS*(tight ? 1.2 : 1.5));
    const lab = (A.phoneLabel || 'Call / Text').toUpperCase(); let pS = r1(Math.max(FB*1.1, 16*k)); const lS = Math.max(FS, r1(9.5*k));
    const one = () => wd(lab, `${lcss};font-size:${lS}pt`) + 8 + wd(A.phone || '', `font-weight:700;${bcss};font-size:${pS}pt`) <= tw;
    while(!one() && pS > FB) pS = r1(pS - .5);
    const stack = !one(), pH = r1(pS*(tight ? 1.15 : 1.3)), lH = r1(lS*(tight ? 1.2 : 1.5));
    const eS = Math.max(FB, r1(9*k)), eH = r1(eS*1.4), em = o.email && A.email ? A.email : '', wb = o.web && A.web ? A.web : '';
    const emOk = em && wd(em, `${bcss};font-weight:500;font-size:${eS}pt`) <= tw, wbOk = wb && wd(wb, `${bcss};font-weight:500;font-size:${eS}pt`) <= tw;
    const ch = nH + (nar ? dH : 0) + (stack ? lH : 0) + pH + (emOk ? eH : 0) + (wbOk ? eH : 0);
    const core = Math.max(ch, hsd) + 6, stackLogo = showLogo && !wide, h = core + (stackLogo ? logoH + 6 : 0);
    return {h, w, bad: wd(A.name || '', `${ncss};font-size:${nS}pt`) > tw || (!!o.strict && wd(A.phone || '', `font-weight:700;${bcss};font-size:${pS}pt`) > tw), draw: (x, y) => {
      let s = barW ? SP.rect(x, y, barW, core, `background:${bar}`) : '';
      if(hsd) s += `<div class="abs" style="left:${x + barW + 8}pt;top:${y + (core - hsd)/2}pt;width:${hsd}pt;height:${hsd}pt;border-radius:50%;overflow:hidden;border:1.5pt solid ${bar}"><img src="${esc(A.headshot)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div>`;
      let yy = y + (core - ch)/2, X = x + tx;
      s += T(`${ncss};font-size:${nS}pt;color:${ink};text-align:left`, esc(A.name || ''), X, yy, tw, nH, 'data-slot="agent.name" data-lines="1"'); yy += nH;
      if(nar){ s += T(`${lcss};font-size:${dS}pt;color:${sub};text-align:left;letter-spacing:.2em`, 'REALTOR®', X, yy, tw, dH, 'data-slot="agent.desig" data-small="1" data-lines="1"'); yy += dH; }
      if(stack){ s += T(`${lcss};font-size:${lS}pt;color:${sub};text-align:left`, esc(lab), X, yy, tw, lH, 'data-small="1"'); yy += lH; }
      s += T(`font-weight:700;${bcss};font-size:${pS}pt;color:${ink};text-align:left`, `${stack ? '' : `<span data-small="1" style="${lcss};font-size:${lS}pt;color:${sub};margin-right:8pt">${esc(lab)}</span>`}${esc(A.phone || '')}`, X, yy, tw, pH, 'data-slot="agent.phone" data-lines="1"'); yy += pH;
      if(emOk){ s += T(`font-weight:500;${bcss};font-size:${eS}pt;color:${ink};text-align:left`, esc(em), X, yy, tw, eH, 'data-slot="agent.email" data-lines="1"'); yy += eH; }
      if(wbOk){ s += T(`font-weight:500;${bcss};font-size:${eS}pt;color:${ink};text-align:left`, esc(wb), X, yy, tw, eH, 'data-slot="agent.web" data-lines="1"'); }
      if(showLogo){ const lx = wide ? x + w - logoW : x + tx, ly = wide ? y + (core - logoH)/2 : y + core + 6;
        s += OHL.logo(D, o.tone || 'light', `left:${lx}pt;top:${ly}pt;width:${logoW}pt;height:${logoH}pt;justify-content:${wide ? 'flex-end' : 'flex-start'}`); }
      return s; }};
  };
  // ---- added 11/2 (Round 3 review, owner 11/2): Just Sold is about the agent. SP.agentPitch(D, budget) -> {head, line, parts}.
  // Every word is the package's own Just Sold copy (copy.pc.js: the proof paragraph, "How I'd start" steps, the meeting paragraph),
  // split into sentences; sales filler ("Yours could be next", "Thinking about selling?", "Call today to schedule ...") is left out and
  // the sold house is named once by the page's own address (never a house fact line). head is the label (How I'd start / When we meet);
  // line is as many of its sentences as fit in `budget` characters (default 150). parts is the whole ordered list for carousel slides.
  SP.PITCH_REJECT = /\b(yours could|could be next|next to sell|thinking about selling|thinking of selling|let.?s (talk|set)|call (today|or text|me)|private home consultation|consultation|worth|market)\b/i;
  SP.agentPitch = (D, budget, slide) => {
    const js = (((D.copy || {}).pc || {}).js) || {}, C = ((D.companion || {}).justSold) || {};
    const clean = t => String(t || '').replace(/\{[a-z]+\|([^}]*)\}/g, '$1').replace(/\s+/g, ' ').trim();
    const split = t => clean(t).split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/).filter(Boolean);
    const ok = t => t && !SP.PITCH_REJECT.test(t) && !SP.CONDITION.test(t) && !SP.VAGUE.test(t);
    const steps = (js.steps9 || js.steps11 || []).map(clean).filter(ok).map(t => t.replace(/[.!?]*$/, '.'));
    const proof = split(js.front9 || js.front11).filter(ok), meet = split(js.meet9 || js.meet11).filter(ok);
    const sets = steps.length >= 2 ? [[js.stepsLabel || "How I'd start", steps], ['', proof], [js.meetLabel || 'When we meet', meet]] : [[js.meetLabel || 'When we meet', meet], ['', proof]];
    const first = sets[slide ? sets.length - 1 : 0], parts = [].concat(...sets.map(s => s[1]));
    const pick = (list, max) => { const out = []; let n = 0; for(const t of list){ if(out.length && n + t.length > max) break; out.push(t); n += t.length + 1; } return out.join(' '); };
    return {head: first[0], line: pick(first[1], budget || 150), parts, group: first[1]}; };
  // ---- added 11/2 (opt-in, used by the Just Sold pages of room-strips, red-line and split-edition): the largest type size (pt, steps of .25)
  // at which a paragraph is one line or its last line is at least 3/4 full. mk(size, lineHeight) -> a CSS font shorthand. null when none fits.
  SP.sizedPara = (text, mk, w, smax, smin, lhk) => {
    if(!text) return {n: 0, s: smax, l: 0, w, fill: 1};
    for(let s = smax; s >= smin; s -= .25){ const l = SP.r1(s*(lhk || 1.3)), m = SP.para(text, mk(s, l), w); if(m.n === 1 || m.fill >= .75) return {n: m.n, s, l, w, fill: m.fill}; }
    return null; };
  // Opt-in (red-line and split-edition Just Sold pages, 11/2): the "How I'd start" steps in one voice, "I'll ..." throughout (the sample copy mixes
  // "Walk your house ..." imperatives with "I'll"). Edits D.copy.pc.js.steps9 / steps11 in place; safe to call twice.
  SP.voiceSteps = D => {
    const js = (((D.copy || {}).pc || {}).js) || {};
    ['steps9', 'steps11'].forEach(k => { if(!js[k]) return;
      js[k] = js[k].map(t => String(t).replace(/\{[a-z]+\|([^}]*)\}/g, '$1').trim().replace(/[.!?]+$/, '')
        .replace(/^(Walk|Pull|Plan|Pick|Explain|Price|Photograph|Go|Choose|Stay|Read|Set|Draw|Print|Bring|Keep|Take|Show|Check|Call)\b/, m => "I'll " + m.toLowerCase())
        .replace(/the sales I pulled( for your own street)?/, 'the recent sales I pull from your street')); }); };
  window.SP = SP;
})();
