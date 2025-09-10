const mysql = require('mysql2/promise');

async function addMissingTables() {
    let connection;
    
    try {
        console.log('🚀 Adicionando tabelas essenciais...');
        
        connection = await mysql.createConnection({
            host: 'jojodreamteam.cgv8aga22uxg.us-east-1.rds.amazonaws.com',
            user: 'admin',
            password: 'soufoda123',
            database: 'jojodreamteam',
            port: 3306
        });

        console.log('✅ Conectado!');

        // 1. Tabela de torneios
        console.log('📋 Criando tabela tournaments...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS tournaments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                max_teams INT DEFAULT 16,
                status VARCHAR(20) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Tabela de estatísticas de usuários
        console.log('📊 Criando tabela user_stats...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_stats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                discord_id VARCHAR(255) UNIQUE NOT NULL,
                total_cards INT DEFAULT 0,
                total_packs_opened INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Verificar se coluna avatar existe em player_templates
        console.log('🎮 Verificando coluna avatar...');
        try {
            await connection.execute(`
                ALTER TABLE player_templates 
                ADD COLUMN avatar VARCHAR(10) DEFAULT '⚽'
            `);
            console.log('✅ Coluna avatar adicionada!');
        } catch (e) {
            console.log('ℹ️ Coluna avatar já existe.');
        }

        // 4. Verificar se coluna template_avatar existe em user_cards
        console.log('🎴 Verificando coluna template_avatar...');
        try {
            await connection.execute(`
                ALTER TABLE user_cards 
                ADD COLUMN template_avatar VARCHAR(10)
            `);
            console.log('✅ Coluna template_avatar adicionada!');
        } catch (e) {
            console.log('ℹ️ Coluna template_avatar já existe.');
        }

        // 5. Atualizar template_avatar baseado nos templates
        console.log('🔄 Atualizando avatars das cartas...');
        await connection.execute(`
            UPDATE user_cards uc
            JOIN player_templates pt ON uc.template_id = pt.id
            SET uc.template_avatar = pt.avatar
            WHERE uc.template_avatar IS NULL OR uc.template_avatar = ''
        `);

        console.log('🎯 Verificando estrutura final...');
        const [tables] = await connection.execute('SHOW TABLES');
        
        console.log('📊 Tabelas na database:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   ✅ ${tableName}`);
        });

        // Verificar dados
        const [cards] = await connection.execute('SELECT COUNT(*) as count FROM user_cards');
        const [templates] = await connection.execute('SELECT COUNT(*) as count FROM player_templates');
        const [teams] = await connection.execute('SELECT COUNT(*) as count FROM teams');

        console.log(`🎴 Cartas: ${cards[0].count}`);
        console.log(`🎮 Templates: ${templates[0].count}`);
        console.log(`🏆 Times: ${teams[0].count}`);

        // Verificar se avatars estão funcionando
        const [sampleCards] = await connection.execute(`
            SELECT uc.player_name, uc.position, uc.avatar, uc.template_avatar, pt.avatar as template_original
            FROM user_cards uc 
            LEFT JOIN player_templates pt ON uc.template_id = pt.id
            LIMIT 5
        `);

        console.log('🎯 Exemplo de cartas com avatars:');
        sampleCards.forEach(card => {
            console.log(`   ${card.player_name} (${card.position}) - Avatar carta: ${card.avatar || 'NULL'}, Template: ${card.template_avatar || 'NULL'}, Original: ${card.template_original || 'NULL'}`);
        });

        console.log('✅ Database jojodreamteam estruturada com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addMissingTables();
