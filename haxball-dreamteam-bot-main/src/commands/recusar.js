const { SlashCommandBuilder } = require('discord.js');
const { getPlayerByDiscordId } = require('../database/models/player');

const recusar = async (interaction) => {
    try {
        const playerId = interaction.user.id;

        const player = await getPlayerByDiscordId(playerId);
        if (!player || !player.team_name) {
            return await interaction.reply({
                content: '❌ Você precisa ter um time! Use `/registrartime` para criar seu time primeiro.',
                flags: 64 // ephemeral
            });
        }

        // Simular recusar desafio (funcionalidade básica)
        await interaction.reply({
            content: '❌ Desafio recusado. O sistema de batalhas ainda não foi implementado.',
            flags: 64 // ephemeral
        });

    } catch (error) {
        console.error('Erro ao recusar desafio:', error);
        await interaction.reply({
            content: '❌ Erro ao recusar desafio. Tente novamente.',
            flags: 64 // ephemeral
        });
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recusar')
        .setDescription('Recusar um desafio')
        .addStringOption(option =>
            option.setName('desafio_id')
                .setDescription('ID do desafio para recusar')
                .setRequired(true)),
    execute: recusar
};
