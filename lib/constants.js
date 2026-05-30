export const INITIAL_BALANCE = 100;
export const WITHDRAW_AMOUNT = 10;
export const EXPLOSION_CLICK_THRESHOLD = Number(
  process.env.EXPLOSION_CLICK_THRESHOLD,
) || 40;
export const VISITOR_THRESHOLD =
  Number(process.env.VISITOR_THRESHOLD) || 8;
export const RESULTS_DURATION_MS = 10_000;
