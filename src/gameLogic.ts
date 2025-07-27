
//定义玩家类型，只能是black或者是white
export type Player = 'black' | 'white'

//定义棋格的状态，可以是某个玩家或者是空
export type SquareState = Player | null

//定义棋盘状态，是由一个二维数组组成
export type BoardState = SquareState[][]

//定义游戏状态的完整结构
export interface GameState {
    board:BoardState;
    currentPlayer:Player;
    isGameOver:boolean;
    winner: Player | null;
    lastMove: { row: number, col: number } | null; // 新增：记录最后一步
}

const BOARD_SIZE = 15; // 定义棋盘大小，这里是15x15

/*
 * 初始化棋盘
 * @returns {GameState} 初始化游戏状态对象
 */

export function createInitialGameState(): GameState {
    return {
      board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
      currentPlayer: 'black',
      isGameOver: false,
      winner: null,
      lastMove: null, // 初始化 lastMove
    };
  }
  
  // handlePlacePiece 函数已更新
  export function handlePlacePiece(currentState: GameState, row: number, col: number): GameState {
    if (currentState.isGameOver || currentState.board[row][col]) {
      return currentState;
    }
  
    const newBoard = currentState.board.map(r => [...r]);
    newBoard[row][col] = currentState.currentPlayer;
  
    const hasWon = checkWin(newBoard, row, col);
    const nextPlayer = currentState.currentPlayer === 'black' ? 'white' : 'black';
  
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
export function checkWin(board:BoardState,row:number,col:number):boolean{
    const player = board[row][col]
    if(!player) return false
    //定义四个检查方向：水平、垂直、主对角线、副对角线
    const directions = [
        {dr:0,dc:1},//水平
        {dr:1,dc:0},//垂直
        {dr:1,dc:1},//主对角线
        {dr:1,dc:-1},//副对角线
    ]

    for(const { dr ,dc }of directions){
        let count = 1 //计数器，包含当前落下的子
        for(let i = 1;i<5;i++){
            const r = row + i *dr
            const c = col + i*dc
            if(r >= 0 && r<BOARD_SIZE && c >=0 && c < BOARD_SIZE && board[r][c] === player){
                count++
            }else{
                break //遇到不同棋子或者边界就退出
            }
        }
        //检查相反方向
        for(let i = 1; i<5; i++){
            const r = row - i * dr
            const c = col - i * dc
            if(r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] == player){
                count++
            }else{
                break// 遇到不同棋子或者边界，停止检查
            }
        }
        if(count >= 5) return true; //如果任意方向上连续五个棋子，则产生胜利者

    }
    return  false

}




/**
 * 为电脑找到最佳落子位置。
 * @param board - 当前的棋盘状态。
 * @param aiPlayer - AI所扮演的角色 ('black' 或 'white')。
 * @returns {{row: number, col: number}} 最佳落子点的坐标。
 */
export function findComputerMove(board: BoardState, aiPlayer: Player): { row: number, col: number } {
    const humanPlayer = aiPlayer === 'black' ? 'white' : 'black';
    const emptySquares: { row: number, col: number }[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (!board[i][j]) {
          emptySquares.push({ row: i, col: j });
        }
      }
    }
  
    // 1. 检查AI自己能否一步获胜
    for (const { row, col } of emptySquares) {
      const testBoard = board.map(r => [...r]);
      testBoard[row][col] = aiPlayer; // 使用AI的角色进行检查
      if (checkWin(testBoard, row, col)) {
        return { row, col };
      }
    }
  
    // 2. 检查玩家能否一步获胜，如果能，则必须防守
    for (const { row, col } of emptySquares) {
      const testBoard = board.map(r => [...r]);
      testBoard[row][col] = humanPlayer; // 使用玩家的角色进行检查
      if (checkWin(testBoard, row, col)) {
        return { row, col };
      }
    }
  
    // 3. 如果都没有，则随机选择一个空位
    const randomIndex = Math.floor(Math.random() * emptySquares.length);
    return emptySquares[randomIndex];
  }