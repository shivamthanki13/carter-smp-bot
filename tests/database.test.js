'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase, closeDatabase, getGuildConfig, ensureGuildConfig, setGuildConfig } = require('../src/database');

test('migrations create the guild_config table and set schema version', () => {
  const db = openDatabase(':memory:');
  assert.ok(db.pragma('user_version', { simple: true }) >= 1);
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='guild_config'").get();
  assert.equal(table.name, 'guild_config');
  closeDatabase(db);
});

test('ensureGuildConfig creates a default row once', () => {
  const db = openDatabase(':memory:');
  assert.equal(getGuildConfig(db, '123'), undefined);
  const first = ensureGuildConfig(db, '123');
  const second = ensureGuildConfig(db, '123');
  assert.equal(first.guild_id, '123');
  assert.equal(first.autorole_ids, '[]');
  assert.equal(second.created_at, first.created_at);
  closeDatabase(db);
});

test('setGuildConfig updates whitelisted columns', () => {
  const db = openDatabase(':memory:');
  const row = setGuildConfig(db, '123', { welcome_channel_id: '999', welcome_message: 'Hi!' });
  assert.equal(row.welcome_channel_id, '999');
  assert.equal(row.welcome_message, 'Hi!');
  closeDatabase(db);
});

test('setGuildConfig rejects unknown columns (SQL injection guard)', () => {
  const db = openDatabase(':memory:');
  assert.throws(() => setGuildConfig(db, '123', { 'guild_id = guild_id; DROP TABLE guild_config; --': 'x' }), /unknown column/);
  assert.throws(() => setGuildConfig(db, '123', {}), /no values/);
  assert.ok(getGuildConfig(db, '123') === undefined || getGuildConfig(db, '123').guild_id === '123');
  closeDatabase(db);
});

test('values are stored as data, not executed as SQL', () => {
  const db = openDatabase(':memory:');
  const evil = "'; DROP TABLE guild_config; --";
  setGuildConfig(db, '123', { welcome_message: evil });
  assert.equal(getGuildConfig(db, '123').welcome_message, evil);
  closeDatabase(db);
});
