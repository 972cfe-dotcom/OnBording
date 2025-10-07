// Authentication login endpoint
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const JWT_SECRET = process.env.JWT_SECRET || 'hr-system-secret-key-change-in-production';

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { username, password, email } = JSON.parse(event.body || '{}');

    if (!password || (!username && !email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Username/email and password are required'
        })
      };
    }

    // Find user by username or email
    let userQuery;
    let queryParams;

    if (email) {
      userQuery = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
      queryParams = [email];
    } else {
      userQuery = 'SELECT * FROM users WHERE username = $1 AND is_active = true';
      queryParams = [username];
    }

    const userResult = await pool.query(userQuery, queryParams);

    if (userResult.rows.length === 0) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'משתמש או סיסמה לא נכונים'
        })
      };
    }

    const user = userResult.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'משתמש או סיסמה לא נכונים'
        })
      };
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    // Get employee details if exists
    let employeeData = null;
    if (user.role === 'employee' || user.role === 'hr_manager') {
      const employeeResult = await pool.query(
        'SELECT employee_id, employee_number, first_name, last_name, department, position FROM employees WHERE user_id = $1',
        [user.user_id]
      );
      
      if (employeeResult.rows.length > 0) {
        employeeData = employeeResult.rows[0];
      }
    }

    // Generate JWT token
    const tokenPayload = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      employee_id: employeeData?.employee_id || null
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

    // Log successful login (audit trail)
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent) 
       VALUES ($1, 'LOGIN', 'user', $1, $2, $3)`,
      [
        user.user_id,
        event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown',
        event.headers['user-agent'] || 'unknown'
      ]
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'התחברת בהצלחה',
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          employee: employeeData
        },
        token,
        expires_in: '8h'
      })
    };

  } catch (error) {
    console.error('Login error:', error);
    
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