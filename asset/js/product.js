// ── Navbar ────────────────────────────────────────────────
const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
        mobileMenu.classList.toggle("hidden");
    });
}

// ── Tabs ──────────────────────────────────────────────────
function openTab(evt, tabId) {
    document.querySelectorAll('.tabcontent').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tablink').forEach(el => {
        el.classList.remove('text-blue-600', 'border-blue-600');
        el.classList.add('text-gray-600', 'border-transparent');
    });
    document.getElementById(tabId).classList.remove('hidden');
    evt.currentTarget.classList.remove('text-gray-600', 'border-transparent');
    evt.currentTarget.classList.add('text-blue-600', 'border-blue-600');
}

// ── Image Gallery (only runs on product detail pages) ─────
(function () {
    const mainImage      = document.getElementById('mainImage');
    const thumbnailTrack = document.getElementById('thumbnailTrack');
    const prevBtn        = document.getElementById('prevBtn');
    const nextBtn        = document.getElementById('nextBtn');
    const thumbnails     = document.querySelectorAll('.product-thumbnail');

    if (!mainImage || !thumbnailTrack || !prevBtn || !nextBtn || thumbnails.length === 0) return;

    const VISIBLE_THUMBNAILS = 3;
    let currentIndex = 0;
    let thumbnailOffset = 0;

    function initGallery() {
        thumbnails.forEach(thumb => {
            thumb.style.width = `calc((100% - ${(VISIBLE_THUMBNAILS - 1) * 12}px) / ${VISIBLE_THUMBNAILS})`;
        });
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', () => selectImage(index));
        });
        updateMainImage(0);
        updateNavigationButtons();
    }

    function updateMainImage(index) {
        currentIndex = index;
        const img = thumbnails[index].querySelector('img');
        mainImage.src = img.src;
        mainImage.alt = img.alt;
        thumbnails.forEach((thumb, i) => {
            if (i === index) {
                thumb.classList.remove('border-gray-200', 'hover:border-gray-400');
                thumb.classList.add('border-blue-500', 'ring-2', 'ring-blue-200');
            } else {
                thumb.classList.remove('border-blue-500', 'ring-2', 'ring-blue-200');
                thumb.classList.add('border-gray-200', 'hover:border-gray-400');
            }
        });
    }

    function selectImage(index) {
        updateMainImage(index);
        if (index < thumbnailOffset) {
            thumbnailOffset = index;
            scrollThumbnails();
        } else if (index >= thumbnailOffset + VISIBLE_THUMBNAILS) {
            thumbnailOffset = index - VISIBLE_THUMBNAILS + 1;
            scrollThumbnails();
        }
        updateNavigationButtons();
    }

    function scrollThumbnails() {
        const thumbnailWidth = thumbnails[0].offsetWidth;
        const gap = 12;
        thumbnailTrack.style.transform = `translateX(${-(thumbnailOffset * (thumbnailWidth + gap))}px)`;
    }

    function navigateLeft() {
        if (thumbnailOffset > 0) {
            thumbnailOffset--;
            scrollThumbnails();
            updateNavigationButtons();
        }
    }

    function navigateRight() {
        const maxOffset = Math.max(0, thumbnails.length - VISIBLE_THUMBNAILS);
        if (thumbnailOffset < maxOffset) {
            thumbnailOffset++;
            scrollThumbnails();
            updateNavigationButtons();
        }
    }

    function updateNavigationButtons() {
        const maxOffset = Math.max(0, thumbnails.length - VISIBLE_THUMBNAILS);
        prevBtn.disabled = thumbnailOffset === 0;
        nextBtn.disabled = thumbnailOffset >= maxOffset;
        const show = thumbnails.length > VISIBLE_THUMBNAILS;
        prevBtn.style.display = show ? 'block' : 'none';
        nextBtn.style.display = show ? 'block' : 'none';
    }

    prevBtn.addEventListener('click', navigateLeft);
    nextBtn.addEventListener('click', navigateRight);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGallery);
    } else {
        initGallery();
    }
})();

// ── Mobile Search Sync ────────────────────────────────────
const mobileSearch  = document.getElementById('searchInputMobile');
const desktopSearch = document.getElementById('searchInput');
if (mobileSearch && desktopSearch) {
    mobileSearch.addEventListener('input', function () {
        desktopSearch.value = this.value;
        desktopSearch.dispatchEvent(new Event('input'));
    });
}

// ── Category Sidebar Toggle ───────────────────────────────
function toggleCat(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const isOpen = !el.classList.contains('hidden');
    el.classList.toggle('hidden', isOpen);
    const btn = el.previousElementSibling;
    if (btn) {
        const arrow = btn.querySelector('.cat-arrow');
        if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
    }
}

function toggleMobileSidebar() {
    const el = document.getElementById('mobile-sidebar');
    if (el) el.classList.toggle('hidden');
}

// ── Filter State ──────────────────────────────────────────
var activeCategory = 'all';
var activePriceMin = 0;
var activePriceMax = 999999;

// ── Pagination State (declared before applyFilters) ───────
var currentPage  = 1;
var itemsPerPage = 20;

// ── Category Filter ───────────────────────────────────────
function filterCategory(cat) {
    activeCategory = cat;
    activePriceMin = 0;
    activePriceMax = 999999;

    document.querySelectorAll('.price-filter-btn').forEach(function(b) {
        b.classList.remove('text-blue-600', 'font-semibold', 'bg-blue-50');
    });

    applyFilters();

    var sidebar = document.getElementById('mobile-sidebar');
    if (sidebar && window.innerWidth < 1024) {
        sidebar.classList.add('hidden');
    }

    var label = document.getElementById('active-filter-label');
    var name  = document.getElementById('active-filter-name');
    if (label && name) {
        if (cat === 'all') {
            label.classList.add('hidden');
        } else {
            name.textContent = cat.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
            label.classList.remove('hidden');
        }
    }

    document.querySelectorAll('.cat-leaf').forEach(function(b) {
        var isActive = (b.getAttribute('onclick') || '').indexOf("'" + cat + "'") !== -1;
        b.classList.toggle('text-blue-600', isActive);
        b.classList.toggle('font-semibold', isActive);
    });
}

// ── Price Filter ──────────────────────────────────────────
function filterPrice(min, max) {
    activePriceMin = min;
    activePriceMax = max;
    if (min === 0 && max === 999999) activeCategory = 'all';

    document.querySelectorAll('.cat-leaf').forEach(function(b) {
        b.classList.remove('text-blue-600', 'font-semibold');
    });

    applyFilters();

    document.querySelectorAll('.price-filter-btn').forEach(function(b) {
        var isActive = (b.getAttribute('onclick') || '') === 'filterPrice(' + min + ', ' + max + ')';
        b.classList.toggle('text-blue-600', isActive);
        b.classList.toggle('font-semibold', isActive);
        b.classList.toggle('bg-blue-50', isActive);
    });
}

// ── Apply Filters ─────────────────────────────────────────
function applyFilters() {
    var cards = document.querySelectorAll('#product-grid .product-card');

    cards.forEach(function(card) {
        var cardCat  = (card.getAttribute('data-category') || '').toLowerCase().trim();
        var catSlugs = cardCat.split(/\s+/);
        var catMatch = activeCategory === 'all' || catSlugs.indexOf(activeCategory) !== -1;

        var priceEl  = card.querySelector('.productPrice .offer-price');
        var price    = priceEl ? parseInt(priceEl.textContent.replace(/[^0-9]/g, ''), 10) || 0 : 0;
        var priceMatch = price >= activePriceMin && price <= activePriceMax;

        if (catMatch && priceMatch) {
            delete card.dataset.pgHidden;
        } else {
            card.dataset.pgHidden = '1';
        }
    });

    currentPage = 1;
    renderPage(1);
}

// ── Pagination ────────────────────────────────────────────
function renderPage(page) {
    var cards      = Array.from(document.querySelectorAll('#product-grid .product-card'));
    var visible    = cards.filter(function(c) { return !c.dataset.pgHidden; });
    var total      = visible.length;
    var totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

    currentPage = Math.max(1, Math.min(page, totalPages));

    var start = (currentPage - 1) * itemsPerPage;
    var end   = start + itemsPerPage;

    // Hide all first
    cards.forEach(function(card) {
        card.style.display = 'none';
    });

    // Show only current page slice of visible cards
    visible.forEach(function(card, idx) {
        card.style.display = (idx >= start && idx < end) ? '' : 'none';
    });

    var noResults = document.getElementById('no-results');
    if (noResults) noResults.classList.toggle('hidden', total > 0);

    renderPaginationControls(totalPages, total);
}

function renderPaginationControls(totalPages, totalVisible) {
    var wrap      = document.getElementById('pagination-wrap');
    var numbersEl = document.getElementById('pg-numbers');
    var prevBtn   = document.getElementById('pg-prev');
    var nextBtn   = document.getElementById('pg-next');

    if (!wrap || !numbersEl) return;

    if (totalPages <= 1) {
        wrap.classList.add('hidden');
        return;
    }

    wrap.classList.remove('hidden');
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    // Build page set: always 1, last, current, ±2 neighbors
    var pages = new Set();
    pages.add(1);
    pages.add(totalPages);
    pages.add(currentPage);
    for (var i = currentPage - 2; i <= currentPage + 2; i++) {
        if (i >= 1 && i <= totalPages) pages.add(i);
    }

    var sorted = Array.from(pages).sort(function(a, b) { return a - b; });

    numbersEl.innerHTML = '';
    var prev = null;

    sorted.forEach(function(pg) {
        if (prev !== null && pg - prev > 1) {
            var dots = document.createElement('span');
            dots.textContent = '…';
            dots.className = 'px-2 py-2 text-sm text-gray-400 select-none';
            numbersEl.appendChild(dots);
        }

        var btn = document.createElement('button');
        btn.textContent = pg;
        btn.onclick = (function(p) { return function() { changePage(p); }; })(pg);

        if (pg === currentPage) {
            btn.className = 'w-9 h-9 text-sm font-bold text-white bg-blue-600 border border-blue-600 rounded-lg transition-all duration-200';
        } else {
            btn.className = 'w-9 h-9 text-sm font-medium text-slate-600 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200';
        }

        numbersEl.appendChild(btn);
        prev = pg;
    });
}

function changePage(page) {
    renderPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initPagination() {
    document.querySelectorAll('#product-grid .product-card').forEach(function(card) {
        delete card.dataset.pgHidden;
    });
    renderPage(1);
}

// ── Coupon Persistence ────────────────────────────────────
const COUPON_STORAGE_KEY = 'robo_orion_coupon';

function saveCouponToStorage(coupon) {
    if (coupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
    } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
    }
}

function loadCouponFromStorage() {
    try {
        var saved = localStorage.getItem(COUPON_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
}

// ── Search ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // Init pagination on shop page
    if (document.getElementById('product-grid')) {
        initPagination();
    }

    const searchInput  = document.getElementById('searchInput');
    const clearBtn     = document.getElementById('clearSearch');
    const resultsCount = document.getElementById('resultsCount');

    if (!searchInput) return;

    const hasGrid = !!document.getElementById('product-grid');

    function normalize(t) {
        return t.replace(/[\s\-_.,/#!$%^&*;:{}=`~()]/g, '').toLowerCase();
    }

    function scoreCard(card) {
        const name  = card.querySelector('.productName')?.textContent.toLowerCase()  || '';
        const code  = card.querySelector('.productCode')?.textContent.toLowerCase()  || '';
        const brand = card.querySelector('.productBrand')?.textContent.toLowerCase() || '';
        const cat   = (card.getAttribute('data-category') || '').toLowerCase();

        const fullText  = name + ' ' + code + ' ' + brand + ' ' + cat;
        const normText  = normalize(fullText);
        const normQuery = normalize(searchTerm);
        const words     = searchTerm.split(/\s+/).filter(w => w.length > 0);

        let score = 0;

        if (name.includes(searchTerm))  score += 100;
        if (code.includes(searchTerm))  score += 80;
        if (brand.includes(searchTerm)) score += 60;
        if (normText.includes(normQuery)) score += 50;

        words.forEach(function(word) {
            if (name.includes(word))    score += 30;
            if (code.includes(word))    score += 25;
            if (brand.includes(word))   score += 20;
            if (cat.includes(word))     score += 15;
            if (normText.includes(normalize(word))) score += 10;
        });

        words.forEach(function(word) {
            if (word.length < 4) return;
            const targets = [name, code, brand];
            targets.forEach(function(target) {
                for (var i = 0; i <= word.length - 3; i++) {
                    var chunk = word.substring(i, i + 3);
                    if (target.includes(chunk)) { score += 5; break; }
                }
            });
        });

        words.forEach(function(word) {
            if (name.startsWith(word))  score += 20;
            if (code.startsWith(word))  score += 15;
        });

        return score;
    }

    var searchTerm = '';

    function performSearch() {
        if (!hasGrid) return;

        searchTerm = searchInput.value.toLowerCase().trim();
        const grid  = document.getElementById('product-grid');
        const cards = Array.from(document.querySelectorAll('#product-grid .product-card'));

        if (!searchTerm) {
            // Clear search — reset pgHidden and re-paginate
            cards.forEach(function(card) { delete card.dataset.pgHidden; });
            currentPage = 1;
            renderPage(1);
            const label = document.getElementById('search-label');
            if (label) { label.textContent = ''; label.classList.add('hidden'); }
            if (resultsCount) resultsCount.textContent = '';
            return;
        }

        const MIN_SCORE = 10;

        // Score and sort
        const scored = cards.map(function(card) {
            return { card: card, score: scoreCard(card) };
        });
        scored.sort(function(a, b) { return b.score - a.score; });

        // Reorder cards in DOM by score, mark pgHidden for low scorers
        var visible = 0;
        scored.forEach(function(item) {
            if (item.score >= MIN_SCORE) {
                delete item.card.dataset.pgHidden;
                grid.appendChild(item.card);
                visible++;
            } else {
                item.card.dataset.pgHidden = '1';
            }
        });

        // Reset to page 1 and paginate
        currentPage = 1;
        renderPage(1);

        const label = document.getElementById('search-label');
        if (label) {
            label.textContent = visible > 0
                ? `Showing ${visible} result${visible !== 1 ? 's' : ''} for "${searchTerm}"`
                : `No results found for "${searchTerm}"`;
            label.classList.remove('hidden');
        }

        if (resultsCount) {
            resultsCount.textContent = visible > 0
                ? `${visible} product${visible !== 1 ? 's' : ''} found`
                : '';
        }

        if (searchTerm && typeof activeCategory !== 'undefined') {
            activeCategory = 'all';
        }
    }

    function redirectToSearch() {
        const q = searchInput.value.trim();
        if (!q) return;
        const isSubDir = window.location.pathname.includes('/products/');
        const base = isSubDir ? '../product.html' : 'product.html';
        window.location.href = base + '?search=' + encodeURIComponent(q);
    }

    window.clearSearch = function () {
        searchInput.value = '';
        clearBtn?.classList.add('hidden');

        if (hasGrid) {
            document.querySelectorAll('#product-grid .product-card').forEach(function(card) {
                delete card.dataset.pgHidden;
            });
            currentPage = 1;
            renderPage(1);
            const label = document.getElementById('search-label');
            if (label) { label.textContent = ''; label.classList.add('hidden'); }
            if (resultsCount) resultsCount.textContent = '';
            const url = new URL(window.location);
            url.searchParams.delete('search');
            window.history.replaceState({}, '', url);
        }

        searchInput.focus();
    };

    searchInput.addEventListener('input', function() {
        clearBtn?.classList.toggle('hidden', searchInput.value === '');
        if (hasGrid) performSearch();
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') window.clearSearch();
        if (e.key === 'Enter') {
            if (hasGrid) performSearch();
            else redirectToSearch();
        }
    });

    if (hasGrid) {
        const q = new URLSearchParams(window.location.search).get('search');
        if (q) {
            searchInput.value = q;
            clearBtn?.classList.remove('hidden');
            performSearch();
        }
    }

    const allCards = document.querySelectorAll('#product-grid .product-card');
    console.log('Search initialized. Found ' + allCards.length + ' products');
});

// ── Auto-calculate discount badges ───────────────────────
function calcDiscountBadges() {
    document.querySelectorAll('.product-card').forEach(function(card) {
        const badge      = card.querySelector('.productDiscount');
        const offerEl    = card.querySelector('.offer-price');
        const originalEl = card.querySelector('.originalPrice');

        if (!badge || !offerEl || !originalEl) return;

        const offer    = parseInt(offerEl.textContent.replace(/[^0-9]/g, ''), 10);
        const original = parseInt(originalEl.textContent.replace(/[^0-9]/g, ''), 10);

        if (!offer || !original || original <= offer) {
            badge.style.display = 'none';
            return;
        }

        const percent = Math.round((original - offer) / original * 100);
        badge.textContent = '–' + percent + '%';
        badge.style.display = '';
    });
}

document.addEventListener('DOMContentLoaded', calcDiscountBadges);

// ── FAQ Toggle ────────────────────────────────────────────
document.querySelectorAll('.faq-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var answer = this.nextElementSibling;
        var icon   = this.querySelector('.faq-icon');
        var isOpen = !answer.classList.contains('hidden');
        answer.classList.toggle('hidden', isOpen);
        icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        this.setAttribute('aria-expanded', String(!isOpen));
    });
});