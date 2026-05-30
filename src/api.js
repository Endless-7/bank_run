async function parseResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "请求失败");
  }
  return data;
}

export async function joinGame(playerId) {
  const response = await fetch("/api/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });
  return parseResponse(response);
}

export async function fetchGameState(playerId) {
  const response = await fetch(
    `/api/state?playerId=${encodeURIComponent(playerId)}`,
  );
  return parseResponse(response);
}

export async function withdraw(playerId) {
  const response = await fetch("/api/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });
  return parseResponse(response);
}
