// Users Page Controller
window.UsersPage = {
    data: {
        users: [],
        loading: false,
        currentUser: null
    },

    // Render users page
    async render() {
        return `
            <div class="page-header">
                <h1>ניהול משתמשים</h1>
                <p>ניהול חשבונות משתמשים והרשאות במערכת</p>
            </div>

            <div class="users-content">
                <div class="users-toolbar">
                    <button class="btn btn-primary" onclick="UsersPage.showCreateUserModal()">
                        <i class="fas fa-plus"></i>
                        הוסף משתמש חדש
                    </button>
                    <div class="search-box">
                        <input type="text" id="users-search" placeholder="חפש משתמש..." 
                               onkeyup="UsersPage.filterUsers(this.value)">
                        <i class="fas fa-search"></i>
                    </div>
                </div>

                <div class="users-table-container">
                    <table class="table" id="users-table">
                        <thead>
                            <tr>
                                <th>שם משתמש</th>
                                <th>אימייל</th>
                                <th>תפקיד</th>
                                <th>סטטוס</th>
                                <th>התחברות אחרונה</th>
                                <th>עובד מקושר</th>
                                <th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody id="users-table-body">
                            <tr>
                                <td colspan="7" class="text-center">
                                    <div class="loading-content">
                                        <div class="loading-spinner"></div>
                                        <span>טוען רשימת משתמשים...</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <style>
                .users-content {
                    max-width: 1400px;
                }

                .users-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .search-box {
                    position: relative;
                    max-width: 300px;
                    flex: 1;
                }

                .search-box input {
                    width: 100%;
                    padding: 0.75rem 2.5rem 0.75rem 1rem;
                    border: 2px solid #e9ecef;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    transition: border-color 0.3s ease;
                }

                .search-box input:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .search-box i {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #6c757d;
                }

                .users-table-container {
                    background: white;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                }

                .table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 0;
                }

                .table th {
                    background: #f8f9fa;
                    padding: 1rem;
                    text-align: right;
                    font-weight: 600;
                    color: #2c3e50;
                    border-bottom: 2px solid #e9ecef;
                    white-space: nowrap;
                }

                .table td {
                    padding: 1rem;
                    border-bottom: 1px solid #e9ecef;
                    vertical-align: middle;
                }

                .table tbody tr:hover {
                    background: #f8f9fa;
                }

                .table tbody tr:last-child td {
                    border-bottom: none;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                }

                .user-name {
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 0.25rem;
                }

                .user-email {
                    font-size: 0.85rem;
                    color: #7f8c8d;
                }

                .user-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .employee-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #667eea;
                    text-decoration: none;
                    font-size: 0.9rem;
                }

                .employee-link:hover {
                    color: #5a67d8;
                }

                .role-admin { color: #dc3545; font-weight: 600; }
                .role-hr_manager { color: #fd7e14; font-weight: 600; }
                .role-employee { color: #28a745; }

                @media (max-width: 768px) {
                    .users-toolbar {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .search-box {
                        max-width: none;
                    }

                    .users-table-container {
                        overflow-x: auto;
                    }

                    .table {
                        min-width: 800px;
                    }
                }
            </style>
        `;
    },

    // Initialize users page
    async init() {
        console.log('👥 Initializing Users page...');
        await this.loadUsers();
    },

    // Load users data
    async loadUsers() {
        try {
            this.data.loading = true;
            
            const response = await API.get('/users-api');
            
            if (response.success) {
                this.data.users = response.users;
                this.renderUsersTable();
            } else {
                throw new Error(response.error || 'Failed to load users');
            }
            
        } catch (error) {
            console.error('Error loading users:', error);
            UI.showToast('שגיאה בטעינת רשימת המשתמשים', 'error');
            this.renderUsersError();
        } finally {
            this.data.loading = false;
        }
    },

    // Render users table
    renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        if (this.data.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center" style="padding: 3rem;">
                        <i class="fas fa-users" style="font-size: 3rem; color: #dee2e6; margin-bottom: 1rem;"></i>
                        <p>אין משתמשים במערכת</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.users.map(user => {
            const lastLogin = user.last_login ? 
                UTILS.formatDate(user.last_login, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 
                'מעולם לא התחבר';

            const employeeLink = user.employee_id ? 
                `<a href="#" class="employee-link" onclick="UI.navigateTo('employees'); event.preventDefault();">
                    <i class="fas fa-user"></i>
                    ${user.first_name} ${user.last_name}
                </a>` : 
                '<span style="color: #6c757d;">לא מקושר</span>';

            return `
                <tr data-user-id="${user.user_id}">
                    <td>
                        <div class="user-info">
                            <div class="user-name">${user.username}</div>
                        </div>
                    </td>
                    <td class="user-email">${user.email}</td>
                    <td>
                        <span class="role-${user.role}">
                            ${UI.formatDisplayValue(user.role, 'role')}
                        </span>
                    </td>
                    <td>
                        <span class="badge badge-${user.is_active ? 'success' : 'danger'}">
                            ${user.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                    </td>
                    <td>${lastLogin}</td>
                    <td>${employeeLink}</td>
                    <td>
                        <div class="user-actions">
                            <button class="btn btn-small btn-secondary" 
                                    onclick="UsersPage.editUser('${user.user_id}')" 
                                    title="עריכה">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${user.user_id !== Auth.getCurrentUser().user_id ? 
                                `<button class="btn btn-small btn-danger" 
                                        onclick="UsersPage.deleteUser('${user.user_id}')" 
                                        title="מחיקה">
                                    <i class="fas fa-trash"></i>
                                </button>` : 
                                '<span style="color: #6c757d; font-size: 0.8rem;">עצמי</span>'
                            }
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // Render error state
    renderUsersError() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding: 3rem; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>שגיאה בטעינת רשימת המשתמשים</p>
                    <button class="btn btn-primary" onclick="UsersPage.loadUsers()">
                        <i class="fas fa-redo"></i>
                        נסה שוב
                    </button>
                </td>
            </tr>
        `;
    },

    // Filter users
    filterUsers(searchTerm) {
        const rows = document.querySelectorAll('#users-table-body tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const isVisible = text.includes(searchTerm.toLowerCase());
            row.style.display = isVisible ? '' : 'none';
        });
    },

    // Show create user modal
    showCreateUserModal() {
        const modal = UI.createModal({
            title: 'הוספת משתמש חדש',
            size: 'large',
            content: `
                <form id="create-user-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="username">שם משתמש *</label>
                            <input type="text" id="username" name="username" required 
                                   class="form-control" data-validate="required">
                        </div>
                        <div class="form-group">
                            <label for="email">אימייל *</label>
                            <input type="email" id="email" name="email" required 
                                   class="form-control" data-validate="email">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="password">סיסמה *</label>
                            <div class="input-group">
                                <input type="password" id="password" name="password" required 
                                       class="form-control" minlength="6">
                                <button type="button" class="btn btn-secondary" onclick="UsersPage.generatePassword()">
                                    <i class="fas fa-key"></i>
                                    יצר סיסמה
                                </button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="role">תפקיד *</label>
                            <select id="role" name="role" required class="form-control">
                                <option value="employee">עובד</option>
                                <option value="hr_manager">מנהל משאבי אנוש</option>
                                <option value="admin">מנהל מערכת</option>
                            </select>
                        </div>
                    </div>
                </form>
            `,
            buttons: [
                {
                    text: 'ביטול',
                    class: 'btn-secondary',
                    onclick: () => UI.hideModal()
                },
                {
                    text: 'צור משתמש',
                    class: 'btn-primary',
                    onclick: () => this.createUser()
                }
            ]
        });

        UI.showModal(modal);
    },

    // Generate random password
    generatePassword() {
        const password = UTILS.generatePassword(12);
        const passwordField = document.getElementById('password');
        if (passwordField) {
            passwordField.value = password;
            
            // Copy to clipboard
            navigator.clipboard.writeText(password).then(() => {
                UI.showToast('הסיסמה הועתקה ללוח', 'success');
            });
        }
    },

    // Create new user
    async createUser() {
        const form = document.getElementById('create-user-form');
        if (!form) return;

        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role')
        };

        // Validate form
        if (!userData.username || !userData.email || !userData.password) {
            UI.showToast('אנא מלא את כל השדות החובה', 'error');
            return;
        }

        try {
            const response = await API.post('/users-api', userData);
            
            if (response.success) {
                UI.hideModal();
                UI.showToast('משתמש נוצר בהצלחה', 'success');
                await this.loadUsers();
            } else {
                UI.showToast(response.error || 'שגיאה ביצירת המשתמש', 'error');
            }
            
        } catch (error) {
            console.error('Error creating user:', error);
            UI.showToast('שגיאה ביצירת המשתמש', 'error');
        }
    },

    // Edit user
    async editUser(userId) {
        const user = this.data.users.find(u => u.user_id === userId);
        if (!user) return;

        const modal = UI.createModal({
            title: 'עריכת משתמש',
            size: 'large',
            content: `
                <form id="edit-user-form">
                    <input type="hidden" name="user_id" value="${user.user_id}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-username">שם משתמש</label>
                            <input type="text" id="edit-username" name="username" 
                                   value="${user.username}" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="edit-email">אימייל</label>
                            <input type="email" id="edit-email" name="email" 
                                   value="${user.email}" class="form-control">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-role">תפקיד</label>
                            <select id="edit-role" name="role" class="form-control">
                                <option value="employee" ${user.role === 'employee' ? 'selected' : ''}>עובד</option>
                                <option value="hr_manager" ${user.role === 'hr_manager' ? 'selected' : ''}>מנהל משאבי אנוש</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>מנהל מערכת</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>סטטוס</label>
                            <div class="form-check">
                                <input type="checkbox" id="edit-active" name="is_active" 
                                       ${user.is_active ? 'checked' : ''} class="form-check-input">
                                <label for="edit-active" class="form-check-label">משתמש פעיל</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="edit-password">סיסמה חדשה (אופציונלי)</label>
                        <input type="password" id="edit-password" name="password" 
                               class="form-control" placeholder="השאר ריק אם לא רוצה לשנות">
                    </div>
                </form>
            `,
            buttons: [
                {
                    text: 'ביטול',
                    class: 'btn-secondary',
                    onclick: () => UI.hideModal()
                },
                {
                    text: 'עדכן',
                    class: 'btn-primary',
                    onclick: () => this.updateUser()
                }
            ]
        });

        UI.showModal(modal);
    },

    // Update user
    async updateUser() {
        const form = document.getElementById('edit-user-form');
        if (!form) return;

        const formData = new FormData(form);
        const userData = {
            user_id: formData.get('user_id'),
            username: formData.get('username'),
            email: formData.get('email'),
            role: formData.get('role'),
            is_active: formData.has('is_active')
        };

        const password = formData.get('password');
        if (password) {
            userData.password = password;
        }

        try {
            const response = await API.put('/users-api', userData);
            
            if (response.success) {
                UI.hideModal();
                UI.showToast('משתמש עודכן בהצלחה', 'success');
                await this.loadUsers();
            } else {
                UI.showToast(response.error || 'שגיאה בעדכון המשתמש', 'error');
            }
            
        } catch (error) {
            console.error('Error updating user:', error);
            UI.showToast('שגיאה בעדכון המשתמש', 'error');
        }
    },

    // Delete user
    async deleteUser(userId) {
        const user = this.data.users.find(u => u.user_id === userId);
        if (!user) return;

        const confirmed = await UI.showConfirm(
            `האם אתה בטוח שברצונך למחוק את המשתמש "${user.username}"?
            פעולה זו תשבית את המשתמש ולא ניתן לבטלה.`,
            'אישור מחיקת משתמש'
        );

        if (!confirmed) return;

        try {
            const response = await API.delete('/users-api', { user_id: userId });
            
            if (response.success) {
                UI.showToast('משתמש נמחק בהצלחה', 'success');
                await this.loadUsers();
            } else {
                UI.showToast(response.error || 'שגיאה במחיקת המשתמש', 'error');
            }
            
        } catch (error) {
            console.error('Error deleting user:', error);
            UI.showToast('שגיאה במחיקת המשתמש', 'error');
        }
    }
};