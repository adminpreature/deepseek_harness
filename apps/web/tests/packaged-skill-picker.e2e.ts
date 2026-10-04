/** Packaged skill selection beside a replayed, persisted skill-tool conversation. */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { expect, it } from 'vitest'
import { SessionId } from '@deepseek-ai/dsh-session'
import { captureStableAria, compareOrRefreshGolden, launchWebScaffold, readPersistedEvents, seedSession, watchConsole, webSnapshotMode } from './scaffold.ts'
import { newEnglishPage } from './support.ts'

const fixture = fileURLToPath(new URL('../../../snapshots/session/skill-load/session.v3.jsonl', import.meta.url))
const expected = fileURLToPath(new URL('../../../snapshots/web/packaged-skill-picker/ui.expected.md', import.meta.url))

it('selects a packaged skill into a recorded conversation without changing its transcript', async () => {
  const scaffold = await launchWebScaffold({ profile: { packages: [{ dir: fileURLToPath(new URL('../../../external-plugins/dsh-skill-plaza', import.meta.url)), enabled: true }] } })
  const browser = await chromium.launch()
  try {
    const recording = await readFile(fixture, 'utf8')
    await seedSession(scaffold, recording, 'packaged-picker-replay')
    const before = await readPersistedEvents(scaffold, SessionId('packaged-picker-replay'))
    const page = await newEnglishPage(browser)
    const tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl)
    await page.locator('[role="treeitem"]').first().click()
    await page.locator('[role="treeitem"]').nth(1).click()
    const composer = page.locator('[data-composer-input][contenteditable="true"]')
    await composer.fill('Keep the next task in this draft.')
    await page.getByRole('button', { name: 'Skill', exact: true }).click()
    const picker = page.getByRole('dialog', { name: 'Choose a skill' })
    await picker.getByRole('searchbox').fill('meeting-minutes')
    await picker.getByRole('button', { name: /会议纪要 企业办公/ }).waitFor()
    expect(await page.title()).toMatch(/ — Agents lite$/)
    await compareOrRefreshGolden(expected, `Product: Agents lite\n${await captureStableAria(page, '.dsh-skp-picker', scaffold.workspaceCwd)}`, webSnapshotMode())
    await picker.getByRole('button', { name: /会议纪要 企业办公/ }).click()
    await expect.poll(() => composer.innerText()).toBe('/meeting-minutes Keep the next task in this draft.')
    await page.reload()
    await expect.poll(() => composer.innerText()).toBe('/meeting-minutes Keep the next task in this draft.')
    // Opening a seeded session appends its activation marker, but choosing a skill adds no transcript events.
    const after = await readPersistedEvents(scaffold, SessionId('packaged-picker-replay'))
    expect(after.filter(event => event.type !== 'session/end-seed')).toEqual(before.filter(event => event.type !== 'session/end-seed'))
    expect(tripwire.pageErrors).toEqual([])
  } finally {
    try { await browser.close() } finally { await scaffold.close() }
  }
})
