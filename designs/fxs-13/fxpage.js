/* templates/fx-extras/fxpage.js: the shared base under each FX flyer's own email and social pages (owner 11/1/2026, pilot
   review Q2: "every FX gets its own social and email layouts in its flyer's style; the shared layout makes them all look
   the same"). Each FX draws its own layouts (fxNN-email.html, fxNN-social.html); this file only loads the data, the
   fonts and the checks, and holds the rules every page shares. No AI: every word comes from the listing data and the
   package's existing copy.

   What a page is asked to draw (D.piece):
     email                       D.piece.kind 'email': 450 pt wide (600 px, rendered at 2x), as tall as the design needs
     Open House social           D.piece.kind 'oh-social', D.piece.shape post | story | square | pin | wide | gbp | slide
     Just Listed / Just Sold     D.piece.moment 'jl' | 'js', same shapes
   FXP.kind(D) -> 'email' | 'oh' | 'jl' | 'js'.  Socials are laid out in pt at K = 0.375 pt per image pixel.

   Carousels (owner 11/1, every Just Listed, Just Sold and Open House social): the post is the cover, then one slide per
   listing photo for Just Listed and Open House (up to Instagram's 20 images), each with about two lines on that room from
   the package's copy (FXP.caption); Just Sold: two photos only, each with "Just Sold" and a short line from the Just Sold
   copy (FXP.soldLine). D.piece.photo is the slide's photo. window.SocialSlides(D, moment) gives the renderer the list.

   Phone sizes: FXP.floor(shape) gives the smallest type in pt for each role on that shape (the text-small-phone check,
   templates/_shared/readsize.js): event (date, time, label, moment word, address), body, small, fine. Mark text with
   data-slot (oh.label, oh.date, oh.time, oh.refreshments, oh.note, address, place, moment, ...) and small print with
   data-small or data-fine so the checks read it right.

     FXP.start(fonts, build)   build(D) -> {W, H, html}  (html is the whole .page div) */
(function(){
  const esc = s => Ivory.esc(s);
  const FXP = {K: .375};
  FXP.kind = D => (D.piece || {}).kind === 'email' ? 'email' : (D.piece || {}).kind === 'oh-social' ? 'oh' : (D.piece || {}).moment || 'jl';
  FXP.shape = D => FXP.kind(D) === 'email' ? 'email' : D.piece.shape;
  FXP.size = D => FXP.kind(D) === 'email' ? {W: 450, H: 0} : {W: D.piece.px[0]*FXP.K, H: D.piece.px[1]*FXP.K};

  // the smallest type (pt) per role, from the phone floors (16 / 12 / 10 / 8 screen px) and how wide each shape shows
  FXP.floor = shape => {
    if(shape === 'email') return {event: 20, body: 15, small: 12.5, fine: 10};
    const px = {post: 1080, slide: 1080, story: 1080, square: 1080, pin: 1000, wide: 1600, gbp: 1200}[shape] || 1080;
    const f = px/({wide: 330, gbp: 360}[shape] || 393)*FXP.K*1.03, r = v => Math.ceil(v*f*2)/2;
    return {event: r(16), body: r(12), small: r(10), fine: r(8)};
  };

  // condition claims stay off socials and emails (as socialset.js)
  FXP.CONDITION = /\b(flood|flooded|flooding|foundation|repair|repaired|as[- ]is|inspect|damage|leak|mold|termite|never\s+\w+ed\b|rebuil|structural|settl)/i;

  // about two lines on a room, from the package's own copy: the photo's caption, then the room line if it adds something
  FXP.caption = (D, id) => {
    const C = D.companion || {}, J = C.justListed || {}, R = (C.roomLines || {})[id] || {}, P = (D.photos || {})[id] || {};
    const parts = [(J.captions || {})[id], R.long || R.short].filter(Boolean).map(t => String(t).trim().replace(/\.?$/, '.'));
    const out = [];
    parts.forEach(t => { if(!FXP.CONDITION.test(t) && !out.some(o => o.toLowerCase().slice(0, 20) === t.toLowerCase().slice(0, 20))) out.push(t); });
    return out;   // never a photo's tag as copy: no sentence, no slide (review r1)
  };
  // every sentence the package wrote about this photo (its own room notes), the ones about the floor last so no run of slides all opens on the floor
  FXP.carouselCaps = (D, id) => (((D.companion || {}).carousel || {})[id] || []);
  FXP.captionAll = (D, id) => {
    const C = D.companion || {}, J = (C.justListed || {}).captions || {}, R = (C.roomLines || {})[id] || {};
    const raw = [J[id]].concat(R.all || [R.long || R.short]).filter(Boolean).map(t => String(t).trim().replace(/\.?$/, '.'));
    const out = []; raw.forEach(t => { if(!FXP.CONDITION.test(t) && !out.some(o => o.toLowerCase().slice(0, 20) === t.toLowerCase().slice(0, 20))) out.push(t); });
    const fl = t => /\bfloors?\b/i.test(t) ? 1 : 0;
    return out.map((t, i) => [fl(t), i, t]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
  };
  // the same photo twice in one piece, or the same room or view under another number
  FXP.fam = id => { id = String(id).replace(/(\d)[a-z]$/, '$1'); return /^(deck|pergola|patio|fence|evening)\d*$/.test(id) ? 'outdoor' : /^(front)\d*$/.test(id) ? 'front' : /^(primary|game|terrace|gazebo)\d*$/.test(id) ? id.replace(/\d+$/, '') : id; };
  FXP.dupCheck = D => {
    const bySrc = {}; Object.entries(D.photos || {}).forEach(([id, p]) => { if(p.src) bySrc[p.src] = id; });
    const seen = new Map(), out = [];
    document.querySelectorAll('.page .photo img').forEach(img => {
      const src = img.getAttribute('src'), id = bySrc[src] || Object.keys(bySrc).map(k => k.endsWith(src) || src.endsWith(k) ? bySrc[k] : null).find(Boolean); if(!id) return;
      const key = FXP.fam(id), prev = seen.get(key);
      if(prev === id) out.push({slot: id, kind: 'duplicate-photo', detail: `${id} is in the piece twice`});
      else if(prev) out.push({slot: id, kind: 'near-duplicate-photo', detail: `${id} and ${prev} show the same room or view in one piece`});
      seen.set(key, id);
    });
    return out;
  };
  // the room's name, for a small tag where a design wants one
  FXP.room = (D, id) => String(((D.photos || {})[id] || {}).room || ((D.photos || {})[id] || {}).tags || '').split(',')[0];

  // Just Sold: the short "let me help you" line, from the Just Sold copy (no new wording)
  FXP.soldLine = D => {
    const S = (D.companion || {}).justSold || {};
    return {head: S.ctaHead || 'Thinking about selling?', line: S.ctaNext || S.ctaShort || ''};
  };

  // the carousel after the post: every listing photo but the cover's (Just Listed, Open House), or two (Just Sold)
  FXP.slides = (D, moment) => {
    const hero = OHL.hero(D, 'straight'), ids = OHL.photos(D);
    const score = id => { const p = D.photos[id] || {}; const k = /^(family|living|great|open)/.test(id) ? 3 : /^(dining|primary)(?!.*bath)/.test(id) ? 2 : /kitchen|bar|bath|stair|foyer|entry/.test(id) ? 0 : 1; return k*10 + (p.w && p.h ? Math.min(p.w/p.h, 1.6) : 1); };
    if(moment === 'js') return [hero, ids.filter(id => id !== hero && !Ivory.fullHouse(D, id)).sort((a, b) => score(b) - score(a))[0]].filter(Boolean);
    // Just Listed and Open House: every room with real copy about it (never a bare tag), then the closing slide on the house
    const rooms = ids.filter(id => id !== hero && !Ivory.fullHouse(D, id) && FXP.carouselCaps(D, id).length);
    return rooms.slice(0, 18).concat(['@close']);
  };
  window.SocialSlides = (D, moment) => FXP.slides(D, moment);

  // measuring text as drawn (letter-spacing and capitals count), in pt
  FXP.width = (t, css) => { const m = document.createElement('span'); m.style.cssText = `position:absolute;left:-9999pt;visibility:hidden;white-space:nowrap;${css}`; m.textContent = t; document.body.appendChild(m); const w = m.getBoundingClientRect().width*.75; m.remove(); return w; };
  FXP.lines = (t, css, w) => { const m = document.createElement('div'); m.style.cssText = `position:absolute;left:-9999pt;visibility:hidden;width:${w}pt;${css}`; m.textContent = t; document.body.appendChild(m);
    const r = document.createRange(); r.selectNodeContents(m); const tops = new Set([...r.getClientRects()].filter(q => q.width > .5).map(q => Math.round(q.top))); m.remove(); return tops.size; };
  // the largest size from max down to min at which t fits w on one line (css without font-size)
  FXP.fitSize = (t, css, w, max, min) => { let s = max; while(s > min && FXP.width(t, `${css};font-size:${s}pt`) > w) s -= .5; return s; };

  FXP.start = (fonts, build) => {
    const D = Ivory.data();
    if(!D.listing){ document.getElementById('pages').innerHTML = '<p style="padding:20pt">No data injected.</p>'; return; }
    D.listing.neighborhood = '';
    OHL.useData(D);
    window.brochureReady = Promise.all([...fonts.map(f => document.fonts.load(f).catch(() => 0)), OHL.cardReady]).catch(() => {}).then(() => {
      OHL.applyBrand(D);
      const f = build(D);
      document.getElementById('pages').innerHTML = f.html;
      // words with a hyphen never break at it ("Co-op" read as "Co-/op" on the reviewers' sheets, 11/2): visible text only.
      // The word goes in a nowrap span, characters unchanged, so the agent's text stays exactly as typed (and copies right)
      const tw = document.createTreeWalker(document.getElementById('pages'), NodeFilter.SHOW_TEXT, {acceptNode: n => /^(STYLE|SCRIPT)$/.test(n.parentNode.nodeName) || (n.parentNode.closest && n.parentNode.closest('[data-slot="caption"], [data-slot="cta"]')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
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
        if(f.after) f.after();
        window.pieceSize = {W: f.W, H: f.H, bleed: 0};
        window.brochureCheck = () => {
          const out = OHL.check(card.concat(f.issues || []).concat(FXP.kind(D) === 'email' && window.OHEmail ? OHEmail.check(D) : []));
          out.push(...FXP.dupCheck(D));   // the same photo (or room or view) twice in one piece, review r3
          const text = document.querySelector('.page').innerText;
          if(/\$\s?\d/.test(text)) out.push({slot: 'page', kind: 'price', detail: 'a dollar amount is on the graphic'});
          if(/\bphoto\s*#?\s*\d+/i.test(text)) out.push({slot: 'page', kind: 'photo-number', detail: 'a photo number is on the graphic'});
          if(/virtual(ly)?\s+stag/i.test(text)) out.push({slot: 'page', kind: 'staging', detail: '"virtually staged" is on the graphic'});
          if(/\bfor\s+sale\b/i.test(text)) out.push({slot: 'page', kind: 'for-sale', detail: '"For Sale" is on the graphic'});
          if(FXP.kind(D) !== 'js' && /\bsold\b/i.test(text)) out.push({slot: 'page', kind: 'sold-on-for-sale', detail: '"Sold" on a for-sale piece'});
          if(FXP.kind(D) !== 'email' && FXP.CONDITION.test(text)) out.push({slot: 'page', kind: 'condition', detail: 'a condition claim is on the graphic'});
          const b = D.brand || {}, lg = [b.logo, b.logoOnDark, b.logoKnockout].filter(Boolean).map(u => new URL(u, document.baseURI).href);
          if([...document.querySelectorAll('img')].filter(i => lg.includes(i.src)).length > 1) out.push({slot: 'brand.logo', kind: 'logo-count', detail: 'more than one logo'});
          return out;
        };
      });
    });
  };
  window.FXP = FXP;
})();
