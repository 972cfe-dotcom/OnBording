// Database setup and migration function for Neon PostgreSQL
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database connection configuration
const config = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool(config);
  }
  return pool;
}

// Database setup endpoint
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

  // Only allow POST requests for setup
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const client = getPool();

    // Check if database is already initialized
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('users', 'employees', 'bank_accounts')
    `;
    
    const existingTables = await client.query(tablesQuery);
    
    if (existingTables.rows.length > 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Database already initialized',
          tables: existingTables.rows.map(row => row.table_name)
        })
      };
    }

    // Read and execute schema SQL
    const schemaSQL = `
-- HR Management System Database Schema
-- PostgreSQL Schema for Neon Database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (authentication and basic user info)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee', 'hr_manager')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table (employee master data)
CREATE TABLE employees (
    employee_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    id_number VARCHAR(9) UNIQUE NOT NULL,
    passport_number VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    mobile_phone VARCHAR(15),
    start_date DATE,
    end_date DATE,
    birth_date DATE,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(15),
    department VARCHAR(100),
    position VARCHAR(100),
    manager_employee_id UUID REFERENCES employees(employee_id),
    salary DECIMAL(10,2),
    employment_type VARCHAR(50) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contractor', 'intern')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'terminated', 'on_leave', 'suspended')),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank accounts table
CREATE TABLE bank_accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    bank_code VARCHAR(10),
    branch_number VARCHAR(10) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    account_owner_name VARCHAR(200),
    is_own_account BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    account_type VARCHAR(50) DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings')),
    iban VARCHAR(50),
    swift_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, account_number, branch_number)
);

-- System settings table
CREATE TABLE system_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_id_number ON employees(id_number);
CREATE INDEX idx_employees_employee_number ON employees(employee_number);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_status ON employees(status);

CREATE INDEX idx_bank_accounts_employee_id ON bank_accounts(employee_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

    // Execute schema creation
    await client.query(schemaSQL);

    // Insert default system settings
    const settingsSQL = `
INSERT INTO system_settings (setting_key, setting_value, data_type, description, is_system) VALUES 
('app_name', 'מערכת משאבי אנוש', 'string', 'שם המערכת', false),
('max_file_size_mb', '25', 'number', 'גודל קובץ מקסימלי באפלודה (MB)', false),
('session_timeout_hours', '8', 'number', 'זמן פקיעת סשן (שעות)', false),
('enable_audit_logs', 'true', 'boolean', 'הפעלת לוגי ביקורת', true),
('default_language', 'he', 'string', 'שפה ברירת מחדל', false),
('company_name', 'החברה שלנו', 'string', 'שם החברה', false);
`;

    await client.query(settingsSQL);

    // Create default admin user
    const adminSQL = `
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/XfxYOwBrS', 'admin');
`;

    await client.query(adminSQL);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Database initialized successfully',
        created_tables: ['users', 'employees', 'bank_accounts', 'system_settings'],
        admin_credentials: {
          username: 'admin',
          email: 'admin@company.com',
          password: 'Admin123!',
          note: 'Please change password on first login'
        }
      })
    };

  } catch (error) {
    console.error('Database setup failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Database setup failed',
        details: error.message
      })
    };
  }
};