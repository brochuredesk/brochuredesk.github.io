/* The Neighborhood Atlas street map data for a real listing (11/8/2026).
   The samples carry data.map, made once by scripts/r2/atlas_map.py. A real listing in the ordering flow has none, so every Atlas
   piece drew "map-missing" and was held back from the live flow. AT.ensureMap(D) fills D.map the same way, in the page:
     1. the listing's point: listing.lat/lng when given, else the address looked up on OpenStreetMap's Nominatim (free, no key);
        the sample listing (a made-up street) falls back to its ZIP
     2. streets, parks, water and named places within 1,700 m from the Overpass API (the query atlas_map.py runs), in local
        meters (x east, y south, the listing at 0,0); the city's downtown as the far arrow when it sits off the map
     3. Map Index and extra labels: the copy's own names when they are on this map; any that aren't are picked here from the
        map (nearest park, nearest grocery or cafe, downtown), so the index never shows a place the map can't draw
   The map is kept in localStorage per address (one lookup for every Atlas piece of a listing; Web Locks keep the gallery's
   frames from all asking at once) and left on window.atlasMapData for the order flow to save with the package.
   (c) OpenStreetMap contributors, ODbL; every piece credits it under the map. */
(function(){
  const AT = window.AT || (window.AT = {});
  const R = 1700, VER = 1;
  const KEEP = new Set(['residential','unclassified','tertiary','secondary','primary','trunk','motorway']);
  const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];   // public Overpass mirrors, CORS open; the main OSM one first, the others only if it refuses or times out (on 11/8 only maps.mail.ru answered, in 17 s)
  const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
  const STATES = {texas:'TX', louisiana:'LA', oklahoma:'OK', 'new mexico':'NM', arkansas:'AR'};
  const straight = s => typeof s === 'string' ? s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"') : s;

  const timed = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
  async function geocode(q){
    const u = NOMINATIM + '?' + new URLSearchParams(Object.assign({format: 'jsonv2', limit: '1', countrycodes: 'us', addressdetails: '1'}, q));
    const r = await timed(fetch(u, {headers: {'Accept': 'application/json'}}), 20000);
    if(!r.ok) throw new Error('geocode ' + r.status);
    const j = await r.json();
    return j && j[0] ? {lat: +j[0].lat, lon: +j[0].lon, house: !!(j[0].address && j[0].address.house_number), type: j[0].addresstype || j[0].type || ''} : null;
  }
  async function overpass(q){
    let last;
    for(const url of OVERPASS.concat(OVERPASS)){
      try {
        const r = await timed(fetch(url, {method: 'POST', body: new URLSearchParams({data: q})}), 120000);
        if(r.ok) return await r.json();
        last = new Error('overpass ' + r.status);
      } catch(e){ last = e; }
      await new Promise(ok => setTimeout(ok, 1500));
    }
    throw last;
  }

  // the listing's point: [lat, lon, how found]
  async function locate(L, sample){
    if(isFinite(+L.lat) && isFinite(+(L.lng ?? L.lon)) && +L.lat) return [+L.lat, +(L.lng ?? L.lon), 'given'];
    const st = STATES[String(L.state || '').toLowerCase()] || L.state || '';
    const street = String(L.address || '').replace(/\s+(#|apt|unit|ste)\s*\S+$/i, '');
    const tries = [
      [{street, city: L.city || '', state: st, postalcode: L.zip || ''}, 'address'],
      [{q: [street, L.city, st, L.zip].filter(Boolean).join(', ')}, 'address'],
    ];
    if(sample && L.zip) tries.push([{postalcode: L.zip, country: 'us'}, 'zip']);   // the sample listing's street is made up
    for(const [q, how] of tries){
      try {
        const g = await geocode(q);
        if(g && (how !== 'address' || g.house || /road|street|residential|house|building|place/.test(g.type))) return [g.lat, g.lon, g.house ? 'house' : how];
      } catch(e){}
      await new Promise(ok => setTimeout(ok, 1100));   // Nominatim: one request a second
    }
    return null;
  }

  async function build(L, sample){
    const at = await locate(L, sample);
    if(!at) return {err: 'address-not-found'};
    const [lat0, lon0, how] = at;
    const kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 110574;
    const xy = (lat, lon) => [Math.round((lon - lon0) * kx), Math.round(-(lat - lat0) * ky)];
    const A = `(around:${R},${lat0},${lon0})`;
    const q = `[out:json][timeout:80];(
 way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|motorway_link|trunk_link|primary_link)$"]${A};
 way["leisure"~"^(park|playground|garden|golf_course)$"]${A};
 way["natural"="water"]${A};
 way["waterway"~"^(river|stream|canal|riverbank)$"]${A};
 nwr["amenity"~"^(cafe|restaurant|library|school|marketplace|arts_centre|theatre)$"]["name"]${A};
 nwr["tourism"~"^(museum|gallery|attraction)$"]["name"]${A};
 nwr["shop"~"^(supermarket|mall)$"]["name"]${A};
 nwr["leisure"~"^(park|garden)$"]["name"]${A};
);out geom;`;
    const data = await overpass(q);
    const ways = [], areas = [], places = [];
    for(const e of data.elements || []){
      const t = e.tags || {};
      if(e.type === 'way' && e.geometry){
        const p = e.geometry.map(g => xy(g.lat, g.lon));
        if(t.highway){ const c = t.highway.replace('_link', ''); if(KEEP.has(c)) ways.push({n: straight(t.name || ''), c, p}); }
        else if(/^(park|playground|garden|golf_course)$/.test(t.leisure || '')) areas.push({k: 'park', line: false, p});
        else if(t.natural === 'water' || t.waterway) areas.push({k: 'water', line: /^(river|stream|canal)$/.test(t.waterway || ''), p});
      }
      if(t.name && !t.highway && !t.waterway && t.natural !== 'water'){
        let plat, plon;
        if(e.type === 'node'){ plat = e.lat; plon = e.lon; }
        else if(e.geometry && e.geometry.length){ plat = e.geometry.reduce((a, g) => a + g.lat, 0) / e.geometry.length; plon = e.geometry.reduce((a, g) => a + g.lon, 0) / e.geometry.length; }
        else if(e.bounds){ plat = (e.bounds.minlat + e.bounds.maxlat) / 2; plon = (e.bounds.minlon + e.bounds.maxlon) / 2; }
        else continue;
        const k = t.amenity || t.tourism || t.shop || t.leisure, [x, y] = xy(plat, plon);
        if(k) places.push({n: straight(t.name), k, x, y, m: Math.round(Math.hypot(x, y)), addr: straight([t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' '))});
      }
    }
    const seen = new Set(), uniq = [];
    places.sort((a, b) => a.m - b.m).forEach(p => { const k = p.n + '|' + p.k; if(!seen.has(k)){ seen.add(k); uniq.push(p); } });
    // the far arrow: the city's downtown when it sits off the map
    const far = [];
    if(L.city){
      try {
        await new Promise(ok => setTimeout(ok, 1100));
        const c = await geocode({city: L.city, state: STATES[String(L.state || '').toLowerCase()] || L.state || ''});
        if(c){ const [x, y] = xy(c.lat, c.lon), m = Math.round(Math.hypot(x, y)); if(m > R) far.push({n: 'Downtown ' + L.city, x, y, m, k: 'far'}); }
      } catch(e){}
    }
    return {map: {ways, areas, places: uniq, far, credit: '© OpenStreetMap contributors', center: [lat0, lon0], radius: R, found: how}};
  }

  // the copy's Map Index and extra labels, kept where the map has them; the rest picked from the map
  function fitIndex(D, built){
    const M = D.map, all = [...(M.places || []), ...(M.far || [])];
    D.copy = D.copy || {}; const K = D.copy.cover = D.copy.cover || {};
    if(!built) return;   // a map that came with the data (every sample) keeps the copy's index as written
    // the places the map can label around the house: the widest Atlas map box shows about 2.8 km across and 0.9 km top to
    // bottom, with the house and every labeled place inside it (owner-approved maps put the index within about 400 m)
    const fits = p => Math.abs(p.y) <= 380 && Math.abs(p.x) <= 700;
    const ok = n => { const p = all.find(q => q.n === n); return !!p && (p.k === 'far' || fits(p)); };
    const near = (kinds, max) => (M.places || []).find(p => kinds.test(p.k) && !used.has(p.n) && p.m <= max && fits(p));
    const idx = (K.index || []).filter(i => i && ok(i.name)).slice(0, 3), used = new Set(idx.map(i => i.name));
    const want = [
      ['park', () => near(/^(park|garden)$/, 2000), p => ({name: p.n, kind: 'park'})],
      ['place', () => near(/^(supermarket|marketplace)$/, 2400) || near(/^(cafe|library|museum)$/, 2400) || near(/^restaurant$/, 2400), p => ({name: p.n, kind: 'place'})],
      ['far', () => (M.far || [])[0], p => ({name: p.n, far: true})],
    ];
    for(const [kind, pick, make] of want){
      if(idx.length >= 3) break;
      if(idx.some(i => kind === 'far' ? i.far : !i.far && (i.kind === 'park') === (kind === 'park'))) continue;
      const p = pick(); if(p && !used.has(p.n)){ idx.push(make(p)); used.add(p.n); }
    }
    while(idx.length < 3){   // a quiet block: the next nearest named places
      const p = near(/./, 2400); if(!p) break; idx.push({name: p.n, kind: /^(park|garden)$/.test(p.k) ? 'park' : 'place'}); used.add(p.n);
    }
    // the far arrow goes last, the way the approved index reads
    K.index = idx.filter(i => !i.far).concat(idx.filter(i => i.far));
    const ex = (K.mapExtras || []).filter(n => ok(n) && !used.has(n));
    (M.places || []).filter(p => !used.has(p.n) && !ex.includes(p.n) && fits(p) && /^(supermarket|cafe|restaurant|library|museum)$/.test(p.k)).slice(0, Math.max(0, 2 - ex.length)).forEach(p => ex.push(p.n));
    K.mapExtras = ex;
    // the other pieces' own label lists keep only the places their boxes can show: the postcards' thin strip (86 pt tall,
    // about 300 m top to bottom) and the flyer's map
    const strip = p => Math.abs(p.y) <= 90 && Math.abs(p.x) <= 1200;
    const keepIn = (list, test) => (list || []).filter(n => { const p = all.find(q => q.n === n); return !!p && p.k !== 'far' && test(p); });
    const PC = (D.copy.pc || {});
    ['jl', 'js'].forEach(s => { const c = PC[s]; if(!c) return; ['stripExtras', 'extras'].forEach(f => { if(Array.isArray(c[f])) c[f] = keepIn(c[f], strip); }); });
    const OA = (PC.oh || {}).a;   // the Open House flyer's zoomed-out map (about 2.4 km across)
    if(OA && Array.isArray(OA.extras)) OA.extras = keepIn(OA.extras, p => Math.abs(p.y) <= 1100 && Math.abs(p.x) <= 1100);
    D.companion = D.companion || {}; const FL = D.companion.flyer = D.companion.flyer || {};
    // the flyer's small map (262 pt wide) labels only these, no index rows: up to three places close around the house, spaced
    // so their labels stay clear of each other and of the scale bar in the lower left (the approved sample: three within 300 m)
    {
      const own = Array.isArray(FL.mapExtras) ? FL.mapExtras : [];
      const named = own.concat(K.index.filter(i => !i.far).map(i => i.name), K.mapExtras,
        (M.places || []).filter(p => /^(park|garden|cafe|restaurant|supermarket|library|museum)$/.test(p.k)).map(p => p.n));
      const small = p => Math.abs(p.y) <= 200 && Math.abs(p.x) <= 650 && Math.hypot(p.x, p.y) >= 90 && !(p.x < -250 && p.y > 60);
      const pick = [];
      [...new Set(named)].forEach(n => { const p = all.find(q => q.n === n);
        if(p && p.k !== 'far' && pick.length < 3 && small(p) && pick.every(o => Math.abs(o.y - p.y) >= 110 || Math.abs(o.x - p.x) >= 520)) pick.push(p); });
      FL.mapExtras = pick.map(p => p.n);
    }
  }

  const keyOf = L => 'atlas-map:' + VER + ':' + [L.address, L.city, L.zip, L.lat, L.lng].map(v => String(v ?? '').toLowerCase().trim()).join('|');
  const load = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch(e){ return null; } };
  const keep = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){ try {   // storage full: drop only older Atlas maps, never the order page's own saved work
    Object.keys(localStorage).filter(x => x.startsWith('atlas-map:') && x !== k).forEach(x => localStorage.removeItem(x)); localStorage.setItem(k, JSON.stringify(v)); } catch(e2){} } };

  // fills D.map (and the index) for a listing that has none; returns print-check issues ([] when the map is there)
  AT.ensureMap = async function(D){
    if(!D || !D.listing) return [];
    const built = !D.map;
    if(built){
      const k = keyOf(D.listing);
      const run = async () => {
        let got = load(k);
        if(!got){ try { got = await build(D.listing, !!D.sample); } catch(e){ got = {err: 'map-service ' + (e && e.message || e)}; }
                  if(got && got.map) keep(k, got); }
        return got;
      };
      const got = navigator.locks ? await navigator.locks.request('atlas-map', run) : await run();
      if(!got || !got.map) return [{slot: 'map', kind: 'map-missing', detail: (got && got.err) || 'no map data'}];
      D.map = got.map;
    }
    fitIndex(D, built);
    window.atlasMapData = D.map;
    return D.map.found === 'zip' && !D.sample ? [{slot: 'map', kind: 'map-center-approx', detail: 'the address was not found; the map is centered on the ZIP'}] : [];
  };
})();
