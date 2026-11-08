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
  const F = window.StandardFooter = {VERSION: '2026-11-02.2'};
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
    return `<div style="position:absolute;left:0;top:0;${opts.dark ? DARK : ''}">` +
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

  F.html = (version, D, box, opts) => (({1: F.full, 2: F.narrow, 3: F.band, full: F.full, narrow: F.narrow, band: F.band})[version] || F.full)(D, box, opts);
})();
