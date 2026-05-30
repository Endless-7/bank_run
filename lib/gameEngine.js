import {
  EXPLOSION_CLICK_THRESHOLD,
  INITIAL_BALANCE,
  RESULTS_DURATION_MS,
  VISITOR_THRESHOLD,
  WITHDRAW_AMOUNT,
} from "./constants.js";

export function createInitialState() {
  return {
    roundId: 1,
    phase: "playing",
    totalClicks: 0,
    exploded: false,
    endReason: null,
    results: null,
    resultsEndsAt: null,
    serverStartedAt: Date.now(),
    players: {},
    visitors: [],
  };
}

export function maybeAdvanceRound(state) {
  if (
    state.phase !== "results" ||
    !state.resultsEndsAt ||
    Date.now() < state.resultsEndsAt
  ) {
    return state;
  }

  return {
    ...createInitialState(),
    roundId: state.roundId + 1,
    serverStartedAt: Date.now(),
  };
}

export function joinPlayer(state, playerId) {
  const next = structuredClone(state);

  if (!playerId) {
    playerId = crypto.randomUUID();
  }

  if (!next.players[playerId]) {
    next.players[playerId] = {
      balance: INITIAL_BALANCE,
      totalWithdrawn: 0,
      clicks: 0,
    };
  }

  if (next.phase === "playing" && !next.visitors.includes(playerId)) {
    next.visitors.push(playerId);
    endRoundIfPeaceful(next);
  }

  return { state: next, playerId };
}

export function withdrawFromBank(state, playerId) {
  const next = structuredClone(state);

  if (next.phase !== "playing") {
    return { error: "本轮已结束" };
  }

  const player = next.players[playerId];
  if (!player) {
    return { error: "玩家不存在" };
  }

  if (player.balance < WITHDRAW_AMOUNT) {
    return { error: "余额不足，无法提现 $10" };
  }

  player.balance -= WITHDRAW_AMOUNT;
  player.totalWithdrawn += WITHDRAW_AMOUNT;
  player.clicks += 1;
  next.totalClicks += 1;

  if (next.totalClicks > EXPLOSION_CLICK_THRESHOLD) {
    next.exploded = true;
    endRound(next, "explosion");
  }

  return { state: next };
}

function endRoundIfPeaceful(state) {
  if (state.phase !== "playing") return;

  if (
    state.visitors.length >= VISITOR_THRESHOLD &&
    state.totalClicks <= EXPLOSION_CLICK_THRESHOLD
  ) {
    endRound(state, "peaceful");
  }
}

function endRound(state, reason) {
  if (state.phase === "results") return;

  state.phase = "results";
  state.endReason = reason;

  const outcomes = Object.entries(state.players).map(([id, player]) => ({
    playerId: id,
    balance: player.balance,
    totalWithdrawn: player.totalWithdrawn,
    survived:
      reason === "explosion"
        ? player.balance === 0
        : player.totalWithdrawn === 0,
  }));

  state.results = {
    reason,
    exploded: state.exploded,
    totalClicks: state.totalClicks,
    visitorCount: state.visitors.length,
    outcomes,
  };
  state.resultsEndsAt = Date.now() + RESULTS_DURATION_MS;
}

export function getPlayerOutcome(state, playerId) {
  return (
    state.results?.outcomes.find((entry) => entry.playerId === playerId) ??
    null
  );
}

export function serializeState(state, playerId) {
  const player = playerId ? state.players[playerId] : null;
  const outcome = playerId ? getPlayerOutcome(state, playerId) : null;

  return {
    roundId: state.roundId,
    phase: state.phase,
    totalClicks: state.totalClicks,
    visitorCount: state.visitors.length,
    exploded: state.exploded,
    endReason: state.endReason,
    serverStartedAt: state.serverStartedAt,
    resultsDurationMs: RESULTS_DURATION_MS,
    thresholds: {
      clicks: EXPLOSION_CLICK_THRESHOLD,
      visitors: VISITOR_THRESHOLD,
      withdraw: WITHDRAW_AMOUNT,
      initialBalance: INITIAL_BALANCE,
    },
    player: player
      ? {
          balance: player.balance,
          totalWithdrawn: player.totalWithdrawn,
          clicks: player.clicks,
        }
      : null,
    outcome: outcome
      ? {
          survived: outcome.survived,
          balance: outcome.balance,
          totalWithdrawn: outcome.totalWithdrawn,
        }
      : null,
    results: state.results,
  };
}
