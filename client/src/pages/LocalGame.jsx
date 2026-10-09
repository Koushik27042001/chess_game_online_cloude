import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import ChessBoard from "../components/ChessBoard";
import MoveHistory from "../components/MoveHistory";
import CapturedPieces from "../components/CapturedPieces";
import AnalysisPanel from "../components/AnalysisPanel";
import { capturesFromBoard } from "../utils/chessHelpers";
import { playMoveSound } from "../utils/sounds";

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

export default function LocalGame() {
  const [game, setGame] = useState(() => new Chess());
  const [history, setHistory] = useState([]);
  const [orientation, setOrientation] = useState("white");
  const [lastMove, setLastMove] = useState(null);
  const boardWidth = useBoardWidth();

  const fen = game.fen();
  const captures = useMemo(() => capturesFromBoard(game), [game]);

  function makeMove(move) {
    const copy = new Chess(game.fen());
    const result = copy.move(move);
    if (!result) return false;
    setGame(copy);
    setHistory(copy.history());
    setLastMove({ from: result.from, to: result.to });
    playMoveSound(result);
    return true;
  }

  function undo() {
    const copy = new Chess(game.fen());
    copy.undo();
    setGame(copy);
    setHistory(copy.history());
    const moves = copy.history({ verbose: true });
    const previous = moves[moves.length - 1];
    setLastMove(previous ? { from: previous.from, to: previous.to } : null);
  }

  function restart() {
    const fresh = new Chess();
    setGame(fresh);
    setHistory([]);
    setLastMove(null);
  }

  let status = game.turn() === "w" ? "White to move" : "Black to move";
  if (game.isCheckmate()) status = "Checkmate";
  else if (game.isDraw()) status = "Draw";
  else if (game.isCheck()) status = "Check!";

  return (
    <div className="animate-rise">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Local two-player</h1>
          <p className="text-sm text-white/50">{status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={undo}>
            Undo
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))}
          >
            Flip board
          </button>
          <button type="button" className="btn-primary text-sm" onClick={restart}>
            Restart
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <CapturedPieces pieces={captures.byBlack} label="Black captured" />
          <ChessBoard
            fen={fen}
            orientation={orientation}
            onMove={makeMove}
            highlightCheck
            lastMove={lastMove}
            boardWidth={boardWidth}
            arePiecesDraggable={!game.isGameOver()}
          />
          <CapturedPieces pieces={captures.byWhite} label="White captured" />
        </div>
        <aside className="space-y-4">
          <MoveHistory moves={history} />
          <AnalysisPanel fen={fen} pgn={game.pgn()} />
        </aside>
      </div>
    </div>
  );
}
