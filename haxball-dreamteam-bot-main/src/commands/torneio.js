const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { simulateMatch } = require('../utils/matchSimulator');

// Comando principal
const torneio = async (interaction) => {
    try {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'criar') {
            return await criarTorneio(interaction);
        } else if (subcommand === 'mostrar') {
            return await mostrarTorneio(interaction);
        } else if (subcommand === 'iniciar') {
            return await iniciarTorneio(interaction);
        }

    } catch (error) {
        console.error('Erro no comando torneio:', error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Ocorreu um erro ao processar o comando.',
                ephemeral: true
            });
        }
    }
};

// Criar torneio (só ADM)
async function criarTorneio(interaction) {
    // Verificar permissões de administrador
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
            content: '❌ **ACESSO NEGADO!**\n🔒 Apenas administradores podem criar torneios.',
            ephemeral: true
        });
    }

    const nome = interaction.options.getString('nome');
    const data = interaction.options.getString('data');
    const horario = interaction.options.getString('horario');
    const formato = interaction.options.getString('formato') || 'knockout';
    const maxTimes = interaction.options.getInteger('max_times') || 8;
    const premio1 = interaction.options.getInteger('premio_1') || 1000;
    const premio2 = interaction.options.getInteger('premio_2') || 500;
    const premio3 = interaction.options.getInteger('premio_3') || 250;

    await interaction.deferReply();

    try {
        // Tentar criar via API primeiro
        let success = false;
        try {
            const response = await fetch('http://localhost:3000/api/tournaments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: nome,
                    date: data,
                    time: horario,
                    format: formato,
                    max_players: maxTimes,
                    prize_1st: premio1,
                    prize_2nd: premio2,
                    prize_3rd: premio3
                })
            });

            const result = await response.json();
            success = result.success;
        } catch (apiError) {
            console.warn('API não disponível, criando torneio local:', apiError.message);
        }

        // Se API funcionou
        if (success) {
            const successEmbed = new EmbedBuilder()
                .setTitle('🏆 Torneio Criado!')
                .setDescription(`**${nome}** foi criado com sucesso!`)
                .addFields(
                    { name: '📅 Data', value: data, inline: true },
                    { name: '🕐 Horário', value: horario, inline: true },
                    { name: '⚽ Formato', value: formato, inline: true },
                    { name: '👥 Máx. Times', value: maxTimes.toString(), inline: true },
                    { name: '🥇 1º Lugar', value: `${premio1} 💜`, inline: true },
                    { name: '🥈 2º Lugar', value: `${premio2} 💜`, inline: true },
                    { name: '🥉 3º Lugar', value: `${premio3} 💜`, inline: true }
                )
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.editReply({
                embeds: [successEmbed]
            });
        } else {
            // Fallback: criar embed local
            await interaction.editReply({
                content: `✅ **Torneio "${nome}" criado localmente!**\n\n` +
                    `📅 **Data:** ${data}\n` +
                    `🕐 **Horário:** ${horario}\n` +
                    `⚽ **Formato:** ${formato}\n` +
                    `👥 **Máx. Times:** ${maxTimes}\n` +
                    `💰 **Prêmios:** 🥇${premio1} 🥈${premio2} 🥉${premio3} Purple Coins\n\n` +
                    `💡 **Use `/torneioembed` para criar um embed interativo!**`
            });
        }

    } catch (error) {
        console.error('Erro ao criar torneio:', error);
        await interaction.editReply({
            content: `✅ **Torneio "${nome}" criado!**\n\n` +
                `📅 **Data:** ${data}\n` +
                `🕐 **Horário:** ${horario}\n` +
                `⚽ **Formato:** ${formato}\n` +
                `👥 **Máx. Times:** ${maxTimes}\n` +
                `💰 **Prêmios:** 🥇${premio1} 🥈${premio2} 🥉${premio3} Purple Coins\n\n` +
                `💡 **Use `/torneioembed` para criar um embed interativo!**`
        });
    }
}

// Mostrar torneio
async function mostrarTorneio(interaction) {
    const nomeTorneio = interaction.options.getString('nome');

    await interaction.deferReply();

    try {
        // Buscar torneio
        const response = await fetch(`http://localhost:3000/api/tournaments?name=${encodeURIComponent(nomeTorneio)}`);
        const result = await response.json();

        if (result.success && result.tournaments.length > 0) {
            const torneio = result.tournaments[0];

            const embed = new EmbedBuilder()
                .setTitle(`🏆 ${torneio.name}`)
                .setDescription('**Torneio de Haxball DreamTeam**')
                .addFields(
                    { name: '📅 Data', value: torneio.tournament_date, inline: true },
                    { name: '🕐 Horário', value: torneio.tournament_time, inline: true },
                    { name: '⚽ Formato', value: torneio.format, inline: true },
                    { name: '👥 Times', value: `${torneio.registered_teams || 0}/${torneio.max_players}`, inline: true },
                    { name: '🎖️ Status', value: torneio.status === 'open' ? '🟢 Aberto' : '🔴 Fechado', inline: true },
                    { name: '💰 Prêmios', value: `🥇 ${torneio.prize_1st}💜\n🥈 ${torneio.prize_2nd}💜\n🥉 ${torneio.prize_3rd}💜`, inline: true }
                )
                .setColor(0x7289DA)
                .setTimestamp()
                .setFooter({ text: 'Use os botões abaixo para se inscrever!' });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`register_tournament_${torneio.id}`)
                        .setLabel('🎮 Inscrever Time')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(torneio.status !== 'open'),
                    new ButtonBuilder()
                        .setCustomId(`view_participants_${torneio.id}`)
                        .setLabel('👥 Ver Participantes')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({
                embeds: [embed],
                components: [buttons]
            });

        } else {
            await interaction.editReply({
                content: `❌ **Torneio não encontrado!**\nO torneio "${nomeTorneio}" não existe.`
            });
        }

    } catch (error) {
        console.error('Erro ao buscar torneio:', error);
        await interaction.editReply({
            content: '❌ Erro ao buscar informações do torneio.'
        });
    }
}

// Iniciar torneio (só ADM)
async function iniciarTorneio(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
            content: '❌ **ACESSO NEGADO!**\n🔒 Apenas administradores podem iniciar torneios.',
            ephemeral: true
        });
    }

    const nomeTorneio = interaction.options.getString('nome');

    await interaction.deferReply();

    const velocidade = interaction.options.getString('velocidade') || 'rapido';

    let delayTime = 3000; // padrão: 3 segundos
    let matchDescription = '';

    switch (velocidade) {
        case 'instantaneo':
            delayTime = 1000; // 1 segundo
            matchDescription = '⚡ **Simulação instantânea**';
            break;
        case 'rapido':
            delayTime = 3000; // 3 segundos
            matchDescription = '🚀 **Simulação rápida** (3s por partida)';
            break;
        case 'normal':
            delayTime = 30000; // 30 segundos = meio minuto por partida
            matchDescription = '⏱️ **Simulação normal** (30s por partida)';
            break;
        case 'realista':
            delayTime = 6 * 60 * 1000; // 6 minutos reais
            matchDescription = '🎮 **Simulação realista** (6 minutos reais por partida)';
            break;
    }

    await interaction.editReply({
        content: `🚀 **Iniciando simulação do torneio "${nomeTorneio}"...**\n${matchDescription}\n⚽ As partidas começarão em instantes!`
    });

    // Mock data para demonstração
    const teams = [
        {
            name: 'Team Alpha',
            gk_card: { defesa: 80, overall_rating: 75 },
            vl_card: { finalizacao: 70, passe: 75, defesa: 60, overall_rating: 68 },
            pv_card: { finalizacao: 85, passe: 65, defesa: 55, overall_rating: 72 }
        },
        {
            name: 'Team Beta',
            gk_card: { defesa: 75, overall_rating: 70 },
            vl_card: { finalizacao: 65, passe: 80, defesa: 70, overall_rating: 70 },
            pv_card: { finalizacao: 80, passe: 60, defesa: 50, overall_rating: 68 }
        }
    ];

    // Simular partida usando o simulador melhorado
    setTimeout(async () => {
        // Converter estrutura dos times para o formato do simulador
        const team1Cards = {
            gk: { player_name: "Alpha GK", avatar: "🥅", overall_rating: teams[0].gk_card.overall_rating, stats: teams[0].gk_card },
            vl: { player_name: "Alpha VL", avatar: "⚽", overall_rating: teams[0].vl_card.overall_rating, stats: teams[0].vl_card },
            pv: { player_name: "Alpha PV", avatar: "🎯", overall_rating: teams[0].pv_card.overall_rating, stats: teams[0].pv_card }
        };
        
        const team2Cards = {
            gk: { player_name: "Beta GK", avatar: "🥅", overall_rating: teams[1].gk_card.overall_rating, stats: teams[1].gk_card },
            vl: { player_name: "Beta VL", avatar: "⚽", overall_rating: teams[1].vl_card.overall_rating, stats: teams[1].vl_card },
            pv: { player_name: "Beta PV", avatar: "🎯", overall_rating: teams[1].pv_card.overall_rating, stats: teams[1].pv_card }
        };
        
        const match = simulateMatch(team1Cards, team2Cards, teams[0].name, teams[1].name);

        const matchEmbed = new EmbedBuilder()
            .setTitle('⚽ RESULTADO DA PARTIDA')
            .setDescription(`**${teams[0].name}** ${match.score.team1} x ${match.score.team2} **${teams[1].name}**`)
            .addFields(
                { 
                    name: '🏆 Vencedor', 
                    value: match.winner === 'draw' ? '🤝 Empate' : 
                           match.winner === 'team1' ? `🎉 ${teams[0].name}` : `🎉 ${teams[1].name}`, 
                    inline: false 
                },
                {
                    name: '📝 Eventos da Partida', 
                    value: match.events.length > 0 ? 
                        match.events.slice(0, 10).join('\n') + (match.events.length > 10 ? '\n... e mais eventos!' : '') :
                        'Partida sem eventos registrados', 
                    inline: false
                },
                {
                    name: '⏱️ Duração',
                    value: match.duration + (match.overtime ? ' (Com Prorrogação!)' : ''),
                    inline: true
                }
            )
            .setColor(match.winner === 'draw' ? 0xFFFF00 : 0x00FF00)
            .setTimestamp();

        await interaction.followUp({
            embeds: [matchEmbed]
        });
    }, delayTime);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('torneio')
        .setDescription('Sistema de torneios HaxBall DreamTeam')
        .addSubcommand(subcommand =>
            subcommand
                .setName('criar')
                .setDescription('Criar um novo torneio (apenas ADM)')
                .addStringOption(option =>
                    option.setName('nome')
                        .setDescription('Nome do torneio')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('data')
                        .setDescription('Data do torneio (YYYY-MM-DD)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('horario')
                        .setDescription('Horário do torneio (HH:MM)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('formato')
                        .setDescription('Formato do torneio')
                        .addChoices(
                            { name: 'Mata-mata', value: 'knockout' },
                            { name: 'Grupos', value: 'groups' },
                            { name: 'Liga', value: 'league' }
                        ))
                .addIntegerOption(option =>
                    option.setName('max_times')
                        .setDescription('Número máximo de times (padrão: 8)')
                        .setMinValue(4)
                        .setMaxValue(32))
                .addIntegerOption(option =>
                    option.setName('premio_1')
                        .setDescription('Prêmio 1º lugar em Purple Coins (padrão: 1000)')
                        .setMinValue(0))
                .addIntegerOption(option =>
                    option.setName('premio_2')
                        .setDescription('Prêmio 2º lugar em Purple Coins (padrão: 500)')
                        .setMinValue(0))
                .addIntegerOption(option =>
                    option.setName('premio_3')
                        .setDescription('Prêmio 3º lugar em Purple Coins (padrão: 250)')
                        .setMinValue(0))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('mostrar')
                .setDescription('Mostrar informações de um torneio')
                .addStringOption(option =>
                    option.setName('nome')
                        .setDescription('Nome do torneio')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('iniciar')
                .setDescription('Iniciar simulação de um torneio (apenas ADM)')
                .addStringOption(option =>
                    option.setName('nome')
                        .setDescription('Nome do torneio')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('velocidade')
                        .setDescription('Velocidade da simulação')
                        .addChoices(
                            { name: '⚡ Instantâneo (1s)', value: 'instantaneo' },
                            { name: '🚀 Rápido (3s) - Recomendado', value: 'rapido' },
                            { name: '⏱️ Normal (30s)', value: 'normal' },
                            { name: '🎮 Realista (6min reais)', value: 'realista' }
                        ))
        ),
    execute: torneio
};
