/** Brand artwork in host-owned slots, independent of workbench geometry. */
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'

/**
 * Fit the supplied artwork inside the host's requested dimensions.
 * @param props - Host dimensions and the brand translator.
 * @returns an aspect-preserving mark with a localized accessible name.
 */
export function OneSevenMark({ size, t }: SidebarBrandMarkOwnerProps & PropsLocale<'oneseven.brand'>) {
  return <img className="oneseven-brand-mark" src="/assets/oneseven-logo.png" width={size} height={size} alt={t('name')} />
}

/**
 * Render the brand name without duplicating the independently slotted mark.
 * @param props - Brand translator supplied by the slot registry.
 * @returns the OneSeven wordmark.
 */
export function OneSevenName({ t }: PropsLocale<'oneseven.brand'>) {
  return <span className="oneseven-brand-name">{t('name')}</span>
}
