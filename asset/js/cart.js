/* ============================================================
   Robo Orion – Universal Cart System (cart.js)
   Handles BOTH the Cart Drawer and the Checkout Page
   and Individual Product Pages
   ============================================================ */

(function () {
    'use strict';

    /* ── CONFIG ──────────────────────────────────────────── */
    const WA_NUMBER    = '8801846253277';
    const CART_KEY     = 'robo_orion_cart';
    const PROD_KEY     = 'robo_orion_products';
    const COUPON_KEY   = 'robo_orion_coupon';
    const CUSTOMER_KEY = 'robo_orion_customer';
    const DELIVERY_KEY = 'robo_orion_delivery';
    const STORE_NAME   = 'Robo Orion';
    const PICKUP_LOCATION = 'Middle Badda, Dhaka';

    const COUPONS = {
        // Store-wide example:
        // 'ROBOORION10': { discount: 10, type: 'percent', expiry: '2026-12-31', label: '10% off your order', minOrder: 0, productCode: null },

        // Product-specific example (only discounts the item with code 'ARD-001'):
        // 'ARDUINO50':   { discount: 50, type: 'flat', expiry: '2026-12-31', label: 'BDT 50 off Arduino Uno', minOrder: 0, productCode: 'ARD-001' },
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
        try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
        catch (e) { console.error('ROCart: failed to save cart', e); }
    }

    function isCouponExpired(expiryDateStr) {
        if (!expiryDateStr) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(expiryDateStr);
        expiryDate.setHours(23, 59, 59, 999);
        return today.getTime() > expiryDate.getTime();
    }

    function fmt(n) {
        return parseFloat((n || 0).toFixed(2));
    }

    function escapeHtml(str) {
        if (str === undefined || str === null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function fixImagePath(img) {
        if (!img) return '';
        const isProdPage = window.location.pathname.includes('/products/');
        if (isProdPage && !img.startsWith('../') && !img.startsWith('http')) return '../' + img;
        if (!isProdPage && img.startsWith('../')) return img.replace('../', '');
        return img;
    }

    function findProduct(id) {
        const saved = JSON.parse(localStorage.getItem(PROD_KEY) || '{}');
        const inMemory = PRODUCTS.find(p => p.id === id);

        if (saved[id] && saved[id].priceSource === 'product-page') {
            const product = { ...saved[id], img: fixImagePath(saved[id].img) };
            const idx = PRODUCTS.findIndex(p => p.id === id);
            if (idx !== -1) PRODUCTS[idx] = product; else PRODUCTS.push(product);
            return product;
        }

        if (inMemory) return { ...inMemory, img: fixImagePath(inMemory.img) };

        if (saved[id]) {
            const product = { ...saved[id], img: fixImagePath(saved[id].img) };
            PRODUCTS.push(product);
            return product;
        }
        return null;
    }

    function productLineTotal(cart, code) {
        const item = cart.find(i => i.id === code);
        if (!item) return 0;
        const p = findProduct(code);
        return p ? fmt(p.price * item.qty) : 0;
    }

    function cartTotal(cart) {
        return fmt(cart.reduce((s, i) => {
            const p = findProduct(i.id);
            return s + (p ? p.price * i.qty : 0);
        }, 0));
    }

    function getDeliveryCharge() {
        const pickup = getEl('delivery-pickup');
        if (pickup && pickup.checked) return 0;
        const outside = getEl('delivery-outside');
        return outside && outside.checked ? 120 : 70;
    }

    function isSelfPickup() {
        const pickup = getEl('delivery-pickup');
        return !!(pickup && pickup.checked);
    }

    function getDeliveryLabel() {
        if (isSelfPickup()) return `Self Pickup — ${PICKUP_LOCATION}`;
        const outside = getEl('delivery-outside');
        return (outside && outside.checked) ? 'Outside Dhaka' : 'Inside Dhaka';
    }

    function syncDeliveryUI() {
        [
            ['delivery-inside', 'delivery-inside-label'],
            ['delivery-outside', 'delivery-outside-label'],
            ['delivery-pickup', 'delivery-pickup-label'],
        ].forEach(([radioId, labelId]) => {
            const radio = getEl(radioId);
            const label = getEl(labelId);
            if (radio && label) label.classList.toggle('active', radio.checked);
        });

        const pickup = isSelfPickup();
        const locEl = getEl('cust-location');
        const noteEl = getEl('pickup-note');
        if (locEl) {
            locEl.disabled = pickup;
            locEl.placeholder = pickup ? `Not required — pickup at ${PICKUP_LOCATION}` : 'Delivery Address / Location';
        }
        if (noteEl) noteEl.style.display = pickup ? 'block' : 'none';
    }

    function saveDeliveryPreference() {
        let method = 'outside';
        if (isSelfPickup()) method = 'pickup';
        else {
            const inside = getEl('delivery-inside');
            if (inside && inside.checked) method = 'inside';
        }
        try { localStorage.setItem(DELIVERY_KEY, method); }
        catch (e) { console.error('ROCart: failed to save delivery preference', e); }
    }

    function loadDeliveryPreference() {
        let saved;
        try { saved = localStorage.getItem(DELIVERY_KEY); } catch (e) { return; }
        if (!saved) return;

        const radioIdByMethod = { inside: 'delivery-inside', outside: 'delivery-outside', pickup: 'delivery-pickup' };
        const radio = getEl(radioIdByMethod[saved]);
        if (radio) radio.checked = true;
    }

    /* ── CUSTOMER INFO ──────────────────────────────────── */

    function getCustomerInfo() {
        return {
            name: (getEl('cust-name') || {}).value?.trim() || '',
            phone: (getEl('cust-phone') || {}).value?.trim() || '',
            location: (getEl('cust-location') || {}).value?.trim() || '',
        };
    }

    function saveCustomerInfo() {
        try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify(getCustomerInfo())); }
        catch (e) { console.error('ROCart: failed to save customer info', e); }
    }

    function loadCustomerInfo() {
        const nameEl = getEl('cust-name');
        const phoneEl = getEl('cust-phone');
        const locEl = getEl('cust-location');
        if (!nameEl && !phoneEl && !locEl) return;

        try {
            const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || '{}');
            if (nameEl && saved.name) nameEl.value = saved.name;
            if (phoneEl && saved.phone) phoneEl.value = saved.phone;
            if (locEl && saved.location) locEl.value = saved.location;
        } catch (e) { /* ignore malformed storage */ }

        [nameEl, phoneEl, locEl].forEach(el => { if (el) el.addEventListener('input', saveCustomerInfo); });
    }

    function validateCustomerInfo() {
        const nameEl = getEl('cust-name');
        if (!nameEl) return true;

        const msgEl = getEl('contact-msg');
        const info = getCustomerInfo();

        function fail(text, el) {
            if (msgEl) { msgEl.className = 'co-coupon-msg error'; msgEl.textContent = '✕ ' + text; }
            if (el) el.focus();
            return false;
        }

        if (!info.name) return fail('Please enter your full name.', nameEl);
        if (!info.phone) return fail('Please enter your phone number.', getEl('cust-phone'));
        if (!/^[+0-9\s-]{7,15}$/.test(info.phone)) return fail('Please enter a valid phone number.', getEl('cust-phone'));
        if (!isSelfPickup() && !info.location) return fail('Please enter your delivery address, or choose Self Pickup.', getEl('cust-location'));

        if (msgEl) { msgEl.className = 'co-coupon-msg'; msgEl.textContent = ''; }
        return true;
    }

    /* ── COUPON LOGIC ───────────────────────────────────── */

    function calcDiscount(cart) {
        if (!APPLIED_COUPON) return { amount: 0, targetId: null, inactive: false };
        if (isCouponExpired(APPLIED_COUPON.expiry)) { removeCoupon(); return { amount: 0, targetId: null, inactive: false }; }

        if (APPLIED_COUPON.productCode) {
            const targetId = APPLIED_COUPON.productCode;
            const lineTotal = productLineTotal(cart, targetId);
            if (lineTotal <= 0) return { amount: 0, targetId, inactive: true };
            if (APPLIED_COUPON.minOrder && lineTotal < APPLIED_COUPON.minOrder) return { amount: 0, targetId, inactive: true };
            const raw = APPLIED_COUPON.type === 'percent'
                ? lineTotal * APPLIED_COUPON.discount / 100
                : APPLIED_COUPON.discount;
            return { amount: fmt(Math.min(raw, lineTotal)), targetId, inactive: false };
        }

        const total = cartTotal(cart);
        if (APPLIED_COUPON.minOrder && total < APPLIED_COUPON.minOrder) return { amount: 0, targetId: null, inactive: true };
        const raw = APPLIED_COUPON.type === 'percent'
            ? total * APPLIED_COUPON.discount / 100
            : APPLIED_COUPON.discount;
        return { amount: fmt(Math.min(raw, total)), targetId: null, inactive: false };
    }

    function applyCoupon() {
        const input = getEl('coupon-input');
        const msgEl = getEl('coupon-msg');
        if (!input) return;
        const code = input.value.trim().toUpperCase();
        const msgClass = isCheckoutPage ? 'co-coupon-msg' : 'ro-coupon-msg';
        if (msgEl) msgEl.className = msgClass;

        if (!code) {
            if (msgEl) { msgEl.classList.add('error'); msgEl.textContent = 'Please enter a coupon code.'; }
            return;
        }

        const coupon = COUPONS[code];
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

        const cart = getCart();
        if (cart.length === 0) {
            if (msgEl) { msgEl.classList.add('error'); msgEl.textContent = 'Your cart is empty — add items before applying a coupon.'; }
            return;
        }

        if (coupon.productCode) {
            const targetProduct = findProduct(coupon.productCode);
            const lineTotal = productLineTotal(cart, coupon.productCode);
            const targetLabel = targetProduct ? targetProduct.name : coupon.productCode;

            if (lineTotal <= 0) {
                if (msgEl) {
                    msgEl.classList.add('error');
                    msgEl.textContent = `✕ This coupon only applies to "${targetLabel}" (code: ${coupon.productCode}). Add it to your cart to use this code.`;
                }
                return;
            }
            if (coupon.minOrder && lineTotal < coupon.minOrder) {
                if (msgEl) {
                    msgEl.classList.add('error');
                    msgEl.textContent = `✕ Minimum BDT ${coupon.minOrder} of "${targetLabel}" required for this coupon.`;
                }
                return;
            }

            APPLIED_COUPON = { code, ...coupon };
            localStorage.setItem(COUPON_KEY, JSON.stringify(APPLIED_COUPON));
            if (msgEl) {
                msgEl.classList.add('success');
                msgEl.innerHTML = `✓ Coupon applied — ${escapeHtml(coupon.label)} on "${escapeHtml(targetLabel)}"! `
                    + `<button type="button" class="cart-coupon-remove" data-action="remove-coupon">Remove</button>`;
            }
            updateUI();
            return;
        }

        const total = cartTotal(cart);
        if (coupon.minOrder && total < coupon.minOrder) {
            removeCoupon();
            if (msgEl) { msgEl.classList.add('error'); msgEl.textContent = `✕ Minimum order of BDT ${coupon.minOrder} required.`; }
            updateUI(); return;
        }
        APPLIED_COUPON = { code, ...coupon };
        localStorage.setItem(COUPON_KEY, JSON.stringify(APPLIED_COUPON));
        if (msgEl) {
            msgEl.classList.add('success');
            msgEl.innerHTML = `✓ Coupon applied — ${escapeHtml(coupon.label)}! `
                + `<button type="button" class="cart-coupon-remove" data-action="remove-coupon">Remove</button>`;
        }
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
        const total = cartTotal(cart);

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
            const lineTotal = fmt(p.price * item.qty);
            return `<div class="ro-cart-item">
                <img class="ro-item-img" src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}">
                <div class="ro-item-info">
                    <div class="ro-item-name">${escapeHtml(p.name)}</div>
                    <div class="ro-item-code">Code: ${escapeHtml(p.code || p.id)}</div>
                    <div class="ro-item-price">BDT ${p.price}</div>
                </div>
                <div class="ro-qty-wrap">
                    <div class="ro-qty-controls">
                        <button class="ro-qty-btn" data-action="dec" data-id="${escapeHtml(p.id)}">−</button>
                        <span class="ro-qty-num">${item.qty}</span>
                        <button class="ro-qty-btn" data-action="inc" data-id="${escapeHtml(p.id)}">+</button>
                    </div>
                    <div class="ro-item-subtotal">BDT ${lineTotal}</div>
                    <button class="ro-remove-btn" data-action="remove" data-id="${escapeHtml(p.id)}">✕ remove</button>
                </div></div>`;
        }).join('');

        const totalEl = getEl('total-price');
        if (totalEl) totalEl.textContent = `BDT ${total}`;
    }

    function renderCheckoutUI(cart, total, totalQty) {
        const itemsEl = getEl('items');
        const badge = getEl('item-badge');
        const waBtn = getEl('wa-btn');
        if (!itemsEl) return;
        if (badge) badge.textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
        if (waBtn) waBtn.disabled = cart.length === 0;

        const discountInfo = calcDiscount(cart);

        if (cart.length === 0) {
            itemsEl.innerHTML = `<div class="co-empty"><p>Your cart is empty</p></div>`;
        } else {
            itemsEl.innerHTML = cart.map(item => {
                const p = findProduct(item.id);
                if (!p) return '';
                const lineTotal = fmt(p.price * item.qty);
                const isDiscounted = discountInfo.targetId === p.id && discountInfo.amount > 0;
                const discountedLine = isDiscounted ? fmt(lineTotal - discountInfo.amount) : lineTotal;
                const subtotalHtml = isDiscounted
                    ? `<span class="co-item-strike">BDT ${lineTotal}</span> BDT ${discountedLine}`
                    : `BDT ${lineTotal}`;
                return `<div class="co-item">
                    <img class="co-item-img" src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}">
                    <div class="co-item-info">
                        <div class="co-item-name">${escapeHtml(p.name)}</div>
                        <div class="co-item-code">Code: ${escapeHtml(p.code || p.id)}</div>
                        <div class="co-item-price">BDT ${p.price} each</div>
                    </div>
                    <div class="co-qty-wrap">
                        <div class="co-qty-controls">
                            <button class="co-qty-btn" data-action="dec" data-id="${escapeHtml(p.id)}">−</button>
                            <span class="co-qty-num">${item.qty}</span>
                            <button class="co-qty-btn" data-action="inc" data-id="${escapeHtml(p.id)}">+</button>
                        </div>
                        <div class="co-item-subtotal">${subtotalHtml}</div>
                        <button class="co-remove-btn" data-action="remove" data-id="${escapeHtml(p.id)}">✕ remove</button>
                    </div></div>`;
            }).join('');
        }

        const delivery = getDeliveryCharge();
        const subtotalEl = getEl('subtotal');
        const deliveryEl = getEl('delivery-val');
        const totalEl = getEl('total');
        if (subtotalEl) subtotalEl.textContent = `BDT ${total}`;
        if (deliveryEl) deliveryEl.textContent = delivery === 0 ? 'Free' : `BDT ${delivery}`;
        if (totalEl) totalEl.textContent = `BDT ${fmt(total - discountInfo.amount + delivery)}`;

        const dRow = getEl('discount-row');
        if (dRow) {
            dRow.style.display = (discountInfo.amount > 0) ? 'flex' : 'none';
            if (discountInfo.amount > 0) {
                const lEl = document.getElementById('co-discount-label');
                const vEl = document.getElementById('co-discount-val');
                const targetProduct = discountInfo.targetId ? findProduct(discountInfo.targetId) : null;
                const label = targetProduct ? `Discount (${APPLIED_COUPON.code}) — ${targetProduct.name}` : `Discount (${APPLIED_COUPON.code})`;
                if (lEl) lEl.textContent = label;
                if (vEl) vEl.textContent = `- BDT ${discountInfo.amount}`;
            }
        }
    }

    /* ── PRODUCT SCRAPING & SETUP ──────────────────────────────── */

    function setupIndividualPage() {
        const mainBtn = document.getElementById('main-add-to-cart');
        if (!mainBtn) return;

        const nameEl = document.querySelector('.productName');
        const codeEl = document.querySelector('.productCode');
        const priceEl = document.querySelector('.productPrice .offer-price');
        const imgEl = document.getElementById('mainImage');

        if (!nameEl || !codeEl) return;

        const product = {
            id: codeEl.textContent.trim(),
            name: nameEl.textContent.trim(),
            code: codeEl.textContent.trim(),
            price: parseFloat(priceEl?.textContent.replace(/[^0-9.]/g, '') || '0'),
            img: imgEl ? imgEl.getAttribute('src') : '',
            priceSource: 'product-page',
        };

        PRODUCTS.push(product);
        const saved = JSON.parse(localStorage.getItem(PROD_KEY) || '{}');
        saved[product.id] = product;
        localStorage.setItem(PROD_KEY, JSON.stringify(saved));

        if (mainBtn.dataset.cartBound !== 'true') {
            mainBtn.dataset.cartBound = 'true';
            mainBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const qtyInput = document.getElementById('main-product-qty');
                const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
                ROCart.addItem(product.id, qty);
            });
        }
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
            const productId = codeEl ? codeEl.textContent.trim() : `p-${idx}`;
            const shopPrice = parseFloat(priceEl?.textContent.replace(/[^0-9.]/g, '') || '0');
            const existingEntry = saved[productId];
            const finalPrice = (existingEntry && existingEntry.priceSource === 'product-page') ? existingEntry.price : shopPrice;
            const product = {
                id: productId,
                name: nameEl.textContent.trim(),
                code: codeEl ? codeEl.textContent.trim() : '',
                price: finalPrice,
                img: card.querySelector('img')?.getAttribute('src') || '',
                priceSource: (existingEntry && existingEntry.priceSource === 'product-page') ? 'product-page' : 'shop-page',
            };
            products.push(product);
            saved[product.id] = product;
            const addBtn = card.querySelector('.add-to-cart');
            // Shared marker with render-products.js — whichever script binds
            // first sets this, and the other skips re-binding. Without this,
            // a card rendered dynamically (e.g. New Arrivals) that finishes
            // loading before this scan runs would get bound TWICE: once here,
            // once by render-products.js — doubling the quantity per click.
            if (addBtn && addBtn.dataset.cartBound !== 'true') {
                addBtn.dataset.cartBound = 'true';
                addBtn.addEventListener('click', (e) => { e.preventDefault(); ROCart.addItem(product.id, 1); });
            }
        });
        localStorage.setItem(PROD_KEY, JSON.stringify(saved));
        Object.values(saved).forEach(p => { if (!products.find(x => x.id === p.id)) products.push(p); });
        return products;
    }

    /* ── WHATSAPP & MISC ────────────────────────────────── */

    function orderWhatsApp() {
        const cart = getCart();
        if (cart.length === 0) return;
        if (!validateCustomerInfo()) return;

        const info = getCustomerInfo();
        saveCustomerInfo();

        const discountInfo = calcDiscount(cart);
        let total = 0;
        let lines = [];

        cart.forEach((item, idx) => {
            const p = findProduct(item.id);
            if (!p) return;
            const sub = fmt(p.price * item.qty);
            total = fmt(total + sub);
            const codeLabel = p.code || p.id;
            let line = `${idx + 1}. Code: ${codeLabel}\n   Qty: ${item.qty} × BDT ${p.price} = BDT ${sub}`;
            if (discountInfo.targetId === p.id && discountInfo.amount > 0) {
                line += `\n   🎟 Coupon ${APPLIED_COUPON.code}: -BDT ${discountInfo.amount}`;
            }
            lines.push(line);
        });

        const discount = discountInfo.amount;
        const delivery = getDeliveryCharge();
        const deliveryLabel = getDeliveryLabel();
        const pickup = isSelfPickup();

        let customerBlock = '';
        if (getEl('cust-name')) {
            customerBlock = `👤 *Customer Details*\n`
                + `Name: ${info.name || '-'}\n`
                + `Phone: ${info.phone || '-'}\n`
                + `Delivery: ${deliveryLabel}\n`
                + (pickup
                    ? `Pickup Point: ${PICKUP_LOCATION}\n`
                    : `Address: ${info.location || '-'}\n`)
                + `\n`;
        }

        const message = `🛒 *Order from ${STORE_NAME}*\n\n${customerBlock}📦 *Items*\n${lines.join('\n\n')}\n\n─────────────────\n${(APPLIED_COUPON && discount > 0) ? `🎟 *Coupon: ${APPLIED_COUPON.code}* - BDT ${discount}\n` : ''}🛵 *Delivery: ${delivery === 0 ? 'Free' : `BDT ${delivery}`}*\n💰 *Total: BDT ${fmt(total - discount + delivery)}*\n─────────────────\nPlease confirm! `;
        window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
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

    function injectDynamicStyles() {
        if (document.getElementById('ro-cart-dynamic-style')) return;
        const style = document.createElement('style');
        style.id = 'ro-cart-dynamic-style';
        style.textContent = `
            .ro-item-strike, .co-item-strike {
                text-decoration: line-through;
                color: #94a3b8;
                font-weight: 400;
                margin-right: 6px;
                font-size: 0.85em;
            }
            .cart-coupon-remove {
                background: none;
                border: none;
                color: #dc2626;
                font-size: 0.72rem;
                font-weight: 600;
                text-decoration: underline;
                cursor: pointer;
                padding: 0;
                margin-left: 4px;
            }
            .cart-coupon-remove:hover { color: #b91c1c; }
        `;
        document.head.appendChild(style);
    }

    /* ── EVENT DELEGATION ──────────────────────────────────── */
    function bindDelegatedEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');

            if (action === 'inc' && id) ROCart.changeQty(id, 1);
            else if (action === 'dec' && id) ROCart.changeQty(id, -1);
            else if (action === 'remove' && id) ROCart.removeItem(id);
            else if (action === 'remove-coupon') ROCart.removeCoupon();
        });
    }

    /* ── INIT ────────────────────────────────────────────── */

    function init() {
        injectDynamicStyles();
        bindDelegatedEvents();

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

        PRODUCTS = scrapeShopProducts();

        const _saved = JSON.parse(localStorage.getItem(PROD_KEY) || '{}');
        PRODUCTS = PRODUCTS.map(p => {
            const ls = _saved[p.id];
            return (ls && ls.priceSource === 'product-page') ? { ...p, price: ls.price } : p;
        });

        setupIndividualPage();
        loadCustomerInfo();
        loadDeliveryPreference();

        updateUI();

        const inside = getEl('delivery-inside');
        const outside = getEl('delivery-outside');
        const pickup = getEl('delivery-pickup');
        [inside, outside, pickup].forEach(el => {
            if (el) el.addEventListener('change', () => { saveDeliveryPreference(); syncDeliveryUI(); updateUI(); });
        });
        syncDeliveryUI();

        window.addEventListener('storage', (e) => {
            if (e.key === CART_KEY || e.key === COUPON_KEY) updateUI();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.ROCart = {
        addItem, changeQty, removeItem, clearCart, openDrawer, closeDrawer,
        orderWhatsApp, applyCoupon, removeCoupon
    };

    window.coApplyCoupon = function() { ROCart.applyCoupon(); };
    window.coOrderWhatsApp = function() { ROCart.orderWhatsApp(); };
    window.changeQty = function(id, delta) { ROCart.changeQty(id, delta); };
    window.removeItem = function(id) { ROCart.removeItem(id); };

})();