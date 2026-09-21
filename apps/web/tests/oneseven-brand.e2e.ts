/** OneSeven presentation through the shipped Web profile, without live model calls. */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  captureStableAria, compareOrRefreshGolden, launchWebScaffold,
  watchConsole, webSnapshotMode, type WebScaffold,
} from './scaffold.ts'
import { newEnglishPage } from './support.ts'

const EXPECTED = fileURLToPath(new URL('./expected/oneseven/brand.expected.md', import.meta.url))
const evidence = process.env.DSH_ONESEVEN_EVIDENCE_DIR

/** Save optional local visual evidence separately from the replay golden. */
async function screenshot(page: Page, name: string): Promise<void> {
  const domEvidence = process.env.DSH_ONESEVEN_DOM_EVIDENCE_DIR
  if (domEvidence !== undefined && name.startsWith('chat-') && !name.includes('mobile')) {
    const html = await page.evaluate(() => {
      const root = document.documentElement.cloneNode(true) as HTMLElement
      for (const script of root.querySelectorAll('script')) script.remove()
      return `<!doctype html>${root.outerHTML}`
    })
    await mkdir(domEvidence, { recursive: true })
    await writeFile(join(domEvidence, `${name}.html`), html)
  }
  if (evidence === undefined) return
  await mkdir(evidence, { recursive: true })
  await page.screenshot({ path: join(evidence, `${name}.png`), fullPage: true })
}

describe('web e2e: OneSeven paired themes', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>
  beforeAll(async () => {
    scaffold = await launchWebScaffold({})
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    tripwire = watchConsole(page)
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.locator('html[data-ui-brand="oneseven"]').waitFor({ timeout: 30_000 })
  }, 120_000)
  afterAll(async () => {
    try { await browser?.close() } finally { await scaffold?.close() }
  })

  it('renders the supplied brand and a task entry, not the promotional heading', async () => {
    expect(await page.title()).toBe('OneSeven / 壹柒')
    await page.getByText('Start a task', { exact: true }).waitFor({ timeout: 15_000 })
    expect(await page.locator('body').getAttribute('data-ds-dark-theme')).not.toBeNull()
    expect(await page.getByText('Into the Unknown', { exact: true }).count()).toBe(0)
    const image = page.getByRole('img', { name: 'OneSeven', exact: true }).first()
    expect(await image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
    await compareOrRefreshGolden(EXPECTED, await captureStableAria(page, '[class*="headline"]', scaffold.workspaceCwd), webSnapshotMode())
  })

  it('does not download full font files in fresh English and Chinese contexts', async () => {
    for (const locale of ['en-US', 'zh-CN']) {
      const context = await browser.newContext({ locale })
      try {
        const coldPage = await context.newPage()
        const requests: string[] = []
        coldPage.on('request', (request) => {
          if (request.resourceType() === 'font') requests.push(request.url())
        })
        await coldPage.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
        await coldPage.locator('html[data-ui-brand="oneseven"]').waitFor()
        await coldPage.evaluate(() => document.fonts.ready)
        expect(requests).toEqual([])
        expect(await coldPage.locator('body').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Alibaba PuHuiTi')
        expect(await coldPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      } finally {
        await context.close()
      }
    }
  }, 60_000)

  it('persists both palettes through Settings, refresh and narrow-screen rendering', async () => {
    for (const [mode, label, background] of [
      ['light', 'Light', 'rgb(247, 247, 249)'],
      ['dark', 'Dark', 'rgb(9, 9, 11)'],
    ] as const) {
      await page.getByRole('button', { name: 'Settings', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Settings', exact: true })
      await dialog.getByRole('button', { name: label, exact: true }).click()
      await expect.poll(() => scaffold.ctx.settings.get('ui-theme')).toMatchObject({ preference: mode })
      await expect.poll(() => page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(background)
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(mode)
      expect(await dialog.getByRole('button', { name: label, exact: true }).getAttribute('aria-pressed')).toBe('true')
      await screenshot(page, `settings-${mode}`)
      await page.keyboard.press('Escape')
      await screenshot(page, `chat-${mode}`)
      await page.reload({ waitUntil: 'load' })
      await page.locator('html[data-ui-brand="oneseven"]').waitFor()
      await expect.poll(() => page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(background)
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(mode)
      await page.setViewportSize({ width: 390, height: 844 })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await screenshot(page, `chat-mobile-${mode}`)
      await page.setViewportSize({ width: 1680, height: 1000 })
    }
    expect(tripwire.pageErrors).toEqual([])
  }, 60_000)
})
