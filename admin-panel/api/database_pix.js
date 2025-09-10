// Conexão separada para o banco jojopix
const mysql = require('mysql2/promise');

let pool = null;

function createPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME_PIX,
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000,
            ssl: { rejectUnauthorized: false },
            reconnect: true,
            charset: 'utf8mb4'
        });
    }
    return pool;
}

async function executeQuery(sql, params = []) {
    const connection = createPool();
    try {
        const [rows] = await connection.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('❌ Erro na query jojopix:', error.message);
        throw error;
    }
}

async function testConnection() {
    try {
        await executeQuery('SELECT 1 as test');
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    executeQuery,
    testConnection
};
