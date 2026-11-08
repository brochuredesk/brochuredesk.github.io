/* fxs-23 Black Label fold-over helpers (11/7/2026). Panel coordinates in pt: the trim is 0..612 x 0..792, the bleed runs to -9.
   Content sits inside the gold frame: x 36..576, y 38..754 (frame 20 pt from the trim, inside the 18 pt safe zone). Uses the shared FXS helpers from fxs23.js and adds nothing to them. */
(function(){
  const B = window.BK = {}, esc = FXS.esc, X0 = 36, CW = 540, Y0 = 38, YB = 754;
  B.X0 = X0; B.CW = CW; B.Y0 = Y0; B.YB = YB;
  // the signature: a 0.75 pt gold frame 20 pt from the trim (inside the 18 pt safe zone) and a fine inner rule 4 pt inside it
  B.frame = () => `<div class="bk-frame" style="left:20pt;top:20pt;width:572pt;height:752pt"></div><div class="bk-frame2" style="left:24pt;top:24pt;width:564pt;height:744pt"></div>`;
  const wl = t => FXS.width(String(t).toUpperCase(), 'font-family:Montserrat;font-weight:600;font-size:10pt;letter-spacing:2.4pt');
  // a captioned photo: photo, gold label (size small), a paragraph of whole sentences (the fill pass picks them)
  B.cap = (D, c, x, y, w, ph, lines, slot, o) => { o = o || {};
    const L0 = FXS.leadLabel(c.lead); let name = L0.name; if(wl(name) > w) name = name.split(/ and |, /)[0];
    const showSize = L0.size && wl(name) + FXS.width(L0.size, 'font-family:Montserrat;font-weight:500;font-size:9pt') + 14 <= w, lh = o.lh || 13, fs = o.fs || 9.5;
    return FXS.box(D, c.photo, x, y, w, ph, slot, o.css) +
      `<div class="abs" style="left:${x}pt;top:${y + ph + 8}pt;width:${w}pt;white-space:nowrap"><div class="lbl" data-slot="${slot}.label" data-lines="1" style="max-width:${w}pt">${esc(name.toUpperCase())}</div>${showSize ? `<span style="font:500 9pt/13pt var(--fx-font);color:var(--bk-cream);margin-left:8pt;white-space:nowrap">${esc(L0.size)}</span>` : ''}</div>` +
      `<div class="abs cap"><div class="a" style="position:absolute;left:${x}pt;top:${y + ph + 26}pt;width:${w}pt;height:${lines*lh}pt;font-size:${fs}pt;line-height:${lh}pt" data-slot="${slot}" data-lh="${lh}" data-lines="${lines}" data-narrow="${o.narrow == null ? 10 : o.narrow}" ${FXS.sd(c.s)}></div></div>`; };
  B.capH = (lines, lh) => 8 + 18 + lines*(lh || 13);      // label row + caption under a photo
  // an inside page opens with a gold kicker and a white serif title on the black, then the intro on a cream card. Returns {html, bottom}
  B.head = (kicker, title, intro, slot, lines, y) => { y = y == null ? Y0 : y;
    const ts = FXS.fitSize(title, "font-family:'Cormorant Garamond';font-weight:600", CW, 32, 24), th = Math.round(ts*1.2), lh = 15, tr = []; for(let t = lines; t >= 3; t--) tr.push(t);
    const ty = y + 17, cy = ty + th + 6, pad = 14, h = pad + lines*lh + pad;
    if(lines === 0) return {bottom: cy - 6, html: `<div class="abs" style="left:${X0}pt;top:${y}pt">${FXS.label(kicker, slot + '.kicker')}</div>
      <div class="abs bk-ttl" style="left:${X0}pt;top:${ty}pt;width:${CW}pt;height:${th}pt;font-size:${ts}pt;line-height:${th}pt;color:#fff" data-slot="${slot}.title" data-lines="1">${esc(title)}</div>`};
    return {bottom: cy + h, html: `<div class="abs" style="left:${X0}pt;top:${y}pt">${FXS.label(kicker, slot + '.kicker')}</div>
      <div class="abs bk-ttl" style="left:${X0}pt;top:${ty}pt;width:${CW}pt;height:${th}pt;font-size:${ts}pt;line-height:${th}pt;color:#fff" data-slot="${slot}.title" data-lines="1">${esc(title)}</div>
      <div class="bk-cream" style="left:${X0}pt;top:${cy}pt;width:${CW}pt;height:${h}pt"></div>
      <div class="abs wu" data-slot="${slot}.intro" data-lines="${lines}" data-try="${tr.join(',')}" data-lh="${lh}" ${FXS.sd(intro)} style="left:${X0 + 18}pt;top:${cy + pad}pt;width:${CW - 36}pt;height:${lines*lh}pt;font-size:10.5pt;line-height:${lh}pt;color:var(--bk-ink)"></div>`}; };
  // the address row of the back: white serif caps left, the place in gold spaced caps right
  B.addrRow = (D, y) => { const L = D.listing, addr = ((SW.data().listing || {}).address || L.address).toUpperCase(), place = `${FXS.hood(L) ? FXS.hood(L) + ' · ' : ''}${L.city}, ${L.state}`.toUpperCase();
    const pw = FXS.width(place, 'font-family:Montserrat;font-weight:600;font-size:10pt;letter-spacing:2.4pt') + 40;
    return `<div class="abs bk-addr" style="left:${X0}pt;top:${y}pt;width:${CW - pw - 14}pt;height:30pt;font-size:26pt;line-height:30pt;letter-spacing:1pt" data-slot="back.address" data-lines="1">${esc(addr)}</div>` + FXS.capsLine(place, X0 + CW - pw, y + 9, pw, 10, 2.4, 'var(--fx-accent)', 'back.place', {w: 600, align: 'right'}); };
  // five serif facts: bed, full baths, sq ft, built, lot (or the stories when the data has no lot)
  B.facts = (L) => { const t = FXS.statItems(L).slice(0, 4), lot = L.lotSize ? String(L.lotSize).replace(/\s*Sq Ft Lot/i, ' Sq Ft Lot') : '';
    t.push(lot ? lot : (L.stories ? `${L.stories} Stories` : '')); return t.filter(Boolean); };
  B.cover = (D) => {
    const L = D.listing, K = (D.sw || {}).front || {}, PLN = (D.sw || {}).plan || {}, heroId = PLN.cover || K.hero || 'front';
    let hh = 368; while(hh < 420 && !SW.fits(D, heroId, CW, hh)) hh += 4;
    const pb = Y0 + hh; let h = B.frame();
    h += FXS.box(D, heroId, X0, Y0, CW, hh, 'front.house');
    // the strip: three horizontals under the hero (kitchen, primary suite, the dusk pergola)
    const sg = 8, nS = Math.min(3, Math.max(2, (PLN.strip || []).length)), sw = (CW - (nS - 1)*sg)/nS, sy = pb + 8, sh = 104;
    (PLN.strip || []).slice(0, 3).forEach((id, i) => { h += FXS.box(D, id, X0 + i*(sw + sg), sy, sw, sh, 'front.strip' + i); });
    const addr = ((SW.data().listing || {}).address || L.address).toUpperCase();
    const s = FXS.fitSize(addr, "font-family:'Cormorant Garamond';font-weight:600;letter-spacing:1.2pt", CW, 50, 34), ah = Math.round(s*1.1), ay = sy + sh + 8;
    h += `<div class="abs bk-addr" style="left:${X0}pt;top:${ay}pt;width:${CW}pt;height:${ah}pt;font-size:${s}pt;line-height:${ah}pt" data-slot="address" data-lines="1">${esc(addr)}</div>`;
    let y = ay + ah + 5;
    h += `<div class="bk-rule" style="left:${X0}pt;top:${y}pt;width:${CW}pt"></div>`; y += 8;
    h += FXS.capsLine(FXS.placeText(L), X0, y, CW, 10, 2.8, 'var(--fx-accent)', 'place', {w: 600}); y += 14 + 6;
    const f = B.facts(L), fw = CW/f.length, fh = 42;
    h += `<div class="abs" style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:${fh}pt">` + f.map((t, i) => { const p = FXS.statParts(t);
      return `<div class="bk-fact" style="left:${i*fw}pt;width:${fw}pt;height:${fh}pt" data-slot="fact.${i}" data-lines="1"><span class="n">${esc(p.n)}</span><span class="l">${esc(p.l)}</span></div>`; }).join('') + `</div>`;
    y += fh + 10;
    const lh = 16.5, n = Math.floor((YB - y)/lh), tr = []; for(let t = n; t >= 5; t--) tr.push(t);
    const pool = K.coverIntro || (((D.companion || {}).flyer || {}).front || {}).intro || K.summary || [];
    h += `<div class="abs wu" data-slot="front.summary" data-lines="${n}" data-try="${tr.join(',')}" data-lh="${lh}" data-last="1" ${FXS.sd(pool)} style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:${n*lh}pt;font-size:11pt;line-height:${lh}pt"></div>`;
    return h; };
  // a gold double-ruled box with a heading row and a list (the kitchen box)
  B.kitchen = (D, box, y, hgt) => {
    let h = `<div class="card" style="left:${X0}pt;top:${y}pt;width:${CW}pt;height:${hgt}pt"></div>`;
    const px = X0 + 20, iw = CW - 40, kl = wl(box.kicker || ''), hs = FXS.fitSize(box.heading || '', "font-family:'Cormorant Garamond';font-weight:600", iw - kl - 24, 24, 17);
    h += `<div class="abs" style="left:${px}pt;top:${y + 14}pt;height:26pt;display:flex;align-items:baseline;white-space:nowrap">${FXS.label(box.kicker || '', 'left.box.kicker', 'line-height:26pt')}</div>`;
    h += `<div class="abs" style="left:${px + kl + 24}pt;top:${y + 12}pt;width:${iw - kl - 24}pt;height:${Math.round(hs*1.2)}pt;font:600 ${hs}pt/${Math.round(hs*1.2)}pt var(--fx-serif);color:#fff;white-space:nowrap;overflow:hidden" data-slot="left.box.heading" data-lines="1">${esc(box.heading || '')}</div>`;
    const items = (box.items || []).slice(0, 6), gy = y + 12 + 28 + 8, gap = 28, colw = (iw - gap)/2, pitch = (y + hgt - 12 - gy)/3;
    items.forEach((it, i) => { const r = Math.floor(i/2), c = i%2, x = px + c*(colw + gap), yy = gy + r*pitch;
      h += `<div class="abs" style="left:${x}pt;top:${yy + 3}pt;font-size:7pt;line-height:10pt;color:var(--fx-accent)">◆</div>`;
      h += `<div class="abs" style="left:${x + 14}pt;top:${yy}pt;width:${colw - 14}pt;height:${2*13}pt;font:400 10pt/13pt var(--fx-font);color:#fff;overflow:hidden" data-slot="left.box.t${i}" data-lines="2" data-try="2" data-narrow="6" data-lh="13" ${FXS.sd(it.s)}></div>`; });
    return h; };
  // the Nearby row: a gold label, then three places with their verified distances (serif numeral, place beneath)
  B.nearby = (list, y, h) => { const w0 = 96, cw = (CW - w0)/Math.max(1, list.length);
    let o = `<div class="bk-rule" style="left:${X0}pt;top:${y}pt;width:${CW}pt"></div><div class="bk-rule" style="left:${X0}pt;top:${y + h}pt;width:${CW}pt"></div>`;
    o += `<div class="abs" style="left:${X0}pt;top:${y + h/2 - 7}pt">${FXS.label('Nearby', 'back.nearby.label')}</div>`;
    list.forEach((n, i) => { const m = /^([\d.]+)\s*(.*)$/.exec(String(n.dist)), num = m ? m[1] : String(n.dist), unit = m ? (/mile/i.test(m[2]) ? 'mi' : m[2]) : '';
      o += `<div class="bk-near" style="left:${X0 + w0 + i*cw}pt;top:${y + 1}pt;width:${cw - 8}pt;height:${h - 2}pt;${i ? '' : ''}" data-slot="back.near.${i}" data-lines="1"><div class="n">${esc(num)}${unit ? `<i>${esc(unit)}</i>` : ''}</div><div class="p">${esc(n.place)}</div></div>`; });
    return o; };
})();
