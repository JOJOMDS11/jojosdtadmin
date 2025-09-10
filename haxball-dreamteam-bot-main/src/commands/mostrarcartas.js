const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserCards, getCardsByRarity, getCardsByPlayerName } = require('../database/models/card');
const { RARITY_COLORS } = require('../utils/rarity');

// Mapa para armazenar dados de paginação com timeout de 5 minutos
const paginationData = new Map();

// Limpar dados antigos a cada 5 minutos
setInterval(() => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutos

    for (const [key, data] of paginationData.entries()) {
        if (now - data.timestamp > timeout) {
            paginationData.delete(key);
        }
    }
}, 60 * 1000); // Verificar a cada minuto

const mostrarcartas = async (interaction) => {
    try {
        const userId = interaction.user.id;
        const raridade = interaction.options.getString('raridade');
        const posicao = interaction.options.getString('posicao');
        const jogador = interaction.options.getString('jogador');
        const showStats = interaction.options.getBoolean('stats');
        const page = interaction.options.getInteger('pagina') || 1;

        // Função para gerar bolinha colorida baseada na raridade
        const generateHaxBall = (rarity) => {
            if (rarity === 'Prime') return '🟣'; // Roxo - Prime
            else if (rarity === 'GOAT') return '🔴'; // Vermelho - GOAT  
            else if (rarity === 'Médio') return '🟡'; // Amarelo - Médio
            else return '⚪'; // Branco - Bagre
        };

        // Responder de forma PRIVADA (apenas o usuário vê)
        await interaction.deferReply({ ephemeral: true });

        let allCards = [];
        let title = '';
        let description = '';

        try {
            // Primeiro buscar todas as cartas do usuário
            allCards = await getUserCards(userId);

            // Aplicar filtros
            if (raridade) {
                allCards = allCards.filter(card => card.rarity === raridade);
                title = `🎴 Suas cartas ${raridade}`;
                description = `Exibindo todas as cartas da raridade **${raridade}**`;
            }

            if (posicao) {
                allCards = allCards.filter(card => card.position === posicao);
                const positionName = posicao === 'GK' ? 'Goleiro' : posicao === 'VL' ? 'Volante' : 'Pivô';
                title = title ? `${title} - ${positionName}` : `🎴 Suas cartas de ${positionName}`;
                description = description ? `${description} na posição **${positionName}**` : `Exibindo todas as cartas da posição **${positionName}**`;
            }

            if (jogador) {
                allCards = allCards.filter(card => card.player_name.toLowerCase().includes(jogador.toLowerCase()));
                title = title ? `${title} - "${jogador}"` : `🔍 Buscando por "${jogador}"`;
                description = description ? `${description} com nome **${jogador}**` : `Cartas encontradas com o nome **${jogador}**`;
            }

            if (!title) {
                title = '🎴 Suas Cartas';
                description = `Todas as suas cartas`;
            }

            if (allCards.length === 0) {
                let noCardsMessage = '📋 **Nenhuma carta encontrada!**\n\n';

                if (raridade || posicao || jogador) {
                    noCardsMessage += 'Você não possui cartas com os filtros aplicados:\n';
                    if (raridade) noCardsMessage += `• Raridade: **${raridade}**\n`;
                    if (posicao) noCardsMessage += `• Posição: **${posicao}**\n`;
                    if (jogador) noCardsMessage += `• Jogador: **${jogador}**\n`;
                } else {
                    noCardsMessage += 'Você ainda não possui cartas!\n';
                }

                noCardsMessage += '\n🎴 Use `/obter` ou `/comprarpacote` para obter cartas!';

                return await interaction.editReply({
                    content: noCardsMessage
                });
            }

            // Configuração de paginação
            const cardsPerPage = 15;
            const totalPages = Math.ceil(allCards.length / cardsPerPage);
            const currentPage = Math.max(1, Math.min(page, totalPages));

            // Calcular índices para a página atual
            const startIndex = (currentPage - 1) * cardsPerPage;
            const endIndex = startIndex + cardsPerPage;
            const cardsToShow = allCards.slice(startIndex, endIndex);

            // Organizar cartas por raridade para exibição
            const cardsByRarity = {
                'Prime': cardsToShow.filter(c => c.rarity === 'Prime'),
                'GOAT': cardsToShow.filter(c => c.rarity === 'GOAT'),
                'Médio': cardsToShow.filter(c => c.rarity === 'Médio'),
                'Bagre': cardsToShow.filter(c => c.rarity === 'Bagre')
            };

            // Criar embed
            const embed = new EmbedBuilder()
                .setColor(raridade ? RARITY_COLORS[raridade] : 0x8B5CF6)
                .setTitle(title)
                .setDescription(`${description}\n\n**Total:** ${allCards.length} cartas | **Página:** ${currentPage}/${totalPages}`)
                .setTimestamp()
                .setFooter({
                    text: `Use os botões para navegar ou filtros para buscar cartas específicas`
                });

            // Adicionar campos por raridade
            for (const [rarity, rarityCards] of Object.entries(cardsByRarity)) {
                if (rarityCards.length > 0) {
                    const sortedCards = rarityCards.sort((a, b) => b.overall_rating - a.overall_rating);

                    let cardsText;
                    if (showStats) {
                        // Mostrar stats detalhados
                        cardsText = sortedCards
                            .map((card, index) => {
                                let statsText = '';

                                // Mostrar stats específicos por posição
                                if (card.position === 'GK') {
                                    statsText = `📊 DEF: ${card.stats?.defesa || 60} | DRI: ${card.stats?.drible || 60} | PAS: ${card.stats?.passe || 60} | FIN: ${card.stats?.finalizacao || 60}`;
                                } else if (card.position === 'VL') {
                                    statsText = `📊 DEF: ${card.stats?.defesa || 60} | DRI: ${card.stats?.drible || 60} | PAS: ${card.stats?.passe || 60} | FIN: ${card.stats?.finalizacao || 60}`;
                                } else if (card.position === 'PV') {
                                    statsText = `📊 DEF: ${card.stats?.defesa || 60} | DRI: ${card.stats?.drible || 60} | PAS: ${card.stats?.passe || 60} | FIN: ${card.stats?.finalizacao || 60}`;
                                }

                                return `[${card.position}] ${generateHaxBall(card.rarity)} ${card.player_name} ${card.template_avatar || card.avatar || 'P'} - ${card.overall_rating} ⭐ \`#${card.id}\`\n   ${statsText}`;
                            })
                            .join('\n');
                    } else {
                        // Formato padrão com 4 stats específicos por posição
                        cardsText = sortedCards
                            .map((card) => {
                                // Mostrar 4 stats específicos por posição
                                let stats = '';
                                if (card.stats) {
                                    if (card.position === 'GK') {
                                        stats = ` DEF:${card.stats.defesa || 60} DRI:${card.stats.drible || 60} PAS:${card.stats.passe || 60} FIN:${card.stats.finalizacao || 60}`;
                                    } else if (card.position === 'VL') {
                                        stats = ` DEF:${card.stats.defesa || 60} DRI:${card.stats.drible || 60} PAS:${card.stats.passe || 60} FIN:${card.stats.finalizacao || 60}`;
                                    } else if (card.position === 'PV') {
                                        stats = ` DEF:${card.stats.defesa || 60} DRI:${card.stats.drible || 60} PAS:${card.stats.passe || 60} FIN:${card.stats.finalizacao || 60}`;
                                    }
                                }
                                return `[${card.position}] ${generateHaxBall(card.rarity)} ${card.player_name} ${card.template_avatar || card.avatar || 'P'} - ${card.overall_rating} ⭐${stats} \`#${card.id}\``;
                            })
                            .join('\n');
                    }

                    embed.addFields({
                        name: `⭐ ${rarity} (${rarityCards.length})`,
                        value: cardsText,
                        inline: false
                    });
                }
            }

            // Se não há campos (não deveria acontecer), adicionar um campo geral
            if (embed.data.fields?.length === 0) {
                const cardsText = cardsToShow
                    .sort((a, b) => b.overall_rating - a.overall_rating)
                    .map((card) =>
                        `${card.player_name} ${card.template_avatar || card.avatar || 'P'} - ${card.overall_rating} ⭐ ${card.rarity} (ID: ${card.id})`
                    )
                    .join('\n');

                embed.addFields({
                    name: '🎴 Suas Cartas',
                    value: cardsText,
                    inline: false
                });
            }

            // Criar botões de navegação
            const components = [];
            if (totalPages > 1) {
                const paginationId = `${userId}_${Date.now()}`;

                // Armazenar dados para navegação
                paginationData.set(paginationId, {
                    userId,
                    allCards,
                    raridade,
                    posicao,
                    jogador,
                    showStats,
                    title,
                    description,
                    totalPages,
                    cardsPerPage,
                    timestamp: Date.now() // Adicionar timestamp
                });

                // Dados ficam ativos por 5 minutos

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`cards_first_${paginationId}`)
                            .setLabel('⏮️ Primeira')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === 1),
                        new ButtonBuilder()
                            .setCustomId(`cards_prev_${paginationId}`)
                            .setLabel('◀️ Anterior')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 1),
                        new ButtonBuilder()
                            .setCustomId(`cards_next_${paginationId}`)
                            .setLabel('▶️ Próxima')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === totalPages),
                        new ButtonBuilder()
                            .setCustomId(`cards_last_${paginationId}`)
                            .setLabel('⏭️ Última')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === totalPages)
                    );

                components.push(row);
            }

            await interaction.editReply({
                embeds: [embed],
                components
            });

        } catch (dbError) {
            console.error('Erro de banco de dados no mostrarcartas:', dbError);
            await interaction.editReply({
                content: '⚠️ Erro ao buscar cartas. Tente novamente em alguns instantes.'
            });
        }

    } catch (error) {
        console.error('Erro no comando mostrarcartas:', error);
        try {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Erro interno. Tente novamente.'
                });
            } else {
                await interaction.reply({
                    content: '❌ Erro interno. Tente novamente.',
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error('Erro ao responder erro:', replyError);
        }
    }
};

// Função para lidar com navegação de páginas
const handlePaginationInteraction = async (interaction) => {
    const customId = interaction.customId;
    const paginationId = customId.split('_').slice(2).join('_');
    const action = customId.split('_')[1];

    const data = paginationData.get(paginationId);
    if (!data) {
        return await interaction.reply({
            content: '⏰ **PAGINAÇÃO EXPIRADA!**\n\nEsta paginação não é mais válida (5 minutos). Use o comando novamente.',
            ephemeral: true
        });
    }

    // Verificar se é o usuário correto
    if (data.userId !== interaction.user.id) {
        return await interaction.reply({
            content: '❌ Apenas quem executou o comando pode navegar.',
            ephemeral: true
        });
    }

    await interaction.deferUpdate();

    // Calcular nova página
    let newPage = 1;
    const currentPage = Math.floor((interaction.message.embeds[0].description.match(/Página: (\d+)/) || [0, 1])[1]);

    switch (action) {
        case 'first':
            newPage = 1;
            break;
        case 'prev':
            newPage = Math.max(1, currentPage - 1);
            break;
        case 'next':
            newPage = Math.min(data.totalPages, currentPage + 1);
            break;
        case 'last':
            newPage = data.totalPages;
            break;
    }

    // Recalcular dados para a nova página
    const startIndex = (newPage - 1) * data.cardsPerPage;
    const endIndex = startIndex + data.cardsPerPage;
    const cardsToShow = data.allCards.slice(startIndex, endIndex);

    // Função auxiliar para gerar emoji
    const generateHaxBall = (rarity) => {
        if (rarity === 'Prime') return '🟣';
        else if (rarity === 'GOAT') return '🔴';
        else if (rarity === 'Médio') return '🟡';
        else return '⚪';
    };

    // Organizar cartas por raridade
    const cardsByRarity = {
        'Prime': cardsToShow.filter(c => c.rarity === 'Prime'),
        'GOAT': cardsToShow.filter(c => c.rarity === 'GOAT'),
        'Médio': cardsToShow.filter(c => c.rarity === 'Médio'),
        'Bagre': cardsToShow.filter(c => c.rarity === 'Bagre')
    };

    // Criar novo embed
    const embed = new EmbedBuilder()
        .setColor(data.raridade ? RARITY_COLORS[data.raridade] : 0x8B5CF6)
        .setTitle(data.title)
        .setDescription(`${data.description}\n\n**Total:** ${data.allCards.length} cartas | **Página:** ${newPage}/${data.totalPages}`)
        .setTimestamp()
        .setFooter({
            text: `Use os botões para navegar ou filtros para buscar cartas específicas`
        });

    // Adicionar campos por raridade
    for (const [rarity, rarityCards] of Object.entries(cardsByRarity)) {
        if (rarityCards.length > 0) {
            const sortedCards = rarityCards.sort((a, b) => b.overall_rating - a.overall_rating);

            const cardsText = sortedCards
                .map((card) => {
                    // Mostrar 4 stats específicos por posição
                    let stats = '';
                    if (card.stats) {
                        if (card.position === 'GK') {
                            stats = ` DEF:${card.stats.defesa || 60} DRI:${card.stats.drible || 60} PAS:${card.stats.passe || 60} FIN:${card.stats.finalizacao || 60}`;
                        } else if (card.position === 'VL') {
                            stats = ` DEF:${card.stats.defesa || 60} DRI:${card.stats.drible || 60} PAS:${card.stats.passe || 60} FIN:${card.stats.finalizacao || 60}`;
                        } else if (card.position === 'PV') {
                            stats = ` DEF:${card.stats.defesa || 60} DRI:${card.stats.drible || 60} PAS:${card.stats.passe || 60} FIN:${card.stats.finalizacao || 60}`;
                        }
                    }

                    return `[${card.position}] ${generateHaxBall(card.rarity)} ${card.player_name} ${card.template_avatar || card.avatar || 'P'} - ${card.overall_rating} ⭐${stats} \`#${card.id}\``;
                })
                .join('\n');

            embed.addFields({
                name: `⭐ ${rarity} (${rarityCards.length})`,
                value: cardsText,
                inline: false
            });
        }
    }

    // Atualizar botões
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`cards_first_${paginationId}`)
                .setLabel('⏮️ Primeira')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(newPage === 1),
            new ButtonBuilder()
                .setCustomId(`cards_prev_${paginationId}`)
                .setLabel('◀️ Anterior')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(newPage === 1),
            new ButtonBuilder()
                .setCustomId(`cards_next_${paginationId}`)
                .setLabel('▶️ Próxima')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(newPage === data.totalPages),
            new ButtonBuilder()
                .setCustomId(`cards_last_${paginationId}`)
                .setLabel('⏭️ Última')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(newPage === data.totalPages)
        );

    await interaction.editReply({
        embeds: [embed],
        components: [row]
    });
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mostrarcartas')
        .setDescription('🎴 Ver suas cartas com filtros e paginação (versão pública)')
        .addStringOption(option =>
            option.setName('raridade')
                .setDescription('Filtrar por raridade específica')
                .setRequired(false)
                .addChoices(
                    { name: '💎 Prime', value: 'Prime' },
                    { name: '🏆 GOAT', value: 'GOAT' },
                    { name: '⭐ Médio', value: 'Médio' },
                    { name: '🐟 Bagre', value: 'Bagre' }
                ))
        .addStringOption(option =>
            option.setName('posicao')
                .setDescription('Filtrar por posição específica')
                .setRequired(false)
                .addChoices(
                    { name: '🥅 Goleiro (GK)', value: 'GK' },
                    { name: '🛡️ Volante (VL)', value: 'VL' },
                    { name: '⚽ Pivô (PV)', value: 'PV' }
                ))
        .addStringOption(option =>
            option.setName('jogador')
                .setDescription('Buscar cartas por nome do jogador')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('stats')
                .setDescription('Mostrar estatísticas detalhadas das cartas')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('pagina')
                .setDescription('Número da página para visualizar')
                .setRequired(false)
                .setMinValue(1)),
    execute: mostrarcartas,
    handlePaginationInteraction
};
