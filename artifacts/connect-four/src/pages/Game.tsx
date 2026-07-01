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
  const [winCells, setWinCells] = useState<[number, number][]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [lastPlaced, setLastPlaced] = useState<Placed | null>(null);
  const counter = useRef(0);

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setStatus("playing");
    setWinCells([]);
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
        * { box-sizing: border-box; }
        html, body { height: 100%; overscroll-behavior: none; }
        @keyframes piece-pop {
          0%   { transform: scale(0.5); opacity: 0.5; }
          70%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); }
        }
        .col-btn {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          position: absolute;
          top: 0;
          bottom: 0;
        }
        .col-btn:disabled { cursor: default; }
      `}</style>

      <div style={{
        minHeight: "100dvh",
        background: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        fontFamily: "system-ui, sans-serif",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}>
        <div style={{ width: "100%", maxWidth: "460px" }}>

          {/* Board */}
          <div style={{ position: "relative" }}>
            <div style={{
              background: "#374151",
              borderRadius: "10px",
              padding: "6px",
              display: "grid",
              gap: "4px",
            }}>
              {Array.from({ length: ROWS }, (_, r) => (
                <div key={r} style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: "4px" }}>
                  {Array.from({ length: COLS }, (_, c) => {
                    const cell = board[r][c];
                    const winning = isWinCell(r, c);
                    const isNew = lastPlaced?.row === r && lastPlaced?.col === c && cell !== 0;
                    return (
                      <div
                        key={c}
                        style={{
                          aspectRatio: "1",
                          borderRadius: "50%",
                          background: cell === 0
                            ? "#1a1a1a"
                            : cell === 1
                              ? (winning ? "#b91c1c" : "#ef4444")
                              : (winning ? "#f3f4f6" : "#9ca3af"),
                          boxShadow: winning ? "0 0 0 2px rgba(255,255,255,0.35) inset" : "none",
                          ...(isNew ? { animation: "piece-pop 200ms ease-out" } : {}),
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Full-height column tap zones overlaid on the board */}
            <div style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gap: "4px",
              padding: "6px",
            }}>
              {Array.from({ length: COLS }, (_, c) => (
                <button
                  key={c}
                  className="col-btn"
                  style={{ width: "100%", borderRadius: "6px" }}
                  onClick={() => playerMove(c)}
                  disabled={gameOver || aiThinking || !isValidCol(board, c)}
                  aria-label={`Drop piece in column ${c + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: "14px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            {gameOver && (
              <span style={{ fontSize: "14px", color: "#888", marginRight: "auto" }}>
                {status === "win" ? "You win." : status === "draw" ? "Draw." : ""}
              </span>
            )}
            <button
              onClick={resetGame}
              style={{
                fontSize: "13px",
                padding: "8px 18px",
                borderRadius: "6px",
                border: "1px solid #444",
                background: "transparent",
                cursor: "pointer",
                color: "#aaa",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              New Game
            </button>
          </div>

          {status === "lose" && (
            <div style={{ marginTop: "14px", padding: "12px 14px", borderRadius: "6px", border: "1px solid #3a3a3a", background: "#242424", fontSize: "14px", color: "#ccc" }}>
              <div>jajajaja I win 😝 I was letting u win all along btw</div>
              <div style={{ marginTop: "12px" }}>
                <a
                  href="#"
                  style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "5px", border: "1px solid #555", background: "#333", color: "#ddd", textDecoration: "none", display: "block", textAlign: "center", touchAction: "manipulation" }}
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
