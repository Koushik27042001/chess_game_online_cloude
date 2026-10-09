const { Chess } = require("chess.js");
const { randomUUID } = require("crypto");

/** @typedef {"waiting"|"playing"|"finished"} RoomStatus */

class GameRoom {
  constructor({
    roomId,
    timeControl = 600,
    increment = 0,
    rated = true,
    host,
  }) {
    this.roomId = roomId || randomUUID().slice(0, 8);
    this.chess = new Chess();
    this.status = "waiting";
    this.rated = rated;
    this.timeControl = timeControl;
    this.increment = increment;
    this.players = {
      white: host || null,
      black: null,
    };
    this.spectators = new Set();
    this.clocks = {
      white: timeControl * 1000,
      black: timeControl * 1000,
    };
    this.turnStartedAt = null;
    this.moveHistory = [];
    this.lastMove = null;
    this.drawOffer = null;
    this.abandonTimer = null;
    this.disconnectedColor = null;
    this.matchId = null;
    this.termination = null;
    this.result = "*";
    this.createdAt = Date.now();
  }

  isFull() {
    return Boolean(this.players.white && this.players.black);
  }

  getColor(userId) {
    if (this.players.white?.userId === userId) return "white";
    if (this.players.black?.userId === userId) return "black";
    return null;
  }

  seatPlayer(player) {
    if (!this.players.white) {
      this.players.white = player;
      return "white";
    }
    if (!this.players.black && this.players.white.userId !== player.userId) {
      this.players.black = player;
      return "black";
    }
    return null;
  }

  start() {
    if (!this.isFull() || this.status === "playing") return false;
    this.status = "playing";
    this.turnStartedAt = Date.now();
    return true;
  }

  tickClocks() {
    if (this.status !== "playing" || !this.turnStartedAt) return null;
    const elapsed = Date.now() - this.turnStartedAt;
    const side = this.chess.turn() === "w" ? "white" : "black";
    const remaining = this.clocks[side] - elapsed;
    if (remaining <= 0) {
      this.clocks[side] = 0;
      return side;
    }
    return null;
  }

  getLiveClocks() {
    const clocks = { ...this.clocks };
    if (this.status === "playing" && this.turnStartedAt) {
      const elapsed = Date.now() - this.turnStartedAt;
      const side = this.chess.turn() === "w" ? "white" : "black";
      clocks[side] = Math.max(0, clocks[side] - elapsed);
    }
    return clocks;
  }

  applyMove(userId, move) {
    if (this.status !== "playing") {
      return { ok: false, error: "Game not in progress" };
    }

    const color = this.getColor(userId);
    if (!color) return { ok: false, error: "Not a player" };

    const expected = this.chess.turn() === "w" ? "white" : "black";
    if (color !== expected) return { ok: false, error: "Not your turn" };

    const timedOut = this.tickClocks();
    if (timedOut) {
      return { ok: false, timeout: timedOut };
    }

    const result = this.chess.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion || "q",
    });

    if (!result) return { ok: false, error: "Illegal move" };

    const sideJustMoved = color;
    const elapsed = Date.now() - this.turnStartedAt;
    this.clocks[sideJustMoved] = Math.max(
      0,
      this.clocks[sideJustMoved] - elapsed + this.increment * 1000
    );
    this.turnStartedAt = Date.now();
    this.moveHistory.push(result.san);
    this.lastMove = {
      from: result.from,
      to: result.to,
      san: result.san,
      captured: result.captured || null,
    };
    this.drawOffer = null;

    const gameOver = this.evaluateEnd();
    return {
      ok: true,
      move: result,
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      clocks: this.getLiveClocks(),
      turn: this.chess.turn(),
      gameOver,
    };
  }

  evaluateEnd() {
    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === "w" ? "black" : "white";
      return this.finish(winner === "white" ? "1-0" : "0-1", "checkmate");
    }
    if (this.chess.isStalemate()) {
      return this.finish("1/2-1/2", "stalemate");
    }
    if (
      this.chess.isThreefoldRepetition() ||
      this.chess.isInsufficientMaterial() ||
      this.chess.isDraw()
    ) {
      return this.finish("1/2-1/2", "draw");
    }
    return null;
  }

  finish(result, termination) {
    this.status = "finished";
    this.result = result;
    this.termination = termination;
    this.turnStartedAt = null;
    return { result, termination };
  }

  resign(userId) {
    const color = this.getColor(userId);
    if (!color || this.status !== "playing") return null;
    const result = color === "white" ? "0-1" : "1-0";
    return this.finish(result, "resignation");
  }

  publicState() {
    return {
      roomId: this.roomId,
      status: this.status,
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      moves: [...this.moveHistory],
      lastMove: this.lastMove,
      turn: this.chess.turn(),
      disconnectedColor: this.disconnectedColor,
      clocks: this.getLiveClocks(),
      timeControl: this.timeControl,
      increment: this.increment,
      rated: this.rated,
      drawOffer: this.drawOffer,
      result: this.result,
      termination: this.termination,
      check: this.chess.isCheck(),
      players: {
        white: this.players.white
          ? {
              userId: this.players.white.userId,
              username: this.players.white.username,
              rating: this.players.white.rating,
            }
          : null,
        black: this.players.black
          ? {
              userId: this.players.black.userId,
              username: this.players.black.username,
              rating: this.players.black.rating,
            }
          : null,
      },
    };
  }
}

module.exports = GameRoom;
