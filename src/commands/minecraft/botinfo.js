'use strict';

const { SlashCommandBuilder, version: discordJsVersion } = require('discord.js');
const { infoEmbed } = require('../../utils/embeds');
const { formatDuration, formatMB } = require('../../utils/format');
const { config } = require('../../config');
const pkg = require('../../../package.json');

module.exports = {
  data: new SlashCommandBuilder().setName('botinfo').setDescription('Show information about CARTER BOT'),
  category: 'minecraft',
  cooldown: 10,

  async execute(interaction, client) {
    const memory = process.memoryUsage();

    const embed = infoEmbed(`${config.brand.botName} - Information`, `Custom management bot for **${config.minecraft.name}**.`)
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: 'Version', value: pkg.version, inline: true },
        { name: 'Uptime', value: formatDuration(Date.now() - client.startedAt), inline: true },
        { name: 'Servers', value: String(client.guilds.cache.size), inline: true },
        { name: 'Commands', value: String(client.commands.size), inline: true },
        { name: 'Gateway ping', value: client.ws.ping >= 0 ? `${client.ws.ping} ms` : 'n/a', inline: true },
        { name: 'Memory (RSS)', value: formatMB(memory.rss), inline: true },
        { name: 'Node.js', value: process.version, inline: true },
        { name: 'discord.js', value: `v${discordJsVersion}`, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
