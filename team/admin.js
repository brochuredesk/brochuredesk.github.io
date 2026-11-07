/* Team/Broker home: what a team's admins see at /<team address>/team (product.md, Home screens; 10/31/2026).

     TeamAdmin.mount(ctx)   ctx = {sb, code, team, me, profile, main, nav(path)}, the same as TeamFlow

   Members and invites, who pays, the shared brand kit and its approval, and the last 90 days of team orders and
   spend. Everything comes from database functions that answer only this team's admins (20261031_team_admin.sql);
   invites go out from the team-invite function. Every "team" word follows the record's kind (team | brokerage).
   Wording is a draft for the owner's review. Nothing about any team lives in this file. */
(function(){
  const FN_INVITE = 'https://depwvwewbmxspoxidxrx.supabase.co/functions/v1/team-invite';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = c => '$' + ((c || 0) / 100).toFixed(2).replace(/\.00$/, '');
  const day = d => d ? new Date(d).toLocaleDateString('en-US', {timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric'}) : '';
  const STATUS = {draft: 'Started', building: 'Writing', proof: 'Proof ready', printer: 'At the printer', cart: 'In the cart', paid: 'Paid'};

  async function mount(ctx){
    const main = ctx.main;
    main.innerHTML = '<section class="hello"><h1>Loading…</h1></section>';
    const {data: h, error} = await ctx.sb.rpc('team_admin_home', {p_code: ctx.code});
    if(error || !h){ main.innerHTML = '<section class="hello"><h1>This page isn’t here</h1><p>Only admins can open it.</p></section>'; return; }
    const org = h.kind === 'brokerage' ? 'brokerage' : 'team', Org = org[0].toUpperCase() + org.slice(1);
    const kit = h.kit || {}, approved = !!h.kitApprovedAt, missing = (h.kitMissing || []).concat(kit.brokerage ? [] : ['brokerage name']);
    const uniqMissing = [...new Set(missing)];
    main.innerHTML = `
      <section class="hello"><h1>${esc(Org)} home</h1><p>Members, billing and your ${org}’s brand kit.</p></section>

      <div class="fl-card" id="taKit">
        <h2>Brand kit</h2>
        ${approved ? `<p><span class="pill">Approved</span> ${esc(day(h.kitApprovedAt))}${h.kitApprovedBy ? ' by ' + esc(h.kitApprovedBy) : ''}. Members can order.</p>`
          : `<p>Members can order once you approve the kit their pieces will carry.</p>`}
        <dl class="ta-kit">
          <dt>Brokerage on every piece</dt><dd>${esc(kit.brokerage || 'Not set yet')}</dd>
          <dt>Office</dt><dd>${esc([].concat(kit.address || ctx.team.brand.office || []).join(', ') || 'Not set yet')}${kit.phone || ctx.team.brand.phone ? ', ' + esc(kit.phone || ctx.team.brand.phone) : ''}</dd>
          <dt>Colors</dt><dd class="ta-sw">${(kit.colors && kit.colors.length ? kit.colors.map(c => c.hex) : [ctx.team.brand.primary, ctx.team.brand.deep, ctx.team.brand.ink]).filter(Boolean).map(x => `<span style="background:${esc(x)}" title="${esc(x)}"></span>`).join('')}</dd>
        </dl>
        ${uniqMissing.length ? `<p class="fl-hint">Still missing: ${esc(uniqMissing.join(', '))}. Email <b>support@brochuredesk.com</b> and we’ll add it.</p>` : ''}
        ${approved ? '' : `<div class="row"><button class="btn" type="button" id="taApprove"${kit.brokerage ? '' : ' disabled'}>Approve the brand kit</button></div>`}
        <p class="fl-note" id="taKitNote" role="status"></p>
      </div>

      <div class="fl-card" id="taPays">
        <h2>Who pays</h2>
        <label class="ta-opt"><input type="radio" name="taPays" value="agent"${h.pays === 'agent' ? ' checked' : ''}> <span><b>Each agent pays</b><br>Agents check out on their own card for each package.</span></label>
        <label class="ta-opt"><input type="radio" name="taPays" value="team"${h.pays === 'team' ? ' checked' : ''}> <span><b>The ${esc(org)} pays</b><br>Packages your members order are billed to the ${esc(org)}.</span></label>
        <p class="fl-note" id="taPaysNote" role="status"></p>
      </div>

      <div class="fl-card" id="taMembers">
        <h2>Members</h2>
        <div id="taList"></div>
        <h3>Invite someone</h3>
        <form id="taInvite" class="fl-facts" novalidate>
          <label>First name<input name="first" autocomplete="off" required></label>
          <label>Last name<input name="last" autocomplete="off"></label>
          <label>Email<input name="email" type="email" inputmode="email" autocomplete="off" required></label>
          <label class="half"><span>Role</span><select name="role"><option value="agent">Agent</option><option value="admin">Admin (runs this page)</option></select></label>
          <label class="half"><span>&nbsp;</span><button class="btn" type="submit">Send invite</button></label>
        </form>
        <p class="fl-note" id="taInviteNote" role="status"></p>
      </div>

      <div class="fl-card" id="taOrders">
        <h2>Orders and spend</h2>
        <p>Last 90 days: <b>${h.paidCount}</b> paid ${h.paidCount === 1 ? 'package' : 'packages'}, <b>${money(h.spendCents)}</b>.</p>
        ${h.orders.length ? `<table><thead><tr><th>Listing</th><th>Agent</th><th>Status</th><th>Amount</th></tr></thead><tbody>${h.orders.map(o =>
          `<tr><td><div class="a">${esc(o.address || 'Listing')}</div><div class="s2">${esc(day(o.at))}</div></td><td>${esc(o.by || '')}</td><td><span class="pill">${esc(STATUS[o.status] || o.status)}</span></td><td>${o.cents ? money(o.cents) : ''}</td></tr>`).join('')}</tbody></table>`
          : `<p class="fl-empty">No orders in the last 90 days.</p>`}
      </div>`;

    members(ctx, h.members, org);

    const ap = document.getElementById('taApprove');
    if(ap) ap.onclick = async () => {
      ap.disabled = true;
      const {error} = await ctx.sb.rpc('team_approve_kit', {p_code: ctx.code});
      if(error){ ap.disabled = false; note('taKitNote', 'That didn’t save. Try again in a minute.', true); return; }
      mount(ctx);
    };
    document.querySelectorAll('input[name=taPays]').forEach(r => r.onchange = async () => {
      const {error} = await ctx.sb.rpc('team_set_pays', {p_code: ctx.code, p_pays: r.value});
      note('taPaysNote', error ? 'That didn’t save. Try again in a minute.' : 'Saved.', !!error);
    });
    document.getElementById('taInvite').onsubmit = async e => {
      e.preventDefault();
      const f = e.target, email = f.email.value.trim(), first = f.first.value.trim();
      if(!first || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)){ note('taInviteNote', 'Add a first name and an email address.', true); return; }
      const btn = f.querySelector('button'); btn.disabled = true; note('taInviteNote', 'Sending the invite…');
      const r = await invite(ctx, {email, first, last: f.last.value.trim(), role: f.role.value});
      btn.disabled = false;
      if(!r.ok){ note('taInviteNote', r.error === 'email' ? 'Check that email address.' : 'That invite didn’t go through. Try again in a minute.', true); return; }
      f.reset();
      const {data} = await ctx.sb.rpc('team_admin_home', {p_code: ctx.code});
      if(data) members(ctx, data.members, org);
      note('taInviteNote', r.emailed ? `Invite sent to ${email}.` : `${email} is on the list. The invite email isn’t switched on yet, so we’ll send it as soon as it is.`);
    };
  }

  function members(ctx, list, org){
    const me = (ctx.me.email || '').toLowerCase(), box = document.getElementById('taList');
    box.innerHTML = `<table><thead><tr><th>Name</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>${list.map(m =>
      `<tr data-email="${esc(m.email)}"><td><div class="a">${esc([m.first, m.last].filter(Boolean).join(' ') || m.email)}</div><div class="s2">${esc(m.email)}</div></td>
        <td>${m.role === 'admin' ? 'Admin' : 'Agent'}</td>
        <td><span class="pill">${m.signedIn ? 'Signed in' : 'Invited'}</span></td>
        <td class="ta-acts">${m.signedIn ? '' : `<button type="button" class="fl-a" data-act="resend">Resend invite</button>`}${m.email === me ? '' : `<button type="button" class="fl-a" data-act="remove">Remove</button>`}</td></tr>`).join('')}</tbody></table>`;
    box.onclick = async e => {
      const b = e.target.closest('button[data-act]'); if(!b) return;
      const tr = b.closest('tr'), email = tr.dataset.email, m = list.find(x => x.email === email);
      if(b.dataset.act === 'remove'){
        if(!confirm(`Take ${email} off the ${org}? Their own account and past packages stay theirs.`)) return;
        const {error} = await ctx.sb.rpc('team_remove_member', {p_code: ctx.code, p_email: email});
        if(error){ note('taInviteNote', 'That didn’t save. Try again in a minute.', true); return; }
        tr.remove(); note('taInviteNote', `${email} is off the ${org}.`);
      } else {
        b.disabled = true;
        const r = await invite(ctx, {email, first: m.first || '', last: m.last || '', role: m.role});
        b.disabled = false;
        note('taInviteNote', !r.ok ? 'That invite didn’t go through. Try again in a minute.' : r.emailed ? `Invite sent again to ${email}.` : 'The invite email isn’t switched on yet.', !r.ok);
      }
    };
  }

  async function invite(ctx, m){
    try {
      const {data} = await ctx.sb.auth.getSession();
      const r = await fetch(FN_INVITE, {method: 'POST', headers: {'content-type': 'application/json',
        authorization: 'Bearer ' + (data.session ? data.session.access_token : '')}, body: JSON.stringify(Object.assign({code: ctx.code}, m))});
      return await r.json();
    } catch(e) { return {error: 'network'}; }
  }
  function note(id, text, err){ const n = document.getElementById(id); if(n){ n.textContent = text; n.className = 'fl-note' + (err ? ' err' : ''); } }

  window.TeamAdmin = {mount};
})();
