import { formatClock } from "../utils/chessHelpers";

export default function Timer({ ms, active }) {
  const low = ms <= 30000;
  return (
    <div
      className={`min-w-[5.5rem] rounded-lg px-3 py-1.5 text-right font-mono text-2xl tabular-nums sm:text-3xl ${
        active ? "bg-ink-950 text-ivory" : "bg-ink-900/60 text-white/70"
      } ${low && active ? "text-red-300" : ""}`}
    >
      {formatClock(ms)}
    </div>
  );
}
