import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import ChessBoard from "../components/ChessBoard";
import MoveHistory from "../components/MoveHistory";
import AnalysisPanel from "../components/AnalysisPanel";

function useBoardWidth() {
  const [width, setWidth] = useState(360);
  useEffect(() => {
    const update = () => setWidth(Math.min(520, Math.max(280, window.innerWidth - 48)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

export default function Analysis() {
  const [game, setGame] = useState(() => new Chess());
  const [pgnInput, setPgnInput] = useState("");
  const [error, setError] = useState("");
  const boardWidth = useBoardWidth();

  function makeMove(move) {
    const copy = new Chess(game.fen());
    const result = copy.move(move);
    if (!result) return false;
    setGame(copy);
    return true;
  }

  function loadPgn() {
    setError("");
    try {
      const next = new Chess();
      next.loadPgn(pgnInput);
      setGame(next);
    } catch {
      setError("Could not parse PGN");
    }
  }

  function reset() {
    setGame(new Chess());
    setPgnInput("");
    setError("");
  }

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl">Analysis board</h1>
      <p className="mt-2 text-sm text-white/55">
        Explore lines freely or paste a PGN from a finished game.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <ChessBoard
            fen={game.fen()}
            onMove={makeMove}
            highlightCheck
            boardWidth={boardWidth}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => {
                const copy = new Chess(game.fen());
                copy.undo();
                setGame(copy);
              }}
            >
              Undo
            </button>
            <button type="button" className="btn-secondary text-sm" onClick={reset}>
              Reset
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="panel p-4">
            <label className="label" htmlFor="pgn">
              Load PGN
            </label>
            <textarea
              id="pgn"
              className="input min-h-[120px] font-mono text-xs"
              value={pgnInput}
              onChange={(e) => setPgnInput(e.target.value)}
              placeholder="1. e4 e5 2. Nf3 ..."
            />
            {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
            <button type="button" className="btn-primary mt-3 w-full" onClick={loadPgn}>
              Load
            </button>
          </div>
          <MoveHistory moves={game.history()} />
          <AnalysisPanel fen={game.fen()} pgn={game.pgn()} />
        </aside>
      </div>
    </div>
  );
}
