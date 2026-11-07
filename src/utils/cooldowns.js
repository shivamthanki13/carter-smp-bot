'use strict';

/**
 * Per-user, per-command cooldown tracker.
 * Memory-safe: expired entries are removed on lookup and by a periodic sweep.
 */

const store = new Map(); // key "command:userId" -> expiry timestamp (ms)
let sweeper = null;

/**
 * Check and (if allowed) start a cooldown.
 * @param {string} commandName
 * @param {string} userId
 * @param {number} seconds cooldown length; 0 disables the cooldown
 * @returns {number} seconds remaining (0 = allowed to run now)
 */
function checkCooldown(commandName, userId, seconds, now = Date.now()) {
  if (!seconds || seconds <= 0) return 0;
  const key = `${commandName}:${userId}`;
  const expires = store.get(key);
  if (expires && expires > now) return Math.ceil((expires - now) / 1000);
  store.set(key, now + seconds * 1000);
  return 0;
}

/** Remove expired entries. */
function sweep(now = Date.now()) {
  for (const [key, expires] of store) {
    if (expires <= now) store.delete(key);
  }
}

/** Start the background sweep (every 5 minutes). Does not keep the process alive. */
function startSweeper() {
  if (sweeper) return;
  sweeper = setInterval(() => sweep(), 5 * 60 * 1000);
  sweeper.unref();
}

function stopSweeper() {
  if (sweeper) clearInterval(sweeper);
  sweeper = null;
}

/** Test helper. */
function _size() {
  return store.size;
}

module.exports = { checkCooldown, sweep, startSweeper, stopSweeper, _size };
