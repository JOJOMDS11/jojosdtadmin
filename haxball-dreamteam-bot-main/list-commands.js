const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('🎮 COMANDOS DISPONÍVEIS NO HAXBALL DREAMTEAM BOT');
console.log('='.repeat(60));
console.log(`📊 Total de comandos: ${commandFiles.length}`);
console.log('='.repeat(60));

const comandos = [];

for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if (command.data && command.data.name) {
            comandos.push({
                nome: `/${command.data.name}`,
                descricao: command.data.description || 'Sem descrição',
                arquivo: file
            });
        }
    } catch (error) {
        console.log(`❌ Erro ao carregar ${file}: ${error.message}`);
    }
}

// Ordenar alfabeticamente
comandos.sort((a, b) => a.nome.localeCompare(b.nome));

comandos.forEach((cmd, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${cmd.nome.padEnd(20)} - ${cmd.descricao}`);
});

console.log('='.repeat(60));
console.log('🔗 ADMIN PANEL: https://jojosdtadmin.vercel.app');
console.log('🔑 Senha Admin: eojojos');
console.log('='.repeat(60));

// Comandos específicos destacados
console.log('\n🎯 COMANDOS PRINCIPAIS:');
console.log('💜 /codigo        - Resgatar Purple Coins');
console.log('🔧 /adminpanel    - Acesso ao painel administrativo');
console.log('💰 /purplecoins   - Ver saldo de moedas');
console.log('🎴 /obter         - Conseguir cartas');
console.log('📦 /pacote        - Pacote de 3 cartas');
console.log('💸 /vender        - Vender cartas por moedas');
console.log('⚽ /meutime       - Ver seu time escalado');
