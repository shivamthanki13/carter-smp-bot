'use strict';

/**
 * CARTER BOT - entry point.
 * Start with:  npm start   (or: node src/index.js)
 */

const { Client, GatewayIntentBits, Partials, Options } = require('discord.js');
const { config, validateConfig } = require('./config');
const { createLogger, setLevel } = require('./utils/logger');
const { openDatabase, closeDatabase } = require('./database');
const { loadCommands } = require('./handlers/commandHandler');
const { registerEvents } = require('./handlers/eventHandler');
const { startSweeper, stopSweeper } = require('./utils/cooldowns');

setLevel(config.logLevel);
const log = createLogger('main');

async function main() {
  log.info(`Starting ${config.brand.botName}...`);

  // 1. Validate configuration before touching anything else.
  const problems = validateConfig();
  if (problems.length > 0) {
    for (const problem of problems) log.error(`Config error: ${problem}`);
    log.error('Copy .env.example to .env and fill in the missing values. See README.md.');
    process.exit(1);
  }

  // 2. Database.
  const db = openDatabase(config.databasePath);

  // 3. Discord client.
  // Phase 1 needs only the Guilds intent (no privileged intents).
  // Later phases will add GuildMembers, GuildMessages and MessageContent.
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Message, Partials.Channel],
    // Keep the cache small for 512 MB hosting.
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 50,
      PresenceManager: 0,
      ReactionManager: 0,
      GuildScheduledEventManager: 0,
      ThreadManager: 25,
    }),
    sweepers: {
      ...Options.DefaultSweeperSettings,
      messages: { interval: 3600, lifetime: 1800 },
    },
  });

  client.db = db;
  client.startedAt = Date.now();
  client.commands = loadCommands();
  registerEvents(client);
  startSweeper();

  // 4. Log connection-level problems (discord.js reconnects automatically).
  client.on('error', (error) => log.error('Discord client error', error));
  client.on('warn', (message) => log.warn(message));
  client.on('shardDisconnect', (event, id) => log.warn(`Shard ${id} disconnected (code ${event.code})`));
  client.on('shardReconnecting', (id) => log.info(`Shard ${id} reconnecting...`));
  client.on('shardResume', (id) => log.info(`Shard ${id} resumed`));

  // 5. Graceful shutdown (Ctrl+C, hosting restarts, `kill`).
  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info(`${signal} received - shutting down gracefully...`);
    try {
      stopSweeper();
      await client.destroy();
      closeDatabase(db);
    } catch (error) {
      log.error('Error during shutdown', error);
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // 6. Last-resort safety nets. Log and keep running for stray promise
  //    rejections; exit (so the process manager restarts us) on truly fatal errors.
  process.on('unhandledRejection', (reason) => log.error('Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason))));
  process.on('uncaughtException', (error) => {
    log.error('Uncaught exception - exiting so the process manager can restart the bot', error);
    try {
      closeDatabase(db);
    } finally {
      process.exit(1);
    }
  });

  // 7. Connect.
  await client.login(config.token);
}

main().catch((error) => {
  log.error('Fatal startup error', error);
  process.exit(1);
});
