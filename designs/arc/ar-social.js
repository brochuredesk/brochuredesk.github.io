/* templates/arc/ar-social.js: Arc's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on piece matches
   its set's main pieces). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and replaces its three layouts for
   this set only; nothing shared changes.

   Read off the approved Arc pieces (postcard.html, flyer.html, foldover.html, ar-tokens.css, ar-marks.css, ar.js):
     - THE arc: the photo's foot is one long swept curve (AR.bez: high at one end, full height at the other) with the kit's accent
       as a hairline echoing it just below
     - JUST / LISTED and JUST / SOLD stacked very large in light Spectral caps set tight: the main color on the kit's paper
       (Just Listed), white on the main-color field (Just Sold)
     - the street in Jost 600 with its name in the main color (in the accent on Just Sold), the place in small tracked caps
     - Just Listed: the facts and highlights on short accent dashes; the main-color block across the foot from the left trim with ONE
       big rounded corner, the agent on it in white (REALTOR(R) in accent caps beside the phone), the logo on the paper beside it
     - Just Sold, the block grown into the whole image: "Thinking about selling?" in Spectral in the accent, the note in the white
       box with the thin accent line, a hairline, the agent and the white logo
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house inside every curved cut
   (OHL.polyFits; the engine's house-cut check), text at the phone floors of templates/_shared/readsize.js. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const SP = "'Spectral'", JO = "'Jost'", Q = 'Thinking about selling?';
  const MAIN = 'var(--ars-main)', ONM = 'var(--ars-on-main)', MINK = 'var(--ars-main-ink)', STRIPE = 'var(--ars-stripe)', GOLD = 'var(--ars-gold)', INK = '#161616', SOFT = '#3a3a37';
  const F = {
    word: s => `font:400 ${s}pt ${SP};text-transform:uppercase;letter-spacing:${(-s*.006).toFixed(2)}pt`,
    addr: s => `font:600 ${s}pt ${JO}`,
    place: s => `font:500 ${s}pt ${JO};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`,
    fact: s => `font:400 ${s}pt ${JO}`,
    hl: s => `font:500 ${s}pt ${JO}`,
    q: s => `font:500 ${s}pt ${SP}`,
    note: s => `font:400 ${s}pt ${JO}`,
    name: s => `font:700 ${s}pt ${JO}`,
    tag: s => `font:600 ${s}pt ${JO};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`,
    phone: s => `font:600 ${s}pt ${JO}`,
  };
  const CSS = `<style>
    .ss .ars-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ss .ars-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .ars-logo .text{font:700 12pt/1.15 ${JO};text-align:center;color:inherit}
    .ss .ars-hs{position:absolute;overflow:hidden}.ss .ars-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .ars-caps{position:absolute;white-space:nowrap}
    .ss .ars-wb{position:absolute;background:#fff;border:1.2pt solid ${STRIPE};box-sizing:border-box}
    .ss .ars-echo{position:absolute;left:0;top:0;width:1pt;height:1pt;overflow:visible;pointer-events:none}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;
  // the colors of each moment: Just Listed on the paper, Just Sold on the main-color field
  const pal = sold => sold ? {word: ONM, ink: ONM, name: GOLD, place: GOLD, echo: GOLD, dash: GOLD, rule: ONM}
    : {word: MINK, ink: INK, name: MINK, place: SOFT, echo: STRIPE, dash: STRIPE, rule: INK};

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
  // Spectral's capitals, measured on the page: the cap height and where the baseline falls in a line box as tall as the type (in em)
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = `400 200px ${SP}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:400 200px ${SP};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}; return MET; };
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}" data-slot="${slot}" data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };

  // ---------- the word: JUST / LISTED, JUST / SOLD stacked in the tall Spectral caps, set by their ink ----------
  // (slot moment.head: a heading, so the shared caption check does not read the stacked word as a write-up under the photo)
  // w: the width the longer line fills. Returns its size, each line's width, the ink height (h) and the line step (L).
  const wordEl = (T, lines, w, color, max) => { const m = met(), w100 = Math.max(...lines.map(t => T.tw(t.toUpperCase(), F.word(100))));
    const s = Math.max(T.FE, Math.min(max || 999, Math.floor(w/w100*100*2)/2)), L = r2(s*.9*2)/2, ws = lines.map(t => T.tw(t.toUpperCase(), F.word(s)));
    return {s, L, ws, w: Math.max(...ws), h: (lines.length - 1)*L + m.cap*s,
      html: (x, y, align, bw) => `<div class="ars-caps" data-slot="moment.head" data-lines="${lines.length}" style="left:${x}pt;top:${y - ((L - s)/2 + (m.base - m.cap)*s)}pt;width:${(bw || Math.max(...ws)) + 3}pt;height:${lines.length*L}pt;${F.word(s)};line-height:${L}pt;color:${color};text-align:${align || 'left'}">${lines.map(esc).join('<br>')}</div>`}; };

  // ---------- the arc ----------
  // AR.bez's cubic (P1 at 28% across and 85% of the drop, P2 at 62% across on the low line): the share of the drop done at u across
  const ARC = (() => { const P = [[0, 0], [.28, .85], [.62, 1], [1, 1]], S = [];
    for(let i = 0; i <= 64; i++){ const t = i/64, u = 1 - t; S.push([0, 1].map(k => u*u*u*P[0][k] + 3*u*u*t*P[1][k] + 3*u*t*t*P[2][k] + t*t*t*P[3][k])); }
    return u => { if(u <= 0) return 0; if(u >= 1) return 1; for(let i = 1; i < S.length; i++) if(S[i][0] >= u){ const a = S[i - 1], b = S[i]; return a[1] + (b[1] - a[1])*(u - a[0])/((b[0] - a[0]) || 1); } return 1; }; })();
  const echoOf = W => ({eo: Math.max(5, W*.017), sw: Math.max(1.4, W*.0042)});
  // a photo whose foot is the arc (high at the left, full height at the right; mirror: the other way), the accent hairline echoing
  // it. The sweep is as deep as dropMax allows while the whole house stays inside the cut (shallower until it does, else straight).
  const arcPhoto = (D, id, x, y, w, h, dropMax, mirror, color, E, minDrop) => {
    const full = Ivory.fullHouse(D, id), up = (u, d) => d*(1 - ARC(mirror ? 1 - u : u)); let drop = 0, poly = null;
    for(let d = dropMax; d >= (minDrop || w*.03) - .01; d -= Math.max(1, w*.008)){ const p = [[0, 0], [1, 0]]; for(let i = 32; i >= 0; i--) p.push([i/32, 1 - up(i/32, d)/h]);
      if(!full || OHL.polyFits(D, id, w, h, p, .015)){ drop = d; poly = p; break; } }
    const st = `left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt`, yAt = X => y + h - up(Math.max(0, Math.min(1, (X - x)/w)), drop);
    const pts = Array.from({length: 49}, (_, i) => { const X = x + w*i/48; return `${X.toFixed(2)},${(yAt(X) + E.eo).toFixed(2)}`; }).join(' ');
    return {drop, yAt, html: (poly ? OHL.maskedPhoto(D, id, st, poly) : OHL.photo(D, id, st))
      + `<svg class="ars-echo" viewBox="0 0 1 1"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${E.sw}"/></svg>`}; };

  // ---------- photos ----------
  const heroKit = (D, f) => {
    const id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const sup = n => window.OHEmail ? OHEmail.support(D, id, n) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p)).slice(0, n);
    return {id, pAR,
      min: w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)), nat: w => Math.ceil(w/pAR),
      max: w => Math.ceil(hb ? Math.max(w/pAR, w/((hb.right - hb.left + .05)*pAR)) : w/pAR),   // taller crops the sides, never the house
      // a frame taller than the photo's shape centers on the house
      // the shortest frame w wide in which the sweep (d deep) clears the whole house
      arcMin: (w, d, cap) => { const mn = Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)); if(!Ivory.fullHouse(D, id)) return mn;
        for(let ht = mn; ht <= cap; ht += 3){ if(hb && ht > w/pAR){ const vis = w/(ht*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; }
          const p = [[0, 0], [1, 0]]; for(let i = 32; i >= 0; i--) p.push([i/32, 1 - d*(1 - ARC(i/32))/ht]); if(OHL.polyFits(D, id, w, ht, p, .015)) return ht; }
        return mn; },
      focus: (w, ht) => { if(hb && ht > w/pAR){ const vis = w/(ht*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } },
      row: (x, y, w, ht, n, g) => { const ids = sup(n); if(!ids.length || ht < 30) return ''; const pw = (w - (ids.length - 1)*g)/ids.length; return ids.map((p, i) => OHL.photo(D, p, `left:${x + i*(pw + g)}pt;top:${y}pt;width:${pw}pt;height:${ht}pt`)).join(''); }};
  };

  // ---------- words ----------
  // the street as the postcards set it: Jost 600, the street's name in the main color (the accent on Just Sold). Never shortened:
  // one line down to the floor size, else two lines at the floor (the break after the number, the name and its suffix together).
  const addrFit = (T, Li, w, max, two) => { const t = String(Li.address || ''), m = /^(\S+\s+)(.+?)(\s+\S+)?$/.exec(t) || [], s = T.one(t, F.addr, w - 2, max, T.FE);
    const mk = nb => cb => `<span>${esc(m[1] || '')}<b style="font-weight:600;color:${cb}">${esc(m[2] || t)}</b>${m[3] ? (nb ? ' ' : ' ') + esc(m[3].trim()) : ''}</span>`;
    if(s) return {s, n: 1, w: T.tw(t, F.addr(s)), h: s*1.2, mk: mk(0)};
    if(!two || true) return null;   // (the street is never split onto two lines: owner's review 11/18)
    const t2 = t.replace(/\s+(\S+)\s*$/, ' $1'), r = T.rows(t2, F.addr(T.FE), w, T.FE*1.2);
    return r.n <= 2 && r.wide <= w - 1 ? {s: T.FE, n: 2, w: r.wide, h: 2*T.FE*1.2 + T.FE*.15, mk: mk(1)} : null; };
  const addrTxt = (a, x, y, w, P, align) => txt('address', '', x, y, w, a.s, 1.2, F.addr, P.ink, {n: a.n, align, html: a.mk(P.name)});
  const facts = D => { const six = OHL.factSix(D.listing), strong = six.some(([ic]) => ic === 'lot' || ic === 'cal');
    const keep = six.filter(([ic]) => !(ic === 'stories' && strong));
    return {full: keep.map(([, t]) => t).slice(0, 5), short: keep.map(([ic, t]) => ic === 'bed' ? t.replace('bedroom', 'bed') : ic === 'bath' ? t.replace(' full bath', ' bath') : ic === 'area' ? t.replace(' square feet', ' sq ft') : ic === 'cal' ? t.replace('Built in', 'Built') : t).slice(0, 5)}; };
  // the postcard front's highlights (the writer's), minus any condition claim
  const highlights = D => [].concat((((((D.sw || {}).pc || {}).jl || {}).front || {}).highlights) || []).map(String).filter(t => t && !SocialSet.CONDITION.test(t)).slice(0, 3);
  // the seller notes, fullest first: the postcard's own (sw.pc.js.front.note2), their closing sentences, then the engine's Just Sold line
  const notes = D => { const F0 = ((((D.sw || {}).pc || {}).js || {}).front || {}), n2 = [].concat(F0.note2 || []).map(String);
    const tail = n2.map(t => t.split(/(?<=[.!?])\s+/).slice(1).join(' ')).filter(Boolean);
    return n2.concat(tail, [SocialSet.SOLD_POST]).filter((t, i, a) => t && a.indexOf(t) === i && !SocialSet.CONDITION.test(t)); };
  // a list on short accent dashes (the postcard's highlights), one item to a line
  const dashList = (T, list, w, face, max, min, slot, P, lhK) => { if(!list.length) return null; const dw = r2(9*T.f), dg = r2(6*T.f);
    const fs = Math.min(...list.map(t => T.one(t, face, w - dw - dg - 2, max, min) || 0)); if(!fs) return null; const lh = fs*(lhK || 1.55);
    return {h: list.length*lh, fs, wide: dw + dg + Math.max(...list.map(t => T.tw(t, face(fs)))), html: (x, y, sp) => list.map((t, i) => { const yy = y + i*(lh + (sp || 0));
      return rect(x, yy + lh/2 - .6, dw, 1.2, `background:${P.dash}`) + txt(slot + '.' + i, t, x + dw + dg, yy, w - dw - dg, fs, lhK || 1.55, face, P.ink); }).join('')}; };
  // the facts packed whole into lines with dots between them (the postcard's two fact lines)
  const factLines = (T, FX, w, fs, maxL, sfx, only) => { for(const list of (only || [FX.full, FX.short, FX.full.slice(0, 4), FX.short.slice(0, 4)])){ if(list.length < 2) continue;
      const out = [], dot = sfx ? ' · ' : '  ·  '; let ok = true; for(const it of list){ const t = out.length ? out[out.length - 1] + dot + it : null; if(t && T.tw(t, F.fact(fs)) <= w) out[out.length - 1] = t; else { if(T.tw(it, F.fact(fs)) > w){ ok = false; break; } out.push(it); } }
      if(ok && out.length <= maxL) return {n: list.length, ws: out.map(t => T.tw(t, F.fact(fs))), lh: fs*1.4, h: out.length*fs*1.4, html: (x, y, color, align) => out.map((t, i) => txt('facts.' + i + (sfx || ''), t, x, y + i*fs*1.4, w, fs, 1.4, F.fact, color, {align})).join('')}; }
    return null; };

  // the same, at the largest size (max down to min) whose lines run most of the measure, so no room stands empty beside them
  const factFill = (T, FX, w, min, max, maxL, sfx) => { for(let ml = Math.min(2, maxL); ml <= maxL; ml++) for(const list of [FX.full, FX.short, FX.full.slice(0, 4), FX.short.slice(0, 4)]) for(let fs = r2(max); fs >= min - .01; fs -= .5){ const c = factLines(T, FX, w, fs, ml, sfx, [list]); if(c && Math.min(...c.ws) >= .5*w && Math.max(...c.ws) >= .8*w) return c; }
    return factLines(T, FX, w, min, maxL, sfx); };

  // ---------- the agent: name, REALTOR(R) in accent caps beside the phone (the postcard's line); the headshot at its left ----------
  const agentEl = (D, T, w, k, nmax) => {
    const A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), gap = r2(9*T.f);
    const size = cw => { let ns = T.one(A.name || '', F.name, cw, Math.max(T.FB*1.1, Math.min(T.FB*1.45*k, nmax || 999)), T.FB*1.1), ps0 = r2(Math.max(T.FB, T.FB*1.12*k)), ds0 = r2(Math.max(T.FS, T.FS*Math.min(k, 1.4))); if(!ns) return null;
      let ds = ds0, dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0, ps = null, inl = true;
      for(let s = ps0; s >= T.FB - .01 && !ps; s -= .5) if(dW + (nar ? s*.7 : 0) + T.tw(A.phone || '', F.phone(s)) <= cw) ps = s;
      // REALTOR(R) at its floor size before it leaves the phone's line
      if(!ps && nar && ds0 > T.FS){ const d2 = T.tw('REALTOR®', F.tag(T.FS)); for(let s = ps0; s >= T.FB - .01 && !ps; s -= .5) if(d2 + s*.7 + T.tw(A.phone || '', F.phone(s)) <= cw){ ps = s; ds = T.FS; dW = d2; } }
      if(!ps){ inl = false; ps = T.one(A.phone || '', F.phone, cw, ps0, T.FB); if(!ps) return null; }
      if(!inl && ps){ const nW = T.tw(A.name || '', F.name(ns)), p2 = T.one(A.phone || '', F.phone, Math.min(cw, nW), ns, T.FB); if(p2) ps = p2; }   // stacked: the phone runs about as wide as the name
      if(inl && ps){ const n2 = T.one(A.name || '', F.name, Math.min(cw, dW + (nar ? ps*.7 : 0) + T.tw(A.phone || '', F.phone(ps))), Math.min(nmax || 999, ps*1.9), ns); if(n2 && n2 > ns) ns = n2; }   // the name runs about as wide as the line under it
      const wide = Math.max(T.tw(A.name || '', F.name(ns)), inl ? dW + (nar ? ps*.7 : 0) + T.tw(A.phone || '', F.phone(ps)) : Math.max(dW, T.tw(A.phone || '', F.phone(ps))));
      return {ns, ps, ds, dW, inl, wide, th: ns*1.2 + 3*T.f + (inl || !nar ? 0 : ds*1.3 + T.f) + ps*1.3}; };
    for(const h0 of (hsOn ? [1] : [0])){   // (the headshot stays on every shape: owner's review 11/18)
      const p0 = size(h0 ? w*.7 : w) || size(w); if(!p0) return null; const hsW = h0 ? Math.round(p0.th*.82) : 0, S = size(w - (h0 ? hsW + gap : 0)); if(!S) continue;
      return {h: S.th, wide: (h0 ? hsW + gap : 0) + S.wide + 2, html: (x, y) => { const tx = x + (h0 ? hsW + gap : 0), cw = S.wide + 2; let yy = y + S.ns*1.2 + 3*T.f;
        let s = (h0 ? `<div class="abs ars-hs" style="left:${x}pt;top:${y}pt;width:${hsW}pt;height:${S.th}pt"><img src="${esc(A.headshot)}" alt=""></div>` : '') + txt('agent.name', A.name || '', tx, y, cw, S.ns, 1.2, F.name, ONM);
        const pw = T.tw(A.phone || '', F.phone(S.ps));
        if(S.inl && nar) s += txt('agent.desig', 'REALTOR®', tx, yy + S.ps*1.3*.78 - S.ds*1.3*.78, S.dW + 2, S.ds, 1.3, F.tag, GOLD, {small: 1}) + txt('agent.phone', A.phone || '', tx + S.dW + S.ps*.7, yy, pw + 2, S.ps, 1.3, F.phone, ONM);
        else { if(nar){ s += txt('agent.desig', 'REALTOR®', tx, yy, cw, S.ds, 1.3, F.tag, GOLD, {small: 1}); yy += S.ds*1.3 + T.f; } s += txt('agent.phone', A.phone || '', tx, yy, cw, S.ps, 1.3, F.phone, ONM); }
        return s; }};
    }
    return null;
  };
  const onMainTone = () => /^#?f/i.test(getComputedStyle(document.documentElement).getPropertyValue('--ars-on-main').trim()) ? 'knockout' : 'light';
  const logoBox = (D, tone, x, y, w, h) => `<div class="abs ars-logo" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;color:${tone === 'light' ? INK : ONM}">${OHL.logo(D, tone, '')}</div>`;
  // the logo's box hugs a logo of the usual shape, so it sits centered in its room without loose air around it
  const logoFit = (D, tone, x, y, w, h, R) => { const lh = Math.min(h, w/(R || 3.3)), lw = Math.min(w, lh*4.4); return logoBox(D, tone, x + (w - lw)/2, y + (h - lh)/2, lw, lh); };

  // Just Listed's foot: the main-color block from the left trim with one big rounded corner, the agent on it; the logo on the paper
  // o.bw: the block's width; o.h: a taller block (the agent centered in it)
  const footJL = (D, T, W, k, pad, o) => { o = o || {}; const bp = r2(10*T.f*Math.min(k, 1.3)); let BW = o.bw || Math.round(W*.58);
    const ag = agentEl(D, T, BW - pad - bp*1.6, k, o.nmax); if(!ag) return null; const h = Math.max(o.h || 0, ag.h + 2*bp), R = Math.min(h*.5, 34*T.f*Math.max(1, Math.min(k, 1.4)));
    if(pad + ag.wide + R*.35 > BW) return null;
    if(o.hug) BW = Math.min(BW, Math.max(o.min || 0, Math.ceil(pad + ag.wide + bp*.7 + R*.55)));   // the block ends just past the agent's lines
    return {h, BW, R, html: (y, lx0, ly0, bw2) => rect(0, y, bw2 || BW, h + 1, `background:${MAIN};border-top-right-radius:${R}pt`) + ag.html(pad, y + (h - ag.h)/2)
      + (o.noLogo ? '' : logoFit(D, 'light', BW + r2(10*T.f), ly0 == null ? y + r2(4*T.f) : ly0, W - pad*.8 - BW - r2(10*T.f), (ly0 == null ? h - 2*r2(4*T.f) : y + h - r2(5*T.f) - ly0)))}; };
  // Just Sold's foot: the agent at the left, the logo at the right
  const footJS = (D, T, w, k) => { const ag = agentEl(D, T, w*.62, k); if(!ag) return null; const tone = onMainTone(), lw = Math.min(w - ag.wide - r2(14*T.f), ag.h*4.2); if(lw < 50*T.f) return null;
    return {h: ag.h, html: (x, y) => ag.html(x, y) + logoBox(D, tone, x + w - lw, y, lw, ag.h)}; };

  // ---------- Just Sold: the note in the white box with the thin accent line ----------
  // the fullest of the seller notes that fills the box: maxN lines or fewer, every line 80%+ and the last 90%+ of the measure (owner
  // 11/8), the measure narrowed a little (centered) or the type raised up to 13% to get there; justified when the lines run full
  // ref: the width of the photo the box sits under (a measure 80%+ as wide as the photo fills 80%+ of the photo on every line)
  const noteBox = (T, D, w, k, maxN, ref) => { const nb = r2(9*T.f*Math.min(k, 1.25)), iw = w - 2*nb - 3, ns0 = r2(Math.max(T.FB, T.FB*1.05*k)), list = notes(D); let pk = null;
    for(let n = Math.min(maxN, 8); n >= 1 && !pk; n--) for(const m of [1, .96, .92, .88]){ for(let s = ns0; s <= ns0*1.13 + .01 && !pk; s += .5) for(const t of list){
        const mw = iw*m, r = T.rows(t, F.note(s), mw, s*1.42); if(r.n !== n) continue; const big = ref && mw >= .78*ref, all = big ? Math.max(.8*mw, .82*ref) : .8*mw, last = big ? Math.max(.9*mw, .82*ref) : .9*mw;
        if(t === SocialSet.SOLD_POST && n !== 2) continue;
        if(big && mw < .82*ref) continue;
        if(n === 1 ? r.wide < last : (r.last < last || r.ws.slice(0, -1).some(x => x < .8*mw))) continue;
        const just = n > 1 && r.ws.slice(0, -1).every(x => x >= .86*mw); if(n > 1 && !just && r.ws.slice(0, -1).some(x => x < all)) continue;
        pk = {t, n, s, w: mw, just: false}; break; }
      if(pk) break; }
    if(!pk) return null; const lh = pk.s*1.42, h = pk.n*lh + pk.s*.15 + 2*nb;
    // the box hugs its text (no empty room beside it), centered in the width it was given
    const bw = Math.min(w, pk.w + 2*nb + 3), bx = (w - bw)/2;
    return {h, w, n: pk.n, len: pk.t.length, html: (x, y) => `<div class="ars-wb" style="left:${x + bx}pt;top:${y}pt;width:${bw}pt;height:${h}pt"></div>`
      + txt('sold.note', pk.t, x + (w - pk.w)/2, y + nb, pk.w, pk.s, 1.42, F.note, '#1b1b1b', {n: pk.n})}; };
  // the question in Spectral in the accent: one line, else "Thinking about / selling?"
  const question = (T, w, max, min, oneMin) => { let ql = [Q], qs = T.one(Q, F.q, w - 2, max, oneMin || Math.max(min, T.FB*1.25));
    if(!qs){ ql = ['Thinking about', 'selling?']; qs = T.one(ql[0], F.q, w - 2, max, min); if(!qs) return null; }
    return {h: ql.length*qs*1.22, qs, wide: Math.max(...ql.map(t => T.tw(t, F.q(qs)))), html: (x, y) => ql.map((t, i) => txt('sold.q' + (i ? 2 : ''), t, x, y + i*qs*1.22, w, qs, 1.22, F.q, GOLD)).join('')}; };

  // ---------- Just Listed: the writer's lines under the word (the house's story and what is nearby) ----------
  // the writer's sentences in order (the first always kept): maxN lines or fewer, every line 80%+ and the last 90%+ of the measure
  const writeUp = (T, D, w, s0, maxN) => { T.wu = T.wu || {}; const key = [Math.round(w), s0, maxN].join('|'); if(key in T.wu) return T.wu[key];
    const pool = SocialSet.sentences(D, Ivory.facts(D.listing)).slice(0, 7), near = /\bmiles?\b/i; let best = null;
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of [1, .96, .92]) for(const s of [s0, r2(s0*1.06), r2(s0*1.12)]){ const r = T.rows(t, F.note(s), w*m, s*1.42); if(r.n > maxN || r.n < 2) continue;
        if(r.last < .9*w*m || r.ws.slice(0, -1).some(x => x < .8*w*m)) continue;
        const sc = r.n*100 + (near.test(t) ? 80 : 0) + m*20 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc, just: false}; } }
    if(best){ best.h = best.n*best.s*1.42 + best.s*.15;
      best.html = (x, y, W0) => txt('writeup', best.t, x + (W0 - best.w)/2, y, best.w, best.s, 1.42, F.note, '#1b1b1b', {n: best.n, css: best.just ? 'text-align:justify;text-align-last:left' : ''}); }
    return (T.wu[key] = best); };

  const AS = {}, KS = [2, 1.8, 1.6, 1.45, 1.3, 1.15, 1, .85, .7, .6];
  // ================= post, pin, story, square =================
  // The house across the head, its foot the arc (high at the left) with the accent echo. Under it the word stacked very large, rising
  // into the room the sweep opens at the left; beside the word the street, the place and (Just Listed) the facts on accent dashes or
  // (Just Sold) the question. Then Just Listed: the writer's lines, the round-cornered block with the agent and the logo on the paper.
  // Just Sold: the note in the white box, a hairline, the agent and the logo. A story's last 250 px carry two rooms, no words.
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', story = shape === 'story', P = pal(sold);
    const BOT = story ? H - Math.max(94, r2(100*f)) : H, pad = r2(16*f), g = r2(8*f), gC = r2(9*f), w = W - 2*pad, E = echoOf(W), eg = E.eo + E.sw, FX = facts(D);
    const lines = sold ? ['Just', 'Sold'] : ['Just', 'Listed'], place = OHL.place(Li);
    // the column beside the word. Just Listed: the facts on accent dashes (never fewer than four). Just Sold: the street, the place, the question
    const side = (sw, k, lean) => {
      if(!sold){ let low = null; for(const list of (lean ? [FX.full.slice(0, 4), FX.short.slice(0, 4)] : [FX.full, FX.short, FX.full.slice(0, 4), FX.short.slice(0, 4)])){ low = dashList(T, list, sw, F.fact, Math.max(FB, FB*1.15*k), FB, 'facts', P, 1.5); if(low) break; }
        if(!low) return null;
        // (a column much wider than the dash list: the facts on dotted lines that run its width)
        if(low.wide < .62*sw){ const c = factFill(T, FX, sw, FB, FB*1.5*Math.min(k, 1.2), 4, '.label'); if(c && Math.max(...c.ws) >= .8*sw) return {h: c.h, html: (x, y, sp) => c.html(x, y + (sp || 0)/2, P.ink)}; }
        return {h: low.h, html: (x, y, sp) => low.html(x, y + (sp || 0)*.3, (sp || 0)*.7/Math.max(1, low.h/(low.fs*1.5)))}; }
      const a = addrFit(T, Li, sw, FE*1.3*k, true); if(!a) return null; const ps = T.one(place, F.place, sw - 2, FS*1.08*k, FS), low = question(T, sw, FE*1.35*k, FB); if(!low || !ps) return null;
      const g1 = 2*f, g2 = r2(7*f*Math.min(k, 1.4));
      return {two: a.n > 1, h: a.h + g1 + ps*1.3 + g2 + low.h, html: (x, y, sp) => addrTxt(a, x, y, sw, P) + txt('place', place, x, y + a.h + g1, sw, ps, 1.3, F.place, P.place, {small: 1}) + low.html(x, y + a.h + g1 + ps*1.3 + g2 + (sp || 0)*.5)}; };
    // Just Listed: the street at the left and the place at the right end of one line under the word (the place under the street when the line cannot hold both)
    const addrRow = (k, smax) => { const ps = T.one(place, F.place, w - 2, FS*1.1*k, FS); if(!ps) return null; const pw2 = T.tw(place, F.place(ps));
      const a = addrFit(T, Li, w - pw2 - 14*f, Math.min(FE*1.35*k, smax)) || addrFit(T, Li, w, Math.min(FE*1.35*k, smax), true); if(!a) return null; const row = a.n === 1 && a.w + pw2 + 14*f <= w;
      return {h: a.h + (row ? 0 : 2*f + ps*1.3), html: y => addrTxt(a, pad, y, row ? a.w + 3 : w, P) + (row ? txt('place', place, pad + w - pw2 - 2, y + a.s*1.2*.8 - ps*1.3*.8, pw2 + 2, ps, 1.3, F.place, P.place, {small: 1, align: 'right'}) : txt('place', place, pad, y + a.h + 2*f, w, ps, 1.3, F.place, P.place, {small: 1}))}; };
    const build = (o, wf, k) => {
      const wd = wordEl(T, lines, w*wf, P.word), sw = w - wd.w - gC; if(sw < 66*f) return null;
      const sd = side(sw, k, o.lean); if(!sd) return null; const rowH = Math.max(wd.h, sd.h);
      if(!sold){ const wu = o.wl ? writeUp(T, D, w, r2(Math.max(FB, FB*1.04*k)), o.wl) : null; if(o.wl && (!wu || wu.n < Math.min(2, o.wl))) return null;
        const foot = footJL(D, T, W, k, pad, {bw: Math.round(W*.66), hug: 1, min: Math.round(W*.46), nmax: FB*1.5*Math.max(1, k)}); if(!foot) return null;
        const ar = addrRow(k, wd.s*.5); if(!ar) return null;
        const fixed = eg + g + rowH + g + ar.h + (wu ? g*1.1 + wu.h : 0) + g*1.3 + foot.h;
        return {wd, sd, sw, rowH, ar, wu, foot, fixed, room: BOT - fixed}; }
      const nb = noteBox(T, D, w, k, o.nl); if(!nb || nb.n < Math.min(2, o.nl)) return null; const foot = footJS(D, T, w, k); if(!foot) return null;
      const fixed = eg + g + rowH + g*1.2 + nb.h + g*1.1 + 1 + g + foot.h + (story ? g*.6 : pad*.8);
      return {wd, sd, sw, rowH, nb, foot, fixed, room: BOT - fixed};
    };
    const nat = X.nat(W), cap = Math.min(X.max(W), Math.round(nat*(story ? 1.45 : 1.25))), KMIN = .6, KMAX = 2; let mn = X.arcMin(W, W*.085, cap);
    const opts = sold ? [{nl: 3}, {nl: 2}] : shape === 'square' ? [{wl: 0}, {wl: 0, lean: 1}] : [{wl: 3}, {wl: 2}, {wl: 2, lean: 1}, {wl: 0}, {wl: 0, lean: 1}];
    let pick = null;
    // (a second pass, for a house too tall for the sweep's full depth: the photo's own least height)
    for(const pass of [0, 1]){ if(pick) break; if(pass) mn = X.min(W);
    for(const o of opts){
      for(const wf of [.7, .66, .62, .58, .54, .5, .46, .42]){ const b1 = build(o, wf, KMIN); if(!b1 || b1.room < mn) continue;
        const need = Math.min(b1.room, story ? cap : Math.max(mn, X.min(W) + .75*(nat - X.min(W)))); let k = KMIN;
        for(let t = KMAX; t > KMIN; t -= .05){ const b = build(o, wf, t); if(b && b.room >= need){ k = t; break; } }
        const b = build(o, wf, k), sc = wf*3 + k - Math.abs(b.wd.h - W*.06 - b.sd.h)/b.rowH*4 - Math.max(0, b.room - cap)/H*8 - (b.sd.two ? .35 : 0);
        if(!pick || sc > pick.sc) pick = {o, wf, k, sc}; }
      if(pick) break;
    } }
    const ok = !!pick; pick = pick || {o: opts[opts.length - 1], wf: .42, k: KMIN};
    const B = build(pick.o, pick.wf, pick.k); if(!B){ T.done(); return {html: CSS, ok: false}; }
    // the sweep and the word's rise under its high side: the row gives the rise back to the photo
    const x1 = pad + B.wd.ws[0] + g, x2 = pad + B.wd.w + g, dropT = W*.14; let ph = Math.max(mn, Math.min(cap, B.room)), hero = null, lift = 0, rowE = B.rowH;
    for(let i = 0; i < 4; i++){ X.focus(W, ph); hero = arcPhoto(D, X.id, 0, 0, W, ph, dropT, false, P.echo, E);
      const lf = Math.max(0, Math.min(ph - hero.yAt(x1), ph - hero.yAt(x2) + B.wd.L))*.9; lift = i ? Math.min(lift, lf) : lf; rowE = Math.max(B.wd.h - lift, B.sd.h);
      const nx = Math.max(mn, Math.min(cap, BOT - (B.fixed - B.rowH + rowE))); if(Math.abs(nx - ph) < .5) break; ph = nx; }
    lift = Math.max(0, Math.min(lift, B.wd.h - rowE));
    const spare = Math.max(0, BOT - (B.fixed - B.rowH + rowE) - ph), e = Math.min(spare/4, sold ? 14*f : 8*f);
    let h = CSS + (sold ? rect(0, 0, W, H, `background:${MAIN}`) : '') + hero.html, y = ph + eg + g + e;
    // the column beside the word starts at the row's head; room it leaves opens between its lines
    h += B.wd.html(pad, y + rowE - B.wd.h) + B.sd.html(pad + B.wd.w + gC, y, Math.max(0, rowE - B.sd.h)); y += rowE;
    if(!sold){
      y += g + e*.6; h += B.ar.html(y); y += B.ar.h; let yp = y;
      if(B.wu){ y += g*1.1 + e; h += B.wu.html(pad, y, w); y += B.wu.h; yp = y; }
      // the logo's room on the paper starts a little over the block's top, so it sits close under the lines above it
      h += B.foot.html(BOT - B.foot.h, null, Math.max(BOT - B.foot.h - g*.5, yp + r2(4*f)));
      if(story) h += X.row(0, BOT + r2(4*f), W, H - BOT - r2(4*f), 2, r2(4*f));
    } else {
      y += g*1.2 + e; h += B.nb.html(pad, y); y += B.nb.h + g*1.1 + e;
      h += rect(pad, y, w, 1, `background:${ONM};opacity:.55`); y += 1 + g + e*.6;
      h += B.foot.html(pad, y); y += B.foot.h;
      if(story) h += X.row(0, BOT + r2(4*f), W, H - BOT - r2(4*f), 2, r2(4*f));
    }
    T.done();
    return {html: h, ok};
  };

  // ================= wide (X) and Google Business Profile: the postcard fronts =================
  // Just Listed: the house hangs from the top at the right, its foot the arc with the accent echo; on the paper at the left the word
  // stacked, the street, the place, the facts and the highlights on accent dashes; the round-cornered block across the foot from the
  // left trim with the agent, the logo on the paper beside it. Just Sold: the main color is the whole image; at the left the word in
  // white, the street, the question, a hairline and the agent; at the right the house with the arc, the note in the white box, the logo.
  const card = (D, L, W, H, shape) => {
    const T = kit(D, shape), {f, FE, FB, FS} = T, X = heroKit(D, f), Li = D.listing, sold = D.piece.moment === 'js', P = pal(sold);
    const pad = r2(Math.min(16*f, W*.04)), pvJ = r2(Math.min(14*f, H*.05)), pv = sold ? pvJ : Math.max(H*.034, r2(pvJ*.62)), g = r2(Math.min(8*f, H*.03)), gC = r2(Math.min(10*f, W*.024)), FX = facts(D), place = OHL.place(Li);
    const lines = sold ? ['Just', 'Sold'] : ['Just', 'Listed'], HL = sold ? [] : highlights(D), c3 = r2(4.5*f);
    let h = CSS, pick = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; };
    // The photo starts just past the word. A line under the word may run wider than the word, under the sweep's high side:
    // the lowest the photo's foot may hang for a line ending at xr with its top at y to stay clear of the sweep and its echo
    const lim = (PX, pw, eg, d, xr, y) => xr <= PX - gC*.5 ? 1e9 : y - eg - c3 + d*(1 - ARC(Math.max(0, Math.min(1, (xr + gC*.5 - PX)/pw))));
    const settle = (PX, pw, E, eg, YB0, d0, mnH, LNS, capAt) => { let YB = YB0, hero = null, dm = d0;
      for(let i = 0; i < 4; i++){ X.focus(pw, YB); hero = arcPhoto(D, X.id, PX, 0, pw, YB, dm, false, P.echo, E); let need = Math.min(YB, capAt ? capAt(hero.drop) : 1e9);
        LNS.forEach(([xr, yt]) => { if(xr > PX - gC*.5){ const over = hero.yAt(xr + gC*.5) + eg + c3 - yt; if(over > 0) need = Math.min(need, YB - over); } });
        if(YB - need < .5) break; YB = Math.max(mnH, need); dm = hero.drop; }
      return {YB, hero}; };
    if(!sold){
      // the column as wide as the street needs; the word nearly fills it, JUST centered over LISTED (so no room stands empty beside the shorter line).
      // A second pass, for a house too tall for the sweep's full depth in any column, takes the photo's own least height.
      for(const [strict, frMax] of (shape === 'square' ? [[1, .6], [0, .6]] : [[1, .55], [0, .55], [1, .62], [0, .62]])){ if(pick) break;
      for(const wk of [.95, .82, .7]) for(let fr = frMax; fr >= .34; fr -= .01){ const PX = Math.round(W*fr), cw = PX - pad - gC, wd = wordEl(T, lines, cw*wk, P.word), pw = W - PX, E = echoOf(pw), eg = E.eo + E.sw, mx = X.max(pw), mn = strict ? X.arcMin(pw, pw*.09, mx) : X.min(pw), d0 = pw*.15; if(cw < 80*f) continue;
        if((cw - wd.w)/2 + gC > .075*W) continue;   // (never a wide empty strip at each side of the word)
        {
        for(const bk of [.7, .85, 1, 1.2, 1.4, 1.6, 1.85]){ const foot = footJL(D, T, W, bk, pad, {bw: Math.round(Math.min(W - pad - 96*f, Math.max(pad + cw + gC, W*.62))), noLogo: 1, hug: 1}); if(!foot) continue;
          const BW = foot.BW, zxA = BW + r2(10*f), zxB = Math.max(zxA, PX + r2(2*f)), uB = Math.max(0, Math.min(1, (BW + foot.R*.3 - PX)/pw));
          const BT = H - foot.h, Y0 = BT - eg - g*.6 + .85*d0*(1 - ARC(uB)), room = BT - g*1.1 - pv, L1 = (xr, y) => lim(PX, pw, eg, d0, xr, y);
          for(const o of [{fl: 3, hl: 1}, {fl: 3, hl: 0}, {fl: 2, hl: 1}, {fl: 2, hl: 0}, {fz: 3, hl: 1}, {fz: 3, hl: 0}, {fz: 2, hl: 1}, {fz: 2, hl: 0}, {fl: 4, hl: 0}]) for(const k of KS){
            // (az: X's wide image, whose type floors leave the column no room for the street: the street stands over the logo, under the house)
            const a = addrFit(T, Li, cw, Math.max(FE, Math.min(FE*1.2*k, wd.s*.5)), true); if(!a) continue; let ps = T.one(place, F.place, (o.az ? zw : cw) - 2, FS*1.05*Math.min(k, o.az ? 1.2 : 9), FS);
            if(!ps) continue;
            const fl = o.fl ? factFill(T, FX, cw, FB, FB*1.5*Math.min(k, 1.15), o.fl) : null; if(o.fl && !fl) continue;
            const hl = o.hl && HL.length >= 2 ? dashList(T, HL, cw, F.hl, Math.max(FB, FB*1.02*k), FB, 'hl', P, 1.7) : null; if(o.hl && !hl) continue;
            const used = wd.h + (o.az ? 0 : g*1.1 + a.h + (ps ? 2*f + ps*1.3 : 0)) + (fl ? g*(o.az ? 1.1 : .7) + fl.h : 0) + (hl ? g*.9 + hl.h : 0), spare = room - used; if(spare < 0) continue;
            let y = pv + wd.h + (o.az ? g*.4 : g*1.1), YL = o.az ? 1e9 : L1(pad + a.w, y); if(!o.az) y += a.h;
            if(ps && !o.az){ YL = Math.min(YL, L1(pad + T.tw(place, F.place(ps)), y + 2*f)); y += 2*f + ps*1.3; }
            if(fl){ y += g*.7; fl.ws.forEach((wl, i) => { YL = Math.min(YL, L1(pad + wl, y + i*fl.lh)); }); y += fl.h; }
            if(hl){ y += g*.9; YL = Math.min(YL, L1(pad + hl.wide, y)); }
            // the paper under the arc beside the block: the logo, with the facts over it when the column cannot hold them (the photo's
            // foot then stands as high as their room needs)
            const up = Math.min(Y0, mx) + eg + r2(5*f) < BT - 2 || !!o.fz, BW2 = up ? Math.max(BW, Math.min(PX - r2(8*f), W - pad - 96*f)) : BW, zx = up ? Math.max(BW2 + r2(10*f), zxB) : zxA, zw = W - pad*.55 - zx;   // the logo's room starts at the block's end when it lies wholly beside the block
            const fz = o.fz ? factFill(T, FX, zw, FB, FB*1.3*Math.min(k, 1.15), o.fz, '.label') : null; if(o.fz && !fz) continue;   // (fact labels by the logo, not a caption of the photo over them)
            const lgMin = strict ? Math.max(FB*2.1, 28*f) : FB*1.6, zNeed = (fz ? fz.h + g : 0) + lgMin;
            const YB = Math.min(Y0, mx, YL, fz ? H - r2(5*f) - zNeed - eg - r2(5*f) : 1e9); if(YB < mn) continue;
            const zt = Math.max(up ? 0 : BT + r2(4*f), YB + eg + r2(5*f)), zh = H - r2(5*f) - zt; if(zh < zNeed) continue;
            if((BT - zt)*(BW2 - PX) > .018*W*H) continue;   // a photo that stops well over the block: the block ends under the column, so the paper under the photo is one room
            const zr = zh - (fz ? fz.h + g : 0), zb0 = Math.max(0, zr - zw/3.4), rp = zb0 > 40*f ? zb0 - g : 0, zb = rp ? 0 : zb0, ff = fl || fz;   // rp: a room photo fills a tall room under a short house photo
            take({BW2, rp, up, PX, cw, pw, E, eg, wd, foot, BT, YB, uB, mn, d0, a, ps, fl, fz, hl, spare, zx, zw, az: o.az, rem: Math.max(0, Y0 - YB), sc: (o.az ? -150 : 0) + (ff ? ff.n*30 + 40 : 0) + (hl ? 50 : 0) + wd.s*1.6 + k*10 + pw*YB/(W*H)*900 - spare*4 - zb*8 - (rp ? 140 : 0) - Math.max(0, zx - BW2 - 10*f)*4 - (a.n > 1 ? 260 : 0) - Math.abs(bk - 1.2)*6});
            break; } } } } }
      if(!pick){ T.done(); return {html: h, ok: false}; }
      const {PX, cw, pw, E, eg, wd, foot, BT, uB, a, ps, fl, fz, hl, spare, zx, zw, az, BW2, rp, up} = pick, LNS = [];
      // the left column from the top: the word, the street, the place, the facts; the highlights centered in the room over the block
      const nG = 2 + (fl ? 1 : 0) + (hl ? 1.6 : 0), e = spare/(nG + 1.2); let y = pv + e*.6, t = '';
      t += wd.html(pad + (cw - wd.w)/2, y, 'center', wd.w); y += wd.h + (az ? g*.4 : g*1.1 + e);
      if(!az){ t += addrTxt(a, pad, y, cw, P); LNS.push([pad + a.w, y]); y += a.h; }
      if(ps && !az){ t += txt('place', place, pad, y + 2*f, cw, ps, 1.3, F.place, P.place, {small: 1}); LNS.push([pad + T.tw(place, F.place(ps)), y + 2*f]); y += 2*f + ps*1.3; }
      if(fl){ y += g*.7 + e*(az ? 1.5 : 1); t += fl.html(pad, y, P.ink); fl.ws.forEach((wl, i) => LNS.push([pad + wl, y + i*fl.lh])); y += fl.h; }
      if(hl){ y += g*.9 + e*1.6; t += hl.html(pad, y); LNS.push([pad + hl.wide, y]); }
      // (a sweep the house holds shallower than planned lifts the photo's low end back, so the echo still clears the block and the lines)
      const S = settle(PX, pw, E, eg, pick.YB, pick.d0, X.min(pw), LNS, d => BT - eg - g*.6 + .85*d*(1 - ARC(uB))), hero = S.hero;
      h += hero.html + t + foot.html(BT, null, null, BW2);
      let zy = Math.max(up ? 0 : BT + r2(4*f), S.YB + eg + r2(5*f)); const zbot = H - r2(5*f);
      if(rp){ const rh = Math.max(30, Math.min(rp, zbot - zy - (fz ? fz.h + g : 0) - zw/3.4 - g)); h += X.row(zx, zy, zw, rh, 1, 0); zy += rh + g; }
      if(az){ const ah = a.h + (ps ? 2*f + ps*1.3 : 0), lh = Math.min(zw/3.4, zbot - zy - ah - g), sp = Math.max(0, zbot - zy - ah - g - lh)/3; zy += sp; h += addrTxt(a, zx, zy, zw, P, 'center') + (ps ? txt('place', place, zx, zy + a.h + 2*f, zw, ps, 1.3, F.place, P.place, {small: 1, align: 'center'}) : ''); zy += ah + g + sp; }
      if(fz){ const lh = Math.min(zw/3.4, zbot - zy - fz.h - g), sp = Math.max(0, zbot - zy - fz.h - g - lh)/3; zy += sp; h += fz.html(zx, zy, P.ink, 'center'); zy += fz.h + g + sp; }
      h += logoFit(D, 'light', zx, zy, zw, zbot - zy, 3.4);
      T.done(); return {html: h, ok: true, rem: pick.rem};
    }
    h += rect(0, 0, W, H, `background:${MAIN}`);
    const tone = onMainTone(), room = H - 2*pv;
    // The column as wide as the street needs, the word filling it (a size down where the column cannot hold it whole). A second
    // pass, for a house too tall for the sweep's full depth in any column, takes the photo's own least height.
    for(const [strict, frMax] of [[1, .55], [0, .55], [1, .62], [0, .62]]){ if(pick) break; const one = 1;
    for(let fr = frMax; fr >= .36; fr -= .01){ const PX = Math.round(W*fr), cw = PX - pad - gC, pw = W - PX, E = echoOf(pw), eg = E.eo + E.sw, mx = X.max(pw), mn = strict ? X.arcMin(pw, pw*.09, mx) : X.min(pw), d0 = pw*.15; if(cw < 80*f) continue;
      const RX = PX + r2(4*f), bwF = W - pad*.9 - RX; if(bwF < 84*f) continue;
      // the note in its box under the arc (the fullest of the seller notes that fills it), the logo under it
      const cands = [];
      for(const nl of [4, 3, 2]) for(const kn of [1.3, 1.15, 1, .85, .7]) for(const bw of [bwF, Math.round(bwF*.86), Math.round(bwF*.72)]){ const nb = noteBox(T, D, bw, kn, nl, pw); if(nb) cands.push([nb, Math.min(nb.len, 110)*1.6 + (nb.n <= 4 ? 120 : 0) + kn*20 + bw/bwF*40]); }
      if(!cands.length) continue;
      // (the word on one line, as the postcard's back sets it, where the column cannot hold it stacked at a size that fills it)
      for(const [wl, wk] of [[lines, 1], [lines, .9], [lines, .8], [lines, .7], [['Just Sold'], 1], [['Just Sold'], .9], [lines, .6]]){ const wd = wordEl(T, wl, cw*wk, P.word); if(wl.length > 1 && wk > .6 && (cw - wd.w)/2 > .068*W) continue;   // (never a wide empty strip at each side of the stacked word)
        // the left column: the word, the street, the place, the question; a hairline and the agent at the foot
        let LC = null;
        for(const useQ of [1, 0]){ if(LC) break; for(const k of KS){ const a = addrFit(T, Li, cw, Math.max(FE, Math.min(FE*1.25*k, wd.s*.5)), !one); if(!a) continue; const ps = T.one(place, F.place, cw - 2, FS*1.05*k, FS); if(!ps) continue; const ag = agentEl(D, T, cw, k, wd.s*(wl.length < 2 ? .8 : .5)); if(!ag) continue;
          for(const q of (useQ ? [question(T, cw, FE*1.2*k, FB, FB*1.1), question(T, cw, FE*1.2*k, FB), question(T, cw, FE*1.2*k, FB, FB)] : [0])){ if(q === null) continue;
            const used = wd.h + g*1.2 + a.h + 2*f + ps*1.3 + (q ? g*.9 + q.h : 0) + g*1.3 + 1 + g + ag.h; if(used > room) continue; LC = {a, ps, q, ag, k, spare: room - used}; break; }
          if(LC) break; } }
        // a square's column has the height for the note itself: the question heads the note in its box, under the street; the house
        // and the logo keep the right column (a room photo under the house where the house cannot fill it)
        if(shape === 'square' && wl.length > 1){ let LN = null;
          for(const nl of [5, 4, 3, 2]){ if(LN) break; for(const kn of [1.15, 1, .85]){ const nbL = noteBox(T, D, cw, kn, nl); if(!nbL || nbL.n < 2) continue;
            // (the agent's lines as large as the column holds, then the street and the question)
            for(const kA of [2, 1.6, 1.3, 1, .8, .6]){ const ag = agentEl(D, T, cw, kA, wd.s*.5); if(!ag) continue;
              for(const k of KS){ const a = addrFit(T, Li, cw, Math.max(FE, Math.min(FE*1.25*k, wd.s*.5))); if(!a) continue; const ps = T.one(place, F.place, cw - 2, FS*1.05*k, FS); if(!ps) continue;
                const q = question(T, cw, FE*1.2*k, FB, FB*1.1) || question(T, cw, FE*1.2*k, FB); if(!q) continue;
                const used = wd.h + g*1.2 + a.h + 2*f + ps*1.3 + g*.9 + q.h + g*.7 + nbL.h + g*1.3 + 1 + g + ag.h; if(used > room) continue; LN = {a, ps, q, ag, k, nb: nbL, spare: room - used}; break; }
              if(LN) break; }
            if(LN) break; } }
          if(LN) for(const ka of KS){ if(ka <= LN.k) break; const a2 = agentEl(D, T, cw, ka, wd.s*.5); if(a2 && a2.h - LN.ag.h <= LN.spare){ LN.spare -= a2.h - LN.ag.h; LN.ag = a2; break; } }
          if(LN) for(const lk of [1.5, 1.2, 1, .85]){ const lh = r2(Math.max(FB*1.9, 26*f)*lk), YB0 = H - pv - lh - g*1.1 - eg, YB = Math.min(YB0, mx); if(YB < mn) continue; const rem = YB0 - YB, rp = rem > 40*f ? rem - g : 0;
            take({PX, cw, pw, E, eg, wd, LC: LN, nb: LN.nb, nbLeft: 1, rp, lh, YB, d0, RX, bwF, sc: 300 + Math.min(LN.nb.len, 110)*1.6 + wd.s*1.6 + LN.k*10 + 60 - (cw - wd.w)*1.2 + pw*YB/(W*H)*900 - LN.spare*4 - Math.max(0, LN.spare - 12*f)*14 - (rp ? 140 : rem*3)});
            break; } }
        if(!LC) continue;
        // room the column leaves goes to the agent's lines
        for(const ka of KS){ if(ka <= LC.k) break; const a2 = agentEl(D, T, cw, ka, wd.s*(wl.length < 2 ? .8 : .5)); if(a2 && a2.h - LC.ag.h <= LC.spare){ LC.spare -= a2.h - LC.ag.h; LC.ag = a2; break; } }
        // the logo beside the agent at the column's foot when the row has the room for it; else under the note
        const lgW = cw - LC.ag.wide - r2(14*f), lgL = lgW >= 56*f && LC.ag.h >= FB*2.1;
        if(!lgL && ((cw - LC.ag.wide)*(LC.ag.h + g) > .02*W*H || cw - LC.ag.wide > .078*W - gC - r2(4*f))) continue;   // (never a wide empty room beside the agent's lines)
        for(const [nb, ns] of cands) for(const lk of (lgL ? [0] : [1.5, 1.2, 1, .85, .7])){ const lh = r2(Math.max(FB*1.9, 26*f)*lk), YB0 = H - pv - (lk ? lh + g : 0) - nb.h - g*1.1 - eg, YB = Math.min(YB0, mx); if(YB < mn) continue; const rem = YB0 - YB;
          take({PX, cw, pw, E, eg, wd, LC, nb, lh, YB, d0, RX, bwF, lgL, lgW, sc: ns + (wl.length < 2 ? -160 : 0) + wd.s*(wl.length < 2 ? 2.2 : 1.6) + LC.k*10 + (LC.q ? 60 : 0) - (LC.a.n > 1 ? 400 : 0) - (cw - wd.w)*1.2 + pw*YB/(W*H)*900 - LC.spare*4 - Math.max(0, LC.spare - 12*f)*14 - rem*3});
          break; }
        break; } } }
    if(!pick){ T.done(); return {html: h, ok: false}; }
    { const {PX, cw, pw, E, eg, wd, LC, nb, lh, RX, bwF, lgL, lgW, nbLeft, rp} = pick;
      const e = LC.spare/2.7, ay = H - pv - LC.ag.h; let y = pv + e*.5, t = '';
      t += wd.html(pad + (cw - wd.w)/2, y, 'center', wd.w); y += wd.h + g*1.2 + e;
      t += addrTxt(LC.a, pad, y, cw, P) + txt('place', place, pad, y + LC.a.h + 2*f, cw, LC.ps, 1.3, F.place, P.place, {small: 1}); y += LC.a.h + 2*f + LC.ps*1.3 + g*.9 + e;
      if(LC.q) t += LC.q.html(pad, y);
      if(nbLeft) t += nb.html(pad, y + LC.q.h + g*.7 + e*.5);
      t += rect(pad, ay - g - 1, cw, 1, `background:${ONM};opacity:.55`) + LC.ag.html(pad, ay) + (lgL ? logoFit(D, tone, pad + cw - lgW, ay, lgW, LC.ag.h, 3.2) : '');
      X.focus(pw, pick.YB); const hero = arcPhoto(D, X.id, PX, 0, pw, pick.YB, pick.d0, false, P.echo, E);
      h += hero.html + t;
      // the right column under the arc: the note in its box, the logo centered under it
      const top = pick.YB + eg + g*1.1;
      if(nbLeft){ let ry = top; if(rp){ const rh = Math.max(30, H - pv - lh - g - top); h += X.row(RX, ry, bwF, rh, 1, 0); ry += rh + g; }
        // the logo centered in the foot row beside the agent's lines (from their end to the right margin), so no room stands
        // empty between them; it keeps the right column when the row is too low for it
        const lx = pad + LC.ag.wide + r2(14*f), ly = Math.max(ry, ay - g*.5), lw = W - pad*.9 - lx;
        h += !rp && lw >= bwF*.9 && H - pv - ly >= (H - pv - ry)*.8 ? logoFit(D, tone, lx, ly, lw, H - pv - ly, 3.6) : logoFit(D, tone, RX, ry, bwF, H - pv - ry, 3.6); }
      else { const e2 = Math.max(0, H - pv - (lgL ? 0 : lh + g) - nb.h - top)/(lgL ? 2 : 3); let ry = top + e2;
        h += nb.html(RX + (bwF - nb.w)/2, ry); ry += nb.h + g + e2;
        if(!lgL) h += logoFit(D, tone, RX, ry, bwF, H - pv - ry, 3.6); }
    }
    T.done();
    return {html: h, ok: true, rem: 0};
  };
  // a square takes the tall arrangement (the house across the head, as large as the approved set showed it); a house too tall for
  // that takes the postcard's arrangement
  AS.portrait = (D, L, W, H, shape) => { if(shape !== 'square') return tall(D, L, W, H, shape).html;
    const t = tall(D, L, W, H, shape); return t.ok ? t.html : card(D, L, W, H, shape).html; };
  AS.landscape = (D, L, W, H, shape) => card(D, L, W, H, shape).html;

  // ================= carousel photo slides =================
  // The room hangs from the top, its foot the arc turned over (full height at the left, rising toward the right) with the accent echo.
  // Under the sweep's high side the word stacked large; at the left Just Listed's round-cornered block from the trim with the street
  // and the place on it (Just Sold: the main color is the whole slide, the street on it).
  AS.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), {f, FE, FS} = T, Li = D.listing, sold = D.piece.moment === 'js', P = pal(sold), pad = r2(16*f), g = r2(8*f), E = echoOf(W), eg = E.eo + E.sw;
    const lines = sold ? ['Just', 'Sold'] : ['Just', 'Listed'], place = OHL.place(Li), drop = Math.round(W*.13);
    const wd = wordEl(T, lines, Math.min(W*.4, W - 2*pad - r2(14*f) - r2(20*f) - T.tw(Li.address || '', F.addr(FE))), P.word), BW = Math.round(W - 2*pad - wd.w - r2(14*f) + pad), iw = BW - pad - r2(18*f);
    const a = addrFit(T, Li, iw, FE*1.35, true) || {s: FE, n: 1, h: FE*1.2, mk: () => esc(Li.address || '')}, ps = T.one(place, F.place, iw, FS*1.1, FS), bp = r2(11*f);
    const bh = Math.max(a.h + (ps ? 2*f + ps*1.3 : 0) + 2*bp, wd.h + pad*.9 + g - drop*.55), ph = H - bh - eg - g*.9;
    const hero = arcPhoto(D, D.piece.photo, 0, 0, W, ph, drop, true, P.echo, E, drop);
    let h = CSS + (sold ? rect(0, 0, W, H, `background:${MAIN}`) : '') + hero.html;
    const by = H - bh, th = a.h + (ps ? 2*f + ps*1.3 : 0), ty = by + (bh - th)/2, PB = sold ? P : {ink: ONM, name: GOLD, place: GOLD};
    if(!sold) h += rect(0, by, BW, bh + 1, `background:${MAIN};border-top-right-radius:${Math.min(bh*.5, 34*f)}pt`);
    h += addrTxt(a, pad, ty, iw, PB) + (ps ? txt('place', place, pad, ty + a.h + 2*f, iw, ps, 1.3, F.place, PB.place, {small: 1}) : '');
    // the word at the right, its foot on the bottom margin: it stands in the room the sweep's high side opens
    h += wd.html(W - pad - wd.w, H - pad*.9 - wd.h);
    T.done();
    return h;
  };
  window.ARSocial = AS;
})();
