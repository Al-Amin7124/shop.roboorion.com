/* Robo Orion — keeps the cart in the customer's account while they are logged in.
   Guests are not affected at all: the cart stays in this browser exactly as before.
   Loaded automatically by cart.js; if this file or the API is unavailable, nothing changes. */
(function () {
  'use strict';
  if (window.ROCartSync) return;

  var CART_KEY = 'robo_orion_cart', OWNER_KEY = 'robo_orion_cart_owner', CUSTOMER_KEY = 'robo_orion_customer';
  var user = null, ready = false, timer = null, prefilled = false;

  function api(path, opts) { return window.ROAuth.request(path, opts); }
  function readLocal() { try { var a = JSON.parse(localStorage.getItem(CART_KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function refresh() { if (window.ROCart && window.ROCart.refresh) window.ROCart.refresh(); }

  function clean(items) {
    var m = {};
    (items || []).forEach(function (i) {
      var q = Math.floor(Number(i && i.qty));
      if (!i || !i.id || !(q >= 1)) return;
      m[i.id] = Math.min(99, Math.max(m[i.id] || 0, q));     // same item on both sides: keep the larger quantity, never add them up
    });
    return Object.keys(m).map(function (id) { return { id: id, qty: m[id] }; });
  }
  function key(items) { return JSON.stringify(clean(items).sort(function (a, b) { return a.id < b.id ? -1 : 1; })); }

  function writeLocal(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {}
    refresh();
  }

  function push(items) {
    if (!user) return Promise.resolve();
    return api('/api/me/cart', { method: 'PUT', body: { items: clean(items) } }).catch(function () {});
  }

  /* ---- login: combine this browser's cart with the account's saved cart ---- */
  function onLogin(u) {
    if (user && user.id === u.id && ready) return;
    user = u; ready = false;
    var owner = null; try { owner = localStorage.getItem(OWNER_KEY); } catch (e) {}
    var local = (owner && owner !== u.id) ? [] : readLocal();     // never mix another account's leftover cart into this one
    api('/api/me/cart').then(function (d) {
      if (!d.items) { renderBar(); return; }                        // could not reach the account: leave the local cart alone
      var merged = clean(local.concat(d.items));
      if (key(merged) !== key(readLocal())) writeLocal(merged);
      try { localStorage.setItem(OWNER_KEY, u.id); } catch (e) {}
      if (key(merged) !== key(d.items)) push(merged);
      ready = true;
      prefill(); renderBar(); updateOnlineButton();
    }).catch(function () { renderBar(); });
  }

  /* ---- logout: an account's cart should not stay on a shared device ---- */
  function onLogout() {
    var wasLoggedIn = !!user;
    user = null; ready = false;
    if (wasLoggedIn) {
      var owner = null; try { owner = localStorage.getItem(OWNER_KEY); } catch (e) {}
      if (owner) {
        try { localStorage.removeItem(CART_KEY); localStorage.removeItem(OWNER_KEY); localStorage.removeItem(CUSTOMER_KEY); } catch (e) {}
        refresh();
      }
    }
    renderBar(); updateOnlineButton();
  }

  /* ---- every cart change is saved to the account (shortly after the last click) ---- */
  document.addEventListener('ro:cart-saved', function () {
    if (!user || !ready) return;
    clearTimeout(timer);
    timer = setTimeout(function () { push(readLocal()); }, 700);
  });

  /* ---- checkout page extras (only if those elements exist) ---- */
  function el(id) { return document.getElementById(id); }
  function fill(id, value) {
    var e = el(id); if (!e || e.value || !value) return;
    e.value = value; e.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function prefill() {
    if (prefilled || !el('co-cust-name')) return;
    prefilled = true;
    fill('co-cust-name', user.name); fill('co-cust-phone', user.phone);
    api('/api/me/orders').then(function (d) {                       // reuse the address from the last delivery order
      var last = (d.orders || []).filter(function (o) { return o.delivery_method !== 'pickup' && o.shipping && o.shipping.address; })[0];
      if (last) fill('co-cust-location', last.shipping.address);
    }).catch(function () {});
  }

  function updateOnlineButton() {
    var b = el('co-online-btn'); if (!b) return;
    var label = b.querySelector('[data-online-label]');
    if (label) label.textContent = user ? 'Place order on website' : 'Log in to order on website';
  }

  function renderBar() {
    if (!el('co-cust-name')) return;                                 // not the checkout page
    var bar = el('ro-account-bar');
    if (!bar) {
      var anchor = document.querySelector('.co-delivery-section'); if (!anchor) return;
      bar = document.createElement('div'); bar.id = 'ro-account-bar';
      bar.style.cssText = 'margin-bottom:.75rem;padding:.6rem .8rem;border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;font-size:.8rem;color:#1e3a8a;line-height:1.4';
      anchor.parentNode.insertBefore(bar, anchor);
    }
    var btn = 'background:none;border:0;padding:0;color:#2563eb;font-weight:700;cursor:pointer;text-decoration:underline;font-size:inherit';
    if (user) {
      bar.innerHTML = 'Logged in as <b></b>. Your cart is saved to your account. <button type="button" style="' + btn + '" data-act="logout">Log out</button>';
      bar.querySelector('b').textContent = user.name;
    } else {
      bar.innerHTML = 'Order with WhatsApp, no account needed. Or <button type="button" style="' + btn + '" data-act="login">log in</button> to save your cart and order on the website.';
    }
    var a = bar.querySelector('button');
    a.onclick = function () { if (a.getAttribute('data-act') === 'logout') window.ROAuth.logout(); else window.ROAuth.open('login'); };
  }

  function start() {
    if (!window.ROAuth) return;
    document.addEventListener('ro:auth', function (e) {
      var u = e.detail && e.detail.user;
      if (u) onLogin(u); else onLogout();
    });
    renderBar(); updateOnlineButton();
    if (window.ROAuth.user()) onLogin(window.ROAuth.user());      // login may have finished before this file loaded
  }

  window.ROCartSync = { isReady: function () { return ready; }, push: function () { return push(readLocal()); } };
  start();
})();
