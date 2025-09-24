#!/bin/bash

# Start Admin CLI for PumpFun Game
# This script helps you start the admin CLI

echo "🎮 PumpFun Game Admin CLI Launcher"
echo "=================================="
echo ""

# Check if server is running
echo "Checking if server is running..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Server is running on port 3000"
    echo ""
    echo "Starting Admin CLI..."
    echo "===================="
    yarn admin
else
    echo "❌ Server is not running on port 3000"
    echo ""
    echo "Please start the server first:"
    echo "  yarn dev"
    echo ""
    echo "Then run this script again:"
    echo "  ./start-admin.sh"
    echo ""
    exit 1
fi
