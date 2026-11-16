/* Build-must-fail print checks (the owner, 11/10/2026, 11/9 captions review ALSO: "MUST FIX BEFORE ANY MORE BOOKS": p51, p78, p92, p93,
   p101, p102, p108, p123, p130 got through the checks). Pure functions over the rendered page, driven by config (config/required-items.json
   and config/print-checks.json), so the sweeps and the live order pipeline call them the same way:
     PrintChecks.run(cfg, D) -> [{slot, kind, detail, level:'fail'}]     D = the piece's data (brochure-data), cfg = below
     PrintChecks.inventory() -> {pages:[{page, texts:{slot:text}, photos:[{src, slot, w, h}], headings:[...], event:{date, time, text}}]}
   cfg: {type: 'foldover'|'flyer-front'|'flyer-back'|'openhouse'|'openhouse-email'|'mailer-back'|'mailer-front'|..., required: {event, contact,
   returnAddress, photosFilled, captions, minPhotos}, th: {thresholds, see config/print-checks.json}}
   Kinds (all fail-level):
     required-missing   an item the piece type must carry is not drawn: open house date and time, a photo slot left empty or broken, fewer
                        photos than the design shows, a photo in a captioned row with no caption, the agent's contact card, the brokerage's
                        return address on a mailer back
     photo-squeezed     a photo drawn as a sliver, cropped far past its own shape, stretched, or covering a small part of its slot (p92)
     heading-empty      a heading with nothing under it: a caption heading whose row-mates have write-ups (p101), a section heading with
                        empty space under it (p108 "Around Rice Military")
     distance-empty     a nearby place whose distance or drive time is empty or a vague word ("Minutes", "Nearby"; p123)
     text-clipped       letters cut off by a box that hides its overflow or by the page edge (p51, the "p" in "pizza oven")
     word-gap-wide      justified text whose word gaps run far wider than a normal space (p108 kitchen caption)
     last-line-under-80 a write-up, caption, intro or table row whose last line is under 80% full (owner 11/10)
     textbox-underfull  a text box or column whose text fills under 90% of it top to bottom (round 2 p32, p60, p116) */
(function(){
  const DEF = {sliverPx: 8, sliverFrac: .025, cropMax: 3.2, stretchMax: 1.12, containMin: .45, slotCoverMin: .4, photoMinNatural: 300, tallMax: 1.8, wideMax: 4.2, fillMin: .9, fillMinLines: 3, lastMin: .8,
               headingGapLines: 3, headingGapFrac: .045, gapRatio: 3.5, gapEm: .75, clipTolPx: 1.25, clipTolEm: .05};
  // a nearby place's distance with no number (owner 11/9 p123, 11/10 round 2 p35, p50, p65, p74, p121): "Minutes", "minutes away", "Close", "Short drive"
  const VAGUE = /^(just |only )?(a )?(few |couple of )?(minutes?|mins?|moments?|steps|nearby|near|close( ?by| to home)?|(a )?short (drive|walk|ride|trip|hop)|on site|around the corner|walkable|walking distance|next door|down the (street|road)|a stroll)( away| by car| on foot| drive| walk)?$/i;
  const LOGOISH = /logo|broker|brand|headshot|agent\.|qr|icon|badge|seal|eho|realtor|mls|plan/i;
  const vis = el => { if(!el || !el.getBoundingClientRect) return false; const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > .02; };
  const slotOf = el => { const s = el && el.closest && el.closest('[data-slot]'); return s ? s.dataset.slot : ''; };
  const words = t => String(t || '').trim().split(/\s+/).filter(Boolean);
  const pages = () => { const ps = [...document.querySelectorAll('.page, [data-page]')].filter(p => !p.parentElement.closest('.page, [data-page]'));
    return ps.length ? ps : [document.body]; };
  const R = el => { const r = el.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height}; };
  const pageOf = (el, ps) => ps.find(p => p.contains(el)) || ps[0];
  const pid = p => (p.dataset && p.dataset.page) || 'page';
  const add = (out, slot, kind, detail) => out.push({slot, kind, detail, level: 'fail'});

  // ---------- photos ----------
  function isPhoto(img, D){
    if(img.tagName !== 'IMG' || !vis(img)) return false;
    const src = img.getAttribute('src') || '', slot = slotOf(img) + ' ' + img.className + ' ' + (img.parentElement ? img.parentElement.className : '');
    const file = src.split('?')[0].split('/').slice(-2).join('/');   // the photo's own folder and name (an output folder may say "plan")
    if(/\.svg(\?|$)|^data:image\/svg/i.test(src) || /(^|\/)plans?\/|(^|\/)[^/]*plan[-_][^/]*$/i.test(file) || img.hasAttribute('data-plan')) return false;
    if(LOGOISH.test(slot) && !/photo|hero|room/i.test(slotOf(img))) return false;
    const b = (D && D.brand) || {}, A = (D && D.agent) || {};
    const same = u => u && src && (src === u || src.endsWith(String(u).replace(/^.*\//, '')));
    if([b.logo, b.logoOnDark, b.logoKnockout, A.headshot, A.qr].some(same)) return false;
    if(img.complete && img.naturalWidth && Math.max(img.naturalWidth, img.naturalHeight) < DEF.photoMinNatural) return false;
    return true;
  }
  const photos = D => [...document.querySelectorAll('img')].filter(i => isPhoto(i, D));

  function squeezed(D, th){
    const out = [], ps = pages();
    for(const img of photos(D)){
      const P = R(pageOf(img, ps)), r = R(img), s = getComputedStyle(img), nw = img.naturalWidth, nh = img.naturalHeight, slot = slotOf(img) || (img.getAttribute('src') || '').replace(/^.*\//, '');
      const where = `${pid(pageOf(img, ps))}:${slot}`, side = Math.min(P.w, P.h);
      if(!nw || !nh) continue;   // an empty or broken photo is required-missing
      if(Math.min(r.w, r.h) < Math.max(th.sliverPx, side*th.sliverFrac) && Math.max(r.w, r.h) > side*.08){
        add(out, where, 'photo-squeezed', `photo drawn as a sliver (${Math.round(r.w)} x ${Math.round(r.h)} px)`); continue; }
      // a tall, skinny or very wide slot (owner 11/10 round 2 p117: bath photos squeezed into tall strips showing a towel and a mirror)
      if(r.h/r.w > th.tallMax && nh/nw < th.tallMax*.8){ add(out, where, 'photo-squeezed', `photo slot is tall and skinny (${Math.round(r.w)} x ${Math.round(r.h)} px, ${(r.h/r.w).toFixed(1)}:1 tall) for a ${nw > nh ? 'landscape' : 'square'} photo`); continue; }
      if(r.w/r.h > th.wideMax && nw/nh < th.wideMax*.8){ add(out, where, 'photo-squeezed', `photo slot is a thin strip (${Math.round(r.w)} x ${Math.round(r.h)} px, ${(r.w/r.h).toFixed(1)}:1)`); continue; }
      const ratio = (r.w/r.h)/(nw/nh), fit = s.objectFit || 'fill';
      if(/cover|none/.test(fit) && (ratio > th.cropMax || ratio < 1/th.cropMax)){
        add(out, where, 'photo-squeezed', `photo cropped to ${ratio > 1 ? (r.w/r.h).toFixed(1) + ':1' : '1:' + (r.h/r.w).toFixed(1)} from its own ${(nw/nh).toFixed(2)}:1 (${ratio > 1 ? ratio.toFixed(1) : (1/ratio).toFixed(1)}x past its shape)`); continue; }
      if(fit === 'fill' && (ratio > th.stretchMax || ratio < 1/th.stretchMax)){
        add(out, where, 'photo-squeezed', `photo stretched ${Math.round(Math.abs(ratio - 1)*100)}% out of shape (object-fit fill)`); continue; }
      if(/contain|scale-down/.test(fit)){ const k = Math.min(r.w/nw, r.h/nh, fit === 'scale-down' ? 1 : 1e9), a = (nw*k*nh*k)/(r.w*r.h);
        if(a < th.containMin){ add(out, where, 'photo-squeezed', `photo fills ${Math.round(a*100)}% of its box (object-fit ${fit})`); continue; } }
      // the slot around it: the nearest box that holds only this photo (and no text), larger than the photo
      let slotEl = null;
      for(let p = img.parentElement, i = 0; p && i < 3 && p !== pageOf(img, ps); p = p.parentElement, i++){
        if(p.children.length > 2 || (p.innerText || '').trim()) break;
        const q = R(p); if(q.w*q.h > r.w*r.h*1.05){ slotEl = p; break; } }
      if(slotEl){ const q = R(slotEl), cov = (r.w*r.h)/(q.w*q.h);
        if(cov < th.slotCoverMin && q.w*q.h > P.w*P.h*.015) add(out, where, 'photo-squeezed', `photo covers ${Math.round(cov*100)}% of its slot (${Math.round(r.w)} x ${Math.round(r.h)} in ${Math.round(q.w)} x ${Math.round(q.h)} px)`); }
    }
    return out;
  }

  // ---------- text geometry ----------
  // every visible text line on the page: {l,t,r,b,el,text,words}
  function lines(root){
    const out = [], tw = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    for(let n = tw.nextNode(); n; n = tw.nextNode()){
      const e = n.parentElement; if(!n.textContent.trim() || !e || /^(SCRIPT|STYLE|TEMPLATE)$/.test(e.tagName) || !vis(e)) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      const rs = [...rg.getClientRects()].filter(q => q.width > .5 && q.height > .5);
      for(const q of rs) out.push({l: q.left, t: q.top, r: q.right, b: q.bottom, el: e, text: rs.length === 1 ? n.textContent.trim() : null, n});
    }
    return out;
  }
  const overlapX = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l));

  // photos in rows (same top, similar height, side by side): what text sits under each one, before the next photo or box
  function rows(D, all){
    const ph = photos(D).map(el => Object.assign(R(el), {el})), out = [];
    for(const p of ph){
      const mates = ph.filter(q => q !== p && Math.abs(q.t - p.t) < 4 && Math.abs(q.h - p.h) < p.h*.15 && (q.l >= p.r - 2 || q.r <= p.l + 2));
      if(!mates.length) continue;
      // the caption search ends at the next photo below, about a photo's height down, and the bottom of the photo's own panel: text
      // on the next panel (House 360 inside top: the next panel's headline 55 pt under the Beverage Station photo) is never a caption
      const panel = p.el.closest('[data-page], .panel, .page'), pb = panel ? R(panel).b : Infinity;
      const stop = Math.min(...ph.filter(q => q !== p && q.t > p.b - 2 && overlapX(q, p) > p.w*.3).map(q => q.t), p.b + Math.max(p.h*.9, 160), pb);
      // nor is the agent card, the brokerage lines or the fine print under a bottom-row photo (the Open House email's card)
      const notCap = L => /^(agent|broker|contact|cc|fine)/i.test(slotOf(L.el)) || !!L.el.closest('.cc, .cc-panel, [data-contactcard]');
      const under = all.filter(L => L.t >= p.b - 2 && L.b <= stop + 2 && !notCap(L) && (!panel || panel.contains(L.el)) && overlapX(L, p) > Math.min(L.r - L.l, p.w)*.5);
      // the first block under the photo: stop at the first vertical gap bigger than two line heights
      under.sort((a, b) => a.t - b.t); const blk = []; let y = p.b;
      for(const L of under){ if(L.t - y > Math.max(2.2*(L.b - L.t), 14) && blk.length) break; if(!blk.length && L.t - p.b > Math.max(3*(L.b - L.t), 30)) break; blk.push(L); y = Math.max(y, L.b); }
      const els = [...new Set(blk.map(L => L.el))], txt = els.map(e => e.textContent.trim()).join(' ');
      const nLines = new Set(blk.map(L => Math.round(L.t))).size;
      out.push({p, mates, els, text: txt, nLines, words: words(txt).length});
    }
    return out;
  }
  const isHeadEl = el => { const s = el.dataset && el.dataset.slot || slotOf(el); return /(^|\.)(h|t|s|head|heading|title|name|label|size)\d*$/i.test(s); };

  // ---------- required items ----------
  const MONTHS = 'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec';
  const DATE_RX = new RegExp(`\\b(${MONTHS})\\.?\\s+\\d{1,2}\\b|\\b\\d{1,2}\\s+(${MONTHS})\\b|\\b\\d{1,2}/\\d{1,2}\\b`, 'i');
  const TIME_RX = /\b\d{1,2}(:\d{2})?\s*(a\.?m\.?|p\.?m\.?|noon)\b|\b\d{1,2}(:\d{2})?\s*(to|–|—|-)\s*\d{1,2}(:\d{2})?\b|\bnoon\b/i;
  const digits = s => String(s || '').replace(/\D/g, '');
  const STREET = /\b\d{2,6}\s+([A-Z0-9][\w.'-]*\s+){0,4}(st|street|blvd|boulevard|ave|avenue|rd|road|dr|drive|ln|lane|way|ct|court|pkwy|parkway|hwy|highway|pl|place|trl|trail|cir|circle|fwy|freeway|loop|row|sq|square|ter|terrace|suite|ste)\b\.?/i;
  function pageText(root){ return (root.innerText || root.textContent || '').replace(/\s+/g, ' '); }
  function eventIn(root){
    const q = s => [...root.querySelectorAll(`[data-slot="${s}"]`)].filter(vis).map(e => e.textContent.trim()).filter(Boolean).join(' ');
    const t = pageText(root), ds = q('oh.date') || q('oh.day') || q('oh.weekday'), ts = q('oh.time');
    return {date: !!(ds && /\d/.test(ds + q('oh.day'))) || DATE_RX.test(t), time: !!(ts && /\d|noon/i.test(ts)) || TIME_RX.test(t), text: [q('oh.weekday'), ds, ts].filter(Boolean).join(' / ')};
  }
  function required(cfg, D, all){
    const out = [], need = cfg.required || {}, root = document.querySelector('.page') ? document.body : document.body, t = pageText(root);
    if(need.event){ const e = eventIn(root);
      if(!e.date) add(out, 'oh.date', 'required-missing', 'the open house date is not on the piece');
      if(!e.time) add(out, 'oh.time', 'required-missing', 'the open house time is not on the piece'); }
    if(need.contact){ const A = D.agent || {}, nm = String(A.name || '').trim(), ph = digits(A.phone);
      const miss = []; if(nm && !t.toLowerCase().includes(nm.toLowerCase())) miss.push('agent name'); if(ph.length >= 7 && !digits(t).includes(ph)) miss.push('phone');
      if(miss.length) add(out, 'contact', 'required-missing', `the contact card is missing (${miss.join(', ')})`); }
    if(need.returnAddress){ const b = D.brand || {}, ra = [].concat(b.returnAddress || b.address || []).flatMap(a => String(a).split('\n')).map(s => s.trim()).filter(Boolean);
      const L = String((D.listing || {}).address || '').toLowerCase(), squash = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const ok = ra.length ? ra.every(line => squash(t).includes(squash(line))) : t.split(/(?<=\d{5})/).some(seg => { const m = seg.match(STREET); return m && !(L && squash(m[0]).startsWith(squash(L).slice(0, 8))); });
      if(!ok) add(out, 'return', 'required-missing', ra.length ? `the brokerage's return address ("${ra.join(', ')}") is not on the mailer back` : 'no brokerage return address on the mailer back'); }
    if(need.photosFilled !== false){
      for(const img of document.querySelectorAll('img')){ if(!vis(img)) continue; const r = R(img), P = R(pageOf(img, pages()));
        const src = img.getAttribute('src') || '', s = slotOf(img);
        if(LOGOISH.test(s + ' ' + img.className) && !/photo|hero|room/i.test(s)) continue;
        if(r.w*r.h > P.w*P.h*.01 && (!src || (img.complete && !img.naturalWidth))) add(out, s || 'photo', 'required-missing', `a photo slot is empty or its photo did not load (${Math.round(r.w)} x ${Math.round(r.h)} px)`); }
      for(const el of document.querySelectorAll('[data-slot], [data-photo], [data-slot-photo]')){ const s = el.dataset.slot || ('photo ' + (el.dataset.photo || el.dataset.slotPhoto || '')).trim();
        if(!(el.hasAttribute('data-photo') || el.hasAttribute('data-slot-photo') || /(^|\.)(photo|hero|img|image|pic)\d*$/i.test(el.dataset.slot || '')) || !vis(el)) continue;
        const r = R(el), P = R(pageOf(el, pages())); if(r.w*r.h < P.w*P.h*.01 || el.tagName === 'IMG') continue;
        const has = el.querySelector('img, svg, canvas, video') || /url\(/.test(getComputedStyle(el).backgroundImage) || (el.textContent || '').trim();
        if(!has) add(out, s, 'required-missing', 'a photo slot is empty'); }
    }
    if(need.minPhotos){ const n = photos(D).length; if(n < need.minPhotos) add(out, 'photos', 'required-missing', `${n} photo(s) on the piece; this design shows ${need.minPhotos}`); }
    if(need.captions){
      // a photo in a row whose row-mates carry a write-up must carry one too (owner 11/9 rule 6: every photo gets a caption)
      for(const x of rows(D, all)){
        const mateCap = x.mates.some(m => { const y = rows.cache.get(m.el); return y && y.words >= 6; });
        if(mateCap && x.words === 0) add(out, slotOf(x.p.el) || (x.p.el.getAttribute('src') || '').replace(/^.*\//, ''), 'required-missing', 'a photo with no caption under it, beside photos that have one');
      }
    }
    return out;
  }

  // ---------- headings ----------
  const SKIP_HEAD = /^(agent|broker|contact|cc|fine|legal|disc|oh)\b|fact|stat|address|^place$|\.place$|price|kicker|eyebrow|footer|logo|plan|level|qr|cta|tag|badge|pill|chip|num|count|page/i;
  function headingLike(el, body){
    const s = el.dataset.slot || '', t = el.textContent.trim(), w = words(t).length, cs = getComputedStyle(el);
    if(!t || w > 7 || /[.!?;,]$/.test(t) || SKIP_HEAD.test(s) || el.querySelector('[data-slot] [data-slot]')) return false;
    if(/(^|\.)(h|head|heading|title|placesTitle|noteTitle|sect|section|subhead)\d*$/i.test(s) || /Title$|Head$/.test(s)) return true;
    return /^H[1-6]$/.test(el.tagName) || (/sect|head|title/i.test(String(el.className)) && !/sub/i.test(String(el.className)));
  }
  function headings(cfg, D, all, P0){
    const out = [], th = cfg.th, ps = pages(), done = new Set();
    // caption headings: under a photo, row-mates have a write-up under their heading, this one has only the heading
    for(const x of rows(D, all)){
      const mateCap = x.mates.some(m => { const y = rows.cache.get(m.el); return y && y.words >= 6 && y.nLines >= 2; });
      if(mateCap && x.words > 0 && x.words < 6 && x.nLines <= 1){ const s = x.els.map(e => slotOf(e)).find(Boolean) || 'caption';
        done.add(s); add(out, s, 'heading-empty', `"${x.text.slice(0, 40)}" heads a photo with no caption under it, beside photos that have one`); }
    }
    // section headings: nothing under them before the next thing drawn or the page edge
    const drawn = all.concat([...document.querySelectorAll('img, svg, canvas')].filter(vis).map(e => Object.assign(R(e), {el: e, box: 1})));
    for(const el of document.querySelectorAll('[data-slot]')){
      if(!vis(el) || done.has(el.dataset.slot) || el.querySelector('[data-slot]') || !headingLike(el)) continue;
      const h = R(el), P = R(pageOf(el, ps)), lh = Math.max(h.h, parseFloat(getComputedStyle(el).fontSize) || 10);
      if(drawn.some(o => o.box && o.b <= h.t + 2 && h.t - o.b < lh*1.5 && overlapX(o, h) > h.w*.5)) continue;   // under a photo: the row rule above handles it
      const below = drawn.filter(o => !el.contains(o.el) && o.t >= h.b - 1 && overlapX(o, h) > Math.min(o.r - o.l, h.w)*.3 && o.t < P.b);
      const next = below.length ? Math.min(...below.map(o => o.t)) : P.b - P.h*.04;
      const gap = next - h.b;
      if(gap > Math.max(th.headingGapLines*lh, P.h*th.headingGapFrac)) add(out, el.dataset.slot, 'heading-empty', `"${el.textContent.trim().slice(0, 40)}" has ${Math.round(gap)} px of nothing under it`);
    }
    return out;
  }

  // ---------- nearby distances ----------
  function distances(){
    const out = [];
    for(const el of document.querySelectorAll('[data-slot]')){
      if(!vis(el) || el.querySelector('[data-slot]')) continue;
      const s = el.dataset.slot, t = el.textContent.trim().replace(/[.·•:]+$/, '');
      if(/(^|\.)(h|t|head|heading|title|label|kicker|eyebrow)\d*$|head$|title$/i.test(s)) continue;   // a section heading ("Close by"), not a distance
      if(/^oh\.|time$/i.test(s) && !/near|place|poi|spot/i.test(s)) continue;
      const distSlot = /(near|place|poi|spot|around|local)s?\d*\.(dist|distance|drive|mins?|miles?|time|far|away|d)$/i.test(s);
      if(VAGUE.test(t) || (distSlot && !/\d/.test(t) && !/^(walk|walking|next door|in the neighborhood)$/i.test(t)))
        add(out, s, 'distance-empty', t ? `a nearby place shows "${t}" instead of a distance or drive time` : 'a nearby place has no distance or drive time');
    }
    // the same words in lists without slots (a "Near the house" list set as plain text)
    const said = new Set(out.map(o => o.slot));
    for(const el of document.querySelectorAll('.page *, body > *')){
      if(el.dataset && el.dataset.slot || !vis(el) || /^(SCRIPT|STYLE)$/.test(el.tagName)) continue;
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').trim().replace(/[.·•:]+$/, '');
      if(!own || !VAGUE.test(own)) continue;
      const s = slotOf(el) || (el.className ? String(el.className).split(' ')[0] : el.tagName.toLowerCase());
      if(/(^|\.)(h|t|head|heading|title|label|kicker|eyebrow)\d*$|head$|title$/i.test(s) || said.has(s + ':' + own)) continue;
      said.add(s + ':' + own); add(out, s, 'distance-empty', `a nearby place shows "${own}" instead of a distance or drive time`);
    }
    return out;
  }

  // ---------- clipped letters ----------
  const ctx = document.createElement('canvas').getContext('2d');
  function inkBoxes(n){
    const e = n.parentElement, cs = getComputedStyle(e), tt = cs.textTransform, fs = parseFloat(cs.fontSize) || 10;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const raw = n.textContent, tx = s => tt === 'uppercase' ? s.toUpperCase() : tt === 'lowercase' ? s.toLowerCase() : s;
    // group characters into lines by their own rectangles
    const rg = document.createRange(), L = [];
    for(let i = 0; i < raw.length; i++){ if(/\s/.test(raw[i])) continue; rg.setStart(n, i); rg.setEnd(n, i + 1);
      const q = rg.getBoundingClientRect(); if(q.width < .1 && q.height < .1) continue;
      let line = L.find(x => Math.abs(x.t - q.top) < q.height*.5);
      if(!line){ line = {t: q.top, b: q.bottom, l: q.left, r: q.right, s: ''}; L.push(line); }
      line.l = Math.min(line.l, q.left); line.r = Math.max(line.r, q.right); line.b = Math.max(line.b, q.bottom); line.s += raw[i]; }
    return L.map(x => { const m = ctx.measureText(tx(x.s)), fa = m.fontBoundingBoxAscent, fd = m.fontBoundingBoxDescent, k = (x.b - x.t)/((fa + fd) || 1);
      const base = x.t + fa*k; return {t: base - m.actualBoundingBoxAscent, b: base + m.actualBoundingBoxDescent, l: x.l, r: x.r, s: x.s, fs}; });
  }
  function clipped(cfg){
    const out = [], th = cfg.th, seen = new Set(), tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for(let n = tw.nextNode(); n; n = tw.nextNode()){
      const e = n.parentElement; if(!n.textContent.trim() || !e || /^(SCRIPT|STYLE|TEMPLATE)$/.test(e.tagName) || !vis(e)) continue;
      const clips = [];
      for(let a = e; a && a !== document.documentElement; a = a.parentElement){ const s = getComputedStyle(a);
        const pg = a.matches('.page, [data-page]');
        if(pg || s.overflowX !== 'visible' || s.overflowY !== 'visible'){ const r = a.getBoundingClientRect();
          clips.push({a, x: pg || s.overflowX !== 'visible', y: pg || s.overflowY !== 'visible', l: r.left + a.clientLeft, t: r.top + a.clientTop, r: r.left + a.clientLeft + (a.clientWidth || r.width), b: r.top + a.clientTop + (a.clientHeight || r.height)}); }
        if(pg) break; }
      if(!clips.length) continue;
      for(const k of inkBoxes(n)){
        const tol = Math.max(th.clipTolPx, k.fs*th.clipTolEm);
        for(const c of clips){
          const inY = k.b > c.t && k.t < c.b, inX = k.r > c.l && k.l < c.r; if(!inY || !inX) continue;   // fully outside: the overflow check's
          const cut = [c.y && k.b - c.b > tol ? `bottom ${(k.b - c.b).toFixed(1)}` : '', c.y && c.t - k.t > tol ? `top ${(c.t - k.t).toFixed(1)}` : '',
                       c.x && k.r - c.r > tol ? `right ${(k.r - c.r).toFixed(1)}` : '', c.x && c.l - k.l > tol ? `left ${(c.l - k.l).toFixed(1)}` : ''].filter(Boolean);
          if(cut.length){ const s = slotOf(e) || e.tagName.toLowerCase(), key = s + '|' + k.s;
            if(!seen.has(key)){ seen.add(key); add(out, s, 'text-clipped', `"${k.s.slice(0, 30)}" is cut off (${cut.join(', ')} px past the edge of ${c.a.matches('.page, [data-page]') ? 'the page' : 'its box'})`); }
            break; }
        }
      }
    }
    return out;
  }

  // ---------- justified word gaps ----------
  // every justified text block's widest word gap: [{el, slot, ratio, worst, fs}]
  function gapList(){
    const res = [];
    for(const el of document.querySelectorAll('[data-slot], p')){
      if(!vis(el) || el.querySelector('[data-slot]')) continue;
      const cs = getComputedStyle(el); if(!/justify/.test(cs.textAlign) || words(el.textContent).length < 6) continue;
      const fs = parseFloat(cs.fontSize) || 10; ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
      const normal = ctx.measureText(' ').width + (parseFloat(cs.wordSpacing) || 0) + (parseFloat(cs.letterSpacing) || 0);
      const gaps = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), rg = document.createRange();
      for(let n = tw.nextNode(); n; n = tw.nextNode()){ const s = n.textContent;
        for(let i = 0; i < s.length; i++){ if(s[i] !== ' ') continue; rg.setStart(n, i); rg.setEnd(n, i + 1); const q = rg.getBoundingClientRect(); if(q.width > 0) gaps.push({t: Math.round(q.top), w: q.width}); } }
      if(!gaps.length) continue;
      const byLine = {}; gaps.forEach(g => (byLine[g.t] = byLine[g.t] || []).push(g.w));
      const keys = Object.keys(byLine).map(Number).sort((a, b) => a - b).slice(0, -1);   // the last line is set ragged
      let worst = 0; for(const k of keys){ const m = Math.max(...byLine[k]); worst = Math.max(worst, m); }
      if(worst) res.push({el, slot: el.dataset.slot || 'p', ratio: worst/normal, worst, normal, fs});
    }
    return res;
  }
  function wordGaps(cfg){
    const out = [], th = cfg.th;
    for(const g of gapList())
      if(g.ratio > th.gapRatio && g.worst - g.normal > g.fs*th.gapEm) add(out, g.slot, 'word-gap-wide', `justified word gaps up to ${g.ratio.toFixed(1)}x a normal space (${Math.round(g.worst)} px at ${Math.round(g.fs)} px type): add true detail or bigger type, never spread words`);
    return out;
  }

  // ---------- text boxes under 90% full (owner 11/10 round 2 MUST-DO 1: blank space is checked per text box, not per page) ----------
  // A box that holds only text (no photo, plan or drawing inside), at least fillMinLines lines tall, with a set height (taller than its own
  // text): the text, first line top to last line bottom, must fill fillMin (90%) of the box's content height. Boxes sized to their text pass
  // by themselves; titles and single-line labels are skipped. A caption box made as tall as its row-mate's longer caption counts (p32).
  // name, label and size slots (a nearby place's name, a map index label, a room-size column) are not write-ups: never measured as one
  const NOT_WRITEUP = /(^|\.)(near|index|places?|poi|rooms?\d*\.size)|(\.|^)(p|name|label|size|sz|dims?|dist|d|t|h|title|head|kicker|num|n)\d*$/i;
  const lead = L => { const st = getComputedStyle(L.el), fs = parseFloat(st.fontSize) || 10, lh = parseFloat(st.lineHeight) || fs*1.2, h = L.b - L.t, k = Math.max(0, (lh - h)/2);
    return Object.assign({}, L, {t: L.t - k, b: L.b + k, lh: Math.max(lh, h)}); };
  function underfull(cfg){
    const out = [], th = cfg.th, ps = pages(), seen = new Set();
    const boxes = new Set();
    for(const el of document.querySelectorAll('[data-slot]')){ if(!vis(el) || el.querySelector('[data-slot]')) continue;
      if(/fine|legal|disc|footer/i.test(el.dataset.slot) || NOT_WRITEUP.test(el.dataset.slot) || (SKIP_HEAD.test(el.dataset.slot) && !/caption|cap|\.a$|\.text$|intro|about|note|body|desc/i.test(el.dataset.slot))) continue;
      boxes.add(el); const p = el.parentElement; if(p && !p.matches('.page, [data-page]')) boxes.add(p); }
    for(const b of boxes){
      if(!vis(b) || b.querySelector('img, svg, canvas, video') || /url\(/.test(getComputedStyle(b).backgroundImage)) continue;
      const P = R(pageOf(b, ps)), r = R(b), cs = getComputedStyle(b);
      if(r.w*r.h > P.w*P.h*.4 || r.w < P.w*.12) continue;
      const pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0, bt = parseFloat(cs.borderTopWidth) || 0, bb = parseFloat(cs.borderBottomWidth) || 0;
      const top = r.t + bt + pt, bot = r.b - bb - pb, H = bot - top; if(H <= 0) continue;
      const ls = lines(b).filter(L => L.b > top - 1 && L.t < bot + 1).map(lead); if(!ls.length) continue;
      const nLines = new Set(ls.map(L => Math.round(L.t))).size, lh = Math.max(...ls.map(L => L.lh));
      if(nLines < 2 || H < th.fillMinLines*lh) continue;   // a title or a one-line label
      if(Math.min(...ls.map(L => parseFloat(getComputedStyle(L.el).fontSize) || 10)) >= 20) continue;   // a headline set in its own block
      if(ls.some(L => headingLike(L.el)) && nLines < 3) continue;
      // a drawn ornament at the top of the box (a dot and rule set in a ::before/::after) is part of what fills it, like the text
      let tOrn = Infinity;
      for(const e of [b, ...b.querySelectorAll('*')]) for(const ps of ['::before', '::after']){ const q = getComputedStyle(e, ps);
        if(q.content === 'none' || q.position !== 'absolute' || !/^-?[\d.]+px$/.test(q.top) || !(parseFloat(q.width) > 0 && parseFloat(q.height) > 0)) continue;
        if(/rgba\(0, 0, 0, 0\)|transparent/.test(q.backgroundColor) && !parseFloat(q.borderTopWidth)) continue;
        tOrn = Math.min(tOrn, R(e).t + parseFloat(q.top)); }
      const t0 = Math.min(tOrn, ...ls.map(L => L.t)), t1 = Math.max(...ls.map(L => L.b)), fill = (t1 - t0)/H;
      if(fill >= th.fillMin || H - (t1 - t0) < .75*lh) continue;   // under 90% and at least most of a line empty
      const s = b.dataset.slot || slotOf(b.querySelector('[data-slot]')) || String(b.className).split(' ')[0] || 'text';
      if(seen.has(s)) continue; seen.add(s);
      add(out, s, 'textbox-underfull', `text fills ${Math.round(fill*100)}% of its box top to bottom (${Math.round(t1 - t0)} of ${Math.round(H)} px; ${Math.round(th.fillMin*100)}% minimum): add true detail or bigger type`);
    }
    // the space a caption under a photo has: from the photo down to the next thing drawn below it (a rule, a box, text, a photo) or the
    // page margin; the caption must fill fillMin of it (round 2 p32: "Gas Range" two lines over a gap made for four)
    const D = cfg.D || {}, all = lines(), painted = [...document.querySelectorAll('.page *')].filter(e => { if(!vis(e)) return false; const st = getComputedStyle(e);
      return /url\(/.test(st.backgroundImage) || !/rgba\(0, 0, 0, 0\)|transparent/.test(st.backgroundColor) || parseFloat(st.borderTopWidth) > 0 || parseFloat(st.borderBottomWidth) > 0 || /^(IMG|SVG|CANVAS)$/i.test(e.tagName); }).map(e => Object.assign(R(e), {el: e}));
    for(const x of rows(D, all)){
      if(!x.els.length || x.nLines < 1) continue;
      // only a caption or write-up: not the agent card, facts, a headline slab, an address or the event under a photo
      if(x.els.some(e => /^(agent|broker|contact|cc|oh\.(date|time|label|weekday))|fine|legal|stat|fact|slab|address|place$|listing\.body|^email|kicker|cta|call/i.test(slotOf(e)))) continue;
      const wr = x.els.filter(e => slotOf(e) && !NOT_WRITEUP.test(slotOf(e)));   // text with no slot (the "miles" unit in the nearby bar under a bottom row) is never a caption if(!wr.length) continue;   // only names, labels or sizes under it
      // the write-up alone is measured; a name, label or size column under it counts as the next thing below
      const P = R(pageOf(x.p.el, ps)), p = x.p, mine = L => wr.some(e => e === L.el || e.contains(L.el));
      const ls = all.filter(mine).map(lead); if(!ls.length) continue;
      const tb = Math.max(...ls.map(L => L.b)), lh = Math.min(...ls.map(L => L.lh)), tr = Math.max(...all.filter(mine).map(L => L.b));   // tr: the ink's own bottom (tb adds half-leading, which can pass a bar set close under the text and drop it from "below")   // the body text's line, not the heading's
      const below = all.filter(L => !mine(L) && L.t >= tr - 1 && overlapX(L, p) > Math.min(L.r - L.l, p.w)*.3).map(L => L.t)
        .concat(painted.filter(o => !wr.some(e => e.contains(o.el) || o.el.contains(e)) && o.el !== p.el && o.t >= tr - 1 && o.h < P.h*.9 && overlapX(o, p) > p.w*.3).map(o => o.t));
      const next = Math.min(P.b - P.h*.04, ...below), H = next - p.b, used = tb - p.b;
      if(H < th.fillMinLines*lh || used/H >= th.fillMin || next - tb < 1.25*lh) continue;   // a normal line of space before the next thing is fine
      const s = wr.map(e => slotOf(e)).filter(Boolean).pop() || 'caption';
      if(seen.has(s)) continue; seen.add(s);
      add(out, s, 'textbox-underfull', `the caption under this photo fills ${Math.round(used/H*100)}% of its space (${Math.round(used)} of ${Math.round(H)} px down to the next thing below; ${Math.round(th.fillMin*100)}% minimum): add true detail or bigger type`);
    }
    return out;
  }

  // ---------- last line under 80% (owner 11/10/2026: "no last line under 80% anywhere") ----------
  // Write-ups, captions, intros and table rows that wrap to 2+ lines: the last line reaches lastMin (80%) of the box's width (of the
  // longest line, for centered text set narrower than its box). Not headings, titles, names, labels, sizes, fine print, addresses,
  // the contact card, the event, facts, or a bullet that is one short fact.
  // fixed-format lines are never write-ups: return address and other addresses, city lines, phone and web lines, dates and times,
  // legal fine print, calls to action ("Call or text me anytime.")
  const LL_SKIP = /^(agent|broker|contact|cc|oh)\.|(^|\.)return|mail|fine|legal|disc|footer|address|addr|street|city|zip|^place$|\.place$|phone|tel|web|url|email|date|time|when|hours|fact|stat|kicker|eyebrow|cta|call|ask|reach|slab\.(big|sub)|price|logo|qr|pill|chip|tag\d*$/i;
  const FIXED = /^(call|text|email|reach|contact|ask|visit|scan|see it|open house|saturday|sunday|monday|tuesday|wednesday|thursday|friday)\b|\b\d{3}[.\s-]\d{3}[.\s-]\d{4}\b|\b[A-Z]{2}\s+\d{5}\b|\.com\b|@/i;
  function lastLines(cfg){
    const out = [], min = cfg.th.lastMin || .8;
    // a caption: text that starts just under a photo (within about two lines, a name line between) and sits over it; captions keep the
    // 80% caption rule, everything else that runs 3+ lines is a write-up held to 90% (lead 11/13)
    const phs = photos(cfg.D || {}).map(el => R(el));
    const CAP_SLOT = /^cap\.|(^|\.)(cap\w*|caption\w*|photo\d*|a)(\.(a|b|text|body))?$|\.(s|side|g\d+\.cap)\d+\.text$|\.feature\d+\.body$/i;
    const isCap = el => { const r = R(el); if(CAP_SLOT.test(el.dataset.slot || '')) return true;
      return phs.some(p => (r.t >= p.b - 2 && r.t - p.b < 60 && overlapX(r, p) > Math.min(r.w, p.w)*.5)   // under a photo
        || ((r.l >= p.r - 2 && r.l - p.r < 40 || p.l >= r.r - 2 && p.l - r.r < 40) && Math.min(r.b, p.b) - Math.max(r.t, p.t) > r.h*.5)); };   // beside one (a strip)
    for(const el of document.querySelectorAll('[data-slot]')){
      const slot = el.dataset.slot || '';
      if(!vis(el) || el.querySelector('[data-slot]') || LL_SKIP.test(slot) || NOT_WRITEUP.test(slot) || el.closest('.cc, [data-small], [data-fine]') || headingLike(el)) continue;
      const t = (el.textContent || '').trim(), nw = words(t).length;
      if(nw < 6 || (/(bullet|item|li|point|feat)\d*$/i.test(slot) && nw < 10)) continue;   // a bullet that is one short fact
      if(FIXED.test(t) && nw < 14) continue;   // an address, phone or web line, a date, a short call to action
      const rg = document.createRange(); rg.selectNodeContents(el); const rows = [];
      for(const b of rg.getClientRects()){ if(b.width < .5) continue; const row = rows.find(x => Math.abs(x.top - b.top) < b.height*.5);
        if(row){ row.l = Math.min(row.l, b.left); row.r = Math.max(row.r, b.right); } else rows.push({top: b.top, l: b.left, r: b.right}); }
      if(rows.length < 2) continue;   // single-line text
      rows.sort((a, b) => a.top - b.top);
      const cs = getComputedStyle(el), box = el.getBoundingClientRect(), full = Math.max(box.width - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0), 1);
      const widest = Math.max(...rows.map(r => r.r - r.l)), ref = /center/.test(cs.textAlign) ? Math.min(full, widest) : full;
      const last = rows[rows.length - 1], k = (last.r - last.l)/ref;
      if(k < min - .005) add(out, slot, 'last-line-under-80', `last line is ${Math.round(k*100)}% full (${Math.round(min*100)}% minimum): "${t.split(/\s+/).slice(-4).join(' ')}"`);
      // a write-up (three lines or more) reaches 90% on its last line (owner 11/7 + 11/8); warn here, fail-level in the book gate
      // (scripts/check_book.py) so a review book never shows one
      else if(rows.length >= 3 && k < .9 - .005 && !isCap(el)) out.push({slot, kind: 'writeup-last-under-90', level: 'warn', detail: `write-up's last line is ${Math.round(k*100)}% full (90% minimum for a write-up): "${t.split(/\s+/).slice(-4).join(' ')}"`});
      else if(k < .9 - .005) out.push({slot, kind: 'caption-last-under-90', level: 'warn', detail: `caption's last line is ${Math.round(k*100)}% full (90% minimum; fails the review-book gate, scripts/check_book.py)`});
    }
    return out;
  }

  // ---------- inventory (for comparing an After with its Before) ----------
  function inventory(D){
    D = D || (() => { try { return JSON.parse(document.getElementById('brochure-data').textContent); } catch(e) { return {}; } })();
    return {pages: pages().map(p => {
      const texts = {}, heads = [];
      for(const el of p.querySelectorAll('[data-slot]')){ if(!vis(el) || el.querySelector('[data-slot]')) continue; const t = el.textContent.trim().replace(/\s+/g, ' ');
        if(t) texts[el.dataset.slot] = t; if(t && headingLike(el)) heads.push(t); }
      const ph = [...p.querySelectorAll('img')].filter(i => isPhoto(i, D)).map(i => { const r = R(i); return {src: (i.getAttribute('src') || '').replace(/^.*\//, ''), slot: slotOf(i), w: Math.round(r.w), h: Math.round(r.h)}; });
      const gaps = {}; for(const g of gapList()) if(p.contains(g.el)) gaps[g.slot] = Math.round(g.ratio*100)/100;
      return {page: pid(p), texts, photos: ph, headings: heads, event: eventIn(p), gaps}; })};
  }

  function run(cfg, D){
    cfg = cfg || {}; cfg.th = Object.assign({}, DEF, cfg.th || {});
    D = D || (() => { try { return JSON.parse(document.getElementById('brochure-data').textContent); } catch(e) { return {}; } })();
    const all = lines();
    rows.cache = new Map(rows(D, all).map(x => [x.p.el, x]));
    const out = [].concat(required(cfg, D, all), squeezed(D, cfg.th), headings(cfg, D, all), distances(), clipped(cfg), wordGaps(cfg), underfull(Object.assign({D}, cfg)), lastLines(Object.assign({D}, cfg)));
    const off = new Set(cfg.off || []);
    return out.filter(c => !off.has(c.kind));
  }
  window.PrintChecks = {run, inventory, photos, lines, DEF};
})();
