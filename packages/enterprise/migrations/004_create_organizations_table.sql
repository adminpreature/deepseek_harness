-- Migration: 004_create_organizations_table.sql
-- Description: Create organization hierarchy tables with closure table pattern
-- Created: 2026-10-05

-- Create organization types enum
CREATE TYPE organization_type AS ENUM ('company', 'department', 'team', 'group');

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type organization_type NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT organizations_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Create organization closure table for efficient tree queries
CREATE TABLE organization_paths (
    ancestor_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    descendant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    depth INTEGER NOT NULL,

    -- Constraints
    PRIMARY KEY (ancestor_id, descendant_id),
    CONSTRAINT organization_paths_depth_non_negative CHECK (depth >= 0)
);

-- Create organization members table
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(100),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT org_members_org_user_unique UNIQUE (organization_id, user_id)
);

-- Create indexes
CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX idx_organizations_manager_id ON organizations(manager_id);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organization_paths_ancestor ON organization_paths(ancestor_id);
CREATE INDEX idx_organization_paths_descendant ON organization_paths(descendant_id);
CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);

-- Create trigger for updated_at
CREATE TRIGGER organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger function to maintain closure table on insert
CREATE OR REPLACE FUNCTION maintain_organization_paths_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert self-reference (depth 0)
    INSERT INTO organization_paths (ancestor_id, descendant_id, depth)
    VALUES (NEW.id, NEW.id, 0);

    -- Insert paths through parent
    IF NEW.parent_id IS NOT NULL THEN
        INSERT INTO organization_paths (ancestor_id, descendant_id, depth)
        SELECT ancestor_id, NEW.id, depth + 1
        FROM organization_paths
        WHERE descendant_id = NEW.parent_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to maintain closure table on update
CREATE OR REPLACE FUNCTION maintain_organization_paths_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
        -- Remove old paths (except self-reference)
        DELETE FROM organization_paths
        WHERE descendant_id IN (
            SELECT descendant_id FROM organization_paths WHERE ancestor_id = NEW.id
        )
        AND ancestor_id IN (
            SELECT ancestor_id FROM organization_paths WHERE descendant_id = OLD.id AND depth > 0
        );

        -- Add new paths through new parent
        IF NEW.parent_id IS NOT NULL THEN
            INSERT INTO organization_paths (ancestor_id, descendant_id, depth)
            SELECT p1.ancestor_id, p2.descendant_id, p1.depth + p2.depth + 1
            FROM organization_paths p1
            CROSS JOIN organization_paths p2
            WHERE p1.descendant_id = NEW.parent_id
              AND p2.ancestor_id = NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER organizations_paths_insert
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION maintain_organization_paths_insert();

CREATE TRIGGER organizations_paths_update
    AFTER UPDATE ON organizations
    FOR EACH ROW
    WHEN (OLD.parent_id IS DISTINCT FROM NEW.parent_id)
    EXECUTE FUNCTION maintain_organization_paths_update();

-- Helper function to get organization subtree
CREATE OR REPLACE FUNCTION get_organization_subtree(org_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    type organization_type,
    depth INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.name, o.type, op.depth
    FROM organizations o
    JOIN organization_paths op ON o.id = op.descendant_id
    WHERE op.ancestor_id = org_id
    ORDER BY op.depth, o.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get organization ancestors
CREATE OR REPLACE FUNCTION get_organization_ancestors(org_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    type organization_type,
    depth INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.name, o.type, op.depth
    FROM organizations o
    JOIN organization_paths op ON o.id = op.ancestor_id
    WHERE op.descendant_id = org_id AND op.depth > 0
    ORDER BY op.depth DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments
COMMENT ON TABLE organizations IS 'Organization hierarchy (company → department → team)';
COMMENT ON TABLE organization_paths IS 'Closure table for efficient tree queries';
COMMENT ON TABLE organization_members IS 'User membership in organizations';
COMMENT ON COLUMN organization_paths.depth IS '0 = self, 1 = direct child, 2 = grandchild, etc.';
