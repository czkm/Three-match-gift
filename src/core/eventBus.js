/**
 * Central event bus — array-spread semantics.
 *
 *   trigger(event, [a, b, c])   →  handlers are called as cb(a, b, c)
 *   bind(event, handler)
 *   unbind(event, handler?)     →  drop one handler, or all of them
 *
 * Important: `mitt` only carries a single payload, which is incompatible
 * with the gridland-style `trigger('draw', ['board.fill', tileString])`
 * pattern (where the array is meant to be spread). So we keep our own
 * registry and spread on dispatch, mirroring gridland-vue's eventBus.
 */
const listeners = new Map();   // event → Set<handler>

function ensureSet(event) {
  let s = listeners.get(event);
  if (!s) listeners.set(event, (s = new Set()));
  return s;
}

const EventBus = {
  bind(event, handler)   { ensureSet(event).add(handler); },
  on(event, handler)     { this.bind(event, handler); },

  unbind(event, handler) {
    if (handler) listeners.get(event)?.delete(handler);
    else         listeners.delete(event);
  },

  trigger(event, params) {
    const set = listeners.get(event);
    if (!set || set.size === 0) return;
    const args = Array.isArray(params) ? params : (params == null ? [] : [params]);
    for (const cb of [...set]) {
      try { cb(...args); }
      catch (e) { console.error(`[EventBus] handler for "${event}" threw:`, e); }
    }
  },

  _clear() { listeners.clear(); }
};

export default EventBus;
