const BASE_URL = "http://localhost:8000/api"; // Updated to the correct full endpoint path

function getHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
        throw new Error("Missing authorization token. Please sign in again.");
    }
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export const api = {
    async post(endpoint: string, body: unknown) {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.detail || "Server operation failed");
        }
        return res.json();
    },

    async get(endpoint: string) {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: "GET",
            headers: getHeaders(),
        });
        if (!res.ok) throw new Error("Failed to pull workspace metrics");
        return res.json();
    },

    async put(endpoint: string, body: unknown) {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to commit live file changes");
        return res.json();
    }
};
