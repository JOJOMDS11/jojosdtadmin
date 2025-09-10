const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

// Criar cliente Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// Carregar comandos
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Comando carregado: ${command.data.name}`);
    } else {
        console.log(`⚠️ Comando em ${file} está faltando "data" ou "execute"!`);
    }
}

// Event: Bot pronto
client.once('ready', () => {
    console.log(`🤖 Bot conectado como ${client.user.tag}!`);
    console.log(`🌐 Presente em ${client.guilds.cache.size} servidor(es)`);

    // Status do bot
    client.user.setActivity('HaxBall DreamTeam 🎮', { type: 'PLAYING' });
});

// Event: Interação de comando
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`❌ Comando não encontrado: ${interaction.commandName}`);
        return;
    }

    try {
        console.log(`📝 Executando comando: ${interaction.commandName} por ${interaction.user.tag}`);
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Erro ao executar comando ${interaction.commandName}:`, error);

        const errorMessage = '❌ Houve um erro ao executar este comando!';

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        } catch (replyError) {
            console.error('❌ Erro ao responder com mensagem de erro:', replyError);
        }
    }
});

// Event: Erro não tratado
client.on('error', error => {
    console.error('❌ Erro do Discord.js:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Promise rejeitada não tratada:', error);
});

// Conectar bot
client.login(process.env.DISCORD_TOKEN);