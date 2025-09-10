// Conexão MySQL otimizada especificamente para Vercel Serverless
const mysql = require('mysql2/promise');

// Pool global para reutilização entre invocações
let globalPool = null;

function createVercelPool() {
    if (!globalPool) {
        console.log('🔧 Criando pool MySQL otimizado para Vercel...');
        
        globalPool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            // Configurações otimizadas para Vercel Serverless
            connectionLimit: 1, // Limite baixo para serverless
            waitForConnections: true,
            queueLimit: 0,
            acquireTimeout: 30000, // 30s
            timeout: 30000, // 30s
            idleTimeout: 900000, // 15min
            ssl: {
                rejectUnauthorized: false
            },
            charset: 'utf8mb4',
            // Configurações específicas para serverless
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        });
        
        console.log('✅ Pool Vercel criado!');
    }
    return globalPool;
}

// Função para executar queries com retry automático
async function executeQuery(sql, params = []) {
    const maxRetries = 2;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const pool = createVercelPool();
            console.log(`🔍 [Tentativa ${attempt}] Executando: ${sql.substring(0, 50)}...`);
            
            const [rows] = await pool.execute(sql, params);
            console.log(`✅ Query executada! ${rows.length} resultados`);
            return rows;
            
        } catch (error) {
            lastError = error;
            console.error(`❌ [Tentativa ${attempt}] Erro:`, error.message);
            
            // Se não é o último attempt, aguarda um pouco antes de tentar novamente
            if (attempt < maxRetries) {
                console.log('🔄 Tentando novamente em 1s...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    throw lastError;
}

// Função de teste de conexão otimizada
async function testConnection() {
    try {
        console.log('🧪 Testando conexão...');
        await executeQuery('SELECT 1 as test');
        console.log('✅ Teste de conexão bem-sucedido!');
        return true;
    } catch (error) {
        console.error('❌ Falha no teste de conexão:', error.message);
        return false;
    }
}

// Função para fechar pool (útil para cleanup)
async function closePool() {
    if (globalPool) {
        try {
            await globalPool.end();
            globalPool = null;
            console.log('✅ Pool fechado');
        } catch (error) {
            console.error('❌ Erro ao fechar pool:', error);
        }
    }
}

module.exports = {
    executeQuery,
    testConnection,
    closePool,
    // Alias para compatibilidade
    query: executeQuery
};
