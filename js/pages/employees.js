// Employees Page Controller
window.EmployeesPage = {
    data: {
        employees: [],
        loading: false,
        currentUser: null,
        filterOptions: {
            department: '',
            status: '',
            employment_type: ''
        }
    },

    // Render employees page
    async render() {
        return `
            <div class="page-header">
                <h1>ניהול עובדים</h1>
                <p>ניהול נתוני עובדים, פרטים אישיים ותעסוקתיים</p>
            </div>

            <div class="employees-content">
                <div class="employees-toolbar">
                    <button class="btn btn-primary" onclick="EmployeesPage.showCreateEmployeeModal()">
                        <i class="fas fa-plus"></i>
                        הוסף עובד חדש
                    </button>
                    <div class="search-filters">
                        <input type="text" id="employees-search" placeholder="חפש עובד..." 
                               onkeyup="EmployeesPage.filterEmployees()">
                        <select id="department-filter" onchange="EmployeesPage.filterEmployees()">
                            <option value="">כל המחלקות</option>
                            <option value="הנהלה">הנהלה</option>
                            <option value="משאבי אנוש">משאבי אנוש</option>
                            <option value="IT">IT</option>
                            <option value="שירות לקוחות">שירות לקוחות</option>
                            <option value="מכירות">מכירות</option>
                            <option value="שיווק">שיווק</option>
                            <option value="כספים">כספים</option>
                        </select>
                        <select id="status-filter" onchange="EmployeesPage.filterEmployees()">
                            <option value="">כל הסטטוסים</option>
                            <option value="active">פעיל</option>
                            <option value="on_leave">בחופשה</option>
                            <option value="terminated">מפוטר</option>
                            <option value="suspended">מושעה</option>
                        </select>
                        <select id="employment-type-filter" onchange="EmployeesPage.filterEmployees()">
                            <option value="">כל סוגי התעסוקה</option>
                            <option value="full_time">משרה מלאה</option>
                            <option value="part_time">משרה חלקית</option>
                            <option value="contractor">קבלן</option>
                            <option value="intern">מתמחה</option>
                        </select>
                    </div>
                </div>

                <div class="employees-stats">
                    <div class="stat-card">
                        <i class="fas fa-users"></i>
                        <div class="stat-info">
                            <span class="stat-number" id="total-employees">0</span>
                            <span class="stat-label">סך הכל עובדים</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-user-check"></i>
                        <div class="stat-info">
                            <span class="stat-number" id="active-employees">0</span>
                            <span class="stat-label">עובדים פעילים</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-building"></i>
                        <div class="stat-info">
                            <span class="stat-number" id="departments-count">0</span>
                            <span class="stat-label">מחלקות</span>
                        </div>
                    </div>
                </div>

                <div class="employees-table-container">
                    <table class="table" id="employees-table">
                        <thead>
                            <tr>
                                <th>מספר עובד</th>
                                <th>שם מלא</th>
                                <th>אימייל</th>
                                <th>טלפון</th>
                                <th>מחלקה</th>
                                <th>תפקיד</th>
                                <th>תאריך תחילת עבודה</th>
                                <th>סוג תעסוקה</th>
                                <th>סטטוס</th>
                                <th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody id="employees-table-body">
                            <tr>
                                <td colspan="10" class="text-center">
                                    <div class="loading-content">
                                        <div class="loading-spinner"></div>
                                        <span>טוען רשימת עובדים...</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Create Employee Modal -->
            <div id="create-employee-modal" class="modal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h2>הוסף עובד חדש</h2>
                        <span class="close" onclick="EmployeesPage.hideCreateEmployeeModal()">&times;</span>
                    </div>
                    <form id="create-employee-form">
                        <div class="form-grid">
                            <div class="form-section">
                                <h3>פרטים אישיים</h3>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="employee-number">מספר עובד *</label>
                                        <input type="text" id="employee-number" name="employee_number" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="id-number">תעודת זהות *</label>
                                        <input type="text" id="id-number" name="id_number" required pattern="\\d{9}" maxlength="9">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="first-name">שם פרטי *</label>
                                        <input type="text" id="first-name" name="first_name" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="last-name">שם משפחה *</label>
                                        <input type="text" id="last-name" name="last_name" required>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="birth-date">תאריך לידה</label>
                                        <input type="date" id="birth-date" name="birth_date">
                                    </div>
                                    <div class="form-group">
                                        <label for="passport-number">מספר דרכון</label>
                                        <input type="text" id="passport-number" name="passport_number">
                                    </div>
                                </div>
                            </div>

                            <div class="form-section">
                                <h3>פרטי קשר</h3>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="email">אימייל *</label>
                                        <input type="email" id="email" name="email" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="phone">טלפון *</label>
                                        <input type="tel" id="phone" name="phone" required>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="mobile-phone">טלפון נייד</label>
                                        <input type="tel" id="mobile-phone" name="mobile_phone">
                                    </div>
                                    <div class="form-group">
                                        <label for="address">כתובת</label>
                                        <input type="text" id="address" name="address">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="city">עיר</label>
                                        <input type="text" id="city" name="city">
                                    </div>
                                    <div class="form-group">
                                        <label for="postal-code">מיקוד</label>
                                        <input type="text" id="postal-code" name="postal_code">
                                    </div>
                                </div>
                            </div>

                            <div class="form-section">
                                <h3>פרטי חירום</h3>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="emergency-contact-name">איש קשר לחירום</label>
                                        <input type="text" id="emergency-contact-name" name="emergency_contact_name">
                                    </div>
                                    <div class="form-group">
                                        <label for="emergency-contact-phone">טלפון איש קשר לחירום</label>
                                        <input type="tel" id="emergency-contact-phone" name="emergency_contact_phone">
                                    </div>
                                </div>
                            </div>

                            <div class="form-section">
                                <h3>פרטי תעסוקה</h3>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="department">מחלקה</label>
                                        <select id="department" name="department">
                                            <option value="">בחר מחלקה</option>
                                            <option value="הנהלה">הנהלה</option>
                                            <option value="משאבי אנוש">משאבי אנוש</option>
                                            <option value="IT">IT</option>
                                            <option value="שירות לקוחות">שירות לקוחות</option>
                                            <option value="מכירות">מכירות</option>
                                            <option value="שיווק">שיווק</option>
                                            <option value="כספים">כספים</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="position">תפקיד</label>
                                        <input type="text" id="position" name="position">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="start-date">תאריך תחילת עבודה</label>
                                        <input type="date" id="start-date" name="start_date">
                                    </div>
                                    <div class="form-group">
                                        <label for="employment-type">סוג תעסוקה</label>
                                        <select id="employment-type" name="employment_type">
                                            <option value="full_time">משרה מלאה</option>
                                            <option value="part_time">משרה חלקית</option>
                                            <option value="contractor">קבלן</option>
                                            <option value="intern">מתמחה</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="salary">שכר</label>
                                        <input type="number" id="salary" name="salary" step="0.01" min="0">
                                    </div>
                                    <div class="form-group">
                                        <label for="manager-employee-id">מנהל ישיר</label>
                                        <select id="manager-employee-id" name="manager_employee_id">
                                            <option value="">בחר מנהל</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group full-width">
                                        <label for="notes">הערות</label>
                                        <textarea id="notes" name="notes" rows="3"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="EmployeesPage.hideCreateEmployeeModal()">ביטול</button>
                            <button type="submit" class="btn btn-primary">צור עובד</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Edit Employee Modal -->
            <div id="edit-employee-modal" class="modal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h2>עריכת נתוני עובד</h2>
                        <span class="close" onclick="EmployeesPage.hideEditEmployeeModal()">&times;</span>
                    </div>
                    <form id="edit-employee-form">
                        <input type="hidden" id="edit-employee-id" name="employee_id">
                        <div class="form-grid">
                            <div class="form-section">
                                <h3>פרטים אישיים</h3>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-employee-number">מספר עובד *</label>
                                        <input type="text" id="edit-employee-number" name="employee_number" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-id-number">תעודת זהות *</label>
                                        <input type="text" id="edit-id-number" name="id_number" required pattern="\\d{9}" maxlength="9">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-first-name">שם פרטי *</label>
                                        <input type="text" id="edit-first-name" name="first_name" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-last-name">שם משפחה *</label>
                                        <input type="text" id="edit-last-name" name="last_name" required>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-birth-date">תאריך לידה</label>
                                        <input type="date" id="edit-birth-date" name="birth_date">
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-passport-number">מספר דרכון</label>
                                        <input type="text" id="edit-passport-number" name="passport_number">
                                    </div>
                                </div>
                            </div>

                            <div class="form-section">
                                <h3>פרטי קשר</h3>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-email">אימייל *</label>
                                        <input type="email" id="edit-email" name="email" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-phone">טלפון *</label>
                                        <input type="tel" id="edit-phone" name="phone" required>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-mobile-phone">טלפון נייד</label>
                                        <input type="tel" id="edit-mobile-phone" name="mobile_phone">
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-address">כתובת</label>
                                        <input type="text" id="edit-address" name="address">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-city">עיר</label>
                                        <input type="text" id="edit-city" name="city">
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-postal-code">מיקוד</label>
                                        <input type="text" id="edit-postal-code" name="postal_code">
                                    </div>
                                </div>
                            </div>

                            <div class="form-section">
                                <h3>פרטי חירום</h3>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-emergency-contact-name">איש קשר לחירום</label>
                                        <input type="text" id="edit-emergency-contact-name" name="emergency_contact_name">
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-emergency-contact-phone">טלפון איש קשר לחירום</label>
                                        <input type="tel" id="edit-emergency-contact-phone" name="emergency_contact_phone">
                                    </div>
                                </div>
                            </div>

                            <div class="form-section">
                                <h3>פרטי תעסוקה</h3>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-department">מחלקה</label>
                                        <select id="edit-department" name="department">
                                            <option value="">בחר מחלקה</option>
                                            <option value="הנהלה">הנהלה</option>
                                            <option value="משאבי אנוש">משאבי אנוש</option>
                                            <option value="IT">IT</option>
                                            <option value="שירות לקוחות">שירות לקוחות</option>
                                            <option value="מכירות">מכירות</option>
                                            <option value="שיווק">שיווק</option>
                                            <option value="כספים">כספים</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-position">תפקיד</label>
                                        <input type="text" id="edit-position" name="position">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-start-date">תאריך תחילת עבודה</label>
                                        <input type="date" id="edit-start-date" name="start_date">
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-employment-type">סוג תעסוקה</label>
                                        <select id="edit-employment-type" name="employment_type">
                                            <option value="full_time">משרה מלאה</option>
                                            <option value="part_time">משרה חלקית</option>
                                            <option value="contractor">קבלן</option>
                                            <option value="intern">מתמחה</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-status">סטטוס</label>
                                        <select id="edit-status" name="status">
                                            <option value="active">פעיל</option>
                                            <option value="on_leave">בחופשה</option>
                                            <option value="suspended">מושעה</option>
                                            <option value="terminated">מפוטר</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-salary">שכר</label>
                                        <input type="number" id="edit-salary" name="salary" step="0.01" min="0">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-manager-employee-id">מנהל ישיר</label>
                                        <select id="edit-manager-employee-id" name="manager_employee_id">
                                            <option value="">בחר מנהל</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-end-date">תאריך סיום עבודה</label>
                                        <input type="date" id="edit-end-date" name="end_date">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group full-width">
                                        <label for="edit-notes">הערות</label>
                                        <textarea id="edit-notes" name="notes" rows="3"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="EmployeesPage.hideEditEmployeeModal()">ביטול</button>
                            <button type="submit" class="btn btn-primary">עדכן נתונים</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Employee Details Modal -->
            <div id="employee-details-modal" class="modal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h2>פרטי עובד</h2>
                        <span class="close" onclick="EmployeesPage.hideEmployeeDetailsModal()">&times;</span>
                    </div>
                    <div id="employee-details-content">
                        <div class="loading-content">
                            <div class="loading-spinner"></div>
                            <span>טוען פרטי עובד...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Initialize page after rendering
    async init() {
        this.data.currentUser = window.UserManager ? window.UserManager.getCurrentUser() : null;
        
        // Check permissions
        if (!this.data.currentUser || 
            !['admin', 'hr_manager', 'employee'].includes(this.data.currentUser.role)) {
            window.showNotification('אין הרשאה לגשת לעמוד זה', 'error');
            window.navigate('dashboard');
            return;
        }

        // Load employees data
        await this.loadEmployees();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update statistics
        this.updateStatistics();
        
        console.log('Employees page initialized successfully');
    },

    // Set up event listeners
    setupEventListeners() {
        // Form submissions
        const createForm = document.getElementById('create-employee-form');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createEmployee();
            });
        }

        const editForm = document.getElementById('edit-employee-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateEmployee();
            });
        }

        // ID number validation
        const idInputs = document.querySelectorAll('input[name="id_number"]');
        idInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
            });
        });

        // Employee number generation
        const employeeNumberInput = document.getElementById('employee-number');
        if (employeeNumberInput && employeeNumberInput.value === '') {
            this.generateEmployeeNumber();
        }
    },

    // Load employees data
    async loadEmployees() {
        try {
            this.data.loading = true;
            this.updateLoadingState();

            const response = await window.API.get('/employees-api');
            
            if (response.success) {
                this.data.employees = response.employees || [];
                this.renderEmployeesTable();
                await this.loadManagerOptions();
            } else {
                throw new Error(response.error || 'Failed to load employees');
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            window.showNotification(`שגיאה בטעינת רשימת העובדים: ${error.message}`, 'error');
            this.data.employees = [];
            this.renderEmployeesTable();
        } finally {
            this.data.loading = false;
            this.updateLoadingState();
        }
    },

    // Update loading state
    updateLoadingState() {
        const tableBody = document.getElementById('employees-table-body');
        if (!tableBody) return;

        if (this.data.loading) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <div class="loading-content">
                            <div class="loading-spinner"></div>
                            <span>טוען רשימת עובדים...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
    },

    // Render employees table
    renderEmployeesTable() {
        const tableBody = document.getElementById('employees-table-body');
        if (!tableBody) return;

        if (!this.data.employees || this.data.employees.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-muted">
                        <i class="fas fa-users"></i><br>
                        לא נמצאו עובדים במערכת
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.data.employees.map(employee => `
            <tr data-employee-id="${employee.employee_id}">
                <td>${employee.employee_number || '-'}</td>
                <td>
                    <strong>${employee.first_name} ${employee.last_name}</strong>
                    ${employee.id_number ? `<br><small>ת.ז: ${employee.id_number}</small>` : ''}
                </td>
                <td>${employee.email}</td>
                <td>
                    ${employee.phone}
                    ${employee.mobile_phone ? `<br><small>נייד: ${employee.mobile_phone}</small>` : ''}
                </td>
                <td>${employee.department || '-'}</td>
                <td>${employee.position || '-'}</td>
                <td>${employee.start_date ? this.formatDate(employee.start_date) : '-'}</td>
                <td>${this.getEmploymentTypeLabel(employee.employment_type)}</td>
                <td><span class="status-badge status-${employee.status}">${this.getStatusLabel(employee.status)}</span></td>
                <td class="actions">
                    <button class="btn-icon" onclick="EmployeesPage.viewEmployee('${employee.employee_id}')" 
                            title="צפה בפרטים">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${this.canEditEmployee(employee) ? `
                        <button class="btn-icon" onclick="EmployeesPage.editEmployee('${employee.employee_id}')" 
                                title="ערוך">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                    ${this.canDeleteEmployee(employee) ? `
                        <button class="btn-icon btn-danger" onclick="EmployeesPage.deleteEmployee('${employee.employee_id}')" 
                                title="מחק">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    },

    // Check if current user can edit employee
    canEditEmployee(employee) {
        if (!this.data.currentUser) return false;
        
        // Admins and HR managers can edit all employees
        if (['admin', 'hr_manager'].includes(this.data.currentUser.role)) {
            return true;
        }
        
        // Employees can edit their own data (limited fields)
        if (this.data.currentUser.role === 'employee') {
            return employee.user_id === this.data.currentUser.user_id;
        }
        
        return false;
    },

    // Check if current user can delete employee
    canDeleteEmployee(employee) {
        return this.data.currentUser && 
               ['admin', 'hr_manager'].includes(this.data.currentUser.role) &&
               employee.status !== 'terminated';
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

    // Format date for display
    formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('he-IL');
        } catch (error) {
            return dateStr;
        }
    },

    // Filter employees
    filterEmployees() {
        const searchTerm = document.getElementById('employees-search')?.value.toLowerCase() || '';
        const departmentFilter = document.getElementById('department-filter')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';
        const employmentTypeFilter = document.getElementById('employment-type-filter')?.value || '';

        const filteredEmployees = this.data.employees.filter(employee => {
            const matchesSearch = searchTerm === '' || 
                employee.first_name?.toLowerCase().includes(searchTerm) ||
                employee.last_name?.toLowerCase().includes(searchTerm) ||
                employee.email?.toLowerCase().includes(searchTerm) ||
                employee.employee_number?.toLowerCase().includes(searchTerm) ||
                employee.id_number?.includes(searchTerm);

            const matchesDepartment = departmentFilter === '' || employee.department === departmentFilter;
            const matchesStatus = statusFilter === '' || employee.status === statusFilter;
            const matchesEmploymentType = employmentTypeFilter === '' || employee.employment_type === employmentTypeFilter;

            return matchesSearch && matchesDepartment && matchesStatus && matchesEmploymentType;
        });

        // Temporarily store filtered data
        const originalEmployees = this.data.employees;
        this.data.employees = filteredEmployees;
        this.renderEmployeesTable();
        this.data.employees = originalEmployees;
    },

    // Update statistics
    updateStatistics() {
        const totalEmployees = this.data.employees.length;
        const activeEmployees = this.data.employees.filter(emp => emp.status === 'active').length;
        const departments = [...new Set(this.data.employees.map(emp => emp.department).filter(Boolean))].length;

        document.getElementById('total-employees').textContent = totalEmployees;
        document.getElementById('active-employees').textContent = activeEmployees;
        document.getElementById('departments-count').textContent = departments;
    },

    // Generate employee number
    async generateEmployeeNumber() {
        try {
            const year = new Date().getFullYear();
            const existingNumbers = this.data.employees
                .map(emp => emp.employee_number)
                .filter(num => num && num.startsWith(year.toString()))
                .map(num => parseInt(num.slice(-3)) || 0);
            
            const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
            const employeeNumber = `${year}${nextNumber.toString().padStart(3, '0')}`;
            
            const input = document.getElementById('employee-number');
            if (input) {
                input.value = employeeNumber;
            }
        } catch (error) {
            console.error('Error generating employee number:', error);
        }
    },

    // Load manager options for dropdown
    async loadManagerOptions() {
        const managerSelects = document.querySelectorAll('[name="manager_employee_id"]');
        
        const managers = this.data.employees.filter(emp => 
            emp.status === 'active' && 
            (emp.position?.includes('מנהל') || emp.department === 'הנהלה')
        );

        const options = '<option value="">בחר מנהל</option>' + 
            managers.map(manager => 
                `<option value="${manager.employee_id}">${manager.first_name} ${manager.last_name} - ${manager.position || manager.department}</option>`
            ).join('');

        managerSelects.forEach(select => {
            select.innerHTML = options;
        });
    },

    // Show create employee modal
    showCreateEmployeeModal() {
        if (!['admin', 'hr_manager'].includes(this.data.currentUser?.role)) {
            window.showNotification('אין הרשאה ליצור עובד חדש', 'error');
            return;
        }

        const modal = document.getElementById('create-employee-modal');
        if (modal) {
            modal.style.display = 'block';
            this.generateEmployeeNumber();
        }
    },

    // Hide create employee modal
    hideCreateEmployeeModal() {
        const modal = document.getElementById('create-employee-modal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('create-employee-form').reset();
        }
    },

    // Create new employee
    async createEmployee() {
        try {
            const form = document.getElementById('create-employee-form');
            const formData = new FormData(form);
            
            const employeeData = {};
            for (let [key, value] of formData.entries()) {
                if (value.trim()) {
                    employeeData[key] = value.trim();
                }
            }

            // Validate required fields
            if (!employeeData.employee_number || !employeeData.id_number || 
                !employeeData.first_name || !employeeData.last_name || 
                !employeeData.email || !employeeData.phone) {
                window.showNotification('יש למלא את כל השדות החובה', 'error');
                return;
            }

            // Validate ID number
            if (!/^\d{9}$/.test(employeeData.id_number)) {
                window.showNotification('מספר תעודת זהות חייב להכיל 9 ספרות', 'error');
                return;
            }

            const response = await window.API.post('/employees-api', employeeData);

            if (response.success) {
                window.showNotification('עובד נוצר בהצלחה', 'success');
                this.hideCreateEmployeeModal();
                await this.loadEmployees();
            } else {
                throw new Error(response.error || 'Failed to create employee');
            }
        } catch (error) {
            console.error('Error creating employee:', error);
            window.showNotification(`שגיאה ביצירת עובד: ${error.message}`, 'error');
        }
    },

    // View employee details
    async viewEmployee(employeeId) {
        try {
            const employee = this.data.employees.find(emp => emp.employee_id === employeeId);
            if (!employee) {
                throw new Error('עובד לא נמצא');
            }

            // Load full employee details
            const response = await window.API.get(`/employees-api?employee_id=${employeeId}`);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load employee details');
            }

            const fullEmployee = response.employees;
            this.showEmployeeDetailsModal(fullEmployee);

        } catch (error) {
            console.error('Error viewing employee:', error);
            window.showNotification(`שגיאה בטעינת פרטי עובד: ${error.message}`, 'error');
        }
    },

    // Show employee details modal
    showEmployeeDetailsModal(employee) {
        const modal = document.getElementById('employee-details-modal');
        const content = document.getElementById('employee-details-content');
        
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="employee-details-grid">
                <div class="details-section">
                    <h3>פרטים אישיים</h3>
                    <div class="details-row">
                        <span class="label">מספר עובד:</span>
                        <span class="value">${employee.employee_number || '-'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">תעודת זהות:</span>
                        <span class="value">${employee.id_number || '-'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">שם מלא:</span>
                        <span class="value">${employee.first_name} ${employee.last_name}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">תאריך לידה:</span>
                        <span class="value">${employee.birth_date ? this.formatDate(employee.birth_date) : '-'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">דרכון:</span>
                        <span class="value">${employee.passport_number || '-'}</span>
                    </div>
                </div>

                <div class="details-section">
                    <h3>פרטי קשר</h3>
                    <div class="details-row">
                        <span class="label">אימייל:</span>
                        <span class="value">${employee.email}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">טלפון:</span>
                        <span class="value">${employee.phone}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">נייד:</span>
                        <span class="value">${employee.mobile_phone || '-'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">כתובת:</span>
                        <span class="value">${employee.address || '-'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">עיר:</span>
                        <span class="value">${employee.city || '-'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">מיקוד:</span>
                        <span class="value">${employee.postal_code || '-'}</span>
                    </div>
                </div>

                <div class="details-section">
                    <h3>פרטי חירום</h3>
                    <div class="details-row">
                        <span class="label">איש קשר לחירום:</span>
                        <span class="value">${employee.emergency_contact_name || '-'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">טלפון חירום:</span>
                        <span class="value">${employee.emergency_contact_phone || '-'}</span>
                    </div>
                </div>

                <div class="details-section">
                    <h3>פרטי תעסוקה</h3>
                    <div class="details-row">
                        <span class="label">מחלקה:</span>
                        <span class="value">${employee.department || '-'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">תפקיד:</span>
                        <span class="value">${employee.position || '-'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">תאריך תחילת עבודה:</span>
                        <span class="value">${employee.start_date ? this.formatDate(employee.start_date) : '-'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">תאריך סיום עבודה:</span>
                        <span class="value">${employee.end_date ? this.formatDate(employee.end_date) : '-'}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">סוג תעסוקה:</span>
                        <span class="value">${this.getEmploymentTypeLabel(employee.employment_type)}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">סטטוס:</span>
                        <span class="value"><span class="status-badge status-${employee.status}">${this.getStatusLabel(employee.status)}</span></span>
                    </div>
                    <div class="details-row">
                        <span class="label">מנהל ישיר:</span>
                        <span class="value">${employee.manager_first_name && employee.manager_last_name ? `${employee.manager_first_name} ${employee.manager_last_name}` : '-'}</span>
                    </div>
                    ${['admin', 'hr_manager'].includes(this.data.currentUser?.role) ? `
                        <div class="details-row">
                            <span class="label">שכר:</span>
                            <span class="value">${employee.salary ? `₪${parseFloat(employee.salary).toLocaleString()}` : '-'}</span>
                        </div>
                    ` : ''}
                </div>

                ${employee.notes ? `
                    <div class="details-section full-width">
                        <h3>הערות</h3>
                        <div class="notes-content">
                            ${employee.notes}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        modal.style.display = 'block';
    },

    // Hide employee details modal
    hideEmployeeDetailsModal() {
        const modal = document.getElementById('employee-details-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    // Edit employee
    editEmployee(employeeId) {
        try {
            const employee = this.data.employees.find(emp => emp.employee_id === employeeId);
            if (!employee) {
                window.showNotification('עובד לא נמצא', 'error');
                return;
            }

            // Check permissions
            if (!this.canEditEmployee(employee)) {
                window.showNotification('אין הרשאה לערוך עובד זה', 'error');
                return;
            }

            // Populate form with employee data
            document.getElementById('edit-employee-id').value = employee.employee_id;
            document.getElementById('edit-employee-number').value = employee.employee_number || '';
            document.getElementById('edit-id-number').value = employee.id_number || '';
            document.getElementById('edit-first-name').value = employee.first_name || '';
            document.getElementById('edit-last-name').value = employee.last_name || '';
            document.getElementById('edit-birth-date').value = employee.birth_date || '';
            document.getElementById('edit-passport-number').value = employee.passport_number || '';
            document.getElementById('edit-email').value = employee.email || '';
            document.getElementById('edit-phone').value = employee.phone || '';
            document.getElementById('edit-mobile-phone').value = employee.mobile_phone || '';
            document.getElementById('edit-address').value = employee.address || '';
            document.getElementById('edit-city').value = employee.city || '';
            document.getElementById('edit-postal-code').value = employee.postal_code || '';
            document.getElementById('edit-emergency-contact-name').value = employee.emergency_contact_name || '';
            document.getElementById('edit-emergency-contact-phone').value = employee.emergency_contact_phone || '';
            document.getElementById('edit-department').value = employee.department || '';
            document.getElementById('edit-position').value = employee.position || '';
            document.getElementById('edit-start-date').value = employee.start_date || '';
            document.getElementById('edit-end-date').value = employee.end_date || '';
            document.getElementById('edit-employment-type').value = employee.employment_type || 'full_time';
            document.getElementById('edit-status').value = employee.status || 'active';
            document.getElementById('edit-salary').value = employee.salary || '';
            document.getElementById('edit-manager-employee-id').value = employee.manager_employee_id || '';
            document.getElementById('edit-notes').value = employee.notes || '';

            // Disable fields based on role
            if (this.data.currentUser.role === 'employee') {
                const adminOnlyFields = [
                    'edit-employee-number', 'edit-id-number', 'edit-first-name', 'edit-last-name',
                    'edit-birth-date', 'edit-passport-number', 'edit-start-date', 'edit-end-date',
                    'edit-department', 'edit-position', 'edit-employment-type', 'edit-status',
                    'edit-salary', 'edit-manager-employee-id'
                ];
                
                adminOnlyFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.disabled = true;
                        field.style.backgroundColor = '#f5f5f5';
                    }
                });
            }

            // Show modal
            const modal = document.getElementById('edit-employee-modal');
            if (modal) {
                modal.style.display = 'block';
            }

        } catch (error) {
            console.error('Error editing employee:', error);
            window.showNotification(`שגיאה בטעינת נתוני עובד לעריכה: ${error.message}`, 'error');
        }
    },

    // Hide edit employee modal
    hideEditEmployeeModal() {
        const modal = document.getElementById('edit-employee-modal');
        if (modal) {
            modal.style.display = 'none';
            
            // Re-enable all fields
            const allFields = modal.querySelectorAll('input, select, textarea');
            allFields.forEach(field => {
                field.disabled = false;
                field.style.backgroundColor = '';
            });
        }
    },

    // Update employee
    async updateEmployee() {
        try {
            const form = document.getElementById('edit-employee-form');
            const formData = new FormData(form);
            
            const employeeData = {};
            for (let [key, value] of formData.entries()) {
                if (key === 'employee_id' || value.trim()) {
                    employeeData[key] = value.trim();
                }
            }

            // Validate required fields
            if (!employeeData.first_name || !employeeData.last_name || 
                !employeeData.email || !employeeData.phone) {
                window.showNotification('יש למלא את כל השדות החובה', 'error');
                return;
            }

            // Validate ID number if provided
            if (employeeData.id_number && !/^\d{9}$/.test(employeeData.id_number)) {
                window.showNotification('מספר תעודת זהות חייב להכיל 9 ספרות', 'error');
                return;
            }

            const response = await window.API.put('/employees-api', employeeData);

            if (response.success) {
                window.showNotification('נתוני עובד עודכנו בהצלחה', 'success');
                this.hideEditEmployeeModal();
                await this.loadEmployees();
            } else {
                throw new Error(response.error || 'Failed to update employee');
            }
        } catch (error) {
            console.error('Error updating employee:', error);
            window.showNotification(`שגיאה בעדכון נתוני עובד: ${error.message}`, 'error');
        }
    },

    // Delete employee (soft delete)
    async deleteEmployee(employeeId) {
        try {
            const employee = this.data.employees.find(emp => emp.employee_id === employeeId);
            if (!employee) {
                window.showNotification('עובד לא נמצא', 'error');
                return;
            }

            if (!this.canDeleteEmployee(employee)) {
                window.showNotification('אין הרשאה למחוק עובד זה', 'error');
                return;
            }

            const confirmed = await window.showConfirm(
                `האם אתה בטוח שברצונך למחוק את העובד ${employee.first_name} ${employee.last_name}?`,
                'מחיקת עובד',
                'מחק',
                'ביטול'
            );

            if (!confirmed) return;

            const response = await window.API.delete('/employees-api', { employee_id: employeeId });

            if (response.success) {
                window.showNotification('עובד הועבר לסטטוס מפוטר בהצלחה', 'success');
                await this.loadEmployees();
            } else {
                throw new Error(response.error || 'Failed to delete employee');
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            window.showNotification(`שגיאה במחיקת עובד: ${error.message}`, 'error');
        }
    }
};