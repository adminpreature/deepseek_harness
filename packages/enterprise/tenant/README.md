# @deepseek-ai/dsh-tenant

Multi-tenant infrastructure plugin for DeepSeek Harness Enterprise.

## Purpose

Provides the foundational multi-tenant capabilities:
- Database connection pool with automatic tenant context injection
- Tenant registration, configuration, and management
- Resource quota tracking and enforcement
- PostgreSQL Row Level Security for data isolation
- Redis-based caching (optional)

## Installation

```bash
pnpm add @deepseek-ai/dsh-tenant
```

## Configuration

```yaml
plugins:
  '@deepseek-ai/dsh-tenant':
    database:
      host: localhost
      port: 5432
      database: dsh_enterprise
      user: postgres
      password: ${DB_PASSWORD}  # Read from environment
      ssl: false
      maxConnections: 20
    
    redis:
      host: localhost
      port: 6379
      password: ${REDIS_PASSWORD}
      db: 0
    
    defaultQuotas:
      maxUsers: 50
      maxStorageGb: 10
      maxApiCallsPerMonth: 100000
```

## Usage

### Basic Service Access

```typescript
import { Context } from '@deepseek-ai/cordis';

ctx.inject(['tenant'], async ({ tenant }) => {
  // Create a new tenant
  const newTenant = await tenant.create({
    name: 'Acme Corporation',
    slug: 'acme-corp',
    plan: 'pro',
  });

  // Get tenant by ID
  const tenant = await tenant.getById(newTenant.id);

  // Get tenant by slug
  const tenant = await tenant.getBySlug('acme-corp');

  // Update tenant
  await tenant.update(tenant.id, {
    logoUrl: 'https://example.com/logo.png',
    primaryColor: '#FF5733',
  });
});
```

### Tenant Context

All operations within a tenant context are automatically scoped:

```typescript
await ctx.tenant.withContext(tenantId, async () => {
  // All database queries here are automatically filtered by tenant_id
  const users = await ctx.db.query('SELECT * FROM users');
  // Returns only users for this tenant
});
```

### Manual Context Management

```typescript
// Set tenant context
await ctx.tenant.setContext(tenantId);

// Execute operations...
const users = await ctx.db.query('SELECT * FROM users WHERE deleted_at IS NULL');

// Context persists until cleared or scope ends
```

### Resource Quota Checking

```typescript
// Check if tenant has reached user limit
const exceeded = await ctx.tenant.isQuotaExceeded(tenantId, 'users');
if (exceeded) {
  throw new Error('User quota exceeded');
}

// Get detailed usage statistics
const usage = await ctx.tenant.getUsage(tenantId);
console.log(`Users: ${usage.currentUsers}/${tenant.maxUsers}`);
console.log(`Storage: ${usage.currentStorageGb}GB/${tenant.maxStorageGb}GB`);
console.log(`API calls this month: ${usage.apiCallsThisMonth}`);
```

## Events

The plugin emits events for tenant lifecycle operations:

```typescript
ctx.on('tenant/created', (tenant) => {
  console.log(`New tenant: ${tenant.name}`);
});

ctx.on('tenant/updated', (tenant) => {
  console.log(`Updated tenant: ${tenant.id}`);
});

ctx.on('tenant/deleted', (tenantId) => {
  console.log(`Deleted tenant: ${tenantId}`);
});

ctx.on('tenant/context-set', (context) => {
  console.log(`Tenant context set: ${context.tenantId}`);
});
```

## Database Schema

The plugin requires these tables:

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255) UNIQUE,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1890ff',
  secondary_color VARCHAR(7) DEFAULT '#52c41a',
  config JSONB DEFAULT '{}',
  max_users INTEGER DEFAULT 50,
  max_storage_gb INTEGER DEFAULT 10,
  max_api_calls_per_month INTEGER DEFAULT 100000,
  plan VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
```

Run migrations: `pnpm run migrate:enterprise`

## Security

### Row Level Security

All tenant-scoped tables use PostgreSQL RLS:

```sql
-- Example: users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

The plugin automatically sets the `app.current_tenant` session variable when context is established.

### Data Isolation

- All queries are automatically scoped by `tenant_id`
- Cross-tenant data access is prevented at the database level
- Tenant context is managed via `AsyncLocalStorage` for thread safety

## Extension Points

### Custom Tenant Configuration

Store custom configuration in the `config` JSONB field:

```typescript
await ctx.tenant.create({
  name: 'Acme Corp',
  slug: 'acme',
  config: {
    features: ['advanced-analytics', 'sso'],
    integrations: {
      crm: { provider: 'salesforce', apiKey: '...' },
    },
  },
});
```

### Tenant Events Integration

Listen to tenant events to trigger custom workflows:

```typescript
ctx.on('tenant/created', async (tenant) => {
  // Send welcome email
  await sendWelcomeEmail(tenant);
  
  // Create default admin user
  await ctx.user.create({
    tenantId: tenant.id,
    username: 'admin',
    email: 'admin@' + tenant.slug + '.example.com',
    role: 'admin',
  });
});
```

## Known Limitations and Deferred Work

### Current Limitations

- **Single-region deployment only**: Multi-region replication not supported
- **No read replicas**: All queries go to primary database
- **No connection pooling per tenant**: Shared pool for all tenants
- **Basic quota enforcement**: No rate limiting or throttling
- **Synchronous context switching**: Async context propagation in nested calls may not work as expected

### Deferred Features

- **Multi-region support**: Deploy tenants across regions with data sovereignty
- **Tenant-specific database sharding**: Very large tenants get dedicated instances
- **Advanced quota management**: Grace periods, soft limits, automatic upgrades
- **Tenant analytics**: Usage patterns, cost attribution, health metrics
- **Automated backups per tenant**: Point-in-time recovery per tenant
- **Tenant migration tools**: Move tenants between infrastructure tiers

## Performance Considerations

- Database connection pool shared across all tenants (configurable via `maxConnections`)
- Redis caching recommended for high-traffic deployments
- PostgreSQL RLS has minimal overhead (<5%) for properly indexed queries
- Consider increasing `max_connections` for deployments with >100 tenants

## Testing

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Integration tests (requires test database)
pnpm test:integration
```

Test database setup:

```sql
CREATE DATABASE dsh_enterprise_test;
```

## Dependencies

### Required
- `pg` (^8.11.3) - PostgreSQL client
- `ioredis` (^5.3.2) - Redis client

### Peer Dependencies
- `@deepseek-ai/cordis` - Plugin system
- `@deepseek-ai/dsh-core` - Core agent API

## License

MIT
