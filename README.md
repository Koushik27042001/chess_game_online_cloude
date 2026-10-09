# Knightline Chess

Full-stack multiplayer chess: React + Express + Socket.IO + MongoDB, with auth, clocks, Elo ratings, matchmaking, and analysis.

## Stack

| Layer | Tech |
|--------|------|
| Frontend | React 18, Vite, Tailwind, React Router, react-chessboard, Socket.IO client |
| Backend | Node.js, Express, Socket.IO, chess.js |
| Database | MongoDB (users, match history, ratings) |

## Features (MVP → advanced)

- Register / login (JWT)
- Local two-player board (undo, restart, legal moves via chess.js)
- Online rooms + rated matchmaking
- Server-validated moves, check / checkmate / draw rules
- Chess clocks with increment
- Resign, draw offer/accept
- In-game chat
- Move history + captured pieces
- Elo rating updates after rated games
- Leaderboard + profile / recent games
- Analysis board (PGN load + position eval)
- Responsive layout (mobile → desktop)

## Environment variables

### Note — add values from your side

Copy the example files and replace placeholders with your real values. Defaults work for local MongoDB + Vite.

**Server** — `server/.env` (from `server/.env.example`)

| Variable | Purpose | You provide |
|----------|---------|-------------|
| `PORT` | API / Socket port | Optional (default `5000`) |
| `NODE_ENV` | `development` / `production` | Optional |
| `MONGODB_URI` | Mongo connection string | **Yes — your Atlas or local URI** |
| `JWT_SECRET` | Token signing secret | **Yes — long random string** |
| `JWT_EXPIRES_IN` | Token lifetime | Optional (`7d`) |
| `CLIENT_URL` | Frontend origin for CORS | Optional (`http://localhost:5173`) |
| `DEFAULT_TIME_CONTROL` | Default seconds | Optional (`600`) |
| `DEFAULT_INCREMENT` | Default increment seconds | Optional (`0`) |

**Client** — `client/.env` (from `client/.env.example`)

| Variable | Purpose | You provide |
|----------|---------|-------------|
| `VITE_API_URL` | REST base URL | If API is not `http://localhost:5000` |
| `VITE_SOCKET_URL` | Socket.IO URL | Usually same as API |

`.env` files are already created with safe local defaults. **Change `JWT_SECRET` and `MONGODB_URI` before any real deployment.**

## Setup

### 1. MongoDB

Run MongoDB locally or set `MONGODB_URI` to your Atlas connection string.

### 2. Server

```bash
cd server
npm install
npm run dev
```

### 3. Client

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Play flow

1. Sign up / log in  
2. **Play** → find a rated match or create/join a room  
3. Or **Local** for same-device two-player  
4. After games, check **Profile** / **Ratings**  
5. Use **Analysis** to load PGN and explore  

## Project layout

```
chess_game/
├── client/          # Vite React app
│   ├── .env
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       ├── socket/
│       └── api/
└── server/          # Express + Socket.IO
    ├── .env
    ├── models/
    ├── routes/
    ├── middleware/
    └── socket/
```

## Scripts

| Location | Command | Action |
|----------|---------|--------|
| `server` | `npm start` / `npm run dev` | Run API |
| `client` | `npm run dev` | Vite dev server |
| `client` | `npm run build` | Production build |
