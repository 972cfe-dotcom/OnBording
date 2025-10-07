// Employees management API endpoint
const { Pool } = require('pg');
const { verifyToken } = require('./auth-verify');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        return await handleGetEmployees(currentUser, event, headers);
      case 'POST':
        return await handleCreateEmployee(currentUser, event, headers);
      case 'PUT':
        return await handleUpdateEmployee(currentUser, event, headers);
      case 'DELETE':
        return await handleDeleteEmployee(currentUser, event, headers);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

  } catch (error) {
    console.error('Employees API error:', error);
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

// Get employees
async function handleGetEmployees(currentUser, event, headers) {
  const { employee_id } = event.queryStringParameters || {};

  let query;
  let queryParams = [];

  if (employee_id) {
    // Get specific employee
    // Employees can only see their own data, admins/HR can see all
    if (currentUser.role === 'employee') {
      // Check if this employee belongs to current user
      const userEmployeeResult = await pool.query(
        'SELECT employee_id FROM employees WHERE user_id = $1',
        [currentUser.user_id]
      );
      
      if (userEmployeeResult.rows.length === 0 || userEmployeeResult.rows[0].employee_id !== employee_id) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'אין הרשאה לצפות בנתוני עובד זה' })
        };
      }
    }

    query = `
      SELECT e.*, u.username, u.email as user_email, u.role, u.is_active,
             m.first_name as manager_first_name, m.last_name as manager_last_name
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.user_id
      LEFT JOIN employees m ON e.manager_employee_id = m.employee_id
      WHERE e.employee_id = $1
    `;
    queryParams = [employee_id];
  } else {
    // Get all employees (admin/HR only)
    if (currentUser.role === 'employee') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'אין הרשאה לצפות ברשימת העובדים' })
      };
    }

    query = `
      SELECT e.employee_id, e.employee_number, e.first_name, e.last_name, 
             e.email, e.phone, e.department, e.position, e.start_date, 
             e.employment_type, e.status, e.created_at,
             u.username, u.role, u.is_active,
             m.first_name as manager_first_name, m.last_name as manager_last_name
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.user_id
      LEFT JOIN employees m ON e.manager_employee_id = m.employee_id
      ORDER BY e.created_at DESC
    `;
  }

  const result = await pool.query(query, queryParams);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      employees: employee_id ? result.rows[0] || null : result.rows
    })
  };
}

// Create new employee (admin/HR only)
async function handleCreateEmployee(currentUser, event, headers) {
  if (!['admin', 'hr_manager'].includes(currentUser.role)) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'אין הרשאה - נדרשת רמת מנהל מערכת או HR' })
    };
  }

  const employeeData = JSON.parse(event.body || '{}');
  const {
    user_id, employee_number, id_number, passport_number, first_name, last_name,
    email, phone, mobile_phone, start_date, birth_date, address, city, postal_code,
    emergency_contact_name, emergency_contact_phone, department, position,
    manager_employee_id, salary, employment_type = 'full_time', notes
  } = employeeData;

  // Validate required fields
  if (!employee_number || !id_number || !first_name || !last_name || !email || !phone) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'חסרים שדות חובה: מספר עובד, ת.ז, שם פרטי, שם משפחה, אימייל וטלפון' })
    };
  }

  // Validate Israeli ID number (basic check)
  if (!/^\d{9}$/.test(id_number)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'מספר תעודת זהות לא תקין' })
    };
  }

  // Check if employee number or ID number already exists
  const existingEmployee = await pool.query(
    'SELECT employee_id FROM employees WHERE employee_number = $1 OR id_number = $2',
    [employee_number, id_number]
  );

  if (existingEmployee.rows.length > 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'מספר עובד או תעודת זהות כבר קיימים במערכת' })
    };
  }

  // Insert new employee
  const insertQuery = `
    INSERT INTO employees (
      user_id, employee_number, id_number, passport_number, first_name, last_name,
      email, phone, mobile_phone, start_date, birth_date, address, city, postal_code,
      emergency_contact_name, emergency_contact_phone, department, position,
      manager_employee_id, salary, employment_type, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *
  `;

  const insertValues = [
    user_id || null, employee_number, id_number, passport_number || null,
    first_name, last_name, email, phone, mobile_phone || null,
    start_date || null, birth_date || null, address || null,
    city || null, postal_code || null, emergency_contact_name || null,
    emergency_contact_phone || null, department || null, position || null,
    manager_employee_id || null, salary || null, employment_type, notes || null
  ];

  const result = await pool.query(insertQuery, insertValues);
  const newEmployee = result.rows[0];

  // Log the action
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values) 
     VALUES ($1, 'CREATE', 'employee', $2, $3)`,
    [currentUser.user_id, newEmployee.employee_id, JSON.stringify(newEmployee)]
  );

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'עובד נוצר בהצלחה',
      employee: newEmployee
    })
  };
}

// Update employee
async function handleUpdateEmployee(currentUser, event, headers) {
  const employeeData = JSON.parse(event.body || '{}');
  const { employee_id } = employeeData;

  if (!employee_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'מזהה עובד נדרש' })
    };
  }

  // Check permissions
  if (currentUser.role === 'employee') {
    // Employees can only update their own data (limited fields)
    const userEmployeeResult = await pool.query(
      'SELECT employee_id FROM employees WHERE user_id = $1',
      [currentUser.user_id]
    );
    
    if (userEmployeeResult.rows.length === 0 || userEmployeeResult.rows[0].employee_id !== employee_id) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'אין הרשאה לעדכן נתוני עובד זה' })
      };
    }
  }

  // Get current employee data
  const currentData = await pool.query('SELECT * FROM employees WHERE employee_id = $1', [employee_id]);
  if (currentData.rows.length === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'עובד לא נמצא' })
    };
  }

  const updates = [];
  const values = [];
  let paramIndex = 1;

  // Define which fields can be updated by role
  const adminFields = [
    'employee_number', 'id_number', 'passport_number', 'first_name', 'last_name',
    'email', 'phone', 'mobile_phone', 'start_date', 'end_date', 'birth_date',
    'address', 'city', 'postal_code', 'department', 'position',
    'manager_employee_id', 'salary', 'employment_type', 'status', 'notes'
  ];
  
  const employeeFields = [
    'phone', 'mobile_phone', 'address', 'city', 'postal_code',
    'emergency_contact_name', 'emergency_contact_phone'
  ];

  const allowedFields = ['admin', 'hr_manager'].includes(currentUser.role) ? adminFields : employeeFields;

  // Build update query
  for (const field of allowedFields) {
    if (employeeData.hasOwnProperty(field) && employeeData[field] !== undefined) {
      updates.push(`${field} = $${paramIndex++}`);
      values.push(employeeData[field]);
    }
  }

  if (updates.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'לא נבחרו שדות לעדכון' })
    };
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(employee_id);

  const updateQuery = `
    UPDATE employees SET ${updates.join(', ')} 
    WHERE employee_id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, values);

  // Log the action
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values) 
     VALUES ($1, 'UPDATE', 'employee', $2, $3, $4)`,
    [currentUser.user_id, employee_id, JSON.stringify(currentData.rows[0]), JSON.stringify(result.rows[0])]
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'נתוני עובד עודכנו בהצלחה',
      employee: result.rows[0]
    })
  };
}

// Delete (deactivate) employee (admin/HR only)
async function handleDeleteEmployee(currentUser, event, headers) {
  if (!['admin', 'hr_manager'].includes(currentUser.role)) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'אין הרשאה - נדרשת רמת מנהל מערכת או HR' })
    };
  }

  const { employee_id } = JSON.parse(event.body || '{}');

  if (!employee_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'מזהה עובד נדרש' })
    };
  }

  // Get employee data before deletion
  const employeeData = await pool.query('SELECT * FROM employees WHERE employee_id = $1', [employee_id]);
  if (employeeData.rows.length === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'עובד לא נמצא' })
    };
  }

  // Soft delete - change status to terminated
  await pool.query(
    'UPDATE employees SET status = $1, end_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2',
    ['terminated', employee_id]
  );

  // Also deactivate associated user account if exists
  if (employeeData.rows[0].user_id) {
    await pool.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [employeeData.rows[0].user_id]
    );
  }

  // Log the action
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values) 
     VALUES ($1, 'DELETE', 'employee', $2, $3)`,
    [currentUser.user_id, employee_id, JSON.stringify(employeeData.rows[0])]
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'עובד הועבר לסטטוס מפוטר בהצלחה'
    })
  };
}