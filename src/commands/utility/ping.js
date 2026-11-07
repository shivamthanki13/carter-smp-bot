'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription("Check CARTER BOT's latency"),
  category: 'utility',
  cooldown: 5,

  async execute(interaction, client) {
    // Round-trip time: how long Discord takes to deliver our first reply.
    const sent = await interaction.reply({
      embeds: [infoEmbed('Pinging...')],
      withResponse: true,
    });
    const roundTrip = sent.resource.message.createdTimestamp - interaction.createdTimestamp;
    const gateway = client.ws.ping;

    await interaction.editReply({
      embeds: [
        infoEmbed('Pong!').addFields(
          { name: 'Round-trip', value: `${roundTrip} ms`, inline: true },
          { name: 'Gateway', value: gateway >= 0 ? `${gateway} ms` : 'measuring...', inline: true },
        ),
      ],
    });
  },
};
