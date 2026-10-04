/** Composer skill chooser; selection edits the draft without submitting it. */
import { useEffect, useRef, useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { PlazaSkillEntry, SkillPlazaClient } from './api.ts'
import { displayDescription, displayName } from './locales-zh.ts'

interface SkillPickerProps extends PropsLocale<'oneseven.skill-plaza'> {
  client: SkillPlazaClient
  disabled: boolean
  onPick: (name: string) => void
}

/**
 * Search the shared catalog from an accessible, keyboard-dismissible dialog.
 * @param props - Catalog access, localized labels and draft-only selection callback.
 * @returns The composer trigger and its native modal dialog.
 */
export function SkillPicker({ client, disabled, onPick, t }: SkillPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [skills, setSkills] = useState<readonly PlazaSkillEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const element = dialog.current!
    const anchor = trigger.current!.getBoundingClientRect()
    element.style.left = `${Math.max(8, Math.min(anchor.left, window.innerWidth - 368))}px`
    element.style.bottom = `${Math.max(8, window.innerHeight - anchor.top + 8)}px`
    element.showModal()
    return () => { element.close() }
  }, [open])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    client.list(controller.signal).then(rows => {
      if (controller.signal.aborted) return
      setSkills(rows)
      setLoading(false)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setError(error instanceof Error ? error.message : String(error))
      setLoading(false)
    })
    return () => { controller.abort() }
  }, [open, client, attempt])

  const search = query.trim().toLocaleLowerCase()
  const filtered = skills.filter(skill => [skill.displayName ?? displayName(skill.name, skill.name), skill.name,
    displayDescription(skill.name, skill.description), skill.category ?? ''].some(text => text.toLocaleLowerCase().includes(search)))

  return <>
    <button ref={trigger} type="button" className="dsh-skp-picker-trigger" disabled={disabled}
      aria-haspopup="dialog" aria-expanded={open} onClick={() => { setQuery(''); setOpen(true) }}>
      <span aria-hidden="true">◇</span> {t('picker')}
    </button>
    {open && <dialog ref={dialog} className="dsh-skp-picker" aria-label={t('chooseSkill')}
      onKeyDownCapture={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false) } }}
      onCancel={() => { setOpen(false) }} onClose={() => { setOpen(false) }}
      onClick={event => { if (event.target === event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect()
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setOpen(false)
      } }}>
      <div className="dsh-skp-picker-heading"><strong>{t('chooseSkill')}</strong>
        <button type="button" onClick={() => { setOpen(false) }} aria-label={t('close')}>×</button>
      </div>
      <input type="search" autoFocus className="dsh-skp-search" placeholder={t('search')} aria-label={t('search')}
        value={query} onChange={event => { setQuery(event.target.value) }} />
      <p className="dsh-skp-picker-hint">{t('manualSend')}</p>
      {loading ? <p role="status">{t('loading')}</p> : error ? <div role="alert">
        {t('loadError')}{error}<button type="button" onClick={() => { setAttempt(value => value + 1) }}>{t('retry')}</button>
      </div> : <div className="dsh-skp-picker-results">
        {filtered.length === 0 ? <p>{t('empty')}</p> : filtered.map(skill => <button type="button" key={skill.name}
          className="dsh-skp-picker-item" disabled={disabled} onClick={() => { onPick(skill.name); setOpen(false) }}>
          <span>{skill.displayName ?? displayName(skill.name, skill.name)}</span>
          {skill.category && <small>{skill.category}</small>}
          <span className="dsh-skp-picker-description">{displayDescription(skill.name, skill.description)}</span>
        </button>)}
      </div>}
    </dialog>}
  </>
}
