/**
 * Universal timing constants — single source of truth.
 * Mirrors gridland-vue/src/utils/timing.js so the match-3 cascade keeps
 * the same gentle "feel" but with slightly slower easing for the
 * Corvo Bianco mood.
 */
export const TIMING = Object.freeze({
  TILE_TRANSFORM_MS: 220,
  TILE_FALL_MS: 260,

  // Drag detection — same 30px threshold as the original Gridland.
  DRAG_THRESHOLD_PX: 30,

  // Match-3 cascade
  FILL_DELAY_MS: 90,
  SWAP_RETURN_MS: 220,
  CLEAR_RETURN_MS: 300,
  MATCH_RETURN_MS: 420,
  MATCH_SHIFT_DELAY_MS: 200,
  MATCH_DROP_DELAY_MS: 320,

  // Day & narrative
  DAY_NOTIFIER_HOLD_MS: 2400,
  TYPEWRITER_CHAR_MS: 38,

  // Repair sequence
  REPAIR_BREEZE_MS: 800,
  REPAIR_GLOW_MS: 1500,
  REPAIR_RAVEN_MS: 500,

  // Ending
  PORTAL_MS: 2400
});
