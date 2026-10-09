import { useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

const PROMO = [
  { id: "q", label: "Queen" },
  { id: "r", label: "Rook" },
  { id: "b", label: "Bishop" },
  { id: "n", label: "Knight" },
];

export default function ChessBoard({
  fen,
  orientation = "white",
  arePiecesDraggable = true,
  onMove,
  highlightCheck = false,
  lastMove = null,
  boardWidth,
}) {
  const [optionSquares, setOptionSquares] = useState({});
  const [moveFrom, setMoveFrom] = useState(null);
  const [pendingPromo, setPendingPromo] = useState(null);

  const game = useMemo(() => {
    try {
      return fen && fen !== "start" ? new Chess(fen) : new Chess();
    } catch {
      return new Chess();
    }
  }, [fen]);

  const customSquareStyles = useMemo(() => {
    const styles = { ...optionSquares };
    if (lastMove?.from) {
      styles[lastMove.from] = {
        background: "rgba(193, 154, 107, 0.45)",
      };
    }
    if (lastMove?.to) {
      styles[lastMove.to] = {
        background: "rgba(111, 155, 122, 0.55)",
      };
    }
    if (highlightCheck && game.isCheck()) {
      const turn = game.turn();
      const board = game.board();
      for (let rank = 0; rank < 8; rank += 1) {
        for (let file = 0; file < 8; file += 1) {
          const piece = board[rank][file];
          if (piece?.type === "k" && piece.color === turn) {
            const square = `${"abcdefgh"[file]}${8 - rank}`;
            styles[square] = {
              background:
                "radial-gradient(circle, rgba(220,38,38,0.72) 0%, rgba(220,38,38,0.18) 72%)",
            };
          }
        }
      }
    }
    return styles;
  }, [optionSquares, highlightCheck, game, lastMove]);

  function showMoves(square) {
    const moves = game.moves({ square, verbose: true });
    if (!moves.length) {
      setOptionSquares({});
      return false;
    }
    const next = {};
    moves.forEach((move) => {
      const capture = Boolean(game.get(move.to));
      next[move.to] = {
        background: capture
          ? "radial-gradient(circle, transparent 62%, rgba(20,20,20,0.28) 63%)"
          : "radial-gradient(circle, rgba(79,125,92,.55) 22%, transparent 23%)",
        borderRadius: "50%",
      };
    });
    next[square] = { background: "rgba(193,154,107,0.55)" };
    setOptionSquares(next);
    return true;
  }

  function attemptMove(from, to, promotion) {
    const moves = game.moves({ square: from, verbose: true }).filter((move) => move.to === to);
    if (!moves.length) return false;
    const needsPromo = moves.some((move) => move.promotion);
    const chosen = needsPromo ? promotion || "q" : undefined;
    const ok = onMove?.({ from, to, promotion: chosen });
    setMoveFrom(null);
    setOptionSquares({});
    setPendingPromo(null);
    return Boolean(ok);
  }

  function onPieceDrop(sourceSquare, targetSquare, piece) {
    if (!arePiecesDraggable) return false;
    const letter = piece?.[1]?.toLowerCase();
    const promotion = ["q", "r", "b", "n"].includes(letter) ? letter : undefined;
    return attemptMove(sourceSquare, targetSquare, promotion);
  }

  function onPromotionCheck(sourceSquare, targetSquare) {
    return game
      .moves({ square: sourceSquare, verbose: true })
      .some((move) => move.to === targetSquare && move.promotion);
  }

  function onSquareClick(square) {
    if (!arePiecesDraggable) return;

    if (moveFrom) {
      const moves = game.moves({ square: moveFrom, verbose: true });
      const found = moves.find((move) => move.to === square);
      if (found) {
        if (found.promotion) {
          setPendingPromo({ from: moveFrom, to: square });
          return;
        }
        attemptMove(moveFrom, square);
        return;
      }
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setMoveFrom(square);
      showMoves(square);
    } else {
      setMoveFrom(null);
      setOptionSquares({});
    }
  }

  return (
    <div className="board-shell mx-auto w-full" style={{ maxWidth: boardWidth || 560 }}>
      <div className="board-frame">
        <Chessboard
          id="KnightlineBoard"
          position={fen || "start"}
          onPieceDrop={onPieceDrop}
          onSquareClick={onSquareClick}
          onPromotionCheck={onPromotionCheck}
          arePiecesDraggable={arePiecesDraggable}
          boardOrientation={orientation}
          customBoardStyle={{ borderRadius: "6px" }}
          customDarkSquareStyle={{ backgroundColor: "#739552" }}
          customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
          customSquareStyles={customSquareStyles}
          customNotationStyle={{ fontSize: "12px", fontWeight: 600 }}
          boardWidth={boardWidth}
          animationDuration={220}
          showBoardNotation
        />
      </div>

      {pendingPromo && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-ink-950/70 p-4 backdrop-blur-sm">
          <div className="panel animate-pop w-full max-w-xs p-4 text-center">
            <p className="text-sm text-white/70">Choose a promotion</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {PROMO.map((piece) => (
                <button
                  key={piece.id}
                  type="button"
                  className="btn-secondary"
                  onClick={() => attemptMove(pendingPromo.from, pendingPromo.to, piece.id)}
                >
                  {piece.label}
                </button>
              ))}
            </div>
            <button type="button" className="mt-3 text-xs text-white/45" onClick={() => setPendingPromo(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
