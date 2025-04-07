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

function isTokenExpired(token) {
  if (!token) return true;

  const [, payload] = token.split('.'); // Get middle part
  if (!payload) return true;

  try {
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp;
    if (!exp) return true;

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    return now >= exp;
  } catch (e) {
    return true; // Malformed token
  }
}

class ApiClient {
  constructor() {
    this.apiUrl = getApiUrl();
  }

  getLoginCount(idToken, onResponse, onTokenExpired) {
    if (isTokenExpired(idToken)) {
      console.error('Token is expired');
      onTokenExpired();
      return;
    }
    const callApi = async () => {
      try {
        const response = await api.get('/login-count', idToken);
        onResponse(response.count);
      } catch (error) {
        console.error('Error fetching login count:', error);
      }
    }
    callApi();
  }

  postLogin(idToken, onResponse, onTokenExpired) {
    if (isTokenExpired(idToken)) {
      console.error('Token is expired');
      onTokenExpired();
      return;
    }
    const callApi = async () => {
      try {
        const response = await this.post('/login', null, idToken);
        onResponse(response);
      } catch (error) {
        console.error('Error fetching login count:', error);
      }
    }
    callApi();
  }

  ping(callback) {
    const fetchTestData = async () => {
      await api.get('/test');
      callback();
    };
    fetchTestData();
  }

  get(endpoint, idToken = null) {
    let options = {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }
    return this.request('GET', endpoint, null, options);
  }

  post(endpoint, data, idToken = null) {
    let options = {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }
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