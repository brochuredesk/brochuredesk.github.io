/* templates/_shared/socialset.js: Just Listed and Just Sold social sets in each design set's own look (The owner, 10/20/2026;
   brief docs/briefs/social-graphics-build.md). No AI cost: drawn from listing data and the writer's existing copy.

   One render per shape; places that share a size share it (templates/_shared/social-places.json labels them):
     post    1080 x 1350 (4:5)   Instagram, Facebook, Threads, LinkedIn post; carousel cover
     story   1080 x 1920 (9:16)  Instagram story / Reels cover, Facebook story, TikTok, YouTube Shorts
     square  1080 x 1080 (1:1)   Facebook Marketplace, Nextdoor
     pin     1000 x 1500 (2:3)   Pinterest
     wide    1600 x 900 (16:9)   X
     gbp     1200 x 900 (4:3)    Google Business Profile
     slide   1080 x 1350         carousel photo slides (interiors only, so no exterior is ever cropped)
   Pages are laid out in pt at half size (1 px of the PNG = 0.375 pt) and rendered at 2x, so the shared contact card
   keeps its print sizes and still reads on a phone.

   Rules carried in: no price, no QR, no photo numbers, no "virtually staged", the whole house (OHL.check's house-cut
   on every full-house frame), the street address is the heading (never the neighborhood), no condition claims
   (CONDITION below drops a writer sentence that makes one), one brokerage logo (the card's), no BrochureDesk mark,
   no blank space (the hero takes whatever room the text leaves). 4:5 posts keep their text inside the middle 3:4 that
   Instagram's grid shows; stories keep text out of the top and bottom 250 px.

   A set's look (templates/<set>/socials.json "look"), CSS values; var() refers to the set's own tokens:
     page, ink, accent, muted, dark         the main field and its text colors (dark: the card takes the white logo)
     band {bg, ink, accent}                 the field under the moment word ("Just Listed")
     display, dw, caps, track, body, bw     faces and weights; labelFont/labelW for a separate moment-word face
     motif   rules | angle | frame | column | tab | ''   the set's signature (angle and frame only where the house stays whole)
   A set whose signature is a drawing of its own (Atlas: the street map) registers window.SocialSignature =
     {min: share of the height reserved under the house (post, pin, square), or shape => share (stories too), html: (x, y, w, h) => markup}; it takes the
     row the interiors would take (on a story, the space under the card), and comes before the writer's lines when room
     is short (owner 10/31, standing rule 7: the set's signature on every piece). Wide and gbp keep their layout.

     SocialSet.start(brandVars)   D.piece = {id, shape, px, moment: 'jl'|'js', photo (slides)} */
(function(){
  const esc = s => Ivory.esc(s);
  const SS = {};
  const K = 0.375;   // pt per PNG pixel
  const STYLE = `
  .page.ss{position:relative;overflow:hidden}
  .ss .abs{position:absolute}
  .ss .photo{position:absolute;overflow:hidden}
  .ss .photo img{width:100%;height:100%;object-fit:cover;display:block}
  .ss .nw{white-space:nowrap;overflow:hidden}
  .ss .wr{white-space:normal;overflow:hidden}`;

  // condition claims stay off social posts (flooding, foundation, repairs, "as is", inspections, damage, age claims)
  SS.CONDITION = /\b(flood|flooded|flooding|foundation|repair|repaired|as[- ]is|inspect|damage|leak|mold|termite|never\s+\w+ed\b|rebuil|structural|settl)/i;

  // the writer's sentences (postcard pool first), in order, minus condition claims and anything that repeats a shown fact
  SS.sentences = (D, shown) => {
    const C = D.companion || {}, P = C.postcard || {};
    let pool = (P.master && P.master.length ? P.master : [P.notes || (C.listing || {}).body || '']).join(' ');
    pool = pool.split(/(?<=[.!?])\s+/).map(t => t.trim()).filter(Boolean);
    return pool.filter(t => !SS.CONDITION.test(t) && !(shown && window.FactRepeat && FactRepeat.repeats(t, shown).length));
  };
  // Just Sold: the playbook's own closing line (the call to the neighbors), else nothing
  SS.soldLine = D => {
    const s = ((D.companion || {}).sold || {}).notes || '';
    const t = s.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(x => x && !SS.CONDITION.test(x));
    return t.length ? t[t.length - 1] : '';
  };
  // the most writer sentences that fit `lines` lines at class/font in w pt (first always kept)
  SS.fitText = (list, font, w, lh, lines) => {
    let best = '';
    for(let n = 1; n <= list.length; n++){
      const t = list.slice(0, n).join(' ');
      if(SS.lines(t, font, w, lh) <= lines) best = t; else break;
    }
    return best;
  };
  SS.lines = (t, font, w, lh) => {
    const m = document.createElement('div');
    m.style.cssText = `position:absolute;left:-9999pt;visibility:hidden;width:${w}pt;font:${font};line-height:${lh}pt`;
    m.textContent = t; document.body.appendChild(m);
    const n = Math.round(m.getBoundingClientRect().height*0.75/lh); m.remove(); return n;
  };

  const moment = D => D.piece.moment === 'js' ? 'Just Sold' : 'Just Listed';
  // Just Sold gets the neighbor to call the agent, never the house (the owner 11/2 standing rule): no facts, and a call to
  // action set big under the address; the carousel's room slide carries a different one (carousel.js C.SOLD)
  SS.SOLD_POST = 'I just sold this house. Yours could be next.';
  const factsLine = L => Ivory.facts(L).map(t => t.replace(' square feet', ' sq ft')).join('  ·  ');

  // the moment word, sized to its box (max..min) in the set's display face
  const word = (L, x, y, w, h, size, color, align, minK) => {
    const caps = (L.labelCaps != null ? L.labelCaps : L.caps) ? 'text-transform:uppercase;' : '';
    const tr = L.labelTrack != null ? L.labelTrack : L.track;
    return `<div class="abs nw" data-slot="moment" data-lines="1" data-fit="${size},${Math.round(size*(minK || 0.6))}" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;font:${L.labelW || L.dw || 700} ${size}pt/${h}pt ${L.labelFont || L.display};${caps}${tr ? `letter-spacing:${w < 170 ? Math.min(tr, 1.2) : tr}pt;` : ''}color:${color};text-align:${align}">${esc(SS.M)}</div>`;
  };
  const hero = (D, L, x, y, w, h, cutOK) => {
    const id = OHL.hero(D, L.hero || '');
    const st = `left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt`;
    // a frame too short for the whole house narrows instead (same shape, centered on the field): the roof never goes
    const need = OHL.minFrameH(D, id, w, 99999);
    if(h < need){
      const nw = Math.floor(w*h/need), gap = w - nw, sup = gap >= 60 ? OHEmailSupport(D, id, 1) : [];
      if(!sup.length) return {id, html: OHL.photo(D, id, `left:${x + gap/2}pt;top:${y}pt;width:${nw}pt;height:${h}pt`)};
      return {id, html: OHL.photo(D, id, `left:${x}pt;top:${y}pt;width:${nw}pt;height:${h}pt`) + OHL.photo(D, sup[0], `left:${x + nw + 5}pt;top:${y}pt;width:${gap - 5}pt;height:${h}pt`)};
    }
    if(cutOK && L.motif === 'angle'){
      const cut = [[0,0],[1,0],[1,.88],[0,1]];
      if(OHL.polyFits(D, id, w, h, cut, 0.015)) return {id, html: OHL.maskedPhoto(D, id, st, cut)};
    }
    return {id, html: OHL.photo(D, id, st)};
  };
  const card = (D, L, x, y, w, h, onDark) => OHL.contact(D, {x, y, w, h, field: onDark ? 'dark' : 'paper', tone: onDark ? 'dark' : 'light',
    color: onDark ? (L.cardInk || '#ffffff') : L.ink, accent: onDark ? (L.cardAccent || L.accent) : L.accent, nameSize: 18, logoW: 150, logoH: 40,
    nameFont: L.display, nameWeight: L.dw || 700, bodyFont: L.body});
  const band = L => Object.assign({bg: L.page, ink: L.ink, accent: L.accent}, L.band || {});

  // ---------- the readable layouts (READ-2, the owner 10/30 late evening; docs/reports/social-readability-10-30.md) ----------
  // Every line is sized from the phone floors (16 px for the moment word and the address, 12 px for what a reader needs,
  // 10 px small print, at the width each shape shows on a phone), then the type and the photos grow to fill the image.
  // The contact card is the social card: name and cell set large, REALTOR(R), one logo (email and website are in the caption).
  const kit = (D, L, shape, pxW) => {
    const A = D.agent || {}, r2 = v => Math.round(v*2)/2;
    const rect = (x, y0, w, ht, css) => `<div class="abs" style="left:${x}pt;top:${y0}pt;width:${w}pt;height:${ht}pt;${css}"></div>`;
    const f = pxW/({wide: 330, gbp: 360}[shape] || 393)*K*1.03;
    const FE = Math.ceil(16*f*2)/2, FB = Math.ceil(12*f*2)/2, FS = Math.ceil(10*f*2)/2;
    const hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || '');
    const tr = L.labelTrack != null ? L.labelTrack : L.track;
    const F = {
      word: s => `font:${L.labelW || L.dw || 700} ${s}pt ${L.labelFont || L.display};${(L.labelCaps != null ? L.labelCaps : L.caps) ? 'text-transform:uppercase;' : ''}letter-spacing:${((tr || 0)*s/38).toFixed(2)}pt`,
      addr: s => `font:${L.addrW || L.dw || 700} ${s}pt ${L.display}`,
      place: s => `font:${L.bw || 600} ${s}pt ${L.body};text-transform:uppercase;letter-spacing:${(s*.12).toFixed(2)}pt`,
      facts: s => `font:${L.bw || 600} ${s}pt ${L.body}`, text: s => `font:400 ${s}pt ${L.body}`,
      name: s => `font:${L.dw || 700} ${s}pt ${L.display}`, phone: s => `font:${L.bw || 700} ${s}pt ${L.body}`,
      tag: s => `font:${L.bw || 700} ${s}pt ${L.body};text-transform:uppercase;letter-spacing:${(s*.12).toFixed(2)}pt`,
    };
    const meas = document.createElement('div'); document.body.appendChild(meas);
    const tw = (t, css) => { meas.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:nowrap;${css}`; meas.textContent = t; return meas.getBoundingClientRect().width*.75; };
    const tn = (t, css, w, lh) => { meas.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:normal;width:${w}pt;${css};line-height:${lh}pt`; meas.textContent = t; return Math.max(1, Math.round(meas.getBoundingClientRect().height*.75/lh)); };
    // a text item: one line from size down to oneMin, else wrapped (up to `lines`) from size down to min
    const fit = (o, w) => {
      if(!o.text) return null;
      const one = o.oneMin != null ? Math.max(o.min, o.oneMin) : o.min;
      for(let s = Math.max(o.size, one); s >= one - .01; s -= .5) if(tw(o.text, o.face(s)) <= w*.97) return {s, n: 1};
      if((o.lines || 1) > 1){
        const words = o.text.split(/[ \t\n]+/);
        for(let s = Math.max(o.size, o.min); s >= o.min - .01; s -= .5){
          if(Math.max(...words.map(x => tw(x, o.face(s)))) > w*.97) continue;
          const n = tn(o.text, o.face(s), w*.97, s*o.lhK); if(n <= o.lines) return {s, n};
        }
      }
      for(let s = one - .5; s >= o.min - .01; s -= .5) if(tw(o.text, o.face(s)) <= w*.97) return {s, n: 1};
      return null;
    };
    const hOf = (o, r) => r.n*r.s*o.lhK + (r.n > 1 ? r.s*(o.wrapK || .15) : 0);   // a wrapped display line box runs a little over its line height
    // a wrapped item is set at the width it was measured at (97%), centered in its room
    const put = (o, r, x0, y, w0) => { const w = o.shrink && r.n > 1 ? Math.min(w0, o.shrink(r)) : r.n > 1 ? w0*.97 : w0, x = x0 + (o.align === 'left' ? 0 : (w0 - w)/2); return `<div class="abs ${r.n > 1 ? 'wr' : 'nw'}" data-slot="${o.slot}" data-lines="${r.n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${hOf(o, r)}pt;${o.face(r.s)};line-height:${r.s*o.lhK}pt;color:${o.color};text-align:${o.align || 'center'}">${o.html ? o.html(r.s) : esc(o.text)}</div>`; };
    const isDark = c => { const p = document.createElement('div'); p.style.color = c; document.body.appendChild(p); const v = getComputedStyle(p).color; p.remove();
      const n = (v.replace(/^color\(srgb/, '').match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number), [R, G, B] = /^color\(srgb/.test(v) ? n.map(x => x*255) : n;
      return .299*R + .587*G + .114*B < 140; };
    const cardB = (x, y, w, k, o) => {
      const html = [], ink = o.ink, acc = o.accent || ink;
      const logo = (lx, ly, lw, lh) => `<div class="abs sc-logo" style="left:${lx}pt;top:${ly}pt;width:${lw}pt;height:${lh}pt;color:${ink}">${OHL.logo(D, o.dark ? 'dark' : 'light', '')}</div>`;
      if(o.name === false || !A.name){
        const lh = r2(Math.max(FB*1.8, 24*f)*Math.min(k, 1.2)), lw = Math.min(w, lh*4.2);
        return {h: lh, html: [logo(x + (w - lw)/2, y, lw, lh)], ok: true};
      }
      const labT = A.phoneLabel || 'Call / Text';
      const tryRow = (stack, lab) => {
        const ns = r2(FB*1.5*k), ps = r2(FB*1.18*k);
        const nm = {slot: 'agent.name', text: A.name, face: F.name, size: ns, min: FB*1.1, lhK: 1.14, lines: 1, color: ink, align: stack && !hsOn ? 'center' : 'left'};
        const ds = {slot: 'agent.desig', text: 'REALTOR®', face: F.tag, size: r2(FS*k), min: FS, lhK: 1.25, lines: 1, small: 1, color: acc, align: nm.align};
        const ls = r2(FS*1.0*k);
        const ph = {slot: 'agent.phone', text: `${lab}  ${A.phone || ''}`, face: F.phone, size: ps, min: FB, lhK: 1.25, lines: 1, color: ink, align: nm.align,
          html: s => (lab ? `<span data-small="1" style="${F.tag(Math.max(FS, Math.min(ls, s*.8)))};color:${acc};margin-right:${(s*.45).toFixed(1)}pt">${esc(lab)}</span>` : '') + esc(A.phone || '')};
        const hs0 = hsOn ? 1 : 0, gap = 10*f;
        let lw = stack ? w*.62 : Math.min(w*.34, 150*f), tx = 0;
        const textH = nm.size*1.14 + (nar ? FS*1.25*k + 2 : 0) + ph.size*1.25 + 3*f;
        const hsW = hs0 ? Math.round(textH*.8) : 0;
        const colW = stack ? w - (hs0 ? hsW + gap : 0) : w - lw - 2*gap - (hs0 ? hsW + gap : 0);
        const rn = fit(nm, colW), rd = nar ? fit(ds, colW) : null;
        // the phone line: its label rides on the number's line
        let rp = null;
        for(let s = Math.max(ps, FB); s >= FB - .01; s -= .5){
          const wd = (lab ? tw(lab, F.tag(Math.max(FS, Math.min(ls, s*.8)))) + s*.45 : 0) + tw(A.phone || '', F.phone(s));
          if(wd <= colW*.97){ rp = {s, n: 1}; break; }
        }
        if(!rn || !rp || (nar && !rd)) return null;
        // REALTOR(R) rides on the name's line when it fits there (left-set cards)
        const nW = rn ? tw(A.name, F.name(rn.s)) : 0, dW = rd ? tw('REALTOR®', F.tag(rd.s)) : 0;
        const inl = rd && nm.align === 'left' && nW + 8*f + dW <= colW*.97;
        const th = hOf(nm, rn) + (rd && !inl ? hOf(ds, rd) + 2*f : 0) + 3*f + hOf(ph, rp);
        const out = [], cx = x + (hs0 ? hsW + gap : 0);
        if(hs0) out.push(`<div class="abs sc-hs" style="left:${x}pt;top:${y}pt;width:${hsW}pt;height:${th}pt"><img src="${esc(A.headshot)}" alt=""></div>`);
        let yy = y;
        if(inl){
          out.push(put(nm, rn, cx, yy, nW + 2)); const dx = nW + 8*f;
          out.push(put(ds, rd, cx + dx, yy + rn.s*1.14*.78 - rd.s*1.25*.78, colW - dx));
          yy += hOf(nm, rn);
        } else {
          out.push(put(nm, rn, cx, yy, colW)); yy += hOf(nm, rn);
          if(rd){ yy += 2*f; out.push(put(ds, rd, cx, yy, colW)); yy += hOf(ds, rd); }
        }
        yy += 3*f; out.push(put(ph, rp, cx, yy, colW));
        if(stack){
          const lh = r2(Math.max(rn.s*1.3, FB*2)), lw2 = Math.min(w*.7, lh*4.2);
          out.push(logo(x + (w - lw2)/2, y + th + 8*f, lw2, lh));
          return {h: th + 8*f + lh, html: out, ok: true};
        }
        const lh = Math.max(th, rn.s*1.1);
        out.push(rect(x + w - lw - gap, y + 2, .6, lh - 4, `background:${ink};opacity:.3`));
        out.push(logo(x + w - lw + gap*.2, y, lw - gap*.2, lh));
        return {h: lh, html: out, ok: true};
      };
      return (!o.stack && tryRow(false, labT)) || tryRow(true, labT) || tryRow(true, '') || {h: 0, html: [], ok: false};
    };
    // "one story" only when nothing stronger is there (lot size and year beat it)
    const six = OHL.factSix(D.listing), strong = six.some(([ic]) => ic === 'lot' || ic === 'cal');
    const facts = six.filter(([ic]) => !(ic === 'stories' && strong)).map(([ic, t]) => ic === 'bed' ? t.replace('bedroom', 'bed') : ic === 'bath' ? t.replace(' full bath', ' bath') : ic === 'area' ? t.replace(' square feet', ' sq ft') : ic === 'cal' ? t.replace('Built in', 'Built') : t);
    const style = `<style>.ss .sc-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
      .ss .sc-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
      .ss .sc-logo .text{font:${L.bw || 700} ${r2(FB*1.15)}pt/1.15 ${L.body};text-align:center;color:inherit}
      .ss .sc-hs{position:absolute;overflow:hidden}.ss .sc-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
      .ss .wr{white-space:normal;overflow:hidden}</style>`;
    // lines and last-line fill of a paragraph (as templates/_shared/lastline.js measures it)
    const rows = (t, css, w, lh, center) => {
      meas.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:normal;width:${w}pt;${css};line-height:${lh}pt;text-align:${center ? 'center' : 'left'}`;
      meas.textContent = t; const rg = document.createRange(); rg.selectNodeContents(meas); const out = [];
      [...rg.getClientRects()].forEach(b => { if(b.width < .5) return; const r = out.find(x => Math.abs(x.top - b.top) < b.height*.5); if(r){ r.l = Math.min(r.l, b.left); r.r = Math.max(r.r, b.right); } else out.push({top: b.top, l: b.left, r: b.right}); });
      out.sort((a, b) => a.top - b.top);
      const wide = Math.max(1, ...out.map(r => r.r - r.l)), last = out[out.length - 1], full = w/.75;
      return {n: out.length, fill: last ? (last.r - last.l)/(center ? Math.min(wide, full) : full) : 0};
    };
    // the writer's sentences (first always kept) that fill at most maxLines lines with the last line 3/4 full; a narrower
    // measure (down to 70%) when no pick fills it. Returns {text, n, w} or null.
    const para = (pool, css, w, lh, maxLines, center) => {
      pool = pool.slice(0, 8);
      for(const k of [1, .95, .9, .85, .8, .75, .7]){
        let best = null;
        for(let m = 1; m < (1 << pool.length); m += 2){
          const t = pool.filter((_, i) => m & (1 << i)).join(' '), r = rows(t, css, w*k*.97, lh, center);
          if(r.n > maxLines || (r.n > 1 && r.fill < .77)) continue;
          const sc = r.n*100 + r.fill*10; if(!best || sc > best.sc) best = {text: t, n: r.n, w: w*k, sc};
        }
        if(best) return best;
      }
      return null;
    };
    return {f, FE, FB, FS, F, r2, rect, tw, fit, hOf, put, isDark, cardB, facts, style, para, done: () => meas.remove()};
  };

  // the hero, its narrowest frame and the photo helpers for one image
  const heroKit = (D, L, f) => {
    const id = OHL.hero(D, L.hero || ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5;
    const hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const min = w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR));
    const max = w => Math.ceil(hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : w/pAR);   // taller crops the sides, never the house
    const photo = (pid, x, y, w, ht) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${ht}pt`);
    const hero = (x, y, w, ht) => {   // a frame taller than the photo's shape centers on the house
      if(hb && ht > w/pAR){ const nat = ht*pAR, vis = w/nat, cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; }
      return photo(id, x, y, w, ht);
    };
    const row = (x, y, w, ht, n, skip) => {
      const ids = OHEmailSupport(D, id, n + (skip || 0)).slice(skip || 0); if(!ids.length || ht < 30) return '';
      const g = 4*f, pw = (w - (ids.length - 1)*g)/ids.length;
      return ids.map((p, i) => photo(p, x + i*(pw + g), y, pw, ht)).join('');
    };
    return {id, pAR, hb, min, max, hero, row, photo};
  };
  const KMIN = .6;
  const bestK = (kmax, room, need) => { for(let k = kmax; k >= KMIN - .001; k -= .025) if(room(k) >= need) return k; return null; };
  // ---------- portrait shapes: post, story, pin, square ----------
  // post, pin, square: the moment band, the whole house, the address, city, facts, the writer's lines, the card; spare
  // height goes to a taller house frame, then a row of two interiors. story: the house from the top edge, the band and
  // the text inside the safe band (no text in the top and bottom 250 px), two interiors to the bottom edge.
  SS.portrait = (D, L, W, H, shape) => {
    const T = kit(D, L, shape, D.piece.px[0]), {f, FE, FB, FS, F, r2, rect, fit, hOf, put} = T, X = heroKit(D, L, f);
    const Li = D.listing, bd = band(L), story = shape === 'story', BOT = story ? H - 94 : H;
    const pad = r2(16*f), x = pad, w = W - 2*pad, g = r2(9*f), ta = (L.align || 'center') === 'center' ? 'center' : 'left';
    const cardLook = {ink: L.dark ? (L.cardInk || '#ffffff') : (L.cardInk || L.ink), accent: L.cardAccent || L.accent, dark: !!L.dark};
    const sold = D.piece.moment === 'js';
    const itemH = (it, r) => it.row ? Math.max(...it.row.map(([a, b]) => hOf(a, b))) : hOf(it, r);
    const build = (k, o) => {
      const items = [], bp = r2(10*f*Math.min(k, 1.2));
      const word = {slot: 'moment', text: SS.M, face: F.word, size: r2(FE*1.75*k), min: FE, lhK: 1.15, lines: 1, color: bd.ink, align: ta};
      const rw = fit(word, w - (L.motif === 'column' ? 12 : 0)); if(!rw) return null;
      // the frame motif's line runs 8 pt in from the top edge: a band at the top starts its padding under that line
      const top0 = !story && L.motif === 'frame' ? 8 : 0, bandH = hOf(word, rw) + 2*bp + top0;
      const ad = {slot: 'address', text: Li.address, face: F.addr, size: r2(FE*1.35*k), min: FE, oneMin: FE, lhK: 1.15, lines: 2, color: L.ink, align: ta};
      const pl = {slot: 'place', text: OHL.place(Li), face: F.place, size: r2(FS*1.1*k), min: FS, lhK: 1.3, lines: 1, small: 1, color: L.muted || L.ink, align: ta};
      if(sold){
        // the street on the left, "Houston, TX" on the right, on one line under the photo; then the call to action
        const plS = Object.assign({}, pl, {text: OHL.place(Li).replace(/\s*\d{5}(-\d{4})?$/, ''), align: 'right'}), rpS = fit(Object.assign({}, plS, {size: r2(FB*1.1*k), min: FB}), w*.4) || fit(plS, w*.4);
        const plW = rpS ? T.tw(plS.text, plS.face(rpS.s)) + 12*f : 0, adS = Object.assign({}, ad, {align: 'left', lines: 1});
        const raS = rpS && fit(adS, w - plW);
        if(raS) items.push([{row: [[adS, raS, w - plW], [plS, rpS, plW]]}, null, 0]);
        else { const ra = fit(ad, w), rp = fit(plS, w); if(!ra || !rp) return null; items.push([ad, ra, 0], [Object.assign({}, plS, {align: ta}), rp, 2*f]); }
        let rc = null;
        // two lines break between its two sentences ("I just sold this house." / "Yours could be next."), never mid-sentence
        const cta = {slot: 'sold.cta', text: SS.SOLD_POST, html: () => esc(SS.SOLD_POST).replace(/([.!?])\s+/, rc && rc.n > 1 ? '$1<br>' : '$1 '), face: F.addr, size: r2(FE*2*k), oneMin: r2(FE*1.75*k), min: FE, lhK: 1.18, lines: 2, color: L.accent, align: ta,
          // on two lines the box hugs the longer sentence, so the lines balance (the second about 85% of the first)
          shrink: () => cta.sw};
        rc = fit(cta, w); if(!rc) return null;
        cta.sw = Math.max(...SS.SOLD_POST.split(/(?<=[.!?])\s+/).map(t => T.tw(t, F.addr(rc.s)))) + 2;
        items.push([cta, rc, 9*f]);
      }
      const ra = !sold && fit(ad, w), rp = !sold && fit(pl, w); if(!sold && (!ra || !rp)) return null;
      if(!sold) items.push([ad, ra, 0], [pl, rp, 2*f]);
      if(o.facts && !sold){
        let rf = null, ft = null;
        for(let n = T.facts.length; n >= Math.min(3, T.facts.length) && !rf; n--){ ft = {slot: 'facts', text: T.facts.slice(0, n).join('  ·  '), face: F.facts, size: r2(FB*1.12*k), min: FB, lhK: 1.3, lines: 1, color: L.accent, align: ta}; rf = fit(ft, w); }
        if(!rf) return null;
        items.push([ft, rf, 4*f]);
      }
      if(o.wl && !sold){
        const fs = r2(Math.max(FB, FB*1.04*k)), pool = D.piece.moment === 'js' ? [SS.soldLine(D)].filter(Boolean) : SS.sentences(D, Ivory.facts(Li));
        const pk = T.para(pool, F.text(fs), w, fs*1.35, o.wl, ta === 'center');
        if(!pk) return null;
        const it = {slot: 'writeup', text: pk.text, face: F.text, size: fs, min: fs, lhK: 1.35, lines: pk.n, color: L.ink, align: ta};
        items.push([it, {s: fs, n: pk.n}, 6*f, pk.w]);
      }
      const c = T.cardB(x, 0, w, k, Object.assign({name: o.name}, cardLook)); if(!c.ok) return null;
      const textH = items.reduce((s, [it, r, gp]) => s + itemH(it, r) + gp, 0);
      const fixed = bandH + textH + c.h + (story ? 3*g : 3*g + pad*.8) + (o.sig ? SIGH + 4*f : 0);
      return {bandH, top0, rw, word, items, c, textH, room: (story ? BOT - g : H - pad*.7) - fixed};
    };
    const SG = window.SocialSignature, SIG = SG && (!SG.on || SG.on(D)) ? SG : null, SIGH = !SIG ? 0 : typeof SIG.min === 'function' ? Math.round(H*SIG.min(shape)) : story ? 0 : Math.round(H*(SIG.min || .2));   // min: a share of the height, or by shape (stories too)
    const opts0 = (story || shape === 'pin' ? [3, 2, 1, 0] : shape === 'post' ? [2, 1, 0] : [0]).map(wl => ({wl, name: true, facts: true}))
      .concat([{wl: 0, name: true, facts: false}, {wl: 0, name: false, facts: false}]);
    const optsList = SIGH ? opts0.map(o => Object.assign({sig: true}, o)).concat(opts0) : opts0;
    const KMAX = {post: 1.3, pin: 1.3, story: 1.3, square: 1.2}[shape] || 1.2;
    let pick = null;
    for(const o of optsList){
      const b1 = build(KMIN, o); if(!b1) continue;
      for(const sc of [1, .78, .7]){
        const hw = Math.round(W*sc), pmin = X.min(hw), pnat = Math.ceil(hw/X.pAR);
        if(b1.room < pmin) continue;
        const need = Math.min(b1.room, story ? pnat : pmin + .6*(pnat - pmin));
        const k = bestK(KMAX, k => { const b = build(k, o); return b ? b.room : -1; }, need) || KMIN;
        pick = {o, k, hw}; break;
      }
      if(pick) break;
    }
    pick = pick || {o: {wl: 0, name: false, facts: false}, k: KMIN, hw: W};
    const {o, k, hw} = pick, B = build(k, o) || build(KMIN, {wl: 0, name: false, facts: false});
    let ph = Math.min(Math.ceil(hw/X.pAR), B.room), spare = B.room - ph;
    if(!story && spare < 60*T.f){ const add = Math.min(spare, Math.max(0, X.max(hw) - ph)); ph += add; spare -= add; }
    const sideW = W - hw - 4*f, side = hw < W && sideW >= 50*f;
    const heroAt = y => side ? X.hero(0, y, hw, ph) + X.row(hw + 4*f, y, sideW, ph, 1) : X.hero((W - hw)/2, y, hw, ph);
    let h = T.style, bg = '';
    const bandAt = y => {
      bg += rect(0, y, W, B.bandH, `background:${bd.bg}`);
      if(L.motif === 'column') bg += rect(x, y + B.bandH*.2, 4, B.bandH*.6, `background:${bd.accent}`);
      h += put(B.word, B.rw, x + (L.motif === 'column' ? 12 : 0), y + B.top0 + (B.bandH - B.top0 - T.hOf(B.word, B.rw))/2, w - (L.motif === 'column' ? 12 : 0));
      if(L.motif === 'rules') h += rect(x, y + B.bandH - 1, w, .8, `background:${L.accent};opacity:.7`);
    };
    const textAt = y => { B.items.forEach(([it, r, gp, ww]) => {
      y += gp;
      if(it.row){   // one line, left and right parts on a shared baseline
        const H0 = itemH(it); let xx = x;
        it.row.forEach(([a, b, wd]) => { h += put(a, b, xx, y + (H0 - hOf(a, b))*.78, wd); xx += wd; });
      } else h += ww ? put(it, r, x + (w - ww)/2, y, ww) : put(it, r, x, y, w);
      y += itemH(it, r); }); return y; };
    if(story){
      h += heroAt(0); let y = ph;
      bandAt(y); y += B.bandH + g;
      y = textAt(y) + g;
      h += T.cardB(x, y, w, k, Object.assign({name: o.name}, cardLook)).html.join(''); y += B.c.h + g;
      // with a signature: it fills the text-safe space under the card, two interiors under it to the bottom edge
      h += SIG ? SIG.html(0, y, W, BOT - y) + X.row(0, BOT + 4*f, W, H - BOT - 4*f, 2, side ? 1 : 0) : X.row(0, y, W, H - y, 2, side ? 1 : 0);
    } else {
      const rowH = o.sig ? SIGH + spare : spare >= 60*f ? spare - 4*f : 0, gs = rowH ? 0 : spare/3;
      bandAt(0); let y = B.bandH;
      h += heroAt(y); y += ph;
      if(rowH){ h += o.sig ? SIG.html(0, y + 4*f, W, rowH) : X.row(0, y + 4*f, W, rowH, 2, side ? 1 : 0); y += rowH + 4*f; }
      y = textAt(y + 1.3*g + gs) + 1.3*g + gs;
      h += T.cardB(x, y, w, k, Object.assign({name: o.name}, cardLook)).html.join('');
    }
    T.done();
    if(L.motif === 'frame') h += `<div class="abs" data-frame="1" style="left:8pt;top:8pt;width:${W-16}pt;height:${H-16}pt;border:.9pt solid ${L.accent};pointer-events:none"></div>`;
    return `${bg}${h}`;
  };

  // ---------- landscape: wide (X) and gbp (Google Business Profile) ----------
  // the house top left, the address band under it; beside them the moment word, the facts and the card in the band color,
  // the column running the full height
  SS.landscape = (D, L, W, H, shape) => {
    const T = kit(D, L, shape, D.piece.px[0]), {f, FE, FB, FS, F, r2, rect, fit, hOf, put} = T, X = heroKit(D, L, f);
    const Li = D.listing, bd = band(L), pad = r2(11*f), dark = T.isDark(bd.bg);
    const parts = (pw, k, o) => {
      const cw = W - pw, iw = cw - 2*pad, col = [];
      const word = {slot: 'moment', text: SS.M, face: F.word, size: r2(FE*1.5*k), min: FE, lhK: 1.15, lines: 2, color: bd.ink, wrapK: L.wordWrapK};   // look.wordWrapK: room under a two-line word whose face runs taller (Survey Book's Spectral)
      const rw = fit(word, iw); if(!rw) return null; col.push([word, rw, 0]);
      if(o.facts && D.piece.moment !== 'js'){   // the facts as one centered paragraph, broken only between facts (never on Just Sold, the owner 11/2)
        const it = {slot: 'facts', text: T.facts.slice(0, o.facts).map(t => t.replace(/ /g, '\u00a0')).join(' · '), face: F.facts, size: r2(FB*1.1*k), min: FB, lhK: 1.3, lines: 3, color: bd.accent};
        const r = fit(it, iw); if(!r) return null; col.push([it, r, 8*f]);
      }
      const c = T.cardB(W - cw + pad, 0, iw, k, {ink: bd.ink, accent: bd.accent, dark, name: o.name, stack: true}); if(!c.ok) return null;
      const colH = col.reduce((s, [it, r, gp]) => s + hOf(it, r) + gp, 0);
      const ad = {slot: 'address', text: Li.address, face: F.addr, size: r2(FE*1.3*k), min: FE, oneMin: FE, lhK: 1.15, lines: 2, color: L.ink};
      const pl = {slot: 'place', text: OHL.place(Li), face: F.place, size: r2(FS*1.1*k), min: FS, lhK: 1.3, lines: 1, small: 1, color: L.muted || L.ink};
      // one line when it fits; else without "Street" (the print rule) on one line; else two lines
      let ra = fit(Object.assign({}, ad, {lines: 1}), pw - 2*pad);
      if(!ra && OHL.printStreet(Li.address) !== Li.address){ const sh = Object.assign({}, ad, {text: OHL.printStreet(Li.address), lines: 1}); ra = fit(sh, pw - 2*pad); if(ra) ad.text = sh.text; }
      ra = ra || fit(ad, pw - 2*pad); const rp = fit(pl, pw - 2*pad); if(!ra || !rp) return null;
      const left = hOf(ad, ra) + 2*f + hOf(pl, rp);
      return {cw, iw, col, colH, c, ad, ra, pl, rp, left, need: colH + c.h + 2*pad + 12*f, band: left + 2*pad};
    };
    const KMAX = shape === 'wide' ? 1.1 : 1.15;
    let pick = null;
    for(const o of [{facts: 4, name: true}, {facts: 3, name: true}, {facts: 3, name: false}, {facts: 0, name: false}]){
      for(let fr = .72; fr >= .44 && !pick; fr -= .02){
        const pw = Math.round(W*fr), b1 = parts(pw, KMIN, o); if(!b1 || b1.need > H) continue;
        const mx = Math.min(X.max(pw), H), mn = X.min(pw);
        if(Math.min(mx, H - b1.band) < mn) continue;
        const k = bestK(KMAX, k => { const b = parts(pw, k, o); return b && b.need <= H ? Math.min(mx, H - b.band) - mn : -1; }, 0) || KMIN;
        pick = {o, k, pw};
      }
      if(pick) break;
    }
    pick = pick || {o: {facts: 0, name: false}, k: KMIN, pw: Math.round(W*.6)};
    const {o, k, pw} = pick, P = parts(pw, k, o) || parts(pw, KMIN, {facts: 0, name: false}), P0 = parts(pw, KMIN, o) || P, top = Math.min(X.max(pw), H - P0.band);   // the house takes the height first
    let h = T.style, bg = '';
    h += X.hero(0, 0, pw, top);
    bg += rect(0, top, pw, H - top, `background:${L.page}`) + rect(pw, 0, P.cw, H, `background:${bd.bg}`);
    // the column's words and the band's address grow to fill their own room
    let PC = P, PB = P0;   // the band's words never start larger than the room the house left (P0: its smallest size)
    for(let t = 1.7; t > k; t -= .025){ const q = parts(pw, t, o); if(q && q.colH + P.c.h + 2*pad + 12*f <= H){ PC = q; break; } }
    const fin = L.motif === 'frame' ? 8 : 0;   // the frame's line sits 8 pt in: the band's words stay clear of it
    for(let t = 1.4; t > k; t -= .025){ const q = parts(pw, t, o); if(q && q.left <= H - top - 1.6*pad - 2*fin){ PB = q; break; } }
    // room left in the band: the writer's line(s) under the city
    const fs = FB, lh = fs*1.35, roomL = H - top - 1.6*pad - 2*fin - PB.left - 6*f, bw = pw - 2*pad;
    const pool = D.piece.moment === 'js' ? [SS.soldLine(D)].filter(Boolean) : SS.sentences(D, Ivory.facts(Li));
    const pk = roomL >= lh && pool.length ? T.para(pool, F.text(fs), bw, lh, Math.min(3, Math.floor(roomL/lh)), true) : null;
    const wuH = pk ? pk.n*lh + (pk.n > 1 ? fs*.15 : 0) + 6*f : 0;
    let y = top + (H - fin - top - PB.left - wuH)/2;
    h += put(PB.ad, PB.ra, pad, y, bw); y += hOf(PB.ad, PB.ra) + 2*f; h += put(PB.pl, PB.rp, pad, y, bw); y += hOf(PB.pl, PB.rp);
    if(pk) h += put({slot: 'writeup', text: pk.text, face: F.text, lhK: 1.35, color: L.ink}, {s: fs, n: pk.n}, pad + (bw - pk.w)/2, y + 6*f, pk.w);
    const sp = (H - PC.colH - P.c.h)/3; y = sp;
    PC.col.forEach(([it, r, gp]) => { y += gp; h += put(it, r, pw + pad, y, P.iw); y += hOf(it, r); });
    h += rect(pw + P.cw*.38, sp*1.5 + PC.colH, P.cw*.24, .8, `background:${bd.ink};opacity:.35`);
    h += T.cardB(pw + pad, sp*2 + PC.colH, P.iw, k, {ink: bd.ink, accent: bd.accent, dark, name: o.name, stack: true}).html.join('');
    T.done();
    if(L.motif === 'frame') h += `<div class="abs" data-frame="1" style="left:8pt;top:8pt;width:${W-16}pt;height:${H-16}pt;border:.9pt solid ${L.accent};pointer-events:none"></div>`;
    return `${bg}${h}`;
  };

  // ---------- carousel photo slides ----------
  SS.slide = (D, L, W, H) => {
    // READ-2: the moment word and the address at the phone floor (16 px) and up
    const Li = D.listing, bd = band(L), id = D.piece.photo, stripH = 76;
    let h = OHL.photo(D, id, `left:0;top:0;width:${W}pt;height:${H - stripH}pt`);
    h += `<div class="abs" style="left:0;top:${H - stripH}pt;width:${W}pt;height:${stripH}pt;background:${bd.bg}"></div>`;
    h += word(L, 22, H - stripH + 10, W - 44, 22, 18, bd.accent, 'center', .97);
    h += `<div class="abs nw" data-slot="address" data-lines="1" data-fit="23,17.5" style="left:22pt;top:${H - stripH + 37}pt;width:${W - 44}pt;height:28pt;font:${L.dw || 700} 23pt/28pt ${L.display};color:${bd.ink};text-align:center">${esc(Li.address)}</div>`;
    return h;
  };

  // the carousel's photos: interiors (no full-house shot is cropped to 4:5), 3 to 8 of them, in the writer's order
  SS.slides = D => {
    const heroId = OHL.hero(D, '');
    return OHL.photos(D).filter(id => id !== heroId && !Ivory.fullHouse(D, id) && !/exterior|aerial|street/i.test((D.photos[id]||{}).tags||'')).slice(0, 8);
  };
  const OHEmailSupport = (D, heroId, n) => window.OHEmail ? OHEmail.support(D, heroId, n)
    : OHL.photos(D).filter(id => id !== heroId && !Ivory.fullHouse(D, id)).slice(0, n);

  SS.start = brandVars => {
    const D = Ivory.data();
    if(!D.listing){ document.getElementById('pages').innerHTML = '<p>No data injected.</p>'; return; }
    D.listing.neighborhood = '';
    OHL.houseFromBox(D);   // set data gives the house outline as box (11/2)
    OHL.useData(D);
    SS.M = moment(D);
    const st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);
    if(brandVars) brandVars(D);
    const L = Object.assign({}, D.socialLook || {}), root = getComputedStyle(document.documentElement);
    ['display', 'body', 'labelFont'].forEach(k => { const m = /^var\((--[\w-]+)\)$/.exec(L[k] || ''); if(m) L[k] = root.getPropertyValue(m[1]).trim() || L[k]; });
    SS.L = L;   // the resolved look (the carousel plan reads it)
    const want = [`${L.dw || 700} 20px ${L.display}`, `400 12px ${L.body}`, `${L.bw || 700} 12px ${L.body}`, L.labelFont ? `${L.labelW || 700} 20px ${L.labelFont}` : ''].filter(Boolean);
    window.brochureReady = Promise.all([...want.map(f => document.fonts.load(f).catch(() => 0)), OHL.cardReady]).then(() => {
      const [pw, ph] = D.piece.px, W = pw*K, H = ph*K, s = D.piece.shape;
      // carousel slides (templates/_shared/carousel.js, the owner 11/1): every photo with its two lines, in the set's look
      const cs = s === 'slide' && window.Carousel && D.piece.text != null ? Carousel.slide(D, L, W, H) : null;
      const inner = cs ? cs.html : s === 'slide' ? SS.slide(D, L, W, H) : s === 'wide' || s === 'gbp' ? SS.landscape(D, L, W, H, s) : SS.portrait(D, L, W, H, s);
      document.getElementById('pages').innerHTML = `<div class="page ss" data-page="${esc(D.piece.id)}" style="width:${W}pt;height:${H}pt;background:${cs ? cs.field : L.page}">${inner}</div>`;
      Ivory.shapeLogos();
      OHL.fitAll();
      const imgs = [...document.querySelectorAll('.cc img')].map(i => i.complete ? 0 : new Promise(r => { i.addEventListener('load', r, {once:true}); i.addEventListener('error', r, {once:true}); }));
      return Promise.all(imgs).then(OHL.cardFonts).then(() => document.fonts.ready).then(() => {
        const cardIssues = OHL.fitCards();
        window.pieceSize = {W, H, bleed: 0};
        window.brochureCheck = () => {
          const out = OHL.check(cardIssues).concat(cs ? Carousel.check(D) : []);
          const text = document.querySelector('.page').innerText;
          if(/\$\s?\d/.test(text)) out.push({slot: 'page', kind: 'price', detail: 'a dollar amount is on the graphic'});
          if(/\bphoto\s*#?\s*\d+|\b\d+\s*\/\s*\d+\s*$/im.test(text)) out.push({slot: 'page', kind: 'photo-number', detail: 'a photo number is on the graphic'});
          if(/virtual(ly)?\s+stag/i.test(text)) out.push({slot: 'page', kind: 'staging', detail: '"virtually staged" is on the graphic'});
          if(SS.CONDITION.test(text)) out.push({slot: 'page', kind: 'condition', detail: 'a condition claim is on the graphic'});
          const b = D.brand || {}, lg = [b.logo, b.logoOnDark, b.logoKnockout].filter(Boolean).map(u => new URL(u, document.baseURI).href);
          if([...document.querySelectorAll('img')].filter(i => lg.includes(i.src)).length > 1) out.push({slot: 'brand.logo', kind: 'logo-count', detail: 'more than one logo'});
          return out;
        };
      });
    });
  };
  window.SocialSet = SS;
})();
