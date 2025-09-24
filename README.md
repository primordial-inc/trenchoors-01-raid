# PumpFun Game Project

A multiplayer boss battle game where players fight against a dragon boss with various mechanics.

## Quick Start

### 1. Start the Server
```bash
cd packages/server
yarn install
yarn dev
```

### 2. Control the Game (Admin CLI)
In a new terminal:
```bash
cd packages/server
yarn admin
```

Or use the helper script:
```bash
./start-admin.sh
```

### 3. Test with Players (Player CLI)
In separate terminals (simulate multiple players):
```bash
cd packages/server
yarn player
# Then: join Player1

# In another terminal:
yarn player  
# Then: join Player2
```

Or use the helper script:
```bash
./start-player.sh
```

### 4. Start the Client
```bash
cd packages/client
yarn install
yarn dev
```

## Development Tools

### Admin CLI
Control the game server:
- **Start/Stop** the game
- **Monitor** players and boss status
- **Configure** game settings
- **View** active mechanics

See [packages/server/ADMIN_CLI.md](packages/server/ADMIN_CLI.md) for detailed usage.

### Player CLI
Simulate players for testing:
- **Join/Leave** games
- **Move** around the battlefield
- **Attack** the boss
- **Test** heroism mechanics
- **Multiple instances** for multiplayer testing

See [packages/server/PLAYER_CLI.md](packages/server/PLAYER_CLI.md) for detailed usage.

## Game Flow

1. Server starts in `WAITING` status
2. Admin starts the game → Boss spawns
3. Players join and fight the boss
4. Boss uses mechanics based on health phases
5. Game ends when boss dies or all players die

## Boss Phases

- **Phase 1** (100-60% HP): Basic mechanics
- **Phase 2** (60-30% HP): More complex mechanics  
- **Phase 3** (30-0% HP): Multiple simultaneous mechanics

## Architecture

- **Server**: Game engine, boss mechanics, player management
- **Client**: Web-based game interface
- **Shared**: Common types and events
- **Core**: Shared utilities
