const express = require("express");
const Match = require("../models/Match");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("whitePlayer", "username rating")
      .populate("blackPlayer", "username rating");
    if (!match) return res.status(404).json({ message: "Match not found" });
    res.json({ match });
  } catch {
    res.status(404).json({ message: "Match not found" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const games = await Match.find({
      $or: [{ whitePlayer: req.user._id }, { blackPlayer: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(40)
      .populate("whitePlayer", "username rating")
      .populate("blackPlayer", "username rating");
    res.json({ games });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load matches" });
  }
});

module.exports = router;
