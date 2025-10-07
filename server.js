// Express server for Railway deployment
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Import function handlers
const authRegister = require('./functions/auth-register');
const authLogin = require('./functions/auth-login');
const authVerify = require('./functions/auth-verify');
const apiHealth = require('./functions/api-health');
const dbSetup = require('./functions/db-setup');
const usersApi = require('./functions/users-api');
const employeesApi = require('./functions/employees-api');
const documentsApi = require('./functions/documents-api');
const reportsApi = require('./functions/reports-api');
const createAdmin = require('./functions/create-admin');
const testEnv = require('./functions/test-env');

// Convert Netlify functions to Express routes
const createRoute = (handler) => async (req, res) => {
  try {
    const event = {
      httpMethod: req.method,
      headers: req.headers,
      body: JSON.stringify(req.body),
      queryStringParameters: req.query
    };
    
    const context = {};
    const result = await handler.handler(event, context);
    
    // Set headers
    if (result.headers) {
      Object.keys(result.headers).forEach(key => {
        res.setHeader(key, result.headers[key]);
      });
    }
    
    res.status(result.statusCode || 200).send(result.body);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// API Routes (matching Netlify functions)
app.all('/api/auth-register', createRoute(authRegister));
app.all('/api/auth-login', createRoute(authLogin));
app.all('/api/auth-verify', createRoute(authVerify));
app.all('/api/api-health', createRoute(apiHealth));
app.all('/api/db-setup', createRoute(dbSetup));
app.all('/api/users-api', createRoute(usersApi));
app.all('/api/employees-api', createRoute(employeesApi));
app.all('/api/documents-api', createRoute(documentsApi));
app.all('/api/reports-api', createRoute(reportsApi));
app.all('/api/create-admin', createRoute(createAdmin));
app.all('/api/test-env', createRoute(testEnv));

// Health check endpoint (define BEFORE other routes)
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Alternative routes for .netlify/functions compatibility
app.all('/.netlify/functions/:functionName', (req, res) => {
  const functionName = req.params.functionName;
  // Redirect to API endpoint
  req.url = `/api/${functionName}`;
  const newReq = Object.assign(req, { url: `/api/${functionName}` });
  app._router.handle(newReq, res, () => {
    res.status(404).json({ error: `Function ${functionName} not found` });
  });
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all for SPA routing (MUST be last)
app.get('*', (req, res) => {
  // Don't redirect API calls or health checks
  if (req.path.startsWith('/api/') || req.path.startsWith('/.netlify/functions/') || req.path === '/health') {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚂 Railway HR System running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🏠 Main app: http://localhost:${port}`);
});

module.exports = app;