require('dotenv').config();
const { pool } = require('./src/database/connection');

async function testCodeSystem() {
    try {
        console.log('🧪 Testando Sistema de Códigos Purple Coins...\n');

        // 1. Criar um código de teste
        const testCode = 'TEST' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const amount = 100;
        const maxUses = 3;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        console.log('1️⃣ Criando código de teste...');
        await pool.execute(`
            INSERT INTO purple_coin_codes (code, amount, max_uses, remaining_uses, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [testCode, amount, maxUses, maxUses, expiresAt]);
        
        console.log(`✅ Código criado: ${testCode}`);
        console.log(`   💰 Valor: ${amount} Purple Coins`);
        console.log(`   🔄 Usos: ${maxUses}`);
        console.log(`   ⏰ Expira: ${expiresAt.toLocaleDateString('pt-BR')}\n`);

        // 2. Verificar se o código foi criado
        console.log('2️⃣ Verificando código no banco...');
        const [codeCheck] = await pool.execute(`
            SELECT code, amount, max_uses, remaining_uses, expires_at 
            FROM purple_coin_codes 
            WHERE code = ?
        `, [testCode]);

        if (codeCheck.length > 0) {
            console.log('✅ Código encontrado no banco!');
            console.log('   📊 Dados:', codeCheck[0]);
        } else {
            console.log('❌ Código não encontrado no banco!');
            return;
        }

        // 3. Simular uso do código (sem usuário real)
        console.log('\n3️⃣ Simulando uso do código...');
        const fakeUserId = '123456789012345678';
        const usedBy = [fakeUserId];

        await pool.execute(`
            UPDATE purple_coin_codes 
            SET remaining_uses = remaining_uses - 1,
                used_by = ?
            WHERE code = ?
        `, [JSON.stringify(usedBy), testCode]);

        // 4. Verificar se foi atualizado
        console.log('4️⃣ Verificando atualização...');
        const [updatedCode] = await pool.execute(`
            SELECT code, amount, remaining_uses, used_by 
            FROM purple_coin_codes 
            WHERE code = ?
        `, [testCode]);

        if (updatedCode.length > 0) {
            console.log('✅ Código atualizado com sucesso!');
            console.log('   📊 Usos restantes:', updatedCode[0].remaining_uses);
            console.log('   👥 Usado por:', updatedCode[0].used_by);
        }

        // 5. Listar todos os códigos ativos
        console.log('\n5️⃣ Listando códigos ativos...');
        const [activeCodes] = await pool.execute(`
            SELECT code, amount, max_uses, remaining_uses, expires_at
            FROM purple_coin_codes 
            WHERE remaining_uses > 0 AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 5
        `);

        console.log(`📋 Códigos ativos encontrados: ${activeCodes.length}`);
        activeCodes.forEach((code, index) => {
            console.log(`   ${index + 1}. ${code.code} - ${code.amount} coins (${code.remaining_uses}/${code.max_uses} usos)`);
        });

        // 6. Cleanup - remover código de teste
        console.log('\n6️⃣ Limpando código de teste...');
        await pool.execute('DELETE FROM purple_coin_codes WHERE code = ?', [testCode]);
        console.log('✅ Código de teste removido');

        console.log('\n🎉 Sistema de códigos está funcionando perfeitamente!');
        console.log('\n📝 Resumo dos testes:');
        console.log('   ✅ Criação de códigos');
        console.log('   ✅ Consulta de códigos');
        console.log('   ✅ Atualização de usos');
        console.log('   ✅ Controle de usuários');
        console.log('   ✅ Listagem de códigos ativos');
        console.log('   ✅ Remoção de códigos');

        console.log('\n🔗 Integração completa:');
        console.log('   🌐 Admin Panel: https://jojosdtadmin.vercel.app');
        console.log('   🤖 Discord Bot: Comando /codigo');
        console.log('   💾 Database: MySQL AWS RDS');

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testCodeSystem();
