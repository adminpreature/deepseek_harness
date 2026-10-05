#!/bin/bash

# 临时排除 tenant 包以允许其他包构建
# 这个脚本会重命名 package.json 来让 pnpm 忽略它

set -e

TENANT_DIR="packages/enterprise/tenant"

if [ -f "$TENANT_DIR/package.json" ]; then
  echo "🔧 Temporarily excluding tenant package..."
  mv "$TENANT_DIR/package.json" "$TENANT_DIR/package.json.disabled"
  echo "✅ Tenant package excluded"
  echo ""
  echo "📝 To re-enable:"
  echo "   mv $TENANT_DIR/package.json.disabled $TENANT_DIR/package.json"
else
  echo "❌ Tenant package.json not found at $TENANT_DIR"
  exit 1
fi
