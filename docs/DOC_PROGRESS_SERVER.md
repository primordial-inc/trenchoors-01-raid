# PumpFun Game Server - Development Progress & Architecture

## 🎯 Project Overview

A real-time multiplayer boss fight game server designed for live streaming integration with PumpFun token holders. Players join via chat commands, fight bosses with deadly mechanics, and compete for token rewards. The server is built with a modular, extensible architecture optimized for single-game streaming sessions.

## 🏗️ Architecture Overview

### High-Level System Design

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Command Input  │───▶│   Game Engine    │───▶│   Game State    │
│  (WebSocket)    │    │  (Tick System)   │    │ (Authoritative) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Boss Mechanics │    │   Heroism Boost  │    │  Broadcasting   │
│  (Lava, Meteors)│    │   (5x Damage)    │    │ (To Clients)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Principles

- **Server-First Architecture**: The server IS the game - clients are just visualizers
- **Single Game Session**: One active game at a time, perfect for streaming
- **Modular Design**: Easy to add new mechanics, bosses, and features
- **Real-Time Communication**: WebSocket-based state synchronization
- **Command-Driven**: All player actions via structured commands

## 📁 Directory Structure

```
packages/server/src/
├── engine/                  # Core game logic
│   ├── GameEngine.ts       # Main game controller with tick system
│   ├── GameState.ts        # Authoritative game state management
│   ├── Player.ts           # Player entity with actions
│   ├── Boss.ts             # Boss entity with health/phases
│   ├── HeroismManager.ts   # Heroism boost system (5x damage)
│   └── mechanics/          # Boss mechanics system
│       ├── BossMechanic.ts # Base mechanic interface
│       ├── LavaWave.ts     # Row/column sweep mechanic
│       ├── MeteorStrike.ts # Multi-meteor impact mechanic
│       ├── PillarPhase.ts  # Corner pillar shelter mechanic
│       └── MechanicsManager.ts # Mechanics orchestration
├── input/                   # Command input system
│   ├── CommandRouter.ts    # Routes commands to game logic
│   └── DummyInput.ts       # WebSocket command handler
├── networking/             # Client communication
│   └── SocketManager.ts    # WebSocket handling & broadcasting
└── index.ts               # Server orchestration + Admin API
```

## 🎮 Game Features

### Core Gameplay

- **16x12 Grid System**: Players move on discrete grid positions
- **Real-Time Tick System**: 500ms game ticks with configurable rate
- **Boss Fight Mechanics**: 3 deadly mechanics with warning systems
- **Player Management**: Join, move, attack, respawn system
- **Heroism Boost**: 5+ players type `!heroism` for 5x damage (30s, 5min cooldown)

### Boss Mechanics

1. **🔥 Lava Wave**
   - Sweeps entire row or column
   - 5-second warning, 3-second duration
   - Instant death if caught

2. **☄️ Meteor Strike**
   - 3-5 random meteors with 2x2 blast radius
   - 4-second warning, 2-second duration
   - Must avoid impact zones

3. **🏛️ Pillar Phase**
   - 4 corner pillars provide safety
   - 6-second warning, 8-second duration
   - Must be adjacent to pillar to survive

### Boss Phases

- **Phase 1** (100-60% HP): Single mechanic every 12 seconds
- **Phase 2** (60-30% HP): Two mechanics every 8 seconds
- **Phase 3** (30-0% HP): Multiple mechanics every 5 seconds

### Player Commands

- `!join` - Enter the game
- `!move up/down/left/right` - Move one square
- `!attack` - Attack boss (10-25 damage, 5x with heroism)
- `!respawn` - Return to fight after death
- `!heroism` - Contribute to damage boost

## 🔧 Technical Implementation

### Game Engine

```typescript
class GameEngine {
  // Core lifecycle
  start(): void          // Start game, spawn boss, begin mechanics
  stop(): void           // Stop game, end mechanics
  pause(): void          // Pause game progression
  resume(): void         // Resume paused game
  reset(): void          // Reset everything to initial state
  
  // Tick system
  private tick(): void   // 500ms game loop
  // - Update boss phase based on health
  // - Process boss mechanics
  // - Check player safety
  // - Check win/lose conditions
  // - Broadcast state updates
}
```

### Game State Management

```typescript
interface GameState {
  id: string;
  status: 'waiting' | 'active' | 'paused' | 'finished';
  players: Map<string, Player>;
  boss: Boss | null;
  heroismBoost: HeroismBoost | null;
  // ... grid, timing, mechanics data
}
```

### Command System

```typescript
interface Command {
  id: string;
  type: 'join' | 'move' | 'attack' | 'heroism' | 'respawn';
  playerId?: string;
  data: any;
  timestamp: Date;
}
```

### WebSocket Events

**Client → Server:**
- `joinGame(playerName)` - Join the game
- `move(direction)` - Move player
- `attack()` - Attack boss
- `respawn()` - Respawn after death
- `heroism()` - Contribute to boost

**Server → Client:**
- `gameStateUpdate(state)` - Full game state
- `bossMechanic(mechanic)` - New mechanic triggered
- `adminMessage(message)` - Game announcements
- `playerDied(playerId)` - Player death notification

## 🚀 API Endpoints

### Health & Status
- `GET /health` - Server health check
- `GET /admin/game-state` - Current game state (JSON)

### Game Control
- `POST /admin/start-game` - Start new game
- `POST /admin/stop-game` - Stop current game
- `POST /admin/reset-game` - Reset everything
- `POST /admin/pause-game` - Pause game
- `POST /admin/resume-game` - Resume game

### Configuration
- `POST /admin/config/tick-rate` - Update tick rate (100-5000ms)

## 🎯 Current Status

### ✅ Completed Features

- **Complete Server Architecture** - Modular, extensible design
- **Game Engine** - 500ms tick system with configurable rate
- **Player System** - Join, move, attack, respawn with validation
- **Boss System** - Health, phases, attack mechanics
- **3 Boss Mechanics** - Lava Wave, Meteor Strike, Pillar Phase
- **Heroism Boost** - 5+ players for 5x damage (30s, 5min cooldown)
- **Real-Time Communication** - WebSocket state synchronization
- **Admin Control** - Full game lifecycle management via HTTP API
- **Command System** - Structured command processing with cooldowns
- **Win/Lose Conditions** - Boss death = win, all players dead = lose
- **Manual Respawn** - Players stay dead until `!respawn` command

### 🔄 Game Flow

1. **Game Start** - Admin starts game, boss spawns, mechanics begin
2. **Player Joins** - Players join via `!join`, spawn at random edge
3. **Combat Phase** - Players move, attack boss, avoid mechanics
4. **Mechanics** - Boss triggers deadly mechanics every 12/8/5 seconds
5. **Death/Respawn** - Players die from mechanics, use `!respawn` to return
6. **Heroism** - 5+ players can activate 5x damage boost
7. **Victory/Defeat** - Boss dies (win) or all players die (lose)

### 🎮 Ready for Client Integration

The server is **100% ready** for client development:

- **WebSocket Connection**: `ws://localhost:3000`
- **Real-Time State**: `gameStateUpdate` events with full game data
- **Command Interface**: Send player commands via WebSocket
- **Mechanics Data**: Complete mechanic information for rendering
- **Admin Control**: HTTP API for game management

## 🔮 Extensibility

### Easy to Add

- **New Boss Mechanics**: Extend `BaseBossMechanic` class
- **New Boss Types**: Add to `Boss` entity system
- **New Commands**: Add to `CommandRouter` and `Command` types
- **New Game Modes**: Implement different `GameMode` classes
- **New Input Sources**: Add to command input system (PumpFun, Twitch, etc.)

### Architecture Benefits

- **Modular Design** - Each component is independent
- **Type Safety** - Full TypeScript with shared types
- **Real-Time Updates** - WebSocket broadcasting
- **Admin Control** - Complete game management
- **Extensible** - Easy to add new features

## 🚀 Next Steps

1. **Client Development** - Build PixiJS client to connect to server
2. **PumpFun Integration** - Add PumpFun chat command source
3. **Advanced Mechanics** - Chain Lightning, Poison Pools, Shockwave
4. **Database Layer** - PostgreSQL for persistence (optional)
5. **Streaming Integration** - OBS integration for live streaming

## 📋 Development Commands

```bash
# Start server
cd packages/server && yarn dev

# Test server
curl http://localhost:3000/health
curl -X POST http://localhost:3000/admin/start-game
curl http://localhost:3000/admin/game-state

# Build all packages
yarn build
```

## 🎯 Key Files

- **`packages/server/src/index.ts`** - Main server entry point
- **`packages/server/src/engine/GameEngine.ts`** - Core game logic
- **`packages/server/src/engine/GameState.ts`** - Game state management
- **`packages/server/src/engine/mechanics/`** - Boss mechanics system
- **`packages/shared/src/types/GameTypes.ts`** - Shared TypeScript types
- **`packages/shared/src/events/SocketEvents.ts`** - WebSocket event definitions

---

**The server is production-ready and waiting for client integration!** 🎮✨
