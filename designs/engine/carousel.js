/* templates/_shared/carousel.js: carousel slides for every Just Listed, Just Sold and Open House social (the owner, 11/1/2026,
   FX pilot review; docs/context/product.md "Carousels"). No AI cost: the lines come from copy the writer already wrote.

   Just Listed and Open House: the cover (the post), every listing photo, then the agent card (name, number, logo, over a
   photo of the house; the owner 11/2 Q1), up to Instagram's 20 images. Each photo slide carries two lines about the room
   in that photo, never a separate room name, sized on its own (the owner 11/2 Q2). The lines come from the fold-over copy
   tied to that photo (its caption and its write-up), then the set's room lines (companion.roomLines), then the photo
   captions of the announcement copy (companion.justListed.captions), then a sentence from the rest of the copy that
   talks about what the photo tags name. No sentence shows on two slides. A photo none of that covers gets its tag
   details (flagged carousel-thin-lines, so a real run sends it back for lines).
   Just Sold (the owner 11/2 standing rule): the carousel gets the neighbor to call the agent, never the house. Two images:
   the post (the front of the house, socialset.js) and the best room inside, each with its own call to action set big
   (voice.md); no beds, baths or other house facts.

   Every slide is one 1080 x 1350 image in the set's own look. The look is the set's social look (socials.json) or the
   flyer's email look (email.json), plus its carousel recipe ("carousel" in that look, the set's own design round):
     photo   'bleed' (full width, top) | 'inset' (inside a margin of the field)    inset: pt
     fade    a color the photo fades into at its foot (B01's twilight fade)
     rule    true: a short accent rule over the lines (Ivory's rules)
     italic  true: the lines in the display face's italic
     lines   'display' | 'body'                                                  the face the two lines are set in
     foot    'caps' (body face, tracked capitals) | 'date' (the flyer's date face)
     sold    {bg, ink, accent}: the Just Sold field (default the set's band)
     band    {bg, ink, accent}: the band colors where the look has none (a flyer's email look)
     panel   'band': the words sit on the set's band color (Answer Book's teal, Outside First's charcoal), not the page
     align   'left': the words set flush left (the column sets)
     bar     'left': an accent bar beside the words (the column motif) | 'strip': an accent strip across the photo's foot
     rules   'double': hairline rules over and under the words, the width of the text (the ruled sets)
     corners true: small corner marks around the words (Survey Book)
     arch    true: room photos get an arched top (Vaulted Opening); never a whole-house photo, so no roof is lost
     frame   true: a hairline frame around the slide (Swatchbook)
     accent  a color for the bar, strip, rules and marks (default the look's accent, or the band's on a band panel)
   The frame deco of a flyer look (deco t:'frame') is drawn on every slide.

   The proof editor's carousel controls (drag to reorder, X out a photo, add it back) write D.carousel[moment] =
   {order: [photo ids], removed: [photo ids]}; plan() follows it (scope: docs/proposals/carousel-editor-11-01.md).

     Carousel.plan(D, L, moment) -> [{photo, text, src}]   (on a page whose look and fonts are loaded)
     Carousel.slide(D, L, W, H)  -> html for D.piece = {shape:'slide', moment, photo, text, src} */
(function(){
  const esc = s => Ivory.esc(s);
  const C = {MAX: 20};
  const K = .375;
  // what never goes on a slide: condition claims (socialset.js SS.CONDITION), staging, prices, photo numbers
  const OUT = /\b(flood|flooded|flooding|foundation|repair|repaired|as[- ]is|inspect|damage|leak|mold|termite|never\s+\w+ed\b|rebuil|structural|settl)|\bstag(ed|ing)\b|\$\s?\d|\bphoto\s*#?\s*\d/i;
  // the Just Sold slide's call to action (voice.md; the post carries SocialSet.SOLD_POST, a different line)
  C.SOLD = ["Thinking about selling? Let's talk."];
  // rooms that never stand in for "the best room inside"
  const MINOR = /\b(bath|shower|closet|laundry|utility|pantry|hall|garage|powder|mud|storage|stair)/i;
  const STOP = new Set('a an and the of to with in on at by for from its it is are was off out over under two three one new'.split(' '));

  const sentences = t => String(t || '').split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
  const clean = t => { t = String(t || '').trim(); return t && !/[.!?]$/.test(t) ? t + '.' : t; };

  // every copy entry tied to a photo: {photo, title, caption, body | label} anywhere in D.copy
  const entries = D => {
    const out = {};
    const walk = x => {
      if(Array.isArray(x)) return x.forEach(walk);
      if(!x || typeof x !== 'object') return;
      if(typeof x.photo === 'string' && (x.body || x.caption || x.label || x.title)) (out[x.photo] = out[x.photo] || []).push(x);
      Object.values(x).forEach(walk);
    };
    walk(D.copy || {});
    return out;
  };
  // the photo's own candidate lines, best first
  const own = (D, id, E) => {
    const P = (D.photos || {})[id] || {}, CO = D.companion || {}, list = [];
    (E[id] || []).forEach(e => { sentences(e.body).forEach(s => list.push(s)); if(e.caption) list.push(clean(e.caption)); if(e.label) list.push(clean(e.label));
      sentences(e.body).forEach(s => { const c = clause(s); if(c) list.push(c); });
      });   // (titles stay off: a heading joined to a sentence reads like a label)
    const room = (P.tags || '').split(',')[0].trim().toLowerCase(), RL = CO.roomLines || {};
    const rl = RL[id] || RL[room] || RL[room.split(' ').pop()];
    if(rl) [rl.wide, rl.long, rl.short].forEach(t => sentences(t).forEach(s => list.push(clean(s))));
    const cap = ((CO.justListed || {}).captions || {})[id];
    if(cap) list.push(clean(cap));
    return list;
  };
  // a sentence too long for two lines may end at its first ", with" or ", and" when what comes before stands alone
  // (or before " that" / " which" when at least six words come before it)
  const clause = s => {
    const m = /^(.{25,}?),\s+(with|and|plus|where|so)\s/.exec(s);
    if(m && m[1].split(' ').length >= 5) return m[1] + '.';
    const t = /^(.+?)\s+(that|which)\s/.exec(s);
    return t && t[1].split(' ').length >= 6 ? t[1].replace(/,$/, '') + '.' : '';
  };
  // the rest of the copy, for photos no entry covers
  const pool = D => {
    // (only copy that isn't tied to another photo: a room's own write-up is about that room)
    const CO = D.companion || {}, JL = CO.justListed || {}, out = [];
    [(CO.listing || {}).body, (CO.postcard || {}).notes, JL.about, ((D.copy || {}).insideTop || {}).intro, ((D.copy || {}).back || {}).locationBody]
      .forEach(t => sentences(t).forEach(s => out.push(s)));
    return out;
  };
  const words = t => (String(t).toLowerCase().match(/[a-z]+/g) || []).filter(w => w.length > 2 && !STOP.has(w)).map(w => w.replace(/s$/, ''));

  // ---------- the two-line text box (shared by plan and slide, so plan picks lines that fit the slide) ----------
  C.metrics = (L, W) => {
    const R = L.carousel || {}, f = 1080/393*K*1.03;   // the phone floor factor of a 1080 px slide (socialset.js kit)
    const pad = R.photo === 'inset' ? Math.max(22, (R.inset || 18) + 8) : 22;
    const face = R.lines === 'body' ? L.body : L.display, wgt = R.lines === 'body' ? 500 : (L.dw || 700);
    return {pad, tw: W - 2*pad - (R.bar === 'left' ? 16 : 0), f, min: 15, max: 21, lhK: R.lines === 'body' ? 1.3 : 1.22,
      face: s => `${R.italic ? 'italic ' : ''}${wgt} ${s}pt ${face}`};
  };
  let meas;
  // lines and the last line's fill at size s, set with balanced wrapping
  C.measure = (t, css, w, lh) => {
    if(!meas){ meas = document.createElement('div'); document.body.appendChild(meas); }
    meas.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;width:${w}pt;${css};line-height:${lh}pt;text-wrap:balance`;
    meas.textContent = t;
    const r = document.createRange(); r.selectNodeContents(meas);
    const rects = [...r.getClientRects()].filter(x => x.width > 0), tops = [...new Set(rects.map(x => Math.round(x.top)))];
    const last = rects.filter(x => Math.round(x.top) === tops[tops.length - 1]).reduce((a, x) => a + x.width, 0);
    const widest = Math.max(...tops.map(tp => rects.filter(x => Math.round(x.top) === tp).reduce((a, x) => a + x.width, 0)));
    return {n: tops.length, fill: widest ? last/widest : 0, widest: widest*.75};
  };
  // the biggest size that sets t in exactly `want` lines (2 by default), or null
  C.fit = (t, M, want) => {
    for(let s = M.max; s >= M.min - .01; s -= .5){
      const m = C.measure(t, `font:${M.face(s)}`, M.tw, s*M.lhK);
      if(m.n < (want || 2)) return null;   // too short for two lines even at the top size
      if(m.n === (want || 2) && m.fill >= .78) return {s, n: m.n};   // the last line at least 3/4 full (lastline.js)
    }
    return null;
  };

  // the photos in carousel order (the editor's order and removals first)
  C.photos = (D, moment, cover) => {
    const ed = (D.carousel || {})[moment] || {}, all = OHL.photos(D), gone = new Set(ed.removed || []);
    let ids = (ed.order || []).filter(id => all.includes(id)).concat(all.filter(id => !(ed.order || []).includes(id)));
    ids = ids.filter(id => !gone.has(id) && id !== cover);
    if(moment === 'js'){
      // one slide after the post (the front of the house): the best room inside, the first main room in the writer's order
      const hero = OHL.hero(D, ''), inside = ids.filter(id => id !== hero && !Ivory.fullHouse(D, id) && !/exterior|yard|lawn|aerial|street|patio|deck/i.test(((D.photos || {})[id] || {}).tags || ''));
      const best = inside.find(id => !MINOR.test(((D.photos || {})[id] || {}).tags || id)) || inside[0] || ids.find(id => id !== hero);
      return [best].filter(Boolean);
    }
    return ids.slice(0, C.MAX - 2);   // the cover is the first image, the agent card the last
  };
  // the agent card's photo: the front of the house from the cover (every other photo already has its slide), so the
  // carousel opens and closes on the house
  C.cardPhoto = (D, cover) => cover || OHL.photos(D).find(id => Ivory.fullHouse(D, id));

  C.plan = (D, L, moment) => {
    const cover = moment === 'js' ? null : OHL.hero(D, ''), ids = C.photos(D, moment, cover);
    if(moment === 'js') return ids.map((id, i) => ({photo: id, text: C.SOLD[i % C.SOLD.length], src: 'sold'}));
    // each slide sized on its own (the owner 11/2 Q2), then the agent card
    // a photo nothing written covers starts in the editor's "Removed photos" tray (C.held), never as a slide of tag words:
    // the writer's room lines and photo notes cover every listing photo on real listings
    const all = C.lines(D, L, ids);
    C.held = all.filter(x => x.src === 'tags').map(x => x.photo);
    return all.filter(x => x.src !== 'tags').concat([{photo: C.cardPhoto(D, cover), text: '', src: 'card', card: true}]);
  };
  C.lines = (D, L, ids) => {
    const M = C.metrics(L, 1080*K), E = entries(D), used = new Set(), rest = pool(D);
    const ok = t => t && !OUT.test(t) && !used.has(t);
    const pick = list => {
      list = list.filter(ok);
      for(const t of list) if(C.fit(t, M)) return t;
      // a short line joins the next one when the two together still make two lines
      for(let i = 0; i < list.length - 1; i++){ const t = list[i] + ' ' + list[i + 1]; if(C.fit(t, M)) return [list[i], list[i + 1]]; }
      return null;
    };
    // first every photo's own copy, then the rest of the copy for the photos left
    const first = {};
    ids.forEach(id => { const t = pick(own(D, id, E)); if(t){ first[id] = t; [].concat(t).forEach(x => used.add(x)); } });
    return ids.map(id => {
      let t = first[id], src = 'copy';
      if(t) return {photo: id, text: [].concat(t).join(' '), src};
      if(!t){
        // a sentence elsewhere in the copy about what the tags name (most shared words first)
        // (the tag's details, not its room name: "front exterior, new siding" looks for siding)
        const tw = new Set(words((((D.photos || {})[id] || {}).tags || '').split(',').slice(1).join(' ')));
        const scored = rest.filter(ok).map(s => ({s, k: words(s).filter(w => tw.has(w)).length})).filter(x => x.k >= 1).sort((a, b) => b.k - a.k);
        t = pick(scored.flatMap(x => [x.s, clause(x.s)].filter(Boolean))); src = 'matched';
      }
      if(!t){
        const parts = (((D.photos || {})[id] || {}).tags || '').split(',').slice(1).map(x => x.trim()).filter(Boolean);
        t = parts.length ? clean(parts.join(', ').replace(/^./, c => c.toUpperCase())) : ''; src = 'tags';
      }
      [].concat(t).forEach(x => used.add(x));
      return {photo: id, text: [].concat(t).join(' '), src};
    });
  };

  // ---------- one slide ----------
  C.slide = (D, L, W, H) => {
    const P = D.piece, R = L.carousel || {}, M = C.metrics(L, W), Li = D.listing || {}, A = D.agent || {};
    const sold = P.moment === 'js', card = !!P.card, E = P.moment === 'oh' && window.OHL ? OHL.event(D) : null;
    const band = Object.assign({bg: L.page, ink: L.ink, accent: L.accent}, L.band || {}, R.band || {}, sold ? R.sold || {} : {});
    const onBand = sold || R.panel === 'band';
    const field = onBand ? band.bg : L.page;
    let ink = onBand ? band.ink : L.ink, accent = onBand ? band.accent : L.accent;
    // never dark words on a dark field (a flyer whose page is its dark main color): white words, and a light accent
    let muted = L.muted || L.ink;
    if(C.dark(field) && C.dark(ink)){ ink = '#ffffff'; if(C.dark(accent)) accent = L.paper || '#f4efe6'; }
    if(C.dark(field) && C.dark(muted)) muted = 'rgba(255,255,255,.82)';
    const mark = R.accent || accent, left = R.align === 'left' && !sold, barW = R.bar === 'left' ? 16 : 0;
    const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
    // the flyer's frame deco, or the recipe's own frame (a set whose posts draw theirs another way)
    const frame = (L.deco || []).find(d => d.t === 'frame') || (R.frame ? {color: R.accent || L.accent} : null);
    const FS = Math.ceil(10*M.f*2)/2, FB = Math.ceil(12*M.f*2)/2;
    const caps = s => `font:${L.bw || 700} ${s}pt ${L.body};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`;
    const dateFace = s => `font:${L.dateW || 500} ${s}pt ${L.dateFont || L.display}`;
    const footFace = R.foot === 'date' ? dateFace : caps;
    const one = (t, face, w, hi, lo) => { for(let s = hi; s >= lo - .01; s -= .5) if(C.measure(t, face(s) + ';white-space:nowrap', 9999, s).widest <= w) return s; return 0; };

    // the foot line: the address (Just Listed), the event (Open House), the agent (Just Sold)
    let foot = Li.address || '';
    if(E){
      const day = [E.weekday, [E.monthShort, E.day].filter(Boolean).join(' ')].filter(Boolean).join(', ');
      const full = [E.label, day, E.time].filter(Boolean).join('  ·  '), short = [day, E.time].filter(Boolean).join('  ·  ');
      foot = one(full, footFace, M.tw, FB + 1, FS) ? full : short;
    }
    if(sold) foot = [A.name, A.phone].filter(Boolean).join('  ·  ');
    const fs = one(foot, footFace, M.tw, FB + 1, FS) || FS;

    // the two lines, sized on their own (the owner 11/2 Q2); a Just Sold call to action set big, in one or two lines
    const SM = sold ? Object.assign({}, M, {max: 34, min: 22, lhK: 1.18}) : M;
    let r = C.fit(P.text, SM) || {s: SM.min, n: C.measure(P.text, `font:${SM.face(SM.min)}`, SM.tw, SM.min*SM.lhK).n};
    if(sold) for(let s = SM.max; s >= SM.min - .01; s -= .5){ const n = C.measure(P.text, `font:${SM.face(s)}`, SM.tw*.94, s*SM.lhK).n; if(n <= 2){ r = {s, n}; break; } }
    let tw = sold ? SM.tw*.94 : M.tw;
    for(let k = .95; r.n < 2 && P.moment !== 'js' && k >= .6; k -= .05){ const n = C.measure(P.text, `font:${M.face(r.s)}`, M.tw*k, r.s*M.lhK).n; if(n === 2){ tw = M.tw*k; r = {s: r.s, n}; } }
    const lh = r.s*SM.lhK, textH = card ? 0 : r.n*lh;
    const word = sold ? 'Just Sold' : '';
    const ws = sold ? Math.max(FB + 4, Math.min(34, one(word, s => `font:${L.labelW || L.dw || 700} ${s}pt ${L.labelFont || L.display};${(L.labelCaps ?? L.caps) ? 'text-transform:uppercase;' : ''}letter-spacing:${((L.labelTrack ?? L.track ?? 0)*s/38).toFixed(2)}pt`, M.tw, 34, FB))) : 0;
    const gap = 12*M.f, ruleH = R.rule ? 1.2 : 0, ruleGap = R.rule ? 12*M.f : 0;
    const CK = card ? C.cardKit(D, L, M) : null;
    const panel = card ? CK.h + 2*M.pad + (frame ? 6 : 0) : M.pad*.9 + (sold ? ws*1.15 + gap*.7 : 0) + ruleH + ruleGap + textH + gap + fs*1.35 + M.pad*.9 + (frame ? 6 : 0);

    // the photo: as tall as the panel leaves; a whole-house shot never taller than its own shape (no side of the house lost)
    const id = P.photo, ph = (D.photos || {})[id] || {}, inset = R.photo === 'inset' ? (R.inset || 18) : 0;
    const pw = W - 2*inset;
    let phH = H - panel - inset;
    if(Ivory.fullHouse(D, id) && ph.w && ph.h){
      // as tall as the room allows while the house box stays inside the frame's sides; no box, the photo's own shape
      const nat = Math.floor(pw*ph.h/ph.w);
      let best = nat;
      if(ph.house) for(let t = phH; t > nat; t -= 4){ const b = OHL.houseInFrame(D, id, pw, t); if(b && b.left >= .02 && b.right <= .98){ best = t; break; } }
      phH = Math.min(phH, best);
    }
    const arch = R.arch && !Ivory.fullHouse(D, id) ? `border-radius:${pw/2}pt ${pw/2}pt 0 0 / ${Math.round(pw*.28)}pt ${Math.round(pw*.28)}pt 0 0;` : '';
    let h = OHL.photo(D, id, `left:${inset}pt;top:${inset}pt;width:${pw}pt;height:${phH}pt;${arch}`);
    if(R.bar === 'strip') h += rect(inset, inset + phH - 5, pw, 5, `background:${mark}`);
    if(R.fade) h += rect(inset, inset + phH*.72, pw, phH*.28 + 1, `background:linear-gradient(to bottom, transparent, ${R.fade})`);

    // the words, centered in the room under the photo
    const top = inset + phH, room = H - top - (frame ? 10 : 0);
    if(card){
      h += CK.html(top + (room - CK.h)/2, W, ink, accent);
      if(frame) h += `<div class="abs" data-frame="1" style="left:8pt;top:8pt;width:${W-16}pt;height:${H-16}pt;border:.9pt solid ${frame.color || L.accent};box-sizing:border-box;pointer-events:none"></div>`;
      return {W, H, field, html: h};
    }
    const stack = (sold ? ws*1.15 + gap*.7 : 0) + ruleH + ruleGap + textH + gap + fs*1.35;
    let y = top + (room - stack)/2;
    // the set's own marks around the words
    const y0 = y, y1 = y + stack, xl = left ? M.pad + barW : (W - tw)/2, wl = M.tw;
    if(R.bar === 'left' && !sold) h += rect(M.pad, y0 - 2, 4, stack - gap*.4, `background:${mark}`);
    if(R.rules === 'double' && !sold){ h += rect(M.pad, y0 - gap*.9, W - 2*M.pad, .8, `background:${mark}`) + rect(M.pad, y1 + gap*.3, W - 2*M.pad, .8, `background:${mark}`); }
    if(R.corners && !sold){
      const cx0 = M.pad*.7, cx1 = W - M.pad*.7, cy0 = y0 - gap*1.1, cy1 = y1 + gap*.6, k = 14, t = 1;
      [[cx0, cy0, 1, 1], [cx1, cy0, -1, 1], [cx0, cy1, 1, -1], [cx1, cy1, -1, -1]].forEach(([x, yy, sx, sy]) => {
        h += rect(sx > 0 ? x : x - k, sy > 0 ? yy : yy - t, k, t, `background:${mark}`) + rect(sx > 0 ? x : x - t, sy > 0 ? yy : yy - k, t, k, `background:${mark}`); });
    }
    if(sold){ h += `<div class="abs nw" data-slot="moment" data-lines="1" style="left:${M.pad}pt;top:${y}pt;width:${M.tw}pt;height:${ws*1.15}pt;font:${L.labelW || L.dw || 700} ${ws}pt/${ws*1.15}pt ${L.labelFont || L.display};${(L.labelCaps ?? L.caps) ? 'text-transform:uppercase;' : ''}letter-spacing:${((L.labelTrack ?? L.track ?? 0)*ws/38).toFixed(2)}pt;color:${accent};text-align:center">${esc(word)}</div>`; y += ws*1.15 + gap*.7; }
    if(R.rule){ h += rect(left ? xl : W/2 - 22, y, 44, ruleH, `background:${mark}`); y += ruleH + ruleGap; }
    h += `<div class="abs wr" data-slot="carousel.lines" data-lines="${r.n}" data-src="${esc(P.src || '')}" style="left:${xl}pt;top:${y}pt;width:${left ? Math.min(tw, wl, C.measure(P.text, `font:${SM.face(r.s)}`, Math.min(tw, wl), lh).widest + 2) : tw}pt;height:${textH + r.s*.15}pt;font:${SM.face(r.s)};line-height:${lh}pt;color:${ink};text-align:${left ? 'left' : 'center'};text-wrap:balance">${esc(P.text)}</div>`;
    y += textH + gap;
    h += `<div class="abs nw" data-slot="carousel.foot" data-lines="1" data-small="1" style="left:${left ? xl : M.pad}pt;top:${y}pt;width:${left ? wl : M.tw}pt;height:${fs*1.35}pt;${footFace(fs)};line-height:${fs*1.35}pt;color:${sold || onBand ? (R.foot === 'date' ? accent : ink) : (R.foot === 'date' ? accent : muted)};text-align:${left ? 'left' : 'center'}">${esc(foot)}</div>`;
    if(frame) h += `<div class="abs" data-frame="1" style="left:8pt;top:8pt;width:${W-16}pt;height:${H-16}pt;border:.9pt solid ${frame.color || L.accent};box-sizing:border-box;pointer-events:none"></div>`;
    return {W, H, field, html: h};
  };

  // ---------- the agent card (the last Just Listed / Open House slide; the owner 11/2 Q1) ----------
  // name in the display face, REALTOR(R) when the agent is one, "Call / Text" and the number, the logo; centered under the
  // house photo. Returns {h, html(y, W, ink, accent)}.
  // dark or light, from what the browser makes of a color (CSS variables included)
  C.dark = c => { const e = document.createElement('div'); e.style.color = c; document.body.appendChild(e); const v = getComputedStyle(e).color; e.remove();
    const n = (v.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number), [r, g, b] = /^color\(srgb/.test(v) ? n.map(x => x*255) : n;
    return .299*r + .587*g + .114*b < 140; };

  C.cardKit = (D, L, M) => {
    const A = D.agent || {}, nar = A.nar || /realtor/i.test(A.designation || ''), lab = A.phoneLabel || 'Call / Text';
    const one = (t, face, hi, lo) => { for(let s = hi; s >= lo - .01; s -= .5) if(C.measure(t, face(s) + ';white-space:nowrap', 9999, s).widest <= M.tw*.94) return s; return lo; };
    const nameF = s => `font:${L.dw || 700} ${s}pt ${L.display}`, tagF = s => `font:${L.bw || 700} ${s}pt ${L.body};text-transform:uppercase;letter-spacing:${(s*.14).toFixed(2)}pt`;
    const phoneF = s => `font:${L.bw || 700} ${s}pt ${L.body}`;
    const ns = A.name ? one(A.name, nameF, 34, 20) : 0, ts = 13, ps = one(`${lab}  ${A.phone || ''}`, phoneF, 21, 15);
    const lgH = 46, lgW = Math.min(M.tw*.6, 210), g = 10*M.f;
    const h = (ns ? ns*1.15 : 0) + (nar ? ts*1.3 + 3 : 0) + g*.8 + ps*1.3 + g*1.4 + lgH;
    const html = (y, W, ink, accent) => {
      const line = (slot, inner, s, css, lines) => { const out = `<div class="abs nw" data-slot="${slot}" data-lines="1" style="left:${M.pad}pt;top:${y}pt;width:${M.tw}pt;height:${s*lines}pt;${css};line-height:${s*lines}pt;text-align:center">${inner}</div>`; y += s*lines; return out; };
      let o = `<style>.cr-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}.cr-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}.cr-logo .text{font:${L.bw || 700} 16pt/1.15 ${L.body};text-align:center}</style>`;
      if(ns) o += line('agent.name', esc(A.name), ns, `${nameF(ns)};color:${ink}`, 1.15);
      if(nar){ y += 3; o += line('agent.desig', 'REALTOR®', ts, `${tagF(ts)};color:${accent}`, 1.3); }
      y += g*.8;
      o += line('agent.phone', `<span style="${tagF(Math.round(ps*.62*2)/2)};color:${accent};margin-right:${(ps*.45).toFixed(1)}pt">${esc(lab)}</span>${esc(A.phone || '')}`, ps, `${phoneF(ps)};color:${ink}`, 1.3);
      y += g*1.4;
      o += `<div class="abs cr-logo" style="left:${(W - lgW)/2}pt;top:${y}pt;width:${lgW}pt;height:${lgH}pt;color:${ink}">${OHL.logo(D, C.dark(ink) ? 'light' : 'dark', '')}</div>`;
      return o;
    };
    return {h, html};
  };

  // the checks a slide adds to the page's own: two lines, from the copy
  C.check = D => {
    const out = [], el = document.querySelector('[data-slot="carousel.lines"]');
    if(!el) return out;
    if(D.piece.moment !== 'js' && el.dataset.lines !== '2') out.push({slot: 'carousel.lines', kind: 'carousel-lines', detail: `${el.dataset.lines} line(s), two wanted`});
    if(el.dataset.src === 'tags') out.push({slot: 'carousel.lines', kind: 'carousel-thin-lines', detail: 'no copy covers this photo: tag words only'});
    if(!el.textContent.trim()) out.push({slot: 'carousel.lines', kind: 'carousel-no-lines', detail: 'no lines for this photo'});
    return out;
  };
  window.Carousel = C;
})();
