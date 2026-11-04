/**
 * Replay timing shared by the demo charts and the showcases that align with
 * them. Kept free of the chart engine import so the showcases can read it
 * without pulling the engine into the homepage's initial JS.
 */
export const REPLAY_SEED_RATIO = 0.58;

/** How many bars are on screen before a replay starts streaming the rest. */
export function replaySeedCount(count: number): number {
  return Math.max(4, Math.round(count * REPLAY_SEED_RATIO));
}
