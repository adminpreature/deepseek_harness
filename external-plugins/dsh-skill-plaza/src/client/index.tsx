/** Skill catalog panel composed through the target release's reversible slots. */
import type { Context } from '@deepseek-ai/cordis'
import { useEffect, useState } from 'react'
import type { PropsRuntime, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import { createClient } from './api.ts'
import { SkillPlaza } from './SkillPlaza.tsx'
import { STYLES } from './styles.ts'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { en, zh, type PlazaKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { 'oneseven.skill-plaza': PlazaKey }
}

export const inject = ['slots', 'layout', 'sessions', 'conversation', 'locale']
export const name = 'dsh-skill-plaza/client'
const PANEL = 'oneseven-skill-plaza' as MainPanelId

/** Register the catalog without replacing the official conversation or sidebar. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('oneseven.skill-plaza', { zh, en }))
  const translate = ctx.locale.bind('oneseven.skill-plaza')
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.dshSkillPlaza = ''
    style.dataset.plugin = 'dsh-skill-plaza'
    style.dataset.pluginCss = 'dsh-skill-plaza/styles'
    style.textContent = STYLES
    document.head.append(style)
    return () => style.remove()
  }, 'skill-plaza: styles')
  const client = createClient()
  let pending: { sessionId: SessionId; skill: string } | undefined
  ctx.effect(() => () => { pending = undefined }, 'skill-plaza: pending selection')
  function InsertSelection({ sessionId, inputActions }: PropsRuntime<'conversation.input.left'>) {
    useEffect(() => {
      let mounted = true
      // The main panel unmounts the conversation's draft mirror. Deliver only
      // after the composer and its persistence effects have mounted again.
      queueMicrotask(() => {
        if (!mounted || !pending || pending.sessionId !== sessionId || !inputActions) return
        const selection = pending
        pending = undefined
        const binding = ctx.sessions.binding(selection.sessionId)
        if (!binding) return
        const state = ctx.conversation.input.for(binding.ctx).state.getSnapshot()
        if (state.phase !== 'plain') return
        inputActions.setDraft(`/${selection.skill} ${state.draft}`)
        ctx.conversation.input.for(binding.ctx).focus()
      })
      return () => { mounted = false }
    }, [sessionId, inputActions])
    return null
  }
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left', id: 'skill-plaza-selection',
  }, InsertSelection))
  function Panel({ t }: PropsLocale<'oneseven.skill-plaza'>) {
    const [error, setError] = useState('')
    return <div className="dsh-skp-page-container">
      {error && <p role="alert">{error}</p>}
      <SkillPlaza client={client} active t={t} onPick={name => {
        const ids = ctx.sessions.list.getSnapshot().ids.filter(id =>
          (ctx.sessions.retainInfo(id).getSnapshot().retainedBy.mainView ?? 0) > 0)
        if (ids.length !== 1) { setError(t('noSession')); return }
        const binding = ctx.sessions.binding(ids[0]!)!
        const input = ctx.conversation.input.for(binding.ctx)
        const state = input.state.getSnapshot()
        if (state.phase !== 'plain') { setError(t('busy')); return }
        // Preserve the selected session's existing draft and never submit it automatically.
        pending = { sessionId: ids[0]!, skill: name }
        ctx.layout.selectPanel(null)
      }} />
    </div>
  }
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL, locale: 'oneseven.skill-plaza' }, Panel))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist', id: PANEL, order: 30, label: () => translate('title'),
  }, () => <span aria-hidden="true">◇</span>))
}
