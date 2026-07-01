import { useState, useEffect, useCallback, useRef } from "react";
import {
  createBoard, dropPiece, checkWinner, isBoardFull, isValidCol,
  getBestMove, getWinningCells, ROWS, COLS, type Board,
} from "@/lib/minimax";

type GameStatus = "playing" | "win" | "lose" | "draw";
interface Placed { row: number; col: number; id: number }

function findDropRow(board: Board, col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) return r;
  }
  return 0;
}

export default function Game() {
  const [board, setBoard] = useState<Board>(createBoard);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [winCells, setWinCells] = useState<[number, number][]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [lastPlaced, setLastPlaced] = useState<Placed | null>(null);
  const counter = useRef(0);

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setStatus("playing");
    setWinCells([]);
    setHoverCol(null);
    setAiThinking(false);
    setLastPlaced(null);
  }, []);

  const playerMove = useCallback((col: number) => {
    if (status !== "playing" || aiThinking || !isValidCol(board, col)) return;
    const row = findDropRow(board, col);
    const newBoard = dropPiece(board, col, 1)!;
    const winner = checkWinner(newBoard);
    const full = isBoardFull(newBoard);
    setLastPlaced({ row, col, id: ++counter.current });
    if (winner === 1) { setBoard(newBoard); setWinCells(getWinningCells(newBoard)); setStatus("win"); return; }
    if (full) { setBoard(newBoard); setStatus("draw"); return; }
    setBoard(newBoard);
    setAiThinking(true);
  }, [board, status, aiThinking]);

  useEffect(() => {
    if (!aiThinking) return;
    const timeout = setTimeout(() => {
      const col = getBestMove(board);
      const row = findDropRow(board, col);
      const newBoard = dropPiece(board, col, 2)!;
      const winner = checkWinner(newBoard);
      const full = isBoardFull(newBoard);
      setLastPlaced({ row, col, id: ++counter.current });
      setBoard(newBoard);
      setAiThinking(false);
      if (winner === 2) { setWinCells(getWinningCells(newBoard)); setStatus("lose"); }
      else if (full) setStatus("draw");
    }, 120);
    return () => clearTimeout(timeout);
  }, [aiThinking, board]);

  const isWinCell = (r: number, c: number) => winCells.some(([wr, wc]) => wr === r && wc === c);
  const gameOver = status === "win" || status === "lose" || status === "draw";

  return (
    <>
      <style>{`
        @keyframes piece-fall {
          0%   { transform: translateY(var(--fall-from)); }
          82%  { transform: translateY(0); }
          91%  { transform: translateY(4px); }
          100% { transform: translateY(0); }
        }
        .cell-btn { -webkit-tap-highlight-color: transparent; }
        .cell-btn:active, .cell-btn:focus { background: transparent !important; outline: none; }
        .cell-btn-new { position: relative; z-index: 999; }
      `}</style>
      <div style={{ minHeight: "100vh", background: "#1a1a1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>

          <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
            {Array.from({ length: COLS }, (_, c) => (
              <div key={c} style={{ flex: 1, display: "flex", justifyContent: "center", height: "16px" }}>
                {hoverCol === c && status === "playing" && !aiThinking && isValidCol(board, c) && (
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", opacity: 0.5 }} />
                )}
              </div>
            ))}
          </div>

          <div style={{ background: "#374151", borderRadius: "8px", padding: "8px", display: "grid", gap: "5px", overflow: "hidden", position: "relative" }}>
            {Array.from({ length: ROWS }, (_, r) => (
              <div key={r} style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: "5px" }}>
                {Array.from({ length: COLS }, (_, c) => {
                  const cell = board[r][c];
                  const winning = isWinCell(r, c);
                  const isNew = lastPlaced?.row === r && lastPlaced?.col === c && cell !== 0;
                  // piece starts above the board and falls to its row
                  const fallFrom = `${-(r * 58 + 60)}px`;
                  const duration = Math.min((r + 1) * 55 + 60, 380);

                  return (
                    <button
                      key={c}
                      className={`cell-btn${isNew ? " cell-btn-new" : ""}`}
                      onClick={() => playerMove(c)}
                      onMouseEnter={() => setHoverCol(c)}
                      onMouseLeave={() => setHoverCol(null)}
                      disabled={status !== "playing" || aiThinking || !isValidCol(board, c)}
                      style={{
                        aspectRatio: "1",
                        borderRadius: "50%",
                        border: "none",
                        cursor: status === "playing" && !aiThinking && isValidCol(board, c) ? "pointer" : "default",
                        background: "transparent",
                        padding: 0,
                        outline: "none",
                        WebkitTapHighlightColor: "transparent",
                        appearance: "none" as React.CSSProperties["appearance"],
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          background: cell === 0 ? "#1a1a1a" : cell === 1 ? (winning ? "#b91c1c" : "#ef4444") : (winning ? "#f3f4f6" : "#9ca3af"),
                          boxShadow: winning ? "0 0 0 2px rgba(255,255,255,0.35) inset" : "none",
                          ...(isNew ? {
                            "--fall-from": fallFrom,
                            animation: `piece-fall ${duration}ms ease-in`,
                          } as React.CSSProperties : {}),
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            {gameOver && (
              <span style={{ fontSize: "13px", color: "#888", marginRight: "auto" }}>
                {status === "win" ? "You win." : status === "draw" ? "Draw." : ""}
              </span>
            )}
            <button
              onClick={resetGame}
              style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "4px", border: "1px solid #444", background: "transparent", cursor: "pointer", color: "#aaa" }}
            >
              New Game
            </button>
          </div>

          {status === "lose" && (
            <div style={{ marginTop: "14px", padding: "12px 14px", borderRadius: "5px", border: "1px solid #3a3a3a", background: "#242424", fontSize: "14px", color: "#ccc" }}>
              <div>jajajaja I win 😝 I was letting u win all along btw</div>
              <div style={{ marginTop: "12px" }}>
                {/* ↓ Replace href="#" with your URL — the button navigates there when clicked */}
                <a
                  href="#"
                  style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "4px", border: "1px solid #555", background: "#333", color: "#ddd", textDecoration: "none", display: "block" }}
                >
                  press this to continue lmao
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
