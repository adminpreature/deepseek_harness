#!/bin/bash
# setup-enterprise-env.sh
# Quick setup script for DeepSeek Harness Enterprise development environment

set -e

echo "🚀 DeepSeek Harness Enterprise - Environment Setup"
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

echo -e "${GREEN}✓ Docker is running${NC}"

# Check if docker-compose exists
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose not found. Please install Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ docker-compose found${NC}"

# Check if .env.enterprise.local exists
if [ ! -f .env.enterprise.local ]; then
    echo -e "${YELLOW}⚠️  .env.enterprise.local not found, creating from example...${NC}"
    cp .env.enterprise.example .env.enterprise.local

    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)

    # Update secrets in .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|g" .env.enterprise.local
        sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}|g" .env.enterprise.local
    else
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|g" .env.enterprise.local
        sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}|g" .env.enterprise.local
    fi

    echo -e "${GREEN}✓ Created .env.enterprise.local with random JWT secrets${NC}"
else
    echo -e "${GREEN}✓ .env.enterprise.local already exists${NC}"
fi

# Load environment variables
export $(grep -v '^#' .env.enterprise.local | xargs)

# Start Docker Compose services
echo ""
echo "📦 Starting Docker services (PostgreSQL + Redis + pgAdmin)..."
docker-compose -f docker-compose.enterprise.yml up -d

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
RETRIES=30
until docker exec dsh-enterprise-postgres pg_isready -U dsh_admin -d dsh_enterprise > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    echo -n "."
    sleep 1
    RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -eq 0 ]; then
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Wait for Redis to be ready
echo ""
echo "⏳ Waiting for Redis to be ready..."
RETRIES=30
until docker exec dsh-enterprise-redis redis-cli ping > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    echo -n "."
    sleep 1
    RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -eq 0 ]; then
    echo -e "${RED}❌ Redis failed to start${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Redis is ready${NC}"

# Check if migrations have already been applied
echo ""
echo "🔍 Checking database schema..."
TABLES_COUNT=$(docker exec dsh-enterprise-postgres psql -U dsh_admin -d dsh_enterprise -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" 2>/dev/null | xargs || echo "0")

if [ "$TABLES_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Database already initialized (found $TABLES_COUNT tables)${NC}"
    echo -e "${YELLOW}   Skipping migrations. To reset, run: ./scripts/reset-enterprise-db.sh${NC}"
else
    echo -e "${GREEN}✓ Database is empty, migrations will be applied on first startup${NC}"
fi

# Print connection info
echo ""
echo "=================================================="
echo -e "${GREEN}✅ Setup complete!${NC}"
echo "=================================================="
echo ""
echo "📊 Service URLs:"
echo "   PostgreSQL:  localhost:5432"
echo "   Redis:       localhost:6379"
echo "   pgAdmin:     http://localhost:5050"
echo ""
echo "🔐 Default Credentials:"
echo "   Database:    dsh_admin / ${DB_PASSWORD}"
echo "   pgAdmin:     ${PGADMIN_EMAIL} / ${PGADMIN_PASSWORD}"
echo "   Demo User:   admin@demo.example.com / admin123"
echo ""
echo "📝 Next Steps:"
echo "   1. Install dependencies:  pnpm install"
echo "   2. Build packages:        pnpm run build"
echo "   3. Run tests:             pnpm run test"
echo "   4. Start dev server:      pnpm run dev:desktop"
echo ""
echo "🛠️  Useful Commands:"
echo "   View logs:     docker-compose -f docker-compose.enterprise.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.enterprise.yml down"
echo "   Reset DB:      ./scripts/reset-enterprise-db.sh"
echo ""
