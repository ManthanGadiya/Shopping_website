function getDefaultApiBaseUrl() {
    if (window.location.protocol === "file:") {
        return "http://127.0.0.1:8000";
    }
    return window.location.origin;
}

let allProducts = [];
let currentCategory = "all";
let currentQuery = "";
let currentSort = "featured";
let cartCount = 0;
let currentCustomer = null;

function setAuthView(isLoggedIn) {
    const guestSection = document.getElementById("guest-auth-section");
    const memberZone = document.getElementById("member-zone");
    if (!guestSection || !memberZone) return;
    guestSection.classList.toggle("hidden", isLoggedIn);
    memberZone.classList.toggle("hidden", !isLoggedIn);
}

function getCustomerToken() {
    return localStorage.getItem("customerToken") || "";
}

function setCustomerToken(token) {
    if (token) localStorage.setItem("customerToken", token);
}

function clearCustomerToken() {
    localStorage.removeItem("customerToken");
}

function getApiBaseUrl() {
    return localStorage.getItem("apiBaseUrl") || getDefaultApiBaseUrl();
}

function normalizeUrl(url) {
    return url.replace(/\/+$/, "");
}

async function checkBackendStatus() {
    const statusText = document.getElementById("status-text");
    if (!statusText) return;

    try {
        const response = await fetch(`${getApiBaseUrl()}/health`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        statusText.textContent = `Connected: ${data.message}`;
        statusText.classList.remove("error");
        statusText.classList.add("ok");
    } catch (error) {
        statusText.textContent = `Backend unavailable: ${error.message}`;
        statusText.classList.remove("ok");
        statusText.classList.add("error");
    }
}

function initApiUrlControls() {
    const input = document.getElementById("api-base-url");
    const saveButton = document.getElementById("save-api-url");
    const retryButton = document.getElementById("retry-connection");
    if (!input || !saveButton || !retryButton) return;

    input.value = getApiBaseUrl();

    saveButton.addEventListener("click", () => {
        const value = normalizeUrl(input.value.trim());
        if (!value) return;
        localStorage.setItem("apiBaseUrl", value);
        checkBackendStatus();
    });

    retryButton.addEventListener("click", checkBackendStatus);
}

function setMessage(id, text, isError = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.style.color = isError ? "#b91c1c" : "#0f766e";
}

function formatPrice(value) {
    return `INR ${Number(value).toFixed(0)}`;
}

function normalizeCategory(value) {
    return (value || "").toLowerCase();
}

function updateCartBadge() {
    const chip = document.getElementById("cart-chip");
    if (!chip) return;
    chip.textContent = `Cart (${cartCount})`;
}

function setCartMessage(text, isError = false) {
    setMessage("cart-msg", text, isError);
}

function toggleCartDrawer(open) {
    const overlay = document.getElementById("cart-overlay");
    const drawer = document.getElementById("cart-drawer");
    if (!overlay || !drawer) return;
    overlay.classList.toggle("hidden", !open);
    drawer.classList.toggle("hidden", !open);
}

async function resolveCurrentCustomer() {
    const token = getCustomerToken();
    if (!token) return null;
    if (currentCustomer?.customer_id) return currentCustomer;

    const meRes = await fetch(`${getApiBaseUrl()}/customers/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const me = await meRes.json();
    if (!meRes.ok) throw new Error(me.detail || "Unable to resolve customer");
    currentCustomer = me;
    return me;
}

async function renderCartItems() {
    const itemsBox = document.getElementById("cart-items");
    const totalBox = document.getElementById("cart-total");
    if (!itemsBox || !totalBox) return;

    try {
        const customer = await resolveCurrentCustomer();
        if (!customer) {
            itemsBox.innerHTML = "<p class='muted'>Login required to view cart.</p>";
            totalBox.textContent = "INR 0";
            return;
        }

        const cartRes = await fetch(`${getApiBaseUrl()}/cart/${customer.customer_id}`);
        const cartItems = await cartRes.json();
        if (!cartRes.ok) throw new Error(cartItems.detail || "Failed to load cart");

        if (!Array.isArray(cartItems) || !cartItems.length) {
            itemsBox.innerHTML = "<p class='muted'>Cart is empty.</p>";
            totalBox.textContent = "INR 0";
            cartCount = 0;
            updateCartBadge();
            return;
        }

        const productMap = new Map(allProducts.map((p) => [p.product_id, p]));
        itemsBox.innerHTML = "";
        let total = 0;
        let qtySum = 0;

        cartItems.forEach((item) => {
            const product = productMap.get(item.product_id);
            const price = Number(product?.price || 0);
            const subTotal = price * Number(item.quantity || 0);
            total += subTotal;
            qtySum += Number(item.quantity || 0);

            const row = document.createElement("article");
            row.className = "cart-item";
            row.innerHTML = `
                <h4>${product?.product_name || `Product #${item.product_id}`}</h4>
                <p class="muted">${product?.product_type || "Unknown type"} • ${formatPrice(price)}</p>
                <div class="cart-row">
                    <input class="qty-input" type="number" min="1" value="${item.quantity}">
                    <div class="actions">
                        <button type="button" class="update-btn">Update</button>
                        <button type="button" class="remove-btn">Remove</button>
                    </div>
                </div>
                <p><strong>Subtotal:</strong> ${formatPrice(subTotal)}</p>
            `;

            const qtyInput = row.querySelector(".qty-input");
            row.querySelector(".update-btn")?.addEventListener("click", async () => {
                const quantity = Number(qtyInput.value);
                if (!Number.isInteger(quantity) || quantity < 1) {
                    setCartMessage("Quantity must be at least 1.", true);
                    return;
                }
                const res = await fetch(`${getApiBaseUrl()}/cart/item/${item.cart_item_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ quantity }),
                });
                if (!res.ok) {
                    const body = await res.json();
                    setCartMessage(`Update failed: ${body.detail || res.status}`, true);
                    return;
                }
                setCartMessage("Cart updated.");
                await loadCustomerCartCount();
                await renderCartItems();
            });

            row.querySelector(".remove-btn")?.addEventListener("click", async () => {
                const res = await fetch(`${getApiBaseUrl()}/cart/item/${item.cart_item_id}`, {
                    method: "DELETE",
                });
                if (!res.ok) {
                    const body = await res.json();
                    setCartMessage(`Remove failed: ${body.detail || res.status}`, true);
                    return;
                }
                setCartMessage("Item removed.");
                await loadCustomerCartCount();
                await renderCartItems();
            });

            itemsBox.appendChild(row);
        });

        totalBox.textContent = formatPrice(total);
        cartCount = qtySum;
        updateCartBadge();
    } catch (error) {
        itemsBox.innerHTML = `<p class='muted'>Cart error: ${error.message}</p>`;
        totalBox.textContent = "INR 0";
    }
}

function applyProductFilters(products) {
    let filtered = [...products];

    if (currentCategory !== "all") {
        filtered = filtered.filter((p) => normalizeCategory(p.product_type).includes(currentCategory));
    }

    if (currentQuery) {
        const q = currentQuery.toLowerCase();
        filtered = filtered.filter(
            (p) =>
                p.product_name.toLowerCase().includes(q) ||
                normalizeCategory(p.product_type).includes(q)
        );
    }

    if (currentSort === "price_asc") filtered.sort((a, b) => a.price - b.price);
    if (currentSort === "price_desc") filtered.sort((a, b) => b.price - a.price);
    if (currentSort === "rating_desc") filtered.sort((a, b) => b.rating - a.rating);

    return filtered;
}

function renderProducts() {
    const grid = document.getElementById("products-grid");
    const template = document.getElementById("product-card-template");
    if (!grid || !template) return;
    grid.innerHTML = "";

    const products = applyProductFilters(allProducts);
    if (!products.length) {
        grid.innerHTML = "<p class='muted'>No products found for this filter.</p>";
        return;
    }

    products.forEach((product) => {
        const node = template.content.cloneNode(true);
        node.querySelector(".product-type").textContent = product.product_type;
        node.querySelector(".product-name").textContent = product.product_name;
        node.querySelector(".product-meta").textContent = `Rating ${Number(product.rating).toFixed(1)} • Stock ${product.stock_quantity}`;
        node.querySelector(".product-price").textContent = formatPrice(product.price);
        node.querySelector(".add-cart-btn").addEventListener("click", async () => {
            const token = getCustomerToken();
            if (!token) {
                setMessage("auth-msg", "Login first to add products in cart.", true);
                return;
            }

            try {
                const me = await resolveCurrentCustomer();
                if (!me) throw new Error("Unable to validate customer");

                const addRes = await fetch(`${getApiBaseUrl()}/cart/add`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customer_id: me.customer_id,
                        product_id: product.product_id,
                        quantity: 1,
                    }),
                });
                const addData = await addRes.json();
                if (!addRes.ok) throw new Error(addData.detail || "Add to cart failed");

                await loadCustomerCartCount();
                setMessage("auth-msg", `${product.product_name} added to cart.`);
                setCartMessage(`${product.product_name} added to cart.`);
            } catch (error) {
                setMessage("auth-msg", `Cart error: ${error.message}`, true);
            }
        });
        grid.appendChild(node);
    });
}

async function loadProducts() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/products/`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);
        allProducts = data;
        renderProducts();
    } catch (error) {
        const grid = document.getElementById("products-grid");
        if (grid) grid.innerHTML = `<p class="muted">Product load failed: ${error.message}</p>`;
    }
}

function initCatalogControls() {
    const searchInput = document.getElementById("product-search");
    const sortSelect = document.getElementById("sort-products");
    const chips = document.querySelectorAll(".chip");

    searchInput?.addEventListener("input", (e) => {
        currentQuery = e.target.value.trim();
        renderProducts();
    });

    sortSelect?.addEventListener("change", (e) => {
        currentSort = e.target.value;
        renderProducts();
    });

    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            chips.forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            currentCategory = chip.dataset.category || "all";
            renderProducts();
        });
    });
}

function updateAuthStatus(text) {
    const authStatus = document.getElementById("auth-status");
    if (!authStatus) return;
    authStatus.textContent = text;
}

function renderProfile(profile) {
    const box = document.getElementById("profile-box");
    if (!box) return;
    if (!profile) {
        box.textContent = "No profile loaded.";
        return;
    }
    box.textContent = JSON.stringify(profile, null, 2);
}

async function registerCustomer(event) {
    event.preventDefault();
    const payload = {
        name: document.getElementById("reg-name").value.trim(),
        contact_no: document.getElementById("reg-contact").value.trim() || null,
        email: document.getElementById("reg-email").value.trim(),
        pet_type: document.getElementById("reg-pet-type").value.trim() || null,
        password: document.getElementById("reg-password").value,
    };

    try {
        const response = await fetch(`${getApiBaseUrl()}/customers/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);
        setMessage("register-msg", `Registered customer #${data.customer_id}`);
        event.target.reset();
    } catch (error) {
        setMessage("register-msg", `Register failed: ${error.message}`, true);
    }
}

async function loginCustomer(event) {
    event.preventDefault();
    const payload = {
        email: document.getElementById("login-email").value.trim(),
        password: document.getElementById("login-password").value,
    };

    try {
        const response = await fetch(`${getApiBaseUrl()}/customers/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);
        setCustomerToken(data.access_token);
        setMessage("auth-msg", "Login successful.");
        updateAuthStatus(`Logged in as ${data.customer.email}`);
        renderProfile(data.customer);
        setAuthView(true);
        loadCustomerCartCount();
    } catch (error) {
        setMessage("auth-msg", `Login failed: ${error.message}`, true);
        updateAuthStatus("Logged out");
        setAuthView(false);
    }
}

async function loadCustomerProfile() {
    const token = getCustomerToken();
    if (!token) {
        updateAuthStatus("Logged out");
        renderProfile(null);
        setAuthView(false);
        return;
    }
    try {
        const response = await fetch(`${getApiBaseUrl()}/customers/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);
        currentCustomer = data;
        updateAuthStatus(`Logged in as ${data.email}`);
        renderProfile(data);
        setAuthView(true);
        setMessage("auth-msg", "Profile loaded.");
        loadCustomerCartCount();
    } catch (error) {
        clearCustomerToken();
        currentCustomer = null;
        updateAuthStatus("Logged out (token invalid)");
        renderProfile(null);
        setAuthView(false);
        cartCount = 0;
        updateCartBadge();
        setMessage("auth-msg", `Profile load failed: ${error.message}`, true);
    }
}

async function loadCustomerCartCount() {
    const token = getCustomerToken();
    if (!token) return;
    try {
        const me = await resolveCurrentCustomer();
        if (!me) throw new Error();

        const cartRes = await fetch(`${getApiBaseUrl()}/cart/${me.customer_id}`);
        const cartItems = await cartRes.json();
        if (!cartRes.ok || !Array.isArray(cartItems)) throw new Error();

        cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        updateCartBadge();
    } catch {
        cartCount = 0;
        updateCartBadge();
    }
}

function logoutCustomer() {
    clearCustomerToken();
    currentCustomer = null;
    updateAuthStatus("Logged out");
    renderProfile(null);
    setAuthView(false);
    cartCount = 0;
    updateCartBadge();
    setMessage("auth-msg", "Logged out.");
    toggleCartDrawer(false);
}

function initCartUI() {
    const cartChip = document.getElementById("cart-chip");
    const closeCartBtn = document.getElementById("close-cart-btn");
    const overlay = document.getElementById("cart-overlay");
    const clearCartBtn = document.getElementById("clear-cart-btn");

    cartChip?.addEventListener("click", async () => {
        const token = getCustomerToken();
        if (!token) {
            setMessage("auth-msg", "Please login to open your cart.", true);
            setAuthView(false);
            document.getElementById("login-email")?.focus();
            return;
        }
        toggleCartDrawer(true);
        setCartMessage("");
        await renderCartItems();
    });

    closeCartBtn?.addEventListener("click", () => toggleCartDrawer(false));
    overlay?.addEventListener("click", () => toggleCartDrawer(false));

    clearCartBtn?.addEventListener("click", async () => {
        try {
            const customer = await resolveCurrentCustomer();
            if (!customer) throw new Error("Login required");
            const res = await fetch(`${getApiBaseUrl()}/cart/clear/${customer.customer_id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.detail || "Clear cart failed");
            }
            setCartMessage("Cart cleared.");
            await loadCustomerCartCount();
            await renderCartItems();
        } catch (error) {
            setCartMessage(error.message, true);
        }
    });
}

function initAuthUI() {
    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");
    const logoutBtn = document.getElementById("logout-btn");
    const refreshProfileBtn = document.getElementById("refresh-profile-btn");
    const navLoginBtn = document.getElementById("nav-login-btn");
    const navSignupBtn = document.getElementById("nav-signup-btn");
    const heroLoginBtn = document.getElementById("hero-login-btn");
    const heroSignupBtn = document.getElementById("hero-signup-btn");

    registerForm?.addEventListener("submit", registerCustomer);
    loginForm?.addEventListener("submit", loginCustomer);
    logoutBtn?.addEventListener("click", logoutCustomer);
    refreshProfileBtn?.addEventListener("click", loadCustomerProfile);

    const focusLogin = () => document.getElementById("login-email")?.focus();
    const focusSignup = () => document.getElementById("reg-name")?.focus();
    const showLogin = () => {
        setAuthView(false);
        setTimeout(focusLogin, 0);
    };
    const showSignup = () => {
        setAuthView(false);
        setTimeout(focusSignup, 0);
    };
    navLoginBtn?.addEventListener("click", showLogin);
    heroLoginBtn?.addEventListener("click", showLogin);
    navSignupBtn?.addEventListener("click", showSignup);
    heroSignupBtn?.addEventListener("click", showSignup);
}

document.addEventListener("DOMContentLoaded", () => {
    initApiUrlControls();
    initAuthUI();
    initCartUI();
    initCatalogControls();
    setAuthView(false);
    updateCartBadge();
    checkBackendStatus();
    loadProducts();
    loadCustomerProfile();
});
