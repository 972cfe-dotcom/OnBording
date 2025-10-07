// UI Management and Helper Functions
class UIManager {
    constructor() {
        this.toastContainer = null;
        this.modalContainer = null;
        this.currentPage = 'dashboard';
        this.setupEventListeners();
    }

    // Initialize UI components
    init() {
        this.createToastContainer();
        this.createModalContainer();
        this.setupNavigation();
        this.setupUserInteractions();
    }

    // Create toast notification container
    createToastContainer() {
        if (!this.toastContainer) {
            this.toastContainer = document.getElementById('toast-container');
            if (!this.toastContainer) {
                this.toastContainer = document.createElement('div');
                this.toastContainer.id = 'toast-container';
                document.body.appendChild(this.toastContainer);
            }
        }
    }

    // Create modal container
    createModalContainer() {
        if (!this.modalContainer) {
            this.modalContainer = document.getElementById('modal-container');
            if (!this.modalContainer) {
                this.modalContainer = document.createElement('div');
                this.modalContainer.id = 'modal-container';
                document.body.appendChild(this.modalContainer);
            }
        }
    }

    // Show toast notification
    showToast(message, type = 'info', duration = CONFIG.UI.TOAST_DURATION) {
        this.createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast ${type} fade-in`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.toastContainer.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);

        return toast;
    }

    // Get appropriate icon for toast type
    getToastIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            case 'info': return 'info-circle';
            default: return 'info-circle';
        }
    }

    // Show loading state
    showLoading(element, message = 'טוען...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.classList.add('loading');
            const originalContent = element.innerHTML;
            element.setAttribute('data-original-content', originalContent);
            element.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <span>${message}</span>
                </div>
            `;
        }
    }

    // Hide loading state
    hideLoading(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.classList.remove('loading');
            const originalContent = element.getAttribute('data-original-content');
            if (originalContent) {
                element.innerHTML = originalContent;
                element.removeAttribute('data-original-content');
            }
        }
    }

    // Show confirmation dialog
    showConfirm(message, title = 'אישור פעולה') {
        return new Promise((resolve) => {
            const modal = this.createModal({
                title,
                content: `<p>${message}</p>`,
                buttons: [
                    {
                        text: 'ביטול',
                        class: 'btn-secondary',
                        onclick: () => {
                            this.hideModal();
                            resolve(false);
                        }
                    },
                    {
                        text: 'אישור',
                        class: 'btn-danger',
                        onclick: () => {
                            this.hideModal();
                            resolve(true);
                        }
                    }
                ]
            });
            this.showModal(modal);
        });
    }

    // Show input dialog
    showPrompt(message, defaultValue = '', title = 'הזן נתונים') {
        return new Promise((resolve) => {
            const inputId = 'prompt-input-' + Date.now();
            const modal = this.createModal({
                title,
                content: `
                    <p>${message}</p>
                    <input type="text" id="${inputId}" value="${defaultValue}" 
                           class="form-control" style="margin-top: 1rem;">
                `,
                buttons: [
                    {
                        text: 'ביטול',
                        class: 'btn-secondary',
                        onclick: () => {
                            this.hideModal();
                            resolve(null);
                        }
                    },
                    {
                        text: 'אישור',
                        class: 'btn-primary',
                        onclick: () => {
                            const input = document.getElementById(inputId);
                            const value = input ? input.value : '';
                            this.hideModal();
                            resolve(value);
                        }
                    }
                ]
            });
            
            this.showModal(modal);
            
            // Focus on input
            setTimeout(() => {
                const input = document.getElementById(inputId);
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 100);
        });
    }

    // Create modal
    createModal({ title, content, buttons = [], size = 'medium', closable = true }) {
        const modalId = 'modal-' + Date.now();
        
        const buttonsHTML = buttons.map(btn => 
            `<button class="btn ${btn.class}" onclick="${btn.onclick ? 'window.modalCallbacks[\'' + modalId + '\'].button' + buttons.indexOf(btn) + '()' : ''}">${btn.text}</button>`
        ).join('');

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal ${size}">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    ${closable ? '<button class="close-btn" onclick="UI.hideModal()"><i class="fas fa-times"></i></button>' : ''}
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttons.length > 0 ? `
                <div class="modal-footer">
                    ${buttonsHTML}
                </div>` : ''}
            </div>
        `;

        // Store button callbacks
        if (!window.modalCallbacks) {
            window.modalCallbacks = {};
        }
        
        window.modalCallbacks[modalId] = {};
        buttons.forEach((btn, index) => {
            if (btn.onclick) {
                window.modalCallbacks[modalId]['button' + index] = btn.onclick;
            }
        });

        return modal;
    }

    // Show modal
    showModal(modal) {
        this.createModalContainer();
        this.modalContainer.appendChild(modal);
        
        // Add backdrop click handler
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        // Add escape key handler
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    // Hide modal
    hideModal() {
        const modals = this.modalContainer.querySelectorAll('.modal-backdrop');
        modals.forEach(modal => modal.remove());
        
        // Clean up callbacks
        window.modalCallbacks = {};
    }

    // Setup navigation
    setupNavigation() {
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink && navLink.hasAttribute('data-page')) {
                e.preventDefault();
                const page = navLink.getAttribute('data-page');
                this.navigateTo(page);
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || 'dashboard';
            this.navigateTo(page, false);
        });
    }

    // Navigate to page
    navigateTo(page, updateHistory = true) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Update page content
        this.loadPage(page);

        // Update URL and history
        if (updateHistory) {
            const url = page === 'dashboard' ? '#' : `#${page}`;
            window.history.pushState({ page }, '', url);
        }

        this.currentPage = page;
    }

    // Load page content
    async loadPage(page) {
        const pageContent = document.getElementById('page-content');
        if (!pageContent) return;

        // Show loading
        this.showLoading(pageContent, 'טוען דף...');

        try {
            let content = '';

            switch (page) {
                case 'dashboard':
                    content = await this.loadDashboardPage();
                    break;
                case 'users':
                    content = await this.loadUsersPage();
                    break;
                case 'employees':
                    content = await this.loadEmployeesPage();
                    break;
                case 'my-profile':
                    content = await this.loadProfilePage();
                    break;
                case 'documents':
                    content = await this.loadDocumentsPage();
                    break;
                case 'all-documents':
                    content = await this.loadAllDocumentsPage();
                    break;
                case 'reports':
                    content = await this.loadReportsPage();
                    break;
                case 'audit':
                    content = await this.loadAuditPage();
                    break;
                default:
                    content = '<div class="page-header"><h1>דף לא נמצא</h1><p>הדף המבוקש אינו קיים</p></div>';
            }

            pageContent.innerHTML = content;
            
            // Initialize page-specific functionality
            this.initializePage(page);

        } catch (error) {
            console.error('Error loading page:', error);
            pageContent.innerHTML = `
                <div class="page-header">
                    <h1>שגיאה בטעינת הדף</h1>
                    <p>אירעה שגיאה בטעינת הדף. נסה שוב מאוחר יותר.</p>
                </div>
            `;
        }
    }

    // Load dashboard page
    async loadDashboardPage() {
        return window.DashboardPage ? await window.DashboardPage.render() : 
               '<div class="page-header"><h1>לוח בקרה</h1><p>טוען נתונים...</p></div>';
    }

    // Load users page
    async loadUsersPage() {
        return window.UsersPage ? await window.UsersPage.render() : 
               '<div class="page-header"><h1>ניהול משתמשים</h1><p>טוען נתונים...</p></div>';
    }

    // Load employees page
    async loadEmployeesPage() {
        return window.EmployeesPage ? await window.EmployeesPage.render() : 
               '<div class="page-header"><h1>ניהול עובדים</h1><p>טוען נתונים...</p></div>';
    }

    // Load profile page
    async loadProfilePage() {
        return window.ProfilePage ? await window.ProfilePage.render() : 
               '<div class="page-header"><h1>הפרופיל שלי</h1><p>טוען נתונים...</p></div>';
    }

    // Load documents page
    async loadDocumentsPage() {
        return '<div class="page-header"><h1>המסמכים שלי</h1><p>בפיתוח...</p></div>';
    }

    // Load all documents page
    async loadAllDocumentsPage() {
        return '<div class="page-header"><h1>כל המסמכים</h1><p>בפיתוח...</p></div>';
    }

    // Load reports page
    async loadReportsPage() {
        return '<div class="page-header"><h1>דוחות ואנליטיקה</h1><p>בפיתוח...</p></div>';
    }

    // Load audit page
    async loadAuditPage() {
        return '<div class="page-header"><h1>לוג פעילות</h1><p>בפיתוח...</p></div>';
    }

    // Initialize page-specific functionality
    initializePage(page) {
        switch (page) {
            case 'dashboard':
                if (window.DashboardPage) window.DashboardPage.init();
                break;
            case 'users':
                if (window.UsersPage) window.UsersPage.init();
                break;
            case 'employees':
                if (window.EmployeesPage) window.EmployeesPage.init();
                break;
            case 'my-profile':
                if (window.ProfilePage) window.ProfilePage.init();
                break;
        }
    }

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }

    // Setup user interactions
    setupUserInteractions() {
        // Form validation helpers
        document.addEventListener('input', (e) => {
            if (e.target.hasAttribute('data-validate')) {
                this.validateField(e.target);
            }
        });

        // Auto-format fields
        document.addEventListener('input', (e) => {
            if (e.target.hasAttribute('data-format')) {
                this.formatField(e.target);
            }
        });
    }

    // Validate form field
    validateField(field) {
        const validateType = field.getAttribute('data-validate');
        const value = field.value;
        let isValid = true;
        let errorMessage = '';

        switch (validateType) {
            case 'id-number':
                isValid = UTILS.validateIdNumber(value);
                errorMessage = 'מספר תעודת זהות לא תקין';
                break;
            case 'email':
                isValid = CONFIG.VALIDATION.EMAIL_PATTERN.test(value);
                errorMessage = 'כתובת אימייל לא תקינה';
                break;
            case 'phone':
                isValid = CONFIG.VALIDATION.PHONE_PATTERN.test(value);
                errorMessage = 'מספר טלפון לא תקין';
                break;
            case 'required':
                isValid = value.trim().length > 0;
                errorMessage = 'שדה זה הוא חובה';
                break;
        }

        // Update field styling
        field.classList.toggle('invalid', !isValid);
        field.classList.toggle('valid', isValid && value.length > 0);

        // Show/hide error message
        let errorDiv = field.parentNode.querySelector('.field-error');
        if (!isValid && errorMessage) {
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.className = 'field-error';
                field.parentNode.appendChild(errorDiv);
            }
            errorDiv.textContent = errorMessage;
        } else if (errorDiv) {
            errorDiv.remove();
        }

        return isValid;
    }

    // Format form field
    formatField(field) {
        const formatType = field.getAttribute('data-format');
        let value = field.value;

        switch (formatType) {
            case 'id-number':
                value = UTILS.formatIdNumber(value);
                break;
            case 'phone':
                value = UTILS.formatPhone(value);
                break;
        }

        if (value !== field.value) {
            field.value = value;
        }
    }

    // Helper method to format data for display
    formatDisplayValue(value, type) {
        if (!value) return '-';

        switch (type) {
            case 'date':
                return UTILS.formatDate(value);
            case 'currency':
                return UTILS.formatCurrency(value);
            case 'id-number':
                return UTILS.formatIdNumber(value);
            case 'phone':
                return UTILS.formatPhone(value);
            case 'role':
                return CONFIG.TRANSLATIONS.ROLES[value] || value;
            case 'status':
                return CONFIG.TRANSLATIONS.EMPLOYEE_STATUS[value] || value;
            case 'employment-type':
                return CONFIG.TRANSLATIONS.EMPLOYMENT_TYPES[value] || value;
            default:
                return value;
        }
    }

    // Get current page
    getCurrentPage() {
        return this.currentPage;
    }

    // Refresh current page
    async refreshCurrentPage() {
        await this.loadPage(this.currentPage);
    }
}

// Create global UI instance
const UI = new UIManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}