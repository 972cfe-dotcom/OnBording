// HR Management System - Main Application Controller
class HRApp {
    constructor() {
        this.isInitialized = false;
        this.systemStatus = {
            database: 'pending',
            server: 'pending',
            authentication: 'pending'
        };
    }

    // Initialize the application
    async init() {
        console.log('🚀 Starting HR Management System...');
        
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Check system health
            await this.checkSystemHealth();
            
            // Initialize authentication check
            await this.initializeAuth();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            console.log('✅ HR Management System initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize HR system:', error);
            this.handleInitializationError(error);
        }
    }

    // Show loading screen
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
        document.body.classList.add('loading');
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        document.body.classList.remove('loading');
    }

    // Check system health
    async checkSystemHealth() {
        console.log('🔍 Checking system health...');
        
        try {
            // Update server status
            this.updateStatus('server', 'checking');
            
            // Check API health
            const healthResponse = await API.healthCheck();
            
            if (healthResponse.success) {
                this.updateStatus('server', 'connected');
                
                // Check database status
                this.updateStatus('database', healthResponse.database?.status || 'unknown');
                
                console.log('✅ System health check passed');
            } else {
                throw new Error('Health check failed');
            }
            
        } catch (error) {
            console.warn('⚠️ System health check failed:', error);
            this.updateStatus('server', 'error');
            this.updateStatus('database', 'error');
            
            // Try to set up database if it's not configured
            await this.tryDatabaseSetup();
        }
    }

    // Try to set up database
    async tryDatabaseSetup() {
        console.log('🔧 Attempting database setup...');
        
        try {
            this.updateStatus('database', 'setting_up');
            
            const setupResponse = await API.setupDatabase();
            
            if (setupResponse.success) {
                console.log('✅ Database setup completed');
                this.updateStatus('database', 'connected');
                
                // Show setup success message
                setTimeout(() => {
                    UI.showToast('בסיס הנתונים הוגדר בהצלחה!', 'success');
                }, 1000);
                
            } else {
                throw new Error(setupResponse.error || 'Database setup failed');
            }
            
        } catch (error) {
            console.error('❌ Database setup failed:', error);
            this.updateStatus('database', 'error');
            
            // Show error but don't block the app
            setTimeout(() => {
                UI.showToast('שגיאה בהגדרת בסיס הנתונים. חלק מהתכונות עלולות שלא לעבוד.', 'warning');
            }, 1000);
        }
    }

    // Update system status display
    updateStatus(component, status) {
        this.systemStatus[component] = status;
        
        const statusElement = document.getElementById(`${component}-status`);
        if (statusElement) {
            // Remove existing status classes
            statusElement.className = statusElement.className.replace(/status-\w+/g, '');
            
            let statusText = '';
            let statusClass = '';
            
            switch (status) {
                case 'checking':
                case 'setting_up':
                    statusText = 'בודק...';
                    statusClass = 'status-pending';
                    break;
                case 'connected':
                    statusText = 'מחובר';
                    statusClass = 'status-connected';
                    break;
                case 'error':
                    statusText = 'שגיאה';
                    statusClass = 'status-error';
                    break;
                default:
                    statusText = 'לא ידוע';
                    statusClass = 'status-pending';
            }
            
            statusElement.textContent = statusText;
            statusElement.classList.add(statusClass);
        }
    }

    // Initialize authentication
    async initializeAuth() {
        console.log('🔐 Initializing authentication...');
        
        this.updateStatus('authentication', 'checking');
        
        // Check if user is already logged in
        if (Auth.isAuthenticated()) {
            console.log('👤 User already authenticated, verifying token...');
            
            const verification = await Auth.verifyToken();
            
            if (verification.success) {
                console.log('✅ Token verified successfully');
                this.updateStatus('authentication', 'connected');
                this.showMainApp();
            } else {
                console.log('❌ Token verification failed');
                this.updateStatus('authentication', 'error');
                this.showLoginScreen();
            }
        } else {
            console.log('👤 No user authenticated');
            this.updateStatus('authentication', 'error');
            this.showLoginScreen();
        }
    }

    // Show login screen
    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-screen').style.display = 'none';
        
        // Set up authentication forms
        this.setupAuthForms();
        
        // Check if system needs initial setup
        this.checkSystemSetup();
        
        // Set up login success handler
        Auth.onLogin(() => {
            this.showMainApp();
        });
    }

    // Setup authentication forms (login and registration)
    setupAuthForms() {
        // Clear any existing listeners
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const showRegisterBtn = document.getElementById('show-register-btn');
        const showLoginBtn = document.getElementById('show-login-btn');
        
        // Clone forms to remove old event listeners
        if (loginForm) {
            const newLoginForm = loginForm.cloneNode(true);
            loginForm.parentNode.replaceChild(newLoginForm, loginForm);
        }
        
        if (registerForm) {
            const newRegisterForm = registerForm.cloneNode(true);
            registerForm.parentNode.replaceChild(newRegisterForm, registerForm);
        }

        // Get the new form references
        const newLoginForm = document.getElementById('login-form');
        const newRegisterForm = document.getElementById('register-form');

        // Login form submission
        if (newLoginForm) {
            newLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e.target);
            });
        }

        // Registration form submission
        if (newRegisterForm) {
            newRegisterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegistration(e.target);
            });
        }

        // Toggle between login and registration
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', () => {
                this.showRegistrationForm();
            });
        }

        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', () => {
                this.showLoginForm();
            });
        }

        // Password confirmation validation for registration
        const regPassword = document.getElementById('reg-password');
        const regConfirmPassword = document.getElementById('reg-confirm-password');
        
        if (regPassword && regConfirmPassword) {
            const validatePasswordMatch = () => {
                if (regConfirmPassword.value && regPassword.value !== regConfirmPassword.value) {
                    regConfirmPassword.setCustomValidity('הסיסמאות אינן תואמות');
                } else {
                    regConfirmPassword.setCustomValidity('');
                }
            };
            
            regPassword.addEventListener('input', validatePasswordMatch);
            regConfirmPassword.addEventListener('input', validatePasswordMatch);
        }

        // ID number validation for registration
        const regIdNumber = document.getElementById('reg-id-number');
        if (regIdNumber) {
            regIdNumber.addEventListener('input', () => {
                const idNumber = regIdNumber.value.replace(/\D/g, ''); // Remove non-digits
                regIdNumber.value = idNumber;
                
                if (idNumber.length !== 9 && idNumber.length > 0) {
                    regIdNumber.setCustomValidity('תעודת זהות חייבת להכיל 9 ספרות בדיוק');
                } else {
                    regIdNumber.setCustomValidity('');
                }
            });
        }

        // Phone number validation for registration
        const regPhone = document.getElementById('reg-phone');
        if (regPhone) {
            regPhone.addEventListener('input', () => {
                const phone = regPhone.value;
                const phonePattern = /^0\d{1,2}-?\d{7}$/;
                
                if (phone && !phonePattern.test(phone.replace(/\s/g, ''))) {
                    regPhone.setCustomValidity('פורמט טלפון לא תקין (לדוגמה: 050-1234567)');
                } else {
                    regPhone.setCustomValidity('');
                }
            });
        }
    }

    // Show registration form
    showRegistrationForm() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('show-register-btn').style.display = 'none';
        document.getElementById('show-login-btn').style.display = 'block';
        document.getElementById('auth-subtitle').textContent = 'הרשמה למערכת';
        
        // Clear messages
        this.clearAuthMessages();
    }

    // Show login form
    showLoginForm() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('show-register-btn').style.display = 'block';
        document.getElementById('show-login-btn').style.display = 'none';
        document.getElementById('auth-subtitle').textContent = 'התחברות למערכת';
        
        // Clear messages
        this.clearAuthMessages();
    }

    // Handle login form submission
    async handleLogin(form) {
        try {
            const formData = new FormData(form);
            const credentials = {
                username: formData.get('username'),
                password: formData.get('password')
            };

            // Show loading state
            const loginBtn = form.querySelector('#login-btn');
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> מתחבר...';
            loginBtn.disabled = true;

            // Clear previous error
            this.clearAuthMessages();

            // Attempt login
            const result = await Auth.login(credentials);

            if (result.success) {
                this.showSuccessMessage('התחברת בהצלחה!');
                // Login handler will automatically call showMainApp()
            } else {
                this.showErrorMessage(result.error || 'שגיאה בהתחברות למערכת');
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showErrorMessage('שגיאה בהתחברות למערכת');
        } finally {
            // Restore button state
            const loginBtn = form.querySelector('#login-btn');
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> התחבר למערכת';
            loginBtn.disabled = false;
        }
    }

    // Handle registration form submission
    async handleRegistration(form) {
        try {
            const formData = new FormData(form);
            const registrationData = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                confirm_password: formData.get('confirm_password'),
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                id_number: formData.get('id_number'),
                phone: formData.get('phone')
            };

            // Show loading state
            const registerBtn = form.querySelector('#register-btn');
            const originalText = registerBtn.innerHTML;
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> יוצר חשבון...';
            registerBtn.disabled = true;

            // Clear previous messages
            this.clearAuthMessages();

            // Attempt registration
            const result = await Auth.register(registrationData);

            if (result.success) {
                this.showSuccessMessage(result.message || 'החשבון נוצר בהצלחה! מעביר לדף הבית...');
                
                // Auto-login happened in Auth.register, so just wait a moment and show main app
                setTimeout(() => {
                    // The onLogin callback will automatically trigger showMainApp()
                }, 2000);
            } else {
                this.showErrorMessage(result.error || 'שגיאה ביצירת החשבון החדש');
            }

        } catch (error) {
            console.error('Registration error:', error);
            this.showErrorMessage('שגיאה ביצירת החשבון החדש');
        } finally {
            // Restore button state
            const registerBtn = form.querySelector('#register-btn');
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> צור חשבון חדש';
            registerBtn.disabled = false;
        }
    }

    // Show error message
    showErrorMessage(message) {
        const errorDiv = document.getElementById('auth-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    // Show success message
    showSuccessMessage(message) {
        const successDiv = document.getElementById('auth-success');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
        }
    }

    // Clear authentication messages
    clearAuthMessages() {
        const errorDiv = document.getElementById('auth-error');
        const successDiv = document.getElementById('auth-success');
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
        
        if (successDiv) {
            successDiv.style.display = 'none';
            successDiv.textContent = '';
        }
    }

    // Check if system needs initial setup
    async checkSystemSetup() {
        try {
            // Try to check if any users exist by attempting a simple API call
            const response = await fetch('/.netlify/functions/users-api');
            
            if (response.status === 401 || response.status === 403) {
                // No authentication = likely no admin users exist
                this.showAdminSetup();
            } else {
                // Hide admin setup if users exist
                document.getElementById('admin-setup').style.display = 'none';
            }
        } catch (error) {
            console.log('Could not check system setup status');
            // Show admin setup as fallback
            this.showAdminSetup();
        }
    }

    // Show admin setup option
    showAdminSetup() {
        const adminSetupDiv = document.getElementById('admin-setup');
        if (adminSetupDiv) {
            adminSetupDiv.style.display = 'block';
            
            // Set up admin creation button
            const createAdminBtn = document.getElementById('create-admin-btn');
            if (createAdminBtn) {
                createAdminBtn.addEventListener('click', () => {
                    this.createInitialAdmin();
                });
            }
        }
    }

    // Create initial admin users
    async createInitialAdmin() {
        try {
            const createAdminBtn = document.getElementById('create-admin-btn');
            const originalText = createAdminBtn.innerHTML;
            
            // Show loading state
            createAdminBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> יוצר משתמשים...';
            createAdminBtn.disabled = true;

            // Clear previous messages
            this.clearAuthMessages();

            // Call admin creation API
            const response = await API.post('/create-admin', {});

            if (response.success) {
                // Show success with login details
                this.showAdminCreatedMessage(response);
                
                // Hide admin setup
                document.getElementById('admin-setup').style.display = 'none';
            } else {
                this.showErrorMessage(response.error || 'שגיאה ביצירת משתמשי מערכת');
            }

        } catch (error) {
            console.error('Admin creation error:', error);
            this.showErrorMessage('שגיאה ביצירת משתמשי מערכת');
        } finally {
            // Restore button state
            const createAdminBtn = document.getElementById('create-admin-btn');
            createAdminBtn.innerHTML = '<i class="fas fa-user-shield"></i> צור משתמשי מערכת ראשוניים';
            createAdminBtn.disabled = false;
        }
    }

    // Show admin created success message
    showAdminCreatedMessage(response) {
        const successMessage = `
            <div style="text-align: right; line-height: 1.6;">
                <h4>🎉 משתמשי המערכת נוצרו בהצלחה!</h4>
                <p>נוצרו המשתמשים הבאים:</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    ${response.users.map(user => `
                        <div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid #3498db; background: white;">
                            <strong>${user.role}</strong><br>
                            שם משתמש: <code>${user.username}</code><br>
                            סיסמה: <code>${user.password}</code><br>
                            <small>${user.description}</small>
                        </div>
                    `).join('')}
                </div>
                <p style="color: #e74c3c; font-weight: bold;">
                    <i class="fas fa-exclamation-triangle"></i>
                    חשוב: שמור פרטים אלה במקום בטוח ושנה את הסיסמאות לאחר ההתחברות הראשונה!
                </p>
                <p>כעת תוכל להתחבר למערכת עם אחד מהמשתמשים שנוצרו.</p>
            </div>
        `;
        
        this.showSuccessMessage(successMessage);
        
        // Show demo users in help section
        const demoUsersDiv = document.getElementById('demo-users');
        if (demoUsersDiv) {
            demoUsersDiv.style.display = 'block';
        }
    }

    // Show main application
    showMainApp() {
        console.log('🏠 Showing main application');
        
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'grid';
        
        // Initialize UI navigation
        this.initializeNavigation();
        
        // Load initial page
        const hash = window.location.hash.substring(1);
        const initialPage = hash || 'dashboard';
        UI.navigateTo(initialPage);
    }

    // Initialize navigation
    initializeNavigation() {
        // Set up logout handler
        Auth.onLogout(() => {
            this.showLoginScreen();
        });
        
        // Initialize page routing
        this.setupPageRouting();
    }

    // Set up page routing
    setupPageRouting() {
        // Handle initial route from URL hash
        const currentHash = window.location.hash.substring(1);
        if (currentHash && currentHash !== 'login') {
            UI.navigateTo(currentHash);
        } else {
            UI.navigateTo('dashboard');
        }
    }

    // Handle initialization errors
    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Show error message
        const errorContainer = document.createElement('div');
        errorContainer.innerHTML = `
            <div class="error-container">
                <div class="error-card">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>שגיאה בטעינת המערכת</h2>
                    <p>אירעה שגיאה בטעינת מערכת משאבי האנוש.</p>
                    <p class="error-details">${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> נסה שוב
                    </button>
                </div>
            </div>
        `;
        errorContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        
        document.body.appendChild(errorContainer);
    }

    // Get system status
    getSystemStatus() {
        return this.systemStatus;
    }

    // Restart the application
    async restart() {
        console.log('🔄 Restarting HR Management System...');
        
        // Clear any existing state
        this.isInitialized = false;
        
        // Reinitialize
        await this.init();
    }
}

// Application State Manager
class AppState {
    constructor() {
        this.state = {
            currentUser: null,
            currentPage: 'dashboard',
            notifications: [],
            systemSettings: {}
        };
        this.listeners = {};
    }

    // Set state value
    setState(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        // Notify listeners
        if (this.listeners[key]) {
            this.listeners[key].forEach(callback => callback(value, oldValue));
        }
    }

    // Get state value
    getState(key) {
        return this.state[key];
    }

    // Subscribe to state changes
    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.listeners[key].indexOf(callback);
            if (index > -1) {
                this.listeners[key].splice(index, 1);
            }
        };
    }
}

// Global instances
const App = new HRApp();
const AppState_instance = new AppState();

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    
    // Show user-friendly error message
    if (UI && UI.showToast) {
        UI.showToast('אירעה שגיאה במערכת. אנא רענן את הדף.', 'error');
    }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    
    // Don't show toast for API errors (handled elsewhere)
    if (!(e.reason instanceof APIError)) {
        if (UI && UI.showToast) {
            UI.showToast('אירעה שגיאה במערכת. אנא נסה שוב.', 'error');
        }
    }
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing HR system...');
    App.init();
});

// Handle page visibility change (for session management)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Auth.isAuthenticated()) {
        // Page became visible and user is authenticated
        // Verify token is still valid
        Auth.verifyToken().catch(() => {
            // Token verification failed, logout user
            Auth.logout();
        });
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    UI.showToast('החיבור לאינטרנט חזר', 'success');
});

window.addEventListener('offline', () => {
    UI.showToast('אין חיבור לאינטרנט', 'warning');
});

// Export for debugging purposes
window.HRApp = {
    App,
    Auth,
    API,
    UI,
    CONFIG,
    UTILS,
    AppState: AppState_instance
};

console.log('🎯 HR Management System loaded and ready');