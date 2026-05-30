import { getGameState } from "../lib/gameService.js";
import { applyCors, handleApiError, handleOptions } from "./_helpers.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  applyCors(res);

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const playerId = req.query.playerId
      ? String(req.query.playerId)
      : undefined;
    const data = await getGameState(playerId);

    if (data.error) {
      res.status(400).json(data);
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    await handleApiError(res, error);
  }
}
