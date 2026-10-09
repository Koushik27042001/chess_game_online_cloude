export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function pieceSymbol(type, color) {
  const map = {
    w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
    b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
  };
  return map[color]?.[type] || "";
}

export function capturesFromBoard(chess) {
  const counts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };
  const board = chess.board();
  for (const row of board) {
    for (const sq of row) {
      if (!sq || sq.type === "k") continue;
      counts[sq.color][sq.type] += 1;
    }
  }

  const start = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const capturedByWhite = [];
  const capturedByBlack = [];

  for (const type of Object.keys(start)) {
    const missingBlack = start[type] - counts.b[type];
    const missingWhite = start[type] - counts.w[type];
    for (let i = 0; i < missingBlack; i++) capturedByWhite.push({ type, color: "b" });
    for (let i = 0; i < missingWhite; i++) capturedByBlack.push({ type, color: "w" });
  }

  return { byWhite: capturedByWhite, byBlack: capturedByBlack };
}

export function statusLabel(state) {
  if (!state) return "";
  if (state.status === "waiting") return "Waiting for opponent…";
  if (state.status === "finished") {
    const map = {
      checkmate: "Checkmate",
      stalemate: "Stalemate",
      draw: "Draw",
      resignation: "Resignation",
      timeout: "Timeout",
      agreement: "Draw by agreement",
      abandoned: "Abandoned",
    };
    return map[state.termination] || "Game over";
  }
  if (state.check) return "Check!";
  return state.turn === "w" ? "White to move" : "Black to move";
}
