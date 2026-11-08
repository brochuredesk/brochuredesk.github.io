/* fxs-09: the one header every piece shares. The neighborhood in copper at the left ("RICE MILITARY") and a fact pair at the right
   ("TWO STORIES · GATED": the stories, then the house's first selling fact). The city is never in the header: it appears once,
   as the copper italic under the address. Used by the cover, the flyer front, the Open House flyer and email, the posts, stories and carousel slides. */
window.FX09HEAD = D => {
  const L = D.listing || {}, fr = (D.sw || {}).front || {}, loc = String(fr.location || '');
  const nb = String(L.neighborhood || loc.split(/\s*·\s*/)[0] || L.city || '').trim();
  const stories = ({1: 'One story', 2: 'Two stories', 3: 'Three stories', 4: 'Four stories'})[L.stories] || '';
  const tags = (fr.tags || (((D.companion || {}).flyer || {}).front || {}).tags || []);
  return {left: nb.toUpperCase(), right: [stories, tags[0] || ''].filter(Boolean).join(' · ').toUpperCase()};
};
