/** Official panel slots own the board's layout and disposal. */
import { useEffect } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { BoardController } from './controller.ts'
import { TaskBoard } from './board/TaskBoard.tsx'
import { translate as t } from './i18n/runtime.ts'

/** Register the board and its navigation entry on the plugin fiber. */
export function mountPanel(ctx: Context, controller: BoardController): void {
  const id = 'oneseven-taskboard' as MainPanelId
  function Panel() {
    useEffect(() => {
      controller.openBoard()
      return () => controller.closeBoard()
    }, [])
    return <div className="dsh-atb-panel"><TaskBoard controller={controller} /></div>
  }
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: id }, Panel))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist', id, order: 31, label: () => t('shared.entry.label'),
  }, () => <span aria-hidden="true">▦</span>))
}
