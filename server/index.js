import { config } from "dotenv";
import cors from "cors";
import express from "express";
import {
  getGameState,
  getHealth,
  joinGame,
  withdraw as withdrawFromBank,
} from "../lib/gameService.js";

config({ path: ".env.local" });
config();

const PORT = Number(process.env.PORT) || 3001;
const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/join", async (req, res) => {
  try {
    const data = await joinGame(req.body.playerId);
    if (data.error) {
      res.status(400).json(data);
      return;
    }
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message ?? "服务器错误" });
  }
});

app.post("/api/withdraw", async (req, res) => {
  try {
    const data = await withdrawFromBank(req.body.playerId);
    if (data.error) {
      res.status(400).json(data);
      return;
    }
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message ?? "服务器错误" });
  }
});

app.get("/api/state", async (req, res) => {
  try {
    const playerId = req.query.playerId
      ? String(req.query.playerId)
      : undefined;
    const data = await getGameState(playerId);
    if (data.error) {
      res.status(400).json(data);
      return;
    }
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message ?? "服务器错误" });
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    res.json(await getHealth());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message ?? "服务器错误" });
  }
});

app.listen(PORT, () => {
  console.log(`Bank Run API (Supabase) listening on http://localhost:${PORT}`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nPort ${PORT} is already in use. Run: npm run dev:kill\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
