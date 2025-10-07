const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8080;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve index.html for SPA routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Auth Register Route (converted from Netlify Function)
app.post('/api/auth-register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    console.log('Registration attempt:', { username, email, firstName, lastName });

    // Input validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT user_id FROM hr.users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into hr.users table
    const userResult = await pool.query(
      `INSERT INTO hr.users (username, email, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, username, email, role, is_active, created_at`,
      [username, email, hashedPassword, 'employee', true]
    );

    const newUser = userResult.rows[0];

    // Insert employee record into hr.employees table
    await pool.query(
      `INSERT INTO hr.employees (user_id, first_name, last_name, email, hire_date, status)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, $5)`,
      [newUser.user_id, firstName, lastName, email, 'active']
    );

    // Log the registration in hr.audit_logs
    await pool.query(
      `INSERT INTO hr.audit_logs (user_id, action, details, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        newUser.user_id,
        'USER_REGISTRATION',
        JSON.stringify({
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }),
        req.ip || req.connection.remoteAddress || 'unknown'
      ]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('User registered successfully:', newUser.user_id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.is_active,
        createdAt: newUser.created_at
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    });
  }
});

// Auth Login Route (basic implementation)
app.post('/api/auth-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Get user from database
    const userResult = await pool.query(
      'SELECT user_id, username, email, password_hash, role, is_active FROM hr.users WHERE username = $1 OR email = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log the login
    await pool.query(
      `INSERT INTO hr.audit_logs (user_id, action, details, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        user.user_id,
        'USER_LOGIN',
        JSON.stringify({ username: user.username, email: user.email }),
        req.ip || req.connection.remoteAddress || 'unknown'
      ]
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.is_active
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login'
    });
  }
});

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;