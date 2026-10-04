---
description: "OneSeven brand slots and paired palettes for the Web workbench; for users and maintainers of the branded distribution."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-brand-oneseven

English | [中文](README.zh.md)

## Summary

This private downstream package is not an official npm release member. OneSeven supplies the sidebar mark and name, the compact new-task mark, and paired light/dark tokens through the official client services. It preserves user theme preferences and the workbench's existing navigation, file review, terminals, plugins and session features. It contributes no model-visible behavior.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

The OneSeven Web bundle mounts this plugin instead of the official brand occupant. Appearance remains controlled by the existing Light, Dark and System settings. The bundle selects a dark default only for users without a saved theme; saved choices are never overwritten by this plugin.

### Shared components

The plugin owns the paired palette in `src/client/tokens.ts`. It supplies semantic color aliases and geometry variables to the existing primitives: 12px controls, 8px compact controls, 36px independent cards and 32px mobile composer cards. Structural rows and docked panes retain upstream geometry; error, success and syntax colors retain upstream semantics. The compact new-task prompt is a task entry, not a promotional Hero.

### Assets

The sidebar name and default Web build title are `Agents lite`; internal package identifiers and the supplied OneSeven mark remain unchanged. The branded Web app serves the mark under `/assets/`. Typography uses locally installed Alibaba PuHuiTi 400/500/600 faces, then the operating-system font stack. It downloads no font files. Devices without PuHuiTi use fallback glyphs; layout must tolerate their different metrics. Font subsetting and redistribution require a separately verified license; the deployment does not transform the supplied font binaries. The mark preserves its aspect ratio and inverts in dark mode. The Web build owns title, favicon and manifest metadata independently of the dynamic plugin.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

Each token provides both light and dark values to `theme.overrideTokens`; switching themes does not remount the conversation. Slot registration waits for declarations and follows their removal and redeclaration. The plugin fiber owns palette, dictionaries, stylesheet and page metadata; unloading restores previous metadata and removes its own contributions without writing settings.

**Runtime invariant:** No companion is published. Presentation is derived from the theme and slot registries; this package owns no independent runtime relationship to assert.

-----

<a id="model-experience"></a>
## Model Experience

None, as the plugin changes browser presentation only and adds no session events or model inputs.

#### KV Cache effect

None; provider requests are unchanged.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The asset URLs assume the bundled Web app is served at its supported root. Installing this package alone does not install the branded static assets.
- The plugin does not brand desktop-host operating-system chrome or change the retained DeepSeek provider names.
- External-plugin UI remains owned by each plugin; compatibility requires separate validation.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The [pinned upgrade record](../../../.agents/notes/proposed/architecture/2026-09-21-oneseven-pinned-upgrade.md) owns rollout status and acceptance evidence.

</details>
