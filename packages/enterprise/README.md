# Enterprise Package Group

## Purpose

The enterprise group provides organizational management, multi-tenancy, and team collaboration capabilities for the DeepSeek Harness, transforming it from a personal agent tool into an enterprise-grade AI collaboration platform.

## Packages

| Package | Purpose | Status |
|---------|---------|--------|
| `@deepseek-ai/dsh-tenant` | Multi-tenant infrastructure: tenant isolation, context injection, resource quotas | ⚙️ Planning |
| `@deepseek-ai/dsh-user` | User authentication, authorization, and RBAC | ⚙️ Planning |
| `@deepseek-ai/dsh-organization` | Organization hierarchy (departments, teams) and member management | ⚙️ Planning |
| `@deepseek-ai/dsh-task-management` | Enhanced task system with collaboration, assignment, and dependencies | ⚙️ Planning |
| `@deepseek-ai/dsh-ai-assistant` | Full-featured AI assistant with role awareness and context | ⚙️ Planning |
| `@deepseek-ai/dsh-knowledge-base` | Enterprise knowledge repository with RAG and permission control | ⚙️ Planning |

## Architecture

### Multi-Tenancy Model

All enterprise packages follow strict tenant isolation:
- Every database query includes `tenant_id` filter
- PostgreSQL Row Level Security enforces data isolation
- Session context automatically carries tenant information

### Service Layer

Each package exposes:
1. **Service Definition** - Abstract interface (e.g., `UserService`)
2. **Service Provider** - Concrete implementation
3. **Model-Facing Tools** - Optional tools for agent interaction

### Database Access

Enterprise packages share a common database connection pool managed by `dsh-tenant`. All queries use the centralized tenant-aware query builder.

## Dependencies

### Peer Dependencies
- `@deepseek-ai/cordis` - Plugin system
- `@deepseek-ai/dsh-core` - Session and agent API
- `@deepseek-ai/dsh-storage` - Persistence layer

### Internal Dependencies
```
dsh-tenant (base)
  ↓
dsh-user
  ↓
dsh-organization
  ↓
dsh-task-management, dsh-ai-assistant, dsh-knowledge-base
```

## Configuration

Enterprise plugins load from `cordis.yml`:

```yaml
plugins:
  '@deepseek-ai/dsh-tenant':
    database:
      host: localhost
      port: 5432
      database: dsh_enterprise
      user: dsh_user
      password: ${DB_PASSWORD}  # from env
    redis:
      host: localhost
      port: 6379
  
  '@deepseek-ai/dsh-user':
    jwt:
      secret: ${JWT_SECRET}
      expiresIn: 7d
    passwordPolicy:
      minLength: 8
      requireSpecialChar: true
  
  '@deepseek-ai/dsh-organization':
    maxDepth: 5  # Maximum organization tree depth
  
  '@deepseek-ai/dsh-task-management':
    defaultPriority: medium
    autoCompleteParentTask: true
  
  '@deepseek-ai/dsh-knowledge-base':
    vectorDatabase:
      provider: pinecone  # or milvus
      apiKey: ${PINECONE_API_KEY}
      environment: us-east-1
    chunkSize: 1000
    chunkOverlap: 200
```

## Testing

Each package includes:
- Unit tests for services and utilities
- Integration tests against test database
- Tenant isolation tests
- Permission enforcement tests

## Migration

Database migrations live in `packages/enterprise/migrations/`:
```
migrations/
  001_create_base_tables.sql
  002_create_business_tables.sql
  003_create_functions_triggers.sql
```

Run migrations: `pnpm run migrate:enterprise`

## Security

### Tenant Isolation
- All queries automatically filtered by `tenant_id`
- PostgreSQL RLS as defense-in-depth
- Automated tests verify cross-tenant data leakage

### Authentication
- JWT tokens with configurable expiration
- Refresh token rotation
- Optional OAuth integration (Phase 2)

### Authorization
- RBAC with three default roles: Admin, Manager, Member
- Fine-grained permissions on resources (user, task, document)
- Scope-based access control (own, team, all)

## Extension Points

### Custom Roles
```typescript
import { RoleService } from '@deepseek-ai/dsh-user';

ctx.inject(['user'], ({ user }) => {
  user.roles.register({
    name: 'sales-manager',
    displayName: 'Sales Manager',
    permissions: [
      { resource: 'task', action: '*', scope: 'team' },
      { resource: 'document', action: 'read', scope: 'all' }
    ]
  });
});
```

### Custom AI Tools
```typescript
import { AIAssistantService } from '@deepseek-ai/dsh-ai-assistant';

ctx.inject(['ai-assistant'], ({ aiAssistant }) => {
  aiAssistant.tools.register({
    name: 'query_crm',
    description: 'Query customer data from CRM',
    inputSchema: { /* ... */ },
    handler: async (input, context) => {
      // Custom tool implementation
    }
  });
});
```

## Known Limitations and Deferred Work

### MVP Limitations
- No OAuth/SSO integration (password-only auth)
- No automated workflow engine (Phase 2)
- No real-time collaboration (Phase 2)
- Single region deployment only
- Basic audit logging (no compliance reports)

### Performance Considerations
- Initial implementation not optimized for >1000 users per tenant
- Knowledge base limited to 10GB per tenant
- No read replicas or sharding support

### Deferred Features
- Advanced analytics and reporting
- Mobile app support
- Internationalization (i18n)
- Custom branding per department
- SSO integration (SAML, OIDC)
- Data export and portability tools

## Development

### Setup
```bash
# Install dependencies
pnpm install

# Setup test database
pnpm run db:setup

# Run tests
pnpm run test

# Build
pnpm run build
```

### Adding a New Package

1. Create package directory: `packages/enterprise/<name>/`
2. Copy template from `packages/enterprise/_template/`
3. Update `packages/enterprise/README.md` (this file)
4. Add to workspace in root `package.json`
5. Write tests before implementation
6. Update migration scripts if needed

## References

- [Enterprise Architecture](../../docs/enterprise/architecture.md)
- [Database Schema](../../docs/enterprise/database-schema.md)
- [MVP Scope](../../docs/enterprise/mvp-scope-v2.md)
- [Capability Seams](../../.agents/notes/implemented/architecture/2026-06-13-capability-seams.md)
