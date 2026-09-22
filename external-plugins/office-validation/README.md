# Office toolkit validation

English | [中文](README.zh.md)

This directory records the isolated validation install for `dsh-office-toolkit@0.3.30` against `dsh-v0.1.6-alpha.2`. It is a reproducibility record, not an enabled production Profile. The exact npm dependency tree is pinned in [package-lock.json](package-lock.json), and the package source, tarball digest, and engine requirement are recorded in [manifest.json](manifest.json).

## Reproduce

Run from this directory with Node 20 or newer:

```sh
npm ci --ignore-scripts --strict-peer-deps --workspaces=false
```

The validation test receives the installed package through an explicit path. It does not modify the preview Profile:

```sh
DSH_OFFICE_TOOLKIT_TEST_DIR="$PWD/node_modules/dsh-office-toolkit" \
DSH_ONESEVEN_EVIDENCE_DIR="$TMPDIR/oneseven-office-evidence" \
pnpm exec vitest run --config vitest.web.config.ts \
  apps/web/tests/oneseven-office-toolkit.e2e.ts
```

The test uses synthetic DOCX/XLSX files and a copy-on-write template flow. It checks registration of eight tools, Word write/read, Excel write/read/grouped sum, template output to a separate path, host restart persistence, the combined UI with the four local adaptations, and a keyless local model adapter. It does not send messages, import company files, or overwrite a user source file.

## Compatibility result

`dsh-office-toolkit@0.3.30` loaded and registered the expected tools in both the standalone and combined isolated profiles. The tested baseline was Node `22.23.1`, pnpm `11.7.0`, and DSH `0.1.6-alpha.2`. The package has no install script in the inspected npm metadata; validation used `--ignore-scripts` and `--strict-peer-deps`.

The test covers basic document and spreadsheet processing. It does not validate real model calls, LibreOffice/Word/PDF conversion, or complete PowerPoint authoring. Those capabilities remain environment-dependent or outside this validation scope.

## OneSeven plugin inventory

The four existing integrations remain local source packages under `../` and are not replaced by same-version registry packages:

| Package | Version | State |
| --- | --- | --- |
| `dsh-prompt-manager` | `1.5.0` | Local adaptation retained; isolated UI, data, and restart checks passed. |
| `@baikai233/dsh-skills-manager` | `0.1.0-rc.3` | Local adaptation retained; isolated UI, data, and restart checks passed. |
| `dsh-taskboard` | `0.6.4` | Local adaptation retained; not upgraded to `0.7.5`; isolated checks passed. |
| `dsh-skill-plaza` | `0.1.0` | Local implementation retained; navigation, invocation, and persistence checks passed. |

The following packages were not installed into a persistent Profile:

| Package | Candidate | Result |
| --- | --- | --- |
| `@lemoncat7/dsh-knowledge` | `2.10.0` | Isolated diagnosis found an incompatible `conversation.chat.turnTail` slot registration; import, retrieval, citations, and persistence were not accepted. |
| `@huanlin/dsh-plugin-mineru` | `0.3.1` | Peer range does not accept `0.1.6-alpha.2`; no authorized MinerU service was available. |
| `dsh-connect` | `0.9.0` | Peer range does not accept `0.1.6-alpha.2`; DingTalk/Feishu channel and test target were not provided. |

No authentication, memory, second sidebar, second taskboard, second prompt manager, or second skill manager package is part of this record.

## Profile, backup, and rollback

The validation install was under a private temporary directory outside the repository. It was not added to a persistent Profile or to the `3097` instance. Keep a backup of the target `DSH_HOME` before any future activation; source control protects this repository only, not Profile data.

Before activation, stop the target host, copy the Profile and its writable data to a private backup, verify absolute paths and symlinks, and use a separate test `DSH_HOME` for a restart check. Rollback restores the prior Profile and data copy, then starts a host using the prior code and configuration. Do not run old and new hosts against the same writable session or database.

The current `3097` preview instance was not modified or restarted during this validation.
