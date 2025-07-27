import React from "react";
import { Button, Spin } from "antd";
import Board from "./Board";
import GameStatus from "./GameStatus";
import ChatBox from "./chatBox";
import type { GameState, GameMode, Player, Message } from "../types";

interface GameScreenProps {
  isMobile: boolean;
  gameMode: GameMode;
  gameStarted: boolean;
  opponentJoined: boolean;
  playersInRoom: { name: string; role: Player }[];
  playerRole: Player | null;
  onStartGame: () => void;
  onBackToLobby: () => void;
  squareSize: number;
  gameState: GameState;
  onSquareClick: (row: number, col: number) => void;
  isThinking: boolean;
  aiPlayer: Player;
  playerName: string;
  timeLeft: number;
  messages: Message[];
  onSendMessage: (msg: string) => void;
  selfId: string | null;
  onRestart: () => void;
  onRestartPVP: () => void;
  restartRequested: boolean;
  opponentRequestedRestart: boolean;
}

const GameScreen: React.FC<GameScreenProps> = (props) => {
  const {
    isMobile,
    gameMode,
    gameStarted,
    opponentJoined,
    playersInRoom,
    playerRole,
    onStartGame,
    onBackToLobby,
    squareSize,
    gameState,
    onSquareClick,
    isThinking,
    aiPlayer,
    playerName,
    timeLeft,
    messages,
    onSendMessage,
    selfId,
    onRestart,
    onRestartPVP,
    restartRequested,
    opponentRequestedRestart,
  } = props;

  const mainStyle: React.CSSProperties = {
    display: "flex",
    width: "100vw",
    height: "100vh",
    padding: "1rem",
    boxSizing: "border-box",
    flexDirection: isMobile ? "column" : "row",
  };
  const gameAreaStyle: React.CSSProperties = {
    flex: isMobile ? "0 0 auto" : "0.7",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: isMobile ? "auto" : "100%",
    paddingBottom: isMobile ? "1rem" : 0,
  };
  const infoPanelStyle: React.CSSProperties = {
    flex: isMobile ? "1 1 auto" : "0.3",
    display: "flex",
    flexDirection: "column",
    height: isMobile ? "auto" : "100%",
    paddingLeft: isMobile ? 0 : "1rem",
    overflow: "hidden",
  };

  const renderGameControl = () => {
    if (gameMode === "pvp" && !gameStarted) {
      return (
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            borderRadius: "8px",
          }}>
          {!opponentJoined ? (
            <>
              <p>等待对手加入...</p>
              <Spin style={{ margin: "1rem 0" }} />
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#28a745", fontWeight: "600" }}>
                {playersInRoom.find((p) => p.role !== playerRole)?.name ||
                  "对手"}{" "}
                已加入!
              </p>
              {playerRole === "black" ? (
                <Button type="primary" size="large" onClick={onStartGame}>
                  开始游戏
                </Button>
              ) : (
                <p>等待房主开始游戏...</p>
              )}
            </div>
          )}
        </div>
      );
    }
    return gameMode === "pvp" ? (
      <ChatBox
        messages={messages}
        onSendMessage={onSendMessage}
        selfId={selfId}
      />
    ) : (
      <div style={{ flexGrow: 1 }}></div>
    );
  };

  const renderPvpRestartButton = () => {
    // If the opponent has requested a restart, the button shows "Agree to Restart".
    if (opponentRequestedRestart) {
      return (
        <Button
          onClick={onRestartPVP}
          type="primary"
          style={{ marginRight: "10px" }}>
          同意重开
        </Button>
      );
    }
    // If the current player has requested a restart, the button is disabled and shows "Waiting for opponent...".
    if (restartRequested) {
      return (
        <Button onClick={onRestartPVP} style={{ marginRight: "10px" }} disabled>
          等待对手...
        </Button>
      );
    }
    // Otherwise, it shows the standard "Play Again" button.
    return (
      <Button onClick={onRestartPVP} style={{ marginRight: "10px" }}>
        再来一局
      </Button>
    );
  };

  return (
    <div style={mainStyle}>
      <div id="game-area" style={gameAreaStyle}>
        <Board
          squareSize={squareSize}
          gameState={gameState}
          onSquareClick={onSquareClick}
          isBoardDisabled={
            isThinking ||
            gameState.isGameOver ||
            (gameMode === "pvp" &&
              (!gameStarted || gameState.currentPlayer !== playerRole))
          }
        />
      </div>
      <div style={infoPanelStyle}>
        <GameStatus
          gameState={gameState}
          gameMode={gameMode}
          aiPlayer={aiPlayer}
          playerRole={playerRole}
          playerName={playerName}
          players={playersInRoom}
          timeLeft={timeLeft}
          gameStarted={gameStarted}
        />
        {renderGameControl()}
        <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
          {gameState.isGameOver && gameMode === "pve" && (
            <Button onClick={onRestart} style={{ marginRight: "10px" }}>
              再来一局
            </Button>
          )}
          {gameState.isGameOver &&
            gameMode === "pvp" &&
            renderPvpRestartButton()}
          <Button onClick={onBackToLobby}>返回大厅</Button>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
