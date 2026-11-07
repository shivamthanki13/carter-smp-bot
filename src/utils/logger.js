'use strict';

/**
 * Minimal structured console logger (no dependencies).
 * Output: 2026-01-01T12:00:00.000Z [INFO ] [scope] message {"meta":"value"}
 *
 * Redaction: any metadata key that looks like a secret is masked, and any
 * string that looks like a Discord bot token is scrubbed from messages.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const SENSITIVE_KEY = /token|secret|password|authorization|apikey|api_key/i;
// Discord bot tokens look like: <base64 id>.<6 chars>.<27+ chars>
const TOKEN_PATTERN = /[A-Za-z0-9_-]{23,28}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}/g;

let currentLevel = LEVELS.info;

function setLevel(level) {
  if (LEVELS[level] !== undefined) currentLevel = LEVELS[level];
}

function scrub(text) {
  return String(text).replace(TOKEN_PATTERN, '[REDACTED]');
}

function redactMeta(meta) {
  if (!meta || typeof meta !== 'object') return meta;
  const out = Array.isArray(meta) ? [] : {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEY.test(key)) out[key] = '[REDACTED]';
    else if (value instanceof Error) out[key] = scrub(value.stack || value.message);
    else if (value && typeof value === 'object') out[key] = redactMeta(value);
    else if (typeof value === 'string') out[key] = scrub(value);
    else out[key] = value;
  }
  return out;
}

function write(level, scope, message, meta) {
  if (LEVELS[level] < currentLevel) return;
  const time = new Date().toISOString();
  const tag = level.toUpperCase().padEnd(5);
  let line = `${time} [${tag}] [${scope}] ${scrub(message)}`;
  if (meta !== undefined) {
    let payload;
    if (meta instanceof Error) payload = scrub(meta.stack || meta.message);
    else {
      try {
        payload = JSON.stringify(redactMeta(meta));
      } catch {
        payload = '[unserialisable metadata]';
      }
    }
    line += ` ${payload}`;
  }
  const stream = level === 'error' || level === 'warn' ? console.error : console.log;
  stream(line);
}

/** Create a logger bound to a scope name, e.g. createLogger('database'). */
function createLogger(scope) {
  return {
    debug: (msg, meta) => write('debug', scope, msg, meta),
    info: (msg, meta) => write('info', scope, msg, meta),
    warn: (msg, meta) => write('warn', scope, msg, meta),
    error: (msg, meta) => write('error', scope, msg, meta),
  };
}

module.exports = { createLogger, setLevel, scrub };
