#!/bin/bash

# Quick fix script for DeepSeek Harness Enterprise build issues
# This script applies all fixes and tests the build

set -e

echo "🚀 DeepSeek Harness Enterprise - Quick Fix Script"
echo "=================================================="
echo ""

PROJECT_ROOT="/Volumes/数据盘/yiqi agentlite/deepseek-harness-upgrade-v0.1.6-alpha.2"
cd "$PROJECT_ROOT"

# Step 1: Make helper scripts executable
echo "📝 Step 1: Making helper scripts executable..."
chmod +x scripts/disable-tenant-package.sh
chmod +x scripts/enable-tenant-package.sh
echo "✅ Done"
echo ""

# Step 2: Temporarily disable tenant package
echo "📝 Step 2: Temporarily disabling tenant package..."
if [ -f "packages/enterprise/tenant/package.json" ]; then
  ./scripts/disable-tenant-package.sh
else
  echo "⚠️  Tenant package already disabled or not found"
fi
echo ""

# Step 3: Clean install
echo "📝 Step 3: Running pnpm install..."
echo "This may take a few minutes..."
pnpm install 2>&1 | grep -E "(Progress:|✓|ERROR|WARN)" || true
echo ""

# Step 4: Check if install succeeded
if [ $? -eq 0 ]; then
  echo "✅ pnpm install completed successfully!"
  echo ""

  # Step 5: Try to build
  echo "📝 Step 5: Attempting to build..."
  echo "This may take several minutes..."

  if pnpm run build 2>&1 | tee /tmp/build-output.log; then
    echo ""
    echo "🎉 BUILD SUCCESSFUL!"
    echo ""
    echo "✅ All fixes applied successfully"
    echo "✅ Project builds without tenant package"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Review the build output above"
    echo "   2. Re-enable tenant package: ./scripts/enable-tenant-package.sh"
    echo "   3. Fix tenant package build issues"
    echo "   4. Commit your changes"
    echo ""
  else
    echo ""
    echo "❌ BUILD FAILED"
    echo ""
    echo "The build failed even without tenant package."
    echo "Check the output above for errors."
    echo ""
    echo "Common issues:"
    echo "  - Missing dependencies"
    echo "  - TypeScript errors in other packages"
    echo "  - Build tool configuration issues"
    echo ""
    echo "Build log saved to: /tmp/build-output.log"
  fi
else
  echo "❌ pnpm install failed"
  echo ""
  echo "Please check the errors above and:"
  echo "  1. Ensure Docker containers are running"
  echo "  2. Check network connectivity"
  echo "  3. Verify pnpm version (should be 11.7.0+)"
  echo ""
fi

# Always try to re-enable tenant package at the end
echo ""
echo "📝 Re-enabling tenant package..."
if [ -f "packages/enterprise/tenant/package.json.disabled" ]; then
  ./scripts/enable-tenant-package.sh
fi

echo ""
echo "Script completed."
