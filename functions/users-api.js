// Users management API endpoint
const bcrypt = require('bcrypt');
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
        return await handleGetUsers(currentUser, event, headers);
      case 'POST':
        return await handleCreateUser(currentUser, event, headers);
      case 'PUT':
        return await handleUpdateUser(currentUser, event, headers);
      case 'DELETE':
        return await handleDeleteUser(currentUser, event, headers);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

  } catch (error) {
    console.error('Users API error:', error);
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

// Get users (admin only)
async function handleGetUsers(currentUser, event, headers) {
  if (currentUser.role !== 'admin') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'אין הרשאה - נדרשת רמת מנהל מערכת' })
    };
  }

  const query = `
    SELECT u.user_id, u.username, u.email, u.role, u.is_active, u.last_login, u.created_at,
           e.employee_id, e.first_name, e.last_name, e.department, e.position
    FROM users u
    LEFT JOIN employees e ON u.user_id = e.user_id
    ORDER BY u.created_at DESC
  `;

  const result = await pool.query(query);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      users: result.rows
    })
  };
}

// Create new user (admin only)
async function handleCreateUser(currentUser, event, headers) {
  if (currentUser.role !== 'admin') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'אין הרשאה - נדרשת רמת מנהל מערכת' })
    };
  }

  const { username, email, password, role = 'employee' } = JSON.parse(event.body || '{}');

  if (!username || !email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'שם משתמש, אימייל וסיסמה נדרשים' })
    };
  }

  // Validate role
  if (!['admin', 'employee', 'hr_manager'].includes(role)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'תפקיד לא תקין' })
    };
  }

  // Check if username or email already exists
  const existingUser = await pool.query(
    'SELECT user_id FROM users WHERE username = $1 OR email = $2',
    [username, email]
  );

  if (existingUser.rows.length > 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'שם משתמש או אימייל כבר קיימים במערכת' })
    };
  }

  // Hash password
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Insert new user
  const insertResult = await pool.query(
    `INSERT INTO users (username, email, password_hash, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING user_id, username, email, role, is_active, created_at`,
    [username, email, password_hash, role]
  );

  const newUser = insertResult.rows[0];

  // Log the action
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values) 
     VALUES ($1, 'CREATE', 'user', $2, $3)`,
    [currentUser.user_id, newUser.user_id, JSON.stringify(newUser)]
  );

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'משתמש נוצר בהצלחה',
      user: newUser
    })
  };
}

// Update user (admin only, or user updating themselves)
async function handleUpdateUser(currentUser, event, headers) {
  const { user_id, username, email, role, is_active, password } = JSON.parse(event.body || '{}');

  if (!user_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'מזהה משתמש נדרש' })
    };
  }

  // Check permissions - admin can update anyone, users can only update themselves
  if (currentUser.role !== 'admin' && currentUser.user_id !== user_id) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'אין הרשאה לעדכן משתמש זה' })
    };
  }

  // Get current user data
  const currentData = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
  if (currentData.rows.length === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'משתמש לא נמצא' })
    };
  }

  const updates = [];
  const values = [];
  let paramIndex = 1;

  // Only admin can change role and active status
  if (currentUser.role === 'admin') {
    if (username !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      values.push(username);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
  } else {
    // Regular users can only update email
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
  }

  // Anyone can change their password
  if (password) {
    const password_hash = await bcrypt.hash(password, 12);
    updates.push(`password_hash = $${paramIndex++}`);
    values.push(password_hash);
  }

  if (updates.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'לא נבחרו שדות לעדכון' })
    };
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(user_id);

  const updateQuery = `
    UPDATE users SET ${updates.join(', ')} 
    WHERE user_id = $${paramIndex}
    RETURNING user_id, username, email, role, is_active, updated_at
  `;

  const result = await pool.query(updateQuery, values);

  // Log the action
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values) 
     VALUES ($1, 'UPDATE', 'user', $2, $3, $4)`,
    [currentUser.user_id, user_id, JSON.stringify(currentData.rows[0]), JSON.stringify(result.rows[0])]
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'משתמש עודכן בהצלחה',
      user: result.rows[0]
    })
  };
}

// Delete user (admin only)
async function handleDeleteUser(currentUser, event, headers) {
  if (currentUser.role !== 'admin') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'אין הרשאה - נדרשת רמת מנהל מערכת' })
    };
  }

  const { user_id } = JSON.parse(event.body || '{}');

  if (!user_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'מזהה משתמש נדרש' })
    };
  }

  // Can't delete yourself
  if (currentUser.user_id === user_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'לא ניתן למחוק את המשתמש הנוכחי' })
    };
  }

  // Get user data before deletion
  const userData = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
  if (userData.rows.length === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'משתמש לא נמצא' })
    };
  }

  // Soft delete - just deactivate the user
  await pool.query(
    'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
    [user_id]
  );

  // Log the action
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values) 
     VALUES ($1, 'DELETE', 'user', $2, $3)`,
    [currentUser.user_id, user_id, JSON.stringify(userData.rows[0])]
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'משתמש הושבת בהצלחה'
    })
  };
}