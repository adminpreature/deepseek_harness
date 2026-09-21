/**
 * Host loader entry for dsh-skill-plaza.
 *
 * Wiring: an OWN `webServer` route under `/skill-plaza` (not the shared `/api`
 * loopback RPC channel) that reads the skill catalog off `ctx.skills` — the
 * plaza is a standalone full-page browser, not bound to one open
 * conversation, so it cannot use the session-scoped `skills.list` wire API
 * apiproxy exposes (that call requires a `sessionId` and resolves both `cwd`
 * and view `scope` from that session's header/live agent). On this
 * deployment shape (dsh-web-app), skill discovery is preset-layered:
 * `dsh-skill-filesystem` and `dsh-tool-skill` are disabled on the host's
 * global layer and instead mount inside each agent preset's own composition
 * (see that bundle's `cordis.patch.yml`), so a scope-less
 * `ctx.skills.list({})` read sees no provider and returns an empty catalog.
 * `listPlazaSkills` resolves the DEFAULT preset's standing scope via
 * `ctx.agentPresets.standingKeyFor()` (mounts or reuses that composition with
 * no agent/session/turn — the same fallback apiproxy's own session-bound
 * handler takes for an unrecorded session) and reads through that scope,
 * falling back to the scope-less global read when no preset service is
 * mounted (a deployment that keeps skill-filesystem on the host layer
 * directly).
 *
 * A shared `/api` interceptor (`connection.rpc.intercept`) is deliberately
 * NOT used here: that channel accepts exactly one interceptor process-wide
 * (`HostConnectionService.registerInterceptor` throws "already has an
 * interceptor" on a second registration), and `@deepseek-ai/dsh-api-gateway`
 * (the typert Remote dispatcher every `@Remote`-decorated Service method
 * rides, including `commands.list`) already claims it. An earlier version of
 * this plugin registered its own `/api` interceptor and won the race against
 * dsh-api-gateway's registration, silently breaking every typert Remote
 * endpoint host-wide (observed as the web UI's slash-command directory
 * warmup failing with a 404 on `commands/list`). `dsh-prompt-manager` avoids
 * this by mounting its own `webServer` prefix route instead of the shared
 * channel; this plugin follows that same pattern.
 *
 * Export shape follows the dsh-tool-todo lesson: a function/namespace plugin —
 * `name` / `inject` / `apply`, NO default export.
 *
 * @module dsh-skill-plaza
 */
import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
// Type-only module imports: load the cordis Context augmentations
// (ctx.skills / ctx.agentPresets) and vanish at compile time — the built
// host half keeps ZERO runtime @deepseek-ai imports, so a published copy
// never shadows the CLI-internal dsh-skill/dsh-agent-presets builds with an
// npm-mirror copy from the profile's node_modules.
import type {} from '@deepseek-ai/dsh-skill'
import type {} from '@deepseek-ai/dsh-agent-presets'
import type { ScopeKey } from '@deepseek-ai/dsh-scope'

import type {} from '@deepseek-ai/dsh-host-webserver'

/** Cordis plugin name. */
export const name = 'dsh-skill-plaza'

/** Required host services: the skill registry and this plugin's own HTTP route. */
export const inject = ['skills', 'webServer']

/** Route prefix this plugin owns exclusively (no shared-channel contention). */
const ROUTE_PREFIX = '/skill-plaza'

/** One plaza-facing skill row: the wire `SkillEntry` shape plus opportunistic display metadata. */
interface PlazaSkillEntry {
  readonly name: string
  readonly description: string
  readonly whenToUse?: string
  readonly modelInvocable: boolean
  readonly category?: string
  readonly tags?: readonly string[]
  readonly icon?: string
  readonly featured?: boolean
}

/** Read a non-empty string field from an opaque metadata object. */
function readString(metadata: Readonly<Record<string, unknown>> | undefined, key: string): string | undefined {
  const value = metadata?.[key]
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

/** Read a string-array field (empty/non-string entries dropped; empty result omitted). */
function readStringArray(metadata: Readonly<Record<string, unknown>> | undefined, key: string): string[] | undefined {
  const value = metadata?.[key]
  if (!Array.isArray(value)) return undefined
  const strings = value.filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')
  return strings.length > 0 ? strings : undefined
}

/** Read a boolean field, defaulting to false for anything but a literal `true`. */
function readBoolean(metadata: Readonly<Record<string, unknown>> | undefined, key: string): boolean {
  return metadata?.[key] === true
}

/**
 * List the plaza's skill catalog: every user-invocable skill in the resolved
 * scope, enriched with `metadata.category` / `tags` / `icon` / `featured`
 * when the skill's frontmatter carries them. `ctx.skills.list()` returns
 * invocation-neutral summaries that never carry metadata (the registry
 * strips it before returning); only `ctx.skills.get()` loads the full
 * definition. One skill's metadata lookup failing (e.g. a provider dropped
 * the candidate between the two calls) degrades that row to metadata-less
 * display rather than failing the whole catalog.
 * @param ctx - the plugin context (skills injected).
 * @returns the plaza-facing rows, sorted by name (ctx.skills.list()'s order).
 */
async function listPlazaSkills(ctx: Context): Promise<PlazaSkillEntry[]> {
  const presets = ctx.get('agentPresets')
  let scope: ScopeKey | undefined
  if (presets !== undefined) {
    scope = await presets.standingKeyFor()
  }
  const summaries = await ctx.skills.list({ scope })
  const userInvocable = summaries.filter(skill => skill.invocation.userInvocable)
  return Promise.all(userInvocable.map(async (skill): Promise<PlazaSkillEntry> => {
    let metadata: Readonly<Record<string, unknown>> | undefined
    try {
      const definition = await ctx.skills.get(skill.name, { scope })
      metadata = definition?.metadata
    } catch {
      metadata = undefined // Metadata is opportunistic display data; a failed reload just omits it.
    }
    const category = readString(metadata, 'category')
    const tags = readStringArray(metadata, 'tags')
    const icon = readString(metadata, 'icon')
    return {
      name: skill.name,
      description: skill.description,
      ...skill.whenToUse === undefined ? {} : { whenToUse: skill.whenToUse },
      modelInvocable: skill.invocation.modelInvocable,
      ...category === undefined ? {} : { category },
      ...tags === undefined ? {} : { tags },
      ...icon === undefined ? {} : { icon },
      ...readBoolean(metadata, 'featured') ? { featured: true } : {},
    }
  }))
}

/** Write a JSON response with the given status. */
function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

/**
 * Route handler for the plugin's own `/skill-plaza` prefix.
 * @param ctx - the plugin context (skills injected).
 * @param req - incoming request.
 * @param res - response the handler owns for its full lifecycle.
 */
async function routeHandler(ctx: Context, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const pathname = new URL(req.url ?? '/', 'http://x').pathname
  const subpath = pathname.slice(ROUTE_PREFIX.length)
  if (subpath !== '/list') {
    res.writeHead(404, { 'cache-control': 'no-store' })
    res.end()
    return
  }
  if (req.method !== 'GET') {
    res.writeHead(405, { allow: 'GET', 'cache-control': 'no-store' })
    res.end()
    return
  }
  try {
    json(res, 200, { ok: true, skills: await listPlazaSkills(ctx) })
  } catch (error) {
    json(res, 500, { ok: false, error: String((error as { message?: unknown } | undefined)?.message ?? error) })
  }
}

/**
 * Mount the host half: this plugin's own `/skill-plaza` webServer route.
 * @param ctx - the plugin context (skills + webServer injected).
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: (req, res) => routeHandler(ctx, req, res),
  }), 'dsh-skill-plaza: skill catalog route')
}
