/* templates/logo-grid/lg-social.js: Logo Grid's own Just Listed and Just Sold social images (owner 11/18/2026: the socials "fit the
   style, look and feel of the designs of the main pieces"). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and
   replaces its three layouts for this set only; nothing shared changes.

   Read off the approved Logo Grid pieces (postcard.html, flyer.html, foldover.html, lg-tokens.css, lg-marks.css):
     - the agent's brand-kit paper as the field; every photo a print in a white mat with a soft shadow
     - one solid band of the main color: the giant word in Red Hat Display 700 caps, a vertical hairline, the street in 700 mixed case
       and the place in small gold caps. Just Listed: the band across the foot. Just Sold: the band across the head with the street under
       the word, and the house print laid over the band's edge.
     - Just Listed facts: stacked and centered with short rules between them beside the print (the postcard front), or on the
       main-color tab that rises flush from the band, white first line and gold second, at the end of the paper bar with its fade
       (the postcard back)
     - Just Sold: "Thinking about selling?" in the main color over the note on the white writing mat, a hairline, then the agent
     - the agent on the paper: name in 700, REALTOR(R) in tracked caps beside the phone, the brokerage logo under or beside
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house in every frame (the engine's
   house-cut check), text at the phone floors of templates/_shared/readsize.js. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const RH = "'Red Hat Display'", MAIN = 'var(--lg-main)', ONM = 'var(--lg-on-main)', GOLD = 'var(--lg-gold)', LAB = 'var(--lg-lab)', INK = '#161616';
  const Q = 'Thinking about selling?';
  const F = {
    word: s => `font:700 ${s}pt ${RH};letter-spacing:${Math.min(3, s*.05).toFixed(2)}pt;text-transform:uppercase`,
    street: s => `font:700 ${s}pt ${RH}`,
    place: s => `font:700 ${s}pt ${RH};text-transform:uppercase;letter-spacing:${(s*.2).toFixed(2)}pt`,
    fact: s => `font:600 ${s}pt ${RH}`,
    q: s => `font:700 ${s}pt ${RH};letter-spacing:-.2pt`,
    note: s => `font:400 ${s}pt ${RH}`,
    name: s => `font:700 ${s}pt ${RH}`,
    tag: s => `font:700 ${s}pt ${RH};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`,
    phone: s => `font:600 ${s}pt ${RH}`,
  };
  const CSS = `<style>
    .ss .lgs-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ss .lgs-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .lgs-logo .text{font:700 12pt/1.15 ${RH};text-align:center;color:inherit}
    .ss .lgs-hs{position:absolute;overflow:hidden}.ss .lgs-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .lgs-caps{position:absolute;white-space:nowrap}
    .ss .lgs-mat{position:absolute;background:#fff;box-shadow:0 2pt 8pt rgba(0,0,0,.18)}
    .ss .lgs-wb{position:absolute;background:#fff;box-shadow:0 2pt 8pt rgba(0,0,0,.16);box-sizing:border-box}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03;
    const T = {f, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2};
    const M = document.createElement('div'); document.body.appendChild(M);
    const tmemo = new Map();
    T.tw = (t, css) => { const key = t + '|' + css; if(tmemo.has(key)) return tmemo.get(key); M.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:nowrap;${css}`; M.textContent = t; const v = M.getBoundingClientRect().width*.75; tmemo.set(key, v); return v; };
    // a paragraph at width w: its line count and each line's width (pt)
    const memo = new Map();   // the layouts try many sizes and widths: each measure is taken once
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
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = `700 200px ${RH}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:700 200px ${RH};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}; return MET; };
  const capH = s => met().cap*s;
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  // one line of capitals set by its ink: the top of the letters at y
  const caps = (slot, t, x, y, w, s, color, align) => { const m = met(), base = m.base*s;
    return `<div class="lgs-caps" data-slot="${slot}" data-lines="1" style="left:${x}pt;top:${y - (base - m.cap*s)}pt;width:${w}pt;height:${s}pt;${F.word(s)};line-height:${s}pt;color:${color};text-align:${align || 'left'}">${esc(t)}</div>`; };

  // ---------- photos: prints in white mats ----------
  const heroKit = (D, f) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null, M = r2(5*f);
    const mat = (x, y, w, h) => `<div class="lgs-mat" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt"></div>`;
    const photo = (pid, x, y, w, ht) => mat(x, y, w, ht) + OHL.photo(D, pid, `left:${x + M}pt;top:${y + M}pt;width:${w - 2*M}pt;height:${ht - 2*M}pt`);
    const sup = n => window.OHEmail ? OHEmail.support(D, id, n) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)).slice(0, n);
    const imin = w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)), imax = w => Math.ceil(hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : w/pAR);
    return {id, pAR, M, photo,
      // all sizes are the print's outer size (mat included)
      min: w => imin(w - 2*M) + 2*M, max: w => imax(w - 2*M) + 2*M, nat: w => Math.ceil((w - 2*M)/pAR) + 2*M,
      hero: (x, y, w, ht) => { const iw = w - 2*M, ih = ht - 2*M; if(hb && ih > iw/pAR){ const vis = iw/(ih*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return photo(id, x, y, w, ht); },
      // n room prints side by side
      row: (x, y, w, ht, n, g) => { const ids = sup(n); if(!ids.length || ht < 40) return ''; const pw = (w - (ids.length - 1)*g)/ids.length; return ids.map((p, i) => photo(p, x + i*(pw + g), y, pw, ht)).join(''); }};
  };

  // ---------- words ----------
  // the street, never shortened (owner 11/18/2026): one line down to the floor size, else (two: true) two lines at the floor with the
  // last two words kept together. Set inside a span, so the shared address pass (templates/_shared/addressfit.js) leaves it as written.
  const street = (T, Li, w, max, two) => { const t = Li.address, s = T.one(t, F.street, w, max, T.FE);
    if(s) return {t, s, n: 1, w: T.tw(t, F.street(s))};
    if(!two) return null;
    const t2 = t.replace(/\s+(\S+)\s*$/, '\u00a0$1'), r = T.rows(t2, F.street(T.FE), w, T.FE*1.2);
    return r.n <= 2 ? {t: t2, s: T.FE, n: 2, w: r.wide} : null; };
  const stH = st => st.n*st.s*1.2 + (st.n > 1 ? st.s*.15 : 0);
  const stTxt = (st, x, y, w, color, align) => txt('address', st.t, x, y, w, st.s, 1.2, F.street, color, {n: st.n, align, html: `<span>${esc(st.t)}</span>`});
  // the listing's facts, as written out on the postcards, and their short forms for a narrow tab
  const facts = D => { const six = OHL.factSix(D.listing), strong = six.some(([ic]) => ic === 'lot' || ic === 'cal');
    const full = six.filter(([ic]) => !(ic === 'stories' && strong)).map(([, t]) => t).slice(0, 5);
    const short = six.filter(([ic]) => !(ic === 'stories' && strong)).map(([ic, t]) => ic === 'bed' ? t.replace('bedroom', 'bed') : ic === 'bath' ? t.replace(' full bath', ' bath') : ic === 'area' ? t.replace(' square feet', ' sq ft') : ic === 'cal' ? t.replace('Built in', 'Built') : t).slice(0, 5);
    return {full, short}; };
  const notes = D => { const F0 = ((((D.sw || {}).pc || {}).js || {}).front || {}), n2 = [].concat(F0.note2 || []).map(String);
    const tail = n2.map(t => t.split(/(?<=[.!?])\s+/).slice(1).join(' ')).filter(Boolean);
    return n2.concat(['I can tell you what your own home could bring in today’s market.'], tail, ['I can tell you what your home could bring today.', ((D.companion || {}).justSold || {}).ctaNext || 'Call or text me anytime.', 'Call or text me anytime.'])
      .filter((t, i, a) => t && a.indexOf(t) === i && !SocialSet.CONDITION.test(t)).map(t => t.replace(/(^|\s)(I|a|A)\s/g, '$1$2\u00a0')); };

  // ---------- the band ----------
  // one row (the postcard's foot band): the word, a vertical hairline, the street over the place in gold caps
  // o.plain: the street alone beside the word (Just Sold's head band); o.tail: extra band under the words (the print laps over it);
  // o.under: the place under the word and the street alone, larger, beside them (X's wide image, where the type floors are large)
  const bandRow = (T, Li, W, k, word, o) => { o = o || {};
    const pad = r2(16*T.f), bp = r2(Math.min(12*T.f*Math.min(k, 1.2), 16*Math.min(k, 1.2) + 4)), gh = r2(13*T.f*Math.min(k, 1.2)), place = OHL.place(Li);
    const pf = s => `font:700 ${s}pt ${RH};text-transform:uppercase;letter-spacing:${(s*.1).toFixed(2)}pt`;
    // the street steps down toward the floor size until the word beside it stands clearly larger
    let st = null, ps = 0, rw = 0, ws = null;
    // (a street too long to leave the word room on one line goes to two lines: the narrower measure)
    for(const sw of [.56, .42]) for(let mx = T.FE*(o.under ? 1.7 : 1.3)*k; mx >= T.FE - .01 && !(ws && sw < .5); mx -= 1){ const a = street(T, Li, W*sw, mx, true); if(!a) break;
      const p = o.plain ? 0 : T.one(place, pf, Math.max(W*.44, a.w), T.FS*1.05*k, T.FS); if(!o.plain && !p) continue;
      const r = Math.max(a.w, p && !o.under ? T.tw(place, pf(p)) : 0) + 2, w1 = T.one(word, F.word, W - 2*pad - r - 2*gh - 2, o.wordMax || T.FE*3*Math.max(k, 1), T.FE); if(!w1) continue;
      if(!ws || w1/a.s > ws/st.s){ st = a; ps = p; rw = r; ws = w1; } if(w1 >= a.s*(o.under ? .95 : 1.3)) break; }   // (with the place under the word, the street may stand as large as the word)
    if(!ws || ws < st.s*(o.under ? .85 : o.plain ? .95 : 1.15)) return null;   // the word never smaller than the street beside it: the stacked band serves instead
    const under = o.under && ps && T.tw(place, pf(ps)) <= T.tw(word.toUpperCase(), F.word(ws)) + gh*.7, lh0 = capH(ws) + (under ? 5*T.f + ps*1.3 : 0);
    if(o.under && !under) return null;
    const ww = T.tw(word.toUpperCase(), F.word(ws)), rh = stH(st) + (ps && !under ? 2*T.f + ps*1.3 : 0), inner = Math.max(lh0, rh), h = inner + bp + (o.tail != null ? bp*.45 + o.tail : bp);
    // the row runs the band's full width: the room left over opens between the word, the hairline and the street
    const slack = Math.max(0, W - 2*pad - ww - 2*gh - rw), xh = pad + ww + gh + slack/2, sx = W - pad - rw;
    return {h, html: y => { const y0 = y + bp;
      return rect(0, y, W, h, `background:${MAIN}`) + caps('moment', word, pad, y0 + (inner - lh0)/2, ww + 2, ws, ONM)
        + rect(xh, y0 - bp*.25, 1, inner + bp*.5, `background:${ONM};opacity:.6`)
        + stTxt(st, sx, y0 + (inner - rh)/2, rw, ONM, st.n > 1 ? 'center' : 'left')   // two lines sit centered on each other
        + (!ps ? '' : under ? txt('place', place, pad, y0 + (inner - lh0)/2 + capH(ws) + 5*T.f, ww + gh*.7 + 2, ps, 1.3, pf, GOLD, {small: 1}) : txt('place', place, sx, y0 + (inner - rh)/2 + stH(st) + 2*T.f, rw, ps, 1.3, pf, GOLD, {small: 1})); }};
  };
  // two rows (the tall shapes): the word across the band; under it the street at the left and the place in gold caps at the right end
  // of the same line (under the street when the line cannot hold both).
  // o.tail / o.lead: extra band under / over the words (the print laps over it); o.wordK: the word's share of the full width
  const bandStack = (T, Li, W, k, word, o) => { o = o || {};
    const pad = r2(16*T.f), w = W - 2*pad, bp = r2(13*T.f*Math.min(k, 1.2)), g = r2(8*T.f*Math.min(k, 1.2)), place = OHL.place(Li);
    const wMax = T.one(word, F.word, w - 2, 120, T.FE); if(!wMax) return null;
    const ws = Math.max(T.FE, r2(wMax*(o.wordK || Math.min(1, .6 + .4*k)))), top = o.lead != null ? o.lead + bp*.95 : bp, gh = r2(11*T.f);
    // the street beside the place when a size down to the floor lets the line hold both
    let st = null, ps = 0, inline = false;
    for(let q = 1; q >= .3 && !inline; q -= .05){ const a = street(T, Li, w, Math.max(T.FE, T.FE*1.3*k*q)); if(!a) break; const p = T.one(place, F.place, w, Math.max(T.FS, T.FS*1.05*k*q), T.FS);
      if(p && a.w + 2*gh + T.tw(place, F.place(p)) + 2 <= w){ st = a; ps = p; inline = true; } }
    if(!inline){ st = street(T, Li, w, T.FE*1.3*k, true) || {t: Li.address, s: T.one(Li.address, F.street, w, T.FE, 9) || 9, n: 1, w: w}; ps = T.one(place, F.place, w, T.FS*1.05*k, T.FS) || 0; }
    const pw = ps ? T.tw(place, F.place(ps)) : 0, r2h = stH(st) + (ps && !inline ? 2*T.f + ps*1.3 : 0);
    const h = top + capH(ws) + g + r2h + (o.tail != null ? bp*.45 + o.tail : bp);
    return {h, html: y => { let s = rect(0, y, W, h, `background:${MAIN}`) + caps('moment', word, pad, y + top, w, ws, ONM), yy = y + top + capH(ws) + g;
      s += stTxt(st, pad, yy, inline ? st.w + 2 : w, ONM);
      if(inline) s += txt('place', place, pad + w - pw - 2, yy + st.s*1.2*.8 - ps*1.3*.8, pw + 2, ps, 1.3, F.place, GOLD, {small: 1, align: 'right'});
      else if(ps) s += txt('place', place, pad, yy + stH(st) + 2*T.f, w, ps, 1.3, F.place, GOLD, {small: 1});
      return s; }};
  };

  // ---------- the agent on the paper: name, REALTOR(R) beside the phone, the logo ----------
  // 'row': the lines at the left (after the headshot), the logo at the right. 'stack': the lines with the logo centered under them,
  // the whole group centered ('center') or set from the left edge ('left'); with a headshot the photo stands at the left of the stack.
  const agent = (D, T, w, k, mode, al) => {
    const A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), gap = 10*T.f;
    const sizes = cw => { const ns = T.one(A.name || '', F.name, cw, T.FB*1.55*k, T.FB*1.1), ps0 = r2(Math.max(T.FB, T.FB*1.2*k)), ds = r2(Math.max(T.FS, T.FS*Math.min(k, 1.3))); if(!ns) return null;
      const dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0; let ps = null, inl = true;
      for(let s = ps0; s >= T.FB - .01 && !ps; s -= .5) if(dW + (nar ? s*.6 : 0) + T.tw(A.phone || '', F.phone(s)) <= cw) ps = s;
      if(!ps){ inl = false; ps = T.one(A.phone || '', F.phone, cw, ps0, T.FB); if(!ps) return null; }
      const wide = Math.max(T.tw(A.name || '', F.name(ns)), inl ? dW + (nar ? ps*.6 : 0) + T.tw(A.phone || '', F.phone(ps)) : Math.max(dW, T.tw(A.phone || '', F.phone(ps))));
      return {ns, ps, ds, dW, inl, wide, th: ns*1.18 + 2*T.f + (inl || !nar ? 0 : ds*1.3 + T.f) + ps*1.3}; };
    const lines = (S, x, y, cw, a) => { let s = txt('agent.name', A.name || '', x, y, cw, S.ns, 1.18, F.name, INK, {align: a}), yy = y + S.ns*1.18 + 2*T.f;
      const pw = T.tw(A.phone || '', F.phone(S.ps));
      if(S.inl && nar){ const tot = S.dW + S.ps*.6 + pw, x0 = a === 'left' ? x : x + (cw - tot)/2;
        s += txt('agent.desig', 'REALTOR®', x0, yy + S.ps*1.3*.78 - S.ds*1.3*.78, S.dW + 2, S.ds, 1.3, F.tag, LAB, {small: 1});
        s += txt('agent.phone', A.phone || '', x0 + S.dW + S.ps*.6, yy, pw + 2, S.ps, 1.3, F.phone, INK); }
      else { if(nar){ s += txt('agent.desig', 'REALTOR®', x, yy, cw, S.ds, 1.3, F.tag, LAB, {small: 1, align: a}); yy += S.ds*1.3 + T.f; }
        s += txt('agent.phone', A.phone || '', x, yy, cw, S.ps, 1.3, F.phone, INK, {align: a}); }
      return s; };
    const logo = (x, y, lw, lh) => `<div class="abs lgs-logo" style="left:${x}pt;top:${y}pt;width:${lw}pt;height:${lh}pt;color:${INK}">${OHL.logo(D, 'light', '')}</div>`;
    const hs = (x, y, hw, hh) => `<div class="abs lgs-hs" style="left:${x}pt;top:${y}pt;width:${hw}pt;height:${hh}pt"><img src="${esc(A.headshot)}" alt=""></div>`;
    // 'duo': the name with the logo at the far end of its line, REALTOR(R) and the phone under it, so the agent runs the column's width
    if(mode === 'duo'){
      for(const h0 of (hsOn ? [1, 0] : [0])){
        const p0 = sizes(w*.6); if(!p0) return null;
        // al 'mid': the logo as tall as the lines allow and centered on them (the wide Just Sold's foot), so no corner under it stands empty
        const mid = al === 'mid', hsW = h0 ? Math.round(p0.th*.8) : 0, cw = w - (h0 ? hsW + gap : 0), lh = r2(mid ? p0.th*.9 : Math.max(p0.ns*1.3, T.FB*1.7)), lw = mid ? Math.min(cw*.4, lh*3.4) : Math.min(cw*.46, lh*4.2), S = sizes(cw - lw - gap); if(!S) continue;
        return {h: S.th, ww: w, html: (x, y) => (h0 ? hs(x, y, hsW, S.th) : '') + lines(S, x + (h0 ? hsW + gap : 0), y, cw - lw - gap, 'left') + logo(x + w - lw, y + (mid ? (S.th - lh)/2 : (S.ns*1.18 - lh)/2), lw, lh)};
      }
      return null;
    }
    // 'row': the lines at the left (after the headshot); the logo takes the rest of the row, as tall as the lines, so the row runs full
    if(mode === 'row'){
      const lmin = Math.max(60*T.f, w*.36);
      for(const h0 of (hsOn ? [1, 0] : [0])){
        const probe = sizes(w), hsW = h0 && probe ? Math.round(probe.th*.8) : 0, cw = w - lmin - gap*1.4 - (h0 ? hsW + gap : 0), S = sizes(cw); if(!S) continue;
        const tx = (h0 ? hsW + gap : 0), lx = tx + S.wide + gap*1.4, lw = w - lx;
        if(al !== 'any' && lw - S.th*4.3 > 70*T.f) return null;   // the logo cannot fill what the row leaves: another arrangement serves this width
        return {h: S.th, ww: w, html: (x, y) => (h0 ? hs(x, y, hsW, S.th) : '') + lines(S, x + tx, y, S.wide + 2, 'left') + logo(x + lx, y + S.th*.03, lw, S.th*.94)};
      }
      return null;
    }
    // 'line': one line across a wide column: the name, REALTOR(R) and the phone, the logo, spread to its two ends
    if(mode === 'line'){
      const ns = T.one(A.name || '', F.name, w*.4, T.FB*1.55*k, T.FB*1.1), ps = r2(Math.max(T.FB, T.FB*1.2*k)), ds = r2(Math.max(T.FS, T.FS*Math.min(k, 1.3))); if(!ns) return null;
      const nW = T.tw(A.name || '', F.name(ns)), dW = nar ? T.tw('REALTOR®', F.tag(ds)) + ps*.6 : 0, pW = T.tw(A.phone || '', F.phone(ps)), lh = ns*1.3, lw = Math.min(w*.3, lh*4.2);
      const slack = w - nW - dW - pW - lw; if(slack < 2*gap*1.6) return null;
      return {h: lh, ww: w, html: (x, y) => { const mx = x + nW + slack/2, by = y + lh*.78;
        return txt('agent.name', A.name || '', x, by - ns*1.18*.78, nW + 2, ns, 1.18, F.name, INK)
          + (nar ? txt('agent.desig', 'REALTOR®', mx, by - ds*1.3*.78, dW, ds, 1.3, F.tag, LAB, {small: 1}) : '') + txt('agent.phone', A.phone || '', mx + dW, by - ps*1.3*.78, pW + 2, ps, 1.3, F.phone, INK)
          + logo(x + w - lw, y, lw, lh); }};
    }
    for(const h0 of (hsOn ? [1, 0] : [0])){
      const p0 = sizes(w); if(!p0) return null;
      const lh0 = r2(Math.max(p0.ns*1.4, T.FB*1.85)), hsW = h0 ? Math.round((p0.th + 6*T.f + lh0)*.72) : 0, cw = w - (h0 ? hsW + gap : 0), S = sizes(cw); if(!S) continue;
      const tWd = Math.min(cw, S.wide + 2), lh1 = r2(Math.max(S.ns*1.4, T.FB*1.85)), lw = Math.min(cw, Math.max(tWd, lh1*3.4)), lh = Math.min(lh1, r2(lw/4)), full = S.th + 6*T.f + lh, gW = Math.max(tWd, lw);   // the logo's box hugs the logo as drawn in a narrow column
      return {h: full, ww: (h0 ? hsW + gap : 0) + gW, html: (x, y) => { const tot = (h0 ? hsW + gap : 0) + gW, x0 = al === 'left' ? x : x + (w - tot)/2, tx = x0 + (h0 ? hsW + gap : 0);
        return (h0 ? hs(x0, y, hsW, full) : '') + lines(S, tx + (gW - tWd)/2, y, tWd, 'center') + logo(tx + (gW - lw)/2, y + S.th + 6*T.f, lw, lh); }};
    }
    return null;
  };

  // ---------- Just Listed: the facts ----------
  // the postcard front's column: centered lines with a short rule between them
  const factStack = (T, list, w, k) => { if(!list.length) return {h: 0, html: () => ''};
    const fs = Math.min(...list.map(t => T.one(t, F.fact, w - 4, T.FB*1.18*k, T.FB) || 0)); if(!fs) return null;
    const sp = fs*2.5, h = (list.length - 1)*sp + fs*1.3;
    return {h, html: (x, y) => list.map((t, i) => txt('facts.' + i, t, x, y + i*sp, w, fs, 1.3, F.fact, INK, {align: 'center'})
      + (i ? rect(x + w/2 - 16*T.f, y + i*sp - (sp - fs*1.3)/2 - .5, 32*T.f, 1, `background:${LAB};opacity:.55`) : '')).join('')}; };
  // the postcard back's tab in the main color, w wide: the facts one to a line, as large as the tab holds, white with short gold rules
  // between them, spread over the tab's height
  const factTab = (T, FX, w, k) => {
    for(const list of [FX.full, FX.short]){ if(list.length < 2) continue; const px = r2(9*T.f);
      const fs = Math.min(...list.map(t => T.one(t, F.fact, w - 2*px, T.FE*1.3*k, T.FB) || 0)); if(!fs) continue;
      return {w, min: list.length*fs*1.7 + r2(4*T.f), html: (x, y, h) => { const sp = Math.min(h/list.length, fs*2.3), y0 = y + (h - list.length*sp)/2;
        return rect(x, y, w + 1, h, `background:${MAIN}`) + list.map((t, i) => txt('facts.' + i, t, x + px, y0 + i*sp + (sp - fs*1.3)/2, w - 2*px, fs, 1.3, F.fact, ONM, {align: 'center'})
          + (i ? rect(x + w/2 - 15*T.f, y0 + i*sp - .5, 30*T.f, 1, `background:${GOLD}`) : '')).join(''); }};
    }
    return null;
  };

  // ---------- Just Sold: the question over the note on the white writing mat ----------
  // The mat runs the full width it is given. The note is the fullest of the seller notes that fills it: as many lines as maxN allows,
  // every line full (the last 78%+), the type raised up to 13% where that fills the lines; justified when the lines run full.
  const pickNote = (T, D, iw, ns0, maxN, real, maxH) => { const loose = iw < 190*T.f, all = notes(D), n2 = [].concat(((((D.sw || {}).pc || {}).js || {}).front || {}).note2 || []).map(String);
    // real: the postcard's own notes (the sale named) at any line count first, the shorter ones only where none of them fills its lines
    const lists = real ? [all.filter(t => n2.includes(t)), all] : [all];
    // owner 11/8: every write-up line 80%+ and the last 90%+ of its width; the text block may narrow a little (centered on the mat) to get there
    // (real 'fill': of the notes at that line count, the one whose shortest line runs fullest across the whole mat; with maxH, the room the
    // lines may take, the type rises further, up to 35%, so the mat fills the column's height)
    const sMax = ns0*(real && maxH ? 1.35 : 1.13) + .01;
    for(const list of lists) for(let n = Math.min(maxN, 9); n >= 1; n--){ let best = null;
      for(const m of [1, .96, .92, .88]) for(let s = ns0; s <= sMax; s += .5) for(const t of list){
        if(maxH && real && n*s*1.42 + s*.15 > maxH) continue;
        const w = iw*m, r = T.rows(t, F.note(s), w, s*1.42); if(r.n !== n) continue;
        if(n === 1 ? r.wide < .9*w : (r.last < .9*w || r.ws.slice(0, -1).some(x => x < (loose ? .6 : .8)*w))) continue;
        const pk = {t, n, s, w, real: !!real && n2.includes(t), just: n > 1 && r.ws.slice(0, -1).every(x => x >= .88*w)}; if(!real || (real !== 'fill' && !maxH)) return pk;
        pk.sc = Math.min(...r.ws.slice(0, -1).concat(n === 1 ? [r.wide] : []))/iw*100 + r.last/iw*20 + (maxH ? n*s*1.42/maxH*150 : s - ns0); if(!best || pk.sc > best.sc) best = pk; }
      if(best) return best; }
    return null; };
  // o.lines: the most note lines; or o.room: the height (pt) the mat may take. 0 lines: the question alone.
  const sell = (D, T, w, k, o) => {
    let ql = [Q], qs = T.one(Q, F.q, w, T.FE*1.2*k*(o.qK || 1), T.FB);
    if(!qs){ ql = ['Thinking about', 'selling?']; qs = T.one(ql[0], F.q, w, T.FE*1.2*k, T.FB); if(!qs) return null; }
    const qh = ql.length*qs*1.2, nb = r2(9*T.f*Math.min(k, 1.25)), ns0 = r2(Math.max(T.FB, T.FB*1.05*k));
    const maxN = o.lines != null ? o.lines : Math.floor((o.room - qh - 6*T.f - 2*nb - ns0*.2)/(ns0*1.13*1.42));
    const qg = (o.qg || 6)*T.f, pk = maxN > 0 ? pickNote(T, D, w - 2*nb, ns0, maxN, o.real, o.grow && o.room ? o.room - qh - qg - 2*nb : 0) : null; if(o.lines && !pk) return null;
    const lh = pk ? pk.s*1.42 : 0, mh = pk ? pk.n*lh + pk.s*.15 + 2*nb : 0, h = qh + (pk ? qg + mh : 0);
    return {h, len: pk ? pk.t.length : 0, n: pk ? pk.n : 0, real: !!(pk && pk.real), ww: pk ? w : Math.max(...ql.map(t => T.tw(t, F.q(qs)))), html: (x, y) => { let s = '', yy = y;
      ql.forEach((t, i) => { s += txt('sold.q' + (i ? 2 : ''), t, x, yy, w, qs, 1.2, F.q, LAB); yy += qs*1.2; });
      if(pk) s += `<div class="lgs-wb" style="left:${x}pt;top:${yy + qg}pt;width:${w}pt;height:${mh}pt"></div>`
        + txt('sold.note', pk.t, x + nb + (w - 2*nb - pk.w)/2, yy + qg + nb, pk.w, pk.s, 1.42, F.note, '#1b1b1b', {n: pk.n, css: pk.just ? 'text-align:justify;text-align-last:left' : ''});
      return s; }};
  };

  // ---------- Just Listed: the writer's lines (the house's story and what is nearby) ----------
  // The writer's sentences in order (the first always kept), as many as fill maxN lines or fewer at width w: every line 80%+ and the
  // last 90%+ of the measure (owner 11/8), the measure narrowed a little or the type raised up to 12% to get there. A pick that names
  // a nearby place with its distance is preferred (the approved set carried it).
  const writeUp = (T, D, w, s0, maxN) => { T.wu = T.wu || {}; const key = [Math.round(w), s0, maxN].join('|'); if(key in T.wu) return T.wu[key];
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing)).slice(0, 7), near = /\bmiles?\b/i; let best = null;
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of [1, .96, .92]) for(const s of [s0, r2(s0*1.06), r2(s0*1.12)]){ const r = T.rows(t, F.note(s), w*m, s*1.42); if(r.n > maxN || r.n < 2) continue;
        if(r.last < .9*w*m || r.ws.slice(0, -1).some(x => x < .8*w*m)) continue;
        const sc = r.n*100 + (near.test(t) ? 80 : 0) + m*20 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc, just: r.ws.slice(0, -1).every(x => x >= .88*w*m)}; } }
    if(best){ best.h = best.n*best.s*1.42 + best.s*.15;
      best.html = (x, y, W0) => txt('writeup', best.t, x + (W0 - best.w)/2, y, best.w, best.s, 1.42, F.note, '#1b1b1b', {n: best.n, css: best.just ? 'text-align:justify;text-align-last:left' : ''}); }
    return (T.wu[key] = best); };
  // the facts on one line on the main-color tab that rises from the band: as many as the line holds at a size that reads
  const factLine = (T, FX, wMax, k, full) => { const px = r2(12*T.f), J = l => l.join('  ·  ');
    for(const [list, min] of [[FX.full, T.FB*1.1], [FX.short, T.FB*1.1], [FX.full.slice(0, 4), T.FB], [FX.short.slice(0, 4), T.FB], [FX.short.slice(0, 3), T.FB]]){ if(list.length < 2) continue;
      const fs = T.one(J(list), F.fact, wMax - 2*px, full ? T.FB*1.1 : T.FE*1.15*k, min); if(!fs) continue;
      const tw = T.tw(J(list), F.fact(fs)), w = full ? wMax : Math.min(wMax, tw + 2*px + 2), h = fs*1.3 + 2*r2(Math.min(6*T.f*Math.min(k, 1.2), full ? 6 : 99));
      return {w, h, n: list.length, html: (x, y) => rect(x, y, w + 1, h + 1, `background:${MAIN}`) + txt('facts.0', J(list), x + px, y + (h - fs*1.3)/2, w - 2*px, fs, 1.3, F.fact, ONM, {align: 'center'})}; }
    return null; };
  // the facts in a column w wide and hh tall: one to a line, as large as the column holds, spread over its height with short rules between
  const factCol = (T, FX, w, hh, kMax) => {
    const pair = l => { const hf = Math.ceil(l.length/2); return [l.slice(0, hf).join('  ·  '), l.slice(hf).join('  ·  ')].filter(Boolean); }, f4 = FX.full.slice(0, 4), s4 = FX.short.slice(0, 4);
    // one to a line; where the column is too short for that, two to a line (all four still shown) before any fact is dropped
    for(const list of [FX.full, FX.short, f4, s4, pair(f4), pair(s4), FX.short.slice(0, 3)]){ if(list.length < 2) continue;
      const cap = Math.min(T.FE*1.5*(kMax || 1), hh/(list.length*2.1)), fs = Math.min(...list.map(t => T.one(t, F.fact, w - 4, cap, T.FB) || 0)); if(!fs || fs > cap + .01) continue;
      const sp = Math.min(hh/list.length, fs*4), y0 = (hh - list.length*sp)*(list.length <= 2 ? .72 : .5);   // two lines sit nearer what follows them
      return {n: list.join(' ').split('·').length, fs, wide: Math.max(...list.map(t => T.tw(t, F.fact(fs)))), html: (x, y) => list.map((t, i) => txt('facts.' + i, t, x, y + y0 + i*sp + (sp - fs*1.3)/2, w, fs, 1.3, F.fact, INK, {align: 'center'})
        + (i ? rect(x + w/2 - 16*T.f, y + y0 + i*sp - .5, 32*T.f, 1, `background:${LAB};opacity:.55`) : '')).join('')}; }
    return null; };

  const LG = {};
  // ================= post, pin, story =================
  // Just Listed: the house print, then the paper bar (the agent at the left, the facts tab rising from the band at the right), the band
  // across the foot. Just Sold: the band across the head, the house print laid over its edge, the question, the note, a hairline, the agent.
  // Room the house cannot take goes to two room prints; on a story they fill the foot of the image, under the words.
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', story = shape === 'story', BOT = story ? H - Math.max(94, r2(104*f)) : H;
    const m = r2(13*f), pad = r2(16*f), g = r2(8*f), pw = W - 2*m, FX = facts(D), ov = r2(13*f);
    const build = (k, o) => {
      if(!sold){
        const band = bandStack(T, Li, W, k, SocialSet.M); if(!band) return null;
        const tab = o.facts ? factLine(T, FX, W - pad, k) : null; if(o.facts && !tab) return null;
        const wu = o.wl ? writeUp(T, D, W - 2*pad, r2(Math.max(FB, FB*1.05*k)), o.wl) : null; if(o.wl && (!wu || wu.n < Math.min(o.wl, 2))) return null;
        const ag = agent(D, T, W - 2*pad, k, 'row', 'any'); if(!ag) return null;
        const under = g + (wu ? wu.h + g*1.1 : 0) + ag.h + g + (tab ? tab.h : 0);
        return {band, tab, wu, ag, under, room: BOT - m - under - band.h};
      }
      const band = bandStack(T, Li, W, k, SocialSet.M, story ? {plain: 1, lead: ov} : {plain: 1, tail: ov}); if(!band) return null;
      const sl = sell(D, T, W - 2*pad, k, {lines: o.nl}); if(!sl) return null;
      const ag = agent(D, T, W - 2*pad, k, 'row', 'any'); if(!ag) return null;
      const below = g*1.3 + sl.h + g*1.1 + 1 + g + ag.h + (story ? 0 : m*.95);
      return {band, sl, ag, below, room: BOT - (story ? m : 0) - (band.h - ov) - below};
    };
    const opts = sold ? [4, 3, 2, 1, 0].map(nl => ({nl})) : [{wl: 3, facts: 1}, {wl: 2, facts: 1}, {wl: 0, facts: 1}, {wl: 0, facts: 0}];
    const KMAX = {post: 1.6, pin: 1.75, story: 1.6}[shape] || 1.5, KMIN = .6;
    let pick = null;
    for(const o of opts){
      const b1 = build(KMIN, o); if(!b1 || b1.room < X.min(pw)) continue;
      const need = Math.min(b1.room, story ? X.nat(pw) : X.min(pw) + .7*(X.nat(pw) - X.min(pw)));
      let k = KMIN; for(let t = KMAX; t >= KMIN; t -= .025){ const b = build(t, o); if(b && b.room >= need){ k = t; break; } }
      pick = {o, k}; break;
    }
    pick = pick || {o: sold ? {nl: 0} : {wl: 0, facts: 0}, k: KMIN};
    const {o, k} = pick, B = build(k, o) || build(KMIN, o);
    let ph = Math.max(X.min(pw), Math.min(story ? X.nat(pw) : X.max(pw), B.room)), spare = Math.max(0, B.room - ph);
    const rowH = story ? 0 : spare >= 70*f ? spare - g : 0, gs = story || rowH ? 0 : spare;
    let h = CSS, y;
    if(!sold){
      y = m; h += X.hero(m, y, pw, ph); y += ph;
      if(rowH){ h += X.row(m, y + g, pw, rowH, 2, g); y += rowH + g; }
      // under the print: the writer's lines, the agent's row, then the facts tab rising flush from the band at the right, the
      // paper beside it fading toward it
      const e = gs/3; y += g + e;
      if(B.wu){ h += B.wu.html(pad, y, W - 2*pad); y += B.wu.h + g*1.1 + e; }
      h += B.ag.html(pad, y); y += B.ag.h + g + e;
      const bandY = y + (B.tab ? B.tab.h : 0);
      if(B.tab){ const tx = W - B.tab.w; if(tx > 8) h += rect(0, y, tx, B.tab.h, `background:linear-gradient(to right, var(--lg-paper), var(--lg-shade))`); h += B.tab.html(tx, y); }
      h += B.band.html(bandY); y = bandY + B.band.h;
      if(story) h += X.row(m, y + m, pw, H - y - 2*m, 2, g);
    } else {
      if(story){ y = m; h += B.band.html(y + ph - ov) + X.hero(m, y, pw, ph); y += ph - ov + B.band.h; }
      else { h += B.band.html(0) + X.hero(m, B.band.h - ov, pw, ph); y = B.band.h - ov + ph; if(rowH){ h += X.row(m, y + g, pw, rowH, 2, g); y += rowH + g; } }
      y += g*1.3 + gs*.35; h += B.sl.html(pad, y); y += B.sl.h + g*1.1 + gs*.3;
      h += rect(pad, y, W - 2*pad, 1, 'background:rgba(0,0,0,.2)'); y += 1 + g;
      h += B.ag.html(pad, y); y += B.ag.h;
      if(story) h += X.row(m, y + m, pw, H - y - 2*m, 2, g);
    }
    T.done();
    return h;
  };

  // ================= square, wide (X), Google Business Profile: the postcard fronts =================
  // Just Listed: the house print at the left, the facts stacked with short rules and the agent beside it, the band across the foot
  // (the word, the hairline, the street and the place). Just Sold: the band across the head, the house print at the right laid over
  // its edge; at the left the question, the note on its mat, a hairline, the agent.
  const card = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js';
    const m = r2(Math.min(13*f, H*.05)), pad = r2(16*f), g = r2(Math.min(8*f, H*.04)), gC = r2(Math.min(15*f, W*.035)), FX = facts(D), ov = r2(Math.min(13*f, H*.045)), KMIN = .6, KMAX = 2;
    const fits = (w, h) => h >= X.min(w) - .5;
    // the house print in a column pw wide and room tall: where the house cannot fill the height (taller would cut it), a room print
    // goes under it (the grid of prints); a small remainder is split above and below
    const zoom = (pw, room) => Math.max(0, Math.min(room, X.max(pw))/X.nat(pw) - 1.2)*300;   // a print much taller than the photo crops in on the house: counted against it
    const rest = (pw, room) => Math.max(0, room - Math.min(room, X.max(pw))), okRest = r => r <= 8*f || r >= 84*f;
    const prints = (x, y, pw, room) => { const ph = Math.max(X.min(pw), Math.min(room, X.max(pw))), r = room - ph;
      return r >= 84*f ? X.hero(x, y, pw, ph) + X.row(x, y + ph + g*.8, pw, r - g*.8, 1, g) : X.hero(x, y + r/2, pw, ph); };
    let h = CSS;
    // the agent under the print (pw wide): one line across where the width holds it, else the lines with the logo beside them, else
    // a centered stack; the agent in a text column: the lines with the logo beside them, else the centered stack
    const agentAt = (pw, k) => agent(D, T, pw, k, 'line') || agent(D, T, pw, k, 'row') || agent(D, T, pw, k, 'duo') || agent(D, T, pw, k, 'stack', 'center');
    // Just Sold: where neither one line nor the lines with the logo fill the print's width, the lines with the logo beside them
    // still come before the tall stack, so the print keeps the height that shows the whole house
    const agentAtS = (pw, k) => agent(D, T, pw, k, 'line') || agent(D, T, pw, k, 'row') || agent(D, T, pw, k, 'duo') || agent(D, T, pw, k, 'row', 'any') || agent(D, T, pw, k, 'stack', 'center');
    const agentIn = (cw, k) => agent(D, T, cw, k, 'row') || agent(D, T, cw, k, 'stack', 'center');
    const KS = [2, 1.7, 1.45, 1.25, 1.1, .95, .8, .65], none = {h: 0, html: () => ''};
    if(!sold){
      // Every band that fits (one row, or the word over the street at several sizes), every print width, two arrangements:
      //   'under': the print with the agent under it at the left; the facts one to a line down the column beside them
      //   'beside': the print at the left; the facts over the agent in the column beside it. Where the column cannot hold the facts
      //             (X's wide image) they run as one line in the main color across the head of the band.
      const bands = [];
      if(shape !== 'square') for(const t of [1.3, 1.1, .9, .7, .6]){ const b = bandRow(T, Li, W, t, SocialSet.M, shape === 'wide' ? {under: 1} : {}) || bandRow(T, Li, W, t, SocialSet.M); if(b && b.h <= H*.4){ b.pen = Math.max(0, b.h - H*.32)*2; bands.push(b); } }
      for(const wk of [1, .85, .7, .55, .4, .3]){ const b = bandStack(T, Li, W, .8, SocialSet.M, {wordK: wk}); if(b && (b.h <= H*.4 || (wk === .3 && !bands.length))){ b.pen = (1 - wk)*400; bands.push(b); } }
      const strip = factLine(T, FX, W, 1, true);
      let pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
      bands.forEach((band, bi) => { const bp = band.pen + bi*3;
        for(let fr = shape === 'square' ? .6 : .64; fr >= .4; fr -= .02){ const pw = Math.round(W*fr), cw = W - 2*m - pw - gC; if(cw < 60*f) continue;   // the facts' column keeps a third of the width or more
          { const avail = H - band.h - 2*m, fc = factCol(T, FX, cw, avail, 1);   // 'under'
            if(fc) for(const k of KS){ const ag = agentAt(pw, k); if(!ag) continue; const room = avail - g - ag.h; if(room < X.min(pw)) continue;
              const ph = Math.min(room, X.max(pw)), left = room - ph, short = Math.max(0, X.nat(pw)*.86 - ph);
              take({v: 'under', band, pw, cw, fc, ag, ph, left, avail, sc: fc.n*40 + fc.fs*4 + pw*ph/(W*H)*1400 + k*30 - left*3 - short*2 - zoom(pw, room) - bp - Math.max(0, cw - fc.wide - 16*f)*2}); } }
          { const avail = H - band.h - 2*m;   // 'foot': the agent on one line across the paper's foot, the print and the facts over it
            for(const k of KS){ const ag = agent(D, T, W - 2*m, k, 'line'); if(!ag) continue; const room = avail - g - ag.h; if(room < X.min(pw)) continue;
              const fc = factCol(T, FX, cw, room, 1); if(!fc) continue;
              const ph = Math.min(room, X.max(pw)), left = room - ph, short = Math.max(0, X.nat(pw)*.86 - ph);
              take({v: 'foot', band, pw, cw, fc, ag, ph, left, room, avail, sc: fc.n*40 + fc.fs*4 + pw*ph/(W*H)*1400 + k*30 - left*4 - short*2 - zoom(pw, room) - bp - Math.max(0, cw - fc.wide - 16*f)*2 - 8}); } }
          for(const st of (strip ? [null, strip] : [null])){ const avail = H - band.h - 2*m - (st ? st.h : 0); if(avail < X.min(pw) || !fits(pw, avail)) continue;   // 'beside'
            for(const k of [2.6, 2.3].concat(KS)){ const ag = agentIn(cw, k); if(!ag || ag.h > avail) continue;
              const fc = st ? null : factCol(T, FX, cw, avail - ag.h - g*.9, 1); if(!st && !fc) continue;
              const gap = rest(pw, avail), lf = st ? avail - ag.h : 0;
              take({v: 'beside', band, pw, cw, fc, st, ag, avail, lf, sc: (fc ? fc.n*40 + fc.fs*4 : strip.n*32) + pw*Math.min(avail, X.max(pw))/(W*H)*1400 + k*30 - lf*3 - (okRest(gap) ? 0 : gap*4) - zoom(pw, avail) - bp - (st ? 20 : 0) - (fc ? Math.max(0, cw - fc.wide - 16*f)*2 : 0)}); } } } });
      if(!pick){ const band = bands[bands.length - 1], pw = Math.round(W*.56), avail = H - band.h - 2*m, ag = agentIn(W - 2*m - pw - gC, .65) || none; pick = {v: 'beside', band, pw, cw: W - 2*m - pw - gC, fc: null, st: null, ag, avail, lf: 0}; }
      const {band, pw, cw, fc, ag, avail} = pick, BT = H - band.h, cx = m + pw + gC;
      if(pick.v === 'under'){ const left = pick.left;
        h += X.hero(m, m + left*.3, pw, pick.ph) + ag.html(m, m + left*.3 + pick.ph + g + left*.4); h += fc.html(cx, m); }
      else if(pick.v === 'foot'){ h += X.hero(m, m + pick.left/2, pw, pick.ph) + fc.html(cx, m) + rect(m, m + pick.room + g*.45, W - 2*m, 1, 'background:rgba(0,0,0,.18)') + ag.html(m, m + pick.room + g); }
      else { h += prints(m, m, pw, avail);
        if(fc){ const fh = avail - ag.h - g*.9; h += fc.html(cx, m) + ag.html(cx, m + fh + g*.9); } else h += ag.html(cx, m + (avail - ag.h)/2);
        if(pick.st) h += rect(0, BT - 12, W, 13, `background:${MAIN}`) + pick.st.html(0, BT - pick.st.h + 10); }   // the facts line sits close over the band's own words
      h += band.html(BT);
    } else {
      // the head band at up to three sizes (a slimmer band leaves the note more room), largest first
      const bandsS = [];
      if(shape === 'wide') for(const t of [1.3, 1, .7, .6]){ const b = bandRow(T, Li, W, t, SocialSet.M, {plain: 1, tail: ov}); if(b && b.h <= H*.3 && !bandsS.some(x => Math.abs(x.h - b.h) < 4)) bandsS.push(b); }
      if(!bandsS.length) for(const wk of [1, .9, .8, .7, .6, .5, .4]){ const b = bandStack(T, Li, W, .8, SocialSet.M, {tail: ov, wordK: wk}); if(b && b.h <= H*.34){ bandsS.push(b); break; } }
      if(!bandsS.length) bandsS.push(bandStack(T, Li, W, .8, SocialSet.M, {tail: ov, wordK: .4}));
      let pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
      const RL = shape !== 'square', RW = shape === 'wide';   // wide and Google post (owner 11/18): the postcard's own note, naming the sale (on the wide image in two or three full lines)
      const frMax = shape === 'wide' ? .62 : .54;   // the note's column keeps at least two fifths of the width beside the print
      bandsS.slice(0, 3).forEach((band, bi) => {
      const top = band.h, avail = H - m - top, proom = H - m - (top - ov);   // the left column's room under the band; the print column's room
      // Every print width, two arrangements; the one with the fullest real note in two to four full lines, the largest type and
      // print and the least paper left:
      //   'under': the print laid over the band's edge with the agent under it; at the left the question and the note on its mat
      //   'beside': the print alone at the right; at the left the question, the note, a hairline and the agent
      //   'foot': the agent on one line across the foot. 'base': the question and the note on its mat across the foot, full width
      //           (two or three full lines of the real note), the print and the agent side by side over them
      const noteSc = sl => (sl.real ? 150 : 0) + Math.min(sl.len, 120)*2 + (sl.len >= 85 ? 200 : 0) + (sl.n === 2 || sl.n === 3 ? 260 : sl.n === 4 ? 200 : sl.n === 1 ? 80 : sl.n ? -120 : 0);   // a tall narrow box of five lines or more counts against the arrangement
      for(let fr = .66; fr >= (RW ? .299 : .38); fr -= .02){ const pw = Math.round(W*fr), cw = W - m - pad - pw - gC, wideCol = fr <= frMax + .001; if(cw < 62*f) continue;
        let A = null;   // 'under'
        if(wideCol) for(const k of KS){ const ag = RL ? agentAtS(pw, k) : agentAt(pw, k); if(!ag) continue; const room = proom - g - ag.h; if(room < X.min(pw)) continue;
          const ph = Math.min(room, X.max(pw)), left = room - ph, short = Math.max(0, X.nat(pw)*.86 - ph), sc = k*30 - left*3 - short*2 - zoom(pw, room);
          if(!A || sc > A.sc) A = {ag, ph, left, sc}; }
        if(A) for(const kt of KS) for(const so of (RW ? [{lines: 3, real: 'fill'}, {lines: 2, real: 'fill'}, {room: avail - g*1.3, real: 'fill'}] : [{room: avail - g*1.3, real: RL}])){ const sl = sell(D, T, cw, kt, so); if(!sl || sl.h > avail - g) continue;
          take({band, top, avail, kt, so, sc0: bi*12, v: 'under', pw, cw, sl, lf: avail - g - sl.h, ag: A.ag, ph: A.ph, left: A.left, sc: A.sc + noteSc(sl) + kt*30 + pw*A.ph/(W*H)*900 - (avail - g - sl.h)*5}); }
        // 'foot': the agent on one line across the foot; on the wide image, where one line cannot hold it, the lines at the left with
        // the logo beside them, or the name with the logo at its far end (REALTOR(R) and the phone under it), at every size
        if(wideCol) for(const k of (RW ? KS.concat(KMIN) : KS)){ const ln = agent(D, T, W - m - pad, k, 'line'), ags = ln ? [ln] : RW ? [agent(D, T, W - m - pad, k, 'row', 'any'), agent(D, T, W - m - pad, k, 'duo', 'mid')].filter(Boolean) : []; if(!ags.length) continue;
          for(const ag of ags){
          const room = proom - g - ag.h, lroom = avail - g - ag.h; if(room < X.min(pw)) continue;
          const ph = Math.min(room, X.max(pw)), left = room - ph, short = Math.max(0, X.nat(pw)*.86 - ph);
          for(const kt of (RW ? KS.concat(KMIN) : KS)) for(const so of (RW ? [{lines: 3, real: 'fill', qg: 3.5}, {lines: 2, real: 'fill', qg: 3.5}, {room: lroom - g*.6, real: 'fill'}] : [{room: lroom - g*.6}])){ const sl = sell(D, T, cw, kt, so); if(!sl || sl.h > lroom - g*.4) continue;
            take({band, top, sc0: bi*12, v: 'foot', pw, cw, sl, ag, ph, left, lroom, lf: lroom - g*.4 - sl.h, sc: k*30 - left*4 - short*2 - zoom(pw, room) + noteSc(sl) + kt*30 + pw*ph/(W*H)*900 - (lroom - sl.h)*3 - 8}); } }
          if(ln) break; }
        for(const kt of KS){ const sl = sell(D, T, W - 2*pad, kt, {lines: 3, qK: 1.9}); if(!sl || !sl.n) continue;   // 'base' (the question set large: it heads the full-width mat)
          const mid = avail - sl.h - g*1.7; if(mid + ov < X.min(pw)) continue;
          let ag = null, ak = 0; for(const k of KS){ const a = agentIn(cw, k); if(a && a.h <= mid){ ag = a; ak = k; break; } } if(!ag) continue;
          const ph = Math.min(mid + ov, X.max(pw)), left = mid + ov - ph;
          take({band, top, v: 'base', pw, cw, sl, ag, ph, left, mid, lf: 0, sc: noteSc(sl) + kt*8 + ak*20 + pw*ph/(W*H)*1500 - left*3 - (mid - ag.h)*3.5 - zoom(pw, mid + ov) - bi*12}); }
        if(wideCol && fits(pw, proom)){ const gap = rest(pw, proom), base = pw*Math.min(proom, X.max(pw))/(W*H)*900 - (okRest(gap) ? 0 : gap*4) - zoom(pw, proom);   // 'beside'
          for(const k of KS){ const ag = agentIn(cw, k); if(!ag) continue; const fix = g*1.2 + 1 + g + ag.h;
            const sl = sell(D, T, cw, k, {room: avail - g*.9 - fix, real: RL}); if(!sl || sl.h + fix > avail - g*.8) continue;
            take({band, top, sc0: bi*12, v: 'beside', pw, cw, sl, ag, lf: avail - g*.8 - sl.h - fix, sc: base + noteSc(sl) + k*50 - (avail - g*.8 - sl.h - fix)*3 - 10}); } } }
      });
      if(pick) pick.sc -= 0;
      // the Google post: a real note that leaves the column more than a little paper sets larger (up to 35%), so the mat fills its height
      if(pick && pick.v === 'under' && RL && !RW && pick.lf > 30*f){ const s2 = sell(D, T, pick.cw, pick.kt, Object.assign({grow: 1}, pick.so));
        if(s2 && s2.real && s2.h > pick.sl.h && s2.h <= pick.avail - g){ pick.sl = s2; pick.lf = pick.avail - g - s2.h; } }
      if(!pick){ const band = bandsS[bandsS.length - 1], top = band.h, avail = H - m - top, pw = Math.round(W*.5), cw = W - m - pad - pw - gC; pick = {band, top, v: 'beside', pw, cw, sl: sell(D, T, cw, KMIN, {lines: 0}) || none, ag: agentIn(cw, KMIN) || none, lf: 0}; }
      const band = pick.band, top = pick.top;
      const {pw, cw, sl, lf, ag} = pick, px = W - m - pw, py = top - ov;
      h += band.html(0);
      if(pick.v === 'under'){ h += X.hero(px, py, pw, pick.ph) + ag.html(px, py + pick.ph + g + pick.left*.5) + sl.html(pad, top + g*.6 + lf*.5); }
      else if(pick.v === 'base'){ h += X.hero(px, py + pick.left/2, pw, pick.ph) + ag.html(pad, top + g*.5 + (pick.mid - ag.h)/2) + sl.html(pad, H - m - sl.h); }
      else if(pick.v === 'foot'){ const ay = H - m - ag.h;
        h += X.hero(px, py + pick.left/2, pw, pick.ph) + sl.html(pad, top + g*.5 + lf*.45) + rect(pad, ay - g*.55, W - m - pad, 1, 'background:rgba(0,0,0,.18)') + ag.html(pad, ay); }
      else { h += prints(px, py, pw, H - m - py); let y = top + g*.5 + lf*.3;
        h += sl.html(pad, y); y += sl.h + g*1.2 + lf*.3;
        h += rect(pad, y, cw, 1, 'background:rgba(0,0,0,.2)'); y += 1 + g + lf*.25;
        h += ag.html(pad, y); }
    }
    T.done();
    return h;
  };
  LG.portrait = (D, L, W, H, shape) => shape === 'square' ? card(D, L, W, H, shape) : tall(D, L, W, H, shape);
  LG.landscape = card;

  // ================= carousel photo slides: the room as a print on the paper, the band across the foot =================
  LG.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), X = heroKit(D, T.f), m = r2(13*T.f);
    const band = bandRow(T, D.listing, W, 1, SocialSet.M, {wordMax: T.FE*1.7}) || bandRow(T, D.listing, W, .8, SocialSet.M, {wordMax: T.FE*1.5}) || bandStack(T, D.listing, W, .6, SocialSet.M, {plain: 1});
    const BT = H - band.h, h = CSS + X.photo(D.piece.photo, m, m, W - 2*m, BT - 2*m) + band.html(BT);
    T.done();
    return h;
  };
  window.LGSocial = LG;
})();
