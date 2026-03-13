#!/bin/bash
# ═══════════════════════════════════════════════
#   Build EduPrime Link for macOS (.dmg)
# ═══════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "⚡ Building EduPrime Link for macOS..."
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js from: https://nodejs.org"
    exit 1
fi

# Install all dependencies (including devDependencies for electron-builder)
echo "📦 Installing dependencies..."
npm install
echo ""

# Build the DMG
echo "🔨 Building DMG installer..."
npx electron-builder --mac
echo ""

# Show the output
DMG_PATH=$(find dist -name "*.dmg" -type f 2>/dev/null | head -1)
if [ -n "$DMG_PATH" ]; then
    echo "✅ Build complete!"
    echo "   DMG: $SCRIPT_DIR/$DMG_PATH"
    echo ""
    echo "   To install: Open the DMG and drag EduPrime Link to Applications"
else
    echo "⚠️  Build completed but no DMG found in dist/"
    echo "   Check the dist/ directory for output files."
fi
