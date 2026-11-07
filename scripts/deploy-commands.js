'use strict';

/**
 * Registers (or updates) slash commands with Discord.
 * Run with:  npm run deploy
 *
 * - If GUILD_ID is set in .env: commands are registered to that server only
 *   and appear instantly (recommended).
 * - If GUILD_ID is empty: commands are registered globally (up to ~1 hour).
 *
 * This replaces the full command list, so commands you deleted from the
 * codebase are removed from Discord too.
 */

const { REST, Routes } = require('discord.js');
const { config, validateConfig } = require('../src/config');
const { loadCommands } = require('../src/handlers/commandHandler');
const { createLogger, setLevel } = require('../src/utils/logger');

setLevel(config.logLevel);
const log = createLogger('deploy');

async function deploy() {
  const problems = validateConfig();
  if (problems.length > 0) {
    for (const problem of problems) log.error(`Config error: ${problem}`);
    process.exit(1);
  }

  const commands = loadCommands();
  const body = [...commands.values()].map((command) => command.data.toJSON());
  if (body.length === 0) {
    log.error('No commands found to deploy.');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(config.token);
  const route = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);

  log.info(`Deploying ${body.length} command(s) ${config.guildId ? `to guild ${config.guildId}` : 'globally'}...`);

  try {
    const result = await rest.put(route, { body });
    log.info(`Successfully deployed ${result.length} command(s): ${result.map((c) => '/' + c.name).join(', ')}`);
  } catch (error) {
    log.error('Deployment failed', error);
    if (error.code === 50001) log.error('Missing Access: invite the bot with the "applications.commands" scope.');
    if (error.status === 401) log.error('Invalid token: check DISCORD_TOKEN in .env.');
    if (error.code === 10002) log.error('Unknown application: check CLIENT_ID in .env.');
    process.exit(1);
  }
}

deploy();
