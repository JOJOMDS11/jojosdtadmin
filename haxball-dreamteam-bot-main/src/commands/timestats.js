const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Team = require('../database/models/team');
const { getCardById } = require('../database/models/card');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timestats')
        .setDescription('Mostra as estatísticas completas do seu time'),

    async execute(interaction) {
        try {
            const discordId = interaction.user.id;

            // Buscar time do usuário
            const team = await Team.getTeamByOwner(discordId);

            if (!team) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Time não encontrado')
                    .setDescription('Você ainda não possui um time registrado. Use `/registrartime` primeiro.');

                return await interaction.reply({ embeds: [embed] });
            }

            // Buscar cartas escaladas para calcular poder do time
            let teamOverall = 0;
            let escalatedCards = 0;
            const rarityCount = { Prime: 0, GOAT: 0, Médio: 0, Bagre: 0 };

            // Verificar cartas escaladas
            if (team.gk_card_id) {
                try {
                    const gkCard = await getCardById(team.gk_card_id, discordId);
                    if (gkCard) {
                        teamOverall += gkCard.overall_rating;
                        escalatedCards++;
                        rarityCount[gkCard.rarity]++;
                    }
                } catch (e) { /* Card não encontrada */ }
            }

            if (team.vl_card_id) {
                try {
                    const vlCard = await getCardById(team.vl_card_id, discordId);
                    if (vlCard) {
                        teamOverall += vlCard.overall_rating;
                        escalatedCards++;
                        rarityCount[vlCard.rarity]++;
                    }
                } catch (e) { /* Card não encontrada */ }
            }

            if (team.pv_card_id) {
                try {
                    const pvCard = await getCardById(team.pv_card_id, discordId);
                    if (pvCard) {
                        teamOverall += pvCard.overall_rating;
                        escalatedCards++;
                        rarityCount[pvCard.rarity]++;
                    }
                } catch (e) { /* Card não encontrada */ }
            }

            const avgOverall = escalatedCards > 0 ? Math.round(teamOverall / escalatedCards) : 0;

            // Determinar poder do time
            let poderTime = '';
            let embedColor = '#0099ff';
            
            if (avgOverall >= 90) {
                poderTime = '🔥 **LENDÁRIO**';
                embedColor = '#9B59B6'; // Roxo
            } else if (avgOverall >= 80) {
                poderTime = '⚡ **ELITE**';
                embedColor = '#F1C40F'; // Dourado
            } else if (avgOverall >= 70) {
                poderTime = '💪 **FORTE**';
                embedColor = '#3498DB'; // Azul
            } else if (avgOverall >= 60) {
                poderTime = '⚽ **MÉDIO**';
                embedColor = '#2ECC71'; // Verde
            } else {
                poderTime = '🌱 **INICIANTE**';
                embedColor = '#95A5A6'; // Cinza
            }

            // Calcular estatísticas
            const totalMatches = team.wins + team.losses + (team.draws || 0);
            const winRate = totalMatches > 0 ? ((team.wins / totalMatches) * 100).toFixed(1) : 0;
            const goalDiff = (team.goals_for || 0) - (team.goals_against || 0);
            const avgGoalsFor = totalMatches > 0 ? ((team.goals_for || 0) / totalMatches).toFixed(1) : 0;
            const avgGoalsAgainst = totalMatches > 0 ? ((team.goals_against || 0) / totalMatches).toFixed(1) : 0;

            // Criar embed com estatísticas do time
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`🏆 Estatísticas do ${team.name}`)
                .setDescription(`${poderTime} | **Overall Médio:** ${avgOverall} | **Cartas Escaladas:** ${escalatedCards}/3`)
                .addFields([
                    { name: '👑 Proprietário', value: `<@${team.owner_discord_id}>`, inline: true },
                    { name: '🏟️ Partidas Jogadas', value: totalMatches.toString(), inline: true },
                    { name: '📈 Taxa de Vitória', value: `${winRate}%`, inline: true },
                    { name: '✅ Vitórias', value: team.wins.toString(), inline: true },
                    { name: '❌ Derrotas', value: team.losses.toString(), inline: true },
                    { name: '⚖️ Empates', value: (team.draws || 0).toString(), inline: true },
                    { name: '⚽ Goals Marcados', value: (team.goals_for || 0).toString(), inline: true },
                    { name: '🥅 Goals Sofridos', value: (team.goals_against || 0).toString(), inline: true },
                    { name: '📊 Saldo de Goals', value: goalDiff >= 0 ? `+${goalDiff}` : goalDiff.toString(), inline: true }
                ])
                .setFooter({ text: `Time ID: ${team.id} | Criado em ${new Date(team.created_at).toLocaleDateString()}` })
                .setTimestamp();

            // Adicionar campo de composição do time se tiver cartas escaladas
            if (escalatedCards > 0) {
                const composicaoText = `� **Prime:** ${rarityCount.Prime} | 🏆 **GOAT:** ${rarityCount.GOAT}\n⭐ **Médio:** ${rarityCount.Médio} | 🐟 **Bagre:** ${rarityCount.Bagre}`;
                embed.addFields({ name: '🎴 Composição do Time', value: composicaoText, inline: true });
            }

            // Adicionar campos de performance
            embed.addFields([
                { name: '📈 Média Goals/Partida', value: avgGoalsFor.toString(), inline: true },
                { name: '📉 Média Sofridos/Partida', value: avgGoalsAgainst.toString(), inline: true },
                { name: '🏅 Ranking', value: `#${team.ranking || 'N/A'}`, inline: true }
            ]);

            // Remover tentativa de gerar logo (sem Canvas)
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro ao buscar estatísticas do time:', error);

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Erro')
                .setDescription('Houve um erro ao buscar as estatísticas do seu time. Tente novamente mais tarde.');

            await interaction.reply({ embeds: [embed] });
        }
    }
};
