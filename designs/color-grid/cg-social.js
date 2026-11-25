/* templates/color-grid/cg-social.js: Color Grid's own Just Listed and Just Sold social images (owner 11/18/2026: every follow-on
   piece matches its set's main pieces). Plugs into templates/_shared/socialset.js (fonts, data, the checks) and replaces its three
   layouts for this set only; nothing shared changes.

   Read off the approved Color Grid pieces (postcard.html, flyer.html, foldover.html, cg-pages.js, cg-marks.css):
     - every image is one grid of tiles that runs off the edges, the kit's paper showing only as the thin gutters between them
     - tiles in the kit's main color, its dark and the pale tint of the main color; photos are tiles of the same grid
     - the house number as a giant numeral in its own dark tile (the Just Sold postcard, the fold-over cover's numeral tiles)
     - the word tile in the main color: JUST LISTED / JUST SOLD in white Schibsted Grotesk 700, gold tracked caps under it
     - Just Listed: the fact tiles of the postcard back (white numeral, gold caps label, dark and main by turns); the dark tile with
       the full street and the house's own highlights behind small gold squares; the agent and the logo on the pale tile
     - Just Sold: the street under the word, the city in gold caps under the numeral; on the pale tile "Thinking about selling?"
       in the main color, the note in the white cell with its main-color line, the agent and the logo
   Rules carried: no price, no broker address, no beds/baths/square feet on Just Sold, the whole house in every frame (the engine's
   house-cut check), text at the phone floors of templates/_shared/readsize.js, no empty tile. */
(function(){
  const K = .375, SHOWN = {wide: 330, gbp: 360}, r2 = v => Math.round(v*2)/2, esc = s => Ivory.esc(s);
  const SG = "'Schibsted Grotesk'", INK = '#161616', Q = 'Thinking about selling?';
  const TONE = {main: {bg: 'var(--cgs-main)', on: 'var(--cgs-on-main)', gold: 'var(--cgs-gold)'},
    dk: {bg: 'var(--cgs-dk)', on: 'var(--cgs-on-dk)', gold: 'var(--cgs-gold-dk)'},
    tn: {bg: 'var(--cgs-tint)', on: INK, gold: 'var(--cgs-lab)'}};
  const LAB = 'var(--cgs-lab)';
  const F = {
    word: s => `font:700 ${s}pt ${SG};letter-spacing:${(s*.008).toFixed(2)}pt`,
    num: s => `font:700 ${s}pt ${SG};letter-spacing:${(-s*.015).toFixed(2)}pt`,
    gk: (s, tr) => `font:700 ${s}pt ${SG};text-transform:uppercase;letter-spacing:${(s*(tr == null ? .2 : tr)).toFixed(2)}pt`,
    street: s => `font:700 ${s}pt ${SG};letter-spacing:-.3pt`,
    streetM: s => `font:500 ${s}pt ${SG}`,
    hl: s => `font:500 ${s}pt ${SG}`,
    factN: s => `font:700 ${s}pt ${SG};letter-spacing:-.3pt`,
    factL: (s, tr) => `font:700 ${s}pt ${SG};text-transform:uppercase;letter-spacing:${(s*(tr == null ? .07 : tr)).toFixed(2)}pt`,
    q: s => `font:700 ${s}pt ${SG};letter-spacing:-.2pt`,
    note: s => `font:400 ${s}pt ${SG}`,
    name: s => `font:700 ${s}pt ${SG}`,
    tag: s => `font:700 ${s}pt ${SG};text-transform:uppercase;letter-spacing:${(s*.16).toFixed(2)}pt`,
    phone: s => `font:600 ${s}pt ${SG}`,
  };
  const CSS = `<style>
    .ss .cgs-logo .logo{width:100%;height:100%;display:flex;align-items:center;justify-content:var(--j,center)}
    .ss .cgs-logo img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .ss .cgs-logo .text{font:700 12pt/1.15 ${SG};color:inherit}
    .ss .cgs-hs{position:absolute;overflow:hidden}.ss .cgs-hs img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
    .ss .cgs-ink{position:absolute;white-space:nowrap}
    .ss .cgs-cell{position:absolute;background:#fff;border:1.5pt solid var(--cgs-main);box-sizing:border-box}
    .ss .wr{white-space:normal;overflow:hidden}</style>`;

  // ---------- measuring ----------
  const kit = (D, shape) => {
    const f = D.piece.px[0]/(SHOWN[shape] || 393)*K*1.03, W = D.piece.px[0]*K;
    const T = {f, W, FE: Math.ceil(16*f*2)/2, FB: Math.ceil(12*f*2)/2, FS: Math.ceil(10*f*2)/2, memo: new Map()};
    T.px = shape === 'wide' ? 13 : r2(13*f); T.py = r2(Math.min(10*f, shape === 'wide' ? 11 : 14)); T.safe = shape === 'post' ? 13 : 0; T.aK = 1; T.tight = shape === 'wide'; T.thW = 34*f; T.g = Math.max(4, r2(W*.0125));
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
    // the same count worked out from the words' own widths (no page layout: quick enough to try many measures); a pick is then
    // confirmed with T.rows
    const wm = new Map();
    T.wrap = (t, face, s, w) => { let c = wm.get(t); if(!c){ const f100 = face(100); c = {ws: t.split(' ').map(x => T.tw(x, f100)), sp: T.tw('n n', f100) - T.tw('nn', f100)}; wm.set(t, c); }
      const k = s/100, sp = c.sp*k, ws = []; let cur = -1;
      for(let i = 0; i < c.ws.length; i++){ const v = c.ws[i]*k; if(cur < 0) cur = v; else if(cur + sp + v <= w) cur += sp + v; else { ws.push(cur); cur = v; } } if(cur >= 0) ws.push(cur);
      return {n: ws.length, ws, wide: Math.max(1, ...ws), last: ws[ws.length - 1] || 0}; };
    // the largest size from max down to min (half points) at which one line of t is no wider than w; null when even min is too wide
    T.one = (t, face, w, max, min) => { if(!t) return min; const w1 = T.tw(t, face(100)); let s = Math.floor(Math.min(max, w/w1*100)*2 + .01)/2;
      while(s >= min - .01 && T.tw(t, face(s)) > w) s -= .5;
      return s >= min - .01 ? Math.max(s, min) : null; };
    T.done = () => M.remove();
    return T;
  };
  // the capitals and numerals, measured on the page: the cap height and where the baseline falls in a line box as tall as the type (em)
  let MET = null;
  const met = () => { if(MET) return MET; const c = document.createElement('canvas').getContext('2d'); c.font = `700 200px ${SG}`;
    const p = document.createElement('div'); p.style.cssText = `position:absolute;left:-9999px;top:0;font:700 200px ${SG};line-height:200px;white-space:nowrap`;
    p.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>'; document.body.appendChild(p);
    const base = (p.lastChild.getBoundingClientRect().bottom - p.getBoundingClientRect().top)/200; p.remove();
    MET = {cap: c.measureText('H').actualBoundingBoxAscent/200, base}; return MET; };
  const capH = s => met().cap*s;
  const rect = (x, y, w, h, css) => `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;${css}"></div>`;
  const txt = (slot, t, x, y, w, s, lhK, face, color, o) => { o = o || {}; const n = o.n || 1;
    return `<div class="abs ${n > 1 ? 'wr' : 'nw'}"${slot ? ` data-slot="${slot}"` : ''} data-lines="${n}"${o.small ? ' data-small="1"' : ''} style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*s*lhK + (n > 1 ? s*.15 : 0)}pt;${face(s)};line-height:${s*lhK}pt;color:${color};text-align:${o.align || 'left'};${o.css || ''}">${o.html || esc(t)}</div>`; };
  // capitals or numerals set by their ink: the top of the letters at y (n lines, one type size apart)
  const ink = (slot, html, x, y, w, s, face, color, align, n) => { const m = met();
    return `<div class="abs cgs-ink"${slot ? ` data-slot="${slot}"` : ''} data-lines="${n || 1}" style="left:${x}pt;top:${y - (m.base - m.cap)*s}pt;width:${w}pt;height:${(n || 1)*s}pt;${face(s)};line-height:${s}pt;color:${color};text-align:${align || 'left'}">${html}</div>`; };
  const logo = (D, x, y, w, h, just) => `<div class="abs cgs-logo" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;color:${INK};--j:${just || 'center'}">${OHL.logo(D, 'light', '')}</div>`;

  // ---------- a tile: one block of the grid, its parts stacked and centered top to bottom ----------
  // part: {min, k (how fast it grows), gap (pt over it), cap(w) -> the largest size that fits w or null, h(s, w), html(x, y, w, s)}
  const tile = (T, w, tone, parts, o) => { o = o || {}; const px = o.px != null ? o.px : T.px, py = o.py != null ? o.py : T.py, iw = w - px - (o.pr != null ? o.pr : px), gap0 = o.gap != null ? o.gap : 6*T.f;
    const caps = parts.map(p => p.cap(iw)), ok = caps.every((c, i) => c != null && c >= parts[i].min - .01);
    const sizes = q => { const ss = parts.map((p, i) => Math.min(caps[i], r2(p.min*(p.boost || 1)*(1 + (q - 1)*(p.k == null ? 1 : p.k))))); return o.adj ? o.adj(ss) : ss; };
    const gaps = q => parts.map((p, i) => i ? (p.gap != null ? p.gap : gap0)*Math.min(q, 1.5) : 0);
    const tot = q => { const ss = sizes(q); return parts.reduce((a, p, i) => a + p.h(ss[i], iw), 0) + gaps(q).reduce((a, b) => a + b, 0); };
    const fitQ = hh => { for(let q = o.qmax || 12; q > 1; q *= .955) if(tot(q) <= hh) return q; return 1; };
    return {ok, w, nat: q => ok ? tot(q) + 2*py : null, sizes: h => sizes(fitQ(h - 2*py)), slack: h => { const q = fitQ(h - 2*py); return h - 2*py - tot(q); },
      put: (x, y, h) => { const q = fitQ(h - 2*py), ss = sizes(q), gs = gaps(q), slack = Math.max(0, h - 2*py - tot(q)), n = parts.length;
        const sp = n > 1 ? Math.min(slack/(n + 1), 10*T.f) : 0; let yy = y + py + (slack - sp*(n - 1))/2, s = tone ? rect(x, y, w, h, `background:${TONE[tone].bg}`) : '';
        parts.forEach((p, i) => { yy += gs[i] + (i ? sp : 0); s += p.html(x + px, yy, iw, ss[i]); yy += p.h(ss[i], iw); });
        return s; }};
  };
  // a highlight on one line, or on two lines of nearly the same length (the break that balances them best); null when neither holds
  const hlLay = (T, t, s, w) => { const one = T.tw(t, F.hl(s)); if(one <= w) return {n: 1, ls: [t], wide: one};
    const ws = t.split(' '); let best = null;
    for(let i = 1; i < ws.length; i++){ const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '), wa = T.tw(a, F.hl(s)), wb = T.tw(b, F.hl(s)); if(wa > w || wb > w) continue;
      const r = Math.min(wa, wb)/Math.max(wa, wb); if(!best || r > best.r) best = {n: 2, ls: [a, b], wide: Math.max(wa, wb), r}; }
    return best && best.r >= .8 ? best : null; };
  const P = {
    // one line; o.ink: capitals or numerals set by their ink
    line: (T, slot, t, face, min, max, color, o) => { o = o || {}; return {min, k: o.k, gap: o.gap, cap: w => T.one(t, face, w, max, min), h: s => o.ink ? capH(s) : s*(o.lhK || 1.2),
      html: (x, y, w, s) => o.ink ? ink(slot, o.html || esc(t), x, y, w, s, face, color, o.align) : txt(slot, t, x, y, w, s, o.lhK || 1.2, face, color, {align: o.align, small: o.small, html: o.html})}; },
    // the word on two lines (JUST / LISTED), as the Just Listed postcard stacks it
    word2: (T, lines, min, color) => ({min, k: 2.5, cap: w => { const c = lines.map(t => T.one(t, F.word, w, 400, min)); return c.some(v => v == null) ? null : Math.min(...c); },
      h: s => s + capH(s), html: (x, y, w, s) => lines.map((t, i) => ink('moment', esc(t), x, y + i*s, w, s, F.word, color, 'left')).join('')}),
    // the street on two lines at the floor size, the last two words kept together (never shortened)
    street2: (T, t, color) => { const m = /^(.*\S)\s+(\S+\s+\S+)\s*$/.exec(t), ls = m ? [m[1], m[2]] : null;
      return {min: T.FE, k: 1.2, cap: w => { if(!ls) return null; const c = ls.map(x => T.one(x, F.street, w, r2(T.FE*2.4), T.FE)); return c.some(v => v == null) ? null : Math.min(...c); }, h: s => 2*s*1.15 + s*.15,
        html: (x, y, w, s) => txt('address', t, x, y, w, s, 1.15, F.street, color, {n: 2, html: `<span>${esc(ls[0])}<br>${esc(ls[1])}</span>`})}; },
    // gold tracked caps (the city line): a line too long for its tile gives up tracking before it gives up size (as the postcard does)
    caps: (T, slot, t, min, max, color, o) => { o = o || {}; let tr = .2;
      return {min, k: o.k == null ? .5 : o.k, gap: o.gap, cap: w => { for(const x of [.2, .14, .08, .03]){ const c = T.one(t, z => F.gk(z, x), w, max, min); if(c){ tr = x; return c; } } return null; }, h: s => s*1.3,
        html: (x, y, w, s) => txt(slot, t, x, y, w, s, 1.3, z => F.gk(z, tr), color, {align: o.align, small: 1})}; },
    // the house's highlights, each behind a small gold square (the Just Listed postcard's dark tile); one too long for the tile runs
    // onto a second line, never dropped
    bullets: (T, list, color, gold) => { const lay = (s, w) => list.map(t => hlLay(T, t, s, w - s*1.3 - 2)), bad = (s, w) => lay(s, w).some(r => !r);
      return {min: T.FB, k: .8, gap: 7*T.f, cap: w => { if(bad(T.FB, w)) return null; let s = T.FB; while(s + .5 <= T.FB*1.9 && !bad(s + .5, w)) s += .5; return s; },
        h: (s, w) => lay(s, w).reduce((a, r) => a + r.n*s*1.32 + s*.36, 0) - s*.2,
        html: (x, y, w, s) => { let yy = y, out = ''; lay(s, w).forEach((r, i) => { out += rect(x, yy + s*.41, s*.5, s*.5, `background:${gold}`)
          + txt('hl.' + i, list[i], x + s*1.3, yy, r.wide + 2, s, 1.32, F.hl, color, {n: r.n, html: r.ls.map(esc).join('<br>'), css: 'white-space:nowrap'}); yy += r.n*s*1.32 + s*.36; }); return out; }}; },
  };

  // ---------- the agent on the pale tile: name, REALTOR(R) beside the phone, the logo ----------
  const agentLines = (T, D, w, s) => { const key = 'al|' + w.toFixed(1) + '|' + s; if(T.memo.has(key)) return T.memo.get(key);
    const A = D.agent || {}, hsOn = OHL.cardMode(D) === 'headshot' && !!A.headshot, nar = A.nar || /realtor/i.test(A.designation || ''), gap = 8*T.f;
    const ds = r2(Math.max(T.FS, s*.62)), ps = r2(Math.max(T.FB, s*.86)), dW = nar ? T.tw('REALTOR®', F.tag(ds)) : 0, pW = T.tw(A.phone || '', F.phone(ps));
    let res = null;
    for(const inl of [true, false]){ if(!inl && !nar) break;
      const l2 = inl ? dW + (nar ? ps*.55 : 0) + pW : Math.max(dW, pW);
      // where the phone floors set the second line as large as the name, the name grows toward that line's width (never under it)
      const n0 = T.tw(A.name || '', F.name(s)), ns = inl && n0 > 0 && l2/n0 > 1.08 ? Math.floor(s*Math.min(1.4, l2/n0)*2)/2 : s, nW = T.tw(A.name || '', F.name(ns));
      const th = ns*1.2 + 2*T.f + (inl ? ps*1.3 : ds*1.3 + T.f + ps*1.3);
      const hsW = hsOn ? Math.round(th*.82) : 0, tx = hsOn ? hsW + gap : 0, wide = tx + Math.max(nW, l2) + 2; if(wide > w) continue;
      res = {h: th, wide, nameW: tx + nW, nameH: ns*1.2, html: (x, y) => { let h = hsOn ? `<div class="abs cgs-hs" style="left:${x}pt;top:${y}pt;width:${hsW}pt;height:${th}pt"><img src="${esc(A.headshot)}" alt=""></div>` : '', yy = y + ns*1.2 + 2*T.f; const x0 = x + tx;
        h += txt('agent.name', A.name || '', x0, y, nW + 2, ns, 1.2, F.name, INK);
        if(inl){ if(nar) h += txt('agent.desig', 'REALTOR®', x0, yy + ps*1.3*.78 - ds*1.3*.78, dW + 2, ds, 1.3, F.tag, LAB, {small: 1});
          h += txt('agent.phone', A.phone || '', x0 + dW + (nar ? ps*.55 : 0), yy, pW + 2, ps, 1.3, F.phone, INK); }
        else { h += txt('agent.desig', 'REALTOR®', x0, yy, dW + 2, ds, 1.3, F.tag, LAB, {small: 1}); h += txt('agent.phone', A.phone || '', x0, yy + ds*1.3 + T.f, pW + 2, ps, 1.3, F.phone, INK); }
        return h; }};
      break; }
    // a tile too narrow for that: the headshot beside the name and REALTOR(R), the phone under them
    if(!res && hsOn && nar){ const nW = T.tw(A.name || '', F.name(s)), th2 = s*1.2 + 2*T.f + ds*1.3, hsW = Math.round(th2*.9), tx = hsW + gap, wide = Math.max(tx + Math.max(nW, dW), pW) + 2, th = th2 + 3*T.f + ps*1.3;
      if(wide <= w) res = {h: th, wide, nameW: tx + nW, nameH: s*1.2, html: (x, y) => `<div class="abs cgs-hs" style="left:${x}pt;top:${y}pt;width:${hsW}pt;height:${th2}pt"><img src="${esc(A.headshot)}" alt=""></div>`
        + txt('agent.name', A.name || '', x + tx, y, nW + 2, s, 1.2, F.name, INK) + txt('agent.desig', 'REALTOR®', x + tx, y + s*1.2 + 2*T.f, dW + 2, ds, 1.3, F.tag, LAB, {small: 1})
        + txt('agent.phone', A.phone || '', x, y + th2 + 3*T.f, pW + 2, ps, 1.3, F.phone, INK)}; }
    T.memo.set(key, res); return res; };
  // 'stack': the lines over the logo, set from the left (the postcard). 'row': the lines at the left, the logo at the right end.
  const agentParts = (T, D, mode) => { const mn = T.FB, mx = r2(T.FB*2.6), boost = T.aK;
    if(mode === 'row'){ const at = (w, s) => { const al = agentLines(T, D, w, s); if(!al) return null; const lw = Math.min(al.h*.9*4.2, w - al.wide - 12*T.f), lh = Math.min(al.h*.9, lw/3.2); return lh >= Math.max(s*1.4, T.FB*1.9) ? {al, lh, lw} : null; };
      return [{min: mn, boost, cap: w => { for(let s = mx; s >= mn - .01; s -= .5) if(at(w, s)) return s; return null; }, h: (s, w) => at(w, s).al.h,
        html: (x, y, w, s) => { const r = at(w, s); const lx = x + r.al.wide + 12*T.f; return r.al.html(x, y) + logo(D, lx, y + (r.al.h - r.lh)/2, x + w - lx, r.lh, 'center'); }}]; }
    return [{min: mn, boost, cap: w => { for(let s = mx; s >= mn - .01; s -= .5) if(agentLines(T, D, w, s)) return s; return null; }, h: (s, w) => agentLines(T, D, w, s).h, html: (x, y, w, s) => agentLines(T, D, w, s).html(x, y)},
      {min: r2(T.FB*(T.tight ? 1.5 : 1.9)), boost, k: .8, gap: T.tight ? 9 : 8*T.f, cap: w => Math.min(r2(T.FB*3.8), Math.max(r2(T.FB*1.9), r2(w/3.4))), h: s => s, html: (x, y, w, s) => logo(D, x, y, Math.min(w, s*4.2), s, 'flex-start')}]; };

  // ---------- photos: tiles of the grid ----------
  const photoKit = (D, T) => {
    const g = T.g, id = OHL.hero(D, ''), HP = D.photos[id] || {}, pAR = HP.w && HP.h ? HP.w/HP.h : 1.5, hb = HP.house && Ivory.fullHouse(D, id) ? HP.house : null;
    const sup0 = window.OHEmail ? OHEmail.support(D, id, 40) : OHL.photos(D).filter(p => p !== id && !Ivory.fullHouse(D, p));
    const root = p => String((D.photos[p] || {}).tags || p).split(',')[0].toLowerCase().replace(/[\d\s]+$/, '').replace(/\b(room|area)\b/g, '').trim(), ORDER = [/kitchen/, /family|living|great/, /dining/, /primary|master/, /bed/, /deck|patio|yard|pool/];
    const rank = p => { const r = root(p), i = ORDER.findIndex(x => x.test(r)); return /bath|closet|laundry|hall|stair|foyer|entry|garage|utility|pantry/.test(r) ? 50 : i < 0 ? 20 : i; };
    const sup = sup0.map((p, i) => [p, rank(p), i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(a => a[0]).filter((p, i, a) => a.findIndex(q => root(q) === root(p)) === i).slice(0, 6); let used = 0;
    const put = (pid, x, y, w, h) => OHL.photo(D, pid, `left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt`);
    const min = w => Math.min(OHL.minFrameH(D, id, w, 99999), Math.ceil(w/pAR)), hmax = w => Math.floor(hb ? Math.max(w/pAR, w/((hb.right - hb.left + .06)*pAR)) : w/pAR), nat = w => Math.ceil(w/pAR),
      max = w => Math.min(hmax(w), Math.floor(w/pAR*1.2)), max2 = w => Math.min(hmax(w), Math.floor(w/pAR*1.36));   // never cropped far in on the house: most of the photo's width stays
    // a frame taller than the photo's shape centers on the house
    const hero = (x, y, w, h) => { if(hb && h > w/pAR){ const vis = w/(h*pAR), cx = (hb.left + hb.right)/2, lft = Math.max(0, Math.min(1 - vis, cx - vis/2)); HP.focusX = Math.round(lft/(1 - vis)*1000)/10; } return put(id, x, y, w, h); };
    // n room photos side by side (or one over the other)
    const rooms = (x, y, w, h, n, vert) => { const ids = sup.slice(used, used + n); used += ids.length; if(!ids.length) return '';
      const m = ids.length, pw = vert ? w : (w - (m - 1)*g)/m, ph = vert ? (h - (m - 1)*g)/m : h;
      return ids.map((p, i) => put(p, x + (vert ? 0 : i*(pw + g)), y + (vert ? i*(ph + g) : 0), pw, ph)).join(''); };
    // how the house fills a block w x h without losing a wall or the roof: alone; with room photos under it (the block is taller than
    // the house can go); or narrowed, with a room photo beside it (the block is shorter than the house needs)
    const thH = 42*T.f, thW = T.thW;
    const shapeOf = (w, h) => { const mn = min(w), mx = max(w);
      if(h >= mn - .5 && h <= mx + .5) return {kind: 'solo', hw: w, hh: h, pen: 0};
      if(h > mx){ let hh = mx, rest = h - g - hh; if(rest < thH && h <= max2(w) + .5) return {kind: 'solo', hw: w, hh: h, pen: 15}; if(rest < thH){ hh = h - g - thH; rest = thH; }
        return hh >= mn ? {kind: 'under', hw: w, hh, rest, pen: 60} : {kind: 'bad', pen: 1e5}; }
      let hw = w; while(hw > 30 && min(hw) > h) hw -= 2;
      if(w - g - hw < thW) hw = w - g - thW;
      if(hw < w*.5 || h > max2(hw) + .5 || h < min(hw) - .5) return {kind: 'bad', pen: 1e5};
      return {kind: 'side', hw, hh: h, side: w - g - hw, pen: 20}; };
    // o.right: the house at the right of its block (the Just Sold postcard)
    const block = (x, y, w, h, o) => { const s = shapeOf(w, h);
      if(s.kind === 'solo' || s.kind === 'bad') return hero(x, y, w, Math.min(h, s.kind === 'bad' ? Math.max(min(w), Math.min(h, max2(w))) : h));
      if(s.kind === 'under') return hero(x, y, w, s.hh) + rooms(x, y + s.hh + g, w, s.rest, w/s.rest > 2.3 ? 2 : 1);
      const two = h/s.side > 2.6, sx = o && o.right ? x : x + s.hw + g, hx = o && o.right ? x + s.side + g : x;
      return hero(hx, y, s.hw, h) + rooms(sx, y, s.side, h, two ? 2 : 1, true); };
    return {id, min, max, nat, hero, rooms, shapeOf, block, put, floor: w => min(Math.round(w*.56)) + 1};
  };

  // ---------- words ----------
  const addrNum = L => (String(L.address || '').match(/^\s*(\d+[A-Za-z]?)\b/) || [])[1] || '';
  const city = L => OHL.place(L).replace(/\s*\d{5}(-\d{4})?$/, '');
  // the postcard back's fact tiles: the number over its label (beds, baths, square feet, the year built)
  const factList = D => { const L = D.listing || {}, out = [];
    if(L.beds) out.push([String(L.beds), String(L.beds), L.beds == 1 ? 'Bed' : 'Beds']);
    if(L.baths){ const b = BD.bathNum(L), bt = BD.bathsText(L); out.push([b.num, String(bt.main).replace(/\s.*$/, ''), b.label, /full/i.test(b.label) ? b.label.replace(/full\s*/i, '') : b.label]); }
    if(L.sqft) out.push([Number(L.sqft).toLocaleString('en-US'), Number(L.sqft).toLocaleString('en-US'), 'Sq Ft']);
    const yr = L.yearBuilt || L.year; if(yr) out.push([String(yr), String(yr), 'Built']);
    return out; };
  const lotLine = D => { const f = OHL.factSix(D.listing || {}).find(a => a[0] === 'lot'); return f ? f[1].replace(/^./, c => c.toUpperCase()) : ''; };
  const highlights = D => [].concat((((((D.sw || {}).pc || {}).jl || {}).front || {}).highlights) || []).map(String).slice(0, 3).concat([lotLine(D)]).filter(t => t && !SocialSet.CONDITION.test(t) && !/\$\s?\d/.test(t));
  // the seller notes: the data's own (fullest first); the fallback is the line the socials carried before
  const notes = D => { const F0 = ((((D.sw || {}).pc || {}).js || {}).front || {}), n2 = [].concat(F0.note2 || []).map(String).filter(t => t && !SocialSet.CONDITION.test(t));
    return n2.sort((a, b) => b.length - a.length).concat([SocialSet.SOLD_POST]).filter((t, i, a) => a.indexOf(t) === i); };

  const agentTile = (T, D, w, mode) => tile(T, w, 'tn', agentParts(T, D, mode), T.tight ? {px: 12, pr: 6} : {px: r2(9*T.f), pr: r2(5*T.f)});
  // the dark tile: the full street, the city line in gold caps (place), then the house's highlights (up to n, in order)
  const streetTile = (T, D, w, two, n, place) => { const td = TONE.dk, hls = highlights(D).filter(t => hlLay(T, t, T.FB, w - 2*T.px - T.FB*1.3 - 2)).slice(0, n);
    const tl = tile(T, w, 'dk', [two ? P.street2(T, D.listing.address, td.on) : P.line(T, 'address', D.listing.address, F.street, T.FE, r2(T.FE*2.4), td.on, {lhK: 1.15, k: 8, html: `<span>${esc(D.listing.address)}</span>`})]
      .concat(place ? [P.caps(T, 'place', OHL.place(D.listing), T.FS, r2(T.FS*1.5), td.gold, {gap: 4*T.f})] : [], hls.length ? [P.bullets(T, hls, td.on, td.gold)] : [])); tl.hl = hls.length; return tl; };

  // ---------- the head row: the word tile in the main color, the house number in its dark tile ----------
  // o.street: the full street under the word (Just Sold, the slides); o.city: where the city line ("Houston, TX 77007", gold caps) may
  // go, in order of preference: 'word' (under the word) or 'num' (under the numeral); o.stack: the word on two lines
  const headRow = (T, D, W, q, o) => { const key = ['hr', W, o.maxH ? 'm' + o.maxH.toFixed(1) : q, o.street, (o.city || []).join(), o.stack].join('|'); if(T.memo.has(key)) return T.memo.get(key);
    const L = D.listing, g = T.g, num = addrNum(L), M = SocialSet.M.toUpperCase(), tm = TONE.main, td = TONE.dk, minW = r2(T.FE*(o.street ? 1.3 : 1)), place = OHL.place(L);
    const mkWord = (w, cy) => { const parts = [o.stack ? P.word2(T, M.split(' '), minW, tm.on) : P.line(T, 'moment', M, F.word, minW, 400, tm.on, {ink: 1, k: 2.5})];
      if(o.street) parts.push(P.line(T, 'address', L.address, F.streetM, T.FE, 300, tm.on, {lhK: 1.2, k: 2.4, gap: 6*T.f, html: `<span>${esc(L.address)}</span>`}));
      if(cy) parts.push(P.caps(T, 'place', place, T.FS, r2(T.FS*1.5), tm.gold, {gap: (o.street ? 3 : 7)*T.f}));
      // the street under the word never larger than three quarters of the word
      return tile(T, w, 'main', parts, o.street ? {adj: ss => { ss[1] = Math.max(T.FE, Math.min(ss[1], r2(ss[0]/1.3))); return ss; }} : {}); };
    const mkNum = (w, cy, mx) => tile(T, w, 'dk', [P.line(T, 'housenum', num, F.num, T.FE, Math.max(T.FE, mx), td.on, {ink: 1, k: 3, align: 'center'})]
      .concat(cy ? [P.caps(T, 'place', place, T.FS, r2(T.FS*1.5), td.gold, {align: 'center', gap: 7*T.f})] : []));
    let best = null; const cities = (o.city && o.city.length ? o.city : ['']).filter(c => num || c !== 'num');
    cities.forEach((cy, ci) => { for(const fr of (num ? [.22, .25, .28, .31, .34, .37, .4, .44, .48, .52, .56] : [0])){
      const wN = Math.round(W*fr), wA = num ? W - g - wN : W, a = mkWord(wA, cy === 'word'); if(!a.ok) continue;
      // the moment word is the largest type: the numeral beside it never stands taller
      const h0 = o.maxH ? Math.max(a.nat(1), Math.min(o.maxH, a.nat(99))) : a.nat(q), n = num ? mkNum(wN, cy === 'num', a.sizes(h0)[0]) : null; if(n && !n.ok) continue;
      // o.maxH: the row as tall as its words set full width want, up to maxH (the scale q then plays no part)
      const h1 = Math.max(a.nat(1), n ? n.nat(1) : 0), h = o.maxH ? Math.max(h1, Math.min(o.maxH, Math.max(a.nat(99), n ? n.nat(99) : 0))) : Math.max(a.nat(q), n ? n.nat(q) : 0), ws = a.sizes(h)[0], ns = n ? n.sizes(h)[0] : 0;
      if(o.street && ws < a.sizes(h)[1]*1.12) continue;   // the word stands clearly over the street under it
      const fillN = n ? T.tw(num, F.num(ns))/(wN - 2*T.px) : 1, fillW = Math.max(...(o.stack ? M.split(' ') : [M]).map(t => T.tw(t, F.word(ws))))/(wA - 2*T.px);
      const pen = Math.max(0, .75 - fillN)*T.FE*3 + Math.max(0, .9 - fillW)*T.FE*6, sc = ws + .45*ns - pen - (n ? n.slack(h) : 0)*.6 - a.slack(h)*.3 - ci*1.5 - h*.05;
      if(!best || sc > best.sc) best = {sc, a, n, wA, wN, h, pen}; } });
    const res = best ? {h: best.h, pen: best.pen, put: (y, h, x0) => best.a.put(x0 || 0, y, h) + (best.n ? best.n.put((x0 || 0) + best.wA + g, y, h) : '')} : null;
    T.memo.set(key, res); return res; };

  // ---------- Just Listed: the fact tiles (the postcard back): white numeral, gold caps label, main and dark by turns ----------
  // (a label too long for its tile gives up tracking, then its "Full": "2 BATHS")
  const factRow = (T, D, W, q, nMax) => { const key = ['fr', W, q, nMax].join('|'); if(T.memo.has(key)) return T.memo.get(key);
    const all = factList(D), g = T.g, py = Math.min(r2(8*T.f), T.py), mnN = T.FB; let res = null;
    for(let n = Math.min(nMax, all.length); n >= 2 && !res; n--){ const tw = (W - (n - 1)*g)/n, iw = tw - 2*Math.max(Math.min(r2(6*T.f), 7), T.safe);
      const cN = Math.min(...all.slice(0, n).map(a => T.one(a[1], F.factN, iw, 300, mnN) || 0)); if(!cN) continue;
      let cL = 0, tr = .07, list = null;
      for(const short of (T.lblK ? [1, 0] : [0, 1])){ for(const x of [.07, .03, 0]){ const ls = all.slice(0, n).map(a => [a[0], a[1], short && a[3] ? a[3] : a[2]]), c = Math.min(...ls.map(a => T.one(a[2], z => F.factL(z, x), iw, r2(T.FS*1.7), T.FS) || 0)); if(c){ cL = c; tr = x; list = ls; break; } } if(cL) break; }
      if(!cL) continue;
      const fL = z => F.factL(z, tr), sz = t => [Math.min(cN, r2(mnN*1.25*(1 + (t - 1)*1.8))), Math.min(cL, r2(T.FS*Math.max(1 + (t - 1)*.5, T.lblK || 1)))], gp = t => 5*T.f*Math.min(t, 1.5);
      const tot = t => { const [a, b] = sz(t); return capH(a) + gp(t) + b*1.3 + 2*py; };
      res = {h: tot(q), n, put: (y, h) => { let t = 1; for(let v = 10; v > 1; v *= .955) if(tot(v) <= h){ t = v; break; }
        const [sn, sl] = sz(t), y0 = y + py + (h - tot(t))/2; let s = '';
        list.forEach((a, i) => { const x = i*(tw + g), tn = i % 2 ? TONE.dk : TONE.main;
          s += rect(x, y, i === n - 1 ? W - x : tw, h, `background:${tn.bg}`) + ink('', a[0], x, y0, tw, sn, F.factN, tn.on, 'center')
            + txt('', a[2], x, y0 + capH(sn) + gp(t), tw, sl, 1.3, fL, tn.gold, {align: 'center', small: 1}); });
        return s; }}; }
    T.memo.set(key, res); return res; };

  // ---------- Just Listed: the dark tile with the street and the house's highlights, the agent on the pale tile beside it ----------
  const footRow = (T, D, W, q, o) => { const key = ['ft', W, q, o.hl, o.agent].join('|'); if(T.memo.has(key)) return T.memo.get(key);
    const g = T.g, blank = b => { const ss = b.s.sizes(b.h)[0]; return Math.max(0, b.wS - 2*T.px - T.tw(D.listing.address, F.street(ss)))*ss*1.6; };
    let best = null;
    for(const fr of [.46, .5, .54, .58, .62, .66, .7, .74]) for(const two of [0]) for(const mode of ['stack', 'row']){
      const wS = Math.round(W*fr), wA = W - g - wS, s = streetTile(T, D, wS, two, o.hl, true), a = agentTile(T, D, wA, mode); if(!s.ok || !a.ok || s.hl < o.hl) continue;
      // the room left beside the street line (a short street over long highlights) counts against a wide street tile
      const h = Math.max(s.nat(q), a.nat(q)), c = {s, a, wS, h}, sc = -h - s.slack(h)*.5 - a.slack(h)*.5 - blank(c)*.006;
      if(!best || sc > best.sc) best = Object.assign(c, {sc}); }
    const res = best ? {h: best.h, blank: blank(best), put: (y, h) => best.s.put(0, y, h) + best.a.put(best.wS + g, y, h)} : null;
    T.memo.set(key, res); return res; };

  // ---------- Just Listed: the writer's lines in the white cell (the flyer's write-up box) ----------
  // The writer's sentences in order (the first always kept), as many as fill maxN lines or fewer: every line 80%+ and the last 90%+ of
  // the measure (owner 11/8), the measure narrowed a little or the type raised up to 12% to get there. A pick that names a nearby place
  // with its distance is preferred.
  const writeUp = (T, D, w, s0, maxN) => { const key = ['wu', Math.round(w), s0, maxN].join('|'); if(T.memo.has(key)) return T.memo.get(key);
    const shown = Ivory.facts(D.listing).concat(highlights(D)), near = /\bmiles?\b/i; let best = null;
    const sig = t => String(t).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(x => x.length > 3 || /\d/.test(x)).map(x => x.replace(/(ing|ed|es|s)$/, ''));
    const repeats = t => { const a = new Set(sig(t)); return highlights(D).some(hh => { const b = sig(hh), n = b.filter(x => a.has(x)).length; return n >= 2 && n >= b.length*.6; }); };
    const pool = SocialSet.sentences(D, shown).filter(t => !repeats(t)).slice(0, 7);
    for(let mask = 1; mask < (1 << pool.length); mask += 2){ const pk = pool.filter((_, i) => mask & (1 << i)); if(pk.length > 4) continue; const t = pk.join(' ');
      for(const m of [1, .98, .96, .94, .92, .9, .88, .86, .84]) for(let s = s0; s <= s0*1.16 + .01; s += .25){ const good = r => r.n <= maxN && r.n >= 2 && r.last >= .9*w*m && !r.ws.slice(0, -1).some(x => x < .8*w*m);
        if(!good(T.wrap(t, F.note, s, w*m))) continue; const r = T.rows(t, F.note(s), w*m, s*1.42); if(!good(r)) continue;
        const sc = r.n*100 + (near.test(t) ? 80 : 0) + m*20 - (s - s0)*2 + t.length*.1; if(!best || sc > best.sc) best = {t, n: r.n, s, w: w*m, sc, just: r.ws.slice(0, -1).every(x => x >= .88*w*m)}; } }
    if(best) best.h = best.n*best.s*1.42 + best.s*.15;
    T.memo.set(key, best); return best; };
  const wuRow = (T, D, W, q, maxN) => { const py = r2(9*T.f), iw = W - 2*T.px - 3, wu = writeUp(T, D, iw, r2(Math.max(T.FB, T.FB*Math.min(1 + (q - 1)*.4, 1.3))), maxN); if(!wu) return null;
    return {h: wu.h + 2*py, put: (y, h) => `<div class="cgs-cell" style="left:0;top:${y}pt;width:${W}pt;height:${h}pt"></div>`
      + txt('writeup', wu.t, (W - wu.w)/2, y + (h - wu.h)/2, wu.w, wu.s, 1.42, F.note, '#1b1b1b', {n: wu.n, css: 'text-align:left'})}; };

  // ---------- Just Sold: the question over the note in the white cell; the agent and the logo ----------
  // The note is the fullest of the seller notes that fills its cell: every line 80%+ and the last 90%+ of the measure (the measure may
  // narrow a little, the cell hugging it), the type raised up to 13% where that fills the lines; justified when the lines run full.
  const pickNote = (T, D, iw, ns0, maxN, mMin) => { const key = ['pn', iw.toFixed(1), ns0, maxN, mMin].join('|'); if(T.memo.has(key)) return T.memo.get(key); const list = notes(D), cands = []; let res = null;
    const good = (r, w) => r.n >= 1 && r.n <= maxN && !(r.n === 1 ? r.wide < .9*w : (r.last < .9*w || r.ws.slice(0, -1).some(x => x < .82*w)));
    list.forEach((t, ti) => { const fb = t === SocialSet.SOLD_POST; for(let m = 1; m >= (mMin || .7) - .001; m -= .02) for(let s = ns0; s <= ns0*1.16 + .01; s += .25){ const w = iw*m, r = T.wrap(t, F.note, s, w);
      if(good(r, w)) cands.push({t, s, w, n: r.n, sc: (fb ? 0 : 1e6) + t.length*1000 + m*400 - r.n*30 - (s - ns0)*10}); } });
    cands.sort((a, b) => b.sc - a.sc);
    for(const c of cands.slice(0, 24)){ const r = T.rows(c.t, F.note(c.s), c.w, c.s*1.42); if(r.n !== c.n || !good(r, c.w)) continue;
      res = {t: c.t, n: c.n, s: c.s, w: c.w, loose: false, just: c.n > 1 && r.ws.slice(0, -1).every(x => x >= .9*c.w)}; break; }
    T.memo.set(key, res); return res; };
  const QQ = [4, 3.6, 3.2, 2.9, 2.6, 2.3, 2.05, 1.85, 1.65, 1.5, 1.35, 1.22, 1.1, 1];
  // the stack at scale qq in a column w wide: o.lines (the most note lines; 0: no note) or o.room (the height it may take);
  // o.agent: the agent's lines and the logo under the note
  const sellStack = (T, D, w, qq, o) => { const f = T.f, grow = k => 1 + (qq - 1)*k;
    let ql = [], qs = 0;   // o.noQ: the note alone is the call to action (where the room is short)
    if(!o.noQ){ ql = [Q]; qs = T.one(Q, F.q, w, r2(T.FB*1.3*grow(.9)), T.FB);
      if(!qs){ ql = ['Thinking about', 'selling?']; qs = T.one(ql[0], F.q, w, r2(T.FB*1.3*grow(.9)), T.FB); if(!qs) return null; } }
    const qh = ql.length*qs*1.2, nb = o.nb != null ? o.nb : r2(8*f*Math.min(qq, 1.3)), s0 = r2(T.FB*Math.min(grow(.35), 1.6)), gN = ql.length ? 6*f*Math.min(qq, 1.5) : 0, gA = 9*f*Math.min(qq, 1.5), gL = 8*f*Math.min(qq, 1.5);
    let al = null, lh = 0, lw = 0; const row = o.agent === 'row';
    if(o.agent){ for(let s = r2(T.FB*1.1*T.aK*Math.min(grow(1), 2.4)); s >= T.FB*1.1 - .01 && !al; s -= .5) al = agentLines(T, D, row ? w*.64 : w, s); if(!al) return null;
      if(row){ lw = Math.min(al.h*.92*4.2, w - al.wide - 14*f); lh = Math.min(al.h*.92, lw/3.2); if(lh < Math.max(T.FB*1.5, al.h*.55)) return null; } else lh = r2(Math.min(w/4.2, Math.max(T.FB*1.9*Math.min(grow(.8), 2), al.wide/4.2))); }
    const fixed = qh + (al ? gA + al.h + (row ? 0 : gL + lh) : 0);
    let pk = null;
    if(o.lines !== 0){ const maxN = o.lines != null ? o.lines : Math.floor((o.room - fixed - gN - 2*nb - s0*.2)/(s0*1.13*1.42)); if(maxN < 1) return null;
      pk = pickNote(T, D, w - 2*nb, s0, maxN, row ? .92 : (o.mMin || 0)); if(!pk) return null; }
    const nh = pk ? pk.n*pk.s*1.42 + pk.s*.15 + 2*nb : 0, h = fixed + (pk ? gN + nh : 0);
    if(o.room != null && h > o.room + .01) return null;
    return {h, n: pk ? pk.n : 0, len: pk ? pk.t.length : 0, loose: false, noQ: !ql.length, fb: !!(pk && pk.t === SocialSet.SOLD_POST), qq, blank: (ql.length ? (w - T.tw(ql[0], F.q(qs)))*qh : 0) + (pk ? (w - pk.w - 2*nb)*nh : 0) + (al ? (w - al.wide - (row ? lw : 0))*al.h + (row ? (al.h - lh)*lw : (al.wide - al.nameW)*al.nameH) : 0) + (al && !row ? (w - Math.min(w, lh*4.2))*lh : 0), html: (x, y, hh) => { let slack = Math.max(0, (hh || h) - h), lg = lh; if(al && !row){ const add = Math.max(0, Math.min(slack*.7, w/4.2 - lh, lh*.6)); lg += add; slack -= add; }
      const parts = (ql.length ? 1 : 0) + (pk ? 1 : 0) + (al ? (row ? 1 : 2) : 0), sp = Math.min(slack/(parts + 1), 10*f);
      let s = '', yy = y + (slack - sp*(parts - 1))/2;
      ql.forEach((t, i) => { s += txt('sold.q' + (i ? 2 : ''), t, x, yy, w, qs, 1.2, F.q, LAB); yy += qs*1.2; });
      if(pk){ yy += ql.length ? gN + sp : 0; s += `<div class="cgs-cell" style="left:${x}pt;top:${yy}pt;width:${pk.w + 2*nb}pt;height:${nh}pt"></div>`
        + txt('sold.note', pk.t, x + nb, yy + nb, pk.w, pk.s, 1.42, F.note, '#1b1b1b', {n: pk.n}); yy += nh; }
      if(al && row){ yy += gA + (ql.length || pk ? sp : 0); const lx = x + al.wide + 14*f; s += al.html(x, yy) + logo(D, lx, yy + (al.h - lh)/2, x + w - lx, lh, 'center'); }
      else if(al){ yy += gA + sp; s += al.html(x, yy); yy += al.h + gL + sp; s += logo(D, x, yy, Math.min(w, lg*4.2), lg, 'flex-start'); }
      return s; }}; };
  // the fullest stack that fits a column w x hh: the largest type that still carries a note of two lines or more; then any note; then
  // the question alone
  const sellFit = (T, D, w, hh, agent) => { const key = ['sf', w.toFixed(1), hh.toFixed(1), agent].join('|'); if(T.memo.has(key)) return T.memo.get(key); let res = null;
    const modes = agent === true ? [true, 'row'] : [agent];
    for(const noQ of [false, true]) for(const ag of modes) for(const qq of QQ){ const r = sellStack(T, D, w, qq, {room: hh, agent: ag, noQ}); if(!r) continue;
      r.sc = Math.min(r.len, 115)*1.5 + (r.fb ? 0 : 60) + (noQ ? 0 : 45) + qq*25 - (hh - r.h)*.6 - r.blank*.05; if(!res || r.sc > res.sc) res = r; }
    if(!res) for(const ag of modes) for(const qq of QQ){ const r = sellStack(T, D, w, qq, {lines: 0, agent: ag}); if(!r || r.h > hh) continue; r.sc = qq*25 - (hh - r.h)*.6 - r.blank*.05; if(!res || r.sc > res.sc) res = r; }
    T.memo.set(key, res); return res; };
  // the tall shapes' pale tile across the image: the question and the note at the left, the agent and the logo at the right
  // (the note runs across the tile in few full lines, the agent and the logo in one row under it; side by side only where that
  // cannot be set)
  const sellRow = (T, D, W, q, o) => { const key = ['sr', W, q, o.nl, o.noQ].join('|'); if(T.memo.has(key)) return T.memo.get(key);
    const px = T.px, py = r2(11*T.f), iw = W - 2*px, cg = r2(14*T.f); let best = null;
    const rowOK = !!sellStack(T, D, iw, 1, {lines: Math.min(o.nl, 3), agent: 'row', noQ: o.noQ});
    if(rowOK){ const s = sellStack(T, D, iw, q, {lines: Math.min(o.nl, 3), agent: 'row', noQ: o.noQ}); if(s && s.n >= 1) best = {row: 1, h: s.h, s}; }
    else for(const fr of [.34, .38, .42, .46, .5]){ const aw = Math.round(iw*fr), lw = iw - cg - aw, a = tile(T, aw, null, agentParts(T, D, 'stack'), {px: 0, py: 0}); if(!a.ok) continue;
      const s = sellStack(T, D, lw, q, {lines: o.nl, agent: false, noQ: o.noQ}); if(!s || !s.n) continue;
      const h = Math.max(s.h, a.nat(q)), sc = Math.min(s.len, 115)*1.5 - h*.4; if(!best || sc > best.sc) best = {sc, aw, lw, a, h, s}; }
    const res = !best ? null : best.row ? {h: best.h + 2*py, put: (y, h) => rect(0, y, W, h, `background:${TONE.tn.bg}`) + best.s.html(px, y + py, h - 2*py)}
      : {h: best.h + 2*py, put: (y, h) => rect(0, y, W, h, `background:${TONE.tn.bg}`) + best.s.html(px, y + py, h - 2*py) + best.a.put(px + best.lw + cg, y + py, h - 2*py)};
    T.memo.set(key, res); return res; };

  const QS = [3, 2.7, 2.4, 2.15, 1.9, 1.7, 1.55, 1.4, 1.3, 1.2, 1.1, 1];
  const CG = {};
  // ================= post, pin, story =================
  // Just Listed: the house, the word tile and the number tile, the fact tiles, the writer's lines in the white cell (where there is
  // room), the dark street tile and the agent's pale tile. Just Sold: the word tile (the street under the word) and the number tile
  // across the head, the house, the pale tile with the question, the note and the agent. A story opens on the house and closes on
  // two room photos, its words inside the safe band.
  const tall = (D, L, W, H, shape) => {
    const T = kit(D, shape), g = T.g, X = photoKit(D, T), sold = D.piece.moment === 'js', story = shape === 'story', sq = shape === 'square', SAFE = story ? 95 : 0;
    T.aK = sq ? 1 : 1.3; T.thW = 54*T.f;   // a room photo beside a narrowed house is a tile of its own, never a sliver
      // the agent's lines stand as large as the socials carried them before
    const E0 = story ? Math.max(SAFE + 2, r2(H*.165)) + g : 0;
    const mk = (q, o) => { const A = headRow(T, D, W, q, {street: sold, city: sold ? ['word', 'num'] : [], stack: o.st, maxH: H*(sq ? .14 : sold ? .2 : story ? .17 : .16)}); if(!A) return null;
      if(sold){ const S = sellRow(T, D, W, q, o); return S ? [A, S] : null; }
      const C = factRow(T, D, W, q, 4), Dr = footRow(T, D, W, q, o); if(!C || !Dr) return null;
      const Wu = o.wl ? wuRow(T, D, W, q, o.wl) : null; if(o.wl && (!Wu)) return null;
      return [A, C].concat(Wu ? [Wu] : [], [Dr]); };
    const room = R => H - R.reduce((a, r) => a + r.h + g, 0) - E0;
    // the square keeps its room for the house: no write-up, the note alone as the Just Sold call to action
    const base = sold ? (sq ? [{nl: 3, noQ: 1}, {nl: 2, noQ: 1}] : [{nl: 3}, {nl: 2}, {nl: 3, noQ: 1}])
      : sq ? [{wl: 0, hl: 2}, {wl: 0, hl: 1}, {wl: 0, hl: 0}]
      : [{wl: 3, hl: 4}, {wl: 2, hl: 4}, {wl: 3, hl: 3}, {wl: 2, hl: 3}, {wl: 3, hl: 2}, {wl: 2, hl: 2}, {wl: 2, hl: 1}, {wl: 2, hl: 0}, {wl: 0, hl: 3}, {wl: 0, hl: 2}, {wl: 0, hl: 1}, {wl: 0, hl: 0}];
    const opts = (story ? [1, 0] : [0]).flatMap(st => base.map(o => Object.assign({st}, o)));
    const nat = X.nat(W), mn = X.min(W), want = story ? nat : mn + .6*(nat - mn);
    let pick = null;
    // the largest scale at which the house keeps most of its own shape; at the smallest scale, any room the house can still take
    const tryOpt = (o, need) => { for(const t of QS){ const R = mk(t, o); if(R && room(R) >= (t > 1 ? want : need)) return t; } return null; };
    // the write-up stays where it can be set at all (the house gives up a little height for it before the write-up goes)
    const wlOpts = opts.filter(o => o.wl), groups = (wlOpts.length ? [[wlOpts, [mn, mn*.86]]] : []).concat([[opts, [mn, mn*.86, X.floor(W)]]]);
    for(const [os, needs] of groups){ for(const need of needs){ for(const o of os){ const q = tryOpt(o, need); if(q){ pick = {o, q}; break; } } if(pick) break; } if(pick) break; }
    pick = pick || {o: Object.assign({st: 0}, base[base.length - 1]), q: 1};
    const R = mk(pick.q, pick.o) || mk(1, pick.o) || [];
    let rm = Math.max(room(R), 20), h = CSS, y = 0;
    const pile = rows => rows.forEach(r => { h += r.put(y, r.h); y += r.h + g; });
    if(story){
      const ph = Math.max(Math.min(rm, X.max(W)), Math.min(rm, mn));
      h += X.block(0, 0, W, ph); y = ph + g; pile(R); h += X.rooms(0, y, W, H - y, 2);
    } else {
      // a block a little taller than the house can go and too short for a row of rooms under it: the rows take the spare height
      const sh = X.shapeOf(W, rm); if(sh.kind === 'bad' && rm > X.max(W)){ const add = (rm - X.max(W))/R.length; R.forEach(r => r.h += add); rm = X.max(W); }
      if(sold){ pile(R.slice(0, 1)); h += X.block(0, y, W, rm); y += rm + g; pile(R.slice(1)); }
      else { h += X.block(0, 0, W, rm); y = rm + g; pile(R); }
    }
    T.done();
    return h;
  };

  // ================= square, wide (X), Google Business Profile: the postcard fronts =================
  // Just Listed: the house in the big tile at the left; beside it the word tile over the number tile; under them the fact tiles across
  // the image, then the dark street tile and the agent's pale tile. Just Sold: the word tile and the number tile across the head; under
  // them the pale tile with the question, the note, the agent and the logo, and the house in the tile beside it.
  const card = (D, L, W, H, shape) => {
    const T = kit(D, shape), g = T.g, X = photoKit(D, T), sold = D.piece.moment === 'js';
    let h = CSS, pick = null, pickC = null; const take = c => { if(!pick || c.sc > pick.sc) pick = c; }, takeC = c => { if(!pickC || c.sc > pickC.sc) pickC = c; };
    const L1 = !sold ? ell(T, D, X, W, H, false) : null, E2 = sold ? ell(T, D, X, W, H, true) : null, B2 = sold && !E2 ? bands(T, D, X, W, H) : null, B1 = E2 || B2;
    if(!sold){
      const numMin = capH(T.FE) + 2*T.py, hlN = highlights(D).length, num = addrNum(D.listing), area = sh => sh.hw*sh.hh/(W*H)*1000;
      for(const hl of [3, 2, 1, 0].filter(n => n <= hlN)) for(const q of QS){
        const C = factRow(T, D, W, q, 4); if(!C) continue;
        // A, the postcard front: the word tile over the number tile beside the house; the street tile and the agent across the foot
        const Dr = footRow(T, D, W, q, {hl});
        if(Dr){ const TH = H - C.h - Dr.h - 2*g;
          if(TH >= X.floor(W*.5)) for(let fr = .7; fr >= .46; fr -= .02){ const pw = Math.round(W*fr), cw = W - g - pw, sh = X.shapeOf(pw, TH); if(sh.kind === 'bad') continue;
            for(const st of [1, 0]) for(const pl of [0]){ const wt = wordTile(T, D, cw, st, pl); if(!wt.ok) continue; const nt = numTile(T, D, cw, wt.sizes(wt.nat(99))[0]); if(!nt.ok) continue;
              // the word and the numeral each set to the column's width; the column's height shared between them
              const fW = wt.nat(99), fN = nt.nat(99), room = TH - g; let hW, slack = 0;
              if(fW + fN <= room){ slack = room - fW - fN; hW = fW + slack*.45; } else hW = Math.max(wt.nat(1), Math.min(room - numMin, room*fW/(fW + fN)));
              const hN = room - hW; if(hN < numMin || hW < wt.nat(1)) continue;
              // the word runs the width of its tile (one line where two would leave the tile's side empty)
              const ws = wt.sizes(hW)[0], MW = SocialSet.M.toUpperCase(), wFill = Math.max(...(st ? MW.split(' ') : [MW]).map(t => T.tw(t, F.word(ws))))/(cw - 2*T.px);
              take({v: 'A', ar: sh.hw*sh.hh/(W*H), C, Dr, TH, pw, cw, wt, nt, hW, hN, sc: area(sh) + q*70 + hl*45 - sh.pen - slack*2.2 + st*6 + pl*8 - Dr.blank/(W*H)*8000 - Math.max(0, .85 - wFill)*300}); } } }
        if(pick) continue;
        // C (X's wide image, where the type floors run large): the word tile and the number tile side by side over the street tile,
        // beside the house; the agent's pale tile across the foot
        const at = agentTile(T, D, W, 'row');
        if(at.ok){ const hAg = at.nat(q), TH = H - C.h - hAg - 2*g;
          if(TH >= X.floor(W*.4)) for(let fr = .66; fr >= .36; fr -= .02){ const pw = Math.round(W*fr), cw = W - g - pw, sh = X.shapeOf(pw, TH); if(sh.kind === 'bad') continue;
            for(const st of [1, 0]){ const A = headRow(T, D, cw, q, {stack: st}); if(!A) continue;
              for(const two of [0]){ const S = streetTile(T, D, cw, two, hl, true); if(!S.ok || S.hl < hl) continue; const hS = S.nat(q), spare = TH - g - A.h - hS; if(spare < 0) continue;
                takeC({v: 'C', ar: sh.hw*sh.hh/(W*H), C, at, hAg, TH, pw, cw, A, S, hA: A.h + spare*.5, hS: hS + spare*.5, sc: area(sh) + q*70 + hl*45 - sh.pen - spare*.8 - two*40 - A.pen - at.slack(hAg)}); } } } }
      }
      pick = pick || pickC;
      if(L1) h += L1.html;
      else if(pick && pick.v === 'A'){ const {C, Dr, TH, pw, cw, wt, nt, hW, hN} = pick;
        h += X.block(0, 0, pw, TH) + wt.put(pw + g, 0, hW) + nt.put(pw + g, hW + g, hN) + C.put(TH + g, C.h) + Dr.put(TH + g + C.h + g, Dr.h); }
      else if(pick){ const {C, at, hAg, TH, pw, A, S, hA, hS} = pick;
        h += X.block(0, 0, pw, TH) + A.put(0, hA, pw + g) + S.put(pw + g, hA + g, hS) + C.put(TH + g, C.h) + at.put(0, TH + g + C.h + g, hAg); }
    } else {
      // the house tile as large as the words allow (it is the largest tile of the grid); the note always there
      for(const mh of [.36, .33, .3, .27, .24, .21, .18]){ const A = headRow(T, D, W, 1, {street: true, city: ['word', 'num'], maxH: H*mh}); if(!A) continue; const hh = H - A.h - g; if(hh < X.floor(W*.5)) continue;
        for(let fr = .6; fr >= .28; fr -= .02){ const lw = Math.round(W*fr), pw = W - g - lw, sh = X.shapeOf(pw, hh); if(sh.kind === 'bad') continue;
          const s = sellFit(T, D, lw - 2*T.px, hh - 2*T.py, true); if(!s) continue;
          take({ar: s.n ? sh.hw*sh.hh/(W*H) : 0, A, hh, lw, pw, s, sc: sh.hw*sh.hh/(W*H)*2400 + s.qq*20 + (s.n ? 300 : 0) + (s.fb ? 0 : 60) + (s.noQ ? 0 : 30) + Math.min(s.len, 115)*.8 - sh.pen - (hh - 2*T.py - s.h)*1.2 - A.pen*4 - s.blank/(W*H)*12000}); } }
      if(B1) h += B1.html;
      else if(pick){ const {A, hh, lw, pw, s} = pick, y0 = A.h + g;
        h += A.put(0, A.h) + rect(0, y0, lw, hh, `background:${TONE.tn.bg}`) + s.html(T.px, y0 + T.py, hh - 2*T.py) + X.block(lw + g, y0, pw, hh, {right: 1}); }
    }
    T.done();
    return h;
  };
  // the word tile and the number tile on their own (the card's right column stacks them)
  const wordTile = (T, D, w, st, pl) => { const M = SocialSet.M.toUpperCase(), tm = TONE.main;
    return tile(T, w, 'main', [st ? P.word2(T, M.split(' '), T.FE, tm.on) : P.line(T, 'moment', M, F.word, T.FE, 400, tm.on, {ink: 1, k: 2.5})]
      .concat(pl ? [P.caps(T, 'place', OHL.place(D.listing), T.FS, r2(T.FS*1.5), tm.gold, {gap: 7*T.f})] : [])); };
  const numTile = (T, D, w, mx) => tile(T, w, 'dk', [P.line(T, 'housenum', addrNum(D.listing) || city(D.listing), addrNum(D.listing) ? F.num : F.gk, T.FE, Math.max(T.FE, mx || 400), TONE.dk.on, {ink: 1, k: 3, align: 'center'})]);

  // Just Listed on X and Google: the house in the largest tile at the top left; under it the fact tiles, then the dark tile with the
  // street and the city line (and the highlights, where there is room); down the right side the word tile, the number tile and the
  // agent's pale tile
  // (Just Sold: no fact tiles; the note in its white cell runs across the foot)
  // (Just Sold: the fuller two-line note where the house still keeps a quarter of the image; else the note on one line)
  const ell = (T, D, X, W, H0, sold) => { if(!sold) return ell1(T, D, X, W, H0, false, 0);
    const a = ell1(T, D, X, W, H0, true, 2); if(a && a.ar >= .26) return a; const b = ell1(T, D, X, W, H0, true, 1); return !a ? b : !b ? a : b.ar > a.ar ? b : a; };
  const ell1 = (T, D, X, W, H0, sold, NL) => ell2(T, D, X, W, H0, sold, NL, .45) || ell2(T, D, X, W, H0, sold, NL, .4);
  const ell2 = (T, D, X, W, H0, sold, NL, minW) => { const g = T.g, hlN = sold ? 0 : Math.min(3, highlights(D).length), nF = Math.min(4, factList(D).length), npy = T.tight ? 5 : r2(6*T.f); let best = null, N = null, H = H0;
    if(sold){ for(const nl of [NL]){ const s = sellStack(T, D, W - 2*T.px, 1, {lines: nl, agent: false, noQ: true, mMin: .9, nb: T.tight ? 8 : undefined}); if(s && s.n){ N = s; break; } } if(!N) return null; H = H0 - N.h - 2*npy - g; }
    for(const q of [1.6, 1.4, 1.25, 1.12, 1]) for(let fr = .26; fr <= .48; fr += .01){ const cw = Math.round(W*fr), pw = W - g - cw;
      const at = agentTile(T, D, cw, 'stack'); if(!at.ok) continue;
      const C = sold ? {h: -g, put: () => ''} : factRow(T, D, pw, q, 4); if(!C || (!sold && C.n < nF)) continue;
      for(const st of [1, 0]){ const wt = wordTile(T, D, cw, st, 0); if(!wt.ok) continue;
        // the right side: the word as large as the column sets it, the numeral no taller, the agent's tile; room left over goes to a room photo
        const hA0 = at.nat(q), n1 = numTile(T, D, cw, T.FE); if(!n1.ok) continue; const need = wt.nat(1) + n1.nat(1) + hA0 + 2*g; if(need > H) continue;
        const spare = H - need, hW = Math.min(wt.nat(99), wt.nat(1) + spare*.5), nt = numTile(T, D, cw, wt.sizes(hW)[0]), hN = Math.min(nt.nat(99), nt.nat(1) + (H - 2*g - hW - nt.nat(1) - hA0)*.7);
        let hAg = H - 2*g - hW - hN, hR = 0; const fA = at.nat(99); if(hAg - fA >= 44*T.f + g){ hR = hAg - fA - g; hAg = fA; }
        for(let hl = hlN; hl >= 0; hl--) for(const two of [0]) for(const qS of [q, q*1.3, q*1.7, q*2.2]){ const S = streetTile(T, D, pw, two, hl, true); if(!S.ok || S.hl < hl) continue;
          const hS = S.nat(qS), ph = H - C.h - hS - 2*g, sh = X.shapeOf(pw, ph); if(sh.kind === 'bad' || sh.hw < W*minW) continue;
          const ss = S.sizes(hS)[0], sw = two ? pw : T.tw(D.listing.address, F.street(ss)), blank = Math.max(0, pw - 2*T.px - sw)*ss*1.8;
          const aS = at.sizes(hAg)[0], aI = cw - (T.tight ? 18 : r2(14*T.f)), aL = agentLines(T, D, aI, aS), blankA = aL ? Math.max(0, aI - Math.max(aL.wide, at.sizes(hAg)[1]*3.6))*hAg : 0;
          const sc = sh.hw*sh.hh/(W*H0)*2600 + (sh.kind === 'side' ? sh.side*sh.hh/(W*H0)*500 : 0) + q*40 + hl*22 - sh.pen - two*30 - at.slack(hAg)*.8 - wt.slack(hW)*.5 - nt.slack(hN)*.5 - blank/(W*H0)*9000 - blankA/(W*H0)*9000;
          if(!best || sc > best.sc) best = {sc, ar: sh.hw*sh.hh/(W*H0), pw, ph, C, S, hS, wt, nt, at, hW, hN, hAg, hR}; } } }
    if(!best) return null; const {pw, ph, C, S, hS, wt, nt, at, hW, hN, hAg, hR} = best, rx = pw + g, cw = W - rx;
    return {ar: best.ar, html: X.block(0, 0, pw, ph) + C.put(ph + g, C.h) + S.put(0, ph + g + C.h + g, hS) + wt.put(rx, 0, hW) + nt.put(rx, hW + g, hN)
      + (hR ? X.rooms(rx, hW + hN + 2*g, cw, hR, 1) : '') + at.put(rx, H - hAg, hAg)
      + (N ? rect(0, H + g, W, H0 - H - g, `background:${TONE.tn.bg}`) + N.html(T.px, H + g + npy, N.h) : '')}; };
  // Just Sold on X and Google: the word tile and the number tile across the head; under them the house in the largest tile with the
  // agent's pale tile beside it; the note in its white cell across the foot
  const bands = (T, D, X, W, H) => { const g = T.g, py = r2(9*T.f), iw = W - 2*T.px; let best = null, N = null;
    for(const nl of [2, 1]){ const s = sellStack(T, D, iw, 1, {lines: nl, agent: false, noQ: true, mMin: .92}); if(s && s.n){ N = s; break; } }
    if(!N) return null; const hNs = N.h + 2*py;
    for(const mh of [.34, .3, .27, .24, .21]){ const A = headRow(T, D, W, 1, {street: true, city: ['word', 'num'], maxH: H*mh}); if(!A) continue;
      const hm = H - A.h - hNs - 2*g; if(hm < 60) continue;
      for(let fr = .26; fr <= .6; fr += .02){ const aw = Math.round(W*fr), at = agentTile(T, D, aw, 'stack'); if(!at.ok || at.nat(1) > hm) continue;
        const pw = W - g - aw, sh = X.shapeOf(pw, hm); if(sh.kind === 'bad') continue;
        const ar = sh.hw*sh.hh/(W*H), sc = ar*2400 - sh.pen - A.pen*4 - at.slack(hm)*.8; if(!best || sc > best.sc) best = {sc, ar, A, hm, aw, at, pw}; } }
    if(!best) return null; const {A, hm, at, pw} = best, y1 = A.h + g, y2 = y1 + hm + g;
    return {ar: best.ar, html: A.put(0, A.h) + X.block(0, y1, pw, hm) + at.put(pw + g, y1, hm) + rect(0, y2, W, H - y2, `background:${TONE.tn.bg}`) + N.html(T.px, y2 + py, H - y2 - 2*py)}; };

  CG.portrait = (D, L, W, H, shape) => tall(D, L, W, H, shape);
  CG.landscape = card;

  // ================= carousel photo slides: the room in the big tile, the word tile and the number tile under it =================
  // Just Listed adds the fact tiles; Just Sold the pale tile with the question and who to call.
  CG.slide = (D, L, W, H) => {
    const T = kit(D, 'slide'), g = T.g, sold = D.piece.moment === 'js', id = D.piece.photo;
    T.lblK = 1.3;   // the slide's fact labels read at phone size (review 11/22)
    let A = null, B = null;
    const mkB = t => { if(!sold) return factRow(T, D, W, t, 4);
      const py = r2(10*T.f), iw = W - 2*T.px; let al = null; for(let s = r2(T.FB*1.25*t); s >= T.FB*1.1 - .01 && !al; s -= .5){ const a = agentLines(T, D, iw*.5, s); if(a) al = a; }
      if(!al) return null; const qs = T.one(Q, F.q, iw - al.wide - 14*T.f, r2(T.FB*1.5*t), r2(T.FB*1.25)); if(!qs) return null;
      const hh = Math.max(al.h, qs*1.2) + 2*py;
      return {h: hh, put: (y, h0) => rect(0, y, W, h0, `background:${TONE.tn.bg}`) + txt('sold.q', Q, T.px, y + (h0 - qs*1.2)/2, iw - al.wide - 14*T.f, qs, 1.2, F.q, LAB) + al.html(W - T.px - al.wide, y + (h0 - al.h)/2)}; };
    A = headRow(T, D, W, 1, {street: true, city: ['word', 'num'], maxH: H*.16});
    for(const t of [2, 1.8, 1.6, 1.45, 1.3, 1.2, 1.1, 1]){ const b = mkB(t); if(b && (A ? A.h + g : 0) + b.h <= H*.34){ B = b; break; } }
    if(!B) B = mkB(1);
    const below = (A ? A.h + g : 0) + (B ? B.h + g : 0), ph = H - below;
    let h = CSS + OHL.photo(D, id, `left:0;top:0;width:${W}pt;height:${ph}pt`), y = ph + g;
    if(A){ h += A.put(y, A.h); y += A.h + g; }
    if(B) h += B.put(y, B.h);
    T.done();
    return h;
  };
  window.CGSocial = CG;
})();
