/**
 * Core types for tenant system
 */

import type { Branded } from '@deepseek-ai/dsh-brand';

/**
 * Tenant ID (UUID)
 */
export type TenantId = Branded<string, 'TenantId'>;

/**
 * Tenant entity
 */
export interface Tenant {
  id: TenantId;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  config: Record<string, any>;
  maxUsers: number;
  maxStorageGb: number;
  maxApiCallsPerMonth: number;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'suspended' | 'cancelled';
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Tenant creation input
 */
export interface CreateTenantInput {
  name: string;
  slug: string;
  domain?: string;
  plan?: Tenant['plan'];
  config?: Record<string, any>;
}

/**
 * Tenant update input
 */
export interface UpdateTenantInput {
  name?: string;
  domain?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  config?: Record<string, any>;
  maxUsers?: number;
  maxStorageGb?: number;
  maxApiCallsPerMonth?: number;
  plan?: Tenant['plan'];
  subscriptionStatus?: Tenant['subscriptionStatus'];
  subscriptionExpiresAt?: Date;
}

/**
 * Tenant context for scoped operations
 */
export interface TenantContext {
  tenantId: TenantId;
  tenant?: Tenant;
}

/**
 * Resource usage statistics
 */
export interface TenantUsage {
  tenantId: TenantId;
  currentUsers: number;
  currentStorageGb: number;
  apiCallsThisMonth: number;
  lastUpdated: Date;
}

/**
 * Query options with tenant context
 */
export interface TenantQueryOptions {
  tenantId: TenantId;
  includeDeleted?: boolean;
}
