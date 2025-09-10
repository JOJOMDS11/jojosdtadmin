const mysql = require('mysql2/promise');
const settings = require('../config/settings');

let pool = null;
let isConnected = false;

// Função para configurar o pool do MySQL
const configurePool = () => {
    if (pool) {
        return pool;
    }

    try {
        let config;

        // Se temos DATABASE_URI, use-a diretamente
        if (process.env.DATABASE_URI && process.env.DATABASE_URI.startsWith('mysql://')) {
            const dbUrl = new URL(process.env.DATABASE_URI);
            config = {
                host: dbUrl.hostname,
                port: dbUrl.port || 3306,
                user: dbUrl.username,
                password: dbUrl.password,
                database: dbUrl.pathname.slice(1), // Remove a barra inicial
                connectionLimit: 10,
                acquireTimeout: 60000,
                timeout: 60000,
                reconnect: true,
                charset: 'utf8mb4',
                multipleStatements: false
            };
        } else {
            // Usar variáveis individuais
            config = {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                connectionLimit: 10,
                acquireTimeout: 60000,
                timeout: 60000,
                reconnect: true,
                charset: 'utf8mb4',
                multipleStatements: false
            };
        }

        console.log('🔄 Configurando MySQL pool...');
        console.log(`📍 Host: ${config.host}:${config.port}`);
        console.log(`🗄️ Database: ${config.database}`);
        console.log(`👤 User: ${config.user}`);

        pool = mysql.createPool(config);

        console.log('✅ Pool MySQL configurado com sucesso!');
        return pool;
        console.log(`📡 Host: ${config.host}:${config.port}`);
        console.log(`🗃️ Database: ${config.database}`);

        pool = mysql.createPool(config);
        console.log('✅ MySQL pool configurado');

        return pool;
    } catch (error) {
        console.error('❌ Erro ao configurar pool MySQL:', error);
        throw error;
    }
};

// Inicializar pool ao carregar o módulo
try {
    configurePool();
} catch (error) {
    console.error('❌ Falha ao inicializar pool MySQL:', error);
    pool = null;
}

// Função para conectar e testar
const connectDB = async () => {
    if (!pool) {
        throw new Error('Pool MySQL não inicializado');
    }

    try {
        console.log('🔄 Testando conexão MySQL...');
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully (MySQL)');

        // Verificar/criar database
        let dbName;
        if (process.env.DATABASE_URI && process.env.DATABASE_URI.startsWith('mysql://')) {
            dbName = new URL(process.env.DATABASE_URI).pathname.slice(1);
        } else {
            dbName = process.env.DB_NAME;
        }

        try {
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
            console.log(`✅ Database "${dbName}" criada/verificada`);

            await connection.query(`USE \`${dbName}\``);
            console.log(`✅ Usando database "${dbName}"`);
        } catch (dbError) {
            console.log('⚠️ Erro ao criar/selecionar database:', dbError.message);
        }

        // Testar conexão
        const [result] = await connection.execute('SELECT NOW() as now');
        console.log('📅 Database time:', result[0].now);

        connection.release();
        isConnected = true;

        // Criar tabelas após conexão bem-sucedida
        await createTables();
    } catch (error) {
        console.error('❌ Database connection error:', error);
        isConnected = false;
        throw error;
    }
};

// Função para executar queries (compatível com MySQL)
const query = async (text, params) => {
    if (!pool || !isConnected) {
        throw new Error('Database não conectado');
    }

    const start = Date.now();
    try {
        const [rows] = await pool.execute(text, params);
        const duration = Date.now() - start;

        // Log apenas se não for uma query de índice
        if (!text.includes('CREATE INDEX')) {
            console.log('📊 Query executed:', {
                text: text.length > 100 ? text.substring(0, 100) + '...' : text,
                duration,
                rowCount: Array.isArray(rows) ? rows.length : rows.affectedRows
            });
        }

        return rows;
    } catch (error) {
        const duration = Date.now() - start;
        console.error('❌ Query error:', error);
        throw error;
    }
};

// Função para criar todas as tabelas
const createTables = async () => {
    try {
        console.log('🔧 Criando tabelas MySQL...');

        // Tabela players
        await query(`
            CREATE TABLE IF NOT EXISTS players (
                id INT AUTO_INCREMENT PRIMARY KEY,
                discord_id VARCHAR(50) UNIQUE NOT NULL,
                username VARCHAR(100) NOT NULL,
                team_name VARCHAR(100),
                level INT DEFAULT 1,
                experience INT DEFAULT 0,
                purple_coins INT DEFAULT 0,
                last_pack TIMESTAMP NULL,
                pack_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Tabela teams
        await query(`
            CREATE TABLE IF NOT EXISTS teams (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                owner_discord_id VARCHAR(50) NOT NULL,
                gk_card_id INT,
                vl_card_id INT,
                pv_card_id INT,
                wins INT DEFAULT 0,
                losses INT DEFAULT 0,
                goals_for INT DEFAULT 0,
                goals_against INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Tabela player_templates
        await query(`
            CREATE TABLE IF NOT EXISTS player_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                position ENUM('GK', 'VL', 'PV') NOT NULL,
                avatar TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela user_cards
        await query(`
            CREATE TABLE IF NOT EXISTS user_cards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                discord_id VARCHAR(50) NOT NULL,
                template_id INT NOT NULL,
                player_name VARCHAR(100) NOT NULL,
                position ENUM('GK', 'VL', 'PV') NOT NULL,
                avatar TEXT,
                rarity ENUM('Bagre', 'Médio', 'GOAT', 'Prime') NOT NULL,
                overall_rating INT NOT NULL,
                source VARCHAR(20) DEFAULT 'pack',
                stats JSON,
                is_custom BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (template_id) REFERENCES player_templates(id) ON DELETE CASCADE
            )
        `);

        // Índices para performance - MySQL sem IF NOT EXISTS
        const indices = [
            { name: 'idx_players_discord_id', sql: 'CREATE INDEX idx_players_discord_id ON players(discord_id)' },
            { name: 'idx_cards_player_id', sql: 'CREATE INDEX idx_cards_player_id ON user_cards(discord_id)' },
            { name: 'idx_cards_rarity', sql: 'CREATE INDEX idx_cards_rarity ON user_cards(rarity)' },
            { name: 'idx_teams_owner', sql: 'CREATE INDEX idx_teams_owner ON teams(owner_discord_id)' },
            { name: 'idx_cards_template', sql: 'CREATE INDEX idx_cards_template ON user_cards(template_id)' }
        ];

        for (const index of indices) {
            try {
                await query(index.sql);
            } catch (error) {
                // Silenciar erro se índice já existe
                if (error.code !== 'ER_DUP_KEYNAME' && !error.message.includes('Duplicate key name')) {
                    console.warn(`⚠️ Aviso ao criar índice ${index.name}: ${error.message}`);
                }
            }
        }

        console.log('✅ Tabelas MySQL criadas com sucesso!');

        // Verificar e adicionar colunas que podem estar faltando
        await updateTableStructure();

        // Criar templates padrão se não existirem (DESABILITADO - só admin cria)
        // await createDefaultTemplates();

    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error);
        throw error;
    }
};

// Função para atualizar estrutura de tabelas existentes
const updateTableStructure = async () => {
    try {
        // Verificar se colunas da tabela teams existem
        const teamColumns = [
            'ALTER TABLE teams ADD COLUMN gk_card_id INT',
            'ALTER TABLE teams ADD COLUMN vl_card_id INT',
            'ALTER TABLE teams ADD COLUMN pv_card_id INT',
            'ALTER TABLE teams ADD COLUMN wins INT DEFAULT 0',
            'ALTER TABLE teams ADD COLUMN losses INT DEFAULT 0',
            'ALTER TABLE teams ADD COLUMN goals_for INT DEFAULT 0',
            'ALTER TABLE teams ADD COLUMN goals_against INT DEFAULT 0'
        ];

        for (const alterSQL of teamColumns) {
            try {
                await query(alterSQL);
                console.log(`✅ Coluna adicionada: ${alterSQL.split(' ')[4]}`);
            } catch (error) {
                // Silenciar erro se coluna já existe
                if (error.code !== 'ER_DUP_FIELDNAME' && !error.message.includes('Duplicate column name')) {
                    console.warn(`⚠️ Aviso ao adicionar coluna: ${error.message}`);
                }
            }
        }

        // Adicionar colunas de stats individuais na tabela user_cards
        const cardStatsColumns = [
            'ALTER TABLE user_cards ADD COLUMN posicionamento INT DEFAULT 0',
            'ALTER TABLE user_cards ADD COLUMN saidaDeBola INT DEFAULT 0',
            'ALTER TABLE user_cards ADD COLUMN defesa INT DEFAULT 0',
            'ALTER TABLE user_cards ADD COLUMN drible INT DEFAULT 0',
            'ALTER TABLE user_cards ADD COLUMN passe INT DEFAULT 0',
            'ALTER TABLE user_cards ADD COLUMN finalizacao INT DEFAULT 0'
        ];

        for (const alterSQL of cardStatsColumns) {
            try {
                await query(alterSQL);
                console.log(`✅ Stats coluna adicionada: ${alterSQL.split(' ')[4]}`);
            } catch (error) {
                // Silenciar erro se coluna já existe
                if (error.code !== 'ER_DUP_FIELDNAME' && !error.message.includes('Duplicate column name')) {
                    console.warn(`⚠️ Aviso ao adicionar stats coluna: ${error.message}`);
                }
            }
        }

        // Atualizar enum de raridade
        try {
            await query("ALTER TABLE user_cards MODIFY rarity ENUM('Bagre', 'Médio', 'GOAT', 'Prime') NOT NULL");
            console.log('✅ Enum de raridade atualizado!');
        } catch (error) {
            console.warn(`⚠️ Aviso ao atualizar enum de raridade: ${error.message}`);
        }

        console.log('✅ Estrutura de tabelas atualizada!');
    } catch (error) {
        console.warn('⚠️ Erro ao atualizar estrutura:', error.message);
    }
};

// Função para criar templates padrão do HaxBall
const createDefaultTemplates = async () => {
    try {
        // Verificar se já existem templates
        const existingTemplates = await query('SELECT COUNT(*) as count FROM player_templates');

        if (existingTemplates[0].count > 0) {
            console.log('✅ Templates já existem no banco');
            return;
        }

        console.log('🎮 Criando templates padrão do HaxBall...');

        const defaultTemplates = [
            // Goleiros (GK)
            { name: 'Bruno Silva', position: 'GK', avatar: 'https://i.imgur.com/avatar1.png' },
            { name: 'Rafael Costa', position: 'GK', avatar: 'https://i.imgur.com/avatar2.png' },
            { name: 'Diego Santos', position: 'GK', avatar: 'https://i.imgur.com/avatar3.png' },
            { name: 'Lucas Mendes', position: 'GK', avatar: 'https://i.imgur.com/avatar4.png' },
            { name: 'Gabriel Rocha', position: 'GK', avatar: 'https://i.imgur.com/avatar5.png' },

            // Volantes (VL)
            { name: 'Carlos Lima', position: 'VL', avatar: 'https://i.imgur.com/avatar6.png' },
            { name: 'João Pedro', position: 'VL', avatar: 'https://i.imgur.com/avatar7.png' },
            { name: 'Felipe Azevedo', position: 'VL', avatar: 'https://i.imgur.com/avatar8.png' },
            { name: 'André Souza', position: 'VL', avatar: 'https://i.imgur.com/avatar9.png' },
            { name: 'Mateus Ferreira', position: 'VL', avatar: 'https://i.imgur.com/avatar10.png' },
            { name: 'Ricardo Nunes', position: 'VL', avatar: 'https://i.imgur.com/avatar11.png' },
            { name: 'Thiago Alves', position: 'VL', avatar: 'https://i.imgur.com/avatar12.png' },
            { name: 'Eduardo Campos', position: 'VL', avatar: 'https://i.imgur.com/avatar13.png' },
            { name: 'Vinicius Gomes', position: 'VL', avatar: 'https://i.imgur.com/avatar14.png' },
            { name: 'Gustavo Reis', position: 'VL', avatar: 'https://i.imgur.com/avatar15.png' },

            // Pivôs (PV)
            { name: 'Marcos Paulo', position: 'PV', avatar: 'https://i.imgur.com/avatar16.png' },
            { name: 'Leonardo Cruz', position: 'PV', avatar: 'https://i.imgur.com/avatar17.png' },
            { name: 'Douglas Pinto', position: 'PV', avatar: 'https://i.imgur.com/avatar18.png' },
            { name: 'Henrique Lopes', position: 'PV', avatar: 'https://i.imgur.com/avatar19.png' },
            { name: 'Caio Barbosa', position: 'PV', avatar: 'https://i.imgur.com/avatar20.png' },
            { name: 'Samuel Torres', position: 'PV', avatar: 'https://i.imgur.com/avatar21.png' },
            { name: 'Pedro Henrique', position: 'PV', avatar: 'https://i.imgur.com/avatar22.png' },
            { name: 'Daniel Oliveira', position: 'PV', avatar: 'https://i.imgur.com/avatar23.png' },
            { name: 'Rodrigo Martins', position: 'PV', avatar: 'https://i.imgur.com/avatar24.png' },
            { name: 'Murilo Castro', position: 'PV', avatar: 'https://i.imgur.com/avatar25.png' }
        ];

        for (const template of defaultTemplates) {
            await query(
                'INSERT INTO player_templates (name, position, avatar) VALUES (?, ?, ?)',
                [template.name, template.position, template.avatar]
            );
        }

        console.log(`✅ ${defaultTemplates.length} templates padrão criados com sucesso!`);
    } catch (error) {
        console.warn('⚠️ Erro ao criar templates padrão:', error.message);
    }
};

// Função para verificar se está conectado
const isDatabaseConnected = () => {
    return isConnected && pool !== null;
};

module.exports = {
    connectDB,
    query,
    createTables,
    pool,
    isDatabaseConnected
};