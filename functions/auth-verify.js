// JWT token verification and user authentication middleware
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_lOh28bqVrHYC@ep-curly-heart-aeh5ihpv-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&search_path=hr',
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = 'hr-system-jwt-secret-key-2024-secure-token';

// Helper function to verify JWT and get user data
async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is active
    const userResult = await pool.query(
      'SELECT user_id, username, email, role, is_active FROM users WHERE user_id = $1 AND is_active = true',
      [decoded.user_id]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found or inactive');
    }

    return {
      success: true,
      user: userResult.rows[0],
      decoded
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Verify token endpoint
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
    // Get token from Authorization header or request body
    let token = null;
    
    if (event.headers.authorization) {
      token = event.headers.authorization.replace('Bearer ', '');
    } else if (event.body) {
      const body = JSON.parse(event.body);
      token = body.token;
    }

    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No token provided'
        })
      };
    }

    const verification = await verifyToken(token);

    if (!verification.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Token is invalid or expired',
          details: verification.error
        })
      };
    }

    // Get employee details if user is employee
    let employeeData = null;
    if (verification.user.role === 'employee' || verification.user.role === 'hr_manager') {
      const employeeResult = await pool.query(
        'SELECT employee_id, employee_number, first_name, last_name, department, position, status FROM employees WHERE user_id = $1',
        [verification.user.user_id]
      );
      
      if (employeeResult.rows.length > 0) {
        employeeData = employeeResult.rows[0];
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        valid: true,
        user: {
          ...verification.user,
          employee: employeeData
        },
        decoded: verification.decoded
      })
    };

  } catch (error) {
    console.error('Token verification error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};

// Export the verify function for use in other functions
module.exports.verifyToken = verifyToken;