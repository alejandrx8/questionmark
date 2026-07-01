import { useState, useEffect, useCallback } from "react";
import {
  createBoard, dropPiece, checkWinner, isBoardFull, isValidCol,
  getBestMove, getWinningCells, ROWS, COLS, type Board,
} from "@/lib/minimax";

type GameStatus = "playing" | "win" | "lose" | "draw";

export default function Game() {
  const [board, setBoard] = useState<Board>(createBoard);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [winCells, setWinCells] = useState<[number, number][]>([]);
  const [aiThinking, setAiThinking] = useState(false);

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setStatus("playing");
    setWinCells([]);
    setHoverCol(null);
    setAiThinking(false);
  }, []);

  const playerMove = useCallback((col: number) => {
    if (status !== "playing" || aiThinking || !isValidCol(board, col)) return;
    const newBoard = dropPiece(board, col, 1)!;
    const winner = checkWinner(newBoard);
    const full = isBoardFull(newBoard);
    if (winner === 1) { setBoard(newBoard); setWinCells(getWinningCells(newBoard)); setStatus("win"); return; }
    if (full) { setBoard(newBoard); setStatus("draw"); return; }
    setBoard(newBoard);
    setAiThinking(true);
  }, [board, status, aiThinking]);

  useEffect(() => {
    if (!aiThinking) return;
    const timeout = setTimeout(() => {
      const col = getBestMove(board);
      const newBoard = dropPiece(board, col, 2)!;
      const winner = checkWinner(newBoard);
      const full = isBoardFull(newBoard);
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

        <div style={{ background: "#374151", borderRadius: "8px", padding: "8px", display: "grid", gap: "5px" }}>
          {Array.from({ length: ROWS }, (_, r) => (
            <div key={r} style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: "5px" }}>
              {Array.from({ length: COLS }, (_, c) => {
                const cell = board[r][c];
                const winning = isWinCell(r, c);
                return (
                  <button
                    key={c}
                    onClick={() => playerMove(c)}
                    onMouseEnter={() => setHoverCol(c)}
                    onMouseLeave={() => setHoverCol(null)}
                    disabled={status !== "playing" || aiThinking || !isValidCol(board, c)}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "50%",
                      border: "none",
                      cursor: status === "playing" && !aiThinking && isValidCol(board, c) ? "pointer" : "default",
                      background: cell === 0 ? "#1a1a1a" : cell === 1 ? (winning ? "#b91c1c" : "#ef4444") : (winning ? "#f3f4f6" : "#9ca3af"),
                      boxShadow: winning ? "0 0 0 2px rgba(255,255,255,0.35) inset" : "none",
                      transition: "background 0.1s",
                      padding: 0,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "#888" }}>
            {gameOver
              ? (status === "win" ? "You win." : status === "draw" ? "Draw." : "")
              : aiThinking ? "Thinking..." : ""}
          </span>
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
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={resetGame}
                style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "4px", border: "1px solid #555", background: "#333", cursor: "pointer", color: "#ddd", textAlign: "left" }}
              >
                press this to continue lmao
              </button>
              {/* ↓ PUT YOUR LINK HERE — replace the href="#" and the label text */}
              <a
                href="#"
                style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "4px", border: "1px solid #555", background: "#333", color: "#ddd", textDecoration: "none", display: "block" }}
              >
                click here → (your link goes here)
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
