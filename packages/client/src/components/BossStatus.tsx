import React from 'react';
import type { ClientBoss } from '../types/ClientTypes';
import type { HeroismBoost } from '@pumpfun-game/shared';

interface BossStatusProps {
  boss: ClientBoss | null;
  heroismBoost: HeroismBoost | null;
}

export const BossStatus: React.FC<BossStatusProps> = ({ boss, heroismBoost }) => {
  if (!boss) {
    return (
      <div className="boss-status">
        <h3>Boss Status</h3>
        <div className="no-boss">
          <p>No boss active</p>
        </div>
      </div>
    );
  }

  const healthPercent = (boss.currentHealth / boss.maxHealth) * 100;
  const phaseColor = getPhaseColor(boss.phase);

  return (
    <div className="boss-status">
      <div className="boss-header">
        <h3>{boss.name}</h3>
        <span className={`phase-indicator phase-${boss.phase}`}>
          Phase {boss.phase}
        </span>
      </div>

      {/* Boss Health Bar */}
      <div className="health-section">
        <div className="health-label">
          <span>Health</span>
          <span>{boss.currentHealth.toLocaleString()} / {boss.maxHealth.toLocaleString()}</span>
        </div>
        <div className="health-bar">
          <div 
            className="health-fill"
            style={{ 
              width: `${healthPercent}%`,
              backgroundColor: phaseColor
            }}
          />
        </div>
        <div className="health-percent">
          {healthPercent.toFixed(1)}%
        </div>
      </div>

      {/* Boss Position */}
      <div className="boss-position">
        <span className="position-label">Position:</span>
        <span className="position-value">{getGridLabel(boss.position.x, boss.position.y)}</span>
      </div>

      {/* Heroism Boost */}
      <div className="heroism-section">
        <h4>Heroism Boost</h4>
        {heroismBoost ? (
          <div className="heroism-active">
            <div className="heroism-info">
              <span className="multiplier">{heroismBoost.multiplier}x Damage</span>
              <span className="participants">
                {heroismBoost.participants.length} participants
              </span>
            </div>
            <div className="heroism-timer">
              <span>Time remaining: {getTimeRemaining(heroismBoost.endTime)}</span>
            </div>
            <div className="heroism-bar">
              <div 
                className="heroism-fill"
                style={{ 
                  width: `${getHeroismProgress(heroismBoost)}%`
                }}
              />
            </div>
          </div>
        ) : (
          <div className="heroism-inactive">
            <p>No heroism boost active</p>
            <p className="heroism-hint">
              Type !heroism in chat to contribute
            </p>
          </div>
        )}
      </div>

      {/* Boss Status */}
      <div className="boss-info">
        <div className="info-item">
          <span className="info-label">Status:</span>
          <span className={`info-value ${boss.isAlive ? 'alive' : 'dead'}`}>
            {boss.isAlive ? 'Alive' : 'Defeated'}
          </span>
        </div>
        {boss.lastAttackAt && (
          <div className="info-item">
            <span className="info-label">Last Attack:</span>
            <span className="info-value">
              {getTimeAgo(boss.lastAttackAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

function getPhaseColor(phase: number): string {
  switch (phase) {
    case 1: return '#8E44AD'; // Purple
    case 2: return '#E67E22'; // Orange
    case 3: return '#C0392B'; // Red
    default: return '#95A5A6'; // Gray
  }
}

function getGridLabel(x: number, y: number): string {
  const letter = String.fromCharCode(65 + x); // A, B, C, etc.
  const number = y + 1; // 1-based numbering
  return `${letter}${number}`;
}

function getTimeRemaining(endTime: Date | string): string {
  const now = new Date();
  const endTimeObj = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  // Check if date is valid
  if (isNaN(endTimeObj.getTime())) {
    return 'Unknown';
  }
  
  const remaining = endTimeObj.getTime() - now.getTime();
  
  if (remaining <= 0) return '0s';
  
  const seconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function getHeroismProgress(heroismBoost: HeroismBoost): number {
  const now = new Date();
  const startTime = typeof heroismBoost.startTime === 'string' ? new Date(heroismBoost.startTime) : heroismBoost.startTime;
  const endTime = typeof heroismBoost.endTime === 'string' ? new Date(heroismBoost.endTime) : heroismBoost.endTime;
  
  const total = endTime.getTime() - startTime.getTime();
  const elapsed = now.getTime() - startTime.getTime();
  
  return Math.max(0, Math.min(100, (elapsed / total) * 100));
}

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Unknown';
  }
  
  const diff = now.getTime() - dateObj.getTime();
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
