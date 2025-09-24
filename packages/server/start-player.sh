#!/bin/bash

# Start Player CLI for PumpFun Game
# This script helps you start a player CLI instance

echo "🎮 PumpFun Player CLI Launcher"
echo "=============================="
echo ""

# Check if server is running
echo "Checking if server is running..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Server is running on port 3000"
    echo ""
    echo "Starting Player CLI..."
    echo "====================="
    echo "💡 Tip: You can run multiple instances of this script to simulate multiple players!"
    echo ""
    yarn player
else
    echo "❌ Server is not running on port 3000"
    echo ""
    echo "Please start the server first:"
    echo "  yarn dev"
    echo ""
    echo "Then run this script again:"
    echo "  ./start-player.sh"
    echo ""
    exit 1
fi
