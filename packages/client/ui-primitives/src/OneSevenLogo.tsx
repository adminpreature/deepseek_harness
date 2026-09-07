import type { IconProps } from './icons/props.ts'
import css from './OneSevenLogo.module.css'

/**
 * Render the OneSeven logo, swapping to the white variant under
 * `body[data-ds-dark-theme]` (ui-layout's ThemePresenter DOM contract).
 * @param props.size - height in px (default 32; width auto-scales to maintain aspect ratio).
 * @param props.className - extra class for layout placement.
 * @returns the logo image (aria-hidden decorative brand art).
 */
export function OneSevenLogo({ size = 32, className }: IconProps) {
  const style = { height: size, width: 'auto', objectFit: 'contain' as const }
  return (
    <span className={`${css.root} ${className ?? ''}`}>
      <img
        src="/assets/oneseven-logo.png"
        alt="OneSeven"
        className={css.light}
        style={style}
        aria-hidden="true"
      />
      <img
        src="/assets/oneseven-logo-dark.png"
        alt="OneSeven"
        className={css.dark}
        style={style}
        aria-hidden="true"
      />
    </span>
  )
}
