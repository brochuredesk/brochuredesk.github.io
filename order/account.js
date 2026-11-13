// Account pieces of the agent page (launch list, accounts and checkout; 11/02/2026). Loaded before agent.js, which
// calls Account.init() once and then the hooks below. Wording is a draft (the owner's call).
//   Sign in: "Create an account" and "Forgot your password?" (account function: links emailed from support@).
//   ?account=password (from the reset email): choose a new password.
//   First sign-in: the welcome intake. Texas license number checked against TREC's public data (account function),
//   name and sponsoring broker filled in, then headshot (zoom and crop), display name, email and cell, then straight to
//   "Paste your first listing link". "Welcome back" from then on.
//   Agent home: the 5-pack offer and balance, receipts and order history from payments (refund button), older orders
//   to show again (kept 2 years), and a plain note when the account is on hold.
//   Open House library: approved flyers from /designs/openhouse.json (designs/shared/openhouse.js) for the package.
(function(){
  let C = null;   // {sb, url, key, esc, ask, money, dayFmt, show, me(), profile(), setProfile(p), openStart(), openHome(), localMode()}
  const $ = s => document.querySelector(s);
  const FN = () => C.url + '/functions/v1/account', FN_CHECKOUT = () => C.url + '/functions/v1/checkout';
  async function call(fn, body, signed){
    try {
      const h = {'content-type': 'application/json', apikey: C.key};
      if(signed){ const {data} = await C.sb.auth.getSession(); h.authorization = 'Bearer ' + (data.session ? data.session.access_token : ''); }
      const r = await fetch(fn, {method: 'POST', headers: h, body: JSON.stringify(body)});
      return await r.json();
    } catch(e) { console.warn(e); return {error: 'network'}; }
  }
  const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
  const KIND = {full: 'Full package', essentials: 'The Essentials', single: 'Single piece', pack5: '5-pack'};
  const PIECE = {foldover: 'Fold-over brochure', 'open-house-flyer': 'Open House flyer', postcard: 'Just Listed postcard'};

  // ---------- sign in: create an account, forgot password ----------
  function signinExtras(){
    const card = $('#vSignin .card');
    if(!card || $('#acctLinks')) return;
    const p = document.createElement('div');
    p.id = 'acctLinks';
    p.innerHTML = `<p class="fine"><button type="button" class="link" id="toForgot">Forgot your password?</button></p>
      <p>New to BrochureDesk? <button type="button" class="link" id="toSignup">Create an account</button></p>
      <form id="signupForm" class="stack" hidden>
        <h2>Create your account</h2>
        <div class="row2"><label>First name<input name="first" autocomplete="given-name" required></label><label>Last name<input name="last" autocomplete="family-name" required></label></div>
        <label>Email<input type="email" name="email" autocomplete="email" required></label>
        <label>Password<input type="password" name="password" autocomplete="new-password" minlength="8" required><small class="gray">At least 8 characters.</small></label>
        <button class="btn" type="submit">Create my account</button>
        <p class="err" id="signupErr" role="alert"></p></form>
      <form id="forgotForm" class="stack" hidden>
        <h2>Reset your password</h2>
        <label>Email<input type="email" name="email" autocomplete="email" required></label>
        <button class="btn" type="submit">Email me a link</button>
        <p class="err" id="forgotErr" role="alert"></p></form>
      <p class="ok" id="acctSent" role="status" hidden></p>`;
    card.insertBefore(p, card.querySelector('.fine:last-child'));
    const swap = id => { ['signupForm', 'forgotForm'].forEach(x => $('#' + x).hidden = x !== id); $('#acctSent').hidden = true; };
    $('#toSignup').onclick = () => swap('signupForm');
    $('#toForgot').onclick = () => { swap('forgotForm'); const e = $('#signinForm').email.value; if(e) $('#forgotForm').email.value = e; };
    $('#signupForm').onsubmit = async e => {
      e.preventDefault(); const f = e.target; $('#signupErr').textContent = '';
      if(!EMAIL.test(f.email.value.trim())){ $('#signupErr').textContent = 'Check the email address.'; return; }
      if(f.password.value.length < 8){ $('#signupErr').textContent = 'Use at least 8 characters for your password.'; return; }
      f.querySelector('button').disabled = true;
      const r = await call(FN(), {action: 'signup', email: f.email.value.trim(), password: f.password.value, first: f.first.value.trim(), last: f.last.value.trim()});
      f.querySelector('button').disabled = false;
      if(!r.ok){ $('#signupErr').textContent = r.error === 'password' ? 'Use at least 8 characters for your password.' : "We couldn't create the account just now. Try again in a minute."; return; }
      f.hidden = true; sent(`Check ${f.email.value.trim()} for a link from support@brochuredesk.com to confirm your email. It may take a minute.`); f.reset();
    };
    $('#forgotForm').onsubmit = async e => {
      e.preventDefault(); const f = e.target; $('#forgotErr').textContent = '';
      if(!EMAIL.test(f.email.value.trim())){ $('#forgotErr').textContent = 'Check the email address.'; return; }
      const r = await call(FN(), {action: 'reset', email: f.email.value.trim()});
      if(!r.ok){ $('#forgotErr').textContent = "We couldn't send it just now. Try again in a minute."; return; }
      f.hidden = true; sent(`If ${f.email.value.trim()} has an account, a link to choose a new password is on its way from support@brochuredesk.com.`);
    };
    function sent(t){ const s = $('#acctSent'); s.textContent = t; s.hidden = false; }
  }

  // ?account=password: the reset email's link signs the person in for one step; they choose a new password
  const wantsPassword = () => new URLSearchParams(location.search).get('account') === 'password';
  function passwordStep(done){
    C.show('vPassword');
    const f = $('#passwordForm'); f.reset(); $('#passwordErr').textContent = '';
    f.onsubmit = async e => {
      e.preventDefault();
      const a = f.password.value, b = f.again.value;
      if(a.length < 8){ $('#passwordErr').textContent = 'Use at least 8 characters.'; return; }
      if(a !== b){ $('#passwordErr').textContent = "The two passwords don't match."; return; }
      const {error} = await C.sb.auth.updateUser({password: a});
      if(error){ $('#passwordErr').textContent = 'That link has expired. Ask for a new one from the sign-in page.'; return; }
      history.replaceState(null, '', location.pathname + location.hash);
      done();
    };
  }

  // ---------- first sign-in: welcome intake ----------
  const needsWelcome = () => !!C.me() && !C.localMode() && !(C.profile() && C.profile().welcomed_at);
  let trec = null, crop = null;
  function intake(){
    C.show('vWelcome');
    const p = C.profile() || {}, me = C.me();
    trec = p.trec || null;
    const f = $('#welcomeForm');
    f.display.value = p.display_name || (trec && trec.name) || [me.user_metadata && me.user_metadata.first_name, me.user_metadata && me.user_metadata.last_name].filter(Boolean).join(' ');
    f.display.dataset.auto = p.display_name ? '' : '1';   // filled in for them: TREC's name replaces it until they type
    f.display.oninput = () => { f.display.dataset.auto = ''; };
    f.email.value = p.preferred_email || me.email || '';
    f.cell.value = p.cell || '';
    $('#welcomeStep2').hidden = false;   // no license check first (owner 11/13/2026)
    trecLine();
    $('#trecForm').onsubmit = async e => {
      e.preventDefault();
      const n = $('#trecForm').license.value.trim(); $('#trecErr').textContent = '';
      if(!/^\d{4,8}(-[A-Za-z]{2,3})?$/.test(n.replace(/\s/g, ''))){ $('#trecErr').textContent = 'Type the license number as TREC shows it, like 0612345.'; return; }
      $('#trecForm button').disabled = true; $('#trecErr').textContent = 'Checking with TREC…';
      const r = await call(FN(), {action: 'trec', license: n}, true);
      $('#trecForm button').disabled = false; $('#trecErr').textContent = '';
      if(!r.ok){ $('#trecErr').textContent = {'not-found': "TREC doesn't show that license number. Check it and try again.", 'too-many': "That's a lot of checks for one day. Try again tomorrow, or email support@brochuredesk.com.",
        'trec-down': "We couldn't reach TREC's records just now. Try again in a minute."}[r.error] || "We couldn't check that number. Try again in a minute."; return; }
      trec = r.trec; C.setProfile(Object.assign({}, C.profile() || {}, {trec}));
      if(!f.display.value || f.display.dataset.auto) f.display.value = trec.name;
      trecLine(); $('#welcomeStep2').hidden = false;
    };
    // headshot: pick a photo, drag to place it and zoom; saved as a 4:5 crop (800 x 1000)
    const file = $('#hsFile'), cv = $('#hsCanvas'), zoom = $('#hsZoom');
    crop = null; cv.hidden = true; zoom.hidden = true;
    file.onchange = () => { const fl = file.files[0]; if(!fl) return; const img = new Image(); img.onload = () => { crop = {img, x: 0, y: 0, k: 1}; cv.hidden = zoom.hidden = false; zoom.value = 1; draw(); }; img.src = URL.createObjectURL(fl); };
    zoom.oninput = () => { if(crop){ crop.k = +zoom.value; draw(); } };
    let drag = null;
    cv.onpointerdown = e => { if(!crop) return; drag = {x: e.clientX, y: e.clientY, cx: crop.x, cy: crop.y}; cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = e => { if(!drag) return; const s = cv.width / cv.clientWidth; crop.x = drag.cx + (e.clientX - drag.x) * s; crop.y = drag.cy + (e.clientY - drag.y) * s; draw(); };
    cv.onpointerup = () => { drag = null; };
    function draw(){
      const g = cv.getContext('2d'), {img} = crop, base = Math.max(cv.width / img.width, cv.height / img.height), s = base * crop.k;
      const w = img.width * s, h = img.height * s;
      crop.x = Math.min(0, Math.max(cv.width - w, crop.x || (cv.width - w) / 2)); crop.y = Math.min(0, Math.max(cv.height - h, crop.y || (cv.height - h) / 2));
      g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, crop.x, crop.y, w, h);
    }
    f.onsubmit = async e => {
      e.preventDefault(); $('#welcomeErr').textContent = '';
      if(!f.display.value.trim()){ $('#welcomeErr').textContent = 'Add the name you want on your pieces.'; return; }
      if(!EMAIL.test(f.email.value.trim())){ $('#welcomeErr').textContent = 'Check the email address.'; return; }
      f.querySelector('button[type=submit]').disabled = true;
      let headshot = (C.profile() || {}).headshot || null;
      if(crop){
        const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', .9));
        const path = `${me.id}/headshot.jpg`;
        const {error} = await C.sb.storage.from('headshots').upload(path, blob, {contentType: 'image/jpeg', upsert: true});
        if(error) console.warn('headshot not saved', error.message); else headshot = path;
      }
      const row = {user_id: me.id, display_name: f.display.value.trim().slice(0, 80), greeting_name: f.display.value.trim().split(/\s+/)[0],
        preferred_email: f.email.value.trim(), cell: f.cell.value.trim().slice(0, 30), headshot, welcomed_at: new Date().toISOString()};
      const kit = Object.assign({}, (C.profile() || {}).brand_kit || {});
      if(trec && trec.broker && !kit.sponsoringBroker) kit.sponsoringBroker = trec.broker;
      row.brand_kit = kit;
      const {error} = await C.sb.from('agent_profiles').upsert(row);
      f.querySelector('button[type=submit]').disabled = false;
      if(error){ $('#welcomeErr').textContent = "We couldn't save that. Try again in a minute."; console.warn(error); return; }
      C.setProfile(Object.assign({}, C.profile() || {}, row, {trec}));
      C.openHome();
    };
  }
  function trecLine(){
    const el = $('#trecFound');
    if(!trec){ el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `<b>${C.esc(trec.name)}</b>, license ${C.esc(trec.license)}${trec.broker && trec.broker !== trec.name ? `, sponsored by <b>${C.esc(trec.broker)}</b>` : ''}.`
      + (trec.active ? '' : `<br><span class="err">TREC shows this license as "${C.esc(trec.status)}". You can still set up your account; your pieces need an active license to go out.</span>`)
      + (trec.active && !trec.sponsored ? '<br><span class="err">TREC doesn\'t show a sponsoring broker for this license yet. Texas ads need one, so add it under Settings once TREC lists it.</span>' : '')
      + ` <button type="button" class="link" id="trecRedo">That's not me</button>`;
    $('#trecRedo').onclick = () => { trec = null; el.hidden = true; $('#welcomeStep2').hidden = true; $('#trecForm').license.focus(); };
  }

  // ---------- Agent home: 5-pack, receipts and order history, older orders, hold ----------
  let pack = {credits: 0, offer: false, toGo: 5}, hold = null;
  async function home(){
    const box = $('#acctHome');
    if(!box) return;
    if(!C.me() || C.localMode()){ box.hidden = true; return; }
    box.hidden = false;
    const [pk, pays, hl, keep] = await Promise.all([
      C.sb.rpc('my_pack'), C.sb.from('payments').select('*').order('created_at', {ascending: false}).limit(100),
      C.sb.from('account_holds').select('*').is('cleared_at', null).maybeSingle(),
      C.sb.from('package_keep').select('*').lt('visible_until', new Date().toISOString()).gt('keep_until', new Date().toISOString()).is('deleted_at', null)]);
    if(!pk.error && pk.data) pack = pk.data;
    hold = hl.data || null;
    $('#acctHold').hidden = !hold;
    if(hold) $('#acctHold').innerHTML = '<h2>Your account is on hold</h2><p>New orders are paused while we look at your account. Your past orders and files are still here. Email support@brochuredesk.com and we\'ll sort it out.</p>';
    packCard();
    receipts(pays.error ? [] : pays.data || []);
    older(keep.error ? [] : keep.data || []);
  }
  function packCard(){
    const el = $('#acctPack');
    if(pack.credits > 0){ el.hidden = false; el.innerHTML = `<h2>Your 5-pack</h2><p><b>${pack.credits}</b> full package${pack.credits === 1 ? '' : 's'} left. We'll ask if you want to use one when you order.</p>`; return; }
    if(pack.offer && !hold){
      el.hidden = false;
      el.innerHTML = `<h2>Five more for $100</h2><p>You've ordered five full packages. Get the next five for $100, $20 each instead of $25. Use one on each full package you order.</p>
        <p><button class="btn" type="button" id="buyPack">Get the 5-pack for $100</button></p>`;
      $('#buyPack').onclick = buyPack;
      return;
    }
    el.hidden = true;   // nothing to say until the offer opens (the count isn't shown, so nobody's nudged)
  }
  async function buyPack(){
    const v = await C.ask('<h2>5-pack: $100</h2><p>Five full packages at $20 each. You\'ll pay on Stripe\'s secure checkout page, then come right back here.</p>', [['Pay $100', 'pay'], ['Cancel', 'cancel', 'line']]);
    if(v !== 'pay') return;
    const r = await call(FN_CHECKOUT(), {action: 'pack', back: location.pathname}, true);
    if(r.url){ location.href = r.url; return; }
    await C.ask(`<h2>Checkout isn't open yet</h2><p>${r.error === 'not-configured' || r.error === 'live-off' ? "Payments aren't switched on yet. Nothing was charged." : r.error === 'account-hold' ? 'New orders are paused on your account. Email support@brochuredesk.com.' : "We couldn't open checkout. Nothing was charged. Try again in a minute."}</p>`, [['OK', 'ok']]);
  }
  function what(p){ return p.kind === 'single' ? PIECE[p.piece] || 'Single piece' : KIND[p.kind] || p.kind; }
  function receipts(list){
    const el = $('#acctReceipts');
    if(!list.length){ el.innerHTML = '<p class="empty">No orders yet. Your receipts show up here.</p>'; return; }
    el.innerHTML = '<table class="receipts"><thead><tr><th>Date</th><th>Order</th><th>Paid</th><th></th></tr></thead><tbody>' + list.map(p => {
      const refunded = p.refunded_at || p.stripe_refund_id;
      const paid = p.pack_credit && !p.cents ? '5-pack credit' : C.money(p.cents) + (p.pack_credit ? ' + 5-pack credit' : '') + (p.tax_cents ? ` (tax ${C.money(p.tax_cents)})` : '');
      const extras = [p.extras && p.extras.bothSizes ? 'postcard in both sizes' : '', p.livemode ? '' : 'test'].filter(Boolean).join(', ');
      return `<tr><td>${C.dayFmt(p.created_at)}</td><td>${C.esc(what(p))}${extras ? ` <small class="gray">(${extras})</small>` : ''}</td><td>${C.esc(paid)}${refunded ? `<br><small>Refunded ${C.money(p.refunded_cents)}</small>` : ''}</td>
        <td>${p.receipt_url ? `<a href="${C.esc(p.receipt_url)}" target="_blank" rel="noopener">Receipt</a>` : ''}${refunded ? '' : ` <button type="button" class="link" data-refund="${p.id}">Ask for a refund</button>`}</td></tr>`;
    }).join('') + '</tbody></table>';
    el.querySelectorAll('[data-refund]').forEach(b => b.onclick = () => refund(list.find(p => String(p.id) === b.dataset.refund)));
  }
  async function refund(p){
    const v = await C.ask(`<h2>Refund ${C.esc(what(p))}?</h2><p>${p.kind === 'pack5' ? 'We refund the packages you haven\'t used yet, $20 each.' : p.pack_credit && !p.cents ? 'Your 5-pack credit goes back on your account.' : `We refund ${C.money(p.cents)} to your card. It shows up in 5 to 10 days.`}</p>
      <label class="fine" for="rfWhy">What went wrong? (optional, it helps us fix it)</label><textarea id="rfWhy" rows="3" maxlength="500"></textarea>`, [['Refund it', 'yes'], ['Keep my order', 'no', 'line']]);
    if(v !== 'yes') return;
    const why = ($('#rfWhy') || {}).value || '';
    const r = await call(FN_CHECKOUT(), {action: 'refund', paymentId: p.id, reason: why}, true);
    if(!r.ok){ await C.ask(`<h2>We couldn't refund it here</h2><p>${r.error === 'pack-used' ? 'Every package in this 5-pack has been used.' : 'Email support@brochuredesk.com and we\'ll take care of it.'}</p>`, [['OK', 'ok']]); return; }
    await C.ask(`<h2>Refunded</h2><p>${r.refunded.cents ? `${C.money(r.refunded.cents)} is on its way back to your card.` : 'Your 5-pack credit is back on your account.'}</p>`, [['OK', 'ok']]);
    home();
  }
  function older(list){
    const el = $('#acctOlder');
    el.hidden = !list.length;
    if(!list.length) return;
    el.innerHTML = `<h2>Older orders</h2><p class="fine">Orders leave this page after 60 days. We keep everything for 2 years, so you can bring one back any time.</p>`
      + list.map(k => `<div class="pk"><div><b>Order of ${C.dayFmt(k.ordered_at)}</b><small>Kept until ${C.dayFmt(k.keep_until)}</small></div><button class="btn line" type="button" data-restore="${k.package_id}">Show it again</button></div>`).join('');
    el.querySelectorAll('[data-restore]').forEach(b => b.onclick = async () => {
      const {error} = await C.sb.rpc('restore_package', {p_package: b.dataset.restore});
      if(error){ await C.ask("<h2>We couldn't bring it back</h2><p>Email support@brochuredesk.com and we'll do it for you.</p>", [['OK', 'ok']]); return; }
      C.openHome();
    });
  }
  // shown on Agent home: hidden orders (past 60 days) come back for 60 more days once restored
  const restoredUntil = async () => {
    if(!C.me() || C.localMode()) return {};
    const {data} = await C.sb.from('package_keep').select('package_id,visible_until');
    return Object.fromEntries((data || []).map(k => [k.package_id, k.visible_until]));
  };

  // ---------- Open House flyer library (approved flyers only) ----------
  let ohReady = null;
  // designs/shared/openhouse.js loads only when the agent opens the library, so it never slows or touches the proof
  const ohScript = () => window.OpenHouse ? Promise.resolve() : new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = '/designs/shared/openhouse.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  const ohInit = () => ohReady || (ohReady = ohScript().then(() => OpenHouse.init({base: '/designs/', test: false})).then(() => true).catch(() => { ohReady = null; return false; }));
  // the package as designs/shared/openhouse.js wants it; a pick is saved on the package as ohFlyer {design, piece, library}
  // (the sheet gets no set design, so none is marked "recommended" and every pick is kept as picked; a flyer of the
  // package's own design is saved without the library mark and drawn the usual way)
  const ohPkg = (pkg, data) => ({id: pkg.id, design: '', data, openHouseFlyer: pkg.ohFlyer ? {design: pkg.ohFlyer.design, piece: pkg.ohFlyer.piece} : null});
  const ohHooks = (pkg, saved) => ({save: p => { const f = p.openHouseFlyer;
      pkg.ohFlyer = f ? Object.assign({design: f.design, piece: f.piece}, f.design !== pkg.design ? {library: true} : {}) : null; saved(); },
    log: r => console.info('open house', r)});
  async function ohLibraryCount(){ if(!await ohInit()) return 0; return OpenHouse.options({data: {}}).length; }
  async function ohPick(pkg, data, saved){
    if(!await ohInit()) return false;
    OpenHouse.openSheet(ohPkg(pkg, data), ohHooks(pkg, saved));
    return true;
  }
  // the final proof for a library pick: the library's own card (preview, photo choice, "See other Open House designs"),
  // plus a way back to the design's own flyer
  async function ohProof(box, pkg, data, saved){
    if(!await ohInit()) return false;
    const P = ohPkg(pkg, data);
    OpenHouse.proofCard(box, P, ohHooks(pkg, saved));
    box.querySelectorAll('[data-a=reset]').forEach(b => b.remove());   // "recommended" means the set's own flyer here
    const links = box.querySelector('.oh-links');
    if(links){ const b = document.createElement('button'); b.type = 'button'; b.className = 'oh-link'; b.textContent = "Use my design's own Open House flyer";
      b.onclick = () => { pkg.ohFlyer = null; saved(); }; links.appendChild(b); }
    return true;
  }

  window.Account = {
    init(ctx){ C = ctx; signinExtras(); },
    wantsPassword, passwordStep, needsWelcome, intake, home, restoredUntil,
    // fresh from the database each order (the agent may open a proof without passing Agent home)
    async credits(){ if(!C.me() || C.localMode()) return 0; const {data, error} = await C.sb.rpc('my_pack'); if(!error && data) pack = data; return pack.credits; },
    onHold: () => !!hold,
    ohLibraryCount, ohPick, ohProof,
  };
})();
