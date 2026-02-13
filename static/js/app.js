function getDefaultApiBaseUrl() {
    if (window.location.protocol === "file:") {
        return "http://127.0.0.1:8000";
    }
    return window.location.origin;
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

document.addEventListener("DOMContentLoaded", () => {
    initApiUrlControls();
    checkBackendStatus();
});
