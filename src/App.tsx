import { useState, useEffect, useRef, useCallback } from "react";
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

const SERVER_URL = import.meta.env.VITE_SERVER_URL;
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

  // 作用: 这是解决无限重连循环的核心。
  // 1. useEffect 的依赖数组只保留 [gameMode]，确保只在切换游戏模式时才执行连接或断开操作。
  // 2. 所有事件监听器只在 socket 创建时绑定一次，避免重复绑定。
  // 3. 使用 ref (stateRef) 来让事件监听器内部总能访问到最新的 state，解决了闭包问题，
  //    同时避免了将大量 state 放入 useEffect 依赖数组中。
  const stateRef = useRef({ playerName, playersInRoom });
  useEffect(() => {
    stateRef.current = { playerName, playersInRoom };
  }, [playerName, playersInRoom]);

  useEffect(() => {
    if (gameMode === "pvp") {
      // 模式是 pvp，我们需要一个 socket 连接
      if (!socketRef.current) {
        // 如果当前没有连接，则创建一个
        const socket = io(SERVER_URL, {
          transports: ["websocket"],
        });
        socketRef.current = socket;

        // --- 只绑定一次事件监听器 ---
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
          const { playersInRoom: currentPlayers } = stateRef.current;
          const winnerName = currentPlayers.find((p) => p.role === winner)?.name;
          const loserName = currentPlayers.find(
            (p) => p.role === timedOutPlayer
          )?.name;
          message.error(`${loserName} 超时, ${winnerName} 获胜!`);
        });

        socket.on("opponentLeft", ({ message: msg, newHostName }) => {
          message.info(msg);
          setGameStarted(false);
          setOpponentJoined(false);
          const { playerName: currentName, playersInRoom: currentPlayers } = stateRef.current;
          const self = currentPlayers.find((p) => p.name === currentName);
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
          const { playerName: currentName } = stateRef.current;
          const self = players.find(
            (p: { name: string }) => p.name === currentName
          );
          if (self) {
            setPlayerRole(self.role);
          }
          setPlayersInRoom(players);
        });
      }
    } else {
      // 模式不是 pvp，我们应该断开并清理连接
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    }

    // 这个 cleanup 只在组件卸载时执行，确保应用关闭时断开连接
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [gameMode]); // 依赖数组只保留 gameMode!

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

  // --- 所有 useCallback 函数保持不变 ---
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
          socketRef.current?.emit("placePiece", {
            roomId,
            row,
            col,
            player: playerRole,
          });
      }
    },
    [gameState, isThinking, gameMode, aiPlayer, playerRole, gameStarted, roomId]
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
  }, []);

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
      socketRef.current?.emit(
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
    [playerName, form]
  );
  const handleRequestRestart = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit("requestRestart", { roomId });
    setRestartRequested(true);
  }, [roomId]);
  const handleJoinRoom = useCallback(
    (room: RoomInfo) => {
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
    },
    [playerName]
  );
  const handlePasswordSubmit = useCallback(
    (values: { password?: string }) => {
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
    },
    [joiningRoom, playerName]
  );
  const handleSendMessage = useCallback(
    (msg: string) =>
      socketRef.current?.emit("sendMessage", { roomId, message: msg }),
    [roomId]
  );

  const handleStartGame = useCallback(() => {
    socketRef.current?.emit(
      "startGame",
      { roomId },
      (response: { success?: boolean; error?: string }) => {
        if (response.error) message.error(response.error);
      }
    );
  }, [roomId]);

  // --- renderContent 保持不变 ---
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
