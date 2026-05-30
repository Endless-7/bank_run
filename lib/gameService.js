import {
  createInitialState,
  joinPlayer,
  maybeAdvanceRound,
  serializeState,
  withdrawFromBank,
} from "./gameEngine.js";
import { getSupabaseAdmin } from "./supabaseAdmin.js";

const MAX_RETRIES = 5;

async function loadRawGameRow(supabase) {
  const { data, error } = await supabase
    .from("global_game")
    .select("state, version")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    const initialState = createInitialState();
    const { data: inserted, error: insertError } = await supabase
      .from("global_game")
      .insert({ id: 1, state: initialState, version: 0 })
      .select("state, version")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return inserted;
  }

  return data;
}

async function saveRawGameRow(supabase, expectedVersion, nextState) {
  const { data, error } = await supabase
    .from("global_game")
    .update({
      state: nextState,
      version: expectedVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .eq("version", expectedVersion)
    .select("state, version")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function withGameState(mutator) {
  const supabase = getSupabaseAdmin();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const row = await loadRawGameRow(supabase);
    const state = maybeAdvanceRound(row.state);
    const result = mutator(state);

    if (result.error) {
      return result;
    }

    const nextState = result.state ?? state;
    const saved = await saveRawGameRow(supabase, row.version, nextState);

    if (saved) {
      return {
        state: saved.state,
        playerId: result.playerId,
      };
    }
  }

  throw new Error("游戏状态更新冲突，请重试");
}

export async function joinGame(playerId) {
  const result = await withGameState((state) => joinPlayer(state, playerId));

  if (result.error) {
    return result;
  }

  return {
    playerId: result.playerId,
    ...serializeState(result.state, result.playerId),
  };
}

export async function withdraw(playerId) {
  if (!playerId) {
    return { error: "缺少 playerId" };
  }

  const result = await withGameState((state) => {
    const joined = joinPlayer(state, playerId);
    const withdrawn = withdrawFromBank(joined.state, joined.playerId);
    if (withdrawn.error) {
      return withdrawn;
    }
    return { state: withdrawn.state, playerId: joined.playerId };
  });

  if (result.error) {
    return result;
  }

  return {
    playerId: result.playerId,
    ...serializeState(result.state, result.playerId),
  };
}

export async function getGameState(playerId) {
  if (playerId) {
    return joinGame(playerId);
  }

  const result = await withGameState((state) => ({ state }));
  return serializeState(result.state, null);
}

export async function getHealth() {
  const supabase = getSupabaseAdmin();
  const row = await loadRawGameRow(supabase);
  const state = maybeAdvanceRound(row.state);

  return {
    ok: true,
    serverStartedAt: state.serverStartedAt,
    roundId: state.roundId,
    phase: state.phase,
  };
}
