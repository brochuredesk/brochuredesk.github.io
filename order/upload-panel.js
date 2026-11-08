/* Live upload panel (product.md, Printers and mail vendors; 10/31/2026). The printer's site runs in a browser on our
   upload runner (uploader/runner.py in the code repo); this panel shows its screen and passes the agent's clicks and
   typing through, so they sign in (and answer any CAPTCHA or texted code) themselves while we pick the product, upload
   the files and add them to the cart. Nothing is ordered here.
   It starts as a small progress card in the corner: with the agent's printer sign-in remembered, the upload just runs
   (owner 10/31/2026: one click, no sign-in, no screen to watch). The full panel opens only when the printer needs the
   agent (first sign-in, an expired sign-in, a code), when something goes wrong, or for a printer that doesn't keep carts
   (they check out in the panel). "Show the page" opens it any time.

     UploadPanel.printers(runner)                    -> ids the runner has a recipe for ([] when it can't be reached)
     UploadPanel.open({runner, token, printer, name, files, vars, onDownload}) -> 'done' | 'error' | 'cancelled'

   What the agent types goes straight to the printer's page; we never log or keep it. Wording is a draft. */
(function(){
  const W = 1280, H = 800;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const KEYS = new Set(['Enter', 'Backspace', 'Delete', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']);
  let css = false;
  function style(){
    if(css) return; css = true;
    const s = document.createElement('style');
    s.textContent = `.up-dlg{width:min(1100px,96vw);max-height:96vh;padding:0;border:0;border-radius:10px;background:#FBFBF9;color:#1E2226;font-family:Figtree,system-ui,sans-serif}
.up-dlg::backdrop{background:rgba(20,22,24,.55)}
.up-dlg.compact{position:fixed;inset:auto 16px 16px auto;width:min(400px,calc(100vw - 32px));margin:0;box-shadow:0 10px 30px rgba(20,22,24,.25);z-index:50}
.up-dlg.compact .up-screen,.up-dlg.compact .up-note{display:none}
.up-dlg.compact .up-head h2{font-size:18px}
.up-dlg.compact .up-foot{padding-top:6px}
.up-dlg:not(.compact) [data-a=show]{display:none}
.up-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #D5D6D1}
.up-head h2{font:400 22px/1.2 'Bodoni Moda',Georgia,serif;margin:0}
.up-status{padding:10px 18px;font-size:15px;min-height:1.5em;display:flex;gap:10px;align-items:center}
.up-status.need{background:#fff7e0}
.up-status.err{background:#fbeceb;color:#a3271f}
.up-status.ok{background:#e8f1ec;color:#1F4D3F;font-weight:600}
.up-screen{position:relative;margin:0 18px;aspect-ratio:${W}/${H};background:#ECECE9;border:1px solid #D5D6D1;overflow:hidden}
.up-screen img{width:100%;height:100%;display:block;cursor:pointer;outline:none}
.up-screen img:focus-visible{box-shadow:inset 0 0 0 3px #1F4D3F}
.up-screen .up-wait{position:absolute;inset:0;display:grid;place-items:center;color:#4A5157}
.up-dlg [hidden]{display:none!important}
.up-foot{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;padding:12px 18px 16px;font-size:13.5px;color:#4A5157}
.up-foot .acts{display:flex;gap:10px}
.up-btn{font:inherit;font-weight:600;font-size:14.5px;padding:9px 16px;border-radius:6px;border:1px solid #1F4D3F;background:#1F4D3F;color:#fff;cursor:pointer}
.up-btn.line{background:transparent;color:#1F4D3F}
.up-count{font-weight:700;color:#1E2226}
@media (max-width:640px){.up-screen{margin:0 8px}.up-head,.up-status,.up-foot{padding-left:10px;padding-right:10px}}`;
    document.head.appendChild(s);
  }

  async function printers(runner){
    if(!runner) return [];
    try { const r = await fetch(runner + '/printers'); return (await r.json()).printers || []; } catch(e) { return []; }
  }

  function open(o){
    style();
    return new Promise(async resolve => {
      const dlg = document.createElement('dialog');
      dlg.className = 'up-dlg compact';
      dlg.innerHTML = `<div class="up-head"><h2>Uploading to ${esc(o.name)}</h2><button type="button" class="up-btn line" data-a="cancel">Stop</button></div>
        <div class="up-status" role="status" aria-live="polite">Starting…</div>
        <div class="up-screen"><div class="up-wait">Opening ${esc(o.name)}…</div><img alt="${esc(o.name)}, live. Click and type here to sign in." tabindex="0" hidden></div>
        <div class="up-foot"><span class="up-note">We never see or keep your printer password. Nothing is ordered until you check out.</span>
          <span class="acts"><span class="up-count" hidden></span><button type="button" class="up-btn line" data-a="show">Show the page</button><button type="button" class="up-btn line" data-a="download">Download the files instead</button></span></div>`;
      document.body.appendChild(dlg);
      const $ = s => dlg.querySelector(s), img = $('img'), status = $('.up-status');
      let id = null, es = null, outcome = 'cancelled', timer = null, finished = false;
      // the full panel, when the agent needs to see or do something
      const expand = () => { if(!dlg.classList.contains('compact')) return; dlg.classList.remove('compact'); if(dlg.open) dlg.close(); dlg.showModal(); };
      const say = (text, cls) => { status.textContent = text; status.className = 'up-status' + (cls ? ' ' + cls : ''); };
      // input goes out strictly in order (one request at a time), and typing in a burst goes as one piece of text
      let chain = Promise.resolve(), typed = '', typeTimer = null;
      const post = i => { chain = chain.then(() => fetch(`${o.runner}/sessions/${id}/input`, {method: 'POST',
        headers: {'content-type': 'application/json'}, body: JSON.stringify(i)})).catch(() => {}); };
      const flush = () => { clearTimeout(typeTimer); if(typed){ post({type: 'text', text: typed}); typed = ''; } };
      const send = i => { if(!id) return; if(i.type === 'text'){ typed += i.text; clearTimeout(typeTimer); typeTimer = setTimeout(flush, 60); return; } flush(); post(i); };
      function close(){
        if(es) es.close();
        clearInterval(timer);
        if(id && !finished) fetch(`${o.runner}/sessions/${id}/cancel`, {method: 'POST', headers: {'content-type': 'application/json'}, body: '{}'}).catch(() => {});
        if(dlg.open) dlg.close();
        dlg.remove();
        resolve(outcome);
      }
      dlg.addEventListener('cancel', e => { e.preventDefault(); });   // Escape goes to the printer's page, not here
      dlg.addEventListener('click', e => {
        const b = e.target.closest('button[data-a]'); if(!b) return;
        if(b.dataset.a === 'download'){ if(o.onDownload) o.onDownload(); outcome = outcome === 'done' ? 'done' : 'cancelled'; return close(); }
        if(b.dataset.a === 'retry'){ dlg.remove(); return resolve(open(o)); }
        if(b.dataset.a === 'show') return expand();
        close();
      });
      // the agent's input goes to the printer's page at the same spot
      img.addEventListener('click', e => {
        const r = img.getBoundingClientRect();
        send({type: 'click', x: Math.round((e.clientX - r.left) * W / r.width), y: Math.round((e.clientY - r.top) * H / r.height)});
        img.focus();
      });
      img.addEventListener('keydown', e => {
        if(e.metaKey || e.ctrlKey) return;
        if(e.key.length === 1){ send({type: 'text', text: e.key}); e.preventDefault(); }
        else if(KEYS.has(e.key)){ send({type: 'key', key: e.key}); e.preventDefault(); }
      });
      img.addEventListener('paste', e => { const t = e.clipboardData.getData('text'); if(t) send({type: 'text', text: t}); e.preventDefault(); });
      img.addEventListener('wheel', e => { send({type: 'scroll', dy: Math.round(e.deltaY)}); e.preventDefault(); }, {passive: false});

      dlg.show();
      let r;
      try {
        const res = await fetch(o.runner + '/sessions', {method: 'POST', headers: {'content-type': 'application/json', authorization: 'Bearer ' + (o.token || '')},
          body: JSON.stringify({printer: o.printer, files: o.files, vars: o.vars || {}})});
        r = await res.json();
      } catch(e) { r = {}; }
      if(!r.id){ expand(); say(`We couldn't open ${o.name} right now. Nothing was ordered. Download the files instead, or try again in a minute.`, 'err'); outcome = 'error'; return; }
      id = r.id;
      es = new EventSource(`${o.runner}/sessions/${id}/events`);
      es.addEventListener('frame', ev => { const d = JSON.parse(ev.data); img.src = 'data:image/jpeg;base64,' + d.jpeg; img.hidden = false; $('.up-wait').hidden = true; });
      es.addEventListener('status', ev => say(JSON.parse(ev.data).text));
      es.addEventListener('need', ev => { const d = JSON.parse(ev.data); if(d.need){ expand(); say(d.text, 'need'); img.focus(); } });
      es.addEventListener('done', ev => {
        const d = JSON.parse(ev.data); outcome = 'done'; say(d.text, 'ok');
        $('h2').textContent = `Added to your ${o.name} cart`;
        $('[data-a=cancel]').textContent = 'Close'; $('[data-a=download]').textContent = 'Download the files too';
        if(d.minutes){
          expand();
          const end = Date.now() + d.minutes * 60000, c = $('.up-count'); c.hidden = false;
          const tick = () => { const s = Math.max(0, Math.round((end - Date.now()) / 1000)); c.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} left to check out`; };
          tick(); timer = setInterval(tick, 1000);
          try { new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=').play().catch(() => {}); } catch(e) {}
        } else finished = true;
        if('Notification' in window && Notification.permission === 'granted') try { new Notification(`Your ${o.name} cart is ready`); } catch(e) {}
      });
      es.addEventListener('error', ev => {
        if(!ev.data) return;                         // a dropped connection, not the runner's error event
        outcome = 'error'; finished = true; expand(); say(JSON.parse(ev.data).text, 'err');
        $('[data-a=cancel]').outerHTML = '<button type="button" class="up-btn" data-a="retry">Try again</button>';
      });
      es.addEventListener('closed', () => { finished = true; es.close(); clearInterval(timer); if(outcome === 'done') $('.up-count').hidden = true; });
    });
  }

  window.UploadPanel = {printers, open};
})();
