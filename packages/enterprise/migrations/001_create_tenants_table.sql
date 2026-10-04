-- Migration: 001_create_tenants_table.sql
-- Description: Create tenants table for multi-tenant infrastructure
-- Created: 2026-10-05

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'trial', 'archived');

-- Create tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    status tenant_status NOT NULL DEFAULT 'active',
    config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT tenants_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT tenants_subdomain_format CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
    CONSTRAINT tenants_subdomain_length CHECK (length(subdomain) >= 3)
);

-- Create indexes
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);
CREATE INDEX idx_tenants_config ON tenants USING gin(config);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to create tenant schema
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id UUID)
RETURNS void AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Generate schema name: tenant_<uuid without hyphens>
    schema_name := 'tenant_' || replace(tenant_id::text, '-', '');

    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

    -- Grant permissions
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO dsh_admin', schema_name);
    EXECUTE format('GRANT CREATE ON SCHEMA %I TO dsh_admin', schema_name);
END;
$$ LANGUAGE plpgsql;

-- Create function to drop tenant schema
CREATE OR REPLACE FUNCTION drop_tenant_schema(tenant_id UUID)
RETURNS void AS $$
DECLARE
    schema_name TEXT;
BEGIN
    schema_name := 'tenant_' || replace(tenant_id::text, '-', '');
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create schema on tenant insert
CREATE OR REPLACE FUNCTION auto_create_tenant_schema()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_tenant_schema(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_auto_create_schema
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_tenant_schema();

-- Add comments
COMMENT ON TABLE tenants IS 'Multi-tenant root table - each tenant gets an isolated schema';
COMMENT ON COLUMN tenants.id IS 'Unique tenant identifier (UUID v4)';
COMMENT ON COLUMN tenants.subdomain IS 'URL-safe subdomain identifier (3-63 chars, lowercase alphanumeric + hyphens)';
COMMENT ON COLUMN tenants.config IS 'Tenant-specific configuration (quotas, features, etc.)';
COMMENT ON COLUMN tenants.metadata IS 'Additional metadata (billing info, contact, etc.)';
