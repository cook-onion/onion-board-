// src/constants/gameConfig.ts
export const GAME_CONFIG = {
  BOARD_SIZE: 15,
  TURN_TIME_LIMIT: 60, // 秒
  AI_THINKING_TIME: 500, // 毫秒
  RECONNECT_TIMEOUT: 5000, // 毫秒
  MAX_MESSAGES: 100, // 聊天消息最大数量
  PLAYER_DATA_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7天
} as const;

export const STORAGE_KEYS = {
  PLAYER_DATA: "gomokuPlayerData",
  GAME_SETTINGS: "gomokuSettings",
} as const;

export const SOCKET_EVENTS = {
  // 连接相关
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // 房间相关
  CREATE_ROOM: "createRoom",
  JOIN_ROOM: "joinRoom",
  LEAVE_ROOM: "leaveRoom",
  UPDATE_ROOM_LIST: "updateRoomList",

  // 游戏相关
  START_GAME: "startGame",
  PLACE_PIECE: "placePiece",
  GAME_STATE_UPDATE: "gameStateUpdate",
  TIMER_UPDATE: "timerUpdate",

  // 玩家相关
  PLAYERS_UPDATE: "playersUpdate",
  OPPONENT_JOINED: "opponentJoined",
  OPPONENT_LEFT: "opponentLeft",

  // 消息相关
  SEND_MESSAGE: "sendMessage",
  NEW_MESSAGE: "newMessage",

  // 重启相关
  REQUEST_RESTART: "requestRestart",
  GAME_RESTARTED: "gameRestarted",
  OPPONENT_REQUESTED_RESTART: "opponentRequestedRestart",

  // 错误处理
  ERROR: "error",
  TIMEOUT: "timeout",
} as const;

export const AI_DIFFICULTY = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
} as const;

export const GAME_STATUS = {
  WAITING: "waiting",
  PLAYING: "playing",
  FINISHED: "finished",
} as const;
