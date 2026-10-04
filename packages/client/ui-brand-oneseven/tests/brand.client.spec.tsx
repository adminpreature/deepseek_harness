// @vitest-environment jsdom
import { Context } from '@deepseek-ai/cordis'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { en, zh } from '../src/client/locales.ts'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
import { stubSettingsScope } from '@deepseek-ai/dsh-client-test-runtime'
import type { ThemeSettings } from '@deepseek-ai/dsh-client-ui-theme/client'
import { apply, inject } from '../src/client/index.ts'
import { OneSevenMark, OneSevenName } from '../src/client/Brand.tsx'
import { ONESEVEN_TOKENS } from '../src/client/tokens.ts'

const translate = (key: string) => (zh as Record<string, string>)[key] ?? key

const holes = ['sidebar.brand.mark', 'sidebar.brand.name', 'conversation.hero.brand.mark'] as const
const contexts: Context[] = []
afterEach(async () => { cleanup(); for (const ctx of contexts.splice(0)) await ctx.fiber.dispose() })

async function bench() {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(SlotRegistry).await()
  const host = stubSettingsScope<ThemeSettings>()
  const theme = new ThemeRuntime(ctx, host.scope)
  ctx.provide('theme', theme)
  ctx.provide('locale', new LocaleRuntime(ctx))
  return { ctx, theme, host }
}

describe('OneSeven brand', () => {
  it('uses Agents lite in both interface languages', () => {
    for (const dictionary of [zh, en]) expect(dictionary).toEqual({ name: 'Agents lite', label: 'Agents lite' })
  })
  it('supplies both palette values for every override and never writes the preference', async () => {
    const { ctx, theme, host } = await bench()
    await ctx.plugin({ inject: [...inject], apply }).await()
    for (const mode of ['light', 'dark'] as const) {
      host.publish({ status: 'ready', value: { preference: mode, fontSize: 14 }, revision: mode === 'light' ? 1 : 2, writable: true })
      expect(theme.getTheme().active.colorScheme).toBe(mode)
      for (const [key, pair] of Object.entries(ONESEVEN_TOKENS)) {
        expect(pair[mode]).not.toBe('')
        expect(theme.getTheme().active.tokens[key]).toBe(pair[mode])
      }
    }
    expect(host.set).not.toHaveBeenCalled()
  })

  it('waits for slot declarations and releases occupants, tokens and style on unload', async () => {
    const { ctx, theme } = await bench()
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    for (const name of holes) expect(ctx.slots.entries(name)).toHaveLength(0)
    const declare = () => ctx.slots.register({
      name: 'root', children: Object.fromEntries(holes.map(name => [name, { kind: 'single', scope: 'root' }])),
    } as never, () => null)
    const release = declare()
    await Promise.resolve()
    for (const name of holes) expect(ctx.slots.entries(name)).toHaveLength(1)
    expect(document.documentElement.dataset.uiBrand).toBe('oneseven')
    expect(document.documentElement.dataset.uiPageType).toBe('saas-ai-workspace')
    expect(document.documentElement.dataset.uiVisualMode).toBe('standard')
    expect(document.querySelectorAll('style[data-plugin="@deepseek-ai/dsh-client-ui-brand-oneseven"]')).toHaveLength(1)
    release()
    for (const name of holes) expect(ctx.slots.entries(name)).toHaveLength(0)
    declare()
    await Promise.resolve()
    for (const name of holes) expect(ctx.slots.entries(name)).toHaveLength(1)
    await fiber.dispose()
    expect(theme.getTheme().active.tokens).toEqual({})
    expect(document.documentElement.dataset.uiBrand).toBeUndefined()
    expect(document.querySelectorAll('style[data-plugin="@deepseek-ai/dsh-client-ui-brand-oneseven"]')).toHaveLength(0)
    for (const name of holes) expect(ctx.slots.entries(name)).toHaveLength(0)
  })

  it('renders the supplied logo without distortion at each requested size', () => {
    const view = render(<OneSevenMark size={24} t={translate} />)
    const image = view.getByRole('img', { name: 'Agents lite' })
    expect(image.getAttribute('width')).toBe('24')
    expect(image.getAttribute('height')).toBe('24')
    view.rerender(<OneSevenMark size={34} t={translate} />)
    expect(image.getAttribute('width')).toBe('34')
    view.unmount()
    expect(render(<OneSevenName t={translate} />).getByText('Agents lite')).toBeTruthy()
  })
})

/** WCAG relative luminance for the opaque palette values under test. */
function luminance(hex: string): number {
  const rgb = [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
  const linear = rgb.map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722
}

it.each(['light', 'dark'] as const)('keeps small text and actions readable in %s', (mode) => {
  const tokens = ONESEVEN_TOKENS
  const pairs = [
    [tokens['--dsw-alias-label-primary'][mode], tokens['--dsw-alias-bg-base'][mode]],
    [tokens['--dsw-alias-label-secondary'][mode], tokens['--dsw-alias-bg-layer-1'][mode]],
    [tokens['--dsw-alias-label-caption'][mode], tokens['--dsw-alias-bg-layer-2'][mode]],
    [tokens['--dsw-alias-link'][mode], tokens['--dsw-alias-bg-layer-2'][mode]],
    [tokens['--dsw-alias-label-primary-foreground'][mode], tokens['--dsw-alias-button-primary-fill'][mode]],
    [tokens['--dsw-alias-label-primary-foreground'][mode], tokens['--dsw-alias-button-primary-hover'][mode]],
  ]
  for (const [foreground, background] of pairs) {
    const light = luminance(foreground!)
    const dark = luminance(background!)
    expect((Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05)).toBeGreaterThanOrEqual(4.5)
  }
})
