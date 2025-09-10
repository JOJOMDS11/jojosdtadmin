const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayerByDiscordId, updatePlayer } = require('../database/models/player');
const { generateCard } = require('../utils/cardGenerator');
const { createCard } = require('../database/models/card');
const { RARITY_COLORS } = require('../utils/rarity');

// Configuração dos pacotes
const PACOTES = {
    normal: {
        nome: 'Pacote Normal',
        preco: 100,
        emoji: '📦',
        probabilidades: {
            bagre: 0.70,   // 70%
            medio: 0.25,   // 25%
            goat: 0.045,   // 4.5%
            prime: 0.005   // 0.5%
        }
    },
    super: {
        nome: 'Pacote Super',
        preco: 300,
        emoji: '🎁',
        probabilidades: {
            bagre: 0.50,   // 50%
            medio: 0.35,   // 35%
            goat: 0.13,    // 13%
            prime: 0.02    // 2%
        }
    },
    purple: {
        nome: 'Pacote Purple',
        preco: 800,
        emoji: '💎',
        probabilidades: {
            bagre: 0.25,   // 25%
            medio: 0.40,   // 40%
            goat: 0.30,    // 30%
            prime: 0.05    // 5%
        }
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comprarpacote')
        .setDescription('Compra um pacote de cartas com Purple Coins')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo do pacote para comprar')
                .setRequired(true)
                .addChoices(
                    { name: '📦 Pacote Normal - 100 Purple Coins', value: 'normal' },
                    { name: '🎁 Pacote Super - 300 Purple Coins', value: 'super' },
                    { name: '💎 Pacote Purple - 800 Purple Coins', value: 'purple' }
                )),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const tipoPacote = interaction.options.getString('tipo');

            // Responder imediatamente para evitar timeout
            await interaction.deferReply({ ephemeral: true });

            try {
                // Buscar jogador (auto-criar se necessário para compras)
                let player = await getPlayerByDiscordId(userId);
                if (!player) {
                    // Para compras, pode auto-criar jogador
                    const { createPlayer } = require('../database/models/player');
                    player = await createPlayer({
                        discord_id: userId,
                        name: interaction.user.displayName || interaction.user.username,
                        purple_coins: 0
                    });
                    console.log(`🆕 Jogador criado automaticamente para compra: ${interaction.user.username}`);
                }

                const pacote = PACOTES[tipoPacote];
                if (!pacote) {
                    return await interaction.editReply({
                        content: '❌ Tipo de pacote inválido.'
                    });
                }

                // Verificar se tem coins suficientes
                if (player.purple_coins < pacote.preco) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('💰 Purple Coins Insuficientes')
                        .setDescription(`Você precisa de **${pacote.preco}** Purple Coins para comprar o ${pacote.nome}.`)
                        .addFields(
                            { name: '💜 Seus Purple Coins', value: player.purple_coins.toString(), inline: true },
                            { name: '💸 Preço do Pacote', value: pacote.preco.toString(), inline: true },
                            { name: '❌ Faltam', value: (pacote.preco - player.purple_coins).toString(), inline: true }
                        )
                        .setFooter({ text: 'Use /obter para conseguir mais Purple Coins!' });

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Gerar carta usando templates dos ADMs
                const carta = await generateCard();

                if (!carta) {
                    return await interaction.editReply({
                        content: '❌ Nenhum template disponível! ADMs precisam criar jogadores primeiro usando `/criarjogador`.'
                    });
                }

                // Salvar carta no banco
                const cardId = await createCard({
                    discord_id: userId,
                    template_id: carta.template_id,
                    player_name: carta.player_name,
                    position: carta.position,
                    avatar: carta.avatar,
                    rarity: carta.rarity,
                    overall_rating: carta.overall,
                    source: 'pack',
                    stats: carta.stats || {}
                });

                // Deduzir coins do jogador
                const novosCoins = player.purple_coins - pacote.preco;
                await updatePlayer(userId, { purple_coins: novosCoins });

                // Criar embed da carta obtida
                const embed = new EmbedBuilder()
                    .setColor(RARITY_COLORS[carta.rarity])
                    .setTitle(`${pacote.emoji} ${pacote.nome} Aberto!`)
                    .setDescription(`🎉 ${interaction.user} obteve uma carta!`)
                    .addFields(
                        { name: '🎴 Nome', value: carta.player_name, inline: true },
                        { name: '🎯 Posição', value: carta.position.toUpperCase(), inline: true },
                        { name: '⭐ Overall', value: carta.overall.toString(), inline: true },
                        { name: '🏆 Raridade', value: getRaridadeEmoji(carta.rarity) + ' ' + carta.rarity.toUpperCase(), inline: true },
                        { name: '💜 Purple Coins Restantes', value: novosCoins.toString(), inline: true },
                        { name: '💸 Gasto', value: `${pacote.preco} Purple Coins`, inline: true },
                        { name: '🆔 ID da Carta', value: cardId.toString(), inline: true }
                    )
                    .setFooter({ text: `Pacote: ${pacote.nome} | Template criado por ADM` })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

            } catch (dbError) {
                console.error('Erro de banco de dados:', dbError);
                await interaction.editReply({
                    content: '❌ Erro interno no sistema. Tente novamente.'
                });
            }

        } catch (error) {
            console.error('Erro no comando comprarpacote:', error);
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
    }
};

// Função para emoji por raridade
function getRaridadeEmoji(raridade) {
    const emojis = {
        'Bagre': '🐟',
        'Médio': '🥈',
        'GOAT': '🐐',
        'Prime': '👑'
    };
    return emojis[raridade] || '❓';
}
