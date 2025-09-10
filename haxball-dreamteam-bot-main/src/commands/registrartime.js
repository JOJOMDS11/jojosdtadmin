const { SlashCommandBuilder } = require('discord.js');
const { createTeam, getTeamByName, getTeamByOwner } = require('../database/models/team');

const registrartime = async (interaction) => {
    try {
        const teamName = interaction.options.getString('nome');
        const playerId = interaction.user.id;

        // Responder imediatamente para evitar timeout
        await interaction.deferReply();

        try {
            // Check if the team name is already taken
            const existingTeam = await getTeamByName(teamName);
            if (existingTeam) {
                return await interaction.editReply({
                    content: '❌ Este nome de time já está em uso.'
                });
            }

            // Check if player already owns a team
            const existingOwner = await getTeamByOwner(playerId);
            if (existingOwner) {
                return await interaction.editReply({
                    content: '❌ Você já possui um time.'
                });
            }

            // Create a new team
            const teamId = await createTeam({
                name: `${teamName}`,
                owner_discord_id: playerId,
                owner_username: interaction.user.username, // Discord username para usar no desafio
                discord_user: interaction.user.tag // Nome completo do Discord com #tag
            });

            await interaction.editReply({
                content: `✅ Time **${teamName}** criado com sucesso!\n⚔️ Dono: ${interaction.user.username}\n� Agora você pode escalar jogadores e participar de partidas!`
            });

        } catch (dbError) {
            console.error('Erro de banco de dados:', dbError);
            await interaction.editReply({
                content: '⚠️ Sistema temporariamente indisponível. Tente novamente em alguns minutos.'
            });
        }

    } catch (error) {
        console.error('Erro ao registrar time:', error);
        try {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Erro interno. Tente novamente.'
                });
            } else {
                await interaction.reply({
                    content: '❌ Erro interno. Tente novamente.',
                    flags: 64
                });
            }
        } catch (replyError) {
            console.error('Erro ao responder:', replyError);
        }
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('registrartime')
        .setDescription('Registrar um novo time')
        .addStringOption(option =>
            option.setName('nome')
                .setDescription('Nome do time')
                .setRequired(true)),
    execute: registrartime
};
