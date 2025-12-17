-- Simple fix: Ensure we have the Beyonders tests that match the existing App.jsx routes

-- Keep the existing tests but make sure they're properly configured
UPDATE tests SET is_active = TRUE WHERE id IN ('beyonders_science', 'beyonders_non_science');

-- Add a simple CSV bulk import table - just what we need
CREATE TABLE IF NOT EXISTS bulk_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'users' or 'assignments'
    filename VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    total_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    errors TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
