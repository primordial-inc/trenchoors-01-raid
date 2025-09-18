# Boss Fight Stream Game - Design Document

## Project Summary
A live-streamed boss fight game integrated with PumpFun token streams. Token holders join the game via chat commands, fight bosses together in real-time, and compete for token rewards from creator fees. The stream becomes interactive entertainment where viewers can either participate (if they hold tokens) or support players through chat mechanics like !heroism boosts.

## Core Concept
2D top-down boss fight game streamed on PumpFun. Players join via chat commands, attack the boss while dodging mechanics, and compete to kill the boss for token rewards from creator fees.

## Game Layout

### Grid System
- **16x12 grid** (192 total squares)
- Each square clearly labeled (A1, A2, B1, etc.)
- Players spawn randomly on grid edges
- Boss positioned at center of grid
- Movement: `!up` `!down` `!left` `!right` (one square per command)
- Attack: `!attack` (ranged shot toward boss)

### UI Layout
- **Top Black Bar**: Game announcements and alerts
- **Center Grid**: 16x12 game area with boss and players
- **Left Sidebar**: Player List (Name - Damage - Deaths - Status)
- **Right Sidebar**: Boss Health Bar, Mechanics Timer, Heroism Counter
- **Player Names**: Small text displayed on grid squares (semi-transparent)

## Game Flow

### Session Structure (2-3 hours)
1. **Warmup Phase** (15 mins): Players join, practice movement and attacks
2. **Boss Fight** (90-120 mins): Attack boss while surviving mechanics until death or victory
3. **Victory/Reset** (15 mins): Loot distribution or respawn new boss if defeated

### Boss Health & Phases
- **Boss HP**: 10,000 - 50,000 HP (scales with player count)
- **Phase 1** (100-60% HP): Single mechanic every 12 seconds
- **Phase 2** (60-30% HP): Two mechanics every 8 seconds  
- **Phase 3** (30-0% HP): Multiple mechanics every 5 seconds
- **Enrage** (if fight lasts >2 hours): Mechanics become faster and deadlier

## Announcement System

### Warning Messages (Top Bar Examples)
- **Lava Wave**: "The boss is charging up... lava wave incoming!"
- **Meteor Strike**: "Dark clouds gather... meteors will rain from above!"
- **Pillar Phase**: "The ground trembles... seek shelter behind pillars!"
- **Chain Lightning**: "Electric energy builds... spread out to avoid chains!"
- **Poison Pools**: "Toxic fumes rise... poison pools will form!"
- **Shockwave**: "The boss roars... massive shockwave expanding!"

### Timing
- Warning appears 5 seconds before mechanic
- Clear visual countdown or urgency indicator
- Mechanic name + flavor text for immersion

## Chat Mechanics

### Heroism Boost
- When 5+ people in chat type `!heroism` within 10 seconds
- All player damage multiplied by 5x for next 30 seconds
- 5-minute cooldown between heroism activations
- Visual indicator shows heroism counter building up

## Boss Mechanics (Starting Set)

### Basic Mechanics
1. **Lava Wave**
   - Sweeps across entire row or column
   - 5-second warning with visual indicator
   - Instant death if caught

2. **Meteor Strike**
   - Targets 3-5 random squares
   - 4-second warning with red markers
   - 2x2 blast radius

3. **Pillar Phase**
   - 4 pillars spawn at grid corners
   - Must stand adjacent to pillar to survive
   - 6-second warning, lasts 8 seconds

### Advanced Mechanics (Waves 6+)
4. **Chain Lightning**
   - Jumps between players within 2 squares
   - Starts from random player
   - More dangerous with more players alive

5. **Poison Pools**
   - Creates permanent danger zones (3x3)
   - Reduces available safe space
   - Pools persist for remainder of wave

6. **Shockwave**
   - Expands from center outward
   - Players must be at grid edges
   - 6-second travel time

## Loot & Rewards

### Boss Kill Rewards
- **Winner Selection**: Player who dealt killing blow gets priority pick
- **Loot Pool**: Creator fees accumulated during stream + token airdrops
- **Distribution**: 
  - 60% to killing blow player
  - 30% to top 3 damage dealers  
  - 10% to random survivor
- **Participation**: All players get small token airdrop

### Session Tracking
- **Total Damage**: Cumulative damage dealt to boss
- **Deaths**: Number of times player died during session
- **Kill Participation**: Did player contribute to final boss kill

## Commands

### Player Commands
- `!join` - Enter the game (must hold token)
- `!attack` - Shoot ranged attack at boss (deals 10-25 damage)
- `!up` `!down` `!left` `!right` - Move one square
- `!stats` - Check your session damage and survival time

### Chat Commands (All Viewers)
- `!heroism` - Contribute to damage boost (need 5 people within 10 seconds)

## Technical Notes
- **Invisible Tick System**: Commands processed every 0.5 seconds behind the scenes
- **Command Batching**: Multiple commands queued and executed together for stability
- **Visual Clarity**: Player names semi-transparent on grid squares
- **Stream Layout**: Sidebars and announcement bar optimize for streaming
- **Warning System**: 5-second advance notice for all boss mechanics via top bar