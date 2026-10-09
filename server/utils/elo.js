/**
 * Standard Elo update (K=32 for rating < 2100, else 24 / 16).
 */
function expectedScore(ratingA, ratingB) {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

function kFactor(rating) {
  if (rating < 2100) return 32;
  if (rating < 2400) return 24;
  return 16;
}

/**
 * @param {number} whiteRating
 * @param {number} blackRating
 * @param {"1-0"|"0-1"|"1/2-1/2"} result
 */
function updateElo(whiteRating, blackRating, result) {
  const scoreWhite =
    result === "1-0" ? 1 : result === "0-1" ? 0 : 0.5;
  const scoreBlack = 1 - scoreWhite;

  const expW = expectedScore(whiteRating, blackRating);
  const expB = expectedScore(blackRating, whiteRating);

  const newWhite = Math.round(
    whiteRating + kFactor(whiteRating) * (scoreWhite - expW)
  );
  const newBlack = Math.round(
    blackRating + kFactor(blackRating) * (scoreBlack - expB)
  );

  return {
    white: { before: whiteRating, after: newWhite, delta: newWhite - whiteRating },
    black: { before: blackRating, after: newBlack, delta: newBlack - blackRating },
  };
}

module.exports = { updateElo, expectedScore };
