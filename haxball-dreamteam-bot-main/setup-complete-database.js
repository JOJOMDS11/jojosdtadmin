const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function completeDatabase() {
    let connection;
    
    try {
        console.log('🚀 Iniciando completar estrutura da database jojodreamteam...');
        
        // Conectar ao banco
        connection = await mysql.createConnection({
            host: 'jojodreamteam.cgv8aga22uxg.us-east-1.rds.amazonaws.com',
            user: 'admin',
            password: 'soufoda123',
            database: 'jojodreamteam',
            port: 3306,
            multipleStatements: true
        });

        console.log('✅ Conectado ao banco jojodreamteam!');

        // Ler o arquivo SQL
        const sqlPath = path.join(__dirname, 'complete-database-structure.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');

        console.log('📋 Executando script SQL...');

        // Dividir em comandos separados para execução segura
        const commands = sqlScript
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (command.trim()) {
                try {
                    console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
                    await connection.execute(command);
                } catch (cmdError) {
                    console.log(`⚠️ Aviso no comando ${i + 1}: ${cmdError.message}`);
                    // Continuar mesmo com avisos (algumas tabelas podem já existir)
                }
            }
        }

        console.log('🔍 Verificando tabelas criadas...');
        const [tables] = await connection.execute('SHOW TABLES');
        
        console.log('📊 Tabelas na database jojodreamteam:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   ✅ ${tableName}`);
        });

        console.log('🎯 Verificando dados existentes...');
        
        // Verificar cartas
        const [cards] = await connection.execute('SELECT COUNT(*) as count FROM user_cards');
        console.log(`🎴 Total de cartas: ${cards[0].count}`);

        // Verificar templates
        const [templates] = await connection.execute('SELECT COUNT(*) as count FROM player_templates');
        console.log(`🎮 Total de templates: ${templates[0].count}`);

        // Verificar times
        const [teams] = await connection.execute('SELECT COUNT(*) as count FROM teams');
        console.log(`🏆 Total de times: ${teams[0].count}`);

        // Verificar jogadores
        const [players] = await connection.execute('SELECT COUNT(*) as count FROM players');
        console.log(`👥 Total de jogadores: ${players[0].count}`);

        console.log('🎉 Database jojodreamteam completamente estruturada!');
        console.log('✅ Bot agora pode usar todas as funcionalidades!');

    } catch (error) {
        console.error('❌ Erro ao completar database:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexão fechada.');
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    completeDatabase()
        .then(() => {
            console.log('🚀 Processo concluído com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Falha no processo:', error);
            process.exit(1);
        });
}

module.exports = { completeDatabase };
