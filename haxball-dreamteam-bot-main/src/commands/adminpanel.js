const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adminpanel')
        .setDescription('🔗 Acesso ao painel administrativo')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Verificar permissões de administrador
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '❌ **Acesso negado!** Apenas administradores podem usar este comando.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎮 HaxBall DreamTeam - Painel Administrativo')
            .setDescription('**🔐 Acesso exclusivo para administradores**')
            .addFields(
                {
                    name: '🌐 Link do Painel',
                    value: '**[Clique aqui para acessar](https://jojosdtadmin.vercel.app)**',
                    inline: false
                },
                {
                    name: '🔑 Credenciais de Acesso',
                    value: '**Senha:** `eojojos`',
                    inline: false
                },
                {
                    name: '⚙️ Funcionalidades Disponíveis',
                    value: '• 👥 Gerenciar Times\n• 🎴 Gerenciar Jogadores\n• ⚙️ Criar Templates\n• 💰 Adicionar Purple Coins\n• 🏆 Gerenciar Torneios\n• 📊 Estatísticas Gerais',
                    inline: false
                },
                {
                    name: '🔄 Sistema Integrado',
                    value: 'O painel está conectado diretamente ao banco de dados AWS RDS e reflete mudanças em tempo real.',
                    inline: false
                }
            )
            .setColor('#667eea')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({
                text: 'HaxBall DreamTeam Admin Panel',
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
