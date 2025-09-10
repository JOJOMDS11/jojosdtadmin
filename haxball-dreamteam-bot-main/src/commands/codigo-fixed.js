const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2/promise');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('codigo')
        .setDescription('💰 Resgatar código de Purple Coins')
        .addStringOption(option =>
            option.setName('codigo')
                .setDescription('Código de Purple Coins para resgatar')
                .setRequired(true)
                .setMaxLength(50)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;
        const codigo = interaction.options.getString('codigo').trim().toUpperCase();

        let codeConnection, playerConnection;

        try {
            // Conectar à database jojopix para códigos
            codeConnection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: 'jojopix',
                port: process.env.DB_PORT || 3306
            });

            // Conectar à database principal para players
            const { connectDB, pool } = require('../database/connection');
            await connectDB();
            playerConnection = pool;

            // Verificar se o código existe e está válido na database jojopix
            const [codeRows] = await codeConnection.execute(`
                SELECT 
                    code,
                    COALESCE(amount, purple_coins_value) as amount,
                    COALESCE(max_uses, 1) as max_uses,
                    COALESCE(remaining_uses, CASE WHEN used_by_discord_id IS NULL THEN 1 ELSE 0 END) as remaining_uses,
                    expires_at,
                    used_by,
                    used_by_discord_id,
                    used_at
                FROM purple_coin_codes 
                WHERE code = ?
            `, [codigo]);

            if (codeRows.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Código Inválido')
                    .setDescription(`O código \`${codigo}\` não foi encontrado!`)
                    .addFields({
                        name: '💡 Dica',
                        value: 'Verifique se digitou o código corretamente.\nCódigos são case-sensitive!'
                    })
                    .setFooter({ text: 'HaxBall DreamTeam' })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const codeData = codeRows[0];

            // Verificar se expirou
            if (new Date() > new Date(codeData.expires_at)) {
                const expiredEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('⏰ Código Expirado')
                    .setDescription(`O código \`${codigo}\` expirou!`)
                    .addFields({
                        name: '📅 Expirou em',
                        value: new Date(codeData.expires_at).toLocaleString('pt-BR')
                    })
                    .setFooter({ text: 'HaxBall DreamTeam' })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [expiredEmbed] });
            }

            // Verificar se ainda tem usos restantes
            if (codeData.remaining_uses <= 0) {
                const noUsesEmbed = new EmbedBuilder()
                    .setColor(0xFF8C00)
                    .setTitle('⚠️ Código Esgotado')
                    .setDescription(`O código \`${codigo}\` já foi usado o máximo de vezes permitidas!`)
                    .addFields({
                        name: '📊 Estatísticas',
                        value: `**Usos:** ${codeData.max_uses}/${codeData.max_uses}\n**Status:** Esgotado`
                    })
                    .setFooter({ text: 'HaxBall DreamTeam' })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [noUsesEmbed] });
            }

            // Verificar se o usuário já usou este código (compatibilidade com ambos os formatos)
            let userAlreadyUsed = false;
            
            // Verificar no formato antigo
            if (codeData.used_by_discord_id === userId) {
                userAlreadyUsed = true;
            }
            
            // Verificar no formato novo (JSON)
            if (codeData.used_by) {
                try {
                    const usedBy = JSON.parse(codeData.used_by);
                    if (usedBy.includes(userId)) {
                        userAlreadyUsed = true;
                    }
                } catch (e) {
                    // Ignore JSON parse errors
                }
            }

            if (userAlreadyUsed) {
                const alreadyUsedEmbed = new EmbedBuilder()
                    .setColor(0xFF8C00)
                    .setTitle('⚠️ Código Já Utilizado')
                    .setDescription(`Você já resgatou o código \`${codigo}\`!`)
                    .addFields({
                        name: '📊 Status do Código',
                        value: `**Usos Restantes:** ${codeData.remaining_uses}/${codeData.max_uses}\n**Você já usou:** Sim ✅`
                    })
                    .setFooter({ text: 'HaxBall DreamTeam' })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [alreadyUsedEmbed] });
            }

            // Verificar se o jogador existe na database principal
            const [playerRows] = await playerConnection.execute(`
                SELECT discord_id, name, purple_coins 
                FROM players 
                WHERE discord_id = ?
            `, [userId]);

            if (playerRows.length === 0) {
                const noPlayerEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Jogador Não Encontrado')
                    .setDescription('Você precisa se registrar primeiro!')
                    .addFields({
                        name: '🎮 Como se registrar',
                        value: 'Use o comando `/criartime` para se registrar no sistema.'
                    })
                    .setFooter({ text: 'HaxBall DreamTeam' })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [noPlayerEmbed] });
            }

            const player = playerRows[0];
            const currentCoins = player.purple_coins || 0;
            const coinsToAdd = codeData.amount;
            const newCoins = currentCoins + coinsToAdd;

            // Atualizar código (marcar como usado)
            if (codeData.max_uses > 1) {
                // Código de múltiplos usos - adicionar usuário à lista JSON
                let usedBy = [];
                if (codeData.used_by) {
                    try {
                        usedBy = JSON.parse(codeData.used_by);
                    } catch (e) {
                        usedBy = [];
                    }
                }
                usedBy.push(userId);

                await codeConnection.execute(`
                    UPDATE purple_coin_codes 
                    SET remaining_uses = remaining_uses - 1,
                        used_by = ?
                    WHERE code = ?
                `, [JSON.stringify(usedBy), codigo]);
            } else {
                // Código de uso único - usar formato antigo
                await codeConnection.execute(`
                    UPDATE purple_coin_codes 
                    SET used_by_discord_id = ?,
                        used_at = NOW(),
                        remaining_uses = 0
                    WHERE code = ?
                `, [userId, codigo]);
            }

            // Adicionar Purple Coins ao jogador na database principal
            await playerConnection.execute(`
                UPDATE players 
                SET purple_coins = purple_coins + ?
                WHERE discord_id = ?
            `, [coinsToAdd, userId]);

            // Log da transação (se a tabela existir)
            try {
                await playerConnection.execute(`
                    INSERT INTO purple_coin_transactions (
                        player_discord_id,
                        amount,
                        transaction_type,
                        description,
                        created_at
                    ) VALUES (?, ?, ?, ?, NOW())
                `, [userId, coinsToAdd, 'CODIGO_RESGATADO', `Código ${codigo} resgatado`]);
            } catch (logError) {
                console.warn('Aviso - tabela de transações não existe:', logError.message);
            }

            // Embed de sucesso
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 Código Resgatado com Sucesso!')
                .setDescription(`Parabéns! Você resgatou o código \`${codigo}\`!`)
                .addFields([
                    {
                        name: '💰 Purple Coins Recebidas',
                        value: `**+${coinsToAdd}** Purple Coins`,
                        inline: true
                    },
                    {
                        name: '💳 Saldo Anterior',
                        value: `${currentCoins} Purple Coins`,
                        inline: true
                    },
                    {
                        name: '💎 Novo Saldo',
                        value: `**${newCoins}** Purple Coins`,
                        inline: true
                    },
                    {
                        name: '📊 Status do Código',
                        value: `**Usos Restantes:** ${codeData.remaining_uses - 1}/${codeData.max_uses}`,
                        inline: false
                    }
                ])
                .addFields({
                    name: '🛒 O que fazer agora?',
                    value: '• Use `/comprarpacote` para comprar pacotes de cartas\n• Use `/loja` para ver itens disponíveis\n• Use `/saldo` para verificar suas Purple Coins'
                })
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter({ text: 'HaxBall DreamTeam' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Erro no comando /codigo:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erro Interno')
                .setDescription('Ocorreu um erro ao processar o código. Tente novamente.')
                .setFooter({ text: 'HaxBall DreamTeam' })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        } finally {
            if (codeConnection) {
                await codeConnection.end();
            }
        }
    }
};
