'use strict';

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { infoEmbed } = require('../../utils/embeds');

// Friendly names for command folders, in display order.
const CATEGORY_LABELS = {
  minecraft: 'CARTER SMP',
  utility: 'Utility',
  moderation: 'Moderation',
  tickets: 'Support',
  admin: 'Admin',
};

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show all CARTER BOT commands'),
  category: 'utility',
  cooldown: 5,

  async execute(interaction, client) {
    // Built dynamically from the loaded commands, so /help never goes out of date.
    const groups = new Map();
    for (const command of client.commands.values()) {
      const key = command.category;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(command);
    }

    const embed = infoEmbed('CARTER BOT - Help', 'Here is everything I can do right now. Commands appear as more features are added.');

    const orderedKeys = [
      ...Object.keys(CATEGORY_LABELS).filter((key) => groups.has(key)),
      ...[...groups.keys()].filter((key) => !(key in CATEGORY_LABELS)).sort(),
    ];

    for (const key of orderedKeys) {
      const lines = groups
        .get(key)
        .sort((a, b) => a.data.name.localeCompare(b.data.name))
        .map((command) => `**/${command.data.name}** - ${command.data.description}`);
      embed.addFields({ name: CATEGORY_LABELS[key] ?? key, value: lines.join('\n').slice(0, 1024) });
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
