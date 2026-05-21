/* ============================================
   Floral Radiance — HTML+JS Version App
   ============================================ */
const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

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
function getCartFromStorage() {
    return JSON.parse(localStorage.getItem('fr_cart') || '[]');
}
function saveCartToStorage(items) {
    localStorage.setItem('fr_cart', JSON.stringify(items));
}
function formatPrice(val) { return '$' + parseFloat(val).toFixed(2); }

/* ===== CartApp ===== */
const CartApp = {
    setup() {
        const cart = ref(getCartFromStorage());
        const drawerOpen = ref(false);
        const mobileNavOpen = ref(false);
        const toastMsg = ref('');
        const toastVisible = ref(false);
        const searchOpen = ref(false);
        const searchQuery = ref('');
        const searchResults = ref([]);
        const searchLoading = ref(false);
        const searchInputRef = ref(null);
        let searchTimeout = null;

        const openSearch = () => {
            searchOpen.value = true;
            nextTick(() => { if (searchInputRef.value) searchInputRef.value.focus(); });
        };
        const closeSearch = () => {
            searchOpen.value = false;
            searchQuery.value = '';
            searchResults.value = [];
        };

        watch(searchQuery, (q) => {
            clearTimeout(searchTimeout);
            if (q.trim().length < 2) { searchResults.value = []; return; }
            searchLoading.value = true;
            searchTimeout = setTimeout(() => {
                const lower = q.toLowerCase();
                searchResults.value = PRODUCTS.filter(p =>
                    p.name.toLowerCase().includes(lower) ||
                    (p.short_description || '').toLowerCase().includes(lower)
                ).slice(0, 8).map(p => ({
                    id: p.id, name: p.name, slug: p.slug,
                    price: p.price, sale_price: p.sale_price,
                    image: getProductImage(p)
                }));
                searchLoading.value = false;
            }, 300);
        });

        const cartCount = computed(() => cart.value.reduce((s, i) => s + parseInt(i.qty || 0), 0));
        const cartTotal = computed(() => cart.value.reduce((s, i) => s + parseFloat(i.price) * parseInt(i.qty), 0));
        const formattedTotal = computed(() => '$' + cartTotal.value.toFixed(2));

        const showToast = (msg) => {
            toastMsg.value = msg;
            toastVisible.value = true;
            setTimeout(() => { toastVisible.value = false; }, 2400);
        };
        const fetchCart = () => { cart.value = getCartFromStorage(); };

        const addToCart = (productId, qty = 1) => {
            const product = PRODUCTS.find(p => p.id === parseInt(productId));
            if (!product) { showToast('Product not found'); return; }
            const items = [...cart.value];
            const existing = items.find(item => item.product_id === parseInt(productId));
            const price = product.sale_price && parseFloat(product.sale_price) > 0
                ? product.sale_price : product.price;
            if (existing) {
                existing.qty = parseInt(existing.qty) + parseInt(qty);
            } else {
                items.push({ product_id: parseInt(productId), name: product.name, price, qty: parseInt(qty), image: getProductImage(product) });
            }
            cart.value = items;
            saveCartToStorage(items);
            showToast('Added to cart');
            drawerOpen.value = true;
        };

        const updateQty = (productId, qty) => {
            if (parseInt(qty) < 1) return removeItem(productId);
            const items = cart.value.map(item => item.product_id === parseInt(productId) ? { ...item, qty: parseInt(qty) } : item);
            cart.value = items;
            saveCartToStorage(items);
        };

        const removeItem = (productId) => {
            const items = cart.value.filter(item => item.product_id !== parseInt(productId));
            cart.value = items;
            saveCartToStorage(items);
            showToast('Removed from cart');
        };

        const openDrawer = () => { drawerOpen.value = true; };
        const closeDrawer = () => { drawerOpen.value = false; };
        const toggleMobileNav = () => { mobileNavOpen.value = !mobileNavOpen.value; };
        const goToCheckout = () => { window.location.href = 'checkout.html'; };
        const fmtPrice = (val) => '$' + parseFloat(val).toFixed(2);
        const setCart = (items) => { cart.value = items; saveCartToStorage(items); };

        return {
            cart, drawerOpen, mobileNavOpen, cartCount, cartTotal, formattedTotal,
            toastMsg, toastVisible, searchOpen, searchQuery, searchResults, searchLoading, searchInputRef,
            openSearch, closeSearch, addToCart, updateQty, removeItem,
            openDrawer, closeDrawer, toggleMobileNav, goToCheckout,
            formatPrice: fmtPrice, fetchCart, showToast, setCart
        };
    }
};

/* ===== ShopApp ===== */
const ShopApp = {
    setup() {
        const urlParams = new URLSearchParams(window.location.search);
        const allProducts = ref(PRODUCTS);
        const categories = ref(CATEGORIES);
        const activeCategory = ref(parseInt(urlParams.get('category') || '0'));
        const sortBy = ref('newest');
        const minPrice = ref('');
        const maxPrice = ref('');

        const effective = (p) => parseFloat(p.sale_price && parseFloat(p.sale_price) > 0 ? p.sale_price : p.price);

        const filteredProducts = computed(() => {
            let result = [...allProducts.value];
            if (parseInt(activeCategory.value) > 0) {
                result = result.filter(p => parseInt(p.category_id) === parseInt(activeCategory.value));
            }
            const min = parseFloat(minPrice.value);
            const max = parseFloat(maxPrice.value);
            result = result.filter(p => {
                const price = effective(p);
                if (!isNaN(min) && price < min) return false;
                if (!isNaN(max) && price > max) return false;
                return true;
            });
            if (sortBy.value === 'price-asc') result.sort((a, b) => effective(a) - effective(b));
            else if (sortBy.value === 'price-desc') result.sort((a, b) => effective(b) - effective(a));
            else result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            return result;
        });

        const fmtPrice = (val) => '$' + parseFloat(val).toFixed(2);
        const formatSavings = (p) => '$' + (parseFloat(p.price) - parseFloat(p.sale_price)).toFixed(0);
        const productImage = (p) => getProductImage(p);
        const setCategory = (id) => { activeCategory.value = id; };

        const addToCartShop = (productId) => {
            if (window.__cartApp__) window.__cartApp__.addToCart(productId, 1);
        };
        const buyNowProduct = (productId) => {
            if (window.__cartApp__) window.__cartApp__.addToCart(productId, 1);
            setTimeout(() => { window.location.href = 'checkout.html'; }, 400);
        };

        return {
            allProducts, categories, activeCategory, sortBy, minPrice, maxPrice,
            filteredProducts, formatPrice: fmtPrice, formatSavings, productImage,
            setCategory, addToCart: addToCartShop, buyNowProduct, effective
        };
    }
};

/* ===== IndexApp ===== */
const IndexApp = {
    setup() {
        const categories = ref(CATEGORIES);
        const products = ref(PRODUCTS.slice(0, 12));
        const posts = ref(BLOG_POSTS.slice(0, 3));
        const productImage = (p) => getProductImage(p);
        const fmtPrice = (val) => '$' + parseFloat(val).toFixed(2);
        const formatSavings = (p) => '$' + (parseFloat(p.price) - parseFloat(p.sale_price)).toFixed(0);
        const addToCart = (id, qty = 1) => { if (window.__cartApp__) window.__cartApp__.addToCart(id, qty); };
        const buyNow = (id, qty = 1) => { if (window.__cartApp__) window.__cartApp__.addToCart(id, qty); setTimeout(() => { window.location.href = 'checkout.html'; }, 400); };
        return { categories, products, posts, productImage, formatPrice: fmtPrice, formatSavings, addToCart, buyNow };
    }
};

/* ===== BlogApp ===== */
const BlogApp = {
    setup() {
        const posts = ref(BLOG_POSTS);
        return { posts };
    }
};

/* ===== Mount ===== */
window.addEventListener('DOMContentLoaded', () => {
    const cartEl = document.getElementById('cart-app');
    if (cartEl) {
        const app = createApp(CartApp);
        window.__cartApp__ = app.mount('#cart-app');
    }
    const shopEl = document.getElementById('shop-app');
    if (shopEl) { createApp(ShopApp).mount('#shop-app'); }
    const indexEl = document.getElementById('index-app');
    if (indexEl) { createApp(IndexApp).mount('#index-app'); }
    const blogEl = document.getElementById('blog-app');
    if (blogEl) { createApp(BlogApp).mount('#blog-app'); }

    if (document.getElementById('product-page')) initProductPage();
    if (document.getElementById('article-page')) initArticlePage();
    if (document.getElementById('checkout-page')) initCheckoutPage();
    if (document.getElementById('order-success-page')) initOrderSuccessPage();
});

/* ===== Global add-to-cart / buy-now ===== */
window.addToCart = function(productId, qty = 1) {
    if (window.__cartApp__) window.__cartApp__.addToCart(productId, qty);
};
window.buyNow = function(productId, qty = 1) {
    if (window.__cartApp__) window.__cartApp__.addToCart(productId, qty);
    setTimeout(() => { window.location.href = 'checkout.html'; }, 400);
};

/* ===== Product Page ===== */
function initProductPage() {
    const slug = new URLSearchParams(window.location.search).get('slug');
    const product = PRODUCTS.find(p => p.slug === slug);
    const container = document.getElementById('product-page');
    if (!product) {
        container.innerHTML = '<div class="section"><div class="container" style="text-align:center;padding:80px 0"><h1>Product not found</h1><a href="shop.html" class="btn btn-primary" style="margin-top:20px">Back to Shop</a></div></div>';
        return;
    }
    document.title = product.name + ' — Floral Radiance';
    const images = getProductImages(product);
    const hasSale = product.sale_price && parseFloat(product.sale_price) > 0;
    const variants = product.variants ? (typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants) : null;
    const hasSizes = variants && variants.sizes && variants.sizes.length > 0;

    let variantsHtml = '';
    if (hasSizes) {
        variantsHtml += `<div class="variant-group">
            <span class="variant-label">Size</span>
            <div class="size-options">
                ${variants.sizes.map(s => `<button type="button" class="size-btn" data-size="${s.name}" onclick="selectSizeVariant(this)">${s.name}</button>`).join('')}
            </div>
        </div>`;
    }

    const related = PRODUCTS.filter(p => p.category_id === product.category_id && p.id !== product.id).slice(0, 4);
    const relatedHtml = related.map(r => {
        const rSale = r.sale_price && parseFloat(r.sale_price) > 0;
        return `<div class="product-card">
            <div class="product-image-wrap">
                ${rSale ? `<span class="save-badge">Save $${(parseFloat(r.price)-parseFloat(r.sale_price)).toFixed(0)}</span>` : ''}
                <a href="product.html?slug=${r.slug}"><img src="${getProductImage(r)}" alt="${r.name}" loading="lazy"></a>
            </div>
            <div class="product-info">
                <div class="product-price">
                    ${rSale ? `<span class="original">${formatPrice(r.price)}</span><span class="current-price">${formatPrice(r.sale_price)}</span>` : `<span class="current-price">${formatPrice(r.price)}</span>`}
                </div>
                <h3><a href="product.html?slug=${r.slug}">${r.name}</a></h3>
                <div class="card-actions">
                    <button class="btn-add-cart" onclick="addToCart(${r.id})"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.067-.852 2.184-1.97l.823-7.41A.75.75 0 0 0 21.32 4.5H5.106M7.5 14.25 5.106 4.5M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/></svg> Add to Cart</button>
                    <button class="btn-buy-now" onclick="buyNow(${r.id})">Buy Now</button>
                </div>
            </div>
        </div>`;
    }).join('');

    const thumbsHtml = images.length > 1 ? `<div class="thumb-row">${images.map((img, i) => `<div class="thumb ${i===0?'active':''}" onclick="switchImage('${img}', this)"><img src="${img}" alt=""></div>`).join('')}</div>` : '';
    const longDesc = product.long_description ? `<section class="section product-long-desc-section"><div class="container"><div class="product-long-desc-wrap"><h2>Product Details</h2><div class="product-long-desc-body">${product.long_description}</div></div></div></section>` : '';
    const relatedSection = related.length ? `<section class="section section-light"><div class="container"><div class="section-header"><span class="section-eyebrow">You might also like</span><h2>Related Bouquets</h2></div><div class="product-grid">${relatedHtml}</div></div></section>` : '';

    container.innerHTML = `
    <section class="page-header">
        <div class="container">
            <div class="breadcrumb"><a href="index.html">Home</a> &middot; <a href="shop.html">Shop</a> &middot; <a href="shop.html?category=${product.category_id}">${product.category_name}</a> &middot; ${product.name}</div>
        </div>
    </section>
    <section class="section" style="padding-top:30px">
        <div class="container">
            <div class="product-detail">
                <div class="product-gallery">
                    <div class="main-img"><img id="main-product-img" src="${images[0]}" alt="${product.name}"></div>
                    ${thumbsHtml}
                </div>
                <div class="product-detail-info">
                    <h1>${product.name}</h1>
                    <div class="pd-price">
                        ${hasSale ? `<span class="original">${formatPrice(product.price)}</span> <span class="sale">${formatPrice(product.sale_price)}</span>` : formatPrice(product.price)}
                    </div>
                    <div class="stock-status" id="stock-status">
                        ${!variants ? (product.stock > 0 ? `<span style="color:var(--color-primary)">&#10003; In Stock &mdash; ${product.stock} available</span>` : '<span style="color:var(--color-accent)">&#9888; Out of Stock</span>') : '<span style="color:var(--color-muted)">Select options to check availability</span>'}
                    </div>
                    ${variantsHtml ? `<div class="variant-section">${variantsHtml}</div>` : ''}
                    <div class="stock-alert" id="stock-alert" style="display:none"></div>
                    <div class="qty-cart-row">
                        <div class="qty-big">
                            <button type="button" onclick="changeQty(-1)">&minus;</button>
                            <span id="qty-display">1</span>
                            <button type="button" onclick="changeQty(1)">+</button>
                        </div>
                        <button class="btn btn-outline" id="add-to-cart-btn" onclick="handleAddToCart(${product.id})" ${!variants && product.stock === 0 ? 'disabled' : ''}>
                            ${!variants && product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button class="btn btn-accent" id="buy-now-btn" onclick="handleBuyNow(${product.id})" ${!variants && product.stock === 0 ? 'disabled' : ''}>
                            Buy Now
                        </button>
                    </div>
                    ${product.short_description ? `<p class="pd-short-description">${product.short_description}</p>` : ''}
                    <div class="meta-row">
                        <p><strong>Category:</strong> <a href="shop.html?category=${product.category_id}">${product.category_name}</a></p>
                        <p><strong>Delivery:</strong> Same-day available within city limits.</p>
                        ${variants ? '<p><strong>Note:</strong> Please select your options before adding to cart.</p>' : ''}
                    </div>
                </div>
            </div>
        </div>
    </section>
    ${longDesc}
    ${relatedSection}`;

    window.__currentProduct__ = product;
    window.__productVariants__ = variants;
    window.__hasSizes__ = hasSizes;
    window.__selectedSize__ = null;
}

function switchImage(src, thumb) {
    document.getElementById('main-product-img').src = src;
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
}
function changeQty(delta) {
    const el = document.getElementById('qty-display');
    let v = parseInt(el.textContent, 10) + delta;
    if (v < 1) v = 1;
    el.textContent = v;
}
function selectSizeVariant(btn) {
    if (btn.disabled) return;
    window.__selectedSize__ = btn.dataset.size;
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const p = window.__currentProduct__;
    if (p && window.__productVariants__ && window.__productVariants__.sizes) {
        const sObj = window.__productVariants__.sizes.find(s => s.name === window.__selectedSize__);
        const stock = sObj ? sObj.stock : 0;
        const cartBtn = document.getElementById('add-to-cart-btn');
        const buyBtn = document.getElementById('buy-now-btn');
        const status = document.getElementById('stock-status');
        if (stock === 0) {
            cartBtn.disabled = true; buyBtn.disabled = true;
            status.innerHTML = '<span style="color:var(--color-accent)">&#9888; Out of Stock</span>';
        } else {
            cartBtn.disabled = false; buyBtn.disabled = false;
            status.innerHTML = `<span style="color:var(--color-primary)">&#10003; In Stock &mdash; ${stock} available</span>`;
        }
    }
}
function handleAddToCart(productId) {
    if (window.__hasSizes__ && !window.__selectedSize__) {
        const a = document.getElementById('stock-alert');
        a.innerHTML = '&#9888; Please select a size.';
        a.style.display = 'flex'; a.style.alignItems = 'center'; a.style.gap = '8px';
        a.style.background = '#fbe5e2'; a.style.color = '#92352b';
        a.style.padding = '11px 16px'; a.style.borderRadius = '4px';
        a.style.marginBottom = '20px'; a.style.fontSize = '0.88rem';
        return;
    }
    const qty = parseInt(document.getElementById('qty-display').textContent, 10);
    window.addToCart(productId, qty);
}
function handleBuyNow(productId) {
    if (window.__hasSizes__ && !window.__selectedSize__) {
        const a = document.getElementById('stock-alert');
        a.innerHTML = '&#9888; Please select a size.';
        a.style.display = 'flex'; a.style.background = '#fbe5e2'; a.style.color = '#92352b';
        return;
    }
    const qty = parseInt(document.getElementById('qty-display').textContent, 10);
    window.buyNow(productId, qty);
}

/* ===== Article Page ===== */
function initArticlePage() {
    const slug = new URLSearchParams(window.location.search).get('slug');
    const post = BLOG_POSTS.find(p => p.slug === slug);
    const container = document.getElementById('article-page');
    if (!post) {
        container.innerHTML = '<div class="section"><div class="container" style="text-align:center;padding:80px 0"><h1>Article not found</h1><a href="blog.html" class="btn btn-primary" style="margin-top:20px">Back to Journal</a></div></div>';
        return;
    }
    document.title = post.title + ' — Floral Radiance';
    const related = BLOG_POSTS.filter(p => p.id !== post.id).slice(0, 3);
    const relatedHtml = related.map(rp => `
        <article class="blog-card">
            <a href="article.html?slug=${rp.slug}" class="blog-image"><img src="${rp.image_url}" alt="${rp.title}"></a>
            <div class="blog-content">
                <div class="blog-meta">${rp.created_at}</div>
                <h3><a href="article.html?slug=${rp.slug}">${rp.title}</a></h3>
                <p>${rp.excerpt}</p>
                <a href="article.html?slug=${rp.slug}" class="read-more">Read more &rarr;</a>
            </div>
        </article>`).join('');
    container.innerHTML = `
    <section class="page-header"><div class="container"><div class="breadcrumb"><a href="index.html">Home</a> &middot; <a href="blog.html">Journal</a></div></div></section>
    <article class="container article">
        <div class="article-meta">${post.created_at} &middot; By ${post.author}</div>
        <h1>${post.title}</h1>
        <p style="color:var(--color-muted);font-size:1.1rem;margin-bottom:30px">${post.excerpt}</p>
        <div class="article-hero"><img src="${post.image_url}" alt="${post.title}"></div>
        <div class="article-content">${post.content}</div>
    </article>
    ${related.length ? `<section class="section section-light"><div class="container"><div class="section-header"><span class="section-eyebrow">More Reading</span><h2>You Might Also Enjoy</h2></div><div class="blog-grid">${relatedHtml}</div></div></section>` : ''}`;
}

/* ===== Checkout Page ===== */
function initCheckoutPage() {
    const cart = getCartFromStorage();
    const container = document.getElementById('checkout-page');
    if (!cart.length) {
        container.innerHTML = '<div style="text-align:center;padding:80px 0"><h2>Your cart is empty</h2><p style="color:var(--color-muted);margin:20px 0">Add a few blooms before checking out.</p><a href="shop.html" class="btn btn-primary">Browse Shop</a></div>';
        return;
    }
    const total = cart.reduce((s, i) => s + parseFloat(i.price) * parseInt(i.qty), 0);
    const itemsHtml = cart.map(item => `
        <div class="summary-item">
            <div class="item-name">${item.name}<small>Qty: ${item.qty}</small></div>
            <div>${formatPrice(parseFloat(item.price) * parseInt(item.qty))}</div>
        </div>`).join('');
    container.innerHTML = `
    <div class="checkout-grid">
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
        <aside class="order-summary">
            <h3>Order Summary</h3>
            ${itemsHtml}
            <div class="summary-item" style="border-top:1px solid var(--color-border);margin-top:12px;padding-top:14px">
                <span>Subtotal</span><span>${formatPrice(total)}</span>
            </div>
            <div class="summary-item"><span>Delivery</span><span style="color:var(--color-primary)">Free</span></div>
            <div class="summary-total"><span>Total</span><span>${formatPrice(total)}</span></div>
        </aside>
    </div>`;
}

window.submitCheckout = function(e) {
    e.preventDefault();
    const btn = document.getElementById('place-order-btn');
    btn.disabled = true; btn.textContent = 'Placing order...';
    setTimeout(() => {
        const orderId = Math.floor(100000 + Math.random() * 900000);
        const form = e.target;
        const cart = getCartFromStorage();
        const total = cart.reduce((s, i) => s + parseFloat(i.price) * parseInt(i.qty), 0);
        const orderData = {
            id: orderId,
            name: form.name.value,
            address: form.address.value,
            city: form.city.value,
            phone: form.phone.value,
            total,
            items: cart
        };
        sessionStorage.setItem('fr_last_order', JSON.stringify(orderData));
        saveCartToStorage([]);
        if (window.__cartApp__) window.__cartApp__.setCart([]);
        window.location.href = 'order-success.html';
    }, 1000);
};

/* ===== Order Success Page ===== */
function initOrderSuccessPage() {
    const container = document.getElementById('order-success-page');
    const orderData = JSON.parse(sessionStorage.getItem('fr_last_order') || 'null');
    let detailsHtml = '';
    if (orderData) {
        const itemsHtml = orderData.items.map(i => `<div class="summary-item"><div class="item-name">${i.name}<small>Qty: ${i.qty}</small></div><div>${formatPrice(parseFloat(i.price)*parseInt(i.qty))}</div></div>`).join('');
        detailsHtml = `
        <div class="order-number">Order #${String(orderData.id).padStart(6,'0')}</div>
        <div class="order-summary" style="text-align:left;max-width:500px;margin:0 auto 30px">
            <h3>Order Details</h3>
            ${itemsHtml}
            <div class="summary-total"><span>Total</span><span>${formatPrice(orderData.total)}</span></div>
            <div style="margin-top:24px;font-size:.92rem">
                <p><strong>Delivery to:</strong></p>
                <p>${orderData.name}</p><p>${orderData.address}, ${orderData.city}</p><p>${orderData.phone}</p>
            </div>
        </div>`;
        sessionStorage.removeItem('fr_last_order');
    }
    container.innerHTML = `
    <div class="success-wrap">
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
