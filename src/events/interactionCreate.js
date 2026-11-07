'use strict';

const { Events, MessageFlags } = require('discord.js');
const { checkCooldown } = require('../utils/cooldowns');
const { replyWithError } = require('../utils/errors');
const { errorEmbed } = require('../utils/embeds');
const { createLogger } = require('../utils/logger');

const log = createLogger('interaction');

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
    // Autocomplete requests (used by later phases).
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command && typeof command.autocomplete === 'function') {
        try {
          await command.autocomplete(interaction, client);
        } catch (error) {
          log.warn(`Autocomplete failed for /${interaction.commandName}`, error);
        }
      }
      return;
    }

    // Phase 1 only handles slash commands. Buttons, select menus and modals
    // (tickets, role menus, suggestions) are routed here in later phases.
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      log.warn(`Received unknown command /${interaction.commandName}`);
      await interaction.reply({
        embeds: [errorEmbed('That command is not available. It may have been removed.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Per-user cooldown.
    const remaining = checkCooldown(command.data.name, interaction.user.id, command.cooldown);
    if (remaining > 0) {
      await interaction.reply({
        embeds: [errorEmbed(`Please wait **${remaining}s** before using \`/${command.data.name}\` again.`, 'Slow down')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      log.debug(`/${command.data.name} by ${interaction.user.id} in ${interaction.guildId ?? 'DM'}`);
      await command.execute(interaction, client);
    } catch (error) {
      await replyWithError(interaction, error, command.data.name);
    }
  },
};
