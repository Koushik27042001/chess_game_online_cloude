const express = require("express");
const User = require("../models/User");
const Match = require("../models/Match");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/leaderboard", async (_req, res) => {
  try {
    const users = await User.find()
      .sort({ rating: -1 })
      .limit(50)
      .select("username rating wins losses draws gamesPlayed");
    res.json({
      leaderboard: users.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        rating: u.rating,
        wins: u.wins,
        losses: u.losses,
        draws: u.draws,
        gamesPlayed: u.gamesPlayed,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: user.toPublicJSON() });
  } catch {
    res.status(404).json({ message: "User not found" });
  }
});

router.get("/:id/games", authMiddleware, async (req, res) => {
  try {
    const games = await Match.find({
      $or: [{ whitePlayer: req.params.id }, { blackPlayer: req.params.id }],
      result: { $ne: "*" },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("whitePlayer", "username rating")
      .populate("blackPlayer", "username rating");

    res.json({ games });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load games" });
  }
});

module.exports = router;
