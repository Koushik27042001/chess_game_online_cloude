import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Profile() {
  const { user, token, refreshUser } = useAuth();
  const [games, setGames] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await refreshUser();
        const data = await api("/api/games", { token });
        if (!cancelled) setGames(data.games || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, refreshUser]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl">{user.username}</h1>
      <p className="mt-1 text-white/55">{user.email}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Rating", user.rating],
          ["Wins", user.wins],
          ["Losses", user.losses],
          ["Draws", user.draws],
        ].map(([label, value]) => (
          <div key={label} className="panel p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
            <p className="mt-1 font-display text-2xl">{value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl">Recent games</h2>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      <div className="mt-3 space-y-2">
        {games.length === 0 && <p className="text-sm text-white/45">No games yet.</p>}
        {games.map((g) => {
          const white = g.whitePlayer?.username || "?";
          const black = g.blackPlayer?.username || "?";
          return (
            <div key={g._id} className="panel flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p>
                  {white} vs {black}
                </p>
                <p className="text-xs text-white/40">
                  {g.termination} · {new Date(g.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="font-mono text-oak-300">{g.result}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
