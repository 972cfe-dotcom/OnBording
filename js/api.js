// API Communication Manager
class APIManager {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    // Get authorization headers
    getAuthHeaders() {
        const token = Auth.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // Make HTTP request
    async request(method, endpoint, data = null, options = {}) {
        const url = this.baseURL + endpoint;
        
        const headers = {
            ...this.defaultHeaders,
            ...this.getAuthHeaders(),
            ...options.headers
        };

        const config = {
            method: method.toUpperCase(),
            headers,
            ...options
        };

        // Add body for POST, PUT, PATCH requests
        if (data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
            if (headers['Content-Type'] === 'application/json') {
                config.body = JSON.stringify(data);
            } else {
                config.body = data;
            }
        }

        try {
            const response = await fetch(url, config);
            
            // Handle different response types
            const contentType = response.headers.get('content-type');
            let result;
            
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                result = await response.text();
            }

            // Handle HTTP errors
            if (!response.ok) {
                throw new APIError(
                    result.error || result.message || 'שגיאה בשרת',
                    response.status,
                    result
                );
            }

            return result;

        } catch (error) {
            console.error('API Request failed:', error);
            
            if (error instanceof APIError) {
                throw error;
            }
            
            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new APIError('שגיאת רשת - בדוק את החיבור לאינטרנט', 0);
            }
            
            throw new APIError('שגיאה לא צפויה במערכת', 0, error);
        }
    }

    // GET request
    async get(endpoint, params = null, options = {}) {
        let url = endpoint;
        
        if (params) {
            const searchParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    searchParams.append(key, params[key]);
                }
            });
            url += '?' + searchParams.toString();
        }
        
        return this.request('GET', url, null, options);
    }

    // POST request
    async post(endpoint, data, options = {}) {
        return this.request('POST', endpoint, data, options);
    }

    // PUT request
    async put(endpoint, data, options = {}) {
        return this.request('PUT', endpoint, data, options);
    }

    // DELETE request
    async delete(endpoint, data = null, options = {}) {
        return this.request('DELETE', endpoint, data, options);
    }

    // Upload file
    async upload(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add additional data
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        return this.request('POST', endpoint, formData, {
            headers: {
                // Remove Content-Type header to let browser set it with boundary
                'Content-Type': undefined
            }
        });
    }

    // Health check
    async healthCheck() {
        return this.get(CONFIG.ENDPOINTS.HEALTH);
    }

    // Database setup
    async setupDatabase() {
        return this.post(CONFIG.ENDPOINTS.DB_SETUP);
    }

    // User management
    async getUsers() {
        return this.get(CONFIG.ENDPOINTS.USERS);
    }

    async createUser(userData) {
        return this.post(CONFIG.ENDPOINTS.USERS, userData);
    }

    async updateUser(userData) {
        return this.put(CONFIG.ENDPOINTS.USERS, userData);
    }

    async deleteUser(userId) {
        return this.delete(CONFIG.ENDPOINTS.USERS, { user_id: userId });
    }

    // Employee management
    async getEmployees(employeeId = null) {
        const params = employeeId ? { employee_id: employeeId } : null;
        return this.get(CONFIG.ENDPOINTS.EMPLOYEES, params);
    }

    async createEmployee(employeeData) {
        return this.post(CONFIG.ENDPOINTS.EMPLOYEES, employeeData);
    }

    async updateEmployee(employeeData) {
        return this.put(CONFIG.ENDPOINTS.EMPLOYEES, employeeData);
    }

    async deleteEmployee(employeeId) {
        return this.delete(CONFIG.ENDPOINTS.EMPLOYEES, { employee_id: employeeId });
    }

    // Search and filtering
    async searchEmployees(searchTerm, filters = {}) {
        const params = {
            search: searchTerm,
            ...filters
        };
        return this.get(CONFIG.ENDPOINTS.EMPLOYEES, params);
    }
}

// Custom API Error class
class APIError extends Error {
    constructor(message, status = 0, response = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.response = response;
    }

    isNetworkError() {
        return this.status === 0;
    }

    isAuthenticationError() {
        return this.status === 401;
    }

    isAuthorizationError() {
        return this.status === 403;
    }

    isNotFoundError() {
        return this.status === 404;
    }

    isServerError() {
        return this.status >= 500;
    }

    getUserFriendlyMessage() {
        if (this.isNetworkError()) {
            return 'שגיאת רשת - בדוק את החיבור לאינטרנט';
        }
        
        if (this.isAuthenticationError()) {
            return 'נדרשת התחברות מחדש למערכת';
        }
        
        if (this.isAuthorizationError()) {
            return 'אין הרשאה לבצע פעולה זו';
        }
        
        if (this.isNotFoundError()) {
            return 'הנתון המבוקש לא נמצא';
        }
        
        if (this.isServerError()) {
            return 'שגיאה בשרת - נסה שנית מאוחר יותר';
        }
        
        return this.message || 'שגיאה לא צפויה';
    }
}

// Create global API instance
const API = new APIManager();

// Global error handler for API errors
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof APIError) {
        console.error('Unhandled API Error:', event.reason);
        
        // Handle authentication errors globally
        if (event.reason.isAuthenticationError()) {
            Auth.logout(false);
            UI.showToast('הסשן פג תוקף - נדרשת התחברות מחדש', 'warning');
            event.preventDefault();
            return;
        }
        
        // Show user-friendly error message
        UI.showToast(event.reason.getUserFriendlyMessage(), 'error');
        event.preventDefault();
    }
});

// API request interceptor for loading states
let activeRequests = 0;
let loadingIndicator = null;

// Override fetch to add loading indicators
const originalFetch = window.fetch;
window.fetch = function(...args) {
    activeRequests++;
    showGlobalLoading();
    
    return originalFetch.apply(this, args)
        .finally(() => {
            activeRequests--;
            if (activeRequests === 0) {
                hideGlobalLoading();
            }
        });
};

function showGlobalLoading() {
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'global-loading';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
        `;
        loadingIndicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 50px;
            padding: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        document.body.appendChild(loadingIndicator);
    }
    loadingIndicator.style.display = 'flex';
}

function hideGlobalLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// API response cache for GET requests
class APICache {
    constructor(ttl = 5 * 60 * 1000) { // 5 minutes default TTL
        this.cache = new Map();
        this.ttl = ttl;
    }

    generateKey(method, url, data) {
        return `${method}:${url}:${JSON.stringify(data)}`;
    }

    get(method, url, data) {
        if (method !== 'GET') return null;
        
        const key = this.generateKey(method, url, data);
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return cached.data;
        }
        
        return null;
    }

    set(method, url, data, response) {
        if (method !== 'GET') return;
        
        const key = this.generateKey(method, url, data);
        this.cache.set(key, {
            data: response,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
    }

    delete(pattern) {
        for (const [key] of this.cache) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }
}

// Create global cache instance
const APICache_instance = new APICache();

// Extend API manager to use cache
const originalRequest = API.request;
API.request = async function(method, endpoint, data, options) {
    // Check cache for GET requests
    if (method === 'GET' && !options.skipCache) {
        const cached = APICache_instance.get(method, endpoint, data);
        if (cached) {
            return cached;
        }
    }

    try {
        const response = await originalRequest.call(this, method, endpoint, data, options);
        
        // Cache GET responses
        if (method === 'GET' && !options.skipCache) {
            APICache_instance.set(method, endpoint, data, response);
        }
        
        // Clear related cache entries for non-GET requests
        if (method !== 'GET') {
            APICache_instance.delete(endpoint.split('/')[1]); // Clear by resource type
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};