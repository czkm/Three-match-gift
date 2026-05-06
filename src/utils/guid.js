/**
 * Tiny GUID helper for tile keys / effects.
 */
let counter = 0;
export function makeGuid() {
  counter = (counter + 1) | 0;
  return `g${Date.now().toString(36)}-${counter.toString(36)}`;
}
