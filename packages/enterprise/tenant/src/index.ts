import { Context, Schema } from '@deepseek-ai/cordis';
import type { TenantService } from './service.js';

/**
 * Tenant configuration schema
 */
export interface TenantConfig {
  /**
   * Database configuration
   */
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    maxConnections?: number;
  };

  /**
   * Redis configuration for caching and session management
   */
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };

  /**
   * Default resource quotas for new tenants
   */
  defaultQuotas?: {
    maxUsers?: number;
    maxStorageGb?: number;
    maxApiCallsPerMonth?: number;
  };
}

export const TenantConfig: Schema<TenantConfig> = Schema.object({
  database: Schema.object({
    host: Schema.string().default('localhost'),
    port: Schema.number().default(5432),
    database: Schema.string().required(),
    user: Schema.string().required(),
    password: Schema.string().required(),
    ssl: Schema.boolean().default(false),
    maxConnections: Schema.number().default(20),
  }).required(),

  redis: Schema.object({
    host: Schema.string().default('localhost'),
    port: Schema.number().default(6379),
    password: Schema.string(),
    db: Schema.number().default(0),
  }),

  defaultQuotas: Schema.object({
    maxUsers: Schema.number().default(50),
    maxStorageGb: Schema.number().default(10),
    maxApiCallsPerMonth: Schema.number().default(100000),
  }),
});

/**
 * dsh-tenant plugin
 *
 * Provides multi-tenant infrastructure including:
 * - Database connection pool with tenant context
 * - Tenant registration and management
 * - Resource quota tracking
 * - Tenant-scoped query builder
 *
 * @example
 * ```yaml
 * plugins:
 *   '@deepseek-ai/dsh-tenant':
 *     database:
 *       host: localhost
 *       database: dsh_enterprise
 *       user: postgres
 *       password: ${DB_PASSWORD}
 * ```
 */
export const name = '@deepseek-ai/dsh-tenant';

export function apply(ctx: Context, config: TenantConfig) {
  // Service implementation will be loaded lazily
  ctx.provide('tenant', undefined, true);

  // Initialize on plugin start
  ctx.on('ready', async () => {
    const { TenantServiceImpl } = await import('./service-impl.js');
    const service = new TenantServiceImpl(ctx, config);
    await service.initialize();
    ctx.set('tenant', service);
  });

  // Cleanup on dispose
  ctx.on('dispose', async () => {
    const tenant = ctx.get('tenant') as TenantService | undefined;
    if (tenant) {
      await tenant.dispose();
    }
  });
}

// Export types for consumers
export * from './types.js';
export type { TenantService } from './service.js';
