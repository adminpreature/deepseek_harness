/** Opt-in compatibility probes for exact registry packages in isolated Web profiles. */
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile, copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { it, expect } from 'vitest'
import { ToolCallId, MessageId, LlmAdapter, type GenerateOptions, type StreamChunk } from '@deepseek-ai/dsh-llm'
import { chromium } from 'playwright'
import { SessionId } from '@deepseek-ai/dsh-session'
import { launchWebScaffold, watchConsole } from './scaffold.ts'

const officeDir = process.env.DSH_OFFICE_TOOLKIT_TEST_DIR
const localRoot = fileURLToPath(new URL('../../../external-plugins/', import.meta.url))

it.skipIf(!officeDir).each([false, true])('runs Office tools and preserves files across host restart; existing plugins: %s', async (combined) => {
  const packages = [officeDir!, ...(combined ? ['dsh-skill-plaza', 'dsh-taskboard', 'dsh-prompt-manager', 'dsh-skills-manager'].map(name => localRoot + name) : [])].map(dir => ({ dir, enabled: true }))
  let scaffold = await launchWebScaffold({ profile: { packages } })
  const evidence = process.env.DSH_ONESEVEN_EVIDENCE_DIR
  if (evidence) await mkdir(evidence, { recursive: true })
  const saved = await mkdtemp(join(evidence ?? tmpdir(), 'office-artifacts-'))
  try {
    const names = ['office_read', 'office_query', 'office_write_docx', 'office_edit_docx', 'office_write_xlsx', 'office_edit_xlsx', 'office_fill_docx_template', 'office_convert']
    for (const name of names) expect(scaffold.ctx.tools.get(name), name).toBeDefined()
    let calls = 0
    const run = async (name: string, args: Record<string, unknown>) => {
      const result = await scaffold.ctx.tools.execute({ name, arguments: args, callId: ToolCallId(`office-test-${++calls}`), signal: new AbortController().signal })
      expect(result, JSON.stringify(result)).toMatchObject({ isError: false })
      return JSON.stringify(result)
    }
    const doc = join(scaffold.workspaceCwd, 'synthetic.docx')
    await run('office_write_docx', { path: doc, text: 'Synthetic office document. Fictional team only.' })
    expect(await run('office_read', { path: doc })).toContain('Synthetic office document')
    const xlsx = join(scaffold.workspaceCwd, 'synthetic.xlsx')
    await run('office_write_xlsx', { path: xlsx, sheets: [{ name: 'Synthetic', rows: [['Team', 'Amount'], ['Fictional A', 12], ['Fictional A', 8], ['Fictional B', 3]], header: true }] })
    expect(await run('office_read', { path: xlsx })).toContain('Fictional A')
    expect(await run('office_query', { path: xlsx, groupBy: ['Team'], aggregate: [{ col: 'Amount', fn: 'sum', as: 'Total' }] })).toContain('20')
    const template = join(scaffold.workspaceCwd, 'template.docx')
    const filled = join(scaffold.workspaceCwd, 'filled-copy.docx')
    await run('office_write_docx', { path: template, text: 'Team: {{team}}' })
    const original = await readFile(template)
    await run('office_fill_docx_template', { templatePath: template, outputPath: filled, data: { team: 'Fictional Team' } })
    expect(await run('office_read', { path: filled })).toContain('Fictional Team')
    expect(await readFile(template)).toEqual(original)
    for (const file of ['synthetic.docx', 'synthetic.xlsx', 'template.docx', 'filled-copy.docx']) {
      await copyFile(join(scaffold.workspaceCwd, file), join(saved, file))
    }
    await scaffold.close()
    scaffold = await launchWebScaffold({ profile: { packages } })
    expect(await run('office_read', { path: join(saved, 'filled-copy.docx') })).toContain('Fictional Team')
    expect(await run('office_query', { path: join(saved, 'synthetic.xlsx'), aggregate: [{ col: 'Amount', fn: 'sum', as: 'Total' }] })).toContain('23')
    if (combined) {
      const browser = await chromium.launch()
      let modelCalls = 0
      class LocalAdapter extends LlmAdapter {
        override async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
          options.signal?.throwIfAborted()
          modelCalls++
          yield { type: 'block-start', index: 0, blockType: 'text' }
          yield { type: 'text-delta', index: 0, text: 'Synthetic office conversation complete.' }
          yield { type: 'block-end', index: 0, block: { type: 'text', text: 'Synthetic office conversation complete.' } }
          yield { type: 'finish', reason: { kind: 'stop' } }
        }
      }
      const release = scaffold.ctx.llm.registerAdapter(['office-validation'], new LocalAdapter())
      try {
        const page = await browser.newPage({ locale: 'zh-CN' })
        const tripwire = watchConsole(page)
        await page.goto(scaffold.authenticatedUrl)
        await page.getByRole('button', { name: '任务看板', exact: true }).waitFor()
        await page.getByRole('button', { name: '技能广场', exact: true }).waitFor()
        await page.getByRole('button', { name: '设置', exact: true }).click()
        await page.getByRole('button', { name: '提示词管理', exact: true }).waitFor()
        await page.getByRole('button', { name: 'Skill 群', exact: true }).waitFor()
        const handle = await scaffold.ctx.agents.create({
          sessionId: SessionId('office-combined-check'),
          meta: { cwd: scaffold.workspaceCwd },
          agentOptions: { provider: 'office-validation', model: 'synthetic' },
          setup: scope => scaffold.ctx.agentPresets.mount(scope).then(() => undefined),
        })
        try {
          handle.agent.followup({ id: MessageId('office-test-message'), role: 'user', content: [{ type: 'text', text: 'Reply with the local synthetic result.' }], source: { kind: 'user' } })
          await handle.agent.whenIdle()
          expect(modelCalls).toBe(1)
          expect(JSON.stringify(handle.agent.session.snapshotEvents())).toContain('Synthetic office conversation complete.')
        } finally { await handle.dispose() }
        expect(tripwire.pageErrors).toEqual([])
      } finally { release(); await browser.close() }
    }
  } finally {
    await scaffold.close()
    if (!evidence) await rm(saved, { recursive: true, force: true })
  }
})
