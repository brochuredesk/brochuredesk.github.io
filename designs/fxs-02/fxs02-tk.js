/* fxs-02: the set's tokens as JS values for the pages that draw with their own scripts (Open House flyer, email, socials, carousels).
   Read lazily from fxs02-tokens.css, the one source: TK.ink, TK.band, TK.rule, TK.onInk ... */
window.TK = new Proxy({}, {get: (_, k) => { const g = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  return ({paper: '--fx-paper', band: '--fx-band', ink: '--fx-ink', ink2: '--fx-ink2', text: '--fx-text', textDark: '--fx-text-dark', mute: '--fx-mute', rule: '--fx-rule', onInk: '--fx-on-ink', onInkSoft: '--fx-on-ink-soft'}[k]) ? g(({paper: '--fx-paper', band: '--fx-band', ink: '--fx-ink', ink2: '--fx-ink2', text: '--fx-text', textDark: '--fx-text-dark', mute: '--fx-mute', rule: '--fx-rule', onInk: '--fx-on-ink', onInkSoft: '--fx-on-ink-soft'})[k]) : undefined; }});

// a phrase of 5 or more words repeated inside one caption or paragraph (review r6): returns [{slot, kind, detail}]
window.fxsRepeats = (root) => {
  const out = [], N = 5;
  (root || document).querySelectorAll('[data-slot]').forEach(el => {
    if(el.querySelector('[data-slot]') || !el.getClientRects().length) return;
    const words = (el.textContent || '').toLowerCase().replace(/[\u2019']/g, '').split(/[^a-z0-9\u00e0-\u00ff]+/).filter(Boolean);
    if(words.length < 2*N) return;
    const seen = new Map();
    for(let i = 0; i + N <= words.length; i++){
      const g = words.slice(i, i + N).join(' ');
      if(seen.has(g) && i - seen.get(g) >= 1){ out.push({slot: el.dataset.slot, kind: 'repeated-phrase', detail: `"${g}" appears twice in one text`}); return; }
      seen.set(g, i);
    }
  });
  return out;
};
