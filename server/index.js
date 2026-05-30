import cors from "cors";
import express from "express";
import { Game } from "./game.js";

const PORT = Number(process.env.PORT) || 3001;
const app = express();
const game = new Game();

app.use(cors());
app.use(express.json());

app.post("/api/join", (req, res) => {
  const playerId = game.join(req.body.playerId);
  res.json({ playerId, ...game.serialize(playerId) });
});

app.post("/api/withdraw", (req, res) => {
  const { playerId } = req.body;
  if (!playerId) {
    res.status(400).json({ error: "缺少 playerId" });
    return;
  }

  game.join(playerId);
  const result = game.withdraw(playerId);
  if (result.error) {
    res.status(400).json(result);
    return;
  }

  res.json({ playerId, ...game.serialize(playerId) });
});

app.get("/api/state", (req, res) => {
  const { playerId } = req.query;
  if (playerId) {
    game.join(String(playerId));
  }

  res.json(game.serialize(playerId ? String(playerId) : null));
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    serverStartedAt: game.serverStartedAt,
    roundId: game.roundId,
    phase: game.phase,
  });
});

app.listen(PORT, () => {
  console.log(`Bank Run API listening on http://localhost:${PORT}`);
  console.log(`Server started at ${new Date(game.serverStartedAt).toISOString()}`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nPort ${PORT} is already in use. An old server is probably still running.`,
    );
    console.error("Run: npm run dev:kill\n");
  } else {
    console.error(err);
  }
  process.exit(1);
});
