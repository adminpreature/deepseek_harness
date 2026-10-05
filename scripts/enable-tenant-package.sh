#!/bin/bash

# 恢复 tenant 包

set -e

TENANT_DIR="packages/enterprise/tenant"

if [ -f "$TENANT_DIR/package.json.disabled" ]; then
  echo "🔧 Re-enabling tenant package..."
  mv "$TENANT_DIR/package.json.disabled" "$TENANT_DIR/package.json"
  echo "✅ Tenant package re-enabled"
else
  echo "❌ Tenant package.json.disabled not found at $TENANT_DIR"
  exit 1
fi
