// src/hooks/useSocket.ts
import { useEffect, useCallback, useState } from "react";
import { useSocket as useSocketContext } from "../contexts/SocketContext";
import { GameState, Player, RoomInfo, Message } from "../types";

interface SocketHookReturn {
  isConnected: boolean;
  roomList: RoomInfo[];
  messages: Message[];
  timeLeft: number;
  createRoom: (data: {
    playerName: string;
    roomName: string;
    password?: string;
    isAIMode?: boolean;
  }) => Promise<{ roomId?: string; playerRole?: Player; error?: string }>;
  joinRoom: (data: {
    roomId: string;
    playerName: string;
    password?: string;
  }) => Promise<{ playerRole?: Player; error?: string }>;
  startGame: (roomId: string) => Promise<{ success?: boolean; error?: string }>;
  placePiece: (data: {
    roomId: string;
    row: number;
    col: number;
    player: Player;
  }) => void;
  sendMessage: (roomId: string, message: string) => void;
  leaveRoom: () => void;
  requestRestart: (roomId: string) => void;
}

export function useSocket(): SocketHookReturn {
  const socket = useSocketContext();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [roomList, setRoomList] = useState<RoomInfo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onUpdateRoomList = (rooms: RoomInfo[]) => setRoomList(rooms);
    const onNewMessage = (msg: Message) =>
      setMessages((prev) => [...prev, msg]);
    const onTimerUpdate = (time: number) => setTimeLeft(time);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("updateRoomList", onUpdateRoomList);
    socket.on("newMessage", onNewMessage);
    socket.on("timerUpdate", onTimerUpdate);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("updateRoomList", onUpdateRoomList);
      socket.off("newMessage", onNewMessage);
      socket.off("timerUpdate", onTimerUpdate);
    };
  }, [socket]);

  const createRoom = useCallback(
    (data: {
      playerName: string;
      roomName: string;
      password?: string;
      isAIMode?: boolean;
    }) => {
      return new Promise<{
        roomId?: string;
        playerRole?: Player;
        error?: string;
      }>((resolve) => {
        socket.emit("createRoom", data, resolve);
      });
    },
    [socket]
  );

  const joinRoom = useCallback(
    (data: { roomId: string; playerName: string; password?: string }) => {
      return new Promise<{ playerRole?: Player; error?: string }>((resolve) => {
        socket.emit("joinRoom", data, resolve);
      });
    },
    [socket]
  );

  const startGame = useCallback(
    (roomId: string) => {
      return new Promise<{ success?: boolean; error?: string }>((resolve) => {
        socket.emit("startGame", { roomId }, resolve);
      });
    },
    [socket]
  );

  const placePiece = useCallback(
    (data: { roomId: string; row: number; col: number; player: Player }) => {
      socket.emit("placePiece", data);
    },
    [socket]
  );

  const sendMessage = useCallback(
    (roomId: string, message: string) => {
      socket.emit("sendMessage", { roomId, message });
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    socket.emit("leaveRoom");
    setMessages([]);
  }, [socket]);

  const requestRestart = useCallback(
    (roomId: string) => {
      socket.emit("requestRestart", { roomId });
    },
    [socket]
  );

  return {
    isConnected,
    roomList,
    messages,
    timeLeft,
    createRoom,
    joinRoom,
    startGame,
    placePiece,
    sendMessage,
    leaveRoom,
    requestRestart,
  };
}
