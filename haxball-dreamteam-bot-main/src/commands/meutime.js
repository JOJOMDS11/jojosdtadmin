const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayerByDiscordId } = require('../database/models/player');
const { getTeamByOwner } = require('../database/models/team');
const { getCardById } = require('../database/models/card');

const meutime = async (interaction) => {
    try {
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

        // Buscar cartas da escalação
        const escalacao = {};
        let escalacaoCompleta = true;

        if (team.gk_card_id) {
            escalacao.gk = await getCardById(team.gk_card_id, playerId);
        } else {
            escalacaoCompleta = false;
        }

        if (team.vl_card_id) {
            escalacao.vl = await getCardById(team.vl_card_id, playerId);
        } else {
            escalacaoCompleta = false;
        }

        if (team.pv_card_id) {
            escalacao.pv = await getCardById(team.pv_card_id, playerId);
        } else {
            escalacaoCompleta = false;
        }

        // Emojis de raridade
        const rarityEmojis = {
            'Prime': '💎✨',
            'GOAT': '🏆🔥',
            'Médio': '⭐💫',
            'Bagre': '🐟💧'
        };

        // Cor do embed baseada no status da escalação
        const embedColor = escalacaoCompleta ? 0x00FF00 : 0xFF9900; // Verde se completa, laranja se incompleta

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`⚽ ${team.name} - ESCALAÇÃO ATUAL ⚽`)
            .setDescription(`**Dono:** ${interaction.user.username}\n**Status:** ${escalacaoCompleta ? '✅ Escalação Completa' : '⚠️ Escalação Incompleta'}`);

        // Função para formatar informações de jogador
        const formatarJogador = (card, posicao, emoji) => {
            if (!card) {
                return `${emoji} **POSIÇÃO VAGA**\n❌ Use \`/escalar posicao:${posicao.toLowerCase()} carta_id:ID\``;
            }

            const avatar = card.avatar || card.template_avatar || '⚽';
            const statsDetalhadas = card.stats ? 
                `📊 **Stats:** DEF:${card.stats.defesa || card.defesa || 0} | DRI:${card.stats.drible || card.drible || 0} | PAS:${card.stats.passe || card.passe || 0} | FIN:${card.stats.finalizacao || card.finalizacao || 0}` :
                `📊 **Stats:** DEF:${card.defesa || 0} | DRI:${card.drible || 0} | PAS:${card.passe || 0} | FIN:${card.finalizacao || 0}`;

            return `${emoji} **${card.player_name}** ${avatar}\n` +
                `${rarityEmojis[card.rarity]} **${card.rarity}** | Overall: **${card.overall_rating}** | ID: \`#${card.id}\`\n` +
                statsDetalhadas;
        };

        // Adicionar campos da escalação
        embed.addFields(
            {
                name: '🥅 GOLEIRO (GK)',
                value: formatarJogador(escalacao.gk, 'GK', '🥅'),
                inline: false
            },
            {
                name: '⚽ VOLANTE (VL)',
                value: formatarJogador(escalacao.vl, 'VL', '⚽'),
                inline: false
            },
            {
                name: '🎯 PIVÔ (PV)',
                value: formatarJogador(escalacao.pv, 'PV', '🎯'),
                inline: false
            }
        );

        // Adicionar estatísticas do time se escalação completa
        if (escalacaoCompleta) {
            const overallTotal = escalacao.gk.overall_rating + escalacao.vl.overall_rating + escalacao.pv.overall_rating;
            const overallMedio = Math.round(overallTotal / 3);

            embed.addFields({
                name: '📈 ESTATÍSTICAS DO TIME',
                value: `⭐ **Overall Médio:** ${overallMedio}\n` +
                    `🔢 **Overall Total:** ${overallTotal}\n` +
                    `🏆 **Status:** Pronto para desafios!`,
                inline: false
            });
        } else {
            embed.addFields({
                name: '⚠️ AÇÕES NECESSÁRIAS',
                value: '🔹 Complete sua escalação usando `/escalar`\n' +
                    '🔹 Depois use `/desafiar` para jogar contra outros jogadores!\n' +
                    '🔹 Use `/minhascartas` para ver suas cartas disponíveis',
                inline: false
            });
        }

        embed.setFooter({
            text: 'Use /escalar para alterar jogadores | /desafiar para jogar',
            icon_url: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Erro no comando meutime:', error);
        await interaction.editReply({
            content: '❌ Erro interno no sistema. Tente novamente.'
        });
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meutime')
        .setDescription('Ver a escalação atual do seu time com detalhes dos jogadores'),
    execute: meutime
};
