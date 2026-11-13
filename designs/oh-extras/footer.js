/* templates/_shared/footer.js: the standard agent contact footer (owner, 11/1/2026, sign-in and feedback round 2 review).
   One shared piece that every flyer, card and sheet pulls in, so the owner can change its design once and every new
   order picks it up. Orders already placed keep the files they were rendered with (the order's PDFs are kept as made;
   StandardFooter.VERSION is stamped on each render as window.footerVersion so an order records which footer it has).

   Three versions, sized for different layouts; every piece uses one of them:
     1  full     full width along the foot: the Right panel contact card (agentcard.js, ContactCard 'panel' layout:
                 agent column | brokerage panel). Sign-in sheets, feedback cards, flyers.
     2  narrow   a narrow side column (owner: the Atlas black-and-white sign-in footer is Standard #2): headshot beside
                 the name, REALTOR®, the cell, email and website, then a hairline and the brokerage logo with the office
                 line. Same type, labels and logo rules as the standard card. Anchored to the box's bottom.
     3  band     pieces about 4 to 5.5 in wide (postcard backs, small cards): the agent block with the brokerage logo
                 centered under it; the email, a hairline and the office lines right-aligned at the far right (owner
                 11/2/2026, round 3 review).

     StandardFooter.html(version, D, box, opts) -> html     box [x, y, w, h] in pt; opts.dark for a dark field
   Needs agentcard.js (ContactCard) loaded first, and ContactCard.fit(root) after fonts load (as every piece does). */
(function(){
  const F = window.StandardFooter = {VERSION: '2026-11-13.1'};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  window.footerVersion = F.VERSION;

  // the standard card's colors on a dark field
  const DARK = '--cc-paper:transparent;--cc-ink:#fff;--cc-muted:var(--on-soft,rgba(255,255,255,.82));--cc-accent:var(--gold,#fff);--cc-line:var(--line-on,rgba(255,255,255,.3));';

  F.full = (D, box, opts) => {
    opts = opts || {};
    const b = Object.assign({}, D.brand || {});
    if(opts.dark && b.logoOnDark) b.logo = b.logoOnDark;
    // about 0.8 in tall: the short preset with REALTOR® on the name's line
    const size = box[3] < 72 ? 'short' : box[2] >= 600 ? 'full' : 'mid';
    const s = Object.assign(size === 'short' ? {desigInline: true} : {}, opts.s || {});
    // owner 11/13 (Open House extras B16/P17 review): on the wide sign-in sheets the agent info grows to fill its space
    // (F.finish, after ContactCard.fit); on every card the logo sits centered both ways in the space right of the hairline
    const fill = opts.fill != null ? opts.fill : box[2] >= 640;
    return `<div class="std-footer-1" data-fill="${fill ? 1 : ''}" style="position:absolute;left:0;top:0;${opts.dark ? DARK : ''}">` +
      ContactCard.html(box, D.agent || {}, b, {layout: 'panel', size, s, floor: 8, bottomGap: 0.5, grow: 0}) + '</div>';
  };

  // #3 (owner 11/2/2026, round 3 review): the agent block on the left (accent bar, name, REALTOR®, the cell) with the
  // brokerage logo centered under it, moving with the name's length; on the right, pushed to the far edge, the email,
  // a hairline, and the office line and brokerage website just under it, all right-aligned to the email's right edge.
  // No rule runs on the left.
  F.band = (D, box, opts) => {
    opts = opts || {};
    const [x, y, w, h] = box, a = D.agent || {}, b = D.brand || {}, dark = !!opts.dark;
    const desig = a.designation && /realtor/i.test(a.designation) || a.nar ? 'REALTOR®' : (a.designation || '');
    const logo = dark && b.logoOnDark ? b.logoOnDark : b.logo;
    const ink = dark ? 'var(--on)' : 'var(--ink)', mut = dark ? 'var(--on-soft)' : 'var(--muted)', acc = dark ? 'var(--gold,var(--on))' : 'var(--accent)';
    const rule = dark ? 'var(--line-on)' : 'var(--line)';
    return `<div class="abs std-footer-3" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;display:flex;align-items:center;justify-content:space-between;gap:18pt;color:${ink}">` +
      `<div style="display:flex;gap:11pt;align-items:stretch;min-width:0"><div style="width:3pt;background:${acc};flex:none"></div>` +
      `<div style="display:inline-flex;flex-direction:column;min-width:0">` +
      `<div class="nowrap" data-slot="agent.name" style="font:400 22pt/26pt var(--font-display);color:${ink};padding-right:2pt">${esc(a.name)}</div>` +
      (desig ? `<div class="nowrap" style="margin-top:1pt;font:600 8pt/10pt var(--font-body);letter-spacing:1.4pt;color:${mut}">${esc(desig)}</div>` : '') +
      `<div class="nowrap" style="margin-top:3pt"><span style="font:600 8pt/1 var(--font-body);letter-spacing:1.4pt;text-transform:uppercase;color:${acc}">${esc(a.phoneLabel || 'Call / Text')}</span>` +
      `<span data-slot="agent.phone" style="margin-left:8pt;font:700 14pt/17pt var(--font-body);color:${ink}">${esc(a.phone)}</span></div>` +
      `<div style="margin-top:8pt;display:flex;justify-content:center">` +
      (logo ? `<img src="${esc(logo)}" alt="" style="max-height:28pt;max-width:130pt">` : `<div class="nowrap" style="font:400 12pt/14pt var(--font-display)">${esc(b.brokerage)}</div>`) +
      `</div></div></div>` +
      `<div style="display:flex;flex-direction:column;align-items:flex-end;text-align:right;flex:none">` +
      `<div class="nowrap" data-slot="agent.email" style="font:400 9.5pt/12.5pt var(--font-body)">${esc(a.email)}</div>` +
      (a.web ? `<div class="nowrap" style="font:400 9.5pt/12.5pt var(--font-body)">${esc(a.web)}</div>` : '') +
      `<div style="margin-top:6pt;padding-top:6pt;border-top:.45pt solid ${rule};font:400 9pt/12pt var(--font-body);white-space:nowrap">` +
      `${esc(b.officeLabel || 'Office')} <b style="font-weight:600">${esc(b.phone)}</b>${b.web ? `<br>${esc(b.web)}` : ''}</div></div></div>`;
  };

  F.narrow = (D, box, opts) => {
    opts = opts || {};
    const [x, y, w, h] = box, a = D.agent || {}, b = D.brand || {}, dark = !!opts.dark;
    const desig = a.designation && /realtor/i.test(a.designation) || a.nar ? 'REALTOR®' : (a.designation || '');
    const logo = dark && b.logoOnDark ? b.logoOnDark : b.logo;
    const ink = dark ? 'var(--on)' : 'var(--ink)', mut = dark ? 'var(--on-soft)' : 'var(--muted)', acc = dark ? 'var(--gold,var(--on))' : 'var(--accent)';
    const rule = dark ? 'var(--line-on)' : 'var(--line)';
    const hs = a.headshot ? `<img src="${esc(a.headshot)}" alt="" style="width:56pt;height:70pt;object-fit:cover;object-position:center 22%;flex:none">`
      : `<div style="width:3pt;align-self:stretch;background:${acc};flex:none"></div>`;
    return `<div class="abs std-footer-2" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;display:flex;flex-direction:column;justify-content:flex-end;color:${ink}">` +
      `<div style="display:flex;gap:11pt;align-items:flex-end">${hs}<div style="min-width:0;flex:1">` +
      `<div data-slot="agent.name" data-lines="1" style="font:400 19pt/23pt var(--font-display);color:${ink};white-space:normal;padding-right:2pt">${esc(a.name)}</div>` +
      (desig ? `<div class="nowrap" style="margin-top:3pt;font:600 8pt/10pt var(--font-body);letter-spacing:1.4pt;color:${mut}">${esc(desig)}</div>` : '') +
      `<div class="nowrap" style="margin-top:7pt;font:600 8pt/9pt var(--font-body);letter-spacing:1.4pt;text-transform:uppercase;color:${acc}">${esc(a.phoneLabel || 'Call / Text')}</div>` +
      `<div class="nowrap" data-slot="agent.phone" style="margin-top:2pt;font:700 15pt/17pt var(--font-body);color:${ink}">${esc(a.phone)}</div></div></div>` +
      `<div class="nowrap" data-slot="agent.email" style="margin-top:8pt;font:400 9.5pt/13.5pt var(--font-body);overflow:visible">${esc(a.email)}</div>` +
      (a.web ? `<div class="nowrap" style="font:400 9.5pt/13.5pt var(--font-body);overflow:visible">${esc(a.web)}</div>` : '') +
      `<div style="margin-top:9pt;padding-top:9pt;border-top:.45pt solid ${rule};display:flex;align-items:center;justify-content:space-between;gap:12pt">` +
      (logo ? `<img src="${esc(logo)}" alt="" style="max-height:30pt;max-width:118pt;flex:0 1 auto;min-width:0;object-fit:contain;object-position:left center">` : `<div class="nowrap" style="font:400 12pt/14pt var(--font-display)">${esc(b.brokerage)}</div>`) +
      `<div style="font:400 9pt/12pt var(--font-body);white-space:nowrap;text-align:right">${esc(b.officeLabel || 'Office')} <b style="font-weight:600">${esc(b.phone)}</b>${b.web ? `<br>${esc(b.web)}` : ''}</div></div></div>`;
  };

  /* F.finish(root, {home}) runs after ContactCard.fit (owner 11/13/2026, Open House extras B01/B16/P17 review):
     1  fill    sign-in sheets: the agent info (name, REALTOR®, the cell, email and website) grows, all of it by the same
                factor, as big as the card's box allows (email and website side by side on one line); the name may not
                shrink more than 8% under the grown size, nothing may overflow. Falls back to the size as built.
     2  center  every card: the brokerage logo and office line sit centered, top to bottom and left to right, in the space
                right of the hairline: the colored field the card sits on, cut at the sheet's edge (the white margin on the
                home file) and at the nearest text, rule or frame on each side. The hairline stays where it is; the card
                grows to hold the moved group so nothing falls outside it. */
  const PT = 96 / 72;
  const visEl = e => !!(e.offsetParent || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden';
  const hasBg = cs => { const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/); const a = m ? m[1].split(',').map(Number) : [0, 0, 0, 0];
    return (a.length < 4 || a[3] > 0.05) && cs.backgroundColor !== 'transparent' || cs.backgroundImage !== 'none'; };
  const contains = (r, x, y) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;

  const fillOne = (card, home) => {
    const S = JSON.parse(card.dataset.opts), wrap = card.parentElement;
    const n = card.querySelector('.cc-name'), lines = card.querySelector('.cc-lines'), contact = card.querySelector('.cc-contact');
    const web = card.querySelector('.cc-web');
    const set = (k, inline) => {
      n.dataset.size = S.name * k; n.dataset.floor = S.name * k * 0.92;
      card.querySelectorAll('.cc-desig').forEach(e => e.style.fontSize = S.desig * k + 'pt');
      card.querySelectorAll('.cc-lab').forEach(e => e.style.fontSize = S.label * k + 'pt');
      card.querySelectorAll('.cc-phone').forEach(e => e.style.fontSize = S.phone * k + 'pt');
      card.querySelectorAll('.cc-line').forEach(e => { e.style.fontSize = S.line * k + 'pt'; e.style.lineHeight = S.line * k * 1.3 + 'pt'; });
      if(contact) contact.style.columnGap = S.rowGap * k + 'pt';
      if(lines){ lines.style.display = inline ? 'flex' : ''; lines.style.columnGap = inline ? S.rowGap * k + 'pt' : ''; }
      ContactCard.fit(wrap);
    };
    // and the text keeps 14 pt clear of the hairline and 4 pt inside the sheet's visible edge (the white margin at home)
    const ag = card.querySelector('.cc-agent'), panel = card.querySelector('.cc-panel'), tr = card.closest('.trim');
    const room = () => { const sc = card.getBoundingClientRect().width / card.offsetWidth || 1, pt = PT * sc;
      const right = panel && visEl(panel) ? panel.getBoundingClientRect().left - 14 * pt : card.getBoundingClientRect().right;
      const bottom = tr ? tr.getBoundingClientRect().bottom - ((home ? 18 : 0) + 4) * pt : 1e9;
      return [...ag.querySelectorAll('*')].every(e => { if(!visEl(e) || ![...e.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())) return true;
        const rg = document.createRange(); rg.selectNodeContents(e); return [...rg.getClientRects()].every(q => !q.width || q.right <= right && q.bottom <= bottom); }); };
    // the name's tails (the y of "Reyes") keep 3.5 pt clear of the cell line under it (the headline-touches-below rule)
    const clear = () => { const cs = getComputedStyle(n), c = document.createElement('canvas').getContext('2d');
      c.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; const m = c.measureText(n.textContent), sc = card.getBoundingClientRect().width / card.offsetWidth || 1;
      const r = n.getBoundingClientRect(), lh = parseFloat(cs.lineHeight) * sc, base = r.top + (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent) * sc) / 2 + m.fontBoundingBoxAscent * sc;
      const ph = card.querySelector('.cc-contact'); return !ph || ph.getBoundingClientRect().top - (base + m.actualBoundingBoxDescent * sc) >= 3.5 * PT * sc; };
    const ok = () => !ContactCard._overflow(card).length && clear() && !card.classList.contains('two-line') && !(web && web.style.display === 'none') && room();
    for(let k = 1.6; k > 1.001; k -= 0.04){ set(k, true); if(ok()){ card.dataset.fillK = k.toFixed(2); return; } }
    set(1, false); card.dataset.fillK = '1';
  };

  const centerOne = (card, home) => {
    const panel = card.querySelector('.cc-panel'); if(!panel || !visEl(panel)) return;
    const trim = card.closest('.trim'); if(!trim) return;
    const kids = [...panel.children].filter(visEl); if(!kids.length) return;
    const k = card.getBoundingClientRect().width / card.offsetWidth || 1, pt = PT * k;
    const pr = panel.getBoundingClientRect(), cx = (pr.left + pr.right) / 2, cy = (pr.top + pr.bottom) / 2;
    const tr = trim.getBoundingClientRect(), inset = home ? 18 * pt : 0;
    const vis = {left: tr.left + inset, top: tr.top + inset, right: tr.right - inset, bottom: tr.bottom - inset};
    // the field: the last (topmost) colored block in the sheet under the panel's center, outside the card
    let field = null;
    trim.querySelectorAll('*').forEach(e => { if(card.contains(e) || e.contains(card) || !visEl(e)) return;
      const r = e.getBoundingClientRect(); if(!r.width || !contains(r, cx, cy) || !hasBg(getComputedStyle(e))) return; field = r; });
    const cr = card.getBoundingClientRect();
    const sp = field ? {left: pr.left, top: Math.max(field.top, vis.top), right: Math.min(field.right, vis.right), bottom: Math.min(field.bottom, vis.bottom)}
      // no field (black and white): the card's own height, and as far right as the card sits in from the left edge
      : {left: pr.left, top: cr.top, right: Math.max(cr.right, Math.min(vis.right, tr.right - (cr.left - tr.left))), bottom: cr.bottom};
    // cut at the nearest text, rule or frame on each side
    const gap = 6 * pt;
    trim.querySelectorAll('*').forEach(e => { if(card.contains(e) || e.contains(card) || !visEl(e)) return;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect(); if(!r.width && !r.height) return;
      if(contains(r, cx, cy)) return;   // a background under the panel
      const text = [...e.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
      const ink = text || /^(IMG|svg)$/i.test(e.tagName) || hasBg(cs) || ['Top', 'Right', 'Bottom', 'Left'].some(s => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none');
      if(!ink || r.right <= sp.left || r.left >= sp.right || r.bottom <= sp.top || r.top >= sp.bottom) return;
      if(r.bottom <= cy) sp.top = Math.max(sp.top, r.bottom + gap);
      else if(r.top >= cy) sp.bottom = Math.min(sp.bottom, r.top - gap);
      else if(r.left >= cx) sp.right = Math.min(sp.right, r.left - gap);
    });
    // the group's box (logo and office lines) and where it goes
    const g = kids.map(e => e.getBoundingClientRect());
    const gl = Math.min(...g.map(r => r.left)), gr = Math.max(...g.map(r => r.right)), gt = Math.min(...g.map(r => r.top)), gb = Math.max(...g.map(r => r.bottom));
    // left to right: the middle of the space; top to bottom: the middle of the hairline beside it (the footer's own row),
    // kept inside the space (the reviewer's 11/13 pass: centered on the whole dark field it read low on full-bleed footers)
    const ty = Math.min(Math.max((pr.top + pr.bottom) / 2, sp.top + (gb - gt) / 2), sp.bottom - (gb - gt) / 2);
    let dx = (sp.left + sp.right) / 2 - (gl + gr) / 2, dy = ty - (gt + gb) / 2;
    if(sp.right - sp.left < gr - gl || sp.bottom - sp.top < gb - gt) return;   // no room to move into: leave it as built
    if(Math.abs(dx) < 0.5 * pt && Math.abs(dy) < 0.5 * pt) return;
    // keep a copy to put back if the move breaks the card's own checks (the office line's bottom gap, nothing outside it)
    const ag0 = card.querySelector('.cc-agent'), saved = [card, panel, ag0].map(e => e && e.style.cssText), bad0 = ContactCard._overflow(card).length;
    const undo = () => { [card, panel, ag0].forEach((e, i) => { if(e) e.style.cssText = saved[i]; }); delete card.dataset.logoMoved; };
    // grow the card (and the panel with it) to hold the moved group; the agent column keeps its place
    const ag = card.querySelector('.cc-agent'), p2 = v => v / pt;
    const sl = 2 * pt;   // a little slack so the moved group never sits on the card's own edge
    const growR = Math.max(0, gr + dx + sl - cr.right), growT = Math.max(0, cr.top - (gt + dy - sl)), growB = Math.max(0, gb + dy + sl + (+card.dataset.bgap || 0) * pt - cr.bottom);
    if(growR){ card.style.width = card.offsetWidth / PT + p2(growR) + 'pt'; panel.style.width = panel.offsetWidth / PT + p2(growR) + 'pt'; }
    if(growT || growB){ card.style.top = parseFloat(card.style.top) - p2(growT) + 'pt'; card.style.height = card.offsetHeight / PT + p2(growT + growB) + 'pt';
      if(ag){ const cs = getComputedStyle(ag); ag.style.paddingTop = parseFloat(cs.paddingTop) / PT + p2(growT) + 'pt'; ag.style.paddingBottom = parseFloat(cs.paddingBottom) / PT + p2(growB) + 'pt'; } }
    // place the group by the panel's padding (it stays a centered column: logo over the office lines)
    const pr2 = panel.getBoundingClientRect(), w = gr - gl, h = gb - gt;
    const left = gl + dx - pr2.left, top = gt + dy - pr2.top;
    panel.style.justifyContent = 'flex-start'; panel.style.alignItems = 'center';
    panel.style.paddingLeft = p2(left) + 'pt'; panel.style.paddingRight = p2(pr2.width - left - w) + 'pt';
    panel.style.paddingTop = p2(top) + 'pt'; panel.style.paddingBottom = '0pt';
    card.dataset.logoMoved = `${p2(dx).toFixed(1)},${p2(dy).toFixed(1)}`;
    if(ContactCard._overflow(card).length > bad0) undo();
  };

  F.finish = (root, o) => {
    o = o || {};
    if(!window.ContactCard) return;
    (root || document).querySelectorAll('.std-footer-1').forEach(w => {
      const card = w.querySelector('.cc[data-contactcard]'); if(!card) return;
      // the card never runs past the sheet's visible edge (the white margin on the home file): its hairline would show there
      const tr = card.closest('.trim');
      if(tr && o.home){ const sc = card.getBoundingClientRect().width / card.offsetWidth || 1, cr = card.getBoundingClientRect();
        const over = (cr.bottom - (tr.getBoundingClientRect().bottom - 20 * PT * sc)) / (PT * sc);
        if(over > 0){ const h0 = +card.dataset.h, t0 = card.dataset.top0;
          card.dataset.h = h0 - over; card.style.height = card.dataset.h + 'pt'; ContactCard.fit(w);
          // shorter cost a line (the brokerage website dropped) or the name's size: keep the height, move the card up instead
          const lost = [...card.querySelectorAll('.cc-brkweb, .cc-web')].some(e => e.style.display === 'none') || +card.dataset.namePt < +card.querySelector('.cc-name').dataset.size;
          if(lost){ card.dataset.h = h0; card.dataset.top0 = (t0 ? +t0 : parseFloat(card.style.top)) - over; ContactCard.fit(w); } } }
      if(w.dataset.fill === '1') fillOne(card, !!o.home);
      centerOne(card, !!o.home);
    });
  };

  F.html = (version, D, box, opts) => (({1: F.full, 2: F.narrow, 3: F.band, full: F.full, narrow: F.narrow, band: F.band})[version] || F.full)(D, box, opts);
})();
