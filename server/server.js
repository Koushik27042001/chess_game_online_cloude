require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const gameRoutes = require("./routes/games");
const { setupSocket } = require("./socket/game");

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

async function start() {
  await connectDB();

  const app = express();
  const server = http.createServer(app);

  app.use(
    cors({
      origin: CLIENT_URL,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, env: process.env.NODE_ENV || "development" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/games", gameRoutes);

  const io = new Server(server, {
    cors: {
      origin: CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  setupSocket(io);

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the other process or change PORT in server/.env`
      );
      process.exit(1);
    }
    throw err;
  });

  server.listen(PORT, () => {
    console.log(`Chess server listening on port ${PORT}`);
    console.log(`CORS origin: ${CLIENT_URL}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
