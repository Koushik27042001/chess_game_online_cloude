const express = require("express");
const User = require("../models/User");
const { signToken, authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (exists) {
      return res.status(409).json({ message: "Username or email already in use" });
    }

    const user = await User.create({ username, email, password });
    const token = signToken(user._id);

    res.status(201).json({ token, user: user.toPublicJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

module.exports = router;
