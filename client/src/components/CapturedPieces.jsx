import { pieceSymbol } from "../utils/chessHelpers";

const ORDER = { q: 0, r: 1, b: 2, n: 3, p: 4 };
const VALUE = { q: 9, r: 5, b: 3, n: 3, p: 1 };

export default function CapturedPieces({ pieces = [], label }) {
  const sorted = [...pieces].sort((a, b) => ORDER[a.type] - ORDER[b.type]);
  const material = sorted.reduce((sum, piece) => sum + (VALUE[piece.type] || 0), 0);

  return (
    <div className="mt-1 flex min-h-[1.25rem] flex-wrap items-center gap-0.5 text-base leading-none text-white/80">
      {label ? <span className="mr-2 text-[10px] uppercase tracking-wide text-white/40">{label}</span> : null}
      {sorted.map((piece, index) => (
        <span key={`${piece.color}-${piece.type}-${index}`}>{pieceSymbol(piece.type, piece.color)}</span>
      ))}
      {material > 0 ? <span className="ml-1 text-xs text-oak-300">+{material}</span> : null}
    </div>
  );
}
