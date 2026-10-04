import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Context } from '@deepseek-ai/cordis';
import * as TenantPlugin from '../src/index.js';
import type { TenantService } from '../src/service.js';

describe('dsh-tenant', () => {
  let ctx: Context;
  let tenant: TenantService;

  beforeAll(async () => {
    ctx = new Context();

    // Load plugin with test configuration
    ctx.plugin(TenantPlugin, {
      database: {
        host: process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT || '5432'),
        database: process.env.TEST_DB_NAME || 'dsh_enterprise_test',
        user: process.env.TEST_DB_USER || 'postgres',
        password: process.env.TEST_DB_PASSWORD || 'postgres',
      },
    });

    await ctx.start();
    tenant = ctx.tenant;
  });

  afterAll(async () => {
    await ctx.dispose();
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      const input = {
        name: 'Test Company',
        slug: 'test-company',
        plan: 'pro' as const,
      };

      const created = await tenant.create(input);

      expect(created).toBeDefined();
      expect(created.name).toBe(input.name);
      expect(created.slug).toBe(input.slug);
      expect(created.plan).toBe(input.plan);
      expect(created.id).toBeTruthy();
    });

    it('should fail with duplicate slug', async () => {
      const input = {
        name: 'Another Company',
        slug: 'test-company', // Already exists
      };

      await expect(tenant.create(input)).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('should retrieve tenant by ID', async () => {
      const created = await tenant.create({
        name: 'Get By ID Test',
        slug: 'get-by-id-test',
      });

      const retrieved = await tenant.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(created.name);
    });

    it('should return undefined for non-existent ID', async () => {
      const retrieved = await tenant.getById('00000000-0000-0000-0000-000000000000' as any);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getBySlug', () => {
    it('should retrieve tenant by slug', async () => {
      const created = await tenant.create({
        name: 'Get By Slug Test',
        slug: 'get-by-slug-test',
      });

      const retrieved = await tenant.getBySlug(created.slug);

      expect(retrieved).toBeDefined();
      expect(retrieved?.slug).toBe(created.slug);
    });
  });

  describe('update', () => {
    it('should update tenant properties', async () => {
      const created = await tenant.create({
        name: 'Update Test',
        slug: 'update-test',
      });

      const updated = await tenant.update(created.id, {
        name: 'Updated Name',
        logoUrl: 'https://example.com/logo.png',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.logoUrl).toBe('https://example.com/logo.png');
    });
  });

  describe('delete', () => {
    it('should soft delete tenant', async () => {
      const created = await tenant.create({
        name: 'Delete Test',
        slug: 'delete-test',
      });

      await tenant.delete(created.id);

      const retrieved = await tenant.getById(created.id);
      expect(retrieved).toBeUndefined(); // Soft deleted tenants are hidden
    });
  });

  describe('withContext', () => {
    it('should execute function within tenant context', async () => {
      const created = await tenant.create({
        name: 'Context Test',
        slug: 'context-test',
      });

      await tenant.withContext(created.id, async () => {
        const context = tenant.getCurrentContext();
        expect(context).toBeDefined();
        expect(context?.tenantId).toBe(created.id);
      });

      // Context should be cleared after
      const context = tenant.getCurrentContext();
      expect(context).toBeUndefined();
    });
  });

  describe('quota management', () => {
    it('should track resource usage', async () => {
      const created = await tenant.create({
        name: 'Quota Test',
        slug: 'quota-test',
      });

      const usage = await tenant.getUsage(created.id);

      expect(usage).toBeDefined();
      expect(usage.tenantId).toBe(created.id);
      expect(usage.currentUsers).toBe(0);
      expect(usage.currentStorageGb).toBe(0);
    });

    it('should check quota limits', async () => {
      const created = await tenant.create({
        name: 'Quota Limit Test',
        slug: 'quota-limit-test',
      });

      // Initially should not be exceeded
      const exceeded = await tenant.isQuotaExceeded(created.id, 'users');
      expect(exceeded).toBe(false);
    });
  });
});
