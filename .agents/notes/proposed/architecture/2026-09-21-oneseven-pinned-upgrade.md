# Agent Note: OneSeven upgrade on a pinned official release

Status: proposed

English | [中文](2026-09-21-oneseven-pinned-upgrade.zh.md)

## Problem

OneSeven must retain the complete official `dsh-v0.1.6-alpha.2` application while reapplying branding, four external plugins, and Docker deployment. Copying the old frontend or assembling upstream features on the old base would discard newer Session, sidebar, and plugin-lifecycle behavior.

## Proposal

Use the official tag as the immutable source baseline; migrate owned customizations as separate, reviewable changes. Keep the original checkout, dirty skill workspace, credentials, and runtime data outside the upgrade branch. The user approved the visual proposal and requires complete light and dark theme support. Do not commit, push, merge, or deploy without separate authorization.

### Verified provenance

| Item | Evidence |
|---|---|
| Target | `dsh-v0.1.6-alpha.2`, exact commit recorded in private `evidence/provenance.json`; lightweight tag, release published 2026-09-17. Git ref and release API agree. |
| Original | `codex/docker-deploy`, `evidence/provenance.json:originalHead`; origin remains the adminpreature/deepseek_harness repository. |
| Ancestry | Full, non-shallow target history; `git merge-base --all codex/docker-deploy dsh-v0.1.6-alpha.2` exits 1. Upgrade branch starts at the tag; no unrelated-history merge. |
| Initial import | the initial import and its official equivalent (both recorded in private provenance) have identical tree `f904efab9ef435201d6ba4da88a34d6366568272`; zero file differences. No hidden customization in the imported tree. |
| Working skill | Version 3.2.0, 14 tracked modifications and 21 untracked files, saved separately; all 35 file hashes match the untouched original. |

### Customization inventory

Audit labels below map to the exact commit IDs in the private `commit-*.txt` evidence files; maintained repository prose uses release tags rather than commit references.

| Commit | Owned change | Migration disposition |
|---|---|---|
| `theme` | Logo, fonts, theme variables, component styles, browser metadata | Reimplement via target brand slots and centralized tokens; no directory overwrite. |
| `ui-spec` / `brand-skill` | UI specification / brand skill | Keep original specification as reference; working skill is a separate preserved artifact, not silently committed. |
| `theme-merge` | Theme merge | No independent migration unit; covered by its source commits. |
| `docker-base` / `docker-plugins` | Docker, entrypoint, profile seed, skill-plaza | Rebuild against the target toolchain and native/system; pin plugin artifacts and remove reliance on ignored host builds. |
| `composer-ring` | No-workspace dashed ring removal | Keep the quiet empty state without removing workspace selection or keyboard affordances. |
| `welcome-notice` | Internal-testing welcome notice removal | Review target onboarding by purpose; preserve provider setup, safety disclosures, and permissions. |

### Capability and component map

The release notes were read directly, then checked against the target source and package READMEs. The map identifies owners, not a promise that all journeys have already passed runtime tests.

| Existing area | Target owner | Preservation rule |
|---|---|---|
| Sidebar / workspace rows | `ui-sidebar`, `ui-workspace` | Preserve directory grouping, search, selection, archive/restore, drag sizing. |
| Brand mark and empty state | `ui-brand-official`, generic brand slots, `ui-conversation` | Supply OneSeven slot occupants; retain No Hero without hiding task controls. |
| Chat / composer / attachments | `ui-conversation`, `ui-chat`, `ui-session`, `ui-attachment`, `file-upload` | Keep Lexical, menu keys, send/stop/FIFO queue, context usage, permissions, attachment errors. |
| Old DetailsPanel | `ui-sidebar-right`, `ui-dockkit` | Do not restore the old single panel: retain multiple tabs, splits, floating/fullscreen modes and per-session persisted layouts. |
| Files / Diff / deliverables | `ui-sidebar-files`, `ui-sidebar-documentpreview`, `ui-deliverables` | Retain tree, file-by-file review, document preview including Office; no invented apply-all write action. |
| Terminal / URL preview | `ui-sidebar-terminal`, `ui-sidebar-browser` | Preserve terminal reconnect and draft-session access; URL preview is distinct from agent browser/computer drivers. |
| Plans / subagents | `ui-plan`, `ui-subagent`, Session references | Preserve approval, child-session retention/release and continuation/stop controls. |
| Settings / plugin inventory | `ui-settings-general`, `ui-plugin-manager`, `ui-settings-plugins` | Keep global Plugins navigation and configuration slots; preview grouping does not authorize moving routes or merging stores. |

### Visual proposal

Confirmed: OneSeven / 壹柒; AI workbench with operations-management secondary pages; No Hero; both themes and narrow screens. Approved: standard mode, solid material, dark initial default without overwriting a saved user preference. Reuse React, existing primitives, slots, and CSS; do not add a motion library.

| Token role | Dark | Light / shared |
|---|---|---|
| Page / surface / raised | `#09090B` / `#141418` / `#1B1B20` | `#F7F7F9` / `#FFFFFF` / `#FFFFFF` |
| Text / secondary / border | `#F5F5F7` / `#B8B8C0` / `#2E2E35` | `#1B1B20` / `#565660` / `#DCDCE3` |
| Brand / readable accent | `#9A6ABA` / `#BD96D7` | `#9A6ABA` / `#68447F` |
| Primary action | `#68447F` background, white label | Same; contrast 7.72:1. White on raw brand purple is only 4.08:1. |
| Type | Alibaba PuHuiTi 400/500/600; monospace for code | Page title 20–24px, panel 16–18px, body/control 13–16px; do not preload every full CJK font. |
| Geometry | Independent cards 36px; mobile 32px | Docked panels and rows are structural, not cards; controls 8–12px; spacing 4/8/12/16/24/32px. |
| Motion / state | Immediate high-frequency actions; optional 100–160ms feedback | Preserve reduced-motion, visible focus, non-color status labels, error/retry and loading states. |

Keep one token owner in `ui-brand-oneseven`, managed by the official `ui-theme` registry and mapped into existing `--dsw-*` roles; use `ui-primitives` for buttons, forms, tabs, status labels and menus. Do not duplicate app-level and package-level themes or mass-replace semantic error/Diff colors. Brand assets fill supported slots and browser title/manifest settings rather than modifying agent-loop.

### Specification conflicts

| Conflict | Approved resolution |
|---|---|
| Working skill 3.2.0 defaults to showcase; existing spec is task-focused No Hero. | Standard solid workbench; no glass, Three.js, GSAP, or automatic dependency change. |
| Old theme uses 24px mobile cards and blurred shadows; working skill requires 28–36px mobile cards and solid treatment. | 32px independent mobile cards; structural rows/panes remain compact; solid separators rather than decorative blur. |
| Old spec permits 12–16px small cards; working skill rejects a second small-card system. | Distinguish controls/rows from real cards; do not wrap every tool row in a card. |
| Old spec says CSS-only/no TSX edits; target exposes brand slots and uses Lexical plus multiple Session views. | Minimal brand-slot and plugin adaptation is allowed; business logic and framework stay intact. |
| Old token/fonts exist in multiple layers; raw purple with white small text misses 4.5:1. | One semantic token owner, explicit font weights, darker action purple; verify rendered states. |

### External plugins

| Plugin | Verified local version / evidence | Compatibility work remaining |
|---|---|---|
| `dsh-skill-plaza` | 0.1.0; linked local source matches the repository source. Host route uses effects; client queries `textarea[data-phase]` and observes DOM. Target composer uses Lexical. | Known insertion incompatibility: bind a concrete Session/composer, replace DOM entry with supported slots, dispose CSS/observers/listeners on disable. Rebuild source; ignored lib is not a reproducible artifact. |
| `dsh-taskboard` | 0.6.4; compatibility declaration only names releases through 0.1.2-alpha.4. | Check DOM entry, Session commands, task persistence, cancel/recovery, disable/re-enable and duplicate mounts. No target compatibility claim yet. |
| `dsh-prompt-manager` | 1.5.0; owns `/prompt-manager` route, Cordis peer `^4.0.1`. | Verify insertion into the intended Lexical composer, storage, route disposal, styles and reconnect. |
| `@baikai233/dsh-skills-manager` | 0.1.0-rc.3; client injects old runtime/settings/remotes modules; many `^0.1.0-rc.7` peers. | Verify module availability, target settings/plugin slots, singleton service resolution and enable/unload. Adapt or offer an explicit retained-but-disabled option if impossible. |

Keep all four on the migration inventory. Disabled switches in the preview are illustrative pending-verification states, not permission to remove or disable users’ installed plugins. The local profile uses two caret ranges; deployment must resolve and lock actual artifacts without silently upgrading them.

### Deployment and data

Observed local storage: `~/.dsh/sessions/**/session.jsonl.zstd`, JSON workspace/projection storage, plugin JSON/files, profiles, settings, and credential files. Credentials and content were not printed or put in the branch. This is local evidence, not evidence of the production volume backend. Target `SESSION_FORMAT_VERSION` is 3; only a copied historical session may be read for migration tests.

Docker adaptation must include the target native build and lockfile, source-built plaza, exact external plugin packages, and an idempotent profile reconciliation that preserves user patches and disabled flags. The old entrypoint only seeds a missing package.json and never reconciles an existing volume. The old Dockerfile expects ignored plaza lib/node_modules and uses `|| true` around checks; do not copy these failure-hiding assumptions.

A process listening on container loopback is not reachable through ordinary bridge port publishing; verify the chosen proxy/network path instead of trusting the old comment. Target webserver supports deliberate non-loopback listening but does not itself supply server-wide authentication. Bind host ports to loopback, retain target token/trust controls and an authenticated TLS proxy, never widen privileges or trusted hosts by default.

Before migration, identify the actual instance, image digest, volume mount and backend, quiesce writers, and privately back up the old image, configuration, plugin files and the complete pre-upgrade data. Start the new instance on a separate copy. Rollback stops the new writer, restores old code/image/config and the pre-upgrade volume together, then runs read/write smoke tests. Never downgrade by pointing the old binary at the new volume, even if predecessor session generations remain. Production identity and rollback rehearsal remain unverified.

## Alternatives considered

**Merge current development master:** rejected because the requested fixed release is the acceptance baseline. **Merge unrelated histories:** rejected because there is no common ancestor and the initial-import tree is identifiable exactly. **Copy the old frontend:** rejected because Session factories, Lexical, right-sidebar tabs and plugin lifecycle changed. **Showcase-first branding:** not recommended for this task-focused No Hero workbench; requires explicit approval and a separate dependency/performance decision.

## Acceptance criteria

The execution record below is the single task queue. Status is as of 2026-09-21; passing baseline tests does not mean customization, Docker or historical data migration is complete.

| Phase | Status and evidence | Next action / blocker |
|---|---|---|
| 1. Protect | Done: private bundle verifies; working-file and whole-skill archives saved; original status and 35 hashes unchanged. | Keep restore in a new directory; no destructive cleanup. |
| 2. Provenance | Done: full history, no common ancestor, exact initial tree match; upgrade branch at target SHA. | Do not fetch a moving master as upgrade input. |
| 3. Baseline | Frozen install, full build, 4 unit files / 79 tests, one bash-tool-turn replay, cold-blank-session and session-unarchive browser tests passed. | Full feature acceptance remains a later stage; logs are private local evidence. |
| 4. Design | Three groups, dark/light desktop and narrow chat previews; static skill validator passes with zero issues. | Visuals approved on 2026-09-21; both themes require acceptance tests; previews are not application tests. |
| 5. Implement | In progress: paired brand theme implemented and tested; external plugins and deployment pending. | Central theme/brand, four plugin adapters, Docker/profile initialization as separate change units; README/JSDoc and snapshots alongside behavior changes. |
| 6. Data | Local JSONL backend observed; production identity and consistent data backup unverified. | Test first boot and an existing-volume copy, migration failure and rollback; no concurrent writers. |
| 7. Acceptance | Partial baseline only. | Send/stop/queue, upload, preview/Office, Diff, terminal/reload, plugin install/config/disable/unload, four external plugins, subagents, plans, archive/restore and refresh. |
| 8. Deliver | No commits or deployment. | Ship branch/SHA, customization and compatibility inventories, actual before/after screenshots, test results and migration/rollback instructions after acceptance. |

Use the target scripts, not historical commands: focused `vitest run` units; `test:snapshot` for recorded Session changes; the `vitest.web.config.ts` browser lane in replay mode; `build` and applicable `hygiene` for shipped artifacts; `test:docs`, scoped note/pair checks and applicable `doc-sync` for documentation. Do not silently record/refresh fixtures, run the exhaustive coverage/platform matrix by default, or describe model/SSH/browser-driver checks as passed without their prerequisites.


### Brand implementation checkpoint

The private `ui-brand-oneseven` plugin owns paired tokens, localized brand occupants and reversible DOM styles/metadata. The upstream theme registry, primitives, docked panels and agent loop remain in place. `ui-theme` accepts a validated deployment default; the OneSeven composition chooses dark for an unset preference and retains saved choices. Default root builds pass the same OneSeven title/profile to the shell and dynamic bundles. The new package is explicitly excluded from official npm publication and marked private; neighboring official packages retain their publication checks. This is a local-build distribution, not an authorization to publish the upstream release family.

The new-task heading is task-oriented. Public assets reuse the original logo. Typography now resolves local PuHuiTi faces with a system fallback and downloads no font binaries; this avoids distributing transformed fonts without verified permission. Brand palette layers and locale/slot registrations leave with their plugin fiber. Public README/JSDoc, generated configuration/slot catalogs and keyless UI expectations accompany these changes.

Verified in the customized build: 123 focused theme/conversation/build-environment unit tests, 21 package-publication-policy tests, full build, all 16 hygiene gates, and focused lint. Browser replay covers both themes, settings persistence across page reload, 390px layout, file/Office previews and preview themes, Diff, terminal processes and palettes, archived-session restore, pending-queue editing, upload, send/cancel/error/retry, built-in plugin management and subagent conversations. These are keyless fixture/local-process checks, not live-model or production results. Terminal goldens deliberately change to the approved palette; program-supplied ANSI colors and readable cursors remain asserted. Actual screenshots are separate from the earlier static design preview.

Initial browser failures identified assumptions about the old light default and exact upstream colors; explicit test setup and reviewed palette expectations resolve them. A compiler-face registration error temporarily emitted 56 build files beside unrelated source files; these generated outputs were quarantined in private evidence after fixing the new browser test's host/client project membership. No original worktree files were removed.

The quality audit found an uncovered old-palette expectation in seeded history and three full font downloads. The context-disclosure case now checks both approved palettes and restores settings and expansion in a finally block. The unchanged downstream ARIA goldens pass. Fresh English and Chinese browser contexts assert zero font requests. After the corrections, a full build and four browser files passed (27 checks, one record-only skip). Earlier passing checks did not cover these omissions.

Remaining: Docker image and entrypoint, profile initialization for new/existing volumes, historical-data-copy migration and rollback rehearsal, and remaining acceptance states. No production configuration, data volume, experimental-driver default, commit or push has changed. This checkpoint is not whole-task completion.

### External plugin implementation checkpoint

The four plugins are maintained under private `external-plugins` sources and loaded in isolated managed-profile tests, without copying the old frontend or rewriting the installed user profile. Plaza and taskboard use official panel slots; plaza delivers a selection to its session after the conversation persistence listener remounts. Taskboard permission setup failure prevents submission; skill-manager adapts strict codec factories and the settings namespace; prompt-manager retains session isolation and cross-origin/remote write rejection. Narrow Settings navigation wraps above full-width content without removing sections or close actions.

Only maintainable published JavaScript was available for two plugins; missing declarations or license files are not invented. Exact runtime peers map to the pinned checkout instead of copying an old runtime. Compatibility checks exercise the real Web loader, persistent stores, refresh, disable/re-enable and local Agent execution; a deterministic local adapter does not verify a live model. Source methods, per-plugin evidence and limits live in the [external plugin guide](../../../../external-plugins/README.md). The original skill workspace, user data and experimental-driver defaults remain unchanged.

## Risks

The old plugins can mutate the wrong composer or leak listeners when unloaded. Runtime peers can create duplicate service instances. Existing-volume seeding can lose user configuration if rewritten naively. Native dependencies and container networking require independent tests. Migrated user data is not a substitute for a pre-upgrade rollback copy. Target experimental browser/computer drivers stay opt-in. No production deployment is authorized.

### Local evidence and recovery

Resolve these placeholders from the private handoff record; machine-specific paths and the backup must not be published.

```text
upgrade: <upgrade-checkout>
branch: codex/oneseven-v0.1.6-alpha.2
baseline: <official-baseline-checkout>
backup: <private-backup-directory>
restore: backup/RESTORE.md
evidence: backup/evidence/
skill reference: backup/reference/yiqi-ui-standard/
preview: <private-preview-directory>/index.html
```

The code backup excludes ignored dependencies, caches, credentials and runtime databases; it is not a complete production rollback package. A local Git bundle plus working-files archive can restore the recorded branch and uncommitted files in a new directory; the full skill has a separate archive.

### Supersession audit

The active notes contain no OneSeven upgrade owner. This downstream proposal does not supersede upstream Session migration, slot ownership or plugin-lifecycle decisions; their contracts remain authoritative. No archived note is modified.
