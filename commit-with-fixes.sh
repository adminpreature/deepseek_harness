#!/bin/bash

# Commit script with all fixes applied
# Run this after the FiberState export fix

set -e

echo "🔧 Staging all fixed files..."

# Stage the cordis fix
git add vendor/cordis/src/index.js

# Stage all enterprise tenant files
git add packages/enterprise/tenant/

# Stage configuration files
git add tsdown.config.ts pnpm-lock.yaml

# Stage scripts
git add scripts/*.sh

# Stage documentation
git add \
  PRE-COMMIT-FIXES.md \
  FIXES-APPLIED.md \
  START-HERE.md \
  FIX-README.md \
  COMPLETION-REPORT.md \
  TENANT-PLUGIN-FIX.md

echo "📝 Committing changes..."

git commit -m "fix: resolve tenant package dependencies and cordis FiberState export

- Remove non-existent @deepseek-ai/dsh-core and dsh-agent dependencies
- Fix tenant package TypeScript import and type consistency
- Set root package tsdown entry to empty string (workspace mgmt package)
- Move @deepseek-ai/cordis from peerDependencies to dependencies
- Add explicit FiberState re-export in vendor/cordis for bundler compatibility
- Add comprehensive fix documentation and troubleshooting scripts

Fixes:
- Tenant package dependency resolution (pnpm install error)
- Root package tsdown entry point configuration (build error)
- Service implementation type consistency
- Cordis FiberState export for loader package (Rollup build error)

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"

echo "✅ Commit completed successfully!"
echo ""
echo "📊 Commit summary:"
git log -1 --stat
