const mysql = require('mysql2/promise');

let connection = null;

// Função para criar a conexão
async function createConnection() {
    if (connection) {
        try {
            // Testa se a conexão ainda está ativa
            await connection.ping();
            return connection;
        } catch (error) {
            console.log('Conexão perdida, reconectando...');
            connection = null;
        }
    }

    try {
        console.log('Tentando conectar ao banco de dados...');
        console.log('DB_HOST:', process.env.DB_HOST);
        console.log('DB_USER:', process.env.DB_USER);
        console.log('DB_NAME:', process.env.DB_NAME);
        console.log('DB_PORT:', process.env.DB_PORT);

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'jojodreamteam.cgv8aga22uxg.us-east-1.rds.amazonaws.com',
            user: process.env.DB_USER || 'jojodreamteam',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'jojodreamteam',
            port: process.env.DB_PORT || 3306,
            ssl: {
                rejectUnauthorized: false
            },
            connectTimeout: 60000,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        });

        console.log('Conectado ao banco de dados MySQL com sucesso!');
        return connection;
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        throw error;
    }
}

// Objeto que simula uma conexão para manter compatibilidade
const connectionWrapper = {
    async execute(query, params = []) {
        const conn = await createConnection();
        return conn.execute(query, params);
    },

    async query(query, params = []) {
        const conn = await createConnection();
        return conn.query(query, params);
    },

    async ping() {
        const conn = await createConnection();
        return conn.ping();
    },

    async end() {
        if (connection) {
            await connection.end();
            connection = null;
        }
    }
};

module.exports = connectionWrapper;
