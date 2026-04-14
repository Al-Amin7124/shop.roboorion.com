/* ============================================================
   Robo Orion – Universal Cart System (cart.js)
   Handles BOTH the Cart Drawer and the Checkout Page
   and Individual Product Pages
   ============================================================ */

(function () {
    'use strict';

    /* ── CONFIG ──────────────────────────────────────────── */
    const WA_NUMBER  = '8801999506021';
    const CART_KEY   = 'robo_orion_cart';
    const PROD_KEY   = 'robo_orion_products';
    const COUPON_KEY = 'robo_orion_coupon';
    const STORE_NAME = 'Robo Orion';

    const COUPONS = {
        'ROBOORION10': { discount: 10, type: 'percent', expiry: '2026-03-31', label: '10% off',    minOrder: 0 },
        'ROBOORION45': { discount: 45, type: 'flat',    expiry: '2026-12-31', label: 'BDT 45 off', minOrder: 500 },
        'ROBOORION70': { discount: 70, type: 'flat',    expiry: '2026-12-31', label: 'BDT 70 off', minOrder: 0 },
    };

    /* ── STATE ───────────────────────────────────────────── */
    let PRODUCTS = [];
    let APPLIED_COUPON = JSON.parse(localStorage.getItem(COUPON_KEY)) || null;
    let toastTmr = null;
    const isCheckoutPage = window.location.pathname.includes('checkout.html');

    /* ── HELPERS ─────────────────────────────────────────── */
    
    function getEl(id) {
        return document.getElementById('co-' + id) || document.getElementById('ro-' + id) || document.getElementById(id);
    }

    function getCart() { 
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } 
        catch (e) { return []; } 
    }

    function saveCart(cart) { 
        localStorage.setItem(CART_KEY, JSON.stringify(cart)); 
    }

    function isCouponExpired(expiryDateStr) {
        if (!expiryDateStr) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(expiryDateStr);
        expiryDate.setHours(23, 59, 59, 999);
        return today.getTime() > expiryDate.getTime();
    }

    function fixImagePath(img) {
        if (!img) return '';
        const isProdPage = window.location.pathname.includes('/products/');
        if (isProdPage && !img.startsWith('../') && !img.startsWith('http')) return '../' + img;
        if (!isProdPage && img.startsWith('../')) return img.replace('../', '');
        return img;
    }

    function findProduct(id) {
        const inMemory = PRODUCTS.find(p => p.id === id);
        if (inMemory) return { ...inMemory, img: fixImagePath(inMemory.img) };
        
        const saved = JSON.parse(localStorage.getItem(PROD_KEY) || '{}');
        if (saved[id]) {
            const product = { ...saved[id], img: fixImagePath(saved[id].img) };
            PRODUCTS.push(product);
            return product;
        }
        return null;
    }

    /* ── COUPON LOGIC ───────────────────────────────────── */

    function calcDiscount(total) {
        if (!APPLIED_COUPON) return 0;
        if (isCouponExpired(APPLIED_COUPON.expiry)) { removeCoupon(); return 0; }
        if (APPLIED_COUPON.minOrder && total < APPLIED_COUPON.minOrder) { removeCoupon(); return 0; }
        if (APPLIED_COUPON.type === 'percent') return Math.round(total * APPLIED_COUPON.discount / 100);
        else if (APPLIED_COUPON.type === 'flat') return Math.min(APPLIED_COUPON.discount, total);
        return 0;
    }

    function applyCoupon() {
        const input = getEl('coupon-input');
        const msgEl = getEl('coupon-msg');
        if (!input) return;
        const code = input.value.trim().toUpperCase();
        const coupon = COUPONS[code];
        if (msgEl) msgEl.className = isCheckoutPage ? 'co-coupon-msg' : 'ro-coupon-msg';

        if (!coupon) {
            removeCoupon();
            if (msgEl) { msgEl.classList.add('error'); msgEl.textContent = '✕ Invalid coupon code.'; }
            updateUI(); return;
        }
        if (isCouponExpired(coupon.expiry)) {
            removeCoupon();
            if (msgEl) { msgEl.classList.add('error'); msgEl.textContent = `✕ This coupon expired on ${coupon.expiry}.`; }
            updateUI(); return;
        }
        const total = getCart().reduce((s, i) => {
            const p = findProduct(i.id);
            return s + (p ? p.price * i.qty : 0);
        }, 0);
        if (coupon.minOrder && total < coupon.minOrder) {
            removeCoupon();
            if (msgEl) { msgEl.classList.add('error'); msgEl.textContent = `✕ Min order BDT ${coupon.minOrder} required.`; }
            updateUI(); return;
        }
        APPLIED_COUPON = { code, ...coupon };
        localStorage.setItem(COUPON_KEY, JSON.stringify(APPLIED_COUPON));
        if (msgEl) { msgEl.classList.add('success'); msgEl.textContent = `✓ Coupon applied — ${coupon.label}!`; }
        updateUI();
    }

    function removeCoupon() {
        APPLIED_COUPON = null;
        localStorage.removeItem(COUPON_KEY);
        const input = getEl('coupon-input');
        const msgEl = getEl('coupon-msg');
        if (input) input.value = '';
        if (msgEl) { msgEl.className = isCheckoutPage ? 'co-coupon-msg' : 'ro-coupon-msg'; msgEl.textContent = ''; }
        updateUI();
    }

    /* ── CART ACTIONS ────────────────────────────────────── */

    // MODIFIED: Now accepts optional quantity
    function addItem(id, qty = 1) {
        const cart = getCart();
        const existing = cart.find(i => i.id === id);
        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({ id, qty: qty });
        }
        saveCart(cart);
        updateUI();
        bumpBadge();
        const p = findProduct(id);
        if (p) showToast(`✅ ${qty}x ${p.name.substring(0, 30)}... added!`);
        highlightBtn(id);
    }

    function changeQty(id, delta) {
        const cart = getCart();
        const item = cart.find(i => i.id === id);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) cart.splice(cart.indexOf(item), 1);
        saveCart(cart);
        updateUI();
    }

    function removeItem(id) {
        saveCart(getCart().filter(i => i.id !== id));
        updateUI();
        showToast('Item removed');
    }

    function clearCart() {
        saveCart([]);
        removeCoupon();
        updateUI();
        showToast('Cart cleared');
    }

    /* ── UI RENDERING ────────────────────────────────────── */

    function updateUI() {
        const cart = getCart();
        const totalQty = cart.reduce((s, i) => s + i.qty, 0);
        const total = cart.reduce((s, i) => {
            const p = findProduct(i.id);
            return s + (p ? p.price * i.qty : 0);
        }, 0);

        if (isCheckoutPage) {
            renderCheckoutUI(cart, total, totalQty);
        } else {
            renderDrawerUI(cart, total, totalQty);
        }
    }

    function renderDrawerUI(cart, total, totalQty) {
        const fab = getEl('cart-fab');
        const fabCount = getEl('fab-count');
        if (fab) fab.classList.toggle('hidden', totalQty === 0);
        if (fabCount) fabCount.textContent = totalQty;
        ['nav-cart-count', 'nav-cart-count-mobile'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.textContent = totalQty; el.classList.toggle('hidden', totalQty === 0); }
        });
        const badge = getEl('header-badge');
        if (badge) badge.textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
        const itemsEl = getEl('cart-items');
        const footerEl = getEl('cart-footer');
        if (!itemsEl) return;
        if (cart.length === 0) {
            itemsEl.innerHTML = `<div class="ro-empty"><p>Your cart is empty</p></div>`;
            if (footerEl) footerEl.style.display = 'none';
            return;
        }
        if (footerEl) footerEl.style.display = 'block';
        itemsEl.innerHTML = cart.map(item => {
            const p = findProduct(item.id);
            if (!p) return '';
            return `<div class="ro-cart-item">
                <img class="ro-item-img" src="${p.img}" alt="${p.name}">
                <div class="ro-item-info"><div class="ro-item-name">${p.name}</div><div class="ro-item-price">BDT ${p.price}</div></div>
                <div class="ro-qty-wrap">
                    <div class="ro-qty-controls">
                        <button class="ro-qty-btn" onclick="ROCart.changeQty('${p.id}', -1)">−</button>
                        <span class="ro-qty-num">${item.qty}</span>
                        <button class="ro-qty-btn" onclick="ROCart.changeQty('${p.id}', 1)">+</button>
                    </div>
                    <div class="ro-item-subtotal">BDT ${p.price * item.qty}</div>
                    <button class="ro-remove-btn" onclick="ROCart.removeItem('${p.id}')">✕ remove</button>
                </div></div>`;
        }).join('');
        const discount = calcDiscount(total);
        const totalEl = getEl('total-price');
        if (totalEl) totalEl.textContent = `BDT ${total - discount}`;
        let dRow = document.getElementById('ro-discount-row');
        if (discount > 0) {
            if (!dRow) {
                dRow = document.createElement('div'); dRow.id = 'ro-discount-row';
                dRow.className = 'ro-summary-row'; dRow.style.color = 'red'; dRow.style.fontWeight = '600';
                const label = getEl('item-count-label');
                if (label) label.closest('.ro-summary-row').insertAdjacentElement('afterend', dRow);
            }
            dRow.innerHTML = `<span>Discount (${APPLIED_COUPON.code})</span><span>- BDT ${discount}</span>`;
        } else if (dRow) dRow.remove();
    }

    function renderCheckoutUI(cart, total, totalQty) {
        const itemsEl = getEl('items');
        const badge = getEl('item-badge');
        const waBtn = getEl('wa-btn');
        if (!itemsEl) return;
        if (badge) badge.textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
        if (waBtn) waBtn.disabled = cart.length === 0;
        if (cart.length === 0) {
            itemsEl.innerHTML = `<div class="co-empty"><p>Your cart is empty</p></div>`;
        } else {
            itemsEl.innerHTML = cart.map(item => {
                const p = findProduct(item.id);
                if (!p) return '';
                return `<div class="co-item">
                    <img class="co-item-img" src="${p.img}" alt="${p.name}">
                    <div class="co-item-info"><div class="co-item-name">${p.name}</div><div class="co-item-price">BDT ${p.price} each</div></div>
                    <div class="co-qty-wrap">
                        <div class="co-qty-controls">
                            <button class="co-qty-btn" onclick="ROCart.changeQty('${p.id}', -1)">−</button>
                            <span class="co-qty-num">${item.qty}</span>
                            <button class="co-qty-btn" onclick="ROCart.changeQty('${p.id}', 1)">+</button>
                        </div>
                        <div class="co-item-subtotal">BDT ${p.price * item.qty}</div>
                        <button class="co-remove-btn" onclick="ROCart.removeItem('${p.id}')">✕ remove</button>
                    </div></div>`;
            }).join('');
        }
        const discount = calcDiscount(total);
        const delivery = getDeliveryCharge();
        const subtotalEl = getEl('subtotal');
        const deliveryEl = getEl('delivery-val');
        const totalEl = getEl('total');
        if (subtotalEl) subtotalEl.textContent = `BDT ${total}`;
        if (deliveryEl) deliveryEl.textContent = `BDT ${delivery}`;
        if (totalEl) totalEl.textContent = `BDT ${total - discount + delivery}`;
        const dRow = getEl('discount-row');
        if (dRow) {
            dRow.style.display = (discount > 0) ? 'flex' : 'none';
            if (discount > 0) {
                const lEl = document.getElementById('co-discount-label');
                const vEl = document.getElementById('co-discount-val');
                if (lEl) lEl.textContent = `Discount (${APPLIED_COUPON.code})`;
                if (vEl) vEl.textContent = `- BDT ${discount}`;
            }
        }
    }

    /* ── PRODUCT SCRAPING & SETUP ──────────────────────────────── */

    function setupIndividualPage() {
        // This handles the individual product detail page logic
        const mainBtn = document.getElementById('main-add-to-cart');
        if (!mainBtn) return;

        // 1. Scrape the main product data from the page
        const nameEl = document.querySelector('.productName');
        const codeEl = document.querySelector('.productCode');
        const priceEl = document.querySelector('.productPrice .offer-price');
        const imgEl = document.getElementById('mainImage');

        if (!nameEl || !codeEl) return;

        const product = {
            id: codeEl.textContent.trim(),
            name: nameEl.textContent.trim(),
            code: codeEl.textContent.trim(),
            price: parseInt(priceEl?.textContent.replace(/[^0-9]/g, '') || '0', 10),
            img: imgEl ? imgEl.getAttribute('src') : '',
        };

        // Register the product so findProduct() works
        PRODUCTS.push(product);
        const saved = JSON.parse(localStorage.getItem(PROD_KEY) || '{}');
        saved[product.id] = product;
        localStorage.setItem(PROD_KEY, JSON.stringify(saved));

        // 2. Handle the click event
        mainBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const qtyInput = document.getElementById('main-product-qty');
            const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
            ROCart.addItem(product.id, qty);
        });
    }

    function scrapeShopProducts() {
        const saved = JSON.parse(localStorage.getItem(PROD_KEY) || '{}');
        const cards = document.querySelectorAll('.product-card');
        const products = [];
        cards.forEach((card, idx) => {
            const nameEl = card.querySelector('.productName');
            const codeEl = card.querySelector('.productCode');
            const priceEl = card.querySelector('.productPrice .offer-price');
            if (!nameEl) return;
            const product = {
                id: codeEl ? codeEl.textContent.trim() : `p-${idx}`,
                name: nameEl.textContent.trim(),
                code: codeEl ? codeEl.textContent.trim() : '',
                price: parseInt(priceEl?.textContent.replace(/[^0-9]/g, '') || '0', 10),
                img: card.querySelector('img')?.getAttribute('src') || '',
            };
            products.push(product);
            saved[product.id] = product;
            const addBtn = card.querySelector('.add-to-cart');
            if (addBtn) addBtn.addEventListener('click', (e) => { e.preventDefault(); ROCart.addItem(product.id, 1); });
        });
        localStorage.setItem(PROD_KEY, JSON.stringify(saved));
        Object.values(saved).forEach(p => { if (!products.find(x => x.id === p.id)) products.push(p); });
        return products;
    }

    /* ── WHATSAPP & MISC ────────────────────────────────── */

    function orderWhatsApp() {
        const cart = getCart();
        if (cart.length === 0) return;
        let total = 0;
        let lines = [];
        cart.forEach((item, idx) => {
            const p = findProduct(item.id);
            if (!p) return;
            const sub = p.price * item.qty;
            total += sub;
            lines.push(`${idx + 1}. ${p.name}\n   Qty: ${item.qty} × BDT ${p.price} = BDT ${sub}`);
        });
        const discount = calcDiscount(total);
        const delivery = getDeliveryCharge();
        const message = `🛒 *Order from ${STORE_NAME}*\n\n${lines.join('\n\n')}\n\n─────────────────\n${APPLIED_COUPON ? `🎟 *Coupon: ${APPLIED_COUPON.code}* - BDT ${discount}\n` : ''}🛵 *Delivery: BDT ${delivery}*\n💰 *Total: BDT ${total - discount + delivery}*\n─────────────────\nPlease confirm! 🙏`;
        window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    }

    function getDeliveryCharge() {
        const outside = getEl('delivery-outside');
        return outside && outside.checked ? 120 : 70;
    }

    function openDrawer() {
        const drawer = document.getElementById('ro-cart-drawer');
        const overlay = document.getElementById('ro-cart-overlay');
        if (drawer) drawer.classList.add('open');
        if (overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        const drawer = document.getElementById('ro-cart-drawer');
        const overlay = document.getElementById('ro-cart-overlay');
        if (drawer) drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    function showToast(msg) {
        const t = document.getElementById('ro-toast');
        if (!t) return;
        t.textContent = msg; t.classList.add('show');
        clearTimeout(toastTmr); 
        toastTmr = setTimeout(() => t.classList.remove('show'), 2600);
    }

    function bumpBadge() {
        const el = getEl('fab-count');
        if (!el) return;
        el.classList.add('bump'); 
        setTimeout(() => el.classList.remove('bump'), 300);
    }

    function highlightBtn(id) {
        document.querySelectorAll('.product-card').forEach(card => {
            const codeEl = card.querySelector('.productCode');
            if (codeEl && codeEl.textContent.trim() === id) {
                const btn = card.querySelector('button');
                if (btn) { 
                    btn.classList.add('ro-added'); 
                    btn.innerHTML = 'Added!'; 
                    setTimeout(() => { btn.classList.remove('ro-added'); btn.innerHTML = 'Add to Cart'; }, 1800); 
                }
            }
        });
    }

    /* ── INIT ────────────────────────────────────────────── */

    function init() {
        if (!isCheckoutPage) {
            document.body.insertAdjacentHTML('beforeend', `
                <button id="ro-cart-fab" class="hidden" onclick="ROCart.openDrawer()">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    Cart <span class="fab-count" id="ro-fab-count">0</span>
                </button>
                <div id="ro-cart-overlay" onclick="ROCart.closeDrawer()"></div>
                <div id="ro-cart-drawer">
                    <div class="ro-cart-header">
                        <div class="ro-cart-header-left">
                            <svg width="18" height="18" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                            </svg>
                            <h2>My Cart</h2>
                            <span class="ro-header-badge" id="ro-header-badge">0 items</span>
                        </div>
                        <button class="ro-close-btn" onclick="ROCart.closeDrawer()">✕</button>
                    </div>
                    <div class="ro-cart-items" id="ro-cart-items"></div>
                    <div class="ro-cart-footer" id="ro-cart-footer" style="display:none">
                        <div class="ro-summary-row">
                            <span id="ro-item-count-label"></span>
                            <span>Subtotal</span>
                        </div>
                        <div class="ro-total-row">
                            <span>Total</span>
                            <span id="ro-total-price"></span>
                        </div>
                        <a href="/checkout.html" class="ro-checkout-btn" id="ro-checkout-btn" onclick="ROCart.goCheckout()">🛒 Proceed to Checkout</a>
                        <button class="ro-clear-btn" onclick="ROCart.clearCart()">🗑 Clear Cart</button>
                    </div>
                </div>
                <div id="ro-toast"></div>
            `);
        }

        // HANDLE BOTH Shop Page and Individual Page
        PRODUCTS = scrapeShopProducts();
        setupIndividualPage();
        
        updateUI();
        
        const inside = getEl('delivery-inside');
        const outside = getEl('delivery-outside');
        if (inside && outside) {
            [inside, outside].forEach(el => el.addEventListener('change', updateUI));
        }

        window.addEventListener('storage', (e) => {
            if (e.key === CART_KEY || e.key === COUPON_KEY) updateUI();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // EXPOSE PUBLIC API
    window.ROCart = { 
        addItem, changeQty, removeItem, clearCart, openDrawer, closeDrawer, 
        orderWhatsApp, applyCoupon, removeCoupon 
    };

    // BRIDGE: Supports old function names in HTML
    window.coApplyCoupon = function() { ROCart.applyCoupon(); };
    window.coOrderWhatsApp = function() { ROCart.orderWhatsApp(); };
    window.changeQty = function(id, delta) { ROCart.changeQty(id, delta); };
    window.removeItem = function(id) { ROCart.removeItem(id); };

})();