/* templates/night-fade/nf-social.js: Night Fade's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on
   piece matches its set's main pieces). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and replaces its three
   layouts for this set only; nothing shared changes.

   Read off the approved Night Fade pieces (postcard.html, flyer.html, foldover.html, nf-tokens.css, nf-marks.css):
     - the agent's brand-kit dark as the field; the house photo running off the edges and dissolving into the field through the
       night blue (the .nf-fade recipe, grain included) at its foot and, beside a text column, sideways. The fade starts past the
       house's own box, so the whole house stays clear.
     - Just Listed: JUST / LISTED stacked in Archivo 800 caps, the place as the wide-tracked accent eyebrow over it, the street in
       dark 700 caps on the solid accent bar, the highlights with square accent marks and hairlines between them, the facts in
       tracked accent caps, the agent (name 800, phone in the accent) and the one logo along the foot.
     - Just Sold: the accent bar grown into a title band across the image, JUST SOLD in dark 800 caps with the place right-aligned in
       tracked caps; the house under it; the street in tracked 700 caps, "Thinking about selling?" in the accent, the agent's own
       note, a hairline, the agent and the logo. No house features.
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house in every frame (the engine's
   house-cut check), text at the phone floors of templates/_shared/readsize.js. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s), cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const AR = "'Archivo'", ON = 'var(--nf-on)', ACC = 'var(--nf-accent)', BAR = 'var(--nf-bar)', ONB = 'var(--nf-on-bar)', SOFT = 'var(--nf-soft)', RULE = 'var(--nf-rule)';
  const Q = 'Thinking about selling?';
  const F = {
    word: s => `font:800 ${s}pt ${AR};letter-spacing:${(s*.008).toFixed(2)}pt;text-transform:uppercase`,
    sold: s => `font:800 ${s}pt ${AR};letter-spacing:${(s*.013).toFixed(2)}pt;text-transform:uppercase`,
    bar: s => `font:700 ${s}pt ${AR};letter-spacing:${(s*.035).toFixed(2)}pt;text-transform:uppercase`,
    street: tr => s => `font:700 ${s}pt ${AR};letter-spacing:${(s*tr).toFixed(2)}pt;text-transform:uppercase`,
    kick: tr => s => `font:700 ${s}pt ${AR};letter-spacing:${(s*tr).toFixed(2)}pt;text-transform:uppercase`,
    eye: tr => s => `font:500 ${s}pt ${AR};letter-spacing:${(s*tr).toFixed(2)}pt;text-transform:uppercase`,
    hl: s => `font:600 ${s}pt ${AR}`,
    q: s => `font:700 ${s}pt ${AR}`,
    note: s => `font:500 ${s}pt ${AR}`,
    wu: s => `font:400 ${s}pt ${AR}`,
    name: s => `font:800 ${s}pt ${AR}`,
    tag: s => `font:700 ${s}pt ${AR};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`,
    phone: s => `font:700 ${s}pt ${AR};letter-spacing:${(s*.03).toFixed(2)}pt`,
  };
  const FADE = d => `linear-gradient(${d}, rgba(var(--nf-night-rgb),0) 0%, rgba(var(--nf-night-rgb),.5) 40%, rgba(var(--nf-night-rgb),.88) 70%, var(--nf-dark) 100%)`;
  const MASK = d => `linear-gradient(${d}, transparent 0%, #000 30%, #000 62%, transparent 92%)`;
  const CSS = `<style>
    .ss .nfs-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ss .nfs-logo.e .logo{justify-content:flex-end}
    .ss .nfs-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .nfs-logo .text{font:700 12pt/1.15 ${AR};text-align:center;color:inherit}
    .ss .nfs-hs{position:absolute;overflow:hidden}.ss .nfs-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .nfs-caps{position:absolute;white-space:nowrap}
    .ss .nfs-fade{position:absolute;pointer-events:none;background-image:${FADE('to bottom')}}
    .ss .nfs-fade::after{content:"";position:absolute;inset:0;background-image:var(--nf-grain);-webkit-mask-image:${MASK('to bottom')};mask-image:${MASK('to bottom')}}
    ${[['l', 'to left'], ['r', 'to right'], ['t', 'to top']].map(([c, d]) => `.ss .nfs-fade.${c}{background-image:${FADE(d)}}.ss .nfs-fade.${c}::after{-webkit-mask-image:${MASK(d)};mask-image:${MASK(d)}}`).join('\n    ')}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2};
    const M = document.createElement('div'); document.body.appendChild(M);
    const tmemo = new Map();
    T.tw = (t, css) => { const key = t + '|' + css; if(tmemo.has(key)) return tmemo.get(key); M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:nowrap;${css}`; M.textContent = t; const v = M.getBoundingClientRect().width*.75; tmemo.set(key, v); return v; };
    const memo = new Map();
    T.rows = (t, css, w, lh) => { const key = t + '|' + css + '|' + w.toFixed(1) + '|' + lh.toFixed(2); if(memo.has(key)) return memo.get(key);
      M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:normal;width:${w}pt;${css};line-height:${lh}pt;text-align:left`; M.textContent = t;
      const rg = document.createRange(); rg.selectNodeContents(M); const out = [];
      [...rg.getClientRects()].forEach(b => { if(b.width < .5) return; const r = out.find(x => Math.abs(x.top - b.top) < b.height*.5); if(r){ r.l = Math.min(r.l, b.left); r.r = Math.max(r.r, b.right); } else out.push({top: b.top, l: b.left, r: b.right}); });
      out.sort((a, b) => a.top - b.top); const ws = out.map(r => (r.r - r.l)*.75);
      const res = {n: out.length, ws, wide: Math.max(1, ...ws), last: ws[ws.length - 1] || 0}; memo.set(key, res); return res;
    };
    T.one = (t, face, w, max, min) => { for(let s = Math.ceil(Math.max(max, min)*2 - .02)/2; s >= min - .01; s -= .5) if(T.tw(t, face(s)) <= w) return s; return null; };
    T.done = () => M.remove();
    return T;
  };
  // the capitals, measured on the page: the cap height and where the baseline falls in a line box as tall as the type (both in em)
  const METS = {};
  const met = wt => { if(METS[wt]) return METS[wt]; const c = document.createElement('canvas').getContext('2d'); c.font = `${wt} 200px ${AR}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:${wt} 200px ${AR};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    return (METS[wt] = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}); };
  const capH = (s, wt) => met(wt || 800).cap*s;
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  // one line of capitals set by its ink: the top of the letters at y
  const caps = (slot, t, x, y, w, s, face, color, align, wt, o) => { const m = met(wt || 800), base = m.base*s; o = o || {};
    return `<div class="nfs-caps" data-slot="${slot}" data-lines="1"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y - (base - m.cap*s)}pt;width:${w}pt;height:${s}pt;${face(s)};line-height:${s}pt;color:${color};text-align:${align || 'left'}">${o.span ? `<span>${esc(t)}</span>` : esc(t)}</div>`; };
  const hair = (x, y, w) => rect(x, y, w, 1, `background:${RULE}`);

  // ---------- the house, dissolving into the field ----------
  const heroKit = (D, f) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const sup = n => window.OHEmail ? OHEmail.support(D, id, n) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)).slice(0, n);
    const focus = (w, h) => { if(hb && h > w/pAR){ const vis = w/(h*pAR), cx = (hb.left + hb.right)/2, lft = cl(cx - vis/2, 0, 1 - vis); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } };
    const X = {id, pAR, hb,
      nat: w => Math.ceil(w/pAR), min: w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)),
      max: w => Math.ceil(hb ? Math.min(w/pAR*1.15, Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR))) : w/pAR),   // at most 15% taller than the photo's own shape: the neighbors beside the house stay in view
      // where the house sits in a w x h frame (shares of the frame), as the frame will crop it
      box: (w, h) => { focus(w, h); return hb ? OHL.houseInFrame(D, id, w, h) : null; },
      // where the foot fade may start (pt from the frame's top): just under the house
      foot: (w, h) => { const b = X.box(w, h); return b ? Math.min(.985, b.bottom + .012)*h : h*.78; },
      frame: (x, y, w, h) => { focus(w, h); return OHL.photo(D, id, `left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt`); },
      // the dissolves over a frame: the foot from under the house (o.foot false: none); o.left / o.right: sideways, from the frame's
      // edge toward the house, never onto it (at most a tenth of the frame, so what stands beside the house stays in view)
      fades: (x, y, w, h, o) => { o = o || {}; const b = X.box(w, h); let s = '';
        const lf = o.left ? (b ? cl(b.left - .02, 0, .1) : .1) : 0, rf = o.right ? (b ? cl(1 - b.right - .02, 0, .1) : .1) : 0;
        if(lf >= .03) s += `<div class="nfs-fade l" style="left:${x - .5}pt;top:${y}pt;width:${w*lf + .5}pt;height:${h}pt"></div>`;
        if(rf >= .03) s += `<div class="nfs-fade r" style="left:${x + w*(1 - rf)}pt;top:${y}pt;width:${w*rf + .5}pt;height:${h}pt"></div>`;
        if(o.foot !== false){ const ft = X.foot(w, h); if(h - ft >= 2) s += `<div class="nfs-fade" style="left:${x}pt;top:${y + ft}pt;width:${w}pt;height:${h - ft + 1}pt"></div>`; }
        return s; },
      // room photos side by side rising out of the field (each dissolves at its head)
      side: (x, y, w, h) => { const p = sup(1)[0]; return p ? OHL.photo(D, p, `left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt`) : ''; },
      rooms: (x, y, w, h, n, g) => {   // never two views of one room, or two outdoor shots, side by side: one photo from each kind of room, in this order
        const kind = p => { const t = String((D.photos[p] || {}).tags || p).toLowerCase(); return /kitchen/.test(t) ? 'kitchen' : /family|living|great|openplan|open plan|den/.test(t) ? 'living' : /primary|bed/.test(t) ? 'bed' : /dining|breakfast/.test(t) ? 'dining' : /bath|powder/.test(t) ? 'bath' : /walk|entry|yard|deck|patio|balcony|porch|drive|side|exterior|front/.test(t) ? 'out' : t.replace(/\d+$/, ''); };
        const all = sup(24), ids = ['kitchen', 'living', 'bed', 'dining'].map(k => all.find(p => kind(p) === k)).filter(Boolean).concat(all).filter((p, i, a) => a.findIndex(q => kind(q) === kind(p)) === i).slice(0, n); if(!ids.length || h < 40) return ''; const pw = (w - (ids.length - 1)*g)/ids.length;
        return ids.map((p, i) => OHL.photo(D, p, `left:${x + i*(pw + g)}pt;top:${y}pt;width:${pw}pt;height:${h}pt`)).join('') + `<div class="nfs-fade t" style="left:${x}pt;top:${y - .5}pt;width:${w}pt;height:${Math.min(h*.3, 46*f)}pt"></div>`; }};
    return X;
  };

  // ---------- words ----------
  const U = t => String(t || '').toUpperCase();
  // the listing's facts as the postcards write them, and their short forms
  const facts = D => { const six = OHL.factSix(D.listing), strong = six.some(([ic]) => ic === 'lot' || ic === 'cal'), keep = six.filter(([ic]) => !(ic === 'stories' && strong));
    return {full: keep.map(([, t]) => t), short: keep.map(([ic, t]) => ic === 'bed' ? t.replace('bedroom', 'bed') : ic === 'bath' ? t.replace(' full bath', ' bath') : ic === 'area' ? t.replace(' square feet', ' sq ft') : ic === 'cal' ? t.replace('Built in', 'Built') : t)}; };
  // the postcard front's highlights (never a condition claim on a social)
  const highlights = D => [].concat((((((D.sw || {}).pc || {}).jl || {}).front || {}).highlights) || []).map(String).filter(t => t && !SocialSet.CONDITION.test(t));
  const notes = D => { const F0 = ((((D.sw || {}).pc || {}).js || {}).front || {}), n2 = [].concat(F0.note2 || []).map(String);
    const tail = n2.map(t => t.split(/(?<=[.!?])\s+/).slice(1).join(' ')).filter(Boolean);
    return n2.concat(tail, ['I can tell you what your home could bring today.'])
      .filter((t, i, a) => t && a.indexOf(t) === i && !SocialSet.CONDITION.test(t)); };

  // JUST / LISTED stacked as on the postcard front: 800 caps, the second line .96 of the size under the first
  const stackH = s => capH(s) + s*.96;
  const stackW = (T, s) => Math.max(...SocialSet.M.split(' ').map(t => T.tw(U(t), F.word(s)))) + 2;
  const stack = (T, x, y, s, cw) => SocialSet.M.split(' ').map((t, i) => { const tw = T.tw(U(t), F.word(s)); return caps('moment' + (i ? '.' + i : ''), t, x + (cw ? (cw - tw)/2 : 0), y + i*s*.96, tw + 4, s, F.word, ON); }).join('');   // cw: each word centered in a column that wide
  // the place as the eyebrow: accent caps, tracked as wide as the measure allows
  const eyebrow = (T, t, w, s, face) => { for(const tr of [.38, .3, .22, .15, .1]){ const fc = (face || F.eye)(tr); if(T.tw(t, fc(s)) <= w) return {s, h: s*1.3, w: T.tw(t, fc(s)),
      html: (x, y, ww, align, color) => txt('place', t, x, y, ww || w, s, 1.3, fc, color || ACC, {small: 1, align})}; }
    return null; };
  // the solid accent bar: the street in dark 700 caps and the city line directly under it in small tracked caps, both centered
  // (one: a street much shorter than the bar takes the city on its own line, after it, so the bar's ends are not left empty)
  const bar = (T, Li, w, k, cap, pvK, one) => { const px = r2(10*T.f), t = U(Li.address), s = T.one(t, F.bar, w - 2*px, Math.min(T.FE*1.3*k, cap || 999), T.FE) || T.one(t, F.bar, w - 2*px, T.FE, 9); if(!s) return null;
    const city = U(OHL.place(Li)), cs = T.FS, cf = [.22, .14, .08, .03].map(F.kick).find(fc => T.tw(city, fc(cs)) <= w - 2*px) || F.kick(0), sw = T.tw(t, F.bar(s));
    if(one){ const cf1 = F.kick(.1); for(let s1 = s; s1 >= Math.max(T.FE, s*.8) - .01; s1 -= .5){ const sw1 = T.tw(t, F.bar(s1)), c1 = r2(Math.max(T.FS, s1*.55)), cw1 = T.tw(city, cf1(c1)), gap = r2(s1*.7), tot = sw1 + gap + cw1; if(tot > w - 2*px) continue;
        const pv1 = r2(7*T.f*cl(k, .7, 1)*(pvK || 1)*1.25), h1 = pv1 + capH(s1, 700) + pv1;
        return {h: h1, s: s1, sw: sw1, html: (x, y) => { const x0 = x + (w - tot)/2; return rect(x, y, w, h1, `background:${BAR}`) + caps('address', Li.address, x0, y + pv1, sw1 + 4, s1, F.bar, ONB, 'left', 700, {span: 1})
          + caps('place', city, x0 + sw1 + gap, y + pv1 + capH(s1, 700) - capH(c1, 700), cw1 + 4, c1, cf1, ONB, 'left', 700, {small: 1}); }}; }
      return null; }
    const pv = r2(7*T.f*cl(k, .7, 1)*(pvK || 1)), gp = r2((k >= 1 ? 5 : 3.5)*T.f), h = pv + capH(s, 700) + gp + capH(cs, 700) + pv;
    return {h, s, sw, html: (x, y) => rect(x, y, w, h, `background:${BAR}`) + caps('address', Li.address, x + px, y + pv, w - 2*px, s, F.bar, ONB, 'center', 700, {span: 1})
      + caps('place', city, x + px, y + pv + capH(s, 700) + gp, w - 2*px, cs, cf, ONB, 'center', 700, {small: 1})}; };
  // the highlights: a square accent mark, 600 type, hairlines between the rows; spread over the height they are given
  const bullets = (T, items, w, k) => { if(!items.length) return null; const mk = r2(5.5*T.f), mg = r2(7*T.f);
    const s = Math.min(...items.map(t => T.one(t, F.hl, w - mk - mg - 2, T.FB*1.2*Math.max(k, .85), T.FB) || 0)); if(!s) return null;
    return {n: items.length, s, min: items.length*s*1.8, max: items.length*s*2.7, html: (x, y, h) => { const rh = Math.min(h/items.length, s*2.7), y0 = y + (h - rh*items.length)/2;
      return items.map((t, i) => (i ? hair(x, y0 + i*rh - .5, w) : '') + rect(x, y0 + i*rh + (rh - mk)/2, mk, mk, `background:${BAR}`)
        + txt('hl.' + i, t, x + mk + mg, y0 + i*rh + (rh - s*1.3)/2, w - mk - mg, s, 1.3, F.hl, ON)).join(''); }}; };
  // the highlights that set on one line in a column w wide; facts make up the count when the highlights run short (and are then
  // left out of the facts line)
  const bulletItems = (T, D, w, n, FX, topUp) => { const mk = r2(5.5*T.f) + r2(7*T.f) + 2, ok = t => T.tw(t, F.hl(T.FB)) <= w - mk;
    const items = highlights(D).filter(ok).slice(0, n), used = [];
    if(topUp) FX.full.forEach((t, i) => { if(items.length < Math.min(n, 2) && ok(t)){ items.push(t.charAt(0).toUpperCase() + t.slice(1)); used.push(i); } });
    return {items, used}; };
  // the facts in tracked accent caps (the postcard's foot), all of the list where they fit: on one line (the tracking closed up
  // before a fact is dropped), or on two lines where maxLines allows
  const factCaps = (T, list, w, k, align, maxLines) => { const SEP = '  \u00b7  ', max = T.FB*1.12*Math.min(k, 1.3);
    for(let n = list.length; n >= 2; n--){ const it = list.slice(0, n);
      for(const [fc, tf] of [[F.kick(.11), U], [F.kick(.05), U]]){ const t = it.map(tf).join(SEP), s = T.one(t, fc, w, max, T.FB); if(!s) continue;
        return {n, h: s*1.3, html: (x, y) => txt('facts', t, x, y, w, s, 1.3, fc, ACC, {align: align || 'left'})}; }
      if((maxLines || 1) < 2 || n < 3) continue;
      for(const [fc, tf] of [[F.kick(.11), U], [F.kick(.05), U], [F.kick(.02), U]]){ const cut = Math.ceil(n/2), ls = [it.slice(0, cut), it.slice(cut)].map(l => l.map(tf).join(SEP)), s = Math.min(...ls.map(t => T.one(t, fc, w, max, T.FB) || 0)); if(!s) continue;
        return {n, h: 2*s*1.34, html: (x, y) => ls.map((t, i) => txt('facts' + (i ? '.1' : ''), t, x, y + i*s*1.34, w, s, 1.3, fc, ACC, {align: align || 'left'})).join('')}; } }
    return null; };
  // the street in tracked 700 caps (Just Sold): one line down to the floor size, else two lines at the floor with the last two words
  // kept together. Never shortened. Set inside a span, so the shared address pass leaves it as written.
  const street = (T, Li, w, max) => { const t = U(Li.address);
    for(const tr of [.07, .03, 0]){ const fc = F.street(tr), s = T.one(t, fc, w - 2, max, T.FE); if(s) return {t, s, n: 1, fc, w: T.tw(t, fc(s)), h: s*1.2}; }
    return null; };
  const stTxt = (st, x, y, w, align, color) => txt('address', st.t, x, y, w, st.s, 1.2, st.fc, color || ON, {align, html: `<span>${esc(st.t)}</span>`});
  // the street with the city line directly under it in tracked accent caps (beside it, at the line's right end, where o.beside and the
  // line holds both)
  const address = (T, Li, w, max, o) => { o = o || {}; let st = street(T, Li, w, max); if(!st) return null;
    const city = U(OHL.place(Li)), csOf = s => r2(Math.max(T.FS, Math.min(T.FS*1.15, s*.6))), cfOf = cs => [.24, .16, .1, .04].map(F.kick).find(fc => T.tw(city, fc(cs)) <= w - 2) || F.kick(0);
    // beside 2 (the Google post, where neither the city beside the street nor the logo beside the address holds): the city's tracking
    // closes up to the room the street leaves it on the line; where one line still will not go, the city over the state and ZIP, two
    // short lines right-aligned at the margin, the pair centered on the street
    if(o.beside === 2){ const cut = city.lastIndexOf(','), two = cut > 0 ? [city.slice(0, cut + 1), city.slice(cut + 1).trim()] : null, gapS = 14*T.f;
      const sideOf = q => { const cs = csOf(q.s), room = w - q.w - gapS;
        for(const ls of (two ? [[city], two] : [[city]])){ const cf = [.24, .16, .1, .04, 0].map(F.kick).find(fc => Math.max(...ls.map(t => T.tw(t, fc(cs)))) <= room - 2);
          if(cf) return {ls, cs, cf, cw: Math.max(...ls.map(t => T.tw(t, cf(cs))))}; }
        return null; };
      if(!sideOf(st)) for(let m = Math.floor(st.s*2)/2 - .5; m >= Math.max(T.FE, st.s*.75) - .01; m -= .5){ const q = street(T, Li, w, m); if(q && sideOf(q)){ st = q; break; } }
      const sd = sideOf(st); if(!sd) return null; const ch = sd.ls.length*sd.cs*1.3, h = Math.max(st.h, ch);
      return {h, st, w, html: (x, y) => stTxt(st, x, y + (h - st.h)/2, st.w + 4, 'left')
        + sd.ls.map((t, i) => txt('place' + (i ? '.2' : ''), t, x + w - sd.cw - 2, sd.ls.length > 1 ? y + (h - ch)/2 + i*sd.cs*1.3 : y + (h - st.h)/2 + st.s*1.2*.8 - sd.cs*1.3*.8, sd.cw + 2, sd.cs, 1.3, sd.cf, ACC, {small: 1, align: 'right'})).join('')}; }
    // (beside: the street a little smaller, never under three quarters of its size, where that lets the city share its line)
    if(o.beside){ const fits = q => q.w + 14*T.f + T.tw(city, cfOf(csOf(q.s))(csOf(q.s))) <= w; if(!fits(st)) for(let m = Math.floor(st.s*2)/2 - .5; m >= Math.max(T.FE, st.s*.75) - .01; m -= .5){ const q = street(T, Li, w, m); if(q && fits(q)){ st = q; break; } } }
    const cs = csOf(st.s), cf = cfOf(cs), cw = T.tw(city, cf(cs));
    const side = o.beside && st.w + 14*T.f + cw <= w, h = side ? st.h : st.h + cs*1.3;
    return {h, st, w: side ? w : Math.max(st.w, cw), html: (x, y, ww, align) => stTxt(st, x, y, side ? st.w + 4 : ww || w, side ? 'left' : align)
      + (side ? txt('place', city, x + w - cw - 2, y + st.s*1.2*.8 - cs*1.3*.8, cw + 2, cs, 1.3, cf, ACC, {small: 1}) : txt('place', city, x, y + st.h, ww || w, cs, 1.3, cf, ACC, {small: 1, align}))}; };

  // ---------- the agent on the field: the name in 800, REALTOR(R) in small tracked caps, the phone in the accent, the one logo ----------
  // 'row': the lines at the left (after the headshot), the logo at the right end. 'line': one line across. 'stack': the lines with the
  // logo centered under them.
  const agent = (D, T, w, k, mode, o) => { o = o || {};
    const A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), gap = 10*T.f;
    const tone = window.NFTone || 'dark';   // which logo version reads on the field (set with the brand colors in social.html)
    const sizes = cw => { const ns = T.one(A.name || '', F.name, cw, T.FB*1.55*k, T.FB*1.1), ps0 = r2(Math.max(T.FB, T.FB*1.2*k)), ds0 = r2(Math.max(T.FS, T.FS*Math.min(k, 1.3))); if(!ns) return null;
      // REALTOR(R) rides on the phone's line; it steps down to its floor size before it takes a line of its own
      let ds = ds0, dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0, ps = null, inl = true;
      for(const d of (nar ? [ds0, T.FS] : [ds0])){ const dw = nar ? T.tw('REALTOR®', F.tag(d)) : 0;
        for(let s = ps0; s >= T.FB - .01 && !ps; s -= .5) if(T.tw(A.phone || '', F.phone(s)) + (nar ? s*.6 : 0) + dw <= cw){ ps = s; ds = d; dW = dw; }
        if(ps) break; }
      if(!ps){ inl = false; ps = T.one(A.phone || '', F.phone, cw, ps0, T.FB); if(!ps) return null; }
      const wide = Math.max(T.tw(A.name || '', F.name(ns)), inl ? dW + (nar ? ps*.6 : 0) + T.tw(A.phone || '', F.phone(ps)) : Math.max(dW, T.tw(A.phone || '', F.phone(ps))));
      return {ns, ps, ds, dW, inl, wide, th: ns*1.18 + 2*T.f + (inl || !nar ? 0 : ds*1.3 + T.f) + ps*1.3}; };
    // the phone first on its line, REALTOR(R) after it (the postcard's name over phone, the designation beside)
    const lines = (S, x, y, cw, a) => { let s = txt('agent.name', A.name || '', x, y, cw, S.ns, 1.18, F.name, ON, {align: a}), yy = y + S.ns*1.18 + 2*T.f;
      const pw = T.tw(A.phone || '', F.phone(S.ps));
      if(S.inl && nar){ const tot = S.dW + S.ps*.6 + pw, x0 = a === 'left' ? x : x + (cw - tot)/2;
        s += txt('agent.phone', A.phone || '', x0, yy, pw + 2, S.ps, 1.3, F.phone, ACC);
        s += txt('agent.desig', 'REALTOR®', x0 + pw + S.ps*.6, yy + S.ps*1.3*.78 - S.ds*1.3*.78, S.dW + 2, S.ds, 1.3, F.tag, SOFT, {small: 1}); }
      else { if(nar){ s += txt('agent.desig', 'REALTOR®', x, yy, cw, S.ds, 1.3, F.tag, SOFT, {small: 1, align: a}); yy += S.ds*1.3 + T.f; }
        s += txt('agent.phone', A.phone || '', x, yy, cw, S.ps, 1.3, F.phone, ACC, {align: a}); }
      return s; };
    const logo = (x, y, lw, lh, end) => `<div class="abs nfs-logo${end ? ' e' : ''}" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${ON}">${OHL.logo(D, tone, '')}</div>`;
    const hs = (x, y, hw, hh) => `<div class="abs nfs-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    if(mode === 'row' || mode === 'text'){   // 'text': the lines (after the headshot) with no logo: the logo stands elsewhere
      const text = mode === 'text', lmin = text ? -gap*1.4 : Math.max(56*T.f, w*(hsOn ? .27 : .38));
      for(const h0 of (hsOn ? [1] : [0])){
        const probe = sizes(w), hsW = h0 && probe ? Math.round(probe.th*(text ? .64 : .8)) : 0, cw = w - lmin - gap*1.4 - (h0 ? hsW + gap : 0), S = sizes(cw); if(!S) continue;
        const tx = (h0 ? hsW + gap : 0), lh = S.th*1.1, lw = Math.min(w - tx - S.wide - gap*1.4, lh*3.8);
        return {h: S.th, hs: !!h0, lw, html: (x, y) => (h0 ? hs(x, y, hsW, S.th) : '') + lines(S, x + tx, y, S.wide + 2, 'left') + (text ? '' : logo(x + w - lw, y + (S.th - lh)/2, lw, lh, 1))};
      }
      return null;
    }
    // 'logo': the logo alone, centered in a box lw x lh
    if(mode === 'logo') return {html: (x, y, lw, lh) => logo(x, y, lw, lh)};
    // 'tower': a narrow column, everything centered: the headshot, the name, REALTOR(R), the phone, the logo
    if(mode === 'tower'){ const ns = T.one(A.name || '', F.name, w - 2, T.FB*1.55*k, T.FB*1.1), ps = T.one(A.phone || '', F.phone, w - 2, Math.max(T.FB, T.FB*1.2*k), T.FB), ds = T.FS; if(!ns || !ps) return null;
      const hw = hsOn ? r2(Math.min(w*.4, 40*T.f*Math.max(k, .8))) : 0, hh = hw*1.12, lh = r2(Math.min(w/3.7, T.FB*2.3)), tg = 2*T.f;
      const th = (hsOn ? hh + 5*T.f : 0) + ns*1.18 + tg + (nar ? ds*1.3 + tg : 0) + ps*1.3 + 6*T.f + lh;
      return {h: th, hs: hsOn, html: (x, y) => { let s = '', yy = y; if(hsOn){ s += hs(x + (w - hw)/2, yy, hw, hh); yy += hh + 5*T.f; }
        s += txt('agent.name', A.name || '', x, yy, w, ns, 1.18, F.name, ON, {align: 'center'}); yy += ns*1.18 + tg;
        if(nar){ s += txt('agent.desig', 'REALTOR®', x, yy, w, ds, 1.3, F.tag, SOFT, {small: 1, align: 'center'}); yy += ds*1.3 + tg; }
        s += txt('agent.phone', A.phone || '', x, yy, w, ps, 1.3, F.phone, ACC, {align: 'center'}); yy += ps*1.3 + 6*T.f;
        return s + logo(x, yy, w, lh); }}; }
    // 'line': the name, the phone and REALTOR(R), the logo, on one line spread over the width (the headshot first when there is one)
    if(mode === 'line'){
      const ns = T.one(A.name || '', F.name, w*.4, T.FB*1.55*k, T.FB*1.1), ps = r2(Math.max(T.FB, T.FB*1.2*k)), ds = r2(Math.max(T.FS, T.FS*Math.min(k, 1.3))); if(!ns) return null;
      // (o.noLogo: the logo stands elsewhere; the phone and REALTOR(R) then close the line at its right end)
      const nW = T.tw(A.name || '', F.name(ns)), dW = nar ? T.tw('REALTOR®', F.tag(ds)) + ps*.6 : 0, pW = T.tw(A.phone || '', F.phone(ps)), lh = r2(ns*1.5), lw = o.noLogo ? 0 : Math.min(w*.3, lh*3.6);
      for(const h0 of (hsOn ? [1] : [0])){ const hsW = h0 ? Math.round(lh*.8) : 0, x1 = h0 ? hsW + gap : 0, slack = w - x1 - nW - dW - pW - lw; if(slack < 2*gap*1.3) continue;
        return {h: lh, hs: !!h0, lw, html: (x, y) => { const mx = o.noLogo ? x + w - pW - dW - 2 : x + x1 + nW + slack/2, by = y + lh*.5 + ns*.36;
          return (h0 ? hs(x, y, hsW, lh) : '') + txt('agent.name', A.name || '', x + x1, by - ns*1.18*.78, nW + 2, ns, 1.18, F.name, ON)
            + txt('agent.phone', A.phone || '', mx, by - ps*1.3*.78, pW + 2, ps, 1.3, F.phone, ACC) + (nar ? txt('agent.desig', 'REALTOR®', mx + pW + ps*.6, by - ds*1.3*.78, dW, ds, 1.3, F.tag, SOFT, {small: 1}) : '')
            + (lw ? logo(x + w - lw, y, lw, lh, 1) : ''); }}; }
      return null;
    }
    for(const h0 of (hsOn ? [1] : [0])){
      const p0 = sizes(w); if(!p0) return null;
      const lh0 = r2(Math.max(p0.ns*1.4, T.FB*1.85)), hsW = h0 ? Math.round((p0.th + 6*T.f + lh0)*.72) : 0, cw = w - (h0 ? hsW + gap : 0), S = sizes(cw); if(!S) continue;
      const tWd = Math.min(cw, S.wide + 2), lh1 = r2(Math.max(S.ns*1.4, T.FB*1.85)), lw = Math.min(cw, Math.max(tWd, lh1*3.4)), lh = Math.min(lh1, r2(lw/4)), full = S.th + 6*T.f + lh, gW = Math.max(tWd, lw);
      return {h: full, hs: !!h0, lw, html: (x, y) => { const tot = (h0 ? hsW + gap : 0) + gW, x0 = x + (w - tot)/2, tx = x0 + (h0 ? hsW + gap : 0);
        return (h0 ? hs(x0, y, hsW, full) : '') + lines(S, tx + (gW - tWd)/2, y, tWd, 'center') + logo(tx + (gW - lw)/2, y + S.th + 6*T.f, lw, lh); }};
    }
    return null;
  };

  // ---------- Just Listed: the writer's lines ----------
  // The writer's sentences in order (the first always kept), as many as fill maxN lines or fewer at width w: every line 80%+ and the
  // last 90%+ of the measure (owner 11/8), the measure narrowed a little or the type raised up to 12% to get there. A pick that names
  // a nearby place with its distance is preferred. Nothing a shown highlight or fact already says.
  const writeUp = (T, D, w, s0, maxN, minLine) => { minLine = minLine || 0; T.wu = T.wu || {}; const key = [Math.round(w), s0, maxN].join('|'); if(key in T.wu) return T.wu[key];
    const STOP = /^(with|from|into|over|under|through|there|their|which|where|about|house|home|first|second|third|floor|both|whole|area|room|rooms|built|this|that|have|been|were|runs|run)$/, keys = t => String(t).toLowerCase().match(/[a-z]{4,}/g) || [];
    const said = new Set(highlights(D).flatMap(keys).filter(k => !STOP.test(k))), stem = k => k.replace(/(ing|ed|es|s)$/, '');   // what the highlights already say (owner: a write-up never repeats a bullet)
    const saidStem = new Set([...said].map(stem));
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing).concat(highlights(D))).filter(t => !keys(t).some(k => !STOP.test(k) && saidStem.has(stem(k)))).slice(0, 7), near = /\bmiles?\b/i; let best = null;
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of [1, .96, .92]) for(const s of [s0, r2(s0*1.06), r2(s0*1.12)]){ const r = T.rows(t, F.wu(s), w*m, s*1.42); if(r.n > maxN || r.n < 2) continue;
        if(r.last < Math.max(.9*w*m, minLine) || r.ws.slice(0, -1).some(x => x < Math.max(.8*w*m, minLine))) continue;
        const sc = r.n*100 + (near.test(t) ? 80 : 0) + m*20 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc, just: r.ws.slice(0, -1).every(x => x >= .94*w*m)}; } }
    if(best){ best.h = best.n*best.s*1.42 + best.s*.15;
      best.html = (x, y) => txt('writeup', best.t, x, y, best.w, best.s, 1.42, F.wu, SOFT, {n: best.n}); }
    return (T.wu[key] = best); };

  // ---------- Just Sold ----------
  // the title band: the accent bar grown into a band, JUST SOLD in dark 800 caps as large as the band's width holds (o.wordK: a share of
  // that), centered. x, bw: the band's left edge and width (the whole image, or the column beside the house).
  const banner = (T, x, bw, k, o) => { o = o || {}; const pin = r2(Math.min(16*T.f, bw*.06)), word = U(SocialSet.M), full = T.one(word, F.sold, bw - 2*pin, 400, T.FE); if(!full) return null;
    const ws = Math.max(T.FE, r2(Math.min(full*(o.wordK || 1), o.wordMax || 999))), ww = T.tw(word, F.sold(ws)), bp = r2(Math.min(11*T.f*cl(k, .8, 1.1), ws*.36 + 3, o.bpMax || 99)), h = capH(ws) + 2*bp;
    return {h, ws, html: y => rect(x, y, bw + 1, h, `background:${BAR}`) + caps('moment', SocialSet.M, x + (bw - ww)/2, y + bp, ww + 4, ws, F.sold, ONB)}; };
  // The seller note: the fullest of the agent's own notes that sets in maxN lines or fewer at width w, every line 80%+ and the last
  // 90%+ (the measure narrowed a little, or the type raised up to 13%, to get there)
  const pickNote = (T, D, w, ns0, maxN, minLine, maxH) => { minLine = minLine || 0; maxH = maxH || 1e9; const list = notes(D);
    for(let n = Math.min(maxN, 9); n >= 1; n--) for(const m of [1, .96, .92, .88]) for(let s = r2(ns0*1.13); s >= Math.max(T.FB, ns0*.84) - .01; s -= .5) for(const t of list){
      const ww = w*m, r = T.rows(t, F.note(s), ww, s*1.36); if(r.n !== n || n*s*1.36 + s*.15 > maxH) continue;
      if(n === 1 ? r.wide < Math.max(.8*ww, minLine) : (r.last < Math.max(.9*ww, minLine) || r.ws.slice(0, -1).some(x => x < Math.max(.8*ww, minLine)))) continue;
      return {t, n, s, w: ww, wide: r.wide}; }
    // none of the agent's notes fills its lines here: the approved set's own line, one sentence to a line
    const two = SocialSet.SOLD_POST.split(/(?<=[.!?])\s+/);
    for(let s = r2(ns0*1.13); s >= T.FB - .01; s -= .5){ if(s*1.36*1.15 > maxH) continue; if(T.tw(SocialSet.SOLD_POST, F.note(s)) <= w && T.tw(SocialSet.SOLD_POST, F.note(s)) >= Math.max(.8*w, minLine)) return {t: SocialSet.SOLD_POST, n: 1, s, w};
      if(maxN >= 2 && 2*s*1.36 + s*.15 <= maxH && Math.max(...two.map(t => T.tw(t, F.note(s)))) <= w) return {t: SocialSet.SOLD_POST, n: 2, s, w: Math.max(...two.map(t => T.tw(t, F.note(s)))) + 2, br: 1}; }
    return null; };
  // "Thinking about selling?" in the accent over the note. o.lines: the most note lines; o.room: the height (pt) it may take.
  const sell = (D, T, w, k, o) => {
    let ql = o.noQ ? [] : [Q], qs = o.noQ ? T.FB : T.one(Q, F.q, w, T.FE*1.2*k*(o.qK || 1), T.FB);
    if(!qs){ ql = ['Thinking about', 'selling?']; qs = T.one(ql[0], F.q, w, T.FE*1.2*k, T.FB); if(!qs) return null; }
    const qh = ql.length*qs*1.22, ns0 = r2(Math.max(T.FB, T.FB*1.08*k)), gq = ql.length ? 4*T.f : 0;
    const maxN = o.lines != null ? o.lines : Math.floor((o.room - qh - gq - T.FB*.2)/(T.FB*1.36));
    const pk = maxN > 0 ? pickNote(T, D, w, ns0, maxN, o.minLine, o.room != null ? o.room - qh - gq : 0) : null; if(o.lines && !pk) return null;
    const nh = pk ? pk.n*pk.s*1.36 + pk.s*.15 : 0, h = qh + (pk ? gq + nh : 0);
    return {h, len: pk ? pk.t.length : 0, n: pk ? pk.n : 0, tw: Math.max(ql.length ? Math.max(...ql.map(t => T.tw(t, F.q(qs)))) : 0, pk ? pk.wide || pk.w : 0), qh, qw: ql.length ? Math.max(...ql.map(t => T.tw(t, F.q(qs)))) : w, html: (x, y) => { let s = '', yy = y;
      ql.forEach((t, i) => { s += txt('sold.q' + (i ? 2 : ''), t, x, yy, w, qs, 1.22, F.q, ACC); yy += qs*1.22; });
      if(pk) s += txt('sold.note', pk.t, x, yy + gq, pk.w, pk.s, 1.36, F.note, ON, {n: pk.n, html: pk.br ? esc(pk.t).replace(/([.!?])\s+/, '$1<br>') : null});
      return s; }};
  };

  const NF = {};
  // ================= post, pin, story, square =================
  // The house runs off the top and both sides and dissolves into the field at its foot; the words start in the dissolve.
  // Just Listed: the place eyebrow; JUST / LISTED stacked with the highlights beside it; the accent bar with the street; the facts in
  // tracked accent caps; the writer's lines; a hairline; the agent and the logo.
  // Just Sold: the title band across the head (on a story: under the house, clear of the top 250 px), the house, the street, the
  // question and the agent's note, a hairline, the agent and the logo.
  // On a story two rooms rise out of the field at the foot, under the words.
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', story = shape === 'story';
    const SAFE = story ? 94 : 0, pad = r2(16*f), w = W - 2*pad, g = r2(8*f), FX = facts(D), place = U(OHL.place(Li)), BOT = story ? H - SAFE - r2(4*f) : H - r2((shape === 'square' ? 10 : 13)*f);
    // the house frame: the full width; narrowed to 78% with a room beside it only where the full width cannot keep the whole house
    // clear of the words (owner 11/16: a narrowed photo gets a room photo at its side, never bare field)
    let HW = W, XM, tyMin, tyNat;
    const LEAD = shape === 'square' ? .5 : .62, FMIN = (shape === 'square' ? 6 : 9)*f;
    // the tallest frame whose dissolve (from under the house to the frame's foot) is far enough down (62%; half on a square) where the words start at ty
    const frameFor = ty => { for(let ph = XM; ph >= ty; ph -= 1){ const ft = X.foot(HW, ph); if(ph - ft >= FMIN && ty >= ft + LEAD*(ph - ft)) return ph; } return null; };
    const geo = hw => { HW = hw; XM = Math.min(X.max(HW), Math.ceil(X.nat(HW)*1.1)); tyMin = null; tyNat = null;
      for(let ty = Math.floor(X.min(HW)*.7); ty <= XM && (tyMin == null || tyNat == null); ty += 2){ const ph = frameFor(ty); if(ph == null) continue; if(tyMin == null) tyMin = ty; if(ph >= X.nat(HW) - 1) tyNat = ty; }
      if(tyMin == null) tyMin = X.min(HW); if(tyNat == null) tyNat = Math.max(tyMin, X.nat(HW)); };
    geo(W);
    const duo = k => { const gap = r2(13*f), sMax = Math.min(T.one('LISTED', F.word, w*.5, 300, FE) || FE, r2(FE*(1.5 + 1.1*k))), sMin = Math.max(FE*1.9, sMax*.78), all = highlights(D).length;
      let pick = null;
      for(let ss = sMax; ss >= sMin - .01 && !pick; ss -= 1){ const sw = stackW(T, ss), cw = w - sw - gap, it = bulletItems(T, D, cw, 3, FX, true);
        if(it.items.length >= Math.min(3, Math.max(all, 2)) && it.used.length === Math.max(0, 2 - all)) pick = {ss, sw, cw, it}; }
      if(!pick){ const ss = sMax, sw = stackW(T, ss), cw = w - sw - gap; pick = {ss, sw, cw, it: bulletItems(T, D, cw, 3, FX, true)}; }
      if(pick.it.items.length < 2) return null;
      const bl = bullets(T, pick.it.items, pick.cw, k); if(!bl) return null;
      const sh = stackH(pick.ss), h = Math.max(sh, bl.min);
      return {h, used: pick.it.used, html: (x, y) => stack(T, x, y + (h - sh)/2, pick.ss) + bl.html(x + pick.sw + gap, y, h)}; };
    const build = (k, o) => { const kk = Math.min(k, 1.3), ag = agent(D, T, w, kk, 'row') || agent(D, T, w, kk, 'stack'); if(!ag) return null;
      if(!sold){
        let head = null;
        if(o.head === 'duo') head = duo(k);
        else { const ws = T.one(U(SocialSet.M), F.word, w, FE*2.3*k, FE*1.3); if(ws) head = {h: capH(ws), ws, used: [], html: (x, y) => caps('moment', SocialSet.M, x, y, w, ws, F.word, ON)}; }
        if(!head) return null;
        const br = bar(T, Li, w, kk, head.ws ? head.ws/1.25 : 0); if(!br) return null;
        const rest = FX.short.filter((_, i) => !head.used.includes(i)), fl = o.facts ? factCaps(T, rest.slice(0, shape === 'square' ? 4 : 5), w, k, 'left', shape === 'square' ? 1 : 2) : null; if(o.facts && !fl) return null;
        const wu = o.wl ? writeUp(T, D, w, r2(Math.max(FB, FB*1.05*kk)), o.wl, W*.815) : null; if(o.wl && (!wu || wu.n < Math.min(o.wl, 2))) return null;
        const textH = head.h + g*1.15 + br.h + (fl ? g*.9 + fl.h : 0) + (wu ? g*.7 + wu.h : 0) + g*1.1 + 1 + g + ag.h;
        return {head, br, fl, wu, ag, textH, top: 0};
      }
      const bn = banner(T, 0, W, k, {wordK: o.bk*cl(.6 + .4*k, .6, 1)}); if(!bn) return null;
      const st = address(T, Li, w, Math.min(FE*1.45*kk, bn.ws/1.25)); if(!st) return null;
      const st2 = address(T, Li, w, Math.min(FE*1.45*kk, bn.ws/1.25), {beside: 1});
      let sl = sell(D, T, w, kk, {lines: o.nl, minLine: W*.815, noQ: o.noQ, qK: 1.7}); if(!sl) return null;
      // (a question that would leave a wide empty room at its right: set a size or two larger, still under JUST SOLD)
      if(!o.noQ && (w - sl.qw)*(sl.qh + g*1.6) > .028*W*H) for(const qk of [2.6, 2.3, 2]){ const s2 = sell(D, T, w, kk, {lines: o.nl, minLine: W*.815, qK: qk}); if(s2 && s2.qw > sl.qw*1.08){ sl = s2; break; } }
      const textH = st.h + g*.9 + sl.h + g*1.1 + 1 + g + ag.h;
      return {bn, st, st2: st2 && st2.w === w ? st2 : null, sl, ag, textH, top: bn.h + (story ? g*1.2 : 0)};
    };
    const tyOf = B => BOT - B.textH - B.top;
    const opts = sold ? [].concat(...[4, 3, 2, 1].map(nl => [1, .82, .66, .52].map(bk => ({nl, bk}))), [{nl: 2, bk: .52, noQ: 1}, {nl: 1, bk: .52, noQ: 1}, {nl: 1, bk: .44, noQ: 1}, {nl: 1, bk: .38, noQ: 1}]) : (shape === 'square' ? [] : [{wl: 3, facts: 1, head: 'duo'}, {wl: 2, facts: 1, head: 'duo'}, {wl: 0, facts: 1, head: 'duo'}, {wl: 0, facts: 0, head: 'duo'}]).concat([{wl: 2, facts: 1, head: 'one'}, {wl: 0, facts: 1, head: 'one'}, {wl: 0, facts: 0, head: 'one'}]);   // (a square holds the word on one line: one layout for every house)
    const KMAX = {post: 1.6, pin: 1.7, story: 1.7, square: 1.4}[shape] || 1.5, KMIN = .6;
    let pick = null;
    for(const hw of [W, Math.round(W*.78)]){ geo(hw);
      for(const o of opts){
        const b1 = build(KMIN, o); if(!b1 || tyOf(b1) < tyMin) continue;
        const need = Math.min(tyOf(b1), tyNat);
        let k = KMIN; for(let t = KMAX; t >= KMIN; t -= .025){ const b = build(t, o); if(b && tyOf(b) >= need){ k = t; break; } }
        pick = {o, k}; break;
      }
      if(pick) break; }
    pick = pick || {o: sold ? {nl: 1, bk: .38, noQ: 1} : {wl: 0, facts: 0, head: 'one'}, k: KMIN};
    const B = build(pick.k, pick.o) || build(KMIN, pick.o) || build(KMIN, sold ? {nl: 0, bk: .52} : {wl: 0, facts: 0, head: 'one'});
    // the words start at ty under the frame's top; room the frame cannot take opens between the lines (on a story it goes to the rooms)
    let ty = Math.max(tyOf(B), 0), spare = 0; if(ty > XM){ spare = story ? 0 : ty - XM; ty = XM; }
    const ph = sold && story ? ty + 2 : frameFor(ty) || Math.max(ty, X.min(HW)), e = spare/5;   // (a story's title band covers the frame's foot)
    const hero = (py, ph) => X.frame(0, py, HW, ph) + (HW < W ? X.side(HW + r2(3*f), py, W - HW - r2(3*f), ph) : '') + X.fades(0, py, HW, ph, {foot: false})
      + `<div class="nfs-fade" style="left:0;top:${py + X.foot(HW, ph)}pt;width:${W}pt;height:${ph - X.foot(HW, ph) + 1}pt"></div>`;
    let h = CSS, y, e2 = 0;
    if(!sold){
      h += hero(0, ph); y = ty + e;
      h += B.head.html(pad, y); y += B.head.h + g*1.15 + e;
      h += B.br.html(pad, y); y += B.br.h;
      if(B.fl){ y += g*.9 + e*.5; h += B.fl.html(pad, y); y += B.fl.h; }
      if(B.wu){ y += g*.7 + e*.5; h += B.wu.html(pad, y); y += B.wu.h; }
    } else {
      const py = story ? 0 : B.bn.h;
      h += hero(py, ph);
      if(story){ h += B.bn.html(ty); y = ty + B.top; } else { h += B.bn.html(0); y = B.bn.h + ty + e; }
      // (an address that would leave a wide empty room at its right below the photo: the city at the street's line end; the line it
      // frees opens evenly between the blocks under it)
      const pb = py + ph, holeA = (w - B.st.w)*Math.max(0, y + B.st.h - Math.max(y, pb));
      if(B.st2 && holeA > .018*W*H){ const d = (B.st.h - B.st2.h)/3; h += B.st2.html(pad, y, w); y += B.st2.h + g*.9 + e + d; e2 = d; }
      else { h += B.st.html(pad, y, w); y += B.st.h + g*.9 + e; }
      h += B.sl.html(pad, y); y += B.sl.h;
    }
    y += g*1.1 + e + e2; h += hair(pad, y, w); y += 1 + g + e + e2;
    h += B.ag.html(pad, y); y += B.ag.h;
    if(story) h += X.rooms(0, y + r2(10*f), W, H - y - r2(10*f), 2, r2(3*f));
    T.done();
    return h;
  };

  // ================= wide (X) and Google Business Profile =================
  // The house is the main image: at least 45% of the width, running off the top and one side, dissolving at its foot and (a short way)
  // toward the words; never tighter than 15% over the photo's own shape.
  // Just Listed: the house at the right; the stack centered in the column beside it; the accent bar (street, city under it) across
  // the image under both. Google: the agent in the column under the stack (headshot, name, REALTOR(R), phone, logo), the facts in
  // tracked caps under the bar. X: the facts in the column under the stack, the agent and the logo along the foot.
  // Just Sold: the house at the left from the top edge; the title band heads the column beside it, then the question and the note.
  // Google: the street and the city across the image under them, a hairline, the agent and the logo along the foot. X: the agent
  // closes the column; the street, the city and the logo run along the foot.
  const card = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', gbp = shape === 'gbp';
    const pad = r2(Math.min(16*f, H*.055)), g = r2(Math.min(8*f, H*.03)), w = W - 2*pad, FX = facts(D);
    const KS = [1.45, 1.25, 1.1, .95, .85, .75, .65];
    let h = CSS, pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
    const frameOK = (pw, ph) => ph >= X.min(pw) && ph <= X.max(pw) + 2 && ph - X.foot(pw, ph) >= 2*f;
    if(!sold){
      for(const k of KS) for(const bc of (gbp ? [999, FE*1.12, FE] : [999])){ const kk = Math.min(k, 1.3); let br = bar(T, Li, w, Math.min(kk, .95), bc, gbp ? 1.7 : 1); if(!br) continue; if(!gbp && br.sw < .6*(w - r2(20*f))) br = bar(T, Li, w, Math.min(kk, .95), bc, 1, 1) || br;   // (Google: the street steps down before the stack in the narrow column must)
        const fl = gbp ? factCaps(T, FX.short.slice(0, 4), w, k, 'center') : null; if(gbp && (!fl || fl.n < Math.min(4, FX.short.length))) continue;
        for(const ka of (gbp ? [kk] : [Math.max(kk, .85), .78])){ const ag = gbp ? null : agent(D, T, w, ka, 'line') || agent(D, T, w, ka, 'row'); if(!gbp && !ag) continue;
          const topH = H - pad - (gbp ? fl.h + g*1.3 : ag.h + g) - br.h - g*(gbp ? 1.2 : .9);
          for(let fr = .7; fr >= .45; fr -= .02){ const pw = Math.round(W*fr), cw = W - pw - pad - r2(5*f), ch = topH - pad*.9; if(!frameOK(pw, topH) || cw < 50*f) continue;
            const low = gbp ? agent(D, T, cw, kk, 'tower') : factCaps(T, FX.short.slice(0, 4), cw, k, 'center', 2); if(!low || (!gbp && low.n < Math.min(3, FX.short.length))) continue;
            const sMax = Math.min(T.one('LISTED', F.word, cw - 4, 300, FE) || 0, r2(FE*(1.6 + 1.2*k))), gs = g;
            for(let ss = sMax; ss >= Math.max(FE*1.2, br.s*1.25); ss -= 2){ const left = ch - stackH(ss) - gs - low.h; if(left < -g*.9) continue;
              take({br, fl, ag, topH, pw, cw, ch, low, ss, left, sc: pw*topH/(W*H)*2600 + ss*1.6 + k*30 + (gbp ? 0 : low.n*60) - Math.max(0, left)*3 - Math.max(0, left - H*.1)*14 - (ka < .8 ? 25 : 0)}); break; } } } }
      if(!pick){ const br = bar(T, Li, w, .65) || {h: 0, html: () => ''}, topH = Math.round(H*.5), pw = Math.round(W*.5), cw = W - pw - pad - r2(5*f); pick = {br, topH, pw, cw, ch: topH - pad, ss: Math.min(T.one('LISTED', F.word, cw - 4, 300, 9) || 9, topH*.25), left: 0, low: {h: 0, html: () => ''}}; }
      const {br, fl, ag, topH, pw, cw, ch, low, ss, left} = pick, px = W - pw, e = Math.max(0, left)/3, c = left < 0 ? left : 0; let y = pad*.9 + e;
      h += X.frame(px, 0, pw, topH) + X.fades(px, 0, pw, topH, {left: 1});
      h += stack(T, pad, y + c*.4, ss, cw); y += stackH(ss) + g + c*.8 + e; h += low.html(pad, y);
      y = topH + g*(gbp ? 1.2 : .9); h += br.html(pad, y); y += br.h;
      if(fl) h += fl.html(pad, y + g*1.3);
      if(ag) h += ag.html(pad, H - pad - ag.h);
    } else {
      // the fullest note counts most, then the type and the house (Google: never a wide empty room beside a stacked address)
      const noteSc = sl => Math.min(sl.len, 120)*2 + (sl.len >= 85 ? 200 : 0) + (sl.n >= 2 && sl.n <= 4 ? 240 : sl.n === 5 ? 140 : 100);
      for(const k of KS) for(const beside of (gbp ? [1, 0] : [0])){ const kk = Math.min(k, 1.3), ka = Math.max(kk, .85);
        // under the house and its column: Google: the address across the image, a hairline, the agent's row. X: the address and the logo.
        const ag0 = gbp ? agent(D, T, w, ka, 'line') || agent(D, T, w, ka, 'row') : null; if(gbp && !ag0) continue;
        const lgW = gbp ? 0 : r2(72*f); let ad = address(T, Li, w - (gbp ? 0 : lgW + 12*f), FE*1.3*kk, {beside}), ag = ag0, up = 0; if(!ad) continue;
        // Google: where the address leaves a wide empty room at its right, the logo stands there (centered in the rest, as on the X
        // image's foot) and the agent runs along the foot on one line: the name, then the phone and REALTOR(R) at the line's end
        if(gbp && (w - ad.w)*(ad.h + g) > .02*W*H){ const adU = address(T, Li, w - r2(72*f) - 12*f, FE*1.3*kk), agU = agent(D, T, w, ka, 'line', {noLogo: 1});
          if(adU && agU && w - adU.w - 12*f >= Math.max(r2(72*f), adU.h*3.6)){ ad = adU; ag = agU; up = 1; } }   // (room enough that a wide logo stands as tall as the address)
        // (Google: where the logo cannot stand beside a stacked address either, the city moves beside the street: beside 2 above)
        if(gbp && !up && (w - ad.w)*(ad.h + g) > .02*W*H){ const ad2 = address(T, Li, w, FE*1.3*kk, {beside: 2}); if(ad2) ad = ad2; }
        const foot = gbp ? g + ad.h + g*1.1 + 1 + g + ag.h + pad : g*1.2 + ad.h + pad*.9;
        for(let fr = .66; fr >= .45; fr -= .02){ const pw = Math.round(W*fr), cx = pw + r2(7*f), cw = W - pad - cx, ph = Math.min(H - foot, X.max(pw) + 2), extra = H - foot - ph; if(!frameOK(pw, ph) || cw < 60*f || extra > H*(gbp ? .1 : .14)) continue;
          const bn = banner(T, pw, W - pw, kk, {bpMax: H*.036}); if(!bn || bn.ws < ad.st.s*1.2) continue;
          const at = gbp ? null : agent(D, T, cw, ka, 'text'); if(!gbp && !at) continue;
          const fix = bn.h + g*.9 + (at ? g + at.h + g*.4 : g*.5);
          for(const noQ of (gbp ? [0, 1] : [1])){ const sl = sell(D, T, cw, kk, {room: ph - fix, noQ, qK: 1.5}); if(!sl || !sl.n || sl.h + fix > ph) continue;   // (X: the column cannot hold the question with the note and the agent at X's type floors)
            const left = ph - fix - sl.h;
            take({ag, ad, up, lgW, ph, pw, cx, cw, bn, at, sl, left, extra, sc: noteSc(sl) + k*40 + pw*ph/(W*H)*2600 - left*3.4 - Math.max(0, left - H*.08)*14 - extra*2 - noQ*260 - (gbp && !up && (w - ad.w)*(ad.h + g) > .02*W*H ? 1500 : 0)}); break; } } }
      if(!pick){ const ad = address(T, Li, w, FE) || {h: 0, html: () => '', st: {s: FE, w: 0}}, ph = Math.round(H*.6), pw = Math.round(W*.5), cx = pw + r2(7*f), cw = W - pad - cx, bn = banner(T, pw, W - pw, .7, {bpMax: H*.036});
        pick = {ad, lgW: 0, ph, pw, cx, cw, bn, at: null, extra: 0, ag: agent(D, T, w, .85, 'row'), sl: sell(D, T, cw, .65, {lines: 1, noQ: 1}) || {h: 0, html: () => ''}, left: 0}; }
      const {ag, ad, up, lgW, ph, pw, cx, cw, bn, at, sl, left, extra} = pick, e = left/(at ? 3 : 2); let y = bn.h + g*.9 + e;
      h += X.frame(0, 0, pw, ph) + X.fades(0, 0, pw, ph, {right: 1}) + bn.html(0);
      // (the question and the note, left-aligned, as a block centered in the column where their lines run well short of its right edge)
      h += sl.html(gbp && sl.tw && (cw - sl.tw + pad)*sl.h > .025*W*H ? cx + (cw - sl.tw)/2 : cx, y);
      if(at) h += at.html(cx, ph - g*.4 - at.h);
      y = ph + (gbp ? g : g*1.2) + extra*.45;
      if(gbp && up){ const lx = pad + ad.w + 12*f, lw = W - pad - lx, lh = Math.min(ad.h, lw/3.2); h += agent(D, T, w, 1, 'logo').html(lx, y + (ad.h - lh)/2, lw, lh); }
      if(gbp){ h += ad.html(pad, y, up ? ad.w + 2 : w); y += ad.h + g*1.1 + extra*.45; h += hair(pad, y, w); if(ag) h += ag.html(pad, H - pad - ag.h); }
      else {   // X: the lifted foot band (the postcard back's contact band): the street and the city at the left, the logo centered in the rest
        const lx = pad + ad.w + 12*f, lw = W - pad - lx, lh = Math.min(H - ph - pad*1.1, lw/3.2);
        h += rect(0, ph, W, H - ph + 1, 'background:var(--nf-lift)') + ad.html(pad, y, w - lgW - 12*f) + agent(D, T, w, 1, 'logo').html(lx, ph + (H - ph - lh)/2, lw, lh); }
    }
    T.done();
    return h;
  };
  NF.portrait = tall;
  NF.landscape = card;

  // ================= carousel photo slides =================
  // The room runs off the top and the sides and dissolves into the field at its foot. Just Listed: JUST / LISTED stacked at the
  // left, the accent bar (street, city under it) beside it. Just Sold: the street with the city under it on the field, the accent
  // title band across the foot with JUST SOLD in dark 800 caps.
  NF.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), {f, FE} = T, Li = D.listing, sold = D.piece.moment === 'js', pad = r2(16*f), w = W - 2*pad, g = r2(8*f);
    const photo = (ph, from) => OHL.photo(D, D.piece.photo, `left:0;top:0;width:${W}pt;height:${ph}pt`) + `<div class="nfs-fade" style="left:0;top:${ph*from}pt;width:${W}pt;height:${ph*(1 - from) + 1}pt"></div>`;
    let h = CSS;
    if(!sold){
      let ss = r2(FE*2.3), sw, bw, br = null;
      for(; ss >= FE*1.5 && !br; ss -= 1){ sw = stackW(T, ss); bw = w - sw - r2(13*f); br = T.tw(U(Li.address), F.bar(FE)) <= bw - 2*r2(10*f) ? bar(T, Li, bw, 1, (ss)/1.25) : null; }
      ss += 1;
      if(br){ const sh = stackH(ss), ih = Math.max(sh, br.h), top = H - r2(15*f) - ih, ph = top - r2(4*f);
        h += photo(ph, .74) + stack(T, pad, top + (ih - sh)/2, ss) + br.html(pad + sw + r2(13*f), top + (ih - br.h)/2); }
      else { const ws = T.one(U(SocialSet.M), F.word, w, FE*2, FE*1.3), b2 = bar(T, Li, w, 1, ws/1.25), top = H - r2(15*f) - capH(ws) - g*1.1 - b2.h, ph = top - r2(4*f);
        h += photo(ph, .74) + caps('moment', SocialSet.M, pad, top, w, ws, F.word, ON) + b2.html(pad, top + capH(ws) + g*1.1); }
    } else {
      const bn = banner(T, 0, W, 1, {wordK: .9}), ad = address(T, Li, w, Math.min(FE*1.25, bn.ws/1.25)), ph = H - bn.h - ad.h - 2*g;
      h += photo(ph, .78) + ad.html(pad, ph + g*.8, w, 'center') + bn.html(H - bn.h);
    }
    T.done();
    return h;
  };
  window.NFSocial = NF;
})();
