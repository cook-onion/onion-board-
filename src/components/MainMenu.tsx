// src/components/MainMenu.tsx
import React from 'react';
import { Button } from 'antd';

interface MainMenuProps {
  playerName: string;
  onSetGameMode: (mode: 'pve' | 'pvp') => void;
  onSetStep: (step: 'game' | 'lobby') => void;
  onRestartPVE: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ playerName, onSetGameMode, onSetStep, onRestartPVE }) => (
  <div style={{ textAlign: 'center' }}>
    <h1>五子棋</h1>
    <h3>你好, {playerName}!</h3>
    <Button
      type="primary"
      size="large"
      onClick={() => { onSetGameMode('pve'); onSetStep('game'); onRestartPVE(); }}
      style={{ margin: '10px' }}
    >
      人机对战 (PVE)
    </Button>
    <Button
      type="primary"
      size="large"
      onClick={() => { onSetGameMode('pvp'); onSetStep('lobby'); }}
      style={{ margin: '10px' }}
    >
      在线对战 (PVP)
    </Button>
  </div>
);

export default MainMenu;