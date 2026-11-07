'use strict';

/**
 * Centralised interaction error handling.
 * Users get a short, friendly message; full details go to the log only.
 */

const { MessageFlags } = require('discord.js');
const { errorEmbed } = require('./embeds');
const { createLogger } = require('./logger');

const log = createLogger('errors');

// Discord API error codes worth explaining in plain language.
const DISCORD_ERROR_HINTS = {
  50001: "I don't have access to that channel or resource.",
  50013: "I'm missing the permissions needed to do that.",
  10003: 'That channel no longer exists.',
  10008: 'That message no longer exists.',
  10062: 'That interaction expired. Please run the command again.',
  40060: 'That interaction was already handled.',
};

/** Turn any thrown value into a short user-safe message. */
function describeError(error) {
  if (error && typeof error.code === 'number' && DISCORD_ERROR_HINTS[error.code]) {
    return DISCORD_ERROR_HINTS[error.code];
  }
  return 'An unexpected error occurred. The staff team can check the bot logs for details.';
}

/**
 * Reply (or follow up) to an interaction with an ephemeral error embed.
 * Never throws - if replying fails, it is only logged.
 */
async function replyWithError(interaction, error, commandName = 'unknown') {
  log.error(`Error in "${commandName}"`, error);
  const payload = { embeds: [errorEmbed(describeError(error))], flags: MessageFlags.Ephemeral };
  try {
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
    else await interaction.reply(payload);
  } catch (replyError) {
    log.warn(`Could not deliver error message for "${commandName}"`, replyError);
  }
}

module.exports = { replyWithError, describeError };
