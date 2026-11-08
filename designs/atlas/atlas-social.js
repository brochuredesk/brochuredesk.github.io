/* The Atlas signature on its socials (owner 10/31, standing rule 7: the set's signature on every piece): the street map,
   drawn by the set's own code (atlas-map.js) as on the flyer, postcards and email: the listing's pin, its neighbors named,
   north arrow and quarter-mile scale, credited under it. The shared social engines (templates/_shared/socialset.js and
   OHEmail.social) give it the row the interiors would take on posts, pins and squares, and the text-safe space under the
   card on stories. Map labels at 11 pt (29 px of the PNG) so they read on a phone; the credit at 9 pt as small print.
   Loaded by social.html (Just Listed and Just Sold) and email.html (the Open House socials). */
(function(){
  const CREDIT = 'Street map drawn from OpenStreetMap data. © OpenStreetMap contributors';
  window.SocialSignature = {
    // owner 11/2: bigger on the story (its house photo gives up the room) and the square (past .23 the square loses the agent's name)
    min: shape => shape === 'square' ? .23 : .2,
    on: D => !!D.map,   // a listing with no map data keeps the interiors
    html: (x, y, w, h) => {
      if(h < 40) return '';
      const cr = 13, mh = h - cr - 3;
      return AT.mapBox('social-map', x, y, w, mh, ((((AT.data().copy || {}).pc || {}).oh || {}).a || {}).extras || [], true, false, true).replace('class="mapbox abs"', 'class="mapbox abs" data-small="1" data-lbl="11"')
        + `<div class="abs nw" data-fine="1" data-small="1" style="left:${x + 6}pt;top:${y + mh + 2}pt;width:${w - 12}pt;height:${cr}pt;font:400 9pt/${cr}pt var(--font-body);color:var(--muted);text-align:right">${CREDIT}</div>`;
    }
  };
  // after the page lays out: draw the map (every .mapbox: the email's own map too), and add the map's own issues to the piece's checks
  window.atlasSocialMap = () => { window.brochureReady = window.brochureReady.then(() => {
    const D = AT.data(), sm = document.getElementById('social-map');
    let issues = document.querySelector('.mapbox') ? AT.drawMaps(D).filter(i => i.slot !== 'social-map') : [];
    // a short strip names as many of the Map Index places as fit without a label running into another or off the map
    if(sm){
      const idx = AT.mapIndex(D).filter(i => !i.far), extras = JSON.parse(sm.dataset.extras || '[]');
      for(let n = idx.length; n >= 0; n--){
        const got = AT.drawMap(sm, D, {index: idx.slice(0, n), mapExtras: n === idx.length ? extras : [], star: true, lbl: 11, wide: true}).map(i => Object.assign(i, {slot: 'social-map'}));
        if(!n || !got.some(i => /^map-label/.test(i.kind))){ issues = issues.concat(got); break; }
      }
    }
    const base = window.brochureCheck;
    if(base) window.brochureCheck = () => base().concat(issues);
  }); };
})();
