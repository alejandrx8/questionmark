import { useState, useEffect, useCallback, useRef } from "react";
import {
  createBoard, dropPiece, checkWinner, isBoardFull, isValidCol,
  getBestMove, getWinningCells, ROWS, COLS, type Board,
} from "@/lib/minimax";

type GameStatus = "playing" | "win" | "lose" | "draw";
interface Placed { row: number; col: number; id: number; player: 1 | 2 }

interface FlyDisc {
  id: number;
  left: number;
  top: number;
  size: number;
  fallFrom: number;
  duration: number;
  color: string;
}

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
  const [flyDisc, setFlyDisc] = useState<FlyDisc | null>(null);
  const counter = useRef(0);
  const boardRef = useRef<HTMLDivElement>(null);

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setStatus("playing");
    setWinCells([]);
    setHoverCol(null);
    setAiThinking(false);
    setLastPlaced(null);
    setFlyDisc(null);
  }, []);

  const playerMove = useCallback((col: number) => {
    if (status !== "playing" || aiThinking || !isValidCol(board, col)) return;
    const row = findDropRow(board, col);
    const newBoard = dropPiece(board, col, 1)!;
    const winner = checkWinner(newBoard);
    const full = isBoardFull(newBoard);
    setLastPlaced({ row, col, id: ++counter.current, player: 1 });
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
      setLastPlaced({ row, col, id: ++counter.current, player: 2 });
      setBoard(newBoard);
      setAiThinking(false);
      if (winner === 2) { setWinCells(getWinningCells(newBoard)); setStatus("lose"); }
      else if (full) setStatus("draw");
    }, 120);
    return () => clearTimeout(timeout);
  }, [aiThinking, board]);

  // Compute fly disc position from board measurements
  useEffect(() => {
    if (!lastPlaced || !boardRef.current) return;
    const el = boardRef.current;
    const padding = 8;
    const gap = 5;
    const cellSize = (el.offsetWidth - 2 * padding - (COLS - 1) * gap) / COLS;
    const left = padding + lastPlaced.col * (cellSize + gap);
    const top = padding + lastPlaced.row * (cellSize + gap);
    const fallFrom = -(lastPlaced.row * (cellSize + gap) + cellSize + padding);
    const duration = Math.min((lastPlaced.row + 1) * 55 + 60, 380);
    const color = lastPlaced.player === 1 ? "#ef4444" : "#9ca3af";
    setFlyDisc({ id: lastPlaced.id, left, top, size: cellSize, fallFrom, duration, color });
  }, [lastPlaced]);

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

          {/* Board */}
          <div
            ref={boardRef}
            style={{
              background: "#374151",
              borderRadius: "8px",
              padding: "8px",
              display: "grid",
              gap: "5px",
              position: "relative",
              clipPath: "inset(0 round 8px)",
            }}
          >
            {Array.from({ length: ROWS }, (_, r) => (
              <div key={r} style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: "5px" }}>
                {Array.from({ length: COLS }, (_, c) => {
                  const cell = board[r][c];
                  const winning = isWinCell(r, c);
                  // hide the cell disc while the fly animation is active for that cell
                  const isAnimating = flyDisc && lastPlaced?.row === r && lastPlaced?.col === c;

                  return (
                    <button
                      key={c}
                      className="cell-btn"
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
                          background: isAnimating && cell !== 0
                            ? "transparent"
                            : cell === 0 ? "#1a1a1a" : cell === 1 ? (winning ? "#b91c1c" : "#ef4444") : (winning ? "#f3f4f6" : "#9ca3af"),
                          boxShadow: winning ? "0 0 0 2px rgba(255,255,255,0.35) inset" : "none",
                          transition: isAnimating ? "none" : undefined,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Animated overlay disc — separate from all cells */}
            {flyDisc && (
              <div
                key={flyDisc.id}
                onAnimationEnd={() => setFlyDisc(null)}
                style={{
                  position: "absolute",
                  left: `${flyDisc.left}px`,
                  top: `${flyDisc.top}px`,
                  width: `${flyDisc.size}px`,
                  height: `${flyDisc.size}px`,
                  borderRadius: "50%",
                  background: flyDisc.color,
                  pointerEvents: "none",
                  "--fall-from": `${flyDisc.fallFrom}px`,
                  animation: `piece-fall ${flyDisc.duration}ms ease-in forwards`,
                } as React.CSSProperties}
              />
            )}
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
