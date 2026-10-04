/** Packaged content-skill provider and default-preset catalog route for Skill Plaza. */
import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { BUNDLED_SKILL_RANK, isSkillName, type SkillCandidate, type SkillDefinition, type SkillProvider } from '@deepseek-ai/dsh-skill'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import type {} from '@deepseek-ai/dsh-agent-presets'
import type { ScopeKey } from '@deepseek-ai/dsh-scope'

import type {} from '@deepseek-ai/dsh-host-webserver'

/** Cordis plugin name. */
export const name = 'dsh-skill-plaza'

/** Required host services: the skill registry and this plugin's own HTTP route. */
export const inject = ['skills', 'webServer']

/**
 * Load packaged content skills, rejecting invalid or duplicate invocation ids at startup.
 * @param root - Packaged category/skill directories; defaults to this plugin's resources.
 * @returns A provider whose catalog and bodies come from the same validated files.
 */
export function createBundledProvider(root = fileURLToPath(new URL('../skills/', import.meta.url))): SkillProvider {
  const definitions = new Map<string, SkillDefinition>()
  const candidates: SkillCandidate[] = []
  const provider = 'oneseven-presets'
  for (const category of readdirSync(root, { withFileTypes: true })) {
    if (!category.isDirectory()) continue
    for (const directory of readdirSync(join(root, category.name), { withFileTypes: true })) {
      if (!directory.isDirectory()) continue
      const path = join(root, category.name, directory.name, 'SKILL.md')
      const raw = readFileSync(path, 'utf8')
      const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw)
      if (!match?.[1]) throw new Error(`skill-plaza: missing frontmatter in ${path}`)
      const data: unknown = parseYaml(match[1])
      if (typeof data !== 'object' || data === null || !('name' in data) || !('description' in data)
        || !('metadata' in data) || typeof data.metadata !== 'object' || data.metadata === null
        || !('slug' in data.metadata) || typeof data.metadata.slug !== 'string' || !isSkillName(data.metadata.slug)
        || typeof data.name !== 'string' || !data.name.trim() || typeof data.description !== 'string' || !data.description.trim()) {
        throw new Error(`skill-plaza: name, description and valid metadata.slug required in ${path}`)
      }
      const name = data.metadata.slug
      const content = raw.slice(match[0].length).trim()
      if (!content || definitions.has(name)) throw new Error(`skill-plaza: empty content or duplicate slug in ${path}`)
      const definition: SkillDefinition = {
        name, description: data.description, provider, source: 'bundled', content,
        invocation: { modelInvocable: true, userInvocable: true },
        metadata: { ...data.metadata, displayName: data.name, category: category.name.replace(/^\d+-/u, '') },
      }
      definitions.set(name, definition)
      candidates.push({ name, description: definition.description, provider, source: 'bundled',
        invocation: definition.invocation, rank: BUNDLED_SKILL_RANK, locator: name })
    }
  }
  return {
    name: provider,
    async list(options) { options.signal?.throwIfAborted(); return candidates },
    async get(candidate, options) { options.signal?.throwIfAborted(); return definitions.get(candidate.name) },
  }
}

/** Route prefix this plugin owns exclusively (no shared-channel contention). */
const ROUTE_PREFIX = '/skill-plaza'

/** One plaza-facing skill row: the wire `SkillEntry` shape plus opportunistic display metadata. */
interface PlazaSkillEntry {
  readonly name: string
  readonly description: string
  readonly displayName?: string
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
    const displayName = readString(metadata, 'displayName')
    const tags = readStringArray(metadata, 'tags')
    const icon = readString(metadata, 'icon')
    return {
      name: skill.name,
      description: skill.description,
      ...displayName === undefined ? {} : { displayName },
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
  ctx.skills.registerProvider(() => createBundledProvider())
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: (req, res) => routeHandler(ctx, req, res),
  }), 'dsh-skill-plaza: skill catalog route')
}
