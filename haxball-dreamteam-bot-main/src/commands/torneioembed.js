const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('torneioembed')
        .setDescription('🏆 Criar embed de torneio para inscrições (apenas ADM)')
        .addStringOption(option =>
            option.setName('nome')
                .setDescription('Nome do torneio')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('data')
                .setDescription('Data do torneio (ex: 15/09/2025)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('horario')
                .setDescription('Horário do torneio (ex: 20:00)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('formato')
            .setDescription('Formato do torneio')
            .addChoices(
                { name: 'Mata-mata', value: 'Mata-mata' },
                { name: 'Grupos', value: 'Grupos' },
                { name: 'Liga', value: 'Liga' }
            )
            .setRequired(false))
        .addIntegerOption(option =>
            option.setName('max_times')
                .setDescription('Número máximo de times (padrão: 8)')
                .setMinValue(4)
                .setMaxValue(32)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('premio_1')
                .setDescription('Prêmio 1º lugar em Purple Coins (padrão: 1000)')
                .setMinValue(0)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('premio_2')
                .setDescription('Prêmio 2º lugar em Purple Coins (padrão: 500)')
                .setMinValue(0)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('premio_3')
                .setDescription('Prêmio 3º lugar em Purple Coins (padrão: 250)')
                .setMinValue(0)
                .setRequired(false)),

    async execute(interaction) {
        try {
            // Verificar permissões de administrador
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: '❌ **ACESSO NEGADO!**\n🔒 Apenas administradores podem criar embeds de torneio.',
                    ephemeral: true
                });
            }

            const nome = interaction.options.getString('nome');
            const data = interaction.options.getString('data');
            const horario = interaction.options.getString('horario');
            const formato = interaction.options.getString('formato') || 'Mata-mata';
            const maxTimes = interaction.options.getInteger('max_times') || 8;
            const premio1 = interaction.options.getInteger('premio_1') || 1000;
            const premio2 = interaction.options.getInteger('premio_2') || 500;
            const premio3 = interaction.options.getInteger('premio_3') || 250;

            await interaction.deferReply();

            // Criar embed do torneio
            const embed = new EmbedBuilder()
                .setTitle(`🏆 ${nome}`)
                .setDescription('**Torneio de Haxball DreamTeam**\n\n📋 **Clique nos botões abaixo para participar!**')
                .addFields(
                    { name: '📅 Data', value: data, inline: true },
                    { name: '🕐 Horário', value: horario, inline: true },
                    { name: '⚽ Formato', value: formato, inline: true },
                    { name: '👥 Vagas', value: `0/${maxTimes} times`, inline: true },
                    { name: '🎖️ Status', value: '🟢 **INSCRIÇÕES ABERTAS**', inline: true },
                    { name: '💰 Prêmios', value: `🥇 ${premio1}💜\n🥈 ${premio2}💜\n🥉 ${premio3}💜`, inline: true },
                    { name: '📋 Regras', value: '• Times completos (GK, VL, PV)\n• Escalação obrigatória\n• Fair play sempre', inline: false },
                    { name: '📞 Contato', value: 'Dúvidas? Entre em contato com a administração', inline: false }
                )
                .setColor(0x7289DA)
                .setTimestamp()
                .setFooter({ 
                    text: 'HaxBall DreamTeam • Boa sorte!',
                    iconURL: interaction.client.user.displayAvatarURL()
                });

            // Criar botões de interação
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`inscricao_torneio_${nome.replace(/\s+/g, '_')}`)
                        .setLabel('🎮 INSCREVER MEU TIME')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎮'),
                    new ButtonBuilder()
                        .setCustomId(`participantes_torneio_${nome.replace(/\s+/g, '_')}`)
                        .setLabel('👥 VER PARTICIPANTES')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('👥'),
                    new ButtonBuilder()
                        .setCustomId(`regras_torneio_${nome.replace(/\s+/g, '_')}`)
                        .setLabel('📋 REGRAS COMPLETAS')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📋')
                );

            // Responder com o embed e botões
            await interaction.editReply({
                embeds: [embed],
                components: [buttons]
            });

            // Log para auditoria
            console.log(`🏆 ${interaction.user.tag} criou embed de torneio: ${nome}`);

        } catch (error) {
            console.error('Erro no comando torneioembed:', error);

            const errorMessage = {
                content: '❌ **Erro interno!**\n' +
                    'Algo deu errado ao criar o embed do torneio. Tente novamente.'
            };

            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply({ ...errorMessage, ephemeral: true });
            }
        }
    }
};
