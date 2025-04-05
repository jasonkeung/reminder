let apiUrl = null;

async function getApiUrl() {
    if (apiUrl) return apiUrl;
    try {
        const res = await fetch('/config.json');
        if (!res.ok) {
            throw new Error('Failed to load config.json');
        }
        const config = await res.json();
        apiUrl = config.API_URL;
        if (!apiUrl) {
            throw new Error('API_URL missing in config.json');
        }
        return apiUrl;
    } catch (error) {
        console.error("Could not initialize API client:", error);
        throw error;
    }
}

class ApiClient {
    constructor() {
        this.apiUrl = getApiUrl();
    }

    get(endpoint, options = {}) {
        return this.request('GET', endpoint, null, options);
    }

    post(endpoint, data, options = {}) {
        return this.request('POST', endpoint, data, options);
    }

    async request(method, endpoint, data = null, options = {}) {
        const url = `${await this.apiUrl}${endpoint}`;
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
            ...options,
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(url, config);
        if (!response.ok) {
            throw new Error(`API ${method} ${endpoint} failed: ${response.statusText}`);
        }
        return response.json();
    }
}

export const api = new ApiClient();