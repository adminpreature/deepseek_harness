/**
 * Plaza styles, injected as one global stylesheet with dsh-skp- prefixed
 * classes. Colors ride the shell's --dsw-* design tokens where available so
 * the plaza follows the active theme/skin, mirroring dsh-taskboard's own
 * styles.ts approach (including its ownership-tagging fix for the
 * "CSS randomly dropped" failure mode: a same-plugin re-apply must be able
 * to find and reuse its own untagged-at-birth style element).
 *
 * @module dsh-skill-plaza/client/styles
 */

/** The stylesheet text. */
export const STYLES = `
.dsh-skp-picker-trigger { display:inline-flex; align-items:center; gap:4px; padding:4px 8px; border:0; border-radius:6px; background:transparent; color:var(--dsw-alias-label-secondary); font:inherit; font-size:12px; cursor:pointer; white-space:nowrap; }
.dsh-skp-picker-trigger:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.dsh-skp-picker-trigger:disabled { opacity:.5; cursor:default; }
.dsh-skp-picker { position:fixed; top:auto; right:auto; margin:0; box-sizing:border-box; width:min(360px, calc(100vw - 16px)); max-height:min(440px, 65dvh); padding:14px; border:1px solid var(--dsw-alias-border-l2); border-radius:14px; color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-base); box-shadow:0 12px 40px #0003; overflow:auto; }
.dsh-skp-picker::backdrop { background:transparent; }
.dsh-skp-picker-heading { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:14px; }
.dsh-skp-picker-heading button { background:transparent; color:inherit; border:0; font-size:20px; cursor:pointer; }
.dsh-skp-picker .dsh-skp-search { width:100%; min-width:0; box-sizing:border-box; border-radius:8px; }
.dsh-skp-picker-hint { font-size:12px; color:var(--dsw-alias-label-secondary); margin:8px 0; }
.dsh-skp-picker-results { display:flex; flex-direction:column; gap:4px; }
.dsh-skp-picker-item { display:flex; flex-wrap:wrap; align-items:center; gap:4px 8px; flex:none; text-align:left; padding:10px; border:0; border-radius:8px; background:transparent; color:inherit; font:inherit; font-size:13px; cursor:pointer; }
.dsh-skp-picker-item:hover, .dsh-skp-picker-item:focus-visible { background:var(--dsw-alias-bg-layer-2); }
.dsh-skp-picker-item small { color:var(--dsw-alias-label-secondary); }
.dsh-skp-picker-description { flex-basis:100%; font-size:12px; color:var(--dsw-alias-label-secondary); line-height:1.5; }

.dsh-skp-page-container { height:100%; min-height:0; overflow:auto; color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-base); }

.dsh-skp-page { display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 20px 28px; gap: 18px; box-sizing: border-box; overflow-y: auto; }

.dsh-skp-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.dsh-skp-title { font-size: 20px; font-weight: 650; margin: 0; }
.dsh-skp-subtitle { font-size: 12.5px; color: var(--dsw-alias-label-secondary, gray); margin: 2px 0 0; }
.dsh-skp-search {
  font: inherit; font-size: 13px; padding: 8px 14px; border-radius: 999px; min-width: 240px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.32));
  background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,.06));
  color: var(--dsw-alias-label-primary, inherit);
}
.dsh-skp-search:focus { outline: none; border-color: var(--dsw-alias-brand-primary, #1f2328); }
.dsh-skp-search::placeholder { color: var(--dsw-alias-label-secondary, gray); }

.dsh-skp-featured { display: flex; flex-direction: column; gap: 10px; }
.dsh-skp-section-label { font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--dsw-alias-label-secondary, gray); margin: 0; }
.dsh-skp-featured-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; }
.dsh-skp-featured-card {
  flex: none; width: 220px; padding: 14px 16px; border-radius: 14px; cursor: pointer; text-align: left;
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-foreground); border: none; display: flex; flex-direction: column; gap: 6px;
  transition: transform .15s ease, box-shadow .15s ease;
}
.dsh-skp-featured-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,.18); }
.dsh-skp-featured-icon { font-size: 22px; line-height: 1; }
.dsh-skp-featured-name { font-size: 14px; font-weight: 600; }
.dsh-skp-featured-desc { font-size: 11.5px; line-height: 1.4; opacity: .88; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

.dsh-skp-tabs { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dsh-skp-tab {
  font: inherit; font-size: 12.5px; padding: 6px 14px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3));
  background: transparent; color: var(--dsw-alias-label-secondary, inherit);
  transition: border-color .12s ease, background .12s ease, color .12s ease;
}
.dsh-skp-tab:hover { border-color: var(--dsw-alias-border-l3, rgba(128,128,128,.55)); color: inherit; }
.dsh-skp-tab[data-on="true"] {
  border-color: transparent; color: #fff;
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary, #1f2328));
}

.dsh-skp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }
.dsh-skp-empty { font-size: 13px; color: var(--dsw-alias-label-secondary, gray); padding: 24px 4px; text-align: center; }

.dsh-skp-card {
  display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; border-radius: 12px; cursor: pointer;
  text-align: left; width: 100%; box-sizing: border-box; font: inherit; color: inherit;
  background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,.05));
  border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.2));
  box-shadow: 0 1px 2px rgba(0,0,0,.03);
  transition: border-color .12s ease, box-shadow .12s ease, transform .12s ease;
}
.dsh-skp-card:hover { border-color: var(--dsw-alias-border-l3, rgba(128,128,128,.5)); box-shadow: 0 4px 14px rgba(0,0,0,.08); transform: translateY(-1px); }
.dsh-skp-card-head { display: flex; align-items: center; gap: 10px; }
.dsh-skp-card-icon {
  flex: none; width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
  font-size: 17px; background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,.12));
}
.dsh-skp-card-name { font-size: 13.5px; font-weight: 600; line-height: 1.3; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsh-skp-card-desc {
  font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary, gray);
  overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
}
.dsh-skp-card-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-top: auto; }
.dsh-skp-card-tag {
  font-size: 10.5px; padding: 2px 8px; border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,.12)); color: var(--dsw-alias-label-secondary, gray);
}
.dsh-skp-card-userOnly {
  font-size: 10px; padding: 1px 7px; border-radius: 999px; align-self: flex-start;
  background: rgba(217,130,43,.15); color: #d9822b;
}

.dsh-skp-error { font-size: 12.5px; color: #e5484d; padding: 10px 14px; border-radius: 8px; background: rgba(229,72,77,.1); }
.dsh-skp-loading { font-size: 12.5px; color: var(--dsw-alias-label-secondary, gray); padding: 24px 4px; text-align: center; }
`

/** Style element id (stable hook for tests and debugging). */
const STYLE_ID = 'dsh-skill-plaza-styles'

/**
 * Ownership tag for the shell's client-module bookkeeping. The web shell
 * claims every UNTAGGED `<style>` for whichever plugin module materializes
 * next, and the client HMR driver deletes `<style>
.dsh-skp-page :is(button, input):focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px; }
@media (max-width: 600px) {
  .dsh-skp-page { padding: 16px; }
  .dsh-skp-search { min-width: 0; width: 100%; box-sizing: border-box; }
  .dsh-skp-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .dsh-skp-page * { transition: none; }
  .dsh-skp-featured-card:hover { transform: none; }
}
` tags by this attribute
 * on every rebuilt entry — see dsh-taskboard's styles.ts for the field
 * report this pre-tagging fixes (CSS randomly dropped until refresh).
 */
const PLUGIN_ID = 'dsh-skill-plaza'

/** Per-stylesheet identity, mirroring the shell's own data-plugin-css. */
const CSS_TAG = 'dsh-skill-plaza/styles'

/**
 * Ensure the stylesheet lives in <head>: create when absent, re-attach when
 * removed, always carry the ownership tags.
 */
export function injectStyles(): void {
  if (typeof document === 'undefined') return
  let style = document.getElementById(STYLE_ID)
  if (style === null) {
    style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = STYLES
    document.head.append(style)
  }
  style.dataset.plugin = PLUGIN_ID
  style.dataset.pluginCss = CSS_TAG
}
