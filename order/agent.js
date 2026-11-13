// Signed-in agent flow, test drive on the working site (brief 10/20/2026). Not linked, not indexed.
// Link -> pick box -> design gallery -> rough-draft proof (no AI) -> Finalize (AI writes) -> final proof with edits ->
// approve and order -> fold-over delivery -> the other pieces or Later -> Agent home.
// Packages autosave to the account (Supabase agent_packages) when signed in, or to this browser in test mode.
// Signed in, payment is Stripe's checkout page (the checkout function sets the price and records the payment); the
// browser-only test keeps a stand-in. Paid files are made on the server (order worker, audit repair R1 11/2/2026) and
// downloaded through the order-files function; the browser's print box is only the browser-only test's stand-in.
// Printer upload and the PDF email are still test stand-ins.
// Sign-up, forgot password, the first-sign-in intake (TREC license check), the 5-pack, receipts, refunds and the Open
// House library pick live in account.js (window.Account), hooked in below.
(function(){
  const SUPABASE_URL = 'https://depwvwewbmxspoxidxrx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_mF60NaxAKLQV_pDLBoR2og_PzJ9fxxH';   // public browser key; access is enforced in the database
  const FN_MATRIX = SUPABASE_URL + '/functions/v1/matrix-listing';
  const FN_AI = SUPABASE_URL + '/functions/v1/package-ai';
  const FN_CHECKOUT = SUPABASE_URL + '/functions/v1/checkout';
  const FN_FILES = SUPABASE_URL + '/functions/v1/order-files';
  // the upload runner (uploader/runner.py in the code repo), on the upload server since 11/9/2026; a printer or piece
  // without a recorded recipe offers the download instead
  const UPLOAD_RUNNER = 'https://upload.brochuredesk.com';
  // same ids and names as config/printers.json in the code repo
  // printers that can't print to the edge of the paper: the brochure's edge-to-edge design gets a white border there (owner 11/11/2026)
  const NO_BLEED = {'fedex-office': 'FedEx Office'};
  const noBleedNote = id => NO_BLEED[id] ? `<b>${NO_BLEED[id]} can't print to the edge of the paper.</b> Your brochure is designed to run right to the edges, so ${NO_BLEED[id]} prints it with a thin white border (about 1/4 inch) all the way around. For edge-to-edge printing, pick another printer.` : '';
  const PRINTERS = [['vistaprint', 'Vistaprint'], ['fedex-office', 'FedEx Office'], ['uprinting', 'UPrinting'], ['gotprint', 'GotPrint'],
    ['next-day-flyers', 'Next Day Flyers'], ['printplace', 'PrintPlace'], ['smartpress', 'Smartpress'], ['overnight-prints', 'Overnight Prints'],
    ['psprint', 'PsPrint'], ['wise-pelican', 'Wise Pelican'], ['xpress-docs', 'Xpress Docs']];
  const MAX_PHOTOS = 16, PHOTO_W = 900, ALL_PHOTOS = 60;
  // photo picker (brief preview-and-lookup-10-24): about 13 photos go in the package; the rest wait in the lower box
  const PICK_CAP = 13;
  const PICK_FULL = 'You need to remove an active photo to pull in a new photo.';   // the owner's wording; don't change without asking
  const PICK_LABELS = {upper: 'In your package', lower: 'More listing photos'};     // draft wording
  // the line under the preview plan (C04 F01 and F02, approved 11/13/2026, in the "we" voice; worded to the 11/10 rule that
  // plans are never redrawn, only placed as given and tinted): F02 when the plan was too rough to turn into clean lines
  const PLAN_NOTE = "We'll place your floor plan just as the listing gives it, in this design's colors.";
  const PLAN_NOTE_ROUGH = "This is your plan as we received it. We'll place it just as it is, sized to fit this design.";
  const PT = window.PreviewTools;
  const FINE_PRINT = 'Information deemed reliable but not guaranteed.';
  const PRICE = {full: 2500, essentials: 2000, single: 1000};
  const KIND_LABEL = {full: 'Full package', essentials: 'The Essentials', single: 'Single piece'};
  const PIECES = [
    {id: 'foldover', label: 'Fold-over brochure', short: 'brochure'},
    {id: 'open-house-flyer', label: 'Open House flyer', short: 'flyer'},
    {id: 'postcard', label: 'Just Listed postcard', short: 'postcard'},
    // the two-sided 8.5 x 11 listing flyer, in the $25 package (owner 11/2/2026), for designs that have one (flyer-front/back)
    {id: 'listing-flyer', label: 'Two-sided listing flyer', short: 'listing flyer', full: true},
    // the Just Sold postcard: with the full package and the Essentials, picked up from Agent home after the sale (not one of
    // the pieces approved with the package; open 2 years from the sale date; order-files and the order worker check it too)
    {id: 'just-sold', label: 'Just Sold postcard', short: 'Just Sold postcard', after: true},
  ];
  const JUST_SOLD_DAYS = 730;
  const HAS_FLYER = {};   // design id -> true once its pieces.json shows flyer-front and flyer-back
  // Approved pieces go live as they are approved (owner 11/7/2026): a design's pieces.json lists only its approved pieces,
  // and "comingSoon" names the piece types still in review. Those show "Coming soon" and can't be ordered.
  const SOON = {}, SPEC_NOW = {};   // design id -> its coming-soon piece ids; design id -> its loaded pieces.json
  const IVORY_PANELS = [{id: 'front', label: 'Front'}, {id: 'back', label: 'Back'}, {id: 'top', label: 'Inside, top'}, {id: 'bottom', label: 'Inside, bottom'}];
  const COLORS = ['#1f4e5f', '#1F4D3F', '#1d3557', '#7a2e3a', '#3a3a3a', '#8a6a2f'];
  const STYLE_SAMPLE = {
    classic: 'Three bedrooms and two full baths, with a kitchen redone top to bottom.',
    luxury: 'White oak runs through the main rooms. The kitchen keeps to stone, steel and one long island.',
    urban: 'Coffee is a short walk away, and Downtown is one quick drive.',
    spread: 'A fenced yard, a flex room off the kitchen and a closet in every hall.',
    easy: 'Everything used day to day sits on one floor, with a yard that asks little of a weekend.',
  };
  const SAMPLE_AGENT = {name: 'Avery Morgan', designation: 'REALTOR®', nar: false, phone: '713.555.0123', phoneLabel: 'Call / Text',
    email: 'avery@yourbrokerage.com', web: 'yourbrokerage.com', qrLabel: 'Scan for details', headshot: null, qr: '/designs/qr.png'};
  const SAMPLE_BRAND = {brokerage: 'Any Brokerage', accent: '#1f4e5f', paper: '#f3f0ea', ink: '#232323', muted: '#5a5a5a',
    phone: '713.555.0100', web: 'anybrokerage.com', officeLabel: 'Office', logo: '/designs/samples/larkspur/AnyBrokerage_forest.png',
    logoOnDark: '/designs/samples/larkspur/AnyBrokerage_gold-on-dark.png'};
  const SAMPLE_LISTING = {
    link: 'sample', listing: {address: '4127 Larkspur Bend Street', neighborhood: 'East End', city: 'Houston', state: 'Texas', zip: '77023',
      beds: 3, baths: 2, halfBaths: 0, sqft: 1385, yearBuilt: 1940, stories: 1},
    photos: [['front', 'front exterior, 1940 bungalow, new siding'], ['living', 'living room, open to dining'], ['kitchen', 'kitchen, new cabinets'],
      ['kitchen2', 'kitchen bar seating'], ['dining', 'dining area'], ['nook', 'breakfast nook'], ['hall', 'entry'], ['primary', 'primary bedroom'],
      ['bedroom2', 'bedroom two'], ['study', 'bedroom three'], ['office', 'primary bath'], ['family', 'front exterior, side angle'], ['lawn', 'backyard']]
      .map(([f, c], n) => ({n, url: `/designs/samples/larkspur/${f}.jpg`, desc: c}))
  };

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = c => '$' + (c / 100).toFixed(c % 100 ? 2 : 0);
  const dayFmt = d => new Date(d).toLocaleDateString('en-US', {timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric'});
  const addDays = (d, n) => new Date(new Date(d).getTime() + n * 864e5).toISOString();
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

  let me = null, profile = null, localMode = false, pkg = null, designs = [], catalog = null;
  const specs = {}, tpls = {}, examples = {}, fontSpecs = {}, photoSrc = new Map();

  // ---------- storage: the account when signed in, this browser in test mode ----------
  const LKEY = 'bd-agent-packages', LEVENTS = 'bd-agent-events';
  const lget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch(e) { return d; } };
  const lput = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} };
  const store = {
    async list(){
      if(localMode) return Object.values(lget(LKEY, {})).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const {data, error} = await sb.from('agent_packages').select('state').order('updated_at', {ascending: false}).limit(50);
      if(error) throw error;
      return data.map(r => r.state);
    },
    async save(p){
      if(localMode){ const all = lget(LKEY, {}); all[p.id] = p; lput(LKEY, all); return; }
      const {error} = await sb.from('agent_packages').upsert({id: p.id, address: p.listing.address, stage: p.stage, state: p, updated_at: p.updatedAt});
      if(error) throw error;
    },
    async event(id, event, detail = {}){
      if(localMode){ const l = lget(LEVENTS, []); l.push({at: new Date().toISOString(), package_id: id, event, detail}); lput(LEVENTS, l.slice(-200)); }
      if(!sb) return;
      sb.from('package_events').insert(Object.assign({package_id: id, event, detail}, localMode ? {user_id: null} : {})).then(({error}) => { if(error) console.warn('event not logged', error.message); });
    }
  };
  let saveTimer = null;
  function save(now){
    if(!pkg) return;
    pkg.updatedAt = new Date().toISOString();
    $('#saved').textContent = 'Saving…';
    clearTimeout(saveTimer);
    const run = () => store.save(pkg).then(() => { $('#saved').textContent = localMode ? 'Saved in this browser' : 'Saved to your account'; })
      .catch(e => { $('#saved').textContent = "Couldn't save. Check your connection; we'll keep trying."; console.warn(e); saveTimer = setTimeout(run, 4000); });
    if(now) return run();
    saveTimer = setTimeout(run, 500);
  }

  // ---------- views ----------
  const VIEWS = ['vSignin', 'vPassword', 'vWelcome', 'vHome', 'vStart', 'vGallery', 'vLib', 'vRough', 'vWriting', 'vFinal', 'vRebrand', 'vSold'];
  function show(id){
    VIEWS.forEach(v => $('#' + v).hidden = v !== id);
    closePop();
    const hash = {vHome: 'home', vStart: 'start', vGallery: 'gallery', vLib: 'library', vRough: 'rough', vFinal: 'final', vSold: 'just-sold'}[id];
    if(hash && location.hash !== '#' + hash) history.replaceState(null, '', '#' + hash);
    window.scrollTo({top: 0, behavior: 'auto'});
  }
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]'); if(!go) return;
    e.preventDefault();
    if(go.dataset.go === 'home') openHome();
    if(go.dataset.go === 'start') openStart();
  });

  // ---------- sign in ----------
  async function boot(){
    localMode = lget('bd-local-mode', false) === true;
    if(window.Account && sb) Account.init({sb, url: SUPABASE_URL, key: SUPABASE_KEY, esc, ask, money, dayFmt, show,
      me: () => me, profile: () => profile, setProfile: p => { profile = p; }, localMode: () => localMode,
      openStart: () => openStart(), openHome: () => openHome()});
    if(!localMode && sb){
      const {data} = await sb.auth.getSession();
      me = data.session ? data.session.user : null;
    }
    // the reset email's link: choose a new password first (signed in for that one step)
    if(me && window.Account && Account.wantsPassword()){ localMode = false; whoLine(); Account.passwordStep(() => afterSignIn()); return; }
    if(!me && !localMode){ whoLine(); show('vSignin'); return; }
    await afterSignIn();
  }
  $('#signinForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target; $('#signinErr').textContent = '';
    const {data, error} = await sb.auth.signInWithPassword({email: f.email.value.trim(), password: f.password.value});
    if(error){ $('#signinErr').textContent = "That email and password didn't match. Try again."; return; }
    me = data.user; localMode = false; lput('bd-local-mode', false); f.reset();
    await afterSignIn();
  });
  $('#localMode').onclick = async () => { localMode = true; lput('bd-local-mode', true); await afterSignIn(); };
  function whoLine(){
    const w = $('#who');
    if(me) w.innerHTML = `${esc(me.email)}<button type="button" id="signout">Sign out</button>`;
    else if(localMode) w.innerHTML = `Browser-only test<button type="button" id="signout">Sign in</button>`;
    else w.textContent = '';
    const b = $('#signout'); if(b) b.onclick = async () => { if(me) await sb.auth.signOut(); me = null; localMode = false; lput('bd-local-mode', false); pkg = null; whoLine(); show('vSignin'); };
  }
  async function afterSignIn(){
    whoLine();
    if(me){
      const {data} = await sb.from('agent_profiles').select('*').eq('user_id', me.id).maybeSingle();
      profile = data || null;
      const t = await sb.from('agent_packages').select('id').limit(1);
      if(t.error){ console.warn(t.error); localMode = true; whoLine(); $('#saved').textContent = "Account saving isn't set up yet, so this test saves in this browser."; }
    }
    designs = await fetch('/designs/designs.json').then(r => r.json());
    if(await backFromCheckout()) return;
    // the first-sign-in welcome form (Texas license check) is off (owner 11/13/2026): new accounts go straight to Agent home
    const cur = lget('bd-current', null), hash = location.hash.slice(1);
    if(cur && ['rough', 'final', 'gallery', 'just-sold'].includes(hash)){
      const list = await store.list().catch(() => []);
      const p = list.find(x => x.id === cur);
      if(p){ await openPackage(p, hash); return; }
    }
    openHome();
  }

  // ---------- Agent home ----------
  // the pieces this order asks for in design d (the flyer only with designs that have it or will)
  function wanted(p, d){
    d = d || p.design;
    if(p.order.kind === 'full') return PIECES.filter(x => !x.after).filter(x => !x.full || HAS_FLYER[d] || (SOON[d] || []).includes(x.id)).map(x => x.id);
    return p.order.kind === 'essentials' ? ['open-house-flyer', 'postcard'] : [p.order.piece];
  }
  // a piece is live in a design when the design can draw it (approved); unknown until its pieces.json loads
  const hasPiece = (p, d, lid) => !SPEC_NOW[d] || !!partsFor(SPEC_NOW[d], lid, p);
  function piecesOf(p, d){ d = d || p.design; return wanted(p, d).filter(lid => hasPiece(p, d, lid)); }
  const soonOf = (p, d) => { d = d || p.design; return wanted(p, d).filter(lid => !hasPiece(p, d, lid)); };
  const pieceLabel = id => (PIECES.find(x => x.id === id) || {label: id}).label;
  function windows(p){
    if(!p.paid) return null;
    const list = piecesOf(p), approved = list.filter(id => p.approvals[id]);
    const all = approved.length === list.length;
    const last = approved.map(id => p.approvals[id]).sort().pop();
    return {
      all, fixesUntil: all ? addDays(last, 30) : addDays(p.paid.at, 60),
      ohUntil: list.includes('open-house-flyer') ? addDays(p.paid.at, 365) : null,
    };
  }
  function fixesOpen(p){ const w = windows(p); return !w || new Date() <= new Date(w.fixesUntil); }
  async function openHome(){
    show('vHome');
    $('#switchLine').onclick = () => openRebrand();
    const note = lget(NOTE_KEY(), null);
    $('#switchNote').hidden = !note;
    if(note){
      $('#switchNote').innerHTML = `<h2>New brokerage?</h2><p>We'll update all of your pieces for free.</p>
        <p><button class="btn" type="button" id="noteGo">Update my pieces</button> <button class="link" type="button" id="noteNo">Not now</button></p>`;
      lput(NOTE_KEY(), null);   // shown once
      $('#noteGo').onclick = () => openRebrand(); $('#noteNo').onclick = () => { $('#switchNote').hidden = true; };
    }
    $('#hello').textContent = `Welcome back${profile && (profile.greeting_name || profile.display_name) ? ', ' + (profile.greeting_name || profile.display_name.split(' ')[0]) : ''}`;
    let list = [];
    try { list = await store.list(); } catch(e) { $('#pickup').innerHTML = '<p class="err">We couldn\'t load your packages. Refresh to try again.</p>'; return; }
    const open = list.filter(p => !p.paid || piecesOf(p).some(id => !p.approvals[id]));
    // past orders show 60 days, longer when the agent brought an older one back (kept 2 years; account.js)
    const vis = window.Account ? await Account.restoredUntil().catch(() => ({})) : {};
    const past = list.filter(p => p.paid && (new Date() <= new Date(addDays(p.paid.at, 60)) || (vis[p.id] && new Date() <= new Date(vis[p.id]))));
    const row = (p, kind) => {
      const ps = piecesOf(p), done = ps.filter(id => p.approvals[id]).length, w = windows(p);
      const next = p.stage === 'rough' || p.stage === 'writing' ? 'Rough draft: finalize when ready' : !p.paid ? 'Proof ready to review' : `${done} of ${ps.length} pieces approved`;
      const cover = p.photos[0] ? photoUrlNow(p.photos[0].url) : '';
      return `<div class="pk">${cover ? `<img src="${esc(cover)}" alt="">` : '<img alt="">'}<div><b>${esc(p.listing.address || 'New listing')}</b>
        <small>${KIND_LABEL[p.order.kind]}${p.order.kind === 'single' ? ': ' + esc(pieceLabel(p.order.piece)) : ''} · ${esc(next)}</small>
        ${w ? `<small>${w.all ? 'Small fixes' : 'Fixes and approvals'} open until ${dayFmt(w.fixesUntil)}${w.ohUntil ? ` · Open house flyer updates until ${dayFmt(w.ohUntil)}` : ''}</small>` : ''}</div>
        <button class="btn ${kind === 'past' ? 'line' : ''}" type="button" data-open="${p.id}">${kind === 'past' ? 'Open' : 'Pick up'}</button></div>`;
    };
    $('#pickup').innerHTML = open.length ? open.map(p => row(p, 'open')).join('') : '<p class="empty">Nothing waiting. Start a package and it shows up here.</p>';
    $('#orders').innerHTML = past.length ? past.map(p => row(p, 'past')).join('') : '<p class="empty">No orders in the last 60 days.</p>';
    $$('[data-open]').forEach(b => b.onclick = () => { const p = list.find(x => x.id === b.dataset.open); openPackage(p); });
    await soldHome(list);
    if(window.Account) Account.home();
  }

  // ---------- Just Sold pickup (product.md: the matching Just Sold postcard, included, open 2 years after the sale) ----------
  // The card is the package's own design (its approved just-sold-<size>-front/back), made from the package's listing,
  // photos and written copy, with the agent's Just Sold wording. The agent adds the sale date and picks the size.
  const isoDay = d => { const c = new Date(new Date(d).toLocaleString('en-US', {timeZone: 'America/Chicago'}));
    return `${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, '0')}-${String(c.getDate()).padStart(2, '0')}`; };
  const dayOf = s => s + 'T12:00:00Z';   // a sale date (YYYY-MM-DD) read as that day in Central time
  // open through the same day 2 years after the sale (order-files and the order worker allow 731 days, leap years included)
  const soldUntil = p => p.sold && p.sold.at ? dayOf((+p.sold.at.slice(0, 4) + 2) + p.sold.at.slice(4, 10)) : null;
  function soldOpen(p){
    if(!p.paid || !['full', 'essentials'].includes(p.order.kind)) return false;
    if(!p.sold || !p.sold.at) return new Date() <= new Date(addDays(p.paid.at, JUST_SOLD_DAYS + 365));   // not sold yet
    const today = isoDay(new Date());
    return p.sold.at <= today && today <= soldUntil(p).slice(0, 10);
  }
  async function soldHome(list){
    const can = [];
    for(const p of list.filter(soldOpen)){
      const S = p.design ? await spec(p.design).catch(() => null) : null;
      if(S && partsFor(Object.assign({design: p.design}, S), 'just-sold', p)) can.push(p);
    }
    $('#soldHome').hidden = !can.length;
    $('#soldList').innerHTML = can.map(p => {
      const cover = p.photos[0] ? photoUrlNow(p.photos[0].url) : '';
      const st = !p.sold || !p.sold.at ? 'Add the sale date to make it'
        : `Sold ${dayFmt(dayOf(p.sold.at))} · ${p.approvals['just-sold'] ? 'Approved' : 'Ready to review'} · open until ${dayFmt(soldUntil(p))}`;
      return `<div class="pk">${cover ? `<img src="${esc(cover)}" alt="">` : '<img alt="">'}<div><b>${esc(p.listing.address || 'Listing')}</b><small>${esc(st)}</small></div>
        <button class="btn line" type="button" data-sold="${p.id}">Pick up</button></div>`;
    }).join('');
    $$('[data-sold]').forEach(b => b.onclick = () => openPackage(list.find(x => x.id === b.dataset.sold), 'just-sold'));
  }
  async function openSold(p){
    pkg = p;
    if(!soldOpen(p)){ await openHome(); return; }
    show('vSold');
    $('#soldAddr').textContent = p.listing.address || '';
    const di = $('#soldDate');
    di.max = isoDay(new Date()); di.min = isoDay(p.paid.at);
    di.value = (p.sold || {}).at || '';
    const size = (p.sold || {}).size || (p.order.size === 'both' ? '6x11' : p.order.size) || '6x11';
    if(!p.sold || !p.sold.size) pkg.sold = Object.assign({}, p.sold, {size});
    $$('input[name=soldSize]').forEach(r => { r.checked = r.value === size; });
    const change = async () => {
      const v = di.value;
      $('#soldErr').textContent = '';
      if(v && (v > di.max || v < di.min)){ $('#soldErr').textContent = v > di.max ? "The sale date can't be in the future." : 'The sale date is before this package was ordered.'; return; }
      const z = (document.querySelector('input[name=soldSize]:checked') || {}).value || size;
      const was = JSON.stringify(pkg.sold || {});
      pkg.sold = Object.assign({}, pkg.sold, {at: v || null, size: z});
      if(JSON.stringify(pkg.sold) !== was) delete pkg.approvals['just-sold'];   // a new date or size: approve it again
      save();
      await drawSold();
    };
    di.onchange = change;
    $$('input[name=soldSize]').forEach(r => r.onchange = change);
    $('#soldWording').onclick = async () => { await $('#jsWording').onclick(); await drawSold(); };
    $('#soldApprove').onclick = approveSold;
    await drawSold();
  }
  async function drawSold(){
    const S = Object.assign({}, await spec(pkg.design)); S.design = pkg.design;
    const written = !!pkg.copy[pkg.design];
    await drawParts($('#soldProof'), pkg.design, partsFor(S, 'just-sold', pkg) || [], await dataFor(pkg.design, written));
    const dated = !!(pkg.sold && pkg.sold.at), a = pkg.approvals['just-sold'];
    $('#soldApprove').disabled = !dated || !written;
    $('#soldApprove').textContent = a ? 'Get my print file' : 'Approve';
    $('#soldState').textContent = !written ? 'Finalize your package first; this card uses its written copy.'
      : !dated ? 'Add the sale date to approve it.' : a ? `Approved ${dayFmt(a)}.` : 'Look it over, then approve.';
    $('#soldWindow').textContent = dated ? `Open until ${dayFmt(soldUntil(pkg))}, 2 years after the sale.` : 'Open for 2 years after the sale.';
  }
  async function approveSold(){
    if(!pkg.sold || !pkg.sold.at) return;
    if(!pkg.approvals['just-sold']){
      pkg.approvals['just-sold'] = new Date().toISOString();
      store.event(pkg.id, 'approve', {piece: 'just-sold', sold: pkg.sold.at, size: pkg.sold.size});
    }
    await save(true);
    await drawSold();
    await deliver('just-sold');
  }
  // ---------- Just Sold wording (owner 10/30 and 10/31): years, write-up, steps and their order, call to action ----------
  // Saved on the account with the brand kit; every Just Sold card after this reads it (agent.years, agent.justSold).
  // The suggested wording here is Map Room's (the eight sets' sample); each design keeps its own number of steps.
  $('#jsWording').onclick = async () => {
    const stock = await fetch('/order/data/js-steps-sample.json').then(r => r.json()).then(j => j.pc.js).catch(() => null);
    if(!stock){ await ask('<h2>Not available right now</h2><p>Try again in a minute.</p>', [['OK', 'ok']]); return; }
    const k = brandKit() || {};
    let draft = {years: k.years || null, justSold: k.justSold || {}};
    const v = await ask(`<h2>Your Just Sold wording</h2><div id="jsBox" style="max-width:560px"></div>`, [['Done', 'done'], ['Cancel', 'cancel', 'line']], false, () => {
        ProofEditor.justSold($('#jsBox'), {stock: {writeup9: stock.front9, writeup11: stock.front11, steps: stock.steps, stepsLabel: stock.stepsLabel, cta: stock.cta},
          agent: draft, saved: !!k.justSold,
          onChange: a => { draft = a; },
          onSave: (w, years) => { const kit = Object.assign({}, brandKit() || {}, {years}); if(w) kit.justSold = w; else delete kit.justSold; saveKit(kit); }});
      });
    if(v !== 'done') return;
    const kit = Object.assign({}, brandKit() || {}, {years: draft.years});
    if(Object.keys(draft.justSold || {}).length) kit.justSold = draft.justSold; else delete kit.justSold;
    saveKit(kit);
  };

  // ---------- brokerage switch: free rebrand (brief brokerage-switch-and-matrix-links-10-24) ----------
  // The agent's brand kit (brokerage, logo, colors, office, TREC sponsoring broker, contact) feeds every piece. Changing
  // brokerages updates it once; then any past order from the last 2 years re-renders in the new brand for free (data
  // fields only: no writer, reviewer or photo read), with before and after proofs, and goes to the printer the usual way.
  // Test page: the kit lives in this browser (agent_profiles.brand_kit once the 10/25 migration runs).
  const KIT_KEY = () => 'bd-brand-kit:' + (me ? me.id : 'local'), NOTE_KEY = () => 'bd-switch-note:' + (me ? me.id : 'local');
  let kitOverride;   // a render for one brand (the rebrand's before and after)
  const brandKit = () => lget(KIT_KEY(), null);
  function kitBrand(k){
    if(!k) return {};
    const o = {brokerage: k.brokerage, logo: k.logo, logoOnDark: k.logoOnDark || k.logo, phone: k.officePhone, web: k.officeWeb, address: k.officeAddress,
      sponsoringBroker: k.sponsoringBroker, sample: false};
    return Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== ''));
  }
  function saveKit(k){
    const old = brandKit();
    lput(KIT_KEY(), k);
    if(sb && me) sb.from('agent_profiles').update({brand_kit: k}).eq('user_id', me.id).then(({error}) => { if(error) console.warn('brand kit not saved to the account yet', error.message); });
    // watch for switches: a new sponsoring broker shows a one-time note on the next visit to Agent home
    if(old && k.sponsoringBroker && old.sponsoringBroker && k.sponsoringBroker !== old.sponsoringBroker) lput(NOTE_KEY(), {to: k.sponsoringBroker, at: new Date().toISOString()});
  }
  // the logo's own colors, most used first (near-white, near-black and see-through pixels left out)
  async function logoColors(src){
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    const k = Math.min(1, 160 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
    const g = c.getContext('2d', {willReadFrequently: true}); g.drawImage(img, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data, bins = new Map();
    for(let i = 0; i < d.length; i += 4){
      if(d[i + 3] < 200) continue;
      const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
      if(mn > 235 || mx < 25) continue;
      const key = [d[i], d[i + 1], d[i + 2]].map(v => v >> 4).join(','), b = bins.get(key) || {n: 0, r: 0, g: 0, b: 0};
      b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; bins.set(key, b);
    }
    const hex = b => '#' + [b.r, b.g, b.b].map(v => Math.round(v / b.n).toString(16).padStart(2, '0')).join('');
    const out = [];
    for(const b of [...bins.values()].sort((x, y) => y.n - x.n)){
      const h = hex(b), far = out.every(o => { const a = parseInt(o.slice(1), 16), q = parseInt(h.slice(1), 16);
        return Math.abs((a >> 16) - (q >> 16)) + Math.abs((a >> 8 & 255) - (q >> 8 & 255)) + Math.abs((a & 255) - (q & 255)) > 90; });
      if(far) out.push(h); if(out.length === 3) break;
    }
    return out.length ? out : ['#1f4e5f'];
  }
  const fileUrl = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  const RB_STEPS = ['Upload your new brokerage logo.', 'Update your contact info.', 'Pick the pieces to update.', 'Review your updated pieces.', 'Send to your preferred printer.'];
  let rb = null;
  async function openRebrand(){
    show('vRebrand');
    const k = brandKit() || {};
    rb = {step: 0, kit: JSON.parse(JSON.stringify(k)), old: k, orders: [], picks: new Set(), designFor: {}};
    rb.kit.contact = Object.assign({email: (profile && profile.preferred_email) || '', phone: (profile && profile.cell) || '', web: ''}, k.contact || {});
    try { rb.orders = (await store.list()).filter(p => p.paid && new Date(p.paid.at) >= new Date(addDays(new Date().toISOString(), -730))); } catch(e) { rb.orders = []; }
    rb.picks = new Set(rb.orders.map(p => p.id));   // all checked by default
    rbDraw();
  }
  function rbDraw(){
    $('#rbSteps').innerHTML = RB_STEPS.map((t, i) => `<li class="${i < rb.step ? 'done' : i === rb.step ? 'on' : ''}">${t.replace(/\.$/, '')}</li>`).join('');
    [rbLogo, rbContact, rbPick, rbReview, rbSend][rb.step]();
    window.scrollTo({top: 0});
  }
  const rbNav = (next, back) => `<p class="acts">${back ? '<button type="button" class="btn line" id="rbBack">Back</button>' : ''}<button type="button" class="btn" id="rbNext">${next}</button></p>`;
  function rbWire(onNext){
    const b = $('#rbBack'); if(b) b.onclick = () => { rb.step--; rbDraw(); };
    $('#rbNext').onclick = async () => { if(await onNext() !== false){ rb.step++; rbDraw(); } };
  }
  function rbLogo(){
    const K = rb.kit, cs = K.colors || [];
    $('#rbBody').innerHTML = `<h2>${RB_STEPS[0]}</h2>
      <div class="stack2">
        <label>Brokerage logo (PNG, JPG or SVG)<input type="file" id="rbLogo" accept="image/png,image/jpeg,image/svg+xml"></label>
        ${K.logo ? `<img class="rb-logo" src="${esc(K.logo)}" alt="Your new brokerage logo">` : ''}
        <div id="rbColors">${cs.length ? `<p>We pulled these colors from your logo. Do they look right?</p><div class="rb-colors">${cs.map((c, i) => `<input type="color" value="${c}" data-ci="${i}" aria-label="Brand color ${i + 1}">`).join('')}</div>
          <p class="acts"><button type="button" class="btn" id="rbColorsOk">${K.colorsOk ? 'Colors confirmed' : 'Looks right'}</button> <button type="button" class="btn line" id="rbColorsEdit">Change colors</button></p>` : ''}</div>
        <label>Brokerage name<input id="rbName" value="${esc(K.brokerage || '')}" autocomplete="organization"></label>
        <label>Office address<input id="rbAddr" value="${esc(K.officeAddress || '')}"></label>
        <label>Office phone<input id="rbOPhone" value="${esc(K.officePhone || '')}" inputmode="tel"></label>
        <label>Office website<input id="rbOWeb" value="${esc(K.officeWeb || '')}"></label>
        <label>Sponsoring broker (as licensed with TREC)<input id="rbBroker" value="${esc(K.sponsoringBroker || '')}"></label>
        <p class="gray">The TREC license lookup fills this in once it's connected; for now, type it as TREC lists it.</p>
      </div><p class="err" id="rbErr"></p>${rbNav('Next')}`;
    $('#rbLogo').onchange = async e => { const f = e.target.files[0]; if(!f) return;
      K.logo = await fileUrl(f); K.colors = await logoColors(K.logo).catch(() => ['#1f4e5f']); K.colorsOk = false; rbLogo(); };
    $$('[data-ci]').forEach(i => i.oninput = () => { K.colors[+i.dataset.ci] = i.value; K.colorsOk = true; });
    const ok = $('#rbColorsOk'); if(ok) ok.onclick = () => { K.colorsOk = true; ok.textContent = 'Colors confirmed'; };
    const edit = $('#rbColorsEdit'), first = $('[data-ci]');   // opens the first color's picker; each swatch can be changed
    if(edit && first) edit.onclick = () => { try { first.showPicker(); } catch(e) { first.focus(); first.click(); } };
    rbWire(() => {
      Object.assign(K, {brokerage: $('#rbName').value.trim(), officeAddress: $('#rbAddr').value.trim(), officePhone: $('#rbOPhone').value.trim(),
        officeWeb: $('#rbOWeb').value.trim(), sponsoringBroker: $('#rbBroker').value.trim()});
      if(!K.logo || !K.brokerage){ $('#rbErr').textContent = 'Add the new logo and the brokerage name first.'; return false; }
      K.colorsOk = true;
    });
  }
  function rbContact(){
    const C = rb.kit.contact;
    $('#rbBody').innerHTML = `<h2>${RB_STEPS[1]}</h2><div class="stack2">
      <label>Email<input id="rbEmail" type="email" value="${esc(C.email || '')}" autocomplete="email"></label>
      <label>Phone<input id="rbPhone" value="${esc(C.phone || '')}" inputmode="tel" autocomplete="tel"></label>
      <label>Website<input id="rbWeb" value="${esc(C.web || '')}" autocomplete="url"></label></div>${rbNav('Next', true)}`;
    rbWire(async () => {
      const email = $('#rbEmail').value.trim(), before = (rb.old.contact || {}).email || (profile && profile.preferred_email) || '';
      Object.assign(C, {email, phone: $('#rbPhone').value.trim(), web: $('#rbWeb').value.trim()});
      if(email && before && email.toLowerCase() !== before.toLowerCase()){
        const v = await ask('<h2>Use this new email to sign in too?</h2><p>Your account and past orders stay the same either way.</p>', [['Yes', 'yes'], ['No, just on my pieces', 'no', 'line']]);
        rb.newLogin = v === 'yes' ? email : null;
      }
    });
  }
  // a past order's design that belonged to the old brokerage (its personalized design or portal kit) can't come along
  const ownedDesign = p => { const d = designs.find(x => x.id === p.design); return !!(d && d.owner && d.owner !== 'standard'); };
  function closestDesigns(p){
    const was = designs.find(x => x.id === p.design) || {}, score = d => ['layout', 'photos', 'fold', 'plan', 'look'].reduce((n, k) => n + (was[k] != null && was[k] === d[k] ? 1 : 0), 0);
    return designs.filter(d => !d.library && !(d.owner && d.owner !== 'standard')).sort((a, b) => score(b) - score(a)).slice(0, 5);
  }
  function rbPick(){
    const tile = p => { const cover = p.photos[0] ? photoUrlNow(p.photos[0].url) : '';
      return `<label class="rb-tile"><input type="checkbox" data-rb="${p.id}"${rb.picks.has(p.id) ? ' checked' : ''}>${cover ? `<img src="${esc(cover)}" alt="">` : ''}
        <span><b>${esc(p.listing.address)}</b><small>Ordered ${dayFmt(p.paid.at)}</small><small>${piecesOf(p).map(pieceLabel).join(', ')}</small></span></label>`; };
    $('#rbBody').innerHTML = `<h2>${RB_STEPS[2]}</h2>` + (rb.orders.length ? `<p class="fine">Everything from the last 2 years is checked. Uncheck anything you don't need.</p><div class="rb-grid">${rb.orders.map(tile).join('')}</div>`
      : '<p class="empty">No orders from the last 2 years yet. Your new brand is saved for every new package.</p>') + `<p class="err" id="rbErr"></p>` + rbNav(rb.orders.length ? 'Next' : 'Save my new brand', true);
    $$('[data-rb]').forEach(c => c.onchange = () => { c.checked ? rb.picks.add(c.dataset.rb) : rb.picks.delete(c.dataset.rb); });
    rbWire(() => {
      if(!rb.orders.length){ rbFinish([]); openHome(); return false; }
      if(!rb.picks.size){ $('#rbErr').textContent = 'Pick at least one order, or go back to Agent home.'; return false; }
    });
  }
  async function rbReview(){
    const list = rb.orders.filter(p => rb.picks.has(p.id));
    $('#rbBody').innerHTML = `<h2>${RB_STEPS[3]}</h2><p class="fine">Old on the left, new on the right. Copy, photos, crops and the floor plan stay as you ordered them.</p>` +
      list.map(p => `<section data-rbp="${p.id}"><h3>${esc(p.listing.address)}</h3>${ownedDesign(p) ? `<div class="offer" data-closest="${p.id}"></div>` : ''}
        ${piecesOf(p).map(lid => `<div class="rb-pair" data-lid="${lid}"><div><h4>${esc(pieceLabel(lid))}, before</h4><div class="proof single" data-side="before"></div></div>
          <div><h4>After</h4><div class="proof single" data-side="after"></div></div></div>`).join('')}</section>`).join('') + rbNav('Looks good', true);
    rbWire(() => {});
    const keep = pkg;
    for(const p of list){
      if(ownedDesign(p)){   // that design stays with the old brokerage: our five closest, then the whole gallery
        const box = $(`[data-closest="${p.id}"]`), near = closestDesigns(p);
        box.innerHTML = `<h3>Closest to what you had</h3><p class="fine">Your old design stays with your previous brokerage, so here are our five closest matches.</p><div class="rb-colors">${near.map(d => `<button type="button" class="btn line" data-swap="${p.id}:${d.id}">${esc(d.name)}</button>`).join('')}</div>
          <p class="fine">Or pick any of our designs: ${designs.filter(d => !d.library && !(d.owner && d.owner !== 'standard')).map(d => `<button type="button" class="link" data-swap="${p.id}:${d.id}">${esc(d.name)}</button>`).join(' · ')}</p>`;
        rb.designFor[p.id] = rb.designFor[p.id] || (near[0] && near[0].id);
      }
      const after = Object.assign({}, p, {design: rb.designFor[p.id] || p.design, brand: Object.assign({}, p.brand, {accent: (rb.kit.colors || [])[0] || p.brand.accent})});
      for(const lid of piecesOf(p)){
        for(const [side, P, kit] of [['before', p, p.brandAtOrder || null], ['after', after, rb.kit]]){
          pkg = P; resolvePhotos(P); kitOverride = kit;
          try {
            const S = await spec(P.design); S.design = P.design;
            const parts = partsFor(S, lid, P);
            const box = $(`[data-rbp="${p.id}"] [data-lid="${lid}"] [data-side="${side}"]`);
            const part = parts && (parts.find(x => /back/i.test(x.panel || x.label || '')) || parts[0]);   // the side with the contact card
            if(part && box) await drawParts(box, P.design, [part], await dataFor(P.design, true));
          } finally { kitOverride = undefined; }
        }
      }
    }
    pkg = keep;
    $$('[data-swap]').forEach(b => b.onclick = () => { const [id, d] = b.dataset.swap.split(':'); rb.designFor[id] = d; rbReview(); });
  }
  function rbSend(){
    $('#rbBody').innerHTML = `<h2>${RB_STEPS[4]}</h2><p>No charge for the update. You only pay your printer.</p>
      <div class="opts"><button type="button" class="btn" value="both">Upload to my printer and download</button>
      <button type="button" class="btn line" value="printer">Upload to my printer only</button><button type="button" class="btn line" value="download">Download only</button></div>
      <p class="gray">Test page: the printer upload is a stand-in, and nothing is ordered at a printer or mail vendor without your yes there.</p>${rbNav('Done', true)}`;
    let how = null;
    $$('#rbBody .opts .btn').forEach(b => b.onclick = () => { how = b.value; $$('#rbBody .opts .btn').forEach(x => x.classList.toggle('line', x !== b)); });
    rbWire(async () => {
      if(!how){ await ask('<h2>Pick where it goes</h2><p>Choose the printer upload, a download, or both.</p>', [['OK', 'ok', 'line']]); return false; }
      await rbFinish(rb.orders.filter(p => rb.picks.has(p.id)), how);
      openHome(); return false;
    });
  }
  async function rbFinish(list, how){
    const k = Object.assign({}, rb.kit, {updatedAt: new Date().toISOString()});
    saveKit(k);
    if(rb.newLogin && me && sb){ const {error} = await sb.auth.updateUser({email: rb.newLogin}); if(error) console.warn(error.message); }
    for(const p of list){
      p.brandHistory = (p.brandHistory || []).concat([{brand: p.brandAtOrder || null, until: k.updatedAt}]);
      p.brandAtOrder = k; p.rebrandedAt = k.updatedAt;
      p.brand = Object.assign({}, p.brand, {accent: (k.colors || [])[0] || p.brand.accent});   // the new brokerage's colors; fonts stay
      if(rb.designFor[p.id]){ p.design = rb.designFor[p.id]; p.refit = true; }   // a fold-over that won't fit gets one small writer pass (rebrand_refit)
      p.updatedAt = k.updatedAt;
      await store.save(p).catch(e => console.warn(e));
    }
    // the owner's daily report counts these (no alert)
    if(list.length) store.event(list[0].id, 'rebrand', {orders: list.map(p => p.id), pieces: list.reduce((n, p) => n + piecesOf(p).length, 0), how, free: true});
  }

  async function openPackage(p, where, piece){
    pkg = p; lput('bd-current', p.id);
    resolvePhotos(p);
    if(p.design) await spec(p.design).catch(() => null);   // knows whether this design has the two-sided flyer (piecesOf)
    if(where === 'gallery') return openGallery();
    if(where === 'just-sold') return openSold(p);
    if(where === 'library' || (p.lib && !p.design)) return openLib();
    if(p.stage === 'rough' || p.stage === 'writing') return openRough();
    return openFinal(piece || (where === 'final' ? null : nextPiece()));
  }

  // ---------- 1. link + pick box ----------
  let lookup = null;
  function openStart(){
    pkg = null; lookup = null;
    $('#link').value = ''; $('#progress').hidden = true; $('#pickBox').hidden = true; $('#toGallery').disabled = true;
    show('vStart'); setTimeout(() => $('#link').focus(), 50);
  }
  function stepTo(step, pct, text){
    const order = ['lookup', 'photos', 'details'];
    $$('#steps li').forEach(li => { const i = order.indexOf(li.dataset.step), j = order.indexOf(step);
      li.className = i < j || step === 'done' ? 'done' : i === j ? 'on' : ''; });
    $('#barFill').style.width = pct + '%';
    $('#status').textContent = text;
  }
  const MSG = {
    'other-site': "We couldn't find that listing from the link. Paste its HAR or Matrix link instead.",
    'not-a-listing': "That HAR link isn't a single listing. Open the listing on HAR and copy that page's link.",
    'not-matrix': "That doesn't look like a Matrix listing link. Paste the link from the Matrix email or share page.",
    'not-a-link': "That doesn't look like a link yet. Paste the whole listing link, starting with https://.",
    blocked: "That site asked us to prove we're a person, and we won't try to get past that. Paste the HAR or Matrix link instead.",
    unreadable: "We opened the link but couldn't find the listing on it.",
    'not-found': "That link didn't open a listing. It may have expired.",
    unreachable: "We couldn't reach the listing site just now. Try again in a moment.",
    'slow-down': "That's a lot of tries in a row. Wait a few minutes and try again.",
    network: 'Something went wrong on our end while reading the link. Try again.'
  };
  // HAR, Matrix (share and emailed links), Zillow / Realtor.com / Redfin (found on HAR by address) and brokerage pages all go to the reader
  function localCheck(v){
    let u; try { u = new URL(v); } catch(e) { return 'not-a-link'; }
    return /^https?:$/.test(u.protocol) ? '' : 'not-a-link';
  }
  $('#linkForm').addEventListener('submit', e => { e.preventDefault(); runLookup($('#link').value.trim()); });
  $('#sampleListing').onclick = () => runLookup('sample');
  async function runLookup(link){
    $('#linkErr').textContent = '';
    if(link !== 'sample'){ const bad = localCheck(link); if(bad){ $('#progress').hidden = false; $('#linkErr').textContent = MSG[bad]; return; } }
    $('#progress').hidden = false; $('#pickBox').hidden = false; $('#toGallery').disabled = true; $('#go').disabled = true;
    pickChanged();
    try {
      stepTo('lookup', 8, 'Reading your listing…');
      let j;
      if(link === 'sample'){ j = {ok: true, listing: SAMPLE_LISTING.listing, photos: SAMPLE_LISTING.photos, spares: []}; await new Promise(r => setTimeout(r, 500)); }
      else {
        try { j = await fetch(`${FN_MATRIX}?link=${encodeURIComponent(link)}`).then(r => r.json()); } catch(e) { throw {code: 'network'}; }
        if(!j.ok) throw {code: j.error};
      }
      // every listing photo (the picker's lower box holds the ones we didn't pick); floor plan images stay out of photo spots
      const fp = (j.listing && j.listing.floorPlan) || {found: false, source: null, files: [], stories: null};
      const planUrls = new Set(fp.files.map(f => f.url)), seen = new Set(), cand = [];
      for(const p of j.photos.concat(j.spares || [], (j.gallery || []).map(g => ({n: g.n, url: g.url, desc: g.caption || '', direct: g.direct}))))
        if(p.url && !seen.has(p.url) && !planUrls.has(p.url) && PT.roomKey(p.room || p.desc) !== 'floor plan'){ seen.add(p.url); cand.push(p); }
      cand.splice(ALL_PHOTOS);
      const picked = new Set(j.photos.concat(j.spares || []).map(p => p.url)), want = cand.length, got = [];
      stepTo('photos', 25, `Found ${j.totalPhotos || cand.length} photos, getting them all…`);
      let next = 0, done = 0;
      const worker = async () => {
        while(next < cand.length){
          const i = next++;
          try { const u = await loadPhoto(cand[i].url, link !== 'sample', cand[i].direct); got[i] = u ? cand[i] : null; } catch(e) { got[i] = null; }
          done++; if(done <= want) stepTo('photos', 25 + Math.round(55 * done / want), `Getting photo ${Math.min(done, want)} of ${want}…`);
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      const keep = got.filter(Boolean);
      if(!keep.length) throw {code: 'unreadable'};
      // the upper box: our picks in listing order (staged first, as the reader sorted them), up to the cap
      const upper = keep.filter(p => picked.has(p.url)).slice(0, PICK_CAP).sort((a, b) => a.n - b.n);
      if(upper.length < PICK_CAP) upper.push(...keep.filter(p => !upper.includes(p)).slice(0, PICK_CAP - upper.length));
      stepTo('details', 90, 'Filling in the details…');
      const l = j.listing;
      // the whole listing record is kept (description, every detail field, rooms, what conveys, every photo caption,
      // and price / schools in `withheld`, which package-ai never passes to the writer)
      lookup = {link, listing: Object.assign({}, l, {address: l.address, neighborhood: l.neighborhood || '', city: l.city || 'Houston', state: 'Texas', zip: l.zip || '',
        beds: l.beds, baths: l.baths, halfBaths: l.halfBaths || 0, sqft: l.sqft, yearBuilt: l.yearBuilt || l.year, stories: l.stories || null, description: l.description || ''}),
        photos: keep.map(p => ({n: p.n, url: p.url, desc: p.desc || '', room: PT.roomKey(p.room || p.desc)})), upper: upper.map(p => p.url),
        floorPlan: {source: fp.source, files: fp.files, stories: fp.stories, active: false, art: null, asked: null}, moves: 0, id: uuid(), tags: {}};
      stepTo('done', 100, `Found ${lookup.listing.address}: ${keep.length} photos. Pick what you'd like below.`);
      $('#toGallery').disabled = false;
      drawPicker(); drawPlanBox(); if(fp.files.length) loadPlan(fp.files, fp.source);
      if(link !== 'sample') tagRooms();
    } catch(e) {
      $('#linkErr').textContent = MSG[e && e.code] || MSG.network; stepTo('lookup', 0, '');
    } finally { $('#go').disabled = false; }
  }
  function pickChanged(){
    const kind = document.querySelector('input[name=kind]:checked').value;
    $('#singlePiece').disabled = kind !== 'single';
    const hasCard = kind !== 'single' || $('#singlePiece').value === 'postcard';
    $('#sizeRow').hidden = !hasCard;
  }
  $$('input[name=kind]').forEach(r => r.onchange = pickChanged);
  $('#singlePiece').onchange = () => { document.querySelector('input[name=kind][value=single]').checked = true; pickChanged(); };
  $('#toGallery').onclick = () => {
    const kind = document.querySelector('input[name=kind]:checked').value;
    const now = new Date().toISOString();
    const byUrl = Object.fromEntries(lookup.photos.map(p => [p.url, p])), fpl = lookup.floorPlan;
    if(fpl.active && fpl.art && !lookup.listing.stories && fpl.art.length > 1) lookup.listing.stories = fpl.art.length;
    const ROLE_OF = {'front exterior': 'front', 'side exterior': 'side', 'back exterior': 'back', 'living room': 'living', 'family room': 'family', kitchen: 'kitchen',
      'dining room': 'dining', 'breakfast area': 'nook', 'primary bedroom': 'primary', bedroom: 'bedroom', 'primary bath': 'bath', bathroom: 'bath', study: 'office',
      entry: 'entry', stairs: 'stairs', 'laundry room': 'laundry', garage: 'garage', patio: 'patio', pool: 'pool', backyard: 'yard', aerial: 'aerial', view: 'view', community: 'amenity'};
    for(const p of lookup.photos){ const t = lookup.tags[p.url];
      if(t) Object.assign(p, {role: t.role, exterior: t.exterior, house: t.house || undefined});
      else if(p.room && ROLE_OF[p.room] && !/exterior|aerial/.test(p.room)) Object.assign(p, {role: ROLE_OF[p.room], exterior: false}); }
    pkg = {id: lookup.id, createdAt: now, updatedAt: now, link: lookup.link, listing: lookup.listing, photos: lookup.upper.map(u => byUrl[u]),
      morePhotos: lookup.photos.filter(p => !lookup.upper.includes(p.url)), tags: lookup.tags,
      floorPlan: {source: fpl.active ? fpl.source : null, files: fpl.files, stories: fpl.stories, active: !!(fpl.active && fpl.art), art: fpl.active ? fpl.art : null,
        removed: !!fpl.removed},
      order: {kind, piece: kind === 'single' ? $('#singlePiece').value : null, size: document.querySelector('input[name=size]:checked').value},
      design: null, brand: {accent: COLORS[0], fonts: {}}, copyStyle: suggestStyle(lookup.listing), arrangements: {}, ohFlyer: null,
      stage: 'rough', copy: {}, approvals: {}, paid: null, delivery: {}, openHouse: {kind: 'public', date: '', start: '13:00', end: '16:00'}, edits: 0};
    lput('bd-current', pkg.id);
    save(true);
    // measure (brief): how often agents move photos in the picker and remove the floor plan
    store.event(pkg.id, 'photo-picker', {moves: lookup.moves, inPackage: pkg.photos.length, more: pkg.morePhotos.length});
    if(fpl.removed) store.event(pkg.id, 'floor-plan-removed', {source: fpl.source});
    openGallery();
    tagPhotos();
    notePhotos();
  };

  // ---------- photo picker and floor plan (after the lookup) ----------
  function drawPicker(){
    $('#photoPick').hidden = false;
    const photos = lookup.photos.map(p => ({key: p.url, src: photoUrlNow(p.url), room: p.room ? PT.heading(p.room) : ''}));
    PT.picker($('#pickerRoot'), {photos, upper: lookup.upper, cap: PICK_CAP, full: PICK_FULL, labels: PICK_LABELS,
      onChange: up => { lookup.upper = up; lookup.moves++; }});
  }
  // room types: captions first (free); one low-cost photo read for the photos with no usable caption, plus the
  // exteriors (their whole-house box keeps every crop from cutting the house)
  // the sample listing's photos come with their room types (no photo read): front.jpg is the front of the house, and so on
  const SAMPLE_ROLES = {front: ['front', true, {left: .14, top: .05, right: .88, bottom: .74}], family: ['side', true, {left: .2, top: .19, right: .83, bottom: .67}],
    lawn: ['yard', true], living: ['living'], kitchen: ['kitchen'], kitchen2: ['kitchen'], dining: ['dining'], nook: ['nook'], hall: ['entry'],
    primary: ['primary'], bedroom2: ['bedroom'], study: ['bedroom'], office: ['bath']};
  async function tagRooms(){
    if(lookup.link === 'sample'){
      for(const p of lookup.photos){ const r = SAMPLE_ROLES[p.url.split('/').pop().replace(/\.jpg$/, '')]; if(!r) continue;
        lookup.tags[p.url] = {role: r[0], house: r[2] || null, exterior: !!r[1]}; if(!p.room) p.room = PT.ROLE_ROOM[r[0]] || ''; }
      return;
    }
    const ext = /exterior|aerial/;
    const need = lookup.photos.filter(p => !p.room || ext.test(p.room));
    if(!need.length) return;
    try {
      const photos = [];
      for(const [i, p] of need.entries()) photos.push({id: 'u' + i, desc: p.desc || '', data: await photoB64(photoUrlNow(p.url))});
      const j = await ai({action: 'tag-photos', packageId: lookup.id, photos});
      for(const t of j.photos || []){ const p = need[+t.id.slice(1)]; if(!p) continue;
        lookup.tags[p.url] = {role: t.role, house: t.house || null, exterior: !!t.exterior};
        if(!p.room) p.room = PT.ROLE_ROOM[t.role] || ''; }
      lookup.tagCost = j.cost || 0;
      planPhotos();
      if(!$('#vStart').hidden) drawPicker();
    } catch(e) { /* labels then come from the captions alone */ }
  }
  // the photo half of the floor plan check (every listing, even when the documents had a plan): a photo the read labels
  // a floor plan leaves the photo boxes and joins the listing's plan files; with no plan yet, it becomes the plan
  function planPhotos(){
    const plans = lookup.photos.filter(p => (lookup.tags[p.url] || {}).role === 'floorplan' || p.room === 'floor plan');
    if(!plans.length) return;
    const F = lookup.floorPlan, out = new Set(plans.map(p => p.url));
    lookup.photos = lookup.photos.filter(p => !out.has(p.url));
    lookup.upper = lookup.upper.filter(u => !out.has(u));
    for(const p of lookup.photos){ if(lookup.upper.length >= PICK_CAP) break; if(!lookup.upper.includes(p.url)) lookup.upper.push(p.url); }
    const have = new Set(F.files.map(f => f.url)), add = plans.filter(p => !have.has(p.url)).map(p => ({url: p.url, kind: 'image', label: p.desc || '', from: 'photo'}));
    F.files = F.files.concat(add);
    F.sources = [...new Set((F.sources || (F.source ? [F.source] : [])).concat('photo'))];
    store.event(lookup.id, 'floor-plan-photo', {photos: plans.length, alsoIn: F.source || null});
    if(!F.active && !F.removed) loadPlan(add.length ? add : F.files.filter(f => f.from === 'photo'), 'photo');
  }
  async function loadPlan(files, source){
    const box = $('#planBody'); box.innerHTML = '<p class="fine">Reading your floor plan…</p>';
    try {
      // one place's files only (a plan found as a document and again as a photo is the same plan, not two floors)
      files = files.filter(f => !f.from || !source || f.from === source);
      const blobs = await planBlobs(files);
      let art = await PT.cleanPlan(blobs, files.map(f => /\b(1st|first|ground|main)\b/i.test(f.label || '') ? 'First floor' : /\b(2nd|second|upper)\b/i.test(f.label || '') ? 'Second floor' : ''));
      // a plan PDF often ends with a page of every floor together (1030 Chamboard Ln: 3 pages, 2 floors): with the
      // story count known, the pages past it are not more floors
      const st = +lookup.listing.stories || 0;
      if(st && art.length > st) art = art.slice(0, st);
      if(!art.length) throw new Error('plan');
      Object.assign(lookup.floorPlan, {source, art, active: true, removed: false});
    } catch(e) { Object.assign(lookup.floorPlan, {art: null, active: false, failed: true}); }
    drawPlanBox();
  }
  async function planBlobs(files){
    const blobs = [];
    for(const f of files.slice(0, 4)){
      if(f.blob){ blobs.push(f.blob); continue; }
      if(!f.url) throw new Error('plan');
      const r = await fetch(`${FN_MATRIX}?plan=${encodeURIComponent(f.url)}`); if(!r.ok) throw new Error('plan');
      blobs.push(await r.blob());
    }
    return blobs;
  }
  function drawPlanBox(){
    const F = lookup.floorPlan, box = $('#planBody'); $('#planBox').hidden = false;
    const from = {documents: "the listing's documents", gallery: "the listing's floor plans", photo: "the listing photos", upload: 'your upload'}[F.source] || 'your listing';
    const thumbs = () => `<div class="planthumbs">${F.art.map(a => `<img src="${esc(a.src)}" alt="Floor plan${a.label ? ', ' + esc(a.label) : ''}">`).join('')}</div>`;
    if(F.active && F.art){
      box.innerHTML = `<p>${F.source === 'upload' ? 'Your floor plan is in.' : `We found a floor plan in ${from}.`} It goes in your design.</p>${thumbs()}<p><button type="button" class="link" id="planOut">Remove the floor plan</button></p>`;
      $('#planOut').onclick = () => { F.active = false; F.removed = true; drawPlanBox(); };
    } else if(F.removed && F.art){
      box.innerHTML = `<p>Floor plan removed. Your design uses its version without a floor plan.</p><p><button type="button" class="link" id="planBack">Put the floor plan back</button></p>`;
      $('#planBack').onclick = () => { F.active = true; F.removed = false; drawPlanBox(); };
    } else if(F.asked === 'no'){
      box.innerHTML = `<p>No floor plan. Your design uses its version without one.</p><p><button type="button" class="link" id="planAsk">I have one after all</button></p>`;
      $('#planAsk').onclick = () => { F.asked = null; drawPlanBox(); };
    } else {
      // the floor plan question (versions-and-floor-plan-ask brief; proposed wording, the owner's call)
      box.innerHTML = `<p>${F.failed ? "We found a floor plan but couldn't open it." : "We didn't find a floor plan on this listing."} Do you have one?</p>
        <div class="row gap"><button type="button" class="btn" id="planYes">Yes, upload it</button><button type="button" class="btn line" id="planNo">No floor plan</button></div>
        <label class="planup" id="planUp" hidden>Floor plan (PDF, JPG or PNG; one file per floor is fine)<input type="file" id="planFile" accept="application/pdf,image/jpeg,image/png" multiple></label>`;
      $('#planYes').onclick = () => { $('#planUp').hidden = false; $('#planFile').click(); };
      $('#planNo').onclick = () => { F.asked = 'no'; drawPlanBox(); };
      $('#planFile').onchange = e => { const fs = [...e.target.files].slice(0, 4); if(!fs.length) return;
        F.files = fs.map(f => ({blob: f, label: f.name, kind: /pdf/.test(f.type) ? 'pdf' : 'image'})); loadPlan(F.files, 'upload'); };
    }
  }
  // Label what each photo shows (front of the house, kitchen, primary bedroom...) once per listing, in the background,
  // so every design can fill its photo spots on its own and keep the whole roof in exterior shots. Costs about a cent.
  async function tagPhotos(){
    const p = pkg; if(!p || p.photoTags) return;
    // photos the lookup already read, or whose caption names the room, aren't read again (one paid read per photo at most)
    const list = p.photos.map((ph, i) => ({id: 'p' + i, url: ph.url, desc: ph.desc || '', done: !!ph.role})).filter(x => !x.done && /^https:\/\//.test(x.url)).map(({done, ...x}) => x);
    if(!list.length) return;
    try {
      const j = await ai({action: 'tag-photos', packageId: p.id, photos: list});
      (j.photos || []).forEach(t => { const ph = p.photos[+t.id.slice(1)]; if(ph) Object.assign(ph, {role: t.role, exterior: t.exterior, house: t.house, note: t.note}); });
      p.photoTags = true; if(p === pkg) save();
    } catch(e) { /* labels are a helper: designs still fill from the MLS captions without them */ }
  }
  // Notes on every listing photo, the placed ones and the rest (owner 11/1: the writers use all ~45, not only the picks):
  // each photo read once, in the background while the agent picks a design, on the low-cost reading model (about half a
  // cent). Finalize hands them to the writers; if they aren't back yet it waits for them, and with none the server reads
  // them itself.
  const notesJobs = {};
  const galleryOf = p => p.photos.concat(p.morePhotos || []).filter(ph => /^https:\/\//.test(ph.url || '')).map(ph => ({url: ph.url, desc: ph.desc || ''})).slice(0, 60);
  function notePhotos(){
    const p = pkg; if(!p || p.photoNotes || notesJobs[p.id]) return notesJobs[p && p.id];
    const photos = galleryOf(p); if(!photos.length) return null;
    return notesJobs[p.id] = ai({action: 'photo-notes', packageId: p.id, photos})
      .then(j => { if(j.notes && Object.keys(j.notes).length){ p.photoNotes = j.notes; if(p === pkg) save(); } })
      .catch(() => { /* a helper: Finalize then sends the photos and the server reads them */ })
      .finally(() => { delete notesJobs[p.id]; });
  }
  function suggestStyle(L){
    if(L.sqft >= 3800) return 'luxury';
    if(L.beds >= 4) return 'spread';
    if(L.stories === 1 && L.beds <= 3 && L.yearBuilt && L.yearBuilt > 1990) return 'easy';
    return 'classic';
  }

  // ---------- photos ----------
  async function shrink(blob){
    const bmp = await createImageBitmap(blob);
    const k = Math.min(1, PHOTO_W / bmp.width), c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return URL.createObjectURL(await new Promise(r => c.toBlob(r, 'image/jpeg', .84)));
  }
  // A listing collage (one big photo plus small ones in light gutters) is kept out of the photo slots (same test as the homepage).
  function isCollage(bmp){
    const k = Math.min(1, 300 / Math.max(bmp.width, bmp.height)), w = Math.max(8, Math.round(bmp.width * k)), h = Math.max(8, Math.round(bmp.height * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d', {willReadFrequently: true}); g.drawImage(bmp, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data, L = (x, y) => { const i = (y * w + x) * 4; return .299 * d[i] + .587 * d[i+1] + .114 * d[i+2]; };
    const stat = v => { const m = v.reduce((a, b) => a + b, 0) / v.length; return [m, Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length)]; };
    const gut = (n, at, lo, hi) => { const S = []; for(let i = 0; i < n; i++){ const v = []; for(let j = lo; j < hi; j++) v.push(at(i, j)); S.push(stat(v)); }
      const out = []; for(let i = Math.max(3, Math.floor(n * .08)); i < Math.min(n - 3, Math.floor(n * .92)); i++)
        if(S[i][0] > 195 && S[i][1] < 14 && [i - 3, i + 3].every(q => S[q][1] > 15 || S[i][0] - S[q][0] > 20)) out.push(i); return out; };
    const col = (i, j) => L(i, j), row = (i, j) => L(j, i);
    for(const x of gut(w, col, 0, h)) if(gut(h, row, x + 2, w).length || gut(h, row, 0, Math.max(0, x - 1)).length) return true;
    for(const y of gut(h, row, 0, w)) if(gut(w, col, y + 2, h).length || gut(w, col, 0, Math.max(0, y - 1)).length) return true;
    return false;
  }
  // Matrix photos come through our reader (browsers can't fetch them directly); sample photos are on this site.
  // The reader saves each photo once and sends the browser to that copy: the small (about 1024 px) one here for the
  // picker and proofs, the full-size original only for print (printSrc).
  const printSrc = url => /^https:\/\/([\w-]+\.)*(harmls|harstatic)\.com\//.test(url || '') ? `${FN_MATRIX}?photo=${encodeURIComponent(url)}&size=full` : '';
  async function loadPhoto(url, viaReader, direct){
    if(photoSrc.has(url)) return photoSrc.get(url);
    if(!viaReader && url.startsWith('/')){ photoSrc.set(url, url); return url; }
    // a brokerage site's own photos can't go through the reader (Matrix and HAR photos only); try them straight from the site
    const r = await fetch(direct ? url : `${FN_MATRIX}?photo=${encodeURIComponent(url)}&size=preview`);
    if(!r.ok) throw new Error('photo');
    const blob = await r.blob();
    if(isCollage(await createImageBitmap(blob))) return null;
    const u = await shrink(blob); photoSrc.set(url, u); return u;
  }
  const photoUrlNow = url => photoSrc.get(url) || (url.startsWith('/') ? url : '');
  let photosReady = Promise.resolve();
  function resolvePhotos(p){
    photosReady = Promise.all(p.photos.map(ph => loadPhoto(ph.url, !ph.url.startsWith('/')).catch(() => null)));
    return photosReady;
  }

  // ---------- designs, pieces, data for the templates ----------
  const spec = id => specs[id] || (specs[id] = fetch(`/designs/${id}/pieces.json`).then(r => r.json()).then(S => {
    const ids = new Set(S.pieces.map(x => x.id)); HAS_FLYER[id] = ids.has('flyer-front') && ids.has('flyer-back');
    S.design = S.design || id; SOON[id] = S.comingSoon || []; SPEC_NOW[id] = S; return S; }));
  const tpl = (id, file) => tpls[id + '/' + file] || (tpls[id + '/' + file] = fetch(`/designs/${id}/${file}`).then(r => r.text()));
  const example = id => examples[id] || (examples[id] = fetch(`/designs/${id}/copy-example.json`).then(r => r.ok ? r.json() : null));
  // A design's example copy is another house: where it names that house's photos ("front", "kitchen", "pv2"; listed with
  // their tags in copy-example.json "photos"), each becomes this package's photo of the same room if there is one, else the
  // next one not used yet. The same sample photo always becomes the same package photo.
  function photoMap(ex, ids){
    const words = s => String(s || '').toLowerCase().match(/[a-z]+/g) || [], used = new Set(), out = {};
    const info = id => { const ph = pkg.photos[+String(id).slice(1)] || {}; return ' ' + words([ph.role, ph.room, ph.desc].join(' ')).join(' ') + ' '; };
    for(const [eid, t] of Object.entries((ex && ex.photos) || {})){
      const key = words(String(t).split(',')[0]).filter(w => !/^(room|area|the|of|and|view|a|an)$/.test(w));
      const free = ids.filter(id => !used.has(id));
      const hit = (key.length && (free.find(id => key.every(w => info(id).includes(' ' + w))) || free.find(id => info(id).includes(' ' + key[0]))))
        || free[0] || ids[0];
      used.add(hit); out[eid] = hit;
    }
    return out;
  }
  const mapIds = (v, m) => typeof v === 'string' ? (m[v] || v) : Array.isArray(v) ? v.map(x => mapIds(x, m))
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, mapIds(x, m)])) : v;
  async function exampleFor(id, ids){
    const ex = await example(id);
    if(!ex || !ex.photos) return ex;
    const m = photoMap(ex, ids);
    return {copy: mapIds(ex.copy, m), companion: mapIds(ex.companion || {}, m)};
  }
  const fontSpec = id => fontSpecs[id] || (fontSpecs[id] = fetch(`/designs/${id}/fonts.json`).then(r => r.ok ? r.json() : null).catch(() => null));
  // The parts one logical piece is drawn from, in this design (null when the design doesn't have the piece).
  function partsFor(S, lid, p){
    const by = Object.fromEntries(S.pieces.map(x => [x.id, x]));
    if(lid === 'foldover'){ const f = by.foldover; if(!f) return null; return (f.panels || IVORY_PANELS).map(x => ({piece: f, panel: x.id, label: x.label})); }
    if(lid === 'open-house-flyer'){
      const oh = p && p.ohFlyer && p.ohFlyer.design === S.design && by[p.ohFlyer.piece];
      const f = oh || by['open-house-flyer'] || S.pieces.find(x => x.variant === 'openhouse'); return f ? [{piece: f, label: oh ? f.title : 'Open House flyer'}] : null; }
    if(lid === 'listing-flyer'){ const f = by['flyer-front'], b = by['flyer-back'];
      return f && b ? [{piece: f, label: 'Front'}, {piece: b, label: 'Back'}] : null; }
    if(lid === 'just-sold'){   // the size picked at pickup ('both': 6x11 and 6x9, included)
      const z = (p && p.sold && p.sold.size) || (p && p.order.size) || '6x11', out = [];
      for(const s of z === 'both' ? ['6x11', '6x9'] : [z]){ const f = by[`just-sold-${s}-front`], b = by[`just-sold-${s}-back`]; if(!f || !b) return null;
        out.push({piece: f, label: `${s.replace('x', ' x ')}, front`}, {piece: b, label: `${s.replace('x', ' x ')}, back`}); }
      return out; }
    if(lid === 'postcard'){   // 'both': the 6x11 and the 6x9, each front and back (+$1)
      const sizes = p && p.order.size === 'both' ? ['6x11', '6x9'] : [(p && p.order.size) || '6x11'], out = [];
      for(const s of sizes){ const f = by[`postcard-${s}-front`], b = by[`postcard-${s}-back`]; if(!f || !b) return null;
        out.push({piece: f, label: `${s.replace('x', ' x ')}, front`}, {piece: b, label: `${s.replace('x', ' x ')}, back`}); }
      return out; }
    return null;
  }
  const arrangement = (p, id) => p.arrangements[id] || (p.arrangements[id] = p.photos.map((_, i) => i));
  function fontsFor(p, fs){
    const out = {};
    if(!fs) return out;
    for(const [role, v] of Object.entries(p.brand.fonts || {})){
      const o = fs.originals && fs.originals[role];
      if(v && o && (o.approved || []).includes(v)) out[role] = v;   // carried over only where this design approved the font
    }
    return out;
  }
  function draftCopy(ids){
    const L = pkg.listing, stats = [];
    if(L.beds) stats.push(`${L.beds} Bedroom${L.beds !== 1 ? 's' : ''}`);
    if(L.baths) stats.push(`${L.baths} Full` + (L.halfBaths ? ` + ${L.halfBaths} Half` : '') + ' Baths');
    if(L.sqft) stats.push(`${Number(L.sqft).toLocaleString('en-US')} Sq Ft`);
    if(L.yearBuilt) stats.push(`Built in ${L.yearBuilt}`);
    const rest = ids.length > 1 ? ids.slice(1) : ids; let n = 0;
    const slot = () => rest[n++ % rest.length];
    const place = [L.neighborhood, [L.city, L.state].filter(Boolean).join(', ')].filter(Boolean).join(' / ');
    const feat = () => ({photo: slot(), caption: '', title: '', body: ''}), tile = () => ({photo: slot(), title: '', body: ''});
    return {
      front: {photo: ids[0], location: place},
      insideTop: {kicker: '', title: '', stats: stats.slice(0, 4), intro: '', features: [feat(), feat()], tiles: [tile(), tile(), tile(), tile()]},
      insideBottom: {kicker: '', title: '', features: [feat(), feat(), feat()], tiles: [tile(), tile(), tile()]},
      back: {kicker: '', title: '', variant: 'photos', plans: [{photo: slot(), label: ''}], planDisclosures: [],
             feature: {photo: ids[ids.length - 1], title: '', body: ''}, locationTitle: '', locationBody: '', footnote: FINE_PRINT}};
  }
  const draftCompanion = ids => ({fineprint: FINE_PRINT, flyerPhotos: ids.slice(0, 7), postcard: {photos: ids.slice(0, 5)}});
  // Atlas builds a listing's street map in the browser (templates/atlas/atlas-mapdata.js, OpenStreetMap); the first drawn
  // map is kept on the package so every later piece, and the print server, use the same one instead of fetching again
  const mapKey = L => ['address', 'city', 'zip'].map(k => String((L || {})[k] ?? '').toLowerCase().trim()).join('|');
  const savedMap = () => pkg && pkg.map && pkg.map.key === mapKey(pkg.listing) ? pkg.map.data : null;
  function keepMap(w){
    try { if(pkg && w && w.atlasMapData && !savedMap()){ pkg.map = {key: mapKey(pkg.listing), data: w.atlasMapData}; save(); } } catch(e){ console.warn(e); }
  }
  async function dataFor(designId, final){
    const d = designs.find(x => x.id === designId) || {}, fs = await fontSpec(designId);
    const arr = arrangement(pkg, designId), ids = arr.map(i => 'p' + i);
    const P = {};
    arr.forEach(i => { const ph = pkg.photos[i]; P['p' + i] = {src: photoUrlNow(ph.url), tags: [ph.desc || '', ph.note || ''].filter(Boolean).join(', '), role: ph.role, exterior: ph.exterior, house: ph.house, fullHouse: ph.house ? true : undefined}; });
    // a template may name the sample house's photos itself (a default 'front' hero): each such name shows the package's
    // photo it maps to (the same match as the example copy)
    const exP = await example(designId);
    if(exP && exP.photos){ const m = photoMap(exP, ids); for(const [eid, pid] of Object.entries(m)) if(!P[eid] && P[pid]) P[eid] = P[pid]; }
    const S = d.sample || {};
    const fonts = fontsFor(pkg, fs);
    const kit = kitOverride !== undefined ? kitOverride : brandKit();
    const brand = Object.assign({}, SAMPLE_BRAND, S.brokerage ? {brokerage: S.brokerage, logo: S.logo, web: S.web} : {}, kitBrand(kit), {accent: pkg.brand.accent},
      Object.keys(fonts).length ? {fonts} : {});
    const agent = Object.assign({}, SAMPLE_AGENT, profile ? {name: profile.display_name || SAMPLE_AGENT.name, mailerName: profile.mailer_name || null, phone: profile.cell || SAMPLE_AGENT.phone,
      email: profile.preferred_email || SAMPLE_AGENT.email} : {}, S.qrLabel ? {qrLabel: S.qrLabel, web: S.agentWeb || SAMPLE_AGENT.web} : {},
      kit && kit.contact ? Object.fromEntries(Object.entries(kit.contact).filter(([, v]) => v)) : {});
    const written = final && pkg.copy[designId];
    const oh = pkg.openHouse && pkg.openHouse.date ? ProofEditor.forPrint(ProofEditor.toFields(pkg.openHouse), ohFit) : null;
    const kitNow = brandKit() || {};
    if(oh) await ohPhotosReady();
    const food = oh && oh.refreshments ? ProofEditor.foodFor(oh, (kitNow.foodPhotos || []).map(shown), foodLib, '/designs/food/') : null;
    if(food){ const own = (kitNow.foodPhotos || []).find(x => x.id === oh.foodPhoto); if(own && own.path) food.path = own.path; P.food = food; }
    if(oh && oh.boxPhoto && oh.boxPhoto.path) oh.boxPhoto = shown(oh.boxPhoto);   // the renderer reads boxPhoto.path with the service key
    if(kitNow.years) agent.years = kitNow.years;
    if(kitNow.justSold) agent.justSold = kitNow.justSold;
    // rough draft: real room headings and "what you'll get" lines, sized to each slot's real copy (preview-lines.json);
    // the simple floor plan sits in the plan spot. Both are preview only: the templates' checks block them on any export.
    const pre = written ? null : await previewCopy(designId, ids);
    const fp = pkg.floorPlan, plan = !written && fp && fp.active && fp.art ? fp.art.map(a => ({src: a.src, tinted: a.tinted, label: a.label})) : null;
    const out = Object.assign({template: designId, sample: true, brand, agent, listing: pkg.listing, mailVendor: null, photos: P,
      openHouse: final ? oh : null,
      copy: written ? written.copy : pre.copy,
      companion: written ? Object.assign({fineprint: FINE_PRINT}, written.companion) : pre.companion,
      copyPending: false}, written ? {} : {preview: true}, plan ? {planPreview: plan, planNote: plan.some(a => a.tinted === false) ? PLAN_NOTE_ROUGH : PLAN_NOTE} : {},
      pkg.colors ? {colors: pkg.colors} : {},   // the fold-over's background and plan box (owner 11/7/2026)
      savedMap() ? {map: savedMap()} : {},   // Atlas: the street map drawn once for this listing (print uses the same one)
      // the colored plan is saved as masks and labels; each design tints it in its own colors, never a second read
      written && pkg.plan && fp && fp.active ? {plan: pkg.plan} : {},
      // some designs read their copy under their own name (data.ct, data.pr, data.sw: copy-example.json "as")
      (await example(designId) || {}).as ? {[(await example(designId)).as]: written ? written.copy : pre.copy} : {},
      // and some read part of it from their own key (copy.cards -> data.cards: copy-example.json "lift")
      Object.fromEntries(((await example(designId) || {}).lift || []).map(k => [k, ((written ? written.copy : pre.copy) || {})[k] || {}])));
    // this package's line rotation, for growing slots after layout (kept out of the JSON the design reads)
    if(pre && pre.turn) Object.defineProperty(out, 'lineTurn', {value: pre.turn});
    return out;
  }
  // The design's own example copy gives the shape and the length of every slot. Photo sections get the room heading of
  // the photo placed there and a line about that room; other text gets a line about what that part will say.
  async function previewCopy(designId, ids){
    await PT.load();
    const ex = await exampleFor(designId, ids), base = {copy: draftCopy(ids), companion: draftCompanion(ids)};
    if(!ex || !ex.copy) return base;
    const rest = ids.length > 1 ? ids.slice(1) : ids; let n = 0, seed = PT.rotation(), first = true;   // one rotation for every piece (C04 lines)
    const roomOf = id => { const ph = pkg.photos[+String(id).slice(1)]; return (ph && ph.room) || 'room'; };
    const at = (o, path) => path.reduce((v, k) => v == null ? v : v[k], o);
    const KEEP = /^(location|stats|variant|footnote|planDisclosures|flyerPhotos|eyebrow|fineprint|stat\d)$/;
    const FACTY = /\d|flood|never|\bnew\b|updated|replaced|renovat|remodel|roof|foundation|hvac|solar|pool|acre|original|restored/i;
    const TEXT = {kicker: 'kicker', title: 'headline', q: 'headline', heading: 'headline', intro: 'intro', summary: 'summary', notes: 'summary', body: 'feature',
      a: 'feature', detail: 'feature', locationBody: 'location', locationTitle: 'heading:Location', nearbyTitle: 'heading:Nearby'};
    function walk(v, path, group){
      const key = path[path.length - 1], b = at(base, path);
      if(typeof key === 'string' && KEEP.test(key)) return b !== undefined ? b : v;
      if(Array.isArray(v)){
        if(v.every(x => typeof x === 'string') && /photos$/i.test(key)) return b !== undefined ? b : v.filter(x => ids.includes(x));
        return v.map((x, i) => walk(x, path.concat(i), group));
      }
      if(v && typeof v === 'object'){
        if('walls' in v || 'rooms' in v && 'w' in v) return null;   // the sample's drawn plan: never shown for another listing
        // a photo's own fields take its room; any other object is a section that collects the rooms placed in it
        const o = {}, g = {rooms: []};
        if(typeof v.photo === 'string'){ o.photo = first ? ids[0] : rest[n++ % rest.length]; first = false; g.room = roomOf(o.photo); if(group) group.rooms.push(g.room); }
        for(const [k, x] of Object.entries(v)) if(k !== 'photo' || typeof x !== 'string') o[k] = walk(x, path.concat(k), g);
        // a section's kicker names the rooms in it (after its photos are placed)
        if(typeof o.kicker === 'string' && g.rooms.length) o.kicker = [...new Set(g.rooms.map(PT.heading))].slice(0, 2).join(' + ');
        return o;
      }
      if(typeof v !== 'string') return v;
      const len = v.length, room = group && group.room;
      if(room && key === 'caption') return '';   // the heading sits over the copy; a caption would only repeat it
      if(room && /^(title|q|label|name)$/.test(key)) return PT.heading(room);
      if(room && key === 'lead') return '';
      if(room && /^(body|a|detail|notes)$/.test(key)) return PT.line(room, len, seed);
      const t = TEXT[key];
      // a short label stays; a short fact from the example's house (a size, "Never flooded", "New roof") never shows on this one
      if(!t) return b !== undefined ? b : ids.includes(v) ? v : v.length < 24 ? (FACTY.test(v) ? 'To come' : v) : PT.line('feature', len, seed) || 'To come';
      if(t.startsWith('heading:')) return t.slice(8);
      if(t === 'kicker') return v;
      return PT.line(t, len, seed);
    }
    return {copy: walk(ex.copy, ['copy']), companion: Object.assign({fineprint: FINE_PRINT}, walk(ex.companion || {}, ['companion'])), turn: seed};
  }

  // ---------- drawing a part into a sheet ----------
  const SLOT = '<script id="brochure-data" type="application/json">{}</' + 'script>';
  function srcdoc(designId, html, data, panel, keepBg, fold){
    const hide = panel ? `.page:not([data-page="${panel}"]){display:none!important}` : '';
    if(fold) html = html.replace('</head>', '<script src="/designs/shared/foldcolors.js"></' + 'script></head>');   // the agent's two colors (11/7)
    const base = `/designs/${designId}/`;
    return html.replace('<head>', `<head><base href="${base}">`)
      .replace(/(href|src)="(?!https?:|\/|data:|blob:|#)([^"]+\.(?:css|js))"/g, `$1="${base}$2"`)
      .replace(SLOT, SLOT.replace('{}', JSON.stringify(data).replace(/<\//g, '<\\/')))
      .replace('</head>', keepBg ? '</head>' : `<style>html,body{background:transparent!important;margin:0!important;overflow:hidden}.page{margin:0!important;box-shadow:none!important}${hide}</style></head>`);
  }
  function fit(sheet){
    const fr = sheet.querySelector('iframe'), doc = fr && fr.contentDocument;
    const pg = doc && doc.querySelector(sheet.dataset.panel ? `.page[data-page="${sheet.dataset.panel}"]` : '.page');
    if(!pg || !pg.offsetWidth) return;
    const w = pg.offsetWidth, h = pg.offsetHeight, k = sheet.clientWidth / w;
    fr.style.width = w + 'px'; fr.style.height = h + 'px'; fr.style.transform = `scale(${k})`;
    sheet.style.height = (h * k) + 'px'; sheet.dataset.k = k;
  }
  const ro = new ResizeObserver(es => es.forEach(e => fit(e.target)));
  // draws [{piece, panel, label}] into `box`; onReady(frame, sheet, part) runs after each template finishes laying out
  // a street address that doesn't fit on one line drops its suffix (Street, Drive...), as the print renderer does,
  // (templates/_shared/addressfit.js, owner 10/30/2026)
  async function addressFit(fr){
    const w = fr.contentWindow, doc = fr.contentDocument;
    if(!w || !doc) return;
    if(!w.AddressFit) await new Promise(r => { const sc = doc.createElement('script'); sc.src = '/designs/engine/addressfit.js'; sc.onload = sc.onerror = r; doc.head.appendChild(sc); });
    try { if(w.AddressFit) w.AddressFit.run(); } catch(e){ console.warn(e); }
    // then every text box shrinks to fit (8 pt floor) and grows back up to 10 pt, as on the print file (config/copy-rules.json)
    if(!w.ShrinkFit) await new Promise(r => { const sc = doc.createElement('script'); sc.src = '/designs/engine/shrinkfit.js'; sc.onload = sc.onerror = r; doc.head.appendChild(sc); });
    try { if(w.ShrinkFit) w.ShrinkFit.run(TYPE_SIZE); } catch(e){ console.warn(e); }
  }
  const TYPE_SIZE = {floor: 8, fineFloor: 6, growTo: 10, step: 0.25, minLeading: 1.15, growSamples: true};
  async function drawParts(box, designId, parts, data, onReady){
    await photosReady;
    const html = {};
    for(const pt of parts) if(!pt.soon) html[pt.piece.file] = html[pt.piece.file] || await tpl(designId, pt.piece.file);
    const have = [...box.querySelectorAll(':scope > figure')];
    if(have.length !== parts.length){ box.innerHTML = parts.map(pt => `<figure><div class="sheet"></div><figcaption></figcaption></figure>`).join(''); }
    // resolves once every page has laid out: right after a design switch the fill pass used to measure the old design's
    // pages (still in the frames), match nothing and stop
    const ready = [];
    [...box.querySelectorAll(':scope > figure')].forEach((fig, i) => {
      const pt = parts[i], s = fig.querySelector('.sheet');
      let done; ready.push(new Promise(r => { done = r; setTimeout(r, 20000); }));
      fig.querySelector('figcaption').textContent = parts.length > 1 ? pt.label : '';
      if(pt.soon){   // a piece of this design that isn't approved yet
        const old = s.querySelector('iframe'); if(old){ ro.unobserve(s); old.remove(); }
        s.classList.add('soon'); s.style.height = ''; s.innerHTML = '<span>Coming soon</span>'; done(); return; }
      s.classList.remove('soon'); if(!s.querySelector('iframe')) s.innerHTML = '';
      s.dataset.panel = pt.panel || '';
      const d = pt.piece.kind === 'foldover' ? Object.assign({}, data, {mode: 'proof'}) : Object.assign({}, data, {mode: 'email', piece: pt.piece});
      let fr = s.querySelector('iframe');
      if(!fr){ fr = document.createElement('iframe'); fr.setAttribute('scrolling', 'no'); fr.tabIndex = -1; s.appendChild(fr); ro.observe(s); }
      fr.title = pt.label;
      fr.onload = () => { const w = fr.contentWindow;
        Promise.resolve(w.brochureReady).then(() => fr.contentDocument.fonts ? fr.contentDocument.fonts.ready : 0)
          .then(() => addressFit(fr)).then(() => { if(d.preview) PT.fitPreview(fr.contentDocument, data.lineTurn);
            // the fold-over's background and plan box colors, over the design's own (pieces.json); text flips by contrast
            if(pt.piece.kind === 'foldover' && d.colors && w.FoldColors) w.FoldColors.apply(d.colors, pt.piece.colors || {});
            keepMap(w); fit(s); if(onReady) onReady(fr, s, pt); }).finally(done); fit(s); };
      fr.srcdoc = srcdoc(designId, html[pt.piece.file], d, pt.panel, false, pt.piece.kind === 'foldover');
    });
    await Promise.all(ready);
  }

  // ---------- socials, Open House email and Just Sold postcard of the design (owner 11/7/2026) ----------
  // Only what the owner approved for this design (pieces.json "extras", Just Sold sizes in its pieces). Each shows small
  // here; a click opens it full size in a new tab (an image download comes with the server renderer, as in the library).
  const looksOf = id => looksCache[id] || (looksCache[id] = fetch(`/designs/${id}/looks.json`).then(r => r.ok ? r.json() : {}).catch(() => ({})));
  const looksCache = {};
  let PLACES = null;
  async function extraParts(id){
    const S = await spec(id), X = S.extras || {}, lk = await looksOf(id), out = [];
    PLACES = PLACES || await fetch('/designs/engine/social-places.json').then(r => r.json()).catch(() => ({shapes: {post: [1080, 1350]}}));
    const sh = shape => ({shape, px: PLACES.shapes[shape] || [1080, 1350]});
    const socialFile = (lk.social || {}).file || 'social.html';
    for(const [m, name] of [['jl', 'Just Listed'], ['js', 'Just Sold']]) if(X[m] && lk.social)
      for(const shape of Object.keys(PLACES.shapes).filter(x => x !== 'slide'))
        out.push({group: `${name} socials`, label: `${name}, ${shape}`, look: {socialLook: lk.social}, piece: Object.assign({id: `${m}-${shape}`, file: socialFile, moment: m, kind: 'social'}, sh(shape))});
    const oh = partsFor(S, 'open-house-flyer', pkg), ohP = oh && oh[0].piece, ohLook = ohP && (lk.email || {})[ohP.id];
    if(ohP && ohLook){
      const social = Object.assign({}, ohLook, ohLook.socialSig && !ohLook.social ? {social: ohLook.socialSig} : {});
      if(X.ohEmail) out.push({group: 'Open House email', label: 'Open House email', look: {emailLook: ohLook},
        piece: Object.assign({}, ohP, {id: ohP.id + '-email', of: ohP.id, kind: 'email', file: ohP.emailFile || 'email.html'})});
      if(X.ohSocials) for(const shape of Object.keys(PLACES.shapes).filter(x => x !== 'slide'))
        out.push({group: 'Open House socials', label: `Open House, ${shape}`, look: {emailLook: social},
          piece: Object.assign({}, ohP, {id: `${ohP.id}-oh-${shape}`, of: ohP.id, kind: 'oh-social', file: ohP.socialFile || 'email.html'}, sh(shape))});
    }
    for(const z of ['6x11', '6x9']) for(const side of ['front', 'back']){
      const p = S.pieces.find(x => x.id === `just-sold-${z}-${side}`);
      if(p) out.push({group: 'Just Sold postcard', label: `Just Sold ${z.replace('x', ' x ')}, ${side}`, look: {}, piece: p});
    }
    return out;
  }
  async function drawExtras(boxId){
    const box = $('#' + boxId), id = pkg.design;
    const all = await extraParts(id);
    box.hidden = !all.length;
    if(!all.length){ box.innerHTML = ''; return; }
    // on the page: the post of each social set, the email and the 6 x 11 Just Sold card; every size opens from the list
    const shown = all.filter(x => !/socials$/.test(x.group) || x.piece.shape === 'post').filter(x => !/^Just Sold 6 x 9/.test(x.label));
    const groups = [...new Set(all.map(x => x.group))];
    box.innerHTML = `<h3>More for this listing</h3><p class="fine">Your socials, Open House email and Just Sold postcard in this design${pkg.copy[id] ? '' : ' (rough draft text until you finalize)'}.</p>
      <div class="minis xminis"></div>
      <label class="fine">Open full size <select class="xopen"><option value="">Pick one</option>${groups.map(g => `<optgroup label="${esc(g)}">${all.map((x, i) => x.group === g ? `<option value="${i}">${esc(x.label)}</option>` : '').join('')}</optgroup>`).join('')}</select></label>`;
    const base = await dataFor(id, !!pkg.copy[id]);
    // one look per frame: draw each tile on its own
    const minis = box.querySelector('.xminis');
    minis.innerHTML = shown.map(() => '<div class="xone"></div>').join('');
    shown.forEach((x, i) => drawParts(minis.children[i], id, [{piece: x.piece, label: x.label}], Object.assign({}, base, x.look))
      .then(() => { const c = minis.children[i].querySelector('figcaption'); if(c) c.textContent = x.label; }));
    box.querySelector('.xopen').onchange = async e => { const x = all[+e.target.value]; e.target.value = ''; if(x) openExtra(id, x, base); };
  }
  async function openExtra(id, x, base){
    const print = /^just-sold-/.test(x.piece.id);
    const data = Object.assign({}, base, x.look, {mode: print ? 'print' : 'email', piece: x.piece});
    let html = srcdoc(id, await tpl(id, x.piece.file), data, null, true);
    html = html.split('"/designs/').join(`"${location.origin}/designs/`);   // a new tab has no base of its own
    const url = URL.createObjectURL(new Blob([html], {type: 'text/html'}));
    await ask(`<h2>${esc(x.label)}</h2><p><a class="btn" href="${url}" target="_blank" rel="noopener">Open it in a new tab</a></p>
      <p class="fine">${print ? 'Print it from the new tab (pick Save as PDF); the print file at full size comes with the order.' : `${(x.piece.px || [])[0] || 600} px wide. A one-click image download comes with the server renderer.`}</p>`, [['Done', 'done', 'line']]);
  }

  // ---------- 2. gallery ----------
  // designs with at least one piece of this order live; with `soon`, also designs where every piece asked for is coming soon
  async function eligible(soon){
    const out = [];
    for(const d of designs){
      const S = await spec(d.id); S.design = S.design || d.id;
      const live = piecesOf(pkg, d.id), later = soonOf(pkg, d.id).filter(lid => SOON[d.id].includes(lid));
      if(live.length) out.push({d, S, live, later}); else if(soon && later.length) out.push({d, S, live, later});
    }
    return out;
  }
  async function openGallery(){
    show('vGallery');
    const ps = piecesOf(pkg);
    $('#galleryLede').textContent = pkg.order.kind === 'single' ? `Every design's ${pieceLabel(pkg.order.piece).toLowerCase()}, with your photos.`
      : pkg.order.kind === 'essentials' ? 'Each design as its matching set, without the fold-over, with your photos.' : 'Each design as its whole matching set, with your photos.';
    // personalized designs: any already in the account come first; for now the offer
    $('#personal').innerHTML = `<div class="offer"><h3>Want your own design?</h3><p>We'll build a full matching set around your brand and keep it in your account.</p>
      <p><a href="/own-design/?as=agent">See how it works</a></p></div>`;
    const list = await eligible(true);
    $('#sets').innerHTML = list.map(({d, live, later}) => `<div class="dset${live.length ? '' : ' grayed'}" data-design="${d.id}"><div class="row"><h3>${esc(d.name)}${d.test ? '<span class="badge">test</span>' : ''}</h3>
      <button class="btn" type="button" data-use="${d.id}"${live.length ? '' : ' disabled'}>Use this design</button></div><div class="minis${live.length + later.length === 1 ? ' one' : ''}"></div>
      ${later.length ? `<p class="fine soonline">Coming soon in this design: ${later.map(pieceLabel).join(', ')}</p>` : ''}</div>`).join('')
      || '<p class="empty">No design has this piece yet.</p>';
    for(const {d, S, live, later} of list){
      const ids = wanted(pkg, d.id).filter(lid => live.includes(lid) || later.includes(lid));
      const parts = ids.map(lid => live.includes(lid) ? partsFor(S, lid, pkg)[0] : {piece: {file: null}, soon: true});
      const box = $(`.dset[data-design="${d.id}"] .minis`);
      drawParts(box, d.id, parts.map((pt, i) => Object.assign({}, pt, {label: pieceLabel(ids[i])})), await dataFor(d.id, false));
      box.querySelectorAll('figcaption').forEach((c, i) => c.textContent = pieceLabel(ids[i]));
    }
    // plan-only designs (Room Proportions) are made for homes with a floor plan
    const hasPlan = !!(pkg.floorPlan && pkg.floorPlan.active);
    for(const {d} of list) if(d.planOnly && !hasPlan){
      const el = $(`.dset[data-design="${d.id}"]`); el.classList.add('grayed'); el.querySelector('[data-use]').disabled = true;
      el.querySelector('.row').insertAdjacentHTML('beforeend', `<button type="button" class="link" data-why="${d.id}">Why is this grayed out?</button>`); }
    $$('[data-why]').forEach(b => b.onclick = () => ask('<h2>Made for a floor plan</h2><p>This design is built around the floor plan. Add your floor plan on the listing step to use it.</p>', [['OK', 'ok', 'line']]));
    $$('[data-use]').forEach(b => b.onclick = () => { pkg.design = b.dataset.use; save(); openRough(); });
    // the Just Listed / Just Sold library: pieces picked one by one (test)
    const lib = designs.find(d => d.library);
    $('#libEntry').hidden = !lib;
    if(lib) $('#libEntry').innerHTML = `<div class="offer"><h3>Just Listed and Just Sold library <span class="badge">test</span></h3>
      <p>Every approved Just Listed and Just Sold social design. Pick any of them on their own, made from your listing.</p><p><button class="btn" type="button" id="toLib">Open the library</button></p></div>`;
    if(lib) $('#toLib').onclick = () => openLib();
    // the open house library shows only when an Open House flyer is in the order
    const oh = ps.includes('open-house-flyer');
    $('#ohLibrary').hidden = !oh;
    if(oh){
      const items = [];
      for(const {d, S} of list) S.pieces.filter(p => p.candidate && p.variant === 'openhouse').forEach(p => items.push({d, p}));
      $('#ohList').innerHTML = items.map(({d, p}, i) => `<div class="dset"><div class="minis one" data-oh="${i}"></div><div class="row"><small>${esc(p.title || p.label)} <span class="badge">test</span></small>
        <button class="link" type="button" data-pickoh="${i}">${pkg.ohFlyer && pkg.ohFlyer.piece === p.id ? 'Picked' : 'Use this one'}</button></div></div>`).join('')
        + '<p class="fine">More flyers from our Open House library: pick one on your proof (Open House flyer, "Pick from the Open House library").</p>';
      for(const [i, {d, p}] of items.entries()) drawParts($(`[data-oh="${i}"]`), d.id, [{piece: p, label: p.title}], await dataFor(d.id, false));
      $$('[data-pickoh]').forEach(b => b.onclick = () => { const it = items[b.dataset.pickoh]; pkg.ohFlyer = {design: it.d.id, piece: it.p.id}; pkg.design = it.d.id; save(); openRough('open-house-flyer'); });
    }
  }

  // ---------- 2b. Just Listed / Just Sold library (test, 10/22/2026) ----------
  // Designs from templates/announce, picked one by one. The Just Listed copy is written once for all of them (one writer
  // call); Just Sold wording is the agent's picks plus the playbook (no AI). Photos are read once (Haiku) for each one's
  // room and the box around the whole house, so every crop keeps the whole house.
  const LIB = 'announce', PLAY = (window.ANN && ANN.PLAYBOOK) || {ctas: []};
  // the postcard tabs are off: this library's postcards are older builds that were never approved (the approved ones are the
  // Just Listed and Just Sold libraries on /preview/just-listed/ and /preview/just-sold/); only the approved socials show
  const LIB_TABS = [{id: 'jl-social', label: 'Just Listed social', card: 'listed', social: true}, {id: 'js-social', label: 'Just Sold social', card: 'sold', social: true}];
  // the sample listing's two exterior photos, measured by hand (same boxes as samples/announce/data.json)
  const SAMPLE_HOUSES = {'front.jpg': {kind: 'front', room: 'Front', house: {left: .14, top: .05, right: .88, bottom: .74}},
    'family.jpg': {kind: 'side', room: 'Front', house: {left: .2, top: .19, right: .83, bottom: .67}}};
  const ISSUE = {'off-page': 'Text runs off the page', 'overflow': 'Text doesn\'t fit its space', 'text-runs-into-band': 'Text runs into a color band',
    'house-cut-off': 'The house is cut off', 'house-covered': 'Something covers the house', 'empty-photo-slot': 'A photo spot is empty', 'photo-missing': 'A photo didn\'t load',
    'photo-repeated': 'The same photo is used twice', 'no-front-of-house': 'The front of the house isn\'t on this postcard', 'logo-missing': 'The logo is missing',
    'logo-version-missing': 'This spot needs a white version of your logo', 'trec-logo-too-small': 'The logo is too small next to your name (TREC)', 'logo-under-0.35in': 'The logo is under 0.35 in',
    'outside-safe-zone': 'Something is too close to the trim', 'type-too-small': 'Some type is under 8 pt', 'fine-print-below-6pt': 'Fine print is under 6 pt',
    'low-contrast': 'Some text is hard to read on its color', 'story-safe-zone': 'Text sits under the Instagram/Facebook bars', 'outside-grid-crop': 'Address or name falls outside the grid crop',
    'banned-phrase': 'A phrase we don\'t allow', 'missing-copy': 'Some copy is missing'};
  const libState = p => p.lib || (p.lib = {houses: null, housesNote: '', copy: null, cost: 0, tab: 'jl-social', picks: [],
    sold: {headline: 'Just Sold', side: '', days: '', offers: '', offersOk: false, cta: 3, own: ''}, ordered: null});
  function libSold(s){
    const t = (s.own || '').trim() || PLAY.ctas[s.cta] || PLAY.ctas[0] || '', q = t.indexOf('?');
    const cta = q > 0 && q < t.length - 1 ? {ctaHead: t.slice(0, q + 1), ctaShort: t.slice(q + 1).trim()} : {ctaHead: t};
    return Object.assign({headline: s.headline, side: s.side || null, days: s.days ? +s.days : null,
      offers: s.offers ? (/^\d+$/.test(s.offers.trim()) ? s.offers.trim() : 'multiple') : null, offersOk: !!s.offersOk}, cta);
  }
  function libData(){
    const s = libState(pkg), P = {}, order = [];
    pkg.photos.forEach((ph, i) => {
      const h = (s.houses || {})['p' + i] || {};
      if(['plan', 'aerial', 'other'].includes(h.kind)) return;   // floor plans, maps and aerials never go in a photo spot
      const kind = {front: 'front exterior', side: 'side angle exterior', rear: 'rear exterior', yard: 'backyard'}[h.kind] || '';
      P['p' + i] = {src: photoUrlNow(ph.url), tags: [kind, h.room, ph.desc].filter(Boolean).join(', '), room: h.room || '', role: h.role || undefined, house: h.house || undefined};
      order.push('p' + i);
    });
    order.sort((a, b) => (P[b].house ? 1 : 0) - (P[a].house ? 1 : 0));   // whole-house exteriors first
    const agent = Object.assign({}, SAMPLE_AGENT, {nar: true}, profile ? {name: profile.display_name || SAMPLE_AGENT.name, phone: profile.cell || SAMPLE_AGENT.phone,
      email: profile.preferred_email || SAMPLE_AGENT.email} : {}, {headshot: null});
    const logos = Object.fromEntries(['black', 'gold', 'white', 'forest', 'color', 'gold-on-dark'].map(k => [k, `/designs/samples/larkspur/AnyBrokerage_${k}.png`]));
    // the agent's brand kit when saved (a brokerage switch rebrands these sets the same way); else the sample brand
    const kit = kitOverride !== undefined ? kitOverride : brandKit();
    const brand = kit && kit.logo ? {brokerage: kit.brokerage, address: kit.officeAddress || '', logo: kit.logo, logoKnockout: kit.logoOnDark || null, logos: {}}
      : {brokerage: 'Any Brokerage', address: '1200 Heights Blvd, Houston, TX 77008', sample: true, logo: logos.black, logoKnockout: logos.white, logos};
    return {template: LIB, sample: true, fontBase: '/fonts/pool/', agent, listing: pkg.listing, photos: P, photoOrder: order, mailVendor: null,
      brand,
      companion: {justListed: s.copy || {}, justSold: libSold(s.sold)}};
  }
  async function photoB64(url){
    const blob = await fetch(url).then(r => r.blob()), bmp = await createImageBitmap(blob);
    const k = Math.min(1, 512 / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', .8).split(',')[1];
  }
  async function readHouses(){
    const s = libState(pkg);
    if(pkg.photos.every(ph => ph.url.startsWith('/designs/samples/'))){   // the sample listing: known boxes, no AI call
      s.houses = Object.fromEntries(pkg.photos.map((ph, i) => [ 'p' + i, SAMPLE_HOUSES[ph.url.split('/').pop()] || {kind: 'interior', room: '', house: null}]));
      return;
    }
    // package-ai "tag-photos" (the one photo step): role, exterior, whole-house box. Kept here as kind / room / house.
    const KIND = {front:'front', side:'side', back:'rear', patio:'yard', pool:'yard', yard:'yard', aerial:'aerial', floorplan:'plan', street:'other', view:'other', amenity:'other', other:'other'};
    const ROOM = {front:'Front', side:'Side view', back:'Back of the house', aerial:'Aerial', living:'Living room', family:'Family room', kitchen:'Kitchen',
      dining:'Dining', nook:'Breakfast nook', primary:'Primary bedroom', bedroom:'Bedroom', bath:'Bathroom', office:'Study', entry:'Entry', stairs:'Stairs',
      laundry:'Laundry', garage:'Garage', patio:'Patio', pool:'Pool', yard:'Yard', view:'View', amenity:'Community', floorplan:'Floor plan', street:'Street', other:''};
    const fromTag = t => ({kind: KIND[t.role] || 'interior', room: ROOM[t.role] || '', role: t.role, house: t.house && ['front', 'side', 'back'].includes(t.role) ? t.house : null});
    // photos read right after the lookup, and captioned interiors, need no second read
    const known = {}, photos = [];
    for(const [i, ph] of pkg.photos.entries()){
      const t = (pkg.tags || {})[ph.url];
      if(t) known['p' + i] = fromTag(t);
      else if(ph.room && !/exterior|aerial/.test(ph.room)) known['p' + i] = {kind: 'interior', room: PT.heading(ph.room), house: null};
      else photos.push({id: 'p' + i, desc: ph.desc || '', data: await photoB64(photoUrlNow(ph.url))});
    }
    if(!photos.length){ s.houses = known; return; }
    try { const j = await ai({action: 'tag-photos', packageId: pkg.id, photos});
      s.houses = Object.assign(known, Object.fromEntries((j.photos || []).map(t => [t.id, fromTag(t)])));
      s.cost += j.cost || 0; s.housesNote = ''; }
    catch(e){ s.houses = {}; s.housesNote = "We couldn't read the photos this time, so crops can't check for the whole house yet."; }
  }
  async function writeLib(){
    const s = libState(pkg), ex = await example(LIB), exJL = Object.assign({}, ex.companion.justListed);
    delete exJL.photoRoles;
    exJL.captions = Object.entries(exJL.captions || {}).map(([photo, text]) => ({photo, text}));
    const ids = Object.keys(libData().photos);
    const draft = Object.fromEntries(Object.keys(exJL).map(k => [k, Array.isArray(exJL[k]) ? [] : typeof exJL[k] === 'string' ? '' : exJL[k]]));
    draft.captions = ids.map(photo => ({photo, text: ''}));
    // the place line prints city and state only; the writer may still use the neighborhood in the copy (optional, owner 10/26/2026)
    const details = Object.fromEntries(Object.entries(pkg.listing.details || {}).map(([sec, f]) =>
      [sec, Object.fromEntries(Object.entries(f).filter(([k]) => !/legal/i.test(k)))]));
    const listing = Object.assign({}, pkg.listing, {details});
    const j = await ai({action: 'write', packageId: pkg.id, design: 'Just Listed postcards and social posts', style: pkg.copyStyle, listing,
      photos: Object.fromEntries(ids.map(id => [id, libData().photos[id].tags])), example: {copy: {}, companion: {justListed: exJL}},
      draft: {copy: {}, companion: {justListed: draft}}, pieces: ['Just Listed postcard (front and back)', 'Just Listed social posts and stories']});
    const jl = j.companion.justListed;
    jl.captions = Object.fromEntries((jl.captions || []).filter(c => ids.includes(c.photo)).map(c => [c.photo, c.text]));
    s.copy = jl; s.cost += j.cost || 0;
  }
  async function openLib(){
    if(!pkg) return openStart();
    const s = libState(pkg);
    pkg.lib = s; save();
    show('vLib');
    $('#libLede').textContent = `${pkg.listing.address}. Pick any postcard or social design; each is made from your listing.`;
    $('#libWrite').hidden = !!s.copy; $('#libBody').hidden = !s.copy; $('#libProof').hidden = true;
    $('#libStatus').textContent = s.housesNote || '';
    if(s.copy) libGrid();
  }
  $('#libGo').onclick = async () => {
    const s = libState(pkg), b = $('#libGo');
    b.disabled = true;
    try {
      $('#libStatus').textContent = 'Reading your photos…';
      if(!s.houses) await readHouses();
      save();
      $('#libStatus').textContent = 'Writing your Just Listed copy and checking every line…';
      await writeLib();
      store.event(pkg.id, 'library-write', {cost: s.cost});
      save(true); openLib();
    } catch(e) {
      $('#libStatus').textContent = e.message === 'daily-cap' ? "We've hit today's writing limit for test drives. Try again tomorrow." : "We couldn't finish writing just now. Try again.";
    } finally { b.disabled = false; }
  };
  function soldForm(){
    const s = libState(pkg).sold;
    $('#lsCta').innerHTML = PLAY.ctas.map((t, i) => `<option value="${i}">${esc(t)}</option>`).join('');
    $('#lsHead').value = s.headline; $('#lsSide').value = s.side; $('#lsDays').value = s.days; $('#lsOffers').value = s.offers;
    $('#lsOk').checked = s.offersOk; $('#lsCta').value = String(s.cta); $('#lsOwn').value = s.own;
    const upd = () => { Object.assign(s, {headline: $('#lsHead').value, side: $('#lsSide').value, days: $('#lsDays').value.replace(/\D/g, ''),
      offers: $('#lsOffers').value.trim(), offersOk: $('#lsOk').checked, cta: +$('#lsCta').value, own: $('#lsOwn').value}); save();
      if(libState(pkg).tab.startsWith('js')) libGrid(); };
    ['#lsHead', '#lsSide', '#lsCta', '#lsOk'].forEach(q => $(q).onchange = upd);
    ['#lsDays', '#lsOffers', '#lsOwn'].forEach(q => $(q).onchange = upd);
  }
  async function libGrid(){
    const s = libState(pkg), S = await spec(LIB);
    if(!LIB_TABS.some(t => t.id === s.tab)) s.tab = LIB_TABS[0].id;
    const tab = LIB_TABS.find(t => t.id === s.tab);
    soldForm();
    $('#libTabs').innerHTML = LIB_TABS.map(t => `<button type="button" role="tab" aria-selected="${t.id === s.tab}" data-tab="${t.id}">${t.label}</button>`).join('');
    $$('[data-tab]').forEach(b => b.onclick = () => { s.tab = b.dataset.tab; save(); libGrid(); });
    $('#libSizeRow').hidden = tab.social;
    const size = pkg.order.size || '6x9';
    $$('input[name=libSize]').forEach(r => { r.checked = r.value === size; r.onchange = () => { pkg.order.size = r.value; save(); libGrid(); }; });
    const pieces = S.pieces.filter(p => p.card === tab.card && !p.auto && (tab.social ? p.kind === 'social' : p.size === size && p.side === 'front'));
    $('#libList').innerHTML = pieces.map(p => `<div class="dset${s.picks.includes(p.design) ? ' picked' : ''}" data-d="${p.design}"><div class="minis one"></div>
      <div class="row"><small>${esc(p.design.replace(/^J[LS]-/, ''))} · ${esc(p.title)}${p.category ? ' · ' + esc(p.category) : ''}</small>
      <button class="link" type="button" data-pick="${p.design}">${s.picks.includes(p.design) ? 'Remove' : 'Add'}</button></div></div>`).join('');
    const data = libData();
    for(const p of pieces) drawParts($(`.dset[data-d="${p.design}"] .minis`), LIB, [{piece: p, label: p.title}], data);
    $$('[data-pick]').forEach(b => b.onclick = () => { const d = b.dataset.pick; s.picks = s.picks.includes(d) ? s.picks.filter(x => x !== d) : s.picks.concat(d); save(); libGrid(); });
    $('#libCount').textContent = s.picks.length ? `${s.picks.length} picked: ${s.picks.join(', ')}` : 'Nothing picked yet.';
    $('#libReview').disabled = !s.picks.length;
  }
  const libParts = (S, d) => {
    const ps = S.pieces.filter(p => p.design === d), size = pkg.order.size || '6x9';
    const social = ps.find(p => p.kind === 'social');
    if(social) return [{piece: social, label: social.label}];
    return ['front', 'back'].map(side => ps.find(p => p.size === size && p.side === side)).map(p => ({piece: p, label: p.side === 'front' ? 'Front' : 'Back'}));
  };
  $('#libReview').onclick = async () => {
    const s = libState(pkg), S = await spec(LIB);
    $('#libBody').hidden = true; $('#libProof').hidden = false;
    $('#libProofs').innerHTML = s.picks.map(d => `<div class="libpk" data-pk="${d}"><h3>${esc(d)} · ${esc((S.pieces.find(p => p.design === d) || {}).title || '')}</h3>
      <div class="${libParts(S, d).length > 1 ? 'two' : 'one'}"></div><ul class="issues"></ul></div>`).join('');
    const data = libData();
    for(const d of s.picks){
      const box = $(`[data-pk="${d}"] > div`), found = [];
      let left = libParts(S, d).length;
      drawParts(box, LIB, libParts(S, d), data, fr => {
        try { found.push(...(fr.contentWindow.brochureCheck() || [])); } catch(e) {}
        if(--left) return;
        const kinds = [...new Set(found.map(c => c.kind))];
        $(`[data-pk="${d}"] .issues`).innerHTML = kinds.length ? kinds.map(k => `<li>${esc(ISSUE[k] || k)}</li>`).join('') : '<li class="ok">Passes every print check.</li>';
      });
    }
    $('#libOrderNote').textContent = s.ordered ? `Ordered ${dayFmt(s.ordered.at)} (test).` : '';
    libOrderButtons();
  };
  $('#libBack').onclick = () => { $('#libProof').hidden = true; $('#libBody').hidden = false; libGrid(); };
  function libOrderButtons(){
    const s = libState(pkg);
    $('#libOrder').textContent = s.ordered ? 'Download the files' : 'Approve and order (test)';
  }
  $('#libOrder').onclick = async () => {
    const s = libState(pkg);
    if(!s.ordered){
      const v = await ask(`<h2>Order these ${s.picks.length} pieces</h2><p>${esc(s.picks.join(', '))} for ${esc(pkg.listing.address)}.</p>
        <p class="fine"><b>Test checkout:</b> no card is charged. On the live site this step is Stripe, and the postcards go to your mail vendor's cart.</p>`,
        [['Approve and order (test)', 'pay'], ['Cancel', 'cancel', 'line']]);
      if(v !== 'pay') return;
      s.ordered = {at: new Date().toISOString(), picks: s.picks.slice(), size: pkg.order.size, test: true};
      store.event(pkg.id, 'library-order', {picks: s.picks, size: pkg.order.size, cost: s.cost, test: true});
      save(true); libOrderButtons();
      $('#libOrderNote').textContent = `Ordered ${dayFmt(s.ordered.at)} (test).`;
    }
    const S = await spec(LIB), btns = [];
    for(const d of s.ordered.picks) for(const pt of libParts(S, d)) btns.push([`${d} ${pt.piece.kind === 'social' ? '(full size)' : pt.label.toLowerCase() + ' (print PDF)'}`, pt.piece.id, 'line']);
    const id = await ask('<h2>Your files</h2><p>Postcards open the print box at the exact size with bleed (pick Save as PDF). Social pieces open full size in a new tab.</p>', btns.concat([['Done', 'done']]), true);
    if(!id || id === 'done') return;
    const piece = S.pieces.find(p => p.id === id);
    libFile(piece);
  };
  async function libFile(piece){
    const social = piece.kind === 'social';
    const data = Object.assign(libData(), {mode: social ? 'email' : 'print', piece});
    // print gets each listing photo's full-size original, never the screen copy
    if(!social) for(const [id, ph] of Object.entries(data.photos || {})){ const full = printSrc((pkg.photos[+id.slice(1)] || {}).url); if(full) ph.src = full; }
    const html = srcdoc(LIB, await tpl(LIB, piece.file), data, null, true);
    if(social){   // a real link the agent clicks (a tab opened after loading counts as a pop-up and gets blocked)
      const url = URL.createObjectURL(new Blob([html], {type: 'text/html'}));
      await ask(`<h2>${esc(piece.design)} full size</h2><p><a class="btn" href="${url}" target="_blank" rel="noopener">Open it in a new tab</a></p>
        <p class="fine">${piece.px[0]} x ${piece.px[1]} px. A one-click image download comes with the server renderer.</p>`, [['Done', 'done', 'line']]);
      return;
    }
    document.querySelectorAll('iframe.bd-print').forEach(f => f.remove());
    const fr = document.createElement('iframe');
    fr.className = 'bd-print'; fr.setAttribute('aria-hidden', 'true');
    fr.style.cssText = 'position:fixed;left:-10000px;top:0;width:1200px;height:900px;border:0';
    fr.onload = () => Promise.resolve(fr.contentWindow.brochureReady).then(() => setTimeout(() => fr.contentWindow.print(), 300));
    document.body.appendChild(fr);
    fr.srcdoc = html;
  }

  // ---------- 3. rough-draft proof ----------
  let roughPiece = null, selPhoto = null, dragPhoto = null, dragSlot = null;
  async function openRough(start){
    if(!pkg.design){ const l = await eligible(); pkg.design = l[0] ? l[0].d.id : 'ivory'; }
    pkg.stage = pkg.stage === 'writing' ? 'rough' : pkg.stage;
    show('vRough');
    const ps = piecesOf(pkg);
    roughPiece = start || (ps.includes(roughPiece) ? roughPiece : ps[0]);   // full package opens on the fold-over
    $('#roughPiece').innerHTML = ps.map(id => `<option value="${id}"${id === roughPiece ? ' selected' : ''}>${pieceLabel(id)}</option>`).join('')
      + soonOf(pkg).filter(id => (SOON[pkg.design] || []).includes(id)).map(id => `<option disabled>${pieceLabel(id)} (Coming soon)</option>`).join('');
    $('#roughTitle').textContent = `Rough draft: ${pkg.listing.address}`;
    $('#copyStyle').value = pkg.copyStyle; $('#styleSample').textContent = `Sounds like: "${STYLE_SAMPLE[pkg.copyStyle]}"`;
    swatches(); await designTabs(); drawStrip(); await fontBox(); planControls(); await drawRough(); drawExtras('extrasRough');
  }
  $('#roughPiece').onchange = e => { roughPiece = e.target.value; drawRough(); };
  async function designTabs(){
    const l = await eligible();
    $('#designFlip').innerHTML = l.map(({d}) => `<button type="button" role="tab" aria-selected="${d.id === pkg.design}" data-flip="${d.id}">${esc(d.name)}${d.test ? ' (test)' : ''}</button>`).join('');
    $$('[data-flip]').forEach(b => b.onclick = async () => { pkg.design = b.dataset.flip; save(); await designTabs(); drawStrip(); await fontBox(); drawRough(); drawExtras('extrasRough'); });
  }
  function swatches(){
    const box = $('#swatches');
    box.innerHTML = COLORS.map(c => `<button type="button" style="background:${c}" aria-label="Color ${c}" aria-pressed="${c.toLowerCase() === pkg.brand.accent.toLowerCase()}" data-color="${c}"></button>`).join('')
      + `<input type="color" value="${pkg.brand.accent}" aria-label="Pick any color" id="colorAny">`;
    $$('[data-color]').forEach(b => b.onclick = () => setColor(b.dataset.color));
    $('#colorAny').oninput = e => setColor(e.target.value);
  }
  let colorTimer = null;
  function setColor(c){ pkg.brand.accent = c; save(); $$('[data-color]').forEach(b => b.setAttribute('aria-pressed', b.dataset.color.toLowerCase() === c.toLowerCase()));
    clearTimeout(colorTimer); colorTimer = setTimeout(drawRough, 120); }
  async function fontBox(){
    const fs = await fontSpec(pkg.design);
    $('#fontsCtl').hidden = !fs || !window.FontPicker;
    if($('#fontsCtl').hidden) return;
    catalog = catalog || await fetch('/fonts/pool/catalog.json').then(r => r.json());
    FontPicker.mount($('#fonts'), {spec: fs, catalog, fontBase: '/fonts/pool/', value: fontsFor(pkg, fs), onChange: v => {
      pkg.brand.fonts = Object.assign({}, pkg.brand.fonts, v); save(); drawRough(); }});
  }
  $('#copyStyle').onchange = e => { pkg.copyStyle = e.target.value; $('#styleSample').textContent = `Sounds like: "${STYLE_SAMPLE[pkg.copyStyle]}"`; save(); };
  function drawStrip(){
    const arr = arrangement(pkg, pkg.design);
    $('#thumbs').innerHTML = pkg.photos.map((ph, i) => `<img src="${esc(photoUrlNow(ph.url))}" alt="${esc(ph.desc || 'Photo ' + (i + 1))}" title="${esc(ph.desc || '')}" draggable="true" data-ph="${i}" class="${arr.includes(i) ? '' : 'unused'}${selPhoto === i ? ' sel' : ''}">`).join('');
    $$('#thumbs img').forEach(img => {
      img.ondragstart = e => { dragPhoto = +img.dataset.ph; dragSlot = null; e.dataTransfer.setData('text/plain', 'bd-photo'); e.dataTransfer.effectAllowed = 'move'; };
      img.onclick = () => { selPhoto = selPhoto === +img.dataset.ph ? null : +img.dataset.ph; drawStrip(); };
    });
    photosReady.then(() => $$('#thumbs img').forEach(img => { if(!img.getAttribute('src')) img.src = photoUrlNow(pkg.photos[img.dataset.ph].url); }));
  }
  const strip = $('#strip');
  ['dragenter', 'dragover'].forEach(t => strip.addEventListener(t, e => { if(dragSlot != null){ e.preventDefault(); strip.classList.add('over'); } }));
  strip.addEventListener('dragleave', () => strip.classList.remove('over'));
  strip.addEventListener('drop', e => { e.preventDefault(); strip.classList.remove('over'); if(dragSlot != null) removePhoto(dragSlot); dragSlot = null; });
  function placePhoto(x, slot){
    const arr = arrangement(pkg, pkg.design), y = arr.indexOf(slot), at = arr.indexOf(x);
    if(y < 0 || x === slot) return;
    if(at >= 0){ arr[at] = slot; arr[y] = x; } else arr[y] = x;
    selPhoto = null; save(); drawStrip(); drawRough();
  }
  function removePhoto(i){
    const arr = arrangement(pkg, pkg.design);
    if(arr.length <= 1) return;
    arr.splice(arr.indexOf(i), 1); save(); drawStrip(); drawRough();
  }
  // ---------- add a floor plan from the proof (rough draft and final proof) ----------
  // The same placing as the lookup step (PT.cleanPlan for the preview, PT.givenPlan on the written proof): no AI, no cost.
  // Adding a plan picks the design's floor plan version; removing it goes back to the version without one.
  function planControls(){
    const F = pkg.floorPlan || {}, paid = !!pkg.paid && !fixesOpen(pkg);
    const state = F.active && F.art ? 'in' : F.removed && F.art ? 'out' : 'none';
    [['#planUpRough', 'rough'], ['#planUpFinal', 'final']].forEach(([sel, where]) => {
      const el = $(sel); if(!el) return;
      el.closest('.ctl').hidden = paid;
      ProofEditor.planUpload(el, {state, failed: F.failed,
        onFiles: files => addPlan(files, where),
        onRemove: () => setPlan(false, where), onRestore: () => setPlan(true, where)});
    });
  }
  async function addPlan(files, where){
    const F = pkg.floorPlan = pkg.floorPlan || {};
    $$('#planUpRough, #planUpFinal').forEach(el => { el.innerHTML = '<p class="fine">Placing your floor plan…</p>'; });
    try {
      let art = await PT.cleanPlan(files, files.map(f => /\b(1st|first|ground|main)\b/i.test(f.name) ? 'First floor' : /\b(2nd|second|upper)\b/i.test(f.name) ? 'Second floor' : ''));
      const st = +pkg.listing.stories || 0;
      if(st && art.length > st) art = art.slice(0, st);
      if(!art.length) throw new Error('plan');
      Object.assign(F, {source: 'upload', files: files.map(f => ({blob: f, label: f.name, kind: /pdf/.test(f.type) ? 'pdf' : 'image', from: 'upload'})), art, active: true, removed: false, failed: false});
      pkg.planKey = null;
      if(where === 'final') await redrawPlan();
      store.event(pkg.id, 'floor-plan-upload', {where, files: files.length, floors: art.length});
    } catch(e) { F.failed = true; store.event(pkg.id, 'floor-plan-upload', {where, failed: true}); }
    save();
    if(where === 'final') await drawFinal(); else await drawRough();
    planControls();
  }
  async function setPlan(on, where){
    const F = pkg.floorPlan; if(!F) return;
    F.active = on; F.removed = !on;
    store.event(pkg.id, on ? 'floor-plan-back' : 'floor-plan-removed', {where});
    if(on && where === 'final') await redrawPlan();
    save();
    if(where === 'final') await drawFinal(); else await drawRough();
    planControls();
  }

  async function drawRough(){
    const S = await spec(pkg.design); S.design = pkg.design;
    const parts = partsFor(S, roughPiece, pkg);
    const box = $('#roughProof');
    box.className = 'proof ' + (roughPiece === 'foldover' ? 'fold' : parts.length > 1 ? 'two' : 'single');
    await drawParts(box, pkg.design, parts, await dataFor(pkg.design, false), wirePhotos);
  }
  // photo slots on the proof: drop targets, draggable off the proof, click-to-place
  function wirePhotos(fr){
    const doc = fr.contentDocument;
    const st = doc.createElement('style');
    st.textContent = '[data-photo]{cursor:pointer}[data-photo].bd-over{outline:4px solid #1F4D3F;outline-offset:-4px}';
    doc.head.appendChild(st);
    doc.querySelectorAll('[data-photo]').forEach(el => {
      const id = el.dataset.photo; if(!/^p\d+$/.test(id)) return;
      const slot = +id.slice(1);
      el.draggable = true;
      el.addEventListener('dragstart', e => { dragSlot = slot; dragPhoto = null; e.dataTransfer.setData('text/plain', 'bd-slot'); e.dataTransfer.effectAllowed = 'move'; });
      el.addEventListener('dragend', () => { setTimeout(() => { dragSlot = null; }, 0); });
      el.addEventListener('dragover', e => { if(dragPhoto != null || dragSlot != null){ e.preventDefault(); el.classList.add('bd-over'); } });
      el.addEventListener('dragleave', () => el.classList.remove('bd-over'));
      el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('bd-over');
        if(dragPhoto != null) placePhoto(dragPhoto, slot); else if(dragSlot != null && dragSlot !== slot) placePhoto(dragSlot, slot);
        dragPhoto = null; dragSlot = null; });
      el.addEventListener('click', () => {
        if(selPhoto != null) return placePhoto(selPhoto, slot);
        ask(`<h2>This photo</h2><p>${esc(pkg.photos[slot].desc || 'Listing photo')}</p><p class="fine">To swap it, click a photo in the strip, then click this spot.</p>`,
          [['Take it out of the design', 'out'], ['Keep it', 'keep', 'line']]).then(v => { if(v === 'out') removePhoto(slot); });
      });
    });
  }

  // ---------- Finalize: the AI work starts here ----------
  $('#finalize').onclick = finalize;
  $('#writeRetry').onclick = finalize;
  $('#backToRough').onclick = () => openRough(finalPiece);
  async function finalize(){
    show('vWriting');
    $('#writeErr').textContent = ''; $('#writeRetry').hidden = true;
    pkg.stage = 'writing'; save();
    store.event(pkg.id, 'finalize', {design: pkg.design, kind: pkg.order.kind});
    const lines = ['Reading your listing facts and photos…', 'Writing the brochure…', 'Writing the flyers and postcard…',
      'Checking every line: Fair Housing, no price, plain English…', 'Laying it all out…'];
    let i = 0; const tick = () => { $('#writeStatus').textContent = lines[Math.min(i, lines.length - 1)]; $('#writeFill').style.width = Math.min(92, 10 + i * 18) + '%'; i++; };
    tick(); const timer = setInterval(tick, 9000);
    const planDone = redrawPlan();   // runs while the copy is written
    try {
      const arr = arrangement(pkg, pkg.design);
      const ex = await exampleFor(pkg.design, arr.map(i => 'p' + i));
      const d = await dataFor(pkg.design, false);
      const body = {action: 'write', packageId: pkg.id, design: pkg.design, style: pkg.copyStyle, listing: pkg.listing,
        photos: Object.fromEntries(arr.map(i => ['p' + i, pkg.photos[i].desc || ''])),
        allPhotos: Object.fromEntries(pkg.photos.map((p, i) => ['p' + i, [p.room, p.desc].filter(Boolean).join(': ')])),
        photoUrls: Object.fromEntries(pkg.photos.map((p, i) => ['p' + i, p.url]).filter(([, u]) => /^https:\/\//.test(u || ''))),   // the writers see every photo
        example: ex, draft: {copy: d.copy, companion: d.companion}, pieces: piecesOf(pkg).map(pieceLabel), splitMaster: true};
      await notesJobs[pkg.id];   // started when the package was made; normally back long before Finalize
      if(pkg.photoNotes) body.photoNotes = pkg.photoNotes; else body.gallery = galleryOf(pkg);
      const j = await ai(body);
      pkg.copy[pkg.design] = {copy: j.copy, companion: j.companion, writtenAt: new Date().toISOString(), cost: j.cost};
      if(j.photoNotes && Object.keys(j.photoNotes).length && !pkg.photoNotes) pkg.photoNotes = j.photoNotes;
      // the proof opens as soon as its copy is written (owner-approved 11/1 speed-up: about a minute sooner); the master
      // copy set (any other design fits from it, no rewrite) keeps writing in the background, its own request since both
      // in one ran past the server's time limit. A design switch waits for it (switchDesign).
      masterFor(pkg);
      await planDone;
      pkg.stage = 'final'; save(true);
      clearInterval(timer); $('#writeFill').style.width = '100%';
      await openFinal(piecesOf(pkg)[0]);
      await fillPass();
      await aiCheckPass();
    } catch(e) {
      clearInterval(timer);
      pkg.stage = 'rough'; save();
      $('#writeErr').textContent = e.message === 'daily-cap' ? "We've hit today's writing limit for test drives. Try again tomorrow." : "We couldn't finish writing just now. Your design is saved; try again.";
      $('#writeRetry').hidden = false;
    }
  }
  // The floor plan at Finalize (product.md "Floor plans"): placed exactly as the agent gave it, no AI (the owner 10/28 late,
  // 10/29: take the paid plan read out). Each plan page is one floor, cut to its drawing, white paper made clear, colors
  // kept; the template turns and sizes it. Done once per plan (pkg.plan), so a design switch never redoes it; a new plan
  // (an upload) does. A plan that can't be placed leaves pkg.plan empty and the design takes its no-plan version.
  async function redrawPlan(){
    const F = pkg.floorPlan;
    if(!F || !F.active) return;
    const key = JSON.stringify([F.source, (F.files || []).filter(f => !f.from || f.from === F.source).map(f => f.url || f.label)]);
    if(pkg.planKey === key) return;
    try {
      let pages;
      try { pages = await PT.planCanvases(await planBlobs((F.files || []).filter(f => !f.from || !F.source || f.from === F.source))); }
      catch(e) { if(!F.art || !F.art.length) throw e; pages = await PT.artCanvases(F.art); }
      const st = +pkg.listing.stories || 0;
      if(st && pages.length > st) pages = pages.slice(0, st);   // pages past the story count are not floors (same as the preview)
      let plan = PT.givenPlan(pages);
      if(!plan.levels.length) plan = null;
      Object.assign(pkg, {plan, planKey: key});
      store.event(pkg.id, plan ? 'plan-placed' : 'plan-place-failed', plan ? {floors: plan.levels.length} : {why: ['no drawing found']});
    } catch(e) {
      // a failure is tried again at the next Finalize (no key saved)
      pkg.plan = null; store.event(pkg.id, 'plan-place-failed', {why: [e.message]});
    }
  }
  const masterJobs = {};
  function masterFor(p){
    const design = p.design, c = p.copy[design];
    return masterJobs[p.id] = ai({action: 'master', packageId: p.id, style: p.copyStyle, listing: p.listing,
        allPhotos: Object.fromEntries(p.photos.map((ph, i) => ['p' + i, [ph.room, ph.desc].filter(Boolean).join(': ')])),
        photoUrls: Object.fromEntries(p.photos.map((ph, i) => ['p' + i, ph.url]).filter(([, u]) => /^https:\/\//.test(u || ''))),
        photoNotes: p.photoNotes, written: {copy: c.copy, companion: c.companion}})
      .then(m => { if(m.master) p.master = m.master; if(p.copy[design]) p.copy[design].cost += m.cost || 0; if(p === pkg) save(true); })
      .catch(e => console.error('master set', e))
      .finally(() => { delete masterJobs[p.id]; });
  }
  async function ai(body){
    const headers = {'content-type': 'application/json'};
    if(me){ const {data} = await sb.auth.getSession(); if(data.session) headers.authorization = 'Bearer ' + data.session.access_token; }
    let r;
    try { r = await fetch(FN_AI, {method: 'POST', headers, body: JSON.stringify(body)}); } catch(e) { throw new Error('network'); }
    const j = await r.json().catch(() => ({ok: false, error: 'bad-reply'}));
    if(!j.ok) throw new Error(j.error || 'ai-failed');
    return j;
  }
  // a rewrite whose spots still fail after two rounds sends just those back for the last (strongest-model) pass, in a request
  // of its own: the platform stops each request at 150 s, and the last pass doesn't fit after two rounds
  async function refitAll(body){
    const j = await ai(body);
    const left = (j.flagged || []).map(f => ({...body.slots.find(s => s.path === f.path), why: f.why})).filter(s => s.path);
    if(!left.length) return j;
    try {
      const k = await ai({...body, slots: left, finalOnly: true});
      return {...j, texts: {...j.texts, ...k.texts}, alts: {...j.alts, ...k.alts}, flagged: k.flagged || [], finals: k.finals || [], cost: (j.cost || 0) + (k.cost || 0)};
    } catch(e) { console.error('last pass', e); return j; }
  }

  // ---------- 4. final proof ----------
  let finalPiece = null;
  function nextPiece(){ const ps = piecesOf(pkg); return ps.find(id => !pkg.approvals[id]) || ps[0]; }
  // a listing plan with no room sizes (the owner 10/27): ask once whether to take them from the MLS room list (draft wording)
  function planSizesBox(){
    const P = pkg.plan, mls = (pkg.listing.rooms || []).filter(r => r && r.size);
    $('#planSizes').hidden = !(P && P.noSizes && !pkg.paid && mls.length && pkg.planSizes == null);
    $('#planSizesYes').onclick = async () => { pkg.plan = PT.mlsSizes(P, mls); pkg.planSizes = 'mls'; store.event(pkg.id, 'plan-sizes', {from: 'mls'}); save(); planSizesBox(); await drawFinal(); };
    $('#planSizesNo').onclick = () => { pkg.planSizes = 'none'; store.event(pkg.id, 'plan-sizes', {from: 'none'}); save(); planSizesBox(); };
  }
  async function openFinal(piece){
    if(!pkg.copy[pkg.design]) return openRough();
    show('vFinal');
    const ps = piecesOf(pkg);
    finalPiece = piece && ps.includes(piece) ? piece : (ps.includes(finalPiece) ? finalPiece : nextPiece());
    $('#finalPiece').innerHTML = ps.map(id => `<option value="${id}"${id === finalPiece ? ' selected' : ''}>${pieceLabel(id)}${pkg.approvals[id] ? ' (approved)' : ''}</option>`).join('');
    $('#finalTitle').textContent = `Proof: ${pkg.listing.address}`;
    $('#backToRough').hidden = !!pkg.paid;
    ohFit = null; await ohFields(); foldColorFields(); planSizesBox(); approveBox(); switchTiles(); await drawFinal(); drawExtras('extrasFinal');
    // a proof that hasn't had its fill pass or outside AI check yet (written before it existed, or interrupted) gets one now
    const w = pkg.copy[pkg.design]; if(w && !pkg.paid && pkg.stage === 'final'){ if(!w.filled) await fillPass(); if(!w.aiCheck) await aiCheckPass(); }
  }

  // ---------- see it in another design (brief master-copy-design-switch-10-24) ----------
  // The master copy set fits the new design in code; only a spot no saved version fits gets one small rewrite. Photo
  // picks and the agent's text edits carry over; the floor plan keeps its placed pages (pkg.plan), never found again.
  async function switchTiles(){
    const box = $('#switchTiles'); if(!box) return;
    const l = (await eligible()).filter(({d}) => d.id !== pkg.design);
    $('#switchBox').hidden = !l.length || !!pkg.paid;
    box.innerHTML = l.map(({d}) => `<button type="button" class="btn line" data-switch="${d.id}">${esc(d.name)}</button>`).join('');
    $$('[data-switch]').forEach(b => b.onclick = () => switchDesign(b.dataset.switch));
  }
  const allStrings = o => typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(allStrings) : [];
  async function switchDesign(id){
    const say = t => { $('#swProgress').textContent = t; }, name = (designs.find(d => d.id === id) || {}).name || 'that design';
    $$('[data-switch]').forEach(b => b.disabled = true);
    try {
      const from = pkg.design;
      if(!pkg.arrangements[id]) pkg.arrangements[id] = arrangement(pkg, from).slice();   // the agent's photo picks carry over
      if(!pkg.copy[id]){
        // still writing in the background (or the page was closed before it came back): wait for it, or write it now
        if(!pkg.master && (masterJobs[pkg.id] || pkg.copy[from])){ say(`Finishing the copy every other design draws from…`); await (masterJobs[pkg.id] || masterFor(pkg)); }
        if(!pkg.master){ say(`This package was written before designs could switch, so ${name} needs its own writing. Use Back to the rough draft and Finalize again.`); return; }
        say(`Fitting your copy to ${name}…`);
        await PT.load();
        const ids = arrangement(pkg, id).map(i => 'p' + i), ex = await exampleFor(id, ids);
        // a design with more photo spots than the package has photos borrows from the listing's other photos (the
        // picker's lower box) before it repeats any; only the ones it places join the package
        const more = (pkg.morePhotos || []).filter(m => !pkg.photos.some(p => p.url === m.url));
        const extra = MasterFit.photoSpots(ex) > ids.length ? more.map((_, i) => 'm' + i) : [];
        const roomOf = pid => (pid[0] === 'm' ? more[+pid.slice(1)] : pkg.photos[+pid.slice(1)] || {}).room || '';
        const r = MasterFit.fit(pkg.master, ex, {ids, extra, roomOf, heading: PT.heading,
          base: {copy: draftCopy(ids), companion: draftCompanion(ids)}});
        const usedM = [...new Set(JSON.stringify([r.copy, r.companion]).match(/"m\d+"/g) || [])].map(q => q.slice(1, -1));
        if(usedM.length){
          const newId = {};
          for(const m of usedM){ pkg.photos.push(Object.assign({}, more[+m.slice(1)])); newId[m] = 'p' + (pkg.photos.length - 1); }
          pkg.arrangements[id] = arrangement(pkg, id).concat(usedM.map(m => +newId[m].slice(1)));
          const swap = o => typeof o === 'string' ? (newId[o] || o) : Array.isArray(o) ? o.map(swap) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, swap(v)])) : o;
          r.copy = swap(r.copy); r.companion = swap(r.companion);
          r.refits.forEach(f => { if(newId[f.photo]) f.photo = newId[f.photo]; });
          resolvePhotos(pkg);   // the added photos load like the rest
        }
        // the agent's edits: the same saved text in the new design takes their version (refit when it won't fit)
        const exLen = path => String(path.split('.').reduce((o, k) => o == null ? o : o[k], {copy: ex.copy, companion: ex.companion}) || '').length;
        const walk = (o, p) => typeof o === 'string' ? [[p, o]] : o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => walk(v, p ? `${p}.${k}` : k)) : [];
        for(const e of pkg.textEdits || []) for(const [p, t] of walk({copy: r.copy, companion: r.companion}, '')) if(t === e.before){
          if(e.after.length <= exLen(p) * 1.06) MasterFit.place(r, p, e.after);
          else r.refits.push({path: p, budget: exLen(p), label: 'your edit', key: 'edit', versions: [e.after]});
        }
        let cost = 0, flagged = [];
        if(r.refits.length){
          say(`Rewriting ${r.refits.length} ${r.refits.length === 1 ? 'spot' : 'spots'} to fit ${name}, then checking every line…`);
          for(let i = 0; i < r.refits.length; i += 40){   // the function takes up to 40 spots a call
            // each spot says what its photo shows, so the rewrite (and the reviewer) never claims more than the photo does
            // and sends the photo itself (img) plus the question an answer sits under (ask), so the writer and reviewer see what the reader sees
            const photoOf = pid => /^p\d+$/.test(pid || '') ? pkg.photos[+pid.slice(1)] : null;
            const seen = pid => { const ph = photoOf(pid); return ph ? [ph.room, ph.desc].filter(Boolean).join(': ') || 'listing photo' : ''; };
            const at = path => path.split('.').reduce((o, k) => o == null ? o : o[k], r);
            const slots = r.refits.slice(i, i + 40).map(f => Object.assign({}, f, {photo: seen(f.photo), img: (photoOf(f.photo) || {}).url,
              ask: /\.a$/.test(f.path) ? at(f.path.replace(/\.a$/, '.q')) : undefined}));
            const j = await refitAll({action: 'refit', packageId: pkg.id, slots, facts: pkg.master.facts, listing: pkg.listing,
              photos: Object.fromEntries(pkg.photos.map((p, i) => ['p' + i, p.desc || ''])), others: allStrings(r.companion)});   // reuse is checked within the new design (fold-over vs its other pieces), never against the design it replaces
            for(const [p, t] of Object.entries(j.texts || {})) MasterFit.place(r, p, t);
            cost += j.cost || 0; flagged = flagged.concat(j.flagged || []);
          }
        }
        pkg.copy[id] = {copy: r.copy, companion: r.companion, writtenAt: new Date().toISOString(), fromMaster: true, refits: r.refits.length, cost, flagged};
        store.event(pkg.id, 'design-switch', {from, to: id, refits: r.refits.length, flagged: flagged.length, cost});
      }
      pkg.design = id; save();
      const fl = (pkg.copy[id].flagged || []).length;
      say(fl ? `Here it is in ${name}. ${fl} ${fl === 1 ? 'spot needs' : 'spots need'} a look: click it to change it.` : `Here it is in ${name}.`);
      await switchTiles(); await drawFinal();
      if(!pkg.copy[id].filled){ say(`Filling every box in ${name}…`); await fillPass(); say(`Checking that nothing reads machine-written…`); await aiCheckPass(); say(fl ? `Here it is in ${name}. ${fl} ${fl === 1 ? 'spot needs' : 'spots need'} a look: click it to change it.` : `Here it is in ${name}.`); }
    } catch(e) { say("We couldn't switch just now. Your proof is unchanged; try again."); }
    finally { $$('[data-switch]').forEach(b => b.disabled = false); }
  }
  // fill pass (owner 10/26): every text box on the proof is filled to its last line, the last line at least 3/4 full.
  // After the proof lays out, each box that stops short is measured (characters per line in its own font and width)
  // and goes back once for a rewrite with real detail from its photo and the listing; then the proof redraws.
  // how a text sits in its box on the proof: lines used, how full the last line is, and whether it runs over
  function measure(el, text){
    const doc = el.ownerDocument, keep = el.textContent; el.textContent = text;
    const rg = doc.createRange(); rg.selectNodeContents(el);
    const rows = []; [...rg.getClientRects()].filter(q => q.width > .5).forEach(q => { const row = rows.find(x => Math.abs(x.top - q.top) < 2); if(row) row.right = Math.max(row.right, q.right); else rows.push({top: q.top, right: q.right}); });
    const box = el.getBoundingClientRect(), last = rows.sort((a, b) => a.top - b.top)[rows.length - 1];
    const lastFill = last ? Math.min(1, (last.right - box.left) / box.width) : 0, lines = +el.dataset.lines || 99;
    // a last line within 5% of the edge counts as running over: the print renderer sets type a hair wider than this preview
    const over = el.scrollHeight > el.clientHeight + 1 || rows.length > lines || (rows.length === lines && lastFill > 0.95);
    const r = {rows: rows.length, last: lastFill, over};
    el.textContent = keep; return r;
  }
  // of the versions a rewrite sent back, the one that fills its box (last line at least 3/4) without running over; else
  // the fullest one that fits; never one that runs over when another doesn't
  function pickFit(el, cands){
    const need = +el.dataset.fill || +el.dataset.lines || 1;
    const scored = [...new Set(cands.filter(Boolean))].map(t => ({t, m: measure(el, t)}));
    const good = scored.filter(x => !x.m.over && (x.m.rows > need || (x.m.rows === need && x.m.last >= 0.75)));
    if(good.length) return good.sort((a, b) => b.t.length - a.t.length)[0].t;
    const fits = scored.filter(x => !x.m.over);
    return (fits.sort((a, b) => b.t.length - a.t.length)[0] || scored.sort((a, b) => a.t.length - b.t.length)[0] || {}).t;
  }
  function slotEl(text){
    const t = norm(text);
    for(const fr of $$('#finalProof iframe')){ const doc = fr.contentDocument; if(!doc) continue;
      const el = [...doc.querySelectorAll('[data-slot]')].find(x => !x.children.length && norm(x.textContent) === t); if(el) return el; }
    return null;
  }
  async function fillPass(){
    const w = pkg.copy[pkg.design]; if(!w || w.filled) return;
    for(let t = 0; t < 40 && !$$('#finalProof iframe').some(fr => fr.contentDocument && fr.contentDocument.querySelector('.bd-edit')); t++) await new Promise(r => setTimeout(r, 250));
    const spots = [], seenPath = new Set(), els = {};
    for(const fr of $$('#finalProof iframe')){
      const doc = fr.contentDocument; if(!doc) continue;
      doc.querySelectorAll('[data-slot]').forEach(el => {
        const lines = +el.dataset.lines || 0, need = +el.dataset.fill || lines, txt = norm(el.textContent);
        if(lines < 2 || !txt || el.dataset.fine || FIXED.test(el.dataset.slot) || el.children.length || !el.getClientRects().length) return;
        const rg = doc.createRange(); rg.selectNodeContents(el);
        const rows = []; [...rg.getClientRects()].filter(q => q.width > .5).forEach(q => { const row = rows.find(x => Math.abs(x.top - q.top) < 2); if(row) row.right = Math.max(row.right, q.right); else rows.push({top: q.top, right: q.right}); });
        const box = el.getBoundingClientRect(), last = rows.sort((a, b) => a.top - b.top)[rows.length - 1];
        const lastFill = last ? Math.min(1, (last.right - box.left) / box.width) : 0;
        const over = el.scrollHeight > el.clientHeight + 1 || rows.length > lines || (rows.length === lines && lastFill > 0.95);   // running over (or within 5% of it) goes back too, shorter
        if(!over && (rows.length > need || (rows.length === need && lastFill >= 0.75))) return;
        const cpl = txt.length / Math.max(0.5, rows.length - 1 + lastFill);
        const path = (findPath(txt) || '').replace(/\[(\d+)\]/g, '.$1');
        if(!path || seenPath.has(path)) return; seenPath.add(path);
        const item = path.split('.').slice(0, -1).reduce((o, k) => o == null ? o : o[k], w) || {};
        const ph = /^p\d+$/.test(item.photo || '') ? pkg.photos[+item.photo.slice(1)] : null;
        els[path] = el;
        spots.push({path, budget: Math.floor(cpl * lines * 0.97), min: Math.ceil(cpl * (need - 0.2)), variants: true, label: el.dataset.slot, key: '', versions: [txt],
          photo: ph ? [ph.room, ph.desc].filter(Boolean).join(': ') || 'listing photo' : '', img: ph ? ph.url : undefined,
          ask: /\.a$/.test(path) ? getPath(w, path.replace(/\.a$/, '.q')) : undefined});
      });
    }
    w.filled = {spots: spots.length, cost: 0, at: new Date().toISOString()};
    if(spots.length){
      try {
        const j = await refitAll({action: 'refit', packageId: pkg.id, slots: spots.slice(0, 40), facts: (pkg.master || {}).facts || {}, listing: pkg.listing,
          photos: Object.fromEntries(pkg.photos.map((p, i) => ['p' + i, p.desc || ''])), others: allStrings(w.companion)});
        // each box takes the version that fills it in the real layout (the old text stays if nothing new fits better)
        for(const [p, t] of Object.entries(j.texts || {})){ const el = els[p]; setPath(w, p, el ? pickFit(el, [t, ...((j.alts || {})[p] || []), getPath(w, p)]) || t : t); }
        w.filled.cost = j.cost || 0; w.filled.held = (j.flagged || []).length;
        w.cost = (w.cost || 0) + (j.cost || 0);
        store.event(pkg.id, 'fill-pass', {design: pkg.design, spots: spots.length, cost: j.cost || 0});
      } catch(e) { console.error('fill pass', e); }
    }
    save(); await drawFinal();
  }
  // outside cross-check (Pangram AI-writing detector, owner 10/26): the finished piece is read as a whole; any line inside a
  // stretch it marks as AI-written goes back once for a rewrite at the same length. Skipped when the key isn't set.
  async function aiCheckPass(){
    const w = pkg.copy[pkg.design]; if(!w || w.aiCheck) return;
    const lines = leaves({copy: w.copy, companion: w.companion}, '', []).map(([p, t]) => ({path: p.replace(/\[(\d+)\]/g, '.$1'), text: t}))
      .filter(x => x.text.length > 2 && !/(^|\.)(kicker|stats|location|eyebrow|label|big|kind)(\.|$)/.test(x.path));
    try {
      const j = await ai({action: 'ai-check', packageId: pkg.id, texts: lines});
      w.aiCheck = {prediction: j.prediction || '', fractionAi: j.fractionAi || 0, skipped: j.skipped || '', error: j.error || '', flagged: (j.flagged || []).length, cost: j.cost || 0};
      if(j.error) console.warn('ai check', j.error);
      w.cost = (w.cost || 0) + (j.cost || 0);
      if((j.flagged || []).length){
        const slots = j.flagged.slice(0, 40).map(path => {
          const t = String(getPath(w, path) || ''), item = path.split('.').slice(0, -1).reduce((o, k) => o == null ? o : o[k], w) || {};
          const ph = /^p\d+$/.test(item.photo || '') ? pkg.photos[+item.photo.slice(1)] : null;
          return {path, budget: Math.ceil(t.length * 1.06), min: Math.floor(t.length * 0.94), variants: true, label: path, key: '', versions: [t],
            why: 'An outside AI-writing detector marked this line as machine-written. Rewrite it the way a person would say it.',
            photo: ph ? [ph.room, ph.desc].filter(Boolean).join(': ') || 'listing photo' : '', img: ph ? ph.url : undefined,
            ask: /\.a$/.test(path) ? getPath(w, path.replace(/\.a$/, '.q')) : undefined};
        }).filter(x => x.versions[0]);
        const r = await refitAll({action: 'refit', packageId: pkg.id, slots, facts: (pkg.master || {}).facts || {}, listing: pkg.listing,
          photos: Object.fromEntries(pkg.photos.map((p, i) => ['p' + i, p.desc || ''])), others: allStrings(w.companion)});
        for(const [p, t] of Object.entries(r.texts || {})){ const el = slotEl(getPath(w, p)); setPath(w, p, el ? pickFit(el, [t, ...((r.alts || {})[p] || [])]) || t : t); }
        w.aiCheck.rewritten = Object.keys(r.texts || {}).length; w.aiCheck.cost += r.cost || 0; w.cost += r.cost || 0;
      }
      store.event(pkg.id, 'ai-check', {design: pkg.design, ...w.aiCheck});
    } catch(e) { console.error('ai check', e); }
    save(); await drawFinal();
  }
  $('#finalPiece').onchange = async e => { finalPiece = e.target.value; await ohFields(); foldColorFields(); approveBox(); drawFinal(); };
  // the fold-over's two colors (owner 11/7/2026, every design set): the background and the floor plan box. Free, no AI;
  // pkg.colors {page, planBox} goes to the renderer with the rest of the package
  let fcTimer = null;
  async function foldColorFields(){
    const on = finalPiece === 'foldover';
    $('#foldColorsCtl').hidden = !on; if(!on) return;
    const S = await spec(pkg.design), fo = (S.pieces || []).find(p => p.kind === 'foldover') || {};
    if(!fo.colors){ $('#foldColorsCtl').hidden = true; return; }
    const k = brandKit() || {};
    ProofEditor.foldColors($('#foldColors'), {value: pkg.colors || {}, defaults: fo.colors, colors: [pkg.brand.accent].concat(k.colors || []),
      plan: !!(pkg.floorPlan && pkg.floorPlan.active) || !!pkg.plan,
      onChange: c => { if(c) pkg.colors = c; else delete pkg.colors; save(); store.event(pkg.id, 'fold-colors', c || {}); clearTimeout(fcTimer); fcTimer = setTimeout(drawFinal, 60); }});
  }
  async function drawFinal(again){
    const S = await spec(pkg.design); S.design = pkg.design;
    const box = $('#finalProof');
    // an Open House flyer picked from the library draws with the library's own proof card (account.js)
    if(finalPiece === 'open-house-flyer' && pkg.ohFlyer && pkg.ohFlyer.library && window.Account){
      box.className = 'proof single';
      if(await Account.ohProof(box, pkg, await dataFor(pkg.design, true), () => { save(); drawFinal(); })) return;
    }
    const parts = partsFor(S, finalPiece, pkg);
    box.className = 'proof ' + (finalPiece === 'foldover' ? 'fold' : parts.length > 1 ? 'two' : 'single');
    await drawParts(box, pkg.design, parts, await dataFor(pkg.design, true), wireText);
    if(!again) await ohMeasure();
    planControls();
  }
  // ---------- the agent's own photos (owner 11/2: proper photo storage) ----------
  // Signed in, a photo the agent adds in the editor (food photos, the event box photo) goes to the private Storage bucket
  // agent-uploads under their own folder (migration 20261102_agent_uploads.sql); the account keeps only its path, and the
  // screens show it through a signed link (6 hours, refreshed as needed). The test drive (this browser only) keeps the
  // small JPEG copy as before. A copy saved before this (a data: link) moves to the bucket the next time the editor opens.
  const UPLOADS = 'agent-uploads', SIGN_FOR = 6 * 3600, signedLinks = new Map();   // path -> {url, until}
  const canUpload = () => !!(sb && me && !localMode);
  async function signUploads(paths){
    const need = [...new Set(paths.filter(Boolean))].filter(p => !((signedLinks.get(p) || {}).until > Date.now() + 10 * 60e3));
    if(!need.length || !canUpload()) return;
    const {data, error} = await sb.storage.from(UPLOADS).createSignedUrls(need, SIGN_FOR);
    if(error){ console.warn('photo links', error.message); return; }
    (data || []).forEach(d => { if(d.signedUrl && d.path) signedLinks.set(d.path, {url: d.signedUrl, until: Date.now() + SIGN_FOR * 1000}); });
  }
  // the photo as the screens show it: its signed link when stored, else the copy it carries
  const shown = it => it && it.path ? Object.assign({}, it, {src: (signedLinks.get(it.path) || {}).url || it.src || ''}) : it;
  // what the account keeps: the path, never a link that expires or a copy of the photo
  const kept = it => { if(!it || !it.path) return it; const {src, ...rest} = it; return rest; };
  async function uploadPhoto(p, kind){
    if(!canUpload()) return {src: p.src};
    const blob = await (await fetch(p.src)).blob(), path = `${me.id}/${kind}/${uuid()}.jpg`;
    const {error} = await sb.storage.from(UPLOADS).upload(path, blob, {contentType: 'image/jpeg', upsert: false});
    if(error){ console.warn('photo upload', error.message); return null; }
    await signUploads([path]);
    if(pkg) store.event(pkg.id, 'photo-upload', {kind});
    return {path, src: (signedLinks.get(path) || {}).url || p.src};
  }
  function removeUpload(it){
    if(!it || !it.path || !canUpload()) return;
    sb.storage.from(UPLOADS).remove([it.path]).then(({error}) => { if(error) console.warn('photo remove', error.message); });
  }
  // old inline copies (before 11/2) move to the bucket once; nothing changes if the upload fails
  async function moveInlinePhotos(){
    if(!canUpload()) return;
    const k = brandKit() || {}, inline = it => it && !it.path && /^data:image\//.test(it.src || '');
    let kitChanged = false;
    const foods = [];
    for(const it of k.foodPhotos || []){
      if(inline(it)){ const r = await uploadPhoto(it, 'food'); if(r && r.path){ foods.push(Object.assign({}, it, {path: r.path})); kitChanged = true; continue; } }
      foods.push(it);
    }
    if(kitChanged) saveKit(Object.assign({}, k, {foodPhotos: foods.map(kept)}));
    const B = pkg && pkg.openHouse && pkg.openHouse.boxPhoto;
    if(inline(B)){ const r = await uploadPhoto(B, 'box'); if(r && r.path){ pkg.openHouse.boxPhoto = kept(Object.assign({}, B, {path: r.path})); save(); } }
  }
  // every stored photo the open house uses, signed for the screens
  async function ohPhotosReady(){
    const k = brandKit() || {}, B = pkg && pkg.openHouse && pkg.openHouse.boxPhoto;
    await signUploads((k.foodPhotos || []).map(x => x.path).concat(B ? [B.path] : []));
  }

  // the Open House updater (proof-editor.js): type, date and time, the event box lines, the box photo and the food photo;
  // it writes pkg.openHouse and the flyer re-draws, free, for a year after the order (no AI)
  let ohEd = null, ohTimer = null;
  async function ohFields(){
    const on = finalPiece === 'open-house-flyer';
    $('#ohFields').hidden = !on; if(!on){ ohEd = null; return; }
    if(window.Account && !$('#ohLibPick')){
      $('#ohFields').insertAdjacentHTML('beforeend', '<p><button type="button" class="link" id="ohLibPick">Pick from the Open House library</button></p>');
      $('#ohLibPick').onclick = async () => { if(!await Account.ohPick(pkg, await dataFor(pkg.design, true), () => { save(); drawFinal(); }))
        await ask("<h2>The library isn't loading</h2><p>Try again in a minute.</p>", [['OK', 'ok']]); };
    }
    await moveInlinePhotos(); await ohPhotosReady();
    const w = windows(pkg), open = !w || !w.ohUntil || new Date() <= new Date(w.ohUntil);
    const k = brandKit() || {};
    const ohShown = Object.assign({}, pkg.openHouse, pkg.openHouse && pkg.openHouse.boxPhoto ? {boxPhoto: shown(pkg.openHouse.boxPhoto)} : {});
    ohEd = ProofEditor.event($('#ohEditor'), {value: ohShown, nar: !!(profile && profile.nar) || !!(k.contact && k.contact.nar), locked: !open,
      colors: [pkg.brand.accent].concat(k.colors || []), paper: OH_PAPER.has(ohPieceId()), food: OH_FOOD.has(ohPieceId()), email: false,
      foodLibrary: foodLib, foodBase: '/designs/food/', saved: (k.foodPhotos || []).map(shown),
      upload: uploadPhoto, remove: removeUpload,
      onChange: (oh, why) => { if(oh.boxPhoto) oh.boxPhoto = kept(oh.boxPhoto); pkg.openHouse = oh; save(); store.event(pkg.id, 'oh-update', {what: why}); clearTimeout(ohTimer); ohTimer = setTimeout(drawFinal, why === 'text' || why === 'head' ? 450 : 60); },
      onSaved: list => saveKit(Object.assign({}, brandKit() || {}, {foodPhotos: list.map(kept)}))});
  }
  // flyers that read openHouse.paper (B47 Itinerary, 11/01) and draw a food photo (the library's refreshments flyers);
  // Ivory's own flyers do neither, so those controls show when a library flyer is picked
  const OH_PAPER = new Set(['lib-b47-itinerary']);
  const OH_FOOD = new Set(['lib-b10-luncheon-band', 'lib-b13-tasting-table']);
  const ohPieceId = () => (pkg.ohFlyer && pkg.ohFlyer.piece) || '';
  let foodLib = [];
  fetch('/designs/food/library.json').then(r => r.json()).then(j => { foodLib = j.photos || []; }).catch(() => {});
  // what fit in the drawn flyer (rule 6): the next draw prints only that, and the editor grays the rest
  let ohFit = null;
  async function ohMeasure(){
    if(finalPiece !== 'open-house-flyer' || !ohEd) return;
    const fr = $('#finalProof iframe'); if(!fr) return;
    const full = ProofEditor.toFields(pkg.openHouse || {}), fit = ProofEditor.measure(fr.contentDocument, full);
    const changed = JSON.stringify(fit) !== JSON.stringify(ohFit);
    ohFit = fit; ohEd.overflow({flyer: {label: 'print flyer', fit}});
    if(changed) await drawFinal(true);
  }

  // click any text the system wrote: Rewrite it myself / Rewrite for me (owner 11/7/2026)
  const FIXED = /^(agent\.|broker\.|plan\.|back\.footnote|back\.disclosure|back\.room|back\.level|top\.stat|oh\.|event\.)/;
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
  function leaves(node, path, out){
    if(typeof node === 'string') out.push([path, node]);
    else if(Array.isArray(node)) node.forEach((v, i) => leaves(v, `${path}[${i}]`, out));
    // "photos" is skipped only as a list of photo picks: in the Answer Book it holds the cover's and front page's captions
    else if(node && typeof node === 'object') for(const [k, v] of Object.entries(node)) if(!['photo', 'flyerPhotos', 'variant', 'fineprint', 'footnote'].includes(k) && !(k === 'photos' && Array.isArray(v) && v.every(x => typeof x === 'string'))) leaves(v, path ? `${path}.${k}` : k, out);
    return out;
  }
  function findPath(text){
    const w = pkg.copy[pkg.design], t = norm(text);
    if(!t) return null;
    const all = leaves({copy: w.copy, companion: w.companion}, '', []);
    return (all.find(([, v]) => norm(v) === t) || all.find(([, v]) => norm(v) && t.includes(norm(v)) && norm(v).length > 12) || [null])[0];
  }
  function getPath(root, path){ return path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean).reduce((o, k) => o == null ? o : o[k], root); }
  function setPath(root, path, v){ const ks = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean); const last = ks.pop(); const o = ks.reduce((a, k) => a[k], root); o[last] = v; }
  function wireText(fr, sheet){
    const doc = fr.contentDocument;
    const st = doc.createElement('style');
    st.textContent = '[data-slot].bd-edit{cursor:text}[data-slot].bd-edit:hover{outline:1.5px dashed #1F4D3F;outline-offset:2px}';
    doc.head.appendChild(st);
    doc.querySelectorAll('[data-slot]').forEach(el => {
      if(FIXED.test(el.dataset.slot) || el.dataset.fine || !norm(el.textContent)) return;
      el.classList.add('bd-edit');
      el.addEventListener('click', e => { e.stopPropagation(); openPop(el, fr, sheet); });
    });
  }

  // ---------- the edit pop-over ----------
  let edit = null;
  const pop = $('#pop');
  function closePop(){ if(edit && edit.el && edit.orig != null){ edit.el.textContent = edit.shown; } pop.hidden = true; edit = null; }
  function limitOf(el){
    const cs = el.ownerDocument.defaultView.getComputedStyle(el);
    const lines = +el.dataset.lines || Math.max(1, Math.round(el.clientHeight / (parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3)));
    const cpl = el.clientWidth / (parseFloat(cs.fontSize) * 0.5);
    return Math.max(12, Math.floor(lines * cpl * 0.97));
  }
  function overflowing(el){
    const w = el.ownerDocument.defaultView;
    try { if(w.brochureCheck) return w.brochureCheck().some(c => c.kind === 'overflow' && c.slot === el.dataset.slot); } catch(e) {}
    return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
  }
  function openPop(el, fr, sheet){
    closePop();
    const path = findPath(el.textContent);
    if(!path){ ask('<h2>From your listing</h2><p>This line comes from your listing facts or profile, so it changes there, not here.</p>', [['OK', 'ok']]); return; }
    if(pkg.paid && !fixesOpen(pkg)){ ask(`<h2>Fixes are closed</h2><p>Small fixes for this package closed on ${dayFmt(windows(pkg).fixesUntil)}. Email support@brochuredesk.com if you need a change.</p>`, [['OK', 'ok']]); return; }
    const text = getPath(pkg.copy[pkg.design], path);
    edit = {el, fr, path, orig: text, shown: el.textContent, limit: limitOf(el)};
    $('#popLabel').textContent = 'Change this text';
    $('#popChoose').hidden = false; $('#popEdit').hidden = true; $('#popAsk').hidden = true; $('#popSave').hidden = true; $('#popStatus').textContent = '';
    pop.hidden = false; placePop();
    $('#popSelf').focus();
  }
  function selfMode(text){
    $('#popChoose').hidden = true; $('#popAsk').hidden = true; $('#popEdit').hidden = false; $('#popSave').hidden = false;
    $('#popText').value = text; liveCount(); $('#popText').focus(); $('#popText').select(); placePop();
  }
  // keep the pop-over on screen as it grows
  function placePop(){
    if(!edit) return;
    const r = edit.el.getBoundingClientRect(), f = edit.fr.getBoundingClientRect(), k = +edit.fr.parentNode.dataset.k || 1;
    const x = f.left + r.left * k, below = f.top + r.bottom * k + 8, above = f.top + r.top * k - pop.offsetHeight - 8;
    pop.style.left = Math.max(16, Math.min(x, innerWidth - pop.offsetWidth - 16)) + 'px';
    pop.style.top = Math.max(16, below + pop.offsetHeight <= innerHeight - 16 ? below : above > 16 ? above : innerHeight - pop.offsetHeight - 16) + 'px';
  }
  function liveCount(){
    if(!edit) return;
    const v = $('#popText').value, n = v.length;
    edit.el.textContent = v;                          // live on the proof; type never shrinks to fit
    const over = n > edit.limit || overflowing(edit.el);
    $('#popCount').textContent = `${n} / ${edit.limit} characters`;
    $('#popCount').classList.toggle('over', over);
    $('#popShorten').hidden = !over;
  }
  $('#popSelf').onclick = () => selfMode(edit.orig);
  $('#popGuide').onclick = () => { $('#popChoose').hidden = true; $('#popAsk').hidden = false; $('#popInstr').value = ''; $('#popInstr').focus(); placePop(); };
  $('#popText').oninput = liveCount;
  $('#popCancel').onclick = closePop;
  async function aiSpot(action, extra){
    $('#popStatus').textContent = action === 'shorten' ? 'Shortening…' : 'Rewriting…';
    try {
      const j = await ai(Object.assign({action, packageId: pkg.id, text: $('#popEdit').hidden ? edit.orig : $('#popText').value, max: edit.limit,
        label: edit.el.dataset.slot, listing: pkg.listing, photos: [...new Set(pkg.photos.map(p => p.desc).filter(Boolean))]}, extra));
      selfMode(j.text);
      $('#popStatus').textContent = j.flagged && j.flagged.length ? `Check this one: ${j.flagged[0]}.` : 'Here it is. Change anything, then Save.';
    } catch(e) { $('#popStatus').textContent = "That didn't work just now. Try again, or type it yourself."; }
  }
  $('#popAskGo').onclick = () => { const t = $('#popInstr').value.trim(); if(!t){ $('#popInstr').focus(); return; } aiSpot('rewrite', {instructions: t}); };
  $('#popShorten').onclick = () => aiSpot('shorten', {});
  $('#popSave').onclick = () => {
    const v = $('#popText').value.trim();
    const before = getPath(pkg.copy[pkg.design], edit.path);
    setPath(pkg.copy[pkg.design], edit.path, v);
    pkg.edits = (pkg.edits || 0) + 1;
    // kept for a design switch: the same text in the new design takes the agent's version (refit if it won't fit)
    pkg.textEdits = (pkg.textEdits || []).filter(x => x.after !== before).concat([{before: (pkg.textEdits || []).find(x => x.after === before)?.before || before, after: v}]);
    edit.orig = null; pop.hidden = true; edit = null;
    save(); drawFinal();
  };
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !pop.hidden) closePop(); });
  document.addEventListener('mousedown', e => { if(!pop.hidden && !pop.contains(e.target) && !e.target.closest('dialog')) closePop(); });

  // ---------- 5. approve and order ----------
  function approveBox(){
    const a = pkg.approvals[finalPiece], w = windows(pkg), btn = $('#approve');
    $('#pieceState').className = 'pstate' + (a ? ' ok' : '');
    $('#pieceState').textContent = a ? `Approved ${dayFmt(a)}` : pkg.paid ? 'Not approved yet' : '';
    btn.hidden = !!a;
    btn.textContent = pkg.paid ? 'Approve this piece' : `Approve and order · ${money(PRICE[pkg.order.kind])}`;
    $('#approveNote').hidden = !!a;
    $('#windowNote').textContent = w ? `${w.all ? 'Small fixes' : 'Fixes and approvals'} open until ${dayFmt(w.fixesUntil)}.` + (w.ohUntil ? ` Open house details can be updated until ${dayFmt(w.ohUntil)}.` : '') : '';
    if(a && (pkg.paid || finalPiece === 'foldover')) $('#windowNote').insertAdjacentHTML('beforeend', ' <button type="button" class="link" id="redeliver">Printer or download</button>'
      + (pkg.paid ? ' <button type="button" class="link" id="coloringDl">Coloring page</button>' : ''));
    const rd = $('#redeliver'); if(rd) rd.onclick = () => deliver(finalPiece);
    const cd = $('#coloringDl'); if(cd) cd.onclick = () => coloringPage();
  }
  $('#approve').onclick = async () => {
    if(finalPiece === 'open-house-flyer' && !(pkg.openHouse.date && pkg.openHouse.start && pkg.openHouse.end)){
      await ask('<h2>Add the open house first</h2><p>Fill in the date and times on the right, then approve the flyer. You can change them for free for a year.</p>', [['OK', 'ok']]);
      { const d = $('#ohEditor [data-k="date"]'); if(d) d.focus(); } return;
    }
    if(!pkg.paid){
      if(pkg.order.kind === 'full' && finalPiece !== 'foldover'){
        const p = PIECES.find(x => x.id === finalPiece);
        // both postcard sizes add $1 to either choice that has the postcard
        const one = money(PRICE.single + (finalPiece === 'postcard' && pkg.order.size === 'both' ? 100 : 0)), all = money(PRICE.full + (pkg.order.size === 'both' ? 100 : 0));
        const v = await ask(`<h2>Just need this ${p.short}?</h2><p>Get it alone for ${one}, or the full package for ${all}.</p>`,
          [[`Just this ${p.short}, ${one}`, 'single'], [`The full package, ${all}`, 'full', 'line'], ['Cancel', 'cancel', 'line']]);
        if(v === 'cancel' || !v) return;
        if(v === 'single'){ pkg.order = Object.assign({}, pkg.order, {kind: 'single', piece: finalPiece}); }
      }
      if(!await checkout()) return;
    }
    await approved();
  };
  async function approved(){
    pkg.approvals[finalPiece] = new Date().toISOString();
    await keepPrint(finalPiece);
    store.event(pkg.id, 'approve', {piece: finalPiece, edits: pkg.edits || 0});
    await save(true);
    const justPaid = pkg.paid && Object.keys(pkg.approvals).length === 1;
    if(pkg.paid) await deliver(finalPiece);
    if(justPaid) await offerColoring();
    const rest = piecesOf(pkg).filter(id => !pkg.approvals[id]);
    if(justPaid && rest.length) return otherPieces(rest);
    if(rest.length) return openFinal(rest[0]);
    openFinal(finalPiece);
  }
  // signed in: Stripe's own checkout page. The piece being approved waits in pkg.checkout until the agent comes back
  // (backFromCheckout); the browser-only test keeps the stand-in below.
  // the price as the checkout function sets it: the package, plus $1 for the postcard in both sizes
  const bothSizes = p => p.order.size === 'both' && (p.order.kind !== 'single' || p.order.piece === 'postcard');
  async function checkout(){
    const extra = bothSizes(pkg) ? 100 : 0, c = PRICE[pkg.order.kind] + extra;
    const what = pkg.order.kind === 'single' ? pieceLabel(pkg.order.piece) : KIND_LABEL[pkg.order.kind];
    const line = `<p>${esc(what)}${extra ? ', postcard in both sizes' : ''} for ${esc(pkg.listing.address)}, in ${esc((designs.find(d => d.id === pkg.design) || {}).name || pkg.design)}.</p>`;
    if(!localMode){
      const credits = window.Account && pkg.order.kind === 'full' ? await Account.credits().catch(() => 0) : 0;
      const btns = credits > 0 ? [[`Use a 5-pack credit${extra ? ` (+${money(extra)})` : ''}`, 'credit'], [`Pay ${money(c)}`, 'pay', 'line'], ['Cancel', 'cancel', 'line']]
        : [[`Pay ${money(c)}`, 'pay'], ['Cancel', 'cancel', 'line']];
      const v = await ask(`<h2>Order: ${money(c)}</h2>${line}${credits > 0 ? `<p>You have ${credits} 5-pack credit${credits === 1 ? '' : 's'} left.</p>` : ''}
        <p class="fine">${credits > 0 && !extra ? 'A credit covers it with nothing to pay. Otherwise you' : 'You'}'ll pay on Stripe's secure checkout page, then come right back here.</p>`, btns);
      if(v !== 'pay' && v !== 'credit') return false;
      pkg.checkout = {piece: finalPiece, at: new Date().toISOString()};
      pkg.brandAtOrder = brandKit();
      await save(true);
      const r = await callCheckout({action: 'start', packageId: pkg.id, back: location.pathname, useCredit: v === 'credit'});
      if(r.url){ location.href = r.url; return false; }
      if(r.paid){ pkg.paid = r.paid; return true; }
      await ask(`<h2>Checkout isn't open yet</h2><p>${r.error === 'account-hold' ? 'New orders are paused on your account. Email support@brochuredesk.com and we\'ll sort it out.' : r.error === 'not-configured' || r.error === 'live-off' ? "Payments aren't switched on yet. Nothing was charged." : "We couldn't open checkout. Nothing was charged. Try again in a minute."}</p>`, [['OK', 'ok']]);
      return false;
    }
    const v = await ask(`<h2>Order: ${money(c)}</h2>${line}
      <p class="fine"><b>Test checkout:</b> no card is charged. Signed in, this step is Stripe.</p>`, [[`Pay ${money(c)} (test)`, 'pay'], ['Cancel', 'cancel', 'line']]);
    if(v !== 'pay') return false;
    pkg.paid = {at: new Date().toISOString(), cents: c, kind: pkg.order.kind, test: true, ...(extra ? {extras: {bothSizes: true}} : {})};
    pkg.brandAtOrder = brandKit();
    pkg.stage = 'ordered';
    store.event(pkg.id, 'order', {cents: c, kind: pkg.order.kind, piece: pkg.order.piece, test: true});
    save(true);
    return true;
  }
  async function callCheckout(body){
    try {
      const {data} = await sb.auth.getSession();
      const r = await fetch(FN_CHECKOUT, {method: 'POST', headers: {'content-type': 'application/json', apikey: SUPABASE_KEY,
        authorization: 'Bearer ' + (data.session ? data.session.access_token : '')}, body: JSON.stringify(body)});
      return await r.json();
    } catch(e) { console.warn(e); return {error: 'network'}; }
  }
  // back from Stripe (?checkout=<session id>, or ?checkout=cancel): confirm the payment, then finish the approval
  // the agent started; the webhook records it too, whichever comes first
  async function backFromCheckout(){
    const q = new URLSearchParams(location.search), sid = q.get('checkout');
    if(!sid || localMode) return false;
    history.replaceState(null, '', location.pathname + location.hash);
    const list = await store.list().catch(() => []);
    if(sid === 'cancel'){
      const p = list.find(x => x.id === lget('bd-current', null));
      if(!p) return false;
      await openPackage(p, 'final', p.checkout && p.checkout.piece);
      return true;
    }
    let r = {};
    for(let i = 0; i < 4 && !r.ok; i++){ r = await callCheckout({action: 'confirm', sessionId: sid}); if(!r.ok) await new Promise(res => setTimeout(res, 1500)); }
    if(r.ok && r.paid && r.paid.kind === 'pack5'){   // the 5-pack: no package, back to Agent home
      await openHome();
      await ask('<h2>Your 5-pack is ready</h2><p>Five full packages at $20 each. When you order a full package, pick "Use a 5-pack credit".</p>', [['OK', 'ok']]);
      return true;
    }
    const p = list.find(x => x.id === (r.packageId || lget('bd-current', null)));
    if(!p) return false;
    if(!r.ok){
      await openPackage(p, 'final');
      await ask("<h2>We're still checking your payment</h2><p>Stripe hasn't confirmed it yet. Refresh this page in a minute. If you were charged and it still doesn't show, email support@brochuredesk.com.</p>", [['OK', 'ok']]);
      return true;
    }
    p.paid = r.paid; p.stage = 'ordered';
    const piece = p.checkout && p.checkout.piece; delete p.checkout;
    await openPackage(p, 'final', piece);
    if(piece) await approved();
    else save(true);
    return true;
  }
  async function deliver(lid){
    if(pkg.paid && await keepPrint(lid)) await save(true);
    const short = (PIECES.find(x => x.id === lid) || {short: 'piece'}).short;
    const v = await ask(`<h2>Your ${esc(short)} is approved</h2><p>Where should it go?</p>`,
      [['Upload it to my printer now', 'printer'], ...(localMode && lid === 'foldover' ? [['Email me the PDF', 'email', 'line']] : []), ['Download it', 'download', 'line']], true);
    if(!v) return;
    pkg.delivery[lid] = {how: v, at: new Date().toISOString()};
    store.event(pkg.id, 'delivery', {piece: lid, how: v});
    save();
    if(v === 'printer') await toPrinter(lid);
    if(v === 'email') await ask(`<h2>Emailing your PDF</h2><p class="fine"><b>Test:</b> nothing is sent from the test drive. On the live site the print PDF goes to ${esc((profile && profile.preferred_email) || (me && me.email) || 'your email')}.</p>`, [['OK', 'ok']]);
    if(v === 'download') await printPiece(lid);
  }
  // coloring page (owner 11/1/2026): every order gets one kids' coloring page, traced on the server from the main front photo
  // (BrochureDesk renderer/order_worker.py + coloring.py, order_files piece 'coloring-page'); offered once, right after
  // the order, and any time after from the "Coloring page" link beside "Printer or download"
  async function offerColoring(){
    const v = await ask(`<h2>Your coloring page</h2><p>We're tracing your front photo into a coloring page, with ${esc(pkg.listing.address)} in big letters to color in.</p>
      ${localMode ? `<p class="fine"><b>Test:</b> signed in, it's made from your main front photo. Here you get the 2614 Calder Street sample.</p>` : ''}`,
      [['Download it', 'download'], ['Later', 'later', 'line']]);
    pkg.delivery.coloring = {how: v || 'later', at: new Date().toISOString()};
    store.event(pkg.id, 'delivery', {piece: 'coloring-page', how: v || 'later'});
    save();
    if(v === 'download') await coloringPage();
  }
  async function coloringPage(){
    if(localMode) return void window.open('../img/coloring-page-sample.pdf', '_blank', 'noopener');
    return serverFiles('coloring-page');
  }
  // ---------- printer upload: pick the printer (remembered), then the live upload panel when we can upload there ----------
  async function pickPrinter(){
    const last = lget('bd-printer', null);
    const v = await ask(`<h2>Which printer?</h2><p class="fine">We'll remember it for next time.</p>
      <label class="fine" for="prSel">Printer</label>
      <select id="prSel">${PRINTERS.map(([id, n]) => `<option value="${id}"${last && last.id === id ? ' selected' : ''}>${n}</option>`).join('')}
        <option value="other"${last && last.id === 'other' ? ' selected' : ''}>Other</option></select>
      <div id="prOtherBox"${last && last.id === 'other' ? '' : ' hidden'}><label class="fine" for="prOther">Printer's name</label>
        <input id="prOther" list="prList" autocomplete="off" value="${esc(last && last.id === 'other' ? last.name : '')}"><datalist id="prList">${PRINTERS.map(([, n]) => `<option value="${n}">`).join('')}</datalist></div>
      <p class="warn" id="prBleed" role="status"></p>
      <p class="err" id="prErr"></p>`, [['Continue', 'go'], ['Cancel', 'cancel', 'line']], false, () => {
        const bleed = () => { $('#prBleed').innerHTML = noBleedNote($('#prSel').value); };
        bleed();
        $('#prSel').onchange = () => { $('#prOtherBox').hidden = $('#prSel').value !== 'other'; if(!$('#prOtherBox').hidden) $('#prOther').focus(); bleed(); };
      });
    if(v !== 'go') return null;
    let id = $('#prSel').value, name = id === 'other' ? $('#prOther').value.trim() : PRINTERS.find(p => p[0] === id)[1];
    const known = PRINTERS.find(p => p[1].toLowerCase() === (name || '').toLowerCase());   // typed a printer we know
    if(id === 'other' && known){ id = known[0]; name = known[1]; }
    if(!name) return pickPrinter();
    const pr = {id, name};
    lput('bd-printer', pr);
    store.event(pkg.id, 'delivery', {printer: id === 'other' ? 'other:' + name.slice(0, 60) : id});
    return pr;
  }
  async function toPrinter(piece){
    const pr = await pickPrinter(); if(!pr) return;
    let can = {printers: [], pieces: {}};
    if(pr.id !== 'other') try { can = await fetch(UPLOAD_RUNNER + '/printers').then(r => r.json()); } catch(e) {}
    const covers = (can.pieces || {})[pr.id];      // the pieces this printer's recipe uploads (none listed = all)
    const sizes = ((can.sizes || {})[pr.id] || {})[piece];   // postcard sizes this printer takes, when not all (PsPrint: 6x11)
    const z = piece === 'just-sold' ? (pkg.sold || {}).size || pkg.order.size : pkg.order.size;
    const want = piece === 'postcard' || piece === 'just-sold' ? (z === 'both' ? ['6x9', '6x11'] : [z]) : [];
    const ready = (can.printers || []).includes(pr.id) && (!covers || covers.includes(piece)) && (!sizes || want.every(z => sizes.includes(z)));
    if(!ready){
      const v = await ask(`<h2>Download for ${esc(pr.name)}</h2><p>We can't upload to ${esc(pr.name)} for you yet. Download the print file and add it to your ${esc(pr.name)} order yourself.</p>`,
        [['Download it', 'dl'], ['Not now', 'no', 'line']]);
      if(v === 'dl') await printPiece(piece);
      return;
    }
    const {data} = sb ? await sb.auth.getSession() : {data: {}};
    const token = data.session ? data.session.access_token : '';
    // the upload server makes the print files first (uploader/printmaker.py: POST /print), then uploads them
    await ask(`<h2>Making your print files</h2><p>This takes a minute or two. Keep this page open.</p>`, [['OK', 'ok']]);
    let made = {};
    try { made = await fetch(UPLOAD_RUNNER + '/print', {method: 'POST', headers: {'content-type': 'application/json', authorization: 'Bearer ' + token},
      body: JSON.stringify({packageId: pkg.id, printer: pr.id, pieces: [piece]})}).then(r => r.json()); } catch(e) { made = {error: 'network'}; }
    // every file made for this piece goes; the printer's recipe picks its own (one per side, both postcard sizes)
    const files = made.ok ? Object.assign({}, made.files) : {};
    if(!Object.keys(files).length){
      const v = await ask(`<h2>We couldn't make the print file</h2><p>${made.problems && made.problems.length ? esc(made.problems.join(' ')) : 'Something went wrong on our side. Nothing was sent to the printer.'}</p>`,
        [['Download it instead', 'dl'], ['Not now', 'no', 'line']]);
      if(v === 'dl') await printPiece(piece);
      return;
    }
    const outcome = await UploadPanel.open({runner: UPLOAD_RUNNER, token, printer: pr.id, name: pr.name,
      files, vars: {size: piece === 'foldover' ? '11x17' : piece === 'postcard' || piece === 'just-sold' ? z : '8.5x11'}, onDownload: () => printPiece(piece)});
    store.event(pkg.id, 'delivery', {printer: pr.id, upload: outcome});
  }
  // ---------- paid print files (audit repair R1, 11/2/2026) ----------
  // What the server renders: the design, its template parts and the proof data exactly as approved, with the listing's
  // own photo links in place of this browser's small copies (the server fetches them at full size).
  async function printSnapshot(lid){
    const S = await spec(pkg.design); S.design = pkg.design;
    const parts = [...new Set((partsFor(S, lid, pkg) || []).map(x => x.piece.id))];
    const data = await dataFor(pkg.design, true);
    arrangement(pkg, pkg.design).forEach(i => { if(data.photos['p' + i]) data.photos['p' + i].src = pkg.photos[i].url; });
    const clean = v => typeof v === 'string' ? (v.startsWith('blob:') ? null : v) : Array.isArray(v) ? v.map(clean)
      : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)])) : v;
    return {at: new Date().toISOString(), design: pkg.design, parts, data: clean(data)};
  }
  // the proof as it stands is what gets printed: kept at approval, and again whenever the agent asks for the file, so
  // small fixes and open house updates after approval reach the print file (an unchanged proof isn't made again)
  async function keepPrint(lid){
    try { pkg.print = Object.assign({}, pkg.print, {[lid]: await printSnapshot(lid)}); return true; }
    catch(e) { console.warn(e); store.event(pkg.id, 'print-snapshot-failed', {piece: lid}); return false; }
  }
  async function callFiles(body){
    try {
      const {data} = await sb.auth.getSession();
      const r = await fetch(FN_FILES, {method: 'POST', headers: {'content-type': 'application/json', apikey: SUPABASE_KEY,
        authorization: 'Bearer ' + (data.session ? data.session.access_token : '')}, body: JSON.stringify(body)});
      return await r.json();
    } catch(e) { console.warn(e); return {error: 'network'}; }
  }
  // a dialog with no buttons while we wait; Escape closes it and stops the wait
  function waitBox(html){
    const dlg = $('#dlg'); if(dlg.open) dlg.close();
    $('#dlgBody').innerHTML = html;
    const box = {stopped: false, close(){ box.stopped = true; if(dlg.open) dlg.close(); }};
    dlg.oncancel = e => { e.preventDefault(); box.close(); };
    dlg.showModal();
    return box;
  }
  const FILE_LABEL = {'print-download.pdf': 'Print file', 'email-download.pdf': 'Print-at-home copy', 'coloring.pdf': 'Coloring page'};
  async function serverFiles(lid){
    const coloring = lid === 'coloring-page';
    const short = coloring ? 'coloring page' : (PIECES.find(x => x.id === lid) || {short: 'piece'}).short;
    const box = waitBox(coloring
      ? `<h2>Making your coloring page</h2><p>We're tracing your front photo and checking the lines. This usually takes a minute or two.</p><progress aria-label="Making your coloring page"></progress>`
      : `<h2>Making your print file</h2><p>We're setting your ${esc(short)} at full print size and checking every page.
      This usually takes two or three minutes.</p><progress aria-label="Making your print file"></progress>`);
    for(let i = 0; i < 60 && !box.stopped; i++){
      const r = await callFiles({action: 'status', packageId: pkg.id});
      const s = r.pieces && r.pieces[lid];
      if(box.stopped) return;
      if(r.error || !r.pieces){ box.close(); return void await ask(`<h2>We couldn't reach your files</h2><p>Nothing is lost. Try again in a minute, or find them under your orders.</p>`, [['OK', 'ok']]); }
      if(!s){ box.close(); return void await ask(`<h2>Not part of this order</h2><p>Your ${esc(short)} isn't in what you paid for. Nothing was charged.</p>`, [['OK', 'ok']]); }
      if(s.status === 'ready'){
        box.close();
        const links = Object.entries(s.links || {}).map(([name, url]) => {
          const file = name.split('/').pop(), part = name.split('/')[0];
          const side = /-(front|back)$/.test(part) && !coloring ? ` (${part.split('-').pop()})` : '';
          return `<p><a class="btn" href="${esc(url)}" target="_blank" rel="noopener" download>${esc((FILE_LABEL[file] || 'File') + side)}</a></p>`;
        }).join('');
        store.event(pkg.id, 'download', {piece: lid});
        // photos under 200 ppi at print size ship with a note (owner 11/2/2026, photo floor); wording a draft
        const n = (s.warnings || []).length;
        const soft = n ? `<p class="fine">${n === 1 ? 'One photo is' : n + ' photos are'} lower resolution than we'd like at this size and may print a little soft. A larger copy of ${n === 1 ? 'that photo' : 'those photos'} fixes it.</p>` : '';
        return void await ask(`<h2>Your ${esc(short)} is ready</h2><p>${coloring ? '8.5 x 11, ready to print at home or hand to your printer.' : 'Full print size, checked page by page.'}</p>${soft}${links}
          <p class="fine">These links work for 10 minutes. You can download again any time from your orders.</p>`, [['Done', 'ok', 'line']]);
      }
      if(coloring && s.status === 'held'){
        box.close();
        return void await ask(`<h2>No coloring page for this one</h2><p>We couldn't get clean lines from your front photos (trees or cars in front of the house usually cause it), so we left it out rather than send you a messy page.</p>`, [['OK', 'ok']]);
      }
      if(s.status === 'held' || s.status === 'failed'){
        box.close();
        return void await ask(`<h2>One of us is checking your ${esc(short)}</h2><p>Something on it needs a person's eye before it prints.
          It'll be ready to download from your orders, usually within one business day. Nothing more to do on your side.</p>`, [['OK', 'ok']]);
      }
      await new Promise(res => setTimeout(res, 6000));
    }
    if(box.stopped) return;
    box.close();
    await ask(`<h2>Still making it</h2><p>Your ${esc(short)} is taking longer than usual. It'll be under your orders, ready to download, as soon as it's done.</p>`, [['OK', 'ok']]);
  }
  // download: signed in, the server's checked print file; the browser-only test opens the browser's print box instead
  async function printPiece(lid){
    if(!localMode) return serverFiles(lid);
    const S = await spec(pkg.design); S.design = pkg.design;
    const pt = partsFor(S, lid, pkg)[0];
    const data = Object.assign(await dataFor(pkg.design, true), pt.piece.kind === 'foldover' ? {mode: 'proof'} : {mode: 'email', piece: pt.piece});
    if(data.preview || data.planPreview || PT.isPreview(JSON.stringify([data.copy, data.companion]))){
      await ask('<h2>Not ready to download</h2><p>This piece still has rough-draft text. Finalize the design first.</p>', [['OK', 'ok', 'line']]); return; }
    const fold = pt.piece.kind === 'foldover';
    const html = srcdoc(pkg.design, await tpl(pkg.design, pt.piece.file), data, null, true, fold)
      .replace('</head>', '<style>@media print{body{margin:0}.page{margin:0!important;box-shadow:none!important;break-after:page}}</style></head>');
    document.querySelectorAll('iframe.bd-print').forEach(f => f.remove());
    const fr = document.createElement('iframe');
    fr.className = 'bd-print'; fr.setAttribute('aria-hidden', 'true');
    fr.style.cssText = 'position:fixed;left:-10000px;top:0;width:1200px;height:900px;border:0';
    fr.onload = () => Promise.resolve(fr.contentWindow.brochureReady)
      .then(() => fr.contentDocument.fonts ? fr.contentDocument.fonts.ready : 0)
      .then(() => { if(fold && data.colors && fr.contentWindow.FoldColors) fr.contentWindow.FoldColors.apply(data.colors, pt.piece.colors || {}); })
      .then(() => setTimeout(() => fr.contentWindow.print(), 300));
    document.body.appendChild(fr);
    fr.srcdoc = html;
  }
  async function otherPieces(rest){
    const S = await spec(pkg.design); S.design = pkg.design;
    const v = await ask(`<h2>Ready to review and tweak your other marketing pieces?</h2><p>The rest of your package, in the same design:</p><div class="minirow" id="restMinis"></div>`,
      [['Review them now', 'now'], ['Later', 'later', 'line']], false, async () => {
        const box = $('#restMinis');
        drawParts(box, pkg.design, rest.map(id => Object.assign({}, partsFor(S, id, pkg)[0], {label: pieceLabel(id)})), await dataFor(pkg.design, true));
        setTimeout(() => box.querySelectorAll('figcaption').forEach((c, i) => c.textContent = pieceLabel(rest[i])), 50);
      });
    if(v === 'now') return openFinal(rest[0]);
    store.event(pkg.id, 'later', {waiting: rest});
    openHome();
  }

  // ---------- small dialog helper ----------
  function ask(html, buttons, column, after){
    const dlg = $('#dlg'), body = $('#dlgBody');
    body.innerHTML = html + `<div class="${column ? 'opts' : 'acts'}">${buttons.map(([t, v, cls]) => `<button type="button" class="btn ${cls || ''}" value="${v}">${esc(t)}</button>`).join('')}</div>`;
    return new Promise(res => {
      let done = false;
      const finish = v => { if(done) return; done = true; if(dlg.open) dlg.close(); res(v); };
      body.querySelectorAll('button[value]').forEach(b => b.onclick = () => finish(b.value));
      dlg.oncancel = e => { e.preventDefault(); finish(null); };   // Escape
      dlg.showModal();
      if(after) after();
    });
  }

  window.addEventListener('hashchange', () => {
    const h = location.hash.slice(1);
    if(h === 'home') openHome();
    else if(h === 'start') openStart();
  });
  boot().catch(e => { console.error(e); show('vSignin'); });
})();
