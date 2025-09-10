const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { connectDB } = require('./database/connection');
const { handleTournamentEmbedInteraction } = require('./utils/tournamentEmbedHandler');
const { REST, Routes } = require('discord.js');
const express = require('express');
const apiRouter = require('./api/routes');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Carregar comandos dinamicamente
const commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')).forEach(file => {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
        commands.set(command.data.name, command);
    }
});

// Função para registrar comandos slash (mock simples)

async function registerSlashCommandsAuto(clientId, token) {
    const commandsArray = Array.from(commands.values()).map(cmd => cmd.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(token);
    try {
        console.log('🚀 Registrando comandos slash no Discord...');
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commandsArray }
        );
        console.log('✅ Comandos slash registrados automaticamente!');
    } catch (error) {
        console.error('❌ Erro ao registrar comandos slash:', error);
    }
}

// Manipulador de comandos slash
async function handleSlashCommand(interaction) {
    const command = commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Erro ao executar comando /${interaction.commandName}:`, error);
        await interaction.reply({ content: '❌ Erro ao executar o comando.', ephemeral: true });
    }
}

// Funções mock para handlers antigos
const handleChallengeInteraction = async () => {};
const handleTournamentInteraction = async () => {};
const handleUpgradeInteraction = async () => {};

// Criar servidor HTTP para o Render
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Montar router da API
app.use('/api', apiRouter);

// Rota básica para health check
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: client.user?.tag || 'Desconectado',
        timestamp: new Date().toISOString(),
        api_endpoints: [
            '/api/players',
            '/api/teams',
            '/api/tournaments',
            '/api/stats'
        ]
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', uptime: process.uptime() });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🌐 Servidor HTTP rodando na porta ${PORT}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});


client.once('ready', async () => {
    console.log(`🎮 ${client.user.tag} está online!`);
    console.log(`📊 Conectado a ${client.guilds.cache.size} servidor(es)`);

    // Registrar comandos slash automaticamente ao iniciar
    const token = process.env.DISCORD_TOKEN || 'SEU_TOKEN_AQUI';
    const clientId = client.user.id;
    if (token && token !== 'SEU_TOKEN_AQUI') {
        await registerSlashCommandsAuto(clientId, token);
    } else {
        console.warn('⚠️  Token do Discord não encontrado. Comandos slash não foram registrados.');
    }

    // Conectar ao banco de dados (opcional)
    try {
        await connectDB();
        console.log('✅ Banco de dados conectado e tabelas criadas');
    } catch (error) {
        console.error('❌ Erro ao conectar ao banco:', error);
        console.log('⚠️  Bot continuará funcionando sem banco de dados');
    }

    // Definir status do bot
    client.user.setActivity('🥅 Haxball DreamTeam', { type: ActivityType.Playing });
});

// Manipular interações (comandos slash, botões, etc.)
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
    } else if (interaction.isButton()) {
        // Verificar se é uma interação de desafio
        if (interaction.customId.startsWith('accept_') || interaction.customId.startsWith('decline_')) {
            await handleChallengeInteraction(interaction);
        }
        // Verificar se é uma interação de paginação de cartas
        else if (interaction.customId.startsWith('cards_')) {
            // Importar as funções de paginação dinamicamente
            try {
                const mostrarcartas = require('./commands/mostrarcartas');
                const minhascartas = require('./commands/minhascartas');

                // Tentar ambas as funções de paginação
                if (mostrarcartas.handleInteraction) {
                    await mostrarcartas.handleInteraction(interaction);
                } else if (minhascartas.handleInteraction) {
                    await minhascartas.handleInteraction(interaction);
                } else {
                    console.warn('⚠️ Função de paginação não encontrada');
                }
            } catch (error) {
                console.error('❌ Erro na paginação de cartas:', error);
                await interaction.reply({
                    content: '❌ Erro ao navegar nas páginas. Tente usar o comando novamente.',
                    ephemeral: true
                });
            }
        }
        // Verificar se é uma interação de torneio
        else if (interaction.customId.startsWith('tournament_') || interaction.customId.startsWith('join_tournament_')) {
            await handleTournamentInteraction(interaction);
        }
        // Verificar se é uma interação de upgrade/venda
        else if (interaction.customId.startsWith('upgrade_') || interaction.customId.startsWith('sell_') || interaction.customId.startsWith('confirm_sell_') || interaction.customId.startsWith('cancel_sell_')) {
            await handleUpgradeInteraction(interaction);
        }
        // Verificar se é uma interação do torneioembed
        else if (interaction.customId.includes('_torneio_')) {
            await handleTournamentEmbedInteraction(interaction);
        }
    }
});

// Manipular mensagens (para futuros recursos)
client.on('messageCreate', message => {
    if (message.author.bot) return;

    // Aqui pode adicionar comandos por texto no futuro
    // Por enquanto, só comandos slash
});

// Manipular erros
client.on('error', error => {
    console.error('❌ Erro do Discord.js:', error);
});

// Login do bot
const token = process.env.DISCORD_TOKEN || 'SEU_TOKEN_AQUI';
console.log('🔑 Token sendo usado:', token && token !== 'SEU_TOKEN_AQUI' ? 'Token carregado' : 'Token NÃO carregado');
client.login(token).catch(error => {
    console.error('❌ Erro ao fazer login:', error);
    process.exit(1);
});
