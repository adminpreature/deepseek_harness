/**
 * The Skill Plaza page: featured-scenes row, category tabs, search box, and
 * a responsive card grid over the live skill catalog. Purely read+invoke —
 * editing/importing skills is dsh-skills-manager's job, out of scope here.
 *
 * @module dsh-skill-plaza/client/SkillPlaza
 */
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { useEffect, useMemo, useState } from 'react'
import type { PlazaSkillEntry, SkillPlazaClient } from './api.ts'
import { displayDescription, displayName } from './locales-zh.ts'

/** Placeholder icon for a skill with no `metadata.icon` (or a non-emoji value). */
const GENERIC_ICON = '✨'

/** Curated slice size when no skill sets `metadata.featured`. */
const FEATURED_FALLBACK_COUNT = 4

/** Description truncation length for the card grid (full text stays in the title attribute). */
const DESCRIPTION_MAX = 88

const ALL_TAB = '__all__'
const UNCATEGORIZED_TAB = '__uncategorized__'

/** Truncate with an ellipsis at a word-safe-ish boundary; short text passes through untouched. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}…`
}

/** A short display icon: an emoji/short glyph from metadata, else the generic placeholder. */
function displayIcon(icon: string | undefined): string {
  if (icon === undefined) return GENERIC_ICON
  // "Recognizable emoji/short string" per spec: cap length so a stray long
  // metadata.icon value (e.g. an accidental URL) cannot blow up the card.
  return icon.length > 0 && icon.length <= 4 ? icon : GENERIC_ICON
}

interface CardProps extends PropsLocale<'oneseven.skill-plaza'> {
  skill: PlazaSkillEntry
  onInvoke: (name: string) => void
}

function SkillCard({ skill, onInvoke, t }: CardProps) {
  const name = displayName(skill.name, skill.name)
  const description = displayDescription(skill.name, skill.description)
  return (
    <button
      type="button"
      className="dsh-skp-card"
      onClick={() => { onInvoke(skill.name) }}
      title={description}
    >
      <div className="dsh-skp-card-head">
        <span className="dsh-skp-card-icon" aria-hidden="true">{displayIcon(skill.icon)}</span>
        <span className="dsh-skp-card-name">{name}</span>
      </div>
      <p className="dsh-skp-card-desc">{truncate(description, DESCRIPTION_MAX)}</p>
      {!skill.modelInvocable && <span className="dsh-skp-card-userOnly">{t('userOnly')}</span>}
      {skill.tags !== undefined && skill.tags.length > 0 && (
        <div className="dsh-skp-card-tags">
          {skill.tags.map(tag => <span key={tag} className="dsh-skp-card-tag">{tag}</span>)}
        </div>
      )}
    </button>
  )
}

interface FeaturedCardProps {
  skill: PlazaSkillEntry
  onInvoke: (name: string) => void
}

function FeaturedCard({ skill, onInvoke }: FeaturedCardProps) {
  const name = displayName(skill.name, skill.name)
  const description = displayDescription(skill.name, skill.description)
  return (
    <button type="button" className="dsh-skp-featured-card" onClick={() => { onInvoke(skill.name) }} title={description}>
      <span className="dsh-skp-featured-icon" aria-hidden="true">{displayIcon(skill.icon)}</span>
      <span className="dsh-skp-featured-name">{name}</span>
      <span className="dsh-skp-featured-desc">{description}</span>
    </button>
  )
}

export interface SkillPlazaProps extends PropsLocale<'oneseven.skill-plaza'> {
  client: SkillPlazaClient
  /** Invoked when the user picks a card; inserts `/name ` into the composer. */
  onPick: (name: string) => void
  /** Whether the panel is currently visible — refetches once each time it opens. */
  active: boolean
}

/**
 * The plaza's React root component: owns its own fetch (single-flight per
 * open, no session-keyed cache needed — this is a one-shot-per-open catalog
 * read, not a live input-trigger source).
 * @param props - the route client, the invoke callback, and the panel's active state.
 */
export function SkillPlaza({ client, onPick, active, t }: SkillPlazaProps) {
  const [skills, setSkills] = useState<readonly PlazaSkillEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState(ALL_TAB)

  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)
    client.list(controller.signal)
      .then(rows => { setSkills(rows); setLoading(false) })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
    return () => { controller.abort() }
    // Re-fetch every time the panel opens (active flips false→true): a new
    // skill directory added while the plaza was closed then shows up
    // without a full page reload, per the brief's "many more skills over
    // time" requirement — a one-shot-per-open fetch, not a poll.
  }, [active, client])

  const categories = useMemo(() => {
    const set = new Set<string>()
    let hasUncategorized = false
    for (const skill of skills) {
      if (skill.category === undefined) hasUncategorized = true
      else set.add(skill.category)
    }
    const sorted = [...set].sort((a, b) => a.localeCompare(b))
    return { sorted, hasUncategorized }
  }, [skills])

  const featured = useMemo(() => {
    const flagged = skills.filter(skill => skill.featured === true)
    if (flagged.length > 0) return flagged
    return skills.slice(0, FEATURED_FALLBACK_COUNT)
  }, [skills])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return skills.filter(skill => {
      if (activeTab === UNCATEGORIZED_TAB && skill.category !== undefined) return false
      if (activeTab !== ALL_TAB && activeTab !== UNCATEGORIZED_TAB && skill.category !== activeTab) return false
      if (q === '') return true
      const name = displayName(skill.name, skill.name)
      const description = displayDescription(skill.name, skill.description)
      return name.toLowerCase().includes(q) || description.toLowerCase().includes(q)
        || skill.name.toLowerCase().includes(q) || skill.description.toLowerCase().includes(q)
    })
  }, [skills, activeTab, query])

  return (
    <div className="dsh-skp-page">
      <div className="dsh-skp-header">
        <div>
          <h2 className="dsh-skp-title">{t('title')}</h2>
          <p className="dsh-skp-subtitle">{t('subtitle')}</p>
        </div>
        <input
          type="text"
          className="dsh-skp-search"
          placeholder={t('search')} aria-label={t('search')}
          value={query}
          onChange={(e) => { setQuery(e.target.value) }}
        />
      </div>

      {error !== undefined && <div className="dsh-skp-error">{t('loadError')}{error}</div>}
      {loading && <div className="dsh-skp-loading">{t('loading')}</div>}

      {!loading && error === undefined && (
        <>
          {featured.length > 0 && (
            <div className="dsh-skp-featured">
              <p className="dsh-skp-section-label">{t('featured')}</p>
              <div className="dsh-skp-featured-row">
                {featured.map(skill => <FeaturedCard key={skill.name} skill={skill} onInvoke={onPick} />)}
              </div>
            </div>
          )}

          <div className="dsh-skp-tabs">
            <button type="button" className="dsh-skp-tab" data-on={activeTab === ALL_TAB} onClick={() => { setActiveTab(ALL_TAB) }}>
              {t('all')}
            </button>
            {categories.sorted.map(category => (
              <button
                key={category}
                type="button"
                className="dsh-skp-tab"
                data-on={activeTab === category}
                onClick={() => { setActiveTab(category) }}
              >
                {category}
              </button>
            ))}
            {categories.hasUncategorized && (
              <button
                type="button"
                className="dsh-skp-tab"
                data-on={activeTab === UNCATEGORIZED_TAB}
                onClick={() => { setActiveTab(UNCATEGORIZED_TAB) }}
              >
                {t('uncategorized')}
              </button>
            )}
          </div>

          {filtered.length === 0
            ? <div className="dsh-skp-empty">{t('empty')}</div>
            : (
              <div className="dsh-skp-grid">
                {filtered.map(skill => <SkillCard key={skill.name} skill={skill} onInvoke={onPick} t={t} />)}
              </div>
              )}
        </>
      )}
    </div>
  )
}
