import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../socket/socket";

const TIME_OPTIONS = [
  { label: "1+0 Bullet", timeControl: 60, increment: 0 },
  { label: "3+2 Blitz", timeControl: 180, increment: 2 },
  { label: "5+0 Blitz", timeControl: 300, increment: 0 },
  { label: "10+0 Rapid", timeControl: 600, increment: 0 },
  { label: "15+10 Rapid", timeControl: 900, increment: 10 },
];

export default function Play() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(TIME_OPTIONS[3]);
  const [status, setStatus] = useState("idle");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = getSocket(token);
    if (!socket.connected) socket.connect();

    const onFound = ({ roomId }) => {
      setStatus("matched");
      navigate(`/game/${roomId}`);
    };
    const onMM = (payload) => {
      if (payload.status === "searching") setStatus("searching");
      if (payload.status === "cancelled") setStatus("idle");
    };

    socket.on("matchFound", onFound);
    socket.on("matchmaking", onMM);
    return () => {
      socket.off("matchFound", onFound);
      socket.off("matchmaking", onMM);
    };
  }, [token, navigate]);

  function findMatch() {
    setError("");
    setStatus("searching");
    const socket = getSocket(token);
    socket.emit(
      "findMatch",
      { timeControl: selected.timeControl, increment: selected.increment },
      (res) => {
        if (res?.matched && res.roomId) navigate(`/game/${res.roomId}`);
      }
    );
  }

  function cancelSearch() {
    getSocket(token).emit("cancelMatchmaking");
    setStatus("idle");
  }

  function createRoom() {
    setError("");
    getSocket(token).emit(
      "createRoom",
      {
        timeControl: selected.timeControl,
        increment: selected.increment,
        rated: true,
      },
      (res) => {
        if (res?.roomId) navigate(`/game/${res.roomId}`);
        else setError("Could not create room");
      }
    );
  }

  function joinRoom(e) {
    e.preventDefault();
    if (!roomCode.trim()) return;
    navigate(`/game/${roomCode.trim()}`);
  }

  return (
    <div className="mx-auto max-w-2xl animate-rise">
      <h1 className="font-display text-3xl sm:text-4xl">Play online</h1>
      <p className="mt-2 text-white/60">Rated matchmaking or private rooms with friends.</p>

      {error && (
        <p className="mt-4 rounded-md bg-red-950/60 px-3 py-2 text-sm text-red-200">{error}</p>
      )}

      <div className="panel relative mt-6 overflow-hidden p-5">
        {status === "searching" && (
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full border border-moss-400/40">
            <div className="absolute inset-2 animate-orbit rounded-full border-t-2 border-oak-300" />
          </div>
        )}
        <h2 className="text-sm font-medium uppercase tracking-wide text-white/50">Time control</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setSelected(opt)}
              className={`rounded-md px-3 py-2 text-sm transition ${
                selected.label === opt.label
                  ? "bg-moss-600 text-ivory"
                  : "bg-ink-900 text-white/70 hover:bg-ink-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {status === "searching" ? (
            <>
              <button type="button" className="btn-primary" disabled>
                <span className="inline-block h-2 w-2 animate-ping rounded-full bg-ivory" />
                Searching for {selected.label}
              </button>
              <button type="button" className="btn-secondary" onClick={cancelSearch}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-primary" onClick={findMatch}>
                Find rated match
              </button>
              <button type="button" className="btn-secondary" onClick={createRoom}>
                Create private room
              </button>
            </>
          )}
        </div>
      </div>

      <form onSubmit={joinRoom} className="panel mt-4 flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="label" htmlFor="room">
            Join with room code
          </label>
          <input
            id="room"
            className="input"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="e.g. a1b2c3d4"
          />
        </div>
        <button type="submit" className="btn-secondary">
          Join room
        </button>
      </form>
    </div>
  );
}
