/* Robo Orion — customer account (phone + OTP signup, password login) via api.roboorion.com
   window.ROAuth = { open(view), logout(), user(), request(path, opts) }   event: "ro:auth" {detail:{user}} */
(function () {
  'use strict';
  if (window.ROAuth) return;                 // loaded twice? keep the first copy
  var API = (window.RO_API_BASE || 'https://api.roboorion.com').replace(/\/$/, '');
  var current = null, modal = null, lastFocus = null, timer = null, notice = '';
  var view = 'login';                       // login | signup | reset | account
  var flow = { step: 'phone', phone: '', proof: '', resendAt: 0 };

  function request(path, opts) {
    opts = opts || {};
    return fetch(API + path, {
      method: opts.method || 'GET', credentials: 'include',
      headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        d.__status = r.status;
        if (d.error && d.error.detail) d.error.message += ' [' + d.error.detail + ']';   // only present while DEBUG_ERRORS=1 is set on the server
        return d;
      });
    });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var INPUT = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30';
  var LABEL = 'mb-1 block text-sm font-medium text-slate-700';
  var BTN = 'w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60';
  var LINK = 'font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline';

  function field(id, label, type, extra, hint) {
    return '<div><label class="' + LABEL + '" for="roauth-' + id + '">' + label + '</label>' +
      '<input id="roauth-' + id + '" name="' + id + '" type="' + type + '" class="' + INPUT + '" ' + (extra || '') + '>' +
      (hint ? '<p class="mt-1 text-xs text-slate-500">' + hint + '</p>' : '') + '</div>';
  }
  var ERR = '<p id="roauth-err" class="min-h-[1.25rem] text-sm text-red-600" role="alert" aria-live="polite"></p>';

  /* ---------- screens ---------- */
  function screen() {
    if (current) return { title: 'My account', html: accountHtml() };
    if (view === 'login') return { title: 'Log in', html:
      '<form id="roauth-form" class="space-y-3" novalidate>' +
      field('identifier', 'Mobile number', 'text', 'autocomplete="username" inputmode="tel" required placeholder="01712345678"') +
      field('password', 'Password', 'password', 'autocomplete="current-password" required maxlength="128"') + ERR +
      '<button class="' + BTN + '" type="submit">Log in</button></form>' +
      '<p class="mt-3 text-center text-sm"><button type="button" data-go="reset" class="' + LINK + '">Forgot password?</button></p>' +
      '<p class="mt-2 text-center text-sm text-slate-600">New to Robo Orion? <button type="button" data-go="signup" class="' + LINK + '">Create an account</button></p>' };

    var isSignup = view === 'signup';
    if (flow.step === 'phone') return { title: isSignup ? 'Create your account' : 'Reset your password', html:
      '<form id="roauth-form" class="space-y-3" novalidate>' +
      '<p class="text-sm text-slate-600">' + (isSignup ? 'Enter your mobile number. We will send you a 6-digit code by SMS.' : 'Enter the mobile number of your account. We will send you a 6-digit code.') + '</p>' +
      field('phone', 'Mobile number', 'tel', 'autocomplete="tel" inputmode="tel" required placeholder="01712345678"') + ERR +
      '<button class="' + BTN + '" type="submit">Send code</button></form>' +
      '<p class="mt-4 text-center text-sm text-slate-600">' + (isSignup ? 'Already have an account? ' : 'Remembered it? ') + '<button type="button" data-go="login" class="' + LINK + '">Log in</button></p>' };

    if (flow.step === 'otp') return { title: 'Enter the code', html:
      '<form id="roauth-form" class="space-y-3" novalidate>' +
      '<p class="text-sm text-slate-600">We sent a 6-digit code to <b>' + esc(flow.phone) + '</b>.</p>' +
      field('code', 'Verification code', 'text', 'autocomplete="one-time-code" inputmode="numeric" maxlength="6" pattern="[0-9]*" required placeholder="123456"') + ERR +
      '<button class="' + BTN + '" type="submit">Verify</button></form>' +
      '<p class="mt-4 flex justify-between text-sm"><button type="button" id="roauth-resend" class="' + LINK + '" disabled>Resend code</button>' +
      '<button type="button" data-step="phone" class="' + LINK + '">Change number</button></p>' };

    return { title: isSignup ? 'Almost done' : 'Choose a new password', html:
      '<form id="roauth-form" class="space-y-3" novalidate>' +
      '<p class="text-sm text-emerald-700">&#10003; ' + esc(flow.phone) + ' verified</p>' +
      (isSignup ? field('name', 'Full name', 'text', 'autocomplete="name" required maxlength="80"') : '') +
      field('password', isSignup ? 'Create a password' : 'New password', 'password', 'autocomplete="new-password" required minlength="8" maxlength="128"', 'At least 8 characters') + ERR +
      '<button class="' + BTN + '" type="submit">' + (isSignup ? 'Create account' : 'Save password') + '</button></form>' };
  }

  function accountHtml() {
    return '<div class="space-y-4"><div class="rounded-lg bg-slate-50 p-4"><p class="font-semibold text-slate-900">' + esc(current.name) + '</p>' +
      (current.phone ? '<p class="text-sm text-slate-600">' + esc(current.phone) + '</p>' : '') +
      (current.email ? '<p class="text-sm text-slate-600">' + esc(current.email) + '</p>' : '') + '</div>' +
      (current.role === 'admin' ? '<a href="' + API + '/admin" class="block w-full rounded-lg border border-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50">Open admin panel</a>' : '') +
      '<div><h3 class="mb-2 text-sm font-semibold text-slate-900">Order history</h3><div id="roauth-orders" class="max-h-56 space-y-2 overflow-y-auto text-sm text-slate-500">Loading…</div></div>' +
      '<button type="button" id="roauth-logout" class="' + BTN + '">Log out</button></div>';
  }

  function loadOrders() {
    var box = modal.querySelector('#roauth-orders'); if (!box || !current) return;
    request('/api/me/orders').then(function (d) {
      if (!box.isConnected) return;
      if (!d.orders) { box.textContent = 'Could not load your orders.'; return; }
      if (!d.orders.length) { box.textContent = 'No orders yet.'; return; }
      box.innerHTML = d.orders.map(function (o) {
        var n = (o.items || []).reduce(function (t, i) { return t + (i.qty || 0); }, 0);
        return '<div class="rounded-lg border border-slate-200 p-3 text-slate-700"><div class="flex justify-between font-medium"><span>#' + esc(o.order_no) + '</span><span>৳' + Number(o.total).toLocaleString('en-US') + '</span></div>' +
          '<div class="mt-0.5 flex justify-between text-xs text-slate-500"><span>' + new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + n + ' item' + (n === 1 ? '' : 's') + '</span><span class="capitalize">' + esc(o.status) + '</span></div></div>';
      }).join('');
    }).catch(function () { box.textContent = 'Could not load your orders.'; });
  }

  /* ---------- behaviour ---------- */
  function render() {
    clearInterval(timer);
    var s = screen();
    modal.querySelector('[data-roauth-body]').innerHTML = '<h2 id="roauth-title" class="mb-4 text-lg font-bold text-slate-900">' + s.title + '</h2>' +
      (notice && !current ? '<div class="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">' + esc(notice) + '</div>' : '') + s.html;
    bind();
    if (current) loadOrders();
    if (!current && view !== 'login' && flow.step === 'otp') startCountdown();
  }

  function startCountdown() {
    var b = modal.querySelector('#roauth-resend'); if (!b) return;
    function tick() {
      var left = Math.ceil((flow.resendAt - Date.now()) / 1000);
      if (left > 0) { b.disabled = true; b.textContent = 'Resend code in ' + left + 's'; }
      else { b.disabled = false; b.textContent = 'Resend code'; clearInterval(timer); }
    }
    tick(); timer = setInterval(tick, 500);
  }

  function go(v) { view = v; flow = { step: 'phone', phone: '', proof: '', resendAt: 0 }; render(); focusFirst(); }

  function bind() {
    Array.prototype.forEach.call(modal.querySelectorAll('[data-go]'), function (b) { b.onclick = function () { go(b.getAttribute('data-go')); }; });
    Array.prototype.forEach.call(modal.querySelectorAll('[data-step]'), function (b) { b.onclick = function () { flow.step = b.getAttribute('data-step'); render(); focusFirst(); }; });
    var lo = modal.querySelector('#roauth-logout'); if (lo) lo.onclick = function () { lo.disabled = true; logout().then(close); };
    var rs = modal.querySelector('#roauth-resend'); if (rs) rs.onclick = function () { sendCode(rs); };
    var form = modal.querySelector('#roauth-form'); if (form) form.onsubmit = function (e) { e.preventDefault(); submit(form); };
  }

  function sendCode(btn) {
    var err = modal.querySelector('#roauth-err'); if (btn) btn.disabled = true;
    return request('/api/auth/otp-send', { method: 'POST', body: { phone: flow.phone, purpose: view === 'signup' ? 'signup' : 'reset' } }).then(function (d) {
      if (d.ok) { flow.step = 'otp'; flow.resendAt = Date.now() + (d.resendAfter || 60) * 1000; render(); focusFirst(); }
      else { var m = (d.error && d.error.message) || 'Could not send the code.'; if (err) err.textContent = m; if (btn) btn.disabled = false; if (!err) alertInline(m); }
    }).catch(function () { var m = 'Network error. Check your connection and try again.'; if (err) err.textContent = m; if (btn) btn.disabled = false; });
  }
  function alertInline(m) { var e = modal.querySelector('#roauth-err'); if (e) e.textContent = m; }

  function submit(form) {
    var err = form.querySelector('#roauth-err'), btn = form.querySelector('button[type=submit]');
    var v = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name) v[el.name] = el.value.trim ? (el.name === 'password' ? el.value : el.value.trim()) : el.value; });
    err.textContent = ''; btn.disabled = true;
    var fail = function (m) { err.textContent = m; btn.disabled = false; };
    var net = function () { fail('Network error. Check your connection and try again.'); };

    if (view === 'login') {
      if (!v.identifier || !v.password) return fail('Enter your number and password.');
      return request('/api/auth/login', { method: 'POST', body: { identifier: v.identifier, password: v.password } }).then(function (d) {
        if (!d.user) return fail((d.error && d.error.message) || 'Could not log in.');
        if (d.mustSetup) { location.href = API + '/admin'; return; }          // default admin: finish setup first
        setUser(d.user); close();
      }).catch(net);
    }
    if (flow.step === 'phone') {
      if (!v.phone) return fail('Enter your mobile number.');
      flow.phone = v.phone; return sendCode(btn);
    }
    if (flow.step === 'otp') {
      if (!/^\d{6}$/.test(v.code || '')) return fail('Enter the 6-digit code.');
      return request('/api/auth/otp-verify', { method: 'POST', body: { phone: flow.phone, purpose: view === 'signup' ? 'signup' : 'reset', code: v.code } }).then(function (d) {
        if (d.proof) { flow.proof = d.proof; flow.step = 'details'; render(); focusFirst(); }
        else fail((d.error && d.error.message) || 'Incorrect code.');
      }).catch(net);
    }
    // details
    if (view === 'signup' && (!v.name || v.name.length < 2)) return fail('Enter your full name.');
    if (!v.password || v.password.length < 8) return fail('Password must be at least 8 characters.');
    var body = { phone: flow.phone, proof: flow.proof, password: v.password }; if (view === 'signup') body.name = v.name;
    return request('/api/auth/' + (view === 'signup' ? 'register' : 'reset-password'), { method: 'POST', body: body }).then(function (d) {
      if (d.user) { setUser(d.user); close(); return; }
      if (d.error && d.error.code === 'verification_required') { flow.step = 'phone'; flow.proof = ''; render(); alertInline(d.error.message); return; }
      fail((d.error && d.error.message) || 'Something went wrong. Please try again.');
    }).catch(net);
  }

  /* ---------- modal shell ---------- */
  function build() {
    modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-slate-900/60 p-4';
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'roauth-title');
    modal.innerHTML = '<div class="relative max-h-full w-full max-w-sm overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">' +
      '<button type="button" data-roauth-close aria-label="Close" class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800">&#10005;</button>' +
      '<div data-roauth-body></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('mousedown', function (e) { if (e.target === modal) close(); });
    modal.querySelector('[data-roauth-close]').onclick = close;
    document.addEventListener('keydown', function (e) {
      if (!modal || modal.classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        var f = modal.querySelectorAll('button:not([disabled]),input,a[href]'); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  function focusFirst() { var i = modal.querySelector('input, #roauth-logout'); if (i) i.focus(); }
  function open(v, opts) {
    if (!modal) build();
    notice = (opts && opts.notice) || '';
    if (v) go(v); else { view = 'login'; flow = { step: 'phone', phone: '', proof: '', resendAt: 0 }; }
    lastFocus = document.activeElement; render();
    modal.classList.remove('hidden'); modal.classList.add('flex'); document.body.style.overflow = 'hidden'; focusFirst();
  }
  function close() {
    if (!modal) return; clearInterval(timer); notice = '';
    modal.classList.add('hidden'); modal.classList.remove('flex'); document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function setUser(u) {
    current = u || null; paintButtons();
    try { document.dispatchEvent(new CustomEvent('ro:auth', { detail: { user: current } })); } catch (e) {}
  }
  function paintButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-ro-account]'), function (el) {
      var label = el.querySelector('[data-ro-account-label]'), icon = el.querySelector('i');
      if (label) label.textContent = current ? current.name.split(' ')[0] : 'Account';
      if (icon) icon.className = (current ? 'fa-solid' : 'fa-regular') + ' fa-user' + (label ? '' : ' text-sm');
      el.setAttribute('aria-label', current ? 'My account' : 'Log in'); el.title = current ? current.name : 'Log in';
      if (current) el.classList.add('text-blue-600', 'border-blue-400'); else el.classList.remove('text-blue-600', 'border-blue-400');
    });
  }
  function logout() { return request('/api/auth/logout', { method: 'POST', body: {} }).then(function () { setUser(null); }, function () { setUser(null); }); }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-ro-account]'), function (el) {
      el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0');
      el.addEventListener('click', function (e) { e.preventDefault(); open(); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    paintButtons();
    request('/api/auth/me').then(function (d) { setUser(d.user && !d.mustSetup ? d.user : null); }).catch(function () {});
  }

  window.ROAuth = { open: open, logout: logout, user: function () { return current; }, request: request };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
