# dsh-skill-plaza

English | [中文](README.zh.md)

The catalog uses official main/sidebar/input slots. The **Skill** button below the composer opens a searchable chooser; selecting a skill inserts `/slug ` before the current draft without sending it. Escape, Close and clicking outside dismiss the chooser without changing the draft. The full-page plaza preserves the selected session's draft across panel remounts.

## Packaged skills

The plugin ships 80 content-only skills in `skills/`: legal (12), science and life sciences (18), enterprise office (15), startup/marketing/e-commerce/operations (25), and decision advisers (10). Each original `SKILL.md` remains intact: `metadata.slug` is the invocation id, `name` is the Chinese display label, and the parent category supplies the plaza filter. Both interfaces search names and descriptions; the chooser also searches categories and invocation ids. Content remains Chinese in either interface language.

The reversible `oneseven-presets` provider registers these resources with `ctx.skills` at bundled precedence. Existing higher-priority skills can override matching ids. Missing resources, malformed metadata, empty bodies and duplicate ids fail plugin activation. Resources travel with the package and require no developer-machine path. Disabling the plugin removes its provider and both UI entries; existing recorded messages remain unchanged.

## Model Experience

The registry exposes skill descriptions to the existing model catalog. Explicit `/slug` invocation uses the existing host skill loader, which records the injected instructions in the session. Selection alone does not call a model. These skills analyze supplied materials and draft content; they grant no external-account access, execution permission or professional accreditation. Their original safety and human-review requirements remain in each body.

## Known Limitations and Deferred Work

The chooser and plaza browse the default preset's catalog, not a custom session preset's workspace-only skills. Selection does not install tools or submit a task. Updating the source folder outside this checkout does not update packaged resources automatically; copy and validate revised resources before rebuilding. Public redistribution rights for supplied content require separate confirmation.

See the [external plugin guide](../README.md) for build steps, source records, compatibility evidence and limits. This private downstream package neither changes the installed user profile nor authorizes public publication.
