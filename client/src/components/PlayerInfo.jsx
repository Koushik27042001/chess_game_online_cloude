import CapturedPieces from "./CapturedPieces";
import Timer from "./Timer";

export default function PlayerInfo({ player, color, you, active, clock, pieces }) {
  return (
    <div className={`player-bar ${active ? "player-bar-active" : ""}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              color === "white" ? "bg-ivory" : "bg-ink-950 ring-1 ring-white/40"
            }`}
          />
          <p className="truncate font-medium">
            {player?.username || `Waiting for ${color}`}
            {you ? <span className="ml-2 text-xs text-oak-300">you</span> : null}
          </p>
        </div>
        <p className="mt-0.5 text-xs capitalize text-white/45">
          {color}
          {player ? ` · ${player.rating}` : ""}
        </p>
        <CapturedPieces pieces={pieces} />
      </div>
      <Timer ms={clock || 0} active={active} />
    </div>
  );
}
