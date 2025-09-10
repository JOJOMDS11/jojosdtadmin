const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCardById, deleteCard } = require('../database/models/card');
const { getPlayerByDiscordId, updatePlayerPurpleCoins, createPlayer } = require('../database/models/player');
const { convertAvatarCode } = require('../utils/avatarConverter');
const Logger = require('../utils/logger');

// Preços de venda baseados na raridade
const SELL_PRICES = {
    'Prime': 1000,
    'GOAT': 500,
    'Médio': 200,
    'Bagre': 50
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vender')
        .setDescription('💰 Venda uma carta por purple coins')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('ID da carta que você deseja vender')
                .setRequired(true)),

    execute: async (interaction) => {
        try {
            const cardId = interaction.options.getInteger('id');
            const discordId = interaction.user.id;

            // Buscar a carta do usuário
            const card = await getCardById(cardId, discordId);

            if (!card) {
                await interaction.reply({
                    content: `❌ **CARTA #${cardId} NÃO ENCONTRADA!**\n` +
                        '🔍 Verifique se o ID está correto e se a carta é sua.\n' +
                        '💡 Use `/minhascartas` para ver seus IDs.',
                    ephemeral: true
                });
                return;
            }

            // Calcular preço baseado na raridade
            const sellPrice = SELL_PRICES[card.rarity] || SELL_PRICES['Bagre'];

            // Buscar dados do jogador
            let player = await getPlayerByDiscordId(discordId);
            if (!player) {
                await createPlayer({
                    discord_id: discordId,
                    name: interaction.user.displayName || interaction.user.username
                });
                player = await getPlayerByDiscordId(discordId);
            }

            // Formatar estatísticas para exibição
            let statsText = '';
            if (card.stats) {
                if (card.position === 'GK') {
                    statsText = `🧤 **Posicionamento:** ${card.stats.posicionamento || 60}\n` +
                        `🏃 **Saída de Bola:** ${card.stats.saidaDeBola || 60}\n` +
                        `🛡️ **Defesa:** ${card.stats.defesa || 60}\n` +
                        `⚽ **Drible:** ${card.stats.drible || 60}`;
                } else if (card.position === 'VL') {
                    statsText = `🛡️ **Defesa:** ${card.stats.defesa || 60}\n` +
                        `⚽ **Drible:** ${card.stats.drible || 60}\n` +
                        `🎯 **Passe:** ${card.stats.passe || 60}\n` +
                        `🥅 **Finalização:** ${card.stats.finalizacao || 60}`;
                } else if (card.position === 'PV') {
                    statsText = `📍 **Posicionamento:** ${card.stats.posicionamento || 60}\n` +
                        `⚽ **Drible:** ${card.stats.drible || 60}\n` +
                        `🎯 **Passe:** ${card.stats.passe || 60}\n` +
                        `🥅 **Finalização:** ${card.stats.finalizacao || 60}`;
                }
            } else {
                statsText = '📊 Stats não disponíveis';
            }

            // Converter avatar de código para emoji real
            const playerAvatar = convertAvatarCode(card.avatar || card.template_avatar);

            // Criar embed de confirmação com stats
            const confirmEmbed = new EmbedBuilder()
                .setTitle('🛍️ Confirmar Venda de Carta')
                .setDescription(`Você tem certeza que deseja vender esta carta?`)
                .addFields(
                    { name: '🏷️ Carta', value: `**${card.player_name}** ${playerAvatar}`, inline: true },
                    { name: '📍 Posição', value: card.position, inline: true },
                    { name: '⭐ Overall', value: card.overall_rating.toString(), inline: true },
                    { name: '💎 Raridade', value: card.rarity, inline: true },
                    { name: '💰 Valor de Venda', value: `${sellPrice} Purple Coins`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: '📊 Estatísticas da Carta', value: statsText, inline: false },
                    { name: '💳 Saldo Atual', value: `${player.purple_coins} Purple Coins`, inline: true },
                    { name: '💳 Novo Saldo', value: `${player.purple_coins + sellPrice} Purple Coins`, inline: true }
                )
                .setColor(0xFF6B6B)
                .setFooter({ text: 'Esta ação é irreversível!' })
                .setTimestamp();

            // Criar botões de confirmação
            const confirmButton = new ButtonBuilder()
                .setCustomId(`confirm_sell_${cardId}`)
                .setLabel('✅ Confirmar Venda')
                .setStyle(ButtonStyle.Success);

            const cancelButton = new ButtonBuilder()
                .setCustomId(`cancel_sell_${cardId}`)
                .setLabel('❌ Cancelar')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder()
                .addComponents(confirmButton, cancelButton);

            // Responder com a confirmação
            await interaction.reply({
                embeds: [confirmEmbed],
                components: [row],
                ephemeral: true
            });

            // Coletor de interações para os botões
            const collectorFilter = (i) => i.user.id === interaction.user.id;
            let hasResponded = false; // Flag para controlar se já respondemos

            try {
                const collector = interaction.channel.createMessageComponentCollector({
                    filter: collectorFilter,
                    time: 30000, // Reduzido para 30 segundos para mais segurança
                    max: 1
                });

                collector.on('collect', async (i) => {
                    // Verificar se já respondemos ou se a interação já foi processada
                    if (hasResponded || i.replied || i.deferred) {
                        Logger.debug('Interação já foi processada, ignorando...');
                        return;
                    }

                    hasResponded = true; // Marcar que estamos processando

                    try {
                        // Verificar se a interação ainda é válida (não expirou)
                        const timeSinceCreated = Date.now() - i.createdTimestamp;
                        if (timeSinceCreated > 15 * 60 * 1000) { // 15 minutos
                            Logger.debug('Interação expirada, ignorando...');
                            return;
                        }

                        // Verificar se a interação ainda é válida (menos de 2 segundos para ser mais seguro)
                        if (timeSinceCreated > 2000) { // 2 segundos (margem de segurança maior)
                            Logger.debug('Interação muito próxima do timeout, ignorando...');
                            return;
                        }

                        if (i.customId === `confirm_sell_${cardId}`) {
                            // Processar a venda
                            // Verificar se a carta ainda existe
                            const stillExists = await getCardById(cardId, discordId);
                            if (!stillExists) {
                                await interaction.editReply({
                                    content: '❌ Esta carta não existe mais!',
                                    embeds: [],
                                    components: []
                                });
                                return;
                            }

                            // Deletar carta e atualizar coins
                            const deleteResult = await deleteCard(cardId, discordId);

                            if (deleteResult) {
                                const newBalance = player.purple_coins + sellPrice;
                                await updatePlayerPurpleCoins(discordId, newBalance);

                                // Embed de sucesso detalhado
                                const successEmbed = new EmbedBuilder()
                                    .setTitle('✅ VENDA REALIZADA COM SUCESSO!')
                                    .setDescription(`🎉 **Parabéns!** Você vendeu **${card.player_name}** ${playerAvatar} com sucesso!`)
                                    .addFields(
                                        { name: '🎴 Carta Vendida', value: `**${card.player_name}** (${card.position}) - Overall ${card.overall_rating}`, inline: false },
                                        { name: '💎 Raridade', value: card.rarity, inline: true },
                                        { name: '💰 Valor Recebido', value: `${sellPrice} Purple Coins`, inline: true },
                                        { name: '\u200b', value: '\u200b', inline: true },
                                        { name: '💳 Saldo Anterior', value: `${player.purple_coins} Purple Coins`, inline: true },
                                        { name: '💳 Novo Saldo', value: `${newBalance} Purple Coins`, inline: true },
                                        { name: '📈 Ganho Total', value: `+${sellPrice} Purple Coins`, inline: true }
                                    )
                                    .setColor(0x00FF00)
                                    .setTimestamp()
                                    .setFooter({ text: 'Transação concluída com sucesso! 💜' });

                                // Usar reply direto para evitar problemas de timing
                                try {
                                    await i.reply({
                                        embeds: [successEmbed],
                                        ephemeral: true
                                    });

                                    // Editar a mensagem original para remover os botões
                                    await interaction.editReply({
                                        embeds: [interaction.message?.embeds[0] || confirmEmbed],
                                        components: []
                                    });
                                } catch (replyError) {
                                    if (replyError.code === 10062) {
                                        Logger.debug('Interação expirada durante reply de sucesso, ignorando...');
                                    } else {
                                        Logger.error('Erro no reply de sucesso:', replyError);
                                        // Fallback: tentar editar a mensagem original
                                        try {
                                            await interaction.editReply({
                                                content: '✅ Venda realizada com sucesso!',
                                                embeds: [],
                                                components: []
                                            });
                                        } catch (editError) {
                                            Logger.error('Erro no fallback editReply:', editError);
                                        }
                                    }
                                }

                                Logger.transaction(`VENDA: ${interaction.user.tag} vendeu ${card.player_name} (ID: ${cardId}) por ${sellPrice} Purple Coins`);
                            } else {
                                try {
                                    await i.followUp({
                                        content: '❌ Erro ao processar a venda. Tente novamente.',
                                        ephemeral: true
                                    });
                                } catch (followUpError) {
                                    if (followUpError.code === 10062) {
                                        Logger.debug('Interação expirada durante followUp de erro, ignorando...');
                                    } else {
                                        Logger.error('Erro no followUp de erro:', followUpError);
                                    }
                                }
                            }

                        } else if (i.customId === `cancel_sell_${cardId}`) {
                            // Cancelar venda
                            const cancelEmbed = new EmbedBuilder()
                                .setTitle('❌ Venda Cancelada')
                                .setDescription('A venda foi cancelada com sucesso.')
                                .setColor(0xFF0000);

                            try {
                                await i.reply({
                                    embeds: [cancelEmbed],
                                    ephemeral: true
                                });

                                // Editar a mensagem original para remover os botões
                                await interaction.editReply({
                                    embeds: [interaction.message?.embeds[0] || confirmEmbed],
                                    components: []
                                });
                            } catch (replyError) {
                                if (replyError.code === 10062) {
                                    Logger.debug('Interação expirada durante reply de cancelamento, ignorando...');
                                } else {
                                    Logger.error('Erro no reply de cancelamento:', replyError);
                                    // Fallback
                                    try {
                                        await interaction.editReply({
                                            content: '❌ Venda cancelada.',
                                            embeds: [],
                                            components: []
                                        });
                                    } catch (editError) {
                                        Logger.error('Erro no fallback editReply cancelamento:', editError);
                                    }
                                }
                            }
                        }

                    } catch (sellError) {
                        console.error('Erro ao processar venda:', sellError);
                        hasResponded = false; // Reset do flag em caso de erro

                        // Verificar se é erro de interação desconhecida
                        if (sellError.code === 10062) {
                            Logger.debug('Interação expirada (10062) - ignorando...');
                            return;
                        }

                        // Usar editReply em vez de i.update
                        try {
                            await interaction.editReply({
                                content: '❌ Erro interno ao processar a venda. Tente novamente.',
                                embeds: [],
                                components: []
                            });
                        } catch (updateError) {
                            console.error('Erro ao atualizar interação:', updateError);
                        }
                    }
                });

                collector.on('end', async (collected, reason) => {
                    if (reason === 'time' && collected.size === 0) {
                        try {
                            await interaction.editReply({
                                content: '⏰ Tempo limite excedido. A venda foi cancelada.',
                                embeds: [],
                                components: []
                            });
                        } catch (editError) {
                            Logger.debug('Não foi possível editar a mensagem (timeout)');
                        }
                    }
                });

            } catch (collectorError) {
                console.error('Erro no coletor:', collectorError);
                await interaction.editReply({
                    content: '❌ Erro ao processar a interação. Tente novamente.',
                    embeds: [],
                    components: []
                });
            }

        } catch (error) {
            console.error('Erro no comando vender:', error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Ocorreu um erro ao processar a venda. Tente novamente.',
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: '❌ Ocorreu um erro ao processar a venda. Tente novamente.'
                });
            }
        }
    }
};
