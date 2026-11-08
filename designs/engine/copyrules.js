/* Banned-phrase gate on the printed page, every piece of every design (renderer/render.py, after the template's own
   checks). Same patterns as pipeline/copycheck.py (CONDITION) and the site's package-ai copy checks; change all three.
   The owner, 10/29/2026: copy never mentions the home's condition, repairs, or what a buyer may or may not need to do
   after closing ("You won't be calling a roofer...", "the big-ticket work is already done", "move-in ready").
   10/30/2026 (config/copy-rules.json condition): sample fixtures are exempt (the renderer passes sample: true for data
   files under samples/; their old lines are never rewritten for a newer rule, only real agent output has to pass), and on
   Just Sold pieces or slots an offer to talk through a short list with the reader ("talk through price, timing and
   repairs") is seller advice and passes.
     CopyRules.check({sample, sold, adviceSpan, adviceWords}) -> [{slot, kind:'banned-phrase', rule:'condition'|'school', text}]   empty = passes */
(function(){
  const CONDITION = /\b(after (closing|close|move[- ]in|you move in)|roofers?|electricians?|plumbers?|handyman|repair(s|ed|ing)?|fixer[- ]upper|needs? (some |a little )?(work|tlc|updating|love)|tlc|as[- ]is|deferred maintenance|(?<!air[- ])condition(?!(ed|ing|er))|well[- ](maintained|kept|cared for)|meticulously maintained|immaculate|pristine|like[- ]new|move[- ]in ready|turn[- ]?key|ready to move in|nothing to (do|fix)|no work (needed|to do)|(big|major|heavy)[- ](ticket )?(work|items|jobs|projects)|work (is |was )?(already )?done)\b/i;
  // no copy names or mentions schools, any style (owner 11/2/2026; same pattern in pipeline/copycheck.py and package-ai lint.mjs)
  const SCHOOL = /\bschools?\b|\bISD\b|\belementary\b/i;
  const SOLD_SLOT = /(^|\.)(sold|justSold|just-sold)(\.|$|\[)/i;
  // seller advice on Just Sold: price, pricing and repairs inside a short "talk through ..." list pass (owner 10/30, 10/31)
  const SPAN = /\b(talk|walk|go|run)\s+(you\s+)?(through|over)\s+(?:(?:your\s+|the\s+)?[a-z-]+(?:,\s*(?:and\s+)?|\s+and\s+|(?=[.!?,;]|$))){1,6}/gi;
  const WORDS = /\b(pric(e|ed|ing)|repairs?)\b/gi;
  function allowed(t, slot, o){
    if(!(o.sold || SOLD_SLOT.test(slot || ''))) return t;
    const span = o.adviceSpan ? new RegExp(o.adviceSpan, 'gi') : SPAN, words = o.adviceWords ? new RegExp(o.adviceWords, 'gi') : WORDS;
    return t.replace(span, m => m.replace(words, ' '));
  }
  function check(o){
    o = o || {};
    const out = [];
    if(o.sample) return out;
    for(const el of document.querySelectorAll('[data-slot]')){
      if(el.querySelector('[data-slot]')) continue;
      const t = allowed(el.textContent.trim(), el.dataset.slot, o), m = t.match(CONDITION);
      if(m) out.push({slot: el.dataset.slot, kind: 'banned-phrase', rule: 'condition', text: m[0]});
      const s = el.textContent.match(SCHOOL);
      if(s) out.push({slot: el.dataset.slot, kind: 'banned-phrase', rule: 'school', text: s[0]});
    }
    return out;
  }
  window.CopyRules = {check, CONDITION, allowed};
})();
