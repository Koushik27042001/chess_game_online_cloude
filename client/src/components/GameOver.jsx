import { Link } from "react-router-dom";

const REASON = {
  checkmate: "Checkmate",
  stalemate: "Stalemate",
  draw: "Draw",
  resignation: "Resignation",
  timeout: "Time out",
  agreement: "Draw agreed",
  abandoned: "Opponent left the game",
};

export default function GameOver({ state, ratingChange, myColor, onRematchPath }) {
  if (!state || state.status !== "finished") return null;

  const resultText =
    state.result === "1-0" ? "White wins" : state.result === "0-1" ? "Black wins" : "Draw";

  const myDelta =
    myColor === "white" ? ratingChange?.white : myColor === "black" ? ratingChange?.black : null;

  const iWon =
    (myColor === "white" && state.result === "1-0") ||
    (myColor === "black" && state.result === "0-1");
  const iLost =
    (myColor === "white" && state.result === "0-1") ||
    (myColor === "black" && state.result === "1-0");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center">
      <div className="panel animate-pop w-full max-w-md p-6 text-center shadow-board">
        <p className="text-xs uppercase tracking-[0.22em] text-oak-300">
          {iWon ? "Victory" : iLost ? "Defeat" : "Game over"}
        </p>
        <h2 className="mt-2 font-display text-4xl">{resultText}</h2>
        <p className="mt-2 text-white/60">{REASON[state.termination] || "Game over"}</p>
        {typeof myDelta === "number" && (
          <p className={`mt-4 font-mono text-2xl ${myDelta >= 0 ? "text-moss-400" : "text-red-300"}`}>
            {myDelta >= 0 ? "+" : ""}
            {myDelta}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to={onRematchPath || "/play"} className="btn-primary">
            Play again
          </Link>
          <Link to="/analysis" className="btn-secondary">
            Analyze
          </Link>
        </div>
      </div>
    </div>
  );
}
