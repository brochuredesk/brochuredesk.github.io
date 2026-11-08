/* The Split Edition two-sided flyer: helpers (loads after setpieces.js). Lengths are pt.
     SF.beats / SF.feet     copy as sentences; room sizes in feet only (18' x 12'), inches dropped and never rounded
     SF.fit                 the most sentences (in order) that set in exactly n lines, last line at least 3/4 full
     SF.para                a paragraph box in its exact line count
     SF.plan                the listing's own plan placed at one scale (never redrawn); a quarter turn when that prints it a third larger
     SF.logo                the one brokerage logo of a side, true shape
     SF.offices             the brokerage office lines, level with the agent card's name and phone lines */
(function(){
  const SF = {}, esc = SP.esc, pt = SP.pt;
  SF.feet = t => String(t == null ? '' : t).replace(/(\d+)(?:\.\d+)?(?:'\s?\d+(?:\.\d+)?"?)?'?\s*x\s*(\d+)(?:\.\d+)?(?:'\s?\d+(?:\.\d+)?"?)?'?/g, "$1' x $2'");
  SF.beats = x => x == null ? [] : (Array.isArray(x) ? x : (SF.feet(x).match(/[^.!?]+[.!?]+["”’)]*|[^.!?]+$/g) || []).map(s => s.trim()).filter(Boolean)).map(SF.feet);

  // ---------- fitting a text to a box ----------
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:normal';
  document.body.appendChild(probe);
  SF.measure = (text, w, style) => {
    probe.style.cssText = `position:absolute;left:-9999pt;top:0;visibility:hidden;white-space:normal;width:${w}pt;${style}`;
    probe.textContent = text;
    const ls = SP.lineBoxes(probe); if(!ls.length) return {n: 0, fill: 0};
    const last = ls[ls.length - 1], bw = probe.getBoundingClientRect().width;
    return {n: ls.length, fill: (last.r - last.l)/bw};
  };
  // the subset of sentences (kept in order) that sets in exactly n lines with the last line >= minFill; the most sentences
  // win, then the fuller last line. Returns {text, n, fill, ok}.
  SF.fit = (beats, w, style, n, minFill) => {
    minFill = minFill || 0.76;
    const b = beats.slice(0, 11), k = b.length; let best = null;
    for(let m = 1; m < (1 << k); m++){
      const pick = []; for(let i = 0; i < k; i++) if(m & (1 << i)) pick.push(b[i]);
      const cnt = pick.length, txt = pick.join(' ');
      if(best && best.cnt > cnt) continue;                      // fewer sentences than the best so far
      const q = SF.measure(txt, w, style);
      if(q.n !== n || q.fill < minFill) continue;
      if(!best || cnt > best.cnt || (cnt === best.cnt && q.fill > best.fill)) best = {text: txt, n: q.n, fill: q.fill, cnt, ok: true};
    }
    if(best) return best;
    // no set fills the last line 3/4: the exact line count with the fullest last line (the page checks flag a short last line)
    let ex = null;
    for(let m = 1; m < (1 << k); m++){
      const pick = []; for(let i = 0; i < k; i++) if(m & (1 << i)) pick.push(b[i]);
      const q = SF.measure(pick.join(' '), w, style);
      if(q.n === n && (!ex || q.fill > ex.fill || (q.fill === ex.fill && pick.length > ex.cnt))) ex = {text: pick.join(' '), n, fill: q.fill, cnt: pick.length, ok: true, soft: true};
    }
    if(ex) return ex;
    let fb = null;
    for(let m = 1; m < (1 << k); m++){
      const pick = []; for(let i = 0; i < k; i++) if(m & (1 << i)) pick.push(b[i]);
      const q = SF.measure(pick.join(' '), w, style);
      if(q.n > n) continue;
      const sc = q.n*2 + q.fill;
      if(!fb || sc > fb.sc) fb = {text: pick.join(' '), n: q.n, fill: q.fill, sc, ok: false};
    }
    return fb || {text: b.join(' '), n, fill: 0, ok: false};
  };
  // the smallest line count (from the list) that every text can fill
  SF.common = (lists, w, style, ns) => { for(const n of ns){ if(lists.every(l => { const f = SF.fit(l, w, style, n); return f.ok && !f.soft; })) return n; } for(const n of ns){ if(lists.every(l => SF.fit(l, w, style, n).ok)) return n; } return null; };
  // the most lines (from high to low) a text can fill, within a cap
  SF.most = (beats, w, style, hi, lo) => { for(let n = hi; n >= (lo || 2); n--){ const f = SF.fit(beats, w, style, n); if(f.ok && !f.soft) return n; } for(let n = hi; n >= (lo || 2); n--){ if(SF.fit(beats, w, style, n).ok) return n; } return lo || 2; };
  SF.para = (slot, text, x, y, w, n, size, lh, extra, attrs) =>
    `<div class="abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${n*lh}pt;font-size:${size}pt;line-height:${lh}pt;color:var(--text);${extra || ''}" data-slot="${slot}" data-lines="${n}" ${attrs || 'data-para="1"'}>${esc(text)}</div>`;

  // ---------- the brokerage logo (the one per side) and the office lines ----------
  SF.logo = (D, x, y, w, h) => {
    const b = D.brand || {};
    return `<div class="logo abs" style="left:${x}pt;top:${y}pt;width:${w}pt;height:${h}pt;display:flex;align-items:center;justify-content:flex-end">${b.logo
      ? `<img src="${esc(b.logo)}" alt="" style="display:block;max-width:100%;max-height:100%;object-fit:contain">`
      : `<span class="text" style="font:700 ${h*0.6}pt/1 var(--font-display);white-space:nowrap">${esc(b.brokerage || '')}</span>`}</div>`;
  };
  // the card takes the left of the footer band; the office lines fill the right, set off by a hairline, level with the
  // card's name line (the office phone), its REALTOR line (the address, when the brand has one) and its phone line (the website)
  SF.footer = (D, X, y, w, h, OW, fine) => {
    const b = D.brand || {}, esc2 = SP.esc;
    const offL = [].concat(b.address || []).flatMap(a => String(a).split('\n')).map(x => x.trim()).filter(Boolean).slice(0, 2);
    let s = SP.card(D, [X, y, w - OW, h], {layout: 'panel', size: 'mid', brokerage: false, fine: '', s: SP.headshot(D) ? {inlineLabel: true, hsW: 64, hsGap: 14, name: 22, nameFloor: 17, phone: 16, label: 8, line: 9, stripeGap: 14} : {inlineLabel: true}});
    s += `<div class="abs" style="left:${X + w - OW}pt;top:${y}pt;width:1pt;height:${h}pt;background:var(--line)"></div>`;
    s += `<div id="offblk" class="abs" style="left:${X + w - OW + 16}pt;top:${y}pt;width:${OW - 16}pt;height:${h}pt;white-space:nowrap;color:var(--ink)">`
      + (b.phone ? `<div class="ol" data-at="name" data-slot="broker.phone" data-lines="1" style="font:400 13pt/16pt var(--font-body)">${esc2(b.officeLabel || 'Office')} <b style="font-weight:700">${esc2(b.phone)}</b></div>` : '')
      + offL.map(t => `<div class="ol" data-at="desig" data-slot="broker.address" data-lines="1" style="font:400 9pt/11pt var(--font-body)">${esc2(t)}</div>`).join('')
      + (b.web ? `<div class="ol" data-at="phone" data-slot="broker.web" data-lines="1" style="font:400 13pt/16pt var(--font-body)">${esc2(b.web)}</div>` : '') + `</div>`;
    // the fine print sits on its own line under the footer, never inside the card
    s += `<div class="abs" style="left:${X}pt;top:${y + h + 6}pt;width:${w}pt;height:8pt;font-size:6pt;line-height:8pt;color:var(--muted);white-space:nowrap;overflow:hidden" data-slot="fineprint" data-lines="1" data-fine="1">${esc2(fine)}</div>`;
    return s;
  };
  SF.alignOffices = () => {
    const blk = document.getElementById('offblk'), cc = document.querySelector('.cc[data-contactcard]'); if(!blk || !cc) return;
    const bb = blk.getBoundingClientRect(), rows = {name: '.cc-name', desig: '.cc-desig', phone: '.cc-phone'}; let lastBottom = null;
    blk.querySelectorAll('.ol').forEach(el => { const t = cc.querySelector(rows[el.dataset.at]); if(!t) return;
      const r = t.getBoundingClientRect(), mid = (r.top + r.bottom)/2 - bb.top;
      el.style.position = 'absolute'; el.style.left = '0'; el.style.top = ((mid - el.offsetHeight/2)*72/96) + 'pt'; });
    // the office phone sits on the name's line and the website on the phone line; the REALTOR line stays clear between them
    const ol = [...blk.querySelectorAll('.ol')].map(e => e.getBoundingClientRect());
  };

  // ---------- the floor plan: the listing's own drawing, placed as given ----------
  SF.plan = (D, box) => {
    const P = D.plan; if(!P || !P.levels || !P.levels.length) return {html: '', issues: [], used: null};
    const lv = P.levels.map(l => Object.assign({}, l, {src: l.src || SP.src(D, l.photo)})), GAP = 22, LAB = lv.length > 1 ? 14 : 0, issues = [];
    const layout = (ang, cols) => {
      const side = ang === 90, sz = lv.map(l => side ? {w: l.h, h: l.w} : {w: l.w, h: l.h}), rows = Math.ceil(lv.length/cols);
      const grid = [...Array(rows)].map((_, r) => lv.map((l, i) => i).filter(i => Math.floor(i/cols) === r));
      const colW = [...Array(cols)].map((_, c) => Math.max(...grid.map(g => g[c] !== undefined ? sz[g[c]].w : 0)));
      const rowH = grid.map(g => Math.max(...g.map(i => sz[i].h)));
      const s = Math.min((box.w - GAP*(cols - 1))/colW.reduce((a, b) => a + b, 0), (box.h - (LAB + 4)*rows - GAP*0.6*(rows - 1))/rowH.reduce((a, b) => a + b, 0));
      return {ang, cols, rows, sz, grid, colW, rowH, s, area: sz.reduce((a, z) => a + z.w*z.h*s*s, 0)};
    };
    let best = null;
    for(const cols of lv.length === 4 ? [4, 2] : lv.length === 3 ? [3] : [lv.length]){
      const up = layout(0, cols), tu = layout(90, cols), pick = tu.area >= up.area*1.33 ? tu : up;
      if(!best || pick.area > best.area) best = pick;
    }
    const A = best, gridW = A.colW.reduce((a, b) => a + b, 0)*A.s + GAP*(A.cols - 1), gridH = A.rowH.reduce((a, b) => a + b, 0)*A.s + (LAB + 4)*A.rows + GAP*0.6*(A.rows - 1);
    const x0 = box.x + (box.w - gridW)/2, y0 = box.y + (box.h - gridH)/2; let html = '';
    A.grid.forEach((g, r) => g.forEach((i, c) => {
      const l = lv[i], w = A.sz[i].w*A.s, h = A.sz[i].h*A.s;
      const cx = x0 + A.colW.slice(0, c).reduce((a, b) => a + b, 0)*A.s + GAP*c + (A.colW[c]*A.s - w)/2;
      const cy = y0 + A.rowH.slice(0, r).reduce((a, b) => a + b, 0)*A.s + ((LAB + 4) + GAP*0.6)*r + (LAB + 4);
      const uw = l.w*A.s, uh = l.h*A.s, ppi = l.w/(uw/72);
      if(ppi < 300) issues.push({slot: `plan.${i}`, kind: 'plan-under-300ppi', ppi: Math.round(ppi)});
      if(LAB) html += `<div class="abs plan-flr" style="left:${cx - 20}pt;top:${cy - LAB - 4}pt;width:${w + 40}pt;height:10pt" data-slot="plan.floor${i}" data-lines="1">${esc(l.name)}</div>`;
      html += `<div class="abs" style="left:${cx}pt;top:${cy}pt;width:${w}pt;height:${h}pt"><div style="position:absolute;left:${(w - uw)/2}pt;top:${(h - uh)/2}pt;width:${uw}pt;height:${uh}pt;${A.ang === 90 ? 'transform:rotate(90deg);' : ''}"><img src="${esc(l.src)}" alt="" data-plan="1" style="display:block;width:100%;height:100%"></div></div>`;
    }));
    return {html, issues, used: {x: x0, y: y0, w: gridW, h: gridH, ang: A.ang}};
  };

  window.SF = SF;
})();
