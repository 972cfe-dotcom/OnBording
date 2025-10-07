// Authentication Management
class AuthManager {
    constructor() {
        this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        this.user = this.getStoredUser();
        this.loginCallbacks = [];
        this.logoutCallbacks = [];
    }

    // Get user from localStorage
    getStoredUser() {
        const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        return userData ? JSON.parse(userData) : null;
    }

    // Store user data
    storeUser(userData) {
        this.user = userData;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(userData));
    }

    // Store authentication token
    storeToken(token) {
        this.token = token;
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    }

    // Clear authentication data
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!(this.token && this.user);
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get authentication token
    getToken() {
        return this.token;
    }

    // Login user
    async login(credentials) {
        try {
            const response = await API.post(CONFIG.ENDPOINTS.LOGIN, credentials);
            
            if (response.success) {
                this.storeToken(response.token);
                this.storeUser(response.user);
                
                // Set up auto-logout
                this.setupAutoLogout();
                
                // Call login callbacks
                this.loginCallbacks.forEach(callback => callback(response.user));
                
                return { success: true, user: response.user };
            } else {
                return { success: false, error: response.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'שגיאה בהתחברות למערכת' };
        }
    }

    // Logout user
    async logout(showMessage = true) {
        try {
            // Call logout callbacks
            this.logoutCallbacks.forEach(callback => callback());
            
            // Clear authentication data
            this.clearAuth();
            
            if (showMessage) {
                UI.showToast('התנתקת מהמערכת בהצלחה', 'info');
            }
            
            // Redirect to login
            this.redirectToLogin();
            
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Verify token validity
    async verifyToken() {
        if (!this.token) {
            return { success: false, error: 'אין טוקן' };
        }

        try {
            const response = await API.post(CONFIG.ENDPOINTS.VERIFY, { token: this.token });
            
            if (response.success && response.valid) {
                // Update user data if needed
                if (response.user) {
                    this.storeUser(response.user);
                }
                return { success: true, user: response.user };
            } else {
                // Token is invalid, logout
                this.logout(false);
                return { success: false, error: 'טוקן לא תקף' };
            }
        } catch (error) {
            console.error('Token verification error:', error);
            this.logout(false);
            return { success: false, error: 'שגיאה באימות טוקן' };
        }
    }

    // Set up automatic logout on token expiration
    setupAutoLogout() {
        // Clear existing timeout
        if (this.logoutTimeout) {
            clearTimeout(this.logoutTimeout);
        }

        // Set logout timeout (token expires in 8 hours)
        this.logoutTimeout = setTimeout(() => {
            this.logout();
            UI.showToast('הסשן פג תוקף - נדרשת התחברות מחדש', 'warning');
        }, CONFIG.APP.SESSION_TIMEOUT);

        // Show warning 15 minutes before expiration
        this.warningTimeout = setTimeout(() => {
            UI.showToast('הסשן יפוג תוקף בעוד 15 דקות', 'warning');
        }, CONFIG.APP.SESSION_TIMEOUT - CONFIG.APP.AUTO_LOGOUT_WARNING);
    }

    // Redirect to login page
    redirectToLogin() {
        // Show login screen and hide app screen
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-screen').style.display = 'none';
        
        // Clear form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
        
        // Clear error message
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // Check user role and permissions
    hasRole(requiredRoles) {
        if (!this.user) return false;
        return UTILS.hasPermission(this.user.role, requiredRoles);
    }

    // Check if user can access admin features
    isAdmin() {
        return this.hasRole([CONFIG.ROLES.ADMIN]);
    }

    // Check if user can access HR features
    isHROrAdmin() {
        return this.hasRole([CONFIG.ROLES.ADMIN, CONFIG.ROLES.HR_MANAGER]);
    }

    // Add login callback
    onLogin(callback) {
        this.loginCallbacks.push(callback);
    }

    // Add logout callback
    onLogout(callback) {
        this.logoutCallbacks.push(callback);
    }

    // Get user display name
    getUserDisplayName() {
        if (!this.user) return 'אורח';
        
        if (this.user.employee && this.user.employee.first_name && this.user.employee.last_name) {
            return `${this.user.employee.first_name} ${this.user.employee.last_name}`;
        }
        
        return this.user.username || this.user.email || 'משתמש';
    }

    // Get user role display name
    getUserRoleDisplayName() {
        if (!this.user) return '';
        return CONFIG.TRANSLATIONS.ROLES[this.user.role] || this.user.role;
    }
}

// Create global auth instance
const Auth = new AuthManager();

// Setup login form handling
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Disable form during login
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> מתחבר...';
            loginBtn.disabled = true;
            loginError.style.display = 'none';

            const formData = new FormData(loginForm);
            const credentials = {
                username: formData.get('username'),
                password: formData.get('password')
            };

            // Check if username is email
            if (CONFIG.VALIDATION.EMAIL_PATTERN.test(credentials.username)) {
                credentials.email = credentials.username;
                delete credentials.username;
            }

            try {
                const result = await Auth.login(credentials);
                
                if (result.success) {
                    // Login successful - the main app will handle the redirect
                    UI.showToast('התחברת בהצלחה!', 'success');
                } else {
                    // Show error
                    loginError.textContent = result.error || 'שגיאה בהתחברות';
                    loginError.style.display = 'block';
                }
            } catch (error) {
                console.error('Login error:', error);
                loginError.textContent = 'שגיאה בהתחברות למערכת';
                loginError.style.display = 'block';
            } finally {
                // Re-enable form
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> התחבר למערכת';
                loginBtn.disabled = false;
            }
        });
    }

    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }

    // Setup user display update callback
    Auth.onLogin((user) => {
        updateUserDisplay(user);
        updateUIForRole(user.role);
    });

    Auth.onLogout(() => {
        // Reset UI to default state
        document.body.className = '';
    });
});

// Update user display in header
function updateUserDisplay(user) {
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');

    if (userNameEl) {
        userNameEl.textContent = Auth.getUserDisplayName();
    }
    
    if (userRoleEl) {
        userRoleEl.textContent = Auth.getUserRoleDisplayName();
    }
}

// Update UI based on user role
function updateUIForRole(role) {
    // Add role class to body for CSS targeting
    document.body.className = `role-${role}`;
    
    // Show/hide navigation items based on role
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    const adminHrElements = document.querySelectorAll('.admin-hr-only');
    
    adminOnlyElements.forEach(el => {
        el.style.display = role === 'admin' ? 'block' : 'none';
    });
    
    adminHrElements.forEach(el => {
        el.style.display = ['admin', 'hr_manager'].includes(role) ? 'block' : 'none';
    });
}