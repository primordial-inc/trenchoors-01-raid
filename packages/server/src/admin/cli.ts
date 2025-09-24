#!/usr/bin/env node

import readline from 'readline';
import axios from 'axios';

interface GameState {
  id: string;
  status: string;
  players: any[];
  boss: any;
  gridWidth: number;
  gridHeight: number;
  tickRate: number;
  createdAt: string;
  lastTickAt?: string;
  heroismBoost?: any;
  mechanics?: any;
}

class AdminCLI {
  private rl: readline.Interface;
  private baseUrl: string;
  private gameState: GameState | null = null;

  constructor(port: number = 3000) {
    this.baseUrl = `http://localhost:${port}`;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  public async start(): Promise<void> {
    console.log('🎮 PumpFun Game Admin CLI');
    console.log('========================');
    console.log(`Connected to server: ${this.baseUrl}`);
    console.log('');

    await this.updateGameState();
    this.showStatus();
    this.showHelp();

    this.rl.setPrompt('admin> ');
    this.rl.prompt();

    this.rl.on('line', async (input) => {
      const command = input.trim().toLowerCase();
      await this.handleCommand(command);
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('\n👋 Goodbye!');
      process.exit(0);
    });
  }

  private async handleCommand(command: string): Promise<void> {
    const [cmd, ...args] = command.split(' ');

    try {
      switch (cmd) {
        case 'help':
        case 'h':
          this.showHelp();
          break;

        case 'status':
        case 's':
          await this.updateGameState();
          this.showStatus();
          break;

        case 'start':
          await this.startGame();
          break;

        case 'stop':
          await this.stopGame();
          break;

        case 'pause':
          await this.pauseGame();
          break;

        case 'resume':
          await this.resumeGame();
          break;

        case 'reset':
          await this.resetGame();
          break;

        case 'players':
        case 'p':
          await this.updateGameState();
          this.showPlayers();
          break;

        case 'boss':
        case 'b':
          await this.updateGameState();
          this.showBoss();
          break;

        case 'mechanics':
        case 'm':
          await this.updateGameState();
          this.showMechanics();
          break;

        case 'tickrate':
          if (args.length > 0) {
            await this.setTickRate(parseInt(args[0]));
          } else {
            console.log('❌ Please provide a tick rate value (e.g., tickrate 1000)');
          }
          break;

        case 'clear':
          console.clear();
          break;

        case 'quit':
        case 'exit':
        case 'q':
          this.rl.close();
          break;

        default:
          if (command) {
            console.log(`❌ Unknown command: ${command}`);
            console.log('Type "help" for available commands');
          }
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async updateGameState(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/admin/game-state`);
      this.gameState = response.data;
    } catch (error) {
      console.error('❌ Failed to fetch game state:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async startGame(): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/admin/start-game`);
      if (response.data.success) {
        console.log('✅ Game started successfully!');
        await this.updateGameState();
        this.showStatus();
      } else {
        console.log('❌ Failed to start game:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Error starting game:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async stopGame(): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/admin/stop-game`);
      if (response.data.success) {
        console.log('🛑 Game stopped successfully!');
        await this.updateGameState();
        this.showStatus();
      } else {
        console.log('❌ Failed to stop game:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Error stopping game:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async pauseGame(): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/admin/pause-game`);
      if (response.data.success) {
        console.log('⏸️  Game paused successfully!');
        await this.updateGameState();
        this.showStatus();
      } else {
        console.log('❌ Failed to pause game:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Error pausing game:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async resumeGame(): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/admin/resume-game`);
      if (response.data.success) {
        console.log('▶️  Game resumed successfully!');
        await this.updateGameState();
        this.showStatus();
      } else {
        console.log('❌ Failed to resume game:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Error resuming game:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async resetGame(): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/admin/reset-game`);
      if (response.data.success) {
        console.log('🔄 Game reset successfully!');
        await this.updateGameState();
        this.showStatus();
      } else {
        console.log('❌ Failed to reset game:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Error resetting game:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async setTickRate(tickRate: number): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/admin/config/tick-rate`, { tickRate });
      if (response.data.success) {
        console.log(`⚡ Tick rate updated to ${tickRate}ms`);
        await this.updateGameState();
      } else {
        console.log('❌ Failed to update tick rate:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Error updating tick rate:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private showStatus(): void {
    if (!this.gameState) {
      console.log('❌ No game state available');
      return;
    }

    console.log('\n📊 Game Status');
    console.log('==============');
    console.log(`Status: ${this.getStatusEmoji(this.gameState.status)} ${this.gameState.status.toUpperCase()}`);
    console.log(`Players: ${this.gameState.players.length}`);
    console.log(`Alive Players: ${this.gameState.players.filter(p => p.isAlive).length}`);
    console.log(`Tick Rate: ${this.gameState.tickRate}ms`);
    
    if (this.gameState.boss) {
      const healthPercent = (this.gameState.boss.currentHealth / this.gameState.boss.maxHealth) * 100;
      console.log(`Boss: ${this.gameState.boss.isAlive ? '🟢' : '🔴'} ${this.gameState.boss.name} (${healthPercent.toFixed(1)}% HP, Phase ${this.gameState.boss.phase})`);
    } else {
      console.log('Boss: ❌ Not spawned');
    }

    if (this.gameState.heroismBoost?.isActive) {
      console.log(`🔥 Heroism Boost: ACTIVE (${this.gameState.heroismBoost.multiplier}x damage)`);
    }

    if (this.gameState.mechanics?.activeMechanics?.length > 0) {
      console.log(`⚡ Active Mechanics: ${this.gameState.mechanics.activeMechanics.length}`);
    }

    console.log('');
  }

  private showPlayers(): void {
    if (!this.gameState) {
      console.log('❌ No game state available');
      return;
    }

    console.log('\n👥 Players');
    console.log('===========');
    
    if (this.gameState.players.length === 0) {
      console.log('No players in game');
    } else {
      this.gameState.players.forEach(player => {
        const status = player.isAlive ? '🟢' : '🔴';
        console.log(`${status} ${player.name} - Damage: ${player.damage}, Deaths: ${player.deaths}, Position: (${player.position.x}, ${player.position.y})`);
      });
    }
    console.log('');
  }

  private showBoss(): void {
    if (!this.gameState?.boss) {
      console.log('\n🐉 Boss');
      console.log('========');
      console.log('No boss spawned');
      console.log('');
      return;
    }

    const boss = this.gameState.boss;
    const healthPercent = (boss.currentHealth / boss.maxHealth) * 100;
    
    console.log('\n🐉 Boss');
    console.log('========');
    console.log(`Name: ${boss.name}`);
    console.log(`Status: ${boss.isAlive ? '🟢 Alive' : '🔴 Dead'}`);
    console.log(`Health: ${boss.currentHealth}/${boss.maxHealth} (${healthPercent.toFixed(1)}%)`);
    console.log(`Phase: ${boss.phase}`);
    console.log(`Position: (${boss.position.x}, ${boss.position.y})`);
    console.log('');
  }

  private showMechanics(): void {
    if (!this.gameState?.mechanics) {
      console.log('\n⚡ Mechanics');
      console.log('=============');
      console.log('No mechanics data available');
      console.log('');
      return;
    }

    const mechanics = this.gameState.mechanics;
    
    console.log('\n⚡ Mechanics');
    console.log('=============');
    console.log(`Boss Phase: ${mechanics.bossPhase}`);
    console.log(`Active Mechanics: ${mechanics.activeMechanics?.length || 0}`);
    
    if (mechanics.activeMechanics?.length > 0) {
      mechanics.activeMechanics.forEach((mechanic: any) => {
        const status = mechanic.isActive ? '🟢' : '🔴';
        console.log(`${status} ${mechanic.name} - ${mechanic.description}`);
      });
    }
    console.log('');
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'waiting': return '⏳';
      case 'active': return '🟢';
      case 'paused': return '⏸️';
      case 'finished': return '🏁';
      default: return '❓';
    }
  }

  private showHelp(): void {
    console.log('\n📖 Available Commands');
    console.log('======================');
    console.log('start, stop, pause, resume, reset - Game control');
    console.log('status (s) - Show current game status');
    console.log('players (p) - Show all players');
    console.log('boss (b) - Show boss information');
    console.log('mechanics (m) - Show active mechanics');
    console.log('tickrate <ms> - Set tick rate (e.g., tickrate 1000)');
    console.log('clear - Clear screen');
    console.log('help (h) - Show this help');
    console.log('quit, exit (q) - Exit CLI');
    console.log('');
  }
}

// Main execution
async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const cli = new AdminCLI(port);
  
  try {
    await cli.start();
  } catch (error) {
    console.error('❌ Failed to start admin CLI:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
