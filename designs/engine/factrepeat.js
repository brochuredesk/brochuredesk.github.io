/* A write-up never repeats a fact the same piece already shows (the owner, 10/28/2026).
   Beds, baths, square feet, year built, lot size, stories and garage spaces printed as facts (a fact row, a stats bar,
   an icon list) are not said again in a paragraph on the same piece. Runs on every render (renderer/render.py, every
   design and piece kind) after the template's own checks, and templates may use it to leave such sentences out.
     FactRepeat.facts(text)            -> ['bed:3', 'bath:2', 'sqft:1385', 'year:1940', ...]  what a text states
     FactRepeat.repeats(sentence, shown) -> the facts in `sentence` that a list of shown fact texts already states
     FactRepeat.check()                -> [{slot, kind:'repeats-shown-fact', detail}]   empty = passes
   A paragraph is any [data-slot] element of 8 words or more that ends like a sentence (not a fact row or fine print); everything else on the piece (every text outside that
   paragraph, scripts and styles left out) counts as shown. A year counts only where the piece shows it as the year built. */
(function(){
  const WORDS = {one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12, single:1};
  const num = s => { s = String(s).toLowerCase().replace(/,/g, ''); return WORDS[s] != null ? WORDS[s] : parseFloat(s); };
  const N = '(\\d[\\d,]*(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|single)';
  const RX = [
    ['bed', new RegExp(`\\b${N}[\\s-]+(?:bed(?:room)?s?|br)\\b`, 'g')],
    ['bath', new RegExp(`\\b${N}[\\s-]+(?:full[\\s-]+)?(?:bath(?:room)?s?|ba)\\b`, 'g')],
    ['bath', new RegExp(`\\b${N}\\s+full\\b`, 'g')],
    ['half', new RegExp(`\\b${N}[\\s-]+half(?:[\\s-]+bath(?:room)?s?)?\\b`, 'g')],
    ['lot', new RegExp(`\\b${N}[\\s-]*(?:sq\\.?\\s*ft\\.?|square[\\s-]+f(?:ee|oo)t|acres?)[\\s-]+lot\\b`, 'g')],
    ['lot', new RegExp(`\\blot(?:\\s+(?:of|size|is))?:?\\s+(?:about\\s+)?${N}[\\s-]*(?:sq\\.?\\s*ft\\.?|square[\\s-]+feet|acres?)`, 'g')],
    ['sqft', new RegExp(`\\b${N}[\\s-]*(?:sq\\.?\\s*ft\\.?|square[\\s-]+f(?:ee|oo)t|sf)\\b(?![\\s-]+lot)`, 'g')],
    ['stories', new RegExp(`\\b${N}[\\s-]+stor(?:y|ies)\\b`, 'g')],
    ['garage', new RegExp(`\\b${N}[\\s-]+car\\s+garage\\b`, 'g')],
  ];
  function facts(text, opts){
    const t = String(text || '').toLowerCase().replace(/[‐-—]/g, '-').replace(/(\d+)\s*½\s*(baths?)/g, '$1 $2, 1 half bath'), out = new Set();   // "3½ baths" is 3 full and 1 half (baths.js)
    for(const [k, rx] of RX){ rx.lastIndex = 0; let m; while((m = rx.exec(t))){ const v = num(m[1]); if(isFinite(v) && v > 0) out.add(`${k}:${v}`); } }
    if(/\ball on one (floor|level)\b|\bsingle[\s-]+level\b/.test(t)) out.add('stories:1');
    // years: as the year built where it is shown ("Built in 1940", "Year built 1940"); any mention in a paragraph
    if(opts && opts.shown){ const rx = /\b(?:built(?:\s+in)?|year\s+built:?)\s+((?:18|19|20)\d\d)\b/g; let m; while((m = rx.exec(t))) out.add('year:' + m[1]); }
    else { const rx = /\b((?:18|19|20)\d\d)\b/g; let m; while((m = rx.exec(t))) out.add('year:' + m[1]); }
    return [...out];
  }
  const LABEL = {bed:'bedrooms', bath:'baths', half:'half baths', sqft:'square feet', year:'year built', lot:'lot size', stories:'stories', garage:'garage'};
  function repeats(sentence, shownTexts){
    const shown = new Set(shownTexts.flatMap(t => facts(t, {shown: true})));
    return facts(sentence).filter(f => shown.has(f));
  }
  // a fact row ("3 bedrooms | 2 baths | 1,385 square feet", slots fact.*, *.facts, *.stats) is what is shown, never a write-up;
  // fine print (a disclosure such as "Square footage from HCAD") is never one either
  const PROSE = el => !el.dataset.fine && !/fine ?print/i.test(el.dataset.slot) && !/(^|\.)(facts?|stats?\d*|status)(\.|\d|$)/i.test(el.dataset.slot) && /[a-z][.!?](\s|$)/i.test(el.textContent);
  const wordsIn = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  function visible(el){ const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; }
  function textOutside(el){
    const parts = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {acceptNode: n => {
      for(let p = n.parentElement; p; p = p.parentElement){ if(p === el || /^(SCRIPT|STYLE|TEMPLATE)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT; }
      return visible(n.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }});
    while(w.nextNode()) parts.push(w.currentNode.textContent);
    return parts.join('\n');
  }
  function check(){
    const out = [];
    for(const el of document.querySelectorAll('[data-slot]')){
      if(!visible(el) || wordsIn(el.textContent) < 8 || el.querySelector('[data-slot]') || !PROSE(el)) continue;
      const hit = repeats(el.textContent, [textOutside(el)]);
      if(hit.length) out.push({slot: el.dataset.slot, kind: 'repeats-shown-fact',
        detail: `the write-up repeats ${hit.map(f => `${LABEL[f.split(':')[0]]} (${f.split(':')[1]})`).join(', ')}, already shown on this piece`});
    }
    return out;
  }
  /* Repeated wording (the owner, 11/9/2026 captions review p107, p117; build must fail, 11/10): no phrase repeats inside a caption or
     across the captions and write-ups of one piece ("windows along one wall" twice), and no two captions open the same way ("A high
     tray ceiling with a fan" twice).
       FactRepeat.phrases({minWords, minContent, openWords}) -> [{slot, slots, kind:'phrase-repeat'|'caption-same-opening', detail, level:'fail'}]
     A phrase is minWords (4) words in a row with at least minContent (3) content words (not a, the, of, with, numbers...). An
     opening is the first openWords (3) words of a write-up of 8 words or more (not a title or call to action), with two content words.
     Copy is any [data-slot] text of 5 words or more (not the agent card, brokerage lines, fine print, facts or the event). */
  const SMALL = new Set('a an the of to in on at by for with and or but is are was were be been it its this that these those from as into onto over under up off out than then so there here has have had their his her your our you we they he she each every all any one two three four five six seven eight nine ten'.split(' '));
  const NOT_COPY = /^(agent|broker|contact|cc|oh)\.|fine|legal|disc|fact|stat|address|place$|price|footer/i;
  const toks = t => String(t || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' -]+/g, ' ').split(/\s+/).filter(Boolean);
  function phrases(o){
    o = Object.assign({minWords: 4, minContent: 3, openWords: 3}, o || {});
    const out = [], items = [];
    for(const el of document.querySelectorAll('[data-slot]')){
      if(!visible(el) || el.querySelector('[data-slot]') || NOT_COPY.test(el.dataset.slot) || el.dataset.fine) continue;
      const w = toks(el.textContent); if(w.length >= 5) items.push({slot: el.dataset.slot, w, text: el.textContent.trim()});
    }
    const uniq = []; for(const it of items) if(!uniq.some(u => u.text === it.text)) uniq.push(it);   // the same text twice is one item
    const content = g => g.filter(x => !SMALL.has(x) && !/^\d/.test(x)).length;
    // every repeated run, merged to its longest form: positions of each n-gram hit in the first item that has it
    const seen = new Map(), runs = [];
    uniq.forEach((it, k) => {
      const at = new Map();
      for(let n = o.minWords; n <= o.minWords; n++) for(let i = 0; i + n <= it.w.length; i++){
        const g = it.w.slice(i, i + n), c = content(g); if(c < o.minContent) continue;
        const key = g.join(' ');
        if(at.has(key) && at.get(key) + n <= i) runs.push({a: k, i: at.get(key), b: k, j: i, n});   // twice inside one caption
        else if(!at.has(key)) at.set(key, i);
        if(seen.has(key) && seen.get(key).k !== k) runs.push({a: seen.get(key).k, i: seen.get(key).i, b: k, j: i, n});
        else if(!seen.has(key)) seen.set(key, {k, i});
      }
    });
    // join runs of the same two texts that overlap or touch (one longer phrase, one hit)
    runs.sort((x, y) => x.a - y.a || x.b - y.b || (x.j - x.i) - (y.j - y.i) || x.i - y.i);
    const merged = [];
    for(const r of runs){ const m = merged.find(q => q.a === r.a && q.b === r.b && q.j - q.i === r.j - r.i && r.i <= q.i + q.n && r.i + r.n >= q.i);
      if(m){ const s0 = Math.min(m.i, r.i), e0 = Math.max(m.i + m.n, r.i + r.n); m.j += s0 - m.i; m.i = s0; m.n = e0 - s0; } else merged.push(Object.assign({}, r)); }
    const said = new Set();
    for(const r of merged){ const ph = uniq[r.a].w.slice(r.i, r.i + r.n).join(' '), sl = [...new Set([uniq[r.a].slot, uniq[r.b].slot])];
      if(said.has(ph)) continue; said.add(ph);
      out.push({slot: sl[sl.length - 1], slots: sl, kind: 'phrase-repeat', level: 'fail', detail: `"${ph}" is said twice (${sl.join(', ')}): rewrite one with other true detail`}); }
    // two short captions that say the same thing in other words (11/11: "A recessed light shines overhead." / "Recessed lights shine
    // overhead."): most of the shorter one's content-word stems (light/lights, shine/shines) in the other; both under 15 words, 3+ stems
    const stem = w => w.replace(/ies$/, 'y').replace(/(es|s|ed|ing)$/, '');
    const st = it => new Set(it.w.filter(x => !SMALL.has(x) && !/^\d/.test(x)).map(stem).filter(x => x.length > 1));
    const short = uniq.filter(it => it.w.length < 15).map(it => Object.assign({S: st(it)}, it));
    for(let i = 0; i < short.length; i++) for(let j = i + 1; j < short.length; j++){
      const A = short[i].S, B = short[j].S, m = Math.min(A.size, B.size); if(m < 3) continue;
      let k = 0; A.forEach(x => { if(B.has(x)) k++; });
      if(k/m >= .8) out.push({slot: short[j].slot, slots: [short[i].slot, short[j].slot], kind: 'phrase-repeat', level: 'fail', detail: `${short[i].slot} and ${short[j].slot} say the same thing in other words ("${short[i].text.slice(0, 40)}" / "${short[j].text.slice(0, 40)}")`});
    }
    const open = new Map();
    for(const it of uniq){ const g = it.w.slice(0, o.openWords); if(it.w.length < 8 || /(^|\.)(h|t|head|heading|title|name|label|cta|call|sub|big|kicker)\d*$/i.test(it.slot) || g.length < o.openWords || content(g) < 2) continue; const key = g.join(' ');
      if(open.has(key)) out.push({slot: it.slot, slots: [open.get(key), it.slot], kind: 'caption-same-opening', level: 'fail', detail: `${open.get(key)} and ${it.slot} both open "${key} ..."`});
      else open.set(key, it.slot); }
    return out;
  }
  window.FactRepeat = {facts, repeats, check, phrases};
})();
