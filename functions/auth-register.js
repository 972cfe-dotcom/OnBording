// User registration API endpoint
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
    const { username, email, password, confirm_password, first_name, last_name, id_number, phone } = JSON.parse(event.body || '{}');

    // Validation
    if (!username || !email || !password || !confirm_password || !first_name || !last_name || !id_number || !phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'כל השדות הם חובה (שם משתמש, אימייל, סיסמה, אימות סיסמה, שם פרטי, שם משפחה, תעודת זהות וטלפון)'
        })
      };
    }

    // Validate username length
    if (username.length < 3) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'שם משתמש חייב להכיל לפחות 3 תווים'
        })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'כתובת אימייל לא תקינה'
        })
      };
    }

    // Validate Israeli ID number
    if (!/^\d{9}$/.test(id_number)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'תעודת זהות חייבת להכיל 9 ספרות בלבד'
        })
      };
    }

    // Validate phone number
    if (!/^0\d{1,2}-?\d{7}$/.test(phone.replace(/\s/g, ''))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'מספר טלפון לא תקין (פורמט: 0X-XXXXXXX או 0XX-XXXXXXX)'
        })
      };
    }

    // Validate password strength
    if (password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'סיסמה חייבת להכיל לפחות 8 תווים'
        })
      };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'סיסמה חייבת להכיל לפחות אות קטנה אחת'
        })
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'סיסמה חייבת להכיל לפחות אות גדולה אחת'
        })
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'סיסמה חייבת להכיל לפחות מספר אחד'
        })
      };
    }

    // Check password confirmation
    if (password !== confirm_password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'הסיסמאות אינן תואמות'
        })
      };
    }

    // Check if username, email or ID number already exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'שם משתמש או אימייל כבר קיימים במערכת'
        })
      };
    }

    // Check if ID number already exists
    const existingEmployee = await pool.query(
      'SELECT employee_id FROM employees WHERE id_number = $1',
      [id_number]
    );

    if (existingEmployee.rows.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'תעודת זהות כבר קיימת במערכת'
        })
      };
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const userResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, username, email, role, is_active, created_at`,
      [username, email, hashedPassword, 'employee', true]
    );

    const newUser = userResult.rows[0];

    // Create basic employee record
    const employeeResult = await pool.query(
      `INSERT INTO employees (user_id, first_name, last_name, email, phone, id_number, employee_number) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING employee_id`,
      [
        newUser.user_id, 
        first_name, 
        last_name, 
        email,
        phone,
        id_number,
        await generateEmployeeNumber()
      ]
    );

    const employeeId = employeeResult.rows[0].employee_id;

    // Log the registration
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values) 
       VALUES ($1, 'REGISTER', 'user', $2, $3)`,
      [newUser.user_id, newUser.user_id, JSON.stringify({ 
        username, 
        email, 
        first_name, 
        last_name,
        phone,
        id_number,
        employee_id: employeeId
      })]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: newUser.user_id, 
        username: newUser.username, 
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'hr_system_secret_key',
      { expiresIn: '8h' }
    );

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [newUser.user_id]
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'החשבון נוצר בהצלחה! התחברות אוטומטית...',
        user: {
          user_id: newUser.user_id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          is_active: newUser.is_active,
          employee_id: employeeId,
          first_name,
          last_name,
          phone,
          id_number
        },
        token
      })
    };

  } catch (error) {
    console.error('Registration error:', error);
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

// Generate unique employee number
async function generateEmployeeNumber() {
  try {
    const year = new Date().getFullYear();
    
    // Get the highest employee number for current year
    const result = await pool.query(
      `SELECT employee_number FROM employees 
       WHERE employee_number ~ $1 
       ORDER BY employee_number DESC 
       LIMIT 1`,
      [`^${year}\\d{3}$`]
    );
    
    let nextNumber = 1;
    if (result.rows.length > 0) {
      const lastNumber = result.rows[0].employee_number;
      const lastSequence = parseInt(lastNumber.slice(-3));
      nextNumber = lastSequence + 1;
    }
    
    return `${year}${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating employee number:', error);
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 900) + 100;
    return `${year}${random}`;
  }
}