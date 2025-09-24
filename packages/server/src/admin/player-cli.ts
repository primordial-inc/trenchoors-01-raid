#!/usr/bin/env node

import readline from 'readline';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface PlayerState {
  id?: string;
  name: string;
  isConnected: boolean;
  isAlive: boolean;
  position?: { x: number; y: number };
  damage: number;
  deaths: number;
}

class PlayerCLI {
  private rl: readline.Interface;
  private socket: Socket | null = null;
  private playerState: PlayerState;
  private baseUrl: string;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.baseUrl = `http://localhost:${port}`;
    this.playerState = {
      name: '',
      isConnected: false,
      isAlive: false,
      damage: 0,
      deaths: 0
    };
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  public async start(): Promise<void> {
    console.log('🎮 PumpFun Player CLI');
    console.log('====================');
    console.log(`Connecting to server: ${this.baseUrl}`);
    console.log('');

    // Connect to socket
    await this.connectToServer();

    this.showHelp();
    this.rl.setPrompt('player> ');
    this.rl.prompt();

    this.rl.on('line', async (input) => {
      const command = input.trim().toLowerCase();
      await this.handleCommand(command);
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('\n👋 Goodbye!');
      if (this.socket) {
        this.socket.disconnect();
      }
      process.exit(0);
    });
  }

  private async connectToServer(): Promise<void> {
    try {
      this.socket = io(this.baseUrl);
      
      this.socket.on('connect', () => {
        console.log('✅ Connected to server');
        this.playerState.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        this.playerState.isConnected = false;
      });

      this.socket.on('gameStateUpdate', (gameState) => {
        this.updatePlayerStateFromGameState(gameState);
      });

      this.socket.on('playerJoined', (playerData) => {
        if (playerData.name === this.playerState.name) {
          this.playerState.id = playerData.id;
          console.log(`✅ Successfully joined as ${playerData.name} (ID: ${playerData.id})`);
        }
      });

      this.socket.on('adminMessage', (message) => {
        console.log(`📢 Admin: ${message}`);
      });

      this.socket.on('playerDied', (playerId) => {
        if (this.playerState.id === playerId) {
          console.log('💀 You died! Use "respawn" to return to the fight.');
          this.playerState.isAlive = false;
        }
      });

      this.socket.on('bossDied', () => {
        console.log('🎉 Boss defeated! Players win!');
      });

      this.socket.on('gameEnded', (result) => {
        console.log(`🏁 Game ended: ${result.winner} wins!`);
        if (result.topDamageDealers) {
          console.log('Top damage dealers:');
          result.topDamageDealers.forEach((player: any, index: number) => {
            console.log(`${index + 1}. ${player.name}: ${player.damage} damage`);
          });
        }
      });

      this.socket.on('bossMechanic', (mechanic) => {
        console.log(`⚡ Boss Mechanic: ${mechanic.name}`);
        console.log(`   ${mechanic.description}`);
        if (mechanic.warningTime > 0) {
          console.log(`   Warning: ${mechanic.warningTime}ms remaining`);
        }
      });

      // Wait for connection
      await new Promise<void>((resolve) => {
        this.socket!.on('connect', resolve);
      });

    } catch (error) {
      console.error('❌ Failed to connect to server:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private updatePlayerStateFromGameState(gameState: any): void {
    if (!this.playerState.id) return;

    const player = gameState.players.find((p: any) => p.id === this.playerState.id);
    if (player) {
      this.playerState.position = player.position;
      this.playerState.isAlive = player.isAlive;
      this.playerState.damage = player.damage;
      this.playerState.deaths = player.deaths;
    }
  }

  private async handleCommand(command: string): Promise<void> {
    const [cmd, ...args] = command.split(' ');

    try {
      switch (cmd) {
        case 'help':
        case 'h':
          this.showHelp();
          break;

        case 'join':
          if (args.length > 0) {
            await this.joinGame(args[0]);
          } else {
            console.log('❌ Please provide a player name (e.g., join Player1)');
          }
          break;

        case 'leave':
          await this.leaveGame();
          break;

        case 'move':
          if (args.length > 0) {
            await this.movePlayer(args[0]);
          } else {
            console.log('❌ Please provide a direction (up, down, left, right)');
          }
          break;

        case 'up':
          await this.movePlayer('up');
          break;

        case 'down':
          await this.movePlayer('down');
          break;

        case 'left':
          await this.movePlayer('left');
          break;

        case 'right':
          await this.movePlayer('right');
          break;

        case 'attack':
          await this.attackBoss();
          break;

        case 'heroism':
          await this.heroismCommand();
          break;

        case 'respawn':
          await this.respawnPlayer();
          break;

        case 'status':
        case 's':
          this.showStatus();
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

  private async joinGame(playerName: string): Promise<void> {
    if (!this.socket || !this.playerState.isConnected) {
      console.log('❌ Not connected to server');
      return;
    }

    if (this.playerState.id) {
      console.log('❌ Already joined the game');
      return;
    }

    this.playerState.name = playerName;
    
    this.socket.emit('joinGame', playerName);
    console.log(`🎮 Joining game as ${playerName}...`);
  }

  private async leaveGame(): Promise<void> {
    if (!this.playerState.id) {
      console.log('❌ Not in the game');
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.playerState = {
      name: '',
      isConnected: false,
      isAlive: false,
      damage: 0,
      deaths: 0
    };

    console.log('👋 Left the game');
  }

  private async movePlayer(direction: string): Promise<void> {
    if (!this.socket || !this.playerState.isConnected) {
      console.log('❌ Not connected to server');
      return;
    }

    if (!this.playerState.id) {
      console.log('❌ Not in the game. Use "join <name>" first');
      return;
    }

    if (!this.playerState.isAlive) {
      console.log('❌ You are dead. Use "respawn" to return to the fight');
      return;
    }

    const validDirections = ['up', 'down', 'left', 'right'];
    if (!validDirections.includes(direction)) {
      console.log('❌ Invalid direction. Use: up, down, left, right');
      return;
    }

    this.socket.emit('move', direction);
    console.log(`🚶 Moving ${direction}...`);
  }

  private async attackBoss(): Promise<void> {
    if (!this.socket || !this.playerState.isConnected) {
      console.log('❌ Not connected to server');
      return;
    }

    if (!this.playerState.id) {
      console.log('❌ Not in the game. Use "join <name>" first');
      return;
    }

    if (!this.playerState.isAlive) {
      console.log('❌ You are dead. Use "respawn" to return to the fight');
      return;
    }

    this.socket.emit('attack');
    console.log('⚔️  Attacking boss...');
  }

  private async heroismCommand(): Promise<void> {
    if (!this.socket || !this.playerState.isConnected) {
      console.log('❌ Not connected to server');
      return;
    }

    if (!this.playerState.id) {
      console.log('❌ Not in the game. Use "join <name>" first');
      return;
    }

    this.socket.emit('heroism');
    console.log('🔥 Calling for heroism...');
  }

  private async respawnPlayer(): Promise<void> {
    if (!this.socket || !this.playerState.isConnected) {
      console.log('❌ Not connected to server');
      return;
    }

    if (!this.playerState.id) {
      console.log('❌ Not in the game. Use "join <name>" first');
      return;
    }

    if (this.playerState.isAlive) {
      console.log('❌ You are already alive');
      return;
    }

    this.socket.emit('respawn');
    console.log('🔄 Respawning...');
  }

  private showStatus(): void {
    console.log('\n📊 Player Status');
    console.log('================');
    console.log(`Connected: ${this.playerState.isConnected ? '🟢' : '🔴'}`);
    
    if (this.playerState.id) {
      console.log(`Name: ${this.playerState.name}`);
      console.log(`Alive: ${this.playerState.isAlive ? '🟢' : '🔴'}`);
      console.log(`Damage: ${this.playerState.damage}`);
      console.log(`Deaths: ${this.playerState.deaths}`);
      if (this.playerState.position) {
        console.log(`Position: (${this.playerState.position.x}, ${this.playerState.position.y})`);
      }
    } else {
      console.log('Not in game');
    }
    console.log('');
  }

  private showHelp(): void {
    console.log('\n📖 Available Commands');
    console.log('======================');
    console.log('join <name> - Join the game with a player name');
    console.log('leave - Leave the current game');
    console.log('move <direction> - Move (up, down, left, right)');
    console.log('up, down, left, right - Simple movement commands');
    console.log('attack - Attack the boss');
    console.log('heroism - Call for heroism (requires 5 players)');
    console.log('respawn - Respawn if dead');
    console.log('status (s) - Show player status');
    console.log('clear - Clear screen');
    console.log('help (h) - Show this help');
    console.log('quit, exit (q) - Exit CLI');
    console.log('');
  }
}

// Main execution
async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const cli = new PlayerCLI(port);
  
  try {
    await cli.start();
  } catch (error) {
    console.error('❌ Failed to start player CLI:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
