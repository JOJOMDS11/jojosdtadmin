const { SlashCommandBuilder } = require('discord.js');
const { getPlayerByDiscordId, createPlayer } = require('../database/models/player');

const purplecoins = async (interaction) => {
    try {
        const userId = interaction.user.id;

        // Buscar dados do jogador
        let player = await getPlayerByDiscordId(userId);

        // Se jogador não existe, criar automaticamente
        if (!player) {
            const playerData = {
                discord_id: userId,
                name: interaction.user.displayName || interaction.user.username,
                team_name: null,
                level: 1,
                experience: 0,
                purple_coins: 0,
                last_pack: null,
                pack_count: 0
            };

            await createPlayer(playerData);
            player = await getPlayerByDiscordId(userId);
        }

        const coins = player.purple_coins || 0;

        // Se não tem purple coins
        if (coins === 0) {
            return interaction.reply({
                content: '💜 **SEM PURPLE COINS!**\n\n' +
                    '😢 Você ainda não possui Purple Coins.\n\n' +
                    '💡 **Como conseguir moedas:**\n' +
                    '🎴 Use `/obter` para conseguir cartas\n' +
                    '💰 Use `/vender #ID` para vender cartas\n' +
                    '📦 Use `/pacote` para múltiplas cartas\n\n' +
                    '⚡ Comece sua jornada agora!',
                ephemeral: true
            });
        }

        // Emoji baseado na quantidade de moedas
        let statusEmoji = '💜';
        let statusText = '';

        if (coins >= 1000) {
            statusEmoji = '👑💎';
            statusText = 'MILIONÁRIO';
        } else if (coins >= 500) {
            statusEmoji = '💰✨';
            statusText = 'RICO';
        } else if (coins >= 200) {
            statusEmoji = '💜🔥';
            statusText = 'PRÓSPERO';
        } else if (coins >= 100) {
            statusEmoji = '💜⭐';
            statusText = 'COLECIONADOR';
        } else if (coins >= 50) {
            statusEmoji = '💜📈';
            statusText = 'INVESTIDOR';
        } else if (coins >= 20) {
            statusEmoji = '💜🎯';
            statusText = 'INICIANTE';
        } else {
            statusEmoji = '💜🥺';
            statusText = 'QUEBRADO';
        }

        const embed = {
            color: coins >= 500 ? 0xFFD700 : coins >= 200 ? 0x9B59B6 : coins >= 50 ? 0x3498DB : 0x95A5A6,
            title: `${statusEmoji} CARTEIRA PURPLE COINS`,
            description: `💰 **${interaction.user.username}** possui:`,
            fields: [
                {
                    name: '💜 Total de Purple Coins',
                    value: `**${coins.toLocaleString('pt-BR')} moedas**`,
                    inline: true
                },
                {
                    name: '📊 Status',
                    value: `**${statusText}**`,
                    inline: true
                },
                {
                    name: '📈 Ranking',
                    value: coins >= 1000 ? '🥇 TOP 1%' :
                        coins >= 500 ? '🥈 TOP 5%' :
                            coins >= 200 ? '🥉 TOP 20%' :
                                coins >= 100 ? '⭐ TOP 50%' : '📊 Crescendo',
                    inline: true
                }
            ],
            footer: {
                text: '💡 Venda cartas com /vender #ID para ganhar mais moedas!',
                icon_url: interaction.user.displayAvatarURL()
            },
            timestamp: new Date().toISOString()
        };

        // Adicionar dicas baseadas na quantidade
        if (coins < 50) {
            embed.fields.push({
                name: '💡 Dicas para Ganhar Moedas',
                value: '🎴 Use `/obter` para conseguir cartas\n' +
                    '📦 Use `/pacote` para 3 cartas de uma vez\n' +
                    '💰 Use `/vender #ID` para vender cartas',
                inline: false
            });
        } else if (coins >= 500) {
            embed.fields.push({
                name: '👑 Status VIP',
                value: '🔥 Você é um dos jogadores mais ricos!\n' +
                    '💎 Continue colecionando cartas raras\n' +
                    '🏆 Seja estratégico com suas vendas',
                inline: false
            });
        }

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });

    } catch (error) {
        console.error('Erro no comando purplecoins:', error);
        await interaction.reply({
            content: '❌ Erro ao consultar purple coins. Tente novamente.',
            ephemeral: true
        });
    }
};

// Definir o comando slash
module.exports = {
    data: new SlashCommandBuilder()
        .setName('purplecoins')
        .setDescription('🪙 Consultar seu saldo de Purple Coins'),
    execute: purplecoins
};
