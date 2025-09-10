// Handler para interações de botões do torneioembed
const { EmbedBuilder } = require('discord.js');

// Armazenar inscrições de torneios (em produção, usar banco de dados)
const tournamentRegistrations = new Map();

async function handleTournamentEmbedInteraction(interaction) {
    if (!interaction.isButton()) return false;

    const { customId } = interaction;
    
    // Verificar se é uma interação de torneio
    if (!customId.startsWith('inscricao_torneio_') && 
        !customId.startsWith('participantes_torneio_') && 
        !customId.startsWith('regras_torneio_')) {
        return false;
    }

    try {
        const tournamentName = customId.split('_').slice(2).join('_');
        
        if (customId.startsWith('inscricao_torneio_')) {
            await handleTournamentRegistration(interaction, tournamentName);
        } else if (customId.startsWith('participantes_torneio_')) {
            await handleShowParticipants(interaction, tournamentName);
        } else if (customId.startsWith('regras_torneio_')) {
            await handleShowRules(interaction, tournamentName);
        }

        return true;
    } catch (error) {
        console.error('Erro no handler do tourneioembed:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Erro ao processar sua solicitação. Tente novamente.',
                ephemeral: true
            });
        }
        
        return true;
    }
}

async function handleTournamentRegistration(interaction, tournamentName) {
    const userId = interaction.user.id;
    
    // Verificar se já está inscrito
    if (!tournamentRegistrations.has(tournamentName)) {
        tournamentRegistrations.set(tournamentName, new Set());
    }
    
    const registrations = tournamentRegistrations.get(tournamentName);
    
    if (registrations.has(userId)) {
        return await interaction.reply({
            content: '⚠️ **Você já está inscrito neste torneio!**\n\n' +
                '🎮 Aguarde o início do torneio\n' +
                '📋 Use o botão "Ver Participantes" para ver todos os inscritos',
            ephemeral: true
        });
    }

    // Verificar se o jogador tem time completo escalado
    const { connectDB } = require('../database/connection');
    let hasCompleteTeam = false;
    
    try {
        const db = await connectDB();
        
        // Verificar se existe escalação completa para o usuário
        const [rows] = await db.execute(`
            SELECT 
                COUNT(*) as total_escalados,
                SUM(CASE WHEN position = 'GK' THEN 1 ELSE 0 END) as has_gk,
                SUM(CASE WHEN position = 'VL' THEN 1 ELSE 0 END) as has_vl,
                SUM(CASE WHEN position = 'PV' THEN 1 ELSE 0 END) as has_pv
            FROM escalacao 
            WHERE user_id = ?
        `, [userId]);
        
        const escalacao = rows[0];
        
        hasCompleteTeam = escalacao && 
                         escalacao.total_escalados >= 3 && 
                         escalacao.has_gk >= 1 && 
                         escalacao.has_vl >= 1 && 
                         escalacao.has_pv >= 1;
    } catch (error) {
        console.warn('Erro ao verificar escalação, permitindo inscrição:', error);
        hasCompleteTeam = true; // Em caso de erro, permitir inscrição
    }

    if (!hasCompleteTeam) {
        return await interaction.reply({
            content: '❌ **Time incompleto!**\n\n' +
                '🎯 Você precisa ter um time completo para participar:\n' +
                '🥅 **Goleiro (GK)** escalado\n' +
                '⚽ **Volante (VL)** escalado\n' +
                '🎯 **Pivô (PV)** escalado\n\n' +
                '💡 Use `/escalar` para completar sua escalação',
            ephemeral: true
        });
    }

    // Adicionar à lista de inscritos
    registrations.add(userId);

    const embed = new EmbedBuilder()
        .setTitle('✅ INSCRIÇÃO REALIZADA!')
        .setDescription(`🎉 **${interaction.user.displayName}** foi inscrito no torneio!`)
        .addFields(
            { name: '🏆 Torneio', value: tournamentName.replace(/_/g, ' '), inline: true },
            { name: '👥 Total de Inscritos', value: `${registrations.size} jogadores`, inline: true },
            { name: '🎮 Próximo Passo', value: 'Aguarde o início do torneio!', inline: false }
        )
        .setColor(0x00FF00)
        .setTimestamp()
        .setFooter({
            text: 'Boa sorte no torneio!',
            iconURL: interaction.user.displayAvatarURL()
        });

    await interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
}

async function handleShowParticipants(interaction, tournamentName) {
    const registrations = tournamentRegistrations.get(tournamentName) || new Set();
    
    if (registrations.size === 0) {
        return await interaction.reply({
            content: '📋 **Nenhum participante inscrito ainda**\n\n' +
                '🎮 Seja o primeiro a se inscrever!\n' +
                '💡 Clique no botão "Inscrever Meu Time" para participar',
            ephemeral: true
        });
    }

    const participantsList = Array.from(registrations).map((userId, index) => {
        return `${index + 1}. <@${userId}>`;
    }).join('\n');

    const embed = new EmbedBuilder()
        .setTitle('👥 PARTICIPANTES DO TORNEIO')
        .setDescription(`🏆 **${tournamentName.replace(/_/g, ' ')}**`)
        .addFields(
            { name: '📋 Lista de Inscritos', value: participantsList, inline: false },
            { name: '📊 Total', value: `${registrations.size} jogadores inscritos`, inline: true }
        )
        .setColor(0x3498DB)
        .setTimestamp();

    await interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
}

async function handleShowRules(interaction, tournamentName) {
    const embed = new EmbedBuilder()
        .setTitle('📋 REGRAS DO TORNEIO')
        .setDescription(`🏆 **${tournamentName.replace(/_/g, ' ')}**`)
        .addFields(
            { name: '🎯 Requisitos para Participar', 
              value: '• Time completo escalado (GK, VL, PV)\n• Estar registrado no sistema\n• Respeitar fair play', 
              inline: false },
            { name: '⚽ Formato das Partidas', 
              value: '• Partidas de 3 minutos\n• Sistema de eliminação\n• Simulação automática', 
              inline: false },
            { name: '🏆 Sistema de Premiação', 
              value: '• Purple Coins para os primeiros colocados\n• Prêmios distribuídos automaticamente\n• Ranking de participação', 
              inline: false },
            { name: '⚠️ Regras de Conduta', 
              value: '• Respeito entre jogadores\n• Proibido trapaças ou bugs\n• Decisões da administração são finais', 
              inline: false }
        )
        .setColor(0xE74C3C)
        .setTimestamp()
        .setFooter({
            text: 'Divirta-se e boa sorte!',
            iconURL: interaction.client.user.displayAvatarURL()
        });

    await interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
}

module.exports = {
    handleTournamentEmbedInteraction
};
