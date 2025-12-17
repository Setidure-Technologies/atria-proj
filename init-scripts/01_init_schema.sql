-- ATRIA 360 Database Schema
-- This schema supports both psychometric tests and adaptive assessments

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255), -- nullable for invite-only + magic links
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional student information from StudentInfo.tsx
    date_of_birth DATE,
    institution VARCHAR(255),
    board_of_study VARCHAR(100),
    parent_name VARCHAR(255),
    parent_occupation VARCHAR(255),
    annual_income VARCHAR(100),
    full_address TEXT,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_address TEXT,
    
    -- Academic Information
    tenth_grade JSONB, -- {mathematics, physics, chemistry, biology}
    eleventh_grade JSONB, -- {mathematics, physics, chemistry, biology}
    
    -- Extracurricular
    extracurricular JSONB, -- {sports, leadership, cultural, academic, technology}
    
    -- Interests
    interests JSONB, -- {aiMlDataScience, energySustainability, etc.}
    
    -- Declaration
    signature VARCHAR(255),
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create index on email for fast lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Administrator with full access'),
    ('CANDIDATE', 'Test taker with limited access')
ON CONFLICT (name) DO NOTHING;

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('psychometric', 'adaptive', 'custom')),
    config_json JSONB, -- stores test definition/config
    duration_minutes INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tests_type ON tests(type);
CREATE INDEX idx_tests_is_active ON tests(is_active);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'started', 'submitted', 'expired', 'cancelled')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    attempt_token_hash VARCHAR(255), -- secure token for accessing test
    link_sent_at TIMESTAMP WITH TIME ZONE,
    assigned_by UUID REFERENCES users(id),
    
    UNIQUE (test_id, user_id) -- One assignment per user per test
);

CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_test_id ON assignments(test_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_token_hash ON assignments(attempt_token_hash);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    responses_json JSONB NOT NULL, -- raw answers payload
    score_json JSONB, -- calculated scores
    
    -- Psychometric test specific fields (for backward compatibility)
    executing_score DECIMAL(5, 2),
    influencing_score DECIMAL(5, 2),
    relationship_building_score DECIMAL(5, 2),
    strategic_thinking_score DECIMAL(5, 2),
    primary_talent_domain VARCHAR(100),
    detailed_scores JSONB, -- subdomain scores
    
    -- Test metadata
    test_start_time TIMESTAMP WITH TIME ZONE,
    test_completion_time TIMESTAMP WITH TIME ZONE,
    test_violations JSONB, -- array of violation messages
    is_auto_submit BOOLEAN DEFAULT FALSE,
    questions_answered INTEGER,
    
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (assignment_id) -- One response per assignment
);

CREATE INDEX idx_responses_assignment_id ON responses(assignment_id);
CREATE INDEX idx_responses_submitted_at ON responses(submitted_at);

-- Invitations table (for admin-created user onboarding)
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    user_id UUID REFERENCES users(id) -- set when invitation is used
);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token_hash ON invitations(token_hash);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

-- Audit logs (admin actions)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- e.g., 'user_created', 'test_allotted', 'link_resent'
    entity_type VARCHAR(50), -- e.g., 'user', 'test', 'assignment'
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- EMAIL QUEUE TABLE (for async email sending)
-- ============================================

CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    template_name VARCHAR(100),
    template_data JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled_at ON email_queue(scheduled_at);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CREATE DEFAULT ADMIN USER
-- ============================================

-- Default password is 'admin123' - CHANGE THIS IN PRODUCTION!
-- Password hash generated using bcrypt with salt rounds = 10
INSERT INTO users (email, name, password_hash, status)
VALUES (
    'admin@atria360.com',
    'ATRIA Administrator',
    '$2b$10$rX8VqyKWYxGgZJ0oVZpFqOY1H0qG7xK6Q3ZpQdY.nF8x9wL2KqHLK', -- admin123
    'active'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Assign ADMIN role to default admin
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@atria360.com' AND r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- ============================================
-- CREATE DEFAULT TEST
-- ============================================

INSERT INTO tests (title, description, type, duration_minutes, is_active)
VALUES (
    'Strength 360 - Psychometric Assessment',
    'A comprehensive psychometric test to identify your primary talent domain: Executing, Influencing, Relationship Building, or Strategic Thinking.',
    'psychometric',
    20,
    TRUE
)
ON CONFLICT DO NOTHING;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for user with roles
CREATE OR REPLACE VIEW user_roles_view AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.status,
    ARRAY_AGG(r.name) AS roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email, u.name, u.status;

-- View for assignment status with user and test details
CREATE OR REPLACE VIEW assignment_details_view AS
SELECT 
    a.id AS assignment_id,
    a.status AS assignment_status,
    a.assigned_at,
    a.due_at,
    a.started_at,
    a.submitted_at,
    u.id AS user_id,
    u.email AS user_email,
    u.name AS user_name,
    t.id AS test_id,
    t.title AS test_title,
    t.type AS test_type,
    t.duration_minutes,
    r.id AS response_id,
    r.primary_talent_domain,
    r.score_json
FROM assignments a
JOIN users u ON a.user_id = u.id
JOIN tests t ON a.test_id = t.id
LEFT JOIN responses r ON a.id = r.assignment_id;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to the atria_admin user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO atria_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO atria_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO atria_admin;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Stores all user accounts (both admins and candidates)';
COMMENT ON TABLE roles IS 'Defines system roles (ADMIN, CANDIDATE)';
COMMENT ON TABLE tests IS 'Stores test definitions and configurations';
COMMENT ON TABLE assignments IS 'Tracks which users are assigned which tests';
COMMENT ON TABLE responses IS 'Stores test responses and scores';
COMMENT ON TABLE invitations IS 'Manages user invitation tokens for onboarding';
COMMENT ON TABLE audit_logs IS 'Tracks all administrative actions for security and compliance';
COMMENT ON TABLE email_queue IS 'Queue for asynchronous email sending';
