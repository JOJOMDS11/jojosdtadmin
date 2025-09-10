require('dotenv').config();
const { pool } = require('./src/database/connection');

async function createCodesTable() {
    try {
        console.log('✅ Conectando ao banco de dados MySQL...');

        // Criar tabela de códigos Purple Coins
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS purple_coin_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(20) UNIQUE NOT NULL,
                amount INT NOT NULL,
                max_uses INT NOT NULL DEFAULT 1,
                remaining_uses INT NOT NULL DEFAULT 1,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                used_by JSON DEFAULT NULL,
                INDEX idx_code (code),
                INDEX idx_expires (expires_at),
                INDEX idx_remaining (remaining_uses)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.execute(createTableQuery);
        console.log('✅ Tabela purple_coin_codes criada com sucesso');

        // Verificar se a tabela foi criada
        const [tables] = await pool.execute(
            "SHOW TABLES LIKE 'purple_coin_codes'"
        );
        
        if (tables.length > 0) {
            console.log('✅ Tabela confirmada no banco de dados');
            
            // Mostrar estrutura da tabela
            const [structure] = await pool.execute(
                "DESCRIBE purple_coin_codes"
            );
            console.log('\n📋 Estrutura da tabela:');
            structure.forEach(col => {
                console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
            });
        }

        console.log('\n🎉 Sistema de códigos Purple Coins pronto!');

    } catch (error) {
        console.error('❌ Erro ao criar tabela:', error);
    } finally {
        process.exit(0);
    }
}

createCodesTable();
