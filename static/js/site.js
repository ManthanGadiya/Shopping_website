const pageId = document.body.dataset.page;
const pageProductId = Number(document.body.dataset.productId || 0);

let customerCache = null;
let productCache = [];
let API_BASE = "";

function normalizeBaseUrl(url) {
    return (url || "").trim().replace(/\/+$/, "");
}

function resolveApiBase() {
    const stored = normalizeBaseUrl(localStorage.getItem("apiBaseUrl") || "");
    if (stored) return stored;
    const origin = window.location.origin;
    if (origin.includes(":8000")) return origin;
    return "http://127.0.0.1:8000";
}

function setApiStatus(text, error = false) {
    const el = document.getElementById("api-status");
    if (!el) return;
    el.textContent = text;
    el.style.color = error ? "#b91c1c" : "#0f766e";
}

function tokenHeaders(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function customerToken() {
    return localStorage.getItem("customerToken") || "";
}

function adminToken() {
    return localStorage.getItem("adminToken") || "";
}

function setMsg(id, text, error = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || "";
    el.style.color = error ? "#b91c1c" : "#0f766e";
}

function formatInr(v) {
    return `INR ${Number(v || 0).toFixed(0)}`;
}

async function api(path, options = {}) {
    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, options);
    } catch {
        throw new Error(`Cannot reach backend at ${API_BASE}. Check backend URL and server status.`);
    }
    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }
    if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
    return data;
}

async function getMe() {
    const token = customerToken();
    if (!token) return null;
    if (customerCache) return customerCache;
    const me = await api("/customers/me", { headers: tokenHeaders(token) });
    customerCache = me;
    return me;
}

function openLoginModal() {
    document.getElementById("login-modal")?.classList.remove("hidden");
}

function closeLoginModal() {
    document.getElementById("login-modal")?.classList.add("hidden");
}

function initGlobalUi() {
    const apiInput = document.getElementById("api-base-url-input");
    const saveApiBtn = document.getElementById("save-api-base-btn");
    if (apiInput) apiInput.value = API_BASE;
    saveApiBtn?.addEventListener("click", async () => {
        const value = normalizeBaseUrl(apiInput?.value || "");
        if (!value) return;
        localStorage.setItem("apiBaseUrl", value);
        API_BASE = value;
        await checkBackendConnection();
        location.reload();
    });

    document.getElementById("customer-login-btn")?.addEventListener("click", openLoginModal);
    document.getElementById("close-login-modal")?.addEventListener("click", closeLoginModal);
    document.getElementById("customer-logout-btn")?.addEventListener("click", () => {
        localStorage.removeItem("customerToken");
        customerCache = null;
        location.reload();
    });

    document.getElementById("customer-login-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            const email = document.getElementById("login-email").value.trim();
            const password = document.getElementById("login-password").value;
            const data = await api("/customers/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            localStorage.setItem("customerToken", data.access_token);
            customerCache = data.customer;
            setMsg("login-msg", "Login successful.");
            setTimeout(() => location.reload(), 350);
        } catch (err) {
            setMsg("login-msg", err.message, true);
        }
    });

    document.getElementById("global-search-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = document.getElementById("global-search-input")?.value.trim() || "";
        localStorage.setItem("homeQuery", q);
        window.location.href = "/";
    });
}

async function checkBackendConnection() {
    try {
        const health = await api("/health");
        setApiStatus(`Backend connected: ${health.message}`);
    } catch (err) {
        setApiStatus(err.message, true);
    }
}

function productCard(product) {
    const wrap = document.createElement("article");
    wrap.className = "product-card";
    wrap.innerHTML = `
        <h4>${product.product_name}</h4>
        <p class="meta">${product.product_type} • Rating ${Number(product.rating).toFixed(1)} • Stock ${product.stock_quantity}</p>
        <div class="row">
            <strong>${formatInr(product.price)}</strong>
            <div class="actions">
                <a class="btn-link" href="/products/${product.product_id}">Details</a>
                <button type="button" data-add="${product.product_id}">Add</button>
            </div>
        </div>
    `;
    wrap.querySelector(`[data-add="${product.product_id}"]`)?.addEventListener("click", async () => {
        try {
            const me = await getMe();
            if (!me) {
                openLoginModal();
                return;
            }
            await api("/cart/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id: me.customer_id, product_id: product.product_id, quantity: 1 }),
            });
            alert("Added to cart");
        } catch (err) {
            alert(`Cart error: ${err.message}`);
        }
    });
    return wrap;
}

async function initHome() {
    const grid = document.getElementById("home-products");
    if (!grid) return;
    const sortEl = document.getElementById("home-sort");
    const query = (localStorage.getItem("homeQuery") || "").toLowerCase();
    localStorage.removeItem("homeQuery");
    try {
        const products = await api("/products/");
        productCache = products;
        const render = () => {
            let list = [...products];
            if (query) {
                list = list.filter((p) => p.product_name.toLowerCase().includes(query) || p.product_type.toLowerCase().includes(query));
            }
            const mode = sortEl?.value || "featured";
            if (mode === "price_asc") list.sort((a, b) => a.price - b.price);
            if (mode === "price_desc") list.sort((a, b) => b.price - a.price);
            if (mode === "rating_desc") list.sort((a, b) => b.rating - a.rating);
            grid.innerHTML = "";
            list.forEach((p) => grid.appendChild(productCard(p)));
        };
        sortEl?.addEventListener("change", render);
        render();
    } catch (err) {
        grid.innerHTML = `<p class="muted">Failed to load products: ${err.message}</p>`;
    }
}

async function initProductDetail() {
    if (!pageProductId) return;
    const detail = document.getElementById("product-detail");
    const reviewsList = document.getElementById("reviews-list");
    try {
        const product = await api(`/products/${pageProductId}`);
        detail.innerHTML = `
            <h2>${product.product_name}</h2>
            <p class="muted">${product.product_type}</p>
            <p><strong>Price:</strong> ${formatInr(product.price)}</p>
            <p><strong>Stock:</strong> ${product.stock_quantity}</p>
            <p><strong>Rating:</strong> ${Number(product.rating).toFixed(1)}</p>
            <div class="actions">
                <button id="detail-add-cart" type="button">Add to Cart</button>
                <a class="btn-link" href="/cart-page">Go to Cart</a>
            </div>
        `;
        document.getElementById("detail-add-cart")?.addEventListener("click", async () => {
            const me = await getMe();
            if (!me) return openLoginModal();
            await api("/cart/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id: me.customer_id, product_id: pageProductId, quantity: 1 }),
            });
            alert("Added to cart");
        });

        const reviews = await api(`/reviews/product/${pageProductId}`);
        reviewsList.innerHTML = reviews.length
            ? reviews.map((r) => `<div class="card"><p><strong>Rating:</strong> ${r.rating}</p><p>${r.comment || ""}</p></div>`).join("")
            : "<p class='muted'>No reviews yet.</p>";
    } catch (err) {
        detail.innerHTML = `<p class="muted">Error: ${err.message}</p>`;
    }

    document.getElementById("review-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            const me = await getMe();
            if (!me) return openLoginModal();
            const rating = Number(document.getElementById("review-rating").value);
            const comment = document.getElementById("review-comment").value.trim();
            await api("/reviews/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id: me.customer_id,
                    product_id: pageProductId,
                    rating,
                    comment,
                }),
            });
            setMsg("review-msg", "Review submitted.");
            setTimeout(() => location.reload(), 400);
        } catch (err) {
            setMsg("review-msg", err.message, true);
        }
    });
}

async function initCartPage() {
    const listEl = document.getElementById("cart-items-page");
    const totalEl = document.getElementById("cart-total-page");
    if (!listEl || !totalEl) return;
    try {
        const me = await getMe();
        if (!me) {
            listEl.innerHTML = "<p class='muted'>Login required to view cart.</p>";
            return;
        }
        const [cart, products] = await Promise.all([api(`/cart/${me.customer_id}`), api("/products/")]);
        const pMap = new Map(products.map((p) => [p.product_id, p]));
        let total = 0;
        if (!cart.length) {
            listEl.innerHTML = "<p class='muted'>Cart is empty.</p>";
        } else {
            listEl.innerHTML = "";
            cart.forEach((item) => {
                const p = pMap.get(item.product_id);
                const sub = Number(p?.price || 0) * Number(item.quantity || 0);
                total += sub;
                const row = document.createElement("article");
                row.className = "card";
                row.innerHTML = `
                    <h4>${p?.product_name || `Product #${item.product_id}`}</h4>
                    <p class="muted">${formatInr(p?.price || 0)} each</p>
                    <div class="row">
                        <input id="qty-${item.cart_item_id}" type="number" min="1" value="${item.quantity}" style="width:90px;">
                        <div class="actions">
                            <button type="button" data-upd="${item.cart_item_id}">Update</button>
                            <button type="button" data-del="${item.cart_item_id}" class="ghost">Remove</button>
                        </div>
                    </div>
                `;
                row.querySelector(`[data-upd="${item.cart_item_id}"]`)?.addEventListener("click", async () => {
                    const qty = Number(document.getElementById(`qty-${item.cart_item_id}`).value);
                    await api(`/cart/item/${item.cart_item_id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ quantity: qty }),
                    });
                    setMsg("cart-page-msg", "Cart updated.");
                    setTimeout(() => location.reload(), 250);
                });
                row.querySelector(`[data-del="${item.cart_item_id}"]`)?.addEventListener("click", async () => {
                    await api(`/cart/item/${item.cart_item_id}`, { method: "DELETE" });
                    setMsg("cart-page-msg", "Item removed.");
                    setTimeout(() => location.reload(), 250);
                });
                listEl.appendChild(row);
            });
        }
        totalEl.textContent = formatInr(total);
        document.getElementById("clear-cart-page-btn")?.addEventListener("click", async () => {
            await api(`/cart/clear/${me.customer_id}`, { method: "DELETE" });
            setMsg("cart-page-msg", "Cart cleared.");
            setTimeout(() => location.reload(), 250);
        });
    } catch (err) {
        listEl.innerHTML = `<p class="muted">Cart load failed: ${err.message}</p>`;
    }
}

async function initCheckoutPage() {
    const form = document.getElementById("checkout-form");
    if (!form) return;
    try {
        const me = await getMe();
        if (me) {
            document.getElementById("checkout-name").value = me.name || "";
            document.getElementById("checkout-email").value = me.email || "";
        }
    } catch {}

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            const me = await getMe();
            if (!me) return openLoginModal();
            const method = document.getElementById("checkout-payment-method").value;
            const order = await api("/orders/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id: me.customer_id, payment_method: method }),
            });
            setMsg("checkout-msg", "Order confirmed.");
            const receiptLink = order.payment?.payment_id
                ? `<a class="btn-link" href="/payments/${order.payment.payment_id}/receipt/pdf" target="_blank">Download Receipt PDF</a>`
                : "<span class='muted'>Receipt available in orders page.</span>";
            document.getElementById("checkout-confirmation").innerHTML = `
                <p><strong>Order ID:</strong> ${order.order_id}</p>
                <p><strong>Total:</strong> ${formatInr(order.total_amount)}</p>
                <p><strong>Status:</strong> ${order.delivery_status}</p>
                <p><strong>Payment:</strong> ${order.payment_status}</p>
                <div class="actions">${receiptLink}</div>
            `;
        } catch (err) {
            setMsg("checkout-msg", err.message, true);
        }
    });
}

async function initOrdersPage() {
    const list = document.getElementById("orders-list");
    const notificationsList = document.getElementById("notifications-list");
    if (!list) return;
    try {
        const me = await getMe();
        if (!me) {
            list.innerHTML = "<p class='muted'>Login required to view orders.</p>";
            if (notificationsList) notificationsList.innerHTML = "<p class='muted'>Login required.</p>";
            return;
        }
        const orders = await api(`/orders/customer/${me.customer_id}`);
        if (!orders.length) {
            list.innerHTML = "<p class='muted'>No orders yet.</p>";
            return;
        }
        list.innerHTML = "";
        orders.forEach((o) => {
            const receipt = o.payment?.payment_id
                ? `<a class="btn-link" href="/payments/${o.payment.payment_id}/receipt/pdf" target="_blank">Receipt PDF</a>`
                : "<span class='muted'>No receipt id yet</span>";
            const card = document.createElement("article");
            card.className = "card";
            card.innerHTML = `
                <h4>Order #${o.order_id}</h4>
                <p><strong>Date:</strong> ${new Date(o.order_date).toLocaleString()}</p>
                <p><strong>Total:</strong> ${formatInr(o.total_amount)}</p>
                <p><strong>Delivery:</strong> ${o.delivery_status}</p>
                <p><strong>Payment:</strong> ${o.payment_status}</p>
                <div class="actions">
                    ${receipt}
                    <button type="button" data-track="${o.order_id}">Tracking</button>
                </div>
                <div id="track-${o.order_id}" class="muted"></div>
            `;
            card.querySelector(`[data-track="${o.order_id}"]`)?.addEventListener("click", async () => {
                const out = card.querySelector(`#track-${o.order_id}`);
                const events = await api(`/orders/${o.order_id}/tracking`);
                out.innerHTML = events.length
                    ? events.map((ev) => `${new Date(ev.created_at).toLocaleString()} - ${ev.status}${ev.note ? ` (${ev.note})` : ""}`).join("<br>")
                    : "No tracking events.";
            });
            list.appendChild(card);
        });

        if (notificationsList) {
            const notifications = await api("/notifications/me", { headers: tokenHeaders(customerToken()) });
            notificationsList.innerHTML = notifications.length
                ? notifications
                    .map(
                        (n) => `<article class="card"><h4>${n.title}</h4><p>${n.message}</p><p class="muted">${new Date(n.created_at).toLocaleString()} • ${n.channel}</p></article>`
                    )
                    .join("")
                : "<p class='muted'>No notifications yet.</p>";
        }
    } catch (err) {
        list.innerHTML = `<p class="muted">Orders load failed: ${err.message}</p>`;
        if (notificationsList) notificationsList.innerHTML = `<p class="muted">Notifications load failed: ${err.message}</p>`;
    }
}

async function initServicesPage() {
    const list = document.getElementById("services-list");
    if (!list) return;
    try {
        const services = await api("/services/");
        list.innerHTML = services.length
            ? ""
            : "<p class='muted'>No services available yet.</p>";
        services.forEach((s) => {
            const card = document.createElement("article");
            card.className = "card";
            card.innerHTML = `
                <h4>${s.name}</h4>
                <p>${s.description || "No description"}</p>
                <p class="muted">Price: ${formatInr(s.price)} • ${s.is_active ? "Active" : "Inactive"}</p>
            `;
            list.appendChild(card);
        });
    } catch (err) {
        list.innerHTML = `<p class="muted">Services load failed: ${err.message}</p>`;
    }
}

async function initGuidesPage() {
    const list = document.getElementById("guides-list");
    if (!list) return;
    try {
        const articles = await api("/articles/");
        list.innerHTML = articles.length
            ? ""
            : "<p class='muted'>No guides published yet.</p>";
        articles
            .filter((a) => a.is_published)
            .forEach((a) => {
                const card = document.createElement("article");
                card.className = "card";
                card.innerHTML = `
                    <h4>${a.title}</h4>
                    <p>${a.content}</p>
                    <p class="muted">${new Date(a.created_at).toLocaleDateString()}</p>
                `;
                list.appendChild(card);
            });
    } catch (err) {
        list.innerHTML = `<p class="muted">Guides load failed: ${err.message}</p>`;
    }
}

function bindAdminLogin() {
    const form = document.getElementById("admin-login-form");
    if (!form) return;
    if (form.dataset.bound === "1") return;
    form.dataset.bound = "1";
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            const emailEl = document.getElementById("admin-email");
            const userNameEl = document.getElementById("admin-user-name");
            const email = emailEl ? emailEl.value.trim() : "";
            const user_name = userNameEl ? userNameEl.value.trim() : "";
            const password = document.getElementById("admin-password").value;
            const data = await api("/admins/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email || null, user_name: user_name || null, password }),
            });
            localStorage.setItem("adminToken", data.access_token);
            setMsg("admin-login-msg", "Admin login successful.");
            setTimeout(() => location.reload(), 250);
        } catch (err) {
            setMsg("admin-login-msg", err.message, true);
        }
    });
    document.getElementById("admin-logout-btn")?.addEventListener("click", () => {
        localStorage.removeItem("adminToken");
        setMsg("admin-login-msg", "Admin logged out.");
        setTimeout(() => location.reload(), 250);
    });
}

async function initAdminProductsPage() {
    const list = document.getElementById("admin-products-list");
    if (!list) return;
    bindAdminLogin();
    const token = adminToken();
    if (!token) {
        list.innerHTML = "<p class='muted'>Login as admin to manage products.</p>";
        return;
    }

    const render = async () => {
        const products = await api("/products/");
        list.innerHTML = "";
        products.forEach((p) => {
            const row = document.createElement("article");
            row.className = "card";
            row.innerHTML = `
                <h4>${p.product_name}</h4>
                <p class="muted">${p.product_type}</p>
                <div class="row">
                    <input id="p-price-${p.product_id}" type="number" value="${p.price}" step="0.01" style="width:110px;">
                    <input id="p-stock-${p.product_id}" type="number" value="${p.stock_quantity}" style="width:110px;">
                    <div class="actions">
                        <button data-save="${p.product_id}" type="button">Save</button>
                        <button data-del="${p.product_id}" type="button" class="ghost">Delete</button>
                    </div>
                </div>
            `;
            row.querySelector(`[data-save="${p.product_id}"]`)?.addEventListener("click", async () => {
                const price = Number(document.getElementById(`p-price-${p.product_id}`).value);
                const stock_quantity = Number(document.getElementById(`p-stock-${p.product_id}`).value);
                await api(`/products/${p.product_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", ...tokenHeaders(token) },
                    body: JSON.stringify({ price, stock_quantity }),
                });
                setMsg("admin-product-msg", "Product updated.");
                await render();
            });
            row.querySelector(`[data-del="${p.product_id}"]`)?.addEventListener("click", async () => {
                await api(`/products/${p.product_id}`, {
                    method: "DELETE",
                    headers: tokenHeaders(token),
                });
                setMsg("admin-product-msg", "Product deleted.");
                await render();
            });
            list.appendChild(row);
        });
    };

    document.getElementById("admin-add-product-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            const payload = {
                product_name: document.getElementById("new-product-name").value.trim(),
                product_type: document.getElementById("new-product-type").value.trim(),
                price: Number(document.getElementById("new-product-price").value),
                stock_quantity: Number(document.getElementById("new-product-stock").value),
            };
            await api("/products/", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...tokenHeaders(token) },
                body: JSON.stringify(payload),
            });
            setMsg("admin-product-msg", "Product added.");
            e.target.reset();
            await render();
        } catch (err) {
            setMsg("admin-product-msg", err.message, true);
        }
    });

    try {
        await render();
    } catch (err) {
        list.innerHTML = `<p class='muted'>Failed: ${err.message}</p>`;
    }
}

async function initAdminOrdersPage() {
    const list = document.getElementById("admin-orders-list");
    if (!list) return;
    bindAdminLogin();
    const token = adminToken();
    if (!token) {
        list.innerHTML = "<p class='muted'>Login as admin to manage orders.</p>";
        return;
    }
    try {
        const orders = await api("/orders/", { headers: tokenHeaders(token) });
        if (!orders.length) {
            list.innerHTML = "<p class='muted'>No orders.</p>";
            return;
        }
        list.innerHTML = "";
        orders.forEach((o) => {
            const card = document.createElement("article");
            card.className = "card";
            card.innerHTML = `
                <h4>Order #${o.order_id}</h4>
                <p><strong>Customer ID:</strong> ${o.customer_id}</p>
                <p><strong>Total:</strong> ${formatInr(o.total_amount)}</p>
                <div class="row">
                    <select id="d-status-${o.order_id}">
                        <option ${o.delivery_status === "PLACED" ? "selected" : ""}>PLACED</option>
                        <option ${o.delivery_status === "SHIPPED" ? "selected" : ""}>SHIPPED</option>
                        <option ${o.delivery_status === "DELIVERED" ? "selected" : ""}>DELIVERED</option>
                    </select>
                    <button data-upd-order="${o.order_id}" type="button">Update Status</button>
                </div>
            `;
            card.querySelector(`[data-upd-order="${o.order_id}"]`)?.addEventListener("click", async () => {
                const delivery_status = document.getElementById(`d-status-${o.order_id}`).value;
                await api(`/orders/${o.order_id}/status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", ...tokenHeaders(token) },
                    body: JSON.stringify({ delivery_status }),
                });
                alert("Order status updated");
            });
            list.appendChild(card);
        });
    } catch (err) {
        list.innerHTML = `<p class='muted'>Failed: ${err.message}</p>`;
    }
}

async function loadAdminKpis(token) {
    try {
        const sales = await api("/reports/sales-summary", { headers: tokenHeaders(token) });
        const inventory = await api("/reports/inventory-summary", { headers: tokenHeaders(token) });
        document.getElementById("kpi-orders").textContent = String(sales.total_orders);
        document.getElementById("kpi-revenue").textContent = formatInr(sales.total_revenue);
        document.getElementById("kpi-items").textContent = String(sales.total_items_sold);
        document.getElementById("kpi-receipts").textContent = String(sales.payment_receipts_generated);
        const invEl = document.getElementById("inventory-summary");
        if (invEl) {
            invEl.textContent = `Total Products: ${inventory.total_products} | Low Stock: ${inventory.low_stock} | Out of Stock: ${inventory.out_of_stock}`;
        }
    } catch {
        // Keep dashboard usable even if report fetch fails.
    }
}

async function loadAdminPayments(token) {
    const list = document.getElementById("admin-payments-list");
    if (!list) return;
    try {
        const payments = await api("/payments/", { headers: tokenHeaders(token) });
        if (!payments.length) {
            list.innerHTML = "<p class='muted'>No payments found.</p>";
            return;
        }
        list.innerHTML = "";
        payments.forEach((p) => {
            const card = document.createElement("article");
            card.className = "card";
            card.innerHTML = `
                <h4>Payment #${p.payment_id} (Order #${p.order_id})</h4>
                <p><strong>Method:</strong> ${p.payment_method}</p>
                <p><strong>Status:</strong> ${p.status}</p>
                <div class="row">
                    <select id="pay-status-${p.payment_id}">
                        <option ${p.status === "RECEIPT_GENERATED" ? "selected" : ""}>RECEIPT_GENERATED</option>
                        <option ${p.status === "PENDING" ? "selected" : ""}>PENDING</option>
                        <option ${p.status === "PAID" ? "selected" : ""}>PAID</option>
                    </select>
                    <div class="actions">
                        <button data-pay-save="${p.payment_id}" type="button">Update</button>
                        <a class="btn-link" href="${API_BASE}/payments/${p.payment_id}/receipt/pdf" target="_blank">Receipt PDF</a>
                    </div>
                </div>
            `;
            card.querySelector(`[data-pay-save="${p.payment_id}"]`)?.addEventListener("click", async () => {
                const status = document.getElementById(`pay-status-${p.payment_id}`).value;
                await api(`/payments/${p.payment_id}/status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", ...tokenHeaders(token) },
                    body: JSON.stringify({ status }),
                });
                await loadAdminPayments(token);
            });
            list.appendChild(card);
        });
    } catch (err) {
        list.innerHTML = `<p class='muted'>Payments load failed: ${err.message}</p>`;
    }
}

async function loadAdminServices(token) {
    const list = document.getElementById("admin-services-list");
    if (!list) return;
    const services = await api("/services/");
    list.innerHTML = services.length ? "" : "<p class='muted'>No services.</p>";
    services.forEach((s) => {
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
            <h4>${s.name}</h4>
            <p>${s.description || ""}</p>
            <p class="muted">Price: ${formatInr(s.price)} • ${s.is_active ? "Active" : "Inactive"}</p>
            <div class="actions">
                <button data-s-toggle="${s.service_id}" type="button">Toggle Active</button>
                <button data-s-del="${s.service_id}" class="ghost" type="button">Delete</button>
            </div>
        `;
        card.querySelector(`[data-s-toggle="${s.service_id}"]`)?.addEventListener("click", async () => {
            await api(`/services/${s.service_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...tokenHeaders(token) },
                body: JSON.stringify({ is_active: s.is_active ? 0 : 1 }),
            });
            await loadAdminServices(token);
        });
        card.querySelector(`[data-s-del="${s.service_id}"]`)?.addEventListener("click", async () => {
            await api(`/services/${s.service_id}`, {
                method: "DELETE",
                headers: tokenHeaders(token),
            });
            await loadAdminServices(token);
        });
        list.appendChild(card);
    });
}

async function loadAdminArticles(token) {
    const list = document.getElementById("admin-articles-list");
    if (!list) return;
    const articles = await api("/articles/");
    list.innerHTML = articles.length ? "" : "<p class='muted'>No articles.</p>";
    articles.forEach((a) => {
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
            <h4>${a.title}</h4>
            <p>${a.content}</p>
            <p class="muted">${new Date(a.created_at).toLocaleString()} • ${a.is_published ? "Published" : "Hidden"}</p>
            <div class="actions">
                <button data-a-toggle="${a.article_id}" type="button">Toggle Publish</button>
                <button data-a-del="${a.article_id}" class="ghost" type="button">Delete</button>
            </div>
        `;
        card.querySelector(`[data-a-toggle="${a.article_id}"]`)?.addEventListener("click", async () => {
            await api(`/articles/${a.article_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...tokenHeaders(token) },
                body: JSON.stringify({ is_published: a.is_published ? 0 : 1 }),
            });
            await loadAdminArticles(token);
        });
        card.querySelector(`[data-a-del="${a.article_id}"]`)?.addEventListener("click", async () => {
            await api(`/articles/${a.article_id}`, {
                method: "DELETE",
                headers: tokenHeaders(token),
            });
            await loadAdminArticles(token);
        });
        list.appendChild(card);
    });
}

async function initAdminDashboard() {
    bindAdminLogin();
    const token = adminToken();
    if (!token) {
        document.getElementById("admin-products-list").innerHTML = "<p class='muted'>Login as admin to manage data.</p>";
        document.getElementById("admin-orders-list").innerHTML = "<p class='muted'>Login as admin to manage data.</p>";
        document.getElementById("admin-payments-list").innerHTML = "<p class='muted'>Login as admin to manage data.</p>";
        return;
    }
    await loadAdminKpis(token);
    await initAdminProductsPage();
    await initAdminOrdersPage();
    await loadAdminPayments(token);
    await loadAdminServices(token);
    await loadAdminArticles(token);

    document.getElementById("admin-add-service-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            await api("/services/", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...tokenHeaders(token) },
                body: JSON.stringify({
                    name: document.getElementById("new-service-name").value.trim(),
                    description: document.getElementById("new-service-description").value.trim(),
                    price: Number(document.getElementById("new-service-price").value),
                    is_active: 1,
                }),
            });
            setMsg("admin-service-msg", "Service added.");
            e.target.reset();
            await loadAdminServices(token);
        } catch (err) {
            setMsg("admin-service-msg", err.message, true);
        }
    });

    document.getElementById("admin-add-article-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            await api("/articles/", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...tokenHeaders(token) },
                body: JSON.stringify({
                    title: document.getElementById("new-article-title").value.trim(),
                    content: document.getElementById("new-article-content").value.trim(),
                    is_published: 1,
                }),
            });
            setMsg("admin-article-msg", "Article published.");
            e.target.reset();
            await loadAdminArticles(token);
        } catch (err) {
            setMsg("admin-article-msg", err.message, true);
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    API_BASE = resolveApiBase();
    initGlobalUi();
    await checkBackendConnection();
    if (pageId === "home") await initHome();
    if (pageId === "product_detail") await initProductDetail();
    if (pageId === "cart") await initCartPage();
    if (pageId === "checkout") await initCheckoutPage();
    if (pageId === "orders") await initOrdersPage();
    if (pageId === "services") await initServicesPage();
    if (pageId === "guides") await initGuidesPage();
    if (pageId === "admin_products") await initAdminProductsPage();
    if (pageId === "admin_orders") await initAdminOrdersPage();
    if (pageId === "admin_dashboard") await initAdminDashboard();
});
