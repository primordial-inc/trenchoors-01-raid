#!/bin/bash

# Multi-Player Testing Script for PumpFun Game
# This script helps you set up multiple player instances for testing

echo "🎮 PumpFun Multi-Player Testing Setup"
echo "====================================="
echo ""

# Check if server is running
echo "Checking if server is running..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Server is running on port 3000"
    echo ""
    echo "This script will help you start multiple player instances."
    echo "Each instance will run in a separate terminal."
    echo ""
    
    read -p "How many players do you want to simulate? (1-10): " num_players
    
    if ! [[ "$num_players" =~ ^[0-9]+$ ]] || [ "$num_players" -lt 1 ] || [ "$num_players" -gt 10 ]; then
        echo "❌ Please enter a number between 1 and 10"
        exit 1
    fi
    
    echo ""
    echo "🚀 Starting $num_players player instances..."
    echo ""
    echo "Instructions for each terminal:"
    echo "1. Join the game: join Player<number>"
    echo "2. Move around: move up/down/left/right"
    echo "3. Attack boss: attack"
    echo "4. Test heroism: heroism (requires 5 players)"
    echo "5. Check status: status"
    echo ""
    
    for i in $(seq 1 $num_players); do
        echo "Starting Player $i..."
        gnome-terminal --title="Player $i" -- bash -c "cd $(pwd) && yarn player; exec bash" 2>/dev/null || \
        osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && yarn player\"" 2>/dev/null || \
        echo "Please manually open terminal $i and run: yarn player"
        sleep 1
    done
    
    echo ""
    echo "✅ All player instances started!"
    echo ""
    echo "💡 Tips:"
    echo "- Use 'admin' CLI to control the game"
    echo "- Test heroism with 5+ players"
    echo "- Each player can move independently"
    echo "- Boss mechanics affect all players"
    
else
    echo "❌ Server is not running on port 3000"
    echo ""
    echo "Please start the server first:"
    echo "  yarn dev"
    echo ""
    echo "Then run this script again:"
    echo "  ./test-multiplayer.sh"
    echo ""
    exit 1
fi
