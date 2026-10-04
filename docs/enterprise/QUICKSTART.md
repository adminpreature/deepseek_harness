# DeepSeek Harness Enterprise - Quick Start Guide

## 🎯 Overview

This guide will help you set up the local development environment for DeepSeek Harness Enterprise features.

## 📋 Prerequisites

- **Node.js**: `^22.19.0` or `>=24.0.0`
- **pnpm**: `11.7.0`
- **Docker Desktop**: Latest version
- **Git**: Any recent version

## 🚀 Quick Setup (5 minutes)

### 1. Clone and Install

```bash
cd "/Volumes/数据盘/yiqi agentlite/deepseek-harness-upgrade-v0.1.6-alpha.2"
pnpm install
```

### 2. Start Database Services

```bash
# Run the setup script (macOS/Linux)
chmod +x scripts/setup-enterprise-env.sh
./scripts/setup-enterprise-env.sh

# Or manually with Docker Compose
docker-compose -f docker-compose.enterprise.yml up -d
```

This will start:
- ✅ PostgreSQL 16 (port 5432)
- ✅ Redis 7 (port 6379)
- ✅ pgAdmin 4 (port 5050)

### 3. Verify Setup

```bash
# Check if services are running
docker ps

# You should see 3 containers:
# - dsh-enterprise-postgres
# - dsh-enterprise-redis
# - dsh-enterprise-pgadmin
```

### 4. Build Packages

```bash
# Build all enterprise packages
pnpm run build

# Or build only enterprise packages
pnpm run build:lib
```

### 5. Run Tests

```bash
# Run unit tests
pnpm run test

# Run with coverage
pnpm run test:coverage
```

## 🔐 Default Credentials

### Database (PostgreSQL)
- **Host**: `localhost:5432`
- **Database**: `dsh_enterprise`
- **Username**: `dsh_admin`
- **Password**: `dsh_dev_password_change_me` (see `.env.enterprise.local`)

### Redis
- **Host**: `localhost:6379`
- **Password**: `dsh_redis_dev_password` (see `.env.enterprise.local`)

### pgAdmin (Database UI)
- **URL**: http://localhost:5050
- **Email**: `admin@localhost`
- **Password**: `admin`

### Demo Tenant User
- **Email**: `admin@demo.example.com`
- **Username**: `admin`
- **Password**: `admin123`
- **Tenant**: `demo` (subdomain)

## 📊 Database Schema

The setup script automatically creates:

### Core Tables
- `tenants` - Multi-tenant root table
- `users` - User accounts
- `roles` - RBAC roles
- `user_roles` - User-role assignments
- `permissions` - Permission definitions
- `organizations` - Organization hierarchy
- `organization_paths` - Closure table for tree queries
- `organization_members` - User-organization membership

### Demo Data
- 1 demo tenant (`demo`)
- 4 system roles (Super Admin, Manager, Employee, Guest)
- 1 admin user
- 1 root organization with 3 departments

## 🛠️ Useful Commands

### Docker Services

```bash
# Start services
docker-compose -f docker-compose.enterprise.yml up -d

# Stop services
docker-compose -f docker-compose.enterprise.yml down

# View logs
docker-compose -f docker-compose.enterprise.yml logs -f

# Restart a service
docker-compose -f docker-compose.enterprise.yml restart postgres
```

### Database Management

```bash
# Reset database (drops all data)
chmod +x scripts/reset-enterprise-db.sh
./scripts/reset-enterprise-db.sh

# Connect to PostgreSQL CLI
docker exec -it dsh-enterprise-postgres psql -U dsh_admin -d dsh_enterprise

# Run a specific migration
docker exec -i dsh-enterprise-postgres psql -U dsh_admin -d dsh_enterprise < packages/enterprise/migrations/001_create_tenants_table.sql
```

### Development

```bash
# Run specific package tests
pnpm --filter @deepseek-ai/dsh-tenant run test

# Watch mode for development
pnpm --filter @deepseek-ai/dsh-tenant run test -- --watch

# Typecheck
pnpm run typecheck

# Lint
pnpm run lint
```

## 📁 Project Structure

```
packages/enterprise/
├── tenant/              # ✅ Multi-tenant infrastructure
├── user/                # 🔄 User authentication (TODO)
├── organization/        # 🔄 Organization management (TODO)
├── task-management/     # 🔄 Task system (TODO)
├── ai-assistant/        # 🔄 AI features (TODO)
├── knowledge-base/      # 🔄 RAG knowledge base (TODO)
└── migrations/          # ✅ Database schema
    ├── 001_create_tenants_table.sql
    ├── 002_create_users_table.sql
    ├── 003_create_rbac_tables.sql
    ├── 004_create_organizations_table.sql
    └── 005_seed_default_data.sql

docs/enterprise/
├── mvp-scope-v2.md           # ✅ Product scope
├── database-schema.md        # ✅ Database design
└── plugin-skeleton-plan.md   # ✅ Implementation plan
```

## 🐛 Troubleshooting

### Docker not running
```bash
# Error: Cannot connect to Docker daemon
# Solution: Start Docker Desktop
open -a Docker
```

### Port already in use
```bash
# Error: Port 5432 already in use
# Solution: Stop other PostgreSQL instances
brew services stop postgresql
# Or change port in docker-compose.enterprise.yml
```

### Permission denied on scripts
```bash
# Error: Permission denied
# Solution: Make scripts executable
chmod +x scripts/setup-enterprise-env.sh
chmod +x scripts/reset-enterprise-db.sh
```

### Database connection failed
```bash
# Check if PostgreSQL is ready
docker exec dsh-enterprise-postgres pg_isready -U dsh_admin -d dsh_enterprise

# View PostgreSQL logs
docker logs dsh-enterprise-postgres
```

## 📚 Next Steps

1. **Implement dsh-user plugin** - User authentication and JWT
2. **Implement dsh-organization plugin** - Organization management
3. **Add API endpoints** - REST API for Web UI
4. **Add E2E tests** - Integration testing
5. **Build Web UI** - React components for enterprise features

## 🔗 Resources

- [Architecture Documentation](docs/architecture.md)
- [Database Schema Details](docs/enterprise/database-schema.md)
- [Plugin Development Guide](packages/CLAUDE.md)
- [Testing Policy](docs/testing.md)

## 💡 Tips

- Use **pgAdmin** (http://localhost:5050) to browse the database visually
- Check `packages/enterprise/tenant/` for a complete plugin example
- Follow the naming conventions in `packages/CLAUDE.md`
- Run `pnpm run doc-sync` before committing documentation changes

## 📧 Support

If you encounter issues:
1. Check Docker logs: `docker-compose -f docker-compose.enterprise.yml logs`
2. Verify environment variables in `.env.enterprise.local`
3. Reset the database: `./scripts/reset-enterprise-db.sh`
4. Check this README's troubleshooting section
