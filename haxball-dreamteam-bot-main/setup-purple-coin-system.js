require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupPurpleCoinSystem() {
    let connection;
    
    try {
        // Conectar ao banco
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            ssl: {
                rejectUnauthorized: false
            }
        });

        console.log('✅ Conectado ao banco de dados');

        // Criar tabela de códigos Purple Coins
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS purple_coin_codes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                code VARCHAR(50) UNIQUE NOT NULL,
                purple_coins_value INT NOT NULL DEFAULT 100,
                used_by_discord_id VARCHAR(50) NULL,
                used_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NULL,
                created_by VARCHAR(50) DEFAULT 'ADMIN',
                description TEXT NULL,
                
                INDEX idx_code (code),
                INDEX idx_used (used_by_discord_id),
                INDEX idx_created (created_at),
                INDEX idx_expires (expires_at)
            )
        `);
        console.log('✅ Tabela purple_coin_codes criada/verificada');

        // Criar tabela de transações
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS purple_coin_transactions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                player_discord_id VARCHAR(50) NOT NULL,
                amount INT NOT NULL,
                transaction_type ENUM('CODIGO_RESGATADO', 'COMPRA_PACOTE', 'VENDA_CARTA', 'ADMIN_ADD', 'ADMIN_REMOVE') NOT NULL,
                description TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_player (player_discord_id),
                INDEX idx_type (transaction_type),
                INDEX idx_created (created_at)
            )
        `);
        console.log('✅ Tabela purple_coin_transactions criada/verificada');

        // Criar tabela de emojis
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS emoji_codes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                emoji VARCHAR(10) NOT NULL,
                hex_code VARCHAR(50) NOT NULL,
                description VARCHAR(255) NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_emoji (emoji),
                INDEX idx_hex (hex_code),
                INDEX idx_created (created_at)
            )
        `);
        console.log('✅ Tabela emoji_codes criada/verificada');

        // Inserir alguns códigos de exemplo
        const exampleCodes = [
            { code: 'PC100FREE', value: 100, description: 'Código de boas-vindas' },
            { code: 'WELCOME2024', value: 250, description: 'Código promocional' },
            { code: 'HAXBALL500', value: 500, description: 'Código especial HaxBall' }
        ];

        for (const exampleCode of exampleCodes) {
            try {
                await connection.execute(`
                    INSERT IGNORE INTO purple_coin_codes (code, purple_coins_value, description, created_by)
                    VALUES (?, ?, ?, 'SYSTEM')
                `, [exampleCode.code, exampleCode.value, exampleCode.description]);
                console.log(`✅ Código de exemplo ${exampleCode.code} adicionado`);
            } catch (error) {
                console.log(`ℹ️ Código ${exampleCode.code} já existe`);
            }
        }

        // Inserir alguns emojis populares
        const popularEmojis = [
            { emoji: '⚽', hex: '26BD', description: 'Bola de futebol' },
            { emoji: '🥅', hex: '1F945', description: 'Gol' },
            { emoji: '🎯', hex: '1F3AF', description: 'Alvo' },
            { emoji: '👑', hex: '1F451', description: 'Coroa' },
            { emoji: '🔥', hex: '1F525', description: 'Fogo' },
            { emoji: '💎', hex: '1F48E', description: 'Diamante' },
            { emoji: '🚀', hex: '1F680', description: 'Foguete' },
            { emoji: '⭐', hex: '2B50', description: 'Estrela' },
            { emoji: '🅿️', hex: '1F17F', description: 'Letra P' },
            { emoji: '🤏', hex: '1F90F', description: 'Mãozinha' }
        ];

        for (const emojiData of popularEmojis) {
            try {
                await connection.execute(`
                    INSERT IGNORE INTO emoji_codes (emoji, hex_code, description)
                    VALUES (?, ?, ?)
                `, [emojiData.emoji, emojiData.hex, emojiData.description]);
                console.log(`✅ Emoji ${emojiData.emoji} adicionado`);
            } catch (error) {
                console.log(`ℹ️ Emoji ${emojiData.emoji} já existe`);
            }
        }

        console.log('\n🎉 Sistema Purple Coins configurado com sucesso!');
        console.log('\n📋 Códigos de exemplo criados:');
        console.log('• PC100FREE (100 coins)');
        console.log('• WELCOME2024 (250 coins)');
        console.log('• HAXBALL500 (500 coins)');
        console.log('\n💡 Use o comando /codigo <código> no Discord para resgatar!');

    } catch (error) {
        console.error('❌ Erro ao configurar sistema Purple Coins:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupPurpleCoinSystem();
