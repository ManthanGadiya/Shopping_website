function getDefaultApiBaseUrl() {
    if (window.location.protocol === "file:") {
        return "http://127.0.0.1:8000";
    }
    return window.location.origin;
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
    } catch (error) {
        setMessage("auth-msg", `Login failed: ${error.message}`, true);
        updateAuthStatus("Logged out");
    }
}

async function loadCustomerProfile() {
    const token = getCustomerToken();
    if (!token) {
        updateAuthStatus("Logged out");
        renderProfile(null);
        return;
    }
    try {
        const response = await fetch(`${getApiBaseUrl()}/customers/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);
        updateAuthStatus(`Logged in as ${data.email}`);
        renderProfile(data);
        setMessage("auth-msg", "Profile loaded.");
    } catch (error) {
        clearCustomerToken();
        updateAuthStatus("Logged out (token invalid)");
        renderProfile(null);
        setMessage("auth-msg", `Profile load failed: ${error.message}`, true);
    }
}

function logoutCustomer() {
    clearCustomerToken();
    updateAuthStatus("Logged out");
    renderProfile(null);
    setMessage("auth-msg", "Logged out.");
}

function initAuthUI() {
    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");
    const logoutBtn = document.getElementById("logout-btn");
    const refreshProfileBtn = document.getElementById("refresh-profile-btn");

    registerForm?.addEventListener("submit", registerCustomer);
    loginForm?.addEventListener("submit", loginCustomer);
    logoutBtn?.addEventListener("click", logoutCustomer);
    refreshProfileBtn?.addEventListener("click", loadCustomerProfile);
}

document.addEventListener("DOMContentLoaded", () => {
    initApiUrlControls();
    initAuthUI();
    checkBackendStatus();
    loadCustomerProfile();
});
