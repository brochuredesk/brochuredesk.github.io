/* fxs-24: the set's tokens as JS values (read lazily from fxs24-tokens.css, the one source). */
window.TK = new Proxy({}, {get: (_, k) => { const m = {paper: '--fx-paper', card: '--fx-tint', seal: '--fx-seal', ink: '--fx-ink', text: '--fx-text', mute: '--fx-mute', accent: '--fx-blue', rule: '--fx-rule', onInk: '--fx-on-ink',
  band: '--fx-blue', ink2: '--fx-blue', textDark: '--fx-ink', onInkSoft: '--fx-on-blue-soft', blue: '--fx-blue', blueDeep: '--fx-blue-deep'};
  return m[k] ? getComputedStyle(document.documentElement).getPropertyValue(m[k]).trim() : undefined; }});
