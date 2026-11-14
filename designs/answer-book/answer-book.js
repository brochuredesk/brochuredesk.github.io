/* The Houston Answer Book: shared helpers for every piece.
   Data, fonts, question captions, the stat row, the flood rule, the contact card and the print checks live here,
   so the fold-over and the smaller pieces behave the same. */
(function(){
  const AB = {};
  const esc = AB.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pt = px => px*72/96;

  AB.data = () => JSON.parse(document.getElementById('brochure-data').textContent || '{}');

  // ---------- fonts ----------
  // Every render opens in the design's original fonts. An agent may pick other fonts, but only from the approved
  // list in fonts.json (fonts that keep the originals' width and letter heights). Anything else falls back to the originals.
  AB.fontBase = '../../fonts/pool/';
  // true when the agent picked other fonts than the design's originals (applyFonts sets the 'ab-' families): the extra fitting
  // below (letter-spacing steps, an underfull callout) is for those fonts only; the originals render as approved
  AB.fontSwapped = () => ['--font-display', '--font-body'].some(v => /ab-/.test(document.documentElement.style.getPropertyValue(v)));
  AB.applyFonts = async function(D, spec){
    const want = (D.brand && D.brand.fonts) || D.fonts || {};
    const issues = [];
    const roles = {display: '--font-display', body: '--font-body'};
    const loads = [];
    for(const role of Object.keys(roles)){
      const o = spec && spec.originals[role];
      let id = want[role];
      if(!o || !id || id === o.id) continue;
      if(!o.approved.includes(id)){ issues.push({slot:'fonts.'+role, kind:'font-not-approved', detail:id}); continue; }
      const fam = 'ab-' + id;
      const have = (spec.weights && spec.weights[id]) || [400,500,600,700];
      for(const w of role === 'display' ? [500,600] : [400,600,700]){
        const near = have.reduce((a,b)=> Math.abs(b-w) < Math.abs(a-w) ? b : a);
        const f = new FontFace(fam, `url(${AB.fontBase}${id}-latin-${near}-normal.woff2)`, {weight:String(w)});
        document.fonts.add(f); loads.push(f.load());
      }
      document.documentElement.style.setProperty(roles[role], `'${fam}',Helvetica,Arial,sans-serif`);
    }
    await Promise.all(loads).catch(e => issues.push({slot:'fonts', kind:'font-load-failed', detail:String(e)}));
    const cs = getComputedStyle(document.documentElement);
    await Promise.all(['400 10pt','500 10pt','600 10pt'].flatMap(w => [document.fonts.load(`${w} ${cs.getPropertyValue('--font-display')}`), document.fonts.load(`${w} ${cs.getPropertyValue('--font-body')}`)]));
    return issues;
  };

  // ---------- photos ----------
  AB.src = (D, id) => (D.photos && D.photos[id] && D.photos[id].src) || '';
  AB.photo = (D, id, style, slot) => {
    const p = (D.photos||{})[id] || {};
    const pos = p.focus ? `object-position:${esc(p.focus)}` : '';
    return `<div class="ph" data-photo="${esc(id||'')}" data-slot-photo="${esc(slot||'')}" style="${style||''}">${id && p.src ? `<img src="${esc(p.src)}" style="${pos}" alt="">` : ''}</div>`;
  };

  // ---------- text ----------
  const widths = [100, 96, 99, 92, 97, 88, 95, 100, 90, 62];
  AB.ghost = (lines, lh, style) => {
    let h = '';
    for(let i=0;i<lines;i++) h += `<i style="width:${i===lines-1 && lines>1 ? 58 : widths[i%widths.length]}%;margin-top:${i ? lh-3.2 : (lh-3.2)/2}pt"></i>`;
    return `<div class="ghost" style="height:${lines*lh}pt;${style||''}">${h}</div>`;
  };
  AB.pending = (D, text) => D.copyPending || text == null || text === '';

  // Question caption: "— Question?" then the answer, with an optional bold lead ("Kitchen, 8'1" x 11'10".").
  AB.caption = (D, c, slot, lines, extra) => {
    c = c || {};
    lines = lines || 3;
    if(D.copyPending || (!c.q && !c.a))
      return `<div class="cap" ${extra||''}>${AB.ghost(1, 11, 'width:55%')}${AB.ghost(lines, 11.5, 'margin-top:1.5pt')}</div>`;
    const lead = c.lead ? `<b>${esc(c.lead)}</b> ` : '';
    return `<div class="cap" ${extra||''}>
      <div class="q" data-slot="${slot}.q" data-lines="1"><i class="dash"></i>${esc(c.q)}</div>
      <div class="a" data-slot="${slot}.a" data-lines="${lines}" style="max-height:${lines*11.5+2}pt">${lead}${esc(c.a||'')}</div></div>`;
  };

  // ---------- listing facts ----------
  const n = v => Number(v).toLocaleString('en-US');
  const pl = (k, one, many) => `${n(k)} ${k==1 ? one : many}`;
  // The fifth stat is lot size, garage or stories, never anything else (flood status never goes in the stat row).
  AB.stat5 = (L, pick) => {
    const opts = {
      lot: L.lotAcres ? (L.lotAcres >= 0.5 ? `${L.lotAcres} Acre Lot` : `${n(Math.round(L.lotAcres*43560))} Sq Ft Lot`)
         : L.lotSqft ? `${n(L.lotSqft)} Sq Ft Lot` : null,
      garage: L.garage ? `${L.garage}-Car Garage` : null,
      stories: L.stories ? (L.stories == 1 ? 'One Story' : `${L.stories} Stories`) : null,
    };
    if(pick && opts[pick]) return opts[pick];
    return opts.lot || opts.garage || opts.stories || null;
  };
  AB.stats = (L, pick) => {
    const s = [];
    if(L.beds) s.push(pl(L.beds, 'Bedroom', 'Bedrooms'));
    if(L.baths){ const bt = BD.bathsText(L); s.push(bt.main); if(bt.half) s.push(bt.half); }
    if(L.sqft) s.push(`${n(L.sqft)} Square Feet`);
    if(L.yearBuilt || L.year) s.push(`Built in ${L.yearBuilt || L.year}`);
    const f = AB.stat5(L, pick); if(f) s.push(f);
    return s;
  };
  AB.place = L => [L.city, L.state].filter(Boolean).join(', ');   // the approved place line: city and state (owner 10/21/2026); neighborhood names allowed (owner 10/28/2026)

  // ---------- the flood rule ----------
  // "Never flooded" may show only when the listing description says so in plain words. A claim tied to one storm
  // ("did not flood in Harvey") is narrower than "never", so it doesn't count. We never infer flood status.
  AB.floodStated = desc => {
    const sentences = String(desc||'').split(/(?<=[.!?])\s+/);
    return sentences.some(s => /\b(never\s+(been\s+)?flooded|(has|have)\s+(not|never)\s+(ever\s+)?(been\s+)?flooded|(hasn|haven)['’]t\s+(ever\s+)?(been\s+)?flooded)\b/i.test(s)
      && !/\b(during|in|from)\s+(hurricane|tropical|harvey|ike|allison|beryl|imelda|the\s+\d{4}|\d{4})\b/i.test(s));
  };

  // ---------- photo rows that fill a column ----------
  // Picks the row arrangement whose photos stay closest to a 3:2 landscape shape once the rows are stretched to fill
  // the height, so a house with few rooms gets bigger photos, not tall slivers. Returns rows with flex-grow weights.
  AB.CAP_EST = 41.5;            // caption estimate (question + about two lines); rows are equalized after layout
  AB.bestRows = function(pair, tiles, o){
    const T = 1.5, shapes = {0:[],1:[1],2:[2],3:[3],4:[2,2],5:[3,2],6:[3,3],7:[4,3],8:[4,4],9:[3,3,3],10:[4,3,3]};
    const tag = (arr, pre) => arr.map((t,i) => Object.assign({}, t, {_slot: pre + i}));
    const P = tag(pair, 'beds.pair'), Tl = tag(tiles, 'beds.tile');
    const cands = [];
    if(P.length === 2) cands.push([{items:P, weights:[5.3,3.2]}, ...(shapes[Tl.length]||[]).map(c => ({cols:c}))]);
    if(P.length === 2) cands.push([{items:P, weights:[1,1]}, ...(shapes[Tl.length]||[]).map(c => ({cols:c}))]);
    if(P.length >= 1) cands.push([{items:[P[0]], weights:[1]}, ...(shapes[Tl.length + P.length - 1]||[]).map(c => ({cols:c, rest:true}))]);
    if(!P.length) cands.push((shapes[Tl.length]||[]).map(c => ({cols:c})));
    let best = null;
    for(const c of cands){
      const pool = [...(c[0] && c[0].items === P ? [] : P.slice(c[0] && c[0].items ? c[0].items.length : 0)), ...Tl];
      let k = 0;
      const rows = c.map(r => {
        if(r.items) return {items:r.items, weights:r.weights, cols:r.items.length};
        const items = pool.slice(k, k + r.cols); k += r.cols;
        return {items, weights:items.map(() => 1), cols:r.cols};
      }).filter(r => r.items.length);
      // natural photo height of each row at 3:2 (the narrowest photo in the row sets it)
      rows.forEach(r => { const sum = r.weights.reduce((a,b)=>a+b,0), wmin = Math.min(...r.weights.map(w => (o.W - o.gap*(r.cols-1)) * w / sum)); r.nat = wmin / T; r.wmin = wmin; });
      const room = o.H - rows.length * (AB.CAP_EST + 12);
      const s = room / rows.reduce((a,r)=>a+r.nat,0);
      // the original design's wide + narrow primary pair wins whenever it is close
      const score = Math.max(...rows.map(r => Math.abs(Math.log((r.wmin / (r.nat*s)) / T)))) - (c === cands[0] && P.length === 2 ? 0.15 : 0);
      rows.forEach(r => r.grow = r.nat);
      if(!best || score < best.score - 1e-6) best = {rows, score};
    }
    return best ? best.rows : [];
  };

  // ---------- contact card ----------
  // [headshot] agent ............ | ............ brokerage. Full width, no QR (owner 10/22/2026: no QR codes on any piece).
  // The brokerage block sits at the card's right edge; one hairline sits in the middle of the gap. With a headshot the
  // agent block moves right of the portrait. Only the agent's name may step down, from 30 pt to an 18 pt floor.
  AB.card = function(D, o){
    const A = D.agent || {}, b = D.brand || {};
    const cell = A.cell || A.phone, office = A.office || b.phone, title = A.title || A.designation;
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot);
    const hs = hsSrc ? `<div class="col hs" style="left:0;top:12pt;bottom:4pt;width:${o.hs||92}pt"><img src="${esc(hsSrc)}" alt=""></div>` : '';
    const logo = b.logo
      ? `<div class="logo" data-area="7200" data-maxh="48" style="position:absolute;left:0;right:0;top:10pt;height:48pt;justify-content:flex-end"><img src="${esc(b.logo)}" alt=""></div>
         <div class="lbl" style="right:0;top:62pt;text-align:right" data-slot="broker.name" data-fine="1">${esc(b.brokerage||'')}</div>`
      : `<div class="logo" style="position:absolute;left:0;right:0;top:12pt;height:44pt;justify-content:flex-end"><span class="word" style="font-size:17pt" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span></div>`;
    return `<div class="card" data-card="1" data-hs="${hs ? (o.hs||92)+14 : 0}" style="left:${o.x}pt;top:${o.y}pt;width:${o.w}pt;height:${o.h}pt">
      ${hs}
      <div class="col agent" style="left:0">
        <div class="name" style="top:10pt;font-size:30pt;line-height:38pt" data-slot="agent.name" data-lines="1" data-start="30">${esc(A.name)}</div>
        ${title ? `<div class="lbl" style="left:1pt;top:50pt" data-slot="agent.title" data-fine="1">${esc(title)}</div>` : ''}
        ${cell ? `<div class="lbl" style="left:1pt;top:66pt" data-fine="1">${esc(A.phoneLabel||'Call or text')}</div>
        <div class="big" style="left:0;top:76pt;font-size:21pt;line-height:24pt" data-slot="agent.cell" data-lines="1">${esc(cell)}</div>` : ''}
        ${A.email ? `<div class="line" style="left:0;top:104pt" data-slot="agent.email" data-lines="1">${esc(A.email)}</div>` : ''}
        ${A.web ? `<div class="line" style="left:0;top:116pt" data-slot="agent.web" data-lines="1">${esc(A.web)}</div>` : ''}
      </div>
      <div class="vr v1" style="top:14pt;bottom:8pt"></div>
      <div class="col brk" style="text-align:right">
        ${logo}
        ${office ? `<div class="lbl" style="right:0;top:80pt;text-align:right" data-fine="1">${esc(b.officeLabel||'Office')}</div>
        <div class="big" style="right:0;top:90pt;text-align:right;font-size:17pt;line-height:20pt" data-slot="broker.office" data-lines="1">${esc(office)}</div>` : ''}
        ${b.web ? `<div class="line" style="right:0;top:114pt;text-align:right;font-weight:400" data-slot="broker.web" data-lines="1">${esc(b.web)}</div>` : ''}
      </div>
    </div>`;
  };

  // ---------- short contact card (owner 11/10/2026, round 3: "narrower" meant SHORTER TOP TO BOTTOM): the full-width card of
  // AB.card, its rows tightened to about 1.25 in (was 132 pt; the round 2 narrow stack was about 180 pt). Same columns and
  // fitting (AB.layoutCards): agent left, brokerage right.
  AB.cardShortH = 90;
  AB.cardShort = function(D, o){
    const A = D.agent || {}, b = D.brand || {};
    const cell = A.cell || A.phone, office = A.office || b.phone, title = A.title || A.designation;
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot);
    const hw = 64;
    const hs = hsSrc ? `<div class="col hs" style="left:0;top:8pt;bottom:2pt;width:${hw}pt"><img src="${esc(hsSrc)}" alt=""></div>` : '';
    const logo = b.logo
      ? `<div class="logo" data-area="5400" data-maxh="38" style="position:absolute;left:0;right:0;top:8pt;height:38pt;justify-content:flex-end"><img src="${esc(b.logo)}" alt=""></div>`
      : `<div class="logo" style="position:absolute;left:0;right:0;top:10pt;height:34pt;justify-content:flex-end"><span class="word" style="font-size:16pt" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span></div>`;
    const webs = [A.email, A.web].filter(Boolean).join('  ·  ');
    return `<div class="card" data-card="1" data-hs="${hs ? hw+14 : 0}" style="left:${o.x}pt;top:${o.y}pt;width:${o.w}pt;height:${o.h}pt">
      ${hs}
      <div class="col agent" style="left:0">
        <div class="name" style="top:6pt;font-size:25pt;line-height:33pt" data-slot="agent.name" data-lines="1" data-start="25">${esc(A.name)}</div>
        ${title ? `<div class="lbl" style="left:1pt;top:37pt" data-slot="agent.title" data-fine="1">${esc(title)}</div>` : ''}
        ${cell ? `<div class="lbl" style="left:1pt;top:52pt" data-fine="1">${esc(A.phoneLabel||'Call or text')}</div>
        <div class="big" style="left:${title ? 76 : 76}pt;top:46pt;font-size:16pt;line-height:19pt" data-slot="agent.cell" data-lines="1">${esc(cell)}</div>` : ''}
        ${webs ? `<div class="line" style="left:0;top:72pt" data-slot="agent.email" data-lines="1">${esc(webs)}</div>` : ''}
      </div>
      <div class="vr v1" style="top:10pt;bottom:4pt"></div>
      <div class="col brk" style="text-align:right">
        ${logo}
        ${office ? `<div class="line" style="right:0;top:54pt;text-align:right;font-weight:400" data-slot="broker.office" data-lines="1">${esc(b.officeLabel||'Office')} ${esc(office)}</div>` : ''}
        ${b.web ? `<div class="line" style="right:0;top:68pt;text-align:right;font-weight:400" data-slot="broker.web" data-lines="1">${esc(b.web)}</div>` : ''}
      </div>
    </div>`;
  };

  // ---------- narrow contact card (owner 11/10/2026, 11/9 book p14: a much narrower agent block on every back) ----------
  // Stacked, sized to its content: [headshot] name, title, the cell; then email and website; a hairline; the logo with the
  // office line beside it. o = {x, y, w, h}; the piece puts other content beside it.
  AB.cardStack = function(D, o){
    const A = D.agent || {}, b = D.brand || {};
    const cell = A.cell || A.phone, office = A.office || b.phone, title = A.title || A.designation;
    const hsSrc = A.headshot && ((D.photos||{})[A.headshot] ? D.photos[A.headshot].src : A.headshot);
    const hw = 66, off = hsSrc ? hw + 12 : 0;
    const hs = hsSrc ? `<div class="col hs" style="left:0;top:10pt;width:${hw}pt;height:86pt"><img src="${esc(hsSrc)}" alt=""></div>` : '';
    return `<div class="card stack" data-cardstack="1" style="left:${o.x}pt;top:${o.y}pt;width:${o.w}pt;height:${o.h}pt">
      ${hs}
      <div class="name" style="left:${off}pt;top:9pt;font-size:24pt;line-height:32pt" data-slot="agent.name" data-lines="1" data-start="24">${esc(A.name)}</div>
      ${title ? `<div class="lbl" style="left:${off + 1}pt;top:40pt" data-slot="agent.title" data-fine="1">${esc(title)}</div>` : ''}
      ${cell ? `<div class="lbl" style="left:${off + 1}pt;top:55pt" data-fine="1">${esc(A.phoneLabel||'Call or text')}</div>
      <div class="big" style="left:${off}pt;top:64pt;font-size:20pt;line-height:23pt" data-slot="agent.cell" data-lines="1">${esc(cell)}</div>` : ''}
      ${A.email ? `<div class="line" style="left:0;top:${hsSrc ? 104 : 92}pt" data-slot="agent.email" data-lines="1">${esc(A.email)}</div>` : ''}
      ${A.web ? `<div class="line" style="left:0;top:${hsSrc ? 116 : 104}pt" data-slot="agent.web" data-lines="1">${esc(A.web)}</div>` : ''}
      <div class="hrs" style="position:absolute;left:0;right:0;top:${o.h - 60}pt;height:.5pt;background:var(--line)"></div>
      ${b.logo ? `<div class="logo" data-area="3600" data-maxh="32" style="position:absolute;left:0;right:0;top:${o.h - 54}pt;height:32pt;justify-content:center"><img src="${esc(b.logo)}" alt=""></div>`
        : `<div class="logo" style="position:absolute;left:0;right:0;top:${o.h - 54}pt;height:32pt;justify-content:center"><span class="word" style="font-size:13pt" data-slot="broker.name" data-lines="1">${esc(b.brokerage||'')}</span></div>`}
      ${office || b.web ? `<div class="line" style="left:0;right:0;top:${o.h - 17}pt;text-align:center;font-weight:400" data-slot="broker.office" data-lines="1">${esc([office ? (b.officeLabel||'Office') + ' ' + office : '', b.web || ''].filter(Boolean).join('  ·  '))}</div>` : ''}
    </div>`;
  };
  // ---------- text under a photo fills the photo's width (owner 11/8/2026; ported from the Atlas capfit.js) ----------
  // A caption is set justified; when its last line comes up short of 82% of the photo's width, the type steps up in small
  // steps, 12% at most, with the same number of lines, until it does. One that no step fills stays as it was.
  const lineBoxes = el => {
    const r = document.createRange(), ls = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while(w.nextNode()){ const n = w.currentNode, re = /\S+/g; let m;
      while((m = re.exec(n.textContent))){ r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        for(const q of r.getClientRects()){ if(q.width < .5) continue; const mid = (q.top + q.bottom) / 2; let l = ls.find(x => Math.abs(x.m - mid) < q.height * .5);
          if(l){ l.l = Math.min(l.l, q.left); l.r = Math.max(l.r, q.right); } else ls.push({m: mid, l: q.left, r: q.right}); } } }
    return ls.sort((a, b) => a.m - b.m);
  };
  // owner 11/10/2026 (round 3, rules 4 and 8): captions side by side share one type size (one step for the whole row, up to
  // 12%) and one line count; a caption is justified only when its lines already run 88%+ ragged (a small stretch), never to
  // spread a short caption across the width.
  AB.capFit = function(root){
    const els = [...(root || document).querySelectorAll('.cap .a')].filter(el => el.textContent.trim() && el.getClientRects().length);
    const rows = new Map();
    els.forEach(el => { const item = el.closest('.item'), ph = item && item.querySelector(':scope > .ph'); if(!ph) return;
      const key = item.parentElement; if(!rows.has(key)) rows.set(key, []); rows.get(key).push({el, ph}); });
    rows.forEach(list => {
      const S = list.map(({el, ph}) => ({el, W: ph.getBoundingClientRect().width, base: parseFloat(getComputedStyle(el).fontSize), lh0: parseFloat(getComputedStyle(el).lineHeight), n0: lineBoxes(el).length}));
      const live = S.filter(x => x.n0 >= 2); if(!live.length) return;
      const fills = x => lineBoxes(x.el).map(l => (l.r - l.l) / x.W);
      const set = (x, k) => { x.el.style.fontSize = (x.base * k) + 'px'; x.el.style.lineHeight = (x.lh0 * Math.min(k, 1.06)) + 'px'; };
      const okAll = () => live.every(x => { const f = fills(x); return f.length === x.n0 && f[f.length - 1] >= .82; });
      let done = false;
      for(let k = 1; k <= 1.1201 && !done; k += .0025){ live.forEach(x => { x.el.style.textAlign = 'left'; set(x, k); }); if(okAll()){ done = true; live.forEach(x => x.el.dataset.capfit = k.toFixed(3)); } }
      // No shared type step alone fills the last lines (an agent's own font breaks the lines elsewhere, or sets one more line
      // than the box holds): keep the row's one shared size, and give each caption just enough letter-spacing (up to .04 em,
      // a tracking nobody sees; same words, same lines) to run its last line to 82%. The size is the largest from +12% down to
      // 90% that every caption in the row can fill. Only when the plain steps above fail.
      const trs = [0, .004, .008, .012, .016, .02, .024, .028, .032, .036, .04];
      const T = x => Math.min(x.n0, +x.el.dataset.lines || x.n0);
      const failing = () => live.some(x => { x.el.style.fontSize = ''; x.el.style.lineHeight = ''; x.el.style.letterSpacing = ''; const f = fills(x); return f.length > T(x) || f[f.length - 1] < .8; });
      const need = !done && AB.fontSwapped() && failing();
      for(let k = 1.12; need && k >= .8999 && !done; k -= .005){
        const picks = live.map(x => {
          const mh = parseFloat(x.el.style.maxHeight) * 96 / 72;
          x.el.style.textAlign = 'left'; x.el.style.fontSize = (x.base * k) + 'px';
          x.el.style.lineHeight = Math.min(x.lh0 * Math.min(k, 1.06), isFinite(mh) ? (mh - 3) / T(x) : 1e9) + 'px';
          return trs.find(tr => { x.el.style.letterSpacing = tr + 'em'; const f = fills(x); return f.length === T(x) && f[f.length - 1] >= .82 && Math.max(...f.slice(0, -1), 0) <= .995; });
        });
        if(picks.every(v => v !== undefined)){ live.forEach((x, i) => { x.el.style.letterSpacing = picks[i] + 'em'; x.el.dataset.capfit = k.toFixed(3) + '+' + picks[i]; }); done = true; }
      }
      if(!done) live.forEach(x => { x.el.style.fontSize = ''; x.el.style.lineHeight = ''; x.el.style.letterSpacing = ''; });
      live.forEach(x => { const f = fills(x); if(f.length > 1 && Math.min(...f.slice(0, -1)) >= .88) x.el.style.textAlign = 'justify'; });
    });
    // an intro paragraph (not under a photo) fills its box's width the same way: its last line reaches 82% of the box
    if(AB.fontSwapped()) (root || document).querySelectorAll('.intro[data-slot]').forEach(el => {
      if(!el.textContent.trim() || !el.getClientRects().length) return;
      const W = el.getBoundingClientRect().width, base = parseFloat(getComputedStyle(el).fontSize), n0 = lineBoxes(el).length;
      if(n0 < 2) return;
      const ok = () => { const ls = lineBoxes(el); return ls.length === n0 && (ls[ls.length - 1].r - ls[ls.length - 1].l) / W >= .82; };
      if(ok()) return;
      { const ls = lineBoxes(el); if((ls[ls.length - 1].r - ls[ls.length - 1].l) / W >= .8) return; }   // already past the 80% line: leave it as drawn
      for(let tr = 0; tr <= .0201; tr += .004) for(let k = 1; k <= 1.1201; k += .005){
        el.style.letterSpacing = tr ? tr + 'em' : ''; el.style.fontSize = (base * k) + 'px';
        if(ok()){ el.dataset.capfit = k.toFixed(3) + '+' + tr; return; } }
      el.style.fontSize = ''; el.style.letterSpacing = '';
    });
  };

  // the card's height for its content (with or without a headshot)
  AB.cardStackH = D => { const A = D.agent || {}; return (A.headshot ? 130 : 118) + 60; };
  // shrink the name until it fits the card's width
  AB.layoutStacks = () => document.querySelectorAll('[data-cardstack]').forEach(card => {
    const W = pt(card.clientWidth), name = card.querySelector('.name');
    if(!name) return;
    let fs = +name.dataset.start;
    while(parseFloat(name.style.left || 0) + AB.textWidth(name) > W && fs > 16){ fs -= 1; name.style.fontSize = fs + 'pt'; name.style.lineHeight = (fs + 8) + 'pt'; }
    // sized to its content: the card is as wide as its widest line (or the logo), and the block beside it takes the rest
    const cl = card.getBoundingClientRect().left;
    let wMax = 0;
    card.querySelectorAll('.name,.lbl,.big,.line,.hs').forEach(el => { if(el.classList.contains('line') && el.style.textAlign === 'center') return;
      const r = el.classList.contains('hs') ? el.getBoundingClientRect() : (() => { const rg = document.createRange(); rg.selectNodeContents(el); return rg.getBoundingClientRect(); })();
      wMax = Math.max(wMax, pt(r.right - cl)); });
    card.querySelectorAll('.logo img, .logo .word, .line[style*="center"]').forEach(el => { const rg = document.createRange(); rg.selectNodeContents(el); wMax = Math.max(wMax, pt(el.tagName === 'IMG' ? el.getBoundingClientRect().width : rg.getBoundingClientRect().width)); });
    const nw = Math.min(W, Math.ceil(wMax + 2)), x0 = parseFloat(card.style.left);
    card.style.width = nw + 'pt';
    const near = card.parentElement.querySelector('.near.stackn');
    if(near){ const right = parseFloat(near.style.left) + parseFloat(near.style.width), nx = x0 + nw + 28; near.style.left = nx + 'pt'; near.style.width = (right - nx) + 'pt'; }
  });

  // Logos of any shape get about the same visual weight: each slot gives a logo a set area (pt²), up to the slot's
  // height and width. A wide lockup ends up wide and short, a square or stacked logo taller.
  AB.fitLogos = () => document.querySelectorAll('.logo[data-area] img').forEach(img => {
    const box = img.parentElement, a = img.naturalWidth / img.naturalHeight || 1;
    const maxW = pt(box.clientWidth) || 170;
    let h = Math.min(+box.dataset.maxh, Math.sqrt(+box.dataset.area / a));
    if(h * a > maxW) h = maxW / a;
    img.style.height = h + 'pt'; img.style.width = (h * a) + 'pt'; img.style.maxWidth = 'none'; img.style.maxHeight = 'none';
  });

  // Lines a block of text actually sets in (line boxes of its text, however it is styled inside).
  AB.lines = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const tops = [...r.getClientRects()].filter(q => q.width > .5 && q.height > .5).map(q => q.top).sort((a,b)=>a-b);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
    let n = 0, last = -1e9;
    for(const t of tops){ if(t - last > lh*0.5){ n++; last = t; } }
    return n;
  };
  // Natural width of a single-line text element, as set.
  AB.textWidth = el => { const r = document.createRange(); r.selectNodeContents(el); return pt(r.getBoundingClientRect().width); };

  // Captions in one row share one height (the longest), so the photos above them line up.
  AB.equalizeRows = () => document.querySelectorAll('.row').forEach(row => {
    const caps = [...row.children].map(it => it.querySelector(':scope > .cap')).filter(Boolean);
    if(caps.length < 2) return;
    const h = Math.max(...caps.map(c => c.offsetHeight));
    caps.forEach(c => c.style.height = h + 'px');
  });

  AB.layoutCards = function(){
    const issues = [];
    document.querySelectorAll('[data-card]').forEach(card=>{
      const off = +card.dataset.hs || 0, W = pt(card.clientWidth) - off, minGap = 40;
      const agent = card.querySelector('.agent'), brk = card.querySelector('.brk');
      const name = agent.querySelector('.name');
      const nat = AB.textWidth;
      const agentW = () => Math.max(...[...agent.children].map(nat));
      const img = brk.querySelector('.logo img');
      const logoW = img ? pt(img.getBoundingClientRect().width) : 0;
      const word = brk.querySelector('.logo .word');
      const brkW = Math.max(logoW, ...[...brk.querySelectorAll('[data-slot]')].map(nat), word ? nat(word) : 0);
      let fs = +name.dataset.start, aw = agentW(), free = W - aw - brkW;
      while(free < minGap && fs > 18){ fs -= 1; name.style.fontSize = fs+'pt'; name.style.lineHeight = (fs+4)+'pt'; aw = agentW(); free = W - aw - brkW; }
      if(free < minGap) issues.push({slot:'contact-card', kind:'card-fit', detail:'columns need '+Math.round(minGap-free)+'pt more'});
      agent.style.left = off+'pt'; agent.style.width = aw+'pt';
      brk.style.left = (off+W-brkW)+'pt'; brk.style.width = brkW+'pt';
      card.querySelector('.v1').style.left = (off+aw+free/2)+'pt';
    });
    return issues;
  };

  // ---------- print checks (read by the renderer) ----------
  // Overflow per slot, type under 8 pt (6 pt for fine print), photos under 300 ppi at print size, empty slots,
  // flood claims the listing doesn't make, prices, and sample text on a real agent's piece.
  AB.check = function(D, extra){
    const issues = [...(extra||[])];
    // rough-draft preview lines never reach a paid or downloaded piece (10/25/2026)
    if(D && D.preview) issues.push({slot:'copy', kind:'preview-text', detail:'rough-draft preview lines; the writer has not run'});
    const sample = /\b(avery morgan|any brokerage|your brokerage|your website|lorem|ipsum|placeholder|tbd|xx+)\b|555[.\-]01\d\d/i;
    const flood = AB.floodStated((D.listing||{}).description);
    document.querySelectorAll('[data-slot]').forEach(el=>{
      const name = el.dataset.slot, cs = getComputedStyle(el), txt = el.textContent.trim();
      const size = parseFloat(cs.fontSize)*72/96;
      const oneLine = cs.whiteSpace === 'nowrap';
      const max = +el.dataset.lines || 0;
      const over = oneLine ? el.scrollWidth > el.clientWidth + 1
                 : max ? AB.lines(el) > max || el.scrollWidth > el.clientWidth + 1
                 : el.scrollHeight > el.clientHeight + 1;
      if(over) issues.push({slot:name, kind:'overflow', text:txt.slice(0,80), ...(max && !oneLine ? {lines:AB.lines(el), max} : {})});
      if(size < 8 && !el.dataset.fine) issues.push({slot:name, kind:'type-too-small', size:+size.toFixed(1)});
      if(size < 6) issues.push({slot:name, kind:'fine-print-below-6pt', size:+size.toFixed(1)});
      if(!txt && !el.dataset.optional) issues.push({slot:name, kind:'empty-slot'});
      if(/\$\s?\d/.test(txt)) issues.push({slot:name, kind:'price', text:txt.slice(0,80)});
      if(!flood && /flood/i.test(txt)) issues.push({slot:name, kind:'flood-not-stated', text:txt.slice(0,80)});
      if(!D.sample && sample.test(txt)) issues.push({slot:name, kind:'placeholder', text:txt.slice(0,80)});
    });
    document.querySelectorAll('.cap .a[data-lines], .intro[data-lines]').forEach(el=>{
      if(+el.dataset.lines < 2 || !el.textContent.trim()) return;
      const r = document.createRange(); r.selectNodeContents(el);
      const rects = [...r.getClientRects()].filter(q => q.width > .5);
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 12;
      const lines = []; for(const q of rects){ const l = lines.find(x => Math.abs(x.top - q.top) < lh*0.5); if(l){ l.l = Math.min(l.l,q.left); l.r = Math.max(l.r,q.right); } else lines.push({top:q.top,l:q.left,r:q.right}); }
      const box = el.getBoundingClientRect().width;
      if(lines.length < 2) issues.push({slot:el.dataset.slot, kind:'caption-under-2-lines', text:el.textContent.trim().slice(0,80)});
      // cover photo captions: all three run two lines (owner 11/10/2026, 11/9 book p11; was three lines, owner 10/27)
      else { const last = lines.sort((a,b)=>a.top-b.top)[lines.length-1]; if((last.r-last.l)/box < 0.75) issues.push({slot:el.dataset.slot, kind:'last-line-short', pct:Math.round((last.r-last.l)/box*100)}); }
    });
    document.querySelectorAll('.ph').forEach(el=>{
      const img = el.querySelector('img'), slot = el.dataset.slotPhoto || el.dataset.photo || 'photo';
      if(!img){ issues.push({slot, kind:'empty-photo-slot'}); return; }
      if(!img.complete || !img.naturalWidth){ issues.push({slot, kind:'photo-missing', src:img.getAttribute('src')}); return; }
      const wIn = el.clientWidth/96, hIn = el.clientHeight/96;
      const ppi = Math.min(img.naturalWidth/wIn, img.naturalHeight/hIn);
      if(ppi < 300) issues.push({slot, photo:el.dataset.photo, kind:'photo-under-300ppi', ppi:Math.round(ppi), placedIn:[+wIn.toFixed(2),+hIn.toFixed(2)]});
    });
    if(!D.sample){
      const A = D.agent||{}, b = D.brand||{};
      if(/brochuredesk/i.test(A.web||'')) issues.push({slot:'agent.web', kind:'placeholder', text:'website still points to BrochureDesk'});
      if(/sample|placeholder/i.test(String(b.logo||'').split('/').pop())) issues.push({slot:'broker.logo', kind:'placeholder', text:'sample logo'});
    }
    return issues;
  };

  // Where each photo sits and how big, so the renderer can fit photos to print size.
  AB.placements = () => [...document.querySelectorAll('.ph img')].map(img => ({src: img.getAttribute('src'), w: img.parentElement.clientWidth/96, h: img.parentElement.clientHeight/96}));

  window.AB = AB;
})();

/* Bath wording (owner 11/1/2026; templates/_shared/baths.js): load it here for every page of this design; a ½ in text is set small. */
(function(){ if(!window.BD || !BD.bathPair) document.write('<script src="../engine/baths.js"><\/script><script src="../engine/baths-text.js"><\/script>'); })();
