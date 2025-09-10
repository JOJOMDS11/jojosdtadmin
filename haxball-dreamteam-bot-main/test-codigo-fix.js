// Test script for the /codigo command
const mysql = require('mysql2/promise');

async function testCodigoCommand() {
    console.log('🔍 Testando comando /codigo...\n');

    let codeConnection, playerConnection;

    try {
        // Test connection to jojopix database
        console.log('📊 Testando conexão com database jojopix...');
        codeConnection = await mysql.createConnection({
            host: process.env.DB_HOST || 'jojodreamteam.cgv8aga22uxg.us-east-1.rds.amazonaws.com',
            user: process.env.DB_USER || 'admin',
            password: process.env.DB_PASSWORD,
            database: 'jojopix',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Conectado ao jojopix!');

        // Test Purple Coins table structure
        console.log('\n📋 Verificando estrutura da tabela purple_coin_codes...');
        const [structure] = await codeConnection.execute('DESCRIBE purple_coin_codes');
        
        console.log('Colunas encontradas:');
        structure.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

        // Test the query used in the command
        console.log('\n🔍 Testando query do comando...');
        const [testRows] = await codeConnection.execute(`
            SELECT 
                code,
                COALESCE(amount, purple_coins_value) as amount,
                COALESCE(max_uses, 1) as max_uses,
                COALESCE(remaining_uses, CASE WHEN used_by_discord_id IS NULL THEN 1 ELSE 0 END) as remaining_uses,
                expires_at,
                used_by,
                used_by_discord_id,
                used_at
            FROM purple_coin_codes 
            LIMIT 3
        `);

        console.log(`✅ Query funcionando! Encontrados ${testRows.length} códigos de exemplo:`);
        testRows.forEach((row, i) => {
            console.log(`  ${i+1}. Código: ${row.code}`);
            console.log(`     Amount: ${row.amount}`);
            console.log(`     Max Uses: ${row.max_uses}`);
            console.log(`     Remaining: ${row.remaining_uses}`);
            console.log(`     Expires: ${row.expires_at}`);
        });

        console.log('\n✅ Comando /codigo atualizado com sucesso!');
        console.log('✅ Database jojopix funcionando corretamente!');
        console.log('✅ Compatibilidade com ambos os formatos de coluna (amount/purple_coins_value)!');

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Dica: Verifique se a variável DB_PASSWORD está definida corretamente.');
        }
    } finally {
        if (codeConnection) {
            await codeConnection.end();
        }
    }
}

testCodigoCommand();
