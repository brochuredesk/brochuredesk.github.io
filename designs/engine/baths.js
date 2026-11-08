/* Bath wording, every piece (owner 11/1/2026, standing rule; applies without re-approval).
     no half bath        -> "3 Full Baths"            (one: "1 Full Bath")
     one half bath       -> "3½ Baths", the ½ at the row's own size (owner 11/1 Round 4; was small) (never "Full Baths" next to a ½)
     two or more halves  -> "3 Full Baths" plus their own line: "2 Half Baths"
   BD.baths(L) returns {main, half}: `main` is HTML (the ½ wrapped in <span class="bd-half">), `half` is the extra line or ''.
   BD.bathsText(L) is the same as plain text, for places that can't take HTML (alt text, emails, checks).
   Pieces that show baths as a number over a label use BD.bathNum(L) {num (HTML), label}. */
(function(){
  const BD = window.BD = window.BD || {};
  const HALF = '<span class="bd-half">½</span>';
  function parts(L){
    const f = +L.baths || 0, h = +L.halfBaths || 0;
    if(h === 1) return {num: f, half: true, label: 'Baths', extra: ''};
    return {num: f, half: false, label: f === 1 ? 'Full Bath' : 'Full Baths', extra: h >= 2 ? `${h} Half Baths` : ''};
  }
  BD.baths = L => { const p = parts(L); return {main: `${p.num}${p.half ? HALF : ''} ${p.label}`, half: p.extra}; };
  BD.bathsText = L => { const p = parts(L); return {main: `${p.num}${p.half ? '½' : ''} ${p.label}`, half: p.extra}; };
  BD.bathNum = L => { const p = parts(L); return {num: `${p.num}${p.half ? HALF : ''}`, label: p.label, half: p.extra}; };
  if(!document.getElementById('bd-half-css')){
    const s = document.createElement('style'); s.id = 'bd-half-css';
    s.textContent = '.bd-half{font-size:1em;vertical-align:baseline}';
    (document.head || document.documentElement).appendChild(s);
  }
})();
