'use strict';

/**
 * SQLite database layer (better-sqlite3).
 *
 * - Synchronous API: fast, tiny memory footprint, ideal for low-RAM hosting.
 * - WAL journal mode: safe against crashes, allows reads during writes.
 * - Every query uses bound parameters (never string concatenation).
 */

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const migrations = require('./migrations');
const { createLogger } = require('../utils/logger');

const log = createLogger('database');

// Columns of guild_config that may be changed through setGuildConfig().
// Acts as a whitelist so column names never come from user input.
const CONFIG_COLUMNS = new Set([
  'welcome_channel_id',
  'welcome_message',
  'welcome_image_url',
  'goodbye_channel_id',
  'goodbye_message',
  'log_channel_id',
  'mod_log_channel_id',
  'member_role_id',
  'autorole_ids',
  'ticket_channel_id',
  'ticket_category_id',
  'ticket_log_channel_id',
  'suggestion_channel_id',
  'rules_channel_id',
  'discord_invite_url',
  'socials',
]);

/** Apply any migrations newer than the database's current user_version. */
function runMigrations(db) {
  const current = db.pragma('user_version', { simple: true });
  const pending = migrations.filter((m) => m.version > current).sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    const apply = db.transaction(() => {
      db.exec(migration.sql);
      db.pragma(`user_version = ${Number(migration.version)}`);
    });
    apply();
    log.info(`Applied migration ${migration.version}: ${migration.name}`);
  }
  return db.pragma('user_version', { simple: true });
}

/**
 * Open (and create if needed) the database, then run migrations.
 * @param {string} filePath absolute path, or ':memory:' for tests
 * @returns {import('better-sqlite3').Database}
 */
function openDatabase(filePath) {
  if (filePath !== ':memory:') fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const db = new Database(filePath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  const version = runMigrations(db);
  log.info(`Database ready (schema v${version})`, { file: filePath === ':memory:' ? filePath : path.basename(filePath) });
  return db;
}

/** Fetch a guild's config row, or undefined if the guild has no config yet. */
function getGuildConfig(db, guildId) {
  return db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(guildId);
}

/** Fetch a guild's config, creating a default row first if needed. */
function ensureGuildConfig(db, guildId) {
  const now = Date.now();
  db.prepare('INSERT OR IGNORE INTO guild_config (guild_id, created_at, updated_at) VALUES (?, ?, ?)').run(
    guildId,
    now,
    now,
  );
  return getGuildConfig(db, guildId);
}

/**
 * Update one or more whitelisted config fields for a guild.
 * @param {import('better-sqlite3').Database} db
 * @param {string} guildId
 * @param {Record<string, string|null>} values column -> new value
 */
function setGuildConfig(db, guildId, values) {
  const entries = Object.entries(values);
  if (entries.length === 0) throw new Error('setGuildConfig: no values provided');
  for (const [column] of entries) {
    if (!CONFIG_COLUMNS.has(column)) throw new Error(`setGuildConfig: unknown column "${column}"`);
  }

  ensureGuildConfig(db, guildId);
  // Column names are from the whitelist above; values are bound parameters.
  const assignments = entries.map(([column]) => `${column} = ?`).join(', ');
  db.prepare(`UPDATE guild_config SET ${assignments}, updated_at = ? WHERE guild_id = ?`).run(
    ...entries.map(([, value]) => value),
    Date.now(),
    guildId,
  );
  return getGuildConfig(db, guildId);
}

/** Close the database cleanly (flushes WAL). Safe to call twice. */
function closeDatabase(db) {
  if (db && db.open) {
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (error) {
      log.warn('WAL checkpoint failed during shutdown', error);
    }
    db.close();
    log.info('Database closed');
  }
}

module.exports = {
  openDatabase,
  closeDatabase,
  getGuildConfig,
  ensureGuildConfig,
  setGuildConfig,
  CONFIG_COLUMNS,
};
