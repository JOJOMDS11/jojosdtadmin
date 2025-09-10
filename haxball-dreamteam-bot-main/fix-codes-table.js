require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixCodesTable() {
    let connection;
    try {
        // Conectar ao banco jojopix onde estão os códigos
        connection = await mysql.createConnection({
            host: 'jojodreamteam.cgv8aga22uxg.us-east-1.rds.amazonaws.com',
            user: 'admin',
            password: process.env.DB_PASSWORD || 'jojodreamteam123',
            database: 'jojopix',
            port: 3306
        });

        console.log('✅ Conectado ao banco jojopix');

        // Verificar estrutura atual
        const [columns] = await connection.execute("DESCRIBE purple_coin_codes");
        console.log('📋 Estrutura atual da tabela:');
        columns.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type}`);
        });

        // Verificar se a coluna amount existe
        const hasAmount = columns.some(col => col.Field === 'amount');
        
        if (!hasAmount) {
            console.log('\n🔧 Adicionando coluna amount...');
            await connection.execute(`
                ALTER TABLE purple_coin_codes 
                ADD COLUMN amount INT NOT NULL DEFAULT 0 AFTER code
            `);
            console.log('✅ Coluna amount adicionada');
        }

        // Verificar se as outras colunas existem
        const hasMaxUses = columns.some(col => col.Field === 'max_uses');
        const hasRemainingUses = columns.some(col => col.Field === 'remaining_uses');
        const hasUsedBy = columns.some(col => col.Field === 'used_by');

        if (!hasMaxUses) {
            console.log('🔧 Adicionando coluna max_uses...');
            await connection.execute(`
                ALTER TABLE purple_coin_codes 
                ADD COLUMN max_uses INT NOT NULL DEFAULT 1
            `);
            console.log('✅ Coluna max_uses adicionada');
        }

        if (!hasRemainingUses) {
            console.log('🔧 Adicionando coluna remaining_uses...');
            await connection.execute(`
                ALTER TABLE purple_coin_codes 
                ADD COLUMN remaining_uses INT NOT NULL DEFAULT 1
            `);
            console.log('✅ Coluna remaining_uses adicionada');
        }

        if (!hasUsedBy) {
            console.log('🔧 Adicionando coluna used_by...');
            await connection.execute(`
                ALTER TABLE purple_coin_codes 
                ADD COLUMN used_by JSON DEFAULT NULL
            `);
            console.log('✅ Coluna used_by adicionada');
        }

        // Verificar estrutura final
        const [finalColumns] = await connection.execute("DESCRIBE purple_coin_codes");
        console.log('\n📋 Estrutura final da tabela:');
        finalColumns.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type}`);
        });

        // Verificar dados existentes
        const [codes] = await connection.execute("SELECT * FROM purple_coin_codes LIMIT 5");
        console.log('\n📊 Códigos existentes:');
        codes.forEach((code, index) => {
            console.log(`${index + 1}. ${code.code} - Amount: ${code.amount} - Source: ${code.source}`);
        });

        console.log('\n🎉 Tabela corrigida com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixCodesTable();
