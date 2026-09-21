/** OneSeven presentation using official theme, localization and declaration-aware slots. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { OneSevenMark, OneSevenName } from './Brand.tsx'
import { en, zh, type BrandKey } from './locales.ts'
import { ONESEVEN_TOKENS } from './tokens.ts'
import css from './brand.css?inline'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** OneSeven brand copy in host-owned slots. */
    'oneseven.brand': BrandKey
  }
}

/** Services required for reversible brand presentation. */
export const inject = ['slots', 'theme', 'locale']

const NS = 'oneseven.brand'
const ID = '@deepseek-ai/dsh-client-ui-brand-oneseven'

/**
 * Layer paired palettes and brand occupants without writing the user's theme choice.
 * @param ctx - Client plugin context owning every registration and DOM effect.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.theme.overrideTokens(ID, ONESEVEN_TOKENS))
  ctx.effect(() => ctx.locale.register(NS, { zh, en }))
  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = ID
    tag.dataset.pluginCss = `${ID}/brand.css`
    tag.textContent = css
    document.head.appendChild(tag)
    const root = document.documentElement
    const metadata = { 'data-ui-brand': 'oneseven', 'data-ui-page-type': 'saas-ai-workspace', 'data-ui-visual-mode': 'standard', 'data-ui-hero': 'none', 'data-ui-card-material': 'solid' }
    const previous = Object.fromEntries(Object.keys(metadata).map(key => [key, root.getAttribute(key)]))
    for (const [key, value] of Object.entries(metadata)) root.setAttribute(key, value)
    return () => {
      tag.remove()
      for (const [key, value] of Object.entries(previous)) {
        if (value === null) root.removeAttribute(key)
        else root.setAttribute(key, value)
      }
    }
  })
  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', function* () {
      yield ctx.slots.register({ name: 'sidebar.brand.mark', locale: NS }, OneSevenMark)
      yield ctx.slots.register({ name: 'sidebar.brand.name', locale: NS }, OneSevenName)
    }))
  ctx.slots.inject('conversation.hero.brand.mark', () =>
    ctx.slots.register({ name: 'conversation.hero.brand.mark', locale: NS }, OneSevenMark))
}
