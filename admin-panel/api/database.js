// Solução alternativa para conexão MySQL no Vercel
const mysql = require('mysql2/promise');

// Pool de conexões com configurações otimizadas para Vercel
let pool = null;

function createPool() {
    if (!pool) {
        console.log('🔧 Criando pool de conexões MySQL...');
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000,
            ssl: {
                rejectUnauthorized: false
            },
            reconnect: true,
            charset: 'utf8mb4'
        });

        console.log('✅ Pool de conexões criado!');
    }
    return pool;
}

// Função para executar queries
async function executeQuery(sql, params = []) {
    const connection = createPool();

    try {
        console.log(`🔍 Executando query: ${sql.substring(0, 50)}...`);
        const [rows] = await connection.execute(sql, params);
        console.log(`✅ Query executada com sucesso! ${rows.length} resultados`);
        return rows;
    } catch (error) {
        console.error('❌ Erro na query:', error.message);
        throw error;
    }
}

// Teste de conectividade
async function testConnection() {
    try {
        const result = await executeQuery('SELECT 1 as test');
        console.log('✅ Teste de conexão bem-sucedido!');
        return true;
    } catch (error) {
        console.error('❌ Falha no teste de conexão:', error.message);
        return false;
    }
}

module.exports = {
    executeQuery,
    testConnection
};
