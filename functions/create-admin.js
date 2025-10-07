// Create initial admin user for system setup
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_lOh28bqVrHYC@ep-curly-heart-aeh5ihpv-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&search_path=hr',
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check if any admin users exist
    const existingAdmins = await pool.query(
      'SELECT user_id FROM users WHERE role = $1',
      ['admin']
    );

    if (existingAdmins.rows.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'משתמש אדמין כבר קיים במערכת'
        })
      };
    }

    // Create default admin user
    const adminData = {
      username: 'admin',
      email: 'admin@hr-system.com',
      password: 'Admin123!',
      first_name: 'מנהל',
      last_name: 'מערכת'
    };

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

    // Create admin user
    const userResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, username, email, role, is_active, created_at`,
      [adminData.username, adminData.email, hashedPassword, 'admin', true]
    );

    const adminUser = userResult.rows[0];

    // Create admin employee record
    const employeeResult = await pool.query(
      `INSERT INTO employees (user_id, first_name, last_name, email, employee_number, department, position) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING employee_id`,
      [
        adminUser.user_id, 
        adminData.first_name, 
        adminData.last_name, 
        adminData.email, 
        '2024001',
        'הנהלה',
        'מנהל מערכת'
      ]
    );

    // Create sample HR manager user
    const hrPassword = await bcrypt.hash('HR123!', saltRounds);
    const hrUserResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id`,
      ['hr_manager', 'hr@hr-system.com', hrPassword, 'hr_manager', true]
    );

    const hrEmployeeResult = await pool.query(
      `INSERT INTO employees (user_id, first_name, last_name, email, employee_number, department, position) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        hrUserResult.rows[0].user_id, 
        'מנהל',
        'משאבי אנוש', 
        'hr@hr-system.com', 
        '2024002',
        'משאבי אנוש',
        'מנהל משאבי אנוש'
      ]
    );

    // Create sample employee user
    const empPassword = await bcrypt.hash('Employee123!', saltRounds);
    const empUserResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id`,
      ['employee', 'employee@hr-system.com', empPassword, 'employee', true]
    );

    const empEmployeeResult = await pool.query(
      `INSERT INTO employees (user_id, first_name, last_name, email, employee_number, department, position, phone, start_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        empUserResult.rows[0].user_id, 
        'עובד',
        'דוגמה', 
        'employee@hr-system.com', 
        '2024003',
        'IT',
        'מפתח תוכנה',
        '050-1234567',
        '2024-01-01'
      ]
    );

    // Log the creation
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values) 
       VALUES ($1, 'SYSTEM_SETUP', 'admin_creation', $2, $3)`,
      [adminUser.user_id, adminUser.user_id, JSON.stringify({
        admin_created: true,
        users_created: 3,
        employees_created: 3
      })]
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'משתמשי מערכת נוצרו בהצלחה',
        users: [
          {
            username: 'admin',
            password: 'Admin123!',
            role: 'מנהל מערכת',
            description: 'משתמש אדמין ראשי עם הרשאות מלאות'
          },
          {
            username: 'hr_manager',
            password: 'HR123!',
            role: 'מנהל משאבי אנוש',
            description: 'מנהל HR עם הרשאות ניהול עובדים'
          },
          {
            username: 'employee',
            password: 'Employee123!',
            role: 'עובד',
            description: 'עובד רגיל עם הרשאות בסיסיות'
          }
        ],
        note: 'שמור פרטי ההתחברות האלה במקום בטוח ושנה את הסיסמאות לאחר ההתחברות הראשונה'
      })
    };

  } catch (error) {
    console.error('Admin creation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'שגיאה ביצירת משתמשי מערכת',
        details: error.message
      })
    };
  }
};