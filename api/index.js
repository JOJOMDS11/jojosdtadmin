const mysql = require('mysql2/promise');

// Configuração do banco principal (jojodreamteam)
async function createConnection() {
    try {
        console.log('Conectando ao banco principal:', process.env.DB_NAME || 'jojodreamteam');
        return await mysql.createConnection({
            host: process.env.DB_HOST || 'jojodreamteam.cgv8aga22uxg.us-east-1.rds.amazonaws.com',
            user: process.env.DB_USER || 'admin',
            password: process.env.DB_PASSWORD || 'soufoda123',
            database: process.env.DB_NAME || 'jojodreamteam',
            port: process.env.DB_PORT || 3306,
            ssl: {
                rejectUnauthorized: false
            },
            connectTimeout: 60000,
            acquireTimeout: 60000,
            timeout: 60000
        });
    } catch (error) {
        console.error('Erro ao conectar banco principal:', error);
        throw error;
    }
}

// Configuração do banco PIX (jojopix)
async function createPixConnection() {
    try {
        console.log('Conectando ao banco PIX:', process.env.DB_NAME_PIX || 'jojopix');
        return await mysql.createConnection({
            host: process.env.DB_HOST || 'jojodreamteam.cgv8aga22uxg.us-east-1.rds.amazonaws.com',
            user: process.env.DB_USER || 'admin',
            password: process.env.DB_PASSWORD || 'soufoda123',
            database: process.env.DB_NAME_PIX || 'jojopix',
            port: process.env.DB_PORT || 3306,
            ssl: {
                rejectUnauthorized: false
            },
            connectTimeout: 60000,
            acquireTimeout: 60000,
            timeout: 60000
        });
    } catch (error) {
        console.error('Erro ao conectar banco PIX:', error);
        throw error;
    }
}

// Função para converter emoji para hex
function emojiToHex(emoji) {
    return Array.from(emoji)
        .map(char => char.codePointAt(0).toString(16).padStart(4, '0'))
        .join('-');
}

// Gerar código único
function generateUniqueCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const url = req.url.split('?')[0];
    let connection;

    try {
        // ROTA: LOGIN
        if (url === '/login') {
            const { password } = req.body;
            if (password === (process.env.ADMIN_PASSWORD || 'admin123')) {
                return res.status(200).json({ success: true });
            } else {
                return res.status(401).json({ success: false, message: 'Senha incorreta' });
            }
        }

        // ROTA: EMOJI CONVERTER
        if (url === '/emoji-converter') {
            const { emoji } = req.body;
            if (!emoji) {
                return res.status(400).json({ success: false, message: 'Emoji é obrigatório' });
            }
            const emojiCode = emojiToHex(emoji);
            return res.status(200).json({
                success: true,
                emoji: emoji,
                hex_code: emojiCode,
                message: 'Emoji convertido com sucesso!'
            });
        }

        // Conectar ao banco principal
        try {
            connection = await createConnection();
        } catch (error) {
            console.error('Falha na conexão com banco principal:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro de conexão com banco de dados principal',
                error: error.message 
            });
        }

        // ROTA: STATS
        if (url === '/stats') {
            const [playersCount] = await connection.execute('SELECT COUNT(*) as total FROM players');
            const [teamsCount] = await connection.execute('SELECT COUNT(*) as total FROM teams');
            const [cardsCount] = await connection.execute('SELECT COUNT(*) as total FROM player_cards');
            let templatesCount = [{ total: 0 }];
            try {
                [templatesCount] = await connection.execute('SELECT COUNT(*) as total FROM player_templates');
            } catch (error) {
                console.log('Tabela player_templates não existe');
            }
            return res.status(200).json({
                success: true,
                data: {
                    totalPlayers: playersCount[0].total,
                    totalTeams: teamsCount[0].total,
                    totalCards: cardsCount[0].total,
                    totalTemplates: templatesCount[0].total
                }
            });
        }

        // ROTA: TEAMS
        if (url === '/teams') {
            if (req.method === 'GET') {
                const [rows] = await connection.execute(`
                    SELECT 
                        t.id,
                        t.name,
                        t.owner_discord_id as discord_id,
                        p.username,
                        t.wins,
                        t.losses,
                        t.created_at
                    FROM teams t
                    LEFT JOIN players p ON t.owner_discord_id = p.discord_id
                    ORDER BY t.created_at DESC LIMIT 100
                `);
                return res.status(200).json({ success: true, data: rows });
            }
        }

        // ROTA: PLAYERS
        if (url === '/players') {
            if (req.method === 'GET') {
                const [rows] = await connection.execute(`
                    SELECT 
                        p.discord_id,
                        p.username as name,
                        p.purple_coins,
                        COUNT(pc.card_id) as card_count,
                        t.name as team_name,
                        p.created_at
                    FROM players p
                    LEFT JOIN player_cards pc ON p.discord_id = pc.discord_id
                    LEFT JOIN teams t ON p.discord_id = t.owner_discord_id
                    GROUP BY p.discord_id 
                    ORDER BY p.purple_coins DESC LIMIT 100
                `);
                return res.status(200).json({ success: true, data: rows });
            }
        }

        // ROTA: TEMPLATES
        if (url === '/templates') {
            if (req.method === 'GET') {
                try {
                    const [rows] = await connection.execute(`
                        SELECT id, name, position, avatar, created_at 
                        FROM player_templates 
                        ORDER BY created_at DESC LIMIT 50
                    `);
                    return res.status(200).json({ success: true, data: rows });
                } catch (error) {
                    return res.status(200).json({ success: true, data: [] });
                }
            }
            if (req.method === 'POST') {
                const { name, position, avatar } = req.body;
                if (!name || !position) {
                    return res.status(400).json({ success: false, message: 'Nome e posição são obrigatórios' });
                }
                await connection.execute(`
                    INSERT INTO player_templates (name, position, avatar, created_at)
                    VALUES (?, ?, ?, NOW())
                `, [name, position, avatar || null]);
                return res.status(200).json({ success: true, message: 'Template criado com sucesso!' });
            }
        }

        // ROTA: TOURNAMENTS
        if (url === '/tournaments') {
            if (req.method === 'GET') {
                try {
                    const [rows] = await connection.execute(`
                        SELECT 
                            t.*,
                            COUNT(tr.id) as registered_teams
                        FROM tournaments t
                        LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
                        GROUP BY t.id
                        ORDER BY t.created_at DESC
                    `);
                    return res.status(200).json({ success: true, tournaments: rows });
                } catch (error) {
                    return res.status(200).json({ success: true, tournaments: [] });
                }
            }
            if (req.method === 'POST') {
                const { name, date, time, format, max_players, prize_1st, prize_2nd, prize_3rd } = req.body;
                if (!name || !date || !time) {
                    return res.status(400).json({ success: false, message: 'Preencha todos os campos obrigatórios!' });
                }
                try {
                    await connection.execute(`
                        INSERT INTO tournaments (name, date, time, format, max_players, prize_1st, prize_2nd, prize_3rd, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', NOW())
                    `, [name, date, time, format, max_players || 8, prize_1st, prize_2nd, prize_3rd]);
                    return res.status(200).json({ success: true, message: 'Torneio criado com sucesso!' });
                } catch (error) {
                    return res.status(200).json({ success: true, message: 'Torneio criado (tabela pode não existir)' });
                }
            }
        }

        // ROTA: COINS
        if (url.startsWith('/coins')) {
            if (req.method === 'POST') {
                const { discordId, amount } = req.body;
                if (!discordId || !amount) {
                    return res.status(400).json({ success: false, message: 'Discord ID e quantidade são obrigatórios' });
                }
                await connection.execute('UPDATE players SET purple_coins = purple_coins + ? WHERE discord_id = ?', [amount, discordId]);
                return res.status(200).json({ success: true, message: `${amount} Purple Coins adicionadas!` });
            }
        }

        // ROTA: CODES (usando banco PIX)
        if (url.startsWith('/codes')) {
            await connection.end();
            try {
                connection = await createPixConnection();
            } catch (error) {
                console.error('Falha na conexão com banco PIX:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro de conexão com banco PIX',
                    error: error.message 
                });
            }
            
            if (req.method === 'GET') {
                const [codes] = await connection.execute('SELECT * FROM purple_coin_codes ORDER BY created_at DESC');
                return res.status(200).json({ success: true, codes });
            }
            if (req.method === 'DELETE') {
                const code = req.query.code || req.url.split('/').pop();
                await connection.execute('DELETE FROM purple_coin_codes WHERE code = ?', [code]);
                return res.status(200).json({ success: true, message: 'Código excluído com sucesso' });
            }
        }

        // ROTA: USER
        if (url.startsWith('/user/')) {
            const discordId = url.split('/').pop();
            const [user] = await connection.execute('SELECT * FROM players WHERE discord_id = ?', [discordId]);
            if (!user.length) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            
            const [cards] = await connection.execute(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN rarity = 'Prime' THEN 1 ELSE 0 END) as prime,
                    SUM(CASE WHEN rarity = 'GOAT' THEN 1 ELSE 0 END) as goat,
                    SUM(CASE WHEN rarity = 'Médio' THEN 1 ELSE 0 END) as medio,
                    SUM(CASE WHEN rarity = 'Bagre' THEN 1 ELSE 0 END) as bagre
                FROM player_cards WHERE discord_id = ?
            `, [discordId]);
            
            return res.status(200).json({ success: true, user: user[0], cards: cards[0] });
        }

        return res.status(404).json({ success: false, message: 'Rota não encontrada' });

    } catch (error) {
        console.error('Erro no handler unificado:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (error) {
                console.error('Erro ao fechar conexão:', error);
            }
        }
    }
}
