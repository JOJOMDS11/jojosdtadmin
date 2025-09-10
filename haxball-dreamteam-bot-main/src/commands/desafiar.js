const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPlayerByDiscordId } = require('../database/models/player');
const { getTeamByOwner, updateTeam } = require('../database/models/team');
const { getCardById } = require('../database/models/card');

// Mapa para armazenar desafios pendentes
const challengeStore = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('desafiar')
        .setDescription('⚔️ Desafiar outro jogador para uma partida!')
        .addUserOption(option =>
            option.setName('jogador')
                .setDescription('Jogador que você quer desafiar')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const challengedUser = interaction.options.getUser('jogador');
            
            if (!challengedUser) {
                return await interaction.reply({
                    content: '❌ **USUÁRIO NÃO ENCONTRADO!**\n🔍 Verifique se o jogador existe.',
                    ephemeral: true
                });
            }

            const challengerId = interaction.user.id;
            const challengedId = challengedUser.id;

            if (challengerId === challengedId) {
                return await interaction.reply({
                    content: '❌ **VOCÊ NÃO PODE DESAFIAR A SI MESMO!**',
                    ephemeral: true
                });
            }

            // Verificar se ambos têm times escalados
            const challengerTeam = await getTeamByOwner(challengerId);
            const challengedTeam = await getTeamByOwner(challengedId);

            if (!challengerTeam || !challengerTeam.id) {
                return await interaction.reply({
                    content: '❌ **VOCÊ PRECISA TER UM TIME!**\n🏆 Use `/registrartime` para criar seu time primeiro.',
                    ephemeral: true
                });
            }

            if (!challengedTeam || !challengedTeam.id) {
                return await interaction.reply({
                    content: `❌ **${challengedUser.username} NÃO POSSUI UM TIME REGISTRADO!**\n🏆 O jogador precisa usar \`/registrartime\` primeiro.`,
                    ephemeral: true
                });
            }

            // Verificar escalações completas (GK, VL, PV)
            if (!challengerTeam.gk_card_id || !challengerTeam.vl_card_id || !challengerTeam.pv_card_id) {
                return await interaction.reply({
                    content: '❌ **SEU TIME NÃO ESTÁ COMPLETO!**\n⚽ Use `/escalar` para completar sua escalação (GK, VL, PV).',
                    ephemeral: true
                });
            }

            if (!challengedTeam.gk_card_id || !challengedTeam.vl_card_id || !challengedTeam.pv_card_id) {
                return await interaction.reply({
                    content: `❌ **O TIME DE ${challengedUser.username} NÃO ESTÁ COMPLETO!**\n⚽ O jogador precisa completar sua escalação primeiro.`,
                    ephemeral: true
                });
            }

            // Criar ID único para o desafio
            const challengeId = `${challengerId}_${challengedId}_${Date.now()}`;

            // Armazenar dados do desafio
            challengeStore.set(challengeId, {
                challengerId,
                challengedId,
                challengerTeam: challengerTeam.id,
                challengedTeam: challengedTeam.id,
                timestamp: Date.now()
            });

            // Criar botões de aceitar/recusar
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`accept_${challengeId}`)
                        .setLabel('✅ Aceitar')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`decline_${challengeId}`)
                        .setLabel('❌ Recusar')
                        .setStyle(ButtonStyle.Danger)
                );

            // Criar embed do desafio
            const embed = new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle('⚔️ DESAFIO DE PARTIDA!')
                .setDescription(
                    `🏆 **${interaction.user.username}** desafiou **${challengedUser.username}**!\n\n` +
                    `🔥 **${challengerTeam.name}** vs **${challengedTeam.name}**\n\n` +
                    `⏰ **Desafio válido por 5 minutos**`
                )
                .addFields(
                    { name: '🎯 Desafiante', value: `<@${challengerId}>`, inline: true },
                    { name: '🎯 Desafiado', value: `<@${challengedId}>`, inline: true },
                    { name: '⚽ Modalidade', value: 'Partida Amistosa', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'HaxBall DreamTeam' });

            await interaction.reply({
                content: `<@${challengedId}> você foi desafiado! 🔔`,
                embeds: [embed],
                components: [row]
            });

            // Auto-expirar o desafio em 5 minutos
            setTimeout(() => {
                challengeStore.delete(challengeId);
            }, 5 * 60 * 1000);

        } catch (error) {
            console.error('Erro no comando desafiar:', error);
            
            const errorMessage = {
                content: '❌ **Erro interno!**\n' +
                    'Algo deu errado ao criar o desafio. Tente novamente.',
                ephemeral: true
            };

            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};
