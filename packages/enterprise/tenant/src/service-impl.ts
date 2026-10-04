import { Context } from '@deepseek-ai/cordis';
import { TenantService } from './service.js';
import type { TenantConfig } from './index.js';
import type {
  Tenant,
  TenantId,
  CreateTenantInput,
  UpdateTenantInput,
  TenantContext,
  TenantUsage,
} from './types.js';
import { Pool, type PoolClient } from 'pg';
import Redis from 'ioredis';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Tenant service implementation
 */
export class TenantServiceImpl extends TenantService {
  public readonly db: Pool;
  public readonly redis?: Redis;
  private readonly storage = new AsyncLocalStorage<TenantContext>();

  constructor(ctx: Context, private config: TenantConfig) {
    super(ctx, 'tenant');

    // Initialize database connection pool
    this.db = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl,
      max: config.database.maxConnections || 20,
    });

    // Initialize Redis if configured
    if (config.redis) {
      this.redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db || 0,
      });
    }
  }

  async initialize(): Promise<void> {
    // Test database connection
    try {
      const client = await this.db.connect();
      await client.query('SELECT 1');
      client.release();
      this.ctx.logger.info('[tenant] Database connected');
    } catch (error) {
      this.ctx.logger.error('[tenant] Database connection failed:', error);
      throw error;
    }

    // Test Redis connection if configured
    if (this.redis) {
      try {
        await this.redis.ping();
        this.ctx.logger.info('[tenant] Redis connected');
      } catch (error) {
        this.ctx.logger.error('[tenant] Redis connection failed:', error);
        throw error;
      }
    }
  }

  getCurrentContext(): TenantContext | undefined {
    return this.storage.getStore();
  }

  async setContext(tenantId: TenantId): Promise<void> {
    const tenant = await this.getById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const context: TenantContext = { tenantId, tenant };

    // Set PostgreSQL session variable for Row Level Security
    await this.db.query('SELECT set_config($1, $2, false)', [
      'app.current_tenant',
      tenantId,
    ]);

    this.ctx.emit('tenant/context-set', context);
  }

  clearContext(): void {
    // Context is automatically cleared when AsyncLocalStorage scope ends
  }

  async withContext<T>(tenantId: TenantId, fn: () => Promise<T>): Promise<T> {
    const context: TenantContext = { tenantId };

    return this.storage.run(context, async () => {
      await this.setContext(tenantId);
      return fn();
    });
  }

  async create(input: CreateTenantInput): Promise<Tenant> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query<Tenant>(
        `INSERT INTO tenants (name, slug, domain, plan, config, max_users, max_storage_gb, max_api_calls_per_month)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          input.name,
          input.slug,
          input.domain || null,
          input.plan || 'free',
          JSON.stringify(input.config || {}),
          this.config.defaultQuotas?.maxUsers || 50,
          this.config.defaultQuotas?.maxStorageGb || 10,
          this.config.defaultQuotas?.maxApiCallsPerMonth || 100000,
        ]
      );

      const tenant = this.mapTenant(result.rows[0]);

      await client.query('COMMIT');

      this.ctx.emit('tenant/created', tenant);
      this.ctx.logger.info(`[tenant] Created tenant: ${tenant.id} (${tenant.name})`);

      return tenant;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getById(id: TenantId): Promise<Tenant | undefined> {
    const result = await this.db.query<Tenant>(
      'SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    return result.rows[0] ? this.mapTenant(result.rows[0]) : undefined;
  }

  async getBySlug(slug: string): Promise<Tenant | undefined> {
    const result = await this.db.query<Tenant>(
      'SELECT * FROM tenants WHERE slug = $1 AND deleted_at IS NULL',
      [slug]
    );

    return result.rows[0] ? this.mapTenant(result.rows[0]) : undefined;
  }

  async getByDomain(domain: string): Promise<Tenant | undefined> {
    const result = await this.db.query<Tenant>(
      'SELECT * FROM tenants WHERE domain = $1 AND deleted_at IS NULL',
      [domain]
    );

    return result.rows[0] ? this.mapTenant(result.rows[0]) : undefined;
  }

  async update(id: TenantId, input: UpdateTenantInput): Promise<Tenant> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        const columnName = this.camelToSnake(key);
        updates.push(`${columnName} = $${paramIndex}`);
        values.push(key === 'config' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      const tenant = await this.getById(id);
      if (!tenant) throw new Error(`Tenant not found: ${id}`);
      return tenant;
    }

    values.push(id);
    const result = await this.db.query<Tenant>(
      `UPDATE tenants SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error(`Tenant not found: ${id}`);
    }

    const tenant = this.mapTenant(result.rows[0]);
    this.ctx.emit('tenant/updated', tenant);
    this.ctx.logger.info(`[tenant] Updated tenant: ${tenant.id}`);

    return tenant;
  }

  async delete(id: TenantId): Promise<void> {
    const result = await this.db.query(
      'UPDATE tenants SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (result.rowCount === 0) {
      throw new Error(`Tenant not found: ${id}`);
    }

    this.ctx.emit('tenant/deleted', id);
    this.ctx.logger.info(`[tenant] Deleted tenant: ${id}`);
  }

  async getUsage(id: TenantId): Promise<TenantUsage> {
    const client = await this.db.connect();

    try {
      // Count users
      const usersResult = await client.query(
        'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND deleted_at IS NULL',
        [id]
      );
      const currentUsers = parseInt(usersResult.rows[0].count, 10);

      // Calculate storage (sum of document sizes)
      const storageResult = await client.query(
        'SELECT COALESCE(SUM(file_size), 0) as total FROM documents WHERE tenant_id = $1 AND deleted_at IS NULL',
        [id]
      );
      const currentStorageBytes = parseInt(storageResult.rows[0].total, 10);
      const currentStorageGb = currentStorageBytes / (1024 * 1024 * 1024);

      // Count API calls this month (from audit logs)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const apiCallsResult = await client.query(
        `SELECT COUNT(*) as count FROM audit_logs
         WHERE tenant_id = $1 AND action = 'api_call' AND created_at >= $2`,
        [id, firstDayOfMonth]
      );
      const apiCallsThisMonth = parseInt(apiCallsResult.rows[0].count, 10);

      return {
        tenantId: id,
        currentUsers,
        currentStorageGb,
        apiCallsThisMonth,
        lastUpdated: new Date(),
      };
    } finally {
      client.release();
    }
  }

  async isQuotaExceeded(
    id: TenantId,
    resource: 'users' | 'storage' | 'apiCalls'
  ): Promise<boolean> {
    const tenant = await this.getById(id);
    if (!tenant) {
      throw new Error(`Tenant not found: ${id}`);
    }

    const usage = await this.getUsage(id);

    switch (resource) {
      case 'users':
        return usage.currentUsers >= tenant.maxUsers;
      case 'storage':
        return usage.currentStorageGb >= tenant.maxStorageGb;
      case 'apiCalls':
        return usage.apiCallsThisMonth >= tenant.maxApiCallsPerMonth;
      default:
        throw new Error(`Unknown resource type: ${resource}`);
    }
  }

  async dispose(): Promise<void> {
    await this.db.end();
    if (this.redis) {
      await this.redis.quit();
    }
    this.ctx.logger.info('[tenant] Disposed');
  }

  // Helper methods

  private mapTenant(row: any): Tenant {
    return {
      id: row.id as TenantId,
      name: row.name,
      slug: row.slug,
      domain: row.domain,
      logoUrl: row.logo_url,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      config: row.config,
      maxUsers: row.max_users,
      maxStorageGb: row.max_storage_gb,
      maxApiCallsPerMonth: row.max_api_calls_per_month,
      plan: row.plan,
      subscriptionStatus: row.subscription_status,
      subscriptionExpiresAt: row.subscription_expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
