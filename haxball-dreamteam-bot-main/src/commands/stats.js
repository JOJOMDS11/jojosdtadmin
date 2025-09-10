const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayerByDiscordId } = require('../database/models/player');
const { getUserCards } = require('../database/models/card');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Mostra as estatísticas de uma carta específica do seu elenco')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('ID da carta')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const discordId = interaction.user.id;
            const cardId = interaction.options.getInteger('id');

            // Responder imediatamente
            await interaction.deferReply();

            // Buscar ou criar jogador automaticamente
            let player = await getPlayerByDiscordId(discordId);
            if (!player) {
                // Auto-criar jogador para ver stats
                const { createPlayer } = require('../database/models/player');
                const playerData = {
                    discord_id: discordId,
                    username: interaction.user.username,
                    purple_coins: 0,
                    wins: 0,
                    losses: 0,
                    last_obtained_time: null,
                    team_name: null
                };
                player = await createPlayer(playerData);
                console.log(`🆕 Jogador criado automaticamente para stats: ${interaction.user.username}`);
            }

            // Buscar a carta específica
            const { getCardById } = require('../database/models/card');
            const card = await getCardById(cardId, discordId);

            if (!card) {
                return await interaction.editReply({
                    content: `❌ **CARTA #${cardId} NÃO ENCONTRADA!**\n` +
                        '🔍 Verifique se o ID está correto e se a carta é sua.\n' +
                        '💡 Use `/minhascartas` para ver seus IDs.',
                });
            }

            // Função para gerar bolinha colorida baseada no overall
            const generateHaxBall = (overall) => {
                if (overall >= 91) return '🟣'; // Roxo - Prime
                else if (overall >= 81) return '🔴'; // Vermelho - GOAT  
                else if (overall >= 71) return '🟡'; // Amarelo - Médio
                else return '⚪'; // Branco - Bagre
            };

            // Determinar cor por raridade
            const raridadeCores = {
                'Bagre': '#6B7280',   // Cinza
                'Médio': '#EAB308',   // Amarelo  
                'GOAT': '#DC2626',    // Vermelho
                'Prime': '#8B5CF6'    // Roxo
            };

            // Determinar emoji da raridade
            const raridadeEmojis = {
                'Bagre': '🐟',
                'Médio': '🥈',
                'GOAT': '🐐',
                'Prime': '👑'
            };

            // Determinar emoji da posição
            const posicaoEmojis = {
                'GK': '🥅',
                'VL': '⚽',
                'PV': '🔥'
            };

            const overall = card.overall || 70;
            const haxBall = generateHaxBall(overall);

            // Gerar imagem da carta
            const { generateCardImage } = require('../utils/imageGenerator');
            const cardImageBuffer = await generateCardImage({
                player_name: card.player_name,
                position: card.position,
                overall: overall,
                rarity: card.rarity,
                avatar: card.avatar || '⚽',
                defense: card.defense || 60,
                dribble: card.dribble || 60,
                pass: card.pass || 60,
                finishing: card.finishing || 60,
                positioning: card.positioning || 60,
                speed: card.speed || 60,
                shooting: card.shooting || 60,
                physical: card.physical || 60
            });

            // Criar embed com estatísticas da carta
            const embed = new EmbedBuilder()
                .setColor(raridadeCores[card.rarity])
                .setTitle(`${haxBall} Stats de ${card.player_name}`)
                .setDescription(`${raridadeEmojis[card.rarity]} **${card.rarity}** | ${posicaoEmojis[card.position || 'VL']} **${card.position || 'VL'}** | ⭐ **${overall} OVR**`)
                .addFields(
                    { name: '📍 Posicionamento', value: `${card.positioning || 60}`, inline: true },
                    { name: '⚽ Finalização', value: `${card.finishing || 60}`, inline: true },
                    { name: '🎯 Passe', value: `${card.pass || 60}`, inline: true },
                    { name: '⚡ Drible', value: `${card.dribble || 60}`, inline: true },
                    { name: '🛡️ Defesa', value: `${card.defense || 60}`, inline: true },
                    { name: '🏃 Velocidade', value: `${card.speed || 60}`, inline: true },
                    { name: '� Chute', value: `${card.shooting || 60}`, inline: true },
                    { name: '� Físico', value: `${card.physical || 60}`, inline: true },
                    { name: '🔢 ID da Carta', value: `#${card.id}`, inline: true }
                )
                .setFooter({
                    text: `Carta de ${interaction.user.username} | Use /minhascartas para ver todas as cartas | Admin: jojosdtadmin.vercel.app`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            // Adicionar imagem se foi gerada
            if (cardImageBuffer) {
                embed.setThumbnail('attachment://card.png');
                await interaction.editReply({ 
                    embeds: [embed],
                    files: [{ attachment: cardImageBuffer, name: 'card.png' }]
                });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Erro ao buscar estatísticas da carta:', error);

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Erro no Sistema')
                .setDescription('Houve um erro ao buscar as estatísticas da carta.')
                .addFields(
                    { name: '🐛 Erro', value: error.message, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
