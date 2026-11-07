'use strict';

const { EmbedBuilder } = require('discord.js');
const { config } = require('../config');

/** Base embed with consistent CARTER BOT branding. */
function baseEmbed() {
  return new EmbedBuilder().setColor(config.brand.color).setFooter({ text: config.brand.botName }).setTimestamp();
}

function infoEmbed(title, description) {
  const embed = baseEmbed().setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

function errorEmbed(description, title = 'Something went wrong') {
  return baseEmbed().setColor(config.brand.errorColor).setTitle(title).setDescription(description);
}

module.exports = { baseEmbed, infoEmbed, errorEmbed };
