import React from 'react';
import type { AssetLoadingProgress } from '../types/ClientTypes';

interface LoadingScreenProps {
  progress: AssetLoadingProgress;
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  progress, 
  message = 'Loading...' 
}) => {
  const progressPercent = Math.round(progress.progress * 100);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-header">
          <h1>PumpFun Boss Fight Game</h1>
          <p>{message}</p>
        </div>

        <div className="loading-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="progress-text">
            {progress.loaded} / {progress.total} assets loaded ({progressPercent}%)
          </div>
        </div>

        {progress.errors.length > 0 && (
          <div className="loading-errors">
            <h4>Loading Errors:</h4>
            <ul>
              {progress.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>

        <div className="loading-tips">
          <h4>Game Tips:</h4>
          <ul>
            <li>Type <code>!join</code> to enter the game</li>
            <li>Use <code>!up</code>, <code>!down</code>, <code>!left</code>, <code>!right</code> to move</li>
            <li>Type <code>!attack</code> to attack the boss</li>
            <li>Type <code>!heroism</code> to contribute to damage boost</li>
            <li>Type <code>!respawn</code> to return after death</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
