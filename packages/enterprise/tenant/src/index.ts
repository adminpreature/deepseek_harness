export * from './types.js'
export * from './service.js'

/**
 * Tenant plugin configuration
 */
export interface TenantConfig {
  database: {
    host: string
    port: number
    database: string
    user: string
    password: string
    ssl?: boolean
    maxConnections?: number
  }
  redis?: {
    host: string
    port: number
    password?: string
    db?: number
  }
  defaultQuotas?: {
    maxUsers?: number
    maxStorageGb?: number
    maxApiCallsPerMonth?: number
  }
}
