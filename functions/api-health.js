// Health check endpoint for the system
const db = require('./db');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Check system status
    const systemStatus = {
      timestamp: new Date().toISOString(),
      system: 'running',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };

    // Test database connection if configured
    let dbStatus = { status: 'not_configured' };
    if (process.env.DATABASE_URL) {
      const dbTest = await db.testConnection();
      dbStatus = {
        status: dbTest.success ? 'connected' : 'error',
        ...(dbTest.success ? { connected_at: dbTest.timestamp } : { error: dbTest.error })
      };
    }

    const response = {
      success: true,
      system: systemStatus,
      database: dbStatus,
      message: 'System is ready for specifications'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    console.error('Health check failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Health check failed',
        details: error.message,
        timestamp: new Date().toISOString()
      }, null, 2)
    };
  }
};