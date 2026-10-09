import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RANKS = ["♜♞♝♛♚♝♞♜", "♟♟♟♟♟♟♟♟", "", "", "", "", "♙♙♙♙♙♙♙♙", "♖♘♗♕♔♗♘♖"];

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-moss-600/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-64 w-64 rounded-full bg-oak-400/20 blur-3xl" />

      <section className="relative grid items-center gap-12 py-4 lg:grid-cols-[1.05fr_0.95fr] lg:py-10">
        <div className="animate-rise max-w-xl">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-oak-300">Rated · Live · Analysis</p>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl">Play chess that feels alive.</h1>
          <p className="mt-5 max-w-md text-base text-white/65 sm:text-lg">
            Matchmaking, clocks, ratings, and a board that highlights checks, captures, and promotions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/play" className="btn-primary px-6 py-3">
                  Find a match
                </Link>
                <Link to="/local" className="btn-secondary px-6 py-3">
                  Play on this device
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary px-6 py-3">
                  Create account
                </Link>
                <Link to="/login" className="btn-secondary px-6 py-3">
                  Log in
                </Link>
              </>
            )}
          </div>
          {isAuthenticated && (
            <p className="mt-6 text-sm text-white/50">
              {user.username} · <span className="text-oak-300">{user.rating}</span>
            </p>
          )}
        </div>

        <div className="animate-floaty mx-auto w-full max-w-md">
          <div className="board-frame">
            <div className="grid aspect-square grid-cols-8 overflow-hidden rounded-md">
              {RANKS.flatMap((rank, row) =>
                Array.from({ length: 8 }, (_, col) => {
                  const dark = (row + col) % 2 === 1;
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`flex items-center justify-center text-2xl drop-shadow-sm sm:text-4xl ${
                        dark ? "bg-[#739552] text-[#111]" : "bg-[#ebecd0] text-[#111]"
                      }`}
                    >
                      {rank[col] || ""}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["Live rooms", "Server checks every move, then both clocks and the board update together."],
          ["Clocks & Elo", "Bullet through rapid. Rated games change your rating when they end."],
          ["Analysis", "Step through a position and see a searched best move, not a random guess."],
        ].map(([title, body], index) => (
          <article key={title} className="panel animate-rise p-5" style={{ animationDelay: `${index * 80}ms` }}>
            <h2 className="font-display text-xl">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
