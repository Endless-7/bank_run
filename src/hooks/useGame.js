import { useCallback, useEffect, useRef, useState } from "react";
import { fetchGameState, joinGame, withdraw as withdrawApi } from "../api";

const PLAYER_ID_KEY = "bank-run-player-id";

function getStoredPlayerId() {
  return localStorage.getItem(PLAYER_ID_KEY);
}

function storePlayerId(playerId) {
  localStorage.setItem(PLAYER_ID_KEY, playerId);
}

export function useGame() {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const playerIdRef = useRef(getStoredPlayerId());

  const syncState = useCallback(async () => {
    const playerId = playerIdRef.current;
    if (!playerId) return;

    try {
      const state = await fetchGameState(playerId);
      setGameState(state);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const data = await joinGame(playerIdRef.current);
        if (cancelled) return;

        playerIdRef.current = data.playerId;
        storePlayerId(data.playerId);
        setGameState(data);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!playerIdRef.current) return undefined;

    const intervalId = setInterval(syncState, 2000);
    return () => clearInterval(intervalId);
  }, [syncState]);

  const withdraw = useCallback(async () => {
    const playerId = playerIdRef.current;
    if (!playerId) return;

    try {
      const state = await withdrawApi(playerId);
      setGameState(state);
      setError(null);
      return state;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    gameState,
    error,
    loading,
    withdraw,
    playerId: playerIdRef.current,
  };
}
