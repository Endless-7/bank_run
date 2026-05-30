export function applyCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    applyCors(res);
    res.status(200).end();
    return true;
  }
  return false;
}

export async function handleApiError(res, error) {
  console.error(error);
  applyCors(res);

  if (error.message?.includes("Supabase")) {
    res.status(500).json({
      error: "服务器未配置 Supabase，请设置环境变量后重试",
    });
    return;
  }

  res.status(500).json({ error: error.message ?? "服务器错误" });
}
