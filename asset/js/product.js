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
        clearTimeout(searchDebounceTimer);
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

    let searchDebounceTimer = null;
    searchInput.addEventListener('input', function() {
        clearBtn?.classList.toggle('hidden', searchInput.value === '');
        if (!hasGrid) return;
        // Debounced — scoring + reordering ~185 cards on every single
        // keystroke is expensive; waiting briefly for typing to pause
        // keeps the input itself feeling instant regardless.
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(performSearch, 150);
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') window.clearSearch();
        if (e.key === 'Enter') {
            clearTimeout(searchDebounceTimer);
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

        const offer    = parseFloat(offerEl.textContent.replace(/[^0-9.]/g, ''));
        const original = parseFloat(originalEl.textContent.replace(/[^0-9.]/g, ''));

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


// whatsapp button hover
(function () {
  var PHONE_NUMBER = "+8801846253277"; // number
  var MESSAGE = "Hi Orion Shop! I'm interested in your products. Can you help me? 👋"; // Pre-filled message
  var style = document.createElement("style");
  style.innerHTML = [
    ".wa-float {",
    "  position: fixed;",
    "  bottom: 24px;",
    "  right: 24px;",
    "  width: 56px;",
    "  height: 56px;",
    "  border-radius: 50%;",
    "  background: #25D366;",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  z-index: 9999;",
    "  text-decoration: none;",
    "  box-shadow: 0 4px 16px rgba(37,211,102,0.4);",
    "  transition: transform 0.15s ease, box-shadow 0.15s ease;",
    "}",
    ".wa-float:hover {",
    "  transform: scale(1.1);",
    "  box-shadow: 0 6px 24px rgba(37,211,102,0.5);",
    "}",
    ".wa-float svg {",
    "  width: 30px;",
    "  height: 30px;",
    "  fill: #ffffff;",
    "}",
  ].join("\n");
  document.head.appendChild(style);

  var url =
    "https://wa.me/" +
    PHONE_NUMBER +
    "?text=" +
    encodeURIComponent(MESSAGE);

  var btn = document.createElement("a");
  btn.href = url;
  btn.target = "_blank";
  btn.rel = "noopener noreferrer";
  btn.className = "wa-float";
  btn.setAttribute("aria-label", "Chat on WhatsApp");
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M20.472 3.524A11.955 11.955 0 0 0 12.001 0C5.373 0 .001 5.373.001 12c0 2.116.553' +
    " 4.181 1.605 5.993L0 24l6.184-1.623A11.974 11.974 0 0 0 12.001 24c6.628 0 12-5.373" +
    " 12-12 0-3.205-1.248-6.219-3.529-8.476zM12.001 21.954a9.934 9.934 0 0 1-5.065-1.383l-.363" +
    "-.216-3.768.988 1.006-3.669-.237-.375A9.946 9.946 0 0 1 2.047 12c0-5.491 4.467-9.954" +
    " 9.955-9.954 2.66 0 5.157 1.036 7.035 2.916a9.885 9.885 0 0 1 2.916 7.036c.001 5.49" +
    "-4.466 9.956-9.952 9.956zm5.459-7.456c-.3-.149-1.77-.873-2.044-.972-.274-.099-.473-.149" +
    "-.673.15-.199.298-.771.971-.945 1.17-.175.199-.349.224-.648.075-.299-.149-1.262-.465" +
    "-2.403-1.484-.888-.791-1.488-1.77-1.662-2.068-.175-.299-.018-.46.131-.608.134-.134.299" +
    "-.349.448-.523.149-.175.199-.299.299-.498.099-.199.049-.374-.025-.523-.075-.149-.673" +
    "-1.621-.922-2.219-.242-.583-.488-.503-.673-.513-.174-.009-.373-.011-.572-.011s-.523.075" +
    "-.797.374c-.274.299-1.046 1.021-1.046 2.49 0 1.47 1.071 2.89 1.22 3.088.149.199 2.108" +
    " 3.219 5.108 4.512.714.308 1.271.492 1.705.63.717.228 1.37.196 1.887.119.575-.086" +
    ' 1.771-.723 2.02-1.422.249-.699.249-1.298.174-1.422-.074-.124-.273-.199-.573-.348z"/>' +
    "</svg>";

  // Wait for DOM to be ready before appending
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      document.body.appendChild(btn);
    });
  } else {
    document.body.appendChild(btn);
  }
})();