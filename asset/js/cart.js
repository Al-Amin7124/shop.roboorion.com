/* ============================================================
   Robo Orion – Cart System  (cart.js)
   Drop this file in: asset/js/cart.js
   Add to product.html before </body>: <script src="asset/js/cart.js"></script>

   HOW IT WORKS:
   - Reads product data from the existing .product-card elements on your page
   - Stores cart in localStorage (persists across page refreshes)
   - "Order via WhatsApp" sends a formatted message to your WA number
   ============================================================ */

(function () {
    'use strict';

    /* ── CONFIG ──────────────────────────────────────────── */
    const WA_NUMBER  = '8801999506021';
    const CART_KEY   = 'robo_orion_cart';
    const STORE_NAME = 'Robo Orion';

    /* ── INJECT HTML ─────────────────────────────────────── */
    document.body.insertAdjacentHTML('beforeend', `
        <!-- FAB -->
        <button id="ro-cart-fab" class="hidden" onclick="ROCart.openDrawer()">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Cart
            <span class="fab-count" id="ro-fab-count">0</span>
        </button>

        <!-- Overlay -->
        <div id="ro-cart-overlay" onclick="ROCart.closeDrawer()"></div>

        <!-- Drawer -->
        <div id="ro-cart-drawer">
            <div class="ro-cart-header">
                <div class="ro-cart-header-left">
                    <svg width="18" height="18" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
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

                <!-- Delivery Options -->
                <div class="ro-delivery-section">
                    <div class="ro-delivery-label">🚚 Delivery Area</div>
                    <div class="ro-delivery-options">
                        <label class="ro-delivery-option active" id="ro-delivery-inside-label">
                            <input type="radio" name="ro-delivery" id="ro-delivery-inside" value="70" checked>
                            <span class="ro-delivery-name">Inside Dhaka</span>
                            <span class="ro-delivery-price">BDT 70</span>
                        </label>
                        <label class="ro-delivery-option" id="ro-delivery-outside-label">
                            <input type="radio" name="ro-delivery" id="ro-delivery-outside" value="120">
                            <span class="ro-delivery-name">Outside Dhaka</span>
                            <span class="ro-delivery-price">BDT 120</span>
                        </label>
                    </div>
                </div>

                <div class="ro-summary-row">
                    <span>Products</span>
                    <span id="ro-products-subtotal"></span>
                </div>
                <div class="ro-summary-row">
                    <span>Delivery</span>
                    <span id="ro-delivery-charge">BDT 70</span>
                </div>
                <div class="ro-total-row">
                    <span>Total</span>
                    <span id="ro-total-price"></span>
                </div>
                <button class="ro-whatsapp-btn" onclick="ROCart.orderWhatsApp()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Order via WhatsApp
                </button>
                <button class="ro-clear-btn" onclick="ROCart.clearCart()">🗑 Clear Cart</button>
            </div>
        </div>

        <!-- Toast -->
        <div id="ro-toast"></div>
    `);

    /* ── PRODUCT DATA (scraped from page cards) ──────────── */
    function scrapeProducts() {
        const saved = JSON.parse(localStorage.getItem('robo_orion_products') || '{}');
        const cards = document.querySelectorAll('.product-card');
        const products = [];

        cards.forEach((card, idx) => {
            const nameEl  = card.querySelector('.productName');
            const codeEl  = card.querySelector('.productCode');
            var priceEl = card.querySelector('.productPrice .offer-price');
            const imgEl   = card.querySelector('img');

            if (!nameEl) return;

            const priceText = priceEl ? priceEl.textContent.replace(/[^0-9]/g, '') : '0';
            const product = {
                id:    codeEl ? codeEl.textContent.trim() : `product-${idx}`,
                name:  nameEl.textContent.trim(),
                code:  codeEl ? codeEl.textContent.trim() : '',
                price: parseInt(priceText, 10) || 0,
                img:   imgEl ? imgEl.getAttribute('src') : '',
            };

            products.push(product);
            saved[product.id] = product;

            const anchor = card.querySelector('a[href*="m.me"]');
            if (anchor) {
                const productId = product.id;
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    ROCart.addItem(productId);
                });
            }
        });

        // Persist master product list
        localStorage.setItem('robo_orion_products', JSON.stringify(saved));

        // Merge saved products so all pages know about all products
        Object.values(saved).forEach(p => {
            if (!products.find(x => x.id === p.id)) products.push(p);
        });

        return products;
    }

    /* ── CART STORAGE ────────────────────────────────────── */
    function getCart() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
        catch { return []; }
    }
    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    /* ── PRODUCT LOOKUP ──────────────────────────────────── */
    let PRODUCTS = [];

    function fixImagePath(img) {
        if (!img) return '';
        const isProductPage = window.location.pathname.includes('/products/');
        if (isProductPage && !img.startsWith('../') && !img.startsWith('http')) {
            return '../' + img;
        }
        if (!isProductPage && img.startsWith('../')) {
            return img.replace('../', '');
        }
        return img;
    }

    function findProduct(id) {
        const inMemory = PRODUCTS.find(p => p.id === id);
        if (inMemory) {
            return { ...inMemory, img: fixImagePath(inMemory.img) };
        }
        const saved = JSON.parse(localStorage.getItem('robo_orion_products') || '{}');
        if (saved[id]) {
            const product = { ...saved[id], img: fixImagePath(saved[id].img) };
            PRODUCTS.push(product);
            return product;
        }
        return null;
    }

    /* ── CART ACTIONS ────────────────────────────────────── */
    function addItem(id) {
        const cart = getCart();
        const existing = cart.find(i => i.id === id);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ id, qty: 1 });
        }
        saveCart(cart);
        updateUI();
        bumpBadge();
        const p = findProduct(id);
        if (p) showToast(`✅ ${p.name.substring(0, 35)}... added!`);
        highlightBtn(id);
    }

    function changeQty(id, delta) {
        const cart = getCart();
        const item = cart.find(i => i.id === id);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) {
            cart.splice(cart.indexOf(item), 1);
        }
        saveCart(cart);
        updateUI();
    }

    function removeItem(id) {
        saveCart(getCart().filter(i => i.id !== id));
        updateUI();
        showToast('Item removed from cart');
    }

    function clearCart() {
        saveCart([]);
        updateUI();
        showToast('Cart cleared');
    }

    /* ── WHATSAPP ORDER ──────────────────────────────────── */
    function orderWhatsApp() {
        const cart = getCart();
        if (cart.length === 0) return;

        let total = 0;
        let lines = [];

        cart.forEach((item, idx) => {
            const p = findProduct(item.id);
            if (!p) return;
            const subtotal = p.price * item.qty;
            total += subtotal;
            lines.push(`${idx + 1}. ${p.name}\n   Code: ${p.code}\n   Qty: ${item.qty} × BDT ${p.price} = BDT ${subtotal}`);
        });

        const message =
        `🛒 *New Order from ${STORE_NAME}*

        ${lines.join('\n\n')}

       ─────────────────
        🛵 *Delivery: ${getDeliveryCharge() === 70 ? 'Inside Dhaka' : 'Outside Dhaka'} — BDT ${getDeliveryCharge()}*
        💰 *Total: BDT ${total + getDeliveryCharge()}*
        ─────────────────
        Please confirm my order. Thank you! 🙏`;

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${WA_NUMBER}?text=${encoded}`, '_blank');
    }

    /* ── UI RENDER ───────────────────────────────────────── */
    function updateUI() {
        const cart     = getCart();
        const totalQty = cart.reduce((s, i) => s + i.qty, 0);
        const total    = cart.reduce((s, i) => {
            const p = findProduct(i.id);
            return s + (p ? p.price * i.qty : 0);
        }, 0);

        // FAB
        const fab = document.getElementById('ro-cart-fab');
        const fabCount = document.getElementById('ro-fab-count');
        if (totalQty > 0) {
            fab.classList.remove('hidden');
            fabCount.textContent = totalQty;
        } else {
            fab.classList.add('hidden');
        }

        // Nav badges
        ['nav-cart-count', 'nav-cart-count-mobile'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = totalQty;
            el.classList.toggle('hidden', totalQty === 0);
        });

        // Header badge
        const badge = document.getElementById('ro-header-badge');
        if (badge) badge.textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;

        // Items
        const itemsEl  = document.getElementById('ro-cart-items');
        const footerEl = document.getElementById('ro-cart-footer');

        if (cart.length === 0) {
            itemsEl.innerHTML = `
                <div class="ro-empty">
                    <svg width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.3" viewBox="0 0 24 24">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    <p>Your cart is empty</p>
                    <span>Add products to get started</span>
                </div>`;
            footerEl.style.display = 'none';
            return;
        }

        footerEl.style.display = 'block';

        itemsEl.innerHTML = cart.map(item => {
            const p = findProduct(item.id);
            if (!p) return '';
            const subtotal = p.price * item.qty;
            return `
                <div class="ro-cart-item">
                    <img class="ro-item-img" src="${p.img}" alt="${p.name}" onerror="this.style.background='#f1f5f9';this.src=''">
                    <div class="ro-item-info">
                        <div class="ro-item-name">${p.name}</div>
                        <div class="ro-item-code">${p.code}</div>
                        <div class="ro-item-price">BDT ${p.price}</div>
                    </div>
                    <div class="ro-qty-wrap">
                        <div class="ro-qty-controls">
                            <button class="ro-qty-btn" onclick="ROCart.changeQty('${p.id}', -1)">−</button>
                            <span class="ro-qty-num">${item.qty}</span>
                            <button class="ro-qty-btn" onclick="ROCart.changeQty('${p.id}', 1)">+</button>
                        </div>
                        <div class="ro-item-subtotal">BDT ${subtotal}</div>
                        <button class="ro-remove-btn" onclick="ROCart.removeItem('${p.id}')">✕ remove</button>
                    </div>
                </div>`;
        }).join('');

        document.getElementById('ro-item-count-label').textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
        document.getElementById('ro-products-subtotal').textContent = `BDT ${total}`;

        // Delivery charge
        const deliveryCharge = getDeliveryCharge();
        document.getElementById('ro-delivery-charge').textContent = `BDT ${deliveryCharge}`;
        document.getElementById('ro-total-price').textContent = `BDT ${total + deliveryCharge}`;
    }

    /* ── DRAWER ──────────────────────────────────────────── */
    function openDrawer() {
        document.getElementById('ro-cart-drawer').classList.add('open');
        document.getElementById('ro-cart-overlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        document.getElementById('ro-cart-drawer').classList.remove('open');
        document.getElementById('ro-cart-overlay').classList.remove('open');
        document.body.style.overflow = '';
    }

    /* ── TOAST ───────────────────────────────────────────── */
    let toastTmr;
    function showToast(msg) {
        const t = document.getElementById('ro-toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTmr);
        toastTmr = setTimeout(() => t.classList.remove('show'), 2600);
    }

    /* ── BADGE BUMP ──────────────────────────────────────── */
    function bumpBadge() {
        const el = document.getElementById('ro-fab-count');
        if (!el) return;
        el.classList.add('bump');
        setTimeout(() => el.classList.remove('bump'), 300);
    }

    /* ── BUTTON HIGHLIGHT ────────────────────────────────── */
    function highlightBtn(id) {
        // Highlight main add-to-cart button on product detail page
        const mainBtn  = document.getElementById('main-add-to-cart');
        const mainCode = document.querySelector('#main-add-to-cart ~ * .productCode, .productCode');
        if (mainBtn && mainCode && mainCode.textContent.trim() === id) {
            mainBtn.classList.add('ro-added');
            mainBtn.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Added!';
            setTimeout(() => {
                mainBtn.classList.remove('ro-added');
                mainBtn.innerHTML = '<i class="fa-solid fa-cart-shopping mr-2"></i>Add to Cart';
            }, 1800);
        }

        // Highlight product card buttons on listing page
        document.querySelectorAll('.product-card').forEach(card => {
            const codeEl = card.querySelector('.productCode');
            if (codeEl && codeEl.textContent.trim() === id) {
                const btn = card.querySelector('button');
                if (btn) {
                    btn.classList.add('ro-added');
                    btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Added!';
                    setTimeout(() => {
                        btn.classList.remove('ro-added');
                        btn.innerHTML = '<i class="fa-solid fa-cart-shopping mr-2"></i>Add to Cart';
                    }, 1800);
                }
            }
        });
    }

    /* ── INDIVIDUAL PRODUCT PAGE SETUP ──────────────────── */
    function scrapeJsonLd() {
        // Only run on individual product pages
        if (!window.location.pathname.includes('/products/')) return;

        const btn      = document.getElementById('main-add-to-cart');
        const qtyInput = document.getElementById('main-product-qty');

        if (!btn || btn.dataset.hooked) return;
        btn.dataset.hooked = 'true';

        // Read product data from the page HTML using consistent classes
        const infoCol = document.querySelector('#main-add-to-cart')?.closest('div[class*="col-span"]');

        const nameEl  = infoCol?.querySelector('.productName');
        const codeEl  = infoCol?.querySelector('.productCode');
        const priceEl = document.querySelector('.productPrice .offer-price');
        const imgEl   = document.getElementById('mainImage');

        const product = {
            id:    codeEl ? codeEl.textContent.trim() : 'main-' + window.location.pathname.split('/').pop().replace('.html', ''),
            name:  nameEl ? nameEl.textContent.trim() : document.title,
            code:  codeEl ? codeEl.textContent.trim() : '',
            price: priceEl ? parseInt(priceEl.textContent.replace(/[^0-9]/g, '')) || 0 : 0,
            img:   imgEl ? fixImagePath(imgEl.getAttribute('src')) : '',
        };

        registerProduct(product);

        btn.addEventListener('click', function() {
            const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
            for (let i = 0; i < qty; i++) {
                ROCart.addItem(product.id);
            }
        });
    }

    /* ── INIT ────────────────────────────────────────────── */
    function getDeliveryCharge() {
    const outside = document.getElementById('ro-delivery-outside');
    return outside && outside.checked ? 120 : 70;
}

function initDeliveryListeners() {
    const inside  = document.getElementById('ro-delivery-inside');
    const outside = document.getElementById('ro-delivery-outside');
    const insideLabel  = document.getElementById('ro-delivery-inside-label');
    const outsideLabel = document.getElementById('ro-delivery-outside-label');

    if (!inside || !outside) return;

    inside.addEventListener('change', function() {
        insideLabel.classList.add('active');
        outsideLabel.classList.remove('active');
        updateUI();
    });

    outside.addEventListener('change', function() {
        outsideLabel.classList.add('active');
        insideLabel.classList.remove('active');
        updateUI();
    });
}

function init() {
    PRODUCTS = scrapeProducts();
    updateUI();
    setTimeout(scrapeJsonLd, 0);
    setTimeout(initDeliveryListeners, 0);

    window.addEventListener('storage', function(e) {
        if (e.key === CART_KEY) {
            updateUI();
        }
    });
}

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ── PUBLIC API ──────────────────────────────────────── */
    function registerProduct(product) {
        if (!PRODUCTS.find(p => p.id === product.id)) {
            PRODUCTS.push(product);
        }
        // Save to master product list so other pages can find it
        const saved = JSON.parse(localStorage.getItem('robo_orion_products') || '{}');
        saved[product.id] = product;
        localStorage.setItem('robo_orion_products', JSON.stringify(saved));
    }

    window.ROCart = { addItem, changeQty, removeItem, clearCart, openDrawer, closeDrawer, orderWhatsApp, registerProduct };

})();