-- Migration: 003_create_rbac_tables.sql
-- Description: Create Role-Based Access Control (RBAC) tables
-- Created: 2026-10-05

-- Create roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    is_system BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT roles_tenant_name_unique UNIQUE (tenant_id, name),
    CONSTRAINT roles_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Create user_roles table (many-to-many)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role_id)
);

-- Create permissions table (permission definitions)
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT permissions_tenant_resource_action_unique UNIQUE (tenant_id, resource, action)
);

-- Create indexes
CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX idx_roles_is_system ON roles(is_system);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_permissions_tenant_id ON permissions(tenant_id);
CREATE INDEX idx_permissions_resource ON permissions(resource);

-- Create triggers for updated_at
CREATE TRIGGER roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to check user permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_resource VARCHAR,
    p_action VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          AND (p_resource || ':' || p_action) = ANY(r.permissions)
    ) INTO has_perm;

    RETURN has_perm;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments
COMMENT ON TABLE roles IS 'Role definitions with permission arrays';
COMMENT ON TABLE user_roles IS 'User-role assignments with optional expiration';
COMMENT ON TABLE permissions IS 'Permission definitions for documentation and UI';
COMMENT ON COLUMN roles.permissions IS 'Array of permission strings in format "resource:action"';
COMMENT ON COLUMN roles.is_system IS 'System roles cannot be deleted';
