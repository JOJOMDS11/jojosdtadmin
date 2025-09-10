const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayerByDiscordId } = require('../database/models/player');
const { getTeamByOwner, updateTeamFormation } = require('../database/models/team');
const { getCardById } = require('../database/models/card');

const escalar = async (interaction) => {
    try {
        const posicao = interaction.options.getString('posicao');
        const cardId = interaction.options.getInteger('id');
        const playerId = interaction.user.id;

        await interaction.deferReply();

        // Verificar se tem player
        const player = await getPlayerByDiscordId(playerId);
        if (!player) {
            return await interaction.editReply({
                content: '❌ **JOGADOR NÃO ENCONTRADO!**\n' +
                    '🎮 Use `/obter` para começar a jogar!'
            });
        }

        // Verificar se tem time
        const team = await getTeamByOwner(playerId);
        if (!team) {
            return await interaction.editReply({
                content: '❌ **TIME NÃO ENCONTRADO!**\n' +
                    '🏆 Use `/registrartime` para criar seu time primeiro!'
            });
        }

        // Verificar se a carta existe e pertence ao jogador
        const carta = await getCardById(cardId, playerId);
        if (!carta) {
            return await interaction.editReply({
                content: `❌ **CARTA NÃO ENCONTRADA!**\n` +
                    `🎴 A carta com ID \`#${cardId}\` não existe ou não pertence a você.\n` +
                    `📋 Use \`/elenco\` para ver suas cartas disponíveis.`
            });
        }

        // Verificar se a posição da carta bate com a posição solicitada
        if (carta.position !== posicao) {
            return await interaction.editReply({
                content: `❌ **POSIÇÃO INCOMPATÍVEL!**\n` +
                    `⚽ A carta \`#${cardId}\` (**${carta.player_name}**) é um **${carta.position}**.\n` +
                    `🎯 Você está tentando escalar para **${posicao}**.\n\n` +
                    `� **Posições disponíveis:**\n` +
                    `🥅 **GK** - Goleiro\n` +
                    `🛡️ **VL** - Volante\n` +
                    `⚽ **PV** - Pivô`
            });
        }

        // Função para gerar bolinha colorida baseada na raridade
        const generateHaxBall = (rarity) => {
            if (rarity === 'Prime') return '🟣'; // Roxo - Prime
            else if (rarity === 'GOAT') return '🔴'; // Vermelho - GOAT  
            else if (rarity === 'Médio') return '🟡'; // Amarelo - Médio
            else return '⚪'; // Branco - Bagre
        };

        // Determinar qual campo atualizar no banco
        let updateField = '';
        let positionEmoji = '';
        let positionName = '';
        
        switch (posicao) {
            case 'GK':
                updateField = 'gk_card_id';
                positionEmoji = '🥅';
                positionName = 'GOLEIRO';
                break;
            case 'VL':
                updateField = 'vl_card_id';
                positionEmoji = '🛡️';
                positionName = 'VOLANTE';
                break;
            case 'PV':
                updateField = 'pv_card_id';
                positionEmoji = '⚽';
                positionName = 'PIVÔ';
                break;
            default:
                return await interaction.editReply({
                    content: `❌ **POSIÇÃO INVÁLIDA!**\n` +
                        `⚠️ Posições válidas: **GK**, **VL**, **PV**`
                });
        }

        try {
            // Atualizar escalação no banco
            const updateData = {};
            updateData[updateField] = cardId;
            await updateTeamFormation(team.id, updateData);

            // Obter stats específicos da posição para mostrar
            let statsText = '';
            if (posicao === 'GK') {
                statsText = `POS:${carta.posicionamento || 0} SAI:${carta.saidaDeBola || 0} DEF:${carta.defesa || 0} DRI:${carta.drible || 0}`;
            } else if (posicao === 'VL') {
                statsText = `DEF:${carta.defesa || 0} DRI:${carta.drible || 0} PAS:${carta.passe || 0} FIN:${carta.finalizacao || 0}`;
            } else if (posicao === 'PV') {
                statsText = `POS:${carta.posicionamento || 0} DRI:${carta.drible || 0} PAS:${carta.passe || 0} FIN:${carta.finalizacao || 0}`;
            }

            // Criar embed de confirmação
            const embed = new EmbedBuilder()
                .setColor(0x00FF00) // Verde para sucesso
                .setTitle(`${positionEmoji} ${positionName} ESCALADO!`)
                .setDescription(`✅ **Escalação atualizada com sucesso!**`)
                .addFields(
                    {
                        name: `${positionEmoji} **${positionName}**`,
                        value: `${generateHaxBall(carta.rarity)} **${carta.player_name}** ${carta.avatar || ''}\n` +
                            `⭐ **Overall:** ${carta.overall_rating}\n` +
                            `📊 **Stats:** ${statsText}\n` +
                            `🎴 **ID:** \`#${carta.id}\`\n` +
                            `💎 **Raridade:** ${carta.rarity}`,
                        inline: false
                    },
                    {
                        name: '🏆 **Time**',
                        value: `**${team.name}**\n` +
                            `👤 **Dono:** ${player.username}`,
                        inline: true
                    },
                    {
                        name: '📋 **Próximos Passos**',
                        value: `🔧 Continue escalando as outras posições\n` +
                            `👀 Use \`/meutime\` para ver a escalação completa\n` +
                            `⚔️ Use \`/desafiar\` para jogar contra outros times`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `Escalação manual • Use /escalar <posição> <id> para outras posições` 
                });

            await interaction.editReply({ embeds: [embed] });

        } catch (updateError) {
            console.error('Erro ao atualizar escalação:', updateError);
            await interaction.editReply({
                content: '❌ **ERRO AO ESCALAR!**\n' +
                    '⚠️ Houve um problema ao salvar sua escalação. Tente novamente.'
            });
        }

    } catch (error) {
        console.error('Erro no comando escalar:', error);
        
        if (interaction.deferred) {
            await interaction.editReply({
                content: '❌ **ERRO INTERNO!**\n' +
                    '⚠️ Ocorreu um erro inesperado. Tente novamente em alguns segundos.'
            });
        } else {
            await interaction.reply({
                content: '❌ **ERRO INTERNO!**\n' +
                    '⚠️ Ocorreu um erro inesperado. Tente novamente em alguns segundos.',
                ephemeral: true
            });
        }
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('escalar')
        .setDescription('Escalar uma carta específica para uma posição do seu time')
        .addStringOption(option =>
            option.setName('posicao')
                .setDescription('Posição para escalar a carta')
                .setRequired(true)
                .addChoices(
                    { name: '🥅 Goleiro (GK)', value: 'GK' },
                    { name: '🛡️ Volante (VL)', value: 'VL' },
                    { name: '⚽ Pivô (PV)', value: 'PV' }
                ))
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('ID da carta (use /elenco para ver suas cartas)')
                .setRequired(true)
                .setMinValue(1)),
    execute: escalar
};
