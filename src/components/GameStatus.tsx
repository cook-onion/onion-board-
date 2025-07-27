import React from 'react';
import type { GameState, GameMode, Player } from '../types';

interface GameStatusProps {
  gameState: GameState;
  gameMode: GameMode;
  aiPlayer?: Player;
  playerRole?: Player | null;
  playerName: string;
  players: { name: string; role: Player }[];
  timeLeft: number;
  gameStarted: boolean;
}

const GameStatus: React.FC<GameStatusProps> = ({ gameState, gameMode, aiPlayer, playerRole, playerName, players, timeLeft, gameStarted }) => {
  const { isGameOver, winner, currentPlayer } = gameState;
  let statusText: string;

  const getPlayerNameByRole = (role: Player) => players.find(p => p.role === role)?.name || (role === 'black' ? '黑方' : '白方');

  if (isGameOver) {
    let winnerName = '未知';
    if(winner) winnerName = gameMode === 'pve' ? (winner === aiPlayer ? '电脑' : playerName) : getPlayerNameByRole(winner);
    statusText = `游戏结束！胜利者是：${winnerName}`;
  } else {
    let turnName = gameMode === 'pve' ? (currentPlayer === aiPlayer ? '电脑' : playerName) : getPlayerNameByRole(currentPlayer);
    statusText = `当前回合：${turnName} (${currentPlayer === 'black' ? '黑方' : '白方'})`;
  }

  return (
    <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
      <p style={{ fontSize: '1.2rem', color: '#654321', fontFamily: 'sans-serif', margin: 0 }}>{statusText}</p>
      {!isGameOver && gameStarted && <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft < 10 ? 'red' : '#333', margin: '0.5rem 0 0' }}>{timeLeft}</p>}
    </div>
  );
};

export default GameStatus;
