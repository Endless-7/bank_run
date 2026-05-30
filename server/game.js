export const INITIAL_BALANCE = 100;
export const WITHDRAW_AMOUNT = 10;
export const EXPLOSION_CLICK_THRESHOLD = 40;
export const VISITOR_THRESHOLD = Number(process.env.VISITOR_THRESHOLD) || 8;
export const RESULTS_DURATION_MS = 10_000;

export class Game {
  constructor() {
    this.roundTimer = null;
    this.players = new Map();
    this.serverStartedAt = Date.now();
    this.resetRound(1);
  }

  resetRound(roundId) {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }

    this.roundId = roundId;
    this.phase = "playing";
    this.totalClicks = 0;
    this.exploded = false;
    this.endReason = null;
    this.visitors = new Set();
    this.results = null;

    for (const player of this.players.values()) {
      player.balance = INITIAL_BALANCE;
      player.totalWithdrawn = 0;
      player.clicks = 0;
    }
  }

  startNewRound() {
    this.resetRound(this.roundId + 1);
  }

  join(playerId) {
    if (!playerId) {
      playerId = crypto.randomUUID();
    }

    if (!this.players.has(playerId)) {
      this.players.set(playerId, {
        balance: INITIAL_BALANCE,
        totalWithdrawn: 0,
        clicks: 0,
      });
    }

    if (this.phase === "playing") {
      this.visitors.add(playerId);
      this.checkPeacefulEnd();
    }

    return playerId;
  }

  withdraw(playerId) {
    if (this.phase !== "playing") {
      return { error: "本轮已结束" };
    }

    const player = this.players.get(playerId);
    if (!player) {
      return { error: "玩家不存在" };
    }

    if (player.balance < WITHDRAW_AMOUNT) {
      return { error: "余额不足，无法提现 $10" };
    }

    player.balance -= WITHDRAW_AMOUNT;
    player.totalWithdrawn += WITHDRAW_AMOUNT;
    player.clicks += 1;
    this.totalClicks += 1;

    if (this.totalClicks > EXPLOSION_CLICK_THRESHOLD) {
      this.exploded = true;
      this.endRound("explosion");
    }

    return { ok: true };
  }

  checkPeacefulEnd() {
    if (this.phase !== "playing") return;
    if (
      this.visitors.size >= VISITOR_THRESHOLD &&
      this.totalClicks <= EXPLOSION_CLICK_THRESHOLD
    ) {
      this.endRound("peaceful");
    }
  }

  endRound(reason) {
    if (this.phase === "results") return;

    this.phase = "results";
    this.endReason = reason;

    const outcomes = [];
    for (const [id, player] of this.players.entries()) {
      const survived =
        reason === "explosion"
          ? player.balance === 0
          : player.totalWithdrawn === 0;

      outcomes.push({
        playerId: id,
        balance: player.balance,
        totalWithdrawn: player.totalWithdrawn,
        survived,
      });
    }

    this.results = {
      reason,
      exploded: this.exploded,
      totalClicks: this.totalClicks,
      visitorCount: this.visitors.size,
      outcomes,
    };

    this.roundTimer = setTimeout(() => {
      this.startNewRound();
    }, RESULTS_DURATION_MS);
  }

  getPlayerOutcome(playerId) {
    return this.results?.outcomes.find((o) => o.playerId === playerId) ?? null;
  }

  serialize(playerId) {
    const player = playerId ? this.players?.get(playerId) : null;
    const outcome = playerId ? this.getPlayerOutcome(playerId) : null;

    return {
      roundId: this.roundId,
      phase: this.phase,
      totalClicks: this.totalClicks,
      visitorCount: this.visitors.size,
      exploded: this.exploded,
      endReason: this.endReason,
      serverStartedAt: this.serverStartedAt,
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
      results: this.results,
    };
  }
}
