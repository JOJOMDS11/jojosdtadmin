const { generateCard } = require('../utils/cardGenerator');
const { createCard } = require('../database/models/card');
const { checkCooldown, setCooldown } = require('../utils/cooldowns');
const { RARITY_COLORS } = require('../utils/rarity');
const { convertAvatarCode } = require('../utils/avatarConverter');
const { SlashCommandBuilder } = require('discord.js');

const PACK_COOLDOWN = 2 * 60 * 60 * 1000; // 2 horas em millisegundos

const pacote = async function (interaction) {
    try {
        const userId = interaction.user.id;

        // Verificar cooldown
        const cooldownCheck = checkCooldown(userId, 'pack', PACK_COOLDOWN);
        if (!cooldownCheck.canUse) {
            const timeLeft = Math.ceil(cooldownCheck.timeLeft / (60 * 1000)); // minutos
            const hours = Math.floor(timeLeft / 60);
            const minutes = timeLeft % 60;

            return interaction.reply({
                content: `⏰ **Cooldown ativo!**\n` +
                    `🎁 Próximo pacote disponível em: **${hours}h ${minutes}min**\n` +
                    `💡 *Pacotes contêm 3 cartas aleatórias!*`,
                ephemeral: true
            });
        }

        // Defer a resposta
        await interaction.deferReply();

        // Gerar 3 cartas aleatórias usando templates
        const cards = [];
        try {
            for (let i = 0; i < 3; i++) {
                const card = await generateCard();
                if (card) {
                    // Salvar carta no banco e pegar o ID
                    const cardId = await createCard({
                        discord_id: userId,
                        template_id: card.template_id,
                        player_name: card.player_name,
                        position: card.position,
                        avatar: card.avatar,
                        rarity: card.rarity,
                        overall_rating: card.overall,
                        source: 'pacote',
                        stats: card.stats || {}
                    });

                    // Adicionar o ID à carta
                    card.id = cardId;
                    cards.push(card);
                }
            }
        } catch (cardError) {
            if (cardError.message.includes('NENHUM JOGADOR DISPONÍVEL')) {
                return interaction.editReply({
                    content: '❌ **NENHUM JOGADOR DISPONÍVEL!**\n\n' +
                        '🔧 **ADM:** Use `/criarjogador` para criar jogadores primeiro!\n' +
                        '⚠️ O sistema não cria jogadores automaticamente.'
                });
            }
            throw cardError;
        }

        if (cards.length === 0) {
            return interaction.editReply({
                content: '❌ Erro ao gerar cartas. Tente novamente.',
                ephemeral: true
            });
        }

        // Ordenar cartas por overall (maior primeiro)
        cards.sort((a, b) => b.overall - a.overall);
        const mainCard = cards[0]; // Carta principal (maior overall)
        const secondaryCards = cards.slice(1); // Outras cartas

        // Definir cooldown
        setCooldown(userId, 'pack');

        // Dar purple coins como recompensa (5 por carta)
        const { getPlayerByDiscordId, updatePlayerPurpleCoins, createPlayer } = require('../database/models/player');
        let player = await getPlayerByDiscordId(userId);
        if (!player) {
            player = await createPlayer({
                discord_id: userId,
                name: interaction.user.displayName || interaction.user.username,
                purple_coins: 0
            });
        }

        const purpleCoinsReward = cards.length * 5;
        const newBalance = player.purple_coins + purpleCoinsReward;
        await updatePlayerPurpleCoins(userId, newBalance);

        // Criar embed para exibição melhorada
        // Encontrar a melhor carta (maior overall)
        const bestCard = cards.reduce((best, current) =>
            current.overall > best.overall ? current : best
        );

        // Formatar stats da melhor carta
        const formatStats = (card) => {
            const stats = card.stats || {};
            if (card.position === 'GK') {
                return `🥅 **POS:** ${stats.posicionamento || 0} | 🏃 **SAI:** ${stats.saidaDeBola || 0}\n🛡️ **DEF:** ${stats.defesa || 0} | ⚡ **DRI:** ${stats.drible || 0}`;
            } else if (card.position === 'VL') {
                return `🛡️ **DEF:** ${stats.defesa || 0} | 🎯 **PAS:** ${stats.passe || 0}\n⚽ **FIN:** ${stats.finalizacao || 0} | ⚡ **DRI:** ${stats.drible || 0}`;
            } else { // PV
                return `⚽ **FIN:** ${stats.finalizacao || 0} | 🥅 **POS:** ${stats.posicionamento || 0}\n⚡ **DRI:** ${stats.drible || 0} | 🎯 **PAS:** ${stats.passe || 0}`;
            }
        };

        const embed = {
            color: RARITY_COLORS[mainCard.rarity] || 0x808080,
            title: `🎁 PACOTE ABERTO! 🎁`,
            description: `🎉 **<@${userId}> abriu um PACOTE!**`,
            fields: [
                {
                    name: '🏆 Carta Principal:',
                    value: `**${mainCard.player_name}** ${convertAvatarCode(mainCard.avatar)} (${mainCard.position})\n⭐ Overall: **${mainCard.overall}** | 💎 **${mainCard.rarity}**\n🆔 ID: **${mainCard.id}**`,
                    inline: false
                },
                {
                    name: '🌟 Melhor Carta - Stats Detalhados:',
                    value: `**${bestCard.player_name}** ${convertAvatarCode(bestCard.avatar)} (${bestCard.position}) - Overall **${bestCard.overall}**\n${formatStats(bestCard)}`,
                    inline: false
                },
                {
                    name: '📦 Cartas Adicionais:',
                    value: secondaryCards.map((card, index) =>
                        `**${index + 2}. ${card.player_name}** ${convertAvatarCode(card.avatar)} (${card.position})\n⭐ ${card.overall} | 💎 ${card.rarity} | 🆔 ${card.id}`
                    ).join('\n\n'),
                    inline: false
                },
                {
                    name: '🎁 Recompensa',
                    value: `💜 +${purpleCoinsReward} Purple Coins\n🎲 ${cards.length} cartas adicionadas ao elenco\n💼 Novo saldo: ${newBalance} Purple Coins`,
                    inline: true
                },
                {
                    name: '📊 Raridades obtidas',
                    value: `${cards.map(card => `⭐ ${card.rarity}`).join('\n')}`,
                    inline: true
                }
            ],
            timestamp: new Date(),
            footer: {
                text: `Próximo pacote disponível em 2 horas • ${cards.length} cartas obtidas`
            }
        };

        // Log para auditoria
        console.log(`📦 ${interaction.user.tag} abriu pacote: ${cards.map(c => `${c.player_name}(${c.overall})`).join(', ')}`);

        return interaction.editReply({
            content: `🎊 **PACOTE ABERTO!** 🎊`,
            embeds: [embed]
        });

    } catch (error) {
        console.error('Erro no comando pacote:', error);

        const errorMessage = interaction.deferred
            ? { content: `❌ **Erro:** ${error.message}`, ephemeral: true }
            : { content: `❌ **Erro:** ${error.message}`, ephemeral: true };

        return interaction.deferred
            ? interaction.editReply(errorMessage)
            : interaction.reply(errorMessage);
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pacote')
        .setDescription('Obter 3 cartas aleatórias (cooldown 2 horas)'),
    execute: pacote
};
