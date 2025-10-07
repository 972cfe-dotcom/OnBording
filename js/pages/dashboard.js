// Dashboard Page Controller
window.DashboardPage = {
    data: {
        stats: null,
        loading: false
    },

    // Render dashboard page
    async render() {
        return `
            <div class="page-header">
                <h1>לוח בקרה</h1>
                <p>סקירה כללית של המערכת</p>
            </div>

            <div class="dashboard-content">
                <div class="stats-grid" id="stats-grid">
                    <div class="stat-card loading">
                        <div class="loading-spinner"></div>
                        <span>טוען נתונים...</span>
                    </div>
                    <div class="stat-card loading">
                        <div class="loading-spinner"></div>
                        <span>טוען נתונים...</span>
                    </div>
                    <div class="stat-card loading">
                        <div class="loading-spinner"></div>
                        <span>טוען נתונים...</span>
                    </div>
                    <div class="stat-card loading">
                        <div class="loading-spinner"></div>
                        <span>טוען נתונים...</span>
                    </div>
                </div>

                <div class="dashboard-sections">
                    <div class="dashboard-section">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">
                                    <i class="fas fa-users"></i>
                                    עובדים פעילים
                                </h3>
                                <button class="btn btn-small btn-primary" onclick="UI.navigateTo('employees')">
                                    <i class="fas fa-arrow-left"></i>
                                    צפה בכולם
                                </button>
                            </div>
                            <div class="card-body" id="recent-employees">
                                <div class="loading-content">
                                    <div class="loading-spinner"></div>
                                    <span>טוען רשימת עובדים...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="dashboard-section">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">
                                    <i class="fas fa-file-alt"></i>
                                    מסמכים אחרונים
                                </h3>
                                <button class="btn btn-small btn-primary" onclick="UI.navigateTo('all-documents')">
                                    <i class="fas fa-arrow-left"></i>
                                    צפה בכולם
                                </button>
                            </div>
                            <div class="card-body" id="recent-documents">
                                <div class="loading-content">
                                    <div class="loading-spinner"></div>
                                    <span>טוען רשימת מסמכים...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="dashboard-section full-width">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">
                                    <i class="fas fa-chart-line"></i>
                                    סטטיסטיקות מהירות
                                </h3>
                            </div>
                            <div class="card-body" id="quick-stats">
                                <div class="loading-content">
                                    <div class="loading-spinner"></div>
                                    <span>טוען סטטיסטיקות...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .dashboard-content {
                    display: grid;
                    gap: 2rem;
                    max-width: 1400px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 2rem;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                    transition: transform 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 140px;
                }

                .stat-card:hover {
                    transform: translateY(-5px);
                }

                .stat-card.loading {
                    background: #f8f9fa;
                    color: #6c757d;
                    gap: 1rem;
                }

                .stat-number {
                    font-size: 2.5rem;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                }

                .stat-label {
                    font-size: 1rem;
                    opacity: 0.9;
                }

                .stat-change {
                    font-size: 0.85rem;
                    margin-top: 0.5rem;
                    opacity: 0.8;
                }

                .stat-change.positive {
                    color: #4ade80;
                }

                .stat-change.negative {
                    color: #f87171;
                }

                .dashboard-sections {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }

                .dashboard-section.full-width {
                    grid-column: 1 / -1;
                }

                .loading-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    padding: 2rem;
                    color: #6c757d;
                }

                .employee-item, .document-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid #e9ecef;
                }

                .employee-item:last-child, .document-item:last-child {
                    border-bottom: none;
                }

                .employee-info, .document-info {
                    display: flex;
                    flex-direction: column;
                }

                .employee-name, .document-name {
                    font-weight: 600;
                    color: #2c3e50;
                }

                .employee-role, .document-type {
                    font-size: 0.85rem;
                    color: #7f8c8d;
                }

                .stat-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }

                .mini-stat {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 10px;
                    text-align: center;
                }

                .mini-stat-number {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #667eea;
                }

                .mini-stat-label {
                    font-size: 0.85rem;
                    color: #6c757d;
                    margin-top: 0.25rem;
                }

                @media (max-width: 768px) {
                    .dashboard-sections {
                        grid-template-columns: 1fr;
                    }

                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 480px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
    },

    // Initialize dashboard
    async init() {
        console.log('📊 Initializing Dashboard...');
        await this.loadDashboardData();
    },

    // Load dashboard data
    async loadDashboardData() {
        try {
            this.data.loading = true;

            // Load dashboard stats
            await Promise.all([
                this.loadMainStats(),
                this.loadRecentEmployees(),
                this.loadRecentDocuments(),
                this.loadQuickStats()
            ]);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            UI.showToast('שגיאה בטעינת נתוני הדשבורד', 'error');
        } finally {
            this.data.loading = false;
        }
    },

    // Load main statistics
    async loadMainStats() {
        try {
            const response = await API.get('/reports-api', { reportType: 'dashboard_stats' });
            
            if (response.success) {
                this.renderMainStats(response.data);
            }
        } catch (error) {
            console.error('Error loading main stats:', error);
            this.renderMainStatsError();
        }
    },

    // Render main statistics cards
    renderMainStats(stats) {
        const statsGrid = document.getElementById('stats-grid');
        if (!statsGrid) return;

        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.employees?.total || 0}</div>
                <div class="stat-label">סך עובדים</div>
                <div class="stat-change positive">
                    <i class="fas fa-arrow-up"></i>
                    ${stats.employees?.new_this_month || 0} חדשים החודש
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-number">${stats.employees?.active || 0}</div>
                <div class="stat-label">עובדים פעילים</div>
                <div class="stat-change">
                    <i class="fas fa-users"></i>
                    ${Math.round(((stats.employees?.active || 0) / (stats.employees?.total || 1)) * 100)}% מכלל העובדים
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-number">${stats.documents?.total || 0}</div>
                <div class="stat-label">מסמכים במערכת</div>
                <div class="stat-change positive">
                    <i class="fas fa-plus"></i>
                    ${stats.documents?.new_this_week || 0} השבוע
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-number">${stats.users?.active_this_week || 0}</div>
                <div class="stat-label">משתמשים פעילים</div>
                <div class="stat-change">
                    <i class="fas fa-clock"></i>
                    השבוע האחרון
                </div>
            </div>
        `;
    },

    // Render error state for main stats
    renderMainStatsError() {
        const statsGrid = document.getElementById('stats-grid');
        if (!statsGrid) return;

        statsGrid.innerHTML = `
            <div class="stat-card">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #f39c12; margin-bottom: 1rem;"></i>
                <div>שגיאה בטעינת הנתונים</div>
            </div>
        `;
    },

    // Load recent employees
    async loadRecentEmployees() {
        try {
            const response = await API.get('/employees-api', { limit: 5 });
            
            if (response.success) {
                this.renderRecentEmployees(response.employees);
            }
        } catch (error) {
            console.error('Error loading recent employees:', error);
            this.renderRecentEmployeesError();
        }
    },

    // Render recent employees
    renderRecentEmployees(employees) {
        const container = document.getElementById('recent-employees');
        if (!container) return;

        if (!employees || employees.length === 0) {
            container.innerHTML = '<p class="text-center">אין עובדים להצגה</p>';
            return;
        }

        container.innerHTML = employees.map(emp => `
            <div class="employee-item">
                <div class="employee-info">
                    <div class="employee-name">${emp.first_name} ${emp.last_name}</div>
                    <div class="employee-role">${emp.department || 'לא צוין'} • ${emp.position || 'לא צוין'}</div>
                </div>
                <div class="badge badge-${emp.status === 'active' ? 'success' : 'warning'}">
                    ${UI.formatDisplayValue(emp.status, 'status')}
                </div>
            </div>
        `).join('');
    },

    // Render error state for recent employees
    renderRecentEmployeesError() {
        const container = document.getElementById('recent-employees');
        if (!container) return;

        container.innerHTML = '<p class="text-center" style="color: #dc3545;">שגיאה בטעינת רשימת עובדים</p>';
    },

    // Load recent documents (placeholder)
    async loadRecentDocuments() {
        const container = document.getElementById('recent-documents');
        if (!container) return;

        // For now, show placeholder since documents system is basic
        container.innerHTML = `
            <div class="text-center" style="padding: 2rem; color: #6c757d;">
                <i class="fas fa-file-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p>מערכת המסמכים בפיתוח</p>
                <p style="font-size: 0.85rem;">בקרוב תוכלו לצפות במסמכים האחרונים כאן</p>
            </div>
        `;
    },

    // Load quick stats
    async loadQuickStats() {
        const container = document.getElementById('quick-stats');
        if (!container) return;

        try {
            const response = await API.get('/reports-api', { reportType: 'employees_summary' });
            
            if (response.success && response.data) {
                this.renderQuickStats(response.data);
            }
        } catch (error) {
            console.error('Error loading quick stats:', error);
            container.innerHTML = '<p class="text-center" style="color: #dc3545;">שגיאה בטעינת סטטיסטיקות</p>';
        }
    },

    // Render quick statistics
    renderQuickStats(data) {
        const container = document.getElementById('quick-stats');
        if (!container) return;

        const summary = data.summary || {};
        const departments = data.departmentBreakdown || [];

        container.innerHTML = `
            <div class="stat-grid">
                <div class="mini-stat">
                    <div class="mini-stat-number">${summary.full_time_employees || 0}</div>
                    <div class="mini-stat-label">משרות מלאות</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-stat-number">${summary.part_time_employees || 0}</div>
                    <div class="mini-stat-label">משרות חלקיות</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-stat-number">${summary.contractor_employees || 0}</div>
                    <div class="mini-stat-label">קבלנים</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-stat-number">${summary.total_departments || 0}</div>
                    <div class="mini-stat-label">מחלקות</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-stat-number">${summary.average_salary ? UTILS.formatCurrency(summary.average_salary) : 'לא זמין'}</div>
                    <div class="mini-stat-label">שכר ממוצע</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-stat-number">${summary.on_leave_employees || 0}</div>
                    <div class="mini-stat-label">בחופשה</div>
                </div>
            </div>
            
            ${departments.length > 0 ? `
                <h4 style="margin: 2rem 0 1rem; color: #2c3e50;">התפלגות לפי מחלקות:</h4>
                <div class="departments-list">
                    ${departments.slice(0, 5).map(dept => `
                        <div class="employee-item">
                            <span>${dept.department}</span>
                            <span class="badge badge-info">${dept.employee_count} עובדים</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    },

    // Refresh dashboard data
    async refresh() {
        console.log('🔄 Refreshing dashboard data...');
        await this.loadDashboardData();
        UI.showToast('נתוני הדשבורד עודכנו', 'success');
    }
};

// Auto-refresh dashboard every 5 minutes when active
let dashboardRefreshInterval;

document.addEventListener('visibilitychange', () => {
    if (UI.getCurrentPage() === 'dashboard') {
        if (document.hidden) {
            if (dashboardRefreshInterval) {
                clearInterval(dashboardRefreshInterval);
            }
        } else {
            dashboardRefreshInterval = setInterval(() => {
                if (UI.getCurrentPage() === 'dashboard') {
                    window.DashboardPage.refresh();
                }
            }, 5 * 60 * 1000); // 5 minutes
        }
    }
});