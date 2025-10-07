// Application Configuration
const CONFIG = {
    // API Base URL - Auto-detect based on environment
    API_BASE_URL: window.location.origin + '/.netlify/functions',
    
    // API Endpoints
    ENDPOINTS: {
        HEALTH: '/api-health',
        DB_SETUP: '/db-setup',
        LOGIN: '/auth-login',
        REGISTER: '/auth-register',
        VERIFY: '/auth-verify',
        USERS: '/users-api',
        EMPLOYEES: '/employees-api'
    },
    
    // Application Settings
    APP: {
        NAME: 'מערכת משאבי אנוש',
        VERSION: '1.0.0',
        SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
        AUTO_LOGOUT_WARNING: 15 * 60 * 1000, // 15 minutes warning
    },
    
    // User Roles
    ROLES: {
        ADMIN: 'admin',
        HR_MANAGER: 'hr_manager', 
        EMPLOYEE: 'employee'
    },
    
    // Employee Status
    EMPLOYEE_STATUS: {
        ACTIVE: 'active',
        TERMINATED: 'terminated',
        ON_LEAVE: 'on_leave',
        SUSPENDED: 'suspended'
    },
    
    // Employment Types
    EMPLOYMENT_TYPES: {
        FULL_TIME: 'full_time',
        PART_TIME: 'part_time',
        CONTRACTOR: 'contractor',
        INTERN: 'intern'
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        TOKEN: 'hr_auth_token',
        USER: 'hr_user_data',
        PREFERENCES: 'hr_user_preferences'
    },
    
    // UI Settings
    UI: {
        TOAST_DURATION: 5000,
        ANIMATION_DURATION: 300,
        TABLE_PAGE_SIZE: 20
    },
    
    // Validation Rules
    VALIDATION: {
        ID_NUMBER_PATTERN: /^\d{9}$/,
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE_PATTERN: /^[\d\-\+\(\)\s]+$/,
        PASSWORD_MIN_LENGTH: 6
    },
    
    // Hebrew translations
    TRANSLATIONS: {
        ROLES: {
            'admin': 'מנהל מערכת',
            'hr_manager': 'מנהל משאבי אנוש',
            'employee': 'עובד'
        },
        EMPLOYEE_STATUS: {
            'active': 'פעיל',
            'terminated': 'מפוטר',
            'on_leave': 'בחופשה',
            'suspended': 'מושעה'
        },
        EMPLOYMENT_TYPES: {
            'full_time': 'משרה מלאה',
            'part_time': 'משרה חלקית', 
            'contractor': 'קבלן',
            'intern': 'מתמחה'
        }
    }
};

// Utility Functions
const UTILS = {
    // Format Israeli ID number
    formatIdNumber: (id) => {
        if (!id || id.length !== 9) return id;
        return id.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
    },
    
    // Format phone number
    formatPhone: (phone) => {
        if (!phone) return phone;
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        }
        return phone;
    },
    
    // Format currency (NIS)
    formatCurrency: (amount) => {
        if (!amount) return '0 ₪';
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount);
    },
    
    // Format date for Hebrew locale
    formatDate: (date, options = {}) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            ...options
        });
    },
    
    // Format date for inputs
    formatDateForInput: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },
    
    // Validate Israeli ID number using Luhn algorithm
    validateIdNumber: (id) => {
        if (!id || !/^\d{9}$/.test(id)) return false;
        
        const digits = id.split('').map(Number);
        let sum = 0;
        
        for (let i = 0; i < 9; i++) {
            let digit = digits[i];
            if (i % 2 === 1) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }
        
        return sum % 10 === 0;
    },
    
    // Generate random password
    generatePassword: (length = 12) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    },
    
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Deep clone object
    deepClone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // Check if user has permission
    hasPermission: (userRole, requiredRoles) => {
        if (!Array.isArray(requiredRoles)) {
            requiredRoles = [requiredRoles];
        }
        return requiredRoles.includes(userRole);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, UTILS };
}