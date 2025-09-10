const { generateCard } = require('../utils/cardGenerator');
const { createCard } = require('../database/models/card');
const { checkCooldown, setCooldown } = require('../utils/cooldowns');
const { RARITY_COLORS } = require('../utils/rarity');
const { generateSimpleCardImage } = require('../utils/simpleImageGenerator');
const { convertAvatarCode } = require('../utils/avatarConverter');
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

const OBTER_COOLDOWN = 10 * 60 * 1000; // 10 minutos em millisegundos

const obter = async (interaction) => {
    try {
        const userId = interaction.user.id;

        // Verificar cooldown
        const cooldownCheck = checkCooldown(userId, 'obter', OBTER_COOLDOWN);
        if (!cooldownCheck.canUse) {
            const timeLeft = Math.ceil(cooldownCheck.timeLeft / (60 * 1000)); // minutos

            return interaction.reply({
                content: `⏰ **Cooldown ativo!**\n` +
                    `🎴 Próxima carta disponível em: **${timeLeft} minutos**\n` +
                    `💡 *Use \`/pacote\` para obter 3 cartas de uma vez!*`,
                ephemeral: true
            });
        }

        // Defer a resposta
        await interaction.deferReply();

        let card;
        let cardId;
        try {
            // Gerar UMA carta aleatória usando templates
            card = await generateCard();

            if (!card) {
                return interaction.editReply({
                    content: '❌ **NENHUM JOGADOR DISPONÍVEL!**\n\n' +
                        '🔧 **ADM:** Use `/criarjogador` para criar jogadores primeiro!\n' +
                        '⚠️ O sistema não cria jogadores automaticamente.',
                    ephemeral: true
                });
            }

            // Salvar carta no banco
            cardId = await createCard({
                discord_id: userId,
                template_id: card.template_id,
                player_name: card.player_name,
                position: card.position,
                avatar: card.avatar,
                rarity: card.rarity,
                overall_rating: card.overall,
                source: 'obter',
                stats: card.stats || {}
            });
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

        // Definir cooldown
        setCooldown(userId, 'obter');

        // Dar purple coins como recompensa
        const { getPlayerByDiscordId, updatePlayerPurpleCoins, createPlayer } = require('../database/models/player');
        let player = await getPlayerByDiscordId(userId);
        if (!player) {
            player = await createPlayer({
                discord_id: userId,
                name: interaction.user.displayName || interaction.user.username,
                purple_coins: 0
            });
        }

        const purpleCoinsReward = 10; // 10 coins por carta obtida
        const newBalance = player.purple_coins + purpleCoinsReward;
        await updatePlayerPurpleCoins(userId, newBalance);

        // 🎨 GERAR IMAGEM SIMPLES DA CARTA!
        let cardImageAttachment = null;
        try {
            console.log('🎨 Gerando imagem simples da carta...');
            const imageBuffer = await generateSimpleCardImage({
                ...card,
                player_name: card.player_name,
                overall: card.overall,
                id: cardId
            });

            if (imageBuffer) {
                cardImageAttachment = new AttachmentBuilder(imageBuffer, {
                    name: `carta_${card.player_name.replace(/\s+/g, '_')}_${cardId}.png`
                });
                console.log('✅ Imagem da carta gerada com sucesso!');
            }
        } catch (imageError) {
            console.warn('⚠️ Erro ao gerar imagem da carta:', imageError.message);
        }

        // Determinar emoji da posição (HaxBall específico)
        const positionEmoji = {
            'GK': '🥅', // Goleiro
            'VL': '⚽', // Volante
            'PV': '🎯'  // Pivo
        };

        // Mostrar stats específicos por posição (4 cada)
        let statsText = '';
        if (card.position === 'GK') {
            statsText = `📊 Stats: POS: ${card.stats?.posicionamento || 60} | SAI: ${card.stats?.saidaDeBola || 60} | DEF: ${card.stats?.defesa || 60} | DRI: ${card.stats?.drible || 60}`;
        } else if (card.position === 'VL') {
            statsText = `📊 Stats: DEF: ${card.stats?.defesa || 60} | DRI: ${card.stats?.drible || 60} | PAS: ${card.stats?.passe || 60} | FIN: ${card.stats?.finalizacao || 60}`;
        } else if (card.position === 'PV') {
            statsText = `📊 Stats: POS: ${card.stats?.posicionamento || 60} | DRI: ${card.stats?.drible || 60} | PAS: ${card.stats?.passe || 60} | FIN: ${card.stats?.finalizacao || 60}`;
        }

        // Emoji HaxBall baseado no overall (mais visual)
        const getHaxBallEmoji = (overall) => {
            if (overall >= 91) return '🟣'; // Roxo - Prime
            else if (overall >= 85) return '🔴'; // Vermelho - GOAT  
            else if (overall >= 75) return '🟡'; // Amarelo - Médio
            else return '⚪'; // Branco - Bagre
        };

        // Calcular valor de venda
        const calcularValorVenda = (carta) => {
            const { overall, rarity } = carta;
            const valoresPorRaridade = {
                'Prime': 200,
                'GOAT': 100,
                'Médio': 50,
                'Bagre': 20
            };
            const valorBase = valoresPorRaridade[rarity] || 20;
            const multiplicadorOverall = (overall - 60) / 40;
            const bonusOverall = Math.floor(valorBase * multiplicadorOverall);
            const variacao = Math.random() * 0.4 - 0.2;
            const valorFinal = Math.floor((valorBase + bonusOverall) * (1 + variacao));
            return Math.max(10, valorFinal);
        };

        const valorVenda = calcularValorVenda(card);

        // Emoji da raridade mais chamativo
        const rarityEmojis = {
            'Prime': '💎',
            'GOAT': '�',
            'Médio': '🥈',
            'Bagre': '🐟'
        };

        // Converter avatar code para emoji real
        const playerAvatar = convertAvatarCode(card.avatar || card.template_avatar);

        const embed = {
            color: RARITY_COLORS[card.rarity] || 0x808080,
            title: `🎴 NOVA CARTA OBTIDA! 🎴`,
            description: `<@${userId}> obteve uma carta!\n\n${statsText}`, // Stats encima
            fields: [
                {
                    name: '👤 JOGADOR',
                    value: `${getHaxBallEmoji(card.overall)} **${card.player_name}** ${playerAvatar}`,
                    inline: true
                },
                {
                    name: '📍 POSIÇÃO',
                    value: `**${card.position}** ${positionEmoji[card.position] || '⚽'}`,
                    inline: true
                },
                {
                    name: '⭐ OVERALL',
                    value: `**${card.overall}**`,
                    inline: true
                },
                {
                    name: '💎 RARIDADE',
                    value: `${rarityEmojis[card.rarity] || '⚪'} **${card.rarity.toUpperCase()}**`,
                    inline: true
                },
                {
                    name: '🆔 ID DA CARTA',
                    value: `**#${cardId}**`,
                    inline: true
                },
                {
                    name: '💰 VALOR DE VENDA',
                    value: `💜 **${valorVenda} Purple Coins**`,
                    inline: true
                }
            ],
            image: cardImageAttachment ? { url: `attachment://${cardImageAttachment.name}` } : null,
            footer: {
                text: `🎉 +${purpleCoinsReward} Purple Coins | 💼 Saldo: ${newBalance}`,
                icon_url: interaction.user.displayAvatarURL()
            },
            timestamp: new Date().toISOString()
        };

        // Enviar resposta com imagem da carta gerada
        const replyOptions = { embeds: [embed] };

        // Adicionar imagem da carta gerada se disponível
        if (cardImageAttachment) {
            replyOptions.files = [cardImageAttachment];
        }

        await interaction.editReply(replyOptions);

        // Log para auditoria
        console.log(`🎴 ${interaction.user.tag} obteve carta: ${card.player_name} (${card.overall}) - ${card.rarity}`);

    } catch (error) {
        console.error('Erro no comando obter:', error);

        const errorMessage = {
            content: '❌ **Erro interno!**\n' +
                'Algo deu errado ao processar seu comando. Tente novamente.',
            ephemeral: true
        };

        if (interaction.deferred) {
            await interaction.editReply(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('obter')
        .setDescription('🎴 Obter uma carta aleatória de jogador (cooldown: 10 min)'),
    execute: obter,
};
