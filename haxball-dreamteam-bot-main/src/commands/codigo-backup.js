const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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

        try {
            const { connectDB, pool } = require('../database/connection');
            await connectDB();

            // Verificar se o código existe e está válido
            const [codeRows] = await pool.execute(`
                SELECT 
                    code,
                    amount,
                    max_uses,
                    remaining_uses,
                    expires_at,
                    used_by
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

            // Verificar se o usuário já usou este código
            let usedBy = [];
            if (codeData.used_by) {
                try {
                    usedBy = JSON.parse(codeData.used_by);
                } catch (e) {
                    usedBy = [];
                }
            }

            if (usedBy.includes(userId)) {
                const alreadyUsedEmbed = new EmbedBuilder()
                    .setColor(0xFF8C00)
                    .setTitle('⚠️ Código Já Utilizado')
                    .setDescription(`Você já resgatou o código \`${codigo}\`!`)
                    .addFields({
                        name: '� Status do Código',
                        value: `**Usos Restantes:** ${codeData.remaining_uses}/${codeData.max_uses}\n**Você já usou:** Sim ✅`
                    })
                    .setFooter({ text: 'HaxBall DreamTeam' })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [alreadyUsedEmbed] });
            }

            // Verificar se o jogador existe no banco
            const [playerRows] = await pool.execute(`
                SELECT discord_id, username, purple_coins 
                FROM players 
                WHERE discord_id = ?
            `, [userId]);

            if (playerRows.length === 0) {
                const noPlayerEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Jogador Não Registrado')
                    .setDescription('Você precisa estar registrado no sistema para resgatar códigos!')
                    .addFields({
                        name: '🎮 Como se registrar',
                        value: 'Use o comando `/obter` para obter sua primeira carta e se registrar automaticamente!'
                    })
                    .setFooter({ text: 'HaxBall DreamTeam' })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [noPlayerEmbed] });
            }

            const player = playerRows[0];
            const currentCoins = player.purple_coins || 0;
            const coinsToAdd = codeData.amount;
            const newCoins = currentCoins + coinsToAdd;

            // Adicionar usuário à lista de quem usou
            usedBy.push(userId);
            const newUsedBy = JSON.stringify(usedBy);

            // Atualizar código (decrementar usos restantes e adicionar usuário)
            await pool.execute(`
                UPDATE purple_coin_codes 
                SET remaining_uses = remaining_uses - 1,
                    used_by = ?
                WHERE code = ?
            `, [newUsedBy, codigo]);

            // Adicionar Purple Coins ao jogador
            await pool.execute(`
                UPDATE players 
                SET purple_coins = purple_coins + ?
                WHERE discord_id = ?
            `, [coinsToAdd, userId]);

            // Log da transação
            try {
                await pool.execute(`
                    INSERT INTO purple_coin_transactions (
                        player_discord_id,
                        amount,
                        transaction_type,
                        description,
                        created_at
                    ) VALUES (?, ?, ?, ?, NOW())
                `, [userId, coinsToAdd, 'CODIGO_RESGATADO', `Código ${codigo} resgatado`]);
            } catch (logError) {
                console.warn('Erro ao registrar transação:', logError.message);
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

            return await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Erro no comando /codigo:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erro Interno')
                .setDescription('Ocorreu um erro ao processar seu código. Tente novamente em alguns instantes.')
                .setFooter({ text: 'HaxBall DreamTeam' })
                .setTimestamp();

            return await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
