/** Negative controls for pinned RPC codecs, request validation, and execution permissions. */
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { TYPERT } from '../dsh-skills-manager/src/legacy/typert.host.js'
import { TYPERT_REMOTE } from '../dsh-skills-manager/src/legacy/typert.remote-client.js'
import { validateTypertManifest } from '../../packages/typert/loader/lib/index.js'
import { normalizeActivation, assertMutationRequest, renderInjectedPrompt } from '../dsh-prompt-manager/src/index.js'
import { ExecutionService } from '../dsh-taskboard/src/host/execution.ts'
import { TaskStore } from '../dsh-taskboard/src/host/store.ts'
import { newTaskId } from '../dsh-taskboard/src/shared/protocol.ts'

test('host and browser RPC codecs retain strict validation on the target factory API', () => {
  assert.equal(validateTypertManifest('@baikai233/dsh-skills-manager', TYPERT).package, '@baikai233/dsh-skills-manager')
  for (const invocations of [TYPERT.invocations, TYPERT_REMOTE.descriptors]) {
    const invocation = invocations.find(row => row.method === 'importFiles')
    const codec = invocation.parameters[0].codec.create()
    assert.equal(codec.safeParse([{ name: 'SKILL.md', content: 'text' }]).success, true)
    assert.equal(codec.safeParse([{ name: 42, content: 'text' }]).success, false)
    assert.equal(invocation.result.create().safeParse({ ok: true, message: 'done', imported: [] }).success, true)
    assert.equal(invocation.result.create().safeParse({ ok: 'yes' }).success, false)
  }
  const invalid = { ...TYPERT, invocations: [{ ...TYPERT.invocations[0], result: { mode: 'strict', typeSymbol: 'bad' } }] }
  assert.throws(() => validateTypertManifest('@baikai233/dsh-skills-manager', invalid), /create/)
})

test('prompt writes refuse cross-origin and remote callers; prompt assembly remains session-specific', () => {
  assert.throws(() => normalizeActivation({ sessionId: '', prompt: {} }), /sessionId/)
  assert.throws(() => assertMutationRequest({ socket: { remoteAddress: '192.0.2.1' }, headers: {} }), /remote/)
  assert.throws(() => assertMutationRequest({ socket: { remoteAddress: '127.0.0.1' }, headers: { host: 'localhost:9000', origin: 'https://untrusted.invalid', 'content-type': 'application/json' } }), /origin/)
  const prompts = new Map([['first', { prompts: [{ id: 'p', title: 'local', content: '{{literal}}' }] }]])
  const sessions = { get: () => undefined }
  assert.match(renderInjectedPrompt(prompts, { agent: { session: { header: { id: 'first' } } } }, sessions), /\{ \{literal\} \}/)
  assert.equal(renderInjectedPrompt(prompts, { agent: { session: { header: { id: 'second' } } } }, sessions), '')
})

for (const disposalFails of [false, true]) test(`permission failure prevents input even when disposal fails: ${disposalFails}`, async () => {
  const root = await mkdtemp(join(tmpdir(), 'oneseven-permission-'))
  let execution
  try {
    const store = new TaskStore({ file: join(root, 'ledger.json') })
    const id = newTaskId()
    const task = { id, title: 'Permission negative control', description: '', prompt: 'Never execute', workspaceId: 'workspace', urgency: 'normal', status: 'todo', execution: { mode: 'manual' }, isolation: 'none', permission: 'read-only', version: 1, createdAt: 1, updatedAt: 1, createdBy: { kind: 'user' }, updatedBy: { kind: 'user' }, comments: [], executions: [] }
    await store.mutate('task-created', ledger => { ledger.tasks.push(task); return [task] })
    let disposed = 0
    let submitted = 0
    execution = new ExecutionService({
      store, now: () => 1000,
      agents: { create: async () => ({ agent: { id: 'session', inject: () => submitted++, followup: () => submitted++, whenIdle: async () => {} }, dispose: async () => { disposed++; if (disposalFails) throw new Error('dispose probe failed') } }) },
      workspaces: { get: () => ({ id: 'workspace', path: root }), attach: async () => {} },
      events: { onSessionEvent: () => () => {} },
      setPermission: () => { throw new Error('permission unavailable') },
    })
    const result = await execution.run(id, 'manual')
    assert.equal(result.ok, false)
    assert.match(result.error, /permission setup failed/)
    if (disposalFails) assert.match(result.error, /session disposal failed: Error: dispose probe failed/)
    assert.equal(submitted, 0)
    assert.equal(disposed, 1)
    assert.equal(store.get(id).status, 'todo')
    assert.equal(store.get(id).executions[0].outcome, 'failed')
  } finally {
    execution?.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('scheduled tasks advance once, skip stale windows, and obey capacity', async () => {
  const { SchedulerService } = await import('../dsh-taskboard/src/host/scheduler.ts')
  const root = await mkdtemp(join(tmpdir(), 'oneseven-schedule-'))
  try {
    const now = Date.UTC(2026, 8, 21, 0, 0)
    const store = new TaskStore({ file: join(root, 'ledger.json') })
    const dueId = newTaskId()
    const staleId = newTaskId()
    const make = (id, at) => ({ id, title: 'Scheduled check', description: '', prompt: 'Local only', workspaceId: 'workspace', urgency: 'normal', status: 'todo', execution: { mode: 'scheduled', cron: '* * * * *', nextRunAt: at }, isolation: 'none', permission: 'read-only', version: 1, createdAt: now, updatedAt: now, createdBy: { kind: 'user' }, updatedBy: { kind: 'user' }, comments: [], executions: [] })
    await store.mutate('task-created', ledger => { ledger.tasks.push(make(dueId, now), make(staleId, now - 600_000)); return ledger.tasks })
    const calls = []
    let inFlight = 3
    const scheduler = new SchedulerService({ store, now: () => now, execution: { inFlight: () => inFlight, run: async (...args) => { calls.push(args); return { ok: true } } } })
    await scheduler.tick()
    assert.equal(calls.length, 0)
    assert.equal(store.get(dueId).execution.nextRunAt, now)
    inFlight = 0
    await scheduler.tick()
    await scheduler.tick()
    assert.deepEqual(calls, [[dueId, 'scheduled']])
    assert.equal(store.get(dueId).execution.nextRunAt, now + 60_000)
    assert.equal(store.get(staleId).execution.nextRunAt, now + 60_000)
  } finally { await rm(root, { recursive: true, force: true }) }
})
