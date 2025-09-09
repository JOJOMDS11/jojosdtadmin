require('dotenv').config();
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
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        console.log('✅ Conectado ao banco de dados MySQL com sucesso!');
        return connection;
    } catch (error) {
        console.error('❌ Erro ao conectar ao banco de dados:', error.message);
        throw error;
    }
}

// Função query para executar consultas SQL
async function query(sql, params = []) {
    try {
        const conn = await createConnection();
        const [rows] = await conn.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('❌ Erro ao executar query:', error.message);
        throw error;
    }
}

// Função para testar a conexão
async function testConnection() {
    try {
        const conn = await createConnection();
        await conn.ping();
        console.log('✅ Teste de conexão com o banco de dados bem-sucedido!');
        return true;
    } catch (error) {
        console.error('❌ Falha no teste de conexão:', error.message);
        return false;
    }
}

// Função para fechar a conexão
async function closeConnection() {
    if (connection) {
        try {
            await connection.end();
            connection = null;
            console.log('✅ Conexão com banco de dados fechada');
        } catch (error) {
            console.error('❌ Erro ao fechar conexão:', error);
        }
    }
}

// Função para buscar jogadores por discord_id corretamente
async function getPlayerByDiscordId(discordId) {
    const [rows] = await connection.execute('SELECT * FROM players WHERE discord_id = ?', [discordId]);
    return rows;
}

// Função para buscar cartas do usuário pelo discord_id
async function getUserCardsByDiscordId(discordId) {
    const [user] = await connection.execute('SELECT id FROM players WHERE discord_id = ?', [discordId]);
    if (!user[0]) return [];
    const userId = user[0].id;
    const [cards] = await connection.execute('SELECT * FROM user_cards WHERE discord_id = ?', [userId]);
    return cards;
}

// Função para buscar todos os templates corretamente
async function getAllTemplates() {
    const [templates] = await connection.execute('SELECT * FROM player_templates ORDER BY created_at DESC');
    return templates;
}

module.exports = {
    query,
    testConnection,
    closeConnection,
    getPlayerByDiscordId,
    getUserCardsByDiscordId,
    getAllTemplates
};
