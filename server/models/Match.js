const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    whitePlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blackPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    result: {
      type: String,
      enum: ["1-0", "0-1", "1/2-1/2", "*"],
      default: "*",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    PGN: { type: String, default: "" },
    FEN: { type: String, default: "" },
    moves: [{ type: String }],
    duration: { type: Number, default: 0 },
    timeControl: { type: Number, default: 600 },
    increment: { type: Number, default: 0 },
    rated: { type: Boolean, default: true },
    ratingChange: {
      white: { type: Number, default: 0 },
      black: { type: Number, default: 0 },
    },
    termination: {
      type: String,
      enum: [
        "checkmate",
        "stalemate",
        "draw",
        "resignation",
        "timeout",
        "agreement",
        "abandoned",
        "ongoing",
      ],
      default: "ongoing",
    },
    roomId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
