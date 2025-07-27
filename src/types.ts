import type { GameState as LogicGameState, Player as LogicPlayer, SquareState as LogicSquareState } from './gameLogic';

// 从 gameLogic.ts 继承并导出核心类型
export type Player = LogicPlayer;
export type SquareState = LogicSquareState;
export type GameState = LogicGameState;

// 应用特定的类型
export interface RoomInfo {
  roomId: string;
  roomName: string;
  playerCount: number;
  hasPassword: boolean;
  hostName: string;
  status: 'waiting' | 'playing' | 'finished';
}

export interface Message {
  senderId: string;
  senderName: string;
  text: string;
}

export type Step = 'name' | 'menu' | 'lobby' | 'game';
export type GameMode = 'pve' | 'pvp';
