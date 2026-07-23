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

function badgeHtml(item) {
  // Explicit badge text wins (e.g. "Custom Built")
  if (item.badge) {
    const color = item.badge_color === "blue" ? "bg-blue-500" : "bg-red-500";
    return `<span class="productDiscount absolute top-3 left-3 ${color} text-white text-[9px] font-bold tracking-[1.5px] uppercase px-2.5 py-1 rounded">${item.badge}</span>`;
  }
  // Otherwise auto-compute "Save BDT X" if both prices exist
  if (item.price != null && item.original_price != null && item.original_price > item.price) {
    const save = item.original_price - item.price;
    return `<span class="productDiscount absolute top-3 left-3 bg-red-500 text-white text-[9px] font-bold tracking-[1.5px] uppercase px-2.5 py-1 rounded">Save BDT ${save}</span>`;
  }
  return "";
}

function priceBlockHtml(item) {
  if (item.contact_only || item.price == null) {
    return `
      <div class="productPrice flex justify-center items-center gap-2 mb-2" itemscope itemtype="https://schema.org/Offer">
        <span class="offer-price text-red-500 font-bold text-lg">Contact for Price</span>
        <meta itemprop="price" content="0">
        <meta itemprop="priceCurrency" content="BDT">
        <meta itemprop="availability" content="https://schema.org/InStock">
      </div>`;
  }
  const originalHtml = item.original_price != null
    ? `<span class="originalPrice text-gray-500 line-through">BDT ${item.original_price}</span>`
    : "";
  return `
      <div class="productPrice flex justify-center items-center gap-2 mb-2" itemscope itemtype="https://schema.org/Offer">
        <span class="offer-price text-red-500 font-bold text-lg" itemprop="price" content="${item.price}">BDT ${item.price}</span>
        <meta itemprop="priceCurrency" content="BDT">
        <meta itemprop="availability" content="https://schema.org/${item.in_stock === false ? "OutOfStock" : "InStock"}">
        ${originalHtml}
      </div>`;
}

function buttonHtml(item) {
  if (item.contact_only || item.price == null) {
    return `
      <div class="flex justify-center items-center gap-3">
        <a href="https://m.me/257133751874465" target="_blank" rel="noopener noreferrer">
          <button class="add-to-cart bg-white hover:bg-blue-600 text-gray-800 hover:text-white px-4 sm:px-8 py-2 rounded-lg font-medium border border-gray-600 transition-all duration-300 ease-in-out hover:shadow-lg" aria-label="Contact to order ${item.title}"><i class="fa-solid fa-message mr-2" aria-hidden="true"></i>Contact to Order</button>
        </a>
      </div>`;
  }
  return `
      <div class="flex justify-center items-center gap-3">
        <a href="https://m.me/257133751874465" target="_blank" rel="noopener noreferrer">
          <button class="add-to-cart bg-white hover:bg-blue-600 text-gray-800 hover:text-white px-4 sm:px-8 py-2 rounded-lg font-medium border border-gray-600 transition-all duration-300 ease-in-out hover:shadow-lg" aria-label="Add ${item.title} to cart"><i class="fa-solid fa-cart-shopping mr-2" aria-hidden="true"></i>Add to Cart</button>
        </a>
      </div>`;
}

function cardHtml(item) {
  const categories = (item.categories || []).join(" ");
  return `
    <article class="product-card bg-white rounded-xl shadow-md overflow-hidden mb-2 hover:shadow-lg transition" data-category="${categories}">
      <a href="${item.url}" target="_blank">
        <div class="w-full aspect-[4/3] relative">
          <img src="${item.image}" loading="lazy" alt="${item.alt || item.title}" class="w-full h-full object-cover rounded-t-xl transform transition-transform duration-500 ease-in-out hover:scale-110" width="400" height="300">
          ${badgeHtml(item)}
        </div>
      </a>
      <div class="p-4 text-center">
        <a href="${item.url}" target="_blank">
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
    container.innerHTML = latest.map(cardHtml).join("\n");
  } catch (err) {
    console.error("renderProducts error:", err);
    container.innerHTML = `<p class="text-sm text-gray-400 col-span-full text-center">Couldn't load products.</p>`;
  }
}
