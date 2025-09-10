const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPlayerByDiscordId, updatePlayerPurpleCoins } = require('../database/models/player');
const { getCardById, deleteCard } = require('../database/models/card');
const { generateCard, generateUpgradeCard } = require('../utils/cardGenerator');
const { createCard } = require('../database/models/card');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trocarjogadores')
        .setDescription('🔄 Fazer upgrade de cartas por raridade!')
        .addStringOption(option =>
            option.setName('raridade')
                .setDescription('Raridade das cartas que você quer trocar')
                .setRequired(true)
                .addChoices(
                    { name: '🐟 Bagre (3 = 1 Médio)', value: 'Bagre' },
                    { name: '🥈 Médio (4 = 1 GOAT)', value: 'Médio' },
                    { name: '🐐 GOAT (5 = 1 Prime)', value: 'GOAT' }
                ))
        .addIntegerOption(option =>
            option.setName('id1')
                .setDescription('ID da primeira carta')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('id2')
                .setDescription('ID da segunda carta')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('id3')
                .setDescription('ID da terceira carta')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('id4')
                .setDescription('ID da quarta carta (para Médio e GOAT)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('id5')
                .setDescription('ID da quinta carta (para GOAT)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const playerId = interaction.user.id;
            const raridade = interaction.options.getString('raridade');

            // Obter IDs das cartas especificadas
            const cardIds = [
                interaction.options.getInteger('id1'),
                interaction.options.getInteger('id2'),
                interaction.options.getInteger('id3'),
                interaction.options.getInteger('id4'),
                interaction.options.getInteger('id5')
            ].filter(id => id !== null);

            await interaction.deferReply();

            // Verificar se tem player
            let player = await getPlayerByDiscordId(playerId);
            if (!player) {
                return await interaction.editReply({
                    content: '❌ **JOGADOR NÃO ENCONTRADO!**\n' +
                        '🎮 Use `/registrartime` para se registrar primeiro!'
                });
            }

            // Configurar upgrade baseado na raridade
            let upgradeConfig;
            if (raridade === 'Bagre') {
                upgradeConfig = {
                    quantidadeNecessaria: 3,
                    raridadeDestino: 'Médio',
                    custo: 100,
                    nome: '3 Bagres → 1 Médio'
                };
            } else if (raridade === 'Médio') {
                upgradeConfig = {
                    quantidadeNecessaria: 4,
                    raridadeDestino: 'GOAT',
                    custo: 500,
                    nome: '4 Médios → 1 GOAT'
                };
            } else if (raridade === 'GOAT') {
                upgradeConfig = {
                    quantidadeNecessaria: 5,
                    raridadeDestino: 'Prime',
                    custo: 1600,
                    nome: '5 GOATs → 1 Prime'
                };
            }

            // Verificar se forneceu IDs suficientes
            if (cardIds.length < upgradeConfig.quantidadeNecessaria) {
                return await interaction.editReply({
                    content: `❌ **IDs INSUFICIENTES!**\n` +
                        `📊 Para ${upgradeConfig.nome} você precisa fornecer **${upgradeConfig.quantidadeNecessaria} IDs de cartas**\n` +
                        `🎴 Você forneceu: **${cardIds.length} IDs**\n\n` +
                        `💡 Use \`/minhascartas raridade:${raridade}\` para ver os IDs das suas cartas!`
                });
            }

            // Buscar e validar as cartas
            const cartasValidadas = [];

            for (const cardId of cardIds.slice(0, upgradeConfig.quantidadeNecessaria)) {
                const card = await getCardById(cardId, playerId);

                if (!card) {
                    return await interaction.editReply({
                        content: `❌ **CARTA #${cardId} NÃO ENCONTRADA!**\n` +
                            '🔍 Verifique se o ID está correto e se a carta é sua.'
                    });
                }

                if (card.rarity !== raridade) {
                    return await interaction.editReply({
                        content: `❌ **RARIDADE INCORRETA!**\n` +
                            `🎴 A carta #${cardId} (${card.player_name}) é **${card.rarity}**, mas você selecionou **${raridade}**\n` +
                            `💡 Use \`/minhascartas raridade:${raridade}\` para ver cartas da raridade correta!`
                    });
                }

                cartasValidadas.push(card);
            }

            // Verificar se tem Purple Coins suficientes
            if ((player.purple_coins || 0) < upgradeConfig.custo) {
                return await interaction.editReply({
                    content: `❌ **PURPLE COINS INSUFICIENTES!**\n` +
                        `💰 Você tem: **${player.purple_coins || 0} Purple Coins**\n` +
                        `💎 Custo do upgrade: **${upgradeConfig.custo} Purple Coins**\n` +
                        `📈 Você precisa de mais: **${upgradeConfig.custo - (player.purple_coins || 0)} Purple Coins**\n\n` +
                        `💡 Use \`/obter\` ou \`/comprarpacote\` para ganhar mais Purple Coins!`
                });
            }

            // Mostrar confirmação das cartas selecionadas
            let confirmText = `🔄 **${upgradeConfig.nome}**\n\n`;
            confirmText += `💰 **Custo:** ${upgradeConfig.custo} Purple Coins\n`;
            confirmText += `🎴 **Cartas que serão trocadas:**\n`;

            cartasValidadas.forEach((card, index) => {
                confirmText += `${index + 1}. #${card.id} - ${card.player_name} ${card.avatar || card.template_avatar || '⚽'} (${card.overall_rating} OVR)\n`;
            });

            confirmText += `\n✨ **Você receberá:** 1 carta **${upgradeConfig.raridadeDestino}** aleatória\n`;
            confirmText += `⚠️ **Esta ação é irreversível!**`;

            const embed = new EmbedBuilder()
                .setColor('#FF6600')
                .setTitle('🔄 Confirmar Upgrade de Cartas')
                .setDescription(confirmText)
                .setTimestamp()
                .setFooter({ text: 'HaxBall DreamTeam • Troca de Cartas' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`upgrade_confirm_${playerId}_${Date.now()}`)
                        .setLabel('✅ Confirmar Upgrade')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`upgrade_cancel_${playerId}`)
                        .setLabel('❌ Cancelar')
                        .setStyle(ButtonStyle.Danger)
                );

            // Salvar dados temporariamente (usando uma estrutura simples)
            if (!interaction.client.upgradeData) {
                interaction.client.upgradeData = new Map();
            }

            interaction.client.upgradeData.set(playerId, {
                cartasValidadas,
                upgradeConfig,
                timestamp: Date.now()
            });

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erro no comando trocarjogadores:', error);

            const errorMessage = {
                content: '❌ **Erro interno!**\n' +
                    'Algo deu errado ao processar o upgrade. Tente novamente.'
            };

            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply({ ...errorMessage, ephemeral: true });
            }
        }
    },

    async handleUpgradeInteraction(interaction) {
        try {
            const customId = interaction.customId;
            const [action, status, userId, timestamp] = customId.split('_');

            if (interaction.user.id !== userId) {
                return await interaction.reply({
                    content: '❌ Apenas o autor do comando pode confirmar!',
                    ephemeral: true
                });
            }

            if (status === 'cancel') {
                await interaction.update({
                    content: '❌ **Upgrade cancelado!**',
                    embeds: [],
                    components: []
                });
                return;
            }

            if (status === 'confirm') {
                await interaction.deferUpdate();

                const upgradeData = interaction.client.upgradeData?.get(userId);
                if (!upgradeData) {
                    return await interaction.editReply({
                        content: '❌ **Dados de upgrade expirados!** Use o comando novamente.',
                        embeds: [],
                        components: []
                    });
                }

                const { cartasValidadas, upgradeConfig } = upgradeData;

                try {
                    // Deletar as cartas antigas
                    for (const card of cartasValidadas) {
                        await deleteCard(card.id, userId);
                    }

                    // Deduzir Purple Coins
                    const player = await getPlayerByDiscordId(userId);
                    const newBalance = (player.purple_coins || 0) - upgradeConfig.custo;
                    await updatePlayerPurpleCoins(userId, newBalance);

                    // Gerar nova carta da raridade específica garantida!
                    const newCard = await generateUpgradeCard(upgradeConfig.raridadeDestino);

                    if (!newCard) {
                        return await interaction.editReply({
                            content: '❌ **Erro ao gerar nova carta!** Contate um administrador.',
                            embeds: [],
                            components: []
                        });
                    }

                    // Salvar nova carta
                    const newCardId = await createCard({
                        discord_id: userId,
                        template_id: newCard.template_id,
                        player_name: newCard.player_name,
                        position: newCard.position,
                        rarity: newCard.rarity,
                        overall_rating: newCard.overall,
                        avatar: newCard.avatar,
                        stats: newCard.stats,
                        posicionamento: newCard.stats?.posicionamento || 0,
                        saidaDeBola: newCard.stats?.saidaDeBola || 0,
                        defesa: newCard.stats?.defesa || 0,
                        drible: newCard.stats?.drible || 0,
                        passe: newCard.stats?.passe || 0,
                        finalizacao: newCard.stats?.finalizacao || 0
                    });

                    // Limpar dados temporários
                    interaction.client.upgradeData?.delete(userId);

                    // Mostrar resultado
                    const resultEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('✅ Upgrade Realizado com Sucesso!')
                        .setDescription(`🎉 **Parabéns!** Seu upgrade foi concluído!\n\n` +
                            `🎴 **Nova carta obtida:**\n` +
                            `#${newCardId} - ${newCard.player_name} ${newCard.avatar || '⚽'}\n` +
                            `⭐ Overall: ${newCard.overall} | 💎 Raridade: ${newCard.rarity}\n\n` +
                            `� **Atributos:**\n` +
                            `📍 Posicionamento: ${newCard.stats?.posicionamento || 0}\n` +
                            `🏃 Saída de Bola: ${newCard.stats?.saidaDeBola || 0}\n` +
                            `🛡️ Defesa: ${newCard.stats?.defesa || 0}\n` +
                            `⚡ Drible: ${newCard.stats?.drible || 0}\n` +
                            `🎯 Passe: ${newCard.stats?.passe || 0}\n` +
                            `⚽ Finalização: ${newCard.stats?.finalizacao || 0}\n\n` +
                            `�💰 **Saldo atual:** ${newBalance} Purple Coins`)
                        .setTimestamp()
                        .setFooter({ text: 'HaxBall DreamTeam • Upgrade Concluído' });

                    await interaction.editReply({
                        embeds: [resultEmbed],
                        components: []
                    });

                } catch (upgradeError) {
                    console.error('Erro ao processar upgrade:', upgradeError);
                    await interaction.editReply({
                        content: '❌ **Erro ao processar upgrade!** Tente novamente ou contate um administrador.',
                        embeds: [],
                        components: []
                    });
                }
            }

        } catch (error) {
            console.error('Erro no handleUpgradeInteraction:', error);
            await interaction.reply({
                content: '❌ **Erro interno!** Tente novamente.',
                ephemeral: true
            });
        }
    }
};
