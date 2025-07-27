import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Form, message, Modal } from "antd";

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

const YOUR_COMPUTER_LAN_IP = "192.168.1.101"; // <--- 请务必修改成你自己的IP
const SERVER_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_SERVER_URL
    : `http://${YOUR_COMPUTER_LAN_IP}:10001`;
// const SERVER_URL = `http://${YOUR_COMPUTER_LAN_IP}:10001`;
const PLAYER_DATA_KEY = "gomokuPlayerData"; // NEW: 定义localStorage的键

// 新增：用于获取窗口宽度的自定义Hook
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
  const [step, setStep] = useState<Step>("name");
  const [playerName, setPlayerName] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("pve");
  const socketRef = useRef<Socket | null>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [playerRole, setPlayerRole] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState>(
    createInitialGameState()
  );
  const [isThinking, setIsThinking] = useState(false);
  const [aiPlayer, setAiPlayer] = useState<Player>("white");
  const [gameStarted, setGameStarted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
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

  // 新增：定义 isMobile 和 squareSize
  const width = useWindowWidth();
  const isMobile = width < 768;
  const [squareSize, setSquareSize] = useState(20);
  //检查是否已有玩家数据
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(PLAYER_DATA_KEY);
      if (savedData) {
        const { name, expiry } = JSON.parse(savedData);
        if (name && expiry && Date.now() < expiry) {
          setPlayerName(name);
          setStep("menu"); // 如果有有效的名字，直接跳到菜单
        } else {
          localStorage.removeItem(PLAYER_DATA_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to parse player data from localStorage", error);
      localStorage.removeItem(PLAYER_DATA_KEY);
    }
  }, []);
  // --- Socket.IO 连接和事件监听 ---
  useEffect(() => {
    if (gameMode === "pvp" && !socketRef.current) {
      //确保只连一次
      const socket = io(SERVER_URL);
      socketRef.current = socket;
      socket.on("connect", () => setIsConnected(true));
      socket.on("disconnect", () => setIsConnected(false));
      socket.on("updateRoomList", (rooms: RoomInfo[]) => setRoomList(rooms));
      socket.on("gameStateUpdate", (newGameState: GameState) =>
        setGameState(newGameState)
      );
      socket.on("gameStart", () => setGameStarted(true));
      socket.on("playersUpdate", (players) => {
        setPlayersInRoom(players);
        if (players.length === 2) setOpponentJoined(true);
      });
      socket.on("newMessage", (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
      });
      socket.on("opponentJoined", () => setOpponentJoined(true));
      socket.on("timerUpdate", (time: number) => setTimeLeft(time));
      socket.on("timeout", ({ winner, timedOutPlayer }) => {
        const winnerName = playersInRoom.find((p) => p.role === winner)?.name;
        const loserName = playersInRoom.find(
          (p) => p.role === timedOutPlayer
        )?.name;
        message.error(`${loserName} 超时, ${winnerName} 获胜!`);
      });
      // 监听对手离开事件
      socket.on("opponentLeft", ({ message: msg, newHostName }) => {
        message.info(msg);
        setGameStarted(false); // 游戏回到未开始状态
        setOpponentJoined(false); // 对手已离开
        // 如果当前玩家是新房主，更新一下界面信息
        const self = playersInRoom.find((p) => p.name === playerName);
        if (self && self.name === newHostName) {
          setPlayerRole("black");
        }
      });
      socket.on("opponentRequestedRestart", () => {
        setOpponentRequestedRestart(true);
        message.info("对手请求重新开始一局！");
      });
      socket.on("gameRestarted", ({ players }) => {
        message.success("游戏已重新开始！双方角色互换。");
        setRestartRequested(false);
        setOpponentRequestedRestart(false);
        setGameStarted(true);
        // Update player roles
        const self = players.find(
          (p: { name: string }) => p.name === playerName
        );
        if (self) {
          setPlayerRole(self.role);
        }
        setPlayersInRoom(players);
      });
      return () => {
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      };
    } else if (gameMode !== "pvp" && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [gameMode]);
  useEffect(() => {
    if (!gameState.isGameOver) {
      setRestartRequested(false);
      setOpponentRequestedRestart(false);
    }
  }, [gameState.isGameOver]);
  // 新增：响应式尺寸计算的 useEffect
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

  // --- PVE AI 逻辑 ---
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

  // --- 事件处理 ---
  const handleNameSubmit = ({ name }: { name: string }) => {
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
  };
  const handleSquareClick = (row: number, col: number) => {
    if (gameState.isGameOver || isThinking) return;
    if (gameMode === "pve") {
      if (gameState.currentPlayer !== aiPlayer)
        setGameState((prev) => handlePlacePiece(prev, row, col));
    } else if (gameMode === "pvp") {
      if (gameState.currentPlayer === playerRole && gameStarted)
        socketRef.current?.emit("placePiece", {
          roomId,
          row,
          col,
          player: playerRole,
        });
    }
  };
  const handleRestart = () => {
    if (gameMode === "pve") {
      const newAiPlayer = Math.random() < 0.5 ? "black" : "white";
      setAiPlayer(newAiPlayer);
      setGameState(createInitialGameState());
      if (newAiPlayer === "black") setIsThinking(true);
    }
  };

  // NEW: 主动离开房间的函数
  const handleLeaveRoom = () => {
    socketRef.current?.emit("leaveRoom");
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
  };

  const handleBackToLobby = () => {
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
  };
  const handleCreateRoom = (values: {
    roomName: string;
    password?: string;
  }) => {
    socketRef.current?.emit(
      "createRoom",
      { playerName, ...values },
      (response: { roomId?: string; playerRole?: Player; error?: string }) => {
        if (response.error) {
          message.error(response.error);
        } else {
          setIsCreateModalVisible(false);
          form.resetFields();
          setRoomId(response.roomId!);
          setPlayerRole(response.playerRole!);
          setPlayersInRoom([{ name: playerName, role: response.playerRole! }]);
          setStep("game");
        }
      }
    );
  };
  const handleRequestRestart = () => {
    if (!roomId) return;
    socketRef.current?.emit("requestRestart", { roomId });
    setRestartRequested(true);
  };
  const handleJoinRoom = (room: RoomInfo) => {
    if (room.playerCount >= 2) return message.error("房间已满");
    if (room.hasPassword) {
      setJoiningRoom(room);
    } else {
      socketRef.current?.emit(
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
  };
  const handlePasswordSubmit = (values: { password?: string }) => {
    if (!joiningRoom) return;
    socketRef.current?.emit(
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
  };
  const handleSendMessage = (msg: string) =>
    socketRef.current?.emit("sendMessage", { roomId, message: msg });
  const handleStartGame = () => {
    socketRef.current?.emit(
      "startGame",
      { roomId },
      (response: { success?: boolean; error?: string }) => {
        if (response.error) message.error(response.error);
      }
    );
  };

  // --- 渲染函数 ---
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
            selfId={socketRef.current?.id || null}
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
