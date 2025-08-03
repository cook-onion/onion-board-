import { useState, useEffect, useCallback } from "react";
import { Form, message, Modal } from "antd";
import { useSocket } from "./contexts/SocketContext"; // 导入 useSocket Hook

import {
  createInitialGameState,
  handlePlacePiece,
  findComputerMove,
} from "./gameLogic";
import type {
  GameState,
  Player,
  RoomInfo,
  Message,
  Step,
  GameMode,
} from "./types";

// 导入新的组件
import NameInput from "./components/NameInput";
import MainMenu from "./components/MainMenu";
import GameLobby from "./components/GameLobby";
import GameScreen from "./components/GameScreen";

const PLAYER_DATA_KEY = "gomokuPlayerData";

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
};

function App() {
  const socket = useSocket(); // 从 Context 获取 socket 实例
  
  const [step, setStep] = useState<Step>("name");
  const [playerName, setPlayerName] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("pve");
  const [roomId, setRoomId] = useState<string>("");
  const [playerRole, setPlayerRole] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState>(
    createInitialGameState()
  );
  const [isThinking, setIsThinking] = useState(false);
  const [aiPlayer, setAiPlayer] = useState<Player>("white");
  const [gameStarted, setGameStarted] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState<Message[]>([]);
  const [playersInRoom, setPlayersInRoom] = useState<
    { name: string; role: Player }[]
  >([]);
  const [roomList, setRoomList] = useState<RoomInfo[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<RoomInfo | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [form] = Form.useForm();
  const [restartRequested, setRestartRequested] = useState(false);
  const [opponentRequestedRestart, setOpponentRequestedRestart] =
    useState(false);

  const width = useWindowWidth();
  const isMobile = width < 768;
  const [squareSize, setSquareSize] = useState(20);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(PLAYER_DATA_KEY);
      if (savedData) {
        const { name, expiry } = JSON.parse(savedData);
        if (name && expiry && Date.now() < expiry) {
          setPlayerName(name);
          setStep("menu");
        } else {
          localStorage.removeItem(PLAYER_DATA_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to parse player data from localStorage", error);
      localStorage.removeItem(PLAYER_DATA_KEY);
    }
  }, []);

  // --- 彻底简化的 useEffect ---
  // 作用: 只负责绑定和解绑事件监听器
  useEffect(() => {
    function onConnect() { setIsConnected(true); }
    function onDisconnect() { setIsConnected(false); }
    function onUpdateRoomList(rooms: RoomInfo[]) { setRoomList(rooms); }
    function onGameStateUpdate(newGameState: GameState) { setGameState(newGameState); }
    function onGameStart() { setGameStarted(true); }
    function onPlayersUpdate(players: { name: string; role: Player }[]) {
      setPlayersInRoom(players);
      if (players.length === 2) setOpponentJoined(true);
    }
    function onNewMessage(msg: Message) { setMessages((prev) => [...prev, msg]); }
    function onOpponentJoined() { setOpponentJoined(true); }
    function onTimerUpdate(time: number) { setTimeLeft(time); }
    function onOpponentRequestedRestart() {
        setOpponentRequestedRestart(true);
        message.info("对手请求重新开始一局！");
    }
    function onGameRestarted({ players }: { players: { name: string; role: Player }[] }) {
        message.success("游戏已重新开始！双方角色互换。");
        setRestartRequested(false);
        setOpponentRequestedRestart(false);
        setGameStarted(true);
        const self = players.find((p) => p.name === playerName);
        if (self) setPlayerRole(self.role);
        setPlayersInRoom(players);
    }
    function onOpponentLeft({ message: msg, newHostName }: { message: string, newHostName: string }) {
        message.info(msg);
        setGameStarted(false);
        setOpponentJoined(false);
        const self = playersInRoom.find((p) => p.name === playerName);
        if (self && self.name === newHostName) setPlayerRole("black");
    }
    function onTimeout({ winner, timedOutPlayer }: { winner: Player, timedOutPlayer: Player }) {
        const winnerName = playersInRoom.find((p) => p.role === winner)?.name;
        const loserName = playersInRoom.find((p) => p.role === timedOutPlayer)?.name;
        message.error(`${loserName} 超时, ${winnerName} 获胜!`);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("updateRoomList", onUpdateRoomList);
    socket.on("gameStateUpdate", onGameStateUpdate);
    socket.on("gameStart", onGameStart);
    socket.on("playersUpdate", onPlayersUpdate);
    socket.on("newMessage", onNewMessage);
    socket.on("opponentJoined", onOpponentJoined);
    socket.on("timerUpdate", onTimerUpdate);
    socket.on("opponentRequestedRestart", onOpponentRequestedRestart);
    socket.on("gameRestarted", onGameRestarted);
    socket.on("opponentLeft", onOpponentLeft);
    socket.on("timeout", onTimeout);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("updateRoomList", onUpdateRoomList);
      socket.off("gameStateUpdate", onGameStateUpdate);
      socket.off("gameStart", onGameStart);
      socket.off("playersUpdate", onPlayersUpdate);
      socket.off("newMessage", onNewMessage);
      socket.off("opponentJoined", onOpponentJoined);
      socket.off("timerUpdate", onTimerUpdate);
      socket.off("opponentRequestedRestart", onOpponentRequestedRestart);
      socket.off("gameRestarted", onGameRestarted);
      socket.off("opponentLeft", onOpponentLeft);
      socket.off("timeout", onTimeout);
    };
  }, [socket, playerName, playersInRoom]); // 依赖项现在是安全的

  // --- 控制连接状态的 useEffect ---
  useEffect(() => {
    if (gameMode === 'pvp') {
      socket.connect();
    } else {
      socket.disconnect();
    }
  }, [gameMode, socket]);

  useEffect(() => {
    if (!gameState.isGameOver) {
      setRestartRequested(false);
      setOpponentRequestedRestart(false);
    }
  }, [gameState.isGameOver]);

  useEffect(() => {
    const calculateSize = () => {
      const gameArea = document.getElementById("game-area");
      if (gameArea) {
        const smallerDim =
          Math.min(gameArea.clientWidth, gameArea.clientHeight) *
          (isMobile ? 0.9 : 0.95);
        setSquareSize(Math.max(16, Math.floor(smallerDim / 15)));
      }
    };
    if (step === "game") {
      calculateSize();
      window.addEventListener("resize", calculateSize);
    }
    return () => window.removeEventListener("resize", calculateSize);
  }, [step, gameStarted, width, isMobile]);

  useEffect(() => {
    if (
      step === "game" &&
      gameMode === "pve" &&
      gameState.currentPlayer === aiPlayer &&
      !gameState.isGameOver
    ) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const aiMove = findComputerMove(gameState.board, aiPlayer);
        setGameState((prev) => handlePlacePiece(prev, aiMove.row, aiMove.col));
        setIsThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, gameMode, gameState, aiPlayer]);

  const handleNameSubmit = useCallback(({ name }: { name: string }) => {
    if (name.trim()) {
      const trimmedName = name.trim();
      setPlayerName(trimmedName);
      setStep("menu");
      const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(
        PLAYER_DATA_KEY,
        JSON.stringify({ name: trimmedName, expiry })
      );
    }
  }, []);

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (gameState.isGameOver || isThinking) return;
      if (gameMode === "pve") {
        if (gameState.currentPlayer !== aiPlayer)
          setGameState((prev) => handlePlacePiece(prev, row, col));
      } else if (gameMode === "pvp") {
        if (gameState.currentPlayer === playerRole && gameStarted)
          socket.emit("placePiece", {
            roomId,
            row,
            col,
            player: playerRole,
          });
      }
    },
    [gameState, isThinking, gameMode, aiPlayer, playerRole, gameStarted, roomId, socket]
  );

  const handleRestart = useCallback(() => {
    if (gameMode === "pve") {
      const newAiPlayer = Math.random() < 0.5 ? "black" : "white";
      setAiPlayer(newAiPlayer);
      setGameState(createInitialGameState());
      if (newAiPlayer === "black") setIsThinking(true);
    }
  }, [gameMode]);

  const handleLeaveRoom = useCallback(() => {
    socket.emit("leaveRoom");
    setStep("lobby");
    setRoomId("");
    setPlayerRole(null);
    setGameStarted(false);
    setGameState(createInitialGameState());
    setMessages([]);
    setPlayersInRoom([]);
    setOpponentJoined(false);
    setRestartRequested(false);
    setOpponentRequestedRestart(false);
  }, [socket]);

  const handleBackToLobby = useCallback(() => {
    try {
      Modal.confirm({
        title: "确认返回大厅吗?",
        content: "返回大厅将离开当前房间，游戏进度不会保存。",
        okText: "确认",
        cancelText: "取消",
        maskClosable: false,
        onOk: () => {
          handleLeaveRoom();
        },
      });
    } catch (error) {
      console.log(error);
    }
  }, [handleLeaveRoom]);

  const handleCreateRoom = useCallback(
    (values: { roomName: string; password?: string }) => {
      socket.emit(
        "createRoom",
        { playerName, ...values },
        (response: {
          roomId?: string;
          playerRole?: Player;
          error?: string;
        }) => {
          if (response.error) {
            message.error(response.error);
          } else {
            setIsCreateModalVisible(false);
            form.resetFields();
            setRoomId(response.roomId!);
            setPlayerRole(response.playerRole!);
            setPlayersInRoom([
              { name: playerName, role: response.playerRole! },
            ]);
            setStep("game");
          }
        }
      );
    },
    [playerName, form, socket]
  );

  const handleRequestRestart = useCallback(() => {
    if (!roomId) return;
    socket.emit("requestRestart", { roomId });
    setRestartRequested(true);
  }, [roomId, socket]);

  const handleJoinRoom = useCallback(
    (room: RoomInfo) => {
      if (room.playerCount >= 2) return message.error("房间已满");
      if (room.hasPassword) {
        setJoiningRoom(room);
      } else {
        socket.emit(
          "joinRoom",
          { roomId: room.roomId, playerName },
          ({
            playerRole: role,
            error,
          }: {
            playerRole?: Player;
            error?: string;
          }) => {
            if (error) message.error(error);
            else {
              setRoomId(room.roomId);
              setPlayerRole(role!);
              setStep("game");
            }
          }
        );
      }
    },
    [playerName, socket]
  );

  const handlePasswordSubmit = useCallback(
    (values: { password?: string }) => {
      if (!joiningRoom) return;
      socket.emit(
        "joinRoom",
        { roomId: joiningRoom.roomId, playerName, password: values.password },
        ({
          playerRole: role,
          error,
        }: {
          playerRole?: Player;
          error?: string;
        }) => {
          if (error) {
            message.error(error);
          } else {
            setRoomId(joiningRoom.roomId);
            setPlayerRole(role!);
            setJoiningRoom(null);
            setStep("game");
          }
        }
      );
    },
    [joiningRoom, playerName, socket]
  );

  const handleSendMessage = useCallback(
    (msg: string) =>
      socket.emit("sendMessage", { roomId, message: msg }),
    [roomId, socket]
  );

  const handleStartGame = useCallback(() => {
    socket.emit(
      "startGame",
      { roomId },
      (response: { success?: boolean; error?: string }) => {
        if (response.error) message.error(response.error);
      }
    );
  }, [roomId, socket]);

  const renderContent = () => {
    switch (step) {
      case "name":
        return <NameInput onNameSubmit={handleNameSubmit} />;
      case "menu":
        return (
          <MainMenu
            playerName={playerName}
            onSetGameMode={setGameMode}
            onSetStep={setStep}
            onRestartPVE={handleRestart}
          />
        );
      case "lobby":
        return (
          <GameLobby
            isConnected={isConnected}
            roomList={roomList}
            onJoinRoom={handleJoinRoom}
            onSetCreateModalVisible={setIsCreateModalVisible}
            onBackToMenu={() => setStep("menu")}
            isCreateModalVisible={isCreateModalVisible}
            form={form}
            onCreateRoom={handleCreateRoom}
            joiningRoom={joiningRoom}
            onSetJoiningRoom={setJoiningRoom}
            onPasswordSubmit={handlePasswordSubmit}
          />
        );
      case "game":
        return (
          <GameScreen
            isMobile={isMobile}
            gameMode={gameMode}
            gameStarted={gameStarted}
            opponentJoined={opponentJoined}
            playersInRoom={playersInRoom}
            playerRole={playerRole}
            onStartGame={handleStartGame}
            onBackToLobby={handleBackToLobby}
            squareSize={squareSize}
            gameState={gameState}
            onSquareClick={handleSquareClick}
            isThinking={isThinking}
            aiPlayer={aiPlayer}
            playerName={playerName}
            timeLeft={timeLeft}
            messages={messages}
            onSendMessage={handleSendMessage}
            selfId={socket.id || null}
            onRestart={handleRestart}
            onRestartPVP={handleRequestRestart}
            restartRequested={restartRequested}
            opponentRequestedRestart={opponentRequestedRestart}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f0e6d2",
      }}>
      {renderContent()}
    </div>
  );
}

export default App;
