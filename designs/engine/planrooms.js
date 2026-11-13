/* PlanRooms (owner 11/13/2026, captions round 3 Q2): every room list that sits beside a floor plan uses the PLAN's own room names
   and dimensions, not the listing's ("Living Room 13' x 20'" where the plan prints LIVING ROOM 13'6" x 20'8", never the MLS
   "Game Room 21' x 14'"). The plan is never changed; this only reads its labels.
   Where the labels come from: each image level of data.plan carries
     - roomBoxes [{name, dims, box: [x, y, w, h]}]: a real order's read (package-ai 'plan-rooms', cheap model, config/models.json), or
     - planRooms [{name, dims, at: [x, y]}]: a sample plan's read (samples/plan-reads.json, attached by renderer/planreads.py).
   A level with neither leaves the list as the listing has it.
   Use: PlanRooms.has(D) -> any level read
        PlanRooms.match(D, rows, opt) -> rows with each room's name and size taken from the plan room it is
          rows: [{name, size, level}] (level: 0-based plan level, or null when unknown); opt.levelOf(row, i) may give it
          returns [{name, size, level, from: 'plan'|'listing', was}] in the same order; a room the plan doesn't label keeps its own
        PlanRooms.rename(text, rows) -> text with each renamed room's old name (as words) replaced by its plan name, case kept
        PlanRooms.ft(dims) -> feet only (13'6" x 20'8" -> 13' x 20'), as renderer/feet.py */
(function(root){
  const PR = {};
  // spaces that are not rooms on a room list (circulation, closets, voids)
  const NOT_ROOM = /^(hall|hallway|stairs?|stairwell|stairway|landing|open to below|open below|closet|coat closet|linen|w\.?\s*i\.?\s*c\.?|walk-?in closet|pantry|chase|mech(anical)?|a\/?c|storage)$/i;
  // feet only, inches dropped, never rounded up (owner 11/1/2026)
  const SIDE = `(\\d{1,3})(?:\\.\\d{1,2}|\\s*['’′](?:\\s*-?\\s*\\d{1,2}\\s*["”″]?)?|\\s*(?:ft|feet)(?:\\s*\\d{1,2}\\s*(?:in|inches))?)?`;
  const FT = new RegExp(`^\\s*${SIDE}\\s*[x×]\\s*${SIDE}\\s*$`, 'i');
  PR.ft = s => { const m = String(s || '').match(FT); return m ? `${m[1]}' x ${m[2]}'` : String(s || '').trim(); };
  const area = s => { const m = String(s || '').match(FT); return m ? (+m[1]) * (+m[2]) : 0; };
  const sides = s => { const m = String(s || '').match(FT); return m ? [+m[1], +m[2]].sort((a, b) => a - b) : null; };
  // a printed label in plain title case (LIVING ROOM -> Living Room; W.I.C. and "2" kept)
  PR.title = s => { s = String(s || '').replace(/\s+/g, ' ').trim();
    return s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s\-\/(])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bW\.i\.c\./i, 'W.I.C.') : s; };
  const key = s => String(s || '').toLowerCase().replace(/\bmaster\b/g, 'primary').replace(/\b(room|area|the)\b/g, ' ').replace(/[^a-z]+/g, ' ').trim();
  PR.rooms = L => {
    if(!L) return [];
    if(Array.isArray(L.planRooms) && L.planRooms.length) return L.planRooms.map(r => ({name: PR.title(r.name), dims: String(r.dims || ''), at: r.at || [0.5, 0.5]}));
    if(Array.isArray(L.roomBoxes) && L.roomBoxes.length) return L.roomBoxes.filter(r => r && r.name).map(r => ({name: PR.title(r.name), dims: String(r.dims || ''),
      at: Array.isArray(r.box) ? [r.box[0] + r.box[2]/2, r.box[1] + r.box[3]/2] : [0.5, 0.5]}));
    return [];
  };
  const levels = D => ((D && D.plan && D.plan.levels) || []).filter(L => L && L.kind === 'image');
  PR.has = D => levels(D).some(L => PR.rooms(L).length);
  PR.match = (D, rows, opt) => {
    opt = opt || {};
    const lv = levels(D).map(L => PR.rooms(L).map(r => Object.assign({}, r, {used: false})));
    const out = (rows || []).map((r, i) => ({name: r.name, size: r.size, level: opt.levelOf ? opt.levelOf(r, i) : r.level, from: 'listing', was: r.name}));
    if(!lv.some(x => x.length)) return out;
    const pool = l => l != null && l >= 0 && lv[l] ? [lv[l]] : lv;
    const take = (row, p, by) => { p.used = true; row.by = by; row.name = p.name; row.size = p.dims ? PR.ft(p.dims) : row.size; row.from = 'plan'; };
    // 1. the same name on the same floor (Dining -> Dining Area; Master -> Primary; Full Bath -> Bath)
    for(const row of out){ const k = key(row.name); if(!k) continue;
      for(const L of pool(row.level)){
        const p = L.find(q => !q.used && key(q.name) === k) || L.find(q => !q.used && !NOT_ROOM.test(q.name) && key(q.name) && (k.endsWith(' ' + key(q.name)) || key(q.name).endsWith(' ' + k) || k.startsWith(key(q.name) + ' ') || key(q.name).startsWith(k + ' ')));
        if(p){ take(row, p, 'name'); break; } } }
    // 2. a room the plan names differently (the MLS "Game Room" is the plan's "Living Room"): the one unused room on that floor whose
    //    size is within 15% (either way round); only when exactly one fits, so nothing is guessed
    for(const row of out){ if(row.from === 'plan') continue; const a = area(row.size), sd = sides(row.size); if(!a) continue;
      const fits = [];
      for(const L of pool(row.level)) for(const q of L){ const b = area(q.dims), qs = sides(q.dims);
        if(!q.used && b && !NOT_ROOM.test(q.name) && Math.abs(a - b) <= 0.15 * Math.max(a, b) && Math.abs(sd[0] - qs[0]) <= 2 && Math.abs(sd[1] - qs[1]) <= 2) fits.push(q); }
      if(fits.length === 1) take(row, fits[0], 'size'); }
    // a plan name the list already shows on another row stays told apart by the listing's word (two "Bath" rows: keep the listing's names)
    const seen = {};
    for(const row of out) if(row.from === 'plan'){ const k = row.name.toLowerCase(); seen[k] = (seen[k] || 0) + 1; }
    for(const row of out) if(row.from === 'plan' && seen[row.name.toLowerCase()] > 1 && row.was && key(row.was) !== key(row.name)) row.name = row.was;
    return out;
  };
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  PR.rename = (text, rows) => {
    let t = String(text == null ? '' : text);
    for(const r of rows || []){
      if(r.from !== 'plan' || r.by !== 'size' || !r.was || r.was.toLowerCase() === r.name.toLowerCase()) continue;   // only a room the plan calls something else
      // only a whole room name (game room -> living room), never a word inside another name; the case as written
      t = t.replace(new RegExp(`\\b${esc(r.was)}\\b`, 'gi'), m => m === m.toLowerCase() ? r.name.toLowerCase() : m === m.toUpperCase() ? r.name.toUpperCase() : r.name);
    }
    return t;
  };
  root.PlanRooms = PR;
  if(typeof module !== 'undefined' && module.exports) module.exports = PR;
})(typeof window !== 'undefined' ? window : globalThis);
