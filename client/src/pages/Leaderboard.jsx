import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Leaderboard() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api("/api/users/leaderboard", { token })
      .then((data) => {
        if (!cancelled) setRows(data.leaderboard || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl">Ratings</h1>
      <p className="mt-2 text-sm text-white/55">Top players by Elo.</p>
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <div className="panel mt-6 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Elo</th>
              <th className="px-4 py-3">W</th>
              <th className="px-4 py-3">L</th>
              <th className="px-4 py-3">D</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-white/40">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3 text-oak-300">{u.rating}</td>
                <td className="px-4 py-3">{u.wins}</td>
                <td className="px-4 py-3">{u.losses}</td>
                <td className="px-4 py-3">{u.draws}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !error && (
          <p className="px-4 py-6 text-sm text-white/40">No players yet — be the first.</p>
        )}
      </div>
    </div>
  );
}
