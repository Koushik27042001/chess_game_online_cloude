const Match = require("../models/Match");
const User = require("../models/User");
const { updateElo } = require("../utils/elo");
const GameRoom = require("./rooms");
const { MatchmakingQueue, createRatedRoom } = require("./matchmaking");
const { verifySocketToken } = require("../middleware/auth");

/** @type {Map<string, GameRoom>} */
const rooms = new Map();
const queue = new MatchmakingQueue();
/** socketId -> userId */
const socketUsers = new Map();

async function persistFinishedGame(room) {
  if (!room.players.white || !room.players.black || room.result === "*") return null;
  if (room.matchId) {
    const existing = await Match.findById(room.matchId);
    if (existing && existing.result !== "*") return existing;
  }

  const white = await User.findById(room.players.white.userId);
  const black = await User.findById(room.players.black.userId);
  if (!white || !black) return null;

  let ratingChange = { white: 0, black: 0 };
  if (room.rated && room.result !== "*") {
    const elo = updateElo(white.rating, black.rating, room.result);
    ratingChange = { white: elo.white.delta, black: elo.black.delta };
    white.rating = elo.white.after;
    black.rating = elo.black.after;
  }

  white.gamesPlayed += 1;
  black.gamesPlayed += 1;

  if (room.result === "1-0") {
    white.wins += 1;
    black.losses += 1;
  } else if (room.result === "0-1") {
    black.wins += 1;
    white.losses += 1;
  } else if (room.result === "1/2-1/2") {
    white.draws += 1;
    black.draws += 1;
  }

  await white.save();
  await black.save();

  const winnerId =
    room.result === "1-0"
      ? white._id
      : room.result === "0-1"
        ? black._id
        : null;

  const match = await Match.create({
    whitePlayer: white._id,
    blackPlayer: black._id,
    result: room.result,
    winner: winnerId,
    PGN: room.chess.pgn(),
    FEN: room.chess.fen(),
    moves: room.moveHistory,
    duration: Math.floor((Date.now() - room.createdAt) / 1000),
    timeControl: room.timeControl,
    increment: room.increment,
    rated: room.rated,
    ratingChange,
    termination: room.termination,
    roomId: room.roomId,
  });

  room.matchId = match._id.toString();
  room.players.white.rating = white.rating;
  room.players.black.rating = black.rating;

  return {
    match,
    ratingChange,
    players: {
      white: white.toPublicJSON(),
      black: black.toPublicJSON(),
    },
  };
}

function emitRoom(io, room) {
  io.to(room.roomId).emit("gameState", room.publicState());
}

function setupSocket(io) {
  // Clock ticker for timeouts
  setInterval(async () => {
    for (const room of rooms.values()) {
      if (room.status !== "playing") continue;
      const timedOut = room.tickClocks();
      if (!timedOut) continue;

      const result = timedOut === "white" ? "0-1" : "1-0";
      room.finish(result, "timeout");
      const saved = await persistFinishedGame(room);
      io.to(room.roomId).emit("gameOver", {
        ...room.publicState(),
        ratingChange: saved?.ratingChange || null,
        playersUpdated: saved?.players || null,
      });
    }
  }, 250);

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    const payload = verifySocketToken(token);
    if (!payload?.id) {
      return next(new Error("Unauthorized"));
    }
    const user = await User.findById(payload.id);
    if (!user) return next(new Error("Unauthorized"));
    socket.user = {
      userId: user._id.toString(),
      username: user.username,
      rating: user.rating,
    };
    next();
  });

  io.on("connection", (socket) => {
    socketUsers.set(socket.id, socket.user.userId);
    socket.emit("connected", { user: socket.user });

    socket.on("createRoom", (payload = {}, cb) => {
      const timeControl = Number(payload.timeControl) || Number(process.env.DEFAULT_TIME_CONTROL) || 600;
      const increment = Number(payload.increment) || Number(process.env.DEFAULT_INCREMENT) || 0;
      const rated = payload.rated !== false;

      const room = new GameRoom({
        timeControl,
        increment,
        rated,
        host: {
          userId: socket.user.userId,
          username: socket.user.username,
          rating: socket.user.rating,
          socketId: socket.id,
        },
      });

      rooms.set(room.roomId, room);
      socket.join(room.roomId);
      const response = { roomId: room.roomId, color: "white", state: room.publicState() };
      if (typeof cb === "function") cb(response);
      socket.emit("roomCreated", response);
    });

    socket.on("joinRoom", (payload = {}, cb) => {
      const room = rooms.get(payload.roomId);
      if (!room) {
        if (typeof cb === "function") cb({ error: "Room not found" });
        return;
      }

      socket.join(room.roomId);
      let color = room.getColor(socket.user.userId);

      if (color && room.abandonTimer) {
        clearTimeout(room.abandonTimer);
        room.abandonTimer = null;
        room.disconnectedColor = null;
        io.to(room.roomId).emit("playerReconnected", { color });
      }

      if (!color && !room.isFull()) {
        color = room.seatPlayer({
          userId: socket.user.userId,
          username: socket.user.username,
          rating: socket.user.rating,
          socketId: socket.id,
        });
      }

      if (!color) {
        room.spectators.add(socket.id);
        color = "spectator";
      } else {
        const player = room.players[color];
        if (player) player.socketId = socket.id;
      }

      if (room.isFull() && room.status === "waiting") {
        room.start();
        io.to(room.roomId).emit("gameStart", room.publicState());
      }

      const response = { roomId: room.roomId, color, state: room.publicState() };
      if (typeof cb === "function") cb(response);
      emitRoom(io, room);
    });

    socket.on("move", async (payload = {}, cb) => {
      const room = rooms.get(payload.roomId);
      if (!room) {
        if (typeof cb === "function") cb({ error: "Room not found" });
        return;
      }

      const outcome = room.applyMove(socket.user.userId, payload.move || {});
      if (outcome.timeout) {
        const result = outcome.timeout === "white" ? "0-1" : "1-0";
        room.finish(result, "timeout");
        const saved = await persistFinishedGame(room);
        io.to(room.roomId).emit("gameOver", {
          ...room.publicState(),
          ratingChange: saved?.ratingChange || null,
          playersUpdated: saved?.players || null,
        });
        if (typeof cb === "function") cb({ ok: false, timeout: true });
        return;
      }

      if (!outcome.ok) {
        if (typeof cb === "function") cb({ error: outcome.error });
        return;
      }

      io.to(room.roomId).emit("move", {
        move: {
          from: outcome.move.from,
          to: outcome.move.to,
          promotion: outcome.move.promotion,
          san: outcome.move.san,
          captured: outcome.move.captured || null,
        },
        fen: outcome.fen,
        pgn: outcome.pgn,
        moves: room.moveHistory,
        clocks: outcome.clocks,
        turn: outcome.turn,
        check: room.chess.isCheck(),
      });

      if (outcome.gameOver) {
        const saved = await persistFinishedGame(room);
        io.to(room.roomId).emit("gameOver", {
          ...room.publicState(),
          ratingChange: saved?.ratingChange || null,
          playersUpdated: saved?.players || null,
        });
      }

      if (typeof cb === "function") cb({ ok: true });
    });

    socket.on("resign", async ({ roomId } = {}) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const end = room.resign(socket.user.userId);
      if (!end) return;
      const saved = await persistFinishedGame(room);
      io.to(room.roomId).emit("gameOver", {
        ...room.publicState(),
        ratingChange: saved?.ratingChange || null,
        playersUpdated: saved?.players || null,
      });
    });

    socket.on("offerDraw", ({ roomId } = {}) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "playing") return;
      const color = room.getColor(socket.user.userId);
      if (!color) return;
      room.drawOffer = color;
      io.to(room.roomId).emit("drawOffered", { by: color, state: room.publicState() });
    });

    socket.on("respondDraw", async ({ roomId, accept } = {}) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "playing" || !room.drawOffer) return;
      const color = room.getColor(socket.user.userId);
      if (!color || color === room.drawOffer) return;

      if (accept) {
        room.finish("1/2-1/2", "agreement");
        const saved = await persistFinishedGame(room);
        io.to(room.roomId).emit("gameOver", {
          ...room.publicState(),
          ratingChange: saved?.ratingChange || null,
          playersUpdated: saved?.players || null,
        });
      } else {
        room.drawOffer = null;
        io.to(room.roomId).emit("drawDeclined", { by: color });
        emitRoom(io, room);
      }
    });

    socket.on("chat", ({ roomId, message } = {}) => {
      const room = rooms.get(roomId);
      if (!room || !message?.trim()) return;
      const text = String(message).slice(0, 300);
      io.to(roomId).emit("chat", {
        userId: socket.user.userId,
        username: socket.user.username,
        message: text,
        at: Date.now(),
      });
    });

    socket.on("findMatch", (payload = {}, cb) => {
      const timeControl = Number(payload.timeControl) || 600;
      const increment = Number(payload.increment) || 0;

      if (queue.isQueued(socket.user.userId)) {
        if (typeof cb === "function") cb({ queued: true });
        return;
      }

      queue.enqueue({
        userId: socket.user.userId,
        username: socket.user.username,
        rating: socket.user.rating,
        socketId: socket.id,
        timeControl,
        increment,
      });

      const pair = queue.tryMatch(socket.user.userId);
      if (!pair) {
        socket.emit("matchmaking", { status: "searching", queueSize: queue.size() });
        if (typeof cb === "function") cb({ queued: true });
        return;
      }

      const room = createRatedRoom(pair[0], pair[1]);
      rooms.set(room.roomId, room);

      for (const p of pair) {
        const s = io.sockets.sockets.get(p.socketId);
        if (s) {
          s.join(room.roomId);
          const color = room.getColor(p.userId);
          s.emit("matchFound", {
            roomId: room.roomId,
            color,
            state: room.publicState(),
          });
        }
      }

      io.to(room.roomId).emit("gameStart", room.publicState());
      if (typeof cb === "function") cb({ matched: true, roomId: room.roomId });
    });

    socket.on("cancelMatchmaking", () => {
      queue.remove(socket.user.userId);
      socket.emit("matchmaking", { status: "cancelled" });
    });

    socket.on("getClocks", ({ roomId } = {}, cb) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const clocks = room.getLiveClocks();
      if (typeof cb === "function") cb({ clocks });
      socket.emit("clocks", { roomId, clocks });
    });

    socket.on("disconnect", () => {
      queue.remove(socket.user.userId);
      socketUsers.delete(socket.id);

      for (const room of rooms.values()) {
        room.spectators.delete(socket.id);
        const color = room.getColor(socket.user.userId);
        if (!color) continue;

        if (room.status === "waiting") {
          room.players[color] = null;
          if (!room.players.white && !room.players.black) {
            rooms.delete(room.roomId);
          } else {
            emitRoom(io, room);
          }
          continue;
        }

        if (room.status !== "playing") continue;
        if (room.players[color]?.socketId !== socket.id) continue;

        room.disconnectedColor = color;
        io.to(room.roomId).emit("playerDisconnected", {
          color,
          graceMs: 20000,
          state: room.publicState(),
        });

        if (room.abandonTimer) clearTimeout(room.abandonTimer);
        room.abandonTimer = setTimeout(async () => {
          if (room.status !== "playing" || room.disconnectedColor !== color) return;
          const live = io.sockets.sockets.get(room.players[color]?.socketId);
          if (live?.connected) return;
          const result = color === "white" ? "0-1" : "1-0";
          room.finish(result, "abandoned");
          const saved = await persistFinishedGame(room);
          io.to(room.roomId).emit("gameOver", {
            ...room.publicState(),
            ratingChange: saved?.ratingChange || null,
            playersUpdated: saved?.players || null,
          });
        }, 20000);
      }
    });
  });
}

module.exports = { setupSocket, rooms };
