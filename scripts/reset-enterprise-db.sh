#!/bin/bash
# reset-enterprise-db.sh
# Reset the enterprise database (drop all tables and re-run migrations)

set -e

echo "🔄 DeepSeek Harness Enterprise - Database Reset"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker ps | grep dsh-enterprise-postgres > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL container is not running. Run ./scripts/setup-enterprise-env.sh first.${NC}"
    exit 1
fi

# Confirm reset
echo -e "${YELLOW}⚠️  WARNING: This will DELETE ALL DATA in the enterprise database!${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${GREEN}✓ Reset cancelled${NC}"
    exit 0
fi

# Drop all tables and schemas
echo ""
echo "🗑️  Dropping all tables and tenant schemas..."

docker exec -i dsh-enterprise-postgres psql -U dsh_admin -d dsh_enterprise <<-EOSQL
    -- Drop all tenant schemas
    DO \$\$
    DECLARE
        schema_name text;
    BEGIN
        FOR schema_name IN
            SELECT nspname
            FROM pg_namespace
            WHERE nspname LIKE 'tenant_%'
        LOOP
            EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
        END LOOP;
    END \$\$;

    -- Drop all tables in public schema
    DROP TABLE IF EXISTS organization_members CASCADE;
    DROP TABLE IF EXISTS organization_paths CASCADE;
    DROP TABLE IF EXISTS organizations CASCADE;
    DROP TABLE IF EXISTS permissions CASCADE;
    DROP TABLE IF EXISTS user_roles CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS tenants CASCADE;

    -- Drop all functions
    DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    DROP FUNCTION IF EXISTS create_tenant_schema CASCADE;
    DROP FUNCTION IF EXISTS drop_tenant_schema CASCADE;
    DROP FUNCTION IF EXISTS auto_create_tenant_schema CASCADE;
    DROP FUNCTION IF EXISTS maintain_organization_paths_insert CASCADE;
    DROP FUNCTION IF EXISTS maintain_organization_paths_update CASCADE;
    DROP FUNCTION IF EXISTS user_has_permission CASCADE;
    DROP FUNCTION IF EXISTS get_organization_subtree CASCADE;
    DROP FUNCTION IF EXISTS get_organization_ancestors CASCADE;

    -- Drop all types
    DROP TYPE IF EXISTS tenant_status CASCADE;
    DROP TYPE IF EXISTS user_status CASCADE;
    DROP TYPE IF EXISTS organization_type CASCADE;

    -- Drop UUID extension (will be recreated)
    DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
EOSQL

echo -e "${GREEN}✓ All tables and schemas dropped${NC}"

# Re-run migrations
echo ""
echo "🔄 Re-running migrations..."

# Run migration scripts in order
for migration in packages/enterprise/migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "   Running: $(basename $migration)"
        docker exec -i dsh-enterprise-postgres psql -U dsh_admin -d dsh_enterprise < "$migration"
    fi
done

echo -e "${GREEN}✓ All migrations applied${NC}"

# Verify tables were created
echo ""
echo "🔍 Verifying database schema..."
TABLES=$(docker exec dsh-enterprise-postgres psql -U dsh_admin -d dsh_enterprise -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" | xargs)

echo ""
echo "📋 Created tables:"
for table in $TABLES; do
    echo "   - $table"
done

# Check tenant schema
TENANT_SCHEMA=$(docker exec dsh-enterprise-postgres psql -U dsh_admin -d dsh_enterprise -t -c "SELECT nspname FROM pg_namespace WHERE nspname LIKE 'tenant_%' ORDER BY nspname LIMIT 1;" | xargs)

if [ -n "$TENANT_SCHEMA" ]; then
    echo ""
    echo "✓ Demo tenant schema created: $TENANT_SCHEMA"
fi

# Print demo credentials
echo ""
echo "=================================================="
echo -e "${GREEN}✅ Database reset complete!${NC}"
echo "=================================================="
echo ""
echo "🔐 Demo Credentials:"
echo "   Username: admin"
echo "   Email:    admin@demo.example.com"
echo "   Password: admin123"
echo ""
echo "📊 Database Stats:"
echo "   Tables:  $(echo $TABLES | wc -w | xargs)"
echo "   Schemas: $(docker exec dsh-enterprise-postgres psql -U dsh_admin -d dsh_enterprise -t -c "SELECT COUNT(*) FROM pg_namespace WHERE nspname LIKE 'tenant_%';" | xargs)"
echo ""
