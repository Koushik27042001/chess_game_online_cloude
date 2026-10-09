const GameRoom = require("./rooms");

class MatchmakingQueue {
  constructor() {
    /** @type {Map<string, {userId:string,username:string,rating:number,socketId:string,timeControl:number,increment:number,joinedAt:number}>} */
    this.queue = new Map();
  }

  enqueue(player) {
    this.queue.set(player.userId, { ...player, joinedAt: Date.now() });
  }

  remove(userId) {
    this.queue.delete(userId);
  }

  isQueued(userId) {
    return this.queue.has(userId);
  }

  /**
   * Pair players within rating band (±200, expands over time).
   * Returns [playerA, playerB] or null.
   */
  tryMatch(userId) {
    const seeker = this.queue.get(userId);
    if (!seeker) return null;

    const waitMs = Date.now() - seeker.joinedAt;
    const band = 200 + Math.floor(waitMs / 5000) * 100;

    let best = null;
    let bestDiff = Infinity;

    for (const [id, candidate] of this.queue) {
      if (id === userId) continue;
      if (candidate.timeControl !== seeker.timeControl) continue;
      if (candidate.increment !== seeker.increment) continue;

      const diff = Math.abs(candidate.rating - seeker.rating);
      if (diff <= band && diff < bestDiff) {
        best = candidate;
        bestDiff = diff;
      }
    }

    if (!best) return null;

    this.queue.delete(seeker.userId);
    this.queue.delete(best.userId);
    return [seeker, best];
  }

  size() {
    return this.queue.size;
  }
}

function createRatedRoom(playerA, playerB) {
  const swap = Math.random() < 0.5;
  const white = swap ? playerB : playerA;
  const black = swap ? playerA : playerB;

  const room = new GameRoom({
    timeControl: playerA.timeControl,
    increment: playerA.increment,
    rated: true,
    host: {
      userId: white.userId,
      username: white.username,
      rating: white.rating,
      socketId: white.socketId,
    },
  });

  room.seatPlayer({
    userId: black.userId,
    username: black.username,
    rating: black.rating,
    socketId: black.socketId,
  });

  room.start();
  return room;
}

module.exports = { MatchmakingQueue, createRatedRoom };
