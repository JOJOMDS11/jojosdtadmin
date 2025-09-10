const { SlashCommandBuilder } = require('discord.js');
const { getUserCards, getUserCardCount } = require('../database/models/card');
const { RARITY_COLORS } = require('../utils/rarity');

const elenco = async (interaction) => {
    try {
        const userId = interaction.user.id;

        // Função para gerar bolinha colorida baseada na raridade
        const generateHaxBall = (rarity) => {
            if (rarity === 'Prime') return '🟣'; // Roxo - Prime
            else if (rarity === 'GOAT') return '🔴'; // Vermelho - GOAT  
            else if (rarity === 'Médio') return '🟡'; // Amarelo - Médio
            else return '⚪'; // Branco - Bagre
        };

        // Buscar cartas do usuário
        const cards = await getUserCards(userId);
        const cardCount = await getUserCardCount(userId);

        if (cards.length === 0) {
            return await interaction.reply({
                content: '📋 **Seu Elenco está vazio!**\n\n' +
                    '🎁 Use `/pacote` para obter suas primeiras cartas!\n' +
                    '⏰ Pacotes disponíveis a cada 2 horas.',
                ephemeral: true
            });
        }

        // Organizar cartas por raridade
        const cardsByRarity = {
            'Prime': cards.filter(c => c.rarity === 'Prime'),
            'GOAT': cards.filter(c => c.rarity === 'GOAT'),
            'Médio': cards.filter(c => c.rarity === 'Médio'),
            'Bagre': cards.filter(c => c.rarity === 'Bagre')
        };

        // Criar embed principal
        const embed = {
            color: 0x8B5CF6, // Roxo
            title: `📋 Elenco de ${interaction.user.displayName}`,
            description: `**Total de cartas:** ${cardCount.total}\n\n` +
                `🟣 **Prime:** ${cardCount.prime || 0}\n` +
                `🔴 **GOAT:** ${cardCount.goat || 0}\n` +
                `🟡 **Médio:** ${cardCount.medio || 0}\n` +
                `⚪ **Bagre:** ${cardCount.bagre || 0}`,
            fields: [],
            timestamp: new Date(),
            footer: {
                text: `Use /minhascartas para filtrar cartas • Total: ${cardCount.total} cartas • Today at ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            }
        };

        // Adicionar top 10 cartas por overall
        const topCards = cards
            .sort((a, b) => b.overall_rating - a.overall_rating)
            .slice(0, 10);

        if (topCards.length > 0) {
            embed.fields.push({
                name: '🏆 Top 10 Cartas (por Overall)',
                value: topCards.map(card => {
                    // Mostrar 4 stats específicos por posição
                    let stats = '';
                    if (card.position === 'GK') {
                        stats = ` POS:${card.posicionamento || 0} SAI:${card.saidaDeBola || 0} DEF:${card.defesa || 0} DRI:${card.drible || 0}`;
                    } else if (card.position === 'VL') {
                        stats = ` DEF:${card.defesa || 0} DRI:${card.drible || 0} PAS:${card.passe || 0} FIN:${card.finalizacao || 0}`;
                    } else if (card.position === 'PV') {
                        stats = ` POS:${card.posicionamento || 0} DRI:${card.drible || 0} PAS:${card.passe || 0} FIN:${card.finalizacao || 0}`;
                    }
                    return `[${card.position}] ${generateHaxBall(card.rarity)} ${card.player_name} ${card.avatar || ''} - ${card.overall_rating} ⭐${stats} \`#${card.id}\``;
                }).join('\n'),
                inline: false
            });
        }

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });

    } catch (error) {
        console.error('Erro ao mostrar elenco:', error);
        await interaction.reply({
            content: '❌ Erro ao carregar elenco. Tente novamente.',
            ephemeral: true
        });
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('elenco')
        .setDescription('Ver seu elenco de cartas'),
    execute: elenco
};
