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

function badgeHtml(item) {
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
        <meta itemprop="availability" content="https://schema.org/${item.in_stock === false ? "OutOfStock" : "InStock"}">
        ${originalHtml}
      </div>`;
}

function buttonHtml(item) {
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

function cardHtml(item, basePath = "") {
  const categories = (item.categories || []).join(" ");
  const url = basePath + item.url;
  const image = basePath + item.image;
  return `
    <article class="product-card bg-white rounded-xl shadow-md overflow-hidden mb-2 hover:shadow-lg transition" data-category="${categories}">
      <a href="${url}" target="_blank">
        <div class="w-full aspect-[4/3] relative">
          <img src="${image}" loading="lazy" alt="${item.alt || item.title}" class="w-full h-full object-cover rounded-t-xl transform transition-transform duration-500 ease-in-out hover:scale-110" width="400" height="300">
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

async function renderProducts({ containerId, jsonPath = "items.json", limit = 10 }) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`renderProducts: no element with id "${containerId}" found`);
    return;
  }
  try {
    const res = await fetch(jsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${jsonPath}: ${res.status}`);
    const items = await res.json();
    const latest = items.slice(0, limit);
    container.innerHTML = latest.map((item) => cardHtml(item)).join("\n");
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
function sidebarItemHtml(item, basePath, isLast) {
  const borderClass = isLast ? "" : " border-b border-gray-300";
  return `
    <div class="product-card" data-category="">
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
  try {
    const res = await fetch(jsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${jsonPath}: ${res.status}`);
    const items = await res.json();
    const latest = items.slice(0, limit);
    container.innerHTML = latest
      .map((item, i) => sidebarItemHtml(item, basePath, i === latest.length - 1))
      .join("\n");
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

  const resolvedId =
    currentId || document.querySelector(".productCode")?.textContent?.trim();
  if (!resolvedId) {
    console.error("renderRelatedProducts: could not determine current product id");
    container.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(jsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${jsonPath}: ${res.status}`);
    const items = await res.json();

    const current = items.find((i) => i.id === resolvedId);
    const others = items.filter((i) => i.id !== resolvedId);

    if (!current) {
      // Current product isn't in the catalog yet — just show a random sample.
      container.innerHTML = shuffle(others)
        .slice(0, limit)
        .map((item) => cardHtml(item, basePath))
        .join("\n");
      registerCartProducts(container);
      return;
    }

    const ranked = shuffle(others)
      .map((item) => ({ item, score: scoreRelated(current, item) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.item);

    container.innerHTML = ranked.map((item) => cardHtml(item, basePath)).join("\n");
    registerCartProducts(container);
  } catch (err) {
    console.error("renderRelatedProducts error:", err);
    container.innerHTML = `<p class="text-sm text-gray-400 col-span-full text-center">Couldn't load related products.</p>`;
  }
}