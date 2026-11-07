'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatDuration, formatMB } = require('../src/utils/format');
const { checkCooldown, sweep, _size } = require('../src/utils/cooldowns');
const { scrub } = require('../src/utils/logger');

test('formatDuration formats seconds, minutes, hours and days', () => {
  assert.equal(formatDuration(5000), '5s');
  assert.equal(formatDuration(65000), '1m 5s');
  assert.equal(formatDuration(3661000), '1h 1m 1s');
  assert.equal(formatDuration(90061000), '1d 1h 1m 1s');
  assert.equal(formatDuration(-10), '0s');
});

test('formatMB formats bytes', () => {
  assert.equal(formatMB(1048576), '1.0 MB');
});

test('cooldown blocks repeat use and allows after expiry', () => {
  const t0 = 1_000_000;
  assert.equal(checkCooldown('test', 'u1', 5, t0), 0);
  assert.equal(checkCooldown('test', 'u1', 5, t0 + 2000), 3);
  assert.equal(checkCooldown('test', 'u2', 5, t0 + 2000), 0); // different user
  assert.equal(checkCooldown('test', 'u1', 5, t0 + 5001), 0); // expired
});

test('cooldown of 0 never blocks and sweep removes expired entries', () => {
  assert.equal(checkCooldown('free', 'u1', 0), 0);
  checkCooldown('sweepme', 'u9', 1, 1000);
  const before = _size();
  sweep(10_000_000);
  assert.ok(_size() < before);
});

test('logger scrubs token-shaped strings', () => {
  const fake = 'A'.repeat(24) + '.' + 'B'.repeat(6) + '.' + 'C'.repeat(30);
  assert.equal(scrub(`login with ${fake} failed`), 'login with [REDACTED] failed');
});
