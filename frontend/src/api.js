let apiUrl = null;
let wsUrl = null;

async function getUrls() {
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
    wsUrl = config.WS_URL;
    if (!wsUrl) {
      throw new Error('WS_URL missing in config.json');
    }
    return [apiUrl, wsUrl];
  } catch (error) {
    console.error("Could not initialize API client:", error);
    throw error;
  }
}

[apiUrl, wsUrl] = await getUrls();

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
    this.apiUrl = apiUrl;
    this.wsUrl = wsUrl;
    this.socket = null;
    this.listeners = {};
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

  pingWs(callback) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      callback(true);
      this.socket.send(JSON.stringify({ event: "ping" }));
    } else {
      callback(false);
    }
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

  connectWebSocket(idToken, setConnectedCallback) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected');
      setConnectedCallback(true);
      return;
    }

    const token = idToken;
    if (!token) {
      console.error('Cannot connect without a valid token');
      setConnectedCallback(false);
      return;
    }

    // WebSocket connection URL
    const wsUrl = `${this.wsUrl}?token=${token}`;

    // Create WebSocket connection
    this.socket = new WebSocket(wsUrl);

    // Event listeners
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      setConnectedCallback(true);

      // Start sending periodic pings
      this.pingInterval = setInterval(() => {
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ event: "ping" }));
          console.log("Ping sent to server");
        }
      }, 5000); // Send a ping every 5 seconds
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected', event);
      setConnectedCallback(false);
      // Clear the ping interval
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
      // Try reconnecting automatically after 3 seconds if connection closes unexpectedly
      setTimeout(() => this.connectWebSocket(idToken, setConnectedCallback), 3000);
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle event listeners for specific events if needed
      const eventName = data.event;
      if (this.listeners[eventName]) {
        this.listeners[eventName].forEach(callback => callback(data.payload));
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  // Send message to the WebSocket server
  sendMessage(eventName, payload) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const message = JSON.stringify({ event: eventName, payload });
    this.socket.send(message);
  }

  // Subscribe to an event
  on(eventName, callback) {
    if (!(eventName in this.listeners)) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  // Unsubscribe from an event
  off(eventName, callback) {
    if (!this.listeners[eventName]) return;

    this.listeners[eventName] = this.listeners[eventName].filter(fn => fn !== callback);
  }

}

export const api = new ApiClient();