/* BrochureDesk site measurement and cookie notice (owner 11/14/2026, item N2611141950).
 * PostHog, free plan, matching what /privacy/ promises:
 *  - no tracking or recording at all when the browser sends Do Not Track (or Global Privacy Control),
 *    or when cookies or storage are blocked;
 *  - session recordings mask every typed field (inputs, text boxes, selects, the proof editor's editable text)
 *    and never record payment parts of the page (Stripe frames, anything marked data-payment);
 *  - no ad cookies, no ad pixels, no person profiles (events stay anonymous; we never send names or emails).
 * KEY is PostHog's public, write-only project key (safe in page code); empty it to turn tracking off.
 * Pages call window.bdTrack(event, props) for steps; it does nothing when tracking is off.
 */
(function(){
  'use strict';
  var KEY = 'phc_AkDA7iNGxY3qpVgBumBHakFxyd4iiLTUtMnKY7pDikyo';   // PostHog public project key (US cloud, free plan); '' = tracking off
  var HOST = 'https://us.i.posthog.com';
  var LIB = 'https://cdn.jsdelivr.net/npm/posthog-js@1.440.0/dist/array.full.js';
  var NOTICE = 'bd-cookie-notice';

  function storageOk(){
    try {
      if(navigator.cookieEnabled === false) return false;
      localStorage.setItem('bd-st', '1'); localStorage.removeItem('bd-st');
      document.cookie = 'bd_ck=1; path=/; SameSite=Lax';
      var ok = document.cookie.indexOf('bd_ck=1') !== -1;
      document.cookie = 'bd_ck=; path=/; max-age=0; SameSite=Lax';
      return ok;
    } catch(e) { return false; }
  }
  function dnt(){
    var v = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    return v === '1' || v === 'yes' || navigator.globalPrivacyControl === true;
  }
  var allowed = !!KEY && !dnt() && storageOk();
  var queue = [];
  // only plain numbers, true/false and short labels go out; never typed text, names, emails or addresses
  function clean(props){
    var out = {};
    for(var k in props || {}){
      var v = props[k];
      if(typeof v === 'number' || typeof v === 'boolean') out[k] = v;
      else if(typeof v === 'string' && /^[\w .:\/-]{1,40}$/.test(v) && !/@/.test(v) && !/\d{3,}.*[a-z]/i.test(v)) out[k] = v;
    }
    return out;
  }
  window.bdTrack = function(event, props){
    if(!allowed || !/^[\w-]{1,60}$/.test(event || '')) return;
    if(window.posthog && window.posthog.__loaded) window.posthog.capture(event, clean(props));
    else queue.push([event, clean(props)]);
  };
  window.bdTracking = function(){ return allowed; };

  if(allowed){
    var s = document.createElement('script');
    s.src = LIB; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = function(){
      if(!window.posthog) return;
      window.posthog.init(KEY, {
        api_host: HOST,
        respect_dnt: true,
        person_profiles: 'never',
        persistence: 'localStorage+cookie',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: {dom_event_allowlist: ['click', 'submit'], element_allowlist: ['a', 'button', 'form']},
        mask_all_element_attributes: true,
        disable_surveys: true,
        enable_recording_console_log: false,           // our console notes can hold file paths; not recorded
        advanced_disable_feature_flags: true,
        disable_external_dependency_loading: true,      // the recorder ships in array.full.js; nothing else is fetched
        session_recording: {
          maskAllInputs: true,
          maskInputOptions: {password: true, email: true, tel: true, text: true, textarea: true, select: true, number: true, search: true, url: true, date: true},
          maskTextSelector: '[contenteditable], [data-ph-mask], #who, .who',
          blockSelector: 'iframe[src*="stripe.com"], iframe[name^="__privateStripe"], .StripeElement, [data-payment], [data-ph-block]',
          recordCrossOriginIframes: false,
          recordHeaders: false,
          recordBody: false
        },
        loaded: function(ph){ queue.splice(0).forEach(function(e){ ph.capture(e[0], e[1]); }); }
      });
    };
    document.head.appendChild(s);
  }

  // ---------- the cookie notice: one slim line, dismissible, never blocks the page ----------
  function seen(){ try { return localStorage.getItem(NOTICE) === '1'; } catch(e) { return false; } }
  function notice(){
    if(seen() || document.getElementById('bdCookie')) return;
    var st = document.createElement('style');
    st.textContent = '#bdCookie{position:fixed;left:12px;bottom:12px;z-index:45;max-width:min(560px,calc(100vw - 24px));display:flex;align-items:center;gap:12px;'
      + 'padding:8px 8px 8px 14px;background:rgba(20,19,18,.94);color:#f1ede4;border:1px solid rgba(241,237,228,.18);border-radius:4px;'
      + 'font:13px/1.4 "Nunito Sans",system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35)}'
      + '#bdCookie a{color:#d8c4a0;text-underline-offset:2px}'
      + '#bdCookie button{flex:none;background:none;border:1px solid rgba(241,237,228,.3);color:inherit;border-radius:3px;padding:5px 10px;font:600 12px/1 inherit;font-family:inherit;cursor:pointer}'
      + '@media (max-width:520px){#bdCookie{left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));max-width:none;font-size:12px}'
      + '#bdCookie.lift{bottom:calc(72px + env(safe-area-inset-bottom,0px))}}'
      + '@media (min-width:521px){#bdCookie.lift{max-width:min(560px,calc(100vw - 170px))}}';
    document.head.appendChild(st);
    var bar = document.createElement('div');
    bar.id = 'bdCookie';
    if(document.querySelector('script[src*="help-bot"]')) bar.className = 'lift';   // stays clear of the Help button bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Cookie notice');
    bar.innerHTML = '<span>We use cookies to see how the site is used and fix problems. No ads, nothing sold. <a href="/privacy/#on-your-device">Privacy</a></span>'
      + '<button type="button" aria-label="Close the cookie notice">OK</button>';
    bar.querySelector('button').onclick = function(){ try { localStorage.setItem(NOTICE, '1'); } catch(e) {} bar.remove(); };
    document.body.appendChild(bar);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', notice); else notice();
})();
