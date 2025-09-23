import React, { useState, useEffect } from 'react';
import type { MechanicData } from '../types/ClientTypes';

interface MechanicWarningsProps {
  mechanic: MechanicData | null;
  warningTime?: number;
}

export const MechanicWarnings: React.FC<MechanicWarningsProps> = ({ 
  mechanic 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!mechanic || !mechanic.isActive) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    
    const interval = setInterval(() => {
      const now = new Date();
      const remaining = mechanic.startTime.getTime() - now.getTime();
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        setIsVisible(false);
        clearInterval(interval);
      } else {
        setTimeRemaining(Math.ceil(remaining / 1000));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [mechanic]);

  if (!isVisible || !mechanic) {
    return null;
  }

  const mechanicInfo = getMechanicInfo(mechanic.type);
  const urgency = timeRemaining <= 3 ? 'urgent' : timeRemaining <= 5 ? 'warning' : 'normal';

  return (
    <div className={`mechanic-warning ${mechanic.type} ${urgency}`}>
      <div className="warning-content">
        <div className="warning-icon">
          {mechanicInfo.icon}
        </div>
        <div className="warning-text">
          <h3>{mechanicInfo.title}</h3>
          <p>{mechanicInfo.description}</p>
        </div>
        <div className="warning-timer">
          <div className="timer-circle">
            <span className="timer-text">{timeRemaining}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function getMechanicInfo(type: MechanicData['type']) {
  switch (type) {
    case 'lava_wave':
      return {
        icon: '🔥',
        title: 'Lava Wave Incoming!',
        description: 'The boss is charging up... lava wave incoming!'
      };
    case 'meteor_strike':
      return {
        icon: '☄️',
        title: 'Meteor Strike!',
        description: 'Dark clouds gather... meteors will rain from above!'
      };
    case 'pillar_phase':
      return {
        icon: '🏛️',
        title: 'Pillar Phase!',
        description: 'The ground trembles... seek shelter behind pillars!'
      };
    case 'chain_lightning':
      return {
        icon: '⚡',
        title: 'Chain Lightning!',
        description: 'Electric energy builds... spread out to avoid chains!'
      };
    case 'poison_pools':
      return {
        icon: '☠️',
        title: 'Poison Pools!',
        description: 'Toxic fumes rise... poison pools will form!'
      };
    case 'shockwave':
      return {
        icon: '💥',
        title: 'Shockwave!',
        description: 'The boss roars... massive shockwave expanding!'
      };
    default:
      return {
        icon: '⚠️',
        title: 'Boss Mechanic!',
        description: 'The boss is preparing a deadly attack!'
      };
  }
}
