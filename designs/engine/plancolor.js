/* PlanColor (owner 11/13/2026, captions round 3 Q4): does a listing's floor plan have colored rooms? Plain image analysis, no AI.
   A room fill is a wide area of tinted (not gray) paper: tinted pixels are found, the mask is eroded so colored lines, text and
   thin hatching drop out, and a plan whose tinted fills cover at least MIN_FILL of the picture has colored rooms.
   Same rule as renderer/plancolor.py (keep the two alike). The result goes in data.plan.colored; PlanInk.panel (ivory/planink.js)
   then puts the plan on a light panel on a dark field and keeps it exactly as given.
   Use: PlanColor.measure(rgba, W, H) -> {fill, colored}   (rgba: Uint8ClampedArray, e.g. getImageData().data)
        PlanColor.ofImage(imgOrCanvas) -> {fill, colored}  (browser)
        await PlanColor.mark(plan) -> plan with plan.colored and each image level's coloredRooms (unless plan.colored is set) */
(function(root){
  const MAX_SIDE = 800, SAT = 14, LUM0 = 60, LUM1 = 250, ERODE = 0.006, MIN_FILL = 0.05;
  const PC = {MAX_SIDE, SAT, MIN_FILL};
  // a square erosion (min filter) of radius r, done as two 1-D passes
  const erode = (m, W, H, r) => {
    const t = new Uint8Array(W * H), o = new Uint8Array(W * H);
    for(let y = 0; y < H; y++){ let run = 0; const row = y * W;
      for(let x = 0; x < W; x++){ run = m[row + x] ? run + 1 : 0; if(run >= 2 * r + 1) t[row + x - r] = 1; } }
    for(let x = 0; x < W; x++){ let run = 0;
      for(let y = 0; y < H; y++){ run = t[y * W + x] ? run + 1 : 0; if(run >= 2 * r + 1) o[(y - r) * W + x] = 1; } }
    return o;
  };
  PC.measure = (d, W, H) => {
    const N = W * H, m = new Uint8Array(N);
    for(let i = 0; i < N; i++){
      const a = d[i * 4 + 3] / 255, r = 255 + (d[i * 4] - 255) * a, g = 255 + (d[i * 4 + 1] - 255) * a, b = 255 + (d[i * 4 + 2] - 255) * a;
      const hi = Math.max(r, g, b), lo = Math.min(r, g, b), l = 0.299 * r + 0.587 * g + 0.114 * b;
      if(hi - lo > SAT && l > LUM0 && l < LUM1) m[i] = 1;
    }
    const e = erode(m, W, H, Math.max(2, Math.round(ERODE * Math.max(W, H))));
    let n = 0; for(let i = 0; i < N; i++) n += e[i];
    const fill = n / N;
    return {fill: Math.round(fill * 10000) / 10000, colored: fill >= MIN_FILL};
  };
  PC.ofImage = img => {
    const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height, k = Math.min(1, MAX_SIDE / Math.max(w0, h0));
    const W = Math.max(8, Math.round(w0 * k)), H = Math.max(8, Math.round(h0 * k));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', {willReadFrequently: true}); g.drawImage(img, 0, 0, W, H);
    return PC.measure(g.getImageData(0, 0, W, H).data, W, H);
  };
  const load = src => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
  PC.mark = async plan => {
    if(!plan || typeof plan !== 'object' || 'colored' in plan) return plan;
    const lv = (plan.levels || []).filter(L => L && L.kind === 'image' && L.src);
    if(!lv.length) return plan;
    let any = false;
    for(const L of lv){ try { const m = PC.ofImage(L.canvas || await load(L.src)); L.coloredRooms = m.colored; any = any || m.colored; } catch(e) {} }
    plan.colored = any; plan.coloredFrom = 'plancolor';
    return plan;
  };
  root.PlanColor = PC;
  if(typeof module !== 'undefined' && module.exports) module.exports = PC;
})(typeof window !== 'undefined' ? window : globalThis);
