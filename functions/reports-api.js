// Reports and Export API endpoint
const { Pool } = require('pg');
const { verifyToken } = require('./auth-verify');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_lOh28bqVrHYC@ep-curly-heart-aeh5ihpv-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&search_path=hr',
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Verify authentication
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'אין הרשאה - נדרש login' })
      };
    }

    const auth = await verifyToken(token);
    if (!auth.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'טוקן לא תקף' })
      };
    }

    const currentUser = auth.user;

    // Only admin and HR can access reports
    if (!['admin', 'hr_manager'].includes(currentUser.role)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'אין הרשאה לגשת לדוחות' })
      };
    }

    // Handle different HTTP methods and report types
    const { reportType, format = 'json' } = event.queryStringParameters || {};

    switch (event.httpMethod) {
      case 'GET':
        return await handleGetReport(currentUser, reportType, format, event, headers);
      case 'POST':
        return await handleCustomReport(currentUser, event, headers);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

  } catch (error) {
    console.error('Reports API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'שגיאה פנימית בשרת',
        details: error.message
      })
    };
  }
};

// Handle report generation
async function handleGetReport(currentUser, reportType, format, event, headers) {
  let reportData;
  let reportTitle;

  switch (reportType) {
    case 'employees_summary':
      reportData = await getEmployeesSummaryReport();
      reportTitle = 'סיכום עובדים';
      break;
    case 'employees_detailed':
      reportData = await getEmployeesDetailedReport(event.queryStringParameters);
      reportTitle = 'דוח עובדים מפורט';
      break;
    case 'documents_summary':
      reportData = await getDocumentsSummaryReport();
      reportTitle = 'סיכום מסמכים';
      break;
    case 'system_activity':
      reportData = await getSystemActivityReport(event.queryStringParameters);
      reportTitle = 'פעילות במערכת';
      break;
    case 'dashboard_stats':
      reportData = await getDashboardStats();
      reportTitle = 'נתונים לדשבורד';
      break;
    default:
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'סוג דוח לא תקין' })
      };
  }

  // Handle different output formats
  if (format === 'csv') {
    return formatAsCSV(reportData, reportTitle, headers);
  } else if (format === 'excel') {
    return formatAsExcel(reportData, reportTitle, headers);
  } else {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        reportType,
        title: reportTitle,
        generatedAt: new Date().toISOString(),
        data: reportData
      })
    };
  }
}

// Employees summary report
async function getEmployeesSummaryReport() {
  const query = `
    SELECT 
      COUNT(*) as total_employees,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
      COUNT(CASE WHEN status = 'terminated' THEN 1 END) as terminated_employees,
      COUNT(CASE WHEN status = 'on_leave' THEN 1 END) as on_leave_employees,
      COUNT(CASE WHEN employment_type = 'full_time' THEN 1 END) as full_time_employees,
      COUNT(CASE WHEN employment_type = 'part_time' THEN 1 END) as part_time_employees,
      COUNT(CASE WHEN employment_type = 'contractor' THEN 1 END) as contractor_employees,
      COUNT(CASE WHEN employment_type = 'intern' THEN 1 END) as intern_employees,
      COUNT(DISTINCT department) as total_departments,
      ROUND(AVG(salary), 2) as average_salary
    FROM employees
  `;
  
  const result = await pool.query(query);
  
  // Get department breakdown
  const deptQuery = `
    SELECT department, COUNT(*) as employee_count
    FROM employees
    WHERE department IS NOT NULL AND status = 'active'
    GROUP BY department
    ORDER BY employee_count DESC
  `;
  
  const deptResult = await pool.query(deptQuery);
  
  return {
    summary: result.rows[0],
    departmentBreakdown: deptResult.rows
  };
}

// Detailed employees report
async function getEmployeesDetailedReport(params = {}) {
  const { department, status, employment_type, start_date, end_date } = params;
  
  let query = `
    SELECT 
      e.employee_number, e.first_name, e.last_name, e.id_number,
      e.email, e.phone, e.department, e.position,
      e.start_date, e.end_date, e.employment_type, e.status,
      e.salary, e.created_at,
      u.username, u.role, u.is_active as user_active,
      COUNT(d.document_id) as document_count
    FROM employees e
    LEFT JOIN users u ON e.user_id = u.user_id
    LEFT JOIN documents d ON e.employee_id = d.employee_id
    WHERE 1=1
  `;
  
  const queryParams = [];
  let paramIndex = 1;
  
  if (department) {
    query += ` AND e.department = $${paramIndex++}`;
    queryParams.push(department);
  }
  
  if (status) {
    query += ` AND e.status = $${paramIndex++}`;
    queryParams.push(status);
  }
  
  if (employment_type) {
    query += ` AND e.employment_type = $${paramIndex++}`;
    queryParams.push(employment_type);
  }
  
  if (start_date) {
    query += ` AND e.start_date >= $${paramIndex++}`;
    queryParams.push(start_date);
  }
  
  if (end_date) {
    query += ` AND e.start_date <= $${paramIndex++}`;
    queryParams.push(end_date);
  }
  
  query += ` GROUP BY e.employee_id, u.user_id ORDER BY e.created_at DESC`;
  
  const result = await pool.query(query, queryParams);
  return result.rows;
}

// Documents summary report
async function getDocumentsSummaryReport() {
  const query = `
    SELECT 
      COUNT(*) as total_documents,
      COUNT(CASE WHEN status = 'uploaded' THEN 1 END) as uploaded_documents,
      COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_documents,
      COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_documents,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_documents,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_documents,
      ROUND(AVG(file_size), 2) as average_file_size,
      SUM(file_size) as total_storage_used
    FROM documents
    WHERE status != 'archived'
  `;
  
  const result = await pool.query(query);
  
  // Get file type breakdown
  const typeQuery = `
    SELECT file_type, COUNT(*) as count
    FROM documents
    WHERE status != 'archived'
    GROUP BY file_type
    ORDER BY count DESC
  `;
  
  const typeResult = await pool.query(typeQuery);
  
  // Get monthly upload trends
  const trendQuery = `
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as uploads
    FROM documents
    WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
  `;
  
  const trendResult = await pool.query(trendQuery);
  
  return {
    summary: result.rows[0],
    fileTypeBreakdown: typeResult.rows,
    uploadTrends: trendResult.rows
  };
}

// System activity report
async function getSystemActivityReport(params = {}) {
  const { start_date, end_date, action, limit = 100 } = params;
  
  let query = `
    SELECT 
      al.*, u.username, u.role,
      CASE 
        WHEN al.entity_type = 'user' THEN u2.username
        WHEN al.entity_type = 'employee' THEN CONCAT(e.first_name, ' ', e.last_name)
        WHEN al.entity_type = 'document' THEN d.original_filename
        ELSE al.entity_id::text
      END as entity_description
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.user_id
    LEFT JOIN users u2 ON al.entity_type = 'user' AND al.entity_id::uuid = u2.user_id
    LEFT JOIN employees e ON al.entity_type = 'employee' AND al.entity_id::uuid = e.employee_id
    LEFT JOIN documents d ON al.entity_type = 'document' AND al.entity_id::uuid = d.document_id
    WHERE 1=1
  `;
  
  const queryParams = [];
  let paramIndex = 1;
  
  if (start_date) {
    query += ` AND al.created_at >= $${paramIndex++}`;
    queryParams.push(start_date);
  }
  
  if (end_date) {
    query += ` AND al.created_at <= $${paramIndex++}`;
    queryParams.push(end_date);
  }
  
  if (action) {
    query += ` AND al.action = $${paramIndex++}`;
    queryParams.push(action);
  }
  
  query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex}`;
  queryParams.push(parseInt(limit));
  
  const result = await pool.query(query, queryParams);
  return result.rows;
}

// Dashboard statistics
async function getDashboardStats() {
  const queries = await Promise.all([
    // Employee stats
    pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_this_month
      FROM employees
    `),
    
    // Document stats
    pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'uploaded' THEN 1 END) as pending,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_this_week
      FROM documents
      WHERE status != 'archived'
    `),
    
    // User stats
    pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN last_login >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as active_this_week
      FROM users
    `),
    
    // Recent activity
    pool.query(`
      SELECT COUNT(*) as recent_activities
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '24 hours'
    `)
  ]);
  
  return {
    employees: queries[0].rows[0],
    documents: queries[1].rows[0],
    users: queries[2].rows[0],
    activity: queries[3].rows[0]
  };
}

// Format data as CSV
function formatAsCSV(data, title, headers) {
  if (!Array.isArray(data)) {
    data = [data];
  }
  
  if (data.length === 0) {
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.csv"`
      },
      body: 'אין נתונים להצגה'
    };
  }
  
  // Get column headers
  const columns = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = '\ufeff'; // BOM for Hebrew support
  csvContent += columns.join(',') + '\n';
  
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return '';
      // Escape commas and quotes
      const stringValue = String(value).replace(/"/g, '""');
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    });
    csvContent += values.join(',') + '\n';
  });
  
  return {
    statusCode: 200,
    headers: {
      ...headers,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.csv"`
    },
    body: csvContent
  };
}

// Format data as Excel (simplified - returns CSV for now, can be enhanced later)
function formatAsExcel(data, title, headers) {
  // For now, return CSV format with Excel mime type
  // In future, can use libraries like exceljs for real Excel format
  const csvResponse = formatAsCSV(data, title, headers);
  
  return {
    ...csvResponse,
    headers: {
      ...csvResponse.headers,
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.xls"`
    }
  };
}

// Handle custom reports (for future use)
async function handleCustomReport(currentUser, event, headers) {
  const { query, parameters = [] } = JSON.parse(event.body || '{}');
  
  if (!query) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'שאילתה נדרשת' })
    };
  }
  
  // Only admin can run custom queries
  if (currentUser.role !== 'admin') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'אין הרשאה להרצת שאילתות מותאמות אישית' })
    };
  }
  
  // Basic security check - only allow SELECT statements
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery.startsWith('select')) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'ניתן להריץ רק שאילתות SELECT' })
    };
  }
  
  try {
    const result = await pool.query(query, parameters);
    
    // Log the custom query
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values) 
       VALUES ($1, 'CUSTOM_QUERY', 'system', NULL, $2)`,
      [currentUser.user_id, JSON.stringify({ query, parameters })]
    );
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result.rows,
        rowCount: result.rowCount
      })
    };
    
  } catch (error) {
    console.error('Custom query error:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'שגיאה בהרצת השאילתה',
        details: error.message
      })
    };
  }
}