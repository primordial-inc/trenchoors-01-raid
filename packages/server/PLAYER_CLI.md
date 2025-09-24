# Player CLI for PumpFun Game

The Player CLI allows you to simulate players for development and testing purposes. You can run multiple instances simultaneously to test multiplayer scenarios.

## Setup

1. Install dependencies:
```bash
cd packages/server
yarn install
```

2. Start the server (in one terminal):
```bash
yarn dev
```

3. Start player CLI instances (in separate terminals):
```bash
# Terminal 1
yarn player

# Terminal 2 (for second player)
yarn player

# Terminal 3 (for third player)
yarn player
```

Or use the helper script:
```bash
./start-player.sh
```

## Available Commands

### Game Commands
- `join <name>` - Join the game with a player name
- `leave` - Leave the current game
- `respawn` - Respawn if dead

### Action Commands
- `move <direction>` - Move player (up, down, left, right)
- `up`, `down`, `left`, `right` - Simple movement commands
- `attack` - Attack the boss
- `heroism` - Call for heroism (requires 5 players)

### Information Commands
- `status` (or `s`) - Show player status
- `clear` - Clear the terminal screen
- `help` (or `h`) - Show available commands
- `quit` (or `exit`, `q`) - Exit CLI

## Example Session

```
🎮 PumpFun Player CLI
====================
Connecting to server: http://localhost:3000

✅ Connected to server

📖 Available Commands
======================
join <name> - Join the game with a player name
leave - Leave the current game
move <direction> - Move (up, down, left, right)
attack - Attack the boss
heroism - Call for heroism (requires 5 players)
respawn - Respawn if dead
status (s) - Show player status
clear - Clear screen
help (h) - Show this help
quit, exit (q) - Exit CLI

player> join Player1
🎮 Joining game as Player1...

📢 Admin: Player Player1 joined the game

player> status
📊 Player Status
================
Connected: 🟢
Name: Player1
Alive: 🟢
Damage: 0
Deaths: 0
Position: (5, 3)

player> right
🚶 Moving right...

player> attack
⚔️  Attacking boss...

📢 Admin: Attacked boss for 15 damage

player> heroism
🔥 Calling for heroism...

📢 Admin: Heroism: 1/5 players. Need 4 more!
```

## Multi-Player Testing

To test with multiple players:

1. **Start the server**:
```bash
yarn dev
```

2. **Start multiple player CLIs** (each in a separate terminal):
```bash
# Terminal 1
yarn player
# Then: join Player1

# Terminal 2  
yarn player
# Then: join Player2

# Terminal 3
yarn player
# Then: join Player3

# Terminal 4
yarn player
# Then: join Player4

# Terminal 5
yarn player
# Then: join Player5
```

3. **Test heroism** (requires 5 players):
```bash
# In each terminal:
heroism
```

## Real-time Events

The player CLI receives real-time updates:

- **Game state changes** - Position, health, damage updates
- **Admin messages** - Server notifications
- **Boss mechanics** - Warning messages and descriptions
- **Player deaths** - Death notifications
- **Game end** - Victory/defeat results
- **Heroism activation** - When 5 players unite

## Development Workflow

1. **Start server** with admin CLI for game control
2. **Start multiple player CLIs** to simulate players
3. **Use admin CLI** to start/stop game, monitor status
4. **Use player CLIs** to test gameplay mechanics
5. **Test edge cases** like heroism, respawning, boss phases

## Tips

- **Multiple instances**: Each terminal runs an independent player
- **Real-time sync**: All players see the same game state
- **Socket connection**: Uses WebSocket for real-time communication
- **Error handling**: Clear error messages for invalid commands
- **Status tracking**: Always know your player's current state
- **Simple movement**: Use `up`, `down`, `left`, `right` for quick movement
- **Grace period**: New players have 5 seconds before mechanics can kill them

## Notes

- Players must join before performing actions
- Dead players can only respawn (not move/attack)
- Heroism requires exactly 5 players to activate
- All commands are case-insensitive
- Use `Ctrl+C` to force exit if needed
