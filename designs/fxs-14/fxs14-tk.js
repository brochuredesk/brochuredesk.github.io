/* fxs-14: the set's tokens as JS values (read lazily from fxs14-tokens.css, the one source). */
window.TK = new Proxy({}, {get: (_, k) => { const m = {paper: '--fx-paper', card: '--fx-card', seal: '--fx-seal', ink: '--fx-ink', text: '--fx-text', mute: '--fx-mute', accent: '--fx-accent', rule: '--fx-rule', onInk: '--fx-on-ink',
  band: '--fx-card', ink2: '--fx-accent', textDark: '--fx-ink', onInkSoft: '--fx-rule'};
  return m[k] ? getComputedStyle(document.documentElement).getPropertyValue(m[k]).trim() : undefined; }});
