//定义玩家类型，只能是black或者是white
export type Player = "black" | "white";

//定义棋格的状态，可以是某个玩家或者是空
export type SquareState = Player | null;

//定义棋盘状态，是由一个二维数组组成
export type BoardState = SquareState[][];

//定义游戏状态的完整结构
export interface GameState {
  board: BoardState;
  currentPlayer: Player;
  isGameOver: boolean;
  winner: Player | null;
  lastMove: { row: number; col: number } | null; // 新增：记录最后一步
}

import { GAME_CONFIG } from "./constants/gameConfig";

const BOARD_SIZE = GAME_CONFIG.BOARD_SIZE;

/*
 * 初始化棋盘
 * @returns {GameState} 初始化游戏状态对象
 */

export function createInitialGameState(): GameState {
  return {
    board: Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null)),
    currentPlayer: "black",
    isGameOver: false,
    winner: null,
    lastMove: null, // 初始化 lastMove
  };
}

// handlePlacePiece 函数已更新
export function handlePlacePiece(
  currentState: GameState,
  row: number,
  col: number
): GameState {
  if (currentState.isGameOver || currentState.board[row][col]) {
    return currentState;
  }

  const newBoard = currentState.board.map((r) => [...r]);
  newBoard[row][col] = currentState.currentPlayer;

  const hasWon = checkWin(newBoard, row, col);
  const nextPlayer = currentState.currentPlayer === "black" ? "white" : "black";

  return {
    board: newBoard,
    currentPlayer: nextPlayer,
    isGameOver: hasWon,
    winner: hasWon ? currentState.currentPlayer : null,
    lastMove: { row, col }, // 更新 lastMove
  };
}
/*
* 检查棋子落子之后，是否产生胜利者
*@param board -当前棋盘状态
*@param row -落子行
*@param col -落子列
@returns  {boolean} 产生胜利者后返回true
 */
export function checkWin(board: BoardState, row: number, col: number): boolean {
  const player = board[row][col];
  if (!player) return false;
  //定义四个检查方向：水平、垂直、主对角线、副对角线
  const directions = [
    { dr: 0, dc: 1 }, //水平
    { dr: 1, dc: 0 }, //垂直
    { dr: 1, dc: 1 }, //主对角线
    { dr: 1, dc: -1 }, //副对角线
  ];

  for (const { dr, dc } of directions) {
    let count = 1; //计数器，包含当前落下的子
    for (let i = 1; i < 5; i++) {
      const r = row + i * dr;
      const c = col + i * dc;
      if (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        board[r][c] === player
      ) {
        count++;
      } else {
        break; //遇到不同棋子或者边界就退出
      }
    }
    //检查相反方向
    for (let i = 1; i < 5; i++) {
      const r = row - i * dr;
      const c = col - i * dc;
      if (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        board[r][c] == player
      ) {
        count++;
      } else {
        break; // 遇到不同棋子或者边界，停止检查
      }
    }
    if (count >= 5) return true; //如果任意方向上连续五个棋子，则产生胜利者
  }
  return false;
}

/**
 * 威胁信息接口
 */
interface Threat {
  row: number;
  col: number;
  priority: "win" | "threat";
  score?: number;
}

/**
 * 评估棋盘上某个位置的分数
 * @param board - 棋盘状态
 * @param row - 行坐标
 * @param col - 列坐标
 * @param player - 玩家类型
 * @returns 该位置的评估分数
 */
export function evaluatePosition(
  board: BoardState,
  row: number,
  col: number,
  player: Player
): number {
  let score = 0;
  const directions = [
    { dr: 0, dc: 1 }, // 水平
    { dr: 1, dc: 0 }, // 垂直
    { dr: 1, dc: 1 }, // 主对角线
    { dr: 1, dc: -1 }, // 副对角线
  ];

  for (const { dr, dc } of directions) {
    const lineScore = evaluateLine(board, row, col, dr, dc, player);
    score += lineScore;
  }

  return score;
}

/**
 * 评估某条线上的分数
 * @param board - 棋盘状态
 * @param row - 起始行
 * @param col - 起始列
 * @param dr - 行方向增量
 * @param dc - 列方向增量
 * @param player - 玩家类型
 * @returns 该线的评估分数
 */
function evaluateLine(
  board: BoardState,
  row: number,
  col: number,
  dr: number,
  dc: number,
  player: Player
): number {
  let count = 1; // 包含当前位置
  let openEnds = 0; // 开放端点数量

  // 向正方向检查
  let r = row + dr,
    c = col + dc;
  while (
    r >= 0 &&
    r < BOARD_SIZE &&
    c >= 0 &&
    c < BOARD_SIZE &&
    board[r][c] === player
  ) {
    count++;
    r += dr;
    c += dc;
  }
  if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && !board[r][c]) {
    openEnds++;
  }

  // 向负方向检查
  r = row - dr;
  c = col - dc;
  while (
    r >= 0 &&
    r < BOARD_SIZE &&
    c >= 0 &&
    c < BOARD_SIZE &&
    board[r][c] === player
  ) {
    count++;
    r -= dr;
    c -= dc;
  }
  if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && !board[r][c]) {
    openEnds++;
  }

  // 根据连子数量和开放端点计算分数
  return calculateLineScore(count, openEnds);
}

/**
 * 根据连子数量和开放情况计算分数
 * @param count - 连续棋子数量
 * @param openEnds - 开放端点数量
 * @returns 计算出的分数
 */
function calculateLineScore(count: number, openEnds: number): number {
  if (count >= 5) return 100000; // 五连，必胜
  if (count === 4) {
    if (openEnds === 2) return 10000; // 活四
    if (openEnds === 1) return 1000; // 冲四
  }
  if (count === 3) {
    if (openEnds === 2) return 1000; // 活三
    if (openEnds === 1) return 100; // 眠三
  }
  if (count === 2) {
    if (openEnds === 2) return 100; // 活二
    if (openEnds === 1) return 10; // 眠二
  }
  if (count === 1) {
    if (openEnds === 2) return 10; // 活一
    if (openEnds === 1) return 1; // 眠一
  }
  return 0;
}

/**
 * 检查是否存在威胁（对方即将获胜的情况）
 * @param board - 棋盘状态
 * @param player - 玩家类型
 * @returns 威胁位置数组
 */
export function findThreats(board: BoardState, player: Player): Threat[] {
  const threats: Threat[] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (!board[i][j]) {
        const testBoard = board.map((r) => [...r]);
        testBoard[i][j] = player;
        if (checkWin(testBoard, i, j)) {
          threats.push({ row: i, col: j, priority: "win" });
        } else {
          const score = evaluatePosition(testBoard, i, j, player);
          if (score >= 1000) {
            // 活三或冲四
            threats.push({ row: i, col: j, priority: "threat", score });
          }
        }
      }
    }
  }
  return threats.sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * 获取候选落子位置（在已有棋子附近的空位）
 * @param board - 棋盘状态
 * @param range - 搜索范围
 * @returns 候选位置数组
 */
export function getCandidatePositions(
  board: BoardState,
  range: number = 2
): { row: number; col: number }[] {
  const candidates = new Set<string>();

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j]) {
        // 在已有棋子周围寻找空位
        for (let di = -range; di <= range; di++) {
          for (let dj = -range; dj <= range; dj++) {
            const ni = i + di;
            const nj = j + dj;
            if (
              ni >= 0 &&
              ni < BOARD_SIZE &&
              nj >= 0 &&
              nj < BOARD_SIZE &&
              !board[ni][nj]
            ) {
              candidates.add(`${ni},${nj}`);
            }
          }
        }
      }
    }
  }

  return Array.from(candidates).map((pos) => {
    const [row, col] = pos.split(",").map(Number);
    return { row, col };
  });
}

/**
 * 为电脑找到最佳落子位置（增强版AI）
 * @param board - 当前的棋盘状态
 * @param aiPlayer - AI所扮演的角色 ('black' 或 'white')
 * @returns 最佳落子点的坐标
 */
export function findComputerMove(
  board: BoardState,
  aiPlayer: Player
): { row: number; col: number } {
  const humanPlayer = aiPlayer === "black" ? "white" : "black";

  // 如果是空棋盘，下在中心附近
  const isEmpty = board.every((row) => row.every((cell) => !cell));
  if (isEmpty) {
    const center = Math.floor(BOARD_SIZE / 2);
    return { row: center, col: center };
  }

  // 1. 检查AI是否能直接获胜
  const aiThreats = findThreats(board, aiPlayer);
  const winMove = aiThreats.find((threat) => threat.priority === "win");
  if (winMove) {
    return { row: winMove.row, col: winMove.col };
  }

  // 2. 检查是否需要防守（阻止对手获胜）
  const humanThreats = findThreats(board, humanPlayer);
  const defendMove = humanThreats.find((threat) => threat.priority === "win");
  if (defendMove) {
    return { row: defendMove.row, col: defendMove.col };
  }

  // 3. 寻找最佳进攻位置
  const candidates = getCandidatePositions(board);
  if (candidates.length === 0) {
    // 如果没有候选位置，随机选择
    const emptySquares: { row: number; col: number }[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (!board[i][j]) {
          emptySquares.push({ row: i, col: j });
        }
      }
    }
    const randomIndex = Math.floor(Math.random() * emptySquares.length);
    return emptySquares[randomIndex];
  }

  // 4. 评估所有候选位置
  let bestMove: { row: number; col: number } | null = null;
  let bestScore = -Infinity;

  for (const { row, col } of candidates) {
    const testBoard = board.map((r) => [...r]);
    testBoard[row][col] = aiPlayer;

    // 计算AI在此位置的得分
    const aiScore = evaluatePosition(testBoard, row, col, aiPlayer);

    // 计算阻止对手的得分
    testBoard[row][col] = humanPlayer;
    const humanScore = evaluatePosition(testBoard, row, col, humanPlayer);

    // 综合评分：自己的得分 + 阻止对手的得分 * 0.8
    const totalScore = aiScore + humanScore * 0.8;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = { row, col };
    }
  }

  return bestMove || candidates[0];
}

/**
 * 游戏历史记录管理
 */
export class GameHistory {
  private moves: Array<{
    row: number;
    col: number;
    player: Player;
    timestamp: number;
  }> = [];
  private currentIndex = -1;

  addMove(row: number, col: number, player: Player): void {
    // 如果当前不在最新位置，删除后续的移动
    if (this.currentIndex < this.moves.length - 1) {
      this.moves = this.moves.slice(0, this.currentIndex + 1);
    }

    this.moves.push({ row, col, player, timestamp: Date.now() });
    this.currentIndex++;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.moves.length - 1;
  }

  undo(): { row: number; col: number; player: Player } | null {
    if (!this.canUndo()) return null;

    const move = this.moves[this.currentIndex];
    this.currentIndex--;
    return move;
  }

  redo(): { row: number; col: number; player: Player } | null {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    return this.moves[this.currentIndex];
  }

  clear(): void {
    this.moves = [];
    this.currentIndex = -1;
  }

  getMoves(): Array<{
    row: number;
    col: number;
    player: Player;
    timestamp: number;
  }> {
    return [...this.moves];
  }

  getLastMove(): { row: number; col: number; player: Player } | null {
    return this.currentIndex >= 0 ? this.moves[this.currentIndex] : null;
  }
}

/**
 * 游戏统计信息
 */
export interface GameStats {
  totalMoves: number;
  blackMoves: number;
  whiteMoves: number;
  gameStartTime: number;
  gameEndTime?: number;
  winner?: Player;
  gameDuration?: number;
}

/**
 * 计算游戏统计信息
 */
export function calculateGameStats(
  gameState: GameState,
  startTime: number
): GameStats {
  let totalMoves = 0;
  let blackMoves = 0;
  let whiteMoves = 0;

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (gameState.board[i][j]) {
        totalMoves++;
        if (gameState.board[i][j] === "black") {
          blackMoves++;
        } else {
          whiteMoves++;
        }
      }
    }
  }

  const stats: GameStats = {
    totalMoves,
    blackMoves,
    whiteMoves,
    gameStartTime: startTime,
  };

  if (gameState.isGameOver) {
    stats.gameEndTime = Date.now();
    stats.gameDuration = stats.gameEndTime - startTime;
    stats.winner = gameState.winner || undefined;
  }

  return stats;
}

/**
 * 检查是否为有效的落子位置
 */
export function isValidMove(
  board: BoardState,
  row: number,
  col: number
): boolean {
  return (
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE &&
    !board[row][col]
  );
}

/**
 * 获取棋盘上所有空位
 */
export function getEmptyPositions(
  board: BoardState
): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (!board[i][j]) {
        positions.push({ row: i, col: j });
      }
    }
  }

  return positions;
}

/**
 * 检查游戏是否为平局（棋盘已满且无胜者）
 */
export function isDraw(board: BoardState): boolean {
  return getEmptyPositions(board).length === 0;
}

/**
 * 深拷贝棋盘状态
 */
export function cloneBoard(board: BoardState): BoardState {
  return board.map((row) => [...row]);
}

/**
 * 将棋盘状态转换为字符串（用于调试或存储）
 */
export function boardToString(board: BoardState): string {
  return board
    .map((row) =>
      row.map((cell) => (cell ? (cell === "black" ? "B" : "W") : ".")).join("")
    )
    .join("\n");
}

/**
 * 从字符串恢复棋盘状态
 */
export function stringToBoard(str: string): BoardState {
  const lines = str.split("\n");
  return lines.map((line) =>
    line.split("").map((char) => {
      if (char === "B") return "black";
      if (char === "W") return "white";
      return null;
    })
  );
}
