/**
 * Browser client for the host's own `/skill-plaza/list` route (a dedicated
 * `webServer` prefix, not the shared `/api` RPC channel — see src/index.ts
 * for why that channel is off-limits to this plugin).
 *
 * @module dsh-skill-plaza/client/api
 */

/** One plaza-facing skill row (the host's PlazaSkillEntry, browser projection). */
export interface PlazaSkillEntry {
  readonly name: string
  readonly description: string
  readonly whenToUse?: string
  readonly modelInvocable: boolean
  readonly category?: string
  readonly tags?: readonly string[]
  readonly icon?: string
  readonly featured?: boolean
}

/** Route client face the mount/component layer consumes. */
export interface SkillPlazaClient {
  /** Fetch the current skill catalog (one round trip per call; the caller owns caching). */
  list(signal?: AbortSignal): Promise<readonly PlazaSkillEntry[]>
}

/** Build the client over this plugin's own `/skill-plaza` route. */
export function createClient(): SkillPlazaClient {
  return {
    async list(signal) {
      const response = await fetch('/skill-plaza/list', { method: 'GET', ...(signal === undefined ? {} : { signal }) })
      if (!response.ok) throw new Error(`skill-plaza: HTTP ${response.status}`)
      const value = await response.json() as { ok: boolean, skills?: readonly PlazaSkillEntry[], error?: string }
      if (!value.ok) throw new Error(`skill-plaza: ${value.error ?? 'unknown error'}`)
      return Array.isArray(value.skills) ? value.skills : []
    },
  }
}
