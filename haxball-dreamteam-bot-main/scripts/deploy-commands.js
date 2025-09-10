const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const commands = [];

// Carregar todos os comandos
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

console.log(`📂 Encontrados ${commandFiles.length} arquivos: ${commandFiles.join(', ')}`);

for (const file of commandFiles) {
    try {
        const command = require(`../src/commands/${file}`);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`✅ Comando carregado: ${command.data.name} (${file})`);
        } else {
            console.log(`⚠️ Comando em ${file} está faltando "data" ou "execute"!`);
        }
    } catch (error) {
        console.log(`❌ Erro ao carregar ${file}:`, error.message);
    }
}

// Construir e preparar uma instância do módulo REST
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Deploy comandos
(async () => {
    try {
        console.log(`🚀 Iniciando refresh de ${commands.length} comandos slash.`);

        // Registrar comandos globalmente
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ ${data.length} comandos slash registrados com sucesso!`);
        
        // Listar comandos registrados
        console.log('\n📋 Comandos registrados:');
        data.forEach(cmd => {
            console.log(`   • /${cmd.name} - ${cmd.description}`);
        });

    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
})();
