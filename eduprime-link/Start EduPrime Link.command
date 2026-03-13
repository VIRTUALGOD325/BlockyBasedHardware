#!/bin/bash
# ═══════════════════════════════════════════════
#   EduPrime Link — Double-click to start!
# ═══════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "⚡ Starting EduPrime Link..."
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js from: https://nodejs.org"
    echo ""
    echo "Press any key to close..."
    read -n 1
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (first time only)..."
    npm install --omit=dev 2>&1
    echo ""
fi

# Start the server
echo "🚀 EduPrime Link is starting..."
echo "   Keep this window open while using EduPrime Hardware IDE"
echo ""
echo "   Close this window or press Ctrl+C to stop."
echo "═══════════════════════════════════════════════════"
echo ""

npm start
