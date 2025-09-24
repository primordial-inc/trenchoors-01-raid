# Admin CLI for PumpFun Game

The Admin CLI allows you to control the game server from your terminal. You can start, stop, pause, and monitor the game without needing a web interface.

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

3. Start the admin CLI (in another terminal):
```bash
yarn admin
```

## Available Commands

### Game Control
- `start` - Start the game (spawns boss, begins tick loop)
- `stop` - Stop the game (ends current session)
- `pause` - Pause the game (stops tick loop, keeps state)
- `resume` - Resume a paused game
- `reset` - Reset the game (clears all players, resets boss)

### Information Commands
- `status` (or `s`) - Show current game status
- `players` (or `p`) - List all players and their stats
- `boss` (or `b`) - Show boss information and health
- `mechanics` (or `m`) - Show active boss mechanics

### Configuration
- `tickrate <ms>` - Set game tick rate (e.g., `tickrate 1000`)

### Utility Commands
- `clear` - Clear the terminal screen
- `help` (or `h`) - Show available commands
- `quit` (or `exit`, `q`) - Exit the CLI

## Example Session

```
🎮 PumpFun Game Admin CLI
========================
Connected to server: http://localhost:3000

📊 Game Status
==============
Status: ⏳ WAITING
Players: 0
Alive Players: 0
Tick Rate: 1000ms
Boss: ❌ Not spawned

admin> start
✅ Game started successfully!

📊 Game Status
==============
Status: 🟢 ACTIVE
Players: 0
Alive Players: 0
Tick Rate: 1000ms
Boss: 🟢 Dragon Boss (100.0% HP, Phase 1)

admin> status
📊 Game Status
==============
Status: 🟢 ACTIVE
Players: 2
Alive Players: 2
Tick Rate: 1000ms
Boss: 🟢 Dragon Boss (85.3% HP, Phase 1)
⚡ Active Mechanics: 1

admin> players
👥 Players
===========
🟢 Player1 - Damage: 150, Deaths: 0, Position: (5, 3)
🟢 Player2 - Damage: 200, Deaths: 1, Position: (8, 7)

admin> stop
🛑 Game stopped successfully!
```

## Game Flow

1. **Server starts** - Game is in `WAITING` status, no boss spawned
2. **Admin starts game** - Boss spawns, game becomes `ACTIVE`, tick loop begins
3. **Players join** - Players can join and start playing
4. **Boss mechanics** - Boss triggers mechanics based on phase
5. **Game ends** - Either boss dies (players win) or all players die (boss wins)

## Boss Phases

- **Phase 1** (100-60% HP): Basic mechanics, 12s attack cooldown
- **Phase 2** (60-30% HP): More mechanics, 8s attack cooldown  
- **Phase 3** (30-0% HP): Multiple mechanics, 5s attack cooldown

## Notes

- The server must be running before using the admin CLI
- Game state is automatically updated after each command
- All commands are case-insensitive
- Use `Ctrl+C` to force exit if needed
