import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Chess } from "chess.js";
import ChessBoard from "../components/ChessBoard";
import MoveHistory from "../components/MoveHistory";
import PlayerInfo from "../components/PlayerInfo";
import Chat from "../components/Chat";
import GameOver from "../components/GameOver";
import AnalysisPanel from "../components/AnalysisPanel";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../socket/socket";
import { capturesFromBoard, statusLabel } from "../utils/chessHelpers";
import { playMoveSound } from "../utils/sounds";

function useBoardWidth() {
  const [width, setWidth] = useState(360);
  useEffect(() => {
    const update = () => setWidth(Math.min(560, Math.max(280, window.innerWidth - 32)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

function useLiveClocks(serverClocks, turn, status) {
  const anchor = useRef({ clocks: serverClocks, at: Date.now() });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!serverClocks) return;
    anchor.current = { clocks: serverClocks, at: Date.now() };
    setNow(Date.now());
  }, [serverClocks?.white, serverClocks?.black, turn, status]);

  useEffect(() => {
    if (status !== "playing") return undefined;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [status]);

  if (!anchor.current.clocks) return { white: 0, black: 0 };
  const elapsed = status === "playing" ? now - anchor.current.at : 0;
  const side = turn === "w" ? "white" : "black";
  return {
    white: Math.max(0, anchor.current.clocks.white - (side === "white" ? elapsed : 0)),
    black: Math.max(0, anchor.current.clocks.black - (side === "black" ? elapsed : 0)),
  };
}

export default function Game() {
  const { roomId } = useParams();
  const { token, user, refreshUser } = useAuth();
  const boardWidth = useBoardWidth();
  const heardMove = useRef(null);
  const colorRef = useRef(null);
  colorRef.current = color;

  const [color, setColor] = useState(null);
  const [state, setState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [ratingChange, setRatingChange] = useState(null);
  const [error, setError] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [disconnectNote, setDisconnectNote] = useState("");
  const [copied, setCopied] = useState(false);

  const chess = useMemo(() => {
    try {
      return state?.fen ? new Chess(state.fen) : new Chess();
    } catch {
      return new Chess();
    }
  }, [state?.fen]);

  const captures = useMemo(() => capturesFromBoard(chess), [chess]);
  const clocks = useLiveClocks(state?.clocks, state?.turn, state?.status);

  const syncState = useCallback((next) => {
    if (next) setState(next);
  }, []);

  useEffect(() => {
    const socket = getSocket(token);
    if (!socket.connected) socket.connect();

    socket.emit("joinRoom", { roomId }, (res) => {
      if (res?.error) {
        setError(res.error);
        return;
      }
      setColor(res.color);
      syncState(res.state);
    });

    const onState = (next) => syncState(next);
    const onMove = (payload) => {
      setState((prev) =>
        prev
          ? {
              ...prev,
              fen: payload.fen,
              pgn: payload.pgn,
              moves: payload.moves,
              turn: payload.turn,
              check: payload.check,
              clocks: payload.clocks,
              lastMove: payload.move,
              drawOffer: null,
              status: "playing",
            }
          : prev
      );
      if (payload.move?.san && heardMove.current !== payload.move.san + payload.fen) {
        heardMove.current = payload.move.san + payload.fen;
        playMoveSound(payload.move);
      }
    };
    const onOver = async (payload) => {
      syncState(payload);
      setDisconnectNote("");
      setRatingChange(payload.ratingChange || null);
      playMoveSound({ san: "#" });
      await refreshUser();
    };
    const onChat = (msg) => setMessages((list) => [...list, msg]);
    const onDraw = ({ by, state: next }) => {
      syncState(next);
      if (by && by !== colorRef.current) setError("Opponent offered a draw");
    };
    const onLeft = ({ color: who }) => {
      setDisconnectNote(`${who === "white" ? "White" : "Black"} disconnected. They have 20 seconds to return.`);
    };
    const onBack = () => setDisconnectNote("");

    socket.on("gameState", onState);
    socket.on("gameStart", onState);
    socket.on("move", onMove);
    socket.on("gameOver", onOver);
    socket.on("chat", onChat);
    socket.on("drawOffered", onDraw);
    socket.on("drawDeclined", () => setError("Draw declined"));
    socket.on("playerDisconnected", onLeft);
    socket.on("playerReconnected", onBack);

    return () => {
      socket.off("gameState", onState);
      socket.off("gameStart", onState);
      socket.off("move", onMove);
      socket.off("gameOver", onOver);
      socket.off("chat", onChat);
      socket.off("drawOffered", onDraw);
      socket.off("drawDeclined");
      socket.off("playerDisconnected", onLeft);
      socket.off("playerReconnected", onBack);
    };
  }, [roomId, token, refreshUser, syncState]);

  function makeMove(move) {
    if (!state || state.status !== "playing") return false;
    if (color !== "white" && color !== "black") return false;
    const myTurn =
      (state.turn === "w" && color === "white") || (state.turn === "b" && color === "black");
    if (!myTurn) return false;

    const copy = new Chess(state.fen);
    const result = copy.move(move);
    if (!result) return false;

    setError("");
    getSocket(token).emit("move", { roomId, move }, (res) => {
      if (res?.error) setError(res.error);
    });
    return true;
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  const orientation = color === "black" ? "black" : "white";
  const canPlay = state?.status === "playing" && (color === "white" || color === "black");
  const topColor = orientation === "white" ? "black" : "white";
  const bottomColor = orientation === "white" ? "white" : "black";
  const activeSide = state?.turn === "w" ? "white" : "black";

  return (
    <div className="animate-rise">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Live game</h1>
          <p className="text-sm text-white/50">{statusLabel(state)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={copyCode}>
            {copied ? "Copied" : `Room ${roomId}`}
          </button>
          <button type="button" className="btn-secondary text-sm" onClick={() => setShowAnalysis((value) => !value)}>
            {showAnalysis ? "Hide analysis" : "Analysis"}
          </button>
        </div>
      </div>

      {error && <p className="mb-3 rounded-lg bg-oak-500/15 px-3 py-2 text-sm text-oak-200">{error}</p>}
      {disconnectNote && (
        <p className="mb-3 animate-pulse rounded-lg bg-red-950/70 px-3 py-2 text-sm text-red-100">{disconnectNote}</p>
      )}
      {state?.status === "waiting" && (
        <p className="mb-3 rounded-lg border border-dashed border-oak-400/40 px-3 py-2 text-sm text-white/70">
          Share room code <span className="font-mono text-oak-300">{roomId}</span> and wait for your opponent.
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="mx-auto w-full max-w-[620px] space-y-2">
          <PlayerInfo
            player={state?.players?.[topColor]}
            color={topColor}
            you={color === topColor}
            active={state?.status === "playing" && activeSide === topColor}
            clock={clocks[topColor]}
            pieces={topColor === "white" ? captures.byWhite : captures.byBlack}
          />
          <ChessBoard
            fen={state?.fen || "start"}
            orientation={orientation}
            arePiecesDraggable={canPlay}
            onMove={makeMove}
            highlightCheck={Boolean(state?.check)}
            lastMove={state?.lastMove}
            boardWidth={boardWidth}
          />
          <PlayerInfo
            player={state?.players?.[bottomColor]}
            color={bottomColor}
            you={color === bottomColor}
            active={state?.status === "playing" && activeSide === bottomColor}
            clock={clocks[bottomColor]}
            pieces={bottomColor === "white" ? captures.byWhite : captures.byBlack}
          />

          {canPlay && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => getSocket(token).emit("offerDraw", { roomId })}>
                Offer draw
              </button>
              {state?.drawOffer && state.drawOffer !== color && (
                <>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => getSocket(token).emit("respondDraw", { roomId, accept: true })}
                  >
                    Accept draw
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => getSocket(token).emit("respondDraw", { roomId, accept: false })}
                  >
                    Decline
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (window.confirm("Resign this game?")) getSocket(token).emit("resign", { roomId });
                }}
              >
                Resign
              </button>
            </div>
          )}
          {color === "spectator" && <p className="text-sm text-white/45">You are watching this game.</p>}
        </div>

        <aside className="space-y-4">
          <MoveHistory moves={state?.moves || []} />
          <Chat
            messages={messages}
            disabled={!state}
            onSend={(message) => getSocket(token).emit("chat", { roomId, message })}
          />
          {showAnalysis && <AnalysisPanel fen={state?.fen || chess.fen()} pgn={state?.pgn} />}
          <div className="panel p-3 text-xs text-white/45">
            You are <strong className="text-ivory">{color || "…"}</strong>
            {user ? ` · ${user.username}` : ""}
            {state?.timeControl ? ` · ${Math.round(state.timeControl / 60)}+${state.increment || 0}` : ""}
          </div>
        </aside>
      </div>

      <GameOver state={state} ratingChange={ratingChange} myColor={color} onRematchPath="/play" />
    </div>
  );
}
