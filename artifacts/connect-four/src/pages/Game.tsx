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

  const statusText = () => {
    if (status === "win") return "You win!";
    if (status === "lose") return "Computer wins.";
    if (status === "draw") return "Draw.";
    if (aiThinking) return "Computer is thinking...";
    return "Your turn (red)";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#111", margin: "0 0 4px 0" }}>Connect Four</h1>
        <p style={{ fontSize: "13px", color: "#666", margin: "0 0 20px 0" }}>You are red. Computer is black.</p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>{statusText()}</span>
          <button
            onClick={resetGame}
            style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "4px", border: "1px solid #d1d1d1", background: "#fff", cursor: "pointer", color: "#333" }}
          >
            New Game
          </button>
        </div>

        <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
          {Array.from({ length: COLS }, (_, c) => (
            <div key={c} style={{ flex: 1, display: "flex", justifyContent: "center", height: "16px" }}>
              {hoverCol === c && status === "playing" && !aiThinking && isValidCol(board, c) && (
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", opacity: 0.6 }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ background: "#e5e5e5", borderRadius: "6px", padding: "6px", display: "grid", gap: "4px" }}>
          {Array.from({ length: ROWS }, (_, r) => (
            <div key={r} style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: "4px" }}>
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
                      background: cell === 0 ? "#fff" : cell === 1 ? (winning ? "#b91c1c" : "#ef4444") : (winning ? "#000" : "#374151"),
                      outline: winning ? "2px solid white" : "none",
                      outlineOffset: "-3px",
                      transition: "background 0.1s",
                      padding: 0,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {(status === "win" || status === "lose" || status === "draw") && (
          <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "5px", border: "1px solid #d1d1d1", background: "#fff", fontSize: "13px", color: "#444", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>
              {status === "win" && "Nice — you found a win."}
              {status === "lose" && "The computer played optimally."}
              {status === "draw" && "No winner this time."}
            </span>
            <button onClick={resetGame} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#666", textDecoration: "underline" }}>
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
