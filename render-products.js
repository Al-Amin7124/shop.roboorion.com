/**
 * render-products.js
 * Renders product cards from items.json into any container on any page.
 *
 * USAGE (put this where the old hardcoded <article> cards used to be):
 *   <div id="new-arrivals-grid" class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4"></div>
 *   <script src="render-products.js"></script>
 *   <script>
 *     renderProducts({ containerId: "new-arrivals-grid", jsonPath: "items.json", limit: 10 });
 *   </script>
 *
 * On another page (e.g. a "Latest 4" widget in a sidebar):
 *   renderProducts({ containerId: "sidebar-latest", jsonPath: "items.json", limit: 4 });
 *
 * items.json is a plain array. NEWEST ITEM GOES AT INDEX 0 (top of the array).
 * This script just takes the first N items — no sorting/dates needed.
 */

function starsHtml(rating) {
  const filled = Math.round(rating || 0);
  let html = "";
  for (let i = 0; i < 5; i++) {
    html += i < filled
      ? '<i class="fa-solid fa-star text-sm" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-star text-sm text-gray-300" aria-hidden="true"></i>';
  }
  return html;
}

/**
 * Price fields in items.json are strings like "BDT 2250" (or
 * "Contact for Price" for build-to-order items) rather than plain
 * numbers — these helpers normalize that.
 */
function parsePriceNumber(price) {
  if (typeof price === "number") return Number.isNaN(price) ? null : price;
  if (typeof price !== "string") return null;
  const digits = price.replace(/[^0-9.]/g, "");
  if (!digits) return null;
  const n = parseFloat(digits);
  return Number.isNaN(n) ? null : n;
}

function isContactOnly(item) {
  if (item.contact_only) return true;
  return parsePriceNumber(item.price) === null;
}

function isOutOfStock(item) {
  return item.in_stock === false;
}

function badgeHtml(item) {
  // Out-of-stock takes visual priority over any discount badge.
  if (isOutOfStock(item)) {
    return `<span class="stockBadge absolute top-3 left-3 bg-gray-700 text-white text-[9px] font-bold tracking-[1.5px] uppercase px-2.5 py-1 rounded">Out of Stock</span>`;
  }
  // "discount" is the field actually used in items.json, e.g.
  // "Save BDT 500" or "Custom Built". Blue for "Custom Built", red otherwise.
  if (item.discount) {
    const color = item.discount === "Custom Built" ? "bg-blue-500" : "bg-red-500";
    return `<span class="productDiscount absolute top-3 left-3 ${color} text-white text-[9px] font-bold tracking-[1.5px] uppercase px-2.5 py-1 rounded">${item.discount}</span>`;
  }
  // Back-compat: explicit badge/badge_color fields, if ever used instead.
  if (item.badge) {
    const color = item.badge_color === "blue" ? "bg-blue-500" : "bg-red-500";
    return `<span class="productDiscount absolute top-3 left-3 ${color} text-white text-[9px] font-bold tracking-[1.5px] uppercase px-2.5 py-1 rounded">${item.badge}</span>`;
  }
  // Otherwise auto-compute "Save BDT X" if both prices parse to numbers
  const price = parsePriceNumber(item.price);
  const original = parsePriceNumber(item.original_price);
  if (price != null && original != null && original > price) {
    return `<span class="productDiscount absolute top-3 left-3 bg-red-500 text-white text-[9px] font-bold tracking-[1.5px] uppercase px-2.5 py-1 rounded">Save BDT ${Math.round(original - price)}</span>`;
  }
  return "";
}

function priceBlockHtml(item) {
  if (isContactOnly(item)) {
    return `
      <div class="productPrice flex justify-center items-center gap-2 mb-2" itemscope itemtype="https://schema.org/Offer">
        <span class="offer-price text-red-500 font-bold text-lg">Contact for Price</span>
        <meta itemprop="price" content="0">
        <meta itemprop="priceCurrency" content="BDT">
        <meta itemprop="availability" content="https://schema.org/InStock">
      </div>`;
  }
  const price = parsePriceNumber(item.price);
  const original = parsePriceNumber(item.original_price);
  const originalHtml = original != null
    ? `<span class="originalPrice text-gray-500 line-through">BDT ${original}</span>`
    : "";
  return `
      <div class="productPrice flex justify-center items-center gap-2 mb-2" itemscope itemtype="https://schema.org/Offer">
        <span class="offer-price text-red-500 font-bold text-lg" itemprop="price" content="${price}">BDT ${price}</span>
        <meta itemprop="priceCurrency" content="BDT">
        <meta itemprop="availability" content="https://schema.org/${isOutOfStock(item) ? "OutOfStock" : "InStock"}">
        ${originalHtml}
      </div>`;
}

function buttonHtml(item) {
  // Out-of-stock takes priority over every other button variant (including
  // "Contact for Price") — nothing should be orderable while unavailable.
  if (isOutOfStock(item)) {
    return `
      <div class="flex justify-center items-center gap-3">
        <button class="add-to-cart bg-gray-200 text-gray-500 px-4 sm:px-8 py-2 rounded-lg font-medium border border-gray-300 cursor-not-allowed" aria-label="${item.title} is out of stock" disabled aria-disabled="true" style="pointer-events:none;"><i class="fa-solid fa-cart-shopping mr-2" aria-hidden="true"></i>Out of Stock</button>
      </div>`;
  }
  if (isContactOnly(item)) {
    return `
      <div class="flex justify-center items-center gap-3">
        <a href="https://m.me/257133751874465" target="_blank" rel="noopener noreferrer">
          <button class="add-to-cart bg-white hover:bg-blue-600 text-gray-800 hover:text-white px-4 sm:px-8 py-2 rounded-lg font-medium border border-gray-600 transition-all duration-300 ease-in-out hover:shadow-lg" aria-label="Contact to order ${item.title}"><i class="fa-solid fa-message mr-2" aria-hidden="true"></i>Contact to Order</button>
        </a>
      </div>`;
  }
  // No wrapping <a> here — an anchor around the button intercepts the
  // click and navigates before cart.js's "add-to-cart" handler can run.
  return `
      <div class="flex justify-center items-center gap-3">
        <button class="add-to-cart bg-white hover:bg-blue-600 text-gray-800 hover:text-white px-4 sm:px-8 py-2 rounded-lg font-medium border border-gray-600 transition-all duration-300 ease-in-out hover:shadow-lg" aria-label="Add ${item.title} to cart"><i class="fa-solid fa-cart-shopping mr-2" aria-hidden="true"></i>Add to Cart</button>
      </div>`;
}

/**
 * Injects the fade-in keyframes once per page. Cards reveal themselves in
 * sequence (first card first, then second, etc.) via animation-delay,
 * rather than the whole grid popping in at the same instant.
 */
function injectFadeInStyles() {
  if (document.getElementById("ro-fade-in-styles")) return;
  const style = document.createElement("style");
  style.id = "ro-fade-in-styles";
  style.textContent = `
    @keyframes roFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .ro-fade-in { opacity: 0; animation: roFadeIn 0.45s ease forwards; }
  `;
  document.head.appendChild(style);
}

function cardHtml(item, basePath = "", index = 0) {
  const categories = (item.categories || []).join(" ");
  const url = basePath + item.url;
  const image = basePath + item.image;
  const delay = Math.min(index, 12) * 70; // cap so a long grid doesn't feel sluggish
  // First couple of cards load eagerly at high priority so the very first
  // image visibly appears before the rest; everything after stays lazy.
  const loadingAttr = index < 2 ? `loading="eager" fetchpriority="high"` : `loading="lazy"`;
  const outOfStockClass = isOutOfStock(item) ? " product-card--out-of-stock" : "";
  return `
    <article class="product-card bg-white rounded-xl shadow-md overflow-hidden mb-2 hover:shadow-lg transition ro-fade-in${outOfStockClass}" style="animation-delay:${delay}ms" data-category="${categories}">
      <a href="${url}" target="_blank">
        <div class="w-full aspect-[4/3] relative">
          <img src="${image}" ${loadingAttr} alt="${item.alt || item.title}" class="w-full h-full object-cover rounded-t-xl transform transition-transform duration-500 ease-in-out hover:scale-110" width="400" height="300">
          ${badgeHtml(item)}
        </div>
      </a>
      <div class="p-4 text-center">
        <a href="${url}" target="_blank">
          <h3 class="productName text-sm font-semibold text-gray-800 hover:text-blue-900 mb-2">${item.title}</h3>
        </a>
        <p class="productCode text-xs text-gray-500 mb-2">${item.id}</p>
        <div class="flex justify-center items-center mb-2 text-yellow-400" aria-label="Rating: ${item.rating} out of 5, ${item.reviews} reviews">
          ${starsHtml(item.rating)}
          <span class="ml-2 text-md text-gray-600">(${item.reviews})</span>
        </div>
        <div class="mb-2"><p class="text-pink-600 font-ubuntu font-normal text-sm"><span class="font-bold text-gray-600">Brand </span><span class="productBrand">${item.brand}</span></p></div>
        ${priceBlockHtml(item)}
        ${buttonHtml(item)}
      </div>
    </article>`;
}

/**
 * Registers dynamically-rendered cards with cart.js and wires up their
 * "Add to Cart" buttons. Needed because cart.js only scans the page for
 * .add-to-cart buttons ONCE at page load — any cards injected afterwards
 * (like these) are invisible to it unless we do this ourselves.
 */
function registerCartProducts(container) {
  if (!window.ROCart) return; // cart.js isn't loaded on this page
  const PROD_KEY = "robo_orion_products";
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(PROD_KEY) || "{}");
  } catch (e) {
    saved = {};
  }

  container.querySelectorAll(".product-card").forEach((card) => {
    const nameEl = card.querySelector(".productName");
    const codeEl = card.querySelector(".productCode");
    const priceEl = card.querySelector(".productPrice .offer-price");
    const imgEl = card.querySelector("img");
    const addBtn = card.querySelector(".add-to-cart");
    if (!nameEl || !codeEl || !addBtn) return;

    // Out-of-stock buttons are already natively disabled (a disabled
    // <button> never fires "click" at all) — skip registering/binding
    // them entirely so there's nothing to add to the cart in the first place.
    if (addBtn.hasAttribute("disabled")) return;

    const id = codeEl.textContent.trim();
    const priceDigits = priceEl ? priceEl.textContent.replace(/[^0-9.]/g, "") : "";
    const price = priceDigits ? parseFloat(priceDigits) : NaN;

    // "Contact for Price" items have no numeric price to add to a cart —
    // their button already links to Messenger, so leave it alone.
    if (Number.isNaN(price)) return;

    // Don't overwrite a price already marked authoritative by the product's own page.
    const existing = saved[id];
    saved[id] =
      existing && existing.priceSource === "product-page"
        ? existing
        : {
            id,
            name: nameEl.textContent.trim(),
            code: id,
            price,
            img: imgEl ? imgEl.getAttribute("src") : "",
            priceSource: "shop-page",
          };

    // Guard against binding the same button twice (e.g. if this function
    // ever runs more than once for the same cards) — without this, a
    // second binding would add the item twice per click.
    if (addBtn.dataset.cartBound === "true") return;
    addBtn.dataset.cartBound = "true";

    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.ROCart.addItem(id, 1);
    });
  });

  try {
    localStorage.setItem(PROD_KEY, JSON.stringify(saved));
  } catch (e) {
    console.error("registerCartProducts: failed to save", e);
  }
}

/**
 * Skeleton placeholders — shown the instant the script runs (before the
 * network request even starts), so there's never a blank gap while
 * items.json loads. Automatically replaced once real content is ready.
 */
function skeletonGridHtml(count) {
  const card = `
    <div class="product-card bg-white rounded-xl shadow-md overflow-hidden mb-2 animate-pulse">
      <div class="w-full aspect-[4/3] bg-gray-200"></div>
      <div class="p-4 text-center">
        <div class="h-4 bg-gray-200 rounded mb-2 mx-auto w-3/4"></div>
        <div class="h-3 bg-gray-200 rounded mb-3 mx-auto w-1/3"></div>
        <div class="h-3 bg-gray-200 rounded mb-3 mx-auto w-1/2"></div>
        <div class="h-5 bg-gray-200 rounded mb-3 mx-auto w-1/3"></div>
        <div class="h-9 bg-gray-200 rounded mx-auto w-2/3"></div>
      </div>
    </div>`;
  return Array(count).fill(card).join("\n");
}

function skeletonSidebarHtml(count) {
  const row = `
    <div class="flex mb-2 pb-2 border-b border-gray-300 animate-pulse">
      <div class="max-w-20 w-full aspect-[4/3] bg-gray-200 rounded-sm"></div>
      <div class="pl-2 flex-1 flex flex-col justify-center gap-2">
        <div class="h-3 bg-gray-200 rounded w-full"></div>
        <div class="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>`;
  return Array(count).fill(row).join("\n");
}

async function renderProducts({ containerId, jsonPath = "items.json", limit = 10 }) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`renderProducts: no element with id "${containerId}" found`);
    return;
  }
  container.innerHTML = skeletonGridHtml(limit);
  try {
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error(`Failed to load ${jsonPath}: ${res.status}`);
    const items = await res.json();
    const latest = items.slice(0, limit);
    container.innerHTML = latest.map((item, i) => cardHtml(item, "", i)).join("\n");
    injectFadeInStyles();
    registerCartProducts(container);
  } catch (err) {
    console.error("renderProducts error:", err);
    container.innerHTML = `<p class="text-sm text-gray-400 col-span-full text-center">Couldn't load products.</p>`;
  }
}

/**
 * Compact "New Products" sidebar list used on individual product pages
 * (thumbnail + title only, no price/rating). Matches the original
 * hand-coded markup exactly so no CSS changes are needed.
 *
 * USAGE (on a page inside /products/, so paths need "../"):
 *   <div id="new-products-sidebar"></div>
 *   <script src="../render-products.js"></script>
 *   <script>
 *     renderNewProductsSidebar({
 *       containerId: "new-products-sidebar",
 *       jsonPath: "../items.json",
 *       basePath: "../",
 *       limit: 8
 *     });
 *   </script>
 */
function sidebarItemHtml(item, basePath, isLast, index = 0) {
  const borderClass = isLast ? "" : " border-b border-gray-300";
  const delay = Math.min(index, 12) * 70;
  return `
    <div class="product-card ro-fade-in" style="animation-delay:${delay}ms" data-category="">
      <a href="${basePath}${item.url}" class="flex text-sm font-medium text-gray-600 mb-2 pb-2${borderClass}">
        <div class="max-w-20 w-full aspect-[4/3]">
          <img src="${basePath}${item.image}" class="w-full h-full object-cover rounded-sm" alt="${item.alt || item.title}" loading="lazy" width="80" height="60">
        </div>
        <h3 class="productName pl-2">${item.title}</h3>
        <p class="productCode hidden">${item.id}</p>
      </a>
    </div>`;
}

async function renderNewProductsSidebar({ containerId, jsonPath = "items.json", limit = 8, basePath = "" }) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`renderNewProductsSidebar: no element with id "${containerId}" found`);
    return;
  }
  container.innerHTML = skeletonSidebarHtml(limit);
  try {
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error(`Failed to load ${jsonPath}: ${res.status}`);
    const items = await res.json();
    const latest = items.slice(0, limit);
    container.innerHTML = latest
      .map((item, i) => sidebarItemHtml(item, basePath, i === latest.length - 1, i))
      .join("\n");
    injectFadeInStyles();
  } catch (err) {
    console.error("renderNewProductsSidebar error:", err);
    container.innerHTML = `<p class="text-sm text-gray-400">Couldn't load new products.</p>`;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * RELATED PRODUCTS — ranked by: title match > category match > random
 * ═══════════════════════════════════════════════════════════════
 *
 * Scans the FULL catalog in items.json (not just the newest entries),
 * so items.json needs an entry for every product over time for this
 * to find good matches — same file used for New Arrivals / sidebar.
 *
 * USAGE (on a page inside /products/):
 *   <div id="related-products-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4"></div>
 *   <script src="../render-products.js"></script>
 *   <script>
 *     renderRelatedProducts({
 *       containerId: "related-products-grid",
 *       jsonPath: "../items.json",
 *       basePath: "../",
 *       limit: 10
 *       // currentId is optional — if omitted, it's auto-read from the
 *       // page's own ".productCode" element (e.g. "RBO-1787")
 *     });
 *   </script>
 */

const STOPWORDS = new Set([
  "for", "with", "and", "the", "a", "an", "of", "to", "in", "on",
  "robo", "orion", "bangladesh", "high", "capacity", "original"
]);

function titleTokens(title) {
  return new Set(
    (title || "")
      .toLowerCase()
      .replace(/[^a-z0-9.\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t))
  );
}

function intersectionSize(setA, setB) {
  let count = 0;
  for (const v of setA) if (setB.has(v)) count++;
  return count;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scoreRelated(current, candidate) {
  const titleScore = intersectionSize(titleTokens(current.title), titleTokens(candidate.title));
  const categoryScore = intersectionSize(
    new Set(current.categories || []),
    new Set(candidate.categories || [])
  );
  // Tiered weighting: title match always outranks any number of category matches.
  return titleScore * 10000 + categoryScore;
}

async function renderRelatedProducts({
  containerId,
  jsonPath = "items.json",
  basePath = "",
  limit = 10,
  currentId = null,
}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`renderRelatedProducts: no element with id "${containerId}" found`);
    return;
  }
  container.innerHTML = skeletonGridHtml(limit);

  const resolvedId =
    currentId || document.querySelector(".productCode")?.textContent?.trim();
  if (!resolvedId) {
    console.error("renderRelatedProducts: could not determine current product id");
    container.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error(`Failed to load ${jsonPath}: ${res.status}`);
    const items = await res.json();

    const current = items.find((i) => i.id === resolvedId);
    const others = items.filter((i) => i.id !== resolvedId);

    if (!current) {
      // Current product isn't in the catalog yet — just show a random sample.
      container.innerHTML = shuffle(others)
        .slice(0, limit)
        .map((item, i) => cardHtml(item, basePath, i))
        .join("\n");
      injectFadeInStyles();
      registerCartProducts(container);
      return;
    }

    const ranked = shuffle(others)
      .map((item) => ({ item, score: scoreRelated(current, item) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.item);

    container.innerHTML = ranked.map((item, i) => cardHtml(item, basePath, i)).join("\n");
    injectFadeInStyles();
    registerCartProducts(container);
  } catch (err) {
    console.error("renderRelatedProducts error:", err);
    container.innerHTML = `<p class="text-sm text-gray-400 col-span-full text-center">Couldn't load related products.</p>`;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * POPULAR PRODUCTS — ranked by real Google Analytics page-view counts
 * ═══════════════════════════════════════════════════════════════
 *
 * Reads two files together:
 *   - items.json    — your product catalog (title, price, image, etc.)
 *   - popular.json  — { "views": { "RBO-1234": 512, ... } }, generated
 *                      automatically by a scheduled GitHub Action that
 *                      pulls real view counts from the GA4 Data API.
 *                      See fetch_popular.py / update-popular.yml.
 *
 * popular.json is intentionally tiny (just id -> view count) so it stays
 * fast to fetch; all the actual product details still come from items.json,
 * same as every other section.
 *
 * USAGE:
 *   <div id="popular-grid" class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4"></div>
 *   <script src="render-products.js"></script>
 *   <script>
 *     renderPopularProducts({
 *       containerId: "popular-grid",
 *       itemsPath: "items.json",
 *       popularPath: "popular.json",
 *       limit: 10
 *     });
 *   </script>
 *
 * On a product page (inside /products/), pass basePath: "../" and adjust
 * itemsPath/popularPath to "../items.json" / "../popular.json", same as
 * the other render functions.
 */
async function renderPopularProducts({
  containerId,
  itemsPath = "items.json",
  popularPath = "popular.json",
  basePath = "",
  limit = 10,
}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`renderPopularProducts: no element with id "${containerId}" found`);
    return;
  }
  container.innerHTML = skeletonGridHtml(limit);

  try {
    const [itemsRes, popularRes] = await Promise.all([fetch(itemsPath), fetch(popularPath)]);
    if (!itemsRes.ok) throw new Error(`Failed to load ${itemsPath}: ${itemsRes.status}`);

    const items = await itemsRes.json();

    // popular.json might not exist yet (e.g. before the first scheduled
    // run) — fall back gracefully to newest-first instead of erroring out.
    let views = {};
    if (popularRes.ok) {
      const popularData = await popularRes.json();
      views = popularData.views || {};
    } else {
      console.warn(`renderPopularProducts: ${popularPath} not found yet — showing newest items instead`);
    }

    const ranked = items
      .slice()
      .sort((a, b) => (views[b.id] || 0) - (views[a.id] || 0))
      .slice(0, limit);

    container.innerHTML = ranked.map((item, i) => cardHtml(item, basePath, i)).join("\n");
    injectFadeInStyles();
    registerCartProducts(container);
  } catch (err) {
    console.error("renderPopularProducts error:", err);
    container.innerHTML = `<p class="text-sm text-gray-400 col-span-full text-center">Couldn't load popular products.</p>`;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * FULL CATALOG — for the main product listing page (product.html)
 * ═══════════════════════════════════════════════════════════════
 *
 * Renders EVERY item in items.json as a card, matching the exact same
 * markup/classes as every other section (.product-card, data-category,
 * .productName, .productPrice .offer-price, etc.) — this is intentional:
 * product.js's existing pagination (initPagination/renderPage), category
 * filters (applyFilters), and search all work by scanning for these
 * classes on whatever's in the DOM. This function doesn't reimplement
 * any of that — it just supplies the cards, then re-triggers pagination
 * so it picks up what was just rendered.
 *
 * "Pagination" here still means: all cards exist in the DOM, but only
 * the current page's worth are visible (display:none on the rest) —
 * same behavior as before. The actual speed win is that the raw HTML
 * file no longer ships ~185 hardcoded card blocks on every load; it's
 * one small items.json fetch instead, and hidden cards' lazy images
 * are never requested until their page becomes visible.
 *
 * USAGE (on product.html):
 *   <div id="product-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4"></div>
 *   <script src="render-products.js"></script>
 *   <script>
 *     renderCatalog({ containerId: "product-grid", jsonPath: "items.json" });
 *   </script>
 */
async function renderCatalog({ containerId, jsonPath = "items.json", basePath = "" }) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`renderCatalog: no element with id "${containerId}" found`);
    return;
  }
  // A lighter skeleton count here — showing all ~185 skeleton cards at
  // once would itself be wasteful; a couple rows is enough to signal
  // "loading" without doing pointless extra DOM work.
  container.innerHTML = skeletonGridHtml(8);

  try {
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error(`Failed to load ${jsonPath}: ${res.status}`);
    const items = await res.json();

    container.innerHTML = items.map((item, i) => cardHtml(item, basePath, i)).join("\n");
    injectFadeInStyles();
    registerCartProducts(container);

    // Hand back off to product.js's existing pagination system now that
    // real cards exist — it was likely initialized on an empty grid
    // before this fetch resolved, so it needs to run again.
    if (typeof window.initPagination === "function") {
      window.initPagination();
    } else {
      console.warn("renderCatalog: initPagination() not found — pagination controls may not work until product.js defines it");
    }

    // If the page was opened with ?search=... (a deep link from another
    // page), product.js's own search already tried to run this at load
    // time against an empty grid. Re-trigger it now via its own "input"
    // listener (performSearch itself isn't exposed globally, so we
    // dispatch the same event it's already listening for).
    const searchInput = document.getElementById("searchInput");
    if (searchInput && searchInput.value) {
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  } catch (err) {
    console.error("renderCatalog error:", err);
    container.innerHTML = `<p class="text-sm text-gray-400 col-span-full text-center">Couldn't load products.</p>`;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * MANUALLY-CURATED LIST — e.g. Featured Products, LED Items
 * ═══════════════════════════════════════════════════════════════
 *
 * For sections where YOU pick the exact products (not "newest",
 * not "most viewed", not "related to X" — just a hand-picked list).
 * List the product codes; everything else (title, price, image,
 * rating...) is pulled from items.json automatically, same as
 * every other section.
 *
 * Cards render in the SAME ORDER you list the ids, not sorted.
 *
 * USAGE:
 *   <div id="featured-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4"></div>
 *   <script src="render-products.js?v=3"></script>
 *   <script>
 *     renderProductList({
 *       containerId: "featured-grid",
 *       jsonPath: "items.json",
 *       ids: ["RBO-1787", "RBO-1288", "RBO-1268"]   // <- just the codes
 *     });
 *   </script>
 *
 * On a product page (inside /products/), add basePath: "../" and point
 * jsonPath at "../items.json", same as the other render functions.
 */
async function renderProductList({ containerId, jsonPath = "items.json", ids = [], basePath = "" }) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`renderProductList: no element with id "${containerId}" found`);
    return;
  }
  if (ids.length === 0) {
    console.warn(`renderProductList: no ids given for "${containerId}" — nothing to render`);
    container.innerHTML = "";
    return;
  }
  container.innerHTML = skeletonGridHtml(ids.length);

  try {
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error(`Failed to load ${jsonPath}: ${res.status}`);
    const items = await res.json();
    const byId = new Map(items.map((item) => [item.id, item]));

    const missing = [];
    const found = [];
    ids.forEach((id) => {
      const item = byId.get(id);
      if (item) found.push(item);
      else missing.push(id);
    });

    if (missing.length > 0) {
      console.warn(
        `renderProductList ("${containerId}"): ${missing.length} product code(s) not found in ${jsonPath} — ` +
          `check for typos: ${missing.join(", ")}`
      );
    }

    container.innerHTML = found.map((item, i) => cardHtml(item, basePath, i)).join("\n");
    injectFadeInStyles();
    registerCartProducts(container);
  } catch (err) {
    console.error("renderProductList error:", err);
    container.innerHTML = `<p class="text-sm text-gray-400 col-span-full text-center">Couldn't load products.</p>`;
  }
}