/* Proof editor: the agent's edit screens on the final proof (11/2/2026). Published as /order/proof-editor.js.
   Rules: docs/context/product.md in the code repo (customizer, user flow 7, UX rules; the Open House standing rules of
   10/30 Book 4 (5, 6), 10/30 Round 2 (6, 7), 10/31 Library to 58 (1) and 11/01 Library to 62 (1); Just Sold intake,
   years and steps order of 10/30 and 10/31). Everything here runs in the browser: no AI, no server, no cost.

     ProofEditor.event(el, opt)      the Open House updater: type, date, time, the event box lines (heading chips, gray
                                     sample text, each line's alignment, size, color and bold for REALTOR(R) emails, drag
                                     to reorder, X to remove), the box photo (upload, size, alignment), where the box sits
                                     in the email (drag), the flyer's background (openHouse.paper) and the food photo
                                     (upload, saved list on the account). Writes the openHouse object the pieces read.
       opt: {value, nar, colors: [main, accent, ...], paper: bool (the flyer reads openHouse.paper), food: bool (the flyer
             draws a food photo), email: bool (an email version is drawn), foodLibrary: [{id, type, group, file}],
             foodBase, saved: [{id, src, w, h, name}] (the agent's own food photos), locked: bool (the 1-year window closed),
             onChange(openHouse, why), onSaved(list) (the saved food photos changed: the host stores them on the account),
             upload(photo, kind) (optional: stores a picked photo, kind 'food' | 'box', resolves {path, src}; without it the
             photo stays a small JPEG copy in the data, the test drive), remove(item) (optional: deletes a stored photo)}
       A stored photo is {path, src}: path is what the account keeps, src a display link the host refreshes.
       returns {set(openHouse), overflow(report)}: overflow() takes ProofEditor.measure() results for each print
       version and grays what won't print there (rule 6), with a small note per version
     ProofEditor.measure(doc, oh)    in a drawn print piece: how many characters of each box line fit
     ProofEditor.forPrint(oh, fit)   the event as a print version prints it: what doesn't fit is cut (the email keeps it)
     ProofEditor.toFields(oh)        the lines editor's model -> refreshments / note / align, the fields the pieces read
     ProofEditor.justSold(el, opt)   the Just Sold intake: years question, write-up with a length guide, steps (edit,
                                     drag to reorder, years line included), call to action, "Save as my wording", reset
       opt: {stock: {writeup, writeup9, writeup11, steps: [...], stepsLabel, cta}, agent: {years, justSold}, saved: bool,
             onChange(agentPatch), onSave(wording|null)}
     ProofEditor.planUpload(el, opt) "Add a floor plan" on the proof: opt {state, onFiles(files), onRemove(), onRestore()}
     ProofEditor.foldColors(el, opt) the fold-over's background and floor plan box colors (owner 11/7/2026): writes
                                     colors {page, planBox}; opt {value, defaults (the design's pieces.json), colors, plan, onChange}
     ProofEditor.photo(file, max)    a picked photo as a JPEG data URL no wider or taller than max px, with its size
   Wording on buttons and labels is a draft; the owner's call. */
(function(){
  const LIMITS = {refreshments: 50, note: 70};   // print: same as pipeline/openhouse.py; the email keeps every word
  // the pick list (docs/proposals/event-heading-picklist-10-30.md, option 2 chosen 10/30): the most used headings on
  // broker and REALTOR(R) invites, plus Other (the agent's own, 24 characters). Food headings fill the Refreshments line.
  const HEADS = ['Refreshments', 'Lunch', 'Breakfast', 'Happy Hour', 'Sweets & Coffee', 'Door Prize', 'Drawing', 'Giveaway', 'Parking', 'Good to Know'];
  const FOOD = new Set(['Refreshments', 'Lunch', 'Breakfast', 'Happy Hour', 'Sweets & Coffee']);
  const MAX_LINES = 4, OTHER_MAX = 24;
  // light gray italic sample text in each line until the agent types (rule 7); never on a piece
  const SAMPLE = {'Refreshments': 'Kolaches and coffee from the corner bakery', 'Lunch': 'Boxed lunches from a local deli, 11:30 to 1',
    'Breakfast': 'Breakfast tacos and fresh coffee, 9 to 11', 'Happy Hour': 'Wine and small bites on the back patio',
    'Sweets & Coffee': 'Cookies, cupcakes and cold brew', 'Door Prize': 'Gift card drawing at 12:30, must be present',
    'Drawing': 'Enter for a $50 gift card when you sign in', 'Giveaway': 'Every agent leaves with a tumbler',
    'Parking': 'Park on the street; the driveway stays clear', 'Good to Know': 'Co-op 3% to the buyer’s agent. Lockbox on the side gate.',
    '': 'Type the details here'};
  const BOX_AT = [['event', 'With the date and time'], ['writeup', 'Under the write-up'], ['photos', 'Under the first photos'], ['card', 'Above your contact card']];
  const SIZES = [['s', 'Small'], ['m', 'Normal'], ['l', 'Large']];
  const ALIGNS = [['left', 'Left'], ['center', 'Center'], ['right', 'Right']];

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const clone = o => JSON.parse(JSON.stringify(o || {}));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const SVG = {
    grip: '<svg viewBox="0 0 12 16" width="12" height="16" aria-hidden="true"><g fill="currentColor"><circle cx="3" cy="3" r="1.4"/><circle cx="9" cy="3" r="1.4"/><circle cx="3" cy="8" r="1.4"/><circle cx="9" cy="8" r="1.4"/><circle cx="3" cy="13" r="1.4"/><circle cx="9" cy="13" r="1.4"/></g></svg>',
    x: '<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    left: '<svg viewBox="0 0 16 14" width="16" height="14" aria-hidden="true"><path d="M1 2h14M1 6h9M1 10h14M1 13h7" stroke="currentColor" stroke-width="1.6"/></svg>',
    center: '<svg viewBox="0 0 16 14" width="16" height="14" aria-hidden="true"><path d="M1 2h14M3.5 6h9M1 10h14M4.5 13h7" stroke="currentColor" stroke-width="1.6"/></svg>',
    right: '<svg viewBox="0 0 16 14" width="16" height="14" aria-hidden="true"><path d="M1 2h14M6 6h9M1 10h14M8 13h7" stroke="currentColor" stroke-width="1.6"/></svg>',
    up: '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2 8l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    down: '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  };

  // ---------- the event box model ----------
  // oh.lines = [{id, head, text, align, size, color, bold}] is the editor's model, kept with the package. The pieces read
  // the two fields they always have: openHouse.refreshments (food headings) and openHouse.note (the rest), one line each
  // (lines split on new lines), with openHouse.align.refreshments / .note one value per line. A line whose heading is
  // the box's own tag ("Refreshments", "Good to Know") prints its text alone; any other heading leads its line.
  function lineText(l){
    const t = String(l.text || '').trim(); if(!t) return '';
    const h = String(l.head || '').trim();
    return !h || h === 'Refreshments' || h === 'Good to Know' ? t : `${h}: ${t}`;
  }
  function toFields(oh){
    const o = Object.assign({}, oh), L = (o.lines || []).filter(l => String(l.text || '').trim());
    if(!o.lines) return o;
    const food = L.filter(l => FOOD.has(l.head)), rest = L.filter(l => !FOOD.has(l.head));
    o.refreshments = food.map(lineText).join('\n');
    o.note = rest.map(lineText).join('\n');
    o.align = {refreshments: food.map(l => l.align || 'center'), note: rest.map(l => l.align || 'center')};
    // the REALTOR(R) email's mixed sizes, colors and headings (rule 5), per line in the order they print
    o.lineStyle = {refreshments: food.map(styleOf), note: rest.map(styleOf)};
    if(!o.refreshments) delete o.refreshments;
    if(!o.note) delete o.note;
    return o;
  }
  const styleOf = l => ({size: l.size || 'm', color: l.color || '', bold: !!l.bold, head: l.head || ''});
  // an older package (refreshments and note typed into two plain boxes) opens as lines
  function fromFields(oh){
    if(oh.lines) return oh.lines.map(l => Object.assign({id: uid()}, l));
    const out = [];
    const AL = oh.align || {}, al = (k, i) => { const a = AL[k]; return (Array.isArray(a) ? a[i] || a[a.length - 1] : a) || 'center'; };
    String(oh.refreshments || '').split('\n').map(s => s.trim()).filter(Boolean).forEach((t, i) => out.push({id: uid(), head: 'Refreshments', text: t, align: al('refreshments', i)}));
    String(oh.note || '').split('\n').map(s => s.trim()).filter(Boolean).forEach((t, i) => out.push({id: uid(), head: 'Good to Know', text: t, align: al('note', i)}));
    return out.slice(0, MAX_LINES);
  }

  // ---------- rule 6: what fits in each print version ----------
  // In a drawn print piece, each event line's box ([data-slot="oh.refreshments"] / "oh.note", one per printed line or
  // one for the field) is filled with longer and longer prefixes of its text until it runs over. Returns, per field,
  // the characters that fit ({refreshments: n|null, note: n|null}; null = all of it fits).
  function measure(doc, oh){
    const out = {refreshments: null, note: null};
    if(!doc) return out;
    for(const k of ['refreshments', 'note']){
      const full = String(oh[k] || ''); if(!full) continue;
      const els = [...doc.querySelectorAll(`[data-slot="oh.${k}"]`)].filter(e => e.offsetWidth);
      if(!els.length){ out[k] = 0; continue; }
      const parts = els.length > 1 ? full.split('\n').map(s => s.trim()).filter(Boolean) : [full];
      let fit = 0, cut = false;
      els.forEach((el, i) => {
        const t = parts[i] || '', keep = el.innerHTML;
        const over = () => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
        el.textContent = t;
        if(!over()){ fit += t.length + 1; el.innerHTML = keep; return; }
        let lo = 0, hi = t.length;
        while(lo < hi){ const m = Math.ceil((lo + hi) / 2); el.textContent = t.slice(0, m); if(over()) hi = m - 1; else lo = m; }
        fit += lo; cut = true; el.innerHTML = keep;
      });
      if(parts.length > els.length){ cut = true; }
      // the field's own limit (the update page's character count) counts too
      const lim = LIMITS[k];
      if(full.replace(/\n/g, ' ').length > lim){ fit = Math.min(fit, lim); cut = true; }
      out[k] = cut ? Math.max(0, fit) : null;
    }
    return out;
  }

  // the event as one print version prints it (rule 6): each field cut to what fits there, at a word, so the extra never
  // prints; the email gets the full text. fit = measure()'s result for that version (from the full text).
  function forPrint(oh, fit){
    const o = Object.assign({}, oh);
    for(const k of ['refreshments', 'note']){
      const n = fit && fit[k]; if(n == null || !o[k]) continue;
      let t = String(o[k]).slice(0, n);
      if(n < String(o[k]).length && /\S/.test(String(o[k])[n] || '')) t = t.replace(/\s+\S*$/, '');
      t = t.replace(/[\s,;:·-]+$/, '').trim();
      if(t) o[k] = t; else delete o[k];
    }
    // the print flyers set each field as one paragraph: the agent's lines read apart with a dot between them
    for(const k of ['refreshments', 'note']) if(o[k]) o[k] = String(o[k]).split('\n').map(x => x.trim()).filter(Boolean).join('  ·  ');
    return o;
  }

  // ---------- styles ----------
  let styled = false;
  function injectStyle(){
    if(styled) return; styled = true;
    const st = document.createElement('style');
    st.textContent = `
.pe{--a:var(--pe-accent,#1F4D3F);--i:var(--pe-ink,#1E2226);--l:var(--pe-line,#D5D6D1);--s:#5c6166;font-size:15px;color:var(--i)}
.pe h4{font-size:14px;margin:18px 0 6px;font-weight:700}
.pe .pe-sub{font-size:13px;color:var(--s);margin:0 0 8px}
.pe .pe-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 10px}
.pe .pe-grid .full{grid-column:1/-1}
.pe label{display:grid;gap:3px;font-size:13px;font-weight:600}
.pe input,.pe select,.pe textarea{font:inherit;font-size:15px;font-weight:400;border:1px solid #bfc2bd;border-radius:6px;padding:7px 9px;background:#fff;color:var(--i);min-width:0;width:100%;box-sizing:border-box}
.pe-chips{display:flex;flex-wrap:wrap;gap:6px}
.pe-chip{font:inherit;font-size:13px;font-weight:600;border:1px solid var(--l);background:#fff;color:var(--i);border-radius:99px;padding:5px 11px;cursor:pointer}
.pe-chip:hover{border-color:var(--a)}.pe-chip:disabled{opacity:.4;cursor:default}
.pe-chip b{color:var(--a);margin-right:3px}
.pe-lines{display:grid;gap:8px;margin-top:10px}
.pe-line{border:1px solid var(--l);border-radius:8px;background:#fff;padding:8px 8px 8px 4px;display:grid;grid-template-columns:22px 1fr;gap:4px 6px}
.pe-line.drag{opacity:.45}.pe-line.over{box-shadow:0 -3px 0 var(--a)}
.pe-grip{grid-row:1/4;cursor:grab;color:#9aa0a5;display:flex;flex-direction:column;align-items:center;gap:2px;padding-top:4px;border:0;background:none}
.pe-grip button{border:0;background:none;padding:2px;color:#7c8287;cursor:pointer;line-height:0}
.pe-lhead{display:flex;gap:6px;align-items:center}
.pe-lhead select,.pe-lhead input{width:auto;flex:1 1 auto;font-size:13px;font-weight:700;padding:4px 6px;text-transform:uppercase;letter-spacing:.06em}
.pe-x{border:0;background:none;color:#7c8287;cursor:pointer;padding:4px;line-height:0;border-radius:4px}.pe-x:hover{color:#a3271f;background:#f6e9e7}
.pe-field{position:relative}
.pe-field textarea,.pe-mirror{font:inherit;font-size:15px;line-height:1.4;padding:7px 9px;border:1px solid #bfc2bd;border-radius:6px;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:break-word;box-sizing:border-box;width:100%;margin:0}
.pe-mirror{position:absolute;inset:0;border-color:transparent;color:var(--i);pointer-events:none;overflow:hidden;background:#fff}
.pe-mirror .pe-gray{color:#a6abaf;background:#eceeef;border-radius:2px}
.pe-field textarea{position:relative;background:transparent;color:transparent;caret-color:var(--i);resize:none;display:block;min-height:40px}
.pe-field textarea::placeholder{color:#9ca1a5;font-style:italic}
.pe-field textarea::selection{background:rgba(31,77,63,.25);color:transparent}
.pe-tools{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;font-size:12px;color:var(--s)}
.pe-seg{display:inline-flex;border:1px solid var(--l);border-radius:6px;overflow:hidden}
.pe-seg button{border:0;background:#fff;color:#5c6166;padding:4px 7px;cursor:pointer;font:inherit;font-size:12px;font-weight:600;line-height:1}
.pe-seg button+button{border-left:1px solid var(--l)}
.pe-seg button[aria-pressed="true"]{background:var(--a);color:#fff}
.pe-dot{width:18px;height:18px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px var(--l);cursor:pointer;padding:0}
.pe-dot[aria-pressed="true"]{box-shadow:0 0 0 2px var(--i)}
.pe-note{font-size:13px;margin:6px 0 0;padding:7px 10px;border-radius:6px;background:#fbf3e2;color:#5b4310}
.pe-note.ok{background:#e9f1ec;color:#1e4a37}
.pe-notes{display:grid;gap:4px;margin-top:8px}
.pe-photo{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.pe-photo img{width:84px;height:56px;object-fit:cover;border-radius:4px;background:#eee}
.pe-upl{font:inherit;font-size:13px;font-weight:700;color:var(--a);border:1.5px dashed var(--a);background:#fff;border-radius:6px;padding:7px 12px;cursor:pointer}
.pe-range{display:flex;gap:8px;align-items:center;font-size:13px}.pe-range input{width:140px;padding:0}
.pe-at{display:grid;gap:6px;margin-top:6px}
.pe-slot{border:1.5px dashed var(--l);border-radius:8px;padding:6px 10px;min-height:38px;display:flex;align-items:center;gap:10px;font-size:13px;color:var(--s);background:#fff}
.pe-slot.hot{border-color:var(--a);background:#eef4f1}
.pe-boxchip{display:inline-flex;align-items:center;gap:6px;background:var(--a);color:#fff;border-radius:6px;padding:5px 10px;font-weight:700;font-size:13px;cursor:grab;border:0}
.pe-slot button.pe-put{font:inherit;font-size:12px;color:var(--a);background:none;border:0;text-decoration:underline;cursor:pointer;margin-left:auto}
.pe-papers{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.pe-paper{width:34px;height:34px;border-radius:6px;border:1px solid var(--l);cursor:pointer;padding:0}
.pe-paper[aria-pressed="true"]{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--a)}
.pe-own{display:inline-flex;align-items:center;gap:6px;font-size:13px}.pe-own input{width:38px;height:34px;padding:2px}
.pe-food{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;margin-top:6px}
.pe-fopt{position:relative;border:2px solid transparent;border-radius:6px;padding:0;background:none;cursor:pointer;text-align:left;font:inherit}
.pe-fopt img{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:4px}
.pe-fopt span{display:block;font-size:11px;line-height:1.3;margin:3px 2px;color:#5a5f63}
.pe-fopt[aria-pressed="true"]{border-color:var(--a)}
.pe-fdel{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;border:0;background:rgba(255,255,255,.92);box-shadow:0 1px 3px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;color:#555}
.pe-link{font:inherit;font-size:13px;font-weight:700;color:var(--a);background:none;border:0;padding:0;text-decoration:underline;cursor:pointer}
.pe-meter{height:8px;border-radius:99px;background:#e3e5e1;position:relative;margin:6px 0 2px;overflow:hidden}
.pe-meter i{position:absolute;top:0;bottom:0;background:#cfe1d7}.pe-meter b{position:absolute;top:-2px;bottom:-2px;width:3px;background:var(--i);border-radius:2px}
.pe-meter.long b{background:#a3271f}.pe-meter.short b{background:#b07a12}
.pe-guide{font-size:13px;color:var(--s);display:flex;justify-content:space-between;gap:8px}
.pe-guide .bad{color:#a3271f;font-weight:700}.pe-guide .meh{color:#8a5d00;font-weight:700}.pe-guide .good{color:#1e4a37;font-weight:700}
.pe-steps{display:grid;gap:6px;margin-top:6px;padding:0;list-style:none}
.pe-step{display:grid;grid-template-columns:22px 1fr auto;gap:6px;align-items:center;background:#fff;border:1px solid var(--l);border-radius:8px;padding:6px 8px 6px 4px}
.pe-step.drag{opacity:.45}.pe-step.over{box-shadow:0 -3px 0 var(--a)}
.pe-step.yrs{background:#f4f7f5}
.pe-step input{padding:5px 7px;font-size:14px}
.pe-step .pe-auto{font-size:14px;padding:5px 7px;color:var(--i)}
.pe-step .pe-auto small{display:block;color:var(--s);font-size:12px}
.pe-step .pe-mv{display:flex;flex-direction:column}.pe-step .pe-mv button{border:0;background:none;padding:1px 3px;cursor:pointer;color:#7c8287;line-height:0}
.pe-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px}
.pe-btn{font:inherit;font-weight:700;background:var(--a);color:#fff;border:0;border-radius:6px;padding:9px 15px;cursor:pointer}
.pe-btn.line{background:#fff;color:var(--a);box-shadow:inset 0 0 0 1.5px var(--a)}
.pe-saved{font-size:13px;color:#1e4a37;font-weight:600}
.pe-lock{font-size:13px;color:var(--s);background:#f1f1ee;border-radius:6px;padding:8px 10px}
.pe fieldset{border:0;padding:0;margin:0}
.pe [disabled]{cursor:default}
`;
    document.head.appendChild(st);
  }

  // a picked photo, made smaller in the browser (a phone photo is 4000 px; the box photo prints a few inches wide)
  function photo(file, max){
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const k = Math.min(1, (max || 1600) / Math.max(im.naturalWidth, im.naturalHeight));
        const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res({src: c.toDataURL('image/jpeg', .86), w: c.width, h: c.height, name: file.name});
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("That file isn't a photo we can open. Try a JPG or PNG.")); };
      im.src = url;
    });
  }

  // drag to reorder inside a list (mouse and touch through pointer events); onMove(from, to)
  function sortable(list, itemSel, handleSel, onMove){
    let drag = null;
    list.addEventListener('pointerdown', e => {
      const h = e.target.closest(handleSel); if(!h || e.target.closest('button')) return;
      const it = h.closest(itemSel); if(!it) return;
      e.preventDefault();
      drag = {it, from: [...list.querySelectorAll(itemSel)].indexOf(it), to: null};
      it.classList.add('drag'); h.setPointerCapture(e.pointerId);
    });
    list.addEventListener('pointermove', e => {
      if(!drag) return;
      const items = [...list.querySelectorAll(itemSel)];
      items.forEach(x => x.classList.remove('over'));
      let to = items.length;
      for(let i = 0; i < items.length; i++){ const r = items[i].getBoundingClientRect(); if(e.clientY < r.top + r.height / 2){ to = i; break; } }
      drag.to = to;
      if(items[to]) items[to].classList.add('over');
    });
    const end = () => {
      if(!drag) return;
      const {it, from, to} = drag; drag = null;
      [...list.querySelectorAll(itemSel)].forEach(x => x.classList.remove('over')); it.classList.remove('drag');
      if(to == null) return;
      const dest = to > from ? to - 1 : to;
      if(dest !== from) onMove(from, dest);
    };
    list.addEventListener('pointerup', end); list.addEventListener('pointercancel', end);
  }
  const move = (arr, from, to) => { const [x] = arr.splice(from, 1); arr.splice(to, 0, x); return arr; };

  // ---------- the Open House updater ----------
  function event(el, opt){
    injectStyle();
    opt = opt || {};
    let oh = clone(opt.value), lines = fromFields(oh), saved = (opt.saved || []).slice(), report = {};
    const colors = (opt.colors || []).filter(Boolean);
    el.classList.add('pe');

    function emit(why){
      oh.lines = lines.map(({id, ...l}) => l);
      const out = toFields(oh);
      opt.onChange && opt.onChange(out, why);
    }
    const kindOpts = () => [['public', 'Public Open House'], ['broker', 'Broker Open House']].concat(opt.nar ? [['realtor', 'REALTOR® Open House']] : []);
    const pub = () => !oh.kind || oh.kind === 'public';

    function draw(){
      const locked = !!opt.locked;
      el.innerHTML = `${locked ? '<p class="pe-lock">Open house updates for this package closed. Email support@brochuredesk.com if you need a change.</p>' : ''}
      <fieldset ${locked ? 'disabled' : ''}>
        <div class="pe-grid">
          <label class="full">Type <select data-k="kind">${kindOpts().map(([v, t]) => `<option value="${v}"${(oh.kind || 'public') === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
          <label class="full">Date <input type="date" data-k="date" value="${esc(oh.date || '')}"></label>
          <label>From <input type="time" step="900" data-k="start" value="${esc(oh.start || '')}"></label>
          <label>To <input type="time" step="900" data-k="end" value="${esc(oh.end || '')}"></label>
        </div>
        <div data-part="box"${pub() ? ' hidden' : ''}>
          <h4>What's in the box</h4>
          <p class="pe-sub">Tap a heading to add a line (up to ${MAX_LINES}). Your words go on every version: the print flyer, the email and the socials.</p>
          <div class="pe-chips" data-part="chips"></div>
          <div class="pe-lines" data-part="lines"></div>
          <div class="pe-notes" data-part="notes"></div>
          <h4>Your photo in the box</h4>
          <p class="pe-sub">Lunch, the caterer's or title company's logo. It sits small in the box and you can size it.</p>
          <div data-part="boxphoto"></div>
          ${opt.email ? `<h4>Where the box sits in the email</h4><p class="pe-sub">Drag the box to a spot, or tap Put it here.</p><div class="pe-at" data-part="at"></div>` : ''}
        </div>
        ${pub() ? '<p class="pe-sub" style="margin-top:12px">Public open houses show the date and time only. Refreshments and notes are for broker and REALTOR® opens.</p>' : ''}
        ${opt.food && !pub() ? '<h4>Food photo</h4><div data-part="food"></div>' : ''}
        ${opt.paper ? `<h4>Background</h4><p class="pe-sub">This flyer starts on a light shade of your main color. Pick any background you like.</p><div class="pe-papers" data-part="paper"></div>` : ''}
      </fieldset>`;
      el.querySelectorAll('[data-k]').forEach(i => i.onchange = () => {
        oh[i.dataset.k] = i.value;
        if(i.dataset.k === 'kind'){ draw(); }
        emit(i.dataset.k);
      });
      if(!pub()){ chips(); drawLines(); boxPhoto(); if(opt.email) boxAt(); notes(); if(opt.food) food(); }
      if(opt.paper) paper();
    }

    function chips(){
      const box = el.querySelector('[data-part="chips"]'), full = lines.length >= MAX_LINES;
      box.innerHTML = HEADS.map(h => `<button type="button" class="pe-chip" data-h="${esc(h)}"${full ? ' disabled' : ''}><b>+</b>${esc(h)}</button>`).join('')
        + `<button type="button" class="pe-chip" data-h=""${full ? ' disabled' : ''}><b>+</b>Other</button>`;
      box.onclick = e => {
        const b = e.target.closest('.pe-chip'); if(!b || b.disabled) return;
        lines.push({id: uid(), head: b.dataset.h, text: '', align: (lines[lines.length - 1] || {}).align || 'center', other: b.dataset.h === ''});
        chips(); drawLines(); emit('add-line');
        const t = el.querySelectorAll('.pe-line textarea'); const last = b.dataset.h === '' ? el.querySelector('.pe-line:last-child input.pe-otherhead') : t[t.length - 1];
        if(last) last.focus();
      };
    }

    function drawLines(){
      const box = el.querySelector('[data-part="lines"]'), realtor = oh.kind === 'realtor' && opt.email;
      box.innerHTML = lines.map((l, i) => {
        const isOther = l.other || (l.head && !HEADS.includes(l.head));
        return `<div class="pe-line" data-i="${i}">
          <div class="pe-grip" title="Drag to move this line">${SVG.grip}<button type="button" data-a="up" aria-label="Move up"${i ? '' : ' hidden'}>${SVG.up}</button><button type="button" data-a="down" aria-label="Move down"${i < lines.length - 1 ? '' : ' hidden'}>${SVG.down}</button></div>
          <div class="pe-lhead">${isOther ? `<input class="pe-otherhead" maxlength="${OTHER_MAX}" placeholder="Your heading" value="${esc(l.head)}" aria-label="Heading">`
            : `<select aria-label="Heading">${HEADS.map(h => `<option${h === l.head ? ' selected' : ''}>${esc(h)}</option>`).join('')}<option value="">Other…</option></select>`}
            <button type="button" class="pe-x" data-a="x" aria-label="Remove this line" title="Remove this line">${SVG.x}</button></div>
          <div class="pe-field"><div class="pe-mirror" aria-hidden="true"></div><textarea rows="1" placeholder="${esc(SAMPLE[l.head] || SAMPLE[''])}" aria-label="${esc(l.head || 'Line')} details">${esc(l.text)}</textarea></div>
          <div class="pe-tools"><span class="pe-seg" role="group" aria-label="Line alignment">${ALIGNS.map(([v, t]) => `<button type="button" data-al="${v}" aria-pressed="${(l.align || 'center') === v}" title="${t}">${SVG[v]}</button>`).join('')}</span>
            ${realtor ? `<span class="pe-seg" role="group" aria-label="Text size in the email">${SIZES.map(([v, t]) => `<button type="button" data-sz="${v}" aria-pressed="${(l.size || 'm') === v}">${t}</button>`).join('')}</span>
              <span class="pe-seg"><button type="button" data-b="1" aria-pressed="${!!l.bold}" style="font-weight:800">B</button></span>
              <span style="display:inline-flex;gap:5px">${[''].concat(colors).slice(0, 4).map(c => `<button type="button" class="pe-dot" data-c="${esc(c)}" aria-pressed="${(l.color || '') === c}" title="${c ? c : 'Standard'}" style="background:${c || 'linear-gradient(135deg,#1d1d1b 50%,#fff 50%)'}"></button>`).join('')}</span>
              <span>Email only</span>` : ''}</div>
        </div>`;
      }).join('') || '<p class="pe-sub" style="margin:0">Nothing in the box yet. With nothing typed, the flyer uses its layout without the box.</p>';
      box.querySelectorAll('.pe-line').forEach(row => {
        const i = +row.dataset.i, l = lines[i], ta = row.querySelector('textarea');
        const grow = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; mirror(row, i); };
        ta.oninput = () => { l.text = ta.value.replace(/\n/g, ' '); if(ta.value !== l.text) ta.value = l.text; grow(); emit('text'); };
        ta.onscroll = () => { row.querySelector('.pe-mirror').scrollTop = ta.scrollTop; };
        requestAnimationFrame(grow);
        const sel = row.querySelector('select');
        if(sel) sel.onchange = () => { if(sel.value === ''){ l.other = true; l.head = ''; drawLines(); const h = el.querySelector(`.pe-line[data-i="${i}"] .pe-otherhead`); h && h.focus(); } else { l.head = sel.value; l.other = false; drawLines(); } emit('head'); };
        const oh2 = row.querySelector('.pe-otherhead');
        if(oh2) oh2.oninput = () => { l.head = oh2.value.slice(0, OTHER_MAX); ta.placeholder = SAMPLE['']; emit('head'); };
        row.querySelector('[data-a="x"]').onclick = () => { lines.splice(i, 1); chips(); drawLines(); emit('remove-line'); };
        row.querySelector('[data-a="up"]').onclick = () => { move(lines, i, i - 1); drawLines(); emit('move-line'); };
        row.querySelector('[data-a="down"]').onclick = () => { move(lines, i, i + 1); drawLines(); emit('move-line'); };
        row.querySelectorAll('[data-al]').forEach(b => b.onclick = () => { l.align = b.dataset.al; drawLines(); emit('align'); });
        row.querySelectorAll('[data-sz]').forEach(b => b.onclick = () => { l.size = b.dataset.sz; drawLines(); emit('style'); });
        row.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { l.bold = !l.bold; drawLines(); emit('style'); });
        row.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { l.color = b.dataset.c; drawLines(); emit('style'); });
      });
      if(!box._sorted){ box._sorted = true; sortable(box, '.pe-line', '.pe-grip', (a, b) => { move(lines, a, b); drawLines(); emit('move-line'); }); }
    }

    // gray what won't print (rule 6): the worst print version decides how much of each field fits
    function fitOf(field){
      let n = null;
      Object.values(report).forEach(r => { const v = r && r.fit ? r.fit[field] : null; if(v != null) n = n == null ? v : Math.min(n, v); });
      return n;
    }
    function mirror(row, i){
      const l = lines[i], m = row.querySelector('.pe-mirror'); if(!m) return;
      const field = FOOD.has(l.head) ? 'refreshments' : 'note', fit = fitOf(field);
      const same = lines.filter(x => String(x.text || '').trim() && (FOOD.has(x.head) ? 'refreshments' : 'note') === field);
      // characters of this field before this line (each printed line is "Heading: text" plus a line break)
      let before = 0;
      for(const x of same){ if(x === l) break; before += lineText(x).length + 1; }
      const lead = lineText(l).length - String(l.text || '').trim().length;   // "Lunch: " in front of the typed text
      const t = String(l.text || '');
      let keep = t.length;
      if(fit != null) keep = Math.max(0, Math.min(t.length, fit - before - lead));
      m.innerHTML = esc(t.slice(0, keep)) + (keep < t.length ? `<span class="pe-gray">${esc(t.slice(keep))}</span>` : '') + '​';
    }
    function notes(){
      const box = el.querySelector('[data-part="notes"]'); if(!box) return;
      const msgs = Object.entries(report).filter(([, r]) => r && r.fit && (r.fit.refreshments != null || r.fit.note != null))
        .map(([, r]) => `<p class="pe-note">Too long for the ${esc(r.label)}. The gray words won't print there.${opt.email ? ' The email keeps all of it.' : ''}</p>`);
      box.innerHTML = msgs.join('');
      el.querySelectorAll('.pe-line').forEach(row => mirror(row, +row.dataset.i));
    }

    function boxPhoto(){
      const box = el.querySelector('[data-part="boxphoto"]'), BP = oh.boxPhoto;
      box.innerHTML = BP && BP.src ? `<div class="pe-photo"><img src="${esc(BP.src)}" alt="Your photo in the box">
          <div style="display:grid;gap:6px"><span class="pe-range">Size <input type="range" min="20" max="100" step="5" value="${Math.round((+BP.w || .5) * 100)}" aria-label="Photo size"> <output>${Math.round((+BP.w || .5) * 100)}%</output></span>
          <span class="pe-seg" role="group" aria-label="Photo alignment">${ALIGNS.map(([v, t]) => `<button type="button" data-pal="${v}" aria-pressed="${(BP.align || 'center') === v}" title="${t}">${SVG[v]}</button>`).join('')}</span></div>
          <button type="button" class="pe-link" data-a="swap">Change</button><button type="button" class="pe-link" data-a="rm">Remove</button></div>`
        : `<button type="button" class="pe-upl" data-a="up">Add a photo</button>`;
      box.insertAdjacentHTML('beforeend', '<input type="file" accept="image/jpeg,image/png,image/webp" hidden><p class="pe-note" hidden></p>');
      const file = box.querySelector('input[type=file]'), err = box.querySelector('.pe-note');
      box.querySelectorAll('[data-a="up"],[data-a="swap"]').forEach(b => b.onclick = () => file.click());
      file.onchange = async () => {
        const f = file.files[0]; if(!f) return;
        try {
          busy(box, 'Saving your photo…');
          const p = await photo(f, 1200), st = await store(p, 'box'), old = oh.boxPhoto;
          oh.boxPhoto = Object.assign({w: .5, align: 'center'}, oh.boxPhoto || {}, {src: st.src, ratio: +(p.h / p.w).toFixed(3)});
          if(st.path) oh.boxPhoto.path = st.path; else delete oh.boxPhoto.path;
          if(old && old.path && old.path !== st.path && opt.remove) opt.remove(old);
          boxPhoto(); emit('box-photo');
        } catch(e){ boxPhoto(); const n = box.querySelector('.pe-note'); n.textContent = e.message; n.hidden = false; }
      };
      const rm = box.querySelector('[data-a="rm"]'); if(rm) rm.onclick = () => { if(oh.boxPhoto.path && opt.remove) opt.remove(oh.boxPhoto); delete oh.boxPhoto; boxPhoto(); emit('box-photo'); };
      const rg = box.querySelector('input[type=range]');
      if(rg){ rg.oninput = () => { box.querySelector('output').textContent = rg.value + '%'; }; rg.onchange = () => { oh.boxPhoto.w = +rg.value / 100; emit('box-photo'); }; }
      box.querySelectorAll('[data-pal]').forEach(b => b.onclick = () => { oh.boxPhoto.align = b.dataset.pal; boxPhoto(); emit('box-photo'); });
    }

    function boxAt(){
      const box = el.querySelector('[data-part="at"]'), at = oh.boxAt || 'event';
      box.innerHTML = BOX_AT.map(([v, t]) => `<div class="pe-slot${v === at ? ' on' : ''}" data-at="${v}">${v === at ? `<span class="pe-boxchip" draggable="true">${SVG.grip}Your box</span>` : ''}<span>${esc(t)}</span>${v === at ? '' : '<button type="button" class="pe-put">Put it here</button>'}</div>`).join('');
      const set = v => { if(v === (oh.boxAt || 'event')) return; if(v === 'event') delete oh.boxAt; else oh.boxAt = v; boxAt(); emit('box-at'); };
      box.querySelectorAll('.pe-put').forEach(b => b.onclick = () => set(b.closest('.pe-slot').dataset.at));
      // drag the chip (pointer events, so it works with a finger too)
      const chip = box.querySelector('.pe-boxchip');
      chip.addEventListener('dragstart', e => e.preventDefault());
      chip.addEventListener('pointerdown', e => {
        e.preventDefault(); chip.setPointerCapture(e.pointerId);
        const slots = [...box.querySelectorAll('.pe-slot')];
        const hot = ev => slots.find(s => { const r = s.getBoundingClientRect(); return ev.clientY >= r.top && ev.clientY <= r.bottom; });
        chip.onpointermove = ev => slots.forEach(s => s.classList.toggle('hot', s === hot(ev)));
        chip.onpointerup = ev => { chip.onpointermove = chip.onpointerup = null; const s = hot(ev); slots.forEach(x => x.classList.remove('hot')); if(s) set(s.dataset.at); };
      });
    }

    function paper(){
      const box = el.querySelector('[data-part="paper"]'), cur = oh.paper || '';
      const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
      const main = colors[0] || '#1f4e5f';
      const list = [['', mix(main, '#ffffff', .86), 'Light shade of your main color (standard)'], ['#ffffff', '#ffffff', 'White'], ['#f6f1e7', '#f6f1e7', 'Warm white'], ['#eef1f3', '#eef1f3', 'Cool gray']]
        .concat(colors.slice(1, 3).map(c => [mix(c, '#ffffff', .85), mix(c, '#ffffff', .85), 'Light shade of your second color']));
      box.innerHTML = list.map(([v, show, t]) => `<button type="button" class="pe-paper" data-p="${esc(v)}" aria-pressed="${cur === v || (!cur && !v)}" title="${esc(t)}" aria-label="${esc(t)}" style="background:${show}"></button>`).join('')
        + `<label class="pe-own">Your own <input type="color" value="${esc(/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#ffffff')}" aria-label="Pick your own background"></label>`
        + (cur ? '<button type="button" class="pe-link" data-a="reset">Back to the standard</button>' : '');
      const set = v => { if(v) oh.paper = v; else delete oh.paper; paper(); emit('paper'); };
      box.querySelectorAll('[data-p]').forEach(b => b.onclick = () => set(b.dataset.p));
      box.querySelector('input[type=color]').onchange = e => set(e.target.value);
      const r = box.querySelector('[data-a="reset"]'); if(r) r.onclick = () => set('');
    }

    // the food photo (owner 10/31, Library to 58 rule 1): the matching library photo by default; the agent's own upload
    // takes its place and is saved to the account for their later refreshments flyers (use it again, swap it, or go back)
    function food(){
      const box = el.querySelector('[data-part="food"]'), cur = oh.foodPhoto || '';
      const lib = (opt.foodLibrary || []), match = lib.find(p => p.id === oh.libraryFood) || lib.find(p => p.type === (oh.refreshmentType || 'luncheon')) || lib[0];
      box.innerHTML = `<p class="pe-sub">Flyers with refreshments show a food photo. Use ours, or your own (the caterer's spread, your go-to kolaches).</p>
        <div class="pe-food">
          ${match ? `<button type="button" class="pe-fopt" data-f="" aria-pressed="${!cur}"><img src="${esc((opt.foodBase || '') + 'thumbs/' + match.id + '.jpg')}" alt=""><span>Our ${esc(match.group.toLowerCase())} photo</span></button>` : ''}
          ${saved.map(p => `<div style="position:relative"><button type="button" class="pe-fopt" data-f="${esc(p.id)}" aria-pressed="${cur === p.id}" style="width:100%"><img src="${esc(p.src)}" alt=""><span>${esc(p.name || 'Your photo')}</span></button><button type="button" class="pe-fdel" data-del="${esc(p.id)}" aria-label="Remove from my saved photos" title="Remove from my saved photos">${SVG.x}</button></div>`).join('')}
        </div>
        <div class="pe-row" style="margin-top:8px"><button type="button" class="pe-upl" data-a="up">Upload your own food photo</button><input type="file" accept="image/jpeg,image/png,image/webp" hidden>
          ${saved.length ? `<span class="pe-saved">${saved.length} saved to your account</span>` : ''}</div><p class="pe-note" hidden></p>`;
      const file = box.querySelector('input[type=file]'), err = box.querySelector('.pe-note');
      box.querySelector('[data-a="up"]').onclick = () => file.click();
      file.onchange = async () => {
        const f = file.files[0]; if(!f) return;
        try {
          busy(box, 'Saving your photo…');
          const p = await photo(f, 1600), st = await store(p, 'food');
          const item = Object.assign({id: 'own-' + uid(), src: st.src, w: p.w, h: p.h, name: f.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 40), at: new Date().toISOString()}, st.path ? {path: st.path} : {});
          saved.unshift(item); saved = saved.slice(0, 12);
          oh.foodPhoto = item.id; food();
          opt.onSaved && opt.onSaved(saved.slice()); emit('food-photo');
        } catch(e){ food(); const n = box.querySelector('.pe-note'); n.textContent = e.message; n.hidden = false; }
      };
      box.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { if(b.dataset.f) oh.foodPhoto = b.dataset.f; else delete oh.foodPhoto; food(); emit('food-photo'); });
      box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        const gone = saved.find(p => p.id === b.dataset.del); if(gone && gone.path && opt.remove) opt.remove(gone);
        saved = saved.filter(p => p.id !== b.dataset.del); if(oh.foodPhoto === b.dataset.del) delete oh.foodPhoto;
        food(); opt.onSaved && opt.onSaved(saved.slice()); emit('food-photo');
      });
    }

    // a picked photo goes to the host's storage when it has one (signed in); else it stays a small copy in the data
    async function store(p, kind){
      if(!opt.upload) return {src: p.src};
      const r = await opt.upload(p, kind);   // {path, src} stored; {src} the host keeps the copy (test drive); null failed
      if(!r || !(r.path || r.src)) throw new Error("We couldn't save that photo. Check your connection and try again.");
      return r;
    }
    const busy = (box, t) => { box.querySelectorAll('button').forEach(b => b.disabled = true); box.insertAdjacentHTML('beforeend', `<p class="pe-sub" data-busy>${esc(t)}</p>`); };

    draw();
    return {
      set(v){ oh = clone(v); lines = fromFields(oh); draw(); },
      // report: {versionId: {label, fit: {refreshments, note}}} from measure(); grays and notes update in place
      overflow(r){ report = Object.assign({}, report, r); if(!pub()) notes(); },
      saved: () => saved.slice(),
      value: () => toFields(Object.assign(oh, {lines: lines.map(({id, ...l}) => l)}))
    };
  }

  // the food photo the pieces draw for this event: the agent's own (from the saved list) or the matching library photo
  function foodFor(oh, saved, library, base){
    const own = (saved || []).find(p => p.id === (oh || {}).foodPhoto);
    if(own) return {src: own.src, tags: 'food, the agent’s own photo', w: own.w, h: own.h};
    const lib = library || [], p = lib.find(x => x.id === (oh || {}).libraryFood) || lib.find(x => x.type === ((oh || {}).refreshmentType || 'luncheon')) || lib[0];
    return p ? {src: (base || '') + p.file, tags: p.tags, w: p.w, h: p.h} : null;
  }

  // ---------- the Just Sold intake ----------
  // stock: the design's suggested wording (copy.pc.js): writeup (or writeup9 / writeup11), steps (the design's list,
  // "{experience?}" / "{experience}" / "{experience|...}" for the years line), stepsLabel, cta. The agent's own wording
  // is agent.justSold = {writeup, bullets, cta, order}; agent.years the years in real estate (SP.agentWording reads both).
  const YEARS_TOKEN = /^\{experience(\?|\|.*)?\}$/;
  function justSold(el, opt){
    injectStyle();
    opt = opt || {};
    const S = opt.stock || {}, A = clone(opt.agent);
    let own = clone(A.justSold), years = A.years || '';
    const stockSteps = (S.steps || []).slice();
    el.classList.add('pe');
    // the list as the piece draws it: the agent's order over the stock positions, the years line counted
    const orderNow = () => {
      const n = stockSteps.length, ord = (own.order || []).map(Number).filter((i, j, a) => Number.isInteger(i) && i >= 0 && i < n && a.indexOf(i) === j);
      return ord.concat([...Array(n).keys()].filter(i => !ord.includes(i)));
    };
    const yearsLine = () => +years > 0 ? `Put my ${Math.round(+years)} years of experience to work for you` : '';
    const stepText = i => YEARS_TOKEN.test(stockSteps[i]) ? null : (own.bullets && own.bullets[i] != null ? own.bullets[i] : stockSteps[i]);
    // the write-up's length guide: the design's own two write-ups (6x9 and 6x11) set the range that fills its space
    const lens = [S.writeup9, S.writeup11, S.writeup].filter(Boolean).map(s => s.length);
    const lo = lens.length ? Math.round(Math.min(...lens) * .9) : 200, hi = lens.length ? Math.round(Math.max(...lens) * 1.02) : 380;

    function emit(why){
      const js = {};
      if(own.writeup != null && own.writeup.trim() && own.writeup.trim() !== (S.writeup11 || S.writeup || '').trim()) js.writeup = own.writeup.trim();
      if(own.cta != null && own.cta.trim() && own.cta.trim() !== (S.cta || '').trim()) js.cta = own.cta.trim();
      // the agent's bullets go in only when they changed one; the years line stays the stock token so it follows agent.years
      if(own.bullets && own.bullets.some((b, i) => b != null && b.trim() && b.trim() !== stockSteps[i])) js.bullets = stockSteps.map((s, i) => YEARS_TOKEN.test(s) ? s : ((own.bullets[i] != null && own.bullets[i].trim()) || s));
      if(own.order && own.order.length && own.order.some((v, i) => v !== i)) js.order = own.order.slice();
      opt.onChange && opt.onChange({years: +years > 0 ? Math.round(+years) : null, justSold: js}, why);
      return js;
    }

    function draw(){
      const w = own.writeup != null ? own.writeup : (S.writeup11 || S.writeup || '');
      el.innerHTML = `
        <label>Would you like us to highlight your years in real estate? If so, let us know how many.
          <input type="number" min="1" max="70" inputmode="numeric" data-k="years" value="${esc(years)}" placeholder="Leave empty to skip" style="max-width:220px"></label>
        <h4>Your write-up</h4>
        <textarea rows="6" data-k="writeup" aria-label="Just Sold write-up">${esc(w)}</textarea>
        <div class="pe-meter" data-part="meter"><i style="left:${(lo / (hi * 1.35) * 100).toFixed(1)}%;width:${((hi - lo) / (hi * 1.35) * 100).toFixed(1)}%"></i><b></b></div>
        <div class="pe-guide" data-part="guide"></div>
        <div data-part="fit"></div>
        <h4>${esc(S.stepsLabel || "How I'd start")}</h4>
        <p class="pe-sub">Change any step, or drag them into the order you like.${stockSteps.some(s => YEARS_TOKEN.test(s)) ? ' Your years line moves too.' : ''}</p>
        <ol class="pe-steps" data-part="steps"></ol>
        <h4>Call to action</h4>
        <input data-k="cta" maxlength="120" value="${esc(own.cta != null ? own.cta : (S.cta || ''))}" aria-label="Call to action">
        <div class="pe-row"><button type="button" class="pe-btn" data-a="save">Save as my wording</button>
          <button type="button" class="pe-link" data-a="reset">Go back to our wording</button><span class="pe-saved" data-part="saved"></span></div>
        <p class="pe-sub" style="margin-top:6px">Saved wording fills in on every Just Sold card you make after this, in any design.</p>`;
      const ta = el.querySelector('[data-k="writeup"]');
      ta.oninput = () => { own.writeup = ta.value; guide(); emit('writeup'); };
      el.querySelector('[data-k="cta"]').oninput = e => { own.cta = e.target.value; emit('cta'); };
      el.querySelector('[data-k="years"]').oninput = e => { years = e.target.value.replace(/\D/g, '').slice(0, 2); steps(); emit('years'); };
      el.querySelector('[data-a="save"]').onclick = () => { const js = emit('save'); opt.onSave && opt.onSave(Object.assign({}, js), +years > 0 ? Math.round(+years) : null); el.querySelector('[data-part="saved"]').textContent = 'Saved to your profile'; };
      el.querySelector('[data-a="reset"]').onclick = () => { own = {}; draw(); emit('reset'); opt.onSave && opt.onSave(null, +years > 0 ? Math.round(+years) : null); el.querySelector('[data-part="saved"]').textContent = 'Back to our wording'; };
      guide(); steps();
      if(opt.saved) el.querySelector('[data-part="saved"]').textContent = 'Using your saved wording';
    }
    function guide(){
      const n = (own.writeup != null ? own.writeup : (S.writeup11 || S.writeup || '')).trim().length;
      const m = el.querySelector('[data-part="meter"]'), g = el.querySelector('[data-part="guide"]');
      m.querySelector('b').style.left = Math.min(99, n / (hi * 1.35) * 100).toFixed(1) + '%';
      m.className = 'pe-meter' + (n > hi ? ' long' : n < lo ? ' short' : '');
      const say = n > hi ? `<span class="bad">A little long.</span> Trim about ${n - hi} characters so the type stays its size.`
        : n < lo ? `<span class="meh">A little short.</span> Add about ${lo - n} characters so the space fills.` : '<span class="good">Good length.</span> It fills its space on both sizes.';
      g.innerHTML = `<span>${say}</span><span>${n} characters (best ${lo} to ${hi})</span>`;
    }
    function steps(){
      const box = el.querySelector('[data-part="steps"]'), ord = orderNow();
      box.innerHTML = ord.map((i, pos) => {
        const yrs = YEARS_TOKEN.test(stockSteps[i]);
        if(yrs && !yearsLine() && /\?/.test(stockSteps[i])) return `<li class="pe-step yrs" data-i="${i}"><span class="pe-grip">${SVG.grip}</span><span class="pe-auto"><small>Your years line shows here once you add your years above.</small></span><span></span></li>`;
        return `<li class="pe-step${yrs ? ' yrs' : ''}" data-i="${i}"><span class="pe-grip" title="Drag to move">${SVG.grip}</span>
          ${yrs ? `<span class="pe-auto">${esc(yearsLine() || stockSteps[i].replace(/^\{experience\|?|\}$/g, '') || 'Walk you through the process from start to finish')}<small>Your years line</small></span>`
            : `<input value="${esc(stepText(i))}" aria-label="Step ${pos + 1}">`}
          <span class="pe-mv"><button type="button" data-a="up" aria-label="Move up"${pos ? '' : ' disabled'}>${SVG.up}</button><button type="button" data-a="down" aria-label="Move down"${pos < ord.length - 1 ? '' : ' disabled'}>${SVG.down}</button></span></li>`;
      }).join('');
      box.querySelectorAll('.pe-step').forEach((li, pos) => {
        const i = +li.dataset.i, inp = li.querySelector('input');
        if(inp) inp.oninput = () => { own.bullets = own.bullets || stockSteps.map(() => null); own.bullets[i] = inp.value; emit('step'); };
        const mv = d => { const o = orderNow(); move(o, pos, pos + d); own.order = o; steps(); emit('order'); };
        const up = li.querySelector('[data-a="up"]'), dn = li.querySelector('[data-a="down"]');
        if(up) up.onclick = () => mv(-1); if(dn) dn.onclick = () => mv(1);
      });
      if(!box._sorted){ box._sorted = true; sortable(box, '.pe-step', '.pe-grip', (a, b) => { const o = orderNow(); move(o, a, b); own.order = o; steps(); emit('order'); }); }
    }
    draw();
    return {value: () => ({years: +years > 0 ? Math.round(+years) : null, justSold: emit('read')}),
      // the drawn cards' own word: [label of each size the write-up runs over in] (from the piece's overflow check)
      fit(over){ const b = el.querySelector('[data-part="fit"]'); if(b) b.innerHTML = (over || []).map(l => `<p class="pe-note">Too long for the ${esc(l)}: the end runs past its space. Trim it a little.</p>`).join(''); }};
  }

  // ---------- add a floor plan from the proof ----------
  // state: 'in' (a plan is on the piece), 'out' (removed), 'none' (none found); onFiles(files) loads the agent's file(s)
  function planUpload(el, opt){
    injectStyle();
    el.classList.add('pe');
    const st = opt.state || 'none';
    el.innerHTML = st === 'in' ? `<p class="pe-sub" style="margin:0 0 6px">Your floor plan is on the piece, placed just as the listing gives it.</p>
        <div class="pe-row" style="margin:0"><button type="button" class="pe-link" data-a="swap">Use a different file</button><button type="button" class="pe-link" data-a="rm">Remove the floor plan</button></div>`
      : st === 'out' ? `<p class="pe-sub" style="margin:0 0 6px">Floor plan removed. The piece uses its version without one.</p><div class="pe-row" style="margin:0"><button type="button" class="pe-link" data-a="back">Put it back</button><button type="button" class="pe-link" data-a="swap">Upload a different one</button></div>`
      : `<p class="pe-sub" style="margin:0 0 6px">${opt.failed ? "We couldn't open that file. Try a PDF, JPG or PNG." : 'Have a floor plan? Add it and the piece switches to its floor plan version.'}</p><button type="button" class="pe-upl" data-a="swap">Add a floor plan</button>`;
    el.insertAdjacentHTML('beforeend', '<input type="file" accept="application/pdf,image/jpeg,image/png" multiple hidden aria-label="Floor plan file (PDF, JPG or PNG; one file per floor is fine)">');
    const f = el.querySelector('input[type=file]');
    el.querySelectorAll('[data-a="swap"]').forEach(b => b.onclick = () => f.click());
    f.onchange = () => { const fs = [...f.files].slice(0, 4); if(fs.length) opt.onFiles && opt.onFiles(fs); };
    const rm = el.querySelector('[data-a="rm"]'); if(rm) rm.onclick = () => opt.onRemove && opt.onRemove();
    const bk = el.querySelector('[data-a="back"]'); if(bk) bk.onclick = () => opt.onRestore && opt.onRestore();
  }

  // the fold-over's two colors (owner 11/7/2026, every design set): the main background (colors.page) and the box
  // behind the floor plan (colors.planBox). Both start on the design's own colors; text and lines on them flip light or
  // dark by contrast when the piece draws (designs/shared/foldcolors.js). A set whose plan sits on the page with no box
  // of its own (defaults.planBox null) has the plan follow the background until the agent picks a plan color.
  //   opt: {value: {page, planBox}, defaults: {page, planBox}, colors: [main, accent, ...] (the brand kit), plan: bool
  //         (the piece shows a floor plan), onChange(colors | null)}
  function foldColors(el, opt){
    const val = Object.assign({}, opt.value || {}), def = opt.defaults || {}, brand = (opt.colors || []).filter(c => /^#[0-9a-f]{6}$/i.test(c));
    injectStyle(); el.classList.add('pe');
    const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
    const STOCK = [['#ffffff', 'White'], ['#f6f1e7', 'Warm white'], ['#eef1f3', 'Cool gray'], ['#1c2436', 'Deep navy'], ['#22332c', 'Forest'], ['#2a2a2a', 'Charcoal']];
    const fromBrand = brand.slice(0, 2).flatMap((c, i) => [[c, i ? 'Your second color' : 'Your main color'], [mix(c, '#ffffff', .86), i ? 'Light shade of your second color' : 'Light shade of your main color']]);
    function row(key, title, sub, std, stdLabel){
      const cur = val[key] || '';
      const list = [['', std, stdLabel]].concat(STOCK.map(([v, t]) => [v, v, t]), fromBrand.map(([v, t]) => [v, v, t]))
        .filter(([v], i, a) => !v || a.findIndex(x => x[0] === v) === i);
      return `<h4>${title}</h4><p class="pe-sub">${sub}</p><div class="pe-papers" data-part="${key}">`
        + list.map(([v, show, t]) => `<button type="button" class="pe-paper" data-p="${esc(v)}" aria-pressed="${cur.toLowerCase() === v.toLowerCase() || (!cur && !v)}" title="${esc(t)}" aria-label="${esc(t)}" style="background:${show}"></button>`).join('')
        + `<label class="pe-own">Your own <input type="color" value="${esc(/^#[0-9a-f]{6}$/i.test(cur) ? cur : std)}" aria-label="${esc(title)}: pick your own"></label>`
        + (cur ? '<button type="button" class="pe-link" data-a="reset">Back to the standard</button>' : '') + '</div>';
    }
    function draw(){
      const pageStd = def.page || '#ffffff', planStd = def.planBox || val.page || pageStd;
      el.innerHTML = row('page', 'Background', "The fold-over's main color. Text and lines switch light or dark so they stay easy to read.", pageStd, 'The design’s own background (standard)')
        + (opt.plan === false ? '' : row('planBox', 'Floor plan box', def.planBox ? 'The box behind your floor plan.' : 'The area behind your floor plan. It matches the background until you pick a color.', planStd, def.planBox ? 'The design’s own plan box (standard)' : 'Same as the background (standard)'));
      el.querySelectorAll('[data-part]').forEach(box => {
        const key = box.dataset.part;
        const set = v => { if(v) val[key] = v; else delete val[key]; draw(); opt.onChange && opt.onChange(Object.keys(val).length ? Object.assign({}, val) : null); };
        box.querySelectorAll('[data-p]').forEach(b => b.onclick = () => set(b.dataset.p));
        box.querySelector('input[type=color]').onchange = e => set(e.target.value);
        const r = box.querySelector('[data-a="reset"]'); if(r) r.onclick = () => set('');
      });
    }
    draw();
    return {set(v){ Object.keys(val).forEach(k => delete val[k]); Object.assign(val, v || {}); draw(); }};
  }

  window.ProofEditor = {event, justSold, planUpload, foldColors, measure, forPrint, toFields, foodFor, photo, LIMITS, HEADS};
})();
