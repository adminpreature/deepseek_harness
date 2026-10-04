import type { Service } from '@deepseek-ai/cordis';
import type {
  Tenant,
  TenantId,
  CreateTenantInput,
  UpdateTenantInput,
  TenantContext,
  TenantUsage,
} from './types.js';
import type { Pool } from 'pg';
import type Redis from 'ioredis';

/**
 * Tenant service definition
 *
 * Provides multi-tenant infrastructure with strict data isolation.
 * All database queries are automatically scoped to the current tenant context.
 */
export abstract class TenantService extends Service {
  /**
   * Database connection pool
   */
  abstract get db(): Pool;

  /**
   * Redis client (optional)
   */
  abstract get redis(): Redis | undefined;

  /**
   * Get current tenant context from session/request
   */
  abstract getCurrentContext(): TenantContext | undefined;

  /**
   * Set tenant context for current operation
   * @param tenantId - Tenant ID to set
   */
  abstract setContext(tenantId: TenantId): Promise<void>;

  /**
   * Clear tenant context
   */
  abstract clearContext(): void;

  /**
   * Create a new tenant
   * @param input - Tenant creation data
   * @returns Created tenant
   */
  abstract create(input: CreateTenantInput): Promise<Tenant>;

  /**
   * Get tenant by ID
   * @param id - Tenant ID
   * @returns Tenant or undefined if not found
   */
  abstract getById(id: TenantId): Promise<Tenant | undefined>;

  /**
   * Get tenant by slug
   * @param slug - Tenant slug (URL-friendly identifier)
   * @returns Tenant or undefined if not found
   */
  abstract getBySlug(slug: string): Promise<Tenant | undefined>;

  /**
   * Get tenant by domain
   * @param domain - Custom domain
   * @returns Tenant or undefined if not found
   */
  abstract getByDomain(domain: string): Promise<Tenant | undefined>;

  /**
   * Update tenant
   * @param id - Tenant ID
   * @param input - Update data
   * @returns Updated tenant
   */
  abstract update(id: TenantId, input: UpdateTenantInput): Promise<Tenant>;

  /**
   * Delete tenant (soft delete)
   * @param id - Tenant ID
   */
  abstract delete(id: TenantId): Promise<void>;

  /**
   * Get resource usage for tenant
   * @param id - Tenant ID
   * @returns Usage statistics
   */
  abstract getUsage(id: TenantId): Promise<TenantUsage>;

  /**
   * Check if tenant has reached quota limit
   * @param id - Tenant ID
   * @param resource - Resource type ('users' | 'storage' | 'apiCalls')
   * @returns True if quota exceeded
   */
  abstract isQuotaExceeded(
    id: TenantId,
    resource: 'users' | 'storage' | 'apiCalls'
  ): Promise<boolean>;

  /**
   * Execute a query within tenant context
   * @param tenantId - Tenant ID
   * @param fn - Function to execute
   * @returns Result of the function
   */
  abstract withContext<T>(tenantId: TenantId, fn: () => Promise<T>): Promise<T>;

  /**
   * Dispose resources (connection pools, etc.)
   */
  abstract dispose(): Promise<void>;
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    tenant: TenantService;
  }

  interface Events {
    /**
     * Emitted when a new tenant is created
     * @param tenant - Created tenant
     */
    'tenant/created'(tenant: Tenant): void;

    /**
     * Emitted when a tenant is updated
     * @param tenant - Updated tenant
     */
    'tenant/updated'(tenant: Tenant): void;

    /**
     * Emitted when a tenant is deleted
     * @param tenantId - Deleted tenant ID
     */
    'tenant/deleted'(tenantId: TenantId): void;

    /**
     * Emitted when tenant context is set
     * @param context - Tenant context
     */
    'tenant/context-set'(context: TenantContext): void;
  }
}
