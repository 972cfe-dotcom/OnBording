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
    id_number VARCHAR(9) UNIQUE NOT NULL, -- Israeli ID number
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
    metadata JSONB, -- For flexible additional data
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

-- Document types table
CREATE TABLE document_types (
    type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    required_fields JSONB, -- Schema for required metadata fields
    max_file_size INTEGER DEFAULT 10485760, -- 10MB in bytes
    allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    retention_period_months INTEGER DEFAULT 84, -- 7 years default
    requires_approval BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table (file metadata and workflow)
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(employee_id) ON DELETE SET NULL,
    document_type_id UUID REFERENCES document_types(type_id),
    uploaded_by UUID NOT NULL REFERENCES users(user_id),
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- S3 or storage path
    file_size INTEGER NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    checksum VARCHAR(64), -- SHA-256 for integrity
    status VARCHAR(50) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'ocr_pending', 'ocr_complete', 'ocr_failed', 'ready', 'under_review', 'approved', 'rejected', 'archived')),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'department', 'public')),
    extracted_text TEXT, -- OCR results
    ocr_confidence DECIMAL(5,2), -- 0.00 to 100.00
    ocr_language VARCHAR(10) DEFAULT 'he', -- Hebrew default
    metadata JSONB, -- Document-specific metadata
    version_number INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES documents(document_id),
    expiry_date DATE,
    is_encrypted BOOLEAN DEFAULT FALSE,
    encryption_key_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Document approvals/workflow
CREATE TABLE document_approvals (
    approval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    approver_user_id UUID NOT NULL REFERENCES users(user_id),
    required_role VARCHAR(50), -- Role required for approval
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
    comments TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'employee', 'document'
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'document_approval', 'system_alert', 'reminder'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional notification data
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- System settings table
CREATE TABLE system_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- System settings vs user-configurable
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
CREATE INDEX idx_employees_department ON employees(department);

CREATE INDEX idx_bank_accounts_employee_id ON bank_accounts(employee_id);
CREATE INDEX idx_bank_accounts_default ON bank_accounts(employee_id, is_default) WHERE is_default = true;

CREATE INDEX idx_documents_employee_id ON documents(employee_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(document_type_id);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_text_search ON documents USING gin(to_tsvector('hebrew', extracted_text)) WHERE extracted_text IS NOT NULL;

CREATE INDEX idx_document_approvals_document_id ON document_approvals(document_id);
CREATE INDEX idx_document_approvals_approver ON document_approvals(approver_user_id);
CREATE INDEX idx_document_approvals_status ON document_approvals(status);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

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
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default document types
INSERT INTO document_types (type_name, description, required_fields) VALUES 
('תעודת זהות', 'תעודת זהות או דרכון', '{"fields": ["id_number", "expiry_date"]}'),
('קורות חיים', 'קורות חיים של המועמד', '{"fields": ["upload_date"]}'),
('תעודות השכלה', 'תעודות והסמכות השכלה', '{"fields": ["institution", "degree", "graduation_date"]}'),
('אישורי ביטוח', 'אישורי ביטוח לאומי וביטוח בריאות', '{"fields": ["insurance_type", "policy_number", "expiry_date"]}'),
('הסכם העסקה', 'חוזה עבודה והסכמי העסקה', '{"fields": ["contract_type", "start_date", "salary"]}'),
('פטור מס', 'טופס פטור ממס הכנסה', '{"fields": ["tax_year", "exemption_amount"]}'),
('תלוש משכורת', 'תלושי שכר חודשיים', '{"fields": ["salary_month", "gross_salary", "net_salary"]}'),
('בקשת חופשה', 'בקשות לחופשה ושעות נוספות', '{"fields": ["vacation_type", "start_date", "end_date", "days_count"]}'),
('אישור רפואי', 'אישורים רפואיים ותעודות מחלה', '{"fields": ["medical_type", "issue_date", "validity_period"]}'),
('מסמכי בנק', 'פרטי חשבון בנק ואישורי משכורת', '{"fields": ["bank_name", "account_number", "account_type"]}');

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, data_type, description, is_system) VALUES 
('app_name', 'מערכת משאבי אנוש', 'string', 'שם המערכת', false),
('max_file_size_mb', '25', 'number', 'גודל קובץ מקסימלי באפלודה (MB)', false),
('ocr_confidence_threshold', '85.0', 'number', 'סף דיוק מינימלי עבור OCR', false),
('session_timeout_hours', '8', 'number', 'זמן פקיעת סשן (שעות)', false),
('backup_retention_days', '90', 'number', 'שמירת גיבויים (ימים)', true),
('enable_audit_logs', 'true', 'boolean', 'הפעלת לוגי ביקורת', true),
('default_language', 'he', 'string', 'שפה ברירת מחדל', false),
('company_name', 'החברה שלנו', 'string', 'שם החברה', false),
('support_email', 'support@company.com', 'string', 'אימייל תמיכה טכנית', false),
('notification_retention_days', '30', 'number', 'שמירת התראות (ימים)', false);

-- Create default admin user (password should be changed on first login)
-- Password: Admin123! (hashed with bcrypt)
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/XfxYOwBrS', 'admin');

-- Add some constraints and validations
ALTER TABLE bank_accounts ADD CONSTRAINT unique_default_account_per_employee 
    EXCLUDE (employee_id WITH =) WHERE (is_default = true);

-- Add check constraints
ALTER TABLE employees ADD CONSTRAINT valid_id_number CHECK (LENGTH(id_number) = 9);
ALTER TABLE employees ADD CONSTRAINT valid_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE bank_accounts ADD CONSTRAINT valid_account_number CHECK (LENGTH(account_number) BETWEEN 6 AND 20);
ALTER TABLE documents ADD CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 104857600); -- 100MB max

COMMENT ON TABLE users IS 'משתמשי המערכת עם פרטי התחברות והרשאות';
COMMENT ON TABLE employees IS 'רשומות עובדים עם כל הפרטים האישיים והתעסוקתיים';
COMMENT ON TABLE bank_accounts IS 'פרטי חשבונות הבנק של העובדים';
COMMENT ON TABLE documents IS 'מטאדאטה של מסמכים שהועלו למערכת';
COMMENT ON TABLE document_types IS 'סוגי המסמכים הנתמכים במערכת';
COMMENT ON TABLE audit_logs IS 'לוג פעילות למעקב אחר שינויים במערכת';
COMMENT ON TABLE notifications IS 'התראות למשתמשי המערכת';