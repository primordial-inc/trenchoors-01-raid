import { Command } from '@pumpfun-game/shared';
import { CommandRouter } from './CommandRouter';
import { v4 as uuidv4 } from 'uuid';

export class DummyInput {
  private commandRouter: CommandRouter;
  private playerCounter: number = 0;

  constructor(commandRouter: CommandRouter) {
    this.commandRouter = commandRouter;
  }

  // Handle button click from client (legacy compatibility)
  handleButtonClick(): Command {
    this.playerCounter++;
    const playerName = `Player${this.playerCounter}`;
    
    const command: Command = {
      id: uuidv4(),
      type: 'join',
      data: {
        playerName
      },
      timestamp: new Date()
    };

    // Process the command
    const result = this.commandRouter.processCommand(command);
    
    if (result.success) {
      console.log(`Dummy input: ${result.message}`);
    } else {
      console.log(`Dummy input failed: ${result.message}`);
    }

    return command;
  }

  // Handle direct join command
  handleJoinCommand(playerName: string): Command {
    const command: Command = {
      id: uuidv4(),
      type: 'join',
      data: {
        playerName
      },
      timestamp: new Date()
    };

    const result = this.commandRouter.processCommand(command);
    
    if (result.success) {
      console.log(`Join command: ${result.message}`);
      // Set the playerId in the command if join was successful
      if (result.data?.player?.id) {
        command.playerId = result.data.player.id;
      }
    } else {
      console.log(`Join command failed: ${result.message}`);
    }

    return command;
  }

  // Handle move command
  handleMoveCommand(playerId: string, direction: 'up' | 'down' | 'left' | 'right'): Command {
    const command: Command = {
      id: uuidv4(),
      type: 'move',
      playerId,
      data: {
        direction
      },
      timestamp: new Date()
    };

    const result = this.commandRouter.processCommand(command);
    
    if (result.success) {
      console.log(`Move command: ${result.message}`);
    } else {
      console.log(`Move command failed: ${result.message}`);
    }

    return command;
  }

  // Handle attack command
  handleAttackCommand(playerId: string): Command {
    const command: Command = {
      id: uuidv4(),
      type: 'attack',
      playerId,
      data: {},
      timestamp: new Date()
    };

    const result = this.commandRouter.processCommand(command);
    
    if (result.success) {
      console.log(`Attack command: ${result.message}`);
    } else {
      console.log(`Attack command failed: ${result.message}`);
    }

    return command;
  }

  // Handle heroism command
  handleHeroismCommand(playerId?: string): Command {
    const command: Command = {
      id: uuidv4(),
      type: 'heroism',
      playerId: playerId || '',
      data: {},
      timestamp: new Date()
    };

    const result = this.commandRouter.processCommand(command);
    
    if (result.success) {
      console.log(`Heroism command: ${result.message}`);
    } else {
      console.log(`Heroism command failed: ${result.message}`);
    }

    return command;
  }

  // Handle respawn command
  handleRespawnCommand(playerId: string): Command {
    const command: Command = {
      id: uuidv4(),
      type: 'respawn',
      playerId,
      data: {},
      timestamp: new Date()
    };

    const result = this.commandRouter.processCommand(command);
    
    if (result.success) {
      console.log(`Respawn command: ${result.message}`);
    } else {
      console.log(`Respawn command failed: ${result.message}`);
    }

    return command;
  }
}
