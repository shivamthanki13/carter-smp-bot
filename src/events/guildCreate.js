'use strict';

const { Events } = require('discord.js');
const { createLogger } = require('../utils/logger');
const { ensureGuildConfig } = require('../database');

const log = createLogger('guildCreate');

module.exports = {
  name: Events.GuildCreate,

  /** Runs when the bot is added to a new server: create its default config row. */
  async execute(guild, client) {
    ensureGuildConfig(client.db, guild.id);
    log.info(`Joined server "${guild.name}" (${guild.id})`);
  },
};
