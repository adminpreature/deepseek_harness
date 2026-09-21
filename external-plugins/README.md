# OneSeven external plugins

English | [中文](README.zh.md)

Private downstream adaptations for `dsh-v0.1.6-alpha.2`. These directories are maintained source, not the latest registry releases. They are outside the official publication workspaces. [provenance.json](provenance.json) records the source package versions and manifest digests; the original checkout and installed profile remain unchanged.

## Build and check

Run from the repository root after its frozen-lockfile install and build:

```sh
npm ci --prefix external-plugins --ignore-scripts --workspaces=false
node external-plugins/link-local.mjs
node external-plugins/build.mjs
pnpm exec tsc -b external-plugins/tsconfig.client.json external-plugins/tsconfig.host.json
node --import tsx --test external-plugins/tests/compatibility.test.mjs
DSH_SNAPSHOT=replay pnpm exec vitest run --config vitest.web.config.ts apps/web/tests/oneseven-external-plugins.e2e.ts
```

The linker checks exact dependency versions and refuses to replace a different existing link. Harness peers resolve to this checkout, React to its Web app, and the two leaf libraries to the private npm lockfile. The builder recreates only each plugin's generated `lib/` directory. Plaza and taskboard compile TypeScript; prompt-manager uses readable published JavaScript; skills-manager maintains readable published JavaScript and its pinned RPC metadata because complete original source was unavailable. Neither copied JavaScript plugin claims generated TypeScript declarations. No-op invariant companions were removed because these packages do not establish a separate runtime relationship to assert.

The browser suite installs the four local packages through the official managed-profile loader in isolated temporary homes. It never rewrites the user's installed profile. Persistent production profile initialization and container installation belong to the remaining Docker stage. Do not copy an old `node_modules` tree into the new application or run two hosts against the same data.

## Compatibility and behavior

| Plugin | Source version | Adaptation and verified surface | Limits |
|---|---|---|---|
| Skill Plaza | 0.1.0 | Official main/sidebar/input slots, default-preset catalog, localized interface, selected-session Lexical insertion, draft persistence after remount, no-session error, reversible styles | Inserts a slash invocation; it never sends a message automatically. |
| Taskboard | 0.6.4 | Official main/sidebar slots and session navigation, paired semantic colors, ledger CRUD, read-only permission before submission, local-adapter execution and settlement, scheduler capacity/stale-window negative controls | The local adapter is not a live model. Git isolation/merge and real-model scheduling still need separate end-to-end tests. |
| Prompt manager | 1.5.0 | Settings/input slots, durable local library, real prompt assembly after activation/removal, session isolation, cross-origin/remote write rejection | Active selections are live-host state; retaining the library does not promise active injection across a host restart. |
| Skill manager | 0.1.0-rc.3 | Literal settings namespace, strict Typert codec factories, file import/group creation/activation, provider discovery, reversible stylesheet | Published metadata declared MIT but included no standalone license file; public redistribution needs license verification. |

All four are checked individually for refresh and disable/re-enable, together for coexistence, and visually in both themes and at 390px. Snapshots cover the real Web profile and deterministic task result. Permission failures stop submission; codec adaptation retains malformed-payload rejection. TypeScript retains strict and exact-optional checks; explicit `undefined` in the legacy board's local state declarations describes its existing partial-update clearing behavior, not an exception to global checks.

Plaza and taskboard no longer query or hide the official conversation DOM. Shared Settings navigation wraps above full-width forms on narrow screens. The official file sidebar, tabs, terminal, Diff, plan and subagent components remain in the application. No agent-loop code or experimental-driver default is changed.

## Data and recovery

Tests own their temporary profile, workspace and data directories. The real task ledger, prompt library and skill-group settings have not been migrated. Keep old code, image, profile configuration and a stopped-host data copy together for rollback; new-format session data must not be opened by the old host without an explicitly supported downgrade. The [upgrade record](../.agents/notes/proposed/architecture/2026-09-21-oneseven-pinned-upgrade.md) tracks Docker and historical-data-copy work still outstanding. This directory is not a production rollout or rollback package.
