import React from 'react';
import type { GameState, SquareState, Player } from '../types';

const Piece: React.FC<{ player: Player; size: number }> = ({ player, size }) => (
  <div style={{
    width: `${size * 0.8}px`,
    height: `${size * 0.8}px`,
    backgroundColor: player,
    borderRadius: '50%',
    boxShadow: '2px 2px 5px rgba(0,0,0,0.5)',
    zIndex: 1,
  }} />
);

const Square: React.FC<{ size: number; value: SquareState; onClick: () => void; isDisabled: boolean; isLastMove: boolean; }> = ({ size, value, onClick, isDisabled, isLastMove }) => (
  <div
    style={{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: '#d2b48c',
      border: '1px solid #8b4513',
      boxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
    }}
    onClick={isDisabled ? undefined : onClick}
  >
    {value && <Piece player={value} size={size} />}
    {isLastMove && <div style={{
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: 'red',
      borderRadius: '50%',
      zIndex: 2,
    }} />}
  </div>
);

interface BoardProps {
  squareSize: number;
  gameState: GameState;
  onSquareClick: (row: number, col: number) => void;
  isBoardDisabled: boolean;
}

const Board: React.FC<BoardProps> = ({ squareSize, gameState, onSquareClick, isBoardDisabled }) => {
  const boardSize = 15;
  const squares = [];
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const isLastMove = !!gameState.lastMove && gameState.lastMove.row === i && gameState.lastMove.col === j;
      squares.push(
        <Square
          key={`${i}-${j}`}
          size={squareSize}
          value={gameState.board[i][j]}
          onClick={() => onSquareClick(i, j)}
          isDisabled={isBoardDisabled}
          isLastMove={isLastMove}
        />
      );
    }
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: `repeat(${boardSize}, ${squareSize}px)`,
      gridTemplateColumns: `repeat(${boardSize}, ${squareSize}px)`,
      border: '2px solid #8b4513',
      boxShadow: '5px 5px 15px rgba(0,0,0,0.3)',
    }}>
      {squares}
    </div>
  );
};

export default Board;
