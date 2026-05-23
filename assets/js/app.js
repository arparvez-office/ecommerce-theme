/* Floral Radiance — Vanilla JS */

/* ---- Helpers ---- */
function getProductImage(p) {
    try {
        const imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        if (Array.isArray(imgs) && imgs.length) return imgs[0];
    } catch(e) {}
    return 'https://picsum.photos/seed/placeholder/800/1000';
}
function getProductImages(p) {
    try {
        const imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        if (Array.isArray(imgs) && imgs.length) return imgs;
    } catch(e) {}
    return ['https://picsum.photos/seed/placeholder/800/1000'];
}
function formatPrice(val) { return '$' + parseFloat(val).toFixed(2); }
function getCart() { return JSON.parse(localStorage.getItem('fr_cart') || '[]'); }
function saveCart(items) { localStorage.setItem('fr_cart', JSON.stringify(items)); }

/* ---- Cart UI ---- */
function updateCartUI() {
    const cart = getCart();
    const count = cart.reduce((s, i) => s + parseInt(i.qty || 0), 0);
    const total = cart.reduce((s, i) => s + parseFloat(i.price) * parseInt(i.qty), 0);

    const badge = document.getElementById('cart-count');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? '' : 'none'; }

    const fc = document.getElementById('floating-cart');
    if (fc) {
        fc.style.display = count > 0 ? 'flex' : 'none';
        const fcCount = fc.querySelector('.fc-count');
        const fcTotal = fc.querySelector('.fc-total');
        if (fcCount) fcCount.textContent = count + ' item' + (count !== 1 ? 's' : '');
        if (fcTotal) fcTotal.textContent = formatPrice(total);
    }

    const cartBody = document.getElementById('cart-body');
    const cartFooter = document.getElementById('cart-footer');
    if (cartBody) {
        if (cart.length === 0) {
            cartBody.innerHTML = '<div class="cart-empty"><p>Your cart is empty.</p><a href="shop.html" class="btn btn-primary btn-sm">Continue Shopping</a></div>';
            if (cartFooter) cartFooter.style.display = 'none';
        } else {
            cartBody.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-img"><img src="${item.image}" alt="${item.name}"></div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="item-price">${formatPrice(item.price)}</div>
                        <div class="qty-control">
                            <button onclick="updateQty(${item.product_id}, ${parseInt(item.qty)-1})">&minus;</button>
                            <span>${item.qty}</span>
                            <button onclick="updateQty(${item.product_id}, ${parseInt(item.qty)+1})">+</button>
                        </div>
                        <button class="remove-item" onclick="removeItem(${item.product_id})">Remove</button>
                    </div>
                </div>`).join('');
            if (cartFooter) {
                cartFooter.style.display = '';
                const totalEl = document.getElementById('cart-total-amount');
                if (totalEl) totalEl.textContent = formatPrice(total);
            }
        }
    }

    if (document.getElementById('cart-page')) renderCartPage();
}

/* ---- Cart Drawer ---- */
function openDrawer() {
    document.getElementById('cart-drawer')?.classList.add('open');
    document.getElementById('drawer-overlay')?.classList.add('open');
}
function closeDrawer() {
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.getElementById('drawer-overlay')?.classList.remove('open');
}
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
}

/* ---- Cart Operations ---- */
function addToCart(productId, qty) {
    qty = parseInt(qty) || 1;
    const product = PRODUCTS.find(p => p.id === parseInt(productId));
    if (!product) return;
    const items = getCart();
    const existing = items.find(i => i.product_id === parseInt(productId));
    const price = product.sale_price && parseFloat(product.sale_price) > 0 ? product.sale_price : product.price;
    if (existing) {
        existing.qty = parseInt(existing.qty) + qty;
    } else {
        items.push({ product_id: parseInt(productId), name: product.name, price, qty, image: getProductImage(product) });
    }
    saveCart(items);
    updateCartUI();
    showToast('Added to cart');
    openDrawer();
}
function updateQty(productId, qty) {
    if (parseInt(qty) < 1) return removeItem(productId);
    const items = getCart().map(i => i.product_id === parseInt(productId) ? { ...i, qty: parseInt(qty) } : i);
    saveCart(items); updateCartUI();
}
function removeItem(productId) {
    saveCart(getCart().filter(i => i.product_id !== parseInt(productId)));
    updateCartUI(); showToast('Removed from cart');
}
function buyNow(productId, qty) {
    addToCart(productId, qty || 1);
    setTimeout(() => { window.location.href = 'checkout.html'; }, 400);
}

/* ---- Search ---- */
let _searchTimer = null;
function openSearch() {
    document.getElementById('search-overlay')?.classList.add('open');
    setTimeout(() => document.getElementById('search-input')?.focus(), 50);
}
function closeSearch() {
    document.getElementById('search-overlay')?.classList.remove('open');
    const inp = document.getElementById('search-input');
    if (inp) inp.value = '';
    const rl = document.getElementById('search-results-list');
    if (rl) rl.innerHTML = '';
    const st = document.getElementById('search-status');
    if (st) { st.textContent = 'Start typing to search products…'; st.style.display = ''; }
}
function handleSearch(q) {
    clearTimeout(_searchTimer);
    const rl = document.getElementById('search-results-list');
    const st = document.getElementById('search-status');
    if (q.trim().length < 2) {
        if (rl) rl.innerHTML = '';
        if (st) { st.textContent = 'Start typing to search products…'; st.style.display = ''; }
        return;
    }
    if (st) { st.textContent = 'Searching…'; st.style.display = ''; }
    _searchTimer = setTimeout(() => {
        const lower = q.toLowerCase();
        const found = PRODUCTS.filter(p => p.name.toLowerCase().includes(lower) || (p.short_description||'').toLowerCase().includes(lower)).slice(0,8);
        if (rl) rl.innerHTML = found.map(r => `
            <a href="product.html?slug=${r.slug}" class="search-result-item" onclick="closeSearch()">
                <div class="sri-img"><img src="${getProductImage(r)}" alt="${r.name}" loading="lazy"></div>
                <div class="sri-info">
                    <span class="sri-name">${r.name}</span>
                    <span class="sri-price">${r.sale_price && parseFloat(r.sale_price)>0 ? formatPrice(r.sale_price) : formatPrice(r.price)}</span>
                </div>
                <svg style="color:var(--color-muted);flex-shrink:0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
            </a>`).join('');
        if (st) { st.textContent = found.length ? '' : `No products found for "${q}"`; st.style.display = found.length ? 'none' : ''; }
    }, 300);
}

/* ---- Mobile Nav ---- */
function toggleMobileNav() { document.querySelector('.nav-links')?.classList.toggle('open'); }

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();

    document.getElementById('cart-btn')?.addEventListener('click', openDrawer);
    document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);
    document.getElementById('close-cart-btn')?.addEventListener('click', closeDrawer);
    document.getElementById('checkout-from-drawer')?.addEventListener('click', () => location.href='checkout.html');
    document.getElementById('floating-cart')?.addEventListener('click', openDrawer);
    document.getElementById('search-btn')?.addEventListener('click', openSearch);
    document.getElementById('search-close-btn')?.addEventListener('click', closeSearch);
    document.getElementById('search-overlay')?.addEventListener('click', e => { if(e.target.id==='search-overlay') closeSearch(); });
    document.getElementById('search-input')?.addEventListener('input', e => handleSearch(e.target.value));
    document.getElementById('search-input')?.addEventListener('keyup', e => { if(e.key==='Escape') closeSearch(); });
    document.getElementById('hamburger-btn')?.addEventListener('click', toggleMobileNav);

    if (document.getElementById('index-content'))  initIndexPage();
    if (document.getElementById('shop-content'))   initShopPage();
    if (document.getElementById('product-page'))   initProductPage();
    if (document.getElementById('cart-page'))      renderCartPage();
    if (document.getElementById('checkout-page'))  initCheckoutPage();
    if (document.getElementById('order-success-page')) initOrderSuccessPage();
    if (document.getElementById('article-page'))   initArticlePage();
    if (document.getElementById('blog-grid'))      initBlogPage();
});

/* ---- Product card HTML helper ---- */
function productCardHtml(p, gridClass) {
    const img = getProductImage(p);
    const hasSale = p.sale_price && parseFloat(p.sale_price) > 0;
    const savings = hasSale ? '$'+(parseFloat(p.price)-parseFloat(p.sale_price)).toFixed(0) : '';
    const cartSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.067-.852 2.184-1.97l.823-7.41A.75.75 0 0 0 21.32 4.5H5.106M7.5 14.25 5.106 4.5M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/></svg>`;
    return `<div class="product-card">
        <div class="product-image-wrap">
            ${hasSale?`<span class="save-badge">Save ${savings}</span>`:''}
            <a href="product.html?slug=${p.slug}"><img src="${img}" alt="${p.name}" loading="lazy"></a>
        </div>
        <div class="product-info">
            <div class="product-price">
                ${hasSale?`<span class="original">${formatPrice(p.price)}</span><span class="current-price">${formatPrice(p.sale_price)}</span>`:`<span class="current-price">${formatPrice(p.price)}</span>`}
            </div>
            <h3><a href="product.html?slug=${p.slug}">${p.name}</a></h3>
            <div class="card-actions">
                <button class="btn-add-cart" onclick="addToCart(${p.id})">${cartSvg} Add to Cart</button>
                <button class="btn-buy-now" onclick="buyNow(${p.id})">Buy Now</button>
            </div>
        </div>
    </div>`;
}

/* ---- Index Page ---- */
function initIndexPage() {
    const catGrid = document.getElementById('category-grid');
    if (catGrid) catGrid.innerHTML = CATEGORIES.map(c =>
        `<a href="shop.html?category=${c.id}" class="category-card category-card--round">
            <img src="${c.image_url}" alt="${c.name}">
            <div class="overlay"><h3>${c.name}</h3></div>
        </a>`).join('');

    const sidebarList = document.getElementById('home-cat-sidebar-list');
    if (sidebarList) sidebarList.innerHTML =
        '<li><a href="shop.html" class="active">All Products</a></li>' +
        CATEGORIES.map(c=>`<li><a href="shop.html?category=${c.id}">${c.name}</a></li>`).join('');

    const prodGrid = document.getElementById('home-product-grid');
    if (prodGrid) prodGrid.innerHTML = PRODUCTS.slice(0,12).map(p => productCardHtml(p)).join('');

    const blogGrid = document.getElementById('home-blog-grid');
    if (blogGrid) blogGrid.innerHTML = BLOG_POSTS.slice(0,3).map(post => blogCardHtml(post)).join('');
}

/* ---- Blog card helper ---- */
function blogCardHtml(post) {
    return `<article class="blog-card">
        <a href="article.html?slug=${post.slug}" class="blog-image"><img src="${post.image_url}" alt="${post.title}"></a>
        <div class="blog-content">
            <span class="blog-tag">${post.category}</span>
            <div class="blog-meta"><span>${post.created_at}</span><span class="meta-sep">&bull;</span><span>${post.author}</span></div>
            <h3><a href="article.html?slug=${post.slug}">${post.title}</a></h3>
            <p>${post.excerpt}</p>
            <a href="article.html?slug=${post.slug}" class="read-more">Read more &rarr;</a>
        </div>
    </article>`;
}

/* ---- Blog Page ---- */
function initBlogPage() {
    const grid = document.getElementById('blog-grid');
    if (grid) grid.innerHTML = BLOG_POSTS.map(post => blogCardHtml(post)).join('');
}

/* ---- Shop Page ---- */
const shopState = { activeCategory: 0, sortBy: 'newest', minPrice: '', maxPrice: '' };

function initShopPage() {
    shopState.activeCategory = parseInt(new URLSearchParams(location.search).get('category')||'0');

    const catList = document.getElementById('shop-category-list');
    if (catList) {
        catList.innerHTML = `<li class="${shopState.activeCategory===0?'active':''}" data-cat="0">All Products</li>` +
            CATEGORIES.map(c=>`<li class="${shopState.activeCategory===c.id?'active':''}" data-cat="${c.id}">${c.name}</li>`).join('');
        catList.querySelectorAll('li').forEach(li => li.addEventListener('click', () => {
            shopState.activeCategory = parseInt(li.dataset.cat);
            catList.querySelectorAll('li').forEach(l=>l.classList.remove('active'));
            li.classList.add('active');
            renderShopGrid();
        }));
    }

    const sortSel = document.getElementById('shop-sort');
    if (sortSel) sortSel.addEventListener('change', e => { shopState.sortBy = e.target.value; renderShopGrid(); });

    document.getElementById('price-min')?.addEventListener('input', e => { shopState.minPrice = e.target.value; renderShopGrid(); });
    document.getElementById('price-max')?.addEventListener('input', e => { shopState.maxPrice = e.target.value; renderShopGrid(); });

    renderShopGrid();
}

function renderShopGrid() {
    const eff = p => parseFloat(p.sale_price && parseFloat(p.sale_price)>0 ? p.sale_price : p.price);
    let list = [...PRODUCTS];
    if (shopState.activeCategory > 0) list = list.filter(p => p.category_id === shopState.activeCategory);
    const mn = parseFloat(shopState.minPrice), mx = parseFloat(shopState.maxPrice);
    list = list.filter(p => {
        const pr = eff(p);
        if (!isNaN(mn) && pr < mn) return false;
        if (!isNaN(mx) && pr > mx) return false;
        return true;
    });
    if (shopState.sortBy==='price-asc') list.sort((a,b)=>eff(a)-eff(b));
    else if (shopState.sortBy==='price-desc') list.sort((a,b)=>eff(b)-eff(a));
    else list.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

    const cnt = document.getElementById('result-count');
    if (cnt) cnt.textContent = list.length + ' products';

    const grid = document.getElementById('shop-grid');
    if (!grid) return;
    grid.innerHTML = list.length ? list.map(p=>productCardHtml(p)).join('') :
        '<div style="padding:60px 0;text-align:center;color:var(--color-muted)">No products match your filters.</div>';
}

/* ---- Product Page ---- */
function initProductPage() {
    const slug = new URLSearchParams(location.search).get('slug');
    const product = PRODUCTS.find(p=>p.slug===slug);
    const container = document.getElementById('product-page');
    if (!product) {
        container.innerHTML = '<section class="section"><div class="container" style="text-align:center;padding:80px 0"><h1>Product not found</h1><p style="margin:20px 0;color:var(--color-muted)">The product you are looking for does not exist.</p><a href="shop.html" class="btn btn-primary">Back to Shop</a></div></section>';
        return;
    }
    document.title = product.name + ' — Floral Radiance';
    const images = getProductImages(product);
    const hasSale = product.sale_price && parseFloat(product.sale_price) > 0;
    const variants = product.variants ? (typeof product.variants==='string' ? JSON.parse(product.variants) : product.variants) : null;
    const hasSizes = !!(variants && variants.sizes && variants.sizes.length);
    const thumbsHtml = images.length > 1 ? '<div class="thumb-row">' + images.map((img,i) =>
        `<div class="thumb${i===0?' active':''}" onclick="switchImage('${img}',this)"><img src="${img}" alt=""></div>`).join('') + '</div>' : '';
    const sizesHtml = hasSizes ? `<div class="variant-section"><div class="variant-group">
        <span class="variant-label">Size</span>
        <div class="size-options">${variants.sizes.map(s=>`<button type="button" class="size-btn" data-size="${s.name}" onclick="selectSizeVariant(this)">${s.name}</button>`).join('')}</div>
    </div></div>` : '';
    const related = PRODUCTS.filter(p=>p.category_id===product.category_id&&p.id!==product.id).slice(0,4);
    const relatedHtml = related.length ? `<section class="section section-light"><div class="container">
        <div class="section-header"><span class="section-eyebrow">You might also like</span><h2>Related Bouquets</h2></div>
        <div class="product-grid">${related.map(r=>productCardHtml(r)).join('')}</div>
    </div></section>` : '';
    const longDesc = product.long_description ? `<section class="section product-long-desc-section"><div class="container">
        <div class="product-long-desc-wrap"><h2>Product Details</h2><div class="product-long-desc-body">${product.long_description}</div></div>
    </div></section>` : '';
    const stockHtml = !variants
        ? (product.stock>0 ? `<span style="color:var(--color-primary)">&#10003; In Stock &mdash; ${product.stock} available</span>` : '<span style="color:var(--color-accent)">&#9888; Out of Stock</span>')
        : '<span style="color:var(--color-muted)">Select options to check availability</span>';

    container.innerHTML = `
    <section class="page-header"><div class="container">
        <div class="breadcrumb"><a href="index.html">Home</a> &middot; <a href="shop.html">Shop</a> &middot; <a href="shop.html?category=${product.category_id}">${product.category_name}</a> &middot; ${product.name}</div>
    </div></section>
    <section class="section" style="padding-top:30px"><div class="container">
        <div class="product-detail">
            <div class="product-gallery">
                <div class="main-img"><img id="main-product-img" src="${images[0]}" alt="${product.name}"></div>
                ${thumbsHtml}
            </div>
            <div class="product-detail-info">
                <h1>${product.name}</h1>
                <div class="pd-price">${hasSale?`<span class="original">${formatPrice(product.price)}</span> <span class="sale">${formatPrice(product.sale_price)}</span>`:formatPrice(product.price)}</div>
                <div class="stock-status" id="stock-status">${stockHtml}</div>
                ${sizesHtml}
                <div class="stock-alert" id="stock-alert"></div>
                <div class="qty-cart-row">
                    <div class="qty-big">
                        <button type="button" onclick="changeQty(-1)">&minus;</button>
                        <span id="qty-display">1</span>
                        <button type="button" onclick="changeQty(1)">+</button>
                    </div>
                    <button class="btn btn-outline" id="add-to-cart-btn" onclick="handleAddToCart(${product.id})"${!variants&&product.stock===0?' disabled':''}>
                        ${!variants&&product.stock===0?'Out of Stock':'Add to Cart'}
                    </button>
                    <button class="btn btn-accent" id="buy-now-btn" onclick="handleBuyNow(${product.id})"${!variants&&product.stock===0?' disabled':''}>Buy Now</button>
                </div>
                ${product.short_description?`<p class="pd-short-description">${product.short_description}</p>`:''}
                <div class="meta-row">
                    <p><strong>Category:</strong> <a href="shop.html?category=${product.category_id}">${product.category_name}</a></p>
                    <p><strong>Delivery:</strong> Same-day available within city limits.</p>
                    ${hasSizes?'<p><strong>Note:</strong> Please select your options before adding to cart.</p>':''}
                </div>
            </div>
        </div>
    </div></section>
    ${longDesc}${relatedHtml}`;

    window.__pd__ = { product, variants, hasSizes, selectedSize: null };
}
function switchImage(src, thumb) {
    document.getElementById('main-product-img').src = src;
    document.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));
    thumb.classList.add('active');
}
function changeQty(delta) {
    const el = document.getElementById('qty-display');
    let v = parseInt(el.textContent) + delta;
    if (v < 1) v = 1;
    el.textContent = v;
}
function selectSizeVariant(btn) {
    window.__pd__.selectedSize = btn.dataset.size;
    document.querySelectorAll('.size-btn').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    const s = window.__pd__.variants?.sizes?.find(x=>x.name===window.__pd__.selectedSize);
    const stock = s ? s.stock : 0;
    const cartBtn = document.getElementById('add-to-cart-btn');
    const buyBtn = document.getElementById('buy-now-btn');
    const status = document.getElementById('stock-status');
    if (stock === 0) {
        cartBtn.disabled=true; buyBtn.disabled=true;
        status.innerHTML='<span style="color:var(--color-accent)">&#9888; Out of Stock</span>';
    } else {
        cartBtn.disabled=false; buyBtn.disabled=false;
        status.innerHTML=`<span style="color:var(--color-primary)">&#10003; In Stock &mdash; ${stock} available</span>`;
    }
}
function handleAddToCart(id) {
    if (window.__pd__?.hasSizes && !window.__pd__.selectedSize) {
        const a = document.getElementById('stock-alert');
        if (a) { a.textContent='Please select a size.'; a.style.cssText='display:block;background:#fbe5e2;color:#92352b;padding:11px 16px;border-radius:4px;margin-bottom:20px;font-size:.88rem'; }
        return;
    }
    addToCart(id, parseInt(document.getElementById('qty-display').textContent));
}
function handleBuyNow(id) {
    if (window.__pd__?.hasSizes && !window.__pd__.selectedSize) {
        const a = document.getElementById('stock-alert');
        if (a) { a.textContent='Please select a size.'; a.style.cssText='display:block;background:#fbe5e2;color:#92352b;padding:11px 16px;border-radius:4px;margin-bottom:20px;font-size:.88rem'; }
        return;
    }
    buyNow(id, parseInt(document.getElementById('qty-display').textContent));
}

/* ---- Cart Page ---- */
function renderCartPage() {
    const container = document.getElementById('cart-page');
    if (!container) return;
    const cart = getCart();
    const total = cart.reduce((s,i)=>s+parseFloat(i.price)*parseInt(i.qty),0);
    if (cart.length === 0) {
        container.innerHTML='<div style="text-align:center;padding:60px 0"><p style="color:var(--color-muted);margin-bottom:20px">Your cart is empty.</p><a href="shop.html" class="btn btn-primary">Continue Shopping</a></div>';
        return;
    }
    container.innerHTML=`<div class="checkout-grid">
        <div>${cart.map(item=>`
            <div class="cart-item" style="padding:20px 0">
                <div class="cart-item-img" style="width:110px;height:110px"><img src="${item.image}" alt="${item.name}"></div>
                <div class="cart-item-info">
                    <h4 style="font-size:1.1rem">${item.name}</h4>
                    <div class="item-price">${formatPrice(item.price)}</div>
                    <div class="qty-control">
                        <button onclick="updateQty(${item.product_id},${parseInt(item.qty)-1})">&minus;</button>
                        <span>${item.qty}</span>
                        <button onclick="updateQty(${item.product_id},${parseInt(item.qty)+1})">+</button>
                    </div>
                    <button class="remove-item" onclick="removeItem(${item.product_id})">Remove</button>
                </div>
            </div>`).join('')}
        </div>
        <div class="order-summary"><h3>Order Summary</h3>
            <div class="summary-total"><span>Total</span><span>${formatPrice(total)}</span></div>
            <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:20px">Proceed to Checkout</a>
        </div>
    </div>`;
}

/* ---- Checkout Page ---- */
function initCheckoutPage() {
    const cart = getCart();
    const container = document.getElementById('checkout-page');
    if (!container) return;
    if (!cart.length) {
        container.innerHTML='<div style="text-align:center;padding:80px 0"><h2>Your cart is empty</h2><p style="color:var(--color-muted);margin:20px 0">Add a few blooms before checking out.</p><a href="shop.html" class="btn btn-primary">Browse Shop</a></div>';
        return;
    }
    const total = cart.reduce((s,i)=>s+parseFloat(i.price)*parseInt(i.qty),0);
    container.innerHTML=`<div class="checkout-grid">
        <div>
            <h2 style="font-style:italic;font-weight:400;margin-bottom:24px">Delivery Details</h2>
            <div id="checkout-msg"></div>
            <form id="checkout-form" onsubmit="submitCheckout(event)">
                <div class="form-row">
                    <div class="form-group"><label>Full Name</label><input type="text" name="name" required></div>
                    <div class="form-group"><label>Email</label><input type="email" name="email" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Phone</label><input type="tel" name="phone" required></div>
                    <div class="form-group"><label>City</label><input type="text" name="city" required></div>
                </div>
                <div class="form-group"><label>Delivery Address</label><input type="text" name="address" required placeholder="Street, building, apartment..."></div>
                <div class="form-group"><label>Order Notes (optional)</label><textarea name="notes" placeholder="Delivery instructions, card message..."></textarea></div>
                <div class="payment-method"><strong>Cash on Delivery</strong><p>Pay when your order arrives. No card needed.</p></div>
                <button type="submit" class="btn btn-primary btn-block" id="place-order-btn">Place Order</button>
            </form>
        </div>
        <aside class="order-summary"><h3>Order Summary</h3>
            ${cart.map(i=>`<div class="summary-item"><div class="item-name">${i.name}<small>Qty: ${i.qty}</small></div><div>${formatPrice(parseFloat(i.price)*parseInt(i.qty))}</div></div>`).join('')}
            <div class="summary-item" style="border-top:1px solid var(--color-border);margin-top:12px;padding-top:14px"><span>Subtotal</span><span>${formatPrice(total)}</span></div>
            <div class="summary-item"><span>Delivery</span><span style="color:var(--color-primary)">Free</span></div>
            <div class="summary-total"><span>Total</span><span>${formatPrice(total)}</span></div>
        </aside>
    </div>`;
}
function submitCheckout(e) {
    e.preventDefault();
    const btn = document.getElementById('place-order-btn');
    btn.disabled=true; btn.textContent='Placing order...';
    setTimeout(() => {
        const form = e.target;
        const cart = getCart();
        const total = cart.reduce((s,i)=>s+parseFloat(i.price)*parseInt(i.qty),0);
        const order = {
            id: Math.floor(100000+Math.random()*900000),
            name: form.name.value, address: form.address.value,
            city: form.city.value, phone: form.phone.value,
            total, items: cart
        };
        sessionStorage.setItem('fr_last_order', JSON.stringify(order));
        saveCart([]);
        updateCartUI();
        location.href='order-success.html';
    }, 1000);
}

/* ---- Order Success Page ---- */
function initOrderSuccessPage() {
    const container = document.getElementById('order-success-page');
    if (!container) return;
    const order = JSON.parse(sessionStorage.getItem('fr_last_order')||'null');
    let detailsHtml = '';
    if (order) {
        detailsHtml=`<div class="order-number">Order #${String(order.id).padStart(6,'0')}</div>
        <div class="order-summary" style="text-align:left;max-width:500px;margin:0 auto 30px"><h3>Order Details</h3>
            ${order.items.map(i=>`<div class="summary-item"><div class="item-name">${i.name}<small>Qty: ${i.qty}</small></div><div>${formatPrice(parseFloat(i.price)*parseInt(i.qty))}</div></div>`).join('')}
            <div class="summary-total"><span>Total</span><span>${formatPrice(order.total)}</span></div>
            <div style="margin-top:24px;font-size:.92rem"><p><strong>Delivery to:</strong></p><p>${order.name}</p><p>${order.address}, ${order.city}</p><p>${order.phone}</p></div>
        </div>`;
        sessionStorage.removeItem('fr_last_order');
    }
    container.innerHTML=`<div class="success-wrap">
        <div class="check">&#10003;</div>
        <h1>Thank You for Your Order!</h1>
        <p>Your order has been received. We'll send a confirmation to your email shortly.</p>
        ${detailsHtml}
        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
            <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
            <a href="index.html" class="btn btn-outline">Back to Home</a>
        </div>
    </div>`;
}

/* ---- Contact Form ---- */
function submitContact(e) {
    e.preventDefault();
    document.getElementById('contact-msg').innerHTML =
        '<div class="notice notice-success">Thank you! Your message has been received. We\'ll be in touch shortly.</div>';
    e.target.reset();
}

/* ---- Article Page ---- */
function initArticlePage() {
    const slug = new URLSearchParams(location.search).get('slug');
    const post = BLOG_POSTS.find(p=>p.slug===slug);
    const container = document.getElementById('article-page');
    if (!post) {
        container.innerHTML='<section class="section"><div class="container" style="text-align:center;padding:80px 0"><h1>Article not found</h1><a href="blog.html" class="btn btn-primary" style="margin-top:20px">Back to Journal</a></div></section>';
        return;
    }
    document.title = post.title + ' — Floral Radiance';
    const related = BLOG_POSTS.filter(p=>p.id!==post.id).slice(0,3);
    container.innerHTML=`
    <section class="page-header"><div class="container"><div class="breadcrumb"><a href="index.html">Home</a> &middot; <a href="blog.html">Journal</a></div></div></section>
    <article class="container article">
        <div class="article-meta">${post.created_at} &middot; By ${post.author}</div>
        <h1>${post.title}</h1>
        <p style="color:var(--color-muted);font-size:1.1rem;margin-bottom:30px">${post.excerpt}</p>
        <div class="article-hero"><img src="${post.image_url}" alt="${post.title}"></div>
        <div class="article-content">${post.content}</div>
    </article>
    ${related.length?`<section class="section section-light"><div class="container">
        <div class="section-header"><span class="section-eyebrow">More Reading</span><h2>You Might Also Enjoy</h2></div>
        <div class="blog-grid">${related.map(rp=>blogCardHtml(rp)).join('')}</div>
    </div></section>`:''}`;
}
