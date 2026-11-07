'use strict';

/**
 * Ordered database migrations.
 * Each migration runs once inside a transaction; the applied version is stored
 * in SQLite's built-in PRAGMA user_version. NEVER edit an already-released
 * migration - add a new one at the end of the list instead.
 */
module.exports = [
  {
    version: 1,
    name: 'guild_config',
    sql: `
      -- Per-server configuration. One row per Discord server (guild).
      -- Channel/role IDs are stored as TEXT (Discord snowflakes exceed JS safe integers)
      -- and are NEVER hardcoded: they are set by admin commands in later phases.
      CREATE TABLE guild_config (
        guild_id            TEXT PRIMARY KEY,
        welcome_channel_id  TEXT,
        welcome_message     TEXT,
        welcome_image_url   TEXT,
        goodbye_channel_id  TEXT,
        goodbye_message     TEXT,
        log_channel_id      TEXT,
        mod_log_channel_id  TEXT,
        member_role_id      TEXT,
        autorole_ids        TEXT NOT NULL DEFAULT '[]',
        ticket_channel_id   TEXT,
        ticket_category_id  TEXT,
        ticket_log_channel_id TEXT,
        suggestion_channel_id TEXT,
        rules_channel_id    TEXT,
        discord_invite_url  TEXT,
        socials             TEXT NOT NULL DEFAULT '{}',
        created_at          INTEGER NOT NULL,
        updated_at          INTEGER NOT NULL
      );
    `,
  },
];
