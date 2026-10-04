-- Migration: 002_create_users_table.sql
-- Description: Create users table with authentication support
-- Created: 2026-10-05

-- Create enum types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'locked', 'pending');

-- Create users table (in public schema, references tenants)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    status user_status NOT NULL DEFAULT 'pending',
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT users_tenant_username_unique UNIQUE (tenant_id, username),
    CONSTRAINT users_tenant_email_unique UNIQUE (tenant_id, email),
    CONSTRAINT users_username_not_empty CHECK (length(trim(username)) > 0),
    CONSTRAINT users_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT users_username_format CHECK (username ~ '^[a-zA-Z0-9_-]{3,32}$')
);

-- Create indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(tenant_id, email);
CREATE INDEX idx_users_username ON users(tenant_id, username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- Create trigger for updated_at
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE users IS 'User accounts across all tenants';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash (cost=12)';
COMMENT ON COLUMN users.metadata IS 'User preferences, settings, etc.';
