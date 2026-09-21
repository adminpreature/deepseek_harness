/** Pinned external plugins loaded through isolated, managed Web profiles. */
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { assembleContextFor } from '@deepseek-ai/dsh-agent'
import { SessionId } from '@deepseek-ai/dsh-session'
import { renderPrompt } from '@deepseek-ai/dsh-system-prompt'
import { LlmAdapter, type GenerateOptions, type StreamChunk } from '@deepseek-ai/dsh-llm'
import { launchWebScaffold, watchConsole, captureStableAria, compareOrRefreshGolden, webSnapshotMode, type WebScaffold } from './scaffold.ts'

import { connectFreshWorkspaceZh } from './support.ts'

const root = fileURLToPath(new URL('../../../external-plugins/', import.meta.url))

const workspaceReply = z.object({ ok: z.literal(true), value: z.array(z.object({ id: z.string() })) })
const storedTask = z.object({
  id: z.string(), title: z.string(), description: z.string(), status: z.string(), permission: z.string(), version: z.number(),
  executions: z.array(z.object({ outcome: z.string() })),
  comments: z.array(z.object({ body: z.string() })), trashedAt: z.number().optional(),
})
const ledgerSchema = z.object({ tasks: z.array(storedTask) })
const createdTaskReply = z.object({ ok: z.literal(true), value: z.object({ id: z.string(), version: z.number() }) })
const executionReply = z.object({ ok: z.literal(true), value: z.object({ sessionId: z.string() }) })
const promptLibrary = z.object({ prompts: z.array(z.object({ title: z.string() })) })

/** Parse only the persisted task fields asserted by these integration scenarios. */
async function readLedger(scaffold: WebScaffold) {
  return ledgerSchema.parse(JSON.parse(await readFile(join(scaffold.harnessHome, 'dsh-taskboard.json'), 'utf8')))
}

/** Send an authenticated same-origin mutation to the isolated Host. */
function postJson(scaffold: WebScaffold, path: string, body: unknown) {
  return scaffold.hostFetch(path, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: scaffold.baseUrl }, body: JSON.stringify(body),
  })
}


describe('OneSeven external plugins', () => {
  for (const [directory, label, panel] of [
    ['dsh-skill-plaza', '技能广场', true],
    ['dsh-taskboard', '任务看板', true],
    ['dsh-prompt-manager', '提示词管理', false],
    ['dsh-skills-manager', 'Skill 群', false],
  ] as const) {
    it(`mounts ${directory} in the shipped Web profile`, async () => {
      const scaffold = await launchWebScaffold({ profile: { packages: [{ dir: root + directory, enabled: true }] } })
      const browser = await chromium.launch()
      try {
        const page = await browser.newPage({ locale: 'zh-CN', colorScheme: 'dark' })
        const consoleLog = watchConsole(page)
        const messages: string[] = []
        page.on('console', (m) => { if (m.type() === 'error') messages.push(m.text()) })

        await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
        await page.locator('html[data-ui-brand="oneseven"]').waitFor({ timeout: 30_000 })
        if (directory === 'dsh-taskboard' || directory === 'dsh-prompt-manager') await connectFreshWorkspaceZh(page, scaffold.workspaceCwd)
        if (!panel) {
          try { await page.getByRole('button', { name: '设置', exact: true }).click({ timeout: 10_000 }) }
          catch (error) { console.error(directory, messages, await page.locator('body').ariaSnapshot()); throw error }
        }
        try { await page.getByRole('button', { name: label, exact: true }).click({ timeout: 15_000 }) }
        catch (error) { console.error(directory, messages, await page.locator('body').ariaSnapshot()); throw error }
        const selector = panel ? (directory === 'dsh-skill-plaza' ? '.dsh-skp-page-container' : '.dsh-atb-panel') : '[role="dialog"]'
        await page.locator(selector).waitFor()
        if (directory === 'dsh-skill-plaza') {
          await expect.poll(async () => z.object({ ok: z.literal(true) }).parse(await (await scaffold.hostFetch('/skill-plaza/list')).json()).ok).toBe(true)
          await expect.poll(() => page.getByText('加载中…', { exact: true }).count()).toBe(0)
        }
        let initialBoard: string | undefined
        if (directory === 'dsh-taskboard') {
          await page.getByText('0 任务 · rev 0', { exact: true }).waitFor()
          initialBoard = await captureStableAria(page, selector, scaffold.workspaceCwd)
          const catalog = workspaceReply.parse(await (await scaffold.hostFetch('/dsh-taskboard/workspaces')).json())
          expect(catalog.ok).toBe(true)
          expect(catalog.value.length).toBeGreaterThan(0)
          const created = await scaffold.hostFetch('/dsh-taskboard/tasks', {
            method: 'POST', headers: { 'content-type': 'application/json', origin: scaffold.baseUrl },
            body: JSON.stringify({ title: 'OneSeven isolated task', workspaceId: catalog.value[0]!.id, urgency: 'normal', isolation: 'none', permission: 'read-only' }),
          })
          expect(created.status).toBe(201)
          await page.getByText('OneSeven isolated task', { exact: true }).waitFor()
          const ledger = await readLedger(scaffold)
          expect(ledger.tasks.some((task: { title: string; permission: string }) => task.title === 'OneSeven isolated task' && task.permission === 'read-only')).toBe(true)
          const task = ledger.tasks.find((row: { title: string }) => row.title === 'OneSeven isolated task')!
          expect((await postJson(scaffold, `/dsh-taskboard/tasks/${task.id}/update`, { ifVersion: task.version, description: 'Updated through the pinned route.' })).status).toBe(200)
          expect((await postJson(scaffold, `/dsh-taskboard/tasks/${task.id}/update`, { ifVersion: task.version, description: 'Must not overwrite.' })).status).toBe(409)
          const disposable = await postJson(scaffold, '/dsh-taskboard/tasks', { title: 'Disposable local task', workspaceId: catalog.value[0]!.id, urgency: 'normal', isolation: 'none', permission: 'read-only' })
          const removed = createdTaskReply.parse(await disposable.json()).value
          expect((await postJson(scaffold, `/dsh-taskboard/tasks/${removed.id}/delete`, { ifVersion: removed.version })).status).toBe(200)
          const persisted = await readLedger(scaffold)
          expect(persisted.tasks.find((row: { id: string }) => row.id === task.id)!.description).toBe('Updated through the pinned route.')
          expect(persisted.tasks.find((row: { id: string }) => row.id === removed.id)!.trashedAt).toEqual(expect.any(Number))

        }
        if (directory === 'dsh-prompt-manager') {
          const section = page.locator('.pm-section')
          await section.getByRole('button', { name: '新建', exact: true }).click()
          await page.locator('#pm-title-input').fill('OneSeven isolated prompt')
          await page.locator('#pm-content-input').fill('Reply briefly. Preserve {{literal}}.')
          await section.getByRole('button', { name: '保存', exact: true }).click()
          await section.getByText('OneSeven isolated prompt', { exact: true }).waitFor()
          await expect.poll(async () => promptLibrary.parse(await (await scaffold.hostFetch('/prompt-manager/library')).json()).prompts.some((prompt: { title: string }) => prompt.title === 'OneSeven isolated prompt')).toBe(true)
          await page.getByRole('searchbox', { name: '搜索提示词', exact: true }).fill('OneSeven isolated prompt')
          const forbidden = await scaffold.hostFetch('/prompt-manager/activate', {
            method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://untrusted.invalid' }, body: '{}',
          })
          expect(forbidden.status).toBe(403)
          const handles = await Promise.all(['prompt-one', 'prompt-two'].map(id => scaffold.ctx.agents.create({ sessionId: SessionId(id), meta: { cwd: scaffold.workspaceCwd }, agentOptions: { provider: 'deepseek-official', model: 'deepseek-v4-flash' }, setup: scope => scaffold.ctx.agentPresets.mount(scope).then(() => undefined) })))
          try {
            const activation = await postJson(scaffold, '/prompt-manager/activate', { sessionId: 'prompt-one', prompt: { id: 'isolated', title: 'Isolation check', content: 'ONLY_THIS_SESSION {{literal}}' } })
            expect(activation.status).toBe(200)
            const assembled = async (index: number) =>
              renderPrompt(await scaffold.ctx.systemPrompt.assemble(assembleContextFor(handles[index]!.agent)))
            expect(await assembled(0)).toContain('ONLY_THIS_SESSION { {literal} }')
            expect(await assembled(1)).not.toContain('ONLY_THIS_SESSION')
            expect((await postJson(scaffold, '/prompt-manager/remove', { sessionId: 'prompt-one', promptId: 'isolated' })).status).toBe(200)
            expect(await assembled(0)).not.toContain('ONLY_THIS_SESSION')
          } finally { await Promise.all(handles.map(handle => handle.dispose())) }

        }
        if (directory === 'dsh-skills-manager') {
          await page.getByRole('button', { name: '新建 Skill 群', exact: true }).click()
          await page.getByPlaceholder('名称', { exact: true }).fill('OneSeven isolated skills')
          await page.getByLabel('选择文件', { exact: true }).setInputFiles({
            name: 'SKILL.md', mimeType: 'text/markdown',
            buffer: Buffer.from('---\nname: oneseven-check\ndescription: Isolated compatibility check\n---\nKeep this test local.\n'),
          })
          await page.getByRole('button', { name: '导入文件', exact: true }).click()
          await expect.poll(() => scaffold.ctx.settings.get('skills-manage')).toMatchObject({ library: [{ name: 'oneseven-check' }] })
          await page.getByRole('button', { name: '保存', exact: true }).click()
          await page.getByText('OneSeven isolated skills', { exact: true }).waitFor()
          const card = page.locator('li').filter({ hasText: 'OneSeven isolated skills' })
          await card.getByRole('button', { name: '启用', exact: true }).click()
          await expect.poll(async () => (await scaffold.ctx.skills.list({})).map(skill => skill.name)).toContain('oneseven-check')
        }
        for (const preference of ['light', 'dark'] as const) {
          await scaffold.ctx.settings.update('ui-theme', { preference })
          await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(preference)
          if (directory === 'dsh-taskboard') expect(await page.locator('.dsh-atb-select').first().evaluate(el => getComputedStyle(el).colorScheme)).toBe(preference)
          const output = process.env.DSH_ONESEVEN_EVIDENCE_DIR
          if (output) {
            await mkdir(output, { recursive: true })
            await page.screenshot({ path: join(output, `${directory}-${preference}.png`), fullPage: true })
          }
          await page.setViewportSize({ width: 390, height: 844 })
          await page.locator('[data-sidebar-collapsed]').waitFor()
          if (!panel) {
            await page.getByRole('button', { name: '关闭', exact: true }).click({ trial: true, timeout: 5000 })
            expect((await page.locator('[role="dialog"] > div').last().boundingBox())!.width).toBeGreaterThan(300)
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
          if (panel) await expect.poll(async () => (await page.locator(selector).boundingBox())!.width).toBeGreaterThan(300)
          if (process.env.DSH_ONESEVEN_EVIDENCE_DIR) await page.screenshot({ path: join(process.env.DSH_ONESEVEN_EVIDENCE_DIR, `${directory}-narrow-${preference}.png`), fullPage: true })
          await page.setViewportSize({ width: 1280, height: 720 })
          await expect.poll(() => page.locator('[data-sidebar-collapsed]').count()).toBe(0)
        }
        await compareOrRefreshGolden(fileURLToPath(new URL(`./expected/oneseven/${directory}.expected.md`, import.meta.url)), initialBoard ?? await captureStableAria(page, selector, scaffold.workspaceCwd), webSnapshotMode())
        await page.reload({ waitUntil: 'load' })
        await page.locator('html[data-ui-brand="oneseven"]').waitFor()
        if (!panel) await page.getByRole('button', { name: '设置', exact: true }).click()
        await page.getByRole('button', { name: label, exact: true }).click()
        await page.locator(selector).waitFor()
        if (!panel) await page.keyboard.press('Escape')
        const packageName = directory === 'dsh-skills-manager' ? '@baikai233/dsh-skills-manager' : directory
        const ownedStyle = directory === 'dsh-prompt-manager' ? 'style[data-dsh-prompt-manager]' : `style[data-plugin="${packageName}"]`
        expect((await scaffold.ctx.pluginManager.setBundleEnabled(packageName, false)).application).toBe('applied')
        await expect.poll(() => page.locator(ownedStyle).count()).toBe(0)
        if (!panel) await page.getByRole('button', { name: '设置', exact: true }).click()
        await expect.poll(() => page.getByRole('button', { name: label, exact: true }).count()).toBe(0)
        if (!panel) await page.keyboard.press('Escape')
        expect((await scaffold.ctx.pluginManager.setBundleEnabled(packageName, true)).application).toBe('applied')
        if (!panel) await page.getByRole('button', { name: '设置', exact: true }).click()
        await expect.poll(() => page.getByRole('button', { name: label, exact: true }).count()).toBe(1)
        await expect.poll(() => page.locator(ownedStyle).count()).toBe(1)
        expect(consoleLog.pageErrors).toEqual([])
      } finally {
        try { await browser.close() } finally { await scaffold.close() }
      }
    })
  }
})

it('coexists with all four plugins and inserts skills into only the selected Lexical draft', async () => {
  const scaffold = await launchWebScaffold({ profile: { packages: ['dsh-skill-plaza', 'dsh-taskboard', 'dsh-prompt-manager', 'dsh-skills-manager'].map(directory => ({ dir: root + directory, enabled: true })) } })
  const browser = await chromium.launch()
  try {
    const manager = scaffold.ctx.get('skillsManage') as { importFiles(files: { name: string; content: string }[]): Promise<{ ok: boolean }> }
    expect((await manager.importFiles([{ name: 'SKILL.md', content: '---\nname: oneseven-check\ndescription: Isolated compatibility check\n---\nKeep this test local.\n' }])).ok).toBe(true)
    await scaffold.ctx.settings.update('skills-manage', { activeGroup: 'all' })
    const first = await browser.newPage({ locale: 'zh-CN' })
    const second = await browser.newPage({ locale: 'zh-CN' })
    const tripwires = [watchConsole(first), watchConsole(second)]
    for (const [page, workspace, text] of [[first, 'one', 'First draft 壹柒 𠮷 🙂'], [second, 'two', 'Second draft']] as const) {
      await page.goto(scaffold.authenticatedUrl)
      await page.locator('html[data-ui-brand="oneseven"]').waitFor()
      await page.getByRole('button', { name: '设置', exact: true }).waitFor()
      if (page === first) {
        await page.getByRole('button', { name: '技能广场', exact: true }).click()
        await page.locator('.dsh-skp-card').filter({ hasText: 'oneseven-check' }).click()
        await expect.poll(() => page.getByRole('alert').innerText()).toBe('请先打开一个会话，再选择技能。')
        await page.getByRole('button', { name: '新建会话', exact: true }).filter({ hasText: '新会话' }).click()
        await connectFreshWorkspaceZh(page, scaffold.workspaceCwd, workspace)
      }
      else await page.getByRole('button', { name: '新建会话', exact: true }).filter({ hasText: '新会话' }).click()
      await page.locator('[data-composer-input][contenteditable="true"]').fill(text)
    }
    await first.getByRole('button', { name: '技能广场', exact: true }).click()
    await first.locator('.dsh-skp-card').filter({ hasText: 'oneseven-check' }).click()
    await expect.poll(() => first.locator('[data-composer-input]').innerText()).toContain('/oneseven-check First draft 壹柒 𠮷 🙂')
    expect(await second.locator('[data-composer-input]').innerText()).toBe('Second draft')
    await first.reload()
    await expect.poll(() => first.locator('[data-composer-input]').innerText()).toContain('/oneseven-check First draft')
    for (const tripwire of tripwires) expect(tripwire.pageErrors).toEqual([])
  } finally {
    try { await browser.close() } finally { await scaffold.close() }
  }
})

it('executes a read-only task through the shipped agent and records a keyless result', async () => {
  const scaffold = await launchWebScaffold({ profile: { packages: [{ dir: root + 'dsh-taskboard', enabled: true }] } })
  const browser = await chromium.launch()
  let calls = 0
  // Deterministic local adapter: tests real routing, permissions, messages and
  // settlement, not DeepSeek connectivity or model quality.
  class LocalAdapter extends LlmAdapter {
    override async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
      options.signal?.throwIfAborted()
      calls++
      yield { type: 'block-start', index: 0, blockType: 'text' }
      yield { type: 'text-delta', index: 0, text: 'OneSeven local execution complete.' }
      yield { type: 'block-end', index: 0, block: { type: 'text', text: 'OneSeven local execution complete.' } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    }
  }
  const releaseAdapter = scaffold.ctx.llm.registerAdapter(['oneseven-test'], new LocalAdapter())
  try {
    const page = await browser.newPage({ locale: 'zh-CN' })
    const tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl)
    await connectFreshWorkspaceZh(page, scaffold.workspaceCwd)
    const catalog = workspaceReply.parse(await (await scaffold.hostFetch('/dsh-taskboard/workspaces')).json())
    const created = await postJson(scaffold, '/dsh-taskboard/tasks', { title: 'Local execution', urgency: 'normal', prompt: 'Return the local result.', workspaceId: catalog.value[0]!.id, isolation: 'none', permission: 'read-only', model: { provider: 'oneseven-test', model: 'local' } })
    expect(created.status, await created.clone().text()).toBe(201)
    const taskId = createdTaskReply.parse(await created.json()).value.id
    const run = await postJson(scaffold, `/dsh-taskboard/tasks/${taskId}/run`, {})
    const result = executionReply.parse(await run.json())
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true })
    await expect.poll(async () => (await readLedger(scaffold)).tasks.find((task: { id: string }) => task.id === taskId)?.executions[0]?.outcome).toBe('succeeded')
    expect(calls).toBe(1)
    const session = scaffold.ctx.sessions.get(SessionId(result.value.sessionId))!
    expect(session.snapshotEvents()).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'permission/preset', data: { preset: 'read-only' } })]))
    await page.getByRole('button', { name: '任务看板', exact: true }).click()
    await page.locator('.dsh-atb-panel').getByText('Local execution', { exact: true }).click()
    await expect.poll(() => page.locator('.dsh-atb-detail').innerText()).toContain('待验收')
    expect(tripwire.pageErrors).toEqual([])
    // Stable ledger fields derived from the real application's committed result.
    const task = (await readLedger(scaffold)).tasks.find((row: { id: string }) => row.id === taskId)!
    await compareOrRefreshGolden(fileURLToPath(new URL('./expected/oneseven/task-execution.expected.md', import.meta.url)), JSON.stringify({ title: task.title, status: task.status, permission: task.permission, outcome: task.executions[0]!.outcome, comments: task.comments.map((comment: { body: string }) => comment.body) }, null, 2), webSnapshotMode())
  } finally {
    releaseAdapter()
    try { await browser.close() } finally { await scaffold.close() }
  }
})
