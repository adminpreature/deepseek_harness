/** Host registration for the browser theme preference and pre-plugin palette. */

import z from '@deepseek-ai/schemastery'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-settings'
import { bootThemeInjections } from './boot-theme.ts'
import {
  DEFAULT_FONT_SIZE, DEFAULT_PREFERENCE, THEME_SETTINGS_NAMESPACE, THEME_PREFERENCES, createThemeSettingsSchema,
  type ThemePreference, type ThemeSettings,
} from './theme-settings.ts'

export {
  DEFAULT_FONT_SIZE, DEFAULT_PREFERENCE, FONT_SIZE_FIELD, FONT_SIZE_MAX, FONT_SIZE_MIN,
  THEME_PREFERENCE_FIELD, THEME_PREFERENCES, THEME_SETTINGS_NAMESPACE,
  type ThemePreference, type ThemeSettings,
} from './theme-settings.ts'

/** Deployment defaults; existing user settings always take precedence. */
export interface Config {
  /** Preference used only when the settings document has no selected theme. */
  defaultPreference: ThemePreference
}

/** Validated deployment defaults, retaining the upstream system default. */
export const Config: z<Config> = z.object({
  defaultPreference: z.union([...THEME_PREFERENCES]).default(DEFAULT_PREFERENCE),
})

const THEME_NAMESPACE = THEME_SETTINGS_NAMESPACE

/** Read the registered theme section or the schema defaults without a settings provider. */
function readSection(ctx: Context, defaultPreference: ThemePreference): { preference: ThemePreference; fontSize: number } {
  const fallback = { preference: defaultPreference, fontSize: DEFAULT_FONT_SIZE }
  const settings = ctx.get('settings')
  if (settings === undefined) return fallback
  const section = settings.get(THEME_NAMESPACE) as ThemeSettings | undefined
  if (section === undefined) return fallback
  return section
}

/**
 * Register the durable theme section when the optional settings service is
 * composed, and answer every index injection collection with the current
 * theme bootstrap row.
 * @param config - Validated preference default for new installations.
 * @param ctx - Host context that may acquire the settings service.
 */
export function apply(ctx: Context, config: Config = { defaultPreference: DEFAULT_PREFERENCE }): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(THEME_NAMESPACE, createThemeSettingsSchema(config.defaultPreference))
  })
  ctx.on('webserver/index-inject', (table) => {
    const section = readSection(ctx, config.defaultPreference)
    table.push(...bootThemeInjections(section.preference, section.fontSize))
  }, { prepend: true })
}
