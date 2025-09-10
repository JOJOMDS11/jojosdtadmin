const { simulateMatch } = require('./matchSimulator');
const { convertAvatarCode } = require('./avatarConverter');
const { EmbedBuilder } = require('discord.js');

/**
 * Simula uma partida com updates em tempo real
 * @param {Object} team1Cards - Cartas do time 1
 * @param {Object} team2Cards - Cartas do time 2
 * @param {string} team1Name - Nome do time 1
 * @param {string} team2Name - Nome do time 2
 * @param {Object} interaction - Interação do Discord
 * @returns {Promise} - Promise da simulação completa
 */
async function simulateRealTimeMatch(team1Cards, team2Cards, team1Name, team2Name, interaction) {
    // Primeiro, fazer a simulação completa
    const matchResult = simulateMatch(team1Cards, team2Cards, team1Name, team2Name);
    
    // Criar embed inicial
    const initialEmbed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle('🎮 PARTIDA INICIADA!')
        .setDescription(`**${team1Name}** vs **${team2Name}**\n\n⚽ 0 x 0 ⚽\n\n🕐 0:00 - Partida começou!`)
        .setFooter({ text: 'HaxBall DreamTeam - Simulação em tempo real' });

    // Enviar embed inicial
    const message = await interaction.editReply({ embeds: [initialEmbed] });
    
    let currentScore1 = 0;
    let currentScore2 = 0;
    let eventsDisplayed = [];
    let currentTime = '0:00';
    
    // Processar eventos um por um com delay
    for (let i = 0; i < matchResult.events.length; i++) {
        const event = matchResult.events[i];
        
        // Extrair tempo do evento
        const timeMatch = event.match(/^(\d+)"/);
        if (timeMatch) {
            const seconds = parseInt(timeMatch[1]);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            currentTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
        // Verificar se é gol para atualizar placar
        if (event.includes('⚽')) {
            if (event.includes(`(${team1Name})`)) {
                // Verificar se é gol contra
                if (event.includes('fez gol contra')) {
                    currentScore2++;
                } else {
                    currentScore1++;
                }
            } else if (event.includes(`(${team2Name})`)) {
                // Verificar se é gol contra
                if (event.includes('fez gol contra')) {
                    currentScore1++;
                } else {
                    currentScore2++;
                }
            }
        }
        
        // Adicionar evento à lista
        eventsDisplayed.push(event);
        
        // Manter apenas os últimos 8 eventos para não passar do limite do embed
        if (eventsDisplayed.length > 8) {
            eventsDisplayed.shift();
        }
        
        // Criar embed atualizado
        const updatedEmbed = new EmbedBuilder()
            .setColor(currentScore1 > currentScore2 ? 0xFF6B35 : currentScore2 > currentScore1 ? 0x5865F2 : 0x00AE86)
            .setTitle('🎮 PARTIDA EM ANDAMENTO!')
            .setDescription(`**${team1Name}** vs **${team2Name}**\n\n⚽ **${currentScore1} x ${currentScore2}** ⚽\n\n🕐 **${currentTime}**`)
            .addFields({
                name: '📝 Eventos da Partida',
                value: eventsDisplayed.length > 0 ? eventsDisplayed.join('\n') : 'Aguardando primeiro evento...',
                inline: false
            })
            .setFooter({ text: 'HaxBall DreamTeam - Simulação em tempo real' });

        // Atualizar embed
        await message.edit({ embeds: [updatedEmbed] });
        
        // Delay baseado no tipo de evento
        let delay = 2000; // 2 segundos padrão
        if (event.includes('⚽')) {
            delay = 3000; // 3 segundos para gols
        } else if (event.includes('🧤') || event.includes('😱')) {
            delay = 1500; // 1.5 segundos para defesas e perdidas
        }
        
        await sleep(delay);
    }
    
    // Embed final
    const finalEmbed = new EmbedBuilder()
        .setColor(currentScore1 > currentScore2 ? 0xFF6B35 : currentScore2 > currentScore1 ? 0x5865F2 : 0xFFD700)
        .setTitle('🏆 PARTIDA FINALIZADA!')
        .setDescription(`**${team1Name}** vs **${team2Name}**\n\n⚽ **${currentScore1} x ${currentScore2}** ⚽`)
        .addFields([
            {
                name: '🎉 Resultado',
                value: currentScore1 > currentScore2 
                    ? `🏆 **${team1Name}** venceu!` 
                    : currentScore2 > currentScore1 
                    ? `🏆 **${team2Name}** venceu!` 
                    : '🤝 **Empate!**',
                inline: true
            },
            {
                name: '⏱️ Duração',
                value: matchResult.duration || '6:00',
                inline: true
            },
            {
                name: '📝 Eventos da Partida',
                value: matchResult.events.join('\n').length > 1024 
                    ? matchResult.events.slice(-8).join('\n') + '\n... e mais eventos!'
                    : matchResult.events.join('\n'),
                inline: false
            }
        ])
        .setFooter({ text: 'HaxBall DreamTeam - Partida finalizada!' });

    // Atualizar com embed final
    await message.edit({ embeds: [finalEmbed] });
    
    return {
        score1: currentScore1,
        score2: currentScore2,
        winner: currentScore1 > currentScore2 ? 'team1' : currentScore2 > currentScore1 ? 'team2' : 'draw',
        events: matchResult.events,
        duration: matchResult.duration
    };
}

/**
 * Simula uma partida simples (modo rápido)
 * @param {Object} team1Cards - Cartas do time 1
 * @param {Object} team2Cards - Cartas do time 2
 * @param {string} team1Name - Nome do time 1
 * @param {string} team2Name - Nome do time 2
 * @returns {Object} - Resultado da partida
 */
function simulateQuickMatch(team1Cards, team2Cards, team1Name, team2Name) {
    const matchResult = simulateMatch(team1Cards, team2Cards, team1Name, team2Name);
    
    return {
        score1: matchResult.score.team1,
        score2: matchResult.score.team2,
        winner: matchResult.winner,
        events: matchResult.events,
        duration: matchResult.duration,
        overtime: matchResult.overtime
    };
}

/**
 * Cria embed de resultado da partida
 * @param {Object} result - Resultado da partida
 * @param {string} team1Name - Nome do time 1
 * @param {string} team2Name - Nome do time 2
 * @returns {EmbedBuilder} - Embed do resultado
 */
function createMatchResultEmbed(result, team1Name, team2Name) {
    const winnerText = result.winner === 'team1' 
        ? `🏆 **${team1Name}** venceu!`
        : result.winner === 'team2' 
        ? `🏆 **${team2Name}** venceu!`
        : '🤝 **Empate!**';

    const embed = new EmbedBuilder()
        .setColor(result.winner === 'team1' ? 0xFF6B35 : result.winner === 'team2' ? 0x5865F2 : 0xFFD700)
        .setTitle(`${team1Name} ${result.score1} x ${result.score2} ${team2Name}`)
        .setDescription(winnerText)
        .addFields([
            {
                name: '📝 Eventos da Partida',
                value: result.events.length > 0 
                    ? (result.events.join('\n').length > 1024 
                        ? result.events.slice(0, 15).join('\n') + '\n... e mais eventos!'
                        : result.events.join('\n'))
                    : 'Nenhum evento registrado.',
                inline: false
            },
            {
                name: '⏱️ Duração',
                value: result.duration,
                inline: true
            }
        ])
        .setFooter({ text: 'HaxBall DreamTeam' })
        .setTimestamp();

    return embed;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    simulateRealTimeMatch,
    simulateQuickMatch,
    createMatchResultEmbed
};
