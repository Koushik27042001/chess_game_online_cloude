import { useEffect, useState } from "react";
import { analyzePosition } from "../engine/search";

function formatEval(cp, mate) {
  if (mate) return cp > 0 ? "Mate" : "Mate";
  const pawns = cp / 100;
  const text = `${pawns > 0 ? "+" : ""}${pawns.toFixed(2)}`;
  return text;
}

export default function AnalysisPanel({ fen, pgn }) {
  const [depth, setDepth] = useState(3);
  const [line, setLine] = useState(null);
  const [status, setStatus] = useState("Waiting");

  useEffect(() => {
    if (!fen) return undefined;
    let cancelled = false;
    setStatus("Searching…");
    const timer = setTimeout(() => {
      const result = analyzePosition(fen, depth, depth >= 4 ? 500 : 280);
      if (cancelled) return;
      setLine(result);
      setStatus("Ready");
    }, 40);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fen, depth]);

  const score = line?.evalCp ?? 0;
  const bar = Math.max(8, Math.min(92, 50 + score / 20));

  return (
    <div className="panel animate-rise p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg">Analysis</h3>
        <label className="text-xs text-white/50">
          Depth
          <select
            className="input ml-2 w-auto py-1 text-sm"
            value={depth}
            onChange={(event) => setDepth(Number(event.target.value))}
          >
            {[2, 3, 4].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-ink-950">
        <div
          className="h-full bg-gradient-to-r from-moss-700 to-oak-300 transition-all duration-500"
          style={{ width: `${bar}%` }}
        />
      </div>

      <div className="rounded-lg bg-ink-900/80 px-3 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-mono text-lg text-oak-300">
            {line ? formatEval(line.evalCp, line.mate) : "…"}
          </span>
          <span className="text-xs text-white/40">
            {status} · d{line?.depth || depth}
          </span>
        </div>
        <p className="mt-2">
          Best move: <strong>{line?.bestMove?.san || "—"}</strong>
          {line?.bestMove ? (
            <span className="text-white/40">
              {" "}
              {line.bestMove.from} → {line.bestMove.to}
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-white/40">
          Built-in search (material, center, mobility). Scores are from White’s side.
        </p>
      </div>

      {pgn ? (
        <p className="mt-3 max-h-16 overflow-y-auto break-all font-mono text-[11px] text-white/35">
          {pgn}
        </p>
      ) : null}
    </div>
  );
}
