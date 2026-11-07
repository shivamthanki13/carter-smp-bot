'use strict';

/**
 * Slash command loader.
 *
 * Every .js file under src/commands/** must export:
 *   data     - a SlashCommandBuilder (or anything with toJSON() and a name)
 *   execute  - async (interaction, client) => void
 * Optional:
 *   category   - string used by /help (defaults to the folder name)
 *   cooldown   - seconds per user (default 3)
 *   autocomplete - async (interaction, client) => void
 *
 * Add a command by dropping a new file into the right folder - no other
 * registration is needed. Run `npm run deploy` afterwards to register it.
 */

const path = require('node:path');
const { Collection } = require('discord.js');
const { walkJsFiles } = require('../utils/files');
const { createLogger } = require('../utils/logger');

const log = createLogger('commands');
const COMMANDS_DIR = path.join(__dirname, '..', 'commands');

/**
 * Load all command modules.
 * @returns {Collection<string, object>} name -> command module
 */
function loadCommands() {
  const commands = new Collection();

  for (const file of walkJsFiles(COMMANDS_DIR)) {
    const relative = path.relative(COMMANDS_DIR, file);
    let command;
    try {
      command = require(file);
    } catch (error) {
      log.error(`Failed to load command file ${relative}`, error);
      continue;
    }

    if (!command || !command.data || typeof command.data.toJSON !== 'function' || typeof command.execute !== 'function') {
      log.warn(`Skipping ${relative}: must export "data" (builder) and "execute" (function)`);
      continue;
    }

    const name = command.data.name;
    if (commands.has(name)) {
      log.warn(`Skipping ${relative}: duplicate command name "/${name}"`);
      continue;
    }

    // Default the category to the parent folder name (e.g. "utility").
    command.category = command.category || path.basename(path.dirname(file));
    command.cooldown = Number.isFinite(command.cooldown) ? command.cooldown : 3;
    commands.set(name, command);
  }

  log.info(`Loaded ${commands.size} command(s)`);
  return commands;
}

module.exports = { loadCommands };
