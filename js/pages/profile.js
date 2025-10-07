// Profile Page Controller - Employee's Personal Profile
window.ProfilePage = {
    data: {
        profile: null,
        loading: false,
        currentUser: null
    },

    // Render profile page
    async render() {
        return `
            <div class="page-header">
                <h1>הפרופיל שלי</h1>
                <p>צפייה ועדכון פרטים אישיים</p>
            </div>

            <div class="profile-content">
                <div id="profile-loading" class="loading-content">
                    <div class="loading-spinner"></div>
                    <span>טוען פרטי פרופיל...</span>
                </div>

                <div id="profile-error" class="error-message" style="display: none;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span id="profile-error-text"></span>
                </div>

                <div id="profile-data" style="display: none;">
                    <div class="profile-grid">
                        <!-- Personal Information Card -->
                        <div class="profile-card">
                            <div class="card-header">
                                <h3><i class="fas fa-user"></i> פרטים אישיים</h3>
                                <button class="btn btn-sm btn-outline" onclick="ProfilePage.editPersonalInfo()">
                                    <i class="fas fa-edit"></i> ערוך
                                </button>
                            </div>
                            <div class="profile-details">
                                <div class="detail-row">
                                    <span class="label">מספר עובד:</span>
                                    <span class="value" id="employee-number">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">תעודת זהות:</span>
                                    <span class="value" id="id-number">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">שם מלא:</span>
                                    <span class="value" id="full-name">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">תאריך לידה:</span>
                                    <span class="value" id="birth-date">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">מספר דרכון:</span>
                                    <span class="value" id="passport-number">-</span>
                                </div>
                            </div>
                        </div>

                        <!-- Contact Information Card -->
                        <div class="profile-card">
                            <div class="card-header">
                                <h3><i class="fas fa-address-book"></i> פרטי קשר</h3>
                                <button class="btn btn-sm btn-outline" onclick="ProfilePage.editContactInfo()">
                                    <i class="fas fa-edit"></i> ערוך
                                </button>
                            </div>
                            <div class="profile-details">
                                <div class="detail-row">
                                    <span class="label">אימייל:</span>
                                    <span class="value" id="email">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">טלפון:</span>
                                    <span class="value" id="phone">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">נייד:</span>
                                    <span class="value" id="mobile-phone">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">כתובת:</span>
                                    <span class="value" id="address">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">עיר:</span>
                                    <span class="value" id="city">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">מיקוד:</span>
                                    <span class="value" id="postal-code">-</span>
                                </div>
                            </div>
                        </div>

                        <!-- Emergency Contact Card -->
                        <div class="profile-card">
                            <div class="card-header">
                                <h3><i class="fas fa-phone-alt"></i> פרטי חירום</h3>
                                <button class="btn btn-sm btn-outline" onclick="ProfilePage.editEmergencyContact()">
                                    <i class="fas fa-edit"></i> ערוך
                                </button>
                            </div>
                            <div class="profile-details">
                                <div class="detail-row">
                                    <span class="label">איש קשר לחירום:</span>
                                    <span class="value" id="emergency-contact-name">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">טלפון חירום:</span>
                                    <span class="value" id="emergency-contact-phone">-</span>
                                </div>
                            </div>
                        </div>

                        <!-- Employment Information Card -->
                        <div class="profile-card">
                            <div class="card-header">
                                <h3><i class="fas fa-briefcase"></i> פרטי תעסוקה</h3>
                            </div>
                            <div class="profile-details">
                                <div class="detail-row">
                                    <span class="label">מחלקה:</span>
                                    <span class="value" id="department">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">תפקיד:</span>
                                    <span class="value" id="position">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">תאריך תחילת עבודה:</span>
                                    <span class="value" id="start-date">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">סוג תעסוקה:</span>
                                    <span class="value" id="employment-type">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">סטטוס:</span>
                                    <span class="value" id="status">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">מנהל ישיר:</span>
                                    <span class="value" id="manager">-</span>
                                </div>
                            </div>
                        </div>

                        <!-- User Account Card -->
                        <div class="profile-card">
                            <div class="card-header">
                                <h3><i class="fas fa-user-cog"></i> חשבון משתמש</h3>
                                <button class="btn btn-sm btn-outline" onclick="ProfilePage.changePassword()">
                                    <i class="fas fa-key"></i> שנה סיסמה
                                </button>
                            </div>
                            <div class="profile-details">
                                <div class="detail-row">
                                    <span class="label">שם משתמש:</span>
                                    <span class="value" id="username">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">תפקיד במערכת:</span>
                                    <span class="value" id="user-role">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">התחברות אחרונה:</span>
                                    <span class="value" id="last-login">-</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">סטטוס חשבון:</span>
                                    <span class="value" id="account-status">-</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Edit Contact Modal -->
            <div id="edit-contact-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>עדכון פרטי קשר</h2>
                        <span class="close" onclick="ProfilePage.hideEditContactModal()">&times;</span>
                    </div>
                    <form id="edit-contact-form">
                        <div class="form-group">
                            <label for="edit-phone">טלפון</label>
                            <input type="tel" id="edit-phone" name="phone" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-mobile-phone">טלפון נייד</label>
                            <input type="tel" id="edit-mobile-phone" name="mobile_phone">
                        </div>
                        <div class="form-group">
                            <label for="edit-address">כתובת</label>
                            <input type="text" id="edit-address" name="address">
                        </div>
                        <div class="form-group">
                            <label for="edit-city">עיר</label>
                            <input type="text" id="edit-city" name="city">
                        </div>
                        <div class="form-group">
                            <label for="edit-postal-code">מיקוד</label>
                            <input type="text" id="edit-postal-code" name="postal_code">
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="ProfilePage.hideEditContactModal()">ביטול</button>
                            <button type="submit" class="btn btn-primary">עדכן</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Edit Emergency Contact Modal -->
            <div id="edit-emergency-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>עדכון פרטי חירום</h2>
                        <span class="close" onclick="ProfilePage.hideEditEmergencyModal()">&times;</span>
                    </div>
                    <form id="edit-emergency-form">
                        <div class="form-group">
                            <label for="edit-emergency-name">איש קשר לחירום</label>
                            <input type="text" id="edit-emergency-name" name="emergency_contact_name">
                        </div>
                        <div class="form-group">
                            <label for="edit-emergency-phone">טלפון איש קשר לחירום</label>
                            <input type="tel" id="edit-emergency-phone" name="emergency_contact_phone">
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="ProfilePage.hideEditEmergencyModal()">ביטול</button>
                            <button type="submit" class="btn btn-primary">עדכן</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Change Password Modal -->
            <div id="change-password-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>שינוי סיסמה</h2>
                        <span class="close" onclick="ProfilePage.hideChangePasswordModal()">&times;</span>
                    </div>
                    <form id="change-password-form">
                        <div class="form-group">
                            <label for="current-password">סיסמה נוכחית</label>
                            <input type="password" id="current-password" name="current_password" required>
                        </div>
                        <div class="form-group">
                            <label for="new-password">סיסמה חדשה</label>
                            <input type="password" id="new-password" name="new_password" required minlength="8">
                        </div>
                        <div class="form-group">
                            <label for="confirm-password">אימות סיסמה</label>
                            <input type="password" id="confirm-password" name="confirm_password" required>
                        </div>
                        <div class="password-requirements">
                            <p>הסיסמה חייבת להכיל לפחות:</p>
                            <ul>
                                <li>8 תווים</li>
                                <li>אות גדולה אחת לפחות</li>
                                <li>אות קטנה אחת לפחות</li>
                                <li>מספר אחד לפחות</li>
                            </ul>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="ProfilePage.hideChangePasswordModal()">ביטול</button>
                            <button type="submit" class="btn btn-primary">שמור</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    // Initialize page
    async init() {
        this.data.currentUser = window.UserManager ? window.UserManager.getCurrentUser() : null;
        
        if (!this.data.currentUser) {
            this.showError('לא ניתן לטעון פרטי פרופיל - נדרש login מחדש');
            return;
        }

        await this.loadProfile();
        this.setupEventListeners();
        
        console.log('Profile page initialized successfully');
    },

    // Set up event listeners
    setupEventListeners() {
        // Contact form submission
        const contactForm = document.getElementById('edit-contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateContactInfo();
            });
        }

        // Emergency contact form submission
        const emergencyForm = document.getElementById('edit-emergency-form');
        if (emergencyForm) {
            emergencyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateEmergencyContact();
            });
        }

        // Password form submission
        const passwordForm = document.getElementById('change-password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePassword();
            });
        }

        // Password validation
        const newPasswordInput = document.getElementById('new-password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        
        if (newPasswordInput && confirmPasswordInput) {
            const validatePasswords = () => {
                const newPassword = newPasswordInput.value;
                const confirmPassword = confirmPasswordInput.value;
                
                if (confirmPassword && newPassword !== confirmPassword) {
                    confirmPasswordInput.setCustomValidity('הסיסמאות אינן תואמות');
                } else {
                    confirmPasswordInput.setCustomValidity('');
                }
            };
            
            newPasswordInput.addEventListener('input', validatePasswords);
            confirmPasswordInput.addEventListener('input', validatePasswords);
        }
    },

    // Load profile data
    async loadProfile() {
        try {
            this.data.loading = true;
            this.showLoading();

            // Get employee data for current user
            const response = await window.API.get('/employees-api');
            
            if (response.success && response.employees) {
                // Find the employee record for current user
                const userEmployee = response.employees.find(emp => emp.user_id === this.data.currentUser.user_id);
                
                if (userEmployee) {
                    this.data.profile = userEmployee;
                    this.renderProfileData();
                } else {
                    throw new Error('לא נמצא עובד מקושר למשתמש זה');
                }
            } else {
                throw new Error(response.error || 'Failed to load profile');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showError(`שגיאה בטעינת פרטי פרופיל: ${error.message}`);
        } finally {
            this.data.loading = false;
        }
    },

    // Show loading state
    showLoading() {
        document.getElementById('profile-loading').style.display = 'block';
        document.getElementById('profile-error').style.display = 'none';
        document.getElementById('profile-data').style.display = 'none';
    },

    // Show error message
    showError(message) {
        document.getElementById('profile-loading').style.display = 'none';
        document.getElementById('profile-error').style.display = 'block';
        document.getElementById('profile-error-text').textContent = message;
        document.getElementById('profile-data').style.display = 'none';
    },

    // Render profile data
    renderProfileData() {
        const profile = this.data.profile;
        
        // Personal Information
        document.getElementById('employee-number').textContent = profile.employee_number || '-';
        document.getElementById('id-number').textContent = profile.id_number || '-';
        document.getElementById('full-name').textContent = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || '-';
        document.getElementById('birth-date').textContent = profile.birth_date ? this.formatDate(profile.birth_date) : '-';
        document.getElementById('passport-number').textContent = profile.passport_number || '-';
        
        // Contact Information
        document.getElementById('email').textContent = profile.email || '-';
        document.getElementById('phone').textContent = profile.phone || '-';
        document.getElementById('mobile-phone').textContent = profile.mobile_phone || '-';
        document.getElementById('address').textContent = profile.address || '-';
        document.getElementById('city').textContent = profile.city || '-';
        document.getElementById('postal-code').textContent = profile.postal_code || '-';
        
        // Emergency Contact
        document.getElementById('emergency-contact-name').textContent = profile.emergency_contact_name || '-';
        document.getElementById('emergency-contact-phone').textContent = profile.emergency_contact_phone || '-';
        
        // Employment Information
        document.getElementById('department').textContent = profile.department || '-';
        document.getElementById('position').textContent = profile.position || '-';
        document.getElementById('start-date').textContent = profile.start_date ? this.formatDate(profile.start_date) : '-';
        document.getElementById('employment-type').textContent = this.getEmploymentTypeLabel(profile.employment_type);
        document.getElementById('status').innerHTML = `<span class="status-badge status-${profile.status}">${this.getStatusLabel(profile.status)}</span>`;
        document.getElementById('manager').textContent = profile.manager_first_name && profile.manager_last_name ? 
            `${profile.manager_first_name} ${profile.manager_last_name}` : '-';
        
        // User Account Information
        document.getElementById('username').textContent = this.data.currentUser.username || '-';
        document.getElementById('user-role').textContent = this.getRoleLabel(this.data.currentUser.role);
        document.getElementById('last-login').textContent = this.data.currentUser.last_login ? 
            this.formatDateTime(this.data.currentUser.last_login) : '-';
        document.getElementById('account-status').innerHTML = this.data.currentUser.is_active ?
            '<span class="status-badge status-active">פעיל</span>' :
            '<span class="status-badge status-terminated">לא פעיל</span>';

        // Show profile data
        document.getElementById('profile-loading').style.display = 'none';
        document.getElementById('profile-error').style.display = 'none';
        document.getElementById('profile-data').style.display = 'block';
    },

    // Get employment type label
    getEmploymentTypeLabel(type) {
        const labels = {
            'full_time': 'משרה מלאה',
            'part_time': 'משרה חלקית',
            'contractor': 'קבלן',
            'intern': 'מתמחה'
        };
        return labels[type] || type || '-';
    },

    // Get status label
    getStatusLabel(status) {
        const labels = {
            'active': 'פעיל',
            'terminated': 'מפוטר',
            'on_leave': 'בחופשה',
            'suspended': 'מושעה'
        };
        return labels[status] || status || '-';
    },

    // Get role label
    getRoleLabel(role) {
        const labels = {
            'admin': 'מנהל מערכת',
            'hr_manager': 'מנהל משאבי אנוש',
            'employee': 'עובד'
        };
        return labels[role] || role || '-';
    },

    // Format date
    formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('he-IL');
        } catch (error) {
            return dateStr;
        }
    },

    // Format date and time
    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('he-IL');
        } catch (error) {
            return dateStr;
        }
    },

    // Edit personal info (not allowed for employees)
    editPersonalInfo() {
        window.showNotification('עדכון פרטים אישיים מתבצע באמצעות מנהל משאבי האנוש', 'info');
    },

    // Edit contact info
    editContactInfo() {
        const profile = this.data.profile;
        
        // Populate form
        document.getElementById('edit-phone').value = profile.phone || '';
        document.getElementById('edit-mobile-phone').value = profile.mobile_phone || '';
        document.getElementById('edit-address').value = profile.address || '';
        document.getElementById('edit-city').value = profile.city || '';
        document.getElementById('edit-postal-code').value = profile.postal_code || '';
        
        // Show modal
        document.getElementById('edit-contact-modal').style.display = 'block';
    },

    // Hide edit contact modal
    hideEditContactModal() {
        document.getElementById('edit-contact-modal').style.display = 'none';
    },

    // Update contact info
    async updateContactInfo() {
        try {
            const form = document.getElementById('edit-contact-form');
            const formData = new FormData(form);
            
            const updateData = {
                employee_id: this.data.profile.employee_id
            };
            
            // Only include fields that have values
            for (let [key, value] of formData.entries()) {
                if (value.trim()) {
                    updateData[key] = value.trim();
                }
            }

            const response = await window.API.put('/employees-api', updateData);

            if (response.success) {
                window.showNotification('פרטי קשר עודכנו בהצלחה', 'success');
                this.hideEditContactModal();
                await this.loadProfile(); // Refresh data
            } else {
                throw new Error(response.error || 'Failed to update contact info');
            }
        } catch (error) {
            console.error('Error updating contact info:', error);
            window.showNotification(`שגיאה בעדכון פרטי קשר: ${error.message}`, 'error');
        }
    },

    // Edit emergency contact
    editEmergencyContact() {
        const profile = this.data.profile;
        
        // Populate form
        document.getElementById('edit-emergency-name').value = profile.emergency_contact_name || '';
        document.getElementById('edit-emergency-phone').value = profile.emergency_contact_phone || '';
        
        // Show modal
        document.getElementById('edit-emergency-modal').style.display = 'block';
    },

    // Hide edit emergency modal
    hideEditEmergencyModal() {
        document.getElementById('edit-emergency-modal').style.display = 'none';
    },

    // Update emergency contact
    async updateEmergencyContact() {
        try {
            const form = document.getElementById('edit-emergency-form');
            const formData = new FormData(form);
            
            const updateData = {
                employee_id: this.data.profile.employee_id,
                emergency_contact_name: formData.get('emergency_contact_name') || '',
                emergency_contact_phone: formData.get('emergency_contact_phone') || ''
            };

            const response = await window.API.put('/employees-api', updateData);

            if (response.success) {
                window.showNotification('פרטי חירום עודכנו בהצלחה', 'success');
                this.hideEditEmergencyModal();
                await this.loadProfile(); // Refresh data
            } else {
                throw new Error(response.error || 'Failed to update emergency contact');
            }
        } catch (error) {
            console.error('Error updating emergency contact:', error);
            window.showNotification(`שגיאה בעדכון פרטי חירום: ${error.message}`, 'error');
        }
    },

    // Change password
    changePassword() {
        // Clear form
        document.getElementById('change-password-form').reset();
        
        // Show modal
        document.getElementById('change-password-modal').style.display = 'block';
    },

    // Hide change password modal
    hideChangePasswordModal() {
        document.getElementById('change-password-modal').style.display = 'none';
    },

    // Update password
    async updatePassword() {
        try {
            const form = document.getElementById('change-password-form');
            const formData = new FormData(form);
            
            const currentPassword = formData.get('current_password');
            const newPassword = formData.get('new_password');
            const confirmPassword = formData.get('confirm_password');

            // Validate passwords match
            if (newPassword !== confirmPassword) {
                window.showNotification('הסיסמאות החדשות אינן תואמות', 'error');
                return;
            }

            // Validate password strength
            if (!this.validatePasswordStrength(newPassword)) {
                window.showNotification('הסיסמה החדשה אינה עומדת בדרישות הביטחון', 'error');
                return;
            }

            // Note: This would typically call a password change API endpoint
            // For now, show a message that it's not implemented
            window.showNotification('שינוי סיסמה יהיה זמין בגרסה הבאה', 'info');
            this.hideChangePasswordModal();

        } catch (error) {
            console.error('Error updating password:', error);
            window.showNotification(`שגיאה בשינוי סיסמה: ${error.message}`, 'error');
        }
    },

    // Validate password strength
    validatePasswordStrength(password) {
        if (password.length < 8) return false;
        if (!/[A-Z]/.test(password)) return false;
        if (!/[a-z]/.test(password)) return false;
        if (!/\d/.test(password)) return false;
        return true;
    }
};