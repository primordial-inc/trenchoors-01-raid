# PumpFun Game Project - Technical Architecture

## Overview

A modular, extensible game engine designed for live-streamed interactive games where commands come from various chat sources (primarily PumpFun token holder chat). The architecture prioritizes modularity and replaceability to support multiple game modes and command sources.

## High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Command Source │────│  Command Router  │────│   Game Engine   │
│   (PumpFun)     │    │   (Abstraction)  │    │   (Generic)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                       ┌─────────────────┐      ┌─────────────────┐
                       │ Admin Interface │      │   Game Mode     │
                       │ (Game Control)  │      │ (Boss Fight)    │
                       └─────────────────┘      └─────────────────┘
```

## End Result: What Runs

The complete system consists of:

1. **Vite Client Application** - PixiJS game rendered in browser, captured by OBS for streaming
2. **Node.js Game Server** - Core game logic, command processing, WebSocket server
3. **PostgreSQL Database** - Player data, game sessions, token tracking, game history
4. **Admin Web Interface** - Game control panel for starting/stopping/resetting games
5. **Command Source Integration** - PumpFun chat scraping/listening system

### Development Environment
```bash
# Terminal 1: Database
docker run -p 5432:5432 postgres

# Terminal 2: Game server with admin interface
cd packages/server && yarn dev

# Terminal 3: Game client for streaming
cd packages/client && yarn dev

# Terminal 4: PumpFun command listener
cd packages/command-sources/pumpfun-chat && yarn dev
```

## Project Structure

```
pumpfun-game-project/
├── packages/
│   ├── core/                    # Core game engine (reusable)
│   │   ├── src/
│   │   │   ├── engine/         # Generic game engine & tick system
│   │   │   ├── commands/       # Command abstraction layer
│   │   │   ├── state/          # State management system
│   │   │   └── networking/     # WebSocket/real-time communication
│   │   └── package.json
│   ├── game-modes/             # Specific game implementations
│   │   ├── boss-fight/         # Current boss fight game
│   │   │   ├── src/
│   │   │   │   ├── mechanics/  # Boss mechanics (lava wave, meteors, etc.)
│   │   │   │   ├── entities/   # Boss, Player, Grid entities
│   │   │   │   └── rules/      # Game-specific validation rules
│   │   │   └── package.json
│   │   └── pvp-arena/          # Future PvP game mode
│   ├── command-sources/        # Input sources (pluggable)
│   │   ├── pumpfun-chat/      # PumpFun chat integration
│   │   │   ├── src/
│   │   │   │   ├── scraper/   # Chat scraping system
│   │   │   │   ├── validator/ # Token holder validation
│   │   │   │   └── listener/  # Traffic monitoring approach
│   │   │   └── package.json
│   │   ├── twitch-chat/       # Future: Twitch integration
│   │   └── discord-bot/       # Future: Discord integration
│   ├── admin/                  # Admin control interface
│   │   ├── src/
│   │   │   ├── web/           # Web-based admin panel
│   │   │   ├── api/           # Admin API routes
│   │   │   └── commands/      # Game control commands
│   │   └── package.json
│   ├── client/                 # PixiJS renderer (generic)
│   │   ├── src/
│   │   │   ├── renderer/      # Generic 2D game renderer
│   │   │   ├── ui/            # Reusable UI components
│   │   │   ├── game-modes/    # Game-specific rendering logic
│   │   │   └── admin-overlay/ # Admin controls overlay
│   │   └── package.json
│   ├── server/                 # Main orchestrator
│   │   ├── src/
│   │   │   ├── api/           # HTTP routes
│   │   │   ├── config/        # Configuration management
│   │   │   ├── database/      # Database connection & models
│   │   │   └── bootstrap/     # Application initialization
│   │   └── package.json
│   └── shared/                 # Shared types and utilities
│       └── src/
│           ├── types/         # TypeScript interfaces
│           ├── events/        # Event definitions
│           ├── config/        # Configuration schemas
│           └── constants/     # Game constants
└── package.json               # Root yarn workspace
```

## Core System Components

### 1. Game Engine (Configurable Tick System)

The heart of the system runs on a configurable tick-based game loop:

**Key Features:**
- **Configurable tick rate** (0.1s, 0.5s, 2s - adjustable during runtime)
- **Command batching** - All commands queued and processed together each tick
- **State synchronization** - Game state broadcast to all clients after each tick
- **Collision detection** - Mechanics like lava waves checked every tick

**Core Interface:**
```typescript
interface GameEngine {
  setTickRate(milliseconds: number): void
  start(): void
  stop(): void
  reset(): void
  queueCommand(command: Command): void
  getCurrentState(): GameState
}
```

### 2. Command Source Abstraction

Pluggable command input system supporting multiple chat platforms:

**Command Source Interface:**
```typescript
interface CommandSource {
  id: string
  initialize(): Promise<void>
  onCommand(callback: CommandHandler): void
  validateUser(userId: string): Promise<UserValidation>
  shutdown(): Promise<void>
}
```

**PumpFun Integration Challenges:**
- **No Public API** - Must scrape chat or intercept network traffic
- **Token Validation** - Verify users hold required tokens via Solana blockchain
- **Rate Limiting** - Prevent command spam
- **User Mapping** - Connect chat usernames to wallet addresses

### 3. Game Mode System

Swappable game logic supporting different game types:

**Game Mode Interface:**
```typescript
interface GameMode {
  id: string
  initialize(config: GameModeConfig): void
  tick(): void                    // Called every game tick
  processCommand(command: Command): CommandResult
  getState(): GameState
  getRenderer(): string           // Which client renderer to use
  reset(): void
  canStart(): boolean
}
```

### 4. Admin Management System

**Critical Component** - Game control system for live streaming:

**Admin Capabilities:**
- **Game Lifecycle Control**
  - `startGame()` - Initialize new game session
  - `pauseGame()` - Temporarily halt game progression
  - `resetGame()` - Clear all players, reset boss, start fresh
  - `endGame()` - Conclude session, distribute rewards
  
- **Live Configuration**
  - Adjust tick rate during gameplay
  - Modify boss health/mechanics
  - Add/remove players manually
  - Override game rules
  
- **Monitoring & Debug**
  - Real-time player count
  - Command rate monitoring
  - Game state inspection
  - Error log viewing

**Admin Interface Types:**
- **Web Panel** - Browser-based control dashboard
- **Chat Commands** - Special admin commands (e.g., `!admin reset`)
- **Hotkeys** - Keyboard shortcuts in the client
- **API Endpoints** - Programmatic control

### 5. State Management & Database

**PostgreSQL Database Schema:**
- **Players** - User profiles, wallet addresses, token balances
- **GameSessions** - Individual game instances with metadata
- **PlayerSessions** - Player participation in specific games
- **Commands** - Command history and analytics
- **AdminActions** - Audit log of admin interventions

**State Synchronization:**
- **Server State** - Authoritative game state in memory
- **Database State** - Persistent data and session history
- **Client State** - Rendering state synchronized via WebSocket

## System Flow Examples

### 1. Game Start Flow
```
Admin clicks "Start New Boss Fight" 
→ Server validates game mode configuration
→ Boss spawns with configured health/mechanics  
→ Game state broadcasts to all clients
→ PumpFun command listener activates
→ Players can now join via !join command
```

### 2. Command Processing Flow
```
Player types "!attack" in PumpFun chat
→ Scraper/listener detects message
→ Validate user holds required tokens
→ Check rate limits and game state
→ Queue command for next tick
→ Tick processes attack → boss takes damage
→ New state broadcast to clients
→ PixiJS renders attack animation
```

### 3. Admin Reset Flow
```
Admin triggers game reset
→ Clear all queued commands
→ Remove all players from game
→ Reset boss to full health
→ Clear all active mechanics
→ Broadcast reset state to clients
→ Log admin action to database
```

## Configuration System

**Game Configuration Schema:**
```typescript
interface GameConfig {
  // Core engine settings
  tickInterval: number              // 100ms to 2000ms
  maxPlayers: number               // Player limit
  
  // Game mode configuration
  gameMode: {
    type: 'boss-fight' | 'pvp-arena' | 'survival'
    config: GameModeConfig         // Mode-specific settings
  }
  
  // Command source configuration  
  commandSource: {
    type: 'pumpfun' | 'twitch' | 'discord'
    config: CommandSourceConfig    // Source-specific settings
  }
  
  // Admin settings
  admin: {
    enabled: boolean
    webInterface: boolean
    chatCommands: string[]         // Admin command prefixes
    authorizedUsers: string[]      // Admin user IDs
  }
  
  // Database connection
  database: {
    url: string
    maxConnections: number
  }
}
```

## Future Extensibility

This architecture supports easy extension to:

**New Game Modes:**
- PvP Battle Arena
- Survival/Tower Defense  
- Racing Games
- Puzzle Games

**New Command Sources:**
- Twitch Chat Integration
- Discord Bot Commands
- Twitter Integration
- Custom Web Interface

**New Features:**
- Multiple concurrent games
- Tournament systems  
- Leaderboards & rankings
- NFT integration
- Multi-token support

## Technical Considerations

### Performance
- **WebSocket optimization** for real-time state updates
- **Command batching** to handle high chat volume
- **Database connection pooling** for concurrent users
- **Memory management** for long-running game sessions

### Reliability  
- **Error recovery** for command source failures
- **State persistence** to recover from crashes  
- **Admin overrides** for manual intervention
- **Comprehensive logging** for debugging

### Security
- **Token validation** via blockchain verification
- **Rate limiting** to prevent abuse
- **Admin authentication** for game controls
- **Input sanitization** for chat commands

---

*This architecture document serves as the blueprint for building a modular, extensible game platform optimized for live streaming with chat-based player interaction.*