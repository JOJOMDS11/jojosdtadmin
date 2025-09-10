const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTeamByOwner } = require('../database/models/team');
const { getCardById } = require('../database/models/card');
const { getPlayerByDiscordId } = require('../database/models/player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mostrartime')
        .setDescription('🏅 Mostrar informações do seu time!'),

    async execute(interaction) {
        try {
            const playerId = interaction.user.id;

            await interaction.deferReply();

            // Buscar time do jogador
            const team = await getTeamByOwner(playerId);

            if (!team) {
                return await interaction.editReply({
                    content: '❌ **TIME NÃO ENCONTRADO!**\n' +
                        '🏆 Use `/registrartime` para criar seu time primeiro!'
                });
            }

            // Buscar informações do dono
            const owner = await getPlayerByDiscordId(playerId);
            const ownerName = interaction.user.username; // Usar nome do Discord diretamente

            // Buscar cartas escaladas (HaxBall: GK, VL, PV)
            const escalacao = {
                gk: team.gk_card_id ? await getCardById(team.gk_card_id, playerId) : null,
                vl: team.vl_card_id ? await getCardById(team.vl_card_id, playerId) : null,
                pv: team.pv_card_id ? await getCardById(team.pv_card_id, playerId) : null
            };

            // Calcular overall médio do time
            const jogadoresEscalados = Object.values(escalacao).filter(card => card !== null);
            const overallMedio = jogadoresEscalados.length > 0
                ? Math.round(jogadoresEscalados.reduce((acc, card) => acc + (card.overall_rating || card.overall || 0), 0) / jogadoresEscalados.length)
                : 0;

            // Criar embed do time
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`🏅 ${team.name}`)
                .setDescription(`👤 **Dono:** ${ownerName}\n⭐ **Overall Médio:** ${overallMedio}`)
                .setTimestamp()
                .setFooter({ text: 'HaxBall DreamTeam' });

            // Adicionar escalação com stats
            let escalacaoText = '';

            // Função para formatar jogador com stats
            const formatarJogador = (card, posicao) => {
                if (!card) return 'Vazio';
                const avatar = card.avatar || card.template_avatar || '⚽';
                const overall = card.overall_rating || card.overall || 0;
                const stats = card.stats ? 
                    `DEF:${card.defesa || card.stats.defesa || 0} DRI:${card.drible || card.stats.drible || 0} PAS:${card.passe || card.stats.passe || 0} FIN:${card.finalizacao || card.stats.finalizacao || 0}` :
                    `DEF:${card.defesa || 0} DRI:${card.drible || 0} PAS:${card.passe || 0} FIN:${card.finalizacao || 0}`;
                
                return `${card.player_name} ${avatar} (${overall})\n   📊 ${stats}`;
            };

            escalacaoText += `🥅 **Goleiro (GK):**\n${formatarJogador(escalacao.gk, 'GK')}\n\n`;
            escalacaoText += `⚽ **Volante (VL):**\n${formatarJogador(escalacao.vl, 'VL')}\n\n`;
            escalacaoText += `🎯 **Pivô (PV):**\n${formatarJogador(escalacao.pv, 'PV')}\n`;

            embed.addFields({
                name: '⚽ Escalação',
                value: escalacaoText,
                inline: false
            });

            // Adicionar estatísticas
            const wins = team.wins || 0;
            const losses = team.losses || 0;
            const goals_for = team.goals_for || 0;
            const goals_against = team.goals_against || 0;
            const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0.0';

            embed.addFields(
                { name: '🏆 Vitórias', value: wins.toString(), inline: true },
                { name: '💔 Derrotas', value: losses.toString(), inline: true },
                { name: '📊 Taxa de Vitória', value: `${winRate}%`, inline: true },
                { name: '⚽ Goals Marcados', value: goals_for.toString(), inline: true },
                { name: '🛡️ Goals Sofridos', value: goals_against.toString(), inline: true },
                { name: '📈 Saldo de Goals', value: `+${goals_for - goals_against}`, inline: true }
            );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro no comando mostrartime:', error);

            const errorMessage = {
                content: '❌ **Erro interno!**\n' +
                    'Algo deu errado ao mostrar seu time. Tente novamente.',
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
