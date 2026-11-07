'use strict';

/**
 * Central configuration.
 * Secrets are read ONLY from environment variables (.env) and are never logged.
 */

const path = require('node:path');
const dotenv = require('dotenv');

// Load .env from the project root (works no matter where `node` is launched from).
const ROOT_DIR = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(ROOT_DIR, '.env'), quiet: true });

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'];

function readString(name, fallback = '') {
  const value = process.env[name];
  return value === undefined || value.trim() === '' ? fallback : value.trim();
}

function readInt(name, fallback) {
  const parsed = Number.parseInt(readString(name), 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

const logLevel = readString('LOG_LEVEL', 'info').toLowerCase();

const config = {
  rootDir: ROOT_DIR,

  // --- Secrets / Discord application ---
  token: readString('DISCORD_TOKEN'),
  clientId: readString('CLIENT_ID'),
  guildId: readString('GUILD_ID'), // optional

  // --- Storage / logging ---
  databasePath: path.resolve(ROOT_DIR, readString('DATABASE_PATH', './data/carter-bot.sqlite')),
  logLevel: LOG_LEVELS.includes(logLevel) ? logLevel : 'info',

  // --- Branding ---
  brand: {
    botName: 'CARTER BOT',
    color: 0x2ecc71, // green embed colour
    errorColor: 0xe74c3c,
  },

  // --- Minecraft server details (used by info commands in later phases) ---
  minecraft: {
    name: readString('MC_SERVER_NAME', 'CARTER SMP'),
    javaIp: readString('MC_JAVA_IP', 'cartersmp.mcsh.gg'),
    bedrockIp: readString('MC_BEDROCK_IP', 'cartersmp.mcsh.gg'),
    bedrockPort: readInt('MC_BEDROCK_PORT', 19132),
    type: 'Normal Survival SMP',
    crossplay: 'Java + Bedrock',
  },
};

/**
 * Verify the variables needed to run. Returns a list of problems (empty = OK).
 * @param {{ needGuild?: boolean }} [options]
 */
function validateConfig(options = {}) {
  const problems = [];
  if (!config.token) problems.push('DISCORD_TOKEN is missing in .env');
  if (!config.clientId) problems.push('CLIENT_ID is missing in .env');
  else if (!/^\d{17,20}$/.test(config.clientId)) problems.push('CLIENT_ID must be a numeric Discord ID');
  if (config.guildId && !/^\d{17,20}$/.test(config.guildId)) {
    problems.push('GUILD_ID must be a numeric Discord ID (or left empty)');
  }
  if (options.needGuild && !config.guildId) {
    problems.push('GUILD_ID is required for this operation');
  }
  return problems;
}

module.exports = { config, validateConfig };
