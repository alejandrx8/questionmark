export const ROWS = 6;
export const COLS = 7;
export type Cell = 0 | 1 | 2;
export type Board = Cell[][];

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as Cell[]);
}

export function dropPiece(board: Board, col: number, player: 1 | 2): Board | null {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === 0) {
      const newBoard = board.map(r => [...r]) as Board;
      newBoard[row][col] = player;
      return newBoard;
    }
  }
  return null;
}

export function isValidCol(board: Board, col: number): boolean {
  return board[0][col] === 0;
}

export function getValidCols(board: Board): number[] {
  return Array.from({ length: COLS }, (_, i) => i).filter(c => isValidCol(board, c));
}

export function checkWinner(board: Board): Cell {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const v = board[r][c];
      if (v !== 0 && v === board[r][c+1] && v === board[r][c+2] && v === board[r][c+3]) return v;
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      if (v !== 0 && v === board[r+1][c] && v === board[r+2][c] && v === board[r+3][c]) return v;
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const v = board[r][c];
      if (v !== 0 && v === board[r-1][c+1] && v === board[r-2][c+2] && v === board[r-3][c+3]) return v;
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const v = board[r][c];
      if (v !== 0 && v === board[r+1][c+1] && v === board[r+2][c+2] && v === board[r+3][c+3]) return v;
    }
  }
  return 0;
}

export function isBoardFull(board: Board): boolean {
  return board[0].every(cell => cell !== 0);
}

function scoreWindow(window: Cell[], piece: 1 | 2): number {
  const opp = piece === 1 ? 2 : 1;
  const pieceCount = window.filter(c => c === piece).length;
  const emptyCount = window.filter(c => c === 0).length;
  const oppCount = window.filter(c => c === opp).length;
  let score = 0;
  if (pieceCount === 4) score += 100;
  else if (pieceCount === 3 && emptyCount === 1) score += 5;
  else if (pieceCount === 2 && emptyCount === 2) score += 2;
  if (oppCount === 3 && emptyCount === 1) score -= 4;
  return score;
}

function scoreBoard(board: Board, piece: 1 | 2): number {
  let score = 0;
  const centerCol = board.map(r => r[Math.floor(COLS / 2)]);
  score += centerCol.filter(c => c === piece).length * 3;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow(board[r].slice(c, c + 4) as Cell[], piece);
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += scoreWindow([board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]] as Cell[], piece);
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]] as Cell[], piece);
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]] as Cell[], piece);
    }
  }
  return score;
}

function isTerminal(board: Board): boolean {
  return checkWinner(board) !== 0 || isBoardFull(board);
}

function minimax(board: Board, depth: number, alpha: number, beta: number, maximizing: boolean): [number | null, number] {
  const validCols = getValidCols(board);
  const terminal = isTerminal(board);
  if (depth === 0 || terminal) {
    if (terminal) {
      const winner = checkWinner(board);
      if (winner === 2) return [null, 100000000];
      if (winner === 1) return [null, -100000000];
      return [null, 0];
    }
    return [null, scoreBoard(board, 2)];
  }
  if (maximizing) {
    let value = -Infinity;
    let bestCol = validCols[Math.floor(validCols.length / 2)];
    for (const col of validCols) {
      const [, score] = minimax(dropPiece(board, col, 2)!, depth - 1, alpha, beta, false);
      if (score > value) { value = score; bestCol = col; }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return [bestCol, value];
  } else {
    let value = Infinity;
    let bestCol = validCols[Math.floor(validCols.length / 2)];
    for (const col of validCols) {
      const [, score] = minimax(dropPiece(board, col, 1)!, depth - 1, alpha, beta, true);
      if (score < value) { value = score; bestCol = col; }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return [bestCol, value];
  }
}

export function getBestMove(board: Board): number {
  const [col] = minimax(board, 7, -Infinity, Infinity, true);
  return col ?? getValidCols(board)[0];
}

export function getWinningCells(board: Board): [number, number][] {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const v = board[r][c];
      if (v !== 0 && v === board[r][c+1] && v === board[r][c+2] && v === board[r][c+3]) return [[r,c],[r,c+1],[r,c+2],[r,c+3]];
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      if (v !== 0 && v === board[r+1][c] && v === board[r+2][c] && v === board[r+3][c]) return [[r,c],[r+1,c],[r+2,c],[r+3,c]];
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const v = board[r][c];
      if (v !== 0 && v === board[r-1][c+1] && v === board[r-2][c+2] && v === board[r-3][c+3]) return [[r,c],[r-1,c+1],[r-2,c+2],[r-3,c+3]];
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const v = board[r][c];
      if (v !== 0 && v === board[r+1][c+1] && v === board[r+2][c+2] && v === board[r+3][c+3]) return [[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]];
    }
  }
  return [];
}
