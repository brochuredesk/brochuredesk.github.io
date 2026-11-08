// Help chat bubble (code repo docs/help-bot/README.md). Self-contained: adds its own styles, bubble and panel, so a page
// only needs this script. Talks to the help-bot edge function. A signed-in agent's session is sent along so their own
// limit applies and support sees who asked. It can point to pages; it never changes an order, a payment or an account.
// EASY TO EDIT: the greeting, the starter questions and the page each link id opens are in TEXT and LINKS below.
(function(){
  if (window.__bdHelp) return; window.__bdHelp = true;
  const FN = 'https://depwvwewbmxspoxidxrx.supabase.co/functions/v1/help-bot';
  const KEY = 'sb_publishable_mF60NaxAKLQV_pDLBoR2og_PzJ9fxxH';   // public browser key
  const AUTH = 'sb-depwvwewbmxspoxidxrx-auth-token';               // where supabase-js keeps the agent's session
  const TEXT = {
    hello: "Hi. I can help you find your way around BrochureDesk. What do you need?",
    starters: ['How do I make a Matrix link?', "What's in the $25 package?", 'Where are my past orders?'],
    fine: "Answers come from our help notes. I can't change orders, payments or accounts.",
    handoffAsk: "I'll send this chat to our team and they'll email you back.",
    handoffDone: "Sent. Our team has the chat and will email you back.",
    handoffFail: "That didn't go through. Please email support@brochuredesk.com and we'll take it from there.",
    offline: "I can't reach the help desk right now. Please email support@brochuredesk.com.",
  };
  const LINKS = {
    start:      { label: 'Start a package',        href: '/order/#start' },
    orders:     { label: 'Past orders',            href: '/order/#home' },
    rebrand:    { label: 'Switch brokers',         href: '/order/#home' },
    'own-design': { label: 'Request your own design', href: '/own-design/' },
    support:    { label: 'Email support',          href: 'mailto:support@brochuredesk.com' },
    matrix:     { label: 'Show me the Matrix steps', run: matrixHelp },
  };

  const CSS = `
#bdh-btn{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:8px;border:0;border-radius:999px;
  background:#1F4D3F;color:#fff;font:600 15px/1 Figtree,system-ui,-apple-system,sans-serif;padding:13px 18px 13px 14px;cursor:pointer;
  box-shadow:0 8px 24px rgba(30,34,38,.28)}
#bdh-btn:hover{background:#183d32}#bdh-btn:focus-visible{outline:3px solid #9C7B45;outline-offset:2px}
#bdh-btn svg{width:22px;height:22px;flex:none}
#bdh{position:fixed;right:16px;bottom:16px;z-index:2147483001;width:min(380px,calc(100vw - 32px));height:min(600px,calc(100dvh - 32px));
  display:flex;flex-direction:column;background:#FBFBF9;color:#1E2226;border:1px solid #D5D6D1;border-radius:14px;overflow:hidden;
  box-shadow:0 20px 60px rgba(30,34,38,.32);font:15px/1.45 Figtree,system-ui,-apple-system,sans-serif}
#bdh[hidden],#bdh-btn[hidden]{display:none}
#bdh *{box-sizing:border-box}
#bdh .h{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 12px 12px 16px;background:#1F4D3F;color:#fff}
#bdh .h b{font-size:16px}#bdh .h small{display:block;font-weight:400;opacity:.8;font-size:12.5px}
#bdh .x{border:0;background:transparent;color:#fff;font-size:22px;line-height:1;width:36px;height:36px;border-radius:8px;cursor:pointer}
#bdh .x:hover{background:rgba(255,255,255,.14)}
#bdh .log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
#bdh .m{max-width:88%;padding:9px 12px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}
#bdh .m.bot{background:#fff;border:1px solid #E4E4E0;align-self:flex-start;border-bottom-left-radius:4px}
#bdh .m.agent{background:#1F4D3F;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
#bdh .m.wait{color:#4A5157}
#bdh .acts{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;max-width:92%}
#bdh .chip{border:1px solid #C9CBC6;background:#fff;color:#1E2226;border-radius:999px;padding:6px 11px;font:600 13.5px/1.2 inherit;font-family:inherit;cursor:pointer;text-decoration:none}
#bdh .chip:hover{border-color:#1F4D3F;color:#1F4D3F}
#bdh .chip.go{background:#ECF2EF;border-color:#BBD0C6;color:#1F4D3F}
#bdh form.ask{display:flex;gap:8px;padding:10px;border-top:1px solid #E4E4E0;background:#fff}
#bdh textarea,#bdh input{flex:1;min-width:0;font:15px/1.4 inherit;font-family:inherit;color:#1E2226;border:1px solid #C9CBC6;border-radius:10px;padding:9px 11px;background:#fff}
#bdh textarea{resize:none;height:42px;max-height:110px}
#bdh textarea:focus,#bdh input:focus{outline:2px solid #1F4D3F;outline-offset:-1px;border-color:#1F4D3F}
#bdh .send{border:0;border-radius:10px;background:#1F4D3F;color:#fff;font:600 14.5px/1 inherit;font-family:inherit;padding:0 15px;cursor:pointer}
#bdh .send:disabled{opacity:.5;cursor:default}
#bdh .fine{margin:0;padding:0 14px 10px;background:#fff;color:#6B655C;font-size:12px}
#bdh .fine button{border:0;background:none;padding:0;color:#1F4D3F;font:600 12px inherit;font-family:inherit;text-decoration:underline;cursor:pointer}
#bdh form.hand{display:grid;gap:8px;background:#fff;border:1px solid #E4E4E0;border-radius:12px;padding:12px;align-self:stretch}
#bdh form.hand p{margin:0;font-size:14px}
#bdh form.hand .row{display:flex;gap:8px;justify-content:flex-end}
@media (max-width:480px){#bdh{right:8px;left:8px;bottom:8px;width:auto;height:calc(100dvh - 16px)}#bdh-btn{right:12px;bottom:12px}}
@media (prefers-reduced-motion:no-preference){#bdh{animation:bdh-in .18s ease-out}@keyframes bdh-in{from{opacity:0;transform:translateY(8px)}}}
`;
  const el = (tag, attrs = {}, text) => { const e = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => k === 'class' ? e.className = v : e.setAttribute(k, v)); if (text != null) e.textContent = text; return e; };
  const store = { get(k, d){ try { return JSON.parse(sessionStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v){ try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  function token(){ try { const s = JSON.parse(localStorage.getItem(AUTH) || 'null'); return s?.access_token && s.expires_at * 1000 > Date.now() ? s : null; } catch { return null; } }
  const session = store.get('bdh-session', null) || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
  store.set('bdh-session', session);
  let msgs = store.get('bdh-msgs', []);   // [{role:'agent'|'bot', text, links, offer}]

  const style = el('style'); style.textContent = CSS; document.head.appendChild(style);
  const btn = el('button', { id: 'bdh-btn', type: 'button', 'aria-label': 'Open help chat', 'aria-expanded': 'false' });
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span>Help</span>';
  const box = el('section', { id: 'bdh', role: 'dialog', 'aria-label': 'BrochureDesk help', hidden: '' });
  box.innerHTML = `<div class="h"><div><b>BrochureDesk help</b><small>Usually answers right away</small></div><button class="x" type="button" aria-label="Close help">×</button></div>
<div class="log" aria-live="polite"></div>
<form class="ask"><textarea rows="1" maxlength="500" placeholder="Ask a question" aria-label="Your question"></textarea><button class="send" type="submit">Send</button></form>
<p class="fine"></p>`;
  document.body.append(btn, box);
  const log = box.querySelector('.log'), form = box.querySelector('form.ask'), input = form.querySelector('textarea'), send = form.querySelector('.send');
  box.querySelector('.fine').append(TEXT.fine + ' ', Object.assign(el('button', { type: 'button' }, 'Talk to a person'), { onclick: () => handoffForm() }));

  function open(on){
    box.hidden = !on; btn.hidden = on; btn.setAttribute('aria-expanded', String(on));
    if (on) { draw(); input.focus(); } else btn.focus();
  }
  btn.onclick = () => open(true);
  box.querySelector('.x').onclick = () => open(false);
  box.addEventListener('keydown', e => { if (e.key === 'Escape') open(false); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  input.addEventListener('input', () => { input.style.height = '42px'; input.style.height = Math.min(input.scrollHeight + 2, 110) + 'px'; });

  function bubble(m){
    log.append(el('div', { class: `m ${m.role}` }, m.text));
    const acts = [...(m.links || [])].filter(l => LINKS[l]);
    if (m.role === 'bot' && (acts.length || m.offer)) {
      const row = el('div', { class: 'acts' });
      acts.forEach(l => {
        const L = LINKS[l];
        const a = L.run ? el('button', { type: 'button', class: 'chip go' }, L.label) : el('a', { class: 'chip go', href: L.href }, L.label);
        if (L.run) a.onclick = L.run;
        row.append(a);
      });
      if (m.offer && !m.sent) row.append(Object.assign(el('button', { type: 'button', class: 'chip' }, 'Send this to our team'), { onclick: () => handoffForm() }));
      log.append(row);
    }
  }
  function draw(){
    log.textContent = '';
    bubble({ role: 'bot', text: TEXT.hello });
    if (!msgs.length) {
      const row = el('div', { class: 'acts' });
      TEXT.starters.forEach(q => row.append(Object.assign(el('button', { type: 'button', class: 'chip' }, q), { onclick: () => ask(q) })));
      log.append(row);
    }
    msgs.forEach(bubble);
    log.scrollTop = log.scrollHeight;
  }
  const save = () => store.set('bdh-msgs', msgs.slice(-30));
  const headers = () => { const t = token(); return { 'content-type': 'application/json', apikey: KEY, authorization: `Bearer ${t ? t.access_token : KEY}` }; };

  async function ask(q){
    q = q.trim(); if (!q || send.disabled) return;
    msgs.push({ role: 'agent', text: q }); save(); draw();
    input.value = ''; input.style.height = '42px'; send.disabled = true;
    const wait = el('div', { class: 'm bot wait' }, 'Looking that up…'); log.append(wait); log.scrollTop = log.scrollHeight;
    let reply;
    try {
      const r = await fetch(FN, { method: 'POST', headers: headers(), body: JSON.stringify({ action: 'chat', session, page: location.pathname,
        messages: msgs.slice(-7).map(m => ({ role: m.role, text: m.text })) }) });
      const j = await r.json();
      reply = j.ok ? { role: 'bot', text: j.answer, links: j.links || [], offer: !!j.offerHandoff } : { role: 'bot', text: TEXT.offline, links: ['support'] };
    } catch { reply = { role: 'bot', text: TEXT.offline, links: ['support'] }; }
    send.disabled = false; msgs.push(reply); save(); draw(); input.focus();
  }
  form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });

  function handoffForm(){
    if (log.querySelector('form.hand')) { log.querySelector('form.hand input, form.hand textarea').focus(); return; }
    const signed = !!token();
    const f = el('form', { class: 'hand' });
    f.innerHTML = `<p></p>${signed ? '' : '<input type="email" name="email" required placeholder="Your email" autocomplete="email" aria-label="Your email"><input type="text" name="name" placeholder="Your name (optional)" autocomplete="name" aria-label="Your name">'}
<textarea name="note" rows="2" maxlength="2000" placeholder="Anything to add? (optional)" aria-label="Note for our team"></textarea>
<div class="row"><button type="button" class="chip">Cancel</button><button type="submit" class="send" style="padding:10px 15px">Send to our team</button></div>`;
    f.querySelector('p').textContent = TEXT.handoffAsk;
    f.querySelector('.chip').onclick = () => f.remove();
    f.onsubmit = async e => {
      e.preventDefault();
      const b = f.querySelector('.send'); b.disabled = true; b.textContent = 'Sending…';
      const d = Object.fromEntries(new FormData(f));
      let ok = false;
      try {
        const r = await fetch(FN, { method: 'POST', headers: headers(), body: JSON.stringify({ action: 'handoff', session, page: location.pathname, ...d }) });
        ok = (await r.json()).ok;
      } catch {}
      msgs.forEach(m => { m.sent = m.sent || ok; });
      msgs.push({ role: 'bot', text: ok ? TEXT.handoffDone : TEXT.handoffFail, links: ok ? [] : ['support'] }); save(); draw();
    };
    log.append(f); log.scrollTop = log.scrollHeight;
    (f.querySelector('input') || f.querySelector('textarea')).focus();
  }

  // the Matrix walkthrough (preview/matrix-help.js) opens over the page; loaded here if the page doesn't have it
  function matrixHelp(e){
    const go = () => window.openMatrixHelp && window.openMatrixHelp(e?.currentTarget);
    if (window.openMatrixHelp) return go();
    const s = el('script', { src: '/team/matrix-help.js?v=2' }); s.onload = go; document.head.appendChild(s);
  }

  if (/[?&]help=open\b/.test(location.search)) open(true);
})();
