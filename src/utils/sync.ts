// utils/sync.ts

/**
 * Convert Firebase server timestamp to a local offset.
 * (Firebase’s .info/serverTimeOffset already provides this.)
 * This utility is used to compute the synchronised time.
 */
export function getSyncedTime(serverTimeOffset: number): number {
  return Date.now() + serverTimeOffset;
}

/**
 * Calculate the exact AudioContext time at which to start playback,
 * given a host-issued playback timestamp (in synced time) and a
 * desired playout delay (ms).
 */
export function getPlaybackStartTime(
  hostTimestamp: number,   // synced time
  delayMs: number,
  serverTimeOffset: number
): number {
  const now = getSyncedTime(serverTimeOffset);
  const target = hostTimestamp + delayMs;
  return Math.max(now, target); // ensure we don't start in the past
}
