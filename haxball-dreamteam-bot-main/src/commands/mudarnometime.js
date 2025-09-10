const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTeamByOwner, updateTeam } = require('../database/models/team');
const { updatePlayer } = require('../database/models/player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mudarnometime')
        .setDescription('✏️ Alterar o nome do seu time!')
        .addStringOption(option =>
            option.setName('nome')
                .setDescription('Novo nome para seu time')
                .setRequired(true)
                .setMaxLength(30)),

    async execute(interaction) {
        try {
            const playerId = interaction.user.id;
            const novoNome = interaction.options.getString('nome');

            await interaction.deferReply();

            // Buscar time do jogador
            const team = await getTeamByOwner(playerId);

            if (!team) {
                return await interaction.editReply({
                    content: '❌ **TIME NÃO ENCONTRADO!**\n' +
                        '🏆 Use `/registrartime` para criar seu time primeiro!'
                });
            }

            // Verificar se o nome não é muito curto
            if (novoNome.trim().length < 3) {
                return await interaction.editReply({
                    content: '❌ **NOME MUITO CURTO!**\n' +
                        '📝 O nome do time deve ter pelo menos 3 caracteres.'
                });
            }

            // Verificar se o nome não contém caracteres inválidos
            const nomeValido = /^[a-zA-ZÀ-ÿ0-9\s]+$/.test(novoNome);
            if (!nomeValido) {
                return await interaction.editReply({
                    content: '❌ **NOME INVÁLIDO!**\n' +
                        '📝 Use apenas letras, números e espaços.'
                });
            }

            const nomeAntigo = team.name;

            // Atualizar nome do time
            await updateTeam(team.id, {
                name: novoNome.trim(),
                owner_username: interaction.user.username,
                discord_user: interaction.user.tag
            });

            // Criar embed de sucesso
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✏️ NOME DO TIME ALTERADO!')
                .setDescription(
                    `🏅 **Nome anterior:** ${nomeAntigo}\n` +
                    `🎯 **Novo nome:** ${novoNome.trim()}\n\n` +
                    '✅ Alteração realizada com sucesso!'
                )
                .addFields(
                    { name: '👤 Dono', value: `<@${playerId}>`, inline: true },
                    { name: '📅 Data', value: new Date().toLocaleDateString('pt-BR'), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'HaxBall DreamTeam' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro no comando mudarnometime:', error);

            const errorMessage = {
                content: '❌ **Erro interno!**\n' +
                    'Algo deu errado ao alterar o nome do time. Tente novamente.',
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
