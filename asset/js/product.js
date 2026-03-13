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
    const mainImage     = document.getElementById('mainImage');
    const thumbnailTrack = document.getElementById('thumbnailTrack');
    const prevBtn       = document.getElementById('prevBtn');
    const nextBtn       = document.getElementById('nextBtn');
    const thumbnails    = document.querySelectorAll('.product-thumbnail');

    // Exit silently if gallery elements don't exist on this page
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

// ── Category Filter ───────────────────────────────────────
function filterCategory(cat) {
    activeCategory = cat;
    activePriceMin = 0;
    activePriceMax = 999999;

    document.querySelectorAll('.price-filter-btn').forEach(function(b) {
        b.classList.remove('text-blue-600', 'font-semibold', 'bg-blue-50');
    });

    applyFilters();

    // Auto-close mobile sidebar after selecting a category
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
    activeCategory = 'all';

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
    var visible = 0;

    cards.forEach(function(card) {
        var cardCat   = (card.getAttribute('data-category') || '').toLowerCase().trim();
        var catSlugs  = cardCat.split(/\s+/);
        var catMatch  = activeCategory === 'all' || catSlugs.indexOf(activeCategory) !== -1;

        var priceEl   = card.querySelector('.productPrice .text-red-500');
        var price     = priceEl ? parseInt(priceEl.textContent.replace(/[^0-9]/g, ''), 10) || 0 : 0;
        var priceMatch = price >= activePriceMin && price <= activePriceMax;

        if (catMatch && priceMatch) {
            card.style.display = '';
            visible++;
        } else {
            card.style.display = 'none';
        }
    });

    var noResults = document.getElementById('no-results');
    if (noResults) noResults.classList.toggle('hidden', visible > 0);
}

// ═══════════════════════════════════════════
// search.js — works on product.html AND index.html
// ═══════════════════════════════════════════

// ── Search ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  const searchInput  = document.getElementById('searchInput');
  const clearBtn     = document.getElementById('clearSearch');
  const resultsCount = document.getElementById('resultsCount');

  if (!searchInput) return;

  const hasGrid = !!document.getElementById('product-grid');

  // ── Core search — only runs on product.html ──────────────
  function performSearch() {
    if (!hasGrid) return;

    const searchTerm = searchInput.value.toLowerCase().trim();
    const cards = document.querySelectorAll('#product-grid .product-card');
    let visible = 0;

    cards.forEach(card => {
      const name  = card.querySelector('.productName')?.textContent.toLowerCase()  || '';
      const code  = card.querySelector('.productCode')?.textContent.toLowerCase()  || '';
      const brand = card.querySelector('.productBrand')?.textContent.toLowerCase() || '';
      const price = card.querySelector('.productPrice')?.textContent.toLowerCase() || '';
      const text  = name + ' ' + code + ' ' + brand + ' ' + price;

      function normalize(t) {
        return t.replace(/[\s\-_.,/#!$%^&*;:{}=`~()]/g, '').toLowerCase();
      }

      const words = searchTerm.split(/\s+/).filter(w => w.length > 0);
      const match = searchTerm === '' || words.every(w =>
        text.includes(w) || normalize(text).includes(normalize(w))
      );

      card.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    // Results label
    const label = document.getElementById('search-label');
    if (label) {
      if (searchTerm) {
        label.textContent = visible > 0
          ? `Showing ${visible} result${visible !== 1 ? 's' : ''} for "${searchTerm}"`
          : `No results found for "${searchTerm}"`;
        label.classList.remove('hidden');
      } else {
        label.textContent = '';
        label.classList.add('hidden');
      }
    }

    // Results count badge
    if (resultsCount) {
      resultsCount.textContent = searchTerm
        ? `${visible} product${visible !== 1 ? 's' : ''} found`
        : '';
    }

    // Reset category filter when searching
    if (searchTerm && typeof activeCategory !== 'undefined') {
      activeCategory = 'all';
    }
  }

  // ── Redirect — runs on index + individual product pages ──
function redirectToSearch() {
  const q = searchInput.value.trim();
  if (!q) return;

  // Check if we are inside a subdirectory (products folder)
  const isSubDir = window.location.pathname.includes('/products/');

  const base = isSubDir ? '../product.html' : 'product.html';
  window.location.href = base + '?search=' + encodeURIComponent(q);
}

  // ── Clear ─────────────────────────────────────────────────
  window.clearSearch = function () {
    searchInput.value = '';
    clearBtn?.classList.add('hidden');

    if (hasGrid) {
      // Reset cards
      document.querySelectorAll('#product-grid .product-card').forEach(card => {
        card.style.display = '';
      });

      // Hide label
      const label = document.getElementById('search-label');
      if (label) { label.textContent = ''; label.classList.add('hidden'); }

      // Clear count badge
      if (resultsCount) resultsCount.textContent = '';

      // Clean URL param
      const url = new URL(window.location);
      url.searchParams.delete('search');
      window.history.replaceState({}, '', url);
    }

    searchInput.focus();
  };

  // ── Input event ───────────────────────────────────────────
  searchInput.addEventListener('input', () => {
    clearBtn?.classList.toggle('hidden', searchInput.value === '');
    if (hasGrid) performSearch();
    // on non-grid pages: do nothing on input, wait for Enter
  });

  // ── Keyboard events ───────────────────────────────────────
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      window.clearSearch();
    }
    if (e.key === 'Enter') {
      if (hasGrid) {
        performSearch(); // already filtered live, just re-run to be safe
      } else {
        redirectToSearch(); // index or individual product page
      }
    }
  });

  // ── URL param on load — only on product.html ─────────────
  if (hasGrid) {
    const q = new URLSearchParams(window.location.search).get('search');
    if (q) {
      searchInput.value = q;
      clearBtn?.classList.remove('hidden');
      performSearch();
    }
  }

});