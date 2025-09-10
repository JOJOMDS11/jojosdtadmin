const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getPlayerByDiscordId } = require('../database/models/player');
const { getCardById } = require('../database/models/card');
const { generateSimpleCardImage } = require('../utils/simpleImageGenerator');
const { convertAvatarCode } = require('../utils/avatarConverter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mostrarcarta')
        .setDescription('🎴 Mostrar detalhes de uma carta específica com imagem!')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('ID da carta que você quer ver')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const playerId = interaction.user.id;
            const cardId = interaction.options.getInteger('id');

            await interaction.deferReply(); // Público para todos verem

            // Verificar se tem player
            let player = await getPlayerByDiscordId(playerId);
            if (!player) {
                return await interaction.editReply({
                    content: '❌ **JOGADOR NÃO ENCONTRADO!**\n' +
                        '🎮 Use `/registrartime` para se registrar primeiro!'
                });
            }

            // Buscar a carta
            const card = await getCardById(cardId, playerId);

            if (!card) {
                return await interaction.editReply({
                    content: `❌ **CARTA #${cardId} NÃO ENCONTRADA!**\n` +
                        '🔍 Verifique se o ID está correto e se a carta é sua.'
                });
            }

            // Definir cores por raridade
            const cores = {
                'Bagre': '#8B4513',
                'Médio': '#C0C0C0',
                'Prime': '#FFD700',
                'GOAT': '#9D4EDD'
            };

            const cor = cores[card.rarity] || '#FFFFFF';

            // Definir emojis por raridade
            const emojis = {
                'Bagre': '🐟',
                'Médio': '🥈',
                'Prime': '⭐',
                'GOAT': '🐐'
            };

            const emoji = emojis[card.rarity] || '🎴';

            // Stats específicos por posição
            let statsText = '';
            if (card.stats) {
                if (card.position === 'GK') {
                    statsText = `🥅 **POS:** ${card.stats.posicionamento || 60}\n` +
                        `🧤 **SAI:** ${card.stats.saidaDeBola || 60}\n` +
                        `🛡️ **DEF:** ${card.stats.defesa || 60}\n` +
                        `⚽ **DRI:** ${card.stats.drible || 60}`;
                } else if (card.position === 'VL') {
                    statsText = `🛡️ **DEF:** ${card.stats.defesa || 60}\n` +
                        `⚽ **DRI:** ${card.stats.drible || 60}\n` +
                        `🎯 **PAS:** ${card.stats.passe || 60}\n` +
                        `🥅 **FIN:** ${card.stats.finalizacao || 60}`;
                } else if (card.position === 'PV') {
                    statsText = `📍 **POS:** ${card.stats.posicionamento || 60}\n` +
                        `⚽ **DRI:** ${card.stats.drible || 60}\n` +
                        `🎯 **PAS:** ${card.stats.passe || 60}\n` +
                        `🥅 **FIN:** ${card.stats.finalizacao || 60}`;
                }
            } else {
                statsText = 'Stats não disponíveis';
            }

            // 🎨 SEMPRE gerar imagem da carta!
            let cardImageAttachment = null;
            try {
                console.log('🎨 Gerando imagem da carta...');
                const imageBuffer = await generateSimpleCardImage({
                    ...card,
                    player_name: card.player_name,
                    overall: card.overall_rating,
                    id: card.id
                });

                if (imageBuffer) {
                    cardImageAttachment = new AttachmentBuilder(imageBuffer, {
                        name: `carta_${card.player_name.replace(/\s+/g, '_')}_${card.id}.png`
                    });
                    console.log('✅ Imagem da carta gerada com sucesso!');
                }
            } catch (imageError) {
                console.warn('⚠️ Erro ao gerar imagem da carta:', imageError.message);
            }

            // Converter o avatar de código para emoji real
            const playerAvatar = convertAvatarCode(card.avatar || card.template_avatar);

            // Criar embed da carta
            const embed = new EmbedBuilder()
                .setColor(cor)
                .setTitle(`${emoji} ${card.player_name} ${playerAvatar}`)
                .setDescription(`🎴 **Carta ID:** \`#${card.id}\`\n📍 **Posição:** ${card.position}\n⭐ **Overall:** ${card.overall_rating}`)
                .addFields(
                    { name: '💎 Raridade', value: `${emoji} ${card.rarity}`, inline: true },
                    { name: '💰 Valor de Venda', value: `${getCardSellPrice(card.rarity)} Purple Coins`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true }, // Campo vazio para alinhar
                    { name: '📊 Estatísticas Detalhadas', value: statsText, inline: false }
                );

            // Adicionar estatísticas específicas baseadas na posição
            if (card.position === 'GK') {
                embed.addFields(
                    { name: '🥅 Stats de Goleiro', value: `🏟️ **Jogos:** ${card.games_played || 0}\n🥅 **Gols Sofridos:** ${card.goals_conceded || 0}\n🛡️ **Jogos sem Sofrer Gols:** ${card.clean_sheets || 0}\n⚽ **Gols Contra:** ${card.own_goals || 0}`, inline: true },
                    { name: '📈 Performance de Goleiro', value: `🎯 **Média Gols/Jogo:** ${card.games_played > 0 ? ((card.goals_conceded || 0) / card.games_played).toFixed(2) : '0.00'}\n📊 **% Clean Sheets:** ${card.games_played > 0 ? (((card.clean_sheets || 0) / card.games_played) * 100).toFixed(1) : '0.0'}%`, inline: true }
                );
            } else {
                embed.addFields(
                    { name: '🎮 Histórico de Jogos', value: `🏟️ **Jogos:** ${card.games_played || 0}\n⚽ **Gols:** ${card.goals || 0}\n🎯 **Assistências:** ${card.assists || 0}\n🔄 **Gols Contra:** ${card.own_goals || 0}`, inline: true },
                    { name: '📈 Performance', value: `🎯 **Média de Gols:** ${card.games_played > 0 ? ((card.goals || 0) / card.games_played).toFixed(2) : '0.00'}\n📊 **Média de Assists:** ${card.games_played > 0 ? ((card.assists || 0) / card.games_played).toFixed(2) : '0.00'}`, inline: true }
                );
            }

            embed.setTimestamp()
                .setFooter({
                    text: `HaxBall DreamTeam • Carta de ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            // Adicionar imagem da carta se disponível
            if (cardImageAttachment) {
                embed.setImage(`attachment://${cardImageAttachment.name}`);
            }

            // Adicionar informações extras baseadas na raridade
            if (card.rarity === 'GOAT') {
                embed.addFields({
                    name: '🐐 Status Especial',
                    value: '**GOAT** - Greatest of All Time!\nCarta lendária com stats superiores.',
                    inline: false
                });
            } else if (card.rarity === 'Prime') {
                embed.addFields({
                    name: '⭐ Status Especial',
                    value: '**PRIME** - Carta premium de elite!\nMáximo desempenho garantido.',
                    inline: false
                });
            }

            // Responder SEMPRE com a imagem da carta
            const responseData = { embeds: [embed] };
            if (cardImageAttachment) {
                responseData.files = [cardImageAttachment];
            }

            await interaction.editReply(responseData);

        } catch (error) {
            console.error('Erro no comando mostrarcarta:', error);

            const errorMessage = {
                content: '❌ **Erro interno!**\n' +
                    'Algo deu errado ao mostrar a carta. Tente novamente.'
            };

            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply({ ...errorMessage, ephemeral: true });
            }
        }
    }
};

// Função para obter preço de venda da carta
function getCardSellPrice(rarity) {
    const prices = {
        'Prime': 1000,
        'GOAT': 500,
        'Médio': 200,
        'Bagre': 50
    };
    return prices[rarity] || 50;
}
