-- Migration: 005_seed_default_data.sql
-- Description: Insert default system data (roles, permissions, demo tenant)
-- Created: 2026-10-05

-- Insert demo tenant for development
INSERT INTO tenants (id, name, subdomain, status, config, metadata)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo Company',
    'demo',
    'trial',
    '{
        "quotas": {
            "maxUsers": 100,
            "maxStorageGb": 50,
            "maxApiCallsPerMonth": 1000000
        },
        "features": {
            "aiAssistant": true,
            "knowledgeBase": true,
            "advancedAnalytics": false
        }
    }',
    '{
        "industry": "Technology",
        "contactEmail": "demo@example.com"
    }'
) ON CONFLICT (id) DO NOTHING;

-- Insert system roles for demo tenant
INSERT INTO roles (id, tenant_id, name, description, permissions, is_system)
VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Super Admin',
        'Full system access with all permissions',
        ARRAY[
            'users:create', 'users:read', 'users:update', 'users:delete',
            'roles:create', 'roles:read', 'roles:update', 'roles:delete',
            'organizations:create', 'organizations:read', 'organizations:update', 'organizations:delete',
            'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
            'knowledge:create', 'knowledge:read', 'knowledge:update', 'knowledge:delete',
            'settings:read', 'settings:update',
            'audit:read'
        ],
        true
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        'Manager',
        'Department/team manager with limited administrative access',
        ARRAY[
            'users:read',
            'organizations:read', 'organizations:update',
            'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
            'knowledge:create', 'knowledge:read', 'knowledge:update'
        ],
        true
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000001',
        'Employee',
        'Standard employee with basic access',
        ARRAY[
            'users:read',
            'organizations:read',
            'tasks:create', 'tasks:read', 'tasks:update',
            'knowledge:read'
        ],
        true
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000001',
        'Guest',
        'Read-only guest access',
        ARRAY[
            'organizations:read',
            'tasks:read',
            'knowledge:read'
        ],
        true
    )
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Insert permission definitions
INSERT INTO permissions (tenant_id, resource, action, description, is_system)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'users', 'create', 'Create new users', true),
    ('00000000-0000-0000-0000-000000000001', 'users', 'read', 'View user information', true),
    ('00000000-0000-0000-0000-000000000001', 'users', 'update', 'Update user information', true),
    ('00000000-0000-0000-0000-000000000001', 'users', 'delete', 'Delete users', true),
    ('00000000-0000-0000-0000-000000000001', 'roles', 'create', 'Create new roles', true),
    ('00000000-0000-0000-0000-000000000001', 'roles', 'read', 'View roles', true),
    ('00000000-0000-0000-0000-000000000001', 'roles', 'update', 'Update roles', true),
    ('00000000-0000-0000-0000-000000000001', 'roles', 'delete', 'Delete roles', true),
    ('00000000-0000-0000-0000-000000000001', 'organizations', 'create', 'Create organizations', true),
    ('00000000-0000-0000-0000-000000000001', 'organizations', 'read', 'View organizations', true),
    ('00000000-0000-0000-0000-000000000001', 'organizations', 'update', 'Update organizations', true),
    ('00000000-0000-0000-0000-000000000001', 'organizations', 'delete', 'Delete organizations', true),
    ('00000000-0000-0000-0000-000000000001', 'tasks', 'create', 'Create tasks', true),
    ('00000000-0000-0000-0000-000000000001', 'tasks', 'read', 'View tasks', true),
    ('00000000-0000-0000-0000-000000000001', 'tasks', 'update', 'Update tasks', true),
    ('00000000-0000-0000-0000-000000000001', 'tasks', 'delete', 'Delete tasks', true),
    ('00000000-0000-0000-0000-000000000001', 'knowledge', 'create', 'Create knowledge base entries', true),
    ('00000000-0000-0000-0000-000000000001', 'knowledge', 'read', 'View knowledge base', true),
    ('00000000-0000-0000-0000-000000000001', 'knowledge', 'update', 'Update knowledge base', true),
    ('00000000-0000-0000-0000-000000000001', 'knowledge', 'delete', 'Delete knowledge base entries', true),
    ('00000000-0000-0000-0000-000000000001', 'settings', 'read', 'View settings', true),
    ('00000000-0000-0000-0000-000000000001', 'settings', 'update', 'Update settings', true),
    ('00000000-0000-0000-0000-000000000001', 'audit', 'read', 'View audit logs', true)
ON CONFLICT (tenant_id, resource, action) DO NOTHING;

-- Insert demo admin user (password: admin123)
-- bcrypt hash for "admin123" with cost 12
INSERT INTO users (id, tenant_id, username, email, password_hash, display_name, status, email_verified_at)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'admin@demo.example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eplhFpvz6V6G',
    'Demo Admin',
    'active',
    NOW()
) ON CONFLICT (tenant_id, username) DO NOTHING;

-- Assign Super Admin role to demo admin
INSERT INTO user_roles (user_id, role_id, granted_by)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    NULL
) ON CONFLICT (user_id, role_id) DO NOTHING;

-- Create root organization for demo tenant
INSERT INTO organizations (id, tenant_id, parent_id, name, type, description, manager_id)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'Demo Company',
    'company',
    'Demo organization for testing',
    '20000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- Create demo departments
INSERT INTO organizations (id, tenant_id, parent_id, name, type, description)
VALUES
    (
        '30000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        'Engineering',
        'department',
        'Engineering department'
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        'Product',
        'department',
        'Product department'
    ),
    (
        '30000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        'Marketing',
        'department',
        'Marketing department'
    )
ON CONFLICT DO NOTHING;

-- Add admin to root organization
INSERT INTO organization_members (organization_id, user_id, position)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'CEO'
) ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Add comments
COMMENT ON COLUMN users.password_hash IS 'Demo password: admin123 (bcrypt cost=12)';
