'use strict';

const { ActivityType, Events } = require('discord.js');
const { createLogger } = require('../utils/logger');
const { ensureGuildConfig } = require('../database');

const log = createLogger('ready');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    log.info(`Logged in as ${client.user.tag}`);
    log.info(`Connected to ${client.guilds.cache.size} server(s)`);

    // Make sure every server the bot is in has a config row.
    for (const guild of client.guilds.cache.values()) {
      ensureGuildConfig(client.db, guild.id);
    }

    client.user.setPresence({
      activities: [{ name: 'CARTER SMP | /help', type: ActivityType.Playing }],
      status: 'online',
    });

    log.info('CARTER BOT is ready.');
  },
};
