import { getHealth } from "../lib/gameService.js";
import { applyCors, handleApiError, handleOptions } from "./_helpers.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  applyCors(res);

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const data = await getHealth();
    res.status(200).json(data);
  } catch (error) {
    await handleApiError(res, error);
  }
}
