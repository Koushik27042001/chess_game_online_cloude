import { Chess } from "chess.js";

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

function evaluate(game) {
  if (game.isCheckmate()) return game.turn() === "w" ? -100000 : 100000;
  if (game.isDraw()) return 0;

  let score = 0;
  const board = game.board();
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (!piece) continue;
      let value = VALUE[piece.type] || 0;
      if (file >= 2 && file <= 5 && rank >= 2 && rank <= 5) value += 6;
      if (piece.type === "p") {
        value += piece.color === "w" ? (6 - rank) * 4 : (rank - 1) * 4;
      }
      score += piece.color === "w" ? value : -value;
    }
  }

  const mobility = game.moves().length;
  score += game.turn() === "w" ? mobility : -mobility;
  if (game.isCheck()) score += game.turn() === "w" ? -18 : 18;
  return score;
}

function orderMoves(moves) {
  return [...moves].sort((a, b) => {
    const rank = (move) =>
      (move.captured ? 8 : 0) +
      (move.promotion ? 6 : 0) +
      (move.san.includes("+") ? 2 : 0);
    return rank(b) - rank(a);
  });
}

function negamax(game, depth, alpha, beta, deadline) {
  if (Date.now() > deadline) return { score: 0, timeout: true };
  if (depth === 0 || game.isGameOver()) {
    const whiteScore = evaluate(game);
    return { score: game.turn() === "w" ? whiteScore : -whiteScore };
  }

  const moves = orderMoves(game.moves({ verbose: true }));
  let best = -Infinity;
  let bestMove = moves[0] || null;

  for (const move of moves) {
    game.move(move);
    const child = negamax(game, depth - 1, -beta, -alpha, deadline);
    game.undo();
    if (child.timeout) return { score: best === -Infinity ? 0 : best, move: bestMove, timeout: true };
    const score = -child.score;
    if (score > best) {
      best = score;
      bestMove = move;
    }
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }

  return { score: best, move: bestMove };
}

export function analyzePosition(fen, maxDepth = 3, timeMs = 280) {
  const game = new Chess(fen);
  if (game.isGameOver()) {
    return {
      evalCp: evaluate(game),
      bestMove: null,
      depth: 0,
      mate: game.isCheckmate(),
    };
  }

  const deadline = Date.now() + timeMs;
  let best = null;
  let reached = 1;
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const result = negamax(game, depth, -Infinity, Infinity, deadline);
    if (result.move) {
      best = result;
      reached = depth;
    }
    if (result.timeout || Date.now() > deadline) break;
  }

  const relative = best?.score ?? 0;
  const evalCp = game.turn() === "w" ? relative : -relative;
  return {
    evalCp,
    bestMove: best?.move
      ? { san: best.move.san, from: best.move.from, to: best.move.to }
      : null,
    depth: reached,
    mate: Math.abs(evalCp) > 90000,
  };
}
