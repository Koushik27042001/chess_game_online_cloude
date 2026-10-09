import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `text-sm transition ${isActive ? "text-oak-300" : "text-white/70 hover:text-ivory"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="font-display text-xl tracking-tight text-ivory sm:text-2xl">
          Knightline
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/play" className={linkClass}>
                Play
              </NavLink>
              <NavLink to="/local" className={linkClass}>
                Local
              </NavLink>
              <NavLink to="/analysis" className={linkClass}>
                Analysis
              </NavLink>
              <NavLink to="/leaderboard" className={linkClass}>
                Ratings
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                Profile
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-oak-300">{user.rating} Elo</p>
              </div>
              <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary px-3 py-2 text-sm">
                Log in
              </Link>
              <Link to="/register" className="btn-primary px-3 py-2 text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="flex gap-4 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
          <NavLink to="/play" className={linkClass}>
            Play
          </NavLink>
          <NavLink to="/local" className={linkClass}>
            Local
          </NavLink>
          <NavLink to="/analysis" className={linkClass}>
            Analysis
          </NavLink>
          <NavLink to="/leaderboard" className={linkClass}>
            Ratings
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            Profile
          </NavLink>
        </div>
      )}
    </header>
  );
}
