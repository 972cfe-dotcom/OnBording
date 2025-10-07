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
        
        // Set up login success handler
        Auth.onLogin(() => {
            this.showMainApp();
        });
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