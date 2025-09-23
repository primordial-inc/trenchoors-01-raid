import React from 'react';
import type { ClientPlayer } from '../types/ClientTypes';

interface PlayerListProps {
  players: Map<string, ClientPlayer>;
  maxPlayers: number;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, maxPlayers }) => {
  const playerArray = Array.from(players.values());
  const alivePlayers = playerArray.filter(p => p.isAlive);
  const deadPlayers = playerArray.filter(p => !p.isAlive);

  return (
    <div className="player-list">
      <div className="player-list-header">
        <h3>Players ({alivePlayers.length}/{maxPlayers})</h3>
        <div className="player-stats">
          <span>Alive: {alivePlayers.length}</span>
          <span>Dead: {deadPlayers.length}</span>
        </div>
      </div>

      <div className="player-list-content">
        {/* Alive players */}
        <div className="player-section">
          <h4>Alive ({alivePlayers.length})</h4>
          <div className="player-items">
            {alivePlayers
              .sort((a, b) => b.damage - a.damage) // Sort by damage dealt
              .map(player => (
                <PlayerItem key={player.id} player={player} isAlive={true} />
              ))}
          </div>
        </div>

        {/* Dead players */}
        {deadPlayers.length > 0 && (
          <div className="player-section">
            <h4>Dead ({deadPlayers.length})</h4>
            <div className="player-items">
              {deadPlayers
                .sort((a, b) => b.damage - a.damage) // Sort by damage dealt
                .map(player => (
                  <PlayerItem key={player.id} player={player} isAlive={false} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface PlayerItemProps {
  player: ClientPlayer;
  isAlive: boolean;
}

const PlayerItem: React.FC<PlayerItemProps> = ({ player, isAlive }) => {
  const statusColor = isAlive ? '#27AE60' : '#E74C3C';
  const playerColor = getPlayerColor(player.color);

  return (
    <div className={`player-item ${isAlive ? 'alive' : 'dead'}`}>
      <div className="player-info">
        <div 
          className="player-color-indicator"
          style={{ backgroundColor: playerColor }}
        />
        <span className="player-name">{player.name}</span>
        <span 
          className="player-status"
          style={{ color: statusColor }}
        >
          {isAlive ? '●' : '✕'}
        </span>
      </div>
      
      <div className="player-stats">
        <div className="stat">
          <span className="stat-label">Damage:</span>
          <span className="stat-value">{player.damage}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Deaths:</span>
          <span className="stat-value">{player.deaths}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Position:</span>
          <span className="stat-value">{getGridLabel(player.position.x, player.position.y)}</span>
        </div>
      </div>
    </div>
  );
};

function getPlayerColor(color: string): string {
  const colors: { [key: string]: string } = {
    blue: '#3498DB',
    red: '#E74C3C',
    yellow: '#F1C40F',
    black: '#2C3E50'
  };
  return colors[color] || '#95A5A6';
}

function getGridLabel(x: number, y: number): string {
  const letter = String.fromCharCode(65 + x); // A, B, C, etc.
  const number = y + 1; // 1-based numbering
  return `${letter}${number}`;
}
