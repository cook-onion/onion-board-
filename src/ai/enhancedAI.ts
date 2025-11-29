// src/ai/enhancedAI.ts
import { BoardState, Player } from "../types";
import {
  evaluatePosition,
  findThreats,
  getCandidatePositions,
  checkWin,
  isValidMove,
} from "../gameLogic";
import { AIConfig, getAIConfig } from "./aiConfig";
import { AI_DIFFICULTY } from "../constants/gameConfig";

const BOARD_SIZE = 15;

/**
 * 增强版AI，支持不同难度级别
 */
export class EnhancedAI {
  private config: AIConfig;
  private difficulty: string;

  constructor(difficulty: string = AI_DIFFICULTY.MEDIUM) {
    this.difficulty = difficulty;
    this.config = getAIConfig(difficulty);
  }

  /**
   * 获取最佳移动
   */
  async getBestMove(
    board: BoardState,
    aiPlayer: Player
  ): Promise<{ row: number; col: number }> {
    const startTime = Date.now();

    // 添加思考时间
    await new Promise((resolve) =>
      setTimeout(resolve, this.config.thinkingTime)
    );

    const move = this.findBestMove(board, aiPlayer);

    const thinkingTime = Date.now() - startTime;
    console.log(`AI (${this.difficulty}) 思考时间: ${thinkingTime}ms`);

    return move;
  }

  /**
   * 寻找最佳移动
   */
  private findBestMove(
    board: BoardState,
    aiPlayer: Player
  ): { row: number; col: number } {
    const humanPlayer = aiPlayer === "black" ? "white" : "black";

    // 如果是空棋盘，下在中心附近
    if (this.isEmpty(board)) {
      return this.getOpeningMove();
    }

    // 1. 检查AI是否能直接获胜
    const winMove = this.findWinningMove(board, aiPlayer);
    if (winMove) return winMove;

    // 2. 检查是否需要防守
    const defendMove = this.findDefensiveMove(board, humanPlayer);
    if (defendMove) return defendMove;

    // 3. 根据难度使用不同策略
    if (this.config.searchDepth > 1) {
      return this.minimax(board, aiPlayer, this.config.searchDepth);
    } else {
      return this.greedyMove(board, aiPlayer);
    }
  }

  /**
   * 检查棋盘是否为空
   */
  private isEmpty(board: BoardState): boolean {
    return board.every((row) => row.every((cell) => !cell));
  }

  /**
   * 获取开局移动
   */
  private getOpeningMove(): { row: number; col: number } {
    const center = Math.floor(BOARD_SIZE / 2);
    const offset = Math.random() < 0.5 ? -1 : 1;

    return {
      row: center + (Math.random() < 0.5 ? offset : 0),
      col: center + (Math.random() < 0.5 ? offset : 0),
    };
  }

  /**
   * 寻找获胜移动
   */
  private findWinningMove(
    board: BoardState,
    player: Player
  ): { row: number; col: number } | null {
    const threats = findThreats(board, player);
    const winMove = threats.find((threat) => threat.priority === "win");
    return winMove ? { row: winMove.row, col: winMove.col } : null;
  }

  /**
   * 寻找防守移动
   */
  private findDefensiveMove(
    board: BoardState,
    opponent: Player
  ): { row: number; col: number } | null {
    const threats = findThreats(board, opponent);
    const defendMove = threats.find((threat) => threat.priority === "win");
    return defendMove ? { row: defendMove.row, col: defendMove.col } : null;
  }

  /**
   * 贪心算法移动
   */
  private greedyMove(
    board: BoardState,
    aiPlayer: Player
  ): { row: number; col: number } {
    const humanPlayer = aiPlayer === "black" ? "white" : "black";
    const candidates = getCandidatePositions(board);

    if (candidates.length === 0) {
      return this.getRandomMove(board);
    }

    let bestMove = candidates[0];
    let bestScore = -Infinity;

    for (const { row, col } of candidates) {
      const testBoard = board.map((r) => [...r]);
      testBoard[row][col] = aiPlayer;

      const aiScore = evaluatePosition(testBoard, row, col, aiPlayer);

      testBoard[row][col] = humanPlayer;
      const humanScore = evaluatePosition(testBoard, row, col, humanPlayer);

      const totalScore =
        aiScore * this.config.aggressiveness +
        humanScore * (1 - this.config.aggressiveness);

      // 添加随机性
      const randomFactor = 1 + (Math.random() - 0.5) * this.config.randomness;
      const finalScore = totalScore * randomFactor;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestMove = { row, col };
      }
    }

    return bestMove;
  }

  /**
   * Minimax算法（简化版）
   */
  private minimax(
    board: BoardState,
    aiPlayer: Player,
    depth: number
  ): { row: number; col: number } {
    const candidates = getCandidatePositions(board).slice(0, 10); // 限制搜索范围

    if (candidates.length === 0) {
      return this.getRandomMove(board);
    }

    let bestMove = candidates[0];
    let bestScore = -Infinity;

    for (const { row, col } of candidates) {
      const testBoard = board.map((r) => [...r]);
      testBoard[row][col] = aiPlayer;

      const score = this.minimaxRecursive(
        testBoard,
        depth - 1,
        false,
        aiPlayer,
        -Infinity,
        Infinity
      );

      if (score > bestScore) {
        bestScore = score;
        bestMove = { row, col };
      }
    }

    return bestMove;
  }

  /**
   * Minimax递归函数
   */
  private minimaxRecursive(
    board: BoardState,
    depth: number,
    isMaximizing: boolean,
    aiPlayer: Player,
    alpha: number,
    beta: number
  ): number {
    if (depth === 0) {
      return this.evaluateBoard(board, aiPlayer);
    }

    const candidates = getCandidatePositions(board).slice(0, 8);
    const currentPlayer = isMaximizing
      ? aiPlayer
      : aiPlayer === "black"
      ? "white"
      : "black";

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const { row, col } of candidates) {
        const testBoard = board.map((r) => [...r]);
        testBoard[row][col] = currentPlayer;

        const eval_ = this.minimaxRecursive(
          testBoard,
          depth - 1,
          false,
          aiPlayer,
          alpha,
          beta
        );
        maxEval = Math.max(maxEval, eval_);
        alpha = Math.max(alpha, eval_);

        if (beta <= alpha) break; // Alpha-beta剪枝
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const { row, col } of candidates) {
        const testBoard = board.map((r) => [...r]);
        testBoard[row][col] = currentPlayer;

        const eval_ = this.minimaxRecursive(
          testBoard,
          depth - 1,
          true,
          aiPlayer,
          alpha,
          beta
        );
        minEval = Math.min(minEval, eval_);
        beta = Math.min(beta, eval_);

        if (beta <= alpha) break; // Alpha-beta剪枝
      }
      return minEval;
    }
  }

  /**
   * 评估整个棋盘
   */
  private evaluateBoard(board: BoardState, aiPlayer: Player): number {
    const humanPlayer = aiPlayer === "black" ? "white" : "black";
    let score = 0;

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (board[i][j] === aiPlayer) {
          score += evaluatePosition(board, i, j, aiPlayer);
        } else if (board[i][j] === humanPlayer) {
          score -= evaluatePosition(board, i, j, humanPlayer);
        }
      }
    }

    return score;
  }

  /**
   * 获取随机移动
   */
  private getRandomMove(board: BoardState): { row: number; col: number } {
    const emptyPositions = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (!board[i][j]) {
          emptyPositions.push({ row: i, col: j });
        }
      }
    }

    const randomIndex = Math.floor(Math.random() * emptyPositions.length);
    return emptyPositions[randomIndex];
  }

  /**
   * 设置难度
   */
  setDifficulty(difficulty: string): void {
    this.difficulty = difficulty;
    this.config = getAIConfig(difficulty);
  }

  /**
   * 获取当前难度
   */
  getDifficulty(): string {
    return this.difficulty;
  }
}
